/* v22.14 speed (review F469, F470). The caseload is read from the device's storage once and kept: opening Caseload again,
   the start screen and the Drive chip read nothing more until something is written; a write (a new student) is seen at
   once; a caller changing what it was given cannot change what the next one reads. A form filled from a saved case says it
   is done as soon as it has taken the file, not after a fixed 1.2 s, and its values are all there when it does. Twelve
   simulated students.   usage: node qa/v2214-speed-test.js */
const {chromium,BASE,wire,sleep,forms,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const log=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  await ctx.addInitScript(()=>{window.__reads=0;const g=IDBObjectStore.prototype.getAll;IDBObjectStore.prototype.getAll=function(){if(this.name==='cases')window.__reads++;return g.apply(this,arguments);};});
  const page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  /* twelve simulated students, each with a case of some size */
  await page.evaluate(async()=>{const pad='x'.repeat(200000);
    for(let i=0;i<12;i++){const p={client:'SIMULATED – Sample Student '+(i+10),sid:'SIM-01'+(i+10),site:'Royal Palm School',grade:'5'};
      const text=JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date(Date.now()-i*864e5).toISOString(),packet:p,forms:{'TB-1':{id:'TB-1',snap:{own:JSON.stringify({pad})}}}});
      await clTx('readwrite',st=>st.put({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved:new Date(Date.now()-i*864e5).toISOString(),sum:{items:[],lastData:'',forms:1},text}));}});
  await page.evaluate(()=>paintBlank());await sleep(800);
  const r0=await page.evaluate(()=>window.__reads);
  await page.evaluate(()=>caseloadOpen());await sleep(1200);await page.evaluate(()=>document.getElementById('dlg').close());
  const r1=await page.evaluate(()=>window.__reads);
  await page.evaluate(()=>caseloadOpen());await sleep(1200);await page.evaluate(()=>document.getElementById('dlg').close());
  await page.evaluate(()=>paintBlank());await sleep(600);
  const r2=await page.evaluate(()=>window.__reads);
  const cards=await page.evaluate(()=>document.querySelectorAll('#blank .cl-card,#blank [data-clopen]').length);
  ok('1 opened again, Caseload and the start screen read nothing more from storage (they read it '+(r1-r0)+' time(s) the first time)',r2===r1&&cards>0,{r0,r1,r2,cards});
  const w=await page.evaluate(async()=>{const p={client:'SIMULATED – Sample Student 2',sid:'SIM-0003',site:'Royal Palm School',grade:'4'};
    await clTx('readwrite',st=>st.put({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:'',grade:'',bcba:'',saved:new Date().toISOString(),sum:{items:[],lastData:'',forms:0},text:JSON.stringify({form:'CASE',packet:p,forms:{}})}));
    const L=await clList();return {n:L.length,has:L.some(r=>r.sid==='SIM-0003')};});
  ok('2 a student written to the caseload is in the very next list (13 students)',w.n===13&&w.has,w);
  const m=await page.evaluate(async()=>{const a=await clList();a[0].client='CHANGED';a[0].sum.items.push({k:'x'});a.pop();const b=await clList();return {n:b.length,client:b[0].client,items:b[0].sum.items.length};});
  ok('3 a caller changing the list it was given does not change what the next caller reads',m.n===13&&m.client!=='CHANGED'&&m.items===0,m);
  /* F470: a form filled from a saved case */
  const fl=forms().filter(f=>!process.env.ONLY||process.env.ONLY.split(',').includes(f.id));const times=[];
  for(const f of fl){const fp=await ctx.newPage();wire(fp,log);await fp.goto(BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1200);
    await fp.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await loadSim(fp);await sleep(1500);
    const snap=await fp.evaluate(async()=>{const x=await window.nbhBridge.ownSave();return typeof x==='string'?x:x&&typeof x.text==='function'?await x.text():JSON.stringify(x);});
    const sig=await fp.evaluate(()=>window.nbhBridge.valueSig());
    /* reopened in a fresh browser (no Autosave copy holds the same values already) */
    await fp.close();const c2=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});const fq=await c2.newPage();wire(fq,log);
    await fq.goto(BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1200);
    const r=await fq.evaluate(async t=>{const t0=performance.now();const okk=await window.nbhBridge.ownOpen(t);const ms=Math.round(performance.now()-t0);
      /* nothing is still arriving when it says it is done: its own file saved at that moment and again 1.5 s later is the same
         (a form's round trip may itself differ from the file opened, by a time stamp or a date it works out; that is not this) */
      const sv=async()=>{const x=await window.nbhBridge.ownSave();return typeof x==='string'?x:await x.text();};
      const strip=v=>JSON.stringify(JSON.parse(v),(k,val)=>/^(saved|exported|savedAt|stamp)$/.test(k)?undefined:val);
      const A=strip(await sv());await new Promise(z=>setTimeout(z,1500));const B=strip(await sv());let k=0;while(k<A.length&&A[k]===B[k])k++;
      return {ok:okk,ms,same:A===B,diff:A===B?'':A.slice(Math.max(0,k-60),k+60)+' <> '+B.slice(Math.max(0,k-60),k+60)};},snap);
    times.push({id:f.id,ms:r.ms,ok:r.ok,same:r.same,diff:r.diff});await c2.close();}
  const three=times.filter(t=>['DM-1','TB-1','CF-1'].includes(t.id));
  ok('4 DM-1, TB-1 and CF-1 filled from a saved file say they are done well before 1.2 s, with nothing still arriving after',three.length===3&&three.every(t=>t.ok&&t.same&&t.ms<1000),three);
  const bad=times.filter(t=>!t.ok||!t.same),slow=times.filter(t=>t.ms>=1150),ms=times.map(t=>t.ms).sort((a,b)=>a-b);
  console.log('  open times (ms): median '+ms[Math.floor(ms.length/2)]+', slowest '+ms[ms.length-1]+'; at the 1.2 s limit: '+slow.map(t=>t.id).join(', '));
  ok('6 every one of the '+times.length+' forms, filled from its saved file, has taken all of the file when it says it is done (nothing changes after); most are done in under 0.6 s',(times.length===47||!!process.env.ONLY)&&!bad.length&&ms[Math.floor(ms.length/2)]<600,{bad,slow:slow.map(t=>t.id+':'+t.ms)});
  const errs=log.filter(l=>l.type!=='warning');ok('5 no page errors',!errs.length,errs);
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
