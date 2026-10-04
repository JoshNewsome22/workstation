/* v21.31 the case: hooks for Form IA-1 (added by the enhancement sprint, package A2). In: the case fills what the
   general fill placed here before, except the function. The first target behavior goes into the empty "Target behavior"
   field (its label and definition, as before) when the form opens, when a case is reopened or restored, and whenever the
   case changes. "Indirect hypothesis carried to the packet" is this assessment's own result and is never filled from the
   case: the form's own rule fills it, while it is empty, from the category that leads the informants, and the assessor
   may choose another. Form FS-1's conclusion is drawn partly from this assessment, so writing it back here would show the
   summary as the indirect result, and the form's own rule would then keep it against its own scores. "From the case"
   places the ticked behavior; its Function item is shown unticked and cannot be ticked on this form. Out: nothing. */
(function(){
  var WHY = 'Not placed on this form: the indirect hypothesis is this assessment’s own result (the category that leads its informants, or your choice).';
  function cs(){ return window.nbhCase || null; }
  /* always an object: a falsy answer would let the general fill place the function after all */
  window.__nbhFactsIn = function(f){
    var c = cs(); if (!c || !f) return { filled: 0 };
    return c.generic({ behaviors: f.behaviors || [] }, false);
  };
  window.__nbhFactsPick = function(sel){
    var c = cs(); if (!c || !sel) return { filled: 0 };
    var rep = c.generic({ behaviors: sel.behaviors || [] }, true);
    if (sel.fn) rep.note = rep.filled ? 'The function was not placed: the indirect hypothesis is this assessment’s own result.'
      : 'the function stays off this form: the indirect hypothesis is this assessment’s own result.';
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
