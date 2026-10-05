#!/bin/sh
# Build Form SM-1 from its parts (v21.45): the QR library (tools/vendor/qrcode-generator), script-main.js, the interest themes'
# pictures (sm-themes.js, made by make-themes.py), the target library (sm-library.json), the design and its editors
# (sm-v2-core.js, sm-v2-ui.js), rating on the iPad (sm-rate.js, v21.46), the walkthrough (walk.js, when present) go into script.js, in that order, and the first render
# closes it; own.css, sm-v2.css, sm-rate.css and walk.css make the stylesheet. Then tools/new-form.py assembles the form on CF-1's shared
# parts and tools/polish-one.py applies the polish layer and the writing help. The walkthrough's narration (walk-audio.js)
# goes beside the form as NBH-Workstation/nbh-sm1-narration.js; Save as video uses TK-1's nbh-tk1-video.js, also beside it.
# usage (from the repository root): sh tools/forms/SM-1/build.sh
set -e
cd "$(dirname "$0")/../../.."
D=$(python3 - <<'PY'
import json, os, shutil, tempfile
R='tools/forms/SM-1/'
lib=open('tools/vendor/qrcode-generator/qrcode.js',encoding='utf-8').read()
head=('/* ===== qrcode-generator 2.0.4 (tools/vendor/qrcode-generator/qrcode.js), inlined so the QR code on the sheet is made\n'
      '   here with no network access. Copyright (c) 2009 Kazuhiko Arase, MIT licence (see the header that follows and\n'
      '   tools/vendor/qrcode-generator/LICENSE). The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. ===== */\n')
js=head+lib.rstrip('\n')+'\n\n/* ===== Form SM-1 ===== */\n'+open(R+'script-main.js',encoding='utf-8').read()
js=js.rstrip('\n')+'\n\n/* ===== sm-themes.js ===== */\n'+open(R+'sm-themes.js',encoding='utf-8').read()
L=json.load(open(R+'sm-library.json',encoding='utf-8'))
js=js.rstrip('\n')+'\n\n/* ===== sm-library.json: the target library (wording written for the practice; editable once placed) ===== */\nconst SM_LIBRARY='+json.dumps(L,ensure_ascii=False,separators=(',',':'))+';\n'
for f in ('sm-v2-core.js','sm-v2-ui.js','sm-rate.js'):
    js=js.rstrip('\n')+'\n\n/* ===== '+f+' ===== */\n'+open(R+f,encoding='utf-8').read()
if os.path.exists(R+'walk.js'):
    W=json.load(open(R+'walk-script.json',encoding='utf-8'))
    js=js.rstrip('\n')+'\n\n/* ===== walk-script.json: the narration\'s words (read when nbh-sm1-narration.js is not beside the form) ===== */\nwindow.SM_WALK_SCRIPT='+json.dumps([{'id':l['id'],'text':l['text']} for l in W['lines']],ensure_ascii=False,separators=(',',':'))+';\n'
    js=js.rstrip('\n')+'\n\n/* ===== walk.js ===== */\n'+open(R+'walk.js',encoding='utf-8').read()
js=js.rstrip('\n')+'\n\n/* ===== the first render, once every part is defined ===== */\nrenderAll();\n'
assert '</script' not in js.lower(), 'a part holds </script'
open(R+'script.js','w',encoding='utf-8').write(js)
css=open(R+'own.css',encoding='utf-8').read()
css=css.rstrip('\n')+'\n'+open(R+'sm-v2.css',encoding='utf-8').read()
css=css.rstrip('\n')+'\n'+open(R+'sm-rate.css',encoding='utf-8').read()
if os.path.exists(R+'walk.js'):
    # the player's styles: Form TK-1's walk.css, without its view rules (SM-1's are in sm-v2.css), then SM-1's own
    tk=[l for l in open('tools/forms/TK-1/walk.css',encoding='utf-8').read().split('\n') if 'only-' not in l]
    css=css.rstrip('\n')+'\n/* ===== tools/forms/TK-1/walk.css (the player) ===== */\n'+'\n'.join(tk)+'\n'+open(R+'walk-sm.css',encoding='utf-8').read()
# v21.45 the live preview (#smPrevI) and the walkthrough (#wkSheet) draw copies of the sheet: every rule written for #sheetOut applies to them as well
import re
def dup(m):
    sel=m.group(1)
    if '#sheetOut' not in sel or sel.strip().startswith('@'): return m.group(0)
    parts=[x for x in sel.split(',')]
    extra=[x.replace('#sheetOut',k) for k in ('#smPrevI','#wkSheet') for x in parts if '#sheetOut' in x and 'sm-sheet-only' not in x]
    return (sel.rstrip()+(','+','.join(extra) if extra else ''))+'{'
css=re.sub(r'([^{}]+)\{',dup,css)
d=tempfile.mkdtemp(prefix='sm1-parts-')
for f in ('meta.json','body.html','toolbar.html','script.js'): shutil.copy(R+f,d+'/'+f)
open(d+'/own.css','w',encoding='utf-8').write(css)
print(d)
PY
)
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html "$D" NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html
python3 tools/polish-one.py NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html
if [ -f tools/forms/SM-1/walk-audio.js ]; then cp tools/forms/SM-1/walk-audio.js NBH-Workstation/nbh-sm1-narration.js; fi
rm -rf "$D"
python3 - <<'PY'
import os
f='NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html'
n=os.path.getsize(f); assert n<1900000, 'SM-1 is %d bytes: over the 1.9 MB a page may be (tools/pwa-sw.py)' % n
print('SM-1 built:', n, 'bytes')
PY
