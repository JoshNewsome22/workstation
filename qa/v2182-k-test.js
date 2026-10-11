/* v21.82 helper K: the background and the student's voice (simulated students only: Mateo Rivera and the forms' own
   "SIMULATED – Sample Student"):
   1. Form DM-1 gives profile.language {home, interpreter, notes} and profile.culture, keeps its profile, health and dates,
      and sends no language while the fields are empty;
   2. Form SI-1 gives student {date, hypothesis, assent, preference, likes} once its simulation is loaded (the assent read
      from the log when the overall field is blank, the field when chosen), and nothing while it is empty;
   3. Form IN-1 gives evidence.parent {concerns, goals} from the parent interview, keeps its v21.78 evidence, and gives the
      family's part with the result empty when the interviews have no hypothesis yet;
   4. Form FS-1 fills "Background and the Student" and the assent status from a simulated facts object only where empty,
      never overwriting; the student interview becomes an evidence row (SI-1, indirect, function and strength left blank)
      and an interview record with no result is not made a row; a second pass adds nothing; the section is in the report,
      in the text for the BIP and in the printed page;
   5. no page errors.
   usage: WS_URL=http://127.0.0.1:8133 node qa/v2182-k-test.js */
const {chromium,BASE,loadSim,sleep}=require(__dirname+'/lib.js');
const U=f=>BASE+'/NBH-Workstation/'+f;
const DM=U('DM-1_Student-Demographics-and-Profile_v2026-09.html'),SI=U('SI-1_Student-Interview-and-Assent_v2026-10.html'),
  IN=U('IN-1_Stakeholder-Interview-Record_v2026-09.html'),FS=U('FS-1_FBA-Summary-Report_v2026-09.html');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const errs=[];const ISO=/^\d{4}-\d{2}-\d{2}$/;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1180,height:900}});
  const open=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url.split('/').pop()+': '+String(e.message||e).slice(0,300)));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.addInitScript(()=>{window.print=function(){};});
    await p.goto(url);await sleep(700);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.alert=async()=>{};}}catch(e){}});return p;};
  const out=p=>p.evaluate(()=>window.__nbhFactsOut?window.__nbhFactsOut():null);
  /* 1. DM-1 */
  {const p=await open(DM);
    const e=await out(p);ok('DM-1: no language or culture while empty',!(e&&e.profile&&(e.profile.language||e.profile.culture)),e);
    await p.evaluate(()=>{const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
      set('s.first','Mateo');set('s.last','Rivera');set('s.lang','Spanish');set('s.interp','Yes: spoken');set('s.ell','ELL: active');
      set('pf.culture','Family observes Ramadan; no pork at school (simulated)');set('pf.strengths','Draws comics; remembers routines (simulated)');});
    const o=await out(p),P=o&&o.profile||{};
    ok('DM-1: profile.language {home, interpreter, notes}',P.language&&P.language.home==='Spanish'&&P.language.interpreter===true&&/spoken/.test(P.language.notes)&&/ELL: active/.test(P.language.notes),P.language);
    ok('DM-1: profile.culture',P.culture==='Family observes Ramadan; no pork at school (simulated)',P.culture);
    ok('DM-1: the profile is kept (strengths, src)',/Draws comics/.test(P.strengths||'')&&P.src==='DM-1',P);
    await p.evaluate(()=>{const el=document.querySelector('[name="s.interp"]');el.value='No';el.dispatchEvent(new Event('change',{bubbles:true}));});
    const o2=await out(p);ok('DM-1: interpreter false when answered No',o2.profile.language.interpreter===false&&o2.profile.language.notes==='ELL: active',o2.profile.language);
    await p.close();}
  /* 2. SI-1 */
  let STU=null;
  {const p=await open(SI);
    const e=await out(p);ok('SI-1: nothing while empty',!(e&&e.student),e);
    const s=await loadSim(p);await sleep(1200);
    const o=await out(p);const st=o&&o.student;STU=st;
    ok('SI-1: simulation loaded ('+s+') and student given',!!st,o);
    if(st){ok('SI-1: date as ISO',ISO.test(st.date||''),st.date);
      ok('SI-1: hypothesis is the student\'s report, plain text',/^Student’s report \(SI-1/.test(st.hypothesis)&&!/[<>]|&\w+;/.test(st.hypothesis)&&/walk out/.test(st.hypothesis),st.hypothesis);
      ok('SI-1: assent read from the log (some withdrawals: partial)',st.assent==='partial',st.assent);
      ok('SI-1: preference is what the student would like from a plan',/Smaller worksheets/.test(st.preference||''),st.preference);
      ok('SI-1: likes',/Drawing/.test(st.likes||''),st.likes);}
    await p.evaluate(()=>{const el=document.querySelector('[data-m="a_status"]');el.value='given';el.dispatchEvent(new Event('change',{bubbles:true}));});
    const o2=await out(p);ok('SI-1: the overall assent field, when chosen, is sent',o2.student.assent==='given',o2.student);
    const sum=await p.evaluate(()=>document.getElementById('sumOut').textContent);
    ok('SI-1: the summary shows the overall assent and what the student would like',/Assent overall: given/.test(sum)&&/Would like from a plan/.test(sum),sum.slice(0,300));
    await p.evaluate(()=>{S.meta.p_want='';S.meta.a_status='';renderAll();});
    const o3=await out(p);ok('SI-1: without the field, the preference is the component chosen most',/^Chose the break card most/.test(o3.student.preference||''),o3.student.preference);
    await p.close();}
  /* 3. IN-1 */
  let PAR=null;
  {const p=await open(IN);
    const e=await out(p);ok('IN-1: nothing while empty',!(e&&e.evidence),e);
    const s=await loadSim(p);await sleep(1200);
    const o=await out(p),ev=o&&o.evidence||{};PAR=ev.parent;
    ok('IN-1: simulation loaded ('+s+'); the v21.78 evidence is kept',ev.form==='IN-1'&&ev.fnKey==='multiple'&&ev.n===5&&/informant report/.test(ev.statement||''),ev);
    ok('IN-1: evidence.parent {concerns, goals} from the parent interview',ev.parent&&/Two or three times a week/.test(ev.parent.concerns)&&/open hand/.test(ev.parent.concerns)&&/Short term/.test(ev.parent.goals),ev.parent);
    await p.evaluate(()=>{S.meta.hyp='';S.meta.fn='';});
    const o2=await out(p),e2=o2&&o2.evidence;
    ok('IN-1: no hypothesis yet: the family\'s part with the result empty',e2&&e2.parent&&e2.form==='IN-1'&&e2.statement===''&&e2.fnKey===''&&e2.fn==='',e2);
    await p.close();}
  /* 4. FS-1 */
  const F={student:STU||{date:'2026-09-20',hypothesis:'Student’s report (SI-1, 9/20/26): before math, a long worksheet.',assent:'partial',preference:'Smaller worksheets',likes:'Drawing'},
    records:{removals:{days:4.5,list:[{date:'2026-09-03',days:1,kind:'OSS'},{date:'2026-09-17',days:3.5,kind:'OSS'}],at10:false,year:'2026-27'},iep:'2027-03-01',reeval:'2028-01-15',prior:['Check-in/check-out (simulated)']},
    profile:{strengths:'Draws comics (Mateo Rivera, simulated)',interests:'Basketball, comics',expr:'Full sentences',recep:'Two-step directions',
      health:{meds:[{name:'Methylphenidate (simulated)',dose:'10 mg',times:'8:00',reason:'attention'}],conditions:'ADHD (simulated)',allergies:'Peanuts'},
      language:{home:'Spanish',interpreter:true,notes:'Interpreter needed for family (spoken)'},culture:'No pork at school (simulated)'},
    evidence:{'IN-1':{form:'IN-1',method:'Stakeholder interviews (indirect)',fn:'',fnKey:'',strength:'',statement:'',dates:'',n:null,parent:PAR||{concerns:'Hitting at home',goals:'Be told no calmly'}},
      'OB-1':{form:'OB-1',method:'Direct observation',dates:'9/1/2026–9/10/2026',from:'2026-09-01',to:'2026-09-10',n:3,fn:'Escape',fnKey:'escape',strength:'Moderate',statement:'Escape from demands (simulated observation).'}}};
  {const p=await open(FS);
    const r1=await p.evaluate(f=>window.__nbhFactsIn(f),F);await sleep(300);
    const st=await p.evaluate(()=>({meta:Object.assign({},S.meta),src:S.src.map(r=>Object.assign({},r)),vals:[...document.querySelectorAll('#bgTbl textarea')].map(t=>t.value),rep:document.getElementById('reportOut').innerText,txt:window.__bipText()}));
    const m=st.meta;
    ok('FS-1: records from RR-1',/Removals this school year \(2026-27\): 4\.5 days over 2 removals/.test(m.bgRecords||'')&&/Check-in\/check-out/.test(m.bgRecords)&&/Annual IEP 3\/1\/2027/.test(m.bgRecords)&&/reevaluation due 1\/15\/2028/.test(m.bgRecords),m.bgRecords);
    ok('FS-1: strengths, interests and communication from DM-1',/Strengths: Draws comics/.test(m.bgProfile||'')&&/Interests: Basketball/.test(m.bgProfile)&&/expressive, Full sentences; receptive, Two-step/.test(m.bgProfile),m.bgProfile);
    ok('FS-1: health and medications considered',/Health conditions: ADHD/.test(m.bgHealth||'')&&/Methylphenidate \(simulated\) 10 mg \(8:00\) for attention/.test(m.bgHealth)&&/Allergies: Peanuts/.test(m.bgHealth)&&/setting events/.test(m.bgHealth),m.bgHealth);
    ok('FS-1: language and culture',/Home language: Spanish; the family needs an interpreter/.test(m.bgCulture||'')&&/Cultural considerations: No pork/.test(m.bgCulture),m.bgCulture);
    ok('FS-1: the student\'s view from SI-1',m.bgStudent&&m.bgStudent.indexOf(F.student.hypothesis.slice(0,30))>=0&&/Would like from a plan/.test(m.bgStudent)&&/Assent: partial/.test(m.bgStudent),m.bgStudent);
    ok('FS-1: the family\'s concerns and goals from IN-1',/^Concerns: /.test(m.bgFamily||'')&&/Goals: /.test(m.bgFamily),m.bgFamily);
    ok('FS-1: assent status from SI-1',/^Partial assent/.test(m.assent||'')&&/Form SI-1/.test(m.assent),m.assent);
    ok('FS-1: the boxes show the values',st.vals.length===6&&st.vals.every(Boolean),st.vals);
    const si=st.src.find(r=>r.form==='SI-1');
    ok('FS-1: the student interview is an evidence row (indirect; function and strength left blank)',si&&/^Indirect: structured/.test(si.method)&&si.fn===''&&si.str===''&&si.contrib.indexOf('Student’s report')>=0,si);
    ok('FS-1: the OB-1 row still placed (v21.78 fill)',st.src.some(r=>r.form==='OB-1'&&/^Escape/.test(r.fn)),st.src.map(r=>r.form));
    ok('FS-1: an interview record with no result is not made a row',!st.src.some(r=>r.form==='IN-1'),st.src.map(r=>r.form));
    ok('FS-1: the report has "Background and the student"',/Background and the student/.test(st.rep)&&/Records\. Removals/.test(st.rep)&&/The student’s view\./.test(st.rep),st.rep.slice(0,600));
    ok('FS-1: the text for the BIP has the section',/BACKGROUND AND THE STUDENT\n/.test(st.txt)&&/Records \(Form RR-1\): Removals/.test(st.txt)&&/The family’s concerns and goals \(Form IN-1\): Concerns/.test(st.txt),st.txt.slice(0,900));
    ok('FS-1: the answer counts what was placed',r1&&r1.filled>=9,r1);
    const r2=await p.evaluate(f=>window.__nbhFactsIn(f),F);const n2=await p.evaluate(()=>S.src.filter(r=>r.form).length);
    ok('FS-1: a second pass adds nothing',(!r2||!r2.filled)&&n2===st.src.filter(r=>r.form).length,[r2,n2]);
    /* printed */
    await p.emulateMedia({media:'print'});
    const pr=await p.evaluate(()=>{const t=document.getElementById('bgTbl'),r=document.getElementById('reportOut');const vis=e=>!!e&&e.offsetParent!==null&&getComputedStyle(e).display!=='none';
      return {tbl:vis(t),rep:vis(r),repBg:/Background and the student/.test(r.innerText)};});
    ok('FS-1: printed: the section and the report\'s background are on the page',pr.tbl&&pr.rep&&pr.repBg,pr);
    await p.emulateMedia({media:'screen'});
    await p.close();}
  /* never overwriting what is typed */
  {const p=await open(FS);
    const typed={bgRecords:'Typed records note',bgProfile:'',bgHealth:'Typed: no health factors judged relevant',bgCulture:'',bgStudent:'Typed student view',bgFamily:'',assent:'Assent sought each session (typed)'};
    await p.evaluate(t=>{Object.assign(S.meta,t);S.src[0]=Object.assign(S.src[0],{form:'',method:'Indirect: structured interview or rating scale',dates:'9/20/2026',who:'',contrib:'Student interview, Form SI-1 (typed)',fn:'',str:''});renderAll();},typed);
    await p.evaluate(f=>window.__nbhFactsIn(f),F);await sleep(200);
    const m=await p.evaluate(()=>({meta:Object.assign({},S.meta),si:S.src.filter(r=>r.form==='SI-1').length,first:Object.assign({},S.src[0])}));
    ok('FS-1: typed boxes and assent kept',['bgRecords','bgHealth','bgStudent','assent'].every(k=>m.meta[k]===typed[k]),m.meta);
    ok('FS-1: empty boxes filled beside them',/Strengths/.test(m.meta.bgProfile||'')&&/Spanish/.test(m.meta.bgCulture||'')&&/Concerns/.test(m.meta.bgFamily||''),m.meta);
    ok('FS-1: a typed row naming SI-1 is kept and SI-1 not added again',m.si===0&&/typed/.test(m.first.contrib),m);
    await p.close();}
  ok('no page errors',errs.length===0,errs);
  await b.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
