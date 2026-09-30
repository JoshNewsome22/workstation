/* classes.js: what the polish script marked in each form, and any script error. */
const L=require('./lib');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  for(const f of L.forms()){
    const log=[]; const page=await ctx.newPage(); L.wire(page,log);
    await page.goto(`${L.BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(page); await L.sleep(1200);
    const c=await page.evaluate(()=>{const q=s=>document.querySelectorAll(s).length;return {box:q('.nbh-box'),ul:q('.nbh-ul'),bare:q('.nbh-bare'),intd:q('.nbh-intd'),skip:q('.nbh-skip'),zebra:q('table.nbh-zebra'),tables:q('table'),flush:q('.nbh-flush'),unmarked:[...document.querySelectorAll('input,select,textarea')].filter(e=>!/^(hidden|checkbox|radio|file|button|submit|reset|image|range|color)$/i.test(e.type||'')&&!e.classList.contains('nbh-fld')&&!e.classList.contains('nbh-skip')).length};});
    console.log(f.id.padEnd(6),JSON.stringify(c),log.length?'ERR '+JSON.stringify(log.slice(0,2)):'');
    await page.close();
  }
  await browser.close();
})();
