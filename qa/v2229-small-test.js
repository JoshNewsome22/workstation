/* v22.29 four small fixes from the review:
   1. (F465) DM-1's "No crisis plan" typed at intake no longer stands once Form CR-1 holds a plan: the case line says DM-1
      is out of date, and the hand-over check asks for DM-1 to be updated, not for a crisis plan;
   2. (F467) an objective GB-1 has not finished (a box still empty) reaches the case marked unfinished with what is missing;
      the IEP packet's goals and the parent note say it is unfinished instead of printing "[unit]", and the hand-over check
      names it;
   3. (I238) Diagnostics has a storage line: what this website keeps on the device, of how much, and whether it is kept;
   4. (I248) every questionnaire page offers another format (large print, read aloud, paper, another language), in Spanish
      on a Spanish page.
   Simulated student only.   usage: node qa/v2229-small-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
  page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  /* 1 the crisis flag */
  const r1=await page.evaluate(()=>{state.facts={profile:{flags:{crisis:'No'}},crisis:{stages:[{name:'Calm'},{name:'Agitation'}]},plan:{rep:'asks for a break'}};
    return {items:(handoverItems()||[]).map(x=>x.t)};});
  ok('1 with CR-1 holding a plan, the hand-over check asks for DM-1 to be updated, not for a crisis plan',r1.items.some(t=>/DM-1 still records no crisis plan, but Form CR-1 holds one/.test(t))&&!r1.items.some(t=>/records the crisis plan as missing/.test(t)),r1);
  const r1b=await page.evaluate(()=>{state.facts={profile:{flags:{crisis:'No'}}};return (handoverItems()||[]).map(x=>x.t);});
  ok('1b with no CR-1 plan it still says DM-1 records the crisis plan as missing',r1b.some(t=>/records the crisis plan as missing/.test(t)),r1b);
  /* 2 GB-1's unfinished objective, from the form itself */
  const GB=L.forms().find(f=>f.id==='GB-1');
  const g=await br.newPage();g.on('pageerror',e=>errs.push('GB-1: '+e.message));g.on('dialog',d=>d.accept().catch(()=>{}));
  await g.goto(L.BASE+'/NBH-Workstation/'+encodeURI(GB.file));await sleep(1500);
  await g.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    [['m.client','Mateo Rivera'],['student','Mateo Rivera'],['h.client','Mateo Rivera'],['acq[0].beh','asks for a break'],['acq[0].cond','when given an independent task'],['acq[0].crit','80% of opportunities'],['acq[0].n','5'],['acq[0].unit','school days'],['acq[0].date','2027-05-28'],['acq[0].meth','daily data on Form DD-1']].forEach(a=>set(a[0],a[1]));});await sleep(400);
  const out=await g.evaluate(()=>{const o=window.__nbhFactsOut();const a=o&&o.goals&&o.goals.acq||[];return {n:a.length,first:a[0]&&{unf:a[0].unfinished,text:a[0].text}};});
  /* an acquisition objective with its unit emptied */
  const un=await g.evaluate(()=>{const c=document.querySelector('#acqWrap .card');const u=c&&c.querySelector('[name$=".unit"]');if(u){u.value='';u.dispatchEvent(new Event('input',{bubbles:true}));u.dispatchEvent(new Event('change',{bubbles:true}));}
    const o=window.__nbhFactsOut();const a=o.goals.acq[0];return {unf:a.unfinished,text:a.text,had:!!u};});
  ok('2a a finished objective reaches the case with nothing missing; one with its unit emptied is marked unfinished, the unit named',out.n>0&&Array.isArray(out.first.unf)&&!out.first.unf.length&&un.had&&JSON.stringify(un.unf)==='["unit"]',{out,un});
  const r2=await page.evaluate(g=>{const goals={acq:[{beh:'asks for a break',text:g.text,unfinished:g.unf}],red:[]};const lines=gbGoalLines(goals,v=>String(v||'').trim());
    state.facts={goals};return {lines,items:(handoverItems()||[]).map(x=>x.t)};},un);
  ok('2b the IEP packet and the parent note print it as unfinished on GB-1, with no "[unit]" marker',r2.lines.length===1&&/not finished on Form GB-1 \(unit still to be written\)/.test(r2.lines[0])&&!/\[unit\]/.test(r2.lines[0]),r2.lines);
  ok('2c the hand-over check names the unfinished objective',r2.items.some(t=>/1 objective is unfinished on Form GB-1: skill objective 1 \(asks for a break\) \(unit missing\)/.test(t)),r2.items);
  await g.close();
  /* 3 Diagnostics */
  await page.evaluate(()=>$('#diag').click());await page.waitForFunction(()=>{const e=document.getElementById('diagStore');return e&&!/checking/.test(e.textContent);},null,{timeout:10000}).catch(()=>{});
  const d=await page.evaluate(()=>{const e=document.getElementById('diagStore');return e?e.textContent:'';});
  ok('3 Diagnostics has a storage line ('+d+')',/ used of about /.test(d),d);
  /* 4 the questionnaire page */
  const IA=L.forms().find(f=>f.id==='IA-1');const q=await br.newPage();q.on('pageerror',e=>errs.push('respond: '+e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(IA.file));await sleep(1500);
  const h=await q.evaluate(()=>{const p={v:1,form:'IA-1',title:'Simulated questionnaire',bcba:'Simulated BCBA',items:[{id:'q1',text:'Does the behavior happen when the student is alone?',type:'yn'}]};
    const pe=JSON.parse(JSON.stringify(p));pe.lang='es';return {en:NBH_RESPOND.payloadToHash(p),es:NBH_RESPOND.payloadToHash(pe)};});
  const said={};for(const k of ['en','es']){await q.goto(L.BASE+'/NBH-Workstation/respond.html'+h[k]);await sleep(700);said[k]=await q.evaluate(()=>{const e=document.getElementById('nbhr-alt');return e?e.textContent:'';});}
  ok('4 the questionnaire page offers another format, and in Spanish on a Spanish page',/large print, read aloud, on paper or in another language\? Tell Simulated BCBA/.test(said.en)&&/letra grande, leído en voz alta, en papel o en otro idioma\? Dígaselo a Simulated BCBA/.test(said.es),said);
  ok('5 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
