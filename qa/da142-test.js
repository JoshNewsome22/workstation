/* v24.42 Form DA-1 polish (review V15: R-076, R-077, R-078, R-135, E-35): a task with no problem behavior reads "none in 3" on
   the Results sheet; fewer sessions per task than planned make the verdict provisional, in the plan draft and the case too; a
   "Stop the session when" rule on the Inventory sheet, filled from the case, printed on the Assessment sheet; the Results prose
   across the page; the one-page presenter sheet beside Print; task-order warnings under the trial record.
   usage: node qa/da142-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
const pdfInfo=f=>{try{const o=cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps({"n":d.page_count,"t":[p.get_text() for p in d]}))',f]).toString();return JSON.parse(o);}catch(e){return null;}};
const flat=t=>String(t||'').replace(/\s+/g,' ');
const FILE='DA-1_Demand-Assessment_v2026-10.html';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const errs=[];const p=await b.newPage({viewport:{width:1300,height:950}});p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/NBH-Workstation/'+FILE);await sleep(1500);
 await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;window.alert=()=>{};});
 async function print(name){await p.emulateMedia({media:'print'});const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});const f=path.join(OUT,name);fs.writeFileSync(f,buf);const i=pdfInfo(f);return i?{n:i.n,all:flat(i.t.join(' ')),pages:i.t.map(flat)}:{n:0,all:'',pages:[]};}
 const setSel=(id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);
 /* load tasks and sessions straight into the record (the test harness of qa/da1-w3-test.js) */
 const load=(tasks,sess,meta)=>p.evaluate(([tasks,sess,meta])=>{S=blank();S.meta=Object.assign({len:'5',nper:'3'},meta||{});S.tasks=tasks.map(n=>Object.assign(newTask(),{name:n}));
    S.sess=sess.map(r=>Object.assign(newSess(r[0]),{min:String(r[1]),given:String(r[2]),comp:String(r[3]),lat:r[4]===''?'':String(r[4]),pb:String(r[5])}));renderAll();
    const R=stats(),rec=recommend(R);return {verdict:rec.verdict[1]+' '+rec.verdict[2],prov:rec.prov||'',rank:[...document.querySelectorAll('#rankTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent)),
      metrics:[...document.querySelectorAll('#resMetrics .metric')].map(m=>m.textContent.replace(/\s+/g,' ').trim()),rec1:(document.querySelector('#recOut .recbox')||{}).textContent||'',
      rule:(document.getElementById('rankRule')||{}).textContent||'',warn:(document.getElementById('orderWarn')||{}).textContent||'',
      out:(window.__nbhFactsOut()||{}).demands||null};},[tasks,sess,meta]);
 /* ---- R-076 ---- */
 let D=await load(['Math page','Puzzle'],[[0,5,10,3,40,4],[1,5,10,10,'',0],[0,5,10,2,55,3],[1,5,10,10,'',0],[0,5,10,3,30,5],[1,5,10,10,'',0]]);
 const puz=D.rank.find(r=>r[1]==='Puzzle'),mth=D.rank.find(r=>r[1]==='Math page');
 ok('R-076 a task with no problem behavior reads "none in 3" in the ranked table, not the floor 300; the evoking task keeps its number; the Least evocative card says so too',
   puz&&puz[3]==='none in 3'&&mth&&mth[3]==='42'&&/no problem behavior in 3 sessions/.test(D.metrics[3]||'')&&!/300/.test(D.metrics[3]||''),{puz,mth,m:D.metrics});
 D=await load(['Math page','Puzzle'],[[0,5,10,3,40,4],[1,5,10,10,'',0],[0,5,10,2,55,3],[1,5,10,10,'',0],[0,5,10,3,30,5],[1,5,10,10,'',0]],{conseq:'No programmed consequence; the session continues (latency measure only)'});
 ok('R-076 with latency-based sessions the verdict names the clean task as "none in 3 sessions", not "300 s"',/Puzzle the latest \(none in 3 sessions\)/.test(D.verdict)&&!/300 s/.test(D.verdict),D.verdict);
 /* ---- R-077 ---- */
 D=await load(['Math page','Puzzle'],[[0,5,10,3,40,4],[1,5,10,10,'',0]]);
 ok('R-077 one session per task with three planned: the verdict opens "Provisional (1 of 3 sessions per task)." before the differentiation, the first recommendation box repeats it, and the case carries it',
   /^Provisional \(1 of 3 sessions per task\)\. Differentiated: Math page/.test(D.verdict)&&/Add sessions until every task has its 3/.test(D.verdict)&&/Provisional \(1 of 3 sessions per task\):/.test(D.rec1)&&D.out&&/^Provisional \(1 of 3/.test(D.out.verdict)&&D.out.provisional==='Provisional (1 of 3 sessions per task)',{v:D.verdict,rec1:D.rec1.slice(0,300),out:D.out&&D.out.verdict});
 D=await load(['Math page','Puzzle'],[[0,5,10,3,40,4],[1,5,10,10,'',0],[0,5,10,2,55,3]]);
 ok('R-077 one and two sessions: "1 to 2 of 3"; with the three planned sessions on every task, no qualifier',/^Provisional \(1 to 2 of 3 sessions per task\)\./.test(D.verdict),D.verdict);
 D=await load(['Math page','Puzzle'],[[0,5,10,3,40,4],[1,5,10,10,'',0],[0,5,10,2,55,3],[1,5,10,10,'',0],[0,5,10,3,30,5],[1,5,10,10,'',0]]);
 const plan1=await p.evaluate(async()=>{S.sess=S.sess.slice(0,2);renderAll();await draftPlan();return S.meta.plan;});
 ok('R-077 the plan draft carries the qualifier in its verdict line and on the demand-condition line',!/Provisional/.test(D.verdict)&&D.prov===''&&/Verdict: Provisional \(1 of 3 sessions per task\)\. Differentiated/.test(plan1)&&/Demand condition \(EA-1\): Math page\. Provisional \(1 of 3 sessions per task\): add sessions before these are fixed\./.test(plan1),{v:D.verdict,plan:plan1.slice(0,400)});
 /* ---- R-078 ---- */
 const fin=await p.evaluate(()=>{S=blank();renderAll();
   const r1=window.__nbhFactsIn({evidence:{'EA-1':{fn:'Escape',term:'any hit that makes contact; the session ends.'}}});const a=S.meta.stoprule;
   S=blank();renderAll();window.__nbhFactsIn({consent:{state:'Current',on:true,dec:{fa:{stop:'two bites in one session'}}}});const b=S.meta.stoprule;
   S=blank();renderAll();window.__nbhFactsIn({crisis:{beh:'head-banging',stages:[]}});const c=S.meta.stoprule;
   S=blank();S.meta.stoprule='my own rule';renderAll();window.__nbhFactsIn({evidence:{'EA-1':{fn:'Escape',term:'any hit'}}});const d=S.meta.stoprule;
   const txt=document.getElementById('daStopTxt').textContent,unset=document.getElementById('daStopTxt').classList.contains('unset');
   S=blank();renderAll();const txt0=document.getElementById('daStopTxt').textContent,unset0=document.getElementById('daStopTxt').classList.contains('unset');
   return {a,b,c,d,txt,unset,txt0,unset0,field:!!document.querySelector('#daStopRule[data-m="stoprule"]'),out:((window.__nbhFactsOut()||{}).demands||{}).conventions};});
 ok('R-078 the Inventory sheet has "Stop the session when"; the case fills it from EA-1\'s termination criteria, else the parent\'s stop rule (IC-1), else CR-1\'s dangerous behavior; a rule typed by hand stays',
   fin.field&&fin.a==='any hit that makes contact; the session ends (Form EA-1, session termination criteria)'&&fin.b==='two bites in one session (Form IC-1, Specific procedures A)'&&/^At the first instance of head-banging: the session ends and the crisis plan applies \(Form CR-1\)$/.test(fin.c)&&fin.d==='my own rule',fin);
 ok('R-078 the Assessment sheet\'s procedure shows the rule, and flags it while unset',fin.txt==='my own rule.'&&!fin.unset&&/^not set: enter it on the Inventory sheet/.test(fin.txt0)&&fin.unset0,fin);
 /* ---- the simulation, the prints ---- */
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2000);
 const sim=await p.evaluate(()=>({stop:S.meta.stoprule,txt:document.getElementById('daStopTxt').textContent,verdict:document.querySelector('#resVerdict .verdict').textContent,warn:document.getElementById('orderWarn').textContent,
   out:((window.__nbhFactsOut()||{}).demands||{}).conventions.stop}));
 ok('the simulation carries a stop rule (into the case too), its verdict is not provisional (three sessions a task), and its alternating order raises no warning',
   /^First hit or kick that makes contact/.test(sim.stop)&&sim.txt.startsWith(sim.stop.replace(/[.\s]+$/,''))&&/^Differentiated:/.test(sim.verdict)&&sim.warn===''&&sim.out===sim.stop,sim);
 const whole=await print('da142-whole.pdf');
 await setSel('daPrintWhat','presenter');const ps=await print('da142-presenter.pdf');
 const cls=await p.evaluate(()=>document.body.classList.contains('da-pr-presenter')||(document.getElementById('daPS')||{}).innerHTML);
 await setSel('daPrintWhat','');const whole2=await print('da142-whole2.pdf');
 ok('E-35 "The presenter sheet (one page)" prints one page: the pacing, prompting sequence (with the guidance rule), consequence, compliance rule, stop rule, assent signals and a row per task with guidance-stop boxes; nothing of the form; the whole form prints as before afterwards',
   ps.n===1&&/Presenter sheet: demand assessment/.test(ps.all)&&/Prompting sequence/.test(ps.all)&&/light touch/.test(ps.all)&&/After problem behavior/.test(ps.all)&&/Compliance counts when/.test(ps.all)&&/Stop the session when/.test(ps.all)&&/First hit or kick that makes contact/.test(ps.all)&&/says stop \(Form SI-1\)/.test(ps.all)&&/Guidance stops/.test(ps.all)&&/Sorting and matching on the tablet/.test(ps.all)&&!/Ranked Tasks|Demand Inventory|What This Form Builds/.test(ps.all)&&!cls&&whole2.n===whole.n,{n:ps.n,cls,whole:whole.n,again:whole2.n,p1:ps.pages[0]&&ps.pages[0].slice(0,200)});
 ok('R-078 the whole-form print carries the stop rule on the Assessment sheet\'s procedure',/Stop the session when: First hit or kick that makes contact/.test(whole.all),whole.pages.map((t,i)=>i+':'+(/Stop the session when/.test(t))).join(' '));
 /* ---- R-135 ---- */
 const w=await p.evaluate(()=>{const box=document.querySelector('.only-results .res-prose'),t=document.getElementById('rankTbl'),ps=[...box.querySelectorAll('p')];
   return {cols:getComputedStyle(box).columnCount,boxW:box.getBoundingClientRect().width,tblW:t.getBoundingClientRect().width,n:ps.length,ids:ps.map(x=>x.id),rule:ps[0].textContent.slice(0,40),order:box.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING?'prose-then-table':'other'};});
 ok('R-135 the ranking rule and the explanation sit in one block that runs the width of the ranked table, in two reading columns on screen, above the table',
   w.cols==='2'&&w.n===2&&w.ids[0]==='rankRule'&&/^Ranked by mean rate/.test(w.rule)&&w.boxW>=w.tblW*0.98&&w.order==='prose-then-table',w);
 /* ---- E-35 the order warnings ---- */
 const ow=await p.evaluate(()=>{const mk=(rows)=>{S=blank();S.meta={len:'5',nper:'3'};S.tasks=['A task','B task','C task'].map(n=>Object.assign(newTask(),{name:n}));S.sess=rows.map(t=>newSess(t));renderAll();return document.getElementById('orderWarn').textContent;};
   return {rep:mk([0,1,1,2]),fixed:mk([0,1,2,0,2,1,0,1,2]),clean:mk([0,1,2,1,2,0,2,0,1]),none:mk([])};});
 ok('E-35 a task that follows itself is warned about (sessions 2 and 3), a task that opens every round of the order is warned about, and an alternating order that varies raises nothing',
   /^A task follows itself in sessions 2 and 3 \(B task\): what the second session evokes carries over/.test(ow.rep)&&/^A task holds the same place in every round of the order/.test(ow.fixed)&&ow.clean===''&&ow.none==='',ow);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
