
/* ===================== the case: facts that flow between forms (v21.31) =====================
   The target behaviors (Form TB-1), the function (Form FS-1), the goals (Form GB-1) and the
   reinforcer menu (Form PA-1) are typed once. The workstation shell reads them from whichever of
   those forms is open and hands them to every other open form as one object, the case:
     { behaviors:[{label, def, ex, nex, type, fn, fnKey, dim, unit, rep, ctx, ...}],
       fn:{key, label, statements:[...], perBehavior:[...]},
       goals:{red:[{beh, dir, meas, cur, ml, tgt, ctx, crit, meth, date, pair, text}],
              acq:[{beh, cond, crit, n, unit, meth, date, pair, text}]},
       menu:[{name, type, rank, tier, mean, methods, informant}],
       src:{behaviors:'TB-1', fn:'FS-1', goals:'GB-1', menu:'PA-1'}, when }
   A form that holds any of these defines window.__nbhFactsOut(), returning its part. A form
   that uses them may define window.__nbhFactsIn(facts), which places them into the empty parts
   of its own structure and returns {filled:n}, and window.__nbhFactsPick(selection), which
   takes the items a person ticks under the "From the case" button on the toolbar. A form
   without those hooks has its behavior and function fields (the ones the packet map already
   names) filled when they are empty. Nothing already typed is overwritten unless it is picked.
   Nothing is stored in the browser: the case travels in the packet and case files. */
(function(){
  var C = { facts: null, last: null };
  function q(s){ return document.querySelector(s); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fire(el){ ['input','change'].forEach(function(t){ try { el.dispatchEvent(new Event(t, {bubbles:true})); } catch(e){} }); }
  function findField(key){
    var M = window.__nbhPacketMap || {}, sels = M[key] || [];
    for (var i = 0; i < sels.length; i++) { var el = document.querySelector(sels[i]); if (el && el.tagName !== 'BUTTON') return el; }
    return null;
  }
  function empty(el){ return !el || !String(el.value || '').trim(); }
  /* the option of a select that names a function: by key (escape, attention, tangible, automatic,
     multiple, unknown) or by the label's words */
  var FNWORDS = { escape:/escape|avoid/i, attention:/attention/i, tangible:/tangible|activity/i,
                  automatic:/automatic|nonsocial|sensory/i, multiple:/more than one|multiple|multiply/i, unknown:/unknown|not assessed|undetermined/i };
  C.fnKeyOf = function(s){
    s = String(s || '').toLowerCase(); if (!s) return '';
    for (var k in FNWORDS) if (FNWORDS[k].test(s)) return k;
    return 'multiple';
  };
  C.optionFor = function(sel, want){
    if (!sel || sel.tagName !== 'SELECT' || !want) return '';
    var key = FNWORDS[want] ? want : C.fnKeyOf(want), re = FNWORDS[key], hit = null, w = String(want).toLowerCase();
    Array.prototype.forEach.call(sel.options, function(o){
      if (hit || !o.value && !o.textContent.trim()) return;
      var t = (o.textContent + ' ' + o.value);
      if (t.toLowerCase() === w || (re && re.test(t))) hit = o;
    });
    return hit ? hit.value : '';
  };
  function put(el, v, force){
    if (!el || !v) return false;
    if (!force && !empty(el)) return false;
    if (el.tagName === 'SELECT') { var ov = C.optionFor(el, v); if (!ov) return false; el.value = ov; }
    else el.value = v;
    fire(el); return true;
  }
  C.put = put;
  C.behaviors = function(){ return (C.facts && C.facts.behaviors) || []; };
  C.primary = function(){ return C.behaviors()[0] || null; };
  C.fn = function(){ return (C.facts && C.facts.fn) || null; };
  C.goals = function(){ var g = (C.facts && C.facts.goals) || {}; return { red: g.red || [], acq: g.acq || [] }; };
  C.menu = function(){ return (C.facts && C.facts.menu) || []; };
  C.line = function(b, withDef){ if (!b) return ''; return withDef && b.def ? (b.label + ': ' + b.def) : (b.label || ''); };
  C.menuLine = function(items, n){ return (items || []).filter(function(m){ return m.tier !== 'LP'; }).slice(0, n || 5).map(function(m){ return m.name; }).join(', '); };
  C.has = function(f){ f = f || C.facts; return !!(f && ((f.behaviors && f.behaviors.length) || (f.fn && (f.fn.key || f.fn.label)) ||
    (f.goals && ((f.goals.red || []).length || (f.goals.acq || []).length)) || (f.menu && f.menu.length))); };
  /* the fields the packet map names: the first behavior and the function, when the field is empty */
  C.generic = function(f, force){
    var n = 0, b = (f.behaviors || [])[0], be = findField('beh'), fe = findField('fn');
    if (b && be && put(be, be.tagName === 'TEXTAREA' ? C.line(b, true) : b.label, force)) n++;
    if (f.fn && (f.fn.key || f.fn.label) && fe && put(fe, fe.tagName === 'SELECT' ? (f.fn.key || f.fn.label) : f.fn.label, force)) n++;
    return { filled: n, generic: true };
  };
  /* what is due (v21.35): the form's own list when it has one (window.__nbhDue), else every date field whose
     label says review, target date, due or next; the shell keeps the ones within two weeks or past */
  C.due = function(){
    try { if (window.__nbhDue) return window.__nbhDue(); } catch (e) {}
    var out = [], seen = {};
    var list = document.querySelectorAll('input[type="date"],input[data-m="review"],input[data-m="next"],input[name="m.review"],input[name="m.next"]');
    for (var i = 0; i < list.length; i++) {
      var e = list[i], v = String(e.value || '').trim(); if (!v || e.closest('.toolbar,.obr')) continue;
      var lab = '';
      if (e.labels && e.labels.length) lab = e.labels[0].textContent;
      if (!lab) { var p = e.closest('div,td,label'); var l = p && (p.querySelector('label') || (p.previousElementSibling && p.previousElementSibling.tagName === 'TH' ? p.previousElementSibling : null)); lab = l ? l.textContent : (e.getAttribute('aria-label') || e.placeholder || ''); }
      lab = String(lab).replace(/\s+/g, ' ').trim();
      if (!/review|target date|due|next|re-survey|follow-up/i.test(lab)) continue;
      if (/^(date|date written|date signed|date of birth|dob)$/i.test(lab)) continue;
      if (/\b(started|completed|updated|last reviewed|record reviewed)\b/i.test(lab) || lab.length > 60) continue;   /* v21.87 the date something was done is not a deadline; a table's whole header row is not a label */
      if (!/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(v)) continue;   /* a text field named next ("Next target") is not a date */
      var k = lab + '|' + v; if (seen[k]) continue; seen[k] = 1;
      out.push({ what: lab.replace(/\s*\(.*?\)\s*$/, '').slice(0, 60).trim(), date: v });
    }
    return out;
  };
  C.out = function(){
    var o = null; try { o = window.__nbhFactsOut ? window.__nbhFactsOut() : null; } catch(e) { o = null; }
    var d = C.due(); if (d && d.length) { o = o || {}; o.due = d; }
    return o;
  };
  C.apply = function(f){
    if (!f || typeof f !== 'object') return null;
    C.facts = f; var rep = null;
    try { if (window.__nbhFactsIn) rep = window.__nbhFactsIn(f); } catch(e) { rep = { error: String(e) }; }
    if (!rep) rep = C.generic(f, false);
    /* v22.45 (review F464, I231) the parent or guardian Form DM-1 names (the contact who holds the rights, else the first parent
       listed) goes into a form's empty parent name box (IC-1's consent); a text box only */
    try { var hm = f.profile && f.profile.home, pb = document.querySelectorAll('input[name="c.parent"]');
      if (hm && hm.name) for (var pi = 0; pi < pb.length; pi++) { if (!/^(text|)$/.test(pb[pi].type || '') && pb[pi].type !== 'text') continue; if (!String(pb[pi].value || '').trim()) { pb[pi].value = hm.name; pb[pi].dispatchEvent(new Event('input', { bubbles: true })); pb[pi].dispatchEvent(new Event('change', { bubbles: true })); if (rep && typeof rep.filled === 'number') rep.filled++; } } } catch(e) {}
    C.last = rep; C.paint(); try { C.paintConsent(); } catch(e) {} return rep;
  };

  /* ---- the toolbar group and the picker ---- */
  function summary(f){
    var bits = [];
    if (f.behaviors && f.behaviors.length) bits.push(f.behaviors.length + (f.behaviors.length === 1 ? ' behavior' : ' behaviors'));
    if (f.fn && (f.fn.key || f.fn.label)) bits.push(f.fn.key || f.fn.label);
    var g = f.goals || {}, gn = (g.red || []).length + (g.acq || []).length;
    if (gn) bits.push(gn + (gn === 1 ? ' goal' : ' goals'));
    if (f.menu && f.menu.length) bits.push(f.menu.length + ' reinforcers');
    return bits.join(' · ');
  }
  function srcLine(f){
    var s = f.src || {}, parts = [];
    if (f.behaviors && f.behaviors.length) parts.push('target behaviors from Form ' + (s.behaviors || 'TB-1'));
    if (f.fn && (f.fn.key || f.fn.label)) parts.push('function from Form ' + (s.fn || 'FS-1'));
    var g = f.goals || {}; if ((g.red || []).length || (g.acq || []).length) parts.push('goals from Form ' + (s.goals || 'GB-1'));
    if (f.menu && f.menu.length) parts.push('reinforcer menu from Form ' + (s.menu || 'PA-1'));
    return parts.join(' · ');
  }
  C.paint = function(){
    var grp = q('.nbh-case-grp');
    if (!grp) {
      var TITLE = 'Target behaviors, function, goals and reinforcers carried from the other forms of this case';
      var tb = q('.toolbar');
      if (tb) {
        grp = document.createElement('div'); grp.className = 'tgroup tg-keep nbh-case-grp';
        grp.innerHTML = '<span>The case</span><div class="row"><button type="button" id="nbhCaseBtn" title="' + TITLE + '">From the case</button></div>';
        tb.appendChild(grp);
      } else {
        /* the older forms keep their buttons in a .nbh-actions row (or beside the simulation button) */
        var sim = q('#simBtn,#btnSim,#load-demo,#btnLoadExample');
        var host = q('.nbh-actions') || (sim && sim.parentElement);
        if (!host) return;
        grp = document.createElement('span'); grp.className = 'nbh-case-grp';
        grp.innerHTML = '<button type="button" id="nbhCaseBtn" class="' + (sim ? sim.className : 'tool nbh-btn nbh-btn-secondary') + '" title="' + TITLE + '">From the case</button>';
        host.appendChild(grp);
      }
      grp.querySelector('#nbhCaseBtn').addEventListener('click', C.open);
    }
    var f = C.facts, ok = C.has(f);
    grp.hidden = !ok;
    if (ok) { var b = grp.querySelector('#nbhCaseBtn'); b.textContent = 'From the case: ' + summary(f); b.classList.toggle('nbhc-on', !!(C.last && C.last.filled)); }
  };
  function dlg(){
    var d = q('#nbhCaseDlg');
    if (d) return d;
    d = document.createElement('dialog'); d.id = 'nbhCaseDlg'; d.setAttribute('aria-labelledby', 'nbhcTitle');
    d.innerHTML = '<div class="nbhc-h" id="nbhcTitle">From the case<div class="nbhc-src" id="nbhcSrc"></div></div>' +
      '<div class="nbhc-b" id="nbhcBody"></div><div class="nbhc-done" id="nbhcDone" hidden></div>' +
      '<div class="nbhc-f"><span class="nbhc-note" id="nbhcNote"></span>' +
      '<button type="button" id="nbhcCopy">Copy as text</button>' +
      '<button type="button" class="primary" id="nbhcUse">Use the ticked items here</button>' +
      '<button type="button" id="nbhcClose">Close</button></div>';
    document.body.appendChild(d);
    d.querySelector('#nbhcClose').addEventListener('click', function(){ d.close(); });
    d.querySelector('#nbhcUse').addEventListener('click', C.useTicked);
    d.querySelector('#nbhcCopy').addEventListener('click', function(){
      var t = C.asText(C.facts);
      var done = function(){ var e = q('#nbhcDone'); e.hidden = false; e.textContent = 'Copied: paste it where it belongs.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function(){ window.prompt('Copy this text:', t); });
      else window.prompt('Copy this text:', t);
    });
    return d;
  }
  function item(kind, i, title, sub, checked){
    return '<label><input type="checkbox" data-kind="' + kind + '" data-i="' + i + '"' + (checked ? ' checked' : '') + '><span><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></label>';
  }
  C.open = function(){
    var f = C.facts; if (!C.has(f)) return;
    var d = dlg(), h = '';
    q('#nbhcSrc').textContent = srcLine(f) + (f.when ? ' · read ' + new Date(f.when).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : '');
    if (f.behaviors && f.behaviors.length) {
      h += '<div class="nbhc-s"><h4>Target behaviors</h4>' + f.behaviors.map(function(b, i){
        var sub = [b.type, b.fn, b.dim].filter(Boolean).join(' · ');
        return item('beh', i, b.label, (b.def ? b.def + (sub ? ' — ' : '') : '') + sub + (b.rep ? ' · replacement: ' + b.rep : ''), i === 0);
      }).join('') + '</div>';
    }
    if (f.fn && (f.fn.key || f.fn.label)) {
      h += '<div class="nbhc-s"><h4>Function</h4>' + item('fn', 0, f.fn.label || f.fn.key, (f.fn.statements || []).join(' '), true) + '</div>';
    }
    var g = f.goals || {};
    if ((g.red || []).length || (g.acq || []).length) {
      h += '<div class="nbhc-s"><h4>Goals and objectives</h4>' +
        (g.red || []).map(function(r, i){ return item('red', i, 'Reduce: ' + r.beh, r.text); }).join('') +
        (g.acq || []).map(function(a, i){ return item('acq', i, 'Teach: ' + a.beh, a.text); }).join('') + '</div>';
    }
    if (f.menu && f.menu.length) {
      h += '<div class="nbhc-s"><h4>Reinforcer menu, in rank order</h4>' + f.menu.map(function(m, i){
        var sub = [m.tier ? m.tier + (m.tier === 'HP' ? ' (high preference)' : m.tier === 'MP' ? ' (middle)' : ' (low)') : 'not yet ranked', m.type, m.mean != null ? 'mean rank ' + Number(m.mean).toFixed(1) + ' across ' + m.methods + (m.methods === 1 ? ' method' : ' methods') : ''].filter(Boolean).join(' · ');
        return item('menu', i, (m.rank ? m.rank + '. ' : '') + m.name, sub, m.tier === 'HP');
      }).join('') + '</div>';
    }
    q('#nbhcBody').innerHTML = h || '<div class="nbhc-empty">Nothing has been read yet.</div>';
    q('#nbhcDone').hidden = true;
    q('#nbhcNote').textContent = window.__nbhFactsPick ? 'The ticked items go into this form’s own rows and fields.' :
      (findField('beh') || findField('fn') ? 'The first ticked behavior and the function go into this form’s behavior and function fields.' : 'This form has no field for these; copy the text instead.');
    q('#nbhcUse').hidden = !(window.__nbhFactsPick || findField('beh') || findField('fn'));
    d.showModal();
  };
  C.selection = function(){
    var f = C.facts || {}, sel = { behaviors: [], goals: { red: [], acq: [] }, menu: [], fn: null, facts: f };
    Array.prototype.forEach.call(document.querySelectorAll('#nbhcBody input:checked'), function(cb){
      var i = +cb.dataset.i, k = cb.dataset.kind;
      if (k === 'beh') sel.behaviors.push(f.behaviors[i]);
      else if (k === 'fn') sel.fn = f.fn;
      else if (k === 'red') sel.goals.red.push(f.goals.red[i]);
      else if (k === 'acq') sel.goals.acq.push(f.goals.acq[i]);
      else if (k === 'menu') sel.menu.push(f.menu[i]);
    });
    return sel;
  };
  C.useTicked = function(){
    var sel = C.selection(), rep = null;
    try {
      if (window.__nbhFactsPick) rep = window.__nbhFactsPick(sel);
      else rep = C.generic({ behaviors: sel.behaviors, fn: sel.fn }, true);
    } catch(e) { rep = { error: String(e) }; }
    var e = q('#nbhcDone'); e.hidden = false;
    e.textContent = rep && rep.error ? 'Could not place them: ' + rep.error :
      rep && rep.filled ? 'Placed ' + rep.filled + (rep.filled === 1 ? ' item' : ' items') + ' on this form.' + (rep.note ? ' ' + rep.note : '') :
      'Nothing to place: ' + ((rep && rep.note) || 'the matching fields already hold a value, or nothing was ticked.');
    C.last = rep; C.paint();
  };
  C.asText = function(f){
    if (!f) return '';
    var L = [];
    (f.behaviors || []).forEach(function(b, i){ L.push('Target behavior ' + (i + 1) + ': ' + b.label + (b.def ? '\n  Definition: ' + b.def : '') + (b.ex ? '\n  Examples: ' + b.ex.replace(/\n/g, '; ') : '') + (b.nex ? '\n  Non-examples: ' + b.nex.replace(/\n/g, '; ') : '') + (b.fn ? '\n  Hypothesized function: ' + b.fn : '') + (b.rep ? '\n  Replacement: ' + b.rep : '')); });
    if (f.fn && (f.fn.label || f.fn.key)) L.push('Function: ' + (f.fn.label || f.fn.key) + ((f.fn.statements || []).length ? '\n  ' + f.fn.statements.join('\n  ') : ''));
    var g = f.goals || {};
    (g.red || []).forEach(function(r, i){ L.push('Reduction objective ' + (i + 1) + ': ' + r.text); });
    (g.acq || []).forEach(function(a, i){ L.push('Acquisition objective ' + (i + 1) + ': ' + a.text); });
    if (f.menu && f.menu.length) L.push('Reinforcer menu: ' + f.menu.map(function(m){ return (m.rank ? m.rank + '. ' : '') + m.name + (m.tier ? ' (' + m.tier + ')' : ''); }).join('; '));
    return L.join('\n');
  };
  /* ---- v22.37 the consent on file (review F11, F41, I7, I234, I9) ----
     Form IC-1 hands the case its consent record: {state, on, method, kind, obtained, ended, exceptions, procs, covered,
     dec:{fa, ed, rec, sh, ij}, bip, date, parent}. A case saved before v22.37 holds only {date, parent}: read as on file
     when either date is there, as before. C.consent() gives every form the same reading; C.covers(p) says whether the
     procedure p (IC-1's part 2 keys: indirect, abc, scatter, daily, pref, reinf, arrange, fa, demand, var, bip, med) is
     consented to. An assessment form inside the workstation shows one line under its toolbar when consent is not on
     file, was declined or revoked, or does not cover what the form runs; on screen only. */
  function cFmt(d){ var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(d || '')); return m ? (+m[2]) + '/' + (+m[3]) + '/' + m[1] : String(d || ''); }
  C.consent = function(f){
    f = f || C.facts; var c = f && f.consent;
    if (!c || typeof c !== 'object') return { known:false, on:false, state:'Not in the case', date:'', word:'No consent on file in this case (Form IC-1)' };
    var legacy = !c.state, on = legacy ? !!(c.date || c.parent) : !!c.on;
    var state = legacy ? (on ? 'Current' : 'Not recorded') : String(c.state);
    var date = on ? (c.obtained || c.date || c.parent || '') : '', ended = c.ended || '';
    var word = on ? 'Consent on file' + (date ? ' since ' + cFmt(date) : '') + (c.exceptions ? ', with exceptions: ' + c.exceptions : '') + ' (Form IC-1)'
      : state === 'Declined' ? 'Consent declined' + (ended ? ' on ' + cFmt(ended) : '') + ' (Form IC-1)'
      : state === 'Revoked' ? 'Consent revoked' + (ended ? ' on ' + cFmt(ended) : '') + ' (Form IC-1)'
      : state === 'Pending' ? 'Consent pending: no response from the parent yet (Form IC-1)'
      : state === 'Decision not recorded' ? 'Consent not established: the parent’s decision is not recorded (Form IC-1)'
      : 'No consent on file (Form IC-1)';
    return { known:true, legacy:legacy, on:on, state:state, date:date, ended:ended, kind:c.kind || '', exceptions:c.exceptions || '',
      covered: Array.isArray(c.covered) ? c.covered : null, dec: c.dec || {}, bip: c.bip || '', word:word };
  };
  C.covers = function(p, f){ var k = C.consent(f); if (!k.on) return false; return !k.covered || k.covered.indexOf(p) >= 0; };
  var CONSENT_FORMS = { 'OB-1':['abc','direct observation'], 'ABC-1':['abc','ABC recording'], 'SP-1':['scatter','the scatter plot'],
    'IA-1':['indirect','interviews and rating scales'], 'IN-1':['indirect','interviews'], 'SI-1':['indirect','the student interview'],
    'EA-1':['fa','the experimental analysis'], 'DA-1':['demand','the demand assessment'], 'AD-1':['arrange','the reinforcer arrangement comparison'],
    'PA-1':['pref','the preference assessment'], 'RA-1':['reinf','the reinforcer assessment'], 'VI-1':['var','the analysis of specific variables'] };
  /* the session runners show the consent line when it is on file too, with the limits the parent set (I9) */
  var RUNNERS = { 'EA-1':1, 'DA-1':1, 'AD-1':1, 'PA-1':1, 'RA-1':1 };
  C.formId = function(){ var m = /Form\s+([A-Z]{2,3}-\d)/.exec(document.title || ''); return m ? m[1] : ''; };
  C.consentLine = function(id, f){
    var F = CONSENT_FORMS[id || C.formId()]; if (!F) return null;
    var k = C.consent(f);
    if (!k.on) return { kind: (k.state === 'Declined' || k.state === 'Revoked') ? 'bad' : 'warn',
      text: k.word + (k.state === 'Declined' || k.state === 'Revoked' ? '. Stop any assessment that is not part of the current IEP.' : '. Nothing is assessed until consent is on file.') };
    if (!C.covers(F[0], f)) return { kind:'bad', text:'Form IC-1 does not cover ' + F[1] + (k.exceptions ? ' (consent with exceptions: ' + k.exceptions + ')' : '') + '. Do not run it unless the parent consents to it.' };
    if (!RUNNERS[id || C.formId()]) return null;
    var ed = (k.dec && k.dec.ed) || {}, food = '';
    if (/^(PA-1|RA-1)$/.test(id || C.formId())) food = ed.dec === 'yes' ? ' Food items approved: ' + (ed.items || 'items not listed') + (ed.allergy ? '; allergies or diet: ' + ed.allergy : '') + (ed.limits ? '; limits: ' + ed.limits : '') + '.'
      : ed.dec === 'no' ? ' No food or drink items (the parent said no).' : ed.dec === 'na' ? ' Food items were not proposed: none without a new decision.' : ' The food-item decision is not recorded: no edibles until it is.';
    return { kind: food && ed.dec !== 'yes' ? 'warn' : 'ok', text: k.word + '.' + food };
  };
  C.paintConsent = function(){
    var id = C.formId(); if (!CONSENT_FORMS[id] || !C.facts) return;
    if (!q('#nbh-consent-css')) { var st = document.createElement('style'); st.id = 'nbh-consent-css';
      st.textContent = '.nbh-consent{margin:6px 0 8px;padding:7px 12px;border-radius:6px;font:13px/1.4 var(--sans,system-ui,sans-serif);border:1px solid #e3c98f;background:#fff8e8;color:#5b4310}' +
        '.nbh-consent.bad{border-color:#e2a6a6;background:#fdf0f0;color:#7a1f1f}.nbh-consent.ok{border-color:#cfe0d6;background:#f1f8f4;color:#1f5a3c}.nbh-consent b{font-weight:600}' +
        '@media print{.nbh-consent{display:none!important}}';
      document.head.appendChild(st); }
    var L = C.consentLine(id), n = q('#nbhConsent');
    if (!L) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('div'); n.id = 'nbhConsent'; n.setAttribute('role', 'status');
      var tb = q('.toolbar'); if (tb && tb.parentNode) tb.parentNode.insertBefore(n, tb.nextSibling); else document.body.insertBefore(n, document.body.firstChild); }
    n.className = 'nbh-consent ' + L.kind;
    n.innerHTML = '<b>' + (L.kind === 'ok' ? 'Consent' : 'Consent check') + ':</b> ' + esc(L.text);
  };
  /* v22.46 (I232) the plan's step list: Form TD-1 sends plan.steps ([{n, d, grp, comp, cmp, crit}], n the number on its
     printed plan) and plan.stepsRev, a fingerprint of the list. The forms that check and teach the plan (TI-1, ST-1)
     take it. C.planSteps(f): the list and its fingerprint, or null. C.stepsMerge(steps, maps, list): the form's steps
     made the plan's, in the plan's order, each with the plan's critical mark and component and its plan number (pn); a
     step whose words are unchanged keeps its codes (maps: the form's records keyed "step_column", renumbered here);
     a step no longer in the plan stays, at the end, when it holds codes or was written on the form itself, so nothing
     scored or typed is lost (gone: it left the plan). C.stepsBar(before, o) shows or clears the notice that offers the
     plan's list (o.kind 'offer') or says it has changed (o.kind 'changed'), with o.use and o.skip. */
  C.stepKey = function(d){ return String(d == null ? '' : d).trim().replace(/\s+/g, ' ').toLowerCase(); };
  C.planSteps = function(f){ f = f || C.facts; var p = f && f.plan,
      s = p && Array.isArray(p.steps) ? p.steps.filter(function(x){ return x && String(x.d || '').trim(); }) : [];
    return s.length ? { steps: s, rev: String(p.stepsRev || ''), crit: s.filter(function(x){ return x.crit; }).length } : null; };
  C.stepsMerge = function(steps, maps, list){
    var used = {}, from = {}, out = [], r = { kept: 0, added: 0, own: 0, gone: 0 };
    var held = function(i){ return maps.some(function(m){ return Object.keys(m).some(function(k){ return +k.split('_')[0] === i && !!m[k]; }); }); };
    list.forEach(function(p){ var k = C.stepKey(p.d), i = -1;
      steps.forEach(function(st, j){ if (i < 0 && !used[j] && st && C.stepKey(st.d) === k) i = j; });
      if (i >= 0) { used[i] = 1; from[i] = out.length; r.kept++; } else r.added++;
      out.push({ d: String(p.d).trim(), crit: !!p.crit, cmp: p.cmp === 'con' || p.cmp === 'ant' ? p.cmp : '', pn: +p.n || 0 }); });
    steps.forEach(function(st, j){ if (used[j] || !st) return; var t = String(st.d || '').trim(), h = held(j);
      if (!h && (!t || st.pn)) return;
      var o = {}; Object.keys(st).forEach(function(z){ o[z] = st[z]; });
      if (st.pn) { delete o.pn; o.gone = true; r.gone++; } else r.own++;
      from[j] = out.length; out.push(o); });
    r.steps = out;
    r.maps = maps.map(function(m){ var n = {}; Object.keys(m).forEach(function(k){ var p = k.split('_'), s = +p[0];
      if (from[s] !== undefined) n[from[s] + '_' + p.slice(1).join('_')] = m[k]; }); return n; });
    return r;
  };
  C.stepsMsg = function(r){ var L = [];
    if (r.kept) L.push(r.kept + ' step' + (r.kept === 1 ? '' : 's') + ' unchanged, with ' + (r.kept === 1 ? 'its' : 'their') + ' codes');
    if (r.added) L.push(r.added + ' new from the plan');
    if (r.own) L.push(r.own + ' of your own kept at the end');
    if (r.gone) L.push(r.gone + ' no longer in the plan kept at the end with ' + (r.gone === 1 ? 'its' : 'their') + ' codes');
    return L.join('; '); };
  C.stepsBar = function(before, o){
    var b = q('#nbhStepsBar');
    if (!o || !o.kind || !before) { if (b) b.remove(); return; }
    if (!q('#nbh-steps-css')) { var st = document.createElement('style'); st.id = 'nbh-steps-css';
      st.textContent = '.nbh-steps-bar{margin:6px 0 10px;padding:8px 12px;border-radius:6px;font:13px/1.45 var(--sans,system-ui,sans-serif);border:1px solid #e3c98f;background:#fff8e8;color:#5b4310}' +
        '.nbh-steps-bar b{font-weight:600}.nbh-steps-bar .nbh-sb-act{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}@media print{.nbh-steps-bar{display:none!important}}';
      document.head.appendChild(st); }
    if (!b) { b = document.createElement('div'); b.id = 'nbhStepsBar'; b.className = 'nbh-steps-bar'; b.setAttribute('role', 'status'); }
    if (b.nextSibling !== before) before.parentNode.insertBefore(b, before);
    var n = o.n + ' step' + (o.n === 1 ? '' : 's') + (o.crit ? ', ' + o.crit + ' critical' : '');
    b.innerHTML = o.kind === 'changed'
      ? '<b>The plan&rsquo;s steps changed.</b> Form TD-1&rsquo;s step list (' + esc(n) + ') is not the one this list was taken from. Update takes the plan&rsquo;s steps in its order; a step whose words did not change keeps its codes, and a step that holds codes or that you wrote here stays at the end.' +
        '<div class="nbh-sb-act"><button type="button" class="tool" data-sb="use">Update the steps</button><button type="button" class="tool" data-sb="skip">Not now</button></div>'
      : '<b>The plan&rsquo;s step list.</b> Form TD-1 has a step list for this plan (' + esc(n) + '). Use it to make this form&rsquo;s steps the plan&rsquo;s, in its order; a step here that holds codes or that you wrote stays at the end.' +
        '<div class="nbh-sb-act"><button type="button" class="tool" data-sb="use">Use the plan&rsquo;s steps</button><button type="button" class="tool" data-sb="skip">Not now</button></div>';
    b.onclick = function(e){ var a = e.target && e.target.getAttribute && e.target.getAttribute('data-sb'); if (a === 'use') o.use(); else if (a === 'skip') o.skip(); };
  };
  window.nbhCase = C;
  /* a form opened on its own, outside the workstation, has no case: the group stays hidden */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', C.paint); else C.paint();
})();
