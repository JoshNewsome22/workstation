/* v22.39 (review F461, F466). QS-1 from the case pairs the plan's own lines as rule 1 (its response, and its "staff do not"), and
   DM-1's "what to avoid" goes with the day, not into the non-negotiables; TI-1 scores a rule with no Do as "Does not: ...". The
   master print puts the ticked forms in the case's order (consent, assessment, the FBA, the plan, the data record, the review),
   with List order kept as an option. Simulated people only.
   usage: node qa/v2239-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('QS-1: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/QS-1_Staff-Quick-Start_v2026-10.html');await sleep(900);
  const r=await q.evaluate(()=>{nbhCase.apply({profile:{client:'Mateo Rivera',avoid:'Being called out in front of peers (simulated)',helps:'A heads-up before changes (simulated)'},
    plan:{respond:{target:'Block, keep the task in place, prompt the break card (simulated)',not:'No removal of the task after hitting; no lecture (simulated)'}}});
    return {r0:S.rules[0],rules:S.rules.filter(x=>(x.do||'').trim()||(x.dont||'').trim()).length,day:(S.day||[]).map(x=>x.text)};});
  ok('1 QS-1 rule 1 pairs the plan’s response with the plan’s "staff do not"',/Block, keep the task/.test(r.r0.do)&&/No removal of the task/.test(r.r0.dont)&&r.rules===1,r);
  ok('2 DM-1’s "what to avoid" goes with the day, beside What helps, not into the non-negotiables',r.day.some(t=>/^Avoid: Being called out/.test(t))&&!/called out/.test(JSON.stringify(r.r0)),r.day);
  const t=await ctx.newPage();t.on('pageerror',e=>errs.push('TI-1: '+e.message));await t.goto(L.BASE+'/NBH-Workstation/TI-1_Treatment-Integrity-Observation_v2026-09.html');await sleep(900);
  const st=await t.evaluate(()=>{tiQuick={rules:[{do:'',dont:'No lecture (simulated)'},{do:'Prompt the break card (simulated)',dont:'Removing the task (simulated)'}]};return tiQuickSteps();});
  ok('3 TI-1: a rule with no Do is scored as "Does not: ..."; a pair as "do (not: don’t)"',st[0]==='Does not: no lecture (simulated)'&&/^Prompt the break card \(simulated\) \(not: removing the task/.test(st[1]),st);
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const o=await sh.evaluate(()=>{const ids=['DM-1','IC-1','IA-1','IN-1','DD-1','FS-1','TD-1','CR-1','PR-1'];const L=ALL.filter(x=>ids.includes(x[0]));return {list:L.map(x=>x[0]),cas:mpCaseOrder(L).map(x=>x[0]),def:packetOpts().order};});
  const at=id=>o.cas.indexOf(id);
  ok('4 the master print in case order: consent before assessment, the FBA before the plan, the plan before the data record, the data record before the review',at('IC-1')<at('IA-1')&&at('FS-1')<at('TD-1')&&at('TD-1')<at('DD-1')&&at('DD-1')<at('PR-1')&&o.cas.length===o.list.length,o);
  ok('5 Case order is the default; List order is offered in Packet options',o.def==='case'&&await sh.evaluate(()=>{packetOptsOpen();const h=document.getElementById('dlgBody').textContent;try{document.getElementById('dlg').close();}catch(e){}return /Case order/.test(h)&&/List order/.test(h);}));
  ok('6 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
