/* v21.31 the case: hooks. (v21.52) Out: the crisis plan's behavior, its earliest precursor and its stages (what is done at
   each, and who), for Form TV-1's draft. */
window.__nbhFactsOut=function(){
  try{
    const m=S.meta||{},t=v=>String(v==null?'':v).trim();
    const stages=(S.pbis||[]).filter(r=>r&&t(r.s)&&t(r.do)).map(r=>({s:t(r.s),do:t(r.do),who:t(r.who)}));
    const crisis={beh:t(m.dbeh),precursor:t(m.precursor),stages,src:'CR-1'};
    return crisis.beh||stages.length?{crisis}:null;
  }catch(e){return null;}
};
