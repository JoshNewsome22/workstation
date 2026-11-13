/* v26.17 a packet is never short of a form without a word. The packet asks each ticked form for its pages and waits 4
   seconds; a form that had not answered by then (a long log, a slow tablet, a busy machine) was left out silently. Now it
   is asked once more, alone, with a longer wait, and a form that still does not answer is named in a notice.
   Two forms of the simulated case (DM-1, FS-1); the first answer of Form DM-1 is held back, then every answer.
   Chromium; simulated student only.
   usage: node qa/v2617-packet-late-test.js      (WS_URL=http://127.0.0.1:PORT) */
const L=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const FORMS=['DM-1','FS-1'];
const frameOf=(page,file)=>page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);
(async()=>{const br=await L.chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const log=[];const page=await ctx.newPage();L.wire(page,log);
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1200);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');set('#pGrade','5');set('#pBcba','Jordan Ellis, M.A., BCBA (simulated)');});
  const files=await page.evaluate(ids=>ids.map(id=>ALL.find(f=>f[0]===id)[2]),FORMS);
  for(let i=0;i<FORMS.length;i++){const id=FORMS[i];await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000}).catch(()=>{});await L.sleep(600);
    const fr=frameOf(page,files[i]);if(!fr){console.log('no frame',id);continue;}await fr.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;});try{await L.loadSim(fr);}catch(e){}await L.sleep(1500);}
  await page.evaluate(()=>gatherFacts(true));await L.sleep(1200);
  /* the packet built with the answers of Form DM-1 held back `hold` times (Infinity: every time) */
  const build=hold=>page.evaluate(async a=>{const [ids,hold]=a;let doc='';const wo=window.open,g0=window.grab,t0=wsUI.toast;const said=[],asked=[];let held=0;
    window.open=()=>({document:{open(){},write(h){doc+=h;},close(){}},focus(){},print(){},close(){},closed:false});
    wsUI.toast=(t,o)=>{said.push(String(t));};
    window.grab=async function(id,verb,extra,ms,frame){if(verb==='collect'){asked.push([id,ms]);if(id==='DM-1'&&held<(hold===null?Infinity:hold)){held++;return null;}if(id==='DM-1'&&ms>6000)ms=6000;}return g0.call(this,id,verb,extra,ms,frame);};
    const t=Date.now();
    try{await masterRun(ALL.filter(f=>ids.includes(f[0])),{});}finally{window.open=wo;window.grab=g0;wsUI.toast=t0;}
    const i=doc.lastIndexOf('<!DOCTYPE html>');const html=i>=0?doc.slice(i):doc;
    return {secs:(html.match(/<section id="sec-[A-Z]+-\d+"/g)||[]).map(x=>x.replace(/^.*sec-/,'').replace('"','')),said,asked,ms:Date.now()-t,swapped:typeof g0==='function'};},[FORMS,hold===Infinity?null:hold]);

  const A=await build(0);
  ok('1 the packet as it is: both forms, each asked once with the 4 seconds, no notice',A.swapped&&A.secs.join()==='DM-1,FS-1'&&A.asked.length===2&&A.asked.every(x=>x[1]===4000)&&!A.said.some(t=>/Not in this packet/.test(t)),A);
  const B=await build(1);
  const again=B.asked.filter(x=>x[0]==='DM-1');
  ok('2 a form whose first answer did not come is asked once more, alone, with a longer wait, and is in the packet in its place; no notice',
    B.secs.join()==='DM-1,FS-1'&&again.length===2&&again[1][1]>=10000&&B.asked[B.asked.length-1][0]==='DM-1'&&!B.said.some(t=>/Not in this packet/.test(t)),B);
  const C=await build(Infinity);
  const note=C.said.filter(t=>/Not in this packet/.test(t));
  ok('3 a form that still does not answer is named: the packet is built with the rest and says which form it lacks',
    C.secs.join()==='FS-1'&&note.length===1&&/Not in this packet: Form DM-1 did not answer in time\. Build the packet again to include it\./.test(note[0])&&C.asked.filter(x=>x[0]==='DM-1').length===2,C);
  const errs=log.filter(l=>/pageerror|Uncaught/i.test(String(l)));
  ok('4 no page error',!errs.length,errs.slice(0,3));
  }catch(e){console.log('FAIL the test stopped: '+(e&&e.stack||e));fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
