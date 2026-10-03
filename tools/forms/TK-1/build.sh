#!/bin/sh
# Build Form TK-1 from its parts: the QR library, script-main.js and the walkthrough files (walk-hands.js, walk-audio.js,
# walk.js, walk.css, each used when present) go into script.js and the stylesheet, then tools/new-form.py assembles the
# form on CF-1's shared parts and tools/polish-one.py applies the shared polish layer.
# usage (from the repository root): sh tools/forms/TK-1/build.sh
set -e
cd "$(dirname "$0")/../../.."
python3 - <<'PY'
import os, shutil, tempfile
R='tools/forms/TK-1/'
lib=open('tools/vendor/qrcode-generator/qrcode.js',encoding='utf-8').read()
head=('/* ===== qrcode-generator 2.0.4 (tools/vendor/qrcode-generator/qrcode.js), inlined so the QR code on the book pages is made\n'
      '   here with no network access. Copyright (c) 2009 Kazuhiko Arase, MIT licence (see the header that follows and\n'
      '   tools/vendor/qrcode-generator/LICENSE). The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. ===== */\n')
js=head+lib.rstrip('\n')+'\n\n/* ===== Form TK-1 ===== */\n'+open(R+'script-main.js',encoding='utf-8').read()
for f in ('walk-hands.js','walk-audio.js','walk.js'):
    if os.path.exists(R+f): js=js.rstrip('\n')+'\n\n/* ===== '+f+' ===== */\n'+open(R+f,encoding='utf-8').read()
open(R+'script.js','w',encoding='utf-8').write(js)
css=open(R+'own.css',encoding='utf-8').read()
if os.path.exists(R+'walk.css'): css=css.rstrip('\n')+'\n'+open(R+'walk.css',encoding='utf-8').read()
d=tempfile.mkdtemp()
for f in ('meta.json','body.html','toolbar.html','script.js'): shutil.copy(R+f,d+'/'+f)
open(d+'/own.css','w',encoding='utf-8').write(css)
open('/tmp/tk1-parts-dir','w').write(d)
PY
D=$(cat /tmp/tk1-parts-dir)
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html "$D" NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html
python3 tools/polish-one.py NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html
rm -rf "$D" /tmp/tk1-parts-dir
