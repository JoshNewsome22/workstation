/* v21.78 helper C2: the case facts go into eight forms, only where a field is empty (simulated student only: Mateo Rivera).
   1. CF-1 "Integrity obtained", BC-1 "Integrity in the changed component" and PD-1 "Current level" take Form TI-1's integrity;
      PD-1 only when the concern is about running the plan;
   2. Form PA-1's menu: AD-1's preference results and reinforcer inventory, DT-1's preference table, VS-1's choice board,
      first-then "Then" and token reward labels (the pictures untouched), each item once, a second pass adding nothing;
   3. Form TB-1's behaviors: MT-1's definition, GC-1's definition of a disruption, BC-1's measure (dimension and unit),
      DT-1's "What the student does instead of waiting" (the target behaviors);
   4. the shared fill (behavior, function) still runs; nothing typed is replaced; an input event tells autosave; no page errors.
   usage: node qa/v2178-c2-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const U=f=>BASE+'/NBH-Workstation/'+f;
const FILES={CF:'CF-1_Contextual-Fit-Assessment_v2026-09.html',BC:'BC-1_Behavioral-Contrast_v2026-09.html',PD:'PD-1_Performance-Diagnostic-Checklist_v2026-09.html',
  AD:'AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html',DT:'Delay-Tolerance-Protocol-Toolkit.html',VS:'VS-1_Visual-Supports_v2026-10.html',
  MT:'MT-1_Discontinuous-Measurement_v2026-09.html',GC:'GC-1_Group-Contingencies_v2026-10.html'};
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const TI_LINE='Treatment integrity 86% over 4 TI-1 observations (latest 2026-10-02)';
const CASE={behaviors:[
    {label:'Elopement',def:'Leaving the assigned area by more than three feet without permission',dim:'Count / rate',unit:'each exit = 1; a new episode after 60 s back in the area',urg:'4',isRep:false,type:'Target – reduction',src:'TB-1'},
    {label:'Physical aggression',def:'Hitting, kicking or pushing another person with enough force to be heard',dim:'Count / rate',unit:'each contact = 1',urg:'3',isRep:false,type:'Target – reduction',src:'TB-1'},
    {label:'Asking for a break',def:'Hands the break card to an adult or says "break, please"',dim:'Count / rate',isRep:true,type:'Target – replacement',src:'TB-1'}],
  fn:{key:'escape',label:'Escape from demands',statements:['When Mateo is given a long task, he leaves the area and the task is taken away.']},
  menu:[{name:'Tablet: racing game',type:'Activity',rank:1,tier:'HP',mean:1,methods:2,pct:87.5,format:'Paired stimulus',date:'2026-09-02',src:'PA-1'},
    {name:'Fruit chew',type:'Edible',rank:2,tier:'HP',mean:2,methods:2,src:'PA-1'},
    {name:'Drawing',type:'Leisure item',rank:3,tier:'MP',mean:3,methods:2,src:'PA-1'},
    {name:'Bubbles',type:'Sensory',rank:4,tier:'LP',mean:4,methods:2,src:'PA-1'}],
  integrity:{obs:[{date:'2026-09-11',type:'Scheduled',pct:84,n:12},{date:'2026-09-18',type:'Unannounced',pct:80,n:12},{date:'2026-10-02',type:'Unannounced',pct:92,n:12},{date:'2026-09-25',type:'Scheduled',pct:88,n:12}],overall:86,crit:100,criterion:90,src:'TI-1'},
  src:{behaviors:'TB-1',fn:'FS-1',menu:'PA-1'}};
(async()=>{const br=await chromium.launch();const errs=[];
  /* each visit gets a fresh context, so no draft one visit's autosave kept comes back in the next */
  const open=async file=>{const ctx=await br.newContext({viewport:{width:1300,height:950}});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(file+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/favicon|404|ERR_/.test(m.text()))errs.push(file+' console: '+m.text());});
    await p.goto(U(file));await sleep(900);
    await p.evaluate(()=>{if(window.nbhUI)nbhUI.confirm=async()=>true;window.__inp=0;document.addEventListener('input',()=>{window.__inp++;},true);});return {p,ctx};};
  const apply=(p,c)=>p.evaluate(c=>{const r=window.nbhCase.apply(c);return {r,inp:window.__inp,own:typeof window.__nbhFactsIn==='function'};},c);
  const mv=(p,k)=>p.evaluate(k=>{const e=document.querySelector('[data-m="'+k+'"]');return e?e.value:null;},k);
  const typeM=(p,o)=>p.evaluate(o=>{for(const k in o){const e=document.querySelector('[data-m="'+k+'"]');e.value=o[k];e.dispatchEvent(new Event('input',{bubbles:true}));}},o);

  /* ---------- CF-1 ---------- */
  {let {p,ctx}=await open(FILES.CF);const a=await apply(p,CASE);
    ok('CF-1: its own hook answers, with the count filled',a.own&&a.r&&a.r.filled>=1&&!a.r.error,a);
    ok('CF-1: "Integrity obtained" takes Form TI-1\'s line',await mv(p,'ti')===TI_LINE,await mv(p,'ti'));
    ok('CF-1: the form state holds it and autosave heard an input',await p.evaluate(t=>S.meta.ti===t,TI_LINE)&&a.inp>0,a);
    const a2=await apply(p,CASE);ok('CF-1: a second pass fills nothing more',a2.r.filled===0,a2);await ctx.close();
    ({p,ctx}=await open(FILES.CF));await typeM(p,{ti:'92% on 9/30 (typed)'});await apply(p,CASE);
    ok('CF-1: a typed integrity line is kept',await mv(p,'ti')==='92% on 9/30 (typed)');
    const nf=await apply(p,{behaviors:[]});ok('CF-1: a case with no integrity changes nothing and does not fail',nf.r&&nf.r.filled===0&&!nf.r.error,nf);await ctx.close();}

  /* ---------- BC-1 ---------- */
  {let {p,ctx}=await open(FILES.BC);const a=await apply(p,CASE);
    ok('BC-1: the shared fill still names the behavior',await mv(p,'beh')==='Elopement',await mv(p,'beh'));
    ok('BC-1: the measure is the dimension and counting unit of that behavior',await mv(p,'measure')==='Count / rate — each exit = 1; a new episode after 60 s back in the area',await mv(p,'measure'));
    ok('BC-1: integrity in the changed component from Form TI-1',await mv(p,'r_int')===TI_LINE,await mv(p,'r_int'));
    ok('BC-1: three filled, in the state, autosave heard',a.r.filled===3&&await p.evaluate(()=>!!S.meta.measure&&!!S.meta.r_int)&&a.inp>0,a);await ctx.close();
    ({p,ctx}=await open(FILES.BC));await typeM(p,{beh:'Physical aggression',r_int:'Not observed yet'});await apply(p,CASE);
    ok('BC-1: a typed behavior picks its own measure; typed integrity kept',await mv(p,'measure')==='Count / rate — each contact = 1'&&await mv(p,'r_int')==='Not observed yet'&&await mv(p,'beh')==='Physical aggression',[await mv(p,'measure'),await mv(p,'r_int')]);
    await ctx.close();({p,ctx}=await open(FILES.BC));await typeM(p,{measure:'Per hour (typed)'});await apply(p,CASE);
    ok('BC-1: a typed measure is kept',await mv(p,'measure')==='Per hour (typed)');await ctx.close();}

  /* ---------- PD-1 ---------- */
  {let {p,ctx}=await open(FILES.PD);await apply(p,CASE);
    ok('PD-1: with no concern yet, the current level is Form TI-1\'s integrity',await mv(p,'baseline')===TI_LINE&&await p.evaluate(t=>S.meta.baseline===t,TI_LINE),await mv(p,'baseline'));await ctx.close();
    ({p,ctx}=await open(FILES.PD));await typeM(p,{concern:'The paraprofessional skips the error-correction step of the plan during math.'});await apply(p,CASE);
    ok('PD-1: a concern about running the plan takes it too',await mv(p,'baseline')===TI_LINE);await ctx.close();
    ({p,ctx}=await open(FILES.PD));await typeM(p,{concern:'Arrives 15 minutes late to the morning meeting.'});const a=await apply(p,CASE);
    ok('PD-1: a concern about something else is left for the person, and the note says why',await mv(p,'baseline')===''&&/not about running the plan/.test(a.r.note),a);await ctx.close();
    ({p,ctx}=await open(FILES.PD));await typeM(p,{baseline:'Data sheet blank on 7 of 10 days'});await apply(p,CASE);
    ok('PD-1: a typed current level is kept',await mv(p,'baseline')==='Data sheet blank on 7 of 10 days');await ctx.close();}

  /* ---------- AD-1 ---------- */
  {let {p,ctx}=await open(FILES.AD);const rows=id=>p.evaluate(id=>Array.from(document.getElementById(id).rows).map(tr=>Array.from(tr.querySelectorAll('input,select')).map(x=>x.value)),id);
    const a=await apply(p,CASE),pr=await rows('tbPref'),rf=await rows('tbRf');
    ok('AD-1: preference results, one row per ranked item, in order',pr.length===4&&pr.map(r=>r[0]).join('|')==='Tablet: racing game|Fruit chew|Drawing|Bubbles',pr);
    ok('AD-1: what is known goes in (class, format, selection %, date)',JSON.stringify(pr[0])===JSON.stringify(['Tablet: racing game','Activity','Paired stimulus','87.5','2026-09-02'])&&pr[1][1]==='Edible'&&pr[1][2]===''&&pr[1][3]===''&&pr[2][1]==='Activity',pr);
    ok('AD-1: the inventory takes the high and middle items (item and class), not the low one',rf.length===3&&rf.map(r=>r[0]+'/'+r[1]).join('|')==='Tablet: racing game/Activity|Fruit chew/Edible|Drawing/Activity'&&rf.every(r=>r.slice(2).every(v=>v==='')),rf);
    ok('AD-1: the shared fill still fills the problem behavior and function; autosave heard',await p.evaluate(()=>document.querySelector('[name="s_def"]').value.indexOf('Elopement')===0&&!!document.querySelector('[name="s_function"]').value)&&a.inp>0,a);
    const a2=await apply(p,CASE);ok('AD-1: a second pass adds no row',a2.r.filled===0&&(await rows('tbPref')).length===4&&(await rows('tbRf')).length===3,a2);await ctx.close();
    ({p,ctx}=await open(FILES.AD));await p.evaluate(()=>{document.querySelector('[data-add="tbPref"]').click();const tr=document.querySelector('#tbPref tr');tr.querySelector('input').value='Fruit chew';tr.querySelector('input[type="number"]').value='55';
      document.querySelector('[data-add="tbPref"]').click();});
    await apply(p,CASE);const pr2=await rows('tbPref');
    ok('AD-1: a typed row is kept as typed, the empty row is used first, nothing twice',pr2.length===4&&pr2[0][0]==='Fruit chew'&&pr2[0][3]==='55'&&pr2[1][0]==='Tablet: racing game'&&pr2.filter(r=>r[0]==='Fruit chew').length===1,pr2);await ctx.close();}

  /* ---------- DT-1 ---------- */
  {let {p,ctx}=await open(FILES.DT);const rows=()=>p.evaluate(()=>Array.from(document.getElementById('tbPref').rows).map(tr=>Array.from(tr.querySelectorAll('input,select')).map(x=>x.value)));
    const before=(await rows()).length,a=await apply(p,CASE),pr=await rows();
    ok('DT-1: the high and middle items fill the two starter rows first, then one more',before===2&&pr.length===3&&pr.map(r=>r[0]).join('|')==='Tablet: racing game|Fruit chew|Drawing',pr);
    ok('DT-1: item, selection %, format and date where known; the role left',JSON.stringify(pr[0])===JSON.stringify(['Tablet: racing game','87.5','Paired stimulus','2026-09-02',''])&&pr[1].slice(1).every(v=>v===''),pr);
    ok('DT-1: "What the student does instead of waiting" names the target behaviors, not the replacement',await p.evaluate(()=>document.querySelector('[name="s_instead"]').value)==='Elopement, Physical aggression');
    ok('DT-1: the shared fill still fills the function; autosave heard',await p.evaluate(()=>!!document.querySelector('[name="s_function"]').value)&&a.inp>0,a);
    const a2=await apply(p,CASE);ok('DT-1: a second pass adds nothing',a2.r.filled===0&&(await rows()).length===3,a2);await ctx.close();
    ({p,ctx}=await open(FILES.DT));await p.evaluate(()=>{const e=document.querySelector('[name="s_instead"]');e.value='Grabbing (typed)';e.dispatchEvent(new Event('input',{bubbles:true}));});await apply(p,CASE);
    ok('DT-1: a typed answer is kept',await p.evaluate(()=>document.querySelector('[name="s_instead"]').value)==='Grabbing (typed)');await ctx.close();}

  /* ---------- VS-1 ---------- */
  {let {p,ctx}=await open(FILES.VS);const st=()=>p.evaluate(()=>({ch:S.choice.slice(0,num(S.meta.ch_n)||4).map(o=>o.k+'/'+o.l),ft:S.ft.map(o=>o.k+'/'+o.l),tk:S.tk.map(o=>o.k+'/'+o.l),
      inputs:Array.from(document.querySelectorAll('[data-r="choice"][data-f="l"]')).map(e=>e.value)}));
    const b0=await st(),a=await apply(p,CASE),s=await st();
    ok('VS-1: the choice board takes the high and middle items as labels, the pictures as they were',s.ch.join('|')===[b0.ch[0].split('/')[0]+'/Tablet: racing game',b0.ch[1].split('/')[0]+'/Fruit chew',b0.ch[2].split('/')[0]+'/Drawing',b0.ch[3]].join('|'),{b0,s});
    ok('VS-1: the board on screen shows them',s.inputs.slice(0,3).join('|')==='Tablet: racing game|Fruit chew|Drawing',s.inputs);
    ok('VS-1: "Then" and the token reward take the top item; First and the token picture are left',s.ft[0]===b0.ft[0]&&s.ft[1]===b0.ft[1].split('/')[0]+'/Tablet: racing game'&&s.tk[0]===b0.tk[0]&&s.tk[1]===b0.tk[1].split('/')[0]+'/Tablet: racing game',{b0,s});
    ok('VS-1: five filled, the note asks to check the pictures, autosave heard',a.r.filled===5&&/check that each picture/.test(a.r.note)&&a.inp>0,a);
    const a2=await apply(p,CASE);ok('VS-1: a second pass fills nothing',a2.r.filled===0&&JSON.stringify(await st())===JSON.stringify(s),a2);await ctx.close();
    ({p,ctx}=await open(FILES.VS));await p.evaluate(()=>{S.choice[0].l='Swing (typed)';S.ft[1].l='Recess (typed)';S.tk[1].l='Stickers (typed)';renderAll();});await apply(p,CASE);const t=await st();
    ok('VS-1: typed labels are kept; the menu fills the rest without repeating',t.ch.map(x=>x.split('/')[1]).join('|')==='Swing (typed)|Tablet: racing game|Fruit chew|Drawing'&&/Recess \(typed\)$/.test(t.ft[1])&&/Stickers \(typed\)$/.test(t.tk[1]),t);await ctx.close();}

  /* ---------- MT-1 ---------- */
  {let {p,ctx}=await open(FILES.MT);await apply(p,CASE);
    ok('MT-1: the shared fill names the behavior and the definition follows it',await mv(p,'beh')==='Elopement'&&await mv(p,'def')===CASE.behaviors[0].def&&await p.evaluate(d=>S.meta.def===d,CASE.behaviors[0].def),[await mv(p,'beh'),await mv(p,'def')]);await ctx.close();
    ({p,ctx}=await open(FILES.MT));await typeM(p,{beh:'Physical aggression'});await apply(p,CASE);
    ok('MT-1: a typed behavior takes its own definition',await mv(p,'def')===CASE.behaviors[1].def,await mv(p,'def'));await ctx.close();
    ({p,ctx}=await open(FILES.MT));await typeM(p,{def:'Out of the seat at the moment of the look (typed)'});await apply(p,CASE);
    ok('MT-1: a typed definition is kept',await mv(p,'def')==='Out of the seat at the moment of the look (typed)');await ctx.close();}

  /* ---------- GC-1 ---------- */
  {let {p,ctx}=await open(FILES.GC);const a=await apply(p,CASE),v=await mv(p,'b_def');
    ok('GC-1: the definition of a disruption names each target behavior with its definition, not the replacement',v==='Elopement: '+CASE.behaviors[0].def+'; Physical aggression: '+CASE.behaviors[1].def&&!/break/i.test(v)&&await p.evaluate(v=>S.meta.b_def===v,v)&&a.inp>0,v);await ctx.close();
    ({p,ctx}=await open(FILES.GC));await typeM(p,{b_def:'Talking out (typed)'});await apply(p,CASE);
    ok('GC-1: a typed definition is kept',await mv(p,'b_def')==='Talking out (typed)');await ctx.close();}

  ok('no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);console.log('RESULT: 1 failure(s)');process.exit(1);});
