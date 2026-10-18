/* v22.51 Form ABC-1, the ABC record (review F79-F88, I43-I45). A background check scores the consequence window (seconds), not
   the whole window between checks, and checks from an older file are flagged; the unconditional probability and p(B|C) are
   weighted by the minutes observed, so the Camp criterion no longer depends on how many checks were taken; the summary says
   what it ranked on and names the class that followed more incidents; the Data file says Autosave keeps a copy; a
   correspondence is named only on five incidents or more; no chi-square or p in the record or the CSV; the agreement check is
   kept with the file, printed and handed to Form FS-1; the case's target behaviors are rows of the Behavior column; background
   samples carry the activity and the Activity filter narrows both sides; consent and assent on the header, and Start
   observation asks first without consent; the FA function fills from Form EA-1 only. Form SP-1's data sheet (the user's report) prints on one page from an iPad: the
   page is laid out at a computer's width, the grid's marks and counts are plain text and the legend keeps to two lines. Simulated people only.
   usage: node qa/v2251-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const ABC='ABC_Recording_Conditional_Probability_Analysis.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  /* a seeded Math.random, so the worked example draws the same record every run */
  await ctx.addInitScript(()=>{let s=4242;Math.random=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};});
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+(file||ABC));await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__asked=[];window.__yes=true;if(window.nbhUI)nbhUI.confirm=async m=>{window.__asked.push(m);return window.__yes;};window.__dl=null;window.download=(n,t)=>{window.__dl=t;};});return p;};
  const sim=p=>p.evaluate(async()=>{document.getElementById('load-demo').click();await new Promise(r=>setTimeout(r,900));switchTab('analysis');renderAnalysis();});
  const out=p=>p.evaluate(()=>document.getElementById('analysis-out').textContent.replace(/\s+/g,' '));
  const campRow=(p,label)=>p.evaluate(l=>{const t=[...document.querySelectorAll('#analysis-out table')].find(x=>/Camp criteria/.test(x.textContent));const tr=t&&[...t.querySelectorAll('tbody tr')].find(r=>r.cells[0].textContent.trim()===l);return tr?[...tr.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim()):null;},label);
  /* ---- F79 ---- */
  let p=await open();
  const f79=await p.evaluate(()=>({lab:document.getElementById('bg-window').closest('label').textContent.trim(),lead:document.querySelector('#panel-background .note.lead:nth-of-type(2)')?document.querySelector('#panel-background').textContent.replace(/\s+/g,' '):'',
    ev:[...document.querySelectorAll('#panel-background h4')].map(h=>h.textContent)}));
  ok('1 F79 a check scores "Seconds scored", the consequence window; the tab says why, and events are those in the seconds scored',/^Seconds scored/.test(f79.lab)&&/the events in the last few seconds, the same span as the consequence window/.test(f79.lead)&&/Camp et al\., 2009, scored both sides in the same 10-second intervals/.test(f79.lead)&&f79.ev.includes('Antecedent conditions in place at the check')&&f79.ev.includes('Events in the seconds scored (whatever they followed)'),f79);
  await sim(p);
  const s1=await p.evaluate(()=>{document.getElementById('h-window').value='15';document.getElementById('bg-window').value='15';document.getElementById('bg-activity').value='reading group';document.getElementById('bg-save').click();const s=state.samples[state.samples.length-1];return {w:s.window,u:s.unit,a:s.activity,cell:document.querySelector('#bg-table tbody tr:last-child').textContent.replace(/\s+/g,' ')};});
  ok('2 F79, I43 a saved sample keeps its seconds (unit s) and its activity, and the table shows both',s1.w===15&&s1.u==='s'&&s1.a==='reading group'&&/reading group/.test(s1.cell)&&/15 s/.test(s1.cell),s1);
  ok('3 F79 the worked example\'s checks are 10-second ones: no older-file notice',!/Background checks from an older file/.test(await out(p)));
  await p.evaluate(()=>{state.samples.slice(0,8).forEach(s=>{delete s.unit;s.window=10;});renderAnalysis();});
  let o=await out(p);
  ok('4 F79 checks from an older file (whole windows of minutes) are flagged: base rates run high, take new checks',/Background checks from an older file/.test(o)&&/8 of the 61 background checks on file scored a whole window of several minutes/.test(o)&&/since v22\.51 each scores the last few seconds/.test(o),o.slice(o.indexOf('older file')-20,o.indexOf('older file')+400));
  await p.close();
  /* ---- F80 ---- */
  p=await open();await sim(p);
  let dem=await campRow(p,'Demand removed/avoided');
  ok('5 F80 with the minutes observed (1060) the unconditional probability is over every 10-second span: demand removed meets the criterion',dem&&parseFloat(dem[3])<10&&parseFloat(dem[4])>1.23&&dem[5]==='met'&&/Weighted by time observed/.test(await out(p)),dem);
  await p.evaluate(()=>{state.samples=state.samples.slice(0,10);renderAnalysis();});
  dem=await campRow(p,'Demand removed/avoided');
  ok('6 F80 with only 10 checks a consequence can still meet the criterion (the old count-based ratio was capped below 1.23)',dem&&parseFloat(dem[4])>1.23,dem);
  await p.evaluate(()=>{document.getElementById('h-minutes').value='';document.getElementById('h-minutes').dispatchEvent(new Event('change'));});await sleep(150);
  dem=await campRow(p,'Demand removed/avoided');o=await out(p);
  ok('7 F80 without the minutes observed the columns say so instead of a verdict',dem&&dem[5]==='needs the minutes observed'&&dem[3]==='—'&&/Add the minutes observed in the header/.test(o),dem);
  const mins=await p.evaluate(()=>({lab:document.getElementById('h-minutes').closest('label').textContent.trim(),note:/the minutes observed weight the unconditional probability/.test(document.querySelector('#h-minutes').closest('.card').textContent)}));
  ok('8 F80 the header has Minutes observed (all sessions), and says the timer adds them',/^Minutes observed \(all sessions\)/.test(mins.lab)&&mins.note,mins);
  await p.close();
  /* ---- F81, F88, F82 ---- */
  p=await open();await sim(p);o=await out(p);
  ok('9 F81 the summary says it is ranked on separation (Yule\'s Q) and names attention, which followed more incidents',/The record supports taking escape\/avoidance forward as the first hypothesis to test\. It is ranked on its separation from the no-behavior base rate \(Yule’s Q\), not on how often it followed: attention followed more incidents, \d+%, but it also occurs in \d+% of no-behavior checks\./.test(o)&&!/carries both the highest conditional probability/.test(o),o.slice(o.indexOf('The record supports'),o.indexOf('The record supports')+300));
  const f88=await p.evaluate(()=>{const ths=[...document.querySelectorAll('#analysis-out th')].map(t=>t.textContent.trim());exportMatrix();return {ths,csv:(window.__dl||'').split(/\r?\n/)[0]};});
  ok('10 F88 no chi-square or p column in the tables, nor in the exported CSV',!f88.ths.some(t=>/χ|^p$/.test(t))&&/phi$/.test(f88.csv)&&!/chi2|,p$/.test(f88.csv),f88);
  ok('11 F82 the Data file says the record is the file you save, and that Autosave keeps a copy on this device for 14 days',await p.evaluate(()=>/The record is the file you save\..*Autosave keeps a safety copy in this browser, on this device, for up to 14 days/.test(document.getElementById('panel-data').textContent.replace(/\s+/g,' '))&&!/All records live in this page/.test(document.body.textContent)));
  /* ---- F87 ---- */
  const f87=await p.evaluate(()=>{state.entries=state.entries.slice(0,4);refreshAll();renderAnalysis();return document.getElementById('analysis-out').textContent.replace(/\s+/g,' ');});
  ok('12 F87 with four incidents no correspondence is named',/No antecedent condition was in place at five or more incidents yet/.test(f87)&&!/The tightest antecedent-to-consequence correspondence/.test(f87));
  await p.close();
  /* ---- F85 agreement ---- */
  p=await open();await sim(p);
  const f85=await p.evaluate(()=>{const ev=(window.__nbhFactsOut()||{}).evidence||{};exportJSON();const j=JSON.parse(window.__dl);fillPrintHeader();return {ev:ev.ioa,file:j.ioa,print:document.getElementById('print-header').textContent.replace(/\s+/g,' ')};});
  ok('13 F85 the agreement check goes out with the evidence: sessions, the three figures, units, date and observer',f85.ev&&/^a second observer on 3 of 10 sessions; occurrence agreement 90%, nonoccurrence 95%, overall 94% over 32 units \(\d+\/\d+\/2026\), second observer Iris Calloway \(simulated\)$/.test(f85.ev.text)&&f85.ev.units===32,f85.ev);
  ok('14 F85 it is saved in the data file and printed with the record',f85.file&&f85.file.oa==='9'&&f85.file.s2==='3'&&/Interobserver agreementa second observer on 3 of 10 sessions/.test(f85.print),{file:f85.file});
  const fp=path.join(os.tmpdir(),'abc51-'+process.pid+'.json');fs.writeFileSync(fp,await p.evaluate(()=>window.__dl));await p.close();
  p=await open();await p.setInputFiles('#file-input',fp);await sleep(800);
  const back=await p.evaluate(()=>({oa:document.getElementById('ioa-oa').value,who:document.getElementById('ioa-who').value,occ:document.querySelector('#ioa-out .metric .v').textContent,min:document.getElementById('h-minutes').value}));
  ok('15 F85 opening the file again brings the counts, the observer and the figures back (and the minutes observed)',back.oa==='9'&&back.who==='Iris Calloway (simulated)'&&back.occ==='90.0%'&&back.min==='1060',back);
  try{fs.unlinkSync(fp);}catch(e){}
  await p.close();
  const fs1=await open('FS-1_FBA-Summary-Report_v2026-09.html');
  const fsx=await fs1.evaluate(()=>{window.__nbhFactsIn({evidence:{'ABC-1':{form:'ABC-1',fnKey:'escape',statement:'Escape/avoidance followed 30% of incidents (simulated).',ioa:{text:'a second observer on 3 of 10 sessions; occurrence agreement 90%, nonoccurrence 95%, overall 94% over 32 units'}}}});return document.querySelector('[data-x="ioa"]').value;});
  ok('16 F85 Form FS-1\'s Interobserver agreement box takes it when empty',/^ABC-1: a second observer on 3 of 10 sessions; occurrence agreement 90%/.test(fsx),fsx);
  await fs1.close();
  /* ---- F84, I44, I45 the case ---- */
  p=await open();
  const CASE={behaviors:[{name:'Hitting staff (simulated)',def:'Open-hand contact with an adult (simulated)'}],consent:{state:'Pending',on:false},student:{assent:'partial',stop:{signs:'says stop (simulated)'}},evidence:{'EA-1':{form:'EA-1',fnKey:'escape',dates:'10/1/2026'}},function:'attention'};
  const c1=await p.evaluate(async c=>{window.__nbhFactsIn(c);await new Promise(r=>setTimeout(r,200));window.__yes=false;document.getElementById('obsStart').click();await new Promise(r=>setTimeout(r,300));
    const row=document.querySelector('[data-opt="b-tb_hitting_staff_simulated"]');
    return {row:row&&row.textContent.replace(/\s+/g,' ').trim(),title:row&&row.title,first:(Array.from(document.querySelectorAll('#abc-grid .group')).find(g=>/^Target behavior/.test(g.querySelector('.glabel').textContent)).querySelector('.opt')||{dataset:{}}).dataset.opt,consent:document.getElementById('abcConsent').textContent,bad:document.getElementById('abcConsent').classList.contains('bad'),
      asked:window.__asked.slice(-1)[0],timer:abcTimer.state(),fa:document.getElementById('a-function').value,faNote:document.getElementById('abcFaFrom').textContent};},CASE);
  ok('17 F84 the case\'s target behavior is the first row of the Behavior column, marked TB-1, with its definition',c1.row==='Hitting staff (simulated) TB-1'&&c1.first==='b-tb_hitting_staff_simulated'&&c1.title==='Open-hand contact with an adult (simulated)',c1);
  ok('18 I44 the header says consent is pending and that observation needs it, and gives the assent and stop signal',c1.bad&&/^Consent pending: no response from the parent yet \(Form IC-1\): direct observation for an individual FBA needs the parent’s consent first · Assent \(Form SI-1\): partial; the student says stop by: says stop \(simulated\)$/.test(c1.consent),c1.consent);
  ok('19 I44 Start observation asks first, and answered no, the observation does not start',/^Consent pending: no response from the parent yet \(Form IC-1\)\.\nDirect observation for an individual FBA needs the parent’s consent first\. Start the observation anyway\?$/.test(c1.asked||'')&&c1.timer==='ready',c1);
  ok('20 I45 the FA function is EA-1\'s (escape), not FS-1\'s conclusion (attention), and says where it came from',c1.fa==='escape'&&/^Form EA-1’s experimental analysis \(10\/1\/2026\): Escape \/ avoidance\.$/.test(c1.faNote),c1);
  /* the target in a coded incident, the file and the evidence */
  const c2=await p.evaluate(()=>{document.getElementById('b-tb_hitting_staff_simulated').click();document.getElementById('c-c_dem_rem')&&document.getElementById('c-c_dem_rem').click();document.getElementById('save-entry').click();
    exportJSON();const j=JSON.parse(window.__dl);const ev=(window.__nbhFactsOut()||{}).evidence||{};return {saved:state.entries.length,beh:state.entries[0]&&state.entries[0].behaviors,file:j.caseTargets,targets:ev.targets};});
  ok('21 F84 an incident coded with it keeps it, the file carries the target, and the evidence names it',c2.saved===1&&c2.beh.includes('tb_hitting_staff_simulated')&&c2.file.length===1&&c2.file[0].label==='Hitting staff (simulated)'&&JSON.stringify(c2.targets)==='["Hitting staff (simulated)"]',c2);
  /* consent that covers ABC recording: no question */
  const c3=await p.evaluate(async()=>{window.__nbhFactsIn({consent:{state:'Current',on:true,obtained:'2026-09-01',covered:['abc','indirect']}});window.__asked=[];window.__yes=true;document.getElementById('obsStart').click();await new Promise(r=>setTimeout(r,300));const st=abcTimer.state();
    return {asked:window.__asked.length,st,consent:document.getElementById('abcConsent').textContent,bad:document.getElementById('abcConsent').classList.contains('bad')};});
  ok('22 I44 with consent covering ABC recording, the header says so and Start observation starts without asking',c3.asked===0&&c3.st==='run'&&/^Consent on file since 9\/1\/2026 \(Form IC-1\)/.test(c3.consent)&&!c3.bad,c3);
  await p.close();
  /* ---- F86, I43 the Activity filter ---- */
  p=await open();await sim(p);
  const f86=await p.evaluate(()=>{const lab=document.getElementById('a-activity').closest('label').textContent.trim();document.getElementById('a-activity').value='math';document.getElementById('a-activity').dispatchEvent(new Event('input'));const S=analysisSet();
    return {lab,N:S.coded.length,M:S.samples.length,all:state.samples.length,txt:document.getElementById('analysis-out').textContent.replace(/\s+/g,' ')};});
  ok('23 F86, I43 Activity contains narrows the incidents and the background samples alike, and says so',/^Activity contains/.test(f86.lab)&&f86.N===6&&f86.M>0&&f86.M<f86.all&&/Both sides are narrowed/.test(f86.txt)&&/not with a date or activity filter/.test(f86.txt),{lab:f86.lab,N:f86.N,M:f86.M,all:f86.all});
  await p.close();
  /* ---- SP-1 the data sheet prints on one page from an iPad (the user's report) ---- */
  const SP='Scatterplot_Pattern_Analysis.html';const spPages=b=>(b.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
  const spc=await br.newContext({viewport:{width:547,height:900},serviceWorkers:'block'});
  p=await spc.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+SP);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;});
  const toPrint=async()=>{await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(400);};
  await toPrint();
  const sp1=await p.evaluate(()=>{const sh=document.querySelector('#spPrint .sp-printed'),t=sh.querySelector('table.scatter'),rows=[...sh.querySelectorAll('.legend .lgrow')],cs=rows[0]?getComputedStyle(rows[0]):{};
    return {html:document.documentElement.getBoundingClientRect().width,sheet:Math.round(sh.getBoundingClientRect().width),
    btn:t.querySelectorAll('button.cell,input.count').length,spans:t.querySelectorAll('span.cell').length,cells:[...document.querySelectorAll('table.scatter button.cell')].filter(b=>!b.closest('#spPrint')).length,
    lgSize:cs.fontSize,lgWrap:cs.whiteSpace,lgLines:new Set(rows.map(r=>Math.round(r.getBoundingClientRect().top))).size};});
  const blankPages=spPages(await p.pdf({format:'Letter',preferCSSPageSize:true,printBackground:true}));
  ok('24 SP-1 on paper the page is laid out at a computer\'s width (729 px) even where the browser lays the paper out narrower, as Safari on an iPad does, and the blank sheet is one page',sp1.html===729&&sp1.sheet>=700&&blankPages===1,{blankPages,...sp1});
  await p.emulateMedia({media:'screen'});
  for(let i=0;i<2;i++){await p.evaluate(()=>document.querySelector('table.scatter button.cell[data-r="2"][data-c="1"]').click());await sleep(150);}
  await toPrint();
  const dark=await p.evaluate(()=>{const d=document.querySelector('#spPrint table.scatter span.cell[data-state="2"]');return d?getComputedStyle(d).backgroundColor:null;});
  ok('25 SP-1 on paper the grid\'s marks are plain text and a mark is kept; the legend keeps to two lines at 10 px',sp1.btn===0&&sp1.spans>0&&sp1.spans===sp1.cells&&dark==='rgb(24, 46, 67)'&&sp1.lgSize==='10px'&&sp1.lgWrap==='nowrap'&&sp1.lgLines<=2,{dark,...sp1});
  await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1200);
  await toPrint();
  const sp2=await p.evaluate(()=>{const live=[...document.querySelectorAll('table.scatter input.count')].filter(i=>!i.closest('#spPrint')).map(i=>i.value);
    const sh=document.querySelector('#spPrint .sp-printed'),sc=[...sh.querySelectorAll('table.scatter span.count')];
    return {codes:document.documentElement.classList.contains('sp-codes'),inputs:sh.querySelectorAll('table.scatter input.count').length,n:sc.length,same:sc.map(x=>x.textContent).join()===live.slice(0,sc.length).join(),pad:sc[0]?getComputedStyle(sc[0]).paddingRight:null};});
  ok('26 SP-1 typed counts print as their numbers, clear of the code tag',sp2.codes&&sp2.inputs===0&&sp2.n>0&&sp2.same&&sp2.pad==='22px',sp2);
  await spc.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('27 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
