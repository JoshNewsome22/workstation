/* Form TI-1, v25.64: the BCBA's Build list from the review of the forms against the JABA measurement research (MEAS).
   H1 the 80-89% band read from the main procedure and schedule thinning, printed beside the band and carried in the ST-1 file;
   H2 the feedback given after each check (its delay, format, content, the next check and the fading rule), the meeting-
      cancellation option, and the integrity graph with Form DD-1's graph beneath it;
   H7 IOA coverage by observation type, agreement by second observer, possible drift;
   M1 kappa beside the IOA percentages; M3 a new plan labelled, an abrupt drop flagged; M5 prompting and instruction steps
   critical on an acquisition plan, and the antecedent figure on the Summary; L2 integrity with and without distractions;
   L3 a stronger reinforcer for the alternative; L4 video self-monitoring; a file saved before v25.64 opens, and the new values
   are saved and opened again. Simulated data only. usage: node qa/v2564-ti-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const TI='TI-1_Treatment-Integrity-Observation_v2026-09.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+TI);await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;
    /* a case of 20 untagged steps and four Monday observations: #1 announced, #2-#4 unannounced; #3 and #4 at 85% (3 omissions) */
    window.__mk=function(o){o=o||{};S=blank();S.nObs=4;S.crit=o.crit||80;S.critN=2;
      S.meta=Object.assign({ptype:'Behavior reduction',obs:'Observer A (simulated)'},o.meta||{});
      S.steps=[];for(let i=0;i<20;i++)S.steps.push({d:'Simulated step '+(i+1),crit:false});
      const D=['2026-10-05','2026-10-12','2026-10-19','2026-10-26'];
      S.obs=D.map((d,j)=>({date:d,type:j?'Unannounced':'Announced',ctx:'',ioa:false}));
      const miss=o.miss||[0,0,3,3];
      for(let j=0;j<4;j++)for(let i=0;i<20;i++)S.cells[i+'_'+j]=i<miss[j]?'EO':'C';
      if(o.after)o.after();renderAll();};
    window.__t=id=>(document.getElementById(id)||{}).textContent||'';});

  /* ---- H1 ---- */
  const h1=await p.evaluate(()=>{const opts=[...document.querySelectorAll('select[data-m="proc"] option')].map(o=>o.value);const out={opts};
    const band=()=>{const v=document.querySelector('#bandBox .verdict');return {cls:v.className,t:v.textContent};};
    __mk({meta:{proc:'dra-every'}});out.every=band();
    __mk({meta:{proc:'dro'}});out.dro=band();
    __mk({meta:{proc:'ncr'}});out.ncr=band();
    __mk({meta:{proc:'dra-int'}});out.int=band();
    __mk({meta:{proc:'dtt'}});out.dtt=band();
    __mk({meta:{proc:'dra-every',thin:'1'}});out.thin=band();
    __mk({meta:{}});out.none=band();
    __mk({meta:{proc:'dra-every'},miss:[0,0,1,1]});out.hi=band();
    __mk({meta:{proc:'dra-every',thin:'1'},miss:[0,0,1,1]});out.hiThin=band();
    return out;});
  ok('1 H1 Setup offers the main procedure: DRA every response, DRA intermittent or interval, NCR, DRO, response cost, RIRD, discrete-trial or mand teaching, other',
    ['','dra-every','dra-int','ncr','dro','rc','rird','dtt','other'].every(v=>h1.opts.includes(v)),h1.opts);
  ok('2 H1 at 85%: DRA with every response reinforced reads acceptable, with the procedure and the thinning tick printed beside the band',
    /v-ok/.test(h1.every.cls)&&/Acceptable for DRA with every alternative response reinforced/.test(h1.every.t)&&/Main procedure: DRA, reinforcing every alternative response · Schedule thinning: not ticked/.test(h1.every.t),h1.every);
  ok('3 H1 at 85%: NCR, interval DRA and DRO read as a caution, citing Jones and St. Peter (2022)',
    [h1.dro,h1.ncr,h1.int].every(b=>/v-mid/.test(b.cls)&&/80% integrity did not keep these procedures effective for some people/.test(b.t)&&/Jones & St\. Peter, 2022/.test(b.t)),[h1.dro,h1.ncr,h1.int]);
  ok('4 H1 schedule thinning ticked is a caution whatever the procedure (near-perfect integrity until stable), and is noted at 90% and above',
    /v-mid/.test(h1.thin.cls)&&/Aim for near-perfect integrity until the new schedule is stable/.test(h1.thin.t)&&/Schedule thinning: in progress/.test(h1.thin.t)&&
    /v-ok/.test(h1.hiThin.cls)&&/aim for near-perfect integrity/.test(h1.hiThin.t)&&!/near-perfect/.test(h1.hi.t),{thin:h1.thin,hiThin:h1.hiThin,hi:h1.hi});
  ok('5 H1 discrete-trial or mand teaching keeps the acquisition caution; with no procedure set, the band asks for it',
    /v-mid/.test(h1.dtt.cls)&&/Caution for discrete-trial or mand teaching/.test(h1.dtt.t)&&/Set the main procedure on the Setup sheet/.test(h1.none.t)&&/Main procedure: not set/.test(h1.none.t),{dtt:h1.dtt,none:h1.none});
  const st=await p.evaluate(async()=>{__mk({meta:{proc:'dro',thin:'1'}});let blob=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:x';};
    const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};document.getElementById('tiRetrainBtn').click();for(let n=0;n<40&&!blob;n++)await new Promise(r=>setTimeout(r,50));const txt=blob?await blob.text():null;
    URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;return txt?JSON.parse(txt).plan:null;});
  ok('6 H1 the ST-1 file carries the procedure and the thinning tick',st&&/^DRO/.test(st.procedure)&&st.thinning===true&&st.type==='Behavior reduction',st);
  const thinUi=await p.evaluate(()=>{__mk({meta:{proc:'dra-every'}});const c=document.getElementById('tiThin');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    return {thin:S.meta.thin,band:document.querySelector('#bandBox .verdict').className};});
  ok('7 H1 the Setup tick sets schedule thinning and the band follows',thinUi.thin==='1'&&/v-mid/.test(thinUi.band),thinUi);

  /* ---- H2 ---- */
  const h2=await p.evaluate(()=>{__mk({meta:{fbCancel:'1'},after:()=>{S.obs[0].fb={date:'2026-10-08',fmt:'graph',own:true};S.obs[1].fb={date:'2026-10-12'};}});
    const cols=document.querySelectorAll('#tiFbTbl thead th').length-1;
    const r={cols,d0:__t('tiFbDelay0'),f0:__t('tiFbDFlag0'),d1:__t('tiFbDelay1'),f1:__t('tiFbDFlag1'),r0:__t('tiFbRuleT0'),r1:__t('tiFbRuleT1'),r3:__t('tiFbRuleT3'),
      fmt:(document.querySelector('#tiFbTbl select[data-fb="fmt"][data-fbj="0"]')||{}).value,own:(document.querySelector('#tiFbTbl input[data-fb="own"][data-fbj="0"]')||{}).checked,
      ticks:[...document.querySelectorAll('#tiFbTbl input[type=checkbox][data-fbj="2"]')].map(x=>x.getAttribute('aria-label')),rule:__t('tiFbRule'),
      sd:[window.__tiV2564.schoolDays('2026-10-09','2026-10-12'),window.__tiV2564.schoolDays('2026-10-05','2026-10-05'),window.__tiV2564.schoolDays('2026-10-05','2026-10-08')]};
    const n=document.querySelector('#tiFbTbl input[data-fb="next"][data-fbj="0"]');n.value='2026-10-20';n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}));
    r.next=S.obs[0].fb.next;r.nf=__t('tiFbNFlag0');
    const ck=document.querySelector('#tiFbTbl input[data-fb="reh"][data-fbj="1"]');ck.checked=true;ck.dispatchEvent(new Event('change',{bubbles:true}));r.reh=S.obs[1].fb.reh;
    __mk({crit:90});r.below=__t('tiFbRuleT2');return r;});
  ok('8 H2 a feedback column for each scored observation, with the date, format and content ticks it holds',h2.cols===4&&h2.fmt==='graph'&&h2.own===true&&h2.ticks.length===5&&
    /own integrity, graphed across checks/.test(h2.ticks[0])&&/directed rehearsal/.test(h2.ticks.join(' ')),h2);
  ok('9 H2 the delay is counted in school days and flagged over 1 (Friday to Monday is 1)',h2.sd.join()==='1,0,3'&&/^3 school days after the check$/.test(h2.d0)&&/over 1 school day/.test(h2.f0)&&
    h2.d1==='the same day'&&h2.f1==='',h2);
  ok('10 H2 the fading rule sets the next check: weekly until the criterion is met, every 2 weeks after, weekly after a check below it',
    /^Rule: weekly: the mastery criterion is not yet met;.* Next check by 10\/15\/2026\.$/.test(h2.r0)&&/Rule: every 2 weeks: the mastery criterion is met/.test(h2.r3)&&/weekly: this check was below the 90% criterion/.test(h2.below)&&
    /at least weekly until the mastery criterion is met\. Then check every 2 weeks\. Return to weekly after any check below the criterion, or after any commission error on a critical step/.test(h2.rule),h2);
  ok('11 H2 the meeting-cancellation option at 100%, and a next check later than the rule flagged; typed values are kept',
    /this check was at 100%, so the next rehearsal meeting is cancelled/.test(h2.r1)&&h2.next==='2026-10-20'&&/later than the rule sets/.test(h2.nf)&&h2.reh===true,h2);
  const gr=await p.evaluate(()=>{__mk();const a=__t('tiGraphDD');
    window.__nbhFactsIn({data:{behaviors:[{name:'Aggression (simulated)',kind:'target',unit:'per day'}],series:[{date:'2026-10-06',v:{'Aggression (simulated)':4}},{date:'2026-10-13',v:{'Aggression (simulated)':2}},{date:'2026-10-20',v:{'Aggression (simulated)':1}}]}});
    return {a,b:__t('tiGraphDD'),svgs:document.querySelectorAll('#tiFbGraph svg').length,cap:__t('tiGraphCap')};});
  ok('12 H2 the integrity graph, with the student’s graph from Form DD-1 beneath it on the same dates',/shows beneath this one when the form is opened in the workstation/.test(gr.a)&&gr.svgs===2&&
    /^Form DD-1: Aggression \(simulated\) \(per day\), 3 recorded days/.test(gr.b)&&/against the 80% criterion/.test(gr.cap),gr);

  /* ---- M1, H7 ---- */
  const k=await p.evaluate(()=>{__mk({after:()=>{S.obs[0].ioa=true;S.obs[3].ioa=true;S.obs[0].obs2='Second observer A (simulated)';S.obs[3].obs2='Second observer B (simulated)';
      for(let i=0;i<20;i++){S.ioa[i+'_0']='C';S.ioa[i+'_3']='C';}}});
    const K=window.__tiV2564.kappa([['C','C'],['C','C'],['EO','EO'],['C','EO']]);
    return {out:__t('ioaOut'),kap:__t('tiKappa'),cov:__t('tiCovTbl'),pair:__t('tiPairTbl'),drift:__t('tiDrift'),rule:__t('tiCovRule'),flag:__t('tiCovFlag'),K};});
  ok('13 M1 kappa is (observed − chance) ÷ (1 − chance) over the four codes (3 of 4 alike, chance .50: kappa .50)',Math.abs(k.K.po-0.75)<1e-9&&Math.abs(k.K.pe-0.5)<1e-9&&Math.abs(k.K.kappa-0.5)<1e-9,k.K);
  ok('14 M1 85% agreement that chance explains shows kappa 0.00, flagged below .60 as Hartmann’s suggestion; one code throughout is not calculable',
    /Observation #485\.00%17 of 20 steps coded alike; kappa 0\.00 \(chance agreement 85\.0%\)kappa below \.60: Hartmann’s \(1977\) suggestion, not a validated cut-off/.test(k.out)&&
    /Observation #1100\.00%20 of 20 steps coded alike; kappa not calculable/.test(k.out)&&/^Kappa, overall0\.00/.test(k.kap)&&/below \.60/.test(k.kap),k);
  ok('15 H7 IOA coverage by observation type: observations with IOA out of all, and the percentage',/Announced11100\.0%100\.0%/.test(k.cov)&&/Unannounced3133\.3%85\.0%/.test(k.cov)&&/All4250\.0%/.test(k.cov),k.cov);
  ok('16 H7 agreement by observer pairing, and possible drift (the latest check 15 points below the first; one pairing 15 points above)',
    /Observer A \(simulated\) with Second observer A \(simulated\)1100\.0%/.test(k.pair)&&/with Second observer B \(simulated\)185\.0%/.test(k.pair)&&
    /^Possible driftThe latest IOA check/.test(k.drift)&&/latest IOA check \(#4, 85\.0%\) is 15\.0 points below the first/.test(k.drift)&&/is 15\.0 points above the other pairings/.test(k.drift)&&/Kazdin, 1977/.test(k.drift),k);
  ok('17 H7 the default is printed: a quarter to a third of observations in every condition, rotate the second observer, checks unknown to the primary observer',
    /IOA on at least a quarter to a third of observations in every condition, spread across times, activities and observers\. Rotate the second observer\. Where possible, the primary observer does not know which observation will be checked/.test(k.rule)&&k.flag==='',k);
  const cv=await p.evaluate(()=>{__mk({after:()=>{S.obs[0].ioa=true;for(let i=0;i<20;i++)S.ioa[i+'_0']='C';}});const a=__t('tiCovFlag');
    const inp=document.querySelector('#ioaTbl input[data-tio="obs2"]');inp.value='School psychologist (simulated)';inp.dispatchEvent(new Event('input',{bubbles:true}));
    return {a,obs2:S.obs[0].obs2,pair:__t('tiPairTbl')};});
  ok('18 H7 a condition with no IOA is flagged, and the second observer typed on the IOA table is kept and read by pairing',
    /^IOA coverage/.test(cv.a)&&/Unannounced observations have no IOA/.test(cv.a)&&cv.obs2==='School psychologist (simulated)'&&/with School psychologist \(simulated\)/.test(cv.pair),cv);

  /* ---- M3 ---- */
  const m3=await p.evaluate(()=>{const r={};__mk({crit:90,meta:{pstart:'2026-10-13'}});r.a=__t('tiPlanBox');
    __mk({crit:90,meta:{pstart:'2026-10-01'}});r.b=__t('tiPlanBox');
    __mk({crit:90,meta:{pstart:'2026-10-13',mcheck:'Yes'}});r.c=__t('tiPlanBox');
    __mk({crit:90,meta:{mcheck:'No'}});r.d=__t('tiPlanBox');
    __mk({crit:90,miss:[0,0,6,3]});r.e=__t('tiPlanBox');
    __mk({crit:90});r.f=__t('tiPlanBox');return r;});
  ok('19 M3 a plan or step started on a date, with no check since at the criterion, is labelled a new plan: check weekly',
    /^New plan: errors now do more harm than later; check weekly\.The plan or step started on 10\/13\/2026, and no check since then has reached the 90% criterion/.test(m3.a)&&/St\. Peter Pipkin et al\., 2010/.test(m3.a)&&
    m3.b===''&&m3.c===''&&/^New plan.*The Setup sheet says no check has reached/.test(m3.d),m3);
  ok('20 M3 a drop of 20 or more points between consecutive checks is flagged (100% to 70%), a smaller one is not',
    /^An abrupt drop between checksObservation #2 100\.0% to #3 70\.0% \(down 30\.0 points\)\. An abrupt drop has done more harm than a gradual one/.test(m3.e)&&/Hronek & Kestner, 2025/.test(m3.e)&&m3.f==='',m3);

  /* ---- M5 ---- */
  const m5=await p.evaluate(()=>{const r={};__mk({meta:{ptype:'Skill acquisition'}});S.steps[0].d='Gives the instruction once, then a model prompt (simulated)';S.steps[1].d='Sets out the materials (simulated)';
    setStepField(0,'cmp','ant');setStepField(1,'cmp','ant');r.acq=[S.steps[0].crit,S.steps[1].crit];
    __mk({meta:{ptype:'Behavior reduction'}});S.steps[0].d='Gives the instruction once (simulated)';setStepField(0,'cmp','ant');r.red=S.steps[0].crit;
    __mk({meta:{ptype:'Both (reduces a behavior and teaches a replacement)'},after:()=>{S.steps[2].d='Delivers a gestural prompt (simulated)';S.steps[2].cmp='ant';}});
    r.banner=__t('tiPromptBanner');document.getElementById('tiPromptCrit').click();r.after=S.steps[2].crit;r.gone=!document.getElementById('tiPromptBanner');
    __mk({after:()=>{S.steps[0].cmp='ant';S.steps[1].cmp='ant';S.steps[5].cmp='con';}});r.card=[...document.querySelectorAll('#metricWrap .metric')].map(m=>m.textContent).find(t=>/^Antecedent steps/.test(t))||'';
    r.guide=[...document.querySelectorAll('.only-setup td')].map(td=>td.textContent).find(t=>/Carroll et al\., 2013/.test(t))||'';return r;});
  ok('21 M5 on an acquisition plan a prompting or instruction step tagged Antecedent is critical by default; another step, or a reduction plan, is not',
    m5.acq[0]===true&&m5.acq[1]===false&&m5.red===false,m5);
  ok('22 M5 a step already tagged is offered as critical on an acquisition plan, and Mark them critical marks it',/Step 3 names a prompt or an instruction/.test(m5.banner)&&m5.after===true&&m5.gone,m5);
  ok('23 M5 the antecedent-step figure beside the consequence-step figures, and the guide cites Carroll et al. (2013)',
    /^Antecedent steps50\.00%4 of 8 opportunities correct; 0 commission, 4 omission/.test(m5.card)&&/repeated instructions, a missing controlling prompt, and missing reinforcement each slowed or prevented learning \(Carroll et al\., 2013\)/.test(m5.guide),m5);

  /* ---- L2 ---- */
  const l2=await p.evaluate(()=>{__mk();const r={a:__t('tiDisTbl')};const c=document.querySelector('#piTbl input[data-tio="dis"][data-tiok="short"][data-tioj="2"]');
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));r.dis=S.obs[2].dis;r.b=__t('tiDisTbl');r.diff=__t('tiDisDiff');
    r.labels=[...document.querySelectorAll('#piTbl input[data-tio="dis"][data-tioj="0"]')].map(x=>x.getAttribute('aria-label'));return r;});
  ok('24 L2 each observation takes the distraction ticks, and the Summary shows integrity with and without them',
    l2.labels.length===4&&/other students needing help/.test(l2.labels[0])&&/whole-group instruction/.test(l2.labels[1])&&/staff short/.test(l2.labels[2])&&/interruptions/.test(l2.labels[3])&&
    /No distraction is ticked/.test(l2.a)&&l2.dis&&l2.dis.short===true&&/With any distraction ticked12085\.00%/.test(l2.b)&&/With none ticked36095\.00%/.test(l2.b)&&/with staff short12085\.00%/.test(l2.b)&&l2.diff==='-10.0 pts',l2);

  /* ---- L3, L4 ---- */
  const l3=await p.evaluate(()=>{const r={};__mk({after:()=>{S.steps[5].cmp='con';S.cells['5_2']='EO';S.cells['5_3']='EO';}});r.two=__t('tiRtMag');
    __mk({after:()=>{S.steps[5].cmp='con';S.cells['5_3']='EO';}});r.one=__t('tiRtMag');
    __mk();r.vsm=__t('tiRtVsm');__mk({miss:[2,0,0,0]});r.vsm2=__t('tiRtVsm');return r;});
  ok('25 L3 consequence errors on two or more checks suggest a larger or better reinforcer for the alternative; on one check, not',
    /^Consequence errors on 2 checks \(observations #3, #4\)\. Consider a larger or better reinforcer for the alternative behavior\. It made treatment more resistant to integrity errors in analog work \(Weinsztok & DeLeon, 2022\)/.test(l3.two)&&l3.one==='',l3);
  ok('26 L4 an unannounced figure below the announced one offers video self-monitoring for maintenance; above it, not',
    /^For maintenance: video self-monitoring\. The unannounced figure \(90\.0%\) is below the announced one \(100\.0%\)/.test(l3.vsm)&&/Paden & Carroll, 2025/.test(l3.vsm)&&l3.vsm2==='',l3);

  /* ---- files ---- */
  const rt=await p.evaluate(async()=>{__mk({meta:{proc:'ncr',thin:'1',pstart:'2026-10-01',mcheck:'No',fbCancel:'1'},after:()=>{S.obs[1].dis={help:true};S.obs[0].ioa=true;S.obs[0].obs2='Second observer (simulated)';S.obs[2].fb={date:'2026-10-20',fmt:'call',reh:true,next:'2026-10-27'};}});
    let blob=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:x';};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.querySelector('#saveBtn').click();for(let n=0;n<40&&!blob;n++)await new Promise(r=>setTimeout(r,50));const txt=blob?await blob.text():null;URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;S=blank();renderAll();
    const put=async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));for(let n=0;n<40&&!(S.meta&&S.meta.obs);n++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,100));};
    window.__al=[];window.alert=m=>__al.push(m);await put(txt);const back={al:__al.slice(),m:JSON.parse(JSON.stringify(S.meta)),o:S.obs.map(x=>({dis:x.dis,obs2:x.obs2,fb:x.fb})),thin:document.getElementById('tiThin').checked,proc:document.querySelector('select[data-m="proc"]').value};
    /* the same case as a file saved before v25.64: none of the new values */
    const old=JSON.parse(txt);['proc','thin','pstart','mcheck','fbCancel'].forEach(k=>delete old.S.meta[k]);old.S.obs.forEach(x=>{delete x.dis;delete x.obs2;delete x.fb;});
    S=blank();renderAll();await put(JSON.stringify(old));
    return {back,oldV:__t('verdictBox'),oldBand:__t('bandBox'),oldPlan:__t('tiPlanBox'),oldFb:document.querySelectorAll('#tiFbTbl input[data-fb="date"]').length,oldThin:document.getElementById('tiThin').checked,oldMeta:Object.keys(S.meta).sort().join()};});
  ok('27 the new values are saved and opened again: procedure, thinning, start, the check question, the cancellation option, distractions, second observer, feedback',
    rt.back.m.proc==='ncr'&&rt.back.m.thin==='1'&&rt.back.m.pstart==='2026-10-01'&&rt.back.m.mcheck==='No'&&rt.back.m.fbCancel==='1'&&rt.back.thin===true&&rt.back.proc==='ncr'&&
    rt.back.o[1].dis&&rt.back.o[1].dis.help===true&&rt.back.o[0].obs2==='Second observer (simulated)'&&rt.back.o[2].fb&&rt.back.o[2].fb.fmt==='call'&&rt.back.o[2].fb.next==='2026-10-27',rt.back);
  ok('28 a file saved before v25.64 opens: the verdict reads as before, the band asks for the procedure, nothing new is added to the file’s values',
    /^Criterion met/.test(rt.oldV)&&/Set the main procedure on the Setup sheet/.test(rt.oldBand)&&rt.oldPlan===''&&rt.oldFb===4&&rt.oldThin===false&&rt.oldMeta==='obs,ptype',rt);
  const sim=await p.evaluate(async()=>{document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,500));
    return {proc:S.meta.proc,band:__t('bandBox'),fb:document.querySelectorAll('#tiFbTbl thead th').length,cov:__t('tiCovTbl'),recheck:S.meta.recheck};});
  ok('29 the simulation runs DRA with every response reinforced, has feedback, second observers and distractions, and its re-check follows the fading rule',
    sim.proc==='dra-every'&&/Main procedure: DRA, reinforcing every alternative response/.test(sim.band)&&sim.fb===5&&/Unannounced3133\.3%/.test(sim.cov)&&/weekly until the criterion is met/.test(sim.recheck),sim);
  ok('30 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
