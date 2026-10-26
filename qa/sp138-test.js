/* v24.38 the sheet code found in a real photo. An iPad photo is 4032 px wide and the sheet fills about half of it, so the
   code is a few picture pixels a module in the scanner's frame and one pass missed it. Here a printed SP-1 sheet, marked
   in pencil grey (one-level: shaded or X), is photographed into a 4032 x 3024 frame at an angle and read back: the code is
   found (the frame pass alone misses it), the grid placed, every mark read against the paper around it; the same photo
   shrunk to 2016 px reads too. ABC-1's and DD-1's sheets, photographed small in a 4032 frame, get past the code as well.
   usage: node qa/sp138-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
async function photo(b,sheetPng,file,fw,fh,imgW,filter){const q=await b.newPage({viewport:{width:fw,height:fh},deviceScaleFactor:1});const dataUrl='data:image/png;base64,'+fs.readFileSync(sheetPng).toString('base64');
  await q.setContent('<body style="margin:0;background:#8a8d90;width:'+fw+'px;height:'+fh+'px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="'+dataUrl+'" style="width:'+imgW+'px;box-shadow:0 8px 30px rgba(0,0,0,.5);transform:perspective(2600px) rotateX(7deg) rotateY(-5deg) rotateZ(2deg);filter:'+filter+'"></body>');await sleep(600);
  await q.screenshot({path:file,type:'jpeg',quality:80});await q.close();return file;}
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 /* ---- SP-1: a one-level sheet marked in pencil ---- */
 const ctx=await b.newContext({viewport:{width:1300,height:950},deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('SP-1: '+String(e).slice(0,120)));
 await p.goto(BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1500);
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2500);
 const made=await p.evaluate(()=>{commitBeh();Object.assign(state.cfg,{mode:'tap',codes:false,levels:1,perSheet:10});state.meta.sid='SIM-000';let k=0,xs=0;
   window.__xCells=[];state.behaviors.forEach((b,bi)=>{Object.keys(b.cells).forEach(key=>{const c=b.cells[key];const on=c&&c.n!=null&&c.n!==''&&Number(c.n)>0;c.n=null;c.code='';delete c.x;if(on){k++;if(k%7===0){c.s=0;xs++;if(bi===0)window.__xCells.push(key);}else c.s=2;}else c.s=0;});});
   useBeh(0,true);render();return {k,xs,rows:rowLabels().length,pages:pageRanges()};});
 ok('a one-level record (shaded or X, no slash) with marks and a few X cells',made.k>=20&&made.xs>=2&&made.rows>=8,made);
 await p.emulateMedia({media:'print'});await sleep(600);
 const pr=await p.evaluate(()=>{const pg=document.querySelector('#spPrint .sheet');const strip=pg&&pg.querySelector('.sp-scan');return {code:strip&&strip.dataset.spCode,qr:!!(strip&&strip.querySelector('svg'))};});
 ok('the printed sheet carries its code (unchanged: every sheet already printed scans)',pr.qr&&/^SP1;1;SIM-000;0;0;0;\d+;\d+;[01];\d+;$/.test(pr.code||''),pr);
 /* the X cells drawn by hand on the printed sheet (two pencil lines corner to corner, a little off) */
 const drawn=await p.evaluate(code=>{const G=window.__spScan.geometry(code);const pg=document.querySelector('#spPrint .sheet'),R=pg.getBoundingClientRect(),t=pg.querySelector('table.scatter');const NS='http://www.w3.org/2000/svg';const svg=document.createElementNS(NS,'svg');svg.setAttribute('style','position:absolute;left:0;top:0;width:'+R.width+'px;height:'+R.height+'px;pointer-events:none;overflow:visible');svg.setAttribute('viewBox','0 0 '+R.width+' '+R.height);
   pg.style.position='relative';const rows=[...t.querySelectorAll('tbody tr')];let n=0;rows.forEach((row,r)=>{[...row.querySelectorAll('td.mark')].forEach((td,i)=>{const c=G.c0+i;if(!window.__xCells.includes(r+'_'+c))return;const rr=td.getBoundingClientRect();const x=rr.left-R.left,y=rr.top-R.top,w=rr.width,h=rr.height,j=(n%3)-1;n++;
     [[x+2+j,y+3,x+w-3,y+h-2+j],[x+2,y+h-3+j,x+w-2+j,y+2]].forEach(l=>{const ln=document.createElementNS(NS,'line');ln.setAttribute('x1',l[0]);ln.setAttribute('y1',l[1]);ln.setAttribute('x2',l[2]);ln.setAttribute('y2',l[3]);ln.setAttribute('stroke','#2a2a2a');ln.setAttribute('stroke-width','1.8');ln.setAttribute('stroke-linecap','round');svg.appendChild(ln);});});});
   pg.appendChild(svg);return n;},pr.code);
 const pageEl=await p.$('#spPrint .sheet');const sheetPng=path.join(OUT,'sp138-sheet.png');await pageEl.screenshot({path:sheetPng});
 await p.evaluate(()=>{const pg=document.querySelector('#spPrint .sheet');const s=pg.querySelector('svg[style*="pointer-events"]');if(s)s.remove();});
 const truth=await p.evaluate(code=>{const G=window.__spScan.geometry(code);const b=state.behaviors[0],out={};for(let c=G.c0;c<G.c1;c++)for(let r=0;r<G.nR;r++){const x=b.cells[r+'_'+c];out[r+'_'+c]=window.__xCells.includes(r+'_'+c)?'x':(!x?0:(x.s>0?2:0));}return {out,G:{c0:G.c0,c1:G.c1,nR:G.nR},absent:[...Array(G.c1-G.c0).keys()].map(i=>state.meta['absent'+(G.c0+i)]==='1')};},pr.code);
 ok('the printed sheet to read holds X cells drawn by hand',drawn>=2,{drawn});
 await p.emulateMedia({media:'screen'});await sleep(400);
 /* the photos: the page at about half the width of a 4032 x 3024 frame, the marks a pencil grey; the same shrunk to 2016 */
 const big=await photo(b,sheetPng,path.join(OUT,'sp138-photo-4032.jpg'),4032,3024,1750,'blur(0.9px) contrast(.62) brightness(1.1)');
 const small=await photo(b,sheetPng,path.join(OUT,'sp138-photo-2016.jpg'),2016,1512,875,'blur(0.5px) contrast(.62) brightness(1.1)');
 /* the frame pass alone misses the code in the big photo (the reason for the tile search) */
 const framePass=await p.evaluate(async b64=>{const res=await fetch('data:image/jpeg;base64,'+b64);const bm=await createImageBitmap(await res.blob());const cv=document.createElement('canvas');const sc=Math.min(1,1800/Math.max(bm.width,bm.height));cv.width=Math.round(bm.width*sc);cv.height=Math.round(bm.height*sc);const ctx=cv.getContext('2d');ctx.drawImage(bm,0,0,cv.width,cv.height);const d=ctx.getImageData(0,0,cv.width,cv.height);
   const q=jsQR(d.data,cv.width,cv.height,{inversionAttempts:'dontInvert'});const t0=performance.now();const q2=await window.__spScan.findCode(d,cv.width,cv.height,bm,sc);return {frame:q&&q.data.slice(0,4),tiles:q2&&q2.data.slice(0,4),ms:Math.round(performance.now()-t0),bm:[bm.width,bm.height],loc:q2&&q2.location&&[Math.round(q2.location.topLeftCorner.x),Math.round(q2.location.topLeftCorner.y)]};},fs.readFileSync(big).toString('base64'));
 ok('in the 4032 px photo the tile search finds the code and maps its place into the frame (left half, lower part)'+(framePass.frame==='SP1;'?' (the one frame pass found it too here)':' (the one frame pass misses it)'),
   framePass.tiles==='SP1;'&&framePass.loc&&framePass.loc[0]<900&&framePass.loc[1]>600,framePass);
 async function scan(file,label){await p.evaluate(()=>{const b=state.behaviors[0];Object.keys(b.cells).forEach(k=>{delete b.cells[k];});useBeh(0,true);render();window.__spScanLast=null;document.getElementById('spScanBtn').click();});await sleep(300);
   await p.setInputFiles('#spScanPick',file);let last=null;for(let i=0;i<80&&!last;i++){await sleep(500);last=await p.evaluate(()=>window.__spScanLast||null);}
   const st=await p.evaluate(()=>document.getElementById('scStat').textContent);try{const du=await p.evaluate(()=>document.getElementById('scCanvas').toDataURL('image/jpeg',0.8));fs.writeFileSync(path.join(OUT,'sp138-overlay-'+label+'.jpg'),Buffer.from(du.split(',')[1],'base64'));}catch(e){}
   if(!last)return {st};const got={};last.cells.forEach(c=>{got[c.r+'_'+c.c]=c.lv;});let right=0,wrong=[],marksRight=0,marks=0;for(const k in truth.out){if(!(k in got))continue;const t=truth.out[k];if(t!==0)marks++;if(got[k]===t){right++;if(t!==0)marksRight++;}else wrong.push(k+':'+t+'>'+got[k]);}
   return {st:st.slice(0,120),n:last.cells.length,right,total:Object.keys(got).length,marks,marksRight,unsure:last.unsure.length,wrong:wrong.slice(0,12)};}
 const r1=await scan(big,'4032');
 ok('the 4032 px photo is read: the code found, the grid placed, the pencil-grey marks and the X cells read (19 in 20 cells right, 9 in 10 of the marks)',
   r1.n>0&&/Read:/.test(r1.st)&&r1.right>=r1.total*0.95&&r1.marksRight>=r1.marks*0.9,r1);
 const r2=await scan(small,'2016');
 ok('the same photo shrunk to 2016 px (a screenshot, a shared picture) is read as well',r2.n>0&&/Read:/.test(r2.st)&&r2.right>=r2.total*0.92&&r2.marksRight>=r2.marks*0.85,r2);
 /* the unsure chooser speaks the one-level sheet's language */
 const ch=await p.evaluate(()=>[...document.querySelectorAll('#scUnsure select')].slice(0,1).map(s=>[...s.options].map(o=>o.textContent)));
 ok('on a one-level sheet an unsure cell is chosen among blank, shaded and X (no slash)',!ch.length||ch[0].join('|')==='blank|shaded (occurred)|X, not observed',ch);
 await p.close();
 /* ---- ABC-1: the incident sheet small in a 4032 frame ---- */
 const pa=await ctx.newPage();pa.on('pageerror',e=>errs.push('ABC-1: '+String(e).slice(0,120)));await pa.goto(BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html');await sleep(1500);
 await pa.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});await pa.emulateMedia({media:'print'});await sleep(300);
 await pa.evaluate(()=>{const host=document.querySelector('#abcPaper');host.innerHTML=abcPaper.html('blank');document.documentElement.classList.add('abc-paper');abcScan.tag(host,'inc','');host.style.padding='40px';host.style.background='#fff';host.style.width='810px';});
 const abcPng=path.join(OUT,'sp138-abc-sheet.png');await (await pa.$('#abcPaper')).screenshot({path:abcPng});
 await pa.evaluate(()=>{document.documentElement.classList.remove('abc-paper');const h=document.querySelector('#abcPaper');h.innerHTML='';h.style.cssText='';});await pa.emulateMedia({media:'screen'});await sleep(300);
 const abcPhoto=await photo(b,abcPng,path.join(OUT,'sp138-abc-photo.jpg'),4032,3024,2000,'blur(0.6px) contrast(.9) brightness(1.02)');
 await pa.evaluate(()=>document.getElementById('abcScanBtn').click());await sleep(300);await pa.setInputFiles('#abcScanPick',abcPhoto);
 let ast='';for(let i=0;i<80;i++){await sleep(500);ast=await pa.evaluate(()=>document.getElementById('abScStat').textContent);if(/No sheet code|Read|read|boxes|found|squares|corner/i.test(ast)&&!/Reading the photo/.test(ast))break;}
 ok('ABC-1: the incident sheet at half the width of a 4032 px photo gets past the code (it was missed at one pass)',ast&&!/No sheet code/.test(ast),{ast:ast.slice(0,160)});await pa.close();
 /* ---- DD-1: the data sheet small in a 4032 frame ---- */
 const dctx=await b.newContext({viewport:{width:1010,height:1000},deviceScaleFactor:2});const pd=await dctx.newPage();pd.on('pageerror',e=>errs.push('DD-1: '+String(e).slice(0,120)));
 await pd.goto(BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html');await sleep(1500);await pd.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('btnLoadExample').click();});await sleep(2500);
 await pd.evaluate(()=>{showTab('data');applyColW(true);document.getElementById('btnBlankWeek').click();});await sleep(600);await pd.emulateMedia({media:'print'});await sleep(400);
 await pd.evaluate(()=>{window.__ddPrintLabel='Blank data sheet';applyColW(true);ddScan.tag();document.querySelector('.sheet-wrap').style.cssText+=';padding:40px;background:#fff';});await sleep(300);
 const ddPng=path.join(OUT,'sp138-dd-sheet.png');await (await pd.$('.sheet-wrap')).screenshot({path:ddPng});
 await pd.evaluate(()=>{document.querySelector('.sheet-wrap').style.padding='';});await pd.emulateMedia({media:'screen'});await sleep(300);
 const ddPhoto=await photo(b,ddPng,path.join(OUT,'sp138-dd-photo.jpg'),4032,3024,2600,'blur(0.6px) contrast(.9) brightness(1.02)');
 await pd.evaluate(()=>{document.getElementById('ddBlankBack').click();});await sleep(300);await pd.evaluate(()=>document.getElementById('ddScanBtn').click());await sleep(300);await pd.setInputFiles('#ddScanPick',ddPhoto);
 let dst='';for(let i=0;i<80;i++){await sleep(500);dst=await pd.evaluate(()=>document.getElementById('ddScStat').textContent);if(dst&&!/Reading the photo|Looking/.test(dst))break;}
 ok('DD-1: the data sheet at two thirds of a 4032 px photo gets past the code',dst&&!/No sheet code/.test(dst),{dst:dst.slice(0,160)});await pd.close();
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
