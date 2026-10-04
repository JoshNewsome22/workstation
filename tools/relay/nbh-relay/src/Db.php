<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * nbh-relay/data/relay.sqlite: passcodes, sessions, admin sign-ins and rate-limit counters. Created on the
 * first request, readable by the site's own account only (folder 0700, file 0600). It never holds request
 * text, passcodes, tokens or IP addresses in a usable form (see Crypto).
 *
 * The schema version is SQLite's user_version; each migration runs once, inside one write transaction, in
 * order. A later relay version adds its step to MIGRATIONS and raises nothing else.
 */
final class Db
{
    /** @var array<int,list<string>> version => statements that bring the database to that version */
    public const MIGRATIONS = [
        1 => [
            'CREATE TABLE codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code_hash TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL DEFAULT \'\',
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            )',
            'CREATE INDEX codes_expires ON codes (expires_at)',
            'CREATE TABLE sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL DEFAULT \'\',
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                last_used_at INTEGER,
                requests INTEGER NOT NULL DEFAULT 0
            )',
            'CREATE INDEX sessions_expires ON sessions (expires_at)',
            'CREATE TABLE admin_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT NOT NULL UNIQUE,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            )',
            'CREATE TABLE hits (
                bucket TEXT NOT NULL,
                at INTEGER NOT NULL
            )',
            'CREATE INDEX hits_bucket_at ON hits (bucket, at)',
        ],
        // when the admin password was last typed in a sign-in: creating a passcode asks for it again after a while
        2 => [
            'ALTER TABLE admin_sessions ADD COLUMN auth_at INTEGER NOT NULL DEFAULT 0',
        ],
    ];

    public const FILE = 'relay.sqlite';

    private function __construct(public readonly \PDO $pdo)
    {
    }

    public static function latest(): int
    {
        return max(array_keys(self::MIGRATIONS));
    }

    /**
     * Opens (and on the first call creates) the database in $dir.
     *
     * @throws \RuntimeException with a plain message when the folder or the file cannot be made
     */
    public static function open(string $dir): self
    {
        if (!self::ensureDir($dir)) {
            throw new \RuntimeException('The data folder could not be created. Check that the nbh-relay folder can be written to.');
        }
        $file = $dir . '/' . self::FILE;
        $new = !is_file($file);
        $old = umask(0077);
        try {
            $pdo = new \PDO('sqlite:' . $file, null, null, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_TIMEOUT => 10,
            ]);
            $pdo->exec('PRAGMA busy_timeout = 10000');
            $pdo->exec('PRAGMA secure_delete = ON');
            $db = new self($pdo);
            $db->migrate();
        } catch (\PDOException $e) {
            throw new \RuntimeException('The database in the data folder could not be opened (' . $e->getMessage() . ').', 0, $e);
        } finally {
            umask($old);
        }
        if ($new) {
            @chmod($file, 0600);
        }
        return $db;
    }

    /**
     * Makes the data folder (0700) when it is missing, with a deny-all .htaccess in case the folder ever ends
     * up inside public_html. False when it cannot be made.
     */
    public static function ensureDir(string $dir): bool
    {
        if (!is_dir($dir)) {
            $old = umask(0077);
            $made = @mkdir($dir, 0700, true);
            umask($old);
            if (!$made && !is_dir($dir)) {
                return false;
            }
        }
        $ht = $dir . '/.htaccess';
        if (!is_file($ht)) {
            @file_put_contents($ht, "Require all denied\n");
        }
        return true;
    }

    public function version(): int
    {
        return (int) $this->pdo->query('PRAGMA user_version')->fetchColumn();
    }

    private function migrate(): void
    {
        if ($this->version() >= self::latest()) {
            return;
        }
        $this->write(function (): void {
            $v = $this->version();   // again, inside the lock: another request may have migrated meanwhile
            foreach (self::MIGRATIONS as $to => $statements) {
                if ($to <= $v) {
                    continue;
                }
                foreach ($statements as $sql) {
                    $this->pdo->exec($sql);
                }
                $this->pdo->exec('PRAGMA user_version = ' . (int) $to);
            }
        });
    }

    /**
     * Runs $fn in a write transaction (BEGIN IMMEDIATE: the write lock is taken at the start, so concurrent
     * requests queue instead of failing halfway) and returns its result.
     *
     * @template T
     * @param callable():T $fn
     * @return T
     */
    public function write(callable $fn): mixed
    {
        $this->pdo->exec('BEGIN IMMEDIATE');
        try {
            $out = $fn();
            $this->pdo->exec('COMMIT');
            return $out;
        } catch (\Throwable $e) {
            try {
                $this->pdo->exec('ROLLBACK');
            } catch (\Throwable) {
            }
            throw $e;
        }
    }

    /**
     * @param array<int|string,mixed> $args
     * @return list<array<string,mixed>>
     */
    public function all(string $sql, array $args = []): array
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($args);
        return $st->fetchAll();
    }

    /**
     * @param array<int|string,mixed> $args
     * @return array<string,mixed>|null
     */
    public function one(string $sql, array $args = []): ?array
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($args);
        $row = $st->fetch();
        return $row === false ? null : $row;
    }

    /**
     * @param array<int|string,mixed> $args
     * @return int rows changed
     */
    public function run(string $sql, array $args = []): int
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($args);
        return $st->rowCount();
    }

    public function lastId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    /** Forgets what has expired. Cheap: every table has an index on its expiry. */
    public function prune(int $now): void
    {
        $this->run('DELETE FROM codes WHERE expires_at <= ?', [$now]);
        $this->run('DELETE FROM sessions WHERE expires_at <= ?', [$now]);
        $this->run('DELETE FROM admin_sessions WHERE expires_at <= ?', [$now]);
        $this->run('DELETE FROM hits WHERE at <= ?', [$now - 86400 - 60]);
    }
}
