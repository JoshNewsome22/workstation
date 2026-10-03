const {chromium,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();
 for(const f of ['ABC_Recording_Conditional_Probability_Analysis.html','Daily_Behavior_Data_and_Visual_Analysis.html']){
  const page=await br.newPage();await page.goto('http://127.0.0.1:8125/NBH-Workstation/'+f);await sleep(500);
  console.log(f, await page.evaluate(()=>({main:Array.from(document.querySelectorAll('main')).map(m=>m.className+' parent='+m.parentNode.tagName+'.'+m.parentNode.className),
    anySheet:document.querySelectorAll('.sheet').length, panels:Array.from(document.querySelectorAll('[role=tabpanel]')).map(p=>p.id+':'+p.className+':'+p.parentNode.tagName).slice(0,4)})));
  await page.close();}
 await br.close();})();
