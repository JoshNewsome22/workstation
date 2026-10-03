/* v21.35: simulation loads quietly — toast shown, no notice dialog, no errors, PDF page count */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS={'DM-1':'DM-1_Student-Demographics-and-Profile_v2026-09.html','IC-1':'IC-1_Informed-Consent-FBA-BIP_v2026-09.html','RR-1':'RR-1_Records-Review_v2026-09.html','TB-1':'TB-1_Target-Behavior-Development_v2026-09.html','IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','IN-1':'IN-1_Stakeholder-Interview-Record_v2026-09.html','OB-1':'OB-1_Direct-Observation-Record_v2026-09.html','ABC-1':'ABC_Recording_Conditional_Probability_Analysis.html','SP-1':'Scatterplot_Pattern_Analysis.html','DD-1':'Daily_Behavior_Data_and_Visual_Analysis.html','MT-1':'MT-1_Discontinuous-Measurement_v2026-09.html'};
const only=process.argv.slice(3);
(async()=>{const br=await chromium.launch();const label=process.argv[2]||'run';
 for(const [id,file] of Object.entries(FORMS)){ if(only.length&&!only.includes(id))continue;
  const log=[];const ctx=await br.newContext({viewport:{width:1440,height:1000}});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(900);
  await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};});
  const btn=await page.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(!b)return null;b.click();return b.id;});
  await sleep(1500);
  const r=await page.evaluate(()=>({toasts:[...document.querySelectorAll('#nbhToasts .nbh-toast')].map(t=>t.textContent.replace(/×$/,'').trim()),dlgOpen:!!document.querySelector('#nbhUiDlg[open]'),dlgHead:(document.querySelector('#nbhUiH')||{}).textContent||'',confirms:(window.__dlg||[]).length,bodyClass:document.body.className}));
  const buf=await page.pdf({format:'Letter',printBackground:true});
  const pages=(buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)||[]).length;
  console.log(JSON.stringify({label,id,btn,toasts:r.toasts,dlgOpen:r.dlgOpen,dlgHead:r.dlgHead.slice(0,80),confirms:r.confirms,errors:log.map(e=>e.type+': '+e.text.slice(0,120)),pdfPages:pages}));
  await ctx.close();
 }
 await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
