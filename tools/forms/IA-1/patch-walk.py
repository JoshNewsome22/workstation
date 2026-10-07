#!/usr/bin/env python3
"""v21.56 Form IA-1's Walkthrough view (the FAST), put into the form (NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html).

IA-1 is kept as one page (not built from parts), so this script writes the walkthrough into it between its own markers, and
running it again replaces what it wrote:
  - <style id="ia1-walk-css">: Form TK-1's walk.css (the player; its view rules left out), SM-1's walk-sm.css (the pencil, the
    cards, the caption) and tools/forms/IA-1/walk-ia.css;
  - the Walkthrough button in the toolbar's View segment (after FAST) and its section, <!-- ia1-walk:section --> ... <!-- /ia1-walk:section -->,
    after the FAST sheet (shown by body.view-walk, as the sheets are);
  - the form's reset clears the view's own field (walk.video, the link to the recorded version);
  - inside the form's own script (a closure: its setView, snapshot, renderTot are private), between /* ia1-walk:begin */ and
    /* ia1-walk:end */ before its last line: walk-script.json's words (IA_WALK_SCRIPT, read only without the narration file),
    then tools/forms/IA-1/walk.js with SM-1's copy of TK-1's player put in at /*@@PLAYER@@*/;
  - the narration and Save as video beside the form: <script src="nbh-ia1-narration.js" defer> and
    <script src="nbh-tk1-video.js" defer>, and walk-audio.js copied to NBH-Workstation/nbh-ia1-narration.js.
usage (from the repository root): python3 tools/forms/IA-1/patch-walk.py   (then tools/pwa-sw.py, build-rps.py, build-single.py)"""
import json, os, re, shutil, sys
R = 'tools/forms/IA-1/'
FORM = 'NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html'
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
css = ('/* ===== v21.56 the Walkthrough (tools/forms/IA-1/patch-walk.py): Form TK-1\'s walk.css (the player) ===== */\n' + '\n'.join(tk) + '\n' +
       open('tools/forms/SM-1/walk-sm.css', encoding='utf-8').read() + '\n' + open(R + 'walk-ia.css', encoding='utf-8').read() +
       '@media print{#walk{display:none!important}}\n')
blk = '<style id="ia1-walk-css">\n' + css + '</style>\n'
m = re.search(r'<style id="ia1-walk-css">.*?</style>\n', s, re.S)
s = s[:m.start()] + blk + s[m.end():] if m else s.replace('</head>', blk + '</head>', 1)

# 2. the View button
VB = '<button data-view="walk" aria-pressed="false">Walkthrough</button>'
if VB not in s:
    a = '<button data-view="fast" aria-pressed="false">FAST</button>'
    assert s.count(a) == 1, 'the FAST view button'
    s = s.replace(a, a + '\n        ' + VB)
a = 'body.view-guide #guide,body.view-setup #setup,body.view-fast #fast,'
if 'body.view-walk #walk' not in s:
    assert s.count(a) == 1, 'the view rule'
    s = s.replace(a, 'body.view-walk #walk,' + a)
# the form's reset clears the view's own field
a = ',[name="rp.photo"]\').forEach(el=>{if(el.type===\'checkbox\')el.checked=false;'
if '[name^="walk."]' not in s:
    assert s.count(a) == 1, 'reset'
    s = s.replace(a, ',[name="rp.photo"],[name^="walk."]\').forEach(el=>{if(el.type===\'checkbox\')el.checked=false;')

# 3. the section
SEC = '''
<section id="walk" class="only-walk noprint" data-panel="walk">
  <h2 class="sub" style="margin-top:0">Walkthrough: The FAST, from the Form to the Research</h2>
  <p class="method wk-intro">A narrated walkthrough of this form&rsquo;s own FAST worksheet, for everyone who gives or scores the FAST: what the sixteen items are, what to settle before informants answer, how the answers are entered and scored, what informant agreement looks like against the 196 pairs in Iwata, DeLeon and Roscoe (2013), what the outcome predicted in their second study, and what the results help determine. It is built from the form as it is now (its definition, informants, answers and figures); a form with no FAST answers yet shows a worked example of two informants. Play starts it with the sound on; the chapters jump to a step, and full screen fills the iPad. Space plays and pauses; the arrow keys skip five seconds.</p>
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
  <div class="wk-save"><button type="button" class="btn" id="wkVideo">Save as video (MP4)</button><span class="hint">Makes a video file of this walkthrough on this device, with the narration and captions, to share with the staff who give or score the FAST, or to upload to YouTube. It takes a few minutes; nothing is sent anywhere. The video shows this form&rsquo;s own answers and informants: make it from an empty form (the worked example) or from the simulation before sharing it beyond the student&rsquo;s records.</span></div>
  <p class="hint" id="wkVideoNote" hidden></p>
  <p class="hint" id="wkNote" hidden></p>
  <div class="wk-link"><label for="walkVideo">Your recorded version (a YouTube link, for the team)</label><input id="walkVideo" name="walk.video" type="url" inputmode="url" placeholder="https://youtu.be/…" autocomplete="off" spellcheck="false"><a id="walkVideoOpen" href="#" target="_blank" rel="noopener" hidden>Open</a></div>
  <p class="hint">Saved with the form. The same link can be the instructions link on the respondent pages (Setup, Respondent pages), so informants see it before they answer.</p>
  <details class="wk-tx"><summary>Transcript of the narration</summary><div id="wkTx"></div></details>
  <div class="cite">The walkthrough's figures are from Iwata, B. A., DeLeon, I. G., &amp; Roscoe, E. M. (2013). Reliability and validity of the Functional Analysis Screening Tool. <em>Journal of Applied Behavior Analysis, 46</em>, 271&ndash;284: Study 1 (196 pairs of FASTs, 151 individuals; item agreement, Table 3; outcome agreement) and Study 2 (69 functional analyses, Table 5). The worked example is not a case.</div>
</section>
'''
A, Z = '<!-- ia1-walk:section -->', '<!-- /ia1-walk:section -->'
r = between(s, A, Z, SEC)
if r is None:
    anchor = '<!-- ================================================================ QABF'
    if s.count(anchor) != 1:
        # the sheet after FAST: whatever its comment says, it is the next sheet
        m2 = re.search(r'<div class="sheet" id="fast">.*?\n</div>\n', s, re.S)
        assert m2, 'the FAST sheet'
        s = s[:m2.end()] + A + SEC + Z + '\n' + s[m2.end():]
    else:
        s = s.replace(anchor, A + SEC + Z + '\n\n' + anchor)
else: s = r

# 3b. the Guide names the view
GN = '<!-- ia1-walk:guide --><div class="warn"><b>Walkthrough</b>View &rsaquo; <b>Walkthrough</b> plays a narrated walkthrough of the FAST on this form\'s own worksheet (about six minutes: the items, what to settle before informants answer, entering and scoring the answers, informant agreement and validity from Iwata et al., 2013, and what the results help determine), with captions, chapters and Save as video; it is built from the form as it is, or from a worked example while the FAST sheet is empty.</div><!-- /ia1-walk:guide -->\n'
s = re.sub(r'<!-- ia1-walk:guide -->.*?<!-- /ia1-walk:guide -->\n', '', s, flags=re.S)
a3 = '  <h3 class="sub">1. Reliability: Do Two Informants Give the Same Answers?</h3>'
assert s.count(a3) == 1, 'the Guide\'s first heading'
s = s.replace(a3, GN + a3)

# 4. the script: the words, the walkthrough, the player
W = json.load(open(R + 'walk-script.json', encoding='utf-8'))
sm = open('tools/forms/SM-1/walk.js', encoding='utf-8').read()
p0 = sm.index('/* ---------------- the player: clock, narration, controls ---------------- */')
p1 = sm.index('/* ---------------- the view: leaving it pauses')
player = sm[p0:p1]
js = open(R + 'walk.js', encoding='utf-8').read()
assert '/*@@PLAYER@@*/' in js
js = js.replace('/*@@PLAYER@@*/', "/* ===== the player: Form TK-1's, as tools/forms/SM-1/walk.js carries it (put in by patch-walk.py) ===== */\n" + player)
LINK = '''
/* the link to the recorded version: Open follows it (http and https only), and it is saved with the form as any field */
(function(){const i=document.getElementById('walkVideo'),a=document.getElementById('walkVideoOpen');if(!i||!a)return;
  const paint=()=>{const v=i.value.trim();const ok=/^https?:\\/\\/\\S+$/i.test(v);a.hidden=!ok;a.href=ok?v:'#';};
  i.addEventListener('input',paint);i.addEventListener('change',paint);document.addEventListener('nbh:restored',paint);
  const mo=new MutationObserver(paint);mo.observe(i,{attributes:true,attributeFilter:['value']});setInterval(paint,1500);paint();})();
'''
js = ('/* ===== walk-script.json: the narration\'s words (read when nbh-ia1-narration.js is not beside the form) ===== */\nwindow.IA_WALK_SCRIPT=' +
      json.dumps([{'id': l['id'], 'text': l['text']} for l in W['lines']], ensure_ascii=False, separators=(',', ':')) + ';\n' + js + LINK)
assert '</script' not in js.lower(), 'a part holds </script'
s = re.sub(r'<script id="ia1-walk">.*?</script>\n', '', s, flags=re.S)   # where an earlier version put it
A2, Z2 = '/* ia1-walk:begin */\n', '\n/* ia1-walk:end */\n'
r = between(s, A2, Z2, js)
if r is None:
    anchor = "\nrestore({counts:{}});\n})();\n"
    assert s.count(anchor) == 1, "the form's script's last line"
    s = s.replace(anchor, '\n' + A2 + js + Z2 + anchor[1:])
else: s = r
# the narration and Save as video, beside the form (the one-file editions put them inside)
for t in ('<script src="nbh-ia1-narration.js" defer></script>', '<script src="nbh-tk1-video.js" defer></script>'):
    if t not in s: s = s.replace('</body>', t + '\n</body>', 1)
open(FORM, 'w', encoding='utf-8').write(s)
if os.path.exists(R + 'walk-audio.js'):
    shutil.copyfile(R + 'walk-audio.js', 'NBH-Workstation/nbh-ia1-narration.js')
else:
    print('note: ' + R + 'walk-audio.js is not made yet (make-narration.py): nbh-ia1-narration.js not copied')
print('IA-1: the walkthrough written in;', os.path.getsize(FORM), 'bytes' + ('; nbh-ia1-narration.js %d bytes' % os.path.getsize('NBH-Workstation/nbh-ia1-narration.js') if os.path.exists('NBH-Workstation/nbh-ia1-narration.js') else ''))
