<?php
/*
 * NBH writing-help relay: where every request starts. public_html/ai/index.php requires this file; nothing
 * else in nbh-relay is reachable from the web (the folder sits outside public_html).
 */

declare(strict_types=1);

namespace NBH\Relay;

spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, __NAMESPACE__ . '\\')) {
        $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen(__NAMESPACE__) + 1)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

// The official Anthropic PHP SDK and its HTTP client (installed with composer; shipped in the upload).
// When the folder is missing the setup page says so; nothing that needs it runs.
if (is_file(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

if (!\defined('NBH_RELAY_NO_RUN')) {   // the tests load the classes without serving a request
    App::main(__DIR__);
}
