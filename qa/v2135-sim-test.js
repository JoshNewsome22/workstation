/* quiet simulations (v21.35; pass or fail since v22.12, review F505): in these forms Load simulation fills the form
   without an alert or a question left open, with no page error, and the form still prints. (Until v22.12 this compared
   with a copy of the forms before v21.35 that is no longer kept.) */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS=['PD-1_Performance-Diagnostic-Checklist_v2026-09.html','RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html','PR-1_Periodic-Plan-Review_v2026-09.html','CR-1_Crisis-Intervention-Plan_v2026-09.html','CT-1_Caregiver-Training_v2026-09.html','EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html','Delay-Tolerance-Protocol-Toolkit.html','AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html','TE-1_Token-Economy-Designer_v2026-09.html','BC-1_Behavioral-Contrast_v2026-09.html','MS-1_Medication-Side-Effect-Monitoring_v2026-09.html'];
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
function pdfPages(buf){const m=buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);return m?m.length:0;}
(async()=>{const br=await chromium.launch();
  for(const f of FORMS){const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
    await page.goto(BASE+'/NBH-Workstation/'+f);await sleep(500);
    await page.evaluate(()=>{window.confirm=()=>true;window.__alerts=[];const ua=window.alert;window.alert=m=>{window.__alerts.push(String(m));return ua(m);};});
    const sim=await page.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim');if(!b)return null;b.click();return b.id;});
    await sleep(900);
    const dlg=await page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return !!d&&d.open;});
    const alerts=await page.evaluate(()=>window.__alerts);
    await page.emulateMedia({media:'print'});const pages=pdfPages(await page.pdf({format:'Letter',printBackground:true}));
    ok(f.slice(0,f.indexOf('_')>0?f.indexOf('_'):12)+': the simulation loads quietly (no alert, no question open, no error) and the form prints',!!sim&&!alerts.length&&!dlg&&!log.length&&pages>0,{sim,alerts,dlg,log,pages});
    await page.close();}
  await br.close(); console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
