const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(600);await page.click('#help');await sleep(300);
 console.log(await page.evaluate(()=>({open:$('#dlg').open,words:$('#dlgBody').textContent.split(/\s+/).length,visibleWords:[...$('#dlgBody').querySelectorAll('.hp-lead,.hp-steps,summary,.note')].map(e=>e.textContent).join(' ').split(/\s+/).length,details:document.querySelectorAll('#dlgBody details').length,steps:document.querySelectorAll('#dlgBody .hp-steps li').length})));
 await page.screenshot({path:__dirname+'/out/due/help.png'});
 console.log('due fns',await page.evaluate(()=>typeof gatherDue+' '+typeof paintDue+' '+typeof parseDue(new Date().toISOString().slice(0,10))));
 console.log('LOG',JSON.stringify(log).slice(0,300));await br.close();})();
