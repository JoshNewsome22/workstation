#!/usr/bin/env python3
"""v21.60 Form RA-1's narrated walkthrough with hands (the Walkthrough view's video), put into the form
(NBH-Workstation/Reinforcer_Assessment_Protocol.html).

RA-1 is kept as one page (not built from parts), so this script writes the walkthrough into it between its own markers, and
running it again replaces what it wrote:
  - <style id="ra1-walk-css">: Form TK-1's walk.css (the player and the hands; its view rules and timer ring left out), SM-1's
    walk-sm.css (the cards, the caption) and tools/forms/RA-1/walk-ra.css (the table, the session panel, the papers);
  - the player's section, <!-- ra1-walk:section --> ... <!-- /ra1-walk:section -->, at the top of the Walkthrough sheet (#walk,
    shown by body.view-walk as before), above the drawn stories and the job aids, which stay;
  - a note in the Guide, between <!-- ra1-walk:guide --> markers;
  - inside the form's own script (a closure: its S, renderAll and setView are private), between /* ra1-walk:begin */ and
    /* ra1-walk:end */ before its last line: walk-script.json's words (RA_WALK_SCRIPT, read only without the narration file),
    Form TK-1's hand drawings (tools/forms/TK-1/walk-hands.js), then tools/forms/RA-1/walk.js with SM-1's copy of TK-1's player
    put in at /*@@PLAYER@@*/;
  - the narration and Save as video beside the form: <script src="nbh-ra1-narration.js" defer> and
    <script src="nbh-tk1-video.js" defer>, and walk-audio.js copied to NBH-Workstation/nbh-ra1-narration.js.
usage (from the repository root): python3 tools/forms/RA-1/patch-walk.py   (then tools/pwa-sw.py, build-rps.py, build-single.py)"""
import json, os, re, shutil, sys
R = 'tools/forms/RA-1/'
FORM = 'NBH-Workstation/Reinforcer_Assessment_Protocol.html'
s = open(FORM, encoding='utf-8').read()

def between(text, a, b, new):
    """replace what lies between the markers a and b (both kept), or return None when they are not there"""
    i = text.find(a)
    if i < 0: return None
    j = text.find(b, i)
    assert j > i, 'unclosed marker ' + a
    return text[:i] + a + new + text[j:]

# 1. the styles (the form's own walkthrough CSS names .wk-rl and .wk-title: TK-1's timer ring, which this stage does not use, is left out)
tk = [l for l in open('tools/forms/TK-1/walk.css', encoding='utf-8').read().split('\n') if 'only-' not in l and not re.match(r'\.wk-(ring|rt|rl)\b', l)]
css = ('/* ===== v21.60 the Walkthrough video (tools/forms/RA-1/patch-walk.py): Form TK-1\'s walk.css (the player, the hands) ===== */\n' + '\n'.join(tk) + '\n' +
       open('tools/forms/SM-1/walk-sm.css', encoding='utf-8').read() + '\n' + open(R + 'walk-ra.css', encoding='utf-8').read() +
       '@media print{#walk .wk-sec{display:none!important}}\n')
blk = '<style id="ra1-walk-css">\n' + css + '</style>\n'
m = re.search(r'<style id="ra1-walk-css">.*?</style>\n', s, re.S)
s = s[:m.start()] + blk + s[m.end():] if m else s.replace('</head>', blk + '</head>', 1)

# 2. the section, at the top of the Walkthrough sheet
SEC = '''
<section class="wk-sec" id="wkSec" aria-labelledby="wkSecH">
  <h2 class="bar nbh-band wk-h" id="wkSecH">Walkthrough Video: The Reinforcer Assessment at the Table</h2>
  <p class="wk-intro" id="wkIntro">A narrated walkthrough, drawn with hands: the student&rsquo;s hand places a block in the bin (the response), the assessor&rsquo;s hand delivers the stimulus (the reinforcer), and the session panel counts: the clock, the responses, the rate, the access, the cumulative record. Then the form&rsquo;s own sheets show where the numbers go: the single-operant sheet and its verdict, the concurrent-operants allocation, the progressive-ratio break point, the runner, and the summary. It shows the form&rsquo;s worked example (the simulated student) with fixed numbers, never a student&rsquo;s record, so it can be shared with the staff who run the sessions. Play starts it with the sound on; the chapters jump to a step, and full screen fills the iPad. Space plays and pauses; the arrow keys skip five seconds.</p>
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
  <div class="wk-save"><button type="button" id="wkVideo">Save as video (MP4)</button><button type="button" id="wkCaps">Captions and chapters (for YouTube)</button><span class="hint">Save as video makes a video file of the walkthrough shown on this device, with the narration and captions, to share with the staff who run the sessions or to upload to YouTube. It takes a few minutes; nothing is sent anywhere, and the video holds only the worked example. Captions and chapters saves an SRT captions file to upload with the video and a chapter list (also copied) to paste into its description.</span></div>
  <p class="hint" id="wkVideoNote" hidden></p>
  <p class="hint" id="wkNote" hidden></p>
  <div class="wk-link"><label for="walkVideo">Your recorded version (a YouTube link, for the team)</label><input id="walkVideo" class="inline" data-meta="walkVideo" type="url" inputmode="url" placeholder="https://youtu.be/&hellip;" autocomplete="off" spellcheck="false"><a id="walkVideoOpen" href="#" target="_blank" rel="noopener" hidden>Open</a></div>
  <p class="hint">Saved with the form. The drawn stories below (the assessor, the student and the data collector step by step, and the printable job aids) are as before.</p>
  <details class="wk-tx"><summary>Transcript of the narration</summary><div id="wkTx"></div></details>
</section>
'''
A, Z = '<!-- ra1-walk:section -->', '<!-- /ra1-walk:section -->'
r = between(s, A, Z, SEC)
if r is None:
    anchor = '<div class="sheet noprint" id="walk" role="region" aria-labelledby="wk-title">\n'
    assert s.count(anchor) == 1, 'the Walkthrough sheet'
    s = s.replace(anchor, anchor + A + SEC + Z + '\n')
else: s = r

# 2b. the Guide names the video
GN = '<!-- ra1-walk:guide --><div class="warn"><b>Walkthrough video</b> View &rsaquo; <b>Walkthrough</b> plays a narrated walkthrough drawn with hands (about five minutes): the response at the table, the control condition, the stimulus delivered for the response and the reinforcement effect measured, the single-operant sheet and its verdict, concurrent operants and allocation, the progressive-ratio break point, the rules for every design, the runner, and the summary; with captions, chapters and Save as video. It shows the form\'s worked example, never a student\'s record. The drawn stories and the printable job aids follow it.</div><!-- /ra1-walk:guide -->\n'
s = re.sub(r'<!-- ra1-walk:guide -->.*?<!-- /ra1-walk:guide -->\n', '', s, flags=re.S)
a3 = '  <h3 class="sub">Decision Rules</h3>\n  <div class="tree">'
assert s.count(a3) == 1, 'the Guide\'s first heading'
s = s.replace(a3, GN + a3)

# 3. the script: the words, the hands, the walkthrough, the player
W = json.load(open(R + 'walk-script.json', encoding='utf-8'))
sm = open('tools/forms/SM-1/walk.js', encoding='utf-8').read()
p0 = sm.index('/* ---------------- the player: clock, narration, controls ---------------- */')
p1 = sm.index('/* ---------------- the view: leaving it pauses')
player = sm[p0:p1]
js = open(R + 'walk.js', encoding='utf-8').read()
assert '/*@@PLAYER@@*/' in js
js = js.replace('/*@@PLAYER@@*/', "/* ===== the player: Form TK-1's, as tools/forms/SM-1/walk.js carries it (put in by patch-walk.py) ===== */\n" + player)
hands = open('tools/forms/TK-1/walk-hands.js', encoding='utf-8').read()
LINK = '''
/* the link to the recorded version: Open follows it (http and https only); the field is a data-meta field, saved with the form */
(function(){const i=document.getElementById('walkVideo'),a=document.getElementById('walkVideoOpen');if(!i||!a)return;
  const paint=()=>{const v=i.value.trim();const ok=/^https?:\\/\\/\\S+$/i.test(v);a.hidden=!ok;a.href=ok?v:'#';};
  i.addEventListener('input',paint);i.addEventListener('change',paint);document.addEventListener('nbh:restored',paint);
  const mo=new MutationObserver(paint);mo.observe(i,{attributes:true,attributeFilter:['value']});setInterval(paint,1500);paint();})();
'''
js = ('/* ===== walk-script.json: the narration\'s words (read when nbh-ra1-narration.js is not beside the form) ===== */\nwindow.RA_WALK_SCRIPT=' +
      json.dumps([{'id': l['id'], 'text': l['text']} for l in W['lines']], ensure_ascii=False, separators=(',', ':')) + ';\n' +
      "/* ===== Form TK-1's hand drawings (tools/forms/TK-1/walk-hands.js), for the walkthrough ===== */\n" + hands.rstrip('\n') + '\n' + js + LINK)
assert '</script' not in js.lower(), 'a part holds </script'
A2, Z2 = '/* ra1-walk:begin */\n', '\n/* ra1-walk:end */\n'
r = between(s, A2, Z2, js)
if r is None:
    anchor = "\nrenderAll();\n})();\n</script>\n<script id=\"ra-run\""
    assert s.count(anchor) == 1, "the form's script's last line"
    s = s.replace(anchor, '\n' + A2 + js + Z2 + anchor[1:])
else: s = r
# the narration and Save as video, beside the form (the one-file editions put them inside)
for t in ('<script src="nbh-ra1-narration.js" defer></script>', '<script src="nbh-tk1-video.js" defer></script>'):
    if t not in s: s = s.replace('</body>', t + '\n</body>', 1)
open(FORM, 'w', encoding='utf-8').write(s)
if os.path.exists(R + 'walk-audio.js'):
    shutil.copyfile(R + 'walk-audio.js', 'NBH-Workstation/nbh-ra1-narration.js')
else:
    print('note: ' + R + 'walk-audio.js is not made yet (make-narration.py): nbh-ra1-narration.js not copied')
print('RA-1: the walkthrough written in;', os.path.getsize(FORM), 'bytes' + ('; nbh-ra1-narration.js %d bytes' % os.path.getsize('NBH-Workstation/nbh-ra1-narration.js') if os.path.exists('NBH-Workstation/nbh-ra1-narration.js') else ''))
