/* v22.75 Form GC-1, review Wave 3 part 2: one rule for the starting criterion, with how often the baseline met it (F285);
   the first run of baseline days only, probe days (P) and phase 4 probes kept apart and read by the fading rules, the
   change line by direction (F286); the Guide against its sources (F287); agreement on the tallies (I144); the class
   system's start and phases on Form DD-1's graph (I142); TD-1's component gives the same starting rule. Simulated data.
   usage: node qa/v2275-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const GC='GC-1_Group-Contingencies_v2026-10.html',DD='Daily_Behavior_Data_and_Visual_Analysis.html',TD='TD-1_Function-Based-Treatment-Developer_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,5)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const txt=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},s);
  /* the verdict and the notes for the first n rows */
  const at=(p,n,fn)=>p.evaluate(([n,fn])=>{const keep=JSON.stringify(S);S.log=S.log.slice(0,n);if(fn)(new Function(fn))();renderRecord();
    const v=document.querySelector('#logVerdict').textContent.replace(/\s+/g,' '),r=document.querySelector('#logRules').textContent.replace(/\s+/g,' '),m=document.querySelector('#logMetrics').textContent.replace(/\s+/g,' ');S=JSON.parse(keep);renderAll();return {v,r,m};},[n,fn||'']);

  let p=await open(GC);await p.evaluate(async()=>{await loadSim();});await sleep(400);
  const D=await p.evaluate(()=>S.log.map(r=>r.date));
  /* ---------------- F285 ---------------- */
  const b=await p.evaluate(()=>{const s=baseStats();return {sug:s.sug,met:s.sugMet,n:s.n,days:s.days,trend:s.trend,sub:document.querySelectorAll('#baseMetrics .metric')[2].textContent.replace(/\s+/g,' '),crit:S.meta.crit,first:rowMet(S.log[4]),ph:document.querySelector('[data-m="crit"]').placeholder};});
  ok('1 F285 the suggestion is the level the class reached on its better baseline days: 9, met on 3 of 8 baseline team-days; the worked example starts there and wins the first game',
    b.sug===9&&b.met===3&&b.n===8&&b.days===4&&!b.trend&&/met on 3 of 8 baseline team-days: a level the class already reaches on its better days/.test(b.sub)&&b.crit==='9'&&b.first===true&&/a level the class already reaches on its better days/.test(b.ph),b);
  const w=await p.evaluate(()=>{const keep=JSON.stringify(S),o={};S.meta.crit='5';renderRule();o.low=document.querySelector('#designVerdict').textContent;S.meta.crit='12';renderRule();o.all=document.querySelector('#designVerdict').textContent;S.meta.crit='9';renderRule();o.ok=document.querySelector('#designVerdict').textContent;
    S.log=S.log.slice(0,6);S.log[2].ph='1';S.log[3].ph='1';renderBase();o.two=document.querySelectorAll('#baseMetrics .metric')[2].textContent.replace(/\s+/g,' ');
    S=JSON.parse(keep);S.log=S.log.slice(0,4);S.log.forEach((r,i)=>{r.v=[String(14-3*i),String(13-3*i),'',''];});renderBase();o.trend=document.querySelector('#baseMetrics').textContent.replace(/\s+/g,' ');S=JSON.parse(keep);renderAll();return o;});
  ok('2 F285 the Design sheet warns when the starting criterion was met on no baseline team-day, or on every one; not at the suggestion',
    /The starting criterion \(5\) was not met on any of the 8 baseline team-days: the class may lose at first .*The suggestion is 9 \(met on 3 of 8\)/.test(w.low)&&/The starting criterion \(12\) was met on every baseline team-day \(8 of 8\): it asks nothing of the class/.test(w.all)&&!/starting criterion \(9\)/.test(w.ok),w);
  ok('3 F285 no suggestion from fewer than 3 baseline days; a baseline falling from about 13.5 to 5 is flagged as trending',/from 3 baseline days or more: 2 so far/.test(w.two)&&/The baseline is trending \(from about 13\.5 to 4\.5 fouls per team across 4 days\)/.test(w.trend),w);
  const td=await open(TD);const step=await td.evaluate(()=>{const c=(typeof LIB!=='undefined'&&LIB.GRP_CON)||null;return c?c.steps.join(' | '):document.documentElement.innerHTML.match(/set the initial criterion[^']{0,220}/)[0];});
  ok('4 F285 TD-1’s group-contingency component gives the same rule',/set the initial criterion from the class’s baseline at a level the class already reaches on its better days, so it wins often from the first day \(Form GC-1 suggests one/.test(step),step.slice(0,400));await td.close();

  /* ---------------- F286 ---------------- */
  const pr=await p.evaluate(()=>{const keep=JSON.stringify(S),o={};
    S.log.push({date:'',ph:'B',crit:'',v:['10','10','',''],rw:'',note:'return to baseline'});S.log.push({date:'',ph:'P',crit:'2',v:['1','1','',''],rw:'',note:''});renderAll();
    const s=baseStats();o.base=[s.days,s.n,s.later,Math.round(s.mean*100)/100];o.gm=document.querySelectorAll('#logMetrics .metric')[1].textContent.replace(/\s+/g,' ');o.hint=document.querySelector('#baseMetrics').textContent.replace(/\s+/g,' ');
    o.opts=[...document.querySelectorAll('#lTbl tbody tr:last-child select[data-f="ph"] option')].map(x=>x.textContent);o.legend=document.querySelector('#plotLegend').textContent;
    o.gray=[...document.querySelectorAll('#logPlot circle,#logPlot rect')].filter(e=>e.getAttribute('fill')==='#d6d6d6').length;o.lines=[...document.querySelectorAll('#logPlot text')].map(t=>t.textContent).filter(t=>/^phase|^baseline/.test(t));
    S=JSON.parse(keep);renderAll();return o;});
  ok('5 F286 the baseline is the first run of B days: a later return to baseline and a probe day are not pooled, and the probe is not a game day',
    pr.base.join()==='4,8,1,10.25'&&/1 later phase B day \(a return to baseline\) is not pooled/.test(pr.hint)&&/22 game days .*1 probe day apart/.test(pr.gm),pr);
  ok('6 F286 the phase list has P (probe) and 4 (probes); probes are gray on the graph, in the legend, and draw no phase line',
    pr.opts.join('|')==='B (baseline)|1|2|3|4 (probes)|P (probe)'&&/probe, game off \(gray\)/.test(pr.legend)&&pr.gray===2&&pr.lines.join('|')==='phase 1|phase 2|baseline',pr);
  /* phase 3 at the terminal value: 6 game days in a row, then the probes decide */
  const P3="const t=S.log.slice(0,23);for(let i=0;i<6;i++)t.push({date:'',ph:'3',crit:'2',v:['1','1','',''],rw:'',note:''});S.log=t;S.fl.push({date:'',who:'x',pct:'100',missed:''});";
  const p3a=await at(p,99,P3),p3b=await at(p,99,P3+"S.log.push({date:'',ph:'P',crit:'2',v:['1','2','',''],rw:'',note:''});S.log.push({date:'',ph:'P',crit:'2',v:['2','0','',''],rw:'',note:''});");
  ok('7 F286 phase 3 moves on only with 2 probe days without the game at the terminal value',/Met on 6 game days in a row at the terminal value .*The fading table also asks for probe days without the game before phase 4: 0 so far/.test(p3a.v)&&/move to phase 4 on the fading table/.test(p3b.v),[p3a.v,p3b.v]);
  const p4a=await at(p,99,"S.log.push({date:'',ph:'4',crit:'2',v:['1','2','',''],rw:'',note:''});"),p4b=await at(p,99,"S.log.push({date:'',ph:'4',crit:'2',v:['1','4','',''],rw:'',note:''});");
  ok('8 F286 phase 4: a probe that meets the terminal criterion holds; one that misses brings the game back',/Phase 4: holding without the game\. The probe on the last probe day met the terminal criterion \(1 of 1 probes met\)/.test(p4a.v)&&/Phase 4: the probe on the last probe day missed the terminal criterion\. Bring the game back once or twice a week \(phase 3\)/.test(p4b.v),[p4a.v,p4b.v]);
  const ch=await at(p,99),ch0=await at(p,99,"S.log.slice(0,4).forEach(r=>{r.v=['0','0','',''];});"),chUp=await at(p,99,"S.log.slice(0,4).forEach(r=>{r.v=['1','1','',''];});");
  ok('9 F286 the change line reads by direction ("down 89% from baseline", "up 30% from baseline") and is left out when the baseline is zero',
    /down \d+% from baseline/.test(ch.m)&&!/% from baseline|Infinity/.test(ch0.m)&&/up \d+% from baseline/.test(chUp.m),[ch.m,ch0.m,chUp.m]);

  const rb=await at(p,99,"S.log.slice(-3).forEach(r=>{r.v=['7','8','',''];});");
  ok('9b relaxing steps back to the criterion played before (3), not past it by the step of 2',/relax the criterion by one step \(to 3\)/.test(rb.v),rb.v);
  /* ---------------- I144 agreement on the tallies ---------------- */
  const ag=await p.evaluate(()=>[...document.querySelectorAll('#agrTbl tbody tr')].map(r=>[r.children[5].textContent,r.querySelector('.agr-p').textContent].join('/')));
  const agAll=await txt(p,'#logRules');
  ok('10 I144 four agreement checks, each against the Record’s count of the same day and team; the Record lists the latest and the mean',
    ag.join(' ')==='5/100% 8/87.5% 1/100% 2/100%'&&/Agreement on the tallies: 100% on [\d/]+ \(Cardinals\); 4 checks, mean 96\.9%\./.test(agAll),[ag,agAll]);
  const own="S.agr=S.agr.filter(a=>S.log.some(r=>r.date===a.date));",s5=await at(p,15,own),s7=await at(p,11,own);   /* only the checks made by then */
  ok('11 I144 a step due with no agreement check since the criterion began is noted; with one, it is not',/No agreement check on the tallies since the criterion became 5 on [\d/]+/.test(s5.r)&&!/No agreement check/.test(s7.r),[s5.r,s7.r]);
  const low=await at(p,99,"S.agr.push({date:S.log[25].date,who:'x',col:'0',val:'5',note:''});");
  ok('12 I144 a check under 80% asks for the definitions and the tally to be gone over',/Agreement on the tallies: 40% on [\d/]+ \(Blue Jays\).*Under 80%: go over the definitions and the tally with the scorer/.test(low.r),low.r);

  /* ---------------- F287 the Guide ---------------- */
  const g=await txt(p,'#guide'),dirOpts=await p.evaluate(()=>[...document.querySelectorAll('[data-m="dir"] option')].map(o=>o.value).join(','));
  ok('13 F287 the Guide: no member "chosen in advance" in an interdependent arrangement; the carry-over finding credited to Donaldson, Wiskow and Soto (2015), in the reference list; no unchecked Joslyn claim; fouls named as response cost, points offered first',
    !/chosen in advance/.test(g)&&/drawn at random after the period \(a reward that rests on members picked in advance is a dependent arrangement\)/.test(g)&&/Donaldson, Wiskow and Soto \(2015\) found that the reduction held while the game was played and did not carry over/.test(g)&&
    /Donaldson, J\. M\., Wiskow, K\. M\., & Soto, P\. L\. \(2015\)\. Immediate and distal effects of the Good Behavior Game/.test(g)&&!/Joslyn et al\. \(2019\) note/.test(g)&&/Marking fouls is a response-cost arrangement/.test(g)&&dirOpts===',high,low',[dirOpts,g.slice(0,200)]);

  /* save and open keeps the checks */
  const rt=await p.evaluate(async()=>{let saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{saved=t;});return o(b);};document.getElementById('saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;
    const before=JSON.stringify(S);S=fromFile(JSON.parse(saved));renderAll();return before===JSON.stringify(S)&&S.agr.length===4;});
  ok('14 save and open: the same form, the agreement checks with it',rt);
  const out=await p.evaluate(()=>window.__nbhFactsOut().classwide);
  ok('15 the case gets the latest agreement check and the phase',out.agree&&out.agree.pct===100&&out.phase==='2',out);

  /* ---------------- I142 DD-1 ---------------- */
  const dd=await ctx.newPage();dd.on('pageerror',e=>errs.push('DD-1: '+e.message));
  await dd.clock.setFixedTime(new Date('2026-10-12T10:00:00'));await dd.goto(L.BASE+'/NBH-Workstation/'+DD,{waitUntil:'load'});await sleep(1200);
  await dd.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});await dd.evaluate(async()=>{await loadExample();});await sleep(1200);
  const mk=await dd.evaluate(()=>{ddCaseFacts={classwide:{arrangement:'The Good Behavior Game',unit:'fouls per team',changes:[{date:'2026-09-23',ph:'1',crit:9},{date:'2026-09-29',ph:'1',crit:7},{date:'2026-10-07',ph:'2',crit:2}]}};
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderResults();
    return {t:[...document.querySelectorAll('svg .dd-gc text')].map(x=>x.textContent),title:(document.querySelector('svg .dd-gc title')||{}).textContent||'',conds:[...document.querySelectorAll('svg .dd-gc')].length};});
  ok('16 I142 DD-1 marks the class game’s start and its phase change on the student’s graph (not the criterion steps), with what and when in the tooltip',
    mk.t.length>=2&&mk.t.filter(x=>x==='Class game').length>=1&&mk.t.filter(x=>x==='Class ph 2').length>=1&&!mk.t.some(x=>/7/.test(x))&&/Form GC-1: The Good Behavior Game began on .*criterion 9 fouls per team/.test(mk.title),mk);
  await dd.close();
  ok('17 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
