#!/usr/bin/env python3
"""assembles tools/forms/SP-1/walk.js: Form SM-1's player (tools/forms/SM-1/walk.js, itself TK-1's) around SP-1's own scenes"""
import io, os, re, sys, json
W=sys.argv[1]; D=sys.argv[2]
sm=io.open(os.path.join(W,'tools/forms/SM-1/walk.js'),encoding='utf-8').read()
def seg(a,b):
    i=sm.index(a); j=sm.index(b) if b else len(sm); return sm[i:j]
head=seg('/* (v21.45) Form SM-1','/* ---------------- the DOM of the view')
dom_build=seg('/* ---------------- the DOM of the view','const CREDIT_WALK=')
chunks=seg('/* captions: a line in pieces','/* ---------------- renderAt: the stage')
player=seg('/* ---------------- the player: clock','/* ---------------- the view: leaving it pauses')
# SP-1's header, info, chapters, fallback texts
hdr_end=head.index("(function(){")
head=("""/* (v24.00) Form SP-1, the Walkthrough view: a narrated walkthrough of the paper scatterplot data sheet for the staff who
   mark it, played like a video. The worked example is a simulated student (nothing from this record is in it): the sheet is
   put into the form, drawn as the Data sheet draws it, copied as the paper prints, and the record put back in the same turn.
   The example follows this record's marking setup (slash and shade, shade only, or counts), so it teaches the sheet the
   staff will be handed. Laid out once per build as a timeline; renderAt(t) sets every element to its state at time t as a
   pure function of t, so playing, seeking, the chapters and Save as video (nbh-tk1-video.js, Form TK-1's, beside the form)
   draw the same frames. The player (clock, narration, controls, full screen) is Form TK-1's (tools/forms/TK-1/walk.js), as
   SM-1 carries it (tools/forms/SP-1/walk.js is assembled from tools/forms/SM-1/walk.js by the release's build); the
   narration is walk-audio.js (made by make-narration.py from walk-script.json), kept beside the form as
   nbh-sp1-narration.js. Without it the captions are timed from their word counts and the device's voice reads them. */
"""+head[hdr_end:])
INFO="window.NBH_WALK_INFO={file:'Scatterplot walkthrough',from:'from this form: the worked example (a simulated student), the sheet as it prints, in this record\\u2019s marking setup',what:'form',\n  priv:'The video shows the form\\u2019s worked example (a simulated student) only; nothing from this student\\u2019s record is in it, so it can be shared with the staff who mark the sheet.'};\n"
head=re.sub(r"window\.NBH_WALK_INFO=\{.*?\};\n",lambda m:INFO,head,count=1,flags=re.S)
i=head.index('const CHOF='); j=head.index('const FB='); j=head.index('\n',j)+1
head=head[:i]+("""const CHOF={intro:'sheet',head:'sheet',defs:'sheet',grid:'sheet',low:'mark',high:'mark',blank:'mark',count:'mark',mark:'mark',blank1:'mark',x:'mark',codes:'more',daily:'more',sample:'end',outro:'end'};
const CHAPS=[['sheet','The sheet'],['mark','Marking'],['more','Codes and notes'],['end','Sample and return']];
/* the narration as written in walk-script.json, used only when walk-audio.js is not beside the form (its texts always win) */
const FB=(function(){const o={};(window.SP_WALK_SCRIPT||[]).forEach(l=>{o[l.id]=l.text;});return o;})();
""")+head[j:]
head=re.sub(r"/\* SM-1: no measured","/* SP-1: no measured",head)
body=head[head.index('(function(){'):]
left=[body.splitlines()[body[:m.start()].count(chr(10))] for m in re.finditer('SM-1|smModel',body)]
assert not left, left
core=io.open(os.path.join(D,'walk-core.js'),encoding='utf-8').read()
rend=io.open(os.path.join(D,'walk-render.js'),encoding='utf-8').read()
view=io.open(os.path.join(D,'walk-view.js'),encoding='utf-8').read()
spec=json.load(io.open(os.path.join(D,'walk-script.json'),encoding='utf-8'))
words='/* ===== walk-script.json: the narration\'s words (read when the recorded narration is not beside the form) ===== */\nwindow.SP_WALK_SCRIPT='+json.dumps([{'id':l['id'],'text':l['text']} for l in spec['lines']],ensure_ascii=False)+';\n'
out=words+head+dom_build+core+chunks+rend+player+view
for bad in ('</script','smw-','S.sys','renderAll'):
    assert bad not in out, bad
assert out.count('SM-1')==2, out.count('SM-1')
io.open(os.path.join(D,'walk.js'),'w',encoding='utf-8').write(out)
print('walk.js',len(out))
