/* v25.86 (the BCBA, 11/11: "Should there be a way to exit from out of full screen when playing a video without the video
   pausing after you click the x button") The video library's player and Form TD-1's.
   On an iPad the full-screen player is the device's own: its X closes it and pauses. Here the device's events are sent by
   hand (webkitbeginfullscreen, a pause, webkitendfullscreen), since this browser has no such player.
   A  playing, into full screen, the X (a pause, then the end of full screen): the video plays on.
   B  the same with the end of full screen first and the pause just after: it plays on.
   C  paused by the person in full screen, and closed two seconds later: it stays paused.
   D  paused outside full screen: it stays paused (nothing here touches an ordinary pause).
   E  a video that has ended is not started again by leaving full screen.
   F  Form TD-1's player carries the same code.
   usage: node qa/v2586-fullscreen-play-test.js */
const fs=require('fs'),path=require('path');
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const DIR=path.join(__dirname,'..','NBH-Workstation');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/videos.html#video=chain_forward');
  await p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&/^blob:/.test(v.src)&&v.readyState>=2;},null,{timeout:60000});
  const run=(steps)=>p.evaluate(async steps=>{const v=document.getElementById('vlVideo'),w=ms=>new Promise(r=>setTimeout(r,ms));v.muted=true;
    const ev=n=>v.dispatchEvent(new Event(n));
    for(const s of steps){if(s==='play'){try{await v.play();}catch(e){return {err:String(e)};}await w(250);}
      else if(s==='begin')ev('webkitbeginfullscreen');else if(s==='end')ev('webkitendfullscreen');
      else if(s==='pause'){v.pause();await w(30);}else if(s==='toEnd'){v.currentTime=Math.max(0,v.duration-0.15);await w(900);}
      else if(typeof s==='number')await w(s);}
    await w(500);const o={paused:v.paused,ended:v.ended,keep:!!v.__nbhKeep};v.pause();await w(60);if(v.ended){v.currentTime=1;await w(200);}return o;},steps);
  let r=await run(['play','begin',300,'pause','end']);
  ok('A playing, full screen, then the X (a pause and the end of full screen together): the video plays on',r.keep&&r.paused===false,r);
  r=await run(['play','begin',300,'end',40,'pause']);
  ok('B the end of full screen first and the pause just after: it plays on',r.paused===false,r);
  r=await run(['play','begin',300,'pause',2000,'end']);
  ok('C paused by the person in full screen and closed two seconds later: it stays paused',r.paused===true,r);
  r=await run(['play',300,'pause']);
  ok('D an ordinary pause outside full screen stays a pause',r.paused===true,r);
  r=await run(['play','begin','toEnd','end']);
  ok('E a video that has ended is not started again by leaving full screen',r.ended===true&&r.paused===true,r);
  await p.close();
  const blk=s=>{const i=s.indexOf('function nbhKeepPlaying(vid){'),j=s.indexOf("vid.addEventListener('play',function(){pauseAt=0;pauseFs=false;});}",i);return i<0||j<0?null:s.slice(i,j);};
  const A=blk(fs.readFileSync(path.join(DIR,'videos.html'),'utf8')),td=fs.readFileSync(path.join(DIR,L.forms().find(f=>f.id==='TD-1').file),'utf8'),B=blk(td);
  ok('F Form TD-1 carries the same code, and its player is given to it',!!A&&A===B&&/vid\.addEventListener\('ended',\(\)=>keep\(true,true\)\);\n nbhKeepPlaying\(vid\);/.test(td),{a:A&&A.length,b:B&&B.length});
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
