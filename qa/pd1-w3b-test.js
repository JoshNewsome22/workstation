/* Form PD-1, review Wave 3 minors and improvements: what the case already knows (F254), verified means on record (F255),
   the worked example (F256), the business-setting questions behind a switch (F257), each plan row opens its form (I127),
   the measure before and after (I128), the staff member's one-page plan (I129). Simulated data only.
   usage: node qa/pd1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');const {execFileSync}=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const PD='PD-1_Performance-Diagnostic-Checklist_v2026-09.html';const OUT=__dirname+'/out/pd1-w3b';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};

  /* ---------------- F254 ---------------- */
  const p=await open(PD);
  const a=await p.evaluate(()=>{const f={staff:{people:[{name:'Dana Whitfield (simulated)',role:'Paraeducator',criterion:'90% across 2 consecutive rounds, then an in-situ probe at 90% or above',met:true,date:'2026-09-20'}],all:true},
      plan:{adoption:{version:2,date:'2026-09-01'},rep:'Asks for a break (simulated)'},integrity:{obs:[{date:'2026-10-01',pct:80,n:10}],overall:80,criterion:90,who:'Paula Brennan (simulated)',role:'Teacher'}};
    const r=window.__nbhFactsIn(f);const list=[...document.querySelectorAll('#pdStaffList option')].map(o=>o.value+' | '+o.textContent);
    const s=document.querySelector('[data-m="staff"]');s.value='Dana Whitfield (simulated)';s.dispatchEvent(new Event('input',{bubbles:true}));
    return {r,list,listAttr:s.getAttribute('list'),plan:S.meta.plan,role:S.meta.role,ev1:document.querySelector('#row-T1 .pd-ev').textContent,ev4:document.querySelector('#row-T4 .pd-ev').textContent,t1:S.ans.T1||''};});
  ok('1 F254 the people the case knows (trained on ST-1, observed on TI-1) are a pick list for the staff member assessed, and the role follows',
    a.listAttr==='pdStaffList'&&a.list.length===2&&/^Dana Whitfield \(simulated\) \| Paraeducator · Form ST-1$/.test(a.list[0])&&/^Paula Brennan \(simulated\) \| Teacher · Form TI-1$/.test(a.list[1])&&a.role==='Paraeducator or aide',a);
  ok('2 F254 an empty "Plan or program" takes the plan from Form TD-1',a.plan==='BIP version 2, adopted 9/1/2026 (Form TD-1): the replacement behavior, Asks for a break (simulated)'&&/the plan from Form TD-1/.test(a.r.note),a);
  ok('3 F254 ST-1’s result is shown beside Training items 1 and 4 as evidence, and neither is answered for the supervisor',
    /^Form ST-1: Dana Whitfield \(simulated\) trained to criterion \(90% across 2 consecutive rounds.*\), in-classroom probe 9\/20\/2026\. Evidence to weigh, not the answer/.test(a.ev1)&&a.ev4===a.ev1&&a.t1==='',a);

  /* ---------------- F255 ---------------- */
  const v=await p.evaluate(()=>{const ans=id=>{S.ans[id]='Y';};ans('R4');S.ver.R4='obs';renderAll();const f1=document.querySelector('#flagList').textContent,u1=analyse().unver;
    S.meta.ob1_items='T3, R4';S.meta.ob1_typ='No';renderAll();const f2=document.querySelector('#flagList').textContent,u2=analyse().unver;
    S.ver.R4='both';renderAll();const f3=document.querySelector('#flagList').textContent;S.meta.emp_when='10/2/26, assessor';renderAll();const u4=analyse().unver;
    return {f1,u1,f2,u2,f3,u4};});
  ok('4 F255 "Direct observation" counts only when an observation row names the item; an interview only when it has a date',
    v.u1===1&&/Resources, Materials, & Processes item 4 is an asterisked item answered Yes as verified by direct observation, but no observation row on the Observations sheet names R4/.test(v.f1)&&
    v.u2===0&&/as verified by the staff interview, but the interview has no date/.test(v.f3)&&v.u4===0,v);
  ok('5 F255 an item observed only under conditions that were not typical is listed',/item 4 was observed only under conditions that were not typical \(observation 1\)/.test(v.f2),v.f2);

  /* ---------------- F257 ---------------- */
  const q=await open(PD);
  const b=await q.evaluate(()=>{const blk=document.getElementById('suppBlock');const off=getComputedStyle(blk).display;const c=document.querySelector('[data-c="supp_show"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    return {x6:!!document.querySelector('[data-i="X6"]')||SUPP.some(x=>x.id==='X6'),off,on:getComputedStyle(blk).display,n:document.querySelectorAll('#tbl-X tr.it').length};});
  await q.emulateMedia({media:'print'});const pr1=await q.evaluate(()=>getComputedStyle(document.getElementById('suppBlock')).display);await q.emulateMedia({media:'screen'});
  ok('6 F257 the business-setting questions are hidden until switched on, six of them (the one about the person dropped), and an unanswered block does not print',
    !b.x6&&b.off==='none'&&b.on==='block'&&b.n===6&&pr1==='none',{b,pr1});
  const old=await q.evaluate(()=>{const o=fromFile({form:'PD-1',S:{meta:{},ans:{X6:'N',X1:'Y'},chk:{},ver:{},note:{},sel:{},how:{}}});return o.ans;});
  ok('7 F257 a file that answered the dropped question opens without it',!('X6' in old)&&old.X1==='Y',old);

  /* ---------------- F256, I128, I129 on the worked example ---------------- */
  await q.evaluate(async()=>{await loadSim();});await sleep(300);
  await q.evaluate(()=>setView('plan'));
  const e=await q.evaluate(()=>{const A=analyse();return {t4:S.ans.T4,no:A.totalNo,tNo:A.doms.find(d=>d.code==='T').no,steps:[...document.querySelectorAll('#consSteps tbody tr')].map(tr=>tr.children[1].textContent),
    warn:(document.querySelector('#consSteps .verdict')||{}).textContent||'',circles:document.querySelectorAll('#mlPlot circle').length,marks:[...document.querySelectorAll('#mlPlot text')].map(t=>t.textContent).filter(t=>/^Step/.test(t)),
    supp:getComputedStyle(document.getElementById('suppBlock')).display,flags:document.querySelector('#flagList').textContent};});
  ok('8 F256 the example answers Training item 4 Yes, as its own evidence says: 16 NOs, Training 1 of 5',e.t4==='Y'&&e.no===16&&e.tNo===1,e);
  ok('9 F256 a consecutive plan is a list of steps in rank order, each with a start, a criterion and a check date, and the example’s steps do not overlap',
    e.steps.join('|')==='Resources, Materials, & Processes|Task Clarification & Prompting|Performance Consequences, Effort, & Competition'&&e.warn==='',e);
  ok('10 I128 the measure before the change is graphed, with each step’s start marked',e.circles===5&&e.marks.join('|')==='Step 1|Step 2|Step 3',e);
  ok('11 F255 F257 the example: its two items seen only on a day that was not typical are listed; its answered business questions show',/Resources, Materials, & Processes item 4 was observed only under conditions that were not typical \(observation 2\)/.test(e.flags)&&e.supp==='block',e.flags);
  const w=await q.evaluate(()=>{const i=document.querySelector('[data-m="cs_C_start"]');i.value=S.meta.cs_R_start;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
    return document.querySelector('#consSteps .verdict').textContent;});
  ok('12 F256 a step that starts before the one before it is checked is pointed out',/^Step 2 \(Task Clarification & Prompting\) starts before step 1 is checked: that is two changes at once/.test(w),w);
  await q.evaluate(()=>{const i=document.querySelector('[data-m="cs_C_start"]');i.value=S.meta.cs_R_check.replace(/\d\d$/,d=>String(+d+1).padStart(2,'0'));i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));});
  const sp=await q.evaluate(async()=>{let printed=0;const pp=window.print;window.print=()=>{printed++;};document.getElementById('staffPlanBtn').click();await new Promise(r=>setTimeout(r,120));window.print=pp;
    return {printed,attr:document.documentElement.getAttribute('data-pd-print'),txt:document.getElementById('staffPlan').textContent};});
  ok('13 I129 the one-page plan for the staff member and supervisor: the task, what changes, one step at a time, who does what, how we will know; no student initials',
    sp.printed===1&&sp.attr==='staff'&&/The Plan for the Task/.test(sp.txt)&&/not a judgement of you/.test(sp.txt)&&/What changes/.test(sp.txt)&&/One step at a time/.test(sp.txt)&&/Who does what, by when/.test(sp.txt)&&/How we will know/.test(sp.txt)&&!/S\.S\./.test(sp.txt),sp);
  await q.emulateMedia({media:'print'});const vis=await q.evaluate(()=>[...document.querySelectorAll('main.sheet>*')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.id||x.className));
  await q.pdf({path:OUT+'/staff-plan.pdf',format:'Letter',printBackground:true});await q.emulateMedia({media:'screen'});
  await q.evaluate(()=>document.documentElement.removeAttribute('data-pd-print'));
  const pages=+execFileSync('python3',['-c','import sys,pymupdf;d=pymupdf.open(sys.argv[1]);print(d.page_count)',OUT+'/staff-plan.pdf']).toString().trim();
  const ptxt=execFileSync('python3',['-c','import sys,pymupdf;d=pymupdf.open(sys.argv[1]);print(" ".join(p.get_text() for p in d))',OUT+'/staff-plan.pdf']).toString();
  ok('14 I129 it prints alone, on one page, with nothing else of the form',pages===1&&vis.join('|')==='staffPlan'&&/The Plan for the Task/.test(ptxt)&&!/PDC.HS Interview|Scoring Summary/.test(ptxt),{pages,vis});
  const rt=await q.evaluate(async()=>{let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const before=JSON.stringify(S);S=fromFile(JSON.parse(saved));renderAll();return {same:before===JSON.stringify(S),cs:S.meta.cs_P_check,ml:S.meta.ml3_v};});
  ok('15 save and open keep the steps, the measure and the switches',rt.same&&!!rt.cs&&rt.ml==='40',rt);

  /* ---------------- I130 interview mode ---------------- */
  const iv=await open(PD);await iv.evaluate(()=>setView('items'));
  const visI=()=>[...document.querySelectorAll('table.items>tbody>tr.it')].filter(r=>getComputedStyle(r).display!=='none').map(r=>r.dataset.i);
  const i1=await iv.evaluate(async vis=>{const V=eval(vis);document.getElementById('ivBtn').click();const a={rows:V(),pos:document.querySelector('.pd-ivnav .iv-pos').textContent,star:document.querySelector('.pd-ivnav .iv-star').hidden};
    document.querySelector('#row-T1 .yn button[data-v="Y"]').click();await new Promise(r=>setTimeout(r,30));a.fu=getComputedStyle(document.querySelector('tr.fu[data-fu="T1"]')).display;
    const nx=()=>document.querySelector('.pd-ivnav [data-iv="next"]').click();nx();nx();a.t3=V();a.star3=document.querySelector('.pd-ivnav .iv-star').hidden;
    for(let i=0;i<9;i++)nx();a.r2=V();document.querySelector('#row-R2 .yn button[data-v="NA"]').click();await new Promise(r=>setTimeout(r,30));nx();a.after=V();a.pos2=document.querySelector('.pd-ivnav .iv-pos').textContent;return a;},visI.toString());
  await iv.emulateMedia({media:'print'});const pv=await iv.evaluate(v=>eval(v)().length,visI.toString());await iv.emulateMedia({media:'screen'});
  const i2=await iv.evaluate(v=>{document.getElementById('ivBtn').click();return eval(v)().length;},visI.toString());
  ok('18 I130 interview mode: one question at a time, in order, the follow-up when it applies, the asterisk’s prompt, the skip rule passed over; print and leaving it show every row',
    i1.rows.join()==='T1'&&/^Question 1 of 22 · Training item 1$/.test(i1.pos)&&i1.star&&i1.fu==='table-row'&&i1.t3.join()==='T3'&&i1.star3===false&&i1.r2.join()==='R2'&&i1.after.join()==='R6'&&/^Question 13 of 19 · Resources, Materials, & Processes item 6$/.test(i1.pos2)&&pv===28&&i2===28,{i1,pv,i2});
  /* ---------------- I127 in the workstation ---------------- */
  const ctx2=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const sh=await ctx2.newPage();sh.on('pageerror',x=>errs.push('shell: '+x.message));
  await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const o=await sh.evaluate(async()=>{openForm('PD-1');await new Promise(r=>setTimeout(r,2500));const w=state.frames['PD-1'].contentWindow;w.nbhUI.confirm=async()=>true;await w.loadSim();await new Promise(r=>setTimeout(r,300));
    const btns=[...w.document.querySelectorAll('#planTbl tbody tr')].map(tr=>{const b=tr.querySelector('.pd-open');return tr.children[2].textContent.trim()+':'+(b?b.dataset.open:'');});
    w.document.querySelector('#planTbl .pd-open[data-open="QS-1"]').click();for(let i=0;i<30&&!state.frames['QS-1'];i++)await new Promise(r=>setTimeout(r,100));
    return {btns,qs:!!state.frames['QS-1'],cur:state.cur};});
  ok('16 I127 in the workstation each plan row opens the form that carries it out: task clarification and prompting rows Form QS-1, highlighting outcomes Form DD-1, supervisor presence Form CN-1',
    o.btns.includes('1:QS-1')&&o.btns.includes('3:DD-1')&&o.btns.includes('1:CN-1')&&o.btns.includes('2:')&&o.qs&&o.cur==='QS-1',o);
  const solo=await q.evaluate(()=>document.querySelectorAll('.pd-open').length);
  ok('17 I127 opened on its own, the form shows no open buttons',solo===0,solo);
  ok('19 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
