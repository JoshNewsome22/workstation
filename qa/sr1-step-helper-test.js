/* The step decision tied to the data (v23.47, review I138): Form DD-1 sends each behavior's series; Form SR-1 holds the card's
   rule in numbers (on screen only); the workstation's Today and Form PR-1 say "a step up is due" or "step back" from the days
   on DD-1 since the step began (step back first), and nothing when the days do not meet the rule. Simulated data only.
   usage: node qa/sr1-step-helper-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}if(window.wsUI){wsUI.confirm=async()=>true;wsUI.alert=async()=>{};}});return p;};
  /* DD-1's series */
  const dd=await open('Daily_Behavior_Data_and_Visual_Analysis.html');
  await dd.evaluate(()=>document.getElementById('btnLoadExample').click());await sleep(1500);
  const d=await dd.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.data;});
  const b0=d&&d.behaviors&&d.behaviors[0];
  ok('1 Form DD-1 sends each behavior\'s series: dated days with values, the last 30 at most, the newest last',!!b0&&Array.isArray(b0.series)&&b0.series.length>0&&b0.series.length<=30&&b0.series.every(p=>/^\d{4}-\d\d-\d\d$/.test(p.d)&&typeof p.v==='number')&&b0.series[b0.series.length-1].d===d.to,b0&&{n:b0.series&&b0.series.length,last:b0.series&&b0.series.slice(-2),to:d.to});
  /* SR-1's rule */
  const sr=await open(file('SR-1_'));
  await sr.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  const dec=await sr.evaluate(()=>{Object.assign(S.meta,{ds_sel:'dro',beh:'Hitting (simulated)',sd_step:'2',sd_since:'2026-10-05',sd_upv:'1',sd_upn:'3',sd_backv:'5',sd_backn:'2'});renderAll();const r=window.__nbhFactsOut();return r&&r.schedule&&r.schedule.decide;});
  ok('2 Form SR-1 sends the rule in numbers: the step in force and since when, step up at or below 1 on 3 days, step back at or above 5 on 2 days',!!dec&&dec.step==='2'&&dec.since==='2026-10-05'&&JSON.stringify(dec.up)===JSON.stringify({op:'le',v:1,n:3})&&JSON.stringify(dec.back)===JSON.stringify({op:'ge',v:5,n:2}),dec);
  await sr.emulateMedia({media:'print'});const pr=await sr.evaluate(()=>getComputedStyle(document.getElementById('srDecide')).display);await sr.emulateMedia({media:'screen'});
  ok('3 the step helper is on screen only: the printed card is unchanged',pr==='none',pr);
  /* the workstation's Today */
  const sh=await open('index.html');
  const ser=v=>v.map((x,i)=>({d:'2026-10-'+String(1+i).padStart(2,'0'),v:x}));
  const sch={nota:'DRO 5 min',beh:'Hitting (simulated)',decide:dec};
  const today=s=>sh.evaluate(([sch,s])=>{state.facts={schedule:sch,data:{from:s[0].d,to:s[s.length-1].d,days:s.length,behaviors:[{name:'Hitting (simulated)',series:s}]}};return todayItems().filter(x=>x.k==='Schedule').map(x=>x.t);},[sch,s]);
  const up=await today(ser([6,6,6,4,3,1,0,1]));
  ok('4 Today: the last 3 days since the step began at or below 1: a step up is due, with the reason',up.length===1&&/^Form SR-1’s schedule \(DRO 5 min, step 2\): a step up is due\. Hitting \(simulated\) was at or below 1 on each of the last 3 days with data on Form DD-1 since the step began on 10\/5\/2026\./.test(up[0]),up);
  const back=await today(ser([1,1,1,1,1,6,5]));
  ok('5 the last 2 days at or above 5: step back (checked before a step up)',back.length===1&&/: step back\. Hitting \(simulated\) was at or above 5 on each of the last 2 days/.test(back[0]),back);
  const old=await today(ser([0,0,0,0,9]));
  ok('6 days before the step began do not count: nothing said',old.length===0,old);
  const mid=await today(ser([3,3,3,3,3,2,1,2]));
  ok('7 days that meet neither rule: nothing said',mid.length===0,mid);
  /* PR-1 */
  const p1=await open(file('PR-1_'));
  const h=await p1.evaluate(([sch,s])=>{window.__nbhFactsIn({schedule:sch,data:{behaviors:[{name:'Hitting (simulated)',series:s}]}});const e=document.getElementById('prSchedSrc');return {hid:e.hidden,t:e.textContent};},[sch,ser([6,6,6,4,3,1,0,1])]);
  ok('8 Form PR-1, under Current schedule: the design, then the step up that is due',!h.hid&&/^Form SR-1’s design: /.test(h.t)&&/a step up is due\. Hitting \(simulated\) was at or below 1 on each of the last 3 days/.test(h.t),h);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
