const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS=['PD-1_Performance-Diagnostic-Checklist_v2026-09.html','RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html','PR-1_Periodic-Plan-Review_v2026-09.html','CR-1_Crisis-Intervention-Plan_v2026-09.html','CT-1_Caregiver-Training_v2026-09.html','EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html','Delay-Tolerance-Protocol-Toolkit.html','AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html','TE-1_Token-Economy-Designer_v2026-09.html','BC-1_Behavioral-Contrast_v2026-09.html','MS-1_Medication-Side-Effect-Monitoring_v2026-09.html'];
const OUT=__dirname+'/out/v2135';
fs.mkdirSync(OUT,{recursive:true});
function pdfPages(buf){const m=buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);return m?m.length:0;}
(async()=>{
  const br=await chromium.launch();
  for(const f of FORMS){
    const row={form:f};
    for(const [tag,url] of [['before',BASE+'/qa/tmp-v2135/'+f],['after',BASE+'/NBH-Workstation/'+f]]){
      const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
      await page.goto(url);await sleep(500);
      await page.evaluate(()=>{window.confirm=()=>true;window.__alerts=[];const ua=window.alert;window.alert=m=>{window.__alerts.push(String(m));return ua(m);};});
      const sim=await page.evaluate(()=>{const b=document.querySelector('#simBtn,#btnSim');if(!b)return null;b.click();return b.id;});
      await sleep(900);
      const toast=await page.evaluate(()=>{const els=Array.from(document.querySelectorAll('[class*="toast"],[id*="toast"],[class*="nbh-ui"],[id*="nbhUi"]'));return els.filter(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none').map(e=>(e.id||e.className)+': '+e.textContent.trim().slice(0,160));});
      const dlg=await page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d)return 'none';const open=d.hasAttribute('open')||getComputedStyle(d).display!=='none';return open?('OPEN: '+d.textContent.trim().slice(0,120)):'closed';});
      const alerts=await page.evaluate(()=>window.__alerts);
      await page.emulateMedia({media:'print'});
      const pdf=await page.pdf({format:'Letter',printBackground:true});
      row[tag]={sim,toast,dlg,alerts,pdfPages:pdfPages(pdf),errors:log};
      await page.close();
    }
    console.log(JSON.stringify(row));
  }
  await br.close();
})();
