/* v25.74 privacy audit, the remaining items: the turns taken by questions and by cases, and three boxes on forms that kept
   something of the record before. Simulated people only: "Mateo Rivera" (ID 4471823), "Priya Nandakumar" (5530917).
   Q  Two questions asked at once (the workstation has one question box). The second used to replace the first on screen, and
      the first was never answered: whatever waited for it never went on. Now each waits its turn; a box closed by another
      route counts as Cancel; a tap in the first moment of a question that waited answers nothing (it was meant for the
      question before); a question asked alone takes its answer at once, as before.
   T  Two cases opened one right after the other, the first slow to open (a case with media inside waits for the store).
      The first used to take the screen back when it was ready, over the case asked for last; and a background copy made
      meanwhile left the last student's form where the first student's next safety copy picked it up, when that form was
      slow to answer. Now the case asked for last has the screen, and no safety copy holds another student's form.
   W  Close case, slow to finish (its safety copy), overtaken by a case opened meanwhile: the close used to clear the case
      opened after it. Now the close stands down.
   L  Caseload read the kept students, waited, and put the whole row of the student on screen back: a newer save of that
      student made in the wait was lost, and a student removed in the wait came back. Now only the summary is written, into
      the row as it is then.
   F  "Back where you left off: (student) ... Start fresh". After another student was opened the strip stayed, naming the
      first; Start fresh then closed the student opened since and deleted that student's safety copy. Now the strip goes
      with its case, and a tap in that moment closes nothing.
   R  Form RS-1: a name typed to sign with (the supervisor's, the RBT's) stayed in its box after the person's own Open and
      after Clear all. A restore by the workstation or Undo leaves it, as before.
   I  Form IA-1: the box for a new group of informants (the name typed, the informants to tick) stayed after Open and
      Clear all. A restore by the workstation or Undo leaves it.
   B  Forms CF-1, IN-1 and SV-1: a link copied by hand from the dialog was on no record, so a reply box whose only link
      went out that way was let go without the question when the form became another student's. Now the box keeps that a
      link went out (no name), and the form asks. A box no link has left is let go as before (Preview is not a link).
   usage: WS_URL=http://127.0.0.1:8160 node qa/v2573-privacy-rest-test.js [Q T W L F R I B]   results in qa/out/v2573-privacy-rest/
   WS_EDITION=RPS-Workstation runs it on the school edition. */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;const {spawn}=require('child_process');
const ED=L.ED||'NBH-Workstation';
const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
const A={client:'Mateo Rivera',sid:'4471823',grade:'4',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const B={client:'Priya Nandakumar',sid:'5530917',grade:'2',site:'Royal Palm School',bcba:'J. Ellis, BCBA'};
const A_MARKS=[/Mateo/i,/Rivera/i,/4471823/],B_MARKS=[/Priya/i,/Nandakumar/i,/5530917/];
const marks=(text,M)=>M.filter(re=>re.test(String(text||''))).map(String);
const OUT=path.join(__dirname,'out','v2573-privacy-rest');fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.argv.slice(2).filter(a=>/^[A-Z]$/.test(a)),want=k=>!ONLY.length||ONLY.includes(k);
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;return !!c;};
const errs=[];let br=null;

/* ---------------- the workstation ---------------- */
async function ctx(){const c=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',acceptDownloads:true});
  await c.addInitScript(()=>{try{if(window.top===window){['nbh','rps'].forEach(e=>localStorage.setItem('nbh.ws.where@'+e,'files'));localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});return c;}
async function shell(c,tag,keep){const p=await c.newPage();p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));
  p.__dl=[];p.on('download',async d=>{try{const f=path.join(OUT,tag+'-'+p.__dl.length+'-'+d.suggestedFilename());await d.saveAs(f);p.__dl.push({name:d.suggestedFilename(),file:f});}catch(e){}});
  await p.goto(L.shellUrl());await sleep(2500);
  if(!keep)await p.evaluate(async()=>{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));try{await window.nbhCopies.clear();}catch(e){}try{await hxWipe();}catch(e){}
    ['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  return p;}
const frameOf=(p,id)=>p.frames().find(f=>f!==p.mainFrame()&&L.frameIs(f,id,FILE[id]));
async function setBar(p,o){await p.evaluate(o=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v||'';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',o.client);set('#pSid',o.sid);set('#pGrade',o.grade);set('#pSite',o.site);set('#pBcba',o.bcba);},o);await sleep(300);}
async function openForm(p,id){await p.evaluate(id=>openForm(id),id);await p.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:60000});await sleep(1300);return frameOf(p,id);}
const put=(fr,name,v)=>fr.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');if(!e)return false;const set=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;
  set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[name,v]);
async function answer(p,titleRe,btnRe,ms){const t=Date.now();while(Date.now()-t<(ms||15000)){
  const r=await p.evaluate(([tr,br])=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;if(!new RegExp(tr).test(t))return null;
    const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(br).test(x.textContent));if(!b)return null;b.click();return {t};},[titleRe.source,btnRe.source]).catch(()=>null);
  if(r)return r;await sleep(60);}return null;}
async function closeBoxes(p){return await p.evaluate(()=>{const out=[];['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open){out.push((d.querySelector('#cfTitle,#dlgTitle,h2,h3')||d).textContent.trim().slice(0,200));const b=[...d.querySelectorAll('button')].find(x=>/^(OK|Close|Not now|It is in Files)$/.test(x.textContent.trim()));if(b)b.click();else d.close();}});return out;}).catch(()=>[]);}
/* a student with one form (Form TB-1, a definition that names them), saved, so the caseload keeps the case; left on screen */
async function makeKept(p,who){await setBar(p,who);const fr=await openForm(p,'TB-1');
  await put(fr,'tgt[0].lab','Leaving the seat');await put(fr,'tgt[0].def',who.client+' ('+who.sid+') leaves the seat without permission (simulated).');await sleep(900);
  const n0=p.__dl.length;await p.evaluate(()=>{$('#saveCase').click();});
  const t=Date.now();while(Date.now()-t<60000&&p.__dl.length<=n0){await answer(p,/another student/,/Save anyway/,200);await sleep(150);}
  await answer(p,/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);await closeBoxes(p);await sleep(800);return p.__dl.length>n0;}
const shut=async p=>{await p.evaluate(()=>clearCase());await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000});await sleep(500);};
const kept=p=>p.evaluate(async()=>((await clList())||[]).map(r=>({key:r.key,client:r.client,text:r.text,saved:r.saved,sum:r.sum?1:0,later:r.laterMark||''})));
const screen=p=>p.evaluate(()=>({client:$('#pClient').value,sid:$('#pSid').value,frames:Object.keys(state.frames),pending:Object.keys(state.pending),cur:state.cur}));
/* the shell's request to one form for one verb reaches the form ms late: the form answers late */
async function hold(p,id,verb,ms){await p.evaluate(([id,verb,ms])=>{const p0=window.__post0||(window.__post0=post);window.__holds=window.__holds||[];window.__holds.push({id,verb,ms});
  if(!window.__postHeld){window.__postHeld=true;post=function(fr,msg){const h=window.__holds.find(h=>msg&&msg.nbh===h.verb&&state.frames[h.id]===fr);
    if(h){const w=fr.contentWindow;setTimeout(()=>{try{w.postMessage(msg,'*');}catch(e){}},h.ms);return;}return p0(fr,msg);};}},[id,verb,ms]);}
/* an edit in a form counts as work once the form has taken the opened case as its start (about 4 s after it is filled) */
async function work(p,fr,name,v){await sleep(4600);await put(fr,name,v);for(let i=0;i<40;i++){await sleep(250);if(await p.evaluate(()=>!!(state.status['TB-1']||{}).edited))return true;}return false;}
/* a background copy, now: one already being written is waited for, then one is written and waited for */
const copyNow=p=>p.evaluate(async()=>{const A=state.auto,idle=async()=>{for(let i=0;i<150&&A.busy;i++)await new Promise(r=>setTimeout(r,100));};await idle();A.again=false;A.last=0;await autoSave(true);await idle();});
const copies=p=>p.evaluate(async()=>((await window.nbhCopies.list())||[]).map(r=>({student:r.student||'',forms:Object.keys(r.forms||{}),text:JSON.stringify(r.forms||{})})));

/* ---------------- Q: questions wait their turn ---------------- */
async function scenQ(){console.log('\n== Q: two questions at once: each waits its turn ==');const c=await ctx(),p=await shell(c,'Q');
  const box=()=>p.evaluate(()=>{const d=$('#cfDlg');return {open:d.open,title:$('#cfTitle').textContent,btns:[...$('#cfFoot').querySelectorAll('button')].map(b=>b.textContent)};});
  const press=t=>p.evaluate(t=>{const b=[...$('#cfFoot').querySelectorAll('button')].find(x=>x.textContent===t);if(!b||!$('#cfDlg').open)return false;b.click();return true;},t);
  const got=()=>p.evaluate(()=>Object.assign({},window.__q));
  await p.evaluate(()=>{window.__q={};wsUI.confirm('First question (simulated)?\nIts own words.',{ok:'Yes to the first'}).then(v=>{__q.a=v;});
    wsUI.choose('Second question (simulated)?',[{v:'x',label:'Pick X',kind:'primary'},{v:'y',label:'Pick Y'}]).then(v=>{__q.b=v;});});
  await sleep(350);const b1=await box();
  ok('Q1 two questions asked at once: the first is the one on screen',b1.open&&/^First question/.test(b1.title)&&b1.btns.includes('Yes to the first'),b1);
  const pr=await press('Yes to the first');await sleep(60);let q=await got();
  ok('Q2 its own button answers it (it used to be replaced on screen and never answered)',pr&&q.a===true&&q.b===undefined,{pr,q});
  const b2=await box();
  ok('Q3 the second question then has the screen, with its own buttons',b2.open&&/^Second question/.test(b2.title)&&b2.btns.join('|')==='Pick X|Pick Y',b2);
  const early=await press('Pick X');await sleep(80);q=await got();
  ok('Q4 a tap in the first moment of a question that waited answers nothing (it was meant for the question before)',early&&q.b===undefined&&(await box()).open,{early,q});
  await sleep(500);await press('Pick Y');await sleep(100);q=await got();
  ok('Q5 after that moment its button answers it, with its own answer',q.b==='y'&&!(await box()).open,q);
  /* three at once; the box closed by another route; a typed answer; Escape */
  await p.evaluate(()=>{window.__q={};wsUI.confirm('Third question (simulated)?',{ok:'OK three'}).then(v=>{__q.c=v;});
    wsUI.prompt('Fourth question: a word (simulated)',{label:'Word'}).then(v=>{__q.d=v;});
    wsUI.confirm('Fifth question (simulated)?',{ok:'OK five'}).then(v=>{__q.e=v;});});
  await sleep(300);await p.evaluate(()=>$('#cfDlg').close());await sleep(200);q=await got();let b=await box();
  ok('Q6 a question whose box is closed by another route is answered Cancel, and the next question is shown',q.c===false&&q.d===undefined&&b.open&&/^Fourth question/.test(b.title),{q,b});
  await sleep(500);await p.evaluate(()=>{const i=$('#cfFoot input');if(i)i.value='word-7';});await press('OK');await sleep(150);q=await got();b=await box();
  ok('Q7 a typed answer goes to the question that asked for it, and the last question is shown',q.d==='word-7'&&q.e===undefined&&b.open&&/^Fifth question/.test(b.title),{q,b});
  await sleep(500);await p.keyboard.press('Escape');await sleep(200);q=await got();
  ok('Q8 Escape is Cancel for the question on screen; none is left open or unanswered',q.e===false&&!(await box()).open&&Object.keys(q).length===3,q);
  await p.evaluate(()=>{window.__q={};wsUI.confirm('A question asked alone (simulated)?',{ok:'Yes alone'}).then(v=>{__q.f=v;});});await sleep(40);await press('Yes alone');await sleep(80);q=await got();
  ok('Q9 a question asked alone takes its answer at once, as before',q.f===true&&!(await box()).open,q);
  await c.close();}

/* ---------------- T: two cases opened one right after the other ---------------- */
async function scenT(){console.log('\n== T: two cases opened one right after the other, the first slow to open ==');const c=await ctx(),p=await shell(c,'T');
  const ka=await makeKept(p,A);await shut(p);const kb=await makeKept(p,B);await shut(p);
  const rows=await kept(p),ra=rows.find(r=>/Mateo/.test(r.client||'')),rb=rows.find(r=>/Priya/.test(r.client||''));
  if(!ok('T footing: both students are kept, each case with only its own student',ka&&kb&&!!ra&&!!rb&&!marks(ra.text,B_MARKS).length&&!marks(rb.text,A_MARKS).length&&marks(ra.text,A_MARKS).length===3&&marks(rb.text,B_MARKS).length===3,{ka,kb,rows:rows.map(r=>r.client)})){await c.close();return;}
  /* the first student's case waits for the media store, as a case with media inside does; the second is asked for 300 ms later */
  await p.evaluate(([ta,tb])=>{const h0=mediaHas,i0=mediaIn,first=d=>!!(d&&d.packet&&/Mateo/.test(d.packet.client||''));window.__mi={};
    mediaHas=function(d){return first(d)?true:h0.apply(this,arguments);};
    mediaIn=function(d){if(first(d)){window.__mi.wait=1;return new Promise(r=>{window.__miGo=()=>{window.__mi.gone=1;r(d);};});}return i0.apply(this,arguments);};
    window.__o={};openCaseText(ta,null,{asked:true,quiet:true}).then(()=>{__o.a=1;},e=>{__o.a=String(e);});
    setTimeout(()=>{openCaseText(tb,null,{asked:true,quiet:true}).then(()=>{__o.b=1;},e=>{__o.b=String(e);});},300);},[ra.text,rb.text]);
  await p.waitForFunction(()=>/Priya/.test($('#pClient').value)&&!!state.status['TB-1']&&!state.pending['TB-1'],null,{timeout:20000}).catch(()=>{});await sleep(1500);
  const s1=await screen(p),w1=await p.evaluate(()=>window.__mi);
  ok('T footing: the first case is still waiting for its media, and the second, asked for after it, is on screen',w1.wait===1&&!w1.gone&&/Priya/.test(s1.client)&&s1.frames.includes('TB-1'),{s1,w1});
  /* work in the second student's form, and a background copy of it */
  let fr=frameOf(p,'TB-1');const e1=await work(p,fr,'tgt[0].excl','Not counted when Priya Nandakumar (5530917) is sent to the office (simulated).');
  await copyNow(p);await sleep(400);
  const c1=await copies(p);
  ok('T footing: a safety copy of the second student’s work is written while the first case still waits',e1&&c1.some(r=>/Priya/.test(r.student)&&marks(r.text,B_MARKS).length>0),{edited:e1,copies:c1.map(r=>({student:r.student,forms:r.forms}))});
  /* from here Form TB-1 is slow to answer the workstation's reading of it (30 s); then the first case's media arrive */
  await hold(p,'TB-1','snapshot',30000);await p.evaluate(()=>window.__miGo());await sleep(4000);
  const s2=await screen(p);
  ok('T1 the case asked for last has the screen once both have settled (the first used to take it back)',/Priya/.test(s2.client)&&s2.sid===B.sid,s2);
  fr=frameOf(p,'TB-1');const inForm=fr?await fr.evaluate(()=>({who:(document.querySelector('[name="m.client"]')||{}).value||'',def:(document.querySelector('[name="tgt[0].def"]')||{}).value||''})).catch(()=>null):null;
  ok('T2 its form holds its own student (the name box, the definition)',!!inForm&&/Priya/.test(inForm.who+inForm.def)&&!marks(inForm.who+' '+inForm.def,A_MARKS).length,inForm);
  /* whoever is on screen now: an edit is made, and a background copy is written while the form is slow to answer */
  const e2=fr?await work(p,fr,'tgt[0].ex','A later line typed in the case on screen (simulated).'):false;
  await copyNow(p);await sleep(600);
  const dbg=await p.evaluate(()=>({key:state.auto.key,forms:Object.keys(state.auto.forms),g:Object.values(state.auto.forms).map(f=>f.g),gen:state.caseGen,clean:caseClean(),st:state.status['TB-1'],warn:state.auto.warn||''}));if(process.env.DBG)console.log('  dbg',JSON.stringify(dbg));
  const c2=await copies(p),cross=c2.filter(r=>(/Mateo/.test(r.student)&&marks(r.text,B_MARKS).length)||(/Priya/.test(r.student)&&marks(r.text,A_MARKS).length));
  if(process.env.DBG)console.log('  copies',JSON.stringify(c2.map(r=>({student:r.student,forms:r.forms,a:marks(r.text,A_MARKS).length,b:marks(r.text,B_MARKS).length}))));
  ok('T3 no safety copy holds a form of another student (a slow form used to put the last student’s form into the next student’s copy)',e2&&c2.length>0&&!cross.length,{edited:e2,copies:c2.map(r=>({student:r.student,forms:r.forms})),cross:cross.map(r=>({student:r.student,marks:marks(r.text,A_MARKS).concat(marks(r.text,B_MARKS))}))});
  const o=await p.evaluate(()=>window.__o);
  ok('T4 both requests ended (neither is left waiting)',o.a===1&&o.b===1,o);
  await c.close();}

/* ---------------- W: Close case overtaken by a case opened meanwhile ---------------- */
async function scenW(){console.log('\n== W: a close that is slow to finish does not clear the case opened after it ==');const c=await ctx(),p=await shell(c,'W');
  await makeKept(p,B);await shut(p);await makeKept(p,A);
  const rows=await kept(p),rb=rows.find(r=>/Priya/.test(r.client||''));const s0=await screen(p);
  if(!ok('W footing: the first student is on screen, the second is kept',/Mateo/.test(s0.client)&&!!rb,{s0,rows:rows.map(r=>r.client)})){await c.close();return;}
  /* the close's own safety copy takes 2.5 s longer (the first wait for it is the close's) */
  await p.evaluate(tb=>{const s0=autoSeal;let k=0;autoSeal=async function(){const mine=++k;await s0.apply(this,arguments);if(mine===1)await new Promise(r=>setTimeout(r,2500));};
    window.__w={};clearCase().then(v=>{__w.close=v===undefined?'done':v;});
    setTimeout(()=>{openCaseText(tb,null,{asked:true,quiet:true}).then(()=>{__w.open=1;});},250);},rb.text);
  await sleep(6500);const s1=await screen(p),w=await p.evaluate(()=>window.__w);
  ok('W1 the case opened after the close was pressed is on screen, with its form (the close used to clear it)',/Priya/.test(s1.client)&&s1.sid===B.sid&&(s1.frames.includes('TB-1')||s1.pending.includes('TB-1')),{s1,w});
  ok('W2 the close stood down, and the open ended',w.close==='left'&&w.open===1,w);
  await c.close();}

/* ---------------- L: the Caseload's write of the summary ---------------- */
async function scenL(){console.log('\n== L: Caseload does not put back a row it read before a wait ==');const c=await ctx(),p=await shell(c,'L');
  await makeKept(p,A);const r0=(await kept(p)).find(r=>/Mateo/.test(r.client||''));
  if(!ok('L footing: the student on screen is kept',!!r0,await kept(p))){await c.close();return;}
  /* a save of this student lands just after Caseload has read the list (stood in for: the row is changed in that moment,
     after each reading of the list while Caseload opens; each change adds its number to the row, so one put back over
     is missing from it). Then, in the same moment of the reading Caseload's own write follows, the student is removed. */
  await p.evaluate(()=>{const l0=clList,t0=clTx;window.__L={on:false,calls:0,rw:[],mode:'',at:0};
    clTx=function(mode){if(mode==='readwrite'&&__L.on)__L.rw.push(__L.calls);return t0.apply(this,arguments);};
    clList=async function(){const L=await l0.apply(this,arguments);if(!__L.on)return L;const k=++__L.calls,how=__L.mode,key=clKey(packet());
      if(how==='save'||(how==='del'&&k===__L.at))await t0('readwrite',st=>{const g=st.get(key);g.onsuccess=()=>{const row=g.result;if(!row)return;if(how==='del'){st.delete(key);return;}
        row.text=row.text+'\n';row.log=(row.log||[]).concat([k]);row.saved=new Date(Date.now()+60000+k*1000).toISOString();st.put(row);};return g;});
      return L;};});
  const run=mode=>p.evaluate(async([mode,at])=>{Object.assign(__L,{on:true,calls:0,rw:[],mode,at});await caseloadOpen();await new Promise(r=>setTimeout(r,600));__L.on=false;
    const row=((await clList())||[]).find(r=>/Mateo/.test(r.client||''));return {calls:__L.calls,rw:__L.rw.slice(),row:row?{log:row.log||[],text:row.text,saved:row.saved,sum:row.sum?1:0}:null};},[mode,at]);
  let at=0;const a=await run('save'),all=Array.from({length:a.calls},(_,i)=>i+1);at=a.rw[0]||0;
  ok('L1 a save made while Caseload was opening is kept, whichever reading of the list it follows (the row read before used to be put back over it): '+a.calls+' readings, none lost',
    !!a.row&&a.calls>0&&a.row.log.join()===all.join()&&a.row.text===r0.text+'\n'.repeat(a.calls)&&a.row.saved>r0.saved,{calls:a.calls,rw:a.rw,log:a.row&&a.row.log,newlines:a.row?a.row.text.length-r0.text.length:null});
  ok('L2 the summary Caseload shows is still written into that row',!!a.row&&a.row.sum===1&&a.rw.length>=1,{sum:a.row&&a.row.sum,rw:a.rw});
  await closeBoxes(p);const d=await run('del');
  const shown=await p.evaluate(()=>[...document.querySelectorAll('#dlgBody .cl-card[data-clrow]')].map(x=>x.textContent.replace(/\s+/g,' ').slice(0,60)));
  ok('L3 a student removed while Caseload was opening stays removed, and is not listed (the row used to be put back)',at>0&&!d.row&&!shown.some(t=>/Mateo/.test(t)),{at,row:!!d.row,shown});
  await c.close();}

/* ---------------- F: Start fresh on the strip after a switch ---------------- */
async function scenF(){console.log('\n== F: "Back where you left off ... Start fresh" after another student is opened ==');const c=await ctx();let p=await shell(c,'F');
  await makeKept(p,B);await shut(p);await makeKept(p,A);await sleep(3200);
  const pl=await p.evaluate(()=>window.__ws2570&&__ws2570.placeRead());await p.close();
  /* 2 minutes later (the kept time set back, on a page of the same site that is not the workstation) */
  const pm=await c.newPage();await pm.goto(L.BASE+'/'+ED+'/manifest.json');
  await pm.evaluate(()=>{const k=Object.keys(localStorage).find(x=>/^nbh\.ws\.place\|/.test(x));if(!k)return;const o=JSON.parse(localStorage.getItem(k));o.at=new Date(Date.now()-120000).toISOString();localStorage.setItem(k,JSON.stringify(o));});await pm.close();
  p=await shell(c,'F2',true);
  const strip=()=>p.evaluate(()=>{const s=document.querySelector('#wsResume');return s&&!s.hidden?s.textContent.replace(/\s+/g,' ').trim():'';});
  let st='';for(let i=0;i<40;i++){await sleep(500);st=await strip();if(st&&/Mateo/.test((await screen(p)).client))break;}
  if(!ok('F footing: opened again, the first student’s case is back with the strip "Back where you left off: Mateo Rivera ... Start fresh"',!!pl&&/^Back where you left off: Mateo Rivera/.test(st)&&/Start fresh/.test(st),{pl:!!pl,st,s:await screen(p)})){await c.close();return;}
  await sleep(1500);const kb=(await kept(p)).find(r=>/Priya/.test(r.client||''));
  await p.evaluate(k=>{caseloadGo(k,'');},kb.key);
  for(let i=0;i<30;i++){await answer(p,/^Switch to/,/Switch anyway/,150);if(/Priya/.test((await screen(p)).client))break;await sleep(200);}
  await p.waitForFunction(()=>/Priya/.test($('#pClient').value),null,{timeout:20000}).catch(()=>{});await sleep(1300);
  const s1=await screen(p),st1=await strip();
  ok('F1 with the second student on screen the strip about the first is gone (it used to stay, naming the first)',/Priya/.test(s1.client)&&!st1,{s1,st1});
  /* work in the second student's form, kept in a safety copy; then the strip's Start fresh, tapped in that moment */
  const fr=await openForm(p,'TB-1').catch(()=>null);if(fr)await work(p,fr,'tgt[0].excl','Typed for Priya Nandakumar after the switch (simulated).');
  await copyNow(p);await sleep(400);const c0=await copies(p);
  await p.evaluate(()=>{const b=document.querySelector('#wsResume .wr-f');if(b)b.click();});await sleep(2500);await answer(p,/^Close this case/,/Cancel/,300);
  const s2=await screen(p),c1=await copies(p);
  ok('F2 Start fresh, tapped in that moment, does not close the student opened since',/Priya/.test(s2.client)&&s2.frames.includes('TB-1'),s2);
  ok('F3 nor delete that student’s safety copy',c0.some(r=>/Priya/.test(r.student))&&c1.some(r=>/Priya/.test(r.student)&&marks(r.text,B_MARKS).length>0),{before:c0.map(r=>r.student),after:c1.map(r=>r.student)});
  await c.close();}

/* ---------------- the forms on their own ---------------- */
async function formPage(id){const c=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});await c.addInitScript(()=>{window.print=function(){};});
  const pg=await c.newPage();pg.on('pageerror',e=>errs.push(id+': '+String(e.message||e).slice(0,240)));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(L.formUrl(encodeURI(FILE[id])),{waitUntil:'load',timeout:60000});await pg.waitForFunction(()=>window.nbhBridge&&window.nbhBridge.ownSave,null,{timeout:30000});await sleep(900);
  await pg.evaluate(()=>{window.confirm=()=>true;});return {c,pg};}
const own=pg=>pg.evaluate(()=>window.nbhBridge.ownSave());
/* the person's own Open: a file put in the form's file box */
async function openFile(pg,text){await pg.setInputFiles('#fileIn',{name:'saved.json',mimeType:'application/json',buffer:Buffer.from(text,'utf8')});await sleep(1100);}
/* Clear all, answered yes */
async function clearAll(pg){await pg.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(700);
  await pg.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('.u-f button:last-child');if(b)b.click();}});await sleep(1500);}
/* a restore as the workstation or Undo makes it (quiet) */
const quietOpen=(pg,text)=>pg.evaluate(t=>window.nbhBridge.ownOpen(t),text).then(()=>sleep(900));
const typeIn=(pg,sel,v)=>pg.evaluate(([s,v])=>{const e=document.querySelector(s);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,v]);

async function scenR(){console.log('\n== R: Form RS-1, the names typed to sign with ==');const {c,pg}=await formPage('RS-1');
  const SUP='Dana Whitfield, BCBA (simulated)',RBT='Jordan Blake, RBT (simulated)';
  const blank=await own(pg);await L.loadSim(pg);await sleep(1500);const filled=await own(pg);
  const typed=async()=>{await pg.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button')].find(x=>/sign/i.test(x.textContent));if(b)b.click();});await sleep(400);
    await typeIn(pg,'#ts_sup',SUP);await typeIn(pg,'#ts_rbt',RBT);await pg.evaluate(()=>document.querySelectorAll('[data-tsok]').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));}));await sleep(200);};
  const now=()=>pg.evaluate(()=>({sup:document.querySelector('#ts_sup').value,rbt:document.querySelector('#ts_rbt').value,ticked:[...document.querySelectorAll('[data-tsok]')].filter(x=>x.checked).length}));
  await typed();const t0=await now();
  ok('R footing: the simulation is loaded and both names are typed, the boxes ticked',filled!==blank&&t0.sup===SUP&&t0.rbt===RBT&&t0.ticked>=1,t0);
  await openFile(pg,blank);let t=await now();
  ok('R1 the person’s own Open of another saved RS-1: the typed names and ticks are gone (they used to stay)',!t.sup&&!t.rbt&&!t.ticked,t);
  await openFile(pg,filled);await typed();await clearAll(pg);t=await now();
  ok('R2 Clear all: the typed names and ticks are gone (they used to stay)',!t.sup&&!t.rbt&&!t.ticked,t);
  await openFile(pg,filled);await typed();await quietOpen(pg,filled);t=await now();
  ok('R3 a restore by the workstation or Undo leaves a name being typed, as before',t.sup===SUP&&t.rbt===RBT,t);
  await c.close();}

async function scenI(){console.log('\n== I: Form IA-1, the box for a new group of informants ==');const {c,pg}=await formPage('IA-1');
  const NAME='Mateo Rivera’s classroom team (simulated)',INF='Rosa Rivera (simulated)';
  const blank=await own(pg);
  const typed=async()=>{await typeIn(pg,'[name="inf[0].name"]',INF);await sleep(300);
    await pg.evaluate(()=>{const b=document.getElementById('anNewBox');if(b.hidden)document.getElementById('anNew').click();});await sleep(300);await typeIn(pg,'#anNewName',NAME);await sleep(150);};
  const now=()=>pg.evaluate(()=>({name:document.getElementById('anNewName').value,open:!document.getElementById('anNewBox').hidden,pick:document.getElementById('anNewPick').textContent.replace(/\s+/g,' ').trim()}));
  await typed();const t0=await now();
  ok('I footing: the box is open, a name is typed in it, and it lists the informant to tick',t0.open&&t0.name===NAME&&/Rosa Rivera/.test(t0.pick),t0);
  await openFile(pg,blank);let t=await now();
  ok('I1 the person’s own Open of another saved IA-1: the box is closed and empty (the name and the last record’s informants used to stay)',!t.name&&!t.open&&!t.pick,t);
  await typed();await clearAll(pg);t=await now();
  ok('I2 Clear all: the box is closed and empty',!t.name&&!t.open&&!t.pick,t);
  await typed();const mine=await own(pg);await quietOpen(pg,mine);t=await now();
  ok('I3 a restore by the workstation or Undo leaves a name being typed, as before',t.name===NAME&&t.open,t);
  await c.close();}

/* the reply box: the repo's own box.php on 127.0.0.1, its data in qa/out */
async function box(port){const data=path.join(OUT,'box-'+port);fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+port,'-t',path.join(L.ROOT,'tools','reply-box','public_html','reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','ignore']});
  const url='http://127.0.0.1:'+port+'/box.php';let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(url+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  if(!up){php.kill();throw new Error('box.php did not start (php is needed for scenario B)');}return {url,php};}
const qBox=async(pg,ms)=>{const t=Date.now();while(Date.now()-t<ms){const q=await pg.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(!d||!d.open)return null;return {head:document.getElementById('nbhUiH').textContent,btns:[...document.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)};}).catch(()=>null);
  if(q)return q;await sleep(80);}return null;};
const qAnswer=async(pg,re)=>{const r=await pg.evaluate(src=>{const b=[...document.querySelectorAll('#nbhUiF button')].find(x=>new RegExp(src).test(x.textContent));if(b)b.click();return !!b;},re.source);await sleep(400);return r;};
const meta=(pg,o)=>pg.evaluate(o=>{const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('client',o.client);set('sid',o.sid||'');set('bcba','Simulated BCBA');set('email','simulated.bcba@example.org');},o);
/* Respondent pages opened, the reply box at this address, registered */
async function dlgOpen(pg,url){await pg.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(400);
  await pg.evaluate(u=>{const m=document.querySelector('#rpEmail');if(m&&!m.value){m.value='simulated.bcba@example.org';m.dispatchEvent(new Event('input',{bubbles:true}));}
    const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},url);
  await pg.waitForFunction(()=>{const b=__rp.kit.rb().box;return !!(b&&b.site);},null,{timeout:10000});await sleep(300);}
const boxNow=pg=>pg.evaluate(()=>{const r=__rp.kit.rb(),b=r.box,k=window.NBH_RESPOND;return {id:b&&b.id||'',stu:b&&b.stu||'',out:b&&b.out||0,kept:b?((k.rbNorm(JSON.parse(JSON.stringify(r))).box||{}).out||0):0,sends:r.sends.filter(s=>s.sent||s.back).length,
  rec:JSON.stringify(r),dlg:document.querySelector('#rpDlg').open,note:(document.querySelector('#rbNote')||{}).textContent||'',link:!document.querySelector('#rpLink').disabled};});
async function scenB(){console.log('\n== B: a reply box whose only link was copied by hand is not let go without the question ==');const bx=await box(8473);
  try{for(const id of ['CF-1','IN-1','SV-1']){
    /* a link copied by hand, then the form becomes another student's */
    {const {c,pg}=await formPage(id);await meta(pg,A);await dlgOpen(pg,bx.url);const a=await boxNow(pg);
      const hand=await pg.evaluate(()=>{const u=__rp.link();const m=/#(.*)$/.exec(u);return {len:u.length,has:!!m};});
      ok('B '+id+' footing: Respondent pages is open with a reply box made for the first student, and no link has gone out',!!a.id&&/^Mateo/.test(a.stu)&&!a.out&&!a.sends&&a.link&&hand.has,{a:{id:!!a.id,stu:a.stu,out:a.out,sends:a.sends,link:a.link},hand});
      await pg.locator('#rpLink').click();await sleep(1200);const b=await boxNow(pg);
      ok('B '+id+' Copy a link: the box keeps that a link went out, in the form’s record, through a save and an open; no name is added',b.out===1&&b.kept===1&&b.id===a.id&&b.rec.replace(/"out":1,?/,'').length<=a.rec.length+2,{out:b.out,kept:b.kept,same:b.id===a.id,grew:b.rec.length-a.rec.length});
      await pg.evaluate(()=>document.querySelector('#rpDlg').close());await meta(pg,B);await sleep(400);
      await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,3000);const mid=await boxNow(pg);
      ok('B '+id+' the form is now another student’s: it asks before the box is changed (it used to start a new box without a word, and the answer to the copied link came to no form)',!!q&&/^Is .*Priya.* the same student as Mateo R\.\?$/.test(q.head)&&mid.id===a.id,{q,sameBox:mid.id===a.id,note:mid.note});
      if(q){await qAnswer(pg,/^Cancel$/);const can=await boxNow(pg);
        ok('B '+id+' Cancel: nothing changes, the first student’s box stays',can.id===a.id&&/^Mateo/.test(can.stu)&&!can.dlg,{same:can.id===a.id,stu:can.stu,dlg:can.dlg});}
      await c.close();}
    /* control: no link left the form (Preview is not a link): no question, the form starts its own box as before */
    {const {c,pg}=await formPage(id);await meta(pg,A);await dlgOpen(pg,bx.url);const a=await boxNow(pg);
      await pg.evaluate(()=>{window.open=()=>null;document.querySelector('#rpPreview').click();});await sleep(500);const b=await boxNow(pg);
      await pg.evaluate(()=>document.querySelector('#rpDlg').close());await meta(pg,B);await sleep(400);
      await pg.evaluate(()=>document.querySelector('#rpBtn').click());const q=await qBox(pg,1800);
      await pg.waitForFunction(x=>{const y=__rp.kit.rb().box;return !!(y&&y.site&&y.id!==x);},a.id,{timeout:8000}).catch(()=>{});const d=await boxNow(pg);
      ok('B '+id+' control: Preview is not a link going out; with none gone out there is no question and the form starts its own box, as before',!b.out&&!q&&!!d.id&&d.id!==a.id&&/starts a reply box of its own/.test(d.note),{out:b.out,asked:!!q,newBox:d.id!==a.id,note:d.note});
      await c.close();}}
    /* the other two buttons that send a page out by hand, on Form CF-1 */
    for(const sel of ['#rpSave','#rpMail']){const {c,pg}=await formPage('CF-1');await meta(pg,A);await dlgOpen(pg,bx.url);
      await pg.locator(sel).click();await sleep(900);const b=await boxNow(pg);
      ok('B CF-1 '+(sel==='#rpSave'?'Save the page as a file':'Email it')+': the box keeps that a page went out',b.out===1,{out:b.out});await c.close();}
  }finally{try{bx.php.kill();}catch(e){}}}

(async()=>{br=await L.chromium.launch();
  for(const [k,fn] of [['Q',scenQ],['T',scenT],['W',scenW],['L',scenL],['F',scenF],['R',scenR],['I',scenI],['B',scenB]]){if(!want(k))continue;
    try{await fn();}catch(e){ok(k+': the scenario ran to its end',false,String(e&&e.stack||e).slice(0,500));}}
  ok('no page error',!errs.length,errs.slice(0,4));
  await br.close();console.log('\n'+(n-fails)+' of '+n+' checks passed');process.exit(fails?1:0);})();
