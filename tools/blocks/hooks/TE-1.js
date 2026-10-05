/* v21.31 the case: hooks for Form TE-1 (added by the enhancement sprint, package A9). A token system is built on a
   behavior to increase, so "Behavior the tokens are earned for" takes the case's replacement or skill, never a problem
   behavior: a replacement target defined on Form TB-1, else the replacement paired with a problem behavior (on Form TB-1,
   or Form FS-1's alternative), else the first skill (acquisition) objective on Form GB-1. A paired replacement that points
   to a defined replacement target ("see target 4"), or reads the same as one that does, is that target. Staff notes such as
   "(see target 4)", "(see Forms EA-1 and TD-1)", "(replacement)" and "(simulated)" are left out (a bracket that is the
   label's own, "(FCR)", stays), and a candidate that names a behavior to reduce is passed over: one of the case's problem
   behaviors, one the link saw at a compare, or the common words for one (NBHLink.problem), unless a word earlier in the
   same clause turns it round ("Keeps hands to self (no hitting, kicking, or biting)"). It is placed only while the field
   is empty. The backup menu takes Form PA-1's ranked menu in rank order, without its low-preference third or the items it
   has not ranked yet: each row gets the item's name, its class (PA-1's type) and "Rank n (tier)" under Preference (PA-1).
   That happens only while every backup row is empty, so a menu begun by hand, or by the link with Form TK-1, is left as it
   is. What the fill placed is remembered (in memory, never saved) while it is untouched, so a later push of the case puts
   the case's current choice in its place: the replacement as Form TB-1's typing goes on, PA-1's ranking as its scoring goes
   on. The first edit here (the behavior typed; a backup row typed in, added or deleted), "Use the ticked items here", or a
   record opened, cleared, simulated or restored ends that, and what is there stays. Only what changed is drawn again, so a
   field being typed in keeps its focus and caret. While the field holds one of the case's problem behaviors (or one the
   link saw at a compare), a warning shows under it, on screen only, and at the top of the "From the case" list. Whatever
   else the general fill placed on this form (the function, were there a field for it) is still placed. "From the case"
   places the ticked replacement, behavior or objective in the behavior field while it is empty (a problem behavior ticked
   gives its replacement), and the ticked reinforcers in empty backup rows, then new ones; nothing typed is replaced. Its
   list says what each item gives here, ticks what the fill above would take, and shows a reduction goal, the function,
   and a problem behavior with no replacement named, unticked and disabled, with the reason. Out: nothing. */
(function(){
  var ROW = ['n','c','cost','pref','conf','note'];
  /* Form PA-1's stimulus types, as this menu's classes */
  var CLS = { 'edible':'Edible', 'drink':'Drink', 'leisure item':'Leisure item', 'leisure':'Leisure item', 'activity':'Activity',
    'social':'Social / attention', 'social / attention':'Social / attention', 'escape or break':'Escape or break', 'sensory':'Sensory', 'other':'Other' };
  /* a staff note in a case label: a bracket that begins "see " ("(see target 4)", "(see Forms EA-1 and TD-1)"), "cf",
     "replacement", "alternative", "simulated", "paired" or a form's number; a bracket that is the label's own ("(FCR)",
     "(see-saw)") stays */
  var NOTE = /\s*[(\[]\s*(?:see\s|cf\b|replacement\b|alternative\b|simulated\b|paired\b|forms?\s+[a-z]{2,3}-\d)[^)\]]*(?:[)\]]|$)/gi;
  /* words that are only a pointer or a placeholder ("see target 4", "see the note", "n/a"); "See-saw turn taking" is a behavior */
  var JUNK = /^(?:this is\b|n\/?a\b|none\b|tbd\b|same as\b|see\s+(?:the\s+)?(?:targets?|behaviou?rs?|forms?|sheets?|rows?|notes?|bip|plan|above|below|[a-z]{2,3}-\d)\b)/i;
  /* a word that turns a problem behavior's name round when it comes earlier in the same clause */
  var NEG = /\b(?:no|not|without|never|instead\s+of|rather\s+than)\b/i;
  function tr(v){ return String(v == null ? '' : v).trim(); }
  function nm(s){ return window.NBHLink && NBHLink.norm ? NBHLink.norm(s) : tr(s).replace(/\s+/g, ' ').toLowerCase(); }
  function clean(s){
    var t = tr(s).replace(NOTE, ' ').replace(/[\s;,.]*\bsee (?:target|behavior|row) \d+\.?$/i, '').replace(/\s+/g, ' ').trim()
      .replace(/^[\s–—:;,.-]+/, '').replace(/[\s–—:;,.-]+$/, '');
    if (!t || JUNK.test(t)) return '';
    /* a capital first letter when the first word is all lower case; "iPad", "AAC" and "eBook" stay as written */
    var w = t.split(' ')[0];
    return w === w.toLowerCase() ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }
  /* the case's behaviors, each in its own place (the list's items are numbered by it) */
  function behsOf(f){ return f && Array.isArray(f.behaviors) ? f.behaviors.map(function(b){ return b && typeof b === 'object' ? b : {}; }) : []; }
  function acqOf(f){ return f && f.goals && Array.isArray(f.goals.acq) ? f.goals.acq : []; }
  /* a replacement target: Form TB-1's type says so (a target on sheet 4, or a candidate marked Target – replacement);
     Form FS-1 lists problem behaviors only */
  function isRep(b){ return !!b && (b.isRep === true || (b.isRep !== false && b.src !== 'FS-1' && /replacement|alternative/i.test(tr(b.type)))); }
  /* the case's own problem behavior these words are (by its label, notes and all or without them, on either side) */
  function caseProb(t, behs){
    var ks = [nm(t), nm(clean(t))].filter(Boolean);
    for (var i = 0; i < behs.length; i++) { var b = behs[i], l = tr(b.label); if (isRep(b) || !l) continue;
      if ([nm(l), nm(clean(l))].some(function(a){ return !!a && ks.indexOf(a) >= 0; })) return b; }
    return null;
  }
  /* the problem behaviors the link saw at a compare (the record's hashes) */
  function seenOf(){ var lk = null; try { lk = NBHLink.readLk(S.meta.lk || ''); } catch (e) {} return (lk && lk.pb) || []; }
  /* every problem word the link's guard finds is turned round earlier in its own clause; a candidate is a behavior to
     increase by where it comes from, so "no hitting, kicking, or biting" describes it */
  function turned(t){
    return tr(t).split(/[.;:!?()\[\]–—]+/).every(function(cl){
      var p = NBHLink.problem(cl, {}); if (!p || p.src !== 'word') return true;
      var c = nm(cl), at = c.indexOf(p.word); return at > 0 && NEG.test(c.slice(0, at));
    });
  }
  /* a candidate that is a behavior to reduce: one of the case's own, else the link's guard */
  function prob(t, behs){
    if (!t) return null;
    if (caseProb(t, behs)) return { src:'case' };
    var N = window.NBHLink; if (!N || !N.problem) return null;
    var p = N.problem(t, { facts: behs, seen: seenOf() });
    return p && p.src === 'word' && turned(t) ? null : p;
  }
  function seeTarget(raw, behs){ var m = /\bsee\s+target\s+(\d+)\b/i.exec(tr(raw)), t = m ? behs[+m[1] - 1] : null; return t && isRep(t) ? clean(t.label) : ''; }
  /* the behavior a case item gives this field: a replacement target its own name; a problem behavior its paired
     replacement, under the replacement target's name when it points to one or reads the same as one that does */
  function fromBeh(b, behs){
    if (!b) return '';
    if (isRep(b)) return clean(b.label);
    var raw = tr(b.rep || b.alt); if (!raw) return '';
    var t = seeTarget(raw, behs); if (t) return t;
    var c = clean(raw), k = nm(c);
    for (var i = 0; i < behs.length; i++) { var o = behs[i], r = tr(o.rep || o.alt);
      if (o !== b && !isRep(o) && r && nm(clean(r)) === k) { t = seeTarget(r, behs); if (t) return t; } }
    return c;
  }
  /* the fill's candidates, in order: the defined replacement targets, the paired replacements, Form GB-1's skill objectives */
  function candidates(f){
    var behs = behsOf(f), out = [];
    function add(t, kind, i){ if (t && !prob(t, behs) && !out.some(function(x){ return nm(x.t) === nm(t); })) out.push({ t:t, kind:kind, i:i }); }
    behs.forEach(function(b, i){ if (isRep(b)) add(clean(b.label), 'beh', i); });
    behs.forEach(function(b, i){ if (!isRep(b)) add(fromBeh(b, behs), 'beh', i); });
    acqOf(f).forEach(function(a, i){ add(clean(a && a.beh), 'acq', i); });
    return out;
  }
  function rowEmpty(r){ return !r || ROW.every(function(k){ return !tr(r[k]); }); }
  function blankRow(){ return { n:'', c:'', cost:'', pref:'', conf:'', note:'' }; }
  function clsOf(type){ var c = CLS[nm(type)]; return c || (typeof CLASSES !== 'undefined' && CLASSES.indexOf(tr(type)) > 0 ? tr(type) : ''); }
  function isRanked(m){ return !!m && m.rank != null && isFinite(+m.rank); }
  function prefOf(m){ return isRanked(m) ? 'Rank ' + (+m.rank) + (m.tier ? ' (' + m.tier + ')' : '') : 'Not yet ranked'; }
  function rowOf(m){ return { n: tr(m.name), c: clsOf(m.type), cost: '', pref: prefOf(m), conf: '', note: '' }; }
  /* Form PA-1's ranked menu without its low-preference third, in rank order, each name once */
  function ranked(menu){
    var seen = {};
    return (Array.isArray(menu) ? menu : []).filter(function(m){
      if (!m || !tr(m.name) || !isRanked(m) || m.tier === 'LP') return false;
      var k = nm(m.name); if (seen[k]) return false; seen[k] = 1; return true;
    }).sort(function(a, b){ return (+a.rank) - (+b.rank); });
  }
  /* a row into the first empty backup row, else a new one at the end */
  function put(m){ var row = rowOf(m), i = S.bk.findIndex(function(r){ return rowEmpty(r); }); if (i >= 0) S.bk[i] = row; else S.bk.push(row); }
  function onMenu(name){ return S.bk.some(function(r){ var x = tr(r.n); return !!x && (nm(x) === nm(name) || !!(window.NBHLink && NBHLink.near && NBHLink.near(x, name))); }); }
  function plural(n, one, many){ return n === 1 ? one : n + ' ' + many; }

  /* what the fill placed on this record (S): the behavior, and the backup menu as the fill left it with the row count it
     found. Kept in memory only; a record opened, cleared, simulated or restored is a new S, and starts with nothing */
  var fill = { S: null, beh: '', bk: '', len: 0 };
  function fresh(){ if (fill.S !== S) fill = { S: S, beh: '', bk: '', len: 0 }; }
  function sigBk(){ return JSON.stringify(S.bk.map(function(r){ return ROW.map(function(k){ return tr(r && r[k]); }); })); }
  function stopBeh(){ fill.beh = ''; }
  function stopBk(){ fill.bk = ''; }
  /* the first edit here ends it: the behavior typed, a backup row typed in, added or deleted (a value placed by a restore
     comes with the same events). As the event reaches the document, the form's own handler has already read the value. */
  ['input','change'].forEach(function(ev){ document.addEventListener(ev, function(e){ var t = e.target;
    if (!t || !t.closest) return;
    if (t.dataset && t.dataset.m === 'beh') { stopBeh(); warn(); }
    else if (t.closest('#bkTbl')) stopBk(); }); });
  document.addEventListener('click', function(e){ var t = e.target;
    if (t && t.closest && (t.closest('#addBk') || t.closest('#delBk') || t.closest('#bkTbl .rowDel'))) stopBk(); }, true);

  /* only what changed is drawn again (renderAll redrew every table, and a field being typed in lost its focus) */
  function redraw(beh, rows){
    if (beh) { var el = document.querySelector('[data-m="beh"]'); if (el && el.value !== (S.meta.beh || '')) el.value = S.meta.beh || ''; }
    if (rows) keepFocus('#bkTbl', renderGen);
    if (beh || rows) { try { lkPaint(); } catch (e) {} }
    warn();
  }
  /* a backup cell that has the focus as its table is drawn again has it after, caret and all */
  function keepFocus(sel, draw){
    var box = document.querySelector(sel), a = document.activeElement, at = null;
    if (box && a && a !== box && box.contains(a) && a.dataset && a.dataset.k != null) at = { k: a.dataset.k, f: a.dataset.f, s: a.selectionStart, e: a.selectionEnd };
    draw();
    var el = at && box ? box.querySelector('[data-k="' + at.k + '"][data-f="' + at.f + '"]') : null; if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    try { if (at.s != null) el.setSelectionRange(at.s, at.e); } catch (e) {}
  }

  /* the field's own value, when the case names it as a problem behavior (or the link saw it as one at a compare), with
     the replacement to name instead */
  function fieldProb(){
    var t = tr(S.meta.beh), N = window.NBHLink; if (!t || !N || !N.problem || !N.problemNote) return null;
    var f = (window.nbhCase && window.nbhCase.facts) || {}, behs = behsOf(f), b = caseProb(t, behs);
    if (b) { var r = fromBeh(b, behs); if (!r || prob(r, behs)) r = (candidates(f)[0] || {}).t || '';
      return { src:'case', form: b.src === 'FS-1' ? 'FS-1' : 'TB-1', rep: r }; }
    var p = N.problem(t, { facts: [], seen: seenOf() });
    return p && p.src === 'seen' ? p : null;
  }
  function warnText(){ var p = null; try { p = fieldProb(); } catch (e) {}
    return p ? NBHLink.problemNote(p, { lead:'This plan’s behavior', text: tr(S.meta.beh), fix:'correct it here' }) : ''; }
  /* the warning under the field: on screen only (noprint), never saved */
  function warn(){
    var el = document.querySelector('[data-m="beh"]'); if (!el) return;
    var t = warnText(), w = document.getElementById('teBehWarn');
    if (!w) { if (!t) return; w = document.createElement('div'); w.id = 'teBehWarn'; w.className = 'verdict v-no noprint'; el.parentNode.insertBefore(w, el.nextSibling); }
    w.textContent = t; w.hidden = !t;
    if (t) el.setAttribute('aria-describedby', 'teBehWarn'); else el.removeAttribute('aria-describedby');
  }
  /* renderAll calls it too: a record opened, cleared, simulated or taken from the book changes the field without an event */
  window.__nbhTeWarn = warn;

  /* always an object: a falsy answer would let the general fill place the first behavior, a problem behavior, after all */
  window.__nbhFactsIn = function(f){
    f = f && typeof f === 'object' ? f : {};
    fresh();
    var n = 0, notes = [], beh = false, rows = false, cur = tr(S.meta.beh), c = candidates(f)[0];
    /* an empty field, or the fill's own behavior still as it placed it: the case's choice now */
    if (!cur || (fill.beh && cur === fill.beh)) {
      if (c && c.t !== cur) { S.meta.beh = c.t; fill.beh = c.t; n++; beh = true; }
      else if (!cur && !c && (behsOf(f).length || acqOf(f).length)) notes.push('the case names no replacement or skill for the behavior the tokens are earned for');
    }
    if (Array.isArray(f.menu) && f.menu.length) {
      var items = ranked(f.menu), was = sigBk();
      if (S.bk.every(rowEmpty)) {
        if (items.length) { fill.len = S.bk.length; items.forEach(put); fill.bk = sigBk(); n += items.length; rows = true; }
        else notes.push('Form PA-1 has ranked no item above its low-preference third yet');
      } else if (fill.bk && was === fill.bk) {
        /* the fill's own rows, untouched: placed again from PA-1's ranking as it is now */
        if (items.length) {
          var prev = S.bk; S.bk = []; while (S.bk.length < fill.len) S.bk.push(blankRow()); items.forEach(put);
          var now = sigBk(); if (now === was) S.bk = prev; else { fill.bk = now; n += items.length; rows = true; }
        }
      } else notes.push('the backup menu is already begun; the picker adds to it');
    }
    try { if (window.nbhCase) n += (window.nbhCase.generic({ fn: f.fn }, false).filled || 0); } catch (e) {}
    redraw(beh, rows);
    var rep = { filled: n }; if (notes.length) rep.note = notes.join('; ');
    return rep;
  };

  window.__nbhFactsPick = function(sel){
    sel = sel && typeof sel === 'object' ? sel : {};
    /* what is picked is the user's choice: the fill no longer follows the case */
    fresh(); stopBeh(); stopBk();
    var f = sel.facts || (window.nbhCase && window.nbhCase.facts) || {}, behs = behsOf(f), g = sel.goals || {};
    var n = 0, notes = [], want = [], none = 0, bad = 0, dup = 0, beh = false, rows = false;
    function take(t){ if (!t) return; if (prob(t, behs)) { bad++; return; } if (!want.some(function(x){ return nm(x) === nm(t); })) want.push(t); }
    (sel.behaviors || []).forEach(function(b){ var t = fromBeh(b, behs); if (t) take(t); else none++; });
    (g.acq || []).forEach(function(a){ take(clean(a && a.beh)); });
    if (want.length) {
      var cur = tr(S.meta.beh);
      if (!cur) { S.meta.beh = want[0]; n++; beh = true; if (want.length > 1) notes.push('the behavior the tokens are earned for is one behavior, so “' + want[0] + '” went in'); }
      else if (nm(cur) !== nm(want[0])) notes.push('“Behavior the tokens are earned for” already reads “' + cur + '”; clear it first to put “' + want[0] + '” there');
    }
    if (none) notes.push(plural(none, 'a ticked behavior is a behavior to reduce', 'ticked behaviors are behaviors to reduce') + ' with no replacement named, so nothing went in for ' + (none === 1 ? 'it' : 'them'));
    if (bad) notes.push(plural(bad, 'a ticked item names a behavior to reduce, so it was', 'ticked items name behaviors to reduce, so they were') + ' left out');
    if ((g.red || []).length) notes.push('a reduction goal is not placed here: tokens are earned for a behavior to increase');
    if (sel.fn) notes.push('this form has no field for the function');
    (sel.menu || []).forEach(function(m){ var t = tr(m && m.name); if (!t) return; if (onMenu(t)) { dup++; return; } put(m); n++; rows = true; });
    if (dup) notes.push(plural(dup, 'a ticked reinforcer is', 'ticked reinforcers are') + ' on the backup menu already');
    redraw(beh, rows);
    var note = notes.join('; ');
    if (note) note = (n ? note.charAt(0).toUpperCase() + note.slice(1) : note) + '.';
    return { filled: n, note: note };
  };

  /* the "From the case" list, as it opens (the button's own click builds it; this runs after, as the click reaches the
     document): the warning first, while the field holds a problem behavior; what each item gives this form, the fill's
     own choice ticked, and what this form never takes disabled */
  function own(cb, text, off){
    var sp = cb.nextElementSibling; if (!sp || sp.querySelector('.nbhc-own')) return;
    var s = document.createElement('small'), b = sp.querySelector('b');
    s.className = 'nbhc-own'; s.style.cssText = 'color:#16242e;font-weight:600'; s.textContent = text;
    sp.insertBefore(s, b ? b.nextSibling : sp.firstChild);
    if (off) { cb.checked = false; cb.disabled = true; }
  }
  function annotate(body, f){
    var behs = behsOf(f), acq = acqOf(f), menu = Array.isArray(f.menu) ? f.menu : [], cur = tr(S.meta.beh), first = cur ? null : (candidates(f)[0] || null);
    var BEH = 'the behavior the tokens are earned for', FULL = ', but the field already reads “' + cur + '”; clear it first.', wt = warnText();
    if (wt && !body.querySelector('.nbhc-warn')) {
      var d = document.createElement('div'); d.className = 'nbhc-warn'; d.setAttribute('role', 'note');
      d.style.cssText = 'margin:8px 0 4px;padding:7px 10px;background:#F6E0E0;border-left:3px solid #8E2A2A;color:#16242e;line-height:1.4';
      d.textContent = wt; body.insertBefore(d, body.firstChild);
    }
    Array.prototype.forEach.call(body.querySelectorAll('input[type="checkbox"][data-kind]'), function(cb){
      var k = cb.dataset.kind, i = +cb.dataset.i, t, item;
      if (k === 'beh' || k === 'acq') {
        item = k === 'beh' ? behs[i] : acq[i];
        t = k === 'beh' ? fromBeh(item, behs) : clean(item && item.beh);
        if (!t) { own(cb, 'Not placed on this form: a behavior to reduce, with no replacement named for it.', true); return; }
        if (prob(t, behs)) { own(cb, 'Not placed on this form: “' + t + '” names a behavior to reduce.', true); return; }
        var red = k === 'beh' && !isRep(item), lead = red ? 'A behavior to reduce: its replacement, “' + t + '”, ' : '';
        if (cur && nm(cur) === nm(t)) { own(cb, red ? lead + 'is already ' + BEH + ' here.' : 'Already ' + BEH + ' here.'); cb.checked = false; return; }
        if (cur) { own(cb, (red ? lead : '“' + t + '” ') + 'would go here as ' + BEH + FULL); cb.checked = false; return; }
        own(cb, red ? lead + 'goes here as ' + BEH + '.' : 'Goes here as ' + BEH + ': “' + t + '”.');
        cb.checked = !!first && first.kind === k && first.i === i;
      } else if (k === 'red') own(cb, 'Not placed on this form: tokens are earned for a behavior to increase.', true);
      else if (k === 'fn') own(cb, 'Not placed on this form: it has no field for the function.', true);
      else if (k === 'menu') {
        item = menu[i]; if (!item) return;
        if (onMenu(tr(item.name))) { own(cb, 'Already on the backup menu.'); cb.checked = false; return; }
        if (!isRanked(item)) { own(cb, 'Not yet ranked on Form PA-1: the fill leaves it out; tick it to add it anyway.'); cb.checked = false; return; }
        if (item.tier === 'LP') { own(cb, 'Low preference on Form PA-1: the fill leaves it out; tick it to add it anyway.'); cb.checked = false; return; }
        own(cb, 'Goes on the backup menu, with “' + prefOf(item) + '” under Preference (PA-1).'); cb.checked = true;
      }
    });
  }
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('#nbhCaseBtn') : null; if (!b) return;
    var body = document.querySelector('#nbhcBody'), f = window.nbhCase && window.nbhCase.facts;
    if (!body || !f || !document.querySelector('#nbhCaseDlg[open]')) return;
    try { annotate(body, f); } catch (err) {}
  });
})();
