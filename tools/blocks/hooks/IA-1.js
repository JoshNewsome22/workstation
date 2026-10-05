/* v21.31 the case: hooks for Form IA-1 (added by the enhancement sprint, package A2). In: the case fills what the
   general fill placed here before, except the function. The first target behavior goes into the empty "Target behavior"
   field (its label and definition, as before) when the form opens, when a case is reopened or restored, and whenever the
   case changes. "Indirect hypothesis carried to the packet" is this assessment's own result and is never filled from the
   case: the form's own rule fills it, while it is empty, from the category that leads the informants, and the assessor
   may choose another. Form FS-1's conclusion is drawn partly from this assessment, so writing it back here would show the
   summary as the indirect result, and the form's own rule would then keep it against its own scores. "From the case"
   places the first ticked behavior; its Function item is shown unticked and cannot be ticked on this form, and the
   picker's footnote and its answer say what is placed and what is not (a second behavior, the function, the goals and
   the reinforcers have no field here). Out: nothing. */
(function(){
  var FIELD = 'Target behavior';
  var WHY = 'Not placed on this form: the indirect hypothesis is this assessment’s own result (the category that leads its informants, or your choice).';
  var OFF = 'the function stays off this form, since the indirect hypothesis is this assessment’s own result';
  function cs(){ return window.nbhCase || null; }
  /* the kinds of item this form has no field for, in words */
  function others(goals, menu){ return goals && menu ? 'goals and reinforcers' : goals ? 'goals' : menu ? 'reinforcers' : ''; }
  /* always an object: a falsy answer would let the general fill place the function after all */
  window.__nbhFactsIn = function(f){
    var c = cs(); if (!c || !f) return { filled: 0 };
    return c.generic({ behaviors: f.behaviors || [] }, false);
  };
  window.__nbhFactsPick = function(sel){
    var c = cs(); if (!c || !sel) return { filled: 0 };
    var bs = sel.behaviors || [], g = sel.goals || {}, rep = c.generic({ behaviors: bs }, true), why = [];
    if (rep.filled && bs.length > 1) why.push('only the first ticked behavior was placed, since this form has one ' + FIELD + ' field');
    if (sel.fn) why.push(OFF);
    var o = others((g.red || []).length + (g.acq || []).length, (sel.menu || []).length);
    if (o) why.push('the ticked ' + o + ' have no field on this form');
    /* the shared answer reads "Placed 1 item on this form. <note>" or "Nothing to place: <note>" */
    if (why.length) { var t = why.join('; ') + '.'; rep.note = rep.filled ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
    return rep;
  };
  /* the picker opens on the button's own click; this runs after it, as the click reaches the document */
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('#nbhCaseBtn') : null; if (!b) return;
    var body = document.querySelector('#nbhcBody'), note = document.querySelector('#nbhcNote'), cb = body && body.querySelector('input[data-kind="fn"]');
    /* the footnote says what this form takes (the shared one, written for forms with rows of their own, says every
       ticked item goes in) */
    if (body && note) { var o = others(body.querySelector('input[data-kind="red"],input[data-kind="acq"]'), body.querySelector('input[data-kind="menu"]'));
      var t = body.querySelector('input[data-kind="beh"]') ? 'The first ticked behavior goes into this form’s ' + FIELD + ' field' + (cb ? '; the function stays off this form.' : '.')
        : cb ? 'The function stays off this form.' : '';
      note.textContent = t + (o ? (t ? ' ' : '') + 'The ' + o + ' have no field here; copy the text instead.' : ''); }
    if (!cb || cb.disabled) return;
    cb.checked = false; cb.disabled = true;
    /* the reason goes straight under the item's name, above Form FS-1's statements, which can run long */
    var sp = cb.nextElementSibling, nm = sp && sp.querySelector('b');
    if (sp) { var s = document.createElement('small'); s.className = 'nbhc-own'; s.style.cssText = 'color:#16242e;font-weight:600'; s.textContent = WHY;
      sp.insertBefore(s, nm ? nm.nextSibling : sp.firstChild); }
  });
})();
