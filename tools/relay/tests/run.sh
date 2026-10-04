#!/usr/bin/env bash
# Runs every test of the writing-help relay, offline (nothing reaches the internet):
#
#   1. installs the pinned PHP packages if needed (install-vendor.sh) and runs php -l on every relay file
#   2. builds the upload zip and extracts it into a throwaway "home folder" (public_html/ai + nbh-relay)
#   3. starts tests/mock-anthropic.php (a stand-in for the Anthropic API) and the relay, both with PHP's
#      built-in server, and runs tests/relay-test.php against them
#   4. tests/contract-test.js: the forms' panel's own code (tools/blocks/nbh-wording.js) reads the relay's
#      answers as intended (needs node)
#   5. tests/admin-browser-test.js: the admin page in Chromium (needs Playwright, as qa/lib.js finds it)
#   6. tests/php81-test.php under PHP 8.1 (the oldest PHP the relay supports): every file parses, every class
#      loads, and the relay's main paths run, through the SDK, against the mock
#
#   tools/relay/tests/run.sh             all of it (step 6 runs when PHP 8.1 is found: $PHP81, or the cache below)
#   tools/relay/tests/run.sh --php81     also fetch PHP 8.1 (php-wasm from npm, about 500 MB, cached in
#                                        ~/.cache/nbh-relay-php81) when it is not there yet
#   KEEP=1 tools/relay/tests/run.sh      keep the test folder (screenshots, logs) and print where it is
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELAY="$(dirname "$HERE")"
REPO="$(cd "$RELAY/../.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/nbh-relay-test.XXXXXX")"
KEEP="${KEEP:-0}"
WANT81=0
[ "${1:-}" = "--php81" ] && WANT81=1
PIDS=()
RESULTS=()
FAIL=0

cleanup() {
  for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null; done
  wait 2>/dev/null
  if [ "$KEEP" = 1 ]; then echo "kept: $WORK"; else rm -rf "$WORK"; fi
}
trap cleanup EXIT

step() { printf '\n######## %s\n' "$*"; }
result() { RESULTS+=("$1: $2"); [ "$2" = "passed" ] || [ "${2#skipped}" != "$2" ] || FAIL=1; }
free_port() { php -r '$s = stream_socket_server("tcp://127.0.0.1:0"); $n = stream_socket_get_name($s, false); echo substr($n, strrpos($n, ":") + 1);'; }
# a TCP check only: any HTTP request to the relay would already be its first run
wait_port() { for _ in $(seq 1 100); do php -r 'exit(@fsockopen("127.0.0.1", (int) $argv[1]) ? 0 : 1);' "$1" && return 0; sleep 0.1; done; echo "nothing listening on $1" >&2; return 1; }

step "PHP packages (composer.lock)"
"$RELAY/install-vendor.sh" || { echo "install-vendor.sh failed"; exit 1; }

step "php -l on every relay file"
lint=0; n=0
while IFS= read -r -d '' f; do
  n=$((n + 1))
  out="$(php -l "$f" 2>&1)" || { echo "$out"; lint=1; }
done < <(find "$RELAY/public_html" "$RELAY/nbh-relay" "$HERE" -name '*.php' -not -path '*/vendor/*' -print0)
echo "$n files linted with $(php -r 'echo PHP_VERSION;')"
[ $lint = 0 ] && result "php -l ($n files)" passed || result "php -l ($n files)" failed

step "build the upload zip and extract it as the home folder"
"$RELAY/build-zip.sh" "$WORK/upload.zip" || { echo "build-zip.sh failed"; exit 1; }
mkdir -p "$WORK/home" "$WORK/mock"
unzip -q "$WORK/upload.zip" -d "$WORK/home"

MP="$(free_port)"; RP="$(free_port)"
MOCK_DIR="$WORK/mock" PHP_CLI_SERVER_WORKERS=4 php -S "127.0.0.1:$MP" "$HERE/mock-anthropic.php" >"$WORK/mock-server.log" 2>&1 &
PIDS+=($!)
(cd "$WORK/home" && PHP_CLI_SERVER_WORKERS=4 exec php -S "127.0.0.1:$RP" -t public_html public_html/ai/index.php) >"$WORK/relay-server.log" 2>&1 &
PIDS+=($!)
wait_port "$MP" && wait_port "$RP" || exit 1
echo "mock API on 127.0.0.1:$MP, relay on 127.0.0.1:$RP"

step "relay-test.php (HTTP: redeem, rewrite, admin, routes, setup, limits, privacy)"
if php "$HERE/relay-test.php" --relay "http://127.0.0.1:$RP" --home "$WORK/home" --zip "$WORK/upload.zip" --source "$RELAY" \
     --mock-url "http://127.0.0.1:$MP" --mock-dir "$WORK/mock" --out "$WORK/contract.json"; then
  result relay-test.php passed
else
  result relay-test.php failed
fi

step "contract-test.js (the forms' panel reads the relay's answers)"
if command -v node >/dev/null 2>&1 && [ -f "$WORK/contract.json" ]; then
  node "$HERE/contract-test.js" "$WORK/contract.json" "$REPO/tools/blocks/nbh-wording.js" && result contract-test.js passed || result contract-test.js failed
else
  result contract-test.js "skipped (no node, or relay-test.php did not finish)"
fi

step "admin-browser-test.js (the admin page in Chromium)"
if command -v node >/dev/null 2>&1 && node -e "require('$REPO/qa/lib.js')" >/dev/null 2>&1; then
  node "$HERE/admin-browser-test.js" --relay "http://127.0.0.1:$RP" --home "$WORK/home" --shots "$WORK/shots" --pages "$WORK/pages" && result admin-browser-test.js passed || result admin-browser-test.js failed
else
  result admin-browser-test.js "skipped (Playwright not found)"
fi

step "php81-test.php (PHP 8.1)"
CACHE81="${HOME:-/tmp}/.cache/nbh-relay-php81"
if [ -z "${PHP81:-}" ] && [ ! -f "$CACHE81/node_modules/@php-wasm/cli/php-wasm.js" ] && [ $WANT81 = 1 ] && command -v npm >/dev/null 2>&1; then
  echo "fetching PHP 8.1 (php-wasm) into $CACHE81 ..."
  npm install --prefix "$CACHE81" --no-audit --no-fund @php-wasm/cli@3.1.56 >/dev/null 2>&1 || echo "could not fetch php-wasm"
fi
if [ -z "${PHP81:-}" ] && [ -f "$CACHE81/node_modules/@php-wasm/cli/php-wasm.js" ]; then
  PHP81="node $CACHE81/node_modules/@php-wasm/cli/php-wasm.js"
fi
if [ -n "${PHP81:-}" ]; then
  mkdir -p "$WORK/home81" && unzip -q "$WORK/upload.zip" -d "$WORK/home81"
  if PHP=8.1 $PHP81 "$HERE/php81-test.php" --home "$WORK/home81" --mock-url "http://127.0.0.1:$MP" --mock-dir "$WORK/mock" --source "$RELAY"; then
    result "php81-test.php" passed
  else
    result "php81-test.php" failed
  fi
else
  result "php81-test.php" "skipped (no PHP 8.1: set PHP81, or run with --php81)"
fi

step "summary"
for r in "${RESULTS[@]}"; do echo "  $r"; done
if [ -s "$WORK/relay-server.log" ] && grep -E "PHP (Warning|Notice|Deprecated|Fatal|Parse)" "$WORK/relay-server.log" >/dev/null; then
  echo "  the relay's server log has PHP warnings:"; grep -E "PHP (Warning|Notice|Deprecated|Fatal|Parse)" "$WORK/relay-server.log" | head -20
  FAIL=1
fi
[ $FAIL = 0 ] && echo "ALL PASSED" || echo "SOME FAILED"
exit $FAIL
