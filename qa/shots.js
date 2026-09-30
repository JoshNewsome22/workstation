/* shots.js <label>: screen captures of the workstation and four forms at desktop, tablet and phone sizes. */
const L=require('./lib');
const label=process.argv[2]||'before', EDITION=process.argv[3]||'NBH-Workstation';
const DIR=L.path.join(__dirname,'shots',label); L.fs.mkdirSync(DIR,{recursive:true});
const VP={desktop:{viewport:{width:1440,height:900}},tablet:{viewport:{width:1024,height:768},hasTouch:true},phone:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}};
const PICK=(process.argv[4]||'DD-1,TI-1,IC-1,CR-1').split(',');
(async()=>{
  const browser=await L.chromium.launch();
  for(const [vp,opt] of Object.entries(VP)){
    const ctx=await browser.newContext(opt); await ctx.addInitScript(()=>{window.print=function(){};});
    const page=await ctx.newPage(); const log=[]; L.wire(page,log);
    await page.goto(`${L.BASE}/${EDITION}/index.html`,{waitUntil:'load'}); await L.sleep(700);
    await page.screenshot({path:L.path.join(DIR,`index-empty-${vp}.png`)});
    await page.evaluate(()=>openForm('DD-1')); await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:20000}).catch(()=>{});
    const fr=page.frames().find(x=>x.url().includes('Daily_Behavior')); if(fr){await L.loadSim(fr);await L.sleep(1500);}
    await page.screenshot({path:L.path.join(DIR,`index-DD-1-${vp}.png`)});
    await page.evaluate(()=>openForm('TI-1')); await page.waitForFunction(()=>!!state.status['TI-1'],null,{timeout:20000}).catch(()=>{});
    const fr2=page.frames().find(x=>x.url().includes('TI-1_')); if(fr2){await L.loadSim(fr2);await L.sleep(1500);}
    await page.screenshot({path:L.path.join(DIR,`index-TI-1-${vp}.png`)});
    for(const f of L.forms(EDITION).filter(f=>PICK.includes(f.id))){
      const p=await ctx.newPage(); L.wire(p,log);
      await p.goto(`${L.BASE}/${EDITION}/${f.file}`,{waitUntil:'load'}); await L.sleep(700); await L.loadSim(p); await L.sleep(1800);
      await p.screenshot({path:L.path.join(DIR,`form-${f.id}-${vp}.png`)});
      await p.evaluate(()=>window.scrollTo(0,Math.round(window.innerHeight*0.9))); await L.sleep(300);
      await p.screenshot({path:L.path.join(DIR,`form-${f.id}-${vp}-2.png`)});
      await p.close();
    }
    L.fs.writeFileSync(L.path.join(DIR,`log-${vp}.json`),JSON.stringify(log,null,1));
    await ctx.close(); process.stderr.write(vp+' ');
  }
  await browser.close(); console.log('\nshots done',label);
})().catch(e=>{console.error(e);process.exit(1);});
