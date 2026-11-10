/* v25.72 the video library's design review, built (V1 to V7 and V9 to V11; V6 is TD-1's player). Simulated data only: the
   videos are AI-generated with simulated people, and nothing here is about a student.
   A. the files: nbh-video-steps.js (each video's steps and captions, as the pictures show them) for every video it names,
      a step's start the start of one of its captions; the offline list holds it; this test in the release list.
   B. V1 the home page on an iPad sideways (1180 x 820), upright (820 x 1180) and a phone (390 x 844): four columns on both
      iPads, list rows with the picture at the left on the phone; whole cards in view (4, 8, 4) and the page's length in
      screens (3.0, 2.0, 4.0 at most; v25.73 3.6, 2.4, 4.3 with the seventh shelf and the podcast's shelf); in a procedure's section no badge and no repeated procedure; every title whole (up to
      3 lines, 4 upright); nothing wider than the screen; every control 44 px.
   C. V2 the filters: on an iPad two labelled rows (Procedure, Function), Any first in each, one choice in each, and they
      combine; Watched a menu, the count at the right; the counts follow the search; DRO in class only under Any. On the
      phone three menus side by side within 390 px, the count under them, and they combine too.
   D. V3 a video's page: Open the TD-1 card the filled main button under the title, with the card's name; the Steps beside
      the video sideways and under it upright and on the phone; a step tapped moves the video to the step's start, marks
      it and shows its caption; the mark follows the video; every video with steps lists them.
   E. V4 a video that cannot be loaded (its file's request blocked): the message over the picture, inside the player, in
      the review's words, no dead controls; Try again loads it once the file can be had.
   F. V5 after six videos opened one after another, no more than two kept decoded (the page's own count of object URLs);
      back home, the player let go.
   G. V7 from the website a slow load shows its progress (a percentage, "x of y MB", a bar).
   H. V9 the search: "non-contingent", "noncontingent" and "non contingent" alike, "high p" as "high-p", "atention" as
      "attention", "behaviour" as "behavior"; with nothing found, the Procedure and Function choices.
   I. V10 by keyboard: each filter row one Tab stop, the arrow keys inside it; Tab from the title to the player; Space plays
      and pauses, the arrows skip 5 seconds.
   J. V11 the skip link 44 px tall; the Watched mark 12 px; under reduced motion a tapped video shows its poster and Play,
      and does not play until Play.
   K. axe-core (when installed) on the home page and a video's page in normal, high contrast, low light and large text: no
      violation; 320 px and text at 200%: nothing wider than the screen.
   L. V6 Form TD-1's player (when present): watching there is kept in the library's progress; the focus stays inside it and
      the page behind takes no taps; Close lets the video go; on a phone the player fills the screen, one header row, a
      44 px Close; "Open in the video library" names that video's page.
   M. no page errors.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2572-videos-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const DIR=path.join(ROOT,'NBH-Workstation'),U=BASE+'/NBH-Workstation/';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const ctx0={window:{}};vm.createContext(ctx0);vm.runInContext(fs.readFileSync(path.join(DIR,'nbh-videos.js'),'utf8'),ctx0);
vm.runInContext(fs.readFileSync(path.join(DIR,'nbh-video-steps.js'),'utf8'),ctx0);
const V=ctx0.window.NBH_VIDEOS,ST=ctx0.window.NBH_VIDEO_STEPS||{},LIST=V.list,BY={};LIST.forEach(v=>{BY[v.key]=v;});const N=LIST.length;
const SZ={ipadL:[1180,820],ipadP:[820,1180],phone:[390,844]};
const errs=[];
const NODEP=[__dirname,path.join(__dirname,'node_modules')].concat((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean));
let AXE=null;try{AXE=fs.readFileSync(require.resolve('axe-core/axe.min.js',{paths:NODEP}),'utf8');}catch(e){}

(async()=>{
 /* ---------------- A. the files ---------------- */
 {const keys=Object.keys(ST);const wrong=keys.filter(k=>{const s=ST[k];if(!BY[k]||!Array.isArray(s.steps)||!Array.isArray(s.caps)||!s.steps.length)return true;
    if(s.caps.some((c,i)=>i&&c[0]<=s.caps[i-1][0]))return true;
    /* v25.72 (captions and transcript) a step with no moment of its own starts with its card, or with the step it is shown with */
    const close=(s.caps.find(c=>c[2]===0)||[])[0];
    return s.steps.some(x=>!(x[3]==='open'?x[1]===0:x[3]==='close'?x[1]===close:x[3]==='with'?s.steps.some(y=>y[0]===x[4]&&!y[3]&&y[1]===x[1]):s.caps.some(c=>c[0]===x[1]&&c[2]===x[0]))||!(x[1]>=0&&x[1]<BY[k].dur)||!x[2]);});
  ok('A nbh-video-steps.js: '+keys.length+' videos, each named in the list, each step starting with one of its captions, inside the video, the captions in order',keys.length>=1&&!wrong.length,wrong);
  const py='import importlib.util,json,sys\nsp=importlib.util.spec_from_file_location("pw",sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)\nprint(json.dumps(m.files_of(sys.argv[2])))';
  const fl=spawnSync('python3',['-c',py,path.join(ROOT,'tools','pwa-sw.py'),DIR],{encoding:'utf8'});let files=[];try{files=JSON.parse(fl.stdout);}catch(e){}
  ok('A the offline list (tools/pwa-sw.py) holds nbh-video-steps.js, the library and its list',['nbh-video-steps.js','videos.html','nbh-videos.js'].every(f=>files.includes(f)),fl.stderr.slice(0,300));
  ok('A the release list runs this test',/^v2572-videos-test$/m.test(fs.readFileSync(path.join(ROOT,'qa','release-list.txt'),'utf8')));
  const src=fs.readFileSync(path.join(DIR,'nbh-video-steps.js'),'utf8');ok('A nbh-video-steps.js names no practice',!/Newsome/i.test(src));}

 const b=await pw.chromium.launch();
 const mk=async(size,o)=>{const [w,h]=SZ[size]||size;const ctx=await b.newContext(Object.assign({viewport:{width:w,height:h},hasTouch:true,isMobile:size!=='ipadL'&&size!=='desk',userAgent:size==='desk'?undefined:L.IPAD_UA},o||{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(size+': '+String(e.message||e)));p.on('dialog',d=>d.accept().catch(()=>{}));return {ctx,p};};
 const home=async(p,hash)=>{await p.goto(U+'videos.html'+(hash||''));await p.waitForFunction(()=>window.__vl&&(document.querySelectorAll('.vl-card').length>0||document.getElementById('vlTitle')),null,{timeout:20000});await sleep(250);};
 const shown=p=>p.evaluate(()=>[...document.querySelectorAll('#vlList .vl-card')].map(c=>c.dataset.key).sort().join(' '));
 const exp=f=>LIST.filter(f).map(v=>v.key).sort().join(' ');
 const loaded=p=>p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&/^blob:/.test(v.src)&&v.readyState>=1;},null,{timeout:40000}).then(()=>true,()=>false);
 const small=p=>p.evaluate(()=>[...document.querySelectorAll('button,a[href],input,select,video,[tabindex="0"]')].filter(e=>e.offsetParent!==null&&!e.classList.contains('vl-skip')).map(e=>{const t=e.closest('.vl-sel')||e;const r=t.getBoundingClientRect();return {e:e.id||e.className||e.tagName,w:Math.round(r.width),h:Math.round(r.height)};}).filter(x=>x.h<44||x.w<44));

 /* ---------------- B. V1 the home page at three sizes ---------------- */
 /* v25.73 a seventh shelf (Choice, one video) adds a row of cards, and the study podcast's shelf (the design review's P1, approved
   at its cost: the first video 199 px lower sideways, 227 px on a phone) sits above the first procedure: 3.6, 2.4 and 4.3 screens
   at most (were 3.0, 2.0 and 4.0), and on a phone 2 whole video cards in the first screen (were 4) */
 const WANT={ipadL:{cols:4,cards:4,screens:3.6,lines:3},ipadP:{cols:4,cards:8,screens:2.4,lines:4},phone:{cols:1,cards:2,screens:4.3,lines:3}};
 for(const size of Object.keys(SZ)){const {ctx,p}=await mk(size);await home(p);
  await p.waitForFunction(()=>[...document.querySelectorAll('#vlList .vl-card img')].every(i=>i.complete),null,{timeout:20000}).catch(()=>{});
  const r=await p.evaluate(()=>{const g=document.querySelector('#vlList .vl-fam .vl-grid'),cards=[...document.querySelectorAll('#vlList .vl-card')];
   const vis=cards.filter(c=>{const r=c.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}).length;
   const ts=[...document.querySelectorAll('#vlList .vl-t')].map(t=>{const lh=parseFloat(getComputedStyle(t).lineHeight);return {cut:t.scrollHeight>t.clientHeight+1||getComputedStyle(t).webkitLineClamp!=='none'&&getComputedStyle(t).webkitLineClamp!=='',lines:Math.round(t.getBoundingClientRect().height/lh)};});
   const c0=document.querySelector('#vlList .vl-fam .vl-card'),th=c0.querySelector('.vl-thumb').getBoundingClientRect(),tx=c0.querySelector('.vl-txt').getBoundingClientRect();
   const fam=[...document.querySelectorAll('#vlList .vl-fam')].map(s=>{const short=s.querySelector('.vl-sub').textContent.split(' · ')[0];return [...s.querySelectorAll('.vl-card')].some(c=>c.querySelector('.vl-av')||c.querySelector('.vl-m').firstChild.nodeValue.endsWith(' · '+short));});
   return {cols:getComputedStyle(g).gridTemplateColumns.split(' ').length,vis,screens:document.documentElement.scrollHeight/innerHeight,cut:ts.filter(x=>x.cut).length,maxLines:Math.max(...ts.map(x=>x.lines)),
    left:th.right<=tx.left+1&&th.top<tx.bottom,repeat:fam.filter(Boolean).length,wide:document.documentElement.scrollWidth-innerWidth};});
  const w=WANT[size];
  ok('B '+size+': '+w.cols+(w.cols>1?' columns':' column of list rows, the picture at the left')+', '+r.vis+' whole cards in view (at least '+w.cards+'), '+r.screens.toFixed(2)+' screens (at most '+w.screens+'), nothing wider than the screen',
   r.cols===w.cols&&r.vis>=w.cards&&r.screens<=w.screens&&r.wide<=0&&(size!=='phone'||r.left),r);
  ok('B '+size+': every title whole ('+r.maxLines+' lines at most, '+w.lines+' allowed); in a procedure’s section no badge and no repeated procedure',!r.cut&&r.maxLines<=w.lines&&!r.repeat,r);
  const sm=await small(p);ok('B '+size+': every control 44 px or more',!sm.length,sm.slice(0,6));
  await ctx.close();}

 /* ---------------- C. V2 the filters ---------------- */
 {const {ctx,p}=await mk('ipadL');await home(p);
  const f=await p.evaluate(()=>{const g=id=>[...document.querySelectorAll('#'+id+' .vl-chip')];const lab=id=>document.getElementById(document.getElementById(id).getAttribute('aria-labelledby')).textContent;
   const cnt=document.getElementById('vlCount').getBoundingClientRect(),row=document.querySelector('.vl-frow[data-row=fam] .vl-chips').getBoundingClientRect(),seen=document.querySelector('.vl-sel-seen');
   return {fam:lab('vlChips'),fn:lab('vlFns'),r1:g('vlChips').map(b=>b.textContent.replace(/[\d,].*$/,'')),r2:g('vlFns').map(b=>b.textContent.replace(/[\d,].*$/,'')),role:document.getElementById('vlChips').getAttribute('role'),
    countRight:cnt.left>=row.right&&cnt.right>innerWidth-80,seenVis:!!seen.offsetParent&&seen.querySelector('select').options.length===3,seenRight:seen.getBoundingClientRect().right>innerWidth-80};});
  ok('C iPad: two labelled rows, Procedure (Any, DRO, DRA, NCR, RIRD, High-p, FCT, Choice) and Function (Any, Attention, Escape, Tangible, Automatic), Watched a menu, the count at the right',
   f.fam==='Procedure'&&f.fn==='Function'&&f.r1.join()==='Any,DRO,DRA,NCR,RIRD,High-p,FCT,Choice'&&f.r2.join()==='Any,Attention,Escape,Tangible,Automatic'&&f.role==='radiogroup'&&f.countRight&&f.seenVis&&f.seenRight,f);
  await p.locator('#vlChips [data-chip="fam:dro"]').tap();await sleep(150);await p.locator('#vlFns [data-chip="fn:escape"]').tap();await sleep(150);
  const c1=await shown(p),t1=await p.textContent('#vlCount'),pr=await p.evaluate(()=>[...document.querySelectorAll('#vlFilt [aria-checked=true]')].map(b=>b.dataset.chip).join());
  ok('C iPad: DRO and Escape combine (one choice in each row): '+c1,c1===exp(v=>v.family==='dro'&&v.fn.includes('escape'))&&c1.length>0&&/^\d+ of 25 videos · DRO · Escape$/.test(t1)&&pr==='fam:dro,fn:escape',{c1,t1,pr});
  await p.locator('#vlChips [data-chip="fam:any"]').tap();await p.locator('#vlFns [data-chip="fn:any"]').tap();await sleep(150);
  /* the counts follow the search */
  await p.fill('#vlQ','token');await sleep(350);
  const cs=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#vlFilt .vl-chip')].map(b=>[b.dataset.chip,b.querySelector('.vl-n').textContent])));
  const hit=await p.evaluate(()=>__vl.found('token'));
  const wantAll={};V.families.forEach(fm=>{wantAll['fam:'+fm[0]]=String(hit.filter(k=>BY[k].family===fm[0]).length);});['attention','escape','tangible','automatic'].forEach(x=>{wantAll['fn:'+x]=String(hit.filter(k=>BY[k].fn.includes(x)).length);});
  ok('C iPad: the counts follow the search (“token”: '+hit.length+' videos)',hit.length>0&&hit.length<N&&Object.keys(wantAll).every(k=>cs[k]===wantAll[k]),{cs,wantAll});
  await p.fill('#vlQ','');await sleep(300);
  const dc=[];for(const x of ['attention','escape','tangible','automatic']){await p.locator('#vlFns [data-chip="fn:'+x+'"]').tap();await sleep(100);if((await shown(p)).split(' ').includes('dro_class'))dc.push(x);}
  await p.locator('#vlFns [data-chip="fn:any"]').tap();await sleep(100);
  ok('C DRO in class (no function listed for its card) shows under Any only',!dc.length&&(await shown(p)).split(' ').includes('dro_class')&&BY.dro_class.fn.length===0,dc);
  await ctx.close();}
 {const {ctx,p}=await mk('phone');await home(p);
  const m=await p.evaluate(()=>{const s=['vlSelFam','vlSelFn','vlSeen'].map(id=>document.getElementById(id).closest('.vl-sel').getBoundingClientRect());const c=document.getElementById('vlCount').getBoundingClientRect();
   return {row:s.every(r=>Math.abs(r.top-s[0].top)<2),inside:s.every(r=>r.left>=0&&r.right<=innerWidth),under:c.top>=s[0].bottom,wide:document.documentElement.scrollWidth-innerWidth,chips:!!document.getElementById('vlChips').offsetParent,
    labels:['vlSelFam','vlSelFn','vlSeen'].map(id=>document.getElementById(id).closest('label').querySelector('span').textContent).join()};});
  ok('C phone: three menus side by side (Procedure, Function, Watched) within 390 px, the count under them, no chip rows, no sideways scroll',m.row&&m.inside&&m.under&&m.wide<=0&&!m.chips&&m.labels==='Procedure,Function,Watched',m);
  await p.selectOption('#vlSelFam','ncr');await sleep(100);await p.selectOption('#vlSelFn','attention');await sleep(150);
  ok('C phone: the menus combine (NCR and Attention)',await shown(p)===exp(v=>v.family==='ncr'&&v.fn.includes('attention')));
  await ctx.close();}

 /* ---------------- D. V3 a video's page ---------------- */
 const S0=ST.dro_resetting;
 for(const size of Object.keys(SZ)){const {ctx,p}=await mk(size);await home(p,'#video=dro_resetting');await loaded(p);
  const r=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().toJSON():null;};const o=document.querySelector('.vl-open');
   return {player:g('.vl-player'),title:g('#vlTitle'),open:g('.vl-open'),steps:g('#vlSteps'),panel:g('.vl-wmain .vl-panel:not(.vl-tabs)'),pri:o.classList.contains('vl-pri'),txt:o.textContent.trim(),
    name:document.getElementById(o.getAttribute('aria-describedby')).textContent,n:document.querySelectorAll('#vlSteps li').length};});
  const lab=(V.cards[BY.dro_resetting.cards[0]]||{}).lab||'';
  ok('D '+size+': Open the TD-1 card is the filled main button under the title, before the panels, with the card’s name ('+lab.slice(0,40)+'…)',
   r.pri&&r.txt==='Open the TD-1 card'&&r.open.top>r.title.bottom&&r.open.top<r.panel.top&&r.name.toLowerCase().includes(lab.toLowerCase().slice(0,30)),r);
  /* v25.72 (captions and transcript) on a phone the Steps sit right under the video and its bar, before the title */
  ok('D '+size+': the Steps ('+r.n+') '+(size==='ipadL'?'beside the video':size==='phone'?'right under the video, before the title':'under it, after the button'),r.n===S0.steps.length&&(size==='ipadL'?r.steps.left>=r.player.right&&r.steps.top<r.player.bottom:size==='phone'?r.steps.top>=r.player.bottom&&r.steps.bottom<=r.title.top:r.steps.top>=r.open.bottom),r);
  if(size==='ipadL'){const st=S0.steps[2];
   await p.locator('#vlSteps .vl-sbtn').nth(2).tap();await sleep(700);
   const j=await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.pause();const on=document.querySelector('#vlSteps li.vl-on');return {t:v.currentTime,i:on?+on.dataset.i:-1,cur:on&&on.querySelector('[aria-current=step]')?1:0,cap:on?on.querySelector('.vl-scap').textContent:''};});
   const cap=S0.caps.filter(c=>c[0]<=j.t+0.05).pop();
   ok('D a step tapped ('+st[2]+') moves the video to its start ('+st[1]+' s), marks it and shows its caption',j.t>=st[1]-0.05&&j.t<st[1]+1.5&&j.i===2&&j.cur===1&&j.cap===cap[1]&&cap[2]===st[0],{j,cap});
   const later=S0.steps[4];await p.evaluate(t=>new Promise(r=>{const v=document.getElementById('vlVideo');v.addEventListener('seeked',r,{once:true});v.currentTime=t+1;}),later[1]);await sleep(300);
   ok('D the mark follows the video (at '+(later[1]+1)+' s, step '+later[0]+')',await p.evaluate(()=>+((document.querySelector('#vlSteps li.vl-on')||{}).dataset||{}).i)===4);
   /* every video with steps lists them */
   const miss=[];for(const k of LIST.map(v=>v.key)){await p.evaluate(k=>{location.replace('#video='+k);},k);await sleep(250);const c=await p.evaluate(()=>document.querySelectorAll('#vlSteps li').length);
    if(c!==((ST[k]||{}).steps||[]).length)miss.push([k,c]);}
   ok('D every video’s page lists its steps ('+Object.keys(ST).length+' with steps; one without lists none)',!miss.length,miss);}
  const sm=await small(p);ok('D '+size+': every control on a video’s page 44 px or more, nothing wider than the screen',!sm.length&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),sm.slice(0,6));
  await ctx.close();}

 /* ---------------- E. V4 a video that cannot be loaded ---------------- */
 {const {ctx,p}=await mk('ipadL');let block=true;await p.route('**/nbh-td1-video-ncr-work.js',r=>block?r.abort():r.continue());
  await home(p,'#video=ncr_work');await p.waitForSelector('#vlFail:not([hidden])',{timeout:15000}).catch(()=>{});
  const f=await p.evaluate(()=>{const pl=document.querySelector('.vl-player').getBoundingClientRect(),m=document.querySelector('#vlFail p').getBoundingClientRect(),b=document.getElementById('vlRetry').getBoundingClientRect(),v=document.getElementById('vlVideo');
   return {text:document.querySelector('#vlFail p').textContent,inside:m.top>=pl.top&&m.bottom<=pl.bottom&&b.bottom<=pl.bottom&&b.top>=pl.top,controls:v.controls,vis:getComputedStyle(document.getElementById('vlFail')).display!=='none',load:document.getElementById('vlLoad').hidden,role:document.getElementById('vlFail').getAttribute('role')};});
  ok('E a video that cannot be loaded: “This video is not saved on this device. Connect to the internet, then try again.” over the picture, inside the player, Try again, no dead controls',
   f.text==='This video is not saved on this device. Connect to the internet, then try again.'&&f.inside&&f.vis&&!f.controls&&f.load&&f.role==='alert',f);
  block=false;await p.locator('#vlRetry').tap();const okLoad=await loaded(p);
  ok('E Try again loads it once the file can be had (the message gone, the controls back)',okLoad&&await p.evaluate(()=>document.getElementById('vlFail').hidden&&document.getElementById('vlVideo').controls));
  await ctx.close();}

 /* ---------------- F. V5 memory ---------------- */
 {const {ctx,p}=await mk('ipadL');await home(p);const six=['dro_tokens','ncr_between','rird_pica','a_highp_peer','a_highp_class','ncr_attention'];const seen=[];
  for(const k of six){await p.evaluate(k=>{location.hash='#video='+k;},k);await loaded(p);seen.push(await p.evaluate(()=>__vl.mem().urls));}
  await p.evaluate(()=>{location.hash='';});await sleep(400);
  const end=await p.evaluate(()=>({mem:__vl.mem(),video:!!document.getElementById('vlVideo')}));
  ok('F six videos opened one after another: at most two kept decoded each time ('+seen.join(', ')+'), back home the player let go',seen.every(x=>x<=2)&&end.mem.urls<=2&&!end.video,{seen,end});
  await ctx.close();}

 /* ---------------- G. V7 a slow load shows its progress ---------------- */
 {const {ctx,p}=await mk('ipadL');await home(p);const cdp=await ctx.newCDPSession(p);await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:4e6/8,uploadThroughput:1e6/8});
  await p.evaluate(()=>{location.hash='#video=rird_vocal';});let g=null;
  for(let i=0;i<40;i++){await sleep(250);g=await p.evaluate(()=>({t:document.getElementById('vlLoadT').textContent,mb:document.getElementById('vlLoadMb').textContent,bar:!document.getElementById('vlLoadBar').hidden,w:document.querySelector('#vlLoadBar i').style.width}));if(/\d+%$/.test(g.t)&&parseInt(g.t.match(/(\d+)%/)[1])>0)break;}
  ok('G from the website a slow load shows its progress ('+g.t+', '+g.mb+')',/^Loading the video… \d+%$/.test(g.t)&&/^\d+\.\d of \d+\.\d MB$/.test(g.mb)&&g.bar&&parseFloat(g.w)>0,g);
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await ctx.close();}

 /* ---------------- H. V9 the search ---------------- */
 {const {ctx,p}=await mk('ipadL');await home(p);
  const f=async q=>p.evaluate(q=>__vl.found(q).join(' '),q);
  const a=await f('non-contingent'),b2=await f('noncontingent'),c=await f('non contingent'),hp=await f('high p'),hp2=await f('high-p'),at=await f('atention'),at2=await f('attention'),bh=await f('behaviour'),bh2=await f('behavior');
  ok('H “non-contingent”, “noncontingent” and “non contingent” find the same videos (the NCR ones among them)',a&&a===b2&&a===c&&LIST.filter(v=>v.family==='ncr').every(v=>a.split(' ').includes(v.key)),{a,b2,c});
  ok('H “high p” finds what “high-p” finds ('+hp2.split(' ').length+')',hp&&hp===hp2&&LIST.filter(v=>v.family==='highp').every(v=>hp.split(' ').includes(v.key)),{hp,hp2});
  ok('H one letter wrong in a long word: “atention” as “attention”; “behaviour” as “behavior”',at&&at===at2&&bh&&bh===bh2,{at,at2,bh,bh2});
  await p.fill('#vlQ','zzzz nothing');await sleep(350);
  const nr=await p.evaluate(()=>({t:(document.querySelector('.vl-none')||{}).textContent||'',b:[...document.querySelectorAll('.vl-none [data-set]')].map(x=>x.dataset.set)}));
  ok('H nothing found: says so, and offers the Procedure and Function choices and Show all videos',/No video matches “zzzz nothing”/.test(nr.t)&&['fam:dro','fam:fct','fn:attention','fn:automatic','all'].every(x=>nr.b.includes(x)),nr);
  await p.locator('.vl-none [data-set="fn:escape"]').tap();await sleep(200);
  ok('H a choice there clears the search and chooses it',await shown(p)===exp(v=>v.fn.includes('escape'))&&await p.inputValue('#vlQ')==='');
  await ctx.close();}

 /* ---------------- I. V10 by keyboard ---------------- */
 {const {ctx,p}=await mk('desk',{viewport:{width:1180,height:820},hasTouch:false});await home(p);
  const fo=()=>p.evaluate(()=>{const a=document.activeElement;return a.id||a.dataset.chip||a.tagName;});
  await p.focus('#vlQ');await p.keyboard.press('Tab');const t1=await fo();await p.keyboard.press('Tab');const t2=await fo();await p.keyboard.press('Tab');const t3=await fo();
  ok('I each filter row one Tab stop: the search, then Procedure (its choice), Function (its choice), Watched',t1==='fam:any'&&t2==='fn:any'&&t3==='vlSeen',[t1,t2,t3]);
  await p.keyboard.press('Shift+Tab');await p.keyboard.press('Shift+Tab');await p.keyboard.press('ArrowRight');await sleep(150);await p.keyboard.press('ArrowRight');await sleep(150);
  const ar=await p.evaluate(()=>({f:document.activeElement.dataset.chip,c:__vl.filters().fam}));
  ok('I the arrow keys move inside a row and choose (Any → DRO → DRA)',ar.f==='fam:dra'&&ar.c==='dra',ar);
  await p.keyboard.press('Home');await sleep(100);
  await p.evaluate(()=>{location.hash='#video=dro_class';});await loaded(p);await sleep(300);
  await p.focus('#vlTitle');await p.keyboard.press('Tab');const tv=await fo();
  const k=await p.evaluate(async()=>{const v=document.getElementById('vlVideo');v.muted=true;v.pause();v.currentTime=20;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));return v.currentTime;});
  await p.keyboard.press('ArrowRight');await sleep(300);const k1=await p.evaluate(()=>document.getElementById('vlVideo').currentTime);
  await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await sleep(300);const k2=await p.evaluate(()=>document.getElementById('vlVideo').currentTime);
  await p.keyboard.press(' ');await sleep(600);const pl=await p.evaluate(()=>!document.getElementById('vlVideo').paused);
  await p.keyboard.press(' ');await sleep(300);const pa=await p.evaluate(()=>document.getElementById('vlVideo').paused);
  ok('I Tab from the title goes to the player; there Space plays and pauses, the arrows skip 5 seconds',tv==='vlVideo'&&Math.abs(k1-k-5)<0.6&&Math.abs(k2-(k1-10))<0.6&&pl&&pa,{tv,k,k1,k2,pl,pa});
  await ctx.close();}

 /* ---------------- J. V11 ---------------- */
 {const {ctx,p}=await mk('desk',{viewport:{width:1180,height:820},hasTouch:false});await p.goto(U+'videos.html');
  await p.evaluate(()=>localStorage.setItem('nbh.videos.v1',JSON.stringify({v:1,items:{dro_class:{t:0,d:144,w:true,at:Date.now()}}})));await home(p);
  await p.keyboard.press('Tab');const sk=await p.evaluate(()=>{const a=document.activeElement,r=a.getBoundingClientRect();return {cls:a.className,h:r.height,top:r.top};});
  const wm=await p.evaluate(()=>{const s=document.querySelector('.vl-seen');return s?parseFloat(getComputedStyle(s).fontSize):0;});
  ok('J the skip link 44 px tall when it has the focus ('+sk.h+'); the Watched mark '+wm+' px',sk.cls==='vl-skip'&&sk.h>=44&&sk.top>=0&&wm>=12,{sk,wm});
  await ctx.close();}
 {const {ctx,p}=await mk('ipadL',{reducedMotion:'reduce'});await home(p);await p.locator('#vlList .vl-card[data-key="ncr_items"]').tap();await loaded(p);await sleep(1200);
  const r=await p.evaluate(()=>{const v=document.getElementById('vlVideo');return {paused:v.paused,t:v.currentTime,play:!document.getElementById('vlPlay').hidden,poster:/nbh-td1-poster-/.test(v.poster)};});
  await p.locator('#vlPlayBtn').tap();await sleep(1200);const after=await p.evaluate(()=>{const v=document.getElementById('vlVideo');const t=v.currentTime;v.pause();return {t,hidden:document.getElementById('vlPlay').hidden};});
  ok('J reduced motion: a tapped video shows its poster and Play and does not start; Play plays it',r.paused&&r.t<0.2&&r.play&&r.poster&&after.t>0.3&&after.hidden,{r,after});
  await ctx.close();}

 /* ---------------- K. axe-core, 320 px, text at 200% ---------------- */
 if(!AXE)console.log('NOTE K axe-core is not installed here: the WCAG rules were not run');
 else{const res={};
  for(const [mode,view] of [['normal',{}],['high contrast',{hc:true}],['low light',{dark:true}],['large text',{t:2}]]){const {ctx,p}=await mk('ipadL');await p.goto(U+'videos.html');
   await p.evaluate(v=>localStorage.setItem('nbh.view',JSON.stringify(v)),view);
   for(const [name,hash] of [['home',''],['watch','#video=dro_resetting']]){await p.goto(U+'videos.html'+hash);await p.waitForFunction(()=>window.__vl,null,{timeout:20000});await sleep(900);await p.addScriptTag({content:AXE});
    res[mode+' '+name]=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>v.id+' ('+v.nodes.length+'): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(', '));});}
   await ctx.close();}
  ok('K axe-core (WCAG 2.2 AA): no violation on the home page and a video’s page, in normal, high contrast, low light and large text',Object.values(res).every(x=>!x.length),res);}
 {const out=[];for(const [w,h,fz] of [[320,700,''],[1180,820,'200%'],[390,844,'200%']]){const {ctx,p}=await mk([w,h]);
   for(const hash of ['','#video=rird_motor']){await home(p,hash);if(fz)await p.addStyleTag({content:'html{font-size:'+fz+'!important}'});await sleep(300);
    const r=await p.evaluate(()=>({wide:document.documentElement.scrollWidth-innerWidth,t:[...document.querySelectorAll('.vl-t,#vlTitle')].filter(e=>e.scrollHeight>e.clientHeight+1).length}));if(r.wide>0||r.t)out.push([w,fz,hash,r]);}
   await ctx.close();}
  ok('K at 320 px, and with text at 200%: nothing wider than the screen, no title cut',!out.length,out);}

 /* ---------------- L. V6 Form TD-1's player ---------------- */
 const TDF=fs.readdirSync(DIR).find(f=>/^TD-1_.*\.html$/.test(f));const TDS=fs.readFileSync(path.join(DIR,TDF),'utf8');
 if(!/tvTrap|tv-trap|v25\.72 the design review's V6/.test(TDS))console.log('NOTE L Form TD-1’s player has not had V6 yet: its checks are skipped');
 else{
  const openTd=async(size)=>{const {ctx,p}=await mk(size);await p.goto(U+TDF+'#card=dro-break-after-calm-interval');await p.waitForFunction(()=>window.__tdVideo,null,{timeout:40000});await sleep(800);return {ctx,p};};
  {const {ctx,p}=await openTd('ipadL');await p.evaluate(()=>localStorage.removeItem('nbh.videos.v1'));
   await p.evaluate(()=>window.__tdVideo.play('dro_resetting'));await p.waitForFunction(()=>{const v=document.getElementById('tv-video');return v&&!v.hidden&&v.readyState>=1;},null,{timeout:40000}).catch(()=>{});
   const fx=await p.evaluate(async()=>{const v=document.getElementById('tv-video');v.muted=true;v.pause();v.currentTime=40;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));await v.play().catch(()=>{});await new Promise(r=>setTimeout(r,1300));v.pause();await new Promise(r=>setTimeout(r,200));
    const s=JSON.parse(localStorage.getItem('nbh.videos.v1')||'null');const main=document.querySelector('main')||document.body.firstElementChild;
    return {store:s&&s.items&&s.items.dro_resetting,inert:[...document.body.children].filter(e=>e.id!=='tdVideo'&&!e.contains(document.getElementById('tdVideo'))&&e.tagName!=='SCRIPT'&&e.tagName!=='STYLE').every(e=>e.inert||e.getAttribute('aria-hidden')==='true')||!!document.getElementById('tdVideo').matches(':modal'),
     lib:(document.getElementById('tv-lib')||{}).textContent||'',href:(document.getElementById('tv-lib')||{}).getAttribute&&document.getElementById('tv-lib').getAttribute('data-href')};});
   ok('L TD-1’s player: watching there is kept in the library’s progress (nbh.videos.v1: dro_resetting at '+(fx.store||{}).t+' s)',!!fx.store&&fx.store.t>=40&&fx.store.t<=45,fx);
   ok('L TD-1’s player: the page behind takes no taps; “Open in the video library”',fx.inert&&/Open in the video library/.test(fx.lib),fx);
   /* the focus stays inside */
   const trail=[];await p.focus('#tv-close');for(let i=0;i<8;i++){await p.keyboard.press('Tab');trail.push(await p.evaluate(()=>!!document.activeElement.closest('#tdVideo')));}
   await p.keyboard.press('Shift+Tab');trail.push(await p.evaluate(()=>!!document.activeElement.closest('#tdVideo')));
   ok('L TD-1’s player keeps the focus inside while it is open (Tab and Shift+Tab)',trail.every(Boolean),trail);
   await p.locator('#tv-close').click();await sleep(300);
   /* Open in the video library: that video's page (on its own the form opens the library in a tab; in the workstation the
      shell opens it at the key, as v2569-video-library-test checks) */
   await p.evaluate(()=>{window.__opened=[];window.open=u=>{window.__opened.push(u);return null;};window.__tdVideo.play('dro_class');});await sleep(800);
   await p.locator('#tv-lib').click();await sleep(300);
   const lib=await p.evaluate(()=>({opened:window.__opened,hidden:document.getElementById('tdVideo').hidden}));
   ok('L “Open in the video library” goes to that video’s own page (videos.html#video=dro_class) and closes the player',lib.opened.length===1&&lib.opened[0]==='videos.html#video=dro_class'&&lib.hidden,lib);
   const cl=await p.evaluate(()=>{const v=document.getElementById('tv-video');return {src:v?v.getAttribute('src'):null,hidden:document.getElementById('tdVideo').hidden};});
   ok('L Close lets the video go (no source left in the player)',cl.hidden&&!cl.src,cl);
   await ctx.close();
   /* the library shows it */
   const {ctx:c2,p:p2}=await mk('ipadL');await p2.goto(U+'videos.html');await p2.evaluate(s=>localStorage.setItem('nbh.videos.v1',JSON.stringify({v:1,items:{dro_resetting:s}})),fx.store);await home(p2);
   ok('L the library shows what was watched in TD-1 (Continue watching)',await p2.evaluate(()=>!!document.querySelector('#vlCont .vl-card[data-key="dro_resetting"]')));await c2.close();}
  {const {ctx,p}=await openTd('phone');await p.evaluate(()=>window.__tdVideo.play('dro_resetting'));await sleep(1500);
   const r=await p.evaluate(()=>{const box=document.querySelector('#tdVideo .tv-box').getBoundingClientRect(),hd=document.querySelector('#tdVideo .tv-hd').getBoundingClientRect(),c=document.getElementById('tv-close').getBoundingClientRect(),v=document.getElementById('tv-video').getBoundingClientRect();
    return {box:[box.width,box.height],hd:hd.height,close:[c.width,c.height],video:[Math.round(v.width),Math.round(v.height)],iw:innerWidth,ih:innerHeight};});
   ok('L TD-1’s player on a phone: the whole screen, one header row, a 44 px Close, the video '+r.video.join(' x '),r.box[0]>=r.iw-1&&r.box[1]>=r.ih-1&&r.hd<=64&&r.close[0]>=44&&r.close[1]>=44&&r.video[0]>=r.iw-1,r);
   await ctx.close();}}

 await b.close();
 ok('M no page errors',!errs.length,errs.slice(0,8));
 console.log((bad?'FAILED ':'ALL PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
