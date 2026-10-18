/* v22.61 Form AD-1 from DeLeon et al. (2014): the timing rule sets the primary rate (work time or total session time) and
   the graph follows it; the end rule "N responses or M minutes of work time, whichever comes first"; access earned per
   arrangement, flagged when it differs by more than 20%; the work time to complete all N; Tab 5's Phase column (card and
   task reversals) with a by-phase reading; a resume point for an activity with an end; a file saved before the Phase
   column opens with its choices in place. Simulated data only.
   usage: node qa/v2261-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html');await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(900);
  /* a choice row through the Add row button, as staff enter it */
  const addCC=rows=>p.evaluate(rows=>{rows.forEach(v=>{document.querySelector('[data-add="tbCC"]').click();const tb=document.getElementById('tbCC'),f=tb.rows[tb.rows.length-1].querySelectorAll('input,select');v.forEach((x,i)=>{f[i].value=x;});});adRefresh();},rows);
  const save=async()=>{const dlP=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('btnSave').click());const dl=await dlP;return JSON.parse(require('fs').readFileSync(await dl.path(),'utf8'));};
  const open=async d=>{await p.setInputFiles('#fileIn',{name:'AD1_test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(800);};
  const set=async(k,v)=>{await p.evaluate(([k,v])=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);await sleep(350);};
  const T=sel=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):'';},sel);
  const script=k=>p.evaluate(k=>{const c=[...document.querySelectorAll('#scriptOut .script-card')].find(c=>c.querySelector('h4').textContent===k);return c?c.textContent.replace(/\s+/g,' '):'';},k);
  /* 1-2 the timing rule */
  let sum=await T('#sumOut'),cmp=await T('#cmpOut');
  ok('1 work time only: the comparison reads responses per minute of work, marked primary in the table; Access earned is a column',/^Responses per minute of work \(the primary measure/.test(cmp)&&/Rate \/work minprimary/.test(sum)&&!/total minprimary/.test(sum)&&/Access earnedmin/.test(sum),{sum:sum.slice(0,300),cmp:cmp.slice(0,200)});
  await set('clock_rule','total');sum=await T('#sumOut');cmp=await T('#cmpOut');
  const g=await p.evaluate(()=>document.getElementById('gMeasure').value),dec=await T('#decSummary'),dis=await script('Distributed');
  ok('2 total session time: the comparison, the table, the graph and the decision read responses per minute of total session; the script keeps the clock running',/^Responses per minute of total session \(the primary measure/.test(cmp)&&/Resp\. \/total minprimary/.test(sum)&&!/work minprimary/.test(sum)&&g==='eff'&&/On responses per minute of total session/.test(dec)&&/Keep the session clock running through access and exchange\./.test(dis),{g,cmp:cmp.slice(0,160),dec:dec.slice(0,160),dis:dis.slice(0,400)});
  await set('clock_rule','work');
  ok('3 back to work time, the graph returns to the work rate',await p.evaluate(()=>document.getElementById('gMeasure').value)==='rate');
  /* 4 time to complete all N */
  cmp=await T('#cmpOut');
  ok('4 work time to complete all 10, from the sessions that completed all 10, fastest first (the 9-response session left out)',/Work time to complete all 10 \(sessions that completed all 10; access and exchange time left out\): Accumulated \+ tokens 4\.3 min \(5 sessions\), Accumulated 4\.5 min \(5 sessions\), Distributed 7\.6 min \(4 sessions\)\. DeLeon et al\. \(2014\) compared/.test(cmp),cmp);
  /* 5 access earned */
  ok('5 access earned nearly equal in the simulation: no flag',!/Access earned differed/.test(cmp),cmp.slice(0,600));
  await p.evaluate(()=>{[...document.querySelectorAll('#tbSess tr')].forEach(tr=>{const f=tr.querySelectorAll('input,select');if(f[2].value==='Distributed')f[7].value='120';});adRefresh();});await sleep(300);
  cmp=await T('#cmpOut');sum=await T('#sumOut');
  const disRow=await p.evaluate(()=>{const r=[...document.querySelectorAll('#sumOut tbody tr')].find(tr=>/^Distributed/.test(tr.textContent.trim()));return r?[...r.cells].map(c=>c.textContent.trim()):null;});
  ok('6 distributed earns 2 min against 5: flagged, with the history caution (p. 311) and the equal-access advice (p. 303)',disRow&&disRow[7]==='2.0'&&/Access earned differed/.test(cmp)&&/Distributed 2\.0 min/.test(cmp)&&/150% more than distributed/.test(cmp)&&/p\. 311/.test(cmp)&&/p\. 303/.test(cmp),{disRow,cmp:cmp.slice(0,900)});
  /* 7-8 the end rule */
  await set('w_mode','both');await set('w_time','5');
  const bl=await script('Baseline / control'),acc=await script('Accumulated'),tok=await script('Accumulated + tokens'),dis2=await script('Distributed');
  ok('7 whichever comes first: the scripts stop at the 10th response or 5 min of work time; the block is one unit per response, at most 5:00',/up to 10 times or for 5 min of work time, whichever comes first/.test(bl)&&/At the 10th response or 5 min of work time, whichever comes first: count the earned amount aloud \(one unit per response, at most 5:00\)/.test(acc)&&/exchange them for one unit per response, at most 5:00/.test(tok)&&/End the session at the 10th response or 5 min of work time, whichever comes first\./.test(dis2),{bl,acc,dis2});
  await set('x_rate','1.5');const proj=await T('#projOut');
  ok('8 the projection: at 1.5 a minute the 5-min cap comes first, about 8 responses and a 4:00 block',/the 5-min work-time cap comes first: about 8 responses a session, so the accumulated block is about 4:00 rather than 5:00/.test(proj),proj.slice(-700));
  const note=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('9 Section B says the rule DeLeon used (p. 299)',/Whichever comes first: DeLeon et al\. \(2014\) ended each session at 10 tasks or 5 min of work time/.test(note)&&/read their rate from the rule chosen here/.test(note));
  /* 10 resume point */
  const rf0=await T('#rfProfile');await set('r_resume','note the track and the lap');
  const acc2=await script('Accumulated'),rf1=await T('#rfProfile');
  ok('10 resume point: asked for while empty; once entered, every access step starts where the last block stopped',/record a resume point \(Section B\)/.test(rf0)&&!/record a resume point/.test(rf1)&&/Start it where the last block stopped \(note the track and the lap\) and note where this one stops\./.test(acc2),{rf0:rf0.slice(0,500),acc2});
  /* 11-12 reversals */
  const ph0=await p.evaluate(()=>[...document.querySelectorAll('#tbCC tr')].map(tr=>tr.querySelectorAll('select')[1].value));
  {const T='Accumulated + tokens',D='Distributed',R=[];for(let i=0;i<5;i++)R.push(['2026-09-24','Choice','Cards reversed',T,'Left','Completed','0','']);
    [T,D,D,D].forEach(x=>R.push(['2026-09-25','Choice','Tasks reversed',x,'Right','Completed','0','']));await addCC(R);await sleep(300);}
  const cc=await T('#ccOut');
  ok('11 the simulation\'s choices are the Standard phase; the reading by phase: the card reversal followed the arrangement, the task reversal did not',ph0.length===14&&ph0.every(v=>v==='Standard')&&/By phase \(Accumulated \+ tokens\): Standard 7 of 10 \(70%\); Cards reversed 5 of 5 \(100%\); Tasks reversed 1 of 4 \(25%\)/.test(cc)&&/Through the card reversal the choices followed the arrangement, not the card/.test(cc)&&/The choices changed when the tasks were swapped \(70% to 25% accumulated \+ tokens\)/.test(cc)&&/tasks of the same concept class/.test(cc),{ph0,cc:cc.slice(0,1200)});
  const steps=await T('#p5 .proc-steps');
  ok('12 Tab 5\'s steps: reversals, with the advice on less controlling cards and tasks of one concept class (p. 309)',/Reversals \(when one arrangement is chosen nearly every time\)/.test(steps)&&/less controlling stimuli in the initial links/.test(steps),steps.slice(-500));
  /* 13 an old file */
  const d0=await save();const d1=JSON.parse(JSON.stringify(d0));d1.tables.tbCC=[['2026-09-18','Choice','Distributed','Left','Completed','2','old file']];await open(d1);
  const old=await p.evaluate(()=>{const tr=document.querySelector('#tbCC tr');return {v:[...tr.querySelectorAll('input,select')].map(x=>x.value),cc:document.getElementById('ccOut').textContent};});
  ok('13 a file saved before the Phase column: the choice opens in place (blank phase read as Standard)',old.v.join('|')==='2026-09-18|Choice||Distributed|Left|Completed|2|old file'&&/Distributed1 of 1 \(100%\)/.test(old.cc),old);
  await addCC([['2026-09-19','Choice','Cards reversed','Accumulated','Center','Completed','0','']]);const d2=await save();await open(d2);
  const rt=await p.evaluate(()=>[...document.querySelectorAll('#tbCC tr')].map(tr=>tr.querySelectorAll('select')[1].value+'/'+tr.querySelectorAll('select')[2].value));
  ok('14 save and open keeps the phases',rt.join()==='/Distributed,Cards reversed/Accumulated',rt);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('15 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
