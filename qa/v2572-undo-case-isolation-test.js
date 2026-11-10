/* v25.72 (privacy) a form's kept Undo record never reaches another student. Simulated students only.
   The path (found by the forms-layer audit): a form's Undo keeps the form's whole file in sessionStorage for the page that
   comes back after a Clear all that loads the page again (nbh.undo.after|<path>|<form>, written as the page goes, read by
   the form's next load within 30 s). The key named the form only. A tap on a button Undo watches whose question stays open
   (Form TI-1's "Discard this observation? Nothing is written to the sheet.") kept the watch alive; the workstation's Save
   and close, or a switch from Caseload, then removed the form's frame, which wrote the first student's whole form file; and
   the same form opened for the next student offered "Discarded. Undo". Undo opened the first student's file in the second
   student's form, and Save case and the caseload copy took it.
   The first student is "Mateo Rivera" (ID 4471823, simulated); the second is "SIMULATED – Sample Student".
   U  Discard tapped in Form TI-1's recorder, the question left open, Close case (Save and close), then the next student and
      Form TI-1: no record is left in the tab, no Undo is offered, and nothing of the first student is in the second
      student's form file, case file, caseload copy or safety copy.
   W  the same with the next student opened from Caseload (Keep it on this iPad and switch).
   T  the same with only Form TI-1 closed first (its tab), then Save and close.
   P  the form's own rule: a record that was kept for another student, or in another case turn, is not offered (a record put
      in the tab by hand, as one that got past the workstation would be), and one a hidden frame finds is neither taken nor
      offered (the Caseload's own frames for Form DD-1 and for a form collecting replies).
   R  Remove all student data removes such a record.
   K  what Undo is for still works: a form on its own whose Clear all loads the page again (Form AD-1) offers Undo on the
      page that comes back and puts the record back. (Inside the workstation a form's own toolbar is not shown, so its
      Clear all cannot be tapped there.)
   usage: WS_URL=http://127.0.0.1:8172 node qa/v2572-undo-case-isolation-test.js [U W T P R K]   results in qa/out/v2572-undo-case-isolation/ */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const OUT=path.join(__dirname,'out','v2572-undo-case-isolation');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const A={client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const B={client:'SIMULATED – Sample Student'};
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/,/\bM\.\s?R\.(?![a-z])/];
const marks=t=>A_MARKS.filter(re=>re.test(String(t||''))).map(String);
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const errs=[];let br;
async function newPage(tag){
  const c=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,serviceWorkers:'block',acceptDownloads:true,userAgent:IPAD_UA});
  await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);
  await p.evaluate(async()=>{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));try{await window.nbhCopies.clear();}catch(e){}
    ['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  return {c,p};}
const frameOf=(p,id)=>p.frames().find(f=>f!==p.mainFrame()&&decodeURIComponent(f.url()).includes(FILE[id]));
async function setBar(p,o){await p.evaluate(o=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v||'';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',o.client);set('#pSid',o.sid);set('#pGrade',o.grade);set('#pSite',o.site);set('#pBcba',o.bcba);},o);await sleep(300);}
async function answerIn(fr){for(let i=0;i<3;i++){const o=await fr.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){d.querySelector('.u-f button:last-child').click();return true;}return false;}).catch(()=>false);if(!o)break;await sleep(900);}}
async function openForm(p,id,sim){await p.evaluate(id=>openForm(id),id);
  await p.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:60000});await sleep(1300);const fr=frameOf(p,id);
  if(sim&&fr){await L.loadSim(fr);await sleep(1200);await answerIn(fr);await sleep(600);}return fr;}
async function answer(p,titleRe,btnRe,ms){const t=Date.now();while(Date.now()-t<(ms||15000)){
  const r=await p.evaluate(([tr,br])=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;if(!new RegExp(tr).test(t))return null;
    const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(br).test(x.textContent));if(!b)return {t,none:[...document.querySelectorAll('#cfFoot button')].map(x=>x.textContent)};b.click();return {t};},[titleRe.source,btnRe.source]).catch(()=>null);
  if(r)return r;await sleep(60);}return null;}
async function closeBoxes(p){await p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open){const b=[...d.querySelectorAll('button')].find(x=>/^(OK|Close|Not now|It is in Files)$/.test(x.textContent.trim()));if(b)b.click();else d.close();}});}).catch(()=>{});}
async function download(p,click,tag){const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(click);const d=await dl;const f=path.join(OUT,tag+'-'+d.suggestedFilename());await d.saveAs(f);return f;}
/* the kept records in the tab */
const kept=p=>p.evaluate(()=>{const o=[];for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);if(/^nbh\.undo\.after\|/.test(k))o.push({key:k,text:sessionStorage.getItem(k)});}return o;});
const keptOf=async p=>(await kept(p)).map(k=>({key:k.key.replace(/^nbh\.undo\.after\|/,''),bytes:k.text.length,marks:marks(k.text)}));
/* a message with Undo, in the workstation's own messages or in the form's: looked for until ms have passed */
async function findUndo(p,frames,ms){const t=Date.now();while(Date.now()-t<ms){
  for(const tgt of [p].concat((frames||[]).filter(Boolean))){const r=await tgt.evaluate(()=>{const b=document.querySelector('button.nbh-undo,button.ws-undo-b');if(!b)return null;const t=b.closest('.ws-toast,.nbh-toast,[role=status],[role=alert]')||b.parentElement;
      return {label:b.getAttribute('aria-label')||b.textContent,text:(t.textContent||'').replace(/\s+/g,' ').trim().slice(0,120)};}).catch(()=>null);
    if(r)return {r,tgt};}
  await sleep(100);}return null;}

/* the first student with Form TI-1: its simulation under his own name and ID, a note that names him, an observation running in
   the recorder, and a real tap on the recorder's Discard, whose question ("Nothing is written to the sheet") stays open */
async function studentA(p){
  await setBar(p,A);const fr=await openForm(p,'TI-1',true);
  await fr.evaluate(A=>{const setI=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set,setT=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
    const put=(sel,v)=>{const e=document.querySelector(sel);if(!e)return;(e.tagName==='TEXTAREA'?setT:setI).call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    put('[data-m="client"]',A.client);put('[data-m="sid"]',A.sid);put('[data-m="notes"]','Mateo Rivera (ID 4471823) was observed during independent math. (simulated)');},A);
  await sleep(500);
  const own=await fr.evaluate(()=>window.nbhBridge.ownSave());
  ok('the first student’s Form TI-1 holds his name and ID (the test’s own footing)',marks(own).length>=3,marks(own));
  await fr.evaluate(()=>document.querySelector('#viewSeg button[data-view="sheet"]').click());await sleep(500);
  await fr.locator('#tiRunOpen').scrollIntoViewIfNeeded();await fr.locator('#tiRunOpen').click();await sleep(400);
  await fr.evaluate(()=>{const s=document.getElementById('tiRunCol');const o=[...s.options].find(o=>o.value!=='');if(o){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));}});
  await fr.locator('button[data-act="type"][data-v="Announced"]').click();await sleep(200);
  await fr.locator('#tiRunStart').click();await sleep(500);
  const codes=fr.locator('button[data-act="code"]');if(await codes.count()){await codes.first().click();await sleep(200);}
  await fr.locator('#tiRunDiscard').scrollIntoViewIfNeeded();await fr.locator('#tiRunDiscard').tap();await sleep(900);
  const q=await fr.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return d&&d.open?d.textContent.replace(/\s+/g,' ').trim().slice(0,120):'';});
  ok('Form TI-1 asks before it discards the observation, and the question is left open',/Discard this observation/.test(q),q);
  return fr;}
async function saveAndClose(p,tag){const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>$('#closeCase').click());
  await answer(p,/^Close this case/,/^Save and close/,15000);const d=await dl;const f=path.join(OUT,tag+'-A-close-'+d.suggestedFilename());await d.saveAs(f);
  await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
  await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});return f;}
/* the second student's Form TI-1: is Undo offered, and (Undo tapped if it is) what do the form, the case file, the caseload copy
   and the safety copy hold of the first student */
async function secondStudent(p,tag,fr){
  fr=fr||await openForm(p,'TI-1',false);
  const u=await findUndo(p,[fr],5000);
  ok(tag+': no Undo is offered in the second student’s Form TI-1',!u,u&&u.r);
  if(u){await u.tgt.locator('button.nbh-undo,button.ws-undo-b').first().tap().catch(()=>{});await sleep(1800);}
  const own=await fr.evaluate(()=>window.nbhBridge.ownSave()).catch(()=>'');
  ok(tag+': the second student’s Form TI-1 holds nothing of the first',!marks(own).length,{marks:marks(own),who:await fr.evaluate(()=>window.nbhBridge.who()).catch(()=>null)});
  await sleep(1500);
  const cf=await download(p,()=>$('#saveCase').click(),tag+'-B-case');const ct=fs.readFileSync(cf,'utf8');await sleep(600);await closeBoxes(p);
  ok(tag+': the second student’s case file holds nothing of the first',!marks(ct).length,{file:path.basename(cf),marks:marks(ct)});
  const cl=await p.evaluate(async()=>(await clList()||[]).map(r=>({client:r.client,text:r.text||'',sum:JSON.stringify(r.sum||'')})));
  const rowB=cl.find(r=>r.client===B.client);
  ok(tag+': the second student’s caseload copy holds nothing of the first',!!rowB&&!marks(rowB.text+rowB.sum).length,rowB?marks(rowB.text+rowB.sum):'no row');
  const cp=await p.evaluate(async()=>{try{state.auto.last=0;state.autoSig='';await autoSave(true);}catch(e){}const l=await window.nbhCopies.list();return l.map(r=>({student:r.student,text:JSON.stringify(r.forms||r)}));});
  const bad=cp.filter(r=>!/Mateo/.test(r.student||'')&&marks(r.text).length);
  ok(tag+': no safety copy of the second student holds anything of the first',!bad.length,bad.map(r=>({student:r.student,marks:marks(r.text)})));
  ok(tag+': no kept Undo record is in the tab at the end',!(await kept(p)).length,await keptOf(p));}

async function scenU(){console.log('\n== U: Discard tapped, the question left open, Save and close, the next student ==');const {c,p}=await newPage('U');
  await studentA(p);await saveAndClose(p,'U');
  ok('U: no kept Undo record is in the tab after the case is closed',!(await kept(p)).length,await keptOf(p));
  await setBar(p,B);await secondStudent(p,'U');await c.close();}
async function scenW(){console.log('\n== W: the same, the next student opened from Caseload ==');const {c,p}=await newPage('W');
  /* the second student is on the caseload first */
  await setBar(p,B);await openForm(p,'DM-1',true);await sleep(800);
  {const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>$('#closeCase').click());await answer(p,/^Close this case/,/^Save and close/,15000);await dl;await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
    await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});}
  await sleep(1500);
  await studentA(p);
  await p.evaluate(()=>caseloadOpen());await p.waitForFunction(()=>$('#dlg').open&&document.querySelector('#dlgBody .cl-card[data-clrow]'),null,{timeout:15000});await sleep(600);
  await p.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].find(c=>/Sample Student/.test(c.innerText));if(c)c.querySelector('.cl-card-acts button[data-clopen]').click();});
  await answer(p,/^Switch to/,/^Keep it on this|^Switch anyway|^Save first/,5000);
  const moved=await p.waitForFunction(c=>packet().client===c&&!state.restoring,B.client,{timeout:30000}).then(()=>true).catch(()=>false);await sleep(600);
  if(!ok('W: the second student is on the bar after the switch (the test’s own footing)',moved,await p.evaluate(()=>$('#pClient').value))){await c.close();return;}
  ok('W: no kept Undo record is in the tab after the switch',!(await kept(p)).length,await keptOf(p));
  await secondStudent(p,'W');await c.close();}
async function scenT(){console.log('\n== T: the same, Form TI-1 alone closed first, then Save and close ==');const {c,p}=await newPage('T');
  await studentA(p);
  await p.evaluate(()=>$('#closeForm').click());
  const q=await answer(p,/^Close Form TI-1/,/^Remove from the case/,8000);
  ok('T: Form TI-1 is closed with its question still open (the test’s own footing)',!!q&&await p.waitForFunction(()=>!state.frames['TI-1'],null,{timeout:8000}).then(()=>true).catch(()=>false),q);
  await sleep(300);
  /* a form closed in its own case may keep its record for that case; what matters is the next case */
  await openForm(p,'DM-1',false);await saveAndClose(p,'T');
  ok('T: no kept Undo record is in the tab after the case is closed',!(await kept(p)).length,await keptOf(p));
  await setBar(p,B);await secondStudent(p,'T');await c.close();}

/* a record as one that got past the workstation would be: the first student's Form TI-1 file, kept now */
const plant=(p,file,id,rec)=>p.evaluate(([path,id,rec])=>{const base=location.pathname.replace(/[^/]*$/,'');
  sessionStorage.setItem('nbh.undo.after|'+base+path+'|'+id,JSON.stringify(Object.assign({view:null,x:0,y:0,what:'Discarded.',at:Date.now()},rec)));},[file,id,rec]);
const turn=p=>p.evaluate(()=>sessionStorage.getItem('nbh.case.turn')||'');
async function scenP(){console.log('\n== P: the form’s own rule (a record put in the tab by hand) ==');const {c,p}=await newPage('P');
  /* the first student's Form TI-1 file */
  await setBar(p,A);let fr=await openForm(p,'TI-1',true);
  await fr.evaluate(A=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;[['[data-m="client"]',A.client],['[data-m="sid"]',A.sid]].forEach(([s,v])=>{const e=document.querySelector(s);if(e){set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}});},A);
  await sleep(400);const ownA=await fr.evaluate(()=>window.nbhBridge.ownSave());
  ok('P: the first student’s Form TI-1 file is in hand (the test’s own footing)',marks(ownA).length>=3,marks(ownA));
  await saveAndClose(p,'P');
  /* P1: the second student's case; a record of the first student's, kept in this very turn */
  await setBar(p,B);await openForm(p,'DM-1',false);
  await plant(p,FILE['TI-1'],'TI-1',{own:ownA,who:A.client,turn:await turn(p)});
  fr=await openForm(p,'TI-1',false);let u=await findUndo(p,[fr],4500);
  ok('P1: a record kept for another student is not offered to a form that names the second student',!u,u&&u.r);
  if(u){await u.tgt.locator('button.nbh-undo,button.ws-undo-b').first().tap().catch(()=>{});await sleep(1500);}
  let own=await fr.evaluate(()=>window.nbhBridge.ownSave()).catch(()=>'');
  ok('P1: the second student’s Form TI-1 holds nothing of the first',!marks(own).length,marks(own));
  /* P2: a record with no name on it, kept in another case turn */
  await p.evaluate(()=>$('#closeForm').click());await answer(p,/^Close Form TI-1/,/^Remove from the case|^Close/,6000);await p.waitForFunction(()=>!state.frames['TI-1'],null,{timeout:8000}).catch(()=>{});await sleep(300);
  await p.evaluate(()=>{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(/^nbh\.undo\.after\|/.test(k))sessionStorage.removeItem(k);}});
  await plant(p,FILE['TI-1'],'TI-1',{own:ownA,who:'',turn:'an-earlier-turn'});
  fr=await openForm(p,'TI-1',false);u=await findUndo(p,[fr],4500);
  ok('P2: a record kept in another case turn is not offered',!u,u&&u.r);
  if(u){await u.tgt.locator('button.nbh-undo,button.ws-undo-b').first().tap().catch(()=>{});await sleep(1500);}
  own=await fr.evaluate(()=>window.nbhBridge.ownSave()).catch(()=>'');
  ok('P2: the second student’s Form TI-1 holds nothing of the first',!marks(own).length,marks(own));
  /* P3, P4: the Caseload's hidden frames. A record for the form they load is neither taken nor offered */
  for(const [tag,id,make] of [['P3','DD-1','clFrame()'],['P4','CF-1','clFrameFor("CF-1")']]){
    await p.evaluate(()=>{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(/^nbh\.undo\.after\|/.test(k))sessionStorage.removeItem(k);}});
    await plant(p,FILE[id],id,{own:ownA,who:'',turn:await turn(p),what:'Form cleared.'});
    const made=await p.evaluate(async src=>{const fr=await eval(src);window.__t72=fr;return !!fr;},make);
    ok(tag+': the Caseload’s hidden frame for Form '+id+' loads (the test’s own footing)',made);
    const hid=p.frames().find(f=>f!==p.mainFrame()&&decodeURIComponent(f.url()).includes(FILE[id]));
    u=await findUndo(p,[hid],4000);
    ok(tag+': a hidden frame offers no Undo',!u,u&&u.r);
    const k=await keptOf(p);
    ok(tag+': a hidden frame does not take the record',k.length===1,k);
    await p.evaluate(()=>{try{if(window.__t72)window.__t72.remove();}catch(e){}window.__t72=null;});await sleep(200);}
  await c.close();}
async function scenR(){console.log('\n== R: Remove all student data removes a kept Undo record ==');const {c,p}=await newPage('R');
  await setBar(p,B);await openForm(p,'DM-1',true);await sleep(600);
  await plant(p,FILE['TI-1'],'TI-1',{own:'{"form":"TI-1","S":{"meta":{"client":"Mateo Rivera","sid":"4471823"}}}',who:A.client,turn:await turn(p)});
  ok('R: a kept record is in the tab (the test’s own footing)',(await kept(p)).length===1);
  p.evaluate(()=>clRemoveAll()).catch(()=>{});
  const a=await answer(p,/Remove every student/,/^Remove/,6000);
  for(let i=0;i<3;i++){const x=await answer(p,/./,/^Remove anyway|^Remove/,1500);if(!x)break;}
  await sleep(2500);
  ok('R: the question was asked and answered (the test’s own footing)',!!a,a);
  ok('R: Remove all student data removes the kept Undo record',!(await kept(p)).length,await keptOf(p));
  await c.close();}
async function scenK(){console.log('\n== K: Undo still works where it should (Form AD-1, whose Clear all loads the page again) ==');
  {const c=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});await c.addInitScript(()=>{window.print=function(){};});
    const p=await c.newPage();p.on('pageerror',e=>errs.push('K1: '+String(e.message||e).slice(0,240)));
    await p.goto(L.BASE+'/NBH-Workstation/'+FILE['AD-1']);await p.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000});await sleep(900);
    await p.locator('[name="s_name"]').first().fill(A.client);await p.locator('[name="s_name"]').first().press('Tab');await sleep(500);
    await p.locator('#nbhMoreBtn').click();await sleep(300);
    const nav=p.waitForNavigation({timeout:15000}).then(()=>true).catch(()=>false);
    await p.locator('#btnClear').click();
    ok('K1: Clear all goes ahead without a question and the page loads again',await nav);
    await p.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000});
    ok('K1: the page that comes back is clear',(await p.locator('[name="s_name"]').first().inputValue())==='');
    const u=await findUndo(p,[],5000);
    ok('K1: the page that comes back offers Undo',!!u&&/Undo/.test(u.r.label),u&&u.r);
    if(u){await p.locator('button.nbh-undo').first().click();await sleep(2000);}
    ok('K1: Undo puts the record back',(await p.locator('[name="s_name"]').first().inputValue())===A.client,await p.locator('[name="s_name"]').first().inputValue());
    ok('K1: the kept record is used up',!(await kept(p)).length);
    await c.close();}}

(async()=>{br=await L.chromium.launch();
  for(const [k,fn] of [['U',scenU],['W',scenW],['T',scenT],['P',scenP],['R',scenR],['K',scenK]]){
    if(!want(k))continue;try{await fn();}catch(e){ok(k+': the scenario ran to its end',false,String(e&&e.message||e).slice(0,400));}}
  ok('no page error',!errs.length,errs.slice(0,4));
  await br.close();
  console.log('\n'+(n-fails)+' of '+n+' checks passed');process.exit(fails?1:0);})();
