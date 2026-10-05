#!/usr/bin/env python3
"""v21.47 Form DD-1's Walkthrough view, put into the form (NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html).

DD-1 is kept as one page (not built from parts), so this script writes the walkthrough into it between its own markers, and
running it again replaces what it wrote:
  - <style id="dd1-walk-css">: Form TK-1's walk.css (the player; its view rules left out), SM-1's walk-sm.css (the pencil, the
    cards, the caption) and tools/forms/DD-1/walk-dd.css;
  - the Walkthrough tab (a fourth tab in the hidden tab row and a fourth button in the toolbar's View segment) and its section,
    <!-- dd1-walk:section --> ... <!-- /dd1-walk:section -->, before the blank-form holder;
  - showTab's list of tabs, with "walk";
  - <script id="dd1-walk">: walk-script.json's words (DD_WALK_SCRIPT, read only without the narration file), then
    tools/forms/DD-1/walk.js with SM-1's copy of TK-1's player put in at /*@@PLAYER@@*/;
  - the narration and Save as video beside the form: <script src="nbh-dd1-narration.js" defer> and
    <script src="nbh-tk1-video.js" defer>, and walk-audio.js copied to NBH-Workstation/nbh-dd1-narration.js.
usage (from the repository root): python3 tools/forms/DD-1/patch-walk.py   (then tools/pwa-sw.py, build-rps.py, build-single.py)"""
import json, os, re, shutil, sys
R = 'tools/forms/DD-1/'
FORM = 'NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html'
s = open(FORM, encoding='utf-8').read()

def between(text, a, b, new):
    """replace what lies between the markers a and b (both kept), or return None when they are not there"""
    i = text.find(a)
    if i < 0: return None
    j = text.find(b, i)
    assert j > i, 'unclosed marker ' + a
    return text[:i] + a + new + text[j:]

# 1. the styles
tk = [l for l in open('tools/forms/TK-1/walk.css', encoding='utf-8').read().split('\n') if 'only-' not in l]
css = ('/* ===== v21.47 the Walkthrough (tools/forms/DD-1/patch-walk.py): Form TK-1\'s walk.css (the player) ===== */\n' + '\n'.join(tk) + '\n' +
       open('tools/forms/SM-1/walk-sm.css', encoding='utf-8').read() + '\n' + open(R + 'walk-dd.css', encoding='utf-8').read() +
       '@media print{#tab-walk{display:none!important}}\n')
blk = '<style id="dd1-walk-css">\n' + css + '</style>\n'
m = re.search(r'<style id="dd1-walk-css">.*?</style>\n', s, re.S)
s = s[:m.start()] + blk + s[m.end():] if m else s.replace('</head>', blk + '</head>', 1)

# 2. the tab and the View button
TAB = '<button role="tab" data-tab="walk" aria-selected="false"><span class="n">4</span>Walkthrough</button>'
if TAB not in s:
    a = '<button role="tab" data-tab="results" aria-selected="false"><span class="n">3</span>Graphs &amp; analysis</button>'
    assert s.count(a) == 1, 'the Graphs tab'
    s = s.replace(a, a + '\n    ' + TAB)
VB = '<button type="button" data-view="walk" aria-pressed="false">Walkthrough</button>'
if VB not in s:
    a = '<button type="button" data-view="results" aria-pressed="false">Graphs &amp; analysis</button>'
    assert s.count(a) == 1, 'the Graphs view button'
    s = s.replace(a, a + '\n      ' + VB)
a = '["setup","data","results"].forEach(t=>$("#tab-"+t).classList.toggle("hidden",t!==name));'
if a in s: s = s.replace(a, '["setup","data","results","walk"].forEach(t=>$("#tab-"+t).classList.toggle("hidden",t!==name));   /* v21.47 the Walkthrough */')
assert '["setup","data","results","walk"]' in s

# 3. the section
SEC = '''
  <section id="tab-walk" class="hidden only-walk no-print" data-panel="walk">
    <div class="panel">
    <h2>Walkthrough: How to Use This Data Sheet</h2>
    <p class="hint wk-intro">A narrated walkthrough of this form&rsquo;s own sheet and graph, for everyone who records: what the columns are, how a day is filled in, blank and zero, episodes, the percent for a skill, the phase and conditional changes, and how the graph and its analysis read. It is built from the form as it is now, so it shows this student&rsquo;s behaviors and days. Play starts it with the sound on; the chapters jump to a step, and full screen fills the iPad. Space plays and pauses; the arrow keys skip five seconds.</p>
    <div class="wk-player" id="wkPlayer">
      <div class="wk-frame" id="wkFrame"><div class="wk-stage" id="wkStage" aria-hidden="true"></div><button type="button" class="wk-big" id="wkBig" aria-label="Play the walkthrough"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg></button></div>
      <p class="wk-cap2" id="wkCap2"></p>
      <div class="wk-bar">
        <button type="button" class="wk-b wk-main" id="wkPlay" aria-label="Play"></button>
        <button type="button" class="wk-b" id="wkRestart" aria-label="Restart from the beginning"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M3.6 4.2l1.9 5.9 5.6-2.6z" fill="currentColor"/></svg></button>
        <div class="wk-seek" id="wkSeek" role="slider" tabindex="0" aria-label="Position in the walkthrough" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00"><div class="wk-strk"><div class="wk-sfill"></div></div><div class="wk-sthumb"></div></div>
        <span class="wk-time" id="wkTime" aria-hidden="true">0:00 / 0:00</span>
        <button type="button" class="wk-b wk-cc" id="wkCc" aria-pressed="true" aria-label="CC (captions)">CC</button>
        <button type="button" class="wk-b" id="wkSnd" aria-pressed="true" aria-label="Sound"></button>
        <button type="button" class="wk-b" id="wkFs" aria-label="Full screen"></button>
      </div>
      <div class="wk-chaps" id="wkChaps" role="group" aria-label="Chapters"></div>
    </div>
    <div class="wk-save"><button type="button" class="btn" id="wkVideo">Save as video (MP4)</button><span class="hint">Makes a video file of this walkthrough on this device, with the narration and captions, to share with the staff who record (save it to the district drive). It takes a few minutes; nothing is sent anywhere. The video shows this student&rsquo;s data: share it only where the student&rsquo;s records may go, or make it from the simulation.</span></div>
    <p class="hint" id="wkVideoNote" hidden></p>
    <p class="hint" id="wkNote" hidden></p>
    <details class="wk-tx"><summary>Transcript of the narration</summary><div id="wkTx"></div></details>
    </div>
  </section>
'''
A, Z = '<!-- dd1-walk:section -->', '<!-- /dd1-walk:section -->'
r = between(s, A, Z, SEC)
if r is None:
    anchor = '  <div class="blankform" id="blankForm"></div>'
    assert s.count(anchor) == 1, 'the blank-form holder'
    s = s.replace(anchor, A + SEC + Z + '\n\n' + anchor)
else: s = r

# 4. the script: the words, the walkthrough, the player
W = json.load(open(R + 'walk-script.json', encoding='utf-8'))
sm = open('tools/forms/SM-1/walk.js', encoding='utf-8').read()
p0 = sm.index('/* ---------------- the player: clock, narration, controls ---------------- */')
p1 = sm.index('/* ---------------- the view: leaving it pauses')
player = sm[p0:p1]
js = open(R + 'walk.js', encoding='utf-8').read()
assert '/*@@PLAYER@@*/' in js
js = js.replace('/*@@PLAYER@@*/', "/* ===== the player: Form TK-1's, as tools/forms/SM-1/walk.js carries it (put in by patch-walk.py) ===== */\n" + player)
js = ('/* ===== walk-script.json: the narration\'s words (read when nbh-dd1-narration.js is not beside the form) ===== */\nwindow.DD_WALK_SCRIPT=' +
      json.dumps([{'id': l['id'], 'text': l['text']} for l in W['lines']], ensure_ascii=False, separators=(',', ':')) + ';\n' + js)
assert '</script' not in js.lower(), 'a part holds </script'
tag = '<script id="dd1-walk">\n' + js + '</script>\n'
m = re.search(r'<script id="dd1-walk">.*?</script>\n', s, re.S)
s = s[:m.start()] + tag + s[m.end():] if m else s.replace('</body>', tag + '</body>', 1)
# the narration and Save as video, beside the form (the one-file editions put them inside)
for t in ('<script src="nbh-dd1-narration.js" defer></script>', '<script src="nbh-tk1-video.js" defer></script>'):
    if t not in s: s = s.replace('<script id="dd1-walk">', t + '\n<script id="dd1-walk">', 1)
open(FORM, 'w', encoding='utf-8').write(s)
shutil.copyfile(R + 'walk-audio.js', 'NBH-Workstation/nbh-dd1-narration.js')
print('DD-1: the walkthrough written in;', os.path.getsize(FORM), 'bytes; nbh-dd1-narration.js', os.path.getsize('NBH-Workstation/nbh-dd1-narration.js'), 'bytes')
