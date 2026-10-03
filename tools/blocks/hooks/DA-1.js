
/* v21.31 the case: hooks. The target behavior line takes the first behavior from Form TB-1 with its
   definition, and the hypothesis line the summary statement from Form FS-1. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const b=(f.behaviors||[])[0];
  if(!m.target&&b){m.target=nbhCase.line(b,true);n++;}
  if(!m.hyp&&f.fn&&(f.fn.label||f.fn.key)){m.hyp=(f.fn.statements&&f.fn.statements[0])||f.fn.label;n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;
  if(sel.behaviors.length){m.target=sel.behaviors.map(b=>nbhCase.line(b,true)).join('; ');n++;}
  if(sel.fn){m.hyp=(sel.fn.statements&&sel.fn.statements[0])||sel.fn.label;n++;}
  renderAll();return {filled:n};
};
