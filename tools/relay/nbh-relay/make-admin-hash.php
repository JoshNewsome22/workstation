<?php
/*
 * Makes the ADMIN_PASSWORD_HASH line for config.php, from cPanel's Terminal:
 *
 *     php ~/nbh-relay/make-admin-hash.php            asks for the new password twice and prints the line
 *     php ~/nbh-relay/make-admin-hash.php --write    ... and puts the line into config.php itself
 *
 * The setup page at https://newsomebh.com/ai/admin does the same without the Terminal. This file cannot be
 * run from the website (it is outside public_html, and it refuses anything but the command line); delete it
 * afterwards if you like.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
if (PHP_VERSION_ID < 80100) {
    fwrite(STDERR, 'This needs PHP 8.1 or newer; the Terminal\'s "php" is ' . PHP_VERSION . ".\n"
        . "Run it with a newer PHP, for example: /opt/cpanel/ea-php83/root/usr/bin/php " . __FILE__ . "\n");
    exit(1);
}
if (!extension_loaded('mbstring')) {
    fwrite(STDERR, "This needs the PHP mbstring extension.\n");
    exit(1);
}

require __DIR__ . '/src/Crypto.php';

use NBH\Relay\Crypto;

function ask(string $prompt): string
{
    $hide = function_exists('posix_isatty') && posix_isatty(STDIN) && function_exists('shell_exec');
    fwrite(STDOUT, $prompt);
    if ($hide) {
        @shell_exec('stty -echo 2>/dev/null');
    }
    $line = fgets(STDIN);
    if ($hide) {
        @shell_exec('stty echo 2>/dev/null');
        fwrite(STDOUT, "\n");
    }
    return $line === false ? '' : rtrim($line, "\r\n");
}

$write = in_array('--write', array_slice($argv, 1), true);
$pw = ask('New admin password: ');
$problem = Crypto::passwordProblem($pw);
if ($problem !== null) {
    fwrite(STDERR, $problem . "\n");
    exit(1);
}
if (ask('The same password again: ') !== $pw) {
    fwrite(STDERR, "The two passwords are not the same. Nothing was changed.\n");
    exit(1);
}
$line = Crypto::hashLine(Crypto::hashPassword($pw));

if (!$write) {
    fwrite(STDOUT, "\nReplace the ADMIN_PASSWORD_HASH line in ~/nbh-relay/config.php with this line:\n\n" . $line . "\n\n");
    exit(0);
}

$file = __DIR__ . '/config.php';
$text = is_file($file) ? file_get_contents($file) : false;
if ($text === false) {
    fwrite(STDERR, "config.php is not there yet: open https://newsomebh.com/ai/admin once (it makes config.php), or copy config.sample.php to config.php. Then run this again.\nThe line is:\n" . $line . "\n");
    exit(1);
}
$count = 0;
// a callback, not a replacement string: a hash has "$" signs that a replacement string would read as references
$new = preg_replace_callback(
    "/^([ \t]*)'ADMIN_PASSWORD_HASH'[ \t]*=>[ \t]*'[^'\n]*',[^\n]*$/m",
    static fn (array $m): string => $m[1] . $line,
    $text,
    -1,
    $count
);
if ($new === null || $count !== 1) {
    fwrite(STDERR, "config.php does not have exactly one ADMIN_PASSWORD_HASH line as in config.sample.php, so it was not changed.\nPut this line in by hand:\n" . $line . "\n");
    exit(1);
}
$tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
$old = umask(0077);
$ok = file_put_contents($tmp, $new) !== false && chmod($tmp, 0600) && rename($tmp, $file);
umask($old);
if (!$ok) {
    @unlink($tmp);
    fwrite(STDERR, "config.php could not be written. Put this line in by hand:\n" . $line . "\n");
    exit(1);
}
fwrite(STDOUT, "Done: config.php has the new admin password. Sign in at https://newsomebh.com/ai/admin\n");
