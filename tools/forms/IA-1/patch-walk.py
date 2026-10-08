#!/usr/bin/env python3
"""v21.56 Form IA-1's Walkthrough view (the FAST), put into the form (NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html).

IA-1 is kept as one page (not built from parts), so this script writes the walkthrough into it between its own markers, and
running it again replaces what it wrote:
  - <style id="ia1-walk-css">: Form TK-1's walk.css (the player; its view rules left out), SM-1's walk-sm.css (the pencil, the
    cards, the caption) and tools/forms/IA-1/walk-ia.css;
  - the Walkthrough button in the toolbar's View segment (after FAST) and its section, <!-- ia1-walk:section --> ... <!-- /ia1-walk:section -->,
    after the FAST sheet (shown by body.view-walk, as the sheets are);
  - the form's reset clears the view's own field (walk.video, the link to the recorded version);
  - (v21.58) the FAST's sixteen questions (FAST_ITEMS, between /* ia1-items:begin */ and /* ia1-items:end */): on the worksheet beside
    their numbers, on the respondent page when none are pasted, and so in the walkthroughs; the words around them;
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
  <h2 class="sub" style="margin-top:0">Walkthroughs: The FAST and the Convergence Sheet</h2>
  <div class="wk-modes" role="group" aria-label="Which walkthrough"><button type="button" data-mode="fast" aria-pressed="true">The FAST (for the assessor, 6 min)</button><button type="button" data-mode="inf" aria-pressed="false">The FAST for informants (1 min)</button><button type="button" data-mode="conv" aria-pressed="false">Convergence (2&frac12; min)</button></div>
  <p class="method wk-intro" id="wkIntro" data-fast="A narrated walkthrough of this form&rsquo;s own FAST worksheet, for everyone who gives or scores the FAST: what the sixteen items are, what to settle before informants answer, how the answers are entered and scored (with a practice check: the player stops and asks you for the outcome), what informant agreement looks like against the 196 pairs in Iwata, DeLeon and Roscoe (2013), what the outcome predicted in their second study, and what the results help determine. Built from the form as it is now; a form with no FAST answers yet shows a worked example of two informants. Play starts it with the sound on; the chapters jump to a step, and full screen fills the iPad. Space plays and pauses; the arrow keys skip five seconds." data-inf="One minute for the people who answer the FAST: one behavior as defined, yes if usually true, no if not, NA when they have never been in that situation, on their own, then the open-ended section. Save it as a video and put the link on the respondent pages (Setup, Respondent pages: the instructions link), so informants see it before they answer." data-conv="A narrated walkthrough of the Convergence sheet: each informant&rsquo;s outcome on each instrument mapped to the common categories, how consensus is counted (by informant; at least three; 80% or more), the physical-profile rule, the figure, the drafted hypothesis, the decision, and the verification record after the functional analysis. Built from the form as it is now; a form with no answers yet shows a worked example of three informants on three instruments, a majority without agreement.">A narrated walkthrough of this form&rsquo;s own FAST worksheet, for everyone who gives or scores the FAST: what the sixteen items are, what to settle before informants answer, how the answers are entered and scored (with a practice check: the player stops and asks you for the outcome), what informant agreement looks like against the 196 pairs in Iwata, DeLeon and Roscoe (2013), what the outcome predicted in their second study, and what the results help determine. Built from the form as it is now; a form with no FAST answers yet shows a worked example of two informants. Play starts it with the sound on; the chapters jump to a step, and full screen fills the iPad. Space plays and pauses; the arrow keys skip five seconds.</p>
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
  <div class="wk-quiz" id="wkQuiz" hidden><h3>Your turn</h3><p id="wkQuizQ"></p><div class="wk-qrow"><span>The outcome</span><div id="wkQuizA" role="group" aria-label="The outcome"></div></div><div class="wk-qrow"><span>The margin</span><div id="wkQuizM" role="group" aria-label="The margin"></div></div><p class="wk-qres" id="wkQuizR"></p><button type="button" class="btn" id="wkQuizGo">Play on</button></div>
  <div class="wk-save"><button type="button" class="btn" id="wkVideo">Save as video (MP4)</button><button type="button" class="btn" id="wkCaps">Captions and chapters (for YouTube)</button><span class="hint">Save as video makes a video file of the walkthrough shown on this device, with the narration and captions, to share with the staff who give or score the FAST, or to upload to YouTube. It takes a few minutes; nothing is sent anywhere. The video shows this form&rsquo;s own answers and informants: make it from an empty form (the worked example) or from the simulation before sharing it beyond the student&rsquo;s records. Captions and chapters saves an SRT captions file to upload with the video and a chapter list (also copied) to paste into its description.</span></div>
  <p class="hint" id="wkVideoNote" hidden></p>
  <p class="hint" id="wkNote" hidden></p>
  <div class="wk-link"><label for="walkVideo">Your recorded version (a YouTube link, for the team)</label><input id="walkVideo" name="walk.video" type="url" inputmode="url" placeholder="https://youtu.be/…" autocomplete="off" spellcheck="false"><a id="walkVideoOpen" href="#" target="_blank" rel="noopener" hidden>Open</a></div>
  <p class="hint">Saved with the form. The informant version&rsquo;s link belongs on the respondent pages as the instructions link (Setup, Respondent pages), so informants see it before they answer.</p>
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

# 3c. (v21.58) the FAST's sixteen questions, built in: on the worksheet beside their numbers, on the respondent page when none
# are pasted, and so on the walkthroughs' copies of the sheet. The wording is Figure 1 of Iwata, DeLeon & Roscoe (2013).
ITEMS = ["Does the problem behavior occur when the person is not receiving attention or when caregivers are paying attention to someone else?",
    "Does the problem behavior occur when the person's requests for preferred items or activities are denied or when these are taken away?",
    "When the problem behavior occurs, do caregivers usually try to calm the person down or involve the person in preferred activities?",
    "Is the person usually well behaved when (s)he is getting lots of attention or when preferred activities are freely available?",
    "Does the person usually fuss or resist when (s)he is asked to perform a task or to participate in activities?",
    "Does the problem behavior occur when the person is asked to perform a task or to participate in activities?",
    "If the problem behavior occurs while tasks are being presented, is the person usually given a \"break\" from tasks?",
    "Is the person usually well behaved when (s)he is not required to do anything?",
    "Does the problem behavior occur even when no one is nearby or watching?",
    "Does the person engage in the problem behavior even when leisure activities are available?",
    "Does the problem behavior appear to be a form of \"self-stimulation?\"",
    "Is the problem behavior less likely to occur when sensory stimulating activities are presented?",
    "Is the problem behavior cyclical, occurring for several days and then stopping?",
    "Does the person have recurring painful conditions such as ear infections or allergies? If so, list:",
    "Is the problem behavior more likely to occur when the person is ill?",
    "If the person is experiencing physical problems, and these are treated, does the problem behavior usually go away?"]
assert len(ITEMS) == 16
IT = "/* the FAST's sixteen questions (Iwata, DeLeon & Roscoe, 2013, Figure 1): on the worksheet, on the respondent page when none are pasted, in the walkthroughs */\nconst FAST_ITEMS=" + json.dumps({str(i + 1): t for i, t in enumerate(ITEMS)}, ensure_ascii=False, separators=(',', ':')) + ";"
A3, Z3 = '/* ia1-items:begin */\n', '\n/* ia1-items:end */\n'
r = between(s, A3, Z3, IT)
if r is None:
    anchor = 'const FAST_PUB={1:70.8,'
    assert s.count(anchor) == 1, 'FAST_PUB'
    s = s.replace(anchor, A3 + IT + Z3 + anchor)
else: s = r
# the worksheet: the question beside its number, the category as a small tag
a = "h+=`<tr><td class=\"lab c\">${it}</td><td class=\"catcell\">${d.cue?d.cue[it]:d.cats[c][0]}</td>`;"
b = "h+=`<tr><td class=\"lab c\">${it}</td><td class=\"catcell\">${key==='fast'&&typeof FAST_ITEMS!=='undefined'&&FAST_ITEMS[it]?'<div class=\"qtext\">'+esc(FAST_ITEMS[it])+'</div><span class=\"qcat\">'+d.cats[c][0]+'</span>':(d.cue?d.cue[it]:d.cats[c][0])}</td>`;   /* v21.58 the FAST's questions */"
if b not in s:
    assert s.count(a) == 1, 'renderGrid'
    s = s.replace(a, b)
# the respondent page: the built-in wording when none is pasted
a = "function rpWording(key){const t=val('rp.w.'+key);if(!t)return [];"
b = "function rpWording(key){const t=val('rp.w.'+key);if(!t)return key==='fast'&&typeof FAST_ITEMS!=='undefined'?Object.keys(FAST_ITEMS).map(k=>FAST_ITEMS[k]):[];   /* v21.58 the FAST's own questions */"
if b not in s:
    assert s.count(a) == 1, 'rpWording'
    s = s.replace(a, b)
a = "function rpCounts(){$$('.rp-count').forEach(el=>{const k=el.dataset.rpw,n=rpWording(k).length,ok=rpExpected(k).indexOf(n)>=0;el.textContent=n?'('+n+' pasted'+(ok?'':', expected '+rpExpected(k).join(' or '))+')':'';el.style.color=n&&!ok?'#a8321e':'';});}"
b = "function rpCounts(){$$('.rp-count').forEach(el=>{const k=el.dataset.rpw,pasted=!!val('rp.w.'+k),n=rpWording(k).length,ok=rpExpected(k).indexOf(n)>=0;el.textContent=!pasted&&n?'(built in)':n?'('+n+' pasted'+(ok?'':', expected '+rpExpected(k).join(' or '))+')':'';el.style.color=pasted&&n&&!ok?'#a8321e':'';});}"
if b not in s:
    assert s.count(a) == 1, 'rpCounts'
    s = s.replace(a, b)
# the worksheet's grid takes the sheet's width with the questions on it; the totals and the verdict go under it
a = '<div class="twoup">\n    <div class="nbh-scrollx"><table class="grid item" id="fastGrid"></table></div>'
b = '<div class="twoup fast-wide">\n    <div class="nbh-scrollx"><table class="grid item" id="fastGrid"></table></div>'
if b not in s:
    assert s.count(a) == 1, 'the FAST twoup'
    s = s.replace(a, b)
# (v21.59) the credit: the FAST's authors, with the article in APA form, under the worksheet's heading (and so on the stage)
CREDIT = ('<!-- ia1-credit --><p class="method fast-credit">The Functional Analysis Screening Tool (FAST) was developed by Brian A. Iwata (University of Florida), '
          'Iser G. DeLeon (Kennedy Krieger Institute and Johns Hopkins University School of Medicine), and Eileen M. Roscoe (New England Center for Children). '
          'Its items are reproduced from Figure 1 of: Iwata, B. A., DeLeon, I. G., &amp; Roscoe, E. M. (2013). Reliability and validity of the Functional Analysis Screening Tool. '
          '<em>Journal of Applied Behavior Analysis, 46</em>(1), 271&ndash;284. <a href="https://doi.org/10.1002/jaba.31" target="_blank" rel="noopener">https://doi.org/10.1002/jaba.31</a></p><!-- /ia1-credit -->\n')
s = re.sub(r'<!-- ia1-credit -->.*?<!-- /ia1-credit -->\n', '', s, flags=re.S)
a = '  <div class="bar nbh-band">FAST Scoring Worksheet</div>\n'
assert s.count(a) == 1, 'the FAST bar'
s = s.replace(a, a + '  ' + CREDIT)
# the respondent page for the FAST names its authors (plain text, under the page's own footnote)
RPC = "credit:'The Functional Analysis Screening Tool (FAST) was developed by Brian A. Iwata, Iser G. DeLeon, and Eileen M. Roscoe. Items reproduced from Figure 1 of Iwata, B. A., DeLeon, I. G., & Roscoe, E. M. (2013). Reliability and validity of the Functional Analysis Screening Tool. Journal of Applied Behavior Analysis, 46(1), 271\u2013284. https://doi.org/10.1002/jaba.31',"
a = "fast:{heading:'Functional Analysis Screening Tool (FAST)',scale:{kind:'yn'},"
if RPC not in s:
    assert s.count(a) == 1, 'RP_INFO.fast'
    s = s.replace(a, "fast:{heading:'Functional Analysis Screening Tool (FAST)'," + RPC + "scale:{kind:'yn'},")
a = "  if(key==='fast'&&$('#rpFx').checked)p.open=info.open.map(([id,label])=>({id,label:P(label)}));"
b = "  if(key==='fast'&&info.credit)p.credit=info.credit;   /* v21.59 the authors' credit on the page */\n" + a
if "p.credit=info.credit" not in s:
    assert s.count(a) == 1, 'rpPayloadFor open'
    s = s.replace(a, b)
# the words around it
a = "The instruments are published forms, so the wording is not built into the workstation: paste each instrument's items here once, one item per line, from your own copy (or from the Google Form you already use); the numbering may stay or go."
b = "The FAST's sixteen questions are built in (Iwata, DeLeon &amp; Roscoe, 2013, Figure 1): they show on its worksheet and its respondent page, so paste here only to change them. The QABF, MAS, PBQ and WEFA are published forms whose wording is not built into the workstation: paste each one's items here once, one item per line, from your own copy (or from the Google Form you already use); the numbering may stay or go."
if b not in s:
    assert s.count(a) == 1, 'the wording paragraph'
    s = s.replace(a, b)
b = '<label for="rpwFast">FAST, 16 items (paste only to change the built-in wording) <span class="rp-count" data-rpw="fast"></span></label>'
if b not in s:
    s, k = re.subn(r'<label for="rpwFast">FAST, 16 items[^<]*<span class="rp-count" data-rpw="fast"></span></label>', b, s)
    assert k == 1, 'the FAST label'
a = "<p class=\"method\" style=\"margin:0 0 10px\">Enter each informant's answer by item number: Y, N, or NA. Items 1 to 4"
b = "<p class=\"method\" style=\"margin:0 0 10px\">The sixteen questions are printed beside their numbers (Iwata, DeLeon &amp; Roscoe, 2013, Figure 1), so the worksheet reads as the interview or is filled from a paper FAST. Enter each informant's answer by item number: Y, N, or NA. Items 1 to 4"
if b not in s:
    assert s.count(a) == 1, 'the FAST method'
    s = s.replace(a, b)
a = "This form counts a one-item margin and notes it as a caution, because a one-item margin was typical of the FAST outcomes that matched the functional analysis in Study 2.</div>"
b = "This form counts a one-item margin and notes it as a caution, because a one-item margin was typical of the FAST outcomes that matched the functional analysis in Study 2. The item wording is reproduced from Figure 1 of the article.</div>"
if b not in s:
    assert s.count(a) == 1, 'the FAST cite'
    s = s.replace(a, b)

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
