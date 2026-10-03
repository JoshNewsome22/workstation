const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];
 /* one-file edition: time to the form list, and to a form open */
 const p=await br.newPage();wire(p,log);let t0=Date.now();await p.goto('file://'+__dirname+'/../deliver/NBH-Workstation.html');await p.waitForSelector('#rail .item');const t1=Date.now()-t0;
 t0=Date.now();await p.evaluate(()=>openForm('OB-1'));await p.waitForFunction(()=>!!state.status['OB-1'],null,{timeout:60000});const t2=Date.now()-t0;
 const mem=await p.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null);
 console.log('one-file: list in',t1,'ms; OB-1 open in',t2,'ms; heap MB',mem);
 /* folder edition: the same */
 const p2=await br.newPage();wire(p2,log);t0=Date.now();await p2.goto(BASE+'/NBH-Workstation/index.html');await p2.waitForSelector('#rail .item');const t3=Date.now()-t0;t0=Date.now();await p2.evaluate(()=>openForm('OB-1'));await p2.waitForFunction(()=>!!state.status['OB-1'],null,{timeout:60000});console.log('folder: list in',t3,'ms; OB-1 open in',Date.now()-t0,'ms');
 /* a11y of the new pieces: buttons without names, dialogs without labels, in three forms */
 for(const f of ['OB-1_Direct-Observation-Record_v2026-09.html','SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html','Daily_Behavior_Data_and_Visual_Analysis.html']){
  const q=await br.newPage();wire(q,log);await q.goto(BASE+'/NBH-Workstation/'+f);await sleep(800);await q.evaluate(()=>{const b=document.querySelector('#simBtn,#btnLoadExample');if(b)b.click();});await sleep(800);
  const r=await q.evaluate(()=>{const unnamed=[...document.querySelectorAll('button')].filter(b=>!(b.textContent.trim()||b.getAttribute('aria-label')||b.title)).length;const dlgs=[...document.querySelectorAll('dialog')].map(d=>d.id+':'+(d.getAttribute('aria-labelledby')||d.getAttribute('aria-label')||'UNLABELLED'));const smallTargets=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().height<24).length;const noLabelInputs=[...document.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea')].filter(e=>e.offsetParent&&!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.placeholder&&!e.title).length;return {unnamed,dlgs,smallTargets,noLabelInputs,tabTitle:document.title};});
  console.log(f.slice(0,5),JSON.stringify(r));await q.close();}
 console.log('LOG',JSON.stringify(log).slice(0,300));await br.close();})();
