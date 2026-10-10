/* v21.76 Form DD-1 and the team's Google Sheet. Google's sign-in and the Sheets API are simulated here (no network): a
   simulated student's sheet in the Behavior-Charts template (one tab with three reduction and two acquisition targets,
   a second with three more, an ABC tab that is not a data tab).
   1. Link a Google Sheet: the sign-in key, the link, the tabs with target columns ticked (the ABC tab not offered), a
      look at the targets and days; Link and read: a record not yet used takes the sheet's eight targets, their kinds,
      measurements and definitions, every day and value; the cells the sheet wrote are marked;
   2. the sheet wins over a value typed for one of its days; "Use the sheet's data" off puts the typed value back and
      takes out the days only the sheet had; on brings the sheet back; reading again changes nothing that did not change
      and a new day on the sheet arrives;
   3. a sheet for another student is not taken until confirmed; Google signing out (401) offers Sign in again and keeps
      the record as last read; the link and what it holds travel in the data file, the sign-in never; a record kept in
      intervals is not filled; Unlink takes the sheet out. No page errors.
   usage: node qa/v2176-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const ID='1SIMULATEDsheetIDforTESTSabcdefghijklmnop';
/* a simulated sheet in the template's shape */
function tab(defs,days,student){const cols=[];defs.forEach(d=>{if(d.two)cols.push(d,{cont:1},{cont:2});else cols.push(d);});
  const W=1+cols.length,row=()=>new Array(W).fill('');const R=[];for(let i=0;i<18;i++)R.push(row());
  R[0][0]=student.name;R[1][0]=student.id;R[15][0]='Measurement';R[16][0]='Observ. Length';R[17][0]='Date';
  let c=1,firstRed=true,firstAcq=true;defs.forEach(d=>{
    if(d.kind==='target'&&firstRed){R[0][c]='Reduction Targets';firstRed=false;}if(d.kind==='acquisition'&&firstAcq){R[0][c]='Acquisition Targets';firstAcq=false;}
    R[3][c]=d.name+' Definition';R[4][c]=d.def;R[6][c]=d.name;R[9][c]='Example 1: '+(d.ex||'');R[13][c]='Non Example: ';
    R[15][c]=d.two?'Percentage':'Count/Frequency';R[16][c]='Entire School Day';
    if(d.two){R[17][c]='Occurrences(+)';R[17][c+1]='Opportunities';R[17][c+2]='%';c+=3;}else{R[17][c]='(Total Per Day)';c++;}});
  const lab=row();lab[1]='chart labels';R.push(lab);
  days.forEach(([date,vals])=>{const r=row();r[0]=date;let c=1;defs.forEach((d,i)=>{const v=vals[i];if(d.two){if(v){r[c]=String(v[0]);r[c+1]=String(v[1]);r[c+2]=(Math.round(1000*v[0]/v[1])/10)+'%';}c+=3;}else{if(v!==null&&v!==undefined)r[c]=String(v);c++;}});R.push(r);});
  return R;}
const STU={name:'Mateo Rivera',id:'4471823'};
const T1=[{name:'Physical aggression',kind:'target',def:'Hitting, kicking or scratching another person (simulated).',ex:'kicks an aide'},{name:'Property destruction',kind:'target',def:'Tearing or breaking materials (simulated).'},
  {name:'Elopement',kind:'target',def:'Leaving the assigned area without permission (simulated).'},
  {name:'Requesting access',kind:'acquisition',two:true,def:'Asks for an item with the card (simulated).'},{name:'Requesting a break',kind:'acquisition',two:true,def:'Asks for a break (simulated).'}];
const T2=[{name:'Screaming',kind:'target',def:'Vocal outbursts (simulated).'},{name:'Following directions',kind:'acquisition',two:true,def:'Starts within 10 s (simulated).'},{name:'Waiting',kind:'acquisition',two:true,def:'Waits 2 min (simulated).'}];
let D1=[['8/10/2026',[6,0,1,[2,3],[1,1]]],['8/11/2026',[5,0,0,[2,2],[2,2]]],['8/12/2026',[1,0,2,[1,1],[1,2]]],['8/13/2026',[0,0,null,[2,3],[1,1]]]];
const D2=[['8/10/2026',[3,[4,5],[1,2]]],['8/11/2026',[2,[5,5],[2,2]]]];
(async()=>{const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1300,height:950}});wire(page,log);
  let calls=[],status=200,student=STU;
  await page.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await page.route('https://sheets.googleapis.com/**',route=>{const u=decodeURIComponent(route.request().url());calls.push({u,auth:route.request().headers()['authorization']});
    if(status!==200)return route.fulfill({status,body:'{}',contentType:'application/json'});
    if(/values:batchGet/.test(u)){const tabs=[...u.matchAll(/ranges='([^']+)'!/g)].map(m=>m[1]);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({valueRanges:tabs.map(t=>({range:t,values:t==='Reduction and Acquisition TBx 1'?tab(T1,D1,student):t==='Reduction and Acquisition TBx 2'?tab(T2,D2,student):[['ABC Checklist'],['Date','Antecedent','Behavior']]}))})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify({properties:{title:'SIMULATED Behavior Data Collection'},sheets:[{properties:{title:'Reduction and Acquisition TBx 1'}},{properties:{title:'Reduction and Acquisition TBx 2'}},{properties:{title:'ABC Checklist Linked To ScatterPlot'}},{properties:{title:'Old tab',hidden:true}}]})});});
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}S.meta.client='Mateo Rivera';document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));renderAll();});
  const b0=await page.evaluate(()=>document.getElementById('gsBar').innerText);
  ok('1a the data tab offers to link a Google Sheet',/Link a Google Sheet/.test(b0),b0);
  await page.evaluate(id=>{document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit?usp=sharing';document.getElementById('gsFind').click();},ID);
  await sleep(1200);
  const dl=await page.evaluate(()=>({tabs:[...document.querySelectorAll('#gsTabs label')].map(l=>[l.querySelector('b').textContent,l.querySelector('input').checked]),prev:document.getElementById('gsPrev').innerText,go:document.getElementById('gsGo').disabled,ask:window.__gsAsk,msg:document.getElementById('gsMsg').textContent}));
  ok('1b signed in once, the tabs with target columns are offered and ticked (the ABC tab and the hidden one are not), with a look at the eight targets and four days',
    dl.ask===1&&dl.tabs.length===2&&dl.tabs.every(t=>t[1])&&/8 targets/.test(dl.prev)&&/4 school days/.test(dl.prev)&&/Requesting a break/.test(dl.prev)&&!dl.go&&/SIMULATED Behavior Data Collection/.test(dl.msg),dl);
  ok('1c every request to Google carries the sign-in, and only Google Sheets is asked',calls.length>=2&&calls.every(c=>c.auth==='Bearer simulated-token'&&/^https:\/\/sheets\.googleapis\.com\/v4\/spreadsheets\/1SIMULATED/.test(c.u)),calls.map(c=>c.u.slice(0,90)));
  await page.evaluate(()=>document.getElementById('gsGo').click());await sleep(800);
  const r1=await page.evaluate(()=>{const B=orderedBehaviors();const row=d=>S.rows.find(r=>r.date===d);const b=n=>S.behaviors.find(x=>x.name===n);
    return {names:S.behaviors.map(x=>x.name),kinds:S.behaviors.map(x=>x.kind),meas:S.behaviors.map(x=>x.measure),rows:S.rows.map(r=>r.date),
      pa:row('2026-08-10').values[b('Physical aggression').id],ra:[row('2026-08-10').values[b('Requesting access').id],row('2026-08-10').values[OPP(b('Requesting access').id)]],
      el13:row('2026-08-13').values[b('Elopement').id],def:b('Physical aggression').definition,wait:[row('2026-08-11').values[b('Waiting').id],row('2026-08-11').values[OPP(b('Waiting').id)]],
      marks:document.querySelectorAll('#dataTable input.gs-cell').length,bar:document.getElementById('gsBar').innerText,id:S.meta.id};});
  ok('1d a record not yet used takes the sheet’s eight targets (the example rows give way), each with its kind and measurement',
    r1.names.length===8&&r1.names.indexOf('Self-injury')<0&&r1.kinds.filter(k=>k==='target').length===4&&r1.kinds.filter(k=>k==='acquisition').length===4&&r1.meas.filter(m=>m==='trials').length===4&&r1.meas.filter(m=>m==='count').length===4,r1);
  ok('1e every day and value comes in: a count, occurrences and opportunities, a blank left blank, the definition with its example, the student number',
    r1.rows.join()==='2026-08-10,2026-08-11,2026-08-12,2026-08-13'&&r1.pa==='6'&&r1.ra.join()==='2,3'&&r1.el13===''&&r1.wait.join()==='2,2'&&/Hitting, kicking/.test(r1.def)&&/Example 1: kicks an aide/.test(r1.def)&&r1.id==='4471823',r1);
  ok('1f the cells the sheet wrote are marked and the bar says what was read',r1.marks===37&&/8 targets, 4 days/.test(r1.bar)&&/Use the sheet/.test(r1.bar),{marks:r1.marks,bar:r1.bar});
  /* 2. the sheet wins; off and on */
  const r2=await page.evaluate(()=>{const b=S.behaviors.find(x=>x.name==='Physical aggression');const r=S.rows.find(x=>x.date==='2026-08-10');
    /* a value typed under the sheet's, and a day of its own */
    gsUndo();const own=newRow('2026-08-20');S.behaviors.forEach(bb=>{own.values[bb.id]='';own.values[OPP(bb.id)]='';});own.values[b.id]='9';S.rows.push(own);
    const r10=newRow('2026-08-10');S.behaviors.forEach(bb=>{r10.values[bb.id]='';r10.values[OPP(bb.id)]='';});r10.values[b.id]='4';S.rows.push(r10);
    gsApply();renderAll();const out={win:S.rows.find(x=>x.date==='2026-08-10').values[b.id],rows:S.rows.length};
    const c=document.getElementById('gsUse');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));
    out.off={pa10:(S.rows.find(x=>x.date==='2026-08-10')||{values:{}}).values[b.id],dates:S.rows.map(x=>x.date).sort().join(),own:S.rows.find(x=>x.date==='2026-08-20').values[b.id],bar:document.getElementById('gsBar').innerText,beh:S.behaviors.length};
    const c2=document.getElementById('gsUse');c2.checked=true;c2.dispatchEvent(new Event('change',{bubbles:true}));out.on=S.rows.find(x=>x.date==='2026-08-10').values[b.id];out.rowsOn=S.rows.length;return out;});
  ok('2a the sheet wins over a value typed for one of its days',r2.win==='6',r2);
  ok('2b "Use the sheet’s data" off: the typed value is back, the days only the sheet had are gone, the record’s own day stays',r2.off.pa10==='4'&&r2.off.dates==='2026-08-10,2026-08-20'&&r2.off.own==='9'&&/Not in use/.test(r2.off.bar),r2.off);
  ok('2c on again, the sheet is back',r2.on==='6'&&r2.rowsOn===5,r2);
  await sleep(800);
  D1=D1.concat([['8/14/2026',[2,1,0,[3,4],[2,2]]]]);
  const r3=await page.evaluate(async()=>{const k0=Object.keys(S.gs.applied).length,n0=S.rows.length;await gsRead({});return {n0,n1:S.rows.length,k0,k1:Object.keys(S.gs.applied).length,d14:!!S.rows.find(r=>r.date==='2026-08-14'),beh:S.behaviors.length};});
  ok('2d reading again: the new day on the sheet arrives, nothing else is doubled',r3.n1===r3.n0+1&&r3.d14&&r3.beh===8&&r3.k1>r3.k0,r3);
  /* 3. another student, signed out, the file, intervals, unlink */
  student={name:'SIMULATED Other Pupil',id:'999'};
  const r4=await page.evaluate(async()=>{const n=S.rows.length;await gsRead({});const t=document.getElementById('gsBar').innerText;return {n,n1:S.rows.length,t,btn:!!document.getElementById('gsNameOk')};});
  ok('3a a sheet for another student is not taken: the bar names both and asks',r4.n1===r4.n&&/This sheet is for SIMULATED Other Pupil; the record is for Mateo Rivera/.test(r4.t)&&r4.btn,r4);
  student=STU;status=401;
  const r5=await page.evaluate(async()=>{await gsRead({});return {t:document.getElementById('gsBar').innerText,sign:!!document.getElementById('gsSign'),signed:gsSigned(),rows:S.rows.length};});
  ok('3b signed out by Google (401): the record stays as last read and the bar offers Sign in again',r5.sign&&!r5.signed&&r5.rows===6&&/Signed out of Google/.test(r5.t),r5);
  status=200;
  const r6=await page.evaluate(async()=>{document.getElementById('gsSign').click();await new Promise(r=>setTimeout(r,800));
    const txt=JSON.stringify(S);await new Promise(res=>{openFile(new File([txt],'d.json',{type:'application/json'}));setTimeout(res,800);});
    return {signed:gsSigned(),tok:/simulated-token/.test(txt),id:S.gs&&S.gs.id,tabs:S.gs&&S.gs.tabs.length,groups:S.gs&&S.gs.cache&&S.gs.cache.groups.length,applied:S.gs&&Object.keys(S.gs.applied).length,rows:S.rows.length};});
  ok('3c Sign in again reads the sheet; the link, the tabs and what the sheet wrote travel in the data file, the sign-in never',r6.signed&&!r6.tok&&r6.id&&r6.id.indexOf('1SIMULATED')===0&&r6.tabs===2&&r6.groups===8&&r6.applied>40&&r6.rows===6,r6);
  const r7=await page.evaluate(()=>{const c=document.getElementById('gsUse');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));S.settings.entryMode='interval';S.gs.on=true;const r=gsApply();S.settings.entryMode='daily';return r;});
  ok('3d a record kept in intervals is not filled from the daily totals, and says why',r7.n===0&&/intervals/.test(r7.warn.join(' ')),r7);
  const r8=await page.evaluate(async()=>{gsApply();renderAll();await gsUnlinkGo();return {gs:S.gs,dates:S.rows.map(r=>r.date).sort().join(),bar:document.getElementById('gsBar').innerText,beh:S.behaviors.length};});
  ok('3e Unlink takes out what the sheet wrote and leaves the record’s own',r8.gs===null&&r8.dates==='2026-08-10,2026-08-20'&&/Link a Google Sheet/.test(r8.bar),r8);
  const errs=log.filter(l=>l.type==='pageerror');
  ok('3f no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
