/* Form DT-1, review Wave 3 part 4: a session log and a probe log inside the form (F403, I203). Every session's sheet is kept when
   it is carried, opens back into the sheet, starts a new sheet at the next number, and downloads as one trial-by-trial CSV; every
   probe logged keeps its points, a re-probe no longer overwrites the baseline, and the graph draws the other kept probe beside the
   one on screen. Simulated data only. usage: node qa/dt1-w3d-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const DT='Delay-Tolerance-Protocol-Toolkit.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+DT);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__said=m;};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const sheet=()=>p.evaluate(()=>({num:document.querySelector('[name=ss_num]').value,date:document.querySelector('[name=ss_date]').value,phase:document.querySelector('[name=ss_phase]').value,delay:document.querySelector('[name=ss_delay]').value,
    sc:document.getElementById('oSC').textContent,obt:document.getElementById('oObt').textContent,end:document.getElementById('oEnd').textContent,eng:document.getElementById('oEng').textContent,
    rows:[...document.getElementById('tbTrials').rows].filter(tr=>[...tr.querySelectorAll('input,select')].some(x=>x.value)).length,
    opts:[...document.getElementById('ssPick').options].map(o=>o.value),note:document.getElementById('ssLogNote').textContent}));
  const pick=v=>p.evaluate(v=>{const s=document.getElementById('ssPick');s.value=v;document.getElementById('btnSsOpen').click();},v);
  const s0=await sheet();
  ok('1 F403 the example keeps sessions 20 to 22, and the sheet on screen (22) is the one kept',s0.opts.join()==='20,21,22'&&s0.num==='22'&&/^3 sessions kept: 20, 21, 22\. The sheet on screen is kept\.$/.test(s0.note),s0);
  await pick('20');await sleep(300);const s20=await sheet();
  ok('2 I203 a kept session opens back into the sheet, every trial, and its summary gives the Progress row\'s figures (66.7%, 92.8 s)',s20.num==='20'&&s20.rows===10&&s20.sc==='4/6 (66.7%)'&&s20.obt==='92.8'&&s20.end==='2'&&s20.eng==='66.7%',s20);
  await pick('21');await sleep(300);const s21=await sheet();
  ok('3 I203 session 21 too (83.3%, 93.1 s)',s21.num==='21'&&s21.sc==='5/6 (83.3%)'&&s21.obt==='93.1'&&s21.end==='1',s21);
  await p.evaluate(()=>document.getElementById('btnSsNew').click());await sleep(300);const sn=await sheet();
  const today=await p.evaluate(()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');});
  ok('4 I203 a new sheet starts at the next number, today, with the phase and step carried over and no trials',sn.num==='23'&&sn.date===today&&sn.phase==='Training'&&sn.delay==='90'&&sn.rows===0,sn);
  await p.evaluate(()=>{const tr=document.getElementById('tbTrials').rows[0],f=tr.querySelectorAll('input,select');['Delay','SC','90','92','4','Indep.','Yes','0','0','Yes'].forEach((v,i)=>{f[i].value=v;});f[0].dispatchEvent(new Event('input',{bubbles:true}));});
  const dirty=await p.evaluate(()=>document.getElementById('ssLogNote').textContent);
  await p.evaluate(()=>document.getElementById('btnCarry').click());await sleep(500);const s23=await sheet();
  const prog=await p.evaluate(()=>[...document.getElementById('tbProg').rows].map(tr=>tr.querySelector('input').value));
  ok('5 F403 Carry keeps the sheet in the session log beside the Progress row, and says so',/not kept as it stands: Carry keeps it/.test(dirty)&&s23.opts.join()==='20,21,22,23'&&prog.includes('23')&&/the sheet kept in the session log/.test(await p.evaluate(()=>window.__said)),{dirty,s23,prog});
  await p.evaluate(()=>{const s=document.getElementById('ssPick');s.value='23';document.getElementById('btnSsDel').click();});await sleep(300);
  const csv=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;let nm='';HTMLAnchorElement.prototype.click=function(){nm=this.download;};
    document.getElementById('btnSsCsv').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;return {nm,lines:txt.split('\r\n'),opts:[...document.getElementById('ssPick').options].map(o=>o.value)};});
  ok('6 I203 a session removed from the log leaves it; the log downloads as one trial-by-trial CSV',csv.opts.join()==='20,21,22'&&/^DT1_trials_.*\.csv$/.test(csv.nm)&&csv.lines.length===31&&
    /^Session,Date,Phase,Programmed delay \(s\),Implementer,Trial,Trial type,Choice,/.test(csv.lines[0])&&/^20,\d{4}-\d\d-\d\d,Training,90,Aide A,1,Delay,SC,90,92,5,Prompted,Yes,0,0,Yes,One gestural prompt for the tolerance response$/.test(csv.lines[1])&&/^22,/.test(csv.lines[30]),csv);
  /* ---- the probe log ---- */
  const pr=()=>p.evaluate(()=>({date:document.querySelector('[name=dd_date]').value,auc:document.getElementById('outAUC').textContent,ov:document.getElementById('ddOverlay').textContent,
    circ:document.querySelectorAll('#ddPlot circle').length,dash:document.querySelectorAll('#ddPlot path[stroke-dasharray]').length,kept:[...document.getElementById('ddPick').options].map(o=>o.value)}));
  const p0=await pr();
  ok('7 I203 the example keeps the baseline probe and the re-probe; the graph draws the re-probe beside the baseline, each with its fit',p0.kept.length===2&&p0.auc==='0.290'&&p0.circ===12&&p0.dash===1&&
    /^Solid line and filled points: this probe \(\d{4}-\d\d-\d\d\)\. Dashed line and open points: the probe of \d{4}-\d\d-\d\d, half-value delay 171\.8 s against 44\.2 s here\.$/.test(p0.ov),p0);
  await p.evaluate(()=>{const s=document.getElementById('ddPick');s.value=s.options[1].value;document.getElementById('btnDdOpen').click();});await sleep(300);const p1=await pr();
  const log=await p.evaluate(()=>[...document.getElementById('tbDDlog').rows].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value)));
  ok('8 I203 a kept probe opens back into the table; its figures are the ones its log row holds, drawn beside the baseline',p1.date===p0.kept[1]&&p1.auc==='0.588'&&log[1][2]==='0.588'&&log[1][3]==='-2.24'&&/half-value delay 44\.2 s against 171\.8 s here/.test(p1.ov),{p1,log});
  await p.evaluate(()=>{document.querySelector('[name=dd_date]').value='2026-10-30';document.getElementById('tbDD').rows[4].querySelectorAll('input')[1].value='79';document.getElementById('btnDDlogAdd').click();});await sleep(400);
  const p2=await p.evaluate(()=>{const L=JSON.parse(document.getElementById('dtProbeLog').value);return {n:L.length,base:L[0].points.map(v=>v[1]).join(),re:L[1].points.map(v=>v[1]).join(),last:L[2].date};});
  ok('9 F403 a new probe logged is kept beside the others: the baseline and the earlier re-probe keep their points',p2.n===3&&p2.base==='117,101,71,49,27,11'&&p2.re==='117,109,101,93,71,41'&&p2.last==='2026-10-30',p2);
  await p.evaluate(()=>{const a=document.getElementById('ddA');a.value='100';a.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  ok('10 I203 a probe with another delayed amount is not drawn against a different one, and the line says why',/used a different delayed amount \(A = 120\), so it is not drawn here: re-probe with the same amount\./.test(await p.evaluate(()=>document.getElementById('ddOverlay').textContent)));
  await p.evaluate(()=>{const a=document.getElementById('ddA');a.value='120';a.dispatchEvent(new Event('input',{bubbles:true}));});
  /* save and open; the workstation's snapshot */
  const rt=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;const d=JSON.parse(txt);
    document.getElementById('dtSessLog').value='';document.getElementById('dtProbeLog').value='';
    const dt=new DataTransfer();dt.items.add(new File([txt],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,600));
    const t=document.getElementById('dtSessLog');return {inFile:!!d.fields.ss_log&&!!d.fields.dd_probes,ss:[...document.getElementById('ssPick').options].map(o=>o.value).join(),dd:document.getElementById('ddPick').options.length,
      snap:t.tagName==='TEXTAREA'&&t.type!=='hidden'&&!!t.closest('[hidden]')&&!!document.getElementById('dtProbeLog').closest('[hidden]')};});
  ok('11 the logs are saved with the record and come back with it, and sit where the workstation\'s case keeps them',rt.inFile&&rt.ss==='20,21,22'&&rt.dd===3&&rt.snap,rt);
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
