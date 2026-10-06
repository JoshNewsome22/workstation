#!/bin/sh
# Build Form TV-1 (Training Video, v21.50) from its parts: script-main.js becomes script.js, then tools/new-form.py assembles
# the form on CF-1's shared parts and tools/polish-one.py applies the shared polish layer and the writing help. The parts are
# copied to a folder of the build's own, so two builds at once cannot mix.
# usage (from the repository root): sh tools/forms/TV-1/build.sh
set -e
cd "$(dirname "$0")/../../.."
D=$(mktemp -d "${TMPDIR:-/tmp}/tv1-parts-XXXXXX")
R=tools/forms/TV-1
# v21.50 Lato Bold and Black (tools/vendor/lato, SIL OFL 1.1) go in as @font-face rules with data URLs, for the Panel look
python3 - "$R" <<'PY'
import base64, json, sys
R = sys.argv[1]
src = open(R + '/script-main.js', encoding='utf-8').read()
css = ''.join("@font-face{font-family:'TV Lato';font-style:normal;font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}" % (w, base64.b64encode(open('tools/vendor/lato/lato-latin-%d-normal.woff2' % w, 'rb').read()).decode()) for w in (700, 900))
assert src.count("const LATO_CSS='/*@@LATO@@*/';") == 1, 'the Lato placeholder is not in script-main.js once'
src = src.replace("const LATO_CSS='/*@@LATO@@*/';", 'const LATO_CSS=' + json.dumps('/* Lato (c) Lukasz Dziedzic, SIL Open Font License 1.1: tools/vendor/lato/LICENSE */' + css) + ';')
open(R + '/script.js', 'w', encoding='utf-8').write('/* ===== Form TV-1 ===== */\n' + src)
PY
for f in meta.json body.html toolbar.html script.js own.css; do cp $R/$f "$D/$f"; done
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html "$D" NBH-Workstation/TV-1_Training-Video_v2026-10.html
python3 tools/polish-one.py NBH-Workstation/TV-1_Training-Video_v2026-10.html
rm -rf "$D"
python3 - <<'PY'
doc=open('NBH-Workstation/TV-1_Training-Video_v2026-10.html',encoding='utf-8').read()
W,R,C=(open('tools/blocks/'+f,encoding='utf-8',newline='').read() for f in ('nbh-wording.js','nbh-wording-rules.json','nbh-wording-config.json'))
assert doc.count('\n<script id="nbh-wording">')==1 and doc.count(W)==1 and doc.count('window.nbhWordingRules=\n'+R+'\n;\nwindow.nbhWordingConfig=\n'+C+'\n;\n'+W+'</script>')==1, 'the writing help is not in the built TV-1 exactly once, current'
assert len(doc.encode('utf-8'))<1900000, 'TV-1 is %d bytes: keep it under 1.9 MB' % len(doc.encode('utf-8'))
print('TV-1 is %d bytes; the writing help is in it once, current' % len(doc.encode('utf-8')))
PY
