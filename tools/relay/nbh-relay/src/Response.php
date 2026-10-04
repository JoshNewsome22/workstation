<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * One HTTP response. Every response carries the same protective headers; the admin page replaces the
 * Content-Security-Policy with its own (a nonce for its one script and one style).
 */
final class Response
{
    private const JSON_FLAGS = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP
        | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR;

    /** @var list<string> Set-Cookie values */
    public array $cookies = [];

    /**
     * @param array<string,string> $headers
     */
    public function __construct(
        public int $status,
        public string $body = '',
        public array $headers = [],
    ) {
    }

    /**
     * @param array<string,mixed> $data
     * @param array<string,string> $headers
     */
    public static function json(int $status, array $data, array $headers = []): self
    {
        return new self($status, json_encode($data, self::JSON_FLAGS), ['Content-Type' => 'application/json; charset=utf-8'] + $headers);
    }

    /**
     * A JSON error: {"error": code, "message": plain sentence, ...extra}. The forms' panel decides what to
     * tell the person from the status and the code; the message is for anyone reading the raw answer.
     *
     * @param array<string,mixed> $extra
     * @param array<string,string> $headers
     */
    public static function error(int $status, string $code, string $message, array $extra = [], array $headers = []): self
    {
        if (isset($extra['retry_after'])) {
            $headers['Retry-After'] = (string) $extra['retry_after'];
        }
        return self::json($status, ['error' => $code, 'message' => $message] + $extra, $headers);
    }

    public static function html(int $status, string $html, string $nonce = ''): self
    {
        $csp = "default-src 'none'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
        if ($nonce !== '') {
            $csp .= "; script-src 'nonce-{$nonce}'; style-src 'nonce-{$nonce}'";
        }
        return new self($status, $html, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Security-Policy' => $csp,
            'Cross-Origin-Opener-Policy' => 'same-origin',
        ]);
    }

    public static function text(int $status, string $text): self
    {
        return new self($status, $text, ['Content-Type' => 'text/plain; charset=utf-8']);
    }

    /** @return array<string,string> */
    public static function baseHeaders(): array
    {
        return [
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'no-referrer',
            'X-Frame-Options' => 'DENY',
            'Cross-Origin-Resource-Policy' => 'same-origin',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        ];
    }

    /** @return array<string,string> the headers as sent: this response's own, then the protective defaults */
    public function allHeaders(): array
    {
        return $this->headers + self::baseHeaders();
    }

    public function send(bool $headOnly = false): void
    {
        if (!headers_sent()) {
            header_remove('X-Powered-By');
            http_response_code($this->status);
            foreach ($this->allHeaders() as $k => $v) {
                header($k . ': ' . $v);
            }
            foreach ($this->cookies as $c) {
                header('Set-Cookie: ' . $c, false);
            }
        }
        if (!$headOnly) {
            echo $this->body;
        }
    }
}
