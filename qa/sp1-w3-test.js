/* v23.05 Form SP-1, the scatter plot, review Wave 3 (simulated data only).
   F89  the printed sheet says what each mark stands for, with the numbers: the legend gives the slash's and the shaded
        cell's counts from the behavior's own cutoff (tapped or counted, two levels or one), on every sheet of the print,
        and the summary's first line says what high rate meant.
   F90  each behavior keeps its own cutoff: changing behavior 2's leaves behavior 1's cells, totals, summary and control
        chart as they were; the cutoff shows on each behavior's button; a file saved before keeps the record's cutoff for
        every behavior, so nothing is scored again; a switch of entry mode uses each behavior's own.
   F91  not observed: a day (the switch beside its name) and an interval (the X tool, the X key, an X typed in a count box)
        are left out of every count and denominator: the summary says "observed on n of m days", the % column, the
        readout, the control chart's days observed, the case's n; a tap on a day not observed changes nothing; the legend
        and the paper show the X; the CSV says "not observed".
   F92  the case gets every behavior's pattern (the statement, and perBehavior with each one's figures), and the behavior
        on screen is left as it was.
   F93  by weekday under Occurrences by day; the first line names a weekday that stands out, not when they are even.
   F95  a fresh sheet is the school day, Monday to Friday.   F98  "Dates covered" on the sheet, summary and control chart.
   F96  DD-1's incidents on a day already marked by hand: asked first (only the unmarked days, or every day).
   I46  the activity column: typed, kept, printed as text, in the CSV, named in the summary and the criteria, at its time.
   I49  the flagged intervals go to the case as observation windows; OB-1 and ABC-1 show them on screen.
   I50  the marking guide after the first sheet (not in the packet).   I48  a second observer: the agreement computed,
        the differences outlined, "Use it" as the IOA; the summary, the case and the paper stay the first observer's.
   The printed pages: blank 1, the simulation 10, with the guide 11, a 15-min day with the activity column 1.
   usage: node qa/sp1-w3-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const URL_=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
  /* the simulated record is drawn at random; a fixed draw keeps every run the same (one draw met no control-chart
     criterion, and the check that the criteria name the activity had nothing to read) */
  await ctx.addInitScript(()=>{let a=20261020;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};});
  const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(URL_);await sleep(1200);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;window.alert=()=>{};});
  /* ---------- F89: a blank sheet ---------- */
  const L=await p.evaluate(()=>{const t=()=>[...document.querySelectorAll('#sheet .legend .lgrow')].map(x=>x.textContent.replace(/\s+/g,' ').trim());const o={two:t()};
    const th=document.getElementById('threshold');th.value='3';th.dispatchEvent(new Event('change',{bubbles:true}));o.three=t();
    document.querySelector('#modeSeg [data-mode="count"]').click();o.count=t();document.querySelector('#modeSeg [data-mode="tap"]').click();
    document.querySelector('#levelSeg [data-levels="1"]').click();o.one=t();o.slashShown=getComputedStyle(document.querySelector('#sheet .lg-slash')).display;document.querySelector('#levelSeg [data-levels="2"]').click();
    th.value='2';th.dispatchEvent(new Event('change',{bubbles:true}));return o;});
  ok('F89 the legend gives the counts: a slash is 1 in the interval, shaded 2 or more; the X is not observed',L.two.includes('Slash — low rate: 1 in the interval.')&&L.two.includes('Shaded — high rate: 2 or more in the interval.')&&L.two.some(x=>/^X — not observed \(absent, pulled out, no sheet\): left out of every count\.$/.test(x)),L.two);
  ok('F89 with a cutoff of 3: 1 to 2, and 3 or more; counted: the counts written',L.three.includes('Slash — low rate: 1 to 2 in the interval.')&&L.three.includes('Shaded — high rate: 3 or more in the interval.')&&L.count.includes('Slash — low rate: a count of 1 to 2 (write the count in the cell).')&&L.count.includes('Shaded — high rate: a count of 3 or more.'),L);
  ok('F89 kept without the distinction: shaded is any occurrence, and no slash',L.one.some(x=>/Shaded — the behavior occurred in this interval, any number of times\./.test(x))&&L.slashShown==='none',L.one);
  /* ---------- the simulation: two behaviors ---------- */
  await p.evaluate(async()=>{await loadSim();});await sleep(500);
  const A=await p.evaluate(async()=>{const o={};const d1=summaryData(),c1=controlData();o.b1={high:d1.high,flag:[...c1.flagged].join(','),line:summaryLine(d1)};
    useBeh(1);const th=document.getElementById('threshold');th.value='3';th.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(x=>setTimeout(x,150));
    o.b2={high:summaryData().high,thr:state.meta.threshold,legend:document.getElementById('lgShaded').textContent};
    useBeh(0);const d1b=summaryData(),c1b=controlData();o.b1b={high:d1b.high,flag:[...c1b.flagged].join(','),thr:thr()};o.bar=[...document.querySelectorAll('#behSeg button')].map(b=>b.textContent);
    /* the print: each behavior's sheets carry its own numbers */
    const set=buildPrintSet();o.printed=set.map(n=>(n.querySelector('#lgShaded,.legend .lgrow:nth-child(3) span')||{}).textContent||'').filter(Boolean);
    o.pr=set.filter(n=>n.querySelector('.legend')).map(n=>[...n.querySelectorAll('.legend .lgrow')].map(x=>x.textContent.replace(/\s+/g,' ').trim()).join(' | '));
    o.keys=set.filter(n=>n.querySelector('table.scatter')).map(n=>n.querySelector('th.corner .sp-key').innerHTML.replace(/<br>/g,' '));
    /* the case: every behavior */
    const cur=state.cur,cells=state.cells,ev=window.__nbhFactsOut().evidence;o.ev={st:ev.statement,n:ev.n,per:ev.perBehavior,back:state.cur===cur&&state.cells===cells&&thr()===2};
    return o;});
  ok('F89 the summary\'s first line says what high rate meant',/, \d+ of them at high rate \(2 or more in an interval\)/.test(A.b1.line),A.b1.line);
  ok('F90 behavior 2\'s cutoff set to 3: its high-rate count follows; behavior 1\'s count and control chart are as they were',A.b2.thr==='3'&&A.b2.high===0&&/3 or more/.test(A.b2.legend)&&A.b1b.high===A.b1.high&&A.b1b.flag===A.b1.flag&&A.b1b.thr===2,A);
  ok('F90 each behavior\'s button shows its cutoff',/high 2\+/.test(A.bar[0])&&/high 3\+/.test(A.bar[1]),A.bar);
  ok('F89/F90 on paper, each behavior\'s legend has its own numbers (aggression 2, elopement 3), and every sheet the rule in its grid\'s corner',A.pr.length===2&&/a count of 2 or more/.test(A.pr[0])&&/a count of 3 or more/.test(A.pr[1])&&A.pr.every(x=>/X — not observed/.test(x))&&
    JSON.stringify(A.keys)===JSON.stringify(['1 low · 2+ high X not observed','1 low · 2+ high X not observed','1–2 low · 3+ high X not observed','1–2 low · 3+ high X not observed']),{pr:A.pr,keys:A.keys});
  ok('F92 the case gets every behavior: the statement names both, each with its own figures and cutoff, n the days observed',/^Aggression toward staff \(simulated\): \d+ of 240 intervals marked/.test(A.ev.st)&&/ Elopement from assigned area \(simulated\): \d+ of 240 intervals marked/.test(A.ev.st)&&/A scatter plot shows when the behavior occurs, not why\.$/.test(A.ev.st)&&
    A.ev.n===15&&A.ev.per.length===2&&A.ev.per[0].threshold===2&&A.ev.per[1].threshold===3&&A.ev.per[1].high===0&&/^Elopement/.test(A.ev.per[1].statement),A.ev);
  ok('F92 the behavior on screen is left as it was',A.ev.back,A.ev);
  /* ---------- F91: a day and an interval not observed ---------- */
  const N=await p.evaluate(async()=>{const o={};const before={rank:document.querySelector('#sumBody table.rank:not(.sp-wkt) tbody tr td:last-child').textContent};
    document.querySelector("table.scatter button.sp-abs[data-abs='14']").click();await new Promise(x=>setTimeout(x,150));
    o.line=document.querySelector('#sumBody p.cap').textContent;o.read=document.getElementById('readout').textContent;o.days=document.querySelector('#ctlBody .stat div').textContent;o.n=window.__nbhFactsOut().evidence.n;
    o.rank=document.querySelector('#sumBody table.rank:not(.sp-wkt) tbody tr td:last-child').textContent;o.before=before.rank;o.th=document.querySelector("table.scatter thead th.sp-absent")?1:0;
    /* a count on that day cannot be typed (it reads X) */
    const ib=document.querySelector("table.scatter input.count[data-r='3'][data-c='14']");o.ro=ib.readOnly;o.val=ib.value;o.same=o.ro&&o.val==='X';
    /* an interval not observed, typed as X in a count box (the simulation counts) */
    const inp=document.querySelector("table.scatter input.count[data-r='2'][data-c='0']");inp.value='x';inp.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(x=>setTimeout(x,100));
    o.x=!!state.cells['2_0'].x;o.td=inp.closest('td').className;const d=summaryData();o.row2obs=d.perRow[2].obs;o.nObs=d.nObs;const a=controlData();o.scaled=a.scaled;o.cap=/scaled to the days observed/.test(document.getElementById('ctlBody').textContent);
    /* CSV */
    o.csv=null;let blob=null;const A0=HTMLAnchorElement.prototype.click,U0=URL.createObjectURL;HTMLAnchorElement.prototype.click=function(){};URL.createObjectURL=b=>{blob=b;return U0(b);};
    document.getElementById('csvBtn').click();HTMLAnchorElement.prototype.click=A0;URL.createObjectURL=U0;if(blob)o.csv=await blob.text();
    /* the paper: X on the day not observed and on the interval */
    const set=buildPrintSet();o.xPrinted=set[1]?set[1].querySelectorAll('td.mark.lvlx').length:0;o.x0Printed=set[0].querySelectorAll('td.mark.lvlx').length;
    return o;});
  ok('F91 a day not observed: the summary says so and counts only the days observed; the heading shows it',/^Observed on 14 of 15 days \(not observed: Fri \d+\/\d+\)\. \d+ of the 224 intervals observed were marked/.test(N.line)&&/\(14 of 14 days observed each\)/.test(N.line)&&N.th===1,N.line);
  ok('F91 the readout, the control chart\'s days observed and the case\'s n follow',/240 cells \(224 observed, 14 of 15 days\)/.test(N.read)&&/^DAYS OBSERVED14of 15 on the sheet/.test(N.days)&&N.n===14,N);
  ok('F91 the % column is of the days observed',N.before==='100'&&N.rank==='100',N);
  ok('F91 a day not observed reads X and takes no count',N.same,N);
  ok('F91 an X typed in a count box: that interval is out of its row\'s days, and the control chart scales it, saying so',N.x&&/lvlx/.test(N.td)&&N.row2obs===13&&N.nObs===14&&N.scaled===1&&N.cap,N);
  ok('F91 the CSV says not observed',!!N.csv&&(N.csv.match(/"not observed"/g)||[]).length===16+1,N.csv&&N.csv.slice(0,300));
  ok('F91 on paper, the day not observed (sheet 2) and the interval (sheet 1) print as X',N.xPrinted===16&&N.x0Printed===1,N);
  /* tap mode: the X tool and the X key */
  const T=await p.evaluate(async()=>{const o={};document.querySelector('#modeSeg [data-mode="tap"]').click();await new Promise(x=>setTimeout(x,100));
    document.getElementById('xTool').click();let b=document.querySelector("table.scatter button.cell[data-r='5'][data-c='1']");b.click();await new Promise(x=>setTimeout(x,100));
    b=document.querySelector("table.scatter button.cell[data-r='5'][data-c='1']");o.x=b.dataset.state;o.glyph=b.textContent.trim();document.getElementById('xTool').click();
    b.click();await new Promise(x=>setTimeout(x,100));b=document.querySelector("table.scatter button.cell[data-r='5'][data-c='1']");o.back=b.dataset.state;
    b.focus();b.dispatchEvent(new KeyboardEvent('keydown',{key:'x',bubbles:true}));await new Promise(x=>setTimeout(x,100));o.key=document.querySelector("table.scatter button.cell[data-r='5'][data-c='1']").dataset.state;return o;});
  ok('F91 tap mode: the X tool marks an interval not observed, a tap clears it, the X key marks it again',T.x==='x'&&T.glyph==='X'&&T.back==='0'&&T.key==='x',T);
  /* ---------- F90: a file saved before each behavior had its cutoff; the entry mode switch ---------- */
  const F=await p.evaluate(async()=>{const d=JSON.parse(JSON.stringify(serialize()));d.cfg.threshold=3;d.behaviors.forEach(b=>{delete b.meta.threshold;});delete d.meta.threshold;
    /* scores in the file before: every behavior's cells at the record's cutoff of 3 */
    const tf=new File([JSON.stringify(d)],'old.json',{type:'application/json'}),dt=new DataTransfer();dt.items.add(tf);const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(x=>setTimeout(x,400));const o={thr:state.behaviors.map(b=>b.meta.threshold),cur:thr()};
    useBeh(1);const th=document.getElementById('threshold');th.value='1';th.dispatchEvent(new Event('change',{bubbles:true}));useBeh(0);
    document.querySelector('#modeSeg [data-mode="tap"]').click();document.querySelector('#modeSeg [data-mode="count"]').click();
    const c1=Object.values(state.behaviors[0].cells).filter(c=>c.est&&c.s===2).map(c=>c.n),c2=Object.values(state.behaviors[1].cells).filter(c=>c.est&&c.s===2).map(c=>c.n);o.est1=[...new Set(c1)];o.est2=[...new Set(c2)];return o;});
  ok('F90 a file from before: the record\'s cutoff becomes each behavior\'s, so nothing is scored again',F.thr.join()==='3,3'&&F.cur===3,F);
  ok('F90 a switch of entry mode carries a shaded mark as each behavior\'s own cutoff',F.est1.every(n=>n===3)&&F.est2.every(n=>n===1),F);
  /* ---------- F95, F98: a fresh sheet ---------- */
  const D=await (async()=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(URL_);await sleep(1000);
    const o=await q.evaluate(()=>({cfg:[state.cfg.startMin,state.cfg.spanH,state.cfg.interval,state.cfg.days,state.cfg.dayStart].join(),preset:document.getElementById('preset').value,days:document.getElementById('days').value,
      heads:[...document.querySelectorAll('#grid thead tr:first-child th')].slice(1,-1).map(t=>t.firstChild.textContent).join(),rows:rowLabels().length,ws:new Date(document.getElementById('weekStart').value+'T12:00').getDay(),
      labels:[...document.querySelectorAll('#sheet .ident label,#summary .sumhead b,#control .sumhead b')].map(x=>x.textContent),pick:document.getElementById('mWeekPick').getAttribute('aria-label')}));await q.close();return o;})();
  ok('F95 a fresh sheet is the school day, 7:30 AM to 3:30 PM in 30-min intervals, Monday to Friday',D.cfg==='450,8,30,5,1'&&D.preset==='school'&&D.days==='5'&&D.heads==='Mon,Tue,Wed,Thu,Fri'&&D.rows===16&&D.ws===1,D);
  ok('F98 the dates line is "Dates covered" on the data sheet, the summary and the control chart',D.labels.filter(x=>x==='Dates covered').length===3&&!D.labels.some(x=>/Week of|Observation period/.test(x))&&/^Dates covered/.test(D.pick),D);
  /* ---------- F93: by weekday ---------- */
  const W=await p.evaluate(async()=>{await loadSim();await new Promise(x=>setTimeout(x,300));const o={};
    o.head=[...document.querySelectorAll('#sumBody .sp-wk thead th')].map(t=>t.textContent).join('|');o.rows=[...document.querySelectorAll('#sumBody .sp-wk tbody th')].map(t=>t.textContent).join('|');
    o.inDay=!!document.querySelector('#sumBody .twoup > .figure:first-child .sp-wk');
    /* a record made to show it: two weeks, the Mondays marked on 6 intervals, the other days on 2 */
    state.cfg.mode='tap';state.cfg.days=10;state.behaviors=[state.behaviors[0]];state.cur=0;state.cells={};state.behaviors[0].cells=state.cells;
    for(let c=0;c<10;c++){const n=c%5===0?6:2;for(let r=0;r<n;r++)state.cells[r+'_'+c]={s:1,n:null,code:''};}
    render();o.line=summaryLine(summaryData());o.cells=[...document.querySelectorAll('#sumBody .sp-wk tbody tr:first-child td')].map(t=>t.textContent).join(',');
    /* an even record: nothing named */
    state.cells={};state.behaviors[0].cells=state.cells;for(let c=0;c<10;c++)for(let r=0;r<4;r++)state.cells[r+'_'+c]={s:1,n:null,code:''};render();o.even=/By weekday/.test(summaryLine(summaryData()));
    /* one week: no weekday comes twice, so no table */
    state.cfg.days=5;render();o.one=!document.querySelector('#sumBody .sp-wk');return o;});
  ok('F93 the summary has the weekdays, Mondays with Mondays, under Occurrences by day: days observed, intervals marked, high rate and occurrences a day',
    W.head==='By weekday (days observed)|Mon (3)|Tue (3)|Wed (3)|Thu (3)|Fri (3)'&&W.rows==='Marked a day|High rate a day|Occurrences a day'&&W.inDay,W);
  ok('F93 the first line names the heaviest weekday when it stands out, with the numbers; not when the weekdays are even, nor with one week',
    /\. By weekday, Mondays were the heaviest: 6\.0 intervals marked a day over 2 Mondays, against 2\.0 on Tuesdays, the lightest\.$/.test(W.line)&&W.cells==='6.0,2.0,2.0,2.0,2.0'&&!W.even&&W.one,W);
  /* ---------- F96: DD-1's incidents on days already marked by hand ---------- */
  const I=await p.evaluate(async()=>{const o={},asked=[];let ans=[];nbhUI.confirm=async t=>{asked.push(String(t));return ans.length?ans.shift():false;};
    state.cfg.mode='tap';state.cfg.startMin=480;state.cfg.interval=30;state.cfg.spanH=7;state.cfg.days=5;state.meta.behavior='Physical aggression';
    ['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02'].forEach((d,i)=>{state.meta['date'+i]=d;});
    state.cells={'1_0':{s:1,n:null,code:''}};state.behaviors=[{meta:{},cells:state.cells}];state.cur=0;commitBeh();render();
    window.__nbhFactsIn({data:{incidentList:[{date:'2026-09-28',time:'10:20',beh:'Physical aggression'},{date:'2026-09-30',time:'09:05',beh:'Physical aggression'}]}});
    let toast='';const t0=nbhUI.toast;nbhUI.toast=m=>{toast=m;};
    ans=[true];document.getElementById('spIncBtn').click();await new Promise(x=>setTimeout(x,200));
    o.q1=asked.splice(0);o.t1=toast;o.c1={mon:(state.cells['4_0']||{}).s||0,wed:(state.cells['2_2']||{}).s||0};o.placed1=state.behaviors[0].meta.incPlaced;
    ans=[false,true];document.getElementById('spIncBtn').click();await new Promise(x=>setTimeout(x,200));
    o.q2=asked.splice(0);o.t2=toast;o.mon=(state.cells['4_0']||{}).s||0;o.placed2=state.behaviors[0].meta.incPlaced;
    /* nothing new: not asked */
    document.getElementById('spIncBtn').click();await new Promise(x=>setTimeout(x,200));o.q3=asked.length;o.t3=toast;
    nbhUI.toast=t0;nbhUI.confirm=async()=>true;return o;});
  ok('F96 an incident on a day already marked by hand: asked first; "only the unmarked days" places the other one and says which was left off',
    I.q1.length===1&&/already has marks on 1 of the 2 days these 2 incidents fall on \(Mon 9\/28\), where 1 of them falls\. Placed there,/.test(I.q1[0])&&I.c1.wed===1&&I.c1.mon===0&&I.placed1==='2026-09-30 09:05 physical aggression'&&I.t1==='1 incident placed; 1 left off, on a day already marked by hand (Mon 9/28).',I);
  ok('F96 asked again, "every day": the one left off goes on top of the marks, and the message says so; once placed, nothing is asked',
    I.q2.length===2&&/already has marks on the day this incident falls on \(Mon 9\/28\)\. Placed there,/.test(I.q2[0])&&/^Place them on every day/.test(I.q2[1])&&I.mon===1&&I.t2==='1 incident placed, 1 of them on days that already held marks; 1 placed before.'&&I.placed2.split('|').length===2&&I.q3===0&&/^No new incident placed; 2 placed before\./.test(I.t3),I);
  /* ---------- I46: the activity column ---------- */
  const C=await p.evaluate(async()=>{await loadSim();await new Promise(x=>setTimeout(x,300));const o={};
    o.on=state.cfg.actOn===true&&document.getElementById('actOn').checked;o.th=!!document.querySelector('#grid th.actcol');o.first=document.querySelector("#grid input.sp-act[data-act='0']").value;
    const i=document.querySelector("#grid input.sp-act[data-act='2']");i.value='independent math';i.dispatchEvent(new Event('input',{bubbles:true}));o.saved=state.cfg.activity[2];render();
    o.rank=document.querySelector('#sumBody table.rank:not(.sp-wkt) tbody').textContent;o.ctl=document.querySelector('#ctlBody .sp-crit').textContent;
    const set=buildPrintSet();o.paperInputs=set[0].querySelectorAll('input.sp-act').length;o.paperText=[...set[0].querySelectorAll('.sp-acttext')].map(x=>x.textContent);
    o.sv=JSON.parse(JSON.stringify(serialize())).cfg.activity[2];
    document.getElementById('actOn').click();o.off=!document.querySelector('#grid th.actcol')&&!/\(arrival/.test(document.querySelector('#sumBody table.rank:not(.sp-wkt) tbody').textContent);document.getElementById('actOn').click();return o;});
  ok('I46 the activity column: on in the simulation, typed for an interval, kept with the record, and on paper as text',C.on&&C.th&&C.first!==''&&C.saved==='independent math'&&C.sv==='independent math'&&C.paperInputs===0&&C.paperText[2]==='independent math'&&C.paperText.length===16,C);
  ok('I46 the densest intervals and the control chart\'s criteria name the activity; switched off, the column and the names go',/(AM|PM) \([a-z]/.test(C.rank)&&/(AM|PM) \([a-z]/.test(C.ctl)&&C.off,C);
  const C2=await p.evaluate(async()=>{const o={};let blob=null;const A0=HTMLAnchorElement.prototype.click,U0=URL.createObjectURL;HTMLAnchorElement.prototype.click=function(){};URL.createObjectURL=b=>{blob=b;return U0(b);};
    document.getElementById('csvBtn').click();HTMLAnchorElement.prototype.click=A0;URL.createObjectURL=U0;const csv=blob?(await blob.text()).split('\n'):[];o.head=csv[0]?csv[0].split(',').slice(0,3).join(','):'';o.row=csv[3]?csv[3].split(',').slice(0,2).join(','):'';
    /* the first interval moved half an hour earlier: the activities keep their times, as the marks do */
    const n0=state.cells['2_0'].n;const sh=document.getElementById('startHour');sh.value='420';sh.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(x=>setTimeout(x,300));
    o.moved=state.cfg.activity[3]==='independent math'&&state.cells['3_0'].n===n0&&/^8:30 – 9:00 AM$/.test(rowLabels()[3]);return o;});
  ok('I46 the CSV has the activity beside the time; moving the first interval keeps each activity at its time',/^"Interval","Activity","Mon \d{4}-\d\d-\d\d"$/.test(C2.head)&&C2.row==='"8:30 – 9:00 AM","independent math"'&&C2.moved,C2);
  /* ---------- I49: observation windows for OB-1 and ABC-1 ---------- */
  const E=await p.evaluate(()=>{const ev=window.__nbhFactsOut().evidence;return {w:ev.windows,ctl:(document.querySelector('#ctlBody .sp-win')||{}).textContent||''};});
  ok('I49 the intervals the control chart flags go to the case as observation windows, by behavior, with times, activity and criteria; the control chart says so',
    Array.isArray(E.w)&&E.w.length>0&&E.w.every(w=>/\(simulated\)$/.test(w.behavior)&&/^\d{1,2}:\d\d [AP]M$/.test(w.from)&&/^\d{1,2}:\d\d [AP]M$/.test(w.to)&&w.end>w.start&&w.criteria.length&&w.activity)&&/^Observation windows, sent with the case to Forms OB-1 and ABC-1: \d/.test(E.ctl),E);
  const OBS={evidence:{'SP-1':{form:'SP-1',dates:'9/21/2026–10/9/2026',windows:[{behavior:'Aggression toward staff (simulated)',from:'9:00 AM',to:'10:00 AM',activity:'independent math'},{behavior:'Elopement from assigned area (simulated)',from:'11:00 AM',to:'11:30 AM'}]}}};
  const note=async file=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push(file+': '+e.message));await q.goto(BASE+'/NBH-Workstation/'+file);await sleep(1000);
    const o=await q.evaluate(f=>{window.__nbhFactsIn(f);const el=document.getElementById('spWinNote');const r={t:el&&el.textContent,np:!!el&&el.classList.contains('noprint'),vis:!!el&&el.offsetParent!==null};window.__nbhFactsIn({});r.gone=!document.getElementById('spWinNote');return r;},OBS);await q.close();return o;};
  const ob=await note('OB-1_Direct-Observation-Record_v2026-09.html'),abc=await note('ABC_Recording_Conditional_Probability_Analysis.html');
  const want='From the scatter plot (Form SP-1, 9/21/2026–10/9/2026), the times its control chart flagged, to observe in: Aggression toward staff (simulated), 9:00 AM – 10:00 AM (independent math) · Elopement from assigned area (simulated), 11:00 AM – 11:30 AM.';
  ok('I49 Forms OB-1 and ABC-1 show the scatter plot\'s windows on screen (not on paper), and drop them when the case has none',ob.t===want&&abc.t===want&&ob.np&&abc.np&&ob.vis&&abc.vis&&ob.gone&&abc.gone,{ob,abc});
  /* ---------- I50: the marking guide ---------- */
  const G=await p.evaluate(()=>{const o={};document.getElementById('guideOn').click();o.cfg=state.cfg.guide;const set=buildPrintSet(),pk=buildPrintSet('packet');
    const gi=set.findIndex(n=>n.classList.contains('sp-guide'));o.at=gi;o.pk=pk.some(n=>n.classList.contains('sp-guide'));o.first=!!set[0].querySelector('table.scatter');
    const g=set[gi];o.text=g?g.textContent.replace(/\s+/g,' '):'';o.rows=g?g.querySelectorAll('.sp-ginit tbody tr').length:0;o.day1=g?g.querySelector('.sp-ginit tbody td').textContent:'';
    document.getElementById('guideOn').click();o.off=!buildPrintSet().some(n=>n.classList.contains('sp-guide'))&&state.cfg.guide===false;return o;});
  ok('I50 the marking guide prints after the first data sheet (its back, two-sided): each behavior\'s definition, examples and its own rule, what to do when not observed, a line a day to initial; not in the packet',
    G.cfg===true&&G.at===1&&G.first&&/1 · Aggression toward staff \(simulated\)\s?What counts: Forceful contact.*For example: .*Does not count: .*How to mark: Write the number of times in the interval: 1 is low rate, 2 or more is high rate\./.test(G.text)&&
    /2 · Elopement from assigned area \(simulated\)/.test(G.text)&&/write X in those intervals\. An X is left out of every count/.test(G.text)&&/Initial each day you marked/.test(G.text)&&G.rows===10&&/^Mon \d+\/\d+$/.test(G.day1)&&!G.pk&&G.off,Object.assign({},G,{text:G.text.slice(-700)}));
  /* ---------- I48: a second observer ---------- */
  const O=await p.evaluate(async()=>{await loadSim();await new Promise(x=>setTimeout(x,300));const o={},b=state.behaviors[0];
    const paper=()=>buildPrintSet()[0].querySelectorAll('td.mark.lvl1,td.mark.lvl2').length;
    const R=spIoa();o.sim={ioa:state.meta.ioa,days:state.meta.ioaDays,obs2:Object.keys(b.obs2||{}).length,note:document.getElementById('ioaNoteP').textContent,n:R.n,agree:R.agree,total:R.total,dis:R.dis.size};
    const line0=document.querySelector('#sumBody p.cap').textContent,ev0=window.__nbhFactsOut().evidence.statement,p0=paper();
    document.getElementById('ioaTog').click();await new Promise(x=>setTimeout(x,150));
    o.on={bar:!document.getElementById('ioaBar').hidden,pressed:document.getElementById('ioaTog').getAttribute('aria-pressed'),cells:state.cells===b.obs2,dis:document.querySelectorAll('table.scatter td.mark.sp-dis').length,
      noioa:document.querySelectorAll('table.scatter td.mark.sp-noioa').length,chips:[...document.querySelectorAll('#ioaDays button[aria-pressed="true"]')].map(x=>x.dataset.iday).join(','),
      res:document.getElementById('ioaRes').textContent,read:document.getElementById('readout').textContent,obs:document.getElementById('ioaObs').value,
      sum:document.querySelector('#sumBody p.cap').textContent===line0,ev:window.__nbhFactsOut().evidence.statement===ev0,paper:paper()===p0,still:state.cells===b.obs2};
    /* a mark on another day (Thursday, the 4th) adds it to the days compared; "Use it" makes it the behavior's IOA */
    const inp=document.querySelector("table.scatter input.count[data-r='0'][data-c='3']");inp.value='9';inp.dispatchEvent(new Event('input',{bubbles:true}));o.added=state.meta.ioaDays;
    document.getElementById('ioaUse').click();const R2=spIoa();o.used={ioa:state.meta.ioa,total:R2.total,note:state.meta.ioaNote};
    document.getElementById('ioaDone').click();await new Promise(x=>setTimeout(x,100));
    o.off={cells:state.cells===b.cells,bar:document.getElementById('ioaBar').hidden,note:document.getElementById('ioaNoteP').textContent,first:b.cells['0_3'].n};
    const d=JSON.parse(JSON.stringify(serialize()));o.kept=(d.behaviors[0].obs2||{})['0_3'];
    /* typed over by hand, the note goes */
    const f=document.getElementById('mIoa');f.value='85';f.dispatchEvent(new Event('input',{bubbles:true}));o.typed=document.getElementById('ioaNoteP').textContent;return o;});
  ok('I48 the simulation has a second observer on the three Wednesdays; the IOA is the one the form computes, with a line under it',O.sim.days==='2,7,12'&&O.sim.n===48&&O.sim.ioa===String(O.sim.total)&&O.sim.dis>0&&O.sim.total<100&&
    O.sim.note.startsWith('Interval-by-interval agreement '+O.sim.ioa+'% ('+O.sim.agree+' of 48 intervals) on 3 days (Wed ')&&/Iris Calloway \(simulated\), paraprofessional as second observer; occurrence agreement [\d.]+% \(\d+ of the \d+ intervals either one marked\); the same level in [\d.]+%\.$/.test(O.sim.note),O.sim);
  ok('I48 Second observer: the grid shows the second observer\'s marks, the days compared, where the two differ outlined; the summary, the case and the paper stay the first observer\'s',
    O.on.bar&&O.on.pressed==='true'&&O.on.cells&&O.on.still&&O.on.dis===O.sim.dis&&O.on.noioa===16*12&&O.on.chips==='2,7,12'&&/^Interval-by-interval agreement /.test(O.on.res)&&/outlined in red/.test(O.on.res)&&/^Second observer · Aggression/.test(O.on.read)&&/Iris Calloway/.test(O.on.obs)&&O.on.sum&&O.on.ev&&O.on.paper,O.on);
  ok('I48 a mark on another day adds it; "Use it" writes the agreement as the behavior\'s IOA with the days and the observer; the first observer\'s marks are untouched and the second\'s are kept with the record; a figure typed over drops the line',
    O.added==='2,3,7,12'&&O.used.ioa===String(O.used.total)&&/ on 4 days \(/.test(O.used.note)&&O.off.cells&&O.off.bar&&O.off.note===O.used.note&&O.off.first!==9&&O.kept&&O.kept.n===9&&O.typed==='',O);
  /* ---------- the printed pages: one sheet a page ---------- */
  const out=path.join(os.tmpdir(),'sp1w3');fs.mkdirSync(out,{recursive:true});
  const q=await ctx.newPage();await q.goto(URL_);await sleep(1000);await q.evaluate(()=>{preparePrint();});await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,'blank.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});
  await q.emulateMedia({media:'screen'});await q.evaluate(async()=>{endPrint();nbhUI.confirm=async()=>true;await loadSim();});await sleep(500);await q.evaluate(()=>{preparePrint();});await q.emulateMedia({media:'print'});
  await q.pdf({path:path.join(out,'sim.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});
  /* the marking guide adds its page; a 15-min school day with the activity column is still one sheet a page */
  await q.emulateMedia({media:'screen'});await q.evaluate(()=>{endPrint();document.getElementById('guideOn').click();preparePrint();});await q.emulateMedia({media:'print'});
  await q.pdf({path:path.join(out,'simg.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();
  const q2=await ctx.newPage();await q2.goto(URL_);await sleep(1000);
  await q2.evaluate(()=>{const iv=document.getElementById('interval');iv.value='15';iv.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('actOn').click();preparePrint();});await q2.emulateMedia({media:'print'});
  const q2r=await q2.evaluate(()=>({rows:rowLabels().length,act:document.querySelectorAll('#spPrint th.actcol').length}));
  await q2.pdf({path:path.join(out,'act15.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});await q2.close();
  const pb=pages(path.join(out,'blank.pdf')),ps=pages(path.join(out,'sim.pdf')),pg=pages(path.join(out,'simg.pdf')),pa=pages(path.join(out,'act15.pdf'));
  ok('the blank sheet prints on one page, the simulation\'s two behaviors on 10 (as before)',pb===1&&ps===10,{pb,ps});
  ok('with the marking guide, 11; a blank 15-min school day (32 rows) with the activity column, one page',pg===11&&pa===1&&q2r.rows===32&&q2r.act===1,{pg,pa,q2r});
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
