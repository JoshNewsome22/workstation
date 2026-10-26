/* v22.80 Form SM-1, Wave 3 review (F258-F262): the behavior beside the points, the goal met worked out at the current goal,
   agreement on the teacher's No ratings, one set of thresholds with one change at a time, and the teacher-only baseline.
   F258  a day of all No ratings, rated honestly at goal 50, earns 50% of the points and is 0% behavior; the Record row, the
         graph, the Record's metric and the facts out carry the behavior; Behavior % is typed on a paper row; a sheet the
         teacher does not rate keeps its points and the Record says so; Form DD-1's week summary and Form PR-1's review text
         print the behavior first and leave the teacher-only days out.
   F259  hand rows ticked "met" with 20, 22, 18, 21, 19 of 36 at goal 80 are not met; four days met at 75 then one missed at
         80 holds (the days at 75 do not count); four missed at 80 lowers to 75; the simulation holds at 80.
   F260  a student who says Yes to everything, with one teacher No a day: 94% agreement, 0 of 5 on the teacher's Nos, the
         flag, no ladder step; the PIN caution on the ladder step and on the Rate page.
   F261  one set of thresholds on the Teach sheet, the fading table, the Record and the Guide; a goal raise and a ladder step
         never on the same day; at the ceiling the goal is held and the ladder may move; agreement below 80% steps back and
         holds the goal; fading step 2 with 3 of 6 periods rated finishes 36 of 36.
   F262  phase 0 on the iPad: the adult rates alone, 12 Yes and 6 No for 3 days is 66.7% behavior with no points; the first
         goal suggested in points with how many baseline days meet it; the paper hint says how to enter a teacher-only day.
   The minors and improvements: F263 a penalty clause holds the contract at "Not ready" with rule 9 No; F266 Setup's
   performance-deficit answers; F267 the citations and the reference list; F264 the case's allergies, language and photo
   permission; F265 the plan sent with the point days and a GB-1 objective's criterion; I134 back-ups matching the function;
   I135 SI-1's assent and words; I132 dated changes from the Record's advice and the Teach sheet, drawn on the graph; I131
   a paper sheet entered from its marks on the Rate page.
   usage: node qa/sm1-w3-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const W=BASE+'/NBH-Workstation/';
const URL=W+'SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+(typeof i==='string'?i:JSON.stringify(i)):''));if(!c)fails++;};
const wire=(p,errs)=>{p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});p.on('dialog',d=>d.accept());};
(async()=>{const br=await chromium.launch();const errs=[];
  let page=await br.newPage({viewport:{width:1180,height:820},hasTouch:true});wire(page,errs);
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;});
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1200);
  /* the simulation first: it holds at 80 (F259) and sends the behavior (F258, F262) */
  const sim=await page.evaluate(()=>{renderRecord();const f=window.__nbhFactsOut().points;return {v:$('#logVerdict').textContent,met:[...document.querySelectorAll('#logMetrics .metric')].map(m=>[...m.children].map(c=>c.textContent).join(' ').replace(/\s+/g,' ')),
    f:{beh:f.beh,src:f.src,n:f.days.length,ph0:f.days.filter(d=>d.ph==='0'),tx:f.days.filter(d=>d.ph!=='0').slice(-1)[0]}};});
  ok('F259 the simulation: 2 school days at 80% in phase 1, hold (the days at 75% do not count)',/2 school days at 80% in phase 1 since [\d/]+: hold\. No change before 3 school days/.test(sim.v),sim.v);
  ok('F262 the simulation: the baseline is the teacher’s ratings, with the first goal and how many baseline days meet it',/Baseline \(teacher only\) 40% .*suggested first goal 70% of the points, met on 2 of 4/   /* v24.40: the days as counts, 29 Yes of 72 */.test(sim.met[0]),sim.met);
  ok('F258 facts out: the behavior with each day, the teacher-only days without points or goal, the source of the behavior',
    sim.f.beh==='teacher'&&sim.f.src==='SM-1'&&sim.f.ph0.length===4&&sim.f.ph0.every(d=>d.pct===null&&typeof d.beh==='number'&&d.goal===null&&d.met===null)&&typeof sim.f.tx.beh==='number'&&typeof sim.f.tx.pct==='number'&&sim.f.tx.goal===80,sim.f);
  const simFacts=await page.evaluate(()=>window.__nbhFactsOut());
  /* the helpers: a clean Self & Match sheet (thumbs, 2-1-0-0), a phase ticked; a day rated on the iPad and finished */
  await page.evaluate(()=>{window.W3={
    reset(ph){S.log=[];S.days={};S.lad=LADDER.map(l=>({on:l.ph===String(ph),note:''}));S.fade=(S.fade||[]).map(f=>Object.assign({},f,{on:false}));
      S.sys='match';S.d.rate='thumbs';S.d.mbonus='';S.d.pin='';S.chk.rubmatch=false;
      Object.assign(S.meta,{mp_yy:'2',mp_nn:'1',mp_yn:'0',mp_ny:'0',goal:'50',cc_up:'Met on 4 of the last 5 school days',cc_down:'Met on fewer than 2 of 5 days',cc_hold:'3 school days',cc_step:'5 points',cc_cap:''});renderAll();},
    async day(k,fill){SMR.date=k;const d=smRDay(k,true);d.me={};d.t={};const M=smRModel(d);
      M.rows.forEach((r,ri)=>M.tg.forEach((t,ti)=>{const v=fill(ri,ti);if(v[0]!=null)d.me[ri+'_'+ti]=v[0];if(v[1]!=null)d.t[ri+'_'+ti]=v[1];}));
      await smRFinish();return S.log.find(r=>r.src==='ipad:'+k);},
    rec(){renderRecord();return {v:$('#logVerdict').textContent,rules:[...document.querySelectorAll('#logRules li')].map(l=>l.textContent).join('\n'),hint:($('#logRules .hint')||{}).textContent||'',
      met:[...document.querySelectorAll('#logMetrics .metric')].map(m=>[...m.children].map(c=>c.textContent).join(' ').replace(/\s+/g,' '))};},
    days:['2030-01-07','2030-01-08','2030-01-09','2030-01-10','2030-01-11','2030-01-14','2030-01-15']};});

  /* ---------- F258 ---------- */
  const c=await page.evaluate(async()=>{W3.reset(1);const row=await W3.day('2030-01-07',()=>[1,1]);const R=W3.rec();const f=window.__nbhFactsOut().points.days.slice(-1)[0];
    const svg=document.getElementById('logPlot').textContent,dash=document.querySelectorAll('#logPlot path[stroke="#9aa9b0"]').length;
    return {row:{pts:row.pts,poss:row.poss,beh:row.beh,met:row.met,tno:row.tno,nom:row.nom,sno:row.sno,bgp:row.bgp},met:R.met,f,svg:/Behavior: the share of the teacher’s ratings that were Yes/.test(svg),dash,
      cells:[...document.querySelectorAll('#lTbl tbody tr')][0].innerText.replace(/\s+/g,' ')};});
  ok('F258 all No ratings at goal 50, rated honestly: 18 of 36 points (50%) and 0% behavior on the row',c.row.pts==='18'&&c.row.poss==='36'&&c.row.beh==='0'&&c.row.met===true&&c.row.tno==='18'&&c.row.nom==='18'&&c.row.sno==='18'&&c.row.bgp==='0,0,0',c.row);
  ok('F258 the Record shows the behavior (0%) with the points beside it, the graph’s main line is the behavior',/Behavior since self-rating began 0% .*50% of the points/.test(c.met[1])&&c.svg&&c.dash>0,{m:c.met,svg:c.svg,dash:c.dash});
  ok('F258 the facts out send the day as 50% of the points and 0% behavior',c.f.pct===50&&c.f.beh===0&&c.f.ph==='1'&&c.f.goal===50,c.f);
  const hand=await page.evaluate(()=>{W3.reset(1);S.log.push({date:'1/7',ph:'1',goal:'80',pts:'30',poss:'36',beh:'',m:'',n:'',met:false,tgp:'',note:''});renderL();
    const tr=document.querySelector('#lTbl tbody tr'),inp=tr.querySelector('[data-f="beh"]');inp.value='55';inp.dispatchEvent(new Event('input',{bubbles:true}));
    const th=[...document.querySelectorAll('#lTbl thead th')].map(t=>t.textContent);const f=window.__nbhFactsOut().points.days[0];return {beh:S.log[0].beh,f,th,metCell:tr.children[12].textContent};});
  ok('F258 Behavior % is typed on a paper row and goes to the facts out with the points',hand.beh==='55'&&hand.f.beh===55&&Math.round(hand.f.pct)===83&&hand.th.includes('Behavior %')&&hand.th.includes('On No')&&hand.metCell==='yes',hand);
  const con=await page.evaluate(()=>{W3.reset(1);S.sys='contract';renderAll();S.log.push({date:'1/7',ph:'1',goal:'50',pts:'2',poss:'3',beh:'',met:false});renderL();const R=W3.rec();const o=window.__nbhFactsOut().points;
    const r={rules:R.rules,met:R.met[1],beh:o.beh,b:o.days[0].beh};S.sys='match';renderAll();return r;});
  ok('F258 a sheet the teacher does not rate keeps its points, and the Record says it has no behavior measure',/This sheet has no teacher rating: its points are the student’s own/.test(con.rules)&&/^Points since self-rating began/.test(con.met)&&con.beh===''&&con.b===null,con);

  /* ---------- F259 ---------- */
  const e=await page.evaluate(()=>{W3.reset(1);S.meta.goal='80';[20,22,18,21,19].forEach((p,i)=>S.log.push({date:'1/'+(7+i),ph:'1',goal:'80',pts:String(p),poss:'36',met:true,note:'ticked on the sheet'}));renderL();
    const R=W3.rec();return {mt:rows().map(r=>r.mt),cells:[...document.querySelectorAll('#lTbl tbody tr')].map(t=>t.children[12].textContent),met:R.met[2],rules:R.rules};});
  ok('F259 rows ticked met with 20, 22, 18, 21, 19 of 36 at goal 80 are worked out as not met',e.mt.every(x=>x===false)&&e.cells.every(x=>x==='no')&&/Goal met at the current goal 0 of 5/.test(e.met),e);
  ok('F259 … and the Record lowers the goal on them',/Goal met on 0 of the last 5 school days at 80%.*lower the goal to 75%/.test(e.rules),e.rules);
  const a2=await page.evaluate(()=>{W3.reset(1);S.meta.goal='80';for(let i=0;i<4;i++)S.log.push({date:'1/'+(7+i),ph:'1',goal:'75',pts:'30',poss:'36',met:true});S.log.push({date:'1/11',ph:'1',goal:'80',pts:'27',poss:'36',met:false});renderL();
    const R1=W3.rec();for(let i=0;i<3;i++)S.log.push({date:'1/'+(14+i),ph:'1',goal:'80',pts:'27',poss:'36',met:false});renderL();const R2=W3.rec();return {v1:R1.v,met1:R1.met[2],r1:R1.rules,r2:R2.rules,met2:R2.met[2]};});
  ok('F259 four days met at 75% then one missed at 80%: only the day at 80% counts, and the new goal is held',/1 school day at 80% in phase 1 since 1\/11: hold\. No change before 3 school days/.test(a2.v1)&&/Goal met at the current goal 0 of 1 /.test(a2.met1)&&!/lower|raise/.test(a2.r1),a2);
  ok('F259 four days missed at 80%: lower the goal back to 75%, the level reached before',/Goal met on 0 of the last 4 school days at 80% since 1\/11: lower the goal to 75%/.test(a2.r2)&&/0 of 4/.test(a2.met2),a2);

  /* ---------- F260 ---------- */
  const b=await page.evaluate(async()=>{W3.reset(1);const out=[];for(const k of W3.days.slice(0,5))out.push(await W3.day(k,(ri,ti)=>[0,ri===0&&ti===0?1:0]));
    const R=W3.rec();const pts=S.log.map(r=>r.pts+'/'+r.poss),ag=rows().map(r=>Math.round(r.ag*10)/10);return {R,pts,ag,no:out.map(r=>[r.tno,r.nom,r.sno].join(' ')),onNo:[...document.querySelectorAll('#lTbl tbody tr')][0].children[11].textContent};});
  ok('F260 a student who always says Yes, one teacher No a day: 94.4% agreement, 0 of 1 on the teacher’s No each day',b.ag.every(x=>x===94.4)&&b.no.every(x=>x==='1 0 0')&&b.onNo==='0 of 1'&&b.pts.every(x=>x==='34/36'),b);
  ok('F260 the Record gives the No agreement (0 of 5) beside agreement',/Agreement, last 5 days 94% on the teacher’s Nos: 0 of 5/.test(b.R.met[3]),b.R.met);
  ok('F260 the student who never says No is flagged, and the ladder does not move',/has not said No in the last 5 days rated/.test(b.R.rules)&&!/matching ladder is due/.test(b.R.rules),b.R.rules);

  /* ---------- F261 ---------- */
  const h=await page.evaluate(async()=>{W3.reset(1);for(const k of W3.days.slice(0,5))await W3.day(k,(ri,ti)=>ri===0&&ti===0?[1,1]:[0,0]);
    const A=W3.rec();S.meta.cc_cap='50';const B=W3.rec();S.d.pin='2468';const C=W3.rec();S.d.pin='';
    SMR.date='2030-01-14';setView('rate');smRRender();const rate=document.getElementById('smRate').textContent;S.d.pin='2468';smRRender();const rate2=document.getElementById('smRate').textContent;setView('log');S.d.pin='';
    return {A:A.rules,B:B.rules,C:C.rules,hint:A.hint,pts:S.log.map(r=>r.pts).join(','),pin:/No PIN set/.test(rate),pin2:/No PIN set/.test(rate2)};});
  ok('F261 an honest student meeting the goal: raise the goal, and the next ladder phase waits (one change at a time)',h.pts==='35,35,35,35,35'&&/raise the goal by the step, to 55%/.test(h.A)&&/The next ladder phase waits: one change at a time, the goal first/.test(h.A)&&!/matching ladder is due/.test(h.A),h);
  ok('F261 at the ceiling the goal is held (not “raised to the ceiling”) and phase 2 of the ladder is due',/hold the goal at its ceiling \(50%\)/.test(h.B)&&!/raise/.test(h.B)&&/the teacher’s Nos matched 5 of 5 \(100%\) over the last 5 school days at 50%: phase 2 of the matching ladder is due/.test(h.B),h.B);
  ok('F260 the ladder step asks for a PIN first when the iPad days have none; with a PIN it does not',/Set a PIN on the Rate page first/.test(h.B)&&!/Set a PIN/.test(h.C)&&/phase 2 of the matching ladder is due/.test(h.C),{B:h.B,C:h.C});
  ok('F260 the Rate page’s Settings say no PIN is set on a matched sheet',h.pin&&!h.pin2,h);
  const lo=await page.evaluate(async()=>{W3.reset(1);for(const k of W3.days.slice(0,5))await W3.day(k,(ri,ti)=>[0,ri<2?1:0]);return W3.rec();});
  ok('F261 agreement below 80%: step back one phase, and the goal met on 5 of 5 is held, not raised',/Agreement 67% over the last 5 school days in phase 1: move back one phase/.test(lo.rules)&&/but hold it: agreement has dropped/.test(lo.rules)&&!/raise the goal/.test(lo.rules),lo.rules);
  const th=await page.evaluate(hint=>{const txt=LADDER.map(l=>l.when).concat(FADE.map(f=>f.when)).join(' ');const ps=(txt.match(/\d+%/g)||[]);
    const guide=[...document.querySelectorAll('th')].find(t=>t.textContent.trim()==='Decision rules');const gt=guide?guide.nextElementSibling.textContent:'';
    return {ps,gt,hint,lad:LADDER.map(l=>l.w),f2:FADE[1].when};},h.hint);
  ok('F261 one set of thresholds: the ladder and fading say 90% and 80%, the Guide and the Record say the same',th.ps.length>=4&&th.ps.every(p=>p==='90%'||p==='80%')&&/below 80%/.test(th.gt)&&/90%/.test(th.gt)&&/hold each new goal for 3 school days/.test(th.gt)&&
    /agreement 90% to move on the ladder and below 80% to step back, the teacher’s Nos matched at 80%/.test(th.hint)&&JSON.stringify(th.lad)==='[0,5,10,10,20,0]'&&/count each unrated period as met/.test(th.f2),th);
  const f2=await page.evaluate(async()=>{W3.reset(2);S.fade[1].on=true;const k='2030-01-07';SMR.date=k;const d=smRDay(k,true);d.me={};d.t={};const M=smRModel(d);
    for(let ri=0;ri<3;ri++)M.tg.forEach((t,ti)=>{d.me[ri+'_'+ti]=0;d.t[ri+'_'+ti]=0;});const live=smRTotals(M,d).pts,beh=smRBeh(M,d);
    const row=await W3.day.call(null,k,(ri,ti)=>ri<3?[0,0]:[null,null]);const after=smRTotals(M,S.days[k]).pts;
    return {live,bn:beh.n,bb:beh.b,row:{pts:row.pts,poss:row.poss,asm:row.asm,beh:row.beh,met:row.met,note:row.note},after,f2:S.days[k].f2,rows:M.rows.length};});
  ok('F261 fading step 2, 3 of 6 periods rated: the unrated periods count as met when the day is finished, 36 of 36',f2.rows===6&&f2.live===18&&f2.row.pts==='36'&&f2.row.poss==='36'&&f2.row.asm==='3'&&f2.row.met===true&&/3 periods assumed met, fading step 2/.test(f2.row.note)&&f2.after===36&&f2.f2===true,f2);
  ok('F261 … and the behavior is what was rated (9 ratings, 100%)',f2.bn===9&&f2.bb===100&&f2.row.beh==='100',f2);

  /* ---------- F262 ---------- */
  const d0=await page.evaluate(async()=>{W3.reset(0);S.meta.goal='';SMR.modeSet=false;SMR.kid=false;const k='2030-01-07';SMR.date=k;const d=smRDay(k,true);d.me={};d.t={};const M=smRModel(d);
    M.rows.forEach((r,ri)=>M.tg.forEach((t,ti)=>{d.t[ri+'_'+ti]=ri<2?1:0;}));setView('rate');smRRender();const page=document.getElementById('smRate').innerText.replace(/\s+/g,' '),mode=SMR.mode;
    const rows_=[];for(const k2 of W3.days.slice(0,3))rows_.push(await W3.day(k2,(ri,ti)=>[null,ri<2?1:0]));setView('log');const R=W3.rec();const f=window.__nbhFactsOut().points.days;
    return {page,mode,rows:rows_.map(r=>({ph:r.ph,pts:r.pts,poss:r.poss,goal:r.goal,beh:r.beh,tno:r.tno,m:r.m})),R,f,hint:[...document.querySelectorAll('#tab-record .hint, .hint')].map(x=>x.textContent).join(' ')};});
  ok('F262 phase 0 on the iPad: the adult rates alone, and the page says so with today’s share',d0.mode==='t'&&/Phase 0: .* rates alone\. Today the targets met in 12 of 18 ratings \(67%\)/.test(d0.page),{mode:d0.mode,page:d0.page.slice(0,400)});
  ok('F262 a teacher-only day goes into the Record as 66.7% behavior with no points and no goal',d0.rows.length===3&&d0.rows.every(r=>r.ph==='0'&&r.pts===''&&r.poss===''&&r.goal===''&&r.beh==='66.7'&&r.tno===''&&r.m===''),d0.rows);
  ok('F262 the baseline is read from the teacher’s ratings, the first goal suggested in points with how many baseline days meet it',
    /Baseline \(teacher only\) 67% 3 teacher-only days .*suggested first goal 80% of the points, met on 3 of 3/.test(d0.R.met[0])&&/Suggested first goal: 80% of the points, met on 3 of the 3 baseline days \(a student rating honestly earns it on a day with the targets met in about 60% of the periods/.test(d0.R.rules),d0.R);
  ok('F262 the facts out send the teacher-only days as behavior, with no points, goal or goal met',d0.f.length===3&&d0.f.every(x=>x.ph==='0'&&x.pct===null&&x.beh===66.7&&x.goal===null&&x.met===null),d0.f);
  ok('F262 the paper hint says how to enter a teacher-only day',/A teacher-only day \(phase 0\) has no points: enter its date, phase 0 and the Behavior % only/.test(d0.hint));

  /* ---------- the minors and improvements ---------- */
  const m3=await page.evaluate(()=>{W3.reset(1);S.meta.client='Sam (simulated)';S.meta.bc_parent='Sam’s father (simulated)';S.bck.forEach(b=>{b.in='Yes';});
    S.meta.bc_pen='A stated consequence (write it below; use with caution)';S.meta.bc_pentext='Loses Friday free time and recess the next day';renderBck();renderBc();
    const sel=document.querySelectorAll('#bcTbl select')[8],a={v:$('#bcVerdict').textContent,dis:sel.disabled,val:sel.value,doc:$('#bcOut').textContent};
    S.meta.bc_pen='None: a day the task is not done earns nothing, and nothing is lost';renderBck();renderBc();a.v2=$('#bcVerdict').textContent;a.doc2=$('#bcOut').textContent;
    const su={};for(const v of ['No: teach the skill first; the sheet comes later','Partly: teach the skill alongside the sheet']){S.meta.r_perf=v;renderSetup();su[v[0]]=$('#setupVerdict').innerHTML;}S.meta.r_perf='';renderSetup();
    const guide=document.body.textContent,refs=[...document.getElementById('smRefs').childNodes].map(n=>n.textContent).join('').replace(/^\s*Reference list\.\s*/,'').split('•').map(x=>x.trim()).filter(Boolean);
    return {a,su,kim:/Maynard & Kim/.test(guide),smith:/\(Smith, Thompson & Maynard, 2022\)/.test(guide),rhode:/an exact match earned a bonus point, and ratings more than one point apart earned none/.test(guide)&&/not Rhode’s rule/.test(guide),
      derisi:/DeRisi and Butz \(1975\) is a practice manual/.test(guide),refs:refs.map(r=>r.slice(0,24)),mc:refs.some(r=>/^McClannahan, L\. E\./.test(r)),sm88:refs.some(r=>/^Smith, D\. J\., Young, K\. R\./.test(r))};});
  ok('F263 a penalty clause sets rule 9 to No and holds the contract at “Not ready”, warning on recess taken away',/Not ready: a penalty needs the BIP team’s agreement/.test(m3.a.v)&&/takes away recess/.test(m3.a.v)&&m3.a.dis&&m3.a.val==='No'&&/Agreed in the BIP dated/.test(m3.a.doc),m3.a);
  ok('F263 without the penalty the ten rules met read “Ready to sign” again',/All ten rules met\. Ready to sign\./.test(m3.a.v2)&&!/Agreed in the BIP/.test(m3.a.doc2),m3.a.v2);
  ok('F266 Setup: “No” says teach the skill first, “Partly” says teach it alongside; neither is “Ready to design”',/v-mid/.test(m3.su.N)&&/Not yet: teach the skill first/.test(m3.su.N)&&/Teach the skill alongside the sheet/.test(m3.su.P)&&!/Ready to design/.test(m3.su.N+m3.su.P),m3.su);
  const sorted=m3.refs.slice().sort((x,y)=>x.toLowerCase().replace(/[^a-z]/g,'')<y.toLowerCase().replace(/[^a-z]/g,'')?-1:1);
  ok('F267 the citations: Smith, Thompson & Maynard (no Kim), the Rhode row as the procedure is summarized, DeRisi & Butz cited, the two missing references added, the list in order',
    !m3.kim&&m3.smith&&m3.rhode&&m3.derisi&&m3.mc&&m3.sm88&&JSON.stringify(sorted)===JSON.stringify(m3.refs)&&/^Amato-Zech/.test(m3.refs[0]),m3);
  const cf=await page.evaluate(()=>{const F={profile:{src:'DM-1',health:{allergies:'Peanuts (simulated)'},language:{home:'Spanish',interpreter:true,notes:'Interpreter: district line (simulated)'},flags:{photo:'No'}},
      student:{assent:'given',preference:'Smaller worksheets (simulated)',likes:'Drawing (simulated)',date:'2026-10-01'}};
    S.meta.bc_assent='';S.meta.rf_class='';window.__nbhFactsIn(F);const r={};r.case0=$('#smCaseBox').textContent;
    S.meta.rf_class='Edibles (last resort, with family agreement)';smCaseRender();r.case1=$('#smCaseBox').textContent;
    S.meta.rf_class='';S.store=[{n:'Candy bar',icon:'',img:'',p:'10',tier:''}];smCaseRender();r.case2=$('#smCaseBox').textContent;S.store=[];
    renderBc();r.bc=$('#bcOut').textContent;r.assent=S.meta.bc_assent;r.stu=$('#smStuBox').textContent;r.tear=tearOff();
    S.d.avimg='data:image/png;base64,iVBORw0KGgo=';r.av=smAvatar(40);r.note=smPhotoNote();
    window.__nbhFactsIn(Object.assign({},F,{profile:Object.assign({},F.profile,{flags:{photo:'Yes'}}),student:{assent:'refused',date:'2026-10-02'}}));r.av2=smAvatar(40);r.stu2=$('#smStuBox').innerHTML;S.d.avimg='';
    window.__nbhFactsIn({});return r;});
  ok('F264 the case’s allergies show beside the back-ups, and food as a back-up (the class or a store item) is warned on with them',/Allergies \(Form DM-1\): Peanuts \(simulated\)/.test(cf.case0)&&!/Food as a back-up/.test(cf.case0)&&/Food as a back-up\..*Peanuts/.test(cf.case1)&&/Food as a back-up \(Candy bar\)/.test(cf.case2),cf);
  ok('F264 the family’s language and interpreter print on the contract and the home note',/Family’s language: Spanish · Interpreter: district line \(simulated\)/.test(cf.bc)&&/Family&rsquo;s language: Spanish/.test(cf.tear),{bc:cf.bc.slice(-400),tear:cf.tear.slice(-300)});
  ok('F264 photo permission No keeps the student’s own photo off the sheet and says so; Yes shows it',!/av-img/.test(cf.av)&&/photo\/media permission on file is No/.test(cf.note)&&/<img class="av-img"/.test(cf.av2),cf);
  ok('I135 Form SI-1’s assent and words: shown beside the goal set with the student, assent taken onto the contract; a refusal is flagged',cf.assent==='Given'&&/The student’s assent: given \(Form SI-1, 10\/1\/2026\); asked again at each review date/.test(cf.bc)&&
    /From Form SI-1, 10\/1\/2026/.test(cf.stu)&&/Smaller worksheets \(simulated\)/.test(cf.stu)&&/The student has refused/.test(cf.stu2),cf);
  const fn=await page.evaluate(()=>{S.meta.func='Escape or avoidance';S.store=[];smCaseRender();const t=$('#smFnBox').textContent;document.getElementById('smFnAdd').click();const st=smStore().map(o=>o.n+' '+o.p);S.meta.func='Automatic';smCaseRender();const t2=$('#smFnBox').textContent;S.store=[];S.meta.func='';smCaseRender();return {t,st,t2};});
  ok('I134 back-ups that match the function, capped for escape, added to the store on request',/Back-ups that match the function \(Escape or avoidance, Form FS-1\)/.test(fn.t)&&/never on the skill being taught/.test(fn.t)&&fn.st.length===3&&fn.st[0]==='Break pass: 3 minutes away from the task 8'&&fn.t2==='',fn);
  const pl=await page.evaluate(async()=>{W3.reset(1);for(const k of W3.days.slice(0,5))await W3.day(k,(ri,ti)=>ri===0&&ti===0?[1,1]:[0,0]);S.fid[8].in='N/A';const P=window.__nbhFactsOut().points.plan;
    S.tg=[{word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''},{word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''}];
    window.__nbhFactsIn({goals:{acq:[{beh:'Ask for a break (simulated)',cond:'a demand presented',crit:'independently in at least 80% of opportunities'}],red:[]}});const g=S.tg[0];return {P,g:{word:g.word,def:g.def,goal:g.goal}};});
  ok('F265 the point days carry the plan: the targets, the match table, the goal, the phase, the fidelity steps in the plan',pl.P&&pl.P.sys==='match'&&pl.P.targets.length>=2&&pl.P.match&&pl.P.match.yy===2&&pl.P.goal===50&&pl.P.phase==='1'&&pl.P.fidelity.length===8&&/^The sheet is on the desk/.test(pl.P.fidelity[0])&&Array.isArray(pl.P.changes),pl.P);
  ok('F265 a GB-1 objective leaves the definition for the BCBA and carries its criterion as the target’s goal',pl.g.word==='Ask for a break (simulated)'&&pl.g.def===''&&pl.g.goal==='80',pl.g);
  const ch=await page.evaluate(async()=>{W3.reset(1);for(const k of W3.days.slice(0,5))await W3.day(k,(ri,ti)=>ri===0&&ti===0?[1,1]:[0,0]);renderRecord();
    const b=[...document.querySelectorAll('#logRules [data-chg]')].map(x=>x.textContent),v=$('#logVerdict').textContent;document.querySelector('#logRules [data-chg^="goal|"]').click();await new Promise(r=>setTimeout(r,150));
    const r={b,v,goal:S.meta.goal,chg:JSON.parse(JSON.stringify(S.chg)),list:$('#logChg').textContent,rules:[...document.querySelectorAll('#logRules li')].map(l=>l.textContent).join(' | ')};
    S.meta.goal='50';S.meta.cc_cap='50';renderRecord();document.querySelector('#logRules [data-chg^="lad|"]').click();await new Promise(r=>setTimeout(r,150));r.ph=curPhase();r.chg2=S.chg.slice(-1)[0];
    const fb=document.querySelectorAll('#fadeTbl input[type=checkbox]')[1];fb.checked=true;fb.dispatchEvent(new Event('change',{bubbles:true}));r.fade=S.chg.slice(-1)[0];
    const o=fromFile(JSON.parse(JSON.stringify({form:'SM-1',rev:'2026-10',S})));r.kept=JSON.stringify(o.chg)===JSON.stringify(S.chg);
    document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,900));renderRecord();r.svg=[...document.querySelectorAll('#logPlot text')].map(t=>t.textContent).filter(t=>/^goal /.test(t));return r;});
  ok('I132 the Record’s advice has a button that makes the change, dated, with the rule that triggered it; the verdict carries no button',ch.b.includes('Raise it to 55%')&&!/Raise it to/.test(ch.v)&&ch.goal==='55'&&ch.chg.length===1&&/^\d+\/\d+$/.test(ch.chg[0].date)&&ch.chg[0].what==='Goal 50% → 55%'&&/goal met on 5 of the last 5 school days at 50%/.test(ch.chg[0].why)&&/Goal 50% → 55%/.test(ch.list)&&/no school days at it yet/.test(ch.rules),ch);
  ok('I132 a ladder step and a fading step are dated too, kept in the saved file',ch.ph==='2'&&ch.chg2.what==='Ladder phase 1 → 2'&&ch.fade.what==='Fading step 2 ticked'&&ch.fade.k==='fade'&&ch.kept,ch);
  ok('I132 the graph marks each goal change from the Record (the simulation’s 75% and 80%)',JSON.stringify(ch.svg)==='["goal 75%","goal 80%"]',ch.svg);
  const pp=await page.evaluate(async()=>{W3.reset(1);const k='2030-02-04';SMR.date=k;SMR.paper=false;setView('rate');smRRender();document.getElementById('smRPaper').click();
    const cells=document.querySelectorAll('#smRate [data-rpc]').length,hint=(document.querySelector('#smRate .smr-paperh')||{}).textContent||'';
    const tap=k2=>document.querySelector('#smRate [data-rpc="'+k2+'"]').click();tap('me|0|0');const a=S.days[k].me['0_0'];tap('me|0|0');const b=S.days[k].me['0_0'];tap('me|0|0');const c='0_0' in S.days[k].me;
    for(let ri=0;ri<6;ri++)for(let ti=0;ti<3;ti++){tap('me|'+ri+'|'+ti);tap('t|'+ri+'|'+ti);}
    tap('t|5|2');tap('me|5|2');await smRFinish();const row=S.log.find(r=>r.src==='ipad:'+k);SMR.paper=false;setView('log');
    return {cells,hint,a,b,c,row:row&&{pts:row.pts,poss:row.poss,beh:row.beh,m:row.m,n:row.n,tno:row.tno,nom:row.nom,note:row.note}};});
  ok('I131 the paper sheet scored from its marks: tap cells for both raters, the form works out the points, the match, the behavior and the No counts',pp.cells===36&&/From the paper sheet:/.test(pp.hint)&&pp.a===0&&pp.b===1&&pp.c===false&&
    pp.row&&pp.row.pts==='35'&&pp.row.poss==='36'&&pp.row.beh==='94.4'&&pp.row.m==='18'&&pp.row.n==='18'&&pp.row.tno==='1'&&pp.row.nom==='1'&&/^Entered from the paper sheet/.test(pp.row.note),pp);
  await page.close();

  /* ---------- the behavior on Form DD-1 and Form PR-1 ---------- */
  const PTS={days:[{date:'2026-10-05',pct:80,beh:60,ph:'1',goal:75,met:true},{date:'2026-10-06',pct:70,beh:40,ph:'1',goal:75,met:false},{date:'2026-10-07',pct:null,beh:30,ph:'0',goal:null,met:null},{date:'2026-09-28',pct:50,beh:20,ph:'1',goal:75,met:false}],src:'SM-1',beh:'teacher'};
  page=await br.newPage({viewport:{width:1400,height:1000}});wire(page,errs);await page.clock.setFixedTime(new Date('2026-10-12T10:00:00'));
  await page.goto(W+'Daily_Behavior_Data_and_Visual_Analysis.html',{waitUntil:'load'});await sleep(1200);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});await page.evaluate(async()=>{await loadExample();});await sleep(1000);
  const dd=await page.evaluate(P=>{ddCaseFacts={points:P};ddWeekOn('2026-10-05');const t=document.getElementById('ddWeekWrap').innerText.replace(/\s+/g,' ');
    ddCaseFacts={points:{days:P.days.map(x=>({date:x.date,pct:x.pct,goal:x.goal,met:x.met})).filter(x=>x.pct!=null),src:'SM-1'}};ddWeekOn('2026-10-05');const t2=document.getElementById('ddWeekWrap').innerText.replace(/\s+/g,' ');ddWeekOff();return {t,t2};},PTS);
  ok('F258 DD-1’s week summary: the teacher’s ratings first, the points beside them, the teacher-only day not counted',
    /The teacher rated the targets met in 50% of the ratings on average across 2 days \(75% of the points, which an honest No earns too\); the goal was met on 1 of 2/.test(dd.t)&&/1 teacher-only baseline day \(phase 0\) this week, not counted/.test(dd.t)&&/60% met \(80% of points\)/.test(dd.t),dd.t.slice(0,1200));
  ok('F258 DD-1 without the behavior (an older SM-1 file) prints the points as before',/75% of the points on average across 2 days; the goal was met on 1 of them/.test(dd.t2)&&!/teacher rated/.test(dd.t2),dd.t2.slice(0,800));
  await page.close();
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,errs);
  await page.goto(W+'PR-1_Periodic-Plan-Review_v2026-09.html',{waitUntil:'load'});await sleep(900);
  const pr=await page.evaluate(([P,F])=>{const a=prAlsoText({points:P}),b=prAlsoText(F);return {a,b};},[PTS,simFacts]);
  const simTx=simFacts.points.days.filter(d=>d.ph!=='0'&&typeof d.pct==='number');
  ok('F258 PR-1’s review text: the teacher’s ratings first, the points beside them, the teacher-only day left out',/Point sheet \(Form SM-1\): the teacher rated the targets met in 40% of the ratings on average across 3 days \(66\.7% of the points\); the goal met on 1\./.test(pr.a),pr.a);
  ok('F258 PR-1 reads the simulation’s facts the same way (its baseline days left out)',new RegExp('the teacher rated the targets met in [\\d.]+% of the ratings on average across '+simTx.length+' days').test(pr.b),{b:pr.b,n:simTx.length});
  await page.close();

  ok('no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
