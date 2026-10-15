/* the case map (v21.38; pass or fail since v22.12, review F505): every stage, every form a button that opens it */
const {chromium,BASE,wire,sleep,forms}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 await page.click('#caseMap');await sleep(400);
 const ids=forms().map(f=>f.id);
 const m=await page.evaluate(()=>({open:document.querySelector('#dlg').open,stages:document.querySelectorAll('.cm-stage').length,ids:[...new Set([...document.querySelectorAll('.cm-forms button')].map(b=>b.dataset.open))]}));
 ok('1 the case map opens with its eight stages and a button for every one of the '+ids.length+' forms',m.open&&m.stages===8&&ids.every(i=>m.ids.includes(i))&&m.ids.every(i=>ids.includes(i)),{stages:m.stages,missing:ids.filter(i=>!m.ids.includes(i)),unknown:m.ids.filter(i=>!ids.includes(i))});
 await page.click('.cm-forms button[data-open="TB-1"]');await sleep(1500);
 ok('2 a form\'s button closes the map and opens the form',!(await page.evaluate(()=>document.querySelector('#dlg').open))&&await page.evaluate(()=>state.cur)==='TB-1');
 await page.click('#caseMap');await sleep(300);
 ok('3 the map then marks the form as open',await page.evaluate(()=>document.querySelector('.cm-forms button[data-open="TB-1"]').classList.contains('on')));
 await page.keyboard.press('Escape');await page.click('#help');await sleep(200);
 ok('4 Help names the case map',await page.evaluate(()=>/Case map/.test(document.querySelector('#dlgBody').textContent)));
 ok('5 no page errors',!log.length,log);
 await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
