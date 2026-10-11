/* v21.85 the shell reads Form CN-1's service log: the case carries service {log, week, month, iep}; Today says when the
   IEP's service minutes are behind for the part of the week or month gone (and not before half of it has gone); the IEP
   meeting packet states the minutes the IEP gives and what the log holds. Simulated student only.
   usage: WS_URL=http://127.0.0.1:8155 node qa/v2185-svc-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(()=>openForm('CN-1'));await page.waitForFunction(()=>!!state.status['CN-1'],null,{timeout:30000});await sleep(800);
  const fr=page.frames().find(f=>/CN-1_Consultation/.test(f.url()));
  await fr.evaluate(async()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;await loadSim();});await sleep(500);
  const f1=await page.evaluate(async()=>{await gatherFacts(false);const f=state.facts||{};return {src:(f.src||{}).service,n:((f.service||{}).log||[]).length,iep:(f.service||{}).iep||null,month:!!(f.service||{}).month};});
  ok('1 the case carries Form CN-1’s service log: the entries, the month and the IEP minutes',f1.src==='CN-1'&&f1.n>=3&&f1.month&&f1.iep&&f1.iep.minutes===120&&f1.iep.per==='month',f1);
  const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const items=(done,from,to)=>page.evaluate(([done,from,to])=>{const sf=state.facts;try{state.facts={service:{log:[],month:{from,to,direct:0,consult:done,total:done},iep:{minutes:120,per:'month',kind:'consult',done,line:done+' of 120 minutes this month'}}};
    return todayItems().filter(x=>x.k==='Service').map(x=>x.t);}finally{state.facts=sf;}},[done,from,to]);
  const a=await items(10,iso(-20),iso(5)),b=await items(100,iso(-20),iso(5)),c=await items(0,iso(-2),iso(25));
  ok('2a Today: 10 of 120 minutes with most of the month gone says the minutes are behind, with about how many by now',a.length===1&&/IEP service minutes behind: 10 of 120 minutes this month on Form CN-1 \(about \d+ by now\)/.test(a[0]),a);
  ok('2b on pace, or less than half the month gone: nothing',!b.length&&!c.length,{b,c});
  const P=await page.evaluate(()=>({svc:iepParts().svc,html:iepHTML()}));
  ok('3a the IEP packet states the minutes the IEP gives and what the log holds',/The IEP gives 120 minutes a month of behavior consultation\./.test(P.svc)&&/Logged on Form CN-1: \d+ of 120 minutes this month\./.test(P.svc),P.svc);
  ok('3b the printed packet has a Behavior services part',/<h2>Behavior services<\/h2>/.test(P.html));
  await page.evaluate(()=>iepOpen());await sleep(400);
  ok('3c the packet dialog has the part, with Copy',await page.evaluate(()=>!!document.getElementById('iepSvc')&&!!document.querySelector('[data-copy="iepSvc"]')));
  const caseload=await page.evaluate(()=>CL_ORDER.indexOf('Service')>CL_ORDER.indexOf('Home')&&CL_ORDER.indexOf('Service')<CL_ORDER.indexOf('Data'));
  ok('4 the caseload ranks service minutes after home notices and before data',caseload);
  ok('no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
