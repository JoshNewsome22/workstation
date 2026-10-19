/* Form TD-1, review Wave 3 part 1: demand fading on the branch that cannot tolerate the behavior carries no escape extinction (F178);
   the NCE, NCR and DRO ladders never shorten (F179); no level is advanced without the replacement's independence data (F180); the
   function's label says where it came from (F181); a school-day rate does not seed a session interval (F184); one LOD rule (F185).
   Simulated data only. usage: node qa/td1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:L.BASE});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('TD-1_'));
  const sim=async k=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(1300);};
  const v=n=>p.evaluate(n=>(document.querySelector('[name="'+n+'"]')||{}).value,n);
  const setSel=(n,x)=>p.evaluate(([n,x])=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,x]);
  const dfStep=()=>p.evaluate(()=>{const t=document.querySelector('#compWrap .card[data-code="DF"] textarea[name$=".s3"]');return t?t.value:null;});
  const bip=async()=>{await p.evaluate(()=>document.getElementById('bipBtn').click());await sleep(500);return p.evaluate(()=>navigator.clipboard.readText());};
  const thin=code=>p.evaluate(code=>[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>tr.children.length>1&&tr.children[0].textContent.startsWith(code+' ')).map(tr=>tr.children[1].textContent),code);
  /* ---- F178 ---- */
  await sim('escape_nce');
  const a={rb3:await v('rb.3'),q1:await v('q.escape.1'),df:await dfStep(),ee:await p.evaluate(()=>document.getElementById('eeBlock').hidden)};
  const t1=await bip();
  ok('1 F178 demand fading chosen because the setting cannot tolerate the behavior carries no escape extinction, and the worked example agrees',
    a.rb3==='no'&&a.q1==='no'&&/^Escape extinction is not used on this branch/.test(a.df)&&a.ee===true&&!/Implement escape extinction throughout fading/.test(t1)&&/Escape extinction is not used on this branch/.test(t1),{a,bip:t1.slice(0,300)});
  await setSel('q.escape.1','yes');await setSel('rb.3','yes');const d1=await dfStep();
  await setSel('rb.3','no');const d2=await dfStep();
  await p.evaluate(()=>{const t=document.querySelector('#compWrap .card[data-code="DF"] textarea[name$=".s3"]');t.value='Our own step 4 (simulated)';t.dispatchEvent(new Event('input',{bubbles:true}));});
  await setSel('rb.3','yes');const d3=await dfStep();
  ok('2 F178 the step follows the answers: the library step with extinction feasible, the step without it when not; a rewritten step is left alone',
    /^Implement escape extinction throughout fading/.test(d1)&&/^Escape extinction is not used/.test(d2)&&d3==='Our own step 4 (simulated)',{d1,d2,d3});
  /* ---- F179 ---- */
  await sim('escape_nce');const n1=await thin('NCE');
  ok('3 F179 the NCE ladder climbs from the card\'s interval: × 2, × 4, × 8, then the terminal interval',
    JSON.stringify(n1)===JSON.stringify(['FT below mean IRT (19 s on the card)','FT × 2 (38 s)','FT × 4 (1.3 min)','FT × 8 (2.5 min)','Terminal interval: 5.0 min (Vollmer et al., 1995, reached 2.5 and 10 min)']),n1);
  await sim('attention_ncr');
  const ncr=async(p0,p2)=>{await p.evaluate(([p0,p2])=>{const c=document.querySelector('#compWrap .card[data-code="NCR"]'),i=c.dataset.i;[['p0',p0],['p2',p2]].forEach(([k,x])=>{const e=document.querySelector('[name="cp['+i+'].'+k+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));});
    document.querySelector('#viewSeg button[data-view="plan"]').click();},[p0,p2]);await sleep(300);return thin('NCR');};
  const low=await ncr('4 min',''),ten=await ncr('4 min','10 min');
  const secs=t=>{const m=/(\d+(?:\.\d+)?) (s|min)\b/.exec(t);return m?(m[2]==='s'?+m[1]:+m[1]*60):null;};
  const mono=l=>{let prev=0;return l.every(t=>{const x=secs(t);if(x==null)return true;const okk=x>=prev;prev=x;return okk;});};
  ok('4 F179 with a low baseline rate (a 4-min first interval) no rung is shorter than the one before; the ladder holds at the terminal interval',
    mono(low)&&low[1]==='FT × 2 (5.0 min, the terminal interval)'&&/^Hold at 5\.0 min: the terminal interval/.test(low[2])&&mono(ten)&&ten[1]==='FT × 2 (8.0 min)'&&ten[2]==='FT × 4 (10.0 min, the terminal interval)',{low,ten});
  /* ---- F180 ---- */
  await sim('escape_fct');
  const dec=await p.evaluate(()=>{const n=+document.getElementById('nMon').value;for(let i=0;i<n;i++){['t','a','ind','p','lv'].forEach(k=>{const e=document.querySelector('[name="mo['+i+'].'+k+'"]');if(e)e.value='';});}
    const put=(i,k,x)=>{const e=document.querySelector('[name="mo['+i+'].'+k+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));};
    [['BL',1.2],['BL',1.1],['BL',1.3],['Tx',0.05],['Tx',0.04],['Tx',0.03],['Tx',0.02]].forEach(([ph,t],i)=>{put(i,'p',ph);put(i,'t',String(t));if(ph==='Tx')put(i,'lv','1');});
    return document.getElementById('monVerdict').textContent;});
  ok('5 F180 with a replacement in the plan and no percent-independent data, the decision is to hold, not to advance',/Hold: the target is at criterion, but the last \d+ sessions.* have no percent-independent data for the replacement/.test(dec),dec);
  /* ---- F181 ---- */
  const t2=await bip();
  ok('6 F181 an EA-1 analysis is named as the function\'s source',/Function \(EA-1 analysis: Multielement, 4 series\): Escape/.test(t2),t2.slice(0,400));
  const q=await open(file('TD-1_'));
  const fn=await q.evaluate(()=>{window.__nbhFactsIn({behaviors:[{label:'Hitting (simulated)'}],fn:{key:'escape',label:'Escape from demands'}});return (document.querySelector('[name="m.fnsrc"]')||{}).value;});
  await q.evaluate(()=>{const e=document.querySelector('[name="rb.3"]');e.value='yes';e.dispatchEvent(new Event('change',{bubbles:true}));});
  await q.evaluate(()=>document.getElementById('bipBtn').click());await sleep(500);const t3=await q.evaluate(()=>navigator.clipboard.readText());
  ok('7 F181 FS-1\'s descriptive hypothesis is labelled as one, and extinction resting on it is named',fn==='FS-1'&&/Hypothesized function \(Form FS-1, descriptive assessment\): Escape/.test(t3)&&/The function is a hypothesis no analysis has tested, and extinction is planned on it/.test(t3)&&!/Function \(EA-1/.test(t3),{fn,t3:t3.slice(0,500)});
  /* ---- F184 ---- */
  const r=await q.evaluate(()=>{window.__nbhFactsIn({data:{behaviors:[{label:'Hitting (simulated)',measure:'rate',unit:'per hour',base:{mean:3}}]}});
    const g=n=>(document.querySelector('[name="'+n+'"]')||{}).value;const m=document.getElementById('addComp');m.value='NCE';document.getElementById('addCompBtn').click();
    const c=document.querySelector('#compWrap .card[data-code="NCE"]'),p0=c&&document.querySelector('[name="cp['+c.dataset.i+'].p0"]');
    return {rate:g('m.rate'),src:g('m.ratesrc'),note:document.getElementById('tdRateSrc').textContent,p0:p0&&p0.value,ph:p0&&p0.placeholder};});
  ok('8 F184 a rate from DD-1\'s school day is marked and does not seed a session interval',r.src==='DD-1'&&/school-day rate/.test(r.note)&&r.p0===''&&/session baseline/.test(r.ph),r);
  /* ---- F185 ---- */
  await sim('auto_ee');
  const lod=await p.evaluate(()=>{const s=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));};s('auto.series','4');s('auto.sr','0');s('auto.alone','10');s('auto.play','3.7');return document.getElementById('lodOut').textContent;});
  ok('9 F185 an LOD between the two cutoffs is called borderline, not both sufficient and insufficient',/LOD = .*63\.0%/.test(lod)&&/LOD between 62\.5% and 63\.7%: Subtype 1 under the 2023 rule, below the 2018 cutoff of 63\.7%\. Borderline/.test(lod)&&!/not predicted to be sufficient/.test(lod),lod);
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
