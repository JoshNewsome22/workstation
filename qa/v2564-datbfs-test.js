/* v25.64 the assessment review (ASSESS), parcel DATBFS: Forms DA-1, TB-1 and FS-1. Simulated data only.
   DA-1  H3  a withdrawal-of-assent behavior that is also a target behavior: the warning beside the stop rule (the rule's own words kept)
         H5  each consequence option says what it does (saved values unchanged); brief escape explained; escape extinction marked
             RESTRICTIVE; with none chosen and no EA-1 in the case, the paired-choice start is offered, not chosen
         H6  the paired-choice demand assessment: every pair once a series, stability, least / most chosen, close calls, time used,
             the plan, the CSV and the case (demands.paired)
         M6  adult attention and peers on the inventory; the attention probe among the modifications
         M7  the student's reasons (Form SI-1) as testable statements; a matching task's "student's reasons" column
         M9  latency sessions up to 10 minutes (10 by default with a long expected latency); 8 to 12 specific tasks; the research rows
   TB-1  M5  "Shared function shown by"; separate columns until it is filled; sepCols to the case
         L1  the cusp criteria of Bosch and Fuqua (2001), counted, saved and reopened
         L2  a precursor card's prompt list and basis field
   FS-1  H7  more than one function per target; the last option split; a synthesized source supports a single component at tier 2
             at most; "Which of these consequences is necessary has not been tested."
         M2  the treatment-as-test check at levels 2 to 4
         M3  Form IA-1's group analyses shown and not counted
         M4  the demand assessment as a method with no tier, its tasks offered, the demands-and-attention check
         M7  the student's reasons into Hypotheses Tested and Set Aside
   And: files saved before v25.64 open as before; no page errors.
   usage: node qa/v2564-datbfs-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(W+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};

  /* =============================== DA-1 =============================== */
  const da=await open('DA-1_Demand-Assessment_v2026-10.html');
  /* an older file first: no paired choice, no attention columns, no explat; the brief escape it saved */
  const OLD={form:'DA-1',rev:'2026-10',S:{meta:{client:'SIMULATED',len:'5',nper:'3',conseq:'Brief escape: materials removed for 30 seconds, then the task resumes (the demand-condition contingency)',stoprule:'First hit'},
    tasks:[{name:'Worksheet A',where:'',len:'',effort:'High',diff:'Above skills',nov:'Familiar',prompt:'',pres:'',cando:'Yes',rating:'5',note:''},{name:'Sorting',where:'',len:'',effort:'Low',diff:'Below skills',nov:'Familiar',prompt:'',pres:'',cando:'Yes',rating:'1',note:''}],
    sess:[{t:'0',min:'5',given:'10',comp:'3',lat:'40',pb:'4',aff:'1'},{t:'1',min:'5',given:'10',comp:'10',lat:'',pb:'0',aff:'5'}],probes:[{a:'0',b:'1',pick:'b',note:''}]}};
  const o=await da.evaluate(d=>{const n=fromFile(d);S=n;renderAll();return {sel:document.getElementById('daConseq').value,shown:document.getElementById('daConseq').selectedOptions[0].textContent,
    pc:S.pc.length,att:S.tasks[0].att,rank:stats().ranked.map(x=>x.name).join('|'),note:document.getElementById('daConseqNote').textContent};},OLD);
  ok('DA-1 old file: opens with its consequence selected (the saved text is the option value), the new parts empty, the ranking as before',
    o.sel===OLD.S.meta.conseq&&/reinforces problem behavior on purpose/.test(o.shown)&&o.pc===0&&o.att===''&&o.rank==='Worksheet A|Sorting'&&/What it does/.test(o.note),o);
  /* H5 the three options and their words */
  const h5=await da.evaluate(()=>{const s=document.getElementById('daConseq');const opts=[...s.options].map(x=>[x.value,x.textContent]);const words={};
    for(const [v] of opts.slice(1)){S.meta.conseq=v;renderConseq();words[conseqKind(v)]=document.getElementById('daConseqNote').textContent;}
    S.meta.conseq='';DA_CASE.ea1=false;renderConseq();const blank=document.getElementById('daConseqNote').innerHTML;DA_CASE.ea1=true;renderConseq();const blankEA=document.getElementById('daConseqNote').innerHTML;DA_CASE.ea1=false;renderConseq();
    document.getElementById('daUseEnd').click();return {opts,words,blank,blankEA,after:S.meta.conseq};});
  ok('H5 the options keep their saved values and say what each does: reinforces on purpose; RESTRICTIVE escape extinction, never the default; one escape per session',
    h5.opts.length===4&&h5.opts[1][0]==='Brief escape: materials removed for 30 seconds, then the task resumes (the demand-condition contingency)'&&h5.opts[2][0]==='No programmed consequence; the session continues (latency measure only)'&&h5.opts[3][0]==='Session ends at the first problem behavior (latency-based session)'&&
    /reinforces problem behavior on purpose/.test(h5.opts[1][1])&&/RESTRICTIVE: escape extinction, never the default/.test(h5.opts[2][1])&&/one escape per session: the least exposure/.test(h5.opts[3][1]),h5.opts);
  ok('H5 brief escape is explained (what it does, why, for how long, what data ends it); the extinction step needs approval and consent; the restraint and stop rule show whatever is chosen',
    /What it does:.*Why:.*For how long:.*What data ends it:/.test(h5.words.esc)&&/School and home teams may use it/.test(h5.words.esc)&&/RESTRICTIVE: escape extinction.*BCBA.*written consent.*never the default/.test(h5.words.ext)&&/latency/.test(h5.words.end)&&
    ['esc','ext','end'].every(k=>/Whatever is chosen: the stop rule .* and the restraint rule apply/.test(h5.words[k])),h5.words);
  ok('H5 nothing chosen: the select stays blank and, with no EA-1 in the case, the paired-choice start is offered (a button sets it); with EA-1 in the case it is not',
    /No functional analysis \(Form EA-1\) is in the case/.test(h5.blank)&&/daUseEnd/.test(h5.blank)&&!/daUseEnd/.test(h5.blankEA)&&/Not chosen yet/.test(h5.blankEA)&&h5.after==='Session ends at the first problem behavior (latency-based session)',h5);

  /* the worked example */
  await da.evaluate(()=>loadSim());await sleep(1200);
  const sim=await da.evaluate(()=>{const P=pcStats();return {warn:[...document.querySelectorAll('[data-daw]')].map(e=>e.hidden?'':e.textContent),
    li:[...document.querySelectorAll('#pgRule li')].map(x=>x.childNodes[0].textContent)[3],ps:daPresenterHtml(),
    P:{n:P.nSer,sers:P.sers,done:P.done,stable:P.stable,least:P.least.map(x=>x.name),most:P.most.map(x=>x.name),close:P.close.map(x=>x.name),min:P.minutes},
    res:document.getElementById('pcRes').textContent,plan:S.meta.plan,out:window.__nbhFactsOut().demands,cols:[...document.querySelectorAll('#taskTbl thead th')].map(x=>x.textContent),
    att:S.tasks.map(t=>t.att).join('|'),feat:stats().all[0].feat.join(', '),guide:document.querySelector('.only-guide').textContent,refs:document.getElementById('daRefs').textContent};});
  ok('H3 the worked example: the assent signal "pushes the materials away" matches the target behavior, and the warning shows beside the stop rule (Inventory, physical-guidance rule, Before the First Session, the procedure)',
    sim.warn.length===4&&sim.warn.every(w=>/^This is also a target behavior\./.test(w)&&/pushes the materials away/.test(w)&&/ending the session reinforces it\. Teach a direct “stop” response now/.test(w)&&/Honor that response at once, every time/.test(w)&&/safety and stop rules of the plan or of Form EA-1/.test(w)),sim.warn);
  ok('H3 the stop rule keeps its approved words, and the presenter sheet carries the warning on its "says stop" row',
    sim.li==='If the student says no in one of the ways the assent plan (Form SI-1) describes, or is still upset after the calm pause, stop the session, and enter the minutes actually run.'&&/The student says stop \(Form SI-1\)<\/th><td class="ps-flag">.*This is also a target behavior/.test(sim.ps)&&/Reinforces problem behavior on purpose/.test(sim.ps),{li:sim.li});
  const h3=await da.evaluate(()=>{const keep=[S.meta.preAssent,S.meta.target];S.meta.preAssent='Says “stop”; hands over the stop card';S.meta.target='Aggression (hitting)';DA_CASE.signs=[];DA_CASE.labels=[];renderAssentWarn();
    const none=[...document.querySelectorAll('[data-daw]')].every(e=>e.hidden);
    window.__nbhFactsIn({behaviors:[{label:'Throwing materials'}],student:{stop:{signs:'throws the pencil; says no'}}});const hit=document.querySelector('[data-daw]').textContent;
    S.meta.preAssent=keep[0];S.meta.target=keep[1];DA_CASE.signs=[];DA_CASE.labels=[];renderAssentWarn();return {none,hit};});
  ok('H3 a direct "stop" alone raises no warning; a sign from the case (Form SI-1) that matches a Form TB-1 label does',h3.none&&/“throws the pencil” \(how the student says no\) and “Throwing materials” \(the target behavior\)/.test(h3.hit),h3);
  ok('H6 the worked example: two series, every pair of six tasks once each (30 trials), stable; least chosen subtraction and reading aloud (a close call), most chosen sorting and clean-up; 26 minutes',
    sim.P.n===2&&sim.P.sers===2&&sim.P.done===30&&sim.P.stable&&sim.P.least.join('|')==='Subtraction worksheet with regrouping|Reading aloud to the teacher'&&sim.P.close.join('|')==='Reading aloud to the teacher'&&
    sim.P.most.join('|')==='Sorting and matching on the tablet|Clean-up and putting materials away'&&sim.P.min===26,sim.P);
  /* v25.67 fx2: the Results sheet is read on screen, where the shared layout writes its headings in sentence case */
  ok('H6 the Results sheet ranks least chosen first, names the candidates and the fading starters, and shows the time used beside the result',
    /Paired-Choice Ranking/i.test(sim.res)&&/Stable after 2 series/.test(sim.res)&&/Time used: 26 minutes over 2 series; the sessions on this form: 89 minutes\./.test(sim.res)&&/Candidates for the demand condition \(least chosen\)/.test(sim.res)&&/a close call/.test(sim.res)&&/Where demand fading starts \(most chosen\)/.test(sim.res),sim.res.slice(0,600));
  ok('H6 the plan and the case carry the paired-choice ranking (demands.paired); demands.fa stays the session result',
    /Paired-choice demand assessment: 2 series, 30 trials\./.test(sim.plan)&&sim.out.paired&&sim.out.paired.least.map(x=>x.name).join('|')==='Subtraction worksheet with regrouping|Reading aloud to the teacher'&&sim.out.paired.stable===true&&
    sim.out.fa.map(x=>x.name).join('|')==='Subtraction worksheet with regrouping|Reading aloud to the teacher|Copying sentences (handwriting)'&&/Reinforces problem behavior on purpose/.test(sim.out.conventions.conseqNote),{plan:sim.plan.slice(-500),paired:sim.out.paired});
  const h6=await da.evaluate(()=>{S=blank();ensure();['Task 1 test','Task 2 test','Task 3 test','Task 4 test'].forEach((n,i)=>{S.tasks[i]=S.tasks[i]||newTask();S.tasks[i].name=n;});renderAll();
    pcGen();const pairs=S.pc.map(p=>[+p.a,+p.b].sort().join('-')).sort();
    /* the student always picks the lower-numbered task; no sessions */
    S.pc.forEach(p=>{p.pick=+p.a<+p.b?'a':'b';});S.pcSer[0].min='9';renderAll();const P1=pcStats();
    pcGen();S.pc.filter(p=>p.ser==='2').forEach(p=>{p.pick=+p.a<+p.b?'a':'b';});S.pcSer[1].min='8';renderAll();const P2=pcStats();
    const out=window.__nbhFactsOut().demands;const rows=document.querySelectorAll('#pcTbl tbody tr').length;
    let csv='';const oc=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{csv=t;});return 'blob:x';};document.getElementById('csvBtn').click();URL.createObjectURL=oc;
    return new Promise(r=>setTimeout(()=>r({pairs,rows,s1:P1.stable,s2:P2.stable,least:P2.least.map(x=>x.name),most:P2.most.map(x=>x.name),out,csv}),300));});
  ok('H6 Write a series lists every pair once (4 tasks, 6 pairs); one series is not yet stable, two identical series are',
    JSON.stringify(h6.pairs)==='["0-1","0-2","0-3","1-2","1-3","2-3"]'&&h6.rows===12&&!h6.s1&&h6.s2&&h6.least.join('|')==='Task 4 test'&&h6.most.join('|')==='Task 1 test',h6);
  ok('H6 with no sessions the case gets the paired-choice ranking alone (no tasks named for the demand condition), and the CSV holds the trials and the ranking',
    h6.out&&h6.out.rule==='paired-choice'&&h6.out.fa.length===0&&h6.out.paired.least[0].name==='Task 4 test'&&/"Paired-choice trial"/.test(h6.csv)&&/"Paired-choice rank"/.test(h6.csv)&&/Time used: 17 minutes over 2 series/.test(h6.csv),{out:h6.out,csv:h6.csv.slice(-400)});
  ok('M6 the inventory has the adult-attention, peers and student\'s-reasons columns; the worked example fills attention and peers; close attention is a feature',
    sim.cols.includes('Adult attention during the task')&&sim.cols.includes('Peers present')&&sim.cols.includes('The student’s reasons (Form SI-1)')&&sim.att==='Close and frequent|Occasional|Close and frequent|Occasional|Little|Little'&&/close adult attention/.test(sim.feat),{cols:sim.cols,att:sim.att,feat:sim.feat});
  const m6=await da.evaluate(()=>{S=blank();ensure();S.meta.len='5';S.meta.nper='1';
    S.tasks=[Object.assign(newTask(),{name:'Copying the date',effort:'Low',diff:'At skills',cando:'Yes',att:'Close and frequent'}),Object.assign(newTask(),{name:'Sorting',effort:'Low',diff:'Below skills',cando:'Yes'})];
    S.sess=[Object.assign(newSess(0),{min:'5',given:'10',comp:'4',lat:'20',pb:'5'}),Object.assign(newSess(1),{min:'5',given:'10',comp:'10',lat:'',pb:'0'})];renderAll();
    return recommend(stats()).mods.find(x=>x.o.name==='Copying the date').m.join(' ');});
  ok('M6 an easy task within the student\'s skills that still evokes the behavior gets the probe of high against low adult attention and praise against no praise',
    /Probe the adult attention: run the task with the adult close and attending often against the adult at a distance, and with praise for working against no praise/.test(m6)&&/close and frequent/.test(m6)&&/Moore & Edwards, 2003; Cooper et al., 1992/.test(m6),m6);
  const m7=await da.evaluate(()=>{S=blank();ensure();S.meta.target='Aggression: hitting';S.tasks=[Object.assign(newTask(),{name:'Subtraction worksheet, math block'}),Object.assign(newTask(),{name:'Sorting on the tablet'})];renderAll();
    const r=window.__nbhFactsIn({student:{hard:[{act:'Math block',hard:true,long:true,boring:false,noisy:false,people:false,note:''},'Hallway transitions (noisy, the people)']}});
    return {r,said:S.said,stu:S.tasks.map(t=>t.stu),box:document.getElementById('daSaid').textContent};});
  ok('M7 the student\'s reasons become testable statements; the matching task takes them in its column; an unmatched one is offered as a task',
    m7.said.length===2&&m7.said[0].line==='The student’s aggression is more likely when math block is too hard or is too long; test: easier versus usual materials; shorter versus usual length.'&&
    /when hallway transitions is noisy or has the people the student named; test: a quieter place versus the usual; with versus without those people/.test(m7.said[1].line)&&m7.stu[0]==='too hard; too long (the student’s report)'&&
    /The student’s report; confirm by a brief classroom comparison or by the sessions of this form/.test(m7.box)&&/not on the inventory yet/.test(m7.box)&&/Add as a task/.test(m7.box),m7);
  const m9=await da.evaluate(()=>{S=blank();ensure();S.meta.conseq='Session ends at the first problem behavior (latency-based session)';S.meta.explat='Long: several minutes, or often none in a session';renderAll();
    const a=sessLen(),ns=newSess(0).min,note=document.getElementById('daLenNote').textContent;S.meta.explat='';renderAll();const b=sessLen();S.meta.conseq='Brief escape: materials removed for 30 seconds, then the task resumes (the demand-condition contingency)';S.meta.explat='Long: several minutes, or often none in a session';const c=sessLen();
    S.tasks=[Object.assign(newTask(),{name:'Math'}),Object.assign(newTask(),{name:'Worksheet with 20 problems'})];renderInv();
    return {a,ns,note,b,c,inv:document.getElementById('invVerdict').textContent,ph:(f=>f.placeholder||f.getAttribute('data-fx2-ph')||'')(document.querySelector('[data-m="len"]')),   /* v25.67 fx2: on screen the layout keeps a box's words in data-fx2-ph */hint:document.querySelector('.only-inventory').textContent};});
  ok('M9 latency sessions with a long expected latency default to 10 minutes (5 otherwise); up to 10 in the placeholder',m9.a===10&&m9.ns==='10'&&/10 minutes/.test(m9.note)&&m9.b===5&&m9.c===5&&/up to 10 with latency-based sessions/.test(m9.ph),m9);
  ok('M9 8 to 12 specific tasks: the inventory says so, prints the type-of-task line, and flags a category name',
    /Only 2 tasks listed: 8 to 12 candidate tasks are recommended/.test(m9.inv)&&/“Math” is a category, not a task/.test(m9.inv)&&/The type of task does not predict which ones evoke problem behavior\. List specific tasks, not categories/.test(m9.hint),m9.inv);
  ok('M9 What the Research Supports adds Call et al. (2016) and Zangrillo et al. (2020), with their references',
    /Latency sessions need room.*11 of the 12.*5 of 12.*7 of the 12/.test(sim.guide)&&/Paired choice is quicker.*all 4 participants.*about 35 minutes/.test(sim.guide)&&/Call, N\. A\., Miller, S\. J\.,.*\(2016\)/.test(sim.refs)&&/Zangrillo, A\. N\., Simmons, C\. A\., Fisher, W\. W\., & Owen, T\. M\. \(2020\)/.test(sim.refs)&&/Moore, J\. W\., & Edwards/.test(sim.refs)&&/Morris, C\., Oliveira/.test(sim.refs),'guide');
  await da.evaluate(()=>loadSim());await sleep(1000);
  const rt=await da.evaluate(()=>{const d=JSON.parse(JSON.stringify({form:'DA-1',rev:'2026-10',S}));const n=fromFile(d);return {pc:n.pc.length,ser:n.pcSer.length,said:n.said.length,att:n.tasks[0].att,stu:n.tasks[0].stu};});
  ok('DA-1 a file saved now reopens with the paired-choice trials, the series and the new columns',rt.pc===30&&rt.ser===2&&rt.att==='Close and frequent',rt);

  /* =============================== TB-1 =============================== */
  const tb=await open('TB-1_Target-Behavior-Development_v2026-09.html');
  const T0=await tb.evaluate(()=>window.tb125.collect());
  await L.loadSim(tb);await sleep(2500);
  const tbS=await tb.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e.type==='checkbox')e.checked=v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    const v0=document.getElementById('clusVerdict0').textContent,out0=window.__nbhFactsOut().behaviors[0];
    s('clus[0].sepcol',false);const v1=document.getElementById('clusVerdict0').textContent;s('clus[0].shown','EA-1, 10/14/26 (simulated)');const v2=document.getElementById('clusVerdict0').textContent,out2=window.__nbhFactsOut().behaviors[0];
    s('cand[0].cu1',true);s('cand[0].cu4',true);s('cand[0].cu5',true);const n=document.querySelector('#candBody .tb1-cuspn').textContent;
    const pv0=document.getElementById('tbPrec1').hidden;s('tgt[1].type','Precursor');const pv1=document.getElementById('tbPrec1').hidden,pt=document.getElementById('tbPrec1').textContent;s('tgt[1].basis','Ranked by informants');
    const d=window.tb125.collect(),out3=window.__nbhFactsOut().behaviors[1];window.tb125.restore(d);
    return {v0,v1,v2,sep0:out0.sepCols,sh2:out2.sharedShown,sep2:out2.sepCols,n,pv0,pv1,pt,basisOut:out3.basis,re:{n:document.querySelector('#candBody .tb1-cuspn').textContent,cu:document.querySelector('[name="cand[0].cu4"]').checked,basis:document.querySelector('[name="tgt[1].basis"]').value,shown:document.querySelector('[name="clus[0].shown"]').value,prec:document.getElementById('tbPrec1').hidden},
      method:document.getElementById('cluster').textContent};});
  ok('M5 the cluster keeps separate columns until a shared function is shown: with separate columns planned it says so and the case gets each member (sepCols)',
    /Passes the clustering rule/.test(tbS.v0)&&/each member keeps its own column on the OB-1, ABC-1 and EA-1 data sheets, and the sum is graphed as well/.test(tbS.v0)&&Array.isArray(tbS.sep0)&&tbS.sep0.length===3,{v0:tbS.v0.slice(-400),sep0:tbS.sep0});
  ok('M5 with no separate columns and nothing under "Shared function shown by", a check; filled, the columns may be collapsed and the case says what showed it',
    /Incomplete/.test(tbS.v1)&&/Record each member in its own column on the OB-1, ABC-1 and EA-1 data sheets until a functional analysis/.test(tbS.v1)&&/Passes the clustering rule/.test(tbS.v2)&&/Shared function shown by EA-1, 10\/14\/26 \(simulated\): the members may share one column/.test(tbS.v2)&&tbS.sh2==='EA-1, 10/14/26 (simulated)'&&!tbS.sep2&&
    /During assessment, each member gets its own column/.test(tbS.method)&&/Bell &amp; Fahmie, 2018|Bell & Fahmie, 2018/.test(tbS.method),{v1:tbS.v1.slice(-300),v2:tbS.v2.slice(-200)});
  ok('L1 the cusp criteria (Bosch & Fuqua, 2001) are ticked and counted, and saved and reopened',tbS.n==='3 of 5 criteria'&&tbS.re.n==='3 of 5 criteria'&&tbS.re.cu===true,tbS.re);
  ok('L2 a precursor card shows the reported precursors (Fahmie & Iwata, 2011) and a basis field; the basis is saved, reopened and sent to the case',
    tbS.pv0===true&&tbS.pv1===false&&/unintelligible vocalization before aggression \(27%\) and before property destruction \(29%\); self-directed or nondirected movement before self-injury \(32%\)/.test(tbS.pt)&&/Only one precursor was reported for behavior maintained by automatic reinforcement/.test(tbS.pt)&&
    /Confirm by observation/.test(tbS.pt)&&tbS.basisOut==='Ranked by informants'&&tbS.re.basis==='Ranked by informants'&&tbS.re.prec===false,{pt:tbS.pt.slice(0,300),re:tbS.re,b:tbS.basisOut});
  const tbOld=await tb.evaluate(d=>{window.tb125.restore(d);return {n:document.querySelector('#candBody .tb1-cuspn')&&document.querySelector('#candBody .tb1-cuspn').textContent,prec:[...document.querySelectorAll('.tb1-prec')].every(x=>x.hidden)};},T0);
  ok('TB-1 a file saved before (no criteria, no basis, no shared-function field) opens with them empty',tbOld.n==='0 of 5 criteria'&&tbOld.prec,tbOld);

  /* =============================== FS-1 =============================== */
  const fs=await open('FS-1_FBA-Summary-Report_v2026-09.html');
  const f7=await fs.evaluate(()=>{S=blank();ensure();const g=S.beh[0];Object.assign(g,{lab:'Aggression (simulated)',fn:'Escape / avoidance (social negative)',ant:'a demand',cons:'the demand removed',alt:'asks for a break',altCons:'a break'});
    g.more=[{fn:'Tangible / activity (social positive)',ant:'the tablet taken away',cons:'the tablet back',alt:'asks for the tablet',altCons:'the tablet',desired:'',desCons:''}];
    S.src=[{form:'EA-1',method:'Functional analysis, analogue conditions',fn:'Escape / avoidance (social negative)',str:'Strong',tgt:'',contrib:'',dates:'',who:''},
      {form:'EA-1',method:'Functional analysis, analogue conditions',fn:'Tangible / activity (social positive)',str:'Strong',tgt:'',contrib:'',dates:'',who:''}];renderAll();
    const st=[...document.querySelectorAll('#stmtOut .stmt')].map(x=>x.textContent),rep=document.getElementById('reportOut').textContent,out=window.__nbhFactsOut();
    fsPart=1;renderBehBar();drawPath();const path=document.getElementById('pathSvg').textContent,bar=document.getElementById('pathPartBar').textContent;
    const opts=[...document.querySelector('#behForm select[data-b="fn"]').options].map(o=>o.textContent);
    return {st,rep,stmts:out.fn.statements,more:out.behaviorsFS[0].more,path,bar,opts};});
  ok('H7 a target with two functions: each has its own statement (level 1 from its own isolated condition), recommendation, pathway and place in the case',
    f7.st.length===2&&/The function is escape \/ avoidance \(level 1, demonstrated\)\./.test(f7.st[0])&&/When the tablet taken away occurs, aggression \(simulated\) is more likely, which results in the tablet back\. The function is tangible \/ activity \(level 1, demonstrated\)\./.test(f7.st[1])&&
    /Aggression \(simulated\), function 2 \(tangible \/ activity\)\. Alternative behavior to teach: asks for the tablet/.test(f7.rep)&&f7.stmts.length===2&&f7.more.length===1&&/asks for the tablet/.test(f7.path)&&/Function 2: tangible/.test(f7.bar),f7);
  ok('H7 the last option is split in two; the old "Synthesized / more than one" is not offered for a new choice',
    f7.opts.includes('Multiple: separate functions shown in isolated conditions')&&f7.opts.includes('Synthesized: the consequences were tested together; components not isolated')&&!f7.opts.includes('Synthesized / more than one (as tested)'),f7.opts);
  const syn=await fs.evaluate(()=>{S=blank();ensure();const g=S.beh[0];Object.assign(g,{lab:'Aggression (simulated)',fn:'Escape / avoidance (social negative)',ant:'a demand',cons:'a break with the tablet'});
    S.src=[{form:'EA-1',method:'Functional analysis, synthesized contingencies (IISCA)',fn:'Escape / avoidance (social negative)',str:'Strong',tgt:'',contrib:'IISCA, differentiated',dates:'',who:''}];renderAll();
    const capped={band:evidence('Escape / avoidance (social negative)').band,stmt:stmtText(g),conv:document.getElementById('convNote').textContent};
    S.src.push({form:'EA-1',method:'Functional analysis, analogue conditions',fn:'Escape / avoidance (social negative)',str:'Strong',tgt:'',contrib:'',dates:'',who:''});renderAll();const iso=evidence('Escape / avoidance (social negative)').band;
    S.src=[{form:'EA-1',method:'Functional analysis, trial-based or IISCA',fn:'Synthesized: the consequences were tested together; components not isolated',str:'Strong',tgt:'',contrib:'IISCA',dates:'',who:''}];g.fn=S.src[0].fn;renderAll();
    const whole={band:evidence(g.fn).band,html:document.getElementById('stmtOut').textContent,rep:document.getElementById('reportOut').textContent};
    S=blank();ensure();window.__nbhFactsIn({evidence:{'EA-1':{form:'EA-1',method:'Functional analysis (multielement)',fn:'More than one',fnKey:'multiple',strength:'Strong',statement:'Two functions.',n:20}}});const an=S.src.find(x=>x.form==='EA-1').fn;
    S=blank();ensure();S.beh[0].fn='Synthesized / more than one (as tested)';renderAll();const legacy=[...document.querySelector('#behForm select[data-b="fn"]').options].some(o=>o.selected&&o.textContent==='Synthesized / more than one (as tested)');
    return {capped,iso,whole,an,legacy};});
  ok('H7 a synthesized source supports a single component at tier 2 at most (the table says why), and at tier 1 once an isolated condition confirms it',
    syn.capped.band===2&&/consistent with the descriptive record and not yet tested \(level 2\)/.test(syn.capped.stmt)&&/supported by a synthesized test \(EA-1\), so counted at tier 2 at most/.test(syn.capped.conv)&&syn.iso===1,syn.capped);
  ok('H7 the synthesized result itself stands at tier 1, and its statement prints "Which of these consequences is necessary has not been tested."',
    syn.whole.band===1&&/Which of these consequences is necessary has not been tested\./.test(syn.whole.html)&&/Which of these consequences is necessary has not been tested\./.test(syn.whole.rep),syn.whole);
  ok('H7 an analogue analysis with more than one function reaches the table as Multiple (isolated); a file holding the old option opens with it selected',syn.an==='Multiple: separate functions shown in isolated conditions'&&syn.legacy,syn);
  /* M2 */
  await fs.evaluate(()=>loadSim());await sleep(1200);
  const m2=await fs.evaluate(()=>{const a={shown:!document.getElementById('fsTxTest').hidden,ready:document.getElementById('fsReady').textContent,rep:document.getElementById('reportOut').textContent};
    S.meta.txTest='';S.meta.txWorks='';S.meta.txFail='';renderAll();const b={ready:document.getElementById('fsReady').textContent,rep:document.getElementById('reportOut').textContent};
    S.meta.nextKind='A functional analysis first (Form EA-1)';renderAll();const c={shown:!document.getElementById('fsTxTest').hidden,rep:document.getElementById('reportOut').textContent};return {a,b,c};});
  ok('M2 level 2 and treatment next: the three fields show and print under "What would change this conclusion"; the worked example is ready to sign',
    m2.a.shown&&/^Ready to sign:/.test(m2.a.ready)&&/What would change this conclusion.*Treatment as a test\. The hypothesis has not been tested by a functional analysis, so the treatment is the test\. Procedure: Functional communication training.*It counts as working when aggression at least 80% below.*If it does not work: a functional analysis \(Form EA-1\)/.test(m2.a.rep),m2.a);
  ok('M2 with the fields empty the readiness check asks for the procedure and the criterion, and the report says "not more indirect data"; with an FA next, no check',
    /the treatment as a test: which function-based procedure; what counts as the treatment working/.test(m2.b.ready)&&/If it does not work: a functional analysis \(Form EA-1\), not more indirect data\./.test(m2.b.rep)&&!m2.c.shown&&!/Treatment as a test\./.test(m2.c.rep),{b:m2.b.ready,c:m2.c.shown});
  /* M3 */
  const m3=await fs.evaluate(()=>{S=blank();ensure();
    const ia={form:'IA-1',method:'FAST and QABF',fn:'Escape',fnKey:'escape',strength:'Moderate',statement:'Escape by consensus.',n:5,dates:'10/1/26',by:'BCBA',
      groups:[{key:'all',name:'All informants'},{key:'school',name:'School',codes:['A','B'],label:'Escape',fnKey:'escape',strength:'Moderate',perInst:[]},{key:'home',name:'Home',codes:['C'],label:'Escape',fnKey:'escape',strength:'Weak',perInst:[]}]};
    window.__nbhFactsIn({evidence:{'IA-1':ia}});const rows=S.src.filter(r=>r.form==='IA-1');const C=convergence();const esc=C.rows.find(r=>/^Escape/.test(r.fn));
    const cells=[...document.querySelectorAll('#srcTbl tbody tr')].map(tr=>tr.cells[0].textContent);
    /* an older file: the group rows without the mark */
    rows.forEach(r=>{delete r.same;});renderAll();const before=convergence().rows.find(r=>/^Escape/.test(r.fn)).n,note=document.getElementById('convNote').textContent;document.getElementById('fsSameBtn').click();const after=convergence().rows.find(r=>/^Escape/.test(r.fn)).n;
    return {n:rows.length,same:rows.filter(r=>r.same).length,counted:esc.n,cells,before,after,note};});
  ok('M3 Form IA-1\'s group rows are shown ("same informants as row 1: not counted") and only its own row counts; an older file\'s group rows are offered a "count once" button',
    m3.n===3&&m3.counted===1&&m3.cells.filter(c=>/same informants as row 1: not counted/.test(c)).length===2&&m3.before===3&&/look like Form IA-1’s analyses by group/.test(m3.note)&&m3.after===1,m3);
  /* M4 and M7 */
  const m4=await fs.evaluate(()=>{S=blank();ensure();S.beh[0].lab='Aggression (simulated)';renderAll();
    const r=window.__nbhFactsIn({demands:{form:'DA-1',dates:'10/2/26',verdict:'Differentiated',fa:[{name:'Subtraction worksheet'},{name:'Copying sentences'}],high:[{name:'Sorting on the tablet'}]},
      student:{hard:[{act:'Math (period 4)',hard:true,long:true,boring:false,noisy:false,people:true,note:''}]}});
    const row=S.src.find(x=>x.form==='DA-1'),C=convergence(),conv=document.getElementById('convNote').textContent;
    const btn=document.querySelector('[data-daoffer="ant"]');const offer=btn&&btn.textContent;btn.click();
    return new Promise(res=>setTimeout(()=>{const ant=S.beh[0].ant;document.querySelector('[data-daoffer="desired"]').click();
      setTimeout(()=>{const des=S.beh[0].desired;S.beh[0].fn='Attention (social positive)';renderAll();
        res({r,row,tier:tierOf(row.method),notFn:C.notFn.length,conv,offer,ant,des,chk:document.getElementById('stmtOut').textContent,hyp:S.hyp.filter(x=>x.h).map(x=>[x.h,x.how,x.out]),methods:METHODS.map(m=>m[0]),guide:document.querySelector('.only-guide').textContent});},200);},200));});
  ok('M4 the demand assessment is a method with no tier, its row placed from the case once, listed and not counted',
    m4.row&&m4.row.method==='Demand assessment (identifies antecedents; does not test the consequence)'&&m4.tier===0&&m4.notFn===1&&/Tasks that evoke problem behavior: Subtraction worksheet; Copying sentences/.test(m4.row.contrib)&&/demand assessments/.test(m4.conv),m4.row);
  ok('M4 its tasks are offered into the antecedent ("when asked to …") and its high-probability tasks into the desired behavior',
    /Antecedent: when asked to do subtraction worksheet or copying sentences/.test(m4.offer)&&m4.ant==='when asked to do subtraction worksheet or copying sentences'&&/sorting on the tablet; Form DA-1/.test(m4.des),{offer:m4.offer,ant:m4.ant,des:m4.des});
  ok('M4 an antecedent that names demands with an attention function carries the check (Repp & Karsh, 1994)',/Check: demands may signal that attention is available\. Confirm with the attention and demand conditions/.test(m4.chk),m4.chk);
  ok('M7 the student\'s reasons (Form SI-1) reach Hypotheses Tested and Set Aside as testable statements, the outcome left blank',
    m4.hyp.length===1&&/^The student’s aggression \(simulated\) is more likely when math \(period 4\) is too hard, is too long or has the people the student named; test: easier versus usual materials; shorter versus usual length; with versus without those people/.test(m4.hyp[0][0])&&
    m4.hyp[0][1]==='The student’s report; confirm by a brief classroom comparison or Form DA-1'&&m4.hyp[0][2]==='',m4.hyp);
  ok('H7, M2, M3, M4 the Guide states the rules and cites the studies',/Multiple control and synthesized results/.test(m4.guide)&&/16\.9% of 521/.test(m4.guide)&&/Treatment as a test/.test(m4.guide)&&/65\.4% \(17 of 26\)/.test(m4.guide)&&/80\.6%.*84\.6%/.test(m4.guide)&&/Smith, Smith, Dracobly &amp; Pace, 2012|Smith, Smith, Dracobly & Pace, 2012/.test(m4.guide)&&/Repp and Karsh \(1994\)/.test(m4.guide),'guide');
  const fsOld=await fs.evaluate(()=>{const d={form:'FS-1',rev:'2026-09',S:{meta:{client:'SIMULATED'},src:[{form:'EA-1',method:'Functional analysis, analogue conditions',dates:'',who:'',contrib:'',fn:'Escape / avoidance (social negative)',str:'Strong'}],hyp:[],beh:[{lab:'Aggression',fn:'Escape / avoidance (social negative)',ant:'a demand',cons:'the demand removed'}],cur:0,xa:{}}};
    S=Object.assign(blank(),d.S);renderAll();return {stmt:document.getElementById('stmtOut').textContent,parts:document.querySelectorAll('.fs-part').length,tx:document.getElementById('fsTxTest').hidden};});
  ok('FS-1 a file saved before opens as before: one statement, no further function, no treatment check',/The function is escape \/ avoidance \(level 1, demonstrated\)\.$/.test(fsOld.stmt)&&fsOld.parts===0&&fsOld.tx,fsOld);

  ok('no page errors',errs.length===0,errs);
 }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
