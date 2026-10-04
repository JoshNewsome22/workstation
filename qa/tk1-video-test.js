/* v21.44 Form TK-1, Save as video (tools/forms/TK-1/walk-video.js, in nbh-tk1-video.js beside the form): the painted frames are
   the walkthrough as the page shows it, and the button makes an MP4.
   1. At twelve moments of the walkthrough (every chapter, the hands, the timer, the speech bubble, the tips) the frame the video
      maker paints is compared with a screenshot of the stage: the mean difference per channel must stay under 6 (of 255) and no
      eighth of the picture may differ by more than 14 (a missing card, hand or caption differs by far more).
   2. The button and its note are there; the file is beside the form and the one-file editions carry it.
   3. Where this Chromium has an H.264 encoder: the first 3 s made into an MP4 (an ftyp box, a moov box, a video track, the
      narration as an audio track), from the button's own code path (TKVIDEO.make).
   usage: node qa/tk1-video-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
let fails=0;const ok=(name,cond,info)=>{console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?'  '+(typeof info==='string'?info:JSON.stringify(info)):''));if(!cond)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1500,height:1100}});const log=[];wire(page,log);
  await page.goto(URL);await sleep(1500);
  ok('the button and the file are there',await page.evaluate(()=>!!document.getElementById('wkVideo')&&typeof TKVIDEO==='object'&&typeof Mp4Muxer==='object'));
  await page.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(600);
  await page.click('#viewSeg button[data-view="walk"]');await sleep(1500);
  const D=await page.evaluate(()=>TKWALK.duration);
  const ts=[3,22,40,58,62,66,95,120,150,165,190,D-2];
  /* the video is 1080p: most moments at 1280 (quicker), three at 1920 x 1080, as the video has them */
  for(const t of ts){const W=[66,150,190].includes(t)?1920:1280;
    const png=await page.evaluate(async([t,W])=>(await TKVIDEO.frame(t,W)).toDataURL('image/png'),[t,W]);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);
    /* the stage alone, without the big play button over it */
    await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();
    await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      /* at 128 x 72, drawn down in two steps: an edge half a pixel off (the screenshot is the stage as the page scales it) counts for
         little, a missing card, hand or caption for a lot */
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);
        const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    ok('t='+t.toFixed(1)+' s, '+W+' wide: the painted frame is the stage as shown',d.mean<3.5&&d.worst<9,d);}
  /* the same moments painted by one scene stepping through the walkthrough (as the video is made: pictures kept between frames
     and painted again only where something changed), against fresh frames: a change the scene misses (a caption's new text,
     the timer's numbers) shows here */
  const steps=[22,66,95,150,165,190].map(t=>Math.round(t*2)/2);
  const seq=await page.evaluate(async ts=>await TKVIDEO.run(ts,.5),steps);
  for(const t of steps){const fresh=await page.evaluate(async t=>(await TKVIDEO.frame(t)).toDataURL('image/png'),t);
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=320,h=180,px=img=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let m=0,n=0;for(let i=0;i<p.length;i+=4){const v=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;m=Math.max(m,v);if(v>24)n++;}return{max:+m.toFixed(1),off:n};},[seq[t],fresh]);
    ok('t='+t+' s, stepping through the walkthrough: the same frame as painted fresh',d.off<=12,d);}
  /* the one-file editions and the offline copy carry the file */
  const single=fs.readFileSync(path.join(ROOT,'deliver/RPS-Workstation.html'),'utf8');
  ok('the one-file edition carries Save as video',single.includes('id="nbh-embed-video"'));
  const rel=JSON.parse(fs.readFileSync(path.join(ROOT,'RPS-Workstation/release.json'),'utf8'));
  ok('the offline copy lists nbh-tk1-video.js',!!rel.files['nbh-tk1-video.js']);
  /* the MP4, where this browser can encode H.264 */
  const can=await page.evaluate(async()=>{try{return(await VideoEncoder.isConfigSupported({codec:'avc1.42E01F',width:1280,height:720,bitrate:2e6,framerate:30})).supported;}catch(e){return false;}});
  if(!can)console.log('SKIP the MP4: this Chromium has no H.264 encoder (qa checks it in WebKit: see SETUP.md)');
  else{const r=await page.evaluate(async()=>{const m=await TKVIDEO.make({until:3});const b=new Uint8Array(await m.blob.arrayBuffer());const s=String.fromCharCode.apply(null,b.subarray(0,Math.min(b.length,400000)));
      return{size:b.length,ftyp:s.indexOf('ftyp')===4,moov:s.indexOf('moov')>=0,avc:s.indexOf('avc1')>=0,aud:s.indexOf('mp4a')>=0||s.indexOf('Opus')>=0,sound:m.sound,frames:m.frames};});
    ok('the first 3 s make an MP4 with a video track',r.ftyp&&r.moov&&r.avc&&r.frames===90&&r.size>20000,r);
    ok('... and the narration as its sound, where there is an audio encoder',!r.sound||r.aud,r);}
  const errs=log.filter(l=>l.type==='pageerror'||/error/i.test(l.type));
  ok('no script errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
