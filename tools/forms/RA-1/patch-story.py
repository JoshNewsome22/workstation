#!/usr/bin/env python3
"""v22.71 Form RA-1's drawn stories seen from above the table (tools/forms/RA-1/story-table.js and story-table.css), put into
the form (NBH-Workstation/Reinforcer_Assessment_Protocol.html). Running it again replaces what it wrote.
  - <style id="ra1-story-css">: story-table.css, its rules under #walk (the Walkthrough sheet's own rules name #walk .scene);
  - <script id="ra1-story">: story-table.js (window.NBHTable), before the stories' script (wk-js);
  - the stories, the practice questions and the printed job aids draw with NBHTable when it is there (NBHScene otherwise);
    the job aids at their printed widths (the cover 4.4 in, each step 1.72 in);
  - NBHScene (the old engine, still in the form) lends its sheets and its ratio ladder (board, ladder) to NBHTable;
  - the job aids' key to the drawings describes the table seen from above.
The video's pieces it draws with (the hands, the tablet, the fruit chew) come from tools/forms/RA-1/walk.js (window.NBH_RA_ART),
which patch-walk.py puts in: run patch-walk.py first.
usage (from the repository root): python3 tools/forms/RA-1/patch-story.py   (then tools/pwa-sw.py, build-rps.py, build-single.py)"""
import re
R = 'tools/forms/RA-1/'
FORM = 'NBH-Workstation/Reinforcer_Assessment_Protocol.html'
s = open(FORM, encoding='utf-8').read()
def once(a, b):
    global s
    if b in s and a not in s: return
    n = s.count(a); assert n == 1, (a[:80], n); s = s.replace(a, b)
# 1. the styles, under #walk
css = open(R + 'story-table.css', encoding='utf-8').read()
css = re.sub(r'(^|[,{}]\s*)\.nst\b', r'\1#walk .nst', css, flags=re.M)
css += ('#walk .scene.nst{padding:0;border:0;background:none;box-shadow:none;border-radius:0}\n'
        '#walk .nst .wk-pose svg{display:block;width:100%;height:100%;overflow:visible}\n'
        '#walk .nst .raw-tabscr svg{width:40px;height:40px}\n#walk .nst .raw-chewpic svg{width:100%;height:100%}\n')
blk = '<style id="ra1-story-css">\n' + css + '</style>\n'
m = re.search(r'<style id="ra1-story-css">.*?</style>\n', s, re.S)
s = s[:m.start()] + blk + s[m.end():] if m else s.replace('</head>', blk + '</head>', 1)
# 2. the renderer, before the stories' script
js = open(R + 'story-table.js', encoding='utf-8').read()
blk = '<script id="ra1-story">\n' + js + '</script>\n'
m = re.search(r'<script id="ra1-story">.*?</script>\n', s, re.S)
if m: s = s[:m.start()] + blk + s[m.end():]
else: once('<script id="wk-js">', blk + '<script id="wk-js">')
# 3. the old engine lends its sheets and its ladder
once('return Object.assign({make},X.exports||{});', 'return Object.assign({make,board:BOARD,ladder:LADDER},X.exports||{});')
# 4. who draws
once("const sceneEl=root.querySelector('.scene');const scene=window.NBHScene.make(sceneEl);",
     "const sceneEl=root.querySelector('.scene');const scene=(window.NBHTable||window.NBHScene).make(sceneEl);")
once("const scene=window.NBHScene.make(el),ov=overlay(el);", "const scene=(window.NBHTable||window.NBHScene).make(el),ov=overlay(el);")
once("if(cover)window.NBHScene.make(cover).set(ST.setup[8]);",
     "if(cover)(window.NBHTable?window.NBHTable.make(cover,{px:422}):window.NBHScene.make(cover)).set(ST.setup[8]);")
once("host.querySelectorAll('.jp-step .jp-scene').forEach((el,k)=>{window.NBHScene.make(el).set(draw[k]);});",
     "host.querySelectorAll('.jp-step .jp-scene').forEach((el,k)=>{(window.NBHTable?window.NBHTable.make(el,{px:165}):window.NBHScene.make(el)).set(draw[k]);});")
# 5. the stories' introduction
once("What each design looks like at the table: the assessor, the student and the data collector drawn step by step, what is said,",
     "What each design looks like at the table, seen from above and step by step: the student\u2019s hand and the assessor\u2019s, what is said,")
# 6. the key to the drawings
k0 = s.find("'<h2>Who Is Who in the Drawings</h2><div class=\"jp-key\">")
if k0 >= 0:
    k1 = s.find("</div>'", k0); assert k1 > k0
    new = ("'<h2>Reading the Drawings</h2><div class=\"jp-key\"><span>The table seen from above: the student’s hand comes from the near edge, the assessor’s from the far edge</span>"
           "<span><i style=\"background:#fffdf8;border:2px solid #1d3b5a\"></i>The data collector’s screen, beside the table</span>"
           "<span><i style=\"background:#8d989e\"></i><i style=\"background:#2f5fa3\"></i><i style=\"background:#e0742f\"></i><i style=\"background:#3f8a4f\"></i>Placemat: the condition’s signal in a multielement design</span>")
    s = s[:k0] + new + s[k1:]
open(FORM, 'w', encoding='utf-8').write(s)
print('patch-story: done')
