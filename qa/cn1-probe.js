const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:390,height:800}});wire(page,[]);
await page.goto(BASE+'/NBH-Workstation/CN-1_Consultation-Notes_v2026-10.html');await sleep(500);
await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);await page.click('#viewSeg button[data-view="note"]');await sleep(300);
console.log(await page.evaluate(()=>{const cw=document.documentElement.clientWidth;const out=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>cw+1&&r.width<2000){const s=e.id?'#'+e.id:e.className?'.'+String(e.className).split(' ')[0]:e.tagName;out.push(e.tagName+' '+s+' right='+Math.round(r.right)+' w='+Math.round(r.width));}});return out.slice(0,25).join('\n');}));
await br.close();})();
