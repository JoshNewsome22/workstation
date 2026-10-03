const {chromium,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1100,height:900}});const log=[];page.on('pageerror',e=>log.push(String(e.message).slice(0,200)));
 await page.addInitScript(()=>{window.print=function(){window.__printed=true;};});
 await page.goto('http://127.0.0.1:8125/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(500);await page.click('#viewSeg button[data-view="walk"]');await sleep(300);
 await page.click('#wk-print');await sleep(1500);
 const n=await page.$$eval('#wk-aids svg.tbl',s=>s.length);console.log('job-aid scenes:',n,'printing class:',await page.evaluate(()=>document.body.classList.contains('wk-printing')));
 await page.emulateMedia({media:'print'});await sleep(300);
 const buf=await page.pdf({format:'Letter',printBackground:true});require('fs').writeFileSync(__dirname+'/out/anim/v2/aids.pdf',buf);
 console.log('pdf bytes',buf.length,'LOG',JSON.stringify(log));await br.close();})();
