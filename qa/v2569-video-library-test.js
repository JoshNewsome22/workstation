/* v25.69 (the BCBA, 11/8: "a video layout dashboard like YouTube ... that can show all the video protocols that I have in
   the bank") the video library: videos.html, the workstation's Videos. Simulated data only: the videos are AI-generated
   with simulated people, and nothing here is about a student.
   A. the files: nbh-videos.js the one list (25 videos at v25.73: FCT 4, Choice 1, each its file, its picture, its card or cards, its length and
      functions; Form TD-1 reads it, from its copy, which tools/blocks/patch-videos.py --check finds current); each picture a
      640 x 360 JPEG under 40 KB beside the forms; the offline list (tools/pwa-sw.py) finds the page, the list and every
      picture; this test in the release list.
   B. the home page, on an iPad sideways and upright, a laptop and a phone: every card of the list with their pictures (loaded) and
      lengths, in a shelf per procedure; (v25.72, the design review's V1) 4 columns sideways, upright and on the laptop, 1
      on a phone; nothing wider than the screen (390 px too); every control 44 px; the search box 16 px.
   C. the filters (v25.72: Procedure and Function rows, Watched a menu) and the search: each procedure, each function (from
      the cards' functions), Watched and Not watched, words of a title, a study, a card; a procedure with a search; nothing
      found, and Show all videos.
   D. a video's page: the player plays it from the file beside the forms (its time moves on), with its title, its study, the
      AI label, its note and what it shows; Up next the same procedure first, then the same function; a tap there opens
      that video; All videos goes back, to the card it came from.
   E. what was watched, on this device: the second it stopped kept across a reload (Continue watching with its bar, the
      card's "Stopped at", the player starting there, Start from the beginning); a video played to its end is Watched (the
      chip, the card); localStorage holds only keys, seconds and times.
   F. the address: videos.html#video=<key> opens the video's page; an unknown key the home page.
   G. by keyboard alone: a chip, a card, the video's page (its title has the focus), Open the TD-1 card, Escape back to the
      home page with the focus on the card.
   H. in the workstation: Videos in the bar opens the library below the bar (pressed), the page behind takes no taps; Close
      and Escape put it away and the focus back on Videos; Open the TD-1 card opens Form TD-1 at the card (its bank panel);
      TD-1's Browse all videos opens the library; the bar no wider than the window; Videos 44 px tall.
   I. no page errors anywhere.
   On Chromium, and on an iPad's engine (WebKit when installed, else Chromium with an iPad's user agent and touch).
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2569-video-library-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const DIR=path.join(ROOT,'NBH-Workstation'),U=BASE+'/NBH-Workstation/';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
/* the list, as a page reads it */
const ctx0={window:{}};vm.createContext(ctx0);vm.runInContext(fs.readFileSync(path.join(DIR,'nbh-videos.js'),'utf8'),ctx0);const V=ctx0.window.NBH_VIDEOS;
const LIST=V.list,BY={};LIST.forEach(v=>{BY[v.key]=v;});
/* v25.70 the counts below are read from the list (v25.73: 25 videos, the choice video on a Choice shelf of its own), except the one check in A that names them */
const N=LIST.length,SHELVES=V.families.filter(f=>LIST.some(v=>v.family===f[0])).map(f=>f[0]+':'+LIST.filter(v=>v.family===f[0]).length).join(' ');
const mmss=s=>{s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const errs=[];
const SIZES={side:[1376,1032],up:[1032,1376],laptop:[1440,900],phone:[390,844]};

(async()=>{
 /* ---------------- A. the files ---------------- */
 {const fams={};LIST.forEach(v=>{fams[v.family]=(fams[v.family]||0)+1;});
  const wrong=LIST.filter(v=>!(fs.existsSync(path.join(DIR,v.file))&&fs.existsSync(path.join(DIR,v.poster))&&v.cards.length&&v.cards.every(id=>V.cards[id]&&V.cards[id].lab)&&v.dur>60&&v.dur<240 /* v25.82 the handwashing videos run to 3:33 (200 until then) */&&v.title&&v.note&&Array.isArray(v.fn)));
  ok('A nbh-videos.js: 37 videos (v25.91: Prompting 3 and Tokens 3 more; DRO 4, DRA 4, NCR 4, RIRD 3, high-p 5, FCT 4, Choice 1, Group 1 at v25.76, Chaining 1 at v25.77, 2 at v25.80 and 5 at v25.82, with the three handwashing videos), each its file, its picture, its cards from the bank, its length, its note',
   LIST.length===37&&fams.prompt===3&&fams.token===3&&fams.group===1&&fams.chain===5&&fams.dro===4&&fams.dra===4&&fams.ncr===4&&fams.rird===3&&fams.highp===5&&fams.fct===4&&fams.choice===1&&!wrong.length&&/^TD-1_.*\.html$/.test(V.form)&&fs.existsSync(path.join(DIR,V.form)),{fams,wrong:wrong.map(v=>v.key)});
  const fnOf=k=>BY[k].fn.join(',');
  ok('A the functions come from the cards: NCR attention attention, NCR during work escape, DRA items tangible, DRA automatic automatic, RIRD automatic, FCT escape, attention and tangible; a high-p video (cards with none) escape, as most high-p cards',
   fnOf('ncr_attention')==='attention'&&fnOf('ncr_work')==='escape'&&fnOf('dra_tangible')==='tangible'&&fnOf('dra_automatic')==='automatic'&&fnOf('rird_pica')==='automatic'&&fnOf('fct-practical-guide-thinning')==='escape,attention,tangible'&&fnOf('a_highp_peer')==='escape',LIST.map(v=>v.key+':'+fnOf(v.key)));
  const jp=LIST.map(v=>{const b=fs.readFileSync(path.join(DIR,v.poster));let w=0,h=0;for(let i=2;i<b.length-9;){if(b[i]!==0xFF){i++;continue;}const m=b[i+1];if(m>=0xC0&&m<=0xC3){h=b.readUInt16BE(i+5);w=b.readUInt16BE(i+7);break;}i+=2+b.readUInt16BE(i+2);}
   return {f:v.poster,jpg:b[0]===0xFF&&b[1]===0xD8,w,h,kb:b.length/1024};});
  ok('A each picture a JPEG of 640 x 360, under 40 KB, beside the forms (nbh-td1-poster-<the video file>.jpg)',jp.every(x=>x.jpg&&x.w===640&&x.h===360&&x.kb<40)&&LIST.every(v=>v.poster===v.file.replace('nbh-td1-video-','nbh-td1-poster-').replace(/\.js$/,'.jpg')),jp.filter(x=>!(x.jpg&&x.w===640&&x.h===360&&x.kb<40)));
  const pv=spawnSync('python3',[path.join(ROOT,'tools','blocks','patch-videos.py'),'--check',DIR],{encoding:'utf8'});
  const td=fs.readFileSync(path.join(DIR,V.form),'utf8');
  ok('A Form TD-1 reads the list from its copy (<script id="nbh-videos">, before its video script), which patch-videos.py --check finds current; no copy of the list by hand',
   pv.status===0&&td.indexOf('<script id="nbh-videos">')>0&&td.indexOf('<script id="nbh-videos">')<td.indexOf('<script id="td1-video">')&&/const VIDS=\{\};\(\(window\.NBH_VIDEOS/.test(td)&&!/dro_resetting:pv\(/.test(td),(pv.stdout+pv.stderr).trim());
  const py='import importlib.util,json,sys\nsp=importlib.util.spec_from_file_location("pw",sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)\nprint(json.dumps(m.files_of(sys.argv[2])))';
  const fl=spawnSync('python3',['-c',py,path.join(ROOT,'tools','pwa-sw.py'),DIR],{encoding:'utf8'});let files=[];try{files=JSON.parse(fl.stdout);}catch(e){}
  const need=['videos.html','nbh-videos.js',...LIST.map(v=>v.poster),...LIST.map(v=>v.file)];
  ok('A the offline list (tools/pwa-sw.py) holds the library, the list, every picture and every video',need.every(f=>files.includes(f)),need.filter(f=>!files.includes(f)).concat([fl.stderr.slice(0,300)]));
  const rl=fs.readFileSync(path.join(ROOT,'qa','release-list.txt'),'utf8'),pt=fs.readFileSync(path.join(ROOT,'qa','pwa-test.js'),'utf8');
  ok('A the release list runs this test; pwa-test expects the library, the list and the pictures',/^v2569-video-library-test$/m.test(rl)&&/'videos\.html','nbh-videos\.js'/.test(pt)&&/nbh-td1-poster-/.test(pt));
  const vh=fs.readFileSync(path.join(DIR,'videos.html'),'utf8');
  ok('A videos.html: one </head>, </body> and </html>, ends with </html>, names no practice (the school edition copies it as it is)',[/<\/head>/gi,/<\/body>/gi,/<\/html>/gi].every(r=>(vh.match(r)||[]).length===1)&&/<\/html>\s*$/.test(vh)&&!/Newsome/i.test(vh)&&!/Newsome/i.test(fs.readFileSync(path.join(DIR,'nbh-videos.js'),'utf8')));}

 for(const engine of ['chromium','ipad']){
  const b=engine==='chromium'?await pw.chromium.launch():await L.ipadBrowser(pw);const E=engine==='chromium'?'Chromium':'iPad ('+b._nbhEngine+')';
  const mk=async(size,opt)=>{const [w,h]=SIZES[size];const ctx=engine==='chromium'&&size!=='phone'?await b.newContext({viewport:{width:w,height:h}}):await L.ipadCtx(b,{viewport:{width:w,height:h}});
   const p=await ctx.newPage();p.on('pageerror',e=>errs.push(E+' '+size+': '+String(e.message||e)));p.on('dialog',d=>d.accept().catch(()=>{}));return {ctx,p};};
  const tap=async(p,sel)=>{const l=p.locator(sel).first();if(engine==='ipad')await l.tap();else await l.click();};
  const home=async(p,hash)=>{await p.goto(U+'videos.html'+(hash||''));await p.waitForFunction(()=>window.__vl&&document.querySelectorAll('.vl-card').length>0||document.getElementById('vlTitle'),null,{timeout:20000});await sleep(300);};
  const imgsLoaded=p=>p.waitForFunction(()=>[...document.querySelectorAll('#vlList .vl-card img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:20000}).then(()=>true,()=>false);

  /* ---------------- B. the home page ---------------- */
  for(const size of ['side','up','laptop','phone']){const {ctx,p}=await mk(size);await home(p);
   const loaded=await imgsLoaded(p);
   const r=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#vlList .vl-card')];const grid=document.querySelector('#vlList .vl-grid');
    const cols=grid?getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length:0;
    const small=[...document.querySelectorAll('button,a[href],input,[tabindex="0"]')].filter(e=>e.offsetParent!==null&&!e.classList.contains('vl-skip')).map(e=>{const r=e.getBoundingClientRect();return {e:e.id||e.className||e.tagName,w:Math.round(r.width),h:Math.round(r.height)};}).filter(x=>x.h<44||x.w<44);
    return {n:cards.length,keys:cards.map(c=>c.dataset.key),dur:cards.map(c=>[c.dataset.key,(c.querySelector('.vl-dur')||{}).textContent||'']),title:cards.every(c=>(c.querySelector('.vl-t')||{}).textContent),
     poster:cards.every(c=>{const i=c.querySelector('img');return i&&/nbh-td1-poster-/.test(i.getAttribute('src'));}),
     shelves:[...document.querySelectorAll('#vlList .vl-fam')].map(s=>s.dataset.fam+':'+s.querySelectorAll('.vl-card').length).join(' '),cols,
     fct:[...document.querySelectorAll('#vlList .vl-fam[data-fam="fct"] .vl-card')].map(c=>c.dataset.key).join(' '),
     wide:document.documentElement.scrollWidth-innerWidth,small,q:getComputedStyle(document.getElementById('vlQ')).fontSize,meta:(cards[0].querySelector('.vl-m')||{}).textContent};});
   const want=size==='phone'?1:4;
   ok('B '+E+' '+size+': all '+N+' cards with their pictures loaded, titles and lengths ('+r.dur.slice(0,2).map(x=>x[1]).join(', ')+'…), a shelf per procedure (FCT’s four on its shelf), '+want+' column'+(want>1?'s':'')+', nothing wider than the screen',
    r.n===N&&new Set(r.keys).size===N&&loaded&&r.poster&&r.title&&r.dur.every(([k,d])=>d===mmss(BY[k].dur))&&r.shelves===SHELVES&&r.fct==='fct-practical-guide-thinning fct_attention fct_tangible fct_thinning_mult'&&r.cols===want&&r.wide<=0&&/^Kodak et al\. \(2003\)/.test(r.meta)&&!/· DRO/.test(r.meta),r);
   ok('B '+E+' '+size+': every control 44 px or more, the search box 16 px',!r.small.length&&r.q==='16px',r.small.slice(0,6).concat([r.q]));
   await ctx.close();}

  /* ---------------- C. the chips and the search ---------------- */
  {const {ctx,p}=await mk('side');await home(p);
   const shown=()=>p.evaluate(()=>[...document.querySelectorAll('#vlList .vl-card')].map(c=>c.dataset.key).sort().join(' '));
   const exp=f=>LIST.filter(f).map(v=>v.key).sort().join(' ');
   const chips=await p.evaluate(()=>[...document.querySelectorAll('#vlFilt .vl-chip')].map(c=>c.dataset.chip).concat([...document.getElementById('vlSeen').options].map(o=>'seen:'+o.value)));
   ok('C '+E+' the filters: Procedure (Any, DRO, DRA, NCR, RIRD, High-p, FCT, Choice, Group, Chain, Prompting, Tokens), Function (Any, Attention, Escape, Tangible, Automatic), Watched (All, Watched, Not watched)',chips.join(' ')==='fam:any fam:dro fam:dra fam:ncr fam:rird fam:highp fam:fct fam:choice fam:group fam:chain fam:prompt fam:token fn:any fn:attention fn:escape fn:tangible fn:automatic seen:all seen:seen seen:unseen',chips);
   const wrong=[];
   for(const c of chips.filter(c=>!/:any$|^seen:all$/.test(c))){if(c.startsWith('seen:'))await p.selectOption('#vlSeen',c.slice(5));else await tap(p,'#vlFilt [data-chip="'+c+'"]');await sleep(120);const got=await shown();
    const e=c.startsWith('fam:')?exp(v=>v.family===c.slice(4)):c.startsWith('fn:')?exp(v=>v.fn.includes(c.slice(3))):c==='seen:seen'?'':exp(()=>true);
    const pressed=c.startsWith('seen:')?String(await p.inputValue('#vlSeen')===c.slice(5)):await p.evaluate(c=>document.querySelector('#vlFilt [data-chip="'+c+'"]').getAttribute('aria-checked'),c);
    if(got!==e||pressed!=='true')wrong.push([c,got,e,pressed]);
    if(c.startsWith('seen:'))await p.selectOption('#vlSeen','all');else await tap(p,'#vlFilt [data-chip="'+c.split(':')[0]+':any"]');await sleep(80);}
   ok('C '+E+' each choice shows its videos (a procedure, a function from the cards, Watched none yet, Not watched all) and is chosen',!wrong.length,wrong);
   const search=async t=>{await p.fill('#vlQ',t);await sleep(300);return shown();};
   const s1=await search('pica'),s2=await search('Kodak'),s3=await search('peer'),s4=await search('momentary'),s5=await search('zzz no such');
   const none=await p.evaluate(()=>({t:(document.querySelector('.vl-none')||{}).textContent||'',c:document.getElementById('vlCount').textContent}));
   ok('C '+E+' the search: a word of a title (pica), a study (Kodak), a card’s words (peer), words of several (momentary); nothing found says so',
    s1==='rird_pica'&&s2==='dro_resetting'&&s3==='a_highp_peer'&&s4.split(' ').includes('dro_momentary')&&s4.split(' ').includes('dro_class')&&s5===''&&/No video matches “zzz no such”/.test(none.t)&&new RegExp('^0 of '+N+' videos').test(none.c),{s1,s2,s3,s4,none});
   await tap(p,'.vl-none [data-set="all"]');await sleep(200);
   ok('C '+E+' Show all videos clears the search and the filters',await shown()===exp(()=>true)&&await p.inputValue('#vlQ')==='');
   await p.fill('#vlQ','transition');await sleep(250);await tap(p,'#vlChips [data-chip="fam:highp"]');await sleep(150);
   ok('C '+E+' a procedure with a search: High-p and “transition”',await shown()==='a_highp_class',await shown());
   await p.fill('#vlQ','');await tap(p,'#vlChips [data-chip="fam:any"]');await sleep(150);
   await tap(p,'#vlList .vl-fam[data-fam="ncr"] [data-set="fam:ncr"]');await sleep(150);
   ok('C '+E+' a shelf’s Only button chooses its procedure',await shown()===exp(v=>v.family==='ncr')&&await p.evaluate(()=>document.querySelector('#vlChips [data-chip="fam:ncr"]').getAttribute('aria-checked'))==='true');
   await ctx.close();}

  /* ---------------- D. a video's page ---------------- */
  {const {ctx,p}=await mk('side');await home(p);await sleep(200);
   await tap(p,'#vlList .vl-card[data-key="ncr_items"]');
   await p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&/^blob:/.test(v.src)&&v.readyState>=1;},null,{timeout:30000}).catch(()=>{});
   const w=await p.evaluate(()=>({view:__vl.view(),key:__vl.key(),hash:location.hash,title:(document.getElementById('vlTitle')||{}).textContent,meta:(document.querySelector('.vl-wm')||{}).textContent,
     note:(document.querySelector('.vl-note')||{}).textContent,src:(document.getElementById('vlVideo')||{}).src||'',dur:(document.getElementById('vlVideo')||{}).duration,
     opens:[...document.querySelectorAll('.vl-open')].map(b=>b.dataset.card),next:[...document.querySelectorAll('.vl-next .vl-ni')].map(a=>a.dataset.key),
     heads:[...document.querySelectorAll('.vl-next h3:not(#vlStepsH)')].map(h=>h.textContent),home:document.getElementById('vlHome').hidden,back:!document.getElementById('vlBack').hidden,
     wide:document.documentElement.scrollWidth-innerWidth,tracks:document.querySelectorAll('#vlVideo track').length}));
   const v=BY.ncr_items;
   ok('D '+E+' a card opens its page (#video=ncr_items): the title, After its studies, the length, the AI label, its note; the home page hidden, All videos shown',
    w.view==='watch'&&w.key==='ncr_items'&&w.hash==='#video=ncr_items'&&w.title===v.title&&w.meta.includes('After '+v.after)&&w.meta.includes(mmss(v.dur))&&/AI-generated · simulated people/.test(w.meta)&&w.note.startsWith(v.note)&&w.home&&w.back&&w.wide<=0,w);
   ok('D '+E+' the player has the video from the file beside the forms ('+v.file+'), its full length',/^blob:/.test(w.src)&&Math.abs(w.dur-v.dur)<1.5,{src:w.src.slice(0,30),dur:w.dur});
   const t=await p.evaluate(async()=>{const x=document.getElementById('vlVideo');x.muted=true;try{await x.play();}catch(e){return {err:String(e)};}const a=x.currentTime;await new Promise(r=>setTimeout(r,1800));const b=x.currentTime;x.pause();return {a,b,paused:x.paused};});
   ok('D '+E+' it plays: the time moves on',t.b>t.a+0.5,t);
   const fam=LIST.filter(x=>x.family==='ncr'&&x.key!=='ncr_items').map(x=>x.key),fn=LIST.filter(x=>x.family!=='ncr'&&x.fn.some(f=>v.fn.includes(f))).map(x=>x.key);
   ok('D '+E+' Up next: the other NCR videos first, then those for the same functions (attention, tangible)',w.next.join(' ')===fam.concat(fn).join(' ')&&w.heads[0]==='More NCR'&&/^Also for attention, tangible$/.test(w.heads[1]),{next:w.next,want:fam.concat(fn),heads:w.heads});
   ok('D '+E+' Open the TD-1 card, one for each card it was made from',w.opens.join(' ')===v.cards.join(' '),w.opens);
   await tap(p,'.vl-next .vl-ni[data-key="ncr_work"]');await sleep(500);
   ok('D '+E+' a tap in Up next opens that video',await p.evaluate(()=>__vl.key()==='ncr_work'&&location.hash==='#video=ncr_work'&&document.getElementById('vlTitle').textContent.startsWith('NCR during work')));
   await tap(p,'#vlBack');await p.waitForFunction(()=>__vl.view()==='home',null,{timeout:5000}).catch(()=>{});await sleep(300);
   ok('D '+E+' All videos goes back to the home page (one step back, whatever was opened from Up next)',await p.evaluate(()=>__vl.view()==='home'&&(location.hash===''||location.hash==='#')&&!document.getElementById('vlHome').hidden));
   const ph=await mk('phone');await home(ph.p,'#video=rird_vocal');await sleep(500);
   const pw2=await ph.p.evaluate(()=>({wide:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('button,a[href],input')].filter(e=>e.offsetParent!==null&&!e.classList.contains('vl-skip')).map(e=>{const r=e.getBoundingClientRect();return {e:e.id||e.className,h:Math.round(r.height),w:Math.round(r.width)};}).filter(x=>x.h<44||x.w<44)}));
   ok('D '+E+' a video’s page on a phone (390 px): nothing wider than the screen, every control 44 px',pw2.wide<=0&&!pw2.small.length,pw2);
   await ph.ctx.close();
   await ctx.close();}

  /* ---------------- E. what was watched, kept on this device ---------------- */
  {const {ctx,p}=await mk('side');await home(p,'#video=dro_tokens');
   await p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&v.readyState>=1;},null,{timeout:30000}).catch(()=>{});
   await p.evaluate(async()=>{const x=document.getElementById('vlVideo');x.muted=true;x.currentTime=30;await new Promise(r=>x.addEventListener('seeked',r,{once:true}));await x.play().catch(()=>{});await new Promise(r=>setTimeout(r,1200));x.pause();});
   await sleep(300);
   const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('nbh.videos.v1')||'null'));
   const it=st&&st.items&&st.items.dro_tokens;
   ok('E '+E+' the second it stopped is kept (nbh.videos.v1: the key, the second, the length, when; nothing else)',!!it&&it.t>=30&&it.t<=34&&Math.abs(it.d-BY.dro_tokens.dur)<=1&&!it.w&&Object.keys(st.items).every(k=>!!BY[k])&&Object.keys(it).sort().join()==='at,d,t,w',st);
   await p.goto(U+'videos.html');await p.waitForSelector('.vl-card');await sleep(300);
   const c=await p.evaluate(()=>{const s=document.getElementById('vlCont');if(!s)return null;const c=s.querySelector('.vl-card');const bar=c&&c.querySelector('.vl-pbar i');
    return {keys:[...s.querySelectorAll('.vl-card')].map(x=>x.dataset.key),bar:bar?parseFloat(bar.style.width):0,st:(document.querySelector('#vlList .vl-fam .vl-card[data-key="dro_tokens"] .vl-st')||{}).textContent,first:document.querySelector('#vlList section').id};});
   ok('E '+E+' after a reload: Continue watching first, with the video and its bar (about 29%), the card “Stopped at 0:3x”',!!c&&c.first==='vlCont'&&c.keys.join()==='dro_tokens'&&c.bar>20&&c.bar<40&&/^Stopped at 0:3\d$/.test(c.st),c);
   await tap(p,'#vlCont .vl-card');
   await p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&v.readyState>=1&&v.currentTime>20;},null,{timeout:30000}).catch(()=>{});
   const r=await p.evaluate(()=>({t:document.getElementById('vlVideo').currentTime,note:document.getElementById('vlResume').hidden?'':document.getElementById('vlResumeT').textContent}));
   ok('E '+E+' the player starts where it stopped, and says so',r.t>=29&&r.t<=36&&/Picks up where it stopped on this device, at 0:3\d\./.test(r.note),r);
   await tap(p,'#vlRestart');await sleep(400);
   ok('E '+E+' Start from the beginning',await p.evaluate(()=>document.getElementById('vlVideo').currentTime<3&&document.getElementById('vlResume').hidden));
   /* to its end: Watched */
   await p.evaluate(async()=>{const x=document.getElementById('vlVideo');x.muted=true;x.pause();x.currentTime=x.duration-0.6;await new Promise(r=>x.addEventListener('seeked',r,{once:true}));await x.play().catch(()=>{});await new Promise(r=>{x.addEventListener('ended',r,{once:true});setTimeout(r,5000);});});
   await sleep(300);await p.goto(U+'videos.html');await p.waitForSelector('.vl-card');await sleep(300);
   const wd=await p.evaluate(()=>({cont:!!document.getElementById('vlCont'),badge:!!document.querySelector('#vlList .vl-card[data-key="dro_tokens"] .vl-seen'),st:(document.querySelector('#vlList .vl-card[data-key="dro_tokens"] .vl-st')||{}).textContent}));
   await p.selectOption('#vlSeen','seen');await sleep(150);const seen=await p.evaluate(()=>[...document.querySelectorAll('#vlList .vl-card')].map(c=>c.dataset.key).join());
   await p.selectOption('#vlSeen','unseen');await sleep(150);const unseen=await p.evaluate(()=>document.querySelectorAll('#vlList .vl-card').length);
   ok('E '+E+' played to its end: Watched (the card’s mark and words, Watched in the menu), not in Continue watching; Not watched the other '+(N-1),!wd.cont&&wd.badge&&wd.st==='Watched'&&seen==='dro_tokens'&&unseen===N-1,{wd,seen,unseen});
   await ctx.close();}

  /* ---------------- F. the address ---------------- */
  {const {ctx,p}=await mk('up');await home(p,'#video=a_highp_class');await sleep(300);
   const a=await p.evaluate(()=>({k:__vl.key(),t:document.getElementById('vlTitle').textContent,title:document.title}));
   await p.goto(U+'videos.html#video=nope');await sleep(800);const b2=await p.evaluate(()=>({v:__vl.view(),n:document.querySelectorAll('#vlList .vl-card').length}));
   ok('F '+E+' videos.html#video=<key> opens the video’s page; an unknown key the home page',a.k==='a_highp_class'&&a.t===BY.a_highp_class.title&&/^High-probability instructions/.test(a.title)&&b2.v==='home'&&b2.n===N,{a,b2});
   /* on its own, Open the TD-1 card goes to the form at the card */
   await p.goto(U+'videos.html#video=rird_pica');await sleep(500);await tap(p,'.vl-open[data-card="rird-pica-block-redirect-food"]');
   await p.waitForURL(/TD-1_.*#card=rird-pica-block-redirect-food$/,{timeout:15000}).catch(()=>{});
   await p.waitForFunction(()=>{const h=document.getElementById('tdBankHost');const d=h&&h.shadowRoot&&h.shadowRoot.querySelector('.detail');return d&&/redirect the student to a freely available preferred food/i.test(d.textContent);},null,{timeout:40000}).catch(()=>{});
   const td=await p.evaluate(()=>{const h=document.getElementById('tdBankHost');const d=h&&h.shadowRoot&&h.shadowRoot.querySelector('.detail');return {url:location.href.replace(/.*\//,''),detail:d?d.textContent.slice(0,200):'',build:(document.querySelector('#viewSeg button[data-view="build"]')||{}).getAttribute&&document.querySelector('#viewSeg button[data-view="build"]').getAttribute('aria-pressed')};});
   ok('F '+E+' on its own, Open the TD-1 card opens Form TD-1 at #card=<id>: Build components, the bank panel at the card',/#card=rird-pica-block-redirect-food$/.test(td.url)&&/preferred food/i.test(td.detail)&&td.build==='true',td);
   await ctx.close();}

  /* ---------------- G. accessibility rules (axe-core, when it is installed: npm install in qa, or NODE_PATH) ---------------- */
  if(engine==='chromium'){let AXE=null;try{AXE=fs.readFileSync(require.resolve('axe-core/axe.min.js',{paths:[__dirname,path.join(__dirname,'node_modules')].concat((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean))}),'utf8');}catch(e){}
   if(!AXE)console.log('NOTE G axe-core is not installed here: the WCAG rules were not run');
   else{const {ctx,p}=await mk('side');const res={};
    for(const [name,hash] of [['home',''],['watch','#video=ncr_between']]){await home(p,hash);await sleep(700);await p.addScriptTag({content:AXE});
     res[name]=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>v.id+' ('+v.nodes.length+'): '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(', '));});}
    ok('G Chromium axe-core, WCAG 2.1 A and AA: no serious or critical issue on the home page or a video’s page',!res.home.length&&!res.watch.length,res);await ctx.close();}}

  /* ---------------- G. by keyboard alone ---------------- */
  if(engine==='chromium'){const {ctx,p}=await mk('laptop');await home(p);
   const focus=()=>p.evaluate(()=>{const a=document.activeElement;return {id:a.id,cls:a.className,chip:a.dataset&&a.dataset.chip,key:a.dataset&&a.dataset.key,card:a.dataset&&a.dataset.card};});
   /* v25.72 (V10) a filter row is one Tab stop, the arrow keys inside it */
   let f,guard=0;do{await p.keyboard.press('Tab');f=await focus();}while(f.chip!=='fam:any'&&++guard<20);
   for(let i=0;i<4;i++){await p.keyboard.press('ArrowRight');await sleep(120);}const c1=await p.evaluate(()=>({n:document.querySelectorAll('#vlList .vl-card').length,chip:__vl.chip(),focus:document.activeElement.dataset.chip}));
   guard=0;do{await p.keyboard.press('Tab');f=await focus();}while(!f.key&&++guard<30);
   const cardKey=f.key;await p.keyboard.press('Enter');await p.waitForFunction(()=>__vl.view()==='watch',null,{timeout:5000}).catch(()=>{});await sleep(400);
   const f2=await focus();
   guard=0;do{await p.keyboard.press('Tab');f=await focus();}while(!f.card&&++guard<40);
   const openCard=f.card;
   await p.keyboard.press('Escape');await p.waitForFunction(()=>__vl.view()==='home',null,{timeout:5000}).catch(()=>{});await sleep(300);const f3=await focus();
   ok('G Chromium by keyboard: Tab to the Procedure row, the arrows to RIRD (3 videos, RIRD keeps the focus); Tab to a card, Enter (its page, the title has the focus); Tab to Open the TD-1 card; Escape back home, the focus on that card',
    c1.n===3&&c1.chip==='fam:rird'&&c1.focus==='fam:rird'&&cardKey==='rird_vocal'&&f2.id==='vlTitle'&&openCard==='rird-vocal-stereotypy-demands'&&f3.key===cardKey,{c1,cardKey,f2,openCard,f3});
   await ctx.close();}

  /* ---------------- H. in the workstation ---------------- */
  {const {ctx,p}=await mk('side');await p.goto(U+'index.html');await p.waitForSelector('#wsVideos',{timeout:30000});await sleep(1200);
   const nb=await p.evaluate(()=>{const b=document.getElementById('wsVideos'),n=document.getElementById('wsNav'),r=b.getBoundingClientRect();return {h:Math.round(r.height),w:Math.round(r.width),txt:b.textContent.trim(),pressed:b.getAttribute('aria-pressed'),over:n.scrollWidth-n.clientWidth,after:(b.previousElementSibling&&b.previousElementSibling.previousElementSibling||{}).id};});
   ok('H '+E+' Videos in the workstation’s bar, after Documents, 44 px tall, the bar no wider than the window',nb.txt==='Videos'&&nb.h>=44&&nb.w>=44&&nb.over<=0&&nb.after==='readDoc'&&nb.pressed==='false',nb);
   await tap(p,'#wsVideos');
   const fr=await p.waitForFunction(N=>{const f=document.querySelector('#vlLayer iframe');return f&&f.contentWindow.__vl&&f.contentDocument.querySelectorAll('.vl-card').length===N;},N,{timeout:20000}).then(()=>true,()=>false);
   const lay=await p.evaluate(()=>{const L=document.getElementById('vlLayer'),r=L.getBoundingClientRect(),n=document.getElementById('wsNav').getBoundingClientRect(),f=L.querySelector('iframe').contentDocument;
    return {shown:!L.hidden,top:Math.round(r.top),navBottom:Math.round(n.bottom),h:Math.round(r.height),pressed:document.getElementById('wsVideos').getAttribute('aria-pressed'),main:document.querySelector('main').inert,close:!f.getElementById('vlClose').hidden,
     framed:f.documentElement.classList.contains('nbh-framed'),wide:f.documentElement.scrollWidth-f.defaultView.innerWidth};});
   ok('H '+E+' Videos opens the library below the bar (pressed), the page behind takes no taps, the library has Close',fr&&lay.shown&&lay.top===lay.navBottom&&lay.h>500&&lay.pressed==='true'&&lay.main===true&&lay.close&&lay.framed&&lay.wide<=0,lay);
   const F=()=>p.frameLocator('#vlLayer iframe');
   await (engine==='ipad'?F().locator('#vlClose').tap():F().locator('#vlClose').click());await sleep(300);
   const cl=await p.evaluate(()=>({shown:!document.getElementById('vlLayer').hidden,pressed:document.getElementById('wsVideos').getAttribute('aria-pressed'),main:document.querySelector('main').inert,focus:document.activeElement.id}));
   ok('H '+E+' Close puts it away: the page takes taps again, the focus back on Videos',!cl.shown&&cl.pressed==='false'&&!cl.main&&cl.focus==='wsVideos',cl);
   await tap(p,'#wsVideos');await sleep(500);await p.keyboard.press('Escape');await sleep(300);
   ok('H '+E+' Escape in the library puts it away too',await p.evaluate(()=>document.getElementById('vlLayer').hidden&&document.activeElement.id==='wsVideos'));
   /* a card: Form TD-1 at the card */
   await p.evaluate(()=>window.__wsVideos.open('dro_class'));await sleep(400);
   await p.waitForFunction(()=>{const f=document.querySelector('#vlLayer iframe');return f&&f.contentWindow.__vl&&f.contentWindow.__vl.key()==='dro_class';},null,{timeout:10000}).catch(()=>{});
   await (engine==='ipad'?F().locator('.vl-open[data-card="dro-whole-then-momentary"]').tap():F().locator('.vl-open[data-card="dro-whole-then-momentary"]').click());
   await p.waitForFunction(()=>{const f=state.frames['TD-1'];if(!f||state.cur!=='TD-1')return false;try{const h=f.contentDocument.getElementById('tdBankHost');const d=h&&h.shadowRoot&&h.shadowRoot.querySelector('.detail');return d&&/then momentary DRO to maintain/i.test(d.textContent);}catch(e){return false;}},null,{timeout:60000}).catch(()=>{});
   const tdr=await p.evaluate(()=>{const f=state.frames['TD-1'];let d='',hash='',build='';try{hash=f.contentWindow.location.hash;const h=f.contentDocument.getElementById('tdBankHost');d=h.shadowRoot.querySelector('.detail').textContent.slice(0,160);build=f.contentDocument.querySelector('#viewSeg button[data-view="build"]').getAttribute('aria-pressed');}catch(e){}
    return {cur:state.cur,hash,d,build,layer:!document.getElementById('vlLayer').hidden};});
   ok('H '+E+' Open the TD-1 card: the library steps aside, Form TD-1 opens at the card (Build components, its bank panel)',tdr.cur==='TD-1'&&tdr.hash==='#card=dro-whole-then-momentary'&&/then momentary/i.test(tdr.d)&&tdr.build==='true'&&!tdr.layer,tdr);
   /* TD-1's Browse all videos */
   const tf=p.frameLocator('iframe[src*="TD-1_"]');
   await p.evaluate(()=>{const f=state.frames['TD-1'];f.contentWindow.__tdVideo.play('dro_class');});await sleep(600);
   await (engine==='ipad'?tf.locator('#tv-lib').tap():tf.locator('#tv-lib').click());await sleep(800);
   const br=await p.evaluate(()=>({shown:!document.getElementById('vlLayer').hidden,dlg:state.frames['TD-1'].contentDocument.getElementById('tdVideo').hidden,v:document.querySelector('#vlLayer iframe').contentWindow.__vl.view()}));
   ok('H '+E+' TD-1’s player: Browse all videos closes it and opens the library',br.shown&&br.dlg===true,br);
   /* a form opened puts it away */
   await p.evaluate(()=>openForm('DM-1'));await sleep(500);
   ok('H '+E+' a form opened from the list puts the library away',await p.evaluate(()=>document.getElementById('vlLayer').hidden&&state.cur==='DM-1'));
   await ctx.close();}
  /* a window narrower than the 13-inch iPad upright: Videos is in Tools (the bar keeps its places their room) */
  if(engine==='chromium'){const c5=await b.newContext({viewport:{width:1024,height:768}});const p=await c5.newPage();p.on('pageerror',e=>errs.push(E+' 1024: '+String(e.message||e)));
   await p.goto(U+'index.html');await p.waitForSelector('#wsNav');await sleep(1200);
   const inBar=await p.evaluate(()=>{const b=document.getElementById('wsVideos');return b.getClientRects().length>0;});
   const moved=await L.navTap(p,'#wsVideos',false);await sleep(800);
   const r=await p.evaluate(()=>({shown:!document.getElementById('vlLayer').hidden,small:[...document.querySelectorAll('#wsNav button')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.height<43.5||r.width<43.5);}).map(b=>b.id)}));
   ok('H Chromium 1024 x 768: Videos is not in the bar but in Tools, and opens the library from there; every place in the bar keeps 44 px',!inBar&&moved&&r.shown&&!r.small.length,{inBar,moved,r});
   await c5.close();}
  await b.close();}

 /* ---------------- I. no page errors ---------------- */
 ok('I no page errors',!errs.length,errs.slice(0,8));
 console.log((bad?'FAILED ':'ALL PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
