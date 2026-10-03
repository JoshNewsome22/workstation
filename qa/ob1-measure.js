const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const S=__dirname+'/out';
const urls=[BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html','file://'+S+'/ob1-ioa/OB-1_pre-edit.html'];
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 for(const url of urls){for(const sim of [false,true]){const page=await ctx.newPage();await page.goto(url);await sleep(500);
  if(sim){await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(500);}
  await page.emulateMedia({media:'print'});await sleep(300);
  const r=await page.evaluate(()=>{const out=[];const els=[...document.querySelectorAll('#setup,#obsPages .obs-page,#summary,#guide,#guide .warn,#guide h3,#obsPages .obs-page > *')];
    for(const e of els){const b=e.getBoundingClientRect();out.push([(e.id||e.className||e.tagName).toString().slice(0,28),Math.round(b.top+scrollY),Math.round(b.height)]);}return out;});
  await page.pdf({path:S+'/ob1-ioa/'+(url.includes('pre-edit')?'pre':'now')+(sim?'-sim':'-blank')+'.pdf',preferCSSPageSize:true,printBackground:true});
  console.log(url.replace(/.*\//,''),sim?'sim':'blank',JSON.stringify(r));await page.close();}}
 await br.close();})();
