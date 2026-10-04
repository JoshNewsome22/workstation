/* v21.31 the case: hooks for Form IN-1 (added by the enhancement sprint, package A2). In: the case fills what the
   general fill placed here before, except the function. The first target behavior goes into the empty "Problem behavior"
   field (its label and definition, as before) when the form opens, when a case is reopened or restored, and whenever the
   case changes. "Interview hypothesis carried to the packet" is the interviewer's own choice, from the comparison table
   and the synthesis, and is never filled from the case. Form FS-1's conclusion is drawn partly from these interviews, so
   writing it back here would show the summary as the interviews' result. "From the case" places the ticked behavior; its
   Function item is shown unticked and cannot be ticked on this form. Out: nothing. */
(function(){
  var WHY = 'Not placed on this form: the interview hypothesis is your own choice, from the interviews and the synthesis.';
  function cs(){ return window.nbhCase || null; }
  /* always an object: a falsy answer would let the general fill place the function after all */
  window.__nbhFactsIn = function(f){
    var c = cs(); if (!c || !f) return { filled: 0 };
    return c.generic({ behaviors: f.behaviors || [] }, false);
  };
  window.__nbhFactsPick = function(sel){
    var c = cs(); if (!c || !sel) return { filled: 0 };
    var rep = c.generic({ behaviors: sel.behaviors || [] }, true);
    if (sel.fn) rep.note = rep.filled ? 'The function was not placed: the interview hypothesis is your own choice.'
      : 'the function stays off this form: the interview hypothesis is your own choice.';
    return rep;
  };
  /* the picker opens on the button's own click; this runs after it, as the click reaches the document */
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('#nbhCaseBtn') : null; if (!b) return;
    var cb = document.querySelector('#nbhcBody input[data-kind="fn"]'); if (!cb || cb.disabled) return;
    cb.checked = false; cb.disabled = true;
    /* the reason goes straight under the item's name, above Form FS-1's statements, which can run long */
    var sp = cb.nextElementSibling, nm = sp && sp.querySelector('b');
    if (sp) { var s = document.createElement('small'); s.className = 'nbhc-own'; s.style.cssText = 'color:#16242e;font-weight:600'; s.textContent = WHY;
      sp.insertBefore(s, nm ? nm.nextSibling : sp.firstChild); }
  });
})();
