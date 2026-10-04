<?php
/*
 * A local stand-in for the Anthropic Messages API, for the relay's tests (run with PHP's built-in server:
 * MOCK_DIR=<folder> php -S 127.0.0.1:<port> tests/mock-anthropic.php). Nothing here reaches the internet.
 *
 * Every request is appended to <MOCK_DIR>/requests.jsonl (method, path, headers, body), and answered as
 * <MOCK_DIR>/scenario.json says:
 *   {"mode":"ok"}                  a rewrite, built from the text between the tags (placeholders kept)
 *   {"mode":"ok","drop":"[Name 1]"} the same, with that placeholder left out
 *   {"mode":"thinking"}            a thinking block (empty text, as the model returns it) before the answer
 *   {"mode":"fallback"}            a server-side fallback: a fallback block, then the substitute model's answer
 *   {"mode":"refusal"}             stop_reason "refusal", no content (the whole fallback chain declined)
 *   {"mode":"max_tokens"}          stop_reason "max_tokens", the JSON cut off
 *   {"mode":"bad_json"}            end_turn with text that is not the schema's JSON
 *   {"mode":"status","status":429,"type":"rate_limit_error","retry_after":"1","times":1}
 *                                  that error for the first <times> requests (all of them when times is 0), then "ok"
 *   {"mode":"slow","seconds":3}    "ok" after a pause
 *   {"mode":"no_fallbacks"}        a 400 naming "fallbacks" when the request has them (an account without the
 *                                  beta), "ok" when it has not
 * A scenario counts its requests in <MOCK_DIR>/count (the tests reset it with the scenario).
 */

declare(strict_types=1);

$dir = getenv('MOCK_DIR') ?: sys_get_temp_dir() . '/nbh-mock-anthropic';
@mkdir($dir, 0700, true);

$raw = file_get_contents('php://input') ?: '';
$headers = [];
foreach ($_SERVER as $k => $v) {
    if (is_string($v) && str_starts_with($k, 'HTTP_')) {
        $headers[strtolower(str_replace('_', '-', substr($k, 5)))] = $v;
    }
}
if (isset($_SERVER['CONTENT_TYPE'])) {
    $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
}
$body = json_decode($raw, true);
file_put_contents($dir . '/requests.jsonl', json_encode([
    't' => microtime(true),
    'method' => $_SERVER['REQUEST_METHOD'] ?? '',
    'path' => $_SERVER['REQUEST_URI'] ?? '',
    'headers' => $headers,
    'body' => $body,
    'raw_bytes' => strlen($raw),
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

$scenario = json_decode((string) @file_get_contents($dir . '/scenario.json'), true) ?: ['mode' => 'ok'];
$fp = fopen($dir . '/count', 'c+');
flock($fp, LOCK_EX);
$n = (int) stream_get_contents($fp) + 1;
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, (string) $n);
flock($fp, LOCK_UN);
fclose($fp);

function send(int $status, array $data, array $extra = []): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    header('request-id: req_mock_' . bin2hex(random_bytes(6)));
    foreach ($extra as $k => $v) {
        header($k . ': ' . $v);
    }
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function message(array $content, string $stop, ?array $details = null, string $model = ''): array
{
    return [
        'id' => 'msg_mock_' . bin2hex(random_bytes(6)),
        'type' => 'message',
        'role' => 'assistant',
        'model' => $model !== '' ? $model : (string) ($GLOBALS['body']['model'] ?? 'unknown'),
        'content' => $content,
        'stop_reason' => $stop,
        'stop_sequence' => null,
        'stop_details' => $details,
        'usage' => [
            'input_tokens' => 900,
            'output_tokens' => 300,
            'cache_creation_input_tokens' => 0,
            'cache_read_input_tokens' => 0,
            'service_tier' => 'standard',
        ],
        'container' => null,
        'context_management' => null,
        'diagnostics' => null,
    ];
}

/** The text between the tags in the user turn, and the style named before it. */
function sent(): array
{
    $user = (string) ($GLOBALS['body']['messages'][0]['content'] ?? '');
    $text = preg_match('~<text_to_rewrite>\n(.*)\n</text_to_rewrite>$~s', $user, $m) ? $m[1] : '';
    $style = preg_match('~^Style: (.+)$~m', $user, $s) ? $s[1] : '';
    return [$text, $style];
}

function answer(?string $drop = null): string
{
    [$text, $style] = sent();
    $out = str_ireplace(['was upset', 'had a tantrum', 'a lot'], ['cried', 'screamed and dropped to the floor', '[number] times'], $text);
    if ($drop !== null) {
        $out = str_replace($drop, 'someone', $out);
    }
    return json_encode([
        'text' => "(" . $style . ") " . $out,
        'changes' => ['"was upset" became the crying the text describes.', ' ', 7],
        'cautions' => str_contains($out, '[number]') ? ['Fill in [number] with the count you took.'] : [],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !str_starts_with((string) ($_SERVER['REQUEST_URI'] ?? ''), '/v1/messages')) {
    send(404, ['type' => 'error', 'error' => ['type' => 'not_found_error', 'message' => 'Not found']]);
}
if (($headers['x-api-key'] ?? '') === '' || ($headers['anthropic-version'] ?? '') === '') {
    send(401, ['type' => 'error', 'error' => ['type' => 'authentication_error', 'message' => 'missing x-api-key or anthropic-version']]);
}
if (($headers['x-api-key'] ?? '') === 'sk-ant-mock-rejected-key-0000000000') {
    send(401, ['type' => 'error', 'error' => ['type' => 'authentication_error', 'message' => 'invalid x-api-key']]);
}

$mode = (string) ($scenario['mode'] ?? 'ok');
if ($mode === 'status') {
    $times = (int) ($scenario['times'] ?? 0);
    if ($times === 0 || $n <= $times) {
        $extra = isset($scenario['retry_after']) ? ['retry-after' => (string) $scenario['retry_after']] : [];
        send((int) $scenario['status'], ['type' => 'error', 'error' => ['type' => (string) ($scenario['type'] ?? 'api_error'), 'message' => 'mock error']], $extra);
    }
    $mode = 'ok';
}
if ($mode === 'no_fallbacks') {
    if (array_key_exists('fallbacks', (array) $body) || isset($headers['anthropic-beta'])) {
        send(400, ['type' => 'error', 'error' => ['type' => 'invalid_request_error', 'message' => 'fallbacks: Extra inputs are not permitted']]);
    }
    $mode = 'ok';
}
if ($mode === 'slow') {
    usleep((int) (((float) ($scenario['seconds'] ?? 3)) * 1e6));
    $mode = 'ok';
}

switch ($mode) {
    case 'ok':
        send(200, message([['type' => 'text', 'text' => answer($scenario['drop'] ?? null)]], 'end_turn'));
        // no break
    case 'thinking':
        send(200, message([['type' => 'thinking', 'thinking' => '', 'signature' => 'mock-signature'], ['type' => 'text', 'text' => answer()]], 'end_turn'));
        // no break
    case 'fallback':
        send(200, message([
            ['type' => 'fallback', 'from' => ['model' => (string) ($body['model'] ?? '')], 'to' => ['model' => 'mock-substitute-model'], 'trigger' => ['type' => 'refusal', 'category' => 'cyber']],
            ['type' => 'text', 'text' => answer()],
        ], 'end_turn', null, 'mock-substitute-model'));
        // no break
    case 'refusal':
        send(200, message([], 'refusal', [
            'type' => 'refusal', 'category' => 'cyber', 'explanation' => null,
            'fallback_credit_token' => null, 'fallback_has_prefill_claim' => null, 'recommended_model' => null,
        ]));
        // no break
    case 'max_tokens':
        send(200, message([['type' => 'text', 'text' => '{"text":"(cut off']], 'max_tokens'));
        // no break
    case 'bad_json':
        send(200, message([['type' => 'text', 'text' => 'Here is your rewrite: it is fine.']], 'end_turn'));
        // no break
    default:
        send(500, ['type' => 'error', 'error' => ['type' => 'api_error', 'message' => 'unknown mock mode']]);
}
