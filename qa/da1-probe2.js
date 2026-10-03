const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:390,height:800}});wire(page,log);
await page.goto(BASE+'/NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html');await sleep(300);
await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
await page.click('#viewSeg button[data-view="results"]');await sleep(200);
console.log(await page.evaluate(()=>{const out=[];for(const id of ['rankTbl','sessTbl']){let e=document.getElementById(id);for(let k=0;k<4;k++){const cs=getComputedStyle(e);const r=e.getBoundingClientRect();out.push(id+' up'+k+' '+e.tagName+'.'+e.className+' overflowX='+cs.overflowX+' display='+cs.display+' w='+Math.round(r.width)+' min-w='+cs.minWidth);e=e.parentElement;}}return out.join('\n');}));
await br.close();})();
