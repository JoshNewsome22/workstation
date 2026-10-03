
/* v21.31 the case: hooks. The program's skill, goal and discriminative stimulus come from the first
   acquisition objective on Form GB-1 (or the paired replacement named on Form TB-1), and the reinforcer
   line from the ranked menu on Form PA-1; the picker puts a chosen objective or behavior in their place. */
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;const acq=((f.goals&&f.goals.acq)||[])[0],b=(f.behaviors||[])[0];
  if(acq){if(!m.skill){m.skill=acq.beh;n++;}if(!m.goal){m.goal='Form GB-1 acquisition objective: '+acq.text;n++;}if(!m.sd&&acq.cond){m.sd=acq.cond;n++;}}
  else if(b&&b.rep&&!m.skill){m.skill=b.rep;n++;}
  if(!m.reinforcer&&(f.menu||[]).length){m.reinforcer=nbhCase.menuLine(f.menu,3)+' (ranked on Form PA-1)';n++;}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const acq=sel.goals.acq[0],b=sel.behaviors[0];
  if(acq){m.skill=acq.beh;m.goal='Form GB-1 acquisition objective: '+acq.text;if(acq.cond)m.sd=acq.cond;n++;}
  else if(b){m.skill=b.rep||b.label;if(b.def&&!b.rep)m.def=b.def;n++;}
  if(sel.menu.length){m.reinforcer=sel.menu.map(x=>x.name).join('; ')+' (ranked on Form PA-1)';n++;}
  renderAll();return {filled:n};
};
