/* v22.8x Form MS-1, medication side-effect monitoring, review Wave 3 (simulated data only).
   F438  no release of information on file: the report says not to send it, at the top and above the signatures (printed).
   F439  a red-flag row carries its instruction on paper; rated from blank, it says what to do now and takes the call into
         the notes; an emergency item says emergency services first.
   F440  a day is observed when dated (or rated) and not absent: the grid's mean, the weekly means and the trend use the days
         observed; a longer grid changes nothing; the dose row is the days given of the days present.
   F441  weight, height, blood pressure and pulse items are measured on the vitals sheet, not grid rows; the report quotes
         every vitals column and flags a pulse or blood pressure outside the nurse's range; the appetite column is gone (an
         earlier file's values go to the row's notes).
   F442  a report date kept with the record; the period covered; the weeks' dates; an example note that asks for nothing.
   F443  the rule for a rating: the highest severity seen that day, with the time of the worst.
   F444  Form DM-1's start and last-change dates go into the cards (the EPS schedule runs from them).
   F445  what is due (the AIMS screens, the next report) for the workstation's due list, and the record out (medmon).
   F446  BMI from each row's height.   F447  any screen within 45 days counts; the 6-month date from the latest screen; overdue.
   I223  the rater brief, printed alone.
   usage: node qa/ms1-w3-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const URL_=BASE+'/NBH-Workstation/MS-1_Medication-Side-Effect-Monitoring_v2026-09.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(URL_);await sleep(1200);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.__alerts=[];window.alert=t=>{window.__alerts.push(String(t));};window.print=()=>{window.__printed=(window.__printed||0)+1;};window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));};});
  const sim=k=>p.evaluate(async k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();await new Promise(x=>setTimeout(x,700));},k);
  const view=v=>p.evaluate(v=>{document.querySelector('#viewSeg [data-view="'+v+'"]').click();},v);
  const setf=(n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
  /* ---------- the risperidone simulation ---------- */
  await sim('risp');
  const d0=await p.evaluate(()=>document.getElementById('rpDate').value);
  ok('F442 the report date stays empty until the report is shown (or printed)',d0==='',d0);
  const G=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#grid tbody tr')].map(tr=>tr.querySelector('td.rowlab').textContent);
    const app=[...document.querySelectorAll('#grid tbody tr')].find(tr=>/Increased appetite/.test(tr.textContent));return {rows,appMean:app.lastElementChild.textContent,
      time:[...document.querySelectorAll('#grid tbody tr')][1].querySelector('td.rowlab').textContent,method:document.querySelector('#track p.method').textContent,
      vitHead:[...document.querySelectorAll('#vitTbl thead th')].map(t=>t.textContent).join('|')};});
  ok('F441 weight gain is measured on the vitals sheet, not a grid row; the vitals sheet has a height column and no appetite column',!G.rows.some(r=>/^Weight gain/.test(r))&&G.rows.some(r=>/^Increased appetite/.test(r))&&/Height \(cm\)\|BMI \(raw\)/.test(G.vitHead)&&!/Appetite/.test(G.vitHead),G);
  ok('F443 the grid asks for the highest severity that day and the time of the worst',/highest severity that day/.test(G.method)&&/time of the worst/.test(G.method)&&G.time==='Time of the worst',G);
  await view('report');
  const R=await p.evaluate(()=>({roi:!!document.getElementById('rpRoi'),sig:document.getElementById('rpRoiSig').textContent,date:document.getElementById('rpDate').value,period:document.getElementById('rpPeriod').textContent,
    head:[...document.querySelectorAll('#rpTbl thead th')].map(t=>t.textContent),rows:[...document.querySelectorAll('#rpTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent).join(' | ')),
    eps:document.getElementById('rpEps').textContent,ph:document.querySelector('[name="r.note"]').placeholder,meds:document.getElementById('rpMeds').textContent}));
  const today=await p.evaluate(()=>{const d=new Date();return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();});
  ok('F438 with a release on file the report says so above the signatures, and gives no warning',!R.roi&&/^Release of information on file: \d+\/\d+\/\d{4}\.$/.test(R.sig),R.sig);
  ok('F442 the report date is kept in a field (today when first shown); the period covered names the first and last dates and the days observed',R.date===today&&/^Period covered: \d+\/\d+ – \d+\/\d+, 14 school days observed\.$/.test(R.period),R);
  ok('F442 each week is headed by its dates; F440 and by the days observed in it',/^Wk 1 \(5\)\d+\/\d+–\d+\/\d+$/.test(R.head[1])&&/^Wk 2 \(5\)/.test(R.head[2])&&/^Wk 3 \(4\)/.test(R.head[3])&&R.head[4]==='Trend'&&!R.rows.some(r=>/^Days observed/.test(r)),{h:R.head,r:R.rows[0]});
  const app=R.rows.find(r=>/^Increased appetite/.test(r)),dose=R.rows.find(r=>/^Dose given/.test(r));
  ok('F440 the weekly means are over the days observed, and the trend compares the last two weeks with three days observed',app==='Increased appetite / food seeking | 5 / 1.6 | 5 / 2.2 | 4 / 2.0 | stable'&&/^Dose given \(days present\) \| 4 of 5 \| 5 of 5 \| 4 of 4 \| —$/.test(dose),{app,dose});
  ok('F441 the report quotes every vitals column with a value (blood pressure, pulse, sleep) and names the items measured there',/Blood pressure: .*104\/66/.test(R.eps)&&/Pulse: /.test(R.eps)&&/Sleep \(reported\): /.test(R.eps)&&/Checked on the plan and measured on the vitals sheet: Weight gain\./.test(R.eps)&&/Weight gain \(measured on the vitals sheet\)/.test(R.meds),R.eps);
  ok('F442 the example team note describes what was seen and asks for no change',!/asks whether|could be adjusted/.test(R.ph)&&/prescriber/.test(R.ph),R.ph);
  /* a report date set by hand is kept */
  await setf('r.date','10/1/2026');await view('plan');await view('report');const kept=await p.evaluate(()=>document.getElementById('rpDate').value);
  ok('F442 a report date set by hand is kept',kept==='10/1/2026',kept);
  /* F440: a grid set longer than the days entered changes nothing */
  await p.evaluate(()=>{const e=document.getElementById('nDays');e.value='20';e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);await view('track');
  const L=await p.evaluate(()=>{const app=[...document.querySelectorAll('#grid tbody tr')].find(tr=>/Increased appetite/.test(tr.textContent));return app.lastElementChild.textContent;});
  await view('report');const R20=await p.evaluate(()=>[...document.querySelectorAll('#rpTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent).join(' | ')));
  const H20=await p.evaluate(()=>[...document.querySelectorAll('#rpTbl thead th')].map(t=>t.textContent));
  ok('F440 a grid of 20 days with 14 entered: the grid\'s mean and the report\'s weeks and trend are as before, the empty week a dash',L===G.appMean&&R20.find(r=>/^Increased appetite/.test(r))==='Increased appetite / food seeking | 5 / 1.6 | 5 / 2.2 | 4 / 2.0 | — | stable'&&/^Wk 3 \(4\)/.test(H20[3])&&H20[4]==='Wk 4 (0)',{L,G:G.appMean,r:R20.slice(0,3),H20});
  /* F438: no release */
  await setf('m.roi','');await view('report');
  const N=await p.evaluate(()=>({first:document.getElementById('rpAlerts').firstElementChild.id,top:document.getElementById('rpRoi')?document.getElementById('rpRoi').textContent:'',sig:document.getElementById('rpRoiSig').textContent}));
  await p.emulateMedia({media:'print'});const Np=await p.evaluate(()=>({a:getComputedStyle(document.getElementById('rpRoi')).display,s:getComputedStyle(document.getElementById('rpRoiSig')).display}));await p.emulateMedia({media:'screen'});
  ok('F438 with no release date the report says not to send it, at the top of the alerts and above the signatures, on paper too',N.first==='rpRoi'&&/^No release of information on file: do not send this report/.test(N.top)&&/34 CFR 99\.30/.test(N.top)&&N.sig==='No release of information on file: do not send this report.'&&Np.a!=='none'&&Np.s!=='none',{N,Np});
  await setf('m.roi','On file 9/2/2026 (typed)');await view('report');const N2=await p.evaluate(()=>({roi:!!document.getElementById('rpRoi'),sig:document.getElementById('rpRoiSig').textContent}));
  ok('F438 a release typed with words around its date is read',!N2.roi&&N2.sig==='Release of information on file: 9/2/2026.',N2);
  /* F446: height per row */
  await view('vitals');await setf('v[2].ht','142');
  const H=await p.evaluate(()=>[0,1,2,3].map(i=>document.getElementById('bmi'+i).textContent));await view('report');const He=await p.evaluate(()=>document.getElementById('rpEps').textContent);
  ok('F446 BMI from each row\'s height: the plan\'s 140 cm before any, then the row\'s 142 cm carried forward; the report gives the height and calls the BMI raw',H[0]==='19.5'&&H[1]==='19.8'&&H[2]===(39.4/1.42/1.42).toFixed(1)&&H[3]===(40/1.42/1.42).toFixed(1)&&/at 142 cm \(BMI [\d.]+, raw\)/.test(He)&&/Height: [^.]*142 cm\./.test(He),{H,He});
  /* F441: the nurse's range */
  await setf('m.pulseHi','85');await setf('m.sysHi','100');await view('report');const T=await p.evaluate(()=>document.getElementById('rpAlerts').textContent);
  ok('F441 a pulse or a systolic pressure outside the range the nurse entered is flagged for the prescriber\'s review',/Blood pressure 104\/66 on [^,]+, systolic outside the nurse's range for the student \(–100\)/.test(T),T.slice(0,600));
  /* ---------- lithium: red flags, the absent day, the dose row ---------- */
  await sim('li');
  const Li=await p.evaluate(()=>{const tr=[...document.querySelectorAll('#grid tbody tr')].find(t=>/^Tremor with vomiting/.test(t.querySelector('td.rowlab').textContent));
    const off=[...document.querySelectorAll('#grid thead th.ms-off')].map(t=>t.textContent);return {rfo:tr.querySelector('small.rfo').textContent,off};});
  ok('F439 a red-flag row carries its instruction under its name (it prints with the grid); F440 the absent day is struck through in the heading',/^. Lithium toxicity pattern: report immediately$/.test(Li.rfo)&&Li.off.join()==='D9',Li);
  await view('report');const LiR=await p.evaluate(()=>[...document.querySelectorAll('#rpTbl tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent).join(' | ')));
  const LiH=await p.evaluate(()=>[...document.querySelectorAll('#rpTbl thead th')].map(t=>t.textContent));
  const ld=LiR.find(r=>/^Dose given/.test(r)),lv=LiR.find(r=>/^Vomiting/.test(r));
  ok('F440 the absent day is out of the week and the dose row says given on 3 of the 4 days present that week; a red flag gives its last rating',/^Dose given \(days present\) \| 5 of 5 \| 3 of 4 \| 4 of 4 \| —$/.test(ld)&&/; last 0 \(\d+\/\d+\)$/.test(lv)&&/^Wk 2 \(4\)/.test(LiH[2]),{ld,lv,h:LiH});
  /* rated from blank: the steps, and the call into the notes */
  await view('track');
  const RF=await p.evaluate(async()=>{const b=document.querySelector('#grid .cell[data-key="coarsetremor"][data-col="0"]');b.click();await new Promise(x=>setTimeout(x,100));
    const box=document.getElementById('rfNote'),o={vis:!box.hidden,text:box.textContent};document.getElementById('rfWho').value='nurse called 10:35 (simulated)';document.getElementById('rfAdd').click();
    o.notes=document.querySelector('[name="t.notes"]').value.split('\n').pop();o.hidden=box.hidden;
    /* rated again (1 to 2): no second notice */
    document.querySelector('#grid .cell[data-key="coarsetremor"][data-col="0"]').click();await new Promise(x=>setTimeout(x,100));o.again=!box.hidden;return o;});
  ok('F439 a red-flag item rated from blank says at once to call the school nurse, and the call goes into the notes by date',RF.vis&&/^Red flag: act now/.test(RF.text)&&/call the school nurse now/.test(RF.text)&&/rated 1 \(red flag\): nurse called 10:35 \(simulated\)$/.test(RF.notes)&&RF.hidden&&!RF.again,RF);
  /* ---------- haloperidol: an emergency item, the schedule, due, out ---------- */
  await sim('halo_eps');
  const EM=await p.evaluate(async()=>{const c=document.querySelector('[name="md[0].w.nms"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(x=>setTimeout(x,100));
    document.querySelector('#viewSeg [data-view="track"]').click();const b=document.querySelector('#grid .cell[data-key="nms"][data-col="13"]');b.click();await new Promise(x=>setTimeout(x,100));
    return document.getElementById('rfNote').textContent;});
  ok('F439 an emergency item says to call emergency services first',/^Emergency: act now/.test(EM)&&/call emergency services first/.test(EM),EM.slice(0,300));
  const D=await p.evaluate(()=>{const s=__ms1.schedule(),f=window.__nbhFactsOut(),due=window.__nbhDue();return {next:s.next.toISOString().slice(0,10),last:s.lastSix&&s.lastSix.toISOString().slice(0,10),over:s.overdue,due,cdue:nbhCase.due(),text:document.getElementById('screenDue').textContent,out:f&&f.medmon};});
  ok('F447 the 6-month screen runs from the latest screen logged (of any occasion), not from the 3-month date; nothing overdue',D.last&&!D.over&&/then every 6 months, last screen \d+\/\d+\/\d{4}, next due \d+\/\d+\/\d{4}\. A screen of any occasion within 45 days/.test(D.text),D.text);
  ok('F445 what is due goes to the workstation: the AIMS screen every 6 months and the first report to the prescriber',D.due.some(x=>x.what==='AIMS screen (every 6 months)'&&/^\d+\/\d+\/\d{4}$/.test(x.date))&&D.due.some(x=>/^Report to the prescriber/.test(x.what))&&JSON.stringify(D.cdue)===JSON.stringify(D.due),D.due);
  ok('F445 the record out: each medication with its start and change (the change\'s date as ISO), the red flags, the release date',!!D.out&&D.out.meds.length===2&&/^Benztropine/.test(D.out.meds[1].name)&&/^\d{4}-\d\d-\d\d$/.test(D.out.meds[1].changeDate)&&/^\d+\/\d+\/\d{4}$/.test(D.out.meds[0].start)&&D.out.flags.some(x=>/neuroleptic|stiffness, confusion/i.test(x.item))&&/^\d{4}-\d\d-\d\d$/.test(D.out.roi),D.out);
  /* an old screen only: overdue */
  const O=await p.evaluate(()=>{const tb=document.querySelectorAll('#screenTbl tbody tr');const inp=tb[tb.length-1].querySelector('[data-k="date"]');inp.value='1/5/2026';inp.dispatchEvent(new Event('input',{bubbles:true}));
    const s=__ms1.schedule();return {over:s.overdue,text:document.getElementById('screenDue').textContent};});
  ok('F447 when the next 6-month date has passed, the schedule says overdue',O.over&&/\(overdue\)/.test(O.text),O.text);
  /* ---------- F444: DM-1's dates into the cards ---------- */
  const F=await p.evaluate(async()=>{await (async()=>{document.getElementById('clearBtn').click();})();await new Promise(x=>setTimeout(x,300));
    const r=window.__nbhFactsIn({profile:{health:{meds:[{name:'Risperidone',dose:'0.5 mg',times:'twice daily, 8:00',start:'2026-05-04',chg:'2026-09-10'}],prescriber:'Dr. Sample (simulated)'}},behaviors:[{label:'Aggression toward staff (simulated)'}]});
    return {r,start:document.querySelector('[name="md[0].start"]').value,chg:document.querySelector('[name="md[0].change"]').value,due:document.getElementById('screenDue').textContent};});
  ok('F444 Form DM-1\'s start and last-change dates go into the card, and the EPS schedule runs from the start',F.start==='5/4/2026'&&F.chg==='9/10/2026'&&/From the start of Risperidone on 5\/4\/2026/.test(F.due),F);
  /* ---------- F441: an earlier file's appetite column ---------- */
  const A=await p.evaluate(async()=>{const d={form:'MS-1',rev:'2026-09',counts:{med:1,days:14,vit:4},cells:{},fields:{'m.client':'SIMULATED – Old File','v[0].d':'9/21','v[0].wt':'38.2','v[0].app':'2','v[0].n':'weighed after lunch'},screens:[]};
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'old.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(x=>setTimeout(x,500));return document.querySelector('[name="v[0].n"]').value;});
  ok('F441 an earlier file\'s appetite value is kept in that row\'s notes',A==='weighed after lunch; Appetite 2 (0–3, from the vitals sheet of an earlier version)',A);
  /* ---------- I223: the rater brief ---------- */
  await sim('dep_lam');await view('brief');
  const B=await p.evaluate(async()=>{const o={text:document.getElementById('briefBody').textContent,items:document.querySelectorAll('#briefBody .brief-item').length,flag:document.querySelectorAll('#briefBody .brief-item.flag').length};
    document.getElementById('briefPrint').click();await new Promise(x=>setTimeout(x,150));o.cls=document.body.classList.contains('print-brief');return o;});
  await p.emulateMedia({media:'print'});const Bp=await p.evaluate(()=>({brief:getComputedStyle(document.getElementById('brief')).display,grid:getComputedStyle(document.getElementById('track')).display}));
  const bout=path.join(os.tmpdir(),'ms1w3');fs.mkdirSync(bout,{recursive:true});await p.pdf({path:path.join(bout,'brief.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});Bp.pages=pages(path.join(bout,'brief.pdf'));
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));const Bq=await p.evaluate(()=>({brief:getComputedStyle(document.getElementById('brief')).display,grid:getComputedStyle(document.getElementById('track')).display}));await p.emulateMedia({media:'screen'});
  ok('I223 the rater brief: how to rate, the 0–3 anchors with an example, each watched item with what to look for, the red-flag steps and who to call',/highest severity you saw that day/.test(B.text)&&/3 marked/.test(B.text)&&/Falls asleep in class/.test(B.text)&&B.items===11&&B.flag===3&&/At any rating: call the school nurse now/.test(B.text)&&/School nurse: School nurse \(simulated\)/.test(B.text),B);
  ok('I223 Print rater brief prints the brief alone, on one page (11 items, 3 red flags); the record\'s print leaves it out',B.cls&&Bp.brief!=='none'&&Bp.grid==='none'&&Bp.pages===1&&Bq.brief==='none'&&Bq.grid!=='none',{Bp,Bq});
  /* ---------- the printed pages ---------- */
  const out=path.join(os.tmpdir(),'ms1w3');fs.mkdirSync(out,{recursive:true});
  const pr=async(kind,file)=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(URL_);await sleep(1000);
    await q.evaluate(async k=>{nbhUI.confirm=async()=>true;window.print=()=>{};if(k!=='blank'){document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();await new Promise(x=>setTimeout(x,700));}},kind);
    await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,file),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();return pages(path.join(out,file));};
  const pb=await pr('blank','blank.pdf'),ps=await pr('risp','risp.pdf'),ph=await pr('halo_eps','halo.pdf');
  ok('the printed pages: blank 10, risperidone 11, haloperidol 13 (as before Wave 3)',pb===10&&ps===11&&ph===13,{pb,ps,ph});
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
