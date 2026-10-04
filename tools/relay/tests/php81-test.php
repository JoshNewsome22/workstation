<?php
/*
 * The relay under PHP 8.1, the oldest version it supports (GoDaddy's cPanel offers 8.1 and newer). Run by
 * tests/run.sh with php-wasm (PHP compiled to WebAssembly, from npm), which has no web server, so requests are
 * built directly and handed to the relay's App, one fresh App per request as on a real server:
 *
 *   PHP=8.1 node .../php-wasm.js tests/php81-test.php --home <extracted zip> --mock-url http://127.0.0.1:M
 *                                                      --mock-dir <dir> --source tools/relay
 *
 * Checks: every PHP file of the upload parses with 8.1's own parser; every class (the relay's and the SDK's)
 * loads; sign-in, passcodes, redeem and rewrite run, the rewrite through the SDK and curl to the mock.
 */

declare(strict_types=1);

require __DIR__ . '/lib.php';

$opt = getopt('', ['home:', 'mock-url:', 'mock-dir:', 'source:']);
foreach (['home', 'mock-url', 'mock-dir'] as $k) {
    if (empty($opt[$k])) {
        fwrite(STDERR, "php81-test: --$k is required\n");
        exit(2);
    }
}
$home = rtrim($opt['home'], '/');
$root = $home . '/nbh-relay';
$site = new Site($home, '', $opt['mock-dir'], $opt['mock-url']);

T::section('PHP ' . PHP_VERSION);
T::ok(PHP_MAJOR_VERSION === 8 && PHP_MINOR_VERSION === 1, 'this is PHP 8.1');
foreach (['pdo_sqlite', 'curl', 'openssl', 'json', 'mbstring'] as $ext) {
    T::ok(extension_loaded($ext), "extension $ext");
}

T::section('Every file of the upload parses with PHP 8.1');
$files = [$home . '/public_html/ai/index.php'];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
    if (substr($f->getFilename(), -4) === '.php') {
        $files[] = $f->getPathname();
    }
}
$bad = [];
foreach ($files as $f) {
    try {
        token_get_all((string) file_get_contents($f), TOKEN_PARSE);
    } catch (ParseError $e) {
        $bad[] = substr($f, strlen($home) + 1) . ':' . $e->getLine() . ' ' . $e->getMessage();
    }
}
T::eq([], $bad, count($files) . ' files parse');

T::section('Every class loads');
define('NBH_RELAY_NO_RUN', true);
require $root . '/bootstrap.php';
$own = [];
foreach (glob($root . '/src/*.php') ?: [] as $f) {
    $class = 'NBH\\Relay\\' . basename($f, '.php');
    try {
        if (!class_exists($class)) {
            $own[] = "$class: not found";
        }
    } catch (Throwable $e) {
        $own[] = "$class: " . get_class($e) . ' ' . $e->getMessage();
    }
}
T::eq([], $own, 'the relay\'s ' . count(glob($root . '/src/*.php') ?: []) . ' classes');
$map = require $root . '/vendor/composer/autoload_classmap.php';
$failed = [];
$loaded = 0;
foreach ($map as $class => $file) {
    if (preg_match('~^Anthropic\\\\(Bedrock|Vertex|Aws|GoogleCloud|Foundry)\\\\|Mcp~', $class)) {
        continue;   // cloud and MCP integrations that need packages the relay does not ship
    }
    try {
        if (class_exists($class) || interface_exists($class) || trait_exists($class) || enum_exists($class)) {
            $loaded++;
        } else {
            $failed[] = $class;
        }
    } catch (Throwable $e) {
        $failed[] = $class . ': ' . $e->getMessage();
    }
}
T::ok($failed === [] && $loaded > 2000, "the SDK and its dependencies: $loaded classes", array_slice($failed, 0, 5));

use NBH\Relay\App;
use NBH\Relay\Claude;
use NBH\Relay\Crypto;
use NBH\Relay\Request;
use NBH\Relay\Response;

T::section('The relay runs on PHP 8.1 (in-process requests, the SDK over curl to the mock)');
$ORIGIN = 'https://forms.example';
/** one request, through a fresh App, as one web request would be */
$call = static function (string $method, string $path, ?array $json = null, array $headers = []) use ($root, $ORIGIN): Response {
    $h = array_change_key_case($headers) + ($method === 'POST' ? ['origin' => $ORIGIN] : []);
    if ($json !== null) {
        $h['content-type'] = 'application/json';
    }
    $req = new Request($method, $path, '/ai', $h, $json === null ? '' : (string) json_encode($json), false, '203.0.113.7', true, '');
    return (new App($root))->handle($req);
};
$r = $call('GET', '/admin');
T::ok($r->status === 200 && is_file($root . '/config.php'), 'the first request makes config.php');
$made = (static fn ($f) => require $f)($root . '/config.php');
$pw = 'php81 password test';
$hash = Crypto::hashPassword($pw);
T::ok(password_verify($pw, $hash), 'password_hash works (' . (str_starts_with($hash, '$argon2id$') ? 'Argon2id' : 'bcrypt') . ')');
$site->writeConfig([
    'ANTHROPIC_API_KEY' => 'sk-ant-mock-key-php81-0123456789',
    'ADMIN_PASSWORD_HASH' => $hash,
    'PEPPER' => $made['PEPPER'],
    'ALLOWED_ORIGINS' => [$ORIGIN],
    'API_BASE_URL' => $opt['mock-url'],
    'TIMEOUT_SECONDS' => 20,
]);
$r = $call('GET', '/admin');
T::ok($r->status === 200 && str_contains($r->body, 'id="f-signin"'), 'GET /admin: the sign-in page');
$r = $call('POST', '/api/admin/login', ['password' => $pw]);
T::eq(200, $r->status, 'sign in');
$cookie = explode(';', $r->cookies[0] ?? '')[0];
$csrf = (string) (json_decode($r->body, true)['csrf'] ?? '');
$admin = ['cookie' => $cookie, 'x-csrf-token' => $csrf];
$r = $call('POST', '/api/admin/codes', ['label' => 'PHP 8.1 check', 'hours' => 2], $admin);
$code = (string) (json_decode($r->body, true)['code'] ?? '');
T::ok($r->status === 201 && Crypto::normalizeCode($code) !== null, 'create a passcode: ' . $code);
$r = $call('POST', '/api/redeem', ['code' => $code]);
$tok = (string) (json_decode($r->body, true)['token'] ?? '');
T::ok($r->status === 200 && Crypto::isToken($tok), 'redeem it');
T::eq(401, $call('POST', '/api/redeem', ['code' => $code])->status, 'once only');

$site->scenario(['mode' => 'ok']);
$r = $call('POST', '/api/rewrite', ['token' => $tok, 'text' => '[Student] was upset when [Name 1] left.', 'style' => 'objective']);
$b = json_decode($r->body, true);
T::ok($r->status === 200 && str_contains((string) ($b['rewrites'][0]['text'] ?? ''), '[Name 1]'), 'a rewrite, through the SDK', $r->body);
$got = $site->mockRequests();
T::ok(count($got) === 1 && ($got[0]['body']['model'] ?? '') === Claude::MODEL && ($got[0]['body']['output_config']['effort'] ?? '') === 'low'
    && ($got[0]['headers']['anthropic-beta'] ?? '') === Claude::FALLBACK_BETA && ($got[0]['body']['fallbacks'] ?? '') === 'default'
    && ($got[0]['body']['system'] ?? '') === Claude::systemPrompt(), 'the API got the same request as on PHP 8.4');
$site->scenario(['mode' => 'refusal']);
T::eq(422, $call('POST', '/api/rewrite', ['token' => $tok, 'text' => 'x y z', 'style' => 'concise'])->status, 'a refusal: 422');
$site->scenario(['mode' => 'status', 'status' => 429, 'type' => 'rate_limit_error', 'retry_after' => '1', 'times' => 1]);
$r = $call('POST', '/api/rewrite', ['token' => $tok, 'text' => 'retry on 8.1', 'style' => 'concise']);
T::ok($r->status === 200 && count($site->mockRequests()) === 2, 'a 429, then the SDK\'s one retry: 200');
$site->scenario(['mode' => 'no_fallbacks']);
$r = $call('POST', '/api/rewrite', ['token' => $tok, 'text' => '[Student] waited on 8.1.', 'style' => 'report']);
$got = $site->mockRequests();
T::ok($r->status === 200 && count($got) === 2 && !isset($got[1]['body']['fallbacks']), 'the fallback opt-in refused: sent again without it (named-argument unpacking on 8.1)');
$r = $call('GET', '/api/admin/state', null, $admin);
$st = json_decode($r->body, true);
T::ok($r->status === 200 && ($st['sessions'][0]['rewrites'] ?? 0) === 4 && ($st['sessions'][0]['label'] ?? '') === 'PHP 8.1 check', 'the admin state counts the four rewrites', $st);

T::finish('php81-test');
