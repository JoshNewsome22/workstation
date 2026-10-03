const {chromium,sleep}=require(__dirname+'/lib.js');
(async()=>{const br=await chromium.launch();
 for(const f of ['ABC_Recording_Conditional_Probability_Analysis.html','Daily_Behavior_Data_and_Visual_Analysis.html']){
  const page=await br.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e.message)));
  await page.goto('http://127.0.0.1:8125/NBH-Workstation/'+f);await sleep(500);
  console.log(f, await page.evaluate(()=>({tabs:document.querySelectorAll('[role=tab]').length,seg:!!document.querySelector('#viewSeg'),
    sheets:Array.from(document.querySelectorAll('.sheet:not(table)')).map(s=>s.tagName+'#'+s.id+' parent='+s.parentNode.tagName),
    polish:!!window.nbhPolish, bar:!!document.querySelector('.nbh-pagenav'),
    tabsel:Array.from(document.querySelectorAll('[role=tab]')).map(t=>t.getAttribute('aria-selected')).join(',')})), errs);
  await page.close();}
 await br.close();})();
