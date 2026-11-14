/* v26.00 (the BCBA, 11/13: "a place that goes over everything that a person who is studying to become a RBT can go and learn
   ... Also, a person studying to be a BCBA ... a full fledge curriculum space"; and "Yes, with me as the Responsible
   Trainer.") the Learning page, learn.html, with its map (nbh-learn.js) and its written units (nbh-learn-units*.js; v26.01: all 46).
   A  the map: the eight sections with the outline's minimum hours (38 in all); 46 units; every section's plan reaches its
      minimum and the whole plan 40 hours; each of the 43 tasks of the RBT outline is taught by a unit; every video of the
      library is in a unit; the BCBA map has 104 tasks in nine domains; every form the map names is a form of the workstation;
   B  while the training is not released (v26.01: all 46 units are written and wait for the Responsible Trainer's review), the
      home page, the track and the trainer's page say so, and none carries the BACB's statement;
   C  the lesson: a wrong answer leaves the part open; the right one marks it and frees Next; seven parts make the lesson
      done, and it is kept over a reload;
   D  the time: counted while the learner is active in a part; it stops after 90 seconds without a touch; nothing is counted
      on the home page; on the Watch part only while a video plays; a part counts no more than its limit;
   E  the examples (10 of 10), the session (8 of 8), the quiz (an unanswered question is named; a pass and a fail are both
      recorded), and with the core videos watched the unit reads "Your part is done";
   F  My record: the name and the BACB ID are kept; Send makes a file that holds them, the days and the scores;
   G  the trainer: the details make a link, and the link names the trainer on a trainee's first screen; the self-check is
      kept; a trainee is added; the record file is taken (and one with another BACB ID is refused); a role-play with every
      step ticked is "Met"; the certificate is refused, and says the training is not whole;
   H  a whole training (the map cut down to the written unit, in the test only): with the hours, 6 days, the quiz, the three
      role-plays and the discussion, the certificate shows the trainee, the dates, the time in words, the trainer and the
      number, and the BACB's statement word for word; with 3 days it is refused for the days;
   I  BCBA study: nine domains; a rating is kept and counted; a task's videos open in the player;
   J  in the workstation: the page opens in the Videos layer with Close, a form named by a unit opens that form, and the video
      library links to the page;
   K  a phone: none of the 13 views is wider than the screen; a tapped answer is taken; the choices are 44 px high;
   L  with a file of units kept from the page: the page says it is being built, and such a unit says so and still lists its videos;
   R  (v26.02) the reading list: articles under the BCBA tasks and the units they bear on, each with a note and its reference;
   N  (v26.01) every one of the 46 units opens each of its parts; the answers are shown in an order drawn anew, and the right
      one is taken by what it says;
   M  a record file with markup in the name and wild numbers: the name is shown as text and the time is capped;
   Z  no page error.
   Invented people only. usage: node qa/v2600-learn-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const DIR=path.join(L.ROOT,L.ED),PAGE=L.BASE+'/'+L.ED+'/learn.html';
global.window={};require(path.join(DIR,'nbh-videos.js'));require(path.join(DIR,'nbh-learn.js'));
const UNIT_FILES=fs.readdirSync(DIR).filter(f=>/^nbh-learn-units(-[a-z0-9]+)?\.js$/.test(f)).sort();UNIT_FILES.forEach(f=>require(path.join(DIR,f)));
const M=global.window.NBH_LEARN,U=global.window.NBH_LEARN_UNITS,VID=global.window.NBH_VIDEOS;
const STMT='This training program is designed to meet the 2026 training eligibility requirement for RBT certification. The training is offered independent of the BACB.';
const NOW='2026-11-13T15:00:00Z';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const open=async(o,url,init)=>{const ctx=await br.newContext(Object.assign({serviceWorkers:'block',timezoneId:'America/New_York',acceptDownloads:true},o||{}));if(init)await init(ctx);
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));if(url){await p.goto(url);await p.waitForSelector('#lnView h1');}return {p,ctx};};
  const go=async(p,h)=>{await p.evaluate(x=>{location.hash=x;},h);await sleep(120);};
  const txt=(p,s)=>p.evaluate(x=>{const n=document.querySelector(x);return n?n.textContent:null;},s);
  const store=p=>p.evaluate(()=>window.NBHLearn.store());

  /* ---------------- A the map ---------------- */
  {const secs=M.rbt.sections,mins=secs.map(s=>s.min),plan=secs.map(s=>s.units.reduce((n,u)=>n+u.self+u.led,0));
   const units=[].concat(...secs.map(s=>s.units)),codes={},used={};units.forEach(u=>{u.codes.forEach(c=>{codes[c]=1;});(u.v||[]).forEach(k=>{used[k]=1;});});
   const tco=[].concat(...M.rbt.tco.map(d=>d.tasks.map(t=>t[0]))),vkeys=VID.list.map(v=>v.key),fam=VID.families.map(f=>f[0]);
   const idx=fs.readFileSync(path.join(DIR,'index.html'),'utf8'),formsUsed={};
   units.forEach(u=>(u.f||[]).forEach(f=>{formsUsed[f]=1;}));M.bcba.domains.forEach(d=>d.tasks.forEach(t=>((t[2]||{}).f||[]).forEach(f=>{formsUsed[f]=1;})));
   const badForm=Object.keys(formsUsed).filter(f=>!M.forms[f]||idx.indexOf("['"+f+"','")<0);
   const badVid=units.reduce((a,u)=>a.concat((u.v||[]).filter(k=>vkeys.indexOf(k)<0)),[]),badFam=[];M.bcba.domains.forEach(d=>d.tasks.forEach(t=>((t[2]||{}).v||[]).forEach(f=>{if(fam.indexOf(f)<0)badFam.push(f);})));
   const ids=units.map(u=>u.id);
   ok('A the map: eight sections with the minimums 2, 1, 3, 3, 20, 3, 5, 1 (38 hours); 46 units with ids of their own; every section’s plan reaches its minimum and the whole plan 40 hours; all 43 tasks of the RBT outline are taught; every video is in a unit and every key is a video; 104 BCBA tasks in nine domains (5, 24, 12, 9, 12, 8, 19, 8, 7); every form named is a form of the workstation; all 46 units are written, in 15 files that the page names; the training is not marked released',
     mins.join()==='2,1,3,3,20,3,5,1'&&units.length===46&&new Set(ids).size===46&&plan.every((m,i)=>m>=mins[i]*60)&&plan.reduce((a,b)=>a+b,0)>=2400&&tco.length===43&&tco.every(c=>codes[c])&&Object.keys(codes).every(c=>tco.indexOf(c)>=0)&&
     vkeys.every(k=>used[k])&&!badVid.length&&!badFam.length&&M.bcba.domains.map(d=>d.tasks.length).join()==='5,24,12,9,12,8,19,8,7'&&!badForm.length&&M.rbt.ready===false&&M.rbt.statement===STMT&&units.every(u=>u.w===1&&!!U[u.id])&&Object.keys(U).length===46&&UNIT_FILES.length===15&&UNIT_FILES.every(f=>fs.readFileSync(path.join(DIR,'learn.html'),'utf8').indexOf('<script src="'+f+'"></script>')>0),
     {mins,plan,n:units.length,miss:tco.filter(c=>!codes[c]),free:vkeys.filter(k=>!used[k]),badVid,badFam,badForm});}

  /* ---------------- B, C, D: a learner on an iPad-size screen, the clock held ---------------- */
  const A=await open({viewport:{width:1180,height:820}},null,async ctx=>{});const p=A.p;await p.clock.install({time:new Date(NOW)});
  await p.goto(PAGE);await p.waitForSelector('#lnView h1');
  const b={home:await txt(p,'#lnBuilding'),homeAll:await txt(p,'body'),close:await p.isVisible('#lnClose'),lib:await p.isVisible('#lnToVideos')};
  await go(p,'#rbt');b.rbt=await txt(p,'#lnBuilding');b.rbtAll=await txt(p,'body');b.secs=await p.$$eval('.ln-sec',x=>x.length);b.units=await p.$$eval('.ln-unit',x=>x.length);b.tocome=await p.$$eval('.ln-pill.w',x=>x.length);
  await go(p,'#trainer');b.tr=await txt(p,'#lnBuilding');b.trAll=await txt(p,'body');
  ok('B while the training is not released: the home page, the track (8 sections, 46 units, none marked "Lesson to come") and the trainer’s page each say that all 46 units are written and wait for the Responsible Trainer’s review, and that it cannot be used toward certification; none carries the BACB’s statement; on its own the page has no Close',
    [b.home,b.rbt,b.tr].every(t=>/All 46 units are written and are waiting for the Responsible Trainer’s review/.test(t||'')&&/cannot be used toward RBT certification/.test(t)&&/no certificate can be made/.test(t))&&[b.homeAll,b.rbtAll,b.trAll].every(t=>t.indexOf('designed to meet')<0)&&b.secs===8&&b.units===46&&b.tocome===0&&!b.close&&!b.lib,
    {home:b.home,secs:b.secs,units:b.units,tocome:b.tocome,close:b.close});

  await go(p,'#home');await p.clock.runFor(30000);const d0=(await store(p)).days;
  await go(p,'#rbt/e8');const les=U.e8.lesson,c={};
  c.part=await txt(p,'.ln-parts [aria-current="step"]');c.h=await txt(p,'.ln-prose h3');
  const wrong=les[0].check.a===0?1:0;await p.click('.ln-opt[data-pick="'+wrong+'"]');
  c.w={next:await p.isDisabled('#lnNext'),why:await txt(p,'#lnWhy'),les:(await store(p)).u.e8.les.length};
  await p.click('.ln-opt[data-pick="'+les[0].check.a+'"]');c.r={next:await p.isDisabled('#lnNext'),why:await txt(p,'#lnWhy'),les:(await store(p)).u.e8.les[0]};
  await p.clock.runFor(60000);const d1=(await store(p)).days;       /* a click, then 60 s: counted */
  await p.clock.runFor(120000);const d2=(await store(p)).days;      /* 120 s more with no touch: only the first 90 s after the click count */
  const sec=(d,k)=>{const x=Object.values(d)[0]||{};return Math.round(((x.E||{})[k])||0);};
  for(let i=0;i<les.length;i++){if(i)await p.click('#lnNext');if(i)await p.click('.ln-opt[data-pick="'+les[i].check.a+'"]');}
  c.sub=await txt(p,'.ln-parts [aria-current="step"] small');c.done=await p.$$eval('.ln-steps .done',x=>x.length);c.nextT=await txt(p,'#lnNext');
  await p.reload();await p.waitForSelector('#lnView h1');await go(p,'#rbt/e8/lesson');c.again=await p.$$eval('.ln-steps .done',x=>x.length);c.dot=await p.$eval('.ln-parts a[href$="/lesson"] .d',x=>x.className);
  ok('C the lesson: it opens on part 1; a wrong answer leaves Next shut, gives no reason away and marks nothing; the right answer gives the reason, marks the part and frees Next; all seven parts make the lesson done ("7 of 7 parts", On to the videos), kept over a reload',
    /Lesson/.test(c.part)&&c.h===les[0].h&&c.w.next===true&&/Not that one/.test(c.w.why)&&c.w.why.indexOf(les[0].check.why)<0&&c.w.les===0&&c.r.next===false&&c.r.why.indexOf(les[0].check.why)>=0&&c.r.les===1&&c.sub==='7 of 7 parts'&&c.done===7&&c.nextT==='On to the videos'&&c.again===7&&/done/.test(c.dot),c);

  /* the Watch part: nothing without a playing video; a video's "playing" message counts; the limit of a part */
  await go(p,'#rbt/e8/watch');const w0=sec((await store(p)).days,'video');await p.mouse.move(300,300);await p.clock.runFor(20000);const w1=sec((await store(p)).days,'video');
  await p.click('[data-open^="videos.html#video=dra_attention"]');await p.waitForSelector('#lnDlg[open] iframe');
  const fr=()=>p.frames().find(f=>/videos\.html/.test(f.url()));for(let i=0;i<50&&!fr();i++)await sleep(100);
  const dl={open:await p.isVisible('#lnDlg'),src:await p.$eval('#lnDlg iframe',x=>x.getAttribute('src')),title:await txt(p,'#lnDlgT')};
  await fr().waitForLoadState('load');await sleep(500);   /* the video page says "not playing" as it loads: wait for that before the test says it plays */
  await fr().evaluate(()=>{window.parent.postMessage({nbh:'videos-playing',on:true},'*');});await sleep(150);await p.clock.runFor(30000);const w2=sec((await store(p)).days,'video');
  await fr().evaluate(()=>{window.parent.postMessage({nbh:'videos-playing',on:false},'*');});await sleep(150);await p.clock.runFor(20000);const w3=sec((await store(p)).days,'video');
  await p.click('#lnDlgX');dl.shut=!(await p.isVisible('#lnDlg'));dl.frames=await p.$$eval('#lnDlg iframe',x=>x.length);
  /* the limit: the lesson of 7 parts counts 28 minutes at most */
  await go(p,'#rbt/e8/lesson');for(let i=0;i<45;i++){await p.mouse.click(700,120);await p.clock.runFor(60000);}const capL=Math.round((await store(p)).u.e8.t.lesson),chip=await txt(p,'#lnClockT');
  ok('D the time: nothing on the home page; in the lesson a touch and 60 seconds count about 60, and 120 more without a touch stop at 90; on the Watch part nothing counts until the opened video says it plays (30 seconds counted, none after it stops); the player opens the video by its key and closes; the lesson counts no more than its limit (28 minutes), and the chip says the part is full',
    !Object.keys(d0).length&&Math.abs(sec(d1,'lesson')-60)<=3&&Math.abs(sec(d2,'lesson')-90)<=3&&w0===0&&w1===0&&Math.abs(w2-30)<=3&&w3===w2&&dl.open&&dl.src==='videos.html#video=dra_attention'&&/DRA with attention/.test(dl.title)&&dl.shut&&dl.frames===0&&capL===1680&&/This part is full/.test(chip),
    {d0,l60:sec(d1,'lesson'),l180:sec(d2,'lesson'),w:[w0,w1,w2,w3],dl,capL,chip});

  /* ---------------- E examples, session, quiz ---------------- */
  const e={};
  await go(p,'#rbt/e8/examples');for(const it of U.e8.examples.items){await p.click('.ln-opt[data-pick="'+it.a+'"]');await p.click('#lnNext');}e.ex=await txt(p,'#lnScore');
  await go(p,'#rbt/e8/practice');e.plan=await p.$$eval('.ln-plan li',x=>x.length);for(const st of U.e8.practice.steps){await p.click('.ln-opt[data-pick="'+st.a+'"]');await p.click('#lnNext');}e.pr=await txt(p,'#lnScore');
  await go(p,'#rbt/e8/quiz');e.n=await p.$$eval('#lnQuiz fieldset',x=>x.length);
  const answer=async right=>{const qs=await p.$$eval('#lnQuiz fieldset',x=>x.map(f=>+f.dataset.q));for(const q of qs){const a=U.e8.quiz.items[q].a,k=right?a:(a===0?1:0);await p.check('#lnQuiz fieldset[data-q="'+q+'"] input[value="'+k+'"]');}return qs;};
  await p.click('#lnQuiz button[type=submit]');e.miss=await txt(p,'#lnQMiss');
  const q1=await answer(false);await p.click('#lnQuiz button[type=submit]');e.fail=await txt(p,'#lnScore');e.failT=await txt(p,'#lnQuiz .ln-row .ln-prose');e.why=await p.$$eval('#lnQuiz fieldset .ln-why.wrong',x=>x.length);
  await p.click('#lnAgain');const q2=await answer(true);await p.click('#lnQuiz button[type=submit]');e.pass=await txt(p,'#lnScore');e.pill0=await txt(p,'.ln-uhead .ln-pill');
  e.rec=(await store(p)).u.e8;
  await p.evaluate(keys=>{const v={v:1,items:{}};keys.forEach(k=>{v.items[k]={t:0,d:100,w:1,at:Date.now()};});localStorage.setItem('nbh.videos.v1',JSON.stringify(v));},U.e8.watch.filter(x=>x.c).map(x=>x.k));
  await go(p,'#rbt');await go(p,'#rbt/e8/quiz');e.pill1=await txt(p,'.ln-uhead .ln-pill');e.hist=await p.$$eval('#lnBody table tbody tr',x=>x.map(r=>r.cells[3].textContent));
  await go(p,'#rbt');e.list=await p.$eval('.ln-unit a[href="#rbt/e8"]',a=>a.parentNode.querySelector('.ln-pill').textContent);
  ok('E the examples end at 10 of 10 and the session (its plan of six lines above it) at 8 of 8; the quiz draws 10 questions of 18; handed in empty it names the 10 unanswered; all wrong is 0% and "Not yet", with a reason under each; taken again, all right is 100%; both attempts are recorded; with the six core videos watched the unit reads "Your part is done", in the unit and in the list',
    e.ex==='10 of 10'&&e.plan===6&&e.pr==='8 of 8'&&e.n===10&&U.e8.quiz.items.length===18&&/10 questions have no answer/.test(e.miss)&&e.fail==='0%'&&/Not yet/.test(e.failT)&&e.why===10&&e.pass==='100%'&&new Set(q1).size===10&&new Set(q2).size===10&&
    e.rec.quiz.length===2&&e.rec.quiz[0].pass===0&&e.rec.quiz[1].pass===1&&e.rec.ex.right===10&&e.rec.pr.right===8&&e.pill0==='Started'&&e.pill1==='Your part is done'&&e.hist.join()==='Not yet,Passed'&&e.list==='Your part is done',e);

  /* ---------------- F my record ---------------- */
  await go(p,'#rbt/e8/trainer');await p.selectOption('#lnFbR','2');await p.fill('#lnFbC','More examples of DRL, please.');const roleN=await p.$$eval('.ln-role',x=>x.length);
  await go(p,'#record');await p.fill('#lnName','Marisol Vance');await p.fill('#lnBacb','RBT-26-0001');
  const [dn]=await Promise.all([p.waitForEvent('download'),p.click('#lnSend')]);const recTxt=fs.readFileSync(await dn.path(),'utf8'),rec=JSON.parse(recTxt),recPath=path.join(require('os').tmpdir(),'nbh-learn-rec-'+process.pid+'.json');fs.writeFileSync(recPath,recTxt);   /* the download goes with its context: a copy for the trainer's device */
  const f={name:dn.suggestedFilename(),note:await txt(p,'#lnSendNote'),rows:await p.$$eval('#lnView table',x=>x.length),E:await p.$eval('#lnView table tbody tr:nth-child(5)',r=>r.cells[1].textContent),kinds:await txt(p,'#lnKinds')};
  await p.reload();await p.waitForSelector('#lnName');f.kept=[await p.inputValue('#lnName'),await p.inputValue('#lnBacb')];
  ok('F My record: the unit’s page for the trainer shows the three role-plays and takes a word for the trainer; the name and the BACB ID are kept over a reload; section E shows the time counted, and a line gives it by kind (lesson 0:28); Send saves training-record-2026-11-13.json, which holds the name, the ID, the day’s seconds, the two quiz attempts and the word for the trainer, and nothing else of the device',
    roleN===3&&f.kept.join('|')==='Marisol Vance|RBT-26-0001'&&f.name==='training-record-2026-11-13.json'&&/Send that file to your trainer/.test(f.note)&&f.rows===2&&/^0:(2[89]|3\d)$/.test(f.E)&&/^On the page, by kind: lesson 0:28, videos 0:00, examples 0:0\d, practice 0:0\d, quiz 0:0\d\.$/.test(f.kinds||'')&&rec.kind==='nbh-learn-record'&&rec.v===1&&rec.who.name==='Marisol Vance'&&rec.who.bacb==='RBT-26-0001'&&
    Object.keys(rec.days).join()==='2026-11-13'&&rec.u.e8.quiz.length===2&&rec.u.e8.fb.c==='More examples of DRL, please.'&&Object.keys(rec).sort().join()==='days,kind,made,tr,u,v,vc,who'&&JSON.stringify(rec.vc)==='{}'   /* v26.08: vc, the Check yourself scores of the videos (none here) */
    ,{f,keys:Object.keys(rec),days:rec.days});
  await A.ctx.close();

  /* ---------------- G the trainer ---------------- */
  const T=await open({viewport:{width:1180,height:820}},PAGE+'#trainer');const t=T.p,g={};
  g.link0=[await t.inputValue('#tLink'),await t.isDisabled('#tCopy')];
  await t.fill('#tName','Dr. Imogen Hartwell');await t.selectOption('#tCred','BCBA-D');await t.fill('#tCert','1-00-00000');await t.fill('#tOrg','Hartwell Behavior Services');
  g.link=await t.inputValue('#tLink');
  for(const k of ['c1','c2','c3','c4','c5','c6','c7'])await t.check('[data-chk="'+k+'"]');
  await t.fill('#aName','Tobias Reyes');await t.fill('#aCert','RBT-20-11111');await t.click('#aAdd');g.assist=await txt(t,'#tAssist');
  await t.click('#nAdd');g.miss=await txt(t,'#nMiss');
  await t.fill('#nName','Marisol Vance');await t.fill('#nBacb','RBT-26-0001');await t.fill('#nStart','2026-11-09');await t.click('#nAdd');
  await t.fill('#nName','Corwin Ashby');await t.fill('#nBacb','RBT-26-0002');await t.click('#nAdd');
  g.cards=await t.$$eval('#tList [data-tid]',x=>x.map(c=>c.querySelector('h3').textContent));const ids=await t.$$eval('#tList [data-tid]',x=>x.map(c=>c.dataset.tid));
  const give=async(sel,file)=>{const [fc]=await Promise.all([t.waitForEvent('filechooser'),t.click(sel)]);await fc.setFiles(file);await sleep(300);};
  await give('[data-rec="'+ids[1]+'"]',recPath);g.refused=await txt(t,'#tKeepNote');
  await give('[data-rec="'+ids[0]+'"]',recPath);g.taken=await txt(t,'#tKeepNote');g.card=await txt(t,'[data-tid="'+ids[0]+'"] .ln-note');
  await t.reload();await t.waitForSelector('#tName');g.kept=[await t.inputValue('#tName'),await t.inputValue('#tCred'),await t.$$eval('[data-chk]:checked',x=>x.length)];
  await go(t,'#trainer/'+ids[0]+'/log');g.by=await t.$$eval('#lgBy option',x=>x.map(o=>o.textContent));
  await t.selectOption('#lgK','roleplay');await t.selectOption('#lgU','e8');await t.fill('#lgM','25');g.steps=await t.$$eval('#lgSteps input',x=>x.length);
  for(const i of await t.$$('#lgSteps input'))await i.check();await t.fill('#lgN','Reset the timer without a word on the second run.');await t.click('#lgForm button[type=submit]');await sleep(200);
  await go(t,'#trainer/'+ids[0]+'/log');await t.selectOption('#lgK','roleplay');await t.selectOption('#lgU','e8');await t.selectOption('#lgR','1');await t.fill('#lgM','15');await t.check('#lgSteps input[data-step="0"]');await t.click('#lgForm button[type=submit]');await sleep(200);
  g.ses=await t.$$eval('#rSes tr',x=>x.map(r=>[r.cells[1].textContent,r.cells[3].textContent,r.cells[5].textContent.slice(0,16)].join('|')));
  g.rq=await t.$$eval('#rqList li',x=>x.map(l=>l.querySelector('.ln-pill').textContent));g.rq1=await txt(t,'#rqList li:nth-child(2)');g.fb=await txt(t,'#lnView');
  g.kinds=await txt(t,'#lnKinds');g.led=await t.$eval('#lnView table.ln-t tbody tr:nth-child(5)',r=>[r.cells[1].textContent,r.cells[2].textContent,r.cells[3].textContent]);
  await go(t,'#trainer/'+ids[0]+'/cert');g.no=await txt(t,'#certNo');g.sheet=await t.$$eval('#certSheet',x=>x.length);g.all=await txt(t,'body');
  ok('G the trainer: no link until the name and number are typed; the self-check and the details are kept; an assistant is listed; a trainee needs a name; the record file is refused for the trainee with another BACB ID and taken for its owner; a role-play with all 8 steps ticked is "Met" and one with 1 of 5 "Not yet"; the trainee’s section E shows the page’s time, 0:40 with the trainer and the sum; hours, days and units read "Not yet"; the certificate is refused, says the training is not released (all 46 units written, waiting for the review), and the page nowhere carries the statement',
    g.link0[0]===''&&g.link0[1]===true&&/learn\.html#t=[A-Za-z0-9_-]+$/.test(g.link)&&/Tobias Reyes, RBT-20-11111/.test(g.assist)&&/name/.test(g.miss)&&g.cards.join()==='Marisol Vance,Corwin Ashby'&&/Not added: the record’s BACB ID \(RBT-26-0001\) is not Corwin Ashby’s/.test(g.refused)&&
    g.taken==='Record added for Marisol Vance.'&&/started November 13, 2026 · record received [A-Z][a-z]+ \d+, \d{4}/.test(g.card)   /* v26.24 the trainer's page stamps the real day the record is added: the check named the day it was written and failed on any other */
    &&g.kept.join('|')==='Dr. Imogen Hartwell|BCBA-D|7'&&g.by.join()==='Dr. Imogen Hartwell,Tobias Reyes'&&g.steps===8&&g.ses.length===2&&/A resetting DRO.*\|25\|Met \(8 of 8\)/.test(g.ses[0])&&/DRA for attention\|15\|Not yet \(1 of 5/.test(g.ses[1])&&
    g.rq.join()==='Not yet,Not yet,Not yet,Not yet,Met,Not yet'&&/short in sections A, B, C, D, E, F, G, H/.test(g.rq1)&&/Mostly clear · More examples of DRL, please\./.test(g.fb)&&g.led[1]==='0:40'&&/by kind: lesson 0:28, videos 0:00/.test(g.kinds||'')&&/^1:(0[89]|1\d)$/.test(g.led[2])&&
    /No certificate can be made for Marisol Vance yet/.test(g.no)&&/not released yet: all 46 units are written and are waiting for the Responsible Trainer’s review/.test(g.no)&&g.sheet===0&&g.all.indexOf('designed to meet')<0,g);
  /* the link, on a trainee's own device */
  const N=await open({viewport:{width:390,height:800}},g.link);g.named=await txt(N.p,'.ln-you');g.hash=await N.p.evaluate(()=>location.hash);await N.ctx.close();
  ok('G the link, opened on another device, names the Responsible Trainer on the first screen (name, certification, number, organization) and leaves the address clean',
    /Your Responsible Trainer: Dr\. Imogen Hartwell, BCBA-D, certification number 1-00-00000 · Hartwell Behavior Services/.test(g.named)&&g.hash==='#home',{named:g.named,hash:g.hash});

  /* ---------------- M a record file that is not what it says ---------------- */
  const badPath=path.join(require('os').tmpdir(),'nbh-learn-bad-'+process.pid+'.json');
  fs.writeFileSync(badPath,JSON.stringify({kind:'nbh-learn-record',v:1,who:{name:'<img src=x onerror=window.__x=1>',bacb:'RBT-26-0002'},days:{'2026-11-12':{E:{lesson:9e9,hack:500},Z:{lesson:50}},'not-a-day':{E:{lesson:5}}},u:{e8:{quiz:[{at:'2026-11-12',right:'<b>',n:10,pct:900,pass:1}],fb:{r:'3',c:'<script>window.__y=1</script>'}},zz:{quiz:[]}},extra:{a:1}}));
  await go(t,'#trainer');await give('[data-rec="'+ids[1]+'"]',badPath);await go(t,'#trainer/'+ids[1]);
  const m={x:await t.evaluate(()=>[window.__x,window.__y,document.querySelectorAll('#lnView img,#lnView script,#lnView b:not(.ln-seg b)').length]),E:await t.$eval('#lnView table.ln-t tbody tr:nth-child(5)',r=>r.cells[1].textContent),
    rec:await t.evaluate(id=>{const x=window.NBHLearn.trainer().trainees.find(z=>z.id===id).rec;return [Object.keys(x.days).join(),JSON.stringify(x.days),Object.keys(x.u).join(),x.u.e8.quiz[0].pct,x.u.e8.quiz[0].right];},ids[1]),fb:await txt(t,'#lnView')};
  fs.unlinkSync(badPath);fs.unlinkSync(recPath);
  ok('M a record file with markup and wild numbers: no script runs and no element is made of it; a day’s time for a part is capped at 24 hours, unknown sections, kinds, days and units are dropped, a score over 100 is 100 and a score that is not a number is 0; the word for the trainer is shown as text',
    m.x[0]===undefined&&m.x[1]===undefined&&m.E==='24:00'&&m.rec[0]==='2026-11-12'&&m.rec[1]==='{"2026-11-12":{"E":{"lesson":86400}}}'&&m.rec[2]==='e8'&&m.rec[3]===100&&m.rec[4]===0&&m.fb.indexOf('<script>window.__y=1</script>')>=0,m);
  await T.ctx.close();

  /* ---------------- H a whole training (the map cut down to the written unit, here only) ---------------- */
  const cut=";(function(){var r=window.NBH_LEARN.rbt;r.ready=true;r.total=1;r.sections.forEach(function(s){s.min=s.k==='E'?1:0;s.units=s.units.filter(function(u){return u.id==='e8';});});})();";
  const whole=async(days,name)=>{const W=await open({viewport:{width:1180,height:900}},null,async ctx=>{
      await ctx.route('**/nbh-learn.js',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text())+cut});});
      await ctx.addInitScript(a=>{const d={};a.days.forEach(x=>{d[x]={E:{lesson:600,video:420}};});const chk={};['c1','c2','c3','c4','c5','c6','c7','a1','a2','a3','a4','a5'].forEach(k=>{chk[k]='2026-11-01';});
        const ses=[0,1,2].map(i=>({d:a.days[1],kind:'roleplay',unit:'e8',min:15,by:'Dr. Imogen Hartwell',role:i,steps:[1,1,1,1,1],met:1,note:''}));ses.push({d:a.days[a.days.length-1],kind:'discussion',unit:'e8',min:15,by:'Tobias Reyes',role:null,steps:null,met:0,note:''});
        localStorage.setItem('nbh.learn.trainer.v1',JSON.stringify({v:1,me:{name:'Dr. Imogen Hartwell',cred:'BCBA-D',cert:'1-00-00000',org:'Hartwell Behavior Services',sig:''},chk:chk,assist:[{name:'Tobias Reyes',cert:'RBT-20-11111'}],
          trainees:[{id:'tsim0001',name:a.name,bacb:'RBT-26-0001',start:a.days[0],rec:{who:{name:a.name,bacb:'RBT-26-0001'},days:d,u:{e8:{quiz:[{at:a.days[0],right:9,n:10,pct:90,pass:1}]}}},recAt:a.days[a.days.length-1],ses:ses}]}));},{days,name});});
    await W.p.goto(PAGE+'#trainer/tsim0001/cert');await W.p.waitForSelector('#lnView h1');return W;};
  {const W=await whole(['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10'],'Marisol Vance'),w=W.p;
   const h={dl:await w.$$eval('#certSheet dd',x=>x.map(d=>d.textContent)),title:await txt(w,'#certSheet h2'),stmt:await txt(w,'#certSheet .stmt'),org:await txt(w,'#certSheet .sub'),req:await w.evaluate(()=>{const r=window.NBHLearn.req('tsim0001');return [r.ok,r.tot,r.span,r.done,r.units];})};
   /* a signature drawn on the screen is put on the sheet */
   const bx=await w.$eval('#sigPad',c=>{c.scrollIntoView();const b=c.getBoundingClientRect();return [b.left,b.top];});await w.mouse.move(bx[0]+30,bx[1]+60);await w.mouse.down();await w.mouse.move(bx[0]+160,bx[1]+30,{steps:5});await w.mouse.move(bx[0]+260,bx[1]+80,{steps:5});await w.mouse.up();
   await w.click('#sigUse');await sleep(200);h.sig=await w.$$eval('#certSheet .sig img',x=>x.map(i=>i.getAttribute('src').slice(0,22)+'|'+i.alt));
   await w.goto(PAGE+'#home');await w.reload();await w.waitForSelector('#lnView h1');h.home=await txt(w,'.ln-state.ok');h.building=await w.$$eval('#lnBuilding',x=>x.length);
   ok('H a whole training: 1 hour 42 minutes on the page and 1 hour with the trainers over 6 days, the quiz passed, three role-plays met and the discussion held: the certificate names the applicant and the BACB ID, October 5 and October 10, 2026, "2 hours and 42 minutes", the Responsible Trainer with certification and number, the assistant trainer with number, the organization, and the BACB’s statement word for word; a signature drawn on the screen is put on it; the home page then carries the statement for materials and no "being built" notice',
     h.title==='RBT 2026 40-Hour Training Certificate'&&h.dl.join('|')==='Marisol Vance|RBT-26-0001|October 5, 2026|October 10, 2026|2 hours and 42 minutes|Dr. Imogen Hartwell, BCBA-D|1-00-00000|Tobias Reyes, RBT-20-11111'&&h.stmt===STMT&&h.org==='Hartwell Behavior Services'&&
     h.req.join()==='true,9720,6,1,1'&&h.sig.length===1&&/^data:image\/png;base64,\|Signature of Dr\. Imogen Hartwell$/.test(h.sig[0])&&h.home===M.rbt.statementPages&&h.building===0,h);
   await W.ctx.close();}
  {const W=await whole(['2026-10-05','2026-10-06','2026-10-07'],'Corwin Ashby'),w=W.p;const no=await txt(w,'#certNo'),sheet=await w.$$eval('#certSheet',x=>x.length);
   ok('H the same record over 3 days: no certificate, and the reason given is the days (no fewer than 5), not the hours',sheet===0&&/The days: 3 from the first day to the last/.test(no)&&!/The hours/.test(no)&&!/not whole/.test(no),{no,sheet});await W.ctx.close();}

  /* ---------------- I BCBA study, L an unwritten unit ---------------- */
  const B=await open({viewport:{width:1180,height:820}},PAGE+'#bcba');const q=B.p,i={};
  i.doms=await q.$$eval('.ln-dom',x=>x.map(a=>a.querySelector('.k').textContent).join(''));await q.click('.ln-dom[href="#bcba/G"]');await sleep(150);
  i.tasks=await q.$$eval('.ln-task',x=>x.length);i.h=await txt(q,'#lnView h1');await q.click('[data-task="G.2"] [data-rate="2"]');await q.click('[data-task="G.3"] [data-rate="1"]');
  await q.reload();await q.waitForSelector('.ln-task');i.kept=await q.$$eval('[data-rate][aria-pressed="true"]',x=>x.map(b=>b.closest('[data-task]').dataset.task+':'+b.textContent).join());
  await q.click('[data-task="G.2"] [data-open^="videos.html#family=dra"]');await q.waitForSelector('#lnDlg[open] iframe');i.src=await q.$eval('#lnDlg iframe',x=>x.getAttribute('src'));i.form=await q.$$eval('[data-task="G.2"] button[data-form]',x=>x.length);i.pill=await txt(q,'[data-task="G.2"] .ln-pill');await q.click('#lnDlgX');
  await go(q,'#home');i.home=await txt(q,'[aria-labelledby="hBcba"] .ln-facts');await go(q,'#bcba');i.row=await txt(q,'.ln-dom[href="#bcba/G"] .ln-note');i.clock=await q.evaluate(()=>window.NBHLearn.clock().kind);
  ok('I BCBA study: the nine domains A to I; domain G lists its 19 tasks; two ratings are kept over a reload and "1 you can explain" is counted on the home page and on the domain’s row; a task’s videos open in the player by procedure; on its own the page names a form without a button; no training time is counted here',
    i.doms==='ABCDEFGHI'&&i.tasks===19&&i.h==='Behavior-change procedures'&&i.kept==='G.2:Can explain it,G.3:Getting there'&&i.src==='videos.html#family=dra'&&i.form===0&&i.pill==='Form TD-1'&&/1 you can explain/.test(i.home)&&/19 tasks · 25 questions · 1 you can explain/.test(i.row)&&i.clock===null,i);
  await B.ctx.close();

  /* ---------------- L a unit whose lesson is missing (the file of units e4 to e6 is kept from the page, here only) ---------------- */
  const LL=await open({viewport:{width:1180,height:820}},null,async ctx=>{await ctx.route('**/nbh-learn-units-e2.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.NBH_LEARN_UNITS=window.NBH_LEARN_UNITS||{};'}));});
  const lq=LL.p;await lq.goto(PAGE);await lq.waitForSelector('#lnView h1');const l={home:await txt(lq,'#lnBuilding')};
  await go(lq,'#rbt');l.tocome=await lq.$$eval('.ln-pill.w',x=>x.length);
  await go(lq,'#rbt/e5');l.state=await txt(lq,'.ln-state');l.vids=await lq.$$eval('.ln-vid',x=>x.length);l.parts=await lq.$$eval('.ln-parts',x=>x.length);l.pill=await txt(lq,'.ln-uhead .ln-pill');
  await go(lq,'#rbt/e4');l.none=await txt(lq,'.ln-state');l.vids3=await lq.$$eval('.ln-vid',x=>x.length);await go(lq,'#rbt/nope');await sleep(150);l.back=await lq.evaluate(()=>location.hash);
  ok('L with three units missing the page says the training is being built (43 of 46 units) and marks three "Lesson to come"; such a unit says so ("still to be written"), carries no parts, and lists its videos to watch now (chaining: 5); one with no video says the workstation has none yet; an unknown unit goes back to the track',
    /being built/.test(l.home||'')&&/43 of 46 units/.test(l.home)&&/cannot yet be used toward RBT certification/.test(l.home)&&l.tocome===3&&/still to be written/.test(l.state)&&/can be watched now/.test(l.state)&&l.vids===5&&l.parts===0&&l.pill==='Lesson to come'&&/has no video for it yet/.test(l.none)&&l.vids3===0&&l.back==='#rbt',l);
  await LL.ctx.close();

  /* ---------------- N every unit opens; the order of the answers ---------------- */
  const NN=await open({viewport:{width:1180,height:820}},PAGE);const np=NN.p,n={bad:[],parts:0,orders:{}};
  for(const sec of M.rbt.sections)for(const u of sec.units){const c=U[u.id],parts=['lesson'].concat(c.watch&&c.watch.length?['watch']:[],['examples','practice','quiz','trainer']);
    for(const part of parts){await np.evaluate(x=>{location.hash=x;},'#rbt/'+u.id+'/'+part);await sleep(45);n.parts++;
      const got=await np.evaluate(()=>{const b=document.querySelector('#lnBody h2'),t=document.querySelector('#lnView h1');return [b?b.textContent:'',t?t.textContent:'',document.querySelectorAll('#lnBody .ln-opt').length];});
      if(!got[0]||got[1].indexOf(u.t.slice(0,12))<0||(part!=='watch'&&part!=='trainer'&&got[2]<2))n.bad.push(u.id+'/'+part+':'+JSON.stringify(got));}}
  const g1=U.g1.lesson[0].check;
  for(let r=0;r<10;r++){await go(np,'#rbt');await go(np,'#rbt/g1/lesson');n.orders[await np.$$eval('#lnCheck .ln-opt',x=>x.map(b=>b.dataset.pick).join(''))]=1;}
  n.perm=Object.keys(n.orders).every(o=>o.split('').sort().join('')===g1.opts.map((x,i2)=>i2).join(''));n.kinds=Object.keys(n.orders).length;
  const wrongPick=g1.a===0?1:0;await np.click('#lnCheck .ln-opt[data-pick="'+wrongPick+'"]');n.wrong=await np.$$eval('#lnCheck .ln-opt.wrong',x=>x.map(b=>b.dataset.pick).join());
  await np.click('#lnCheck .ln-opt[data-pick="'+g1.a+'"]');n.right=await np.$$eval('#lnCheck .ln-opt.right',x=>x.map(b=>b.dataset.pick+':'+b.textContent).join());n.why=await txt(np,'#lnWhy');
  await go(np,'#rbt/g2/lesson');for(let k2=0;k2<4;k2++){await np.click('#lnCheck .ln-opt[data-pick="'+U.g2.lesson[k2].check.a+'"]');await np.click('#lnNext');}
  n.num=await np.$$eval('#lnCheck .ln-opt',x=>x.map(b=>b.textContent).join('|'));n.numQ=await txt(np,'#lnCheck .q');
  await go(np,'#rbt/g1/quiz');const qs=await np.$$eval('#lnQuiz fieldset',x=>x.map(f=>+f.dataset.q));
  for(const qi of qs)await np.check('#lnQuiz fieldset[data-q="'+qi+'"] input[value="'+U.g1.quiz.items[qi].a+'"]');await np.click('#lnQuiz button[type=submit]');
  n.quiz=await txt(np,'#lnScore');n.marks=await np.$$eval('#lnQuiz fieldset',x=>x.every(f=>{const r2=f.querySelectorAll('.ln-opt.right');return r2.length===1&&r2[0].querySelector('input').checked&&!f.querySelector('.ln-opt.wrong');}));
  ok('N every one of the 46 units opens each of its parts under its own title, with answers to choose where there are questions ('+n.parts+' views); the answers of a lesson’s question come in more than one order over ten showings, each a full set; a wrong one is marked wrong and the right one right by what it says, not by where it stands; answers that are numbers keep their order (2, 5, 6, 12 hours); a quiz answered right throughout is 100% with the chosen answer marked right in each question',
    !n.bad.length&&n.parts>=46*5&&n.kinds>=2&&n.perm&&n.wrong===String(wrongPick)&&n.right===g1.a+':'+g1.opts[g1.a]&&/^Right\./.test(n.why||'')&&/120 hours/.test(n.numQ||'')&&n.num==='2 hours|5 hours|6 hours|12 hours'&&n.quiz==='100%'&&n.marks,
    {bad:n.bad.slice(0,6),parts:n.parts,kinds:n.kinds,perm:n.perm,wrong:n.wrong,right:n.right,num:n.num,quiz:n.quiz,marks:n.marks});
  await NN.ctx.close();

  /* ---------------- R (v26.02) the reading list: articles under the BCBA tasks and the units they bear on ---------------- */
  require(path.join(DIR,'nbh-learn-readings.js'));const RDL=global.window.NBH_LEARN_READINGS.list;
  const RR=await open({viewport:{width:1180,height:820}},PAGE);const rp=RR.p,r={};
  await go(rp,'#bcba/C');r.det=await rp.$$eval('.ln-task details.ln-read',x=>x.length);r.want=M.bcba.domains.find(d=>d.k==='C').tasks.filter(t=>RDL.some(x=>x.t.indexOf(t[0])>=0)).length;
  r.sum=await txt(rp,'[data-task="C.11"] .ln-read summary');r.n11=RDL.filter(x=>x.t.indexOf('C.11')>=0).length;r.shut=await rp.$eval('[data-task="C.11"] .ln-read',d=>d.open);
  await rp.click('[data-task="C.11"] .ln-read summary');r.items=await rp.$$eval('[data-task="C.11"] .ln-rd li',x=>x.length);r.first=await txt(rp,'[data-task="C.11"] .ln-rd li .ra');r.pill=await rp.$$eval('[data-task="C.11"] .ln-rd .ln-pill',x=>x.length);
  r.none=await rp.$$eval('[data-task="C.1"] .ln-read',x=>x.length);r.foot=await txt(rp,'.ln-foot');r.sumH=await rp.$eval('[data-task="C.11"] .ln-read summary',x=>Math.round(x.getBoundingClientRect().height));
  await rp.setViewportSize({width:390,height:800});await sleep(150);r.wide=await rp.evaluate(()=>document.documentElement.scrollWidth-390);await rp.setViewportSize({width:1180,height:820});
  await go(rp,'#rbt/c7/trainer');r.unit=await rp.$$eval('#lnBody .ln-rd li',x=>x.length);r.uwant=RDL.filter(x=>x.u.indexOf('c7')>=0).length;r.h=await rp.$$eval('#lnBody h3',x=>x.map(h=>h.textContent).join('|'));
  await go(rp,'#rbt/a1/trainer');r.a1=await rp.$$eval('#lnBody .ln-rd',x=>x.length);
  ok('R the reading list: in domain C every task that has articles carries a closed "articles to read" line ('+r.want+' tasks) and a task without any carries none; C.11 opens to its '+r.n11+' articles, each a note with the reference under it and the forms it bears on; the line is 44 px high and the open list fits a 390 px screen; the page says the notes come from abstracts; unit C7 lists its articles under "From the journals" and a unit without any has no such part',
    r.det===r.want&&r.want>0&&new RegExp('^'+r.n11+' articles to read$').test(r.sum||'')&&r.shut===false&&r.items===r.n11&&/Behavior Modification, \d+\(/.test(r.first||'')&&r.pill>0&&r.none===0&&/taken from its abstract/.test(r.foot||'')&&r.sumH>=44&&r.wide<=0&&r.unit===r.uwant&&r.uwant>0&&/From the journals/.test(r.h)&&r.a1===0,r);
  await RR.ctx.close();


  /* ---------------- J in the workstation ---------------- */
  const X=await br.newContext({serviceWorkers:'block',viewport:{width:1376,height:900}});const x=await X.newPage();x.on('pageerror',er=>errs.push(er.message));
  await x.goto(L.BASE+'/'+L.ED+'/index.html');await x.waitForFunction(()=>!!window.__wsVideos);await sleep(600);
  await x.evaluate(()=>window.__wsVideos.open('page:learn#rbt/e8/watch'));for(let k=0;k<60&&!x.frames().some(f=>/learn\.html/.test(f.url()));k++)await sleep(100);
  const lf=x.frames().find(f=>/learn\.html/.test(f.url()));await lf.waitForSelector('#lnView h1');
  const j={url:lf.url().split('/'+L.ED+'/').pop(),close:await lf.isVisible('#lnClose'),lib:await lf.isVisible('#lnToVideos'),framed:await lf.evaluate(()=>window.NBHLearn.framed()),layer:await x.evaluate(()=>window.__wsVideos.isOpen()),form:await lf.$$eval('button[data-form="SR-1"]',b=>b.length)};
  await lf.click('button[data-form="SR-1"]');await sleep(900);j.after=await x.evaluate(()=>[window.__wsVideos.isOpen(),typeof state!=='undefined'?state.cur:null]);
  await x.evaluate(()=>window.__wsVideos.open('page:learn#bcba'));await sleep(500);j.again=await x.evaluate(()=>window.__wsVideos.isOpen());const lf2=x.frames().find(f=>/learn\.html/.test(f.url()));await lf2.click('#lnClose');await sleep(400);j.closed=await x.evaluate(()=>window.__wsVideos.isOpen());
  j.cmd=await x.evaluate(()=>typeof CMDS!=='undefined'?CMDS.filter(c=>/^Learning: RBT training and BCBA study$/.test(c.n)).length:null);
  const vp=await X.newPage();await vp.goto(L.BASE+'/'+L.ED+'/videos.html');await vp.waitForSelector('#vlToLearn');j.link=await vp.$eval('#vlToLearn',a=>a.getAttribute('href')+'|'+a.textContent+'|'+Math.round(a.getBoundingClientRect().height));await X.close();
  ok('J in the workstation: the Learning page opens in the Videos layer at the address asked for, with Close and Video library; a unit’s Form SR-1 button closes the layer and opens Form SR-1; Close closes the layer; the command list has "Learning: RBT training and BCBA study"; the video library links to the page with a 44 px button',
    j.url==='learn.html#rbt/e8/watch'&&j.close&&j.lib&&j.framed&&j.layer&&j.form===1&&j.after[0]===false&&j.after[1]==='SR-1'&&j.again===true&&j.closed===false&&j.cmd===1&&/^learn\.html\|Learning: RBT training and BCBA study\|(4[4-9]|[5-9]\d)$/.test(j.link),j);

  /* ---------------- K a phone ---------------- */
  const P=await open({viewport:{width:390,height:800},hasTouch:true,isMobile:true},PAGE);const ph=P.p,k={};
  /* a phone's browser widens its window to a page that is too wide, so the page's width is held against the screen's 390 itself */
  const wide=()=>ph.evaluate(()=>Math.max(document.documentElement.scrollWidth,window.innerWidth)-390);
  for(const h of ['#home','#rbt','#rbt/e8/lesson','#rbt/e8/watch','#rbt/e8/examples','#rbt/e8/practice','#rbt/e8/quiz','#rbt/e8/trainer','#rbt/e5','#bcba','#bcba/G','#record','#trainer']){await go(ph,h);k[h]=await wide();}
  await go(ph,'#rbt/e8/examples');await ph.tap('.ln-opt[data-pick="'+U.e8.examples.items[0].a+'"]');k.tap=await txt(ph,'#lnWhy');
  await go(ph,'#rbt/e8/lesson');k.opt=await ph.$$eval('.ln-opt,.ln-steps button,.ln-parts a,.ln-nav a,#lnNext',x=>Math.min.apply(null,x.map(b=>Math.round(b.getBoundingClientRect().height))));
  k.seg=await ph.evaluate(()=>{location.hash='#home';return new Promise(r=>setTimeout(()=>r(Math.min.apply(null,[...document.querySelectorAll('.ln-seg')].map(s=>Math.round(s.getBoundingClientRect().width)))),150));});
  ok('K a phone (390 wide): none of the 13 views is wider than the screen (home, the track, every part of the unit, another unit, BCBA study and a domain, My record, the trainer’s page); a tapped answer is taken; every choice, step, part and link of the bar is at least 44 px high; the narrowest block of the ledger is still 26 px',
    Object.keys(k).filter(h=>h[0]==='#').length===13&&Object.keys(k).filter(h=>h[0]==='#').every(h=>k[h]<=0)&&/^Right\./.test(k.tap||'')&&k.opt>=44&&k.seg>=26,k);
  await P.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
