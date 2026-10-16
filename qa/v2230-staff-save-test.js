/* v22.30 Form RS-1 (the RBT Supervision Log) is a staff record, not a student's. Saved alone, with no student on the bar,
   Save case no longer asks to "Save the case without a student name?" and names the file after the record. v22.31 open
   beside a student's case: with nothing entered in it, Save case leaves it out of the case and closes it without a
   question; with entries, it asks Leave it out and save / Keep it in this case / Cancel, and Close case can close the
   student with RS-1 left out (before, Cancel was the only way not to keep it, and it stopped Close case). Simulated student only.
   usage: node qa/v2230-staff-save-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{window.__asked=[];window.__pick='keep';wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};
    wsUI.choose=async(t,b,n)=>{window.__asked.push(String(t)+' || '+b.map(x=>x.label).join(' / ')+' || '+(n||''));return window.__pick;};wsUI.alert=async()=>{};window.alert=()=>{};});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(800);};
  const save=async()=>{const dl=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{saveCase();});const d=await dl;return {name:d.suggestedFilename(),c:JSON.parse(fs.readFileSync(await d.path(),'utf8'))};};
  const rsFrame=()=>page.frames().find(f=>/RS-1_/.test(f.url()));
  const enter=async()=>{const f=rsFrame();await f.fill('#sName','Jordan Lee (simulated)').catch(async()=>{await f.evaluate(()=>{const e=document.querySelector('input[type=text],input:not([type])');e.value='Jordan Lee (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));});});
    await page.waitForFunction(()=>state.status['RS-1']&&state.status['RS-1'].edited,null,{timeout:10000}).catch(()=>{});};
  await open('RS-1');
  const s1=await save();const a1=await page.evaluate(()=>window.__asked.splice(0));
  ok('1 RS-1 alone, no student: no question about a student name',!a1.some(t=>/student name/.test(t)),a1);
  ok('1 the file is named after the record, not "case", and holds RS-1',/RBT_Supervision_Log/.test(s1.name)&&!!s1.c.forms['RS-1'],{name:s1.name,forms:Object.keys(s1.c.forms)});
  await page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await open('DM-1');
  const s2=await save();const a2=await page.evaluate(()=>window.__asked.splice(0));const f2=await page.evaluate(()=>Object.keys(state.frames));
  ok('2 RS-1 with nothing entered beside a student: no question; the case is saved without it and RS-1 is closed',!a2.some(t=>/staff record/.test(t))&&/Mateo_Rivera/.test(s2.name)&&!s2.c.forms['RS-1']&&!!s2.c.forms['DM-1']&&!f2.includes('RS-1'),{a2,name:s2.name,forms:Object.keys(s2.c.forms),f2});
  await open('RS-1');await enter();
  const s3=await save();const a3=await page.evaluate(()=>window.__asked.splice(0));
  ok('3 RS-1 with entries: asked once, Leave it out and save / Keep it in this case / Cancel; Keep puts it in the file',a3.filter(t=>/staff record/.test(t)&&/Mateo Rivera/.test(t)&&/Leave it out and save \/ Keep it in this case \/ Cancel/.test(t)).length===1&&!!s3.c.forms['RS-1'],{a3,forms:Object.keys(s3.c.forms)});
  await save();const a4=await page.evaluate(()=>window.__asked.splice(0));
  ok('4 kept: the next save does not ask again',!a4.some(t=>/staff record/.test(t)),a4);
  await page.evaluate(()=>{state.staffAsked=false;window.__pick='';});
  const r=await page.evaluate(()=>saveCase());const fr=await page.evaluate(()=>Object.keys(state.frames));
  ok('5 Cancel writes nothing and leaves RS-1 open',r===false&&fr.includes('RS-1'),{r,fr});
  await page.evaluate(()=>{window.__pick='leave';});
  const s6=await save();const f6=await page.evaluate(()=>Object.keys(state.frames));
  ok('6 Leave it out: the case is saved without RS-1, and RS-1 is closed',!s6.c.forms['RS-1']&&!!s6.c.forms['DM-1']&&!f6.includes('RS-1')&&f6.includes('DM-1'),{forms:Object.keys(s6.c.forms),f6});
  /* the iPad report: Close case with RS-1 (entries) beside the student */
  await open('RS-1');await enter();await page.evaluate(()=>{state.staffAsked=false;window.__pick='leave';});
  const dl=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{$('#closeCase').click();});const d=await dl;const c7=JSON.parse(fs.readFileSync(await d.path(),'utf8'));
  await page.waitForFunction(()=>!Object.keys(state.frames).length,null,{timeout:15000}).catch(()=>{});
  const after=await page.evaluate(()=>({frames:Object.keys(state.frames),client:document.querySelector('#pClient').value}));
  ok('7 Close case with RS-1 beside the student: Leave it out saves the student’s case without it and closes the case',!c7.forms['RS-1']&&!!c7.forms['DM-1']&&!after.frames.length&&!after.client,{forms:Object.keys(c7.forms),after});
  await open('DM-1');
  const r2=await page.evaluate(()=>saveCase());const a8=await page.evaluate(()=>window.__asked.splice(0));
  ok('8 a student’s form open (DM-1) and no name: the student-name question is still asked',a8.some(t=>/without a student name/.test(t)),a8);
  ok('9 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
