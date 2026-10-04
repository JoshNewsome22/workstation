/* printbase.js <label> [edition]
   PDFs of every form on its own and of the master print, produced from the SAME data each run:
   the 'before' run loads each simulation, takes the form's snapshot (its own saved file) and keeps it;
   every run then reloads the form, restores that snapshot and prints, so before/after PDFs differ only
   if the print output changed. The master print is built from a case file saved the same way. */
const L=require('./lib'); const crypto=require('crypto');
const label=process.argv[2]||'before', EDITION=process.argv[3]||'NBH-Workstation';
const DIR=L.path.join(__dirname,'print',label); L.fs.mkdirSync(DIR,{recursive:true});
const DATA=L.path.join(__dirname,'data'); L.fs.mkdirSync(DATA,{recursive:true});
const norm=buf=>{let s=buf.toString('latin1');
  s=s.replace(/\/CreationDate \([^)]*\)/g,'/CreationDate (X)').replace(/\/ModDate \([^)]*\)/g,'/ModDate (X)')
     .replace(/\/ID \[<[0-9a-fA-F]+> <[0-9a-fA-F]+>\]/g,'/ID [<X> <X>]'); return Buffer.from(s,'latin1');};
const md5=b=>crypto.createHash('md5').update(b).digest('hex');
async function snap(page){ return page.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='snapshot'&&ev.data.snap){window.removeEventListener('message',h);res(ev.data.snap);}};window.addEventListener('message',h);window.postMessage({nbh:'snapshot'},'*');setTimeout(()=>res(null),10000);})); }
async function restore(page,s){ return page.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){window.removeEventListener('message',h);res(ev.data.report);}};window.addEventListener('message',h);window.postMessage({nbh:'restore',snap:s},'*');setTimeout(()=>res(null),10000);}),s); }
async function pdf(page,file){
  await page.emulateMedia({media:'print'}); await L.sleep(500);
  const buf=await page.pdf({preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:null}); await L.sleep(200);
  const n=norm(buf); L.fs.writeFileSync(file,n); return md5(n);
}
(async()=>{
  const browser=await L.chromium.launch();
  const ctx=await browser.newContext({viewport:{width:1280,height:900}});
  await ctx.addInitScript(()=>{window.print=function(){};});
  const sums={},errs={};
  for(const f of L.forms(EDITION)){
    const log=[]; const page=await ctx.newPage(); L.wire(page,log);
    const url=`${L.BASE}/${EDITION}/${f.file}`;
    const sf=L.path.join(DATA,f.id+'.snap.json');
    if(label==='before'||!L.fs.existsSync(sf)){
      await page.goto(url,{waitUntil:'load'}); await L.sleep(800); await L.loadSim(page); await L.sleep(1800);
      const s=await snap(page); if(s) L.fs.writeFileSync(sf,JSON.stringify(s));
    }
    await page.goto(url,{waitUntil:'load'}); await L.sleep(800);
    if(L.fs.existsSync(sf)){ const s=JSON.parse(L.fs.readFileSync(sf,'utf8')); const rep=await restore(page,s); await L.sleep(1800); errs[f.id+'.restore']=rep; }
    sums[f.id]=await pdf(page,L.path.join(DIR,f.id+'.pdf'));
    errs[f.id]=log; await page.close(); process.stderr.write(f.id+' ');
  }
  /* the master print, from a case file */
  const log=[]; const page=await ctx.newPage(); L.wire(page,log);
  const idx=`${L.BASE}/${EDITION}/index.html`;
  await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  const cf=L.path.join(DATA,'case.json');
  if(label==='before'||!L.fs.existsSync(cf)){
    for(const f of L.forms(EDITION)){
      await page.evaluate(id=>openForm(id),f.id);
      await page.waitForFunction(id=>!!state.status[id],f.id,{timeout:20000}).catch(()=>{});
      const fr=page.frames().find(x=>x.url().endsWith('/'+f.file));
      if(fr){ await L.loadSim(fr); await L.sleep(900); }
    }
    await L.sleep(2000);
    /* the packet's student, so Save case does not stop at its question "Save the case without a student name?" */
    await page.evaluate(()=>{for(const [k,v] of [['#pClient','SIMULATED \u2013 Sample Student'],['#pSid','SIM-000']]){const e=$(k);e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));}});
    const [dl]=await Promise.all([page.waitForEvent('download',{timeout:120000}),page.click('#saveCase')]);
    await dl.saveAs(cf);
    await page.goto(idx,{waitUntil:'load'}); await L.sleep(600);
  }
  await page.setInputFiles('#caseFile',cf);
  await page.waitForFunction(n=>Object.keys(state.frames).length>=n,L.forms(EDITION).length,{timeout:180000});
  await page.waitForFunction(()=>$('#openCase').textContent==='Open case',null,{timeout:180000});
  await L.sleep(4000);
  await page.evaluate(()=>{ALL.forEach(([id])=>state.ticked[id]=true);renderRail();});
  const [popup]=await Promise.all([page.waitForEvent('popup'),page.click('#masterPrint')]);
  await popup.evaluate(()=>{window.print=function(){};}).catch(()=>{});
  await popup.waitForFunction(()=>window.__nbhFitted!==undefined&&document.querySelector('.mp-sec'),null,{timeout:300000});
  await L.sleep(1500);
  let html=await popup.content(); html=html.replace(/<th>Compiled<\/th><td>[^<]*<\/td>/,'<th>Compiled</th><td>DATE</td>');
  L.fs.writeFileSync(L.path.join(DIR,'master.html'),html);
  sums.master=await pdf(popup,L.path.join(DIR,'master.pdf'));
  errs.master=log; errs.fitted=await popup.evaluate(()=>window.__nbhFitted);
  L.fs.writeFileSync(L.path.join(DIR,'sums.json'),JSON.stringify({sums,errs},null,1));
  await browser.close();
  console.log('\ndone',label,Object.keys(sums).length,'pdfs');
})().catch(e=>{console.error(e);process.exit(1);});
