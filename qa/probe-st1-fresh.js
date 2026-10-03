const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}}); await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage(); L.wire(page,[]);
  await page.goto(`${L.BASE}/NBH-Workstation/ST-1_Behavior-Skills-Training_v2026-09.html`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
  await page.screenshot({path:'formshots/check/ST-1-fresh-d0-top.png'});
  const seg=await page.$$('#viewSeg button, .toolbar .seg button'); await seg[3].click({force:true}); await L.sleep(500);
  await page.evaluate(()=>window.scrollTo(0,900)); await L.sleep(300);
  await page.screenshot({path:'formshots/check/ST-1-fresh-d3-mid.png'});
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
