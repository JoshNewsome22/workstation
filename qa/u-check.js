/* v21.34 Task U: the styled question dialog on the 14 converted forms.
   For each: the simulation loads through the dialog; a middle row of one table is deleted through it
   (Cancel leaves the row, the .danger button deletes it); Clear all through it works; no console or page error. */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS=[
 {id:'OB-1',file:'OB-1_Direct-Observation-Record_v2026-09.html',view:'obs',del:'.obs-page button.delRow[data-obs="0"][data-row="1"]',len:'state.obs[0].narrative.length',cleared:'state.obs.length===0'},
 {id:'PR-1',file:'PR-1_Periodic-Plan-Review_v2026-09.html',view:'dec',del:'#actTbl .rowDel[data-di="1"]',len:'S.act.length'},
 {id:'PA-1',file:'PA-1_Preference-Assessment-Protocol_v2026-09.html',view:'ps',del:'#psGen',len:'[...document.querySelectorAll("#psTbl select[data-f=sel]")].filter(s=>s.value).length',after:(a,b)=>a>0&&b===0,what:'scored PS trials (regenerate)'},
 {id:'CT-1',file:'CT-1_Caregiver-Training_v2026-09.html',view:'goals',del:'#goalTbl .rowDel[data-di="1"]',len:'S.goals.length'},
 {id:'CR-1',file:'CR-1_Crisis-Intervention-Plan_v2026-09.html',view:'log',del:'#logTbl .rowDel[data-rdel="log"][data-i="1"]',len:'S.log.length'},
 {id:'TI-1',file:'TI-1_Treatment-Integrity-Observation_v2026-09.html',view:'setup',del:'#stepTbl .rowDel[data-di="3"]',len:'S.steps.length'},
 {id:'ST-1',file:'ST-1_Behavior-Skills-Training_v2026-09.html',view:'steps',del:'#stepTbl .rowDel[data-di="3"]',len:'S.steps.length'},
 {id:'RA-1',file:'Reinforcer_Assessment_Protocol.html',view:'co',del:'#coaLib button[data-rm="1"]',len:'document.querySelectorAll("#coaLib tbody tr").length'},
 {id:'MT-1',file:'MT-1_Discontinuous-Measurement_v2026-09.html',view:'log',del:'#sessTbl .rowDel[data-del="3"]',len:'S.sess.length'},
 {id:'CF-1',file:'CF-1_Contextual-Fit-Assessment_v2026-09.html',view:'enh',del:'#enhTbl .rowDel[data-di="1"]',len:'S.enh.length'},
 {id:'RR-1',file:'RR-1_Records-Review_v2026-09.html',view:'removals',del:'#removals .rl-row:nth-child(2) [data-act="del"]',len:'document.querySelectorAll("#rlRows .rl-row").length'},
 {id:'IN-1',file:'IN-1_Stakeholder-Interview-Record_v2026-09.html',view:'setup',del:'#respTbl .rowDel[data-del="2"]',len:'S.resp.length'},
 {id:'FS-1',file:'FS-1_FBA-Summary-Report_v2026-09.html',view:'ev',del:'#srcTbl .rowDel[data-del="1"]',len:'S.src.length'},
 {id:'EA-1',file:'EA-1_Experimental-Analysis-Protocol_v2026-09.html',view:'conditions',del:'#loadTpl',len:'document.querySelectorAll("#condWrap .card, [name^=\\"c[\\"]").length',after:(a,b)=>b>0,what:'condition cards (replace with the template)'},
];
const only=process.argv[2];
let fails=0;const check=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++;};
const dlg=p=>p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return null;return {head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent.slice(0,80),btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.className+':'+b.textContent)};});
const press=(p,sel)=>p.evaluate(s=>{const b=document.querySelector('#nbhUiDlg '+s);if(!b)throw new Error('no dialog button '+s);b.click();},sel);
const click=(p,sel)=>p.evaluate(s=>{const el=document.querySelector(s);if(!el)throw new Error('no '+s);el.click();},sel);
const filled=p=>p.evaluate(()=>[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=number]):not([type=file]), textarea')].filter(e=>!e.closest('.toolbar,#nbhUiDlg,#nbhCaseDlg,.nbh-pagenav')&&String(e.value).trim()).length);
(async()=>{
 const br=await chromium.launch();
 for(const F of FORMS){
  if(only&&only!==F.id)continue;
  console.log('\n=== '+F.id);
  const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  const native=[];page.removeAllListeners('dialog');page.on('dialog',d=>{native.push(d.message());d.dismiss().catch(()=>{});});
  await page.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(600);
  check(await page.evaluate(()=>typeof window.nbhUI==='object'&&typeof nbhUI.confirm==='function'),'nbhUI present');
  /* simulation through the dialog */
  await click(page,'#simBtn');await sleep(150);
  let d=await dlg(page);
  if(d){check(/\?$/.test(d.head)&&d.btns.some(b=>/^primary/.test(b)),'simulation asks through the styled dialog: '+JSON.stringify(d.head)+' / '+JSON.stringify(d.btns));await press(page,'.primary');}
  else console.log('  note  the simulation loads without a question on this form (it asks only over entries, or not at all)');
  await sleep(700);
  const f1=await filled(page);check(f1>5,'simulation loaded ('+f1+' filled fields)');
  if(F.view)await page.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},F.view);await sleep(200);
  /* delete: Cancel leaves it */
  const n0=await page.evaluate(F.len);
  await click(page,F.del);await sleep(150);
  d=await dlg(page);check(!!d&&d.btns.some(b=>/^danger/.test(b)),'delete asks with a danger button: '+(d?JSON.stringify(d.head)+' / '+JSON.stringify(d.btns):'no dialog'));
  await press(page,'button:not(.danger):not(.primary)');await sleep(250);
  check(await page.evaluate(F.len)===n0&&!(await dlg(page)),'Cancel leaves the row ('+n0+')');
  /* delete through the danger button */
  await click(page,F.del);await sleep(150);await press(page,'.danger');await sleep(350);
  const n1=await page.evaluate(F.len);
  check(F.after?F.after(n0,n1):n1===n0-1,(F.what||'row count')+' '+n0+' -> '+n1);
  /* Clear all: Cancel keeps, then the danger button clears */
  await click(page,'#clearBtn');await sleep(150);
  d=await dlg(page);check(!!d&&/^Clear/.test(d.head)&&d.btns.some(b=>/^danger:Clear all/.test(b)),'Clear all asks: '+(d?JSON.stringify(d.head)+' / '+JSON.stringify(d.btns):'no dialog'));
  const f1b=await filled(page);await press(page,'button:not(.danger):not(.primary)');await sleep(250);
  check(await filled(page)===f1b,'Cancel keeps the entries ('+await filled(page)+')');
  await click(page,'#clearBtn');await sleep(150);await press(page,'.danger');await sleep(500);
  const f2=await filled(page);
  check(f2<Math.max(3,f1/4)&&(!F.cleared||await page.evaluate(F.cleared)),'Clear all cleared the form ('+f1+' -> '+f2+' filled fields)');
  check(native.length===0,'no native confirm dialog appeared ('+native.length+')');
  const errs=log.filter(x=>x.type!=='warning');
  check(errs.length===0,'no console or page error'+(errs.length?': '+JSON.stringify(errs.slice(0,3)):''));
  await page.close();
 }
 await br.close();console.log('\n'+(fails?fails+' FAIL':'ALL OK'));process.exit(fails?1:0);
})();
