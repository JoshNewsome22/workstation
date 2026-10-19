/* v22.8x Form SP-1, the scatter plot, review Wave 3 (simulated data only).
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
   usage: node qa/sp1-w3-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const URL_=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});const p=await ctx.newPage();
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
  const N=await p.evaluate(async()=>{const o={};const before={rank:document.querySelector('#sumBody table.rank tbody tr td:last-child').textContent};
    document.querySelector("table.scatter button.sp-abs[data-abs='14']").click();await new Promise(x=>setTimeout(x,150));
    o.line=document.querySelector('#sumBody p.cap').textContent;o.read=document.getElementById('readout').textContent;o.days=document.querySelector('#ctlBody .stat div').textContent;o.n=window.__nbhFactsOut().evidence.n;
    o.rank=document.querySelector('#sumBody table.rank tbody tr td:last-child').textContent;o.before=before.rank;o.th=document.querySelector("table.scatter thead th.sp-absent")?1:0;
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
  /* ---------- the printed pages: one sheet a page ---------- */
  const out=path.join(os.tmpdir(),'sp1w3');fs.mkdirSync(out,{recursive:true});
  const q=await ctx.newPage();await q.goto(URL_);await sleep(1000);await q.evaluate(()=>{preparePrint();});await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,'blank.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});
  await q.emulateMedia({media:'screen'});await q.evaluate(async()=>{endPrint();nbhUI.confirm=async()=>true;await loadSim();});await sleep(500);await q.evaluate(()=>{preparePrint();});await q.emulateMedia({media:'print'});
  await q.pdf({path:path.join(out,'sim.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();
  const pb=pages(path.join(out,'blank.pdf')),ps=pages(path.join(out,'sim.pdf'));
  ok('the blank sheet prints on one page, the simulation\'s two behaviors on 10 (as before)',pb===1&&ps===10,{pb,ps});
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
