/* v25.78 (the BCBA, 11/11: "lets do 1 and 2") the explainers (explain.html) and the scene they are drawn with (nbh-scene.js).
   0  the files: in the folder and the offline list, loading nothing from outside the folder; the cards the page names are
      in the protocol bank under those names; the video library and the workstation link to it.
   D  DRO, resetting: the timeline is worked out from the rule (an interval of work with no problem behavior earns the
      break; problem behavior restarts the interval), the interval chosen and the moments added; the timer shows it.
   F  FCT with a signal: a request on green is honored at once and the clock waits; a request on red gets no answer and
      is counted; red can be lengthened, the card taken away on red, an item added on red.
   U  the page: drag to any moment, play and pause, speed, tap or key a part of the picture, the rule from the card,
      44-px targets, nothing kept on the device, a phone's width.
   S  in the workstation: the command box opens it in the Videos frame, and a video asked for brings the library back.
   Simulated people only. usage: node qa/v2578-explain-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),URL=L.BASE+'/NBH-Workstation/explain.html?flat=1';   /* the flat drawing (what a device that cannot draw 3D shows); the lit 3D scene has its own test, v2578-scene3d-test */
(async()=>{const br=await L.chromium.launch();const errs=[],outside=[];
 try{
  const src=fs.readFileSync(path.join(W,'explain.html'),'utf8'),sc=fs.readFileSync(path.join(W,'nbh-scene.js'),'utf8'),sw=fs.readFileSync(path.join(W,'sw.js'),'utf8'),idx=fs.readFileSync(path.join(W,'index.html'),'utf8'),vid=fs.readFileSync(path.join(W,'videos.html'),'utf8'),bank=fs.readFileSync(path.join(W,'nbh-td1-bank.js'),'utf8');
  ok('0a explain.html and nbh-scene.js are in the folder and the offline list, and neither names an address outside the folder',/'explain\.html'/.test(sw)&&/'nbh-scene\.js'/.test(sw)&&!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(src.replace(/<!--[\s\S]*?-->/g,''))&&!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(sc)&&/<script src="nbh-scene\.js"><\/script>/.test(src));
  const labs=[...src.matchAll(/card <b>([^<]+)<\/b>/g)].map(m=>m[1]);
  ok('0b each card the page says it follows is in the protocol bank under that name, with the ids the page is built from',labs.length===2&&labs.every(l=>bank.includes('"lab":"'+l+'"'))&&/"id":"dro-break-after-calm-interval"/.test(bank)&&/"id":"fct-signaled-schedule-thinning"/.test(bank),labs);
  ok('0c the video library links to the explainers and the practice, a video with an explainer gains "Step through it", and the command box opens both pages',/href="explain\.html" id="vlToExplain"/.test(vid)&&/href="practice\.html" id="vlToPractice"/.test(vid)&&/EXPLAIN=\{dro_resetting:\['dro'/.test(vid)&&/fct_thinning_mult:\['fct'/.test(vid)&&/open\('page:explain',null\)/.test(idx)&&/open\('page:practice',null\)/.test(idx));

  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{const u=r.url();if(!u.startsWith(L.BASE)&&!u.startsWith('data:')&&!u.startsWith('blob:'))outside.push(u);});
  await p.emulateMedia({reducedMotion:'reduce'});
  await p.goto(URL+'#dro');await sleep(700);
  const E=(f,a)=>p.evaluate(f,a);
  const tl=()=>E(()=>{const g=NBHExplain.get();return {len:g.T.len,segs:g.T.segs.map(s=>s.k+':'+s.t0.toFixed(1)+'-'+s.t1.toFixed(1)).join(' '),marks:g.T.marks.filter(m=>!m.sw).map(m=>m.k+'@'+m.t.toFixed(1)).join(' ')};});
  const at=t=>E(t=>{NBHExplain.seek(t);const q=s=>document.querySelector(s);const tm=q('#exStage [data-part="timer"] text');
    return {step:q('#exStep').textContent,now:q('#exNow').textContent,timer:tm?tm.textContent:'',tally:[...document.querySelectorAll('#exTally dd')].map(d=>d.textContent).join('|'),
      ev:[...document.querySelectorAll('#exTry [data-ev]')].map(b=>b.disabled).join(),why:q('#exWhy').textContent,sig:(q('#exStage [data-part="signal"] rect:nth-of-type(2)')||{getAttribute(){return '';}}).getAttribute('fill'),
      card:getComputedStyle(q('#exStage [data-part="card"]')).display,item:getComputedStyle(q('#exStage [data-part="item"]')).display,bubbles:[...document.querySelectorAll('#exStage svg g[aria-hidden] text')].map(x=>x.textContent).join(' ')};},t);

  /* ---------- D: DRO, resetting ---------- */
  let T=await tl();
  ok('D1 the example: 10 s of calm work earns a 10-s break; problem behavior at 0:26 restarts the interval, so that break comes at 0:36',T.len===70&&T.segs==='work:0.0-10.0 break:10.0-20.0 work:20.0-36.0 break:36.0-46.0 work:46.0-56.0 break:56.0-66.0 work:66.0-70.0'&&T.marks==='earn@10.0 pb@26.0 earn@36.0 earn@56.0',T);
  const d5=await at(5),d27=await at(27),d12=await at(12),d30=await at(30);
  ok('D2 the timer counts the interval down, shows the full interval again right after problem behavior, and counts the break',d5.timer==='0:05'&&/^Work: 0:05 left/.test(d5.step)&&d27.timer==='0:09'&&/Problem behavior: the interval restarts/.test(d27.step)&&/restarts from zero/.test(d27.now)&&/No!/.test(d27.bubbles)&&d12.timer==='0:08'&&/^Break: 0:08 left/.test(d12.step)&&/Break time/.test(d12.bubbles)&&d30.timer==='0:06',{d5,d27,d12,d30});
  ok('D3 the tally follows the moment: breaks earned, problem behavior, its rate',d5.tally==='0|0|0.0|10 s'&&d27.tally==='1|1|2.2|10 s'&&(await at(60)).tally==='3|1|1.0|10 s',[d5.tally,d27.tally]);
  ok('D4 during a break "Problem behavior happens now" is off, and the page says the card does not cover it',d5.ev==='false'&&d12.ev==='true'&&/card does not say what to do about problem behavior in a break/.test(d12.why)&&d5.why==='',{a:d5.ev,b:d12.ev,why:d12.why});
  await at(3);await p.click('#exTry [data-ev="pb"]');await sleep(250);T=await tl();
  const g1=await E(()=>NBHExplain.get());
  ok('D5 problem behavior added at 0:03 restarts the first interval (its break moves from 0:10 to 0:13) and every later moment follows; with reduced motion the page does not start playing by itself',/^work:0\.0-13\.0 break:13\.0-23\.0/.test(T.segs)&&/^pb@3\.0 earn@13\.0/.test(T.marks)&&g1.playing===false&&g1.EV.length===2,{T,playing:g1.playing});
  await p.click('#exReset');await sleep(200);await p.click('#exTry [data-set="interval"][data-v="30"]');await sleep(250);T=await tl();
  const d30b=await at(10);
  ok('D6 Back to the example, then a 30-s interval: three breaks would need 130 s, the example’s problem behavior moves with it, and the sign and the timer say 30 s',T.len===130&&/^work:0\.0-30\.0 break:30\.0-40\.0 work:40\.0-76\.0/.test(T.segs)&&/pb@46\.0/.test(T.marks)&&d30b.timer==='0:20'&&d30b.tally.endsWith('30 s')&&[...await E(()=>[...document.querySelectorAll('#exTry [data-set="interval"]')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed')))].join()==='10 s:false,20 s:false,30 s:true,1 min:false,1 min 30 s:false,2 min:false',{T,d30b});

  /* ---------- F: FCT, green and red ---------- */
  await p.click('#exPick [data-pick="fct"]');await sleep(400);T=await tl();
  ok('F1 the example: asked on green at 0:05 (honored for 20 s, the clock waiting), asked on red at 0:55 (no answer), asked on green at 1:04',T.len===150&&T.segs==='green:0.0-5.0 rf:5.0-25.0 green:25.0-50.0 red:50.0-55.0 red:55.0-60.0 green:60.0-64.0 rf:64.0-84.0 green:84.0-110.0 red:110.0-120.0 green:120.0-150.0'&&T.marks==='honored@5.0 ignored@55.0 honored@64.0',T);
  const f2=await at(2),f10=await at(10),f52=await at(52),f56=await at(56),f61=await at(61);
  ok('F2 on green the signal is green and the timer counts green; a request is honored at once and the clock waits; on red the signal is red and a request gets no answer and no look',f2.sig==='#3E8E5A'&&f2.timer==='0:28'&&/^Green: 0:28 left/.test(f2.step)&&f10.timer==='0:25'&&/request honored, 0:15 with her/.test(f10.step)&&/clock waits/.test(f10.now)&&f52.sig==='#C7533B'&&f52.timer==='0:08'&&/^Red: 0:08 left/.test(f52.step)&&/no answer and no look/.test(f56.now)&&f61.sig==='#3E8E5A',{f2,f10,f52,f56});
  ok('F3 the tally counts requests on green and on red and the share made on green; a request cannot be added while she has the adult’s attention, and the page says why',f2.tally==='0|0|–|10 s'&&f10.tally==='1|0|100%|10 s'&&(await at(70)).tally==='2|1|67%|10 s'&&f10.ev==='true'&&/already has what the request asks for/.test(f10.why)&&f52.ev==='false',[f10.tally,f10.why]);
  await at(52);await p.click('#exTry [data-ev="req"]');await sleep(250);const T2=await tl();
  ok('F4 a request added on red at 0:52 is one more request on red and changes nothing else in the schedule',/ignored@52\.0 ignored@55\.0/.test(T2.marks)&&T2.segs.replace('red:50.0-52.0 red:52.0-55.0','red:50.0-55.0')===T.segs,T2);
  await p.click('#exTry [data-toggle="away"]');await sleep(250);const fa=await at(53),T3=await tl(),fg=await at(30);
  ok('F5 "Take the card away on red": on red the card is gone and she cannot ask with it (the page says so); the requests on red are no longer counted; on green the card is back',fa.card==='none'&&fa.ev==='true'&&/card has been taken away/.test(fa.why)&&!/ignored/.test(T3.marks)&&fg.card!=='none'&&/taken away until green/.test(fa.now),{fa,T3});
  await p.click('#exTry [data-toggle="item"]');await sleep(200);const fi=await at(53),fi2=await at(30);
  ok('F6 "Add a preferred item on red": an item is on the table on red and not on green',fi.item!=='none'&&fi2.item==='none',{fi:fi.item,fi2:fi2.item});
  await p.click('#exReset');await sleep(150);await p.click('#exTry [data-toggle="away"]');await p.click('#exTry [data-toggle="item"]');await p.click('#exTry [data-set="red"][data-v="60"]');await sleep(250);const T4=await tl();
  ok('F7 red lengthened to 1 min: the red periods last 60 s and the scene is long enough to show two of them',T4.len===250&&/red:50\.0-/.test(T4.segs)&&/red:\d+\.0-(\d+)\.0 green/.test(T4.segs)&&(()=>{const m=[...T4.segs.matchAll(/(red|green|rf):([\d.]+)-([\d.]+)/g)].map(x=>[x[1],+x[2],+x[3]]);let red=0;m.forEach(x=>{if(x[0]==='red')red+=x[2]-x[1];});return red===120;})(),T4);

  /* ---------- U: the page ---------- */
  await p.click('#exPick [data-pick="dro"]');await sleep(300);
  await E(()=>{const s=document.getElementById('exScrub');s.value='37';s.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(150);
  let u=await E(()=>({t:NBHExplain.get().t,step:document.getElementById('exStep').textContent,vt:document.getElementById('exScrub').getAttribute('aria-valuetext'),time:document.getElementById('exTime').textContent}));
  ok('U1 dragging the bar shows that moment, and the bar says the moment in words',u.t===37&&/^Break: 0:09 left/.test(u.step)&&/^37 s of 1 min 10 s: Break/.test(u.vt)&&u.time==='0:37 / 1:10',u);
  await p.click('#exPlay');await sleep(1200);const t1=await E(()=>NBHExplain.get().t);await p.click('#exPlay');await sleep(200);const t2=await E(()=>({t:NBHExplain.get().t,playing:NBHExplain.get().playing,label:document.getElementById('exPlay').textContent}));await sleep(400);const t3=await E(()=>NBHExplain.get().t);
  await p.click('[data-speed="4"]');await p.click('#exPlay');await sleep(1000);await p.click('#exPlay');const t4=await E(()=>NBHExplain.get().t);
  ok('U2 Play moves through the procedure in real time and Pause holds it; 4× goes four times as fast',t1>37.8&&t1<38.8&&t2.playing===false&&t2.label==='Play'&&Math.abs(t3-t2.t)<.01&&t4-t3>3&&t4-t3<5.2,{t1,t2,t3,t4});
  await p.click('#exStage [data-part="timer"]');await sleep(150);const pt=await E(()=>({txt:document.getElementById('exPart').textContent,on:document.querySelector('#exStage [data-part="timer"]').classList.contains('on')}));
  await p.focus('#exStage [data-part="adult"]');await p.keyboard.press('Enter');await sleep(150);const pa=await E(()=>({txt:document.getElementById('exPart').textContent,role:document.querySelector('#exStage [data-part="adult"]').getAttribute('role'),label:document.querySelector('#exStage [data-part="adult"]').getAttribute('aria-label'),tab:document.querySelector('#exStage [data-part="adult"]').getAttribute('tabindex')}));
  ok('U3 a part of the picture that is tapped, or reached with the keyboard and pressed, says what it is for in this procedure',/^The timerIt counts the interval of work with no problem behavior/.test(pt.txt)&&pt.on&&/^The adultPraises correct answers/.test(pa.txt)&&pa.role==='button'&&pa.label==='The adult'&&pa.tab==='0',{pt,pa});
  u=await E(()=>({rule:[...document.querySelectorAll('#exRule li')].map(l=>l.textContent),src:document.getElementById('exSrc').textContent,small:[...document.querySelectorAll('button,a.ex-btn,#exScrub')].filter(b=>b.offsetParent&&(b.offsetHeight<44||b.offsetWidth<44)).map(b=>b.id||b.textContent.slice(0,20)),
    ls:Object.keys(localStorage).join(),ss:Object.keys(sessionStorage).join(),live:document.getElementById('exNow').getAttribute('aria-live'),svgLabel:document.querySelector('#exStage svg').getAttribute('aria-label')}));
  ok('U4 the rule is the card’s own steps; the page says what the study was and that the restrictive steps are not shown; every control is 44 px or more; nothing is kept on the device',u.rule.length===5&&u.rule[1]==='Restart the interval from zero each time problem behavior occurs.'&&/two 4-year-olds at home/.test(u.src)&&/restrictive and are not shown/.test(u.src)&&/Adapt every step to the student’s plan/.test(u.src)&&!u.small.length&&u.ls===''&&u.ss===''&&u.live==='polite'&&/drawn scene/.test(u.svgLabel),u);
  await p.setViewportSize({width:390,height:800});await sleep(300);const ph=await E(()=>({over:document.documentElement.scrollWidth-document.documentElement.clientWidth,stage:document.getElementById('exStage').offsetWidth,cols:getComputedStyle(document.querySelector('.ex-grid')).gridTemplateColumns.split(' ').length}));
  ok('U5 at a phone’s width the page is one column and nothing runs off the side',ph.over<=1&&ph.stage>300&&ph.cols===1,ph);
  await p.close();

  /* ---------- S: in the workstation ---------- */
  const s=await ctx.newPage();s.on('pageerror',e=>errs.push('shell: '+e.message));await s.goto(L.shellUrl());await sleep(1500);
  const sh=await s.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const cmds=CMDS.filter(c=>/^Explainers:|^Practice counting:/.test(c.n)).map(c=>c.n);
    CMDS.find(c=>/^Explainers:/.test(c.n)).go();await w(1500);const fr=window.__wsVideos.frame();const a=fr.contentWindow.location.pathname.split('/').pop(),open=window.__wsVideos.isOpen(),has=!!fr.contentWindow.NBHExplain;
    window.__wsVideos.open('dro_resetting');await w(1800);const b=fr.contentWindow.location.pathname.split('/').pop()+fr.contentWindow.location.hash;
    const link=fr.contentDocument.querySelector('a.vl-explain');const href=link&&link.getAttribute('href');
    window.__wsVideos.open('page:practice');await w(1500);const c=fr.contentWindow.location.pathname.split('/').pop(),has2=!!fr.contentWindow.NBHPractice;window.__wsVideos.close();return {cmds,a,open,has,b,href,c,has2};});
  ok('S1 the command box lists Explainers and Practice counting; each opens in the Videos frame; a video asked for while one is showing brings the library back, and that video’s page offers "Step through it"',sh.cmds.length===2&&sh.a==='explain.html'&&sh.open&&sh.has&&sh.b==='videos.html#video=dro_resetting'&&sh.href==='explain.html#dro'&&sh.c==='practice.html'&&sh.has2,sh);
  await s.close();
  ok('Z no page error, and no request left the folder',!errs.length&&!outside.length,{errs,outside:outside.slice(0,4)});
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
