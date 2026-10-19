/* v22.69 Form VI-1, review Wave 3 part 3a: Evidence Already Collected and the current level fill from the case (F164);
   every "Tab N" names its view (F165); the joint method table has a row for each of the ledger's eight candidates, the
   two new rows saved apart, and the register says rows 9 to 12 have no ledger column (F167); a ticked checklist item goes
   into the register (I82); the response-allocation table is hidden unless a file holds counts in it, and Hill's analogy
   becomes replication on a second sample (I85). Simulated data only. usage: node qa/v2269-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Variable_Isolation_Protocol.html');await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open();
  /* F165 */
  const txt=await p.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    while(w.nextNode())out.push(w.currentNode.nodeValue);document.querySelectorAll('[title],[placeholder],[aria-label]').forEach(e=>['title','placeholder','aria-label'].forEach(a=>e.getAttribute(a)&&out.push(e.getAttribute(a))));
    return out.join(' ').replace(/\s+/g,' ');});
  const tabN=(txt.match(/.{0,40}\bTabs? \d.{0,20}/g)||[]);
  ok('1 F165 no "Tab N" is left in the form\'s text, titles or menus',tabN.length===0,tabN);
  ok('2 F165 the Guide and the rules name the views',/The Agreement, Difference and Concomitant variation views apply them\. The Contingency view adds the quantitative tools/.test(txt)&&
    /Combined with Agreement, this is Mill's/.test(txt)&&/test it by its contingency in the Contingency view \(Martens et al\., 2008\)/.test(txt)&&/Work the views in order, from Setup to Synthesis & decision/.test(txt));
  /* F167 */
  ok('3 F167 the joint method table has eight rows, and the register says rows 9 to 12 have no ledger column',
    (await p.evaluate(()=>document.querySelectorAll('#jointTbl tbody tr').length))===8&&/rows 9–12 are kept here but have no ledger column, since the ledgers code eight candidates/.test(txt));
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const joint=()=>p.evaluate(()=>[...document.querySelectorAll('#jointTbl tbody tr')].map(tr=>[...tr.querySelectorAll('input,select')].map(x=>x.value).join(' | ')));
  const j=await joint();
  ok('4 F167 the worked example fills rows 7 and 8 (noise, missed breakfast), computed as setting events retained',j[6]==='Noise / assembly | No | Yes | 0 | Retained: setting event or MO'&&j[7]==='Missed breakfast | No | Mostly | 0 | Retained: setting event or MO'&&j[1]==='Escape delivered | Yes | n/a |  | Consequence: see Contingency',j);
  const dlP=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('btnSave').click());const d=JSON.parse(fs.readFileSync(await (await dlP).path(),'utf8'));
  ok('5 F167 rows 7 and 8 are saved apart (x), the older fields as before',d.x&&d.x.jt7_c==='Noise / assembly'&&d.x.jt8_c==='Missed breakfast'&&d.x.jt8_v==='Retained: setting event or MO'&&d.f.includes('Substitute adult'),d.x);
  const old=JSON.parse(JSON.stringify(d));Object.keys(old.x).filter(k=>/^jt/.test(k)).forEach(k=>delete old.x[k]);
  await p.setInputFiles('#fileIn',{name:'VI1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await sleep(900);
  const jo=await joint();
  ok('6 F167 a file saved before rows 7 and 8 opens with rows 1 to 6 in place and rows 7 and 8 taken from the register',jo[5]===j[5]&&jo[0]===j[0]&&jo[6]===j[6]&&jo[7]===j[7],jo);
  /* I85 */
  const hill=await p.evaluate(()=>({row:document.querySelector('#hillTbl tbody tr:last-child td').textContent,total:document.getElementById('hillTotal').textContent,band:document.getElementById('hillBand').textContent,box:document.getElementById('matchBox').hidden}));
  ok('7 I85 Hill\'s analogy is replication on a second sample, on the same 0-2 scale (the example: 14, high); the allocation table is hidden',hill.row==='Replicated on a second sample'&&hill.total==='14'&&/high/i.test(hill.band)&&hill.box===true&&/His "analogy" is replaced by replication on a second sample/.test(txt),hill);
  const withM=JSON.parse(JSON.stringify(d));
  await p.evaluate(()=>{const i=document.querySelectorAll('#matchTbl .mr');i[0].value='12';i[1].value='4';});
  const dl2=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('btnSave').click());const d2=fs.readFileSync(await (await dl2).path(),'utf8');
  await p.setInputFiles('#fileIn',{name:'VI1_m.json',mimeType:'application/json',buffer:Buffer.from(d2)});await sleep(900);
  const m1=await p.evaluate(()=>({box:document.getElementById('matchBox').hidden,p:document.querySelector('#matchTbl .mo1').textContent}));
  await p.setInputFiles('#fileIn',{name:'VI1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(withM))});await sleep(900);
  const m2=await p.evaluate(()=>document.getElementById('matchBox').hidden);
  ok('8 I85 a file holding counts in the allocation table shows it, computed; a file without them hides it again',m1.box===false&&m1.p==='0.75'&&m2===true,{m1,m2});
  await p.close();
  /* I82 */
  const q=await open();
  const reg=()=>q.evaluate(()=>[...document.querySelectorAll('#registerTbl tbody tr')].slice(0,3).map(tr=>[...tr.querySelectorAll('input,select')].map(x=>x.value).join(' | ')));
  const tick=(id,on)=>q.evaluate(([id,on])=>{const c=document.getElementById(id);c.checked=on;c.dispatchEvent(new Event('change',{bubbles:true}));},[id,on]);
  await tick('a1',true);await tick('b2',true);await tick('c3',true);
  const r1=await reg(),h1=await q.evaluate(()=>[...document.querySelectorAll('#agreeTbl thead th.v input')].slice(0,3).map(i=>i.value)),jj=await q.evaluate(()=>document.querySelector('#jointTbl tbody tr:nth-child(2) input').value);
  ok('9 I82 ticked items go into the register in order, with a short label and their class, and head the ledger and the joint table',
    r1[0]==='Poor sleep | Setting event / MO |  |  | '&&r1[1]==='Difficult or novel task | Antecedent / SD |  |  | '&&r1[2]==='Task removed | Consequence |  |  | '&&h1.join()==='Poor sleep,Difficult or novel task,Task removed'&&jj==='Difficult or novel task',{r1,h1,jj});
  await q.evaluate(()=>{const i=document.querySelector('#registerTbl tbody tr:nth-child(1) td:nth-child(4) input');i.value='Parent reports under 6 h (simulated)';i.dispatchEvent(new Event('input',{bubbles:true}));});
  await tick('a1',false);await tick('b2',false);await tick('a1',true);
  const r2=await reg();
  ok('10 I82 unticked: a row the form added and nobody changed is cleared; one with a definition typed is kept, and ticking again adds no copy',
    r2[0]==='Poor sleep | Setting event / MO | Parent reports under 6 h (simulated) |  | '&&r2[1]===' |  |  |  | '&&r2[2]==='Task removed | Consequence |  |  | '&&
    (await q.evaluate(()=>[...document.querySelectorAll('#registerTbl tbody tr td:nth-child(2) input')].filter(i=>i.value==='Poor sleep').length))===1,r2);
  /* F164 */
  const f={behaviors:[{label:'Aggression',def:'Forceful contact with staff (simulated)',dim:'frequency'}],
    evidence:{'SP-1':{form:'SP-1',from:'2026-09-01',to:'2026-09-12',dates:'9/1/2026–9/12/2026',n:10,fn:'',fnKey:'',strength:'',statement:'Most episodes fall in the independent work blocks at 9:00 and 13:30. Few at lunch.'},
      'OB-1':{form:'OB-1',from:'2026-09-08',to:'2026-09-10',dates:'9/8/2026–9/10/2026',n:3,fn:'Escape',fnKey:'escape',strength:'',statement:'x'},
      'ABC-1':{form:'ABC-1',from:'2026-09-02',to:'2026-09-20',dates:'9/2/2026–9/20/2026',n:24,fn:'Escape',fnKey:'escape',strength:'Moderate',statement:'x'},
      'IA-1':{form:'IA-1',from:'2026-09-03',to:'2026-09-03',dates:'9/3/2026',n:3,fn:'Escape',fnKey:'escape',strength:'Strong',statement:'y'},
      'IN-1':{form:'IN-1',from:'2026-09-04',to:'2026-09-08',dates:'9/4/2026–9/8/2026',n:2,fn:'Escape / avoidance',fnKey:'escape',strength:'',statement:'z'}},
    data:{src:'DD-1',from:'2026-09-01',to:'2026-10-10',days:28,conds:[{name:'Baseline',from:'2026-09-01',to:'2026-09-19',days:14},{name:'Intervention',from:'2026-09-22',to:'2026-10-10',days:14}],
      behaviors:[{name:'Aggression',days:28,mean:3.1,measure:'count',unit:'',base:{days:14,mean:4.2},baseName:'Baseline',cur:{days:14,mean:2},curName:'Intervention'}]}};
  const ev=()=>q.evaluate(()=>({lvl:document.querySelector('[name="s_level"]').value,rows:[...document.querySelectorAll('#evTbl tbody tr')].map(tr=>[...tr.querySelectorAll('input')].map(x=>x.value).join(' | '))}));
  await q.evaluate(()=>{const i=document.querySelector('#evTbl tbody tr:nth-child(6) input');i.value='Nurse log reviewed (simulated)';});
  await q.evaluate(f=>window.__nbhFactsIn(f),f);await sleep(200);
  const e1=await ev();
  ok('11 F164 each form the case holds fills its row: the dates, how much, and what it suggests, with the form named',
    e1.rows[0]==='9/1/2026–9/12/2026 | 10 days | Most episodes fall in the independent work blocks at 9:00 and 13:30 (Form SP-1)'&&e1.rows[1]==='9/8/2026–9/10/2026 | 3 observations | Escape (Form OB-1)'&&
    e1.rows[2]==='9/2/2026–9/20/2026 | 24 incidents | Escape, moderate (Form ABC-1)'&&e1.rows[3]==='9/1/2026–10/10/2026 | 28 school days | Baseline mean 4.2 a day; intervention mean 2 a day (Form DD-1)'&&
    e1.rows[4]==='9/3/2026–9/8/2026 | 3 informants; 2 interviews | IA-1: Escape, strong; IN-1: Escape / avoidance (Forms IA-1, IN-1)'&&e1.rows[5]==='Nurse log reviewed (simulated) |  | ',e1.rows);
  ok('12 F164 the current level is the case behavior\'s mean in DD-1\'s current condition, with its days and dates',e1.lvl==='2 a day (mean of 14 school days of intervention, 9/22/2026–10/10/2026; Form DD-1)',e1.lvl);
  const g=JSON.parse(JSON.stringify(f));g.evidence['ABC-1'].n=30;g.evidence['ABC-1'].strength='Strong';g.data.behaviors[0].cur={days:16,mean:1.5};
  await q.evaluate(()=>{const r=document.querySelectorAll('#evTbl tbody tr')[0].querySelectorAll('input');r[2].value='Clustered in work blocks: typed by the BCBA (simulated)';});
  await q.evaluate(f=>window.__nbhFactsIn(f),g);await sleep(200);
  const e2=await ev();
  ok('13 F164 a row the case wrote follows the case; a row typed here is kept',e2.rows[2]==='9/2/2026–9/20/2026 | 30 incidents | Escape, strong (Form ABC-1)'&&/^9\/1\/2026–9\/12\/2026 \| 10 days \| Clustered in work blocks: typed by the BCBA/.test(e2.rows[0])&&/^1\.5 a day \(mean of 16 school days/.test(e2.lvl),e2);
  await q.evaluate(()=>{const i=document.querySelector('[name="s_level"]');i.value='About 2 a day (typed, simulated)';});
  await q.evaluate(f=>window.__nbhFactsIn(f),f);await sleep(200);
  ok('14 F164 a level typed here is kept',(await ev()).lvl==='About 2 a day (typed, simulated)');
  await q.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('15 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
