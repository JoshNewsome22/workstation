/* v22.43 replacement-skill progress (review F462, I233). PR-1's results by target add a row for each replacement skill Form DD-1
   records, judged against its goal (DD-1's aim, else a number in GB-1's acquisition criterion in DD-1's own unit), and the review
   does not suggest fading while one is below its goal; the IEP packet names the replacement and its goal; the parent note credits a
   skill taught up from 0. Simulated people only. usage: node qa/v2243-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const DATA=(aim,cur)=>({behaviors:[
  {name:'Aggression toward staff (simulated)',kind:'target',direction:'decrease',unit:'per day',base:{mean:4,days:10},cur:{mean:1,days:12}},
  {name:'Mand for break (simulated)',kind:'replacement',direction:'increase',unit:'per day',base:{mean:0.25,days:10},cur:{mean:cur,days:12},aim}]});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const run=async(f)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PR-1: '+e.message));await p.goto(L.BASE+'/NBH-Workstation/PR-1_Periodic-Plan-Review_v2026-09.html');await sleep(900);
    const r=await p.evaluate(f=>{__nbhFactsIn(f);const rows=pr83Tg().map(x=>({x,o:pr83Read(x)}));const out=__nbhFactsOut();pr83Render();
      return {rows:rows.map(z=>({name:z.x.name,kind:z.x.kind,goal:z.x.goal,src:z.x.goalSrc,rule:z.o.rule,state:z.o.state,sug:z.o.sug,why:z.o.why})),targets:out&&out.review&&out.review.targets,html:document.getElementById('pr83Tbl').textContent};},f);
    await p.close();return r;};
  const a=await run({data:DATA(8,5),goals:{acq:[{beh:'Mand for break (simulated)',crit:'at least 5 requests a day'}]}});
  const ra=a.rows.find(z=>z.kind==='rep');
  ok('1 the replacement skill gets its own row, judged against its goal (Form DD-1’s aim first)',ra&&ra.goal==='8'&&/Below goal: now 5 against the goal of 8/.test(ra.rule)&&ra.state==='not met',a.rows);
  ok('2 the reduction target keeps its row and its rule',a.rows.some(z=>!z.kind&&/Aggression/.test(z.name)&&/Met: /.test(z.rule)),a.rows);
  ok('3 the case carries the replacement row with its kind and goal',Array.isArray(a.targets)&&a.targets.some(t=>t.kind==='rep'&&t.goal===8&&t.cur===5),a.targets);
  ok('4 the table names it a replacement skill with its goal',/Replacement skill, goal 8/.test(a.html),a.html.slice(0,400));
  const b=await run({data:DATA(null,5),goals:{acq:[{beh:'Mand for break (simulated)',crit:'at least 5 requests a day'}]}});
  const rb=b.rows.find(z=>z.kind==='rep');
  ok('5 with no aim, the goal comes from Form GB-1’s criterion in the same unit; at goal reads met',rb&&rb.goal==='5'&&/Form GB-1/.test(rb.src)&&rb.state==='met'&&/At goal/.test(rb.rule),rb);
  const c=await run({data:DATA(null,5),goals:{acq:[{beh:'Mand for break (simulated)',crit:'independently in at least 80% of opportunities'}]}});
  const rc=c.rows.find(z=>z.kind==='rep');
  ok('6 a percentage goal against a count is not judged, and the row says why',rc&&!rc.goal&&rc.state==='not judged'&&/not what Form DD-1 records/.test(rc.rule),rc);
  /* the workstation: the IEP packet and the parent note */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const s=await sh.evaluate(t=>{state.facts={review:{targets:t},data:{behaviors:[{name:'Mand for break (simulated)',kind:'replacement',direction:'increase',unit:'per day',base:{mean:0},cur:{mean:4}}]}};
    let iep='';try{iep=JSON.stringify(iepParts());}catch(e){iep='ERR '+e.message;}let hn='';try{hn=JSON.stringify(hnParts());}catch(e){hn='ERR '+e.message;}return {iep,hn};},a.targets);
  ok('7 the IEP packet names the replacement skill and whether it is at its goal',/Replacement skill, Mand for break \(simulated\): 0\.25 → 5 \(goal 8: not yet\)/.test(s.iep),s.iep.slice(0,600));
  ok('8 the parent note credits a skill taught up from 0',/Mand for break/.test(s.hn)&&/"good":"[^"]+"/.test(s.hn),s.hn.slice(0,600));
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  ok('9 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
