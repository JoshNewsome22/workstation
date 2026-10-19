/* v23.07 Form MT-1, discontinuous measurement, review Wave 3 (simulated data only).
   F108  the masthead says what Autosave keeps on the device; nothing on the form says nothing is stored in the browser.
   F109  a logged session keeps its start time, setting, observer, the intervals on the sheet and N/A; Clear sheet loses none.
   F110  the session log goes out to the case (intervals.sessions), for DD-1 to take (proposed).
   F111  the interval is chosen and the count follows (30 minutes in 10-second intervals is 180); a file saved with a ratio keeps
         its interval; the timer locks it; changed with marks scored, it asks first.
   F112  Student ID and School / grade on the sheet, filled by the packet, and on the print head.
   F113  a sheet already logged is asked about before it is logged again.   F114  Print blank sheet clears nothing.
   F115  the measure above the graph, a dotted line where it changes, and in the CSV.   F116  observer 2's own file into Obs 2.
   I56 chance agreement under each figure.  I58 GB-1's interval criterion on the graph.  I59 marks typed in one line.
   I60 each condition's sessions, dates, level and agreement.  The printed pages: blank 5, simulation 6, as before.
   usage: node qa/mt1-w3-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const URL_=BASE+'/NBH-Workstation/MT-1_Discontinuous-Measurement_v2026-09.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const pages=f=>+cp.execFileSync('python3',['-c','import pymupdf,sys;print(pymupdf.open(sys.argv[1]).page_count)',f]).toString().trim();
(async()=>{const br=await chromium.launch();const errs=[];
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(URL_);await sleep(1200);
  await p.evaluate(()=>{window.__asked=[];window.__ans=[];nbhUI.confirm=async t=>{window.__asked.push(String(t));return window.__ans.length?window.__ans.shift():true;};window.__alerts=[];window.alert=t=>{window.__alerts.push(String(t));};window.print=()=>{window.__printed=(window.__printed||0)+1;};});
  /* ---------- F108 ---------- */
  const A=await p.evaluate(()=>({note:document.querySelector('.nbh-savenote').textContent,src:document.documentElement.outerHTML.indexOf('Nothing is stored in the browser')}));
  ok('F108 the masthead says Autosave keeps a copy on this device for up to 14 days, and nothing on the form says nothing is stored in the browser',/Autosave keeps a safety copy/.test(A.note)&&/14 days/.test(A.note)&&A.src<0,A);
  /* ---------- F111: the interval ---------- */
  const I=await p.evaluate(async()=>{const o={},set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},rd=()=>({iv:params().ivSec,n:params().total,rows:document.querySelectorAll('#ivWrap tbody tr').length,d:document.getElementById('derived').innerText.replace(/\s+/g,' ')});
    o.blank=rd();o.noRatio=!document.querySelector('[data-m="ratio"]');set('mins','30');await new Promise(x=>setTimeout(x,50));o.m30=rd();
    o.opts30=[...document.querySelector('[data-m="iv"]').options].map(x=>x.value).join(',');set('iv','10');await new Promise(x=>setTimeout(x,50));o.iv10=rd();
    set('mins','45');await new Promise(x=>setTimeout(x,50));o.opts45=[...document.querySelector('[data-m="iv"]').options].map(x=>x.value).join(',');o.m45=rd();
    /* marks scored: a new interval asks first; Cancel keeps the marks and the interval */
    S.marks={0:'1',1:'0'};renderGrid();window.__ans=[false];set('iv','20');await new Promise(x=>setTimeout(x,80));o.cancel={iv:params().ivSec,marks:Object.keys(S.marks).length,asked:window.__asked.splice(0)};
    window.__ans=[true];set('iv','20');await new Promise(x=>setTimeout(x,80));o.okd={iv:params().ivSec,marks:Object.keys(S.marks).length};
    /* the timer locks it */
    document.getElementById('tmrStart').click();await new Promise(x=>setTimeout(x,150));o.lock=document.querySelector('[data-m="iv"]').disabled&&document.querySelector('[data-m="mins"]').disabled;mtTimer.reset();
    /* a file saved before, with the ratio only */
    const old={form:'MT-1',rev:'2026-09',S:{meta:{client:'SIMULATED – Old File',method:'Partial interval',mins:'10',ratio:'1:2',cols:'4',ioaOn:'No'},marks:{0:'1',1:'0',29:'1'},ioa:{},sess:[{d:'9/1/26',m:'Partial interval',r:'1:2',len:'10 min',n:'30',p:'40.0',ioa:'',chg:'',ph:'Baseline',note:''}]}};
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(old)],'old.json',{type:'application/json'}));const fi=document.getElementById('fileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(x=>setTimeout(x,400));o.old={iv:params().ivSec,n:params().total,meta:S.meta.iv,ratio:S.meta.ratio,marks:Object.keys(S.marks).length,sel:document.querySelector('[data-m="iv"]').value,logIv:document.querySelector('#sessTbl input[data-f="iv"]').value};
    return o;});
  ok('F111 a fresh sheet: 5 minutes in 5-second intervals (60), with no ratio selector; the derived line gives the paper-sheet ratio',I.blank.iv===5&&I.blank.n===60&&I.blank.rows===60&&I.noRatio&&/Paper-sheet ratio 1:1/.test(I.blank.d),I.blank);
  ok('F111 30 minutes keeps the 5-second interval (360 intervals); 10 seconds gives 180, as the review asked; only lengths that divide the observation are offered',I.m30.iv===5&&I.m30.n===360&&I.iv10.n===180&&I.opts30==='5,10,15,20,30,45,60,90,120,180,300'&&/Paper-sheet ratio/.test(I.iv10.d)===false&&/A long sheet/.test(I.iv10.d)===false,I);
  ok('F111 45 minutes: 10-second intervals stay (270), and the choice offers 45 s and 90 s',I.m45.iv===10&&I.m45.n===270&&/(^|,)45(,|$)/.test(I.opts45)&&/(^|,)90(,|$)/.test(I.opts45),I);
  ok('F111 with marks scored a new interval asks first: Cancel keeps the marks and the interval; OK clears them; the timer locks the interval while it runs',I.cancel.iv===10&&I.cancel.marks===2&&I.cancel.asked.length===1&&/interval length/.test(I.cancel.asked[0])&&I.okd.iv===20&&I.okd.marks===0&&I.lock,I);
  ok('F111 a file saved with the ratio only (10 minutes at 1:2) opens in 20-second intervals with its 30 marks places, and its log row shows 20 s',I.old.iv===20&&I.old.n===30&&I.old.meta==='20'&&I.old.ratio==='1:2'&&I.old.marks===3&&I.old.sel==='20'&&I.old.logIv==='20 s',I.old);
  /* ---------- the simulation: F109, F113, F110, I56, I60, F115 ---------- */
  await p.evaluate(async()=>{window.__ans=[];await loadSim();window.__asked.splice(0);});await sleep(400);
  const L=await p.evaluate(async()=>{const o={};
    o.chance=[...document.querySelectorAll('#ioaOut .metric .chance')].map(x=>x.textContent);
    o.phases=[...document.querySelectorAll('#mtPhases tbody tr')].map(tr=>[...tr.cells].map(td=>td.textContent.replace(/\s+/g,' ').trim()).join(' '));
    o.plot=[...document.querySelectorAll('#mtPlot text')].map(t=>t.textContent);o.circles=document.querySelectorAll('#mtPlot circle').length;
    /* F113: the sheet on screen is session 7, already logged */
    window.__ans=[false];await captureSheet(false);o.again={asked:window.__asked.splice(0),n:S.sess.length,msg:document.getElementById('capMsg').textContent};
    /* a mark changed, an N/A: captured at once, with when, where, who, N/A */
    S.marks[3]='x';renderGrid();renderSum();await captureSheet(false);o.cap={asked:window.__asked.splice(0).length,n:S.sess.length,row:S.sess[S.sess.length-1]};
    const tr=document.querySelectorAll('#sessTbl tbody tr')[S.sess.length-1];o.cell=tr.querySelectorAll('td')[6].innerText.replace(/\s+/g,' ').trim();
    o.tso=[...tr.querySelectorAll('td.tso input')].map(i=>i.value);
    window.__ans=[true];await captureSheet(false);o.third={asked:window.__asked.splice(0).length,n:S.sess.length};S.sess.pop();renderSess();
    /* Clear sheet: the start time goes from the sheet, not from the log */
    window.__ans=[true];document.getElementById('clearSheet').click();await new Promise(x=>setTimeout(x,150));window.__asked.splice(0);
    o.clear={start:S.meta.start,rowStart:S.sess[S.sess.length-1].start,loc:S.sess[S.sess.length-1].loc,last:S.meta.lastCap===undefined};
    /* F110 */
    const f=window.__nbhFactsOut();o.out=f&&f.intervals;
    /* CSV */
    let blob=null;const A0=HTMLAnchorElement.prototype.click,U0=URL.createObjectURL;HTMLAnchorElement.prototype.click=function(){};URL.createObjectURL=b=>{blob=b;return U0(b);};
    document.getElementById('csvBtn').click();HTMLAnchorElement.prototype.click=A0;URL.createObjectURL=U0;o.csv=blob?await blob.text():'';
    return o;});
  ok('I56 under each agreement figure, the agreement expected by chance (overall 56.7%, occurrence 51.9%, non-occurrence 18.8% on the simulation)',JSON.stringify(L.chance)===JSON.stringify(['chance alone: 56.7%','chance alone: 51.9%','chance alone: 18.8%']),L.chance);
  ok('I60 under the graph, each condition from one full phase change to the next: sessions, dates, mean and range, first and last, mean IOA; the conditional change stays inside',L.phases.length===2&&/^Baseline 1–3 \(3\) .*33\.3 \(30\.0–36\.7\) 33\.3 → 36\.7 93\.3% \(1 session\)$/.test(L.phases[0])&&/^Plan ?conditional change: Aide B covering at session 6 4–7 \(4\) .*57\.5 \(46\.7–70\.0\) 46\.7 → 70\.0 90\.0% \(2 sessions\)$/.test(L.phases[1]),L.phases);
  ok('F115 the measure is written above the graph (no points added)',L.plot.includes('Measure: Whole interval · 20-s intervals · 10 min')&&L.circles===7,L.plot);
  ok('F113 the sheet on screen is already logged as session 7: asked first, and Cancel logs nothing',L.again.asked.length===1&&/already logged as session 7/.test(L.again.asked[0])&&L.again.n===7&&/Not logged again/.test(L.again.msg),L.again);
  ok('F109 a changed sheet is logged at once with its start time, setting, observer, interval, the intervals on the sheet and N/A',L.cap.asked===0&&L.cap.n===8&&L.cap.row.start==='13:30'&&L.cap.row.loc==='Room 12, independent writing block'&&L.cap.row.obs==='Aide A (simulated)'&&L.cap.row.iv==='20 s'&&L.cap.row.tot==='30'&&L.cap.row.na==='1'&&L.cap.row.n==='29'&&L.cell==='of 30 · 1 N/A'&&L.tso.join('|')==='13:30|Room 12, independent writing block|Aide A (simulated)',L.cap);
  ok('F113 logged again unchanged: asked, and OK logs it',L.third.asked===1&&L.third.n===9,L.third);
  ok('F109 Clear sheet empties the start time on the sheet; the log keeps it',L.clear.start===''&&L.clear.rowStart==='13:30'&&L.clear.loc==='Room 12, independent writing block'&&L.clear.last,L.clear);
  const s0=L.out&&L.out.sessions&&L.out.sessions[0],s3=L.out&&L.out.sessions&&L.out.sessions[3];
  ok('F110 the session log goes out to the case: the behavior and each session with its date (and ISO), percentage, method, interval, length, agreement, condition and change',!!L.out&&L.out.form==='MT-1'&&/^On-task/.test(L.out.beh)&&L.out.sessions.length===8&&s0.pct===33.3&&/^\d{4}-\d\d-\d\d$/.test(s0.iso)&&s0.method==='Whole interval'&&s0.iv===20&&s0.mins===10&&s0.ioa.pt===93.3&&s0.cond==='Baseline'&&s3.chg==='Full phase change'&&s0.start==='13:30'&&L.out.sessions[7].na===1,L.out);
  ok('F109/F115 the CSV gives the measure, and each session\'s start time, setting, observer, interval, intervals on the sheet and N/A',/"Measure","Whole interval · 20-s intervals · 10 min"/.test(L.csv)&&/"Session","Date","Start time","Setting","Observer","Method","Interval","Ratio \(paper sheet\)","Length","Intervals scored","Intervals on the sheet","N\/A","% occur"/.test(L.csv)&&/"8","[^"]*","13:30","Room 12, independent writing block","Aide A \(simulated\)","Whole interval","20 s","1:2","10 min","29","30","1"/.test(L.csv),L.csv.slice(-900));
  /* F115: a session measured differently */
  const M=await p.evaluate(()=>{S.sess[4].m='Partial interval';renderSess();return {lines:document.querySelectorAll('#mtPlot line.mt-mchg').length,text:[...document.querySelectorAll('#mtPlot text')].map(t=>t.textContent).filter(t=>/^Partial interval|^Whole interval ·/.test(t))};});
  ok('F115 a session measured differently from the one before gets a dotted line with its measure (and the one after, going back)',M.lines===2&&M.text.includes('Partial interval · 20-s intervals · 10 min')&&M.text.includes('Whole interval · 20-s intervals · 10 min'),M);
  /* ---------- F112: the packet fills the ID and the school; the print head names them ---------- */
  const P=await p.evaluate(async()=>{window.postMessage({nbh:'packet',packet:{client:'Mateo Rivera',sid:'4471823',site:'Royal Palm School Elementary, Room 14 (simulated)',grade:'5'}},'*');await new Promise(x=>setTimeout(x,400));
    return {sid:document.querySelector('[data-m="sid"]').value,site:document.querySelector('[data-m="site"]').value,meta:[S.meta.sid,S.meta.site],who:document.getElementById('mtWho').textContent,labels:[...document.querySelectorAll('.fieldgrid label')].map(l=>l.textContent)};});
  ok('F112 Student ID and School / grade are on the sheet, filled by the packet into the record, and the print head names the student, the ID and the school',P.labels.includes('Student ID')&&P.labels.includes('School / grade')&&P.sid==='4471823'&&P.meta[0]==='4471823'&&/Royal Palm/.test(P.meta[1])&&/ID 4471823 · Royal Palm School Elementary/.test(P.who),P);
  /* ---------- F114 ---------- */
  const B=await p.evaluate(async()=>{S.marks={0:'1',1:'0',2:'1'};renderGrid();renderSum();const n=Object.keys(S.marks).length;window.__printed=0;document.getElementById('blankBtn').click();await new Promise(x=>setTimeout(x,200));
    return {n,after:Object.keys(S.marks).length,cls:document.body.classList.contains('print-blank'),printed:window.__printed,asked:window.__asked.splice(0).length};});
  await p.emulateMedia({media:'print'});
  const B2=await p.evaluate(()=>{const b=document.querySelector('#ivWrap button[data-v="1"][aria-pressed="true"]');return {bg:b?getComputedStyle(b).backgroundColor:'',log:getComputedStyle(document.querySelector('section.only-log')).display,sum:getComputedStyle(document.getElementById('sumMetrics')).display};});
  await p.emulateMedia({media:'screen'});
  ok('F114 Print blank sheet asks nothing and clears nothing: on paper the marks show unscored, the figures and the log are left off',B.n>0&&B.after===B.n&&B.cls&&B.printed===1&&B.asked===0&&/255, 255, 255/.test(B2.bg)&&B2.log==='none'&&B2.sum==='none',{B,B2});
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  /* ---------- F116 ---------- */
  const O=await p.evaluate(async()=>{const o={};window.__ans=[true];await loadSim();window.__asked.splice(0);S.ioa={};S.meta.obs2='';renderAll();
    const mk=(meta,marks)=>({form:'MT-1',rev:'2026-09',S:{meta:Object.assign({},S.meta,meta),marks,ioa:{},sess:[]}});
    const put=async d=>{const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'o2.json',{type:'application/json'}));const fi=document.getElementById('ioaFileIn');fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(x=>setTimeout(x,400));};
    const m2=Object.assign({},S.marks);m2[0]='0';m2[5]='x';
    await put(mk({iv:'10',obs:'Paula Brennan (simulated)'},m2));o.bad={alert:window.__alerts.splice(0),ioa:Object.keys(S.ioa).length};
    window.__ans=[true];await put(mk({obs:'Paula Brennan (simulated)'},m2));o.good={asked:window.__asked.splice(0),ioa:Object.keys(S.ioa).length,i0:S.ioa[0],i5:S.ioa[5],obs2:S.meta.obs2,on:S.meta.ioaOn,figs:document.getElementById('ioaOut').innerText.length>0};
    return o;});
  ok('F116 observer 2\'s own file goes into the Obs 2 column when its method, length and interval match; one scored differently is refused with the reason',O.bad.ioa===0&&/interval \(10 seconds there, 20 here\)/.test(O.bad.alert[0]||'')&&O.good.asked.length===1&&O.good.ioa===30&&O.good.i0==='0'&&O.good.i5==='x'&&O.good.obs2==='Paula Brennan (simulated)'&&O.good.on==='Yes'&&O.good.figs,O);
  /* ---------- I59 ---------- */
  const T=await p.evaluate(async()=>{const o={};const go=async(t,into)=>{document.getElementById('typeMarks').value=t;document.getElementById('typeInto').value=into;document.getElementById('typeApply').click();await new Promise(x=>setTimeout(x,150));};
    window.__ans=[true];await go('+ + - n +','m');o.m=[0,1,2,3,4].map(i=>S.marks[i]).join('');o.rest=Object.keys(S.marks).length;o.asked=window.__asked.splice(0).length;
    await go('++?-','m');o.bad=window.__alerts.splice(0);await go('+'.repeat(31),'m');o.many=window.__alerts.splice(0);
    S.ioa={};S.meta.ioaOn='No';renderAll();await go('+-+','i');o.i=[0,1,2].map(i=>S.ioa[i]).join('')+'|'+S.meta.ioaOn;return o;});
  ok('I59 a paper sheet\'s marks typed in one line fill the intervals in order (asked first over marks already there); other characters, or more marks than intervals, are refused; into Obs 2 switches the IOA column on',T.m==='110x1'&&T.rest===5&&T.asked===1&&/“\?”/.test(T.bad[0]||'')&&/31 marks for the 30 intervals/.test(T.many[0]||'')&&T.i==='101|Yes',T);
  /* ---------- I58 ---------- */
  const G=await p.evaluate(()=>{const o={};window.__nbhFactsIn({goals:{acq:[{beh:'on-task during independent writing (simulated)',crit:'in at least 80% of 20-second whole intervals across three consecutive sessions',meth:'whole interval recording on Form MT-1',text:'Mateo will be on-task in at least 80% of 20-second whole intervals (simulated).'}],red:[]}});
    o.goal=[...document.querySelectorAll('#mtPlot .mt-goal text')].map(t=>t.textContent);
    window.__nbhFactsIn({goals:{acq:[{beh:'hand the break card to an adult',crit:'independently in at least 80% of opportunities',meth:'trial-by-trial data on DD-1'}],red:[]}});o.none=document.querySelectorAll('#mtPlot .mt-goal').length;return o;});
  ok('I58 Form GB-1\'s objective for this behavior, set as a percentage of intervals, is a dashed criterion line; an objective for another behavior, or not in intervals, is not drawn',G.goal.join()==='Goal 80% (Form GB-1)'&&G.none===0,G);
  /* ---------- the printed pages ---------- */
  const out=path.join(os.tmpdir(),'mt1w3');fs.mkdirSync(out,{recursive:true});
  const pr=async(kind,file)=>{const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(URL_);await sleep(1000);
    await q.evaluate(async k=>{nbhUI.confirm=async()=>true;window.print=()=>{};if(k!=='blank')await loadSim();if(k==='paper')document.getElementById('blankBtn').click();},kind);await sleep(500);
    await q.emulateMedia({media:'print'});await q.pdf({path:path.join(out,file),format:'Letter',printBackground:true,preferCSSPageSize:true});await q.close();return pages(path.join(out,file));};
  const pb=await pr('blank','blank.pdf'),ps=await pr('sim','sim.pdf'),pp=await pr('paper','paper.pdf');
  ok('the printed pages: the blank form 5 and the simulation 6, as before; Print blank sheet prints the sheet alone (2 pages for the simulation\'s 30 intervals)',pb===5&&ps===6&&pp===2,{pb,ps,pp});
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
