/* formshots.js <label> <base-url> [ids]: every view of every form, desktop and phone, for a visual review. */
const L=require('./lib');
const label=process.argv[2], BASE=process.argv[3], only=(process.argv[4]||'').split(',').filter(Boolean);
const DIR=L.path.join(__dirname,'formshots',label); L.fs.mkdirSync(DIR,{recursive:true});
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'view';
async function views(page){
  return page.evaluate(()=>{
    const seg=[...document.querySelectorAll('#viewSeg button, .toolbar .seg button')];
    if(seg.length)return {kind:'seg',labels:seg.map(b=>b.textContent.trim())};
    const tabs=[...document.querySelectorAll('[role=tab]')];
    return {kind:'tab',labels:tabs.map(b=>b.textContent.trim())};
  });
}
async function pick(page,kind,i){
  const sel=kind==='seg'?'#viewSeg button, .toolbar .seg button':'[role=tab]';
  const els=await page.$$(sel); if(!els[i])return false;
  await els[i].click({force:true}).catch(()=>{}); return true;
}
(async()=>{
  const browser=await L.chromium.launch();
  const index={};
  for(const f of L.forms()){
    if(only.length&&!only.includes(f.id))continue;
    const log=[]; const out=[];
    const ctx=await browser.newContext({viewport:{width:1440,height:900}}); await ctx.addInitScript(()=>{window.print=function(){};});
    const page=await ctx.newPage(); L.wire(page,log);
    await page.goto(`${BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(page); await L.sleep(1500);
    const v=await views(page); const n=Math.min(v.labels.length||1,9);
    for(let i=0;i<n;i++){
      if(v.labels.length){await pick(page,v.kind,i);await L.sleep(500);}
      await page.evaluate(()=>window.scrollTo(0,0)); await L.sleep(150);
      const base=`${f.id}-d${i}-${slug(v.labels[i])}`;
      await page.screenshot({path:L.path.join(DIR,base+'-top.png')}); out.push(base+'-top.png');
      const h=await page.evaluate(()=>document.documentElement.scrollHeight);
      if(h>1100){await page.evaluate(()=>window.scrollTo(0,850));await L.sleep(200);await page.screenshot({path:L.path.join(DIR,base+'-mid.png')});out.push(base+'-mid.png');}
      if(h>2200){await page.evaluate(()=>window.scrollTo(0,1900));await L.sleep(200);await page.screenshot({path:L.path.join(DIR,base+'-low.png')});out.push(base+'-low.png');}
    }
    await ctx.close();
    const pctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}); await pctx.addInitScript(()=>{window.print=function(){};});
    const pp=await pctx.newPage(); L.wire(pp,log);
    await pp.goto(`${BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(pp); await L.sleep(1500);
    for(let i=0;i<Math.min(n,2);i++){
      if(v.labels.length){await pick(pp,v.kind,i);await L.sleep(500);}
      await pp.evaluate(()=>window.scrollTo(0,0)); await L.sleep(150);
      const base=`${f.id}-p${i}-${slug(v.labels[i])}`;
      await pp.screenshot({path:L.path.join(DIR,base+'-top.png')}); out.push(base+'-top.png');
    }
    await pctx.close();
    index[f.id]={file:f.file,views:v,shots:out,errors:log};
    process.stderr.write(f.id+' ');
  }
  await browser.close();
  L.fs.writeFileSync(L.path.join(DIR,'index.json'),JSON.stringify(index,null,1));
  console.log('\nformshots done',label);
})().catch(e=>{console.error(e);process.exit(1);});
