#!/bin/bash
# The release run (v22.12, review F505): runs every test in qa/release-list.txt in order, reads each one's exit code, and
# writes a dated summary naming the commit, so anyone can rerun it and see what a release's "all pass" covered.
#
#   bash qa/run-release.sh [OUT]          OUT defaults to qa/out/release
#
# It serves the repository on 127.0.0.1:8123 (python3 -m http.server) when nothing answers there, or uses WS_URL if set.
# Some print comparisons also read WS_PREV_URL (the previous release served elsewhere); without it they compare less.
# Exit 0 only when every test exits 0. The summary is OUT/summary.txt; each test's output is OUT/<test>.log.
cd "$(dirname "$0")/.." || exit 2
OUT=${1:-qa/out/release}; mkdir -p "$OUT"; SUM="$OUT/summary.txt"
export WS_URL=${WS_URL:-http://127.0.0.1:8123}
port=${WS_URL##*:}; port=${port%%/*}
if ! curl -s -o /dev/null "$WS_URL/"; then (setsid nohup python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 < /dev/null &); sleep 1; fi
{ echo "Release run of $(git rev-parse --short HEAD) ($(git log -1 --format=%s | cut -c1-80))"; echo "started $(date '+%Y-%m-%d %H:%M %Z') on $WS_URL"; } > "$SUM"
python3 tools/check-build.py >> "$SUM" 2>&1 || echo "check-build FAILED" >> "$SUM"
failed=0; n=0
while read -r line; do
  case "$line" in ''|'#'*) continue;; esac
  t=${line##* }; envs=${line% "$t"}; [ "$envs" = "$line" ] && envs=""
  [ -f "qa/$t.js" ] || { echo "$t MISSING" >> "$SUM"; failed=$((failed+1)); continue; }
  st=$(date +%s); env $envs timeout 5400 node "qa/$t.js" > "$OUT/$t.log" 2>&1; code=$?; n=$((n+1))
  [ $code -ne 0 ] && failed=$((failed+1))
  echo "$t exit=$code secs=$(( $(date +%s)-st )) $(tail -1 "$OUT/$t.log" | cut -c1-90)" >> "$SUM"
done < qa/release-list.txt
echo "finished $(date '+%Y-%m-%d %H:%M %Z'): $n tests, $failed failed" >> "$SUM"
tail -1 "$SUM"; [ $failed -eq 0 ]
