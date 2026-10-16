/* v22.28 Save case and a form put away to save memory. At most eight forms stay loaded on an iPad (FRAME_CAP, v21.81);
   past that the one viewed longest ago is put away, its work kept as the case holds a form not loaded. Save case read
   which forms were loaded and which were put away when it began, so a form put away while the others were being read was
   on neither list and was left out of the file (seen in qa/student-journey-test.js: "IC-1 not in the next Save case").
   Now the lists are read again at the end. Here the timing is forced: while Save case reads DM-1, IC-1 is put away.
   Simulated student only.   usage: node qa/v2228-save-away-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  for(const id of ['IC-1','DM-1']){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(800);}
  /* IC-1 gets a mark of its own, to find in the file */
  const fr=page.frames().find(f=>/IC-1_/.test(f.url()));
  await fr.evaluate(()=>{const t=document.querySelector('textarea[name],textarea')||document.querySelector('input[type=text][name]');t.value='AWAY-MARK';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});
  await sleep(600);
  /* the race: the first time Save case asks DM-1 for its work, IC-1 is put away first */
  await page.evaluate(()=>{const g=window.grab;let done=false;window.__away=null;
    window.grab=async function(id,verb){if(!done&&verb==='snapshot'&&id==='IC-1'&&state.frames['IC-1']){done=true;window.__away=await unloadForm('IC-1',true);}return g.apply(this,arguments);};});
  const dl=page.waitForEvent('download',{timeout:60000});await page.evaluate(()=>{saveCase();});const d=await dl;
  const p=await d.path();const c=JSON.parse(fs.readFileSync(p,'utf8'));
  const st=await page.evaluate(()=>({away:window.__away,pending:!!state.pending['IC-1'],loaded:!!state.frames['IC-1'],dirty:caseDirty()}));
  ok('1 IC-1 was put away while Save case was reading the other form',st.away===true&&st.pending&&!st.loaded,st);
  ok('2 the file still holds both forms, IC-1 with its own work',!!c.forms['DM-1']&&!!c.forms['IC-1']&&JSON.stringify(c.forms['IC-1'].snap).includes('AWAY-MARK'),{forms:Object.keys(c.forms)});
  ok('3 the case is marked saved (nothing was left out)',st.dirty===false,st);
  ok('4 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
