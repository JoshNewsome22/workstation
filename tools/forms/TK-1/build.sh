#!/bin/sh
# Build Form TK-1 from its parts: the QR library, the shared link core (tools/blocks/nbh-link.js, the link with Form
# TE-1), script-main.js and the walkthrough files (walk-hands.js, walk.js, walk.css, each used when present; walk-audio.js,
# the recorded narration, goes beside the form as NBH-Workstation/nbh-tk1-narration.js, v21.44)
# go into script.js and the stylesheet, then tools/new-form.py assembles the form on CF-1's shared parts and
# tools/polish-one.py applies the shared polish layer and the writing help (tools/blocks/nbh-wording.js, put in by
# tools/apply-polish.py). The link core goes in byte for byte (Form TE-1 carries the same file
# through tools/blocks/patch-link.py), so the two forms cannot drift apart; the build stops unless the built form holds it
# exactly once, unchanged, and the writing help once, current. The parts are copied to a folder of the build's own, so two
# builds at once cannot mix.
# usage (from the repository root): sh tools/forms/TK-1/build.sh
set -e
cd "$(dirname "$0")/../../.."
D=$(python3 - <<'PY'
import os, shutil, tempfile
R='tools/forms/TK-1/'
lib=open('tools/vendor/qrcode-generator/qrcode.js',encoding='utf-8').read()
head=('/* ===== qrcode-generator 2.0.4 (tools/vendor/qrcode-generator/qrcode.js), inlined so the QR code on the book pages is made\n'
      '   here with no network access. Copyright (c) 2009 Kazuhiko Arase, MIT licence (see the header that follows and\n'
      '   tools/vendor/qrcode-generator/LICENSE). The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED. ===== */\n')
core=open('tools/blocks/nbh-link.js',encoding='utf-8').read()
for bad in ('</script','CF-1','Newsome Behavioral Health'):
    assert bad.lower() not in core.lower(), ('nbh-link.js must not contain', bad)
js=(head+lib.rstrip('\n')+'\n\n/* ===== nbh-link (tools/blocks/nbh-link.js) ===== */\n'+core+
    '\n/* ===== Form TK-1 ===== */\n'+open(R+'script-main.js',encoding='utf-8').read())
for f in ('walk-hands.js','walk.js'):   # v21.44 walk-audio.js is not inlined: it goes beside the form as nbh-tk1-narration.js
    if os.path.exists(R+f): js=js.rstrip('\n')+'\n\n/* ===== '+f+' ===== */\n'+open(R+f,encoding='utf-8').read()
open(R+'script.js','w',encoding='utf-8').write(js)
css=open(R+'own.css',encoding='utf-8').read()
if os.path.exists(R+'walk.css'): css=css.rstrip('\n')+'\n'+open(R+'walk.css',encoding='utf-8').read()
d=tempfile.mkdtemp(prefix='tk1-parts-')
for f in ('meta.json','body.html','toolbar.html','script.js'): shutil.copy(R+f,d+'/'+f)
open(d+'/own.css','w',encoding='utf-8').write(css)
print(d)
PY
)
python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html "$D" NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html
python3 tools/polish-one.py NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html
# v21.44 the recorded narration, byte for byte, beside the form (its <script src> is in toolbar.html)
cp tools/forms/TK-1/walk-audio.js NBH-Workstation/nbh-tk1-narration.js
# v21.44 Save as video: mp4-muxer (tools/vendor/mp4-muxer, MIT) and walk-video.js, in one file beside the form
{ printf '/* nbh-tk1-video.js (v21.44): Form TK-1\047s Save as video. Built by tools/forms/TK-1/build.sh from tools/vendor/mp4-muxer/mp4-muxer.js\n'
  printf '   (mp4-muxer 5.2.2, Copyright (c) 2023 Vanilagy, MIT licence: tools/vendor/mp4-muxer/LICENSE) and tools/forms/TK-1/walk-video.js. */\n'
  cat tools/vendor/mp4-muxer/mp4-muxer.js; printf ';\n'; cat tools/forms/TK-1/walk-video.js; } > NBH-Workstation/nbh-tk1-video.js
rm -rf "$D"
python3 - <<'PY'
core=open('tools/blocks/nbh-link.js',encoding='utf-8').read()
doc=open('NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html',encoding='utf-8').read()
BANNER='/* ===== nbh-link (tools/blocks/nbh-link.js) ===== */\n'
assert doc.count(BANNER)==1 and doc.count(BANNER+core)==1 and doc.count('nbh-link (v21.43)')==1, 'the link core is not in the built TK-1 exactly once, byte for byte'
print('the link core (tools/blocks/nbh-link.js) is in the built TK-1 once, byte for byte')
assert doc.count('<script src="nbh-tk1-video.js" defer></script>')==1 and doc.count('id="wkVideo"')==1, 'Save as video is not in the built TK-1'
assert doc.count('<script src="nbh-tk1-narration.js" defer></script>')==1 and 'const WALK_AUDIO=' not in doc, 'the narration must be beside TK-1, not in it'
assert open('NBH-Workstation/nbh-tk1-narration.js','rb').read()==open('tools/forms/TK-1/walk-audio.js','rb').read(), 'nbh-tk1-narration.js is not walk-audio.js'
assert len(doc.encode('utf-8'))<1900000, 'TK-1 is %d bytes: keep it under 1.9 MB (a host may cut a page of 2 MB or more short)' % len(doc.encode('utf-8'))
print('the narration is beside TK-1 (nbh-tk1-narration.js); TK-1 is %d bytes' % len(doc.encode('utf-8')))
W,R,C=(open('tools/blocks/'+f,encoding='utf-8',newline='').read() for f in ('nbh-wording.js','nbh-wording-rules.json','nbh-wording-config.json'))
assert doc.count('\n<script id="nbh-wording">')==1 and doc.count(W)==1 and doc.count('window.nbhWordingRules=\n'+R+'\n;\nwindow.nbhWordingConfig=\n'+C+'\n;\n'+W+'</script>')==1, 'the writing help is not in the built TK-1 exactly once, current'
print('the writing help (tools/blocks/nbh-wording.js, its rules and its config) is in the built TK-1 once, current')
PY
