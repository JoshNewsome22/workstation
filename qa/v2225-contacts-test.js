/* v22.25 Read a document takes the student's contacts from a student information system: its Addresses & Contacts page
   (cards four to a row, headed "Address" with "Contacts at this Address", and "Contact #3" with a name, a phone table and
   the relationship at the foot) and its Edit Contact window (First Name, Last Name, Relationship, Email, Language, a Type /
   Number table). Before, a screenshot of either gave "Nothing recognisable", or took the contact's first and last name and
   language for the student's. Now:
   1. the recognizer's words are put back into their cards by place, so each card is read whole: 7 contacts with names,
      relationships (in Form DM-1's words, the record's own kept as "Listed as Cousin"), phones (a number broken over two
      lines of a narrow cell joined) and addresses;
   2. pasted text, card after card, reads the same; the Edit Contact window's details are the contact's, never the student's;
   3. the dialog lists the contacts to tick and correct; Place puts them into Form DM-1's contact cards, adding cards as
      needed (up to 10); a contact read again (the Edit Contact window) completes the card that has that name;
   4. a page for another student than the case on screen says so;
   5. the details read before (qa/doc-read-test.js) are as they were; no page errors.
   Simulated student and family only (Mateo Rivera 4471823; Rivera, Ana; 555 numbers).   usage: node qa/v2225-contacts-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
const OUT=__dirname+'/out/v2225/';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CARDS=`<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#fff}
.top{background:#eee;height:92px;display:flex;align-items:center;gap:18px;padding:0 10px}.stu{background:#2e5c99;color:#fff;padding:6px 14px;font-size:22px}
.stu small{display:block;font-size:13px;color:#cde}.ttl{font-size:26px}
.nav{background:#3a72b8;color:#fff;height:44px;display:flex;gap:30px;align-items:center;padding:0 14px;font-size:19px}
.tabs{display:flex;gap:18px;padding:14px 10px;font-size:18px}.tabs b{background:#ddd;padding:3px 6px}
h2{font-size:24px;font-weight:500;margin:10px 40px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 20px}
.card{border:1px solid #ccc;border-radius:4px;padding:12px 14px;font-size:15px;line-height:1.6;min-height:300px;position:relative}
.card h3{font-size:24px;font-weight:500;margin:0 0 6px}.card .k{font-weight:700;margin-top:8px}
table{border-collapse:collapse;width:100%;margin-top:6px}td{border:1px solid #ddd;padding:6px 10px}
.rel{position:absolute;bottom:12px;left:20px;font-size:22px}.lnk{border:1px solid #ddd;padding:6px 10px;color:#1a0dab;text-decoration:underline}
</style></head><body>
<div class="top"><div class="stu">Rivera, Mateo<small>4471823 - 03</small></div><div class="ttl">Student Info</div></div>
<div class="nav"><span>Search</span><span>Setup</span><span>Students</span><span>Users</span><span>Scheduling</span><span>Grades</span><span>Attendance</span></div>
<div class="tabs"><b>Demographic</b><span>Summary</span><span>Enrollment</span><span>Schedule</span><span>Grades</span><span>Absences</span></div>
<h2>Addresses &amp; Contacts</h2>
<div class="grid">
<div class="card"><h3>Address</h3>120 PALM GROVE RD<br>APT 4<br>WEST PALM BEACH, FL 33401<br>(561) 555-0142<div class="k">Contacts at this Address</div><div class="lnk">#1 - Rivera, Ana</div></div>
<div class="card"><h3>Address</h3>88 OCEAN BREEZE CIR<br>APT 12<br>RIVIERA BEACH, FL 33404<div class="k">Contacts at this Address</div><div class="lnk">#2 - Rivera, Luis</div></div>
<div class="card"><h3>Contact #3</h3>Ortiz, Carmen<br>(No Address)<div class="k">Contact Details:</div><table><tr><td>3: Cell Phone</td><td>(561) 555-0170</td></tr><tr><td>Contact's Priority</td><td>3</td></tr></table><div class="rel">Cousin</div></div>
<div class="card"><h3>Contact #4</h3>Perez, Rosa<br>(No Address)<div class="k">Contact Details:</div><table><tr><td>4: Cell Phone</td><td>(561) 555-0181</td></tr><tr><td>Contact's Priority</td><td>4</td></tr></table><div class="rel">Aunt</div></div>
<div class="card"><h3>Contact #5</h3>Rivera, Elena<br>(No Address)<div class="k">Contact Details:</div><table><tr><td>1: Cell Phone</td><td>(561) 555-0142</td></tr><tr><td>Contact's Priority</td><td>5</td></tr></table><div class="rel">Grandmother</div></div>
<div class="card"><h3>Contact #6</h3>Gomez, Pablo<br>(No Address)<div class="k">Contact Details:</div><table><tr><td>1: Cell Phone</td><td>(561) 555-0193</td></tr><tr><td>Contact's Priority</td><td>6</td></tr></table><div class="rel">Godfather</div></div>
<div class="card"><h3>Contact #7</h3>Diaz, Marta<br>(No Address)<div class="k">Contact Details:</div><table><tr><td>1: Cell Phone</td><td>(561) 555-0124</td></tr><tr><td>Contact's Priority</td><td>7</td></tr></table><div class="rel">Home Health Aide</div></div>
</div><h2 style="margin-top:30px">Linked Users <small style="font-size:16px;color:#777">The following users will be able to view data for this student</small></h2>
<p style="text-align:center">No Records Found</p></body></html>
`;
const EDIT=`<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:Lato,"Helvetica Neue",Arial,sans-serif;color:#333;background:#888}
.top{background:#bbb;height:80px;display:flex;align-items:center;gap:18px;padding:0 10px}.stu{background:#2e5c99;color:#fff;padding:6px 14px;font-size:20px}
.stu small{display:block;font-size:12px;color:#cde}
.dlg{position:absolute;left:120px;top:110px;width:760px;background:#fff;border-radius:4px;box-shadow:0 4px 20px #0006;font-size:16px}
.dlg h3{margin:0;padding:12px 18px;border-bottom:1px solid #ddd;font-weight:500;font-size:22px}
.body{padding:12px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
.f label{display:block;font-size:13px;color:#666;font-weight:700}.f div{border:1px solid #ccc;padding:5px 8px;min-height:20px}
table{border-collapse:collapse;width:calc(100% - 36px);margin:6px 18px 12px}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}
.chk{grid-column:1/3;display:flex;gap:26px}.btns{padding:10px 18px;border-top:1px solid #ddd;text-align:right}.btns span{border:1px solid #aaa;padding:5px 14px;margin-left:8px}
</style></head><body>
<div class="top"><div class="stu">Rivera, Mateo<small>4471823 - 03</small></div><div style="font-size:24px">Student Info</div></div>
<div class="dlg"><h3>Edit Contact</h3>
<div class="body">
<div class="f"><label>First Name</label><div>Ana</div></div><div class="f"><label>Last Name</label><div>Rivera</div></div>
<div class="f"><label>Relationship</label><div>Mother</div></div><div class="f"><label>Contact's Priority</label><div>1</div></div>
<div class="f"><label>Email</label><div>ana.rivera@example.com</div></div><div class="f"><label>Language</label><div>Spanish</div></div>
<div class="chk"><span>&#9745; Custody</span><span>&#9745; Emergency</span><span>&#9745; Lives With</span><span>&#9744; Pickup Restricted</span></div>
</div>
<table><tr><th>Type</th><th>Number</th></tr><tr><td>Cell Phone</td><td>(561) 555-0142</td></tr><tr><td>Work Phone</td><td>(561) 555-0177</td></tr></table>
<div class="btns"><span>Delete</span><span>Cancel</span><span>Save</span></div></div></body></html>
`;
const PASTE=`Rivera, Mateo
4471823 - 03
Addresses & Contacts
Address
120 PALM GROVE RD
APT 4
WEST PALM BEACH, FL 33401
(561) 555-0142
Contacts at this Address
#1 - Rivera, Ana
Contact #3
Ortiz, Carmen
(No Address)
Contact Details:
3: Cell Phone	(561) 555-0170
Contact's Priority	3
Cousin
Contact #5
Rivera, Elena
(No Address)
Contact Details:
1: Cell Phone	(561) 555-0142
Contact's Priority	5
Grandmother
Linked Users
No Records Found`;
const PASTE2=`Rivera, Mateo
4471823 - 03
Edit Contact
First Name
Ana
Last Name
Rivera
Relationship
Mother
Email
ana.rivera@example.com
Language
Spanish
Type	Number
Cell Phone	(561) 555-0142
Save`;
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const shot=async(html,file,h)=>{const p=await br.newPage({viewport:{width:1180,height:h},deviceScaleFactor:2});await p.setContent(html);await sleep(300);await p.screenshot({path:OUT+file});await p.close();return OUT+file;};
  const cardsPng=await shot(CARDS,'contacts.png',1100),editPng=await shot(EDIT,'edit.png',820);
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  /* 2 pasted text */
  const p1=await page.evaluate(([a,b])=>{const r=nbhDocRead.parse(a),q=nbhDocRead.parse(b);const c=x=>x.contacts.map(c=>[c.n,c.name,c.rel,c.phone,c.addr,c.note].join('|'));
    return {a:c(r),af:r.fields.map(f=>f.label+'='+f.value),b:c(q),bc:q.contacts[0],bf:q.fields.map(f=>f.label+'='+f.value)};},[PASTE,PASTE2]);
  ok('2a pasted card after card: the address card\'s contact with its address and phone, two contact cards with their phones and relationships; the student from the badge (v22.27: the grade with the ID)',
    JSON.stringify(p1.a)===JSON.stringify(['1|Ana Rivera||(561) 555-0142|120 PALM GROVE RD, APT 4, WEST PALM BEACH, FL 33401|','3|Carmen Ortiz|Other relative|(561) 555-0170||Listed as Cousin','5|Elena Rivera|Grandparent|(561) 555-0142||Listed as Grandmother'])&&p1.af.join()==='Student=Mateo Rivera,Student ID=4471823,Grade=3',p1);
  ok('2b the Edit Contact window, pasted: the contact (Ana Rivera, Mother, phone, email, language), and the student\'s details only from above it',
    p1.bc&&p1.bc.name==='Ana Rivera'&&p1.bc.rel==='Mother'&&p1.bc.phone==='(561) 555-0142'&&p1.bc.email==='ana.rivera@example.com'&&p1.bc.lang==='Spanish'&&!p1.bc.note&&p1.bf.join()==='Student=Mateo Rivera,Student ID=4471823,Grade=3',p1);
  /* 1 the screenshot of the cards */
  const read=async png=>{await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}drOpen();});await sleep(300);await page.setInputFiles('#drFile',png);
    const t=Date.now();while(Date.now()-t<150000&&!(await page.evaluate(()=>!!document.querySelector('#drOut .dr-found, #drOut .dr-err, #drOut .dr-none'))))await sleep(400);
    return page.evaluate(()=>({found:($('#drOut .dr-found')||{}).textContent||($('#drOut').textContent||'').slice(0,300),warn:($('#drOut .dr-warn')||{}).textContent||'',
      rows:[...document.querySelectorAll('#drOut .dr-ctbl tbody tr')].map(tr=>[...tr.querySelectorAll('[data-drcf]')].map(e=>e.dataset.drcf+'='+e.value).join('|')+(tr.querySelector('.dr-note')?'|'+tr.querySelector('.dr-note').textContent:''))}));};
  const t0=Date.now();const r1=await read(cardsPng);
  const want=['name=Ana Rivera|rel=|phone=(561) 555-0142|addr=120 PALM GROVE RD, APT 4, WEST PALM BEACH, FL 33401','name=Luis Rivera|rel=|phone=|addr=88 OCEAN BREEZE CIR, APT 12, RIVIERA BEACH, FL 33404',
    'name=Carmen Ortiz|rel=Other relative|phone=(561) 555-0170|addr=|Listed as Cousin','name=Rosa Perez|rel=Other relative|phone=(561) 555-0181|addr=|Listed as Aunt','name=Elena Rivera|rel=Grandparent|phone=(561) 555-0142|addr=|Listed as Grandmother',
    'name=Pablo Gomez|rel=Family friend|phone=(561) 555-0193|addr=|Listed as Godfather','name=Marta Diaz|rel=Other|phone=(561) 555-0124|addr=|Listed as Home Health Aide'];
  ok('1 a screenshot of the Addresses & Contacts page ('+Math.round((Date.now()-t0)/1000)+' s): the 7 contacts, each card read whole',JSON.stringify(r1.rows)===JSON.stringify(want)&&/^7 contacts read from contacts.png/.test(r1.found),r1);
  /* 3 Place: into Form DM-1's contact cards, cards added */
  await page.evaluate(()=>{const s=document.querySelector('#drOut [data-drcf="name"][data-i="6"]');s.value='Marta Diaz';const c=document.querySelector('#drOut [data-drc="1"]');c.checked=false;});
  await page.click('#drPlace');await page.waitForFunction(()=>!$('#dlg').open,null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const toast1=await page.evaluate(()=>[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).pop()||'');
  const fr=()=>page.frames().find(f=>/DM-1_/.test(f.url()));
  const dm=async()=>fr().evaluate(()=>{const n=+document.getElementById('nCon').value,o=[];for(let i=0;i<n;i++){const g=k=>(document.querySelector('[name="c['+i+'].'+k+'"]')||{}).value||'';o.push([g('name'),g('rel'),g('phone'),g('phone2'),g('email'),g('addr'),g('lang'),g('note')].join('|'));}return {n,o};});
  const d1=await dm();
  ok('3a Place puts the 6 ticked contacts into Form DM-1, adding cards past its 3 (the unticked one left out), relationships chosen from the list, the record\'s word in the note',
    d1.n===6&&d1.o[0]==='Ana Rivera||(561) 555-0142|||120 PALM GROVE RD, APT 4, WEST PALM BEACH, FL 33401||'&&d1.o[1]==='Carmen Ortiz|Other relative|(561) 555-0170|||||Listed as Cousin'&&d1.o[3]==='Elena Rivera|Grandparent|(561) 555-0142|||||Listed as Grandmother'&&d1.o[5]==='Marta Diaz|Other|(561) 555-0124|||||Listed as Home Health Aide'&&!d1.o.some(x=>/Luis/.test(x)),d1);
  ok('3b the workstation says so',/6 contacts added in Form DM-1/.test(toast1),toast1);
  /* 3c the Edit Contact window completes Ana's card */
  const r2=await read(editPng);
  ok('3c a screenshot of the Edit Contact window lists Ana Rivera, Mother, both phones, email; no student detail taken from the window',r2.rows.length===1&&/^name=Ana Rivera\|rel=Mother\|phone=\(561\) 555-0142\|phone2=\(561\) 555-0177\|addr=\|email=ana\.rivera@example\.com/.test(r2.rows[0])&&!/First name|Last name|Home language/.test(r2.found),r2);
  await page.click('#drPlace');await page.waitForFunction(()=>!$('#dlg').open,null,{timeout:30000}).catch(()=>{});await sleep(1200);
  const d2=await dm(),toast2=await page.evaluate(()=>[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).pop()||'');
  ok('3d placed, it completes the card that has her name (relationship, second phone, email, language), with no card added',d2.n===6&&d2.o[0]==='Ana Rivera|Mother|(561) 555-0142|(561) 555-0177|ana.rivera@example.com|120 PALM GROVE RD, APT 4, WEST PALM BEACH, FL 33401|Spanish|'&&/1 contact completed/.test(toast2),{d2,toast2});
  /* 4 another student's page */
  await page.evaluate(()=>{const e=$('#pClient');e.value='SIMULATED – Sample Student';e.dispatchEvent(new Event('input',{bubbles:true}));try{$('#dlg').close();}catch(x){}drOpen();});await sleep(300);
  const w=await page.evaluate(t=>{$('#drText').value=t;$('#drRead').click();return ($('#drOut .dr-warn')||{}).textContent||'';},PASTE);
  ok('4 a page for another student than the case on screen says so',/This page is for Mateo Rivera; the case on screen is SIMULATED – Sample Student/.test(w),w);
  ok('5 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
