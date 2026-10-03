const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage();wire(page,log);
for(const [id,file] of [['TB-1','TB-1_Target-Behavior-Development_v2026-09.html'],['PA-1','PA-1_Preference-Assessment-Protocol_v2026-09.html']]){
  await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(600);await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);
  const r=await page.evaluate(()=>{try{const o=window.__nbhFactsOut();return JSON.stringify(o).slice(0,400);}catch(e){return 'ERR '+e.message+' '+e.stack.slice(0,200);}});
  console.log(id,r);
}
console.log('LOG',JSON.stringify(log.slice(0,5)));await br.close();})();
