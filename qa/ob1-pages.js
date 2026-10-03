/* page counts of OB-1's print: blank form, and with the simulation; URL from argv (http or file) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const url=process.argv[2]||(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');
const pages=buf=>{const s=buf.toString('latin1');const m=s.match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);
 await page.goto(url);await sleep(700);
 await page.emulateMedia({media:'print'});await sleep(300);
 const blank=pages(await page.pdf({preferCSSPageSize:true,printBackground:true}));
 await page.emulateMedia({media:'screen'});
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
 await page.emulateMedia({media:'print'});await sleep(300);
 const sim=pages(await page.pdf({preferCSSPageSize:true,printBackground:true}));
 console.log('print pages',JSON.stringify({url:url.replace(/.*\//,''),blank,sim,log:log.length?log:undefined}));
 await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
