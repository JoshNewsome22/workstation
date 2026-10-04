<?php
/*
 * NBH writing-help relay: the only program file in the web folder (public_html/ai/). Every request to
 * https://newsomebh.com/ai/... is sent here by .htaccess. The relay itself is the nbh-relay folder in the
 * home folder, next to public_html, where none of its files can be downloaded.
 *
 * The one setting: where the nbh-relay folder is. As uploaded it is in the home folder, two folders up from
 * this file. Change this line only if you put nbh-relay somewhere else (write the full path in quotes).
 */
$NBH_RELAY = dirname(__DIR__, 2) . '/nbh-relay';

/* ---- nothing to change below this line ---------------------------------------------------------------
   This file is kept to syntax that every PHP version can read, so that an old PHP version gets a plain
   message instead of a blank page. */

ini_set('display_errors', '0');

if (PHP_VERSION_ID < 80100) {
    nbh_relay_stop('The writing-help relay needs PHP 8.1 or newer, and this site runs PHP ' . PHP_VERSION . '. In cPanel, open "MultiPHP Manager" (or "Select PHP Version") and choose PHP 8.1 or newer for this domain, then reload this page.');
}
if (!is_string($NBH_RELAY) || !is_file($NBH_RELAY . '/bootstrap.php')) {
    nbh_relay_stop('The nbh-relay folder was not found. Upload nbh-relay-upload.zip to your home folder (the folder that holds public_html) and extract it there, so that nbh-relay sits next to public_html, then reload this page.');
}

require $NBH_RELAY . '/bootstrap.php';

/** A plain answer for a relay that cannot start: JSON for the forms' calls, a short page for people. */
function nbh_relay_stop($why)
{
    $uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if (strpos($uri, '/api/') !== false) {
        header('Content-Type: application/json; charset=utf-8', true, 503);
        echo '{"error":"setup_required","message":"The rewrite service is not set up yet."}';
    } else {
        header('Content-Type: text/html; charset=utf-8', true, 503);
        echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Writing-help relay: setup</title></head><body><h1>Writing-help relay: setup</h1><p>'
            . htmlspecialchars($why, ENT_QUOTES, 'UTF-8') . '</p></body></html>';
    }
    exit;
}
