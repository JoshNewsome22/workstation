/* v24.05 Form ABC-1, the narrated walkthrough at the top of the Walkthrough view (tools/forms/ABC-1/walk.js; the player is Form
   TK-1's): the player above the drawn stories, hidden until the view opens; the narration read when it opens; the build from a
   simulated student by the form's own paper-sheet code, the record untouched; the frames (camera, glows, ticks, the narrative,
   captions); Save as video's painter; leaving the view pauses; the paper sheets still print this record's header.
   usage: node qa/abc105-walk-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url());});
 const got=[];p.on('request',r=>{const m=/(nbh-[a-z0-9-]+-narration\.js)/.exec(r.url());if(m)got.push(m[1]);});
 await p.goto(URL);await sleep(1500);
 const bits=await p.evaluate(()=>({tab:!!document.querySelector('#viewSeg [data-view="walk"]'),player:!!document.querySelector('#panel-walk > #abcWalk #wkStage'),first:document.querySelector('#panel-walk').children[2]&&document.querySelector('#panel-walk').children[2].id,
   stories:document.querySelectorAll('#panel-walk .story').length,lazy:[...document.querySelectorAll('script[type="text/x-nbh-narration"]')].map(s=>s.dataset.src),eager:document.querySelectorAll('script[src$="narration.js"]').length,
   api:!!(window.nbhNarration&&!nbhNarration.loaded),audio:typeof WALK_AUDIO,walk:typeof TKWALK,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.file,hidden:document.querySelector('#panel-walk').hidden,view:document.body.className}));
 ok('the player sits at the top of the Walkthrough view above the six drawn stories, hidden until opened; the narration is a lazy tag, not read yet; the player and Save as video are there',
   bits.tab&&bits.player&&bits.first==='abcWalk'&&bits.stories===6&&JSON.stringify(bits.lazy)==='["nbh-abc1-narration.js"]'&&bits.eager===0&&bits.api&&bits.audio==='undefined'&&bits.walk==='object'&&bits.video==='object'&&bits.info==='ABC data sheet walkthrough'&&bits.hidden&&!got.length,bits);
 /* a record of the BCBA's own (simulated) */
 await p.evaluate(()=>{document.querySelector('#h-client').value='Test Student (simulated)';document.querySelector('#h-observer').value='R. Smith';document.querySelector('#h-target').value='Leaving the area';document.querySelector('#h-window').value='15';
   state.sheet.photo='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';state.sheet.photoOn='1';readHeader();});
 const before=await p.evaluate(()=>({j:JSON.stringify(state),inputs:[...document.querySelectorAll('#panel-record input,#panel-record textarea,#panel-record select')].map(i=>i.value).join('|'),html:document.documentElement.className}));
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const built=await p.evaluate(()=>{const A=typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO.lines||{};const cues=TKWALK.cues;const st=document.querySelector('#wkStage');return {view:document.body.className,shown:!document.querySelector('#panel-walk').hidden,n:Object.keys(A).length,ids:cues.map(c=>c.id),d:TKWALK.duration,
   voiced:cues.filter(c=>A[c.id]&&A[c.id].a&&Math.abs(c.narr-A[c.id].d)<1e-6).length,chapters:TKWALK.chapters.map(c=>c.id),note:document.querySelector('#wkNote').hidden,tx:document.querySelector('#wkTx').textContent.length,
   pages:st.querySelectorAll('.abw-pg').length,demo:/A\. Student \(sample\)/.test(st.textContent),own:/Test Student|Leaving the area|R\. Smith/.test(st.textContent),bg:/Background Sample Sheet/.test(st.textContent),an:/Reading the Analysis/.test(st.textContent)&&/9 of 12/.test(st.textContent),
   opts:st.querySelectorAll('.ap-opt[data-id]').length,on:st.querySelectorAll('.ap-opt.on').length,noInputs:st.querySelectorAll('input,button,select').length===0,sambar:!!st.querySelector('.ap-sambar'),stories:document.querySelectorAll('#panel-walk .story .scene').length};});
 ok('opening the view reads the narration once and builds the walkthrough with the recorded voice (17 lines, 5 chapters), the transcript filled',
   JSON.stringify(got)==='["nbh-abc1-narration.js"]'&&built.view==='view-walk'&&built.shown&&built.n===17&&built.d>180&&built.voiced===built.ids.length&&built.ids.length===17&&built.chapters.join()==='sheet,incident,background,analysis,end'&&built.note&&built.tx>2500,built);
 ok('the stage holds the simulated student\'s incident sheet, the background sample sheet and the analysis reading, as the paper prints (no fields, no SAMPLE bar), every box off at the start, nothing of this record; the drawn stories stay',
   built.pages===3&&built.demo&&!built.own&&built.bg&&built.an&&built.opts>100&&built.on===0&&built.noInputs&&!built.sambar&&built.stories===6,built);
 const after=await p.evaluate(()=>({j:JSON.stringify(state),inputs:[...document.querySelectorAll('#panel-record input,#panel-record textarea,#panel-record select')].map(i=>i.value).join('|'),html:document.documentElement.className,paper:document.querySelector('#abcPaper').innerHTML.length}));
 ok('the record is exactly as it was: the state, the fields on screen; the print host is empty',after.j===before.j&&after.inputs===before.inputs&&after.html===before.html&&after.paper===0,{before:before.j.slice(0,200),after:after.j.slice(0,200)});
 /* frames: the camera moves, glows show, the ticks and the written fields appear in their lines, the narrative fills, and all of it is gone again at 0 */
 const fr=await p.evaluate(()=>{const C=TKWALK.cues,at=id=>C.find(c=>c.id===id);const st=document.querySelector('#wkStage'),paper=st.querySelector('.abw-paper'),P=[...st.querySelectorAll('.abw-pg')];
   const tf=()=>paper.style.transform;const on=(id,i)=>P[i||0].querySelector('.ap-opt[data-id="'+id+'"]').classList.contains('on');const fld=lab=>[...P[0].querySelectorAll('.ap-f')].find(f=>f.querySelector('b').textContent.startsWith(lab)).querySelector('span').textContent;
   const end=id=>{const c=at(id);TKWALK.renderAt(c.start+c.dur-.2);};const out={};
   TKWALK.renderAt(1);out.home=tf();out.cap0=st.querySelector('.wk-cap').textContent.slice(0,30);out.obs0=fld('Observer');out.narr0=P[0].querySelector('.ap-lines').textContent.length;
   {const H=at('head');TKWALK.renderAt(H.start+H.dur*.4);out.glows=[...st.querySelectorAll('.abw-glow')].filter(e=>e.style.visibility==='visible').length;}end('head');out.head=tf();out.obs=fld('Observer');out.date=fld('Date');
   end('rules');out.adult=P[0].querySelector('.ap-f:nth-child(1) .ap-opt')&&[...P[0].querySelectorAll('.ap-f')].find(f=>f.textContent.startsWith('Adult')).querySelector('.ap-opt').classList.contains('on');
   const A=at('ante');TKWALK.renderAt(A.start+.3);out.anteBefore=on('a_acad');end('ante');out.ante=[on('a_acad'),on('a_difficult'),on('b_scream')];
   end('beh');out.beh=[on('b_scream'),on('p_refuse'),on('p_push')];end('cons');out.cons=on('c_dem_rem');
   end('narr');out.narr=P[0].querySelector('.ap-lines').textContent;end('after');out.after=[on('i_stopped'),on('r_bip')];
   end('bgmark');out.bgCam=tf();out.bg=[on('a_acad',1),[...P[1].querySelectorAll('.ap-f')].find(f=>f.textContent.startsWith('Time')).querySelector('span').textContent];
   end('analysis');out.anCam=tf();out.anGlow=[...st.querySelectorAll('.abw-glow')].filter(e=>e.style.visibility==='visible').length;
   const Sm=at('sample');TKWALK.renderAt(Sm.start+Sm.dur-.6);out.samp=[...st.querySelectorAll('.abw-samp')].some(e=>e.closest('.wk-o').style.visibility==='visible');
   TKWALK.renderAt(TKWALK.duration-.1);out.end=tf();out.endCap=st.querySelector('.wk-cap').textContent;
   TKWALK.renderAt(0);out.reset=[on('a_acad'),on('b_scream'),on('i_stopped'),on('a_acad',1),fld('Observer'),P[0].querySelector('.ap-lines').textContent.length];return out;});
 ok('the frames: the camera leaves home for the head and comes back at the end; glows show; the observer and the date are written in the head line; the adult tick, the antecedent, behavior, precursor and consequence ticks, the narrative and the after ticks appear in their lines; the background check is ticked on its own page; the analysis page is visited; the SAMPLE word shows; all of it is gone again at 0',
   fr.home!==fr.head&&fr.obs0===''&&fr.narr0===0&&fr.obs==='J. Lee'&&fr.date==='10/19/2026'&&fr.glows>=1&&fr.adult&&!fr.anteBefore&&fr.ante.join()==='true,true,false'&&fr.beh.join()==='true,true,true'&&fr.cons&&/Teacher put the math sheet/.test(fr.narr)&&/No peers reacted/.test(fr.narr)&&fr.after.join()==='true,true'
   &&fr.bgCam!==fr.head&&fr.bg[0]&&fr.bg[1]==='10:40 AM'&&fr.anCam!==fr.bgCam&&fr.anGlow>=1&&fr.samp&&/Thank you|Hand your sheets/.test(fr.endCap)&&fr.reset.join()==='false,false,false,false,,0',fr);
 /* Save as video's painter paints the stage */
 const vid=await p.evaluate(async()=>{const cv=await TKVIDEO.frame(TKWALK.cues.find(c=>c.id==='columns').start+2,640);const g=cv.getContext('2d');const d=g.getImageData(0,0,cv.width,cv.height).data;let dark=0,light=0;for(let i=0;i<d.length;i+=4*37){const l=(d[i]+d[i+1]+d[i+2])/3;if(l<80)dark++;else if(l>235)light++;}return {w:cv.width,h:cv.height,dark,light};});
 ok('Save as video paints the stage (a frame with the white paper, its dark ink and the caption band)',vid.w===640&&vid.h===360&&vid.dark>200&&vid.light>2000,vid);
 /* play, then leave the view: it pauses; the Record tab shows the record */
 const pl=await p.evaluate(async()=>{TKWALK.play();await new Promise(r=>setTimeout(r,900));const was=TKWALK.playing,t=TKWALK.time;document.querySelector('#viewSeg [data-view="record"]').click();await new Promise(r=>setTimeout(r,300));
   return {was,t,now:TKWALK.playing,view:document.body.className,rec:!document.querySelector('#panel-record').hidden,walk:document.querySelector('#panel-walk').hidden,client:document.querySelector('#h-client').value};});
 ok('Play runs the clock; leaving the view pauses it and the Record tab shows the record again',pl.was&&pl.t>0.3&&!pl.now&&pl.view==='view-record'&&pl.rec&&pl.walk&&pl.client==='Test Student (simulated)',pl);
 /* the paper sheets (v24.04) still print this record's header, their boxes now carrying their ids */
 const pp=await p.evaluate(()=>{const h=document.createElement('div');h.innerHTML=abcPaper.html('sample');const g=document.createElement('div');g.innerHTML=abcPaper.html('bg');
   return {own:/Test Student \(simulated\)/.test(h.textContent)&&/Leaving the area/.test(h.textContent),demo:/A\. Student/.test(h.textContent),ids:h.querySelectorAll('.ap-opt[data-id]').length,on:h.querySelectorAll('.ap-opt.on[data-id="a_acad"]').length,photo:!!h.querySelector('.ap-photo img'),sambar:!!h.querySelector('.ap-sambar'),bgOwn:/Test Student/.test(g.textContent),bgIds:g.querySelectorAll('.ap-opt[data-id]').length};});
 ok('the paper sheets print this record\'s header and photo as before, the sample\'s boxes ticked, each box carrying its id',pp.own&&!pp.demo&&pp.ids>=100&&pp.on===1&&pp.photo&&pp.sambar&&pp.bgOwn&&pp.bgIds>60,pp);
 /* the one-file edition carries the narration */
 const sh=fs.readFileSync(ROOT+'/NBH-Workstation/index.html','utf8'),bs=fs.readFileSync(ROOT+'/tools/build-single.py','utf8');
 ok('the workstation shell embeds the narration in the one-file edition (NARTAG8, narration8) and the build packs it',/const NARTAG8=/.test(sh)&&/E\.narration8=await inflate\('nbh-embed-narration-abc1'\)/.test(sh)&&/NARTAG8\.test\(h\)/.test(sh)&&/nbh-embed-narration-abc1/.test(bs)&&fs.existsSync(ROOT+'/RPS-Workstation/nbh-abc1-narration.js'),{});
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
