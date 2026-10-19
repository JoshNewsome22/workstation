/* Form FS-1, review Wave 3 part 3 (I86): the FBA's limits go forward. FS-1 sends the settings it did not sample, what would change
   its conclusion and the hypotheses it could not rule out; Form TD-1's generalization tactic names the settings not sampled; Form
   PR-1's review asks each period whether the disproving result was seen, and its decision check speaks when it was.
   Simulated data only. usage: node qa/fs1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  /* ---- FS-1 sends its limits ---- */
  const p=await open(file('FS-1_'));
  const none=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.fn?('limits' in o.fn):null;});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const lim=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.fn&&o.fn.limits;});
  ok('1 I86 FS-1 sends the settings not sampled, what would change its conclusion, and the hypotheses it could not rule out',
    !!lim&&/^Home, the bus itself/.test(lim.notAssessed)&&/the escape hypothesis is wrong/.test(lim.falsify)&&lim.open.length===2
    &&/preferred items/.test(lim.open[0].h)&&/^Denied access was present/.test(lim.open[0].what)&&/sleep/i.test(lim.open[1].h)&&!!lim.open[1].what,lim);
  ok('2 I86 a blank report sends no limits',none===false||none===null,none);
  /* ---- TD-1 ---- */
  const td=await open(file('TD-1_'));
  const g=await td.evaluate(()=>{window.__nbhFactsIn({behaviors:[{label:'Aggression (simulated)'}],fn:{limits:{notAssessed:'Home and the bus (simulated).'}}});
    return document.querySelector('[name="p.gen"]').value;});
  ok('3 I86 Form TD-1\'s generalization tactic names the settings the FBA did not sample',
    g==='Program generalization to the settings the FBA did not sample (Form FS-1): Home and the bus (simulated). Probe there before fading.',g);
  const g2=await td.evaluate(()=>{const e=document.querySelector('[name="p.gen"]');e.value='Teach in the gym and the cafeteria (simulated).';e.dispatchEvent(new Event('input',{bubbles:true}));
    window.__nbhFactsIn({behaviors:[{label:'Aggression (simulated)'}],fn:{limits:{notAssessed:'The bus (simulated).'}}});return e.value;});
  ok('4 I86 a generalization tactic already written is kept',g2==='Teach in the gym and the cafeteria (simulated).',g2);
  /* ---- PR-1 ---- */
  const pr=await open(file('PR-1_'));
  const h0=await pr.evaluate(()=>document.getElementById('prFbaTest').hidden);
  const v=await pr.evaluate(()=>{window.__nbhFactsIn({fn:{limits:{falsify:'If aggression continues with escape withheld (simulated).',
      open:[{h:'Access to preferred items (simulated)',what:'Denied access in 2 of 10 occurrences (simulated).'},{h:'',what:'dropped'}]}}});
    const t=document.getElementById('prFbaTest');return {hid:t.hidden,fal:document.getElementById('prFbaFalsify').textContent,open:document.getElementById('prFbaOpen').textContent,
      rowHid:document.getElementById('prFbaOpenRow').hidden,print:(()=>{let n=t;while(n&&n!==document.body){if(n.classList&&n.classList.contains('noprint'))return false;n=n.parentNode;}return true;})()};});
  ok('5 I86 Form PR-1 shows what the FBA said would change its conclusion and the hypotheses it left open, on screen and paper',
    h0===true&&!v.hid&&v.fal==='What would change its conclusion: If aggression continues with escape withheld (simulated).'
    &&v.open==='Access to preferred items (simulated) (Denied access in 2 of 10 occurrences (simulated))'&&!v.rowHid&&v.print,{h0,v});
  const setSel=(q,val)=>pr.evaluate(([q,val])=>{const s=document.querySelector(q);s.value=val;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));},[q,val]);
  await setSel('[data-m="dec"]','Continue unchanged');await setSel('[data-m="fsTest"]','Observed');await sleep(300);
  const c1=await pr.evaluate(()=>({meta:S.meta.fsTest,dc:document.getElementById('decCheck').textContent}));
  ok('6 I86 the disproving result observed with the plan continued: the decision check asks for a return to assessment or a reason',
    c1.meta==='Observed'&&/The result the FBA said would disprove its hypothesis was observed this period \(Form FS-1\): return to assessment, or say under Reasoning why the function still holds\./.test(c1.dc),c1);
  await setSel('[data-m="dec"]','Return to assessment');await sleep(300);
  const c2=await pr.evaluate(()=>document.getElementById('decCheck').textContent);
  await setSel('[data-m="dec"]','Continue unchanged');await setSel('[data-m="fsTest"]','Not observed');await sleep(300);
  const c3=await pr.evaluate(()=>document.getElementById('decCheck').textContent);
  ok('7 I86 no such check when the decision is a return to assessment, or when the result was not observed',!/disprove its hypothesis/.test(c2)&&!/disprove its hypothesis/.test(c3),{c2,c3});
  const h1=await pr.evaluate(()=>{window.__nbhFactsIn({fn:{statements:['x']}});return document.getElementById('prFbaTest').hidden;});
  ok('8 I86 with no limits from the FBA the question is not asked',h1===true,h1);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
