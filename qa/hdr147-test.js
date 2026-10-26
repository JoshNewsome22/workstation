/* v24.47 the workstation's bars above a form fold and come back without moving the page (the BCBA's screen recordings
   of 10/26). On an iPad in landscape (touch): a line of the form is followed frame by frame while the bars fold and come
   back, and must not move; the bars slide as one piece (the header's top passes through the positions between); small
   movements change nothing; a deliberate scroll down folds them once the page comes to rest, a clear scroll up brings
   them back, the top of a form brings them back with the page; the form's toolbar folds and opens with them and not on
   its own; the pin keeps them; a desktop never folds; closing the form leaves them out.
   usage: node qa/hdr147-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
 const w=await ctx.newPage();w.on('pageerror',e=>errs.push('shell: '+e.message));await w.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);
 await w.evaluate(()=>{try{localStorage.removeItem('nbh.ws.pinbars');}catch(e){}});
 await w.evaluate(()=>openForm('TD-1'));await w.waitForFunction(()=>!!state.status['TD-1']);await sleep(1800);
 const fr=w.frames().find(f=>f!==w.mainFrame()&&/TD-1/.test(f.url()));fr.page().on('pageerror',()=>{});
 /* a reference line: the element at the middle of the frame, re-chosen before each phase */
 const pick=()=>w.evaluate(()=>{const f=state.frames[state.cur],r=f.getBoundingClientRect(),d=f.contentDocument;const el=d.elementFromPoint(r.width/2,Math.min(r.height-40,420));f.contentWindow.__ref=el;return !!el;});
 const pos=()=>w.evaluate(()=>{const f=state.frames[state.cur];return f.getBoundingClientRect().top+f.contentWindow.__ref.getBoundingClientRect().top;});
 /* record, every animation frame for ms, the reference line's screen position and the header's top */
 const record=ms=>w.evaluate(ms=>new Promise(res=>{const f=state.frames[state.cur],h=document.querySelector('header.top');const out=[];const t0=performance.now();
   (function tick(){out.push({t:Math.round(performance.now()-t0),y:+(f.getBoundingClientRect().top+f.contentWindow.__ref.getBoundingClientRect().top).toFixed(1),h:Math.round(h.getBoundingClientRect().top),st:__wsBars.state()});
     if(performance.now()-t0<ms)requestAnimationFrame(tick);else res(out);})();}),ms);
 const st=()=>w.evaluate(()=>({st:__wsBars.state(),cls:['ws-fold','ws-ov','ws-up','ws-push','ws-anim'].filter(c=>document.body.classList.contains(c)),hdr:Math.round(document.querySelector('header.top').getBoundingClientRect().bottom),tbFold:state.frames[state.cur].contentDocument.documentElement.classList.contains('nbh-fold')}));
 const by=async(dy,steps,gap)=>{for(let i=0;i<steps;i++){await fr.evaluate(d=>window.scrollBy(0,d),dy);await sleep(gap);}};
 const S0=await st();
 ok('at the start the bars are in place and the form\'s toolbar is whole',S0.st==='shown'&&S0.cls.length===0&&S0.hdr>40&&!S0.tbFold,S0);
 /* 1 a deliberate scroll down: nothing during the scroll; once it rests, a slide, and the page stays put */
 await by(120,6,90);const mid=await st();await pick();const p0=await pos();
 const rec=await record(700);const S1=await st();const p1=await pos();
 const ys=rec.map(r=>r.y),hs=rec.map(r=>r.h);const between=hs.filter(v=>v<-2&&v>Math.min(...hs)+2).length;
 ok('a scroll down does not fold the bars while it is moving (they wait for the page to rest)',mid.st==='shown'&&!mid.cls.includes('ws-fold'),mid);
 ok('once the page rests they fold: the header slides up through the positions between (a slide, not a jump), and the form gets the room',S1.st==='folded'&&S1.cls.includes('ws-fold')&&between>=2,{S1,hs:hs.filter((v,i)=>i%2===0).slice(0,20)});
 ok('while they fold, the line being read does not move (every frame within 1 px)',Math.max(...ys)-Math.min(...ys)<=1&&Math.abs(p1-p0)<=1,{min:Math.min(...ys),max:Math.max(...ys),p0,p1});
 /* 2 small movements change nothing */
 await by(-40,1,60);await sleep(500);const S2=await st();await by(40,1,60);await sleep(500);const S2b=await st();
 ok('a small movement up (40 px) and back leaves them folded',S2.st==='folded'&&S2b.st==='folded',{S2,S2b});
 /* 3 a clear scroll up brings them back over the form, then they settle in, and the page never moves */
 await pick();const q0=await pos();await by(-60,2,60);const rec2=await record(900);const S3=await st();const q1=await pos();const ys2=rec2.map(r=>r.y);
 const states=[...new Set(rec2.map(r=>r.st))];
 ok('a clear scroll up (120 px) brings them back: over the form first, then into their place once the page rests',S3.st==='shown'&&S3.cls.length===0&&S3.hdr>40&&states.includes('over'),{S3,states});
 ok('while they come back and settle, the line being read does not move (the scroll that brought them back aside)',Math.max(...ys2)-Math.min(...ys2)<=1,{min:Math.min(...ys2),max:Math.max(...ys2),q0,q1});
 /* 4 a short scroll down (60 px) at rest: they stay, and the form's toolbar does not fold on its own (it follows the workstation) */
 await by(60,1,60);await sleep(600);const S4=await st();
 ok('a short scroll down (60 px) at rest leaves them in place',S4.st==='shown',S4);
 /* 4b a deliberate scroll down with a small bounce back (15 px) at the end, as a finger lifting does: they still fold */
 await by(150,1,40);await by(-15,1,40);await sleep(700);const S4b=await st();
 ok('a deliberate scroll down ending in a small bounce back (15 px) still folds them once the page rests',S4b.st==='folded',S4b);
 await by(-130,1,40);await sleep(900);
 /* 5 at the top of the form they come back with the page */
 await by(150,5,80);await sleep(700);const S5a=await st();await fr.evaluate(()=>window.scrollTo(0,0));await sleep(900);const S5=await st();
 const top=await w.evaluate(()=>{const f=state.frames[state.cur];return {sy:f.contentWindow.scrollY,frameTop:Math.round(f.getBoundingClientRect().top),hdr:Math.round(document.querySelector('header.top').getBoundingClientRect().bottom)};});
 ok('at the top of the form they come back with the page: the form\'s first line under them, not hidden behind them',S5a.st==='folded'&&S5.st==='shown'&&S5.cls.length===0&&top.sy===0&&top.frameTop>top.hdr,{S5a,S5,top});
 /* 6 the pin keeps them */
 await w.evaluate(()=>document.getElementById('pinBars').click());await sleep(300);await by(150,6,80);await sleep(800);const S6=await st();
 const pin=await w.evaluate(()=>({pressed:document.getElementById('pinBars').getAttribute('aria-pressed'),kept:localStorage.getItem('nbh.ws.pinbars'),shown:getComputedStyle(document.getElementById('pinBars')).display!=='none'}));
 ok('the pin (shown on a touch screen) keeps the bars and the form\'s whole toolbar in place through a long scroll, and is kept on the device',pin.shown&&pin.pressed==='true'&&pin.kept==='1'&&S6.st==='shown'&&!S6.tbFold&&S6.cls.length===0,{pin,S6});
 await w.evaluate(()=>document.getElementById('pinBars').click());await sleep(300);
 /* 7 closing the form while they are folded leaves them out */
 await fr.evaluate(()=>window.scrollTo(0,0));await sleep(400);await by(150,6,80);await sleep(800);const S7a=await st();
 await w.evaluate(()=>document.querySelector('#closeForm').click());await sleep(400);await w.evaluate(()=>{const b=document.querySelector('#cfFoot button.danger');if(b)b.click();});await sleep(700);
 const S7=await w.evaluate(()=>({st:__wsBars.state(),cls:['ws-fold','ws-ov','ws-up','ws-push','ws-anim'].filter(c=>document.body.classList.contains(c)),hdr:Math.round(document.querySelector('header.top').getBoundingClientRect().height)}));
 ok('closing the form while they are folded brings them back',S7a.st==='folded'&&S7.st==='shown'&&S7.cls.length===0&&S7.hdr>40,{S7a,S7});
 await ctx.close();
 /* 8 an iPad held upright: the form's toolbar (which folds to "Tools" at this width) folds and opens with the bars, not on its own */
 {const up=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});up.on('dialog',d=>d.accept().catch(()=>{}));
  const u=await up.newPage();u.on('pageerror',e=>errs.push('upright: '+e.message));await u.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);
  /* RS-1: its toolbar folds to "Tools" at this width (TD-1's fits as it is) */
  await u.evaluate(()=>openForm('RS-1'));await u.waitForFunction(()=>!!state.status['RS-1']);await sleep(1800);
  const uf=u.frames().find(f=>f!==u.mainFrame()&&/RS-1/.test(f.url()));
  const ust=()=>u.evaluate(()=>({st:__wsBars.state(),tb:state.frames[state.cur].contentDocument.documentElement.classList.contains('nbh-fold')}));
  await uf.evaluate(()=>window.scrollBy(0,60));await sleep(700);const A=await ust();
  for(let i=0;i<6;i++){await uf.evaluate(()=>window.scrollBy(0,120));await sleep(90);}const Bm=await ust();await sleep(800);const Bf=await ust();
  for(let i=0;i<2;i++){await uf.evaluate(()=>window.scrollBy(0,-60));await sleep(70);}await sleep(900);const C=await ust();
  ok('upright (RS-1): a short scroll (60 px, past the toolbar\'s own 40) folds neither; the toolbar folds only when the bars fold, after the page rests, and opens when they come back',
    A.st==='shown'&&!A.tb&&Bm.st==='shown'&&!Bm.tb&&Bf.st==='folded'&&Bf.tb&&C.st==='shown'&&!C.tb,{A,Bm,Bf,C});
  await up.close();}
 /* 8 a desktop with a mouse never folds, and has no pin */
 const dc=await b.newContext({viewport:{width:1366,height:1024},serviceWorkers:'block'});dc.on('dialog',d=>d.accept().catch(()=>{}));const d=await dc.newPage();d.on('pageerror',e=>errs.push('desk: '+e.message));
 await d.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);await d.evaluate(()=>openForm('TD-1'));await d.waitForFunction(()=>!!state.status['TD-1']);await sleep(1500);
 const dfr=d.frames().find(f=>f!==d.mainFrame()&&/TD-1/.test(f.url()));for(let i=0;i<6;i++){await dfr.evaluate(()=>window.scrollBy(0,150));await sleep(80);}await sleep(800);
 const D=await d.evaluate(()=>({st:__wsBars.state(),fold:document.body.classList.contains('ws-fold'),pin:getComputedStyle(document.getElementById('pinBars')).display}));
 ok('a desktop with a mouse never folds the bars and shows no pin',D.st==='shown'&&!D.fold&&D.pin==='none',D);await dc.close();
 /* a phone: the pin is under More (This form), the form's row keeps its name, Save and Close */
 {const IPH='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const pc=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPH,serviceWorkers:'block'});pc.on('dialog',d=>d.accept().catch(()=>{}));
  const ph=await pc.newPage();ph.on('pageerror',e=>errs.push('phone: '+e.message));await ph.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);
  await ph.evaluate(()=>{try{localStorage.removeItem('nbh.ws.pinbars');}catch(e){}});
  await ph.evaluate(()=>openForm('DD-1'));await ph.waitForFunction(()=>!!state.status['DD-1']);await sleep(1500);
  const row=await ph.evaluate(()=>({pin:getComputedStyle(document.querySelector('#pinBars')).display,shown:[...document.querySelectorAll('.crumb button')].filter(b=>b.offsetParent).map(b=>b.id)}));
  await ph.tap('#phMore');await sleep(400);
  const item=await ph.evaluate(()=>{const b=document.querySelector('#dlgBody [data-phmore="pinBars"]');return b?b.textContent:null;});
  if(item)await ph.tap('#dlgBody [data-phmore="pinBars"]');await sleep(400);
  const after=await ph.evaluate(()=>({pressed:document.querySelector('#pinBars').getAttribute('aria-pressed'),kept:localStorage.getItem('nbh.ws.pinbars')}));
  await ph.tap('#phMore');await sleep(400);const item2=await ph.evaluate(()=>{const b=document.querySelector('#dlgBody [data-phmore="pinBars"]');return b?b.textContent:null;});
  ok('a phone: the pin is under More (This form), not in the form\'s row; from there it pins the bars, kept on the device, and More then shows it on',
    row.pin==='none'&&row.shown.join()==='saveQuick,closeForm'&&/Keep the bars in place/.test(item||'')&&after.pressed==='true'&&after.kept==='1'&&/\(on\)/.test(item2||''),{row,item,after,item2});
  await pc.close();}
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
