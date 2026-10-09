/* v21.69 Form QS-1, the Staff Quick Start (NBH-Workstation/QS-1_Staff-Quick-Start_v2026-10.html; parts in tools/forms/QS-1):
   1. the form opens on its own without a script error; the simulation fills every page and the four pages and the flow
      sheet build; every page fits one letter page by the form's own measure, and the PDF has five pages;
   2. the review: a technical word typed on a page is listed back; the flow sheet off makes four pages;
   3. Save data and Open data give the same quick start back, the plan's words it still holds included;
   4. inside the workstation: with Forms DM-1, TB-1, FS-1, TD-1, CR-1 and GB-1 holding their simulations, QS-1 takes the case
      into its empty fields (the who box, the chain, the five things, the tiers, the record table, the skills, the tiles),
      each marked "from the plan, rewrite"; a rewrite takes the mark off; From the case appears on its toolbar;
   5. the packet bar's student reaches the Setup fields; no page errors anywhere.
   usage: node qa/qs1-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,BASE,wire,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const OUT=__dirname+'/out/qs1/';fs.mkdirSync(OUT,{recursive:true});
const FORM='QS-1_Staff-Quick-Start_v2026-10.html';
(async()=>{const br=await chromium.launch();const log=[];
  /* 1-3 on its own */
  let page=await br.newPage({viewport:{width:1024,height:1366}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+FORM,{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{nbhUI.confirm=async()=>true;}catch(e){}});
  const e0=log.filter(l=>l.type==='pageerror').length;
  await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(1200);
  const s1=await page.evaluate(()=>({view:document.body.className,pages:document.querySelectorAll('#out .qs-page').length,flow:document.querySelectorAll('#out .qs-flow').length,
    five:document.querySelectorAll('#out .qs-five li').length,tiers:document.querySelectorAll('#out [data-page="3"] .qs-t tbody tr').length,review:document.querySelector('#outReview').innerText,
    title:document.querySelector('#out .qs-band h1').textContent}));
  ok('1a the simulation builds four pages and the flow sheet on the Print view',/view-out/.test(s1.view)&&s1.pages===5&&s1.flow===1&&s1.five===5&&s1.tiers===5&&/Working with Sam/.test(s1.title),s1);
  ok('1b by the form’s own measure every page fits one letter page, nothing from the plan is left and no technical wording is found',/Every page fits/.test(s1.review)&&/Nothing placed/.test(s1.review)&&/No technical wording/.test(s1.review),s1.review);
  await page.pdf({path:OUT+'sim.pdf',format:'Letter',printBackground:true,preferCSSPageSize:true});
  const pdf=fs.readFileSync(OUT+'sim.pdf');const nPages=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
  ok('1c the PDF has five pages',nPages===5,{nPages});
  /* 2 the review */
  await page.evaluate(()=>setView('day'));await sleep(200);
  await page.fill('[data-k="newline"]','Offer two choices; this is an antecedent change on a VR schedule.');await sleep(500);
  const r2=await page.evaluate(()=>document.querySelector('#review').innerText);
  ok('2a a technical word typed on a page is listed back on Setup',/antecedent/.test(r2)&&/VR/.test(r2),r2);
  await page.fill('[data-k="newline"]','Offer two choices, then praise the try.');await sleep(500);
  await page.evaluate(()=>setView('flow'));await sleep(200);await page.selectOption('[data-k="flowOn"]','no');await sleep(500);
  const r2b=await page.evaluate(()=>({pages:document.querySelectorAll('#out .qs-page').length,foot:document.querySelector('#out .qs-foot span').textContent,prev:document.querySelectorAll('#flowPrev .qs-flow').length}));
  ok('2b with the flow sheet off the handout is four pages (the Flow view still shows it)',r2b.pages===4&&/Page 1 of 4/.test(r2b.foot)&&r2b.prev===1,r2b);
  await page.selectOption('[data-k="flowOn"]','yes');await sleep(300);
  /* 3 save and open */
  await page.evaluate(()=>{S.pulled['who']=S.who;renderMarks();});
  const before=await page.evaluate(()=>JSON.stringify(S));
  const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#saveBtn').click())]);
  const saved=fs.readFileSync(await dl.path(),'utf8');const sj=JSON.parse(saved);
  ok('3a Save data writes the form’s own file, the plan’s words it holds included',sj.form==='QS-1'&&sj.S&&sj.S.meta.first==='Sam'&&sj.S.pulled.who===sj.S.who&&/^QS-1_SIMULATED/.test(dl.suggestedFilename()),{name:dl.suggestedFilename(),pulled:Object.keys(sj.S.pulled||{})});
  await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(400);
  const empty=await page.evaluate(()=>({pages:document.querySelectorAll('#out .qs-page').length,who:S.who,title:document.querySelector('#out .qs-band h1').textContent}));
  await page.setInputFiles('#fileIn',{name:'qs.json',mimeType:'application/json',buffer:Buffer.from(saved)});await sleep(600);
  const after=await page.evaluate(()=>JSON.stringify(S));
  const marks=await page.evaluate(()=>{setView('who');return document.querySelectorAll('#edWho .qs-pull').length;});
  ok('3b Clear all empties it and Open data gives the same quick start back, the mark on the who box included',empty.who===''&&/the student/.test(empty.title)&&after===before&&marks===1,{empty,same:after===before,marks});
  const e1=log.filter(l=>l.type==='pageerror').length;
  ok('3c no page errors on its own',e1===e0,log.filter(l=>l.type==='pageerror').map(l=>l.text).slice(0,3));
  await page.close();
  /* 4-5 inside the workstation */
  page=await br.newPage({viewport:{width:1300,height:900}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{wsUI.confirm=async()=>true;}catch(e){}});
  await page.fill('#pClient','Mateo Rivera');await page.fill('#pSid','4471823');await page.fill('#pBcba','J. Newsome, BCBA');
  await page.evaluate(()=>{['#pClient','#pSid','#pBcba'].forEach(s=>document.querySelector(s).dispatchEvent(new Event('input',{bubbles:true})));});
  const settle=async id=>{const t=Date.now();while(Date.now()-t<20000&&!(await page.evaluate(id=>!!state.status[id],id)))await sleep(150);};
  for(const id of ['DM-1','TB-1','FS-1','TD-1','CR-1','GB-1']){await page.evaluate(i=>openForm(i,true),id);await settle(id);
    const fr=page.frames().find(f=>f.url().includes('/'+id+'_')||f.url().includes(id==='TB-1'?'TB-1_':id==='TD-1'?'TD-1_':id+'_'));if(fr){await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await loadSim(fr);await sleep(700);}}   /* the packet already fills the form, so its simulation asks first; nbhUI.confirm honours the stub */
  await sleep(7000);   /* the status poll (4 s) notices the new signatures and the shell re-reads the forms */
  if(!(await page.evaluate(()=>!!state.facts))){await page.evaluate(()=>gatherFacts(true));await sleep(4000);}
  const facts=await page.evaluate(()=>state.facts?Object.keys(state.facts).filter(k=>k!=='src'&&k!=='when'):null);
  ok('4a the case holds the other forms’ facts',!!facts&&['behaviors','fn','plan','crisis','goals','profile'].every(k=>facts.includes(k)),facts);
  await page.evaluate(()=>openForm('QS-1',true));await settle('QS-1');await sleep(2500);
  const fr=page.frames().find(f=>f.url().includes('QS-1_'));
  const got=await fr.evaluate(()=>({who:S.who,may:S.may,gets:S.gets,when:S.when,five:S.five.filter(x=>x.text).length,tiers:S.tiers.map(t=>[t.name,t.see,t.do].map(x=>!!x)),rec:S.rec.filter(r=>r.measure).map(r=>r.measure),
    skills:S.skills.filter(s=>s.name).map(s=>s.name),stats:S.stats.filter(s=>s.n).length,health:S.health,pulled:Object.keys(S.pulled).length,calls:S.calls.filter(c=>c.name).map(c=>c.name),
    btn:(()=>{const b=document.querySelector('#nbhCaseBtn');return b?(b.closest('.nbh-case-grp').hidden?'hidden':b.textContent):'none';})(),state:document.querySelector('#caseState').innerText.slice(0,160),client:S.meta.client,sid:S.meta.sid}));
  ok('4b QS-1 takes the case into its empty fields: the who box, the chain, the five things, the tiers, the record table and the skills',
    got.who.length>20&&got.may.length>3&&got.gets.length>3&&got.five>=3&&got.tiers.filter(t=>t[2]).length>=3&&got.rec.length>=2&&got.skills.length>=1&&got.pulled>=12,got);
  ok('4c the health line carries the precautions, the BCBA is a call card, and the Setup box and the toolbar say what came',/Precautions on file/.test(got.health)&&got.calls.some(c=>/Newsome/.test(c))&&/From the case:/.test(got.state)&&/From the case/.test(got.btn),{health:got.health,calls:got.calls,btn:got.btn});
  ok('5a the packet bar’s student and ID reached the Setup fields',got.client==='Mateo Rivera'&&got.sid==='4471823',{client:got.client,sid:got.sid});
  const m1=await fr.evaluate(()=>{setView('who');return {marks:document.querySelectorAll('#edWho .qs-pull').length,mayMark:!!document.querySelector('#edWho [data-mark="may"].qs-pull')};});
  await fr.fill('[data-k="may"]','Push the work away, or leave the room.');await sleep(400);
  const m2=await fr.evaluate(()=>({mayMark:!!document.querySelector('#edWho [data-mark="may"].qs-pull'),marks:document.querySelectorAll('#edWho .qs-pull').length,pulledNow:Object.keys(pulledNow()).length,review:document.querySelector('#review').innerText}));
  ok('4d each placed field is marked "from the plan, rewrite"; a rewrite takes the mark off and the Setup count follows',m1.marks>=4&&m1.mayMark&&!m2.mayMark&&m2.marks===m1.marks-1&&/still hold/.test(m2.review),{m1,m2:{mayMark:m2.mayMark,marks:m2.marks,pulledNow:m2.pulledNow}});
  const pages=await fr.evaluate(()=>{setView('out');return {pages:document.querySelectorAll('#out .qs-page').length,title:document.querySelector('#out .qs-band h1').textContent};});
  ok('4e the pages build from the case alone, titled for the student on the bar',pages.pages===5&&/Working with Mateo/.test(pages.title),pages);
  await page.screenshot({path:OUT+'shell.png'});
  const errs=log.filter(l=>l.type==='pageerror').map(l=>l.text);
  ok('5b no page errors anywhere',errs.length===0,errs.slice(0,3));
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.log('CRASH',e.message);process.exit(2);});
