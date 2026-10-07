/* v21.31 the case: hooks. (v21.52) Out: the person-centred profile (strengths, interests, how the student communicates and
   signals, what helps and what to avoid, assistive technology), for Form TV-1's draft. */
window.__nbhFactsOut=function(){
  try{
    const g=n=>{const e=document.querySelector('[name="'+n+'"]');return e?String(e.value||'').trim():'';};
    const p={strengths:g('pf.strengths'),interests:g('pf.interests'),expr:g('pf.expr'),recep:g('pf.recep'),lit:g('pf.lit'),signals:g('pf.signals'),helps:g('pf.helps'),avoid:g('pf.avoid'),at:g('p.at'),src:'DM-1'};
    return Object.keys(p).some(k=>k!=='src'&&p[k])?{profile:p}:null;
  }catch(e){return null;}
};
