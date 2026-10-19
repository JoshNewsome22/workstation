/* v22.7x Form RA-1, review Wave 3: every single-operant label needs 3 sessions a condition (F130) and a difference floor over
   the control (F131); progressive-ratio potency needs 2 sessions each and Moderate alone never confirms (F132); one design's
   positive label against another's negative reads Conflicting (F133); SR-1, SA-1, SM-1 and QS-1 take the menu by the shared rule,
   RA-1's verdicts included (F134); the motivating-operations rule for attention and praise (F136); the session record with the
   fidelity, the agreement checks counted by condition (F137, I69); a plan-ratio test in the runner and the schedule on the
   verdict (I67); the assent plan in the runners and Student withdrew counted apart (I68); the run-clock caution (F129).
   Simulated data only.
   usage: node qa/ra1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const RA='Reinforcer_Assessment_Protocol.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  let p=await open(RA);
  const so=(p,rows)=>p.evaluate(rows=>{const set=(k,f,v)=>{const e=document.querySelector('#soTbl [data-k="'+k+'"][data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    document.querySelectorAll('#soTbl select[data-f="cond"]').forEach((e,k)=>{set(k,'cond','');set(k,'resp','');});rows.forEach(([c,r],k)=>{set(k,'cond',c);set(k,'resp',String(r));});},rows);
  const pr=(p,rows)=>p.evaluate(rows=>{document.querySelectorAll('#prTbl select[data-f="cond"]').forEach(e=>{e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
    document.querySelectorAll('#prTbl input[data-f="done"]').forEach(b=>{if(b.checked){b.checked=false;b.dispatchEvent(new Event('input',{bubbles:true}));}});
    rows.forEach(([c,n],k)=>{const s=document.querySelector('#prTbl [data-k="'+k+'"][data-f="cond"]');s.value=c;s.dispatchEvent(new Event('input',{bubbles:true}));
      for(let j=0;j<n;j++){const b=document.querySelector('#prTbl [data-k="'+k+'"][data-j="'+j+'"]');b.checked=true;b.dispatchEvent(new Event('input',{bubbles:true}));}});},rows);
  const look=p=>p.evaluate(()=>({so:[...document.querySelectorAll('#soRank tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim())),
    pr:[...document.querySelectorAll('#prRank tbody tr')].map(tr=>tr.cells[1].textContent.trim()+':'+tr.cells[tr.cells.length-1].textContent.trim()),
    sum:[...document.querySelectorAll('#sumTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent.trim())),note:document.getElementById('sumNote').hidden?'':document.getElementById('sumNote').textContent}));
  await p.evaluate(()=>{document.querySelectorAll('#stimTbl input[data-f="name"]').forEach((e,i)=>{e.value=['Tablet (video)','Fruit chew','Praise + high five'][i]||'';e.dispatchEvent(new Event('input',{bubbles:true}));});});await sleep(200);
  /* F131 a control at zero */
  await so(p,[['ctl',0],['0',1],['ctl',0],['0',1],['ctl',0],['0',1]]);await sleep(150);
  let a=await look(p);const tab=a.so.find(r=>r[0]==='Tablet (video)'),stab=a.sum.find(r=>r[0]==='Tablet (video)');
  ok('1 F131 a control at zero: one response a session is below the difference floor, so None, not Clear; the ratio column shows the difference, not ∞; the Summary says Not supported',
    tab&&tab[4]==='— (+0.2/min)'&&tab[7]==='None'&&stab&&stab[3]==='None'&&stab[8]==='Not supported'&&!a.so.some(r=>/∞/.test(r.join(' '))),{tab,stab});
  await p.evaluate(()=>{const e=document.getElementById('mMinDiff');e.value='0.1';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(150);
  a=await look(p);
  ok('2 F131 the floor is a Setup setting: at 0.1 a minute the same sessions are Clear and Confirmed',a.so.find(r=>r[0]==='Tablet (video)')[7]==='Clear'&&a.sum.find(r=>r[0]==='Tablet (video)')[8]==='Confirmed',a.so);
  await p.evaluate(()=>{const e=document.getElementById('mMinDiff');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
  /* F130 too few sessions */
  await so(p,[['ctl',10],['0',40]]);await sleep(150);a=await look(p);
  ok('3 F130 one control and one stimulus session: Too few sessions on the Condition Summary, Untested on the Summary',
    a.so.find(r=>r[0]==='Tablet (video)')[7]==='Too few sessions'&&a.sum.find(r=>r[0]==='Tablet (video)')[8]==='Untested'&&a.sum.find(r=>r[0]==='Tablet (video)')[3]==='Too few',a);
  /* F132 the progressive ratio */
  await so(p,[]);await pr(p,[['ctl',1],['1',2]]);await sleep(150);a=await look(p);
  ok('4 F132 one control and one stimulus session: no potency, Too few sessions; the Summary does not confirm',a.pr.includes('Fruit chew:Too few sessions')&&a.sum.find(r=>r[0]==='Fruit chew')[8]==='Untested',a);
  await pr(p,[['ctl',1],['1',2],['ctl',1],['1',2]]);await sleep(150);a=await look(p);
  ok('5 F132 two each, one step above the control: Moderate, and with no plan ratio the Summary reads Probable, not Confirmed',a.pr.includes('Fruit chew:Moderate')&&a.sum.find(r=>r[0]==='Fruit chew')[8]==='Probable',a);
  /* F133 conflicting designs: SO None, PR High */
  await so(p,[['ctl',20],['2',20],['ctl',20],['2',21],['ctl',20],['2',19]]);await pr(p,[['ctl',1],['2',6],['ctl',1],['2',6]]);await sleep(150);a=await look(p);
  const pz=a.sum.find(r=>r[0]==='Praise + high five');
  ok('6 F133 single operant None and progressive ratio High: Conflicting, and the note under the table names both and says to resolve it',
    pz&&pz[3]==='None'&&pz[7]==='High'&&pz[8]==='Conflicting'&&/^Praise \+ high five: Conflicting\. single operant None, progressive ratio High\. One design says it reinforces and another that it does not/.test(a.note),{pz,note:a.note});
  const out=await p.evaluate(()=>window.__nbhFactsOut().reinf.items.find(x=>x.name==='Praise + high five'));
  ok('7 F133 the case carries the same verdict, and the schedule it was tested at (I67)',out&&out.verdict==='Conflicting'&&out.fr===1,out);
  /* I67 the schedule on the verdict and the plan-ratio warning */
  await pr(p,[]);await so(p,[['ctl',5],['0',40],['ctl',6],['0',42],['ctl',5],['0',41]]);await sleep(150);
  await p.evaluate(()=>{const e=document.getElementById('planRatio');e.value='5';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(150);a=await look(p);
  ok('8 I67 Clear at FR 1 with the plan at FR 5 and no progressive ratio: Confirmed, and the note says no session tested it at the plan ratio',
    a.sum.find(r=>r[0]==='Tablet (video)')[8]==='Confirmed'&&/Tablet \(video\): Confirmed at FR 1; the plan ratio is FR 5 and no session tested it there/.test(a.note),a.note);
  /* F137 I69 the session record, typed: the schedule, the fidelity; and the agreement checks counted by condition */
  await p.evaluate(()=>{for(let k=0;k<6;k++){document.querySelector('[data-recadd="so"]').click();}
    const rows=[...document.querySelectorAll('#recTbl-so tbody tr')];rows.forEach((tr,k)=>{const set=(f,v)=>{const e=tr.querySelector('[data-rf="'+f+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
      set('sess',String(k+1));set('fid',k===0?'75':'100');if(k%2)set('fr','5');set('end','Completed');set('pre',k===1?'Tablet at 8:00 (simulated)':'');});
    document.getElementById('ioaAdd').click();const io=[...document.querySelectorAll('#ioaTbl tbody tr')].pop();const s=(f,v)=>{const e=io.querySelector('[data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('sess','2');s('sheet','so');s('kind','count');s('a','40');s('b','39');});await sleep(200);
  a=await look(p);const rec=await p.evaluate(()=>({so:document.getElementById('recOut-so').textContent,sum:document.getElementById('recSum').textContent}));
  ok('9 I67 sessions recorded at FR 5: the verdict reads Clear at FR 5, and the plan-ratio note is gone',/^Clear at FR 5$/.test(a.so.find(r=>r[0]==='Tablet (video)')[7])&&!/Confirmed at FR/.test(a.note),{so:a.so,note:a.note});
  ok('10 F137 I69 under the table: the agreement checks by condition, the fidelity scored and its lowest; the Summary composes the line',
    rec.so==='Agreement checks: 1 of 6 sessions (Tablet (video) 1). Fidelity scored on 6 sessions, mean 96%, lowest 75%.'&&/^Single operant: Agreement checks: 1 of 6 sessions/.test(rec.sum),rec);
  /* I68 the assent plan and Student withdrew; I67 the plan ratio in the runner; F129 the run-clock caution */
  await p.evaluate(()=>nbhCase.apply({student:{assent:'given',stop:{signs:'pushes the materials away (simulated)'}}}));await sleep(150);
  await p.evaluate(()=>document.querySelector('#viewSeg [data-view="so"]').click());await sleep(250);
  const as=await p.evaluate(()=>({t:document.getElementById('ra-run-so-assent').hidden?'':document.getElementById('ra-run-so-assent').textContent,pr:!document.getElementById('ra-run-pr-assent').hidden}));
  ok('11 I68 the assent plan from Form SI-1 shows in the runners',/^Assent \(Form SI-1\): given\. Stop signals: pushes the materials away \(simulated\)\. When you see one, press Student withdrew/.test(as.t)&&as.pr,as);
  await p.evaluate(()=>{const c=document.getElementById('ra-run-so-cond');c.value='0';c.dispatchEvent(new Event('change',{bubbles:true}));
    const a=document.getElementById('ra-run-so-acc');a.value='1';a.dispatchEvent(new Event('input',{bubbles:true}));a.dispatchEvent(new Event('change',{bubbles:true}));
    const k=document.getElementById('ra-run-so-clock');k.value='run';k.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  const pf=await p.evaluate(()=>{const b=document.getElementById('ra-run-so-planfr');const vis=!b.hidden,t=b.textContent;b.click();return {vis,t,fr:document.getElementById('ra-run-so-fr').value,src:document.getElementById('ra-run-so-frsrc').textContent,after:b.hidden};});
  ok('12 I67 the runner offers the plan ratio typed on the Summary; one tap sets the schedule to it',pf.vis&&pf.t==='Test at the plan ratio (FR 5)'&&pf.fr==='5'&&pf.src==='Every 5th response, the plan ratio'&&pf.after,pf);
  const click=id=>p.evaluate(id=>document.getElementById(id).click(),id);
  await click('ra-run-so-start');await sleep(300);for(let i=0;i<5;i++){await click('ra-run-so-resp');await sleep(60);}await sleep(1500);await click('ra-run-so-end');await sleep(400);
  const sm=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#ra-run-so-sum tr')].map(r=>[r.children[0].textContent,r.children[1].textContent])));
  ok('13 F129 with the clock running through access, the session summary warns that the rate is capped',/^The clock ran through 0:01 of access, so this rate is capped by the access time/.test(sm.Caution||''),sm);
  await click('ra-run-so-save');await sleep(400);
  await p.evaluate(()=>{const c=document.getElementById('ra-run-so-cond');c.value='ctl';c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  await click('ra-run-so-start');await sleep(500);const wdOn=await p.evaluate(()=>!document.getElementById('ra-run-so-wd').disabled);
  await click('ra-run-so-wd');await sleep(300);
  const wd=await p.evaluate(()=>({st:document.getElementById('ra-run-so-state').textContent,msg:document.getElementById('ra-run-so-msg').textContent}));
  await click('ra-run-so-save');await sleep(400);
  const rec2=await p.evaluate(()=>({rows:[...document.querySelectorAll('#recTbl-so tbody tr')].slice(-2).map(tr=>['sess','fr','end','who','time'].map(f=>(tr.querySelector('[data-rf="'+f+'"]')||{}).value)),out:document.getElementById('recOut-so').textContent}));
  ok('14 I68 Student withdrew is live while a session runs and ends it at once, without a question',wdOn&&wd.st==='Student withdrew'&&/^The student withdrew at 0:0\d: the session ended at once, and it is counted apart from problem behavior/.test(wd.msg),{wdOn,wd});
  ok('15 I69 I68 I67 each saved session writes its record: the time, the schedule (FR 5), how it ended; the withdrawal is counted apart from problem behavior',
    rec2.rows.length===2&&rec2.rows[0][0]==='7'&&rec2.rows[0][1]==='5'&&rec2.rows[0][2]==='Ended early'&&/^\d{1,2}:\d\d$/.test(rec2.rows[0][4])&&rec2.rows[1][0]==='8'&&rec2.rows[1][2]==='Student withdrew'&&
    /The student withdrew from 1 session \(Control 1\), counted apart from problem behavior/.test(rec2.out),rec2);
  /* saved with the file and opened again */
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);const fp=await dl.path();
  await p.evaluate(()=>document.getElementById('clearBtn').click());await sleep(400);await (await p.$('#fileIn')).setInputFiles(fp);await sleep(600);
  const back=await p.evaluate(()=>document.querySelectorAll('#recTbl-so tbody tr').length);
  ok('16 I69 the session record is kept in the file',back===8,back);
  /* F136 the motivating-operations rule */
  const mo=await p.evaluate(()=>({g:document.getElementById('guide').textContent.replace(/\s+/g,' ')}));
  await L.loadSim(p);await sleep(900);
  const mo2=await p.evaluate(()=>document.querySelector('[data-meta="mo"]').value);
  ok('17 F136 the Guide does not ask staff to withhold attention or praise for hours, and the worked example keeps praise as usual',
    /For attention, praise or escape, do not withhold them for hours: keep the few minutes before the session brief and neutral/.test(mo.g)&&/praise as usual through the day, none from the assessor in the 5 min before/.test(mo2),mo2);
  await p.close();

  /* F134 the plan forms take the menu by the shared rule */
  const MENU=[{name:'Tablet (video)',tier:'HP',rank:1},{name:'Music',tier:'HP',rank:2},{name:'Fruit chew',tier:'MP',rank:3},{name:'Bubbles',tier:'LP',rank:5}];
  const F={menu:MENU,reinf:{items:[{name:'Music',verdict:'Not supported'},{name:'Bubbles',verdict:'Confirmed'}]}};
  const forms=[['SR-1_Schedules-of-Reinforcement_v2026-10.html',()=>(document.querySelector('[data-m="sr"]')||{}).value||(typeof S!=='undefined'&&S.meta?S.meta.sr:'')],
    ['SA-1_Skill-Acquisition-Data_v2026-10.html',null],['SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html',null],['QS-1_Staff-Quick-Start_v2026-10.html',null]];
  const got={};
  for(const [f] of forms){const q=await open(f);
    got[f.slice(0,4)]=await q.evaluate(F=>{nbhCase.apply(F);const vals=[...document.querySelectorAll('input,textarea')].map(e=>e.value).filter(v=>/Tablet \(video\)/.test(v));return vals.join(' | ');},F);await q.close();}
  const good=Object.values(got).every(v=>/Tablet \(video\)/.test(v)&&!/Music/.test(v)&&/Bubbles/.test(v));
  ok('18 F134 SR-1, SA-1, SM-1 and QS-1 leave out the item RA-1 found no effect for and keep the low-preference item it confirmed',good&&/\(Forms PA-1, RA-1\)/.test(got['SR-1'])&&/checked on RA-1/.test(got['SA-1']),got);
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('19 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
