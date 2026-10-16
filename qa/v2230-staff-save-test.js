/* v22.30 Form RS-1 (the RBT Supervision Log) is a staff record, not a student's. Saved alone, with no student on the bar,
   Save case no longer asks to "Save the case without a student name?" and names the file after the record; kept in a
   student's case, it is asked about once (it would go wherever that student's file goes). Simulated student only.
   usage: node qa/v2230-staff-save-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{window.__asked=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};wsUI.alert=async()=>{};window.alert=()=>{};});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(800);};
  const save=async()=>{const dl=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{saveCase();});const d=await dl;return {name:d.suggestedFilename(),c:JSON.parse(fs.readFileSync(await d.path(),'utf8'))};};
  await open('RS-1');
  const s1=await save();const a1=await page.evaluate(()=>window.__asked.splice(0));
  ok('1 RS-1 alone, no student: no question about a student name',!a1.some(t=>/student name/.test(t)),a1);
  ok('1 the file is named after the record, not "case", and holds RS-1',/RBT_Supervision_Log/.test(s1.name)&&!!s1.c.forms['RS-1'],{name:s1.name,forms:Object.keys(s1.c.forms)});
  await page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await open('DM-1');
  const s2=await save();const a2=await page.evaluate(()=>window.__asked.splice(0));
  ok('2 with a student and RS-1 in the case, Save case says RS-1 is a staff record and asks before keeping it there',a2.filter(t=>/staff record/.test(t)&&/Mateo Rivera/.test(t)).length===1&&/Mateo_Rivera/.test(s2.name),{a2,name:s2.name});
  await save();const a3=await page.evaluate(()=>window.__asked.splice(0));
  ok('3 asked once: the next save does not ask again',!a3.some(t=>/staff record/.test(t)),a3);
  await page.evaluate(()=>{window.__asked=[];wsUI.confirm=async t=>{window.__asked.push(String(t));return false;};state.staffAsked=false;});
  const r=await page.evaluate(()=>saveCase());
  ok('4 Cancel writes nothing',r===false);
  await page.evaluate(()=>{const e=document.querySelector('#pClient');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));const s=document.querySelector('#pSid');s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));});
  const r2=await page.evaluate(()=>saveCase());const a4=await page.evaluate(()=>window.__asked.splice(0));
  ok('5 a student’s form open (DM-1) and no name: the student-name question is still asked',r2===false&&a4.some(t=>/without a student name/.test(t)),a4);
  ok('6 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
