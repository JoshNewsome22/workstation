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
css = ''.join("@font-face{font-family:'TV Lato';font-style:normal;font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}" % (w, base64.b64encode(open('tools/vendor/lato/lato-latin-%d-normal.woff2' % w, 'rb').read()).decode()) for w in (700, 900)) + "@font-face{font-family:'TV Merri';font-style:normal;font-weight:900;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}" % base64.b64encode(open('tools/vendor/merriweather/merriweather-latin-900-normal.woff2', 'rb').read()).decode()
assert src.count("const LATO_CSS='/*@@LATO@@*/';") == 1, 'the Lato placeholder is not in script-main.js once'
src = src.replace("const LATO_CSS='/*@@LATO@@*/';", 'const LATO_CSS=' + json.dumps('/* Lato (c) Lukasz Dziedzic and Merriweather (c) The Merriweather Project Authors, SIL Open Font License 1.1: tools/vendor/lato/LICENSE, tools/vendor/merriweather/LICENSE */' + css) + ';')
open(R + '/script.js', 'w', encoding='utf-8').write('/* ===== Form TV-1 ===== */\n' + src)
PY
for f in meta.json body.html toolbar.html script.js own.css; do cp $R/$f "$D/$f"; done
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html "$D" NBH-Workstation/TV-1_Training-Video_v2026-10.html
python3 tools/polish-one.py NBH-Workstation/TV-1_Training-Video_v2026-10.html
# v21.62 My pictures (tools/blocks/nbh-pictures.js), byte for byte, beside the forms (its <script src> is in toolbar.html)
cp tools/blocks/nbh-pictures.js NBH-Workstation/nbh-pictures.js
# v22.56 the media store (tools/blocks/nbh-media.js), byte for byte, beside the forms (its <script src> is in toolbar.html)
cp tools/blocks/nbh-media.js NBH-Workstation/nbh-media.js
rm -rf "$D"
python3 - <<'PY'
doc=open('NBH-Workstation/TV-1_Training-Video_v2026-10.html',encoding='utf-8').read()
W,R,C=(open('tools/blocks/'+f,encoding='utf-8',newline='').read() for f in ('nbh-wording.js','nbh-wording-rules.json','nbh-wording-config.json'))
# v21.84 the form carries the loader; the writing help itself is NBH-Workstation/nbh-wording.js, written by polish-one.py
WF=open('NBH-Workstation/nbh-wording.js',encoding='utf-8',newline='').read()
assert doc.count('\n<script id="nbh-wording"')==1 and doc.count('\n<script id="nbh-wording" src="nbh-wording.js"></script>')==1 and W not in doc and WF.endswith('window.nbhWordingRules=\n'+R+'\n;\nwindow.nbhWordingConfig=\n'+C+'\n;\n'+W), 'the built TV-1 does not load the writing help once, or nbh-wording.js is not current'
assert len(doc.encode('utf-8'))<1900000, 'TV-1 is %d bytes: keep it under 1.9 MB' % len(doc.encode('utf-8'))
print('TV-1 is %d bytes; it loads the writing help once (nbh-wording.js, current)' % len(doc.encode('utf-8')))
PY
