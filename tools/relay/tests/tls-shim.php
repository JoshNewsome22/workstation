<?php
// tests only (tools/relay/tests/run.sh serves the relay with it as auto_prepend_file): PHP's built-in server has no TLS, so a
// request carrying X-Test-Tls: 1 is treated as if it had come over https. Never part of the upload zip.
if (($_SERVER['HTTP_X_TEST_TLS'] ?? '') === '1') {
    $_SERVER['HTTPS'] = 'on';
}
