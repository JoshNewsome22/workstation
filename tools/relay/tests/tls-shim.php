<?php
// tests only (tools/relay/tests/run.sh serves the relay with it as the built-in server's router): PHP's built-in server has no
// TLS, so a request carrying X-Test-Tls: 1 is treated as if it had come over https. Never part of the upload zip.
// v25.71: it is the router, run from the test home folder, and hands every request to the relay's own public_html/ai/index.php
// (the server gives that script the same SCRIPT_NAME, /ai/index.php). It was an auto_prepend_file before, which the built-in
// server never applies to a router script, so no request counted as https and nine of relay-test's checks could not pass.
if (($_SERVER['HTTP_X_TEST_TLS'] ?? '') === '1') {
    $_SERVER['HTTPS'] = 'on';
}
return require getcwd() . '/public_html/ai/index.php';
