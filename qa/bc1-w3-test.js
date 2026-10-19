/* v22.7x Form BC-1, review Wave 3: the direction test reads how much reinforcement the changed setting delivers, with what the
   plan did as a separate list (F428); the verdict checks the baseline trend, overlap and immediacy before it speaks, and says
   "consistent with" (F429, F435, I217); a zero baseline is read on the rate itself (F431); a phase that disagrees with its date
   is named and an undated phase follows the date of the change (F432); the verdict goes to the case, Form PR-1 and Today, with
   a re-check date (F433, I216, I219); TI-1's integrity since the change against its criterion (F434); short phase labels (F436);
   the Direction card agrees with "Not a contrast test" (F437); a tally sheet (I219); the Guide (I220). Simulated data only.
   usage: node qa/bc1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1000):''));if(!c)fails++;};
const BC='BC-1_Behavioral-Contrast_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html';
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1100);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.print=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  let p=await open(BC);
  /* a case of rows: [phase, constant, changed, date] */
  const setCase=(rows,meta)=>p.evaluate(([rows,meta])=>{S=blank();S.meta=Object.assign({conName:'Specials (simulated)',chgName:'Room 12 (simulated)',conUnchanged:'Yes — nothing about this component was altered'},meta);
    S.rows=rows.map(r=>({d:r[3]||'',p:r[0]===1?PH[1]:r[0]===2?PH[2]:'',con:String(r[1]),chg:String(r[2]),n:''}));renderAll();
    const V=document.querySelector('#anVerdict .verdict');return {v:V?V.textContent:document.getElementById('anVerdict').textContent,cls:V?V.className:'',
      cards:[...document.querySelectorAll('#anMetrics .metric')].map(x=>[x.querySelector('b').textContent,x.querySelector('.val').textContent,x.querySelector('.sub').textContent]),
      sus:document.getElementById('susTbl').textContent,out:window.__nbhFactsOut(),mis:(document.getElementById('anMis')||{}).textContent||''};},[rows,meta]);
  const LESS='Less — the reinforcer comes less often, or less of it, than before',SAME='About the same overall';
  const rows=(b,c)=>b.map(v=>[1,v,6]).concat(c.map(v=>[2,v,1]));

  /* F436, F428: the form's questions */
  const q=await p.evaluate(()=>({ph:[...document.querySelectorAll('#dataTbl select')[0].options].map(o=>o.textContent),
    rf:[...document.querySelector('[data-m="chgRf"]').options].map(o=>o.textContent).filter(Boolean),proc:[...document.querySelectorAll('.bc-proc input[type=checkbox]')].map(e=>e.dataset.m),
    cond:!!document.querySelector('[data-m="chgCond"]')}));
  ok('1 F436 the phase choices are short ("Baseline", "After the change")',JSON.stringify(q.ph)==='["","Baseline","After the change"]',q.ph);
  ok('2 F428 the setup sheet asks how much reinforcement the changed setting delivers, and what the plan did there as ticks; the old mixed question is gone',
    q.rf.length===3&&/^Less/.test(q.rf[0])&&/^About the same/.test(q.rf[1])&&/^More/.test(q.rf[2])&&q.proc.join()==='pExt,pDra,pThin,pPun,pNcr'&&!q.cond,q);

  /* the simulation */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const sim=await p.evaluate(()=>({v:document.querySelector('#anVerdict .verdict').textContent,m:S.meta,ph:S.rows[0].p,cards:[...document.querySelectorAll('#anMetrics .metric')].map(x=>x.textContent)}));
  ok('3 F428, F435 the worked example: a plan that thins the breaks delivers less reinforcement, and the verdict reads "Consistent with positive contrast", with the checks',
    /^Consistent with positive contrast\. Specials and the cafeteria, where nothing was changed, rose by 54\.8% while Room 12 independent work delivered less reinforcement after the change/.test(sim.v)&&
    /a two-phase comparison cannot rule out other causes/.test(sim.v)&&/The checks: the baseline trend \(\+0\.06 a session\) carried on reaches 3\.33 against 4\.28 after the change; all 12 sessions after the change lie above the highest baseline session; the change was immediate/.test(sim.v)&&
    sim.m.chgRf===LESS&&sim.m.pExt==='1'&&sim.m.pDra==='1'&&sim.m.pThin==='1'&&sim.ph==='Baseline',sim);
  ok('4 F435 the worked conclusion says what a two-phase comparison can show',/^Consistent with positive contrast\./.test(sim.m.concl)&&/cannot rule it out/.test(sim.m.concl)&&!/rather than treatment failure or a second function/.test(sim.m.concl),sim.m.concl);
  ok('5 I217 the cards show the trend and overlap check',sim.cards.some(t=>/^Trend and overlap12 of 12sessions after the change beyond the baseline range; baseline trend \+0\.06 a session; immediate$/.test(t)),sim.cards);

  /* F429 a rising baseline is not called contrast */
  const r1=await setCase(rows([1,2,3],[4,5,6]),{chgRf:LESS});
  ok('6 F429 a baseline already rising (1, 2, 3, then 4, 5, 6) is "Not clear evidence of an interaction": its trend carried on reaches the mean after the change',
    /^Not clear evidence of an interaction\. Specials \(simulated\) rose by 150\.0%, but the baseline was already rising \(\+1\.00 a session\), and that trend carried on reaches 5\.00, at or above the mean after the change \(5\.00\)/.test(r1.v)&&/is not reported as contrast/.test(r1.v)&&r1.out.contrast.kind==='unclear',r1);
  const r2=await setCase(rows([2,5,2,5],[5,4,5,3]),{chgRf:LESS});
  ok('7 F429 post-change sessions mostly inside the baseline range are not called contrast either',/^Not clear evidence of an interaction\..*only 0 of the 4 sessions after the change \(0%\) lie above the highest baseline session/.test(r2.v),r2.v);

  /* F431 a zero baseline */
  const r3=await setCase(rows([0,0,0],[2,2,3]),{chgRf:LESS});
  ok('8 F431 from a baseline of zero the rise is read on the rate itself, with a verdict, the cards and the course',
    /^Consistent with positive contrast\. Specials \(simulated\), where nothing was changed, rose from 0 to 2\.33 \(from a baseline of zero, the change is read on the rate itself\)/.test(r3.v)&&
    r3.cards.find(c=>c[0]==='Direction')[1]==='Opposite'&&r3.cards.find(c=>c[0]==='Constant component')[2]==='baseline 0.00 → from 0 to 2.33'&&/\+2\.00 \(from 0\).*\+3\.00 \(from 0\).*Persisting/.test(r3.sus)&&r3.out.contrast.change==='from 0 to 2.33',r3);
  const r3b=await setCase(rows([0,0,0],[0,0,0]),{chgRf:LESS});
  ok('9 F431 zero before and after: no appreciable interaction',/^No appreciable interaction: Specials \(simulated\) stayed at 0/.test(r3b.v)&&/No rate above zero in either block/.test(r3b.sus),r3b);

  /* F428 DRA/FCT that keeps the reinforcer coming */
  const r4=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:SAME,pExt:'1',pDra:'1'});
  ok('10 F428 extinction with FCT keeping the reinforcer as frequent: no direction test, and the rise points first to the behavior still working there',
    /^No direction test\. The setup sheet records the reinforcement in Room 12 \(simulated\) as about the same/.test(r4.v)&&/With DRA or FCT keeping the reinforcer in Room 12 \(simulated\) as frequent as before, or more, positive contrast is not expected/.test(r4.v)&&/the behavior still produces its reinforcer there/.test(r4.v),r4.v);
  const r4b=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS,pExt:'1',pDra:'1'});
  ok('11 F428 the same data with less reinforcement: consistent with positive contrast, without that note',/^Consistent with positive contrast/.test(r4b.v)&&!/not expected/.test(r4b.v),r4b.v);

  /* F437 */
  const r5=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS,conUnchanged:'No — something changed here too'});
  const dir5=r5.cards.find(c=>c[0]==='Direction');
  ok('12 F437 "Not a contrast test": the Direction card says Not tested, why beneath it',/^Not a contrast test\./.test(r5.v)&&dir5[1]==='Not tested'&&dir5[2]==='something changed in the constant component too'&&r5.out.contrast.kind==='untested',{v:r5.v,dir5});

  /* F432 */
  const r6=await setCase([[2,3,6,'9/4/26'],[2,3,6,'9/5/26'],[2,2,6,'9/8/26'],[2,5,1,'9/22/26'],[2,6,1,'9/23/26'],[2,5,1,'9/24/26']],{chgRf:LESS,chgDate:'9/20/26'});
  ok('13 F432 rows labelled after the change but dated before it are named under the verdict',/^Rows 1, 2, 3: the phase disagrees with the date\. The date of the change on the setup sheet is 9\/20\/2026/.test(r6.mis),r6.mis);
  const r7=await p.evaluate(()=>{S=blank();S.meta={chgDate:'9/20/26'};S.rows=[{d:'',p:'',con:'',chg:'',n:''},{d:'',p:'',con:'',chg:'',n:''}];renderAll();
    const set=(i,v)=>{const e=document.querySelector('#dataTbl input[data-i="'+i+'"][data-f="d"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set(0,'9/18/26');set(1,'9/21/26');return {p:S.rows.slice(0,2).map(r=>r.p),sel:[...document.querySelectorAll('#dataTbl select')].slice(0,2).map(s=>s.value),rest:S.rows.slice(2).every(r=>!r.p)};});
  ok('14 F432 a row dated with no phase takes it from the date of the change (an undated row is left alone)',JSON.stringify(r7.p)==='["Baseline","After the change"]'&&JSON.stringify(r7.sel)===JSON.stringify(r7.p)&&r7.rest,r7);

  /* F436 an old file opens with the short labels; F428 its old answer is read, and the verdict asks for the new one */
  const r8=await p.evaluate(()=>{const d={form:'BC-1',rev:'2026-09',S:{meta:{conName:'Specials (simulated)',chgName:'Room 12 (simulated)',chgCond:'Worse — reinforcement reduced, extinction introduced, or punishment added',conUnchanged:'Yes — nothing about this component was altered'},
    rows:[2,3,2,3].map(v=>({d:'',p:'Baseline (before the change)',con:String(v),chg:'6',n:''})).concat([5,6,5,6].map(v=>({d:'',p:'After the change',con:String(v),chg:'1',n:''})))}};
    const n=readSaved(d);S=n;renderAll();return {p:S.rows[0].p,v:document.querySelector('#anVerdict .verdict').textContent,dir:document.querySelectorAll('#anMetrics .metric .sub')[3].textContent};});
  ok('15 F436, F428 a file saved before: "Baseline (before the change)" opens as Baseline; its old answer is read and the verdict asks for the new question',
    r8.p==='Baseline'&&/^Consistent with positive contrast/.test(r8.v)&&/This record answers the earlier question \(conditions worse or better\)/.test(r8.v)&&r8.dir==='constant against the change in conditions (the earlier question)',r8);

  /* F433, I219: the re-check date on the due list; the facts out */
  const r9=await p.evaluate(()=>{S.meta.next='11/16/26';renderAll();return {due:nbhCase.due(),out:nbhCase.out()};});
  ok('16 F433 the re-check date goes to the workstation\'s due list, and the verdict to the case',r9.due.some(x=>x.what==='Re-check due'&&x.date==='11/16/26')&&r9.out.contrast&&r9.out.contrast.recheck==='2026-11-16'&&r9.out.contrast.kind==='positive'&&r9.out.contrast.headline==='Consistent with positive contrast',r9);

  /* I216, F434: from the case */
  await p.evaluate(()=>{S=blank();renderAll();});
  const CASE={data:{conds:[{name:'Baseline',from:'2026-09-01'},{name:'FCT + extinction',from:'2026-09-21'}]},plan:{respond:{target:'Extinction: no escape after aggression (simulated)'},sched:['FR 1 (break card)'],src:'TD-1'},
    fn:{key:'escape',label:'Escape from independent work'},integrity:{obs:[{date:'2026-09-14',pct:70},{date:'2026-09-25',pct:95.5},{date:'2026-10-01',pct:80}],overall:81.8,criterion:90,src:'TI-1'}};
  const r10=await p.evaluate(C=>{const r=window.__nbhFactsIn(C);const g=k=>document.querySelector('[data-m="'+k+'"]').value;return {r,chgDate:g('chgDate'),chgAfter:g('chgAfter'),r_int:g('r_int'),hint:document.querySelector('[data-m="r_fn"]').placeholder};},CASE);
  ok('17 I216 the date of the change from DD-1\'s second condition, the plan after it from TD-1, the function as a hint',
    r10.chgDate==='9/21/2026'&&r10.chgAfter==='Extinction: no escape after aggression (simulated); schedule: FR 1 (break card) (Form TD-1)'&&/^Form FS-1 found: Escape from independent work\./.test(r10.hint),r10);
  ok('18 F434 the integrity line reads TI-1 since the change: the lowest and the latest, and the criterion one is under',
    r10.r_int==='Treatment integrity since the change: lowest 80% on 2026-10-01, latest 80% on 2026-10-01 over 2 TI-1 observations; under the 90% criterion',r10.r_int);
  const r11=await setCase([[1,2,6,'9/8/26'],[1,3,6,'9/9/26'],[1,2,6,'9/10/26'],[2,5,1,'9/22/26'],[2,6,1,'9/23/26'],[2,5,1,'9/24/26']],{chgRf:LESS,chgDate:'9/21/2026'});
  ok('19 F434 under the verdict: TI-1\'s latest observation since the change is under its criterion',/Form TI-1’s latest observation since the change, 80% on 10\/1\/2026, is under its 90% criterion/.test(r11.v),r11.v);

  /* I219 the tally sheet */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(700);
  const t=await p.evaluate(()=>{let printed=0;window.print=()=>{printed++;};document.getElementById('tallyBtn').click();const el=document.getElementById('bcTally');
    return {printed,on:document.body.classList.contains('bc-tally-on'),txt:el.textContent.replace(/\s+/g,' '),rows:el.querySelectorAll('.bc-tallytbl tbody tr').length};});
  await p.emulateMedia({media:'print'});
  const tv=await p.evaluate(()=>({tally:getComputedStyle(document.getElementById('bcTally')).display,setup:getComputedStyle(document.querySelector('section.only-setup')).display}));
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));const off=await p.evaluate(()=>({on:document.body.classList.contains('bc-tally-on'),tally:getComputedStyle(document.getElementById('bcTally')).display}));
  await p.emulateMedia({media:'screen'});
  ok('20 I219 Print a tally sheet: one page for the constant component\'s staff, printed alone, with the behavior, how to count it, whom to return it to and by when, and a row a day',
    t.printed===1&&t.on&&/Tally Sheet: Specials and the cafeteria/.test(t.txt)&&/Behavior to count\s*Aggression toward staff \(simulated\)/.test(t.txt)&&/Return to\s*Jordan Ellis, M\.A\., BCBA \(simulated\) by \d+\/\d+\/\d{4}/.test(t.txt)&&
    /respond to the behavior the way you always have/.test(t.txt)&&t.rows===14&&tv.tally==='block'&&tv.setup==='none'&&!off.on&&off.tally==='none',{t,tv,off});

  /* I220 the Guide */
  const g=await p.evaluate(()=>({bands:[...document.querySelectorAll('section.only-guide h2.nbh-band')].map(h=>h.textContent),lab:(document.querySelector('details.bc-lab')||{}).className||'',
    labRows:document.querySelectorAll('details.bc-lab tr').length,school:/In a school/.test(document.querySelector('section.only-guide').textContent)}));
  ok('21 I220 the Guide keeps what a school case uses ("What Matters for a School Case"); the laboratory detail is folded away and does not print',
    g.bands.includes('What Matters for a School Case')&&!g.bands.includes('What the Early Work Established')&&/noprint/.test(g.lab)&&g.labRows===3&&g.school,g);
  await p.close();

  /* F433 in the workstation: the case, PR-1 and Today */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await sh.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  await sh.evaluate(()=>openForm('BC-1'));await sh.waitForFunction(()=>!!state.status['BC-1'],null,{timeout:30000});await sleep(1200);
  const bc=sh.frames().find(f=>/BC-1_Behavioral/.test(f.url()));await bc.evaluate(()=>{if(window.nbhUI)nbhUI.confirm=async()=>true;});await bc.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
  await sh.evaluate(()=>gatherFacts(true));await sleep(1200);
  const c=await sh.evaluate(()=>({c:(state.facts||{}).contrast,src:((state.facts||{}).src||{}).contrast,today:todayItems().filter(x=>x.open==='BC-1').map(x=>x.k+': '+x.t)}));
  ok('22 F433 the workstation takes BC-1\'s verdict into the case, and Today names the rise in the untreated setting',
    c.c&&c.c.kind==='positive'&&c.src==='BC-1'&&c.today.some(t=>/^Decision: <b>Form BC-1<\/b>: Consistent with positive contrast in Specials and the cafeteria \(\+54\.8%\); persisting\. Extend the plan/.test(t)),c);
  await sh.evaluate(()=>openForm('PR-1'));await sh.waitForFunction(()=>!!state.status['PR-1'],null,{timeout:30000});await sleep(2000);
  const pr=sh.frames().find(f=>/PR-1_Periodic/.test(f.url()));
  const pl=await pr.evaluate(()=>{const el=document.getElementById('prContrast');return el?{h:el.hidden,t:el.textContent,after:el.previousElementSibling&&el.previousElementSibling.id}:null;});
  ok('23 F433 Form PR-1 shows the verdict under "What Did the Behavior Do?", with the course, the re-check date and the action',
    pl&&pl.h===false&&pl.after==='dataMetrics'&&/^The untreated setting \(Form BC-1\): Consistent with positive contrast in Specials and the cafeteria \(\+54\.8% against its baseline\)\. Course: Persisting\. Re-check due \d+\/\d+\/\d{4}\. Action: Extend the plan/.test(pl.t)&&/weigh extending the plan to Specials and the cafeteria/.test(pl.t),pl);
  const re=await sh.evaluate(()=>{const s0=state.due;state.due=[];const f=state.facts;const keep=f.contrast;const d=new Date();d.setDate(d.getDate()+3);
    f.contrast=Object.assign({},keep,{recheck:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')});
    const a=todayItems().filter(x=>x.k==='Timeline'&&x.open==='BC-1').map(x=>x.t);state.due=[{id:'BC-1',what:'Re-check due',d:new Date(),n:3}];const b=todayItems().filter(x=>x.k==='Timeline'&&x.open==='BC-1').length;f.contrast=keep;state.due=s0;return {a,b};});
  ok('24 F433 a re-check due within a week is on Today, once (not when BC-1 already lists it as due)',re.a.length===1&&/^Run Form BC-1 again by \d+\/\d+: does the change in Specials and the cafeteria persist\?$/.test(re.a[0])&&re.b===0,re);
  await sh.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('99 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
