/* v21.31 the case: hooks. Out: the stimulus pool in the Summary's order (mean rank across the direct
   methods completed, then the composite third of the pool), the same arithmetic as renderSummary. */
window.__nbhFactsOut=function(){
  try{
    const ss=ssStats(),ps=psStats().st,ms=msStats().st,fo=foStats();
    const rSS=rankMap(ss.filter(s=>s.trials).sort((a,b)=>(b.pa-a.pa)||((b.pe||0)-(a.pe||0))),'pa');
    const rPS=rankMap(ps.filter(s=>s.pres).sort((a,b)=>b.p-a.p),'p');
    const rMS=rankMap(ms.filter(s=>s.avail).sort((a,b)=>(b.p-a.p)||((a.mp||99)-(b.mp||99))),'p');
    const rFO=rankMap(fo.filter(s=>s.fon).sort((a,b)=>b.fp-a.fp),'fp');
    const rSD=rankMap(fo.filter(s=>s.sdn).sort((a,b)=>b.sp-a.sp),'sp');
    const rows=S.stim.map((s,i)=>{const rs=[rSS[i],rPS[i],rMS[i],rFO[i],rSD[i]].filter(v=>v!=null);const mean=rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:null;
      return {i,name:String(s.name||'').trim(),type:s.type,ir:s.rank,mean,k:rs.length};}).filter(r=>r.name);
    const withData=rows.filter(r=>r.mean!=null).sort((a,b)=>a.mean-b.mean);const third=S.n/3;
    const menu=[...withData,...rows.filter(r=>r.mean==null)].map(r=>{const pos=withData.indexOf(r);
      return {name:r.name,type:r.type,rank:r.mean==null?null:pos+1,tier:r.mean==null?'':pos<third?'HP':pos<2*third?'MP':'LP',mean:r.mean,methods:r.k,informant:r.ir,src:'PA-1'};});
    return menu.length?{menu}:null;
  }catch(e){return null;}
};
