/* v22.30 the RBT Supervision Log (Form RS-1) on the caseload as a staff record: Caseload has a Staff records section with
   Start the RBT Supervision Log; started with no student, its Save case keeps it on the caseload (and so in Google Drive
   when Drive is on) under "RBT Supervision Log", with no question about a student name; it is listed apart from the
   students and left out of the student count, the monthly caseload summary and Log it now; it opens again from its card;
   with a student on screen, Start does not open it into that student's case. Simulated people only.
   usage: node qa/v2230-staff-caseload-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  const quiet=()=>page.evaluate(()=>{window.__asked=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.alert=async t=>{window.__asked.push(String(t));};window.alert=()=>{};});
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);await quiet();
  const rsFrame=()=>page.frames().find(f=>/RS-1_/.test(f.url()));
  await page.evaluate(()=>caseloadOpen());await sleep(500);
  ok('1 Caseload has Staff records with Start the RBT Supervision Log',await page.evaluate(()=>/Staff records/.test(document.getElementById('dlgBody').innerText)&&!!document.getElementById('clStaffStart')));
  await page.click('#clStaffStart');await page.waitForFunction(()=>!!state.status['RS-1'],null,{timeout:40000});await sleep(1200);
  ok('2 Start opens Form RS-1 with no student on the bar',await page.evaluate(()=>state.cur==='RS-1'&&!packet().client&&!packet().sid));
  await rsFrame().evaluate(()=>{const e=document.querySelector('#sName');e.value='Jordan Lee (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(600);
  const dl=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{saveCase();});const d=await dl;await sleep(1500);
  const a1=await page.evaluate(()=>window.__asked.splice(0));
  ok('3 Save case asks nothing about a student name; the file is named after the record',!a1.some(t=>/student name/.test(t))&&/RBT_Supervision_Log/.test(d.suggestedFilename()),{a1,name:d.suggestedFilename()});
  const r1=await page.evaluate(async()=>{const L=await clList()||[];return L.map(r=>({client:r.client,sid:r.sid,staff:isStaffRec(r),rs:/Jordan Lee \(simulated\)/.test(r.text)}));});
  ok('4 the caseload keeps it as "RBT Supervision Log", a staff record, with RS-1’s work',r1.length===1&&r1[0].client==='RBT Supervision Log'&&!r1[0].sid&&r1[0].staff&&r1[0].rs,r1);
  /* a student's case beside it */
  await page.reload();await sleep(1400);await quiet();
  await page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:40000});await sleep(800);
  const dl2=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{saveCase();});await dl2;await sleep(1500);
  await page.evaluate(()=>caseloadOpen());await sleep(600);
  const v=await page.evaluate(()=>{const b=document.getElementById('dlgBody'),t=b.innerText,i=t.indexOf('Staff records');return {lead:b.querySelector('.hp-lead').textContent,staffCard:i>=0&&/RBT Supervision Log/.test(t.slice(i)),start:!!document.getElementById('clStaffStart')};});
  ok('5 Caseload: 1 student (the staff record not counted), the staff card under Staff records, no Start button now',/^1 student /.test(v.lead)&&v.staffCard&&!v.start,v);
  const cm=await page.evaluate(async()=>(await cmRows(new Date().toISOString().slice(0,7))).length);
  ok('6 the monthly caseload summary counts the student only',cm===1,cm);
  await page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
  await page.evaluate(()=>{state.staffAsked=true;});await page.evaluate(()=>staffStart());await sleep(400);
  ok('7 with a student on screen, the staff record opens by switching (Mateo saved), not into his case',await page.waitForFunction(()=>state.cur==='RS-1'&&!packet().client,null,{timeout:40000}).then(()=>true).catch(()=>false));
  await sleep(1500);
  ok('8 opened from the caseload, RS-1 holds the RBT entered before',await rsFrame().evaluate(()=>R.some(r=>r.setup.rbt_name==='Jordan Lee (simulated)')));
  ok('9 the case on screen is the staff record’s caseload entry',await page.evaluate(async()=>{const L=await clList()||[];return L.some(r=>isStaffRec(r)&&r.key===clKey(packet()));}));
  /* Start with a student typed on the bar and no staff record kept: refused */
  await page.evaluate(async()=>{const L=await clList()||[];for(const r of L)if(isStaffRec(r))await clTx('readwrite',st=>st.delete(r.key));});
  await page.reload();await sleep(1400);await quiet();
  await page.evaluate(()=>{const e=document.querySelector('#pClient');e.value='Mateo Rivera';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.evaluate(()=>staffStart());await sleep(500);
  const a3=await page.evaluate(()=>window.__asked.splice(0));
  ok('10 Start with a student on the bar asks to close the case first and opens nothing',a3.some(t=>/Close the case on screen first/.test(t))&&await page.evaluate(()=>!state.frames['RS-1']),a3);
  await page.evaluate(()=>{try{localStorage.setItem('nbh.caseload.ini','1');}catch(e){}});
  ok('11 initials only: the staff record keeps its name',await page.evaluate(()=>clName({client:'RBT Supervision Log',sid:''})==='RBT Supervision Log'&&clName({client:'Mateo Rivera',sid:'4471823'})==='M. R.'));
  await page.evaluate(()=>{try{localStorage.removeItem('nbh.caseload.ini');}catch(e){}});
  ok('12 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
