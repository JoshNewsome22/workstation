/* v22.27 Read a document takes a student information system's Schedule and Enrollment pages (screenshots):
   1. the Schedule: each class's teacher, a dropped class left out; the homeroom teacher as the classroom teacher with the
      classes they teach, the days and the room; the language therapy's teacher as the speech-language pathologist; art,
      PE and music teachers as Other with their class; the homeroom room and teacher for Classroom / teacher;
   2. Place puts them into Form DM-1's Team and Providers (school-based), the speech-language pathologist also as the
      provider of the Related Services row for speech-language therapy (weekly, on its day); read again, the same
      teachers complete their rows, none added;
   3. the Enrollment: the school now, its grade and date of enrollment, and the schools before (most recent first; a
      summer's school, a temporary assignment and an earlier stint at the school now left out); none of the tables'
      headings read as a detail; Place puts them in the bar and Form DM-1;
   4. no page errors. Simulated student, teachers and schools only.   usage: node qa/v2227-schedule-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
const OUT=__dirname+'/out/v2227/';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const SCHED=`<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#fff}
.top{background:#eee;height:84px;display:flex;align-items:center;gap:18px;padding:0 10px}.stu{background:#2e5c99;color:#fff;padding:6px 14px;font-size:20px}
.stu small{display:block;font-size:13px;color:#cde}.ttl{font-size:24px}
.nav{background:#3a72b8;color:#fff;height:40px;display:flex;gap:26px;align-items:center;padding:0 14px;font-size:17px}
.tabs{display:flex;gap:16px;padding:12px 10px;font-size:16px}.tabs b{background:#ddd;padding:3px 6px}
table{border-collapse:collapse;margin:14px 16px;font-size:13.5px}th{background:#f1f1f1;text-align:left}td,th{border:1px solid #d6d6d6;padding:6px 7px;white-space:nowrap}
td.s{background:#f4f4f4}tr:nth-child(even) td{background:#eaf2fb}
</style></head><body>
<div class="top"><div class="stu">Rivera, Mateo<small>4471823 - 02</small></div><div class="ttl">Student Schedule</div></div>
<div class="nav"><span>Search</span><span>Setup</span><span>Students</span><span>Users</span><span>Scheduling</span><span>Grades</span><span>Attendance</span></div>
<div class="tabs"><span>Demographic</span><span>Summary</span><span>Enrollment</span><b>Schedule</b><span>Requests</span><span>Grades</span></div>
<div style="margin:6px 16px">8 Records</div><table><tr><th></th><th>Period</th><th>Term</th><th>Subject</th><th>Course</th><th>Section - Teacher</th><th>Days</th><th>Room</th><th>Enrolled</th><th>Dropped</th><th>Last Modified By</th><th>Last Modified At</th></tr><tr><td>[ ]</td><td class="s">Homeroom &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">Homeroom - 2nd Grade (00008) &#9662;</td><td class="s">H2Ta - Dana Whitfield (24/25) &#9662;</td><td class="s">MTWHF &#9662;</td><td>02104</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">ELA A &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">ACCESS LANG ART - 2 (77100) &#9662;</td><td class="s">R2Ta - Dana Whitfield (24/25) &#9662;</td><td class="s">MTWHF &#9662;</td><td>02104</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Math A &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">ACCESS MATH GRADE 2 (77120) &#9662;</td><td class="s">M2Ta - Dana Whitfield (24/25) &#9662;</td><td class="s">MTWHF &#9662;</td><td>02104</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Spec &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">ART E - GRADE 02 (50010300) &#9662;</td><td class="s">A2Ta - Owen Marsh (9/10) &#9662;</td><td class="s">MTWHF &#9662;</td><td>01121</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Spec &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">PE GR 2 (50150400) &#9662;</td><td class="s">G2Ta - Lena Ortega (9/10) &#9662;</td><td class="s">MTWHF &#9662;</td><td>01122</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Spec &#9662;</td><td class="s">FY &#9662;</td><td class="s">Second Grade &#9662;</td><td class="s">MUSIC E - GRADE 02 (50130800) &#9662;</td><td class="s">M2Ta - Iris Calloway (9/10) &#9662;</td><td class="s">MTWHF &#9662;</td><td>02110</td><td>08/10/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Therapy &#9662;</td><td class="s">FY &#9662;</td><td class="s">All Courses &#9662;</td><td class="s">LANG THRPY: PK-5 (7763040G) &#9662;</td><td class="s">SeLi - Paula Brennan (30/50) &#9662;</td><td class="s">T &#9662;</td><td>01101N</td><td>08/10/2026</td><td>10/15/2026</td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr><tr><td>[ ]</td><td class="s">Therapy &#9662;</td><td class="s">FY &#9662;</td><td class="s">All Courses &#9662;</td><td class="s">LANG THRPY: PK-5 (7763040G) &#9662;</td><td class="s">SeOL - Grace Holloway (44/50) &#9662;</td><td class="s">T &#9662;</td><td>01101N</td><td>10/16/2026</td><td></td><td>Sim Clerk</td><td>06/11/2026 12:39:01 pm</td></tr></table></body></html>`;
const ENROLL=`<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#fff}
.top{background:#eee;height:84px;display:flex;align-items:center;gap:18px;padding:0 10px}.stu{background:#2e5c99;color:#fff;padding:6px 14px;font-size:20px}
.stu small{display:block;font-size:13px;color:#cde}.ttl{font-size:24px}
.nav{background:#3a72b8;color:#fff;height:40px;display:flex;gap:26px;align-items:center;padding:0 14px;font-size:17px}
.tabs{display:flex;gap:16px;padding:12px 10px;font-size:16px}.tabs b{background:#ddd;padding:3px 6px}
table{border-collapse:collapse;margin:14px 16px;font-size:13.5px}th{background:#f1f1f1;text-align:left}td,th{border:1px solid #d6d6d6;padding:6px 7px;white-space:nowrap}
td.s{background:#f4f4f4}tr:nth-child(even) td{background:#eaf2fb}
</style></head><body>
<div class="top"><div class="stu">Rivera, Mateo<small>4471823 - 02</small></div><div class="ttl">Student Info</div></div>
<div class="nav"><span>Search</span><span>Setup</span><span>Students</span><span>Users</span><span>Scheduling</span><span>Grades</span><span>Attendance</span></div>
<div class="tabs"><span>Demographic</span><span>Summary</span><b>Enrollment</b><span>Schedule</span><span>Requests</span><span>Grades</span></div>
<h2 style="font-weight:500;margin:6px 30px">Enrollment</h2><table><tr><th>View</th><th>Year</th><th>School</th><th>Grade Level</th><th>Enrollment Date</th><th>Enrollment Code</th><th>Drop Date</th><th>Drop Code</th><th>Second School</th></tr><tr><td>View</td><td>2026-2027</td><td>Royal Palm School - 1801 - EMH</td><td>02</td><td>08/10/2026</td><td>(E01) In District Previous Year</td><td></td><td></td><td>&#10007;</td></tr><tr><td>View</td><td>2025-2026</td><td>XSummer - Royal Palm School - 1801S - EMH</td><td>01</td><td>06/15/2026</td><td>(ESS) Enroll Second School</td><td>07/16/2026</td><td>(WSS) Withdrawal Second School</td><td>&#10003;</td></tr><tr><td>View</td><td>2025-2026</td><td>Royal Palm School - 1801 - EMH</td><td>01</td><td>05/18/2026</td><td>(R02) Re-entry from another school same district</td><td>05/29/2026</td><td>(W01) In School Transfer</td><td>&#10007;</td></tr><tr><td>View</td><td>2025-2026</td><td>Seagrape Elementary - 2011 - E</td><td>01</td><td>01/28/2026</td><td>(R02) Re-entry from another school same district</td><td>05/11/2026</td><td>(W02) In District Transfer</td><td>&#10007;</td></tr><tr><td>View</td><td>2025-2026</td><td>Palm Grove Elementary - 0101 - E</td><td>01</td><td>08/11/2025</td><td>(E01) In District Previous Year</td><td>01/27/2026</td><td>(W02) In District Transfer</td><td>&#10007;</td></tr><tr><td>View</td><td>2024-2025</td><td>Palm Grove Elementary - 0101 - E</td><td>KG</td><td>08/14/2024</td><td>(E05) PK KG entry First Time</td><td>05/30/2025</td><td>(W01) In School Transfer</td><td>&#10007;</td></tr><tr><td>View</td><td>2023-2024</td><td>Coral Point K-8 - 1541 - EM</td><td>PK</td><td>08/10/2023</td><td>(E01) In District Previous Year</td><td>05/30/2024</td><td>(W25) W/D Under Compulsory Age</td><td>&#10007;</td></tr><tr><td>View</td><td>2021-2022</td><td>Temporary Assignment - H999 - EMHA</td><td>PK</td><td>05/25/2022</td><td>(E05) PK KG entry First Time</td><td>05/26/2022</td><td>(W25) W/D Under Compulsory Age</td><td>&#10007;</td></tr></table></body></html>`;
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const shot=async(html,file)=>{const p=await br.newPage({viewport:{width:1180,height:820},deviceScaleFactor:2});await p.setContent(html);await sleep(300);await p.screenshot({path:OUT+file});await p.close();return OUT+file;};
  const sPng=await shot(SCHED,'schedule.png'),ePng=await shot(ENROLL,'enrollment.png');
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  const read=async png=>{await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}drOpen();});await sleep(300);await page.setInputFiles('#drFile',png);
    const t=Date.now();while(Date.now()-t<150000&&!(await page.evaluate(()=>!!document.querySelector('#drOut .dr-found, #drOut .dr-err, #drOut .dr-none'))))await sleep(400);
    return page.evaluate(()=>({found:($('#drOut .dr-found')||$('#drOut')).textContent.slice(0,300),
      fields:[...document.querySelectorAll('#drOut .dr-tbl:not(.dr-ctbl) tbody tr')].map(tr=>tr.children[1].textContent+'='+tr.querySelector('[data-drv]').value),
      team:[...document.querySelectorAll('#drOut [data-drt]')].map(c=>{const i=c.dataset.drt,g=f=>(document.querySelector('#drOut [data-drtf="'+f+'"][data-i="'+i+'"]')||{}).value;return [g('name'),g('role'),g('inv')].join(' | ');})}));};
  const place=async()=>{await page.click('#drPlace');await page.waitForFunction(()=>!$('#dlg').open,null,{timeout:30000}).catch(()=>{});await sleep(1500);
    return page.evaluate(()=>[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).pop()||'');};
  const fr=()=>page.frames().find(f=>/DM-1_/.test(f.url()));
  const dm=()=>fr().evaluate(()=>{const v=k=>(document.querySelector('[name="'+k+'"]')||{}).value||'';const n=+document.getElementById('nTeam').value,t=[];
    for(let i=0;i<n;i++){if(v('t['+i+'].name'))t.push([v('t['+i+'].role'),v('t['+i+'].name'),v('t['+i+'].sb'),v('t['+i+'].inv')].join(' | '));}
    return {n,t,room:v('s.room'),prov:v('sv[0].prov'),freq:v('sv[0].freq'),school:v('s.school'),grade:v('s.grade'),enroll:v('s.enroll'),prior:v('s.prior')};});
  /* 1 the Schedule */
  const r1=await read(sPng);
  ok('1a the Schedule\'s teachers (the dropped therapy class left out), each with their role and their classes',r1.team.length===5&&
    /^Dana Whitfield \| Classroom teacher \| Homeroom, Access Lang Art - 2, Access Math Grade 2, daily, room 02104, since 08\/10\/2026$/.test(r1.team[0])&&
    /^Owen Marsh \| Other \| Art E - Grade 02, daily, room 01121/.test(r1.team[1])&&/^Lena Ortega \| Other \| PE GR 2, daily/.test(r1.team[2])&&/^Iris Calloway \| Other \| Music E - Grade 02, daily/.test(r1.team[3])&&
    /^Grace Holloway \| Speech-language pathologist \| Lang Thrpy: PK-5, Tue, room 01101N, (since|from) 10\/16\/2026$/.test(r1.team[4])&&!r1.team.some(x=>/Paula Brennan/.test(x)),r1);
  ok('1b the homeroom for Classroom / teacher, and no heading of the table read as a detail',JSON.stringify(r1.fields)==='["Classroom / teacher=Room 02104, Dana Whitfield"]'&&/5 teachers/.test(r1.found),r1);
  /* 2 Place */
  const t1=await place();const d1=await dm();
  ok('2a Place puts the five into Form DM-1\'s Team and Providers, school-based, and the homeroom into Classroom / teacher',d1.t.length===5&&d1.t[0]==='Classroom teacher | Dana Whitfield | Yes | Homeroom, Access Lang Art - 2, Access Math Grade 2, daily, room 02104, since 08/10/2026'&&d1.t[4].indexOf('Speech-language pathologist | Grace Holloway | Yes |')===0&&d1.room==='Room 02104, Dana Whitfield',d1);
  ok('2b the speech-language pathologist is also the provider on Related Services, weekly on Tuesdays',d1.prov==='Grace Holloway'&&d1.freq==='Weekly (Tue)',d1);
  ok('2c the workstation says so',/5 team members added in Form DM-1/.test(t1)&&/1 related service given a provider/.test(t1),t1);
  await read(sPng);const t2=await place();const d2=await dm();
  ok('2d read and placed again, the same teachers complete their rows: none added',d2.t.length===5&&/5 team members completed/.test(t2),{t2,n:d2.t.length});
  /* 3 the Enrollment */
  const r3=await read(ePng);
  const want=['School=Royal Palm School','Grade=2','Enrolled=2026-08-10','Previous school=Seagrape Elementary (01/28/2026–05/11/2026); Palm Grove Elementary (08/14/2024–01/27/2026); Coral Point K-8 (08/10/2023–05/30/2024)'];
  ok('3a the Enrollment: the school now, its grade and date, and the schools before (no summer school, temporary assignment or heading)',want.every(w=>r3.fields.includes(w))&&r3.fields.filter(f=>!/^(Student|Student ID)=/.test(f)).length===4,r3);
  await place();const d3=await dm();const bar=await page.evaluate(()=>({site:$('#pSite').value,grade:$('#pGrade').value}));
  ok('3b placed: Form DM-1\'s school, grade, date enrolled and previous schools, and the bar\'s school and grade',d3.school==='Royal Palm School'&&d3.grade==='2'&&d3.enroll==='2026-08-10'&&/^Seagrape Elementary .*Coral Point K-8/.test(d3.prior)&&bar.site==='Royal Palm School'&&bar.grade==='2',{d3,bar});
  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
