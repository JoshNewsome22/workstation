<?php
/* NBH reply box (v21.65): where a respondent page's answers come back to Form IA-1 without an email.
   The page encrypts the answers on the respondent's device to the form's own public key (ECDH P-256, HKDF, AES-GCM) and
   posts the ciphertext here; the form lists the replies with its read token and decrypts them itself. This program keeps
   only what it cannot read: a box id, a hash of the read token, the ciphertexts and their times. It needs PHP 8.1 or
   newer, a writable data folder, and nothing else (no database, no composer).

   Boxes:    POST ?a=new            {b, t}        b: box id (32 hex), t: sha256 of the read token (64 hex)
   Replies:  POST ?a=put&b=<id>     {v,k,iv,ct}   the reply, up to 64 KB; the body may be text/plain
             GET  ?a=list&b=<id>&t=<token>        the replies (id, at, k, iv, ct) for the token's box
             POST ?a=del&b=<id>     {t, ids}      removes replies the form has collected
             POST ?a=drop&b=<id>    {t}           removes the box
   Health:   GET  ?a=ping
   A reply older than DAYS days is removed when its box is next touched; a box no reply has reached in DAYS days and
   whose token is older than that is removed too. Every answer is JSON. Requests from any page are allowed (CORS *):
   what they carry cannot be read here, and a page opened from an email attachment has no origin of its own. */
declare(strict_types=1);
const DAYS = 60;              // how long a reply waits to be collected
const MAX_BODY = 65536;       // bytes per reply
const MAX_REPLIES = 300;      // per box
const MAX_PER_HOUR = 120;     // puts from one address
$DATA = getenv('NBH_REPLY_DATA') ?: __DIR__ . '/data';   // move it outside public_html if you can: a folder PHP can write to

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 600');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function out(int $code, array $o): void { http_response_code($code); echo json_encode($o, JSON_UNESCAPED_SLASHES); exit; }
function bad(int $code, string $why): void { out($code, ['ok' => false, 'error' => $why]); }
function hex(?string $v, int $len): string { $v = strtolower(trim((string) $v)); return preg_match('/^[a-f0-9]{' . $len . '}$/', $v) ? $v : ''; }
function body(): array {
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
    if ($raw === false || strlen($raw) > MAX_BODY) bad(413, 'too large');
    $o = json_decode($raw, true);
    return is_array($o) ? $o : [];
}
function boxDir(string $data, string $b): string { return $data . '/' . $b; }
function ensureData(string $data): void {
    if (!is_dir($data)) @mkdir($data, 0700, true);
    if (!is_dir($data) || !is_writable($data)) bad(500, 'the data folder cannot be written');
    if (!is_file($data . '/.htaccess')) @file_put_contents($data . '/.htaccess', "Require all denied\n");   // also for a folder made by hand
}
function sweep(string $dir): void {   // a box's replies past their time
    $cut = time() - DAYS * 86400;
    foreach (glob($dir . '/r-*.json') ?: [] as $f) { if (@filemtime($f) < $cut) @unlink($f); }
}
function sweepBoxes(string $data): void {   // now and then, boxes nothing has reached for DAYS days
    $mark = $data . '/.sweep';
    if (is_file($mark) && filemtime($mark) > time() - 86400) return;
    @touch($mark);
    $cut = time() - DAYS * 86400;
    foreach (glob($data . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        if (!is_file($dir . '/token')) continue;
        $latest = @filemtime($dir . '/token');
        foreach (glob($dir . '/r-*.json') ?: [] as $f) $latest = max($latest, (int) @filemtime($f));
        if ($latest < $cut) { foreach (glob($dir . '/*') ?: [] as $f) @unlink($f); @unlink($dir . '/.htaccess'); @rmdir($dir); }
    }
}
function tokenOk(string $dir, ?string $t): bool {
    $t = hex($t, 32); if ($t === '') return false;
    $have = @file_get_contents($dir . '/token');
    return is_string($have) && hash_equals(trim($have), hash('sha256', $t));
}
function rate(string $data): void {   // puts from one address, per hour
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($ip === '') return;
    $d = $data . '/_ip'; if (!is_dir($d)) @mkdir($d, 0700);
    $f = $d . '/' . hash('sha256', $ip) . '.cnt';
    $n = 0; $at = 0;
    if (is_file($f)) { [$n, $at] = array_map('intval', explode(' ', (string) @file_get_contents($f)) + [0, 0]); }
    if ($at < time() - 3600) { $n = 0; $at = time(); }
    if ($n >= MAX_PER_HOUR) bad(429, 'too many replies from this address; try again later');
    @file_put_contents($f, ($n + 1) . ' ' . $at);
}

$a = $_GET['a'] ?? '';
$m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($a === 'ping') out(200, ['ok' => true, 'v' => 1, 'days' => DAYS]);
ensureData($DATA);
sweepBoxes($DATA);

if ($a === 'new') {
    if ($m !== 'POST') bad(405, 'POST');
    $o = body();
    $b = hex($o['b'] ?? '', 32); $t = hex($o['t'] ?? '', 64);
    if ($b === '' || $t === '') bad(400, 'box id and token hash needed');
    $dir = boxDir($DATA, $b);
    if (is_dir($dir) && is_file($dir . '/token')) {
        if (!hash_equals(trim((string) file_get_contents($dir . '/token')), $t)) bad(409, 'that box belongs to another form');
        @touch($dir . '/token'); out(200, ['ok' => true, 'b' => $b, 'had' => true]);
    }
    if (!@mkdir($dir, 0700, true) && !is_dir($dir)) bad(500, 'the box could not be made');
    @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    if (@file_put_contents($dir . '/token', $t . "\n") === false) bad(500, 'the box could not be made');
    out(200, ['ok' => true, 'b' => $b, 'had' => false]);
}

$b = hex($_GET['b'] ?? '', 32);
if ($b === '') bad(400, 'box id needed');
$dir = boxDir($DATA, $b);
if (!is_dir($dir) || !is_file($dir . '/token')) bad(404, 'no such box');
sweep($dir);

if ($a === 'put') {
    if ($m !== 'POST') bad(405, 'POST');
    rate($DATA);
    $o = body();
    $k = $o['k'] ?? null;
    if (($o['v'] ?? 0) !== 1 || !is_array($k) || !preg_match('/^[A-Za-z0-9_-]{40,50}$/', (string) ($k['x'] ?? '')) || !preg_match('/^[A-Za-z0-9_-]{40,50}$/', (string) ($k['y'] ?? ''))
        || !preg_match('/^[A-Za-z0-9_-]{12,24}$/', (string) ($o['iv'] ?? '')) || !preg_match('/^[A-Za-z0-9_-]{24,}$/', (string) ($o['ct'] ?? ''))) bad(400, 'not a reply');
    if (count(glob($dir . '/r-*.json') ?: []) >= MAX_REPLIES) bad(507, 'the box is full');
    $id = 'r-' . time() . '-' . bin2hex(random_bytes(6));
    $rec = ['id' => $id, 'at' => gmdate('c'), 'k' => ['x' => $k['x'], 'y' => $k['y']], 'iv' => $o['iv'], 'ct' => $o['ct']];
    if (@file_put_contents($dir . '/' . $id . '.json', json_encode($rec, JSON_UNESCAPED_SLASHES), LOCK_EX) === false) bad(500, 'the reply could not be kept');
    out(200, ['ok' => true, 'id' => $id]);
}
if ($a === 'list') {
    if (!tokenOk($dir, $_GET['t'] ?? '')) bad(403, 'wrong token');
    $out = [];
    foreach (glob($dir . '/r-*.json') ?: [] as $f) { $r = json_decode((string) @file_get_contents($f), true); if (is_array($r) && isset($r['ct'])) $out[] = $r; }
    usort($out, fn($x, $y) => strcmp($x['id'], $y['id']));
    @touch($dir . '/token');
    out(200, ['ok' => true, 'b' => $b, 'count' => count($out), 'replies' => $out]);
}
if ($a === 'del' || $a === 'drop') {
    if ($m !== 'POST') bad(405, 'POST');
    $o = body();
    if (!tokenOk($dir, $o['t'] ?? '')) bad(403, 'wrong token');
    $n = 0;
    if ($a === 'drop') { foreach (glob($dir . '/*') ?: [] as $f) { @unlink($f); $n++; } @unlink($dir . '/.htaccess'); @rmdir($dir); out(200, ['ok' => true, 'dropped' => true]); }
    foreach ((array) ($o['ids'] ?? []) as $id) { if (preg_match('/^r-\d+-[a-f0-9]{12}$/', (string) $id) && @unlink($dir . '/' . $id . '.json')) $n++; }
    out(200, ['ok' => true, 'deleted' => $n]);
}
bad(400, 'unknown request');
