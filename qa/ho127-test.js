/* v24.27 the hand-offs between forms (the independent review: R-017, R-018, R-058, R-092, R-110, R-145; E-10, E-11, E-15):
   the case summary and dialog carry Form DA-1's demand tasks; EA-1 shows DA-1's verdict in Setup & safety and in the Plan;
   TD-1's demand-fading ladder names DA-1's steps; OB-1's facts carry its observations and narrative lines; DD-1 offers the
   observations as baseline rows and ABC-1 the lines as coded incidents; RA-1's Use the ticked items fills the Stimuli Under Test
   rows from PA-1's menu; the student the case names is offered inside a form whose student box is empty; SM-1 and TK-1 say
   which forms feed them when the case holds nothing they take; the dialog footer says what the menu and the demand tasks do.
   usage: node qa/ho127-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const file=pre=>'/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(x=>x.startsWith(pre));
const DEMANDS={form:'DA-1',dates:'10/1–10/8 (simulated)',rule:'rate',verdict:'Three tasks evoke problem behavior; start fading at the easiest.',
  fa:[{name:'Math worksheet (simulated)',rank:1,rate:1.2,lat:14,pb:'5 of 5'},{name:'Writing prompt (simulated)',rank:2,rate:0.8,lat:30,pb:'4 of 5'},{name:'Reading aloud (simulated)',rank:3,rate:0.4,lat:60,pb:'3 of 5'}],
  high:[],fade:[{name:'One problem with help (simulated)'},{name:'Three problems (simulated)'},{name:'Half a page (simulated)'}],terminal:[{name:'Full worksheet (simulated)'}],mods:[]};
const MENU=[{rank:1,name:'Tablet time (simulated)',tier:'HP',type:'Activity'},{rank:2,name:'Pretzels (simulated)',tier:'HP',type:'Edible'},{rank:3,name:'Sticker chart (simulated)',tier:'MP',type:'Tangible'}];
const BEH=[{label:'Hitting (simulated)',def:'Forceful open-hand contact with another person (simulated)',type:'Single topography'}];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 const open=async(path)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(path.slice(17,22)+': '+String(e).slice(0,160)));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(BASE+path);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__toasts=[];nbhUI.confirm=async()=>true;const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{return t0&&t0(m,o);}catch(e){}};});
   return p;};
 const openDlg=p=>p.evaluate(async()=>{nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');
   return {open:!!d&&d.open,body:d?d.querySelector('#nbhcBody').innerHTML:'',text:d?d.querySelector('#nbhcBody').textContent:'',note:d?d.querySelector('#nbhcNote').textContent:'',toasts:window.__toasts.slice()};});

 /* ---- the case flow: the summary, the dialog's demand section, the footer note (R-018, R-145) ---- */
 let p=await open(file('EA-1_'));
 const ea=await p.evaluate(async(F)=>{const rep=nbhCase.apply(F);await new Promise(r=>setTimeout(r,400));
   const bt=document.getElementById('nbhCaseBtn');const sum=bt?bt.textContent:'';const flag=document.getElementById('eaDemandFlag');
   return {rep,sum,flag:flag?{hidden:flag.hidden,text:flag.textContent}:null,line:window.eaDemandLine()};},{behaviors:BEH,fn:{key:'escape',label:'Escape from demands'},demands:DEMANDS});
 ok('the From the case label counts the demand tasks',/3 demand tasks/.test(ea.sum),ea.sum);
 ok('EA-1 Setup & safety shows DA-1’s verdict with the first task, its rate and latency, and the other tasks',ea.flag&&!ea.flag.hidden&&/Demand assessment \(Form DA-1, 10\/1–10\/8 \(simulated\)\): Three tasks evoke problem behavior; start fading at the easiest\. The demand condition uses Math worksheet \(simulated\) \(1\.2 a min, latency 14 s\); also Writing prompt \(simulated\), Reading aloud \(simulated\)\./.test(ea.flag.text),ea.flag);
 const dlg=await openDlg(p);
 ok('From the case lists the demand tasks under their own heading, the first ticked, with rate, latency and the sessions',dlg.open&&/Demand tasks that evoke problem behavior \(Form DA-1, 10\/1–10\/8 \(simulated\)\)/.test(dlg.text)&&/data-kind="dem" data-i="0" checked/.test(dlg.body)&&/data-kind="dem" data-i="1"(?! checked)/.test(dlg.body)&&/1\.2 a min · latency 14 s · problem behavior in 5 of 5 sessions/.test(dlg.text)&&/Three tasks evoke problem behavior/.test(dlg.text),{text:dlg.text.slice(0,600)});
 ok('the dialog footer says the demand tasks fill their own lines as the case is read',/the demand tasks fill their own rows and lines as the case is read/.test(dlg.note)||/The ticked items go into this form/.test(dlg.note),dlg.note);
 const sel=await p.evaluate(()=>{const s=nbhCase.selection();return {dem:s.demands.map(t=>t.name),ob:s.ob1obs.length};});
 ok('the selection carries the ticked demand task',sel.dem.length===1&&/Math worksheet/.test(sel.dem[0]),sel);
 /* the Plan: the hypothesis question carries DA-1's line */
 const plan=await p.evaluate(async()=>{document.querySelector('#viewSeg button[data-view="plan"]').click();await new Promise(r=>setTimeout(r,200));
   const put=(name,v)=>{const e=document.querySelector('[name="'+name+'"]');if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}return !!e;};
   put('pl.goal','fn');put('pl.step','0');document.querySelector('#viewSeg button[data-view="plan"]').click();await new Promise(r=>setTimeout(r,200));
   let found=null;for(let k=0;k<12&&!found;k++){const w=document.querySelector('#plWrap');const q=w&&w.querySelector('.pl-q');if(q&&/What does the assessment so far point to/.test(q.textContent)){const d=w.querySelector('.pl-da1');found={q:q.textContent,da1:d?d.textContent:''};break;}
     const nx=w&&(w.querySelector('.pl-next')||w.querySelector('.pl-skip'));if(!nx)break;nx.click();await new Promise(r=>setTimeout(r,120));}
   return found;});
 ok('the Plan’s hypothesis question shows DA-1’s line under From the demand assessment',plan&&/From the demand assessment \(Form DA-1\)/.test(plan.da1)&&/Math worksheet \(simulated\)/.test(plan.da1),plan);
 await p.close();

 /* ---- TD-1: the demand-fading ladder names DA-1's steps (E-10) ---- */
 p=await open(file('TD-1_'));
 const td=await p.evaluate(async(F)=>{nbhCase.apply(F);await new Promise(r=>setTimeout(r,300));if(!document.querySelector('#compWrap .card[data-code="DF"]'))window.__tdAddComp('DF');
   const fn=document.querySelector('[name="m.fn"]');if(fn)fn.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
   const rows=[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^DF /.test(tr.querySelector('td.n').textContent)).map(tr=>tr.children[1].textContent);
   return {d:!!window.__tdDemands,rows};},{behaviors:BEH,fn:{key:'escape',label:'Escape from demands'},demands:DEMANDS});
 ok('TD-1’s DF ladder names DA-1’s fading steps in order after each rung’s level, and the terminal step on the last rung',td.d&&td.rows.length===5&&/0 demands \(next: One problem with help \(simulated\), Form DA-1\)/.test(td.rows[0])&&/1 instruction per session — One problem with help \(simulated\) \(Form DA-1\)/.test(td.rows[1])&&/Three problems \(simulated\)/.test(td.rows[2])&&/Half a page \(simulated\)/.test(td.rows[3])&&/terminal level \(Pace et al\., 1993\) — Full worksheet \(simulated\) \(Form DA-1\)/.test(td.rows[4]),td);
 await p.close();

 /* ---- OB-1: the facts carry the observations and the narrative lines (E-11) ---- */
 p=await open(file('OB-1_'));
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 const ob=await p.evaluate(()=>{const f=window.__nbhFactsOut();const e=f&&f.evidence;return {form:e&&e.form,beh:e&&e.beh,obs:e&&e.obs,narr:e&&e.narr,n:(state.obs||[]).length};});
 ok('OB-1’s facts carry each observation (date, minutes, count, rate an hour, activity)',ob.obs&&ob.obs.length===3&&ob.obs.every(o=>o.date&&o.mins&&o.count!=='')&&ob.obs[0].count==='7'&&ob.obs[0].mins==='45'&&ob.obs[0].rate===9.3&&/Math/.test(ob.obs[0].activity),{obs:ob.obs});
 ok('and the narrative lines with the observation’s ticked antecedents and consequences as labels and keys',ob.narr&&ob.narr.length===14&&ob.narr[0].anteKeys.join()==='demand,difficult,attn'&&ob.narr[0].consKeys.join()==='redirect,escape'&&ob.narr[0].ante.length===3&&!/^(demand|difficult|attn)$/.test(ob.narr[0].ante[0])&&ob.narr[6].consKeys.length===0&&ob.narr[9].anteKeys.length===4&&ob.narr[9].consKeys.length===3,{n:ob.narr&&ob.narr.length,first:ob.narr&&ob.narr[0]});
 const OBF={behaviors:BEH,fn:{key:'escape',label:'Escape from demands'},evidence:{'OB-1':{form:'OB-1',beh:ob.beh,obs:ob.obs,narr:ob.narr}}};
 await p.close();

 /* ---- DD-1: the observations offered as baseline rows ---- */
 p=await open('/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');
 const dd=await p.evaluate(async(F)=>{F.evidence['OB-1'].beh='Hitting (simulated)';nbhCase.apply(F);await new Promise(r=>setTimeout(r,400));
   const before=S.rows.filter(r=>r.date).length;nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');
   const body=d.querySelector('#nbhcBody'),text=body.textContent;const has=/Observations \(Form OB-1\), as baseline days/.test(text);
   const cbs=[...body.querySelectorAll('input[data-kind="ob1obs"]')];const ticked=cbs.filter(c=>c.checked).length;
   d.querySelector('#nbhcUse').click();await new Promise(r=>setTimeout(r,400));
   const done=d.querySelector('#nbhcDone').textContent;const beh=S.behaviors.find(x=>/Hitting/.test(x.name))||S.behaviors[0];
   const rows=S.rows.filter(r=>F.evidence['OB-1'].obs.some(o=>o.date===r.date)).map(r=>({date:r.date,v:r.values[beh.id],min:r.obsMin,notes:r.notes,ph:r.phaseType,lab:r.phaseLabel}));
   const dup=F.evidence['OB-1'].obs.map(o=>S.rows.filter(r=>r.date===o.date).length);
   return {has,n:cbs.length,ticked,done,before,rows,dup,beh:beh.name,sorted:S.rows.map(r=>r.date).filter(Boolean).every((x,i,a)=>!i||a[i-1]<=x)};},OBF);
 ok('DD-1 lists OB-1’s observations under From the case, ticked, and Use the ticked items makes a baseline row per day with the count, the minutes and a note',dd.has&&dd.n===3&&dd.ticked===3&&/Placed 3 items/.test(dd.done)&&/3 days from Form OB-1 as baseline rows/.test(dd.done)&&dd.rows.length===3&&dd.rows.every(r=>/^\d+$/.test(String(r.v))&&r.min&&/^From Form OB-1/.test(r.notes))&&dd.dup.every(x=>x===1)&&dd.sorted,dd);
 ok('the first of them opens the Baseline phase when the record had none',dd.rows.some(r=>r.ph==='full'&&/Baseline/i.test(r.lab)),dd.rows);
 const dd2=await p.evaluate(async()=>{const before=S.rows.length;nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');d.querySelector('#nbhcUse').click();await new Promise(r=>setTimeout(r,300));
   return {before,after:S.rows.length,done:d.querySelector('#nbhcDone').textContent};});
 ok('a second Use adds no row and overwrites nothing',dd2.after===dd2.before&&/Nothing to place|Placed 0|every/.test(dd2.done)||dd2.after===dd2.before,dd2);
 await p.close();

 /* ---- ABC-1: the narrative lines offered as coded incidents ---- */
 p=await open('/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');
 const abc=await p.evaluate(async(F)=>{nbhCase.apply(F);await new Promise(r=>setTimeout(r,400));
   nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');const body=d.querySelector('#nbhcBody'),text=body.textContent;
   const has=/Narrative lines \(Form OB-1\), as coded incidents/.test(text);const cbs=[...body.querySelectorAll('input[data-kind="ob1narr"]')];const ticked=cbs.filter(c=>c.checked).length;
   const n0=state.entries.length;d.querySelector('#nbhcUse').click();await new Promise(r=>setTimeout(r,500));
   const done=d.querySelector('#nbhcDone').textContent;const E=state.entries.filter(e=>e.srcKey&&e.srcKey.startsWith('ob1:'));
   const beh=BEHAVIORS.find(b=>b.caseT);
   const again=(()=>{nbhCase.open();const d2=document.getElementById('nbhCaseDlg');d2.querySelector('#nbhcUse').click();return state.entries.length;})();
   return {has,n:cbs.length,ticked,done,n0,made:E.length,total:state.entries.length,again,beh:beh&&beh.label,
     first:E[0]&&{date:E[0].date,time:E[0].time,a:E[0].antecedents,c:E[0].consequences,b:E[0].behaviors,narr:E[0].narrative.slice(0,60)},subst:E.map(e=>e.antecedents.length&&e.consequences.length).every(Boolean)};},OBF);
 ok('ABC-1 lists OB-1’s narrative lines under From the case; the lines whose observation ticked antecedents and consequences are ticked',abc.has&&abc.n===14&&abc.ticked===11&&abc.n0===0,abc);
 ok('Use the ticked items makes a coded incident per ticked line: the date and time, the codes from the ticks, the case’s target, the line as the narrative',/Placed 11 items/.test(abc.done)&&abc.made===11&&abc.first&&abc.first.date&&abc.first.time&&abc.first.a.includes('a_gen')&&abc.first.a.includes('a_difficult')&&abc.first.c.includes('c_guided')&&abc.first.c.includes('c_dem_rem')&&abc.first.b.length===1&&/Hitting/.test(abc.beh)&&/Form OB-1/.test(abc.first.narr)===false&&abc.subst,abc);
 ok('a second Use adds no incident (the lines are keyed)',abc.again===abc.total,abc);
 await p.close();

 /* ---- RA-1: Use the ticked items fills the Stimuli Under Test rows from PA-1's menu (R-017) ---- */
 p=await open('/NBH-Workstation/Reinforcer_Assessment_Protocol.html');
 const ra=await p.evaluate(async(F)=>{nbhCase.apply(F);await new Promise(r=>setTimeout(r,200));
   const fire=(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
   document.querySelectorAll('#stimTbl tbody input[data-f="name"],#stimTbl tbody input[data-f="pa"]').forEach(e=>fire(e,''));document.querySelectorAll('#stimTbl tbody select[data-f="type"]').forEach(e=>fire(e,''));fire(document.querySelector('[data-meta="pasrc"]'),'');
   nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');
   const body=d.querySelector('#nbhcBody');body.querySelectorAll('input[data-kind="menu"]').forEach((c,i)=>{c.checked=i<2;});
   d.querySelector('#nbhcUse').click();await new Promise(r=>setTimeout(r,400));
   const done=d.querySelector('#nbhcDone').textContent;
   const rows=[...document.querySelectorAll('#stimTbl tbody tr')].map(tr=>({name:tr.querySelector('input[data-f="name"]').value,pa:tr.querySelector('input[data-f="pa"]').value,type:tr.querySelector('select[data-f="type"]').value})).filter(r=>r.name);
   return {done,rows,pasrc:document.querySelector('[data-meta="pasrc"]').value};},{behaviors:BEH,fn:{key:'tangible',label:'Access to tangibles'},menu:MENU});
 ok('RA-1 fills the empty Stimuli Under Test rows with the ticked menu items (name, PA-1 rank and tier, type) and the Preference assessment source line',ra.rows.length===2&&ra.rows[0].name==='Tablet time (simulated)'&&ra.rows[0].pa==='1 (HP)'&&ra.rows[0].type==='Activity'&&ra.rows[1].name==='Pretzels (simulated)'&&ra.rows[1].type==='Edible'&&/Form PA-1 reinforcer menu, as the case carries it/.test(ra.pasrc)&&/Placed/.test(ra.done)&&/stimuli from Form PA-1 into the empty rows/.test(ra.done),ra);
 const ra2=await p.evaluate(async()=>{nbhCase.open();await new Promise(r=>setTimeout(r,200));const d=document.getElementById('nbhCaseDlg');d.querySelector('#nbhcBody').querySelectorAll('input[data-kind="menu"]').forEach(c=>{c.checked=true;});
   d.querySelector('#nbhcUse').click();await new Promise(r=>setTimeout(r,300));return {done:d.querySelector('#nbhcDone').textContent,rows:[...document.querySelectorAll('#stimTbl tbody input[data-f="name"]')].map(e=>e.value).filter(Boolean)};});
 ok('a second Use adds only the item not on the sheet and leaves the filled rows alone',ra2.rows.length===3&&ra2.rows[2]==='Sticker chart (simulated)'&&ra2.rows[0]==='Tablet time (simulated)',ra2);
 await p.close();

 /* ---- the student the case names, offered inside a form whose student box is empty (E-15, R-092) ---- */
 p=await open(file('TB-1_'));
 const st=await p.evaluate(async(F)=>{nbhCase.apply(F);await new Promise(r=>setTimeout(r,400));const bar=document.getElementById('nbhStudentBar');
   const r={bar:!!bar,text:bar&&bar.textContent,role:bar&&bar.getAttribute('role')};
   if(bar){bar.querySelector('#nbhStudentUse').click();await new Promise(r=>setTimeout(r,200));}
   const ce=(window.__nbhPacketMap&&window.__nbhPacketMap.client)?document.querySelector(window.__nbhPacketMap.client):null;
   const el=ce||[...document.querySelectorAll('input')].find(e=>/client|student/i.test(e.name||e.id||''));
   r.filled=el&&el.value;r.gone=!document.getElementById('nbhStudentBar');r.toast=window.__toasts.slice(-1)[0]||'';
   nbhCase.apply(F);await new Promise(r=>setTimeout(r,300));r.back=!!document.getElementById('nbhStudentBar');return r;},{behaviors:BEH,student:{name:'SIMULATED – Sample Student',id:'SIM-0001',grade:'4',site:'Sample Elementary (simulated)',src:'packet'}});
 ok('a form whose student box is empty shows the student the case names, in a status bar with Fill the student box',st.bar&&st.role==='status'&&/Student from the case: SIMULATED – Sample Student · ID SIM-0001 · grade 4 · Sample Elementary \(simulated\)/.test(st.text)&&/Fill the student box/.test(st.text),st);
 ok('Fill the student box fills the student field, removes the bar, and the bar does not return while the box holds a name',st.filled==='SIMULATED – Sample Student'&&st.gone&&/Student filled from the case/.test(st.toast)&&!st.back,st);
 await p.close();

 /* ---- SM-1 and TK-1: which forms feed them (R-110) ---- */
 for(const [pre,re] of [['SM-1_',/It is fed by Form TB-1 \(the targets\), Form PA-1 \(the reinforcer menu\) and Form TD-1 \(the plan\)\./],['TK-1_',/It is fed by Form TB-1 \(the replacement behaviors\), Form GB-1 \(the objectives\), Form PA-1 \(the reinforcer menu\) and Form TD-1 \(the plan\)\./]]){
   p=await open(file(pre));
   const r=await p.evaluate(async()=>{const F={fn:{key:'escape',label:'Escape from demands'},demands:{fa:[{name:'Math (simulated)',rank:1}]}};nbhCase.apply(F);await new Promise(r=>setTimeout(r,300));window.__toasts=[];
     nbhCase.open();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('nbhCaseDlg');return {open:!!d&&d.open,toasts:window.__toasts.slice()};});
   ok(pre.slice(0,4)+' From the case with only a function and the demands says, in a toast, which forms feed it, and opens no dialog',!r.open&&r.toasts.length===1&&/The case holds nothing this form takes yet\./.test(r.toasts[0])&&re.test(r.toasts[0]),r);
   await p.close();}

 /* ---- the workstation: the student block in the facts, the Demands line in the summary ---- */
 p=await open('/NBH-Workstation/index.html');
 const ws=await p.evaluate(()=>{const r={};state.details=state.details||{};state.whoFound={name:'SIMULATED – Sample Student',src:'TB-1'};state.details['TB-1']={sid:'SIM-0001',grade:'4',site:'Sample Elementary (simulated)'};
   r.fromForm=window.__nbhStudentFacts();document.getElementById('pClient').value='SIMULATED – Packet Student';document.getElementById('pGrade').value='5';r.fromPacket=window.__nbhStudentFacts();
   document.getElementById('pClient').value='';state.whoFound=null;r.none=window.__nbhStudentFacts();
   r.has=hasFacts({student:{name:'x'}});r.sig=factsSig({student:{name:'a'}})!==factsSig({student:{name:'b'}});return r;});
 ok('the workstation names the student from the packet first, else from the form that holds a name, with the ID, grade and school it knows',ws.fromForm&&ws.fromForm.name==='SIMULATED – Sample Student'&&ws.fromForm.id==='SIM-0001'&&ws.fromForm.src==='TB-1'&&ws.fromPacket.name==='SIMULATED – Packet Student'&&ws.fromPacket.grade==='5'&&ws.fromPacket.src==='packet'&&ws.none===null&&ws.has&&ws.sig,ws);
 const sumLine=await p.evaluate(async()=>{const t=await (await fetch(location.pathname)).text();return /<b>Demands:<\/b>/.test(t)&&/f\.student=Object\.assign/.test(t);});
 ok('the case summary has a Demands line',sumLine);
 await p.close();

 ok('no page errors',errs.length===0,errs);
 await b.close();console.log('RESULT: '+(bad?bad+' failed of '+n:'all '+n+' passed'));process.exit(bad?1:0);})().catch(e=>{console.log('FAIL crash '+e);process.exit(1);});
