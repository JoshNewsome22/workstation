/* Form SR-1, review Wave 3 part 2: the designed schedule goes to the case, and Form RM-1's challenge results with it (I136, F326).
   SR-1 and RM-1 on their own, then through the shell: the case holds both and names them; Form PR-1 fills the terminal schedule
   and the relapse row; Form TD-1 names the schedule beside its ladder, fills an FCT card's thinning fields and carries the
   schedule into the BIP. Simulated data only. usage: node qa/sr1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const stub=()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}};
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(800);await p.evaluate(stub);return p;};
  /* ---- SR-1 on its own ---- */
  const p=await open(file('SR-1_'));
  const blankOut=await p.evaluate(()=>window.__nbhFactsOut());
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  const o1=await p.evaluate(()=>window.__nbhFactsOut());
  ok('1 I136 a blank SR-1 sends nothing; the worked example sends its DRO: notation, rule, steps from the first to the terminal one, criteria, review date',
    blankOut===null&&o1&&o1.schedule&&o1.schedule.src==='SR-1'&&o1.schedule.id==='dro'&&o1.schedule.nota==='DRO 110 s (resetting)'&&/^Start the timer/.test(o1.schedule.rule)&&!/[<>]/.test(o1.schedule.rule)
    &&o1.schedule.steps.length===9&&o1.schedule.terminal==='15 min'&&!!o1.schedule.start&&o1.schedule.review==='2026-10-16'&&!!o1.schedule.crit&&o1.schedule.beh==='calling out'&&!('earn' in o1.schedule),o1);
  await p.evaluate(()=>{S.meta.ds_sel='thin';renderAll();});const o2=await p.evaluate(()=>window.__nbhFactsOut());
  ok('2 I136 a multiple schedule sends both components of its terminal step and the step-back rule',o2.schedule.id==='thin'&&o2.schedule.terminal==='S+ 60 s; S− 4 min'&&o2.schedule.start===o2.schedule.steps[0].what&&/^S\+ 60 s; S− 0\b/.test(o2.schedule.start)&&/^problem behavior above 20% of baseline/.test(o2.schedule.back||''),o2.schedule);
  /* ---- RM-1 on its own ---- */
  const r=await open(file('RM-1_'));
  const rBlank=await r.evaluate(()=>window.__nbhFactsOut());
  await r.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const o3=await r.evaluate(()=>{const o=window.__nbhFactsOut(),n=S.ch.filter(c=>scoreCh(c).ok).length,k=S.ch.filter(c=>{const s=scoreCh(c);return s.ok&&s.rel;}).length;return {o,n,k};});
  ok('3 F326 a blank RM-1 sends nothing; the worked example sends each scored challenge and one line for the plan review',
    rBlank===null&&o3.o&&o3.o.relapse.n===o3.n&&o3.o.relapse.rel===o3.k&&o3.o.relapse.list.length===o3.n&&new RegExp('^'+o3.k+' of '+o3.n+' challenges showed relapse').test(o3.o.relapse.line)&&/\(Form RM-1\)$/.test(o3.o.relapse.line),o3);
  /* ---- through the shell ---- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  const fr=async id=>{await sh.evaluate(id=>openForm(id),id);const h=await sh.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:9000});await sleep(1300);const f=await h.contentFrame();await f.evaluate(stub);return f;};
  const sim=async id=>{const f=await fr(id);await f.evaluate(()=>document.querySelector('#simBtn').click());await sleep(900);return f;};
  for(const id of ['TB-1','FS-1'])await sim(id);
  const sr=await sim('SR-1');await sr.evaluate(()=>{S.meta.ds_sel='thin';renderAll();});
  await sim('RM-1');
  await sleep(7000);
  const F=await sh.evaluate(()=>({s:state.facts&&state.facts.schedule,r:state.facts&&state.facts.relapse,src:state.facts&&state.facts.src,bar:document.getElementById('factsTxt').textContent}));
  ok('4 I136/F326 the case holds the schedule from SR-1 and the challenges from RM-1, and the case bar names both',
    F.s&&F.s.id==='thin'&&F.r&&F.r.n===o3.n&&F.src.schedule==='SR-1'&&F.src.relapse==='RM-1'&&/Schedule: mult FR 1/.test(F.bar)&&new RegExp('Challenges: '+o3.k+' of '+o3.n+' with relapse').test(F.bar),{s:F.s&&F.s.id,r:F.r&&F.r.n,src:F.src,bar:F.bar});
  const pr=await fr('PR-1');await sleep(1500);
  const P=await pr.evaluate(()=>({term:S.meta.repTerm||'',rel:S.meta.relapse||'',sched:S.meta.repSched||'',hint:(document.getElementById('prSchedSrc')||{}).textContent||'',hid:(document.getElementById('prSchedSrc')||{}).hidden}));
  ok('5 F326 PR-1 fills the terminal schedule from SR-1 and the relapse row from RM-1; the current schedule is left for the reviewer, with the design named',
    P.term==='S+ 60 s; S− 4 min (Form SR-1: '+F.s.nota+')'&&P.rel===F.r.line&&P.sched===''&&P.hid===false&&/^Form SR-1’s design: mult FR 1.*Write the step in force from the card\.$/.test(P.hint),P);
  const td=await fr('TD-1');await sleep(1500);
  const T=await td.evaluate(async()=>{const note=document.getElementById('tdSrNote');const m=document.getElementById('addComp');m.value='FCT';document.getElementById('addCompBtn').click();await new Promise(r=>setTimeout(r,300));
    const c=document.querySelector('#compWrap .card[data-code="FCT"]'),i=c&&c.dataset.i,g=k=>(document.querySelector('[name="cp['+i+'].p'+k+'"]')||{}).value;
    return {hid:note.hidden,note:note.textContent,thin:g(4),term:g(5)};});
  /* the BIP, on TD-1 opened on its own and given the case the shell holds */
  await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:L.BASE});
  const tb=await open(file('TD-1_'));await tb.evaluate(s=>window.__nbhFactsIn({schedule:s}),F.s);
  await tb.evaluate(()=>document.getElementById('bipBtn').click());await sleep(500);T.bip=await tb.evaluate(()=>navigator.clipboard.readText());
  const at=T.bip.indexOf('REINFORCEMENT SCHEDULE (FORM SR-1)'),lad=T.bip.indexOf('REINFORCEMENT THINNING LADDER'),sec=at<0?'':T.bip.slice(at).split('\n\n')[0];
  ok('6 I136 TD-1 names the schedule beside its ladder and fills a new FCT card\'s empty thinning tactic and terminal schedule from it',
    T.hid===false&&/^Form SR-1 holds the schedule card: mult FR 1.*, from S\+ 60 s; S− 0.* to S\+ 60 s; S− 4 min\. Staff run the card/.test(T.note)&&T.thin===F.s.nota+' (Form SR-1)'&&T.term==='S+ 60 s; S− 4 min (Form SR-1)',{hid:T.hid,note:T.note,thin:T.thin,term:T.term});
  ok('7 I136 the BIP carries the schedule after the thinning ladder: notation, rule, the steps from first to terminal, the criteria and the review',
    at>0&&(lad<0||at>lad)&&/^Schedule: mult FR 1/m.test(sec)&&/^Rule: Show the S\+ signal/m.test(sec)&&/^From: S\+ 60 s; S− 0.* to S\+ 60 s; S− 4 min, in 6 steps$/m.test(sec)&&/^Step up when: /m.test(sec)&&/^Card review: 2026-10-16$/m.test(sec),sec||T.bip.slice(0,600));
  ok('8 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
