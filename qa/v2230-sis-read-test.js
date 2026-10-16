/* v22.30 Read a document on screenshots of a student information system as they come from an iPad (simulated pages laid
   out like the real ones; simulated student and family only):
   1. the Demographics page: the side menu beside the fields ("504 Info" is not a preferred name), the "?" help marks, a
      required field's asterisk read as a quotation mark (the date of birth and the sex are read), the race and ethnicity
      asked as questions ("Race: White  Yes", "Ethnicity: Hispanic or Latino  Yes"), the badge's name and ID;
   2. the Addresses & Contacts page scrolled so that the top cards' headings are gone, with icons after the names: every
      contact read, the one kept under a group home's name as the person with the home after;
   3. the Edit Contact window that cannot be edited: its boxes' pale grey text read on a second, darkened reading (the
      name from the unlabelled name boxes, the relationship, phone, email and address);
   4. the Schedule with its info and arrow icons: the homeroom teacher the classroom teacher, no stray marks in what they teach;
   5. no page errors;
   6. a 28-page IEP PDF with its own text, read as Safari on the iPad reads it (its streams cannot be walked with "for
      await", which made every page fail and be read as a picture, and only the first 8 pages were read): every page's
      text read, none as a picture; the details from the IEP's sentences on its later pages (the next annual review and
      reevaluation, the eligibilities, where the services are received, ESY, a standard diploma deferred, the bus needs),
      the parent from the cover; no "Yes  No" taken for transportation, no services table for a second exceptionality.
   usage: node qa/v2230-sis-read-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
const OUT=__dirname+'/out/v2230/';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const HEAD=`<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#fff;font-size:15px}
.top{background:#eee;height:92px;display:flex;align-items:flex-start;gap:18px;padding:6px 10px}.stu{background:#2e5c99;color:#fff;padding:6px 14px;font-size:20px}
.stu small{display:block;margin-top:26px;font-size:13px;color:#2e5c99;background:#fff;padding:2px 4px}.ttl{font-size:24px;margin-top:8px}
.nav{background:#3a72b8;color:#fff;height:40px;display:flex;gap:26px;align-items:center;padding:0 14px;font-size:17px}
.tabs{display:flex;gap:16px;padding:12px 10px;font-size:16px}.tabs b{background:#ddd;padding:3px 6px}
.wrap{display:flex}.side{width:290px;padding:10px 14px;white-space:nowrap}.side div{padding:9px 0;border-bottom:1px solid #eee}.side i{display:inline-block;width:34px;font-style:normal;font-size:12px;color:#fff;background:#8a5cc2;text-align:center;margin-right:10px;border-radius:3px}
.main{flex:1;padding:10px 16px}</style></head><body>
<div class="top"><div class="stu">&#10005; Rivera, Mateo Josue &#9662;<small>4471823 - 02</small></div><div class="ttl">Student Info</div></div>
<div class="nav"><span>Search</span><span>Setup</span><span>Students</span><span>Users</span><span>Scheduling</span><span>Grades</span></div>
<div class="tabs"><b>Demographic</b><span>Summary</span><span>Enrollment</span><span>Schedule</span><span>Requests</span></div>`;
const SIDE=`<div class="side">${['Primary Info','Child Safety','504 Info','AICE Summary','Academic History','Addresses &amp; Contacts','Adult Ed','Alternative Ed','Applicant','Athletics','Behavior','Career Academies','Choice Options','Classified','Comments Log','DOP','Demographics','ESE','ESOL'].map((t,i)=>'<div><i>'+'PI CS 5I AS AH AC AE AE A A B CA CO C CL D D E E'.split(' ')[i]+'</i>'+t+'</div>').join('')}</div>`;
const DEMO=HEAD+`<style>table.d{border-collapse:collapse;width:100%}table.d td{border:1px solid #e3e3e3;padding:9px 8px;vertical-align:top}td.q{width:18px;font-weight:bold}td.l{text-align:right;background:#f4f4f4;width:22%}h4{margin:12px 0 6px;font-size:18px}</style>
<div class="wrap">${SIDE}<div class="main"><h3>Demographics</h3><table class="d">
<tr><td class="q">?</td><td class="l">Local Student ID</td><td>4471823</td><td class="l">Legal Name</td><td>Rivera, Mateo Josue</td></tr>
<tr><td class="q">?</td><td class="l">Suffix</td><td></td><td class="l">? &nbsp; Nickname</td><td></td></tr>
<tr><td class="q">?</td><td class="l">Former or Maiden Name</td><td></td><td class="l">? &nbsp; * Birthdate</td><td>03/14/2016 &nbsp;&nbsp;&nbsp;&nbsp; 10 years 7 months</td></tr>
<tr><td class="q">?</td><td class="l">* Location of Birth</td><td>WEST PALM BEACH, FL</td><td class="l">? &nbsp; * Gender</td><td>Male</td></tr>
</table><h4>Race</h4><table class="d">
<tr><td class="q">?</td><td class="l">Single Ethnicity</td><td>H - Hispanic</td><td class="l">? &nbsp; * Ethnicity: Hispanic or Latino</td><td>Yes</td></tr>
<tr><td class="q">?</td><td class="l">* Race: White</td><td>Yes</td><td class="l">? &nbsp; * Race: Black or African American</td><td>No</td></tr>
<tr><td class="q">?</td><td class="l">* Race: Asian</td><td>No</td><td class="l">? &nbsp; * Race: American Indian or Alaska Native</td><td>No</td></tr>
</table></div></div></body></html>`;
/* the cards page scrolled: the top row's headings ("Address", "Contact #4") are above the screen */
const card=(body,w)=>`<div style="border:1px solid #ddd;border-radius:4px;padding:12px 16px;width:${w||330}px;margin:0 14px 14px 0;font-size:16px;line-height:1.55">${body}</div>`;
const ic=' <span style="color:#3a72b8">&#9993;</span> <span style="color:#d9a400">&#9888;</span> <span style="color:#2e8b57">&#128663;</span>';
const CARDS=HEAD+`<div class="wrap">${SIDE}<div class="main"><h3 style="margin:0 0 6px">&#8962; Addresses &amp; Contacts</h3><div style="display:flex;align-items:flex-start">
${card('120 PALM GROVE RD<br>WEST PALM BEACH, FL 33401<br>(561) 555-0142<br><b>Contacts at this Address</b><div style="border:1px solid #ddd;padding:6px">#1 - Seagrape Group Home, Iris Calloway'+ic+'</div>')}
${card('88 OCEAN BREEZE CIR<br>RIVIERA BEACH, FL 33404<br>561-5550177<br><b>Contacts at this Address</b><div style="border:1px solid #ddd;padding:6px">#2 - Rivera, Ana'+ic+'<br>#3 - Rivera, Luis'+ic+'</div>')}
${card('Perez, Rosa<br>(No Address)<br><b>Contact Details:</b><table style="border-collapse:collapse"><tr><td style="border:1px solid #ddd;padding:4px 10px">Cell Phone</td><td style="border:1px solid #ddd;padding:4px 10px">(561) 555-0181</td></tr><tr><td style="border:1px solid #ddd;padding:4px 10px">Contact\'s Priority</td><td style="border:1px solid #ddd;padding:4px 10px">4</td></tr></table><div style="font-size:21px;margin-top:10px">Grandmother'+ic+'</div>')}
</div><div style="display:flex">${card('<div style="font-size:21px">&#128100; Contact #7</div>Ortiz, Carmen<br>(No Address)<br><b>Contact Details:</b><table style="border-collapse:collapse"><tr><td style="border:1px solid #ddd;padding:4px 10px">Cell Phone</td><td style="border:1px solid #ddd;padding:4px 10px">(561) 555-0170</td></tr><tr><td style="border:1px solid #ddd;padding:4px 10px">Home Phone</td><td style="border:1px solid #ddd;padding:4px 10px">(561) 555-0171</td></tr></table><div style="font-size:21px;margin-top:10px">Aunt'+ic+'</div>')}</div>
<h3>Linked Users <small style="font-weight:normal">The following users will be able to view data for this student</small></h3></div></div></body></html>`;
/* the Edit Contact window that cannot be edited: its boxes in pale grey, no labels on the name boxes */
const box=(v,ph,w)=>`<div style="border:1px solid #e2e2e2;border-radius:3px;padding:12px 14px;width:${w||150}px;color:${v?'#a6a6a6':'#d6d6d6'};font-size:17px">${v||ph}</div>`;
const EDIT=`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#555}
.dlg{background:#fff;margin:40px auto;width:1000px;padding:24px 28px}.row{display:flex;gap:16px;margin:10px 0}.opt{width:250px;border:1px solid #ddd;padding:12px;margin-left:auto}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:15px}tr.b td{background:#e3eefb}</style></head><body><div class="dlg">
<div style="font-size:24px">Edit Contact <span style="font-size:16px;color:#666">You do not have permission to edit this contact</span></div>
<div style="display:flex"><div><div class="row">${box('','Title (Mr, Ms, etc.)',130)}${box('Ana','')}${box('','Middle Name')}${box('Rivera','')}</div>
<div class="row">${box('Mother','',650)}</div><div style="font-weight:bold;margin-top:14px">Email</div><div class="row">${box('ana.rivera@example.com','',650)}</div></div>
<div class="opt"><b>Options</b><p>Custody</p><p>Emergency</p><p>Pick Up</p></div></div>
<h3>Phone &amp; Contact Details:</h3><table><tr><th>Contact Type</th><th>Phone Number / Value</th><th>Detail Priority</th><th>Options</th></tr><tr class="b"><td>Cell Phone</td><td>(561) 555-0142</td><td>1</td><td>Unlisted Callout Blocked Text</td></tr></table>
<h3>Contact Address</h3><div style="border:1px solid #ddd;padding:12px;width:260px;font-size:17px">120 PALM GROVE RD<br>WEST PALM BEACH, FL 33401</div>
<div style="text-align:right"><span style="background:#3cb371;color:#fff;padding:10px 24px">Done</span></div></div></body></html>`;
const sel=(t,w)=>`<span style="display:inline-block;border:1px solid #bbb;background:#f4f4f4;padding:2px 4px;min-width:${w||60}px">${t} <span style="color:#666">&#9662;</span></span>`;
const ii='<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#3a72b8;color:#fff;font:bold 12px/16px Georgia;text-align:center">i</span>';
const srow=(per,course,teach,days,room,en)=>`<tr><td>[ ]</td><td>${sel(per,110)}</td><td>${sel('FY',30)}</td><td>${sel('Electives',110)}</td><td>${sel(course,230)} ${ii}</td><td>${sel(teach,220)} ${ii}</td><td>${sel(days,70)}</td><td>${room}</td><td>${en}</td><td></td><td>Sim Clerk</td></tr>`;
const SCHED=HEAD+`<style>table.s{border-collapse:collapse;margin:14px 16px;font-size:15px}table.s td,table.s th{border:1px solid #d6d6d6;padding:6px 7px;white-space:nowrap}</style>
<div style="margin:6px 16px">8 Records</div><table class="s"><tr><th></th><th>Period</th><th>Term</th><th>Subject</th><th>Course</th><th>Section - Teacher</th><th>Days</th><th>Room</th><th>Enrolled</th><th>Dropped</th><th>Last Modified By</th></tr>
${srow('Homeroom','HOMEROOM (0000HMRM)','HTDa - Dana Whitfield (5/10)','MTWHF','02121','08/10/2026')}${srow('Period 01','ACCESS LANG ART (77100)','P1Da - Dana Whitfield (5/10)','MTWHF','02121','08/10/2026')}${srow('Therapy','LANG THERAPY (7966040G)','ShWi - Paula Brennan (25/50)','T','02140','08/10/2026')}</table></body></html>`;

const pg=(n,body)=>'<section style="page-break-after:always;font:12px Arial;padding:24px"><div>THE SCHOOL DISTRICT OF SIMULATED COUNTY</div><div>DEPARTMENT OF EXCEPTIONAL STUDENT EDUCATION (ESE)</div><div>Last Name: Rivera &nbsp; First Name: Mateo &nbsp; Student ID #: 4471823</div><div>Meeting Date: 10/06/2026 &nbsp; DOB: 03/14/2016 &nbsp; Grade: 05</div><h3>Page '+n+'</h3>'+body+'</section>';
const filler='<p>'+'The team reviewed the student\u2019s progress and discussed the supports in place. '.repeat(14)+'</p>';
const IEP='<!doctype html><html><body>'+Array.from({length:28},(_,i)=>{const n=i+1;let b=filler;
  if(n===1)b='<div>Parent Name: Ana Rivera Parent Phone Number: 5615550142 Parent Email: ana.rivera@example.com</div><div>School: Seagrape Elementary</div>'+filler;
  if(n===3)b='<div>Transportation</div><div>Yes</div><div>No</div><div>Specific "Transportation Needs" include:</div><div>\u25aa Aide/Monitor required</div><div>\u25aa Safety vest</div>'+filler;
  if(n===16)b='<div>Related Services</div><div>Services Begin Date End Date Frequency Delivery Method Location</div><div>School Nursing Services 02/02/2026 02/01/2027</div>'+filler;
  if(n===17)b='<div>Extended School Year Services</div><div>This student is in need of extended school year services.</div>'+filler;
  if(n===18)b='<div>PLACEMENT</div><div>Removal from Programs with Nondisabled Students</div><div>At the time of October FTE, the student receives his/her educational services in a: Separate class (C)</div>'+filler;
  if(n===22)b='<div>Is this student deferring receipt of a standard high school diploma pursuant to s. 1003.4282(11)(c), F.S.? Yes</div>'+filler;
  if(n===26)b='<div>The next scheduled reevaluation will occur on or before: 10/01/2028</div><div>The next required annual review will occur on or before: 10/05/2027</div><div>Program Eligibility(ies): Autism Spectrum Disorder, Language Impairment</div>'+filler;
  if(n===28)b='<div>SIM-LAST-PAGE-MARK</div>'+filler;
  return pg(n,b);}).join('')+'</body></html>';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const shot=async(html,file,w,h)=>{const p=await br.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});await p.setContent(html);await sleep(300);await p.screenshot({path:OUT+file});await p.close();return OUT+file;};
  const files={demo:await shot(DEMO,'demo.png',1180,900),cards:await shot(CARDS,'cards.png',1420,900),edit:await shot(EDIT,'edit.png',1180,760),sched:await shot(SCHED,'sched.png',1500,520)};
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  const read=async png=>{await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}DR.res=null;DR.text='';drOpen();});await sleep(300);await page.setInputFiles('#drFile',png);
    await page.waitForFunction(()=>DR.res&&DR.text,null,{timeout:150000});await sleep(200);
    return page.evaluate(()=>({f:Object.fromEntries(DR.res.fields.map(x=>[x.k,x.value])),c:(DR.res.contacts||[]).map(c=>[c.n,c.name,c.rel,c.phone,c.email,c.addr].join('|')),t:(DR.res.team||[]).map(t=>[t.name,t.role,t.inv].join('|'))}));};
  const d=await read(files.demo);
  ok('1a the Demographics page: name, ID, date of birth and sex read past the side menu, the "?" marks and the asterisks',d.f.name==='Mateo Rivera'&&d.f.sid==='4471823'&&d.f.dob==='2016-03-14'&&d.f.sex==='Male',d.f);
  ok('1b no side-menu entry read as a detail (no preferred name "504 Info", no ELL from "ESOL")',!d.f.pref&&!d.f.ell&&!Object.values(d.f).some(v=>/504 Info|Child Safety|ESOL/.test(v)),d.f);
  ok('1c race and ethnicity from the questions: White; Hispanic or Latino',d.f.eth==='White; Hispanic or Latino',d.f);
  const c=await read(files.cards);
  ok('2 the cards page scrolled past its headings: every contact, the group home’s as the person with the home after',
    JSON.stringify(c.c.map(x=>x.split('|').slice(0,4).join('|')))===JSON.stringify(['1|Iris Calloway (Seagrape Group Home)||(561) 555-0142','2|Ana Rivera||(561) 555-0177','3|Luis Rivera||(561) 555-0177','7|Carmen Ortiz|Other relative|(561) 555-0170','0|Rosa Perez|Grandparent|(561) 555-0181']),c.c);
  const e=await read(files.edit);
  ok('3 the Edit Contact window in pale grey: Ana Rivera, Mother, the phone, email and address',e.c.length===1&&/^0\|Ana Rivera\|Mother\|\(561\) 555-0142\|ana\.rivera@example\.com\|120 PALM GROVE RD, WEST PALM BEACH, FL 33401$/.test(e.c[0])&&!e.f.name,e);
  const s=await read(files.sched);
  ok('4 the Schedule with its icons: the homeroom teacher the classroom teacher, the therapist the speech-language pathologist, no stray marks',
    s.t.length===2&&/^Dana Whitfield\|Classroom teacher\|Homeroom\b.*room 02121/.test(s.t[0])&&/^Paula Brennan\|Speech-language pathologist\|/.test(s.t[1])&&!s.t.some(x=>/[©@\[\]]/.test(x)),s.t);
  /* 6 a long IEP as Safari reads it */
  {const pp=await br.newPage();await pp.setContent(IEP);await pp.pdf({path:OUT+'iep.pdf',format:'Letter'});await pp.close();}
  await page.evaluate(()=>{delete ReadableStream.prototype[Symbol.asyncIterator];window.__ocr=0;const o=drOcr;drOcr=async function(){window.__ocr++;return o.apply(this,arguments);};});
  const ip=await read(OUT+'iep.pdf');const it=await page.evaluate(()=>({ocr:window.__ocr,last:/SIM-LAST-PAGE-MARK/.test(DR.text),pages:(DR.text.match(/Page \d+/g)||[]).length}));
  ok('6a all 28 pages read as text, none as a picture, the "for await" missing as on the iPad',it.ocr===0&&it.last&&it.pages>=28,it);
  ok('6b the IEP\u2019s details from its later pages: annual review, reevaluation, the eligibilities, placement, ESY, diploma, the bus needs',ip.f.annual==='2027-10-05'&&ip.f.reeval==='2028-10-01'&&ip.f.elig==='Autism Spectrum Disorder'&&ip.f.elig2==='Language Impairment'&&ip.f.place==='Separate class (self-contained)'&&ip.f.esy==='Yes'&&ip.f.diploma==='Standard diploma'&&ip.f.trans==='Yes: Aide/Monitor required; Safety vest',ip.f);
  ok('6c the parent from the cover, with phone and email; the student and the IEP date',JSON.stringify(ip.c)===JSON.stringify(['0|Ana Rivera||(561) 555-0142|ana.rivera@example.com|'])&&ip.f.name==='Mateo Rivera'&&ip.f.iepdate==='2026-10-06',{c:ip.c,f:ip.f});
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
