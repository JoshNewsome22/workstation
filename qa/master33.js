/* master print of every form (33 when it was written; all that index.html names now) from a fresh case file built from every
   simulation. v21.78: the student is named first (Save case asks about a case with no student name), simulated */
const L=require(__dirname+'/lib.js');
const DIR=__dirname+'/out/print/master33'; L.fs.mkdirSync(DIR,{recursive:true});
/* v22.39 the staff records (RS-1, v22.30) are not part of a student's case: Save case leaves them out, so this case does too */
/* v23.44 nor is Form PD-1, a staff member's supervision record: it is saved in a file of its own, never in the case */
const FORMS=()=>L.forms().filter(f=>f.id!=='RS-1'&&f.id!=='PD-1');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(()=>{window.print=function(){};try{localStorage.setItem('nbh.frames.cap','60');}catch(e){}});   /* v21.81 the workstation keeps 8 forms loaded; this check wants every one at once */
  const log=[]; const page=await ctx.newPage(); L.wire(page,log);
  const idx=`${L.BASE}/NBH-Workstation/index.html`; await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  for(const f of FORMS()){
    await page.evaluate(id=>openForm(id),f.id);
    await page.waitForFunction(id=>!!state.status[id],f.id,{timeout:20000}).catch(()=>{});
    const fr=page.frames().find(x=>x.url().endsWith('/'+f.file));
    if(fr){ await fr.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();}); await L.sleep(900); }   /* v21.34 most forms ask with their own dialog */
    process.stderr.write(f.id+' ');
  }
  await L.sleep(2000);
  const cf=L.path.join(DIR,'case.json');
  await page.fill('#pClient','SIMULATED – Sample Student');await page.dispatchEvent('#pClient','input');
  /* v23.44 Form PD-1, a staff member's supervision record, is saved in a file of its own: Save case asks first; the case only */
  await page.evaluate(()=>{const ch=wsUI.choose;wsUI.choose=async function(m){if(/supervision record about a staff member/.test(m))return 'case';return ch.apply(this,arguments);};});
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:120000}),page.click('#saveCase')]); await dl.saveAs(cf);
  await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  await page.setInputFiles('#caseFile',cf);
  await page.waitForFunction(n=>new Set(Object.keys(state.frames).concat(Object.keys(state.pending))).size>=n,FORMS().length,{timeout:240000});   /* v21.61 a form not loaded yet is listed (pending) */
  await page.waitForFunction(()=>$('#openCase').textContent==='Open case',null,{timeout:240000}); await L.sleep(4000);
  const restored=await page.evaluate(()=>new Set(Object.keys(state.frames).concat(Object.keys(state.pending))).size);   /* a form loaded and not filled yet is in both */
  await page.evaluate(()=>{ALL.forEach(([id])=>{if(id!=='RS-1'&&id!=='PD-1')state.ticked[id]=true;});renderRail();});
  await page.evaluate(()=>{wsUI.confirm=async()=>true;});   /* v21.78 the shell's questions (forms not loaded yet: include them) answered yes */
  const [popup]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.evaluate(()=>$('#masterPrint').click())]);
  await popup.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await popup.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000}); await L.sleep(1500);
  const secs=await popup.evaluate(()=>Array.from(document.querySelectorAll('.mp-sec:not(.mp-app)')).length);   /* v21.96 the references appendix (.mp-app) is counted apart */
  const apps=await popup.evaluate(()=>document.querySelectorAll('.mp-sec.mp-app').length);
  const bars=await popup.evaluate(()=>document.querySelectorAll('.nbh-pagenav').length);
  await popup.emulateMedia({media:'print'}); await L.sleep(500);
  const buf=await popup.pdf({preferCSSPageSize:true,printBackground:true}); L.fs.writeFileSync(L.path.join(DIR,'master.pdf'),buf);
  console.log(JSON.stringify({restored,sections:secs,appendix:apps,pagenavInMaster:bars,fitted:await popup.evaluate(()=>window.__nbhFitted),bytes:buf.length,log:log.slice(0,5)}));
  await browser.close();
  /* v21.86 the checks: every form back from the case file, a section for each in the master print, no page error */
  const n=FORMS().length,bad=[];if(restored!==n)bad.push('restored '+restored+' of '+n);if(secs!==n)bad.push('sections '+secs+' of '+n);if(log.length)bad.push('errors '+JSON.stringify(log.slice(0,3)));
  console.log(bad.length?'FAIL '+bad.join('; '):'PASS every form restored and printed ('+n+' sections, '+buf.length+' bytes)');process.exit(bad.length?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
