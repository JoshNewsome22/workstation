/* v23.57 (review Wave 4, I239, F469): a case opens to the one form you came for.
   1. Open DD-1 on a student's caseload card loads DD-1 first and alone (not the form that was open when the case was saved),
      fast; the case's other forms are listed from the file and none loads in the background, left alone.
   2. A form the case does not hold yet opens on its own; the case's forms stay listed, none loaded.
   3. What each form has due goes into the file with it: Today's Due list holds a form not loaded, from the file; Save case
      writes the due dates of the forms not loaded and of the loaded ones; Close case clears them.
   4. Open case from a file still opens the form that was open when it was saved; a device with nbh.warm = on keeps the
      quiet loading. Simulated student only.  usage: node qa/i239-one-form-test.js */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,800):''));if(!c)fails++;};
const OUT=__dirname+'/out/i239/';fs.mkdirSync(OUT,{recursive:true});
const ymd=t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
const inDays=n=>{const t=new Date();t.setDate(t.getDate()+n);return ymd(t);};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const log=[];wire(page,log);
  try{
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};wsUI.choose=async()=>'switch';}catch(e){}try{localStorage.removeItem('nbh.warm');}catch(e){}});
  /* a case of four forms from the simulations; FS-1 the form that was open; FS-1 has something due (as its file says) */
  const IDS=['TB-1','FS-1','DD-1','PA-1'];
  const forms=await page.evaluate(async IDS=>{const forms={};for(const id of IDS){openForm(id);const fr=state.frames[id];await new Promise(r=>{fr.addEventListener('load',r,{once:true});setTimeout(r,20000);});
      const t=performance.now();while(!state.status[id]&&performance.now()-t<10000)await new Promise(r=>setTimeout(r,50));
      try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1800));}}catch(e){}}
    for(const id of IDS){const sn=await grab(id,'snapshot',null,8000);if(sn&&sn.snap)forms[id]={title:sn.title||id,snap:sn.snap};}
    return forms;},IDS);
  ok('the four forms were simulated and snapped',IDS.every(id=>forms[id]&&Object.keys(forms[id].snap.data).length>20),Object.keys(forms));
  forms['FS-1'].due=[{what:'Review the hypothesis (simulated)',date:inDays(3)}];
  const packet={client:'Mateo Rivera (simulated)',sid:'4471823',grade:'4',site:'Test Elementary (simulated)',bcba:'Jordan Ellis (simulated)'};
  const d={form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet,forms,cur:'FS-1'};
  /* the student kept on this device, as Save case keeps them */
  const key=await page.evaluate(async t=>{await openCaseText(t,null,{asked:true,quiet:true});const p=packet();await caseloadKeep(p,parseCase(t).forms,[]);
    return clKey(p);},JSON.stringify(d)).catch(e=>'ERR '+e);
  const due0=await page.evaluate(()=>({due:(state.due||[]).map(x=>x.id+':'+x.what),today:(()=>{try{return todayItems().filter(x=>x.k==='Due').map(x=>x.open);}catch(e){return 'ERR '+e;}})(),frames:Object.keys(state.frames)}));
  ok('3a Today\'s Due list holds FS-1\'s date from the file while FS-1 is not loaded',due0.due.includes('FS-1:Review the hypothesis (simulated)')&&due0.today.includes('FS-1'),due0);
  /* close it (the file's copy is the caseload's), then open DD-1 from the caseload card */
  await page.evaluate(async()=>{try{await clearCase();}catch(e){state.frames&&Object.values(state.frames).forEach(f=>f.remove());}});
  await sleep(600);
  const cleared=await page.evaluate(()=>({due:(state.due||[]).length,all:Object.keys(state.dueAll||{}).length,frames:Object.keys(state.frames).length,pending:Object.keys(state.pending).length}));
  ok('3d Close case clears the case\'s due dates with it',!cleared.due&&!cleared.all&&!cleared.frames&&!cleared.pending,cleared);
  const t0=Date.now();
  await page.evaluate(k=>caseloadGo(k,'DD-1'),key);const ms=Date.now()-t0;
  await page.evaluate(()=>settled('DD-1',15000));
  const a=await page.evaluate(()=>({frames:Object.keys(state.frames),cur:state.cur,pending:Object.keys(state.pending),warm:!!state.warm,dd:(state.status['DD-1']||{}).filled||0,client:$('#pClient').value}));
  ok('1a Open DD-1 on the card: DD-1 is loaded first and alone, filled from the file (not FS-1, the form that was open)',a.frames.join()==='DD-1'&&a.cur==='DD-1'&&a.dd>20&&a.pending.length===3&&!a.pending.includes('DD-1')&&a.client==='Mateo Rivera (simulated)',a);
  ok('1b and fast: no wait for another form first (it waited up to 12 s for FS-1)',ms<8000,{ms});
  await sleep(6000);
  const b=await page.evaluate(()=>({frames:Object.keys(state.frames),warm:!!state.warm,pending:Object.keys(state.pending)}));
  ok('1c left alone, no other form of the case loads in the background',b.frames.join()==='DD-1'&&!b.warm&&b.pending.length===3,b);
  /* 3b Save case: the due dates of a form not loaded, and of a loaded one, go into the file */
  await page.evaluate(()=>{const w=state.frames['DD-1'].contentWindow;w.__nbhDue=()=>[{what:'Next data review (simulated)',date:(t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'))(new Date(Date.now()+5*864e5))}];});
  await page.evaluate(()=>gatherDue());
  const dl=page.waitForEvent('download',{timeout:30000});
  const saved=await page.evaluate(()=>saveCase());const file=await dl;await file.saveAs(OUT+'saved.json');const sv=JSON.parse(fs.readFileSync(OUT+'saved.json','utf8'));
  ok('3b Save case writes FS-1\'s due date (not loaded) and DD-1\'s (loaded) with each form; the others none',saved===true&&JSON.stringify(sv.forms['FS-1'].due)===JSON.stringify(forms['FS-1'].due)&&
    sv.forms['DD-1'].due&&sv.forms['DD-1'].due[0].what==='Next data review (simulated)'&&!sv.forms['TB-1'].due&&!sv.forms['PA-1'].due&&JSON.stringify(sv.forms['TB-1'].snap)===JSON.stringify(forms['TB-1'].snap),{saved,fs:sv.forms['FS-1'].due,dd:sv.forms['DD-1'].due,tb:sv.forms['TB-1'].due});
  const due1=await page.evaluate(()=>(state.due||[]).map(x=>x.id).sort().join());
  ok('3c the Due list holds both, the loaded form\'s and the one from the file',due1==='DD-1,FS-1',due1);
  /* 2. a form the case does not hold */
  await page.evaluate(async()=>{try{await clearCase();}catch(e){}});await sleep(500);
  await page.evaluate(k=>caseloadGo(k,'BC-1'),key);await sleep(2500);
  const c=await page.evaluate(()=>({frames:Object.keys(state.frames),cur:state.cur,pending:Object.keys(state.pending).sort()}));
  ok('2 Open a form the case does not hold: it opens on its own; the case\'s forms are listed, none loaded',c.frames.join()==='BC-1'&&c.cur==='BC-1'&&c.pending.join()==='DD-1,FS-1,PA-1,TB-1',c);
  /* 4. Open case from a file; a device that keeps the quiet loading */
  await page.evaluate(async()=>{try{await clearCase();}catch(e){}});await sleep(500);
  await page.evaluate(t=>openCaseText(t,null,{asked:true,quiet:true}),JSON.stringify(d));
  const e=await page.evaluate(()=>({frames:Object.keys(state.frames),cur:state.cur,warm:!!state.warm}));
  ok('4a Open case from a file opens the form that was open when it was saved, and nothing loads behind it',e.frames.join()==='FS-1'&&e.cur==='FS-1'&&!e.warm,e);
  await page.evaluate(async()=>{try{await clearCase();}catch(e){}try{localStorage.setItem('nbh.warm','on');}catch(e){}});await sleep(500);
  await page.evaluate(t=>openCaseText(t,null,{asked:true,quiet:true}),JSON.stringify(d));
  const f=await page.evaluate(()=>({warm:!!state.warm}));
  await page.evaluate(()=>{try{localStorage.removeItem('nbh.warm');}catch(e){}});
  ok('4b a device with nbh.warm = on keeps the quiet loading',f.warm,f);
  const src=fs.readFileSync(require('path').join(__dirname,'..','NBH-Workstation','index.html'),'utf8');
  ok('5 Help says each of the others loads when it is opened (not quietly behind)',/each of the others loads when you open it/.test(src)&&!/the rest load quietly behind it/.test(src)&&!/and load quietly meanwhile/.test(src));
  const errs=log.filter(l=>l.type==='pageerror');
  ok('6 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
