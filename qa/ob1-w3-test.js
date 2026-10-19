/* Form OB-1, review Wave 3 part 1: an untouched second-observer interval row is no record (F71); the agreement carried is the total
   count IOA and every figure below 80% is named (F72); no "discrepant" from fewer than 10 of the student's intervals, the intervals
   behind each percentage, and the FS-1 statement as the case's statement (F73); conditions ticked on every observation compared with
   and without the behavior (I36); attention and an item told apart (I37); the observation dates against the consent date (I40).
   Simulated data only. usage: node qa/ob1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('OB-1_'));
  /* ---- F71 ---- */
  const f71=await p.evaluate(async()=>{const pg=()=>document.querySelectorAll('.obs-page')[0];
    const c=pg().querySelector('input[data-field="obs2On"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    const set=(f,v)=>{const e=pg().querySelector('input[data-field="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('count','5');set('count2','4');state.obs[0].iv[3]=true;state.obs[0].iv[9]=true;render();
    const a={line:pg().querySelector('p.ioa').textContent,agree:pg().querySelector('input[data-field="agree"]').value,chk:!!pg().querySelector('input[data-field="iv2On"]')};
    const t=pg().querySelector('input[data-field="iv2On"]');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));
    a.line2=pg().querySelector('p.ioa').textContent;a.on=state.obs[0].iv2On;a.agree2=pg().querySelector('input[data-field="agree"]').value;return a;});
  ok('1 F71 a second observer\'s untouched interval row is not scored; once both rows are said to be scored, an unmarked interval counts',
    f71.line==='Agreement: count 80% (5 and 4); intervals not scored by the second observer'&&f71.chk&&f71.on===true&&/^Agreement: count 80% \(5 and 4\); intervals 90% \(18 of 20\)/.test(f71.line2)&&f71.agree==='80'&&f71.agree2==='80',f71);
  /* ---- the simulation ---- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const sim=await p.evaluate(()=>({ag:[...document.querySelectorAll('input[data-field="agree"]')].map(x=>x.value),sum:[...document.querySelectorAll('#sumBox li')].map(x=>x.textContent),
    draft:draft(),carry:state.meta.carry,cond:[...document.querySelectorAll('#condTbl tr')].map(tr=>[...tr.children].map(c=>c.textContent).join('|')),head:document.getElementById('condHead').textContent,
    sheetHead:document.querySelector('.obs-page .twoup h3').textContent,condAll:document.getElementById('condAll').checked,
    cons:[...document.querySelectorAll('.obs-page')[0].querySelectorAll('input[data-group="cons"]')].map(x=>x.dataset.key)}));
  const S=sim.sum.join(' || ');
  ok('2 F72 the Agreement field carries the total count IOA (observation 2: counts of 0 and 2)',sim.ag[1]==='0'&&sim.ag[0]==='90',sim.ag);
  ok('3 F72 the summary names every figure below 80%, the scored-interval check too',S.includes('Observation 2: total count agreement 0% (counts of 0 and 2), scored-interval 0% (0 of 2), below the 80% long used as the minimum'),sim.sum);
  ok('4 F72 the FS-1 statement gives each observation\'s agreement and the one below 80%',
    /Interobserver agreement was assessed in 2 of 3 observations: observation 1 on [\d/]+, 90%; observation 2 on [\d/]+, total count 0% \(counts of 0 and 2\), interval-by-interval 90%, scored-interval 0%\. Agreement was below 80% in observation 2, so its figures carry that caution\./.test(sim.draft),sim.draft);
  ok('5 F73 four of the student\'s intervals are too few to call discrepant, and the intervals behind each percentage are given, with the whole observations\' counts',
    S.includes('Student 6.7% of intervals (4 of 60) against a comparison peer at 1.7% (1 of 60): higher than the peer’s in this sample, but too few marked intervals to call it discrepant (at least 10 of the student’s).')
    &&!/discrepant for this setting/.test(S)&&S.includes('Over the whole observations, the student had 13 occurrences (6.9 per hour) and the comparison peer 2 (1.1 per hour).'),sim.sum);
  const disc=await p.evaluate(()=>{state.obs.forEach(o=>{for(let j=0;j<5;j++)o.iv[j]=true;});renderSummary();return [...document.querySelectorAll('#sumBox li')].map(x=>x.textContent).find(t=>/^Student /.test(t));});
  ok('6 F73 with 10 or more of the student\'s intervals marked, twice the peer\'s is called discrepant',/^Student [\d.]+% of intervals \(1[0-9] of 60\) against a comparison peer at 1\.7% \(1 of 60\): discrepant for this setting\.$/.test(disc||''),disc);
  const ev=await p.evaluate(()=>{state.meta.carry='';const e=window.__nbhFactsOut().evidence;return {st:e.statement,d:draft().replace(/\s+/g,' ').trim(),fn:e.fn,key:e.fnKey};});
  ok('7 F73 with the FS-1 box empty the case gets the FS-1 statement, not the summary\'s advice',ev.st===ev.d&&!/worth testing|Carry to Form ABC-1/.test(ev.st),ev);
  /* ---- I36 ---- */
  ok('8 I36 conditions ticked on every observation: each over the observations with it and without it',sim.condAll&&sim.head==='Conditions Present, With and Without the Behavior'&&sim.sheetHead==='Conditions Present During the Observation'
    &&sim.cond[0]==='Condition|With the behavior|Behavior when present|Behavior when absent'&&sim.cond.includes('Task above current skill|2 of 2|2 of 2|0 of 1')&&sim.cond.includes('Demand or task placed|2 of 2|2 of 3|never absent'),sim);
  ok('9 I36 the summary names the condition the behavior followed and the one always present',S.includes('The behavior occurred in every observation with task above current skill and in none without it (2 of 2 against 0 of 1).')
    &&S.includes('Present in every observation, with or without the behavior: demand or task placed. These observations cannot show whether it matters')&&/The behavior occurred in 2 of 2 observations with task above current skill and in 0 of 1 without it/.test(sim.draft),sim.sum);
  /* an older record: conditions ticked only with the behavior, so no comparison until the box says otherwise */
  const old=await p.evaluate(async()=>{const d=JSON.parse(JSON.stringify({meta:state.meta,cfg:{ivLen:15,ivMethod:'partial',ivN:20},obs:state.obs}));d.obs[1].ante={};d.obs[0].cons={escape:true,access:true};delete d.obs[0].cons.attnGiven;
    return JSON.stringify(d);});
  await p.setInputFiles('#fileIn',{name:'old_OB-1.json',mimeType:'application/json',buffer:Buffer.from(old)});await sleep(600);
  const o1=await p.evaluate(()=>({condAll:state.cfg.condAll,head:document.getElementById('condHead').textContent,box:document.getElementById('condAll').checked,cols:document.querySelectorAll('#condTbl thead th').length,
    sheetHead:document.querySelector('.obs-page .twoup h3').textContent,acc:[...document.querySelectorAll('.obs-page')].map(pg=>!!pg.querySelector('input[data-group="cons"][data-key="access"]'))}));
  await p.evaluate(()=>{const c=document.getElementById('condAll');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  const o2=await p.evaluate(()=>({condAll:state.cfg.condAll,cols:document.querySelectorAll('#condTbl thead th').length}));
  ok('10 I36 an older record keeps the old count until the box says conditions were ticked on every observation',o1.condAll===false&&o1.head==='Conditions Present When the Behavior Occurred'&&!o1.box&&o1.cols===3
    &&o1.sheetHead==='Conditions Present When the Behavior Occurred'&&o2.condAll===true&&o2.cols===4,{o1,o2});
  /* ---- I37 ---- */
  ok('11 I37 attention and an item or activity have their own boxes; the older single box shows only where it was ticked',
    sim.cons.includes('attnGiven')&&sim.cons.includes('item')&&!sim.cons.includes('access')&&JSON.stringify(o1.acc)==='[true,false,false]',{cons:sim.cons,acc:o1.acc});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(800);
  const keys=await p.evaluate(()=>{const k=()=>{state.meta.carry='';renderSummary();const e=window.__nbhFactsOut().evidence;return e.fnKey+'|'+e.fn;};const r={};
    state.obs[0].cons={attnGiven:true};state.obs[2].cons={attnGiven:true};r.att=k();
    state.obs[0].cons={item:true};state.obs[2].cons={item:true};r.tan=k();
    state.obs[0].cons={item:true,escape:true};state.obs[2].cons={item:true,escape:true};r.mul=k();
    state.obs[0].cons={access:true};state.obs[2].cons={access:true};r.old=k();return r;});
  ok('12 I37 the case hears attention or tangible with its key; both with escape is multiple; the older single box is words only',
    keys.att==='attention|Attention (a hypothesis to test)'&&keys.tan==='tangible|Access to items or activities (a hypothesis to test)'&&keys.mul==='multiple|Escape from demands and access to items or activities'
    &&keys.old==='|Access to an item, activity or attention (not told apart) (a hypothesis to test)',keys);
  /* ---- I40 ---- */
  const c=await p.evaluate(()=>{const ds=state.obs.map(o=>o.date).sort(),r={};
    window.__nbhFactsIn({consent:{src:'IC-1',state:'Current',on:true,obtained:ds[1]}});r.before=document.getElementById('planBox').textContent;
    window.__nbhFactsIn({consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-01-05'}});r.after=document.getElementById('planBox').textContent;r.ds=ds;return r;});
  ok('13 I40 an observation dated before the parent\'s consent is named in the observation plan',/Observation 1 \([\d/]+\) is dated before the parent’s consent \([\d/]+, Form IC-1\)\. An observation for the FBA follows consent/.test(c.before),c.before);
  ok('14 I40 with consent before every observation, the plan says so',/Consent on file since 1\/5\/2026 \(Form IC-1\); the observations are dated [\d/]+ to [\d/]+, after it\./.test(c.after),c.after);
  const p2=await open(file('OB-1_'));
  const g=await p2.evaluate(()=>{const r=window.nbhCase.apply({behaviors:[{label:'Aggression (simulated)',def:'Forceful contact (simulated)'}],consent:{src:'IC-1',state:'Current',on:true,obtained:'2026-01-05'}});
    return {rep:r,beh:state.meta.behavior||((document.querySelector('[data-meta="behavior"]')||{}).value)};});
  ok('15 I40 the case still fills the behavior box (the generic fill runs)',/Aggression \(simulated\)/.test(g.beh||'')&&g.rep&&g.rep.generic===true,g);
  ok('16 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
