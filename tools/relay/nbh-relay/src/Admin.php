<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The admin page (GET /admin) and its JSON calls (/api/admin/...).
 *
 * Signing in sets one cookie: __Secure-nbh_admin, a 32-byte random token (kept only as a hash), HttpOnly,
 * Secure, SameSite=Strict, scoped to the relay's folder, ending ADMIN_SESSION_MINUTES after the last use and
 * at most 12 hours after signing in. Every call but signing in also needs the X-CSRF-Token header, a token
 * derived from the cookie that only the sign-in answer carries (never the admin page's HTML, which a script elsewhere
 * on the same website could fetch with the cookie): the tab that signed in keeps it in its sessionStorage, and another
 * tab is asked for the password again. Every POST is also origin-checked (App).
 *
 * Wrong passwords pause signing in, per internet address and for everyone together. A browser that has
 * signed in here before carries a second cookie, __Secure-nbh_device (signed with the pepper, 180 days), and
 * the pause for everyone does not apply to it (its own address and device limits do), so wrong passwords
 * from elsewhere cannot lock the BCBA out of their own devices.
 *
 * Creating a passcode asks for the password again once REAUTH_MINUTES have passed since it was last typed:
 * a script on another page of the same site could otherwise use a signed-in admin's cookie to make one.
 *
 *   POST /api/admin/password-hash {password}   only until a working admin password is set: the line for config.php
 *   POST /api/admin/login {password}           -> {ok, csrf} + cookie
 *   POST /api/admin/logout
 *   GET  /api/admin/state                      -> unused codes, active sessions, limits
 *   POST /api/admin/codes {label?, hours?, password?}   -> {code, id, label, created, expires}   (the code is shown once)
 *   POST /api/admin/codes/revoke {id}
 *   POST /api/admin/sessions/revoke {id}
 *   POST /api/admin/sessions/revoke-all
 *   POST /api/admin/unlock                     forget the wrong-passcode and wrong-password counts (lifts a pause)
 */
final class Admin
{
    public const COOKIE = '__Secure-nbh_admin';
    public const DEVICE_COOKIE = '__Secure-nbh_device';
    public const DEVICE_DAYS = 180;
    public const MAX_SIGN_IN_HOURS = 12;
    public const REAUTH_MINUTES = 10;
    public const LABEL_MAX = 60;
    public const MAX_UNUSED_CODES = 500;
    public const HASH_HELPER_PER_WINDOW = 10;
    public const HASH_HELPER_ALL_PER_WINDOW = 30;

    public function __construct(private App $app)
    {
    }

    // ------------------------------------------------------------------ the page

    public function page(Request $req): Response
    {
        $nonce = rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
        if (!$this->app->coreReady() || !$this->app->config->hashOk()) {
            $showHelper = $this->app->coreReady() && !$this->app->config->hashOk();
            return Response::html(200, Pages::setup($this->app->checklist($req), $this->app->config->warnings, $showHelper, $req->linkBase(), $nonce), $nonce);
        }
        $s = $this->session($req);
        if ($s === null) {
            return Response::html(200, Pages::signIn($req->linkBase(), $nonce), $nonce);
        }
        $res = Response::html(200, Pages::dashboard($req->linkBase(), $this->app->config->warnings, $nonce), $nonce);
        $res->cookies[] = $this->cookie($req, $s['token'], $s['expires_at'] - $this->app->now);
        return $res;
    }

    // ------------------------------------------------------------------ first-run helper

    /**
     * @param array<string,mixed> $body
     */
    public function passwordHash(Request $req, array $body): Response
    {
        if ($this->app->config->hashOk()) {
            return Response::error(404, 'not_found', 'There is nothing here.');   // only until a working admin password is set
        }
        $pw = $body['password'] ?? null;
        if (!is_string($pw)) {
            return Response::error(400, 'bad_request', 'Send the new password as text.');
        }
        $problem = Crypto::passwordProblem($pw);
        if ($problem !== null) {
            return Response::error(400, 'weak_password', $problem);
        }
        $db = $this->app->store();
        $bucket = 'hash-helper:ip:' . $this->app->ipKey($req);
        $window = $this->app->config->int('FAIL_WINDOW_MINUTES') * 60;
        // each hash is costly (Argon2id), so it is limited per address and for everyone together
        $wait = $db->write(function () use ($db, $bucket, $window): int {
            $rl = new RateLimiter($db, $this->app->now);
            $wait = max($rl->wait($bucket, $window, self::HASH_HELPER_PER_WINDOW), $rl->wait('hash-helper:all', $window, self::HASH_HELPER_ALL_PER_WINDOW));
            if ($wait === 0) {
                $rl->hit($bucket);
                $rl->hit('hash-helper:all');
            }
            return $wait;
        });
        if ($wait > 0) {
            return Response::error(429, 'rate_limited', 'Too many tries. Wait, then try again.', ['retry_after' => $wait]);
        }
        return Response::json(200, ['line' => Crypto::hashLine(Crypto::hashPassword($pw))]);
    }

    // ------------------------------------------------------------------ signing in and out

    /**
     * @param array<string,mixed> $body
     */
    public function login(Request $req, array $body): Response
    {
        $pw = $body['password'] ?? null;
        if (!is_string($pw) || $pw === '' || strlen($pw) > 1024) {
            return Response::error(400, 'bad_request', 'Enter the admin password.');
        }
        $cfg = $this->app->config;
        $db = $this->app->store();
        $now = $this->app->now;
        $device = $this->device($req);

        // one transaction, the password check included, so parallel guesses cannot slip past the limit
        return $db->write(function () use ($db, $req, $pw, $cfg, $now, $device): Response {
            $bad = $this->passwordCheck($req, $pw, $device !== null, $device === null ? [] : ['login-fail:dev:' . $device], 'admin_sign_in_failed');
            if ($bad !== null) {
                return $bad;
            }
            $token = Crypto::token();
            $expires = min($now + self::MAX_SIGN_IN_HOURS * 3600, $now + $cfg->int('ADMIN_SESSION_MINUTES') * 60);
            $db->run('INSERT INTO admin_sessions (token_hash, created_at, expires_at, auth_at) VALUES (?, ?, ?, ?)', [$this->app->crypto->hash('admin', $token), $now, $expires, $now]);
            $db->run('DELETE FROM admin_sessions WHERE expires_at <= ?', [$now]);
            Log::event('admin_signed_in');
            $res = Response::json(200, ['ok' => true, 'csrf' => $this->app->crypto->csrf($token), 'expires' => App::iso($expires)]);
            $res->cookies[] = $this->cookie($req, $token, $expires - $now);
            $res->cookies[] = $this->deviceCookie($req);
            return $res;
        });
    }

    /**
     * The admin password check with its limits, inside a write transaction: null when $pw is the password,
     * else the answer to give (429 while paused, 401 when wrong; a wrong one is counted). $trusted (a browser
     * that has signed in here before, or a signed-in session) skips the pause for everyone, not the others.
     *
     * @param list<string> $extra more buckets to count in and to check, with the per-address limit
     */
    private function passwordCheck(Request $req, #[\SensitiveParameter] string $pw, bool $trusted, array $extra, string $event): ?Response
    {
        $cfg = $this->app->config;
        $window = $cfg->int('FAIL_WINDOW_MINUTES') * 60;
        $rl = new RateLimiter($this->app->store(), $this->app->now);
        $buckets = array_merge(['login-fail:ip:' . $this->app->ipKey($req)], $extra);
        $wait = 0;
        foreach ($buckets as $b) {
            $wait = max($wait, $rl->wait($b, $window, $cfg->int('LOGIN_FAILS_PER_IP')));
        }
        if (!$trusted) {
            $wait = max($wait, $rl->wait('login-fail:all', $window, $cfg->int('LOGIN_FAILS_ALL')));
        }
        if ($wait > 0) {
            Log::event('admin_sign_in_paused', ['wait' => $wait]);
            return Response::error(429, 'rate_limited', 'Too many wrong passwords. Wait, then try again.', ['retry_after' => $wait]);
        }
        if (!password_verify($pw, $cfg->str('ADMIN_PASSWORD_HASH'))) {
            foreach ($buckets as $b) {
                $rl->hit($b);
            }
            $rl->hit('login-fail:all');
            Log::event($event);
            return Response::error(401, 'wrong_password', 'That is not the admin password.');
        }
        return null;
    }

    /**
     * This browser's id when it has signed in here before (its device cookie is signed with the pepper and
     * at most DEVICE_DAYS old), else null. The id names its bucket for wrong passwords; it is not kept.
     */
    private function device(Request $req): ?string
    {
        if (!preg_match('/^(\d{10})\.([A-Za-z0-9_-]{22})\.([0-9a-f]{64})$/', $req->cookie(self::DEVICE_COOKIE), $m)) {
            return null;
        }
        $t = (int) $m[1];
        $now = $this->app->now;
        if ($t > $now + 300 || $t < $now - self::DEVICE_DAYS * 86400) {
            return null;
        }
        if (!hash_equals($this->app->crypto->hash('device', $m[1] . '.' . $m[2]), $m[3])) {
            return null;
        }
        return substr($this->app->crypto->hash('device-id', $m[2]), 0, 32);
    }

    /** A new device cookie, given at every sign-in: "issued.random.signature". */
    private function deviceCookie(Request $req): string
    {
        $t = (string) $this->app->now;
        $id = rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '=');
        $value = $t . '.' . $id . '.' . $this->app->crypto->hash('device', $t . '.' . $id);
        return self::DEVICE_COOKIE . '=' . $value . '; Path=' . self::cookiePath($req) . '; Max-Age=' . (self::DEVICE_DAYS * 86400) . '; Secure; HttpOnly; SameSite=Strict';
    }

    /**
     * @param array<string,mixed> $body
     */
    public function logout(Request $req, array $body): Response
    {
        $s = $this->session($req);
        if ($s !== null) {
            if (!$this->app->crypto->csrfMatches($s['token'], $req->header('x-csrf-token'))) {
                return Response::error(403, 'csrf', 'Reload the admin page and try again.');
            }
            $this->app->store()->run('DELETE FROM admin_sessions WHERE id = ?', [$s['id']]);
        }
        $res = Response::json(200, ['ok' => true]);
        $res->cookies[] = $this->cookie($req, '', 0);
        return $res;
    }

    // ------------------------------------------------------------------ the signed-in calls

    /**
     * @param array<string,mixed> $body
     */
    public function state(Request $req, array $body): Response
    {
        return $this->guarded($req, function (array $s): Response {
            $db = $this->app->store();
            $cfg = $this->app->config;
            $now = $this->app->now;
            $rl = new RateLimiter($db, $now);
            $window = $cfg->int('FAIL_WINDOW_MINUTES') * 60;
            $codes = array_map(static fn (array $r): array => [
                'id' => (int) $r['id'],
                'label' => (string) $r['label'],
                'created' => (int) $r['created_at'],
                'expires' => (int) $r['expires_at'],
            ], $db->all('SELECT id, label, created_at, expires_at FROM codes WHERE expires_at > ? ORDER BY id DESC LIMIT 200', [$now]));
            $sessions = array_map(static fn (array $r): array => [
                'id' => (int) $r['id'],
                'label' => (string) $r['label'],
                'created' => (int) $r['created_at'],
                'expires' => (int) $r['expires_at'],
                'last_used' => $r['last_used_at'] === null ? null : (int) $r['last_used_at'],
                'rewrites' => (int) $r['requests'],
            ], $db->all('SELECT id, label, created_at, expires_at, last_used_at, requests FROM sessions WHERE expires_at > ? ORDER BY id DESC LIMIT 200', [$now]));
            return Response::json(200, [
                'now' => $now,
                'codes' => $codes,
                'sessions' => $sessions,
                'api_key_set' => $cfg->keyOk(),
                'rewrites_today' => $rl->count('rewrite:all', 86400),
                'wrong_passcodes' => $rl->count('redeem-fail:all', $window),
                'passcode_pause' => $rl->wait('redeem-fail:all', $window, $cfg->int('REDEEM_FAILS_ALL')),
                'wrong_passwords' => $rl->count('login-fail:all', $window),
                'sign_in_pause' => $rl->wait('login-fail:all', $window, $cfg->int('LOGIN_FAILS_ALL')),
                'password_after' => max(0, $s['auth_at'] + self::REAUTH_MINUTES * 60 - $now),
                'limits' => [
                    'session_hours' => $cfg->int('SESSION_HOURS'),
                    'code_hours' => $cfg->int('CODE_HOURS'),
                    'max_code_hours' => $cfg->int('MAX_CODE_HOURS'),
                    'rewrites_per_session' => $cfg->int('MAX_REQUESTS_PER_SESSION'),
                    'rewrites_per_minute' => $cfg->int('REWRITES_PER_MINUTE'),
                    'rewrites_per_day' => $cfg->int('REWRITES_PER_DAY'),
                    'max_chars' => $cfg->int('MAX_CHARS'),
                    'fail_window_minutes' => $cfg->int('FAIL_WINDOW_MINUTES'),
                    'effort' => $cfg->str('EFFORT'),
                ],
            ]);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function createCode(Request $req, array $body): Response
    {
        return $this->guarded($req, function (array $s) use ($req, $body): Response {
            $cfg = $this->app->config;
            $label = self::label($body['label'] ?? '');
            if ($label === null) {
                return Response::error(400, 'bad_request', 'The label can have at most ' . self::LABEL_MAX . ' characters.');
            }
            $hours = $body['hours'] ?? $cfg->int('CODE_HOURS');
            if (is_string($hours) && preg_match('/^\d{1,4}$/', $hours)) {
                $hours = (int) $hours;
            }
            if (!is_int($hours) || $hours < 1 || $hours > $cfg->int('MAX_CODE_HOURS')) {
                return Response::error(400, 'bad_request', 'A passcode can stay usable from 1 to ' . $cfg->int('MAX_CODE_HOURS') . ' hours.');
            }
            $db = $this->app->store();
            $now = $this->app->now;
            if ($now - $s['auth_at'] > self::REAUTH_MINUTES * 60) {
                $pw = $body['password'] ?? null;
                if (!is_string($pw) || $pw === '' || strlen($pw) > 1024) {
                    return Response::error(403, 'password_needed', 'Enter the admin password again to create a passcode.');
                }
                $device = $this->device($req);
                $extra = array_merge(['login-fail:adm:' . $s['id']], $device === null ? [] : ['login-fail:dev:' . $device]);
                $bad = $db->write(function () use ($db, $req, $pw, $extra, $now, $s): ?Response {
                    $bad = $this->passwordCheck($req, $pw, true, $extra, 'admin_reauth_failed');
                    if ($bad === null) {
                        $db->run('UPDATE admin_sessions SET auth_at = ? WHERE id = ?', [$now, $s['id']]);
                    }
                    return $bad;
                });
                if ($bad !== null) {
                    return $bad;
                }
            }
            $made = $db->write(function () use ($db, $label, $hours, $now): ?array {
                $n = (int) ($db->one('SELECT COUNT(*) AS n FROM codes WHERE expires_at > ?', [$now])['n'] ?? 0);
                if ($n >= self::MAX_UNUSED_CODES) {
                    return null;
                }
                for ($try = 0; $try < 5; $try++) {
                    $code = Crypto::newCode();
                    $hash = $this->app->crypto->hash('code', $code);
                    if ($db->one('SELECT id FROM codes WHERE code_hash = ?', [$hash]) !== null) {
                        continue;
                    }
                    $db->run('INSERT INTO codes (code_hash, label, created_at, expires_at) VALUES (?, ?, ?, ?)', [$hash, $label, $now, $now + $hours * 3600]);
                    return ['code' => Crypto::formatCode($code), 'id' => $db->lastId(), 'label' => $label, 'created' => $now, 'expires' => $now + $hours * 3600];
                }
                throw new \RuntimeException('No new passcode could be made.');
            });
            if ($made === null) {
                return Response::error(409, 'too_many_codes', 'There are ' . self::MAX_UNUSED_CODES . ' unused passcodes. Revoke some first.');
            }
            Log::event('passcode_created', ['id' => $made['id'], 'hours' => $hours]);
            return Response::json(201, $made);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function revokeCode(Request $req, array $body): Response
    {
        return $this->guarded($req, function () use ($body): Response {
            $id = self::id($body['id'] ?? null);
            if ($id === null) {
                return Response::error(400, 'bad_request', 'Say which passcode.');
            }
            $n = $this->app->store()->run('DELETE FROM codes WHERE id = ?', [$id]);
            return Response::json(200, ['ok' => true, 'removed' => $n]);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function revokeSession(Request $req, array $body): Response
    {
        return $this->guarded($req, function () use ($body): Response {
            $id = self::id($body['id'] ?? null);
            if ($id === null) {
                return Response::error(400, 'bad_request', 'Say which session.');
            }
            $n = $this->app->store()->run('DELETE FROM sessions WHERE id = ?', [$id]);
            Log::event('session_ended_by_admin', ['session' => $id]);
            return Response::json(200, ['ok' => true, 'removed' => $n]);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function revokeAllSessions(Request $req, array $body): Response
    {
        return $this->guarded($req, function (): Response {
            $n = $this->app->store()->run('DELETE FROM sessions');
            Log::event('all_sessions_ended_by_admin', ['count' => $n]);
            return Response::json(200, ['ok' => true, 'removed' => $n]);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function unlock(Request $req, array $body): Response
    {
        return $this->guarded($req, function (): Response {
            $rl = new RateLimiter($this->app->store(), $this->app->now);
            $n = $rl->clear('redeem-fail:') + $rl->clear('login-fail:');
            Log::event('wrong_tries_cleared', ['count' => $n]);
            return Response::json(200, ['ok' => true, 'removed' => $n]);
        });
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Runs $fn (given the session) for a signed-in admin with the right CSRF token; refreshes the cookie's expiry.
     *
     * @param callable(array{id:int,token:string,expires_at:int,auth_at:int}):Response $fn
     */
    private function guarded(Request $req, callable $fn): Response
    {
        $s = $this->session($req);
        if ($s === null) {
            return Response::error(401, 'signed_out', 'Sign in again.');
        }
        if (!$this->app->crypto->csrfMatches($s['token'], $req->header('x-csrf-token'))) {
            Log::event('admin_csrf_refused');
            return Response::error(403, 'csrf', 'Reload the admin page and try again.');
        }
        $res = $fn($s);
        $res->cookies[] = $this->cookie($req, $s['token'], $s['expires_at'] - $this->app->now);
        return $res;
    }

    /**
     * The signed-in admin session for this request's cookie, its expiry moved forward; null when there is none.
     *
     * @return array{id:int,token:string,expires_at:int,auth_at:int}|null
     */
    private function session(Request $req): ?array
    {
        $token = $req->cookie(self::COOKIE);
        if (!Crypto::isToken($token)) {
            return null;
        }
        $db = $this->app->store();
        $now = $this->app->now;
        $row = $db->one('SELECT id, created_at, expires_at, auth_at FROM admin_sessions WHERE token_hash = ?', [$this->app->crypto->hash('admin', $token)]);
        if ($row === null || (int) $row['expires_at'] <= $now) {
            return null;
        }
        $expires = min((int) $row['created_at'] + self::MAX_SIGN_IN_HOURS * 3600, $now + $this->app->config->int('ADMIN_SESSION_MINUTES') * 60);
        if ($expires <= $now) {
            return null;
        }
        $db->run('UPDATE admin_sessions SET expires_at = ? WHERE id = ?', [$expires, $row['id']]);
        return ['id' => (int) $row['id'], 'token' => $token, 'expires_at' => $expires, 'auth_at' => (int) $row['auth_at']];
    }

    private function cookie(Request $req, string $value, int $maxAge): string
    {
        return self::COOKIE . '=' . $value . '; Path=' . self::cookiePath($req) . '; Max-Age=' . max(0, $maxAge) . '; Secure; HttpOnly; SameSite=Strict';
    }

    /** The relay's folder ("/ai/"): the cookies go to its addresses only, the index.php ones included. */
    private static function cookiePath(Request $req): string
    {
        return $req->base === '' ? '/' : $req->base . '/';
    }

    /** A label as given, tidied (no control characters, single spaces); null when it is not text or too long. */
    public static function label(mixed $v): ?string
    {
        if ($v === null) {
            return '';
        }
        if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) {
            return null;
        }
        $v = trim(preg_replace('/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\s]+/u', ' ', $v) ?? '');
        return mb_strlen($v, 'UTF-8') > self::LABEL_MAX ? null : $v;
    }

    private static function id(mixed $v): ?int
    {
        if (is_string($v) && preg_match('/^\d{1,12}$/', $v)) {
            $v = (int) $v;
        }
        return is_int($v) && $v > 0 ? $v : null;
    }
}
