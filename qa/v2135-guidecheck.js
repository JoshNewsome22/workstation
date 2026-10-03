const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const F=[['TB-1','TB-1_Target-Behavior-Development_v2026-09.html','guide','#guide'],['OB-1','OB-1_Direct-Observation-Record_v2026-09.html','guide','#guide'],['IN-1','IN-1_Stakeholder-Interview-Record_v2026-09.html','guide','section.only-guide'],['MT-1','MT-1_Discontinuous-Measurement_v2026-09.html','guide','section.only-guide'],['SP-1','Scatterplot_Pattern_Analysis.html','control','#ctlMethod']];
(async()=>{const br=await chromium.launch();
 for(const [id,file,view,sel] of F){const log=[];const ctx=await br.newContext();const page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;});
  if(id==='SP-1'){await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(800);}
  await page.evaluate(v=>{const b=document.querySelector('#viewSeg [data-view="'+v+'"]');if(b)b.click();},view);await sleep(400);
  const r=await page.evaluate(s=>{const el=document.querySelector(s);if(!el)return {missing:true};const t=el.innerText;const i=t.search(/About the simulation/i);const vis=!!(el.offsetParent||el.getClientRects().length);return {vis,found:i>=0,snippet:t.slice(i,i+160).replace(/\s+/g,' '),refsAfter:t.search(/Reference list|REFERENCES|Cooper, J\. O\./)>i};},sel);
  console.log(id,JSON.stringify(r),'errors',log.length);await ctx.close();}
 await br.close();})();
