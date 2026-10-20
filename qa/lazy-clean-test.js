/* v23.77: a form opened from a saved case leaves the case as saved; a change still counts.
   A simulated case of eight forms, saved and opened again (one form loaded):
   1. the forms opened one after another, each before the last has settled: the case is still as saved, Save shows it;
   2. a word typed in Form GB-1 just as it opens counts: the case is changed, and still is once GB-1 has settled;
   2b. a tap that changes nothing (on a section heading of Form TB-1) as it opens: the case is still as saved;
   3. a word typed in Form TD-1, then Form GB-1 opened: TD-1's change stays unsaved (GB-1's settling does not take it);
   4. no page errors.
   Simulated student only.  usage: node qa/lazy-clean-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IDS=['DM-1','TB-1','FS-1','DD-1','GB-1','TD-1','TK-1','ST-1'];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};}catch(e){}try{localStorage.removeItem('nbh.warm');}catch(e){}});
  /* the case: each form's simulation, then the case file as Save case writes it */
  const text=await p.evaluate(async IDS=>{for(const id of IDS){openForm(id);const fr=state.frames[id];const t0=performance.now();while(!state.status[id]&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));
      try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1600));}}catch(e){}}
    /* every form caught up with the others before the case is written (a form whose simulation came before another's has
       not taken that one's part yet, and would take it on the next opening: a real change) */
    for(let k=0;k<2;k++){try{await gatherFacts(false);}catch(e){}Object.values(state.frames).forEach(fr=>{try{pushFactsTo(fr);}catch(e){}});await new Promise(r=>setTimeout(r,2500));}
    const forms={};for(const id of IDS){const s=await grab(id,'snapshot',null,8000);if(s&&s.snap)forms[id]={title:s.title||id,snap:s.snap};}
    return JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:packet(),forms,facts:state.facts||undefined,cur:IDS[0]});},IDS);
  const reopen=async()=>{await p.evaluate(async t=>{await clearCase();await openCaseText(t,null,{asked:true,quiet:true});},text);await sleep(1500);};
  const openNow=id=>p.evaluate(async id=>{openForm(id);const t0=performance.now();while(!(state.status[id]&&!state.pending[id])&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,40));},id);
  const why=()=>p.evaluate(()=>{const a=String(state.lastSig||'').split('|'),b=caseSig().split('|');return {dirty:caseDirty(),forms:[...new Set(a.filter(x=>!b.includes(x)).concat(b.filter(x=>!a.includes(x))).map(x=>x.split(':')[0]))],save:($('#saveQuick')||{}).textContent||''};});
  /* a form tells of a change once it has counted (about a second after the last key, longer on a busy machine) */
  const waitDirty=async ms=>{const t0=Date.now();let w=await why();while(!w.dirty&&Date.now()-t0<ms){await sleep(250);w=await why();}return w;};
  const typeIn=async id=>{const fr=await (await p.evaluateHandle(id=>state.frames[id],id)).asElement().contentFrame();
    const el=fr.locator('.sheet input[type="text"]:visible, .sheet textarea:visible').first();await el.click();await p.keyboard.type(' simulated note',{delay:30});};

  /* 1 */
  await reopen();const at0=await why();
  for(const id of IDS.slice(1)){await openNow(id);await sleep(400);}
  const mid=await why();await sleep(9000);const end=await why();
  ok('1 the forms opened one after another (each 0.4 s after the last had its work): the case is still as saved, and Save shows it',
    !at0.dirty&&!mid.dirty&&!end.dirty,{at0,mid,end});

  /* 2 */
  await reopen();await openNow('GB-1');await typeIn('GB-1');const t2a=await waitDirty(10000);await sleep(9000);const t2b=await why();
  ok('2 a word typed in Form GB-1 as it opens counts: the case is changed, and still is once GB-1 has settled',t2a.dirty&&t2b.dirty&&t2b.forms.includes('GB-1'),{t2a,t2b});

  /* 2b */
  await reopen();await openNow('TB-1');{const fr=await (await p.evaluateHandle(()=>state.frames['TB-1'])).asElement().contentFrame();await fr.locator('.sheet h2:visible, .sheet h3:visible').first().click({timeout:8000});}
  await sleep(12000);const t2c=await why();
  ok('2b a tap in Form TB-1 as it opens that changes nothing (on a section heading): the case is still as saved',!t2c.dirty,t2c);

  /* 3 */
  await reopen();await openNow('TD-1');await sleep(1200);await typeIn('TD-1');const t3a=await waitDirty(10000);
  await openNow('GB-1');await sleep(6000);const t3b=await why();
  ok('3 a word typed in Form TD-1, then Form GB-1 opened: TD-1’s change stays unsaved, GB-1 is as saved',t3a.dirty&&t3b.dirty&&t3b.forms.includes('TD-1')&&!t3b.forms.includes('GB-1'),{t3a,t3b});

  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
