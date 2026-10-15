#!/bin/bash
# Makes a release's upload zips (v22.17, review F518), after tools/build-release.sh and a passing bash qa/run-release.sh:
#
#   bash tools/zip-release.sh OUTDIR [--speech]
#
#   OUTDIR/RPS-Workstation_v<version>.zip   the school edition, files at the top level (HOSTING.md says how to upload it)
#   OUTDIR/NBH-Workstation_v<version>.zip   the practice edition, the same way
#   OUTDIR/nbh-reply-box-upload.zip         the reply box (tools/reply-box/README.md), uploaded to the home folder
#   OUTDIR/nbh-relay-upload.zip             the writing help's rewrite service (tools/relay/README.md); the practice only
#   with --speech, also OUTDIR/RPS-Workstation_speech.zip and NBH-Workstation_speech.zip: nbh-asr/, the recogniser behind
#   Dictate and TV-1's Follow my words. It does not change between versions, so it is shipped only when it did (or the
#   first time), and the workstation zips leave it out. Each is extracted once into the edition's folder.
# <version> is the WS_REL in index.html. Older zips of the same names in OUTDIR are replaced.
cd "$(dirname "$0")/.." || exit 2
OUT=${1:?usage: bash tools/zip-release.sh OUTDIR [--speech]}; mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
V=$(grep -o "WS_REL='v[^']*'" NBH-Workstation/index.html | head -1 | sed "s/WS_REL='\(.*\)'/\1/")
[ -n "$V" ] || { echo "no WS_REL in NBH-Workstation/index.html"; exit 1; }
for E in RPS NBH; do
  rm -f "$OUT/$E-Workstation_"v*.zip
  (cd "$E-Workstation" && zip -q -X -r "$OUT/$E-Workstation_$V.zip" . -x 'nbh-asr/*' -x '.DS_Store') || exit 1
  if [ "$2" = "--speech" ]; then rm -f "$OUT/$E-Workstation_speech.zip"; (cd "$E-Workstation" && zip -q -X -r "$OUT/$E-Workstation_speech.zip" nbh-asr) || exit 1; fi
done
bash tools/reply-box/build-zip.sh "$OUT/nbh-reply-box-upload.zip" >/dev/null || exit 1
bash tools/relay/build-zip.sh >/dev/null && cp tools/relay/dist/nbh-relay-upload.zip "$OUT/" || exit 1
ls -la "$OUT"
