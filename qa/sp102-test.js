/* v24.02 Form SP-1: the walkthrough's highlights on what the narrator names; the student's photo on the sheet (and DM-1's
   permission); the activity column as its own setting under Time and days. */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
const URL=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,500)));};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFklEQVR4nGP8z4AKmBhGBUYFRgUoFAAAt1kBBfwo9g8AAAAASUVORK5CYII=','base64');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(2200);
 /* the activity setting */
 const act=await p.evaluate(()=>{const al=document.getElementById('actOn');const g=al.closest('.tgroup');const col=[...document.querySelectorAll('.sp-panel .sp-col')].indexOf(g.closest('.sp-col'));return {col,label:g.firstElementChild.textContent,hint:(g.querySelector('.sp-hint')||{}).textContent||''};});
 ok('the activity column is its own setting under Time and days, with what it does',act.col===0&&act.label==='Activity beside each time'&&/beside its time/.test(act.hint),act);
 await p.evaluate(()=>{document.getElementById('actOn').click();});await sleep(300);
 ok('ticking it puts the activity column on the sheet',await p.evaluate(()=>state.cfg.actOn===true&&document.querySelectorAll('#sheet table.scatter input.sp-act').length>0));
 /* the photo */
 const ph0=await p.evaluate(()=>{const g=document.getElementById('spPhotoPick').closest('.tgroup');return {col:[...document.querySelectorAll('.sp-panel .sp-col')].indexOf(g.closest('.sp-col')),label:g.firstElementChild.textContent,hidden:document.getElementById('spPhoto').hidden,off:document.getElementById('spPhotoOff').hidden};});
 ok('a photo setting under Printing; no photo yet, so the slot and Remove are hidden',ph0.col===2&&/photo/.test(ph0.label)&&ph0.hidden&&ph0.off,ph0);
 fs.writeFileSync('/tmp/sp102-pic.png',PNG);await p.setInputFiles('#spPhotoFile','/tmp/sp102-pic.png');await sleep(800);
 const ph1=await p.evaluate(()=>({has:/^data:image\/jpeg/.test(state.meta.photo||''),on:state.meta.photoOn,shown:!document.getElementById('spPhoto').hidden&&!!document.querySelector('#spPhoto img'),saved:JSON.stringify(serialize()).includes('data:image/jpeg'),btn:document.getElementById('spPhotoPick').textContent,
   printed:(()=>{const pages=window.spPrintSet();return pages.some(x=>x.querySelector('.sp-photo img'));})()}));
 ok('a chosen picture becomes a 320 px photo kept with the record, shown in the sheet\'s head and printed',ph1.has&&ph1.on==='1'&&ph1.shown&&ph1.saved&&ph1.btn==='Change the photo'&&ph1.printed,ph1);
 await p.evaluate(()=>{document.getElementById('spPhotoOn').click();});await sleep(300);
 const ph2=await p.evaluate(()=>({on:state.meta.photoOn,hidden:document.getElementById('spPhoto').hidden,kept:!!state.meta.photo}));
 ok('"on the sheet" unticked keeps the photo in the record and takes it off the sheet',ph2.on==='0'&&ph2.hidden&&ph2.kept,ph2);
 await p.evaluate(()=>{document.getElementById('spPhotoOn').click();window.nbhCase.apply({profile:{flags:{photo:'No'}}});});await sleep(300);
 const ph3=await p.evaluate(()=>({hidden:document.getElementById('spPhoto').hidden,note:(document.getElementById('spPhotoNote')||{}).textContent||''}));
 ok('with Form DM-1\'s photo permission No, the photo is not shown and a note says so',ph3.hidden&&/permission on file is No/.test(ph3.note),ph3);
 await p.evaluate(()=>{window.nbhCase.apply({profile:{flags:{photo:'Yes'}}});});await sleep(200);
 ok('with the permission Yes again it shows',await p.evaluate(()=>!document.getElementById('spPhoto').hidden&&!document.getElementById('spPhotoNote')));
 await p.evaluate(()=>{document.getElementById('spPhotoOff').click();});await sleep(200);
 ok('Remove the photo takes it out of the record',await p.evaluate(()=>!state.meta.photo&&document.getElementById('spPhoto').hidden));
 /* the walkthrough's highlights */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const gl=await p.evaluate(()=>{const C=TKWALK.cues,st=document.querySelector('#wkStage');const P1=st.querySelector('.spw-pg');
   const off=el=>{let x=0,y=0,n=el;while(n&&n!==P1){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}return {x,y,w:el.offsetWidth,h:el.offsetHeight};};
   const near=(g,r)=>Math.abs(parseFloat(g.style.left)+parseFloat(g.style.width)/2-(r.x+r.w/2))<2&&Math.abs(parseFloat(g.style.top)+parseFloat(g.style.height)/2-(r.y+r.h/2))<2&&Math.abs(parseFloat(g.style.width)-r.w)<=12;
   const vis=t=>{TKWALK.renderAt(t);return [...st.querySelectorAll('.spw-glow')].filter(e=>e.style.visibility==='visible');};
   const H=C.find(c=>c.id==='head');const gh=vis(H.start+H.dur*.9);
   const obs=[...P1.querySelectorAll('.ident .f label')].find(l=>/Observer/.test(l.textContent)).closest('.f');const photo=P1.querySelector('.sp-photo');
   const G=C.find(c=>c.id==='grid');const gg=vis(G.start+G.dur*.9);const dates=[...P1.querySelectorAll('table.scatter td.dateline')];
   const dl=dates.map(off);const dr={x:Math.min(...dl.map(r=>r.x)),y:Math.min(...dl.map(r=>r.y)),w:Math.max(...dl.map(r=>r.x+r.w))-Math.min(...dl.map(r=>r.x)),h:Math.max(...dl.map(r=>r.y+r.h))-Math.min(...dl.map(r=>r.y))};
   const L=C.find(c=>c.id==='low');const glw=vis(L.start+L.dur*.9);const td=P1.querySelectorAll('table.scatter tbody tr')[2].querySelectorAll('td.mark')[1];
   return {headN:gh.length,photo:!!photo&&!photo.hidden&&!!photo.querySelector('img')&&[...st.querySelectorAll('.spw-glow')].some(g=>near(g,off(photo))),obs:[...st.querySelectorAll('.spw-glow')].some(g=>near(g,off(obs))),dateline:[...st.querySelectorAll('.spw-glow')].some(g=>near(g,dr)),cell:glw.some(g=>near(g,off(td)))};});
 ok('the glows sit on what is named: the observer field, the photo slot (a drawn placeholder), the date line, the slashed cell',gl.photo&&gl.obs&&gl.dateline&&gl.cell,gl);
 ok('the Walkthrough view is never zoomed by Fit',await p.evaluate(()=>getComputedStyle(document.getElementById('spWalk')).zoom==='1'||getComputedStyle(document.getElementById('spWalk')).zoom==='normal'||getComputedStyle(document.getElementById('spWalk')).zoom===''));
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
