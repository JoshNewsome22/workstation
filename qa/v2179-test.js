/* v21.79 the caseload: each Save case keeps that student's case on this device; Caseload lists them (the most urgent first),
   what needs you across them, Initials only, opens a student's case from its copy, Remove, and "Do not keep cases".
   Simulated students only (Mateo Rivera; SIMULATED – Sample Student). usage: node qa/v2179-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};try{localStorage.removeItem('nbh.caseload.off');localStorage.removeItem('nbh.caseload.ini');}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  const student=async(name,sid,site)=>{await page.fill('#pClient',name);await page.dispatchEvent('#pClient','input');await page.fill('#pSid',sid);await page.fill('#pSite',site);
    await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1500);
    const fr=page.frames().find(f=>/Daily_Behavior/.test(f.url()));await fr.evaluate(async()=>{try{nbhUI.confirm=async()=>true;}catch(e){}const b=document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b)b.click();});await sleep(2000);
    await page.evaluate(async()=>{await gatherFacts(false);});const [dl]=await Promise.all([page.waitForEvent('download',{timeout:30000}),page.evaluate(()=>saveCase())]);await sleep(800);};
  await student('Mateo Rivera','4471823','Royal Palm School');
  await page.evaluate(async()=>{await clearCase();});await sleep(800);
  await student('SIMULATED – Sample Student','SIM-000','Sample Elementary');
  const L=await page.evaluate(async()=>(await clList()).map(r=>({client:r.client,sid:r.sid,items:(r.sum.items||[]).length,last:r.sum.lastData,len:r.text.length,form:JSON.parse(r.text).form})));
  ok('two Save case: two students kept on this device, each with its case and a summary (the last day of data from DD-1)',L.length===2&&L.every(r=>r.form==='CASE'&&r.len>1000&&/^\d{4}-\d\d-\d\d$/.test(r.last||''))&&L.some(r=>r.client==='Mateo Rivera'),L);
  await page.evaluate(()=>caseloadOpen());await sleep(500);
  const d=await page.evaluate(()=>({title:document.querySelector('#dlg h2,#dlg .dh,#dlgTitle')&&document.querySelector('#dlg h2,#dlg .dh,#dlgTitle').textContent,rows:document.querySelectorAll('#dlgBody .cl-tbl tr[data-clrow]').length,names:[...document.querySelectorAll('#dlgBody .cl-tbl tr[data-clrow] td:first-child b')].map(b=>b.textContent),
    needs:document.querySelectorAll('#dlgBody .td-list li').length,lead:(document.querySelector('#dlgBody .hp-lead')||{}).textContent||''}));
  ok('Caseload lists both students and says it stays on this device',d.rows===2&&d.names.includes('Mateo Rivera')&&d.names.includes('Sample Student')&&/on this iPad/.test(d.lead)&&/nothing leaves it/.test(d.lead),d);
  await page.evaluate(()=>{const c=document.getElementById('clIni');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
  const ini=await page.evaluate(()=>[...document.querySelectorAll('#dlgBody .cl-tbl tr[data-clrow] td:first-child')].map(td=>td.textContent));
  ok('Initials only: M. R. and S. S., no name and no student number',ini.some(t=>/^M\. R\.$/.test(t))&&ini.some(t=>/^S\. S\.$/.test(t))&&!ini.join().includes('4471823'),ini);
  await page.evaluate(()=>{const c=document.getElementById('clIni');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
  const key=await page.evaluate(async()=>(await clList()).find(r=>r.client==='Mateo Rivera').key);
  await page.evaluate(k=>caseloadGo(k,''),key);await sleep(2500);
  const op=await page.evaluate(()=>({client:document.getElementById('pClient').value,sid:document.getElementById('pSid').value,forms:Object.keys(state.frames).concat(Object.keys(state.pending)),dirty:caseDirty()}));
  ok('Open from the caseload: Mateo Rivera\'s case is back (the student, the ID, Form DD-1), as saved',op.client==='Mateo Rivera'&&op.sid==='4471823'&&op.forms.includes('DD-1')&&!op.dirty,op);
  await page.evaluate(()=>caseloadOpen());await sleep(400);
  await page.evaluate(k=>{const b=document.querySelector('[data-cldel="'+k.replace(/"/g,'\\"')+'"]');b.click();},key);await sleep(800);
  const left=await page.evaluate(async()=>(await clList()).map(r=>r.client));
  ok('Remove takes a student off this device\'s list',left.length===1&&left[0]==='SIMULATED – Sample Student',left);
  await page.evaluate(()=>{try{localStorage.setItem('nbh.caseload.off','1');}catch(e){}});
  await page.evaluate(async()=>{await saveCase();});await sleep(800);
  const off=await page.evaluate(async()=>(await clList()).map(r=>r.client));
  ok('"Do not keep cases on this device": Save case keeps no copy',off.length===1&&!off.includes('Mateo Rivera'),off);
  const cmd=await page.evaluate(()=>CMDS.some(c=>/Caseload/.test(c.n))&&!!document.getElementById('caseloadBtn'));
  ok('Caseload is a button by Today and a command',cmd);
  ok('no errors',!errs.length,errs.slice(0,4));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
