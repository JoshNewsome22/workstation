/* v22.65 Form RA-1 from the reinforcer-assessment articles: a concurrent-operants Baseline (no consequence at any station),
   on the sheet and in the runner, with the readout setting each option's responses under reinforcement against its
   baseline and the graph marking the phases (Fisher et al., 1992; Roscoe et al., 1999); the maximizing result named
   (Fisher et al., 1992, p. 497); a single-operant row keeps Access (s) and Total (min) beside the Minutes the rate uses,
   written by the runner; an agreement check per ratio step (DeLeon et al., 2009, p. 731), by count, break point and
   duration; the attribution of the time-with-each-stimulus measure. Simulated data only.
   usage: node qa/v2265-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
  const txt=id=>p.evaluate(i=>((document.getElementById(i)||{}).textContent||'').replace(/\s+/g,' '),id);
  const view=v=>p.evaluate(v=>document.querySelector('[data-view="'+v+'"]').click(),v);
  const rows=v=>p.evaluate(v=>Object.fromEntries([...document.querySelectorAll('#ra-run-'+v+'-sum tr')].map(r=>[r.children[0].textContent,r.children[1].textContent])),v);
  const click=async id=>{await p.evaluate(id=>document.getElementById(id).click(),id);await sleep(150);};
  /* the concurrent sheet: two baseline sessions, then reinforcement with nearly all responding to option A */
  const nOpt=await p.evaluate(()=>document.querySelectorAll('#coTbl [data-k="0"][data-f="r"]').length);
  const coN=()=>p.evaluate(()=>document.querySelectorAll('#coTbl select[data-f="cond"]').length);
  await p.evaluate(n=>{const set=(k,f,v,j)=>{const e=document.querySelector('#coTbl [data-k="'+k+'"][data-f="'+f+'"]'+(j!=null?'[data-j="'+j+'"]':''));e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    document.querySelectorAll('#coTbl select[data-f="cond"]').forEach((_,k)=>{const bl=k<2;set(k,'cond',bl?'bl':'');for(let j=0;j<n;j++)set(k,'r',String(bl?[2,3,2][j]:[19,1,0][j]),j);});},nOpt);
  await sleep(300);
  const co=await p.evaluate(()=>({head:[...document.querySelectorAll('#coTbl thead th')].map(t=>t.textContent).join('|'),readout:document.getElementById('coReadout').textContent,
    notes:[...document.querySelectorAll('#coNotes li')].map(li=>li.textContent.replace(/\s+/g,' ')),n:document.querySelectorAll('#coTbl select[data-f="cond"]').length,
    plot:{bl:[...document.querySelectorAll('#coPlot text')].filter(t=>t.textContent==='Baseline').length,rf:[...document.querySelectorAll('#coPlot text')].filter(t=>t.textContent==='Reinforcement').length,ph:document.querySelectorAll('#coPlot line.phase').length,
      breaks:[...document.querySelectorAll('#coPlot path.series')].map(pa=>(pa.getAttribute('d').match(/M/g)||[]).length)}}));
  ok('1 the concurrent sheet has a Condition column; the readout scores the reinforcement sessions only',/\|Condition\|/.test(co.head)&&co.readout===(co.n-2)+' sessions scored.',co);
  ok('2 the baseline against reinforcement: each option\'s responses a session in each, with the rule (Fisher et al., 1992; Roscoe et al., 1999)',co.notes.some(t=>/^Baseline, no consequence at any station \(2 sessions\): .* 2, .* 3, .* 2 responses a session; under reinforcement \(\d+\): .* 19, .* 1, .* 0\. An option whose responding rose above its own baseline reinforced it \(Fisher et al\., 1992; Roscoe et al\., 1999\)\.$/.test(t)),co.notes);
  ok('3 near-exclusive choice named as maximizing: which is preferred, not by how much (Fisher et al., 1992, p. 497)',co.notes.some(t=>/^Nearly all responding went to .*: concurrent ratio schedules tend to produce this \(maximizing\), so the test shows which stimulus is preferred, not by how much\. .*\(Fisher et al\., 1992, p\. 497\)\.$/.test(t)),co.notes);
  ok('4 the graph names the phases, draws one phase line and breaks each path there',co.plot.bl===1&&co.plot.rf===1&&co.plot.ph===1&&co.plot.breaks.length>=2&&co.plot.breaks.every(b=>b===2),co.plot);
  /* the concurrent runner in baseline */
  await view('co');await sleep(300);
  await p.evaluate(()=>{const c=document.getElementById('ra-run-co-cond');c.value='bl';c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  const r0={cue:await txt('ra-run-co-cuet'),script:await txt('ra-run-co-script')};
  ok('5 the runner\'s Condition, Baseline: the cue and the script say no station has a consequence',/^Baseline: no station has a consequence\. Count the responses at each station, then press Start session\.$/.test(r0.cue)&&/BaselineNo station has a consequence: count the responses at each, deliver nothing\./.test(r0.script)&&!/Before each session/.test(r0.script),r0);
  await click('ra-run-co-start');await click('ra-run-co-o0');await click('ra-run-co-o0');await click('ra-run-co-o1');
  const r1={cueh:await txt('ra-run-co-cueh'),cue:await txt('ra-run-co-cuet'),dis:await p.evaluate(()=>document.getElementById('ra-run-co-cond').disabled)};
  await click('ra-run-co-end');await sleep(300);const sum=await rows('co');
  ok('6 a baseline session: nothing is delivered (no access), every option reads "nothing", and the Condition is locked while it runs',r1.cueh==='Baseline'&&/: nothing · .*: nothing/.test(r1.cue)&&!/Access/.test(r1.cueh)&&r1.dis,r1);
  ok('7 the summary names the condition and counts no reinforcers',sum['Condition']==='Baseline (no consequence at any station)'&&Object.values(sum).every(v=>!/reinforcer/.test(v)),sum);
  const before=await coN();
  await click('ra-run-co-save');await sleep(300);
  const sv=await p.evaluate(()=>{const n=document.querySelectorAll('#coTbl select[data-f="cond"]').length,k=n-1,g=j=>document.querySelector('#coTbl [data-k="'+k+'"][data-f="r"][data-j="'+j+'"]').value;return {n,sel:document.querySelector('#coTbl select[data-k="'+k+'"][data-f="cond"]').value,r:[g(0),g(1)]};});
  ok('8 Save writes the row as Baseline with its counts',sv.n===before+1&&sv.sel==='bl'&&sv.r[0]==='2'&&sv.r[1]==='1',sv);
  /* single operant: the three times */
  await view('so');await sleep(300);
  const head=await p.evaluate(()=>[...document.querySelectorAll('#soTbl thead th')].map(t=>t.textContent));
  await p.evaluate(()=>{const c=document.getElementById('ra-run-so-cond');c.value=[...c.options].find(o=>o.value!=='ctl').value;c.dispatchEvent(new Event('change'));});await sleep(200);
  await p.evaluate(()=>{const a=document.getElementById('ra-run-so-acc');a.value='2';a.dispatchEvent(new Event('input'));a.dispatchEvent(new Event('change'));});
  await click('ra-run-so-start');await sleep(400);await click('ra-run-so-resp');await sleep(2600);await click('ra-run-so-resp');await sleep(300);
  await click('ra-run-so-end');await sleep(300);const ss=await rows('so');await click('ra-run-so-save');await sleep(300);
  const so=await p.evaluate(()=>{const a=[...document.querySelectorAll('#soTbl input[data-f="acc"]')].filter(e=>e.value!=='').pop();if(!a)return null;const k=a.dataset.k,v=f=>document.querySelector('#soTbl [data-k="'+k+'"][data-f="'+f+'"]').value;return {k,acc:v('acc'),tot:v('tot'),min:v('min'),resp:v('resp')};});
  ok('9 single operant: Access (s) and Total (min) beside Minutes; the runner writes all three (total includes the access)',head.includes('Access (s)')&&head.includes('Total (min)')&&head.indexOf('Minutes')<head.indexOf('Access (s)')&&!!so&&so.acc==='2'&&+so.tot>0&&+so.tot>=+so.min&&Math.abs((+so.tot-+so.min)*60-2)<0.9,{head,so,ss});
  /* the agreement check */
  await view('summary');await sleep(200);
  await click('ioaAdd');await click('ioaAdd');await click('ioaAdd');
  await p.evaluate(()=>{const set=(i,f,v)=>{const e=document.querySelector('#ioaTbl [data-i="'+i+'"][data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set(0,'sess','4');set(0,'a','5,5,10,10,15');set(0,'b','5,5,10,9,15');
    set(1,'sheet','co');set(1,'kind','count');set(1,'a','18');set(1,'b','20');
    set(2,'kind','bp');set(2,'a','15');set(2,'b','15');});await sleep(200);
  const io=await p.evaluate(()=>({p:[0,1,2].map(i=>document.getElementById('ioaP'+i).textContent),out:document.getElementById('ioaOut').textContent,hint:document.getElementById('ioaTbl').closest('.ioa-box').textContent.replace(/\s+/g,' ')}));
  ok('10 agreement per ratio step: 4 of 5 steps agree, 80%; counts 18 and 20, 90%; break points the same, 100%; the mean and range',io.p[0]==='80% (4 of 5 steps)'&&io.p[1]==='90%'&&io.p[2]==='100% (same)'&&io.out==='3 checks: mean 90% (range 80–100%).',io);
  ok('11 the methods are named with their sources',/DeLeon et al\., 2009, p\. 731/.test(io.hint)&&/Roscoe et al\., 1999, p\. 485/.test(io.hint)&&/Roane et al\., 2001, p\. 148/.test(io.hint)&&/Fisher et al\., 1992, p\. 493/.test(io.hint),io.hint);
  /* saved with the file, back on opening */
  const dlP=p.waitForEvent('download',{timeout:15000});await click('saveBtn');const dl=await dlP;const d=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  ok('12 the file keeps the checks, the baseline rows and the three times',Array.isArray(d.ioa)&&d.ioa.length===3&&d.ioa[0].kind==='step'&&d.ioa[1].kind==='count'&&d.co.filter(r=>r.cond==='bl').length===3&&d.so.some(r=>r.acc==='2'),{ioa:d.ioa,bl:d.co.filter(r=>r.cond==='bl').length});
  await p.setInputFiles('#fileIn',{name:'RA1_blank.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({form:'RA-1'}))});await sleep(900);
  const empty=await p.evaluate(()=>document.querySelectorAll('#ioaTbl tbody tr').length);
  await p.setInputFiles('#fileIn',{name:'RA1_test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(900);
  const back=await p.evaluate(()=>({n:document.querySelectorAll('#ioaTbl tbody tr').length,p0:document.getElementById('ioaP0').textContent,bl:[...document.querySelectorAll('#coTbl select[data-f="cond"]')].filter(s=>s.value==='bl').length}));
  ok('13 opening the file shows the checks and the baseline rows again',empty===0&&back.n===3&&back.p0==='80% (4 of 5 steps)'&&back.bl===3,{empty,back});
  /* an old file without the new fields opens */
  const old=JSON.parse(JSON.stringify(d));delete old.ioa;old.co.forEach(r=>delete r.cond);old.so.forEach(r=>{delete r.acc;delete r.tot;});
  await p.setInputFiles('#fileIn',{name:'RA1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await sleep(900);
  const o2=await p.evaluate(()=>({ioa:document.querySelectorAll('#ioaTbl tbody tr').length,notes:document.querySelectorAll('#coNotes li').length,acc:document.querySelector('#soTbl [data-k="0"][data-f="acc"]').value}));
  ok('14 a file from before v22.65 opens: no checks, no baseline note, empty access cells',o2.ioa===0&&o2.acc===''&&o2.notes<=1,o2);
  /* the attribution */
  const body=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('15 the attribution: Fisher et al. (1992) measured time with each stimulus; the response-count stations follow Roscoe et al. (1999)',/they measured the share of session time spent with each stimulus \(in a square or a chair\), and the response-count stations here follow Roscoe et al\. \(1999\)/.test(body));
  /* printed: the single-operant table fits the page */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-so';});
  await p.emulateMedia({media:'print'});await p.setViewportSize({width:730,height:1000});await sleep(400);
  const fit=await p.evaluate(()=>{const t=document.getElementById('soTbl'),w=t.closest('.gridwrap')||t.parentNode;return {t:t.scrollWidth,w:w.clientWidth};});
  ok('16 printed, the single-operant table fits the page width',fit.t<=fit.w+1,fit);
  await p.emulateMedia({media:'screen'});
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('17 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
