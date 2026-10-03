/* anim-rollout.js <form file> <label>: open the form from the test copy, step every walkthrough story on the
   new engine, log script errors, keep one mid-motion frame per story and tile them */
const {chromium,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
const file=process.argv[2],label=process.argv[3];const OUT=__dirname+'/out/anim/v2/'+label;fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1100,height:900}});const log=[];
 page.on('console',m=>{if(m.type()==='error')log.push(m.text().slice(0,160));});page.on('pageerror',e=>log.push('PAGEERROR '+String(e.message).slice(0,200)));
 await page.goto('http://127.0.0.1:8125/NBH-Workstation/'+file);await sleep(700);
 const tab=await page.$('#viewSeg button[data-view="walk"], [role=tab]:has-text("Walkthrough"), [role=tab]:has-text("walkthrough")');
 if(tab)await tab.click();await sleep(500);
 const stories=await page.$$('.story[data-story]');const names=[];
 for(const st of stories){const key=await st.getAttribute('data-story');names.push(key);
   await page.evaluate(r=>r.querySelector('.scene').scrollIntoView({block:'center'}),st);await sleep(200);
   const next=await st.$('[data-act="next"]');const n=await st.$$eval('ol.storysteps li',l=>l.length);
   const mid=Math.max(1,Math.floor(n/2));
   for(let i=1;i<n;i++){await next.click();if(i===mid){await sleep(900);await (await st.$('.scene')).screenshot({path:`${OUT}/${key}.png`});}else await sleep(140);}
   await sleep(1600);await (await st.$('.scene')).screenshot({path:`${OUT}/${key}-end.png`});}
 const drill=await page.$('.scene[data-scene="drill"] svg.tbl');
 console.log(label,'stories',names.join(','),'drill',!!drill,'ERRORS',JSON.stringify(log.slice(0,6)));
 await br.close();})();
