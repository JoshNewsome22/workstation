/* v21.78 helper D1: Form DD-1's incidents carry a physical intervention (hold) and a stable id to the case, with the
   Form CR-1 notice for a restraint or a seclusion; DD-1's plain-words note for home from the week; Form HD-1's home data
   for the case (sheets with Sent home / Due back / Came back, the day totals); DD-1 bringing the home days in once, as
   a series of their own on the graphs, apart from the school days. Simulated students only. No page errors.
   usage: node qa/v2178-d1-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const CR1='Form CR-1 starts the Florida notice clock for this (24-hour report, parent the same day, written report within 3 school days): open Form CR-1 in the workstation.';
(async()=>{
  const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900}});
  /* ---------------- Form HD-1 ---------------- */
  const hd=await ctx.newPage();wire(hd,log);
  await hd.goto(W+'HD-1_Home-Data-Sheets_v2026-10.html',{waitUntil:'load'});await sleep(600);
  await hd.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  ok('HD-1: a blank form gives nothing to the case',await hd.evaluate(()=>window.__nbhFactsOut()===null));
  await hd.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  const H=await hd.evaluate(()=>window.__nbhFactsOut());
  ok('HD-1: home.sheets, one per sheet sent each week, with the dates',H&&H.home&&H.home.sheets.length===12&&H.home.sheets.every(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.sent)&&/^\d{4}-\d{2}-\d{2}$/.test(s.due)&&s.name&&s.week),H&&H.home&&H.home.sheets.slice(0,3));
  ok('HD-1: a sheet that did not come back has no back date',H.home.sheets.filter(s=>s.kind==='check'&&!s.returned).length===1&&H.home.sheets.filter(s=>s.kind==='check'&&!s.returned)[0].back===undefined&&H.home.sheets.filter(s=>s.kind==='tally').every(s=>s.returned&&s.back));
  const hit=H.home.data.filter(r=>r.beh==='Hitting');
  ok('HD-1: home.data has every day total, dated from the Monday (21 days of hitting)',hit.length===21&&hit.every(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&typeof r.value==='number'&&r.unit==='times'),hit.slice(0,3));
  const first=await hd.evaluate(()=>{const w=S.wk[0];return {mon:nbhHdIso(nbhHdMon(w.start)),v:dayTotal(w,0,0).v};});
  ok('HD-1: the first Monday\'s hitting total is the grid\'s',hit[0].date===first.mon&&hit[0].value===first.v,{hit0:hit[0],first});
  ok('HD-1: minutes and ratings carry their units',H.home.data.some(r=>/^Tantrum/.test(r.beh)&&r.unit==='minutes')&&H.home.data.some(r=>/^Fussing/.test(r.beh)&&r.unit==='rating 0 to 3'));
  /* the date fields on the entry page: typed, kept, saved and read back */
  await hd.click('#viewSeg button[data-view="entry"]');await sleep(150);
  await hd.fill('[data-w="sent"]','2026-10-02');await sleep(80);
  ok('HD-1: the Sent home field writes the week',await hd.evaluate(()=>S.wk[curWk].sent)==='2026-10-02');
  await hd.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};document.querySelector('#saveBtn').click();});await sleep(300);
  const before=await hd.evaluate(()=>JSON.stringify(S));
  await hd.evaluate(async()=>{const t=window.__saved;S=blank();renderAll();const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  ok('HD-1: the dates survive a save and open',await hd.evaluate(()=>JSON.stringify(S))===before&&await hd.evaluate(()=>S.wk[0].sent)==='2026-10-02');
  await hd.fill('[data-w="sent"]','');
  const HOME=(await hd.evaluate(()=>window.__nbhFactsOut())).home;

  /* ---------------- Form DD-1 ---------------- */
  const dd=await ctx.newPage();wire(dd,log);
  await dd.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await dd.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  await dd.evaluate(()=>document.querySelector('#btnLoadExample').click());await sleep(700);
  await dd.evaluate(()=>{document.querySelector('[data-tab="data"],[data-panel-btn="data"]')&&document.querySelector('[data-tab="data"],[data-panel-btn="data"]').click();});
  const days=await dd.evaluate(()=>sortedRows().map(r=>r.date));
  /* (1) a restraint logged */
  await dd.evaluate(d=>{ddIncOpen(null);const g=document.getElementById('dlgInc');g.querySelector('#incDate').value=d;g.querySelector('#incWhat').value='Simulated: hit the aide twice during math';g.querySelector('#incHold').value='restraint';},days[days.length-2]);
  ok('DD-1: the incident dialog offers the four physical interventions',await dd.evaluate(()=>[...document.querySelectorAll('#incHold option')].map(o=>o.value).join(','))===',escort,restraint,seclusion');
  await dd.evaluate(()=>document.querySelector('#incSave').click());await sleep(250);
  const inc1=await dd.evaluate(()=>S.incidents[S.incidents.length-1]);
  ok('DD-1: the hold is saved with an id',inc1.hold==='restraint'&&typeof inc1.id==='string'&&inc1.id.length>2,inc1);
  ok('DD-1: the Form CR-1 notice shows',(await dd.evaluate(()=>{const e=document.getElementById('ddHoldNote');return e?e.textContent:'';})).indexOf(CR1)>=0);
  ok('DD-1: the incident list shows the hold',await dd.evaluate(id=>{const r=document.querySelector('#ddInc tr[data-inc="'+id+'"]');return !!r&&/Restraint/.test(r.textContent);},inc1.id));
  /* an escort: no new notice; the dialog opened again shows the saved hold; edited to a seclusion */
  await dd.evaluate(()=>document.getElementById('ddHoldOk').click());
  await dd.evaluate(d=>{ddIncOpen(null);const g=document.getElementById('dlgInc');g.querySelector('#incDate').value=d;g.querySelector('#incHold').value='escort';g.querySelector('#incSave').click();},days[days.length-1]);await sleep(200);
  ok('DD-1: an escort is kept and gives no CR-1 notice',await dd.evaluate(()=>S.incidents[S.incidents.length-1].hold==='escort'&&!document.getElementById('ddHoldNote')));
  ok('DD-1: Edit shows the saved hold',await dd.evaluate(id=>{ddIncOpen(id);const v=document.querySelector('#incHold').value;document.getElementById('dlgInc').close();return v;},inc1.id)==='restraint');
  await dd.evaluate(id=>{ddIncOpen(id);document.querySelector('#incHold').value='seclusion';document.querySelector('#incSave').click();},inc1.id);await sleep(200);
  ok('DD-1: edited to a seclusion, same id, notice again',await dd.evaluate(id=>{const i=S.incidents.find(x=>x.id===id);return !!i&&i.hold==='seclusion'&&S.incidents.length===2&&/Seclusion/.test(document.getElementById('ddHoldNote').textContent);},inc1.id));
  const out=await dd.evaluate(()=>window.__nbhFactsOut());
  ok('DD-1: incidentList items carry id and hold',out.data.incidentList.length===2&&out.data.incidentList.every(x=>x.id&&'hold' in x)&&out.data.incidentList.some(x=>x.id===inc1.id&&x.hold==='seclusion')&&out.data.incidentList.some(x=>x.hold==='escort'),out.data.incidentList);
  /* a file round trip; an older file's incidents without ids get one, kept from then on */
  const rt=await dd.evaluate(async()=>{const t=JSON.stringify(S);const o=JSON.parse(t);o.incidents.push({date:o.rows[3].date,what:'Simulated older entry',hold:'tackle'});
    await new Promise(res=>{const was=window.toast;openFile(new File([JSON.stringify(o)],'x.json'));setTimeout(res,400);});
    const a=S.incidents.map(i=>i.id+':'+i.hold).join(',');renderAll();const b=S.incidents.map(i=>i.id+':'+i.hold).join(',');return {a,b,n:S.incidents.length,older:S.incidents.find(i=>i.what==='Simulated older entry')};});
  ok('DD-1: holds survive a file; an id is given once and kept; an unknown hold is none',rt.n===3&&rt.a===rt.b&&rt.older&&rt.older.id&&rt.older.hold===''&&/seclusion/.test(rt.a)&&/escort/.test(rt.a),rt);
  /* the print of the list shows the hold */
  ok('DD-1: the hold prints with the list (the row is not hidden on paper)',await dd.evaluate(()=>{const b=document.querySelector('#ddInc .inc-hold-t');return !!b&&!b.closest('.noprint,.no-print');}));

  /* (2) the note for home */
  ok('DD-1: the Note for home (this week) button sits by the Week summary',await dd.evaluate(()=>{const b=document.getElementById('btnHomeNote');return !!b&&b.previousElementSibling&&b.previousElementSibling.id==='btnWeekSum';}));
  await dd.evaluate(()=>document.getElementById('btnHomeNote').click());await sleep(200);
  const note=await dd.evaluate(()=>{const d=document.getElementById('dlgHomeNote');return {open:d.open,t:d.querySelector('#hnTx').value};});
  console.log('---- the note ----\n'+note.t+'\n------------------');
  ok('DD-1: the note opens, editable, good thing first, each behavior, what is next',note.open&&/^Hello,\n\nHere is a short note/.test(note.t)&&note.t.indexOf('Something good first:')>0&&note.t.indexOf('Something good first:')<note.t.indexOf('How things are going:')&&note.t.indexOf('What we are working on next:')>note.t.indexOf('How things are going:'),note.t);
  ok('DD-1: every behavior has its line',await dd.evaluate(t=>orderedBehaviors().every(b=>t.indexOf('- '+ddPlainName(b)+':')>=0),note.t));
  ok('DD-1: the note has no technical terms',!/reinforce|extinction|baseline|\bmand|antecedent|contingen|function|operational|replacement|reduction target|acquisition|criterion|\bphase\b|condition|prompt level|interval/i.test(note.t),note.t.match(/reinforce|extinction|baseline|\bmand|antecedent|contingen|function|operational|replacement|reduction target|acquisition|criterion|\bphase\b|condition|prompt level|interval/ig));
  ok('DD-1: the incidents only as a count, none of their detail',note.t.indexOf('Simulated: hit the aide')<0&&!/seclusion|restraint|escort/i.test(note.t)&&/We wrote [0-9]+ incident note/.test(note.t),note.t);
  await dd.evaluate(()=>{document.getElementById('hnTx').value+='\n\nA line the teacher added.';window.__printed=0;window.print=()=>{window.__printed++;};document.getElementById('hnPrint').click();});await sleep(150);
  ok('DD-1: Print prints the note as edited, alone',await dd.evaluate(()=>window.__printed===1&&document.body.classList.contains('dd-hn-on')&&/A line the teacher added/.test(document.getElementById('ddHnPrint').textContent)&&!document.getElementById('dlgHomeNote').open));
  await dd.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  ok('DD-1: after printing the page is itself again',await dd.evaluate(()=>!document.body.classList.contains('dd-hn-on')));
  await dd.evaluate(()=>{ddWeekOn();});await sleep(150);
  ok('DD-1: the week summary has the button too',await dd.evaluate(()=>{const b=document.getElementById('ddWeekHome');if(!b)return false;b.click();const d=document.getElementById('dlgHomeNote');const r=d.open&&d.dataset.mon===ddWeek;d.close();ddWeekOff();return r;}));

  /* (4) the home days from HD-1 */
  const school=await dd.evaluate(()=>JSON.stringify(S.rows));
  const fin=await dd.evaluate(h=>{const r=window.__nbhFactsIn({home:h});const b=document.getElementById('ddHomeBar');return {r,bar:b?b.textContent.replace(/\s+/g,' '):''};},HOME);
  const nDays=new Set(HOME.data.map(x=>x.date)).size;
  ok('DD-1: the case offers the home days ("Bring in N home days from Form HD-1")',fin.bar.indexOf('Bring in '+nDays+' home days from Form HD-1')>=0,fin);
  ok('DD-1: nothing changes before the offer is taken',await dd.evaluate(()=>!S.home)&&await dd.evaluate(()=>JSON.stringify(S.rows))===school);
  await dd.evaluate(()=>document.getElementById('ddHomeIn').click());await sleep(300);
  const hm=await dd.evaluate(()=>({n:S.home&&S.home.rows.length,bar:!!document.getElementById('ddHomeBar')}));
  ok('DD-1: brought in as a home record of their own; the school days unchanged',hm.n===HOME.data.length&&!hm.bar&&await dd.evaluate(()=>JSON.stringify(S.rows))===school,hm);
  await dd.evaluate(h=>window.__nbhFactsIn({home:h}),HOME);await sleep(100);
  ok('DD-1: a second reading of the case brings nothing twice',await dd.evaluate(()=>S.home.rows.length)===HOME.data.length&&!(await dd.evaluate(()=>!!document.getElementById('ddHomeBar')))&&await dd.evaluate(()=>ddHomeImport())===0);
  /* a value the family's sheet changed is offered again and replaces the old one, still once */
  const H2=JSON.parse(JSON.stringify(HOME));H2.data[0].value+=1;
  await dd.evaluate(h=>window.__nbhFactsIn({home:h}),H2);
  ok('DD-1: a changed home value is offered as one day',(await dd.evaluate(()=>{const b=document.getElementById('ddHomeBar');return b?b.textContent:'';})).indexOf('Bring in 1 home day from Form HD-1')>=0);
  await dd.evaluate(()=>document.getElementById('ddHomeIn').click());await sleep(200);
  ok('DD-1: and replaces it, not added',await dd.evaluate(()=>S.home.rows.length)===HOME.data.length&&await dd.evaluate(h=>S.home.rows.find(x=>x.date===h.date&&x.beh===h.beh).value,H2.data[0])===H2.data[0].value);
  const o2=await dd.evaluate(()=>window.__nbhFactsOut());
  ok('DD-1: data.home in the facts out',Array.isArray(o2.data.home)&&o2.data.home.length===HOME.data.length&&o2.data.home.every(x=>x.date&&x.beh&&typeof x.value==='number'));
  /* on the graph: Tantrum (minutes at home, minutes at school) gets open diamonds; the analysis has none of them */
  await dd.evaluate(()=>{const s=document.getElementById('r_behavior');if(s)s.value='all';renderResults();});await sleep(300);
  const gr=await dd.evaluate(()=>{const P=[...document.querySelectorAll('.behavior-report')].map(p=>({h:(p.querySelector('h3')||{}).textContent||'',d:p.querySelectorAll('path.dd-home').length,hint:(p.querySelector('.dd-home-h')||{}).textContent||'',leg:/Home days \(Form HD-1\)/.test((p.querySelector('.legend')||{}).textContent||'')}));return P;});
  const tan=gr.find(x=>/Tantrum/.test(x.h));
  ok('DD-1: the matching graph draws the home days as open diamonds, with a legend entry',tan&&tan.d>=10&&tan.leg&&/not counted with the school days/.test(tan.hint),gr);
  ok('DD-1: the other graphs draw none',gr.filter(x=>!/Tantrum/.test(x.h)).every(x=>x.d===0),gr);
  const an=await dd.evaluate(()=>{const b=S.behaviors.find(x=>/Tantrum/.test(x.name));const c=buildConditions(),rows=sortedRows();return JSON.stringify(c.map(k=>analyzeCondition(k,b,rows).n));});
  const an0=await dd.evaluate(()=>{const keep=S.home;S.home=null;const b=S.behaviors.find(x=>/Tantrum/.test(x.name));const c=buildConditions(),rows=sortedRows();const r=JSON.stringify(c.map(k=>analyzeCondition(k,b,rows).n));S.home=keep;return r;});
  ok('DD-1: the analysis is the same with or without the home days',an===an0,{an,an0});
  /* saved with the record */
  const kept=await dd.evaluate(async()=>{const t=JSON.stringify(S);S=blankState();renderAll();await new Promise(res=>{openFile(new File([t],'x.json'));setTimeout(res,400);});return S.home&&S.home.rows.length;});
  ok('DD-1: the home days travel in the data file',kept===HOME.data.length,kept);
  ok('DD-1: no horizontal scroll at phone width with the bar and notices',await (async()=>{await dd.setViewportSize({width:390,height:800});await dd.evaluate(h=>{const x=JSON.parse(JSON.stringify(h));x.data.forEach(r=>{r.value+=2;});window.__nbhFactsIn({home:x});},HOME);await sleep(200);
    const r=await dd.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth,!!document.getElementById('ddHomeBar')]);return r[0]<=r[1]&&r[2];})());

  ok('no page errors',!log.some(l=>l.type==='pageerror'),log);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);console.log('RESULT: 1 failure(s)');process.exit(1);});
