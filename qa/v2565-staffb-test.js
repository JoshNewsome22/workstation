/* v25.65 batch 2, parcel STAFFB: the approved research changes to Forms PD-1, RS-1, SV-1 and CF-1 (STAFF H1, H2, H3, H4, H5,
   M1, M2, M3, M4, M5, M6, M7, M8, M12, L4, L5, L6; CARE H5, H6, M8, M9, L2, L3). Each form is opened on its own; the case is
   handed in through the forms' own hooks, as the workstation does. Simulated data only.
   usage: WS_URL=http://127.0.0.1:<port> node qa/v2565-staffb-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const PD='PD-1_Performance-Diagnostic-Checklist_v2026-09.html',RS='RS-1_RBT-Supervision-Log_v2026-10.html',SV='SV-1_Social-Validity_v2026-09.html',CF='CF-1_Contextual-Fit-Assessment_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};

  /* ================= PD-1 ================= */
  const p=await open(PD);
  const h1=await p.evaluate(()=>{['T1','T2','T3'].forEach(id=>S.ans[id]='N');['T4','T5'].forEach(id=>S.ans[id]='Y');['R1','R4','R5','R6'].forEach(id=>S.ans[id]='N');['R2','R3','R7'].forEach(id=>S.ans[id]='Y');
    ['C1','C2','C3','C4','C5','P1','P2','P3','P4','P5'].forEach(id=>S.ans[id]='Y');ITEMS.filter(x=>x.star).forEach(x=>{S.ver[x.id]='emp';});S.meta.emp_when='10/1/26, the assessor';renderAll();const A=analyse();
    return {lead:A.leadCount.code,byCount:A.leadByCount.code,dis:A.disagree,verdict:document.getElementById('scoreVerdict').innerHTML,flags:document.getElementById('flagList').textContent,
      head:document.querySelector('#scoreTbl thead').textContent,guide:document.querySelector('section.only-guide').textContent,hint:document.querySelector('section.only-score').textContent};});
  ok('1 STAFF H1 the rank follows the 1.1 scoring summary: Training (3 of 5, 60%) leads Resources (4 of 7, 57%), which has more NOs; the count is shown beside it and the disagreement explained',
    h1.lead==='T'&&h1.byCount==='R'&&h1.dis&&/Training leads \(3 of 5, 60\.0%\)/.test(h1.verdict)&&/Resources has 7 items, so 4 NO there \(57%\)/.test(h1.flags)&&/% NO of all items \(PDC–HS 1\.1\)/.test(h1.head)&&/this form’s convention/.test(h1.head),h1);
  ok('2 STAFF H1 the printed rule matches the code: N/A stays in the denominator, no "no source" sentence, and no red at 6 NOs',
    /N\/A stays in the denominator/.test(h1.guide)&&/N\/A stays in the denominator/.test(h1.hint)&&!/No source says whether N\/A/.test(h1.guide)&&!/v-no/.test(h1.verdict),h1.verdict);
  const h2=await p.evaluate(()=>{S.ans.P2='N';renderAll();const row=planRows().find(r=>r.k==='feedback');S.sel[row.id]=true;S.meta.staff='Simulated aide';
    return {what:INTERV.feedback.what,steps:document.getElementById('pdFbSteps').textContent,staff:pdStaffPlan()};});
  ok('3 STAFF H2 the feedback row names which feedback, with the steps under the plan table and on the staff member’s page; "strongest evidence" is gone',
    !/strongest evidence/.test(h2.what)&&/own steps/.test(h2.what)&&/rehearsed with the supervisor until they are correct/.test(h2.steps)&&/own integrity across the checks/.test(h2.steps)&&/How feedback will be given/.test(h2.staff)&&/The same day/.test(h2.staff),h2);
  const m1=await p.evaluate(()=>({guide:document.querySelector('section.only-guide').textContent,pres:INTERV.presence,reh:INTERV.rehearsal,comp:INTERV.compete,c4:document.querySelector('[data-c="c4_each"]').closest('label').textContent,
    rows:(()=>{S.ans.P1='N';renderAll();return document.getElementById('planTbl').textContent;})()}));
  ok('4 STAFF M1 the comparison with the published appendix is printed, each plan row names its table, and the 1.1 citations are used',
    /compared line by line with the published instrument/.test(m1.guide)&&!/has not been compared line by line/.test(m1.guide)&&/Mowery, Miltenberger & Weil \(2010\)/.test(m1.pres.cite)&&/2013 table: Mozingo/.test(m1.pres.cite)&&
    /Palmen, Didden & Korzilius/.test(m1.reh.cite)&&/^1\.1 table/.test(m1.reh.basis)&&/Reed, DiGennaro Reed/.test(m1.comp.cite)&&/added by this form/.test(m1.c4)&&/1\.1 table/.test(m1.rows)&&/2013 table/.test(m1.rows),m1);
  const m2=await p.evaluate(()=>{const often=['R7','R4','T4','P4','T5','R2','C1'].every(id=>!!document.querySelector('#row-'+id+' .pd-often'));const f0=document.getElementById('flagList').textContent;
    const el=document.querySelector('[data-m="ba_train"]');el.value='The supervisor answering has none';el.dispatchEvent(new Event('change',{bubbles:true}));
    S.ans.C1='N';renderAll();return {often,f0,f1:document.getElementById('flagList').textContent};});
  ok('5 STAFF M2 the items raters miss most are marked; an untrained respondent and NOs in three domains each add a check',
    m2.often&&/BCBA reviews the answers and the intervention chosen/.test(m2.f1)&&/least accurate with several domains/.test(m2.f1)&&!/BCBA reviews the answers/.test(m2.f0),m2);
  const m3=await p.evaluate(()=>{Object.keys(S.sel).forEach(k=>delete S.sel[k]);const r1=planRows().find(r=>r.k==='bst');S.sel[r1.id]=true;
    Object.assign(S.meta,{ml_start:'2026-09-10',ml1_d:'2026-09-01',ml1_v:'40',ml1_vis:'yes',ml2_d:'2026-09-05',ml2_v:'30',ml2_vis:'no'});renderAll();const a=document.getElementById('pdVis').textContent;
    const r2=planRows().find(r=>r.k==='presence');S.sel[r2.id]=true;renderAll();const b=document.getElementById('pdVis').textContent;
    return {sel:document.querySelectorAll('#mlTbl select[data-m$="_vis"]').length,head:document.querySelector('#mlTbl thead').textContent,a,b};});
  ok('6 STAFF M3 each check records whether the supervisor was visible; the means show apart; the graph-as-feedback note and the presence check appear',
    m3.sel===10&&/Supervisor visible/.test(m3.head)&&/Mean with the supervisor visible: 40 \(1 check\)/.test(m3.a)&&/not visible: 30/.test(m3.a)&&/Do not show this graph to the staff member during this step/.test(m3.a)&&
    /Supervisor presence is the step being tested/.test(m3.b),m3);
  const h3=await p.evaluate(()=>{Object.assign(S.meta,{ml_goal:'90',ml3_d:'2026-09-20',ml3_v:'95',ml3_vis:'yes'});renderAll();const k1=document.getElementById('pdKeep').textContent;
    document.getElementById('pdKeepFill').click();const d=[1,2,3].map(i=>S.meta['mk'+i+'_d']);S.meta.mk1_v='92';S.meta.mk1_ann='Announced';pdMl();
    return {k1,d,warn:document.querySelector('#pdKeep .pd-keepwarn').textContent,svg:document.getElementById('mlPlot').innerHTML,due:window.__nbhDue().map(x=>x.what+' '+x.date)};});
  ok('7 STAFF H3 once the measure reaches the goal, Keeping It opens: checks at 2, 4 and 8 weeks, the thinning schedule, the return rule, a Maintenance phase on the graph, the checks on the due line',
    /Keeping It/.test(h3.k1)&&/The goal was reached on 9\/20\/2026/.test(h3.k1)&&/go back to the last schedule that worked/.test(h3.k1)&&h3.d.join()==='2026-10-04,2026-10-18,2026-11-15'&&
    /at least one of the maintenance checks unannounced/.test(h3.warn)&&/>Maintenance</.test(h3.svg)&&/Goal 90/.test(h3.svg)&&h3.due.filter(x=>/PD-1 maintenance check/.test(x)).length===2,h3);
  const l6=await p.evaluate(()=>{S.ans.C1='N';renderAll();const row=planRows().find(r=>r.k==='clarify');pdInShell=true;S.meta.role='Teacher';pdOpenBtns();
    const a=[...document.querySelectorAll('#planTbl .pd-open')].map(b=>b.dataset.open);S.meta.role='Substitute';pdOpenBtns();const b=[...document.querySelectorAll('#planTbl .pd-open')].map(b=>b.dataset.open);pdInShell=false;return {a,b,row:!!row};});
  ok('8 STAFF L6 for a substitute or other limited-contact role, clarification and prompts open Form EB-1 instead of QS-1',l6.row&&l6.a.includes('QS-1')&&!l6.a.includes('EB-1')&&l6.b.includes('EB-1')&&!l6.b.includes('QS-1'),l6);
  const q=await open(PD);
  const m8=await q.evaluate(()=>{const ask={src:'RS-1',who:'Simulated RBT',role:'RBT (behavior technician)',at:'2026-10-30T12:00:00Z',step:'Records data accurately and at the time',
      concern:'The RBT does not do this checklist step as written: “Records data accurately and at the time”.',measure:'Form RS-1 observation checklist',unit:'% of checklist items scored Yes (Form RS-1)',
      pts:[{d:'2026-10-02',v:80,vis:'yes'},{d:'2026-10-16',v:70,vis:''}]};
    const r=window.__nbhFactsIn({supervision:{form:'RS-1',pdAsk:ask}});const got={r,concern:S.meta.concern,staff:S.meta.staff,role:S.meta.role,ml:[S.meta.ml1_d,S.meta.ml1_v,S.meta.ml1_vis,S.meta.ml2_v].join(),unit:S.meta.ml_unit,why:S.meta.why};
    S.meta.concern='typed by the BCBA';window.__nbhFactsIn({brief:{pdAsk:Object.assign({},ask,{concern:'another'})}});got.kept=S.meta.concern;return got;});
  ok('9 STAFF M8, M12 a request from another form (RS-1 here; QS-1, EB-1 and ST-1 the same way) fills the empty concern, the person, the role and the measure; a typed concern is kept',
    /checklist step as written/.test(m8.concern)&&m8.staff==='Simulated RBT'&&m8.role==='Behavior technician'&&m8.ml==='2026-10-02,80,yes,70'&&/Form RS-1/.test(m8.unit)&&/Form RS-1/.test(m8.why)&&m8.kept==='typed by the BCBA'&&m8.r&&m8.r.filled>0,m8);
  const pf=await q.evaluate(()=>{const old=fromFile({form:'PD-1',rev:'2026-09',S:{meta:{staff:'Simulated',concern:'x'},chk:{},ans:{T1:'N'},ver:{},note:{},sel:{},how:{}}});
    const nw=fromFile(JSON.parse(JSON.stringify({form:'PD-1',S:{meta:{ml_goal:'90',mk1_d:'2026-10-04',mk1_ann:'Unannounced',ml1_vis:'no',ba_train:'Neither has any'},chk:{keep_show:true},ans:{},ver:{},note:{},sel:{},how:{}}})));
    return {old:!!old&&old.ans.T1==='N'&&!old.meta.ml_goal,nw:nw&&[nw.meta.ml_goal,nw.meta.mk1_d,nw.meta.mk1_ann,nw.meta.ml1_vis,nw.meta.ba_train,nw.chk.keep_show].join()};});
  ok('10 PD-1 a file saved before opens as before, and the new values come back from a file',pf.old&&pf.nw==='90,2026-10-04,Unannounced,no,Neither has any,true',pf);

  /* ================= RS-1 ================= */
  const r=await open(RS);
  const base=await r.evaluate(()=>{resetAll();S.setup.rbt_name='Simulated RBT';S.setup.year=String(schoolYearOf(new Date()));
    G.sups=[{id:'s1',name:'Simulated BCBA',cred:'BCBA',cert:'1',role:'RBT Supervisor',trained:'yes',trained_date:'2025-01-01',portal:'yes',norel:true,oversight:'employed',oversight_note:''}];
    const t=new Date(),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),back=n=>{const d=new Date(t);d.setDate(d.getDate()-n);return iso(d);};
    const ck=(nN)=>{const c={};CHECK.forEach((x,j)=>{c[j]=j<nN?'n':'y';});return c;};
    const days=[21,14,7,1].map(n=>back(n));
    days.forEach((d,i)=>{const k=d.slice(0,7);const m=month(k);m.contacts.push({id:'c'+i,date:d,start:'09:00',end:'10:00',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:[],bst:[],sact:[],feedback:i===3?'':'Praised the prompts.',follow:'',ck:ck(i<2?2:0),ann:i<2?'ann':'unann'});});
    curKey=days[3].slice(0,7);renderAll();return {days,k:curKey,n:CHECK.length,last:CHECK[CHECK.length-1],lab:ckBlock(month(curKey).contacts.find(c=>c.id==='c3'),'c3')};});
  ok('11 STAFF L4 the default observation list has a commission item, and the list is named for its length',base.n===11&&/no added reprimand, removal of items or physical hold/.test(base.last)&&/the generic eleven/.test(base.lab),base);
  const h4=await r.evaluate(()=>{const c=month(curKey).contacts.find(x=>x.id==='c3');renderComp();const p1=document.getElementById('compPanel').textContent;
    const card=document.querySelector('details.rs-contact[data-cid="c3"]');const has=!!(card&&card.querySelector('[data-fbrec]')&&card.querySelectorAll('[data-rsfb][data-k="fbSteps"]').length===8&&card.querySelectorAll('[data-rsfb][data-k="fbForm"]').length===5);
    c.fbWhen='later';c.fbLate=c.date;c.fbForm=['person'];c.fbSteps=['data','praise','missed','practice'];c.feedback='Named the missed step and practised it.';renderComp();const p2=document.getElementById('compPanel').textContent;renderMonthOut();
    return {has,p1,p2,out:document.getElementById('monthOut').textContent};});
  ok('12 STAFF H4 each contact records when, in what form and which of the eight feedback steps; an observation without feedback and feedback later than the same day are listed; the record prints them',
    h4.has&&/Observed with a client, no feedback recorded/.test(h4.p1)&&!/no feedback recorded/.test(h4.p2)&&/Feedback given later than the same day/.test(h4.p2)&&/Feedback given: Later.*spoken in person; 4 of 8 steps: collected data on the steps, praised named steps, described each missed step, had the rbt practise until correct/i.test(h4.out),h4);
  const h5=await r.evaluate(()=>{const N1=(()=>{renderComp();return document.getElementById('compPanel').textContent;})();const due=window.__nbhDue().filter(x=>/Next RBT observation/.test(x.what));
    const rules=['obsCrit','obsRun','obsW','obsB','obsBFor','obsM'].map(k=>(document.querySelector('[data-r="'+k+'"]')||{}).value).join();
    return {N1,due,rules,guide:document.querySelector('section.only-guide').textContent};});
  ok('13 STAFF H5 the next observation is due by the form’s practice rule (two checks in a row at the criterion, then every 2 weeks), on the Month page and the due line, labelled as not a BACB rule; its numbers are on the Rules panel',
    /Next observation with feedback (was )?due/.test(h5.N1)&&/every 2 weeks: 2 checks in a row met the 90% criterion/.test(h5.N1)&&/not a BACB rule/.test(h5.N1)&&h5.due.length===1&&h5.rules==='90,2,7,14,28,30'&&/Next observation due/.test(h5.guide),h5);
  const m5=await r.evaluate(()=>{const c=month(curKey).contacts.find(x=>x.id==='c3');c.ckSrc='plan';c.ckItems=[{t:'Delivers the break when the card is handed',crit:true,comp:''},{t:'Praises the request',crit:false,comp:''}];c.ckp={0:'n',1:'y'};
    const c2=Object.values(S.months).flatMap(m=>m.contacts).find(x=>x.id==='c2');Object.assign(c2,{ckSrc:'plan',ckItems:c.ckItems.slice(),ckp:{0:'n',1:'y'}});
    renderContacts();renderComp();return {pill:cSummary(c,curKey),txt:ckText(c),grid:document.getElementById('rsItemGrid').innerHTML,panel:document.getElementById('compPanel').textContent};});
  ok('14 STAFF M5 a critical step scored No marks the contact whatever the percentage; the month’s item grid shows each item and flags one missed twice in a row',
    /Critical step missed: follow up this week/.test(m5.pill)&&/Critical step missed/.test(m5.txt)&&/Critical step missed: follow up this week/.test(m5.panel)&&/ig-n/.test(m5.grid)&&/Missed twice in a row/.test(m5.grid)&&/data-rspd/.test(m5.grid),m5);
  const m8r=await r.evaluate(()=>{const b=document.querySelector('[data-rspd]');b.click();const a=S.pdAsk||{};const fo=window.__nbhFactsOut();return {a,fo:fo&&fo.supervision&&fo.supervision.pdAsk?fo.supervision.pdAsk.step:'',guide:document.querySelector('section.only-guide').textContent,sig:(document.getElementById('rsAskSig')||{}).value};});
  ok('15 STAFF M8 "Find out why first (PD-1)" sends the step and the checklist scores to Form PD-1 through the case; the year-view rule reads find out why, retrain only when the skill is missing',
    /Delivers the break when the card is handed/.test(m8r.a.concern||'')&&Array.isArray(m8r.a.pts)&&m8r.a.pts.length===4&&m8r.a.planstep===true&&m8r.fo==='Delivers the break when the card is handed'&&!!m8r.sig&&
    /below 80%: find out why \(Form PD-1\); retrain only when the skill itself is missing/.test(m8r.guide)&&!/below 80% calls for retraining/.test(m8r.guide),m8r);
  const m4=await r.evaluate(()=>{const t=new Date(),iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),past=new Date(t);past.setDate(past.getDate()-3);
    S.goals=[{id:'g1',goal:'Praises the request',set:iso(past),target:iso(past),status:'In progress',notes:''},{id:'g2',goal:'Records every opportunity',set:iso(past),target:iso(past),status:'Met',notes:'',items:['Praises the request']}];renderRbt();
    const c1=document.querySelector('.rs-goal[data-gid="g1"]').textContent,c2=document.querySelector('.rs-goal[data-gid="g2"]').innerHTML;
    S.goals[1].mcheck='2026-12-01';S.goals[0].often='9 of 10 opportunities';S.goals[0].withRbt='yes';renderRbt();
    return {c1,c2,wr:!!document.querySelector('[data-g="g1"][data-f="withRbt"]'),c1b:document.querySelector('.rs-goal[data-gid="g1"]').textContent,due:window.__nbhDue().map(x=>x.what),gp:rsGoalPrint(S.goals[0])};});
  ok('16 STAFF M4 a goal says when, how often and whether it was set with the RBT ("Not yet specific: add how often" until it does, unless its own words give a number), and its linked checklist item is drawn across the contacts',
    /Not yet specific: add how often/.test(m4.c1)&&!/Not yet specific/.test(m4.c1b)&&m4.wr&&/<svg/.test(m4.c2)&&/Praises the request \(2 of 2 yes\)/.test(m4.c2)&&/how often or how well: 9 of 10 opportunities; set with the RBT: yes/.test(m4.gp),m4);
  ok('17 STAFF H3 a goal set to Met asks for a maintenance check date, which goes on the due line; a goal past its date offers Find out why first (PD-1)',
    /Maintenance check on/.test(m4.c2)&&/set a date, about 2 to 8 weeks out/.test(m4.c2)&&m4.due.some(x=>/RBT goal maintenance check/.test(x))&&/Not met by its target date/.test(m4.c1)&&/Find out why first \(PD-1\)/.test(m4.c1),m4);
  const m6=await r.evaluate(()=>{const C={};Object.values(S.months).forEach(m=>m.contacts.forEach(c=>{C[c.id]=c;}));C.c0.ann='ann';C.c1.ann='ann';C.c2.ann='unann';C.c3.ann='unann';renderYear();const card=document.querySelector('details.rs-contact[data-cid="c3"]');return {sel:!!(card&&card.querySelector('select[data-f="ann"]')),line:document.getElementById('rsAnnYear').textContent};});
  ok('18 STAFF M6 an observed contact is marked announced or unannounced; the Year page shows each mean and the line when unannounced is 10 points or more lower',
    m6.sel&&/announced observations:\s*\d+% \(2\)/.test(m6.line)&&/unannounced:\s*\d+% \(2\)/.test(m6.line)&&/Performance may depend on the supervisor’s presence/.test(m6.line),m6);
  const m7=await r.evaluate(()=>{S.effects=[{id:'e1',date:'2026-10-01',view:'Likes the same-day talk',data:'',change:''}];effPaint();const has=['pWhen','pOften','pForm','pPos'].every(f=>!!document.querySelector('[data-ef="e1"][data-f="'+f+'"]'));
    const s=document.querySelector('[data-ef="e1"][data-f="pPos"]');s.value='yes';s.dispatchEvent(new Event('change',{bubbles:true}));S.effects[0].pWhen='end';S.effects[0].pForm='person';
    return {has,note:!document.querySelector('[data-prefnote="e1"]').hidden,pp:rsPrefPrint(S.effects[0]),fixed:document.querySelector('section.only-rbt').textContent};});
  ok('19 STAFF M7 each review asks when, how often and in what form; praise only is recorded and the corrective steps stay; the fixed line is printed',
    m7.has&&m7.note&&/Prefers feedback: at the end of the session; in person/.test(m7.pp)&&/corrective feedback stays/i.test(m7.pp)&&/Preferences shift as skills are learned, so ask again at each review/.test(m7.fixed),m7);
  const l5=await r.evaluate(()=>{renderSups();const has=!!document.querySelector('[data-sup="s1"][data-f="fbk_date"]')&&!!document.querySelector('[data-sup="s1"][data-f="fbk_met"]');G.sups[0].fbk_date='2026-01-15';G.sups[0].fbk_met='7';
    return {has,due:window.__nbhDue().filter(x=>/feedback skills/.test(x.what)).map(x=>x.date),head:headHTML(curKey),fb:document.querySelector('section.only-guide').textContent};});
  ok('20 STAFF L5 each supervisor card records the supervisor’s own feedback skills check (steps met of 8), on the record and as a yearly reminder; STAFF H2 the Good Practice feedback line is the recipe',
    l5.has&&l5.due.join()==='2027-01-15'&&/feedback skills checked 1\/15\/2026 \(7 of 8 steps\)/.test(l5.head)&&/the missed steps rehearsed until correct/.test(l5.fb)&&/live video rather than by email alone/.test(l5.fb),l5);
  const rf=await r.evaluate(()=>{tidy();const raw=JSON.parse(JSON.stringify(saveObj()));const back=rosterFrom(raw);const c=Object.values(back.rbts[0].months).flatMap(m=>m.contacts).find(x=>x.id==='c3');const g=back.rbts[0].goals;
    const old=fromFile({form:'RS-1',S:{setup:{rbt_name:'Old'},months:{'2026-09':{contacts:[{id:'x',date:'2026-09-09',obs:'yes',ck:{0:'y',9:'n'}}]}},goals:[{id:'g',goal:'Old goal',status:'Met'}]}});
    return {c:c&&[c.fbWhen,c.fbForm.join(),c.fbSteps.length,c.ann].join(),g:g&&[g[0].often,g[0].withRbt,g[1].mcheck,(g[1].items||[]).join()].join(),sup:[back.sups[0].fbk_date,back.sups[0].fbk_met].join(),eff:back.rbts[0].effects&&back.rbts[0].effects[0].pPos,
      old:!!old&&old.months['2026-09'].contacts[0].ck[9]==='n'&&!('fbWhen' in old.months['2026-09'].contacts[0])&&old.goals[0].goal==='Old goal'&&!('mcheck' in old.goals[0])};});
  ok('21 RS-1 the new values come back from a saved file, and a file saved before opens as before',rf.c==='later,person,4,unann'&&rf.g==='9 of 10 opportunities,yes,2026-12-01,Praises the request'&&rf.sup==='2026-01-15,7'&&rf.eff==='yes'&&rf.old,rf);

  /* ================= SV-1 ================= */
  const s=await open(SV);
  const sv=await s.evaluate(()=>{S=blank();S.meta.client='Simulated Student';S.meta.post_n='2';S.meta.pr_change='-50';
    S.resp=[{name:'Simulated student',role:'Student',mode:'Pictorial',anon:'',pre:'9/1/26',post:'10/20/26',cf1:'',cf2:'',note:''},{name:'Simulated parent',role:'Caregiver',mode:'Interview',anon:'',pre:'9/1/26',post:'10/20/26',cf1:'',cf2:'',note:''},
      {name:'Simulated teacher',role:'Teacher (implementer)',mode:'Self-completed',anon:'',pre:'9/1/26',post:'10/20/26',cf1:'',cf2:'',note:''}];
    ['pre','post'].forEach(rd=>ITEMS.forEach(x=>{if(rd==='pre'&&x.s==='E')return;S.resp.forEach((p,i)=>{if(applies(x,p.role))S.rat[rd][key(x.id,i)]='6';});}));
    ['opt','coer','anon','open'].forEach(c=>{S.chk['pre_'+c]=true;S.chk['post_'+c]=true;});renderAll();const v0=verdict().label;
    S.meta.did_ti_drop='Yes';renderAll();const v1=verdict(),sum=document.getElementById('sumVerdict').textContent;
    window.__nbhFactsIn({integrity:{obs:[{date:'2026-10-02',pct:55}],overall:55,criterion:90},caregiver:{followUp:[{date:'2026-10-10',pct:40,crit:50}]},home:{sheets:[{week:'2026-10-05',returned:true},{week:'2026-10-12',returned:false}]}});
    return {v0,v1:v1.label,sum,ti:document.getElementById('svDidTi').textContent,ct:document.getElementById('svDidCt').textContent,hd:document.getElementById('svDidHd').textContent,ok:window.__nbhFactsOut().sv.ok};});
  ok('22 CARE H5 What People Did sits beside the ratings, filled from the case; a line showing the plan dropped turns "Socially valid" into "Ratings and practice disagree"',
    sv.v0==='Socially valid'&&sv.v1==='Ratings and practice disagree'&&/the plan is rated well but not being run/i.test(sv.sum)&&/55% integrity over 1 observation/.test(sv.ti)&&/40% of steps correct/.test(sv.ct)&&/1 of 2 sheets returned/.test(sv.hd)&&sv.ok===false,sv);
  const h6=await s.evaluate(()=>{S.meta.did_ti_drop='';Object.assign(S.meta,{ch_o1_p:'FCT with the break card',ch_o2_p:'Escape extinction with FCT',ch_o2_xp:'ext',ch_default:'2',
      ch_s1_pick:'neither',ch_s2_pick:'1',ch_s3_pick:'neither',ch_s4_pick:'neither',ch_a1_who:'Caregiver',ch_a1_pick:'2',ch_a1_prac:'No'});renderAll();
    return {def:document.getElementById('svChDefNote').textContent,stu:document.getElementById('svChStuSum').textContent,sum:document.getElementById('svChSum').textContent,
      opt:[...document.querySelectorAll('select[data-m="ch_s1_pick"] option')].map(o=>o.textContent).join('|'),did:document.getElementById('svDidCh').textContent,flags:document.getElementById('flagList').textContent};});
  ok('23 CARE H6 Treatment Choice: the options with extinction marked and never the default, the student’s choices with "neither" (a reliable neither is dissent), the adults’ choice after practice, the disagreement and its default resolution',
    /never the default\. Choose another default/.test(h6.def)&&/reliably chose neither: recorded as dissent/.test(h6.stu)&&/Form IC-1/.test(h6.stu)&&/chose before practicing each option/.test(h6.sum)&&/chose differently/.test(h6.sum)&&/adjust the student’s preferred effective option/.test(h6.sum)&&
    /Option 2: Escape extinction with FCT \(marked: extinction\)/.test(h6.opt)&&/Neither \(the control\)/.test(h6.opt)&&/neither 3 of 4/.test(h6.did)&&/reliably chose neither/.test(h6.flags),h6);
  const m8s=await s.evaluate(()=>{S.resp[2].exp='no';Object.keys(S.rat.pre).filter(k=>/^P\d/.test(k)&&k.endsWith('_2')).forEach(k=>S.rat.pre[k]='2');S.rat.post={};S.meta.post_n='';renderAll();
    const grey=document.querySelectorAll('#pTbl_pre td.sv-noexp').length,lab=document.querySelector('#pTbl_pre thead').textContent,v=verdict();
    S.rat.fx[key('P1',1)]='2';S.rat.fx[key('P2',1)]='2';renderAll();const v2=verdict(),fxg=!!document.querySelector('#pTbl_fx select[data-r="fx"]');
    const raw=JSON.parse(JSON.stringify({form:'SV-1',rev:'2026-09',S}));const back=fromFile(raw);
    const old=fromFile({form:'SV-1',S:{meta:{},chk:{},resp:[{name:'a',role:'Caregiver'}],rat:{pre:{G1_0:'5'},post:{}},open:{pre:{},post:{}}}});
    return {grey,lab,v:v.label,pLow:v.pLow,v2:v2.label,v2why:v2.why,fxg,back:back&&[back.resp[2].exp,back.rat.fx[key('P1',1)]].join(),old:!!old&&old.rat.pre.G1_0==='5'&&!old.resp[0].exp};});
  ok('24 CARE M8 a pre-round Procedures rating given before experience is grey and left out of the verdict; the first-experience round is read before the pre round; both come back from a file',
    m8s.grey>0&&/before experience/.test(m8s.lab)&&!m8s.pLow.includes('Implementer')&&m8s.v2==='Acceptability concern'&&/Caregiver/.test(m8s.v2why)&&/first-experience round/.test(m8s.v2why)&&m8s.fxg&&m8s.back==='no,2'&&m8s.old,m8s);
  const m9=await s.evaluate(()=>{Object.assign(S.meta,{peer_meas:'desk tips per hour',peer_stu:'0.5',peer_1:'0',peer_2:'1',peer_3:'0.4'});renderAll();
    return {out:document.getElementById('svPeerOut').textContent,anchor:document.getElementById('svPeerAnchor').textContent,lab:document.querySelector('[data-m="peer_1"]').getAttribute('aria-label')};});
  ok('25 CARE M9 the student beside typical classmates (peer 1 to 3, never named): within the peer range, and the anchor for G3',/Typical classmates: 0 to 1/.test(m9.out)&&/within the peer range/.test(m9.out)&&/Anchor for G3/.test(m9.anchor)&&m9.lab==='Peer 1 value',m9);
  const l3=await s.evaluate(()=>{const t=document.body.textContent;return {a:/predicts low integrity on TI-1/.test(t),b:/predicts escape from the plan/.test(t),c:/Low ratings are a warning to act on\. Ratings and later integrity do not always agree/.test(t)};});
  ok('26 CARE L3 SV-1 no longer claims that ratings predict integrity or escape, and says to check one against the other',!l3.a&&!l3.b&&l3.c,l3);

  /* ================= CF-1 ================= */
  const c=await open(CF);
  const cf=await c.evaluate(()=>{S=blank();ensure();S.raters[0]={name:'Simulated teacher',role:'Classroom teacher',when:'all day',mo:'3'};S.raters[1]={name:'Simulated parent',role:'Caregiver (home plan)',when:'after school',mo:'12'};
    ITEMS.forEach((x,i)=>{S.scores[1][i+'_0']='5';S.scores[1][i+'_1']=x[0]==='R'?'2':'4';});renderAll();
    const home=[...document.querySelectorAll('#cfTbl .cf-home')].map(e=>e.textContent),cmp=document.getElementById('cfHomeCmp').textContent;
    window.__nbhFactsIn({integrity:{missed:[{d:'Gives the break within 5 seconds of the card',n:4},{d:'Records the request',n:7}]}});
    const sel=document.querySelector('[data-cfm="pm_t4_d"]');sel.value='R';sel.dispatchEvent(new Event('change',{bubbles:true}));
    return {home,cmp,list:document.querySelector('[data-f="role"]').getAttribute('list'),map:document.getElementById('cfStepMap').textContent,kept:S.meta.pm_t4_t,enh:document.querySelector('section.only-enh').textContent,guide:document.querySelector('section.only-guide').textContent};});
  ok('27 CARE L2 a caregiver respondent sees the Values, Resources, Routine and support items worded for the home, and the Summary sets school fit and home fit side by side',
    cf.list==='cfRoles'&&cf.home.length===12&&/At home: The things the plan needs are at home/.test(cf.home.join('|'))&&/School Fit and Home Fit/.test(cf.cmp)&&/Resources and time\s*5\.00\s*2\.00/.test(cf.cmp),cf);
  ok('28 CARE L3 each failing step from Form TI-1 is matched to a domain and kept with the record, with the count in low-fit domains; the enhancement line no longer calls a barrier a prediction',
    /Gives the break within 5 seconds of the card/.test(cf.map)&&/1 of 1 failing step fall in a low-fit domain/.test(cf.map)&&cf.kept==='Gives the break within 5 seconds of the card'&&!/is a prediction of where integrity will fall/.test(cf.enh)&&/do not always agree/.test(cf.guide),cf);

  ok('29 no page error on any of the four forms',errs.length===0,errs);
  }catch(e){console.log('FAIL the test stopped: '+(e&&e.stack||e));fails++;}
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
