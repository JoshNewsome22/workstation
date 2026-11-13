/* v25.98 (the BCBA, 11/13: "Add all those features") the video players' six additions: speed, the strip of steps, Repeat this
   step, Play the next one, press and hold for 2x, and the keys. All six in the video library; speed, hold and keys in Form
   TD-1's Watch how.
   A  Speed: a box under the picture with 0.5x to 2x; a choice sets the video's speed, is kept on the device, and is there
      again in the next video opened;
   B  the strip of steps: one piece for the opening and one for each step with a moment of its own, as wide as each is long;
      a click on a piece goes to its step; pieces before the place are full, pieces after it empty;
   C  Repeat this step: on, the button says which step, and the video goes back to the step's start at its end; going to
      another step moves the repeat; off, the video plays on;
   D  Play the next one: on at first; at the end "Up next" names the following video of the procedure and counts down;
      Cancel stays; Play now opens it; switched off, nothing shows at the end and the choice is kept;
   E  press and hold (touch): after half a second the video plays at 2x with a note on the picture; letting go puts the
      speed back, leaves the video playing, changes neither the speed box nor the kept speed, and is not taken as a tap;
   F  keys anywhere on the page: K, J, L, <, >, a digit, M, R, C; not while typing in a box; Shift+N opens the next video;
   G  a phone: the strip and the options fit the width (no sideways scroll), the bar is still right under the picture;
   H  Form TD-1, Watch how: the speed box (with the kept speed), the keys K, L, > and the hold;
   Z  no page error.
   Simulated people only. usage: node qa/v2598-player-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const LIB=L.BASE+'/'+L.ED+'/videos.html#video=ante_fade';
(async()=>{const br=await L.chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
 try{
  const ready=(p,sel)=>p.waitForFunction(s=>{const v=document.querySelector(s);return v&&v.readyState>=2&&v.duration>20;},sel,{timeout:120000});
  const open=async(o,url,sel)=>{const ctx=await br.newContext(Object.assign({serviceWorkers:'block'},o));const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(url);
    if(sel){await ready(p,sel);await sleep(500);}return {p,ctx};};
  const st=(p,sel)=>p.evaluate(s=>{const v=document.querySelector(s),g=id=>document.getElementById(id);let pr={};try{pr=JSON.parse(localStorage.getItem('nbh.videos.pref')||'{}')||{};}catch(e){}
    return {t:Math.round(v.currentTime*10)/10,dur:Math.round(v.duration*10)/10,paused:v.paused,rate:v.playbackRate,muted:v.muted,sel:(g('vlSpeed')||g('tv-speed')||{}).value,pref:pr,
      rep:g('vlRepeat')?g('vlRepeat').getAttribute('aria-pressed'):null,repT:g('vlRepeatT')?g('vlRepeatT').textContent:null,auto:g('vlAuto')?g('vlAuto').getAttribute('aria-pressed'):null,
      up:g('vlUpNext')?!g('vlUpNext').hidden:null,upT:g('vlUpT')?g('vlUpT').textContent:null,upN:g('vlUpN')?+g('vlUpN').textContent:null,hash:location.hash,cc:g('vlCC')?g('vlCC').getAttribute('aria-pressed'):null};},sel);
  const seek=(p,sel,t)=>p.evaluate(([s,t])=>{const v=document.querySelector(s);v.currentTime=t;return new Promise(r=>setTimeout(r,350));},[sel,t]);
  /* ---------------- the library with a mouse and a keyboard ---------------- */
  const D=await open({viewport:{width:1376,height:900}},LIB,'#vlVideo');const p=D.p,V='#vlVideo';
  await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.muted=true;v.pause();});
  const opts=await p.$$eval('#vlSpeed option',o=>o.map(x=>x.value+'|'+x.textContent));
  await p.selectOption('#vlSpeed','1.5');await sleep(200);const a1=await st(p,V);
  await p.goto(L.BASE+'/'+L.ED+'/videos.html#video=ante_task');await p.reload();await ready(p,V);await sleep(400);const a2=await st(p,V);
  ok('A Speed: six speeds from 0.5x to 2x under the picture; 1.5x sets the video to 1.5, is kept on the device, and is there again in the next video opened',
    opts.join(',')==='0.5|0.5×,0.75|0.75×,1|Normal,1.25|1.25×,1.5|1.5×,2|2×'&&a1.rate===1.5&&a1.pref.rate===1.5&&a2.rate===1.5&&a2.sel==='1.5',{opts,a1:[a1.rate,a1.pref],a2:[a2.rate,a2.sel]});
  await p.selectOption('#vlSpeed','1');await p.goto(LIB);await p.reload();await ready(p,V);await sleep(400);await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.muted=true;v.pause();});
  /* the strip */
  const want=await p.evaluate(()=>{const v=document.getElementById('vlVideo');const ts=[...document.querySelectorAll('#vlSteps li:not([data-where]) .vl-sbtn')].map(b=>+b.dataset.t).filter(t=>t>=0).sort((a,b)=>a-b);
    const cuts=(ts[0]>0.5?[0]:[]).concat(ts);return {cuts,dur:v.duration};});
  const strip=()=>p.evaluate(()=>{const s=document.getElementById('vlStrip'),r=s.getBoundingClientRect(),pr=document.getElementById('vlVideo').getBoundingClientRect();
    return {hidden:s.hidden,aria:s.getAttribute('aria-hidden'),top:Math.round(r.top-pr.bottom),w:Math.round(r.width),pw:Math.round(pr.width),
      pcs:[...s.children].map(c=>{const q=c.getBoundingClientRect();return {w:q.width,fill:Math.round(parseFloat(c.firstChild.style.width)||0),on:c.classList.contains('vl-on'),title:c.title};})};});
  await seek(p,V,want.cuts[3]+2);const b1=await strip();
  const lens=want.cuts.map((t,i)=>(i+1<want.cuts.length?want.cuts[i+1]:want.dur)-t),tot=lens.reduce((x,y)=>x+y,0),wsum=b1.pcs.reduce((x,y)=>x+y.w,0);
  const prop=b1.pcs.length===lens.length&&b1.pcs.every((c,i)=>Math.abs(c.w/wsum-lens[i]/tot)<.03);
  const fills=b1.pcs.length>4&&b1.pcs.slice(0,3).every(c=>c.fill===100)&&b1.pcs[3].fill>0&&b1.pcs[3].fill<100&&b1.pcs[3].on&&b1.pcs.slice(4).every(c=>c.fill===0&&!c.on);
  const box=await p.evaluate(()=>{const q=document.getElementById('vlStrip').children[5].getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2];});
  await p.mouse.click(box[0],box[1]);await sleep(500);const b2=await st(p,V);await p.evaluate(()=>document.getElementById('vlVideo').pause());
  ok('B the strip of steps is right under the picture and as wide; one piece for the opening and each step with its own moment ('+want.cuts.length+'), each as wide as it is long; before the place full, after it empty; a click on the sixth piece goes to its step',
    !b1.hidden&&b1.aria==='true'&&b1.top>=0&&b1.top<140&&Math.abs(b1.w-b1.pw)<3&&prop&&fills&&/^Opening/.test(b1.pcs[0].title)&&/^1\. /.test(b1.pcs[1].title)&&Math.abs(b2.t-want.cuts[5])<1.2,{b1,lens,t:b2.t,cut:want.cuts[5]});
  /* Repeat this step */
  await p.evaluate(()=>document.getElementById('vlVideo').pause());await seek(p,V,want.cuts[2]+1);const c0=await st(p,V);
  await p.click('#vlRepeat');const c1=await st(p,V);
  await seek(p,V,want.cuts[3]-1.2);await p.evaluate(()=>{const v=document.getElementById('vlVideo');window.__max=0;v.addEventListener('timeupdate',()=>{window.__max=Math.max(window.__max,v.currentTime);});return v.play();});
  await sleep(2600);const c2=await st(p,V);const cmax=await p.evaluate(()=>window.__max);
  await p.evaluate(()=>document.getElementById('vlVideo').pause());await p.click('#vlSteps li:not([data-where]):nth-of-type(5) .vl-sbtn');await sleep(600);const c3=await st(p,V);await p.evaluate(()=>document.getElementById('vlVideo').pause());
  const ring=await p.evaluate(()=>document.getElementById('vlStrip').classList.contains('vl-rep'));
  await p.click('#vlRepeat');const c4=await st(p,V);
  ok('C Repeat this step: off at first; on, the button names the step ("Repeating step 2") and at the step’s end the video goes back to its start; a tap on another step moves the repeat there; off again, the button says "Repeat this step"',
    c0.rep==='false'&&c0.repT==='Repeat this step'&&c1.rep==='true'&&c1.repT==='Repeating step 2'&&c2.t>=want.cuts[2]-.1&&c2.t<want.cuts[2]+2.5&&cmax<want.cuts[3]+.6&&cmax>want.cuts[3]-1&&ring&&/^Repeating step \d$/.test(c3.repT)&&c3.repT!=='Repeating step 2'&&c4.rep==='false'&&c4.repT==='Repeat this step',
    {c0:[c0.rep,c0.repT],c1:[c1.rep,c1.repT],c2:c2.t,cmax,cuts:want.cuts.slice(2,4),c3:c3.repT,c4:[c4.rep,c4.repT]});
  /* Play the next one */
  const end=async()=>{await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.currentTime=v.duration-0.5;return v.play();});await p.waitForFunction(()=>document.getElementById('vlVideo').ended,null,{timeout:8000}).catch(()=>{});await sleep(350);};
  const nextTitle=await p.evaluate(()=>{const a=document.querySelector('[aria-labelledby="vlNextF"] li');return a?a.textContent:'';});
  const d0=await st(p,V);await end();const d1=await st(p,V);await sleep(1300);const d1b=await st(p,V);
  await p.click('#vlUpNo');await sleep(1200);const d2=await st(p,V);
  await p.click('#vlAuto');await end();await sleep(600);const d3=await st(p,V);
  await p.click('#vlAuto');await end();const d4=await st(p,V);await p.click('#vlUpGo');await ready(p,V).catch(()=>{});await sleep(500);const d5=await st(p,V);
  ok('D Play the next one: on at first; at the end "Up next" names the following video of the procedure and counts down from 8; Cancel stays on the video; switched off (and kept), nothing shows at the end; on again, Play now opens the next video',
    d0.auto==='true'&&d1.up===true&&d1.upT==='Changing the task: an aid for hard work'&&nextTitle.indexOf(d1.upT)>=0&&d1.upN<=8&&d1.upN>=7&&d1b.upN<d1.upN&&d2.up===false&&d2.hash==='#video=ante_fade'&&d3.auto==='false'&&d3.up===false&&d3.pref.auto===false&&d4.up===true&&d4.pref.auto===true&&d5.hash==='#video=ante_task',
    {d0:d0.auto,d1:[d1.up,d1.upT,d1.upN,d1b.upN],d2:[d2.up,d2.hash],d3:[d3.auto,d3.up,d3.pref],d4:[d4.up,d4.pref],d5:d5.hash,nextTitle:nextTitle.slice(0,60)});
  /* the keys */
  await p.goto(LIB);await p.reload();await ready(p,V);await sleep(400);await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.muted=true;v.pause();v.currentTime=40;document.activeElement&&document.activeElement.blur();});await sleep(400);
  const key=async(k,w)=>{await p.keyboard.press(k);await sleep(w||250);return st(p,V);};
  const f0=await st(p,V),f1=await key('k',400),f2=await key('k');
  await seek(p,V,40);const f3=await key('l',450),f4=await key('j',450),f5=await key('j',450);
  const f6=await key('Shift+Period'),f7=await key('Shift+Comma'),f8=await key('5',450),f9=await key('m'),f10=await key('m'),f11=await key('r'),f12=await key('r'),f13=await key('c'),f14=await key('c');
  await p.evaluate(()=>{const i=document.createElement('input');i.id='__probe';document.body.appendChild(i);i.focus();});const f15=await key('k');const f15b=await key('l',400);
  await p.evaluate(()=>{const i=document.getElementById('__probe');i.blur();i.parentNode.removeChild(i);});
  await p.selectOption('#vlSpeed','1');const f16=await key('Shift+N',900);
  ok('F keys on the page: K plays and pauses; L and J go 10 s forward and back; > and < make it faster and slower (the box and the kept speed follow); 5 goes to the middle; M mutes; R repeats this step; C switches the captions; nothing while typing in a box; Shift+N opens the next video',
    f0.paused&&!f1.paused&&f2.paused&&Math.abs(f3.t-50)<.6&&Math.abs(f4.t-40)<.6&&Math.abs(f5.t-30)<.6&&f6.rate===1.25&&f6.sel==='1.25'&&f6.pref.rate===1.25&&f7.rate===1&&f7.sel==='1'&&Math.abs(f8.t-f8.dur/2)<.6&&f9.muted===false&&f10.muted===true&&f11.rep==='true'&&f12.rep==='false'&&f13.cc!==f12.cc&&f14.cc===f12.cc&&f15.paused===f14.paused&&Math.abs(f15b.t-f14.t)<.6&&f16.hash==='#video=ante_task',
    {play:[f0.paused,f1.paused,f2.paused],jl:[f3.t,f4.t,f5.t],rate:[f6.rate,f6.sel,f6.pref,f7.rate,f7.sel],five:[f8.t,f8.dur],m:[f9.muted,f10.muted],r:[f11.rep,f12.rep],c:[f12.cc,f13.cc,f14.cc],box:[f14.paused,f15.paused,f14.t,f15b.t],next:f16.hash});
  await D.ctx.close();
  /* ---------------- an iPad (touch): press and hold ---------------- */
  const I=await open({viewport:{width:1180,height:820},hasTouch:true},LIB,'#vlVideo');
  await I.p.evaluate(()=>{const v=document.getElementById('vlVideo');v.muted=true;window.__skips=0;v.addEventListener('nbh-skip',()=>{window.__skips++;});v.currentTime=52;return v.play();});await sleep(500);
  const pt=await I.p.evaluate(()=>{const b=document.getElementById('vlVideo').getBoundingClientRect();return [b.left+b.width*.7,b.top+b.height*.4];});
  const cdp=await I.ctx.newCDPSession(I.p);const badge=()=>I.p.evaluate(()=>{const b=document.querySelector('.nbh-fast'),v=document.getElementById('vlVideo').getBoundingClientRect(),q=b&&b.getBoundingClientRect();
    return b?{text:b.textContent,role:b.getAttribute('role'),op:+getComputedStyle(b).opacity,inside:q.left>=v.left&&q.right<=v.right&&q.top>=v.top&&q.bottom<=v.top+v.height*.3}:null;});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt[0],y:pt[1]}]});await sleep(250);const e0=await st(I.p,V);await sleep(700);const e1=await st(I.p,V),eb1=await badge();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(450);const e2=await st(I.p,V),eb2=await badge();
  await I.p.touchscreen.tap(pt[0],pt[1]);await sleep(600);const eskips=await I.p.evaluate(()=>window.__skips);const e3=await st(I.p,V);
  ok('E press and hold (touch): nothing in the first quarter second; after half a second the video plays at 2x with the note "2× speed while you hold" at the top of the picture; letting go puts the speed back to 1, leaves it playing, leaves the speed box and the kept speed alone; a tap soon after is not taken as a double tap',
    e0.rate===1&&e1.rate===2&&!e1.paused&&eb1&&eb1.text==='2× speed while you hold'&&eb1.role==='status'&&eb1.op>.9&&eb1.inside&&e2.rate===1&&!e2.paused&&e2.sel==='1'&&e2.pref.rate!==2&&eb2.op<.1&&eskips===0&&Math.abs(e3.t-e2.t)<3,{e0:e0.rate,e1:[e1.rate,e1.paused],eb1,e2:[e2.rate,e2.paused,e2.sel,e2.pref],eb2,eskips,t:[e2.t,e3.t]});
  await I.ctx.close();
  /* ---------------- a phone ---------------- */
  const P=await open({viewport:{width:390,height:844},hasTouch:true,isMobile:true},LIB,'#vlVideo');
  const g=await P.p.evaluate(()=>{const R=id=>document.getElementById(id).getBoundingClientRect(),v=R('vlVideo'),bar=R('vlBar'),s=R('vlStrip'),o=R('vlOpts');
    const small=[...document.querySelectorAll('#vlOpts select,#vlOpts button:not([hidden]),#vlOpts summary')].map(e=>Math.round(e.getBoundingClientRect().height)).filter(h=>h<40);
    return {sw:document.documentElement.scrollWidth,iw:innerWidth,barUnder:Math.round(bar.top-v.bottom),stripUnder:Math.round(s.top-bar.bottom),optsUnder:Math.round(o.top-s.bottom),right:Math.round(Math.max(s.right,o.right)),n:document.getElementById('vlStrip').children.length,small};});
  const gp=await P.p.evaluate(()=>{const q=document.getElementById('vlStrip').children[2].getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2];});
  await P.p.evaluate(()=>{document.getElementById('vlVideo').muted=true;});await P.p.touchscreen.tap(gp[0],gp[1]);await sleep(600);const g2=await st(P.p,V);
  ok('G a phone: no sideways scroll; the page’s own bar is still right under the picture, then the strip, then the options; every control at least 40 px high; a tap on the third piece of the strip goes to step 2',
    g.sw<=g.iw&&Math.abs(g.barUnder)<=2&&g.stripUnder>=0&&g.stripUnder<20&&g.optsUnder>=0&&g.optsUnder<20&&g.right<=g.iw&&g.n===want.cuts.length&&!g.small.length&&Math.abs(g2.t-want.cuts[2])<1.5,{g,t:g2.t,cut:want.cuts[2]});
  await P.ctx.close();
  /* ---------------- Form TD-1, Watch how ---------------- */
  const T=await open({viewport:{width:1180,height:820},hasTouch:true},L.BASE+'/'+L.ED+'/'+L.forms().find(f=>/^TD-1_/.test(f.file)).file);
  await T.p.waitForFunction(()=>window.__tdVideo&&window.__tdBank,null,{timeout:30000});await sleep(600);
  await T.p.evaluate(()=>{localStorage.setItem('nbh.videos.pref',JSON.stringify({rate:1.25}));window.__tdVideo.play('rird-block-pica-on-touch');});
  const opened=await ready(T.p,'#tv-video').then(()=>true).catch(()=>false);let h={};
  if(opened){const W='#tv-video';await sleep(400);await T.p.evaluate(()=>{const v=document.getElementById('tv-video');v.muted=true;v.pause();v.currentTime=20;});await sleep(400);
    h.a=await st(T.p,W);await T.p.selectOption('#tv-speed','2');await sleep(200);h.b=await st(T.p,W);await T.p.selectOption('#tv-speed','1');
    await T.p.focus('#tv-close');await T.p.keyboard.press('k');await sleep(400);h.c=await st(T.p,W);await T.p.keyboard.press('k');await sleep(250);h.d=await st(T.p,W);
    await seek(T.p,W,20);await T.p.keyboard.press('l');await sleep(450);h.e=await st(T.p,W);await T.p.keyboard.press('Shift+Period');await sleep(250);h.f=await st(T.p,W);await T.p.selectOption('#tv-speed','1');
    await T.p.evaluate(()=>document.getElementById('tv-video').play());await sleep(400);
    const tp=await T.p.evaluate(()=>{const b=document.getElementById('tv-video').getBoundingClientRect();return [b.left+b.width*.5,b.top+b.height*.4];});const c2=await T.ctx.newCDPSession(T.p);
    await c2.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tp[0],y:tp[1]}]});await sleep(900);h.g=await st(T.p,W);
    h.host=await T.p.evaluate(()=>{const b=document.querySelector('.nbh-fast');return b?[b.parentNode.id,+getComputedStyle(b).opacity]:null;});
    await c2.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(400);h.h=await st(T.p,W);
    h.tab=await T.p.evaluate(()=>{const s=document.getElementById('tv-speed');const l=s.closest('label');return [!!l&&/Speed/.test(l.textContent),s.options.length,Math.round(s.getBoundingClientRect().height)];});}
  ok('H Form TD-1, Watch how: the Speed box opens with the kept speed (1.25) and sets the video’s speed (2); K plays and pauses, L goes forward 10 s, > makes it faster; press and hold plays at 2x with the note in the player’s layer, and letting go puts the speed back',
    opened&&h.a.rate===1.25&&h.a.sel==='1.25'&&h.b.rate===2&&h.b.pref.rate===2&&!h.c.paused&&h.d.paused&&Math.abs(h.e.t-30)<.6&&h.f.rate===1.25&&h.g.rate===2&&h.host&&h.host[0]==='tdVideo'&&h.host[1]>.9&&h.h.rate===1&&!h.h.paused&&h.tab[0]&&h.tab[1]===6&&h.tab[2]>=40,
    opened?{a:[h.a.rate,h.a.sel],b:[h.b.rate,h.b.pref],k:[h.c.paused,h.d.paused],l:h.e.t,gt:h.f.rate,hold:[h.g.rate,h.host,h.h.rate,h.h.paused],tab:h.tab}:{opened});
  await T.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
