/* v22.49 Form EA-1, the experimental analysis (review F149-F157, I76-I80). The health record is shown apart from Medical
   clearance, which is never filled from a medication list, and an analysis of injurious behavior without clearance is flagged;
   the precursor template words every card for the precursor; a near-zero condition beside a high one is "rule met, magnitude
   low" and stays out of the outcome and the evidence; the self-injury subtype is read only after automatic maintenance; the
   function handed to FS-1 is chosen, else the outcome's, and a clause that rules a function out never adds it; the treatment
   goal is chosen; the assent plan (SI-1) ends sessions and its withdrawal pauses the analysis; the trial-based analysis gets a
   reading; the treatment log can take DD-1's record, and the design verdict and the session safety record reach PR-1; a
   session safety sheet; the variant answers and PA-1's items come from the case; a blind second-analyst reading.
   Simulated people only. usage: node qa/v2249-test.js (29 checks) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const EA='EA-1_Experimental-Analysis-Protocol_v2026-09.html';
/* the review's worked example: Attention 4,2,5,3; Demand 86,102,83,95; Alone 2,1,2,1; Play as given; 10-min sessions */
const SEQ=play=>[0,1,2,3].flatMap(k=>[[0,[4,2,5,3][k]],[1,[86,102,83,95][k]],[2,[2,1,2,1][k]],[3,play[k]]]);
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async(id,file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});return p;};
  const tpl=(p,k)=>p.evaluate(async k=>{eaAPI.setv('v.chosen',k);document.querySelector('[name="v.chosen"]').dispatchEvent(new Event('change',{bubbles:true}));await eaAPI.loadTpl(true);},k);
  const fill=(p,seq)=>p.evaluate(seq=>{eaAPI.$('#nSess').value=String(Math.max(24,seq.length));eaAPI.renderSess();
    seq.forEach(([c,v],i)=>{eaAPI.setv(`s[${i}].c`,String(c));eaAPI.setv(`s[${i}].m`,'10');eaAPI.setv(`s[${i}].v`,String(v));eaAPI.setv(`s[${i}].p`,'FA');});eaAPI.renderGraph();eaAPI.renderAnalysis();},seq);
  /* ---- F149 ---- */
  let e=await open('EA-1',EA);
  const f1=await e.evaluate(()=>{eaAPI.setv('s.med','Current medications (Form DM-1): Risperidone 0.5 mg (simulated).');
    __nbhFactsIn({profile:{health:{meds:[{name:'Risperidone (simulated)',dose:'0.5 mg'}],conditions:'Seizure disorder (simulated)',allergies:'None known'}},behaviors:[{label:'Head hitting (simulated)',def:'Hand to head with force (simulated)',urg:4}]});
    const vis=id=>{const n=document.getElementById(id);return !!n&&!n.hidden;};
    return {med:document.querySelector('[name="s.med"]').value,health:document.getElementById('eaHealth').textContent,row:vis('eaHealthRow'),flag:vis('eaClearFlag'),run:vis('eaRunClear'),txt:document.getElementById('eaClearFlag').textContent};});
  ok('1 F149 the health record (medications, conditions, allergies) is its own line; Medical clearance is not filled from it, and a list the case wrote there before is taken out',f1.med===''&&f1.row&&/Seizure disorder/.test(f1.health)&&/Risperidone \(simulated\) 0\.5 mg/.test(f1.health)&&/Allergies: None known/.test(f1.health),f1);
  ok('2 F149 at TB-1 level 4 with no clearance the Setup sheet (printed too) and the runner say the safety plan is incomplete',f1.flag&&f1.run&&/Safety plan incomplete: no medical clearance/.test(f1.txt),f1);
  const f1b=await e.evaluate(()=>{const m=document.querySelector('[name="s.med"]');m.value='School nurse consulted 10/1 (simulated); no restrictions';m.dispatchEvent(new Event('input',{bubbles:true}));return document.getElementById('eaClearFlag').hidden&&document.getElementById('eaRunClear').hidden;});
  ok('3 F149 a clearance written takes the flags off',f1b);
  /* ---- I77 the variant answers from the case ---- */
  const i77=await e.evaluate(()=>{__nbhFactsIn({plan:{prec:'Screams (simulated)'},behaviors:[{label:'Head hitting (simulated)',urg:4}],data:{behaviors:[{name:'Head hitting (simulated)',kind:'target',measure:'count',days:10,zero:1,mean:5}]}});
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {risk:v('v.risk'),prec:v('v.prec'),rate:v('v.rate')};});
  ok('4 I77 the variant selector takes the injury risk (TB-1 level 4), the precursor and the rate (DD-1) from the case',i77.risk==='high'&&i77.prec==='yes'&&i77.rate==='mod',i77);
  await e.close();
  /* ---- F150 the precursor cards ---- */
  e=await open('EA-1',EA);await tpl(e,'precursor');await sleep(300);
  const f150=await e.evaluate(()=>{const c=[0,1,2,3].map(i=>({name:document.querySelector(`[name="c[${i}].name"]`).value,beh:document.querySelector(`[name="c[${i}].beh"]`).value,cons:document.querySelector(`[name="c[${i}].cons"]`).value,fid:document.querySelector(`[name="c[${i}].fid"]`).value}));
    const s=document.getElementById('eaCond');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));return {c,follow:document.getElementById('eaFollow').value,script:document.getElementById('eaScript').textContent};});
  const dem=f150.c.find(x=>x.name==='Demand'),att=f150.c.find(x=>x.name==='Attention'),play=f150.c.find(x=>/Play/.test(x.name));
  ok('5 F150 every precursor card is worded for the precursor: Demand and Attention follow it, the severe behavior earns nothing, Play ignores both',/contingent on each PRECURSOR/.test(dem.cons)&&/earns no break/.test(dem.cons)&&/contingent on each PRECURSOR/.test(att.cons)&&/ignore the precursor and the severe behavior/.test(play.beh)&&/precursor only/.test(dem.fid),f150.c);
  ok('6 F150 the runner reads Demand as following the precursor, and its script says so',f150.follow==='pre'&&/After a precursor/.test(f150.script)&&!/After a target/.test(f150.script),{follow:f150.follow,script:f150.script.slice(0,300)});
  await e.close();
  /* ---- F151, F152, F153 on the worked example ---- */
  e=await open('EA-1',EA);await tpl(e,'standard');await fill(e,SEQ([0,0,0,0]));await sleep(300);
  const f151=await e.evaluate(()=>{eaAPI.setv('d.fn',true);/* v24.21: the function flows once the Decision is ticked */return {head:document.querySelector('#critVerdict .tag').textContent,verdict:document.getElementById('critVerdict').textContent,tbl:document.getElementById('critTbl').textContent,ev:__nbhFactsOut().evidence,lod:document.getElementById('lodOutEA').textContent,auto:document.getElementById('dFnAuto').textContent};});
  ok('7 F151 with the control at zero, Attention and Alone beside Demand read "rule met, magnitude low" and the outcome is Demand alone',/^Differentiated: Demand meets the rule/.test(f151.head)&&(f151.tbl.match(/rule met, magnitude low/g)||[]).length===2&&/Check on visual review: Attention, Alone/.test(f151.verdict),{head:f151.head,verdict:f151.verdict.slice(0,500)});
  ok('8 F151 Form FS-1 is handed escape, not "Attention and Escape and Automatic"',f151.ev&&f151.ev.fnKey==='escape'&&/Escape/.test(f151.ev.fn)&&!/Attention/.test(f151.ev.fn),f151.ev);
  ok('9 F152 the subtype panel says it does not apply when the analysis shows a social function',/Not applicable: the analysis shows a social function \(Demand\)/.test(f151.lod)&&!/Subtype 1/.test(f151.lod),f151.lod);
  ok('10 F153 the function for the report starts as the outcome reads',/As the outcome reads: Escape/.test(f151.auto),f151.auto);
  const f153=await e.evaluate(()=>{eaAPI.setv('d.func','Escape from demands; attention ruled out');const a=__nbhFactsOut().evidence.fnKey;const s=document.querySelector('[name="d.fnkey"]');s.value='attention';s.dispatchEvent(new Event('change',{bubbles:true}));const b=__nbhFactsOut().evidence.fnKey;return {a,b};});
  ok('11 F153 the evidence takes the outcome over the words, and the function chosen for the report over both',f153.a==='escape'&&f153.b==='attention',f153);
  /* I78 the blind reading on the same data */
  const b1=await e.evaluate(()=>{eaAPI.setView('analysis');document.getElementById('eaBlindGo').click();const fig=document.getElementById('eaBlindFig').textContent,blind=document.body.classList.contains('ea-blind'),hidden=getComputedStyle(document.getElementById('critVerdict')).display==='none';
    document.querySelector('#eaBlindPick [data-bl="U"]').checked=true;document.getElementById('eaBlindShow').click();const still=document.body.classList.contains('ea-blind');
    eaAPI.setv('d2.who','Dana Whitfield, BCBA (simulated)');document.getElementById('eaBlindShow').click();
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {fig:/Attention|Demand|Alone|Play/.test(fig),blind,hidden,still,after:document.body.classList.contains('ea-blind'),read:v('d2.read'),agree:v('d2.agree'),outcome:v('d2.outcome'),res:document.getElementById('eaBlindRes').textContent};});
  ok('12 I78 the blind reading hides the outcome and the condition names, and needs the second analyst\'s name',b1.blind&&b1.hidden&&!b1.fig&&b1.still,b1);
  ok('13 I78 recording the reading shows the outcome and says the two disagree',!b1.after&&b1.read==='Undifferentiated'&&b1.agree==='disagree'&&/Demand meets the rule/.test(b1.outcome)&&/disagree/.test(b1.res),b1);
  await e.close();
  e=await open('EA-1',EA);await tpl(e,'standard');
  await fill(e,[0,1,2,3].flatMap(k=>[[0,[2,1,2,1][k]],[1,[1,2,1,1][k]],[2,[30,28,33,31][k]],[3,[3,5,2,4][k]]]));await sleep(300);
  const f152=await e.evaluate(()=>document.getElementById('lodOutEA').textContent);
  ok('14 F152 when the alone condition alone meets the criteria the subtype is read',/Subtype 1: LOD/.test(f152),f152.slice(0,300));
  await e.close();
  /* ---- F153 the words alone ---- */
  e=await open('EA-1',EA);
  const k1=await e.evaluate(()=>{eaAPI.setv('d.func','Escape from demands; attention ruled out');const a=__nbhFactsOut().evidence.fnKey;eaAPI.setv('d.func','social negative reinforcement (escape from multi-step math tasks); multiple control ruled out');const b=__nbhFactsOut().evidence.fnKey;return {a,b};});
  ok('15 F153 with no sessions, a clause that rules a function out never adds it',k1.a==='escape'&&k1.b==='escape',k1);
  /* ---- F155 the goal ---- */
  const g=await e.evaluate(()=>{eaAPI.setv('t.design','abab');eaAPI.setv('t.dv','Off-task behavior per min');const D=[['A1',[8,9,8,9,8]],['B1',[1,2,1,1,2]],['A2',[8,8,9,8,9]],['B2',[1,1,2,1,1]]];let i=0;
    D.forEach(([p,ys])=>ys.forEach(y=>{eaAPI.setv(`tx[${i}].p`,p);eaAPI.setv(`tx[${i}].v`,String(y));i++;}));eaAPI.renderTx();const a=document.getElementById('txVerdict').textContent;
    eaAPI.setv('t.goal','increase');eaAPI.renderTx();const b=document.getElementById('txVerdict').textContent;eaAPI.setv('t.goal','decrease');eaAPI.renderTx();const c=document.getElementById('txVerdict').textContent;return {a,b,c};});
  ok('16 F155 off-task behavior is read as decrease, and the check says the goal was not set',/Meets the three-demonstration/.test(g.a)&&/Goal not set: read as decrease/.test(g.a),g.a.slice(0,400));
  ok('17 F155 the goal decides: increase on the same data is not at standard, decrease meets it',/Not yet at standard/.test(g.b)&&/Meets the three-demonstration/.test(g.c)&&/Goal: decrease/.test(g.c),{b:g.b.slice(0,200),c:g.c.slice(0,200)});
  await e.close();
  /* ---- F156 assent, and I79 the safety record, at the table ---- */
  e=await open('EA-1',EA);await tpl(e,'standard');
  const f156=await e.evaluate(()=>{__nbhFactsIn({student:{assent:'partial',stop:{signs:'pushes the materials away; says "stop"',steps:'Say okay and stop the task'}}});
    return {term:document.querySelector('[name="s.term"]').value,run:document.getElementById('eaRunAssent').textContent,shown:!document.getElementById('eaRunAssent').hidden};});
  ok('18 F156 the assent plan becomes a session termination line and its status shows in the runner',/Assent withdrawn when the student pushes the materials away; says "stop" \(Form SI-1\): the session ends\./.test(f156.term)&&f156.shown&&/partial/.test(f156.run),f156);
  const run1=await e.evaluate(async()=>{{const c=document.querySelector('[name="s.consent"]');c.value='Parent consent on file (test)';c.dispatchEvent(new Event('change',{bubbles:true}));}   /* v24.20: the runner's safety gate */
    eaAPI.setView('sessions');const s=document.getElementById('eaCond');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));
    const go=async(fn)=>{document.getElementById('eaStart').click();await new Promise(r=>setTimeout(r,400));fn();await new Promise(r=>setTimeout(r,200));document.getElementById('eaSave').click();await new Promise(r=>setTimeout(r,200));};
    await go(()=>document.getElementById('eaAssentEnd').click());
    await go(()=>{document.getElementById('eaHoldUsed').checked=true;document.getElementById('eaEnd').click();});await new Promise(r=>setTimeout(r,400));
    eaAPI.renderAnalysis();const n=i=>document.querySelector(`[name="s[${i}].n"]`).value;return {n0:n(0),n1:n(1),verdict:document.getElementById('critVerdict').textContent,ev:(__nbhFactsOut()||{}).evidence};});
  ok('19 F156 Assent withdrawn ends the session at once and the row says so; the outcome says to pause the analysis and review assent',/assent withdrawn at/.test(run1.n0)&&/ended with assent withdrawn/.test(run1.verdict)&&/Pause the analysis and review assent with the team \(Form SI-1\)/.test(run1.verdict),{n0:run1.n0,verdict:run1.verdict.slice(0,600)});
  ok('20 I79 a hold used is written into the row and the outcome says to record it on Form DD-1 the same day; the case carries it',/hold used: a restraint, record it today on Form DD-1/.test(run1.n1)&&/A hold was used in session 2/.test(run1.verdict)&&run1.ev&&run1.ev.safety&&run1.ev.safety.holds.length===1&&run1.ev.safety.assent===1,{n1:run1.n1,safety:run1.ev&&run1.ev.safety});
  /* I76 the session safety sheet */
  const ss=await e.evaluate(async()=>{window.print=()=>{};document.getElementById('eaSSBtn').click();await new Promise(r=>setTimeout(r,300));return document.getElementById('eaSS').innerHTML;});
  const ids=await e.evaluate(()=>{const m={};document.querySelectorAll('[id]').forEach(x=>{if(!/^v2[a-z]+$/.test(x.id))m[x.id]=(m[x.id]||0)+1;});
    return {dup:Object.keys(m).filter(k=>m[k]>1),box:document.getElementById('eaHoldUsed').type,hold:document.getElementById('eaHold').type};});
  ok('29 I79 Hold used is its own box, apart from the runner\'s Hold after a target, and no id is used twice (the walkthrough\'s scene gradients aside)',ids.dup.length===0&&ids.box==='checkbox'&&ids.hold==='number',ids);
  ok('21 I76 the session safety sheet carries the stop signals, the termination criteria, the clearance (not recorded) and the shred line',/Session safety sheet/.test(ss)&&/Stop signals: pushes the materials away/.test(ss)&&/NOT RECORDED/.test(ss)&&/shred it after the session/.test(ss)&&/Assent withdrawn when the student/.test(ss),ss.slice(0,400));
  await e.close();
  /* ---- I80 PA-1's items on the cards ---- */
  e=await open('EA-1',EA);await tpl(e,'standard');
  const i80=await e.evaluate(()=>{__nbhFactsIn({menu:['Tablet','Bubbles','Stickers','Puzzle','Blocks'].map(n=>({name:n+' (simulated)'}))});const m=i=>document.querySelector(`[name="c[${i}].mat"]`).value;return {att:m(0),play:m(3)};});
  ok('22 I80 PA-1\'s ranked items land on the cards: the top three in Play, the next ones in Attention',/^Highly preferred items from PA-1: Tablet \(simulated\), Bubbles \(simulated\), Stickers \(simulated\)$/.test(i80.play)&&/moderately preferred items from PA-1: Puzzle \(simulated\), Blocks \(simulated\)/.test(i80.att),i80);
  await e.close();
  /* ---- F154 the trial-based reading ---- */
  e=await open('EA-1',EA);await tpl(e,'trial');
  const f154=await e.evaluate(()=>{eaAPI.setv('d.fn',true);/* v24.21 */eaAPI.$('#nTrial').value='10';eaAPI.renderTrials(true);const hits={0:[2,3],1:[1,8],2:[0,1],3:[2,2]};
    Object.keys(hits).forEach(c=>{for(let k=0;k<10;k++){eaAPI.setv(`tr[${c}].ctl[${k}]`,k<hits[c][0]?'1':'0');eaAPI.setv(`tr[${c}].tst[${k}]`,k<hits[c][1]?'1':'0');}});
    eaAPI.renderAnalysis();return {head:document.querySelector('#critVerdict .tag').textContent,tbl:document.getElementById('critTbl').textContent,ev:(__nbhFactsOut()||{}).evidence};});
  ok('23 F154 the trial-based analysis gets a reading: Demand is the candidate (test 80% against control 10% over 10 trials)',/^Trial-based reading: Demand \(candidate/.test(f154.head)&&/candidate/.test(f154.tbl),f154.head);
  ok('24 F154 the reading reaches Form FS-1: escape, moderate, with the trials counted',f154.ev&&f154.ev.fnKey==='escape'&&f154.ev.strength==='Moderate'&&f154.ev.n===40,f154.ev);
  await e.close();
  /* ---- F157 DD-1's record into the treatment log; the verdict to the case ---- */
  const dd=await open('DD-1','Daily_Behavior_Data_and_Visual_Analysis.html');await L.loadSim(dd);await sleep(1500);
  const ser=await dd.evaluate(()=>{const o=__nbhFactsOut();return o&&o.data&&o.data.series||null;});
  ok('25 F157 Form DD-1 hands the case its day-by-day record: each day with its phase and its values',Array.isArray(ser)&&ser.length>5&&ser.every(x=>x.date&&x.v&&typeof x.v==='object')&&ser.some(x=>x.cond),ser&&ser.slice(0,2));
  await dd.close();
  e=await open('EA-1',EA);
  const SER=[...Array(12)].map((_,i)=>({date:'2026-09-'+String(8+i).padStart(2,'0'),cond:i<6?'Baseline':'Treatment',v:{'Head hitting (simulated)':i<6?[6,7,5,6,8,6][i]:[2,1,1,0,1,0][i-6]}}));
  const f157=await e.evaluate(async S=>{__nbhFactsIn({data:{behaviors:[{name:'Head hitting (simulated)',kind:'target',measure:'count',direction:'decrease',days:12,zero:2,mean:3.6}],series:S}});
    const shown=!document.getElementById('txDDRow').hidden;document.getElementById('txFromDD').click();await new Promise(r=>setTimeout(r,500));
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {shown,p0:v('tx[0].p'),v0:v('tx[0].v'),p11:v('tx[11].p'),v11:v('tx[11].v'),goal:v('t.goal'),dv:v('t.dv'),ver:window.__eaTxVerdict};},SER);
  ok('26 F157 the treatment log takes DD-1\'s record of the behavior: its days, phases, values and goal',f157.shown&&f157.p0==='Baseline'&&f157.v0==='6'&&f157.p11==='Treatment'&&f157.v11==='0'&&f157.goal==='decrease'&&/Head hitting \(simulated\) \(Form DD-1\)/.test(f157.dv)&&f157.ver&&f157.ver.points===12&&f157.ver.from==='DD-1',f157);
  await e.close();
  const pr=await open('PR-1','PR-1_Periodic-Plan-Review_v2026-09.html');
  const prt=await pr.evaluate(()=>prAlsoText({evidence:{'EA-1':{safety:{sessions:6,terminated:1,assent:1,holds:['10/9/2026'],injuries:[]},txDesign:{name:'A-B-A-B withdrawal',demos:3,ok:true,points:20}}}}));
  ok('27 F157, I79 Form PR-1 names the analysis\' safety record and the treatment design verdict',/Experimental analysis \(Form EA-1\): 6 sessions; 1 ended for safety; 1 ended with assent withdrawn; a hold used in 1 \(10\/9\/2026\)\./.test(prt)&&/Treatment design \(Form EA-1\), A-B-A-B withdrawal: 3 demonstrations of the three asked; meets the three-demonstration and five-point standards\./.test(prt),prt);
  await pr.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('28 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
