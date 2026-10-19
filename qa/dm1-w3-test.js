/* v23.09 Form DM-1, review Wave 3: the home language, the interpreter need and the rights-holder reach Form IC-1, which says
   when its consent does not match the family's language (F1); the medication start and last-change dates reach Forms MS-1 and
   RR-1 (F3); the status answers carry the date they were confirmed, follow the forms that hold the facts, and the workstation
   says "as of" when it repeats them (F4); Packet Contents follows the workstation's form list and ticks the forms the case holds
   work on (F5). The minors and improvements: the rights-holder list has a foster parent and a person acting as parent (F2);
   a contact may be told about the behavior and the plan only with a dated release (F6); the notice at 18 (F7); the bar's BCBA
   (F9); a parent-reported diagnosis keeps no code (F10); the cover reads the case (I1); the rights at 18 on the due list and
   the calendar, with a draft letter (I2); the family facts on the bar (I3); the medication change history, on DD-1's graph
   (I4); the disclosure log (I5). Simulated data only.
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

  /* ---------------- the minors and the improvements, on DM-1 alone ---------------- */
  p=await open(DM);
  const snapOf=()=>p.evaluate(()=>{const f={};document.querySelectorAll('[name]').forEach(e=>f[e.name]=e.type==='checkbox'?e.checked:e.value);return {form:'DM-1',rev:'2026-09',counts:{con:document.querySelectorAll('#conWrap .card').length},fields:f};});
  const openData=async d=>{await p.setInputFiles('#fileIn',{name:'dm1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(600);};
  const mdy=s=>String(s).replace(/^(\d{4})-(\d\d)-(\d\d)$/,(m,y,mo,d)=>(+mo)+'/'+(+d)+'/'+y);
  await sim(p,'elem');
  /* F2 */
  const f2=await p.evaluate(()=>{const o=[...document.querySelectorAll('#rHolder option')].map(x=>x.textContent);
    const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},box=()=>document.getElementById('ageBox').textContent;
    s('c[2].rights','Yes: full');s('r.holder','Legal guardian');const a=box();
    s('r.holder','Person acting as parent (child lives with them; 34 CFR 300.30(a)(4))');const b=box();
    s('c[2].rights','No (informational only)');s('r.holder','Both parents (shared)');
    return {o,a,b,sg:[dmSigner('Person acting as parent (child lives with them; 34 CFR 300.30(a)(4))','Grandparent','Yes'),dmSigner('Foster parent (34 CFR 300.30(a)(2))','Foster parent','Yes')]};});
  ok('18 F2 the rights-holder list has a foster parent and a person acting as parent, who sign on Form IC-1 in its words',
    f2.o.includes('Foster parent (34 CFR 300.30(a)(2))')&&f2.o.includes('Person acting as parent (child lives with them; 34 CFR 300.30(a)(4))')&&f2.sg[0]==='Person acting as parent (child lives with them)'&&f2.sg[1]==='Foster parent',f2);
  ok('19 F2 a grandparent who holds rights under a holder that does not fit is asked about; as a person acting as parent, not',
    /Sample Grandparent \(grandparent\) holds educational rights, but the rights-holder is recorded as Legal guardian: say which it is/.test(f2.a)&&!/holds educational rights, but/.test(f2.b),f2);
  /* F6 */
  const f6=await p.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},t=()=>document.getElementById('conTag2').textContent,box=()=>document.getElementById('ageBox').textContent;
    const lab=document.querySelectorAll('#conWrap .card')[2].textContent,a=t(),rdh=()=>document.querySelector('.dm-reldate[data-con="2"]').hidden,h0=rdh();
    s('c[2].perm','Behavior and plan (release on file, date)');const b=t(),bx=box(),h1=rdh();
    s('c[2].reldate','2026-09-01');const c=t(),cx=box();return {lab:/May be told about/.test(lab)&&!/Permission to discuss/.test(lab),a,b,bx,c,cx,h0,h1};});
  ok('20 F6 the contact\'s field says what they may be told; the behavior and the plan only with a dated release (its date box shown then), else "Logistics only"',
    f6.lab&&f6.h0===true&&f6.h1===false&&f6.a==='Logistics only'&&f6.b==='Logistics only'&&/Sample Grandparent may be told about the behavior and the plan only under the rights-holder's signed, dated release \(34 CFR §99\.30\)/.test(f6.bx)&&
    f6.c==='Behavior and plan (release 9/1/2026)'&&!/may be told about the behavior/.test(f6.cx),f6);
  {const d=await snapOf();d.fields['c[2].perm']='Yes';d.fields['c[2].reldate']='';await openData(d);}
  const f6b=await p.evaluate(()=>({v:document.querySelector('[name="c[2].perm"]').value,t:document.getElementById('conTag2').textContent}));
  ok('21 F6 a file saved with the old "Yes" opens as it was and reads "Logistics only"',f6b.v==='Yes'&&f6b.t==='Logistics only',f6b);
  /* F9 */
  const f9=await p.evaluate(()=>{const m=document.querySelector('[data-m="bcba"]'),a=m&&m.name;
    const e=document.querySelector('[name="t[0].name"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));
    window.__nbhApplyPacket({bcba:'Jordan Ellis (simulated)'},true);const b=e.value;
    const r=document.querySelector('[name="t[0].role"]');r.value='Classroom teacher';r.dispatchEvent(new Event('change',{bubbles:true}));
    const pp=document.querySelector('[name="d.prep"]');pp.value='';const c=(document.querySelector('[data-m="bcba"]')||{}).name||'';
    window.__nbhApplyPacket({bcba:'Jordan Ellis (simulated)'},true);return {a,b,c,prep:pp.value};});
  ok('22 F9 the bar\'s case BCBA lands in the team table\'s BCBA row while its name is empty, else in Prepared by; that row\'s name is what goes back',
    f9.a==='t[0].name'&&f9.b==='Jordan Ellis (simulated)'&&f9.c===''&&f9.prep==='Jordan Ellis (simulated)',f9);
  /* F10 */
  const f10=await p.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},g=n=>document.querySelector('[name="'+n+'"]').value;
    s('dx[4].name','ADHD, combined presentation');const a=g('dx[4].code');s('dx[4].src','parent report');const b=g('dx[4].code');
    s('dx[3].name','ADHD, combined presentation');s('dx[3].code','F90.9');s('dx[3].src','Parent report (phone)');const c=g('dx[3].code');
    return {a,b,c,ro:document.getElementById('dxReadout').textContent};});
  ok('23 F10 "parent report" typed after the name takes back the code the form filled; a code typed by hand stays',f10.a==='F90.2'&&f10.b===''&&f10.c==='F90.9'&&!/Diagnosis row 5/.test(f10.ro),f10);
  /* I4 */
  await sim(p,'elem');
  const i4=await p.evaluate(()=>{const C=window.__nbhFactsOut().profile.health.changes,ro=document.getElementById('mcReadout').textContent;
    document.getElementById('mcAdd').click();const n=document.querySelectorAll('#mcTbl tbody tr').length;
    const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('mc[3].date','2026-10-01');s('mc[3].med','Levetiracetam');s('mc[3].kind','Dose increased');
    return {C,ro,n,chg:document.querySelector('[name="m[0].chg"]').value,C2:window.__nbhFactsOut().profile.health.changes};});
  const srt=a=>a.every((x,i)=>!i||a[i-1].date<=x.date);
  ok('24 I4 every medication change goes to the case, oldest first: the history\'s rows, and a start the history does not hold',
    i4.C.length===3&&srt(i4.C)&&i4.C.some(c=>c.med==='Risperidone'&&c.kind==='Started'&&c.detail==='0.25 mg once daily (AM)')&&i4.C.some(c=>c.med==='Risperidone'&&c.kind==='Dose increased'&&c.date===i4.chg)&&
    i4.C.some(c=>c.med==='Levetiracetam'&&c.kind==='Started')&&i4.ro==='2 change(s) recorded.'&&i4.n===4&&i4.C2.length===4&&srt(i4.C2)&&i4.C2.some(c=>c.med==='Levetiracetam'&&c.date==='2026-10-01'),i4);
  /* I5 */
  const i5=await p.evaluate(()=>{const a=document.getElementById('dlReadout').textContent;document.getElementById('dlAdd').click();
    const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('dl[3].date','2026-10-02');s('dl[3].what','MS-1 grid');return {a,b:document.getElementById('dlReadout').textContent,n:document.querySelectorAll('#dlTbl tbody tr').length};});
  ok('25 I5 the packet sheet keeps a disclosure log: each entry with to whom and what authorized it, and says which entry lacks them',
    i5.a==='1 disclosure(s) logged.'&&i5.n===4&&i5.b==='2 disclosure(s) logged; entry 4 has no to whom, what authorized it.',i5);
  await openData(await snapOf());
  const kept4=await p.evaluate(()=>({mc:document.querySelectorAll('#mcTbl tbody tr').length,dl:document.querySelectorAll('#dlTbl tbody tr').length,m:document.querySelector('[name="mc[3].med"]').value,w:document.querySelector('[name="dl[3].what"]').value}));
  ok('26 I4, I5 the added rows are saved and opened with the file',kept4.mc===4&&kept4.dl===4&&kept4.m==='Levetiracetam'&&kept4.w==='MS-1 grid',kept4);
  /* I1 */
  const CASE2={crisis:{stages:[{n:1},{n:2}]},plan:{adoption:{date:'2026-10-01'}},consent:{state:'Current',on:true,obtained:'2026-09-20'},student:{assent:'given',date:'2026-09-25'}};
  const i1=await p.evaluate(C=>{const a=document.getElementById('dmCover').hidden;nbhCase.apply(C);const el=document.getElementById('dmCover');
    return {a,h:el.hidden,cap:el.querySelector('.dm-cap').textContent,rows:[...el.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>c.textContent)),diff:[...el.querySelectorAll('.dm-diff')].length,
      rl:document.querySelector('[name="rl[1].d"]').value};},CASE2);
  ok('27 I1 the cover sheet says what the case holds, read today, beside this form\'s own answers, and marks a difference',
    i1.a===true&&i1.h===false&&i1.cap==='Read from the case on '+mdy(TODAY)&&JSON.stringify(i1.rows)===JSON.stringify([
      ['Behavior plan','Form TD-1: adopted 10/1/2026','BIP in development (this packet) (differs)'],['Crisis plan','Form CR-1: a plan of 2 stages','Yes, current'],
      ['Consent (FBA/BIP)','Form IC-1: consent obtained 9/20/2026','Yes, '+mdy(i1.rl)],['Student assent','Form SI-1: assent given (interview 9/25/2026)','(not asked on this form)']])&&i1.diff===1,i1);
  /* F7 */
  await sim(p,'adult');
  const f7=await p.evaluate(()=>{const box=()=>document.getElementById('ageBox').textContent,a=box(),n18=document.querySelector('[name="r.notice18"]').value;
    const e=document.querySelector('[name="r.notice18"]');e.value='';e.dispatchEvent(new Event('change',{bubbles:true}));
    return {a,n18,b:box(),tl:(window.__nbhFactsOut().profile.rights||{}).timeline,due:window.__nbhDue()};});
  ok('28 F7 at 18 the box says whether the notice of the transfer was given; with none recorded it is due on the workstation and goes to the case',
    f7.a.includes('Notice of the transfer of rights at 18 (34 CFR §300.520(a)(3)): given '+mdy(f7.n18)+'.')&&f7.b.includes('(34 CFR §300.520(a)(3)): not recorded.')&&
    Array.isArray(f7.tl)&&f7.tl.length===1&&f7.tl[0].what==='Rights at 18: notice of transfer (18th birthday)'&&f7.due.some(x=>x.what===f7.tl[0].what&&x.date===f7.tl[0].due),f7);
  /* I2 */
  await sim(p,'new');
  const DOB=(()=>{const d=new Date();d.setDate(1);d.setFullYear(d.getFullYear()-16);d.setMonth(d.getMonth()-9);return iso(d);})(),B17=(+DOB.slice(0,4)+17)+DOB.slice(4);
  const i2=await p.evaluate(D=>{const r18=document.getElementById('r18Row').hidden;const e=document.querySelector('[name="s.dob"]');e.value=D;e.dispatchEvent(new Event('change',{bubbles:true}));
    const d=window.__nbhDue(),tl=window.__nbhFactsOut().profile.rights.timeline,w=document.getElementById('rLetterWrap').hidden;document.getElementById('rLetterBtn').click();
    const o=document.getElementById('rLetterOut');return {r18,r18b:document.getElementById('r18Row').hidden,d,tl,w,lt:o.hidden?'':o.textContent,box:document.getElementById('ageBox').textContent};},DOB);
  ok('29 I2 at 16 and 9 months the at-18 fields show (not at 8), the information and the IEP statement are due by the 17th birthday, on the due list with the next review; the four steps go to the case',
    i2.r18===true&&i2.r18b===false&&i2.d.filter(x=>/^Rights at 18: (information and notice|IEP statement) \(17th birthday\)$/.test(x.what)&&x.date===B17).length===2&&i2.d.some(x=>/^Next review/.test(x.what))&&i2.tl.length===4&&
    /IEP statement that the student has been told of the rights at 18 \(34 CFR §300\.320\(c\)\): not recorded/.test(i2.box),i2);
  ok('30 I2 the letter on the rights at 18 is drafted to the rights-holder, with the family\'s language and interpreter named first',
    i2.w===false&&/^\[For the ESE contact: the family’s language is Spanish; an interpreter is needed \(spoken\)\./.test(i2.lt)&&/\nDear Sample Parent A,\n/.test(i2.lt)&&/ turns 17 on /.test(i2.lt)&&/Florida Rule 6A-6\.03311\(8\)/.test(i2.lt),i2.lt);
  await p.close();
  /* I4 on Form DD-1's graph */
  p=await open('Daily_Behavior_Data_and_Visual_Analysis.html');
  await p.evaluate(async()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;await loadExample();});await sleep(1200);
  const dd=await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));
    const R=sortedRows().filter(r=>r.date),d=R[Math.floor(R.length/2)].date;
    nbhCase.apply({profile:{health:{changes:[{date:'2000-01-03',med:'Levetiracetam',kind:'Started'},{date:d,med:'Risperidone',kind:'Dose increased',detail:'0.25 mg to 0.5 mg'}]}}});
    const g=[...document.querySelectorAll('svg g.dd-med')];return {d,n:g.length,t:[...new Set(g.map(x=>x.querySelector('text').textContent))],tip:g.length?g[0].querySelector('title').textContent:''};});
  ok('31 I4 Form DD-1 marks each medication change from Form DM-1 on its graphs (none before the first day plotted)',dd.n>=1&&JSON.stringify(dd.t)==='["Rx Risperidone up"]'&&/^Form DM-1: Risperidone, dose increased on .+ \(0\.25 mg to 0\.5 mg\)$/.test(dd.tip),dd);
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
  /* I1 in the workstation: the cover sheet reads the case */
  const cov=await dm.evaluate(()=>{const el=document.getElementById('dmCover');return {h:el.hidden,rows:[...el.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>c.textContent))};});
  ok('32 I1 in the workstation the cover sheet lists the forms the case holds work on, beside the In file ticks',
    cov.h===false&&cov.rows.length>=1&&cov.rows[0][0]==='Forms'&&/with work in the case: .*TB-1/.test(cov.rows[0][1])&&/ticked In file/.test(cov.rows[0][2]),cov);
  /* I3, I2 in the shell */
  const sh3=await sh.evaluate(()=>{const F={profile:{src:'DM-1',language:{home:'Spanish',interpreter:true,notes:'Interpreter: spoken; ELL: active'},rights:{holder:'Parent (one)',signer:'Parent',name:'Ana Rivera (simulated)',timeline:[{what:'Rights at 18: notice of transfer (18th birthday)',due:'2027-03-01'}]}}};
    const a=dmFamily(F,true);const c=document.getElementById('pClient');if(c&&!c.value.trim())c.value='Mateo Rivera (simulated)';state.facts=Object.assign({},state.facts||{},F);paintFacts();
    return {a,sum:document.getElementById('sumCase').textContent,txt:document.getElementById('factsTxt').textContent,cal:calEvents(F)};});
  ok('33 I3 the bar and the case summary carry the family facts from Form DM-1: the language with the interpreter need, the rights-holder, the signer',
    JSON.stringify(sh3.a)===JSON.stringify(['Spanish, interpreter needed (spoken)','rights: Parent','signs: Parent (Ana Rivera (simulated))'])&&/family: Spanish, interpreter needed \(spoken\); rights: Parent; signs: Parent$/.test(sh3.sum)&&
    /Family: Spanish, interpreter needed \(spoken\) · rights: Parent · signs: Parent \(Ana Rivera \(simulated\)\)/.test(sh3.txt),sh3);
  ok('34 I2 the calendar carries the steps of the rights at 18 that Form DM-1 has open',sh3.cal.some(e=>e.date==='2027-03-01'&&e.form==='DM-1'&&e.what==='Rights at 18: notice of transfer (18th birthday)'),sh3.cal);
  await sh.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('99 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
