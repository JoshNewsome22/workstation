/* v25.67 (the BCBA, 11/6): Form IM-1 reads the decision on photos for the record from Form IC-1 (Specific procedures E,
   dec.ij.photo) when its own "Consent to photograph injuries" is still blank; a hand answer stays; revoked consent reads No.
   Simulated data only. */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IM=L.BASE+'/NBH-Workstation/IM-1_Self-Injury-Trauma-and-Injury-Monitoring_v2026-10.html';
const IC=L.BASE+'/NBH-Workstation/IC-1_Informed-Consent-FBA-BIP_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  /* IC-1: the new line, and the record it hands the case */
  const c=await ctx.newPage();c.on('pageerror',e=>errs.push('IC-1: '+e.message));await c.goto(IC);await sleep(1000);
  const ic=await c.evaluate(()=>{const s=document.querySelector('select[name="ij.photo"]');if(!s)return {none:true};
    const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));};
    const m=document.querySelector('[name="c.method"]');if(m){const o=[...(m.options||[])].find(o=>o.value);set('c.method',o?o.value:'initial');}
    set('ij.dec','yes');set('ij.photo','yes');set('ij.date','2026-09-12');
    let f=null;try{f=window.__nbhFactsOut();}catch(x){f={err:String(x)};}
    return {opts:[...s.options].map(o=>o.value),inE:!!s.closest('.card')&&/Checking for injuries/.test(s.closest('.card').textContent),ij:f&&f.consent&&f.consent.dec&&f.consent.dec.ij,err:f&&f.err};});
  ok('1 IC-1 has the photo decision in Specific procedures E',!ic.none&&ic.inE&&ic.opts.join()===',yes,no',ic);
  ok('2 IC-1 hands the photo decision to the case (dec.ij.photo)',ic.ij&&ic.ij.photo==='yes',ic);
  /* IC-1's home procedures are counted on their own line; the school count keeps its "of 14" */
  const hm=await c.evaluate(async()=>{const box=()=>(document.getElementById('stProcHome')||{}).textContent||'';const a=box();
    ['p.homeData','p.homeVideo'].forEach(n=>{const e=document.querySelector('[name="'+n+'"]');e.checked=true;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));});
    await new Promise(r=>setTimeout(r,400));return {a,b:box(),sub:(document.getElementById('stProcSub')||{}).textContent||''};});
  ok('2b IC-1 counts the home procedures apart: none ticked, then 2 ticked and not covered without consent',/none of 3 ticked/.test(hm.a)&&/Home: 0 of 3 covered \(2 ticked/.test(hm.b)&&!/of 17/.test(hm.sub),hm);

  /* IM-1: reading it */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('IM-1: '+e.message));await p.goto(IM);await sleep(1000);
  const run=(meta,cons)=>p.evaluate(([meta,cons])=>{S=blank();Object.assign(S.meta,meta);renderAll();
    const r=window.__nbhFactsIn({consent:cons});const sel=document.getElementById('v65PhCons');
    return {pc:S.meta.photoConsent||'',from:S.meta.photoConsentFrom||'',line:v65phCons(),why:v65phWhy(),sel:sel?sel.value:null,note:r&&r.note};},[meta,cons]);
  const on={state:'Current',on:true,obtained:'2026-09-12',dec:{ij:{dec:'yes',photo:'yes',date:'2026-09-12'}}};
  let a=await run({client:'SIMULATED – Sample Student'},on);
  ok('3 a Yes on IC-1 fills "Yes, on Form IC-1" with the date',a.pc==='ic1'&&/9\/12\/2026/.test(a.line)&&a.sel==='ic1',a);
  ok('4 photos can then be added',a.why==='',a);
  a=await run({},{...on,dec:{ij:{dec:'yes',photo:'',date:'2026-09-12'}}});
  ok('5 no photo decision on IC-1 leaves the answer blank',a.pc===''&&/cannot be added until/.test(a.why),a);
  a=await run({},{...on,dec:{ij:{dec:'yes',photo:'no',date:'2026-09-12'}}});
  ok('6 a No on IC-1 reads No',a.pc==='no',a);
  a=await run({},{state:'Revoked',on:false,ended:'2026-10-20',dec:{ij:{dec:'yes',photo:'yes',date:'2026-09-12'}}});
  ok('7 revoked consent reads No',a.pc==='no'&&/revoked/.test(a.from),a);
  a=await run({},{...on,dec:{ij:{dec:'no',photo:'yes',date:'2026-09-12'}}});
  ok('8 photos Yes but injury checks No reads No',a.pc==='no',a);
  a=await run({photoConsent:'other'},on);
  ok('9 a hand answer is never overwritten',a.pc==='other'&&a.from==='',a);
  /* a hand change drops the IC-1 date */
  await run({},on);
  const h=await p.evaluate(()=>{const s=document.getElementById('v65PhCons');s.value='other';s.dispatchEvent(new Event('change',{bubbles:true}));
    s.value='ic1';s.dispatchEvent(new Event('change',{bubbles:true}));return {pc:S.meta.photoConsent,from:S.meta.photoConsentFrom||'',line:v65phCons()};});
  ok('10 changing the answer by hand drops the IC-1 date',h.pc==='ic1'&&h.from===''&&!/2026/.test(h.line),h);
  /* a case without IC-1, and a file saved before */
  a=await run({},null);
  ok('11 no IC-1 in the case: unchanged',a.pc==='',a);
  const old=await p.evaluate(()=>{S=blank();renderAll();return {pc:S.meta.photoConsent||'',from:'photoConsentFrom' in S.meta};});
  ok('12 a fresh or older file has no IC-1 date',old.pc===''&&!old.from,old);
  ok('13 no page errors',errs.length===0,errs);
 }catch(e){ok('run',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
