const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(600);
 console.log('tick text:',await page.evaluate(()=>document.body.innerText.match(/\d+ of \d+ ticked/)?.[0]));
 for(const id of ['SR-1','SV-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000});await sleep(600);
   const fr=page.frames().find(f=>f.url().includes(id));console.log(id,'frame',!!fr,'bar',!!(await fr.$('.nbh-pagenav')));}
 await page.fill('#pClient','Test Student');await page.click('text=Fill open forms').catch(()=>{});await sleep(500);
 const sv=page.frames().find(f=>f.url().includes('SR-1'));console.log('SR-1 client after fill:',await sv.$eval('[data-m="client"]',e=>e.value));
 console.log('LOG',JSON.stringify(log).slice(0,300));await br.close();})();
