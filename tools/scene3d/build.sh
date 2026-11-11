#!/bin/bash
# tools/scene3d/build.sh: write NBH-Workstation/nbh-scene3d.js, the 3D scene as one ordinary script (the pages also open
# from a folder, where a page may load neither a module nor a file). It needs node and the package registry once:
# three (the drawing library, MIT) and esbuild (the bundler, MIT) are fetched into tools/scene3d/node_modules, which is
# not kept in the repository. The file it writes IS kept, so the release tools never need node.
set -e; cd "$(dirname "$0")"
[ -d node_modules/three ] && [ -d node_modules/esbuild ] || npm install --no-audit --no-fund --no-save three@0.187.0 esbuild@0.24.2
[ -f src/env.js ] || { echo "src/env.js is missing: python3 make-env.py art_studio_1k.hdr src/env.js"; exit 1; }
OUT=../../NBH-Workstation/nbh-scene3d.js
node_modules/.bin/esbuild src/engine.js --bundle --minify --format=iife --global-name=NBHScene3D --legal-comments=none --target=es2019,safari14 --outfile="$OUT.tmp"
{ cat banner.txt; cat "$OUT.tmp"; } > "$OUT"
rm -f "$OUT.tmp"; ls -l "$OUT" | awk '{print "nbh-scene3d.js: "$5" bytes"}'
