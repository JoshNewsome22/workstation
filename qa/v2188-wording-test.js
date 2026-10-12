/* v21.88 the questionnaire wording is learned from a file: a case or IA-1 file that carries an instrument's whole wording,
   opened on a device that has none for it, leaves the wording on that device for the next new IA-1. What the device already
   holds stays; a paste with the wrong number of items is not learned; Forget on this device holds learning off until the
   page is opened again. Then the same in the workstation: a case opened from the caseload teaches the device.
   Simulated student only; the item lines are placeholders, not any instrument's wording.
   usage: node qa/v2188-wording-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
const KEY='nbh.ia1.respondent';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const openFile=(page,d)=>page.setInputFiles('#fileIn',{name:'IA-1_simulated.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});
const lines=(n,tag)=>Array.from({length:n},(_,i)=>(i+1)+'. Placeholder '+tag+' item '+(i+1)+' about the student.').join('\n');
(async()=>{
  const br=await chromium.launch();
  try{
  const ctx=await br.newContext({viewport:{width:1100,height:820},serviceWorkers:'block'});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(URL);await sleep(800);
  /* a file made elsewhere: QABF 25 items, MAS only 10 (an unfinished paste), PBQ 18; the fields are set without input events,
     so this device learns nothing while the file is made */
  const file={};await page.evaluate(([q,m,p])=>{window.confirm=()=>true;window.alert=()=>{};localStorage.removeItem('nbh.ia1.respondent');
    const put=(n,v)=>{document.querySelector('[name="'+n+'"]').value=v;};
    put('m.client','Mateo Rivera');put('m.sid','4471823');put('rp.w.qabf',q);put('rp.w.mas',m);put('rp.w.pbq',p);
    return localStorage.getItem('nbh.ia1.respondent');},[lines(25,'Q'),lines(10,'M'),lines(18,'P')]);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#saveBtn').click())]);
  file.d=JSON.parse(require('fs').readFileSync(await dl.path(),'utf8'));file.dev=await page.evaluate(()=>localStorage.getItem('nbh.ia1.respondent'));
  ok('1 the saved file carries the pasted wording and this device has learned nothing yet',String(file.d.fields['rp.w.qabf']||'').split('\n').length===25&&file.dev===null,file.dev);
  /* this device already holds its own PBQ wording (15 items) */
  await page.evaluate(p=>localStorage.setItem('nbh.ia1.respondent',JSON.stringify({'rp.w.pbq':p})),lines(15,'own'));
  await page.goto(URL);await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await openFile(page,file.d);await sleep(600);
  const s1=await page.evaluate(()=>({o:JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}'),note:document.querySelector('#rpDevText').textContent,shown:!document.querySelector('#rpDevNote').hidden}));
  ok('2 opening the file teaches the device the QABF (all 25 items)',(s1.o['rp.w.qabf']||'').split('\n').length===25,Object.keys(s1.o));
  ok('3 the MAS with 10 of its 16 items is not learned',!('rp.w.mas' in s1.o),Object.keys(s1.o));
  ok('4 the PBQ this device already held is kept, not replaced by the file’s',/own item 1/.test(s1.o['rp.w.pbq']||'')&&(s1.o['rp.w.pbq']||'').split('\n').length===15,(s1.o['rp.w.pbq']||'').slice(0,60));
  ok('5 the Setup sheet says what is remembered',s1.shown&&/Remembered on this device: the (PBQ, QABF|QABF, PBQ) wording/.test(s1.note),s1.note);
  /* a new IA-1 on this device */
  await page.goto(URL);await sleep(900);
  const s2=await page.evaluate(()=>({q:document.querySelector('[name="rp.w.qabf"]').value.split('\n').length,mas:document.querySelector('[name="rp.w.mas"]').value,count:document.querySelector('[data-rpw="qabf"]').textContent}));
  ok('6 a new IA-1 opened here carries the QABF wording with no pasting',s2.q===25&&s2.mas===''&&/25 pasted/.test(s2.count),s2);
  /* Forget on this device: no learning again until the page is opened again */
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await openFile(page,file.d);await sleep(600);
  await page.evaluate(()=>document.querySelector('#rpDevForget').click());await openFile(page,file.d);await sleep(600);
  const s3=await page.evaluate(()=>localStorage.getItem('nbh.ia1.respondent'));
  ok('7 after Forget on this device, the same page opening the file again does not learn it back',s3===null,s3);
  await page.goto(URL);await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await openFile(page,file.d);await sleep(600);
  const s4=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}')));
  ok('8 the page opened again: the file teaches the device again (the QABF and the 18-item PBQ, both whole)',s4.sort().join()==='rp.w.pbq,rp.w.qabf',s4);
  /* an older file with no wording: the device keeps what it learned */
  const bare=JSON.parse(JSON.stringify(file.d));Object.keys(bare.fields).forEach(k=>{if(/^rp\.w\./.test(k))bare.fields[k]='';});
  await page.goto(URL);await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await openFile(page,bare);await sleep(600);
  const s5=await page.evaluate(()=>({k:Object.keys(JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}')),q:document.querySelector('[name="rp.w.qabf"]').value.split('\n').length}));
  ok('9 a file with no wording opened here: the device keeps what it learned and the form gets it',s5.k.sort().join()==='rp.w.pbq,rp.w.qabf'&&s5.q===25,s5);
  ok('10 no page errors (form alone)',!errs.length,errs.slice(0,4));
  await page.close();

  /* the workstation: a case kept on this iPad with the QABF pasted, closed, the device's memory cleared, the case opened from the caseload */
  const wp=await ctx.newPage();const werr=[];wp.on('pageerror',e=>werr.push(e.message));
  await wp.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await wp.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};localStorage.removeItem('nbh.ia1.respondent');
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  await wp.evaluate(()=>openForm('IA-1'));await wp.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1500);
  const ia=wp.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  await ia.evaluate(q=>{window.confirm=()=>true;const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));};
    set('m.client','Mateo Rivera');set('m.sid','4471823');set('m.beh','Hitting');set('rp.w.qabf',q);},lines(25,'Q'));
  await sleep(1500);
  const kept=await wp.evaluate(async()=>{const ok=await caseKeepOnly();return ok;});
  await wp.evaluate(()=>clearCase());await sleep(600);
  await wp.evaluate(()=>localStorage.removeItem('nbh.ia1.respondent'));
  const inCase=await wp.evaluate(async()=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));return !!r&&/Placeholder Q item 25/.test(r.text);});
  ok('11 the case kept on this iPad carries the QABF wording in its IA-1; this device’s memory is cleared',kept&&inCase,{kept,inCase});
  await wp.evaluate(async()=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));await openCaseText(r.text,null,{asked:true,quiet:true});});
  await wp.evaluate(()=>openForm('IA-1'));await wp.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1800);
  const w1=await wp.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}')));
  ok('12 the case opened from the caseload: IA-1 teaches this device the QABF wording',w1.indexOf('rp.w.qabf')>=0,w1);
  /* a new student: IA-1 starts with the wording */
  await wp.evaluate(()=>clearCase());await sleep(600);
  await wp.evaluate(()=>{const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient','SIMULATED – Sample Student');});
  await wp.evaluate(()=>openForm('IA-1'));await wp.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000});await sleep(1800);
  const ia3=wp.frames().find(f=>/IA-1_Indirect/.test(f.url()));
  const w2=await ia3.evaluate(()=>({q:document.querySelector('[name="rp.w.qabf"]').value.split('\n').length,client:document.querySelector('[name="m.client"]').value}));
  ok('13 the next student’s IA-1 starts with the 25 QABF items already there',w2.q===25&&!/Mateo/.test(w2.client),w2);
  ok('14 no page errors (workstation)',!werr.length,werr.slice(0,4));
  await wp.evaluate(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));localStorage.removeItem('nbh.ia1.respondent');});
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
