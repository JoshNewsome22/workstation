/* v22.37 food items and consent on the forms that run reinforcers (review F120, F135, F409, F401, F13 on MS-1).
   PA-1 and RA-1 take Form IC-1's food-item decision and Form DM-1's allergies into an empty Restrictions / Food items line,
   warn on screen at an edible pool or an Edible stimulus when the parent's decision is not Yes, and ask before a runner
   starts with edibles; RA-1's delivery cue carries the parent's limits. AD-1 asks for "Consent on file (Form IC-1)", fills
   a consent line from the case and says when the case has no consent date. DT-1's parent line is the consent for this
   protocol (filled from IC-1) with a student assent line, and a screen-only line while it is empty. MS-1 fills the release
   date from IC-1's sharing decision. Each form is opened on its own and given a case with nbhCase.apply. Simulated people only.
   usage: node qa/v2237-food-consent-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const U=f=>L.BASE+'/NBH-Workstation/'+f;
const ON={src:'IC-1',state:'Current',on:true,method:'sign',kind:'initial',obtained:'2026-10-06',ended:'',date:'2026-10-06',parent:'2026-10-06',exceptions:'',
  procs:['indirect','abc','pref','reinf','arrange','var'],covered:['indirect','abc','pref','reinf','arrange','var'],bip:'',v:2};
const C=(ed,extra)=>Object.assign({},ON,{dec:{ed:Object.assign({date:'2026-10-06'},ed)}},extra||{});
const PROFILE={client:'Mateo Rivera',health:{allergies:'Peanut (EpiPen on file)'}};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file+': '+e.message));await p.goto(U(file));await sleep(1000);
    /* every question is answered here: a food question by window.__ans, anything else Yes */
    await p.evaluate(()=>{window.__asked=[];window.__ans=false;nbhUI.confirm=async t=>{window.__asked.push(t);return /food items/i.test(t)?window.__ans:true;};});return p;};
  /* the file Save data writes, and a file opened through Open */
  const saved=async p=>{const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('btnSave').click())]);return JSON.parse(L.fs.readFileSync(await dl.path(),'utf8'));};
  const reopen=async(p,o)=>{await p.setInputFiles('#fileIn',{name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(o))});await sleep(500);};

  /* ---------------- PA-1 ---------------- */
  const PA='PA-1_Preference-Assessment-Protocol_v2026-09.html';
  let p=await open(PA);
  const a1=await p.evaluate(([c,pr])=>{const r=nbhCase.apply({consent:c,profile:pr});return {r,v:document.querySelector('[data-meta="restrict"]').value};},[C({dec:'no',allergy:'Peanut'}),{health:PROFILE.health}]);
  ok('1 PA-1: an empty Restrictions line gets the parent’s No, the allergies on IC-1 and in the health record, each with its source',a1.r.filled>=1&&/No food or drink items: the parent said no; allergies or diet: Peanut \(from Form IC-1, 10\/6\/2026\)/.test(a1.v)&&/Allergies in the health record: Peanut \(EpiPen on file\) \(from Form DM-1\)/.test(a1.v),a1);
  const a2=await p.evaluate(c=>{const e=document.querySelector('[data-meta="restrict"]');e.value='No nuts (typed)';e.dispatchEvent(new Event('input',{bubbles:true}));nbhCase.apply({consent:c});return e.value;},C({dec:'yes',items:'Goldfish crackers'}));
  ok('2 PA-1: a Restrictions line already typed is never overwritten',a2==='No nuts (typed)',a2);
  const w0=await p.evaluate(()=>[document.getElementById('paFoodPool').hidden,document.getElementById('paFoodStim').hidden]);
  await p.evaluate(c=>nbhCase.apply({consent:c}),C({dec:'no'}));
  const w1=await p.evaluate(()=>{const s=document.querySelector('[data-meta="pool"]');s.value='Edibles';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));
    const n=document.querySelector('#poolTbl input[data-f="name"][data-i="0"]');n.value='Goldfish crackers';n.dispatchEvent(new Event('input',{bubbles:true}));
    const t=document.querySelector('#poolTbl select[data-f="type"][data-i="0"]');t.value='Edible';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));
    const a=document.getElementById('paFoodPool'),b=document.getElementById('paFoodStim');return {a:a.hidden?'':a.textContent,b:b.hidden?'':b.textContent,np:a.classList.contains('noprint')&&b.classList.contains('noprint')};});
  ok('3 PA-1: no warning before an edible is added',w0[0]&&w0[1],w0);
  ok('4 PA-1: a pool of edibles and an Edible row each warn on screen: the parent said No (Form IC-1)',/records the parent’s No to food or drink items, and this pool is of edibles/.test(w1.a)&&/Edible in this pool: Goldfish crackers/.test(w1.b)&&/Specific procedures B/.test(w1.b),w1);
  ok('5 PA-1: the warnings are screen-only (noprint)',w1.np,w1);
  await p.evaluate(()=>{document.querySelector('[data-view="ss"]')&&document.querySelector('[data-view="ss"]').click();});await sleep(200);
  const g1=await p.evaluate(async()=>{window.__ans=false;document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));
    return {asked:window.__asked.filter(t=>/food items/.test(t)),btn:document.getElementById('pa-run-ss-start').textContent,msg:document.getElementById('pa-run-ss-msg').textContent};});
  ok('6 PA-1: starting a runner with edibles asks first; Cancel leaves it not started and says why',g1.asked.length===1&&/Run this assessment with food items\?/.test(g1.asked[0])&&/Goldfish crackers/.test(g1.asked[0])&&g1.btn==='Start trial'&&/Not started/.test(g1.msg),g1);
  const g2=await p.evaluate(async()=>{window.__ans=true;window.__asked=[];document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,400));
    const r={asked:window.__asked.length,btn:document.getElementById('pa-run-ss-start').textContent,warn:document.getElementById('paFoodStim').textContent};
    document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,100));
    const e=document.getElementById('pa-run-ss-end');e.click();await new Promise(r=>setTimeout(r,300));
    window.__asked=[];document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));r.again=window.__asked.filter(t=>/food items/.test(t)).length;return r;});
  ok('7 PA-1: "Run with food items" starts it, the go-ahead is noted with the date, and it is not asked again for the same items',g2.asked===1&&g2.btn==='Pause'&&/confirmed by the assessor on \d+\/\d+\/\d{4}/.test(g2.warn)&&g2.again===0,g2);
  await p.close();
  p=await open(PA);
  const y=await p.evaluate(async c=>{const r=nbhCase.apply({consent:c});const s=document.querySelector('[data-meta="pool"]');s.value='Edibles';s.dispatchEvent(new Event('input',{bubbles:true}));
    const t=document.querySelector('#poolTbl select[data-f="type"][data-i="0"]');t.value='Edible';t.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));
    return {v:document.querySelector('[data-meta="restrict"]').value,a:document.getElementById('paFoodPool').hidden&&document.getElementById('paFoodStim').hidden,asked:window.__asked.length,btn:document.getElementById('pa-run-ss-start').textContent};},
    C({dec:'yes',items:'Goldfish crackers, fruit snacks',allergy:'None reported',limits:'One small serving per session'}));
  ok('8 PA-1: the parent’s Yes: approved items, allergies and limits in Restrictions; no warning, no question',/^Food items approved: Goldfish crackers, fruit snacks; allergies or diet: None reported; limits: One small serving per session \(from Form IC-1, 10\/6\/2026\)$/.test(y.v)&&y.a&&y.asked===0&&y.btn==='Pause',y);
  await p.close();
  p=await open(PA);
  const n0=await p.evaluate(async()=>{const s=document.querySelector('[data-meta="pool"]');s.value='Edibles';s.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));
    return {a:document.getElementById('paFoodPool').hidden,asked:window.__asked.length,btn:document.getElementById('pa-run-ss-start').textContent,v:document.querySelector('[data-meta="restrict"]').value};});
  ok('9 PA-1 on its own (no case): no warning, no question, Restrictions untouched',n0.a&&n0.asked===0&&n0.btn==='Pause'&&n0.v==='',n0);
  await p.evaluate(()=>document.getElementById('pa-run-ss-end').click());await sleep(300);await p.close();
  p=await open(PA);
  const nr=await p.evaluate(()=>{nbhCase.apply({consent:{date:'2026-09-01',parent:'',src:'IC-1'}});const s=document.querySelector('[data-meta="pool"]');s.value='Mixed (document rationale)';s.dispatchEvent(new Event('input',{bubbles:true}));
    return {v:document.querySelector('[data-meta="restrict"]').value,a:document.getElementById('paFoodPool').textContent};});
  ok('10 PA-1, an old case with no food decision: "not recorded" in Restrictions and a warning on a mixed pool',/food-item decision is not recorded: no edibles until it is \(from Form IC-1\)/.test(nr.v)&&/does not record the parent’s decision on food items, and this pool is mixed/.test(nr.a),nr);
  await p.close();

  /* ---------------- RA-1 ---------------- */
  const RA='Reinforcer_Assessment_Protocol.html';
  p=await open(RA);
  const r1=await p.evaluate(([c,pr])=>{const r=nbhCase.apply({consent:c,profile:pr});const t=document.querySelector('#stimTbl select[data-f="type"][data-i="1"]');
    const n=document.querySelector('#stimTbl input[data-f="name"][data-i="1"]');n.value='Fruit chew';n.dispatchEvent(new Event('input',{bubbles:true}));
    t.value='Edible';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));
    const w=document.getElementById('raFoodWarn');return {r,v:document.querySelector('[data-meta="food"]').value,w:w.hidden?'':w.textContent,np:w.classList.contains('noprint')};},[C({dec:'na'}),{health:PROFILE.health}]);
  ok('11 RA-1: Setup’s new Food items line gets "not proposed" from IC-1 and the health-record allergies, with their sources',/^Food items were not proposed: none without the parent’s approval \(from Form IC-1, 10\/6\/2026\)\. Allergies in the health record: Peanut \(EpiPen on file\) \(from Form DM-1\)$/.test(r1.v)&&r1.r.filled>=1,r1);
  ok('12 RA-1: an Edible stimulus warns on screen under the stimuli table (noprint)',/not proposed on Form IC-1/.test(r1.w)&&/Edible on this sheet: Fruit chew/.test(r1.w)&&r1.np,r1);
  await sleep(300);
  const r2=await p.evaluate(async()=>{const s=document.getElementById('ra-run-so-cond');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));
    window.__ans=false;document.getElementById('ra-run-so-start').click();await new Promise(r=>setTimeout(r,300));
    const a={asked:window.__asked.filter(t=>/food items/.test(t)),st:raRunner.state('so'),msg:document.getElementById('ra-run-so-msg').textContent};
    s.value='ctl';s.dispatchEvent(new Event('change',{bubbles:true}));window.__asked=[];document.getElementById('ra-run-so-start').click();await new Promise(r=>setTimeout(r,200));
    a.ctlAsked=window.__asked.length;a.ctlSt=raRunner.state('so');return a;});
  ok('13 RA-1: a session delivering the edible asks first; Cancel leaves it ready and says why',r2.asked.length===1&&/Deliver food items in this session\?/.test(r2.asked[0])&&/Fruit chew/.test(r2.asked[0])&&r2.st==='ready'&&/Not started/.test(r2.msg),r2);
  ok('14 RA-1: a control session is not asked about',r2.ctlAsked===0&&r2.ctlSt==='run',r2);
  await p.close();
  p=await open(RA);
  const r3=await p.evaluate(async c=>{nbhCase.apply({consent:c});const n=document.querySelector('#stimTbl input[data-f="name"][data-i="1"]');n.value='Fruit chew';n.dispatchEvent(new Event('input',{bubbles:true}));
    const t=document.querySelector('#stimTbl select[data-f="type"][data-i="1"]');t.value='Edible';t.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
    const s=document.getElementById('ra-run-so-cond');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('ra-run-so-start').click();await new Promise(r=>setTimeout(r,200));document.getElementById('ra-run-so-resp').click();await new Promise(r=>setTimeout(r,100));
    return {asked:window.__asked.length,st:raRunner.state('so'),msg:document.getElementById('ra-run-so-msg').textContent,w:document.getElementById('raFoodWarn').hidden,v:document.querySelector('[data-meta="food"]').value};},
    C({dec:'yes',items:'Fruit chews',allergy:'None reported',limits:'One small serving per session'}));
  ok('15 RA-1, the parent’s Yes: no warning or question, and the cue to deliver the edible carries the limit',r3.asked===0&&r3.st==='run'&&r3.w&&/Deliver Fruit chew now.*Food limit \(Form IC-1\): One small serving per session\./.test(r3.msg)&&/^Food items approved: Fruit chews/.test(r3.v),r3);
  await p.close();

  /* ---------------- AD-1 ---------------- */
  const AD='AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html';
  p=await open(AD);
  const d0=await p.evaluate(()=>({sig:document.querySelector('#p1 .sig').textContent,note:document.getElementById('adConsentNote').hidden,v:document.querySelector('[name="s_consent"]').value}));
  ok('16 AD-1: the line reads "Consent on file (Form IC-1) / date", not "notified"; on its own, no notice and the consent line empty',/Consent on file \(Form IC-1\) \/ date/.test(d0.sig)&&!/notified/.test(d0.sig)&&d0.note&&d0.v==='',d0);
  const d1=await p.evaluate(c=>{const r=nbhCase.apply({consent:c});return {r,v:document.querySelector('[name="s_consent"]').value,note:document.getElementById('adConsentNote').hidden};},C({dec:'yes'}));
  const adFile=await saved(p);d1.saved=adFile.fields.s_consent;
  ok('17 AD-1: the consent line fills from the case: consent on file since 10/6/2026 and IC-1 covers the arrangement comparison; saved with the file',d1.v==='Consent on file since 10/6/2026 (Form IC-1); covers the reinforcer arrangement comparison'&&d1.note&&d1.saved===d1.v&&d1.r.filled>=1,d1);
  const d2=await p.evaluate(c=>{document.querySelector('[name="s_consent"]').value='';nbhCase.apply({consent:c});return document.querySelector('[name="s_consent"]').value;},Object.assign(C({}),{covered:['indirect','abc']}));
  ok('18 AD-1: consent on file that leaves out the comparison says so',/does not cover the reinforcer arrangement comparison \(not ticked on Form IC-1\)/.test(d2),d2);
  const d3=await p.evaluate(c=>{document.querySelector('[name="s_consent"]').value='';nbhCase.apply({consent:c});const n=document.getElementById('adConsentNote');return {v:document.querySelector('[name="s_consent"]').value,note:n.hidden?'':n.textContent,np:n.classList.contains('noprint')};},
    {src:'IC-1',state:'Pending',on:false,obtained:'',date:'',parent:'',covered:[],dec:{},v:2});
  ok('19 AD-1: no consent date in the case: the screen-only notice "No consent in the case: complete Form IC-1 before the first probe."',d3.note==='No consent in the case: complete Form IC-1 before the first probe.'&&d3.np&&/^Consent pending/.test(d3.v),d3);
  delete adFile.fields.s_consent;await p.evaluate(()=>{document.querySelector('[name="s_consent"]').value='x';});await reopen(p,adFile);
  const d4=await p.evaluate(()=>document.querySelector('[name="s_consent"]').value);
  ok('20 AD-1: a file saved before the consent line opens with it empty',d4==='',d4);
  await p.close();

  /* ---------------- DT-1 ---------------- */
  const DT='Delay-Tolerance-Protocol-Toolkit.html';
  p=await open(DT);
  const t0=await p.evaluate(()=>{const n=document.getElementById('dtConsentNote');return {p1:document.getElementById('p1').textContent,note:n.hidden?'':n.textContent,np:n.classList.contains('noprint'),
    l1:!!document.querySelector('[name="s_consent"]'),l2:!!document.querySelector('[name="s_assent"]')};});
  ok('21 DT-1: the parent line is the consent for this protocol (Form IC-1 item and date), with a student assent line (Form SI-1); "notified" is gone',/Parent or guardian consent for this protocol \(Form IC-1 item and date\)/.test(t0.p1)&&/Student assent plan and response \(Form SI-1, date\)/.test(t0.p1)&&!/Parent or guardian notified/.test(t0.p1)&&t0.l1&&t0.l2,{l1:t0.l1,l2:t0.l2});
  ok('22 DT-1: while the consent field is empty, a screen-only line says it is not recorded',/Parent consent for this protocol is not recorded/.test(t0.note)&&t0.np,t0.note);
  const t1=await p.evaluate(c=>{nbhCase.apply({consent:c});const n=document.getElementById('dtConsentNote');return {v:document.querySelector('[name="s_consent"]').value,note:n.hidden};},C({}));
  const dtFile=await saved(p);t1.saved=dtFile.fields.s_consent;
  ok('23 DT-1: IC-1 has consent on file covering the item: the field fills (item and date), saved with the file, the line goes',t1.v==='Analysis of specific variables (waiting practice): Consent on file since 10/6/2026 (Form IC-1)'&&t1.note&&t1.saved===t1.v,t1);
  const t2=await p.evaluate(c=>{const e=document.querySelector('[name="s_consent"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));nbhCase.apply({consent:c});const n=document.getElementById('dtConsentNote');return {v:e.value,note:n.hidden?'':n.textContent};},Object.assign(C({}),{covered:['indirect','abc']}));
  ok('24 DT-1: consent that does not cover the item leaves the field empty and the line says why',t2.v===''&&/Form IC-1 does not cover this protocol/.test(t2.note),t2);
  delete dtFile.fields.s_consent;delete dtFile.fields.s_assent;await p.evaluate(()=>{document.querySelector('[name="s_consent"]').value='x';document.querySelector('[name="s_assent"]').value='y';});await reopen(p,dtFile);
  const t3=await p.evaluate(()=>[document.querySelector('[name="s_consent"]').value,document.querySelector('[name="s_assent"]').value,document.getElementById('dtConsentNote').hidden]);
  ok('25 DT-1: a file saved before these lines opens with them empty, and the line is back',t3[0]===''&&t3[1]===''&&t3[2]===false,t3);
  await p.emulateMedia({media:'print'});
  ok('26 DT-1: the line is not printed',await p.evaluate(()=>getComputedStyle(document.getElementById('dtConsentNote')).display==='none'));
  await p.close();

  /* ---------------- MS-1 ---------------- */
  const MS='MS-1_Medication-Side-Effect-Monitoring_v2026-09.html';
  p=await open(MS);
  const m1=await p.evaluate(c=>{const r=nbhCase.apply({consent:c});return {r,v:document.querySelector('[name="m.roi"]').value};},Object.assign(C({}),{dec:{sh:{dec:'yes',who:'Dr. Sample (simulated)',roi:true,roidate:'2026-10-01'}}}));
  ok('27 MS-1: the release date fills from IC-1’s sharing decision, marked (Form IC-1, Specific procedures D)',m1.v==='10/1/2026 (Form IC-1, Specific procedures D)'&&m1.r.filled>=1&&/release date from Form IC-1/.test(m1.r.note),m1);
  const m2=await p.evaluate(c=>{const e=document.querySelector('[name="m.roi"]');e.value='On file 9/2/2026 (typed)';nbhCase.apply({consent:c});const a=e.value;e.value='';
    nbhCase.apply({consent:Object.assign({},c,{dec:{sh:{dec:'yes',roi:false,roidate:'2026-10-01'}}})});return [a,e.value];},Object.assign(C({}),{dec:{sh:{dec:'yes',roi:true,roidate:'2026-10-01'}}}));
  ok('28 MS-1: a typed release date is kept; no release marked on IC-1 fills nothing',m2[0]==='On file 9/2/2026 (typed)'&&m2[1]==='',m2);
  await p.close();

  ok('29 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
