<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * Sliding-window counters kept in the hits table: one row per counted event, so "how many in the last N
 * seconds" is exact. Callers run inside a write transaction, so checking and counting is one step even when
 * requests arrive together.
 *
 * Buckets used: "redeem-fail:ip:<hash>", "redeem-fail:all", "login-fail:ip:<hash>", "login-fail:all",
 * "hash-helper:ip:<hash>", "rewrite:s:<session id>", "rewrite:all".
 */
final class RateLimiter
{
    public function __construct(private Db $db, private int $now)
    {
    }

    public function count(string $bucket, int $window): int
    {
        return (int) ($this->db->one('SELECT COUNT(*) AS n FROM hits WHERE bucket = ? AND at > ?', [$bucket, $this->now - $window])['n'] ?? 0);
    }

    public function hit(string $bucket): void
    {
        $this->db->run('INSERT INTO hits (bucket, at) VALUES (?, ?)', [$bucket, $this->now]);
    }

    /**
     * Seconds until the bucket is under $limit again; 0 when it is under the limit now.
     */
    public function wait(string $bucket, int $window, int $limit): int
    {
        $n = $this->count($bucket, $window);
        if ($n < $limit) {
            return 0;
        }
        // the hit whose expiry brings the count back under the limit
        $row = $this->db->one(
            'SELECT at FROM hits WHERE bucket = ? AND at > ? ORDER BY at ASC LIMIT 1 OFFSET ' . (int) ($n - $limit),
            [$bucket, $this->now - $window]
        );
        $at = (int) ($row['at'] ?? $this->now);
        return max(1, $at + $window - $this->now + 1);
    }

    /** Removes every hit in buckets that start with $prefix; returns how many. */
    public function clear(string $prefix): int
    {
        return $this->db->run("DELETE FROM hits WHERE substr(bucket, 1, ?) = ?", [strlen($prefix), $prefix]);
    }
}
