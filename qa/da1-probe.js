const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:390,height:800}});wire(page,log);
await page.goto(BASE+'/NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html');await sleep(300);
await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
await page.click('#viewSeg button[data-view="results"]');await sleep(200);
console.log(await page.evaluate(()=>{const out=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.right>392&&r.width>0&&getComputedStyle(e).display!=='none')out.push(e.tagName+'#'+e.id+'.'+e.className+' '+Math.round(r.right)+' '+Math.round(r.width));});return out.slice(0,25).join('\n');}));
await br.close();})();
