/* v21.85 the shell: the caseload backup locked with a passphrase, forgetting students not saved for weeks, removing all
   student data from this iPad, the start screen's caseload, Today's count, students in Find, keeping a case on this iPad to
   switch (and saving its file later), side by side ticking the form viewed before, the caseload's deadlines as a calendar
   file, the restraint and seclusion report, what changed since the last save, the IEP meeting packet.
   Simulated students only (Mateo Rivera 4471823; SIMULATED – Sample Student). usage: node qa/v2185-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900},acceptDownloads:true,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const D={m40:iso(-40),m20:iso(-20),m10:iso(-10),m5:iso(-5),m2:iso(-2),m1:iso(-1),p3:iso(3),p10:iso(10),p30:iso(30)};
  await page.evaluate(async D=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.__alerts=[];window.alert=m=>{window.__alerts.push(String(m));};window.__pick='';window.__choose=[];wsUI.choose=async(t)=>{window.__choose.push(t);return window.__pick;};
    window.__prompts=[];wsUI.prompt=async(t)=>{window.__prompts.push(t);return window.__pw.shift();};
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.caseload.expire','nbh.caseload.backup'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const mk=(p,facts,saved,extra)=>Object.assign({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:'Royal Palm School',grade:'',bcba:'',saved,sum:{items:[{k:'Overdue',t:'A notice is overdue',open:'CR-1'}],lastData:'',forms:1},
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}},facts})},extra||{});
    const fM={src:{},review:{next:D.p10,exit:{next:D.p30}},records:{iep:D.p30},crisis:{deadlines:[{what:'Parent notified',due:D.m1,done:false,event:D.m2},{what:'Written report',due:D.p3,done:true,event:D.m2}],restraints:{semester:2,last:D.m2}},
      data:{incidentList:[{date:D.m2,time:'10:15',beh:'Aggression',hold:'restraint',id:'i1'},{date:D.m10,beh:'Elopement',hold:''}]}};
    await clTx('readwrite',st=>st.put(mk({client:'Mateo Rivera',sid:'4471823'},fM,new Date().toISOString())));
    await clTx('readwrite',st=>st.put(mk({client:'SIMULATED – Sample Student',sid:'SIM-000'},{src:{},review:{next:D.p3}},new Date(Date.now()-40*864e5).toISOString())));
    await clTx('readwrite',st=>st.put(mk({client:'SIMULATED – Old Kept',sid:'SIM-OLD'},{src:{}},new Date(Date.now()-60*864e5).toISOString(),{unfiled:true})));},D);
  /* 1. the start screen */
  await page.evaluate(()=>paintBlank());await sleep(500);
  const bl=await page.evaluate(()=>{const x=document.getElementById('blankCl');return {vis:!!x&&!x.hidden&&x.offsetParent!==null,stu:[...document.querySelectorAll('#blankCl .cl-card .cl-nm')].map(b=>b.textContent),items:document.querySelectorAll('#blankCl .td-list li').length,btns:!!document.getElementById('blNew')&&!!document.getElementById('blRead')};});
  ok('1 with no case open, the start screen shows the caseload: the students, what needs you, New student and Read a document',bl.vis&&bl.stu.includes('Mateo Rivera')&&bl.items>=1&&bl.btns,bl);
  /* 2. Find a form or command finds a student */
  await page.evaluate(()=>palOpen());await sleep(400);await page.fill('#palIn','Mat');await page.evaluate(()=>palDraw());await sleep(200);
  const pal=await page.evaluate(()=>[...document.querySelectorAll('#palRes .rnm')].map(x=>x.textContent).slice(0,3));
  ok('2 Find: "Mat" offers Open Mateo Rivera’s case first',/Open Mateo Rivera’s case/.test(pal[0]||''),pal);
  await page.evaluate(()=>palClose());
  /* 3. forgetting students not saved for 4 weeks (never one not yet in a file) */
  await page.evaluate(()=>{localStorage.setItem('nbh.caseload.expire','4');});await page.evaluate(()=>caseloadOpen());await sleep(900);
  const ex=await page.evaluate(async()=>(await clList()).map(r=>r.client));
  ok('3 forget after 4 weeks: the student saved 40 days ago goes, the one kept here and not in a file stays',ex.includes('Mateo Rivera')&&!ex.includes('SIMULATED – Sample Student')&&ex.includes('SIMULATED – Old Kept'),ex);
  const unf=await page.evaluate(()=>{const n=document.querySelector('#dlgBody .cl-note');return {txt:n?n.textContent:'',btn:!!document.querySelector('[data-clfile]'),cal:!!document.getElementById('clCal'),restr:!!document.getElementById('clRestr'),rm:!!document.getElementById('clRemoveAll'),sel:(document.getElementById('clExpire')||{}).value};});
  ok('3b Caseload lists the student kept here not yet in a file with Save the file; the calendar, the report and Remove all are there',/not yet in a file/.test(unf.txt)&&unf.btn&&unf.cal&&unf.restr&&unf.rm&&unf.sel==='4',unf);
  await page.evaluate(()=>{localStorage.removeItem('nbh.caseload.expire');});
  const [fd]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.evaluate(()=>document.querySelector('[data-clfile]').click())]);await sleep(800);
  const fsaved=await page.evaluate(async()=>(await clList()).find(r=>r.client==='SIMULATED – Old Kept').unfiled);
  ok('3c Save the file writes that student’s case file and they are no longer "not in a file"',/^CASE_SIMULATED_Old_Kept_\d{4}-\d\d-\d\d\.json$/.test(fd.suggestedFilename())&&fsaved===false,{name:fd.suggestedFilename(),fsaved});
  /* 4. the calendar file */
  const [cd]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.evaluate(()=>clCalendar())]);const ics=fs.readFileSync(await cd.path(),'utf8');
  ok('4 deadlines to the Calendar: an .ics with each deadline, initials only (no names), stable ids',/BEGIN:VCALENDAR/.test(ics)&&/SUMMARY:M\. R\.: Plan review \(Form PR-1\)/.test(ics)&&/Annual IEP review/.test(ics)&&/Parent notified/.test(ics)&&!/Mateo|Rivera|4471823/.test(ics)&&/UID:[a-z0-9]+-\d{8}@nbh-workstation/.test(ics),ics.slice(0,600));
  /* 5. the restraint report */
  await page.evaluate(()=>clRestraintOpen());await sleep(500);
  const rr=await page.evaluate(()=>({rows:[...document.querySelectorAll('#dlgBody .cl-tbl tr')].slice(1).map(tr=>tr.textContent),txt:document.getElementById('dlgBody').textContent}));
  ok('5 the restraint and seclusion report: the restraint with its notices (1 of 2 done, 1 overdue) and the semester count',rr.rows.length===1&&/Mateo Rivera/.test(rr.rows[0])&&/restraint/.test(rr.rows[0])&&/1 of 2/.test(rr.rows[0])&&/This semester: Mateo Rivera 2/.test(rr.txt),rr);
  const [rd]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.evaluate(()=>document.getElementById('clRestrCsv').click())]);const csv=fs.readFileSync(await rd.path(),'utf8');
  ok('5b the report as a spreadsheet',/Student,Date,Time,Kind/.test(csv)&&/"Mateo Rivera","[^"]+","10:15","restraint","Aggression","2","1","1"/.test(csv),csv.slice(0,300));
  /* 6. the backup locked with a passphrase, and its restore */
  await page.evaluate(()=>{window.__pw=['pass-1234','pass-1234'];});
  const [bd]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.evaluate(()=>clBackup())]);const bj=JSON.parse(fs.readFileSync(await bd.path(),'utf8'));
  ok('6 Back up with a passphrase: a locked file, nothing readable in it',bj.form==='CASELOAD-LOCKED'&&bj.data&&!/Mateo|4471823/.test(JSON.stringify(bj))&&/_locked\.json$/.test(bd.suggestedFilename()),{form:bj.form,name:bd.suggestedFilename()});
  await page.evaluate(async()=>{const L=await clList();for(const r of L)await clTx('readwrite',st=>st.delete(r.key));});
  const bp=await bd.path();
  await page.evaluate(()=>{window.__pw=['wrong'];window.__alerts=[];});await page.setInputFiles('#clFile',bp);await sleep(3000);
  const wrong=await page.evaluate(async()=>({a:window.__alerts.slice(),n:(await clList()).length}));
  await page.evaluate(()=>{window.__pw=['pass-1234'];});await page.setInputFiles('#clFile',bp);await sleep(3500);
  const back=await page.evaluate(async()=>(await clList()).map(r=>r.client));
  ok('6b Restore: the wrong passphrase opens nothing; the right one brings the students back',wrong.n===0&&wrong.a.some(x=>/does not open/.test(x))&&back.includes('Mateo Rivera'),{wrong,back});
  /* 7. Today's count, red for a restraint notice overdue */
  await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera');setFacts(JSON.parse(r.text).facts,false);paintBadge();});
  const bdg=await page.evaluate(()=>{const s=document.querySelector('#todayBtn .tbadge');return {n:s&&s.textContent,hid:s&&s.hidden,red:s&&s.classList.contains('red'),lbl:document.getElementById('todayBtn').getAttribute('aria-label')};});
  ok('7 Today’s button carries its count, red for an overdue restraint notice',bdg&&+bdg.n>=1&&!bdg.hid&&bdg.red&&/need/.test(bdg.lbl),bdg);
  await page.evaluate(()=>setFacts(null,false));
  /* 8. keep the case on this iPad and switch; what changed; side by side */
  const key=await page.evaluate(async()=>(await clList()).find(x=>x.client==='Mateo Rivera').key);
  await page.evaluate(k=>caseloadGo(k,''),key);await sleep(2500);
  await page.evaluate(()=>openForm('CN-1'));await page.waitForFunction(()=>!!state.status['CN-1'],null,{timeout:30000});await sleep(1200);
  await page.evaluate(()=>{const w=state.frames['CN-1'].contentWindow;const i=[...w.document.querySelectorAll('textarea')].find(x=>!x.readOnly&&!x.disabled&&x.offsetParent!==null)||[...w.document.querySelectorAll('input[type="text"],input:not([type])')].find(x=>!x.readOnly&&!x.disabled&&x.offsetParent!==null&&!/^m\./.test(x.name||'')&&!/client|student|name/i.test(x.id+x.name));i.value='SIMULATED note '+Date.now();i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(5000);
  await page.evaluate(()=>changesOpen());await sleep(1500);
  const ch=await page.evaluate(()=>[...document.querySelectorAll('#dlgBody .td-list li')].map(li=>li.textContent));
  ok('8a What changed since the last save: Form CN-1 added and changed against the copy on this iPad',ch.some(t=>/Form CN-1/.test(t)),ch);
  await page.evaluate(()=>openForm('IC-1'));await page.waitForFunction(()=>!!state.status['IC-1'],null,{timeout:30000});await sleep(800);
  await page.evaluate(()=>document.getElementById('splitBtn').click());await sleep(400);
  const sb=await page.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .sb-row input:checked')].map(x=>x.value);try{document.getElementById('dlg').close();}catch(e){}return c;});
  ok('8b Side by side ticks the form on screen and the one viewed before it',sb.length===2&&sb.includes('IC-1')&&sb.includes('CN-1'),sb);
  await page.evaluate(async()=>{const p={client:'SIMULATED – Next One',sid:'SIM-NXT'};await clTx('readwrite',st=>st.put({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,saved:new Date().toISOString(),sum:{items:[]},text:JSON.stringify({form:'CASE',packet:p,forms:{'IC-1':{title:'IC',snap:{total:1,data:{},own:''}}}})}));});
  const other=await page.evaluate(()=>clKey({client:'SIMULATED – Next One',sid:'SIM-NXT'}));
  await page.evaluate(()=>{window.__pick='keep';window.__choose=[];});
  await page.evaluate(k=>caseloadGo(k,''),other);await sleep(4000);
  const sw=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera');return {asked:window.__choose.slice(),client:$('#pClient').value,unf:r.unfiled,cn:!!JSON.parse(r.text).forms['CN-1']};});
  ok('8c switching with work not in a file: "Keep it on this iPad and switch" keeps the case (CN-1 with it) as not yet in a file, and the next student opens',sw.asked.length===1&&/Switch to Next One/.test(sw.asked[0])&&sw.client==='SIMULATED – Next One'&&sw.unf===true&&sw.cn,sw);
  /* 9. the IEP packet */
  const ip=await page.evaluate(()=>{setFacts({src:{},fn:{label:'escape from demands'},profile:{strengths:'Loves maps (simulated)'},data:{from:'2026-09-01',to:'2026-10-09',behaviors:[{name:'Aggression',unit:'per day',base:{mean:6.2,days:10},baseName:'Baseline',cur:{mean:1.8,days:12},curName:'Plan'}]},
      goals:{red:[{text:'Aggression to 1 or fewer a day for 4 weeks (simulated)'}],acq:[{text:'Asks for a break with the card 80% of opportunities (simulated)'}]},plan:{rep:'Ask for a break with the card',ant:['First-then board','Choice of task order'],respond:{target:'Calm, brief redirection'},adoption:{date:'2026-09-10',notice:'2026-09-11',start:'2026-09-15'}},
      crisis:{restraints:{semester:1,last:'2026-09-30'}}},false);const P=iepParts();return {P,html:iepHTML()};});
  ok('9 IEP packet: present levels from the data (baseline and now), the function, strengths; the goals; the plan with its adoption; safety',/Aggression: 6\.2 per day during Baseline \(10 days\), 1\.8 per day most recently \(Plan, 12 days\)/.test(ip.P.present)&&/escape from demands/.test(ip.P.present)&&ip.P.goals.length===2&&/Adopted by the team 2026-09-10, prior written notice 2026-09-11/.test(ip.P.plan)&&/1 restraint this semester/.test(ip.P.safety)&&/Present levels of behavior/.test(ip.html),ip.P);
  await page.evaluate(()=>iepOpen());await sleep(800);
  const ic=await page.evaluate(()=>({blocks:document.querySelectorAll('#dlgBody .iep-t').length,copy:document.querySelectorAll('#dlgBody [data-copy]').length,print:!!document.getElementById('iepPrint')}));
  ok('9b the packet dialog: each part with Copy, and Print',ic.blocks>=4&&ic.copy===ic.blocks&&ic.print,ic);
  /* 10. remove all */
  await page.evaluate(()=>{try{document.getElementById('dlg').close();}catch(e){}});
  await page.evaluate(()=>clRemoveAll());await sleep(1500);
  const gone=await page.evaluate(async()=>({cl:(await clList()).length,cp:(await nbhCopies.list()).length,tok:sessionStorage.getItem('nbh.google.tok')}));
  ok('10 Remove all student data from this iPad: the caseload and the safety copies are empty',gone.cl===0&&gone.cp===0&&!gone.tok,gone);
  ok('no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
