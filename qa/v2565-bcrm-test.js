/* v25.65 batch 2, parcel BCRM: Forms BC-1 and RM-1 against the JABA review of contrast, relapse and durability (BC-RM).
   BC-1: what follows the behavior where nothing changed (H1), the replacement response there (H2), the adults told before the plan
   starts (H3), later phases that replicate (M5), up to three constant components and when each happens (M6), DRO (M7), a behavior to
   increase (M9), negative contrast (L1), another problem behavior (L2), the applied studies (L3), the re-check after a spread of
   improvement (L4), contrast across successive phases (L7), and TI-1's commission errors beside the integrity line (M3).
   RM-1: the replacement response at each challenge (H5), how long a relapse lasted (H6), both published rules (H7), step size and
   delay type (H8), task changes and automatic function (M1), the missing card (M2), commission errors and the safe integrity level
   (M3), variable-time delivery with a planned exit (M4), spontaneous recovery (M8), later steps are not safer (L5), the classroom
   evidence for similarity (L6). Saved files from before open as they did. Simulated data only.
   usage: node qa/v2565-bcrm-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const BC='BC-1_Behavioral-Contrast_v2026-09.html',RM='RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1100);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.print=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};

  /* ======================= BC-1 ======================= */
  let p=await open(BC);
  const LESS='Less — the reinforcer comes less often, or less of it, than before',MORE='More — the reinforcer comes more often, or more of it, than before',YES='Yes — nothing about this component was altered';
  /* rows: [phase 1..4, constant, changed, extra keys] */
  const setCase=(rows,meta)=>p.evaluate(([rows,meta])=>{S=blank();S.meta=Object.assign({conName:'Specials (simulated)',chgName:'Room 12 (simulated)',conUnchanged:'Yes — nothing about this component was altered'},meta);
    S.rows=rows.map(r=>Object.assign({d:'',p:PH[r[0]],con:String(r[1]),chg:String(r[2]),n:''},r[3]||{}));renderAll();
    const V=document.querySelector('#anVerdict .verdict');return {v:V?V.textContent:document.getElementById('anVerdict').textContent,
      cards:[...document.querySelectorAll('#anMetrics .metric')].map(x=>[x.querySelector('b').textContent,x.querySelector('.val').textContent,x.querySelector('.sub').textContent]),
      more:document.getElementById('anMore').textContent,later:document.getElementById('anLater').textContent,out:window.__nbhFactsOut(),next:S.meta.next||'',
      head:[...document.querySelectorAll('#dataTbl thead th')].map(t=>t.textContent)};},[rows,meta]);
  const rows=(b,c,eb,ec)=>b.map((v,i)=>[1,v,6,eb?eb(i):null]).concat(c.map((v,i)=>[2,v,1,ec?ec(i):null]));

  /* H1 */
  const h1a=await setCase(rows([2,3,2,3],[5,6,5,6],i=>({rf:'30'}),i=>({rf:'55'})),{chgRf:LESS});
  ok('1 BC-RM-H1 the share followed by the reinforcer rose 10 points or more: the contrast headline is replaced, both shares on the Direction card, kind "direct"',
    /^Not clear evidence of contrast: the behavior is followed by its reinforcer more often in Specials \(simulated\) than before\./.test(h1a.v)&&/went from 30% in baseline to 55% after the change/.test(h1a.v)&&
    /followed by its reinforcer: baseline 30%, after 55%/.test(h1a.cards.find(c=>c[0]==='Direction')[2])&&h1a.out.contrast.kind==='direct',h1a);
  const h1b=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS});
  ok('2 BC-RM-H1 not recorded: a contrast verdict carries the note that what staff did there was not recorded',/^Consistent with positive contrast/.test(h1b.v)&&/What staff did after the behavior in Specials \(simulated\) was not recorded\. A rise there may be direct reinforcement, not contrast/.test(h1b.v)&&h1b.head.some(t=>/^Followed by its reinforcer, %/.test(t)),h1b);
  const h1c=await setCase(rows([2,3,2,3],[5,6,5,6],i=>({rf:'30'}),i=>({rf:'35'})),{chgRf:LESS});
  ok('3 BC-RM-H1 a share that moved less than 10 points keeps the contrast verdict, without the note',/^Consistent with positive contrast/.test(h1c.v)&&!/was not recorded/.test(h1c.v)&&h1c.out.contrast.kind==='positive',h1c.v);

  /* H2 */
  const rr=await p.evaluate(()=>[...document.querySelectorAll('#bcRrTbl tr')].map(tr=>({q:tr.querySelector('th').textContent,opts:[...tr.querySelector('select').options].map(o=>o.textContent)})));
  const h2=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS,rrUse:'Yes',rrHon:'No'});
  const h2b=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS,rrReach:'No'});
  const h2c=await setCase(rows([2,3,2,3],[5,6,5,6]),{chgRf:LESS,rrUse:'Yes',rrHon:'Yes',rrReach:'Yes'});
  ok('4 BC-RM-H2 three questions about the replacement response, each Yes / No / Not known with a note; used and not honored, or not in reach, adds the resurgence note with RM-1',
    rr.length===3&&/use the replacement response/.test(rr[0].q)&&/honor it/.test(rr[1].q)&&/in reach/.test(rr[2].q)&&rr.every(r=>r.opts.join()===',Yes,No,Not known')&&
    /The replacement response is on extinction or unavailable in Specials \(simulated\)\. A rise there fits resurgence as well as contrast\. Bring the card, and the rule for honoring it, into that setting first, and log it on Form RM-1 as a challenge of type Resurgence\./.test(h2.v)&&/fits resurgence/.test(h2b.v)&&!/fits resurgence/.test(h2c.v),{rr,h2:h2.v.slice(-300)});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const sim=await p.evaluate(()=>({rel:S.meta.r_relapse,v:document.querySelector('#anVerdict .verdict').textContent,kind:window.__nbhFactsOut().contrast.kind}));
  ok('5 BC-RM-H2 the worked example works through the replacement response in specials instead of dismissing resurgence, and is still read as positive contrast',
    !/^Not resurgence/.test(sim.rel)&&/Resurgence is not ruled out/.test(sim.rel)&&/fits resurgence as well as contrast/.test(sim.v)&&sim.kind==='positive'&&/^Consistent with positive contrast/.test(sim.v),sim);

  /* tally sheet (H1, H2, L2) and the notice (H3) */
  const t=await p.evaluate(()=>{let n=0;window.print=()=>{n++;};document.getElementById('tallyBtn').click();const el=document.getElementById('bcTally'),txt=el.textContent.replace(/\s+/g,' '),r=el.querySelectorAll('.bc-tallytbl tbody tr').length,
    pg=(document.getElementById('bcTallyPage')||{}).textContent;window.dispatchEvent(new Event('afterprint'));
    document.getElementById('noticeBtn').click();const el2=document.getElementById('bcTally'),t2=el2.textContent.replace(/\s+/g,' ');window.dispatchEvent(new Event('afterprint'));
    return {n,txt,r,pg,t2,pg2:document.getElementById('bcTallyPage').textContent};});
  ok('6 BC-RM-H1, H2, L2 the tally sheet records what happened right after (five headings), whether a request was honored, and another problem behavior; it prints across the page',
    /What happened right after \(one mark each time\)/.test(t.txt)&&/Task or demand ended or delayed/.test(t.txt)&&/Adult attention \(talk, reprimand, comfort\)/.test(t.txt)&&/Item or activity given/.test(t.txt)&&/Nothing changed/.test(t.txt)&&
    /Asked with the card or word/.test(t.txt)&&/Not honored/.test(t.txt)&&/Other problem behavior \(optional\)/.test(t.txt)&&t.r===14&&t.pg==='@page{size:landscape}'&&t.pg2===''&&t.n===2,t);
  const told=await p.evaluate(()=>['toldWho','toldDate','toldHow'].map(k=>!!document.querySelector('[data-m="'+k+'"]')));
  ok('7 BC-RM-H3 Setup records who was told, when and how; the notice says when the plan starts, that behavior elsewhere may change, and comes with the tally sheet',
    told.every(Boolean)&&/The plan starts in Room 12 independent work on \d+\/\d+\/\d{4}\. Behavior in Specials and the cafeteria may get worse for a while, or better\. Please keep doing what you do now, and let Jordan Ellis, M\.A\., BCBA \(simulated\) know\. We will count it on the attached sheet\./.test(t.t2)&&/Tally Sheet: Specials and the cafeteria/.test(t.t2),{told,t2:t.t2.slice(0,500)});
  const gd=await p.evaluate(()=>document.querySelector('section.only-guide').textContent.replace(/\s+/g,' '));
  ok('8 BC-RM-H3 the evidence is printed: 84% had a report, 20% did not tell in advance, 44% damaged rapport',/84% had a stakeholder report contrast, 20% did not tell stakeholders in advance, and for 44%/.test(await p.evaluate(()=>document.querySelector('section.only-setup').textContent.replace(/\s+/g,' '))));

  /* M5 */
  const ph0=await p.evaluate(()=>{S=blank();renderAll();return [...document.querySelectorAll('#dataTbl select')[0].options].map(o=>o.textContent);});
  const m5=await setCase(rows([2,3,2,3],[5,6,5,6]).concat([[3,3,1],[3,2,1],[3,3,1],[4,3,6],[4,2,6],[4,3,6]]),{chgRf:LESS,phLater:'1'});
  const ph1=await p.evaluate(()=>[...document.querySelectorAll('#dataTbl select')[0].options].map(o=>o.textContent));
  ok('9 BC-RM-M5 the later phases are offered when Setup asks; after extension the constant setting\'s change against the After-the-change mean; the return to baseline "replicated"; the result goes to the case',
    ph0.length===3&&ph1.join('|')==='|Baseline|After the change|Plan extended to the constant setting|Changed setting back to baseline'&&
    /After extension: Specials \(simulated\) fell by 51\.5% against the After-the-change mean \(5\.50 to 2\.67, 3 sessions\)/.test(m5.later)&&/Replicated: the direction of its change reversed with the change/.test(m5.later)&&
    m5.out.contrast.extension&&m5.out.contrast.extension.fell===true&&m5.out.contrast.replicated===true&&/^Consistent with positive contrast/.test(m5.v),{ph0,ph1,later:m5.later,ext:m5.out.contrast.extension});

  /* M6 */
  const m6=await setCase(rows([2,3,2,3],[5,6,5,6],i=>({con2:'4'}),i=>({con2:'2'})),{chgRf:LESS,conName2:'The bus (simulated)',conWhen2:'Right after it, the same day',conUnchanged2:YES});
  const when=await p.evaluate(()=>[...document.querySelector('[data-m="conWhen"]').options].map(o=>o.textContent));
  const t6=await p.evaluate(()=>{document.getElementById('tallyBtn').click();const el=document.getElementById('bcTally');window.dispatchEvent(new Event('afterprint'));return [...el.querySelectorAll('.nbh-print-title')].map(x=>x.textContent);});
  ok('10 BC-RM-M6 a second constant component: its own column, verdict and tally sheet; when each happens relative to the changed setting; the hint on closeness in time',
    m6.head.some(t=>/The bus \(simulated\)/.test(t))&&/Second Constant Component: The bus \(simulated\)/.test(m6.more)&&/Consistent with induction, not contrast\. The bus \(simulated\) fell by 50\.0%/.test(m6.more)&&
    when.join('|')==='|Right before it, the same day|Right after it, the same day|Later the same day|On other days|At home'&&t6.join('|')==='Tally Sheet: Specials (simulated)|Tally Sheet: The bus (simulated)'&&
    m6.out.contrast.more&&m6.out.contrast.more[0].kind==='induction'&&/Contrast is larger in a setting close in time to the changed one, especially the one just before it\./.test(await p.evaluate(()=>document.querySelector('section.only-setup').textContent)),{more:m6.more.slice(0,300),when,t6,head:m6.head});
  const m6b=await setCase(rows([2,3,2,3],[5,6,5,6],i=>({con2:'4'}),i=>({con2:'4'})).concat([[3,3,1,{con2:'6'}],[3,3,1,{con2:'6'}],[3,3,1,{con2:'6'}]]),{chgRf:LESS,conName2:'The bus (simulated)',phLater:'1',extTo:''});
  ok('11 BC-RM-M6 at the second introduction (the plan extended to the first setting) the still-untreated setting is read again',/At the second introduction \(the plan extended to Specials \(simulated\)\): The bus \(simulated\), still untreated, rose by 50\.0% against its After-the-change mean/.test(m6b.later),m6b.later);

  /* M7 */
  const m7=await p.evaluate(()=>{const cb=document.querySelector('[data-m="pDro"]');const h0=document.getElementById('droHint').hidden;cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));
    const h1=document.getElementById('droHint').hidden;const txt=document.getElementById('droHint').textContent;cb.checked=false;cb.dispatchEvent(new Event('change',{bubbles:true}));return {h0,h1,txt,lab:cb.parentElement.textContent.trim(),m:S.meta.pDro};});
  ok('12 BC-RM-M7 "DRO (reinforcement for intervals without the behavior)" with its hint when ticked',m7.lab==='DRO (reinforcement for intervals without the behavior)'&&m7.h0&&!m7.h1&&/^Early in DRO the student often earns less than before; later, more\. Answer “Reinforcement there after the change” for the period being read, and re-run the form as the DRO interval grows\./.test(m7.txt),m7);

  /* M9 */
  const inc1=await setCase(rows([2,3,2,3],[1,1,1,1]),{chgRf:LESS,tgtDir:'A behavior to increase (work, compliance, a new skill)'});
  const dec1=await setCase(rows([2,3,2,3],[1,1,1,1]),{chgRf:LESS});
  ok('13 BC-RM-M9 a behavior to increase: a fall alongside less reinforcement reads as the behavior weakening, not as an improvement; the Guide says a component can be a task type or a person',
    /means the behavior is weakening there too/.test(inc1.v)&&/generalized improvement/.test(dec1.v)&&/A component can be a type of task within a session \(for example, new tasks and review tasks\), or a person, as well as a setting\./.test(gd)&&/Charlop et al\., 1992/.test(gd),{inc:inc1.v.slice(0,300)});

  /* L1 */
  const l1=await setCase(rows([5,6,5,6],[2,3,2,3]),{chgRf:MORE});
  ok('14 BC-RM-L1 negative contrast carries the caution that it is less reliable, with the figures',/^Consistent with negative contrast/.test(l1.v)&&/Negative contrast is seen less often than positive contrast: check other causes first\. Positive contrast was found in 3 of 3 children and negative contrast in 2 of 3 \(Waite & Osborne, 1972\), and in 3 of 3 adults against 1 of 3/.test(l1.v),l1.v);
  /* L2 */
  const l2=await setCase(rows([3,3,3,3],[3,3,3,3],i=>({ob:'1'}),i=>({ob:'3'})),{chgRf:LESS});
  ok('15 BC-RM-L2 another problem behavior that rose only in the constant setting is noted under the verdict',/Another problem behavior in Specials \(simulated\) rose by 200\.0%, although the target did not rise there\./.test(l2.v)&&l2.head.some(t=>/^Other problem behavior/.test(t)),l2.v);
  /* L3, L7 */
  ok('16 BC-RM-L3 "Applied evidence is limited" is replaced by what the applied studies found',!/Applied evidence is limited/.test(gd)&&/What the applied studies found/.test(gd)&&/half of the six children showed no contrast and the other half only mild, short-lived effects/.test(gd)&&/84% had had a stakeholder report contrast, and 51% called it rare or very rare/.test(gd),'guide');
  ok('17 BC-RM-L7 contrast across successive phases, as context only, with timeout named as punishment',/A milder consequence or a smaller reinforcer can work worse after a stronger one than it would have alone\. Change one step at a time, and read the next phase against its own baseline\./.test(gd)&&/Timeout is punishment: this is context for reading data, not a recommendation to use it\./.test(gd),'guide');
  /* L4 */
  const l4=await setCase([[1,4,6,{d:'9/1/26'}],[1,5,6,{d:'9/2/26'}],[1,4,6,{d:'9/3/26'}],[1,5,6,{d:'9/4/26'}],[2,2,1,{d:'9/8/26'}],[2,1,1,{d:'9/9/26'}],[2,2,1,{d:'9/10/26'}],[2,1,1,{d:'9/11/26'}]],{chgRf:LESS});
  const l4old=await p.evaluate(()=>{const d={form:'BC-1',rev:'2026-09',S:{meta:{conName:'Specials (simulated)',chgName:'Room 12 (simulated)',chgRf:'Less — the reinforcer comes less often, or less of it, than before',conUnchanged:'Yes — nothing about this component was altered'},
    rows:[4,5,4,5].map(v=>({d:'',p:'Baseline',con:String(v),chg:'6',n:''})).concat([2,1,2,1].map(v=>({d:'',p:'After the change',con:String(v),chg:'1',n:''})))}};S=readSaved(d);renderAll();return {next:S.meta.next||'',v:document.querySelector('#anVerdict .verdict').textContent};});
  ok('18 BC-RM-L4 a spread of improvement sets the re-check 4 weeks after the last session, with the maintenance note; a file saved before keeps its empty re-check',
    /^Consistent with induction, not contrast/.test(l4.v)&&l4.next==='10/9/26'&&/A gain that spreads to another setting often fades there unless something maintains it/.test(l4.v)&&/Re-check due is set to 10\/9\/26/.test(l4.v)&&l4old.next===''&&/^Consistent with induction/.test(l4old.v),{l4:l4.next,old:l4old});

  /* saved cases keep opening */
  const old=await p.evaluate(()=>{const d={form:'BC-1',rev:'2026-09',S:{meta:{conName:'Specials (simulated)',chgName:'Room 12 (simulated)',chgRf:'Less — the reinforcer comes less often, or less of it, than before',conUnchanged:'Yes — nothing about this component was altered',r_relapse:'Typed before (simulated).'},
    rows:[2,3,2,3].map(v=>({d:'',p:'Baseline (before the change)',con:String(v),chg:'6',n:''})).concat([5,6,5,6].map(v=>({d:'',p:'After the change',con:String(v),chg:'1',n:''})))}};const n=readSaved(d);S=n;renderAll();
    return {ok:!!n,p:S.rows[0].p,v:document.querySelector('#anVerdict .verdict').textContent,rel:document.querySelector('[data-m="r_relapse"]').value,cols:document.querySelectorAll('#dataTbl thead th').length};});
  ok('19 a BC-1 file saved before v25.65 opens: its rows, its old phase label, its typed resurgence note kept in the box, and its verdict',old.ok&&old.p==='Baseline'&&/^Consistent with positive contrast\. Specials \(simulated\), where nothing was changed, rose by/.test(old.v)&&old.rel==='Typed before (simulated).',old);
  /* M3, BC-1 part */
  const ti=await p.evaluate(()=>{S=blank();renderAll();window.__nbhFactsIn({integrity:{obs:[{date:'2026-09-25',pct:85,com:12.5},{date:'2026-10-01',pct:90,com:0}],criterion:90,src:'TI-1'}});return document.querySelector('[data-m="r_int"]').value;});
  ok('20 BC-RM-M3 BC-1\'s integrity line shows the commission share beside the overall figure when TI-1 sends it',/^Treatment integrity 87\.5% over 2 TI-1 observations \(latest 2026-10-01\); commission errors \(the reinforcer given after the behavior\) on up to 12\.5% of consequence opportunities in an observation$/.test(ti),ti);
  await p.close();

  /* ======================= RM-1 ======================= */
  p=await open(RM);
  const sc=(c)=>p.evaluate(c=>scoreCh(Object.assign({a:'',b:''},c)),c);
  /* H5 */
  const h5a=await sc({a:'0,1,0,0,1',b:'3,2,1',ra:'90,95,100,95,100',rb:'70,85,95',ru:'% of opportunities'});
  const h5b=await sc({a:'0,1,0,0,1',b:'1,0,1',ra:'90,95,100,95,100',rb:'95,92,75',ru:'% of opportunities'});
  const h5c=await sc({a:'0,1,0,0,1',b:'1,0,1',ra:'4,5,4,5,4',rb:'4,5,4',ru:'Rate'});
  const an5=await p.evaluate(()=>{S=blank();S.blMean='4';S.ch=[Object.assign(newCh(),{type:'Resurgence',a:'0,1,0,0,1',b:'3,2,1',ra:'90,95,100,95,100',rb:'70,85,95',ru:'% of opportunities'}),
    Object.assign(newCh(),{type:'Resurgence',a:'0,1,0,0,1',b:'1,0,1',ra:'90,95,100,95,100',rb:'95,92,75',ru:'% of opportunities'})];renderAll();
    return {v:document.getElementById('anVerdict').textContent,log:document.querySelector('#chTbl tbody').textContent,out:window.__nbhFactsOut().relapse};});
  ok('21 BC-RM-H5 the replacement response before and after: disrupted below the lowest A value or the 80% criterion; the analysis line; the early warning; the count to the case',
    h5a.rr.dis&&h5b.rr.dis&&!h5c.rr.dis&&/Replacement response disrupted at 2 of 2 challenges; problem behavior met the criterion at 1 of those 2\./.test(an5.v)&&/Early warning at challenge 2: the replacement response fell and problem behavior has not yet met the criterion\. Hold this step and check that requests are being honored\./.test(an5.v)&&
    /Early warning: hold this step and check that requests are being honored\./.test(an5.log)&&an5.out.rrDisrupted===2&&an5.out.rrScored===2&&/; replacement response disrupted at 2 of 2 \(Form RM-1\)$/.test(an5.out.line),{h5a:h5a.rr,h5b:h5b.rr,v:an5.v.slice(0,900),line:an5.out.line});
  /* H6 */
  const h6a=await sc({a:'0,1,0,0,1',b:'3,2,2,2,0,0'});
  const h6b=await sc({a:'0,1,0,0,1',b:'3,0,0'});
  const h6c=await sc({a:'0,1,0,0,1',b:'2,2,2'});
  const auto=await p.evaluate(()=>{S=blank();S.meta.fn='Automatic (nonsocial)';renderAll();const s=scoreCh({a:'0,1,0,0,1',b:'0,1,0,1,3,0'});const risk=document.getElementById('riskWrap').textContent;
    S.ch=[Object.assign(newCh(),{type:'Renewal',a:'0,1,0,0,1',b:'0,1,0,1,3,0'})];S.blMean='2';renderAll();return {s,risk,v:document.getElementById('anVerdict').textContent,base:document.getElementById('baseTbl').textContent,ph:document.getElementById('rmWatch').placeholder};});
  const course=await p.evaluate(()=>document.querySelector('section.only-guide').textContent.replace(/\s+/g,' '));
  ok('22 BC-RM-H6 up to ten B sessions: "Lasted" from the first session that met the rule, flagged at 3 or more, open when it runs to the last session entered; the score stays on the first three',
    h6a.rel&&h6a.lasted===4&&!h6a.open&&h6a.nB10===6&&h6b.lasted===1&&h6c.lasted===3&&h6c.open&&h6a.nB===6,{h6a,h6b,h6c});
  ok('23 BC-RM-H6, M1 automatic function: the watch window is 10, a late rise is flagged, the line on the late peak, and the automatic-function base rates replace the social ones',
    !auto.s.rel&&auto.s.W===10&&auto.s.late===4&&auto.ph==='10'&&/A late rise inside the 10-session watch window came at challenge 1\./.test(auto.v)&&/With automatic function, relapse after a change of person peaked about five sessions later/.test(auto.v)&&
    /Automatically maintained behavior: renewal in 68\.1% of participants and 18\.8% of 985 context changes/.test(auto.risk)&&/18\.8% of 985 context changes/.test(auto.base)&&!/42\.3% of context changes \(outpatient\)/.test(auto.base),{s:auto.s,v:auto.v.slice(0,600)});
  ok('24 BC-RM-H6 the Guide\'s "Course": usually brief, not always, with the large clinic series',/Usually brief, not always\. In one large clinic series, half of renewal episodes ended within one session, a third lasted three sessions or more, and one in eight lasted five or more/.test(course)&&/O’Brien et al\., 2026/.test(course)&&!/every instance was transient/.test(course),'guide');
  /* H7 */
  const h7=await sc({a:'0,0,0,2,0',b:'1.5,0,0'});
  const an7=await p.evaluate(()=>{S=blank();S.blMean='4';S.ch=[Object.assign(newCh(),{type:'Resurgence',a:'0,0,0,2,0',b:'1.5,0,0'})];renderAll();
    return {v:document.getElementById('anVerdict').textContent,cell:document.querySelector('#chTbl tbody tr td:nth-child(8)').textContent,base:document.getElementById('baseTbl').textContent};});
  ok('25 BC-RM-H7 both published rules: max-of-5 No and mean-of-2 Yes shown as "No / Yes", the disagreement hint, and the mean-of-2 base-rate rows',
    !h7.rel&&h7.rel2&&h7.m2===1&&/^No \/ Yesmax-of-5 \/ mean-of-2/.test(an7.cell)&&/The two rules disagree at challenge 1: behavior was still changing in the last treatment sessions\. Hold the next step until it is stable\./.test(an7.v)&&
    /Resurgence challenges meeting mean-of-2/.test(an7.base)&&/46\.83% of 504 thinning steps \(29\.56% by max-of-5\)/.test(an7.base)&&/31\.29% of 505 context changes/.test(an7.base),{h7,cell:an7.cell});
  /* H8, M1, M2, M3 indicators and rows */
  const ind=await p.evaluate(()=>({res:TYPES[0].ind,ren:TYPES[1].ind,rei:TYPES[2].ind,mit:MIT.map(m=>({proc:m.proc,t:m.t,tn:m.tn||'',src:m.src})),rules:document.getElementById('bmtRules').textContent.replace(/\s+/g,' ')}));
  const find=re=>ind.mit.find(m=>re.test(m.proc))||{};
  ok('26 BC-RM-H8 "abrupt" made concrete (2 minutes, more than half), the delay-type indicator, the graded row Applied with the step-size findings, the response-requirement row, the 2-minute convention',
    /^The first “not now” period or delay is longer than 2 minutes, or one step removes more than half of the remaining reinforcement/.test(ind.res[3])&&ind.res[9]==='Delays end when time passes, not when the student completes a tolerance response or a piece of work'&&
    find(/^Thin the schedule in graded steps/).t===1&&/6 of 17 \(35\.3%\)/.test(find(/^Thin the schedule in graded steps/).src)&&/Laureano et al\., 2024/.test(find(/^Thin the schedule in graded steps/).src)&&
    find(/^Thin with a response requirement/).t===1&&find(/^Thin with a response requirement/).tn==='review of published cases'&&/14 of 14 participants and at 46\.49% of transitions/.test(find(/^Thin with a response requirement/).src)&&
    /The first SΔ period\s*No longer than 2 minutes/.test(ind.rules),{res3:ind.res[3],res9:ind.res[9]});
  ok('27 BC-RM-M1 the task-change indicator, and task changes in the renewal base rate',ind.ren[ind.ren.length-1]==='New tasks, curriculum, materials or demand types are planned (a new unit, a new grade)'&&/task changes renewed as often as changes of person or setting/.test(await p.evaluate(()=>TYPES[1].base)),ind.ren);
  ok('28 BC-RM-M2 the missing card as its own resurgence risk, and the Phase 2 row to make the replacement response go everywhere, Applied',
    ind.res[10]==='The card or device is not always in reach, or some adults do not know the replacement response'&&find(/^Make the replacement response go everywhere/).t===1&&/4 of 5 assessments \(Kimball et al\., 2018\)/.test(find(/^Make the replacement response go everywhere/).src),ind.res);
  const m3=await p.evaluate(()=>{S=blank();S.meta.date='9/1/26';renderAll();const r=window.__nbhFactsIn({integrity:{obs:[{date:'2026-09-20',pct:80,com:10}],criterion:90}});const k='rei_'+TYPES[2].ind.length;const ck='rei_'+(TYPES[2].ind.length-1);
    const a=!!S.ind[ck];S.ind[ck]=false;window.__nbhFactsIn({integrity:{obs:[{date:'2026-09-20',pct:80,com:10}],criterion:90}});return {a,b:!!S.ind[ck],note:r.note,risk:document.getElementById('riskWrap').textContent};});
  ok('29 BC-RM-M3 a TI-1 commission error since the form was prepared ticks the reinstatement line once; the caution that 80% depends on the plan; the new adult runs it with coaching first',
    m3.a&&!m3.b&&/a commission error on Form TI-1/.test(m3.note)&&/Caution: 80% integrity holds up for DRA or FCT on FR 1\. It may not hold for NCR, interval-based DRA or DRO/.test(m3.risk)&&ind.rei[ind.rei.length-1]==='TI-1 recorded the reinforcer given after the behavior (commission error) since the last review'&&
    /A new adult first runs the plan with coaching at full integrity before running it alone/.test(find(/^Train and measure caregiver integrity/).proc),m3);
  const m4=find(/on a varying timer/);
  ok('30 BC-RM-M4 delivery around a challenge on a varying timer, faded over several sessions, tagged Basic with one applied study, the DeLeon caution kept',
    /about every N minutes/.test(m4.proc)&&/Fade the extra deliveries over several sessions\. Do not stop them all at once\./.test(m4.proc)&&m4.t===2&&m4.tn==='with one applied study (4 children)'&&/DeLeon et al\., 2005/.test(m4.src)&&/Jones et al\., 2025/.test(m4.src),m4);
  /* M8 */
  const m8=await p.evaluate(()=>{S=blank();S.ch=[Object.assign(newCh(),{type:'Spontaneous recovery',days:'9 school days'})];renderAll();const d=document.querySelector('#chTbl [data-f="days"]');return {hid:d.hidden,v:d.value,base:TYPES[3].base,mag:MIT.find(m=>/^Favor the alternative response/.test(m.proc)).src};});
  ok('31 BC-RM-M8 the days away on a spontaneous-recovery row, the one applied case in the base rate and the magnitude row, and the school hint',
    !m8.hid&&m8.v==='9 school days'&&/One applied case: during FCT, behavior came back at the first session of each day when the reinforcer was small \(10 s\), and not when it was large \(60 s\) \(Lerman et al\., 1999\)/.test(m8.base)&&/watch the first period after weekends and holidays/.test(m8.base)&&/Lerman et al\., 1999/.test(m8.mag)&&/has yet to be explored \(Kimball et al\., 2023\)/.test(m8.base),m8);
  /* L5, L6 */
  ok('32 BC-RM-L5 a printed line that later steps are not safer',/Relapse did not become less likely at later steps or changes in the clinic series; keep the safeguards for every step \(Mitteer et al\., 2022\)\./.test(an7.v),an7.v.slice(-400));
  ok('33 BC-RM-L6 the similarity row carries the classroom evidence',/Walker &amp; Buckley, 1972/.test(find(/^Increase the similarity/).src)&&/renewed for 3 of 4 children \(Saini et al\., 2018\)/.test(find(/^Increase the similarity/).src),find(/^Increase the similarity/).src);
  /* the lean-baseline row (the BCBA, 11/2): selectable, labelled, explained */
  const lean=await p.evaluate(()=>{S=blank();S.meta.harm='No';renderAll();const i=MIT.findIndex(m=>m.k==='leanBl');const cb=document.querySelector('#mitTbl [data-mi="'+i+'"][data-f="on"]');return {dis:cb.disabled,on:cb.checked,txt:cb.closest('tr').querySelector('td.proc').textContent};});
  ok('34 the BCBA (11/2) the lean-baseline row stays selectable, never ticked by default, labelled "OPTION: Reinforces problem behavior on purpose:" with what, why, how long and what ends it',
    !lean.dis&&!lean.on&&/^OPTION: Reinforces problem behavior on purpose:/.test(lean.txt)&&/What it does:/.test(lean.txt)&&/Why:/.test(lean.txt)&&/For how long:/.test(lean.txt)&&/What the data must show before it ends:/.test(lean.txt)&&/at least 5 sessions, until the trend is flat or rising and the last 5 sessions vary by no more than half their mean/.test(lean.txt)&&/safety plan/.test(lean.txt),lean);   /* the BCBA, 11/6: TD-1's stopping rule */
  /* saved RM-1 files keep opening */
  const oldR=await p.evaluate(()=>{const d={form:'RM-1',rev:'2026-09',S:{meta:{fn:'Escape / avoidance (social negative)'},ind:{res_3:true,res_0:true},mit:{'9':{on:true,how:'graded (simulated)'}},blMean:'4',ch:[{date:'9/1/26',type:'Resurgence',planned:'Planned',what:'step (simulated)',a:'0,1,0,0,1',b:'3,2,1',resp:''}]}};
    S=fromFile(d.S);renderAll();return {ch:S.ch[0],ind:S.ind,mit:S.mit[9],cell:document.querySelector('#chTbl tbody tr td:nth-child(8)').textContent,v:document.getElementById('anVerdict').textContent};});
  ok('35 an RM-1 file saved before v25.65 opens: its challenge scores as before (max-of-5 Yes), its ticks and rows keep their places, and the new fields are empty',
    oldR.ch.ra===''&&oldR.ch.days===''&&oldR.ind.res_3===true&&oldR.mit.on===true&&/^Yes \//.test(oldR.cell)&&/^Relapse met the criterion at 1 of 1 challenges \(100%\)/.test(oldR.v),oldR);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('99 no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
