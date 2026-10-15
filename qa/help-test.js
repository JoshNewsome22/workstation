/* Help (v21.35; pass or fail since v22.12, review F505): it opens with the short steps and folded sections, and the
   due-date reader the bar uses is there */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(600);await page.click('#help');await sleep(300);
 const h=await page.evaluate(()=>({open:$('#dlg').open,visibleWords:[...$('#dlgBody').querySelectorAll('.hp-lead,.hp-steps,summary,.note')].map(e=>e.textContent).join(' ').split(/\s+/).length,details:document.querySelectorAll('#dlgBody details').length,openDetails:document.querySelectorAll('#dlgBody details[open]').length,steps:document.querySelectorAll('#dlgBody .hp-steps li').length}));
 ok('1 Help opens with five steps and its sections folded (at least 12), short enough to read at a glance (under 450 words shown)',h.open&&h.steps===5&&h.details>=12&&h.openDetails===0&&h.visibleWords<450,h);
 ok('2 the bar\'s due-date reader is there',await page.evaluate(()=>typeof gatherDue==='function'&&typeof paintDue==='function'&&typeof parseDue(new Date().toISOString().slice(0,10))==='object'));
 ok('3 no page errors',!log.length,log);
 await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
