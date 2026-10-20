/* Form PD-1 is kept in a file of its own, never in the student's case (v23.44, review F248; the BCBA's decision). Save case
   with PD-1's entries not yet in their own file asks first (Save its own file, then the case / Save the case only / Cancel),
   writes PD-1's own file as its Save data names it, and saves the case without PD-1; the copy on this device, the case's
   history and the backup leave it out; a case saved before this version is written without it; PD-1 alone is saved to its
   own file with no case. Simulated student and staff only. usage: node qa/pd1-staff-side-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{window.__asked=[];window.__pick='both';wsUI.confirm=async t=>{window.__asked.push(String(t));return true;};
    wsUI.choose=async(t,b,n)=>{window.__asked.push(String(t)+' || '+b.map(x=>x.label).join(' / ')+' || '+(n||''));return window.__pick;};wsUI.alert=async()=>{};window.alert=()=>{};});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(800);};
  const read=async d=>({name:d.suggestedFilename(),c:JSON.parse(fs.readFileSync(await d.path(),'utf8'))});
  /* every download a save makes, in order, until it settles */
  const saveAll=async(n)=>{const got=[];const h=d=>got.push(d);page.on('download',h);const r=await page.evaluate(()=>saveCase());
    const t0=Date.now();while(got.length<n&&Date.now()-t0<30000)await sleep(200);await sleep(800);page.off('download',h);const out=[];for(const d of got)out.push(await read(d));return {r,files:out};};
  const pdFrame=()=>page.frames().find(f=>/PD-1_/.test(f.url()));
  const fill=async(v)=>{const f=pdFrame();await f.evaluate(v=>{const set=(k,x)=>{const e=document.querySelector('[data-m="'+k+'"]');if(!e)return;e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
      set('staff','Paula Brennan (simulated)');set('role','Paraprofessional');set('concern','The break card is not offered before work (simulated).');set('setting','Room 12, math block');set('plan',v);},v);
    await page.waitForFunction(()=>state.status['PD-1']&&state.status['PD-1'].edited,null,{timeout:10000}).catch(()=>{});await sleep(600);};
  await page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await open('DM-1');await open('PD-1');await fill('BIP of 8/12 (simulated)');
  const s1=await saveAll(2);const a1=await page.evaluate(()=>window.__asked.splice(0));
  const pdf=s1.files.find(x=>/^PD-1_/.test(x.name)),cs=s1.files.find(x=>/^CASE_/.test(x.name));
  ok('1 Save case with PD-1\'s entries: asked once, Save its own file, then the case / Save the case only / Cancel',a1.filter(t=>/Form PD-1 is a supervision record about a staff member\. It is saved in a file of its own, not in Mateo Rivera’s case/.test(t)&&/Save its own file, then the case \/ Save the case only \/ Cancel/.test(t)).length===1,a1);
  ok('2 PD-1\'s own file is written, named as its Save data names it, holding the whole checklist',!!pdf&&/^PD-1_Paula_Brennan_simulated__\d{4}-\d\d-\d\d\.json$/.test(pdf.name)&&pdf.c.form==='PD-1'&&pdf.c.S&&pdf.c.S.meta.staff==='Paula Brennan (simulated)',s1.files.map(x=>x.name));
  ok('3 the case file holds DM-1, not PD-1',!!cs&&!!cs.c.forms['DM-1']&&!cs.c.forms['PD-1']&&s1.r===true,cs&&{forms:Object.keys(cs.c.forms),r:s1.r});
  const rec=await page.evaluate(async()=>{const r=(await clList()||[]).find(x=>x.key===clKey(packet()));const d=r&&parseCase(r.text);return d?Object.keys(d.forms):null;});
  ok('4 the copy kept on this device (Drive and the hand-over take it from there) has no PD-1',!!rec&&rec.includes('DM-1')&&!rec.includes('PD-1'),rec);
  const hx=await page.evaluate(async()=>{const t=await hxScreenText();const d=t&&JSON.parse(t);return d?Object.keys(d.forms):null;});
  ok('5 the case\'s history leaves PD-1 out',!!hx&&hx.includes('DM-1')&&!hx.includes('PD-1'),hx);
  const s2=await saveAll(1);const a2=await page.evaluate(()=>window.__asked.splice(0));
  ok('6 saved again with PD-1 unchanged: no question, only the case',!a2.some(t=>/supervision record/.test(t))&&s2.files.length===1&&/^CASE_/.test(s2.files[0].name)&&!s2.files[0].c.forms['PD-1'],{a2,f:s2.files.map(x=>x.name)});
  await fill('BIP of 8/12, Room 12 (simulated)');await page.evaluate(()=>{window.__pick='case';});
  const s3=await saveAll(1);const a3=await page.evaluate(()=>window.__asked.splice(0));
  ok('7 changed, Save the case only: asked, only the case is written, without PD-1',a3.some(t=>/supervision record/.test(t))&&s3.files.length===1&&/^CASE_/.test(s3.files[0].name)&&!s3.files[0].c.forms['PD-1'],{a3,f:s3.files.map(x=>x.name)});
  await page.evaluate(()=>{window.__pick='';});
  const r4=await page.evaluate(()=>saveCase());const fr=await page.evaluate(()=>Object.keys(state.frames));
  ok('8 Cancel writes nothing and leaves PD-1 open',r4===false&&fr.includes('PD-1'),{r4,fr});
  /* a case saved before this version, with PD-1 in it, on this device: the backup writes it without PD-1 */
  const bk=await page.evaluate(async()=>{const L=await clList()||[];const r=L.find(x=>x.key===clKey(packet()));const d=parseCase(r.text);d.forms['PD-1']={title:'PD-1',snap:{total:1,data:{x:'old (simulated)'}}};
    r.text=JSON.stringify(d);await clTx('readwrite',st=>st.put(r));return true;});
  await page.evaluate(()=>{wsUI.prompt=async()=>'';});   /* an unlocked backup */
  const dlb=page.waitForEvent('download',{timeout:30000});await page.evaluate(()=>clBackup());const b=await read(await dlb);
  const bc=(b.c.cases||[]).map(r=>{const d=JSON.parse(r.text);return Object.keys(d.forms);});
  ok('9 Back up the caseload writes a case saved before this version without its PD-1',b.c.form==='CASELOAD'&&bc.length>=1&&bc.every(f=>!f.includes('PD-1'))&&bc.some(f=>f.includes('DM-1')),bc);
  const dlf=page.waitForEvent('download',{timeout:30000});await page.evaluate(()=>clSaveFile(clKey(packet())));const sf=await read(await dlf);
  ok('9b the caseload\'s Save file writes it without its PD-1 too',/^CASE_/.test(sf.name)&&!!sf.c.forms['DM-1']&&!sf.c.forms['PD-1'],{n:sf.name,forms:Object.keys(sf.c.forms||{})});
  /* PD-1 alone, no other form */
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));p2.on('dialog',d=>d.accept().catch(()=>{}));
  await p2.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await p2.evaluate(()=>{window.__asked=[];wsUI.choose=async(t,b)=>{window.__asked.push(String(t)+' || '+b.map(x=>x.label).join(' / '));return 'both';};wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};
    const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');openForm('PD-1');});
  await p2.waitForFunction(()=>!!state.status['PD-1'],null,{timeout:40000});await sleep(900);
  await p2.frames().find(f=>/PD-1_/.test(f.url())).evaluate(()=>{const set=(k,x)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));};set('staff','Iris Calloway (simulated)');set('role','Teacher');set('concern','Prompts are not faded (simulated).');set('plan','BIP of 9/2 (simulated)');});
  await p2.waitForFunction(()=>state.status['PD-1']&&state.status['PD-1'].edited,null,{timeout:10000}).catch(()=>{});await sleep(600);
  const got=[];p2.on('download',d=>got.push(d));const r5=await p2.evaluate(()=>saveCase());await sleep(2500);
  const f5=[];for(const d of got)f5.push(await read(d));const a5=await p2.evaluate(()=>window.__asked.splice(0));
  ok('10 PD-1 alone: asked Save its own file / Cancel; its own file is written and no case file',r5===true&&a5.some(t=>/Save its own file \/ Cancel$/.test(t))&&f5.length===1&&/^PD-1_Iris_Calloway_simulated__/.test(f5[0].name),{r5,a5,f:f5.map(x=>x.name)});
  /* a case file from before this version, with PD-1 in it, opened and saved: asked, and the case is written without it */
  const old=JSON.stringify(Object.assign({},cs.c,{forms:Object.assign({},cs.c.forms,{'PD-1':{title:'PD-1',snap:pdf?{total:1,data:{},own:JSON.stringify(pdf.c)}:{total:1,data:{}}}})}));
  const p3=await ctx.newPage();p3.on('pageerror',e=>errs.push(e.message));p3.on('dialog',d=>d.accept().catch(()=>{}));
  await p3.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await p3.evaluate(async t=>{window.__asked=[];wsUI.choose=async(q,b)=>{window.__asked.push(String(q));return 'case';};wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};await openCaseText(t,null,{asked:true});},old);
  await p3.waitForFunction(()=>!!(state.pending['PD-1']||state.frames['PD-1']),null,{timeout:20000}).catch(()=>{});await sleep(1500);
  const got3=[];p3.on('download',d=>got3.push(d));const r6=await p3.evaluate(()=>saveCase());const t0=Date.now();while(!got3.length&&Date.now()-t0<20000)await sleep(200);await sleep(600);
  const f6=[];for(const d of got3)f6.push(await read(d));
  ok('11 a case saved before this version, with PD-1 in it: saved again without PD-1',f6.length===1&&!!f6[0].c.forms['DM-1']&&!f6[0].c.forms['PD-1'],{r6,f:f6.map(x=>({n:x.name,forms:Object.keys(x.c.forms||{})}))});
  ok('12 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
