/* v22.48 Form QS-1, the Staff Quick Start, from the case (review F389-F397, I197-I200). Health and safety come from the
   health record with the nurse on Who to call; the crisis call is the administrator or the office, never the consulting
   BCBA; the tiers carry their kind and trained-staff marks and the flow sheet follows them, its request branch from the
   plan's request card (Form TD-1); a field still holding the plan's words is a draft on every page until rewritten or
   kept; the issue, the plan-governs and handling lines; the tiles read the current phase; the skills being taught apart
   from the ones the student has; When from FS-1's summary statements; the consequence box only once confirmed; the Who box
   follows the plan; the stop line (Form SI-1); a new issue; each adult's part (Form ST-1); the reading check. Form TD-1
   sends the request card, SI-1 the stop line and FS-1 the triggers; Forms TI-1 and TV-1 do not take a draft row.
   Simulated people only. usage: node qa/v2248-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const FORM='QS-1_Staff-Quick-Start_v2026-10.html';
const BASECASE=()=>({src:{profile:'DM-1',behaviors:'TB-1',fn:'FS-1',plan:'TD-1',crisis:'CR-1',data:'DD-1',student:'SI-1',staff:'ST-1'},
  profile:{strengths:'Kind to younger students (simulated)',health:{conditions:'Epilepsy (simulated)',allergies:'Peanuts (simulated)',
      meds:[{name:'Valtoco (simulated)',dose:'10 mg',times:'as needed',reason:'Seizure over 5 minutes'},{name:'Methylphenidate (simulated)',dose:'10 mg',times:'8:00',reason:'Attention'}]},
    flags:{safety:['Elopement risk (simulated)']},home:{name:'Ana Rivera (simulated)',rel:'Mother',pref:'Text',phone:'555-0100'}},
  behaviors:[{label:'Hitting (simulated)',def:'Strikes another person with an open or closed hand',dim:'frequency',ant:'Told to start writing (simulated)',rep:'Asking for a break'},
    {label:'Spitting (simulated)',def:'Spits toward a person',dim:'frequency'},
    {label:'Asking for a break',def:'Holds up the break card or says “break”',isRep:true}],
  fn:{key:'escape',label:'Out of hard work (simulated)',perBehavior:[{label:'Hitting (simulated)',se:'After a night of poor sleep (simulated)',ant:'a writing task of more than a few lines (simulated)'}]},
  plan:{src:'TD-1',beh:'Hitting (simulated)',prec:'Pushes the worksheet away (simulated)',
    respond:{prec:'Offer the break card once (simulated)',target:'Keep the task in place; prompt the break card (simulated)',not:'No comments about the behavior, no break for hitting',crisis:'Two hits within 10 s (simulated)',after:'Return to the task at the step left (simulated)'},
    request:{name:'Asking for a break',form:'Break card',reinf:'a 2-minute break at the back table',thin:'delay steps 5 s, 15 s, 30 s'},
    steps:[{n:1,d:'Escape extinction: keep the task in place (simulated)',grp:'Escape extinction',comp:'',cmp:'con',crit:true}]},
  data:{days:20,from:'2026-09-14',to:'2026-10-09',conds:[{name:'Baseline',from:'2026-09-14',days:5},{name:'Break card and task in place',from:'2026-09-21',days:15}],
    behaviors:[{name:'Hitting (simulated)',kind:'target',measure:'count',days:20,mean:2.1,cur:{mean:0.8},base:{mean:4.2},unit:''},
      {name:'Asking for a break',kind:'replacement',measure:'pct',two:true,unit:'%',days:20,mean:60,cur:{mean:75},base:{mean:10}}]},
  student:{stop:{signs:'says “stop”; pushes the materials to the edge (simulated)',steps:'Say “Okay,” pause the task and offer two choices'}},
  staff:{people:[{name:'Dana Whitfield (simulated)',role:'classroom teacher',met:true},{name:'Paula Brennan (simulated)',role:'paraeducator',met:false}]}});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async(id,file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});return p;};
  const q=await open('QS-1',FORM);
  const fresh=await q.evaluate(()=>({text:allText(),check:S.checkOn}));
  ok('0a a new, empty quick start holds no text (its settings are not text), so the simulation loads without asking',fresh.text===''&&fresh.check==='no',fresh);
  /* the case without the data sheet first: the record table comes from TB-1 */
  const c0=BASECASE();delete c0.data;
  await q.evaluate(c=>{S.meta.first='Mateo';S.meta.client='Mateo Rivera (simulated)';S.meta.bcba='Iris Calloway, BCBA (simulated)';__nbhFactsIn(c);},c0);await sleep(300);
  const r0=await q.evaluate(()=>({rec:S.rec.filter(r=>r.measure).map(r=>r.measure),who:S.who}));
  ok('0 without the data sheet the record table takes TB-1’s behaviors (Spitting among them)',r0.rec.includes('Spitting (simulated)'),r0);
  /* the whole case */
  await q.evaluate(c=>{__nbhFactsIn(c);},BASECASE());await sleep(400);
  const a=await q.evaluate(()=>({health:S.health,calls:S.calls.filter(c=>c.role||c.name).map(c=>({role:c.role,name:c.name,when:c.when})),crisis:S.callCrisis,
    tiers:S.tiers.filter(t=>t.name||t.see||t.do).map(t=>({name:t.name,kind:t.kind,train:t.train})),askName:S.askName,honor:S.flowHonor,rules:S.rules.map(r=>r.dont).filter(Boolean),
    stats:S.stats.filter(s=>s.n).map(s=>s.n+' | '+s.label),statnote:S.statnote,rec:S.rec.filter(r=>r.measure).map(r=>r.measure+' | '+r.how),
    skills:S.skills.filter(s=>s.name).map(s=>({name:s.name,kind:s.kind,pct:s.pct})),when:S.when,stop:S.stop,parts:S.parts.filter(p=>p.who).map(p=>p.who+' | '+(p.trained||'-')),
    phases:S.phases.map(p=>p.next).filter(Boolean)}));
  ok('1 F389 health and safety: the conditions, what a seizure can look like, the allergies, the emergency medicine by name (no dose), the precautions',
    /Epilepsy/.test(a.health)&&/seizure plan/.test(a.health)&&/Peanuts/.test(a.health)&&/Valtoco \(simulated\) \(for seizure over 5 minutes\)/.test(a.health)&&!/10 mg|Methylphenidate/.test(a.health)&&/Elopement risk/.test(a.health),a.health);
  ok('2 F391 Who to call: the administrator or office first and as the crisis call, the nurse (a possible seizure), the parent without a phone, the case BCBA last',
    /Administrator or front office/.test(a.calls[0].role)&&a.crisis===a.calls[0].role&&a.calls.some(c=>/School nurse/.test(c.role)&&/possible seizure/.test(c.when))&&
    a.calls.some(c=>c.name==='Ana Rivera (simulated)'&&/Parent \(Mother\)/.test(c.role)&&!/555/.test(JSON.stringify(c)))&&/Case BCBA/.test(a.calls[a.calls.length-1].role),a.calls);
  ok('3 F392 the tiers carry their kind (sign, tier, handover trained staff only, recovery)',a.tiers.length===4&&a.tiers[0].kind==='sign'&&a.tiers[1].kind==='tier'&&a.tiers[2].kind==='hand'&&a.tiers[2].train==='yes'&&a.tiers[3].kind==='rec',a.tiers);
  ok('4 F392 the request branch from the plan’s request card: the skill, what it earns and the wait the plan builds in',a.askName==='Asking for a break'&&/2-minute break at the back table/.test(a.honor)&&/delay steps 5 s/.test(a.honor),{askName:a.askName,honor:a.honor});
  ok('5 F390 a "staff do not" of No-s reads as the things not to do',a.rules.includes('Any of these: comments about the behavior, break for hitting.'),a.rules);
  ok('6 F394 the tiles read the current phase, the level before it in brackets, and the note names the phase',a.stats.some(s=>/^0\.8 \| hitting \(simulated\), a day \(4\.2 before\)/.test(s))&&/Since “Break card and task in place” began on 9\/21/.test(a.statnote),{stats:a.stats,note:a.statnote});
  ok('7 F394 the record table is the data sheet: its rows and its words for how; the TB-1 row it does not count is gone',a.rec.includes('Hitting (simulated) | Count each one')&&a.rec.includes('Asking for a break | Tally times / chances')&&!a.rec.some(r=>/Spitting/.test(r)),a.rec);
  ok('8 F395 the replacement is a skill being taught, its level from the data sheet; GB-1’s criterion is not a first-weeks step',a.skills.length>=1&&a.skills[0].name==='Asking for a break'&&a.skills[0].kind==='teach'&&a.skills[0].pct==='75%'&&!a.phases.some(x=>/^\d+$/.test(x)),a.skills);
  ok('9 F395 When is FS-1’s setting event and trigger',/^After a night of poor sleep \(simulated\), and a writing task/.test(a.when),a.when);
  ok('10 I197 the stop line: how he says it and what you do (Form SI-1)',/How he says it: says “stop”; pushes the materials/.test(a.stop)&&/What you do: Say “Okay,” pause the task/.test(a.stop),a.stop);
  ok('11 I199 each adult’s part from Form ST-1, trained or not yet',a.parts.includes('Dana Whitfield (simulated), classroom teacher | yes')&&a.parts.includes('Paula Brennan (simulated), paraeducator | -'),a.parts);
  /* the pages */
  const b=await q.evaluate(()=>{S.checkOn='yes';build();const pages=[...document.querySelectorAll('#out .qs-page')];const flow=document.querySelector('#out .qs-flow');
    const call=[...flow.querySelectorAll('.node.call')].map(n=>n.textContent).join(' ');
    return {n:pages.length,wm:pages.filter(p=>p.querySelector('.qs-wm')).length,foot:pages[0].querySelector('.qs-foot').textContent,handle:(document.querySelector('#out .qs-handle')||{}).textContent||'',
      css:(document.getElementById('qsPageCss')||{}).textContent||'',call,ask:flow.textContent,p3:document.querySelector('#out [data-page="3"]').innerHTML,
      p4:document.querySelector('#out [data-page="4"]').textContent,cc:(document.querySelector('#out .qs-call.crisis')||{}).textContent||'',
      check:document.querySelector('#out .qs-page:last-child').className,qs:document.querySelectorAll('#out .qs-check .qs-qs li').length,key:document.getElementById('qsKey').textContent,
      p2:document.querySelector('#out [data-page="2"]').textContent,review:document.getElementById('review').textContent};});
  ok('12 F390 a draft: every page carries the Draft mark, the foot says it is not yet reviewed, and so does the sheet’s margin',b.wm===b.n&&/Draft: not yet reviewed by the case BCBA/.test(b.foot)&&/DRAFT: not yet reviewed/.test(b.css),{wm:b.wm,n:b.n,foot:b.foot,css:b.css.slice(0,200)});
  ok('13 F393 page one says the plan governs and how the copy is handled',/Where this and the plan differ, the plan governs/.test(b.handle)&&/return it when you no longer work with Mateo/.test(b.handle)&&/plan governs/.test(b.css),b.handle);
  ok('14 F391 the flow sheet’s call is the administrator or office, never the consulting BCBA; page four marks the crisis call',/Administrator or front office/.test(b.call)&&!/Calloway/.test(b.call)&&/Crisis call/.test(b.cc)&&/Administrator or front office/.test(b.cc),{call:b.call,cc:b.cc});
  ok('15 F392 the flow sheet’s request branch names the request; page three marks the handover for trained staff only',/uses the request: Asking for a break/.test(b.ask)&&/qs-train/.test(b.p3),b.ask.slice(0,300));
  ok('16 I197 page three says what to do when he says stop',/When Mateo says stop\./.test(b.p3),'');
  ok('17 I199 page four lists each adult’s part',/Each adult’s part/.test(b.p4)&&/Dana Whitfield \(simulated\), classroom teacher/.test(b.p4)&&/Not yet/.test(b.p4),b.p4.slice(-400));
  ok('18 I200 the reading check is the last page, its questions from these pages and their answers on screen only',/qs-check/.test(b.check)&&b.qs>=5&&/Administrator or front office/.test(b.key)&&/Count each one|Hitting/.test(b.key),{check:b.check,qs:b.qs,key:b.key.slice(0,300)});
  ok('19 F395 page two puts the skills being taught under their own heading',/Skills being taught/.test(b.p2),'');
  ok('20 I197 the plan uses escape extinction with a stop line and no rule for when stop is also the behavior: the review says so',/escape extinction/.test(b.review)&&/Settle it there/.test(b.review),b.review.slice(0,600));
  /* facts out marks the draft rows */
  const o1=await q.evaluate(()=>__nbhFactsOut());
  ok('21 F390 rows still holding the plan’s words go out marked draft',o1&&o1.quick.rules.some(r=>r.draft)&&o1.quick.tiers.some(t=>t.draft)&&o1.quick.draft>0&&o1.quick.tiers.some(t=>t.kind==='hand'&&t.trained),o1&&o1.quick);
  /* Keep as is, one and all */
  const k1=await q.evaluate(()=>{setView('who');const n0=Object.keys(pulledNow()).length;const btn=document.querySelector('#edWho button[data-okp="health"]');if(btn)btn.click();
    return {btn:!!btn,n0,n1:Object.keys(pulledNow()).length,ok:S.ok.health===S.health,mark:!!document.querySelector('#edWho [data-mark="health"].qs-pull')};});
  ok('22 F390 Keep as is on a field takes its mark off and counts it reviewed',k1.btn&&k1.ok&&k1.n1===k1.n0-1&&!k1.mark,k1);
  await q.evaluate(()=>{build();});await sleep(100);
  await q.evaluate(()=>{const b=document.querySelector('#qsOkAll');if(b)b.click();});await sleep(500);
  const k2=await q.evaluate(()=>{build();return {draft:draftN(),wm:document.querySelectorAll('#out .qs-wm').length,css:document.getElementById('qsPageCss').textContent,out:__nbhFactsOut().quick};});
  ok('23 F390 Keep them all: no draft left, no Draft mark, and the rows go out checked',k2.draft===0&&k2.wm===0&&!/DRAFT/.test(k2.css)&&!k2.out.rules.some(r=>r.draft)&&!k2.out.tiers.some(t=>t.draft),{draft:k2.draft,wm:k2.wm});
  /* the Who box follows the plan */
  const c2=BASECASE();c2.profile.strengths='Helps younger students (simulated)';
  const w1=await q.evaluate(c=>{const before=S.who;__nbhFactsIn(c);return {before,after:S.who,changed:S.changed.who||''};},c2);
  ok('24 F397 the Who box, never rewritten, follows the plan’s new words',/Kind to younger/.test(w1.before)&&/Helps younger students/.test(w1.after)&&!w1.changed,w1);
  const c3=BASECASE();c3.profile.strengths='Reads to the kindergarten class (simulated)';
  const w2=await q.evaluate(c=>{S.who='Mateo likes trains (simulated).';__nbhFactsIn(c);return {who:S.who,changed:S.changed.who||''};},c3);
  ok('25 F397 a rewritten Who box keeps its words and is offered the plan’s new ones',w2.who==='Mateo likes trains (simulated).'&&/Reads to the kindergarten/.test(w2.changed),w2);
  /* the consequence box */
  const cq=await q.evaluate(()=>{S.consLead='A lost recess minute (simulated)';S.consOk='';build();const a=!!document.querySelector('#out .qs-consq'),r=document.getElementById('review').textContent;
    S.consOk='yes';build();const h=(document.querySelector('#out .qs-consq .h')||{}).textContent||'';return {a,r,h};});
  ok('26 F396 the consequence box prints only once confirmed as in the consented plan, and then says so',!cq.a&&/does not print until you confirm/.test(cq.r)&&/^In the plan/.test(cq.h),cq);
  /* a new issue */
  const ni=await q.evaluate(async()=>{S.meta.issueNo='2';S.changes='Old change (simulated)';renderEditor();setView('setup');document.querySelector('#qsNewIssue').click();await new Promise(r=>setTimeout(r,300));
    const t=new Date(),iso=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    const r={no:S.meta.issueNo,issued:S.meta.issued===iso,changes:S.changes};S.changes='The break is two minutes, not three (simulated)';build();
    r.strip=(document.querySelector('#out [data-page="1"] .qs-strip.blue')||{}).textContent||'';r.foot=document.querySelector('#out .qs-foot').textContent;return r;});
  ok('27 I198 Start a new issue: the next number, issued today, What changed empty; the change prints on page one and the issue in the foot',ni.no==='3'&&ni.issued&&ni.changes===''&&/What changed in issue 3: The break is two minutes, not three \(simulated\)\./.test(ni.strip)&&/Issue 3, issued/.test(ni.foot),ni);
  /* a pre-kinds table: the recovery only when named so */
  const tk=await q.evaluate(()=>[tierKind({name:'After lunch'}),tierKind({name:'3 · After it is over'}),tierKind({name:'Recovery'}),tierKind({name:'4 · Calm again'}),tierKind({name:'2 · The crisis plan governs'})]);
  ok('28 F392 a row from before kinds is the recovery only when it is named so, never by its place or the word "after"',tk[0]===''&&tk[1]===''&&tk[2]==='rec'&&tk[3]==='rec'&&tk[4]==='hand',tk);
  /* no crisis card */
  const nc=await q.evaluate(()=>{S.calls=[{role:'Case BCBA',name:'Iris Calloway, BCBA (simulated)',when:'questions'}];S.callCrisis='';S.flowCall='';build();
    const call=[...document.querySelectorAll('#out .qs-flow .node.call')].map(n=>n.innerHTML).join(' ');return {call,review:document.getElementById('review').textContent};});
  ok('29 F391 with no crisis card the flow sheet prints a line to write a name, never the BCBA, and the review says so',/wline/.test(nc.call)&&!/Calloway/.test(nc.call)&&/No card is chosen as the crisis call/.test(nc.review),nc);
  /* jargon */
  const jg=await q.evaluate(()=>{S.newline='A setting event, then pairing (simulated)';build();return document.getElementById('review').textContent;});
  ok('30 F390 the wording check names words it passed on a full case',/setting event/.test(jg)&&/pairing/.test(jg),jg.slice(0,500));
  /* ---- TD-1: the request card ---- */
  const td=await open('TD-1','TD-1_Function-Based-Treatment-Developer_v2026-09.html');
  await L.loadSim(td);await sleep(1500);
  const rq=await td.evaluate(()=>{const o=__nbhFactsOut();return o&&o.plan&&o.plan.request||null;});
  ok('31 F392 Form TD-1 sends its request card: the request and what it earns',!!rq&&!!rq.name&&!!rq.reinf,rq);
  /* ---- SI-1: the stop line ---- */
  const si=await open('SI-1','SI-1_Student-Interview-and-Assent_v2026-10.html');
  await L.loadSim(si);await sleep(1500);
  const st=await si.evaluate(()=>{const o=__nbhFactsOut();return o&&o.student&&o.student.stop||null;});
  ok('32 I197 Form SI-1 sends how the student says stop and what staff do then',!!st&&(!!st.signs||!!st.steps),st);
  /* ---- TI-1: a draft rule is not a step ---- */
  const ti=await open('TI-1','TI-1_Treatment-Integrity-Observation_v2026-09.html');
  const tq=await ti.evaluate(()=>{__nbhFactsIn({quick:{rules:[{do:'Praise the break card (simulated)',draft:true},{do:'Offer two choices (simulated)'}],tiers:[]}});return tiQuickSteps().map(s=>s.d||s);});
  ok('33 F390 Form TI-1 does not take a rule QS-1 marks draft',tq.length===1&&/Offer two choices/.test(JSON.stringify(tq)),tq);
  /* ---- TV-1: a draft row is not scripted or quizzed ---- */
  const tv=await open('TV-1','TV-1_Training-Video_v2026-10.html');
  const tvq=await tv.evaluate(()=>{const R=d=>[1,2,3].map(i=>({do:'Do step '+i+' (simulated)',dont:'Do not '+i+' (simulated)',draft:d}));
    __nbhFactsIn({quick:{rules:R(true),tiers:[]}});const a=JSON.stringify(tvQuiz());__nbhFactsIn({quick:{rules:R(false),tiers:[]}});const b=JSON.stringify(tvQuiz());return {a:/on the do list/.test(a),b:/on the do list/.test(b)};});
  ok('33b F390 Form TV-1 does not quiz on rules QS-1 marks draft, and does once they are reviewed',!tvq.a&&tvq.b,tvq);
  /* ---- FS-1: the triggers ride on fn.perBehavior ---- */
  const fs=await open('FS-1','FS-1_FBA-Summary-Report_v2026-09.html');
  await L.loadSim(fs);await sleep(1500);
  const pb=await fs.evaluate(()=>{const o=__nbhFactsOut();return o&&o.fn&&o.fn.perBehavior||[];});
  ok('34 F395 Form FS-1 sends each statement’s setting event and trigger with the function',pb.length>0&&pb.some(b=>b.se||b.ant),pb.slice(0,2));
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('35 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
