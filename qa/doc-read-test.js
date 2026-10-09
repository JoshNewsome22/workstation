/* v21.67 Read a document (NBH-Workstation/index.html: nbhDocRead, drOpen, drPlace; DM-1's fill; TB-1's intake):
   1. the bar's button opens the dialog with a file picker (on a website) and a paste box;
   2. the matcher reads a school printout: the name split, dates to ISO, grade, sex, IDs, school, teacher, language, ELL,
      interpreter, ethnicity, enrolment, previous school, bus, Medicaid, exceptionalities, IEP dates, placement, matrix,
      diploma, ESY, 504, allergies, physician, strengths, interests, BCBA, rights; parent, phone and letterhead lines taken
      for nothing; the plan's target behaviors with their definitions and a replacement;
   3. the table: a detail unticked is not placed, a corrected one is; Place fills the bar, opens Form DM-1 and fills it
      (choices included), hands the behaviors to the case, to TB-1 as candidates and to GB-1 as objectives, and says so;
   4. what the bar and the form already hold is kept unless Replace is ticked;
   5. a PDF with its own text is read by PDF.js; a picture by the text recognizer; a scanned PDF by both;
   6. no page errors.
   usage: node qa/doc-read-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const OUT=__dirname+'/out/doc-read/';fs.mkdirSync(OUT,{recursive:true});
const TEXT=`Royal Palm School                                Student Information
Student Name: RIVERA, MATEO J        Student ID: 4471823
Date of Birth: 03/14/2016   Sex: M   Grade: 03
FLEID: FL000123456789
School: Royal Palm School   Teacher: Ms. Alvarez (Room 12)
Home Language: Spanish   ELL Status: LY   Interpreter needed: Yes
Race/Ethnicity: Hispanic
Enrollment Date: August 10, 2022
Previous School: Palm Grove Elementary
Transportation: Bus 42
Parent/Guardian: Luis Rivera   Phone: (561) 555-0142
Medicaid #: 1234567890
Primary Exceptionality: Autism Spectrum Disorder
Secondary Exceptionality: Language Impairment
Initial Eligibility Date: 9/2/2019
IEP Date: 01/22/2026    Annual Review Due: 01/21/2027    Reevaluation Due: 09/01/2028
Placement: Separate class (self-contained)   Matrix: 253   Diploma: Standard
ESY: Yes   504 Plan: No
Allergies: peanuts
Physician: Dr. Chen, Palm Pediatrics
Strengths: enjoys music, follows picture schedules
Interests: trains, drawing
BCBA: J. Newsome
Educational rights: Both parents

Behavior Intervention Plan
Target Behavior 1: Aggression \u2013 any instance of hitting, kicking or pushing another person with enough force to be heard or seen from 3 feet away.
Target Behavior 2: Elopement
Definition: leaving the assigned area without permission by more than 10 feet or crossing a doorway.
Replacement Behavior: Requesting a break \u2013 handing the break card to an adult or saying "break please".`;
/* a PDF of its own text (Helvetica, one page) */
function textPdf(lines){
  const enc=s=>s.replace(/\u2013/g,'\x96').replace(/\u2019/g,'\x92').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const content='BT /F1 10 Tf 48 744 Td 14 TL\n'+lines.map(l=>'('+enc(l)+') Tj T*').join('\n')+'\nET';
  const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length '+Buffer.byteLength(content,'latin1')+' >>\nstream\n'+content+'\nendstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  return assemble(objs.map(o=>Buffer.from(o,'latin1')));
}
/* a scanned page: one JPEG on the page */
function jpegPdf(jpg,w,h){
  const ph=540*h/w,content='q 540 0 0 '+ph.toFixed(2)+' 36 '+(756-ph).toFixed(2)+' cm /Im1 Do Q';
  const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>',
    '<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream'].map(o=>Buffer.from(o,'latin1'));
  objs.push(Buffer.concat([Buffer.from('<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpg.length+' >>\nstream\n','latin1'),jpg,Buffer.from('\nendstream','latin1')]));
  return assemble(objs);
}
function assemble(objs){
  const parts=[Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n','latin1')],offs=[];let len=parts[0].length;
  objs.forEach((o,i)=>{offs.push(len);const b=Buffer.concat([Buffer.from((i+1)+' 0 obj\n','latin1'),o,Buffer.from('\nendobj\n','latin1')]);parts.push(b);len+=b.length;});
  const xref='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+offs.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+len+'\n%%EOF\n';
  parts.push(Buffer.from(xref,'latin1'));return Buffer.concat(parts);
}
/* the printout as a picture: a page drawn by the browser */
const CARD=`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;font:19px/1.6 "DejaVu Sans",Arial,sans-serif;color:#111}
.p{padding:40px 48px}h1{font-size:24px;margin:0 0 14px}table{border-collapse:collapse}td{padding:3px 28px 3px 0;vertical-align:top}td.l{font-weight:700}</style></head><body><div class="p">
<h1>Student Information Record</h1>
<table><tr><td class="l">Student Name:</td><td>Rivera, Mateo</td><td class="l">Student ID:</td><td>4471823</td></tr>
<tr><td class="l">Date of Birth:</td><td>03/14/2016</td><td class="l">Grade:</td><td>03</td></tr>
<tr><td class="l">School:</td><td>Royal Palm School</td><td class="l">Sex:</td><td>Male</td></tr>
<tr><td class="l">Teacher:</td><td>Ms. Alvarez</td><td class="l">Home Language:</td><td>Spanish</td></tr>
<tr><td class="l">Primary Exceptionality:</td><td>Autism Spectrum Disorder</td><td class="l">IEP Date:</td><td>01/22/2026</td></tr>
<tr><td class="l">Allergies:</td><td>peanuts</td><td class="l">ESY:</td><td>Yes</td></tr></table></div></body></html>`;
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const log=[];wire(page,log);
  /* the fixtures */
  fs.writeFileSync(OUT+'printout.pdf',textPdf(TEXT.split('\n')));
  const card=await br.newPage({viewport:{width:1000,height:560},deviceScaleFactor:2});await card.setContent(CARD);await sleep(300);
  await card.screenshot({path:OUT+'card.png',type:'png'});const jpg=await card.screenshot({type:'jpeg',quality:92});await card.close();
  fs.writeFileSync(OUT+'scan.pdf',jpegPdf(jpg,2000,1120));
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{wsUI.confirm=async()=>true;}catch(e){}});
  /* 1. the dialog */
  await page.click('#readDoc');await sleep(300);
  const d1=await page.evaluate(()=>({open:document.querySelector('#dlg').open,title:document.querySelector('#dlgTitle').textContent,file:!!document.querySelector('#drFile'),paste:!!document.querySelector('#drText'),read:!!document.querySelector('#drRead'),hint:(document.querySelector('.dr-hint')||{}).textContent||''}));
  ok('1 Read a document opens the dialog: a file picker (the workstation is on a website) and a paste box',d1.open&&d1.title==='Read a document'&&d1.file&&d1.paste&&d1.read&&/scanned page/.test(d1.hint),d1);
  /* 2. the matcher */
  const r=await page.evaluate(t=>nbhDocRead.parse(t),TEXT);
  const F={};r.fields.forEach(f=>{F[f.k]=f;});
  const v=k=>(F[k]||{}).value;
  ok('2a the name: split into first and last from "RIVERA, MATEO J" (title case, the initial left off), for the bar and Form DM-1',v('name')==='Mateo Rivera'&&F.name.first==='Mateo'&&F.name.last==='Rivera'&&F.name.to.join()==='bar:client,DM-1:s.first,DM-1:s.last'&&F.name.ok,F.name);
  ok('2b the dates to YYYY-MM-DD: birth, enrolment (a month name), eligibility, IEP, annual review, reevaluation',v('dob')==='2016-03-14'&&v('enroll')==='2022-08-10'&&v('eligdate')==='2019-09-02'&&v('iepdate')==='2026-01-22'&&v('annual')==='2027-01-21'&&v('reeval')==='2028-09-01',{dob:v('dob'),en:v('enroll'),el:v('eligdate'),iep:v('iepdate'),an:v('annual'),re:v('reeval')});
  ok('2c the choices in the form\u2019s words: sex, grade, ELL, interpreter, eligibility, placement, matrix, diploma, ESY, 504, rights',v('sex')==='Male'&&v('grade')==='3'&&v('ell')==='ELL: active'&&v('interp')==='Yes: spoken'&&v('elig')==='Autism Spectrum Disorder'&&v('place')==='Separate class (self-contained)'&&v('matrix')==='253'&&v('diploma')==='Standard diploma'&&v('esy')==='Yes'&&v('p504')==='No'&&v('holder')==='Both parents (shared)',
    {sex:v('sex'),g:v('grade'),ell:v('ell'),i:v('interp'),e:v('elig'),p:v('place'),m:v('matrix'),d:v('diploma'),esy:v('esy'),p504:v('p504'),h:v('holder')});
  ok('2d the texts: IDs, school (not the letterhead), teacher, language, ethnicity, previous school, bus, Medicaid, second exceptionality, allergies, physician, strengths, interests, BCBA',
    v('sid')==='4471823'&&v('fleid')==='FL000123456789'&&v('school')==='Royal Palm School'&&v('room')==='Ms. Alvarez (Room 12)'&&v('lang')==='Spanish'&&v('eth')==='Hispanic'&&v('prior')==='Palm Grove Elementary'&&v('trans')==='Bus 42'&&v('medicaid')==='1234567890'&&v('elig2')==='Language Impairment'&&v('allergy')==='peanuts'&&v('pcp')==='Dr. Chen, Palm Pediatrics'&&v('strengths')==='enjoys music, follows picture schedules'&&v('interests')==='trains, drawing'&&v('bcba')==='J. Newsome',
    Object.fromEntries(Object.keys(F).map(k=>[k,v(k)])));
  ok('2e nothing from the parent, the phone or the letterhead; each detail carries the line it was read from',!F.skip&&!F.parent&&r.fields.every(f=>f.seen&&f.seen.length)&&/Student ID: 4471823/.test(F.sid.seen)&&r.fields.length===33,{n:r.fields.length,keys:Object.keys(F).join()});
  const B=r.behaviors;
  ok('2f the plan\u2019s target behaviors: Aggression with its definition on the line, Elopement with the Definition line, the replacement marked',B.length===3&&B[0].label==='Aggression'&&/^any instance of hitting/.test(B[0].def)&&!B[0].isRep&&B[1].label==='Elopement'&&/^leaving the assigned area/.test(B[1].def)&&B[2].label==='Requesting a break'&&/^handing the break card/.test(B[2].def)&&B[2].isRep,B);
  const r2=await page.evaluate(()=>nbhDocRead.parse('Student Name\nDoe, Jane\nDOB 01/02/2015 Grade 5 ID 9988776\nLast Name: Smith\nFirst Name: Ann\nThe student is in grade 4 at Palm Grove Elementary School District.\nIEP Meeting Date: Jan 5, 2026'));
  const G={};r2.fields.forEach(f=>{G[f.k]=f;});
  ok('2g a label on its own takes the next line; a label with one space takes a value of its shape (a date, a grade, an ID); a first and last name read on their own win; prose with "grade 4" and "School District" gives nothing wrong',
    G.name&&G.name.value==='Ann Smith'&&G.name.first==='Ann'&&G.name.last==='Smith'&&G.dob.value==='2015-01-02'&&G.grade.value==='5'&&G.sid.value==='9988776'&&!G.school&&G.iepdate.value==='2026-01-05'&&G.name.to.join()==='bar:client',{keys:Object.keys(G).join(),name:G.name,school:G.school,grade:G.grade});
  /* 3. the table and Place: TB-1 and GB-1 open first, with nothing in them */
  await page.evaluate(()=>{document.querySelector('#dlg').close();});
  for(const id of ['TB-1','GB-1']){await page.evaluate(id=>openForm(id,true),id);const t=Date.now();while(Date.now()-t<15000&&!(await page.evaluate(id=>!!state.status[id],id)))await sleep(150);}
  await page.click('#readDoc');await sleep(200);
  await page.fill('#drText',TEXT);await page.click('#drRead');await sleep(300);
  const t1=await page.evaluate(()=>({rows:document.querySelectorAll('#drOut .dr-tbl tbody tr').length,on:document.querySelectorAll('#drOut [data-dr]:checked').length,beh:document.querySelectorAll('#drOut [data-drb]').length,behOn:document.querySelectorAll('#drOut [data-drb]:checked').length,found:(document.querySelector('.dr-found')||{}).textContent||'',goes:[...document.querySelectorAll('#drOut .dr-tbl tbody tr')].slice(0,3).map(tr=>tr.children[3].textContent).join('|')}));
  ok('3a the table lists every detail ticked, where it goes and the line it came from, and the three behaviors ticked',t1.rows===33&&t1.on===33&&t1.beh===3&&t1.behOn===3&&/33 details read from the pasted text, and 3 target behaviors/.test(t1.found)&&t1.goes==='the bar, Form DM-1|the bar, Form DM-1|Form DM-1',t1);
  /* untick the interests, correct the teacher, then Place */
  await page.evaluate(()=>{const rows=[...document.querySelectorAll('#drOut .dr-tbl tbody tr')];const row=l=>rows.find(tr=>tr.children[1].textContent===l);row('Interests').querySelector('[data-dr]').checked=false;const t=row('Classroom / teacher').querySelector('[data-drv]');t.value='Ms. Alvarez, room 12';});
  await page.click('#drPlace');
  let t=Date.now();while(Date.now()-t<20000&&!(await page.evaluate(()=>!!state.frames['DM-1']&&!!state.status['DM-1']&&!document.querySelector('#dlg').open)))await sleep(200);await sleep(1200);
  const p1=await page.evaluate(()=>{const w=state.frames['DM-1'].contentWindow,g=n=>{const e=w.document.querySelector('[name="'+n+'"]');return e?e.value:null;};
    return {bar:[...document.querySelectorAll('#pClient,#pSid,#pGrade,#pSite,#pBcba')].map(e=>e.value),cur:state.cur,toast:([...document.querySelectorAll('#wsToasts .ws-toast')].pop()||{}).textContent||'',
      dm:{first:g('s.first'),last:g('s.last'),dob:g('s.dob'),sex:g('s.sex'),sid:g('s.sid'),fleid:g('s.fleid'),school:g('s.school'),grade:g('s.grade'),room:g('s.room'),enroll:g('s.enroll'),lang:g('s.lang'),interp:g('s.interp'),ell:g('s.ell'),eth:g('s.eth'),medicaid:g('s.medicaid'),elig:g('p.elig'),elig2:g('p.elig2'),iep:g('p.iepdate'),annual:g('p.annual'),reeval:g('p.reeval'),place:g('p.place'),matrix:g('p.matrix'),diploma:g('p.diploma'),esy:g('p.esy'),p504:g('p.p504'),allergy:g('h.allergy'),pcp:g('h.pcp'),strengths:g('pf.strengths'),interests:g('pf.interests'),holder:g('r.holder'),prior:g('s.prior'),trans:g('s.trans'),eligdate:g('p.eligdate')},
      facts:state.facts&&{n:(state.facts.behaviors||[]).length,src:state.facts.src.behaviors,labels:state.facts.behaviors.map(b=>b.label).join('|'),rep:state.facts.behaviors.map(b=>b.isRep).join()},factsTxt:document.querySelector('#factsTxt').textContent};});
  ok('3b Place fills the bar (name, ID, grade, school, BCBA), opens Form DM-1 and shows it',p1.bar.join('|')==='Mateo Rivera|4471823|3|Royal Palm School|J. Newsome'&&p1.cur==='DM-1',p1);
  const dm=p1.dm;
  ok('3c Form DM-1 holds the details: the texts, the dates, the choices; the corrected teacher; not the unticked interests',dm.first==='Mateo'&&dm.last==='Rivera'&&dm.dob==='2016-03-14'&&dm.sex==='Male'&&dm.sid==='4471823'&&dm.fleid==='FL000123456789'&&dm.school==='Royal Palm School'&&dm.grade==='3'&&dm.room==='Ms. Alvarez, room 12'&&dm.enroll==='2022-08-10'&&dm.lang==='Spanish'&&dm.interp==='Yes: spoken'&&dm.ell==='ELL: active'&&dm.eth==='Hispanic'&&dm.medicaid==='1234567890'&&dm.elig==='Autism Spectrum Disorder'&&dm.elig2==='Language Impairment'&&dm.iep==='2026-01-22'&&dm.annual==='2027-01-21'&&dm.reeval==='2028-09-01'&&dm.place==='Separate class (self-contained)'&&dm.matrix==='253'&&dm.diploma==='Standard diploma'&&dm.esy==='Yes'&&dm.p504==='No'&&dm.allergy==='peanuts'&&dm.pcp==='Dr. Chen, Palm Pediatrics'&&dm.strengths==='enjoys music, follows picture schedules'&&dm.interests===''&&dm.holder==='Both parents (shared)'&&dm.prior==='Palm Grove Elementary'&&dm.trans==='Bus 42'&&dm.eligdate==='2019-09-02',dm);
  ok('3d the case holds the three behaviors from the document, shown on the bar, and the toast says what was placed',p1.facts&&p1.facts.n===3&&p1.facts.src==='document'&&p1.facts.labels==='Aggression|Elopement|Requesting a break'&&p1.facts.rep==='false,false,true'&&/Target behaviors:.*Aggression.*\(document\)/.test(p1.factsTxt)&&/Placed: 5 in the bar; (27|32) in Form DM-1; 3 target behaviors to the case\. Check Form DM-1\./.test(p1.toast),{facts:p1.facts,txt:p1.factsTxt,toast:p1.toast});
  t=Date.now();let tb=null;while(Date.now()-t<10000){tb=await page.evaluate(()=>{const w=state.frames['TB-1'].contentWindow,g=n=>{const e=w.document.querySelector('[name="'+n+'"]');return e?e.value:null;};return {n:w.document.querySelectorAll('#candBody tr').length,b0:g('cand[0].beh'),by0:g('cand[0].by'),d0:g('cand[0].dec'),b1:g('cand[1].beh'),b2:g('cand[2].beh'),by2:g('cand[2].by'),d2:g('cand[2].dec')};});if(tb.b2)break;await sleep(300);}
  ok('3e Form TB-1 takes them as candidate rows with the definition, "the document" as who reported (the replacement said), the decision left open',tb&&tb.n>=3&&/^Aggression \u2014 any instance of hitting/.test(tb.b0)&&tb.by0==='the document'&&tb.d0===''&&/^Elopement \u2014 leaving/.test(tb.b1)&&/^Requesting a break \u2014 handing/.test(tb.b2)&&tb.by2==='the document (a replacement behavior)'&&tb.d2==='',tb);
  let gb=null;t=Date.now();while(Date.now()-t<10000){gb=await page.evaluate(()=>{const w=state.frames['GB-1'].contentWindow;return [...w.document.querySelectorAll('[name^="red["][name$=".beh"]')].map(e=>e.value).filter(Boolean).join('|');});if(gb)break;await sleep(300);}
  ok('3f Form GB-1 starts reduction objectives from them',/Aggression/.test(gb)&&/Elopement/.test(gb),gb);
  /* a second push does not double the candidates */
  await page.evaluate(()=>pushFactsToAll());await sleep(800);
  const tb2=await page.evaluate(()=>state.frames['TB-1'].contentWindow.document.querySelectorAll('#candBody tr').length);
  ok('3g the candidates are not added twice',tb2===tb.n,tb2);
  /* 4. kept unless Replace */
  await page.evaluate(()=>{const e=document.querySelector('#pSite');e.value='Another School';e.dispatchEvent(new Event('input',{bubbles:true}));const w=state.frames['DM-1'].contentWindow;const f=w.document.querySelector('[name="s.room"]');f.value='Mr. Old';f.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.click('#readDoc');await sleep(200);await page.fill('#drText','Student: Rivera, Mateo\nSchool: Royal Palm School\nTeacher: Ms. New\nGrade: 4');await page.click('#drRead');await sleep(200);
  const beh0=await page.evaluate(()=>document.querySelectorAll('#drOut [data-drb]').length);
  await page.click('#drPlace');await sleep(1500);
  const k1=await page.evaluate(()=>({site:document.querySelector('#pSite').value,grade:document.querySelector('#pGrade').value,room:state.frames['DM-1'].contentWindow.document.querySelector('[name="s.room"]').value,toast:([...document.querySelectorAll('#wsToasts .ws-toast')].pop()||{}).textContent||''}));
  ok('4a what the bar and the form hold is kept: the school and the teacher stay, the grade too (already there)',beh0===0&&k1.site==='Another School'&&k1.room==='Mr. Old'&&k1.grade==='3'&&/^Nothing new to place\. Left as they were: 2 in the bar, 2 in Form DM-1 \(tick Replace to change them\)\./.test(k1.toast),k1);
  await page.click('#readDoc');await sleep(200);await page.fill('#drText','Student: Rivera, Mateo\nSchool: Royal Palm School\nTeacher: Ms. New\nGrade: 4');await page.click('#drRead');await sleep(200);
  await page.evaluate(()=>{document.querySelector('#drOver').checked=true;});await page.click('#drPlace');await sleep(1500);
  const k2=await page.evaluate(()=>({site:document.querySelector('#pSite').value,grade:document.querySelector('#pGrade').value,room:state.frames['DM-1'].contentWindow.document.querySelector('[name="s.room"]').value,dmGrade:state.frames['DM-1'].contentWindow.document.querySelector('[name="s.grade"]').value}));
  ok('4b with Replace ticked they are replaced',k2.site==='Royal Palm School'&&k2.room==='Ms. New'&&k2.grade==='4'&&k2.dmGrade==='4',k2);
  /* 5. the files */
  await page.click('#readDoc');await sleep(200);
  await page.setInputFiles('#drFile',OUT+'printout.pdf');
  t=Date.now();while(Date.now()-t<30000&&!(await page.evaluate(()=>!!document.querySelector('#drOut .dr-tbl, #drOut .dr-err, #drOut .dr-none'))))await sleep(200);
  const f1=await page.evaluate(()=>({rows:[...document.querySelectorAll('#drOut .dr-tbl tbody tr')].map(tr=>tr.children[1].textContent+'='+tr.children[2].querySelector('input').value),err:(document.querySelector('#drOut .dr-err,#drOut .dr-none')||{}).textContent||'',found:(document.querySelector('.dr-found')||{}).textContent||''}));
  const has=(rows,s)=>rows.some(r=>r===s);
  ok('5a a PDF with its own text is read by PDF.js: the same details, from the file',f1.rows.length>=28&&has(f1.rows,'Student=Mateo Rivera')&&has(f1.rows,'Date of birth=2016-03-14')&&has(f1.rows,'Student ID=4471823')&&has(f1.rows,'School=Royal Palm School')&&has(f1.rows,'Annual review due=2027-01-21')&&/read from printout\.pdf/.test(f1.found)&&!f1.err,f1);
  await page.evaluate(()=>{document.querySelector('#dlg').close();});await page.click('#readDoc');await sleep(200);
  const progs=[];const poll=setInterval(async()=>{try{const p=await page.evaluate(()=>(document.querySelector('#drProg')||{}).textContent||'');if(p&&progs[progs.length-1]!==p)progs.push(p);}catch(e){}},300);
  await page.setInputFiles('#drFile',OUT+'card.png');
  t=Date.now();while(Date.now()-t<150000&&!(await page.evaluate(()=>!!document.querySelector('#drOut .dr-tbl, #drOut .dr-err, #drOut .dr-none'))))await sleep(400);
  const f2=await page.evaluate(()=>({rows:[...document.querySelectorAll('#drOut .dr-tbl tbody tr')].map(tr=>tr.children[1].textContent+'='+tr.children[2].querySelector('input').value),err:(document.querySelector('#drOut .dr-err,#drOut .dr-none')||{}).textContent||'',text:DR.text}));
  fs.writeFileSync(OUT+'ocr-card.txt',f2.text||'');
  ok('5b a picture is read by the text recognizer on the device, with its progress shown: the name, the ID, the birth date, the grade, the school and the eligibility read',has(f2.rows,'Student=Mateo Rivera')&&has(f2.rows,'Student ID=4471823')&&has(f2.rows,'Date of birth=2016-03-14')&&has(f2.rows,'Grade=3')&&has(f2.rows,'School=Royal Palm School')&&has(f2.rows,'Primary exceptionality=Autism Spectrum Disorder')&&progs.some(p=>/Reading the picture/.test(p))&&!f2.err,{rows:f2.rows,err:f2.err,progs,ms:Date.now()-t});
  await page.evaluate(()=>{document.querySelector('#dlg').close();});await page.click('#readDoc');await sleep(200);
  progs.length=0;await page.setInputFiles('#drFile',OUT+'scan.pdf');
  t=Date.now();while(Date.now()-t<150000&&!(await page.evaluate(()=>!!document.querySelector('#drOut .dr-tbl, #drOut .dr-err, #drOut .dr-none'))))await sleep(400);
  clearInterval(poll);
  const f3=await page.evaluate(()=>({rows:[...document.querySelectorAll('#drOut .dr-tbl tbody tr')].map(tr=>tr.children[1].textContent+'='+tr.children[2].querySelector('input').value),err:(document.querySelector('#drOut .dr-err,#drOut .dr-none')||{}).textContent||'',text:DR.text}));
  fs.writeFileSync(OUT+'ocr-scan.txt',f3.text||'');
  ok('5c a scanned PDF (a picture on the page) is drawn and read by the text recognizer: the name, the ID and the birth date',has(f3.rows,'Student=Mateo Rivera')&&has(f3.rows,'Student ID=4471823')&&has(f3.rows,'Date of birth=2016-03-14')&&progs.some(p=>/Reading page 1 of 1/.test(p))&&!f3.err,{rows:f3.rows,err:f3.err,progs});
  await page.screenshot({path:OUT+'dialog.png'});
  /* a folder opened from a drive: pasted text only */
  const fp=await br.newPage({viewport:{width:1100,height:800}});const flog=[];wire(fp,flog);
  await fp.goto('file://'+path.join(ROOT,'NBH-Workstation','index.html'),{waitUntil:'load'}).catch(()=>{});await sleep(800);
  const d2=await fp.evaluate(()=>{try{document.querySelector('#readDoc').click();return {file:!!document.querySelector('#drFile'),hint:(document.querySelector('.dr-hint')||{}).textContent||'',paste:!!document.querySelector('#drText')};}catch(e){return {err:String(e)};}}).catch(e=>({err:String(e)}));
  ok('6 opened from a drive, the dialog takes pasted text only and says why',d2.paste&&!d2.file&&/Opened from a drive/.test(d2.hint),d2);
  await fp.close();
  const bad=log.filter(l=>!/favicon|net::ERR|Download the React|sourcemap|DevTools|\[Violation\]/i.test(l.text));
  ok('7 no page errors',!bad.length,bad.slice(0,6));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2);});
