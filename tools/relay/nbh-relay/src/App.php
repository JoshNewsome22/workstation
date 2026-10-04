<?php

declare(strict_types=1);

namespace NBH\Relay;

/**
 * The relay: every request to /ai/... ends here (public_html/ai/index.php -> bootstrap.php -> App::main).
 *
 * The routes below are the only things it answers; any other path is a 404, whatever files exist. Before a
 * handler runs, in this order: the route and method, HTTPS, then for every POST the Origin (or Referer)
 * against ALLOWED_ORIGINS, a JSON content type, the body size and the JSON itself, then whether the relay is
 * set up enough for that route. No route sends CORS headers: the forms call the relay from the same site.
 */
final class App
{
    /** path => method => [handler, needs] ("core": settings and database; "key": also the API key; "admin": also the admin password) */
    public const ROUTES = [
        '/' => ['GET' => ['home', 'none']],
        '/admin' => ['GET' => ['adminPage', 'none']],
        '/api/health' => ['GET' => ['health', 'none']],
        '/api/redeem' => ['POST' => ['redeem', 'key']],
        '/api/rewrite' => ['POST' => ['rewrite', 'key']],
        '/api/session/end' => ['POST' => ['endSession', 'core']],
        '/api/admin/password-hash' => ['POST' => ['passwordHash', 'core']],
        '/api/admin/login' => ['POST' => ['login', 'admin']],
        '/api/admin/logout' => ['POST' => ['logout', 'admin']],
        '/api/admin/state' => ['GET' => ['state', 'admin']],
        '/api/admin/codes' => ['POST' => ['createCode', 'admin']],
        '/api/admin/codes/revoke' => ['POST' => ['revokeCode', 'admin']],
        '/api/admin/sessions/revoke' => ['POST' => ['revokeSession', 'admin']],
        '/api/admin/sessions/revoke-all' => ['POST' => ['revokeAllSessions', 'admin']],
        '/api/admin/unlock' => ['POST' => ['unlock', 'admin']],
    ];

    public readonly Config $config;
    public readonly Crypto $crypto;
    public readonly int $now;
    public readonly string $dataDir;
    private ?string $configError;
    private ?Db $db = null;
    private ?string $dbError = null;
    private ?Request $request = null;

    public function __construct(public readonly string $root, ?int $now = null)
    {
        $this->now = $now ?? time();
        $this->configError = PHP_VERSION_ID >= 80100 ? Setup::ensureConfig($root) : null;
        $this->config = Config::load($root . '/config.php');
        $dir = $this->config->str('DATA_DIR');
        $this->dataDir = $dir !== '' ? rtrim($dir, '/') : $root . '/data';
        $this->crypto = new Crypto($this->config->str('PEPPER'));
        foreach (Setup::tightenPermissions($root, $this->dataDir) as $note) {
            $this->config->warnings[] = $note;
        }
    }

    public static function main(string $root): void
    {
        $app = new self($root);
        if (PHP_VERSION_ID >= 80100) {
            Db::ensureDir($app->dataDir);
        }
        Log::init($app->dataDir);
        $req = Request::fromGlobals($app->config->maxBodyBytes(), $app->config->str('BASE_PATH'), $app->config->bool('TRUST_PROXY_HTTPS'));
        $app->handle($req)->send($req->method === 'HEAD');
    }

    public function handle(Request $req): Response
    {
        $this->request = $req;
        try {
            $res = $this->dispatch($req);
        } catch (\Throwable $e) {
            Log::exception('unhandled', $e);
            $res = Response::error(500, 'server_error', 'Something went wrong in the rewrite service. Try again later.');
        }
        // HSTS in config.php: browsers that saw this open the whole site with https only, for a year
        if ($req->https && $this->config->bool('HSTS')) {
            $res->headers += ['Strict-Transport-Security' => 'max-age=31536000'];
        }
        return $res;
    }

    private function dispatch(Request $req): Response
    {
        $route = self::ROUTES[$req->path] ?? null;
        if ($route === null) {
            return Response::error(404, 'not_found', 'There is nothing here.');
        }
        $method = $req->method === 'HEAD' ? 'GET' : $req->method;
        if (!isset($route[$method])) {
            return Response::error(405, 'method_not_allowed', 'This address does not take that kind of request.', [], ['Allow' => implode(', ', array_keys($route)) . (isset($route['GET']) ? ', HEAD' : '')]);
        }
        [$handler, $needs] = $route[$method];
        $api = str_starts_with($req->path, '/api/');

        if ($this->config->bool('REQUIRE_HTTPS') && !$req->https) {
            return $api
                ? Response::error(403, 'https_required', 'Use https:// for the rewrite service.')
                : Response::html(403, Pages::message('Use https', 'Open this page with https:// at the start of the address.'));
        }

        $body = [];
        if ($method === 'POST') {
            if (!$this->originAllowed($req)) {
                Log::event('origin_refused', ['path' => $req->path]);
                return Response::error(403, 'origin', 'The rewrite service only answers the forms on its own site.');
            }
            if ($req->bodyTooLarge) {
                return Response::error(413, 'too_long', 'The request is larger than the rewrite service takes.');
            }
            if (!$req->isJson()) {
                return Response::error(415, 'unsupported_media_type', 'Send JSON.');
            }
            $json = $req->json();
            if ($json === null) {
                return Response::error(400, 'bad_request', 'The request could not be read.');
            }
            $body = $json;
        }

        if ($needs !== 'none') {
            $ready = $this->ready($needs);
            if ($ready !== null) {
                return $ready;
            }
        }

        return match ($handler) {
            'home' => new Response(302, '', ['Location' => $req->linkBase() . '/admin']),
            'adminPage' => (new Admin($this))->page($req),
            'health' => $this->health(),
            'redeem' => (new Api($this))->redeem($req, $body),
            'rewrite' => (new Api($this))->rewrite($req, $body),
            'endSession' => (new Api($this))->endSession($req, $body),
            default => (new Admin($this))->{$handler}($req, $body),
        };
    }

    /**
     * Null when the relay is ready for a route that needs $needs, else the answer to give instead.
     */
    private function ready(string $needs): ?Response
    {
        if (!$this->coreReady()) {
            return Response::error(503, 'setup_required', 'The rewrite service is not set up yet.');
        }
        if ($needs === 'key' && (!$this->config->keyOk() || !Setup::vendorReady($this->root))) {
            return Response::error(503, 'setup_required', 'The rewrite service is not set up yet.');
        }
        if ($needs === 'admin' && !$this->config->hashOk()) {
            return Response::error(503, 'setup_required', 'The admin password is not set up yet.');
        }
        return null;
    }

    /** PHP, the extensions, the settings (but the key and the password), the folder layout and the database. */
    public function coreReady(): bool
    {
        return PHP_VERSION_ID >= 80100
            && Setup::missingExtensions() === []
            && $this->configError === null
            && $this->config->generalOk()
            && !Setup::insideWebRoot($this->root, $this->request?->docRoot ?? '')
            && $this->db() !== null;
    }

    public function db(): ?Db
    {
        if ($this->db === null && $this->dbError === null) {
            try {
                $this->db = Db::open($this->dataDir);
                if (random_int(1, 20) === 1) {
                    $this->db->prune($this->now);
                }
            } catch (\Throwable $e) {
                $this->dbError = $e instanceof \RuntimeException ? $e->getMessage() : 'The database could not be opened.';
                Log::exception('database', $e);
            }
        }
        return $this->db;
    }

    /** The open database; only called after coreReady(). */
    public function store(): Db
    {
        $db = $this->db();
        if ($db === null) {
            throw new \RuntimeException('The database is not available.');
        }
        return $db;
    }

    /** @return list<array{what:string,ok:bool,fix:string}> */
    public function checklist(Request $req): array
    {
        if ($this->configError === null && $this->config->generalOk() && PHP_VERSION_ID >= 80100 && Setup::missingExtensions() === []) {
            $this->db();
        }
        return Setup::checklist($this->root, $req->docRoot, $this->configError === null ? $this->config : null, $this->configError, $this->dbError);
    }

    /**
     * The Origin header (or, without one, the Referer's origin) must be one of ALLOWED_ORIGINS, and the
     * browser must not report the call as cross-site. Browsers send Origin on every POST made with fetch.
     */
    public function originAllowed(Request $req): bool
    {
        if (strtolower($req->header('sec-fetch-site')) === 'cross-site') {
            return false;
        }
        $origin = $req->header('origin');
        if ($origin === '') {
            $ref = $req->header('referer');
            if ($ref === '' || !preg_match('~^(https?://[^/?#]+)~i', $ref, $m)) {
                return false;
            }
            $origin = $m[1];
        }
        $n = Config::normalizeOrigin($origin);
        return $n !== null && in_array($n, $this->config->origins(), true);
    }

    /** A rate-limit key for the caller's IP address that does not keep the address itself. */
    public function ipKey(Request $req): string
    {
        return substr($this->crypto->hash('ip', self::ipGroup($req->ip)), 0, 32);
    }

    /**
     * The address as one caller: an IPv6 address by its /64 network (one home, office or phone is given a whole
     * /64, so counting single addresses would let one caller spread its tries over millions of them); an IPv4
     * address, also one written as IPv6 (::ffff:192.0.2.1), as it is.
     */
    public static function ipGroup(string $ip): string
    {
        $bin = function_exists('inet_pton') ? @inet_pton(trim($ip)) : false;
        if (!is_string($bin) || strlen($bin) !== 16) {
            return $bin === false ? $ip : (string) inet_ntop($bin);
        }
        if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) {
            return (string) inet_ntop(substr($bin, 12));
        }
        return bin2hex(substr($bin, 0, 8)) . '::/64';
    }

    private function health(): Response
    {
        $ok = $this->coreReady() && $this->config->keyOk() && $this->config->hashOk() && Setup::vendorReady($this->root);
        return $ok ? Response::json(200, ['ok' => true]) : Response::error(503, 'setup_required', 'The rewrite service is not set up yet.');
    }

    /** ISO 8601 in UTC, as the panel reads it. */
    public static function iso(int $t): string
    {
        return gmdate('Y-m-d\TH:i:s\Z', $t);
    }
}
