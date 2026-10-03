const L=require(__dirname+'/lib.js');const {chromium,sleep,BASE}=L;
const FORMS=L.forms().filter(f=>['RA-1','PA-1','EA-1','ABC-1','AD-1','DT-1'].includes(f.id));
(async()=>{const br=await chromium.launch();
 for(const f of FORMS){const log=[];const page=await br.newPage({viewport:{width:390,height:800}});L.wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+f.file,{waitUntil:'load'});await sleep(700);
  const tab=await page.$('#viewSeg button[data-view="walk"], [role=tab]:has-text("Walkthrough")');if(tab){await tab.click().catch(()=>{});await sleep(400);}
  const st=await page.$('.story[data-story]');if(st){const next=await st.$('[data-act="next"]');await next.click();await sleep(1200);}
  const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  const sc=await page.$('.story[data-story] .scene');const box=sc?await sc.boundingBox():null;
  console.log(f.id,'scroll/client',sw.join('/'),'scene box',box?Math.round(box.width)+'x'+Math.round(box.height):'-','errors',log.length);await page.close();}
 await br.close();})();
