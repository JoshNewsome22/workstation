/* Form AD-1, review Wave 3 part 1: stop rules on every script, a Stopped early column left out of the comparison, the
   runner's Stop and the rule from the crisis plan (F408); under the work-time rule a row without work minutes is named and
   the decision says no rate could be computed (F411); the evidence guide prints only when asked and the packet treats it as
   a Guide (F413); Tab 7 starts from Tab 3 (F414); the graph follows the question (F415); IOA ranges, a check under 80% and
   coverage per arrangement (F416); the function the case carries (F417). Simulated data only.
   usage: node qa/ad1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const AD='AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+AD);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const T=sel=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},sel);
  const set=async(k,v)=>{await p.evaluate(([k,v])=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);await sleep(300);};
  const q=async id=>{await p.evaluate(id=>{const e=document.getElementById(id);e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));},id);await sleep(300);};
  const script=k=>p.evaluate(k=>{const c=[...document.querySelectorAll('#scriptOut .script-card')].find(c=>c.querySelector('h4').textContent===k);return c?c.textContent.replace(/\s+/g,' '):'';},k);
  const sessRows=rows=>p.evaluate(rows=>{document.getElementById('tbSess').innerHTML='';rows.forEach(v=>{document.querySelector('[data-add="tbSess"]').click();const tb=document.getElementById('tbSess'),f=tb.rows[tb.rows.length-1].querySelectorAll('input,select');v.forEach((x,i)=>{f[i].value=x;});});adRefresh();},rows);

  /* ---- F408 the stop rules ---- */
  const f0=await p.evaluate(()=>({term:!!document.querySelector('[name="d_term"]'),stop:!!document.querySelector('[name="d_stop"]')}));
  await p.evaluate(()=>{['c_bl','c_dis','c_acc'].forEach(n=>{const e=document.querySelector('[name="'+n+'"]');if(e){e.checked=true;}});adRefresh();});await sleep(200);
  const d0=await script('Distributed');
  await set('d_term','Any hit with contact, or the student asks to stop.');const d1=await script('Accumulated');
  ok('1 F408 Tab 3E holds the session and evaluation stop rules; every script carries the stop rule, the generic one until it is written',
    f0.term&&f0.stop&&/Stop the session if the student or an adult is at risk of injury, and follow the crisis plan \(Form CR-1\); mark the row Stopped early\. Write the stop rule in Section E\./.test(d0)&&
    /Stop the session if any hit with contact, or the student asks to stop\. Follow the crisis plan \(Form CR-1\) and mark the row Stopped early\./.test(d1),{f0,d0:d0.slice(-400),d1:d1.slice(-400)});
  const ti=await p.evaluate(()=>[...document.querySelectorAll('#tbTI tr')].map(tr=>tr.textContent).pop());
  ok('2 F408 the integrity checklist asks whether the session was stopped when the rule was met',/stopped at once when the stop rule \(Tab 3E\) was met/.test(ti),ti);

  /* ---- the simulated case: a stopped session is left out of the comparison ---- */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  const sim=await p.evaluate(()=>({term:document.querySelector('[name="d_term"]').value,th:[...document.querySelectorAll('#tbSess')[0].closest('table').querySelectorAll('th')].map(t=>t.textContent).join('|')}));
  const sum0=await p.evaluate(()=>{const r=[...document.querySelectorAll('#sumOut tbody tr')].find(tr=>/^Accumulated$/.test(tr.cells[0].textContent.trim()));return r?r.cells[1].textContent:'';});
  await p.evaluate(()=>{const tr=document.getElementById('tbSess').rows[6];tr.querySelectorAll('input,select')[10].value='Stopped';adRefresh();});await sleep(300);
  const st=await p.evaluate(()=>{const r=[...document.querySelectorAll('#sumOut tbody tr')].find(tr=>/^Accumulated$/.test(tr.cells[0].textContent.trim()));const tr=document.getElementById('tbSess').rows[6];
    return {n:r?r.cells[1].textContent:'',cls:tr.className,rate:tr.cells[12].textContent,cmp:document.getElementById('cmpOut').textContent,dec:document.getElementById('decSummary').textContent,
      g:[...document.querySelectorAll('#effPlot text')].filter(t=>t.textContent==='stopped').length};});
  ok('3 F408 a session marked Stopped early stays on the log (marked) and the graph, and is left out of the comparison; the decision names it',
    /Stopped early/.test(sim.th)&&sum0==='5'&&st.n==='4'&&/ad-stopped/.test(st.cls)&&st.rate!==''&&st.g===1&&
    /Stopped early under the stop rule \(Tab 3E\): Accumulated, session 7\. Left out of the comparison/.test(st.cmp)&&/Stopped early \(Tab 3E\)\. 1 accumulated session ended under the stop rule and is left out of the comparison\./.test(st.dec),{sim,sum0,st});
  /* save and open: the column is kept; a file saved before it opens as it was */
  const rt=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;
    const d=JSON.parse(txt);const old=JSON.parse(txt);old.tables.tbSess=old.tables.tbSess.map(r=>r.slice(0,10));
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(old)],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,500));const oldRow=[...document.getElementById('tbSess').rows[6].querySelectorAll('input,select')].map(x=>x.value);
    const dt2=new DataTransfer();dt2.items.add(new File([txt],'y.json',{type:'application/json'}));i.files=dt2.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,500));return {saved:d.tables.tbSess[6][10],oldRow,back:document.getElementById('tbSess').rows[6].querySelectorAll('input,select')[10].value};});
  ok('4 F408 the Stopped early mark is saved and opened again; a file saved before the column opens with its rows in place',rt.saved==='Stopped'&&rt.back==='Stopped'&&rt.oldRow[2]==='Accumulated'&&rt.oldRow[9]===''&&rt.oldRow[10]==='',rt);

  /* ---- F408 the runner's Stop ---- */
  const run=await p.evaluate(async()=>{const box=document.getElementById('adRun');box.open=true;box.dispatchEvent(new Event('toggle'));await new Promise(r=>setTimeout(r,100));
    const c=document.getElementById('adrCond');c.value='acc';c.dispatchEvent(new Event('change',{bubbles:true}));const n0=document.getElementById('tbSess').rows.length;
    document.getElementById('adrStart').click();await new Promise(r=>setTimeout(r,250));document.getElementById('adrResp').click();document.getElementById('adrPB').click();
    const dis=document.getElementById('adrStop').disabled;document.getElementById('adrStop').click();await new Promise(r=>setTimeout(r,100));const msg=document.getElementById('adrMsg').textContent,st=adRunner.state();
    document.getElementById('adrWrite').click();await new Promise(r=>setTimeout(r,200));const tb=document.getElementById('tbSess'),v=[...tb.rows[tb.rows.length-1].querySelectorAll('input,select')].map(x=>x.value);
    return {dis,msg,st,n:tb.rows.length-n0,v};});
  ok('5 F408 the runner\'s Stop ends the session at once (follow the crisis plan) and the row is written marked Stopped early',
    run.dis===false&&run.st==='done'&&/^Stopped under the stop rule: follow the crisis plan \(Form CR-1\)\. Session stopped: 1 response/.test(run.msg)&&run.n===1&&run.v[2]==='Accumulated'&&run.v[4]==='1'&&run.v[5]==='1'&&run.v[10]==='Stopped',run);

  /* ---- F408 the stop rule from the crisis plan ---- */
  const cr=await p.evaluate(()=>{const e=document.querySelector('[name="d_term"]');e.value='';const r=window.__nbhFactsIn({crisis:{beh:'Hitting adults with a closed fist.',precursor:'',stages:[{s:'Crisis',do:'Clear the room',who:'Teacher'}],src:'CR-1'}});
    const a=e.value;e.value='Typed rule';window.__nbhFactsIn({crisis:{beh:'Kicking',stages:[]}});return {a,b:e.value,note:r&&r.note};});
  ok('6 F408 the stop rule starts from the crisis plan (Form CR-1) when empty, and typed text is kept',cr.a==='Any hitting adults with a closed fist (the dangerous behavior on Form CR-1), or the student or an adult at risk of injury'&&cr.b==='Typed rule'&&/the stop rule from Form CR-1/.test(cr.note),cr);

  /* ---- F411 the work-time rule without work minutes ---- */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  await sessRows([['2026-09-09','ME','Distributed','10','10','3','','300','15.3',''],['2026-09-09','ME','Accumulated','10','10','0','','300','10.2',''],['2026-09-10','ME','Distributed','10','10','4','','300','15.9',''],['2026-09-10','ME','Accumulated','10','10','1','','300','10.3','']]);await sleep(300);
  const w=await p.evaluate(()=>({cmp:document.getElementById('cmpOut').textContent,dec:document.getElementById('decSummary').textContent,cls:document.getElementById('tbSess').rows[0].className}));
  await set('clock_rule','total');
  const w2=await p.evaluate(()=>({cmp:document.getElementById('cmpOut').textContent,dec:document.getElementById('decSummary').textContent,g:document.getElementById('gMeasure').value}));
  await set('clock_rule','work');
  ok('7 F411 under the work-time rule, rows with responses and no work minutes are named, and the decision says no rate could be computed',
    /No work minutes on 4 rows with responses \(sessions 1, 2, 3, 4\)/.test(w.cmp)&&/ad-nowork/.test(w.cls)&&/Efficacy \(Tab 4\)\. No responses per minute of work could be computed \(work minutes missing on 4 rows\)\./.test(w.dec),w);
  ok('8 F411 under the total-time rule the same rows give responses per minute of total session, with no warning',/^Responses per minute of total session \(the primary measure/.test(w2.cmp)&&!/No work minutes/.test(w2.cmp)&&/On responses per minute of total session, Accumulated was best/.test(w2.dec)&&w2.g==='eff',w2);

  /* ---- F415 the graph follows the question ---- */
  await q('q2');const g1=await p.evaluate(()=>document.getElementById('gMeasure').value);
  await q('q4');const g2=await p.evaluate(()=>document.getElementById('gMeasure').value);
  await set('g_measure','tot');await q('q1');const g3=await p.evaluate(()=>document.getElementById('gMeasure').value);
  ok('9 F415 the graph opens on the question\'s primary measure (escape: problem behavior; classroom: percentage) until someone picks another',g1==='pb'&&g2==='pct'&&g3==='tot',{g1,g2,g3});

  /* ---- F416 IOA ---- */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  const io=await p.evaluate(()=>({out:document.getElementById('ioaOut').textContent.replace(/\s+/g,' '),dec:document.getElementById('decSummary').textContent}));
  ok('10 F416 IOA: each mean with its range, the check under 80% named with its measure and session, coverage by arrangement, and the decision reports the range',
    /IOA, all checks\s*97\.3% \(75\.0–100\.0\)/.test(io.out)&&/Problem behavior \(5\)\s*95\.0% \(75\.0–100\.0\)/.test(io.out)&&/Under 80%: 75\.0% \(problem behavior, session 9\)/.test(io.out)&&
    /Sessions with IOA by arrangement: Baseline \/ control 0 of 8 \(0%\); Distributed 3 of 5 \(60%\); Accumulated 3 of 5 \(60%\); Accumulated \+ tokens 2 of 5 \(40%\)\./.test(io.out)&&/Under a third of sessions in baseline \/ control: collect IOA/.test(io.out)&&
    /IOA 75\.0–100\.0% \(mean 97\.3%\) across 10 checks, 35% of sessions; lowest 75\.0% \(problem behavior, session 9\), under 80%; under a third of sessions checked in baseline \/ control\./.test(io.dec),io);

  /* ---- F417 the function ---- */
  const fl=await p.evaluate(()=>document.getElementById('learnerFlags').textContent);
  await q('q2');const fl2=await p.evaluate(()=>document.getElementById('learnerFlags').textContent);await q('q1');
  ok('11 F417 the function recorded names escape under the work question: the escape caution is shown, once',/The function recorded names escape \(“Access to the tablet and escape from math/.test(fl)&&/compliance question \(Fulton et al\., 2020; Frank-Crawford et al\., 2021\) may fit better/.test(fl)&&
    !/The function recorded names escape/.test(fl2)&&/Escape-maintained problem behavior/.test(fl2),{fl:fl.slice(0,900),fl2:fl2.slice(0,300)});

  /* ---- F414 Tab 7 from Tab 3 ---- */
  const pl=await p.evaluate(async()=>{['pl_rf','pl_unit','pl_req','pl_exch','pl_end','dec_arr'].forEach(n=>{document.querySelector('[name="'+n+'"]').value='';});document.querySelector('[name="pl_bank"]').value='';
    document.querySelector('[name="pl_exch"]').value='Typed exchange';adRefresh();const ph=document.querySelector('[name="pl_rf"]').placeholder;
    const d=document.querySelector('[name="dec_arr"]');d.value='Accumulated + tokens';d.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {ph,rf:v('pl_rf'),unit:v('pl_unit'),req:v('pl_req'),exch:v('pl_exch'),end:v('pl_end'),bank:v('pl_bank')};});
  ok('12 F414 Tab 7 shows Tab 3\'s values, and choosing the decision writes them into the empty plan fields; typed text is kept',
    pl.ph==='from Tab 3: Tablet: racing game'&&pl.rf==='Tablet: racing game'&&pl.unit==='30 s per response'&&pl.req==='10'&&pl.exch==='Typed exchange'&&/^Timer on the desk/.test(pl.end)&&pl.bank==='Token board',pl);

  /* ---- F413 the evidence guide out of the print ---- */
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const g=document.getElementById('adGuide'),refs=[...document.querySelectorAll('#p9 h3')].find(h=>h.textContent==='References');
    const a={guide:getComputedStyle(g).display,refs:refs?getComputedStyle(refs).display:'none',p9:getComputedStyle(document.getElementById('p9')).display};
    const t=document.getElementById('adGuidePr');t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));a.ticked=getComputedStyle(g).display;t.checked=false;t.dispatchEvent(new Event('change',{bubbles:true}));
    document.body.classList.add('ad-guide-printing');a.alone=getComputedStyle(g).display;a.p1=getComputedStyle(document.getElementById('p1')).display;document.body.classList.remove('ad-guide-printing');return a;});
  await p.emulateMedia({media:'screen'});
  ok('13 F413 the evidence guide stays out of the form\'s print (its References print); ticked, it prints with the form; alone, only it prints',pr.guide==='none'&&pr.refs!=='none'&&pr.p9==='block'&&pr.ticked!=='none'&&pr.alone!=='none'&&pr.p1==='none',pr);
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const mg=await sh.evaluate(()=>typeof MP_GUIDE_FORMS!=='undefined'&&MP_GUIDE_FORMS.includes('AD-1'));
  ok('14 F413 the workstation\'s packet options list AD-1 among the forms with a Guide (left out unless kept)',mg===true,mg);

  ok('15 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
