/* v22.7x Form DM-1, review Wave 3: the home language, the interpreter need and the rights-holder reach Form IC-1, which says
   when its consent does not match the family's language (F1); the medication start and last-change dates reach Forms MS-1 and
   RR-1 (F3); the status answers carry the date they were confirmed, follow the forms that hold the facts, and the workstation
   says "as of" when it repeats them (F4); Packet Contents follows the workstation's form list and ticks the forms the case holds
   work on (F5). Simulated data only.
   usage: node qa/dm1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const DM='DM-1_Student-Demographics-and-Profile_v2026-09.html',IC='IC-1_Informed-Consent-FBA-BIP_v2026-09.html',MS='MS-1_Medication-Side-Effect-Monitoring_v2026-09.html',RR='RR-1_Records-Review_v2026-09.html';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const TODAY=iso(new Date()),OLD=iso(new Date(Date.now()-120*864e5));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const sim=async(p,k)=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(600);};
  const v=(p,n)=>p.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;},n);

  let p=await open(DM);
  /* F3, F1 out */
  await sim(p,'elem');
  const o1=await p.evaluate(()=>window.__nbhFactsOut().profile);
  ok('1 F3 each medication carries its start and last-change dates to the case',o1.health.meds[0].name==='Risperidone'&&/^\d{4}-\d\d-\d\d$/.test(o1.health.meds[0].start)&&/^\d{4}-\d\d-\d\d$/.test(o1.health.meds[0].change)&&
    /^\d{4}-\d\d-\d\d$/.test(o1.health.meds[1].start)&&!('change' in o1.health.meds[1]),o1.health.meds);
  ok('2 F1 who holds educational rights goes to the case, with the signer in Form IC-1\'s words',o1.rights&&o1.rights.holder==='Both parents (shared)'&&o1.rights.name==='Sample Parent A'&&o1.rights.rel==='Mother'&&o1.rights.signer==='Parent',o1.rights);
  await sim(p,'adult');
  const o2=await p.evaluate(()=>window.__nbhFactsOut().profile.rights);
  ok('3 F1 an adult student\'s guardian advocate signs as the guardian advocate',o2&&o2.holder==='Guardian advocate (F.S. 393.12)'&&o2.signer==='Guardian advocate (adult student)'&&/^\d{4}-\d\d-\d\d$/.test(o2.notice),o2);
  /* F4 the case updates the intake's answers */
  await sim(p,'new');
  const before=await p.evaluate(()=>({c:document.querySelector('[name="p.crisis"]').value,b:document.querySelector('[name="p.bipstat"]').value,r:document.querySelector('[name="rl[1].on"]').value,o:(window.__nbhFactsOut().profile.flags||{}).asOf}));
  const CASE={crisis:{stages:[{n:1},{n:2},{n:3}]},plan:{beh:'Hitting (simulated)',adoption:{date:'2026-10-01',version:1}},consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-09-20',date:'2026-09-20',v:2}};
  const r4=await p.evaluate(C=>{const r=nbhCase.apply(C);const g=n=>document.querySelector('[name="'+n+'"]').value;
    return {r,c:g('p.crisis'),b:g('p.bipstat'),bd:g('p.bipdate'),conf:g('p.statconf'),rl:g('rl[1].on'),rd:g('rl[1].d'),log:g('d.log'),note:document.getElementById('dmStatCase').textContent,flags:window.__nbhFactsOut().profile.flags};},CASE);
  ok('4 F4 the intake\'s No, No BIP and Pending follow the case: the crisis plan current (CR-1), the BIP current with its adoption date (TD-1), consent on file (IC-1), dated today',
    before.c==='No'&&before.b==='No BIP'&&before.r==='Pending'&&r4.c==='Yes, current'&&r4.b==='BIP current'&&r4.bd==='2026-10-01'&&r4.rl==='Yes'&&r4.rd==='2026-09-20'&&r4.conf===TODAY&&r4.r.filled>=3,{before,r4});
  ok('5 F4 the change log says what was read from the case, and the Team sheet shows what the case holds',/read from the case: crisis plan: Yes, current \(Form CR-1 holds a plan of 3 stages\); BIP status: current, adopted 10\/1\/2026 \(Form TD-1\); Form IC-1 consent: on file 9\/20\/2026\.$/.test(r4.log)&&
    /^From the case: Form CR-1 holds a crisis plan \(3 stages\) · Form TD-1’s plan was adopted 10\/1\/2026 · Form IC-1 records consent 9\/20\/2026\.$/.test(r4.note),r4);
  ok('6 F4 the case gets the date each answer was confirmed',r4.flags&&r4.flags.asOf&&r4.flags.asOf.crisis===TODAY&&r4.flags.asOf.bip===TODAY&&r4.flags.bip==='BIP current',r4.flags);
  /* an answer typed on purpose is not overwritten */
  await p.evaluate(()=>{const e=document.querySelector('[name="p.crisis"]');e.value='Yes, outdated';e.dispatchEvent(new Event('change',{bubbles:true}));});
  const kept=await p.evaluate(C=>{nbhCase.apply(C);return document.querySelector('[name="p.crisis"]').value;},CASE);
  ok('7 F4 an answer that is not empty, No or Pending stays as typed',kept==='Yes, outdated',kept);
  /* a person's change dates the answer */
  await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="student"]').click();const e=document.querySelector('[name="s.photoconf"]');e.value='';});
  await p.focus('#sPhoto');await p.keyboard.press('ArrowDown');await sleep(150);
  const ph=await p.evaluate(()=>({v:document.getElementById('sPhoto').value,c:document.querySelector('[name="s.photoconf"]').value}));
  ok('8 F4 changing the photo permission by hand dates it that day',ph.v!==''&&ph.c===TODAY,ph);
  await p.close();

  /* F1 IC-1 */
  p=await open(IC);
  const P={profile:{language:{home:'Spanish',interpreter:true,notes:'Interpreter: spoken; ELL: active'},rights:{holder:'Parent (one)',name:'Ana Rivera (simulated)',rel:'Mother',signer:'Parent'},home:{name:'Ana Rivera (simulated)',lang:'Spanish'}}};
  const ic=await p.evaluate(P=>{const r=nbhCase.apply(P);const g=n=>document.querySelector('[name="'+n+'"]').value,w=document.getElementById('icLangWarn');
    return {r,lang:g('c.lang'),rel:g('s.par.rel'),name:g('s.par.name'),parent:g('c.parent'),warn:w.hidden?'':w.textContent,warn2:!document.getElementById('icLangWarn2').hidden};},P);
  ok('9 F1 IC-1 takes the home language with the interpreter need, the signer\'s relationship and name from Form DM-1',ic.lang==='Spanish; interpreter: spoken'&&ic.rel==='Parent'&&ic.name==='Ana Rivera (simulated)'&&ic.parent==='Ana Rivera (simulated)',ic);
  ok('10 F1 with no interpreter recorded, IC-1 says the family needs one in Spanish, beside the language and beside the signatures',
    /^LanguageForm DM-1 says the family needs an interpreter \(Spanish\), and no interpreter in Spanish is recorded under the signatures\. Give the consent in the parent’s native language/.test(ic.warn)&&ic.warn2,ic.warn);
  const ic2=await p.evaluate(()=>{const s=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('s.int.name','Interpreter (simulated)');s('s.int.lang','Spanish');const a=document.getElementById('icLangWarn').hidden;
    s('c.lang','English');const w=document.getElementById('icLangWarn');return {a,b:w.hidden?'':w.textContent};});
  ok('11 F1 an interpreter in Spanish recorded: no warning; a home language that is not the family\'s: it says so',ic2.a===true&&/^LanguageThe home language on this form \(English\) is not the family’s on Form DM-1 \(Spanish\)/.test(ic2.b),ic2);
  await p.close();

  /* F3 MS-1 and RR-1 */
  const MEDS={profile:{health:{meds:[{name:'Risperidone',dose:'0.5 mg',times:'Once daily (AM), 8:00',reason:'Irritability',start:'2025-01-15',change:'2026-09-14'}]}}};
  p=await open(MS);
  const ms=await p.evaluate(F=>{nbhCase.apply(F);const c=[...document.querySelectorAll('#medWrap .card')].map(c=>+c.dataset.med).find(i=>/Risperidone/i.test((document.querySelector('[name="md['+i+'].lib"]')||{}).selectedOptions?.[0]?.textContent||'')||/Risperidone/i.test((document.querySelector('[name="md['+i+'].name"]')||{}).value||''));
    const g=n=>(document.querySelector('[name="'+n+'"]')||{}).value;return {i:c,start:g('md['+c+'].start'),change:g('md['+c+'].change'),due:document.getElementById('screenDue').textContent};},MEDS);
  ok('12 F3 MS-1\'s medication card gets the start and last-change dates, and its schedule now has a start date to work from',ms.start==='1/15/2025'&&ms.change==='9/14/2026 (Form DM-1)'&&!/No antipsychotic with a start date/.test(ms.due),ms);
  await p.close();
  p=await open(RR);
  const rr=await p.evaluate(F=>{nbhCase.apply(F);const g=n=>(document.querySelector('[name="'+n+'"]')||{}).value;return {n:g('md[0].n'),start:g('md[0].start'),chg:g('md[0].chg')};},MEDS);
  ok('13 F3 RR-1\'s medication row gets the start and last-change dates',rr.n==='Risperidone'&&rr.start==='2025-01-15'&&rr.chg==='9/14/2026 (Form DM-1)',rr);
  await p.close();

  /* F4 in the workstation: "as of" and the re-check */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await sh.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  const h=await sh.evaluate(([OLD,TODAY])=>{state.facts={profile:{src:'DM-1',flags:{safety:[],photo:'No',crisis:'No',bip:'No BIP',asOf:{photo:OLD,crisis:OLD,bip:OLD}}}};
    const a=handoverItems().map(x=>x.t);state.facts={profile:{src:'DM-1',flags:{safety:[],photo:'No',crisis:'No',asOf:{photo:TODAY,crisis:TODAY}}},crisis:{stages:[{},{}]}};
    const b=handoverItems().map(x=>x.t);return {a,b};},[OLD,TODAY]);
  const md=OLD.replace(/^(\d{4})-(\d\d)-(\d\d)$/,(m,y,mo,d)=>(+mo)+'/'+(+d)+'/'+y);
  ok('14 F4 the hand-over check repeats DM-1\'s answer "as of" its date and, past 90 days, asks for it to be confirmed on DM-1',
    h.a.includes('Form DM-1 records the crisis plan as missing (as of '+md+', 120 days ago)')&&h.a.some(t=>t==='Confirm on Form DM-1: the crisis plan (as of '+md+', 120 days ago); the photo permission (as of '+md+', 120 days ago); the BIP status (as of '+md+', 120 days ago)'),h.a);
  ok('15 F4 confirmed today: no re-check; with CR-1 holding a plan, DM-1\'s old No is named as out of date',!h.b.some(t=>/^Confirm on Form DM-1/.test(t))&&h.b.some(t=>/Form DM-1 still records no crisis plan, but Form CR-1 holds one/.test(t)),h.b);

  /* F5 Packet Contents from the workstation's list */
  await sh.evaluate(()=>openForm('TB-1'));await sh.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:30000});await sleep(1200);
  const tb=sh.frames().find(f=>/TB-1_Target/.test(f.url()));await tb.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});await L.loadSim(tb);await sleep(1500);
  await sh.evaluate(()=>openForm('DM-1'));await sh.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:30000});await sleep(1500);
  const dm=sh.frames().find(f=>/DM-1_Student/.test(f.url()));
  await dm.evaluate(()=>document.querySelector('#viewSeg [data-view="packet"]').click());await sleep(1200);
  const pk=await dm.evaluate(()=>({rows:[...document.querySelectorAll('#pkTbl tbody tr')].map(r=>r.cells[1].querySelector('b').textContent),tb:(()=>{const r=[...document.querySelectorAll('#pkTbl tbody tr')].find(r=>/^TB-1/.test(r.cells[1].textContent));return {t:r.cells[1].textContent,in:r.querySelector('input[type=checkbox]').checked,key:r.querySelector('input[type=checkbox]').name};})(),
    ro:document.getElementById('pkReadout').textContent}));
  const want=L.forms().map(f=>f.id).filter(id=>id!=='GC-1'&&id!=='RS-1');
  ok('16 F5 in the workstation the rows follow its own form list (GC-1 and RS-1 kept out), keeping their saved keys',JSON.stringify(pk.rows)===JSON.stringify(want)&&pk.tb.key==='pk[3].in',{n:pk.rows.length,tb:pk.tb});
  ok('17 F5 a form the case holds work on is ticked In file and marked "in this case"; the readout counts them',pk.tb.in===true&&/in this case/.test(pk.tb.t)&&/The workstation holds work on \d+ forms? in this case/.test(pk.ro),pk);
  await sh.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('99 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
