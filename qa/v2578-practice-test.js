/* v25.78 (the BCBA, 11/11: "lets do 1 and 2") Practice counting (practice.html): a drawn student does things at moments
   the page knows; the person practicing records the target; the page compares the record with the true one.
   G  the scenes: the same number gives the same scene; every scene holds each target, nothing overlaps, and the
      look-alikes (a raised hand, speaking after being called on, leaning to reach) are there at classroom pace.
   C  a count: a perfect record; one missed and one press at a look-alike (the totals agree and the page says the
      moments do not); the agreement figures two observers would compute.
   T  a duration and 10-second intervals: the same.
   R  a real scene: the countdown, the button, the keys of a presentation remote (Next records, Back takes the last one
      off), Stop scores nothing, the end, the results, "Show me", the scene again with the answers shown.
   P  the page: nothing kept on the device, nothing loaded from outside the folder, 44-px targets, a phone's width.
   Simulated people only. usage: node qa/v2578-practice-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),URL=L.BASE+'/NBH-Workstation/practice.html';
(async()=>{const br=await L.chromium.launch();const errs=[],outside=[];
 try{
  const src=fs.readFileSync(path.join(W,'practice.html'),'utf8'),sw=fs.readFileSync(path.join(W,'sw.js'),'utf8');
  ok('0 practice.html is in the folder and the offline list, draws with nbh-scene.js and names no address outside the folder; it says a drawn scene does not replace a check beside a trained observer',/'practice\.html'/.test(sw)&&/<script src="nbh-scene\.js"><\/script>/.test(src)&&!/https?:\/\//.test(src.replace(/<!--[\s\S]*?-->/g,''))&&/does not replace a check beside a trained observer with the student/.test(src)&&/Nothing here is a real student, and nothing you record is kept/.test(src));
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{const u=r.url();if(!u.startsWith(L.BASE)&&!u.startsWith('data:')&&!u.startsWith('blob:'))outside.push(u);});
  await p.goto(URL);await sleep(700);
  const E=(f,a)=>p.evaluate(f,a);
  /* ---------- G: the scenes ---------- */
  let g=await E(()=>{const P=NBHPractice,a=JSON.stringify(P.makeScene(4242,60,'class')),b=JSON.stringify(P.makeScene(4242,60,'class')),c=JSON.stringify(P.makeScene(4243,60,'class')),d=JSON.stringify(P.makeScene(4242,60,'easy'));
    let bad=[],n=0,kinds={},easyKinds={};for(let seed=1;seed<=400;seed++)for(const len of [60,120,180])for(const pace of ['easy','class']){n++;const ev=P.makeScene(seed,len,pace);
      let ov=false;for(let i=1;i<ev.length;i++)if(ev[i].t<ev[i-1].t+ev[i-1].dur+.9)ov=true;const end=ev[ev.length-1].t+ev[ev.length-1].dur;
      ev.forEach(e=>{(pace==='easy'?easyKinds:kinds)[e.k]=1;});
      if(!ev.some(e=>e.k==='call')||!ev.some(e=>e.k==='up')||ov||end>len-1.5||ev[0].t<1)bad.push([seed,len,pace]);}
    return {same:a===b,other:a!==c,pace:a!==d,n,bad:bad.slice(0,5),kinds:Object.keys(kinds).sort().join(),easy:Object.keys(easyKinds).sort().join(),first:a};});
  ok('G1 the same scene number gives the same scene; another number, or another pace, gives another',g.same&&g.other&&g.pace,g.first);
  ok('G2 across 2,400 scenes each holds a call-out and a time out of seat, nothing overlaps and nothing runs past the end; classroom pace holds the three look-alikes and the slower pace only the raised hand',g.n===2400&&!g.bad.length&&g.kinds==='call,called,hand,reach,up'&&g.easy==='call,hand,up',g);
  /* ---------- C: a count ---------- */
  await E(()=>NBHPractice.set({seed:4242,len:60,pace:'class',mode:'count'}));
  let r=await E(()=>{const P=NBHPractice,G=P.get(),T=P.truth(G.EV,60,'count'),Lk=P.looks(G.EV,'count');const perfect=P.run(T.map(x=>x.t0+.7));
    const rec=T.slice(1).map(x=>x.t0+.7);rec.push(Lk[0].t0+.5);rec.sort((a,b)=>a-b);const flawed=P.run(rec);const none=P.run([]);
    return {n:T.length,looks:Lk.map(l=>l.why),perfect:{main:perfect.main,items:perfect.items.length,rows:perfect.rows.map(r=>r[1])},flawed:{main:flawed.main,rows:flawed.rows.map(r=>r[1]),items:flawed.items.map(i=>i.k+':'+i.text)},none:{main:none.main,items:none.items.length},
      html:document.getElementById('prResBody').innerText,log:document.querySelectorAll('#prLog tbody tr').length};});
  ok('C1 a perfect count: 100% on every figure, and nothing missed or extra',r.n>=2&&r.perfect.main===100&&r.perfect.items===0&&r.perfect.rows.join('|')===r.n+'|'+r.n+'|100%|100%|100%',r.perfect);
  ok('C2 one call-out missed and one press at a raised hand: the totals still agree (100%), the count by interval does not, and the page names both moments and why the press was not a call-out',r.flawed.main===100&&r.flawed.rows.slice(0,3).join('|')===r.n+'|'+r.n+'|100%'&&parseInt(r.flawed.rows[3])<100&&parseInt(r.flawed.rows[4])<100&&r.flawed.items.length===2&&/^extra:You counted when she raised her hand and waited: not a call-out by this definition$/.test(r.flawed.items[0])&&/^miss:A call-out you did not count$/.test(r.flawed.items[1]),r.flawed);
  ok('C3 nothing recorded: 0%, each call-out listed as missed; each scene finished is listed under This visit',r.none.main===0&&r.none.items===r.n&&r.log===3,r.none);
  r=await E(()=>{const P=NBHPractice,G=P.get(),T=P.truth(G.EV,60,'count'),Lk=P.looks(G.EV,'count');const rec=T.slice(1).map(x=>x.t0+.7);rec.push(Lk[0].t0+.5);rec.sort((a,b)=>a-b);P.run(rec);return document.getElementById('prResBody').innerText;});
  ok('C4 when the totals agree and the moments do not, the page says so in a sentence; the two rows show green, red and amber marks',/The totals agree, but the moments do not: what was missed and what was added cancel out\. The count by interval shows it\./.test(r)&&(await E(()=>({hit:document.querySelectorAll('#prResBody .pr-lane i.hit').length,miss:document.querySelectorAll('#prResBody .pr-lane i.miss').length,extra:document.querySelectorAll('#prResBody .pr-lane i.extra').length})).then(x=>x.hit>=2&&x.hit%2===0&&x.miss===1&&x.extra===1)),r.slice(0,300));
  /* ---------- T: a duration, and intervals ---------- */
  await E(()=>NBHPractice.set({mode:'dur'}));
  r=await E(()=>{const P=NBHPractice,G=P.get(),T=P.truth(G.EV,60,'dur'),Lk=P.looks(G.EV,'dur');const perfect=P.run(T.map(x=>[x.t0,x.t1]));const half=P.run(T.map(x=>[x.t0,(x.t0+x.t1)/2]));const wrong=P.run(Lk.map(l=>[l.t0+.3,l.t1]));
    return {n:T.length,looks:Lk.length,perfect:[perfect.main,perfect.items.length],half:[half.main,half.rows.map(r=>r[1]).join('|')],wrong:{main:wrong.main,items:wrong.items.map(i=>i.k+':'+i.text)}};});
  ok('T1 a duration: the same spans give 100%; spans half as long give 50% (the shorter total over the longer); a span recorded while she only leaned to reach is named as not out of seat, and the time she was up as missed',r.n>=1&&r.looks>=1&&r.perfect.join()==='100,0'&&r.half[0]===50&&r.wrong.main<60&&r.wrong.items.some(x=>/^extra:You recorded when she leaned to reach, still on the chair: not out of seat by this definition$/.test(x))&&r.wrong.items.some(x=>/^miss:A time out of seat you did not record \(\d+ s\)$/.test(x)),r);
  await E(()=>NBHPractice.set({mode:'iv'}));
  r=await E(()=>{const P=NBHPractice,G=P.get(),T=P.truth(G.EV,60,'iv');const tb=[...new Set(T.flatMap(x=>{const a=[];for(let i=Math.floor(x.t0/10);i<=Math.min(5,Math.floor(x.t1/10));i++)a.push(i);return a;}))];
    const perfect=P.run(tb),all=P.run([0,1,2,3,4,5]),none=P.run([]);return {tb,perfect:perfect.rows.map(r=>r[1]).join('|'),all:all.rows.map(r=>r[1]).join('|'),none:none.rows.map(r=>r[1]).join('|'),items:all.items.map(i=>i.k).join()};});
  ok('T2 10-second intervals: marking the intervals with a call-out gives 100% on interval-by-interval, scored and unscored agreement; marking every interval, or none, gives the figures two observers would get',(k=>k>=1&&k<=5&&r.perfect===k+' of 6|'+k+' of 6|100%|100%|100%'&&r.all==='6 of 6|'+k+' of 6|'+Math.round(100*k/6)+'%|'+Math.round(100*k/6)+'%|0%'&&r.none==='0 of 6|'+k+' of 6|'+Math.round(100*(6-k)/6)+'%|0%|'+Math.round(100*(6-k)/6)+'%'&&r.items===new Array(6-k).fill('extra').join())(r.tb.length),r);
  /* ---------- R: a real scene ---------- */
  await E(()=>{window.__prFast=1;window.__prSpeed=10;NBHPractice.set({mode:'count',seed:4242,len:60,pace:'class'});});
  const before=await E(()=>({rec:document.getElementById('prRec').disabled,veil:!document.getElementById('prVeil').hidden,start:document.getElementById('prStart').textContent}));
  await p.click('#prStart');await sleep(450);
  const run1=await E(()=>({phase:NBHPractice.get().phase,rec:document.getElementById('prRec').disabled,recT:document.getElementById('prRec').textContent,setup:[...document.querySelectorAll('.pr-setup button')].every(b=>b.disabled),start:document.getElementById('prStart').textContent,veil:document.getElementById('prVeil').hidden}));
  await p.click('#prRec');await sleep(80);await p.keyboard.press('PageDown');await sleep(80);await p.keyboard.press('ArrowRight');await sleep(80);await p.keyboard.press('Space');await sleep(80);
  const c4=await E(()=>document.getElementById('prCount').textContent);await p.keyboard.press('PageUp');await sleep(60);await p.click('#prUndo');await sleep(60);
  const c2=await E(()=>({n:document.getElementById('prCount').textContent,presses:NBHPractice.get().presses.length}));
  ok('R1 before Start the button is off; Start counts down and the scene runs with the set-up locked; the button, Next, the right arrow and Space each record one; Back and "Take the last one off" each take one off',before.rec&&before.veil&&before.start==='Start'&&run1.phase==='run'&&!run1.rec&&run1.recT==='She called out'&&run1.setup&&run1.start==='Stop'&&run1.veil&&c4==='4'&&c2.n==='2'&&c2.presses===2,{before,run1,c4,c2});
  await p.click('#prStart');await sleep(200);const stopped=await E(()=>({phase:NBHPractice.get().phase,veil:document.getElementById('prVeil').innerText,log:document.querySelectorAll('#prLog tbody tr').length,res:document.getElementById('prResult').hidden,setup:[...document.querySelectorAll('.pr-setup button')].some(b=>b.disabled)}));
  ok('R2 Stop ends the scene and scores nothing',stopped.phase==='idle'&&/Stopped\. Nothing was scored\./.test(stopped.veil)&&stopped.res&&!stopped.setup,stopped);
  const logBefore=stopped.log;await p.click('#prStart');await sleep(450);await p.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:20000});
  const nCalls=await E(()=>NBHPractice.truth(NBHPractice.get().EV,60,'count').length);
  const done=await E(()=>({main:NBHPractice.get().review.main,items:NBHPractice.get().review.items.length,res:!document.getElementById('prResult').hidden,head:document.getElementById('prResBody').innerText.slice(0,80),rec:document.getElementById('prRec').textContent,log:document.querySelectorAll('#prLog tbody tr').length,live:document.getElementById('prLive').textContent,shows:document.querySelectorAll('#prResBody [data-show]').length}));
  ok('R3 a scene left to run to its end with nothing recorded: the results appear by themselves (0%, each call-out missed with a "Show me"), and the scene is added to This visit',done.main===0&&done.items===nCalls&&done.res&&/^0% agreement/.test(done.head)&&done.rec==='The scene has ended'&&done.log===logBefore+1&&/The scene has ended: 0% agreement/.test(done.live)&&done.shows===nCalls,done);
  await E(()=>{window.__prSpeed=3;});await p.click('#prResBody [data-show="0"]');await sleep(900);
  const tag1=await E(()=>({phase:NBHPractice.get().phase,t:NBHPractice.get().t,tag:document.getElementById('prTag').textContent,cls:document.getElementById('prTag').className,hidden:document.getElementById('prTag').hidden}));
  await p.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:15000});
  await E(()=>{window.__prSpeed=1;});await p.click('#prReplay');await sleep(300);await E(()=>{window.__prSpeed=12;});
  const seen=new Set();for(let i=0;i<70;i++){const x=await E(()=>document.getElementById('prTag').hidden?'':document.getElementById('prTag').className+'|'+document.getElementById('prTag').textContent);if(x)seen.add(x);if(await E(()=>NBHPractice.get().phase==='done'))break;await sleep(80);}
  ok('R4 "Show me" plays the seconds around that moment with the answer on the picture; the whole scene again marks each call-out to record, and each look-alike with why it is not one',tag1.phase==='review'&&tag1.t>20&&tag1.t<27&&[...seen].some(x=>/^pr-tag yes\|A call-out: record it$/.test(x))&&[...seen].some(x=>/^pr-tag no\|Not the target: she raised her hand and waited$/.test(x))&&[...seen].some(x=>/^pr-tag no\|Not the target: she spoke after being called on$/.test(x)),{tag1,seen:[...seen]});
  /* a duration by the keys: Next starts it and Next ends it */
  await E(()=>{window.__prFast=1;window.__prSpeed=10;NBHPractice.set({mode:'dur',seed:4242,len:60});});await p.click('#prStart');await sleep(450);await p.keyboard.press('PageDown');await sleep(300);
  const d1=await E(()=>({on:document.getElementById('prRec').classList.contains('on'),t:document.getElementById('prRec').textContent,open:NBHPractice.get().spans.length}));await p.keyboard.press('PageDown');await sleep(100);
  const d2=await E(()=>({on:document.getElementById('prRec').classList.contains('on'),s:NBHPractice.get().spans.map(x=>x.t1!==null&&x.t1>x.t0)}));
  await E(()=>{NBHPractice.set({mode:'iv'});});await p.click('#prStart');await sleep(450);await p.click('#prRec');await sleep(100);
  const i1=await E(()=>({on:document.getElementById('prRec').classList.contains('on'),t:document.getElementById('prRec').textContent,n:document.getElementById('prCount').textContent,ivs:document.querySelectorAll('#prIvs i').length,undo:document.getElementById('prUndo').disabled}));
  await p.waitForFunction(()=>NBHPractice.get().t>10.5,null,{timeout:8000});await sleep(60);const i2=await E(()=>({on:document.getElementById('prRec').classList.contains('on'),t:document.getElementById('prRec').textContent,marks:Object.keys(NBHPractice.get().marks).join()}));await p.click('#prStart');
  ok('R5 a duration: one press starts it (the button turns green and says what ends it), the next ends it. Intervals: a press marks the interval, the mark clears when the next interval starts, and the six intervals show as a row',d1.on&&d1.t==='She is seated again'&&d1.open===1&&!d2.on&&d2.s.join()==='true'&&i1.on&&i1.t==='Marked for this interval'&&i1.n==='1'&&i1.ivs===6&&i1.undo&&!i2.on&&i2.t==='It happened in this interval'&&i2.marks==='0',{d1,d2,i1,i2});
  /* ---------- P: the page ---------- */
  r=await E(async()=>{let idb=[];try{idb=(await indexedDB.databases()).map(d=>d.name);}catch(e){}return {ls:Object.keys(localStorage).join(),ss:Object.keys(sessionStorage).join(),idb:idb.join(),cookie:document.cookie,
    small:[...document.querySelectorAll('button,a.pr-btn,#prSeed')].filter(b=>b.offsetParent&&(b.offsetHeight<44||b.offsetWidth<44)).map(b=>b.id||b.textContent.slice(0,20)),rec:document.getElementById('prRec').offsetHeight,def:document.getElementById('prDef').innerText};});
  ok('P1 nothing is kept on the device (no storage, no cookie); every control is 44 px or more and the record button 88 px tall; the definition lists what is not the target',r.ls===''&&r.ss===''&&r.idb===''&&r.cookie===''&&!r.small.length&&r.rec>=88&&/Partial-interval recording, 10 s/.test(r.def)&&/Raising a hand and waiting is not a call-out/.test(r.def),r);
  await p.setViewportSize({width:390,height:800});await sleep(300);const ph=await E(()=>({over:document.documentElement.scrollWidth-document.documentElement.clientWidth,stage:document.getElementById('prStage').offsetWidth,cols:getComputedStyle(document.querySelector('.pr-grid')).gridTemplateColumns.split(' ').length}));
  ok('P2 at a phone’s width the page is one column and nothing runs off the side',ph.over<=1&&ph.stage>300&&ph.cols===1,ph);
  await p.close();
  ok('Z no page error, and no request left the folder',!errs.length&&!outside.length,{errs,outside:outside.slice(0,4)});
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
