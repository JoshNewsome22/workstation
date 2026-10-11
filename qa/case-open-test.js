/* v21.61 a case opens at once (NBH-Workstation/index.html: state.pending, loadCase, afterLoad, warmTick):
   1. Open case lists the case's forms and loads one, the form that was open when the case was saved (cur), within a few seconds;
      the others show in the rail with a hollow dot and the file's field count; the case is not marked unsaved.
   2. A form tapped from the list loads and is filled from the file within a few seconds.
   3. Typing holds the quiet loading; left alone, the rest load one by one, off screen, and are put away; the case stays as saved.
   4. Save case right after Open case writes every form, the ones not loaded exactly as the file held them, with the form to open first.
   5. Close case clears the waiting forms too; a file without cur opens its first form; an edit marks the case unsaved, Save case
      clears it, and the forms that load quietly afterwards do not mark it unsaved again. No page errors.
   usage: node qa/case-open-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const OUT=__dirname+'/out/case-open/';fs.mkdirSync(OUT,{recursive:true});
const same=(x,y)=>{const ks=Object.keys(x||{});if(!ks.length)return 0;let eq=0;ks.forEach(k=>{if(String(x[k])===String((y||{})[k]))eq++;});return eq/ks.length;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const log=[];wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};}catch(e){}});   /* wsUI is a script constant, not a window property */
  /* a case of six filled forms, made from the simulations through the shell's own snapshots; TB-1 first in the file, RA-1 the form that was open */
  const IDS=['TB-1','FS-1','PA-1','RA-1','DD-1','OB-1'];
  let made=await page.evaluate(async IDS=>{const forms={};for(const id of IDS){openForm(id);const fr=state.frames[id];await new Promise(r=>{fr.addEventListener('load',r,{once:true});setTimeout(r,20000);});
      const t=performance.now();while(!state.status[id]&&performance.now()-t<10000)await new Promise(r=>setTimeout(r,50));
      try{const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,1800));}}catch(e){}
    }
    /* v21.81 as a real Save case is: the forms have each other's case facts, then each is read, and the facts go in the file */
    await gatherFacts(true);await new Promise(r=>setTimeout(r,3000));await gatherFacts(true);await new Promise(r=>setTimeout(r,2000));
    for(const id of IDS){const sn=await grab(id,'snapshot',null,8000);if(sn&&sn.snap)forms[id]={title:sn.title||id,snap:sn.snap};}
    return {forms,facts:state.facts};},IDS);
  const facts=made.facts,madeForms=made.forms;made=madeForms;
  const d={form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:{client:'Case Open Test',sid:'C-1',grade:'4',site:'Test',bcba:'T'},forms:madeForms,facts,cur:'RA-1'};
  ok('the six forms were simulated and snapped',Object.keys(made).length===6&&IDS.every(id=>made[id]&&Object.keys(made[id].snap.data).length>20),IDS.map(id=>id+':'+(made[id]?Object.keys(made[id].snap.data).length:0)));
  fs.writeFileSync(OUT+'case.json',JSON.stringify(d));
  /* 1. Open case, while something is being typed (so the quiet loading waits and the checks are exact) */
  await page.evaluate(()=>{window.__typing=setInterval(()=>{state.lastInput=Date.now();},300);});
  const t0=Date.now();await page.evaluate(t=>openCaseText(t,null),JSON.stringify(d));const opened=Date.now()-t0;
  const a=await page.evaluate(()=>({frames:Object.keys(state.frames),pending:Object.keys(state.pending),cur:state.cur,order:state.caseOrder,dirty:caseDirty(),warm:!!state.warm,
    saved:document.querySelectorAll('#rail .dot.saved').length,labels:[...document.querySelectorAll('#rail .item')].filter(li=>li.querySelector('.dot.saved')).map(li=>li.dataset.id+':'+li.querySelector('.st').textContent.replace(/\D.*$/,'')),
    raStatus:(state.status['RA-1']||{}).filled,client:$('#pClient').value,status:Object.keys(state.status),shown:[...document.querySelectorAll('#frames iframe')].filter(f=>!f.hidden).map(f=>f.title)}));
  ok('Open case returns within a few seconds with one form loaded and shown: RA-1, the form that was open when the case was saved',opened<9000&&a.frames.join()==='RA-1'&&a.cur==='RA-1'&&a.status.join()==='RA-1'&&a.raStatus>20&&a.shown.length===1&&/RA-1/.test(a.shown[0]),{opened,a});
  ok('the other five forms are listed from the file, a hollow dot with the file\'s field count; the case is not marked unsaved; the quiet loading is armed',a.pending.length===5&&a.saved===5&&a.labels.length===5&&a.labels.every(l=>+l.split(':')[1]>20)&&!a.dirty&&a.warm&&a.client==='Case Open Test'&&a.order.join()===IDS.join(),a);
  /* 2. a form tapped from the list */
  const tap=await page.evaluate(async()=>{const t=performance.now();openForm('DD-1');await settled('DD-1',20000);const ms=performance.now()-t;const sn=await grab('DD-1','snapshot',null,8000);return{ms:Math.round(ms),cur:state.cur,pending:Object.keys(state.pending),data:sn&&sn.snap&&sn.snap.data,dirty:caseDirty(),shown:[...document.querySelectorAll('#frames iframe')].filter(f=>!f.hidden).map(f=>f.title)};});
  const m2=same(made['DD-1'].snap.data,tap.data);
  ok('a form tapped from the list loads and is filled from the file within a few seconds and is shown; the case stays as saved',tap.cur==='DD-1'&&tap.ms<8000&&tap.pending.length===4&&!tap.dirty&&m2>.97&&tap.shown.length===1&&/DD-1/.test(tap.shown[0]),{ms:tap.ms,pending:tap.pending,dirty:tap.dirty,match:m2,shown:tap.shown});
  /* 3. typing holds the quiet loading; left alone it runs */
  await sleep(3000);
  const held=await page.evaluate(()=>Object.keys(state.frames));
  ok('while something is being typed, no other form loads',held.length===2,held);
  await page.evaluate(()=>{clearInterval(window.__typing);});
  const t1=Date.now();
  await page.waitForFunction(()=>Object.keys(state.pending).length===0&&!state.warm,null,{timeout:90000}).catch(()=>{});
  const b=await page.evaluate(()=>({frames:Object.keys(state.frames),pending:Object.keys(state.pending),warm:!!state.warm,cur:state.cur,dirty:caseDirty(),
    look:[...document.querySelectorAll('#frames iframe')].map(f=>f.title.replace(/.*\(Form /,'').replace(')','')+':'+(f.hidden?'hidden':f.classList.contains('warm')?'warm':'shown')),status:Object.keys(state.status).length}));
  ok('left alone, the rest load quietly one by one: all six in, only the open form shown, none left off screen, the case still as saved',b.frames.length===6&&!b.pending.length&&!b.warm&&b.status===6&&!b.dirty&&b.look.filter(x=>/shown/.test(x)).length===1&&b.look.includes('DD-1:shown')&&!b.look.some(x=>/warm/.test(x)),{ms:Date.now()-t1,b});
  const tb=await page.evaluate(async()=>{const sn=await grab('TB-1','snapshot',null,8000);return sn&&sn.snap&&sn.snap.data;});
  ok('a form loaded quietly holds what the file held for it',same(made['TB-1'].snap.data,tb)>.97,same(made['TB-1'].snap.data,tb));
  /* 4. Save case right after Open case, with five forms still waiting */
  await page.evaluate(()=>{window.__typing=setInterval(()=>{state.lastInput=Date.now();},300);});
  await page.evaluate(t=>openCaseText(t,null),JSON.stringify(d));
  const dl=page.waitForEvent('download',{timeout:30000});
  const savedOk=await page.evaluate(()=>saveCase());
  const file=await dl;await file.saveAs(OUT+'saved.json');const sv=JSON.parse(fs.readFileSync(OUT+'saved.json','utf8'));
  await sleep(3200);   /* the Save case dot is repainted on its own timer */
  const after=await page.evaluate(()=>({frames:Object.keys(state.frames),pending:Object.keys(state.pending),dirty:caseDirty(),dot:$('#saveQuick').classList.contains('dirty')}));
  ok('Save case writes all six forms, the five not loaded exactly as the file held them, in the file\'s order, with the form to open first; the case is marked saved',
    savedOk===true&&Object.keys(sv.forms).join()===IDS.join()&&['TB-1','FS-1','PA-1','DD-1','OB-1'].every(id=>JSON.stringify(sv.forms[id].snap)===JSON.stringify(made[id].snap))&&sv.cur==='RA-1'&&after.frames.join()==='RA-1'&&after.pending.length===5&&!after.dirty&&!after.dot,{savedOk,keys:Object.keys(sv.forms),cur:sv.cur,after});
  /* 5. Close case; a file without cur; an edit, Save case, the quiet loads after it */
  await page.evaluate(()=>{clearInterval(window.__typing);});
  const dl3=page.waitForEvent('download',{timeout:30000}).catch(()=>null);
  await page.evaluate(()=>$('#closeCase').click());await dl3;await sleep(2500);
  const c=await page.evaluate(()=>({frames:Object.keys(state.frames),pending:Object.keys(state.pending),warm:!!state.warm,order:state.caseOrder,client:$('#pClient').value}));
  ok('Close case clears the forms still waiting with the rest',!c.frames.length&&!c.pending.length&&!c.warm&&!c.order.length&&!c.client,c);
  const d2=Object.assign({},d);delete d2.cur;
  await page.evaluate(t=>openCaseText(t,null),JSON.stringify(d2));
  const e=await page.evaluate(()=>({cur:state.cur,first:state.caseOrder[0]}));
  ok('a case file without the form to open first opens the first form in the file',e.cur==='TB-1'&&e.first==='TB-1',e);
  const dirt=await page.evaluate(async()=>{const w=state.frames['TB-1'].contentWindow;const i=[...w.document.querySelectorAll('textarea[name],input[type="text"][name],input[name]:not([type])')].find(x=>!x.readOnly&&!x.disabled&&x.offsetParent!==null&&!/^m\./.test(x.name));   /* v21.81 a saved field of the form, not the student's details (the bar writes those back) */i.value=(i.value||'')+' x';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,4800));return caseDirty();});
  ok('an edit in the open form marks the case unsaved',dirt===true);
  const dl2=page.waitForEvent('download',{timeout:30000});const s2=await page.evaluate(()=>saveCase());await dl2;
  await page.waitForFunction(()=>Object.keys(state.pending).length===0&&!state.warm,null,{timeout:90000}).catch(()=>{});await sleep(5500);
  const f=await page.evaluate(()=>({dirty:caseDirty(),frames:Object.keys(state.frames).length,pending:Object.keys(state.pending).length}));f.saved=s2;
  ok('after Save case, the forms that load quietly afterwards do not mark the case unsaved',s2===true&&!f.dirty&&f.frames===6&&!f.pending,f);
  const errs=log.filter(l=>l.type==='pageerror');
  ok('no page errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
