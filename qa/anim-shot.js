const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});
 await page.goto(BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(500);
 const b=await page.$('#viewSeg button[data-view="walk"],#viewSeg button:last-child');await b.click();await sleep(400);
 const st=await page.$$('.story');console.log('stories',st.length);
 for(let i=0;i<st.length;i++){await st[i].scrollIntoViewIfNeeded();await sleep(300);
   const play=await st[i].$('button');if(play){await play.click().catch(()=>{});await sleep(1800);}
   await st[i].screenshot({path:`${__dirname}/out/anim/story-${i}.png`});}
 await br.close();})();
