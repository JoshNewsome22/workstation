/* v21.81 (helper G) Form DD-1 and the Google Sheet: whose sheet it is, and incidents counted on a day the sheet writes.
   Google's sign-in and the Sheets API are simulated here (no network), as in qa/v2176-test.js; simulated student only.
   1. the student check: "Lucas Rivera" or "Mateo Sanchez" is not "Mateo Rivera"; "Rivera, Mateo", a middle initial, a
      "SIMULATED –" prefix are; when both have a student ID the IDs decide (spaces and leading zeros aside); a sheet whose
      ID differs is not taken even with the same name, asks, and once confirmed holds only for that ID; the caseload's
      unattended refresh refuses a sheet for another student with a plain message and changes nothing; a name confirmed
      before v21.81 does not cover a sheet whose ID differs; the link dialog asks too.
   2. incidents counted on a day the sheet writes: added on top of the sheet's number and kept at every reading (and when
      the sheet's number changes); deleting or uncounting takes exactly one off; set aside shows the record's own; one
      counted while the sheet was set aside is in the record's own number and on top of the sheet's; the mark travels in
      the data file; unlinking leaves the record's own numbers and says the incidents are no longer counted. No page errors.
   usage: node qa/v2181-g-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const ID='1SIMULATEDsheetIDforTESTSabcdefghijklmnop';
function tab(defs,days,student){const cols=[];defs.forEach(d=>{if(d.two)cols.push(d,{cont:1},{cont:2});else cols.push(d);});
  const W=1+cols.length,row=()=>new Array(W).fill('');const R=[];for(let i=0;i<18;i++)R.push(row());
  R[0][0]=student.name;R[1][0]=student.id;R[15][0]='Measurement';R[16][0]='Observ. Length';R[17][0]='Date';
  let c=1,firstRed=true,firstAcq=true;defs.forEach(d=>{
    if(d.kind==='target'&&firstRed){R[0][c]='Reduction Targets';firstRed=false;}if(d.kind==='acquisition'&&firstAcq){R[0][c]='Acquisition Targets';firstAcq=false;}
    R[3][c]=d.name+' Definition';R[4][c]=d.def;R[6][c]=d.name;R[15][c]=d.two?'Percentage':'Count/Frequency';R[16][c]='Entire School Day';
    if(d.two){R[17][c]='Occurrences(+)';R[17][c+1]='Opportunities';R[17][c+2]='%';c+=3;}else{R[17][c]='(Total Per Day)';c++;}});
  days.forEach(([date,vals])=>{const r=row();r[0]=date;let c=1;defs.forEach((d,i)=>{const v=vals[i];if(d.two){if(v){r[c]=String(v[0]);r[c+1]=String(v[1]);}c+=3;}else{if(v!==null&&v!==undefined)r[c]=String(v);c++;}});R.push(r);});
  return R;}
const STU={name:'Mateo Rivera',id:'4471823'};
const T1=[{name:'Physical aggression',kind:'target',def:'Hitting or kicking another person (simulated).'},{name:'Elopement',kind:'target',def:'Leaving the area (simulated).'},
  {name:'Requesting a break',kind:'acquisition',two:true,def:'Asks for a break (simulated).'}];
let D1=[['8/10/2026',[6,1,[1,2]]],['8/11/2026',[5,0,[2,2]]],['8/12/2026',[3,null,[1,1]]]];
(async()=>{const br=await chromium.launch();const log=[];
  const page=await br.newPage({viewport:{width:1300,height:950}});wire(page,log);
  let student=STU;
  await page.addInitScript(()=>{window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){setTimeout(()=>cfg.callback({access_token:'simulated-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await page.route('https://sheets.googleapis.com/**',route=>{const u=decodeURIComponent(route.request().url());
    if(/values:batchGet/.test(u)){const tabs=[...u.matchAll(/ranges='([^']+)'!/g)].map(m=>m[1]);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({valueRanges:tabs.map(t=>({range:t,values:tab(T1,D1,student)}))})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify({properties:{title:'SIMULATED Behavior Data Collection'},sheets:[{properties:{title:'Reduction and Acquisition TBx 1'}}]})});});
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}S.meta.client='Mateo Rivera';document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));renderAll();});
  /* 1. the student check, as a function */
  const f=await page.evaluate(()=>{const t=(n,i,cl,rid)=>{S.meta.client=cl;S.meta.id=rid;return gsSameStudent(n,i);};
    const o={lucas:t('Lucas Rivera','','Mateo Rivera',''),sanchez:t('Mateo Sanchez','','Mateo Rivera',''),comma:t('Rivera, Mateo','','Mateo Rivera',''),
      mid:t('SIMULATED – Mateo J. Rivera','','Mateo Rivera',''),caps:t('MATEO  RIVERA.','','Mateo Rivera',''),recComma:t('Mateo Rivera','','RIVERA, MATEO J',''),
      sim:t('SIMULATED – Sample Student','','SIMULATED – Sample Student',''),idMis:t('Mateo Rivera','4471824','Mateo Rivera','4471823'),
      idZeros:t('Mateo Rivera',' 0004471823 ','Mateo Rivera','4471 823'),idWins:t('M. Rivera','4471823','Mateo Rivera','4471823'),oneId:t('Lucas Rivera','4471823','Mateo Rivera',''),empty:t('','','Mateo Rivera','')};
    S.meta.client='Mateo Rivera';S.meta.id='';return o;});
  ok('1a names: Lucas Rivera and Mateo Sanchez are not Mateo Rivera; "Rivera, Mateo", a middle initial, capitals and punctuation, a SIMULATED prefix are',
    !f.lucas&&!f.sanchez&&f.comma&&f.mid&&f.caps&&f.recComma&&f.sim,f);
  ok('1b IDs: when both are there they decide (a different ID is refused with the same name; spaces and leading zeros aside); one ID alone leaves it to the names',
    !f.idMis&&f.idZeros&&f.idWins&&!f.oneId&&f.empty,f);
  /* link the simulated student's sheet */
  await page.evaluate(id=>{document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gsFind').click();},ID);
  await sleep(1000);await page.evaluate(()=>document.getElementById('gsGo').click());await sleep(700);
  const l0=await page.evaluate(()=>({id:S.meta.id,rows:S.rows.length,nameOk:S.gs.nameOk}));
  ok('1c the simulated student’s own sheet links without asking and gives the record its student ID',l0.id==='4471823'&&l0.rows===3&&l0.nameOk==='',l0);
  const snap='()=>JSON.stringify({rows:S.rows,cache:S.gs.cache,read:S.gs.read,nameOk:S.gs.nameOk,applied:S.gs.applied,meta:S.meta,beh:S.behaviors})';
  const readAs=async who=>{student=who;return page.evaluate(async s=>{const before=eval(s)();const r=await gsRead({quiet:true});return {r,same:eval(s)()===before,bar:document.getElementById('gsBar').innerText,btn:!!document.getElementById('gsNameOk')};},snap);};
  const q1=await readAs({name:'Lucas Rivera',id:''});
  ok('1d a sheet for Lucas Rivera (no ID on it) is not taken: nothing changes and the bar asks',!q1.r&&q1.same&&q1.btn&&/This sheet is for Lucas Rivera; the record is for Mateo Rivera/.test(q1.bar),q1);
  const q2=await readAs({name:'Rivera, Mateo',id:'4471823'});
  ok('1e a sheet for "Rivera, Mateo" with the same ID is read',q2.r===true,q2);
  const q3=await readAs({name:'Mateo Rivera',id:'5550001'});
  ok('1f a sheet with the same name and a different student ID is not taken, and the bar says the IDs differ',!q3.r&&q3.same&&q3.btn&&/IDs differ \(sheet 5550001, record 4471823\)/.test(q3.bar),q3);
  const rf=await page.evaluate(async s=>{const before=eval(s)();const o=await window.__nbhGsRefresh();return {o,same:eval(s)()===before};},snap);
  ok('1g the caseload’s unattended refresh refuses it: ok false, a plain message, nothing changed',rf.o.ok===false&&rf.o.linked&&rf.o.err==='The sheet is for Mateo Rivera, not this student: open Form DD-1 to check the link.'&&rf.same,rf);
  student={name:'Lucas Rivera',id:''};
  const rf2=await page.evaluate(async s=>{const before=eval(s)();const o=await window.__nbhGsRefresh();return {o,same:eval(s)()===before};},snap);
  ok('1h the refresh refuses Lucas Rivera’s sheet the same way',rf2.o.ok===false&&rf2.o.err==='The sheet is for Lucas Rivera, not this student: open Form DD-1 to check the link.'&&rf2.same,rf2);
  /* confirmed by the person for ID 5550001: holds for that sheet student only */
  student={name:'Mateo Rivera',id:'5550001'};
  const c1=await page.evaluate(async()=>{await gsRead({quiet:true});document.getElementById('gsNameOk').click();await new Promise(r=>setTimeout(r,600));
    const a=S.gs.nameOk,read1=S.gs.read;const o=await window.__nbhGsRefresh();return {a,o,changed:S.gs.read!==read1};});
  ok('1i "It is the same student" takes it, and the refresh then reads that same sheet (it has been confirmed)',/5550001/.test(c1.a)&&c1.o.ok===true&&c1.changed,c1);
  student={name:'Mateo Rivera',id:'5550002'};
  const c2=await page.evaluate(async s=>{const before=eval(s)();const o=await window.__nbhGsRefresh();return {o,same:eval(s)()===before};},snap);
  ok('1j a sheet with yet another ID is refused again: the answer was for one ID, not for the name',c2.o.ok===false&&c2.same&&/not this student/.test(c2.o.err),c2);
  const c3=await page.evaluate(async s=>{S.gs.nameOk='Mateo Rivera';const before=eval(s)();const r=await gsRead({quiet:true});return {r,same:eval(s)()===before};},snap);
  ok('1k a name confirmed before v21.81 does not cover a sheet whose ID differs from the record’s',c3.r===false&&c3.same,c3);
  student={name:'Lucas Rivera',id:''};
  const dl=await page.evaluate(async id=>{document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gsFind').click();
    await new Promise(r=>setTimeout(r,900));const o={go:document.getElementById('gsGo').disabled,ask:!!document.getElementById('gsSameOk'),txt:document.getElementById('gsPrev').innerText};document.getElementById('gsCancel').click();return o;},ID);
  ok('1l the link dialog asks before taking Lucas Rivera’s sheet',dl.go&&dl.ask&&/The sheet is for Lucas Rivera/.test(dl.txt),dl);
  student=STU;
  const back=await page.evaluate(async()=>{S.gs.nameOk='';return await gsRead({quiet:true});});
  ok('1m the simulated student’s own sheet is read again',back===true,back);

  /* 2. incidents counted on a day the sheet writes */
  const pa=()=>page.evaluate(()=>{const b=S.behaviors.find(x=>x.name==='Physical aggression'),r=S.rows.find(x=>x.date==='2026-08-10');return r?r.values[b.id]:null;});
  const logInc=(date)=>page.evaluate(async d=>{ddIncOpen(null);const g=document.getElementById('dlgInc');g.querySelector('#incDate').value=d;g.querySelector('#incDate').dispatchEvent(new Event('change'));
    g.querySelector('#incBeh').value=S.behaviors.find(x=>x.name==='Physical aggression').id;g.querySelector('#incBeh').dispatchEvent(new Event('change'));
    const lab=g.querySelector('#incCountT').textContent;g.querySelector('#incCount').checked=true;g.querySelector('#incWhat').value='Kicked the table leg (simulated).';g.querySelector('#incSave').click();
    const i=S.incidents[S.incidents.length-1];return {lab,id:i.id,counted:i.counted,gsc:!!i.gsc};},date);
  const reread=()=>page.evaluate(async()=>{await gsRead({quiet:true});await gsRead({quiet:true});});
  const i1=await logInc('2026-08-10');const v1=await pa();
  ok('2a an incident counted on a day the sheet writes adds one on top of the sheet’s 6, and the dialog says so',i1.counted&&i1.gsc&&v1==='7'&&/on top of the Google Sheet/.test(i1.lab),{i1,v1});
  await reread();const v2=await pa();
  ok('2b reading the sheet again (twice) keeps it: 7, not 6 and not 8',v2==='7',v2);
  D1[0][1][0]=8;await reread();const v3=await pa();
  ok('2c the sheet’s number changes to 8: the day shows 9',v3==='9',v3);
  const i2=await logInc('2026-08-10');const v4=await pa();await reread();const v5=await pa();
  ok('2d a second incident that day: 10, and still 10 after a reading',v4==='10'&&v5==='10',{v4,v5});
  const row=await page.evaluate(id=>{ddIncRender();const tr=document.querySelector('#ddInc tr[data-inc="'+id+'"]');return tr?tr.innerText:'';},i1.id);
  ok('2e the log says the incident is on the day’s count on top of the sheet’s number',/on top of the sheet/.test(row),row);
  await page.evaluate(async id=>{await ddIncDel(id);},i2.id);const v6=await pa();await reread();const v7=await pa();
  ok('2f deleting one takes exactly one off (9), and readings keep 9',v6==='9'&&v7==='9',{v6,v7});
  const un=await page.evaluate(async id=>{ddIncOpen(id);const g=document.getElementById('dlgInc');g.querySelector('#incCount').checked=false;g.querySelector('#incSave').click();
    const i=S.incidents.find(x=>x.id===id);return {counted:i.counted,gsc:!!i.gsc};},i1.id);const v8=await pa();await reread();const v9=await pa();
  ok('2g no longer counted: the sheet’s 8 again, and readings keep 8',!un.counted&&!un.gsc&&v8==='8'&&v9==='8',{un,v8,v9});
  await page.evaluate(async id=>{ddIncOpen(id);const g=document.getElementById('dlgInc');g.querySelector('#incCount').checked=true;g.querySelector('#incSave').click();},i1.id);
  const v10=await pa();
  const off=await page.evaluate(()=>{const c=document.getElementById('gsUse');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));
    const b=S.behaviors.find(x=>x.name==='Physical aggression'),r=S.rows.find(x=>x.date==='2026-08-10');return r?r.values[b.id]:'(no day)';});
  const on=await page.evaluate(()=>{const c=document.getElementById('gsUse');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    const b=S.behaviors.find(x=>x.name==='Physical aggression');return S.rows.find(x=>x.date==='2026-08-10').values[b.id];});
  ok('2h counted again (9); set aside, the record’s own shows (the sheet made that day, so no day); in use again, 9',v10==='9'&&off==='(no day)'&&on==='9',{v10,off,on});
  /* counted while the sheet is set aside: in the record's own number, and on top of the sheet's */
  const rec=await page.evaluate(async()=>{const c=document.getElementById('gsUse');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));
    const b=S.behaviors.find(x=>x.name==='Physical aggression');const r11=S.rows.find(x=>x.date==='2026-08-11');const o={before:r11?r11.values[b.id]:'(no day)'};return o;});
  const i3=await page.evaluate(async()=>{ddIncOpen(null);const g=document.getElementById('dlgInc');g.querySelector('#incDate').value='2026-08-11';g.querySelector('#incDate').dispatchEvent(new Event('change'));
    g.querySelector('#incBeh').value=S.behaviors.find(x=>x.name==='Physical aggression').id;g.querySelector('#incBeh').dispatchEvent(new Event('change'));g.querySelector('#incCount').checked=true;g.querySelector('#incSave').click();
    const b=S.behaviors.find(x=>x.name==='Physical aggression'),i=S.incidents[S.incidents.length-1];const own=S.rows.find(x=>x.date==='2026-08-11').values[b.id];
    const c=document.getElementById('gsUse');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,500));
    const r=S.rows.find(x=>x.date==='2026-08-11');return {id:i.id,gsc:!!i.gsc,own,on:r.values[b.id],kept:S.gs.applied[r.id+'|'+b.id]};});
  ok('2i counted while the sheet is set aside: the record’s own day has 1; with the sheet in use, 5 + 1 = 6 (the record’s 1 kept aside)',rec.before==='(no day)'&&!i3.gsc&&i3.own==='1'&&i3.on==='6'&&i3.kept==='1',{rec,i3});
  const d3=await page.evaluate(async id=>{await ddIncDel(id);const b=S.behaviors.find(x=>x.name==='Physical aggression'),r=S.rows.find(x=>x.date==='2026-08-11');const o={on:r.values[b.id],kept:S.gs.applied[r.id+'|'+b.id]};
    await gsRead({quiet:true});o.after=S.rows.find(x=>x.date==='2026-08-11').values[b.id];return o;},i3.id);
  ok('2j deleting it takes one off the day (5) and off the record’s own number kept aside (0); a reading keeps 5',d3.on==='5'&&d3.kept==='0'&&d3.after==='5',d3);
  /* the data file keeps the mark */
  const fl=await page.evaluate(async id=>{const txt=JSON.stringify(S);await new Promise(res=>{openFile(new File([txt],'d.json',{type:'application/json'}));setTimeout(res,800);});
    const i=S.incidents.find(x=>x.id===id);await gsRead({quiet:true});const b=S.behaviors.find(x=>x.name==='Physical aggression');return {gsc:!!(i&&i.gsc),counted:!!(i&&i.counted),v:S.rows.find(x=>x.date==='2026-08-10').values[b.id]};},i1.id);
  ok('2k the data file keeps which incident rides on the sheet’s number; after opening it and a reading, still 9',fl.gsc&&fl.counted&&fl.v==='9',fl);
  /* unlink */
  const ul=await page.evaluate(async id=>{let t='';const tw=window.toast;window.toast=m=>{t=m;try{tw(m);}catch(e){}};await gsUnlinkGo();window.toast=tw;
    const i=S.incidents.find(x=>x.id===id),b=S.behaviors.find(x=>x.name==='Physical aggression');const r10=S.rows.find(x=>x.date==='2026-08-10'),r11=S.rows.find(x=>x.date==='2026-08-11');
    return {gs:S.gs,counted:i.counted,gsc:!!i.gsc,r10:r10?r10.values[b.id]:'(no day)',r11:r11?r11.values[b.id]:'(no day)',t,
      row:(()=>{ddIncRender();const tr=document.querySelector('#ddInc tr[data-inc="'+id+'"]');return tr?tr.innerText:'';})()};},i1.id);
  ok('2l unlinked: the record’s own numbers only (no 8/10 day; 8/11 holds the record’s 0), and the incident that rode on the sheet is no longer counted, said in plain words',
    ul.gs===null&&!ul.counted&&!ul.gsc&&ul.r10==='(no day)'&&ul.r11==='0'&&/no longer on a day’s count/.test(ul.t)&&!/On the day/.test(ul.row),ul);
  const del=await page.evaluate(async id=>{const n=S.rows.map(r=>JSON.stringify(r.values)).join();await ddIncDel(id);return S.rows.map(r=>JSON.stringify(r.values)).join()===n;},i1.id);
  ok('2m deleting it after the unlink changes no number',del,del);
  const errs=log.filter(l=>l.type==='pageerror');
  ok('2n no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
