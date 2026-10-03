
/* v21.31 the case: hooks. The "primary target and goal" line is composed from the first behavior on
   Form TB-1 and the reduction objective on Form GB-1 that names it. */
function nbhCnGoalLine(behs,red){
  const b=behs[0];const l=b?b.label.toLowerCase():'';
  const r=red.find(x=>x.beh&&l&&(x.beh.toLowerCase().indexOf(l.slice(0,12))>=0||l.indexOf(x.beh.toLowerCase().slice(0,12))>=0))||(!b&&red[0])||null;
  if(!b&&!r)return '';
  return (b?b.label:r.beh)+(r&&r.tgt?'; goal: no '+(r.ml||'more')+' than '+r.tgt+(r.crit?' over '+r.crit+' consecutive measurements':'')+' (Form GB-1)':'');
}
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;
  if(!m.goal){const t=nbhCnGoalLine(f.behaviors||[],(f.goals&&f.goals.red)||[]);if(t){m.goal=t;n++;}}
  if(n)renderAll();return {filled:n};
};
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const t=nbhCnGoalLine(sel.behaviors,sel.goals.red);if(t){m.goal=t;n++;}
  if(n)renderAll();return {filled:n};
};
