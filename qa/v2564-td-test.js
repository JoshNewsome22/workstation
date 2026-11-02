/* v25.64 Form TD-1: the research review's approved changes (the BCBA, 11/2), one check or more for each.
   H1  How the parts fit: the consequence protocol (R_PB) no longer counts as reinforcement: R_PB + OVERCORR raises the
       punishment conflict; R_PB + EXT (question 4 "yes") the extinction caution; R_PB + CHOICE + CURR the antecedent-only note.
   H2  the escape model's extinction is offered with its chip and never ticked for you; a consequence-protocol card added
       while question 4 is open says staff do not change what they do; "yes" with the agreement date writes it beside the step.
   H3  positive reinforcement for compliance (PRC): offered when breaks are not tolerable and wherever extinction is offered;
       no function caution for it on an escape plan; its own caution about other reinforcers.
   H4  a mismatched extinction step is a conflict with its own line; "Kept on purpose" needs a reason, which the BIP prints;
       multiple control checks each card against the ticked functions.
   H5  multiple control: ticked functions, one panel each (Setup stays "multiple"), the pooled-topography note, the escape
       note, "Function with no component" in Not ready to start; Save and Open keep it.
   H6  the restrictiveness chip, least restrictive first; a restrictive card is proposed until the escalation ladder holds an
       earlier step at integrity with the outcome short of the goal; What was considered is the ladder, or Not recorded.
   H7  the high-p card gives a strong reinforcer; the easy-items rule is for interspersal only; the high-p note; the fix
       without extinction comes first.
   M1  DA-1's figures beside escape question 1 and its offered answer; the re-check date after "no" prints with CURR.
   M2  the Guide's mismatch evidence; "How it fits the function" in the final plan and the BIP.
   M3  the enrichment card's expectation and its next step on the ladder.
   M4  the DRO type and the two new steps; a file saved before them opens as it was.
   M5  DRL offered for a lower rate, not for injury.
   M6  interspersal starts low, with the comparison step.
   M8  Not ready to start asks for the first integrity check in the first 2 weeks.
   L4  the plan-size limits are the form's own; whose attention, and peer attention.
   No page errors.
   usage: WS_URL=http://127.0.0.1:8589 node qa/v2564-td-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const F=L.forms().find(x=>x.id==='TD-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);return p;};
  const set=(p,n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return false;if(e.type==='checkbox')e.checked=!!v;else e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));return true;},[n,v]);
  const view=(p,v)=>p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v).then(()=>sleep(250));
  const add=(p,c)=>p.evaluate(c=>{const d=window.__tdAddComp(c);return d?d.dataset.i:null;},c);
  const clear=p=>p.evaluate(()=>{document.getElementById('compWrap').innerHTML='';});
  const flags=p=>p.evaluate(()=>window.__tdFit.flags().map(f=>({k:f.k,lv:f.r.level,cards:f.cards.map(c=>c.code),lines:f.lines||[],ans:f.ans})));
  const recs=p=>p.evaluate(()=>[...document.querySelectorAll('#selRec .td-rec')].map(r=>({code:r.dataset.code,on:r.querySelector('.td-pick').checked,chips:[...r.querySelectorAll('.td-chip')].map(x=>x.textContent),txt:r.querySelector('.rt').textContent})));
  const fin=async p=>{await view(p,'final');return p.evaluate(()=>document.getElementById('final').innerText);};
  const card=(p,code)=>p.evaluate(code=>{const c=document.querySelector('#compWrap .card[data-code="'+code+'"]');if(!c)return null;return {i:c.dataset.i,steps:[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value),html:c.innerHTML};},code);

  /* ---------- H1 */
  let p=await open();await set(p,'m.fn','escape');
  await add(p,'R_PB');await add(p,'OVERCORR');await sleep(200);let f=await flags(p);
  ok('H1a R_PB + OVERCORR: the punishment-without-reinforcement conflict',f.some(x=>x.k==='punishment-without-reinforcement'&&x.lv==='conflict'),f);
  await clear(p);await set(p,'rb.3','yes');await add(p,'R_PB');await add(p,'EXT');await sleep(200);f=await flags(p);
  ok('H1b R_PB + EXT (question 4 yes): the extinction-without-reinforcement caution',f.some(x=>x.k==='extinction-or-blocking-without-reinforcement'),f);
  await clear(p);await set(p,'rb.3','');await add(p,'R_PB');await add(p,'CHOICE');await add(p,'CURR');await sleep(200);f=await flags(p);
  ok('H1c R_PB + CHOICE + CURR: the antecedent-only note',f.some(x=>x.k==='antecedent-only-plan'),f);
  await add(p,'FCT');await sleep(200);f=await flags(p);
  ok('H1d adding FCT clears the antecedent-only note',!f.some(x=>x.k==='antecedent-only-plan'),f);

  /* ---------- H2, H3, H6 (Select sheet) */
  await clear(p);await view(p,'select');
  for(const [k,v] of [['q.escape.0','yes'],['q.escape.1','yes'],['q.escape.2','yes'],['q.escape.3','yes'],['q.escape.4','Communication']])await set(p,k,v);
  await sleep(200);let r=await recs(p);const ext=r.find(x=>x.code==='EXT');
  ok('H2a the escape model offers extinction unticked, with its chip',!!ext&&!ext.on&&ext.chips.some(c=>/Extinction step: choose it, and record/.test(c)),r);
  ok('H2b the model\'s first recommendation (FCT) and the consequence protocol stay ticked',r.some(x=>x.code==='FCT'&&x.on)&&r.some(x=>x.code==='R_PB'&&x.on),r.map(x=>x.code+':'+x.on));
  ok('H3a where extinction is offered, positive reinforcement for compliance is offered too',r.some(x=>x.code==='PRC'&&/If extinction is not chosen/.test(x.txt)),r.map(x=>x.code));
  ok('H6a each row shows its restrictiveness',r.every(x=>x.chips.some(c=>/^(Not restrictive|Needs care|Restrictive|Punishment)/.test(c))||!x.chips.length)&&ext.chips.includes('Needs care'),r.map(x=>x.chips));
  const ord=r.map(x=>x.code);ok('H6b least restrictive first: FCT and PRC before EXT and R_PB',ord.indexOf('PRC')<ord.indexOf('EXT')&&ord.indexOf('FCT')<ord.indexOf('R_PB'),ord);
  await set(p,'q.escape.3','no');await sleep(200);r=await recs(p);
  ok('H3b breaks not tolerable: activity choice and PRC, no extinction ticked',r.some(x=>x.code==='PRC'&&/Breaks are not tolerable/.test(x.txt))&&r.some(x=>x.code==='CHOICE'&&x.on)&&!r.some(x=>x.code==='EXT'&&x.on),r.map(x=>x.code+':'+x.on));
  /* the consequence protocol's step 2 */
  await view(p,'build');await set(p,'rb.3','');await p.evaluate(()=>{const s=document.querySelector('#addComp');s.value='R_PB';document.querySelector('#addCompBtn').click();});await sleep(200);
  let C=await card(p,'R_PB');
  ok('H2c a consequence-protocol card added while question 4 is open: staff do not change what they do',C&&C.steps[1]==='On the target behavior: not yet decided: staff do not change what they do until the BCBA decides (Responding sheet, question 4).',C&&C.steps);
  await view(p,'respond');await set(p,'rb.extdate','2026-11-02');await set(p,'rb.3','yes');await sleep(300);C=await card(p,'R_PB');
  ok('H2d question 4 "yes" with the agreement date: the extinction step, agreed on the date',C&&/^On the target behavior: Escape extinction: continue the prompt sequence; no break \(agreed on 11\/2\/2026\)$/.test(C.steps[1]),C&&C.steps);
  await set(p,'rb.3','no');await sleep(300);C=await card(p,'R_PB');
  ok('H2e then "no": the alternative, no agreement date',C&&/^On the target behavior: Noncontingent escape/.test(C.steps[1])&&!/agreed on/.test(C.steps.join(' ')),C&&C.steps);
  await p.close();

  /* ---------- H3, H4 (How the parts fit) */
  p=await open();await set(p,'m.fn','escape');await add(p,'PRC');await add(p,'DRA');await sleep(200);f=await flags(p);
  ok('H3c PRC on an escape plan: no function caution for it; DRA still gets one',!f.some(x=>/^function-mismatch/.test(x.k)&&x.cards.includes('PRC'))&&f.some(x=>x.k==='function-mismatch'&&x.cards.includes('DRA')),f);
  ok('H3d PRC carries its own caution (other reinforcers; check FS-1)',f.some(x=>x.k==='prc-other-reinforcers'&&x.lv==='caution'),f);
  await clear(p);await add(p,'FCT');const sx=await add(p,'SEXT');await sleep(200);f=await flags(p);
  const mx=f.find(x=>x.k==='function-mismatch-extinction');
  ok('H4a sensory extinction on an escape plan: a conflict, with its own line',!!mx&&mx.lv==='conflict'&&mx.cards.includes('SEXT')&&mx.lines.some(l=>/will not reduce it: it is maintained by escape/.test(l)),f);
  const ei=await add(p,'EXT');await set(p,'cp['+ei+'].p0','Attention extinction: no attention, comments, or eye contact');await sleep(200);f=await flags(p);
  ok('H4b an extinction card whose form is attention, on an escape plan: "Ignoring this behavior will not reduce it"',f.some(x=>x.k==='function-mismatch-extinction'&&x.cards.includes('EXT')&&x.lines.some(l=>/^Ignoring this behavior will not reduce it: it is maintained by escape, and ignoring does not keep the task in place\.$/.test(l))),f);
  await view(p,'build');await p.evaluate(()=>window.__tdFit.set('function-mismatch-extinction','keep'));await sleep(200);
  let open1=await p.evaluate(()=>window.__tdFit.open().map(f=>f.k));
  ok('H4c "Kept on purpose" without a reason still counts as not answered',open1.includes('function-mismatch-extinction'),open1);
  const hasWhy=await p.evaluate(()=>!!document.querySelector('[data-fitwhy="function-mismatch-extinction"]'));
  await p.evaluate(()=>{const e=document.querySelector('[data-fitwhy="function-mismatch-extinction"]');e.value='Kept for a probe the BCBA runs on 11/9';e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  open1=await p.evaluate(()=>window.__tdFit.open().map(f=>f.k));let bip=await p.evaluate(()=>window.__tdBipText());
  ok('H4d with its one-line reason it is answered, and the BIP prints the reason',hasWhy&&!open1.includes('function-mismatch-extinction')&&/Kept on purpose: Kept for a probe the BCBA runs on 11\/9\./.test(bip),{hasWhy,open1});
  await p.close();

  /* ---------- H5 multiple control */
  p=await open();await set(p,'m.fn','multiple');await view(p,'select');
  const m0=await p.evaluate(()=>({ticks:document.querySelectorAll('[name^="multi."]').length,panels:document.querySelectorAll('.td-multi-p').length,shown:document.querySelectorAll('.td-multi-p:not([hidden])').length}));
  ok('H5a multiple control: a tick per function and a panel each, none shown before a tick',m0.ticks===4&&m0.panels===4&&m0.shown===0,m0);
  await set(p,'multi.escape',true);await set(p,'multi.attention',true);await sleep(200);
  for(const [k,v] of [['q.multi.escape.0','yes'],['q.multi.escape.1','yes'],['q.multi.escape.2','yes'],['q.multi.escape.3','yes'],['q.multi.escape.4','Communication']])await set(p,k,v);
  await set(p,'q.multiple.topo','no');await sleep(300);
  const m1=await p.evaluate(()=>({fn:document.querySelector('[name="m.fn"]').value,shown:[...document.querySelectorAll('.td-multi-p:not([hidden])')].map(x=>x.dataset.mf),recs:[...document.querySelectorAll('#selRec .td-rec')].map(r=>r.dataset.code+'|'+r.querySelector('.rt p').textContent.slice(0,40)),topo:!document.getElementById('tdMultiTopo').hidden&&document.getElementById('tdMultiTopo').textContent,esc:(document.querySelector('.td-multi-esc')||{}).textContent||''}));
  ok('H5b the ticked panels show; recommendations name their function; Setup stays "multiple"',m1.fn==='multiple'&&m1.shown.join()==='escape,attention'&&m1.recs.some(x=>/^FCT\|Escape: /.test(x)),m1);
  ok('H5c not graphed one topography at a time: the pooling note',/artifact of pooling/.test(m1.topo||'')&&/87\.5%/.test(m1.topo||''),m1.topo);
  ok('H5d escape among the functions: expect a weaker response to FCT, plan the next step',/weaker response to FCT/.test(m1.esc)&&/Weber et al., 2024/.test(m1.esc),m1.esc);
  await add(p,'DNRA');await add(p,'SEXT');await sleep(200);let ft=await fin(p);
  ok('H5e Not ready to start: the attention function has no component',/Function with no component: attention/.test(ft)&&!/Function with no component: escape/.test(ft),ft.slice(0,900));
  f=await flags(p);ok('H4e multiple control: a card that matches none of the ticked functions is flagged',f.some(x=>/^function-mismatch/.test(x.k)&&x.cards.includes('SEXT'))&&!f.some(x=>/^function-mismatch/.test(x.k)&&x.cards.includes('DNRA')),f);
  const saved=await p.evaluate(()=>JSON.stringify(window.__tdCollect()));
  const p2=await open();await p2.evaluate(s=>window.__tdRestore(JSON.parse(s)),saved);await sleep(600);
  const m2=await p2.evaluate(()=>({esc:document.querySelector('[name="multi.escape"]').checked,att:document.querySelector('[name="multi.attention"]').checked,q:document.querySelector('[name="q.multi.escape.4"]').value,shown:[...document.querySelectorAll('.td-multi-p:not([hidden])')].map(x=>x.dataset.mf)}));
  ok('H5f Save and Open keep the ticks, the answers and the panels',m2.esc&&m2.att&&m2.q==='Communication'&&m2.shown.join()==='escape,attention',m2);
  await p2.close();await p.close();

  /* ---------- H6 the ladder */
  p=await open();await set(p,'m.fn','automatic');await add(p,'EE');await add(p,'RIRD');await set(p,'mon.fid','90');ft=await fin(p);
  ok('H6c a restrictive card (RIRD) prints as proposed, and Not ready to start says why',/Proposed: needs the less restrictive data first/.test(ft)&&/Proposed, not yet in the plan: Response interruption/i.test(ft),ft.slice(0,1500));
  ok('H6d What was considered: Not recorded while the ladder is empty',/What was considered\s*Not recorded/.test(ft)||/What was considered: Not recorded/.test(ft),ft.match(/What was considered.{0,80}/g));
  ok('M3a the enrichment card: its expectation, and the next step on the ladder',/4 of 10 published applications/.test(ft)&&/Planned next step/.test(ft)&&/RRB_PE or DRAAUTO/.test(ft),ft.match(/Planned next step.{0,120}/g));
  await p.click('#tdLadderAdd');await sleep(200);
  await p.evaluate(()=>{const tr=document.querySelector('#tdLadder tbody tr[data-k="0"]');const put=(k,v)=>{const e=tr.querySelector('[data-lf="'+k+'"]');e.focus();e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};put('step','rich');put('start','2026-10-01');put('sess','8');put('integ','95');put('red','40');put('goal','90');put('by','2026-11-01');put('dec','next');});
  await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await sleep(200);ft=await fin(p);
  ok('H6e a less restrictive step at integrity, short of its goal: the card is no longer proposed',!/Proposed: needs the less restrictive data first/.test(ft)&&!/Proposed, not yet in the plan/.test(ft),ft.slice(0,1200));
  ok('H6f What was considered is the ladder\'s row, with its review rule',/1\. Make reinforcement richer for the replacement \(bigger, faster, better\) \(from 10\/1\/2026, 8 sessions, integrity 95%, 40% below baseline\)\. If not at 90% below baseline by 11\/1\/2026, go to the next step\. Decision: go to the next step\./.test(ft),ft.match(/What was considered.{0,300}/g));
  bip=await p.evaluate(()=>window.__tdBipText());
  ok('H6g Copy for the BIP: the ladder in the least restrictive review',/What was considered: 1\. Make reinforcement richer/.test(bip),bip.split('LEAST RESTRICTIVE REVIEW').slice(-1)[0].slice(0,400));
  ok('M2a "How it fits the function" in the final plan and the BIP',/How it fits the function:\s*gives the same reinforcer on a schedule/.test(ft)&&/How it fits the function: /.test(bip),ft.match(/How it fits the function.{0,100}/g));
  await p.close();

  /* ---------- H7, M6, M4, M5, L4 */
  p=await open();await set(p,'m.fn','escape');await add(p,'A_HIGHP');await add(p,'DRA');await sleep(200);f=await flags(p);
  C=await card(p,'A_HIGHP');
  ok('H7a the high-p card: a strong reinforcer after each high-p instruction and the low-p one',C&&/Give a strong reinforcer \(an edible or a top item, not praise alone\) after each high-p instruction the student does, and after the low-p one/.test(C.steps[1]),C&&C.steps[1]);
  ok('H7b the high-p note; the easy-items rule no longer applies to high-p',f.some(x=>x.k==='highp-needs-a-strong-reinforcer')&&!f.some(x=>x.k==='easy-items-earn-the-best-reinforcer'),f.map(x=>x.k));
  const hx=await p.evaluate(()=>window.__tdCompare.data.rules.find(r=>r.id==='highp-without-extinction').fix);
  ok('H7c without extinction: reinforce low-p compliance with a high-quality item first, extinction after, labelled',/^First, reinforce compliance with the low-p instruction with a high-quality item/.test(hx)&&/marked extinction step/.test(hx),hx);
  await clear(p);await add(p,'A_INTERSPERSE');await add(p,'DRA');await sleep(200);f=await flags(p);C=await card(p,'A_INTERSPERSE');
  ok('H7d the easy-items rule stays for interspersal',f.some(x=>x.k==='easy-items-earn-the-best-reinforcer'),f.map(x=>x.k));
  const ph=await p.evaluate(i=>{const e=document.querySelector('[name="cp['+i+'].p0"]');return e.placeholder||e.dataset.td9Ph||'';},C.i);
  ok('M6 interspersal: no 3 : 1 default, start low, compare against no interspersal',!/3 : 1/.test(ph)&&/start low/.test(ph)&&C.steps.some(s=>/Compare the sessions to mastery against a block without interspersal/.test(s)),{ph,steps:C.steps});
  await clear(p);const di=await add(p,'DRO');C=await card(p,'DRO');
  const dt=await p.evaluate(i=>{const s=document.querySelector('[name="cp['+i+'].dtype"]');return s?{v:s.value,o:[...s.options].map(x=>x.value)}:null;},di);
  ok('M4a DRO: the type, whole-interval resetting by default, with the other two',dt&&dt.v==='Whole-interval, resetting'&&dt.o.includes('Momentary, variable times')&&dt.o.includes('Escalating intervals'),dt);
  ok('M4b DRO: state the rule before the session; record one other behavior',C.steps.some(s=>/state the DRO rule before the session/.test(s))&&C.steps.some(s=>/Record one other behavior/.test(s)),C.steps);
  await set(p,'cp['+di+'].dtype','Momentary, variable times');ft=await fin(p);
  ok('M4c the final plan prints the DRO type',/DRO type:\s*Momentary, variable times/.test(ft));
  /* a file saved before v25.64: no DRO type, six steps */
  const old=await p.evaluate(i=>{const d=window.__tdCollect();delete d.fields['cp['+i+'].dtype'];delete d.fields['cp['+i+'].s6'];delete d.fields['cp['+i+'].s7'];return JSON.stringify(d);},di);
  const p3=await open();await p3.evaluate(s=>window.__tdRestore(JSON.parse(s)),old);await sleep(500);
  const o3=await p3.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="DRO"]'),i=c.dataset.i;return {dt:document.querySelector('[name="cp['+i+'].dtype"]').value,steps:window.__tdComps()[0].steps.length};});
  ok('M4d a file saved before the change opens as saved: no DRO type, its six steps',o3.dt===''&&o3.steps<=6,o3);
  await p3.close();
  /* M5 */
  await clear(p);await view(p,'select');await set(p,'sel.drl','yes');await sleep(200);r=await recs(p);
  ok('M5a a lower rate is acceptable: DRL is offered',r.some(x=>x.code==='S_DRL'&&/lower rate, not zero/.test(x.txt)),r.map(x=>x.code));
  await set(p,'rb.2','yes');await view(p,'select');await set(p,'sel.drl','yes');await sleep(200);r=await recs(p);
  ok('M5b never for injury: the Responding sheet says the behavior can injure, no DRL',!r.some(x=>x.code==='S_DRL'),r.map(x=>x.code));
  /* L4 */
  const mt=await p.evaluate(()=>window.td117.meter().html);
  ok('L4a the plan-size limits are said to be the form\'s own',/this form’s own/.test(mt)&&/no study sets these numbers/.test(mt),mt);
  await set(p,'m.fn','attention');await view(p,'select');
  const who=await p.evaluate(()=>!!document.querySelector('[name="q.attention.who"]')&&document.querySelector('#modelWrap .qrow [name="q.attention.who"]')===document.querySelector('#modelWrap select'));
  await set(p,'q.attention.who','peers');await sleep(200);r=await recs(p);
  ok('L4b attention: whose attention is asked first; peers bring NCR of peer attention and a group contingency',who&&r.some(x=>x.code==='NCR'&&/peer attention/.test(x.txt))&&r.some(x=>x.code==='GRP_CON'),{who,r:r.map(x=>x.code)});
  await p.close();

  /* ---------- M1, M2, M8 */
  p=await open();await set(p,'m.fn','escape');await view(p,'select');
  await p.evaluate(()=>{window.__tdDemands={dates:'10/1–10/8',rule:'latency',fa:[{name:'Writing',lat:12,rate:1.1},{name:'Math worksheet',lat:40,rate:0.6}],mods:[{task:'Writing',lines:['Above the student’s skills: teach the prerequisite first.']}]};});
  await set(p,'q.escape.1','yes');await sleep(200);
  const q1=await p.evaluate(()=>{const b=document.getElementById('tdDa1Q');return {shown:b&&!b.hidden,txt:b&&b.textContent,btn:!!(b&&b.querySelector('[data-da1q="no"]'))};});
  ok('M1a escape question 1: DA-1\'s figures beside it, and its answer offered',q1.shown&&/2 tasks evoke problem behavior; fastest: Writing \(latency 12 s\)/.test(q1.txt)&&q1.btn,q1);
  await p.click('#tdDa1Q [data-da1q]');await sleep(250);
  const q1b=await p.evaluate(()=>({a:document.querySelector('[name="q.escape.0"]').value,rc:!document.querySelector('#modelWrap .td-recheck').hidden}));
  ok('M1b "Use DA-1\'s answer" answers No; the re-check date shows',q1b.a==='no'&&q1b.rc,q1b);
  await set(p,'esc.recheck','2026-12-01');await add(p,'CURR');ft=await fin(p);
  ok('M1c the final plan prints the re-check with the curricular revision',/Re-check after curricular revision:\s*12\/1\/2026/.test(ft),ft.match(/Re-check.{0,80}/g));
  ok('M8a Not ready to start: no integrity check in the first 2 weeks',/No integrity check is scheduled in the first 2 weeks/.test(ft));
  await set(p,'ad.start','2026-11-02');await set(p,'int.first','2026-11-30');await set(p,'int.firstwho','the BCBA');ft=await fin(p);
  ok('M8b a first check more than 2 weeks after the start is named',/more than 2 weeks after the start/.test(ft)&&!/No integrity check is scheduled/.test(ft));
  await set(p,'int.first','2026-11-10');ft=await fin(p);await view(p,'plan');
  const fn8=await p.evaluate(()=>document.getElementById('tdFirstNote').textContent);
  ok('M8c within 2 weeks: no item; the plan sheet says to observe the consequence steps first',!/integrity check/i.test(ft.split('Summary statement')[0])&&/observe first the steps staff take after the behavior/.test(fn8),fn8);
  const g=await p.evaluate(()=>document.getElementById('guide').textContent);
  ok('M2b the Guide: when treatment does not match, and the accepted exceptions',/Evidence: when treatment does not match/.test(g)&&/about 7 an hour/.test(g)&&/only 7/.test(g)&&/14 of 15 applications/.test(g));
  await p.close();
  /* an old file with the multiple-control acknowledgement keeps it */
  p=await open();const ack=await p.evaluate(()=>{const d={form:'TD-1',rev:'2026-09',counts:{comps:[]},fields:{'m.fn':'multiple','q.multiple.0':'acknowledged'}};window.__tdRestore(d);return JSON.stringify(window.__tdCollect().fields['q.multiple.0']);});
  ok('H5g a file with the old acknowledgement (q.multiple.0) keeps it',ack==='"acknowledged"',ack);
  await p.close();
 }catch(e){ok('the run finished',false,e.stack||e.message);}
 ok('no page errors',!errs.length,errs.slice(0,4));
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
