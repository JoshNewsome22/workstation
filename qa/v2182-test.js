/* v21.82 the shell: the new case facts (SV-1 sv, CF-1 fit, SI-1 student, ST-1 staff) gathered from the open forms; Today's
   items for a plan in use with no record of the team adopting it and for a PR-1 decision with no revision recorded; Ready to
   start (what the plan still needs before it begins); the hand-over check; the transition summary's decisions on record.
   Simulated students only (Mateo Rivera 4471823). usage: node qa/v2182-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};});
  await page.fill('#pClient','Mateo Rivera');await page.dispatchEvent('#pClient','input');
  /* 1. the four forms' facts reach the case */
  const sim=async id=>page.evaluate(async id=>{openForm(id);const fr=state.frames[id];await new Promise(r=>{if(fr.dataset.loaded)r();fr.addEventListener('load',r,{once:true});setTimeout(r,20000);});
    for(let i=0;i<40&&!state.status[id];i++)await new Promise(r=>setTimeout(r,250));
    try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,2000));}}catch(e){}},id);
  for(const id of ['SV-1','CF-1','SI-1','ST-1'])await sim(id);
  await page.evaluate(async()=>{await gatherFacts(false);});
  const f1=await page.evaluate(()=>{const f=state.facts||{};return {sv:!!(f.sv&&(f.sv.pre||f.sv.post)),fit:!!(f.fit&&f.fit.mean!=null),student:!!f.student,staff:!!(f.staff&&(f.staff.people||[]).length),src:f.src};});
  ok('1 SV-1, CF-1, SI-1 and ST-1 give the case their facts (sv, fit, student, staff)',f1.sv&&f1.fit&&f1.student&&f1.staff&&f1.src.sv==='SV-1'&&f1.src.fit==='CF-1'&&f1.src.student==='SI-1'&&f1.src.staff==='ST-1',f1);
  await page.evaluate(()=>clearCase());await sleep(500);
  /* 2. Today and the hand-over check */
  const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const T=await page.evaluate(D=>{const base={src:{},plan:{rep:'Hand the break card',beh:'Aggression'},data:{conds:[{name:'Baseline',from:D.m40},{name:'Plan',from:D.m20}],behaviors:[]}};
    setFacts(JSON.parse(JSON.stringify(base)),false);const a=todayItems().map(x=>x.t),ha=handoverItems().map(x=>x.t);
    const b2=JSON.parse(JSON.stringify(base));b2.plan.adoption={date:D.m25,team:'Teacher, parent, BCBA',notice:D.m24,start:D.m20,version:1};b2.plan.versions=[{v:1,why:'adopted',date:D.m25,notice:D.m24}];
    b2.review={date:D.m2,log:[{date:D.m2,decision:'modify',decisionText:'Modify the plan',data:'Aggression 3.1 a day',integrity:'92%',sv:'4.8 of 6',actions:'Thin the break schedule'}]};
    setFacts(b2,false);const b=todayItems().map(x=>x.t),hb=handoverItems().map(x=>x.t),sum=tdSummaryHTML();
    const b3=JSON.parse(JSON.stringify(b2));b3.plan.versions.push({v:2,why:'modified',date:D.m1,notice:''});setFacts(b3,false);const c=todayItems().map(x=>x.t);
    return {a,ha,b,hb,c,sum};},{m40:iso(-40),m25:iso(-25),m24:iso(-24),m20:iso(-20),m2:iso(-2),m1:iso(-1)});
  ok('2a a plan in use with no record of the team adopting it: a Today item (Form TD-1) and a hand-over item',T.a.some(t=>/no record of the team adopting it/.test(t))&&T.ha.some(t=>/No record of the team adopting the plan/.test(t)),{a:T.a,ha:T.ha});
  ok('2b adopted: that item goes; PR-1 decided to modify after the last version: record the revision and its notice',!T.b.some(t=>/no record of the team adopting/.test(t))&&T.b.some(t=>/decided to modify the plan on .*record the revision/.test(t)),T.b);
  ok('2c the revision recorded without a notice date: said so',T.c.some(t=>/revision of .* has no prior written notice date/.test(t))&&!T.c.some(t=>/record the revision/.test(t)),T.c);
  ok('2d the transition summary carries the decisions on record (adoption, the review and its reasons)',/Decisions on record/.test(T.sum)&&/plan adopted by the team/.test(T.sum)&&/Modify the plan/.test(T.sum)&&/Thin the break schedule/.test(T.sum),T.sum.slice(T.sum.indexOf('Decisions'),T.sum.indexOf('Decisions')+400));
  /* 3. Ready to start */
  const R=await page.evaluate(async D=>{const f={src:{},consent:{date:D.m40},fn:{key:'escape',label:'Escape'},plan:{rep:'Hand the break card',adoption:{date:D.m2,notice:D.m2,start:D.p3}},
      staff:{people:[{name:'Ms. A',role:'Teacher',met:true,date:D.m1},{name:'Mr. B',role:'Aide',met:false}],all:false},profile:{flags:{safety:['Elopement']}},data:{from:D.m10,to:D.m1}};
    setFacts(f,false);gatherFacts=async()=>{};await readyOpen();const items=[...document.querySelectorAll('#dlgBody .td-list li')].map(li=>li.textContent);const today=todayItems().map(x=>x.t);
    f.staff.people[1].met=true;f.staff.all=true;f.fit={mean:5,scale:'1-6'};f.sv={pre:{mean:5,n:3}};f.crisis={stages:[{s:'Early signs'}]};setFacts(f,false);await readyOpen();
    const items2=[...document.querySelectorAll('#dlgBody .td-list li')].map(li=>li.textContent),done=(document.querySelector('#dlgBody').textContent||'');
    await todayOpen();const btn=!!document.getElementById('tdReady');
    return {items,today,items2,done,btn,cmd:CMDS.some(c=>/Ready to start/.test(c.n))};},{m40:iso(-40),m10:iso(-10),m2:iso(-2),m1:iso(-1),p3:iso(3)});
  ok('3a Ready to start lists what is missing: an implementer not at criterion, contextual fit, social validity before the plan, a crisis plan for the safety flag',R.items.some(t=>/1 of 2 implementers not yet at criterion: Mr\. B/.test(t))&&R.items.some(t=>/Contextual fit/.test(t))&&R.items.some(t=>/social validity/i.test(t))&&R.items.some(t=>/crisis plan/.test(t)),R.items);
  ok('3b the plan starts in 3 days with things not ready: a Today item',R.today.some(t=>/The plan starts .* not ready: see Ready to start/.test(t)),R.today);
  ok('3c with all in place: "Everything is in place"; Ready to start is in Today and a command',!R.items2.length&&/Everything is in place/.test(R.done)&&R.btn&&R.cmd,{items2:R.items2,btn:R.btn,cmd:R.cmd});
  ok('no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
