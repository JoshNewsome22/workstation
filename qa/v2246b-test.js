/* v22.46 the plan's step list in the forms that check and teach the plan (review I232). Form TI-1 and Form ST-1 take
   Form TD-1's step list into an empty list, offer it to a list already started, and say when it has changed; Update
   keeps the codes of every step whose words did not change and keeps a scored or hand-written step at the end. TI-1
   sends the steps missed on its deciding observations; Form PR-1 names them and Form PD-1 starts its concern from them.
   Form TV-1's rehearsal steps are the plan's list. Simulated case only. usage: node qa/v2246b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const ST=(n,d,crit,cmp)=>({n,d,grp:'Responding to the precursor and the target behavior',comp:'',cmp,crit});
const PLAN1={beh:'Hitting (simulated)',src:'TD-1',stepsRev:'rev1',steps:[
  ST(25,'Reinforce every break request with a 1-minute break (simulated)',true,'con'),
  ST(63,'Positioning: stay at least 5 ft away during independent work (simulated)',false,'ant'),
  ST(69,'On the precursor: prompt the break card at the first scream (simulated)',true,'con'),
  ST(70,'On the target behavior: keep the task in place; no break (simulated)',true,'con'),
  ST(72,'Staff do not: no comments about the behavior (simulated)',true,'con')]};
const PLAN2={beh:'Hitting (simulated)',src:'TD-1',stepsRev:'rev2',steps:[
  ST(25,'Reinforce every break request with a 1-minute break (simulated)',true,'con'),
  ST(60,'Seating: desk at the end of the row, near the door (simulated)',false,'ant'),
  ST(69,'On the precursor: prompt the break card at the first scream (simulated)',true,'con'),
  ST(70,'On the target behavior: keep the task in place and the break card in view; no break (simulated)',true,'con')]};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const open=async(id,file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(900);return p;};
  /* ---- TI-1 ---- */
  const t=await open('TI-1','TI-1_Treatment-Integrity-Observation_v2026-09.html');
  const a=await t.evaluate(plan=>{__nbhFactsIn({plan,quick:{rules:[{do:'Praise the break card (simulated)'}]}});
    return {steps:S.steps.map(s=>({d:s.d,crit:s.crit,cmp:s.cmp,pn:s.pn})),plan:S.plan,bar:!!document.getElementById('nbhStepsBar')};},PLAN1);
  ok('1 an empty checklist takes the plan’s steps (before the Quick Start’s), with the critical marks, components and plan numbers',a.steps.length===5&&a.steps[0].pn===25&&a.steps[0].crit&&a.steps[0].cmp==='con'&&a.steps[1].cmp==='ant'&&!a.steps[1].crit&&a.plan&&a.plan.rev==='rev1'&&!a.bar&&!a.steps.some(s=>/Praise the break card/.test(s.d)),a);
  /* four observations scored: the last two unannounced; step 5 (Staff do not) and step 4 with errors */
  const b=await t.evaluate(plan=>{S.obs.forEach((o,j)=>{o.date='2026-10-0'+(j+1);o.type=j<2?'Announced':'Unannounced';});
    S.steps.forEach((_,i)=>S.obs.forEach((_,j)=>{S.cells[i+'_'+j]='C';}));S.cells['3_3']='EC';S.cells['4_2']='EO';S.cells['4_3']='EO';S.cells['1_3']='EO';renderAll();
    const out=__nbhFactsOut();__nbhFactsIn({plan});const bar=document.getElementById('nbhStepsBar');
    return {missed:out&&out.integrity&&out.integrity.missed,planRev:out&&out.integrity&&out.integrity.planRev,bar:bar&&bar.textContent};},PLAN2);
  ok('2 TI-1 sends the steps missed on its deciding observations, with their plan numbers, critical first',Array.isArray(b.missed)&&b.missed.length===3&&b.missed.some(m=>m.pn===70&&m.ec===1&&m.crit)&&b.missed.some(m=>m.pn===72&&m.eo===2)&&b.missed.some(m=>m.pn===63)&&b.planRev==='rev1',b);
  ok('3 when the plan’s list changes, the checklist says so and offers Update',/The plan.s steps changed/.test(b.bar||'')&&/Update the steps/.test(b.bar||''),b.bar);
  const c=await t.evaluate(()=>{document.querySelector('#nbhStepsBar [data-sb="use"]').click();
    return {steps:S.steps.map(s=>({d:s.d,pn:s.pn,gone:!!s.gone,crit:s.crit})),cells:Object.assign({},S.cells),plan:S.plan,bar:!!document.getElementById('nbhStepsBar'),marks:[...document.querySelectorAll('#stepTbl .nbh-pn')].map(x=>x.textContent)};});
  const idx=re=>c.steps.findIndex(s=>re.test(s.d));
  const iR=idx(/^Reinforce every/),iS=idx(/^Seating/),iP=idx(/^On the precursor/),iT=idx(/keep the task in place and the break card/),iPos=idx(/^Positioning/),iOld=idx(/place; no break/),iDo=idx(/^Staff do not/);
  ok('4 Update: the plan’s steps in its order; unchanged steps keep their codes; the new and reworded steps start with none',iR===0&&iS===1&&iP===2&&iT===3&&c.cells[iR+'_3']==='C'&&c.cells[iP+'_0']==='C'&&!Object.keys(c.cells).some(k=>k.startsWith(iS+'_')||k.startsWith(iT+'_'))&&c.plan.rev==='rev2'&&!c.bar,{c,iR,iS,iP,iT});
  ok('5 Update: steps that left the plan but hold codes stay at the end with their codes',iPos>3&&iOld>3&&iDo>3&&c.steps[iDo].gone&&c.cells[iDo+'_3']==='EO'&&c.cells[iOld+'_3']==='EC'&&c.cells[iPos+'_3']==='EO'&&c.steps.length===7&&c.marks[0]==='Plan step 25 (Form TD-1)'&&c.marks.filter(m=>/No longer in the plan/.test(m)).length===3,{steps:c.steps,marks:c.marks});
  /* a list written by hand is offered the plan's list; Not now sets it aside */
  const t2=await open('TI-1b','TI-1_Treatment-Integrity-Observation_v2026-09.html');
  const d=await t2.evaluate(plan=>{S.steps[0].d='Greets the student at the door (simulated)';renderAll();__nbhFactsIn({plan});const b1=document.getElementById('nbhStepsBar');const r={offer:b1&&b1.textContent};
    document.querySelector('#nbhStepsBar [data-sb="skip"]').click();r.after=!!document.getElementById('nbhStepsBar');r.skip=S.plan&&S.plan.skip;
    __nbhFactsIn({plan});r.again=!!document.getElementById('nbhStepsBar');
    S.plan={};__nbhFactsIn({plan});document.querySelector('#nbhStepsBar [data-sb="use"]').click();r.steps=S.steps.map(s=>s.d);return r;},PLAN2);
  ok('6 a list written here is offered the plan’s; Not now sets this version aside',/Use the plan.s steps/.test(d.offer||'')&&!d.after&&d.skip==='rev2'&&!d.again,d);
  ok('7 Use the plan’s steps keeps a step written here at the end',d.steps.length===5&&/^Greets the student/.test(d.steps[4])&&/^Reinforce every/.test(d.steps[0]),d.steps);
  /* ---- ST-1 ---- */
  const s=await open('ST-1','ST-1_Behavior-Skills-Training_v2026-09.html');
  const e=await s.evaluate(plan=>{__nbhFactsIn({plan,training:{steps:[{d:'A step from the video script (simulated)',crit:false,cmp:'ant'}]}});return {steps:S.steps.map(x=>[x.d,x.crit,x.pn]),rev:S.plan&&S.plan.rev};},PLAN1);
  ok('8 ST-1: an empty step list takes the plan’s steps, before the training video’s',e.steps.length===5&&e.steps[0][2]===25&&e.steps[0][1]===true&&e.rev==='rev1'&&!e.steps.some(x=>/video script/.test(x[0])),e);
  const e2=await s.evaluate(plan=>{S.cells['0_0']='C';S.cells['3_0']='EC';renderAll();__nbhFactsIn({plan});const bar=!!document.getElementById('nbhStepsBar');
    document.querySelector('#nbhStepsBar [data-sb="use"]').click();return {bar,steps:S.steps.map(x=>x.d),cells:Object.assign({},S.cells),marks:[...document.querySelectorAll('#stepTbl .nbh-pn')].map(x=>x.textContent)};},PLAN2);
  ok('9 ST-1: the changed plan is offered, and Update keeps the rehearsal codes of unchanged steps',e2.bar&&e2.steps.length===5&&e2.cells['0_0']==='C'&&e2.cells['4_0']==='EC'&&/no break \(simulated\)$/.test(e2.steps[4])&&e2.marks.length===5,e2);
  /* ---- TV-1 ---- */
  const v=await open('TV-1','TV-1_Training-Video_v2026-10.html');
  const g=await v.evaluate(plan=>{__nbhFactsIn({plan});const o=__nbhFactsOut();return o&&o.training&&o.training.steps;},PLAN1);
  ok('10 TV-1: the rehearsal steps are the plan’s list with its critical marks',Array.isArray(g)&&g.length===5&&g[2].d===PLAN1.steps[2].d&&g[2].crit===true&&g[1].crit===false,g);
  /* ---- PR-1 and PD-1 ---- */
  const INT={obs:[{date:'2026-10-03',type:'Unannounced',pct:80,n:5},{date:'2026-10-04',type:'Unannounced',pct:60,n:5}],overall:85,criterion:90,src:'TI-1',missed:b.missed};
  const r=await open('PR-1','PR-1_Periodic-Plan-Review_v2026-09.html');
  const h=await r.evaluate(i=>prAlsoText({integrity:i}),INT);
  ok('11 PR-1 names the steps missed, by their plan numbers',/Steps missed on the observations/.test(h)&&/plan step 70, “On the target behavior/.test(h)&&/1 commission/.test(h)&&/critical/.test(h),h);
  const pd=await open('PD-1','PD-1_Performance-Diagnostic-Checklist_v2026-09.html');
  const k=await pd.evaluate(i=>{__nbhFactsIn({integrity:i});return {c:document.querySelector('[data-m="concern"]').value,b:document.querySelector('[data-m="baseline"]').value};},INT);
  ok('12 PD-1: an empty concern names the steps missed, and the current level follows from TI-1',/^Does not carry out these steps of the plan/.test(k.c)&&/plan step 70/.test(k.c)&&/Treatment integrity 85%/.test(k.b),k);
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('13 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
