<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * One HTTP request as the relay sees it: read once from PHP's globals, or built directly by a test.
 *
 * $path is the route inside the relay ("/api/redeem", "/admin", ...), worked out from the URL path and the
 * folder the relay's index.php is served from ($base, e.g. "/ai"). A URL outside that folder gets the path
 * "" and is answered 404. Both "/ai/api/redeem" (through .htaccess) and "/ai/index.php/api/redeem" (no
 * mod_rewrite) give "/api/redeem".
 */
final class Request
{
    /**
     * @param array<string,string> $headers lower-case header names
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly string $base,
        public readonly array $headers,
        public readonly string $body,
        public readonly bool $bodyTooLarge,
        public readonly string $ip,
        public readonly bool $https,
        public readonly string $docRoot = '',
    ) {
    }

    /**
     * @param int $maxBody the most body bytes read; a longer body is not read and is flagged instead
     */
    public static function fromGlobals(int $maxBody, string $baseOverride = ''): self
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (!is_string($k) || !is_string($v)) {
                continue;
            }
            if (str_starts_with($k, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = $v;
            } elseif ($k === 'CONTENT_TYPE' || $k === 'CONTENT_LENGTH') {
                $headers[strtolower(str_replace('_', '-', $k))] = $v;
            }
        }
        [$base, $path] = self::route(
            (string) ($_SERVER['REQUEST_URI'] ?? '/'),
            (string) ($_SERVER['SCRIPT_NAME'] ?? ''),
            $baseOverride
        );

        $body = '';
        $tooLarge = false;
        if ($method === 'POST') {
            $len = $headers['content-length'] ?? '';
            if ($len !== '' && (!ctype_digit($len) || strlen($len) > 12 || (int) $len > $maxBody)) {
                $tooLarge = true;
            } else {
                $in = fopen('php://input', 'rb');
                if ($in !== false) {
                    $read = stream_get_contents($in, $maxBody + 1);
                    fclose($in);
                    $body = $read === false ? '' : $read;
                    if (strlen($body) > $maxBody) {
                        $body = '';
                        $tooLarge = true;
                    }
                }
            }
        }

        $https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && strtolower((string) $_SERVER['HTTPS']) !== 'off')
            || strtolower((string) ($_SERVER['REQUEST_SCHEME'] ?? '')) === 'https'
            || strtolower($headers['x-forwarded-proto'] ?? '') === 'https';

        return new self(
            method: $method,
            path: $path,
            base: $base,
            headers: $headers,
            body: $body,
            bodyTooLarge: $tooLarge,
            ip: (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            https: $https,
            docRoot: (string) ($_SERVER['DOCUMENT_ROOT'] ?? ''),
        );
    }

    /**
     * The relay's folder and the route inside it.
     *
     * @return array{0:string,1:string} [base, path]; path is "" when the URL is not inside the relay's folder
     */
    public static function route(string $requestUri, string $scriptName, string $baseOverride = ''): array
    {
        if ($baseOverride !== '') {
            $base = '/' . trim($baseOverride, '/');
            $base = $base === '/' ? '' : $base;
        } elseif (preg_match('~^(/[^?#]*?)?/index\.php$~', $scriptName, $m)) {
            // Apache, PHP-FPM and the built-in server name the script the request was routed to; anything else
            // (a script name that is not this index.php) means the URL is not one of the relay's.
            $base = $m[1] ?? '';
        } else {
            return ['', ''];
        }

        $uri = $requestUri;
        foreach (['?', '#'] as $cut) {
            $at = strpos($uri, $cut);
            if ($at !== false) {
                $uri = substr($uri, 0, $at);
            }
        }
        if ($uri === $base || $uri === $base . '/') {
            return [$base, '/'];
        }
        if (!str_starts_with($uri, $base . '/')) {
            return [$base, ''];
        }
        $path = substr($uri, strlen($base));
        if ($path === '/index.php') {
            $path = '/';
        } elseif (str_starts_with($path, '/index.php/')) {
            $path = substr($path, strlen('/index.php'));
        }
        if (strlen($path) > 1) {
            $path = rtrim($path, '/');
        }
        return [$base, $path === '' ? '/' : $path];
    }

    public function header(string $name): string
    {
        return $this->headers[strtolower($name)] ?? '';
    }

    public function cookie(string $name): string
    {
        foreach (explode(';', $this->header('cookie')) as $pair) {
            $eq = strpos($pair, '=');
            if ($eq !== false && trim(substr($pair, 0, $eq)) === $name) {
                return trim(substr($pair, $eq + 1));
            }
        }
        return '';
    }

    public function isJson(): bool
    {
        return (bool) preg_match('~^application/json\s*(;|$)~i', trim($this->header('content-type')));
    }

    /**
     * The JSON object in the body, or null when the body is not a JSON object.
     *
     * @return array<string,mixed>|null
     */
    public function json(): ?array
    {
        if ($this->body === '' || $this->bodyTooLarge) {
            return null;
        }
        try {
            $data = json_decode($this->body, true, 16, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
        } catch (\JsonException) {
            return null;
        }
        if (!is_array($data) || ($data !== [] && array_is_list($data))) {
            return null;
        }
        return $data;
    }
}
