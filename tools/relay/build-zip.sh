#!/usr/bin/env bash
# Builds tools/relay/dist/nbh-relay-upload.zip: what goes on the website (GoDaddy cPanel, newsomebh.com).
# Upload it to the home folder (the folder that holds public_html) with File Manager, then Extract. It holds
# exactly two folders:
#
#   public_html/ai/        index.php and .htaccess: the web address https://newsomebh.com/ai/
#   nbh-relay/             the relay itself, outside public_html: bootstrap.php, src/, vendor/ (the official
#                          Anthropic PHP SDK and its dependencies, so nobody runs composer on the server),
#                          config.sample.php, make-admin-hash.php, composer.json/.lock, README.md
#
# It never holds config.php, the data folder, a database, a log or any key, so extracting a newer zip over an
# installed relay updates the program and keeps its settings and data.
#
#   tools/relay/build-zip.sh                 -> tools/relay/dist/nbh-relay-upload.zip
#   tools/relay/build-zip.sh <file.zip>      -> that file (the tests build their own copy)
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-$HERE/dist/nbh-relay-upload.zip}"
mkdir -p "$(dirname "$OUT")"
OUT="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")"

"$HERE/install-vendor.sh" >/dev/null

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/public_html/ai" "$STAGE/nbh-relay"
cp "$HERE/public_html/ai/index.php" "$HERE/public_html/ai/.htaccess" "$STAGE/public_html/ai/"
cp -R "$HERE/nbh-relay/src" "$HERE/nbh-relay/vendor" "$STAGE/nbh-relay/"
cp "$HERE/nbh-relay/bootstrap.php" "$HERE/nbh-relay/config.sample.php" "$HERE/nbh-relay/make-admin-hash.php" \
   "$HERE/nbh-relay/composer.json" "$HERE/nbh-relay/composer.lock" "$STAGE/nbh-relay/"
cp "$HERE/README.md" "$STAGE/nbh-relay/README.md"
# in case nbh-relay is ever put inside public_html by mistake, the web server refuses its files
printf 'Require all denied\n' > "$STAGE/nbh-relay/.htaccess"

# What must never be in the upload.
bad="$(cd "$STAGE" && find . \( -name config.php -o -name '*.sqlite' -o -name '*.sqlite-*' -o -name data -o -name '*.log' -o -name .git -o -name '*.tmp' \) -print)"
if [ -n "$bad" ]; then echo "build-zip: refusing to package: $bad" >&2; exit 1; fi
if grep -rIlE 'sk-ant-[A-Za-z0-9_-]{8,}' "$STAGE" >/dev/null 2>&1; then
  echo "build-zip: something that looks like an API key is in the files:" >&2
  grep -rIlE 'sk-ant-[A-Za-z0-9_-]{8,}' "$STAGE" >&2
  exit 1
fi
if ! grep -q "'ANTHROPIC_API_KEY' => ''," "$STAGE/nbh-relay/config.sample.php" || ! grep -q "'PEPPER' => ''," "$STAGE/nbh-relay/config.sample.php" \
   || ! grep -q "'ADMIN_PASSWORD_HASH' => ''," "$STAGE/nbh-relay/config.sample.php"; then
  echo "build-zip: config.sample.php must ship with empty secrets" >&2; exit 1
fi

# Files 0644 and folders 0755 as extracted; the relay makes its data folder 0700 and config.php 0600 itself.
find "$STAGE" -type d -exec chmod 0755 {} +
find "$STAGE" -type f -exec chmod 0644 {} +
rm -f "$OUT.tmp"
(cd "$STAGE" && find public_html nbh-relay | LC_ALL=C sort | zip -q -X -9 "$OUT.tmp" -@)
mv "$OUT.tmp" "$OUT"
echo "build-zip: $OUT ($(du -h "$OUT" | cut -f1), $(unzip -Z1 "$OUT" | grep -vc '/$') files)"
