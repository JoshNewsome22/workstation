/* v23.15 Form DA-1, the demand assessment, review Wave 3 (simulated data only).
   F138  a task names the EA-1 demand condition only when it evokes problem behavior (in at least half of its sessions);
         low compliance without problem behavior is a low-probability demand for the fading plan, never an EA-1 task, and an
         assessment with no problem behavior is undifferentiated.
   F139  the latency rules use the latency observed in the sessions with problem behavior, not the floored mean.
   F140  latency-based sessions (no programmed consequence, or the session ends at the first problem behavior) rank by latency.
   F142  no whole task is offered as a high-probability request sequence.
   F143  the case: DA-1's results go out as 'demands' (the workstation reads them); EA-1's Demand card and TD-1's Demand fading
         and interspersal cards take them; DA-1 takes the earlier assessments' functions and the assent signals in.
   F144  a second observer and the agreement per session, per task and overall (Results, plan, CSV, print).
   F145  the packet's school goes to a School field, not "Setting(s) assessed".
   F146  the stop rule keeps its approved wording (the new one waits for the BCBA).     F147  the worked example's note names session 6; the masthead says October.
   usage: node qa/da1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/',DA=W+'DA-1_Demand-Assessment_v2026-10.html';
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('DA-1: '+e.message));await p.goto(DA);await sleep(1000);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};});
  /* a data set: tasks [name], sessions [task, min, given, complied, latency, count] */
  const load=(tasks,sess,meta)=>p.evaluate(([tasks,sess,meta])=>{S=blank();S.meta=Object.assign({len:'5',nper:'3'},meta||{});S.tasks=tasks.map(n=>Object.assign(newTask(),{name:n}));
    S.sess=sess.map(r=>Object.assign(newSess(r[0]),{min:String(r[1]),given:String(r[2]),comp:String(r[3]),lat:r[4]===''?'':String(r[4]),pb:String(r[5])}));renderAll();
    const R=stats(),rec=recommend(R);return {ranked:R.ranked.map(o=>({name:o.name,ev:o.ev,cls:o.cls,lat:o.lat,latObs:o.latObs})),fa:rec.fa.map(o=>o.name),verdict:rec.verdict[1]+' '+rec.verdict[2],
      fade:rec.fade.map(o=>o.name),terminal:rec.terminal.map(o=>o.name),mods:rec.mods.map(x=>({t:x.o.name,m:x.m.join(' | ')})),
      rec1:(document.querySelector('#recOut .recbox')||{}).textContent||'',rank:[...document.querySelectorAll('#rankTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent)),
      means:[...document.querySelectorAll('#meanTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent)),rule:(document.getElementById('rankRule')||{}).textContent||'',chart:document.getElementById('chartSel').value};},[tasks,sess,meta]);

  /* ---------- F138 ---------- */
  let D=await load(['Copy words','Puzzle'],[[0,5,10,3,'',0],[1,5,10,10,'',0],[0,5,10,2,'',0],[1,5,10,10,'',0],[0,5,10,3,'',0],[1,5,10,10,'',0]]);
  ok('F138 no problem behavior at all: undifferentiated; nothing named for EA-1; the low-compliance task is a low-probability demand that does not evoke the behavior, said so',
    /^Undifferentiated: no task evoked problem behavior/.test(D.verdict)&&/Copy words has low compliance without problem behavior/.test(D.verdict)&&!D.fa.length&&/None\. No task evoked problem behavior/.test(D.rec1)&&D.rank.find(r=>r[1]==='Copy words')[9]==='No'&&D.rank.find(r=>r[1]==='Copy words')[10]==='Low-p'&&D.terminal.includes('Copy words'),D);
  D=await load(['Copy words','Puzzle','Math page'],[[0,5,10,3,'',0],[1,5,10,10,'',0],[2,5,10,6,45,4],[0,5,10,2,'',0],[1,5,10,10,'',0],[2,5,10,5,60,3],[0,5,10,3,'',0],[1,5,10,10,'',0],[2,5,10,6,50,5]]);
  ok('F138 with a task that evokes problem behavior, only it goes to EA-1; the low-compliance task is a terminal fading step, not an EA-1 task',D.fa.join()==='Math page'&&D.terminal.includes('Copy words')&&/^Differentiated: Math page evoked the most/.test(D.verdict)&&D.rank[0][9]==='Yes',D);

  /* ---------- F139 ---------- */
  D=await load(['Math page','Puzzle'],[[0,5,10,9,30,1],[1,5,10,10,'',0],[0,5,10,9,'',0],[1,5,10,10,'',0],[0,5,10,9,'',0],[1,5,10,10,'',0]]);
  const mp=D.mods.find(x=>x.t==='Math page')||{m:''},mr=D.means.find(r=>r[1]==='Math page')||[];
  ok('F139 one problem behavior at 30 s and two clean sessions: the floored mean (210) stays in the table, the observed latency (30) beside it, and the interspersal rule fires from 30 s; no break schedule at 210 s',
    mr[4]==='210'&&mr[5]==='30'&&/Choice and interspersal: problem behavior arrived within 30 s on average in the session in which it occurred/.test(mp.m)&&!/Shorten the task and schedule breaks/.test(mp.m),{mr,mp});

  /* ---------- F140 ---------- */
  const LAT='No programmed consequence; the session continues (latency measure only)',ESC='Brief escape: materials removed for 30 seconds, then the task resumes (the demand-condition contingency)';
  const F140=[[0,5,10,2,15,1],[1,5,10,5,190,6],[0,5,10,3,20,1],[1,5,10,5,210,5],[0,5,10,2,25,1],[1,5,10,5,200,5]];
  D=await load(['Writing','Sorting'],F140,{conseq:LAT});
  ok('F140 latency-based sessions rank by latency: Writing (15-25 s) first, the verdict says soonest, the rule is stated, the chart shows latency',
    D.ranked[0].name==='Writing'&&/^Differentiated: Writing evoked problem behavior soonest \(mean latency 20 s/.test(D.verdict)&&/^Ranked by mean latency, shortest first/.test(D.rule)&&D.chart==='lat',D);
  D=await load(['Writing','Sorting'],F140,{conseq:ESC});
  ok('F140 with the brief-escape contingency the ranking stays by rate: Sorting first',D.ranked[0].name==='Sorting'&&/^Ranked by mean rate/.test(D.rule)&&D.chart==='rate',{r:D.ranked.map(o=>o.name),rule:D.rule});

  /* ---------- the simulation: F142, F144, F147, F143 out ---------- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const SIM=await p.evaluate(()=>({rec:document.getElementById('recOut').textContent,guide:[...document.querySelectorAll('.only-guide tr')].map(t=>t.textContent).find(t=>/^Interspersal and high-probability/.test(t))||'',
    notes:S.meta.notes,s6:S.sess[5].min,mast:document.querySelector('.nbh-formmeta').textContent,ph:document.querySelector('.nbh-print-meta').textContent,plan:S.meta.plan,
    ioa:(document.getElementById('rankRule')||{}).textContent||'',ioaRows:[...document.querySelectorAll('#ioaTbl tbody tr')].map(tr=>[...tr.cells].slice(8).map(c=>c.textContent).join('/')),
    sum:document.getElementById('ioaSum').textContent,metric:[...document.querySelectorAll('#resMetrics .metric')].map(m=>m.textContent),out:window.__nbhFactsOut()}));
  ok('F142 the recommendations name no whole task as a high-probability request sequence and point to TD-1\'s planner for the single-step requests; the Guide row says the same',
    !/run of high-probability demands \(/.test(SIM.rec)&&/single-step requests the student does on the first ask, chosen and probed on Form TD-1/.test(SIM.rec)&&!/The high-probability demands are also the interspersal set/.test(SIM.rec)&&/not a high-probability request sequence/.test(SIM.guide),SIM.rec.slice(0,400));
  ok('F139 in the worked example Clean-up (one problem behavior at 240 s, two clean sessions) gets the break schedule from 240 s, the observed latency, not 280',/Clean-up and putting materials away: [^]*arrived at a mean of 240 s in the session in which it occurred/.test(SIM.plan)&&!/mean of 280 s/.test(SIM.plan),SIM.plan.slice(0,1500));
  ok('F147 the worked example\'s note names session 6 (the 4-minute one); the masthead and the print head say Revised October 2026',/^Session 6 \(reading aloud\)/.test(SIM.notes)&&SIM.s6==='4'&&/Revised October 2026/.test(SIM.mast)&&/Revised October 2026/.test(SIM.ph),{n:SIM.notes,m:SIM.mast});
  ok('F144 the worked example: a second observer on 6 of 18 sessions; agreement per session and overall on the Results sheet, in the metrics and in the plan',
    /Second observer \(Mr\. D\. \(paraeducator\)\) on 6 of 18 sessions: problem-behavior count agreement 96% \(mean\), instructions complied with 95%, latency within 10 s in 6 of 6, affect the same in 5 of 6\./.test(SIM.ioa)&&SIM.ioaRows.length===18&&SIM.ioaRows.filter(x=>x!=='///').length===6&&SIM.ioaRows.includes('75%/100%/Yes/No')&&/second observer on 6/.test(SIM.metric.join(' '))&&/^Agreement: Second observer/m.test(SIM.plan)&&/Reading aloud to the teacher1 of 375%100%1 of 10 of 1/.test(SIM.sum),{ioa:SIM.ioa,rows:SIM.ioaRows,sum:SIM.sum.slice(0,300)});
  const O=SIM.out&&SIM.out.demands;
  ok('F143 the case out: demands with the EA-1 tasks, the fading order and terminal steps, the modifications, the conventions, the agreement',!!O&&O.form==='DA-1'&&O.fa.map(x=>x.name).join('|')==='Subtraction worksheet with regrouping|Reading aloud to the teacher|Copying sentences (handwriting)'&&
    O.fade.map(x=>x.name).join('|')==='Sorting and matching on the tablet|Listening comprehension questions|Clean-up and putting materials away'&&O.terminal.length===3&&O.mods.length===4&&/latency/.test(O.conventions.conseq)===false&&O.rule==='rate'&&O.ioa&&O.ioa.sessions===6,O);
  /* save and open: the second observer's record comes back; an older file opens */
  const RT=await p.evaluate(async()=>{const a=JSON.stringify(S);const blob=JSON.stringify({form:'DA-1',rev:'2026-10',S:JSON.parse(a)});const old=JSON.parse(a);old.sess.forEach(r=>{['g2','c2','l2','p2','a2'].forEach(k=>delete r[k]);});delete old.meta.ioaOn;
    const open=async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));};
    await open(blob);const same=JSON.stringify(S)===a;await open(JSON.stringify({form:'DA-1',rev:'2026-10',S:old}));
    return {same,oldOk:S.sess.length===18&&S.sess[1].g2===''&&!S.meta.ioaOn,hidden:document.getElementById('ioaWrap').hidden};});
  ok('F144 save and open give the second observer\'s record back; a file from before opens with it empty and the section closed',RT.same&&RT.oldOk&&RT.hidden,RT);
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  /* print: the agreement section prints the agreement per task and overall; the entry table and the switch stay on screen */
  await p.emulateMedia({media:'print'});
  const PR=await p.evaluate(()=>({sec:getComputedStyle(document.getElementById('ioaSec')).display,sum:getComputedStyle(document.getElementById('ioaSum')).display,sumRows:document.querySelectorAll('#ioaSum tbody tr').length,
    tbl:getComputedStyle(document.getElementById('ioaTbl').closest('.grid-wrap')).display,sw:getComputedStyle(document.querySelector('.ioa-on')).display}));
  await p.emulateMedia({media:'screen'});
  ok('F144 on paper: the agreement per task (six tasks) and overall; not the entry table or the switch',PR.sec!=='none'&&PR.sum!=='none'&&PR.sumRows===6&&PR.tbl==='none'&&PR.sw==='none',PR);
  /* CSV */
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=fs.readFileSync(await dl.path(),'utf8');
  ok('F144 the CSV carries the second observer\'s columns, the agreement per session and the overall line; F139 both latencies',/"Observer 2: PB count"/.test(csv)&&/"Count agreement %"/.test(csv)&&/"Agreement","Second observer/.test(csv)&&/"Mean latency, observed \(s\)"/.test(csv)&&/"Evokes PB"/.test(csv),csv.slice(0,300));

  /* ---------- F145, F146 ---------- */
  await p.evaluate(()=>document.getElementById('clearBtn').click());await sleep(500);
  const PK=await p.evaluate(()=>{window.__nbhApplyPacket({client:'Mateo Rivera',sid:'4471823',grade:'3',site:'Sample Elementary (simulated)'},true);
    return {site:document.querySelector('[data-m="site"]').value,setting:document.querySelector('[data-m="setting"]').value,rule:[...document.querySelectorAll('#pgRule li')].map(l=>l.textContent).find(t=>/^After 2 stops/.test(t))||''};});
  ok('F145 the packet\'s school goes to the School field; "Setting(s) assessed" stays empty',PK.site==='Sample Elementary (simulated)'&&PK.setting==='',PK);
  /* F146's new wording waits for the BCBA: the bullet keeps the wording approved in October 2026 */
  ok('F146 the stop rule scores the later instructions as usual, as the BCBA approved (v23.41)',/score each one as usual \(by “Compliance counted as” above\), and tell the BCBA the same day/.test(PK.rule)&&!/count them as not complied with/.test(PK.rule),PK.rule);

  /* ---------- F143 in: the earlier assessments and the assent plan ---------- */
  const IN=await p.evaluate(()=>{const r=window.__nbhFactsIn({evidence:{'IA-1':{fn:'Escape from academic demands',strength:'Moderate'},'OB-1':{fn:'Escape'}},student:{stop:{signs:'says stop, pushes the work away.'}}});
    return {r,hyp:S.meta.hyp,assent:S.meta.preAssent};});
  ok('F143 with no FS-1 function, the hypothesis takes IA-1 and OB-1 from the case; the assent signals come from SI-1',IN.hyp==='IA-1: Escape from academic demands (moderate); OB-1: Escape'&&IN.assent==='says stop, pushes the work away (Form SI-1)'&&IN.r.filled>=2,IN);
  const IN2=await p.evaluate(()=>{S.meta.hyp='';window.__nbhFactsIn({fn:{label:'Escape',statements:['When asked to write, he hits to get out of it (FS-1)']},evidence:{'IA-1':{fn:'Attention'}}});return S.meta.hyp;});
  ok('F143 FS-1\'s statement still comes first when the case has one',IN2==='When asked to write, he hits to get out of it (FS-1)',IN2);

  /* ---------- EA-1 and TD-1 take the demands ---------- */
  const DEM=O;
  const ea=await ctx.newPage();ea.on('pageerror',e=>errs.push('EA-1: '+e.message));await ea.goto(W+'EA-1_Experimental-Analysis-Protocol_v2026-09.html');await sleep(1200);
  const EA=await ea.evaluate(async d=>{nbhUI.confirm=async()=>true;const A=window.eaAPI;A.setv('v.chosen','standard');await A.loadTpl(true);
    const card=()=>{const n=[...document.querySelectorAll('[name^="c["][name$="].name"]')].find(e=>/^Demand/.test(e.value));return n?document.querySelector('[name="'+n.name.replace('.name','.mat')+'"]'):null;};
    const before=card()&&card().value;const r=window.__nbhFactsIn({demands:d});const after=card()&&card().value;
    card().value='Spelling list, typed by hand';window.__nbhFactsIn({demands:d});const kept=card().value;
    A.setv('v.chosen','pairwise');await A.loadTpl(true);A.setv('v.chosen','standard');await A.loadTpl(true);return {before,after,r,kept,reload:card()&&card().value};},DEM);
  ok('F143 EA-1: the Demand card\'s Materials line names DA-1\'s tasks in place of the template line; a line typed by hand is kept; cards loaded again from the template take them',/^Tasks at the student/.test(EA.before||'')&&EA.after==='Tasks from Form DA-1: Subtraction worksheet with regrouping (or rotate with Reading aloud to the teacher and Copying sentences (handwriting), and note which was used)'&&EA.kept==='Spelling list, typed by hand'&&EA.reload===EA.after&&EA.r&&/the demand tasks \(Form DA-1\)/.test(EA.r.note||''),EA);
  const td=await ctx.newPage();td.on('pageerror',e=>errs.push('TD-1: '+e.message));await td.goto(W+'TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(1500);
  const TD=await td.evaluate(d=>{nbhUI.confirm=async()=>true;const add=c=>{const s=document.getElementById('addComp');s.value=c;document.getElementById('addCompBtn').click();};add('DF');window.__nbhFactsIn({demands:d});add('A_INTERSPERSE');
    return new Promise(res=>setTimeout(()=>{const c=[...document.querySelectorAll('#compWrap .card')];const df=c.find(x=>x.dataset.code==='DF'),ai=c.find(x=>x.dataset.code==='A_INTERSPERSE');
      res({df:document.querySelector('[name="cp['+df.dataset.i+'].mat"]').value,ai:document.querySelector('[name="cp['+ai.dataset.i+'].p1"]').value,box:(document.getElementById('tdDa1')||{}).textContent||'',boxPrint:document.getElementById('tdDa1')&&document.getElementById('tdDa1').classList.contains('noprint')});},300));},DEM);
  ok('F143 TD-1: the Demand fading card\'s materials take the fading order and the terminal steps; an interspersal card added later takes the easy items; a screen-only box on the Antecedent sheet says what DA-1 found',
    TD.df==='Tasks in fading order: Sorting and matching on the tablet, then Listening comprehension questions, then Clean-up and putting materials away; terminal steps: Copying sentences (handwriting), then Reading aloud to the teacher, then Subtraction worksheet with regrouping (Form DA-1)'&&
    /^Easy items from Listening comprehension questions and Sorting and matching on the tablet, interspersed in /.test(TD.ai)&&/From the demand assessment \(Form DA-1/.test(TD.box)&&/Evoke problem behavior/.test(TD.box)&&TD.boxPrint,TD);

  /* ---------- the workstation reads DA-1 as 'demands' and hands them to EA-1 ---------- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(W+'index.html');await sleep(1200);
  await sh.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  await sh.evaluate(()=>openForm('DA-1'));await sh.waitForFunction(()=>!!state.status['DA-1'],null,{timeout:30000});await sleep(1200);
  const daf=sh.frames().find(f=>/DA-1_Demand/.test(f.url()));
  await daf.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(1200);
  await sh.evaluate(()=>openForm('EA-1'));await sh.waitForFunction(()=>!!state.status['EA-1'],null,{timeout:30000});await sleep(1500);
  const SH=await sh.evaluate(async()=>{await gatherFacts(true);await new Promise(r=>setTimeout(r,1500));const f=state.facts||{};return {src:(f.src||{}).demands,fa:f.demands&&f.demands.fa.length,reg:FACT_SRC['DA-1'],gen:FACT_GEN.includes('DA-1')};});
  const eaf=sh.frames().find(f=>/EA-1_Experimental/.test(f.url()));
  const shMat=await eaf.evaluate(async()=>{const A=window.eaAPI;A.setv('v.chosen','standard');await A.loadTpl(true);const n=[...document.querySelectorAll('[name^="c["][name$="].name"]')].find(e=>/^Demand/.test(e.value));return n?document.querySelector('[name="'+n.name.replace('.name','.mat')+'"]').value:'';});
  ok('F143 in the workstation: DA-1 is a source of the case (demands), and EA-1 opened beside it takes the tasks on its Demand card',SH.src==='DA-1'&&SH.fa===3&&SH.reg==='demands'&&SH.gen&&/^Tasks from Form DA-1: Subtraction worksheet/.test(shMat),{SH,shMat});

  /* ---------- printed pages ---------- */
  const out=path.join(os.tmpdir(),'da1w3');fs.mkdirSync(out,{recursive:true});
  const pr=async(sim,file)=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push('print: '+e.message));await q.goto(DA);await sleep(900);
    await q.evaluate(async s=>{nbhUI.confirm=async()=>true;window.print=()=>{};if(s){document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,800));}},sim);
    await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,file),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();return pages(path.join(out,file));};
  const pb=await pr(false,'blank.pdf'),ps=await pr(true,'sim.pdf');
  ok('the printed pages: blank 10, the worked example 18 (as before Wave 3; the agreement prints in the room the Assessment sheet had)',pb===10&&ps===18,{pb,ps});
  ok('no page errors',!errs.length,errs.slice(0,3));
 }catch(e){console.error(e);fails++;}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
