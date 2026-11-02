/* v25.64 the research review of the graphs and decisions, parcel PRSA: Forms PR-1 and SA-1 (simulated data only).
   PR-1  H4  the suggestion reads a stated window (the last 5 days of the current period, or the period mean), with DD-1's
             days kept by the import; the conservative dual-criterion check (Fisher et al., 2003, Table 1); a provisional
             comparison (baseline under 3 days, current period under 5) never suggests modify or return to assessment; the
             80%/90% benchmark beside the bands; the 25% band called some progress.
         H5  the Guide prints the fading rule the code applies (aim, or 90% with no aim, after 10 school days); the comments
             no longer say 60%; a default criterion to advance a fading step.
         M1  the analyst's reading and a blind second reader; an uncertain reading asks for the reasoning before Modify, Fade or Exit.
         M6  the graph draws DD-1's days when they are there, and says when each point is a period mean.
         M9  a re-entry rule computed from the final period (the highest of the last 5 days; the upper control limit).
         L3  the line between baseline and plan is solid, zero sits above the axis, the axis top can be kept.
         L6  closing a review logs a standard outcome row.
   SA-1  M7  the no-change rule reads the line of progress through the last 5 teaching sessions, drawn on the graph.
         L3  solid phase lines; zero above the axis.   L4  mastery judged target by target, with the mixed-array check.
         L5  a third baseline probe when the two differ by more than 20 points or the second is higher.
         PLAN M9  one mastery standard and its citations checked.
   Saved records from before v25.64 open and read as before.
   usage: node qa/v2564-prsa-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/',PR=W+'PR-1_Periodic-Plan-Review_v2026-09.html',SA=W+'SA-1_Skill-Acquisition-Data_v2026-10.html';
const PRSRC=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation','PR-1_Periodic-Plan-Review_v2026-09.html'),'utf8');
const SASRC=fs.readFileSync(path.join(L.ROOT,'NBH-Workstation','SA-1_Skill-Acquisition-Data_v2026-10.html'),'utf8');
/* a Form DD-1 record: a baseline and a plan condition, one target (count) and its paired replacement, school days in a row */
function dd(base,plan,rep){const rows=[],d=new Date(2026,8,1,12);const iso=()=>{while(d.getDay()%6===0)d.setDate(d.getDate()+1);const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');d.setDate(d.getDate()+1);return s;};
  base.forEach((v,i)=>rows.push({date:iso(),values:Object.assign({b1:v},rep?{b2:0}:{})}));
  plan.forEach((v,i)=>rows.push(Object.assign({date:iso(),values:Object.assign({b1:v},rep?{b2:rep[i]}:{})},i?{}:{phaseType:'full',phaseLabel:'Plan'})));
  return {form:'DD-1',meta:{client:'SIMULATED – Sample Student',baseline:'Baseline'},settings:{},
    behaviors:[{id:'b1',name:'Hitting (simulated)',kind:'target',measure:'count',direction:'decrease'}].concat(rep?[{id:'b2',name:'Break card (simulated)',kind:'replacement',measure:'count',direction:'increase',pairWith:'b1'}]:[]),rows};}
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  /* ======================= PR-1 ======================= */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('PR-1: '+e.message));await p.goto(PR);await sleep(1000);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};nbhUI.toast=()=>{};
    window.__imp=(rec)=>{S=blank();renderAll();ddRead(rec,'file','dd-test.json');ddApply();
      const e=document.querySelector('[data-m="intPct"]');e.value='95';e.dispatchEvent(new Event('input',{bubbles:true}));};
    window.__st=()=>({win:document.getElementById('pr64Win').textContent,sug:document.getElementById('decSuggest').textContent,chk:document.getElementById('decCheck').textContent,
      agree:document.getElementById('pr64Agree').textContent,svg:document.getElementById('prPlot').dataset.pr64,svgTxt:document.getElementById('prPlot').textContent});});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const PLAN=[3,2,2,1,1,0,1,0,0,0,1,0];
  await p.evaluate(r=>__imp(r),dd([5,4,6,5,5],PLAN,[1,2,3,3,4,4,5,5,6,6,6,7]));await sleep(250);
  let s=await p.evaluate(()=>__st());
  const kept=await p.evaluate(()=>({days:S.dd.t.rows.map(r=>(r.days||[]).length),n:S.dd.t.rows.map(r=>r.n)}));
  ok('H4/M6 the import keeps each period’s days with the figures (5 baseline, 12 plan)',kept.days[0]===5&&kept.days[1]===12,kept);
  ok('H4 the change is shown two ways, the last 5 days and the period mean, and names the one the suggestion uses',/Change from baseline, two ways/.test(s.win)&&/-96%/.test(s.win)&&/-82%/.test(s.win)&&/The suggestion uses the last 5 days/.test(s.win),s.win.slice(0,500));
  ok('H4 the structured check: 12 of 12 days below both lines, 9 needed (Fisher et al., 2003, Table 1): beyond what the baseline predicts',/12 of 12 days below both lines \(9 needed\): change beyond what the baseline predicts/.test(s.win),s.win);
  ok('H4/H5 at 96% below baseline over the last 5 days, 12 days in the phase, no aim: begin fading, read from the last 5 days',/Suggested: begin fading/.test(s.sug)&&/last 5 days of the current period are 96% below/.test(s.sug),s.sug.slice(0,400));
  ok('H4 the benchmark prints beside the suggestion as context (80% and 90% reached)',/80% or 90% reduction/.test(s.sug)&&/80%: reached; 90%: reached/.test(s.sug),s.sug.slice(-500));
  ok('M6 the graph draws the days (17 points), not one mean per period',s.svg==='days'&&/each point is a day/.test(s.svgTxt),{svg:s.svg});
  const g=await p.evaluate(()=>{const svg=document.getElementById('prPlot');const c=[...svg.querySelectorAll('circle')];const ph=[...svg.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='#1B2A2E'&&+l.getAttribute('y1')===46);
    return {n:c.filter(x=>x.getAttribute('fill')==='#8E2A2A').length,rep:c.filter(x=>x.getAttribute('stroke')==='#2F6B37').length,maxCy:Math.max(...c.map(x=>+x.getAttribute('cy'))),ph:ph.map(l=>({dash:l.getAttribute('stroke-dasharray'),w:l.getAttribute('stroke-width')}))};});
  ok('M6 every day is a point: 17 target days and the replacement’s days',g.n===17&&g.rep===17,g);
  ok('L3 the line between baseline and plan is solid',g.ph.length===1&&!g.ph[0].dash,g);
  ok('L3 zero sits above the axis (a day at 0 is drawn above the frame’s bottom at 272)',g.maxCy<=266,g);
  await setM('prWin','mean');await sleep(150);s=await p.evaluate(()=>__st());
  ok('H4 set to the period mean: the suggestion reads it (82% below: fading waits for the plan’s criterion)',/The suggestion uses the period mean/.test(s.win)&&/continue unchanged; fading waits/.test(s.sug)&&/most recent period is 82% below/.test(s.sug),s.sug.slice(0,300));
  await setM('prWin','');await sleep(100);
  /* M1 the readers */
  await setM('rdA','Change');await setM('rdB','No change');await setM('dec','Modify the plan');await sleep(150);s=await p.evaluate(()=>__st());
  ok('M1 the two readers differ, and the second differs from the check: the reading is uncertain',/The reading is uncertain/.test(s.agree)&&/The two readers differ/.test(s.agree)&&/second reader’s reading \(no change\) differs from the structured check/.test(s.agree),s.agree);
  ok('M1 Modify recorded with no reasoning while uncertain: the check asks for the reason',/reading of the graph is uncertain/.test(s.chk),s.chk);
  await setM('decWhy','The second reader saw the flat stretch after day 6; the team weighed it and chose to change the reinforcer.');await sleep(120);s=await p.evaluate(()=>__st());
  ok('M1 with the reasoning written, that check is gone',!/reading of the graph is uncertain/.test(s.chk),s.chk);
  await setM('rdB','Change');await setM('decWhy','');await setM('dec','Begin fading');await sleep(120);s=await p.evaluate(()=>__st());
  ok('M1 both readers and the check agree: not uncertain, nothing asked',!/uncertain/.test(s.agree)&&/agree/.test(s.agree)&&!/reading of the graph is uncertain/.test(s.chk),{a:s.agree,c:s.chk});
  const blind=await p.evaluate(()=>{document.getElementById('prBlind').click();const v=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none';};
    const r={metrics:v('dataMetrics'),win:v('pr64Win'),plot:v('prPlot')};document.getElementById('prBlind').click();r.back=v('pr64Win');return r;});
  ok('M1 "Graph only, for the second reader" hides the figures and the check and keeps the graph',!blind.metrics&&!blind.win&&blind.plot&&blind.back,blind);
  /* M9 the re-entry rule */
  await setM('backRule','max5');await sleep(120);
  let b=await p.evaluate(()=>document.getElementById('pr64Back').textContent);
  ok('M9 the highest of the last 5 days before exit (1), with the window printed',/the last 5 days of period 1 before exit; the highest 1 occurrences per day/.test(b)&&/mean of 2 consecutive monitoring days is above 1/.test(b),b);
  await p.evaluate(()=>document.getElementById('pr64BackWrite').click());await sleep(150);
  let x=await p.evaluate(()=>({back:S.meta.back,ex:(window.__nbhFactsOut()||{}).review}));
  ok('M9 written into What brings the plan back; the case reads the threshold 1',/^The plan comes back when the mean of two consecutive monitoring days is above 1 occurrences per day/.test(x.back)&&x.ex&&x.ex.exit&&x.ex.exit.thresholdN===1,x);
  await setM('backRule','spc');await sleep(120);b=await p.evaluate(()=>document.getElementById('pr64Back').textContent);
  ok('M9 the upper control limit: mean 0.92 + 2.66 × mean moving range 0.64 = 2.61',/mean 0\.92 occurrences per day, mean moving range 0\.64; upper control limit 0\.92 \+ 2\.66 × 0\.64 = 2\.61/.test(b)&&/8 days in a row are above 0\.92/.test(b),b);
  /* H5 the fading default */
  const fd=await p.evaluate(()=>{S.fade=[{s:'Delay to the break: 30 s',c:'',d:'',m:'',w:''},{s:'',c:'',d:'',m:'',w:''}];renderFade();const ph=document.querySelector('#fadeTbl [data-f="c"]').placeholder;
    document.getElementById('prFadeDef').click();return {ph,c0:S.fade[0].c,c1:S.fade[1].c};});
  ok('H5 the default criterion to advance: 2 consecutive days at or below the 90% level (0.5 per day here), back after 2 above',/Advance one step after 2 consecutive days at or below the 90% reduction level \(0\.5 occurrences per day, 90% below the baseline of 5\); return to the previous step after 2 consecutive days above it/.test(fd.c0)&&fd.c1===''&&fd.ph===fd.c0,fd);
  /* L3 the axis kept */
  const ax=await p.evaluate(()=>{document.getElementById('prKeepAxis').click();const top=S.meta.yTop;const labs=[...document.querySelectorAll('#prPlot text')].map(t=>t.textContent);
    const e=document.getElementById('prYTop');e.value='10';e.dispatchEvent(new Event('input',{bubbles:true}));const labs2=[...document.querySelectorAll('#prPlot text')].map(t=>t.textContent);
    e.value='3';e.dispatchEvent(new Event('input',{bubbles:true}));const msg=document.getElementById('prAxisMsg').textContent;e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));return {top,has8:labs.includes('8'),has10:labs2.includes('10'),msg};});
  ok('L3 "Keep this axis" keeps the top (8) and a kept top draws the axis (10); a value above it is said',ax.top==='8'&&ax.has8&&ax.has10&&/above the kept top of 3/.test(ax.msg),ax);
  /* L6 the outcome row */
  await setM('dec','Continue unchanged');await setM('rdA','Change');await sleep(100);
  const lg=await p.evaluate(async()=>{await prCloseReview();const e=S.log[S.log.length-1];return {e,txt:document.getElementById('prLogTbl').textContent,rdA:S.meta.rdA||''};});
  ok('L6 the log keeps the outcome row: design, baseline mean, last 5 days, reduction, 80% and 90%, the check',lg.e.design==='AB (baseline, then the plan)'&&lg.e.baseMean==='5.00'&&lg.e.last5==='0.2 (5 days)'&&/^96% below baseline \(last 5 days\)/.test(lg.e.redPct)&&lg.e.r80==='yes'&&lg.e.r90==='yes'&&/^beyond \(12 of 12, 9 needed\)/.test(lg.e.cdc)&&lg.e.decisionText==='Continue unchanged',lg.e);
  ok('L6 the log shows it; the readings are this review’s and are cleared for the next',/Outcome: AB \(baseline, then the plan\); baseline 5\.00; last 5 days 0\.2/.test(lg.txt)&&lg.rdA==='',{t:lg.txt.slice(0,400),rdA:lg.rdA});
  const rt=await p.evaluate(()=>{const o=JSON.parse(JSON.stringify({form:'PR-1',S}));const s=fromFile(o);return {log:s.log[s.log.length-1].cdc,days:(s.dd.t.rows[1].days||[]).length};});
  ok('L6/H4 saved and opened: the outcome row and the days come back',/^beyond/.test(rt.log)&&rt.days===12,rt);
  /* H4 provisional: 2 baseline days, 3 plan days, behavior up 11%: not modify, not reassess */
  await p.evaluate(r=>__imp(r),dd([3,3],[3,4,3]));await sleep(200);s=await p.evaluate(()=>__st());
  ok('H4 provisional (2 baseline days, 3 in the period): continue and collect data, never modify or return to assessment',/continue and collect data until the phase is long enough/.test(s.sug)&&!/Suggested: (modify|return)/.test(s.sug)&&/Provisional: too few days/.test(s.win),s.sug.slice(0,300));
  ok('H4 the check is not computed with fewer than 5 days, and says why',/not computed: the current period has fewer than 5 days/.test(s.win),s.win);
  /* H5 days: 100% below over 8 days, no aim: fading waits for 10 days */
  await p.evaluate(r=>__imp(r),dd([4,5,4,5,4],[0,0,0,0,0,0,0,0]));await sleep(200);s=await p.evaluate(()=>__st());
  ok('H5 fully below baseline but 8 school days in the phase: fading waits for at least 10',/continue unchanged; fading waits/.test(s.sug)&&/has 8 school days with data; fading waits for at least 10/.test(s.sug),s.sug.slice(0,400));
  /* H5 70% below, no aim, no days (a typed table): not fade; H4 some progress */
  const ty=await p.evaluate(()=>{S=blank();S.meta.intPct='95';S.rows[0].t='10';S.rows[1].t='3';renderAll();const a=document.getElementById('decSuggest').textContent;
    S.rows[1].t='9';renderAll();const b=document.getElementById('decSuggest').textContent;S.rows[1].t='5';renderAll();const c=document.getElementById('decSuggest').textContent;
    return {a,b,c,svg:document.getElementById('prPlot').dataset.pr64,cap:document.getElementById('prPlot').textContent,win:document.getElementById('pr64Win').textContent};});
  ok('H5 a typed table 70% below baseline, no aim: continue, fading waits for 90%',/continue unchanged; fading waits/.test(ty.a)&&/fading waits for a reduction of 90%/.test(ty.a),ty.a.slice(0,300));
  ok('H4 10% below baseline: modify, short of the 25% this suggestion counts as some progress',/Suggested: modify the plan/.test(ty.b)&&/counts as some progress/.test(ty.b),ty.b.slice(0,300));
  ok('H4 50% below: continue unchanged, some progress',/Suggested: continue unchanged\./.test(ty.c)&&/some progress/.test(ty.c),ty.c.slice(0,300));
  ok('M6 a typed table: each point is a period mean, and the window says the days are not there',ty.svg==='means'&&/each point is a period mean/.test(ty.cap)&&/The suggestion uses the period mean: the days are not on this form/.test(ty.win),{svg:ty.svg,win:ty.win});
  /* a record saved before v25.64: its DD-1 figures without days open and read as before */
  const old=await p.evaluate(()=>{S=fromFile({form:'PR-1',S:{meta:{intPct:'95',tUnit:'occurrences per day'},rows:[{p:'Baseline',t:'4'},{p:'P1',t:'1'},{p:'P2',t:'0.8'}],
      dd:{t:{src:'file',file:'old.json',name:'Hitting',unit:'occurrences per day',how:'conditions',rows:[{k:0,label:'Baseline',n:10,mean:4,v:'4'},{k:1,label:'P1',n:20,mean:1,v:'1'},{k:2,label:'P2',n:20,mean:0.8,v:'0.8'}]}}}});renderAll();
    return {sug:document.getElementById('decSuggest').textContent,svg:document.getElementById('prPlot').dataset.pr64,win:document.getElementById('pr64Win').textContent};});
  ok('saved before v25.64 (DD-1 figures, no days): opens, graphs period means, reads the period mean (80% below: fading waits)',old.svg==='means'&&/continue unchanged; fading waits/.test(old.sug)&&/imported before v25\.64/.test(old.win),old);
  /* H5 the printed rule and the code's comments */
  const guide=await p.evaluate(()=>document.querySelector('.pr-rules').textContent);
  ok('H5 the Guide prints the fading rule the code applies, and no longer the 60% rule',/Begin fading when every target is at its aim \(Form DD-1\), or, with no aim, at a reduction of 90% or more from baseline, after at least 10 school days in the phase/.test(guide)&&!/60% or more below baseline: begin fading/.test(guide),guide.slice(0,200));
  ok('H5 the comments no longer say "60% or more: fade" or "60% begins fading"',!/\(60% or more: fade;/.test(PRSRC)&&!/60% begins fading/.test(PRSRC));
  ok('H4 the Guide names the window, the provisional rule, the check and the benchmark with their sources',/last 5 days of the current period against the baseline mean/.test(guide)&&/Lanovaz et al\., 2017/.test(guide)&&/Fisher et al\. \(2003, Table 1\)/.test(guide)&&/Phillips et al\., 2017/.test(guide)&&/Podlesnik et al\., 2025/.test(guide));
  ok('M9/L6/M1 the Guide states the re-entry rule, the outcome row and the readers',/Re-entry rule/.test(guide)&&/2\.66 times its mean moving range/.test(guide)&&/Outcome row in the Review Log/.test(guide)&&/Readers of the graph/.test(guide));

  /* ======================= SA-1 ======================= */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('SA-1: '+e.message));await q.goto(SA);await sleep(1000);
  await q.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};nbhUI.toast=()=>{};
    window.__prog=(meta,sess,tgt)=>{S=blank();P={list:[S],cur:0};Object.assign(S.meta,{client:'SIMULATED – Sample Student',program:'Test program',ntr:'20',hier:'ltm',format:'dtt',mc_inst:'1'},meta);
      if(tgt)S.tgt=tgt;S.sess=sess.map((x,i)=>({date:'10/'+(i+1)+'/26',ph:x[0],inst:x[1],tr:Array.from(x[2]),dl:'',note:'',...(x[3]!=null?{tgt:x[3]}:{})}));renderAll();
      const svg=document.getElementById('saPlot');
      return {rules:[...document.querySelectorAll('#graphRules li')].map(l=>l.textContent),verdict:document.getElementById('graphVerdict').textContent,lop:!!svg.querySelector('.sa-lop'),
        out:(window.__nbhFactsOut()||{skills:{programs:[]}}).skills.programs[0],tgt:(document.getElementById('tgtGraph')||{}).textContent||''};};});
  const pc=k=>'I'.repeat(k)+'–'.repeat(20-k);
  /* M7: 50, 20, 30, 40, 55 read as no change before v25.64 (55 - 50 < 10); its line of progress rises 12 points */
  let G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['B','JE',pc(0)],['T','JE',pc(10)],['T','JE',pc(4)],['T','JE',pc(6)],['T','JE',pc(8)],['T','JE',pc(11)]]);
  ok('M7 50, 20, 30, 40, 55: progressing, read from the line of progress (12 points across the window), with the 3-against-3 reading',G.rules.some(r=>/^Progressing/.test(r)&&/line of progress through them rises 12 points/.test(r)&&/last 3 average 8\.3 points above the first 3/.test(r)&&/The two readings differ/.test(r)),G.rules);
  ok('M7 the line of progress is drawn on the graph',G.lop,G);
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['B','JE',pc(0)],['T','JE',pc(10)],['T','JE',pc(10)],['T','JE',pc(9)],['T','JE',pc(10)],['T','JE',pc(10)]]);
  ok('M7 50, 50, 45, 50, 50: no change, its line flat, with the slope in the sentence',G.rules.some(r=>/^No change over the last 5 teaching sessions/.test(r)&&/rises 0 points across the window \(0 per session\)/.test(r)&&/short of the 10 points/.test(r))&&G.lop,G.rules);
  const sv=await q.evaluate(()=>{const s=document.getElementById('saPlot');const ph=[...s.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='#182e43'&&l.getAttribute('stroke-width')==='1.5');
    const c=[...s.querySelectorAll('circle')].map(x=>+x.getAttribute('cy'));return {ph:ph.length,dashed:ph.filter(l=>l.getAttribute('stroke-dasharray')).length,maxCy:Math.max(...c),cap:s.textContent};});
  ok('L3 SA-1: phase lines solid, the caption says so',sv.ph===1&&sv.dashed===0&&/solid verticals mark phase changes/.test(sv.cap),sv);
  ok('L3 SA-1: a session at 0% sits above the axis line (at 280)',sv.maxCy<=275,sv);
  /* L5 */
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(0)],['B','JE',pc(8)]]);
  ok('L5 two probes, 0% then 40%: run a third probe before teaching',/run a third probe before teaching/.test(G.verdict)&&/the two differ by 40 points/.test(G.verdict),G.verdict);
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(6)],['B','JE',pc(4)]]);
  ok('L5 two probes 30% then 20%: begin teaching',/Begin teaching \(working convention\)/.test(G.verdict)&&!/third probe/.test(G.verdict),G.verdict);
  G=await q.evaluate(a=>__prog({},a),[['B','JE',pc(2)],['B','JE',pc(4)],['B','JE',pc(3)]]);
  ok('L5 three probes in: begin teaching',/Begin teaching/.test(G.verdict),G.verdict);
  /* L4 target by target: 4 trials, ABAB */
  const tg=[{tag:'A',name:'cup',mix:''},{tag:'B',name:'ball',mix:''}];
  G=await q.evaluate(([a,t])=>__prog({ntr:'4',mc_unit:'target',mc_inst:'2'},a,t),[[['T','JE','I–II','ABAB'],['T','JE','III–','ABAB']],tg]);
  ok('L4 A independent in 2 consecutive sessions, B not: 1 of 2 targets mastered, replace A',/1 of 2 targets mastered \(A \(cup\)\)/.test(G.verdict)&&/Replace each mastered target/.test(G.verdict)&&/Mastery by Target/.test(G.tgt),G);
  ok('L4 the case: not mastered, by target, the criterion in words',G.out&&G.out.mastered===false&&G.out.unitOfCriterion==='target'&&G.out.targets.length===2&&G.out.targets[0].mastered===true&&G.out.targets[1].mastered===false&&/each target independent on every trial in 2 consecutive teaching sessions/.test(G.out.criterion),G.out);
  G=await q.evaluate(([a,t])=>__prog({ntr:'4',mc_unit:'target',mc_inst:'2'},a,t),[[['T','JE','I–II','ABAB'],['T','JE','III–','ABAB'],['T','MR','IIII','BBBB'],['T','MR','IIII','BBBB']],tg]);
  ok('L4 both targets mastered, 2 instructors across the sessions that mastered them: mastered target by target',/Mastered target by target: all 2 targets/.test(G.verdict)&&G.out.mastered===true,{v:G.verdict,o:G.out});
  G=await q.evaluate(([a,t])=>{const r=__prog({ntr:'4',mc_unit:'target',mc_inst:'2'},a,t);S.chk.mc_listener=true;renderAll();return {verdict:document.getElementById('graphVerdict').textContent,out:window.__nbhFactsOut().skills.programs[0]};},[[['T','JE','I–II','ABAB'],['T','JE','III–','ABAB'],['T','MR','IIII','BBBB'],['T','MR','IIII','BBBB']],tg]);
  ok('L4 a listener program: at the criterion, but waiting for the mixed-array check; not mastered',/waiting for the mixed-array check/.test(G.verdict)&&/one-cue responding/.test(G.verdict)&&G.out.mastered===false,G);
  const ui=await q.evaluate(()=>({box:!!document.querySelector('#tgtBox input[data-r="tgt"]'),row:!!document.querySelector('#trTbl input[data-f="tgt"]')}));
  ok('L4 the Setup page lists the targets and the trial grid has the row Target per trial',ui.box&&ui.row,ui);
  const rt2=await q.evaluate(()=>{const o=JSON.parse(JSON.stringify({form:'SA-1',S}));const s=fromFile(o);return {tgt:s.tgt.length,tag:s.sess[0].tgt,unit:s.meta.mc_unit};});
  ok('L4 saved and opened: the targets and the tags come back',rt2.tgt===2&&rt2.tag==='ABAB'&&rt2.unit==='target',rt2);
  /* an older file: no targets, the set criterion as before */
  G=await q.evaluate(()=>{const o=fromFileAll({form:'SA-1',S:{meta:{program:'Old',ntr:'10',mc_pct:'90',mc_n:'3',mc_inst:'1',format:'dtt',hier:'ltm'},chk:{},codes:[],sess:[0,1,2,3,4].map(i=>({date:'9/'+(i+1),ph:i<2?'B':'T',inst:'JE',tr:Array.from(i<2?'––––––––––':'IIIIIIIII–'),note:''}))}});
    P=o;S=P.list[0];renderAll();return {verdict:document.getElementById('graphVerdict').textContent,out:window.__nbhFactsOut().skills.programs[0]};});
  ok('an SA-1 file saved before v25.64: the whole-set rule, mastered as before',/Mastered: 3 consecutive teaching sessions at or above 90%/.test(G.verdict)&&G.out.mastered===true&&!G.out.unitOfCriterion,G);
  /* PLAN M9: one standard, its citations checked */
  const t=await q.evaluate(()=>({setup:document.querySelector('section.only-setup').textContent,guide:document.querySelector('section.only-guide').textContent}));
  ok('PLAN M9 the Setup page states the workstation’s standard and what Richling et al. (2019) found (11 of 12; 90% preliminary; 14 against 13)',/The workstation’s standard: for the whole set, 90% independent across 3 consecutive teaching sessions with 2 instructors/.test(t.setup)&&/in 11 of 12 evaluations/.test(t.setup)&&/a mean of 14 against 13/.test(t.setup)&&/100% across 3 sessions for a safety skill/.test(t.setup),t.setup.slice(0,200));
  ok('PLAN M9 no "Wong et al., 2022" citation; Wong and Fienup (2022), Kim et al. (2023) and Cordeiro et al. (2022) in the Guide and the references',!/Wong et al\., 2022/.test(SASRC)&&/Wong &amp; Fienup, 2022/.test(SASRC)&&/Mastery judged target by target/.test(t.guide)&&/Wong, K\. K\., & Fienup, D\. M\. \(2022\)/.test(t.guide)&&/Cordeiro, M\. C\./.test(t.guide)&&/Kim, J\. Y\./.test(t.guide));
  ok('M7/L5 the Guide prints the rules the code applies',/least-squares line through the last five \(the line of progress, drawn on the graph\)/.test(t.guide)&&/a third when the two differ by more than 20 percentage points or the second is higher/.test(t.guide));
  /* the simulation still loads */
  await q.evaluate(()=>{loadSim();});await sleep(700);
  const sim=await q.evaluate(()=>document.getElementById('graphVerdict').textContent);
  ok('the SA-1 simulation loads and reads mastered',/Mastered/.test(sim),sim.slice(0,200));
  await p.evaluate(()=>{loadSim();});await sleep(700);
  const psim=await p.evaluate(()=>({sug:document.getElementById('decSuggest').textContent,svg:document.getElementById('prPlot').dataset.pr64}));
  ok('the PR-1 simulation loads: period means, a suggestion',psim.svg==='means'&&/Suggested/.test(psim.sug),psim);
  ok('no page errors',errs.length===0,errs);
 }catch(e){ok('ran to the end',false,String(e&&e.stack||e));}
 finally{await br.close();}
 console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
