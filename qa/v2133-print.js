const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();
 for(const [f,tbl] of [['MT-1_Discontinuous-Measurement_v2026-09.html','#sessTbl'],['IN-1_Stakeholder-Interview-Record_v2026-09.html','#respTbl'],['BC-1_Behavioral-Contrast_v2026-09.html','#dataTbl'],['RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html','#chTbl']]){
  const log=[];const page=await br.newPage({viewport:{width:1200,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+f);await sleep(500);
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  const scr=await page.evaluate(t=>({th:getComputedStyle(document.querySelector(t+' th.nx')).display,td:getComputedStyle(document.querySelector(t+' td.nx')).display,w:document.querySelector(t+' td.nx').getBoundingClientRect().width}),tbl);
  await page.emulateMedia({media:'print'});
  const pr=await page.evaluate(t=>({th:getComputedStyle(document.querySelector(t+' th.nx')).display,td:getComputedStyle(document.querySelector(t+' td.nx')).display,btn:getComputedStyle(document.querySelector(t+' .rowDel')).display}),tbl);
  console.log(f.slice(0,4),'screen',JSON.stringify(scr),'print',JSON.stringify(pr),log.length?'ERR '+JSON.stringify(log):'');
  await page.close();}
 await br.close();})();
