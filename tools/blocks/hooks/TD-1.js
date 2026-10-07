/* v21.31 the case: hooks. (v21.52) Out: the plan this form developed, for Form TV-1's draft: the target and replacement
   behaviors, the antecedent arrangements (the Antecedent sheet and the cards before sessions), the teaching and the
   reinforcement (the cards and the schedule), and the response to the precursor and to the behavior. */
window.__nbhFactsOut=function(){
  try{
    const g=n=>{const e=document.querySelector('[name="'+n+'"]');return e?String(e.value||'').trim():'';};
    /* the cards on the page (each its code and its name), sorted as the form's own groups sort them */
    const G=[['SAFE','A_SETEVENT','A_PROX','A_SEAT','A_RAPPORT','A_NCA','A_PRESESS','A_EXERCISE','A_SCHEDULE','A_PRIME','A_HIGHP','A_INTERSPERSE','A_PACE','CURR','CHOICE','DF','NCE','NCR','EE','SEXT','EFFORT','GRP_CON','C_CSA','C_ACSA','RRB_ECS','RRB_PROD','C_HELMET','C_SR','C_MEDREF','SOCIAL','TANG','EDIBLE','DIST'],
      ['FCT','FCT_CFA','DRA','DRI','DNRA','DRAAUTO','RRB_PE','TA_CHAIN','SHAPE','VIDMOD','SCRIPT','PEER','RELAX','SBT_FCR','SBT_TR','SBT_CAB','ECM','DT_PROG','SC_TRAIN','MAND_CONT','MAND_NET','MAND_XFER','SAYDO','VBMAPP','EFL','AFLS','PEAK'],[],
      ['S_CRF','S_FR','S_VR','S_RR','S_FI','S_VI','S_DRL','S_DRH','S_MULT','S_MIX','S_CHAIN','S_TAND','S_CONC','S_CONJ','S_SO','S_ALT','S_CONJUNC','S_INTL','S_PR','S_LAG','DRO']];
    const cs=Array.from(document.querySelectorAll('#compWrap .card')).map(c=>({code:c.dataset.code,name:((c.querySelector('.chdt')||{}).textContent||'').trim()})).filter(c=>c.name);
    const grp=j=>cs.filter(c=>G[j].includes(c.code)).map(c=>c.name);
    const plan={beh:g('m.beh'),fn:g('m.fn'),rep:g('m.repdesc'),reinf:g('m.reinf'),pref:g('m.pref'),prec:g('m.prec'),
      ant:['ant.pos','ant.seat','ant.att','ant.se'].map(g).filter(Boolean),antCards:grp(0),teach:grp(1),sched:grp(3),prompted:g('pr.reinf'),
      respond:{prec:g('rb.prec'),target:g('rb.target'),after:g('rb.after'),not:g('rb.not'),crisis:g('rb.crisis')},src:'TD-1'};
    const any=plan.beh||plan.rep||plan.ant.length||plan.antCards.length||plan.teach.length||Object.values(plan.respond).some(Boolean);
    return any?{plan}:null;
  }catch(e){return null;}
};
