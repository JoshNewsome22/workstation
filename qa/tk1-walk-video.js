/* Form TK-1, the Walkthrough view (v21.43): render the narrated walkthrough to an MP4, frame by frame (deterministic).
   The form is loaded with the simulator book, the book's options are set with the form's own controls (the last token,
   the number of tokens), the Walkthrough view is opened and built, and the stage alone (captions burned in, no controls)
   is drawn at 1920 x 1080: the stage is 1280 x 720 logical, shown unscaled in a 1280 x 720 viewport at a device scale
   factor of 1.5, so everything is drawn at full resolution. For every frame i the timeline is set with
   TKWALK.renderAt(i/fps) and the stage is captured as a JPEG, piped to ffmpeg (image2pipe) and encoded H.264 (libx264,
   yuv420p, crf 20, preset medium, BT.709 and tagged so, a key frame every 5 s; mpeg4 at high quality when libx264 is
   missing). Meanwhile tools/forms/TK-1/make-walk-video.py lays every narration line at its cue start in one 24 kHz mono
   track (the form's own clips; voiced again at full bandwidth where the narration voice is set up and gives the very same
   take), then muxes it (AAC 96 kbit/s, +faststart, the seven chapters as chapter marks) and checks the result (length,
   size, frame rate, frame count, colour tags, audio, the audio rising at every cue start where the clip puts it, no
   shift, loudness, determinism, frames at five cue midpoints and a contact sheet of every cue, saved beside each other).
   usage: node qa/tk1-walk-video.js [--term none|ring|pic] [--n 5] [--out file.mp4] [--frames dir] [--fps 30] [--quality 92]
                                    [--crf 20] [--keep] [--no-tts] [--loudness -16|off] [--preview t1,t2,..] [--check]
          node qa/tk1-walk-video.js --both [--dir folder] [--n 5] ...   (both videos at once: TK-1-Walkthrough.mp4, term
                                    none, and TK-1-Walkthrough_terminal-token.mp4, term pic; default folder $S/dist)
          --check: no rendering; only verify the --out video already made against this book's timeline
          --preview: only save the frames at those times (s), as JPEG, in the --frames folder, and stop
          --frames: where the check frames go (default $S/tk1-walk-video-frames/<name of the video>)
   env:   S       the scratch folder: the temporary files (removed afterwards unless --keep), the narration voice ($S/tts,
                  as make-narration.py uses it) and its cache ($S/tk1-walk-tts-cache); default the system temp folder
          TK1_PY  the Python with numpy, soundfile and imageio-ffmpeg (default $S/tts/venv/bin/python, else python3)
          TK1_TTS the narration voice folder (default $S/tts) */
const {chromium,fs,path,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn,execFileSync}=require('child_process');const os=require('os');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
const A={term:'none',n:5,out:'',dir:'',frames:'',fps:30,quality:92,crf:20,keep:false,'no-tts':false,loudness:'-16',preview:'',check:false,both:false};
const av=process.argv.slice(2);
for(let i=0;i<av.length;i++){const k=av[i].replace(/^--/,'');if(!(k in A)||!/^--/.test(av[i])){console.error('unknown option '+av[i]);process.exit(2);}
  if(typeof A[k]==='boolean')A[k]=true;else{const v=av[++i];if(v==null){console.error('--'+k+' needs a value');process.exit(2);}A[k]=typeof A[k]==='number'?+v:v;}}
if(!['none','ring','pic'].includes(A.term)){console.error('--term is none, ring or pic');process.exit(2);}
if(!(A.n>=3&&A.n<=10&&A.n===Math.round(A.n))){console.error('--n is 3 to 10');process.exit(2);}
const SCR=process.env.S||os.tmpdir();
const nameOf=(term,n)=>'TK-1-Walkthrough'+(term==='none'?'':'_terminal-'+(term==='pic'?'token':term))+(n===5?'':'_'+n+'-tokens')+'.mp4';

/* --both: the two videos at once, each in its own process (the narration cache is shared and each line voiced once) */
if(A.both){const dir=path.resolve(A.dir||(process.env.S?path.join(process.env.S,'dist'):path.join(__dirname,'out','tk1-walk-video')));fs.mkdirSync(dir,{recursive:true});
  const pass=[];for(const k of ['n','fps','quality','crf','loudness'])pass.push('--'+k,String(A[k]));for(const k of ['keep','no-tts'])if(A[k])pass.push('--'+k);
  const jobs=[['pic','terminal'],['none','plain']].map(([term,tag])=>new Promise(res=>{
    const out=path.join(dir,nameOf(term,A.n));const ch=spawn(process.execPath,[__filename,'--term',term,'--out',out,...pass],{stdio:['ignore','pipe','pipe']});
    const pre=s=>s.toString().split('\n').filter(Boolean).forEach(l=>console.log('['+tag+'] '+l));ch.stdout.on('data',pre);ch.stderr.on('data',pre);
    ch.on('close',c=>res({term,out,code:c}));}));
  Promise.all(jobs).then(r=>{r.forEach(x=>console.log((x.code===0?'OK   ':'FAIL ')+x.out));process.exit(r.every(x=>x.code===0)?0:1);});
  return;}

if(!A.out)A.out=path.join(__dirname,'out','tk1-walk-video',nameOf(A.term,A.n));
A.out=path.resolve(A.out);fs.mkdirSync(path.dirname(A.out),{recursive:true});
if(!A.frames)A.frames=path.join(SCR,'tk1-walk-video-frames',path.basename(A.out,'.mp4'));
const PY=process.env.TK1_PY||[path.join(SCR,'tts','venv','bin','python')].find(p=>fs.existsSync(p))||'python3';
const TTS=process.env.TK1_TTS||path.join(SCR,'tts');
const CACHE=process.env.TK1_TTS_CACHE||path.join(SCR,'tk1-walk-tts-cache');
const HELPER=path.join(__dirname,'..','tools','forms','TK-1','make-walk-video.py');
const FF=execFileSync(PY,['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const hasX264=/\blibx264\b/.test(execFileSync(FF,['-hide_banner','-encoders'],{stdio:['ignore','pipe','ignore']}).toString());
const TMP=fs.mkdtempSync(path.join(SCR,'tk1-walk-video-'));
const W=1280,H=720,DSF=1.5;
/* the stage alone, unscaled, at the top left of the viewport: the player is fixed over the page, its controls hidden */
const CAPTURE_CSS=`html,body{overflow:hidden!important}
*:has(#wkPlayer){zoom:1!important;transform:none!important;filter:none!important}
.toolbar,header,.nbh-toast,[class*="toast"]{visibility:hidden!important}
#wkPlayer{position:fixed!important;left:0!important;top:0!important;width:${W}px!important;max-width:none!important;height:${H}px!important;margin:0!important;padding:0!important;border-radius:0!important;z-index:2147483647!important;overflow:hidden!important;visibility:visible!important}
#wkFrame{width:${W}px!important;height:${H}px!important;border-radius:0!important;margin:0!important}
#wkStage{transform:none!important}
#wkBig,#wkCap2,#wkPlayer .wk-bar,#wkChaps,#wkFrame .wk-msg{display:none!important}
#wkPlayer *{transition:none!important;animation:none!important;caret-color:transparent!important}`;
const TITLE='Token Board Book: how to use it'+(A.term==='pic'?' (with a terminal token)':A.term==='ring'?' (with a ringed last token)':'');
const cleanup=()=>{if(!A.keep)try{fs.rmSync(TMP,{recursive:true,force:true});}catch(e){}};
const py=(args,opt)=>execFileSync(PY,[HELPER,...args],Object.assign({stdio:'inherit'},opt||{}));

(async()=>{const t0=Date.now();let br;
 try{
  br=await chromium.launch({args:['--force-color-profile=srgb']});
  const page=await br.newPage({viewport:{width:W,height:H},deviceScaleFactor:DSF,reducedMotion:'no-preference',colorScheme:'light'});const log=[];wire(page,log);
  await page.goto(URL,{waitUntil:'load'});await sleep(500);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});
  await page.waitForFunction(()=>/SIMULATED/.test((S.meta&&S.meta.client)||'')&&S.ch[0].k==='ipad',null,{timeout:10000});await sleep(300);
  /* the book's options for this run, with the form's own controls */
  const got=await page.evaluate(o=>{const set=(m,v)=>{const el=document.querySelector('select[data-m="'+m+'"]');if(!el)return false;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return el.value===v;};
    const ok=[set('term',o.term),set('n',String(o.n))];
    return{ok,term:termMode(),n:nTok(),pictos:!window.NBH_PICTOS_MISSING,layout:S.meta.layout};},{term:A.term,n:A.n});
  if(!got.ok.every(Boolean)||got.term!==A.term||got.n!==A.n)throw new Error('book options not set: '+JSON.stringify(got));
  if(!got.pictos)throw new Error('the picture library (nbh-pictos.js) did not load beside the form');
  await sleep(300);
  await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="walk"]').click());await sleep(600);
  await page.addStyleTag({content:CAPTURE_CSS});
  await page.evaluate(()=>{window.scrollTo(0,0);window.dispatchEvent(new Event('resize'));if(TKWALK.pause)TKWALK.pause();});await sleep(300);
  /* every picture loaded and decoded and the fonts ready; then build (again), so the layout is measured with all of it in place */
  const ready=()=>page.evaluate(async()=>{try{await document.fonts.ready;}catch(e){}
    const imgs=[...document.querySelectorAll('#wkStage img')];await Promise.all(imgs.map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r;})));
    await Promise.all(imgs.map(im=>im.decode?im.decode().catch(()=>{}):0));return{imgs:imgs.length,broken:imgs.filter(im=>!im.naturalWidth).map(im=>(im.currentSrc||im.src||'').slice(0,80))};});
  await page.evaluate(()=>TKWALK.build());await ready();
  const b1=await page.evaluate(()=>JSON.stringify(TKWALK.cues));
  await page.evaluate(()=>TKWALK.build());const imgs=await ready();
  const info=await page.evaluate(async()=>{TKWALK.renderAt(0);const st=document.getElementById('wkStage'),r=st.getBoundingClientRect();
    const L=(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines)||{};const cues=TKWALK.cues;
    /* nothing covers the stage: at nine points the top element is inside the player's frame */
    const cover=[];for(const fx of [.02,.5,.98])for(const fy of [.02,.5,.98]){const e=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);if(!e||!e.closest('#wkFrame'))cover.push([fx,fy,e&&(e.tagName+'.'+e.className)]);}
    /* the captions are on: at the middle of each cue the caption shows a piece of that cue's text */
    const cap=st.querySelector('.wk-cap');const capBad=[];
    for(const c of cues){TKWALK.renderAt(c.start+c.dur/2);const s=getComputedStyle(cap),tx=(cap.textContent||'').trim();
      if(s.display==='none'||s.visibility==='hidden'||!tx||!c.text.includes(tx.slice(0,20)))capBad.push(c.id+': '+JSON.stringify(tx.slice(0,40)));}
    TKWALK.renderAt(0);
    const note=document.getElementById('wkNote');
    return{D:TKWALK.duration,cues,chapters:TKWALK.chapters,rect:{x:r.left,y:r.top,w:r.width,h:r.height},cover,capBad,
      clips:Object.fromEntries(cues.filter(c=>L[c.id]&&L[c.id].a).map(c=>[c.id,{a:L[c.id].a,d:L[c.id].d,t:L[c.id].t}])),
      voice:(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO.voice)||'',speed:(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO.speed)||0,
      term:termMode(),n:nTok(),missing:cues.filter(c=>!(L[c.id]&&L[c.id].a)).map(c=>c.id),unmeasured:TKWALK.unmeasured||[],
      note:note&&!note.hidden?note.textContent:'',reduced:TKWALK.reduced};});
  if(JSON.stringify(info.cues)!==b1)console.warn('NOTE: the timeline changed once every picture had loaded; the second build is used');
  if(Math.abs(info.rect.x)>.5||Math.abs(info.rect.y)>.5||Math.abs(info.rect.w-W)>.5||Math.abs(info.rect.h-H)>.5)throw new Error('the stage is not at 0,0 1280x720: '+JSON.stringify(info.rect));
  if(info.cover.length)throw new Error('something covers the stage: '+JSON.stringify(info.cover));
  if(info.capBad.length)throw new Error('captions missing or wrong at: '+info.capBad.join('; '));
  if(info.reduced)throw new Error('reduced motion is on: the video would cut every cue to its end');
  if(imgs.broken.length)throw new Error('pictures that did not load: '+imgs.broken.join(' '));
  if(info.missing.length)console.warn('WARNING: no narration clip for '+info.missing.join(', '));
  if(info.unmeasured.length)console.warn('WARNING: lines without word timings: '+info.unmeasured.join(', '));
  if(info.note)console.log('note under the stage: '+info.note);
  const clip={x:0,y:0,width:W,height:H};
  if(A.preview){fs.mkdirSync(A.frames,{recursive:true});for(const t of A.preview.split(',').map(Number)){await page.evaluate(t=>TKWALK.renderAt(t),t);
      const p=path.join(A.frames,'preview-'+t.toFixed(2)+'.jpg');await page.screenshot({path:p,type:'jpeg',quality:A.quality,clip,animations:'disabled',caret:'hide',scale:'device'});console.log(p);}
    console.log('cues '+info.cues.map(c=>c.id+'@'+c.start.toFixed(2)+'+'+c.dur.toFixed(2)).join(' '));return;}
  const N=Math.round(info.D*A.fps);
  const job={fps:A.fps,frames:N,duration:info.D,cues:info.cues,chapters:info.chapters,clips:info.clips,voice:info.voice,speed:info.speed,
    term:info.term,n:info.n,encoder:hasX264?'libx264':'mpeg4',title:TITLE,
    comment:'The narrated walkthrough of Form TK-1 (Token Board Book), drawn from its Walkthrough view with the sample book ('+info.n+' tokens; the last token: '+({none:'the same as the others',ring:'an orange double border',pic:'its own picture, with an orange double border'})[info.term]+').'};
  const jobPath=path.join(TMP,'job.json');const wav=path.join(TMP,'narration.wav'),trackRep=path.join(TMP,'track.json');
  const common=['--ffmpeg',FF,'--tmp',TMP,'--tts',TTS,'--cache',CACHE,...(A['no-tts']?['--no-tts']:[])];
  if(A.check){await br.close();br=null;fs.writeFileSync(jobPath,JSON.stringify(job));
    let code=0;try{py(['check',jobPath,'--out',A.out,'--frames',A.frames,...common]);}catch(e){code=1;}
    cleanup();process.exit(code);}
  console.log('book term='+info.term+' n='+info.n+'  duration '+info.D.toFixed(3)+' s  frames '+N+' at '+A.fps+' fps  cues '+info.cues.length+'  encoder '+job.encoder+'  pictures '+imgs.imgs);
  /* determinism: three times drawn twice, the second time in the other order (compared by the helper) */
  const det=[];{const ts=['ch_pick','tok_first','exchange'].map(id=>info.cues.find(c=>c.id===id)).filter(Boolean).map(c=>+(c.start+c.dur*.37).toFixed(3));
    const shot=async(t,tag)=>{await page.evaluate(t=>TKWALK.renderAt(t),t);const p=path.join(TMP,'det-'+tag+'-'+t.toFixed(3)+'.png');await page.screenshot({path:p,type:'png',clip,animations:'disabled',caret:'hide',scale:'device'});return p;};
    const a1=[];for(const t of ts)a1.push(await shot(t,'a'));const b2=[];for(const t of [...ts].reverse())b2.unshift(await shot(t,'b'));
    ts.forEach((t,i)=>det.push({t,a:a1[i],b:b2[i]}));}
  job.det=det;fs.writeFileSync(jobPath,JSON.stringify(job));
  /* the narration track is made while the frames are drawn */
  const track=new Promise((res,rej)=>{const p=spawn(PY,[HELPER,'track',jobPath,'--wav',wav,'--report',trackRep,'--loudness',String(A.loudness),...common],{stdio:['ignore','pipe','inherit']});
    let out='';p.stdout.on('data',d=>{out+=d;});p.on('close',c=>c===0?res(out.trim()):rej(new Error('the narration track failed ('+c+'): '+out.trim())));});
  track.catch(()=>{});
  const vid=path.join(TMP,'video.mp4');
  /* JPEG (BT.601, full range) to BT.709 limited range, tagged: players take untagged HD video as BT.709 */
  const vf=['-vf','scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=limited:flags=bicubic+accurate_rnd+full_chroma_int,format=yuv420p',
    '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv'];
  const venc=hasX264?['-c:v','libx264','-preset','medium','-crf',String(A.crf),'-profile:v','high','-level:v','4.0','-g',String(5*A.fps),'-pix_fmt','yuv420p',...vf]
                    :['-c:v','mpeg4','-q:v','2','-g',String(5*A.fps),'-pix_fmt','yuv420p',...vf];
  if(!hasX264)console.warn('NOTE: libx264 is not in this ffmpeg; encoding MPEG-4 Part 2 at high quality (-q:v 2) instead');
  const ff=spawn(FF,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-c:v','mjpeg','-framerate',String(A.fps),'-i','-',...venc,'-r',String(A.fps),'-an',vid],{stdio:['pipe','inherit','inherit']});
  let ffErr=null;ff.stdin.on('error',e=>{ffErr=e;});
  const ffDone=new Promise((res,rej)=>ff.on('close',c=>c===0?res():rej(new Error('ffmpeg exited '+c))));ffDone.catch(()=>{});
  const write=buf=>new Promise((res,rej)=>{if(ffErr)return rej(ffErr);if(ff.stdin.write(buf))res();else ff.stdin.once('drain',res);});
  let last=Date.now();const tc=Date.now();
  for(let i=0;i<N;i++){await page.evaluate(t=>TKWALK.renderAt(t),i/A.fps);
    const jpg=await page.screenshot({type:'jpeg',quality:A.quality,clip,animations:'disabled',caret:'hide',scale:'device'});
    if(i===0){const o=jpgSof(jpg),w=jpg.readUInt16BE(o+7),h=jpg.readUInt16BE(o+5);if(w!==1920||h!==1080)throw new Error('frame is '+w+'x'+h+', not 1920x1080');}
    await write(jpg);
    if(Date.now()-last>20000||i===N-1){last=Date.now();const el=(Date.now()-tc)/1000,fpsr=(i+1)/el;
      console.log('  frame '+(i+1)+'/'+N+'  '+fpsr.toFixed(1)+' frames/s  '+(el/60).toFixed(1)+' min, about '+((N-i-1)/fpsr/60).toFixed(1)+' min to go');}}
  ff.stdin.end();await ffDone;
  const errs=log.filter(l=>l.type==='pageerror');const warns=log.filter(l=>l.type!=='pageerror');
  await br.close();br=null;
  console.log('narration: '+await track);
  let code=0;try{py(['mux',jobPath,'--video',vid,'--wav',wav,'--track-report',trackRep,'--out',A.out,'--frames',A.frames,...common]);}catch(e){code=1;}
  if(warns.length)console.log('console messages: '+JSON.stringify(warns.slice(0,10)));
  if(errs.length){console.log('PAGE ERRORS: '+JSON.stringify(errs));code=1;}
  cleanup();
  console.log((code?'FAILED':'done')+' in '+((Date.now()-t0)/60000).toFixed(1)+' min: '+A.out);process.exit(code);
 }catch(e){console.error('FAIL '+(e&&e.stack||e));try{if(br)await br.close();}catch(x){}cleanup();process.exit(1);}
})();
/* the offset of a JPEG's start-of-frame marker (its height at +5, width at +7) */
function jpgSof(b){let i=2;while(i<b.length){if(b[i]!==0xFF){i++;continue;}const m=b[i+1];if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return i;i+=2+b.readUInt16BE(i+2);}throw new Error('no SOF in JPEG');}
