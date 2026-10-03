/* v21.36: the letterhead image once per form; every logo image is filled, on screen, in print and in the master print */
const {chromium,BASE,wire,sleep}=require('/home/user/workstation/qa/lib.js');
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);
 for(const f of ['CF-1_Contextual-Fit-Assessment_v2026-09.html','TD-1_Function-Based-Treatment-Developer_v2026-09.html','SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html']){
  await page.goto(BASE+'/NBH-Workstation/'+f);await sleep(600);
  const r=await page.evaluate(()=>{const a=[...document.querySelectorAll('img[data-nbh-logo]')];return {n:a.length,withSrc:a.filter(i=>/^data:image/.test(i.getAttribute('src')||'')).length,loaded:a.filter(i=>i.naturalWidth>0).length,mastShown:getComputedStyle(document.querySelector('img.nbh-logo')).display,uris:(document.documentElement.outerHTML.match(/data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAHZ/g)||[]).length};});
  console.log(f.slice(0,5),JSON.stringify(r));
 }
 /* master print through the shell: the section carries the print logo with its image */
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 await page.evaluate(()=>openForm('CF-1'));await page.waitForFunction(()=>!!state.status['CF-1'],null,{timeout:20000});await sleep(500);
 const r=await page.evaluate(async()=>{const r=await grab('CF-1','collect',null,8000);const h=r&&r.html||'';return {len:h.length,printLogos:(h.match(/class="nbh-print-logo"/g)||[]).length,withData:(h.match(/nbh-print-logo"[^>]*src="data:image/g)||[]).length,anyData:(h.match(/src="data:image\/png;base64,iVBOR/g)||[]).length};});
 console.log('collect',JSON.stringify(r));
 console.log('LOG',JSON.stringify(log).slice(0,400));await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
