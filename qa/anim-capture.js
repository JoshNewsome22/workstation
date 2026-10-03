const {chromium,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/anim/v2';
const story=process.argv[2]||'co', steps=+(process.argv[3]||9), times=(process.argv[4]||'0,300,600,900,1300,1800').split(',').map(Number);
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1100,height:900}});const log=[];
 page.on('console',m=>{if(m.type()==='error')log.push(m.text().slice(0,200));});page.on('pageerror',e=>log.push('PAGEERROR '+String(e.message).slice(0,300)));
 await page.goto('http://127.0.0.1:8125/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(600);
 await page.click('#viewSeg button[data-view="walk"]');await sleep(400);
 const root=await page.$(`.story[data-story="${story}"]`);await page.evaluate(r=>r.querySelector('.scene').scrollIntoView({block:'center'}),root);await sleep(500);
 const scene=await root.$('.scene');const next=await root.$('[data-act="next"]');
 await scene.screenshot({path:`${OUT}/${story}-s1-t0.png`});
 for(let s=2;s<=steps;s++){const t0=Date.now();await next.click();
   for(const t of times){const w=t-(Date.now()-t0);if(w>0)await sleep(w);await scene.screenshot({path:`${OUT}/${story}-s${s}-t${t}.png`});}}
 console.log('LOG',JSON.stringify(log));await br.close();})();
