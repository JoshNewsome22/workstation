<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * What the relay needs before it can run, checked on every request (cheap), and the first-run step that
 * makes config.php from config.sample.php with a new random PEPPER.
 */
final class Setup
{
    public const EXTENSIONS = ['pdo_sqlite', 'curl', 'openssl', 'json', 'mbstring'];

    /** One check: what it is, whether it passed, and what to do about it. */
    public static function item(string $what, bool $ok, string $fix = ''): array
    {
        return ['what' => $what, 'ok' => $ok, 'fix' => $fix];
    }

    /** @return list<string> the PHP extensions this server lacks */
    public static function missingExtensions(): array
    {
        return array_values(array_filter(self::EXTENSIONS, static fn (string $e): bool => !extension_loaded($e)));
    }

    public static function vendorReady(string $root): bool
    {
        return is_file($root . '/vendor/autoload.php') && is_dir($root . '/vendor/anthropic-ai/sdk/src');
    }

    /**
     * True when the nbh-relay folder sits inside the web folder (where its files could be fetched). The
     * document root is the server's; on cPanel it is ~/public_html.
     */
    public static function insideWebRoot(string $root, string $docRoot): bool
    {
        if ($docRoot === '') {
            return false;
        }
        $r = realpath($root);
        $d = realpath($docRoot);
        if ($r === false || $d === false) {
            return false;
        }
        return $r === $d || str_starts_with($r . '/', rtrim($d, '/') . '/');
    }

    /**
     * Makes config.php from config.sample.php, with a new PEPPER, readable by this account only.
     * Returns null when config.php exists or was made, or a plain message when it could not be made.
     */
    public static function ensureConfig(string $root): ?string
    {
        $file = $root . '/config.php';
        if (is_file($file)) {
            return null;
        }
        $sample = $root . '/config.sample.php';
        $text = is_file($sample) ? file_get_contents($sample) : false;
        if ($text === false) {
            return 'nbh-relay/config.sample.php is missing: upload the relay again.';
        }
        $count = 0;
        $text = preg_replace("/'PEPPER'\s*=>\s*''/", "'PEPPER' => '" . Crypto::newPepper() . "'", $text, 1, $count);
        if ($text === null || $count !== 1) {
            return 'nbh-relay/config.sample.php has been changed: upload the relay again.';
        }
        $old = umask(0077);
        $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
        $ok = @file_put_contents($tmp, $text) !== false;
        umask($old);
        if ($ok) {
            @chmod($tmp, 0600);
            if (is_file($file)) {
                @unlink($tmp);   // another request made it a moment ago
            } else {
                $ok = @rename($tmp, $file);   // whole file or nothing
            }
        }
        if (!$ok || !is_file($file)) {
            @unlink($tmp);
            return 'config.php could not be created in the nbh-relay folder. In File Manager, copy config.sample.php to config.php, then reload this page.';
        }
        return null;
    }

    /**
     * config.php (it holds the API key), the data folder and the database are for this account only. One
     * copied in File Manager, or brought back from a backup, gets the usual 644 that other accounts on a shared
     * server can read: the relay sets it back to 600 (folders 700) itself wherever it may, which is wherever
     * PHP runs as the account that owns the files (as usual on cPanel). Returns a note for each one it could
     * not tighten, for the setup and admin pages.
     *
     * @return list<string>
     */
    public static function tightenPermissions(string $root, string $dataDir): array
    {
        $notes = [];
        foreach ([[$root . '/config.php', 0600, 'nbh-relay/config.php'], [$dataDir, 0700, 'the data folder'], [$dataDir . '/' . Db::FILE, 0600, 'relay.sqlite']] as [$path, $mode, $name]) {
            if (!file_exists($path)) {
                continue;
            }
            $perms = @fileperms($path);
            if ($perms === false || ($perms & 0077) === 0) {
                continue;
            }
            if (@chmod($path, $mode)) {
                clearstatcache(true, $path);
                if (((int) @fileperms($path) & 0077) === 0) {
                    continue;
                }
            }
            if ($perms & 0004) {
                $notes[] = $name . ' can be read by other accounts on this server, and the relay may not change that here (PHP runs as another user than the file\'s owner). Ask your host whether it can be set to ' . sprintf('%o', $mode) . ' with the website still able to read it.';
            }
        }
        return $notes;
    }

    /** True when the PHP version, the extensions and the vendor folder are all there. */
    public static function platformOk(string $root): bool
    {
        return self::missingExtensions() === [] && self::vendorReady($root);
    }

    /**
     * Everything the setup page shows, in order.
     *
     * @return list<array{what:string,ok:bool,fix:string}>
     */
    public static function checklist(string $root, string $docRoot, ?Config $config, ?string $configError, ?string $dbError): array
    {
        $items = [];
        $items[] = self::item('PHP ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . ' (8.1 or newer is needed)', PHP_VERSION_ID >= 80100,
            'In cPanel, open "MultiPHP Manager" (or "Select PHP Version") and choose PHP 8.1 or newer for this domain.');
        $missing = self::missingExtensions();
        $items[] = self::item('PHP extensions: ' . implode(', ', self::EXTENSIONS), $missing === [],
            'Missing: ' . implode(', ', $missing) . '. In cPanel, open "Select PHP Version" > Extensions and tick them (or ask GoDaddy support to enable them).');
        $items[] = self::item('The relay\'s program files (nbh-relay/vendor)', self::vendorReady($root),
            'Upload and extract nbh-relay-upload.zip again: the vendor folder inside nbh-relay is missing or incomplete.');
        $items[] = self::item('nbh-relay is outside the web folder', !self::insideWebRoot($root, $docRoot),
            'The nbh-relay folder is inside public_html, where its files could be downloaded. In File Manager, move it to your home folder, next to public_html (not inside it).');
        if ($configError !== null) {
            $items[] = self::item('Settings file (nbh-relay/config.php)', false, $configError);
        } elseif ($config !== null) {
            $general = $config->generalProblems();
            $items[] = self::item('Settings file (nbh-relay/config.php)', $general === [], implode(' ', $general));
            if (!isset($config->problems['_file'])) {
                $items[] = self::item('Anthropic API key (ANTHROPIC_API_KEY in config.php)', $config->keyOk(),
                    $config->problems['ANTHROPIC_API_KEY'] ?? 'Open nbh-relay/config.php in File Manager (Edit), paste your API key between the quotes after ANTHROPIC_API_KEY, and save.');
                $items[] = self::item('Admin password (ADMIN_PASSWORD_HASH in config.php)', $config->hashOk(),
                    $config->problems['ADMIN_PASSWORD_HASH'] ?? 'Choose the admin password below. This page makes the line to paste into config.php.');
            }
        }
        if ($dbError !== null) {
            $items[] = self::item('Database (nbh-relay/data/relay.sqlite)', false, $dbError);
        }
        return $items;
    }
}
