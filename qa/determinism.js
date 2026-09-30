/* Are the simulations deterministic? Load the sim twice and hash the field values. */
const L=require('./lib'); const crypto=require('crypto');
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const pick=process.argv.slice(2);
  for(const f of L.forms().filter(f=>!pick.length||pick.includes(f.id))){
    const hs=[];
    for(let i=0;i<2;i++){
      const page=await ctx.newPage(); L.wire(page,[]);
      await page.goto(`${L.BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600);
      await L.loadSim(page); await L.sleep(1500);
      const vals=await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(e=>e.type==='checkbox'||e.type==='radio'?(e.checked?1:0):e.value).join('\u0001'));
      hs.push(crypto.createHash('md5').update(vals).digest('hex').slice(0,8));
      await page.close();
    }
    console.log(f.id, hs[0]===hs[1]?'deterministic':'RANDOM', hs.join(' '));
  }
  await browser.close();
})();
