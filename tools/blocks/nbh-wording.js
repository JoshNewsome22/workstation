/* nbh-wording (v21.43): help with the wording of a form's narrative fields.

   An "Improve wording" button sits at the corner of every narrative field (a textarea that is shown, not in the
   toolbar or a dialog, not marked data-nbh-nowording, not a box the form has turned spelling check off for, and
   not one of the learner's particulars such as the name or ID) while the field has focus or text; from the
   keyboard, Alt+Enter (Option+Return on a Mac or an iPad) in the field does the same, and Tab goes from field to
   field as the form has it. It opens a panel holding the field's text (or the part of it
   that was selected) and three ways to improve it:
     1. Check wording: rule based and offline. It flags words that name a feeling, guess at intent or
        function, label the behavior or leave a count, a time or an intensity vague, says why, and says what
        to write instead; where a rule gives a direct replacement, Apply edits the panel's text. Nothing leaves
        the device. Words inside quotation marks are the learner's own and are not flagged.
     2. Rewrite with Claude: through the relay on the practice's website (tools/relay/), which holds the API
        key. A tab is unlocked once with a single-use passcode from the BCBA; the session token is kept in
        sessionStorage, never in a field or a saved file, and lasts until the relay's session time is up or the
        tab is closed (a tab this one opens, or one the browser restores, can carry it, so the panel offers
        Lock). Before anything is sent, the learner's name (whole, first, last, each half of a double name) and
        ID (read from the form's fields, or from the workstation's packet) and any names typed into "Also hide"
        are replaced by [Student], [ID], [Name 1] ...; the learner's surname after a title or before "family"
        (a parent) by [Family name]. The text exactly as it will be sent is shown first, with what may still be
        a name; the placeholders are put back in the answer, each as it was written. The forms carry the relay's
        address (tools/blocks/nbh-wording-config.json) before the relay itself may be on the website, so the first
        time the tab is shown the panel asks the relay whether it is there (nothing is sent); when it is not
        reachable, or not set up yet, the panel says so plainly, and that Check wording and Writing Tools still work.
     3. iPad Writing Tools: Apple's own, already in every text box on an iPad with Apple Intelligence; the
        panel only explains it.
   "Use this text" writes the panel's text into the field (or over the part that was selected) and fires
   input and change, so the form records, counts and saves it as if it had been typed. Cancel leaves the
   field as it was; the panel's edits are kept in memory and offered again when it reopens on that field.

   What it never does is add a field. Everything it draws lives in ONE element at the end of the body,
   inside a shadow root, so no query the forms or the workstation make for input, select, textarea, button
   or style ever sees it: the shell's snapshot (keysFor keys every control by its place in the document, and
   most of OB-1's controls have only their place), the form's saved file, the packet print, the progress
   dots and the accessible-name pass are exactly what they were. Key and input events from inside the panel
   stop at that element, so a form's own shortcuts (OB-1's Live Recorder counts on the digit keys) never
   see typing in the panel; keys pressed on a field's button go on, as from any button of the form. None of
   it prints. The rules and the relay's address are built in
   (tools/blocks/patch-wording.py); nothing here reads them from the page or from storage. */
(function(){
'use strict';
if (window.nbhWording) return;

const VERSION = 'v21.43';
const RAW_RULES = window.nbhWordingRules, RAW_CONFIG = window.nbhWordingConfig;
const MAX_SEND = 4000;                 /* characters; the relay's own limit (MAX_CHARS) answers 413 past its own */
const STORE = 'nbh.wording.session';   /* sessionStorage: this tab only */
const STYLES = [
  {id:'objective', label:'Objective and observable', hint:'Feelings, guesses and labels become what was seen; a gap is marked [describe what you saw].'},
  {id:'concise',   label:'Concise',                  hint:'Shorter, with every fact kept.'},
  {id:'report',    label:'Report-ready',             hint:'Complete sentences for a report, with every fact kept.'},
  {id:'grammar',   label:'Fix spelling and grammar only', hint:'Nothing else is changed.'}
];
let lastErr = '';

/* ------------------------------------------------------------------ small helpers */
const str = v => v == null ? '' : String(v);
function clean(s, n){ s = str(s).replace(/\s+/g, ' ').trim(); return n && s.length > n ? s.slice(0, n - 1).replace(/\s+$/, '') + '\u2026' : s; }
function uniqBy(list, key){ const seen = {}, out = []; list.forEach(x => { const k = key(x); if (k && !seen[k]) { seen[k] = 1; out.push(x); } }); return out; }
function cssEsc(v){ return window.CSS && CSS.escape ? CSS.escape(v) : str(v).replace(/["\\]/g, '\\$&'); }
/* an element; strings become text nodes, so nothing typed or received is ever parsed as markup */
function h(tag, attrs, kids){
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(k => {
    const v = attrs[k];
    if (v == null || v === false) return;
    if (k === 'class') e.className = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : String(v));
  });
  (Array.isArray(kids) ? kids : kids == null ? [] : [kids]).forEach(c => {
    if (c == null || c === false) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}
let WORDCH, NONW, UFLAG = 'u';
try { WORDCH = new RegExp('[\\p{L}\\p{N}_]', 'u'); NONW = '[^\\p{L}\\p{N}_]'; }
catch (e) { WORDCH = /[A-Za-z0-9_\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/; NONW = '[^A-Za-z0-9_\\u00C0-\\u024F\\u0370-\\u03FF\\u0400-\\u04FF]'; UFLAG = ''; }
const isW = c => !!c && WORDCH.test(c);
function deaccent(s){ try { return str(s).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { return str(s); } }
function normKey(s){ return deaccent(s).replace(/[\u2018\u2019\u02bc`]/g, "'").replace(/[\u2010-\u2015]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase(); }
function hm(ms){ const d = new Date(ms); let hh = d.getHours(); const ap = hh < 12 ? 'am' : 'pm'; hh = hh % 12 || 12; return hh + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap; }
function plural(n, one, many){ return n + ' ' + (n === 1 ? one : many); }

/* ------------------------------------------------------------------ the checker */
/* rules: {"version", "rules":[{id, cat, re, flags, why, suggest, replace?}]}. "re" is matched ignoring case, on
   whole words (checked here, so a rule needs no \b and a word with an accent or a digit is still a word); "flags"
   may add m, s or u. "replace" is the direct replacement, with $1-style groups, or a template with a blank such
   as "[number] times". A rule that does not compile, or that would match nothing at all, is left out and
   counted (nbhWording.rules().bad). The rules are compiled the first time something is checked, not when the page
   loads. */
let RS0 = null;
function rules(){ return RS0 || (RS0 = compile(RAW_RULES)); }
function compile(src){
  const out = {version:'', rules:[], bad:[]};
  if (!src || typeof src !== 'object' || !Array.isArray(src.rules)) return out;
  out.version = typeof src.version === 'string' ? src.version.slice(0, 40) : '';
  const seen = {};
  src.rules.forEach((r, i) => {
    const id = r && r.id != null ? String(r.id) : 'rule ' + (i + 1);
    if (!r || typeof r.re !== 'string' || !r.re || seen[id]) { out.bad.push(id); return; }
    let fl = 'gi';
    str(r.flags).replace(/[^msu]/g, '').split('').forEach(f => { if (fl.indexOf(f) < 0) fl += f; });
    let re = null;
    try { re = new RegExp(r.re, fl); } catch (e) { out.bad.push(id); return; }
    re.lastIndex = 0;
    if (re.test('')) { out.bad.push(id); return; }
    re.lastIndex = 0;
    seen[id] = 1;
    out.rules.push({id, cat:str(r.cat), re, why:str(r.why), suggest:str(r.suggest), replace: typeof r.replace === 'string' ? r.replace : null});
  });
  return out;
}
const BLANKRULE = {id:'blank', cat:'blank', why:'A blank is still to be filled in.', suggest:'Replace the words in brackets with what you saw or counted.', replace:null};
const BLANK = /\[[^\[\]\n]{1,48}\]/g, OURS = /^\[(?:student|id|family name|name \d{1,2}|(?:email|phone|date|number|address)(?: \d{1,2})?)\]$/i;
/* a word left out on purpose, as records write it ("[expletive]", "[inaudible]"), is not a blank to fill in */
const NOTBLANK = /^\[(?:expletives?|expletive deleted|profanity|obscenity|inaudible|unintelligible)\]$/i;
/* A form can say what in a field is not the writer's own wording: window.nbhWordingKeep(field, text) returns
   {spans:[[start, end], ...], words:[...], note:'...'} for that text. A finding inside a span (Form TB-1: a sentence still
   word for word as its behavior library wrote it) or that is one of the words (the names the card's target goes by) is
   not marked; the note says so in the panel. */
function keepOf(ta, t){
  const f = window.nbhWordingKeep; if (typeof f !== 'function' || !ta) return null;
  try { const k = f(ta, str(t)); return k && typeof k === 'object' ? k : null; } catch (e) { return null; }
}
/* the learner's own words, in quotation marks, are not the writer's and are not checked */
function quoteSpans(t){
  const spans = []; let open = -1, kind = '';
  for (let i = 0; i < t.length; i++) {
    const c = t.charAt(i);
    if (open < 0) {
      if (c === '\u201C') { open = i; kind = 'c'; } else if (c === '\u00AB') { open = i; kind = 'g'; } else if (c === '"') { open = i; kind = 's'; }
    } else if ((kind === 'c' && c === '\u201D') || (kind === 'g' && c === '\u00BB') || (kind === 's' && c === '"')) { spans.push([open, i + 1]); open = -1; }
    else if (c === '\n') { spans.push([open, i]); open = -1; }   /* a quotation left open ends with its line */
  }
  if (open >= 0) spans.push([open, t.length]);
  return spans;
}
function expand(tpl, m){ return tpl.replace(/\$(\$|&|[1-9])/g, (all, k) => k === '$' ? '$' : k === '&' ? m[0] : str(m[+k])); }
/* a replacement for the first word of a sentence starts with a capital, as the words it replaces did */
function fitCase(rep, orig){
  if (!rep) return rep;
  const a = orig.charAt(0), b = orig.charAt(1), r = rep.charAt(0);
  if (a !== a.toLowerCase() && (!b || b === b.toLowerCase()) && r !== r.toUpperCase()) return r.toUpperCase() + rep.slice(1);
  return rep;
}
function finding(r, t, s, e, m){
  const f = {id:r.id, cat:r.cat, start:s, end:e, text:t.slice(s, e), why:r.why, suggest:r.suggest, replacement:null};
  if (r.replace != null) { const rep = fitCase(expand(r.replace, m), f.text); if (rep !== f.text) f.replacement = rep; }
  else {
    /* a rule that reads the word before the phrase (to leave "staff refused" alone) marks the phrase without a joining
       word: "refused", not "and refused" */
    const lead = /^(?:and|but|or|then|also|yet)\s+/i.exec(f.text);
    if (lead && lead[0].length < f.text.length) { f.start += lead[0].length; f.text = f.text.slice(lead[0].length); }
  }
  return f;
}
/* The learner's own words about a feeling, given as what the learner said ("he said he was angry", "the student told
   staff she felt sad", "she reported feeling anxious"), report what was said, as words in quotation marks do: they
   are not the writer's guess at a feeling, so the "internal" rules leave them alone. (What someone else said the
   learner felt is still flagged.) What came before the phrase, in its sentence: */
const REPORTED = /(?:^|[^\w'\u2019\]])(?:he|she|they|(?:the\s+)?(?:student|learner|child|client)|\[student\])\s+(?:(?:then|also|later|quietly|loudly|calmly|again|finally|first)\s+)?(?:said|says|stated|states|reported|reports|told|tells|explained|explains|shared|shares|answered|answers|replied|replies|wrote|writes|typed|signed|indicated|indicates|complained|complains|admitted|admits|yelled|yells|shouted|shouts|screamed|whispered|mentioned|mentions|announced|exclaimed|expressed|expresses|repeated|repeats)(?:\s+(?:to\s+)?(?:me|us|him|her|them|staff|everyone|(?:the|his|her|their|a|an|my|our)\s+[\w'\u2019-]+|\[[^\]\n]{1,30}\]))?\s*,?\s+(?:that\s+)?(?:(he|she|they|i)\s+((?:was|were|is|am|are|'s|\u2019s|'m|\u2019m|felt|feels|feel|got|gets|get|had\s+been|has\s+been|have\s+been|was\s+feeling|is\s+feeling|were\s+feeling|would\s+be|will\s+be|became|becomes)\s+)?|(?:feeling|being)\s+)(?:(?:very|really|so|too|a\s+little|a\s+bit|kind\s+of|sort\s+of|extremely|super|more|less|quite|pretty)\s+)?$/i;
function reported(t, s, text){
  let pre = t.slice(Math.max(0, s - 120), s);
  const cut = Math.max(pre.lastIndexOf('.'), pre.lastIndexOf('!'), pre.lastIndexOf('?'), pre.lastIndexOf(';'), pre.lastIndexOf('\n'));
  if (cut >= 0) pre = pre.slice(cut + 1);
  const m = REPORTED.exec(pre);
  if (!m) return false;
  /* "said he" before "was angry": the phrase itself has to start with the verb then */
  return !(m[1] && !m[2] && !/^(?:was|were|is|am|are|got|gets|felt|feels|became|becomes|had\s+been|has\s+been)\b/i.test(text));
}
function check(text, keep){
  const t = str(text), q = quoteSpans(t), out = [];
  const quoted = (s, e) => q.some(p => s >= p[0] && e <= p[1]);
  rules().rules.forEach(r => {
    const re = r.re; re.lastIndex = 0; let m, n = 0;
    while ((m = re.exec(t)) !== null) {
      if (++n > 400) break;
      const s = m.index, e = s + m[0].length;
      if (e === s) { re.lastIndex = s + 1; continue; }
      if ((isW(t.charAt(s)) && isW(t.charAt(s - 1))) || (isW(t.charAt(e - 1)) && isW(t.charAt(e)))) { re.lastIndex = s + 1; continue; }
      if (quoted(s, e)) continue;
      if (r.cat === 'internal' && reported(t, s, m[0])) continue;
      out.push(finding(r, t, s, e, Array.prototype.slice.call(m)));
    }
    re.lastIndex = 0;
  });
  BLANK.lastIndex = 0; let b;
  while ((b = BLANK.exec(t)) !== null) if (!OURS.test(b[0]) && !NOTBLANK.test(b[0])) out.push(finding(BLANKRULE, t, b.index, b.index + b[0].length, [b[0]]));
  out.sort((a, c) => a.start - c.start || c.end - a.end);
  const seen = {};
  const list = out.filter(f => { const k = f.start + ':' + f.end + ':' + f.cat; if (seen[k]) return false; seen[k] = 1; return true; });
  if (!keep) return list;
  const spans = Array.isArray(keep.spans) ? keep.spans.filter(p => Array.isArray(p) && p.length === 2) : [], W = {};
  (Array.isArray(keep.words) ? keep.words : []).forEach(w => { const k = normKey(w); if (k) W[k] = 1; });
  const named = f => { const k = normKey(f.text); return !!(W[k] || W[k.replace(/(?:es|s)$/, '')] || W[k + 's']); };
  return list.filter(f => !spans.some(p => f.start >= p[0] && f.end <= p[1]) && !named(f));
}
/* (v21.43) a word taken out from between "a" or "an" and the next word: the article fits the word now after it ("a huge
   outburst" without "huge" is "an outburst") */
function fitArticle(a, b){
  const m = /(^|[^A-Za-z\u00C0-\u024F'\u2019])(an?|An?|AN?)$/.exec(a);
  if (!m || !/^[A-Za-z]/.test(b)) return a;
  const vow = (/^[aeiou]/i.test(b) && !/^(?:uni|use|usu|uti|ure|one|once|eu)/i.test(b)) || /^(?:hour|honest|honou?r|heir)/i.test(b);
  const was = m[2], want = vow ? 'an' : 'a';
  if (was.toLowerCase() === want) return a;
  const art = was === was.toUpperCase() && was.length > 1 ? want.toUpperCase() : was.charAt(0) === 'A' ? 'A' + want.slice(1) : want;
  return a.slice(0, a.length - was.length) + art;
}
function applyAt(t, f){
  let a = t.slice(0, f.start), b = t.slice(f.end);
  const rep = str(f.replacement);
  if (!rep) {   /* a removal: one space between the neighbours, none before punctuation; a sentence keeps its capital */
    a = a.replace(/[ \t]+$/, ''); b = b.replace(/^[ \t]+/, '');
    const c0 = f.text.charAt(0), b0 = b.charAt(0);
    if ((!a || /[.!?]["'\u201D\u2019)]?$/.test(a) || /\n$/.test(a)) && c0 !== c0.toLowerCase() && b0 && b0 !== b0.toUpperCase()) b = b0.toUpperCase() + b.slice(1);
    a = fitArticle(a, b);
    if (a && b && !/\n$/.test(a) && !/^[\n,.;:!?)\]]/.test(b)) a += ' ';
  }
  return {text: a + rep + b, at: a.length, len: rep.length};
}
const CATS = [
  [/^(internal|emotion|feeling|state|inner|mood)/i, 'Feeling or inner state'],
  [/^(intent|function|infer|motive|purpose)/i, 'Guess at intent or function'],
  [/^(label|tag)/i, 'Label'],
  [/^(freq|quant|count|amount|number)/i, 'Vague count'],
  [/^(dur|time|timing|when)/i, 'Vague time'],
  [/^(intens|degree|emphasis|severity)/i, 'Vague intensity'],
  [/^(diag|medic|clinic|patho)/i, 'Diagnosis or medical guess'],
  [/^(charac|judg|moral|person|opinion)/i, 'Opinion or judgment'],
  [/^blank/i, 'Blank to fill in']
];
function catLabel(c){ for (let i = 0; i < CATS.length; i++) if (CATS[i][0].test(c)) return CATS[i][1]; c = str(c).replace(/[-_]+/g, ' ').trim(); return c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Wording'; }

/* ------------------------------------------------------------------ fields */
/* Not a narrative, so no button: a field the form has turned spelling check off for (a box to paste a spreadsheet or
   codes into, a questionnaire's list of items) and the particulars the workstation fills in from its packet (the
   learner's name, ID, date of birth, grade and school, the case BCBA): there is nothing in a name or a date to word
   better. The packet's map of those fields is set by a script after this one, so it is read on first use. */
const PARTICULARS = ['client', 'sid', 'dob', 'grade', 'site', 'bcba', 'first', 'last'];
let PSEL = null;
function particularSel(){
  if (PSEL !== null) return PSEL;
  const M = window.__nbhPacketMap, out = [];
  PARTICULARS.forEach(k => (M && Array.isArray(M[k]) ? M[k] : []).concat(SEL[k] || []).forEach(s => {
    if (typeof s !== 'string' || out.indexOf(s) >= 0) return;
    try { document.querySelector(s); out.push(s); } catch (e) {}
  }));
  const sel = out.join(',');
  if (M) PSEL = sel;
  return sel;
}
function particular(ta){ const s = particularSel(); if (!s) return false; try { return ta.matches(s); } catch (e) { return false; } }
function eligible(ta){
  return !!ta && ta.tagName === 'TEXTAREA' && ta.isConnected && !ta.disabled && !ta.readOnly && ta.getAttribute('spellcheck') !== 'false' &&
    !ta.closest('[data-nbh-nowording],.toolbar,dialog,.nbh-pm') && !particular(ta);
}
/* Drawn on the screen. A field inside a closed <details> (Form SR-1's catalogue entries) keeps a box in Chromium
   (the content is only skipped), so its button would float over whatever is drawn where the field would be. */
function shown(ta){
  if (!ta.getClientRects().length) return false;
  if (typeof ta.checkVisibility === 'function') { try { if (!ta.checkVisibility()) return false; } catch (e) {} }
  for (let d = ta.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) {
    if (!d.open && !ta.closest('summary')) return false;
  }
  const cs = getComputedStyle(ta);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}
function fieldLabel(el){
  let t = clean(el.getAttribute('aria-label'));
  if (!t) t = clean(str(el.getAttribute('aria-labelledby')).split(/\s+/).filter(Boolean).map(i => { const e = document.getElementById(i); return e ? e.textContent : ''; }).join(' '));
  if (!t && el.id) { try { const l = document.querySelector('label[for="' + cssEsc(el.id) + '"]'); if (l) t = clean(l.textContent); } catch (e) {} }
  if (!t) { const l = el.closest('label'); if (l) t = clean(l.textContent); }
  if (!t) { const row = el.closest('.drow,.f,.field'); const lab = row && row.querySelector('.dlab,label,.lab,.lbl'); if (lab) t = clean(lab.textContent); }
  if (!t) {
    const td = el.closest('td,th'), tr = td && td.parentElement, tb = td && td.closest('table');
    if (tr && tb) { const col = Array.prototype.indexOf.call(tr.children, td), hr = tb.tHead ? tb.tHead.rows[0] : tb.rows[0];
      if (hr && hr !== tr && hr.children[col]) t = clean(hr.children[col].textContent); }
  }
  if (!t) t = clean(el.getAttribute('placeholder'), 60);
  return clean(t, 80) || 'This field';
}
/* where the field is: the heading band of its sheet, without the form's own title */
function fieldPlace(el){
  const sh = el.closest('.sheet,section,main');
  const band = sh && sh.querySelector('.nbh-band,.bar,h2');
  let t = band ? clean(band.textContent) : '';
  const i = t.lastIndexOf(' \u2014 ');
  if (i > 0) t = t.slice(i + 3);
  return clean(t, 60);
}
/* the same field after the form has drawn its sheet again */
function fieldKey(ta){
  if (ta.id) return '#' + cssEsc(ta.id);
  const parts = [];
  Array.prototype.forEach.call(ta.attributes, a => { if (/^data-/.test(a.name) && !/^data-nbh/.test(a.name)) parts.push('[' + a.name + '="' + cssEsc(a.value) + '"]'); });
  if (ta.name) parts.push('[name="' + cssEsc(ta.name) + '"]');
  return parts.length ? 'textarea' + parts.join('') : '';
}
function twin(key){ if (!key) return null; try { const l = document.querySelectorAll(key); return l.length === 1 && eligible(l[0]) ? l[0] : null; } catch (e) { return null; } }
/* A sheet the screen fit has zoomed: Chromium reports its boxes in screen pixels, older WebKit in the sheet's
   own. The overlay is not zoomed, so it needs screen pixels; the width tells the two apart. */
function zoomOf(el){ let z = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const v = n.style && n.style.zoom; if (v) { const f = parseFloat(v); if (f > 0) z *= /%$/.test(v) ? f / 100 : f; } } return z; }
function vrect(el){
  const r = el.getBoundingClientRect(), z = zoomOf(el), w = el.offsetWidth;
  if (z === 1 || !w || Math.abs(r.width - w * z) <= Math.abs(r.width - w)) return r;
  return {left:r.left * z, top:r.top * z, right:r.right * z, bottom:r.bottom * z, width:r.width * z, height:r.height * z};
}

/* ------------------------------------------------------------------ the learner, for de-identification */
const SEL = {
  client:['[data-m="client"]','[name="m.client"]','[name="s_name"]','[data-meta="client"]','#m_client','#mClient','[name="h-client"]','[name="h.client"]',
          '[name="c.client"]','[name="student"]','[name="s.student"]','#h-client','#hClient','#cClient','#sClient','[name="c.student"]'],
  sid:['[data-m="sid"]','[name="m.sid"]','[name="s_id"]','[data-meta="sid"]','#m_id','#mId','#sId','[name="s.sid"]','[name="h.sid"]','[name="c.sid"]','#hId','#cId','#h-id','[name="s.id"]'],
  first:['#sFirst','[name="s.first"]'], last:['#sLast','[name="s.last"]']
};
function readField(key){
  const M = window.__nbhPacketMap;
  const list = (M && Array.isArray(M[key]) ? M[key] : []).concat(SEL[key] || []);
  for (let i = 0; i < list.length; i++) {
    let e = null; try { e = document.querySelector(list[i]); } catch (x) {}
    if (e && e.tagName !== 'BUTTON' && /\S/.test(str(e.value))) return clean(e.value, 200);
  }
  return '';
}
/* the workstation's packet, as last sent to this form; kept in memory only */
let PKT = {};
window.addEventListener('message', ev => {
  if (window.parent === window || ev.source !== window.parent) return;
  const d = ev.data;
  if (d && d.nbh === 'packet' && d.packet && typeof d.packet === 'object') {
    const p = d.packet; PKT = {client:clean(p.client, 200), sid:clean(p.sid, 80), first:clean(p.first, 100), last:clean(p.last, 100), site:clean(p.site, 80), bcba:clean(p.bcba, 80)};
  }
});
function people(){
  const names = [readField('client'), clean(readField('first') + ' ' + readField('last')), PKT.client, clean(str(PKT.first) + ' ' + str(PKT.last))].filter(Boolean);
  const ids = [readField('sid'), PKT.sid].filter(Boolean);
  return {names: uniqBy(names, normKey), ids: uniqBy(ids, normKey)};
}
const TITLE = /^(mr|mrs|ms|miss|mx|dr|prof|coach|sr|jr|ii|iii|iv)\.?$/i;
/* parts of a surname that are not hidden on their own ("de", "van"): hidden only inside the whole name */
const PARTICLE = {};
'de del della der den di da das do dos du la las le les los van von ter ten bin ibn el al y e st'.split(' ').forEach(w => { PARTICLE[w] = 1; });
function words(s){
  let edge; try { edge = new RegExp('^[^\\p{L}\\p{N}]+|[^\\p{L}\\p{N}]+$', 'gu'); } catch (e) { edge = /^[^A-Za-z0-9\u00C0-\u024F]+|[^A-Za-z0-9\u00C0-\u024F]+$/g; }
  return str(s).split(/[\s,;/()]+/).map(w => w.replace(edge, '')).filter(w => w.length >= 2 && !TITLE.test(w));
}
/* a double name's halves: "Alvarez-Rios" is written "Rios" too */
function halves(w){ const p = w.split(/[-\u2010-\u2015]+/).filter(x => x.length >= 2 && !PARTICLE[x.toLowerCase()]); return p.length > 1 ? p : []; }
/* "Ellis, Jordan" is written "Jordan Ellis" in a sentence */
function inOrder(f){ const c = f.indexOf(','); return c > 0 ? clean(f.slice(c + 1) + ' ' + f.slice(0, c)) : f; }
function firstName(full){ return words(inOrder(clean(full)))[0] || ''; }
function nameForms(full){
  const f = clean(full); if (!f) return [];
  const order = inOrder(f), out = order !== f ? [f, order] : [f];
  const w = words(order);
  if (w.length >= 2) out.push(w[0] + ' ' + w[w.length - 1]);
  w.forEach((x, i) => { if (i === 0 || !PARTICLE[x.toLowerCase()]) out.push(x); out.push.apply(out, halves(x)); });   /* a first name is hidden even when it is "Al" or "Van" */
  return out;
}
/* the family's name, as in "Mr. Alvarez-Rios" or "the Alvarez family": the learner's surname, its halves, and the
   words after the first name together ("De La Cruz") */
function familyForms(full){
  const w = words(inOrder(clean(full)));
  if (w.length < 2) return [];
  const last = w[w.length - 1], out = [];
  if (w.length > 2) out.push(w.slice(1).join(' '));
  out.push(last);
  out.push.apply(out, halves(last));
  return out.filter(x => !PARTICLE[x.toLowerCase()]);
}
function idForms(id){
  const f = clean(id); if (!f) return [];
  const out = [f], compact = f.replace(/[\s\-_./]/g, '');
  if (compact !== f && compact.length >= 3) out.push(compact);
  /* the digits of an ID on their own, but not a year in it ("2026-0417": 0417, not 2026, which dates carry) */
  (f.match(/\d{4,}/g) || []).forEach(d => { if (!/^(?:19|20)\d\d$/.test(d)) out.push(d); });
  return out;
}
/* A first or last name that is also an everyday word is hidden where it is written with its capital,
   so "will" and "brown" stay in the sentence while "Will" and "Brown" go. */
const COMMON = {};
('will mark grace hope joy faith may june april august rose lily ivy dawn summer autumn winter sky river art bill rob pat sue ray jack frank max ' +
 'sunny miles chase hunter mason page brown green white black gray grey young king hall wood woods hill price bell cook wolf little long rich bob don ' +
 'gene earl guy harry angel honey crystal amber ruby pearl jade sandy rusty buck fox hawk drew lane reed rush west north south best hardy sharp ' +
 'strong stone wise early fair golden hart lamb nice rice short small smart sweet swift banks brooks rivers waters fields love star storm rain ' +
 'destiny harmony melody liberty patience prince major royal noble saint sage justice').split(' ').forEach(w => { COMMON[w] = 1; });
/* Who is hidden, and how: the learner ([Student], from the form's fields or the workstation's packet, and any "Also
   hide" entry marked as the learner), the learner's family name after a title or before "family" ([Family name]),
   the ID ([ID]), and every other "Also hide" entry ([Name 1], [Name 2] ... numbered later, in the order the text
   first names them). A form is matched ignoring case, but for an everyday word, matched only with its capital
   ("auto"); "ci" always ignores case (the person said this is the learner); "cs" is exact (initials). */
function hideItems(extra){
  const P = people(), items = [];
  const list = (extra || []).map(x => typeof x === 'string' ? {v:x} : x).filter(x => x && clean(x.v));
  const sf = [];
  P.names.forEach(nm => nameForms(nm).forEach(f => sf.push({f, mode:'auto', src:-1})));
  list.forEach((x, j) => {
    if (!x.student) return;
    const c = clean(x.v, 80);
    if (x.exact) sf.push({f:c, mode:'cs', src:j});
    else [c].concat(/\s/.test(c) ? words(c) : []).forEach(f => sf.push({f, mode:'ci', src:j}));
  });
  if (sf.length) items.push({ph:'[Student]', kind:'student', forms:sf, canon: firstName(P.names[0] || '') || P.names[0] || clean(list.filter(x => x.student)[0] ? list.filter(x => x.student)[0].v : '')});
  const ff = uniqBy([].concat.apply([], P.names.map(familyForms)), normKey);
  if (ff.length) items.push({ph:'[Family name]', kind:'family', forms: ff.map(f => ({f, mode:'auto', src:-1})), canon: ff[ff.length > 1 && /\s/.test(ff[0]) ? 1 : 0]});
  const idf = uniqBy([].concat.apply([], P.ids.map(idForms)), normKey);
  if (idf.length) items.push({ph:'[ID]', kind:'id', forms: idf.map(f => ({f, mode:'auto', src:-1})), canon:P.ids[0]});
  /* "Ms. Rivera" hides "Rivera" on its own too; "Ana Rivera" hides "Ana" and "Rivera"; an entry that is a date, a number,
     a telephone number or an email address ("10/12") gets a placeholder of its kind, [Date] rather than [Name 1] */
  list.forEach((x, j) => {
    if (x.student) return;
    const c = clean(x.v, 80), sub = piiKind(c);
    if (sub) { items.push({ph:null, kind:'pii', sub, entry:j, forms:[{f:c, mode:'ci', src:j}], canon:c}); return; }
    items.push({ph:null, kind:'name', entry:j, forms: uniqBy([c].concat(/\s/.test(c) ? words(c) : []), normKey).map(f => ({f, mode:'auto', src:j})), canon:c});
  });
  return {items, list};
}
/* (v21.43) Details that identify a person besides a name, hidden whole before any name inside them is looked for: an
   email address, a telephone number, a date with its year or its month's name (a date of birth among them), a street
   address, and a run of six or more digits (a Medicaid or case number). A short numeric date ("10/12") is not one of
   them (it reads like a score, 3/5), but one after a word that dates it ("set for 10/12") is offered under "Not hidden yet". */
const MON = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const PII = [
  ['Email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g],
  ['Phone', /(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\b\d{3}[\s.-])\d{3}[\s.-]\d{4}\b/g],
  ['Phone', /\b\d{3}-\d{4}\b/g],
  ['Date', /\b(?:19|20)\d\d-\d{1,2}-\d{1,2}\b/g],
  ['Date', /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:(?:19|20)\d\d|\d\d)\b/g],
  ['Date', new RegExp('\\b' + MON + '\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+(?:19|20)\\d\\d)?\\b', 'g')],
  ['Date', new RegExp('\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?' + MON + '\\.?,?\\s+(?:19|20)\\d\\d\\b', 'g')],
  ['Date', new RegExp('\\b' + MON + '\\.?\\s+(?:19|20)\\d\\d\\b', 'g')],
  ['Address', /\b\d{1,6}\s+(?:[A-Z][A-Za-z.'-]*\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Terrace|Ter|Circle|Cir|Parkway|Pkwy|Highway|Hwy|Trail|Trl)\b(?:\.?,?\s+(?:Apt|Apartment|Unit|Suite|Ste|#)\.?\s*[A-Za-z0-9-]+)?/g],
  ['Number', /\b\d+(?:-\d+)*\b/g]
];
function digits(s){ return str(s).replace(/\D/g, ''); }
function piiKind(v){
  const c = clean(v);
  if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(c)) return 'Email';
  if (/^[\d\s()+.\/-]+$/.test(c) && /\d/.test(c)) {
    if (/^\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?$/.test(c)) return 'Date';
    if (/^(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])?\d{3}[\s.-]\d{4}$/.test(c)) return 'Phone';
    return 'Number';
  }
  if (new RegExp('^(?:' + MON + '\\.?\\s+\\d{1,2}|\\d{1,2}\\s+' + MON + ')', 'i').test(c)) return 'Date';
  return '';
}
/* a short numeric date after a word that dates it, still in the text: offered for "Also hide" */
function shortDates(t){
  const out = [], re = /\b(on|by|for|from|until|till|since|dated?|DOB|born|due|meeting|appointment)\s+(?:the\s+)?(\d{1,2}\/\d{1,2})(?![\/\d])/gi; let m;
  while ((m = re.exec(str(t))) !== null && out.length < 4) if (out.indexOf(m[2]) < 0) out.push(m[2]);
  return out;
}
function pat(f){
  const one = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    .replace(/['\u2019\u2018\u02bc`]/g, "['\u2019\u2018\u02bc`]").replace(/[-\u2010-\u2015]/g, '[-\u2010-\u2015]');
  const d = deaccent(f);
  return '(?:' + one(f) + (d !== f ? '|' + one(d) : '') + ')';
}
/* The text as it will be sent, and how to put each placeholder back: one by one, each as it was written, when the
   answer keeps the placeholders in the same order (seq); otherwise each as the way of naming that the text used
   most (back; the shorter when it is a tie), in the spelling of the field or of the "Also hide" entry. */
function deidentify(text, extra){
  const H = hideItems(extra || []), items = H.items, byKey = {}, ci = [], cs = [];
  items.forEach((it, idx) => { if (it.kind === 'family') return; it.forms.forEach(fo => {
    const f = fo.f, k = normKey(f); if (!k) return;
    const sens = fo.mode === 'cs' || (fo.mode === 'auto' && it.kind !== 'id' && !!COMMON[k] && f.charAt(0) !== f.charAt(0).toLowerCase());
    const prev = byKey[k];
    if (prev) {
      /* the learner, confirmed in "Also hide": an everyday-word name is then hidden however it is written */
      if (prev.sens && !sens && prev.idx === idx) { prev.sens = false; prev.src = fo.src; ci.push({f:prev.f, p:pat(prev.f)}); }
      return;
    }
    byKey[k] = {f, idx, sens, src:fo.src};
    (sens ? cs : ci).push({f, p: pat(f)});
    if (sens && fo.mode === 'auto' && f !== f.toUpperCase()) cs.push({f: f.toUpperCase(), p: pat(f.toUpperCase())});
  }); });
  /* every hidden place becomes a mark (two control characters around a private-use one) that no pattern can match */
  const A = '\u0001', Z = '\u0002', occ = [];
  const mark = (idx, f, src) => { occ.push({idx, f, src}); return A + String.fromCharCode(0xE000 + occ.length - 1) + Z; };
  const MK = A + '([\\uE000-\\uF8FF])' + Z, at = ch => ch.charCodeAt(0) - 0xE000;
  let out = str(text);
  /* contact details, dates and long numbers first, each whole, so a name inside an email address goes with it; the ID the
     form holds stays the [ID] */
  const idDigits = {}; items.forEach(it => { if (it.kind === 'id') it.forms.forEach(fo => { const d = digits(fo.f); if (d.length >= 4) idDigits[d] = 1; }); });
  /* one placeholder for each value (an "Also hide" entry of the same value is that one) */
  const piiAt = {};
  items.forEach((it, i) => { if (it.kind === 'pii') piiAt[normKey(it.canon)] = i; });
  const piiItem = (sub, v) => { const k = normKey(v); if (piiAt[k] == null) { items.push({ph:null, kind:'pii', sub, forms:[{f:v, mode:'cs', src:-1}], canon:v}); piiAt[k] = items.length - 1; } return piiAt[k]; };
  PII.forEach(([sub, re]) => {
    re.lastIndex = 0;
    out = out.replace(re, m => {
      const d = digits(m);
      if (sub === 'Number' && (d.length < 6 || idDigits[d])) return m;
      if (sub !== 'Email' && idDigits[d]) return m;
      return mark(piiItem(sub, m), m, -1);
    });
  });
  /* the family's name first, where a title or "family" says it is not the learner: "Mr. [Family name]" */
  const fi = items.findIndex(it => it.kind === 'family');
  if (fi >= 0) {
    const fam = items[fi].forms.map(fo => fo.f).sort((a, b) => b.length - a.length), fp = fam.map(pat).join('|'), fk = {};
    fam.forEach(f => { fk[normKey(f)] = f; });
    try {
      out = out.replace(new RegExp('(^|' + NONW + ')((?:mr|mrs|ms|miss|mx|dr|prof)\\.?\\s+)(' + fp + ')(?=' + NONW + '|$)', 'gi' + UFLAG), (all, pre, title, m) => pre + title + mark(fi, fk[normKey(m)] || m, -1));
      out = out.replace(new RegExp('(^|' + NONW + ')(' + fp + ')(?=\\s+(?:family|families|household|home|parents|residence)(?:' + NONW + '|$))', 'gi' + UFLAG), (all, pre, m) => pre + mark(fi, fk[normKey(m)] || m, -1));
    } catch (e) { lastErr = 'deidentify: ' + e.message; }
  }
  const run = (list, flags) => {
    if (!list.length) return;
    list.sort((a, b) => b.f.length - a.f.length);
    let re; try { re = new RegExp('(^|' + NONW + ')(' + list.map(e => e.p).join('|') + ')(?=' + NONW + '|$)', flags); } catch (e) { lastErr = 'deidentify: ' + e.message; return; }
    out = out.replace(re, (all, pre, m) => {
      const hit = byKey[normKey(m)]; if (!hit) return all;
      return pre + mark(hit.idx, hit.f, hit.src);
    });
  };
  run(ci, 'gi' + UFLAG); run(cs, 'g' + UFLAG);
  /* "Jordan E. Ellis" as [Student] E. [Student]: one person, one placeholder */
  const twice = new RegExp(MK + '((?:\\s+[A-Z]\\.?)?\\s+)' + MK, 'g');
  for (let i = 0; i < 4; i++) {
    let merged = false;
    out = out.replace(twice, (all, a, mid, b) => {
      const x = occ[at(a)], y = occ[at(b)];
      if (x.idx !== y.idx) return all;
      merged = true; return mark(x.idx, x.f + mid + y.f, x.src >= 0 ? x.src : y.src);
    });
    if (!merged) break;
  }
  /* the order the text names them in: [Name n] counts from the first named, and the answer is put back by it */
  const order = [];
  out.replace(new RegExp(MK, 'g'), (all, ch) => { order.push(at(ch)); return all; });
  let nn = 0;
  order.forEach(k => { const it = items[occ[k].idx]; if (it.kind === 'name' && !it.ph) it.ph = '[Name ' + (++nn) + ']'; });
  /* [Date] when the text holds one date, [Date 1], [Date 2] ... when it holds more, so each goes back where it was */
  const seenPii = [], nPii = {};
  order.forEach(k => { const i = occ[k].idx, it = items[i]; if (it.kind === 'pii' && seenPii.indexOf(i) < 0) { seenPii.push(i); nPii[it.sub] = (nPii[it.sub] || 0) + 1; } });
  const cPii = {};
  seenPii.forEach(i => { const it = items[i]; if (!it.ph) it.ph = nPii[it.sub] > 1 ? '[' + it.sub + ' ' + (cPii[it.sub] = (cPii[it.sub] || 0) + 1) + ']' : '[' + it.sub + ']'; });
  const sent = out.replace(new RegExp(MK, 'g'), (all, ch) => items[occ[at(ch)].idx].ph);
  const seq = order.map(k => ({ph: items[occ[k].idx].ph, f: occ[k].f}));
  const map = items.filter(it => it.ph).map(it => {
    const c = {}, forms = [];
    seq.forEach(x => { if (x.ph === it.ph) { if (!(x.f in c)) { c[x.f] = 0; forms.push(x.f); } c[x.f]++; } });
    const n = forms.reduce((a, f) => a + c[f], 0);
    const back = forms.length ? forms.slice().sort((a, b) => c[b] - c[a] || a.length - b.length)[0] : it.canon;
    return {ph:it.ph, kind:it.kind, n, forms, back};
  });
  /* each "Also hide" entry: the placeholder it became, and how often the text names it */
  const entries = H.list.map((x, j) => {
    const it = items.filter(i => (i.kind === 'name' || i.kind === 'pii') && i.entry === j)[0];
    if (it) return {v:x.v, student:false, ph:it.ph, n: seq.filter(y => y.ph && y.ph === it.ph).length};
    const keys = {}; (x.exact ? [clean(x.v, 80)] : [clean(x.v, 80)].concat(words(x.v))).forEach(f => { keys[normKey(f)] = 1; });
    return {v:x.v, student:true, ph:'[Student]', n: seq.filter(y => y.ph === '[Student]' && keys[normKey(y.f)]).length};
  });
  return {text:sent, map, seq, entries};
}
/* The answer with the names put back. In order when the answer names the placeholders in the order they were sent
   (a grammar fix always does); otherwise each placeholder is put back as "back", and one that stood for more than
   one way of naming someone is listed in "mixed", for the panel to say so. */
function restore(text, prep){
  const map = (prep && prep.map) || [], seq = (prep && prep.seq) || [], found = [];
  const re = /\[\s*(student|id|family\s+name|name\s*(\d{1,2})|(email|phone|date|number|address)(?:\s*(\d{1,2}))?)\s*\]/gi; let m;
  const t = str(text), cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  while ((m = re.exec(t)) !== null) {
    const ph = m[2] ? '[Name ' + (+m[2]) + ']' : m[3] ? '[' + cap(m[3]) + (m[4] ? ' ' + (+m[4]) : '') + ']' : /^id$/i.test(m[1]) ? '[ID]' : /^family/i.test(m[1]) ? '[Family name]' : '[Student]';
    found.push({at:m.index, len:m[0].length, raw:m[0], ph});
  }
  const inOrder = found.length === seq.length && found.every((x, i) => x.ph === seq[i].ph);
  const unknown = [], mixed = [];
  let out = '', a = 0;
  found.forEach((x, i) => {
    out += t.slice(a, x.at); a = x.at + x.len;
    const e = map.filter(y => y.ph === x.ph)[0];
    if (!e || !e.back) { unknown.push(x.raw); out += x.raw; return; }
    if (inOrder) { out += seq[i].f; return; }
    out += e.back;
    if (e.forms.length > 1 && mixed.indexOf(e) < 0) mixed.push(e);
  });
  out += t.slice(a);
  return {text:out, unknown, inOrder, mixed: mixed.map(e => ({ph:e.ph, forms:e.forms.slice(), back:e.back}))};
}
/* words still in the text that look like names: a capital word that is not an ordinary word for a sentence to start
   with, wherever it is (names start sentences too: "Liam laughed."), and not in capitals throughout (BCBA, IEP) */
const NOTNAME = {};
('i a an the and but or so if then when while after before during until since because monday tuesday wednesday thursday friday saturday sunday ' +
 'january february march april may june july august september october november december math maths reading writing science english spanish ' +
 'history art music pe gym lunch recess library ela ipad lego legos bcba rbt ot pt slp iep bip fba abc ok okay no yes student students teacher ' +
 'teachers paraprofessional para aide staff peer peers adult adults mom dad mother father grandma grandpa room class classroom school bus office ' +
 'nurse principal counselor therapist observer first next today tomorrow yesterday am pm mr mrs ms miss dr coach he she they his her their it ' +
 'we you this that these those there here what who ' +
 'him them us me my mine our ours your yours its himself herself themselves itself ourselves myself whom whose which where why how ' +
 'at in on upon of off for from to into onto out over under by with within without about above below behind beside besides between ' +
 'among around across along through throughout toward towards per via near inside outside past again also although though however ' +
 'once as both each every all some most many several few no none neither either nor other another such same more less much any ' +
 'nobody everyone everybody someone somebody something nothing everything anything anyone anybody ' +
 'approximately about around overall total totals later finally eventually immediately initially afterwards afterward meanwhile ' +
 'still only just even yet already almost nearly instead otherwise therefore thus hence perhaps maybe probably please thank thanks ' +
 'second third fourth fifth last previous following prior subsequently additionally consequently ' +
 'data behavior behaviors behaviour antecedent antecedents consequence consequences setting settings activity activities observation ' +
 'observations session sessions note notes time times interval intervals trial trials task tasks work worksheet worksheets ' +
 'centers center circle transition transitions morning afternoon evening night day week weekend hour hours minute minutes ' +
 'target targets baseline goal goals plan plans summary hypothesis function functions prompt prompts prompting ' +
 'independent independently group groups small whole large partner pair pairs table desk desks floor door chair carpet line hallway ' +
 'walked sat ran cried hit threw yelled screamed left returned completed started stopped began refused pushed kicked put went came ' +
 'looked said asked answered raised placed picked got took made gave used worked wrote read played stood lay dropped grabbed moved ' +
 'followed transitioned entered exited remained continued attempted tried received earned lost needed wanted requested approached ' +
 'touched slapped bit spit scratched pinched hugged laughed smiled giggled talked called shouted whispered sang hummed rocked flapped ' +
 'spun jumped climbed crawled fell slid tore ripped broke banged tapped kept held carried brought handed showed pointed nodded shook ' +
 'waved turned faced leaned rested slept ate drank chewed finished ended prompted redirected praised reminded ignored blocked ' +
 'removed offered provided presented delivered modeled demonstrated told instructed directed cued observed noted recorded saw heard ' +
 'watched waited paused looks walks sits runs cries hits throws yells screams leaves returns completes starts stops begins refuses ' +
 'pushes kicks goes comes says asks answers gets takes makes gives uses works writes reads plays stands drops grabs moves follows ' +
 'stay stays stayed sit stand walk run look listen wait stop go come give take let get help work write read play try put keep ' +
 'good great nice well wow oh hey hi hello bye sorry fine sure right wrong yeah yep nope ' +
 'when whenever wherever whatever whichever whoever unless whether while whilst ' +
 'student\'s teacher\'s peer\'s mom\'s dad\'s don\'t can\'t won\'t didn\'t doesn\'t isn\'t wasn\'t weren\'t aren\'t hasn\'t ' +
 'haven\'t hadn\'t couldn\'t wouldn\'t shouldn\'t i\'m i\'ve i\'ll i\'d he\'s she\'s it\'s they\'re we\'re you\'re that\'s there\'s what\'s let\'s ' +
 'one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty twice others classmate classmates ' +
 'parent parents grandmother grandfather brother sister brothers sisters sibling siblings sub substitute kid kids child children ' +
 'boy boys girl girls timer alarm break breaks snack specials earlier shortly unfortunately luckily fortunately suddenly ' +
 'family name').split(' ').forEach(w => { NOTNAME[w] = 1; });
function likelyNames(t){
  let re; try { re = new RegExp('(\\p{Lu}[\\p{L}\'\u2019-]{1,30})', 'gu'); } catch (e) { re = /([A-Z][A-Za-z\u00C0-\u024F'\u2019-]{1,30})/g; }
  const out = [], seen = {}; let m;
  while ((m = re.exec(t)) !== null && out.length < 10) {
    const w = m[1].replace(/['\u2019-]+$/, ''), s = m.index, prev = t.charAt(s - 1);
    if (isW(prev) || prev === '[' || w.length < 2) continue;
    if (w === w.toUpperCase()) continue;
    const lw = w.toLowerCase().replace(/\u2019/g, "'"), k = lw.replace(/'s$/, '');
    if (NOTNAME[k] || NOTNAME[lw] || seen[k]) continue;
    seen[k] = 1; out.push(w.replace(/['\u2019]s$/, ''));
  }
  return out;
}
/* the learner's other ways of being written that the text holds but are not hidden: an everyday-word name in lower
   case ("hunter"), and the initials ("A.L.", "AL"); offered for "Also hide" as the learner */
function studentHints(t){
  const P = people(), out = [], seen = {};
  const has = (f, flags) => { try { return new RegExp('(^|' + NONW + ')' + pat(f) + '(?=' + NONW + '|$)', flags + UFLAG).test(t); } catch (e) { return false; } };
  P.names.forEach(nm => {
    const w = words(inOrder(clean(nm))).filter(x => !PARTICLE[x.toLowerCase()]);
    w.forEach(x => { const k = normKey(x); if (COMMON[k] && !seen[k] && has(k, 'g')) { seen[k] = 1; out.push({v:k, why:'the student\u2019s name in lower case'}); } });
    if (w.length >= 2) {
      const a = w[0].charAt(0).toUpperCase(), b = w[w.length - 1].charAt(0).toUpperCase();
      /* and from every part of the name, each half of a double surname too: J.A.R. and JAR for Jordan Alvarez-Rios */
      const parts = [].concat.apply([], w.map(x => halves(x).length ? halves(x) : [x])).map(x => x.charAt(0).toUpperCase());
      const forms = [a + '.' + b + '.', a + '. ' + b + '.', a + b];
      if (parts.length > 2) forms.unshift(parts.join('.') + '.', parts.join('. ') + '.', parts.join(''), parts.join('.'));
      forms.forEach(f => { if (!seen[f] && has(f, 'g')) { seen[f] = 1; out.push({v:f, exact:true, why:'the student\u2019s initials'}); } });
    }
  });
  return out.slice(0, 5);
}
/* other people and places this form names (a teacher, a parent, the observers, the school), offered for "Also hide"
   with one tap */
function formNames(){
  const out = [], re = /teacher|parent|caregiver|guardian|mother|father|aide|paraprof|sibling|observer|secondobs|obs2|assessor|school|district|campus|clinic|agency|bcba|therapist|provider|counsel|principal|psycholog|nurse|doctor|physician|interviewer|informant|respondent/i;
  document.querySelectorAll('input[data-meta],input[data-field],input[name],input[id]').forEach(e => {
    if (e.type && !/^(text|search)$/i.test(e.type)) return;
    if (e.closest('#nbh-wording-ui')) return;
    const k = [e.getAttribute('data-meta'), e.getAttribute('data-field'), e.name, e.id].join(' ');
    if (!re.test(k) || /email|phone|tel\b|date|time|role|count|agree/i.test(k)) return;
    const v = clean(e.value, 80); if (!v || v.length > 60 || v.split(/\s+/).length > 6 || !/[A-Za-z\u00C0-\u024F]/.test(v)) return;
    out.push({v, why: fieldLabel(e)});
  });
  /* the workstation's packet: the school and the case BCBA */
  if (PKT.site) out.push({v:PKT.site, why:'the school, from the workstation'});
  if (PKT.bcba) out.push({v:PKT.bcba, why:'the BCBA, from the workstation'});
  return uniqBy(out, x => normKey(x.v)).slice(0, 8);
}

/* ------------------------------------------------------------------ the relay */
function pageOrigin(){ try { if (typeof self.origin === 'string') return self.origin; } catch (e) {} return location.origin; }
/* Where Rewrite with Claude can go from this page. The relay lives on the practice's site and answers its own
   pages only, so a page opened from a file, or from another site, is told so before anything is tried; the
   same site with or without "www." calls the relay on the page's own host, so the call stays same-origin. */
function relayPlan(){
  const raw = RAW_CONFIG && typeof RAW_CONFIG.relay === 'string' ? RAW_CONFIG.relay.trim() : '';
  if (!raw) return {ok:false, why:'unset'};
  let u; try { u = new URL(raw, document.baseURI); } catch (e) { return {ok:false, why:'unset'}; }
  if (!/^https?:$/.test(u.protocol)) return {ok:false, why:'unset'};
  const po = pageOrigin();
  if (!po || po === 'null' || !/^https?:/.test(po)) return {ok:false, why:'file', host:u.hostname};
  let p; try { p = new URL(po); } catch (e) { return {ok:false, why:'file', host:u.hostname}; }
  const bare = x => x.replace(/^www\./i, '').toLowerCase();
  if (bare(p.hostname) !== bare(u.hostname)) return {ok:false, why:'site', host:u.hostname, here:p.hostname};
  if (p.protocol !== u.protocol) return {ok:false, why:'scheme', host:u.hostname};
  if (p.hostname !== u.hostname && p.port === u.port) u = new URL(u.pathname, p.origin);
  return {ok:true, base: (u.origin + u.pathname).replace(/\/+$/, ''), host:u.hostname};
}
function planText(plan){
  if (plan.why === 'file') return 'This copy of the forms is opened from a file on this device, so it cannot reach the rewrite service. Rewrite with Claude works in the forms opened from ' + plan.host + '.';
  if (plan.why === 'site') return 'Rewrite with Claude is set up for the forms on ' + plan.host + '. This copy opens from ' + plan.here + ', so the rewrite service will not answer it.';
  if (plan.why === 'scheme') return 'This page was opened without https. Open it again with https:// at the start of the address to use Rewrite with Claude.';
  return 'Not set up for this copy of the forms.';
}
function getSession(plan){
  let o = null;
  try { o = JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (e) { return null; }
  if (!o || o.v !== 1 || typeof o.token !== 'string' || !plan || o.base !== plan.base) return null;
  if (o.exp && Date.now() > o.exp) { clearSession(); RW.ended = o.exp; return null; }
  return o;
}
function setSession(plan, token, exp){ try { sessionStorage.setItem(STORE, JSON.stringify({v:1, base:plan.base, token, exp:exp || 0})); return true; } catch (e) { return false; } }
function clearSession(){ try { sessionStorage.removeItem(STORE); } catch (e) {} }
function expiryOf(x){
  if (typeof x === 'number' && isFinite(x) && x > 0) return x < 1e12 ? x * 1000 : x;
  if (typeof x === 'string' && x) { if (/^\d+$/.test(x)) return expiryOf(+x); const t = Date.parse(x); if (!isNaN(t)) return t; }
  return 0;
}
/* a passcode as the relay prints it: twelve characters in groups of three */
function canonCode(raw){
  const s = str(raw).toUpperCase().replace(/[\s\u00A0]+/g, '').replace(/[\u2010-\u2015\u2212_]/g, '-');
  const a = s.replace(/[^A-Z0-9]/g, '');
  if (a.length === 12) return a.match(/.{3}/g).join('-');
  return s.slice(0, 40);
}
async function post(plan, path, body, ms){
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  RW.ac = ac; let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; if (ac) ac.abort(); }, ms);
  try {
    const res = await fetch(plan.base + path, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      credentials:'omit', cache:'no-store', redirect:'error', signal: ac ? ac.signal : undefined});
    let data = null; const txt = await res.text();
    if (txt && txt.length < 300000) { try { data = JSON.parse(txt); } catch (e) {} }
    let retry = null; try { retry = res.headers.get('Retry-After'); } catch (e) {}
    return {ok:res.ok, status:res.status, body:data, retry};
  } catch (err) {
    return {ok:false, status:0, aborted: !!(ac && ac.signal.aborted && !timedOut), timeout:timedOut, offline: navigator.onLine === false};
  } finally { clearTimeout(timer); if (RW.ac === ac) RW.ac = null; }
}
/* Whether the rewrite service is on the website at all. The forms carry its address from the start, and the relay can
   be put on the website after them (tools/relay/README.md), so the first time Rewrite with Claude is shown on a tab
   that is not unlocked, the panel asks once (GET <relay>/api/health; nothing is sent) and says at once when the
   service is not there, rather than only after a passcode is tried. A failed check is made again a minute later when
   the tab is shown again; the passcode box works either way. */
const REACH = {state:'', at:0, text:''};   /* state: '' not asked, 'busy', 'ok', 'down' (text: what to say) */
async function health(plan){
  const ac = typeof AbortController === 'function' ? new AbortController() : null;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; if (ac) ac.abort(); }, 8000);
  try {
    const res = await fetch(plan.base + '/api/health', {method:'GET', credentials:'omit', cache:'no-store', redirect:'error', signal: ac ? ac.signal : undefined});
    let data = null; const txt = await res.text();
    if (txt && txt.length < 20000) { try { data = JSON.parse(txt); } catch (e) {} }
    return {ok:res.ok, status:res.status, body:data};
  } catch (err) {
    return {ok:false, status:0, timeout:timedOut, offline: navigator.onLine === false};
  } finally { clearTimeout(timer); }
}
async function reach(plan){
  if (REACH.state === 'busy' || REACH.state === 'ok' || (REACH.state === 'down' && Date.now() - REACH.at < 60000)) return;
  REACH.state = 'busy';
  const r = await health(plan);
  REACH.at = Date.now();
  if (r.ok && r.body && typeof r.body === 'object' && r.body.ok === true) { REACH.state = 'ok'; REACH.text = ''; }
  else if (r.offline) { REACH.state = ''; REACH.text = ''; }
  else { REACH.state = 'down'; REACH.text = errText(r, 'reach', plan.host); }
  showReach();
}
/* the check's answer goes into its own place on the passcode step, so a passcode being typed keeps its focus */
function showReach(){
  const box = P && P.tps[1].querySelector('#rch');
  if (!box) return;
  box.textContent = '';
  if (REACH.state === 'down' && REACH.text) box.appendChild(msgBox({kind:'err', text:REACH.text}));
}
function errCode(b){
  if (!b || typeof b !== 'object') return '';
  const e = b.error;
  return [typeof e === 'string' ? e : e && (e.code || e.type || e.message), b.code, b.reason, b.message].filter(x => typeof x === 'string').join(' ').toLowerCase();
}
function waitText(r){
  let s = r.retry && /^\d+$/.test(r.retry) ? +r.retry : 0;
  const b = r.body || {};
  if (!s && typeof b.retry_after === 'number') s = b.retry_after;
  if (!s && typeof b.retryAfter === 'number') s = b.retryAfter;
  if (!s) return '';
  const m = Math.max(1, Math.round(s / 60));
  return s < 90 ? ' Wait about a minute, then try again.' : ' Wait about ' + m + ' minutes, then try again.';
}
const KEPT = ' Your text is still here.';
/* What the person is told when a call to the rewrite service fails; "host" is the site the service lives on. No answer
   at all, an answer that is not the service's own (the website's "not found" page: the relay is not on the website yet,
   or not where the forms look for it) and the service saying it is not set up yet are each said plainly, with what
   works without it: Check wording and the iPad's Writing Tools need no rewrite service.
   kind: 'redeem' (a passcode), 'rewrite' (a text), 'reach' (the check made as the tab opens; nothing was sent). */
function errText(r, kind, host){
  const c = errCode(r.body), svc = 'The rewrite service' + (host ? ' on ' + host : ''), keep = kind === 'reach' ? '' : KEPT;
  const still = ' Check wording and the iPad\u2019s Writing Tools still work without it.';
  const json = !!r.body && typeof r.body === 'object' && !Array.isArray(r.body);
  if (r.aborted) return '';
  if (r.offline) return 'This device is offline, so nothing was sent.' + keep + ' Check wording works without a connection.';
  if (r.timeout && kind !== 'reach') return 'The rewrite service took too long to answer, so the request was stopped.' + KEPT + ' Try again in a minute.';
  if (!r.status || r.timeout) return svc + ' is not reachable, or it is not set up yet.' + keep + still;
  if (/setup_?required|not_?set_?up/.test(c)) return svc + ' is not set up yet.' + keep + still;
  if ((!json && r.status !== 413 && r.status !== 429) || r.status === 404 || r.status === 405 || /not_?found|method_not_allowed/.test(c) || (r.ok && kind === 'reach'))
    return svc + ' is not reachable, or it is not set up yet.' + keep + still;
  if (/origin|referer|cross/.test(c)) return 'The rewrite service refused this copy of the forms: it answers only the forms on its own site.';
  if (kind === 'reach') return 'The rewrite service is not working right now. Try again later.' + still;
  if (kind === 'redeem') {
    if (r.status === 429) return 'Too many passcode tries.' + (waitText(r) || ' Wait about 15 minutes, then try again.');
    if (r.status >= 500) return 'The rewrite service is not working right now. Try again later.' + still;
    return 'That passcode was not accepted. A passcode works once and only for a limited time: check it, or ask your BCBA for a new one.';
  }
  if (r.status === 401 || r.status === 403 || /expired|token|session_?(ended|invalid)|unauthori/.test(c)) return 'This tab\u2019s session has ended. Enter a new passcode from your BCBA to go on.' + KEPT;
  if (r.status === 413 || /too_?long|too large|max_?chars/.test(c)) return 'The text is too long to send in one go. Select part of it in the field, then open Improve wording again.' + KEPT;
  if (r.status === 429) {
    if (/session|quota|limit_?reached|max_?requests/.test(c)) return 'This session has used all of its rewrites. Ask your BCBA for a new passcode.' + KEPT;
    return 'Too many rewrites in a short time.' + (waitText(r) || ' Wait a minute, then try again.') + KEPT;
  }
  if (r.status === 422 || /refus/.test(c)) return 'The rewrite service could not rewrite this text. Try another style, or use Check wording.' + KEPT;
  if (r.status >= 500) return 'The rewrite service is not working right now (it answered with an error). Try again later.' + KEPT + still;
  return 'The rewrite service could not use this request (error ' + r.status + ').' + KEPT;
}
function itemText(x){
  if (typeof x === 'string') return clean(x, 400);
  if (!x || typeof x !== 'object') return '';
  const from = str(x.from || x.before || x.original), to = str(x.to || x.after || x.replacement), why = str(x.why || x.reason || x.note || x.text);
  return clean([from && '\u201C' + from + '\u201D', to && '\u2192 \u201C' + to + '\u201D', why].filter(Boolean).join(' '), 400);
}
function readAnswer(b, style){
  if (!b || typeof b !== 'object' || !Array.isArray(b.rewrites)) return null;
  const list = b.rewrites.filter(x => x && typeof x.text === 'string' && x.text.trim() && x.text.length <= 40000);
  if (!list.length) return null;
  const pick = list.filter(x => x.style === style)[0] || list[0];
  const items = a => Array.isArray(a) ? a.map(itemText).filter(Boolean).slice(0, 12) : [];
  return {text:pick.text, changes:items(b.changes), cautions:items(b.cautions)};
}
/* word by word: what the suggestion kept, took out and put in */
function diff(a, b){
  const tok = s => s.match(/\s+|\S+\s*/g) || [];
  const A = tok(a), B = tok(b), n = A.length, m = B.length;
  if (!n || !m || n * m > 1200000) return null;
  const k = s => s.trim(), W = m + 1, L = new Uint32Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    L[i * W + j] = k(A[i]) === k(B[j]) ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
  const ops = []; let i = 0, j = 0;
  const push = (t, s) => { const l = ops[ops.length - 1]; if (l && l.t === t) l.s += s; else ops.push({t, s}); };
  while (i < n && j < m) {
    if (k(A[i]) === k(B[j])) { push('=', B[j]); i++; j++; }
    else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) { push('-', A[i]); i++; }
    else { push('+', B[j]); j++; }
  }
  while (i < n) push('-', A[i++]);
  while (j < m) push('+', B[j++]);
  return ops;
}

/* ------------------------------------------------------------------ look */
const KEYNAME = 'Alt+Enter (Option+Return on a Mac or iPad)';
const ICON = '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4.2 13.6 12.9 4.9a1.7 1.7 0 0 1 2.4 0l.3.3a1.7 1.7 0 0 1 0 2.4l-8.7 8.7H4.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M11.6 6.2l2.6 2.6M11 16.6h5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SANS = 'var(--nbh-sans,"Inter","Segoe UI","Helvetica Neue",Arial,system-ui,sans-serif)';
const SERIF = 'var(--nbh-serif,"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Times New Roman",serif)';
const CSS = `
:host{all:initial}
*{box-sizing:border-box}
[hidden]{display:none!important}
.lay{position:absolute;left:0;top:0;width:0;height:0;z-index:19}
.mir{position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;overflow:hidden}
.iw{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;min-width:44px;height:44px;margin:0;padding:0 7px;
  border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;
  font:600 12px/1 ${SANS};color:var(--nbh-slate,#254657);transition:opacity .12s ease}
.iw .pl{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;min-width:30px;padding:0 7px;border-radius:15px;
  background:#fff;border:1px solid var(--nbh-field,#b7c8c5);white-space:nowrap;
  box-shadow:0 1px 2px rgba(24,46,67,.10),0 4px 10px -6px rgba(24,46,67,.35)}
.iw.sm .pl{height:24px;min-width:24px;padding:0 5px;border-radius:12px}
.iw .ic{width:16px;height:16px;flex:0 0 auto}
.iw.sm .ic{width:14px;height:14px}
.iw .lb{display:none}
.iw.wide .lb{display:inline}
.iw .bd{min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--nbh-flag,#9b4e15);color:#fff;font-size:10.5px;line-height:17px;text-align:center}
.iw.sm .bd{min-width:15px;height:15px;line-height:15px;font-size:10px}
.iw:hover .pl{border-color:var(--nbh-teal,#76a2a3);background:var(--nbh-shade,#f5f8f7)}
.iw:focus{outline:none}
.iw:focus-visible .pl{border-color:var(--nbh-focus,#2f7fa8);box-shadow:0 0 0 3px var(--nbh-focus-soft,rgba(47,127,168,.26))}
.iw.quiet .pl{opacity:.9}
.iw.over .pl{opacity:.62}
.iw.over:hover .pl,.iw.over:focus-visible .pl{opacity:1}
.iw.away{opacity:0;pointer-events:none}
@media (prefers-reduced-motion:reduce){.iw{transition:none}}

dialog.pn{position:fixed;inset:0;margin:auto;padding:0;border:1px solid #c9d4d2;border-radius:10px;
  width:min(1060px,calc(100% - 32px));max-width:none;height:calc(100% - 32px);height:min(900px,calc(100% - 32px));max-height:none;
  background:#fff;color:var(--nbh-ink,#1a2933);font:14px/1.5 ${SANS};box-shadow:0 30px 70px -24px rgba(24,46,67,.55);overflow:hidden}
dialog.pn::backdrop{background:rgba(22,36,46,.38)}
dialog.pn.fb{z-index:2147483000}
.fbk{position:fixed;inset:0;background:rgba(22,36,46,.38);z-index:2147482999}
.in{display:flex;flex-direction:column;height:100%}
.ph{display:flex;align-items:flex-start;gap:12px;padding:14px 12px 12px 20px;border-bottom:1px solid #e3eae8}
.ph h2{margin:0;font:600 19px/1.3 ${SERIF};color:var(--nbh-navy,#182e43)}
h2[tabindex]:focus,h2[tabindex]:focus-visible,h4[tabindex]:focus,h4[tabindex]:focus-visible{outline:none}
.ph .ps{margin:3px 0 0;color:var(--nbh-muted,#54676f);font-size:12.5px;line-height:1.45}
.px{margin-left:auto;flex:0 0 auto;width:44px;height:44px;border:0;border-radius:8px;background:transparent;color:var(--nbh-muted,#54676f);
  font:400 26px/1 ${SANS};cursor:pointer}
.px:hover{background:var(--nbh-mist,#eaf2f0);color:var(--nbh-navy,#182e43)}
.px:focus-visible,.b:focus-visible,.tab:focus-visible,.lk:focus-visible,.chip button:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--nbh-slate,#254657);outline-offset:1px}
.pb{flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}
.cols{display:grid;grid-template-columns:minmax(0,1fr)}
.ce{padding:14px 20px 16px;background:var(--nbh-shade,#f5f8f7);border-bottom:1px solid #e3eae8}
.ct{padding:6px 20px 20px;min-width:0}
/* side by side on a wide screen (an iPad held sideways); one above the other on an upright iPad and a phone */
@media (min-width:960px){
  .pb{display:flex;overflow:hidden}
  .cols{flex:1 1 auto;grid-template-columns:minmax(0,10fr) minmax(0,11fr);min-height:0}
  .ce{display:flex;flex-direction:column;border-bottom:0;border-right:1px solid #e3eae8;overflow:auto;min-height:0}
  .ce .ed{flex:1 1 auto;resize:none;min-height:10em}
  .ct{overflow:auto;min-height:0}
}
.et{display:flex;align-items:baseline;gap:8px;margin:0 0 6px}
.et label{font:600 15px/1.3 ${SERIF};color:var(--nbh-navy,#182e43)}
.et .n{margin-left:auto;font-size:12px;color:var(--nbh-muted,#54676f);font-variant-numeric:tabular-nums}
.ed{display:block;width:100%;min-height:120px;resize:vertical;margin:0;padding:10px 12px;border:1px solid var(--nbh-field,#b7c8c5);border-radius:6px;
  background:#fff;color:var(--nbh-ink,#1a2933);font:16px/1.5 ${SANS};box-shadow:inset 0 1px 1px rgba(24,46,67,.04)}
.ed:focus{outline:none;border-color:var(--nbh-focus,#2f7fa8);box-shadow:0 0 0 3px var(--nbh-focus-soft,rgba(47,127,168,.26))}
.ea{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:8px 0 0;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.sel{margin:0 0 8px;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.box{margin:0 0 10px;padding:10px 13px;border-radius:0 6px 6px 0;background:var(--nbh-mist,#eaf2f0);border-left:4px solid var(--nbh-teal,#76a2a3);font-size:13px;line-height:1.5}
.box.err{background:#fbf2f2;border-left-color:var(--nbh-red,#8e2a2a);color:#5c1f1f}
.box.ok{background:#eef6f1;border-left-color:#2f7d55}
.box .ba{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--nbh-rule,#cfdad8);margin:0 0 14px;position:sticky;top:0;background:#fff;z-index:1}
.tab{flex:0 1 auto;min-height:44px;padding:12px 10px 9px;border:0;border-bottom:3px solid transparent;background:none;cursor:pointer;
  font:600 13px/1.2 ${SANS};color:var(--nbh-muted,#54676f);white-space:nowrap}
.tab:hover{color:var(--nbh-navy,#182e43);background:var(--nbh-shade,#f5f8f7)}
.tab[aria-selected="true"]{color:var(--nbh-navy,#182e43);border-bottom-color:var(--nbh-teal,#76a2a3)}
.tab .cnt{display:inline-block;min-width:18px;margin-left:6px;padding:1px 5px;border-radius:9px;background:var(--nbh-flag,#9b4e15);color:#fff;font-size:11px;line-height:16px;text-align:center}
.tab .s{display:none}
@media (max-width:520px){.tab{padding:12px 7px 9px}.tab .l{display:none}.tab .s{display:inline}}
.tp:focus{outline:none}
h3.sh{margin:2px 0 8px;font:600 16px/1.3 ${SERIF};color:var(--nbh-navy,#182e43)}
h4{margin:14px 0 6px;font:600 14.5px/1.3 ${SERIF};color:var(--nbh-navy,#182e43)}
p{margin:0 0 8px}
.note{font-size:12.5px;line-height:1.5;color:var(--nbh-muted,#54676f)}
.sum{margin:0 0 10px;font-size:13.5px;color:var(--nbh-ink,#1a2933)}
.sum b{color:var(--nbh-navy,#182e43)}
ol.fds{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-direction:column;gap:10px}
.fd{padding:10px 12px 11px;border:1px solid #e3eae8;border-left:4px solid var(--nbh-flag,#9b4e15);border-radius:0 8px 8px 0;background:#fff}
.fd .cat{margin:0 0 3px;font:600 11px/1.3 ${SANS};letter-spacing:.05em;text-transform:uppercase;color:var(--nbh-flag,#9b4e15)}
.fd .cx{margin:0 0 6px;font-size:14px;line-height:1.5;color:var(--nbh-ink,#1a2933);overflow-wrap:anywhere}
.fd .more{margin:-2px 0 6px;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.fd .why{margin:0 0 4px;font-size:13px;color:#2b3a44}
.fd .sg{margin:0 0 8px;font-size:13px;color:var(--nbh-ink,#1a2933)}
.fd .sg b{color:var(--nbh-navy,#182e43)}
.fd .ac,.acts{display:flex;flex-wrap:wrap;gap:8px}
mark{background:var(--nbh-flag-soft,#faf0e6);color:inherit;border-bottom:2px solid var(--nbh-flag,#9b4e15);padding:0 1px}
.b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;margin:0;padding:8px 14px;border:1px solid var(--nbh-rule2,#93aead);
  border-radius:6px;background:#fff;color:var(--nbh-navy,#182e43);font:600 13px/1.25 ${SANS};cursor:pointer;text-align:center;
  box-shadow:0 1px 1px rgba(24,46,67,.05);max-width:100%}
.b:hover{background:var(--nbh-mist,#eaf2f0);border-color:var(--nbh-teal,#76a2a3)}
.b.pri{background:var(--nbh-navy,#182e43);border-color:var(--nbh-navy,#182e43);color:#fff}
.b.pri:hover{background:var(--nbh-slate,#254657);border-color:var(--nbh-slate,#254657)}
.b[disabled]{opacity:.5;cursor:default}
.b[disabled]:hover{background:#fff;border-color:var(--nbh-rule2,#93aead)}
.b.pri[disabled]:hover{background:var(--nbh-navy,#182e43)}
@media (pointer:coarse){.b{min-height:44px}}
.lk{display:inline-flex;align-items:center;min-height:32px;margin:0;padding:4px 2px;border:0;background:none;color:var(--nbh-slate,#254657);
  font:600 12.5px/1.2 ${SANS};text-decoration:underline;text-underline-offset:2px;cursor:pointer}
.lk[disabled]{color:#9aa9af;text-decoration:none;cursor:default}
.sty{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin:0 0 12px}
.sty .b{display:block;text-align:left;padding:10px 12px;min-height:56px}
.sty .b span{display:block;margin-top:3px;font-weight:400;font-size:12.5px;line-height:1.4;color:var(--nbh-muted,#54676f)}
.sty .b:hover span{color:#3d5058}
label.fl{display:block;margin:12px 0 4px;font-weight:600;font-size:13px;color:var(--nbh-navy,#182e43)}
.row{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap}
.row input{flex:1 1 180px;min-width:0}
input.tx{min-height:44px;padding:8px 10px;border:1px solid var(--nbh-field,#b7c8c5);border-radius:6px;background:#fff;color:var(--nbh-ink,#1a2933);
  font:16px/1.3 ${SANS};box-shadow:inset 0 1px 1px rgba(24,46,67,.04)}
input.tx:focus{outline:none;border-color:var(--nbh-focus,#2f7fa8);box-shadow:0 0 0 3px var(--nbh-focus-soft,rgba(47,127,168,.26))}
input.code{letter-spacing:.08em;font-variant-numeric:tabular-nums;text-transform:uppercase}
ul.chips{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:8px 0 0;padding:0}
.chip{display:inline-flex;align-items:center;gap:2px;padding:2px 2px 2px 10px;border:1px solid var(--nbh-rule,#cfdad8);border-radius:16px;background:var(--nbh-mist,#eaf2f0);font-size:13px}
.chip .cp{font-weight:600;color:var(--nbh-slate,#254657);margin-left:4px;font-size:12px}
.chip button{width:32px;height:32px;border:0;border-radius:16px;background:none;color:var(--nbh-muted,#54676f);font:400 18px/1 ${SANS};cursor:pointer}
.chip button:hover{background:#fff;color:var(--nbh-navy,#182e43)}
.chip .tg{width:auto;height:28px;margin:0 2px 0 6px;padding:0 9px;border:1px solid var(--nbh-rule2,#93aead);border-radius:14px;background:#fff;
  color:var(--nbh-slate,#254657);font:600 12px/1 ${SANS}}
.chip .tg[aria-pressed="true"]{background:var(--nbh-slate,#254657);border-color:var(--nbh-slate,#254657);color:#fff}
.note.warnl{color:var(--nbh-flag,#9b4e15);font-weight:600}
.sugg{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 0;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.sugg .b{min-height:34px;padding:5px 10px;font-size:12.5px}
pre.sent,div.ans{margin:6px 0 10px;padding:10px 12px;border-radius:6px;background:#fff;white-space:pre-wrap;overflow-wrap:anywhere;
  font:14px/1.55 ${SANS};color:var(--nbh-ink,#1a2933)}
pre.sent{border:1px dashed var(--nbh-rule2,#93aead);max-height:40vh;overflow:auto}
div.ans{border:1px solid var(--nbh-teal,#76a2a3);box-shadow:inset 3px 0 0 var(--nbh-teal,#76a2a3)}
.phd{padding:0 3px;border-radius:3px;background:var(--nbh-mint,#bcd9d4);color:var(--nbh-navy,#182e43);font-weight:600}
ins{text-decoration:none;background:#e3f1e8;border-bottom:2px solid #2f7d55}
del{color:#8e2a2a;background:#fbf0f0;text-decoration:line-through;text-decoration-color:rgba(142,42,42,.6)}
.hid{margin:0 0 8px;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.hid b{color:var(--nbh-slate,#254657)}
ul.li{margin:4px 0 10px;padding-left:20px;font-size:13px}
ul.li li{margin:0 0 3px}
.st{margin:0 0 2px;font-size:13px;color:var(--nbh-ink,#1a2933)}
.st .dot{display:inline-block;width:8px;height:8px;margin:0 7px 1px 1px;border-radius:4px;background:#2f9e6a;vertical-align:middle}
.st .lk{margin-left:6px;min-height:28px;padding:2px}
.st + .note{margin-bottom:12px}
.spin{display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid var(--nbh-mint,#bcd9d4);border-top-color:var(--nbh-slate,#254657);
  animation:sp .8s linear infinite;vertical-align:-4px;margin-right:8px}
@keyframes sp{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.spin{animation:none}}
.wt p{font-size:13.5px}
.pf{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 20px;border-top:1px solid #e3eae8;background:#f7f9f8}
.pf .fm{flex:1 1 240px;margin:0;font-size:12.5px;color:var(--nbh-muted,#54676f)}
.pf .fm.warn{color:var(--nbh-flag,#9b4e15);font-weight:600}
.pf .fb{display:flex;gap:8px;margin-left:auto}
@media (max-width:600px){
  dialog.pn{width:100%;height:100%;max-height:100%;border:0;border-radius:0}
  .ph{padding-left:16px}.ce{padding:12px 16px 14px}.ct{padding:6px 16px 18px}.pf{padding:10px 16px}
  .pf .fb{width:100%}.pf .fb .b{flex:1 1 0}
}
.tst{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9001;display:flex;gap:10px;align-items:center;
  max-width:min(560px,calc(100% - 32px));padding:6px 6px 6px 16px;border-radius:8px;background:#16242e;color:#f1f6f5;
  font:13.5px/1.45 ${SANS};box-shadow:0 12px 30px -12px rgba(22,36,46,.6)}
.tst button{min-height:36px;padding:6px 12px;border:1px solid rgba(255,255,255,.35);border-radius:6px;background:transparent;color:#fff;
  font:600 13px/1.2 ${SANS};cursor:pointer}
.tst button.x{border:0;font-size:18px;padding:6px 10px}
@media print{:host,.lay,.tst,dialog,.fbk{display:none!important}}
`;

/* ------------------------------------------------------------------ the buttons at the fields */
let host = null, root = null, lay = null, mir = null, tst = null;
const B = new Map();             /* textarea -> its button */
const counts = new WeakMap();    /* textarea -> {v, n}: the checker's count for the badge */
const sels = new WeakMap();      /* textarea -> the last selection in it */
let pinned = null, panelOpen = false, sched = 0, moT = 0, RO = null, treeV = 0, blur = {ta:null, t:0};
let TALL = false;   /* a field taller than the screen has a button, held on the screen (see place()): it follows the page's scroll */
function build(){
  if (host) return true;
  if (!document.body) return false;
  host = document.createElement('div');
  host.id = 'nbh-wording-ui'; host.className = 'noprint';
  host.setAttribute('data-nbh-nowording', '');
  host.style.cssText = 'display:block;position:static;width:0;height:0;margin:0;padding:0;border:0;overflow:visible';
  root = host.attachShadow({mode:'open'});
  root.innerHTML = '<style>' + CSS + '</style><div class="lay"></div><div class="mir" aria-hidden="true"></div>';
  lay = root.querySelector('.lay'); mir = root.querySelector('.mir');
  /* Everything typed in the panel stops here, so the form's own shortcuts never see it. Keys pressed on a field's
     button go on to the page, as they would from any button of the form (OB-1's Live Recorder counts on 1 to 4 and
     pauses on Space while its keys are on); the button keeps Tab and Escape for itself. */
  ['keydown','keyup','keypress','input','change','beforeinput','focusin','focusout','compositionstart','compositionupdate','compositionend',
   'paste','cut','copy','select'].forEach(t => host.addEventListener(t, e => {
    if (/^key/.test(t) && onButton(e)) return;
    e.stopPropagation();
  }));
  document.body.appendChild(host);
  return true;
}
function onButton(e){
  const p = typeof e.composedPath === 'function' ? e.composedPath() : [];
  for (let i = 0; i < p.length && p[i] !== host; i++) if (p[i].classList && p[i].classList.contains('iw')) return true;
  return false;
}
function activeTa(){ const a = document.activeElement; return a && a.tagName === 'TEXTAREA' && eligible(a) ? a : pinned; }
/* The checker's count for a field's badge. The field being worked in is counted at once; the others when the page
   has nothing else to do (a form opened with many notes is not held up by them), and their badges follow. */
const idleQ = new Set(); let idleH = 0;
const later = window.requestIdleCallback ? f => window.requestIdleCallback(f, {timeout:1500}) : f => setTimeout(() => f(null), 200);
function countFor(ta, now){
  const v = ta.value, c = counts.get(ta);
  if (c && c.v === v) return c.n;
  if (!now) { idleQ.add(ta); if (!idleH) idleH = later(drainCounts); return c ? c.n : 0; }
  const n = /\S/.test(v) ? check(v, keepOf(ta, v)).length : 0;
  counts.set(ta, {v, n});
  return n;
}
function drainCounts(dl){
  idleH = 0; let did = 0;
  for (const ta of Array.from(idleQ)) {
    idleQ.delete(ta);
    if (ta.isConnected) { countFor(ta, true); did++; }
    if (dl && typeof dl.timeRemaining === 'function' && dl.timeRemaining() < 4 && idleQ.size) break;
  }
  if (idleQ.size) idleH = later(drainCounts);
  if (did) schedule();
}
function clipsOf(ta){
  const out = [];
  for (let n = ta.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') out.push(n);
  }
  return out;
}
function makeBtn(ta){
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'iw'; el.tabIndex = -1; el.title = 'Improve wording (' + KEYNAME + ' in the text box)';
  el.innerHTML = '<span class="pl">' + ICON + '<span class="lb">Improve wording</span><span class="bd" hidden></span></span>';
  const b = {el, ta, pl:el.firstChild, bd:el.querySelector('.bd'), label:fieldLabel(ta), n:-1, w:0, at:'br', clips:clipsOf(ta), tv:treeV, away:false};
  el.addEventListener('mousedown', e => e.preventDefault());   /* the field keeps its focus and its selection */
  el.addEventListener('pointerdown', () => { pinned = ta; if (document.activeElement === ta) { remember(ta); blur = {ta, t:Date.now()}; } });
  el.addEventListener('click', () => { openPanel(ta); });
  el.addEventListener('focus', () => { pinned = ta; });
  el.addEventListener('blur', () => { setTimeout(() => { if (pinned === ta && root.activeElement !== el) { pinned = null; schedule(); } }, 0); });
  el.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); e.stopPropagation();
      if (e.shiftKey) { pinned = null; ta.focus(); return; }
      const nx = nextFocusable(ta); pinned = null;
      if (nx) nx.focus(); else el.blur();
    } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); pinned = null; ta.focus(); }
  });
  lay.appendChild(el);
  if (RO) RO.observe(ta);
  return b;
}
/* the control after the field, for Tab from the button (it has the focus after the panel closes from a tap) */
function nextFocusable(ta){
  const all = document.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[contenteditable="true"],summary');
  let after = false;
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (el === ta) { after = true; continue; }
    if (!after || el.disabled || el.tabIndex < 0 || el.type === 'hidden' || !el.getClientRects().length) continue;
    if (el.closest('[inert],[hidden]') || getComputedStyle(el).visibility === 'hidden') continue;
    return el;
  }
  return null;
}
/* The button with its label only while its field has the focus and nothing written yet, where it covers nothing;
   with words in the field it is the small round one, so it covers no more than the end of a line (and that
   see-through). "keep" (while typing): the count on the badge waits until typing stops. */
function paint(b, isAct, r, keep){
  const n = keep && b.n >= 0 ? b.n : countFor(b.ta, isAct), empty = !/\S/.test(b.ta.value);
  const wide = isAct && document.activeElement === b.ta && r.width >= 300 && empty, sm = !isAct || r.height < 40 || !empty;
  if (b.n === n && b.wide === wide && b.sm === sm && b.act === isAct) return;
  b.n = n; b.wide = wide; b.sm = sm; b.act = isAct; b.w = 0; b.endKey = '';
  b.el.classList.toggle('wide', wide); b.el.classList.toggle('sm', sm); b.el.classList.toggle('quiet', !isAct);
  b.bd.hidden = !n; b.bd.textContent = n ? String(n) : '';
  b.el.setAttribute('aria-label', 'Improve wording: ' + b.label + (n ? ', ' + plural(n, 'phrase', 'phrases') + ' to look at' : '') + '. ' + KEYNAME + ' in the field opens it too.');
}
const MPROPS = ['boxSizing','width','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderStyle','paddingTop','paddingRight',
  'paddingBottom','paddingLeft','fontStyle','fontVariant','fontWeight','fontStretch','fontSize','fontFamily','lineHeight','letterSpacing','wordSpacing',
  'textTransform','textIndent','textAlign','tabSize','direction','wordBreak'];
/* where the caret (or the end of the text) is in the field, in screen pixels: a copy of the field's text laid out the same way */
function caretRect(ta, r, at){
  const pos = typeof at === 'number' ? at : ta.selectionEnd; if (typeof pos !== 'number') return null;
  const cs = getComputedStyle(ta), s = mir.style;
  MPROPS.forEach(p => { s[p] = cs[p]; });
  s.whiteSpace = 'pre-wrap'; s.overflowWrap = 'break-word'; s.wordWrap = 'break-word'; s.height = 'auto';
  const sb = ta.offsetWidth - ta.clientWidth - (parseFloat(cs.borderLeftWidth) || 0) - (parseFloat(cs.borderRightWidth) || 0);
  if (sb > 0) s.width = (parseFloat(cs.width) - sb) + 'px';
  mir.textContent = ta.value.slice(0, pos);
  const sp = document.createElement('span'); sp.textContent = ta.value.slice(pos) || '.'; mir.appendChild(sp);
  const z = r.width / (ta.offsetWidth || r.width), lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 13) * 1.35;
  const top = r.top + (sp.offsetTop + (parseFloat(cs.borderTopWidth) || 0) - ta.scrollTop) * z;
  const left = r.left + (sp.offsetLeft + (parseFloat(cs.borderLeftWidth) || 0) - ta.scrollLeft) * z;
  mir.textContent = '';
  return {left:left - 3, right:left + 4 * z + 3, top:top - 2, bottom:top + lh * z + 2};
}
function hits(c, s){ return !(c.right < s.x || c.left > s.x + s.w || c.bottom < s.y || c.top > s.y + s.h); }
/* whether words lie under the button at that corner: on the last row, where the text ends there or runs on below;
   on the first row, where the text goes on past its first line or reaches the corner */
function overText(b, r, s, endC){
  const ta = b.ta, key = ta.value + '|' + Math.round(r.width) + '|' + Math.round(r.height) + '|' + s.at + '|' + ta.scrollTop;
  if (b.endKey === key) return b.endOver;
  const c = endC || caretRect(ta, r, ta.value.length);
  let over = false;
  if (c) {
    const tail = {left:c.left - 4, right:c.right, top:c.top, bottom:c.bottom};
    if (s.at === 'br') over = hits(tail, s) || ta.scrollHeight - ta.scrollTop > ta.clientHeight + 4;
    else over = hits(tail, s) || c.top > s.y + s.h || ta.scrollTop > 2;
  }
  b.endKey = key; b.endOver = over;
  return over;
}
/* the field's first and last rows of text, in screen pixels: the button sits on one of them, so it covers at most
   the end of one line, and nothing when that row is empty */
function rows(b, r){
  /* kept as distances from the field's edges, which scrolling does not change */
  const key = Math.round(r.width) + 'x' + Math.round(r.height) + ':' + treeV;
  if (b.rk !== key) {
    const ta = b.ta, cs = getComputedStyle(ta), z = r.width / (ta.offsetWidth || r.width), px = v => (parseFloat(v) || 0) * z;
    const lh = px(cs.lineHeight) || px(cs.fontSize) * 1.35;
    b.rk = key; b.ro = {top: px(cs.borderTopWidth) + px(cs.paddingTop) + lh / 2, bottom: px(cs.borderBottomWidth) + px(cs.paddingBottom) + lh / 2};
  }
  return {first: r.top + b.ro.top, last: r.bottom - b.ro.bottom};
}
/* the part of the window that is on the screen (above an iPad's keyboard), in the field's coordinates */
function screenBand(){
  const vv = window.visualViewport;
  return vv && vv.height > 0 ? {top: vv.offsetTop, bottom: vv.offsetTop + vv.height} : {top: 0, bottom: window.innerHeight};
}
/* At the field's bottom right corner, on its last row; while the caret is under it, at the top right, on the first
   row; when the caret is under both (a one-line field), just outside the field until the caret moves on. With words selected
   (nothing is being typed) it stays, at the corner away from the end of the selection. Over words it is
   see-through. "fast" (while typing): only the caret is measured; the rest waits until typing stops. */
function place(b, r, o, vw, typing, fast){
  if (!b.w) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.pw = b.pl.offsetWidth; b.ph = b.pl.offsetHeight; }
  if (!b.w) return;   /* not drawn (printing): measured as nothing, it would be put in the wrong place */
  const IN = 5, x = r.right - IN - b.pw, rv = rows(b, r), sb = screenBand();
  let yb = Math.max(r.top + 2, Math.min(rv.last - b.ph / 2, r.bottom - 2 - b.ph)), yt = Math.min(Math.max(rv.first - b.ph / 2, r.top + 2), yb);
  /* A field taller than the part of the screen it is on keeps its button on the screen: at the bottom of the part
     shown (the top corner: at its top), over the field's words, so see-through. */
  const clampB = yb + b.ph > sb.bottom - 4 && sb.bottom - 4 - b.ph > r.top + 2;
  if (clampB) yb = sb.bottom - 4 - b.ph;
  const clampT = yt < sb.top + 4 && sb.top + 4 < r.bottom - 2 - b.ph;
  if (clampT) yt = Math.min(sb.top + 4, yb);
  b.tall = r.height + 60 > sb.bottom - sb.top;
  const br = {x, y:yb, w:b.pw, h:b.ph, at:'br'}, tr = {x, y:yt, w:b.pw, h:b.ph, at:'tr'};
  let pick = br, over = !!b.over;
  if (typing) {
    const c = caretRect(b.ta, r);
    if (c) {
      /* the bottom corner whenever the caret leaves it room; the top one only while the caret is under the bottom one */
      pick = null; const order = [br, tr];
      for (let i = 0; i < 2; i++) if (!hits(c, order[i])) { pick = order[i]; break; }
      if (!pick && b.ta.selectionStart !== b.ta.selectionEnd) pick = Math.abs((c.top + c.bottom) / 2 - rv.last) <= Math.abs((c.top + c.bottom) / 2 - rv.first) ? tr : br;
      if (pick && !fast) over = (pick === br && clampB) || (pick === tr && clampT) || overText(b, r, pick, b.ta.selectionEnd === b.ta.value.length ? c : null);
    }
  } else over = clampB || overText(b, r, br, null);
  /* (v21.43) the caret under both corners (a short box full of text, the caret at its end): rather than vanish until the
     box is left (an iPad keyboard has no Alt+Enter to fall back on), the button waits just outside the box, under its
     bottom right corner (over its top one when that is off the screen), see-through */
  if (typing && !pick) {
    const below = r.bottom + 2, above = r.top - 2 - b.ph;
    const y = below + b.ph <= sb.bottom - 4 ? below : above >= sb.top + 4 ? above : null;
    if (y != null) { pick = {x, y, w:b.pw, h:b.ph, at: y === below ? 'ob' : 'ot'}; over = true; }
  }

  if (over !== !!b.over) { b.over = over; b.el.classList.toggle('over', over); }
  const away = !pick;
  if (away !== b.away) { b.away = away; b.el.classList.toggle('away', away); if (away) b.el.setAttribute('aria-hidden', 'true'); else b.el.removeAttribute('aria-hidden'); }
  if (!pick) return;
  if (b.el.getAttribute('data-at') !== pick.at) b.el.setAttribute('data-at', pick.at);
  b.at = pick.at;
  let left = pick.x - (b.w - b.pw) / 2;
  const top = pick.y - (b.h - b.ph) / 2;
  left = Math.max(0, Math.min(left, vw - b.w - 1));
  const tf = 'translate(' + Math.round(left - o.left) + 'px,' + Math.round(top - o.top) + 'px)';
  if (b.el.style.transform !== tf) b.el.style.transform = tf;
}
function inView(b, r){
  for (let i = 0; i < b.clips.length; i++) {
    const c = vrect(b.clips[i]);
    if (r.bottom - 8 > c.bottom || r.right - 8 > c.right || r.bottom < c.top + 30 || r.right < c.left + 30) return false;
  }
  return true;
}
function schedule(){ if (sched) return; sched = requestAnimationFrame(() => { sched = 0; fastQ = 0; try { layout(); } catch (e) { lastErr = 'layout: ' + (e && e.message); } }); }
/* While typing: only the button of the field being typed in moves out of the caret's way, at once; the rest (every
   other button, the badge's count, whether a button lies over words) waits until typing stops for a moment. */
let fastQ = 0, fullT = 0;
function scheduleFast(){
  clearTimeout(fullT); fullT = setTimeout(schedule, 180);
  if (fastQ || sched) return;
  fastQ = requestAnimationFrame(() => { fastQ = 0; try { layout(true); } catch (e) { lastErr = 'layout: ' + (e && e.message); } });
}
function soon(){ clearTimeout(moT); moT = setTimeout(() => { treeV++; schedule(); }, 60); }
/* Never while printing, or while the overlay is hidden for it: its buttons measure as nothing then, and placed by
   that they would hang past the right edge just as the page comes back to the screen, where the form's screen fit
   reads that as a page too wide for the window and shrinks the sheet. */
const PRINT = window.matchMedia ? window.matchMedia('print') : null;
function layout(fast){
  if (!lay || host.style.display === 'none' || (PRINT && PRINT.matches)) return;
  if (panelOpen) { if (!lay.hidden) lay.hidden = true; return; }
  if (lay.hidden) lay.hidden = false;
  const act = activeTa(), o = lay.getBoundingClientRect(), vw = document.documentElement.clientWidth, keep = new Set();
  if (fast) {
    const b = act && B.get(act);
    if (b && b.el.isConnected && document.activeElement === act) {
      const r = vrect(act);
      if (r.width >= 48 && r.height >= 18) { paint(b, true, r, true); place(b, r, o, vw, true, true); return; }
    }
  }
  const list = document.getElementsByTagName('textarea');
  for (let i = 0; i < list.length; i++) {
    const ta = list[i], isAct = ta === act;
    if (!isAct && !/\S/.test(ta.value)) continue;
    if (!eligible(ta) || !shown(ta)) continue;
    const r = vrect(ta);
    if (r.width < 48 || r.height < 18) continue;
    let b = B.get(ta);
    if (b && b.tv !== treeV) { b.clips = clipsOf(ta); b.tv = treeV; }
    if (b ? !inView(b, r) : !inView({clips:clipsOf(ta)}, r)) continue;
    if (!b) { b = makeBtn(ta); B.set(ta, b); }
    keep.add(ta);
    paint(b, isAct, r);
    place(b, r, o, vw, isAct && document.activeElement === ta);
  }
  B.forEach((b, ta) => { if (!keep.has(ta)) { b.el.remove(); B.delete(ta); if (RO) RO.unobserve(ta); } });
  TALL = false; B.forEach(b => { if (b.tall) TALL = true; });
}
function remember(ta){ if (ta && ta.tagName === 'TEXTAREA' && typeof ta.selectionStart === 'number') sels.set(ta, {s:ta.selectionStart, e:ta.selectionEnd, v:ta.value}); }
function wire(){
  document.addEventListener('focusin', e => { if (e.target && e.target.tagName === 'TEXTAREA') schedule(); }, true);
  document.addEventListener('focusout', e => { if (e.target && e.target.tagName === 'TEXTAREA') { remember(e.target); blur = {ta:e.target, t:Date.now()}; schedule(); } }, true);
  document.addEventListener('input', e => { if (e.target && e.target.tagName === 'TEXTAREA') { if (B.has(e.target)) scheduleFast(); else schedule(); } }, true);
  document.addEventListener('selectionchange', () => { const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') { remember(a); if (B.has(a)) scheduleFast(); } });
  document.addEventListener('scroll', e => { if (e.target !== document || TALL) schedule(); }, {capture:true, passive:true});
  /* Tab and Shift+Tab go from field to field as the form has them (the button is not a stop on the way); from the
     keyboard the panel opens with Alt+Enter (Option+Return on a Mac or an iPad) in the field */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing || e.defaultPrevented || panelOpen) return;
    const ta = e.target; if (!ta || ta.tagName !== 'TEXTAREA' || !eligible(ta)) return;
    e.preventDefault(); e.stopPropagation();
    remember(ta); openPanel(ta, 'key');
  }, true);
  window.addEventListener('resize', () => { soon(); fitPanel(); if (panelOpen) fitEd(); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => { schedule(); fitPanel(); });
    window.visualViewport.addEventListener('scroll', () => { if (TALL) schedule(); });
  }
  window.addEventListener('load', soon);
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon); } catch (e) {}
  try {
    const mo = new MutationObserver(soon);
    mo.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','hidden','open','disabled','readonly']});
    mo.observe(document.documentElement, {attributes:true, attributeFilter:['class','style']});
  } catch (e) {}
  try { RO = typeof ResizeObserver === 'function' ? new ResizeObserver(() => schedule()) : null; } catch (e) { RO = null; }
  setInterval(() => { if (B.size && !panelOpen) schedule(); }, 2000);
  window.addEventListener('beforeprint', () => { if (host) host.style.display = 'none'; });
  window.addEventListener('afterprint', () => { if (host) host.style.display = 'block'; schedule(); });
  try { if (PRINT) { const f = () => { if (!PRINT.matches) schedule(); }; if (PRINT.addEventListener) PRINT.addEventListener('change', f); else if (PRINT.addListener) PRINT.addListener(f); } } catch (e) {}
}

/* ------------------------------------------------------------------ the panel */
let dlg = null, P = null, S = null;
const drafts = new Map();
const RW = {state:'ready', style:null, prep:null, ans:null, base:'', msg:null, busy:null, hide:[], ac:null, ended:0};
const PANEL = `<div class="in">
<header class="ph"><div><h2 id="pnT" tabindex="-1">Improve wording</h2><p class="ps" id="pnS"></p></div>
<button type="button" class="px" id="pnX" aria-label="Close without changing the field">\u00D7</button></header>
<div class="pb"><div class="cols">
<section class="ce" aria-labelledby="edL">
<div class="et"><label id="edL" for="ed">Your text</label><span class="n" id="edN"></span></div>
<p class="sel" id="edSel" hidden>Only the part you selected. The rest of the field stays as it is.</p>
<div class="box" id="edDraft" hidden><span>The edits you left here earlier are kept.</span><div class="ba"><button type="button" class="b" id="drB">Bring them back</button><button type="button" class="b" id="drX">Discard them</button></div></div>
<textarea class="ed" id="ed" spellcheck="true" autocapitalize="sentences" aria-describedby="edH"></textarea>
<div class="ea"><button type="button" class="lk" id="undo" disabled>Undo the last change</button><span id="edH">Edit freely; nothing reaches the form until you press Use this text.</span></div>
</section>
<section class="ct">
<div class="tabs" role="tablist" aria-label="Ways to improve the wording">
<button type="button" role="tab" class="tab" id="tb1" aria-controls="tp1" aria-selected="true" aria-label="Check wording"><span class="l">Check wording</span><span class="s">Check</span><span class="cnt" id="cnt" hidden></span></button>
<button type="button" role="tab" class="tab" id="tb2" aria-controls="tp2" aria-selected="false" tabindex="-1" aria-label="Rewrite with Claude"><span class="l">Rewrite with Claude</span><span class="s">Rewrite</span></button>
<button type="button" role="tab" class="tab" id="tb3" aria-controls="tp3" aria-selected="false" tabindex="-1" aria-label="iPad Writing Tools"><span class="l">iPad Writing Tools</span><span class="s">Writing Tools</span></button>
</div>
<div class="tp" role="tabpanel" id="tp1" aria-labelledby="tb1" tabindex="0">
<p class="sum" id="ckSum" role="status" aria-live="polite"></p>
<ol class="fds" id="fds"></ol>
<p class="note" id="ckNote"></p>
</div>
<div class="tp" role="tabpanel" id="tp2" aria-labelledby="tb2" tabindex="0" hidden></div>
<div class="tp wt" role="tabpanel" id="tp3" aria-labelledby="tb3" tabindex="0" hidden>
<p>On an iPad with Apple Intelligence, select the words in any text box of the forms (or in Your text here), then tap Writing Tools in the menu over the selection, or on the keyboard, and choose Proofread, Rewrite, Professional or Concise.</p>
<p>It needs nothing set up here and does not appear on iPads without Apple Intelligence. It does not know the rules for observable wording, so check the result with Check wording before you keep it.</p>
<p>Writing Tools is Apple\u2019s own: it works on the text as written, names included (nothing is hidden first, as Rewrite with Claude does), on the iPad or on Apple\u2019s servers. Follow your agency\u2019s rules for it, and do not use its ChatGPT options for student text.</p>
</div>
</section>
</div></div>
<footer class="pf"><p class="fm" id="fm" role="status" aria-live="polite"></p>
<div class="fb"><button type="button" class="b" id="cancel">Cancel</button><button type="button" class="b pri" id="use">Use this text</button></div></footer>
</div>`;
function buildPanel(){
  if (dlg) return;
  dlg = document.createElement('dialog');
  dlg.className = 'pn'; dlg.setAttribute('aria-labelledby', 'pnT'); dlg.setAttribute('aria-describedby', 'pnS');
  dlg.innerHTML = PANEL;
  root.appendChild(dlg);
  const q = id => root.getElementById(id);
  P = {t:q('pnT'), s:q('pnS'), ed:q('ed'), n:q('edN'), sel:q('edSel'), dr:q('edDraft'), undo:q('undo'), cnt:q('cnt'), sum:q('ckSum'), fds:q('fds'),
       note:q('ckNote'), tabs:[q('tb1'), q('tb2'), q('tb3')], tps:[q('tp1'), q('tp2'), q('tp3')], fm:q('fm'), use:q('use')};
  q('pnX').addEventListener('click', () => closePanel('cancel'));
  q('cancel').addEventListener('click', () => closePanel('cancel'));
  P.use.addEventListener('click', () => {
    /* a suggestion still waiting under Rewrite with Claude is not thrown away without a word */
    if (S && RW.state === 'answer' && RW.ans && !S.ownOk) {
      S.ownOk = true;
      say('A suggestion from Rewrite with Claude has not been used. Press Use this text again to keep your own text, or open Rewrite with Claude to use the suggestion.', true);
      return;
    }
    useText(P.ed.value, 'Use this text');
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); closePanel('cancel'); });
  dlg.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.showModal) { e.preventDefault(); closePanel('cancel'); } });
  P.undo.addEventListener('click', undo);
  q('drB').addEventListener('click', () => { const d = S && drafts.get(S.dkey); if (d) { push('the edits you left'); P.ed.value = d.text; changed(); } P.dr.hidden = true; });
  q('drX').addEventListener('click', () => { if (S) drafts.delete(S.dkey); P.dr.hidden = true; });
  let t = 0;
  P.ed.addEventListener('input', () => { clearTimeout(t); t = setTimeout(changed, 200); count(); });
  P.tabs.forEach((b, i) => {
    b.addEventListener('click', () => setTab(i));
    b.addEventListener('keydown', e => {
      const k = e.key; let j = -1;
      if (k === 'ArrowRight') j = (i + 1) % 3; else if (k === 'ArrowLeft') j = (i + 2) % 3; else if (k === 'Home') j = 0; else if (k === 'End') j = 2;
      if (j >= 0) { e.preventDefault(); setTab(j); P.tabs[j].focus(); }
    });
  });
}
function setTab(i){
  P.tabs.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; P.tps[j].hidden = i !== j; });
  if (i === 1) renderRW();
  syncUse();
}
/* While a suggestion is on screen it has its own Use this; the footer's Use this text (your own text) steps aside so
   that only one button there says Use */
function syncUse(){
  if (!P) return;
  const hide = RW.state === 'answer' && !!RW.ans && !P.tps[1].hidden;
  if (P.use.hidden !== hide) P.use.hidden = hide;
}
function count(){ const n = P.ed.value.length; P.n.textContent = n ? plural(n, 'character', 'characters') : ''; fitEd(); }
/* one column (an upright iPad, a phone): the text box is as tall as its text, from five lines to 40% of the screen;
   two columns: it fills its column */
function fitEd(){
  const e = P.ed;
  if (window.matchMedia && window.matchMedia('(min-width:960px)').matches) { if (e.style.height) e.style.height = ''; return; }
  e.style.height = 'auto';
  e.style.height = Math.round(Math.min(Math.max(e.scrollHeight + 2, 120), Math.max(160, window.innerHeight * 0.4))) + 'px';
}
function changed(){ if (!S) return; count(); renderCheck(); if (RW.state === 'preview' && !P.tps[1].hidden) renderRW(); else if (RW.state === 'preview') RW.prep = null; footer(); }
function push(label){ S.undo.push({text:P.ed.value, label}); if (S.undo.length > 40) S.undo.shift(); P.undo.disabled = false; }
function undo(){
  const u = S && S.undo.pop(); if (!u) return;
  P.ed.value = u.text; P.undo.disabled = !S.undo.length; changed();
  say('Undone: ' + u.label + '.');
}
/* the live regions change only when what they say changes, so a screen reader is not told the same thing at every keystroke */
function say(text, warn){ text = text || ''; if (P.fm.textContent !== text) P.fm.textContent = text; P.fm.classList.toggle('warn', !!warn); }
function footer(){
  if (!S) return;
  if (S.conflict || S.blanks === P.ed.value) return;
  const ch = P.ed.value !== S.original;
  say(ch ? 'Changed here; the field changes when you press Use this text.' : '');
}
function openPanel(ta, how){
  if (!eligible(ta) || !build()) return false;
  buildPanel();
  if (panelOpen) return false;
  const v = ta.value;
  let s = null, e = null;
  /* the part selected: in the field still focused (a mouse), or in the field that lost its focus to the tap on its
     button a moment ago (a touch screen); not a selection left in it long before */
  if (document.activeElement === ta) { s = ta.selectionStart; e = ta.selectionEnd; }
  else if (blur.ta === ta && Date.now() - blur.t < 1500) { const m = sels.get(ta); if (m && m.v === v) { s = m.s; e = m.e; } }
  const range = typeof s === 'number' && typeof e === 'number' && e > s && /\S/.test(v.slice(s, e)) ? [s, e] : null;
  const key = fieldKey(ta);
  S = {ta, key, dkey: (key || '') + '|' + (range ? range.join('-') : 'all'), value:v, range, original: range ? v.slice(range[0], range[1]) : v,
       undo:[], ignored:{}, conflict:false, how: how === 'key' ? 'key' : 'tap'};
  const place = fieldPlace(ta), label = fieldLabel(ta);
  P.s.textContent = [place, label].filter(Boolean).join(' \u00B7 ') + (range ? ' \u00B7 the part you selected' : '');
  P.sel.hidden = !range;
  P.ed.value = S.original; P.undo.disabled = true;
  const d = drafts.get(S.dkey);
  P.dr.hidden = !(d && d.value === v && d.text !== S.original);
  if (d && d.value !== v) drafts.delete(S.dkey);
  if (RW.state !== 'ready') { RW.state = 'ready'; RW.prep = null; RW.ans = null; }
  RW.msg = null;
  count(); say(''); setTab(0); renderCheck();
  panelOpen = true; schedule();
  try { if (typeof dlg.showModal === 'function') dlg.showModal(); else throw 0; }
  catch (x) { dlg.setAttribute('open', ''); dlg.classList.add('fb'); if (!root.querySelector('.fbk')) root.insertBefore(h('div', {class:'fbk'}), dlg); }
  fitPanel(); fitEd();
  try { P.t.focus({preventScroll:true}); } catch (x) { P.t.focus(); }
  return true;
}
function closePanel(how){
  if (!S) return;
  if (RW.ac) { try { RW.ac.abort(); } catch (e) {} }
  if (how === 'cancel' && P.ed.value !== S.original) drafts.set(S.dkey, {value:S.value, text:P.ed.value});
  else if (how === 'used') drafts.delete(S.dkey);
  try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); }
  dlg.classList.remove('fb'); const fbk = root.querySelector('.fbk'); if (fbk) fbk.remove();
  const back = S.ta, key = S.key, via = S.how;
  S = null; panelOpen = false; pinned = null;
  if (RW.state === 'sending') RW.state = 'preview';
  layout();
  /* back where it was opened from: the field, from the keyboard; the field's button, from a tap, which keeps an
     iPad's keyboard down (the button then shows small, and see-through over words) */
  const ta = back.isConnected ? back : twin(key);
  const b = ta && B.get(ta);
  try { if (via !== 'key' && b && !b.away) b.el.focus({preventScroll:true}); else if (ta) ta.focus({preventScroll:true}); } catch (e) {}
}
/* on an iPad with the keyboard up, the panel fits the part of the screen left above it */
function fitPanel(){
  if (!dlg || !panelOpen) return;
  const vv = window.visualViewport, s = dlg.style;
  if (vv && vv.height < window.innerHeight - 80) { s.top = Math.round(vv.offsetTop + 4) + 'px'; s.bottom = 'auto'; s.height = Math.max(260, Math.round(vv.height - 8)) + 'px'; s.marginTop = '0'; }
  else { s.top = ''; s.bottom = ''; s.height = ''; s.marginTop = ''; }
}
function fire(el, type){
  let ev = null;
  try { ev = type === 'input' && typeof InputEvent === 'function' ? new InputEvent('input', {bubbles:true, inputType:'insertReplacementText'}) : new Event(type, {bubbles:true}); }
  catch (e) { ev = document.createEvent('Event'); ev.initEvent(type, true, false); }
  el.dispatchEvent(ev);
}
/* the panel's text into the field, or over the part that was selected; "btn" names the button pressed */
function useText(text, btn){
  if (!S) return false;
  btn = btn || 'Use this text';
  /* a blank left to fill in ("[number] times", "[describe what you saw]") is named once before it reaches the record */
  const blanks = uniqBy(str(text).match(BLANK) || [], x => x).filter(x => !OURS.test(x));
  if (blanks.length && S.blanks !== text) {
    S.blanks = text;
    say('Still to fill in: ' + blanks.slice(0, 4).join(', ') + (blanks.length > 4 ? ' \u2026' : '') + '. Fill them in, or press ' + btn + ' again to use the text as it is.', true);
    return false;
  }
  let ta = S.ta;
  if (!ta.isConnected || !eligible(ta)) ta = twin(S.key);
  if (!ta) { S.conflict = true; say('That field is no longer on the page, so nothing was changed. Copy your text from here before you close.', true); return false; }
  const cur = ta.value;
  let next = null;
  if (S.range) {
    const a = S.range[0], b = S.range[1];
    if (cur === S.value) next = cur.slice(0, a) + text + cur.slice(b);
    else { const i = cur.indexOf(S.original); if (i >= 0 && cur.indexOf(S.original, i + 1) < 0) next = cur.slice(0, i) + text + cur.slice(i + S.original.length); }
    if (next === null) { S.conflict = true; say('The field changed while this was open and the part you selected is not in it any more, so nothing was changed. Copy your text from here before you close.', true); return false; }
  } else {
    if (cur !== S.value && !S.conflict) { S.conflict = true; say('The field changed while this was open. Press ' + btn + ' again to replace what it holds now.', true); return false; }
    next = text;
  }
  if (next === cur) { closePanel('used'); return true; }
  ta.value = next;
  fire(ta, 'input'); fire(ta, 'change');
  closePanel('used');
  toast('The field now holds the new wording.', {label:'Undo', fn: () => {
    if (!ta.isConnected || ta.value !== next) { toast('The field has changed since, so it was left as it is.'); return; }
    ta.value = cur; fire(ta, 'input'); fire(ta, 'change'); toast('The field is back as it was.');
  }});
  return true;
}
function toast(text, action){
  if (!root) return;
  if (!tst) { tst = h('div', {class:'tst', role:'status', 'aria-live':'polite'}); root.appendChild(tst); }
  tst.textContent = '';
  tst.appendChild(h('span', null, text));
  if (action) tst.appendChild(h('button', {type:'button', onclick: () => { tst.hidden = true; action.fn(); }}, action.label));
  tst.appendChild(h('button', {type:'button', class:'x', 'aria-label':'Dismiss', onclick: () => { tst.hidden = true; }}, '\u00D7'));
  tst.hidden = false;
  clearTimeout(tst._t); tst._t = setTimeout(() => { tst.hidden = true; }, 10000);
}

/* ---- 1. Check wording */
function context(t, f){
  let a = Math.max(0, f.start - 54), z = Math.min(t.length, f.end + 54);
  if (a > 0) { const sp = t.indexOf(' ', a); if (sp >= 0 && sp < f.start) a = sp + 1; }
  if (z < t.length) { const sp = t.lastIndexOf(' ', z); if (sp > f.end) z = sp; }
  return [(a > 0 ? '\u2026' : '') + t.slice(a, f.start).replace(/\s+/g, ' '), t.slice(f.start, f.end), t.slice(f.end, z).replace(/\s+/g, ' ') + (z < t.length ? '\u2026' : '')];
}
function renderCheck(){
  const t = P.ed.value, kp = keepOf(S && S.ta, t), all = check(t, kp), list = all.filter(f => !S.ignored[f.id + '|' + f.text.toLowerCase()]);
  const n = list.length, hidden = all.length - n;
  P.cnt.hidden = !n; P.cnt.textContent = n ? String(n) : '';
  P.tabs[0].setAttribute('aria-label', 'Check wording' + (n ? ', ' + plural(n, 'phrase', 'phrases') + ' to look at' : ''));
  const sum = h('p', null);
  if (!/\S/.test(t)) sum.textContent = 'Nothing written yet. Type here or in the field, then check the wording.';
  else if (!rules().rules.length) sum.textContent = 'The wording rules are missing from this copy of the form, so only blanks left to fill in are checked.';
  else if (n) { sum.appendChild(h('b', null, plural(n, 'phrase', 'phrases') + ' to look at.')); sum.appendChild(document.createTextNode(' Each says why, and what to write instead.')); }
  else sum.textContent = 'Nothing to look at: no feelings, guesses at intent, labels or vague amounts were found.' + (hidden ? ' (' + plural(hidden, 'phrase', 'phrases') + ' ignored.)' : '');
  if (P.sum.textContent !== sum.textContent) { P.sum.textContent = ''; while (sum.firstChild) P.sum.appendChild(sum.firstChild); }
  /* one card per rule: where it applies (the first three places), why once, and one button for all of them */
  const groups = [], byId = {};
  list.forEach(f => { let g = byId[f.id]; if (!g) { g = byId[f.id] = {id:f.id, cat:f.cat, why:f.why, suggest:f.suggest, items:[]}; groups.push(g); } g.items.push(f); });
  P.fds.textContent = '';
  groups.forEach((g, i) => {
    const k = g.items.length, f = g.items[0], acts = [];
    if (g.items.every(x => x.replacement !== null)) {
      const reps = uniqBy(g.items.map(x => ({r:x.replacement})), x => 'r' + x.r);
      const label = k === 1 ? (f.replacement ? 'Replace with \u201C' + clean(f.replacement, 44) + '\u201D' : 'Take out \u201C' + clean(f.text, 30) + '\u201D')
        : reps.length === 1 && !reps[0].r ? 'Take out all ' + k : reps.length === 1 ? 'Replace all ' + k + ' with \u201C' + clean(reps[0].r, 36) + '\u201D' : 'Change all ' + k;
      acts.push(h('button', {type:'button', class:'b', onclick: () => applyG(g, i)}, label));
    }
    acts.push(h('button', {type:'button', class:'b', onclick: () => ignoreG(g, i), 'aria-label': k === 1 ? 'Ignore \u201C' + f.text + '\u201D' : 'Ignore all ' + k + ' like \u201C' + f.text + '\u201D'}, k === 1 ? 'Ignore' : 'Ignore all'));
    acts.push(h('button', {type:'button', class:'lk', onclick: () => findF(f), 'aria-label':'Find \u201C' + f.text + '\u201D in your text'}, k === 1 ? 'Find in text' : 'Find the first'));
    const places = g.items.slice(0, 3).map(x => { const c = context(t, x); return h('p', {class:'cx'}, [c[0], h('mark', null, c[1]), c[2]]); });
    if (k > 3) places.push(h('p', {class:'more'}, 'and ' + (k - 3) + ' more like ' + (k - 3 === 1 ? 'it' : 'them')));
    P.fds.appendChild(h('li', {class:'fd'}, [h('p', {class:'cat'}, catLabel(g.cat) + (k > 1 ? ' \u00B7 ' + k + ' times' : ''))].concat(places, [
      g.why ? h('p', {class:'why'}, g.why) : null,
      g.suggest ? h('p', {class:'sg'}, [h('b', null, 'Instead: '), g.suggest]) : null,
      h('div', {class:'ac'}, acts)
    ])));
  });
  P.note.textContent = 'This check runs on this device and sends nothing. It looks for words that name a feeling, guess at intent or function, label the behavior, or leave a count, a time or an intensity vague; words in quotation marks are the learner\u2019s own and are left alone. Keep a word that is part of the operational definition: press Ignore.' + (kp && kp.note ? ' ' + clean(kp.note, 300) : '') + (rules().version ? ' Rules ' + rules().version + '.' : '');
}
function refocus(i){ const b = P.fds.children[Math.min(i, P.fds.children.length - 1)]; const t = b && b.querySelector('button'); try { (t || P.sum).focus({preventScroll:false}); } catch (e) {} }
/* every place of one rule at once, from the last to the first so that each one's place in the text still holds */
function applyG(g, i){
  const t = P.ed.value, f = g.items[0], k = g.items.length;
  if (g.items.some(x => t.slice(x.start, x.end) !== x.text)) { renderCheck(); return; }
  push(k === 1 ? '\u201C' + clean(f.text, 30) + '\u201D replaced' : k + ' changes for \u201C' + clean(f.text, 24) + '\u201D');
  let out = t;
  g.items.slice().sort((a, b) => b.start - a.start).forEach(x => { out = applyAt(out, x).text; });
  P.ed.value = out;
  changed();
  say(k > 1 ? 'Changed ' + k + ' places like \u201C' + clean(f.text, 30) + '\u201D.' : f.replacement ? 'Replaced \u201C' + clean(f.text, 30) + '\u201D with \u201C' + clean(f.replacement, 40) + '\u201D.' : 'Took out \u201C' + clean(f.text, 30) + '\u201D.');
  refocus(i);
}
function ignoreG(g, i){ g.items.forEach(f => { S.ignored[f.id + '|' + f.text.toLowerCase()] = 1; }); renderCheck(); refocus(i); }
function findF(f){ try { P.ed.focus({preventScroll:true}); P.ed.setSelectionRange(f.start, f.end); } catch (e) {} }

/* ---- 2. Rewrite with Claude */
function msgBox(m){ return h('div', {class:'box' + (m.kind === 'err' ? ' err' : m.kind === 'ok' ? ' ok' : ''), role: m.kind === 'err' ? 'alert' : 'status'}, m.text); }
function renderRW(){
  const box = P.tps[1]; box.textContent = '';
  const plan = relayPlan();
  if (!plan.ok) {
    box.appendChild(h('div', {class:'box'}, planText(plan)));
    box.appendChild(h('p', {class:'note'}, 'Check wording and the iPad\u2019s Writing Tools work without it.'));
    syncUse();
    return;
  }
  const ses = getSession(plan);
  if (!ses) { renderLocked(box, plan); syncUse(); return; }
  box.appendChild(h('p', {class:'st'}, [h('span', {class:'dot', 'aria-hidden':'true'}), h('b', null, 'Unlocked'),
    ' in this tab' + (ses.exp ? ' until ' + hm(ses.exp) : '') + '.',
    h('button', {type:'button', class:'lk', onclick: () => lock(plan, ses)}, 'Lock')]));
  /* sessionStorage ends with the tab, but a tab this one opens (a form opened in a new tab) or one the browser
     restores can carry it: so the time limit is what bounds it, and Lock ends it at once, on the relay too */
  box.appendChild(h('p', {class:'note'}, 'It ends then, or when this tab is closed, whichever comes first, and is never saved with the form. On a shared iPad, press Lock when you finish: it ends the session on the rewrite service, in every tab.'));
  if (RW.msg) box.appendChild(msgBox(RW.msg));
  if (RW.state === 'preview') renderPreview(box);
  else if (RW.state === 'sending') {
    box.appendChild(h('p', {role:'status'}, [h('span', {class:'spin', 'aria-hidden':'true'}), 'Sending to the rewrite service\u2026 usually a few seconds.']));
    box.appendChild(h('div', {class:'acts'}, h('button', {type:'button', class:'b', onclick: () => { if (RW.ac) RW.ac.abort(); }}, 'Stop')));
  }
  else if (RW.state === 'answer' && RW.ans) renderAnswer(box);
  else renderStyles(box);
  syncUse();
}
/* (v21.43) Lock: this tab forgets the token at once, and the relay is asked to end the session, so a tab that carries the
   token (one this tab opened, or one the browser restored) cannot use it either */
async function endSession(plan, token){
  const ac = typeof AbortController === 'function' ? new AbortController() : null, timer = setTimeout(() => { if (ac) ac.abort(); }, 8000);
  try {
    const res = await fetch(plan.base + '/api/session/end', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token}),
      credentials:'omit', cache:'no-store', redirect:'error', signal: ac ? ac.signal : undefined});
    return res.ok;
  } catch (e) { return false; } finally { clearTimeout(timer); }
}
async function lock(plan, ses){
  clearSession();
  if (RW.state === 'sending' && RW.ac) RW.ac.abort();
  RW.state = 'ready'; RW.ans = null; RW.msg = {kind:'ok', text:'Locked. Ending the session on the rewrite service\u2026'}; renderRW();
  const done = await endSession(plan, ses.token);
  RW.msg = done ? {kind:'ok', text:'Locked: the session is ended on the rewrite service, in every tab. A new passcode is needed to use it again.'}
    : {kind:'err', text:'Locked in this tab. The rewrite service could not be reached to end the session, so a tab that holds it (one this tab opened) can still use it until ' + (ses.exp ? hm(ses.exp) : 'its time is up') + '. Press Lock there too, or ask your BCBA to end it on the rewrite service\u2019s page.'};
  if (!S) return;
  renderRW();
}
function renderLocked(box, plan){
  if (RW.ended) { box.appendChild(msgBox({kind:'err', text:'This tab\u2019s session ended at ' + hm(RW.ended) + '. Enter a new passcode from your BCBA to go on.'})); RW.ended = 0; }
  if (RW.msg) box.appendChild(msgBox(RW.msg));
  else box.appendChild(h('div', {id:'rch'}));   /* whether the rewrite service is there: see reach() */
  const inp = h('input', {id:'pc', class:'tx code', type:'text', inputmode:'text', autocomplete:'one-time-code', autocapitalize:'characters', autocorrect:'off',
    spellcheck:'false', maxlength:'40', placeholder:'XXX-XXX-XXX-XXX', 'aria-describedby':'pcH'});
  /* what was typed stays through a wrong try, so a one-letter slip is fixed without typing all twelve again */
  inp.value = RW.pc || '';
  inp.addEventListener('input', () => { RW.pc = inp.value; });
  const go = h('button', {type:'submit', class:'b pri'}, RW.busy === 'unlock' ? 'Checking\u2026' : 'Unlock');
  if (RW.busy === 'unlock') { go.disabled = true; inp.disabled = true; }
  const f = h('form', {class:'pc', novalidate:true}, [
    h('label', {class:'fl', for:'pc'}, 'Enter the passcode from your BCBA'),
    h('div', {class:'row'}, [inp, go]),
    h('p', {class:'note', id:'pcH'}, 'A passcode works once. It unlocks Rewrite with Claude in this tab until the session\u2019s time is up or the tab is closed, and it is never kept in a field or a saved file. Your BCBA makes passcodes on the rewrite service\u2019s page on ' + plan.host + '.')
  ]);
  f.addEventListener('submit', ev => { ev.preventDefault(); unlock(inp.value); });
  box.appendChild(f);
  if (!RW.msg) { showReach(); reach(plan); }
}
async function unlock(raw){
  const plan = relayPlan(); if (!plan.ok) return;
  RW.pc = str(raw);
  const code = canonCode(raw);
  if (!code) { RW.msg = {kind:'err', text:'Type the passcode first.'}; renderRW(); focusIn('#pc'); return; }
  if (navigator.onLine === false) { RW.msg = {kind:'err', text:errText({offline:true}, 'redeem')}; renderRW(); focusIn('#pc'); return; }
  RW.busy = 'unlock'; RW.msg = null; renderRW();
  const r = await post(plan, '/api/redeem', {code}, 20000);
  RW.busy = null;
  const tok = r.ok && r.body && typeof r.body.token === 'string' ? r.body.token : '';
  if (tok && tok.length >= 16 && tok.length <= 1024 && setSession(plan, tok, expiryOf(r.body.expires))) {
    RW.pc = ''; REACH.state = 'ok'; REACH.text = '';
    /* a session that ended while a text was waiting to be sent goes back to that text */
    const back = RW.state === 'preview' && RW.style;
    if (!back) RW.state = 'ready';
    RW.msg = back ? {kind:'ok', text:'Unlocked again. Check the text below, then press Send.'} : null;
    if (!S) return;
    renderRW(); focusIn(back ? 'h4' : '.sty .b');
  } else {
    if (r.status === 429) RW.pc = '';
    RW.msg = {kind:'err', text: r.ok && r.body && typeof r.body === 'object' ? 'The rewrite service sent an answer this panel could not read. Try again; if it keeps happening, tell your BCBA.' : (errText(r, 'redeem', plan.host) || 'Stopped.')};
    if (!S) return;
    renderRW(); focusIn('#pc');
    const i = P.tps[1].querySelector('#pc'); if (i && i.value) { try { i.select(); } catch (e) {} }
  }
}
function focusIn(sel){ const e = P.tps[1].querySelector(sel); if (e) { try { e.focus({preventScroll:false}); } catch (x) {} } }
function renderStyles(box){
  if (!/\S/.test(P.ed.value)) { box.appendChild(h('p', {class:'note'}, 'Write or paste some text first.')); return; }
  box.appendChild(h('p', null, 'Choose a style. You will see exactly what is sent before anything leaves this device.'));
  box.appendChild(h('div', {class:'sty', role:'group', 'aria-label':'Rewrite styles'}, STYLES.map(s =>
    h('button', {type:'button', class:'b', onclick: () => { RW.style = s.id; RW.state = 'preview'; RW.msg = null; RW.prep = null; renderRW(); focusIn('h4'); }},
      [h('b', null, s.label), h('span', null, s.hint)]))));
}
function styleOf(id){ return STYLES.filter(s => s.id === id)[0] || STYLES[0]; }
function marked(text){
  const out = [], re = /\[(?:Student|ID|Family name|Name \d{1,2}|(?:Email|Phone|Date|Number|Address)(?: \d{1,2})?)\]/g; let a = 0, m;
  while ((m = re.exec(text)) !== null) { if (m.index > a) out.push(text.slice(a, m.index)); out.push(h('span', {class:'phd'}, m[0])); a = m.index + m[0].length; }
  if (a < text.length) out.push(text.slice(a));
  return out;
}
function andList(list){ const q = list.map(x => '\u201c' + x + '\u201d'); return q.length < 2 ? q.join('') : q.slice(0, -1).join(', ') + ' and ' + q[q.length - 1]; }
function renderPreview(box){
  const prep = RW.prep = deidentify(P.ed.value, RW.hide);
  prep.src = P.ed.value;
  const sty = styleOf(RW.style), tooLong = prep.text.length > MAX_SEND, empty = !/\S/.test(prep.text);
  box.appendChild(h('h4', {tabindex:'-1'}, 'Check what will be sent (' + sty.label + ')'));
  box.appendChild(h('p', {class:'note'}, 'Only this text and the style are sent, to the rewrite service on ' + relayPlan().host + ', which asks Claude (Anthropic\u2019s API) for the rewrite. The student\u2019s name and ID, the names under Also hide, and email addresses, telephone numbers, dates, street addresses and long numbers are replaced here first and put back in the answer. Nothing else is: read the text below and hide anything more that could tell someone who this is (a nickname, a short date, a room or a team). De-identified is not anonymous.'));
  box.appendChild(h('pre', {class:'sent', 'aria-label':'The text that will be sent'}, marked(prep.text)));
  const hid = prep.map.filter(m => m.n);
  if (hid.length) box.appendChild(h('p', {class:'hid'}, ['Hidden: '].concat([].concat.apply([], hid.map((m, i) => [i ? '; ' : '', h('b', null, m.ph), ' for ' + m.forms.join(', ')])))));
  const P0 = people();
  if (!P0.names.length && !P0.ids.length && !RW.hide.some(x => x.student)) box.appendChild(msgBox({kind:'err', text:'This form has no student name or ID filled in, so nothing is hidden automatically. Add every name the text uses to Also hide before you send, and mark the student\u2019s with Student.'}));
  const inp = h('input', {id:'also', class:'tx', type:'text', autocomplete:'off', autocorrect:'off', spellcheck:'false', 'aria-describedby':'alsoH'});
  const has = v => RW.hide.some(y => normKey(y.v) === normKey(v));
  const add = (v, extra) => { const list = str(v).split(/[,;\n]/).map(x => clean(x, 80)).filter(x => x.length >= 2);
    list.forEach(x => { if (!has(x)) RW.hide.push(Object.assign({v:x, student:false}, extra || {})); }); renderRW(); focusIn('#also'); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(inp.value); } });
  box.appendChild(h('label', {class:'fl', for:'also'}, 'Also hide'));
  box.appendChild(h('div', {class:'row'}, [inp, h('button', {type:'button', class:'b', onclick: () => add(inp.value)}, 'Add')]));
  box.appendChild(h('p', {class:'note', id:'alsoH'}, 'Other people the text names: classmates, staff, family; and other ways the student is called (a nickname): add it, then press Student on it. Separate names with commas. The list is kept only while this page is open.'));
  if (RW.hide.length) box.appendChild(h('ul', {class:'chips', 'aria-label':'Also hidden'}, RW.hide.map((x, i) => {
    const e = prep.entries[i] || {}, ph = x.student ? '[Student]' : e.ph;
    return h('li', {class:'chip'}, [x.v, h('span', {class:'cp'}, ph && e.n ? ph : 'not in the text'),
      h('button', {type:'button', class:'tg', 'aria-pressed': String(!!x.student), title:'Hide it as the student', 'aria-label': x.student ? x.v + ' is hidden as the student; press to hide it as someone else' : 'Hide ' + x.v + ' as the student',
        onclick: () => { x.student = !x.student; renderRW(); const c = P.tps[1].querySelectorAll('ul.chips .tg')[i]; if (c) { try { c.focus(); } catch (er) {} } }}, 'Student'),
      h('button', {type:'button', class:'x', 'aria-label':'Stop hiding ' + x.v, onclick: () => { RW.hide.splice(i, 1); renderRW(); focusIn('#also'); }}, '\u00d7')]);
  })));
  /* one tap each: what the text still holds that may be a name, the people this form names, and the student's own
     other ways of being written; a word of a name the form offers is offered once, in the form's way */
  const fromForm = formNames().filter(x => !has(x.v));
  const formWords = {}; fromForm.forEach(x => words(x.v).forEach(w => { formWords[normKey(w)] = 1; }));
  const maybe = likelyNames(prep.text).filter(w => !has(w) && !formWords[normKey(w)]);
  const hints = studentHints(prep.text).filter(x => !has(x.v));
  const dates = shortDates(prep.text).filter(v => !has(v));
  /* a name the form or the workstation holds, still written in the text */
  const inText = v => { try { return new RegExp('(^|' + NONW + ')' + pat(clean(v)) + '(?=' + NONW + '|$)', 'i' + UFLAG).test(prep.text); } catch (e) { return false; } };
  const formLeft = fromForm.filter(x => inText(x.v)).map(x => x.v);
  if (fromForm.length || maybe.length || dates.length) {
    const s = h('div', {class:'sugg'}, [h('span', null, maybe.length || dates.length ? 'Still in the text and may identify someone:' : 'Named on this form:')]);
    maybe.forEach(w => s.appendChild(h('button', {type:'button', class:'b', onclick: () => add(w), 'aria-label':'Hide ' + w}, '+ ' + w)));
    dates.forEach(v => s.appendChild(h('button', {type:'button', class:'b', onclick: () => add(v), 'aria-label':'Hide ' + v + ' (a date)'}, '+ ' + v)));
    fromForm.forEach(x => s.appendChild(h('button', {type:'button', class:'b', onclick: () => add(x.v), 'aria-label':'Hide ' + x.v + ' (' + x.why + ')'}, '+ ' + x.v)));
    box.appendChild(s);
  }
  if (hints.length) {
    const s = h('div', {class:'sugg'}, [h('span', null, 'May be the student too:')]);
    hints.forEach(x => s.appendChild(h('button', {type:'button', class:'b', onclick: () => add(x.v, {student:true, exact:!!x.exact}), 'aria-label':'Hide ' + x.v + ' as the student (' + x.why + ')'}, '+ ' + x.v)));
    box.appendChild(s);
  }
  if (tooLong) box.appendChild(msgBox({kind:'err', text:'This is ' + prep.text.length + ' characters; at most ' + MAX_SEND + ' can be sent. Select part of the text in the field, then open Improve wording again.'}));
  const left = uniqBy(maybe.concat(hints.map(x => x.v), dates, formLeft), normKey);
  if (left.length && !tooLong && !empty) box.appendChild(h('p', {class:'note warnl', style:'margin-top:12px'}, 'Not hidden yet: ' + andList(left.slice(0, 6)) + (left.length > 6 ? ' and others' : '') + '. Hide any that names someone before you send.'));
  const send = h('button', {type:'button', class:'b pri', onclick: send_}, 'Send');
  if (tooLong || empty) send.disabled = true;
  box.appendChild(h('div', {class:'acts', style:'margin-top:12px'}, [send, h('button', {type:'button', class:'b', onclick: () => { RW.state = 'ready'; RW.prep = null; RW.msg = null; renderRW(); focusIn('.sty .b'); }}, 'Back to styles')]));
}
async function send_(){
  const plan = relayPlan(), ses = plan.ok ? getSession(plan) : null;
  if (!ses) { renderRW(); return; }
  const prep = RW.prep; if (!prep || prep.text.length > MAX_SEND) return;
  if (navigator.onLine === false) { RW.msg = {kind:'err', text:errText({offline:true}, 'rewrite')}; renderRW(); focusIn('.box'); return; }
  RW.base = prep.src; RW.sentPrep = prep; RW.sentStyle = RW.style;
  RW.state = 'sending'; RW.msg = null; renderRW();
  const r = await post(plan, '/api/rewrite', {token:ses.token, text:prep.text, style:RW.style}, 60000);
  if (!S) return;
  if (r.ok) {
    const ans = readAnswer(r.body, RW.sentStyle);
    if (ans) {
      const back = restore(ans.text, RW.sentPrep);
      RW.ans = {text:back.text, unknown:back.unknown, mixed:back.mixed, inOrder:back.inOrder, changes:ans.changes, cautions:ans.cautions, style:RW.sentStyle, map:RW.sentPrep.map.filter(m => m.n)};
      if (S) S.ownOk = false;
      RW.state = 'answer'; renderRW();
      if (P.tps[1].hidden) say('The suggestion is ready under Rewrite with Claude.'); else focusIn('h4');
      return;
    }
    RW.state = 'preview'; RW.msg = {kind:'err', text: r.body && typeof r.body === 'object' ? 'The rewrite service sent an answer this panel could not read.' + KEPT + ' Try again; if it keeps happening, tell your BCBA.' : errText(r, 'rewrite', plan.host)};
  } else {
    if (r.status === 401 || (r.status === 403 && !/origin|referer|cross/.test(errCode(r.body)))) clearSession();
    RW.state = 'preview';
    RW.msg = r.aborted ? {kind:'ok', text:'Stopped. Nothing came back, and your text is unchanged.'} : {kind:'err', text:errText(r, 'rewrite', plan.host)};
  }
  renderRW(); focusIn(r.aborted ? 'h4' : '.box');
}
function renderAnswer(box){
  const a = RW.ans, sty = styleOf(a.style);
  box.appendChild(h('h4', {tabindex:'-1'}, 'Suggested (' + sty.label + ')'));
  if (P.ed.value !== RW.base) box.appendChild(msgBox({kind:'', text:'You changed your text after it was sent; the suggestion is for the text as it was sent.'}));
  const ops = diff(RW.base, a.text);
  const view = h('div', {class:'ans', role:'region', 'aria-label':'The suggestion' + (ops ? ', with the words it takes out struck through and the words it adds underlined' : '')});
  if (ops) ops.forEach(o => view.appendChild(o.t === '=' ? document.createTextNode(o.s) : h(o.t === '+' ? 'ins' : 'del', null, o.s)));
  else view.textContent = a.text;
  box.appendChild(view);
  /* each placeholder back as it was written, one by one, when the answer kept their order; otherwise one way of
     naming each, and a word where that was a choice */
  if (a.map.length) box.appendChild(h('p', {class:'hid'}, 'Put back: ' + a.map.map(m => m.ph + ' \u2192 ' + (a.inOrder ? m.forms.join(', ') : m.back)).join('; ') + (a.inOrder && a.map.some(m => m.forms.length > 1) ? ', each where it was.' : '.')));
  if (a.mixed.length) box.appendChild(msgBox({kind:'err', text: a.mixed.map(m => m.ph + ' stood for ' + andList(m.forms) + ' in your text').join('; ') + '. The suggestion does not keep the names in the same order, so ' + (a.mixed.length === 1 ? 'each ' + a.mixed[0].ph + ' became \u201c' + a.mixed[0].back + '\u201d' : 'each became one of them') + '. Check each name before you use it.'}));
  if (a.unknown.length) box.appendChild(msgBox({kind:'err', text:'The answer holds ' + uniqBy(a.unknown, x => x).join(', ') + ', which your text did not have. Check it before you use it.'}));
  if (a.changes.length) { box.appendChild(h('p', {class:'note', style:'margin:8px 0 0'}, h('b', null, 'What changed'))); box.appendChild(h('ul', {class:'li'}, a.changes.map(x => h('li', null, x)))); }
  if (a.cautions.length) { box.appendChild(h('p', {class:'note', style:'margin:8px 0 0'}, h('b', null, 'Check before you use it'))); box.appendChild(h('ul', {class:'li'}, a.cautions.map(x => h('li', null, x)))); }
  box.appendChild(h('div', {class:'acts'}, [
    h('button', {type:'button', class:'b pri', onclick: () => { push('the suggestion used'); P.ed.value = a.text; useText(a.text, 'Use this'); }}, 'Use this'),
    h('button', {type:'button', class:'b', onclick: () => { push('the suggestion used'); P.ed.value = a.text; RW.state = 'ready'; RW.ans = null; RW.msg = null; changed(); setTab(0); say('The suggestion is in Your text; edit it, check it, then press Use this text.'); try { P.tabs[0].focus(); } catch (e) {} }}, 'Use and keep editing'),
    h('button', {type:'button', class:'b', onclick: () => { RW.state = 'ready'; RW.ans = null; RW.msg = {kind:'ok', text:'Kept your text as it is.'}; renderRW(); focusIn('.sty .b'); }}, 'Keep mine')
  ]));
  box.appendChild(h('p', {class:'note', style:'margin-top:10px'}, 'Read it against what you saw: a rewrite can only use what the text says, and it can still get things wrong. Cancel closes the panel and leaves the field as it was.'));
}

/* ------------------------------------------------------------------ start */
function start(){ if (!build()) return; wire(); schedule(); }
window.nbhWording = Object.freeze({
  version: VERSION,
  rules: () => { const r = rules(); return {version:r.version, count:r.rules.length, bad:r.bad.slice()}; },
  /* with a field as well, what the form marks as not the writer's own (nbhWordingKeep) is left out, as in the panel */
  check: (t, ta) => check(t, ta && ta.tagName ? keepOf(ta, t) : null).map(f => ({id:f.id, cat:f.cat, start:f.start, end:f.end, text:f.text, why:f.why, suggest:f.suggest, replacement:f.replacement})),
  open: ta => openPanel(ta),
  close: () => closePanel('cancel'),
  deidentify: (t, extra) => { const r = deidentify(t, Array.isArray(extra) ? extra : []); return {text:r.text, hidden:r.map.filter(m => m.n).map(m => ({placeholder:m.ph, forms:m.forms.slice()}))}; },
  status: () => { const p = relayPlan(), r = rules(); return {rules:r.rules.length, badRules:r.bad.length, relay: p.ok ? 'ready' : p.why, reach:REACH.state, unlocked: !!(p.ok && getSession(p)), buttons:B.size, open:panelOpen, error:lastErr}; }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
