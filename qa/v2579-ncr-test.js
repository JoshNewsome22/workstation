/* v25.79 (the BCBA, 11/11: "start making the next explainer/practice video for the next intervention") NCR for attention on
   a fixed-time schedule, from Form TD-1's card ncr-attention-ft1-after-school (after Noel & Getch, 2016):
   N  the explainer (explain.html#ncr): the timer buzzes on the clock, the comment comes within 5 s, problem behavior does
      not move the timer (the difference from DRO), and the page says what the card leaves open.
   P  the practice (practice.html, "Comments on a timer (you are the adult)"): the scenes the page makes, and the score of a
      scripted run: on time, late, missed, extra, the share of buzzes with an on-time comment and the 80% line.
   L  the links: the video library offers "Step through it" on the NCR attention video; the lit 3D scene draws it.
   Simulated people only. usage: node qa/v2579-ncr-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),U=L.BASE+'/NBH-Workstation/';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ex=fs.readFileSync(path.join(W,'explain.html'),'utf8'),pr=fs.readFileSync(path.join(W,'practice.html'),'utf8'),vid=fs.readFileSync(path.join(W,'videos.html'),'utf8'),bank=fs.readFileSync(path.join(W,'nbh-td1-bank.js'),'utf8'),list=fs.readFileSync(path.join(L.ROOT,'qa','release-list.txt'),'utf8');
  const LAB='Fixed-time attention every minute, cued by a vibrating timer, for attention-maintained disruption during group lessons';
  ok('L1 the card both pages follow is in the protocol bank under that name; the library offers "Step through it" on the NCR attention video; this test is in the release list',
    bank.includes('"id":"ncr-attention-ft1-after-school","code":"NCR","lab":"'+LAB+'"')&&ex.includes('card <b>'+LAB+'</b>')&&/ncr-attention-ft1-after-school/.test(pr)&&/ncr_attention:\['ncr','NCR: attention on a timer'\]/.test(vid)&&/(^|\n)v2579-ncr-test(\n|$)/.test(list));
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('explain: '+e.message));await p.emulateMedia({reducedMotion:'reduce'});
  await p.goto(U+'explain.html?flat=1#ncr');await sleep(800);
  const E=(f,a)=>p.evaluate(f,a);
  const tl=()=>E(()=>{const g=NBHExplain.get();return {len:g.T.len,segs:g.T.segs.map(s=>s.k+':'+s.t0.toFixed(1)+'-'+s.t1.toFixed(1)).join(' '),marks:g.T.marks.filter(m=>!m.sw).map(m=>m.k+'@'+m.t.toFixed(1)).join(' ')};});
  const at=t=>E(t=>{NBHExplain.seek(t);const q=s=>document.querySelector(s);const tm=q('#exStage [data-part="timer"] text');
    return {step:q('#exStep').textContent,now:q('#exNow').textContent,timer:tm?tm.textContent:'',tally:[...document.querySelectorAll('#exTally dd')].map(d=>d.textContent).join('|'),bubbles:[...document.querySelectorAll('#exStage svg g[aria-hidden] text')].map(x=>x.textContent).join(' ')};},t);
  /* ---------- N: the explainer ---------- */
  const pg=await E(()=>({title:document.title,picks:[...document.querySelectorAll('#exPick [data-pick]')].map(b=>b.dataset.pick+':'+b.getAttribute('aria-pressed')).join(),sets:[...document.querySelectorAll('#exTry [data-set]')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed')).join(),rule:document.querySelector('#exRule').textContent,src:document.querySelector('#exSrc').textContent}));
  ok('N1 explain.html#ncr opens the NCR explainer: third in the list and pressed, the timer at 1 min of 1, 2 and 3 min, the rule from the card (a short neutral comment by name within 5 s; no praise, no reprimand), and the note that the people are drawn',
    /^NCR: attention on a timer/.test(pg.title)&&pg.picks==='dro:false,fct:false,ncr:true'&&pg.sets==='1 min:true,2 min:false,3 min:false'&&/one short neutral comment by name within 5 s/.test(pg.rule)&&/no praise, no reprimand/.test(pg.rule)&&/The people are drawn/.test(pg.src)&&/Noel & Getch \(2016\)/.test(pg.src),pg);
  let T=await tl();
  ok('N2 the example: a buzz each minute on the clock (1:00, 2:00, 3:00), a comment in the 5 s after each, problem behavior at 0:25 and at 1:57',T.len===200&&T.segs==='wait:0.0-60.0 com:60.0-65.0 wait:65.0-120.0 com:120.0-125.0 wait:125.0-180.0 com:180.0-185.0 wait:185.0-200.0'&&T.marks==='pb@25.2 buzz@60.0 pb@117.0 buzz@120.0 buzz@180.0',T);
  const a10=await at(10),a26=await at(26),a61=await at(61),a64=await at(64),a118=await at(118),a121=await at(121);
  ok('N3 the timer counts down to the buzz; at the buzz the adult gives one comment by name and the page says what kind',a10.timer==='0:50'&&/^Lesson: 0:50 to the next buzz/.test(a10.step)&&a61.timer==='Bzz'&&/^A comment, within 5 s of the buzz/.test(a61.step)&&/^\(Name\), /.test(a61.bubbles)&&/No praise, no reprimand, and not to the whole group/.test(a61.now)&&a64.timer==='0:56',{a10,a61,a64});
  ok('N4 problem behavior does not move the timer (0:34 left at 0:26, as it would have been), and the page says the card does not say how adults respond between buzzes',a26.timer==='0:34'&&/the timer does not move/.test(a26.step)&&/keeps its time: 0:34 to the next buzz/.test(a26.now)&&/card does not say how adults respond between buzzes: set that in the plan/.test(a26.now),a26);
  ok('N5 problem behavior just before a buzz: the page says the card gives no rule for it, and the comment still comes on time here',/just before a buzz, and the card gives no rule for that either/.test(a118.now)&&a121.timer==='Bzz'&&/the comment is still given on time here\. Decide it in the plan/.test(a121.now),{a118,a121});
  ok('N6 the tally: buzzes, comments within 5 s, problem behavior and its rate',a10.tally==='0|0 of 0|0|0.0|1 min'&&a61.tally==='1|0 of 1|1|1.0|1 min'&&a64.tally==='1|1 of 1|1|0.9|1 min'&&(await at(190)).tally==='3|3 of 3|2|0.6|1 min',[a10.tally,a61.tally,a64.tally]);
  await at(30);await p.click('#exTry [data-ev="pb"]');await sleep(250);const T2=await tl();
  ok('N7 "Problem behavior happens now" at 0:30 adds that moment and changes nothing in the schedule',T2.segs===T.segs&&T2.marks==='pb@25.2 pb@30.0 buzz@60.0 pb@117.0 buzz@120.0 buzz@180.0',T2);
  await p.click('#exReset');await sleep(200);await p.click('#exTry [data-set="interval"][data-v="120"]');await sleep(250);const T3=await tl();
  ok('N8 a 2-min timer: buzzes at 2:00, 4:00 and 6:00, and the example’s problem behavior moves with it',T3.len===380&&/^wait:0\.0-120\.0 com:120\.0-125\.0 wait:125\.0-240\.0/.test(T3.segs)&&T3.marks==='pb@50.4 buzz@120.0 pb@237.0 buzz@240.0 buzz@360.0',T3);
  await p.close();
  /* the lit 3D scene draws it too */
  {const q=await ctx.newPage();q.on('pageerror',e=>errs.push('3d: '+e.message));await q.goto(U+'explain.html#ncr');await sleep(2500);
   const r=await q.evaluate(()=>({three:!!(window.NBHScene3D&&NBHScene3D.ok&&NBHScene3D.ok()),canvas:document.querySelectorAll('#exStage canvas').length,parts:document.querySelectorAll('#exStage .ns-part').length,step:document.querySelector('#exStep').textContent}));
   ok('L2 without ?flat=1 the NCR explainer is drawn in 3D where the browser can (else flat), with its parts to tap',r.three?(r.canvas===1&&r.parts>=5):r.parts>=5,r);await q.close();}
  /* ---------- P: the practice ---------- */
  const c=await ctx.newPage();c.on('pageerror',e=>errs.push('practice: '+e.message));await c.goto(U+'practice.html?flat=1');await c.waitForFunction(()=>window.NBHPractice,null,{timeout:30000});await sleep(400);
  const modes=await c.evaluate(()=>[...document.querySelectorAll('[data-mode]')].map(b=>b.dataset.mode+':'+b.textContent.trim()).join('|'));
  ok('P1 the practice page offers the fourth way: Comments on a timer (you are the adult), beside count, duration and intervals',modes==='count:A count|dur:A duration|iv:10-second intervals|ncr:Comments on a timer (you are the adult)',modes);
  const gen=await c.evaluate(()=>{const bad=[];for(let seed=1;seed<=60;seed++)for(const len of [60,120,180])for(const pace of ['easy','class']){NBHPractice.set({mode:'ncr',seed,len,pace});const ev=NBHPractice.get().EV,bz=ev.filter(e=>e.k==='buzz'),pb=ev.filter(e=>e.k==='pb');
    if(bz.length!==Math.floor((len-6)/20)||!pb.length||bz.some((e,i)=>e.t!==20*(i+1)))bad.push(['count',seed,len,pace,bz.length,pb.length]);
    pb.forEach((e,i)=>{if(i&&e.t-pb[i-1].t<5)bad.push(['close',seed,len]);const after=e.t%20;if(e.t>=20&&after<5.5)bad.push(['afterbuzz',seed,len,e.t]);if(e.t<2||e.t>len-3)bad.push(['edge',seed,e.t]);});}return bad;});
  ok('P2 360 scenes: a buzz every 20 s on the clock, problem behavior in each, never on a buzz or in the 5.5 s after one, never two within 5 s',!gen.length,gen.slice(0,5));
  await c.evaluate(()=>{window.__prFast=1;window.__prSpeed=12;NBHPractice.set({mode:'ncr',seed:4242,len:120,pace:'class'});});
  const ev=await c.evaluate(()=>NBHPractice.get().EV.map(e=>e.k+'@'+e.t).join(' '));
  await c.click('#prStart');await c.waitForFunction(()=>NBHPractice.get().phase==='run',null,{timeout:10000});
  /* the comments of a scripted adult: on time at the 1st, 3rd and 5th buzz, 7 s late at the 2nd, none at the 4th, and one right after the first problem behavior */
  await c.evaluate(()=>{const g=NBHPractice.get(),pb=g.EV.filter(e=>e.k==='pb')[0],arr=g.presses;[21.5,47,62,pb.t+1,100.4].forEach(x=>arr.push(x));arr.sort((a,b)=>a-b);});
  await c.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:40000});await sleep(300);
  const r=await c.evaluate(()=>{const o=NBHPractice.get().review;return {main:o.main,word:o.word,rows:o.rows.map(x=>x[0]+': '+x[1]).join(' | '),items:o.items.map(i=>i.k+'@'+i.t.toFixed(1)+' '+i.text).join(' | '),h:document.querySelector('#prResH').textContent,body:document.querySelector('#prResBody').textContent,log:document.querySelector('#prLog tbody tr').textContent,ls:Object.keys(localStorage).join()+Object.keys(sessionStorage).join()};});
  ok('P3 scene 4242 (2 min): five buzzes, and the scripted adult scores 3 on time, 1 late, 1 missed, 1 extra: 60% of buzzes with an on-time comment, average delay 1.3 s',/^pb@14\.7 buzz@20 /.test(ev)&&(ev.match(/buzz@/g)||[]).length===5&&r.main===60&&r.word==='on time'&&r.rows==='Buzzes: 5 | Comments on time (within 5 s): 3 | Late: 1 | Missed: 1 | Extra comments (no buzz): 1 | Buzzes followed by an on-time comment: 60% | Average delay of the on-time comments: 1.3 s',{ev,r});
  ok('P4 the review names each fault: the comment right after problem behavior (it can work as attention for the behavior), the late one with its delay, the buzz with no comment',/extra@15\.7 A comment right after problem behavior, with no buzz: it can work as attention for the behavior/.test(r.items)&&/extra@47\.0 Late: 7\.0 s after the buzz \(the card allows 5 s\)/.test(r.items)&&/miss@80\.0 The timer buzzed and no comment was given before the next buzz/.test(r.items),r.items);
  ok('P5 the result is read against the study’s 80% (below it here), says extra comments are not in that figure, goes in the session’s list, and nothing is kept on the device',r.h==='Your comments and the timer'&&/^60% on time/.test(r.body)&&/Below 80%, the level staff practiced to in the study/.test(r.body)&&/Extra comments are not in that figure/.test(r.body)&&r.log==='4242Comments on the timer2 min60% on time'&&r.ls==='',r);
  await c.evaluate(()=>{NBHPractice.set({mode:'count',seed:4242,len:60,pace:'class'});});await c.click('#prStart');await c.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:40000});
  const cm=await c.evaluate(()=>({h:document.querySelector('#prResH').textContent,word:NBHPractice.get().review.word||''}));
  ok('P6 a count scene after it is scored as before (the heading is the record’s again)',cm.h==='Your record and what happened'&&cm.word!=='on time',cm);
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
