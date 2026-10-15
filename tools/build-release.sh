#!/bin/bash
# Builds everything a release ships from the edited folder, NBH-Workstation/ (v22.17, review F518). Run from anywhere:
#
#   bash tools/build-release.sh
#
# 1. the polish and writing help into every form (tools/polish/*, tools/blocks/nbh-wording*)
# 2. the forms' shared message block (tools/blocks/nbh-ui.html) and its file beside the forms
# 3. the offline copy's file list and release.json
# 4. the Royal Palm School edition (RPS-Workstation/), with the school's lockup and icon
# 5. the two one-file editions (deliver/)
# then checks that the tools reproduce the forms exactly (tools/check-build.py) and that the offline list is current.
# Exit 0 only when every step and both checks pass. The tests come after: bash qa/run-release.sh.
cd "$(dirname "$0")/.." || exit 2
set -o pipefail
step(){ echo "== $*"; "$@" 2>&1 | tail -2 || { echo "FAILED: $*"; exit 1; }; }
step python3 tools/apply-polish.py NBH-Workstation
step python3 tools/blocks/patch-ui.py tools/blocks/nbh-ui.html $(grep -l 'id="nbh-ui-css"' NBH-Workstation/*.html)
step node --check NBH-Workstation/nbh-ui.js
step python3 tools/pwa-sw.py NBH-Workstation
step python3 tools/build-rps.py NBH-Workstation RPS-Workstation tools/rps-assets/rps-lockup.webp tools/rps-assets/rps-favicon.png
step python3 tools/build-single.py NBH-Workstation deliver/NBH-Workstation.html
step python3 tools/build-single.py RPS-Workstation deliver/RPS-Workstation.html
step python3 tools/pwa-sw.py --check NBH-Workstation
step python3 tools/check-build.py
echo "build-release: done ($(grep -o "WS_REL='[^']*'" NBH-Workstation/index.html | head -1))"
