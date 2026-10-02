/* v21.34 Task U: the recorders' state machines around the awaited question dialog, and the IN-1 role change
   (a select fires input then change: one question only). */
const {chromium,BASE,wire,sleep}=require('./lib');
let fails=0;const check=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++;};
const dlg=p=>p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return null;return {head:d.querySelector('#nbhUiH').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.className+':'+b.textContent)};});
const press=(p,sel)=>p.evaluate(s=>{const b=document.querySelector('#nbhUiDlg '+s);if(!b)throw new Error('no dialog button '+s);b.click();},sel);
const click=(p,sel)=>p.evaluate(s=>{const el=document.querySelector(s);if(!el)throw new Error('no '+s);el.click();},sel);
(async()=>{
 const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:1440,height:900}});
 async function open(file){const log=[];const page=await ctx.newPage();wire(page,log);page.removeAllListeners('dialog');const native=[];page.on('dialog',d=>{native.push(d.message());d.dismiss().catch(()=>{});});
   await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(600);return {page,log,native};}
 const errs=l=>l.filter(x=>x.type!=='warning');

 /* ---------- OB-1 live recorder ---------- */
 {console.log('\n=== OB-1 recorder');const {page,log,native}=await open('OB-1_Direct-Observation-Record_v2026-09.html');
  await click(page,'#simBtn');await sleep(100);await press(page,'.primary');await sleep(500);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="obs"]').click());await sleep(200);
  await click(page,'#obrStart');await sleep(300);
  check(await page.evaluate(()=>obRecorder.state())==='run','started: state run');
  await click(page,'#obrTapS');await sleep(50);
  /* End: the question opens; Space while it is open does not pause; Cancel keeps it running */
  await click(page,'#obrEnd');await sleep(150);
  let d=await dlg(page);check(!!d&&/^End the observation now\?$/.test(d.head)&&d.btns.some(b=>/^primary:End now/.test(b)),'End asks: '+JSON.stringify(d));
  await page.keyboard.press('1');await sleep(100);
  check(await page.evaluate(()=>obRecorder.state())==='run'&&await page.evaluate(()=>obRecorder.counts().s)===1,'the 1 key with the question open counts nothing (still 1 tap)');
  await press(page,'button:not(.primary):not(.danger)');await sleep(200);
  check(await page.evaluate(()=>obRecorder.state())==='run'&&!(await dlg(page)),'Cancel: still running');
  await click(page,'#obrEnd');await sleep(150);await press(page,'.primary');await sleep(300);
  check(await page.evaluate(()=>obRecorder.state())==='ended','End now: state ended');
  /* Save into observation 1, which already has a count: the Replace question, then the write */
  await page.evaluate(()=>{const s=document.querySelector('#obrInto');if(s){s.value='0';s.dispatchEvent(new Event('change'));}});await sleep(100);
  const c0=await page.evaluate(()=>state.obs[0].count);
  await click(page,'#obrSave');await sleep(200);
  d=await dlg(page);check(!!d&&/^Replace what observation 1 holds\?$/.test(d.head)&&d.btns.some(b=>/^danger:Replace/.test(b)),'Save over observation 1 asks: '+JSON.stringify(d));
  await press(page,'.danger');await sleep(400);
  check(await page.evaluate(()=>obRecorder.state())==='ready'&&await page.evaluate(()=>state.obs[0].count)==='1','saved: observation 1 count '+c0+' -> '+await page.evaluate(()=>state.obs[0].count)+', recorder ready');
  /* Discard */
  await click(page,'#obrStart');await sleep(200);await click(page,'#obrDiscard');await sleep(150);
  d=await dlg(page);check(!!d&&/^Discard this recording\?$/.test(d.head),'Discard asks: '+JSON.stringify(d&&d.head));
  await press(page,'button:not(.primary):not(.danger)');await sleep(100);check(await page.evaluate(()=>obRecorder.state())==='run','Cancel keeps recording');
  await click(page,'#obrDiscard');await sleep(150);await press(page,'.danger');await sleep(200);check(await page.evaluate(()=>obRecorder.state())==='ready','Discard: state ready');
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 /* ---------- EA-1 session runner ---------- */
 {console.log('\n=== EA-1 runner');const {page,log,native}=await open('EA-1_Experimental-Analysis-Protocol_v2026-09.html');
  await click(page,'#simBtn');await sleep(600);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="sessions"]').click());await sleep(200);
  await click(page,'#eaStart');await sleep(300);
  const st=await page.evaluate(()=>eaRunner.state());check(st==='run','started: '+st);
  await click(page,'#eaEnd');await sleep(150);
  let d=await dlg(page);check(!!d&&/^End this session now\?$/.test(d.head),'End early asks: '+JSON.stringify(d&&d.head));
  await page.keyboard.press('t');await sleep(50);
  await press(page,'button:not(.primary):not(.danger)');await sleep(150);check(await page.evaluate(()=>eaRunner.state())==='run'&&await page.evaluate(()=>eaRunner.count())===0,'Cancel keeps it running; the key with the question open recorded nothing');
  await click(page,'#eaEnd');await sleep(150);await press(page,'.primary');await sleep(300);check(await page.evaluate(()=>eaRunner.state())==='done','End now: done');
  await click(page,'#eaDiscard');await sleep(200);check(!(await dlg(page))&&await page.evaluate(()=>eaRunner.state())==='ready','Discard of a finished session asks nothing (as before) and resets');
  await click(page,'#eaStart');await sleep(200);await click(page,'#eaDiscard');await sleep(150);d=await dlg(page);check(!!d&&/^Discard this session\?$/.test(d.head)&&d.btns.some(b=>/^danger:Discard/.test(b)),'Discard of a running session asks: '+JSON.stringify(d));
  await press(page,'.danger');await sleep(200);check(await page.evaluate(()=>eaRunner.state())==='ready','discarded: ready');
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 /* ---------- MT-1 timer ---------- */
 {console.log('\n=== MT-1 timer');const {page,log,native}=await open('MT-1_Discontinuous-Measurement_v2026-09.html');
  await click(page,'#tmrStart');await sleep(300);check(await page.evaluate(()=>mtTimer.state())==='run','timer running');
  await click(page,'#tmrReset');await sleep(150);let d=await dlg(page);check(!!d&&/^Reset the timer to 0:00\?$/.test(d.head),'Reset asks: '+JSON.stringify(d&&d.head));
  await press(page,'button:not(.primary):not(.danger)');await sleep(100);check(await page.evaluate(()=>mtTimer.state())==='run','Cancel keeps it running');
  await click(page,'#tmrReset');await sleep(150);await press(page,'.primary');await sleep(200);check(await page.evaluate(()=>mtTimer.state())==='ready','Reset: ready');
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 /* ---------- RA-1 single-operant runner ---------- */
 {console.log('\n=== RA-1 runner');const {page,log,native}=await open('Reinforcer_Assessment_Protocol.html');
  await click(page,'#simBtn');await sleep(100);await press(page,'.primary');await sleep(500);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="so"]').click());await sleep(200);
  await click(page,'#ra-run-so-start');await sleep(300);const st=await page.evaluate(()=>raRunner.state('so'));check(st==='run','started: '+st);
  await click(page,'#ra-run-so-end');await sleep(150);let d=await dlg(page);check(!!d&&/^End the session now\?$/.test(d.head),'End asks: '+JSON.stringify(d&&d.head));
  await press(page,'button:not(.primary):not(.danger)');await sleep(100);check(await page.evaluate(()=>raRunner.state('so'))==='run','Cancel keeps it running');
  await click(page,'#ra-run-so-end');await sleep(150);await press(page,'.primary');await sleep(300);check(await page.evaluate(()=>raRunner.state('so'))!=='run','End now: '+await page.evaluate(()=>raRunner.state('so')));
  await click(page,'#ra-run-so-discard');await sleep(150);d=await dlg(page);check(!!d&&/^Discard this session\?$/.test(d.head),'Discard asks: '+JSON.stringify(d&&d.head));
  await press(page,'.danger');await sleep(200);check(await page.evaluate(()=>raRunner.state('so'))==='ready','discarded: ready');
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 /* ---------- TI-1 observation runner ---------- */
 {console.log('\n=== TI-1 runner');const {page,log,native}=await open('TI-1_Treatment-Integrity-Observation_v2026-09.html');
  await click(page,'#simBtn');await sleep(100);await press(page,'.primary');await sleep(500);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="sheet"]').click());await sleep(200);
  await click(page,'#tiRunOpen');await sleep(200);
  await page.evaluate(()=>{const c=document.querySelector('#tiRunCol');const o=[...c.options].find(x=>x.value!=='');c.value=o?o.value:'0';c.dispatchEvent(new Event('change'));const t=document.querySelector('#tiRun button[data-act="type"]');if(t)t.click();});await sleep(100);
  await click(page,'#tiRunStart');await sleep(300);
  const st=await page.evaluate(()=>tiRunner.state());check(st==='run','started: '+st);
  await click(page,'#tiRunDiscard');await sleep(150);let d=await dlg(page);check(!!d&&/^Discard this observation\?$/.test(d.head),'Discard asks: '+JSON.stringify(d&&d.head));
  await page.keyboard.press('c');await sleep(50);
  await press(page,'button:not(.primary):not(.danger)');await sleep(100);
  check(await page.evaluate(()=>tiRunner.state())==='run'&&await page.evaluate(()=>tiRunner.events().every(e=>!e.length)),'Cancel keeps it running; the C key with the question open coded nothing');
  await click(page,'#tiRunDiscard');await sleep(150);await press(page,'.danger');await sleep(200);check(await page.evaluate(()=>tiRunner.state())==='idle','discarded: idle');
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 /* ---------- IN-1 role change ---------- */
 {console.log('\n=== IN-1 role change');const {page,log,native}=await open('IN-1_Stakeholder-Interview-Record_v2026-09.html');
  await click(page,'#simBtn');await sleep(100);await press(page,'.primary');await sleep(500);
  const before=await page.evaluate(()=>({role:S.resp[0].role,ans:Object.keys(S.ans).filter(k=>k.startsWith('0_')).length}));
  let asks=0;await page.exposeFunction('__asked',()=>{asks++;});
  await page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg')||document.body;new MutationObserver(()=>{const x=document.querySelector('#nbhUiDlg');if(x&&x.open)window.__asked();}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['open']});});
  const pick=()=>page.evaluate(()=>{const s=document.querySelector('#respTbl select[data-r="0"][data-f="role"]');s.value='Student';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});
  await pick();await sleep(300);
  let d=await dlg(page);check(!!d&&/^Change respondent 1 from/.test(d.head)&&asks===1,'one question for the input and change events: '+JSON.stringify(d&&d.head)+' asked '+asks+'x');
  await press(page,'button:not(.primary):not(.danger)');await sleep(200);
  const after=await page.evaluate(()=>({role:S.resp[0].role,ans:Object.keys(S.ans).filter(k=>k.startsWith('0_')).length,sel:document.querySelector('#respTbl select[data-r="0"][data-f="role"]').value}));
  check(after.role===before.role&&after.sel===before.role&&after.ans===before.ans,'Cancel: role and answers kept '+JSON.stringify(after));
  await pick();await sleep(300);await press(page,'.danger');await sleep(300);
  const after2=await page.evaluate(()=>({role:S.resp[0].role,ans:Object.keys(S.ans).filter(k=>k.startsWith('0_')).length}));
  check(after2.role==='Student'&&after2.ans===0,'Change: role changed and the answers of the old set dropped '+JSON.stringify(after2));
  check(native.length===0&&errs(log).length===0,'no native dialog, no error '+JSON.stringify(errs(log)));await page.close();}

 await br.close();console.log('\n'+(fails?fails+' FAIL':'ALL OK'));process.exit(fails?1:0);
})();
