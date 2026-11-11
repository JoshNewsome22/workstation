/* v25.87 (the BCBA, 11/11, two pictures of an iPad: the device's full-screen player has an X and no other way out, and
   the video was paused after it) The v25.86 code was not seen on an iPad; here it is made sturdier and it keeps a record
   of what the device's player did, shown in Diagnostics. The device's events are sent by hand, as in the v25.86 test.
   A  the pause and the end of full screen 1.0 s apart (over the old 0.8 s): the video plays on.
   B  the device refuses the first two requests to play: the third starts it, and the record says three requests.
   C  the record after an X: the order, the gap, started, and "playing" two seconds later.
   D  paused by the person 2 s before closing: left paused, and the record says so.
   E  once the video has started again, a pause half a second later is the person's: it stays paused.
   F  the device's third signal (webkitpresentationmodechanged, fullscreen then inline) is heard: the video plays on.
   G  Diagnostics shows the record in words, and says so when there is none.
   usage: node qa/v2587-fullscreen-record-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/videos.html#video=chain_forward');
  await p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&/^blob:/.test(v.src)&&v.readyState>=2;},null,{timeout:60000});
  /* steps: 'play' 'begin' 'end' 'pause' 'refuse2' (the next two requests to play are refused) 'mode:fullscreen' 'mode:inline', or a wait in ms.
     Answers with the state after `settle` ms and the record; then puts the player back (paused, record cleared). */
  const run=(steps,settle)=>p.evaluate(async({steps,settle})=>{const v=document.getElementById('vlVideo'),w=ms=>new Promise(r=>setTimeout(r,ms));v.muted=true;
    const ev=n=>v.dispatchEvent(new Event(n));let asked=0;delete v.play;
    try{localStorage.removeItem('nbh.videos.fsx');}catch(e){}
    for(const s of steps){if(s==='play'){try{await v.play();}catch(e){return {err:String(e)};}await w(250);}
      else if(s==='begin')ev('webkitbeginfullscreen');else if(s==='end')ev('webkitendfullscreen');
      else if(s==='pause'){v.pause();await w(30);}
      else if(s==='refuse2'){const real=HTMLMediaElement.prototype.play;v.play=function(){asked++;if(asked<=2)return Promise.reject(new DOMException('refused for the test','NotAllowedError'));return real.call(v);};}
      else if(/^mode:/.test(s)){Object.defineProperty(v,'webkitPresentationMode',{value:s.slice(5),configurable:true});ev('webkitpresentationmodechanged');}
      else if(typeof s==='number')await w(s);}
    await w(settle);let rec=null;try{rec=JSON.parse(localStorage.getItem('nbh.videos.fsx')||'null');}catch(e){}
    const o={paused:v.paused,asked,rec};delete v.play;delete v.webkitPresentationMode;v.pause();await w(2100);return o;},{steps,settle:settle||500});
  let r=await run(['play','begin',300,'pause',1000,'end']);
  ok('A the pause and the end of full screen 1.0 s apart: the video plays on',r.paused===false&&r.rec&&r.rec.did==='play'&&r.rec.gap>=950&&r.rec.gap<1200,r);
  r=await run(['play','begin',300,'refuse2','pause','end'],1300);
  ok('B refused twice, the third request starts the video, and the record says three requests',r.paused===false&&r.asked===3&&r.rec&&r.rec.tries===3&&r.rec.play==='started',r);
  r=await run(['play','begin',300,'pause','end'],2300);
  ok('C the record after an X: pause then close, a short gap, started, playing two seconds later',r.paused===false&&r.rec&&r.rec.order==='pause, then close'&&r.rec.gap<300&&r.rec.did==='play'&&r.rec.tries===1&&r.rec.play==='started'&&r.rec.after==='playing'&&Math.abs(Date.now()-r.rec.at)<60000,r);
  r=await run(['play','begin',300,'pause',2000,'end']);
  ok('D paused by the person 2 s before closing: left paused, and the record says so',r.paused===true&&r.rec&&r.rec.did==='left paused'&&r.rec.order==='pause, then close'&&r.rec.gap>=1900&&r.rec.tries===0,r);
  r=await run(['play','begin',300,'pause','end',500,'pause'],1500);
  ok('E once the video has started again, a pause half a second later stays a pause',r.paused===true&&r.rec&&r.rec.play==='started',r);
  r=await run(['play','mode:fullscreen',300,'pause','mode:inline']);
  ok('F full screen said only by webkitpresentationmodechanged: the video plays on',r.paused===false&&r.rec&&r.rec.did==='play',r);
  r=await run(['play','begin',300,'end',40,'pause']);
  ok('F2 the end of full screen first and the pause just after: the video plays on, recorded as close then pause',r.paused===false&&r.rec&&r.rec.order==='close, then pause'&&r.rec.did==='play',r);
  r=await run(['play','begin',300,'end']);
  ok('F3 full screen left without a pause: nothing is done, and the record says the video was not paused',r.paused===false&&r.rec&&r.rec.order==='no pause'&&r.rec.tries===0,r);
  await p.close();
  /* G Diagnostics, in the workstation */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));
  await q.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const diag=async rec=>q.evaluate(async rec=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
    if(rec)localStorage.setItem('nbh.videos.fsx',JSON.stringify(rec));else localStorage.removeItem('nbh.videos.fsx');
    document.getElementById('diag').click();await w(700);
    const row=[...document.querySelectorAll('tr')].find(t=>t.cells[0]&&t.cells[0].textContent==='Video, leaving full screen');
    const out=row?row.cells[1].textContent:null;const x=[...document.querySelectorAll('dialog[open] button,.dlg button,button')].find(b=>/^(Close|Done|OK)$/.test(b.textContent.trim())&&b.offsetParent);if(x)x.click();await w(300);return out;},rec);
  let t=await diag(null);
  ok('G Diagnostics has the line, and says so when nothing is recorded',/nothing recorded yet/.test(t||''),t);
  t=await diag({v:1,at:new Date(2026,10,11,17,45).getTime(),order:'pause, then close',gap:38,did:'play',tries:1,play:'started',after:'playing'});
  ok('G2 a close that started the video again, in words',/^at 5:45.*: pause, then close, 38 ms apart; asked to play 1 time: started; 2 s later: playing$/.test(t||''),t);
  t=await diag({v:1,at:new Date(2026,10,11,17,45).getTime(),order:'pause, then close',gap:41,did:'play',tries:4,play:'NotAllowedError',after:'paused'});
  ok('G3 a device that refused, in words',/pause, then close, 41 ms apart; asked to play 4 times: refused \(NotAllowedError\); 2 s later: paused$/.test(t||''),t);
  t=await diag({v:1,at:Date.now(),order:'pause, then close',gap:2600,did:'left paused',tries:0,play:'',after:'paused'});
  ok('G4 a gap over the limit, in words',/pause, then close, 2600 ms apart: taken as your own pause; left paused$/.test(t||''),t);
  await q.evaluate(()=>localStorage.removeItem('nbh.videos.fsx'));
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
