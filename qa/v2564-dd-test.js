/* v25.64 Form DD-1 against the JABA research on data analysis (the BCBA's approved DATA review, DD-1's parts):
   H1 the conservative dual criterion (CDC) on each comparison card, Fisher et al.'s table, the Show CDC lines tick;
   H2 the decision line's runs, and no "review" after an immediate, lasting drop or at the aim;
   H3 provisional comparisons (under 3 points in the first condition or 5 in the second), the days beside each name;
   M1 the analyst's reading, a blind second reader, agreement with the CDC and "uncertain";
   M2 a caution when the baseline was already improving;  M3 the tiles in groups, the log response ratio, the PND sentence;
   M4 the design summary over repeated conditions;  M5 a plan start per behavior and the stacked view;
   M8 the control-chart flags on the time-of-day table and heat map;  L1 alternating conditions;
   L2 one aim per condition (a changing criterion);  L3 same scale, kept axis, zero off the axis (old files as saved);
   L7 the walkthrough's chapter on reading a comparison.
   usage: node qa/v2564-dd-test.js (WS_URL as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
const DD='/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});const errs=[];
  const page=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(L.BASE+DD);await sleep(1200);
    await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});return p;};
  const p=await page();
  /* a record built in the page: one count target, days with the values given, full phase changes where named */
  await p.evaluate(()=>{window.__mk=(ys,phases,beh)=>{S=blankState();Object.assign(S.behaviors[0],{name:'Hitting',measure:'count',direction:'decrease'},beh||{});
    const d0=new Date(2026,8,1,12);let k=0;ys.forEach((y,i)=>{let d;do{d=new Date(d0.getTime()+k*86400000);k++;}while(d.getDay()%6===0);const r=newRow(localISO(d));
      r.values[S.behaviors[0].id]=y===null?'':String(y);if(phases&&phases[i]){r.phaseType='full';r.phaseLabel=phases[i];}S.rows.push(r);});renderAll();showTab('results');};});

  /* ---- H1 ---- */
  const h1=await p.evaluate(()=>{const tab=[5,10,15,20].map(ddCdcNeed);const big=ddCdcNeed(24);
    __mk([10,9,11,10,10,9,3,2,2,1,2,1,2,1],{6:'Plan'});
    const card=document.querySelector('.cmp-card .dd-cdc');const lines0=document.querySelectorAll('line.dd-cdcl').length;
    S.settings.showCdc=true;renderResults();const lines1=document.querySelectorAll('line.dd-cdcl').length;const leg=/CDC lines/.test(document.querySelector('.legend').textContent);
    const an=buildConditions().map(c=>analyzeCondition(c,S.behaviors[0],sortedRows()));const c=ddCdc(an[0],an[1],S.behaviors[0]);
    /* by hand: baseline mean 9.83, SD 0.75, the lines lowered by 0.19; every plan day is below both */
    return {tab,big,text:card&&card.textContent,state:card&&card.dataset.cdc,lines0,lines1,leg,c:{beyond:c.beyond,need:c.need,met:c.met,mean:Math.round(c.mean*100)/100}};});
  ok('H1 the CDC table is Fisher et al. (2003, Table 1): 5 of 5, 8 of 10, 12 of 15, 14 of 20; past 23 the binomial test (17 of 24)',h1.tab.join()==='5,8,12,14'&&h1.big===17,h1);
  ok('H1 each card prints the CDC line: 8 of 8 beyond both lines (7 needed), a change beyond what Baseline predicts, labelled a structured aid',/8 of 8 Plan points beyond both lines \(7 needed\): a change beyond what Baseline predicts/.test(h1.text)&&/structured aid; read it with the graph/.test(h1.text)&&/delayed effect/.test(h1.text)&&h1.state==='met'&&h1.c.beyond===8&&h1.c.need===7&&h1.c.mean===9.65,h1);
  ok('H1 Show CDC lines draws the two dashed lines in the second condition, with a legend entry; off by default',h1.lines0===0&&h1.lines1===2&&h1.leg,h1);

  /* ---- H2 ---- */
  const h2=await p.evaluate(()=>{const rule=()=>(document.querySelector('.dd-rule')||{}).textContent||'';const o={};
    __mk([10,11,9,10,12,10,1,1,1,1,1,1,1,1,1,1],{6:'Plan'},{reviewDays:'8'});o.drop=rule();
    __mk([10,11,9,10,12,10,0,0,0,0,0,0,0,0,0,0],{6:'Plan'},{reviewDays:'8',aim:'0',critDays:'3'});o.zero=rule();
    __mk([10,11,9,10,12,10,10,11,10,9,11,10,10,11,9,10],{6:'Plan'},{reviewDays:'8'});o.none=rule();
    __mk([10,11,9,10,12,10,2,2,3,3,4,4,5,5,6,7],{6:'Plan'},{reviewDays:'8'});o.worse=rule();
    __mk([3,0,0,4,0,5,1],{},{aim:'1',critDays:'3'});o.runs=rule();return o;});
  ok('H2 a drop from 10 to 1 on the first plan day that stays there is not flagged for review (a change from Baseline by the CDC)',!/review<\/b>|^.*\breview\b:/.test(h2.drop)&&/a change from Baseline \(CDC 10 of 10/.test(h2.drop)&&/review at 8 days without change/.test(h2.drop),h2.drop);
  ok('H2 a behavior at 0, its aim, is not flagged: "at the aim … no review"',/at the aim/.test(h2.zero)&&/no review/.test(h2.zero)&&!/review: /.test(h2.zero),h2.zero);
  ok('H2 no change from Baseline is flagged for review; a trend turned the wrong way is flagged',/review: 10 school days in Plan \(the rule says 8\): no change from Baseline/.test(h2.none)&&/review: .*the trend has turned the wrong way/.test(h2.worse),h2);
  ok('H2 the decision line prints the longest run and the current run',/longest run 2 of the 3 needed, current run 1/.test(h2.runs),h2.runs);

  /* ---- H3, M2, M3 ---- */
  const h3=await p.evaluate(()=>{const o={};__mk([5,9,3,10,4,1],{2:'Plan'});const cd=document.querySelector('.cmp-card');
    o.h4=cd.querySelector('h4').textContent;o.prov=(cd.querySelector('.dd-prov')||{}).textContent;o.dim=cd.querySelector('.dd-cdc').classList.contains('dd-prov-dim')&&cd.querySelectorAll('.metric.es-tile.dd-prov-dim').length===4;
    o.var=!!cd.querySelector('.dd-basevar');
    __mk([10,9,8,7,6,5,2,2,1,2,1,2],{6:'Plan'});const c2=document.querySelector('.cmp-card');o.trend=(c2.querySelector('.dd-basetrend')||{}).textContent;o.prov2=!!c2.querySelector('.dd-prov');
    o.groups=[...c2.querySelectorAll('.dd-tgroup')].map(e=>e.textContent);o.lrr=(c2.querySelector('.dd-lrr .v')||{}).textContent;
    o.pnd=/this rests on the single most extreme Baseline day/.test(c2.querySelector('.narrative').textContent);o.src=/say little about how large the change is/.test(document.getElementById('ddSources').textContent);
    __mk([0,0,0,0,0,2,3,4,3,2],{5:'Plan'},{direction:'increase'});o.lrr0=(document.querySelector('.dd-lrr .n')||{}).textContent;return o;});
  ok('H3 a comparison with 2 Baseline days and 4 Plan days is provisional, its CDC line and effect sizes greyed, the days beside each name',/Baseline \(2 days\) → Plan \(4 days\)/.test(h3.h4)&&/Provisional: too few points to judge a change/.test(h3.prov||'')&&h3.dim&&h3.var,h3);
  ok('M2 a baseline already improving carries the caution that overlap indices overstate the effect',/Baseline was already improving/.test(h3.trend||'')&&/overstate the effect/.test(h3.trend||'')&&!h3.prov2,h3);
  ok('M3 the tiles are grouped (level, size, overlap); the LRR is ln(B/A) (ln(1.67/7.5) = -1.50) and not computed from a mean of 0; the PND sentence and the Sources line',h3.groups.length===3&&/Size of change/.test(h3.groups[1])&&/Overlap/.test(h3.groups[2])&&h3.lrr==='-1.50'&&/a mean of 0/.test(h3.lrr0||'')&&h3.pnd&&h3.src,h3);

  /* ---- M1 ---- */
  const m1=await p.evaluate(async()=>{const o={};__mk([10,9,11,10,10,9,3,2,2,1,2,1,2,1],{6:'Plan'});S.settings.showCdc=true;renderResults();
    const set=(f,v)=>{const e=document.querySelector(`.dd-read [data-rdf="${f}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('r','change');o.agree1=(document.querySelector('.dd-agree')||{}).textContent||'';set('by','JN');
    document.querySelector('[data-rdblind]').click();await new Promise(r=>setTimeout(r,100));o.blind=!!document.querySelector('#dlgBlind[open] svg.graph');o.blindCdc=document.querySelectorAll('#dlgBlind line.dd-cdcl').length;
    o.blindTiles=document.querySelectorAll('#dlgBlind .metric,#dlgBlind .narrative,#dlgBlind .dd-cdc').length;
    const s2=document.querySelector('#dlgBlind [data-rdf="r2"]');s2.value='nochange';s2.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#dlgBlind [data-blclose]').click();await new Promise(r=>setTimeout(r,100));
    o.agree2=(document.querySelector('.dd-agree')||{}).textContent||'';o.saved=JSON.stringify(S.readings);o.facts=((window.__nbhFactsOut()||{}).data||{}).behaviors[0].cmp;return o;});
  ok('M1 the analyst\'s reading agrees with the CDC; a blind second reader sees the graph without the CDC lines, tiles or summary',/the analyst and the CDC agree/.test(m1.agree1)&&!/Uncertain/.test(m1.agree1)&&m1.blind&&m1.blindCdc===0&&m1.blindTiles===0,m1);
  ok('M1 a second reader who disagrees marks the comparison uncertain and asks for the reason (Form PR-1); the readings are saved with the record and sent to the case',/the two readers disagree/.test(m1.agree2)&&/Uncertain/.test(m1.agree2)&&/"r":"change"/.test(m1.saved)&&/"by":"JN"/.test(m1.saved)&&/"r2":"nochange"/.test(m1.saved)&&m1.facts&&m1.facts.uncertain===true&&m1.facts.cdc&&m1.facts.cdc.met===true,m1);

  /* ---- M4 ---- */
  const m4=await p.evaluate(()=>{__mk([10,9,11,10,10,2,1,2,1,2,9,10,11,10,9,2,1,1,2,1],{5:'Plan',10:'Baseline',15:'Plan'});return (document.querySelector('.dd-design')||{}).textContent||'';});
  ok('M4 Baseline, Plan, Baseline, Plan: a design summary of like conditions and "Demonstrations of the effect: 3 of 3 phase changes", with the three-demonstrations standard',/Demonstrations of the effect: 3 of 3 phase changes/.test(m4)&&/Three demonstrations at three different points in time/.test(m4)&&/Mean within the earlier one/.test(m4),m4.slice(0,600));

  /* ---- M5 ---- */
  const m5=await p.evaluate(()=>{__mk([10,9,11,10,10,9,3,2,2,1,2,1,2,1],{4:'Plan'});const b2={id:uid('b'),kind:'target',name:'Yelling',measure:'count',direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[1],obsLength:'Entire school day'};
    S.behaviors.push(b2);const R=sortedRows();R.forEach((r,i)=>{r.values[b2.id]=String(i<8?8+(i%2):2);});b2.planStart=R[8].date;S.behaviors[0].planStart=R[4].date;renderAll();showTab('results');
    const o={};const bc=ddBehConds(b2,buildConditions(),sortedRows());o.split=bc.map(c=>c.rowIdx.length).join();o.stack=!!document.querySelector('.dd-stack svg path.dd-step-line');
    o.txt=(document.querySelector('.dd-stack .hint')||{}).textContent||'';o.box=document.getElementById('c_stack').checked;o.field=!!document.querySelector('#behTable input[data-f="planStart"]');
    o.note=/The plan starts for Yelling on/.test(document.getElementById('resultsOut').textContent);return o;});
  ok('M5 a plan start on the behavior\'s row splits its own conditions (8 baseline, 6 plan days); the stacked view draws one stepped phase line and checks each tier',m5.split==='8,6'&&m5.stack&&m5.box&&m5.field&&m5.note&&/Yelling<\/b>|Yelling: changed after its own phase line/.test(m5.txt)&&/while the plan ran for Hitting and its own had not started/.test(m5.txt),m5);

  /* ---- M8 ---- */
  const m8=await p.evaluate(async()=>{const q=ddSpc([1,1,1,1,10,1,1,1]);const q2=ddSpc([2,2,2]);const o={flag:q.flags[4],n:Object.keys(q.flags).length,ucl:Math.round(q.ucl*100)/100,flat:Object.keys(q2.flags).length};
    await loadExample();S.settings.entryMode='interval';renderAll();showTab('results');o.note=(document.querySelector('.dd-spcnote')||{}).textContent||'';o.marks=document.querySelectorAll('.dd-spc-mark').length;o.tri=document.querySelectorAll('td .dd-spc').length;return o;});
  ok('M8 the control chart: center line and limits from the moving range (upper limit 8.97 here), the high block flagged above the upper limit; flat blocks are not',m8.flag==='above the upper limit'&&m8.n===1&&m8.ucl===8.97&&m8.flat===0,m8);
  ok('M8 the time-of-day table marks flagged blocks, states the rules, and the heat map outlines them',/center line/.test(m8.note)&&/Pfadt &(amp;)? Wheeler, 1995/.test(m8.note)&&/lead/.test(m8.note)&&m8.marks>0&&m8.tri>0,m8);

  /* ---- L1 ---- */
  const l1=await p.evaluate(()=>{__mk([5,5,4,6,5,2,6,1,5,2,6,2,5,1],{5:'A',6:'B',7:'A',8:'B',9:'A',10:'B',11:'A',12:'B',13:'A'});
    const full0=document.querySelectorAll('.behavior-report svg.graph line.dd-full').length;S.settings.alt=true;renderResults();
    const g=document.querySelector('.behavior-report svg.graph');return {full0,full:g.querySelectorAll('line.dd-full').length,alt:g.querySelectorAll('.dd-altpt').length,note:(document.querySelector('.dd-altnote')||{}).textContent||'',
      cards:document.querySelectorAll('.cmp-card').length,cdc:(document.querySelector('.cmp-card .dd-cdc')||{}).textContent||''};});
  ok('L1 alternating conditions: one path per condition and no phase lines, every pair compared, the order and the time between conditions prompted',l1.full0>5&&l1.full===0&&l1.alt>0&&l1.cards===3&&/counterbalance the order/.test(l1.note)&&/apart in time/.test(l1.note)&&/not used for alternating conditions/.test(l1.cdc),l1);

  /* ---- L2 ---- */
  const l2=await p.evaluate(()=>{__mk([10,10,9,10,8,8,8,8,6,6,5,6,6],{4:'Step 1',8:'Step 2'},{stepAims:true,aim:'',critDays:'3'});
    const R=sortedRows();S.behaviors[0].aims={[R[4].date]:'8',[R[8].date]:'6'};renderResults();
    const an=buildConditions().map(c=>analyzeCondition(c,S.behaviors[0],R));
    return {line:!!document.querySelector('svg.graph polyline.dd-stepcrit'),ci:critInfo(an[2],S.behaviors[0]).aim,step:(document.querySelector('.dd-step')||{}).textContent||'',inputs:document.querySelectorAll('.dd-step input[data-stepaim]').length};});
  ok('L2 one aim per condition: a stepped criterion line, the criterion read against each step\'s aim, the days within the band and the design\'s requirements',l2.line&&l2.ci===6&&/Changing criterion/.test(l2.step)&&/within ±1/.test(l2.step)&&/Hartmann &(amp;)? Hall, 1976/.test(l2.step)&&l2.inputs===3,l2);

  /* ---- L3 ---- */
  const l3=await p.evaluate(async()=>{const o={};__mk([2,3,2,3,2,1,1,0,1,1],{5:'Plan'});const b2={id:uid('b'),kind:'target',name:'Running off',measure:'count',direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[1],obsLength:'Entire school day'};
    S.behaviors.push(b2);sortedRows().forEach((r,i)=>{r.values[b2.id]=String(20-i);});renderAll();showTab('results');
    o.lift=document.querySelectorAll('#resultsOut svg.graph line.dd-xaxis').length>0&&S.settings.zeroLift===true;
    const top=()=>[...document.querySelectorAll('[data-act="keepAxis"]')].map(b=>b.dataset.top);o.before=top();S.settings.sameAxis=true;renderResults();o.after=top();
    document.querySelector('[data-act="keepAxis"]').click();o.ymax=S.behaviors[0].yMax;
    const old=JSON.stringify({meta:S.meta,behaviors:S.behaviors.map(b=>{const c=Object.assign({},b);delete c.yMax;return c;}),rows:S.rows,schedule:{},settings:{trend:'ols',level:'mean',env:'25full',crit:80,imm:3}});
    openFile(new File([old],'old.json',{type:'application/json'}));await new Promise(r=>setTimeout(r,600));o.oldLift=S.settings.zeroLift;o.oldAxis=document.querySelectorAll('#resultsOut svg.graph line.dd-xaxis').length;return o;});
  ok('L3 a new record lifts zero off the axis; Same scale gives behaviors in one unit one axis; Keep this axis writes the y-axis maximum; a file saved before opens as it was',l3.lift&&l3.before[0]!==l3.before[1]&&l3.after[0]===l3.after[1]&&l3.ymax===l3.after[0]&&l3.oldLift===false&&l3.oldAxis===0,l3);

  /* ---- L7 and the example ---- */
  const l7=await p.evaluate(async()=>{await loadExample();const o={};o.rules=[...document.querySelectorAll('.dd-rule')].map(e=>e.textContent).join(' | ');
    document.querySelector('#viewSeg [data-view="walk"]').click();await new Promise(r=>setTimeout(r,600));o.off=TKWALK.cues.map(c=>c.id).includes('cdc');
    S.settings.showCdc=true;TKWALK.build();o.on=TKWALK.cues.map(c=>c.id);o.ch=TKWALK.chapters.map(c=>c.label);S.settings.showCdc=false;TKWALK.build();
    document.querySelector('#viewSeg [data-view="results"]').click();return o;});
  ok('L7 with Show CDC lines ticked the walkthrough adds the chapter "Reading a comparison" after the analysis; without it, as before',!l7.off&&l7.on.indexOf('cdc')===l7.on.indexOf('analysis')+1&&l7.ch.includes('Reading a comparison'),l7);
  ok('H2 the example carries both cases: aggression drops at once (a change, no review) and the mand is at its aim (no review)',/a change from Baseline \(CDC 14 of 14/.test(l7.rules)&&/at the aim \(the last \d+ at or above 8\): no review/.test(l7.rules)&&!/<b>review|review: /.test(l7.rules),l7.rules);

  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
