/* v25.65 Form TD-1 and its protocol bank (parcel TDB): the research review's approved changes (the BCBA, 11/2), one check
   or more for each. Simulated data only.
   FCT-SR H1  the extinction step inside FCT, DRA, NCR and DNRA is tagged "not yet agreed" until the agreement is recorded
          H3  FCT and DRA ladders: smaller steps, the share of the session and the drop shown, a large drop flagged; an
              older file keeps its five levels
          H4  a multiple schedule logs requests in S+ and S-; a step waits while fewer than 80% of counted requests are in S+
          H5  waits that end on what the student does, ranked after signals; a time-only wait named; the wait fields print
          H6  the published burst rule (first three sessions against the last five baseline sessions); other problem
              behavior; what to expect, printed
          H7  two step-backs at one level bring an added component; "If thinning stalls, we add"
          M3  Form FS-1's functions against the FCT cards
          M6  one rule for teaching the request during dense NCR or NCE
          M7  what the break holds, for escape, in the printed step
          M8  the existing-request rule and "Request chosen"
          M9  the request's reinforcer against what problem behavior got in baseline (a model prediction)
          L1  Hagopian et al. (1998): 17 applications across 14 clients
          L2  the mixed schedule is not for FCT maintenance
          L7  the step rules printed as conventions, with SR-1's and the studies'
   PREF   H1  competing items chosen by the measured reduction; the bank prints the card rule above a study's steps
          H2  the two CSA steps that reinforce problem behavior on purpose are OPTION steps; the wait-component method is the default
          H6  the A-CSA's blocking phase is a restrictive step, printed with the restrictive procedures
          M7  re-test on data, not monthly
   BC-RM  H3  a plan in some settings only points to Form BC-1 and the notice
          M4  free access around a challenge on a varying timer, faded
   FEED   M4  spoon feeding by backward chaining, the student making the last move to the mouth; blocking marked
          M5  the rapid-eating pathway, choking first aid, blocking marked
          M6  high-p at meals for selectivity only, the bite in front of the student
          M8  textures from the SLP or the feeding team
          L6  in school, an extra preferred portion; the lunch always served
   usage: WS_URL=http://127.0.0.1:8615 WS_ROOT=. node qa/v2565-tdb-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const F=L.forms().find(x=>x.id==='TD-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);return p;};
  const set=(p,n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return false;if(e.type==='checkbox')e.checked=!!v;else e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));return true;},[n,v]);
  const view=(p,v)=>p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v).then(()=>sleep(250));
  const add=(p,c)=>p.evaluate(c=>{const d=window.__tdAddComp(c);return d?d.dataset.i:null;},c);
  const clear=p=>p.evaluate(()=>{document.getElementById('compWrap').innerHTML='';});
  const fin=async p=>{await view(p,'final');return p.evaluate(()=>document.getElementById('final').innerText);};
  const steps=(p,i)=>p.evaluate(i=>[...document.querySelectorAll('#tdcard-'+i+' ol.steps textarea')].map(t=>t.value),i);
  const thin=(p,code)=>p.evaluate(code=>{window.__td2565.renderPlan();return [...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>tr.children[0].textContent.startsWith(code+' ')).map(tr=>({t:tr.children[1].textContent,pct:tr.children[1].dataset.pct||'',big:tr.children[1].classList.contains('td-big'),adv:tr.children[2].textContent}));},code);
  const log=(p,R)=>p.evaluate(R=>{const nm=document.getElementById('nMon');nm.value=String(Math.max(+nm.value,R.length));nm.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('#monBody input').forEach(e=>{if(e.type==='checkbox')e.checked=false;else e.value='';});
    R.forEach((r,i)=>Object.keys(r).forEach(k=>{const e=document.querySelector('[name="mo['+i+'].'+k+'"]');if(e)e.value=String(r[k]);}));
    window.__td2565.renderMon();return document.getElementById('monVerdict').innerText;},R);
  const bank=async(p,id)=>p.evaluate(id=>{window.__tdBank.show(id);const h=[...document.querySelectorAll('*')].find(e=>e.shadowRoot&&e.shadowRoot.querySelector('.detail'));const d=h.shadowRoot.querySelector('.detail');
    return {rule:(d.querySelector('.rulenote')||{}).textContent||'',shows:[...d.querySelectorAll('.td-bshow')].map(b=>b.dataset.show),opt:!!d.querySelector('.optck'),optLi:d.querySelectorAll('ol.steps li.opt').length};},id);
  const P=await open();
  const B=await P.evaluate(()=>{const o={};TD1_BANK.protocols.forEach(x=>{o[x.id]=x;});return o;});

  /* ---- H1 ---- */
  let p=P;await clear(p);
  const iF=await add(p,'FCT'),iD=await add(p,'DRA'),iN=await add(p,'NCR'),iX=await add(p,'DNRA'),iE=await add(p,'NCE');await sleep(200);
  let tags=await p.evaluate(()=>[...document.querySelectorAll('.td-exttag')].map(x=>[x.closest('.card').dataset.code,x.textContent]));
  ok('H1a the extinction step inside FCT, DRA, NCR and DNRA is tagged "not yet agreed" (NCE has no extinction step)',['FCT','DRA','NCR','DNRA'].every(c=>tags.some(t=>t[0]===c&&t[1]==='Extinction step: not yet agreed'))&&!tags.some(t=>t[0]==='NCE'),tags);
  let ft=await fin(p);
  ok('H1b the plan at a glance marks those cards "(extinction step: not yet agreed)"',(ft.match(/\(extinction step: not yet agreed\)/g)||[]).length===4,ft.slice(0,600));
  await set(p,'rb.3','yes');await set(p,'rb.extdate','2026-11-02');await sleep(150);
  tags=await p.evaluate(()=>[...document.querySelectorAll('.td-exttag')].map(x=>x.textContent));ft=await fin(p);
  ok('H1c with the agreement and its date recorded, the tags read "agreed on" the date and the glance mark goes',tags.length===4&&tags.every(t=>/^Extinction step: agreed on /.test(t))&&!/extinction step: not yet agreed/.test(ft),tags);
  await set(p,'rb.3','');await set(p,'rb.extdate','');

  /* ---- H3 ---- */
  let T=await thin(p,'FCT');const drops=T.map(r=>(/a drop of (\d+)%/.exec(r.pct)||[])[1]).filter(Boolean).map(Number);
  ok('H3a a new FCT card: 9 levels, each with the share of the session and the drop from the last step',T.length===9&&/^The request works 100% of the session; the starting step\./.test(T[0].pct)&&/^The request works 20% of the session; a drop of 20% from the last step/.test(T[7].pct)&&/1 min available, 4 min not/.test(T[7].t),T);
  ok('H3b no step drops by more than 25%, and none is flagged',drops.length===7&&Math.max(...drops)<=25&&!T.some(r=>r.big),drops);
  const TD=await thin(p,'DRA');ok('H3c the DRA ladder has the same steps',TD.length===9&&/S\+ 65%/.test(TD[2].t)&&/a drop of 19%/.test(TD[2].pct),TD);
  const TN=await thin(p,'NCR');ok('H3d other ladders carry no share line',TN.length===5&&TN.every(r=>!r.pct),TN);
  /* an older file: no ladder marker, so its five levels stay, with the large drops flagged */
  const old=await p.evaluate(()=>{const d=window.__tdCollect();delete d.fields['cp['+document.querySelector('#compWrap .card[data-code="FCT"]').dataset.i+'].thin'];return d;});
  await p.evaluate(d=>window.__tdRestore(d),old);await sleep(300);T=await thin(p,'FCT');
  ok('H3e a file saved before v25.65 keeps its five FCT levels; the 37.5% and 60% drops are flagged "Large step"',T.length===5&&/^S\+ 50% \/ S− 50%/.test(T[2].t)&&T[2].big&&T[3].big&&/a drop of 38%.*Large step: resurgence is more likely and larger\. Consider an extra step\./.test(T[2].pct)&&!T[1].big,T);
  /* the BCBA, 11/6: an older card offers "Switch to the 9-level ladder"; the switch maps the level by its share and notes it on the plan */
  const sw=await p.evaluate(async()=>{nbhUI.confirm=async()=>true;const card=document.querySelector('#compWrap .card[data-code="FCT"]'),i=card.dataset.i;
    const lv=document.querySelector('[name="mo[0].lv"]');if(lv){lv.value='3';lv.dispatchEvent(new Event('input',{bubbles:true}));}
    window.__td2565.renderPlan();const btn=document.querySelector('[data-thinsw="'+i+'"]');const had=!!btn&&btn.closest('p').classList.contains('noprint');
    if(btn)btn.click();await new Promise(r=>setTimeout(r,300));
    const f=window.__tdCollect().fields;return {had,thin:f['cp['+i+'].thin'],note:f['cp['+i+'].thinsw']||'',box:document.getElementById('tdThinSw').textContent,
      rows:[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^FCT /.test(tr.children[0].textContent)).length,btnAfter:!!document.querySelector('[data-thinsw="'+i+'"]')};});
  ok('11/6 an older FCT card offers the switch (screen only); switched at level 3 of 5 it becomes level 4 of 9, the ladder has 9 levels, and the plan notes the change',
    sw.had&&sw.thin==='9'&&/FCT ladder changed on \d+\/\d+\/\d{4}: level 3 of 5 became level 4 of 9\. Levels logged before .* are on the 5-level ladder\./.test(sw.note)&&sw.box.indexOf(sw.note)>=0&&sw.rows===9&&!sw.btnAfter,sw);
  await p.evaluate(()=>{const lv=document.querySelector('[name="mo[0].lv"]');if(lv){lv.value='';lv.dispatchEvent(new Event('input',{bubbles:true}));}});
  const thinCite=await p.evaluate(()=>document.querySelector('#thinTbl').nextElementSibling.nextElementSibling.nextElementSibling.textContent);
  ok('L7 the step rules print as conventions of this form, beside SR-1\'s and the studies\' own (Hagopian 2004, Rooker 2013, Kahng 2000, Saini 2016)',/conventions of this form/.test(thinCite)&&/Form SR-1 steps after 2 consecutive sessions/.test(thinCite)&&/Hagopian et al\. \(2004\)/.test(thinCite)&&/Kahng et al\. \(2000\)/.test(thinCite)&&/Saini et al\. \(2016\)/.test(thinCite),thinCite);

  /* ---- H5, M7, M9 ---- */
  await clear(p);const f1=await add(p,'FCT');await sleep(100);let st=await steps(p,f1);
  ok('H5a the FCT thinning step ranks signals first, then a wait that ends on what the student does, and names a time-only wait "not recommended alone"',/^Thin in this order of choice: a signaled multiple or chained schedule \(/.test(st[6])&&/a wait that ends on what the student does/.test(st[6])&&/time-only wait.*not recommended alone/.test(st[6])&&!/faded from 1 s toward 30 s/.test(st[6]),st[6]);
  await set(p,'cp['+f1+'].p4','10-s delay, then 30 s');await sleep(150);
  let ww=await p.evaluate(i=>{const w=document.querySelector('#tdcard-'+i+' .td-waitwarn');return w&&!w.hidden?w.textContent:'';},f1);
  ok('H5b a thinning tactic that is a plain delay is named: a time-only wait, not recommended alone',/^A time-only wait: not recommended alone/.test(ww),ww);
  await set(p,'cp['+f1+'].p8','says “okay” and does 2 easy problems (simulated)');await set(p,'cp['+f1+'].p9','a puzzle on the desk (simulated)');
  await set(p,'m.fn','escape');await sleep(150);
  const vis=await p.evaluate(i=>!document.querySelector('[name="cp['+i+'].p7"]').closest('.f').hidden,f1);
  await set(p,'cp['+f1+'].p7','the tablet (simulated)');ft=await fin(p);
  ok('M7a for escape, the FCT card asks what the break holds',vis);
  ok('M7b the printed step reads "a break of 1 min with" what the break holds',/a break of 1 min with the tablet \(simulated\)/.test(ft),ft.slice(0,1500));
  ok('H5c the printed thinning step says what this student does and has during the wait',/For this student: during the wait the student says “okay” and does 2 easy problems \(simulated\); available during the wait: a puzzle on the desk \(simulated\)\./.test(ft));
  const dn=await p.evaluate(()=>{const d=window.__tdAddComp('DNRA');return d.querySelector('[name="cp['+d.dataset.i+'].p3"]').closest('.f').querySelector('label').textContent;});
  ok('M7c the DNRA card asks the same',/During the break the student gets/.test(dn),dn);
  await set(p,'m.fn','attention');await sleep(150);
  const hid=await p.evaluate(i=>({filled:!document.querySelector('[name="cp['+i+'].p7"]').closest('.f').hidden}),f1);
  ok('M7d the break field stays shown once filled, whatever the function',hid.filled,hid);
  await set(p,'cp['+f1+'].p2','30-s attention');await set(p,'cp['+f1+'].bls','60');await set(p,'cp['+f1+'].blw','adult attention (simulated)');await set(p,'cp['+f1+'].bli','5');await set(p,'cp['+f1+'].rqq','lower');await sleep(150);
  let m9=await p.evaluate(i=>{const w=document.querySelector('#tdcard-'+i+' .td-m9w');return {t:w.textContent,warn:w.classList.contains('warn')};},f1);
  ok('M9a shorter or lower quality than baseline is warned, and labelled a model prediction (Fisher et al., 2023)',m9.warn&&/shorter \(30 s against 1\.0 min\)/.test(m9.t)&&/of lower quality/.test(m9.t)&&/model prediction \(Fisher et al\., 2023\)/.test(m9.t),m9);
  await set(p,'cp['+f1+'].p2','1-min attention');await set(p,'cp['+f1+'].rqq','same');await sleep(400);
  m9=await p.evaluate(i=>{const w=document.querySelector('#tdcard-'+i+' .td-m9w');return {t:w.textContent,warn:w.classList.contains('warn')};},f1);
  ok('M9b at least as good: no warning',!m9.warn&&/^At least as good as baseline/.test(m9.t),m9);

  /* ---- H4, H6, H7 on the monitoring sheet ---- */
  await set(p,'cp['+f1+'].p4','multiple schedule (red / white card)');await set(p,'mon.crit','0.3');await sleep(150);
  const sig=await p.evaluate(()=>({hid:document.getElementById('monTbl').classList.contains('td-nosig'),th:[...document.querySelectorAll('#monTbl thead th')].map(t=>t.textContent)}));
  ok('H4a a multiple schedule shows the "Req. in S+" and "Req. in S−" columns, and the log has "Other beh." always',!sig.hid&&sig.th.includes('Req. in S+')&&sig.th.includes('Req. in S−')&&sig.th.includes('Other beh. /min'),sig);
  const base=[{p:'BL',t:2},{p:'BL',t:3},{p:'BL',t:2.5},{p:'BL',t:3},{p:'BL',t:2}];
  const tx=(t,lv,sp,sm,more)=>Object.assign({p:'Tx',t,lv,ind:90},sp!=null?{sp,sm}:{},more||{});
  let v=await log(p,base.concat([tx(0.2,2,6,4),tx(0.2,2,6,4),tx(0.1,2,6,4)]));
  ok('H4b at criterion but only 60% of requests in S+: hold, naming the share and the 80% rule',/^DecisionHold: 60% of requests in S\+ over the last 3 sessions at level 2; the rule needs at least 80%/.test(v.replace(/\n/g,'')),v);
  v=await log(p,base.concat([tx(0.2,2),tx(0.2,2),tx(0.1,2)]));
  ok('H4c no requests counted by signal: the rule works as before (advance) and asks for the counts',/Advance one thinning level/.test(v)&&!/of requests in S\+/.test(v.split('\n')[0]+v.split('\n')[1])&&/Count requests in S\+ and in S− each session/.test(v),v);
  v=await log(p,base.concat([tx(0.2,2,9,1),tx(0.2,2,9,1),tx(0.1,2,9,1)]));
  ok('H4d 90% in S+: advance, naming the share',/Advance one thinning level/.test(v)&&/and 90% of requests in S\+/.test(v),v);
  await set(p,'mon.disc','60');v=await log(p,base.concat([tx(0.2,2,6,4),tx(0.2,2,6,4),tx(0.1,2,6,4)]));
  ok('H4e the BCBA may set the criterion, never below 70',/the rule needs at least 70%/.test(v),v);await set(p,'mon.disc','');
  T=await thin(p,'FCT');ok('H4f the ladder\'s advance rule names the S+ share',/at least 80% of requests made while the S\+ is up/.test(T[0].adv),T[0]);
  v=await log(p,base.concat([tx(1,1),tx(3.2,1),tx(1,1)]));
  ok('H6a session 2 of treatment above every one of the last five baseline sessions: a possible burst, with what to expect (the old first-session rule missed it)',/Possible extinction burst: treatment session #7 \(3\.2\/min\) is higher than every one of the last 5 baseline sessions \(highest 3\/min\)/.test(v)&&/About 1 in 4 treatments show a burst/.test(v)&&/do not change the plan in the first three sessions without the BCBA/.test(v),v);
  v=await log(p,base.concat([tx(2.9,1),tx(2.9,1),tx(2.9,1)]));
  ok('H6b above the baseline mean but not above every baseline session: no burst line',!/burst/i.test(v.replace(/About 1 in 4[^\n]*/,'')),v);
  v=await log(p,[{p:'BL',t:2,o:0},{p:'BL',t:2,o:0.1},{p:'BL',t:2,o:0}].concat([tx(1,1,null,null,{o:0.6}),tx(1,1)]));
  ok('H6c other problem behavior rising above every baseline session is named',/Other problem behavior rose: treatment session #4 \(0\.6\/min\)/.test(v)&&/the rule reads five/.test(v)===false,v);
  const note=await p.evaluate(()=>document.querySelector('.td-burstnote').textContent);
  ok('H6d the monitoring sheet prints what to expect (Lerman & Iwata, 1995; Muething et al., 2024)',/about 1 in 4 treatments show a burst/.test(note)&&/36% against 12%/.test(note)&&/fifth session/.test(note)&&/Muething et al\., 2024/.test(note),note);
  v=await log(p,base.concat([tx(0.2,1),tx(0.2,2),tx(1,2),tx(1,1),tx(0.2,2),tx(1,2),tx(1,1)]));
  ok('H7a two step-backs from one level: add a component before trying it again (Rooker et al., 2013)',/Level 2 has had two or more step-backs: before trying it again, add an alternative reinforcer or competing items/.test(v)&&/If thinning stalls, we add/.test(v),v);
  await set(p,'p.stall','competing items during “not now” (simulated)');v=await log(p,base.concat([tx(0.2,1),tx(0.2,2),tx(1,2),tx(1,1),tx(0.2,2),tx(1,2),tx(1,1)]));
  const stall=await p.evaluate(()=>document.querySelector('.td-stallrule').textContent);
  ok('H7b the plan\'s own added component is quoted, and the plan sheet prints the rule without punishment as the next step',/The plan says: competing items during “not now” \(simulated\)\./.test(v)&&/Punishment is not the next step here/.test(stall)&&/10 of 14/.test(stall),{v,stall});

  /* ---- M3 ---- */
  await clear(p);await set(p,'m.fn','multiple');const c1=await add(p,'FCT');await sleep(100);
  await p.evaluate(()=>window.__nbhFactsIn({behaviorsFS:[{label:'Hitting (simulated)',fn:'escape'},{label:'Yelling (simulated)',fn:'attention'}]}));await sleep(200);
  let cov=await p.evaluate(()=>{const e=document.getElementById('tdFctCov');return e&&!e.hidden?e.textContent:'';});
  ok('M3a Form FS-1 lists 2 functions; one FCT card: the warning names both counts and Weber et al. (2024)',/^Form FS-1 lists 2 functions \(escape, attention\); the FCT cards cover 1\./.test(cov)&&/Weber et al\., 2024/.test(cov),cov);
  ft=await fin(p);ok('M3b the warning is in Not ready to start',/Form FS-1 lists 2 functions/.test(ft));
  const c2=await add(p,'FCT');await set(p,'cp['+c1+'].p6','escape from math (simulated)');await set(p,'cp['+c2+'].p6','attention from the teacher (simulated)');await sleep(500);
  cov=await p.evaluate(()=>{window.__td2565.sync();const e=document.getElementById('tdFctCov');return e&&!e.hidden?e.textContent:'';});
  ok('M3c one request for each function: no warning',cov==='',cov);
  await p.evaluate(()=>window.__nbhFactsIn({}));

  /* ---- M6, PREF-H1, H6, M7, L2 in the component library ---- */
  await clear(p);const lib=await p.evaluate(()=>{const o={};['NCR','NCE','EE','C_CSA','C_ACSA','S_MIX'].forEach(c=>{o[c]=window.__tdLibOf(c);});return o;});
  ok('M6a NCR and NCE: teach the request alongside, count requests, thin first if they stay near zero',[lib.NCR,lib.NCE].every(L=>L.steps.some(s=>/^Teach the request.*alongside/.test(s)&&/count requests each session/.test(s)&&/thin .* before expecting them/.test(s)))&&!lib.NCR.steps.some(s=>/Introduce FCT after thinning/.test(s))&&!lib.NCE.steps.some(s=>/Do not combine with FCT/.test(s)));
  const fitFix=await p.evaluate(()=>{const j=JSON.parse(document.getElementById('td1-compare').textContent);return (j.rules.find(r=>r.id==='ncr-dra-same-reinforcer')||{}).fix||'';});
  ok('M6b the fit rule for NCR with a request gives the same rule',/^Teach the request alongside the free schedule and count requests each session; if requests stay near zero/.test(fitFix),fitFix);
  ok('PREF-H1a EE and C_CSA choose by at least an 80% reduction from the no-item control; engagement reported, not required; a rise is contraindicated',[lib.EE,lib.C_CSA].every(L=>L.steps.some(s=>/at least 80% from the no-item control\. Engagement is reported, not required/.test(s)&&/contraindicated/.test(s)))&&!lib.EE.steps.some(s=>/prefer matched stimulation/.test(s))&&!lib.C_CSA.steps.some(s=>/complement it/.test(s)));
  ok('PREF-H1b both test matched and unmatched items',[lib.EE,lib.C_CSA].every(L=>L.steps.some(s=>/items whose sensation may match the behavior, and items that do not/.test(s))));
  ok('PREF-M7 no "re-assess monthly": re-test on 2 days above the validation level, or at plan review; rotate sets about every 10 min if the reduction fades',[lib.EE,lib.C_CSA].every(L=>!L.steps.some(s=>/re-assess monthly/.test(s))&&L.steps.some(s=>/2 consecutive days; otherwise re-test at plan review/.test(s)))&&lib.EE.steps.some(s=>/about every 10 min/.test(s))&&/plan review/.test(lib.EE.params[2][1]),lib.EE.params);
  ok('PREF-H6a the A-CSA\'s blocking step is RESTRICTIVE, after free access and prompted engagement, never the default',/^RESTRICTIVE: Blocking; needs review and consent/.test(lib.C_ACSA.steps[1])&&/never the default/.test(lib.C_ACSA.steps[1]),lib.C_ACSA.steps[1]);
  ok('L2 the mixed schedule: not for FCT maintenance, keep the signal',/^Not for FCT maintenance: keep the signal/.test(lib.S_MIX.steps[1]),lib.S_MIX.steps[1]);
  await add(p,'C_ACSA');await add(p,'EE');ft=await fin(p);
  ok('PREF-H6b the plan lists the A-CSA\'s blocking phase among the restrictive procedures',/Restrictive or protective procedures[^\n]*Augmented competing-stimulus assessment \(its blocking phase: restrictive, needs review and consent/.test(ft),(ft.match(/Restrictive or protective[^\n]*/)||[''])[0]);

  /* ---- M8 ---- */
  await set(p,'m.fn','attention');await view(p,'select');
  for(const [k,v2] of [['q.attention.who','adults'],['q.attention.0','yes'],['q.attention.1','no'],['q.attention.2','yes'],['q.attention.3','yes']])await set(p,k,v2);await sleep(250);
  const rt=await p.evaluate(()=>document.getElementById('selRec').innerText);
  ok('M8a an existing request: used only if not in the chain to problem behavior, compared with a new one (Winborn et al., 2002)',/not part of the chain that leads to problem behavior/.test(rt)&&/keep the one that keeps problem behavior lowest and that the student prefers/.test(rt)&&!/DRA of that request with extinction/.test(rt),rt.slice(0,800));
  await set(p,'sel.req','new');await set(p,'sel.reqwhy','less problem behavior with the card (simulated)');
  const sv=await p.evaluate(()=>{const f=window.__tdCollect().fields;return [f['sel.req'],f['sel.reqwhy']];});
  ok('M8b "Request chosen: existing / new; why" is kept with the file',sv[0]==='new'&&/card/.test(sv[1]),sv);

  /* ---- guide (L1, M8) ---- */
  const g=await p.evaluate(()=>document.getElementById('guide').textContent);
  ok('L1 the guide: FCT with punishment applied 17 times across 14 clients, a 90% reduction in all 17',/applied 17 times across 14 clients, reached a 90% reduction in all 17 applications/.test(g)&&!/to the 14 failures/.test(g));
  ok('H7c the guide says many programs need an added component (Rooker et al., 2013)',/Even with good thinning, many programs need an added component/.test(g));
  ok('M8c the guide\'s existing-request rule matches the selection sheet',/not part of the chain that leads to problem behavior/.test(g)&&/Winborn-Kemmerer/.test(g));

  /* ---- BC-RM ---- */
  await set(p,'m.allset','no');await sleep(120);let bc=await p.evaluate(()=>{const e=document.getElementById('tdBcNote');return e&&!e.hidden?e.textContent:'';});
  ok('BC-RM-H3a a plan in some settings only points to Form BC-1 and the notice (Boyle et al., 2023)',/^This plan starts in some settings only\. Open Form BC-1 to count the other settings from the first day, and send the notice/.test(bc)&&/Boyle et al\., 2023/.test(bc),bc);
  await set(p,'m.allset','yes');await sleep(120);bc=await p.evaluate(()=>document.getElementById('tdBcNote').hidden);ok('BC-RM-H3b every setting: no notice',bc===true);
  await view(p,'plan');const rl=await p.evaluate(()=>document.querySelector('[name="rl.ncr"]').closest('label').textContent);
  await set(p,'rl.ncr',true);ft=await fin(p);
  ok('BC-RM-M4 free access around a challenge: a varying timer, faded over several sessions (Jones et al., 2025), in the safeguard and the staff line',/varying timer/.test(rl)&&/faded over several sessions, not stopped all at once/.test(rl)&&/Jones et al\., 2025/.test(rl)&&/Fade the extra deliveries over several sessions; do not stop them all at once\./.test(ft),rl);

  /* ---- the bank: PREF-H1, H2; FEED ---- */
  const cs1=B['c_csa-select-by-reduction'],cs2=B['c_csa-competing-items-plus-extinction'],OPT=/^OPTION: Reinforces problem behavior on purpose:/;
  ok('PREF-H2a both CSA cards keep the step that gives the reinforcer after problem behavior, as a marked OPTION step with why and how long',[cs1,cs2].every(x=>x.steps.filter(s=>OPT.test(s)).length===1&&x.steps.some(s=>OPT.test(s)&&/Why:/.test(s)&&/How long:/.test(s)&&/end it as soon as/.test(s))));
  ok('PREF-H2b the default for social functions tests items in the plan\'s wait period, adding no reinforcer (Fuhrman et al., 2018; Frank-Crawford et al., 2026b)',[cs1,cs2].every(x=>x.steps.some(s=>/^For socially maintained behavior \(the default\): run each trial inside the plan’s own wait/.test(s)&&/that is an extinction step: it is in the plan, not added by this assessment/.test(s))&&x.src.includes('fuhrman2018')&&/optional step/.test(x.note)));
  let bk=await bank(p,'c_csa-competing-items-plus-extinction');
  ok('PREF-H2c the bank shows the option box (unticked) and the card rule above the study\'s steps (PREF-H1)',bk.opt&&bk.optLi===1&&/^Card rule \(as on Form PA-1\): choose items that reduce the target behavior by at least 80%/.test(bk.rule),bk);
  const sp=B['ta_chain-spoon-feeding-guidance'];
  ok('FEED-M4 spoon feeding: backward chaining with the student\'s last move to the mouth; help stops before the hand leaves the plate; blocking marked; a maintenance step; full guidance only as context',sp.steps.some(s=>/always makes the last move/.test(s))&&sp.steps.some(s=>/stop any help before the hand leaves the plate/.test(s))&&sp.steps.some(s=>/^RESTRICTIVE: Blocking; needs approval before use:/.test(s))&&sp.steps.some(s=>/^After the skill is learned, keep praising spoon use/.test(s))&&!sp.steps.some(s=>/Guide the student's hand through all six steps/.test(s))&&/context only/.test(sp.note)&&/never forced open/.test(sp.note),sp.steps);
  const RAP=['dri-utensil-down-pacing','s_drl-pager-paced-bites','p_sf-pager-intensity-pacing','s_drl-pager-bite-spacing'];
  ok('FEED-M5a each rapid-eating card starts with choking first aid; blocking an early bite is marked RESTRICTIVE on every card',RAP.every(i=>B[i].steps[0]==='Staff at this meal are trained in choking first aid.')&&RAP.every(i=>B[i].steps.filter(s=>/\bblock/i.test(s)&&!/^RESTRICTIVE/.test(s)&&/^(If|During|RESTRICTIVE)/.test(s)).length===0));
  bk=await bank(p,'s_drl-pager-paced-bites');
  ok('FEED-M5b the bank gives the pathway in order: pre-cut portions and the utensil down, then the pager faded by strength',/^Rapid eating: try these in order\. First, pre-cut portions/.test(bk.rule)&&/faded by lowering the vibration strength, not by spacing the cues/.test(bk.rule)&&/choking first aid/.test(bk.rule)&&bk.shows.includes('dri-utensil-down-pacing')&&bk.shows.includes('p_sf-pager-intensity-pacing'),bk);
  const hp=B['a_highp-feeding-bites'];
  ok('FEED-M6a high-p bites are offered in front of the student by default; the lips stay an ordinary choice',/in front of the student’s mouth/.test(hp.steps[2])&&!/at the lips with the same instruction/.test(hp.steps[5])&&/in front of the student’s mouth/.test(hp.params['High-p instructions (3 in use)']));
  ok('FEED-M6b the feeding high-p cards say "selectivity only" and name the step ladder as the default (Dawson et al., 2003)',['a_highp-feeding-bites','a_highp-preferred-bites','a_highp-preferred-food-bites','a_highp-food-step-sequence'].every(i=>/selectivity only/.test(B[i].note)&&B[i].src.includes('dawson2003')));
  bk=await bank(p,'a_highp-preferred-bites');ok('FEED-M6c the bank panel: selectivity only, refer for refusal, with a button to the step ladder',/^For food selectivity only/.test(bk.rule)&&/refer to the feeding team/.test(bk.rule)&&bk.shows.includes('a_highp-food-step-sequence'),bk);
  const TX=['p_sf-food-texture-fading','effort-lower-food-texture','effort-smoother-texture-packing','effort-texture-bite-packing'];
  ok('FEED-M8a each texture card serves only what the SLP or the feeding team prescribed in Form FD-1, and steps up only on their written step',TX.every(i=>B[i].steps.some(s=>/^Serve only the texture, liquid thickness and bite size that the SLP or the feeding team prescribed/.test(s))));
  bk=await bank(p,'effort-lower-food-texture');ok('FEED-M8b the bank panel says so above the steps',/^Texture and bite size come from the SLP or the feeding team/.test(bk.rule),bk);
  const md=B['dra-main-dish-after-new-food'];
  ok('FEED-L6 in school: a small extra portion, the lunch always served; the simultaneous-presentation comparison in the note (Piazza et al., 2002)',md.steps.some(s=>/^In school: the preferred item is a small extra portion beyond the student’s usual lunch, and the lunch itself is always served/.test(s))&&/simultaneous presentation/.test(md.note)&&md.src.includes('piazza2002a'));
  ok('the bank holds no OPTION step outside the five cards that carry one',Object.values(B).filter(x=>x.steps.some(s=>OPT.test(s))).map(x=>x.id).sort().join(',')==='c_csa-competing-items-plus-extinction,c_csa-select-by-reduction,fct-card-lean-schedule,fct-lean-long-resurgence,fct-resurgence-mitigation-comparison');

  /* ---- a file saved before v25.65 opens and saves as it was ---- */
  await p.close();p=await open();
  const r0=await p.evaluate(()=>{const d={form:'TD-1',rev:'2026-09',counts:{mon:24,hp:4,comps:['FCT','NCR'],idx:[0,1],ns:[null,null]},fields:{'m.fn':'attention','cp[0].s6':'Thin with a signaled multiple schedule (old wording, simulated).','cp[0].p2':'30-s attention','cp[1].s4':'Introduce FCT after thinning (old wording, simulated).','mo[0].p':'BL','mo[0].t':'2','mo[1].p':'Tx','mo[1].lv':'4','mo[1].t':'0.2'}};
    window.__tdRestore(d);const f=window.__tdCollect().fields;return {s6:f['cp[0].s6'],s4:f['cp[1].s4'],thin:f['cp[0].thin'],lv:f['mo[1].lv'],o:f['mo[1].o'],rows:[...document.querySelectorAll('#thinTbl tbody tr')].filter(tr=>/^FCT /.test(tr.children[0].textContent)).length};});
  ok('an older file keeps its card words, its log and its five FCT levels; the new fields are empty',r0.s6==='Thin with a signaled multiple schedule (old wording, simulated).'&&r0.s4==='Introduce FCT after thinning (old wording, simulated).'&&r0.thin===''&&r0.lv==='4'&&r0.o===''&&r0.rows===5,r0);
  await p.close();
 }catch(e){ok('the run finished',false,e.stack||e.message);}
 ok('no page errors',!errs.length,errs.slice(0,4));
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
