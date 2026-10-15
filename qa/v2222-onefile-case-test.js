/* v22.22 the one-file edition's Save case writes the case alone (review F472). It wrote the whole workstation, 21 MB, into
   every student's case file at every save. Now Save case writes the same case data the website edition writes (a few
   hundred KB), later saves go back into that file, and Open case reads it; More, "Save a case that opens on its own",
   writes the old self-contained copy for someone without the workstation, as a copy that later saves do not go into.
   A .case.html opened from before is still saved back into itself. The website edition's case file is as it was, and
   has no such menu item. Simulated student only.   usage: node qa/v2222-onefile-case-test.js */
const L=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
/* a stand-in for the browser's file picker: each chosen file keeps what is written into it */
const PICKER=()=>{window.__picks=[];window.__files={};
  const fake=name=>({name,createWritable:async()=>{let buf='';return {write:async t=>{buf+=t;},close:async()=>{window.__files[name]=buf;}};}});
  window.__fake=fake;window.showSaveFilePicker=async o=>{window.__picks.push({name:o.suggestedName,types:JSON.stringify(o.types)});return fake(o.suggestedName);};
  wsUI.alert=async()=>{};wsUI.confirm=async()=>true;window.alert=()=>{};};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
  await page.goto(L.BASE+'/deliver/NBH-Workstation.html');await L.sleep(2500);
  await page.evaluate(PICKER);
  await page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await page.evaluate(()=>openForm('DM-1'));await page.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:40000});await L.sleep(1500);
  const fr=page.frames().find(f=>f!==page.mainFrame());if(fr)await L.loadSim(fr).catch(()=>{});await L.sleep(1500);
  /* 1 Save case */
  const a=await page.evaluate(async()=>{const r=await saveCase();const p=window.__picks.slice(),f=Object.keys(window.__files);const t=window.__files[f[0]]||'';let d=null;try{d=JSON.parse(t);}catch(e){}
    return {r,picks:p,files:f,size:t.length,form:d&&d.form,id:!!(d&&d.id),ids:d&&Object.keys(d.forms),client:d&&d.packet&&d.packet.client,handle:state.caseHandle&&state.caseHandle.name,dirty:caseDirty()};});
  ok('1 the one-file edition\'s Save case writes the case alone: '+a.files[0]+', '+Math.round(a.size/1024)+' KB, not a copy of the workstation',a.r===true&&a.picks.length===1&&/^CASE_.*\.json$/.test(a.picks[0].name)&&/application\/json/.test(a.picks[0].types)&&a.size<2e6&&a.form==='CASE'&&a.id&&a.ids.includes('DM-1')&&a.client==='Mateo Rivera'&&!a.dirty,a);
  /* 2 a second save goes back into the same file, without asking */
  const b=await page.evaluate(async()=>{const n=Object.keys(window.__files).length;document.querySelector('#pSid').value='4471823';const r=await saveCase();return {r,picks:window.__picks.length,files:Object.keys(window.__files).length,n};});
  ok('2 the next Save case goes back into that file without asking again',b.r===true&&b.picks===1&&b.files===b.n,b);
  /* 3 the copy that opens on its own */
  const more=await page.evaluate(()=>{const w=document.getElementById('saveWhole');document.getElementById('moreBtn').click();const items=[...document.querySelectorAll('#moreMenu [data-more]')].map(x=>x.textContent);document.body.click();return {hidden:w&&w.hidden,items};});
  const c=await page.evaluate(async()=>{const before=state.caseHandle&&state.caseHandle.name;const r=await saveCase({whole:true});const p=window.__picks[window.__picks.length-1];const t=window.__files[p.name]||'';
    return {r,name:p.name,types:p.types,size:t.length,forms:t.includes('id="nbh-embed-forms"'),cased:/<script type="application\/json" id="nbh-case">/.test(t),before,after:state.caseHandle&&state.caseHandle.name};});
  ok('3 More has "Save a case that opens on its own" in the one-file edition',more.hidden===false&&more.items.includes('Save a case that opens on its own'),more);
  ok('4 it writes Student.case.html: the workstation with the case in it ('+Math.round(c.size/1048576)+' MB), as a copy: later saves still go into the case file',c.r===true&&/\.case\.html$/.test(c.name)&&/text\/html/.test(c.types)&&c.forms&&c.cased&&c.size>5e6&&c.after===c.before&&/\.json$/.test(c.after),{...c,size:c.size});
  /* 5 Open case reads the data file */
  const d=await page.evaluate(async()=>{const n=Object.keys(window.__files).find(k=>/\.json$/.test(k));await openCaseText(window.__files[n],window.__fake(n),{asked:true,quiet:true});return {ids:Object.keys(state.pending).concat(Object.keys(state.frames)),handle:state.caseHandle&&state.caseHandle.name,client:document.querySelector('#pClient').value};});
  ok('5 Open case in the one-file edition opens that file, and later saves go back into it',d.ids.includes('DM-1')&&/\.json$/.test(d.handle)&&d.client==='Mateo Rivera',d);
  /* 6 a .case.html from before is saved back into itself */
  const e=await page.evaluate(async()=>{state.caseHandle=window.__fake('Mateo_Rivera.case.html');const n=window.__picks.length;const r=await saveCase();const t=window.__files['Mateo_Rivera.case.html']||'';return {r,asked:window.__picks.length-n,whole:t.includes('id="nbh-embed-forms"')&&t.includes('id="nbh-case"')};});
  ok('6 a .case.html saved before v22.22 is still saved back into itself, whole',e.r===true&&e.asked===0&&e.whole,e);
  /* 7 with no file picker (Safari, Firefox): a download */
  const dl=page.waitForEvent('download',{timeout:20000}).catch(()=>null);
  await page.evaluate(()=>{state.caseHandle=null;delete window.showSaveFilePicker;saveCase();});const f=await dl;
  ok('7 without a file picker, Save case downloads CASE_Student_date.json',!!f&&/^CASE_.*\.json$/.test(f.suggestedFilename()),f&&f.suggestedFilename());
  await page.close();
  /* 8 the website edition */
  const w=await ctx.newPage();w.on('pageerror',x=>errs.push('web: '+x.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1500);
  await w.evaluate(()=>{wsUI.alert=async()=>{};wsUI.confirm=async()=>true;window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await w.evaluate(()=>openForm('DM-1'));await w.waitForFunction(()=>!!state.status['DM-1'],null,{timeout:40000});await L.sleep(1200);
  const wm=await w.evaluate(()=>{document.getElementById('moreBtn').click();const items=[...document.querySelectorAll('#moreMenu [data-more]')].map(x=>x.textContent);document.body.click();return items;});
  const d2=w.waitForEvent('download',{timeout:20000}).catch(()=>null);await w.evaluate(()=>{saveCase();});const f2=await d2;
  let keys=[];if(f2){const pth=await f2.path();keys=Object.keys(JSON.parse(L.fs.readFileSync(pth,'utf8')));}
  ok('8 the website edition: Save case writes the case file as before (no id), and More has no such item',!!f2&&/^CASE_.*\.json$/.test(f2.suggestedFilename())&&keys.join()==='form,rev,saved,packet,forms,facts,cur'.split(',').filter(k=>keys.includes(k)).join()&&!keys.includes('id')&&!wm.includes('Save a case that opens on its own'),{keys,wm,name:f2&&f2.suggestedFilename()});
  ok('9 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
