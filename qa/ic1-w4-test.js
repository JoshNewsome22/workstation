/* Form IC-1, the consent record (v23.45; review F12, F14, F15, F16, F17, F18): the prior written notice before consent; the
   parent's language (an interpreter or a translated form); Method and Status as two fields (a revoked district consent keeps
   its district form; a record saved before opens with its outcome moved to Status); the parent's contact, the ESE contact and
   the next IEP or reevaluation date from Form DM-1; the targets' names only; the student's assent from Form SI-1.
   Simulated people only. usage: node qa/ic1-w4-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const U=L.BASE+'/NBH-Workstation/IC-1_Informed-Consent-FBA-BIP_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(U);await sleep(900);await p.evaluate(()=>{nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};window.alert=()=>{};});return p;};
  const ic=await open();
  const sim=async k=>{await ic.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(400);};
  const st=p=>p.evaluate(()=>{const s=window.__ic1.status();return {state:s.state,issues:s.issues,m:s.m,stv:s.stv,date:s.date,box:document.getElementById('statusBox').textContent.replace(/\s+/g,' '),verdict:document.getElementById('recVerdict').textContent.replace(/\s+/g,' '),
    log:[...document.querySelectorAll('#logTbl tbody select')].map(x=>x.value).filter(Boolean),dist:!document.getElementById('districtBlock').hidden,sdf:!document.getElementById('cStatusDateF').hidden};});
  const set=(p,o)=>p.evaluate(o=>{Object.keys(o).forEach(k=>{const e=document.querySelector('[name="'+k+'"]');if(!e)return;if(e.type==='checkbox')e.checked=!!o[k];else e.value=o[k];e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));});},o);
  /* the simulations */
  const V={};for(const k of ['signed','reeval','except','noresp','revoke']){await sim(k);V[k]=await st(ic);}
  ok('1 the simulations: signed, reevaluation and with exceptions are complete and log the prior written notice; no response is pending; revoked is revoked, its method kept',
    ['signed','reeval','except'].every(k=>/File is complete/.test(V[k].verdict)&&V[k].log.includes('Prior written notice given'))&&V.noresp.state==='Pending'&&V.noresp.stv==='noresp'&&V.revoke.state==='Revoked'&&V.revoke.m==='sign'&&V.revoke.stv==='revoke'.replace('revoke','revoked'),V);
  /* F12 the prior written notice */
  await sim('signed');await set(ic,{'c.pwn':''});let a=await st(ic);
  ok('2 consent with no prior written notice on record is not complete: it asks for the notice\'s date (34 CFR 300.503)',!/File is complete/.test(a.verdict)&&a.issues.some(t=>/prior written notice was given \(34 CFR §300\.503\): consent is taken after it/.test(t)),a.issues);
  const cd=await ic.evaluate(()=>document.querySelector('[name="c.date"]').value);
  const later=await ic.evaluate(d=>{const t=new Date(d+'T12:00');t.setDate(t.getDate()+2);return t.toISOString().slice(0,10);},cd);
  await set(ic,{'c.pwn':later});a=await st(ic);
  ok('3 a notice dated after the consent: said',a.issues.some(t=>/The prior written notice is dated after the consent/.test(t)),a.issues);
  /* F15 the parent's language */
  await sim('signed');await set(ic,{'c.lang':'Spanish'});a=await st(ic);
  ok('4 home language Spanish, no interpreter or translated form: not complete, and it says what to record (34 CFR 300.9(a))',!/File is complete/.test(a.verdict)&&a.issues.some(t=>/^The home language is Spanish: record the interpreter \(name and language, under the signatures\) or the language of the translated form used/.test(t)),a.issues);
  await set(ic,{'s.int.name':'Interpreter (simulated)','s.int.lang':'Spanish'});a=await st(ic);
  const i1=a.issues.length;await set(ic,{'s.int.name':'','s.int.lang':'','c.transllang':'Spanish'});const b=await st(ic);
  ok('5 the interpreter recorded, or the translated form\'s language: complete again',/File is complete/.test(a.verdict)&&/File is complete/.test(b.verdict),{a:a.issues,b:b.issues});
  await sim('signed');await ic.evaluate(()=>window.__nbhFactsIn({profile:{language:{home:'English',interpreter:true}}}));a=await st(ic);
  ok('6 Form DM-1 says the family needs an interpreter: asked for, though the home language reads English',a.issues.some(t=>/^Form DM-1 says the family needs an interpreter: record the interpreter/.test(t)),a.issues);
  /* F18 method and status */
  const ib=await open();
  await ib.evaluate(()=>{document.getElementById('simScenario').value='reeval';document.getElementById('simBtn').click();});await sleep(400);
  await set(ib,{'c.status':'revoked'});let r=await st(ib);
  ok('7 a district consent revoked: Revoked, asks for the date, and the district form stays on record',r.state==='Revoked'&&r.dist&&r.sdf&&r.issues.some(t=>/date the revocation was received/.test(t))&&r.m==='reeval',r);
  await set(ib,{'c.statusdate':await ib.evaluate(()=>{const t=new Date();t.setDate(t.getDate()-1);return t.toISOString().slice(0,10);})});r=await st(ib);
  const f1=await ib.evaluate(()=>window.__nbhFactsOut().consent);
  ok('8 its date: the verdict says revoked as of that date; the case gets not on file, ended that day, method reeval, status revoked',/Consent is revoked as of/.test(r.verdict)&&f1.on===false&&f1.state==='Revoked'&&f1.ended===r.date&&f1.method==='reeval'&&f1.status==='revoked'&&f1.date==='',{r,f1});
  /* a record saved before this version: its outcome in Method */
  const ic2=await open();
  const old={form:'IC-1',rev:'2026-10',saved:'2026-10-10T12:00:00Z',counts:{log:6,att:3},fields:{'c.client':'Mateo Rivera','c.method':'revoked','c.date':'2026-10-09','c.decision':'yes','c.lang':'English'}};
  await ic2.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'IC-1.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,900));},JSON.stringify(old));
  const o=await ic2.evaluate(()=>({m:document.querySelector('[name="c.method"]').value,st:document.querySelector('[name="c.status"]').value,sd:document.querySelector('[name="c.statusdate"]').value,d:document.querySelector('[name="c.date"]').value,state:window.__ic1.status().state,ended:window.__nbhFactsOut().consent.ended}));
  ok('9 a record saved before this version (Method "Consent revoked") opens with Status revoked, its date under Status, and reads the same',o.m===''&&o.st==='revoked'&&o.sd==='2026-10-09'&&o.d===''&&o.state==='Revoked'&&o.ended==='2026-10-09',o);
  /* F14, F16, F17 from the case */
  const ic3=await open();
  const td=await ic3.evaluate(()=>{const f=n=>{const t=new Date();t.setDate(t.getDate()+n);return t.toISOString().slice(0,10);};return {soon:f(40),later:f(120),past:f(-20)};});
  const res=await ic3.evaluate(td=>window.__nbhFactsIn({behaviors:[{label:'Hitting (simulated)',def:'Striking a peer with an open or closed hand (simulated).'},{label:'Break request (simulated)',isRep:true}],
    profile:{home:{name:'Ana Rivera (simulated)',rel:'Mother',phone:'555-0100',email:'ana.rivera@example.org'},team:[{name:'Dana Whitfield (simulated)',role:'Teacher'},{name:'Paula Brennan (simulated)',role:'ESE contact'}],dates:{iep:td.later,reeval:td.soon,iepHeld:td.past}},
    student:{assent:'given',assentPlan:{assent:'Says okay and takes the schedule card (simulated)',withdrawal:'Says stop; Pushes the materials away; Hums loudly (simulated)',steps:'Pause, offer a choice, end the session if still no'}}}),td);
  const g=await ic3.evaluate(()=>{const v=n=>{const e=document.querySelector('[name="'+n+'"]');return e.type==='checkbox'?e.checked:e.value;};return {parent:v('c.parent'),phone:v('c.phone'),ese:v('c.ese'),due:v('c.iepdue'),behav:v('c.behav'),resp:v('a.resp'),how:v('a.how'),say:v('d.say'),push:v('d.push'),move:v('d.move'),other:v('d.other'),othertxt:v('d.othertxt'),plan:v('d.plan')};});
  ok('10 from Form DM-1: the parent, the phone and email, the ESE contact, and the next IEP or reevaluation date (the sooner one still ahead)',g.parent==='Ana Rivera (simulated)'&&g.phone==='555-0100 / ana.rivera@example.org'&&g.ese==='Paula Brennan (simulated) (ESE contact)'&&g.due===td.soon,{g,td});
  ok('11 behaviors of concern: the targets\' names only, not their definitions, and no replacement behavior',g.behav==='Hitting (simulated)',g.behav);
  ok('12 from Form SI-1: the student\'s response, how the student shows it, the dissent signs in their boxes (the rest under Other), what staff do',g.resp==='yes'&&g.how==='Says okay and takes the schedule card (simulated)'&&g.say===true&&g.push===true&&g.move===false&&g.other===true&&g.othertxt==='Hums loudly (simulated)'&&g.plan==='Pause, offer a choice, end the session if still no'&&/Form SI-1/.test(res.note||''),{g,res});
  await set(ic3,{'c.parent':'Typed by hand (simulated)'});await ic3.evaluate(td=>window.__nbhFactsIn({profile:{home:{name:'Someone else (simulated)'}}}),td);
  ok('13 typed words stay',(await ic3.evaluate(()=>document.querySelector('[name="c.parent"]').value))==='Typed by hand (simulated)');
  ok('14 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
