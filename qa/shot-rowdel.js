const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});const log=[];wire(page,log);
 const shots=[['CF-1_Contextual-Fit-Assessment_v2026-09.html','setup','#rTbl'],['PR-1_Periodic-Plan-Review_v2026-09.html','ev','#dataTbl'],['TE-1_Token-Economy-Designer_v2026-09.html','gen','#bkTbl']];
 for(const [f,v,sel] of shots){await page.goto(BASE+'/NBH-Workstation/'+f);await sleep(300);await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(300);
  await page.evaluate(v=>{const b=document.querySelector(`#viewSeg button[data-view="${v}"]`);if(b)b.click();},v);await sleep(200);
  const el=await page.$(sel);await el.hover();const b=await page.$(sel+' tbody .rowDel');if(b)await b.hover();await sleep(100);
  await el.screenshot({path:__dirname+'/out/r/'+f.slice(0,4)+'.png'});
  const st=await page.$eval(sel+' tbody .rowDel',b=>{const c=getComputedStyle(b);return [c.fontSize,c.color,c.border,c.background.slice(0,40),c.padding,b.offsetWidth+'x'+b.offsetHeight].join(' | ');});
  console.log(f.slice(0,4),st);}
 await page.setViewportSize({width:390,height:800});await page.goto(BASE+'/NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html');await sleep(300);
 console.log('phone scroll/client',await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]));
 console.log('LOG',JSON.stringify(log));await br.close();})();
