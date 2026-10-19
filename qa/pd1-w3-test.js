/* Form PD-1, review Wave 3 majors: a supervision record, not the student's (F248); low integrity sends the BCBA to find out
   why before retraining (F249); Form TI-1's figure offered, never written in (F251); the instrument's basis as published (F252);
   the reassessment on the due list and the result to the case (F253). Simulated data only. usage: node qa/pd1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const PD='PD-1_Performance-Diagnostic-Checklist_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html',TI='TI-1_Treatment-Integrity-Observation_v2026-09.html';
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const setM=(p,o)=>p.evaluate(o=>{for(const k in o){const e=document.querySelector('[data-m="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},o);
  const val=(p,k)=>p.evaluate(k=>document.querySelector('[data-m="'+k+'"]').value,k);

  /* ---------------- F248 a supervision record ---------------- */
  const p=await open(PD);
  const a=await p.evaluate(()=>{window.__nbhApplyPacket({client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School (simulated)',bcba:'Jordan Ellis (simulated)'},true);
    const css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
    return {meta:document.querySelector('.nbh-formmeta').textContent,foot:/@bottom-left\{content:"Supervision record kept by the BCBA\. Not part of the student\\2019s file\."/.test(css)&&!/Confidential student record/.test(css),
      fields:[...document.querySelectorAll('input,textarea,select')].map(e=>e.value).filter(v=>/Mateo|Rivera|4471823|Royal Palm/.test(v)),
      ini:document.querySelector('[data-m="initials"]').value,client:!!document.querySelector('[data-m="client"],[data-m="sid"],[data-m="setting"]'),where:document.querySelector('[data-m="where"]').value,
      line:document.querySelector('.pd-recline').textContent};});
  ok('1 F248 the masthead, the print header and the page footer call it a supervision record kept by the BCBA, not part of the student’s file',
    /Supervision record kept by the BCBA/.test(a.meta)&&!/student record/.test(a.meta)&&a.foot&&/not part of the student.s file/.test(a.line),a);
  ok('2 F248 F254 the student appears by initials only: the bar’s name becomes M.R., the ID and the school are not taken, and nothing the form holds names the student',
    a.ini==='M.R.'&&!a.client&&a.where===''&&a.fields.length===0,a);
  const old=await p.evaluate(()=>{const o=fromFile({form:'PD-1',S:{meta:{client:'Mateo Rivera',sid:'4471823',setting:'Room 12, 9:40 block',reassess:'11/20/26',staff:'Dana Whitfield (simulated)'},ans:{},chk:{},ver:{},note:{},sel:{},how:{}}});return o.meta;});
  ok('3 F248 a file saved before: the name becomes initials, the ID is dropped, the setting is where the task is due, the reassessment a date',
    old.initials==='M.R.'&&!('client' in old)&&!('sid' in old)&&old.where==='Room 12, 9:40 block'&&old.reassess==='2026-11-20',old);
  const told=await p.evaluate(()=>{const v1=document.querySelector('#setupVerdict').textContent;const s=document.querySelector('[data-m="informed"]');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}));
    return {v1,v2:document.querySelector('#setupVerdict').textContent};});
  ok('4 F248 a line records that the staff member was told what the checklist is for and who will see it; until it is, Setup says to tell them first',
    /Tell the staff member first/.test(told.v1)&&!/Tell the staff member first/.test(told.v2),told);

  /* the worked example: the note for the student's file, the case's part, the due date */
  await p.evaluate(async()=>{await loadSim();});await sleep(300);
  const sim=await p.evaluate(()=>({note:S.meta.filenote,chk:document.querySelector('#noteCheck').textContent,out:window.__nbhFactsOut(),due:window.__nbhDue(),ini:S.meta.initials,client:S.meta.client}));
  ok('5 F248 the example drafts a note for the student’s file: the plan component, how often it was delivered, the barrier found, the changes and the reassessment, and no staff name',
    /^Plan component: BIP dated .*FCT practice trials/.test(sim.note)&&/Delivered before the change: Trials run: 4 of 10/.test(sim.note)&&/found the resources, materials, & processes domain leading/.test(sim.note)&&
    /Changes chosen: .*task clarification/i.test(sim.note)&&/Reassessment: \d+\/\d+\/\d{4}\./.test(sim.note)&&!/Paraeducator|Ms\. R/.test(sim.note)&&/No staff name found/.test(sim.chk)&&sim.ini==='S.S.'&&!sim.client,sim);
  const pf=sim.out&&sim.out.perf;
  ok('6 F248 F253 the case gets the performance diagnostic without the person: the plan component, the leading domain, the changes, the reassessment and the note',
    pf&&pf.lead==='R'&&/Resources/.test(pf.leadName)&&pf.fixes.length>=3&&/^\d{4}-\d{2}-\d{2}$/.test(pf.reassess)&&pf.note===sim.note&&!pf.named&&pf.tNo===1&&!JSON.stringify(sim.out).includes('Paraeducator'),sim.out);
  ok('7 F253 the reassessment date is on the due list',sim.due.length===1&&sim.due[0].date===pf.reassess&&/PD-1 reassessment/.test(sim.due[0].what),sim.due);
  const nm=await p.evaluate(()=>{const s=document.querySelector('[data-m="staff"]');s.value='Dana Whitfield (simulated)';s.dispatchEvent(new Event('input',{bubbles:true}));
    const n=document.querySelector('[data-m="filenote"]');n.value=S.meta.filenote+' Ms. Whitfield will run the trials.';n.dispatchEvent(new Event('input',{bubbles:true}));
    const o=window.__nbhFactsOut().perf;return {chk:document.querySelector('#noteCheck').textContent,note:o.note,named:o.named};});
  ok('8 F248 a note that names the staff member is flagged and not sent to the case',/The note names Whitfield/.test(nm.chk)&&nm.note===''&&nm.named===true,nm);
  /* master print still prints the form on its own; the PDF keeps its page count near the baseline is the gate's job */

  /* ---------------- F251 the figure offered, never written ---------------- */
  const INT={obs:[{date:'2026-10-03',type:'Unannounced',pct:85,n:10},{date:'2026-10-06',type:'Unannounced',pct:95,n:10}],overall:90,criterion:90,src:'TI-1',who:'Dana Whitfield (simulated)',role:'Paraeducator',
    steps:[{d:'Runs the FCT trial at the start of the block',pct:50,crit:true},{d:'Records each trial on the data sheet',pct:70,crit:false},{d:'Praises the request',pct:100,crit:false}]};
  const q=await open(PD);
  await setM(q,{concern:'Arrives 10 minutes late to the morning session most days.'});
  const f1=await q.evaluate(i=>{const r=window.__nbhFactsIn({integrity:i});return {r,bl:document.querySelector('[data-m="baseline"]').value,sug:document.querySelector('#blSug').textContent};},INT);
  ok('9 F251 a concern about lateness gets no plan figure: nothing is written in, and the figure waits for the "step of the plan" box',f1.bl===''&&/only when the concern is a step of the plan/.test(f1.sug)&&/nothing is written in/.test(f1.r.note),f1);
  const f2=await q.evaluate(()=>{const c=document.querySelector('[data-c="planstep"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    const s=document.querySelector('[data-m="staff"]');s.value='Paula Brennan (simulated)';s.dispatchEvent(new Event('input',{bubbles:true}));
    const other=document.querySelector('#blSug').textContent;s.value='Dana Whitfield';s.dispatchEvent(new Event('input',{bubbles:true}));
    return {other,same:document.querySelector('#blSug').textContent,btns:[...document.querySelectorAll('#blSug [data-sug]')].map(b=>b.textContent),bl:document.querySelector('[data-m="baseline"]').value};});
  ok('10 F251 TI-1 observed someone else: its figure is not offered; the same person: offered with each step under the criterion, still not written in',
    /observed Dana Whitfield \(simulated\), not the staff member assessed/.test(f2.other)&&/From Form TI-1 \(Dana Whitfield \(simulated\)\): Treatment integrity 90% over 2 TI-1 observations/.test(f2.same)&&
    f2.btns.length===3&&/Runs the FCT trial.*50%/.test(f2.btns[1])&&/Records each trial.*70%/.test(f2.btns[2])&&f2.bl==='',f2);
  const f3=await q.evaluate(async()=>{document.querySelector('#blSug [data-sug="0"]').click();await new Promise(r=>setTimeout(r,50));const a=S.meta.baseline;
    document.querySelector('#blSug [data-sug="all"]').click();await new Promise(r=>setTimeout(r,50));return {a,b:S.meta.baseline};});
  ok('11 F251 a tap uses a step’s figure or the overall one',/^Step “Runs the FCT trial at the start of the block” of the plan: 50% correct over 2 TI-1 observations \(latest 2026-10-06\)$/.test(f3.a)&&f3.b==='Treatment integrity 90% over 2 TI-1 observations (latest 2026-10-06)',f3);
  const nowho=await q.evaluate(i=>{const j=JSON.parse(JSON.stringify(i));delete j.who;window.__nbhFactsIn({integrity:j});return document.querySelector('#blSug').textContent;},INT);
  ok('12 F251 TI-1 does not say whom it observed: the figure is offered with that said',/does not say whom it observed/.test(nowho),nowho);
  /* v22.46: the concern from TI-1's missed steps only for the adult it observed */
  const MISS=Object.assign({},INT,{missed:[{d:'Runs the FCT trial at the start of the block',n:1,pn:3,crit:true,pct:50,ec:0,eo:2}]});
  const r1=await open(PD);
  const m1=await r1.evaluate(i=>{const s=document.querySelector('[data-m="staff"]');s.value='Paula Brennan (simulated)';s.dispatchEvent(new Event('input',{bubbles:true}));window.__nbhFactsIn({integrity:i});return document.querySelector('[data-m="concern"]').value;},MISS);
  const r2=await open(PD);
  const m2=await r2.evaluate(i=>{window.__nbhFactsIn({integrity:i});return {c:document.querySelector('[data-m="concern"]').value,ps:S.chk.planstep,bl:S.meta.baseline||'',sug:document.querySelector('#blSug').textContent};},MISS);
  ok('13 F251 the concern is started from TI-1’s missed steps only for the person TI-1 observed; it ticks "a step of the plan" and the level is offered, not written',
    m1===''&&/^Does not carry out this step of the plan/.test(m2.c)&&m2.ps===true&&m2.bl===''&&/Use this figure/.test(m2.sug),{m1,m2});
  await r1.close();await r2.close();

  /* ---------------- F252 the Guide ---------------- */
  const g=await p.evaluate(()=>({guide:document.querySelector('.only-guide').textContent.replace(/\s+/g,' '),sub:document.querySelector('.nbh-sub').textContent}));
  ok('14 F252 version 1.1 is named as published, with its correction, the 2016 correction, Bowe and Sellers as a school study, and the four references',
    !/unpublished training document/.test(g.guide)&&/Version 1.1 is published: Jimenez, Wilder, Brand, Carr, Sellers and Mason \(2023\)/.test(g.guide)&&/A correction \(2024\) fixed Resources item 3/.test(g.guide)&&
    /Carr & Wilder, 2016/.test(g.guide)&&/Most published studies are from clinics\. The closest to a school is Bowe and Sellers \(2018\)/.test(g.guide)&&/doi\.org\/10\.1002\/jaba\.1017/.test(g.guide)&&/jaba\.1070/.test(g.guide)&&
    /Bowe, M\., & Sellers, T\. P\. \(2018\)\. Evaluating the Performance Diagnostic Checklist/.test(g.guide)&&/Carr, J\. E\., & Wilder, D\. A\. \(2016\)\. The Performance Diagnostic Checklist–Human Services: A correction/.test(g.guide)&&
    /most NOs point at an intervention/.test(g.sub),g.sub);

  /* ---------------- F249 the shell ---------------- */
  const ctx2=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const sh=await ctx2.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const T=await sh.evaluate(([iso,pf])=>{const base={src:{},integrity:{obs:[{date:iso[0],pct:80,n:10},{date:iso[1],pct:70,n:10},{date:iso[2],pct:60,n:10}],criterion:90}};
    const tx=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent;};
    const run=f=>{state.facts=f;return todayItems().filter(x=>x.k==='Integrity').map(x=>tx(x.t)+'|'+x.open);};
    const one=JSON.parse(JSON.stringify(base));one.integrity.obs=[{date:iso[2],pct:70,n:10}];
    const withR=Object.assign({},base,{perf:pf});const withT=Object.assign({},base,{perf:Object.assign({},pf,{lead:'T',leadName:'Training'})});
    const due=Object.assign({},base,{integrity:{obs:[{date:iso[2],pct:95,n:10}],criterion:90},perf:Object.assign({},pf,{reassess:iso[3]})});
    return {three:run(base),one:run(one),r:run(withR),t:run(withT),due:run(due)};},[[iso(-9),iso(-5),iso(-2),iso(2)],pf]);
  ok('15 F249 Today: integrity under the criterion on 3 of the last 3 checks: find out why before retraining, opening PD-1',
    T.three.length===1&&/^Integrity under the 90% criterion on 3 of the last 3 checks \(the last, .*, 60%\): find out why before retraining \(Form PD-1\)\|PD-1$/.test(T.three[0]),T.three);
  ok('16 F249 a single check under the criterion: check again before acting (PD-1 is for a consistent pattern)',T.one.length===1&&/\(the only check so far\): check again before acting; if it repeats, find out why before retraining \(Form PD-1\)\|TI-1$/.test(T.one[0]),T.one);
  ok('17 F249 once PD-1 holds a result, Today names its leading domain and the changes; retraining only when it found training leading',
    /Form PD-1 \(.*\) found resources, materials, & processes leading; the changes: .*; training items answered No as well: retrain those too\|PD-1$/.test(T.r[0])&&/found training leading: retrain the steps missed \(the retraining list on Form TI-1\)\|TI-1$/.test(T.t[0]),{r:T.r,t:T.t});
  ok('18 F253 the reassessment PD-1 set is on Today when it is near',T.due.some(x=>/^The reassessment Form PD-1 set for BIP dated .*… is in 2 days \(.*\): repeat the measure, and the checklist if nothing has changed\|PD-1$/.test(x)),T.due);
  const D=await sh.evaluate(([iso,pf])=>{const F={src:{},data:{from:iso[0],to:iso[2],days:20,behaviors:[{name:'Elopement',kind:'target',base:{days:6,mean:4},cur:{days:12,mean:3.9},curName:'Intervention'}]},
      integrity:{obs:[{date:iso[1],pct:70,n:10},{date:iso[2],pct:60,n:10}],criterion:90}};
    const tx=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent;};const r=f=>tdDecision(f).map(x=>tx(x.t)+'|'+x.open);return {no:r(F),pd:r(Object.assign({},F,{perf:pf}))};},[[iso(-30),iso(-5),iso(-2)],pf]);
  ok('19 F249 the decision list: find out why (PD-1) before judging the plan; with PD-1’s result, judge the plan once the change has run',
    /but integrity under the 90% criterion on 2 of the last 2 checks .*: find out why before retraining \(Form PD-1\), then judge the plan\|PD-1$/.test(D.no[0])&&/found resources, materials, & processes leading.*; judge the plan once the change has run \(retrain the training items answered No too\)\|PD-1$/.test(D.pd[0]),D);
  /* F248 the master print: Tick the ones I've used leaves PD-1 out; ticking it asks */
  const M=await sh.evaluate(()=>{state.status['PD-1']={filled:40};state.status['TI-1']={filled:30};document.getElementById('tickUsed').click();const used={pd:!!state.ticked['PD-1'],ti:!!state.ticked['TI-1']};
    let asked='';window.confirm=m=>{asked=m;return false;};const cb=document.querySelector('[data-tick="PD-1"]');cb.click();const no=!!state.ticked['PD-1'];
    window.confirm=m=>true;document.querySelector('[data-tick="PD-1"]').click();return {used,asked,no,yes:!!state.ticked['PD-1']};});
  ok('20 F248 the master print: "Tick the ones I’ve used" leaves PD-1 out; ticking it by hand asks first, and a No leaves it out',
    M.used.ti&&!M.used.pd&&/supervision record about a staff member/.test(M.asked)&&!M.no&&M.yes,M);
  /* TI-1's Find out why, in the workstation */
  const W=await sh.evaluate(async()=>{state.ticked={};openForm('TI-1');await new Promise(r=>setTimeout(r,2500));const fr=state.frames['TI-1'];const w=fr.contentWindow;
    w.nbhUI.confirm=async()=>true;await w.loadSim();await new Promise(r=>setTimeout(r,400));
    const box=w.document.getElementById('tiWhy');const vis=box&&!box.hidden;w.document.getElementById('tiWhyBtn').click();
    for(let i=0;i<40&&!(state.frames['PD-1']&&state.frames['PD-1'].dataset.loaded);i++)await new Promise(r=>setTimeout(r,200));
    let ti=null;for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,250));try{ti=state.frames['PD-1'].contentWindow.__pdTI;}catch(e){}if(ti)break;}
    return {vis,open:!!state.frames['PD-1'],cur:state.cur,split:(state.split||[]).slice(),who:ti&&ti.who,steps:ti&&ti.steps&&ti.steps.length,ov:ti&&ti.overall,facts:state.facts&&state.facts.integrity&&state.facts.integrity.who,busy:typeof factsBusy!=='undefined'?factsBusy:'?',keys:Object.keys(state.facts||{}),srcI:state.facts&&state.facts.src&&state.facts.src.integrity,relay:(state.relayLog||[]).slice(-3)};});
  ok('21 F249 in the workstation, TI-1’s "Find out why (Form PD-1)" opens PD-1, which takes TI-1’s figures with whom it observed and each step',
    W.vis&&W.open&&W.cur==='PD-1'&&typeof W.who==='string'&&W.who.length>0&&W.steps>5&&W.ov>0,W);
  const solo=await open(TI);const sv=await solo.evaluate(()=>document.getElementById('tiWhy').hidden);
  ok('22 F249 opened on its own, TI-1 does not show the button (there is no workstation to open PD-1 in)',sv===true,sv);

  /* ---------------- PR-1 ---------------- */
  const r=await open(PR);
  const h=await r.evaluate(pf=>({a:prAlsoText({perf:pf}),b:prAlsoText({perf:Object.assign({},pf,{note:'',named:true})})}),pf);
  ok('23 F248 PR-1 carries PD-1’s note for the student’s file, or its result in outline when the note names staff',
    /Performance diagnostic \(Form PD-1\): Plan component: BIP dated/.test(h.a)&&/Performance diagnostic \(Form PD-1, \d+\/\d+\) on BIP dated .*: resources, materials, & processes leading; changes chosen: .*; reassessment \d+\/\d+\./.test(h.b)&&!/Paraeducator/.test(h.a+h.b),h);
  ok('24 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
