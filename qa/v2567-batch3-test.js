/* v25.67 batch 3: the other forms' parts of the approved batch-2 recommendations (the BCBA, 11/6), one check or more for each item
   built. Simulated data only; no participant or student names.
   SR     FCT-SR-H4  PR-1 steps on SR-1's second row (the share of requests in S+): hold below it, ask for it when missing
          FCT-SR-H2/H5  SR-1's family version for the two new designs (no extinction; a wait that ends on what the student does)
          FCT-SR-H5  TD-1's FCT card takes DT-1's tolerance response and activity into its two wait fields
   usage: WS_URL=http://127.0.0.1:8630 WS_ROOT=. node qa/v2567-batch3-test.js [section...] */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FILE=id=>L.forms().find(x=>x.id===id).file;
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
(async()=>{const br=await L.chromium.launch();const errs=[];
 const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
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
  const q=await open('QS-1');
  const qq=await q.evaluate(()=>typeof adReward==='function'?[adReward({key:'tok',work:'math problem',reinforcer:'the tablet',req:5,window:2}),adReward({key:'tok',work:'math problem',reinforcer:'the tablet',req:5})]:null);
  ok('DELAY 8 QS-1’s staff line gives AD-1’s delivery window for tokens; without one it reads as before',qq&&/give each token within 2 s of the math problem\./.test(qq[0])&&!/within/.test(qq[1]),qq);
  await q.close();
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

 ok('no page errors',errs.length===0,errs);
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
