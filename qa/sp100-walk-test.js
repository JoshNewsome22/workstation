/* v24.00 Form SP-1, the Walkthrough view (tools/forms/SP-1/walk.js; the player is Form TK-1's):
   the tab and the section; the narration read when the view opens; the build from a simulated student in this record's marking
   setup (slash and shade, shade only, counts), the record untouched; the frames (camera, glows, marks, captions); Save as video's
   painter; leaving the view pauses. usage: node qa/sp100-walk-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url());});
 const got=[];p.on('request',r=>{const m=/(nbh-[a-z0-9-]+-narration\.js)/.exec(r.url());if(m)got.push(m[1]);});
 await p.goto(URL);await sleep(1500);
 const bits=await p.evaluate(()=>({tab:!!document.querySelector('#viewSeg [data-view="walk"]'),sec:!!document.querySelector('#spWalk.only-walk'),player:!!document.querySelector('#spWalk #wkStage'),lazy:[...document.querySelectorAll('script[type="text/x-nbh-narration"]')].map(s=>s.dataset.src),
   eager:document.querySelectorAll('script[src$="narration.js"]').length,api:!!(window.nbhNarration&&!nbhNarration.loaded),audio:typeof WALK_AUDIO,walk:typeof TKWALK,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.file,hidden:getComputedStyle(document.querySelector('#spWalk')).display}));
 ok('the Walkthrough tab and its section are in the form, hidden until opened; the narration is a lazy tag, not read yet; the player and Save as video are there',
   bits.tab&&bits.sec&&bits.player&&JSON.stringify(bits.lazy)==='["nbh-sp1-narration.js"]'&&bits.eager===0&&bits.api&&bits.audio==='undefined'&&bits.walk==='object'&&bits.video==='object'&&bits.info==='Scatterplot walkthrough'&&bits.hidden==='none'&&!got.length,bits);
 /* a record of the BCBA's own (simulated), two behaviors, marks, the two-level sheet */
 await p.evaluate(()=>{state.meta.client='Test Student (simulated)';state.meta.behavior='Elopement';state.meta.definition='Leaves the area.';state.meta.observer='R. Smith';state.cfg.actOn=true;state.cfg.activity=['Arrival','Math'];cellOf(1,1).s=2;cellOf(4,0).s=1;commitBeh();
   state.behaviors.push({meta:{behavior:'Calling out',definition:'Speaks without a turn.',threshold:'3'},cells:{}});renderMeta();renderBehBar();render();});
 const before=await p.evaluate(()=>({j:JSON.stringify(serialize()),cur:state.cur,inputs:[...document.querySelectorAll('#sheet input,#sheet textarea')].map(i=>i.value).join('|'),view:document.body.className,html:document.documentElement.className}));
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const built=await p.evaluate(()=>{const A=typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO.lines||{};const cues=TKWALK.cues;return {view:document.body.className,shown:getComputedStyle(document.querySelector('#spWalk')).display,n:Object.keys(A).length,ids:cues.map(c=>c.id),d:TKWALK.duration,
   voiced:cues.filter(c=>A[c.id]&&A[c.id].a&&Math.abs(c.narr-A[c.id].d)<1e-6).length,chapters:TKWALK.chapters.map(c=>c.id),note:document.querySelector('#wkNote').hidden,tx:document.querySelector('#wkTx').textContent.length,
   pages:document.querySelectorAll('#wkStage .spw-pg').length,demo:/A\. Student \(sample\)/.test(document.querySelector('#wkStage').textContent),own:/Test Student|Elopement|R\. Smith/.test(document.querySelector('#wkStage').textContent),
   guide:!!document.querySelector('#wkStage .spw-pg .sp-ginit'),cells:document.querySelectorAll('#wkStage .cell').length,noInputs:document.querySelectorAll('#wkStage input,#wkStage button,#wkStage select').length===0};});
 ok('opening the view reads the narration once and builds the walkthrough with the recorded voice (15 lines, 4 chapters), the transcript filled',
   JSON.stringify(got)==='["nbh-sp1-narration.js"]'&&built.view==='view-walk'&&built.shown!=='none'&&built.n===15&&built.d>110&&built.voiced===built.ids.length&&built.chapters.join()==='sheet,mark,more,end'&&built.note&&built.tx>1500,built);
 ok('the two-level record plays the slash-and-shade lines',built.ids.join()==='intro,head,defs,grid,low,high,blank,x,codes,daily,sample,outro',built.ids);
 ok('the stage holds the simulated student\'s sheet and the guide page, as the paper prints (no fields or buttons), nothing of this record',built.pages===2&&built.demo&&!built.own&&built.guide&&built.cells>=80&&built.noInputs,built);
 const after=await p.evaluate(()=>({j:JSON.stringify(serialize()),cur:state.cur,inputs:[...document.querySelectorAll('#sheet input,#sheet textarea')].map(i=>i.value).join('|'),html:document.documentElement.className,beh:document.querySelectorAll('#behSeg button').length,
   dirty:!!(window.nbhState&&window.nbhState.unsaved&&window.nbhState.unsaved())}));
 ok('the record is exactly as it was: the saved state, the fields on screen, the behaviors, the current behavior',after.j===before.j&&after.inputs===before.inputs&&after.cur===before.cur&&after.html===before.html&&after.beh===2,{before:before.j.slice(0,200),after:after.j.slice(0,200),inputs:after.inputs===before.inputs,html:[before.html,after.html]});
 /* frames: the camera moves, glows show, the marks appear in the slash line and the X line, the captions follow the voice */
 const fr=await p.evaluate(()=>{const C=TKWALK.cues,at=id=>C.find(c=>c.id===id);const st=document.querySelector('#wkStage'),paper=st.querySelector('.spw-paper');
   const tf=()=>paper.style.transform;const td=(r,c)=>st.querySelectorAll('.spw-pg')[0].querySelectorAll('table.scatter tbody tr')[r].querySelectorAll('td.mark')[c];
   const out={};TKWALK.renderAt(1);out.home=tf();out.cap0=st.querySelector('.wk-cap').textContent.slice(0,30);
   TKWALK.renderAt(at('head').start+at('head').dur*.6);out.head=tf();out.glows=[...st.querySelectorAll('.spw-glow')].filter(e=>e.style.visibility==='visible').length;
   const L=at('low');TKWALK.renderAt(L.start+.3);out.lowBefore=td(2,1).querySelector('.cell').getAttribute('data-state');TKWALK.renderAt(L.start+L.dur-.2);out.lowAfter=td(2,1).querySelector('.cell').getAttribute('data-state');
   const H=at('high');TKWALK.renderAt(H.start+H.dur-.2);out.high=td(3,1).querySelector('.cell').getAttribute('data-state');out.highCap=st.querySelector('.wk-cap').textContent;
   const X=at('x');TKWALK.renderAt(X.start+X.dur-.2);out.x=td(6,2).querySelector('.cell').getAttribute('data-state');out.xg=td(6,2).querySelector('.glyph').textContent;out.thu=st.querySelectorAll('.spw-pg')[0].querySelectorAll('thead tr:first-child th')[5].classList.contains('sp-absent');out.col=td(0,3).querySelector('.cell').getAttribute('data-state');
   const Cd=at('codes');TKWALK.renderAt(Cd.start+Cd.dur-.2);out.code=td(3,1).querySelector('.glyph').textContent;
   const Sm=at('sample');TKWALK.renderAt(Sm.start+Sm.dur-.6);out.samp=[...st.querySelectorAll('.spw-samp')].some(e=>e.closest('.wk-o').style.visibility==='visible');
   TKWALK.renderAt(TKWALK.duration-.1);out.end=tf();out.endCap=st.querySelector('.wk-cap').textContent;
   TKWALK.renderAt(0);out.reset=td(2,1).querySelector('.cell').getAttribute('data-state')+td(6,2).querySelector('.cell').getAttribute('data-state');return out;});
 ok('the frames: the camera leaves home for the head and comes back at the end; a glow shows; the slash, the shade, the X, the whole-day X and the code letter appear in their lines and are gone again at 0; the SAMPLE word shows in its line',
   fr.home!==fr.head&&fr.glows>=1&&fr.lowBefore==='0'&&fr.lowAfter==='1'&&fr.high==='2'&&/legend/.test(fr.highCap)&&fr.x==='x'&&fr.xg==='X'&&fr.thu&&fr.col==='x'&&fr.code==='A'&&fr.samp&&/Thank you|Return the sheet/.test(fr.endCap)&&fr.reset==='00',fr);
 /* Save as video's painter paints the stage */
 const vid=await p.evaluate(async()=>{const cv=await TKVIDEO.frame(TKWALK.cues.find(c=>c.id==='grid').start+2,640);const g=cv.getContext('2d');const d=g.getImageData(0,0,cv.width,cv.height).data;let dark=0,light=0;for(let i=0;i<d.length;i+=4*37){const l=(d[i]+d[i+1]+d[i+2])/3;if(l<90)dark++;else if(l>235)light++;}return {w:cv.width,h:cv.height,dark,light};});
 ok('Save as video paints the stage (a frame with the white paper, its dark ink and the caption band)',vid.w===640&&vid.h===360&&vid.dark>200&&vid.light>2000,vid);
 /* the one-level and the count sheets play their own lines; the view rebuilds when the setup changes */
 const one=await p.evaluate(async()=>{state.cfg.levels=1;render();await new Promise(r=>setTimeout(r,300));return {ids:TKWALK.cues.map(c=>c.id).join(),lv:+state.cfg.levels};});
 ok('a shade-only record plays the mark and blank lines, no slash (the view rebuilt when the setup changed)',one.ids==='intro,head,defs,grid,mark,blank1,x,codes,daily,sample,outro',one);
 const cnt=await p.evaluate(async()=>{state.cfg.levels=2;state.cfg.mode='count';render();await new Promise(r=>setTimeout(r,300));const C=TKWALK.cues,K=C.find(c=>c.id==='count');const st=document.querySelector('#wkStage');const td=(r,c)=>st.querySelectorAll('.spw-pg')[0].querySelectorAll('table.scatter tbody tr')[r].querySelectorAll('td.mark')[c];
   TKWALK.renderAt(K.start+K.dur-.2);const o={ids:C.map(c=>c.id).join(),n1:td(2,1).querySelector('.count')&&td(2,1).querySelector('.count').textContent,n2:td(3,1).querySelector('.count')&&td(3,1).querySelector('.count').textContent,cls:td(3,1).className};TKWALK.renderAt(0);state.cfg.mode='tap';render();return o;});
 ok('a count record plays the count line, and the numbers are written into the cells',cnt.ids==='intro,head,defs,grid,count,blank,x,codes,daily,sample,outro'&&cnt.n1==='1'&&cnt.n2==='3'&&/lvl2/.test(cnt.cls),cnt);
 /* play, then leave the view: it pauses; back on the Data sheet the record shows */
 const pl=await p.evaluate(async()=>{TKWALK.play();await new Promise(r=>setTimeout(r,900));const was=TKWALK.playing,t=TKWALK.time;document.querySelector('#viewSeg [data-view="sheet"]').click();await new Promise(r=>setTimeout(r,300));
   return {was,t,now:TKWALK.playing,view:document.body.className,sheet:getComputedStyle(document.querySelector('#sheet')).display,walk:getComputedStyle(document.querySelector('#spWalk')).display,client:document.querySelector('#mClient').value};});
 ok('Play runs the clock; leaving the view pauses it and the Data sheet shows the record again',pl.was&&pl.t>0.3&&!pl.now&&pl.view==='view-sheet'&&pl.sheet!=='none'&&pl.walk==='none'&&pl.client==='Test Student (simulated)',pl);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
