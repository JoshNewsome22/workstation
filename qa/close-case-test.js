/* v21.45 Close case: the case is saved, then every form and the student's details are cleared for the next case.
   (a) two forms simulated and a name on the bar: Close case asks, saves (the CASE_*.json download), then clears;
   (b) a form opened afterwards is empty; (c) with nothing open, Close case clears without asking and without a file;
   (d) no page errors. Run: WS_URL=http://127.0.0.1:8262 node qa/close-case-test.js */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;
const check=(name,ok,note)=>{console.log((ok?'PASS':'FAIL')+' '+name+(ok||note===undefined?'':'  ['+String(note).slice(0,300)+']'));if(!ok)fails++;};
(async()=>{
  const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(800);
  /* what the shell says: confirms are recorded and answered yes, long notices resolve at once */
  await page.evaluate(()=>{window.__asked=[];window.__told=[];
    wsUI.confirm=async(t,o)=>{__asked.push({t:String(t),ok:o&&o.ok});return true;};
    wsUI.alert=async t=>{__told.push(String(t));};
    const toast=wsUI.toast;wsUI.toast=(t,o)=>{__told.push(String(t));return toast(t,o);};});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);
    const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const sim=async id=>{const f=await open(id);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(900);return f;};
  const filledOf=async f=>f.evaluate(()=>Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>{
    if(e.type==='checkbox'||e.type==='radio')return e.checked;if(e.type==='hidden'||e.type==='button'||e.type==='submit')return false;return String(e.value||'').trim()!=='';}).length);
  const btn=await page.$('#closeCase');
  check('the bar has a Close case button after Open case',!!btn&&await page.evaluate(()=>{const b=$('#closeCase');return b.previousElementSibling&&b.previousElementSibling.id==='openCase'&&b.textContent==='Close case'&&/Save this case, then clear every form/.test(b.title);}));

  /* the forms as they open fresh: a blank TK-1 already reports its default values, so "empty" is "as fresh" */
  const tb0=await open('TB-1'),tk0=await open('TK-1');await sleep(5000);
  const fresh=await page.evaluate(()=>JSON.parse(JSON.stringify({tb:state.status['TB-1'],tk:state.status['TK-1']})));
  const freshTK=await tk0.evaluate(()=>JSON.stringify({tg:S.tg,ch:S.ch,meta:S.meta}));
  check('fresh forms report a status',!!fresh.tb&&!!fresh.tk&&!fresh.tb.edited&&!fresh.tk.edited,JSON.stringify(fresh));
  /* (a) two forms simulated, a name typed */
  await tb0.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});
  await tk0.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(900);
  const tb=tb0,tk=tk0;
  await page.fill('#pClient','Close Test Student');await page.dispatchEvent('#pClient','input');await page.dispatchEvent('#pClient','change');
  await sleep(5500);   /* the status poll (4 s) brings the forms' counts: the case counts as dirty */
  const before=await page.evaluate(()=>({frames:Object.keys(state.frames),dirty:caseDirty(),dot:$('#saveQuick').classList.contains('dirty'),tbFilled:(state.status['TB-1']||{}).filled,tkFilled:(state.status['TK-1']||{}).filled,tbSig:(state.status['TB-1']||{}).sig,tkSig:(state.status['TK-1']||{}).sig}));
  check('a: TB-1 and TK-1 are open, simulated (their signatures changed), and the case is dirty (the Save case dot is on)',before.frames.length===2&&before.dirty&&before.dot&&before.tbSig!==fresh.tb.sig&&before.tkSig!==fresh.tk.sig,JSON.stringify(before));
  const dlP=page.waitForEvent('download',{timeout:30000}).catch(()=>null);
  await page.evaluate(()=>$('#closeCase').click());
  const dl=await dlP;
  check('a: Close case asks first, with "Save and close"',await page.evaluate(()=>__asked.some(a=>/^Close this case\?/.test(a.t)&&a.ok==='Save and close')),await page.evaluate(()=>JSON.stringify(__asked)));
  let body='';if(dl){const p=await dl.path().catch(()=>null);if(p)body=fs.readFileSync(p,'utf8');}
  let kase=null;try{kase=JSON.parse(body);}catch(e){}
  check('a: the case file is downloaded (CASE_*.json) with both forms and the student in it',!!dl&&/^CASE_Close_Test_Student_\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename())&&!!kase&&kase.form==='CASE'&&!!kase.forms['TB-1']&&!!kase.forms['TK-1']&&kase.packet.client==='Close Test Student',dl&&dl.suggestedFilename());
  await page.waitForFunction(()=>Object.keys(state.frames).length===0,null,{timeout:15000}).catch(()=>{});
  await sleep(600);
  const after=await page.evaluate(()=>({frames:Object.keys(state.frames),iframes:document.querySelectorAll('#frames iframe').length,client:$('#pClient').value,sid:$('#pSid').value,grade:$('#pGrade').value,site:$('#pSite').value,bcba:$('#pBcba').value,
    caseId:state.caseId,handle:state.caseHandle,lastSig:state.lastSig,savedAt:state.savedAt,split:state.split,cur:state.cur,status:Object.keys(state.status),dirty:caseDirty(),dot:$('#saveQuick').classList.contains('dirty'),
    hasForm:document.body.classList.contains('has-form'),blank:$('#blank').style.display,crumb:$('#crumbTitle').textContent,crumbId:$('#crumbId').textContent,facts:state.facts,due:state.due,who:$('#whoName').textContent,
    folded:document.body.classList.contains('bar-folded'),toast:__told.find(t=>/The case is closed and saved/.test(t))||'',
    guard:(()=>{const ev=new Event('beforeunload',{cancelable:true});window.dispatchEvent(ev);return ev.defaultPrevented;})()}));
  check('a: no form is left (state.frames empty, no iframe)',after.frames.length===0&&after.iframes===0&&after.cur===null&&after.status.length===0,JSON.stringify(after.frames));
  check('a: the student\'s details are cleared',after.client===''&&after.sid===''&&after.grade===''&&after.site===''&&after.bcba===''&&after.who==='No student loaded'&&!after.folded,JSON.stringify([after.client,after.who,after.folded]));
  check('a: state.caseId is null, no case handle, nothing saved-at, no split',after.caseId===null&&after.handle===null&&after.savedAt===null&&after.lastSig===''&&Array.isArray(after.split)&&after.split.length===0,JSON.stringify([after.caseId,after.handle,after.savedAt,after.lastSig,after.split]));
  check('a: caseDirty() is false and the Save case button has no dot',after.dirty===false&&after.dot===false,JSON.stringify([after.dirty,after.dot]));
  check('a: body has no has-form class, the blank page shows, the crumb says Nothing open',!after.hasForm&&after.blank===''&&after.crumb==='Nothing open'&&after.crumbId==='',JSON.stringify([after.hasForm,after.blank,after.crumb]));
  check('a: the case (facts) and what is due are cleared',after.facts===null&&Array.isArray(after.due)&&after.due.length===0,JSON.stringify([after.facts,after.due]));
  check('a: the beforeunload guard does not fire',after.guard===false,after.guard);
  check('a: the notice says the case is closed and saved',/^The case is closed and saved\. Start the next one: enter the student, then open forms\.$/.test(after.toast),after.toast);
  check('a: the Close case button is still there and enabled',await page.evaluate(()=>!!$('#closeCase')&&!$('#closeCase').disabled));

  /* (b) a form opened afterwards is empty */
  const tb2=await open('TB-1');await sleep(1500);
  const n2=await filledOf(tb2);const tbF=await filledOf(tb0).catch(()=>null);
  const b=await page.evaluate(()=>({frames:Object.keys(state.frames),hasForm:document.body.classList.contains('has-form'),cur:state.cur,crumb:$('#crumbTitle').textContent}));
  check('b: TB-1 opens again after Close case',b.frames.length===1&&b.frames[0]==='TB-1'&&b.hasForm&&b.cur==='TB-1',JSON.stringify(b));
  check('b: the reopened TB-1 is empty (its simulator is not loaded: only the fresh defaults)',n2===3&&tbF===null,'filled fields: '+n2);
  const tk2=await open('TK-1');await sleep(1500);
  const sTK=await tk2.evaluate(()=>JSON.stringify({tg:S.tg,ch:S.ch,meta:S.meta}));
  await sleep(5000);
  const b2=await page.evaluate(()=>JSON.parse(JSON.stringify({tb:state.status['TB-1'],tk:state.status['TK-1'],dirty:caseDirty()})));
  check('b: the reopened TK-1 is as fresh (its state and signature are the fresh ones, not the simulated ones)',sTK===freshTK&&b2.tk&&b2.tk.sig===fresh.tk.sig&&b2.tk.sig!==before.tkSig,JSON.stringify({tk:b2.tk,fresh:fresh.tk,same:sTK===freshTK}));
  check('b: the reopened TB-1 reports the fresh signature',b2.tb&&b2.tb.sig===fresh.tb.sig&&b2.tb.sig!==before.tbSig&&!b2.tb.edited,JSON.stringify(b2.tb));
  /* TK-1 counts as work on its own (58 default values), so take it out; a fresh TB-1 (3 defaults) is no work */
  await page.evaluate(()=>{openForm('TK-1',true);});await sleep(300);
  await page.evaluate(()=>{wsUI.confirm=async(t,o)=>{__asked.push({t:String(t),ok:o&&o.ok});return true;};});
  await page.evaluate(()=>$('#closeForm').click());await sleep(800);
  check('b: TK-1 closed by the form\'s own Close, TB-1 stays',await page.evaluate(()=>Object.keys(state.frames).join()==='TB-1'));
  /* an untouched form open and no name: Close case clears without asking and without a file */
  await page.evaluate(()=>{__asked.length=0;__told.length=0;});
  let dl3=null;page.once('download',d=>{dl3=d;});
  await page.evaluate(()=>$('#closeCase').click());
  await page.waitForFunction(()=>Object.keys(state.frames).length===0,null,{timeout:15000}).catch(()=>{});await sleep(1500);
  const c0=await page.evaluate(()=>({frames:Object.keys(state.frames),asked:__asked.length,told:__told.slice(),hasForm:document.body.classList.contains('has-form')}));
  check('b: Close case with an untouched form open closes it without asking and without a file',c0.frames.length===0&&c0.asked===0&&dl3===null&&!c0.hasForm,JSON.stringify(c0));

  /* (c) nothing open at all */
  await page.evaluate(()=>{__asked.length=0;__told.length=0;});
  let dl4=null;page.once('download',d=>{dl4=d;});
  await page.evaluate(()=>$('#closeCase').click());await sleep(1500);
  const c=await page.evaluate(()=>({frames:Object.keys(state.frames),client:$('#pClient').value,asked:__asked.length,told:__told.slice(),dirty:caseDirty(),dot:$('#saveQuick').classList.contains('dirty'),guard:(()=>{const ev=new Event('beforeunload',{cancelable:true});window.dispatchEvent(ev);return ev.defaultPrevented;})()}));
  check('c: with nothing open, Close case clears without a confirm and without a download',c.frames.length===0&&c.client===''&&c.asked===0&&dl4===null&&!c.dirty&&!c.dot&&!c.guard,JSON.stringify(c));
  check('c: and says so',c.told.some(t=>/Nothing was open|The case is closed/.test(t)),JSON.stringify(c.told));

  /* (e) a save that is backed out leaves everything as it was */
  const tb3=await sim('TB-1');await page.fill('#pClient','Kept Student');await page.dispatchEvent('#pClient','input');await sleep(5500);
  await page.evaluate(()=>{__asked.length=0;__told.length=0;window.__saveCase=saveCase;window.saveCase=async()=>false;});
  await page.evaluate(()=>$('#closeCase').click());await sleep(1500);
  const e=await page.evaluate(()=>({frames:Object.keys(state.frames),client:$('#pClient').value,asked:__asked.length,dirty:caseDirty(),told:__told.slice()}));
  check('e: when the save does not happen, nothing is closed and the shell says so',e.frames.length===1&&e.client==='Kept Student'&&e.asked===1&&e.dirty&&e.told.some(t=>/was not saved, so nothing was closed/.test(t)),JSON.stringify(e));
  await page.evaluate(()=>{window.saveCase=window.__saveCase;});
  /* and the confirm declined */
  await page.evaluate(()=>{__asked.length=0;wsUI.confirm=async(t,o)=>{__asked.push({t:String(t),ok:o&&o.ok});return false;};});
  let dl5=null;page.once('download',d=>{dl5=d;});
  await page.evaluate(()=>$('#closeCase').click());await sleep(1500);
  const e2=await page.evaluate(()=>({frames:Object.keys(state.frames),client:$('#pClient').value,asked:__asked.length}));
  check('e: when the question is answered No, nothing is saved or closed',e2.frames.length===1&&e2.client==='Kept Student'&&e2.asked===1&&dl5===null,JSON.stringify(e2));

  /* (d) page errors */
  const errs=log.filter(l=>l.type==='pageerror');
  check('d: no page errors',errs.length===0,JSON.stringify(errs.slice(0,5)));
  await br.close();
  console.log(fails?'FAIL '+fails+' check'+(fails===1?'':'s')+' failed':'PASS all checks');
  process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
