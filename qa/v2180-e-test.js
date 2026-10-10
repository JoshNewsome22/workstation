/* v21.80 helper E: Form DD-1.
   1. window.__nbhGsRefresh, the caseload's refresh, with Google's sign-in and the Sheets API simulated as in
      qa/v2176-test.js (no network): linked and signed in it reads, the new day arrives and a snapshot holds it
      ({linked,on,signin:false,ok:true,days,to}); not signed in (or the sign-in expired) it says signin:true and opens no
      Google window and asks Google nothing; not linked: linked:false; a 401 from Google: signin:true; __nbhGsInfo.
      A label on a day the sheet made stays through a reading.
   2. Assent, setting, collected by and probe on each day: picked in the daily table and the day's details; kept through
      Save data and open; an old file without them opens unchanged; the CSV's four columns (none without labels); the
      facts (assent, bySetting, probes, byDay); the analysis numbers unchanged; the By setting table; the probe marks on
      the graphs; the assent column on paper only when a day has one; phone and iPad widths without sideways scroll.
   No page errors. Simulated students only.
   usage: node qa/v2180-e-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
const ID='1SIMULATEDsheetIDforTESTSabcdefghijklmnop';
/* a simulated sheet in the Behavior-Charts template's shape (as qa/v2176-test.js) */
function tab(defs,days,student){const cols=[];defs.forEach(d=>{if(d.two)cols.push(d,{cont:1},{cont:2});else cols.push(d);});
  const Wd=1+cols.length,row=()=>new Array(Wd).fill('');const R=[];for(let i=0;i<18;i++)R.push(row());
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
let D1=[['8/10/2026',[6,1,[1,2]]],['8/11/2026',[5,0,[2,2]]],['8/12/2026',[1,2,[1,2]]],['8/13/2026',[0,null,[1,1]]]];
(async()=>{const br=await chromium.launch();const log=[];
  /* ================= 1. the refresh hook ================= */
  const page=await br.newPage({viewport:{width:1300,height:950}});wire(page,log);let popups=0;page.on('popup',()=>popups++);
  let calls=[],status=200;
  await page.addInitScript(()=>{window.__gsAsk=0;window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;setTimeout(()=>cfg.callback({access_token:'simulated-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await page.route('https://sheets.googleapis.com/**',route=>{const u=decodeURIComponent(route.request().url());calls.push(u);
    if(status!==200)return route.fulfill({status,body:'{}',contentType:'application/json'});
    if(/values:batchGet/.test(u)){const tabs=[...u.matchAll(/ranges='([^']+)'!/g)].map(m=>m[1]);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({valueRanges:tabs.map(t=>({range:t,values:t==='Data TBx'?tab(T1,D1,STU):[['ABC'],['Date','A','B']]}))})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify({properties:{title:'SIMULATED Behavior Data Collection'},sheets:[{properties:{title:'Data TBx'}},{properties:{title:'ABC Checklist'}}]})});});
  await page.goto(W,{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}S.meta.client='Mateo Rivera';document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));renderAll();});
  const h0=await page.evaluate(async()=>({r:await window.__nbhGsRefresh(),i:window.__nbhGsInfo()}));
  ok('1a not linked: linked:false, nothing read',h0.r&&h0.r.linked===false&&h0.r.ok===false&&h0.r.signin===false&&h0.r.days===0&&h0.r.err===''&&h0.i.linked===false&&calls.length===0,h0);
  await page.evaluate(id=>{document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gsFind').click();},ID);
  await sleep(1000);await page.evaluate(()=>document.getElementById('gsGo').click());await sleep(600);
  const linked=await page.evaluate(()=>({rows:S.rows.map(r=>r.date).join(),ask:window.__gsAsk,info:window.__nbhGsInfo()}));
  ok('1b linked through the form\'s own dialog (one simulated sign-in); __nbhGsInfo says so',linked.rows==='2026-08-10,2026-08-11,2026-08-12,2026-08-13'&&linked.ask===1&&linked.info.linked&&linked.info.on&&linked.info.id===ID&&linked.info.title==='SIMULATED Behavior Data Collection',linked);
  /* a label on a day the sheet made */
  await page.evaluate(()=>{const r=S.rows.find(x=>x.date==='2026-08-12');r.assent='refused';r.setting='Lunch';});
  D1=D1.concat([['8/14/2026',[2,0,[2,3]]]]);calls=[];
  const h1=await page.evaluate(async()=>{const r=await window.__nbhGsRefresh();const own=await window.nbhBridge.ownSave();
    const d12=S.rows.find(x=>x.date==='2026-08-12'),pa=S.behaviors.find(b=>b.name==='Physical aggression');
    return {r,own:!!own&&own.indexOf('"2026-08-14"')>=0,rows:S.rows.map(x=>x.date).sort().join(),d12:{as:d12&&d12.assent,set:d12&&d12.setting,v:d12&&d12.values[pa.id]},made:S.gs.madeRows.length};});
  ok('1c linked and signed in: it reads, ok with the sheet\'s days and the last date with data',h1.r.linked&&h1.r.on&&h1.r.ok&&!h1.r.signin&&h1.r.days===5&&h1.r.to==='2026-08-14'&&h1.r.err===''&&calls.some(u=>/values:batchGet/.test(u)),h1.r);
  ok('1d the record took the new day exactly as its own reading does, and a snapshot (Save data) holds it',h1.rows==='2026-08-10,2026-08-11,2026-08-12,2026-08-13,2026-08-14'&&h1.own,h1);
  ok('1e a label on a day the sheet made stays through the reading; the sheet still owns the day',h1.d12.as==='refused'&&h1.d12.set==='Lunch'&&h1.d12.v==='1'&&h1.made===5,h1);
  /* not signed in: no token in the tab */
  calls=[];const ask0=await page.evaluate(()=>window.__gsAsk);
  const h2=await page.evaluate(async()=>{sessionStorage.removeItem('nbh.google.tok');gsTok=null;gsExp=0;const r=await window.__nbhGsRefresh();return {r,ask:window.__gsAsk,bar:document.getElementById('gsBar').innerText};});
  ok('1f not signed in: signin:true, no Google window, nothing asked of Google',h2.r.linked&&h2.r.on&&h2.r.signin===true&&h2.r.ok===false&&h2.ask===ask0&&popups===0&&calls.length===0&&h2.r.to==='2026-08-14',{h2,popups,calls});
  ok('1g the bar offers the sign-in on the form itself',/Signed out of Google/.test(h2.bar),h2.bar);
  const h3=await page.evaluate(async()=>{sessionStorage.setItem('nbh.google.tok',JSON.stringify({tok:'old',exp:Date.now()-5000}));const r=await window.__nbhGsRefresh();return {r,ask:window.__gsAsk};});
  ok('1h an expired sign-in: signin:true, no window',h3.r.signin===true&&!h3.r.ok&&h3.ask===ask0&&calls.length===0,h3);
  /* Google says 401 for a token the tab thought good */
  status=401;
  const h4=await page.evaluate(async()=>{sessionStorage.setItem('nbh.google.tok',JSON.stringify({tok:'simulated-token',exp:Date.now()+3e6}));const r=await window.__nbhGsRefresh();return {r,ask:window.__gsAsk,rows:S.rows.length};});
  ok('1i Google signs the tab out (401): signin:true, the record kept as last read',h4.r.signin===true&&!h4.r.ok&&h4.ask===ask0&&h4.rows===5,h4);
  status=200;
  const h5=await page.evaluate(async()=>{S.gs.on=false;renderAll();const r=await window.__nbhGsRefresh();S.gs.on=true;renderAll();return r;});
  ok('1j "Use the sheet\'s data" off: linked, not on, not read, said plainly',h5.linked&&!h5.on&&!h5.ok&&!h5.signin&&/set aside/.test(h5.err),h5);
  await page.close();

  /* ================= 2. the day's labels ================= */
  const dd=await br.newPage({viewport:{width:1300,height:950}});wire(dd,log);
  await dd.goto(W,{waitUntil:'load'});await sleep(1200);
  await dd.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}document.querySelector('#btnLoadExample').click();});await sleep(800);
  await dd.evaluate(()=>{S.meta.client='SIMULATED – Sample Student';document.querySelector('[data-tab="data"]').click();});await sleep(200);
  const base=await dd.evaluate(()=>({facts:JSON.stringify(window.__nbhFactsOut()),csv:(()=>{let t='';const d=download;download=(n,c)=>{t=c;};try{exportCsv();}finally{download=d;}return t;})(),
    days:sortedRows().map(r=>r.date),noTags:S.rows.every(r=>!('assent' in r)&&!('setting' in r)&&!('by' in r)&&!('probe' in r)),
    col:!!document.querySelector('#dataCols col.c-day'),cells:document.querySelectorAll('#dataTable tbody td.col-day select.dd-as').length,rows:document.querySelectorAll('#dataTable tbody tr[data-r]').length}));
  const F0=JSON.parse(base.facts).data;
  ok('2a the daily table has an Assent select and a day-details button on every day; no labels yet',base.col&&base.cells===base.rows&&base.rows===20&&base.noTags,base);
  ok('2b no labels: no new facts and the CSV has no label columns',!('assent' in F0)&&!('bySetting' in F0)&&!('probes' in F0)&&!/"Assent"/.test(base.csv.split('\n')[0]),Object.keys(F0));
  /* assent in the row, through the select (16px) */
  const sel='#dataTable tbody tr[data-r]:nth-child(2) select.dd-as';
  await dd.selectOption(sel,'refused');await sleep(100);
  const a1=await dd.evaluate(s=>{const e=document.querySelector(s),r=S.rows.find(x=>x.id===e.closest('tr').dataset.r);return {v:r.assent,fs:getComputedStyle(e).fontSize,date:r.date};},sel);
  ok('2c the Assent select in the row writes the day (16px text)',a1.v==='refused'&&a1.fs==='16px',a1);
  await dd.selectOption(sel,'');await sleep(80);
  ok('2d set back to blank, the day has no assent field again',await dd.evaluate(d=>!('assent' in S.rows.find(r=>r.date===d)),a1.date));
  /* the day's details */
  await dd.click('#dataTable tbody tr[data-r]:nth-child(3) .dd-tagbtn');await sleep(150);
  const dlgOpen=await dd.evaluate(()=>{const d=document.getElementById('dlgDayTags');return !!d&&d.open&&document.getElementById('ddSetList').options.length>=5;});
  ok('2e the day-details dialog opens with the setting list',dlgOpen);
  await dd.fill('#dtSet','Specials');await dd.fill('#dtBy','Ms. Simulated Aide');await dd.selectOption('#dtPr','gen');await dd.selectOption('#dtAs','withdrew');
  await dd.click('#dtNext');await sleep(80);await dd.fill('#dtSet','Classroom');await dd.click('#dtDone');await sleep(300);
  const d2=await dd.evaluate(D=>{const r=S.rows.find(x=>x.date===D[2]),n=S.rows.find(x=>x.date===D[3]);const tr=document.querySelector('#dataTable tr[data-r="'+r.id+'"]');
    return {r:{a:r.assent,s:r.setting,b:r.by,p:r.probe},n:n.setting,btn:tr.querySelector('.dd-tagbtn').textContent,sel:tr.querySelector('select.dd-as').value};},base.days);
  ok('2f the details are kept on the day (setting, by, probe, assent) and Next day moves on',d2.r.a==='withdrew'&&d2.r.s==='Specials'&&d2.r.b==='Ms. Simulated Aide'&&d2.r.p==='gen'&&d2.n==='Classroom'&&/Specials/.test(d2.btn)&&d2.sel==='withdrew',d2);
  /* a fuller set of labels */
  await dd.evaluate(D=>{const set=(i,o)=>Object.assign(S.rows.find(r=>r.date===D[i]),o);
    for(let i=0;i<20;i++){const r=S.rows.find(x=>x.date===D[i]);if(i>=4)r.setting=i<12?'Classroom':i<16?'Lunch':'specials ';}
    set(0,{assent:'agreed',setting:'Bus'});set(12,{assent:'refused'});set(15,{assent:'agreed'});set(17,{assent:'withdrew',probe:'maint'});set(18,{assent:'agreed',probe:'gen'});set(19,{assent:'refused'});
    renderAll();},base.days);
  await sleep(200);
  const F1=await dd.evaluate(()=>window.__nbhFactsOut().data);
  const exp=await dd.evaluate(D=>{const B=orderedBehaviors(),R=sortedRows();const G={};R.forEach(r=>{const s=(r.setting||'').trim();if(!s)return;const k=s.toLowerCase();(G[k]=G[k]||{s,rows:[]}).rows.push(r);});
    const pa=B[0];const mean=rows=>{const v=rows.map(r=>plotValue(r,pa)).filter(x=>x!==null);return v.length?Math.round(v.reduce((a,c)=>a+c,0)/v.length*100)/100:null;};
    return {class:mean(G.classroom.rows),classN:G.classroom.rows.length,spec:mean(G.specials.rows),specN:G.specials.rows.length,pa:pa.name,names:B.map(b=>b.name),
      byDay:R.filter(r=>B.some(b=>plotValue(r,b)!==null)).slice(-30).map(r=>({date:r.date,vals:Object.fromEntries(B.map(b=>{const v=plotValue(r,b);return [b.name,v===null?null:Math.round(v*100)/100];}))}))};},base.days);
  const strip=d=>JSON.stringify(Object.assign({},d,{assent:0,bySetting:0,probes:0,byDay:0}));
  ok('2g the analysis numbers do not change with the labels (every other fact the same)',strip(F1)===strip(F0),{a:strip(F0).slice(0,200),b:strip(F1).slice(0,200)});
  const A=F1.assent;
  ok('2h facts: assent {days, refused, withdrew, last10, list}',A&&A.days===7&&A.refused===2&&A.withdrew===2&&A.last10.days===5&&A.last10.refused===2&&A.last10.withdrew===1&&A.list.length===7&&A.list[0].date===base.days[0]&&A.list[0].mark==='agreed'&&A.list[6].mark==='refused'&&A.list.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)),A);
  const BS=F1.bySetting||[],cl=BS.find(x=>x.setting==='Classroom'),sp=BS.find(x=>x.setting.toLowerCase()==='specials');
  ok('2i facts: bySetting [{setting, days, behaviors:[{name, mean}]}], "Specials" and "specials " one setting',BS.length===4&&cl&&cl.days===exp.classN&&cl.behaviors.length===exp.names.length&&cl.behaviors[0].name===exp.pa&&cl.behaviors[0].mean===exp.class&&sp&&sp.days===exp.specN&&sp.behaviors[0].mean===exp.spec,{BS:BS.map(x=>[x.setting,x.days,x.behaviors[0]]),exp});
  ok('2j facts: probes [{date, kind, setting}]',JSON.stringify(F1.probes)===JSON.stringify([{date:base.days[2],kind:'gen',setting:'Specials'},{date:base.days[17],kind:'maint',setting:'specials'},{date:base.days[18],kind:'gen',setting:'specials'}]),F1.probes);
  ok('2k facts: byDay, the last 30 days with data, oldest first, each behavior\'s plotted value',Array.isArray(F1.byDay)&&F1.byDay.length===20&&JSON.stringify(F1.byDay)===JSON.stringify(exp.byDay)&&F1.byDay[0].date<F1.byDay[19].date,F1.byDay&&F1.byDay.slice(0,2));
  /* Graphs & analysis */
  await dd.evaluate(()=>{document.querySelector('[data-tab="results"]').click();renderResults();});await sleep(400);
  const g=await dd.evaluate(()=>{const t=document.getElementById('ddBySet');const rows=t?[...t.querySelectorAll('tbody tr')].map(tr=>({s:tr.dataset.setting,days:+tr.cells[1].textContent,m:tr.cells[2].dataset.mean})):[];
    const sv=document.querySelector('#resultsOut .chartbox svg');return {rows,before:!!t&&t.nextElementSibling&&t.nextElementSibling.id==='ddSources',probes:sv?[...sv.querySelectorAll('g.dd-probe')].map(x=>x.dataset.probe+x.textContent.slice(0,1)).join():'',legend:document.querySelector('#resultsOut .legend').textContent};});
  const gc=g.rows.find(r=>r.s==='Classroom');
  ok('2l the By setting table: a row per setting, its days, each behavior\'s mean (as the facts)',g.rows.length===4&&g.before&&gc&&gc.days===exp.classN&&+gc.m===exp.class,g);
  ok('2m the probe days are marked on the graphs (G, M, G) and in the legend',g.probes==='genG,maintM,genG'&&/Generalization probe/.test(g.legend)&&/Maintenance probe/.test(g.legend),g);
  /* the CSV */
  const csv=await dd.evaluate(async()=>{let t='';const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(x=>{t=x;});return o(b);};try{document.getElementById('btnCsv').click();}finally{URL.createObjectURL=o;}await new Promise(r=>setTimeout(r,200));return t;});
  const L=csv.split('\n');const hd=L[0];const r3=L.find(l=>l.indexOf('"'+base.days[2]+'"')===0)||'';
  ok('2n the CSV: Assent, Setting, Collected by, Probe at the end; the day\'s labels in its row; the rest of the file as before',/"Assent","Setting","Collected by","Probe"$/.test(hd)&&/"Withdrew","Specials","Ms\. Simulated Aide","Generalization"$/.test(r3)&&L.length===base.csv.split('\n').length&&hd.indexOf(base.csv.split('\n')[0])===0,{hd,r3});
  /* Save data and open; an old file */
  const rt=await dd.evaluate(async()=>{let saved='';const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('btnSave').click();URL.createObjectURL=o;
    await new Promise(r=>setTimeout(r,300));const before=JSON.stringify(S.rows);
    S=blankState();renderAll();await new Promise(res=>{openFile(new File([saved],'d.json',{type:'application/json'}));setTimeout(res,600);});
    const after=JSON.stringify(S.rows);
    const old=JSON.parse(saved);old.rows.forEach(r=>{delete r.assent;delete r.setting;delete r.by;delete r.probe;});const oldTxt=JSON.stringify(old.rows);
    await new Promise(res=>{openFile(new File([JSON.stringify(old)],'o.json',{type:'application/json'}));setTimeout(res,600);});
    const oldAfter=JSON.stringify(S.rows),cells=document.querySelectorAll('#dataTable tbody td.col-day').length;
    /* a hand-edited file: a value that is not one of the choices is set aside */
    const bad=JSON.parse(saved);bad.rows[0].assent='maybe';bad.rows[0].probe='x';bad.rows[0].setting='  Bus   stop ';
    await new Promise(res=>{openFile(new File([JSON.stringify(bad)],'b.json',{type:'application/json'}));setTimeout(res,600);});
    return {has:/"assent": "withdrew"/.test(saved)&&/"setting": "Specials"/.test(saved)&&/"by": "Ms. Simulated Aide"/.test(saved)&&/"probe": "maint"/.test(saved),same:before===after,oldSame:oldTxt===oldAfter,cells,
      bad:{a:'assent' in S.rows[0],p:'probe' in S.rows[0],s:S.rows[0].setting}};});
  ok('2o Save data keeps the labels and opening the file gives the same days back',rt.has&&rt.same,rt);
  ok('2p an old file without the labels opens unchanged',rt.oldSame&&rt.cells===20,rt);
  ok('2q a hand-edited file: a value not among the choices is set aside, a setting is tidied',!rt.bad.a&&!rt.bad.p&&rt.bad.s==='Bus stop',rt.bad);
  /* paper: the assent column only when a day has one */
  await dd.evaluate(()=>document.querySelector('[data-tab="data"]').click());await sleep(150);
  await dd.emulateMedia({media:'print'});
  const p0=await dd.evaluate(()=>{S.rows.forEach(r=>{delete r.assent;});renderData();applyColW(true);const th=document.querySelector('#dataTable th.col-day');return getComputedStyle(th).display;});
  await dd.evaluate(()=>{S.rows[3].assent='agreed';renderData();applyColW(true);});
  const p1=await dd.evaluate(()=>{const th=document.querySelector('#dataTable th.col-day'),td=document.querySelector('#dataTable tr[data-r="'+S.rows[3].id+'"] td.col-day');
    return {th:getComputedStyle(th).display,po:td.querySelector('.po').textContent,poD:getComputedStyle(td.querySelector('.po')).display,sel:getComputedStyle(td.querySelector('.dd-day-w')).display};});
  ok('2r on paper: no assent column when no day has one; a narrow column with the word when one does',p0==='none'&&p1.th==='table-cell'&&p1.po==='Agreed'&&p1.poD==='block'&&p1.sel==='none',{p0,p1});
  await dd.emulateMedia({media:'screen'});await dd.evaluate(()=>applyColW(false));
  /* widths: phone and iPad */
  for(const [w,h] of [[390,844],[820,1180]]){await dd.setViewportSize({width:w,height:h});await sleep(250);
    const m=await dd.evaluate(async()=>{const o={};for(const t of ['data','results']){document.querySelector('[data-tab="'+t+'"]').click();await new Promise(r=>setTimeout(r,200));o[t]=document.documentElement.scrollWidth-innerWidth;}
      document.querySelector('[data-tab="data"]').click();await new Promise(r=>setTimeout(r,150));document.querySelector('#dataTable .dd-tagbtn').click();await new Promise(r=>setTimeout(r,150));
      const d=document.getElementById('dlgDayTags').getBoundingClientRect();o.dlg=d.right<=innerWidth+1&&d.left>=-1;o.page=document.documentElement.scrollWidth-innerWidth;document.getElementById('dtDone').click();return o;});
    ok(`2s ${w}px wide: no sideways page scroll on the data and graph tabs, the day dialog fits`,m.data<=0&&m.results<=0&&m.dlg&&m.page<=0,m);}
  const errs=log.filter(l=>l.type==='pageerror');
  ok('3 no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
