/* Form CR-1, review Wave 3 part 3 (I175): what CR-1 knows, handed on. The changes each restraint's debriefing decided go to the
   case; Form PR-1 puts the open ones on its actions table once; Today names one due within a week or overdue, and the crisis
   plan's next review; the caseload calendar carries both; Form DM-1's empty crisis-plan status is filled from CR-1's plan and
   its dates. Simulated data only. usage: node qa/cr1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d;},iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),mdy=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
  /* ---- CR-1 sends the debriefings' changes ---- */
  const cr=await open(file('CR-1_'));await cr.evaluate(()=>document.getElementById('simBtn').click());await sleep(1200);
  const X=await cr.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.crisis;});
  const A=(X&&X.actions)||[];
  ok('1 I175 CR-1 sends each change its debriefings decided, with where it lands, who, by when, its status and the debriefing\'s date; "Nothing changes" is left out',
    A.length>=2&&A.every(a=>a.c&&a.w&&a.w!=='Nothing changes'&&'who' in a&&'by' in a&&'st' in a&&/^\d{4}-\d\d-\d\d$/.test(a.deb))&&new Set(A.map(a=>a.deb)).size>=2,A);
  /* ---- PR-1 ---- */
  const pr=await open(file('PR-1_'));
  const ACTS=[{c:'Add a break card to the math block (simulated)',w:'The BIP (Form TD-1)',who:'Jordan Ellis (simulated)',by:mdy(day(5)),st:'Open',deb:'2026-10-06'},
    {c:'Retrain the paraprofessional on the precursor step (simulated)',w:'Staff training (Form ST-1)',who:'Dana Whitfield (simulated)',by:'next week',st:'',deb:'2026-10-06'},
    {c:'Move the reading group away from the door (simulated)',w:'The environment',who:'',by:'',st:'Done',deb:'2026-10-13'},
    {c:'Change the bus seat (simulated)',w:'Staffing or schedule',who:'',by:'',st:'Not doing',deb:'2026-10-13'},
    {c:'Nothing more',w:'Nothing changes',who:'',by:'',st:'',deb:'2026-10-13'}];
  const p1=await pr.evaluate(A=>{const r=window.__nbhFactsIn({crisis:{src:'CR-1',actions:A}});return {r,act:S.act.filter(a=>a.a).map(a=>({a:a.a,f:a.f,w:a.w,b:a.b,s:a.s})),key:S.meta.crAct};},ACTS);
  ok('2 I175 PR-1 puts the open changes on its actions table: the words marked as from the debriefing, the form each lands on, who, by when; "Not doing" and "Nothing changes" are left out',
    p1.act.length===3&&p1.act[0].a==='Add a break card to the math block (simulated) (from the restraint debriefing of 10/6/2026, Form CR-1)'&&p1.act[0].f==='TD-1 (the plan)'&&p1.act[0].w==='Jordan Ellis (simulated)'&&p1.act[0].b===iso(day(5))&&p1.act[0].s==='Open'&&
    p1.act[1].a==='Retrain the paraprofessional on the precursor step (simulated), by next week (from the restraint debriefing of 10/6/2026, Form CR-1)'&&p1.act[1].f==='ST-1 (training)'&&p1.act[1].b===''&&
    p1.act[2].a==='Move the reading group away from the door (simulated) (the environment) (from the restraint debriefing of 10/13/2026, Form CR-1)'&&p1.act[2].f===''&&p1.act[2].s==='Done'&&/3 changes from the restraint debriefing/.test(p1.r.note),p1);
  const p2=await pr.evaluate(A=>{const r=window.__nbhFactsIn({crisis:{src:'CR-1',actions:A}});const n1=S.act.filter(a=>a.a).length;
    const i=S.act.findIndex(a=>/^Add a break card/.test(a.a));S.act.splice(i,1);renderAct();const r2=window.__nbhFactsIn({crisis:{src:'CR-1',actions:A}});return {n1,n2:S.act.filter(a=>a.a).length,r,r2};},ACTS);
  ok('3 I175 a second pass adds nothing, and a change deleted from the table is not brought back',p2.n1===3&&p2.n2===2&&!/restraint debriefing/.test((p2.r&&p2.r.note)||'')&&!/restraint debriefing/.test((p2.r2&&p2.r2.note)||''),p2);
  const p3=await pr.evaluate(()=>{const t=document.querySelector('#actTbl tbody').textContent;return {rows:document.querySelectorAll('#actTbl tbody tr').length,txt:[...document.querySelectorAll('#actTbl textarea')].map(e=>e.value).filter(Boolean)};});
  ok('4 I175 the table on screen shows them',p3.txt.some(t=>/^Retrain the paraprofessional/.test(t)),p3);
  /* ---- DM-1 ---- */
  const dm=await open(file('DM-1_'));
  const st=async(X,was)=>dm.evaluate(([X,was])=>{const e=document.querySelector('[name="p.crisis"]');e.value=was||'';const r=window.__nbhFactsIn({crisis:X});return {v:e.value,note:(r&&r.note)||''};},[X,was]);
  const stg=[{s:'Calm',do:'Praise (simulated)',who:'Teacher'}];
  const d1=await st({src:'CR-1',stages:stg,planDate:iso(day(-30))}),d2=await st({src:'CR-1',stages:stg,planDate:iso(day(-30)),revNext:iso(day(-2))}),d3=await st({src:'CR-1',stages:stg,planDate:iso(day(-400))}),
    d4=await st({src:'CR-1',stages:stg}),d5=await st({src:'CR-1',stages:[],planDate:iso(day(-30))});
  ok('5 I175 DM-1\'s crisis-plan status reads CR-1\'s own dates: current while dated within the year and the next review not past, outdated otherwise (saying why); an undated plan reads current as before; no stages, left',
    d1.v==='Yes, current'&&d1.note.includes('crisis plan: Yes, current (Form CR-1 holds a plan of 1 stage, dated '+mdy(day(-30))+')')&&d2.v==='Yes, outdated'&&d2.note.includes('its next review was due '+mdy(day(-2)))&&
    d3.v==='Yes, outdated'&&d3.note.includes('last dated or reviewed '+mdy(day(-400)))&&d4.v==='Yes, current'&&d5.v==='',{d1,d2,d3,d4,d5});
  const d6=await st({src:'CR-1',stages:stg,planDate:iso(day(-30))},'No'),d7=await st({src:'CR-1',stages:stg,planDate:iso(day(-400))},'Yes, current'),d8=await st({src:'CR-1',stages:stg,planDate:iso(day(-30))},'Yes, outdated'),
    d9=await st({src:'CR-1',stages:stg},'Yes, outdated');
  ok('6 I175 a dated CR-1 corrects a Yes answer that disagrees; an undated one leaves it; No becomes Yes as before',d6.v==='Yes, current'&&d7.v==='Yes, outdated'&&d8.v==='Yes, current'&&d9.v==='Yes, outdated',{d6,d7,d8,d9});
  /* ---- Today and the calendar ---- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const T=await sh.evaluate(([rn,b1,b2,b3])=>{const f={crisis:{src:'CR-1',stages:[{s:'Calm',do:'x'}],revNext:rn,actions:[
      {c:'Add a break card to the math block (simulated)',w:'The BIP (Form TD-1)',by:b1,st:'Open',deb:'2026-10-06'},
      {c:'Retrain the paraprofessional (simulated)',w:'Staff training (Form ST-1)',by:b2,st:'',deb:'2026-10-06'},
      {c:'Done already (simulated)',w:'This crisis plan',by:b2,st:'Done',deb:'2026-10-06'},
      {c:'Later (simulated)',w:'This crisis plan',by:b3,st:'Open',deb:'2026-10-06'}]}};
    return {today:tdSafety(f).map(x=>({k:x.k,t:x.t.replace(/<[^>]+>/g,''),open:x.open})),cal:calEvents(f).filter(e=>e.form&&/Crisis plan review|restraint debriefing/.test(e.what))};},[mdy(day(6)),mdy(day(3)),mdy(day(-2)),mdy(day(20))]);
  const tt=T.today.filter(x=>/crisis plan’s review|restraint debriefing/.test(x.t));
  ok('7 I175 Today names the crisis plan\'s review two weeks ahead, and a change not done due within a week or overdue, opening the form it lands on (CR-1 when that form is not in the case)',
    tt.length===3&&tt.some(x=>x.k==='Timeline'&&/^The crisis plan’s review \(Form CR-1\) is due /.test(x.t)&&x.open==='CR-1')&&tt.some(x=>x.k==='Safety'&&/^Add a break card to the math block \(simulated\) \(The BIP \(Form TD-1\)\): decided at the restraint debriefing of 10\/6, due /.test(x.t))&&
    tt.some(x=>x.k==='Overdue'&&/^Retrain the paraprofessional/.test(x.t))&&!tt.some(x=>/Done already|Later/.test(x.t)),T.today);
  ok('8 I175 the caseload calendar carries the review and the open changes with dates, in plain words',T.cal.length===4&&T.cal.filter(e=>e.what==='Crisis plan review').length===1&&T.cal.some(e=>e.form==='TD-1')&&T.cal.some(e=>e.form==='ST-1')&&!T.cal.some(e=>/simulated/.test(e.what)),T.cal);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
