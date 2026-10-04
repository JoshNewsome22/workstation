<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The settings in nbh-relay/config.php (a PHP file that returns an array), checked once per request.
 * A setting that is left out takes its default; a setting with a wrong value is reported on the setup page
 * in plain words, never with the file's contents.
 */
final class Config
{
    public const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

    /** The defaults, and the only settings there are. */
    public const DEFAULTS = [
        'ANTHROPIC_API_KEY' => '',
        'ADMIN_PASSWORD_HASH' => '',
        'PEPPER' => '',
        'SESSION_HOURS' => 8,
        'CODE_HOURS' => 24,
        'MAX_CODE_HOURS' => 168,
        'MAX_REQUESTS_PER_SESSION' => 300,
        'MAX_CHARS' => 4000,
        'REWRITES_PER_MINUTE' => 10,
        'REWRITES_PER_DAY' => 1000,
        'ALLOWED_ORIGINS' => ['https://newsomebh.com', 'https://www.newsomebh.com'],
        'REDEEM_FAILS_PER_IP' => 10,
        'REDEEM_FAILS_ALL' => 50,
        'LOGIN_FAILS_PER_IP' => 5,
        'LOGIN_FAILS_ALL' => 20,
        'FAIL_WINDOW_MINUTES' => 15,
        'ADMIN_SESSION_MINUTES' => 30,
        'EFFORT' => 'low',
        'MAX_OUTPUT_TOKENS' => 0,
        'TIMEOUT_SECONDS' => 50,
        'API_BASE_URL' => 'https://api.anthropic.com',
        'REQUIRE_HTTPS' => true,
        'BASE_PATH' => '',
        'DATA_DIR' => '',
    ];

    /** whole-number settings: [smallest, largest] */
    private const RANGES = [
        'SESSION_HOURS' => [1, 72],
        'CODE_HOURS' => [1, 720],
        'MAX_CODE_HOURS' => [1, 720],
        'MAX_CHARS' => [200, 20000],
        'MAX_REQUESTS_PER_SESSION' => [1, 100000],
        'REWRITES_PER_MINUTE' => [1, 600],
        'REWRITES_PER_DAY' => [1, 1000000],
        'REDEEM_FAILS_PER_IP' => [1, 10000],
        'REDEEM_FAILS_ALL' => [1, 100000],
        'LOGIN_FAILS_PER_IP' => [1, 10000],
        'LOGIN_FAILS_ALL' => [1, 100000],
        'FAIL_WINDOW_MINUTES' => [1, 1440],
        'ADMIN_SESSION_MINUTES' => [5, 720],
        'MAX_OUTPUT_TOKENS' => [0, 128000],
        'TIMEOUT_SECONDS' => [5, 600],
    ];

    /** @var array<string,mixed> */
    private array $values;

    /** @var array<string,string> plain-language problems that stop the relay, by setting ("_file" for the file itself) */
    public array $problems = [];

    /** @var list<string> plain-language notes that do not stop it */
    public array $warnings = [];

    /**
     * @param array<string,mixed> $raw
     */
    public function __construct(array $raw)
    {
        $this->values = self::DEFAULTS;
        foreach ($raw as $k => $v) {
            if (!is_string($k) || !array_key_exists($k, self::DEFAULTS)) {
                $this->warnings[] = 'config.php has a setting the relay does not know: ' . self::safeName($k) . '. Check its spelling against config.sample.php.';
                continue;
            }
            $this->values[$k] = $v;
        }
        $this->check();
    }

    /**
     * Reads config.php. A file that cannot be read or does not return an array gives a Config with a problem.
     */
    public static function load(string $file): self
    {
        if (!is_file($file)) {
            return self::broken('nbh-relay/config.php does not exist yet.');
        }
        // Read the file as it is now: with OPcache on (usual on shared hosting) an edit in File Manager would
        // otherwise go unseen for a while, or until the server restarts.
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($file, true);
        }
        try {
            $raw = (static function (string $f) {
                return require $f;
            })($file);
        } catch (\ParseError $e) {
            // Only the line: the parser's message can quote the file, and the file holds the API key.
            return self::broken('nbh-relay/config.php has a typing mistake on line ' . $e->getLine() . ' (often a missing quote, comma or bracket). Compare that line with config.sample.php.');
        } catch (\Throwable $e) {
            return self::broken('nbh-relay/config.php could not be read (' . get_class($e) . ').');
        }
        if (!is_array($raw)) {
            return self::broken('nbh-relay/config.php must end with the list of settings (it should start with "return [" as in config.sample.php).');
        }
        return new self($raw);
    }

    /** A Config that stops the relay because of the file itself; its other checks are not reported. */
    private static function broken(string $why): self
    {
        $c = new self([]);
        $c->problems = ['_file' => $why];
        return $c;
    }

    private static function safeName(mixed $k): string
    {
        $s = is_string($k) ? $k : (string) json_encode($k);
        return preg_replace('/[^A-Za-z0-9_]/', '?', substr($s, 0, 40)) ?? '?';
    }

    private function check(): void
    {
        foreach (self::RANGES as $k => [$lo, $hi]) {
            $v = $this->values[$k];
            if (is_string($v) && preg_match('/^\d{1,9}$/', $v)) {
                $v = (int) $v;
                $this->values[$k] = $v;
            }
            if (!is_int($v) || $v < $lo || $v > $hi) {
                $this->problems[$k] = "$k must be a whole number from $lo to $hi.";
                $this->values[$k] = self::DEFAULTS[$k];
            }
        }
        if ($this->values['CODE_HOURS'] > $this->values['MAX_CODE_HOURS']) {
            $this->problems['CODE_HOURS'] = 'CODE_HOURS cannot be more than MAX_CODE_HOURS.';
        }
        foreach (['ANTHROPIC_API_KEY', 'ADMIN_PASSWORD_HASH', 'PEPPER', 'API_BASE_URL', 'EFFORT', 'BASE_PATH', 'DATA_DIR'] as $k) {
            if (!is_string($this->values[$k])) {
                $this->problems[$k] = "$k must be text between quotes.";
                $this->values[$k] = self::DEFAULTS[$k];
            } else {
                $this->values[$k] = trim($this->values[$k]);
            }
        }
        $key = $this->values['ANTHROPIC_API_KEY'];
        if ($key !== '' && !preg_match('/^[\x21-\x7E]{20,300}$/', $key)) {
            $this->problems['ANTHROPIC_API_KEY'] = 'ANTHROPIC_API_KEY does not look like an API key: paste the whole key (it starts with sk-ant-) between the quotes, with no spaces.';
        }
        $hash = $this->values['ADMIN_PASSWORD_HASH'];
        if ($hash !== '' && !Crypto::isPasswordHash($hash)) {
            $this->problems['ADMIN_PASSWORD_HASH'] = 'ADMIN_PASSWORD_HASH is not a password hash: make a new one on the setup page (or with make-admin-hash.php) and paste the whole line.';
        }
        if (strlen($this->values['PEPPER']) < 32) {
            $this->problems['PEPPER'] = 'PEPPER must be a long random secret (at least 32 characters).';
        }
        if (!in_array($this->values['EFFORT'], self::EFFORTS, true)) {
            $this->problems['EFFORT'] = 'EFFORT must be one of: ' . implode(', ', self::EFFORTS) . '.';
            $this->values['EFFORT'] = self::DEFAULTS['EFFORT'];
        }
        if (!preg_match('#^https?://[A-Za-z0-9.\-]+(:\d{1,5})?(/[A-Za-z0-9._~\-/]*)?$#', $this->values['API_BASE_URL'])) {
            $this->problems['API_BASE_URL'] = 'API_BASE_URL must be a web address such as https://api.anthropic.com.';
            $this->values['API_BASE_URL'] = self::DEFAULTS['API_BASE_URL'];
        }
        if ($this->values['BASE_PATH'] !== '' && !preg_match('~^/[A-Za-z0-9._\-/]*$~', $this->values['BASE_PATH'])) {
            $this->problems['BASE_PATH'] = 'BASE_PATH must be empty or a folder path such as /ai.';
        }
        if ($this->values['DATA_DIR'] !== '' && !str_starts_with($this->values['DATA_DIR'], '/')) {
            $this->problems['DATA_DIR'] = 'DATA_DIR must be empty or a full folder path starting with /.';
        }
        $b = $this->values['REQUIRE_HTTPS'];
        if ($b === 1 || $b === 0) {
            $this->values['REQUIRE_HTTPS'] = (bool) $b;
        } elseif (!is_bool($b)) {
            $this->problems['REQUIRE_HTTPS'] = 'REQUIRE_HTTPS must be true or false (without quotes).';
            $this->values['REQUIRE_HTTPS'] = true;
        }
        $origins = $this->values['ALLOWED_ORIGINS'];
        if (is_string($origins)) {
            $origins = [$origins];
        }
        $clean = [];
        $bad = !is_array($origins);
        foreach (is_array($origins) ? $origins : [] as $o) {
            $n = is_string($o) ? self::normalizeOrigin($o) : null;
            if ($n === null) {
                $bad = true;
                break;
            }
            $clean[] = $n;
        }
        if ($bad) {
            $this->problems['ALLOWED_ORIGINS'] = 'ALLOWED_ORIGINS must list site addresses such as https://newsomebh.com (no path, no slash at the end).';
            $clean = [];
        } elseif ($clean === []) {
            $this->problems['ALLOWED_ORIGINS'] = 'ALLOWED_ORIGINS must list at least one site address, such as https://newsomebh.com.';
        }
        $this->values['ALLOWED_ORIGINS'] = array_values(array_unique($clean));
    }

    /**
     * "https://NewsomeBH.com:443" -> "https://newsomebh.com"; null when it is not a bare origin.
     */
    public static function normalizeOrigin(string $o): ?string
    {
        if (!preg_match('~^(https?)://([A-Za-z0-9.\-]+|\[[0-9A-Fa-f:.]+\])(?::(\d{1,5}))?$~i', trim($o), $m)) {
            return null;
        }
        $scheme = strtolower($m[1]);
        $host = strtolower($m[2]);
        $port = isset($m[3]) && $m[3] !== '' ? (int) $m[3] : null;
        if ($port === null || ($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80)) {
            return $scheme . '://' . $host;
        }
        return $scheme . '://' . $host . ':' . $port;
    }

    public function ok(): bool
    {
        return $this->problems === [];
    }

    /** Everything but the API key and the admin password is in order. */
    public function generalOk(): bool
    {
        return array_diff_key($this->problems, ['ANTHROPIC_API_KEY' => 1, 'ADMIN_PASSWORD_HASH' => 1]) === [];
    }

    /** @return list<string> the problems with everything but the API key and the admin password */
    public function generalProblems(): array
    {
        return array_values(array_diff_key($this->problems, ['ANTHROPIC_API_KEY' => 1, 'ADMIN_PASSWORD_HASH' => 1]));
    }

    public function keyOk(): bool
    {
        return $this->apiKeySet() && !isset($this->problems['ANTHROPIC_API_KEY']);
    }

    public function hashOk(): bool
    {
        return $this->adminHashSet() && !isset($this->problems['ADMIN_PASSWORD_HASH']);
    }

    public function str(string $k): string
    {
        return (string) $this->values[$k];
    }

    public function int(string $k): int
    {
        return (int) $this->values[$k];
    }

    public function bool(string $k): bool
    {
        return (bool) $this->values[$k];
    }

    /** @return list<string> */
    public function origins(): array
    {
        return $this->values['ALLOWED_ORIGINS'];
    }

    public function apiKeySet(): bool
    {
        return $this->values['ANTHROPIC_API_KEY'] !== '';
    }

    public function adminHashSet(): bool
    {
        return $this->values['ADMIN_PASSWORD_HASH'] !== '';
    }

    /** The largest request body read: room for MAX_CHARS characters even when every one is JSON-escaped. */
    public function maxBodyBytes(): int
    {
        return max(65536, $this->int('MAX_CHARS') * 12 + 4096);
    }

    /** Output tokens for one rewrite: thinking counts toward the limit, so a higher effort needs more room. */
    public function maxOutputTokens(): int
    {
        $set = $this->int('MAX_OUTPUT_TOKENS');
        if ($set > 0) {
            return max(1024, $set);
        }
        return match ($this->str('EFFORT')) {
            'low' => 8000,
            'medium' => 16000,
            'high' => 32000,
            'xhigh' => 48000,
            default => 64000,
        };
    }
}
