<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The two calls the forms' panel makes (same contract as tools/blocks/nbh-wording.js):
 *
 *   POST /api/redeem  {code}               -> 200 {token, expires, expires_in}
 *       401 invalid_code (wrong, used or expired: the panel says "not accepted" for all three)
 *       429 rate_limited {retry_after} + Retry-After (too many wrong tries from this address, or from all)
 *   POST /api/rewrite {token, text, style} -> 200 {rewrites:[{style,text}], changes:[...], cautions:[...]}
 *       401 invalid_token | session_expired, 400 bad_request, 413 too_long,
 *       429 session_limit_reached | rate_limited {retry_after}, 422 refused | incomplete,
 *       502 upstream, 503 upstream_busy, 504 upstream_timeout
 *
 * A passcode works once: it is deleted in the same transaction that opens the session. A session token is
 * 32 random bytes, kept only as a hash, and ends after SESSION_HOURS or when the admin ends it.
 */
final class Api
{
    public function __construct(private App $app)
    {
    }

    /**
     * @param array<string,mixed> $body
     */
    public function redeem(Request $req, array $body): Response
    {
        $code = $body['code'] ?? null;
        if (!is_string($code) || strlen($code) > 64) {
            return Response::error(400, 'bad_request', 'Send the passcode as text.');
        }
        $cfg = $this->app->config;
        $window = $cfg->int('FAIL_WINDOW_MINUTES') * 60;
        $ipBucket = 'redeem-fail:ip:' . $this->app->ipKey($req);
        $now = $this->app->now;
        $db = $this->app->store();

        return $db->write(function () use ($db, $code, $cfg, $window, $ipBucket, $now): Response {
            $rl = new RateLimiter($db, $now);
            $wait = max(
                $rl->wait($ipBucket, $window, $cfg->int('REDEEM_FAILS_PER_IP')),
                $rl->wait('redeem-fail:all', $window, $cfg->int('REDEEM_FAILS_ALL'))
            );
            if ($wait > 0) {
                Log::event('redeem_paused', ['wait' => $wait]);
                return Response::error(429, 'rate_limited', 'Too many passcode tries. Wait, then try again.', ['retry_after' => $wait]);
            }

            $canon = Crypto::normalizeCode($code);
            $row = $canon === null ? null : $db->one(
                'SELECT id, label, expires_at FROM codes WHERE code_hash = ?',
                [$this->app->crypto->hash('code', $canon)]
            );
            if ($row === null || (int) $row['expires_at'] <= $now) {
                $rl->hit($ipBucket);
                $rl->hit('redeem-fail:all');
                if ($row !== null) {
                    $db->run('DELETE FROM codes WHERE id = ?', [$row['id']]);
                }
                return Response::error(401, 'invalid_code', 'That passcode was not accepted.');
            }

            // single use: the code goes in the same transaction that opens the session
            if ($db->run('DELETE FROM codes WHERE id = ?', [$row['id']]) !== 1) {
                return Response::error(401, 'invalid_code', 'That passcode was not accepted.');
            }
            $token = Crypto::token();
            $expires = $now + $cfg->int('SESSION_HOURS') * 3600;
            $db->run(
                'INSERT INTO sessions (token_hash, label, created_at, expires_at, requests) VALUES (?, ?, ?, ?, 0)',
                [$this->app->crypto->hash('session', $token), (string) $row['label'], $now, $expires]
            );
            Log::event('session_opened', ['session' => $db->lastId(), 'hours' => $cfg->int('SESSION_HOURS')]);
            return Response::json(200, ['token' => $token, 'expires' => App::iso($expires), 'expires_in' => $expires - $now]);
        });
    }

    /**
     * @param array<string,mixed> $body
     */
    public function rewrite(Request $req, array $body): Response
    {
        $token = $body['token'] ?? null;
        if (!is_string($token) || !Crypto::isToken($token)) {
            return Response::error(401, 'invalid_token', 'This tab is not signed in to the rewrite service.');
        }
        $cfg = $this->app->config;
        $now = $this->app->now;
        $db = $this->app->store();
        $text = $body['text'] ?? null;
        $style = $body['style'] ?? null;

        $gate = $db->write(function () use ($db, $token, $text, $style, $cfg, $now): ?Response {
            $s = $db->one('SELECT id, expires_at, requests FROM sessions WHERE token_hash = ?', [$this->app->crypto->hash('session', $token)]);
            if ($s === null) {
                return Response::error(401, 'invalid_token', 'This tab is not signed in to the rewrite service.');
            }
            if ((int) $s['expires_at'] <= $now) {
                $db->run('DELETE FROM sessions WHERE id = ?', [$s['id']]);
                return Response::error(401, 'session_expired', 'This tab\'s time with the rewrite service is over.');
            }
            if (!is_string($style) || !isset(Claude::STYLES[$style])) {
                return Response::error(400, 'bad_request', 'Choose one of the styles.');
            }
            if (!is_string($text) || trim($text) === '') {
                return Response::error(400, 'bad_request', 'There is no text to rewrite.');
            }
            if (mb_strlen($text, 'UTF-8') > $cfg->int('MAX_CHARS')) {
                return Response::error(413, 'too_long', 'The text is longer than ' . $cfg->int('MAX_CHARS') . ' characters.', ['max_chars' => $cfg->int('MAX_CHARS')]);
            }
            if ((int) $s['requests'] >= $cfg->int('MAX_REQUESTS_PER_SESSION')) {
                return Response::error(429, 'session_limit_reached', 'This session has used all of its rewrites.');
            }
            $rl = new RateLimiter($db, $now);
            $mine = 'rewrite:s:' . $s['id'];
            $wait = $rl->wait($mine, 60, $cfg->int('REWRITES_PER_MINUTE'));
            if ($wait > 0) {
                return Response::error(429, 'rate_limited', 'Too many rewrites in a short time. Wait a minute, then try again.', ['retry_after' => $wait]);
            }
            $wait = $rl->wait('rewrite:all', 86400, $cfg->int('REWRITES_PER_DAY'));
            if ($wait > 0) {
                Log::event('daily_limit_reached', ['limit' => $cfg->int('REWRITES_PER_DAY')]);
                return Response::error(429, 'rate_limited', 'The rewrite service has reached its limit for today. Try again later.', ['retry_after' => $wait]);
            }
            // counted before the call (released before it, too: the call itself holds no lock)
            $rl->hit($mine);
            $rl->hit('rewrite:all');
            $db->run('UPDATE sessions SET requests = requests + 1, last_used_at = ? WHERE id = ?', [$now, $s['id']]);
            return null;
        });
        if ($gate !== null) {
            return $gate;
        }

        /** @var string $text */
        /** @var string $style */
        $out = (new Claude($cfg))->rewrite($text, $style);
        if (!$out['ok']) {
            return Response::error($out['status'], $out['error'], $out['message'], $out['extra']);
        }
        return Response::json(200, [
            'rewrites' => [['style' => $style, 'text' => $out['text']]],
            'changes' => $out['changes'],
            'cautions' => $out['cautions'],
        ]);
    }
}
