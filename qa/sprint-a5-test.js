/* Sprint A5 (v21.44): goals start from the measured baseline (Form GB-1).
   1. Current level from DD-1, inside the workstation: DD-1's simulation (plus a target with no baseline days and a rate
      target), then GB-1 fills the matching empty current levels with DD-1's own Results figures for the Baseline
      condition; a different unit, no baseline days and no behavior of that name are left empty and named; a typed
      value is kept; pressing again keeps what was filled; the level's source shows in full under the field; TD-1's
      Apply to empty fields still fills the first objective; Load simulation asks first and Cancel keeps every field.
   2. With DD-1 closed the button offers a file: DD-1's saved file inside the workstation; a case file holding DD-1
      when GB-1 is open on its own; a file from another form is named and changes nothing; another student's DD-1 is
      asked about ("Ann" is not "Anna Smith"); a file chosen here does not mark the form saved; the report offers Apply
      to empty fields only where it would fill (the first objective, left empty, in rate per minute or no measure).
   3. TB-1 simulated, then GB-1 fresh: one acquisition objective per replacement skill, the pairings, and sentences
      that read as English on the cards and in Copy for the BIP; the picker adds no second objective for a skill.
   4. Typed labels: an action ("Requests a break"), a name ("Break request") and a plain form ("ask for help"), and the
      labels the review found worded badly (verbs off the list, a subject, an opening phrase, a semicolon); contexts
      and conditions in lower case except names; a file saved before this change opens as before, and one typed in the
      old style keeps its fields and reads by the new rules; the two copies of the case hooks are the same.
   5. TB-1's case as it is passed today and as it reads once TB-1 cleans its replacement names (package A4) give the
      same objectives, pairings and sentences, so this package does not depend on A4.
   6. "see target N" past a TB-1 target card with no name (left out of the case) finds the right target, by order or
      by the numbers a case gives; a behavior the picker adds to a skill on the form joins its pairing, and a pairing
      typed by hand is kept and named.
   usage: WS_URL=http://127.0.0.1:8305 WS_ROOT=<worktree> node qa/sprint-a5-test.js [edition folder, NBH-Workstation by default] */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/a5/';fs.mkdirSync(OUT,{recursive:true});
const GB='GB-1_Goal-and-Objective-Builder_v2026-09.html',ED=process.argv[2]||'NBH-Workstation';
let fails=0;const check=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(c||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,400)));if(!c)fails++;};
const errsOf=log=>log.filter(l=>l.type==='pageerror'||(l.type==='error'&&!/favicon|net::ERR|Failed to load resource/.test(l.text)));
/* a file saved by GB-1 before this change (the simulation, as it was saved on 4 October 2026) */
const OLD_GB1={form:'GB-1',rev:'2026-09',saved:'2026-10-04T06:56:37.122Z',rows:{red:1,acq:1},live:{red:[0],acq:[0]},sheet:true,f:{
  'm.client':'SIMULATED – Sample Student','m.sid':'SIM-000','m.setting':'Room 12, self-contained ESE (simulated)','m.assessor':'Joshua Newsome, M.A., BCBA',
  'm.date':'2026-10-04','m.progress':'quarterly, with report cards','red[0].beh':'Aggression toward staff (simulated)','red[0].dir':'decrease',
  'red[0].meas':'rate per minute','red[0].cur':'1.4 per minute','red[0].ml':'more','red[0].tgt':'0.2 per minute',
  'red[0].ctx':'the self-contained ESE classroom during instruction','red[0].crit':'3',
  'red[0].meth':'a frequency count in each 10-minute instructional session, recorded on DD-1','red[0].date':'2027-02-01',
  'red[0].pair':'A1 — mands for a break','acq[0].beh':'hand the break card to an adult (simulated)',
  'acq[0].cond':'an instructional demand presented and the break card within reach','acq[0].crit':'independently in at least 80% of opportunities',
  'acq[0].n':'3','acq[0].unit':'sessions','acq[0].meth':'trial-by-trial mand data recorded on DD-1','acq[0].date':'2027-02-01',
  'acq[0].pair':'R1 — aggression toward staff'}};
const STUDENT='SIMULATED – Sample Student';
/* the objectives typed for part 1 and 2: [behavior, response measure, current level typed] */
const OBJ=[['Physical aggression','',''],['Self-injury','rate per minute',''],['Property destruction','','3 per day'],
  ['Elopement','',''],['Running away','',''],['Tantrum (duration)','',''],['Out of seat','rate per hour','']];
async function openForm(page,id){await page.evaluate(i=>openForm(i),id);
  await page.waitForFunction(i=>!!(state.status&&state.status[i]),id,{timeout:20000}).catch(()=>{});await sleep(1200);
  const h=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});return h.contentFrame();}
/* type the objectives as a person would (input and change events), on a GB-1 holding one empty reduction objective */
async function typeObjectives(fr,list){
  await fr.evaluate(([list,who])=>{
    const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('m.client',who);
    while(document.querySelectorAll('#redWrap .card').length<list.length)document.querySelector('#addRed').click();
    const ids=[...document.querySelectorAll('#redWrap .card')].map(c=>+c.querySelector('[data-out]').dataset.out.replace('red',''));
    list.forEach(([beh,meas,cur],k)=>{const i=ids[k];set('red['+i+'].beh',beh);if(meas)set('red['+i+'].meas',meas);if(cur)set('red['+i+'].cur',cur);});
  },[list,STUDENT]);}
const reds=fr=>fr.evaluate(()=>[...document.querySelectorAll('#redWrap .card')].map(c=>{const i=+c.querySelector('[data-out]').dataset.out.replace('red','');
  const g=n=>(document.querySelector('[name="red['+i+'].'+n+'"]')||{}).value||'';return {i,beh:g('beh'),meas:g('meas'),cur:g('cur'),tgt:g('tgt'),crit:g('crit'),ctx:g('ctx'),dir:g('dir'),pair:g('pair'),out:c.querySelector('[data-out]').textContent};}));
const acqs=fr=>fr.evaluate(()=>[...document.querySelectorAll('#acqWrap .card')].map(c=>{const i=+c.querySelector('[data-out]').dataset.out.replace('acq','');
  const g=n=>(document.querySelector('[name="acq['+i+'].'+n+'"]')||{}).value||'';return {i,beh:g('beh'),pair:g('pair'),cond:g('cond'),out:c.querySelector('[data-out]').textContent};}));
const report=fr=>fr.evaluate(()=>{const o=document.querySelector('#gbDdOut');return {hidden:o.hidden,bad:o.classList.contains('bad'),text:o.textContent.replace(/\s+/g,' ').trim(),pick:!!document.querySelector('#gbDdPick')};});
async function waitReport(fr){for(let k=0;k<60;k++){const r=await report(fr);if(!r.hidden&&!/^Asking the workstation/.test(r.text))return r;await sleep(250);}return report(fr);}
/* DD-1's own Results figures (Within-condition analysis, first row: the Baseline condition) for the behaviors named */
const ddFigures=(dd,names)=>dd.evaluate(names=>{const out={};
  document.querySelectorAll('#resultsOut .behavior-report').forEach(rep=>{const h=rep.querySelector('.sec-title h3');const nm=h?h.textContent.trim():'';if(!names.includes(nm))return;
    const t=[...rep.querySelectorAll('table')].find(tb=>/Days with data/.test((tb.querySelector('thead')||{}).textContent||''));const tr=t&&t.querySelector('tbody tr');if(!tr)return;
    const c=[...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim());const m=/^([\d.,]+)–([\d.,]+)/.exec(c[4]||'');const nb=s=>parseFloat(String(s).replace(/,/g,''));
    out[nm]={cond:c[0],n:+c[1],mean:nb(c[2]),min:m?nb(m[1]):null,max:m?nb(m[2]):null,raw:c.slice(0,5)};});
  return out;},names);
/* "10 per school day (DD-1 baseline: mean of 6 days, range 8–12)" read back as numbers */
function parseLevel(s){const m=/^([\d.]+)(.*?) \(DD-1 (.+?): (?:mean of (\d+) days, range ([\d.]+)–([\d.]+)|1 day)\)$/.exec(s||'');
  return m?{mean:+m[1],unit:m[2],cond:m[3],n:m[4]?+m[4]:1,min:m[5]?+m[5]:+m[1],max:m[6]?+m[6]:+m[1]}:null;}
const same=(a,b)=>a!=null&&b!=null&&Math.abs(a-b)<0.006;
async function pickFile(page,fr,sel,file){const [fc]=await Promise.all([page.waitForEvent('filechooser',{timeout:8000}),fr.evaluate(s=>document.querySelector(s).click(),sel)]);await fc.setFiles(file);await sleep(900);}

(async()=>{
  const br=await chromium.launch();
  /* ---------- 0. the two copies of the case hooks ---------- */
  console.log('\n=== 0. the case hooks');
  const formSrc=fs.readFileSync(path.join(ROOT,ED,GB),'utf8'),hook=fs.readFileSync(path.join(ROOT,'tools/blocks/hooks/GB-1.js'),'utf8').replace(/\n+$/,'');
  check(formSrc.split(hook).length===2,'the form holds tools/blocks/hooks/GB-1.js byte for byte, once');

  /* ---------- 1. inside the workstation, DD-1 simulated ---------- */
  console.log('\n=== 1. Current level from DD-1, inside the workstation');
  const ctx=await br.newContext({viewport:{width:1366,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
  let log=[];let page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/index.html');await sleep(900);
  const dd=await openForm(page,'DD-1');
  await dd.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#btnLoadExample').click();});await sleep(1500);
  /* two targets more: Elopement, recorded only after the baseline, and Out of seat, a rate (per hour) */
  await dd.evaluate(()=>{const add=(name,measure,val)=>{const id=uid('b');S.behaviors.push({id,kind:'target',name,definition:'',obsLength:'Entire school day',measure,direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[6]});
      sortedRows().forEach((r,i)=>{r.values[id]=val(i);r.values[OPP(id)]='';r.intervals=r.intervals||{};r.intervals[id]={};r.intervals[OPP(id)]={};});};
    add('Elopement','count',i=>i>=6?String(i%3):'');add('Out of seat','rate',i=>String([12,9,15,11,14,10,6,5,4,4,3,3,2,2,2,1,1,1,0,1][i]));
    renderAll();showTab('results');});
  await sleep(800);
  const ddText=await dd.evaluate(()=>JSON.stringify(S,null,2));fs.writeFileSync(OUT+'DD-1.json',ddText);
  const F=await ddFigures(dd,['Physical aggression','Out of seat','Elopement']);
  console.log('  DD-1 Results, Baseline row: '+JSON.stringify(F));
  check(F['Physical aggression']&&F['Physical aggression'].cond==='Baseline'&&F['Physical aggression'].n===6,'DD-1 shows a Baseline condition of 6 days for Physical aggression',F);
  let gb=await openForm(page,'GB-1');
  await typeObjectives(gb,OBJ);await sleep(300);
  check(await gb.evaluate(()=>!!document.querySelector('#gbDdBtn')&&document.querySelector('#gbDdBtn').closest('[data-pane="red"]')!==null),'the button sits on Reduction Objectives');
  await gb.evaluate(()=>document.querySelector('#gbDdBtn').click());
  let rep=await waitReport(gb);console.log('  report: '+rep.text.slice(0,900));
  let R=await reds(gb);const by=n=>R.find(r=>r.beh===n)||{};
  const pa=by('Physical aggression'),L1=parseLevel(pa.cur),fa=F['Physical aggression']||{};
  check(L1&&L1.unit===' per school day'&&L1.cond==='baseline','R1 filled, labelled with DD-1, the baseline, the days, the mean and the range: '+pa.cur);
  check(L1&&same(L1.mean,fa.mean)&&L1.n===fa.n&&same(L1.min,fa.min)&&same(L1.max,fa.max),'R1 equals DD-1’s own Baseline figures (mean '+fa.mean+', '+fa.n+' days, range '+fa.min+'–'+fa.max+')',{L1,fa});
  check(pa.meas==='frequency per school day','R1 had no response measure and took DD-1’s: '+pa.meas);
  check(/from [\d.]+ per school day \(DD-1 baseline: mean of 6 days, range [\d.]+–[\d.]+\) to no/.test(pa.out),'R1’s sentence carries the level and its source',pa.out.slice(0,200));
  const os=by('Out of seat'),L7=parseLevel(os.cur),fo=F['Out of seat']||{};
  check(L7&&L7.unit===' per hour'&&same(L7.mean,fo.mean)&&L7.n===fo.n&&same(L7.min,fo.min)&&same(L7.max,fo.max),'Out of seat (rate per hour) equals DD-1’s Baseline figures: '+os.cur,{L7,fo});
  check(!by('Self-injury').cur&&/R2 \(Self-injury\) was left empty: DD-1 records it as a count of occurrences over the entire school day, and this objective is measured in rate per minute/.test(rep.text),'a different unit (rate per minute against DD-1’s count) is left empty, and the reason given');
  check(!by('Tantrum (duration)').cur&&/Tantrum \(duration\)\) was left empty: DD-1 records it as minutes over the entire school day, which is not one of the response measures/.test(rep.text),'a duration per school day (no measure here) is left empty, and the reason given');
  check(by('Property destruction').cur==='3 per day'&&/already has a current level, 3 per day, which was kept/.test(rep.text),'a typed current level is kept, and named');
  check(!by('Elopement').cur&&/Elopement\) was left empty: DD-1 has no days with data for it in its baseline/.test(rep.text)&&F.Elopement&&F.Elopement.n===0,'no baseline days: left empty, and the reason given (DD-1 shows 0 days)');
  check(!by('Running away').cur&&/Running away\) was left empty: DD-1 has no behavior of that name/.test(rep.text)&&/The behaviors on DD-1: Physical aggression; Self-injury/.test(rep.text),'no behavior of that name: left empty, the reason and DD-1’s names given');
  check(/2 of 7 objectives filled/.test(rep.text)&&/from the DD-1 open in this workstation/.test(rep.text),'the report counts what was filled and names the source');
  check(/What is left empty can be typed\./.test(rep.text)&&!/Apply to empty fields/.test(rep.text),'R1 was filled, so the report does not offer TD-1’s Apply to empty fields (it fills only the first objective)',rep.text.slice(-260));
  /* the field is narrower than the labelled level: where the level came from shows in full under the field, on screen */
  await gb.evaluate(()=>{const b=document.querySelector('button[data-view="red"]');if(b)b.click();});await sleep(200);
  const cap=await gb.evaluate(i=>{const e=document.querySelector('[name="red['+i+'].cur"]'),n=e.closest('.f').querySelector('.gb-cur-src');if(!n)return null;
    const r=n.getBoundingClientRect(),f=e.getBoundingClientRect();return {text:n.textContent,noprint:n.classList.contains('noprint'),below:r.top>=f.bottom-1&&r.height>0,title:e.title,cut:e.scrollWidth>e.clientWidth};},pa.i);
  check(cap&&cap.text===(/\((DD-1 [^()]*)\)$/.exec(pa.cur)||[])[1]&&cap.noprint&&cap.below&&cap.title===pa.cur,'the source of the filled level shows in full under the Current level field, on screen only'+(cap&&cap.cut?' (the field cuts the value)':''),cap);
  check(await gb.evaluate(i=>[...document.querySelectorAll('.gb-cur-src')].length===2&&!document.querySelector('[name="red['+i+'].cur"]').closest('.f').querySelector('.gb-cur-src'),by('Property destruction').i),'no such line under a level that was typed');
  check(await gb.evaluate(()=>window.nbhGuard.isDirty()),'the form is marked unsaved after the fill');
  check(await gb.evaluate(()=>/Check:/.test(document.querySelector('#redWrap').textContent))===false,'no Check line from the labelled level');
  /* the Check line still compares a labelled level with a target in the same unit */
  await gb.evaluate(i=>{const e=document.querySelector('[name="red['+i+'].tgt"]');e.value='20 per school day';e.dispatchEvent(new Event('input',{bubbles:true}));const d=document.querySelector('[name="red['+i+'].dir"]');d.value='decrease';d.dispatchEvent(new Event('change',{bubbles:true}));},pa.i);
  check(await gb.evaluate(i=>/target level \(20 per school day\) is not below the current level/.test(document.querySelector('[data-out="red'+i+'"]').textContent),pa.i),'the Check line reads the labelled level as a number in its unit');
  await gb.evaluate(i=>{const e=document.querySelector('[name="red['+i+'].tgt"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));},pa.i);
  /* pressing again keeps what is there */
  await gb.evaluate(()=>document.querySelector('#gbDdBtn').click());rep=await waitReport(gb);
  const R2=await reds(gb);
  check(R2.find(r=>r.beh==='Physical aggression').cur===pa.cur&&/R1 \(Physical aggression\) already has a current level/.test(rep.text),'pressed again: the filled level is kept, not written twice');
  /* TD-1's Apply to empty fields on what is left (it fills the first reduction objective) */
  await gb.evaluate(()=>{window.postMessage({nbh:'plan',from:'TD-1',fields:{'m.beh':'Physical aggression','m.rate':'1.4','mon.crit':'0.2','mon.n':'3','m.setting':'Room 12'}},'*');});await sleep(300);
  await gb.evaluate(()=>document.querySelector('#applyPlan').click());await sleep(400);
  const r1=(await reds(gb)).find(r=>r.beh==='Physical aggression');
  check(r1.cur===pa.cur&&r1.crit==='3'&&r1.ctx==='Room 12'&&r1.dir==='decrease','Apply to empty fields fills R1’s empty fields (criterion, context) and keeps its current level',r1);
  /* Load simulation asks first; Cancel keeps every field */
  const before=JSON.stringify(await reds(gb));
  await gb.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  const q=await gb.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?d.textContent.replace(/\s+/g,' '):'';});
  check(/Load the simulated goals and objectives\?/.test(q)&&/Anything already entered will be replaced/.test(q)&&/Cancel/.test(q),'Load simulation asks first: '+q.slice(0,120));
  await gb.evaluate(()=>[...document.querySelectorAll('#nbhUiDlg button')].find(b=>b.textContent==='Cancel').click());await sleep(400);
  check(JSON.stringify(await reds(gb))===before&&await gb.evaluate(w=>document.querySelector('[name="m.client"]').value===w,STUDENT),'Cancel keeps every field');
  await gb.evaluate(()=>document.querySelector('#simBtn').click());await sleep(400);
  await gb.evaluate(()=>[...document.querySelectorAll('#nbhUiDlg button')].find(b=>b.textContent==='Load').click());await sleep(700);
  check(await gb.evaluate(()=>document.querySelector('[name="red[0].beh"]').value==='Aggression toward staff (simulated)'&&document.querySelectorAll('#redWrap .card').length===1&&document.querySelector('#gbDdOut').hidden),'Load replaces the record (and clears the DD-1 report) once it is answered');
  const e1=errsOf(log);check(e1.length===0,'no console or page errors in part 1',e1.slice(0,3));
  await page.close();

  /* ---------- 2. DD-1 closed: a file ---------- */
  console.log('\n=== 2. With DD-1 closed, the button reads a file');
  log=[];page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/index.html');await sleep(900);
  gb=await openForm(page,'GB-1');
  await typeObjectives(gb,[['Physical aggression','','']]);
  await gb.evaluate(()=>document.querySelector('#gbDdBtn').click());rep=await waitReport(gb);
  check(/Form DD-1 is not open in this workstation/.test(rep.text)&&rep.pick,'DD-1 not open: the report says so and offers a file',rep.text);
  await pickFile(page,gb,'#gbDdPick',OUT+'DD-1.json');rep=await waitReport(gb);
  R=await reds(gb);const L2=parseLevel(R[0].cur);
  check(L2&&same(L2.mean,fa.mean)&&L2.n===fa.n&&same(L2.min,fa.min)&&same(L2.max,fa.max)&&/from the file “DD-1\.json”/.test(rep.text),'DD-1’s saved file gives the same figures: '+R[0].cur);
  await sleep(1300);
  check(await gb.evaluate(()=>window.nbhGuard.isDirty()),'a DD-1 file chosen here does not mark this form saved');
  const e2=errsOf(log);check(e2.length===0,'no console or page errors in part 2',e2.slice(0,3));
  await page.close();
  /* GB-1 on its own: a case file holding DD-1, a file from another form, another student's DD-1 */
  log=[];page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1200);
  await typeObjectives(page,[['Physical aggression','',''],['Biting','','']]);
  const caseFile={form:'CASE',rev:'2026-09',id:'c1',saved:new Date().toISOString(),packet:{client:STUDENT},forms:{'DD-1':{title:'Daily Behavior Data',snap:{total:0,data:{},own:ddText}}}};
  fs.writeFileSync(OUT+'case-with-DD-1.json',JSON.stringify(caseFile));
  fs.writeFileSync(OUT+'GB-1-old.json',JSON.stringify(OLD_GB1,null,1));
  await pickFile(page,page.mainFrame(),'#gbDdBtn',OUT+'GB-1-old.json');rep=await waitReport(page);
  check(/That file was saved by Form GB-1, not by Form DD-1\. Nothing was filled/.test(rep.text)&&!(await reds(page))[0].cur,'on its own: the button opens a file; a file from another form is named and nothing changes',rep.text);
  await pickFile(page,page.mainFrame(),'#gbDdBtn',OUT+'case-with-DD-1.json');rep=await waitReport(page);
  R=await reds(page);const L3=parseLevel(R[0].cur);
  check(L3&&same(L3.mean,fa.mean)&&L3.n===fa.n&&/from the case file/.test(rep.text)&&/Biting\) was left empty: DD-1 has no behavior of that name/.test(rep.text),'a case file holding DD-1 fills the same figures: '+R[0].cur);
  /* TD-1's Apply to empty fields on an objective DD-1 left empty (Biting is the first reduction objective after R1 is removed) */
  await page.evaluate(()=>{document.querySelector('#redWrap .card [data-rm]').click();});await sleep(200);
  await page.evaluate(()=>{window.alert=()=>{};window.postMessage({nbh:'plan',from:'TD-1',fields:{'m.rate':'1.4','mon.crit':'0.2','mon.n':'3'}},'*');});await sleep(300);
  await page.evaluate(()=>document.querySelector('#applyPlan').click());await sleep(300);
  R=await reds(page);
  check(R.length===1&&R[0].beh==='Biting'&&R[0].meas==='rate per minute'&&R[0].cur==='1.4 per minute'&&R[0].tgt!=='','Apply to empty fields still fills an objective DD-1 left empty',R[0]);
  await sleep(1300);check(await page.evaluate(()=>window.nbhGuard.isDirty()),'on its own: still marked unsaved after a file was read here');
  /* another student's DD-1: asked first; Cancel fills nothing */
  const other=JSON.parse(ddText);other.meta.client='Another Student';fs.writeFileSync(OUT+'DD-1-other-student.json',JSON.stringify(other));
  await typeObjectives(page,[['Biting','',''],['Physical aggression','','']]);
  await page.evaluate(()=>{window.__asked=[];window.__nc=window.confirm;window.confirm=m=>{window.__asked.push(String(m));return false;};});
  await pickFile(page,page.mainFrame(),'#gbDdBtn',OUT+'DD-1-other-student.json');rep=await waitReport(page);
  const asked=await page.evaluate(()=>window.__asked);
  check(asked.length===1&&/Form DD-1 is for “Another Student”, and this form is for “SIMULATED/.test(asked[0])&&!(await reds(page)).find(r=>r.beh==='Physical aggression').cur&&/Nothing was filled/.test(rep.text),'another student’s DD-1: asked first, and Cancel fills nothing',{asked,rep:rep.text});
  /* Load simulation asks first here too, with something real typed */
  await page.evaluate(()=>{window.confirm=window.__nc;});
  await page.evaluate(()=>{const e=document.querySelector('[name="m.client"]');e.value='ZQXREAL';e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#simBtn').click();});await sleep(500);
  check(await page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return !!(d&&d.open&&/Anything already entered will be replaced/.test(d.textContent));}),'on its own: Load simulation asks first');
  await page.evaluate(()=>[...document.querySelectorAll('#nbhUiDlg button')].find(b=>b.textContent==='Cancel').click());await sleep(300);
  check(await page.evaluate(()=>document.querySelector('[name="m.client"]').value==='ZQXREAL'),'on its own: Cancel keeps the typed name');
  const e3=errsOf(log);check(e3.length===0,'no console or page errors on the form on its own',e3.slice(0,3));
  await page.close();
  /* the report offers TD-1's Apply to empty fields only where it would fill: the first objective, left empty, measured
     in rate per minute or not yet measured */
  for(const [first,meas,offer] of [['Running away','',true],['Running away','rate per minute',true],['Running away','percentage of intervals',false]]){
    log=[];page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1000);
    await typeObjectives(page,[[first,meas,''],['Physical aggression','','']]);
    await pickFile(page,page.mainFrame(),'#gbDdBtn',OUT+'DD-1.json');rep=await waitReport(page);
    const said=/R1 can also take the baseline in TD-1’s plan: Apply to empty fields on Setup fills the first reduction objective from it, as a rate per minute\./.test(rep.text);
    check(said===offer&&/R2 \(Physical aggression\): /.test(rep.text),'R1 left empty'+(meas?', measured in '+meas:'')+': the report '+(offer?'offers':'does not offer')+' Apply to empty fields',rep.text.slice(-300));
    check(errsOf(log).length===0,'no console or page errors');await page.close();
  }
  /* the same student is the same words, not the same first letters */
  log=[];page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1000);
  const SAME=await page.evaluate(()=>[['Ann','Anna Smith'],['Jo','Jordan Rivera'],['Max','Maxine Lopez'],['Jordan','Jordan Rivera'],['Jordan Rivera','Rivera, Jordan'],['José Ruiz','Jose Ruiz'],['SIMULATED – Sample Student','SIMULATED - Sample Student'],['','Anyone']].map(([a,b])=>gbSameStudent(a,b)));
  check(JSON.stringify(SAME)===JSON.stringify([false,false,false,true,true,true,true,true]),'Ann is not Anna Smith, Jo is not Jordan Rivera, Max is not Maxine Lopez; Jordan is Jordan Rivera and Rivera, Jordan',SAME);
  const anna=JSON.parse(ddText);anna.meta.client='Anna Smith';fs.writeFileSync(OUT+'DD-1-anna.json',JSON.stringify(anna));
  await typeObjectives(page,[['Physical aggression','','']]);
  await page.evaluate(()=>{const e=document.querySelector('[name="m.client"]');e.value='Ann';e.dispatchEvent(new Event('input',{bubbles:true}));window.__asked=[];window.confirm=m=>{window.__asked.push(String(m));return false;};});
  await pickFile(page,page.mainFrame(),'#gbDdBtn',OUT+'DD-1-anna.json');rep=await waitReport(page);
  check((await page.evaluate(()=>window.__asked)).length===1&&!(await reds(page))[0].cur,'a GB-1 for “Ann” asks before taking the DD-1 of “Anna Smith”');
  check(errsOf(log).length===0,'no console or page errors');await page.close();

  /* ---------- 3. TB-1 simulated: one skill objective per skill, and the sentences ---------- */
  console.log('\n=== 3. TB-1 simulated, then GB-1 fresh');
  log=[];page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/index.html');await sleep(900);
  const tb=await openForm(page,'TB-1');
  await tb.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});
  await page.waitForFunction(()=>state.facts&&(state.facts.behaviors||[]).length>=5,null,{timeout:25000}).catch(()=>{});await sleep(1200);
  const facts=await page.evaluate(()=>(state.facts.behaviors||[]).map(b=>({label:b.label,isRep:!!b.isRep,rep:b.rep||''})));
  console.log('  the case: '+JSON.stringify(facts));
  gb=await openForm(page,'GB-1');await sleep(1500);
  const A=await acqs(gb),RR=await reds(gb);
  console.log('  acquisition: '+JSON.stringify(A.map(a=>a.beh+' | replaces '+a.pair)));
  console.log('  reduction:   '+JSON.stringify(RR.map(r=>r.beh+' | paired with '+r.pair)));
  check(A.length===2,'two acquisition objectives, one per replacement skill (were five)',A.map(a=>a.beh));
  check(A[0]&&A[0].beh==='Break request'&&A[0].pair==='Aggression; Self-injury – head hitting; Elopement','A1: Break request, replacing the three behaviors that share it',A[0]);
  check(A[1]&&A[1].beh==='Engages with a competing item from the A-CSA list'&&A[1].pair==='Arranging and ordering (higher-level RRB)','A2: the competing item, without its staff note',A[1]);
  check(RR.length===4&&RR.slice(0,3).every(r=>r.pair==='Break request')&&RR[3].pair==='Engages with a competing item from the A-CSA list','each reduction objective is paired with the skill by its one name',RR.map(r=>r.pair));
  check(/will make a break request /.test(A[0]&&A[0].out)&&/will engage with a competing item from the A-CSA list /.test(A[1]&&A[1].out),'the cards read "will make a break request" and "will engage with a competing item ..."',A.map(a=>a.out.slice(0,160)));
  const bip=await gb.evaluate(()=>window.__bipText());fs.writeFileSync(OUT+'bip-tb1.txt',bip);
  const al=bip.split('\n').filter(l=>/^A\d+\. /.test(l));
  check(al.length===2,'Copy for the BIP: two acquisition objectives',al);
  check(!/\(see\b/i.test(bip)&&!/\(replacement\)/i.test(bip)&&!/\bwill [A-Z]/.test(bip)&&!/will (?:Hands|Break|Engages)/.test(bip),'Copy for the BIP: no staff note, no "(replacement)", nothing capitalized after "will"');
  check(/will make a break request \[\.\.\.\] across/.test(bip)&&/will engage with a competing item from the A-CSA list \[\.\.\.\]/.test(bip)&&/Replaces: Aggression; Self-injury – head hitting; Elopement/.test(bip)&&/Paired with: Break request/.test(bip),'Copy for the BIP reads as English for TB-1’s simulated case');
  const objLines=bip.split('\n').filter(l=>/^[RA]\d+\. /.test(l));
  check(objLines.length===6&&objLines.every(l=>!/;/.test(l)&&!/\b(?:in|given|at|during) [A-Z][a-z]+ [a-z]/.test(l)),'the contexts and conditions TB-1 gives read inside the sentence (no capital after "in" or "given", no semicolon)',objLines.filter(l=>/;/.test(l)||/\b(?:in|given|at|during) [A-Z][a-z]+ [a-z]/.test(l)));
  console.log(bip.split('\n').map(l=>'  | '+l).join('\n'));
  /* the picker: every behavior ticked adds reduction objectives, but no second objective for a skill */
  await gb.evaluate(()=>document.querySelector('#nbhCaseBtn').click());await sleep(300);
  await gb.evaluate(()=>{document.querySelectorAll('#nbhcBody input').forEach(c=>c.checked=c.dataset.kind==='beh');document.querySelector('#nbhcUse').click();});await sleep(500);
  const A2=await acqs(gb);
  check(A2.filter(a=>a.beh==='Break request').length===1&&A2.filter(a=>/competing item/.test(a.beh)).length===1&&A2.length===2,'the picker adds no second objective for a skill already on the form',A2.map(a=>a.beh));
  const e4=errsOf(log);check(e4.length===0,'no console or page errors in part 3',e4.slice(0,3));
  await page.close();

  /* ---------- 4. typed labels, an old file ---------- */
  console.log('\n=== 4. Typed labels, and a file saved before');
  log=[];page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1200);
  /* the plan's three (an action, a name, a plain form), TB-1's own, and labels the review found worded badly: verbs off
     the list, a subject, an opening phrase, a semicolon, adverbs, a list of names, a quotation, an abbreviation */
  const LABELS=[['Requests a break','will request a break'],['Break request','will make a break request'],['ask for help','will ask for help'],
    ['Hands a break card and waits (see target 4)','will hand a break card and wait'],
    ['Participates in group activities','will participate in group activities'],['Cooperates with peers','will cooperate with peers'],
    ['Demonstrates safe body','will demonstrate safe body'],['Utilizes coping strategies','will utilize coping strategies'],
    ['Seeks attention appropriately','will seek attention appropriately'],['Gains adult attention appropriately','will gain adult attention appropriately'],
    ['Advocates for a break','will advocate for a break'],['Self-regulates','will self-regulate'],['Self-advocates','will self-advocate'],
    ['Calms down','will calm down'],['Problem-solves','will problem-solve'],['Apologizes','will apologize'],['Brushes teeth','will brush teeth'],
    ['Ties shoes','will tie shoes'],['Is on task','will be on task'],['Manages frustration','will manage frustration'],
    ['Maintains appropriate personal space','will maintain appropriate personal space'],['Displays appropriate behavior','will display appropriate behavior'],
    ['Exhibits on-task behavior','will exhibit on-task behavior'],['The student requests a break','will request a break'],
    ['The student hands a break card','will hand a break card'],['Student will request a break using the card','will request a break using the card'],
    ['When frustrated, requests a break','will request a break when frustrated'],['Given a demand, hands the break card','will hand the break card when given a demand'],
    ['Requests a break; waits for adult','will request a break and wait for adult'],
    ['Independently and appropriately requests a break','will independently and appropriately request a break'],
    ['Makes requests and comments','will make requests and comments'],['"I need a break"','will say "I need a break"'],
    ['Words to express feelings','will use words to express feelings'],['Safe hands','will keep safe hands'],['Calm body','will keep a calm body'],
    ['On-task behavior','will demonstrate on-task behavior'],['PECS exchange','will make a PECS exchange'],['FCT response','will make an FCT response'],
    ['Replacement behavior: requests a break','will request a break']];
  const typedSkill=(l,who)=>page.evaluate(([l,who])=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    if(who!=null)s('m.client',who);s('acq[0].beh',l);return {out:document.querySelector('[data-out="acq0"]').textContent,field:document.querySelector('[name="acq[0].beh"]').value,bip:window.__bipText()};},[l,who]);
  let badWords=[];
  for(const [lab,want] of LABELS){const got=await typedSkill(lab);
    if(!(got.out.includes(' '+want+' [criterion]')&&got.field===lab&&got.bip.includes(' '+want+' [...]')))badWords.push([lab,want,got.out.replace(/^.*?will /,'will ').slice(0,90)]);}
  check(!badWords.length,LABELS.length+' typed skills read correctly after "will" on the card and in Copy for the BIP, and each field keeps the words as typed',badWords);
  {const got=await typedSkill('Jordan requests a break','Jordan Rivera');
    check(got.out.includes('Jordan Rivera will request a break [criterion]'),'the student’s own name at the start of a skill is left out: '+got.out.slice(0,140));
    await typedSkill('','');}
  /* contexts and conditions: a linking word starts in lower case whatever follows it; a name stays as typed */
  const CTXS=[['In Room 12',' in Room 12 over '],['During PE',' during PE over '],['Jordan at recess',' in Jordan at recess over '],['Christmas break',' in Christmas break over '],
    ['Independent academic work in Room 12; occasionally at the bus line',' in independent academic work in Room 12, occasionally at the bus line over '],
    ['Given a demand',' given a demand over '],['The Smith classroom',' in the Smith classroom over ']];
  const CONDS=[['A demand presented',', given a demand presented, '],['When Ms. Lee gives a demand',', when Ms. Lee gives a demand, '],['Given a demand',', given a demand, '],
    ['The break card within reach',', given the break card within reach, '],['Every independent academic demand in Room 12',', given every independent academic demand in Room 12, ']];
  const badCtx=await page.evaluate(([C,D])=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};const bad=[];
    C.forEach(([v,w])=>{s('red[0].ctx',v);const t=document.querySelector('[data-out="red0"]').textContent;if(!t.includes(w))bad.push([v,t]);});
    D.forEach(([v,w])=>{s('acq[0].cond',v);const t=document.querySelector('[data-out="acq0"]').textContent;if(!t.includes(w))bad.push([v,t]);});
    s('red[0].ctx','');s('acq[0].cond','');return bad;},[CTXS,CONDS]);
  check(!badCtx.length,'contexts and conditions: "in Room 12", "during PE", "in Jordan at recess", "in Christmas break", "when Ms. Lee gives a demand", "given a demand" once',badCtx);
  /* a file saved before this change */
  await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'GB-1_old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(OLD_GB1));await sleep(600);
  const old=await page.evaluate(()=>({red:document.querySelector('[data-out="red0"]').textContent,acq:document.querySelector('[data-out="acq0"]').textContent,cur:document.querySelector('[name="red[0].cur"]').value,n:document.querySelectorAll('#redWrap .card').length+document.querySelectorAll('#acqWrap .card').length}));
  check(old.n===2&&old.cur==='1.4 per minute'&&/will decrease their rate per minute of Aggression toward staff \(simulated\) from 1\.4 per minute to no more than 0\.2 per minute/.test(old.red)&&/will hand the break card to an adult \(simulated\) independently in at least 80% of opportunities/.test(old.acq),'a file saved before opens with the same objectives and sentences',old);
  /* a file saved before, typed in the old style: its fields open as typed, and its sentences follow the new wording */
  const OLD2=JSON.parse(JSON.stringify(OLD_GB1));Object.assign(OLD2.f,{'acq[0].beh':'Requests a break','red[0].ctx':'Math class; lunch','acq[0].cond':'A demand presented'});
  await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'GB-1_old2.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(OLD2));await sleep(600);
  const old2=await page.evaluate(()=>({beh:document.querySelector('[name="acq[0].beh"]').value,ctx:document.querySelector('[name="red[0].ctx"]').value,cond:document.querySelector('[name="acq[0].cond"]').value,red:document.querySelector('[data-out="red0"]').textContent,acq:document.querySelector('[data-out="acq0"]').textContent}));
  check(old2.beh==='Requests a break'&&old2.ctx==='Math class; lunch'&&old2.cond==='A demand presented'&&/ in math class, lunch over /.test(old2.red)&&/given a demand presented, SIMULATED – Sample Student will request a break independently/.test(old2.acq),'an old-style record: the fields open as typed, and the sentences read "in math class, lunch", "given a demand presented", "will request a break"',old2);
  const e5=errsOf(log);check(e5.length===0,'no console or page errors in part 4',e5.slice(0,3));
  await page.close();

  /* ---------- 5. the same objectives from today's case and from a case whose names TB-1 already cleaned ---------- */
  console.log('\n=== 5. Today’s case and the cleaned case give the same objectives');
  const TODAY=[{label:'Aggression',rep:'Hands a break card and waits (see target 4)',ctx:'Independent academic work in Room 12; occasionally at the bus line'},
    {label:'Self-injury – head hitting',rep:'Hands a break card and waits'},{label:'Elopement',rep:'Hands a break card and waits'},
    {label:'Break request (replacement)',isRep:true,rep:'',ctx:'Every independent academic demand in Room 12'},
    {label:'Arranging and ordering (higher-level RRB)',rep:'Engages with a competing item from the A-CSA list (see Forms EA-1 and TD-1)'}];
  const CLEAN=TODAY.map(b=>Object.assign({},b,{label:b.label.replace(' (replacement)',''),rep:b.rep?(/see target 4|^Hands/.test(b.rep)?'Break request':b.rep.replace(' (see Forms EA-1 and TD-1)','')):''}));
  const placed=[];
  for(const behaviors of [TODAY,CLEAN]){log=[];page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1000);
    await page.evaluate(b=>window.nbhCase.apply({behaviors:b,src:{behaviors:'TB-1'}}),behaviors);await sleep(300);
    placed.push({red:(await reds(page)).map(r=>r.beh+' | '+r.pair+' | '+r.out),acq:(await acqs(page)).map(a=>a.beh+' | '+a.pair+' | '+a.cond+' | '+a.out),bip:await page.evaluate(()=>window.__bipText())});
    check(errsOf(log).length===0,'no console or page errors placing the '+(behaviors===TODAY?'case as TB-1 passes it today':'cleaned case'));await page.close();}
  check(JSON.stringify(placed[0])===JSON.stringify(placed[1])&&placed[0].acq.length===2,'the same objectives, pairings and sentences from both',{today:placed[0].acq,clean:placed[1].acq});

  /* ---------- 6. "see target N" after a target card with no name; a behavior added later to a skill on the form ---------- */
  console.log('\n=== 6. Pointers past a blank target, and the picker’s pairing');
  /* TB-1's cards: 1 Calling out, 2 (no name, left out of the case), 3 Elopement, 4 Raises hand (replacement), 5 Break request (replacement) */
  const BLANK=[{label:'Calling out',rep:'Raises hand and waits to be called on (see target 4)'},{label:'Elopement',rep:'Hands a break card and waits (see target 5)'},
    {label:'Raises hand (replacement)',isRep:true,rep:'',ctx:'Group instruction'},{label:'Break request (replacement)',isRep:true,rep:'',ctx:'Independent work'}];
  const NUMBERED=BLANK.map((b,i)=>Object.assign({n:[1,3,4,5][i]},b));
  const WANT={red:['Calling out | Raises hand','Elopement | Break request'],acq:['Raises hand | Calling out','Break request | Elopement']};
  for(const [name,behaviors] of [['in the case’s order',BLANK],['by the numbers the case gives',NUMBERED]]){
    log=[];page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1000);
    await page.evaluate(b=>window.nbhCase.apply({behaviors:b,src:{behaviors:'TB-1'}}),behaviors);await sleep(300);
    const got={red:(await reds(page)).map(r=>r.beh+' | '+r.pair),acq:(await acqs(page)).map(a=>a.beh+' | '+a.pair)};
    check(JSON.stringify(got)===JSON.stringify(WANT),'a blank target card before them: "see target 4" and "see target 5" find Raises hand and Break request, '+name,got);
    check(errsOf(log).length===0,'no console or page errors');await page.close();
  }
  /* the picker adds Spitting, which shares Break request: A1 now replaces it too; a pairing typed by hand is kept and named */
  const FOUR=TODAY.slice(0,4),SPIT={label:'Spitting',rep:'Hands a break card and waits'};
  for(const typed of ['','R1 — aggression']){
    log=[];page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/'+ED+'/'+GB);await sleep(1000);
    await page.evaluate(b=>window.nbhCase.apply({behaviors:b,src:{behaviors:'TB-1'}}),FOUR);await sleep(300);
    if(typed)await page.evaluate(v=>{const e=document.querySelector('[name="acq[0].pair"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},typed);
    const res=await page.evaluate(([all,s])=>window.__nbhFactsPick({behaviors:[s],goals:{red:[],acq:[]},menu:[],fn:null,facts:{behaviors:all.concat([s])}}),[FOUR,SPIT]);
    const A6=await acqs(page),R6=await reds(page);
    if(!typed)check(A6.length===1&&A6[0].pair==='Aggression; Self-injury – head hitting; Elopement; Spitting'&&R6[3]&&R6[3].beh==='Spitting'&&R6[3].pair==='Break request'&&/Replaces: Aggression; Self-injury – head hitting; Elopement; Spitting/.test(await page.evaluate(()=>window.__bipText())),'the picker adds Spitting to the skill it shares: A1 replaces it too, and R4 is paired with Break request',{res,A6:A6.map(a=>a.pair),R6:R6.map(r=>r.beh+' | '+r.pair)});
    else check(A6.length===1&&A6[0].pair===typed&&/A1 already says what it replaces \(“R1 — aggression”\), so Spitting was not added to it\./.test(res.note||''),'a pairing typed by hand is kept, and the picker says Spitting was not added to it',{res,pair:A6[0]&&A6[0].pair});
    check(errsOf(log).length===0,'no console or page errors');await page.close();
  }
  await br.close();
  console.log('\nFAILURES: '+fails);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
