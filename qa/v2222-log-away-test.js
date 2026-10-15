/* v22.22 Log it now for a student who is not on screen (review F471). With one student's case open, the sheet lists every
   student kept on this device (the one on screen first); choosing another logs the incident into that student's Form DD-1
   as kept here, out of sight: the case on screen stays as it was (no switch, no question about its unsaved work), and the
   other student's kept copy carries the incident, on their Caseload card too. A kept case with no Form DD-1 yet opens, as
   before (qa/v2194-log-test.js). Simulated students only (Mateo Rivera 4471823; SIMULATED – Sample Student SIM-0002).
   usage: node qa/v2222-log-away-test.js */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const MARK='Pushed the chair over at the reading table';
(async()=>{const br=await chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on@nbh'].forEach(k=>localStorage.removeItem(k));}catch(e){}
    const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:40000});await sleep(1500);
  const fr=page.frames().find(f=>f.url().indexOf('Daily_Behavior')>=0);await fr.evaluate(()=>{nbhUI.confirm=async()=>true;});await loadSim(fr);await sleep(2500);
  /* the second student, kept on this device with a Form DD-1 (from the same simulated record) */
  await page.evaluate(async()=>{const sn=await grab('DD-1','snapshot',null,10000);const now=Date.now();
    const p={client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},saved=new Date(now-864e5).toISOString();
    const r={key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum:{items:[],forms:1},
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'DD-1':{title:'Daily Data',snap:sn.snap}},facts:{src:{}}})};
    await clTx('readwrite',st=>st.put(r));window.__B=r.key;});
  const before=await page.evaluate(()=>({sig:caseSig(),dirty:caseDirty()}));
  const n0=await fr.evaluate(()=>(S.incidents||[]).length);
  await page.evaluate(()=>logNowOpen());await sleep(900);
  const d=await page.evaluate(()=>({tag:$('#lnWho').tagName,opts:[...document.querySelectorAll('#lnWho option')].map(o=>o.textContent.trim())}));
  ok('1 with Mateo\'s case on screen the sheet lists every student kept here, Mateo first',d.tag==='SELECT'&&/^Mateo Rivera \(on screen\)$/.test(d.opts[0])&&d.opts.length===2&&/Sample Student$/.test(d.opts[1]),d);
  await page.evaluate(m=>{$('#lnWho').value=window.__B;$('#lnTime').value='11:15';$('#lnBeh').value='Property destruction';$('#lnWhat').value=m;$('#lnDid').value='Moved the group away, waited';$('#lnBy').value='Simulated BCBA';},MARK);
  const t0=Date.now();await page.click('#lnSave');
  await page.waitForFunction(()=>!$('#dlg').open,null,{timeout:60000}).catch(()=>{});await sleep(800);
  const after=await page.evaluate(async m=>{const r=(await clList()).find(x=>x.key===window.__B);return {client:packet().client,cur:state.cur,frames:Object.keys(state.frames),dlg:$('#dlg').open,
    inB:(r.text.split(m).length-1),saved:r.saved,read:r.read||'',toast:[...document.querySelectorAll('.ws-toast')].map(e=>e.textContent.trim()).join(' | ').slice(-400),host:!!document.querySelector('#clHost iframe'),busy:CLX.busy};},MARK);
  const n1=await fr.evaluate(()=>(S.incidents||[]).length);
  const sig=await page.evaluate(()=>({sig:caseSig(),dirty:caseDirty()}));
  ok('2 the incident went into the other student\'s Form DD-1 as kept on this device ('+Math.round((Date.now()-t0)/100)/10+' s)',after.inB>=1&&!after.dlg&&!after.host&&!after.busy,after);
  ok('3 the case on screen stayed: still Mateo, Form DD-1 open, its incidents and its saved state as they were',after.client==='Mateo Rivera'&&after.cur==='DD-1'&&n1===n0&&sig.sig===before.sig&&sig.dirty===before.dirty,{after,n0,n1,before,sig});
  ok('4 the workstation said whose Form DD-1 took it, and that the case on screen is not changed',/Logged on (SIMULATED – )?Sample Student’s Form DD-1: .*11:15 am/.test(after.toast)&&/case on screen is not changed/.test(after.toast),after.toast);
  /* opening that student's case shows the incident on their Form DD-1 */
  await page.evaluate(async()=>{const r=(await clList()).find(x=>x.key===window.__B);await openCaseText(r.text,null,{asked:true,quiet:true});openForm('DD-1');});
  await page.waitForFunction(()=>packet().client==='SIMULATED – Sample Student'&&!!state.frames['DD-1']&&!!state.status['DD-1']&&!state.pending['DD-1'],null,{timeout:40000}).catch(()=>{});await sleep(2000);
  const fr2=page.frames().find(f=>f.url().indexOf('Daily_Behavior')>=0);
  const inc=fr2?await fr2.evaluate(m=>{const i=(S.incidents||[]).find(x=>x.what===m)||null;return i&&{time:i.time,name:ddIncName(i),parent:i.parent,by:i.by};},MARK):null;
  ok('5 opened, that student\'s Form DD-1 holds the incident as logged',!!inc&&inc.time==='11:15'&&inc.name==='Property destruction'&&inc.parent==='no'&&inc.by==='Simulated BCBA',inc);
  ok('6 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
