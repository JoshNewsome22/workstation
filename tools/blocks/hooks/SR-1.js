
/* v21.31 the case: hooks. The schedule's behavior, its short name, the alternative response, the
   function and the reinforcer come from the case when their fields are empty; the picker replaces them. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const b=(f.behaviors||[])[0],a=((f.goals&&f.goals.acq)||[])[0];
  if(b){if(!m.beh){m.beh=nbhCase.line(b,true);n++;}if(!m.behs){m.behs=b.label;n++;}if(!m.alt&&b.rep){m.alt=b.rep;n++;}}
  const rp=(f.behaviors||[]).find(x=>x.isRep);
  if(!m.alt&&(a||rp)){m.alt=a?a.beh:rp.label;n++;}
  if(!m.func&&f.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),f.fn.key||f.fn.label);if(v){m.func=v;n++;}}
  if(!m.sr&&(f.menu||[]).length){m.sr=nbhCase.menuLine(f.menu,3)+' (Form PA-1)';n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const b=sel.behaviors[0],a=sel.goals.acq[0];
  if(b){m.beh=nbhCase.line(b,true);m.behs=b.label;if(b.rep)m.alt=b.rep;n++;}
  if(a){m.alt=a.beh;n++;}
  if(sel.fn){const v=nbhCase.optionFor(document.querySelector('[data-m="func"]'),sel.fn.key||sel.fn.label);if(v){m.func=v;n++;}}
  if(sel.menu.length){m.sr=sel.menu.map(x=>x.name).join(', ')+' (Form PA-1)';m.srs=sel.menu[0].name;n++;}
  renderAll();return {filled:n};
};
