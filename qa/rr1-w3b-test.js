/* Form RR-1, review Wave 3 part 2: the synthesis leaves the form (F24): the interventions reach Form FS-1's records paragraph, the
   records-based hypothesis becomes FS-1's records-review evidence row, the target labels become Form TB-1 candidates, the questions
   appear on Form IA-1; Form DM-1's program facts fill RR-1's IEP sheet where it is empty (F25). Simulated data only.
   usage: node qa/rr1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const rr=await open(file('RR-1_'));
  await rr.evaluate(()=>{document.getElementById('simScenario').value='escape';document.getElementById('simBtn').click();});await sleep(900);
  const R=await rr.evaluate(()=>window.__nbhFactsOut().records);
  ok('1 F24 RR-1 sends its interventions, the hypothesis for each target, the questions and the review\'s dates',
    R.interventions&&R.interventions.length===4&&R.interventions[0].name==='Break card (BIP)'&&R.interventions[3].integrity==='Yes'
    &&R.hypotheses&&R.hypotheses.length===2&&R.hypotheses[0].label==='Aggression (hitting, pushing)'&&JSON.stringify(R.hypotheses[0].functions)==='["esc"]'
    &&R.questions&&R.questions.length===4&&/^Does hitting end the math task/.test(R.questions[0])&&R.reviewed&&/^\d{4}-\d\d-\d\d$/.test(R.reviewed.to),R);
  /* ---- FS-1 ---- */
  const fsp=await open(file('FS-1_'));
  const F=await fsp.evaluate(R=>{S.meta.bgRecords='';renderAll();window.__nbhFactsIn({records:R});return {bg:S.meta.bgRecords,src:S.src.filter(r=>r.form==='RR-1')};},R);
  ok('2 F24 Form FS-1\'s records paragraph names each intervention with its function, outcome and integrity',
    F.bg.includes('Earlier interventions (Form RR-1): Break card (BIP) (function: escape / avoidance; outcome unknown, no data; no integrity data); Token board for work completion (ineffective on data; no integrity data); Office time-out after aggression (not function-based; ineffective on data; no integrity data); Reduced work (half sheet) (function: escape / avoidance; partly effective; integrity measured).'),F.bg);
  const r0=F.src[0]||{};
  ok('3 F24 the records review becomes FS-1\'s evidence row: its method, its dates, the function both targets share, the strength left to you',
    F.src.length===1&&r0.method==='Indirect: records review'&&/^\d{1,2}\/\d{1,2}\/\d{4} – \d{1,2}\/\d{1,2}\/\d{4}$/.test(r0.dates)&&/^Escape/.test(r0.fn)&&r0.str===''
    &&/Aggression \(hitting, pushing\): escape \/ avoidance, agreement high\. When presented with math tasks/.test(r0.contrib)&&/Elopement from classroom: escape \/ avoidance, agreement low\./.test(r0.contrib),F.src);
  const again=await fsp.evaluate(R=>{window.__nbhFactsIn({records:R});return S.src.filter(r=>r.form==='RR-1').length;},R);
  ok('4 F24 applied again, the row is not added twice',again===1,again);
  /* ---- TB-1 ---- */
  const tb=await open(file('TB-1_'));
  const cand=()=>tb.evaluate(()=>[...document.querySelectorAll('[name^="cand["][name$="].beh"]')].map(e=>({b:e.value,by:document.querySelector('[name="'+e.name.replace('.beh','.by')+'"]').value})).filter(x=>x.b));
  await tb.evaluate(R=>window.__nbhFactsIn({records:R}),R);const c1=await cand();
  await tb.evaluate(R=>window.__nbhFactsIn({records:R}),R);const c2=await cand();
  ok('5 F24 the targets RR-1 names become Form TB-1 candidates once each, reported by the records review',
    c1.length===2&&c1[0].b==='Aggression (hitting, pushing)'&&c1.every(x=>x.by==='the records review (Form RR-1)')&&c2.length===2,{c1,c2});
  /* ---- IA-1 ---- */
  const ia=await open(file('IA-1_'));
  const q=await ia.evaluate(R=>{const b=document.getElementById('iaRrq'),h0=b.hidden;window.__nbhFactsIn({records:R});const r={h0,h1:b.hidden,li:[...b.querySelectorAll('li')].map(x=>x.textContent),store:document.querySelector('[name="m.rrq"]').value};
    window.__nbhFactsIn({records:{questions:['Who is in the room at 9:00? (simulated)']}});r.li2=[...b.querySelectorAll('li')].map(x=>x.textContent);
    window.__nbhFactsIn({});r.li3=[...b.querySelectorAll('li')].map(x=>x.textContent);return r;},R);
  ok('6 F24 the questions from the records review appear on Form IA-1\'s Setup sheet and are kept with the file; the case\'s list replaces them',
    q.h0===true&&q.h1===false&&q.li.length===4&&/^Does hitting end the math task/.test(q.li[0])&&q.store.split('\n').length===4&&JSON.stringify(q.li2)==='["Who is in the room at 9:00? (simulated)"]'&&q.li3.length===1,q);
  /* ---- F25 ---- */
  const dm=await open(file('DM-1_'));
  const P=await dm.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');if(e.tagName==='SELECT'&&v==null)v=e.options[2].text;e.value=e.tagName==='SELECT'?[...e.options].find(o=>o.text===v).value:v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));return v;};
    const elig=s('p.elig'),place=s('p.place');s('p.ratio','1:3 + 1:1 para (simulated)');s('p.bipstat','BIP current');s('p.bipdate','2026-05-12');s('p.eligdate','2023-03-01');
    const o=window.__nbhFactsOut();return {elig,place,prog:o&&o.profile&&o.profile.program};});
  ok('7 F25 Form DM-1 sends its program facts',P.prog&&P.prog.elig===P.elig&&P.prog.placement===P.place&&P.prog.ratio==='1:3 + 1:1 para (simulated)'&&P.prog.bipStatus==='BIP current'&&P.prog.bipDate==='2026-05-12'&&P.prog.eligDate==='2023-03-01',P);
  const rr2=await open(file('RR-1_'));
  const I=await rr2.evaluate(P=>{const g=k=>{const e=document.querySelector('[name="'+k+'"]');return e.tagName==='SELECT'?(e.options[e.selectedIndex]||{}).text:e.value;};
    const e=document.querySelector('[name="i.ratio"]');e.value='typed on RR-1 (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));
    const r=window.__nbhFactsIn({profile:{src:'DM-1',program:P.prog}});return {r,elig:g('i.elig'),place:g('i.place'),ratio:g('i.ratio'),bs:g('i.bipstat'),bd:g('i.bipdate'),ed:g('i.eligdate')};},P);
  ok('8 F25 RR-1\'s empty IEP fields take DM-1\'s program facts (the BIP status in RR-1\'s words); a field already typed is kept',
    I.elig===P.elig&&I.place===P.place&&I.ratio==='typed on RR-1 (simulated)'&&I.bs==='BIP on file, current'&&I.bd==='2026-05-12'&&I.ed==='2023-03-01'&&/program from the case/.test(I.r.note||''),I);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
