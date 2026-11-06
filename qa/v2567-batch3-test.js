/* v25.67 batch 3: the other forms' parts of the approved batch-2 recommendations (the BCBA, 11/6), one check or more for each item
   built. Simulated data only; no participant or student names.
   SR     FCT-SR-H4  PR-1 steps on SR-1's second row (the share of requests in S+): hold below it, ask for it when missing
          FCT-SR-H2/H5  SR-1's family version for the two new designs (no extinction; a wait that ends on what the student does)
          FCT-SR-H5  TD-1's FCT card takes DT-1's tolerance response and activity into its two wait fields
   DELAY  H1, H2, M2, L1  TD-1 reads the rest of DT-1's plan (screen and BIP); M6 DT-1 hands the AUC on its own (AD-1 takes it);
          H3, H4, M8  TE-1 keeps AD-1's delivery window, exchange timing and token value
   PREF   H2, H6, M7  TD-1 reads PA-1's competing stimulus test (the wait-component items, the blocking item, rotation, re-test)
   SKILL  M7 SA-1 reads VS-1's schedule as VS-1 sends it; M9 ST-1 takes TI-1's "Why did it drop?"; BC-RM-M3 RM-1 reads TI-1
   TDB    FEED-M5, M6, M8  FD-1 adds its texture order, latest step and pace; TD-1's meal cards read FD-1 (and TB-1's target)
   BCRM   H3 TD-1 runs in / not yet in, to BC-1 and RM-1; M2 the card in every setting; H1, H5, H6, M5, M6 on PR-1
   STAFFA SKILL-L6 SA-1; FEED-M3 CT-1 from FD-1; CARE-L2 CF-1 from CT-1; STAFF-M12 QS-1 and EB-1 send PD-1 the request
   STAFFB STAFF-H4 TI-1 records feedback with RS-1's eight steps
   FEED   FEED-H3 DM-1's diet and RR-1's diagnoses and diet reach FD-1
   SAFETY SAFETY-H1 CR-1's restraint pattern to FS-1 and TD-1; CARE-H7, M10, M7 IC-1's and HD-1's decisions to CT-1 and TD-1
   ASSESS ASSESS-H1.4 EA-1 reads IN-1's candidate conditions; EA-VI-M7 FS-1 reads EA-1's tier
   READINGS  the 54 sources the parcels listed, in nbh-readings.js
   usage: WS_URL=http://127.0.0.1:8630 WS_ROOT=. node qa/v2567-batch3-test.js [section...] */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FILE=id=>L.forms().find(x=>x.id===id).file;
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
(async()=>{const br=await L.chromium.launch();const errs=[];
 const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});
 const open=async id=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(FILE(id)));await sleep(1200);return p;};
 const sec=async(k,fn)=>{if(!want(k))return;try{await fn();}catch(e){ok(k+': ran',false,String(e&&e.stack||e));}};

 /* ---------------- SR ---------------- */
 await sec('SR',async()=>{
  const p=await open('PR-1');
  const r=await p.evaluate(()=>{const F=window.__prSrStepDue;const ser=v=>v.map((x,i)=>({d:'2026-10-0'+(i+1),v:x}));
    const sch=(up2)=>({nota:'mult FR 1 / EXT',beh:'Aggression',decide:Object.assign({row:'Aggression',step:'3',up:{op:'le',v:0.2,n:2},back:{op:'ge',v:1,n:2}},up2?{row2:'Requests in S+ (%)',up2:{op:'ge',v:80,n:2}}:{})});
    const D=(s2)=>({behaviors:[{name:'Aggression',series:ser([0.5,0.1,0.1])}].concat(s2?[{name:'Requests in S+ (%)',series:ser(s2)}]:[])});
    return {hold:F(sch(true),D([90,85,60])),up:F(sch(true),D([90,85,92])),miss:F(sch(true),D(null)),old:F(sch(false),D(null))};});
  ok('SR 1 PR-1 holds the step when fewer than 80% of requests were in S+ (FCT-SR-H4)',r.hold&&r.hold.how==='hold'&&/60% of requests were made in S\+/.test(r.hold.t)&&/Greer et al\., 2016/.test(r.hold.t),r.hold);
  ok('SR 2 PR-1 names the share when the step is due',r.up&&r.up.how==='up'&&/at least 80% of requests were made in S\+ on each of the last 2 days/.test(r.up.t),r.up);
  ok('SR 3 PR-1 with no S+ row on DD-1: due on the rate, the counts asked for',r.miss&&r.miss.how==='up'&&/due on the rate/.test(r.miss.t)&&/has no row/.test(r.miss.t),r.miss);
  ok('SR 4 PR-1 without a second row (a saved SR-1 card) reads as before',r.old&&r.old.how==='up'&&/^Form SR-1’s schedule \(mult FR 1 \/ EXT, step 3\): a step up is due\. Aggression was at or below 0\.2 on each of the last 2 days with data on Form DD-1\. Take the next step/.test(r.old.t),r.old);
  await p.close();
  const s=await open('SR-1');
  const h=await s.evaluate(async()=>{const set=(k,v)=>{S.meta[k]=v;};const out={};
    S.meta.client='SIMULATED – Sample Student';set('beh','Hitting');set('alt','the break card');set('sr','a short break with the drawing kit');set('func','Escape or avoidance');
    set('ds_sel','nox');renderAll();await new Promise(r=>setTimeout(r,200));out.nox=window.srHome();out.noxNote=!!document.getElementById('srHomeNew');
    Object.assign(S.meta,{ds_sel:'wait',wt_sig:'“Wait, please,” and the wait card',wt_does:'holds the wait card and keeps working',wt_item:'a puzzle on the desk',wt_s0:'5',wt_sT:'60'});renderAll();await new Promise(r=>setTimeout(r,200));
    out.wait=window.srHome();out.box=(document.getElementById('srHomeOut')||{}).textContent||'';
    S.meta.wt_kind='time';out.time=window.srHome();
    S.meta.home_en='Our own words.';out.own=window.srHome();
    let f=null;try{f=window.__nbhFactsOut();}catch(e){f={err:String(e)};}out.facts=f&&f.schedule&&f.schedule.home;return out;});
  ok('SR 5 SR-1 writes a family version for FCT or DRA without extinction (FCT-SR-H2)',h.nox&&/Asking always works better/.test(h.nox.en)&&/Sample/.test(h.nox.en)&&h.nox.fresh&&h.noxNote,h.nox);
  ok('SR 6 SR-1 writes a family version for the wait that ends on what the student does (FCT-SR-H5)',h.wait&&/holds the wait card and keeps working/.test(h.wait.en)&&/a puzzle on the desk/.test(h.wait.en)&&/still doing it/.test(h.wait.en)&&/New wording/.test(h.box),h.wait);
  ok('SR 7 the Spanish version waits for the wait’s own words in Spanish',h.wait&&h.wait.es===''&&h.wait.need.includes('does')&&h.wait.need.includes('item'),h.wait);
  ok('SR 8 a time-only wait says the timer ends it',h.time&&/When the timer ends/.test(h.time.en),h.time&&h.time.en);
  ok('SR 9 the BCBA’s own words replace the draft and clear the new-wording note; the case carries the version for HD-1',h.own&&h.own.en==='Our own words.'&&!h.own.fresh&&h.facts&&h.facts.en==='Our own words.',{own:h.own,facts:h.facts});
  await s.close();
  const t=await open('TD-1');
  const d=await t.evaluate(async()=>{const i=window.__tdAddComp('FCT').dataset.i;await new Promise(r=>setTimeout(r,200));
    const g=k=>document.querySelector('[name="cp['+i+'].p'+k+'"]').value;
    window.__nbhFactsIn({delay:{src:'DT-1',arrange:'fct',tr:'says “okay” and waits with hands on the desk',activity:'a puzzle',ladder:[{s:5,met:''}]}});await new Promise(r=>setTimeout(r,200));
    const a={p8:g(8),p9:g(9)};const e=document.querySelector('[name="cp['+i+'].p9"]');e.value='the drawing kit';e.dispatchEvent(new Event('input',{bubbles:true}));
    window.__nbhFactsIn({delay:{src:'DT-1',arrange:'fct',tr:'x',activity:'another'}});await new Promise(r=>setTimeout(r,200));
    const b={p9:g(9)};const j=window.__tdAddComp('FCT').dataset.i;
    window.__nbhFactsIn({delay:{src:'DT-1',arrange:'srpos',tr:'waits',activity:'a book'}});await new Promise(r=>setTimeout(r,200));
    return {a,b,other:document.querySelector('[name="cp['+j+'].p8"]').value};});
  ok('SR 10 TD-1: DT-1’s tolerance response and activity fill the FCT card’s wait fields (FCT-SR-H5 join)',/says “okay” and waits with hands on the desk \(Form DT-1\)/.test(d.a.p8)&&d.a.p9==='a puzzle (Form DT-1)',d);
  ok('SR 11 a wait field typed by hand stays; a DT-1 path other than FCT fills nothing',d.b.p9==='the drawing kit'&&d.other==='',d);
  await t.close();
 });

 /* ---------------- DELAY ---------------- */
 await sec('DELAY',async()=>{
  const DLY={src:'DT-1',arrange:'fct',tr:'says “okay”',ladder:[{s:5,met:'10/1/2026'},{s:15,met:''}],current:15,
    shares:{imm:40,del:60,den:0},denialSay:'Not this time.',denialGives:'An alternative preferred activity at once (“Not now, but you can have ___”)',
    unavailable:'The tablet is broken. You can have the puzzle or the drawing book.',signal:'A continuous signal in view for the whole delay (visual timer, countdown, hand signal held)',askWhen:true,
    pbCrit:'At or below 0.10 of the baseline mean (a 90% reduction)',baseline:{pbm:1.234,sessions:3},relapsePlan:'Plan for problem behavior to come back. Problem behavior is likely to come back at least once while the delay is lengthened.'};
  const t=await open('TD-1');
  const r=await t.evaluate(async D=>{window.__tdAddComp('FCT');window.__nbhFactsIn({delay:D});await new Promise(r=>setTimeout(r,300));
    const n=document.getElementById('td67DtNote');const note=n&&!n.hidden?n.textContent:'',noteCls=n?n.className:'';const txt=window.__bipText();const i=txt.indexOf('DELAY AND DENIAL TOLERANCE (FORM DT-1)'),j=txt.indexOf('REINFORCEMENT THINNING LADDER');
    window.__nbhFactsIn({delay:{src:'DT-1',ladder:[{s:5}],tr:'waits'}});await new Promise(r=>setTimeout(r,200));
    return {note,noteCls,bip:i>=0?txt.slice(i,i+1600):'',order:i>j&&j>=0,old:window.__bipText().indexOf('DELAY AND DENIAL TOLERANCE')<0,oldNote:document.getElementById('td67DtNote').hidden};},DLY);
  ok('DELAY 1 TD-1 shows DT-1’s delay and denial plan beside the ladder (screen only)',/40% at once, 60% delayed, 0% denied; denied trials begin only after/.test(r.note)&&/Not this time; What a denial/.test(r.note)&&/noprint/.test(r.noteCls),r);
  ok('DELAY 2 TD-1’s BIP text carries it after the ladder: shares, denial, unavailable item, signal, "when?", criterion with the baseline, return of problem behavior',r.order&&/Denial statement \(said the same way every time\): Not this time\./.test(r.bip)&&/What a denial trial gives instead: An alternative/.test(r.bip)&&/An item that can never be given: The tablet is broken/.test(r.bip)&&/Signal during the delay: A continuous signal/.test(r.bip)&&/Asking “when\?”/.test(r.bip)&&/baseline mean 1\.23 per minute over 3 sessions/.test(r.bip)&&/If problem behavior comes back: Problem behavior is likely/.test(r.bip),r);
  ok('DELAY 3 a DT-1 protocol without the v25.65 keys adds nothing',r.old&&r.oldNote,r);
  await t.close();
  const dt=await open('DT-1');
  const a=await dt.evaluate(()=>{const o=document.getElementById('outAUC');const before=window.__nbhFactsOut();o.textContent='0.27';const L=document.getElementById('outLogK');if(L)L.textContent='-1.5';const after=window.__nbhFactsOut();return {before:before&&before.delay||null,after:after&&after.delay||null};});
  ok('DELAY 4 DT-1 hands the discounting AUC to the case on its own (DELAY-M6)',!a.before&&a.after&&a.after.discount&&a.after.discount.auc===0.27&&Array.isArray(a.after.ladder)&&!a.after.ladder.length,a);
  await dt.close();
  const ad=await open('AD-1');
  const au=await ad.evaluate(async()=>{window.__nbhFactsIn({delay:{src:'DT-1',ladder:[],discount:{auc:0.21,logk:-1,date:'2026-10-01'}}});await new Promise(r=>setTimeout(r,300));const e=document.querySelector('[name="l_auc"]');return e?e.value:null;});
  ok('DELAY 5 AD-1 takes the AUC from a case that holds only the discounting probe',au!=null&&/0\.21/.test(au),au);
  await ad.close();
  const te=await open('TE-1');
  const e=await te.evaluate(async()=>{const A={src:'AD-1',choice:'Accumulated',key:'acc',window:2,exchangeWhen:'Within the session',tokenValue:{pct:45,weak:true}};
    window.__nbhFactsIn({arrangement:A});await new Promise(r=>setTimeout(r,300));const b=document.getElementById('te67Ad');
    const o={box:b&&!b.hidden?b.textContent:'',cls:b?b.className:'',exHow:S.meta.exHow,exWhen:S.meta.exWhen};
    S.meta.exHow='Distributed: a short piece after each token or small set';window.__nbhFactsIn({arrangement:A});o.kept=S.meta.exHow;return o;});
  ok('DELAY 6 TE-1 shows AD-1’s delivery window, exchange timing and token value (screen only), with the weak-token caution',/within 2 s of the response/.test(e.box)&&/within the session/.test(e.box)&&/45% of the primary item, clearly below it/.test(e.box)&&/noprint/.test(e.cls)&&/te67-weak/.test(e.cls),e);
  ok('DELAY 7 TE-1 fills how and when the backup is given from AD-1 only while empty',/^Accumulated: all the earned time/.test(e.exHow)&&e.exWhen==='Within the session (Form AD-1)'&&/^Distributed/.test(e.kept),e);
  await te.close();
  /* QS-1's staff line keeps its words: AD-1's window there would change a line Form QS-1 already prints (ad1-w3b check 8); TE-1 carries it */
 });

 /* ---------------- PREF ---------------- */
 await sec('PREF',async()=>{
  const t=await open('TD-1');
  const MENU=[{name:'Puzzle box',csa:{verdict:'HC',red:86,cond:'Free access'}},{name:'Drawing kit',csa:{verdict:'HC (prompting)',red:81,cond:'Prompted engagement'}},
    {name:'Spinner',csa:{verdict:'HC with disruption',red:90,cond:'Response blocking',restrictive:'Response blocking (approved by the BCBA (simulated), 2026-10-02)'}},{name:'Ball',csa:{verdict:'Not competing',red:10}}];
  const r=await t.evaluate(async M=>{const i=window.__tdAddComp('FCT').dataset.i;
    window.__nbhFactsIn({menu:M,prefs:{csa:{mode:'wait',rotate:'Rotate item sets about every 10 min, or offer several HC items at once.',retest:'Re-test when the behavior during access rises above the validation level on 2 consecutive days; otherwise re-test at plan review.'}}});
    await new Promise(r=>setTimeout(r,300));const n=document.getElementById('td67PaNote');const note=n&&!n.hidden?n.textContent:'';const txt=window.__bipText(),k=txt.indexOf('COMPETING ITEMS (FORM PA-1)');
    const p9=document.querySelector('[name="cp['+i+'].p9"]').value;
    window.__nbhFactsIn({menu:M});await new Promise(r=>setTimeout(r,200));
    return {note,bip:k>=0?txt.slice(k,k+1200):'',p9,old:window.__bipText().indexOf('COMPETING ITEMS (FORM PA-1)')<0};},MENU);
  ok('PREF 1 TD-1 reads PA-1’s wait-component test: the items that competed fill the FCT wait item (PREF-H2)',r.p9==='Puzzle box or Drawing kit (Form PA-1, tested in the plan’s wait)'&&/inside the plan’s wait component/.test(r.note),r);
  ok('PREF 2 the BIP names the items, the blocking item as RESTRICTIVE with its approval (PREF-H6), the rotation and the re-test (PREF-M7)',/How the items were tested: inside the plan’s wait component/.test(r.bip)&&/Puzzle box \(86% reduction\); Drawing kit \(81% reduction, prompted engagement\)/.test(r.bip)&&/RESTRICTIVE: Spinner: competed only with response blocking \(approved by/.test(r.bip)&&/During use: Rotate item sets about every 10 min/.test(r.bip)&&/Re-test: Re-test when the behavior during access rises/.test(r.bip)&&!/Ball/.test(r.bip)&&!/Drawing kit \(81% reduction, prompted engagement\); Spinner/.test(r.bip),r);
  ok('PREF 3 a case from PA-1 before v25.65 (no prefs.csa) adds nothing',r.old,r);
  await t.close();
 });

 /* ---------------- SKILL ---------------- */
 await sec('SKILL',async()=>{
  /* SKILL-M7: Form VS-1's visuals reach SA-1 as {items:[...]} (the shape VS-1 sends): the schedule offers a program */
  const v=await open('VS-1');
  await L.loadSim(v);await sleep(1200);
  const vf=await v.evaluate(async()=>{
    S.chk.s_sched=true;try{renderAll();}catch(e){}let f=null;try{f=window.__nbhFactsOut();}catch(e){}return f;});
  ok('SKILL 0 VS-1 sends its visuals as an object with items, the schedule with its task analysis',vf&&vf.visuals&&Array.isArray(vf.visuals.items)&&vf.visuals.items.some(x=>/schedule/i.test(x.what)&&x.ta&&x.ta.steps.length===7),vf&&vf.visuals);
  await v.close();
  const sa=await open('SA-1');
  const s1=await sa.evaluate(async V=>{window.__nbhFactsIn({visuals:V});await new Promise(r=>setTimeout(r,300));const b=document.getElementById('visBox');const shown=b?b.textContent:'';
    const btn=document.getElementById('visStart');if(btn)btn.click();await new Promise(r=>setTimeout(r,300));
    return {shown,prog:S.meta.program,sd:S.meta.sd,steps:S.steps.map(x=>x.text)};},vf&&vf.visuals);
  ok('SKILL 1 SA-1 reads VS-1’s visuals and offers a program for the schedule (SKILL-M7 join)',/Form VS-1 has a visual schedule/.test(s1.shown)&&/Start a program for this schedule/.test(s1.shown),s1);
  ok('SKILL 2 the program is the schedule’s task analysis, taught total-task, with the schedule’s activities',s1.prog==='Visual schedule use (Form VS-1)'&&s1.steps.length===7&&/schedule: /.test(s1.sd),s1);
  const s2=await sa.evaluate(async()=>{window.__nbhFactsIn({visuals:[{what:'Visual schedule',words:'arrival, reading'}]});await new Promise(r=>setTimeout(r,200));return (document.getElementById('visBox')||{}).textContent||'';});
  ok('SKILL 3 the older list shape still reads',/arrival, reading/.test(s2),s2);
  await sa.close();
  /* SKILL-M9: TI-1's "Why did it drop?" answers reach ST-1 with the retraining list */
  const t=await open('TI-1');
  await t.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}window.alert=()=>{};});await L.loadSim(t);await sleep(1200);
  await t.evaluate(()=>{document.getElementById('tiDropSigned').click();document.querySelector('.tiDropK[data-k="mat"]').click();document.querySelector('.tiDropK[data-k="notice"]').click();
    const c=document.querySelector('[data-m="dropChanged"]');if(c){c.value='the timer moved to the desk';c.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(200);
  const dl=t.waitForEvent('download',{timeout:8000}).catch(()=>null);await t.evaluate(()=>document.getElementById('tiRetrainBtn').click());const D=await dl;
  let file=null;if(D){try{file=JSON.parse(L.fs.readFileSync(await D.path(),'utf8'));}catch(e){file=null;}}
  await t.close();
  ok('SKILL 4 TI-1’s retraining list carries the answers',file&&file.form==='TI-1-RETRAIN'&&file.why&&file.why.materialsOrTime&&file.why.noOneNotices,file&&file.why);
  const st=await open('ST-1');
  await st.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});
  await st.evaluate(()=>{const b=document.getElementById('stTiOpen')||[...document.querySelectorAll('button')].find(x=>/Import from Form TI-1|from Form TI-1/i.test(x.textContent||''));if(b)b.click();});await sleep(300);
  await st.setInputFiles('#stTiFile',{name:'TI-1_retrain_sim.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(file||{}))});await sleep(800);
  const k=await st.evaluate(async()=>{const go=document.getElementById('stTiGo');const dis=go?go.disabled:null;if(go&&!go.disabled)go.click();await new Promise(r=>setTimeout(r,500));
    return {dis,why:S.ti&&S.ti.retrain&&S.ti.retrain.why,k:[S.meta.wd_k1,S.meta.wd_k2,S.meta.wd_k3,S.meta.wd_k4],chg:S.meta.wd_changed||'',msg:(document.getElementById('stTiMsg')||{}).textContent||''};});
  ok('SKILL 5 ST-1 takes TI-1’s answers with the steps to retrain, and ticks the same gaps (SKILL-M9 join)',k.why&&k.why.materialsOrTime&&k.k[0]===false&&k.k[1]===true&&k.k[2]===false&&k.k[3]===true&&/timer moved to the desk \(Form TI-1\)/.test(k.chg),k);
  const k2=await st.evaluate(()=>{const keep=JSON.parse(JSON.stringify(S.ti));S.meta.wd_k1=true;S.meta.wd_k2=false;S.meta.wd_k4=false;return {kept:!!(keep.retrain&&keep.retrain.why)};});
  ok('SKILL 6 the answers survive the record’s own clean-up (saved with the import)',k2.kept,k2);
  await st.close();
  /* BC-RM-M3: TI-1's commission share reaches RM-1's reinstatement indicator and BC-1's integrity line (built in batch 2 on both sides) */
  const rm=await open('RM-1');
  const r1=await rm.evaluate(async()=>{S.meta.date='2026-09-01';window.__nbhFactsIn({integrity:{overall:88,obs:[{date:'2026-10-02',pct:88,com:12.5,conN:8}],commission:12.5}});await new Promise(r=>setTimeout(r,300));
    const ck='rei_'+TYPES.find(t=>t.k==='rei').ind.findIndex(x=>/commission error\) since the last review/.test(x));return S.ind[ck]===true&&S.meta.comAuto==='1';});
  ok('SKILL 7 RM-1 reads TI-1’s commission share (BC-RM-M3, both sides now in place)',r1===true,r1);
  await rm.close();
 });

 /* ---------------- TDB ---------------- */
 await sec('TDB',async()=>{
  const fd=await open('FD-1');
  await fd.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});await L.loadSim(fd);await sleep(1500);
  const fo=await fd.evaluate(async()=>{S.tex=[{date:'10/1/2026',step:'Soft solids, quarter-size bites',by:'School SLP (simulated)',role:'SLP'}];let f=null;try{f=window.__nbhFactsOut();}catch(e){f={err:String(e)};}return f&&f.feeding;});
  ok('TDB 1 FD-1 adds who prescribed the order and when, the latest step written, and the seconds per bite (FEED-M5, M8)',fo&&fo.texOrder&&fo.texOrder.by&&fo.texStep&&fo.texStep.step==='Soft solids, quarter-size bites'&&fo.texStep.role==='SLP'&&(!fo.last||typeof fo.last.secPerBite==='number'||fo.last.secPerBite===undefined),fo&&{texOrder:fo.texOrder,texStep:fo.texStep,last:fo.last});
  await fd.close();
  const t=await open('TD-1');
  const FEED={type:'refusal',typeLabel:'Food refusal',lead:'menu',rapid:true,clearance:{doctor:'2026-09-01',texture:'puree',liquid:'thin',bite:'pea-size'},texOrder:{by:'School SLP (simulated)',date:'2026-09-02'},
    texStep:{step:'Soft solids, quarter-size bites',date:'2026-10-01',by:'School SLP (simulated)',role:'SLP'},last:{date:'2026-10-03',accepted:80,mouthClean:70,secPerBite:9}};
  const r=await t.evaluate(async F=>{window.__nbhFactsIn({feeding:F});await new Promise(r=>setTimeout(r,400));const box=document.getElementById('td67Feed');const a={box:box&&!box.hidden?box.textContent:'',btns:box?box.querySelectorAll('.td67-show').length:0};
    /* a high-p feeding card and a texture card from the bank */
    const add=id=>{const c=window.__tdAddComp(window.__tdBank.entry(id).code);const e=document.querySelector('[name="cp['+c.dataset.i+'].bank"]');if(e){e.value=id;e.dispatchEvent(new Event('input',{bubbles:true}));}return c;};
    add('a_highp-feeding-bites');add('p_sf-food-texture-fading');await new Promise(r=>setTimeout(r,500));
    a.box2=box.textContent;a.bip=(()=>{const t=window.__bipText(),k=t.indexOf('MEALS (FORM FD-1)');return k>=0?t.slice(k,k+1500):'';})();
    window.__tdBank.show('a_highp-feeding-bites');await new Promise(r=>setTimeout(r,300));
    const host=document.getElementById('tdBankHost'),root=host&&(host.shadowRoot||host),rn=()=>root?[...root.querySelectorAll('.rulenote')].map(x=>x.textContent).join(' | '):'';a.bank=rn();
    window.__nbhFactsIn({feeding:Object.assign({},F,{type:'type',rapid:false})});await new Promise(r=>setTimeout(r,400));window.__tdBank.show('a_highp-feeding-bites');await new Promise(r=>setTimeout(r,300));
    a.bank2=rn();a.box3=box.textContent;
    window.__nbhFactsIn({});await new Promise(r=>setTimeout(r,300));a.none=box.hidden&&window.__bipText().indexOf('MEALS (FORM FD-1)')<0;
    window.__nbhFactsIn({behaviors:[{label:'Rapid eating',lib:'feed-rapid',def:'more than one bite in 5 s'}]});await new Promise(r=>setTimeout(r,300));a.tb=box.hidden?'':box.textContent;
    return a;},FEED);
  ok('TDB 2 FD-1 records rapid eating: TD-1 offers the pacing pathway in order, with FD-1’s seconds per bite, blocking restrictive, choking first aid (FEED-M5)',/Rapid eating \(Form FD-1\): the pacing pathway, in this order/.test(r.box)&&/1\. Pre-cut portions/.test(r.box)&&/2\. A vibrating pager/.test(r.box)&&/9 s per bite/.test(r.box)&&/RESTRICTIVE and never the default/.test(r.box)&&/choking first aid/.test(r.box)&&r.btns===3,r);
  ok('TDB 3 a TB-1 rapid-eating target offers the same pathway without FD-1',/the target on Form TB-1: Rapid eating/.test(r.tb),r.tb);
  ok('TDB 4 FD-1 sorts the problem as food refusal: the high-p card in the plan is flagged and the bank says to refer (FEED-M6)',/A high-p feeding card is in the plan, and Form FD-1 sorts the problem as food refusal/.test(r.box2)&&/Form FD-1 sorts this student’s problem as food refusal\..*refer to the feeding team rather than add this card/.test(r.bank),{box2:r.box2,bank:r.bank.slice(0,600)});
  ok('TDB 5 selectivity by type: the bank says the high-p cards fit, and no flag',/sorted as selectivity by type: these cards fit/.test(r.bank2)&&!/A high-p feeding card is in the plan/.test(r.box3),{bank2:r.bank2.slice(0,600),box3:r.box3});
  ok('TDB 6 a texture card prints FD-1’s order with the prescriber and the latest step written (FEED-M8)',/MEALS \(FORM FD-1\)/.test(r.bip)&&/Textures and bite sizes: texture puree; liquid thin; bite size pea-size \(prescribed by School SLP \(simulated\), 9\/2\/2026\)\. Current step: Soft solids, quarter-size bites \(written by School SLP \(simulated\), SLP, 10\/1\/2026\)\. A step goes up only when/.test(r.bip)&&/Staff at this meal are trained in choking first aid/.test(r.bip),r.bip);
  ok('TDB 7 without FD-1 in the case nothing is added',r.none,r);
  await t.close();
 });

 /* ---------------- BCRM ---------------- */
 await sec('BCRM',async()=>{
  const t=await open('TD-1');
  const a=await t.evaluate(async()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;['input','change'].forEach(x=>e.dispatchEvent(new Event(x,{bubbles:true})));};
    const before={out:(window.__nbhFactsOut()||{}).plan,lab:!!document.querySelector('[name="rl.card"]'),runsPrint:(document.querySelector('.td67-runs')||{}).className||''};
    set('m.beh','Hitting (simulated)');set('m.allset','no');set('m.runsin','the resource room');set('m.notyet','the general classroom and the bus');
    const cb=document.querySelector('[name="rl.card"]');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
    const o=window.__nbhFactsOut(),txt=window.__bipText();const fin=document.getElementById('rlFinal');
    return {before,settings:o&&o.plan&&o.plan.settings,relapse:o&&o.plan&&o.plan.relapse,bipLine:(txt.match(/Settings: [^\n]*/)||[''])[0],fin:fin?fin.textContent:''};});
  ok('TDB/BCRM 1 TD-1 asks where the plan runs and where not yet, off the print (BC-RM-H3)',a.before.lab&&/noprint/.test(a.before.runsPrint),a.before);
  ok('BCRM 2 TD-1 sends plan.settings and the BIP names them',a.settings&&a.settings.all==='no'&&a.settings.runsIn==='the resource room'&&a.settings.notYet==='the general classroom and the bus'&&/Settings: the plan runs in the resource room; not yet in the general classroom and the bus \(Form BC-1 counts the behavior there from the first day\)/.test(a.bipLine),a);
  ok('BCRM 3 TD-1’s relapse safeguards offer "The replacement response goes everywhere", printed when ticked (BC-RM-M2 mirror)',/The replacement response goes everywhere\./.test(a.fin)&&/A copy of the card or device is in every setting/.test(a.fin),a.fin);
  await t.close();
  const b=await open('BC-1');
  const bc=await b.evaluate(async()=>{window.__nbhFactsIn({plan:{src:'TD-1',settings:{all:'no',runsIn:'the resource room',notYet:'the general classroom'}}});await new Promise(r=>setTimeout(r,300));
    const n=document.getElementById('bc67Td');const o={chg:S.meta.chgName,con:S.meta.conName,note:n?n.textContent:''};
    S.meta.conName='Art class';const e=document.querySelector('[data-m="conName"]');if(e)e.value='Art class';window.__nbhFactsIn({plan:{src:'TD-1',settings:{runsIn:'x',notYet:'y'}}});o.kept=S.meta.conName;return o;});
  ok('BCRM 4 BC-1 takes the changed and constant settings from TD-1 while empty, and says so',bc.chg==='the resource room'&&bc.con==='the general classroom'&&/Form TD-1: the plan runs in the resource room; not yet in the general classroom\./.test(bc.note)&&bc.kept==='Art class',bc);
  await b.close();
  const m=await open('RM-1');
  const rm=await m.evaluate(async()=>{window.__nbhFactsIn({plan:{src:'TD-1',settings:{runsIn:'the resource room',notYet:'the bus'}}});await new Promise(r=>setTimeout(r,300));
    const el=document.querySelector('#riskWrap .rm67-td');return {t:el?el.textContent:'',ticked:Object.keys(S.ind||{}).filter(k=>S.ind[k]&&/^ren_/.test(k))};});
  ok('BCRM 5 RM-1 names, under Renewal, where the plan does not run yet; nothing is ticked',/Form TD-1: the plan does not run yet in the bus \(it runs in the resource room\)/.test(rm.t)&&!rm.ticked.length,rm);
  await m.close();
  const p=await open('PR-1');
  const pr=await p.evaluate(async()=>{window.__nbhFactsIn({contrast:{src:'BC-1',kind:'direct',headline:'Not clear evidence of contrast',conName:'Art class',change:'+40%',extension:{to:'Art class',change:'-55%',fell:true,rose:false,n:4},replicated:true,more:[{conName:'Lunch',kind:'positive',headline:'Consistent with positive contrast',change:'+30%'}]},
      relapse:{src:'RM-1',n:3,rel:2,long:1,rrScored:3,rrDisrupted:2,line:'2 of 3 challenges showed relapse (Form RM-1)'}});await new Promise(r=>setTimeout(r,300));
    const el=document.getElementById('pr67Contrast');const a=el&&!el.hidden?el.textContent:'';window.__nbhFactsIn({});return {a,none:document.getElementById('pr67Contrast').hidden};});
  ok('BCRM 6 PR-1 shows BC-1’s direct verdict, the extension result and its replication, and the other components (BC-RM-H1, M5, M6)',/Not clear evidence of contrast in Art class\./.test(pr.a)&&/After the plan was extended to Art class: it fell \(-55%\), 4 sessions\. Replicated:/.test(pr.a)&&/Lunch: Consistent with positive contrast \(\+30%\)/.test(pr.a),pr);
  ok('BCRM 7 PR-1 shows how long relapse lasted and the replacement response’s disruption from RM-1 (BC-RM-H5, H6)',/relapse lasted 3 sessions or more at 1 of 2 challenges with relapse: review the step; do not advance; the replacement response was disrupted at 2 of 3 challenges scored/.test(pr.a)&&pr.none,pr);
  await p.close();
 });

 /* ---------------- STAFFA ---------------- */
 await sec('STAFFA',async()=>{
  const sa=await open('SA-1');
  const s=await sa.evaluate(async()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    const a=!!document.querySelector('#hierNote .sa67-home');set('setting','home, at the kitchen table');await new Promise(r=>setTimeout(r,200));const el=document.querySelector('#hierNote .sa67-home');
    return {a,t:el?el.textContent:'',cls:el?el.className:''};});
  ok('STAFFA 1 SA-1: for a home team, the hierarchy shows that caregivers may prefer least-to-most, on screen only (SKILL-L6)',!s.a&&/caregivers may prefer least-to-most prompting/.test(s.t)&&/Halbur et al\., 2020/.test(s.t)&&/sa-scr/.test(s.cls),s);
  await sa.close();
  const ct=await open('CT-1');
  const c=await ct.evaluate(async()=>{window.__nbhFactsIn({feeding:{lead:'menu',plan:['Mealtime structure','Simultaneous presentation'],type:'type'}});await new Promise(r=>setTimeout(r,300));
    const b=document.getElementById('ct67Fd');const a={box:b&&!b.hidden?b.textContent:'',meal:S.meta.meal||''};document.getElementById('ct67FdGo').click();await new Promise(r=>setTimeout(r,300));
    a.after={meal:S.meta.meal,written:S.meta.meal_written,team:S.meta.meal_team,boxHidden:document.getElementById('ctMealBox').hidden};
    window.__nbhFactsIn({feeding:{lead:'team',plan:['Mealtime structure']}});await new Promise(r=>setTimeout(r,200));a.team=document.getElementById('ct67Fd').textContent;a.kept=S.meta.meal_team;return a;});
  ok('STAFFA 2 CT-1: FD-1’s plan is offered, and nothing changes until "Train this routine" (FEED-M3)',/Form FD-1 holds a feeding plan: Mealtime structure; Simultaneous presentation\./.test(c.box)&&c.meal==='',c);
  ok('STAFFA 3 the button turns the meal on and fills the written steps and who leads from FD-1',c.after.meal==='yes'&&c.after.written==='From Form FD-1’s plan: Mealtime structure; Simultaneous presentation'&&/feeding specialist, with the plan on Form FD-1/.test(c.after.team)&&c.after.boxHidden===false,c.after);
  ok('STAFFA 4 a medical feeding team leading: CT-1 trains none of it; a filled field stays',/A medical feeding team leads it: record its training here; this form trains none of it\./.test(c.team)&&/with the plan on Form FD-1/.test(c.kept),c);
  await ct.close();
  const cf=await open('CF-1');
  const f=await cf.evaluate(async()=>{window.__nbhFactsIn({caregiver:{fit:[{q:'I have time to do this in that routine',a:'Yes',w:''},{q:'I can do it on a bad day, not only a good one',a:'No',w:'a shorter version for busy mornings'}]}});await new Promise(r=>setTimeout(r,300));
    const el=document.getElementById('cf67CtFit');const a=el&&!el.hidden?el.textContent:'';window.__nbhFactsIn({});return {a,none:document.getElementById('cf67CtFit').hidden};});
  ok('STAFFA 5 CF-1 shows CT-1’s six home-fit answers beside the school ratings (CARE-L2)',/Home Fit from Form CT-1/.test(f.a)&&/No caregiver rated this form/.test(f.a)&&/a shorter version for busy mornings/.test(f.a)&&/1 yes, 0 partly, 1 no/.test(f.a)&&f.none,f);
  await cf.close();
  const q=await open('QS-1');
  const qa=await q.evaluate(()=>{S.holders='Ms. Lee, classroom teacher (simulated): issue 2';S.meta.issueNo='2';const a=window.__qs2567Ask();const o=window.__nbhFactsOut();return {a,out:o&&o.quick&&o.quick.pdAsk};});
  ok('STAFFA 6 QS-1 sends the request PD-1 reads with the adult and the issue (STAFF-M12)',qa.out&&qa.out.src==='QS-1'&&qa.out.who==='Ms. Lee'&&qa.out.role==='classroom teacher'&&/quick start \(issue 2\) still does not do a step/.test(qa.out.concern),qa);
  await q.close();
  const e=await open('EB-1');
  const ea=await e.evaluate(()=>{const a=window.__eb2567Ask();const o=window.__nbhFactsOut();return o&&o.brief&&o.brief.pdAsk;});
  ok('STAFFA 7 EB-1 sends the request PD-1 reads',ea&&ea.src==='EB-1'&&/essentials brief/.test(ea.concern),ea);
  await e.close();
  const pd=await open('PD-1');
  const pa=await pd.evaluate(async A=>{window.__nbhFactsIn({quick:{rules:[],tiers:[],pdAsk:A}});await new Promise(r=>setTimeout(r,300));return {concern:S.meta.concern,staff:S.meta.staff,role:S.meta.role,why:S.meta.why};},qa.out);
  ok('STAFFA 8 PD-1 takes QS-1’s request into its empty fields',/quick start \(issue 2\)/.test(pa.concern)&&pa.staff==='Ms. Lee'&&pa.role==='Teacher'&&/Asked from Form QS-1/.test(pa.why),pa);
  await pd.close();
 });

 /* ---------------- STAFFB ---------------- */
 await sec('STAFFB',async()=>{
  const t=await open('TI-1');
  await t.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}window.alert=()=>{};});await L.loadSim(t);await sleep(1200);
  const a=await t.evaluate(async()=>{const tr=()=>document.querySelector('#tiFbTbl tr.ti67-car');const r0=tr();const a={has:!!r0,np:r0?r0.classList.contains('noprint'):null,n:r0?r0.querySelectorAll('input[type=checkbox]').length:0};
    const first=r0.querySelector('input[data-ti67="reason"]');const j=+first.dataset.ti67j;first.click();await new Promise(r=>setTimeout(r,150));
    a.np2=tr().classList.contains('noprint');a.five=document.querySelectorAll('#tiFbTbl input[type=checkbox][data-fbj="'+j+'"]').length;a.count=(document.getElementById('ti67Car'+j)||{}).textContent;a.fb=JSON.stringify(S.obs[j].fb||{});
    const keep=JSON.stringify(S);S=JSON.parse(keep);renderAll();a.kept=!!(S.obs[j].fb&&S.obs[j].fb.reason);S.obs[j].fb.bogus=true;renderAll();a.drop=!S.obs[j].fb.bogus;return a;});
  ok('STAFFB 1 TI-1’s feedback record has the other four of RS-1’s eight steps, off the print until one is ticked (STAFF-H4 hand-off)',a.has&&a.np===true&&a.n>=4&&a.np2===false&&a.five===5&&/of 8 steps/.test(a.count)&&/"reason":true/.test(a.fb),a);
  ok('STAFFB 2 a ticked step is kept when the record is read back (and an unknown key is still dropped)',a.kept&&a.drop,a);
  await t.close();
 });

 /* ---------------- FEED ---------------- */
 await sec('FEED',async()=>{
  const d=await open('DM-1');
  const dm=await d.evaluate(()=>{const g=()=>{const o=window.__nbhFactsOut();return o&&o.profile&&o.profile.health&&o.profile.health.diet;};const a=g()||'';
    const e=document.querySelector('[name="h.diet"]');e.value='Gluten-free (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));return {a,b:g()};});
  ok('FEED 1 DM-1 sends the dietary restrictions with the health record (profile.health.diet)',dm.a===''&&dm.b==='Gluten-free (simulated)',dm);
  await d.close();
  const r=await open('RR-1');
  const rr=await r.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.dx','Autism spectrum disorder (simulated record)');set('m.diet','Skips breakfast per parent (simulated)');
    const o=window.__nbhFactsOut();return o&&o.records&&{dx:o.records.dx,diet:o.records.diet};});
  ok('FEED 2 RR-1 sends the diagnoses and the diet notes with the records (records.dx, records.diet)',rr&&/Autism spectrum disorder/.test(rr.dx)&&/Skips breakfast/.test(rr.diet),rr);
  await r.close();
  const f=await open('FD-1');
  const fd=await f.evaluate(async()=>{window.__nbhFactsIn({profile:{src:'DM-1',health:{diet:'Gluten-free (simulated)'}},records:{dx:'Autism spectrum disorder (simulated record)',diet:'Skips breakfast per parent (simulated)'}});await new Promise(r=>setTimeout(r,300));return {dx:S.meta.dx,diet:S.meta.diet};});
  ok('FEED 3 FD-1 takes both into its empty screen fields',/Autism spectrum disorder/.test(fd.dx)&&/Gluten-free/.test(fd.diet)&&/Skips breakfast/.test(fd.diet),fd);
  await f.close();
 });

 /* ---------------- SAFETY ---------------- */
 await sec('SAFETY',async()=>{
  const c=await open('CR-1');
  await c.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});await L.loadSim(c);await sleep(1500);
  const cr=await c.evaluate(()=>{let f=null;try{f=window.__nbhFactsOut();}catch(e){f={err:String(e)};}return f&&f.crisis&&f.crisis.afterRelease;});
  ok('SAFETY 1 CR-1 sends what the restraints were followed by, and its flag (SAFETY-H1)',cr&&typeof cr.answered==='number'&&cr.answered>=1&&typeof cr.escAtt==='number'&&typeof cr.flag==='boolean',cr);
  await c.close();
  const AR={answered:3,escAtt:3,flag:true};
  const fs=await open('FS-1');
  const f1=await fs.evaluate(async A=>{window.__nbhFactsIn({crisis:{src:'CR-1',afterRelease:A}});await new Promise(r=>setTimeout(r,300));const el=document.getElementById('fs67Cr');const a=el&&!el.hidden?el.textContent:'';
    window.__nbhFactsIn({crisis:{src:'CR-1',afterRelease:{answered:3,escAtt:1,flag:false}}});return {a,cls:el?el.className:'',off:el.hidden};},AR);
  ok('SAFETY 2 FS-1 shows CR-1’s review line beside the convergence of sources, on screen only',/often followed by escape from the task or by adult attention \(3 of the 3 restraints/.test(f1.a)&&/noprint/.test(f1.cls)&&f1.off,f1);
  await fs.close();
  const td=await open('TD-1');
  const PP={shared:'yes',signed:'2026-10-02',parts:[{desc:'Teaching the break card',type:'reinforcement',dec:'yes'},{desc:'Escape extinction: the demand stays',type:'extinction',dec:'yes'},{desc:'Response blocking',type:'restrictive',dec:'no'},{desc:'A lean baseline',type:'option',dec:''}]};
  const t1=await td.evaluate(async([A,P])=>{window.__nbhFactsIn({crisis:{src:'CR-1',afterRelease:A},consent:{planProcs:P}});await new Promise(r=>setTimeout(r,300));const el=document.getElementById('td67Safe');const a=el&&!el.hidden?el.textContent:'';
    const txt=window.__bipText(),k=txt.indexOf('CONSENT TO THE PLAN’S PROCEDURES (FORM IC-1)');window.__nbhFactsIn({});await new Promise(r=>setTimeout(r,200));
    return {a,bip:k>=0?txt.slice(k,k+700):'',none:document.getElementById('td67Safe').hidden&&window.__bipText().indexOf('CONSENT TO THE PLAN’S PROCEDURES')<0};},[AR,PP]);
  ok('SAFETY 3 TD-1 shows CR-1’s flag under the response to the behavior (SAFETY-H1)',/Form CR-1: restraint in this record is often followed by escape/.test(t1.a)&&/check the function on Form FS-1/.test(t1.a),t1);
  ok('SAFETY 4 TD-1 shows IC-1’s decision on each part that needs its own, and the BIP carries them (CARE-H7)',/EXTINCTION: Escape extinction: the demand stays: Yes/.test(t1.a)&&/RESTRICTIVE: Response blocking: No: not run/.test(t1.a)&&/OPTION: Reinforces problem behavior on purpose: A lean baseline: not decided yet: not run until it is/.test(t1.a)&&/SIGNED 10\/2\/2026/.test(t1.bip)&&/Teaching, rewards and prevention: Yes/.test(t1.bip),t1);
  ok('SAFETY 5 without CR-1’s flag or IC-1’s sheet nothing is added',t1.none,t1);
  await td.close();
  const ct=await open('CT-1');
  const c1=await ct.evaluate(async P=>{S.meta.where='Telehealth';const parts=P.parts.concat([{desc:'Escape extinction at meals: the bite stays at the lips',type:'restrictive',dec:'yes'}]);
    window.__nbhFactsIn({consent:{planProcs:Object.assign({},P,{parts}),home:{data:true,train:false,video:true,videoDec:'',photos:false}},home:{integrity:[{date:'2026-10-01',pct:90}],integrityChecked:false,integrityNote:'family report, not yet checked'}});
    await new Promise(r=>setTimeout(r,400));const h=document.getElementById('ct67Home');const rec=document.getElementById('ctHomeRec');
    const a={ext:S.meta.extCons,meal:S.meta.meal_eeCons,home:h?h.textContent:'',rec:rec?rec.textContent:''};
    S.meta.extCons='Typed by hand';window.__nbhFactsIn({consent:{planProcs:P}});a.kept=S.meta.extCons;return a;},PP);
  ok('SAFETY 6 CT-1 takes IC-1’s Yes for the extinction step and for escape extinction at meals while blank; a hand answer stays (CARE-H7)',/the extinction step, Yes, signed 10\/2\/2026/.test(c1.ext)&&/escape extinction at meals, Yes/.test(c1.meal)&&c1.kept==='Typed by hand',c1);
  ok('SAFETY 7 CT-1 shows IC-1’s home procedures, with the telehealth caution (CARE-M10)',/caregiver training at home or by video call is not ticked; video or photos at home: not decided\. Training here is by telehealth/.test(c1.home),c1.home);
  ok('SAFETY 8 CT-1 reads HD-1’s checklist as "family report, not yet checked" (CARE-M7)',/family report, not yet checked/.test(c1.rec),c1.rec);
  await ct.close();
 });

 /* ---------------- ASSESS / EA-VI (IN-1 to EA-1; EA-1's tier to FS-1) ---------------- */
 await sec('ASSESS',async()=>{
  const e=await open('EA-1');
  const IN1={form:'IN-1',method:'Stakeholder interviews (indirect)',fn:'Attention',fnKey:'attention',strength:'Weak',statement:'Interview hypothesis.',use:'candidates',candidates:['attention','escape','physical']};
  const IA1={form:'IA-1',method:'Indirect',fn:'Escape',fnKey:'escape',strength:'Moderate',statement:'Escape leads.'};
  const a=await e.evaluate(async([IN1,IA1])=>{window.__nbhFactsIn({evidence:{'IN-1':IN1,'IA-1':IA1}});await new Promise(r=>setTimeout(r,400));
    const g=n=>{const x=document.querySelector('[name="'+n+'"]');return x?x.value:'';};const el=document.getElementById('ea67In1');
    return {hyp:g('m.hyp'),vhyp:g('v.hyp'),note:el&&!el.hidden?el.textContent:'',cls:el?el.className:''};},[IN1,IA1]);
  ok('ASSESS 1 EA-1 carries IN-1 in as candidate conditions to include, not as the function',/IN-1: candidate conditions to include: attention, escape from demands, pain or a medical cause \(medical review first\) \(interviews; not the function\)/.test(a.hyp)&&/IA-1: Escape \(moderate\)/.test(a.hyp),a);
  ok('ASSESS 2 the candidates do not make the prior hypothesis conflicting (IA-1’s escape stands)',a.vhyp==='escape',a);
  ok('ASSESS 3 a candidate with no condition in the analysis is named, with the rule and the medical line (screen only)',/conditions to include/.test(a.note)&&/Do not drop a condition because no interview named it/.test(a.note)&&/medical review comes first/.test(a.note)&&/noprint/.test(a.cls),a);
  const b=await e.evaluate(async()=>{const n=[...document.querySelectorAll('[name^="c["][name$="].name"]')].map(x=>x.value);return {n,note:document.getElementById('ea67In1').textContent};});
  ok('ASSESS 4 the note follows the analysis’s conditions',(b.n.some(v=>/attention/i.test(v))&&b.n.some(v=>/demand|escape/i.test(v)))?!/no condition yet/.test(b.note):/no condition yet for/.test(b.note),b);
  await e.close();
  const f=await open('FS-1');
  const r=await f.evaluate(async()=>{const EV={form:'EA-1',method:'Functional analysis (antecedent, multielement)',design:'multielement',dates:'10/1/2026',n:9,fn:'Escape',fnKey:'escape',strength:'Moderate',decided:true,by:'BCBA (simulated)',
      tier:2,tierWhy:'Antecedent-only analysis: no consequence was tested, so the result is a Tier 2 hypothesis',statement:'Demands evoked the behavior.'};
    window.__nbhFactsIn({evidence:{'EA-1':EV}});await new Promise(r=>setTimeout(r,400));const row=S.src.find(x=>x.form==='EA-1');
    const EV1=Object.assign({},EV);delete EV1.tier;delete EV1.tierWhy;S=blank();ensure();window.__nbhFactsIn({evidence:{'EA-1':EV1}});await new Promise(r=>setTimeout(r,300));const row1=S.src.find(x=>x.form==='EA-1');
    return {m:row&&row.method,t:row&&tierOf(row.method),c:row&&row.contrib,m1:row1&&row1.method,t1:row1&&tierOf(row1.method)};});
  ok('ASSESS 5 FS-1 reads EA-1’s tier: an antecedent-only analysis is a Tier 2 row, with the reason (EA-VI-M7)',r.t===2&&/antecedent-only/.test(r.m)&&/Tier 2 hypothesis/.test(r.c),r);
  ok('ASSESS 6 an analysis without a tier is Tier 1 as before',r.t1===1&&r.m1==='Functional analysis, analogue conditions',r);
  await f.close();
 });

 /* ---------------- READINGS ---------------- */
 await sec('READINGS',async()=>{
  const src=L.fs.readFileSync(L.path.join(L.ROOT,'NBH-Workstation','nbh-readings.js'),'utf8');const R=new Function(src+';return NBH_READINGS;')();
  const want=['briggs2019','carr2001','drifke2020','fisher2023','goh2000','greer2024','hagopian2004','hoch2002','jones2025','kuhn2010','lalli1997','laureano2024','mace1994','marcus1996','muething2024b','phillips2017','pizarro2021','rooker2013','saini2017','shamlian2016','slocum2015','strohmeier2024','vancamp2000','wallace2012','weber2024',
    'marshall2025','kastner2025','goldman2025','leon2016','seaver2014','carroll2015','carroll2018','cariveau2019','green2005','ditzian2015',
    'jones2022','mitteer2022','saini2018','sleiman2023','graff2012','moore2007','halbur2020','zhu2021','paden2025','putnam2003','lang2009',
    'borrero2010','munk1994','piazza2003a','saini2019','scott2024','seubert2014','vanarsdale2025','volkert2010','ghaemmaghami2016'];
  const by=Object.fromEntries(R.map(r=>[r.k,r])),miss=want.filter(k=>!by[k]),ks=R.map(r=>r.k);
  ok('READ 1 the readings list carries every source the batch-2 parcels named for it',!miss.length,miss);
  ok('READ 2 each new entry has its APA reference, the year, a DOI and a summary; the list stays in key order with no key twice',want.every(k=>by[k]&&/\(\d{4}[a-z]?\)\. .+\d+[–-]\d+\.$/.test(by[k].apa)&&by[k].y===+k.replace(/\D/g,'').slice(0,4)&&/^10\.\d+\//.test(by[k].doi)&&by[k].sum.length>100)&&ks.join()===ks.slice().sort().join()&&new Set(ks).size===ks.length,want.filter(k=>by[k]&&!(/\d+[–-]\d+\.$/.test(by[k].apa)&&by[k].doi)));
 });

 ok('no page errors',errs.length===0,errs);
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
