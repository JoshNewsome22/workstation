const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/SV-1_Social-Validity_v2026-09.html');await sleep(500);
 console.log(await page.evaluate(()=>{const t=document.querySelector('#thrIn');const r=t.getBoundingClientRect();const cs=getComputedStyle(t);const p=t.parentElement;const pcs=getComputedStyle(p);const tb=document.querySelector('.toolbar');const tcs=getComputedStyle(tb);
  return {box:[r.x,r.y,r.width,r.height],display:cs.display,vis:cs.visibility,parentDisplay:pcs.display,parentClass:p.className,tgroupDisplay:getComputedStyle(p.parentElement).display,tgroupClass:p.parentElement.className,toolbarDisplay:tcs.display,toolbarHTML:tb.outerHTML.slice(0,1200)};}));
 console.log('LOG',JSON.stringify(log));await br.close();})();
