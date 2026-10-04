<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The admin page (GET /admin) and its JSON calls (/api/admin/...).
 *
 * Signing in sets one cookie: __Secure-nbh_admin, a 32-byte random token (kept only as a hash), HttpOnly,
 * Secure, SameSite=Strict, scoped to the relay's folder, ending ADMIN_SESSION_MINUTES after the last use and
 * at most 12 hours after signing in. Every call but signing in also needs the X-CSRF-Token header, a token
 * derived from the cookie that only the page itself receives; every POST is also origin-checked (App).
 *
 *   POST /api/admin/password-hash {password}   only until a working admin password is set: the line for config.php
 *   POST /api/admin/login {password}           -> {ok, csrf} + cookie
 *   POST /api/admin/logout
 *   GET  /api/admin/state                      -> unused codes, active sessions, limits
 *   POST /api/admin/codes {label?, hours?}     -> {code, id, label, created, expires}   (the code is shown once)
 *   POST /api/admin/codes/revoke {id}
 *   POST /api/admin/sessions/revoke {id}
 *   POST /api/admin/sessions/revoke-all
 *   POST /api/admin/unlock                     forget the wrong-passcode counts (lifts a pause)
 */
final class Admin
{
    public const COOKIE = '__Secure-nbh_admin';
    public const MAX_SIGN_IN_HOURS = 12;
    public const LABEL_MAX = 60;
    public const MAX_UNUSED_CODES = 500;
    public const HASH_HELPER_PER_WINDOW = 10;

    public function __construct(private App $app)
    {
    }

    // ------------------------------------------------------------------ the page

    public function page(Request $req): Response
    {
        $nonce = rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
        if (!$this->app->coreReady() || !$this->app->config->hashOk()) {
            $showHelper = $this->app->coreReady() && !$this->app->config->hashOk();
            return Response::html(200, Pages::setup($this->app->checklist($req), $this->app->config->warnings, $showHelper, $req->base, $nonce), $nonce);
        }
        $s = $this->session($req);
        if ($s === null) {
            return Response::html(200, Pages::signIn($req->base, $nonce), $nonce);
        }
        $res = Response::html(200, Pages::dashboard($req->base, $this->app->crypto->csrf($s['token']), $this->app->config->warnings, $nonce), $nonce);
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
        $wait = $db->write(function () use ($db, $bucket, $window): int {
            $rl = new RateLimiter($db, $this->app->now);
            $wait = $rl->wait($bucket, $window, self::HASH_HELPER_PER_WINDOW);
            if ($wait === 0) {
                $rl->hit($bucket);
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
        $window = $cfg->int('FAIL_WINDOW_MINUTES') * 60;
        $ipBucket = 'login-fail:ip:' . $this->app->ipKey($req);

        // one transaction, the password check included, so parallel guesses cannot slip past the limit
        return $db->write(function () use ($db, $req, $pw, $cfg, $now, $window, $ipBucket): Response {
            $rl = new RateLimiter($db, $now);
            $wait = max(
                $rl->wait($ipBucket, $window, $cfg->int('LOGIN_FAILS_PER_IP')),
                $rl->wait('login-fail:all', $window, $cfg->int('LOGIN_FAILS_ALL'))
            );
            if ($wait > 0) {
                Log::event('admin_sign_in_paused', ['wait' => $wait]);
                return Response::error(429, 'rate_limited', 'Too many wrong passwords. Wait, then try again.', ['retry_after' => $wait]);
            }
            if (!password_verify($pw, $cfg->str('ADMIN_PASSWORD_HASH'))) {
                $rl->hit($ipBucket);
                $rl->hit('login-fail:all');
                Log::event('admin_sign_in_failed');
                return Response::error(401, 'wrong_password', 'That is not the admin password.');
            }
            $token = Crypto::token();
            $expires = min($now + self::MAX_SIGN_IN_HOURS * 3600, $now + $cfg->int('ADMIN_SESSION_MINUTES') * 60);
            $db->run('INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)', [$this->app->crypto->hash('admin', $token), $now, $expires]);
            $db->run('DELETE FROM admin_sessions WHERE expires_at <= ?', [$now]);
            Log::event('admin_signed_in');
            $res = Response::json(200, ['ok' => true, 'csrf' => $this->app->crypto->csrf($token), 'expires' => App::iso($expires)]);
            $res->cookies[] = $this->cookie($req, $token, $expires - $now);
            return $res;
        });
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
        return $this->guarded($req, function (): Response {
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
        return $this->guarded($req, function () use ($body): Response {
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
            $n = (new RateLimiter($this->app->store(), $this->app->now))->clear('redeem-fail:');
            return Response::json(200, ['ok' => true, 'removed' => $n]);
        });
    }

    // ------------------------------------------------------------------ helpers

    /**
     * Runs $fn for a signed-in admin with the right CSRF token; refreshes the cookie's expiry.
     *
     * @param callable():Response $fn
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
        $res = $fn();
        $res->cookies[] = $this->cookie($req, $s['token'], $s['expires_at'] - $this->app->now);
        return $res;
    }

    /**
     * The signed-in admin session for this request's cookie, its expiry moved forward; null when there is none.
     *
     * @return array{id:int,token:string,expires_at:int}|null
     */
    private function session(Request $req): ?array
    {
        $token = $req->cookie(self::COOKIE);
        if (!Crypto::isToken($token)) {
            return null;
        }
        $db = $this->app->store();
        $now = $this->app->now;
        $row = $db->one('SELECT id, created_at, expires_at FROM admin_sessions WHERE token_hash = ?', [$this->app->crypto->hash('admin', $token)]);
        if ($row === null || (int) $row['expires_at'] <= $now) {
            return null;
        }
        $expires = min((int) $row['created_at'] + self::MAX_SIGN_IN_HOURS * 3600, $now + $this->app->config->int('ADMIN_SESSION_MINUTES') * 60);
        if ($expires <= $now) {
            return null;
        }
        $db->run('UPDATE admin_sessions SET expires_at = ? WHERE id = ?', [$expires, $row['id']]);
        return ['id' => (int) $row['id'], 'token' => $token, 'expires_at' => $expires];
    }

    private function cookie(Request $req, string $value, int $maxAge): string
    {
        $path = $req->base === '' ? '/' : $req->base . '/';
        return self::COOKIE . '=' . $value . '; Path=' . $path . '; Max-Age=' . max(0, $maxAge) . '; Secure; HttpOnly; SameSite=Strict';
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
