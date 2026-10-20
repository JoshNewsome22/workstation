/* Form IC-1's parent-facing update (v23.48; review F19, F20): "Analysis of specific variables" (VI-1, nothing new is done) and
   "Practice with waiting for a reward" (DT-1, its own card F) are two items; waiting practice is covered only with its own yes;
   Form DT-1 reads the new item, and a consent recorded before still covers it through the old one; card B says what the data
   show about food, with its source in the References. Simulated data only. usage: node qa/ic1-w4b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const ic=await open('IC-1_Informed-Consent-FBA-BIP_v2026-09.html');
  const h=await ic.evaluate(()=>{const row=n=>{const e=document.querySelector('[name="'+n+'"]');const tr=e&&e.closest('tr');return tr?[...tr.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim()):null;};
    const cards=[...document.querySelectorAll('.card .chdt')].map(x=>x.textContent.trim());
    return {v:row('p.var'),w:row('p.wait'),cards,food:(document.querySelector('[data-proc="edible"] .method')||{}).textContent||'',refs:document.body.textContent.indexOf('DeLeon, I. G., Iwata, B. A., & Roscoe, E. M. (1997). Displacement of leisure reinforcers by food during preference assessments.')>=0};});
  ok('1 part 2: the analysis of specific variables changes nothing (VI-1); practice with waiting is its own item (DT-1)',!!h.v&&/Nothing new is done with your child for this\.$/.test(h.v[2])&&h.v[3]==='VI-1'&&!!h.w&&h.w[1]==='Practice with waiting for a reward'&&/stop rule in the waiting plan \(Specific procedures, F\)/.test(h.w[2])&&h.w[3]==='DT-1',h);
  ok('2 the Specific procedures sheet: F is practice with waiting, G how you would like to be kept informed',h.cards.includes('F. Practice with waiting for a reward')&&h.cards.includes('G. How you would like to be kept informed'),h.cards);
  ok('3 card B says what the data show about food, and the source is in the References',/^Many students choose small amounts of food or drink over toys and activities when both are offered \(DeLeon, Iwata & Roscoe, 1997\), so we ask about food separately\./.test(h.food.trim())&&!/most reliable/.test(h.food)&&h.refs,h);
  await ic.evaluate(()=>{document.getElementById('simScenario').value='signed';document.getElementById('simBtn').click();});await sleep(400);
  const set=o=>ic.evaluate(o=>{Object.keys(o).forEach(k=>{const e=document.querySelector('[name="'+k+'"]');if(e.type==='checkbox')e.checked=!!o[k];else e.value=o[k];e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));});},o);
  const st=()=>ic.evaluate(()=>{const s=window.__ic1.status();return {issues:s.issues,covered:s.covered,n:document.getElementById('stProcSub').textContent};});
  await set({'p.wait':true});let a=await st();
  ok('4 waiting practice ticked, no decision on card F: not covered, and it says so',!a.covered.includes('wait')&&a.issues.some(t=>/^Practice with waiting for a reward is checked in part 2 but not consented to on the Specific procedures sheet \(F\)\./.test(t))&&/15 listed/.test(a.n),a);
  await set({'wt.dec':'yes','wt.init':'SP','wt.date':'2026-10-06'});a=await st();
  ok('5 yes, with nothing written: asks for the waits and the stop rule',a.issues.some(t=>/^Practice with waiting is consented to; still to enter: how many waits and the longest wait; the stop rule from the waiting plan \(Specific procedures, F\)\./.test(t)),a.issues);
  await set({'wt.waits':'Up to 10 waits; the longest 2 minutes (simulated)','wt.stop':'Any hit; 3 instances in one minute (simulated)'});a=await st();
  const c=await ic.evaluate(()=>window.__nbhFactsOut().consent);
  ok('6 with the details: covered, and the case gets v3 and the decision',a.covered.includes('wait')&&!a.issues.some(t=>/waiting/i.test(t))&&c.v===3&&c.covered.includes('wait')&&c.dec.wt&&c.dec.wt.dec==='yes'&&/longest 2 minutes/.test(c.dec.wt.waits),{a,c:{v:c.v,covered:c.covered,wt:c.dec.wt}});
  /* Form DT-1 */
  const dt=await open('Delay-Tolerance-Protocol-Toolkit.html');
  const K=(cov,v)=>({src:'IC-1',state:'Current',on:true,method:'sign',kind:'',obtained:'2026-10-06',ended:'',date:'2026-10-06',parent:'2026-10-06',exceptions:'',procs:cov,covered:cov,dec:{},bip:'',v});
  const fill=k=>dt.evaluate(k=>{const e=document.querySelector('[name="s_consent"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));nbhCase.apply({consent:k});const n=document.getElementById('dtConsentNote');return {v:e.value,note:n.hidden?'':n.textContent};},k);
  const d1=await fill(K(['indirect','abc','wait'],3)),d2=await fill(K(['indirect','abc','var'],3)),d3=await fill(K(['indirect','abc','var'],2));
  ok('7 DT-1: a consent naming waiting practice fills the line with its name',d1.v==='Practice with waiting for a reward: Consent on file since 10/6/2026 (Form IC-1)',d1);
  ok('8 DT-1: a v3 consent with only the analysis of specific variables does not cover it, and says so',d2.v===''&&/does not cover this protocol: “Practice with waiting for a reward” is not ticked, or not consented to on its card/.test(d2.note),d2);
  ok('9 DT-1: a consent recorded before (v2) still covers it through the analysis of specific variables, as that item said then',d3.v==='Analysis of specific variables (waiting practice): Consent on file since 10/6/2026 (Form IC-1)',d3);
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
