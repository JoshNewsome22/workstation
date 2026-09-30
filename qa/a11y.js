/* a11y.js <label> <base-url>: axe-core WCAG 2.1 A/AA on the workstation (three states) and every form's default view. */
const L=require('./lib');
const label=process.argv[2], BASE=process.argv[3];
const AXE=L.fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
async function run(page,frameToo){
  await page.addScriptTag({content:AXE});
  const r=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},iframes:false});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,sample:v.nodes.slice(0,3).map(x=>x.target.join(' ').slice(0,90))}));});
  return r;
}
(async()=>{
  const browser=await L.chromium.launch(); const out={};
  const ctx=await browser.newContext({viewport:{width:1440,height:900}}); await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage(); L.wire(page,[]);
  await page.goto(`${BASE}/NBH-Workstation/index.html`,{waitUntil:'load'}); await L.sleep(500);
  out['index:empty']=await run(page);
  await page.evaluate(()=>openForm('TI-1')); await page.waitForFunction(()=>!!state.status['TI-1'],null,{timeout:20000}).catch(()=>{}); await L.sleep(500);
  out['index:form']=await run(page);
  if(await page.$('#fullBtn')){await page.click('#fullBtn').catch(()=>{});await L.sleep(300);out['index:full']=await run(page);}
  await page.click('#help').catch(()=>{}); await L.sleep(300); out['index:help']=await run(page);
  await page.close();
  for(const f of L.forms()){
    const p=await ctx.newPage(); L.wire(p,[]);
    await p.goto(`${BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(600); await L.loadSim(p); await L.sleep(1200);
    out[f.id]=await run(p); await p.close(); process.stderr.write(f.id+' ');
  }
  await browser.close();
  L.fs.writeFileSync(`a11y-${label}.json`,JSON.stringify(out,null,1));
  let tot=0; for(const [k,v] of Object.entries(out)){const n=v.reduce((a,x)=>a+x.n,0);tot+=n;if(n)console.log(k.padEnd(12),v.map(x=>`${x.id}(${x.impact})x${x.n}`).join(' '));}
  console.log('\ntotal violation nodes',label,tot);
})().catch(e=>{console.error(e);process.exit(1);});
