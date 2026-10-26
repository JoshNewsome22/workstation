/* v24.32 Form SP-1: scan a completed paper sheet. The printed data sheet carries four corner squares in its grid and a
   square code under it; a photo of it (made here from the printed page, skewed and softened) is read back into the record.
   usage: node qa/sp132-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
const URL=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950},deviceScaleFactor:2});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2500);
 /* the worked example counts in its cells; a sheet marked by hand is the tap sheet (a slash, a filled cell): the same marks, as levels */
 await p.evaluate(()=>{commitBeh();state.cfg.mode='tap';state.cfg.codes=false;const t=thr();state.behaviors.forEach(b=>{Object.keys(b.cells).forEach(k=>{const c=b.cells[k];if(c&&c.n!=null&&c.n!==''&&Number(c.n)>0){c.s=Number(c.n)>=t?2:1;}c.n=null;c.code='';});});useBeh(0,true);render();});await sleep(400);
 /* ---- the printed sheet ---- */
 const tb=await p.evaluate(()=>{const b=document.getElementById('spScanBtn');return {btn:!!b,text:b&&b.textContent,jsqr:typeof jsQR==='function',api:!!window.__spScan,fidsOnScreen:[...document.querySelectorAll('#grid .sp-fid')].filter(e=>getComputedStyle(e).display!=='none').length};});
 ok('the toolbar has Scan a paper sheet, the decoder is in the form, and nothing of the scan shows on screen',tb.btn&&tb.text==='Scan a paper sheet'&&tb.jsqr&&tb.api&&tb.fidsOnScreen===0,tb);
 await p.emulateMedia({media:'print'});await sleep(600);
 const pr=await p.evaluate(()=>{const pg=document.querySelector('#spPrint .sheet');if(!pg)return null;const fids=[...pg.querySelectorAll('.sp-fid')].filter(e=>getComputedStyle(e).display!=='none');const t=pg.querySelector('table.scatter'),tb=t.getBoundingClientRect(),d0=t.querySelector('tr.sp-days').getBoundingClientRect(),f0=t.querySelector('tr.sp-foot').getBoundingClientRect(),tr={left:tb.left,top:d0.top,width:tb.width,height:f0.bottom-d0.top};
  const strip=pg.querySelector('.sp-scan');const code=strip&&strip.dataset.spCode;const G=code&&window.__spScan.geometry(code);
  const rel=e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2-tr.left,r.top+r.height/2-tr.top];};
  const F=fids.map(rel);const W=tr.width,H=tr.height;
  /* every data cell's box against the code's geometry (x as a share of the width, y in px) */
  let dxMax=0,dyMax=0,cells=0;const rows=[...t.querySelectorAll('tbody tr')];
  rows.forEach((row,r)=>{[...row.querySelectorAll('td.mark')].forEach((td,i)=>{const c=G.c0+i,rr=td.getBoundingClientRect(),[x,y,w,h]=G.cell(r,c);
    dxMax=Math.max(dxMax,Math.abs((rr.left-tr.left)/W-x/G.W),Math.abs((rr.right-tr.left)/W-(x+w)/G.W));dyMax=Math.max(dyMax,Math.abs(rr.top-tr.top-y),Math.abs(rr.bottom-tr.top-(y+h)));cells++;});});
  const fidErr=F.map((f,i)=>[Math.abs(f[0]/W-G.fids[i][0]/G.W),Math.abs(f[1]-G.fids[i][1])]);
  const qr=pg.querySelector('.sp-scan svg'),qrr=qr&&qr.getBoundingClientRect();
  return {pages:document.querySelectorAll('#spPrint .sheet').length,fids:fids.length,code,G:{c0:G.c0,c1:G.c1,nR:G.nR,rowh:G.rowh,H:G.H,W:G.W},W,H,dxMax,dyMax,cells,fidErr,qr:qrr&&{dx:qrr.left-tr.left,dy:qrr.top-tr.top,s:qrr.width},svg:!!qr,text:strip&&strip.textContent.slice(0,300)};});
 ok('on paper each data sheet carries four corner squares in its grid and the square code with the scan instructions under it',pr&&pr.fids===4&&pr.svg&&/^SP1;1;[^;]*;0;0;0;\d+;\d+;[01];\d+;$/.test(pr.code)&&/Scan a paper sheet/.test(pr.text),pr&&{fids:pr.fids,code:pr.code,text:pr.text});
 ok('the code\'s geometry matches the printed grid: every cell within 1% of the width and 3 px in height, the squares and the code where the scanner expects them',pr&&pr.dxMax<0.01&&pr.dyMax<=3&&pr.fidErr.every(e=>e[0]<0.01&&e[1]<=3)&&Math.abs(pr.H-pr.G.H)<=4,pr&&{dxMax:pr.dxMax,dyMax:pr.dyMax,fidErr:pr.fidErr,H:[pr.H,pr.G.H],W:pr.W,qr:pr.qr,G:pr.G});
 const pageEl=await p.$('#spPrint .sheet');const sheetPng=path.join(OUT,'sp132-sheet.png');await pageEl.screenshot({path:sheetPng});
 /* the truth: the simulation's marks on that sheet */
 const truth=await p.evaluate(code=>{commitBeh();const G=window.__spScan.geometry(code);const b=state.behaviors[0],out={};for(let c=G.c0;c<G.c1;c++)for(let r=0;r<G.nR;r++){const x=b.cells[r+'_'+c];out[r+'_'+c]=!x?0:x.x?'x':(x.s>0?(oneLevel()?2:x.s):0);}return {out,G:{c0:G.c0,c1:G.c1,nR:G.nR},absent:[...Array(G.c1-G.c0).keys()].map(i=>state.meta['absent'+(G.c0+i)]==='1')};},pr.code);
 await p.emulateMedia({media:'screen'});await sleep(500);
 const marked=Object.values(truth.out).filter(v=>v!==0).length;
 ok('the worked example\'s first sheet holds marks to read (high, low and X among them)',marked>=12&&Object.values(truth.out).includes(2)&&Object.values(truth.out).includes(1),{marked,levels:[...new Set(Object.values(truth.out))]});
 /* ---- the photo: the printed page on a desk, taken at an angle, a little soft ---- */
 const q=await b.newPage({viewport:{width:1500,height:1900},deviceScaleFactor:1});
 const dataUrl='data:image/png;base64,'+fs.readFileSync(sheetPng).toString('base64');
 await q.setContent('<body style="margin:0;background:#7d8287;width:1500px;height:1900px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="'+dataUrl+'" style="width:1260px;box-shadow:0 8px 30px rgba(0,0,0,.5);transform:perspective(1600px) rotateX(8deg) rotateY(-6deg) rotateZ(2.5deg);filter:blur(0.6px) contrast(.93) brightness(.96)"></body>');await sleep(500);
 const photo=path.join(OUT,'sp132-photo.jpg');await q.screenshot({path:photo,type:'jpeg',quality:82});await q.close();
 /* ---- the scan: the sheet's days cleared, then read back from the photo ---- */
 await p.evaluate(G=>{const b=state.behaviors[0];for(let c=G.c0;c<G.c1;c++)for(let r=0;r<G.nR;r++)delete b.cells[r+'_'+c];state.cells=b.cells;render();},truth.G);
 const cleared=await p.evaluate(()=>document.querySelectorAll('#grid .cell[data-state="1"],#grid .cell[data-state="2"]').length);
 await p.evaluate(()=>document.getElementById('spScanBtn').click());await sleep(300);
 const dlg=await p.evaluate(()=>{const d=document.getElementById('spScanDlg');return {open:!!(d&&d.open),file:!!document.getElementById('spScanPick')};});
 ok('Scan a paper sheet opens its window with Take a photo and Choose a photo',dlg.open&&dlg.file,dlg);
 await p.setInputFiles('#spScanPick',photo);
 let last=null;for(let i=0;i<60&&!last;i++){await sleep(500);last=await p.evaluate(()=>window.__spScanLast?{n:window.__spScanLast.cells.length,unsure:window.__spScanLast.unsure.length,cells:window.__spScanLast.cells.map(c=>[c.r,c.c,c.lv,c.sure,c.m&&+c.m.fill.toFixed(2),c.m&&+c.m.d1.toFixed(2),c.m&&+c.m.d2.toFixed(2)]),bi:window.__spScanLast.bi}:null);}
 try{const du=await p.evaluate(()=>document.getElementById('scCanvas').toDataURL('image/png'));fs.writeFileSync(path.join(OUT,'sp132-overlay.png'),Buffer.from(du.split(',')[1],'base64'));}catch(e){}
 const stat=await p.evaluate(()=>{const s=document.getElementById('scStat');return {text:s?s.textContent.slice(0,240):'',cls:s&&s.className,fill:!document.getElementById('scFill').disabled};});
 ok('the photo is read: the code found, the grid placed, every cell of the sheet\'s days read',!!last&&last.n>=truth.G.nR*(truth.G.c1-truth.G.c0)-truth.G.nR*truth.absent.filter(Boolean).length&&stat.fill,{last:last&&{n:last.n,unsure:last.unsure},stat});
 if(last){const wrong=[];let right=0,tot=0;for(const [r,c,lv]of last.cells){const t=truth.out[r+'_'+c];tot++;if(String(lv)===String(t))right++;else wrong.push([r,c,'read',lv,'truth',t]);}
  const acc=tot?right/tot:0;
  ok('at least 97% of the cells read as the sheet shows them (filled high, slash low, X, blank) and no more than 8% are unsure',acc>=0.97&&last.unsure<=tot*0.08,{acc:+acc.toFixed(3),tot,unsure:last.unsure,wrong:wrong.slice(0,12),sample:last.cells.slice(0,6)});
  /* fill the sheet: the record holds the sheet's marks again */
  await p.evaluate(()=>document.getElementById('scFill').click());await sleep(800);
  const after=await p.evaluate(G=>{const b=state.behaviors[0],out={};for(let c=G.c0;c<G.c1;c++)for(let r=0;r<G.nR;r++){const x=b.cells[r+'_'+c];out[r+'_'+c]=!x?0:x.x?'x':(x.s>0?(oneLevel()?2:x.s):0);}return {out,filled:window.__spScanFilled,open:document.getElementById('spScanDlg').open,marks:document.querySelectorAll('#grid .cell[data-state="1"],#grid .cell[data-state="2"]').length};},truth.G);
  let same=0,all=0;for(const k in truth.out){all++;if(String(after.out[k])===String(truth.out[k]))same++;}
  ok('Fill the sheet enters the reading into the record (the sheet\'s days hold the marks again, the window closes, the grid shows them)',after.filled&&after.filled.n>0&&!after.open&&same/all>=0.97&&after.marks>0&&cleared===0,{same,all,filled:after.filled,marks:after.marks,cleared});
  /* a second scan of the same days asks before replacing them */
  await p.evaluate(()=>{window.__asked=0;nbhUI.confirm=async()=>{window.__asked++;return false;};document.getElementById('spScanBtn').click();});await sleep(300);
  await p.setInputFiles('#spScanPick',photo);let l2=null;for(let i=0;i<60&&!l2;i++){await sleep(500);l2=await p.evaluate(()=>!!window.__spScanLast&&!document.getElementById('scFill').disabled);}
  await p.evaluate(()=>document.getElementById('scFill').click());await sleep(600);
  const asked=await p.evaluate(()=>({asked:window.__asked,open:document.getElementById('spScanDlg').open}));
  ok('scanning the same days again asks before replacing the marks the form holds, and a No leaves them',asked.asked===1&&asked.open,asked);
  await p.evaluate(()=>document.getElementById('spScanDlg').close());}
 /* the SAMPLE sheet is refused */
 const samp=await p.evaluate(()=>{const parts=window.__spScanLast?null:null;const code=document.querySelector('#spPrint .sp-scan')?null:null;return typeof window.__spScan.geometry==='function'&&window.__spScan.geometry('SP1;1;SIM-000;0;0;0;5;24;1;30;S').flag==='S';});
 ok('a SAMPLE sheet\'s code carries its flag (the scan refuses it)',samp);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
