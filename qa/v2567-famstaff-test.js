/* v25.67 (design review H9, M14, B5): one design for the page a parent or teacher answers on (respond.html, nbh-respond.js's
   runtime, which draws the IA-1, CF-1, IN-1 and SV-1 questionnaires) and the staff data page (staff-data.html).
   On a phone (390 x 844, touch) and an iPad held upright (1032 x 1376, touch):
   1. links made before still open (the four questionnaires in qa/data/respond-golden.json, an old #p= link);
   2. the head says about whom and from whom, how long it takes and that the answers are kept on this device; the form code and
      the citation are in the footer; the progress ("7 of 16") stays in view and is said politely;
   3. the answers survive a reload, and are cleared after a successful send (the reply box) or "I have sent my answers";
   4. one "Not sure" everywhere, scored as N/A and Unsure were (NA, unsure);
   5. what is sent is byte for byte what the page sent before for the same answers: the code, the email, the file, what goes
      to the reply box, and what each form reads from it (qa/data/v2567-famstaff-golden.json, made with --golden from the
      page before v25.67);
   6. the Send bar (Send, Copy my answers, Save as a file) stays in view and never covers the last question;
   7. the staff page: "Watching now" / "Not watching" with its one line of help, + dark green, − neutral with an outline,
      44 px targets, the same Send bar;
   8. 16 px text in boxes, 44 px targets, nothing wider than the screen, every control named, contrast 4.5:1, reduced motion;
      no page errors.
   Simulated data only.
   usage: node qa/v2567-famstaff-test.js     GOLDEN_URL=<a server with the page before v25.67> node qa/v2567-famstaff-test.js --golden */
const {chromium,fs,path,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(!c&&i!==undefined?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const GOLD=path.join(__dirname,'data','v2567-famstaff-golden.json');
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'data','respond-golden.json'),'utf8'));
const MAKE=process.argv.includes('--golden'),SRC=MAKE?(process.env.GOLDEN_URL||BASE):BASE;
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const NOW=new Date('2026-11-06T15:20:00');
const FORMS={'IA-1':'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html','CF-1':'CF-1_Contextual-Fit-Assessment_v2026-09.html','IN-1':'IN-1_Stakeholder-Interview-Record_v2026-09.html','SV-1':'SV-1_Social-Validity_v2026-09.html'};
const SIMBCBA='Jordan Ellis, M.A., BCBA (simulated)';
const b64=s=>Buffer.from(s,'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
/* the reply box seen from the page: what would be locked (the text before encryption) is kept, and the box answers ok */
const BOXSTUB=()=>{const S=crypto.subtle,e0=S.encrypt.bind(S);S.encrypt=function(a,k,data){(window.__plain=window.__plain||[]).push(new TextDecoder().decode(data));return e0(a,k,data);};
  window.fetch=async()=>new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json'}});};
/* the same simulated answers on the page before and after: about you, every item (with "Not sure" among them), the definition
   question (Not sure), the open answers; then Send */
async function fill(p,id){return p.evaluate(id=>{const fire=(e,t)=>e.dispatchEvent(new Event(t,{bubbles:true}));
  const T=['Sample parent','Parent','14','Classroom, lunch','Mornings'];let k=0;
  document.querySelectorAll('.grid2 input[type=text], .grid2 select').forEach(e=>{if(e.readOnly)return;if(e.tagName==='SELECT')e.value='Yes';else e.value=T[k++%T.length];fire(e,'input');fire(e,'change');});
  document.querySelectorAll('li.it').forEach((li,i)=>{const vals=[...li.querySelectorAll('input[type=radio]')].map(r=>r.value);const v=vals.includes('NA')&&i%4===2?'NA':vals[(i*3+1)%vals.length];li.querySelector('input[value="'+v+'"]').click();});
  const c=document.querySelector('input[name=nbhr-confirm][value=unsure]');if(c)c.click();
  document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value='Simulated answer '+(i+1);fire(t,'input');});
  document.querySelectorAll('.yns').forEach((y,i)=>{y.querySelectorAll('.opts label')[i%3].click();if(i===0){const n=y.querySelector('input[type=text]');n.value='simulated note';fire(n,'input');}});},id);}
async function sendAndGrab(p){return p.evaluate(async()=>{document.querySelector('button:not(.ghost)').click();await new Promise(r=>setTimeout(r,900));
  const code=document.querySelector('.code').value,mail=document.querySelector('#nbhr-mail').getAttribute('href');let file='';
  const sv=[...document.querySelector('#nbhr-mail').parentNode.querySelectorAll('button')].find(b=>b.textContent==='Save as a file');
  if(code&&sv){let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){};sv.click();URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;file=got?await got.text():'';}
  return {code,mail:mail==='#'?'':mail,file,plain:(window.__plain||[]).slice(),done:(document.querySelector('#nbhr-done')||{}).textContent||''};});}
async function readInForm(ctx,id,code){const p=await ctx.newPage();await p.goto(SRC+'/NBH-Workstation/'+FORMS[id]);await sleep(1200);
  await p.evaluate(c=>{window.confirm=()=>true;window.alert=()=>{};const b=document.querySelector('#rcBtn');if(b)b.click();if(window.rcText)rcText.value=c;__rp.read([c]);},code).catch(()=>{});await sleep(400);
  const t=await p.evaluate(()=>{const o=document.querySelector('#rcOut');return o?o.textContent.replace(/\s+/g,' ').trim():'';}).catch(e=>'error: '+e.message);await p.close();return t;}
const boxed=pl=>Object.assign(JSON.parse(JSON.stringify(pl)),{box:{u:'http://127.0.0.1:9/nbh-box',b:'0123456789abcdef0123456789abcdef',k:{x:'',y:''}}});
async function keyed(p,pl){const k=await p.evaluate(async()=>{const kp=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);const j=await crypto.subtle.exportKey('jwk',kp.publicKey);return {x:j.x,y:j.y};});pl.box.k=k;return pl;}
/* what a page sends for the four questionnaires: by email (the code, the mailto, the file), to the reply box, and what the form reads */
async function sends(br){const out={};const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE,serviceWorkers:'block'});
  await ctx.clock.setFixedTime(NOW);await ctx.addInitScript(BOXSTUB);
  const rctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});await rctx.clock.setFixedTime(NOW);   /* the form, as the BCBA opens it */
  const p0=await ctx.newPage();await p0.goto(SRC+'/NBH-Workstation/respond.html');await sleep(300);
  for(const id of Object.keys(FORMS)){const r={};
    let p=await ctx.newPage();await p.goto(SRC+'/NBH-Workstation/respond.html'+G[id].hash);await sleep(700);await fill(p,id);const m=await sendAndGrab(p);r.code=m.code;r.mail=m.mail;r.file=m.file;await p.close();
    const bp=await keyed(p0,boxed(G[id].payload));const h=await p0.evaluate(x=>NBH_RESPOND.payloadToHash(x),bp);
    p=await ctx.newPage();await p.goto(SRC+'/NBH-Workstation/respond.html'+h);await sleep(700);await fill(p,id);const b=await sendAndGrab(p);r.plain=b.plain;r.boxDone=/Sent\./.test(b.done);await p.close();
    r.read=await readInForm(rctx,id,r.code);out[id]=r;}
  await ctx.close();await rctx.close();return out;}
(async()=>{const br=await chromium.launch();const errs=[];
 try{
 if(MAKE){const g=await sends(br);fs.writeFileSync(GOLD,JSON.stringify({made:'v25.66 page, '+SRC,at:NOW.toISOString(),forms:g},null,1)+'\n');
   for(const [id,v] of Object.entries(g))console.log(id,'code',v.code.length,'mail',v.mail.length,'file',v.file.length,'box',v.plain.length,v.boxDone,'read',v.read.slice(0,80));
   await br.close();console.log('RESULT: golden written');process.exit(0);}
 const GG=JSON.parse(fs.readFileSync(GOLD,'utf8')).forms;
 /* ---- 5. byte for byte ---- */
 const now=await sends(br);
 for(const id of Object.keys(FORMS)){const a=now[id],b=GG[id];
   ok('5 '+id+': the code, the email and the file are byte for byte what the page sent before for the same answers',a.code&&a.code===b.code&&a.mail===b.mail&&a.file===b.file,{code:[a.code.length,b.code.length],mail:[a.mail.length,b.mail.length],file:[a.file.length,b.file.length]});
   ok('5 '+id+': what goes to the reply box is byte for byte the same, and the page says Sent.',a.plain.length===1&&a.plain[0]===b.plain[0]&&a.boxDone,{n:a.plain.length,same:a.plain[0]===b.plain[0],done:a.boxDone});
   ok('5 '+id+': the form reads the same from it',a.read&&a.read===b.read,{now:a.read.slice(0,160),before:b.read.slice(0,160)});}
 {const d=JSON.parse(Buffer.from(now['IA-1'].code.slice(5).replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
   ok('4 "Not sure" is scored as N/A was (NA) and the definition question\'s as Unsure was (unsure)',d.ans.includes('NA')&&d.confirmed==='unsure'&&!d.ans.includes(''),{ans:d.ans,confirmed:d.confirmed});}
 /* ---- the phone ---- */
 const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:IPHONE,serviceWorkers:'block'});
 const p0=await ph.newPage();p0.on('pageerror',e=>errs.push('respond: '+e.message));await p0.goto(BASE+'/NBH-Workstation/respond.html');await sleep(400);
 /* 1. links made before */
 for(const id of Object.keys(FORMS)){const p=await ph.newPage();p.on('pageerror',e=>errs.push(id+' old link: '+e.message));await p.goto(BASE+'/NBH-Workstation/respond.html'+G[id].hash);await sleep(600);
   const r=await p.evaluate(()=>({items:document.querySelectorAll('li.it').length,open:document.querySelectorAll('textarea:not(.code)').length,bad:/does not open|carries no questionnaire/.test(document.body.textContent)}));
   ok('1 '+id+': a link made before (#z=, qa/data/respond-golden.json) still opens its questionnaire',!r.bad&&r.items===(G[id].payload.items||[]).length&&r.open===(G[id].payload.open||[]).filter(o=>o.type!=='yns').length,r);await p.close();}
 {const old='#p='+b64(JSON.stringify({v:1,form:'IA-1',inst:'fast',title:'FAST',student:'S.S.',bcba:SIMBCBA,beh:'Hitting (simulated)',items:[{n:1,text:'Simulated item one'},{n:2,text:'Simulated item two'}],scale:{kind:'yn'}}));
   const p=await ph.newPage();await p.goto(BASE+'/NBH-Workstation/respond.html'+old);await sleep(500);
   ok('1 an old #p= link opens too',await p.evaluate(()=>document.querySelectorAll('li.it').length===2&&/^Questions about S\.S\. from Jordan Ellis$/.test(document.querySelector('h1').textContent)));await p.close();}
 /* the four questionnaires as the forms' own simulations make them today (Jordan Ellis, M.A., BCBA (simulated)), the student as S.S. */
 const SIM={};{const c=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
   for(const id of Object.keys(FORMS)){const f=await c.newPage();f.on('dialog',d=>d.accept().catch(()=>{}));await f.goto(BASE+'/NBH-Workstation/'+FORMS[id]);await sleep(900);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
     await loadSim(f);await sleep(900);await f.evaluate(()=>{const b=document.querySelector('#rpBtn');if(b)b.click();});await sleep(300);SIM[id]=await f.evaluate(()=>__rp.payload());await f.close();}
   await c.close();}
 ok('the four forms\' simulations make their questionnaires (IA-1 FAST 16, CF-1 21, IN-1 0 with 24 questions in writing, SV-1 11)',SIM['IA-1'].items.length===16&&SIM['CF-1'].items.length===21&&SIM['IN-1'].items.length===0&&SIM['SV-1'].items.length===11&&SIM['IA-1'].bcba===SIMBCBA,Object.keys(SIM).map(k=>k+' '+SIM[k].items.length+' '+SIM[k].bcba));
 const link=async(id,mod)=>{const pl=JSON.parse(JSON.stringify(SIM[id]));pl.student='S.S.';if(mod)mod(pl);return BASE+'/NBH-Workstation/respond.html'+await p0.evaluate(x=>NBH_RESPOND.payloadToHash(x),pl);};
 const open=async(ctx,url)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push('respond: '+e.message));await p.goto(url);await sleep(600);return p;};
 /* 2. the head, the time, the progress in view */
 let p=await open(ph,await link('IA-1'));
 const head=await p.evaluate(()=>{const H=document.querySelector('.nr-head'),r=e=>e.getBoundingClientRect(),bar=document.querySelector('#nbhr-bar');
   return {h1:document.querySelector('h1').textContent,lede:(H.querySelector('.lede')||{}).textContent,keep:(H.querySelector('.keep')||{}).textContent,headTxt:H.textContent,h1In:r(document.querySelector('h1')).bottom<r(bar).top,ledeIn:r(H.querySelector('.lede')).bottom<r(bar).top,
     foot:document.querySelector('.nr-foot').textContent,prog:document.querySelector('.prog').textContent,live:document.querySelector('.prog [aria-live]').getAttribute('aria-live'),title:document.title};});
 ok('2 the head says about whom and from whom, in plain words: "Questions about S.S. from Jordan Ellis"',head.h1==='Questions about S.S. from Jordan Ellis'&&head.title===head.h1,head.h1);
 ok('2 how long it takes: "16 yes-or-no questions and 5 to answer in your own words, about 10 minutes."',head.lede==='16 yes-or-no questions and 5 to answer in your own words, about 10 minutes.',head.lede);
 ok('2 one line says the answers are kept on this phone until sent',head.keep==='Your answers are kept on this phone until you send them.',head.keep);
 ok('2 the title, the time and that line are on the first screen, above the Send bar',head.h1In&&head.ledeIn,head);
 ok('2 no code up front: the form code and the instrument\'s citation are in the footer, not the head',!/IA-1|FAST|Iwata/.test(head.headTxt)&&/Form IA-1/.test(head.foot)&&/Iwata/.test(head.foot),{head:head.headTxt.slice(0,200)});
 ok('2 "Need this another way?" in the footer: a paper copy, read aloud',/Need this another way\? Ask Jordan Ellis, M\.A\., BCBA \(simulated\)( \([^)]*\))? for a paper copy, for the questions read aloud to you/.test(head.foot),head.foot.slice(0,300));
 ok('2 the progress reads "0 of 16 answered" and is said politely',head.prog==='0 of 16 answered'&&head.live==='polite',head);
 await p.evaluate(()=>{document.querySelectorAll('li.it').forEach((li,i)=>{if(i<7)li.querySelector('input[value="Y"]').click();});});await sleep(100);
 for(const where of ['middle','end']){await p.evaluate(w=>{if(w==='end')window.scrollTo(0,document.documentElement.scrollHeight);else document.querySelectorAll('li.it')[10].scrollIntoView({block:'center'});},where);await sleep(250);
   const v=await p.evaluate(()=>{const g=document.querySelector('.prog').getBoundingClientRect(),b=document.querySelector('#nbhr-bar').getBoundingClientRect();return {top:Math.round(g.top),bot:Math.round(g.bottom),txt:document.querySelector('.prog').textContent,fill:document.querySelector('.pbar i').style.width,barB:Math.round(b.bottom),barT:Math.round(b.top),vh:innerHeight};});
   ok('2 scrolled to the '+where+': the progress stays in view at the top ("7 of 16")',v.top===0&&v.bot<120&&v.txt==='7 of 16 answered'&&v.fill==='44%',v);
   if(where==='middle')ok('6 the Send bar stays in view at the bottom while answering',v.barB===v.vh&&v.barT>v.vh-160,v);}
 /* 6. the Send bar */
 const barNow=await p.evaluate(()=>{const b=document.querySelector('#nbhr-bar');return [...b.querySelectorAll('button')].filter(x=>!x.hidden&&x.offsetParent).map(x=>x.textContent);});
 ok('6 the Send bar: Send, then Copy my answers and Save as a file, before anything is sent',barNow.join('|')==='Send my answers to Jordan Ellis|Copy my answers|Save as a file',barNow);
 const cover=await p.evaluate(()=>{window.scrollTo(0,document.documentElement.scrollHeight);const last=[...document.querySelectorAll('li.it, textarea:not(.code)')].pop(),bar=document.querySelector('#nbhr-bar');
   const a=last.getBoundingClientRect().bottom,b=bar.getBoundingClientRect().top;last.scrollIntoView({block:'end'});const c=last.getBoundingClientRect().bottom,d=bar.getBoundingClientRect().top;
   const q=document.querySelectorAll('li.it')[15];q.querySelector('input').focus();const e=q.getBoundingClientRect().bottom,f=bar.getBoundingClientRect().top;return {end:[Math.round(a),Math.round(b)],into:[Math.round(c),Math.round(d)],focus:[Math.round(e),Math.round(f)]};});
 ok('6 the Send bar never covers the last question: at the end of the page, scrolled to it, and when a choice gets the focus',cover.end[0]<=cover.end[1]&&cover.into[0]<=cover.into[1]+1&&cover.focus[0]<=cover.focus[1]+1,cover);
 /* 3. kept on this phone: a reload brings the answers back */
 await p.evaluate(()=>{const g=document.querySelectorAll('.grid2 input[type=text]');g[0].value='Sample parent';g[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('input[name=nbhr-confirm][value=unsure]').click();document.querySelector('li.it:nth-child(9) input[value=NA]').click();
   const t=document.querySelector('textarea:not(.code)');t.value='Simulated: at lunch';t.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(500);
 await p.reload();await sleep(700);
 const back=await p.evaluate(()=>({name:document.querySelector('.grid2 input[type=text]').value,conf:(document.querySelector('input[name=nbhr-confirm]:checked')||{}).value,on:[...document.querySelectorAll('li.it')].map(li=>(li.querySelector('input:checked')||{}).value||'').join(','),ta:document.querySelector('textarea:not(.code)').value,
   prog:document.querySelector('.prog').textContent,keep:document.querySelector('.keep').textContent,lab:[...document.querySelectorAll('li.it:nth-child(9) label.on')].map(l=>l.textContent).join()}));
 ok('3 a reload keeps every answer: the name, the definition answer, the items (with Not sure), the written answer, the progress',back.name==='Sample parent'&&back.conf==='unsure'&&back.on==='Y,Y,Y,Y,Y,Y,Y,,NA,,,,,,,'&&back.ta==='Simulated: at lunch'&&back.prog==='8 of 16 answered'&&back.lab==='Not sure'&&/from before are back/.test(back.keep),back);
 const kept=await p.evaluate(()=>{const ks=Object.keys(localStorage).filter(k=>/^nbh\.respond\|/.test(k));return {ks,raw:ks.map(k=>localStorage.getItem(k)).join('')};});
 ok('3 one record for this questionnaire, holding the answers only: not the student, the behavior or the definition',kept.ks.length===1&&/^nbh\.respond\|IA-1\|[0-9a-f]{16}$/.test(kept.ks[0])&&/Sample parent/.test(kept.raw)&&!/S\.S\.|Aggression|Forceful|Jordan/.test(kept.raw),kept);
 /* the email way: kept until "I have sent my answers" */
 await p.evaluate(()=>{document.querySelectorAll('li.it').forEach(li=>{if(!li.querySelector('input:checked'))li.querySelector('input[value="N"]').click();});document.querySelector('#nbhr-send').click();});await sleep(500);
 const m1=await p.evaluate(()=>({kept:Object.keys(localStorage).filter(k=>/^nbh\.respond\|/.test(k)).map(k=>localStorage.getItem(k)).join(''),fin:!document.querySelector('#nbhr-fin').hidden,msg:document.querySelector('#nbhr-msg').textContent,alt:document.querySelector('#nbhr-bar .alt').hidden}));
 ok('3 after Send by email the answers stay on the phone (the email may not have gone), with "I have sent my answers"',/Sample parent/.test(m1.kept)&&m1.fin&&/email program should open/.test(m1.msg),m1);
 await p.evaluate(()=>document.querySelector('#nbhr-fin button').click());await sleep(200);
 const m2=await p.evaluate(()=>({kept:Object.keys(localStorage).filter(k=>/^nbh\.respond\|/.test(k)).map(k=>localStorage.getItem(k)).join(''),msg:document.querySelector('#nbhr-msg').textContent}));
 ok('3 "I have sent my answers" clears them from the phone',!/Sample parent|"ans"/.test(m2.kept)&&/"sent"/.test(m2.kept)&&/cleared/.test(m2.msg),m2);
 await p.reload();await sleep(600);
 const m3=await p.evaluate(()=>({was:document.querySelector('#nbhr-was').hidden?'':document.querySelector('#nbhr-was').textContent,any:document.querySelectorAll('li.it input:checked').length,name:document.querySelector('.grid2 input[type=text]').value}));
 ok('3 opened again: blank, with "You sent your answers on …"',m3.any===0&&m3.name===''&&/^You sent your answers on /.test(m3.was),m3);
 await p.close();
 /* the reply box: cleared after a successful send */
 {const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE,serviceWorkers:'block'});await ctx.addInitScript(BOXSTUB);
   const q0=await ctx.newPage();await q0.goto(BASE+'/NBH-Workstation/respond.html');const pl=await keyed(q0,boxed(G['CF-1'].payload));pl.bcba=SIMBCBA;pl.student='S.S.';
   const url=BASE+'/NBH-Workstation/respond.html'+await q0.evaluate(x=>NBH_RESPOND.payloadToHash(x),pl);const q=await open(ctx,url);
   await fill(q,'CF-1');await sleep(500);const before=await q.evaluate(()=>Object.keys(localStorage).filter(k=>/^nbh\.respond\|/.test(k)).map(k=>localStorage.getItem(k)).join(''));
   await q.evaluate(()=>document.querySelector('#nbhr-send').click());await sleep(900);
   const after=await q.evaluate(()=>({kept:Object.keys(localStorage).filter(k=>/^nbh\.respond\|/.test(k)).map(k=>localStorage.getItem(k)).join(''),msg:document.querySelector('#nbhr-msg').textContent,send:document.querySelector('#nbhr-send').hidden,plain:(window.__plain||[]).length}));
   ok('3 the reply box: kept while answering, cleared once the box has them ("Sent."), the Send bar says so',/Sample parent/.test(before)&&after.plain===1&&!/Sample parent|"ans"/.test(after.kept)&&/"sent"/.test(after.kept)&&/^Sent\./.test(after.msg)&&after.send,after);
   await q.reload();await sleep(600);ok('3 opened again after the box has them: blank, nothing of the answers kept',await q.evaluate(()=>document.querySelectorAll('li.it input:checked').length===0&&!document.querySelector('#nbhr-was').hidden));
   await ctx.close();}
 /* 4. one "Not sure" */
 const ns={};for(const id of Object.keys(FORMS)){const q=await open(ph,await link(id));ns[id]=await q.evaluate(()=>{const labels=[...document.querySelectorAll('.opts label')].map(l=>l.textContent.trim());
   return {conf:[...document.querySelectorAll('#nbhr-conf label')].map(l=>l.textContent).join('|'),first:[...((document.querySelector('li.it')||document.body).querySelectorAll('.opts label'))].map(l=>l.textContent).join('|'),
     naVal:((document.querySelector('li.it')||document.body).querySelector('label:last-child input')||{}).value||'',old:labels.filter(t=>/^(N\/A|Unsure|Can.t judge)|N\/A:/.test(t)).length,instr:[...document.querySelectorAll('.nr-card .sub')].map(e=>e.textContent).join(' '),key:(document.querySelector('.key')||{}).textContent||''};});await q.close();}
 ok('4 IA-1 FAST: Yes / No / Not sure on the definition and on every item; the instructions say “Not sure”, not N/A',ns['IA-1'].conf==='Yes|No|Not sure'&&ns['IA-1'].first==='Yes|No|Not sure'&&ns['IA-1'].naVal==='NA'&&!ns['IA-1'].old&&/choose “Not sure”/.test(ns['IA-1'].instr)&&!/N\/A/.test(ns['IA-1'].instr),ns['IA-1']);
 ok('4 SV-1: 1 to 6 or Not sure (its own words in the key), the instructions say “Not sure”',ns['SV-1'].first==='1|2|3|4|5|6|Not sure'&&ns['SV-1'].naVal==='NA'&&!ns['SV-1'].old&&/Not sure also means: I cannot judge, or have not seen it run/.test(ns['SV-1'].key)&&/or “Not sure” if you cannot judge it/.test(ns['SV-1'].instr),ns['SV-1']);
 ok('4 IN-1: the definition question Yes / No / Not sure; CF-1 keeps its 1 to 6 with no uncertain answer (as before)',ns['IN-1'].conf==='Yes|No|Not sure'&&ns['CF-1'].first==='1|2|3|4|5|6'&&!ns['IN-1'].old&&!ns['CF-1'].old,{in1:ns['IN-1'].conf,cf1:ns['CF-1'].first});
 /* 2. the time and the progress on the other three */
 const heads={};for(const id of ['CF-1','IN-1','SV-1']){const q=await open(ph,await link(id));heads[id]=await q.evaluate(()=>({h1:document.querySelector('h1').textContent,lede:document.querySelector('.lede').textContent,prog:(document.querySelector('.prog')||{}).textContent||''}));await q.close();}
 ok('2 CF-1, IN-1 and SV-1 get the same head, time and progress',heads['CF-1'].h1==='Questions about S.S. from Jordan Ellis'&&heads['CF-1'].lede==='21 statements to rate from 1 to 6, about 5 minutes.'&&heads['CF-1'].prog==='0 of 21 answered'&&
   heads['IN-1'].lede==='24 questions to answer in your own words, about 30 minutes.'&&heads['IN-1'].prog==='0 of 24 answered'&&heads['SV-1'].lede==='11 statements to rate from 1 to 6 and 2 to answer in your own words, about 5 minutes.'&&heads['SV-1'].prog==='0 of 11 answered',heads);
 /* the Spanish page */
 {const q=await open(ph,await link('IA-1',pl=>{pl.lang='es';}));const es=await q.evaluate(()=>({h1:document.querySelector('h1').textContent,lede:document.querySelector('.lede').textContent,conf:[...document.querySelectorAll('#nbhr-conf label')].map(l=>l.textContent).join('|'),first:[...document.querySelectorAll('li.it')[0].querySelectorAll('.opts label')].map(l=>l.textContent).join('|'),send:document.querySelector('#nbhr-send').textContent,keep:document.querySelector('.keep').textContent}));
   ok('2 4 the Spanish page: the head, the time, “No estoy seguro/a” everywhere, the Send bar',es.h1==='Preguntas sobre S.S. de parte de Jordan Ellis'&&/^16 preguntas de sí o no y 5 para responder con sus propias palabras, unos 10 minutos\.$/.test(es.lede)&&es.conf==='Sí|No|No estoy seguro/a'&&es.first==='Sí|No|No estoy seguro/a'&&es.send==='Enviar mis respuestas a Jordan Ellis'&&/teléfono/.test(es.keep),es);await q.close();}
 /* 8. sizes, names, contrast, width, on the phone and the iPad */
 const AUDIT=()=>{const small=[],tiny=[],noname=[],low=[],de=document.documentElement;
   const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return {L:.2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]),a:m[3]==null?1:m[3]};};
   const bgOf=e=>{for(;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;const l=lum(c);if(l.a>0.5)return l.L;}return 1;};
   const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
   document.querySelectorAll('button,select,input:not([type=radio]),textarea,.opts label,a').forEach(e=>{if(!vis(e))return;if(e.tagName==='A'&&e.closest('p.foot'))return;const r=e.getBoundingClientRect();if(r.height<43.5||r.width<43.5)small.push((e.textContent||e.id||e.tagName).trim().slice(0,24)+' '+Math.round(r.width)+'x'+Math.round(r.height));});
   document.querySelectorAll('input,select,textarea').forEach(e=>{if(e.type!=='radio'&&vis(e)&&parseFloat(getComputedStyle(e).fontSize)<16)tiny.push(e.tagName);});
   document.querySelectorAll('button,select,input,textarea').forEach(e=>{if(!vis(e)&&e.type!=='radio')return;let n=e.getAttribute('aria-label')||'';const lb=e.getAttribute('aria-labelledby');if(!n&&lb)n=lb.split(' ').map(i=>(document.getElementById(i)||{}).textContent||'').join(' ');if(!n&&e.labels&&e.labels.length)n=e.labels[0].textContent;if(!n&&e.tagName==='BUTTON')n=e.textContent;if(!n.trim())noname.push(e.tagName+'#'+e.id+'.'+e.className);});
   document.querySelectorAll('[role=radiogroup]').forEach(g=>{const lb=g.getAttribute('aria-labelledby');if(!(lb&&(document.getElementById(lb)||{}).textContent))noname.push('radiogroup');});
   document.querySelectorAll('h1,h2,p,label,span,b,button,li,output,.band,.def,.msg').forEach(e=>{if(!vis(e)||!e.textContent.trim()||e.closest('[hidden]'))return;const cs=getComputedStyle(e);if(parseFloat(cs.opacity)<1||e.disabled)return;const f=lum(cs.color),b=bgOf(e);const r=(Math.max(f.L,b)+.05)/(Math.min(f.L,b)+.05);if(r<4.5)low.push(e.tagName+' "'+e.textContent.trim().slice(0,20)+'" '+r.toFixed(2));});
   return {small,tiny,noname,low:[...new Set(low)],sw:de.scrollWidth,cw:de.clientWidth,body:parseFloat(getComputedStyle(document.body).fontSize)};};
 const STAFF='#s='+b64(JSON.stringify({v:1,f:'DD-1',x:{u:'http://127.0.0.1:9/nbh-box',b:'0123456789abcdef0123456789abcdef',k:{x:'A'.repeat(43),y:'B'.repeat(43)}},c:'SIMCODE1',w:'Sample para, Room 12',s:'S.S.',
   t:[{i:'pa',n:'Physical aggression',m:'n'},{i:'tn',n:'Tantrum',m:'d'},{i:'mb',n:'Mand for break',m:'p'},{i:'ot',n:'On task',m:'i'}],st:['Classroom','Lunch']}));
 const ipad=await br.newContext({viewport:{width:1032,height:1376},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
 for(const [dev,ctx] of [['phone',ph],['iPad',ipad]]){
   for(const id of Object.keys(FORMS)){const q=await open(ctx,await link(id));const a=await q.evaluate(AUDIT);
     ok('8 '+dev+' '+id+': 16 px text in the boxes, 44 px targets, every control named, contrast 4.5:1, nothing wider than the screen',a.body>=16&&!a.tiny.length&&!a.small.length&&!a.noname.length&&!a.low.length&&a.sw<=a.cw,a);
     if(dev==='iPad'&&id==='IA-1'){const v=await q.evaluate(()=>{document.querySelectorAll('li.it')[12].scrollIntoView({block:'center'});return new Promise(r=>setTimeout(()=>{const g=document.querySelector('.prog').getBoundingClientRect(),b=document.querySelector('#nbhr-bar').getBoundingClientRect();r({pt:Math.round(g.top),bb:Math.round(b.bottom),vh:innerHeight,keep:document.querySelector('.keep').textContent});},250));});
       ok('2 6 on the iPad: the progress at the top and the Send bar at the bottom stay in view; "kept on this tablet"',v.pt===0&&v.bb===v.vh&&/this tablet/.test(v.keep),v);}
     await q.close();}
   const s=await open(ctx,BASE+'/NBH-Workstation/staff-data.html'+STAFF);const a=await s.evaluate(AUDIT);
   ok('8 '+dev+' staff page: 16 px text in the boxes, 44 px targets, every control named, contrast 4.5:1, nothing wider than the screen',a.body>=16&&!a.tiny.length&&!a.small.length&&!a.noname.length&&!a.low.length&&a.sw<=a.cw,a);
   if(dev==='phone'){
     /* 7. the staff page */
     const w=await s.evaluate(()=>{const b=document.querySelector('section.t [data-a="watch"]'),h=document.getElementById(b.getAttribute('aria-describedby'));const pl=document.querySelector('.big.plus'),mi=document.querySelector('.big.minus'),cs=e=>getComputedStyle(e);
       return {txt:b.textContent,pressed:b.getAttribute('aria-pressed'),label:b.getAttribute('aria-label'),help:h&&h.textContent,h1:document.querySelector('h1').textContent,keep:document.getElementById('sdKeep').textContent,
         plus:cs(pl).backgroundColor,minus:cs(mi).backgroundColor,minusB:cs(mi).borderTopWidth+' '+cs(mi).borderTopColor,minusC:cs(mi).color,foot:document.querySelector('.sd-foot').textContent};});
     ok('7 the staff page: "Watching now" as a state, its one line of help read with it',w.txt==='Watching now'&&w.pressed==='true'&&w.label==='Watching now: Physical aggression'&&w.help==='Turn “Watching now” off when you are not with the student, so a 0 is not counted.',w);
     ok('7 + is dark green, − neutral with an outline',w.plus==='rgb(31, 107, 74)'&&w.minus==='rgb(255, 255, 255)'&&/^2px rgb\(84, 103, 111\)$/.test(w.minusB)&&w.minusC==='rgb(26, 41, 51)',w);
     ok('7 the same head: about whom, and every tap kept on this phone; the footer with "Need this another way?" and the form',w.h1==='Behavior data about S.S.'&&w.keep==='Every tap is kept on this phone until you send it.'&&/Need this another way\? Ask the BCBA for a paper data sheet/.test(w.foot)&&/Form DD-1/.test(w.foot),w);
     await s.tap('section.t [data-a="watch"]');await sleep(150);
     const w2=await s.evaluate(()=>{const b=document.querySelector('section.t [data-a="watch"]');return {txt:b.textContent,pressed:b.getAttribute('aria-pressed'),label:b.getAttribute('aria-label'),sub:b.closest('section').querySelector('.sub').textContent};});
     ok('7 tapped: "Not watching", said as the state, and the target is left blank',w2.txt==='Not watching'&&w2.pressed==='false'&&w2.label==='Not watching: Physical aggression'&&/Not watching: left blank, not sent/.test(w2.sub),w2);
     const a2=await s.evaluate(AUDIT);ok('7 a target not watched is greyed and still legible (4.5:1), its controls still 44 px',!a2.low.length&&!a2.small.length,a2);
     await s.tap('section.t [data-a="watch"]');
     const sc=await s.evaluate(()=>{const bar=document.querySelector('.bar');document.querySelectorAll('section.t')[1].scrollIntoView({block:'center'});const mid=bar.getBoundingClientRect();
       window.scrollTo(0,document.documentElement.scrollHeight);const last=document.getElementById('sdNote').closest('.card').getBoundingClientRect(),lastT=[...document.querySelectorAll('section.t')].pop().querySelector('.sub').getBoundingClientRect(),end=bar.getBoundingClientRect();
       return {midB:Math.round(mid.bottom),vh:innerHeight,lastB:Math.round(last.bottom),lastSub:Math.round(lastT.bottom),barT:Math.round(end.top),pad:getComputedStyle(document.body).paddingBottom};});
     ok('7 6 the staff Send bar stays in view, and at the end never covers the last target or the note',sc.midB===sc.vh&&sc.lastB<=sc.barT&&sc.lastSub<=sc.barT,sc);}
   await s.close();}
 /* reduced motion */
 {const ctx=await br.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});const q=await open(ctx,await link('IA-1'));
   ok('8 prefers-reduced-motion: the progress bar does not animate',await q.evaluate(()=>getComputedStyle(document.querySelector('.pbar i')).transitionDuration==='0s'));await ctx.close();}
 /* a page opened from a file or in private browsing: no storage, said so, works as before */
 {const ctx=await br.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});await ctx.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}});});
   const q=await open(ctx,await link('IA-1'));await fill(q,'IA-1');const r=await q.evaluate(()=>{document.querySelector('#nbhr-send').click();return {keep:document.querySelector('.keep').textContent,code:document.querySelector('.code').value};});
   ok('3 with storage refused the page says it is not keeping the answers, and Send still works',/not keeping your answers/.test(r.keep)&&/^NBH1\./.test(r.code),r);await ctx.close();}
 await ipad.close();await ph.close();
 }catch(e){ok('the test ran to its end',false,String(e&&e.stack||e));}
 ok('8 no page errors',!errs.length,errs.slice(0,5));
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
