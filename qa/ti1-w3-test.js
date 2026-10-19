/* Form TI-1, review Wave 3 part 1: a commission on a critical or consequence step fails the verdict, and a critical step never seen
   leaves it open (F238); observations are read in date order, and the verdict names their dates (F239); the case, the shell's
   decision line and ST-1's retraining list carry TI-1's own verdict and priorities (F240); the band is a caution when it should be
   (F241); one coding rule and the weighted figure (F245); reactivity read only when the checks are mixed (F247).
   Simulated data only. usage: node qa/ti1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const TI='TI-1_Treatment-Integrity-Observation_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html',ST='ST-1_Behavior-Skills-Training_v2026-09.html';
const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
const us=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return (+m[2])+'/'+(+m[3])+'/'+m[1];};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(TI);
  /* ten steps; 3, 5, 6, 7 and 8 critical; step 8 the consequence step that holds the delay */
  const setup=(o)=>p.evaluate(o=>{S=blank();S.nObs=o.dates.length;S.crit=90;S.critN=2;S.meta={ptype:o.ptype||'Behavior reduction',phase:o.phase||'Maintenance',int:'Simulated RBT'};
    S.steps=Array.from({length:10},(_,i)=>({d:'Step '+(i+1)+' (simulated)',crit:[2,4,5,6,7].includes(i),cmp:i===7?'con':i<2?'ant':''}));
    S.obs=o.dates.map((d,j)=>({date:d,type:(o.types||[])[j]||'Unannounced'}));
    o.dates.forEach((_,j)=>{for(let i=0;i<10;i++)S.cells[i+'_'+j]='C';});Object.keys(o.set||{}).forEach(k=>{S.cells[k]=o.set[k];});renderAll();
    return {v:document.querySelector('#verdictBox').textContent,vc:document.querySelector('#verdictBox .verdict').className,band:document.querySelector('#bandBox .verdict').className,bandT:document.querySelector('#bandBox .verdict').textContent,
      tv:JSON.parse(JSON.stringify(tiVerdict||null)),M:(()=>{const M=metrics();return {w:M.weighted,g:M.global};})()};},o);
  /* ---- F238 ---- */
  const a=await setup({dates:[iso(-20),iso(-10)],set:{'7_0':'EC'}});
  ok('1 F238 one commission on the consequence step that holds the delay (9 of 10, 90%) fails the verdict, and the band is not green',
    /v-no/.test(a.vc)&&/Criterion not met: on the deciding observations .* a commission error fell on step 8 \(consequence\) on #1/.test(a.v)&&!/v-ok/.test(a.band)&&a.tv.status==='not met'&&a.tv.fail.length===1&&a.tv.fail[0].step===8,a);
  const b=await setup({dates:[iso(-20),iso(-10)],set:{'2_0':'NA','4_0':'NA','5_0':'NA','6_0':'NA','7_0':'NA','2_1':'NA','4_1':'NA','5_1':'NA','6_1':'NA','7_1':'NA'}});
  ok('2 F238 with no critical step come due on the deciding observations, the verdict is open, not met',/v-mid/.test(b.vc)&&/Not yet decidable for the critical steps/.test(b.v)&&b.tv.status==='not decidable'&&!/v-ok/.test(b.band),b);
  const c=await setup({dates:[iso(-20),iso(-10)],set:{'0_0':'EO'}});
  ok('3 F238 an omission on an antecedent step that is not critical is still judged on the percentage (90% met)',/v-ok/.test(c.vc)&&/Criterion met/.test(c.v)&&c.tv.status==='met',c);
  /* ---- F239 ---- */
  const d=await setup({dates:[iso(-1),iso(-30),iso(-20)],set:{'0_0':'EO','1_0':'EO','3_0':'EO','8_0':'EO'}});
  ok('4 F239 an observation saved over the first column is still the newest: the verdict judges the last two by date and names them',
    /v-no/.test(d.vc)&&new RegExp('60\\.0% \\(#1, '+us(iso(-1)).replace(/\//g,'\\/')+'\\)').test(d.v)&&new RegExp('100\\.0% \\(#3, '+us(iso(-20)).replace(/\//g,'\\/')+'\\)').test(d.v)&&/not in date order/.test(d.v),d.v);
  const dx=await p.evaluate(()=>{const f=window.__nbhFactsOut(),r=window.__tiRetrain();return {obs:f.integrity.obs.map(o=>o.date),v:f.integrity.verdict,dec:r.dec.map(x=>x.j)};});
  ok('5 F239 F240 the case gets the observations in date order and TI-1’s verdict with its deciding observations; the retraining list takes the same two',
    dx.obs.join(',')===[iso(-30),iso(-20),iso(-1)].join(',')&&dx.v&&dx.v.status==='not met'&&dx.v.obs.map(o=>o.col).join(',')==='3,1'&&dx.dec.join(',')==='2,0',dx);
  /* ---- F245 ---- */
  const e1=await setup({dates:[iso(-20),iso(-10)],set:{'0_0':'EC'}}),e2=await setup({dates:[iso(-20),iso(-10)],set:{'7_1':'EC'}});
  ok('6 F245 the weighted figure counts twice only a commission on a consequence step',e1.M.w.n===e1.M.g.n&&e2.M.w.n===e2.M.g.n+1,{e1:e1.M,e2:e2.M});
  const txt=await p.evaluate(()=>document.body.innerHTML);
  ok('7 F245 one coding rule: Commission and Omission are defined for consequence steps and for the rest, with a short “Which code?” tree; the unsourced remedy sentence is gone',
    /On a <b>consequence<\/b> step: a consequence the plan withholds was delivered/.test(txt)&&/On a <b>consequence<\/b> step: an earned consequence was not delivered/.test(txt)&&/<b>Which code\?<\/b>/.test(txt)&&
    !/often solved by a prompt or a checklist/.test(txt)&&!/most strongly linked/.test(txt)&&/Form PD-1 sorts these out before retraining/.test(txt));
  /* ---- F247 and F241 on the simulation ---- */
  await p.evaluate(()=>{const b=document.getElementById('simBtn')||[...document.querySelectorAll('button')].find(x=>/simulat/i.test(x.textContent));b.click();});await sleep(1200);
  const s1=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#metricWrap .metric')].map(m=>m.textContent);return {react:cards.find(t=>/^Reactivity/.test(t))||'',band:document.querySelector('#bandBox .verdict').className,bandT:document.querySelector('#bandBox .verdict').textContent,v:document.querySelector('#verdictBox').textContent};});
  ok('8 F247 the simulation’s only announced check came first: reactivity is “confounded with time”, not a figure',/confounded with time/.test(s1.react)&&!/pts/.test(s1.react),s1.react);
  ok('9 F241 the simulation’s band (about 81%, step 8 reinforced in error, program in acquisition) is a caution, not “Acceptable” in green',
    !/v-ok/.test(s1.band)&&/Caution: .*a consequence step was done as a commission error .* on the deciding observations/.test(s1.bandT)&&/in acquisition/.test(s1.bandT),s1);
  const s2=await p.evaluate(()=>{const j=S.obs.length;S.nObs=j+1;S.obs.push({date:new Date().toISOString().slice(0,10),type:'Announced'});S.steps.forEach((_,i)=>{S.cells[i+'_'+j]='C';});renderAll();
    return [...document.querySelectorAll('#metricWrap .metric')].map(m=>m.textContent).find(t=>/^Reactivity/.test(t))||'';});
  ok('10 F247 with an announced check after the unannounced ones, the reactivity figure is shown',/pts/.test(s2)&&/announced minus unannounced/.test(s2),s2);
  const both=await p.evaluate(()=>{const o=[...document.querySelectorAll('[data-m="ptype"] option')].map(x=>x.textContent);return {o,b:bandOf(85,'Both (reduces a behavior and teaches a replacement)').cls,r:bandOf(85,'Behavior reduction').cls};});
  ok('11 F241 a plan that both reduces a behavior and teaches a replacement can be named, and is read as the stricter',both.o.includes('Both (reduces a behavior and teaches a replacement)')&&both.b==='v-mid'&&both.r==='v-ok',both);
  /* ---- PR-1's reader in date order ---- */
  const pr=await open(PR);
  const pt=await pr.evaluate(([a,b,c])=>{const steps=Array.from({length:4},(_,i)=>({d:'Step '+(i+1),crit:i===1,cmp:''}));const cells={};for(let j=0;j<3;j++)for(let i=0;i<4;i++)cells[i+'_'+j]='C';cells['0_0']='EO';
    const x=tiRead({form:'TI-1',S:{nObs:4,critN:2,crit:90,steps,obs:[{date:a,type:'Unannounced'},{date:b,type:'Unannounced'},{date:c,type:'Unannounced'}],cells,opp:{},meta:{}}},'','');return {intDate:x.fig.intDate,intPct:x.fig.intPct,met:x.fig.intMet};},[iso(-1),iso(-30),iso(-20)]);
  ok('12 F239 PR-1’s TI-1 reader takes the most recent observation by date, not by column',pt.intDate===us(iso(-1))&&pt.intPct==='75'&&pt.met==='not met',pt);
  /* ---- ST-1: the retraining list keeps TI-1's priority ---- */
  const st=await open(ST);await L.loadSim(st);await sleep(1000);
  const sm=await st.evaluate(()=>{const t=S.steps[7].d,d=new Date().toISOString().slice(0,10);
    S.ti={retrain:{src:'file',file:'x.json',kind:'retrain',when:d,saved:'',student:'',int:'',crit:90,critN:2,obs:[{col:3,date:d,integrity:80,critical:75},{col:4,date:d,integrity:85,critical:80}],
      steps:[{n:8,text:t,critical:true,codes:['EC','C'],commission:1,omission:0,pct:50,priority:1,component:'consequence'}],targeted:''}};renderAll();return {mark:window.stTiMark(7),kept:S.ti&&S.ti.retrain&&S.ti.retrain.steps[0].priority};});
  ok('13 F240 ST-1 keeps TI-1’s priority on a retraining target and says why it comes first',sm.kept===1&&/priority 1/.test(sm.mark)&&/first: a commission error on a consequence step/.test(sm.mark),sm);
  /* ---- the shell ---- */
  const sh=await open('index.html');
  const td=await sh.evaluate(([a,b])=>{const beh=[{name:'Hitting (simulated)',base:{mean:4,days:6},cur:{mean:4,days:20},curName:'FCT'}];
    const f1={data:{behaviors:beh},integrity:{criterion:90,obs:[{date:a,type:'Unannounced',pct:76.9},{date:b,type:'Announced',pct:100}],verdict:{status:'not met',obs:[{col:2,date:a,pct:76.9}],fail:[{step:8,col:2,consequence:true}]}}};
    const f2={data:{behaviors:beh},integrity:{criterion:90,obs:[{date:a,type:'Unannounced',pct:76.9},{date:b,type:'Announced',pct:100}]}};
    const f3={data:{behaviors:beh},integrity:{criterion:90,obs:[{date:a,type:'Unannounced',pct:95}],verdict:{status:'not decidable',obs:[{col:1,date:a,pct:95}],fail:[]}}};
    return {a:tdDecision(f1).map(x=>x.t).join(' | '),b:tdDecision(f2).map(x=>x.t).join(' | '),c:tdDecision(f3).map(x=>x.t).join(' | ')};},[iso(-12),iso(-2)]);
  ok('14 F240 the decision line rests on TI-1’s verdict, not on a later announced check at 100%',/Form TI-1 found a critical or consequence step done wrongly/.test(td.a)&&!/with integrity at 100%/.test(td.a),td.a);
  ok('15 F240 with no verdict sent, the latest unannounced check is used, never the announced one; not decidable says so',!/with integrity at 100%/.test(td.b)&&/76\.9%/.test(td.b)&&/Form TI-1 cannot yet judge/.test(td.c),td);
  ok('16 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
