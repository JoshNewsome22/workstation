/* master print of every form (33 when it was written; all that index.html names now) from a fresh case file built from every
   simulation. v21.78: the student is named first (Save case asks about a case with no student name), simulated */
const L=require(__dirname+'/lib.js');
const DIR=__dirname+'/out/print/master33'; L.fs.mkdirSync(DIR,{recursive:true});
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(()=>{window.print=function(){};});
  const log=[]; const page=await ctx.newPage(); L.wire(page,log);
  const idx=`${L.BASE}/NBH-Workstation/index.html`; await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  for(const f of L.forms()){
    await page.evaluate(id=>openForm(id),f.id);
    await page.waitForFunction(id=>!!state.status[id],f.id,{timeout:20000}).catch(()=>{});
    const fr=page.frames().find(x=>x.url().endsWith('/'+f.file));
    if(fr){ await fr.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();}); await L.sleep(900); }
    process.stderr.write(f.id+' ');
  }
  await L.sleep(2000);
  const cf=L.path.join(DIR,'case.json');
  await page.fill('#pClient','SIMULATED – Sample Student');await page.dispatchEvent('#pClient','input');
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:120000}),page.click('#saveCase')]); await dl.saveAs(cf);
  await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  await page.setInputFiles('#caseFile',cf);
  await page.waitForFunction(n=>Object.keys(state.frames).length>=n,L.forms().length,{timeout:240000});
  await page.waitForFunction(()=>$('#openCase').textContent==='Open case',null,{timeout:240000}); await L.sleep(4000);
  const restored=await page.evaluate(()=>Object.keys(state.frames).length);
  await page.evaluate(()=>{ALL.forEach(([id])=>state.ticked[id]=true);renderRail();});
  await page.evaluate(()=>{wsUI.confirm=async()=>true;});   /* v21.78 the shell's questions (forms not loaded yet: include them) answered yes */
  const [popup]=await Promise.all([page.waitForEvent('popup',{timeout:120000}),page.click('#masterPrint')]);
  await popup.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await popup.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000}); await L.sleep(1500);
  const secs=await popup.evaluate(()=>Array.from(document.querySelectorAll('.mp-sec')).length);
  const bars=await popup.evaluate(()=>document.querySelectorAll('.nbh-pagenav').length);
  await popup.emulateMedia({media:'print'}); await L.sleep(500);
  const buf=await popup.pdf({preferCSSPageSize:true,printBackground:true}); L.fs.writeFileSync(L.path.join(DIR,'master.pdf'),buf);
  console.log(JSON.stringify({restored,sections:secs,pagenavInMaster:bars,fitted:await popup.evaluate(()=>window.__nbhFitted),bytes:buf.length,log:log.slice(0,5)}));
  await browser.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
