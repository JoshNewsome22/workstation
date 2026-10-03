const {chromium,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');const DIR=__dirname+'/out/anim/video';
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:900,height:420},recordVideo:{dir:DIR,size:{width:900,height:420}}});const page=await ctx.newPage();
 await page.goto('http://127.0.0.1:8125/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(600);await page.click('#viewSeg button[data-view="walk"]');await sleep(300);
 const root=await page.$('.story[data-story="co"]');
 /* show only the scene and its caption: scroll the scene to the top of a short window */
 await page.evaluate(r=>{const sc=r.querySelector('.scene');const y=sc.getBoundingClientRect().top+window.scrollY-6;window.scrollTo(0,y);document.querySelector('.toolbar').style.visibility='hidden';},root);
 await sleep(800);
 const play=await root.$('[data-act="play"]');await play.click();await sleep(9*3600+800);
 await ctx.close();const v=fs.readdirSync(DIR).find(f=>f.endsWith('.webm'));fs.renameSync(DIR+'/'+v,DIR+'/concurrent-operants-pilot.webm');console.log('video',fs.statSync(DIR+'/concurrent-operants-pilot.webm').size);await br.close();})();
