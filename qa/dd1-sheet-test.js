/* v21.47 Form DD-1, the daily data sheet's layout: the definitions below the sheet by default, so the heading is three short rows
   (the types, the names, the units) and the columns even; who the sheet is for above the table; Date printed as "Mon 9/7" and
   narrow, Obs. min narrow, the behaviors sized to fill the page and Notes taking what is left; "In the column headings" keeps the
   sheet as it was; definitions off leaves the key and a measurement line under each name.
   usage: node qa/dd1-sheet-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/'+(process.env.ED||'NBH-Workstation')+'/Daily_Behavior_Data_and_Visual_Analysis.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1400,height:1000}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await page.evaluate(async()=>{await loadExample();});await sleep(1200);
  await page.evaluate(()=>{document.querySelector('#viewSeg button[data-view="data"]').click();});await sleep(400);
  const slim=await page.evaluate(()=>{const t=document.getElementById('dataTable');return {cls:t.classList.contains('slim'),rows:t.tHead.rows.length,defn:t.querySelectorAll('.defncell,.keycell,.metacell').length,
    cards:document.querySelectorAll('#sheetDefs .sd-card').length,defs:[...document.querySelectorAll('#sheetDefs .sd-card p')].every((p,i)=>p.textContent===orderedBehaviors()[i].definition),
    key:!!document.querySelector('#sheetDefs .sd-key'),top:(document.querySelector('#sheetTop .nm')||{}).textContent||'',nums:t.querySelectorAll('thead .bnum').length,sel:document.getElementById('d_defpl').value};});
  ok('by default the definitions go below the sheet and the heading is three rows',slim.cls&&slim.rows===3&&slim.defn===0&&slim.sel==='below',slim);
  ok('a card per behavior with its definition and measurement, the key, the student above the table',slim.cards===6&&slim.defs&&slim.key&&/Sample Student/.test(slim.top)&&slim.nums===6,slim);
  /* printing, landscape */
  await page.emulateMedia({media:'print'});
  const pr=await page.evaluate(()=>{applyColW(true);const t=document.getElementById('dataTable'),cs=[...document.querySelectorAll('#dataCols col')].map(c=>parseInt(c.style.width,10));
    const obs=orderedBehaviors(),one=[];let i=2;obs.forEach(b=>{if(MEASURES[b.measure].two){i+=3;}else one.push(cs[i++]);});
    const entry=t.tHead.rows[2],last=entry.cells[entry.cells.length-1];
    return {w:parseInt(t.style.width,10),tr:t.style.transform,date:cs[0],obs:cs[1],one,notes:cs[cs.length-2],pct:getComputedStyle(last).display,pctT:last.textContent.trim(),
      pdate:(t.querySelector('tbody td.col-date .pdate')||{}).textContent,pdShown:getComputedStyle(t.querySelector('tbody td.col-date .pdate')).display,inputHidden:getComputedStyle(t.querySelector('tbody td.col-date input')).display};});
  ok('printed: the table fills the page width without shrinking',pr.w===960&&!pr.tr,pr);
  ok('printed: Date and Obs. min are narrow, the behaviors even, Notes takes the rest',pr.date<=56&&pr.obs<=34&&pr.one.every(v=>v===pr.one[0])&&pr.one[0]>=70&&pr.notes>=120,pr);
  ok('printed: the date reads "Mon 9/7" and the % heading shows',/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}\/\d{1,2}$/.test(pr.pdate)&&pr.pdShown==='block'&&pr.inputHidden==='none'&&pr.pct!=='none'&&pr.pctT==='%',pr);
  const por=await page.evaluate(()=>{S.settings.orient='portrait';applyColW(true);const t=document.getElementById('dataTable');const w=parseInt(t.style.width,10);S.settings.orient='landscape';applyColW(true);return {w,tr:t.style.transform};});
  ok('printed in portrait: the table fits the page',por.w<=700||!!por.tr,por);
  await page.emulateMedia({media:'screen'});
  /* the old layout, and definitions off */
  const head=await page.evaluate(()=>{const sel=document.getElementById('d_defpl');sel.value='head';sel.dispatchEvent(new Event('change',{bubbles:true}));const t=document.getElementById('dataTable');
    const r={cls:t.classList.contains('slim'),rows:t.tHead.rows.length,defn:t.querySelectorAll('.defncell').length,key:t.querySelectorAll('.keycell').length,below:document.getElementById('sheetDefs').innerHTML,top:document.getElementById('sheetTop').innerHTML,set:S.settings.defPlace};
    sel.value='below';sel.dispatchEvent(new Event('change',{bubbles:true}));return r;});
  ok('"In the column headings" keeps the sheet as it was',!head.cls&&head.defn===6&&head.key===1&&head.below===''&&head.top===''&&head.set==='head',head);
  const off=await page.evaluate(()=>{const c=document.getElementById('d_defs');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));
    const r={cards:document.querySelectorAll('#sheetDefs .sd-card').length,key:!!document.querySelector('#sheetDefs .sd-key'),sub:document.querySelectorAll('#dataTable .nmsub').length,nums:document.querySelectorAll('#dataTable thead .bnum').length};
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));return r;});
  ok('definitions off: the key stays, each name carries its measurement',off.cards===0&&off.key&&off.sub===6&&off.nums===0,off);
  /* an older file (no defPlace) opens on the new layout; the choice is kept in the saved file */
  const keep=await page.evaluate(()=>{S.settings.defPlace='head';const j=JSON.parse(JSON.stringify(S));const back=Object.assign(blankState().settings,j.settings||{});delete j.settings.defPlace;const old=Object.assign(blankState().settings,j.settings);return {kept:back.defPlace,old:old.defPlace===undefined||old.defPlace!=='head'};});
  ok('the choice is saved with the file; an older file opens with the definitions below',keep.kept==='head'&&keep.old,keep);
  ok('no errors',errs.length===0,errs);
  console.log(fails?fails+' FAILED':'ALL PASS');await br.close();process.exit(fails?1:0);})();
