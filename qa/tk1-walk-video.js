/* Form TK-1, the Walkthrough view (v21.43): render the narrated walkthrough to an MP4, frame by frame (deterministic).
   The form is loaded with the simulator book, the book's options are set (terminal token, number of tokens), the Walkthrough
   view is opened and built, and the stage alone (captions burned in, no controls) is drawn at 1920 x 1080: the stage is
   1280 x 720 logical, shown unscaled in a 1280 x 720 viewport at a device scale factor of 1.5. For every frame i the
   timeline is set with TKWALK.renderAt(i/fps) and the stage is captured as a JPEG, piped to ffmpeg (image2pipe) and encoded
   H.264 (libx264, yuv420p, crf 20, preset medium; mpeg4 at high quality when libx264 is missing). Then
   tools/forms/TK-1/make-walk-video.py lays every narration clip of WALK_AUDIO at its cue start in one 24 kHz mono track,
   muxes it (AAC 96 kbit/s, +faststart) and verifies the result (length, size, frame rate, audio, the audio rising at
   every cue start, frames at five cue midpoints saved as PNG beside the video).
   usage: node qa/tk1-walk-video.js [--term none|ring|pic] [--n 5] [--out file.mp4] [--frames dir] [--fps 30] [--quality 92] [--keep] [--preview t1,t2,..]
          (--preview: only save the frames at those times, as JPEG, in the --frames folder, and stop)
          (--frames: where the check frames go, default $S/tk1-walk-video-frames/<name of the video>)
   env:   TK1_PY  the Python with numpy, soundfile and imageio-ffmpeg (default $S/tts/venv/bin/python, else python3)
          S       the scratch folder for the temporary files (default the system temp folder); removed afterwards unless --keep */
const {chromium,fs,path,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn,execFileSync}=require('child_process');const os=require('os');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
const A={term:'none',n:5,out:'',frames:'',fps:30,quality:92,keep:false,preview:''};
const av=process.argv.slice(2);for(let i=0;i<av.length;i++){const k=av[i].replace(/^--/,'');if(k==='keep')A.keep=true;else if(k in A)A[k]=typeof A[k]==='number'?+av[++i]:av[++i];else{console.error('unknown option '+av[i]);process.exit(2);}}
if(!A.out)A.out=path.join(__dirname,'out','tk1-walk-video','TK-1-Walkthrough'+(A.term==='none'?'':'_terminal-'+(A.term==='pic'?'token':A.term))+'.mp4');
A.out=path.resolve(A.out);fs.mkdirSync(path.dirname(A.out),{recursive:true});
const SCR=process.env.S||os.tmpdir();
if(!A.frames)A.frames=path.join(SCR,'tk1-walk-video-frames',path.basename(A.out,'.mp4'));
const PY=process.env.TK1_PY||[path.join(SCR,'tts','venv','bin','python')].find(p=>fs.existsSync(p))||'python3';
const HELPER=path.join(__dirname,'..','tools','forms','TK-1','make-walk-video.py');
const FF=execFileSync(PY,['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const hasX264=/\blibx264\b/.test(execFileSync(FF,['-hide_banner','-encoders'],{stdio:['ignore','pipe','ignore']}).toString());
const TMP=fs.mkdtempSync(path.join(SCR,'tk1-walk-video-'));
const W=1280,H=720,DSF=1.5;
/* the stage alone, unscaled, at the top left of the viewport: the player is fixed over the page, its controls hidden */
const CAPTURE_CSS=`html,body{overflow:hidden!important}
*:has(#wkPlayer){zoom:1!important;transform:none!important}
.toolbar,header,.nbh-toast,[class*="toast"]{visibility:hidden!important}
#wkPlayer{position:fixed!important;left:0!important;top:0!important;width:${W}px!important;max-width:none!important;height:${H}px!important;margin:0!important;padding:0!important;border-radius:0!important;z-index:2147483647!important;overflow:hidden!important;visibility:visible!important}
#wkFrame{width:${W}px!important;height:${H}px!important;border-radius:0!important;margin:0!important}
#wkStage{transform:none!important}
#wkBig,#wkCap2,#wkPlayer .wk-bar,#wkChaps{display:none!important}
*{caret-color:transparent!important}`;
(async()=>{const t0=Date.now();
  const br=await chromium.launch();const page=await br.newPage({viewport:{width:W,height:H},deviceScaleFactor:DSF});const log=[];wire(page,log);
  await page.goto(URL);await sleep(600);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(600);
  /* the book's options for this run */
  const got=await page.evaluate(o=>{S.meta.term=o.term;S.meta.n=String(o.n);ensure();recaps(true);renderAll();return{term:termMode(),n:nTok()};},{term:A.term,n:A.n});
  if(got.term!==(A.term==='ring'||A.term==='pic'?A.term:'none')||got.n!==A.n)throw new Error('book options not set: '+JSON.stringify(got));
  await sleep(300);
  await page.evaluate(()=>document.querySelector('#viewSeg button[data-view="walk"]').click());await sleep(800);
  await page.addStyleTag({content:CAPTURE_CSS});
  await page.evaluate(()=>{window.scrollTo(0,0);window.dispatchEvent(new Event('resize'));if(TKWALK.pause)TKWALK.pause();});await sleep(300);
  const info=await page.evaluate(async()=>{TKWALK.build();
    /* every picture loaded and the fonts ready before the first frame */
    const imgs=[...document.querySelectorAll('#wkStage img')];await Promise.all(imgs.map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r;})));
    try{await document.fonts.ready;}catch(e){}
    TKWALK.renderAt(0);const r=document.getElementById('wkStage').getBoundingClientRect();
    const L=(typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines)||{};
    const cues=TKWALK.cues;return{D:TKWALK.duration,cues,chapters:TKWALK.chapters,rect:{x:r.left,y:r.top,w:r.width,h:r.height},
      clips:Object.fromEntries(cues.filter(c=>L[c.id]&&L[c.id].a).map(c=>[c.id,{a:L[c.id].a,d:L[c.id].d,t:L[c.id].t}])),
      term:termMode(),n:nTok(),missing:cues.filter(c=>!(L[c.id]&&L[c.id].a)).map(c=>c.id)};});
  if(Math.abs(info.rect.x)>.5||Math.abs(info.rect.y)>.5||Math.abs(info.rect.w-W)>.5||Math.abs(info.rect.h-H)>.5)throw new Error('the stage is not at 0,0 1280x720: '+JSON.stringify(info.rect));
  if(info.missing.length)console.warn('WARNING: no narration clip for '+info.missing.join(', '));
  if(A.preview){fs.mkdirSync(A.frames,{recursive:true});for(const t of A.preview.split(',').map(Number)){await page.evaluate(t=>TKWALK.renderAt(t),t);
      const p=path.join(A.frames,'preview-'+t.toFixed(2)+'.jpg');await page.screenshot({path:p,type:'jpeg',quality:A.quality,clip:{x:0,y:0,width:W,height:H},scale:'device'});console.log(p);}
    console.log('cues '+info.cues.map(c=>c.id+'@'+c.start.toFixed(2)+'+'+c.dur.toFixed(2)).join(' '));await br.close();fs.rmSync(TMP,{recursive:true,force:true});return;}
  const N=Math.round(info.D*A.fps);
  console.log('book term='+info.term+' n='+info.n+'  duration '+info.D.toFixed(3)+' s  frames '+N+' at '+A.fps+' fps  cues '+info.cues.length+'  encoder '+(hasX264?'libx264':'mpeg4'));
  const vid=path.join(TMP,'video.mp4');
  const venc=hasX264?['-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p']:['-c:v','mpeg4','-q:v','2','-pix_fmt','yuv420p'];
  const ff=spawn(FF,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-c:v','mjpeg','-framerate',String(A.fps),'-i','-',...venc,'-r',String(A.fps),'-an',vid],{stdio:['pipe','inherit','inherit']});
  const ffDone=new Promise((res,rej)=>ff.on('close',c=>c===0?res():rej(new Error('ffmpeg exited '+c))));
  const write=buf=>new Promise((res,rej)=>{if(ff.stdin.write(buf))res();else ff.stdin.once('drain',res);});
  const clip={x:0,y:0,width:W,height:H};let last=Date.now();
  for(let i=0;i<N;i++){await page.evaluate(t=>TKWALK.renderAt(t),i/A.fps);
    const jpg=await page.screenshot({type:'jpeg',quality:A.quality,clip,animations:'disabled',caret:'hide',scale:'device'});
    if(i===0){const w=jpg.readUInt16BE(jpgSof(jpg)+7),h=jpg.readUInt16BE(jpgSof(jpg)+5);if(w!==1920||h!==1080)throw new Error('frame is '+w+'x'+h+', not 1920x1080');}
    await write(jpg);
    if(Date.now()-last>15000||i===N-1){last=Date.now();console.log('  frame '+(i+1)+'/'+N+'  '+((Date.now()-t0)/1000).toFixed(0)+' s');}}
  ff.stdin.end();await ffDone;
  const errs=log.filter(l=>l.type==='error'||l.type==='pageerror');await br.close();
  const job=path.join(TMP,'job.json');
  fs.writeFileSync(job,JSON.stringify({fps:A.fps,frames:N,duration:info.D,cues:info.cues,chapters:info.chapters,clips:info.clips,term:info.term,n:info.n,encoder:hasX264?'libx264':'mpeg4'}));
  execFileSync(PY,[HELPER,job,'--video',vid,'--out',A.out,'--ffmpeg',FF,'--tmp',TMP,'--frames',A.frames],{stdio:'inherit'});
  if(errs.length)console.log('page errors: '+JSON.stringify(errs));
  if(!A.keep)fs.rmSync(TMP,{recursive:true,force:true});
  console.log('done in '+((Date.now()-t0)/1000).toFixed(0)+' s: '+A.out);
})().catch(e=>{console.error('FAIL '+(e&&e.stack||e));try{if(!A.keep)fs.rmSync(TMP,{recursive:true,force:true});}catch(x){}process.exit(1);});
/* the offset of a JPEG's start-of-frame marker (its height at +5, width at +7) */
function jpgSof(b){let i=2;while(i<b.length){if(b[i]!==0xFF){i++;continue;}const m=b[i+1];if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return i;i+=2+b.readUInt16BE(i+2);}throw new Error('no SOF in JPEG');}
