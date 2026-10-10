/* v21.80 the shell: the caseload's morning refresh (Read every linked sheet), the caseload backup and restore, and the new
   Today items (PA-1's reassessment date, DD-1 assent, the re-entry level after exit, a maintenance probe as the check
   after exit). Google's sign-in and the Sheets API are simulated as in qa/v2176-test.js (no network). Simulated students
   only (Mateo Rivera; SIMULATED – Sample Student). usage: node qa/v2180-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const ID='1SIMULATEDsheetIDforTESTSabcdefghijklmnop';
const STU={name:'Mateo Rivera',id:'4471823'};
const DEFS=[{name:'Physical aggression',kind:'target',def:'Hitting, kicking or scratching another person (simulated).'},{name:'Requesting a break',kind:'acquisition',two:true,def:'Asks for a break (simulated).'}];
function tab(defs,days,student){const cols=[];defs.forEach(d=>{if(d.two)cols.push(d,{},{});else cols.push(d);});
  const W=1+cols.length,row=()=>new Array(W).fill('');const R=[];for(let i=0;i<18;i++)R.push(row());
  R[0][0]=student.name;R[1][0]=student.id;R[15][0]='Measurement';R[16][0]='Observ. Length';R[17][0]='Date';
  let c=1,fr=true,fa=true;defs.forEach(d=>{if(d.kind==='target'&&fr){R[0][c]='Reduction Targets';fr=false;}if(d.kind==='acquisition'&&fa){R[0][c]='Acquisition Targets';fa=false;}
    R[3][c]=d.name+' Definition';R[4][c]=d.def;R[6][c]=d.name;R[13][c]='Non Example: ';R[15][c]=d.two?'Percentage':'Count/Frequency';R[16][c]='Entire School Day';
    if(d.two){R[17][c]='Occurrences(+)';R[17][c+1]='Opportunities';R[17][c+2]='%';c+=3;}else{R[17][c]='(Total Per Day)';c++;}});
  const lab=row();lab[1]='chart labels';R.push(lab);
  days.forEach(([date,vals])=>{const r=row();r[0]=date;let c=1;defs.forEach((d,i)=>{const v=vals[i];if(d.two){if(v){r[c]=String(v[0]);r[c+1]=String(v[1]);r[c+2]=(Math.round(1000*v[0]/v[1])/10)+'%';}c+=3;}else{if(v!=null)r[c]=String(v);c++;}});R.push(r);});
  return R;}
let DAYS=[['8/10/2026',[6,[2,3]]],['8/11/2026',[5,[2,2]]],['8/12/2026',[1,[1,1]]]];
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  let calls=0;
  await ctx.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await ctx.route('https://sheets.googleapis.com/**',route=>{const u=decodeURIComponent(route.request().url());calls++;
    if(/values:batchGet/.test(u)){const tabs=[...u.matchAll(/ranges='([^']+)'!/g)].map(m=>m[1]);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({valueRanges:tabs.map(t=>({range:t,values:tab(DEFS,DAYS,STU)}))})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify({properties:{title:'SIMULATED Behavior Data Collection'},sheets:[{properties:{title:'Reduction and Acquisition TBx 1'}}]})});});
  await ctx.route('https://accounts.google.com/**',route=>route.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};try{['nbh.caseload.off','nbh.caseload.ini','nbh.caseload.backup','nbh.caseload.read'].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem('nbh.google.tok');}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  /* 1. Mateo's Form DD-1 linked to the simulated sheet, then Save case: the caseload keeps the link */
  await page.fill('#pClient',STU.name);await page.dispatchEvent('#pClient','input');await page.fill('#pSid',STU.id);await page.fill('#pSite','Royal Palm School');
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1500);
  const fr=()=>page.frames().find(f=>/Daily_Behavior/.test(f.url())&&f.parentFrame()===page.mainFrame()&&f.name()!=='x');
  const dd=fr();
  await dd.evaluate(id=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}S.meta.client='Mateo Rivera';document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gsFind').click();},ID);
  await sleep(1500);await dd.evaluate(()=>document.getElementById('gsGo').click());await sleep(1200);
  const lk=await dd.evaluate(()=>({id:S.gs&&S.gs.id,rows:S.rows.map(r=>r.date),hook:typeof window.__nbhGsRefresh}));
  ok('1a Form DD-1 is linked to the simulated sheet (three days) and has the refresh hook',lk.id&&lk.rows.length===3&&lk.hook==='function',lk);
  await Promise.all([page.waitForEvent('download',{timeout:30000}),page.evaluate(()=>saveCase())]);await sleep(800);
  await page.evaluate(async()=>{await clearCase();});await sleep(800);
  /* a second student with no sheet */
  await page.fill('#pClient','SIMULATED – Sample Student');await page.dispatchEvent('#pClient','input');await page.fill('#pSid','SIM-000');
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1200);
  await Promise.all([page.waitForEvent('download',{timeout:30000}),page.evaluate(()=>saveCase())]);await sleep(800);
  await page.evaluate(async()=>{await clearCase();});await sleep(800);
  /* 2. a new day on the sheet; Read every linked sheet (signed in already in this tab) */
  DAYS.push(['8/13/2026',[2,[3,3]]]);
  await page.evaluate(()=>caseloadOpen());await sleep(800);
  const t0=await page.evaluate(()=>{const b=document.getElementById('clRead');return {txt:b&&b.textContent,dis:b&&b.disabled,bk:!!document.getElementById('clBk'),rs:!!document.getElementById('clRs')};});
  ok('2a Caseload offers Read every linked sheet (1), Back up and Restore',/Read every linked sheet \(1\)/.test(t0.txt)&&!t0.dis&&t0.bk&&t0.rs,t0);
  const ask0=await page.evaluate(()=>window.__gsAsk);calls=0;
  await page.evaluate(()=>document.getElementById('clRead').click());
  await page.waitForFunction(()=>!CLX.busy&&document.querySelector('#dlgBody .cl-note'),null,{timeout:90000}).catch(()=>{});
  const r1=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera'),o=JSON.parse(JSON.parse(r.text).forms['DD-1'].snap.own);
    return {rows:(o.S||o).rows.map(x=>x.date),last:r.sum.lastData,fdata:JSON.parse(r.text).facts.data.to,note:(document.querySelector('#dlgBody .cl-note')||{}).textContent||'',status:Object.keys(state.status),host:document.querySelectorAll('#clHost iframe').length,ask:window.__gsAsk};});
  ok('2b the sheet was read for Mateo: his copy holds the new day (8/13), the summary and the case facts say so',r1.rows.includes('2026-08-13')&&r1.last==='2026-08-13'&&r1.fdata==='2026-08-13'&&/Read 1 sheet/.test(r1.note)&&/Mateo Rivera/.test(r1.note),r1);
  ok('2c no sign-in asked (still signed in), Google asked, the hidden form is gone and left no status in the shell',r1.ask===ask0&&calls>=1&&r1.host===0&&!r1.status.includes('DD-1'),{ask:r1.ask,ask0,calls,host:r1.host,status:r1.status});
  /* 3. signed out: the tap opens Google's sign-in, then the sheets are read */
  DAYS.push(['8/14/2026',[0,[3,3]]]);
  await page.evaluate(()=>{try{sessionStorage.removeItem('nbh.google.tok');}catch(e){}caseloadOpen();});await sleep(800);
  const hint=await page.evaluate(()=>document.querySelector('#clTools .hint:last-child').textContent);
  await page.evaluate(()=>document.getElementById('clRead').click());
  await page.waitForFunction(()=>!CLX.busy&&document.querySelector('#dlgBody .cl-note'),null,{timeout:90000}).catch(()=>{});
  const r2=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera'),o=JSON.parse(JSON.parse(r.text).forms['DD-1'].snap.own);return {rows:(o.S||o).rows.map(x=>x.date),ask:window.__gsAsk,tok:!!sessionStorage.getItem('nbh.google.tok')};});
  ok('3a signed out: the hint says the read asks for the sign-in; the tap signs in once and reads (8/14 arrives)',/asks for the Google sign-in/.test(hint)&&r2.ask===ask0+1&&r2.tok&&r2.rows.includes('2026-08-14'),{hint,r2});
  /* 4. the student on screen: their open Form DD-1 reads its own sheet */
  DAYS.push(['8/17/2026',[1,[2,3]]]);
  const key=await page.evaluate(async()=>(await clList()).find(r=>r.client==='Mateo Rivera').key);
  await page.evaluate(k=>caseloadGo(k,''),key);await sleep(2000);
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1']&&!state.pending['DD-1'],null,{timeout:30000});await sleep(1500);
  await page.evaluate(()=>caseloadOpen());await sleep(600);
  await page.evaluate(()=>document.getElementById('clRead').click());
  await page.waitForFunction(()=>!CLX.busy&&document.querySelector('#dlgBody .cl-note'),null,{timeout:90000}).catch(()=>{});
  const live=await fr().evaluate(()=>S.rows.map(r=>r.date));
  const r4=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera');return {last:r.sum.lastData,frames:Object.keys(state.frames),note:(document.querySelector('#dlgBody .cl-note')||{}).textContent||''};});
  ok('4a the student on screen: the open Form DD-1 takes the new day itself, and Caseload says when the data runs to',live.includes('2026-08-17')&&r4.last==='2026-08-17'&&/Read 1 sheet/.test(r4.note),{live,r4});
  /* 5. the backup and the restore */
  const [dl]=await Promise.all([page.waitForEvent('download',{timeout:20000}),page.evaluate(()=>document.getElementById('clBk').click())]);
  const bp=await dl.path(),bj=JSON.parse(fs.readFileSync(bp,'utf8'));await sleep(500);
  ok('5a Back up the caseload: one file, CASELOAD, both students with their cases',bj.form==='CASELOAD'&&bj.cases.length===2&&bj.cases.every(c=>typeof c.text==='string'&&JSON.parse(c.text).form==='CASE')&&/^CASELOAD_\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()),{form:bj.form,n:bj.cases&&bj.cases.length,name:dl.suggestedFilename()});
  const at=await page.evaluate(()=>clBkAt());ok('5b the backup time is kept, and Today asks for no backup now',!!at&&!(await page.evaluate(()=>clBkDue())),at);
  /* one student taken off, the other made newer here; restore brings the first back and keeps the newer one */
  await page.evaluate(async()=>{const L=await clList();const a=L.find(r=>r.client==='Mateo Rivera'),b=L.find(r=>r.client!=='Mateo Rivera');await clTx('readwrite',st=>st.delete(a.key));b.saved='2099-01-01T00:00:00.000Z';b.site='Newer here';await clTx('readwrite',st=>st.put(b));});
  await page.setInputFiles('#clFile',bp);await sleep(1500);
  const rs=await page.evaluate(async()=>(await clList()).map(r=>({c:r.client,site:r.site})));
  ok('5c Restore a backup: the missing student is back, the newer copy here is kept',rs.length===2&&rs.some(r=>r.c==='Mateo Rivera')&&rs.some(r=>r.site==='Newer here'),rs);
  const bad=await page.evaluate(()=>{let said='';window.alert=m=>{said=m;};return clRestoreText('{"form":"CASE","forms":{}}').then(()=>said);});
  ok('5d a case file given to Restore is told apart',/Open case/.test(bad),bad);
  await page.evaluate(()=>{try{localStorage.setItem('nbh.caseload.backup','2026-01-01T00:00:00.000Z');}catch(e){}});
  await page.evaluate(()=>todayOpen());await sleep(1200);
  const tb=await page.evaluate(()=>{const b=document.getElementById('tdBk');return b?b.closest('li').textContent:'';});
  ok('5e Today reminds you to back up when the last backup is over a week old',/last backed up/.test(tb)&&/2 students/.test(tb),tb);
  /* 6. the new Today items, from simulated facts */
  const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const T=await page.evaluate(D=>{const f={src:{},prefs:{reassess:D.p3,last:D.m4,schedule:'Brief MSWO weekly'},
      data:{from:D.m40,to:D.m1,days:20,behaviors:[{name:'Physical aggression',kind:'target',unit:'per day',direction:'decrease'},{name:'Requesting a break',kind:'acquisition',unit:'%'}],
        assent:{days:12,refused:3,withdrew:1,last10:{days:10,refused:2,withdrew:1},list:[]},byDay:[{date:D.m25,vals:{'Physical aggression':0}},{date:D.m5,vals:{'Physical aggression':3}},{date:D.m3,vals:{'Physical aggression':4}},{date:D.m1,vals:{'Physical aggression':3,'Requesting a break':90}}],probes:[]},
      review:{date:D.m40,exit:{date:D.m20,next:D.p2,every:'every two weeks',threshold:'Physical aggression above 2 a day',thresholdN:2}},behaviors:[{label:'Physical aggression'}]};
    setFacts(f,false);const a=todayItems().map(x=>({k:x.k,t:x.t,open:x.open}));
    f.data.probes=[{date:D.m1,kind:'maint',setting:'Classroom'}];setFacts(f,false);const b=todayItems().map(x=>({k:x.k,t:x.t,open:x.open}));
    f.data.assent.last10={days:10,refused:1,withdrew:1};f.review.exit.thresholdN=5;f.prefs.reassess=D.p30;setFacts(f,false);const c=todayItems().map(x=>({k:x.k,t:x.t,open:x.open}));
    return {a,b,c,order:CL_ORDER.slice()};},{p3:iso(3),p2:iso(2),p30:iso(30),m1:iso(-1),m3:iso(-3),m4:iso(-4),m5:iso(-5),m20:iso(-20),m25:iso(-25),m40:iso(-40)});
  const has=(L,k,re,open)=>L.some(x=>x.k===k&&re.test(x.t)&&(!open||x.open===open));
  ok('6a PA-1\'s reassessment due in 3 days is a Today item that opens PA-1',has(T.a,'Timeline',/preference reassessment \(Form PA-1\) is due/,'PA-1'),T.a);
  ok('6b assent refused or withdrawn on 3 of the last 10 days marked is an Assent item, ranked after Decision',has(T.a,'Assent',/refused on 2 and withdrew assent on 1/,'PR-1')&&T.order.indexOf('Assent')===T.order.indexOf('Decision')+1,{a:T.a,order:T.order});
  ok('6c the days since the exit average above the level set for going back to the plan: a Decision item (only the target named, only the days after the exit)',has(T.a,'Decision',/Physical aggression has averaged 3\.33 per day over 3 days since the exit/,'PR-1')&&!T.a.some(x=>/Requesting a break has averaged/.test(x.t)),T.a);
  ok('6d the check after exit is due; a maintenance probe on Form DD-1 counts as that check',has(T.a,'Timeline',/The check after exit is due/)&&!T.b.some(x=>/The check after exit is due/.test(x.t)),{a:T.a.map(x=>x.t),b:T.b.map(x=>x.t)});
  ok('6e under the thresholds, none of the new items',!T.c.some(x=>x.k==='Assent'||/preference reassessment|has averaged/.test(x.t)),T.c);
  /* 7. PA-1's prefs reach the case facts */
  await page.evaluate(async()=>{await clearCase();});await sleep(500);
  await page.evaluate(()=>openForm('PA-1'));await page.waitForFunction(()=>!!state.status['PA-1'],null,{timeout:30000});await sleep(1200);
  const pa=page.frames().find(f=>/PA-1_Preference/.test(f.url()));
  await pa.evaluate(d=>{const e=document.querySelector('#mReassessDue');e.value=d;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},iso(-2));
  await page.evaluate(async()=>{await gatherFacts(false);});
  const pf=await page.evaluate(()=>({prefs:state.facts&&state.facts.prefs,src:state.facts&&state.facts.src.prefs,item:todayItems().find(x=>x.open==='PA-1'&&/reassessment/.test(x.t))}));
  ok('7a PA-1\'s Next reassessment due reaches the case (prefs, from PA-1) and Today says it is overdue',pf.prefs&&pf.prefs.reassess===iso(-2)&&pf.src==='PA-1'&&pf.item&&pf.item.k==='Overdue'&&/2 days overdue/.test(pf.item.t),pf);
  ok('no page errors',!errs.length,errs.slice(0,5));
  await page.evaluate(async()=>{const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
