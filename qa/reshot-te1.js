const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}}); await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();
  let url=`${L.BASE}/NBH-Workstation/TE-1_Token-Economy-Designer_v2026-09.html`;
  try{ await page.goto(url,{waitUntil:'load',timeout:5000}); }catch(e){ url='file://'+__dirname+'/../NBH-Workstation/TE-1_Token-Economy-Designer_v2026-09.html'; await page.goto(url,{waitUntil:'load'}); }
  await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
  await page.screenshot({path:'crops_te1/reshot_d0_now.png'});
  const r=await page.evaluate(()=>{const t=document.querySelector('table.rt'); return [...t.rows].map(tr=>{const th=tr.querySelector('th'); return th?getComputedStyle(th).backgroundColor:null;});});
  console.log(url, JSON.stringify(r));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
