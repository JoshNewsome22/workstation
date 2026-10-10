/* v21.78 helper C1: the case facts of Forms DM-1, RR-1, MS-1, CT-1 and IC-1 (simulated student only: Mateo Rivera):
   1. DM-1 out: the profile keeps its parts and gains health (the medications table, prescriber, allergies, conditions)
      and dates (annual IEP, reevaluation), from the form's simulation; an empty form sends nothing;
   2. RR-1 in: the consent date (IC-1), the health record (DM-1) into the empty fields only; nothing typed is overwritten;
      RR-1 out: records, from a saved record's removal ledger (10 counted school days: at10), the manifestation
      determination date, the IEP and reevaluation dates and the consent date;
   3. MS-1 in: the medications into the empty cards (library match, Other with the name, a card added), the prescriber,
      the history, the BIP target; nothing typed is overwritten;
   4. CT-1 in: the consent date, the protocol steps of TV-1 into an empty step list (not a started one), the reinforcers
      at home from PA-1's menu; through nbhCase.apply;
   5. IC-1 in: the behaviors of concern with their definitions; not over typed words; the consent out still works;
   6. no page errors.
   usage: node qa/v2178-c1-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,BASE,sleep}=require(__dirname+'/lib.js');
const U=f=>BASE+'/NBH-Workstation/'+f;
const DM=U('DM-1_Student-Demographics-and-Profile_v2026-09.html'),RR=U('RR-1_Records-Review_v2026-09.html'),MS=U('MS-1_Medication-Side-Effect-Monitoring_v2026-09.html'),
  CT=U('CT-1_Caregiver-Training_v2026-09.html'),IC=U('IC-1_Informed-Consent-FBA-BIP_v2026-09.html');
const OUT=path.join(__dirname,'out','v2178c1');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const CASE={behaviors:[{label:'Elopement',def:'Leaving the assigned area by more than three feet without permission',dim:'frequency',type:'target'},
    {label:'Physical aggression',def:'Hitting, kicking or pushing another person',dim:'frequency',type:'target'},{label:'Asking for a break',isRep:true,type:'replacement'}],
  fn:{key:'escape',label:'Escape from demands',statements:[]},
  menu:[{name:'Drawing time',rank:2},{name:'Music on headphones',rank:1},{name:'Stickers',rank:3,tier:'LP'}],
  consent:{date:'2026-09-02',parent:'2026-09-03',src:'IC-1'},
  training:{steps:[{d:'Give the five-minute warning.',crit:false,cmp:''},{d:'Put the break card within reach and say once: "You can ask for a break."',crit:true,cmp:''},{d:'Praise the ask and give the break at once.',crit:true,cmp:''}],src:'TV-1'},
  profile:{strengths:'reads well',src:'DM-1',health:{meds:[{name:'Risperidone',dose:'0.5 mg',times:'Once daily (AM), 8:00',reason:'Irritability'},{name:'Guanfacine ER',dose:'1 mg',times:'Once daily (PM)',reason:'Attention'},{name:'Samplezine',dose:'5 mg',times:'Twice daily',reason:'Simulated'}],
    prescriber:'Dr. Sample (simulated)',allergies:'None known',conditions:'Seizure disorder; constipation per parent'},dates:{iep:'2027-05-11',iepHeld:'2026-05-12',reeval:'2027-10-19'}}};
const OTHER=JSON.parse(JSON.stringify(CASE));Object.assign(OTHER,{consent:{date:'2026-01-01'},behaviors:[{label:'Spitting',def:'Spitting at people'}],training:{steps:[{d:'Other step',crit:true}]},menu:[{name:'Bubbles',rank:1}]});
OTHER.profile.health={meds:[{name:'Sertraline',dose:'25 mg'}],prescriber:'Dr. Other',allergies:'Peanuts',conditions:'Asthma'};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});
  const errs=[];const open=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url.split('/').pop()+': '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(url.split('/').pop()+' console: '+m.text());});
    p.on('dialog',d=>d.accept().catch(()=>{}));await p.clock.setFixedTime(new Date('2026-10-10T12:00:00'));await p.goto(url);await sleep(900);await p.evaluate(()=>{if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};

  /* 1. DM-1 out */
  let p=await open(DM);
  ok('DM-1: an empty form sends no profile',await p.evaluate(()=>window.__nbhFactsOut())===null);
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(700);
  const dm=await p.evaluate(()=>window.__nbhFactsOut());const pr=dm&&dm.profile||{},h=pr.health||{},dd=pr.dates||{};
  ok('DM-1: the profile keeps its own parts (strengths, flags)',!!pr.strengths&&!!pr.flags&&pr.src==='DM-1',pr);
  ok('DM-1: health.meds from the medications table ({name,dose,times,reason})',Array.isArray(h.meds)&&h.meds.length>=1&&h.meds[0].name==='Risperidone'&&h.meds[0].dose==='0.5 mg'&&/Once daily/.test(h.meds[0].times)&&/8:00/.test(h.meds[0].times)&&/Irritability/.test(h.meds[0].reason),h);
  ok('DM-1: prescriber, allergies, conditions',/Dr\. Sample/.test(h.prescriber)&&h.allergies==='None known'&&/Seizure/.test(h.conditions),h);
  ok('DM-1: dates.iep (annual review) and dates.reeval, ISO',/^\d{4}-\d{2}-\d{2}$/.test(dd.iep||'')&&/^\d{4}-\d{2}-\d{2}$/.test(dd.reeval||''),dd);
  await p.evaluate(()=>{const e=document.querySelector('[name="p.annual"]');e.value='';const r=document.querySelector('[name="p.iepdate"]');r.value='2026-05-12';});
  ok('DM-1: dates.iep falls back to the current IEP date',(await p.evaluate(()=>window.__nbhFactsOut().profile.dates.iep))==='2026-05-12');
  await p.close();

  /* 2. RR-1 in and out */
  p=await open(RR);
  await p.evaluate(()=>{document.querySelector('[name="m.dx"]').value='Typed by the BCBA';});
  let r=await p.evaluate(c=>window.__nbhFactsIn(c),CASE);
  const rv=await p.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {consent:v('h.consent'),cond:v('m.cond'),out:v('s.outside'),n0:v('md[0].n'),d0:v('md[0].dose'),n1:v('md[1].n'),n2:v('md[2].n'),n3:v('md[3].n'),annual:v('i.annual'),iep:v('i.iepdate'),reeval:v('i.reeval'),dx:v('m.dx')};});
  ok('RR-1 in: h.consent from f.consent.date',rv.consent==='2026-09-02',rv);
  ok('RR-1 in: health conditions and allergies into m.cond; prescriber into outside services',/Seizure disorder/.test(rv.cond)&&/Allergies: None known/.test(rv.cond)&&/Dr\. Sample/.test(rv.out),rv);
  ok('RR-1 in: the medications into the empty rows',rv.n0==='Risperidone'&&/0\.5 mg/.test(rv.d0)&&rv.n1==='Guanfacine ER'&&rv.n2==='Samplezine'&&rv.n3==='',rv);
  ok('RR-1 in: the IEP and reevaluation dates',rv.annual==='2027-05-11'&&rv.iep==='2026-05-12'&&rv.reeval==='2027-10-19',rv);
  ok('RR-1 in: a typed field kept; filled count returned',rv.dx==='Typed by the BCBA'&&r&&r.filled>=8,r);
  r=await p.evaluate(c=>window.__nbhFactsIn(c),OTHER);
  const rv2=await p.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {consent:v('h.consent'),cond:v('m.cond'),n3:v('md[3].n')};});
  ok('RR-1 in: a second case overwrites nothing (a new medication takes the empty row)',rv2.consent==='2026-09-02'&&/Seizure/.test(rv2.cond)&&rv2.n3==='Sertraline',rv2);
  ok('RR-1 out: no ledger, the dates and consent only',await p.evaluate(()=>{const o=window.__nbhFactsOut();return !!o&&!o.records.removals&&o.records.consent==='2026-09-02'&&o.records.iep==='2027-05-11'&&o.records.reeval==='2027-10-19';}));
  const rec={form:'RR-1',rev:'2026-09',counts:{},fields:{'h.client':'Mateo Rivera','h.consent':'2026-09-02','i.iepdate':'2026-05-12','i.annual':'2027-05-11','i.reeval':'2027-10-19'},
    ledger:{v:1,ns:[],yr:{'2026':{pd:'',pv:'',pb:'',cd:'2026-10-01',nd:'2026-10-01',md:'2026-10-08',mv:'yes'}},rows:[
      {s:'2026-09-08',e:'2026-09-11',p:'',t:'oss',o:'',ow:'',c:'yes',cr:'Out-of-school suspension (simulated)',g:'',n:''},
      {s:'2026-09-21',e:'2026-09-25',p:'',t:'oss',o:'',ow:'',c:'yes',cr:'Out-of-school suspension (simulated)',g:'',n:''},
      {s:'2026-10-01',e:'',p:'',t:'iss',o:'',ow:'',c:'yes',cr:'ISS without services (simulated)',g:'',n:''},
      {s:'2025-11-03',e:'',p:'',t:'oss',o:'',ow:'',c:'yes',cr:'Last school year (simulated)',g:'',n:''}]}};
  const rf=path.join(OUT,'RR-1_sim.json');fs.writeFileSync(rf,JSON.stringify(rec));
  await p.setInputFiles('#fileIn',rf);await sleep(600);
  const ro=await p.evaluate(()=>window.__nbhFactsOut());const R=ro&&ro.records||{},RM=R.removals||{};
  ok('RR-1 out: removals.days = 10 counted school days this school year, at10 true',RM.days===10&&RM.at10===true,R);
  ok('RR-1 out: removals.list has this year\'s three rows ({date,days,kind})',Array.isArray(RM.list)&&RM.list.length===3&&RM.list[0].date==='2026-09-08'&&RM.list[0].days===4&&/Out-of-school/.test(RM.list[0].kind)&&RM.list[2].days===1,RM.list);
  ok('RR-1 out: mdr, iep, reeval, consent',R.mdr==='2026-10-08'&&R.iep==='2027-05-11'&&R.reeval==='2027-10-19'&&R.consent==='2026-09-02',R);
  await p.close();

  /* 3. MS-1 in */
  p=await open(MS);
  await p.evaluate(()=>{document.querySelector('[name="m.docfax"]').value='typed';});
  r=await p.evaluate(c=>window.__nbhFactsIn(c),CASE);
  const mv=await p.evaluate(()=>{const v=n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;};const lib=i=>{const e=document.querySelector('[name="md['+i+'].lib"]');return e&&e.value!==''?e.options[e.selectedIndex].textContent:'';};
    return {n:+document.getElementById('nMed').value,l0:lib(0),d0:v('md[0].dose'),l1:lib(1),l2:lib(2),name2:v('md[2].name'),doc:v('m.doc'),hx:v('m.hx'),bip:v('m.bip'),fax:v('m.docfax'),hd:document.getElementById('hdMeds').textContent,t2:document.getElementById('medTtl2').textContent};});
  ok('MS-1 in: medications matched to the library (generic name; ER form)',/^Risperidone/.test(mv.l0)&&/0\.5 mg/.test(mv.d0)&&/8:00/.test(mv.d0)&&/^Guanfacine ER/.test(mv.l1),mv);
  ok('MS-1 in: an unknown medication as Other with its name; a third card added',mv.n===3&&/^Other/.test(mv.l2)&&mv.name2==='Samplezine'&&mv.t2==='Samplezine',mv);
  ok('MS-1 in: prescriber, history, BIP target (first target label)',/Dr\. Sample/.test(mv.doc)&&/Seizure/.test(mv.hx)&&/Allergies: None known/.test(mv.hx)&&mv.bip==='Elopement'&&mv.fax==='typed',mv);
  ok('MS-1 in: the header lists the medications; filled count',/Risperidone/.test(mv.hd)&&r&&r.filled>=6,{hd:mv.hd,r});
  await p.evaluate(c=>window.__nbhFactsIn(c),OTHER);
  const mv2=await p.evaluate(()=>({n:+document.getElementById('nMed').value,doc:document.querySelector('[name="m.doc"]').value,bip:document.querySelector('[name="m.bip"]').value,hx:document.querySelector('[name="m.hx"]').value}));
  ok('MS-1 in: a second case overwrites nothing',/Dr\. Sample/.test(mv2.doc)&&mv2.bip==='Elopement'&&/Seizure/.test(mv2.hx)&&mv2.n===4,mv2);
  r=await p.evaluate(c=>window.__nbhFactsIn(c),CASE);
  ok('MS-1 in: the same case again adds no card',(await p.evaluate(()=>+document.getElementById('nMed').value))===4&&r.filled===0,r);
  await p.close();

  /* 4. CT-1 in */
  p=await open(CT);
  r=await p.evaluate(c=>window.nbhCase.apply(c),CASE);
  const cv=await p.evaluate(()=>({consent:document.querySelector('[data-m="consent"]').value,mc:S.meta.consent,home:document.querySelector('[data-m="homeR"]').value,steps:S.steps.map(s=>[s.d,s.crit]),rows:document.querySelectorAll('#stepTbl tbody tr').length}));
  ok('CT-1 in: the consent date (and form) into data-m="consent"',/^9\/2\/2026 \(Form IC-1; parent signed 9\/3\/2026\)$/.test(cv.consent)&&cv.mc===cv.consent,cv);
  ok('CT-1 in: the protocol steps of TV-1 with Critical',cv.steps.length===3&&cv.steps[1][1]===true&&cv.steps[0][1]===false&&/five-minute/.test(cv.steps[0][0])&&cv.rows===3,cv);
  ok('CT-1 in: reinforcers at home offered from the menu, by rank, without LP',/check with the family/.test(cv.home)&&/Music on headphones, Drawing time/.test(cv.home)&&!/Stickers/.test(cv.home),cv.home);
  ok('CT-1 in: filled count through nbhCase.apply',r&&r.filled>=5,r);
  await p.evaluate(c=>window.__nbhFactsIn(c),OTHER);
  const cv2=await p.evaluate(()=>({consent:S.meta.consent,home:S.meta.homeR,steps:S.steps.length,d0:S.steps[0].d}));
  ok('CT-1 in: a second case overwrites nothing',/^9\/2\/2026/.test(cv2.consent)&&!/Bubbles/.test(cv2.home)&&cv2.steps===3&&/five-minute/.test(cv2.d0),cv2);
  await p.reload();await sleep(900);
  await p.evaluate(()=>{const el=document.querySelector('#stepTbl [data-s="0"][data-f="d"]')||document.querySelector('#stepTbl textarea,#stepTbl input[type=text],#stepTbl input:not([type])');el.value='My own first step';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.evaluate(c=>window.__nbhFactsIn(c),CASE);
  const cv3=await p.evaluate(()=>S.steps.map(s=>s.d));
  ok('CT-1 in: a started step list is left alone',cv3[0]==='My own first step'&&!cv3.some(d=>/five-minute/.test(d)),cv3);
  await p.close();

  /* 5. IC-1 in */
  p=await open(IC);
  r=await p.evaluate(c=>window.nbhCase.apply(c),CASE);
  const iv=await p.evaluate(()=>document.querySelector('[name="c.behav"]').value);
  ok('IC-1 in: behaviors of concern with definitions, one to a line',iv.split('\n').length===3&&/^Elopement: Leaving the assigned area/.test(iv)&&/Physical aggression: Hitting/.test(iv)&&r&&r.filled>=1,{iv,r});
  await p.evaluate(()=>{document.querySelector('[name="c.behav"]').value='Typed by the parent meeting';});
  await p.evaluate(c=>window.__nbhFactsIn(c),OTHER);
  ok('IC-1 in: typed words are not overwritten',(await p.evaluate(()=>document.querySelector('[name="c.behav"]').value))==='Typed by the parent meeting');
  await p.evaluate(()=>{const e=document.getElementById('cDate');e.value='2026-09-02';});
  ok('IC-1 out: consent still sent',(await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.consent&&o.consent.date;}))==='2026-09-02');
  await p.close();

  ok('no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);console.log('RESULT: 1 failure(s)');process.exit(1);});
