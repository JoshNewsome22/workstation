#!/usr/bin/env bash
# Builds tools/reply-box/dist/nbh-reply-box-upload.zip: what goes on the website (GoDaddy cPanel, newsomebh.com).
# Upload it to the home folder (the folder that holds public_html) with File Manager, then Extract. It holds
#   public_html/reply/   box.php, .htaccess and README.md: the web address https://newsomebh.com/reply/box.php
# It never holds a data folder, so extracting a newer zip over an installed box keeps the replies.
#   tools/reply-box/build-zip.sh              -> tools/reply-box/dist/nbh-reply-box-upload.zip
#   tools/reply-box/build-zip.sh <file.zip>   -> that file
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-$HERE/dist/nbh-reply-box-upload.zip}"
mkdir -p "$(dirname "$OUT")"
OUT="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")"
php -l "$HERE/public_html/reply/box.php" >/dev/null
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/public_html/reply"
cp "$HERE/public_html/reply/box.php" "$HERE/public_html/reply/.htaccess" "$STAGE/public_html/reply/"
cp "$HERE/README.md" "$STAGE/public_html/reply/README.md"
rm -f "$OUT"
(cd "$STAGE" && zip -q -X -r "$OUT" public_html)
echo "wrote $OUT"
unzip -l "$OUT" | tail -n +2 | head -8
