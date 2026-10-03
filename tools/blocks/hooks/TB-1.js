/* v21.31 the case: hooks. The target behaviors defined on sheet 4 (or, before sheet 4 is written, the
   candidates marked Target on sheet 1) are what the other forms of this case receive. */
window.__nbhFactsOut=function(){
  const key=s=>window.nbhCase?window.nbhCase.fnKeyOf(s):'';
  const out=[];const n=+(($('#nTgt')||{}).value)||0;
  for(let t=0;t<n;t++){const g=k=>val(`tgt[${t}].${k}`);const lab=g('lab');if(!lab)continue;
    const isRep=/replacement|alternative/i.test(g('type')),rep=isRep||/^\s*([\u2014\u2013-]|see\b|this is\b|n\/a\b)/i.test(g('rep'))?'':g('rep');
    out.push({label:lab,def:g('def'),ex:g('ex'),nex:g('nex'),type:g('type'),isRep,fn:g('fn'),fnKey:key(g('fn')),dim:g('dim'),unit:g('unit'),
      rep,ctx:g('ctx'),urg:g('urg'),tops:g('tops'),excl:g('excl'),src:'TB-1'});}
  if(!out.length){for(let i=0;i<candN;i++){const g=k=>val(`cand[${i}].${k}`);const beh=g('beh');if(!beh||!/^Target/.test(g('dec')))continue;
    out.push({label:beh,def:'',rate:g('rate'),type:g('dec').replace(/^Target\s*[–-]\s*/,''),urg:g('urg'),src:'TB-1 (candidate)'});}}
  return out.length?{behaviors:out}:null;
};
