/* v21.81 the shell's fixes: a form that does not take its saved work keeps the file's copy; Caseload's Open for the student
   on screen, Save first / Switch anyway for another, and Open <form> for any form; the crumb's Close keeps a form's work in the
   case (Remove from the case is its own choice); the caseload copy keeps a form that did not answer Save case; no safety copy
   for a case saved and unchanged; the read of every linked sheet uses the open case's Form DD-1; at most eight forms loaded;
   master print leaves no form loaded behind; the file check loads four forms at a time.
   Simulated students only (Mateo Rivera 4471823; SIMULATED – Sample Student). usage: node qa/v2181-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900},acceptDownloads:true,serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  let block='';   /* 'restore' or 'snapshot': the TB-1 frame does not hear that message */
  await page.route(/TB-1_Target/,async route=>{const r=await route.fetch();let b=await r.text();
    if(block)b=b.replace('<head>','<head><script>addEventListener("message",e=>{if(e.data&&e.data.nbh==="'+block+'")e.stopImmediatePropagation();},true);</script>');
    route.fulfill({response:r,body:b});});
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};window.__choose=[];wsUI.choose=async(t,b)=>{window.__choose.push(t);return window.__pick||'';};
    try{['nbh.caseload.off','nbh.caseload.ini'].forEach(k=>localStorage.removeItem(k));}catch(e){}const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  const sim=async id=>page.evaluate(async id=>{openForm(id);const fr=state.frames[id];await new Promise(r=>{if(fr.dataset.loaded)r();fr.addEventListener('load',r,{once:true});setTimeout(r,20000);});
    const t=performance.now();while(!state.status[id]&&performance.now()-t<10000)await new Promise(r=>setTimeout(r,50));
    try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1800));}}catch(e){}
    await new Promise(r=>setTimeout(r,800));return (state.status[id]||{}).filled||0;},id);
  /* a case: Mateo with TB-1, CN-1 and DD-1 */
  await page.fill('#pClient','Mateo Rivera');await page.dispatchEvent('#pClient','input');await page.fill('#pSid','4471823');
  const f0={};for(const id of ['TB-1','CN-1','DD-1'])f0[id]=await sim(id);
  const fs=require('fs');
  const sv=async()=>{const dl=page.waitForEvent('download',{timeout:60000}).catch(()=>null);const s=await page.evaluate(()=>saveCase());const d=await dl;let j=null;if(d){try{j=JSON.parse(fs.readFileSync(await d.path(),'utf8'));}catch(e){}}return {s,j};};
  const s0=await sv();
  ok('setup: a case saved with three filled forms',s0.j&&Object.keys(s0.j.forms).length===3&&f0['TB-1']>20,{f0,keys:s0.j&&Object.keys(s0.j.forms)});
  const caseText=JSON.stringify(s0.j);
  /* 1. a form that does not take its saved work */
  await page.evaluate(()=>clearCase());block='restore';
  await page.evaluate(()=>{window.__typing=setInterval(()=>{state.lastInput=Date.now();},300);});
  await page.evaluate(t=>openCaseText(t,null),caseText);await sleep(1500);
  await page.evaluate(()=>openForm('TB-1'));await sleep(45000);
  const r1=await page.evaluate(()=>({pending:Object.keys(state.pending),stuck:!!(state.pending['TB-1']&&state.pending['TB-1'].stuck),dirty:caseDirty(),clean:caseClean()}));
  ok('1a TB-1 did not take its saved work (asked twice): the case keeps the file\'s copy (still waiting) and is not marked saved over it',r1.pending.includes('TB-1')&&r1.stuck,r1);
  const s1=await sv();
  ok('1b Save case then writes TB-1 as the file held it, not the empty form',s1.j&&JSON.stringify(s1.j.forms['TB-1'].snap)===JSON.stringify(s0.j.forms['TB-1'].snap),s1.j&&Object.keys(s1.j.forms));
  await page.evaluate(()=>clearInterval(window.__typing));block='';
  await page.evaluate(()=>clearCase());await sleep(500);
  /* 2. Caseload: Open for the student on screen; another student with unsaved work; Open <form> */
  await page.evaluate(t=>openCaseText(t,null),caseText);await sleep(2500);
  const key=await page.evaluate(async()=>clKey(packet()));
  await page.evaluate(()=>{window.__choose=[];});
  await page.evaluate(k=>caseloadGo(k,'TI-1'),key);await sleep(2500);
  const r2=await page.evaluate(()=>({cur:state.cur,asked:window.__choose.length,client:$('#pClient').value}));
  ok('2a Open TI-1 for the student on screen: no question, the case stays, TI-1 opens (not in the saved case)',r2.cur==='TI-1'&&r2.asked===0&&r2.client==='Mateo Rivera',r2);
  /* another student kept */
  await page.evaluate(async()=>{const d=JSON.parse(JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:{client:'SIMULATED – Sample Student',sid:'SIM-000'},forms:{}}));
    const p=d.packet;const rec={key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:'',grade:'',bcba:'',saved:d.saved,sum:{items:[],lastData:'',forms:0},text:JSON.stringify(Object.assign(d,{forms:{'CN-1':{title:'CN-1',snap:{total:1,data:{},own:''}}}}))};await clTx('readwrite',st=>st.put(rec));});
  await sim('CN-1');await page.evaluate(()=>{const w=state.frames['CN-1'].contentWindow;const i=[...w.document.querySelectorAll('textarea,input[type="text"],input:not([type])')].find(x=>!x.readOnly&&!x.disabled);i.value+=' edited';i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(5000);
  const other=await page.evaluate(()=>clKey({client:'SIMULATED – Sample Student',sid:'SIM-000'}));
  await page.evaluate(()=>{window.__choose=[];window.__pick='';});
  await page.evaluate(k=>caseloadGo(k,''),other);await sleep(1500);
  const r3=await page.evaluate(()=>({asked:window.__choose.slice(),client:$('#pClient').value}));
  ok('2b another student with work not saved: asked Save first / Switch anyway; Cancel leaves the case as it is',r3.asked.length===1&&/Switch to Sample Student/.test(r3.asked[0])&&r3.client==='Mateo Rivera',r3);
  await page.evaluate(()=>{window.__choose=[];window.__pick='switch';});
  await page.evaluate(k=>caseloadGo(k,''),other);await sleep(3000);
  const r4=await page.evaluate(()=>({client:$('#pClient').value}));
  ok('2c Switch anyway opens the other student',r4.client==='SIMULATED – Sample Student',r4);
  await page.evaluate(()=>clearCase());await sleep(500);
  /* 3. the crumb's Close keeps the form's work in the case */
  await page.evaluate(t=>openCaseText(t,null),caseText);await sleep(2000);
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!state.pending['DD-1']&&state.status['DD-1'],null,{timeout:30000});await sleep(1200);
  await page.evaluate(()=>{window.__choose=[];window.__pick='keep';});
  await page.evaluate(()=>$('#closeForm').click());await sleep(3000);
  const r5=await page.evaluate(()=>({asked:window.__choose.slice(),frames:Object.keys(state.frames),pending:Object.keys(state.pending),cur:state.cur}));
  const s5=await sv();
  ok('3a Close on a form with work asks Close / Remove from the case; Close puts it away and Save case still writes it',r5.asked.length===1&&!r5.frames.includes('DD-1')&&r5.pending.includes('DD-1')&&s5.j&&s5.j.forms['DD-1']&&JSON.stringify(s5.j.forms['DD-1'].snap.data)===JSON.stringify(s0.j.forms['DD-1'].snap.data),{r5,keys:s5.j&&Object.keys(s5.j.forms)});
  ok('3b after Close, the form viewed before it is shown, not an empty screen',!!r5.cur&&r5.cur!=='DD-1',r5);
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!state.pending['DD-1']&&state.status['DD-1'],null,{timeout:30000});await sleep(1000);
  await page.evaluate(()=>{window.__pick='remove';});await page.evaluate(()=>$('#closeForm').click());await sleep(1500);
  const s6=await sv();
  ok('3c Remove from the case leaves it out of the next Save case',s6.j&&!s6.j.forms['DD-1']&&s6.j.forms['TB-1'],s6.j&&Object.keys(s6.j.forms));
  await page.evaluate(()=>clearCase());await sleep(500);
  /* 4. the caseload copy keeps a form that did not answer Save case */
  await page.evaluate(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  await page.evaluate(t=>openCaseText(t,null),caseText);await sleep(2000);
  for(const id of ['TB-1','CN-1'])await page.evaluate(id=>{openForm(id);},id);await page.waitForFunction(()=>!state.pending['TB-1']&&!state.pending['CN-1']&&state.status['TB-1']&&state.status['CN-1'],null,{timeout:40000});
  await sv();await sleep(800);
  block='snapshot';await page.evaluate(()=>{const fr=state.frames['TB-1'];fr.contentWindow.location.reload();});await sleep(4000);
  await page.evaluate(()=>saveCase().catch(()=>{}));await sleep(30000);block='';
  const r7=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera');return r?Object.keys(JSON.parse(r.text).forms):null;});
  ok('4 a Save case with TB-1 not answering: the caseload copy keeps its earlier TB-1',r7&&r7.includes('TB-1')&&r7.includes('CN-1'),r7);
  await page.evaluate(()=>clearCase());await sleep(800);
  /* 5. no safety copy for a case saved and unchanged */
  await page.evaluate(t=>openCaseText(t,null),caseText);await sleep(2000);await page.evaluate(()=>openForm('CN-1'));await page.waitForFunction(()=>!state.pending['CN-1']&&state.status['CN-1'],null,{timeout:30000});await sleep(1500);
  await sv();await sleep(1000);
  const before=await page.evaluate(async()=>{const L=await nbhCopies.list();return (L||[]).filter(c=>c.kind==='shell').length;});
  await page.evaluate(async()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,3000));autoLast();delete document.visibilityState;});await sleep(1500);
  const after=await page.evaluate(async()=>{const L=await nbhCopies.list();return {n:(L||[]).filter(c=>c.kind==='shell').length,clean:caseClean()};});
  ok('5 saved and unchanged, the iPad leaving the page writes no safety copy (no "Unsaved work found" later)',after.clean&&after.n<=before,{before,after});
  await page.evaluate(()=>clearCase());await sleep(800);
  /* 6. the refresh uses the open case's DD-1 for the student on screen */
  const r8=await page.evaluate(async()=>{const p={client:'Mateo Rivera',sid:'4471823'};$('#pClient').value=p.client;$('#pSid').value=p.sid;
    const old={total:1,data:{},own:JSON.stringify({gs:{id:'1SIMULATEDsheetIDforTESTSabcdefghijklmnop',on:true},rows:[],tag:'IPAD-COPY'})};
    await clTx('readwrite',st=>st.put({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,saved:new Date().toISOString(),sum:{items:[]},text:JSON.stringify({form:'CASE',packet:p,forms:{'DD-1':{title:'DD-1',snap:old}}})}));
    setPending('DD-1','Daily data',{total:1,data:{},own:JSON.stringify({gs:{id:'1SIMULATEDsheetIDforTESTSabcdefghijklmnop',on:true},rows:[],tag:'OPEN-CASE'})},false);
    let seen='';const one=clRefreshOne;clRefreshOne=async(r,L)=>{seen=L.fm.snap.own;return {err:'stopped by the test'};};
    await clRefreshAll();clRefreshOne=one;return seen;});
  ok('6 Read every linked sheet, for the student on screen with DD-1 not loaded: the open case\'s DD-1 is read, not the iPad\'s copy',/OPEN-CASE/.test(r8),r8.slice(0,120));
  await page.evaluate(()=>clearCase());await sleep(800);
  /* 7. at most eight forms loaded; the others put away, filled again when opened */
  const ids=['TB-1','CN-1','DD-1','IC-1','TI-1','GB-1','PA-1','QS-1','HD-1','RR-1'];
  for(const id of ids){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:30000}).catch(()=>{});await sleep(400);}
  await sleep(6000);
  const r9=await page.evaluate(()=>({frames:Object.keys(state.frames).length,pending:Object.keys(state.pending),cur:state.cur}));
  ok('7a ten forms opened: at most eight stay loaded, the ones viewed longest ago are put away (kept in the case)',r9.frames<=8&&r9.pending.includes('TB-1')&&r9.cur==='RR-1',r9);
  const tbBack=await page.evaluate(async()=>{openForm('TB-1');for(let i=0;i<80&&(state.pending['TB-1']||!state.status['TB-1']);i++)await new Promise(r=>setTimeout(r,250));return {filled:(state.status['TB-1']||{}).filled||0,frames:Object.keys(state.frames).length};});
  ok('7b a form put away comes back with its work when opened again',tbBack.filled>=f0['TB-1']-2&&tbBack.frames<=9,{tbBack,f0:f0['TB-1']});
  await page.evaluate(()=>clearCase());await sleep(800);
  /* 8. master print leaves nothing loaded */
  const n0=await page.evaluate(()=>document.querySelectorAll('#frames iframe').length);
  await page.evaluate(async()=>{window.open=()=>({document:{open(){},write(){},close(){}},focus(){},print(){},close(){}});const ch=ALL.filter(f=>['IC-1','CR-1','QS-1'].includes(f[0]));try{await masterRun(ch,{});}catch(e){}});await sleep(1500);
  const n1=await page.evaluate(()=>document.querySelectorAll('#frames iframe').length);
  ok('8 master print of three forms not open leaves no form loaded behind',n1===n0,{n0,n1});
  /* 9. the file check: four at a time */
  const r10=await page.evaluate(async()=>{let max=0;const host=()=>[...document.body.children].find(d=>d.tagName==='DIV'&&/left:\s*-10000px/.test(d.style.cssText)&&d.querySelector('iframe'));
    const t=setInterval(()=>{const h=host();if(h)max=Math.max(max,h.querySelectorAll('iframe').length);},100);
    let out=document.getElementById('fileOut');if(!out){out=document.createElement('div');out.id='fileOut';document.body.appendChild(out);}
    checkFiles();for(let i=0;i<180&&!/answering|did not answer/.test(out.textContent);i++)await new Promise(r=>setTimeout(r,500));clearInterval(t);return {max,txt:out.textContent.slice(0,90)};});
  ok('9 the file check loads at most four forms at a time and still checks them all',r10.max>0&&r10.max<=4&&/All \d+ forms are here and answering/.test(r10.txt),r10);
  ok('no page errors',!errs.length,errs.slice(0,5));
  await page.evaluate(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
