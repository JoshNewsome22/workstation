const {chromium,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/pnav/shots';
const B='http://127.0.0.1:8125/NBH-Workstation/';
(async()=>{const br=await chromium.launch();
 const shot=async(file,name,vw,steps)=>{const page=await br.newPage({viewport:{width:vw,height:900}});await page.goto(B+file);await sleep(500);
   for(let i=0;i<(steps||0);i++){await page.click('.nbh-pn-next');await sleep(150);}
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(200);
   const r=await page.evaluate(()=>{const n=document.querySelector('.nbh-pagenav');const b=n.getBoundingClientRect();return{x:Math.round(b.x),w:Math.round(b.width),bottom:Math.round(b.bottom)};});
   await page.screenshot({path:`${OUT}/${name}.png`,clip:{x:0,y:Math.max(0,900-260),width:vw,height:260}});
   console.log(name,JSON.stringify(r));
   if(name==='cf1-print'){await page.emulateMedia({media:'print'});await sleep(100);console.log('bar in print DOM:',!!(await page.$('.nbh-pagenav')));await page.emulateMedia({media:'screen'});await sleep(100);console.log('bar back:',!!(await page.$('.nbh-pagenav')));}
   await page.close();};
 await shot('CF-1_Contextual-Fit-Assessment_v2026-09.html','cf1-print',1440,1);
 await shot('Daily_Behavior_Data_and_Visual_Analysis.html','dd1',1440,0);
 await shot('ABC_Recording_Conditional_Probability_Analysis.html','abc',1440,2);
 await shot('TD-1_Function-Based-Treatment-Developer_v2026-09.html','td1',1440,3);
 await shot('CF-1_Contextual-Fit-Assessment_v2026-09.html','cf1-phone',390,1);
 // inside the workstation
 const page=await br.newPage({viewport:{width:1440,height:900}});await page.goto(B+'index.html');await sleep(600);
 await page.click('text=Contextual Fit');await sleep(1500);
 const fr=page.frames().find(f=>/CF-1/.test(f.url()));await fr.click('.nbh-pn-next');await sleep(200);
 await fr.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(200);
 await page.screenshot({path:`${OUT}/shell.png`});
 await br.close();})();
