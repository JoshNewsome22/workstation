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

 ok('no page errors',errs.length===0,errs);
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
