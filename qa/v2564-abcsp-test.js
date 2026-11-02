/* v25.64 the measurement review (approved by the BCBA, 11/2), Forms ABC-1 and SP-1.
   ABC-1: H6 agreement computed from observer 2's file (incidents matched by start time within a tolerance, the four units,
   each section's codes, kappa for codes ticked on 5 matched incidents or more, the codes that disagree most, a "do not
   interpret" banner); M1 kappa beside the percentages; H7 the IOA log by condition, the coverage flags and the drift check;
   M4 the observer checked against a scored example and the blind second observer; M6 the correspondence figures and "not
   supported by this record", never "ruled out"; M7 structured descriptive probes read apart from the naturalistic record;
   L1 a consequence that came later, counted on its own; a saved file without any of it opens as before.
   SP-1: M8 the short-record screen corrected by Holm's method, the chance line and "may cluster"; M9 the same level carried,
   occurrence agreement carried when few cells are marked, the days with IOA; M1 kappa; H7 coverage and the default; M4 the
   observer's check and the blind tick; L5 the decision line after a pattern; a saved figure is kept as saved.
   Simulated people only. usage: node qa/v2564-abcsp-test.js (WS_URL as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const ABC='/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html',SP='/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'});
  await ctx.addInitScript(()=>{let s=4242;Math.random=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};});
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(file+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(L.BASE+file);await sleep(1300);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__toasts=[];if(window.nbhUI){nbhUI.confirm=async()=>true;const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{t0&&t0(m,o);}catch(e){}};}
      window.__dl=null;if(typeof download==='function')window.download=(nm,t)=>{window.__dl=t;};window.print=()=>{};});return p;};
  const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' '):'';},sel);

  /* =============================== ABC-1 =============================== */
  let p=await open(ABC);
  await p.evaluate(async()=>{document.getElementById('load-demo').click();await new Promise(r=>setTimeout(r,1000));});
  /* an old file: the simulated record saved, with nothing of v25.64 in it */
  const old=await p.evaluate(()=>{exportJSON();const d=JSON.parse(window.__dl);return {d,keys:['probes','ioaLog','obsCheck','ioaCalc','ioaBlind'].filter(k=>k in d)};});
  ok('ABC saved case: a record with nothing new saves none of the new keys',old.keys.length===0,old.keys);
  /* observer 2's file: the same record with one incident dropped, one added, and a consequence code changed on several */
  const obs2=JSON.parse(JSON.stringify(old.d));
  const drop=obs2.entries.splice(3,1)[0];
  obs2.entries.push(Object.assign({},obs2.entries[0],{id:'xadd',time:'06:01',consequences:['c_staff_att']}));
  let changed=0;obs2.entries.forEach((e,i)=>{if(i<40&&(e.consequences||[]).includes('c_dem_rem')){e.consequences=e.consequences.filter(c=>c!=='c_dem_rem').concat(['c_dem_stay']);changed++;}});
  obs2.header.observer='Second observer (simulated), paraprofessional';
  const f2=path.join(os.tmpdir(),'v2564-obs2-'+process.pid+'.json');fs.writeFileSync(f2,JSON.stringify(obs2));
  await p.evaluate(()=>switchTab('methods'));await sleep(200);
  await p.setInputFiles('#ioa-file2',f2);await sleep(900);
  const c1=await p.evaluate(()=>{const C=state.ioaCalc;return C&&{oa:C.oa,od:C.od,na:C.na,nd:C.nd,cons:C.sections.consequences,codes:C.codes.map(c=>c.label+':'+c.k.toFixed(3)),worst:C.worst.map(w=>w.label),tol:C.tol,minute:C.minuteOnly,
    html:document.getElementById('ioa-calc').textContent.replace(/\s+/g,' '),N:state.entries.length,S:state.samples.length};});
  ok('H6 Open observer 2\'s file matches the incidents (one only in each file) and the checks, at ±15 s, to the whole minute for typed times',c1&&c1.oa===c1.N-1&&c1.od===2&&c1.na===c1.S&&c1.nd===0&&c1.tol===15&&c1.minute>0&&/within ±15 s/.test(c1.html)&&/matched on the whole minute/.test(c1.html),c1&&Object.assign({},c1,{html:c1.html.slice(0,300)}));
  ok('H6 the codes are compared section by section; the changed consequence code disagrees most and is named for job aid D',c1&&c1.cons.D>=changed*2-1&&c1.cons.p<1&&c1.worst.length>=1&&/Demand removed\/avoided|Demand remained in place/.test(c1.worst.slice(0,2).join('|'))&&/Codes that disagree most/.test(c1.html)&&/job aid D/.test(c1.html),c1&&{cons:c1.cons,worst:c1.worst,changed});
  const kap=await p.evaluate(()=>({k:abcV2564.kappa(20,5,5,70),k0:abcV2564.kappa(0,0,0,10)}));
  ok('M1 kappa = (observed − chance) ÷ (1 − chance): 20/5/5/70 gives .733; a table with nothing ticked gives none',Math.abs(kap.k-0.7333)<0.001&&kap.k0===null,kap);
  ok('M1 kappa shows beside each section\'s figure and for each code ticked on 5 matched incidents, with Hartmann\'s .60 named as a suggestion, not a cut-off',c1&&c1.codes.length>=2&&/Kappa/.test(c1.html)&&/Code ticked on 5 matched incidents or more/.test(c1.html)&&/Hartmann \(1977\) suggested it exceed \.60; that is his suggestion, not a validated cut-off/.test(c1.html),c1&&c1.codes);
  const ban=await p.evaluate(()=>{switchTab('analysis');renderAnalysis();const b=document.querySelector('#analysis-out .abc-dni');return {bad:abcIoaBad(),b:b?b.textContent.replace(/\s+/g,' '):'',first:document.querySelector('#analysis-out').firstElementChild===b||document.querySelector('#analysis-out > .abc-dni')!==null};});
  ok('H6 the Analysis tab carries a "do not interpret" banner when the consequence codes agree under 80% or a consequence kappa is under .60',ban.bad&&/^Do not interpret this analysis yet\./.test(ban.b.trim())&&/consequence codes agree on|kappa is under \.60/.test(ban.b),ban);
  const use=await p.evaluate(()=>{switchTab('methods');document.getElementById('ioa-use2').click();const s=abcIoaSum();return {oa:document.getElementById('ioa-oa').value,od:document.getElementById('ioa-od').value,na:document.getElementById('ioa-na').value,text:s&&s.text};});
  ok('H6 Use these counts fills the four fields, and the summary for the print and Form FS-1 names the codes compared and the tolerance',use.oa===String(c1.oa)&&use.od==='2'&&use.na===String(c1.na)&&/codes compared from the two files \(±15 s\): antecedent [\d.]+%.*consequence [\d.]+%/.test(use.text||''),use);
  /* a tolerance in seconds: two start times 30 s apart in the same minute do not match at ±15 s, and do at ±40 s */
  const tolT=await p.evaluate(()=>{const e1=[{date:'2026-10-01',time:'09:00',sec:5,behaviors:['b_scream'],consequences:[]}],e2=[{date:'2026-10-01',time:'09:00',sec:35,behaviors:['b_scream'],consequences:[]}];
    const keep={e:state.entries,s:state.samples};state.entries=e1;state.samples=[];
    try{const a=abcV2564.compare({entries:e2,samples:[]},15,'x'),b=abcV2564.compare({entries:e2,samples:[]},40,'x');return {a:[a.oa,a.od],b:[b.oa,b.od]};}finally{state.entries=keep.e;state.samples=keep.s;}});
  ok('H6 start times kept to the second: 30 s apart is two incidents at ±15 s and one at ±40 s',tolT.a[0]===0&&tolT.a[1]===2&&tolT.b[0]===1&&tolT.b[1]===0,tolT);
  /* H7 the IOA log by condition */
  const log=await p.evaluate(()=>{document.getElementById('ioa-who').value='Second observer A';document.getElementById('ioa-log-add2').click();
    const t1=document.getElementById('ioa-log').textContent.replace(/\s+/g,' ');
    state.ioaLog.push({dates:[state.entries[5].date],cond:'',who:'Second observer B',occ:0.99,non:1,overall:0.99,cons:null,blind:false});
    state.ioaLog.push({dates:[state.entries[9].date],cond:'',who:'Second observer B',occ:0.98,non:1,overall:0.98,cons:null,blind:false});
    state.ioaLog.push({dates:[state.entries[12].date],cond:'',who:'Second observer A',occ:0.70,non:0.9,overall:0.85,cons:null,blind:false});
    const V=abcIoaCoverage();document.getElementById('ioa-calc');return {t1,rows:V.rows,drift:V.drift,pairs:V.pairRows};});
  const nat=log.rows.find(r=>r.k==='');
  ok('H7 the IOA log shows sessions with IOA out of sessions observed in each condition, flagged under 20%',/IOA by condition/.test(log.t1)&&/Naturalistic/.test(log.t1)&&/\d+ of \d+/.test(log.t1)&&nat&&nat.tot>=10&&(nat.ioa/nat.tot<0.2?/under 20%/.test(log.t1):true)&&/The default\. IOA on at least a quarter to a third of sessions in every condition/.test(log.t1),{t1:log.t1.slice(0,400),nat});
  ok('H7 agreement by second observer, and "possible drift" when one pairing runs 10 points or more above the others',log.pairs.length===2&&log.drift.some(d=>/Second observer B/.test(d)&&/10 points or more above the others/.test(d)),log);
  /* M4 the observer checked against a scored example; the blind second observer */
  const m4=await p.evaluate(()=>{switchTab('record');const d=document.getElementById('h-chkDate'),x=document.getElementById('h-chkEx'),c=document.getElementById('h-chkPct');
    const t0=document.getElementById('abcChkNote').textContent;
    d.value='2026-01-05';d.dispatchEvent(new Event('change',{bubbles:true}));x.value='video';x.dispatchEvent(new Event('change',{bubbles:true}));c.value='85';c.dispatchEvent(new Event('input',{bubbles:true}));
    const t1=document.getElementById('abcChkNote').textContent;
    const b=document.getElementById('ioa-blind');b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));
    fillPrintHeader();const pr=document.getElementById('print-header').textContent.replace(/\s+/g,' ');exportJSON();const j=JSON.parse(window.__dl);return {t0,t1,pr,chk:j.obsCheck,blind:j.ioaBlind,sum:abcIoaSum().text};});
  ok('M4 the header records the check against a scored example; under 90% and older than 6 weeks are flagged; supervisors are told what to feed back',/not recorded/.test(m4.t0)&&/under 90% correct/.test(m4.t1)&&/more than 6 weeks/.test(m4.t1)&&/feedback on their accuracy against the example, not on whether the data look as hoped/.test(m4.t1),m4);
  ok('M4 the check and the blind tick are saved, printed with the record and named in the agreement line',m4.chk&&m4.chk.pct==='85'&&m4.chk.ex==='video'&&m4.blind===true&&/Observer checked against a scored example1\/5\/2026, a scored video, 85% correct/.test(m4.pr)&&/did not know the phase or the change expected/.test(m4.sum),m4);
  /* M6 */
  const m6=await p.evaluate(()=>{state.ioaCalc=null;switchTab('analysis');renderAnalysis();const c=[...document.querySelectorAll('#analysis-out .card')].find(x=>/Reading the record as a whole/.test(x.querySelector('h2').textContent));
    const m=[...document.querySelectorAll('#methods-out .card')].find(x=>/What this method supports/.test(x.querySelector('h2').textContent));return {c:c?c.textContent.replace(/\s+/g,' '):'',m:m?m.textContent.replace(/\s+/g,' '):''};});
  ok('M6 the record as a whole prints the correspondence figures (219 comparisons, 50%, 39% against 37%) and better at ruling out than in',/Across 219 published comparisons, descriptive assessments matched the FA exactly about half the time \(ABC recording 50%\)\. Adding background or unconditional probabilities did not raise the match \(39%, against 37% for p\(C\|B\) alone\)\. Descriptive data were better at ruling a function out than in/.test(m6.c)&&/86%, 79%, 76% and 87%/.test(m6.m),{c:m6.c.slice(0,200)});
  ok('M6 a class with a low Q or none is "not supported by this record" with how often descriptive data miss it; "ruled out" is never written',/not supported by this record/.test(m6.c)&&/wrongly rule this function out about 1 time in [4-8]/.test(m6.c)&&!/ruled out/i.test(m6.c),m6.c.slice(-900));
  /* M7 structured descriptive probes */
  const m7=await p.evaluate(()=>{switchTab('record');const N0=analysisSet().coded.length;const d=state.entries[0].date;
    document.getElementById('pr-type').value='dem';document.getElementById('pr-date').value=d;document.getElementById('pr-time').value='09:00';document.getElementById('pr-min').value='10';document.getElementById('pr-stop').value='';
    document.getElementById('pr-add').click();const refused=state.probes.length===0;
    document.getElementById('pr-stop').value='End after 2 incidents';document.getElementById('pr-add').click();
    clearForm();document.getElementById('e-date').value=d;document.getElementById('e-time').value='09:04';document.getElementById('e-time').dispatchEvent(new Event('change',{bubbles:true}));
    const pre=document.getElementById('e-probe').value;
    document.getElementById('b-b_scream').checked=true;document.getElementById('c-c_dem_rem').checked=true;document.getElementById('lt-attention').checked=true;
    document.getElementById('save-entry').click();const e=state.entries.find(x=>x.probe);
    switchTab('analysis');renderAnalysis();const N1=analysisSet().coded.length;const c=[...document.querySelectorAll('#analysis-out .card')].find(x=>/Structured descriptive probes/.test(x.querySelector('h2').textContent));
    const inc=document.getElementById('inc-table').textContent;return {refused,np:state.probes.length,pre:pre===state.probes[0].id,tag:!!e,later:e&&e.later,N0,N1,c:c?c.textContent.replace(/\s+/g,' '):'',inc:/probe: demand presented/.test(inc)};});
  ok('M7 a probe needs a stop rule; an incident in its time is offered it as its session, tagged, and listed with it',m7.refused&&m7.np===1&&m7.pre&&m7.tag&&m7.inc,m7);
  ok('M7 the probe\'s incidents are left out of the naturalistic figures and its rate is shown beside them, with the safeguards',m7.N1===m7.N0&&/A demand presented/.test(m7.c)&&/Per hour/.test(m7.c)&&/Never instruct staff to deliver the suspected reinforcer after the behavior/.test(m7.c)&&/61% of comparisons, against 50% for ABC recording/.test(m7.c),{N0:m7.N0,N1:m7.N1,c:m7.c.slice(0,300)});
  /* L1 a consequence that came later */
  const l1=await p.evaluate(()=>{document.getElementById('a-behavior').value='';state.aPooled=true;clearForm();switchTab('record');document.getElementById('b-b_scream').checked=true;document.getElementById('lt-escape').checked=true;document.getElementById('save-entry').click();
    const e=state.entries.filter(x=>x.later&&x.later.includes('escape')&&!x.probe);switchTab('analysis');renderAnalysis();
    const c=[...document.querySelectorAll('#analysis-out .card')].find(x=>/Consequences that came later/.test(x.querySelector('h2').textContent));
    const cls=[...document.querySelectorAll('#analysis-out .card')].find(x=>/^By reinforcer class/.test(x.querySelector('h2').textContent));
    return {n:e.length,c:c?c.textContent.replace(/\s+/g,' '):'',after:!!(cls&&c&&cls.nextElementSibling===c),cleared:!document.getElementById('lt-escape').checked};});
  ok('L1 "came later" is saved with the incident, cleared from the form, and counted on its own after the class card, never pooled',l1.n===1&&l1.cleared&&/Escape\/avoidance\s*1 of \d+/.test(l1.c)&&/never pooled with the consequences scored within the window/.test(l1.c)&&/Samaha et al\. \(2009\)/.test(l1.c)&&l1.after,l1);
  /* a saved file with the new parts opens with them; the old file opens without them */
  const rt=await p.evaluate(()=>{exportJSON();return window.__dl;});const f3=path.join(os.tmpdir(),'v2564-rt-'+process.pid+'.json');fs.writeFileSync(f3,rt);
  const f4=path.join(os.tmpdir(),'v2564-old-'+process.pid+'.json');fs.writeFileSync(f4,JSON.stringify(old.d));
  const p2=await open(ABC);await p2.setInputFiles('#file-input',f3);await sleep(900);
  const back=await p2.evaluate(()=>({probes:state.probes.length,log:state.ioaLog.length,chk:document.getElementById('h-chkPct').value,blind:document.getElementById('ioa-blind').checked,tagged:state.entries.filter(e=>e.probe).length,later:state.entries.filter(e=>e.later).length}));
  ok('a file with probes, the IOA log, the check and the blind tick opens with all of them',back.probes===1&&back.log===4&&back.chk==='85'&&back.blind&&back.tagged===1&&back.later===2,back);
  await p2.setInputFiles('#file-input',f4);await sleep(900);
  const back2=await p2.evaluate(()=>{switchTab('analysis');renderAnalysis();fillPrintHeader();return {probes:state.probes.length,log:state.ioaLog.length,calc:state.ioaCalc,chk:document.getElementById('h-chkPct').value,N:state.entries.length,oa:document.getElementById('ioa-oa').value,
    dni:!!document.querySelector('#analysis-out .abc-dni'),pr:document.getElementById('print-header').textContent.replace(/\s+/g,' ')};});
  ok('saved case: a file from before v25.64 opens as before (its counts, no probes, no log, no banner) and prints the check as not recorded',back2.probes===0&&back2.log===0&&back2.calc===null&&back2.chk===''&&back2.N===old.d.entries.length&&back2.oa===String(old.d.ioa.oa)&&!back2.dni&&/Observer checked against a scored examplenot recorded/.test(back2.pr),back2);
  await p2.close();await p.close();
  [f2,f3,f4].forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});

  /* =============================== SP-1 =============================== */
  p=await open(SP);
  await p.evaluate(async()=>{await loadSim();await new Promise(r=>setTimeout(r,400));document.querySelector('#viewSeg button[data-view="control"]').click();});await sleep(400);
  const m8=await p.evaluate(()=>{const a=controlData(),S=spScreenData(a),t=document.getElementById('ctlBody').textContent.replace(/\s+/g,' ');
    const ord=S.rows.slice().sort((x,y)=>x.P-y.P);let okH=true,stop=false;ord.forEach((x,i)=>{const need=0.05/(ord.length-i);const pass=!stop&&x.P<need;if(!pass)stop=true;if(x.holm!==pass)okH=false;if(Math.abs(x.need-need)>1e-12)okH=false;});
    return {okH,N:S.tested,flag:S.flagged.length,poss:S.possible.length,allRawOrFlag:S.flagged.every(x=>x.raw&&x.holm),t};});
  ok('M8 the screen applies Holm\'s step-down across the intervals tested; an interval flagged only before it is kept as possible',m8.okH&&m8.allRawOrFlag&&/corrected for testing \d+ intervals at once \(Holm’s step-down method/.test(m8.t)&&(m8.poss?/Possible \(under \.05 on its own, not after the correction\)/.test(m8.t):true),m8);
  ok('M8 the screen says how many would be flagged by chance alone, and the verdict reads "may cluster", a window to observe',new RegExp('With '+m8.N+' intervals tested, about [\\d.]+ would be flagged by chance alone').test(m8.t)&&(m8.flag?/Pattern verdict: the behavior may cluster in \d+ intervals? — .* —; treat (it|them) as a window to observe with Form ABC-1 or Form OB-1, not as a pattern/.test(m8.t):/Pattern verdict: no interval stands out/.test(m8.t))&&!/the behavior clusters in/.test(m8.t),m8.t.slice(m8.t.indexOf('Short-record'),m8.t.indexOf('Short-record')+900));
  /* a synthetic check of the correction: 16 intervals each at p = .01 on its own pass Holm only while p < .05 / (16 - i) */
  const hs=await p.evaluate(()=>{const fake={d:{cellsObs:100,marked:10,nR:3,perRow:[{obs:5,low:4,high:0},{obs:5,low:3,high:0},{obs:5,low:0,high:0}],rows:['a','b','c']}};const S=spScreenData(fake);return S.rows.map(x=>({r:x.r,P:+x.P.toFixed(4),raw:x.raw,flag:x.flag}));});
  ok('M8 Holm on a small case: the smallest p is held to .05 ÷ 3, the next to .05 ÷ 2',hs.length===3&&hs[0].flag===(hs[0].P<0.05/3)&&hs[1].raw===(hs[1].P<0.05)&&(hs[1].flag===(hs[0].flag&&hs[1].P<0.025)),hs);
  /* M9, M1 the second observer */
  const m9=await p.evaluate(()=>{const R=spIoa(),C=spIoaCarry(R),note=document.getElementById('ioaNoteP').textContent,cov=document.getElementById('ioaCovP').textContent;
    const nn=R.n,a1=R.marked1/nn,a2=R.marked2/nn,pe=a1*a2+(1-a1)*(1-a2),k=(R.agree/nn-pe)/(1-pe);
    return {ioa:state.meta.ioa,level:R.level,total:R.total,kappa:R.kappa,k,note,cov,occ:state.meta.ioaOcc,sparse:R.sparse,C,days:R.days.length,obs:summaryData().nObs,
      c2:spIoaCarry({level:null,total:95,occ:50,sparse:true}),c3:spIoaCarry({level:88,total:95,occ:70,sparse:false})};});
  ok('M9 the simulated second observer carries the same-level agreement (the Kahng and Touchette method) into the behavior\'s IOA',m9.ioa===String(m9.level)&&m9.level<=m9.total&&/^Same-level agreement [\d.]+% \(\d+ of \d+ intervals scored none, low or high alike\)/.test(m9.note),m9);
  ok('M9 occurrence agreement is carried as well only when under 30% of the cells compared are marked',m9.c2.main===95&&m9.c2.occ===50&&m9.c3.main===88&&m9.c3.occ===null&&(m9.sparse?m9.occ!=='':m9.occ===''),{c2:m9.c2,c3:m9.c3,sparse:m9.sparse,occ:m9.occ});
  ok('M1 kappa from the same table is shown in the note, as the form computes it',m9.kappa!=null&&Math.abs(m9.kappa-m9.k)<1e-9&&new RegExp('kappa '+(m9.kappa<0?'−':'')+Math.abs(m9.kappa).toFixed(2).replace(/^0/,'').replace('.','\\.')).test(m9.note),m9);
  ok('M9, H7 the days with a second observer out of the days observed, and the default for spreading them',new RegExp('Second observer on '+m9.days+' of the '+m9.obs+' days observed \\(\\d+%\\)').test(m9.cov)&&/a quarter to a third of the days, spread across days of the week, times of day and observers; rotate the second observer/.test(m9.cov)&&/different times and to different places/.test(m9.cov),m9.cov);
  const occW=await p.evaluate(()=>{const keep={ioa:state.meta.ioa,occ:state.meta.ioaOcc,note:state.meta.ioaNote};state.meta.ioa='95';state.meta.ioaOcc='60';state.meta.ioaNote='Interval-by-interval agreement 95% (57 of 60 intervals) on 3 days.';renderControl();
    const t=document.getElementById('ctlBody').textContent;state.meta.ioaNote='';renderControl();const t2=document.getElementById('ctlBody').textContent;Object.assign(state.meta,{ioa:keep.ioa,ioaOcc:keep.occ,ioaNote:keep.note});renderControl();
    return {on:/OCCURRENCE AGREEMENT BELOW 80%/.test(t),off:/OCCURRENCE AGREEMENT BELOW 80%/.test(t2)};});
  ok('M9 a carried occurrence figure under 80% is flagged on the control chart; typed over by hand, it is not read',occW.on&&!occW.off,occW);
  /* M4 the check and the blind tick */
  const sm4=await p.evaluate(()=>{const t0=document.getElementById('chkNoteP').textContent;const c=document.getElementById('mChkPct');c.value='85';c.dispatchEvent(new Event('input',{bubbles:true}));
    const t1=document.getElementById('chkNoteP').textContent;document.getElementById('ioaTog').click();const b=document.getElementById('ioaBlind');b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('ioaDone').click();
    const d=JSON.parse(JSON.stringify(serialize()));return {t0,t1,pct:d.meta.chkPct,blind:d.behaviors[d.cur].meta.ioaBlind,other:d.behaviors[1]&&d.behaviors[1].meta.ioaBlind};});
  ok('M4 the observer\'s check is on the control chart: not recorded, then under 90% flagged; the default and the feedback line printed',/Not recorded/.test(sm4.t0)&&/Under 90% correct/.test(sm4.t1)&&/90% or more correct before an observer’s marks count; repeat the check every 4 to 6 weeks/.test(sm4.t1)&&/not on whether the marks look as hoped/.test(sm4.t1)&&sm4.pct==='85',sm4);
  ok('M4 the blind tick is kept with the behavior\'s second observer',sm4.blind==='yes'&&!sm4.other,sm4);
  /* L5 */
  const l5=await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="control"]').click();renderControl();return document.getElementById('ctlBody').textContent.replace(/\s+/g,' ');});
  ok('L5 after a window, the control chart says how to test it by changing what happens in it (Touchette et al., 1985)',/Testing a window\. If a window holds up, a simple test is to change what happens in it \(the activity, the staff member, the demand\) and keep the scatter plot running\./.test(l5)&&/Touchette et al\. \(1985\)/.test(l5),l5.slice(-600));
  /* saved case: the figure saved stays as saved */
  const saved=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(serialize()));d.behaviors.forEach(b=>{delete b.meta.ioaOcc;delete b.meta.ioaBlind;});delete d.meta.chkPct;d.behaviors[0].meta.ioa='91';d.behaviors[0].meta.ioaNote='Interval-by-interval agreement 91% (44 of 48 intervals) on 3 days (Wed).';return JSON.stringify(d);});
  const f5=path.join(os.tmpdir(),'v2564-sp-'+process.pid+'.json');fs.writeFileSync(f5,saved);
  const p3=await open(SP);await p3.setInputFiles('#fileIn',f5);await sleep(900);
  const sb=await p3.evaluate(()=>{document.querySelector('#viewSeg button[data-view="control"]').click();renderControl();return {ioa:state.meta.ioa,note:document.getElementById('ioaNoteP').textContent,occ:state.meta.ioaOcc,blind:document.getElementById('ioaBlind').checked};});
  ok('saved case: an SP-1 file from before v25.64 keeps the figure it saved and its note, with no occurrence figure and no blind tick',sb.ioa==='91'&&/^Interval-by-interval agreement 91%/.test(sb.note)&&sb.occ===''&&!sb.blind,sb);
  try{fs.unlinkSync(f5);}catch(e){}
  await p3.close();await p.close();
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 ok('no page errors',errs.length===0,errs.slice(0,5));
 await br.close();
 console.log(bad?'RESULT: '+bad+' failure(s)':'RESULT: all passed');
 process.exit(bad?1:0);
})();
