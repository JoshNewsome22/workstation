/* Form SP-1: every sheet takes its behavior's definition from the case (v23.40, the BCBA's report: behaviors 2 and 3 had
   names and no definition). A sheet named after a case behavior (typed, or picked from the Target behavior box's list) takes
   its definition, examples and non-examples into the empty fields; a named sheet opened later fills too; From the case puts
   every ticked behavior on a sheet of its own; nothing written on a sheet is replaced. Simulated data only.
   usage: node qa/sp1-case-defs-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const B=(label,w)=>({label,def:'Definition of '+w+' (simulated).',ex:'Example of '+w+' (simulated).',nex:'Non-example of '+w+' (simulated).',type:'Single topography',dim:'Count / frequency'});
const F={behaviors:[B('Hitting (simulated)','hitting'),B('Kicking (simulated)','kicking'),B('Spitting (simulated)','spitting'),B('Biting (simulated)','biting'),
  Object.assign(B('Asking for a break (simulated)','asking'),{isRep:true,type:'Replacement behavior'})]};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1000);
    await p.evaluate(()=>{nbhUI.toast=t=>{(window.__t=window.__t||[]).push(t);};nbhUI.confirm=async()=>true;});return p;};
  const sheets=p=>p.evaluate(()=>{commitBeh();return state.behaviors.map(b=>({n:b.meta.behavior||'',d:b.meta.definition||'',e:b.meta.example||'',x:b.meta.nonexample||''}));});
  const p=await open();
  /* the BCBA's sheet 1, named and marked by hand before the case came */
  await p.fill('#mBehavior','Hitting (simulated)');await p.evaluate(()=>{const c=document.querySelector('.grid td button, td[data-c] button, [data-cell]');if(c)c.click();else{state.cells['0_0']={s:1};commitBeh();}});
  await p.evaluate(f=>nbhCase.apply(f),F);await sleep(300);
  const dl=await p.evaluate(()=>{const i=document.getElementById('mBehavior'),d=document.getElementById(i.getAttribute('list')||'x');return d?[...d.options].map(o=>o.value):null;});
  ok('1 the Target behavior box lists the case’s target behaviors, as From the case does (the replacement behavior too)',JSON.stringify(dl)==='["Hitting (simulated)","Kicking (simulated)","Spitting (simulated)","Biting (simulated)","Asking for a break (simulated)"]',dl);
  /* the report: a sheet added and named by hand */
  await p.click('#addBeh');await sleep(150);await p.fill('#mBehavior','Kicking (simulated)');await p.press('#mBehavior','Tab');await sleep(200);
  let s=await sheets(p);const dv=await p.evaluate(()=>document.querySelector('[data-meta="definition"]').value);
  ok('2 a sheet added and named after a case behavior takes its definition, examples and non-examples at once',s.length===2&&s[1].n==='Kicking (simulated)'&&s[1].d==='Definition of kicking (simulated).'&&s[1].e==='Example of kicking (simulated).'&&s[1].x==='Non-example of kicking (simulated).'&&dv==='Definition of kicking (simulated).',s);
  await p.click('#addBeh');await sleep(150);await p.fill('#mBehavior','Throwing (simulated)');await p.press('#mBehavior','Tab');await sleep(200);s=await sheets(p);
  ok('3 a name the case does not have fills nothing',s.length===3&&s[2].n==='Throwing (simulated)'&&!s[2].d&&!s[2].e&&!s[2].x,s[2]);
  /* a record made before: sheets named, their definitions empty; one written by hand */
  await p.evaluate(()=>{commitBeh();state.behaviors.push({meta:{behavior:'Spitting (simulated)',definition:'My own words (simulated).'},cells:{}},{meta:{behavior:'Biting (simulated)'},cells:{}});renderBehBar();});
  await p.click('#behSeg button[data-b="3"]');await sleep(200);await p.click('#behSeg button[data-b="4"]');await sleep(200);s=await sheets(p);
  ok('4 a named sheet opened later fills its empty fields; a definition written by hand stays',s[3].d==='My own words (simulated).'&&s[3].e==='Example of spitting (simulated).'&&s[4].d==='Definition of biting (simulated).'&&s[4].x==='Non-example of biting (simulated).',s.slice(3));
  ok('5 sheet 1, named by hand and marked before the case came, took its definition from the case',s[0].n==='Hitting (simulated)'&&s[0].d==='Definition of hitting (simulated).',s[0]);
  /* From the case: several ticked */
  const q=await open();await q.evaluate(f=>{state.cells['0_0']={s:1};commitBeh();nbhCase.apply(f);},F);await sleep(300);
  /* a marked sheet stops the form making sheets by itself; a fresh blank sheet beside it */
  const pre=await sheets(q);
  await q.evaluate(()=>{nbhCase.open();});await sleep(200);
  const note=await q.evaluate(()=>document.getElementById('nbhcNote').textContent);
  await q.evaluate(()=>{document.querySelectorAll('#nbhcBody input[data-kind="beh"]').forEach((c,i)=>{c.checked=i<3;});document.getElementById('nbhcUse').click();});await sleep(300);
  const done=await q.evaluate(()=>document.getElementById('nbhcDone').textContent);s=await sheets(q);
  ok('6 From the case puts every ticked behavior on a sheet of its own, each with its definition',note==='The ticked items go into this form’s own rows and fields.'&&s.length===3&&s.map(x=>x.n).join('|')==='Hitting (simulated)|Kicking (simulated)|Spitting (simulated)'
    &&s.every(x=>/^Definition of/.test(x.d))&&/Each ticked behavior is on a sheet of its own \(2 added\)/.test(done),{pre,s,done,note});
  await q.evaluate(()=>{document.getElementById('nbhcUse').click();});await sleep(200);const again=await sheets(q);
  ok('7 ticking them again adds no sheet and changes nothing',again.length===3&&JSON.stringify(again)===JSON.stringify(s),again.length);
  ok('8 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
