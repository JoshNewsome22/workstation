const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});const log=[];wire(page,log);await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(800);
 console.log(await page.evaluate(()=>{const g=id=>({hidden:$(id).hidden,display:getComputedStyle($(id)).display});return {sum:g('#barSum'),fold:g('#barFold'),edit:g('#barEdit'),body:document.body.className,client:JSON.stringify($('#pClient').value)};}));
 console.log('LOG',JSON.stringify(log).slice(0,200));await br.close();})();
