/* v21.34 Task U: the nine parts-built forms ask through nbhUI.confirm (the styled #nbhUiDlg), not window.confirm.
   For each: the simulation loads through the dialog, a middle row of one table is deleted through the dialog's
   danger button, Cancel leaves the row, Clear all through the dialog empties the form, and nothing errors. */
const {chromium,BASE,wire,sleep}=require('./lib');
const FORMS=[
  {id:'SM-1',file:'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html',arr:'log',len:'S.log.length'},
  {id:'SA-1',file:'SA-1_Skill-Acquisition-Data_v2026-10.html',arr:'probes',len:'S.probes.length'},
  {id:'GC-1',file:'GC-1_Group-Contingencies_v2026-10.html',arr:'log',len:'S.log.length',who:'S.meta.cls'},
  {id:'SI-1',file:'SI-1_Student-Interview-and-Assent_v2026-10.html',arr:'al',len:'S.al.length'},
  {id:'DA-1',file:'DA-1_Demand-Assessment_v2026-10.html',arr:'sess',len:'S.sess.length'},
  {id:'HD-1',file:'HD-1_Home-Data-Sheets_v2026-10.html',arr:'ag',len:'S.ag.length'},
  {id:'CN-1',file:'CN-1_Consultation-Notes_v2026-10.html',arr:'nx',len:'S.notes[cur].next.length',pre:'cur=S.notes.map(n=>n.next.length).indexOf(Math.max(...S.notes.map(n=>n.next.length)));S.notes[cur].next.push({what:"Added by the check so the table has a middle row",who:"BCBA",when:"",done:false});renderNote();'},
  {id:'SR-1',file:'SR-1_Schedules-of-Reinforcement_v2026-10.html',arr:null,len:'0',noAsk:true},
  {id:'VS-1',file:'VS-1_Visual-Supports_v2026-10.html',arr:'cards',len:'S.cards.length'},
];
const only=process.argv[2];
(async()=>{
  const br=await chromium.launch();let fails=0;
  for(const F of FORMS){
    if(only&&only!==F.id)continue;
    const log=[],out=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
    let native=0;page.removeAllListeners('dialog');page.on('dialog',d=>{native++;d.accept().catch(()=>{});});
    const check=(ok,msg)=>{out.push((ok?'ok  ':'FAIL ')+msg);if(!ok)fails++;};
    const dlg=()=>page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return null;
      return {head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.className+':'+b.textContent)};});
    const press=sel=>page.evaluate(s=>{const b=document.querySelector('#nbhUiDlg '+s);if(!b)return false;b.click();return true;},sel);
    const cancel=()=>page.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiDlg #nbhUiF button')].find(x=>!x.className);if(!b)return false;b.click();return true;});
    await page.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(400);
    /* 1. the simulation loads through the dialog */
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(150);
    const who=F.who||'S.meta.client';
    let d=await dlg();
    if(F.noAsk)check(!d,'sim loads without a question (it never asked)');
    else{check(d&&/\?$/.test(d.head)&&d.btns.some(b=>/^primary:/.test(b)),'sim asks through the dialog: '+JSON.stringify(d));await press('.primary');}
    await sleep(600);
    /* the simulation ends with a long alert(), which the shared block shows as a styled notice: dismiss it */
    d=await dlg();if(d&&d.btns.length===1){out.push('     (notice after Load: '+d.head.slice(0,60)+'...)');await press('.primary');await sleep(150);}
    check(!(await dlg()),'dialog closed after Load');
    check(/SIMULATED/.test(await page.evaluate(who)||''),'simulation loaded');
    if(F.pre)await page.evaluate(F.pre);
    /* 2. a middle row deleted through the danger button; Cancel leaves it */
    if(F.arr){
      const n0=await page.evaluate(F.len);const mid=Math.floor(n0/2);
      check(n0>=3,`${F.arr}: ${n0} rows before`);
      const has=await page.evaluate(([a,m])=>!!document.querySelector(`.rowDel[data-del="${a}"][data-i="${m}"]`),[F.arr,mid]);check(has,'middle row has a delete control');
      await page.evaluate(([a,m])=>document.querySelector(`.rowDel[data-del="${a}"][data-i="${m}"]`).click(),[F.arr,mid]);await sleep(150);
      d=await dlg();check(d&&/\?$/.test(d.head)&&d.btns.some(b=>/^danger:/.test(b)),'row delete asks: '+JSON.stringify(d));
      check(await cancel(),'Cancel pressed');await sleep(150);
      check(!(await dlg())&&await page.evaluate(F.len)===n0,'Cancel leaves the row ('+await page.evaluate(F.len)+')');
      await page.evaluate(([a,m])=>document.querySelector(`.rowDel[data-del="${a}"][data-i="${m}"]`).click(),[F.arr,mid]);await sleep(150);
      check(await press('.danger'),'danger pressed');await sleep(250);
      const n1=await page.evaluate(F.len);check(n1===n0-1,`row deleted through the dialog: ${n0} -> ${n1}`);
      check(!(await dlg()),'dialog closed after delete');
    }
    /* 3. Clear all through the dialog */
    await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(150);
    d=await dlg();check(d&&/^Clear every entry on this form\?$/.test(d.head)&&d.btns.some(b=>b==='danger:Clear all'),'Clear all asks: '+JSON.stringify(d));
    check(await cancel(),'Cancel pressed');await sleep(150);
    check(/SIMULATED/.test(await page.evaluate(who)||''),'Cancel keeps the data');
    await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(150);
    await press('.danger');await sleep(400);
    check(!(await page.evaluate(who))&&!(await dlg()),'Clear all through the dialog works');
    check(native===0,'no native confirm/alert dialog opened ('+native+')');
    const errs=log.filter(l=>l.type==='pageerror'||l.type==='error');check(errs.length===0,'no console or page error: '+JSON.stringify(errs).slice(0,300));
    console.log(F.id+'\n  '+out.join('\n  '));
    await page.close();
  }
  await br.close();console.log(fails?`FAILS: ${fails}`:'ALL OK');process.exit(fails?1:0);
})();
