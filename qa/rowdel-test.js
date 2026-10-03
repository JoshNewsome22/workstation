const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const FORMS={
  'CF-1':{file:'CF-1_Contextual-Fit-Assessment_v2026-09.html',tables:[
    {id:'rTbl',arr:'raters',view:'setup',dep:p=>p.evaluate(()=>JSON.stringify(S.scores))},
    {id:'enhTbl',arr:'enh',view:'enh'}]},
  'SV-1':{file:'SV-1_Social-Validity_v2026-09.html',tables:[
    {id:'rTbl',arr:'resp',view:'setup',dep:p=>p.evaluate(()=>JSON.stringify([S.rat,S.open]))}]},
  'TE-1':{file:'TE-1_Token-Economy-Designer_v2026-09.html',tables:[
    {id:'thinTbl',arr:'thin',view:'sched'},{id:'bkTbl',arr:'bk',view:'gen'}]},
  'CT-1':{file:'CT-1_Caregiver-Training_v2026-09.html',tables:[
    {id:'goalTbl',arr:'goals',view:'goals'},
    {id:'stepTbl',arr:'steps',view:'train',dep:p=>p.evaluate(()=>JSON.stringify(S.cells)),lock:'#delStep'}]},
  'TI-1':{file:'TI-1_Treatment-Integrity-Observation_v2026-09.html',tables:[
    {id:'stepTbl',arr:'steps',view:'setup',dep:p=>p.evaluate(()=>JSON.stringify([S.cells,S.ioa,S.opp])),lock:'#delStep'}]},
  'ST-1':{file:'ST-1_Behavior-Skills-Training_v2026-09.html',tables:[
    {id:'stepTbl',arr:'steps',view:'steps',dep:p=>p.evaluate(()=>JSON.stringify(S.cells)),lock:'#delStep'}]},
  'PR-1':{file:'PR-1_Periodic-Plan-Review_v2026-09.html',tables:[
    {id:'dataTbl',arr:'rows',view:'data',bl:true},{id:'actTbl',arr:'act',view:'data'},{id:'fadeTbl',arr:'fade',view:'fade'}]},
};
const only=process.argv[2];
(async()=>{
  const br=await chromium.launch();let fails=0;
  for(const [id,F] of Object.entries(FORMS)){
    if(only&&only!==id)continue;
    const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
    const dialogs=[];page.removeAllListeners('dialog');page.on('dialog',d=>{dialogs.push(d.message());d.accept().catch(()=>{});});
    await page.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(400);
    await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};window.alert=m=>{(window.__alerts=window.__alerts||[]).push(String(m));};});   /* v21.34: the forms ask through nbhUI.confirm, which honours a stubbed window.confirm; a long alert would open the styled notice, which stays open until closed */
    const blankHead=await page.$$eval('th.nx',t=>t.length);
    await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
    const out=[`${id}: th.nx=${blankHead}`];
    for(const T of F.tables){
      const vb=await page.$(`#viewSeg button[data-view="${T.view}"]`);if(vb)await page.evaluate(v=>document.querySelector(`#viewSeg button[data-view="${v}"]`).click(),T.view);await sleep(150);
      const n0=await page.evaluate(a=>S[a].length,T.arr);
      const btns=await page.$$eval(`#${T.id} tbody .rowDel`,b=>b.length);
      const mid=T.bl?1:Math.floor(n0/2);
      const before=await page.evaluate(a=>JSON.parse(JSON.stringify(S[a])),T.arr);
      const depBefore=T.dep?await T.dep(page):null;
      // dependent data of the row after the deleted one, by key suffix/prefix
      await page.evaluate(([t,m])=>document.querySelector(`#${t} tbody .rowDel[data-di="${m}"]`).click(),[T.id,mid]);await sleep(250);
      const after=await page.evaluate(a=>JSON.parse(JSON.stringify(S[a])),T.arr);
      const expect=before.slice(0,mid).concat(before.slice(mid+1));
      const blankRow=o=>Object.values(o).every(v=>v===''||v===false);const okRows=JSON.stringify(after.slice(0,expect.length))===JSON.stringify(expect)&&after.slice(expect.length).every(blankRow);
      const rowsNow=await page.$$eval(`#${T.id} tbody .rowDel`,b=>b.length);
      let depOk='';
      if(T.dep){const depAfter=await T.dep(page);
        // every key with index>mid before must appear with index-1 after and the same value; keys at mid gone
        const chk=await page.evaluate(([b,a,m,form])=>{const B=JSON.parse(b),A=JSON.parse(a);let bad=[];
          const walk=(bo,ao,pos)=>{Object.keys(bo).forEach(k=>{const p=k.split('_');const idx=+p[pos];const other=pos===1?p[0]:p[1];
            if(idx===m){if(ao[k]!==undefined&&JSON.stringify(ao[k])===JSON.stringify(bo[k])&&!Object.keys(bo).some(x=>x===(pos===1?other+'_'+(m+1):(m+1)+'_'+other)))bad.push('kept '+k);return;}
            const nk=pos===1?other+'_'+(idx>m?idx-1:idx):(idx>m?idx-1:idx)+'_'+other;
            if(JSON.stringify(ao[nk])!==JSON.stringify(bo[k]))bad.push(k+'->'+nk+' '+JSON.stringify(bo[k])+' vs '+JSON.stringify(ao[nk]));});};
          if(form==='CF-1'){[1,2].forEach(n=>walk(B[n]||{},A[n]||{},1));}
          else if(form==='SV-1'){[0,1].forEach(q=>['pre','post'].forEach(r=>walk(B[q][r]||{},A[q][r]||{},1)));}
          else if(form==='CT-1'||form==='ST-1'){walk(B,A,0);}
          else if(form==='TI-1'){[0,1,2].forEach(q=>walk(B[q]||{},A[q]||{},0));}
          return bad;},[depBefore,depAfter,mid,id]);
        depOk=' dep:'+(chk.length?'BAD '+chk.slice(0,4).join('; '):'ok');}
      let lockOk='';
      if(T.lock){await page.evaluate(l=>{document.querySelector(l).disabled=true;},T.lock);const nL=await page.evaluate(a=>S[a].length,T.arr);
        await page.evaluate(t=>document.querySelector(`#${t} tbody .rowDel[data-di="0"]`).click(),T.id);await sleep(150);
        const nL2=await page.evaluate(a=>S[a].length,T.arr);await page.evaluate(l=>{document.querySelector(l).disabled=false;},T.lock);
        lockOk=' lock:'+(nL===nL2?'ok':'BAD');}
      let blOk='';
      if(T.bl){await page.evaluate(()=>document.querySelector('#dataTbl tbody .rowDel[data-di="0"]').click());await sleep(150);
        const r0=await page.evaluate(()=>S.rows[0]),n=await page.evaluate(()=>S.rows.length);
        blOk=' BLclear:'+(Object.values(r0).every(v=>v==='')&&n===after.length?'ok':'BAD');}
      // delete every row: the minimum survives
      let minOk='';
      for(let k=0;k<30;k++){const n=await page.evaluate(a=>S[a].length,T.arr);if(!n)break;
        await page.evaluate(t=>{const b=document.querySelector(`#${t} tbody .rowDel`);if(b)b.click();},T.id);await sleep(60);
        const n2=await page.evaluate(a=>S[a].length,T.arr);if(n2>=n){minOk=' min:'+n2;break;}}
      out.push(`  ${T.id}: rows ${n0}->${after.length} btns ${btns}->${rowsNow} mid=${mid} rowsOk=${okRows}${depOk}${lockOk}${blOk}${minOk}`);
      if(!okRows||/BAD/.test(depOk+lockOk+blOk))fails++;
    }
    // save + reopen round trip after the deletions
    await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
    await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);
    const saved=await page.evaluate(()=>window.__saved);
    const before=await page.evaluate(()=>JSON.stringify(S));
    await page.evaluate(()=>{S=blank();renderAll();});
    await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);
    await sleep(300);
    const after=await page.evaluate(()=>JSON.stringify(S));
    out.push(`  save/open identical: ${before===after} (${saved?saved.length:0} bytes)`);
    if(before!==after){fails++;const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))out.push('   differs: '+k+' '+JSON.stringify(a[k]).slice(0,120)+' VS '+JSON.stringify(b[k]).slice(0,120));}
    // print: the delete column is hidden
    await page.emulateMedia({media:'print'});
    const printed=await page.$$eval('th.nx,td.nx',c=>c.filter(x=>getComputedStyle(x).display!=='none').length);
    await page.emulateMedia({media:'screen'});
    out.push(`  print: nx cells visible=${printed}  dialogs=${dialogs.length+await page.evaluate(()=>(window.__dlg||[]).length)}  LOG=${JSON.stringify(log)}`);
    if(printed||log.length)fails++;
    console.log(out.join('\n'));
    await page.close();
  }
  await br.close();console.log(fails?'FAILURES: '+fails:'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
