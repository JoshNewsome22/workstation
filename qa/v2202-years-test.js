/* v22.02 Form DD-1 across school years. This year's Google Sheet stays linked as before; an earlier school year's sheet is
   linked beside it (read once, kept with the record), its targets paired with the record's by name ("Self-Injurious Bx"
   is "Self Injury"). A line marks the first day of each school year and the first day of summer school; the days shown
   can be this school year, last, both, the last 20 or 30 school days or chosen dates, with summer school in or out; and
   the first N school days of each year are compared side by side with each year's mean. Simulated students only.
   usage: node qa/v2202-years-test.js */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const W=BASE+'/NBH-Workstation/';
const CUR='1SIMcurrentYEARsheetIDforTESTSabcdefgh',PAST='1SIMpastYEARsheetIDforTESTSabcdefghij';
const STU={name:'Mateo Rivera',id:'4471823'};
function tab(defs,days,student){const W=1+defs.length,row=()=>new Array(W).fill('');const R=[];for(let i=0;i<18;i++)R.push(row());
  R[0][0]=student.name;R[1][0]=student.id;R[15][0]='Measurement';R[16][0]='Observ. Length';R[17][0]='Date';
  defs.forEach((d,i)=>{const c=1+i;if(i===0)R[0][c]='Reduction Targets';R[3][c]=d.name+' Definition';R[4][c]=d.def;R[6][c]=d.name;R[15][c]='Count/Frequency';R[16][c]='Entire School Day';R[17][c]='(Total Per Day)';});
  const lab=row();lab[1]='chart labels';R.push(lab);
  days.forEach(([date,vals])=>{const r=row();r[0]=date;vals.forEach((v,i)=>{r[1+i]=String(v);});R.push(r);});return R;}
const us=iso=>{const [y,m,d]=iso.split('-');return (+m)+'/'+(+d)+'/'+y;};
function weekdays(from,n){const out=[];const d=new Date(from+'T12:00:00');while(out.length<n){const w=d.getDay();if(w>0&&w<6)out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}return out;}
const pastDays=weekdays('2025-08-11',25).map((iso,i)=>[us(iso),[6+(i%3),2+(i%2)]]).concat(weekdays('2026-06-15',10).map((iso,i)=>[us(iso),[1,0]]));
const curDays=weekdays('2026-08-10',25).map((iso,i)=>[us(iso),[2+(i%2),1]]);
const SHEETS={[CUR]:{title:'Mateo Rivera SY26-27 Behavior Data (simulated)',tab:'Reduction and Acquisition TBx 1',defs:[{name:'Self Injury',def:'Hitting own head (simulated).'},{name:'Tantrum Bx',def:'Crying and screaming (simulated).'}],days:curDays},
  [PAST]:{title:'Mateo Rivera SY25-26 Behavior Data (simulated)',tab:'Reduction and Acquisition TBx 1',defs:[{name:'Self-Injurious Bx',def:'Hitting own head (simulated).'},{name:'Tantrum',def:'Crying and screaming (simulated).'}],days:pastDays}};
(async()=>{const br=await chromium.launch();const log=[];
  try{
  const page=await br.newPage({viewport:{width:1300,height:950}});wire(page,log);
  await page.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  await page.addInitScript(()=>{window.google={accounts:{oauth2:{initTokenClient(cfg){return {requestAccessToken(){setTimeout(()=>cfg.callback({access_token:'simulated-token',expires_in:3600}),20);}};}}}};
    try{localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}});
  await page.route('https://sheets.googleapis.com/**',route=>{const u=decodeURIComponent(route.request().url());const id=(/spreadsheets\/([^/?]+)/.exec(u)||[])[1];const s=SHEETS[id];
    if(!s)return route.fulfill({status:404,contentType:'application/json',body:'{}'});
    if(/values:batchGet/.test(u))return route.fulfill({contentType:'application/json',body:JSON.stringify({valueRanges:[{range:s.tab,values:tab(s.defs,s.days,STU)}]})});
    return route.fulfill({contentType:'application/json',body:JSON.stringify({properties:{title:s.title},sheets:[{properties:{title:s.tab,sheetType:'GRID',gridProperties:{rowCount:1000,columnCount:100}}}]})});});
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}S.meta.client='Mateo Rivera';S.meta.id='4471823';S.rows=[];S.behaviors=[];document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));renderAll();});
  /* this year's sheet, linked the usual way */
  await page.evaluate(id=>{document.getElementById('gsLink').click();document.getElementById('gsUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gsFind').click();},CUR);await sleep(1200);
  await page.evaluate(()=>document.getElementById('gsGo').click());await sleep(900);
  const c0=await page.evaluate(()=>({rows:S.rows.length,beh:S.behaviors.map(b=>b.name),btn:(document.getElementById('gsPastBtn')||{}).textContent||''}));
  ok('1 this year\'s sheet links as before (25 days, 2 targets) and the bar offers Earlier school years',c0.rows===25&&c0.beh.length===2&&/Earlier school years/.test(c0.btn),c0);
  /* the earlier year's sheet */
  await page.evaluate(id=>{document.getElementById('gsPastBtn').click();document.getElementById('gspUrl').value='https://docs.google.com/spreadsheets/d/'+id+'/edit';document.getElementById('gspRead').click();},PAST);await sleep(1200);
  const p0=await page.evaluate(()=>({year:(document.getElementById('gspYear')||{}).value,map:[...document.querySelectorAll('[data-gspmap]')].map(s=>s.value),txt:(document.getElementById('gspNew')||{}).textContent||''}));
  ok('2 the earlier sheet is read: its school year from the title (2025-26) and its targets paired by name with the record\'s (Self-Injurious Bx is Self Injury, Tantrum is Tantrum Bx)',p0.year==='2025-26'&&p0.map.join('|')==='Self Injury|Tantrum Bx'&&/35 days/.test(p0.txt),p0);
  await page.evaluate(()=>document.getElementById('gspAdd').click());await sleep(700);
  const p1=await page.evaluate(()=>({rows:S.rows.length,beh:S.behaviors.map(b=>b.name),past:(S.gsPast||[]).length,btn:document.getElementById('gsPastBtn').textContent,first:sortedRows()[0].date,
    sib:S.rows.filter(r=>r.date<'2026-08-01').map(r=>r.values[S.behaviors.find(b=>b.name==='Self Injury').id]).slice(0,3)}));
  ok('3 added: 60 days on one record across two school years, still the 2 targets, the earlier days under the paired names',p1.rows===60&&p1.beh.length===2&&p1.past===1&&/\(1\)/.test(p1.btn)&&p1.first==='2025-08-11'&&p1.sib.join(',')==='6,7,8',p1);
  /* the graphs: the school-year line, summer school */
  await page.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderAll();});await sleep(300);
  const m0=await page.evaluate(()=>conditionalMarks().map(m=>m.label));
  ok('4 a line marks the first day of the 2026-27 school year on the graphs',m0.includes('School year 2026-27'),m0);
  await page.evaluate(()=>{document.querySelector('.dd-sumbox').open=true;document.getElementById('r_sumFrom').value='2026-06-15';document.getElementById('r_sumTo').value='2026-06-26';document.getElementById('r_sumAdd').click();});await sleep(300);
  const m1=await page.evaluate(()=>({marks:conditionalMarks().map(m=>m.label),list:document.getElementById('r_sumList').textContent}));
  ok('5 summer school\'s dates are given once: its first day is marked and the session is listed',m1.marks.includes('Summer school')&&/6\/15\/(20)?26|Jun/.test(m1.list),m1);
  const shown=sel=>page.evaluate(sel=>{Object.keys(sel).forEach(id=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=sel[id];else e.value=sel[id];e.dispatchEvent(new Event('change',{bubbles:true}));});
    ddRangeOn=true;const r=sortedRows();ddRangeOn=false;return {n:r.length,first:r[0]&&r[0].date,last:r[r.length-1]&&r[r.length-1].date,label:(document.querySelector('.dd-rng-l')||{}).textContent||''};},sel);
  const r1=await shown({r_sum:'out'});const r2=await shown({r_sum:'in',r_rng:'cur'});const r3=await shown({r_rng:'prev'});const r3b=await shown({r_sum:'out'});
  const r4=await shown({r_sum:'in',r_rng:'l20'});const r5=await shown({r_rng:'custom',r_from:'2025-09-01',r_to:'2025-09-30'});
  ok('6 summer school left out: 50 days; this school year: 25; last school year: 35 with summer school, 25 without; the last 20 school days: 20; chosen dates: September 2025 only',
    r1.n===50&&r2.n===25&&r2.first==='2026-08-10'&&r3.n===35&&r3b.n===25&&r4.n===20&&r5.n>0&&r5.first>='2025-09-01'&&r5.last<='2025-09-30'&&/Showing/.test(r5.label),{r1,r2,r3,r3b,r4,r5});
  /* the first 20 school days of each year */
  await shown({r_rng:'all',r_sum:'in'});await page.evaluate(()=>{const n=document.getElementById('r_cmpN');n.value='20';n.dispatchEvent(new Event('change',{bubbles:true}));const c=document.getElementById('r_cmp');c.value='1';c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const c1=await page.evaluate(()=>{const B=[...document.querySelectorAll('.dd-cmp-b')];return {n:B.length,h:B.map(b=>b.querySelector('h4').textContent),rows:B.map(b=>[...b.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent))),say:B.map(b=>(b.querySelector('p:not(.dd-cmp-key)')||{}).textContent||''),svg:B.map(b=>b.querySelectorAll('polyline').length),caution:!!document.querySelector('.dd-cmp .caution')};});
  const sib=c1.rows[0]||[];
  ok('7 the first 20 school days compared: a graph per target with one line per school year, each year\'s days and mean (Self Injury 7 in 2025-26, 2.5 in 2026-27), "lower" and "better", with the caution',
    c1.n===2&&c1.svg.every(n=>n===2)&&sib.length===2&&sib[0][0]==='2025-26'&&sib[0][1]==='20'&&sib[0][2]==='6.95'&&sib[1][0]==='2026-27'&&sib[1][2]==='2.5'&&/lower/.test(c1.say[0])&&/better/.test(c1.say[0])&&c1.caution,c1);
  /* unlinking the earlier year */
  await page.evaluate(()=>{document.querySelector('section[data-panel="data"]').classList.remove('hidden');document.getElementById('gsPastBtn').click();});await sleep(300);
  await page.evaluate(()=>document.querySelector('[data-gspdel="0"]').click());await sleep(500);
  const u0=await page.evaluate(()=>({rows:S.rows.length,past:(S.gsPast||[]).length}));
  ok('8 the earlier year\'s sheet unlinked: its days leave the record, this year\'s stay',u0.rows===25&&u0.past===0,u0);
  const errs=log.filter(l=>l.type==='pageerror');ok('9 no page errors',!errs.length,errs.slice(0,3));
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
