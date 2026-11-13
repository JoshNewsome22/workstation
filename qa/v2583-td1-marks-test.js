/* v25.83 (the BCBA, 11/11, on the TD-1 builder's four questions: "Follow your recommendations") Form TD-1.
   A  a step written for one function ("For escape: ...") is not part of a plan for another function: it stays on the
      card, marked as left out, and the plan, its counts and its lines do not carry it. With no function chosen, or the
      step's function among the plan's, it stays in. Taking the "For ...:" off its start puts it back.
   B  the EXTINCTION: mark: a step that starts with it is the extinction step on any card (its agreed / not yet agreed
      line, the card's mark, the printed plan's note), and counts as extinction for the "not feasible" check whatever
      its words. The same words without the mark on a card outside the five (FCT, DRA, NCR, NCE, DNRA) carry no line,
      as before. RESTRICTIVE: and OPTION: read as they did.
   C  the bank: 35 steps start "EXTINCTION:", none of them on an Extinction card, each on a card of 3,263; the reader
      rules name the mark (rule 3a).
   The two questions left as they are (the thinning table once for each card; the Responding to behavior sheet's button
   adds the consequence protocol only) have no check here: nothing changed.
   Simulated people only. usage: node qa/v2583-td1-marks-test.js */
const fs=require('fs'),path=require('path');
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const TD=L.forms().find(f=>f.id==='TD-1').file,U=L.BASE+'/NBH-Workstation/'+encodeURI(TD);
const ROOT=path.join(__dirname,'..');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(U);await sleep(2500);
  const setFn=async(v,multi)=>{await p.evaluate(([v,multi])=>{const e=document.querySelector('[name="m.fn"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
     if(multi)['escape','attention','tangible','automatic'].forEach(f=>{const c=document.querySelector('[name="multi.'+f+'"]');if(c&&c.checked!==multi.includes(f)){c.checked=multi.includes(f);c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}});},[v,multi||null]);await sleep(900);};
  const look=code=>p.evaluate(code=>{const card=document.querySelector('#compWrap .card[data-code="'+code+'"]'),c=window.__tdComps().find(x=>x.code===code);const lis=[...card.querySelectorAll('ol.steps li')];
    return {plan:c.steps.length,inPlan:c.steps.some(s=>/^For escape:/.test(s)),off:lis.filter(l=>l.classList.contains('td9-fnoff')).length,marks:[...card.querySelectorAll('.td-kmark')].map(x=>x.textContent),
      lines:window.__tdPlanLines().some(l=>/chain a work requirement/.test(JSON.stringify(l))),filled:lis.filter(l=>(l.querySelector('textarea')||{}).value).length};},code);
  /* ---- A */
  await p.evaluate(()=>{window.__tdAddComp('FCT');});await sleep(1200);
  let r=await look('FCT');
  const all=r.plan;ok('A1 no function chosen: the "For escape:" step is in the plan, with no mark',r.inPlan&&r.off===0&&r.lines&&all>=6,r);
  await setFn('attention');r=await look('FCT');
  ok('A2 a plan for attention: the step stays on the card, marked as left out, and is not one of the plan\'s steps or lines',!r.inPlan&&r.off===1&&!r.lines&&r.plan===all-1&&r.marks.some(m=>/^Step \d+: left out, for escape$/.test(m)),r);
  await setFn('escape');r=await look('FCT');
  ok('A3 a plan for escape: the step is in again, the mark gone',r.inPlan&&r.off===0&&r.lines&&r.plan===all&&!r.marks.some(m=>/left out/.test(m)),r);
  await setFn('multiple',['attention','tangible']);r=await look('FCT');const m1=r;
  await setFn('multiple',['attention','escape']);r=await look('FCT');
  ok('A4 several functions: left out when escape is not one of them, in when it is',!m1.inPlan&&m1.off===1&&r.inPlan&&r.off===0,{m1,r});
  await setFn('attention');
  r=await p.evaluate(async()=>{const card=document.querySelector('#compWrap .card[data-code="FCT"]');const t=[...card.querySelectorAll('ol.steps textarea')].find(x=>/^For escape:/.test(x.value));const was=t.value;
    t.value=was.replace(/^For escape:\s*/,'C');t.value='Chain'+was.replace(/^For escape:\s*chain/,'');t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,700));
    const c=window.__tdComps().find(x=>x.code==='FCT');const o={inPlan:c.steps.some(s=>/^Chain a work requirement/.test(s)),off:card.querySelectorAll('ol.steps li.td9-fnoff').length};
    t.value=was;t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));return o;});
  ok('A5 the "For escape:" taken off the step: it is a step of the attention plan',r.inPlan&&r.off===0,r);
  r=await p.evaluate(()=>({a:window.__tdStepFn('For attention: every 30 s give 10 s of talk'),t:window.__tdStepFn('For tangibles: give the item'),i:window.__tdStepFn('For items: give it'),au:window.__tdStepFn('For automatic reinforcement: offer the toy'),
     no:[window.__tdStepFn('For topics: pick three'),window.__tdStepFn('Before escape: nothing'),window.__tdStepFn('Wait for attention: no')],offA:window.__tdFnOff('For escape: x'),offB:window.__tdFnOff('For attention: x'),offC:window.__tdFnOff('For topics: x')}));
  ok('A6 the functions a step can be written for (escape, attention, tangible, automatic), and no other "For ...:"',r.a==='attention'&&r.t==='tangible'&&r.i==='tangible'&&r.au==='automatic'&&r.no.every(x=>x==='')&&r.offA===true&&r.offB===false&&r.offC===false,r);
  /* ---- B */
  r=await p.evaluate(()=>({x:window.__tdStepKind('EXTINCTION: Keep problem behavior on extinction.'),r:window.__tdStepKind('RESTRICTIVE: Blocking'),pu:window.__tdStepKind('RESTRICTIVE: Punishment (time-out); needs approval before use: x'),o:window.__tdStepKind('OPTION: x'),n:window.__tdStepKind('Keep problem behavior on extinction.'),note:window.__tdKindNote('extinction')}));
  ok('B1 the step\'s kind by its mark: extinction, restrictive, punishment, option, none; the extinction note',r.x==='extinction'&&r.r==='restrictive'&&r.pu==='punishment'&&r.o==='option'&&r.n===''&&/^Extinction step: use it only once extinction is agreed/.test(r.note),r);
  const stepOn=async(code,text)=>p.evaluate(async([code,text])=>{let card=document.querySelector('#compWrap .card[data-code="'+code+'"]');if(!card){window.__tdAddComp(code);await new Promise(r=>setTimeout(r,900));card=document.querySelector('#compWrap .card[data-code="'+code+'"]');}
    const t=[...card.querySelectorAll('ol.steps textarea')].filter(x=>/\.s\d+$/.test(x.name))[1];t.value=text;t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,900));
    if(window.__td2565)window.__td2565.sync();const li=t.closest('li'),g=li.querySelector('.td-exttag'),c=window.__tdComps().find(x=>x.code===code);
    return {cls:li.classList.contains('td9-ext'),tag:g?g.textContent:'',marks:[...card.querySelectorAll('.td-kmark')].map(x=>x.textContent),pending:window.__td2565?window.__td2565.extPending(c):null};},[code,text]);
  r=await stepOn('DRO','Keep problem behavior on extinction.');
  ok('B2 the words alone on a card outside the five: no extinction line and no mark, as before',!r.cls&&r.tag===''&&!r.marks.some(m=>/extinction step/.test(m))&&r.pending===false,r);
  r=await stepOn('DRO','EXTINCTION: Keep problem behavior on extinction.');
  ok('B3 the same step marked EXTINCTION: on that card: the line "not yet agreed", the card\'s mark, and the card counts as pending',r.cls&&/^Extinction step: not yet agreed/.test(r.tag)&&r.marks.some(m=>/^Step 2: extinction step$/.test(m))&&r.pending===true,r);
  r=await p.evaluate(async()=>{const b=document.querySelector('#viewSeg button[data-view="final"]');if(b)b.click();await new Promise(r=>setTimeout(r,1500));const row=[...document.querySelectorAll('#finalBody .plan-step,.plan-step')].find(x=>/EXTINCTION: Keep problem behavior/.test(x.textContent));
    const o={row:!!row,cls:row?row.className:'',note:row&&row.querySelector('.td-kn')?row.querySelector('.td-kn').textContent:'',glance:/extinction step: not yet agreed/.test((document.querySelector('.td-glance')||{}).textContent||'')};const bb=document.querySelector('#viewSeg button[data-view="build"]');if(bb)bb.click();await new Promise(r=>setTimeout(r,800));return o;});
  ok('B4 the printed plan: the step in the extinction style with its note, and the plan at a glance says "not yet agreed"',r.row&&/td-k-ext/.test(r.cls)&&/^Extinction step: use it only once/.test(r.note)&&r.glance,r);
  /* ---- C */
  const src=fs.readFileSync(path.join(ROOT,'NBH-Workstation','nbh-td1-bank.js'),'utf8');const B=new Function(src+';return TD1_BANK;')();
  const X=[];B.protocols.forEach(q=>(q.steps||[]).forEach((s,i)=>{if(/^\s*EXTINCTION:/.test(s))X.push([q.id,q.code,i,s]);}));
  ok('C1 the bank: 3,263 protocols; 35 steps start "EXTINCTION: " followed by a capital letter; none on an Extinction card; none marked twice',
    B.protocols.length===3263&&X.length===35&&X.every(x=>/^EXTINCTION: [A-Z]/.test(x[3]))&&!X.some(x=>x[1]==='EXT')&&!X.some(x=>/RESTRICTIVE:|OPTION:/.test(x[3])),{n:X.length,ext:X.filter(x=>x[1]==='EXT').map(x=>x[0])});
  const marks={};B.protocols.forEach(q=>(q.steps||[]).forEach(s=>{const m=/^\s*([A-Z]{4,}):/.exec(s);if(m)marks[m[1]]=(marks[m[1]]||0)+1;}));
  ok('C2 the marks a step can start with: RESTRICTIVE, OPTION and EXTINCTION, and no other',Object.keys(marks).sort().join(',')==='EXTINCTION,OPTION,RESTRICTIVE',marks);
  r=await p.evaluate(()=>{const e=window.__tdBank.entry('ncr-topic-talk-time');return e?{k:e.steps.map(s=>window.__tdStepKind(s)).filter(Boolean)}:null;});
  ok('C3 the form reads a marked bank step as the extinction step',!!r&&r.k.length===1&&r.k[0]==='extinction',r);
  const rules=fs.readFileSync(path.join(ROOT,'tools','banks','reader-rules.md'),'utf8');
  ok('C4 the reader rules name the mark (rule 3a) and what is not marked',/3a\. \*\*Extinction that is not escape extinction\*\*/.test(rules)&&/starts\s+"EXTINCTION:"/.test(rules)&&/a step on an Extinction card/.test(rules),null);
  await p.close();
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
