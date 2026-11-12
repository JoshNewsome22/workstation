/* v25.91 (the BCBA, 11/12: "Go with your recommendations": the in-app mini player and Picture in Picture) a video that is
   playing when the video library is left keeps playing in a small window in the corner of the workstation.
   A  a video playing in the library, then the library closed: the layer becomes a small window at the bottom right (not
      hidden), the page under it is usable again, the library's page shows only the picture, and the video goes on;
   B  Back to the video opens the library again at the same video, still playing; nothing was reloaded;
   C  a form opened while a video plays does the same; Close stops the video and takes the small window away;
   D  a video that is not playing: closing the library hides it, as before, with no small window;
   E  the Picture in Picture button is in the page's own bar (a phone's), named, and offered where the browser has it.
   Simulated people only. usage: node qa/v2591-mini-player-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.shellUrl());await sleep(1500);
  const until=async(f,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||30000)){let v=false;try{v=await f();}catch(e){}if(v)return true;await sleep(250);}return false;};
  const vid=f=>p.evaluate(f=>{const w=window.__wsVideos.frame().contentWindow,v=w.document.getElementById('vlVideo');return v?new Function('v','w','return ('+f+')(v,w)')(v,w):null;},f.toString());
  const state=()=>p.evaluate(()=>{const l=document.getElementById('vlLayer'),r=l.getBoundingClientRect(),W=window.__wsVideos,fr=W.frame(),d=fr&&fr.contentDocument,v=d&&d.getElementById('vlVideo');
    return {open:W.isOpen(),mini:W.isMini(),hidden:l.hidden,cls:l.className,w:Math.round(r.width),h:Math.round(r.height),right:Math.round(innerWidth-r.right),bottom:Math.round(innerHeight-r.bottom),
      inert:[...document.body.children].filter(e=>e.inert).length,frameMini:!!d&&d.documentElement.classList.contains('vl-mini'),paused:v?v.paused:null,t:v?v.currentTime:null,key:fr?fr.contentWindow.location.hash:'',
      bar:[...document.querySelectorAll('#vlMiniBar button')].map(b=>{const q=b.getBoundingClientRect();return [b.id,Math.round(q.width),Math.round(q.height),b.textContent];}),pressed:document.getElementById('wsVideos').getAttribute('aria-pressed')};});
  /* the video is read as its page opens; it is started here as a tap on the player's own Play would (muted: no sound device here) */
  const playIt=async()=>{await until(async()=>(await vid(v=>v.readyState>=2)),60000);await vid(v=>{v.muted=true;const r=v.play();if(r&&r.catch)r.catch(()=>{});return true;});return until(async()=>(await vid(v=>!v.paused&&v.currentTime>0.3)),60000);};
  await p.evaluate(()=>window.__wsVideos.open('dro_resetting'));
  ok('0 the library opens at the video',await until(async()=>!!(await vid(v=>true)),30000));
  const pip=await p.evaluate(()=>{const d=window.__wsVideos.frame().contentDocument,b=d.getElementById('vlBPip');if(!b)return null;const r=b.getBoundingClientRect();return {hidden:b.hidden,w:Math.round(r.width),h:Math.round(r.height),name:b.getAttribute('aria-label'),can:!!d.pictureInPictureEnabled};});
  ok('E the page’s own bar (shown on a phone; its sizes are checked in v2572-transcript-test) has a Picture in Picture button, named, and not hidden where the browser has Picture in Picture (it does here)',!!pip&&(pip.can?!pip.hidden:pip.hidden)&&/^Picture in Picture/.test(pip.name||''),pip);
  const played=await playIt();const s0=await state();
  await p.evaluate(()=>window.__wsVideos.close());await sleep(600);const a1=await state();await sleep(1500);const a2=await state();
  ok('A a playing video, then the library closed: a small window at the bottom right (not hidden, 360 px wide or less, 16:9), nothing under it held, the Videos button no longer pressed, the library’s page showing only the picture, two buttons of 44 px or more, and the video going on',
    played&&s0.open&&!s0.mini&&!a1.open&&a1.mini&&!a1.hidden&&/vl-mini/.test(a1.cls)&&a1.w<=360&&a1.w>=200&&Math.abs(a1.w/a1.h-16/9)<.05&&a1.right===12&&a1.bottom>=12&&a1.inert===0&&a1.pressed==='false'&&a1.frameMini&&a1.bar.length===2&&a1.bar.every(b=>b[1]>=44&&b[2]>=44)&&a1.paused===false&&a2.t>a1.t+.5,{played,s0,a1,a2t:a2.t});
  await p.click('#vlMiniBack');await sleep(700);const b1=await state();await sleep(1000);const b2=await state();
  ok('B Back to the video: the library again at the same video, the small window gone, the video still playing from where it was',b1.open&&!b1.mini&&!b1.hidden&&!/vl-mini/.test(b1.cls)&&!b1.frameMini&&b1.key==='#video=dro_resetting'&&b1.paused===false&&b1.t>=a2.t&&b2.t>b1.t&&b1.w>600,{b1,b2t:b2.t});
  await p.evaluate(()=>openForm('TD-1'));await sleep(900);const c1=await state();
  await p.click('#vlMiniClose');await sleep(600);const c2=await state();
  ok('C a form opened while the video plays: the small window again, the video going on; Close stops the video and takes the window away',c1.mini&&!c1.hidden&&c1.paused===false&&!c2.mini&&c2.hidden&&c2.paused===true&&!c2.frameMini,{c1,c2});
  await p.evaluate(()=>window.__wsVideos.open('dro_resetting'));await sleep(900);const d0=await state();
  await p.evaluate(()=>window.__wsVideos.close());await sleep(500);const d1=await state();
  ok('D a video that is not playing: closing the library hides it, with no small window',d0.open&&d0.paused===true&&!d1.open&&!d1.mini&&d1.hidden,{d0,d1});
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
