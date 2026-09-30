/* phoneprint.js: a form printed from a phone-width window, from its kept snapshot; compared with the desktop baseline it must match. */
const L=require('./lib'); const crypto=require('crypto');
const ids=(process.argv[2]||'PR-1,IN-1,IC-1,CT-1').split(','); const label=process.argv[3]||'phone'; const BASE=process.argv[4]||L.BASE;
const DIR=L.path.join(__dirname,'print',label); L.fs.mkdirSync(DIR,{recursive:true});
const norm=buf=>{let s=buf.toString('latin1');s=s.replace(/\/CreationDate \([^)]*\)/g,'/CreationDate (X)').replace(/\/ModDate \([^)]*\)/g,'/ModDate (X)').replace(/\/ID \[<[0-9a-fA-F]+> <[0-9a-fA-F]+>\]/g,'/ID [<X> <X>]');return Buffer.from(s,'latin1');};
(async()=>{
  const browser=await L.chromium.launch(); const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await ctx.addInitScript(()=>{window.print=function(){};});
  for(const f of L.forms().filter(f=>ids.includes(f.id))){
    const page=await ctx.newPage(); L.wire(page,[]);
    await page.goto(`${BASE}/NBH-Workstation/${f.file}`,{waitUntil:'load'}); await L.sleep(800);
    const s=JSON.parse(L.fs.readFileSync(L.path.join(__dirname,'data',f.id+'.snap.json'),'utf8'));
    await page.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){window.removeEventListener('message',h);res(1);}};window.addEventListener('message',h);window.postMessage({nbh:'restore',snap:s},'*');setTimeout(()=>res(0),10000);}),s);
    await L.sleep(1800);
    const fs16=await page.evaluate(()=>{const t=document.querySelector('textarea.nbh-fld:not(.nbh-intd)');return t?getComputedStyle(t).fontSize:'none';});
    await page.emulateMedia({media:'print'}); await L.sleep(500);
    const plain=await page.evaluate(()=>document.documentElement.classList.contains('nbh-plain'));
    const buf=await page.pdf({preferCSSPageSize:true,printBackground:true}); await page.emulateMedia({media:null});
    const n=norm(buf); L.fs.writeFileSync(L.path.join(DIR,f.id+'.pdf'),n);
    const before=L.fs.readFileSync(L.path.join(__dirname,'print','before',f.id+'.pdf'));
    console.log(f.id,'phone textarea font on screen',fs16,'| plain during print',plain,'| identical to desktop baseline:',Buffer.compare(n,before)===0);
    await page.close();
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
