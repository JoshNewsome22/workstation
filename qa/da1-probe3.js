const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:390,height:800}});wire(page,log);
await page.goto(BASE+'/NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html');await sleep(300);
for(const sim of [false,true]){if(sim){await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);}
for(const v of ['inventory','assessment','results','guide']){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);
console.log(sim?'sim':'blank',v,await page.evaluate(()=>[document.documentElement.scrollWidth,document.body.scrollWidth]),await page.evaluate(()=>{const out=[];document.querySelectorAll('body *').forEach(e=>{if(e.closest('.grid-wrap')||e.closest('svg'))return;const r=e.getBoundingClientRect();if(r.right>392&&r.width>0&&getComputedStyle(e).display!=='none')out.push(e.tagName+'#'+e.id+'.'+String(e.className).slice(0,30)+' '+Math.round(r.right)+' '+Math.round(r.width));});return out.slice(0,8).join(' | ');}));}}
await br.close();})();
