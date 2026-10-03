/* engine checks: bin counts after each co step, reduced motion, first-frame render, job-aid stills, idle blink */
const {chromium,sleep}=require(__dirname+'/lib.js');
const U='http://127.0.0.1:8125/NBH-Workstation/Reinforcer_Assessment_Protocol.html';
(async()=>{const br=await chromium.launch();
 const page=await br.newPage({viewport:{width:1100,height:900}});const log=[];page.on('pageerror',e=>log.push(String(e.message).slice(0,200)));page.on('console',m=>{if(m.type()==='error')log.push(m.text().slice(0,160));});
 await page.goto(U);await sleep(500);await page.click('#viewSeg button[data-view="walk"]');await sleep(300);
 const root=await page.$('.story[data-story="co"]');await page.evaluate(r=>r.scrollIntoView({block:'center'}),root);await sleep(300);
 const next=await root.$('[data-act="next"]');const counts=[];
 for(let s=1;s<=9;s++){if(s>1){await next.click();await sleep(2300);}
   counts.push(await root.$eval('.scene',sc=>Array.from(sc.querySelectorAll('.ra-bin')).map(b=>b.querySelectorAll('.k1,.k2,.k3').length).join('/')+' held:'+(sc.querySelector('.ra-held').style.display!=='none')+' fly:'+(sc.querySelector('.ra-fly').style.display!=='none')+' tags:'+Array.from(sc.querySelectorAll('.ra-tag .t1')).map(t=>t.textContent).join(',')));}
 console.log('bins per step:',counts);
 /* blink and breath: lids change height over a second of idling */
 const lids=[];for(let i=0;i<120;i++){lids.push(await root.$eval('.scene .student .lid',l=>l.getAttribute('height')));await sleep(40);}
 console.log('lid max over 5s:',Math.max(...lids.map(Number)),'nonzero samples:',lids.filter(x=>+x>0).length);
 /* job-aid stills */
 const aids=await page.$$('#wk-aids .jp-scene svg, #wk-aids .jp-cover-scene svg');console.log('job-aid scenes drawn:',aids.length);
 /* Back then Next again (cancel mid-sequence) */
 const back=await root.$('[data-act="back"]');await back.click();await sleep(200);await next.click();await sleep(200);await back.click();await sleep(1500);
 console.log('after back/next/back: step',await root.$eval('.wk-at',e=>e.textContent));
 await page.close();
 /* reduced motion */
 const ctx=await br.newContext({reducedMotion:'reduce',viewport:{width:1100,height:900}});const p2=await ctx.newPage();const log2=[];p2.on('pageerror',e=>log2.push(String(e.message)));
 await p2.goto(U);await sleep(500);await p2.click('#viewSeg button[data-view="walk"]');await sleep(300);
 const r2=await p2.$('.story[data-story="co"]');const n2=await r2.$('[data-act="next"]');await n2.click();await sleep(50);
 console.log('RM: fill right after click:',await r2.$eval('.scene',sc=>Array.from(sc.querySelectorAll('.ra-bin')).map(b=>b.querySelectorAll('.k1,.k2,.k3').length).join('/')),'lids static:',await r2.$eval('.scene .student .lid',l=>l.getAttribute('height')));
 console.log('LOG',JSON.stringify(log),JSON.stringify(log2));await br.close();})();
