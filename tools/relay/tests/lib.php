<?php
/*
 * Helpers for the relay's tests: checks, an HTTP client (curl), the test site's config, the mock's scenario.
 */

declare(strict_types=1);

final class T
{
    public static int $pass = 0;
    public static int $fail = 0;
    /** @var list<string> */
    public static array $failures = [];
    public static string $section = '';

    public static function section(string $title): void
    {
        self::$section = $title;
        fwrite(STDOUT, "\n== $title\n");
    }

    public static function ok(bool $cond, string $name, mixed $detail = null): bool
    {
        if ($cond) {
            self::$pass++;
            fwrite(STDOUT, "  ok    $name\n");
        } else {
            self::$fail++;
            $d = $detail === null ? '' : ' :: ' . substr(is_string($detail) ? $detail : json_encode($detail, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR), 0, 600);
            self::$failures[] = self::$section . ' / ' . $name . $d;
            fwrite(STDOUT, "  FAIL  $name$d\n");
        }
        return $cond;
    }

    public static function eq(mixed $want, mixed $got, string $name): bool
    {
        return self::ok($want === $got, $name, ['want' => $want, 'got' => $got]);
    }

    public static function finish(string $suite): never
    {
        fwrite(STDOUT, "\n$suite: " . self::$pass . ' passed, ' . self::$fail . " failed\n");
        foreach (self::$failures as $f) {
            fwrite(STDOUT, "  - $f\n");
        }
        exit(self::$fail === 0 ? 0 : 1);
    }
}

/**
 * One HTTP request. $o: headers (name => value), json (encoded as the body), body (raw), timeout (seconds).
 *
 * @return array{status:int,headers:array<string,list<string>>,body:string,json:mixed,time:float}
 */
function http(string $method, string $url, array $o = []): array
{
    $ch = curl_init($url);
    $headers = [];
    foreach ($o['headers'] ?? [] as $k => $v) {
        $headers[] = $k . ': ' . $v;
    }
    if (array_key_exists('json', $o)) {
        $o['body'] = json_encode($o['json'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (!isset($o['headers']['Content-Type'])) {
            $headers[] = 'Content-Type: application/json';
        }
    }
    $got = [];
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => $o['timeout'] ?? 60,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PATH_AS_IS => true,
        CURLOPT_NOBODY => $method === 'HEAD',
        CURLOPT_HEADERFUNCTION => static function ($c, string $line) use (&$got): int {
            $p = strpos($line, ':');
            if ($p !== false) {
                $got[strtolower(trim(substr($line, 0, $p)))][] = trim(substr($line, $p + 1));
            }
            return strlen($line);
        },
    ]);
    if (isset($o['body'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $o['body']);
    }
    $t = microtime(true);
    $body = curl_exec($ch);
    $time = microtime(true) - $t;
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $body = is_string($body) ? $body : '';
    return ['status' => $status, 'headers' => $got, 'body' => $body, 'json' => json_decode($body, true), 'time' => $time];
}

function hdr(array $r, string $name): string
{
    return $r['headers'][strtolower($name)][0] ?? '';
}

/** Several requests at the same moment (curl_multi). @param list<array{0:string,1:string,2:array}> $reqs */
function http_parallel(array $reqs): array
{
    $mh = curl_multi_init();
    $handles = [];
    foreach ($reqs as $i => [$method, $url, $o]) {
        $ch = curl_init($url);
        $h = [];
        foreach ($o['headers'] ?? [] as $k => $v) {
            $h[] = "$k: $v";
        }
        $h[] = 'Content-Type: application/json';
        curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $h,
            CURLOPT_POSTFIELDS => json_encode($o['json'] ?? new stdClass()), CURLOPT_TIMEOUT => 60]);
        curl_multi_add_handle($mh, $ch);
        $handles[$i] = $ch;
    }
    do {
        $st = curl_multi_exec($mh, $running);
        if ($running) {
            curl_multi_select($mh, 1.0);
        }
    } while ($running && $st === CURLM_OK);
    $out = [];
    foreach ($handles as $i => $ch) {
        $body = (string) curl_multi_getcontent($ch);
        $out[$i] = ['status' => (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE), 'body' => $body, 'json' => json_decode($body, true)];
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);
    return $out;
}

final class Site
{
    /** @var array<string,mixed> */
    public array $config = [];

    public function __construct(public string $home, public string $url, public string $mockDir, public string $mockUrl)
    {
    }

    public function relayDir(): string
    {
        return $this->home . '/nbh-relay';
    }

    public function configFile(): string
    {
        return $this->relayDir() . '/config.php';
    }

    /** @param array<string,mixed> $values */
    public function writeConfig(array $values): void
    {
        $this->config = $values;
        $php = "<?php\nreturn " . var_export($values, true) . ";\n";
        $tmp = $this->configFile() . '.tmp';
        file_put_contents($tmp, $php);
        chmod($tmp, 0600);
        rename($tmp, $this->configFile());
        clearstatcache();
    }

    /** @param array<string,mixed> $changes */
    public function patchConfig(array $changes): void
    {
        $this->writeConfig(array_merge($this->config, $changes));
    }

    public function writeRawConfig(string $php): void
    {
        file_put_contents($this->configFile(), $php);
        clearstatcache();
    }

    public function db(): PDO
    {
        $pdo = new PDO('sqlite:' . $this->relayDir() . '/data/relay.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_TIMEOUT, 10);
        return $pdo;
    }

    /** @param array<string,mixed> $s */
    public function scenario(array $s): void
    {
        file_put_contents($this->mockDir . '/scenario.json', json_encode($s));
        file_put_contents($this->mockDir . '/requests.jsonl', '');
        file_put_contents($this->mockDir . '/count', '0');
    }

    /** @return list<array<string,mixed>> what the mock received since the scenario was set */
    public function mockRequests(): array
    {
        $out = [];
        foreach (file($this->mockDir . '/requests.jsonl', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $out[] = json_decode($line, true);
        }
        return $out;
    }

    public function log(): string
    {
        $f = $this->relayDir() . '/data/relay-errors.log';
        clearstatcache();
        return is_file($f) ? (string) file_get_contents($f) : '';
    }
}
