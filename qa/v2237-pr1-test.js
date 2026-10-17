/* v22.37 Form PR-1's decisions (review F318, F319, F322, F323). Results by Target never fills a decision from the case (the
   suggestion stays beside an empty box) and suggests nothing without integrity; a target's suggestion uses the overall
   test (the plan-run gate, Form TI-1's criterion, the replacement); fading waits for the target's aim, or with no aim a 90%
   reduction; a decision goes to the case only when a person chose it, and the IEP packet says "suggested" otherwise and
   prints the team's decision. The import reads TI-1's own verdict (an announced observation never counts) and counts only
   the period's observations when its dates are set. Simulated people only.
   usage: node qa/v2237-pr1-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const beh=aimMet=>({data:{behaviors:[{name:'Hitting peers',kind:'target',unit:'per day',direction:'decrease',base:{mean:4.75},cur:{mean:1.67,days:12},aim:1,aimMet}]},plan:{targets:[{label:'Hitting peers'}]}});
const TI=(obs,crit)=>({form:'TI-1',S:{nObs:4,critN:2,crit:crit||90,meta:{client:'Mateo Rivera',int:'Dana Whitfield'},steps:[{crit:true,cmp:''},{crit:false,cmp:''},{crit:false,cmp:''},{crit:false,cmp:''}],
  obs:obs.map(o=>({type:o.t,date:o.d})),cells:Object.assign({},...obs.map((o,j)=>{const c={};for(let i=0;i<4;i++)c[i+'_'+j]=i<o.c?'C':'EO';return c;}))}});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PR-1: '+e.message));await p.goto(L.BASE+'/NBH-Workstation/PR-1_Periodic-Plan-Review_v2026-09.html');await sleep(900);
  const row=()=>p.evaluate(()=>{const tr=document.querySelector('#pr83Tbl tbody tr[data-k]');return tr?{dec:tr.querySelector('select').value,sug:tr.querySelector('.pr83-sug').textContent,out:(window.__nbhFactsOut()||{}).review}:null;});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[k,v]);
  await p.evaluate(c=>window.__nbhFactsIn(c),beh(false));await sleep(200);
  let r=await row();
  ok('1 from the case: the decision box stays empty; no suggestion without integrity',r&&r.dec===''&&/No suggestion: integrity not recorded/.test(r.sug),r);
  await setM('intPct','95');await sleep(150);r=await row();
  ok('2 integrity 95%, 65% below baseline but not at the aim: suggested continue (not yet at its aim), not fade',r.dec===''&&/Suggested: continue \(not yet at its aim/.test(r.sug),r);
  ok('3 nothing chosen: the case gets no decision for the target, only the suggestion',r.out&&r.out.targets[0].decision===''&&r.out.targets[0].suggested==='continue',r.out);
  await p.evaluate(c=>window.__nbhFactsIn(c),beh(true));await sleep(150);r=await row();
  ok('4 at its aim (Form DD-1): suggested fade',/Suggested: fade/.test(r.sug),r);
  await setM('intMet','not met');await setM('intMetTxt','the last 2 unannounced: 75%, 100%, against 90%');await sleep(150);r=await row();
  ok('5 Form TI-1’s criterion not met: the target is suggested continue, address implementation',/Suggested: continue \(the period does not pass the plan-run gate/.test(r.sug),r);
  await setM('intMet','');await sleep(100);
  await p.evaluate(()=>{const s=document.querySelector('#pr83Tbl select');s.value='fade';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(100);r=await row();
  ok('6 a person chooses Fade: it goes to the case as the decision',r.out.targets[0].decision==='fade',r.out);
  /* the overall suggestion */
  const sug=()=>p.evaluate(()=>document.getElementById('decSuggest').textContent);
  await p.evaluate(()=>{S.rows[0].t='4.75';S.rows[1].t='1.67';renderAll();});await p.evaluate(c=>window.__nbhFactsIn(c),beh(false));await setM('intPct','95');await sleep(200);
  let o=await sug();ok('7 overall: 65% below baseline, the aim not met: continue unchanged; fading waits for the plan’s criterion',/continue unchanged; fading waits/.test(o)&&/Hitting peers/.test(o),o.slice(0,300));
  await p.evaluate(c=>window.__nbhFactsIn(c),beh(true));await setM('intPct','95');await sleep(200);o=await sug();
  ok('8 overall, every target at its aim: begin fading',/Suggested: begin fading/.test(o),o.slice(0,200));
  await setM('intMet','not decidable');await setM('intMetTxt','1 of the 2 unannounced observations Form TI-1 asks for are scored');await sleep(150);
  const v=await p.evaluate(()=>document.getElementById('intVerdict').textContent);o=await sug();
  ok('9 TI-1 cannot judge yet: the gate says so, and the suggestion is to address implementation',/Form TI-1 cannot judge the plan yet/.test(v)&&/continue and address implementation/.test(o),{v:v.slice(0,300)});
  /* the import */
  const ti=await p.evaluate(([a,b,c])=>({a:tiRead(a).fig,b:tiRead(b).fig,c:tiRead(c,'2026-09-25','2026-10-12').fig}),
    [TI([{t:'Unannounced',d:'2026-09-29',c:3},{t:'Unannounced',d:'2026-10-08',c:4}]),TI([{t:'Announced',d:'2026-10-08',c:4}]),TI([{t:'Unannounced',d:'2026-05-20',c:1},{t:'Unannounced',d:'2026-09-29',c:4},{t:'Unannounced',d:'2026-10-08',c:4}])]);
  ok('10 TI-1’s own verdict: 75% then 100% unannounced is not met; one announced observation cannot be judged',ti.a.intMet==='not met'&&/75%, 100%/.test(ti.a.intMetTxt)&&ti.b.intMet==='not decidable',ti);
  ok('11 the period’s dates set: an observation before the period is not counted in its figures',ti.c.intN==='2'&&ti.c.intMean==='100'&&/1 observation outside the period not counted/.test(ti.c.intImpl)&&ti.c.intMet==='met',ti.c);
  /* the IEP packet */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const prog=await sh.evaluate(()=>{state.facts={review:{decision:'continue',decisionText:'Continue unchanged',targets:[{name:'Hitting peers',base:4.75,cur:1.67,chg:-64.8,decision:'',suggested:'continue'}]}};return iepParts().prog;});
  ok('12 the IEP packet: the target’s line says "suggested, not yet decided" and the team’s decision is printed',/suggested: continue, not yet decided/.test(prog)&&/The team’s decision: Continue unchanged/.test(prog),prog);
  ok('13 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
