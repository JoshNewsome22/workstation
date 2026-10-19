/* Form DD-1, review Wave 3 part 2: the effect-size tiles on paper only when asked, with a plain sentence in the summary
   (I53); the week summary over the last four weeks, and the four weeks in the case (I55). Simulated data only.
   usage: node qa/dd1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const DD='Daily_Behavior_Data_and_Visual_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+DD);await sleep(1200);
  await p.evaluate(async()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;await loadExample();
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderResults();});await sleep(600);

  /* ---- I53 ---- */
  const a=await p.evaluate(()=>{const t=[...document.querySelectorAll('.metric.es-tile')];return {n:t.length,noprint:t.filter(x=>x.classList.contains('es-noprint')).length,box:!!document.getElementById('c_es'),checked:document.getElementById('c_es').checked,
    nar:[...document.querySelectorAll('.narrative')].map(x=>x.textContent.replace(/\s+/g,' ')).find(x=>/the value was (below the lowest|above the highest)/.test(x))||''};});
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const t=document.querySelector('.metric.es-tile'),o=[...document.querySelectorAll('.metric')].find(x=>!x.classList.contains('es-tile'));return {es:t?getComputedStyle(t).display:'',other:o?getComputedStyle(o).display:''};});
  await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>{const c=document.getElementById('c_es');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  await p.emulateMedia({media:'print'});
  const pr2=await p.evaluate(()=>{const t=document.querySelector('.metric.es-tile');return {es:t?getComputedStyle(t).display:'',left:document.querySelectorAll('.metric.es-noprint').length,saved:S.settings.esPrint};});
  await p.emulateMedia({media:'screen'});
  ok('1 I53 PND, PEM, Tau and NAP are on screen but off paper by default; the other tiles print',a.n>0&&a.n%4===0&&a.noprint===a.n&&a.box&&a.checked===false&&pr.es==='none'&&pr.other!=='none',{a,pr});
  ok('2 I53 the summary says it in plain words ("On k of n … days the value was below the lowest … day")',/On \d+ of \d+ .+ days? the value was (below the lowest|above the highest) .+ day\./.test(a.nar),a.nar.slice(0,600));
  ok('3 I53 "Effect sizes on paper" puts them on paper, and is kept with the record',pr2.es!=='none'&&pr2.left===0&&pr2.saved===true,pr2);

  /* ---- I55 ---- */
  const w=await p.evaluate(()=>{document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));ddWeekOn();
    const head=[...document.querySelectorAll('#ddWeekWrap .wk-tab th')].map(t=>t.textContent).join('|'),cells=[...document.querySelectorAll('#ddWeekWrap .wk-tab td.wk-four')].map(t=>t.textContent);
    const mon=ddWeek,b=orderedBehaviors()[0],four=ddFour(b,mon,sortedRows());ddWeekOff(true);const f=window.__nbhFactsOut&&window.__nbhFactsOut();const r0=f&&f.data&&f.data.week&&f.data.week.rows[0];
    const exp=[3,2,1,0].map(k=>{const m=ddAddDays(mon,-7*k),e=ddAddDays(m,6),s=ddStat(b,sortedRows().filter(r=>r.date>=m&&r.date<=e));return s?Math.round(s.mean*100)/100:null;});
    return {head,cells,four,exp,weeks:r0&&r0.weeks,txt:r0&&r0.weeksTxt};});
  ok('4 I55 the week summary gives each behavior\'s last four weekly means, oldest first, ending with this week',/Four weeks/.test(w.head)&&w.cells.length>0&&w.cells[0].split(' · ').length===4&&JSON.stringify(w.four.map(x=>x===null?null:Math.round(x*100)/100))===JSON.stringify(w.exp),w);
  ok('5 I55 the case carries the four weeks for CN-1 and PR-1 to quote',Array.isArray(w.weeks)&&w.weeks.length===4&&JSON.stringify(w.weeks)===JSON.stringify(w.exp)&&w.txt===w.cells[0],w);
  /* ---- F104 a second observer ---- */
  const io=await p.evaluate(async()=>{const R=sortedRows(),b=orderedBehaviors().find(x=>ddIoaOk(x)&&R.some(r=>num(r.values[b0id(x)])!==null));function b0id(x){return x.id;}
    const days=R.filter(r=>num(r.values[b.id])!==null);const r=days[0];ddTagOpen(r.id);const d=document.getElementById('dlgDayTags');const inp=d.querySelector(`[data-ioa="${CSS.escape(b.id)}"]`);
    const v1=num(r.values[b.id]),v2=v1+1;inp.value=String(v2);inp.dispatchEvent(new Event('input',{bubbles:true}));const live=inp.parentNode.querySelector('.dt-ioa-p').textContent;d.querySelector('#dtDone').click();await new Promise(z=>setTimeout(z,200));
    document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='results'));renderResults();
    const line=[...document.querySelectorAll('.dd-ioa')].map(x=>x.textContent.replace(/\s+/g,' ')).find(x=>/Interobserver agreement \(a second observer/.test(x))||'';
    const f=window.__nbhFactsOut(),fb=f.data.behaviors.find(x=>x.name===b.name);
    return {v1,v2,live,exp:Math.round(10000*Math.min(v1,v2)/Math.max(v1,v2))/100,line,ioa:fb&&fb.ioa,btn:document.querySelector(`[data-daytags="${CSS.escape(r.id)}"]`)?document.querySelector(`[data-daytags="${CSS.escape(r.id)}"]`).innerHTML:''};});
  ok('6 F104 a day\'s details take the second observer\'s value and show the agreement (smaller over larger)',io.live==='agreement '+(Math.round(io.exp*100)/100).toLocaleString(undefined,{maximumFractionDigits:2})+'%'&&/data-daytags|title="A second observer/.test(io.btn+'title="A second observer'),io);
  ok('7 F104 the results give the agreement per condition, flag a condition under 20% of its days, and cite the standard',/^Interobserver agreement \(a second observer, total count or duration agreement\): .+ 1 of \d+ days \(\d+%\), mean [\d.]+% \(lowest [\d.]+%\)/.test(io.line)&&/Under 20% of the days in /.test(io.line)&&/at least 20% of the days in each condition, at 80% or more \(Kratochwill et al\., 2010\)/.test(io.line),io.line);
  ok('8 F104 the case carries each behavior\'s agreement',io.ioa&&io.ioa.days===1&&io.ioa.mean===io.exp,io.ioa);
  /* ---- I51 absent ---- */
  const ab=await p.evaluate(async()=>{const R=sortedRows(),r=R[R.length-1];ddTagOpen(r.id);const d=document.getElementById('dlgDayTags');const s=d.querySelector('#dtAb');s.value='absent';s.dispatchEvent(new Event('input',{bubbles:true}));
    d.querySelector('#dtDone').click();await new Promise(z=>setTimeout(z,200));renderResults();const marks=document.querySelectorAll('.dd-absent text[data-abs="absent"]').length;
    ddWeekOn(ddMonday(r.date));const wk=(document.querySelector('#ddWeekWrap .dd-wk-abs')||{}).textContent||'';ddWeekOff(true);const f=window.__nbhFactsOut();
    const snap=JSON.parse(JSON.stringify(S));r.absent='bogus';ddTagClean();const cleaned=!('absent' in r);r.absent='absent';
    return {marks,wk,absent:f.data.absent,date:r.date,cleaned};});
  ok('9 I51 a day marked absent is marked A on the graphs, listed in the week summary, and carried to the case; anything else is dropped',ab.marks>0&&/^Marked .+ absent: not counted as days without data\.$/.test(ab.wk)&&Array.isArray(ab.absent)&&ab.absent.includes(ab.date)&&ab.cleaned,ab);
  const sh=await ctx.newPage();await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const nag=await sh.evaluate(()=>{const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
    let to=-14;while(tdSchoolDays(iso(to))<4)to--;const T=iso(to);const after=[1,2,3].map(k=>{let x=to+k;return iso(x);});
    state.facts={data:{from:iso(to-20),to:T,days:10,behaviors:[],absent:[]}};const a=todayItems().filter(x=>x.k==='Data').map(x=>x.t);
    const sd=tdSchoolDays(T);const dates=[];for(let k=1;dates.length<sd-2&&k<40;k++){const x=iso(to+k);const dw=new Date(x+'T12:00:00').getDay();if(dw>0&&dw<6)dates.push(x);}
    state.facts.data.absent=dates;const b=todayItems().filter(x=>x.k==='Data').map(x=>x.t);state.facts={};return {a,b,sd,n:dates.length};});
  ok('10 I51 the workstation does not count days marked absent or no school as school days without data',nag.a.length===1&&nag.b.length===0,nag);
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
