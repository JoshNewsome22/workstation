/* v21.31 the case: hooks for Form TE-1 (added by the enhancement sprint, package A9). A token system is built on a
   behavior to increase, so "Behavior the tokens are earned for" takes the case's replacement or skill, never a problem
   behavior: a replacement target defined on Form TB-1, else the replacement paired with a problem behavior (on Form TB-1,
   or Form FS-1's alternative), else the first skill (acquisition) objective on Form GB-1. A paired replacement that points
   to a defined replacement target ("see target 4"), or reads the same as one that does, is that target. Staff notes such as
   "(see target 4)", "(see Forms EA-1 and TD-1)", "(replacement)" and "(simulated)" are left out, and a candidate the link's
   problem-behavior guard names (NBHLink.problem: the case's problem behaviors, those seen at a compare, the common words
   for one) is passed over. It is placed only while the field is empty. The backup menu takes Form PA-1's ranked menu in
   rank order, without its low-preference third or the items it has not ranked yet: each row gets the item's name, its
   class (PA-1's type) and "Rank n (tier)" under Preference (PA-1). That happens only while every backup row is empty, so a
   menu begun by hand, or by the link with Form TK-1, is left as it is. Whatever else the general fill placed on this form
   (the function, were there a field for it) is still placed. "From the case" places the ticked replacement, behavior or
   objective in the behavior field while it is empty (a problem behavior ticked gives its replacement), and the ticked
   reinforcers in empty backup rows, then new ones; nothing typed is replaced. Its list says what each item gives here,
   ticks what the fill above would take, and shows a reduction goal, the function, and a problem behavior with no
   replacement named, unticked and disabled, with the reason. Out: nothing. */
(function(){
  var ROW = ['n','c','cost','pref','conf','note'];
  /* Form PA-1's stimulus types, as this menu's classes */
  var CLS = { 'edible':'Edible', 'drink':'Drink', 'leisure item':'Leisure item', 'leisure':'Leisure item', 'activity':'Activity',
    'social':'Social / attention', 'social / attention':'Social / attention', 'escape or break':'Escape or break', 'sensory':'Sensory', 'other':'Other' };
  /* a staff note in a case label; a bracket that is the label's own ("(FCR)") stays */
  var NOTE = /\s*[(\[]\s*(?:see\b|cf\b|replacement\b|alternative\b|simulated\b|paired\b|forms?\s+[a-z]{2,3}-\d)[^)\]]*(?:[)\]]|$)/gi;
  var JUNK = /^(?:this is\b|n\/?a\b|none\b|tbd\b|see\b|same as\b)/i;
  function tr(v){ return String(v == null ? '' : v).trim(); }
  function nm(s){ return window.NBHLink && NBHLink.norm ? NBHLink.norm(s) : tr(s).replace(/\s+/g, ' ').toLowerCase(); }
  function clean(s){
    var t = tr(s).replace(NOTE, ' ').replace(/[\s;,.]*\bsee (?:target|behavior|row) \d+\.?$/i, '').replace(/\s+/g, ' ').trim()
      .replace(/^[\s–—:;,.-]+/, '').replace(/[\s–—:;,.-]+$/, '');
    return !t || JUNK.test(t) ? '' : t.charAt(0).toUpperCase() + t.slice(1);
  }
  /* the case's behaviors, each in its own place (the list's items are numbered by it) */
  function behsOf(f){ return f && Array.isArray(f.behaviors) ? f.behaviors.map(function(b){ return b && typeof b === 'object' ? b : {}; }) : []; }
  function acqOf(f){ return f && f.goals && Array.isArray(f.goals.acq) ? f.goals.acq : []; }
  /* a replacement target: Form TB-1's type says so (a target on sheet 4, or a candidate marked Target – replacement);
     Form FS-1 lists problem behaviors only */
  function isRep(b){ return !!b && (b.isRep === true || (b.isRep !== false && b.src !== 'FS-1' && /replacement|alternative/i.test(tr(b.type)))); }
  /* a behavior to reduce: one of the case's own (by its label, notes and all or without them), else the link's guard */
  function prob(t, behs){
    if (!t) return null;
    var k = nm(t);
    for (var i = 0; i < behs.length; i++) { var b = behs[i]; if (!isRep(b) && tr(b.label) && (nm(b.label) === k || nm(clean(b.label)) === k)) return { src:'case' }; }
    var N = window.NBHLink; if (!N || !N.problem) return null;
    var lk = null; try { lk = N.readLk(S.meta.lk || ''); } catch (e) {}
    return N.problem(t, { facts: behs, seen: (lk && lk.pb) || [] });
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
  function clsOf(type){ var c = CLS[nm(type)]; return c || (typeof CLASSES !== 'undefined' && CLASSES.indexOf(tr(type)) > 0 ? tr(type) : ''); }
  function prefOf(m){ return m.rank != null && isFinite(+m.rank) ? 'Rank ' + (+m.rank) + (m.tier ? ' (' + m.tier + ')' : '') : 'Not yet ranked'; }
  function rowOf(m){ return { n: tr(m.name), c: clsOf(m.type), cost: '', pref: prefOf(m), conf: '', note: '' }; }
  /* Form PA-1's ranked menu without its low-preference third, in rank order, each name once */
  function ranked(menu){
    var seen = {};
    return (Array.isArray(menu) ? menu : []).filter(function(m){
      if (!m || !tr(m.name) || m.rank == null || !isFinite(+m.rank) || m.tier === 'LP') return false;
      var k = nm(m.name); if (seen[k]) return false; seen[k] = 1; return true;
    }).sort(function(a, b){ return (+a.rank) - (+b.rank); });
  }
  /* a row into the first empty backup row, else a new one at the end */
  function put(m){ var row = rowOf(m), i = S.bk.findIndex(function(r){ return rowEmpty(r); }); if (i >= 0) S.bk[i] = row; else S.bk.push(row); }
  function onMenu(name){ return S.bk.some(function(r){ var x = tr(r.n); return !!x && (nm(x) === nm(name) || !!(window.NBHLink && NBHLink.near && NBHLink.near(x, name))); }); }
  function plural(n, one, many){ return n === 1 ? one : n + ' ' + many; }

  /* always an object: a falsy answer would let the general fill place the first behavior, a problem behavior, after all */
  window.__nbhFactsIn = function(f){
    f = f && typeof f === 'object' ? f : {};
    var n = 0, notes = [];
    if (!tr(S.meta.beh)) {
      var c = candidates(f)[0];
      if (c) { S.meta.beh = c.t; n++; }
      else if (behsOf(f).length || acqOf(f).length) notes.push('the case names no replacement or skill for the behavior the tokens are earned for');
    }
    if (Array.isArray(f.menu) && f.menu.length) {
      if (S.bk.every(rowEmpty)) {
        var items = ranked(f.menu);
        items.forEach(put); n += items.length;
        if (!items.length) notes.push('Form PA-1 has ranked no item above its low-preference third yet');
      } else notes.push('the backup menu is already begun; the picker adds to it');
    }
    try { if (window.nbhCase) n += (window.nbhCase.generic({ fn: f.fn }, false).filled || 0); } catch (e) {}
    if (n) renderAll();
    var rep = { filled: n }; if (notes.length) rep.note = notes.join('; ');
    return rep;
  };

  window.__nbhFactsPick = function(sel){
    sel = sel && typeof sel === 'object' ? sel : {};
    var f = sel.facts || (window.nbhCase && window.nbhCase.facts) || {}, behs = behsOf(f), g = sel.goals || {};
    var n = 0, notes = [], want = [], none = 0, bad = 0, dup = 0;
    function take(t){ if (!t) return; if (prob(t, behs)) { bad++; return; } if (!want.some(function(x){ return nm(x) === nm(t); })) want.push(t); }
    (sel.behaviors || []).forEach(function(b){ var t = fromBeh(b, behs); if (t) take(t); else none++; });
    (g.acq || []).forEach(function(a){ take(clean(a && a.beh)); });
    if (want.length) {
      var cur = tr(S.meta.beh);
      if (!cur) { S.meta.beh = want[0]; n++; if (want.length > 1) notes.push('the behavior the tokens are earned for is one behavior, so “' + want[0] + '” went in'); }
      else if (nm(cur) !== nm(want[0])) notes.push('“Behavior the tokens are earned for” already reads “' + cur + '”; clear it first to put “' + want[0] + '” there');
    }
    if (none) notes.push(plural(none, 'a ticked behavior is', 'ticked behaviors are') + ' a behavior to reduce with no replacement named, so nothing went in for ' + (none === 1 ? 'it' : 'them'));
    if (bad) notes.push(plural(bad, 'a ticked item names', 'ticked items name') + ' a behavior to reduce, so ' + (bad === 1 ? 'it was' : 'they were') + ' left out');
    if ((g.red || []).length) notes.push('a reduction goal is not placed here: tokens are earned for a behavior to increase');
    if (sel.fn) notes.push('this form has no field for the function');
    (sel.menu || []).forEach(function(m){ var t = tr(m && m.name); if (!t) return; if (onMenu(t)) { dup++; return; } put(m); n++; });
    if (dup) notes.push(plural(dup, 'a ticked reinforcer is', 'ticked reinforcers are') + ' on the backup menu already');
    if (n) renderAll();
    var note = notes.join('; ');
    if (note) note = (n ? note.charAt(0).toUpperCase() + note.slice(1) : note) + '.';
    return { filled: n, note: note };
  };

  /* the "From the case" list, as it opens (the button's own click builds it; this runs after, as the click reaches the
     document): what each item gives this form, the fill's own choice ticked, and what this form never takes disabled */
  function own(cb, text, off){
    var sp = cb.nextElementSibling; if (!sp || sp.querySelector('.nbhc-own')) return;
    var s = document.createElement('small'), b = sp.querySelector('b');
    s.className = 'nbhc-own'; s.style.cssText = 'color:#16242e;font-weight:600'; s.textContent = text;
    sp.insertBefore(s, b ? b.nextSibling : sp.firstChild);
    if (off) { cb.checked = false; cb.disabled = true; }
  }
  function annotate(body, f){
    var behs = behsOf(f), acq = acqOf(f), menu = Array.isArray(f.menu) ? f.menu : [], cur = tr(S.meta.beh), first = cur ? null : (candidates(f)[0] || null);
    var BEH = 'the behavior the tokens are earned for';
    Array.prototype.forEach.call(body.querySelectorAll('input[type="checkbox"][data-kind]'), function(cb){
      var k = cb.dataset.kind, i = +cb.dataset.i, t, item;
      if (k === 'beh' || k === 'acq') {
        item = k === 'beh' ? behs[i] : acq[i];
        t = k === 'beh' ? fromBeh(item, behs) : clean(item && item.beh);
        if (!t) { own(cb, 'Not placed on this form: a behavior to reduce, with no replacement named for it.', true); return; }
        if (prob(t, behs)) { own(cb, 'Not placed on this form: “' + t + '” names a behavior to reduce.', true); return; }
        var red = k === 'beh' && !isRep(item), lead = red ? 'A behavior to reduce: its replacement, “' + t + '”, ' : '';
        if (cur && nm(cur) === nm(t)) { own(cb, red ? lead + 'is already ' + BEH + ' here.' : 'Already ' + BEH + ' here.'); cb.checked = false; return; }
        own(cb, red ? lead + 'goes here as ' + BEH + '.' : 'Goes here as ' + BEH + ': “' + t + '”.');
        cb.checked = !!first && first.kind === k && first.i === i;
      } else if (k === 'red') own(cb, 'Not placed on this form: tokens are earned for a behavior to increase.', true);
      else if (k === 'fn') own(cb, 'Not placed on this form: it has no field for the function.', true);
      else if (k === 'menu') {
        item = menu[i]; if (!item) return;
        if (onMenu(tr(item.name))) { own(cb, 'Already on the backup menu.'); cb.checked = false; return; }
        cb.checked = item.rank != null && item.tier !== 'LP';
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
