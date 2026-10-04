<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The relay's notes for whoever looks after it, in nbh-relay/data/relay-errors.log (PHP's error log, moved
 * out of the web folder). What is written: what happened, a status, an error type, a request id. What is
 * never written: the text people send, rewrites, passcodes, tokens, passwords, the API key, IP addresses.
 * Exceptions from the SDK and its HTTP client are logged by class and status only, because their messages
 * can carry parts of a request or an answer.
 */
final class Log
{
    private const MAX_BYTES = 1048576;

    public static function init(string $dataDir): void
    {
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');
        // no stack-trace arguments in any message (they would hold the text being rewritten)
        ini_set('zend.exception_ignore_args', '1');
        if (is_dir($dataDir) && is_writable($dataDir)) {
            $file = $dataDir . '/relay-errors.log';
            if (is_file($file) && @filesize($file) > self::MAX_BYTES) {
                @rename($file, $file . '.old');
            }
            ini_set('error_log', $file);
        }
    }

    /**
     * @param array<string,scalar|null> $context short values only: codes, numbers, ids
     */
    public static function event(string $what, array $context = []): void
    {
        $parts = [];
        foreach ($context as $k => $v) {
            $s = is_bool($v) ? ($v ? 'true' : 'false') : (string) $v;
            $parts[] = $k . '=' . preg_replace('/[^A-Za-z0-9_.:\-\/]/', '_', substr($s, 0, 80));
        }
        error_log('nbh-relay: ' . $what . ($parts ? ' ' . implode(' ', $parts) : ''));
    }

    public static function exception(string $where, \Throwable $e): void
    {
        $context = ['class' => get_class($e), 'at' => basename($e->getFile()) . ':' . $e->getLine()];
        if ($e instanceof \PDOException || str_starts_with(get_class($e), __NAMESPACE__ . '\\') || $e instanceof \Error) {
            // our own messages, the database's and PHP's own are free of request text
            $context['message'] = substr(preg_replace('/\s+/', ' ', $e->getMessage()) ?? '', 0, 200);
        }
        $parts = [];
        foreach ($context as $k => $v) {
            $parts[] = $k . '=' . ($k === 'message' ? '"' . str_replace('"', "'", $v) . '"' : $v);
        }
        error_log('nbh-relay: ' . $where . ' ' . implode(' ', $parts));
    }
}
