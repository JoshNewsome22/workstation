<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * Secrets: passcodes, session tokens, admin sessions and their CSRF tokens.
 *
 * Nothing secret is stored as is. Passcodes, session tokens and admin cookies are kept as HMAC-SHA256 with
 * the server pepper (PEPPER in config.php), each purpose with its own label, so a copy of relay.sqlite alone
 * cannot be used to sign in or to test guesses; client IP addresses are kept the same way, only to count
 * failed tries.
 */
final class Crypto
{
    /** 32 symbols, none easy to misread: no 0 or O, no 1 or I. 12 symbols = 60 bits. */
    public const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    public const CODE_LENGTH = 12;

    public const PASSWORD_MIN = 10;
    public const PASSWORD_MAX = 200;

    public function __construct(#[\SensitiveParameter] private string $pepper)
    {
    }

    /** HMAC-SHA256 of a value for one purpose ("code", "session", "admin", "ip"), hex. */
    public function hash(string $purpose, #[\SensitiveParameter] string $value): string
    {
        return hash_hmac('sha256', $purpose . "\n" . $value, $this->pepper);
    }

    /** The CSRF token for an admin session: derived from the session's cookie, so nothing more is stored. */
    public function csrf(#[\SensitiveParameter] string $adminToken): string
    {
        return self::b64url(hash_hmac('sha256', "csrf\n" . $adminToken, $this->pepper, true));
    }

    public function csrfMatches(#[\SensitiveParameter] string $adminToken, #[\SensitiveParameter] string $given): bool
    {
        return $given !== '' && hash_equals($this->csrf($adminToken), $given);
    }

    /** 32 random bytes as 43 URL-safe characters. */
    public static function token(): string
    {
        return self::b64url(random_bytes(32));
    }

    public static function isToken(string $t): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9_-]{43}$/', $t);
    }

    /** A new passcode, 12 symbols without the dashes. */
    public static function newCode(): string
    {
        $s = '';
        $last = strlen(self::CODE_ALPHABET) - 1;
        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $s .= self::CODE_ALPHABET[random_int(0, $last)];
        }
        return $s;
    }

    /** "7KQM4P2XDV9H" -> "7KQ-M4P-2XD-V9H" */
    public static function formatCode(string $code): string
    {
        return implode('-', str_split($code, 3));
    }

    /**
     * A passcode as typed ("7kq m4p-2xd–v9h") in its stored form ("7KQM4P2XDV9H"), or null when it cannot be one.
     */
    public static function normalizeCode(string $raw): ?string
    {
        if (strlen($raw) > 64) {
            return null;
        }
        $s = preg_replace('/[\s\x{00A0}\x{2010}-\x{2015}\x{2212}_\-]+/u', '', strtoupper($raw));
        if ($s === null || !preg_match('/^[' . self::CODE_ALPHABET . ']{' . self::CODE_LENGTH . '}$/', $s)) {
            return null;
        }
        return $s;
    }

    public static function newPepper(): string
    {
        return bin2hex(random_bytes(32));
    }

    /** Why a new admin password cannot be used, or null when it can. */
    public static function passwordProblem(#[\SensitiveParameter] string $pw): ?string
    {
        $n = mb_strlen($pw, 'UTF-8');
        if ($n < self::PASSWORD_MIN) {
            return 'Use at least ' . self::PASSWORD_MIN . ' characters (a few words make a password that is long and easy to remember).';
        }
        if ($n > self::PASSWORD_MAX) {
            return 'Use at most ' . self::PASSWORD_MAX . ' characters.';
        }
        if (!self::argon2Available() && strlen($pw) > 72) {
            return 'On this server the password can have at most 72 characters.';
        }
        if (!mb_check_encoding($pw, 'UTF-8') || preg_match('/[\x00-\x1F\x7F]/', $pw)) {
            return 'The password has a character that cannot be used.';
        }
        return null;
    }

    public static function argon2Available(): bool
    {
        return defined('PASSWORD_ARGON2ID');
    }

    /** password_hash() with Argon2id where this PHP has it, otherwise PHP's default (bcrypt). */
    public static function hashPassword(#[\SensitiveParameter] string $pw): string
    {
        return password_hash($pw, self::argon2Available() ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }

    public static function isPasswordHash(string $hash): bool
    {
        $info = password_get_info($hash);
        return !empty($info['algo']);
    }

    /** The line to paste into config.php. */
    public static function hashLine(string $hash): string
    {
        return "'ADMIN_PASSWORD_HASH' => '" . $hash . "',";
    }

    private static function b64url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }
}
