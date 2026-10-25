/* v24.20 Form EA-1 from the independent review: stopped and short sessions out of the criterion; the log reads its entries; agreement
   by condition against the Setup plan; the safety gate before a session; the SD label and the slope-rule flag; the Plan landing,
   counter and ruled-out consequence; the simulation; the runner after a file is opened; the observer's sheet.
   usage: node qa/ea120-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),os=require('os'),path=require('path');
const EA='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^EA-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()+JSON.stringify(m.location())))errs.push('console: '+m.text());});
 const stub=()=>p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;window.__prints=0;window.print=()=>{window.__prints++;window.__printCls=document.body.className;window.__obsPages=document.querySelectorAll('#eaObsSheet .ea-obs-page').length;window.__obsVis=!document.getElementById('eaObsSheet').hidden;};});
 const view=v=>p.evaluate(v=>{document.querySelector('#viewSeg [data-view="'+v+'"]').click();},v);
 const crit=()=>p.evaluate(()=>{const rows={};document.querySelectorAll('#critTbl tbody tr').forEach(tr=>{const c=[...tr.children].map(td=>td.textContent.trim());rows[c[0]]={n:+c[1],mean:c[2],flags:c[c.length-1]};});return {rows,note:document.getElementById('critNote').textContent,verdict:document.getElementById('critVerdict').textContent,marks:document.querySelectorAll('#critFig .ea-exmark').length,top:Math.max(...[...document.querySelectorAll('#critFig text.tick')].map(e=>parseFloat(e.textContent)).filter(v=>!isNaN(v))),ioa:document.getElementById('ioaStat').innerHTML,need:{hidden:document.getElementById('eaIoaNeed').hidden,text:document.getElementById('eaIoaNeed').textContent}};});
 const setv=(nm,v)=>p.evaluate(([nm,v])=>{const e=document.querySelector('[name="'+nm+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[nm,v]);
 await p.goto(BASE+EA);await sleep(1800);await stub();
 /* ---- the Plan landing and counter (R-080) ---- */
 const land=await p.evaluate(()=>({cls:document.body.className,prog:document.querySelector('#plWrap .pl-prog')?.textContent}));
 await p.evaluate(()=>{[...document.querySelectorAll('#plWrap .pl-opt')].find(x=>x.dataset.v==='fn').click();document.querySelector('#plWrap .pl-next').click();});await sleep(150);
 const prog2=await p.evaluate(()=>document.querySelector('#plWrap .pl-prog').textContent);
 ok('an empty form opens on Plan and the counter reads the final count from the first card (1 of 11, then 2 of 11)',/view-plan/.test(land.cls)&&land.prog==='Question 1 of 11'&&prog2==='Question 2 of 11',{land,prog2});
 /* ---- a blank form: Start session says the conditions are not named (R-136) ---- */
 await view('sessions');await sleep(200);await p.evaluate(()=>document.getElementById('eaStart').click());await sleep(300);
 const blank=await p.evaluate(()=>({state:eaRunner.state(),cue:document.getElementById('eaMsg').textContent}));
 ok('on a blank form Start session does not start and says to name the conditions first',blank.state==='ready'&&/Name the conditions/.test(blank.cue),blank);
 /* ---- the simulation ---- */
 await p.evaluate(()=>{document.getElementById('simScenario').value='escape';document.getElementById('simBtn').click();});await sleep(1800);
 const sim=await p.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;const rows=eaAPI.sessData(),cn=eaAPI.condNames();const dem=cn.find(c=>/demand/i.test(c.name));const dy=rows.filter(r=>r.c===dem.i).map(r=>r.y);
  const dates=[...document.querySelectorAll('#sessBody [name$=".d"]')].map(e=>e.value).filter(Boolean).concat([...document.querySelectorAll('#txBody [name$=".d"],[name^="tx["][name$=".d"]')].map(e=>e.value).filter(Boolean));
  const wk=dates.map(d=>{const m=d.match(/(\d+)\/(\d+)\/(\d+)/);return m?new Date(+m[3],+m[1]-1,+m[2]).getDay():-1;});
  const ioaBy=cn.map(c=>{const rs=rows.filter(r=>r.c===c.i);return rs.filter(r=>r.ioa!=null).length+'/'+rs.length;});
  return {dates:dates.length,weekend:wk.filter(d=>d===0||d===6).length,ioaBy,demMean:dy.reduce((a,b)=>a+b,0)/dy.length,term:v('s.term'),dfn:document.querySelector('[name="d.fn"]').checked,func:v('d.func'),tx:v('d.tx'),pl:v('pl.done'),q:v('m.question'),vicond:v('m.vicond'),viconf:v('m.viconf'),termTicks:rows.filter(r=>r.term).length,banner:document.getElementById('simDesc').textContent};});
 ok('the simulation puts IOA in every condition (1 of 4), its dates on school days, aggression at 1 to 3 a minute, an aggression termination criterion, the Plan and Setup rows filled and the Decision signed off',
   sim.ioaBy.every(x=>x==='1/4')&&sim.dates>=30&&sim.weekend===0&&sim.demMean>=1&&sim.demMean<=4&&/aggress/i.test(sim.term)&&sim.dfn&&/escape/i.test(sim.func)&&/TD-1/.test(sim.tx)&&sim.pl==='1'&&/aggression toward staff/.test(sim.q)&&/Compare .*Demand/.test(sim.vicond)&&sim.viconf&&sim.termTicks===0&&/drawn fresh/.test(sim.banner),sim);
 /* ---- the criterion: SD label, trend flag (R-082) ---- */
 await view('analysis');await sleep(300);let c0=await crit();
 const att=Object.keys(c0.rows).find(k=>/attention/i.test(k)),dem=Object.keys(c0.rows).find(k=>/demand/i.test(k)),play=Object.keys(c0.rows).find(k=>/play/i.test(k));
 const sdRow=await p.evaluate(()=>document.querySelector('#critTbl tbody tr').textContent);
 ok('the control row says population SD and the note gives the sample SD',/population SD, ÷ n/.test(sdRow)&&/sample SD \(÷ n − 1\) is \d/.test(c0.note)&&/^Differentiated: Demand/.test(c0.verdict.replace(/^Outcome/,'')),{sdRow,note:c0.note,v:c0.verdict.slice(0,80)});
 const attIdx=await p.evaluate(()=>{const cn=eaAPI.condNames(),a=cn.find(c=>/attention/i.test(c.name));return eaAPI.sessData().filter(r=>r.c===a.i).map(r=>r.i);});
 const keepAtt=await p.evaluate(ix=>ix.map(i=>document.querySelector('[name="s['+i+'].v"]').value),attIdx);
 for(const [k,v] of [0,3,8,3].entries())await setv('s['+attIdx[k]+'].v',String(v));await view('analysis');await sleep(250);let c1=await crit();
 for(const [k,v] of [0,3,5,8].entries())await setv('s['+attIdx[k]+'].v',String(v));await view('analysis');await sleep(250);let c2=await crit();
 ok('the trend flag names this form\'s slope rule and is not raised when the last point falls back (0, 3, 8, 3), but is on a rising series (0, 3, 5, 8)',!/trend/.test(c1.rows[att].flags)&&/upward trend \(this form's slope rule/.test(c2.rows[att].flags),{a:c1.rows[att],b:c2.rows[att]});
 for(const [k,v] of keepAtt.entries())await setv('s['+attIdx[k]+'].v',v);
 /* ---- the log reads its entries (R-004) ---- */
 const keep=await p.evaluate(()=>['s[0].v','s[1].v','s[2].m','s[3].ioa'].map(n=>document.querySelector('[name="'+n+'"]').value));
 await setv('s[0].v','abc');await setv('s[1].v','-5');await setv('s[2].m','0');await setv('s[3].ioa','150');await view('analysis');await sleep(250);
 const badc=await p.evaluate(()=>{const g=n=>document.querySelector('[name="'+n+'"]');return {inv:['s[0].v','s[1].v','s[2].m','s[3].ioa'].map(n=>g(n).getAttribute('aria-invalid')),rate0:document.getElementById('sRate0').textContent,rate2:document.getElementById('sRate2').textContent,note:document.getElementById('critNote').textContent,mean:(document.getElementById('ioaStat').textContent.match(/Mean IOA(—|[\d.]+)/)||[])[1],mode:g('s[0].v').getAttribute('inputmode')};});
 ok('a count "abc", a count −5, minutes 0 and an IOA of 150 mark their cells, clear the rate, are listed as rows not read and stay out of the IOA mean',badc.inv.every(x=>x==='true')&&badc.rate0===''&&badc.rate2===''&&/Rows not read: row 1 \(value "abc": not a number\); row 2 \(value "-5": a count or value is 0 or more\); row 3 \(minutes "0": minutes are more than 0\)/.test(badc.note)&&(badc.mean==='—'||+badc.mean<=100)&&badc.mode==='decimal',badc);
 await setv('s[0].v',keep[0]);await setv('s[1].v',keep[1]);await setv('s[2].m',keep[2]);await setv('s[3].ioa',keep[3]);await view('analysis');await sleep(250);
 const clean=await p.evaluate(()=>({inv:document.querySelectorAll('#sessBody [aria-invalid]').length,note:document.getElementById('critNote').textContent}));
 ok('restored entries clear the marks and the rows-not-read line',clean.inv===0&&!/Rows not read/.test(clean.note),clean);
 /* ---- the safety gate (R-008) ---- */
 const keepSafe=await p.evaluate(()=>['s.consent','s.term'].map(n=>document.querySelector('[name="'+n+'"]').value));
 await setv('s.consent','');await setv('s.term','');await view('sessions');await sleep(200);
 await p.evaluate(()=>{const s=document.getElementById('eaCond');s.value=[...s.options].find(o=>/demand/i.test(o.textContent)).value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
 c0=await crit();   /* the criterion before any terminated session: Demand n and mean */
 await view('sessions');await sleep(150);
 await p.evaluate(()=>document.getElementById('eaStart').click());await sleep(300);
 const gate=await p.evaluate(()=>{const d=document.getElementById('eaGateDlg');return {open:!!(d&&d.open),items:d?[...d.querySelectorAll('li')].map(l=>l.textContent):[],state:eaRunner.state()};});
 await p.evaluate(()=>document.getElementById('eaGateGo').click());await sleep(200);
 const went=await p.evaluate(()=>document.body.className);
 ok('with no consent line and no termination criteria, Start session lists both and Go to Setup & safety opens that sheet; nothing started',gate.open&&gate.items.length===2&&/consent/.test(gate.items[0])&&/termination/.test(gate.items[1])&&gate.state==='ready'&&/view-setup/.test(went),{gate,went});
 await view('sessions');await sleep(150);await p.evaluate(()=>document.getElementById('eaStart').click());await sleep(250);await p.evaluate(()=>document.getElementById('eaGateOk').click());await sleep(700);
 const running=await p.evaluate(()=>({state:eaRunner.state(),term:document.getElementById('eaRunTerm').hidden?'':document.getElementById('eaRunTerm').textContent}));
 await p.evaluate(()=>{document.getElementById('eaTarget').click();document.getElementById('eaTarget').click();});await sleep(200);
 await p.evaluate(()=>document.getElementById('eaEnd').click());await sleep(400);await p.evaluate(()=>document.getElementById('eaSave').click());await sleep(400);
 const saved=await p.evaluate(()=>{const rows=eaAPI.sessData();const r=rows[rows.length-1];return {i:r.i,ex:r.ex,term:r.term,notes:document.querySelector('[name="s['+r.i+'].n"]').value,cond:r.c};});
 ok('Start anyway (BCBA) runs the session with the missing criteria shown on the card, and the saved row says it started without them',running.state==='run'&&/no termination criteria written/.test(running.term)&&/ended early/.test(saved.notes)&&/started without the consent line \(Consent and notification\), session termination criteria on file/.test(saved.notes)&&saved.term&&saved.ex==='terminated',{running,saved});
 await setv('s.consent',keepSafe[0]);await setv('s.term',keepSafe[1]);
 /* ---- the terminated session stays out of the criterion (R-001) ---- */
 await view('analysis');await sleep(300);let c3=await crit();
 ok('the two-second Demand session (saved at 50 a minute) leaves Demand at n = 4 with the same mean, is listed under the table, marked × on the graph and counted in the Outcome line',c3.rows[dem].n===4&&c3.rows[dem].mean===c0.rows[dem].mean&&new RegExp('Left out of the criterion .*session '+(saved.i+1)+', Demand, terminated').test(c3.note)&&c3.marks>=1&&c3.top<50&&/1 session\(s\) left out of the criterion/.test(c3.verdict),{before:c0.rows[dem],after:c3.rows[dem],note:c3.note,marks:c3.marks,top:c3.top});
 await p.evaluate(()=>{const s=document.getElementById('critExcl');s.value='count';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);let c4=await crit();
 await p.evaluate(()=>{const s=document.getElementById('critExcl');s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
 ok('choosing Counted puts it back into the criterion (Demand n = 5, a higher mean) and the note says so',c4.rows[dem].n===5&&+c4.rows[dem].mean>+c0.rows[dem].mean&&/Counted in the criterion by your choice/.test(c4.note)&&/counted in the criterion by your choice/.test(c4.verdict),{c4:c4.rows[dem],note:c4.note.slice(0,200)});
 /* assent withdrawn in the control condition */
 await view('sessions');await sleep(150);await p.evaluate(()=>{const s=document.getElementById('eaCond');s.value=[...s.options].find(o=>/play/i.test(o.textContent)).value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
 const termShown=await p.evaluate(()=>{document.getElementById('eaStart').click();return new Promise(r=>setTimeout(()=>r({state:eaRunner.state(),term:document.getElementById('eaRunTerm').textContent}),600));});
 await p.evaluate(()=>{document.getElementById('eaTarget').click();document.getElementById('eaAssentEnd').click();});await sleep(300);await p.evaluate(()=>document.getElementById('eaSave').click());await sleep(400);
 await view('analysis');await sleep(300);let c5=await crit();
 ok('with the criteria on file the session starts at once and shows them; a control session ended on Assent withdrawn leaves the control at n = 4 and its lines where they were',termShown.state==='run'&&/Stop the session when: Any aggression/.test(termShown.term)&&c5.rows[play].n===4&&c5.rows[play].mean===c0.rows[play].mean&&/assent withdrawn/.test(c5.note)&&/2 session\(s\) left out/.test(c5.verdict)&&c5.marks>=2,{termShown,play:c5.rows[play],before:c0.rows[play],note:c5.note});
 /* ---- agreement by condition (R-007) ---- */
 const demIdx=await p.evaluate(()=>{const cn=eaAPI.condNames(),d=cn.find(c=>/demand/i.test(c.name));return eaAPI.sessData().filter(r=>r.c===d.i).map(r=>r.i);});
 const keepIoa=await p.evaluate(ix=>ix.map(i=>document.querySelector('[name="s['+i+'].ioa"]').value),demIdx);
 for(const i of demIdx)await setv('s['+i+'].ioa','');await view('analysis');await sleep(300);let c6=await crit();
 const hand=await p.evaluate(()=>{try{const e=window.__nbhFactsOut&&window.__nbhFactsOut();const ev=e&&(e.evidence||e.ev||e);return ev?{strength:ev.strength,statement:ev.statement}:null;}catch(x){return {err:String(x)};}});
 await view('sessions');await sleep(150);await p.evaluate(()=>{const s=document.getElementById('eaCond');s.value=[...s.options].find(o=>/demand/i.test(o.textContent)).value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
 const card=await p.evaluate(()=>document.getElementById('eaScript').textContent);
 ok('with no IOA in Demand the by-condition line marks it under plan, the Outcome flags the differentiated condition, the hand-off carries it as Moderate, the log says which condition needs the second observer, and the runner\'s card says so when Demand is picked',
   /class="ea-low"[^>]*>Demand: 0% \(under plan\)/.test(c6.ioa)&&/Agreement is short in the differentiated condition: Demand has no IOA session of 5; the plan is at least 25%/.test(c6.verdict)&&!c6.need.hidden&&/IOA under the plan \(≥ 25%.*Demand 0 of 5/.test(c6.need.text)&&(hand==null||(hand.strength==='Moderate'&&/Agreement is short/.test(hand.statement)))&&/IOA so far 0 of 5 sessions \(0%; plan ≥ 25%\): bring the second observer/.test(card),{ioa:c6.ioa.slice(0,300),v:c6.verdict.slice(0,500),need:c6.need,hand,card:card.slice(-200)});
 for(const [k,i] of demIdx.entries())await setv('s['+i+'].ioa',keepIoa[k]);
 /* the two sessions added above (terminated Demand, assent-withdrawn Play) had no IOA, so 1 of 5 is under a 25% plan: score them */
 const lastTwo=await p.evaluate(()=>eaAPI.sessData().filter(r=>r.ex).map(r=>r.i));for(const i of lastTwo)await setv('s['+i+'].ioa','90');await view('analysis');await sleep(300);let c7=await crit();
 ok('with IOA back in Demand (and the two stopped sessions scored) the flag and the prompt go away',!/Agreement is short/.test(c7.verdict)&&c7.need.hidden&&!/ea-low"[^>]*>Demand/.test(c7.ioa),{v:c7.verdict.slice(0,300),need:c7.need});
 /* ---- the observer's sheet (E-31) ---- */
 await view('sessions');await sleep(150);await p.evaluate(()=>document.getElementById('eaObsBtn').click());await sleep(400);
 const obs=await p.evaluate(()=>({prints:window.__prints,cls:window.__printCls,pages:window.__obsPages,vis:window.__obsVis,text:document.getElementById('eaObsSheet').textContent}));
 await sleep(2200);const obsAfter=await p.evaluate(()=>({cls:document.body.className,hidden:document.getElementById('eaObsSheet').hidden}));
 await p.evaluate(()=>{window.ea120.obsSheet().hidden=false;document.body.classList.add('print-obs');});await p.emulateMedia({media:'print'});
 const obsVis=await p.evaluate(()=>({sheet:getComputedStyle(document.getElementById('eaObsSheet')).display,setup:getComputedStyle(document.getElementById('setup')).display,sess:getComputedStyle(document.getElementById('sessions')).display}));
 const pdf=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});
 await p.evaluate(()=>{document.body.classList.remove('print-obs');document.getElementById('eaObsSheet').hidden=true;});
 ok('Print the observer\'s sheet prints one page per condition (four), with the signal, the therapist\'s behavior, the consequence, the tally grid, the agreement box and the termination criteria, and nothing else; the sheet is hidden again afterwards',
   obs.prints===1&&/print-obs/.test(obs.cls)&&obs.pages===4&&obs.vis&&/Signal/.test(obs.text)&&/Agreement: smaller ÷ larger/.test(obs.text)&&/Stop the session when: Any aggression/.test(obs.text)&&/SIMULATED/.test(obs.text)&&!/print-obs/.test(obsAfter.cls)&&obsAfter.hidden&&obsVis.sheet==='block'&&obsVis.setup==='none'&&obsVis.sess==='none'&&pages(pdf)===4,{obs:Object.assign({},obs,{text:obs.text.slice(0,200)}),obsAfter,obsVis,pdf:pages(pdf)});
 /* ---- the runner after a file is opened (R-137) ---- */
 const dl=p.waitForEvent('download');await p.evaluate(()=>document.getElementById('saveBtn').click());const file=path.join(os.tmpdir(),'ea120-reopen.json');await (await dl).saveAs(file);
 const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push('p2 '+String(e)));await p2.goto(BASE+EA);await sleep(1500);await p2.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});
 const fresh2=await p2.evaluate(()=>document.body.className);
 await p2.setInputFiles('#fileIn',file);await sleep(1200);
 const re=await p2.evaluate(()=>({cls:document.body.className,cons:document.getElementById('eaCons').value,cond:document.getElementById('eaCond').selectedOptions[0]?.textContent,script:document.getElementById('eaScript').textContent.slice(0,60)}));
 ok('a fresh page opens on Plan; opening a saved file lands on Setup & safety and the runner has read its card (Consequence period filled) without the condition being re-picked',/view-plan/.test(fresh2)&&/view-setup/.test(re.cls)&&+re.cons>0&&re.script.length>0,{fresh2,re});
 /* ---- the Plan when the consequence is ruled out (R-083) ---- */
 const p3=await ctx.newPage();p3.on('pageerror',e=>errs.push('p3 '+String(e)));await p3.goto(BASE+EA);await sleep(1500);
 const pick=async v=>{await p3.evaluate(v=>{const b=[...document.querySelectorAll('#plWrap .pl-opt')].find(x=>x.dataset.v===v);if(!b)throw new Error('no option '+v+' on '+document.querySelector('#plWrap .pl-q').textContent);b.click();document.querySelector('#plWrap .pl-next').click();},v);await sleep(120);};
 for(const v of ['fn','escape','high','no','room','low','no','first'])await pick(v);
 await p3.evaluate(()=>document.querySelector('#plWrap .pl-next').click());await sleep(120);await p3.evaluate(()=>document.querySelector('#plWrap .pl-next').click());await sleep(300);
 const plan=await p3.evaluate(()=>({rec:[...document.querySelectorAll('#plWrap .pl-row')].map(r=>r.textContent).find(t=>/Recommended variant/.test(t)),why:document.querySelector('#plWrap .pl-noconseq')?.textContent,urgBefore:document.querySelector('[name="m.urg"]').value}));
 await p3.evaluate(()=>document.querySelector('#plWrap .pl-set').click());await sleep(500);
 const after3=await p3.evaluate(()=>({urg:document.querySelector('[name="m.urg"]').value,chosen:document.querySelector('[name="v.chosen"]').value,cls:document.body.className}));
 ok('when the team has ruled out delivering the consequence (high risk, low rate, classroom-free), the Plan recommends the antecedent-only analysis first, says why the trial-based, latency-based and standard analyses are not offered, and Set it up writes urgency level 4',
   /Antecedent-only/.test(plan.rec)&&/not offered first/.test(plan.why||'')&&plan.urgBefore===''&&after3.urg==='4'&&after3.chosen==='antecedent',{plan,after3});
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
