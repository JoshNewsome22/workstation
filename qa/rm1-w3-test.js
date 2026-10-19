/* Form RM-1, review Wave 3: the plan's phases at plan time (F308); the case in, one baseline value, the caregiver line to CT-1 (F309);
   the lean-baseline convention (F310, F311); the log's unit beside the clinic figures (F312); the combined package as the form's
   judgment (F313); Selected references (F314); "more than one function" (F315); semicolons (F316); the record print (F317).
   Simulated data only. usage: node qa/rm1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('RM-1_'));await sleep(1000);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},[k,v]);
  const leanNote=()=>p.evaluate(()=>{renderMit();const i=MIT.findIndex(m=>m.k==='leanBl');const r=[...document.querySelectorAll('#mitTbl tr')].find(tr=>tr.querySelector('[data-mi="'+i+'"]'));return r?r.querySelector('td.src').textContent.replace(/\s+/g,' '):'';});
  /* ---- F308 ---- */
  const a0=await p.evaluate(()=>({note:document.getElementById('rmPhaseNote').textContent,ph:document.querySelector('#mitTbl tr.phasehead').textContent}));
  await p.evaluate(()=>loadSim());await sleep(600);
  const a1=await p.evaluate(()=>({note:document.getElementById('rmPhaseNote').textContent,ph:document.querySelector('#mitTbl tr.phasehead').textContent}));
  const lean1=await leanNote();
  const ix=fs.readFileSync(dir+'index.html','utf8');
  ok('1 F308 the plan is made before treatment starts; once a challenge is logged Phase 1 records what was arranged; the case map has RM-1 at plan time too',
    /this plan is made before treatment starts, with Forms TD-1 and SR-1/.test(a0.note)&&!/record what was arranged/.test(a0.ph)&&/Treatment has started \(a challenge is logged\): Phase 1 records what was arranged/.test(a1.note)&&/treatment has started: record what was arranged/.test(a1.ph)&&/Record only/.test(lean1)&&
    /\['SR-1','the schedule of reinforcement, designed and thinned'\],\['RM-1','the exposure to relapse and the inoculation plan, before the first thinning step'\]/.test(ix)&&/\['RM-1','the challenge log and its analysis, before fading'\]/.test(ix),{a0,a1});
  /* ---- F312, F316 ---- */
  const an=await p.evaluate(()=>{renderAn();return {v:document.getElementById('anVerdict').textContent,head:document.querySelector('#baseTbl thead').textContent};});
  ok('2 F312 the log\'s unit beside the clinic figures: the verdict and the table say so, and a school day\'s single instance is named',/The published figures are per clinic session and this student’s rows are per day: the percentages size the risk and are not a like-for-like comparison\. On a whole school day a single extra instance meets the rule\./.test(an.v)&&/This student \(per day\)/.test(an.head)&&/Published \(per clinic session\)/.test(an.head),an);
  const sc=await p.evaluate(()=>{S.ch.push({date:'10/1',type:S.ch[0].type,planned:'Planned',what:'test',a:'0;1;0;0;0',b:'2;0;0',resp:''});renderCh();const r=[...document.querySelectorAll('#chTbl tbody tr')].pop();const t=r.textContent;S.ch.pop();renderAll();return {t,ok:scoreCh({a:'0;1;0;0;0',b:'2;0;0'})};});
  ok('3 F316 rates typed with semicolons are five and three sessions, and every row says how many were scored',sc.ok.nA===5&&sc.ok.nB===3&&/Scored: 5 A, 3 B/.test(sc.t),sc);
  /* ---- F317 ---- */
  const pr=await p.evaluate(()=>{const css=document.getElementById('rmPrintSel').textContent;document.getElementById('pFull').click();document.getElementById('pGuide').click();const css2=document.getElementById('rmPrintSel').textContent;const m={f:S.meta.pFull,g:S.meta.pGuide};
    document.getElementById('pFull').click();document.getElementById('pGuide').click();return {css,css2,m};});
  const pages=async()=>{await p.emulateMedia({media:'print'});const n=((await p.pdf({format:'Letter',printBackground:true})).toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;await p.emulateMedia({media:'screen'});return n;};
  const n0=await pages();await p.evaluate(()=>{document.getElementById('pFull').click();document.getElementById('pGuide').click();});const n1=await pages();await p.evaluate(()=>{document.getElementById('pFull').click();document.getElementById('pGuide').click();});
  console.log('INFO the simulation prints '+n0+' pages as the record, '+n1+' with the full plan and the Guide');
  ok('4 F317 the ordinary print is the record (the ticked plan rows, no Guide); the full plan and the Guide print by choice',/#mitTbl tr:not\(\.picked\):not\(\.phasehead\)/.test(pr.css)&&/section\.only-guide\{display:none!important\}/.test(pr.css)&&pr.css2==='@media print{}'&&pr.m.f==='1'&&pr.m.g==='1'&&n0<n1,{pr,n0,n1});
  /* ---- F310, F311, F313 ---- */
  await p.evaluate(()=>{S=blank();renderAll();});
  await setM('precursor','Yes');const c0=await leanNote();
  await setM('harm','Yes');await setM('precursor','No');const c1=await leanNote();
  await setM('precursor','Yes');const c2=await leanNote();
  await setM('harm','No');const c3=await leanNote();
  ok('5 F310 F311 the lean-baseline row: the harm question first; harm Yes is a caution; harm Yes with a precursor is for the precursor only; harm No is available; each with the consent and timing condition',
    /Record the imminent-harm risk on Setup before choosing this row/.test(c0)&&!/Available/.test(c0)&&/Caution/.test(c1)&&/For the precursor only/.test(c2)&&/not the dangerous behavior/.test(c2)&&/Available/.test(c3)&&
    [c1,c2,c3].every(t=>/Only inside an arranged functional analysis or baseline the parent consented to \(Forms IC-1 and EA-1\), before treatment starts/.test(t)),{c0,c1,c2,c3});
  const page=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('6 F311 F313 one convention in three cases; the combined package is the form\'s judgment beside the abstract\'s',/Harm Yes, a precursor consequated: available for the precursor only, with a written rationale\./.test(page)&&/This is the form’s judgment, not the authors’ recommendation\./.test(page),'text');
  ok('7 F314 Selected references, with the works checked added',/Selected references\./.test(page)&&!/Reference list\./.test(page)&&/Lerman, D\. C\., & Iwata, B\. A\. \(1995\)/.test(page)&&/Stokes, T\. F\., & Baer, D\. M\. \(1977\)/.test(page)&&/Vollmer, T\. R\., Progar/.test(page)&&/Winterbauer, N\. E\., Lucke, S\., & Bouton/.test(page)&&/St\. Peter Pipkin, C\./.test(page)&&/Fuhrman, A\. M\., Fisher, W\. W\., & Greer, B\. D\. \(2016\)/.test(page),'text');
  /* ---- F309, F315 ---- */
  const f1=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({behaviors:[{label:'Hitting',def:'x',fn:'Escape',fnKey:'escape'}],fn:{key:'multiple',label:'More than one function'},
    plan:{rep:'Hands the break card to ask for a break',teach:['Functional communication training (FCT)'],sched:['FR 1, then thinned']},data:{conds:[{name:'Baseline'}],behaviors:[{name:'Hitting',days:10,mean:4.234,measure:'count'}]}});
    return {r,beh:S.meta.beh,fn:S.meta.fn,fcr:S.meta.fcr,tx:S.meta.tx,bl:S.blMean,unit:S.meta.unit,ti:S.ind.rei_3,setup:document.getElementById('blMeanSetup').value};});
  ok('8 F309 F315 from the case: the behavior, "more than one function", the alternative response and treatment from TD-1, the baseline mean from DD-1 in both places, and no TI-1 record ticks "integrity has not been measured"',
    f1.beh==='Hitting'&&f1.fn==='More than one function (multiple)'&&f1.fcr==='Hands the break card to ask for a break'&&f1.tx==='Functional communication training (FCT); FR 1, then thinned (Form TD-1)'&&f1.bl==='4.23'&&f1.unit==='per day'&&f1.ti===true&&f1.setup==='4.23',f1);
  const f2=await p.evaluate(()=>{S=blank();renderAll();window.__nbhFactsIn({plan:{rep:'x'},integrity:{score:90}});const a=!!S.ind.rei_3;S.meta.blLevel='M 5 per day';S.blMean='4.2';renderAll();return {a,agree:document.getElementById('blAgree').textContent};});
  ok('9 F309 a TI-1 record leaves the line unticked, and Setup says when its level and the proportions\' mean disagree',!f2.a&&/The level above reads 5; the proportions use 4\.2: make them agree\./.test(f2.agree),f2);
  await p.evaluate(()=>loadSim());await sleep(500);
  const out=await p.evaluate(()=>(window.__nbhFactsOut()||{}).relapse);
  ok('10 F309 what caregivers are told goes to the case with the unit',out&&/^Delivering|\w/.test(out.caregiverDo||'')&&out.unit==='per day',out&&{cg:out.caregiverDo,unit:out.unit});
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('CT-1: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/'+file('CT-1_'));await sleep(900);
  const ct=await q.evaluate(t=>{const r=window.__nbhFactsIn({relapse:{caregiverDo:t}});return {r,v:document.querySelector('[data-m="relapseDo"]').value,m:S.meta.relapseDo};},'Keep the card in reach and wait for a calm moment before giving the break (simulated).');
  ok('11 F309 Form CT-1 takes RM-1\'s line for "What the caregiver does when it returns" when it is empty',ct.m==='Keep the card in reach and wait for a calm moment before giving the break (simulated).'&&ct.v===ct.m&&ct.r&&ct.r.filled>=1,ct);
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
