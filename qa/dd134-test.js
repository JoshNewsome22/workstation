/* v24.34 Form DD-1: a completed daily data sheet entered from a photo. The printed blank week carries four corner rings, a
   code in the Date heading and a five-mark code in each day's date cell; its layout is kept with the record at print time.
   A photo of the sheet (made here from the printed sheet with numbers written into some cells, skewed and softened) is
   straightened, its days read, its cells cut out and told blank from written; the written ones are typed beside their
   pictures and entered into the record. usage: node qa/dd134-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
const URL=BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1010,height:1000},deviceScaleFactor:2});   /* about a landscape page's printable width */
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});document.getElementById('btnLoadExample').click();});await sleep(1500);
 await p.evaluate(()=>{showTab('data');document.getElementById('btnBlankWeek').click();});await sleep(800);
 const scr=await p.evaluate(()=>({btn:!!document.getElementById('ddScanBtn'),text:(document.getElementById('ddScanBtn')||{}).textContent,jsqr:typeof jsQR==='function',api:!!window.ddScan,
   onScreen:[...document.querySelectorAll('#dataTable .dd-fid,#dataTable .dd-code,#dataTable .dd-rc,#dataTable tfoot.dd-scanfoot')].filter(e=>getComputedStyle(e).display!=='none').length,marks:document.querySelectorAll('#dataTable .dd-rc').length,blank:document.body.classList.contains('dd-blank-on')}));
 ok('the Data tab has Enter a paper sheet from a photo beside Print this sheet, the decoder is in the form, and on screen none of the marks show (the blank week is up, five day marks placed)',scr.btn&&/paper sheet from a photo/.test(scr.text)&&scr.jsqr&&scr.api&&scr.onScreen===0&&scr.marks===5&&scr.blank,scr);
 /* ---- the sheet as it prints: the rings, the code, the row marks, the layout kept ---- */
 await p.evaluate(()=>{window.__ddPrintLabel='Blank data sheet';applyColW(true);});   /* as beforeprint does */
 await p.emulateMedia({media:'print'});await sleep(500);
 const pr=await p.evaluate(()=>{const code=ddScan.tag();const t=document.getElementById('dataTable'),R=t.getBoundingClientRect();
   const f=['tl','tr','bl','br'].map(k=>{const e=t.querySelector('.dd-'+k);const r=e.getBoundingClientRect();return [Math.round(r.left-R.left),Math.round(r.top-R.top),Math.round(r.right-R.left),Math.round(r.bottom-R.top),getComputedStyle(e).display,getComputedStyle(e).borderTopWidth];});
   const pid=code&&code.split(';')[3];const L=S.scanLayouts&&S.scanLayouts[pid];
   const rc=[...t.querySelectorAll('tbody tr .dd-rc')].map(e=>[...e.querySelectorAll('b')].map(x=>x.classList.contains('on')?1:0).join(''));
   return {code,W:Math.round(R.width),H:Math.round(R.height),f,svg:!!t.querySelector('.dd-code svg'),L:L&&{n:L.n,cells:L.cells.length,dates:L.dates,pitch:L.pitch,theadH:L.theadH,kind:L.kind,bits:L.bits.length,hash:L.hash},rc,foot:getComputedStyle(t.querySelector('tfoot.dd-scanfoot')).display};});
 ok('printed, the sheet carries a code in the Date heading (student, print id, layout signature, the blank-week kind), four 11 px rings at the table\'s corners (two in the head row, two in the foot row under the rows), and a five-mark code 1..5 in the date cells',
   /^DD1;1;SIM-000;[a-z0-9]{6};[0-9a-z]{1,7};b$/.test(pr.code||'')&&pr.svg&&pr.f.every(x=>x[4]!=='none'&&x[5]==='3px')&&Math.abs(pr.f[0][0])<=2&&Math.abs(pr.f[0][1])<=2&&Math.abs(pr.f[1][2]-pr.W)<=2&&Math.abs(pr.f[2][0])<=2&&Math.abs(pr.f[2][3]-pr.H)<=2&&Math.abs(pr.f[3][2]-pr.W)<=2&&pr.rc.join(',')==='00001,00010,00011,00100,00101'&&pr.foot==='table-footer-group',pr);
 ok('its layout is kept with the record: five days with their dates, the cells of every behavior (two for a correct-of-opportunities target) and the notes, the row pitch',
   pr.L&&pr.L.n===5&&pr.L.dates.length===5&&pr.L.dates.every(d=>/^\d{4}-\d\d-\d\d$/.test(d))&&pr.L.cells===8&&pr.L.bits===5&&pr.L.kind==='b'&&pr.L.pitch>200,pr.L);
 /* ---- the sheet filled in by hand: numbers written into some cells ---- */
 const truth=await p.evaluate(()=>{const t=document.getElementById('dataTable');const rows=[...t.querySelectorAll('tbody tr[data-r]')];const W={};let k=0;
   const vals=['3','12','0','7','1.5','4','20','18','2','0','9','11','5','6','3','15'];
   let c=0;rows.forEach((tr,ri)=>{[...tr.querySelectorAll('td')].forEach(td=>{const inp=td.querySelector('input[data-v],input[data-f="notes"]');if(!inp)return;const key=inp.dataset.v||'notes';
     const on=(c++%3)!==1;   /* about two cells in three written */
     if(!on)return;const v=key==='notes'?(ri%2?'sub today':''):vals[k++%vals.length];if(v==='')return;W[ri+'|'+key]=v;
     /* the cell is boxed and clipped on paper, so the writing goes into the printed box itself, in a hand-sized face */
     inp.value=v;inp.style.cssText+=';font:'+(key==='notes'?'13px':'17px')+' "Comic Sans MS",cursive,sans-serif;color:#1b1b1b;text-align:left;padding-left:'+(key==='notes'?6:6+(ri*5)%14)+'px;letter-spacing:1px';});});
   document.querySelector('.sheet-wrap').style.cssText+=';padding:40px;background:#fff';return W;});
 const wrap=await p.$('.sheet-wrap');const sheetPng=path.join(OUT,'dd134-sheet.png');await wrap.screenshot({path:sheetPng});
 await p.evaluate(()=>{document.querySelector('.sheet-wrap').style.padding='';document.querySelectorAll('#dataTable tbody input').forEach(i=>{i.value='';i.style.cssText='';});});
 await p.emulateMedia({media:'screen'});await sleep(400);
 ok('the sheet to read holds numbers in about two cells of three, and a note',Object.keys(truth).length>=18&&Object.values(truth).some(v=>/sub/.test(v)),{n:Object.keys(truth).length});
 /* ---- the photo: the page on a desk, at an angle, a little soft ---- */
 const qpage=await b.newPage({viewport:{width:2300,height:1800},deviceScaleFactor:1});
 const dataUrl='data:image/png;base64,'+fs.readFileSync(sheetPng).toString('base64');
 await qpage.setContent('<body style="margin:0;background:#7d8287;width:2300px;height:1800px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="'+dataUrl+'" style="width:2000px;box-shadow:0 8px 30px rgba(0,0,0,.5);transform:perspective(2200px) rotateX(6deg) rotateY(-4deg) rotateZ(1.5deg);filter:blur(0.5px) contrast(.95) brightness(.97)"></body>');await sleep(500);
 const photo=path.join(OUT,'dd134-photo.jpg');await qpage.screenshot({path:photo,type:'jpeg',quality:82});await qpage.close();
 /* ---- the entry from the photo ---- */
 await p.evaluate(()=>document.getElementById('ddScanBtn').click());await sleep(300);
 const dlg=await p.evaluate(()=>{const d=document.getElementById('ddScanDlg');return {open:!!(d&&d.open),file:!!document.getElementById('ddScanPick')};});
 ok('Enter a paper sheet from a photo opens its window with Take a photo and Choose a photo',dlg.open&&dlg.file,dlg);
 await p.setInputFiles('#ddScanPick',photo);
 let last=null;for(let i=0;i<60&&!last;i++){await sleep(500);last=await p.evaluate(()=>window.__ddScanLast||null);}
 try{const du=await p.evaluate(()=>document.getElementById('ddScCanvas').toDataURL('image/png'));fs.writeFileSync(path.join(OUT,'dd134-overlay.png'),Buffer.from(du.split(',')[1],'base64'));}catch(e){}
 const stat=await p.evaluate(()=>{const s=document.getElementById('ddScStat');return {text:s?s.textContent.slice(0,260):'',cls:s&&s.className,fill:!document.getElementById('ddScFill').disabled,boxes:document.querySelectorAll('#ddScGrid .sc-cell').length,blank:document.querySelectorAll('#ddScGrid .sc-cell.sc-blank').length};});
 try{await p.screenshot({path:path.join(OUT,'dd134-grid.png')});}catch(e){}   /* the entry grid as the user sees it */
 ok('the photo is read: the code found, the layout taken from the record, the rings placed, five days found and dated from their marks',!!last&&last.N===5&&last.rows.every(r=>r.date)&&last.rows.map(r=>r.date).join()===pr.L.dates.join()&&stat.fill,{last:last&&{N:last.N,dates:last.rows.map(r=>r.date)},stat});
 if(last){let right=0,tot=0;const wrong=[];last.rows.forEach(r=>r.cells.forEach(([key,ink,written])=>{tot++;const want=!!truth[r.r+'|'+key];if(written===want)right++;else wrong.push([r.r,key,'read',written,ink,'truth',want]);}));
  ok('every cell is cut out and told blank from written as the sheet shows (at least 95%)',right/tot>=0.95&&stat.boxes===tot,{acc:+(right/tot).toFixed(3),tot,wrong:wrong.slice(0,10)});
  /* typed beside the pictures, entered into the record */
  const typed=await p.evaluate(truth=>{const d=document.getElementById('ddScanDlg');let n=0;const L=window.__ddScanLast;L.rows.forEach((r,li)=>r.cells.forEach(([key],ci)=>{const v=truth[r.r+'|'+key];if(!v)return;const inp=d.querySelector('input[data-li="'+li+'"][data-ci="'+ci+'"]');if(inp){inp.value=v;n++;}}));return n;},truth);
  const before=await p.evaluate(()=>S.rows.length);
  await p.evaluate(()=>document.getElementById('ddScFill').click());await sleep(900);
  const after=await p.evaluate(truth=>{const out={rows:S.rows.length,open:document.getElementById('ddScanDlg').open,filled:window.__ddScanFilled,blank:document.body.classList.contains('dd-blank-on'),miss:[]};const L=window.__ddScanLast;
    L.rows.forEach(r=>{const row=S.rows.find(x=>x.date===r.date);r.cells.forEach(([key])=>{const v=truth[r.r+'|'+key];if(!v)return;const got=row?(key==='notes'?row.notes:row.values[key]):undefined;if(String(got)!==v)out.miss.push([r.date,key,v,got]);});});return out;},truth);
  ok('Enter into the record writes every typed value to its day (the five days added to the record, the blank week put away, the window closed)',typed===Object.keys(truth).length&&after.miss.length===0&&after.rows===before+5&&!after.open&&after.filled&&after.filled.n===typed&&!after.blank,{typed,after:{rows:after.rows,before,miss:after.miss.slice(0,6),filled:after.filled,blank:after.blank}});
  /* a second entry over held values asks first */
  await p.evaluate(()=>{window.__asked=0;nbhUI.confirm=async()=>{window.__asked++;return false;};document.getElementById('ddScanBtn').click();});await sleep(300);
  await p.setInputFiles('#ddScanPick',photo);let l2=null;for(let i=0;i<60&&!l2;i++){await sleep(500);l2=await p.evaluate(()=>!document.getElementById('ddScFill').disabled);}
  await p.evaluate(()=>{const d=document.getElementById('ddScanDlg');const L=window.__ddScanLast;const r=L.rows[0];const inp=d.querySelector('input[data-li="0"][data-ci="0"]');inp.value='99';document.getElementById('ddScFill').click();});await sleep(600);
  const asked=await p.evaluate(()=>({asked:window.__asked,open:document.getElementById('ddScanDlg').open}));
  ok('a value typed over one the form already holds asks before replacing it, and a No leaves it',asked.asked===1&&asked.open,asked);
  await p.evaluate(()=>document.getElementById('ddScanDlg').close());}
 /* ---- what it refuses, and why ---- */
 const ref=await p.evaluate(()=>{const c=s=>ddScan.check(s);const pid=Object.keys(S.scanLayouts)[0];return {other:c('DD1;1;Someone;'+pid+';x;b').why,unknown:c('DD1;1;SIM-000;zzzzzz;x;b').why,foreign:c('ABC1;1;x;inc;h;').why,ok:c('DD1;1;sim-000;'+pid+';'+S.scanLayouts[pid].hash+';b').ok};});
 ok('it refuses, each with its reason: another student\'s sheet, a print the record does not hold, a code of another form; the student box is matched without regard to case',/Someone/.test(ref.other)&&/not in the record/.test(ref.unknown)&&/not a DD-1/.test(ref.foreign)&&ref.ok===true,ref);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
