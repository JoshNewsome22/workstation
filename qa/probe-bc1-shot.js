const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage(); const log=[]; L.wire(page,log);
  const url=`${L.BASE}/NBH-Workstation/BC-1_Behavioral-Contrast_v2026-09.html`;
  await page.goto(url,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
  await page.evaluate(()=>window.scrollTo(0,850)); await L.sleep(200);
  await page.screenshot({path:'formshots/zoom/bc1-fresh-d0-setup-mid.png'});
  console.log('ok', log.length?JSON.stringify(log.slice(0,3)):'');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
