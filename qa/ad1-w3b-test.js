/* Form AD-1, review Wave 3 part 2: the integrity log, read for each arrangement with the share of its sessions observed
   (F410); the decision sent to the case, registered by the workstation, said to staff on Form QS-1, and copied as text
   (F412). Simulated data only. usage: node qa/ad1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const AD='AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html',QS='QS-1_Staff-Quick-Start_v2026-10.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1100);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(AD);
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  const T=s=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},s);

  /* ---- F410 the integrity log ---- */
  const a=await p.evaluate(()=>({n:document.getElementById('tbTI2').rows.length,cells:[...document.getElementById('tbTI2').rows].map(tr=>tr.cells[6].textContent),
    log:document.getElementById('tiLogOut').textContent.replace(/\s+/g,' '),dec:document.getElementById('decSummary').textContent,first:document.querySelector('#tiOut span').textContent}));
  ok('1 F410 the simulated case logs one observation in each arrangement; the log reads integrity per arrangement with the sessions observed, and so does the decision',
    a.n===3&&a.cells.join('|')==='100.0%|90.0%|90.0%'&&/Distributed\s*1\s*90\.0%\s*90\.0%\s*1 of 5/.test(a.log)&&/Accumulated\s*1\s*100\.0%\s*100\.0%\s*1 of 5/.test(a.log)&&a.first==='This observation'&&
    /Data quality \(Tab 6\)\. integrity by arrangement: distributed 90\.0% \(1 of 5 sessions\), accumulated 100\.0% \(1 of 5 sessions\), accumulated \+ tokens 90\.0% \(1 of 5 sessions\); IOA/.test(a.dec),a);
  const b=await p.evaluate(()=>{document.getElementById('tbTI2').rows[0].remove();const r=document.getElementById('tbTI2').rows[0].querySelectorAll('input,select');r[4].value='7';adRefresh();
    return {un:(document.getElementById('tiUnobs')||{}).textContent||'',under:(document.getElementById('tiUnder')||{}).textContent||'',dec:document.getElementById('decSummary').textContent};});
  ok('2 F410 an arrangement run but never observed is named, and one observed under the criterion is flagged, in the log and in the decision',
    /No integrity observation yet of accumulated\./.test(b.un)&&/Under 90%: distributed \(lowest 70\.0%\)\. Retrain/.test(b.under)&&/integrity by arrangement: distributed 70\.0% \(1 of 5 sessions\), accumulated \+ tokens 90\.0% \(1 of 5 sessions\); under 90% in distributed; not observed: accumulated;/.test(b.dec),b);
  const w=await p.evaluate(()=>{const s=document.querySelector('[name="ti_cond"]');s.value='Accumulated';const n=document.querySelector('[name="ti_sess"]');n.value='7';
    document.getElementById('btnTIlog').click();const tb=document.getElementById('tbTI2'),v=[...tb.rows[tb.rows.length-1].querySelectorAll('input,select')].map(x=>x.value);
    return {v,msg:document.getElementById('tiLogMsg').textContent,left:document.querySelectorAll('#tbTI input[type=radio]:checked').length,sess:n.value,un:(document.getElementById('tiUnobs')||{}).textContent||''};});
  ok('3 F410 the checklist writes its observation to the log (date, session, arrangement, observer, steps) and clears for the next',
    w.v.slice(0,6).join('|')==='2026-09-16|7|Accumulated|School psychologist (second observer)|9|10'&&/^Written to the log as row 3 \(90\.0%\)\. The checklist is clear for the next observation\./.test(w.msg)&&w.left===0&&w.sess===''&&w.un==='',w);
  const old=await p.evaluate(async()=>{document.getElementById('tbTI2').innerHTML='';[1,2,3,4,5,7,8,10,11,12,14].forEach(i=>{const r=document.querySelector('[name="ti'+i+'"][value="y"]');if(r)r.checked=true;});
    const r9=document.querySelector('[name="ti9"][value="n"]');r9.checked=true;document.querySelector('[name="ti_cond"]').value='Accumulated + tokens';adRefresh();return document.getElementById('decSummary').textContent;});
  ok('4 F410 with nothing in the log (a file saved before it), the one checklist is said to be one session\'s integrity',/integrity 91\.7% on the one observation scored \(accumulated \+ tokens\), meets 90%; one observation is one session's integrity: write each to the log \(Tab 6A\)/.test(old),old);

  /* ---- F412 the decision sent to the case ---- */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  const f=await p.evaluate(()=>{const o=window.__nbhFactsOut();const t=window.adPlanText();const d=document.querySelector('[name="dec_arr"]');const was=d.value;d.value=[...d.options].find(x=>/^Continue/.test(x.value)).value;const none=window.__nbhFactsOut();d.value=was;return {o,t,none};});
  const A=f.o&&f.o.arrangement||{};
  ok('5 F412 AD-1 sends the decision and its plan to the case: the arrangement, the reinforcer, the amount, the requirement, the exchange, how access ends, the ladder; nothing while the evaluation continues',
    A.choice==='Accumulated + tokens'&&A.key==='tok'&&A.reinforcer==='Tablet: racing game (bricks as the alternate)'&&A.unit==='30 s per problem'&&A.req===10&&A.bank==='Token board'&&/^Count the tokens aloud together/.test(A.exchange)&&/^Timer at zero/.test(A.end)&&A.ladder.length===4&&A.ladder[1].req===15&&A.work==='One math problem completed'&&A.src==='AD-1'&&f.none===null,f);
  ok('6 F412 the plan copies as text for the forms that do not read it yet',/^Reinforcer arrangement \(Form AD-1\): Accumulated \+ tokens, decided 2026-09-24\nReinforcer: Tablet: racing game/.test(f.t)&&/\nWork requirement now: 10\n/.test(f.t)&&/\nExtending the work requirement: 1\) 10 responses, 30 s; advance after 3 consecutive sessions/.test(f.t),f.t);
  const sh=await open('index.html');
  const reg=await sh.evaluate(()=>({src:FACT_SRC['AD-1'],gen:FACT_GEN.includes('AD-1'),has:hasFacts({arrangement:{choice:'Distributed'}}),sig:factsSig({arrangement:{choice:'Distributed'}}).includes('Distributed')}));
  ok('7 F412 the workstation takes AD-1\'s arrangement into the case',reg.src==='arrangement'&&reg.gen&&reg.has&&reg.sig,reg);
  const q=await open(QS);
  const day=await q.evaluate(a=>{const r=window.__nbhFactsIn({arrangement:a});const t=S.day.map(x=>x.text).filter(Boolean);
    const r2=window.__nbhFactsIn({arrangement:Object.assign({},a,{key:'dis',choice:'Distributed',unit:'30 s',end:''})});return {t,t2:S.day.map(x=>x.text).filter(Boolean)};},A);
  ok('8 F412 Form QS-1 tells staff how the reward comes, in plain words, once',day.t.filter(x=>/^How the reward comes:/.test(x)).length===1&&
    day.t.includes('How the reward comes: a token for each one math problem completed; after 10 tasks, count the tokens together and trade them for Tablet: racing game (bricks as the alternate) (30 s per problem). When the time is up: timer at zero: “Time’s up,” open hand, 5-s wait, tablet to the bin.')&&
    day.t2.includes('How the reward comes: Tablet: racing game (bricks as the alternate) right after each one math problem completed (30 s).'),day);
  /* save and open keeps the log */
  const rt=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;document.getElementById('tbTI2').innerHTML='';
    const dt=new DataTransfer();dt.items.add(new File([txt],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,500));return {n:document.getElementById('tbTI2').rows.length,sess:document.querySelector('[name="ti_sess"]').value};});
  ok('9 F410 the log and the session observed are saved and opened again',rt.n===3&&rt.sess==='19',rt);
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
