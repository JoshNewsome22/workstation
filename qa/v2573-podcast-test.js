/* v25.73 (the BCBA, 11/10, the design review's P1 to P4) The Research Behind the Plan, the study podcast: the pilot episode
   about Romaniuk et al. (2002), "Choice of task, and why function matters", for the TD-1 card choice-academic-task-escape.
   Two simulated hosts with AI voices; simulated students only; nothing here is about a real student.
   A. the files: the episode in nbh-videos.js (its card from the bank, its length and function written by patch-videos.py),
      its audio stored as the videos are (base64 of an MP4, AAC mono), its 29 turns in time order inside its length, the
      offline list (tools/pwa-sw.py) holding the audio, the player and the turns; this test in the release list.
   B. the library's shelf (iPad sideways): "The Research Behind the Plan" above the first procedure, a wide card with
      "Listen · 7 min", the AI voices label, the title and the study; the search ("Fargo", a word only the transcript has;
      "Romaniuk"; a word nobody says) and the filters (Function Escape and Attention, Procedure Choice and DRO, Watched).
   C. the episode's page: its series, title, study, length, AI voices, Listen, Open the TD-1 card, Watch the procedure; the
      transcript (the note "Nora and Sam are AI voices. The episode is based on the published article.", every turn with
      its speaker); About this episode and the study.
   D. playing in the bar: Listen starts the sound at once; play and pause, back and forward 15 s, the speed; the line heard
      marked (aria-current) and in view at three sample times, a line tapped plays from its start; the position and the
      speed remembered on this device (the page reopened picks up there); the bar's Transcript (on another page) opens the
      episode's page; a video's page has Listen to the study, and a video that starts pauses the episode.
   E. Form TD-1 (iPad sideways, iPad upright, phone): the card shows Watch how and Listen side by side, with their lines and
      the AI voices label; Listen plays in the bar, the card stays in view; the bar's Transcript opens the sheet (the note,
      the line heard marked, Escape closes it); Close puts the bar away and the focus back on Listen.
   F. the quality floor: every control of the bar named and 44 px; the focus shown; no text under 12 px; no sideways scroll
      at 390, 820 and 1180 px; AA contrast of the bar's and the shelf's text; no smooth scrolling under reduced motion; high
      contrast and low light (screens kept in qa/out/v2573-podcast/).
   G. privacy: localStorage holds only nbh.pod.v1 for the podcast (the speed, an episode's second, length, heard, when);
      in the workstation, with a simulated student's case open, Listen in TD-1 changes nothing of the case, Close case while
      it plays saves and closes as before, and the next simulated student's case and files hold nothing of the first and
      nothing of the episode; Listen works for the next student.
   H. offline: the workstation saved for offline use, then the network cut: the episode plays from the saved copy.
   I. no page errors.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2573-podcast-test.js [A B C D E F G H]   screens in qa/out/v2573-podcast/ */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const DIR=path.join(ROOT,'NBH-Workstation'),U=BASE+'/NBH-Workstation/';
const OUT=path.join(__dirname,'out','v2573-podcast');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));return !!c;};
const ctx0={window:{}};vm.createContext(ctx0);vm.runInContext(fs.readFileSync(path.join(DIR,'nbh-videos.js'),'utf8'),ctx0);const V=ctx0.window.NBH_VIDEOS;
const ctx1={window:{}};vm.createContext(ctx1);vm.runInContext(fs.readFileSync(path.join(DIR,'nbh-pod-transcripts.js'),'utf8'),ctx1);const T=ctx1.window.NBH_POD_TRANSCRIPTS;
const KEY='romaniuk-2002',CARD='choice-academic-task-escape',NOTE='Nora and Sam are AI voices. The episode is based on the published article.';
const EP=(V.podcasts||[]).find(p=>p.key===KEY)||{};const TL=T[KEY]||[];
const TD1=U+V.form;
const IPAD_UA='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const SIZES={side:[1180,820],up:[820,1180],phone:[390,844]};
const errs=[];
let br;
async function page(size,o){o=o||{};const [w,h]=SIZES[size];
  const c=await br.newContext(Object.assign({viewport:{width:w,height:h},hasTouch:size!=='side'||!!o.touch,serviceWorkers:o.sw?'allow':'block',acceptDownloads:true,userAgent:IPAD_UA},o.ctx||{}));
  await c.addInitScript(()=>{try{if(window.top===window){localStorage.setItem('nbh.ws.where@nbh','files');localStorage.setItem('nbh.ws.installTip','dismissed');}}catch(e){}window.print=function(){};});
  const p=await c.newPage();p.on('pageerror',e=>errs.push(size+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));return {c,p};}
const st=p=>p.evaluate(()=>window.NBHPod?window.NBHPod.state():null);
async function until(p,fn,arg,ms){try{await p.waitForFunction(fn,arg,{timeout:ms||20000});return true;}catch(e){return false;}}
const playing=p=>until(p,()=>{const s=window.NBHPod&&window.NBHPod.state();return !!s&&s.loaded&&!s.paused&&s.t>0.3;},null,30000);
/* the line marked in a transcript list, and whether it is in the list's view */
const marked=(p,root)=>p.evaluate(r=>{const R=document.querySelector(r);if(!R)return null;const L=R.querySelector('.nt-list'),b=R.querySelector('.nt-ln[aria-current]');if(!b)return {i:-1};
  const lr=L.getBoundingClientRect(),q=b.getBoundingClientRect();return {i:+b.dataset.i,inView:q.top>=lr.top-1&&q.bottom<=lr.bottom+1,who:b.querySelector('b').firstChild.textContent};},root);
const lineAt=t=>{let c=-1;TL.forEach((l,i)=>{if(l[0]<=t+0.05)c=i;});return c;};
/* the contrast of two CSS colors */
function lum(c){const m=c.match(/[\d.]+/g).map(Number);const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]);}
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};

(async()=>{
 br=await L.chromium.launch({args:['--autoplay-policy=user-gesture-required']});
 /* ---------------- A. the files ---------------- */
 if(want('A')){
  ok('A nbh-videos.js: one episode, '+KEY+', The Research Behind the Plan, its card from the bank (CHOICE), the audio beside the forms, its length (6:42) and function (escape) written by patch-videos.py, 7 min',
   V.podcasts.length===1&&EP.series==='The Research Behind the Plan'&&EP.title==='Choice of task, and why function matters'&&EP.cards[0]===CARD&&V.cards[CARD]&&V.cards[CARD].code==='CHOICE'&&
   fs.existsSync(path.join(DIR,EP.file))&&Math.abs(EP.dur-401.8)<1&&EP.fn.join()==='escape'&&EP.min===7&&EP.family==='choice',{n:V.podcasts.length,EP:Object.assign({},EP,{about:0,ref:0})});
  const s=fs.readFileSync(path.join(DIR,EP.file),'utf8'),m=/NBH_POD_AUDIO\['romaniuk-2002'\]='([A-Za-z0-9+/=]+)'/.exec(s),b=m?Buffer.from(m[1],'base64'):Buffer.alloc(0);
  ok('A the audio stored as the videos are: base64 of an MP4 (AAC), loaded only on a tap; '+(b.length/1e6).toFixed(2)+' MB of sound, '+(s.length/1e6).toFixed(2)+' MB stored',!!m&&b.slice(4,8).toString()==='ftyp'&&b.includes(Buffer.from('mp4a'))&&b.length>2e6&&b.length<3e6,b.slice(0,12));
  ok('A the transcript: 29 turns in time order, inside the episode, each Nora or Sam, no turn saying the hosts are AI voices',TL.length===29&&TL.every((l,i)=>(!i||l[0]>TL[i-1][0])&&l[0]>=0&&l[0]<EP.dur&&/^(Nora|Sam)$/.test(l[1])&&l[2].length>5&&!/AI voice/i.test(l[2])),TL.length);
  const py='import importlib.util,json,sys\nsp=importlib.util.spec_from_file_location("pw",sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)\nprint(json.dumps(m.files_of(sys.argv[2])))';
  const fl=spawnSync('python3',['-c',py,path.join(ROOT,'tools','pwa-sw.py'),DIR],{encoding:'utf8'});let files=[];try{files=JSON.parse(fl.stdout);}catch(e){}
  const sw=fs.readFileSync(path.join(DIR,'sw.js'),'utf8');const need=[EP.file,'nbh-pod-player.js','nbh-pod-transcripts.js','nbh-transcript.js','videos.html','nbh-videos.js'];
  ok('A the offline list (tools/pwa-sw.py, and sw.js) holds the audio, the player, the turns and the transcript’s drawing',need.every(f=>files.includes(f)&&sw.includes("'"+f+"'")),need.filter(f=>!files.includes(f)||!sw.includes("'"+f+"'")));
  const rl=fs.readFileSync(path.join(__dirname,'release-list.txt'),'utf8');ok('A this test is in the release list',/^v2573-podcast-test$/m.test(rl));
  const pv=spawnSync('python3',[path.join(ROOT,'tools','blocks','patch-videos.py'),'--check',DIR],{encoding:'utf8'});ok('A patch-videos.py --check: the list and Form TD-1’s copy current (the episode in both)',pv.status===0&&fs.readFileSync(path.join(DIR,V.form),'utf8').includes("key:'romaniuk-2002'"),pv.stdout+pv.stderr);
  const pl=fs.readFileSync(path.join(DIR,'nbh-pod-player.js'),'utf8');const keys=[...new Set([...pl.matchAll(/'(nbh\.[a-z0-9.]+)'/g)].map(x=>x[1]))];
  ok('A the player keeps one thing on the device, localStorage nbh.pod.v1 (no other key, no sessionStorage, no IndexedDB)',keys.join()==='nbh.pod.v1'&&!/sessionStorage|indexedDB/.test(pl),keys);}

 /* ---------------- B, C, D. the library ---------------- */
 if(want('B')||want('C')||want('D')){
  const {c,p}=await page('side');
  await p.goto(U+'videos.html');await until(p,()=>!!document.querySelector('#vlPods .vl-pc'));
  if(want('B')){
   const sh=await p.evaluate(()=>{const s=document.getElementById('vlPods'),f=document.querySelector('#vlList .vl-fam'),c=s&&s.querySelector('.vl-pc');
     return s&&{h:s.querySelector('h2').textContent,sub:s.querySelector('.vl-sub').textContent,before:!!f&&!!(s.compareDocumentPosition(f)&Node.DOCUMENT_POSITION_FOLLOWING),
      txt:c.innerText.replace(/\s+/g,' '),href:c.getAttribute('href'),ai:!!c.querySelector('.vl-ai'),tile:!!c.querySelector('.vl-pct svg'),w:c.getBoundingClientRect().width,h2:c.getBoundingClientRect().height,cards:s.querySelectorAll('.vl-pc').length};});
   ok('B the shelf "The Research Behind the Plan" (Listen · short talks about the studies behind the cards) above the first procedure, one wide, short card: headphones, Listen · 7 min, AI voices, the title, the study',
    !!sh&&sh.h==='The Research Behind the Plan'&&sh.sub==='Listen · short talks about the studies behind the cards'&&sh.before&&sh.cards===1&&/Listen · 7 min/.test(sh.txt)&&/AI voices/.test(sh.txt)&&/Choice of task, and why function matters/.test(sh.txt)&&/Romaniuk et al\. \(2002\)/.test(sh.txt)&&sh.ai&&sh.tile&&sh.href==='#pod='+KEY&&sh.w>sh.h2*2,sh);
   await p.screenshot({path:path.join(OUT,'B-ipadL-shelf.png')});
   const q=async s=>{await p.fill('#vlQ',s);await sleep(450);return p.evaluate(()=>({pods:document.querySelectorAll('#vlList .vl-pc').length,vids:document.querySelectorAll('#vlList .vl-card').length,none:!!document.querySelector('#vlList .vl-none')}));};
   const f1=await q('Fargo'),f2=await q('Romaniuk'),f3=await q('zyzzogeton'),f4=await q('podcast');await q('');
   ok('B the search finds the episode by a word only its transcript has (Fargo: the episode, no video), by its study (Romaniuk: the episode and the video), by "podcast"; a word nobody says finds nothing',
    f1.pods===1&&f1.vids===0&&!f1.none&&f2.pods===1&&f2.vids>=1&&f3.pods===0&&f3.none&&f4.pods===1,{f1,f2,f3,f4});
   const fl=async c=>{await p.evaluate(c=>{const b=document.querySelector('#vlFilt [data-chip="'+c+'"]');if(b)b.click();},c);await sleep(250);return p.evaluate(()=>document.querySelectorAll('#vlList .vl-pc').length);};
   const e1=await fl('fn:escape'),e2=await fl('fn:attention');await fl('fn:any');const e3=await fl('fam:choice'),e4=await fl('fam:dro');await fl('fam:any');
   await p.selectOption('#vlSeen','seen');await sleep(250);const e5=await p.evaluate(()=>document.querySelectorAll('#vlList .vl-pc').length);await p.selectOption('#vlSeen','unseen');await sleep(250);const e6=await p.evaluate(()=>document.querySelectorAll('#vlList .vl-pc').length);await p.selectOption('#vlSeen','all');await sleep(250);
   ok('B the filters: Function Escape shows the episode, Attention not; Procedure Choice (its card’s) shows it, DRO not; Watched (heard to the end) not yet, Not watched yes',e1===1&&e2===0&&e3===1&&e4===0&&e5===0&&e6===1,{e1,e2,e3,e4,e5,e6});}
  /* C. the episode's page */
  await p.click('#vlPods .vl-pc');await until(p,()=>window.__vl&&window.__vl.view()==='pod');await sleep(500);
  if(want('C')){
   const pg=await p.evaluate(()=>({title:document.getElementById('vlTitle').textContent,focus:document.activeElement&&document.activeElement.id,series:document.querySelector('.vl-eps').textContent,meta:document.querySelector('.vl-ep .vl-wm').innerText.replace(/\s+/g,' '),
     listen:(document.getElementById('vlEpPlay')||{}).textContent,open:[...document.querySelectorAll('.vl-ep [data-card]')].map(b=>b.dataset.card+':'+b.textContent),watch:(document.querySelector('.vl-ep a[href^="#video="]')||{}).textContent,
     note:(document.querySelector('#vlEpTr .nt-note')||{}).textContent,lines:document.querySelectorAll('#vlEpTr .nt-ln').length,who:[...document.querySelectorAll('#vlEpTr .nt-ln b')].map(b=>b.firstChild.textContent),
     side:[...document.querySelectorAll('.vl-epside h3')].map(h=>h.textContent),ref:(document.querySelector('.vl-ref')||{}).innerText,url:location.hash,trBtn:!!document.querySelector('#nbhPod .np-tr:not([hidden])')}));
   ok('C the episode’s page: The Research Behind the Plan, its title (the focus on it), Romaniuk et al. (2002) · Listen · about 7 min · AI voices, Listen, Open the TD-1 card ('+CARD+'), Watch the procedure',
    pg.title===EP.title&&pg.focus==='vlTitle'&&pg.series==='The Research Behind the Plan'&&/Romaniuk et al\. \(2002\) · Listen · about 7 min AI voices/.test(pg.meta)&&pg.listen==='Listen'&&pg.open.join()===CARD+':Open the TD-1 card'&&pg.watch==='Watch the procedure'&&pg.url==='#pod='+KEY,pg);
   ok('C the transcript: the note (exactly "'+NOTE+'"), all 29 turns with their speakers; beside it About this episode and The study (the reference)',
    pg.note===NOTE&&pg.lines===29&&pg.who.join()===TL.map(l=>l[1]).join()&&pg.side.join()==='About this episode,The study'&&/Journal of Applied Behavior Analysis, 35/.test(pg.ref||''),{note:pg.note,lines:pg.lines,side:pg.side});}
  /* D. playing */
  if(want('D')){
   await p.click('#vlEpPlay');const pl1=await playing(p);const s1=await st(p);
   const bar=await p.evaluate(()=>{const b=document.querySelector('#nbhPod .np-bar'),r=b.getBoundingClientRect();return {vis:!document.getElementById('nbhPod').hidden,bottom:Math.round(innerHeight-r.bottom),h:Math.round(r.height),
     title:b.querySelector('.np-t').textContent,ai:!!b.querySelector('.np-ai'),btn:document.getElementById('vlEpPlay').textContent,trHidden:b.querySelector('.np-tr').hidden};});
   ok('D Listen starts the sound at once, in the bar at the bottom of the screen ('+bar.h+' px, one row), with the title and AI voices; the page’s button says Pause; the bar’s Transcript hidden here (the transcript is on the page)',
    pl1&&bar.vis&&bar.bottom<=1&&bar.h<=80&&bar.title===EP.title&&bar.ai&&bar.btn==='Pause'&&bar.trHidden,{pl1,s1,bar});
   await p.click('#nbhPod .np-play');await sleep(400);const s2=await st(p);await p.click('#nbhPod .np-play');await sleep(600);const s3=await st(p);
   const t0=(await st(p)).t;await p.click('#nbhPod .np-fwd');await sleep(300);const t1=(await st(p)).t;await p.click('#nbhPod .np-back');await sleep(300);const t2=(await st(p)).t;
   await p.click('#nbhPod .np-rate');await sleep(200);const r1=await p.evaluate(()=>({rate:window.NBHPod.audio().playbackRate,txt:document.querySelector('#nbhPod .np-rate').textContent,lab:document.querySelector('#nbhPod .np-rate').getAttribute('aria-label')}));
   ok('D play and pause, forward 15 s and back 15 s, the speed (1× to 1.25×, named)',s2.paused&&!s3.paused&&t1-t0>13.5&&t1-t0<17&&t1-t2>13.5&&t1-t2<17&&r1.rate===1.25&&r1.txt==='1.25×'&&/Speed, 1.25 times/.test(r1.lab),{s2,s3,t0,t1,t2,r1});
   /* the transcript follows: three sample times */
   const fol=[];for(const t of [30,200,390]){await p.evaluate(t=>{window.NBHPod.audio().currentTime=t;},t);await sleep(900);const m=await marked(p,'#vlEpTr');fol.push({t,want:lineAt(t+0.9),got:m&&m.i,inView:m&&m.inView,who:m&&m.who});}
   ok('D the line heard is marked (aria-current) and kept in view at 0:30, 3:20 and 6:30 (turns '+fol.map(x=>x.want+1).join(', ')+')',fol.every(x=>(x.got===x.want||x.got===lineAt(x.t))&&x.inView),fol);
   const tap=await p.evaluate(()=>{const b=document.querySelectorAll('#vlEpTr .nt-ln')[16];b.click();return +b.dataset.t;});await sleep(800);const s4=await st(p);const m4=await marked(p,'#vlEpTr');
   ok('D a line tapped plays from its start (turn 17 at '+tap+' s)',Math.abs(s4.t-tap)<1.6&&!s4.paused&&m4.i===16,{tap,s4,m4});
   /* remembered: paused at about 4:00, the page opened again */
   await p.evaluate(()=>{window.NBHPod.audio().currentTime=240;});await sleep(500);await p.click('#nbhPod .np-play');await sleep(500);
   const kept=await p.evaluate(()=>JSON.parse(localStorage.getItem('nbh.pod.v1')||'null'));
   await p.reload();await until(p,()=>window.__vl&&window.__vl.view()==='pod');await sleep(600);
   const res=await p.evaluate(()=>({show:!document.getElementById('vlEpRes').hidden,txt:document.getElementById('vlEpResT').textContent}));
   await p.click('#vlEpPlay');const pl2=await playing(p);const s5=await st(p);
   ok('D the position and the speed are remembered on this device (nbh.pod.v1: the second, the length, the speed; nothing else): the page reopened says it picks up at 4:00, and plays from there at 1.25×',
    !!kept&&kept.rate===1.25&&kept.items[KEY]&&Math.abs(kept.items[KEY].t-240)<=2&&JSON.stringify(Object.keys(kept.items[KEY]).sort())==='["at","d","t","w"]'&&res.show&&/at 4:0\d/.test(res.txt)&&pl2&&s5.t>238&&s5.t<250&&s5.rate===1.25,{kept,res,s5});
   await p.screenshot({path:path.join(OUT,'D-ipadL-episode-follow.png')});
   /* the bar's Transcript from another page; Listen to the study on the video's page; a video pauses the episode */
   await p.click('#vlBack');await until(p,()=>window.__vl.view()==='home');await sleep(400);
   const trv=await p.evaluate(()=>!document.querySelector('#nbhPod .np-tr').hidden);await p.click('#nbhPod .np-tr');const back=await until(p,()=>window.__vl.view()==='pod');
   ok('D on another page the bar shows Transcript, which opens the episode’s page; the sound goes on',trv&&back&&!(await st(p)).paused,{trv,back});
   await p.evaluate(k=>{location.hash='video='+k;},CARD);await until(p,()=>window.__vl.view()==='watch');await sleep(500);
   const ls=await p.evaluate(()=>{const b=document.querySelector('[data-listen]');return b&&{t:b.textContent,k:b.dataset.listen,line:b.parentNode.innerText.replace(/\s+/g,' ')};});
   await p.click('#nbhPod .np-play');await sleep(300);await p.click('[data-listen]');const pl3=await playing(p);
   const vok=await p.evaluate(async()=>{const v=document.getElementById('vlVideo');for(let i=0;i<80&&!v.getAttribute('src');i++)await new Promise(r=>setTimeout(r,250));if(!v.getAttribute('src'))return 'no video';try{await v.play();}catch(e){return String(e);}await new Promise(r=>setTimeout(r,800));return {v:!v.paused,pod:window.NBHPod.state().paused};});
   ok('D the choice video’s page has Listen to the study (the episode, AI voices), which plays in the bar with the page kept; the video started pauses the episode',!!ls&&ls.t==='Listen to the study'&&ls.k===KEY&&/AI voices/.test(ls.line)&&pl3&&vok&&vok.v===true&&vok.pod===true,{ls,pl3,vok});
   await p.evaluate(()=>{const v=document.getElementById('vlVideo');if(v)v.pause();});
   await p.click('#nbhPod .np-close');await sleep(300);ok('D Close puts the bar away and the sound stops',await p.evaluate(()=>document.getElementById('nbhPod').hidden&&window.NBHPod.state().paused&&!document.documentElement.classList.contains('nbh-pod-on')));}
  await c.close();}

 /* ---------------- E. Form TD-1 ---------------- */
 if(want('E')){
  for(const size of ['side','up','phone']){
   const {c,p}=await page(size);
   await p.goto(TD1+'#card='+CARD);await until(p,()=>typeof TD1_BANK!=='undefined'&&!!window.__tdBank,null,90000);await p.evaluate(id=>{location.hash='';location.hash='card='+id;},CARD);
   const shown=await until(p,id=>!!document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod'),CARD,90000);
   const card=shown&&await p.evaluate(([id,size])=>{const ld=document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"]'),v=ld.querySelector('.vid'),q=ld.querySelector('.pod'),a=ld.querySelector('.add'),rv=v.getBoundingClientRect(),rq=q.getBoundingClientRect(),ra=a.getBoundingClientRect();
     return {vid:v.textContent,pod:q.textContent,lab:q.getAttribute('aria-label'),lines:[...ld.querySelectorAll('.vidln')].map(x=>x.textContent.replace(/\s+/g,' ')),ai:!!ld.querySelector('.podln .podai'),sameRow:Math.abs(rv.top-rq.top)<2,after:rq.left>rv.left,
      afterAdd:size==='phone'?rq.top>ra.top:Math.abs(ra.top-rq.top)<2,h:[rv.height,rq.height]};},[CARD,size]);
   ok('E '+size+': the TD-1 card shows Watch how and Listen side by side ('+(size==='phone'?'sharing a row under Add to the plan':'after Add to the plan')+'), each with its line; Listen’s says "a 7-minute talk about the study behind this card (Romaniuk et al., 2002)" with the AI voices label',
    !!card&&card.vid==='Watch how'&&card.pod==='Listen'&&card.sameRow&&card.after&&card.afterAdd&&card.h.every(x=>x>=44)&&card.ai&&card.lines.some(x=>x==='Listen: a 7-minute talk about the study behind this card (Romaniuk et al., 2002). AI voices')&&card.lines.some(x=>/^The video shows this card’s steps/.test(x))&&/^Listen: a 7-minute talk/.test(card.lab),card);
   if(!card){await c.close();continue;}
   await p.evaluate(id=>{const b=document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod');b.scrollIntoView({block:'center'});},CARD);await sleep(300);
   const y0=await p.evaluate(()=>scrollY);
   await p.click('.load[data-id="'+CARD+'"] .pod');const pl=await playing(p);
   const b1=await p.evaluate(id=>{const B=document.querySelector('#nbhPod .np-bar'),r=B.getBoundingClientRect(),q=document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod').getBoundingClientRect();
     return {h:Math.round(r.height),bottom:Math.round(innerHeight-r.bottom),cardVisible:q.bottom<r.top&&q.top>=0,ctl:[...B.querySelectorAll('button,input')].filter(x=>x.getClientRects().length).map(x=>{const r=x.getBoundingClientRect();return {n:x.getAttribute('aria-label')||x.textContent,w:Math.round(r.width),h:Math.round(r.height),inside:r.left>=-1&&r.right<=innerWidth+1};}),y:scrollY,wide:document.documentElement.scrollWidth-innerWidth};},CARD);
   ok('E '+size+': Listen plays at once in the bar ('+b1.h+' px'+(size==='phone'?', two rows':', one row')+'), the card stays readable above it, nothing wider than the screen',pl&&b1.bottom<=1&&(size==='phone'?b1.h>=100&&b1.h<=130:b1.h<=80)&&b1.cardVisible&&b1.wide<=0,b1);
   ok('E '+size+': every control of the bar named, 44 px or more and inside the screen (back, play, forward, speed, Transcript, Close, the position line)',b1.ctl.length===7&&b1.ctl.every(x=>x.n&&x.w>=44&&x.h>=44&&x.inside),b1.ctl);
   await p.screenshot({path:path.join(OUT,'E-'+size+'-card-bar.png')});
   await p.click('#nbhPod .np-tr');await until(p,()=>!!document.querySelector('#nbhPod .np-sheet:not([hidden]) .nt-ln'));await sleep(1200);
   const sh=await p.evaluate(()=>{const s=document.querySelector('#nbhPod .np-sheet'),r=s.getBoundingClientRect(),b=document.querySelector('#nbhPod .np-bar').getBoundingClientRect();
     return {open:!s.hidden,role:s.getAttribute('role'),modal:s.getAttribute('aria-modal'),note:(s.querySelector('.nt-note')||{}).textContent,lines:s.querySelectorAll('.nt-ln').length,focus:document.activeElement&&document.activeElement.className,
       right:Math.round(innerWidth-r.right),w:Math.round(r.width),aboveBar:r.bottom<=b.top+1,expanded:document.querySelector('#nbhPod .np-tr').getAttribute('aria-expanded'),srHidden:[...s.querySelectorAll('.vl-sr')].every(x=>x.getBoundingClientRect().width<=1)};});
   const m=await marked(p,'#nbhPod .np-sheet'),tt=(await st(p)).t;
   ok('E '+size+': the bar’s Transcript opens the sheet ('+(size==='phone'?'from the bottom':'a panel at the right')+', above the bar): the note "'+NOTE+'", the 29 turns, the line heard marked and in view, the focus on its Close',
    sh.open&&sh.role==='dialog'&&sh.modal==='true'&&sh.note===NOTE&&sh.lines===29&&/np-x/.test(sh.focus)&&sh.aboveBar&&sh.expanded==='true'&&sh.srHidden&&(size==='phone'?sh.w>=380:sh.right<=16&&sh.w<=470)&&m&&(m.i===lineAt(tt)||m.i===lineAt(tt-1))&&m.inView,{sh,m,tt});
   await p.screenshot({path:path.join(OUT,'E-'+size+'-sheet.png')});
   const t3=await p.evaluate(()=>{const b=document.querySelectorAll('#nbhPod .np-sheet .nt-ln')[24];b.click();return +b.dataset.t;});await sleep(900);const s6=await st(p);
   await p.keyboard.press('Escape');await sleep(300);const s7=await p.evaluate(()=>({hidden:document.querySelector('#nbhPod .np-sheet').hidden,focus:document.activeElement&&document.activeElement.className}));
   ok('E '+size+': a line tapped in the sheet plays from it; Escape closes the sheet, the focus back on Transcript',Math.abs(s6.t-t3)<1.6&&!s6.paused&&s7.hidden&&/np-tr/.test(s7.focus),{t3,s6,s7});
   await p.click('#nbhPod .np-close');await sleep(300);
   const s8=await p.evaluate(()=>({hidden:document.getElementById('nbhPod').hidden,focus:(a=>a&&a.shadowRoot&&a.shadowRoot.activeElement||a)(document.activeElement).className,paused:window.NBHPod.state().paused}));
   ok('E '+size+': Close puts the bar away, the sound stops, the focus back on Listen',s8.hidden&&s8.paused&&/\bpod\b/.test(s8.focus),s8);
   await c.close();}}

 /* ---------------- F. the quality floor ---------------- */
 if(want('F')){
  for(const size of ['phone','up','side']){
   const {c,p}=await page(size);await p.goto(U+'videos.html#pod='+KEY);await until(p,()=>window.__vl&&window.__vl.view()==='pod');await p.click('#vlEpPlay');await playing(p);await sleep(400);
   const r=await p.evaluate(()=>{const small=[];document.querySelectorAll('#nbhPod *, .vl-ep *').forEach(e=>{if(!e.getClientRects().length)return;if(![...e.childNodes].some(x=>x.nodeType===3&&x.textContent.trim()))return;
       if(e.closest('.vl-sr')||e instanceof SVGElement)return;const f=parseFloat(getComputedStyle(e).fontSize);if(f<12)small.push(String(e.className)+':'+f);});
     document.querySelectorAll('#nbhPod svg text, .vl-ep svg text').forEach(e=>{if(e.getClientRects().length&&e.getBoundingClientRect().height<12)small.push('svg text '+e.textContent);});
     return {small,wide:document.documentElement.scrollWidth-innerWidth};});
   await p.goto(U+'videos.html');await until(p,()=>!!document.querySelector('#vlPods'));await sleep(300);
   const r2=await p.evaluate(()=>({wide:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('#vlPods *')].filter(e=>e.getClientRects().length&&[...e.childNodes].some(x=>x.nodeType===3&&x.textContent.trim())&&!e.closest('.vl-sr')&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.className)}));
   if(size==='phone')await p.screenshot({path:path.join(OUT,'F-phone-shelf.png')});
   ok('F '+SIZES[size][0]+' px: no text under 12 px in the bar, the episode’s page and the shelf; no sideways scroll on the episode page and the home page',!r.small.length&&!r2.small.length&&r.wide<=0&&r2.wide<=0,{r,r2});
   await c.close();}
  /* contrast, focus, names */
  {const {c,p}=await page('side');await p.goto(U+'videos.html#pod='+KEY);await until(p,()=>window.__vl&&window.__vl.view()==='pod');await p.click('#vlEpPlay');await playing(p);
   const cr=await p.evaluate(()=>{const bg=e=>{for(;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;}return 'rgb(255, 255, 255)';};
     const sel=['#nbhPod .np-t','#nbhPod .np-sub','#nbhPod .np-ai','#nbhPod .np-time','#nbhPod .np-rate','#nbhPod .np-tr','.vl-ep .vl-eps','.vl-ep .vl-wm','.vl-ep .vl-ai','#vlEpTr .nt-note','#vlEpTr .nt-ln b','#vlEpTr .nt-ln span'];
     return sel.map(s=>{const e=document.querySelector(s);if(!e)return {s,miss:1};const st=getComputedStyle(e);return {s,fg:st.color,bg:bg(e)};});});
   const low=cr.filter(x=>x.miss||ratio(x.fg,x.bg)<4.5).map(x=>Object.assign(x,{r:x.fg?ratio(x.fg,x.bg).toFixed(2):0}));
   ok('F AA contrast (4.5:1 or more) of the bar’s, the episode page’s and the transcript’s text',!low.length,low);
   /* the keyboard: Tab reaches the bar's controls in order, each with a visible focus ring */
   await p.evaluate(()=>{document.querySelector('#nbhPod .np-back').focus();});await p.keyboard.press('Shift+Tab');const ring=[];
   for(let i=0;i<7;i++){const f=await p.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {n:e.getAttribute('aria-label')||e.textContent,o:s.outlineStyle,w:parseFloat(s.outlineWidth)};});ring.push(f);await p.keyboard.press('Tab');}
   ok('F by keyboard the bar is reached control by control (the position line, back, play, forward, speed, Close), each with a visible focus ring',ring.slice(0,6).every(x=>x.o!=='none'&&x.w>=2)&&/Position/.test(ring[0].n)&&/Back 15/.test(ring[1].n)&&/^(Play|Pause)$/.test(ring[2].n)&&/Forward 15/.test(ring[3].n)&&/Speed/.test(ring[4].n),ring);
   await p.focus('#nbhPod .np-seek');const k0=(await st(p)).t;await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await sleep(300);const k1=(await st(p)).t;
   const vt=await p.evaluate(()=>document.querySelector('#nbhPod .np-seek').getAttribute('aria-valuetext'));
   ok('F the position line moves by keyboard (arrows) and says where it is ("'+vt+'")',k1-k0>=2&&/minute|second/.test(vt),{k0,k1,vt});
   await c.close();}
  /* reduced motion: the transcript keeps the line in view without smooth scrolling */
  {const {c,p}=await page('side',{ctx:{reducedMotion:'reduce'}});await p.addInitScript(()=>{const o=Element.prototype.scrollTo;window.__beh=[];Element.prototype.scrollTo=function(a){if(a&&typeof a==='object')window.__beh.push(a.behavior||'');return o.apply(this,arguments);};});
   await p.goto(U+'videos.html#pod='+KEY);await until(p,()=>window.__vl&&window.__vl.view()==='pod');await p.click('#vlEpPlay');await playing(p);await p.evaluate(()=>{window.NBHPod.audio().currentTime=300;});await sleep(1200);
   const beh=await p.evaluate(()=>window.__beh);ok('F under reduced motion the transcript moves to the line heard without smooth scrolling',beh.length>0&&beh.every(b=>b!=='smooth'),beh);
   await c.close();}
  /* high contrast and low light */
  for(const [tag,v] of [['hc',{hc:true}],['dark',{dark:true}]]){const {c,p}=await page('side');await c.addInitScript(v=>{try{localStorage.setItem('nbh.view',JSON.stringify(v));}catch(e){}},v);
   await p.goto(U+'videos.html#pod='+KEY);await until(p,()=>window.__vl&&window.__vl.view()==='pod');await p.click('#vlEpPlay');await playing(p);await sleep(500);
   const r=await p.evaluate(()=>({cls:document.documentElement.className,filter:getComputedStyle(document.documentElement).filter,bar:!document.getElementById('nbhPod').hidden,ink:getComputedStyle(document.querySelector('#nbhPod .np-t')).color,line:getComputedStyle(document.querySelector('#nbhPod .np-bar')).borderTopWidth}));
   await p.screenshot({path:path.join(OUT,'F-'+tag+'-episode.png')});
   ok('F '+(tag==='hc'?'high contrast: the bar’s rule and ink darker':'low light: the page (and the bar) turned dark')+' (screen kept)',r.bar&&(tag==='hc'?/nbh-hc/.test(r.cls)&&r.line==='2px':/nbh-dark/.test(r.cls)&&/invert/.test(r.filter)),r);
   await c.close();}}

 /* ---------------- G. privacy, in the workstation with a simulated student's case ---------------- */
 if(want('G')){
  const {c,p}=await page('side');const FILE=Object.fromEntries(L.forms().map(f=>[f.id,f.file]));
  await p.goto(U+'index.html');await sleep(2500);
  await p.evaluate(async()=>{try{const l=await clList();for(const r of l||[])await clTx('readwrite',st=>st.delete(r.key));}catch(e){}try{await window.nbhCopies.clear();}catch(e){}['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  const setBar=o=>p.evaluate(o=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v||'';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient',o.client);set('#pSid',o.sid);},o);
  const frameOf=id=>p.frames().find(f=>f!==p.mainFrame()&&decodeURIComponent(f.url()).includes(FILE[id]));
  const openF=async id=>{await p.evaluate(id=>openForm(id),id);await p.waitForFunction(id=>!!state.status[id]&&!state.pending[id],id,{timeout:60000});await sleep(1300);return frameOf(id);};
  const answer=async(re,bre,ms)=>{const t=Date.now();while(Date.now()-t<(ms||15000)){const r=await p.evaluate(([tr,br])=>{const g=document.getElementById('cfDlg');if(!g||!g.open)return null;const t=document.getElementById('cfTitle').textContent;if(!new RegExp(tr).test(t))return null;
      const b=[...document.querySelectorAll('#cfFoot button')].find(x=>new RegExp(br).test(x.textContent));if(b)b.click();return t;},[re.source,bre.source]).catch(()=>null);if(r)return r;await sleep(60);}return null;};
  const A={client:'SIMULATED – Pat Example',sid:'9900001'},Bs={client:'SIMULATED – Sample Student',sid:''};
  await setBar(A);await sleep(300);const dm=await openF('DM-1');const td=await openF('TD-1');
  const factsBefore=await p.evaluate(async()=>{await gatherFacts(false);return JSON.stringify(state.facts||{});});
  await td.waitForFunction(()=>typeof TD1_BANK!=='undefined'&&!!window.__tdBank,null,{timeout:90000}).catch(()=>{});await td.evaluate(id=>{location.hash='card='+id;},CARD);
  const shown=await td.waitForFunction(id=>!!document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod'),CARD,{timeout:90000}).then(()=>true,()=>false);
  await td.evaluate(id=>{document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod').scrollIntoView({block:'center'});},CARD);
  const before=await td.evaluate(()=>Object.keys(localStorage).filter(k=>/^nbh\.pod/.test(k)));
  await td.click('.load[data-id="'+CARD+'"] .pod');const pl=await td.waitForFunction(()=>{const s=window.NBHPod&&window.NBHPod.state();return s&&s.loaded&&!s.paused&&s.t>0.3;},null,{timeout:30000}).then(()=>true,()=>false);
  await sleep(7500);   /* more than 5 s heard, so the device keeps the place */
  const factsAfter=await p.evaluate(async()=>{await gatherFacts(false);return JSON.stringify(state.facts||{});});
  const store=await td.evaluate(()=>localStorage.getItem('nbh.pod.v1'));
  ok('G in the workstation, with a simulated student’s case open, Listen in TD-1 plays; the case facts are as before; the device keeps only nbh.pod.v1, holding no name and no ID',shown&&pl&&factsAfter===factsBefore&&before.length===0&&!/Pat|Example|9900001|SIMULATED/i.test(store||'')&&/"romaniuk-2002"/.test(store||''),{shown,pl,same:factsAfter===factsBefore,store});
  await p.screenshot({path:path.join(OUT,'G-workstation-td1-bar.png')});
  /* Close case while it plays */
  const dl=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>$('#closeCase').click());const q=await answer(/^Close this case/,/^Save and close/,15000);
  const d=await dl;let caseTxt='';if(d){const f=path.join(OUT,'G-A-case-'+d.suggestedFilename());await d.saveAs(f);caseTxt=fs.readFileSync(f,'utf8');}
  await answer(/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
  const closed=await p.waitForFunction(()=>!Object.keys(state.frames).length&&!$('#pClient').value,null,{timeout:20000}).then(()=>true,()=>false);
  ok('G Close case while the episode plays: asked, saved (the case file holds the student, nothing of the episode), the forms closed, the sound gone with TD-1',!!q&&closed&&/Pat Example/.test(caseTxt)&&!/romaniuk-2002|Research Behind the Plan|nbh\.pod/.test(caseTxt)&&p.frames().length===1,{q,closed,len:caseTxt.length,frames:p.frames().length});
  /* the next student: TD-1 again, Listen again; her case and files hold nothing of the first student and nothing of the episode */
  await setBar(Bs);await sleep(300);await openF('DM-1');const td2=await openF('TD-1');
  await td2.waitForFunction(()=>typeof TD1_BANK!=='undefined'&&!!window.__tdBank,null,{timeout:90000}).catch(()=>{});await td2.evaluate(id=>{location.hash='card='+id;},CARD);await td2.waitForFunction(id=>!!document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod'),CARD,{timeout:90000}).catch(()=>{});
  await td2.evaluate(id=>{document.getElementById('tdBankHost').shadowRoot.querySelector('.load[data-id="'+id+'"] .pod').scrollIntoView({block:'center'});},CARD);
  await td2.click('.load[data-id="'+CARD+'"] .pod');const pl2=await td2.waitForFunction(()=>{const s=window.NBHPod&&window.NBHPod.state();return s&&s.loaded&&!s.paused&&s.t>0.3;},null,{timeout:30000}).then(()=>true,()=>false);
  const s2=await td2.evaluate(()=>window.NBHPod.state());
  const dl2=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>$('#saveCase').click());const d2=await dl2;let t2='';if(d2){const f=path.join(OUT,'G-B-case-'+d2.suggestedFilename());await d2.saveAs(f);t2=fs.readFileSync(f,'utf8');}
  await answer(/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
  ok('G the next simulated student: TD-1’s Listen plays again (picking up where the device stopped); her case file holds nothing of the first student and nothing of the episode',pl2&&s2.t>4&&/Sample Student/.test(t2)&&!/Pat Example|9900001|romaniuk-2002|nbh\.pod/.test(t2),{pl2,s2,len:t2.length});
  /* switching students in the bar while it plays: the episode goes on, nothing of it reaches the case */
  const C3={client:'SIMULATED – Lee Sample',sid:'9900003'};await setBar(C3);await sleep(1500);
  const s3=await td2.evaluate(()=>window.NBHPod.state()).catch(()=>null);
  const dl3=p.waitForEvent('download',{timeout:60000}).catch(()=>null);await p.evaluate(()=>$('#saveCase').click());await answer(/another student/i,/Save anyway/,4000);const d3=await dl3;let t3='';if(d3){const f=path.join(OUT,'G-C-case-'+d3.suggestedFilename());await d3.saveAs(f);t3=fs.readFileSync(f,'utf8');}
  await answer(/Case file written|Case saved|Case written/,/It is in Files|^OK$/,6000);
  const store3=await td2.evaluate(()=>localStorage.getItem('nbh.pod.v1')).catch(()=>'');
  ok('G the student switched in the bar while it plays: the episode goes on; the case saved under the new student holds nothing of the episode; the device’s nbh.pod.v1 holds no name',!!s3&&!s3.paused&&s3.t>5&&/Lee Sample/.test(t3)&&!/romaniuk-2002|nbh\.pod/.test(t3)&&!/Lee|Sample|Pat|SIMULATED|99000/.test(store3||''),{s3,len:t3.length,store3});
  await c.close();}

 /* ---------------- H. offline, from the saved copy ---------------- */
 if(want('H')){
  const {c,p}=await page('side',{sw:true});
  await p.goto(U+'index.html');const t0=Date.now();let txt='';
  while(Date.now()-t0<600000){txt=await p.evaluate(()=>{const c=document.querySelector('#offChip');return c&&!c.hidden?c.textContent:'';}).catch(()=>'');if(txt==='Saved for offline use')break;await sleep(500);}
  const has=await p.evaluate(async f=>{const ks=await caches.keys();for(const k of ks){const c=await caches.open(k);if(await c.match(new URL(f,location.href).href))return k;}return '';},EP.file);
  ok('H the workstation saved for offline use ('+Math.round((Date.now()-t0)/1000)+' s), the episode’s audio in the saved copy',txt==='Saved for offline use'&&!!has,{txt,has});
  await c.setOffline(true);const p2=await c.newPage();p2.on('pageerror',e=>errs.push('offline: '+String(e.message||e).slice(0,240)));
  await p2.goto(U+'videos.html#pod='+KEY).catch(e=>errs.push('offline goto: '+e.message));await until(p2,()=>window.__vl&&window.__vl.view()==='pod',null,20000);
  await p2.click('#vlEpPlay');const pl=await playing(p2);const s=await st(p2);
  ok('H offline: the episode’s page opens and the episode plays from the saved copy',pl&&s.t>0.3,s);
  await c.close();}

 ok('I no page errors',!errs.length,errs);
 await br.close();
 console.log(bad?'FAILED '+bad+' of '+n:'ALL PASSED '+n+'/'+n);
 process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL crash '+(e&&e.stack||e));process.exit(1);});
