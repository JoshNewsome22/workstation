/* v22.33 Form DD-1's printed sheet: the phase change and the condition are one column on paper ("Phase change /
   condition", the kind of change written small above the condition's name, kept current at print time), the Date column
   wide enough for "10/19", and on screen the two columns stay apart. iPad-like (touch). Simulated data only.
   usage: node qa/v2233-dd1-phase-print-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1200);
  await p.evaluate(()=>{S=blankState();S.meta.client='Mateo Rivera';S.settings.orient='portrait';
    const mk=(n,m,k)=>({id:uid('b'),kind:k||'target',name:n,definition:n+' (simulated).',obsLength:'Entire school day',measure:m,direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Aggression','count'),mk('Elopement','count'),mk('Requesting a break','trials','acquisition')];S.rows=[];const d=new Date(2026,9,19);
    for(let i=0;i<5;i++){S.rows.push(newRow(localISO(d)));d.setDate(d.getDate()+1);}S.rows[2].phaseType='full';S.rows[2].phaseLabel='Intervention';renderAll();
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));});
  const scr=await p.evaluate(()=>{const t=document.getElementById('dataTable'),th=t.querySelector('thead th.col-phase'),sp=t.querySelector('tbody td.col-label .dd-pph');
    return {phase:getComputedStyle(th).display,pph:getComputedStyle(sp).display,lab:t.querySelector('thead th.col-label').innerText.trim()};});
  ok('1 on screen: Phase change and Condition name are two columns as before',scr.phase==='table-cell'&&scr.pph==='none'&&/Condition name or event/.test(scr.lab),scr);
  /* a change picked after the sheet was drawn is on paper too */
  await p.evaluate(()=>{S.rows[4].phaseType='conditional';S.rows[4].phaseLabel='Medication change';});
  await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(400);
  const pr=await p.evaluate(()=>{const t=document.getElementById('dataTable'),rows=[...t.tBodies[0].rows].filter(r=>r.dataset.r);
    const lab=r=>{const td=r.querySelector('td.col-label'),sp=td.querySelector('.dd-pph');return {k:sp.textContent,shown:getComputedStyle(sp).display,w:Math.round(td.getBoundingClientRect().width)};};
    const date=t.querySelector('tbody td.col-date'),pd=date.querySelector('.pdate');
    return {phaseTh:getComputedStyle(t.querySelector('thead th.col-phase')).display,phaseTd:getComputedStyle(rows[0].querySelector('td.col-phase')).display,
      head:t.querySelector('thead th.col-label').innerText.replace(/\s+/g,' ').trim(),r2:lab(rows[2]),r4:lab(rows[4]),r0:lab(rows[0]),
      dateFits:pd.scrollWidth<=date.clientWidth+1,dateW:Math.round(date.getBoundingClientRect().width),tableW:Math.round(t.getBoundingClientRect().width)};});
  ok('2 on paper: the phase column steps aside; one column headed "Phase change / condition"',pr.phaseTh==='none'&&pr.phaseTd==='none'&&pr.head==='Phase change / condition',pr);
  ok('3 its cell: the kind of change small above the name (full, and a conditional one picked after the sheet was drawn); nothing on a day without one',
    pr.r2.k==='Full phase change'&&pr.r2.shown==='block'&&pr.r4.k==='Conditional change'&&pr.r0.k===''&&pr.r0.shown==='none',pr);
  ok('4 the Date column holds its date ("10/19") without cutting it, at about 7% of the sheet',pr.dateFits&&pr.dateW>=pr.tableW*0.06,pr);
  await p.emulateMedia({media:'screen'});
  ok('5 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
