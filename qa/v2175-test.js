/* v21.75 the record used further, the week in one print, Today and the hand-over check:
   1. Form DD-1 gives the case each behavior's baseline and current condition, whether its aim has held, the conditions,
      the incidents and the latest week; Form TI-1's observations are ticked on its graphs and named in the week summary;
      asked for its week, it gives the summary and next week's blank sheet and puts the screen back;
   2. Form PR-1 writes "Also in the review period" from the case and keeps it once rewritten;
   3. Form CN-1 starts a note from the week summary and the latest TI-1 observation, leaving an older note alone;
   4. Form FS-1 takes the level during the assessment from DD-1's baseline, and keeps a level typed;
   5. the scatterplot places DD-1's incidents in their intervals once; ABC-1 adds them once, as narrative only;
   6. the workstation: the case holds TI-1's integrity; DD-1 shows TI-1's ticks; Today lists the integrity under the
      criterion and the incidents home has not heard about; the hand-over check lists what is missing and Close case says
      it before closing; the end of the week builds one print of DD-1's week and SM-1's sheets. No page errors.
   usage: node qa/v2175-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const stub=()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{nbhUI.confirm=async()=>true;}catch(e){}};
const FACTS={data:{from:'2026-09-14',to:'2026-10-09',days:20,src:'DD-1',
  conds:[{name:'Baseline',from:'2026-09-14',to:'2026-09-21',days:6},{name:'BIP + FCT',from:'2026-09-22',to:'2026-10-09',days:14}],
  behaviors:[{name:'Physical aggression',kind:'target',measure:'count',unit:'occurrences',two:false,direction:'decrease',days:20,total:90,mean:4.5,base:{days:6,mean:10,total:60},baseName:'Baseline',cur:{days:14,mean:2.1,total:30},curName:'BIP + FCT',aim:1,need:3,run:1,aimMet:false},
    {name:'Mand for break (card exchange)',kind:'replacement',measure:'count',unit:'occurrences',two:false,direction:'increase',days:20,total:128,mean:6.4,base:{days:6,mean:0.3,total:2},baseName:'Baseline',cur:{days:14,mean:9,total:126},curName:'BIP + FCT',aim:8,need:3,run:5,aimMet:true}],
  incidentList:[{date:'2026-09-30',time:'10:20',beh:'Physical aggression',tier:'Tier 2',before:'Math worksheet handed out',what:'Hit the aide on the arm',words:'I am not doing this',did:'Break card offered',ended:'Back at the desk by 10:32',parent:'no'},
    {date:'2026-10-07',time:'13:05',beh:'Physical aggression',tier:'Tier 3',before:'Transition to specials',what:'Kicked a peer',words:'',did:'One adult spoke',ended:'Calm by 13:20',parent:'yes'}],
  week:{mon:'2026-10-05',days:5,rows:[{name:'Physical aggression',kind:'target',now:'5 (1 a day)',last:'11 (2.2 a day)',change:'down 55%',good:'good'},{name:'Mand for break (card exchange)',kind:'replacement',now:'54 (10.8 a day)',last:'45 (9 a day)',change:'up 20%',good:'good'}],
    incidents:1,phases:[],notes:[],decided:'Fade the aide to the doorway'}},
  points:{days:[{date:'2026-09-29',pct:80,goal:75,met:true},{date:'2026-10-06',pct:70,goal:75,met:false},{date:'2026-09-01',pct:20,goal:75,met:false}],src:'SM-1'},
  integrity:{obs:[{date:'2026-09-23',type:'Unannounced',pct:85.7,n:14},{date:'2026-10-07',type:'Unannounced',pct:76.9,n:13}],overall:84.6,crit:62.5,criterion:90,src:'TI-1'}};
(async()=>{const br=await chromium.launch();const log=[];
  /* ---------- 1. Form DD-1 ---------- */
  let page=await br.newPage({viewport:{width:1400,height:1000}});wire(page,log);
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(stub);await page.evaluate(async()=>{await loadExample();});await sleep(1200);
  const o=await page.evaluate(()=>{const d=window.__nbhFactsOut().data,b=d.behaviors;return {conds:d.conds.map(c=>c.name+' '+c.from+' '+c.days),b0:{base:b[0].base,cur:b[0].cur,curName:b[0].curName},aims:b.map(x=>[x.name,x.aim,x.need,x.run,x.aimMet]),week:d.week&&{mon:d.week.mon,rows:d.week.rows.length,r0:d.week.rows[0]},inc:d.incidentList.length};});
  ok('1a DD-1 gives each behavior its baseline (the first condition) and current condition, the conditions with their dates, and the latest week',
    o.conds.length===2&&/^Baseline 2026-09-14 6$/.test(o.conds[0])&&/^BIP \+ FCT 2026-09-22 14$/.test(o.conds[1])&&o.b0.base.days===6&&o.b0.base.mean===10&&o.b0.cur.days===14&&o.b0.curName==='BIP + FCT'&&o.week.mon==='2026-10-05'&&o.week.rows===6&&/a day/.test(o.week.r0.now)&&/^down \d+%$/.test(o.week.r0.change),o);
  ok('1b with an aim, it says how many days in a row the aim has held in the current condition and whether that meets the criterion',o.aims[4][1]===8&&o.aims[4][2]===3&&o.aims[4][3]>=3&&o.aims[4][4]===true&&o.aims[0][1]===null&&o.aims[0][4]===false,o.aims);
  const ti=await page.evaluate(()=>{ddCaseFacts={integrity:{obs:[{date:'2026-09-23',type:'Unannounced',pct:85.7},{date:'2026-10-07',type:'Unannounced',pct:76.9}],src:'TI-1'}};
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderResults();
    const t=[...document.querySelectorAll('svg .dd-ti text')].map(x=>x.textContent);
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));ddWeekOn('2026-10-05');const w=document.getElementById('ddWeekWrap').innerText;ddWeekOff();
    return {t,w};});
  ok('1c Form TI-1’s observations are ticked on the graphs with their integrity, and the week summary names the week’s',ti.t.includes('TI 86%')&&ti.t.includes('TI 77%')&&/Treatment integrity \(Form TI-1\)\s+77% on Wed 10\/7 \(unannounced\)/.test(ti.w),ti);
  const pk=await page.evaluate(()=>{ddPackWeek=true;const n=window.nbhPrintNodes();ddPackWeek=false;const box=n[1];
    return {n:n.length,head:!!(n[0]&&n[0].classList.contains('nbh-print-head')),wk:box.querySelectorAll('.wk-tab tbody tr').length,ctl:box.querySelectorAll('.wk-bar,.wk-next').length,
      blank:box.querySelectorAll('.dd-pack-blank #dataTable tbody tr').length,inc:box.querySelectorAll('#ddInc').length,
      back:{week:ddWeek,blank:ddBlank,rows:document.querySelectorAll('#dataTable tbody tr').length,on:document.body.classList.contains('dd-week-on')}};});
  ok('1d asked for its week, DD-1 gives the letterhead, the week summary (no controls) and next week’s blank sheet, and the screen is put back',
    pk.n===2&&pk.head&&pk.wk===6&&pk.ctl===0&&pk.blank===5&&pk.inc===0&&pk.back.week===null&&pk.back.blank===null&&pk.back.rows===20&&!pk.back.on,pk);
  await page.close();

  /* ---------- 2. Form PR-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'PR-1_Periodic-Plan-Review_v2026-09.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const pr=await page.evaluate(f=>{window.__nbhFactsIn(f);const a=S.meta.alsoCase,dom=document.querySelector('[data-m="alsoCase"]').value,bar=document.getElementById('prCaseBar').hidden;
    S.meta.alsoCase='My own words';const f2=JSON.parse(JSON.stringify(f));f2.data.incidentList.push({date:'2026-10-08',time:'09:00',beh:'Physical aggression',tier:'Tier 1',parent:'no'});window.__nbhFactsIn(f2);
    return {a,dom,bar,kept:S.meta.alsoCase};},FACTS);
  ok('2a "Also in the review period" is written from the case over DD-1’s current condition: incidents by tier and home told, the aims met, the point sheet, integrity',
    /^Since 9\/22 \(BIP \+ FCT, 14 school days with data\):/.test(pr.a)&&/Incidents logged on Form DD-1: 2 \(Tier 2: 1, Tier 3: 1\); home told after 1 of 2\./.test(pr.a)&&/Mand for break \(card exchange\) \(5 days in a row, 3 asked\)/.test(pr.a)&&
    /Point sheet \(Form SM-1\): 75% of the points on average across 2 days; the goal met on 1\./.test(pr.a)&&/Treatment integrity \(Form TI-1\): 85\.7% on 9\/23 \(unannounced\), 76\.9% on 10\/7 \(unannounced\)\./.test(pr.a)&&pr.dom===pr.a,pr);
  ok('2b on its own (outside the workstation) no case bar shows; once rewritten the box keeps its words',pr.bar===true&&pr.kept==='My own words',pr);
  await page.close();

  /* ---------- 3. Form CN-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'CN-1_Consultation-Notes_v2026-10.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const cn=await page.evaluate(f=>{window.__nbhFactsIn(f);const n=S.notes[cur];const r={forms:n.data_forms,obs:n.observed,integ:n.integ,idate:n.integ_date,rate:n.data_rate,goal:n.data_goal,btn:getComputedStyle(document.getElementById('cnWeek')).display,
      dom:document.querySelector('[data-n="observed"]').value===n.observed};
    S.notes.push(newNote());cur=S.notes.length-1;S.notes[cur].date='9/1/26';window.__nbhFactsIn(f);r.old=S.notes[cur].observed;
    document.getElementById('cnWeek').click();r.forced=/The week of 10\/5\/26/.test(S.notes[cur].observed);return r;},FACTS);
  ok('3a a note being written starts from the week summary: the data reviewed, the week against the last, the team’s decision, the latest TI-1 observation',
    /Form DD-1\), week of 10\/5\/26 to 10\/9\/26; TI-1 of 10\/7\/26/.test(cn.forms)&&/- Physical aggression: 5 \(1 a day\), the week before 11 \(2\.2 a day\) \(down 55%\)\./.test(cn.obs)&&/The team decided: Fade the aide to the doorway\./.test(cn.obs)&&cn.integ==='76.9'&&cn.idate==='10/7/26'&&cn.rate==='2.1'&&cn.goal==='1'&&cn.btn!=='none'&&cn.dom,cn);
  ok('3b a note dated before the week is left alone until "Start from the week summary" is pressed',cn.old===''&&cn.forced,cn);
  await page.close();

  /* ---------- 4. Form FS-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'FS-1_FBA-Summary-Report_v2026-09.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const fs=await page.evaluate(f=>{S.beh=[newBeh(),newBeh()];S.beh[0].lab='Physical aggression';S.beh[1].lab='Elopement';S.beh[1].base='3 a day by teacher report';renderAll();
    window.__nbhFactsIn({data:f.data});const r={b0:S.beh[0].base,b1:S.beh[1].base};f.data.behaviors[0].base={days:6,mean:9.5,total:57};window.__nbhFactsIn({data:f.data});r.follow=S.beh[0].base;
    S.beh[0].base='Mine';window.__nbhFactsIn({data:f.data});r.kept=S.beh[0].base;return r;},FACTS);
  ok('4a FS-1’s level during the assessment comes from DD-1’s baseline for the behavior of that name, follows DD-1, and a level typed is kept',
    fs.b0==='10 a day (mean of 6 school days of baseline, 9/14 to 9/21; Form DD-1)'&&fs.b1==='3 a day by teacher report'&&/^9\.5 a day/.test(fs.follow)&&fs.kept==='Mine',fs);
  await page.close();

  /* ---------- 5. the scatterplot and ABC-1 ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'Scatterplot_Pattern_Analysis.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const sp=await page.evaluate(f=>{state.meta.behavior='Physical aggression';state.cfg.mode='tap';state.cfg.startMin=480;state.cfg.interval=30;state.cfg.spanH=7;state.cfg.days=5;
    ['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02'].forEach((d,i)=>{state.meta['date'+i]=d;});state.cells={};commitBeh();render();
    window.__nbhFactsIn(f);const btn=getComputedStyle(document.getElementById('spIncBtn')).display;document.getElementById('spIncBtn').click();
    const c=state.cells['4_2'];const r={btn,s:c&&c.s};document.getElementById('spIncBtn').click();r.again=state.cells['4_2'].s;r.placed=state.behaviors[state.cur].meta.incPlaced;return r;},FACTS);
  ok('5a the scatterplot marks DD-1’s incident in its interval on its day (10:20 on Wed 9/30), once; the one outside the sheet’s days is left',sp.btn!=='none'&&sp.s===1&&sp.again===1&&sp.placed==='2026-09-30 10:20 physical aggression',sp);
  await page.close();
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'ABC_Recording_Conditional_Probability_Analysis.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const ab=await page.evaluate(f=>{const n0=state.entries.length;window.__nbhFactsIn(f);document.getElementById('abcIncBtn').click();const n1=state.entries.length;document.getElementById('abcIncBtn').click();
    const e=state.entries.find(x=>x.date==='2026-09-30');return {n0,n1,n2:state.entries.length,mode:e&&e.mode,beh:e&&e.behaviorOther.b_other,narr:e&&e.narrative};},FACTS);
  ok('5b ABC-1 adds DD-1’s incidents once, as narrative-only incidents with their date, time, behavior and A-B-C in the narrative',
    ab.n1===ab.n0+2&&ab.n2===ab.n1&&ab.mode==='open'&&ab.beh==='Physical aggression'&&/^Before: Math worksheet handed out\. What happened: Hit the aide on the arm\. Said: “I am not doing this”/.test(ab.narr),ab);
  await page.close();

  /* ---------- 7. the audit of the older forms ---------- */
  const TB={behaviors:[{label:'Physical aggression',def:'Hitting or kicking staff',ex:'Kicks an aide',nex:'High five',dim:'Frequency'},{label:'Elopement',def:'Leaving the area',ex:'',nex:''},{label:'Asks for a break',def:'Card exchange',isRep:true}],
    menu:[{name:'Tablet time',type:'Activity',rank:1},{name:'Pretzels',type:'Edible',rank:2}]};
  page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(W+'Scatterplot_Pattern_Analysis.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const sp2=await page.evaluate(f=>{const r0=window.__nbhFactsIn(f);const r={rep:r0&&r0.filled,n:state.behaviors.length,m:state.behaviors.map(b=>[b.meta.behavior,b.meta.definition,b.meta.example||'',b.meta.nonexample||'']),cap:(document.querySelector('#grid caption.sp-pcap')||{}).textContent||''};return r;},TB);
  ok('7a the scatterplot makes a sheet for each target behavior with its definition, example and non-example, and each grid names the student, behavior and days on paper',
    sp2.n===2&&sp2.m[0][0]==='Physical aggression'&&sp2.m[0][1]==='Hitting or kicking staff'&&sp2.m[0][2]==='Kicks an aide'&&sp2.m[0][3]==='High five'&&sp2.m[1][0]==='Elopement'&&/Physical aggression/.test(sp2.cap),sp2);
  await page.close();
  page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(W+'ABC_Recording_Conditional_Probability_Analysis.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);await loadSim(page);await sleep(1500);
  const ab2=await page.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button,[data-tab]')].find(x=>/analy/i.test(x.textContent||''));if(b)b.click();
    const rows=[...document.querySelectorAll('table')].filter(t=>/Antecedent condition/.test(t.textContent)).flatMap(t=>[...t.querySelectorAll('tbody tr')]).map(r=>r.lastElementChild.textContent.trim());
    return {rows,q:qDir(-0.76),q2:qDir(0.8)};});
  ok('7b ABC-1: an antecedent row resting on an empty cell says "thin", and a negative association says "(less likely)"',ab2.rows.some(x=>/thin/.test(x))&&ab2.rows.some(x=>/less likely/.test(x))&&/less likely/.test(ab2.q)&&ab2.q2==='',ab2);
  await page.close();
  page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(W+'Reinforcer_Assessment_Protocol.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const ra=await page.evaluate(f=>{const r0=window.__nbhFactsIn(f);return {rep:r0&&r0.filled,stim:[...document.querySelectorAll('#stimTbl tbody tr')].map(t=>[t.querySelector('[data-f=name]').value,t.querySelector('[data-f=type]').value,t.querySelector('[data-f=pa]').value]).filter(x=>x[0]),pb:document.getElementById('mPBdef').value,ta:document.getElementById('mPBdef').tagName};},TB);
  await loadSim(page);await sleep(1200);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="pr"]').click());await sleep(600);
  const raw=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,hdr:[...document.querySelectorAll('th')].map(t=>t.textContent).filter(t=>/^% /.test(t))}));
  ok('7c RA-1 takes the stimuli from Form PA-1 (rank and type) and the problem behavior from Form TB-1',ra.stim.length===2&&ra.stim[0][0]==='Tablet time'&&ra.stim[0][1]==='Activity'&&ra.stim[0][2]==='1'&&ra.stim[1][1]==='Edible'&&ra.pb==='Physical aggression: Hitting or kicking staff'&&ra.ta==='TEXTAREA',ra);
  ok('7d RA-1’s progressive ratio view no longer scrolls the page sideways, and the concurrent-operants headings are whole',raw.sw<=raw.iw+1&&raw.hdr.every(t=>!/\(vi$/.test(t)),raw);
  await page.close();
  page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(W+'Variable_Isolation_Protocol.html',{waitUntil:'load'});await sleep(900);await page.evaluate(stub);
  const vi=await page.evaluate(f=>{window.__nbhFactsIn(f);return {m:document.querySelector('[name="s_measure"]').value,d:document.querySelector('[name="s_def"]').value};},TB);
  ok('7e VI-1 takes the measurement as well as the definition from the case',vi.m==='Frequency / rate'&&/Hitting or kicking staff/.test(vi.d),vi);
  const vp=await page.evaluate(async()=>{const r=await fetch('index.html');const t=await r.text();return /maximum-scale=1/.test(t)&&/maximum-scale=1/.test(document.querySelector('meta[name=viewport]').content);});
  ok('7f the workstation and the forms keep iPad Safari from zooming into a field on tap (maximum-scale=1; pinch zoom still works)',vp);
  await page.close();

  /* ---------- 6. the workstation ---------- */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(W+'index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};});
  await page.fill('#pClient','Mateo Rivera');await page.evaluate(()=>document.querySelector('#pClient').dispatchEvent(new Event('input',{bubbles:true})));
  const settle=async id=>{const t=Date.now();while(Date.now()-t<20000&&!(await page.evaluate(id=>!!state.status[id],id)))await sleep(150);};
  for(const id of ['DD-1','TI-1','SM-1']){await page.evaluate(i=>openForm(i,true),id);await settle(id);
    const fr=page.frames().find(f=>f.url().includes(id==='DD-1'?'Daily_Behavior':id+'_'));if(fr){await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});
      if(id==='DD-1')await fr.evaluate(async()=>{await loadExample();});else await loadSim(fr);await sleep(800);}}
  const dd=page.frames().find(f=>f.url().includes('Daily_Behavior'));
  await dd.evaluate(()=>{S.incidents=[{id:'i1',date:S.rows[S.rows.length-1].date,time:'10:20',beh:orderedBehaviors()[0].id,behName:'',tier:'Tier 2',before:'',what:'Hit',words:'',did:'',ended:'',parent:'no',parentWhen:'',by:'',bcba:false,counted:false}];renderData();});
  await sleep(5000);await page.evaluate(()=>gatherFacts(true));await sleep(5000);
  const ws=await page.evaluate(()=>({int:state.facts&&state.facts.integrity&&state.facts.integrity.obs.length,src:state.facts&&state.facts.src.integrity,line:(document.getElementById('factsTxt')||{}).textContent||''}));
  ok('6a the case holds Form TI-1’s integrity observations and the line under the bar says so',ws.int>=3&&ws.src==='TI-1'&&/Integrity: \d+ observations/.test(ws.line),ws);
  const tk=await dd.evaluate(()=>({n:ddTiObs().length}));
  ok('6b DD-1 has TI-1’s observations for its ticks',tk.n>=3,tk);
  const td=await page.evaluate(async()=>{await todayOpen();await new Promise(r=>setTimeout(r,300));const t=document.getElementById('dlgBody').innerText;document.getElementById('dlg').close();return t;});
  ok('6c Today lists the last integrity check under the criterion and the incident home has not heard about, with the forms to open',/The last integrity check was 76\.9%, under the 90% criterion/.test(td)&&/1 incident home has not been told about/.test(td)&&/End of the week: print the packet/.test(td),td.slice(0,600));
  const ho=await page.evaluate(async()=>{await handoverOpen();await new Promise(r=>setTimeout(r,300));const t=document.getElementById('dlgBody').innerText;document.getElementById('dlg').close();
    let msg='';const was=wsUI.confirm;wsUI.confirm=async m=>{msg=m;return false;};document.getElementById('closeCase').click();await new Promise(r=>setTimeout(r,6000));wsUI.confirm=was;return {t,msg,open:Object.keys(state.frames).length};});
  ok('6d the hand-over check lists what is missing (no consent, no targets, no goals, incidents home has not heard about); Close case says it before closing and closes nothing when declined',
    /No consent on file/.test(ho.t)&&/No target behaviors defined/.test(ho.t)&&/No goals written/.test(ho.t)&&/Incidents home has not been told about/.test(ho.msg)&&/the case is missing:/.test(ho.msg)&&ho.open===3,ho);
  const ew=await page.evaluate(async()=>{let html='';const fake={closed:false,document:{open(){},write(h){html+=h;},close(){}},focus(){},print(){},close(){}};const wo=window.open;window.open=()=>fake;
    await endOfWeek();await new Promise(r=>setTimeout(r,1500));window.open=wo;
    return {title:/<h1>The Week: the Summary, Next Week’s Sheet and the Point Sheets<\/h1>/.test(html),wk:/wk-tab/.test(html),blank:/dd-pack-blank/.test(html),sm:/sec-SM-1/.test(html),dd:/sec-DD-1/.test(html),len:html.length};});
  ok('6e the end of the week is one print: the week summary and next week’s blank sheet from DD-1, then SM-1’s sheets, under its own title',ew.title&&ew.wk&&ew.blank&&ew.sm&&ew.dd,ew);
  const pc=await page.evaluate(()=>CMDS.filter(c=>/^Today|^End of the week|^Hand-over check/.test(c.n)).length);
  ok('6f the command box has Today, the end of the week and the hand-over check',pc===3,pc);
  const errs=log.filter(l=>l.type==='pageerror');
  ok('6g no page errors anywhere',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
