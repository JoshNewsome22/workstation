/* v25.97 (the BCBA, 11/13: "is there a quick rewind and fast forward feature like YouTube has where you can double click the
   screen on the left side to rewind 10 or 15 seconds and on the right side to fast forward" ... "Yes") a double tap on the
   picture skips 10 s: the left half back, the right half forward. In the video library's player and in Form TD-1's Watch how.
   A  iPad (touch, the browser's own controls): a double tap on the right half goes forward 10 s, exactly, also in a browser
      that skips on a double tap by itself; a round mark "+10 s" shows over the right half of the picture, is named "Forward
      10 seconds" for a screen reader, and fades;
   B  a double tap on the left half goes back 10 s ("−10 s"); a third tap within a moment adds 10 s more ("−20 s");
   C  no skip from one tap, from two taps on different halves, or from two taps a second apart;
   D  two taps on the strip of the player's own controls at the foot are not taken as a skip;
   E  the skip stops at the start and at the end of the video;
   F  a mouse: a double click is left to the browser (full screen) and is not taken as a skip;
   G  a phone (the page's own bar): a double tap skips and leaves the video paused or playing as it was;
   H  Form TD-1, Watch how: the same double tap, the mark over the picture in the player's layer;
   Z  no page error.
   Simulated people only. usage: node qa/v2597-skip-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const LIB=L.BASE+'/'+L.ED+'/videos.html#video=rird_pica';
(async()=>{const br=await L.chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
 try{
  const open=async(o,url,sel)=>{const ctx=await br.newContext(Object.assign({serviceWorkers:'block'},o));const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(url);
    if(sel){await p.waitForFunction(s=>{const v=document.querySelector(s);return v&&v.readyState>=1&&v.duration>20;},sel,{timeout:90000});await sleep(500);}return {p,ctx};};
  const mk=(p,sel)=>{const at=async(fx,fy)=>p.evaluate(([s,fx,fy])=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left+r.width*fx,r.top+r.height*fy];},[sel,fx,fy]);
    return {
      /* the video paused at t seconds; skips made by the feature are counted from here on */
      set:t=>p.evaluate(([s,t])=>{const v=document.querySelector(s);if(!v.__n){v.__n=1;window.__skips=0;v.addEventListener('nbh-skip',()=>{window.__skips++;});}window.__skips=0;v.pause();v.currentTime=t;return new Promise(r=>setTimeout(()=>r(v.currentTime),350));},[sel,t]),
      get:()=>p.evaluate(s=>{const v=document.querySelector(s),m=[...document.querySelectorAll('.nbh-skip')].pop(),r=v.getBoundingClientRect(),q=m&&m.getBoundingClientRect();
        return {t:Math.round(v.currentTime*10)/10,dur:Math.round(v.duration*10)/10,paused:v.paused,controls:v.controls,skips:window.__skips||0,mark:m?m.textContent:'',name:m?m.getAttribute('aria-label'):'',role:m?m.getAttribute('role'):'',op:m?+getComputedStyle(m).opacity:0,
          fx:q?Math.round(((q.left+q.width/2)-r.left)/r.width*100)/100:null,fy:q?Math.round(((q.top+q.height/2)-r.top)/r.height*100)/100:null,host:m&&m.parentNode?(m.parentNode.id||m.parentNode.className):''};},sel),
      taps:async(pts,gap)=>{for(let i=0;i<pts.length;i++){const [x,y]=await at(pts[i][0],pts[i][1]);await p.touchscreen.tap(x,y);if(i<pts.length-1)await sleep(gap||120);}await sleep(650);},
      dbl:async(fx,fy)=>{const [x,y]=await at(fx,fy);await p.mouse.dblclick(x,y);await sleep(650);},at};};
  /* ---------------- the library on an iPad (touch; the browser's own controls) ---------------- */
  const I=await open({viewport:{width:1180,height:820},hasTouch:true},LIB,'#vlVideo');const v=mk(I.p,'#vlVideo');
  await v.set(30);await v.taps([[.75,.4],[.75,.4]]);const a=await v.get();await sleep(900);const a2=await v.get();
  ok('A iPad: a double tap on the right half goes from 30 s to 40 s (one skip); the mark "+10 s" is over the right half of the picture, a status named "Forward 10 seconds", and fades',
    a.controls&&Math.abs(a.t-40)<.6&&a.skips===1&&a.mark==='+10 s'&&a.name==='Forward 10 seconds'&&a.role==='status'&&a.fx>.6&&a.fx<.95&&Math.abs(a.fy-.5)<.1&&a2.op<.1&&Math.abs(a2.t-40)<.6,{a,a2});
  await v.set(40);await v.taps([[.25,.4],[.25,.4]]);const b1=await v.get();await sleep(900);await v.set(40);await v.taps([[.2,.5],[.2,.5],[.2,.5]]);const b2=await v.get();
  ok('B a double tap on the left half goes back 10 s ("−10 s", "Back 10 seconds", over the left half); a third tap adds 10 s more ("−20 s", from 40 s to 20 s)',
    Math.abs(b1.t-30)<.6&&b1.mark==='−10 s'&&b1.name==='Back 10 seconds'&&b1.fx>.05&&b1.fx<.4&&Math.abs(b2.t-20)<.6&&b2.mark==='−20 s'&&b2.skips===2,{b1,b2});
  await sleep(1000);await v.set(30);await v.taps([[.75,.4]]);const c1=await v.get();await sleep(900);await v.set(30);await v.taps([[.25,.4],[.75,.4]]);const c2=await v.get();await sleep(900);await v.set(30);await v.taps([[.75,.4],[.75,.4]],1000);const c3=await v.get();
  ok('C no skip from one tap, from two taps on different halves, or from two taps a second apart',c1.skips===0&&Math.abs(c1.t-30)<.6&&c2.skips===0&&c3.skips===0,{c1,c2:c2.skips,c3:c3.skips});
  await sleep(900);await v.set(30);await v.taps([[.5,.97],[.5,.97]]);const d=await v.get();
  ok('D two taps on the strip of the player’s own controls at the foot are not taken as a skip',d.skips===0,d);
  await sleep(900);await v.set(4);await v.taps([[.25,.4],[.25,.4]]);const e1=await v.get();const dur=e1.dur;await sleep(900);await v.set(dur-3);await v.taps([[.75,.4],[.75,.4]]);const e2=await v.get();
  ok('E the skip stops at the start (4 s -> 0 s) and at the end of the video',e1.t===0&&e1.skips===1&&e2.t<=dur+.05&&e2.t>=dur-3.2&&e2.skips===1,{e1:e1.t,e2:e2.t,dur});
  await I.ctx.close();
  /* ---------------- a mouse ---------------- */
  const M=await open({viewport:{width:1376,height:900}},LIB,'#vlVideo');const m=mk(M.p,'#vlVideo');
  await m.set(30);await m.dbl(.75,.4);const f=await m.get();
  ok('F a mouse: a double click is left to the browser and is not taken as a skip (no mark, the place unchanged)',f.skips===0&&f.mark===''&&Math.abs(f.t-30)<1.5,f);
  await M.ctx.close();
  /* ---------------- a phone (the page's own bar) ---------------- */
  const P=await open({viewport:{width:390,height:844},hasTouch:true,isMobile:true},LIB,'#vlVideo');const ph=mk(P.p,'#vlVideo');
  await ph.set(30);const g0=await ph.get();await ph.taps([[.75,.5],[.75,.5]]);await sleep(400);const g=await ph.get();
  ok('G a phone (no browser controls on the picture): a double tap on the right half skips forward 10 s and leaves the video paused as it was',!g.controls&&Math.abs(g.t-40)<1.2&&g.skips===1&&g.mark==='+10 s'&&g.paused===g0.paused,{g0:g0.paused,g});
  await P.ctx.close();
  /* ---------------- Form TD-1, Watch how ---------------- */
  const T=await open({viewport:{width:1180,height:820},hasTouch:true},L.BASE+'/'+L.ED+'/'+L.forms().find(f=>/^TD-1_/.test(f.file)).file);
  await T.p.waitForFunction(()=>window.__tdVideo&&window.__tdBank,null,{timeout:30000});await sleep(600);
  await T.p.evaluate(()=>window.__tdVideo.play('rird-block-pica-on-touch'));
  const opened=await T.p.waitForFunction(()=>{const x=document.getElementById('tv-video');return x&&x.readyState>=1&&x.duration>20;},null,{timeout:90000}).then(()=>true).catch(()=>false);
  const t=mk(T.p,'#tv-video');let h={};if(opened){await sleep(400);await t.set(30);await t.taps([[.75,.4],[.75,.4]]);h=await t.get();}
  ok('H Form TD-1, Watch how: a double tap on the right half goes from 30 s to 40 s, with the mark "+10 s" over the picture, in the player’s layer',opened&&Math.abs(h.t-40)<.6&&h.skips===1&&h.mark==='+10 s'&&h.host==='tdVideo'&&h.fx>.6&&h.fx<.95,{opened,h});
  await T.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
