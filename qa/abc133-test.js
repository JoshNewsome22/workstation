/* v24.33 Form ABC-1: scan a completed paper sheet. The printed incident sheet and classroom sheet carry four corner squares
   and a square code in the foot; the box layout is kept with the record at print time; a photo of a ticked sheet (made here
   from the printed sheet, hand ticks drawn on it, skewed and softened) is read back into the incident editor.
   usage: node qa/abc133-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const OUT=path.join(ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950},deviceScaleFactor:2});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 /* a student box and a Form TB-1 target, as a record in use has them */
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});document.querySelector('#h-client').value='J.R.';document.querySelector('#h-client').dispatchEvent(new Event('input',{bubbles:true}));
   if(window.abcAddTargets)abcAddTargets([{id:'tb_scream',label:'Screaming (TB-1)',def:'A vocalization above conversational volume lasting 2 s or more.'}]);});await sleep(400);
 const tb=await p.evaluate(()=>{const b=document.getElementById('abcScanBtn');return {btn:!!b,text:b&&b.textContent,jsqr:typeof jsQR==='function',api:!!window.abcScan,grp:!!(b&&b.closest('.tgroup')&&/paper sheet/.test(b.closest('.tgroup').textContent))};});
 ok('the toolbar has Scan a paper sheet in its own group, the decoder is in the form, the scan API is up',tb.btn&&tb.text==='Scan a paper sheet'&&tb.jsqr&&tb.api&&tb.grp,tb);
 /* ---- the printed sheets: the squares, the code, the layout kept with the record ---- */
 await p.emulateMedia({media:'print'});await sleep(300);
 const tag=await p.evaluate(()=>{const host=document.querySelector('#abcPaper');const out={};
   for(const [kind,key] of [['blank','inc'],['class','cls'],['sample','inc']]){host.innerHTML=abcPaper.html(kind);document.documentElement.classList.add('abc-paper');
     const code=abcScan.tag(host,key,kind==='sample'?'S':'');const ap=host.querySelector('.ap');const R=ap.getBoundingClientRect();
     const fids=[...ap.querySelectorAll('.ap-fid')].filter(e=>getComputedStyle(e).display!=='none'&&getComputedStyle(e).borderTopWidth==='3px').map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left-R.left),Math.round(r.top-R.top),Math.round(r.right-R.left),Math.round(r.bottom-R.top)];});
     const ids=ap.querySelectorAll('.ap-opt[data-id] .ap-box').length,boxes=ap.querySelectorAll('.ap-box').length;
     const hash=code&&code.split(';')[4];const L=state.sheet.scanLayouts&&state.sheet.scanLayouts[hash];
     out[kind]={code,h:R.height,w:R.width,headH:ap.querySelector('.ap-head').getBoundingClientRect().height,fids,ids,boxes,svg:!!ap.querySelector('.ap-code svg'),kept:!!L,keptBoxes:L&&L.boxes.length,hint:/from a photo: Scan a paper sheet/.test(ap.querySelector('.ap-band').textContent),qrInHead:!!ap.querySelector('.ap-head .ap-code svg')};
     document.documentElement.classList.remove('abc-paper');}
   host.innerHTML='';out.header=!!(readHeader().scanLayouts&&Object.keys(readHeader().scanLayouts).length);return out;});
 const W=Math.round(tag.blank.w);
 const corners=(f,h)=>f.length===4&&f[0][0]===0&&f[0][1]===0&&f[1][2]===W&&f[1][1]===0&&f[2][0]===0&&f[3][2]===W&&f[2][1]>h*0.6&&f[2][3]<=Math.round(h)+1&&Math.abs(f[2][3]-f[3][3])<=1;
 ok('the incident sheet carries four 11 px square rings (beside the head, and at the ends of the outcome row), a code in the head with the student box and its layout signature, and the photo line in the band; its layout (every box with an id) is kept with the record',
   corners(tag.blank.fids,tag.blank.h)&&/^ABC1;1;J\.R\.;inc;[0-9a-z]{1,7};$/.test(tag.blank.code)&&tag.blank.svg&&tag.blank.kept&&tag.blank.keptBoxes===tag.blank.ids&&tag.blank.ids===tag.blank.boxes&&tag.blank.ids>=60&&tag.blank.hint&&tag.blank.qrInHead,tag.blank);
 ok('the classroom sheet the same (its bottom rings in the foot), its own kind in the code (the Other boxes without an id are left out)',tag.class.fids.length===4&&corners(tag.class.fids,tag.class.h)&&/^ABC1;1;J\.R\.;cls;[0-9a-z]+;$/.test(tag.class.code)&&tag.class.kept&&tag.class.keptBoxes===tag.class.ids&&tag.class.ids>=18,tag.class);
 ok('the SAMPLE sheet\'s code carries its flag and its layout is not kept; the layouts travel in the record\'s header',/;inc;[0-9a-z]+;S$/.test(tag.sample.code)&&tag.header,{sample:tag.sample.code,header:tag.header});
 ok('each sheet is still one Letter page tall (under 9.6 in at 96 px/in)',[tag.blank,tag.class,tag.sample].every(x=>x.h>0&&x.h<=922),{blank:tag.blank.h,class:tag.class.h,sample:tag.sample.h,headH:tag.blank.headH});
 /* ---- a ticked sheet: every third box ticked by hand, a few with the printed mark too ---- */
 const truth=await p.evaluate(()=>{const host=document.querySelector('#abcPaper');host.innerHTML=abcPaper.html('blank');document.documentElement.classList.add('abc-paper');abcScan.tag(host,'inc','');
   const ap=host.querySelector('.ap'),R=ap.getBoundingClientRect();const opts=[...ap.querySelectorAll('.ap-opt[data-id]')];const on=new Set();
   opts.forEach((o,i)=>{const id=o.dataset.id;if(/^(yn_staff_|int_)/.test(id))return;if(i%3===0)on.add(id);});on.add('yn_staff_yes');on.add('int_3');on.add('tb_scream');on.add('i_stopped');
   const NS='http://www.w3.org/2000/svg';const svg=document.createElementNS(NS,'svg');svg.setAttribute('style','position:absolute;left:0;top:0;width:'+R.width+'px;height:'+R.height+'px;pointer-events:none;overflow:visible');svg.setAttribute('viewBox','0 0 '+R.width+' '+R.height);
   let k=0;opts.forEach(o=>{if(!on.has(o.dataset.id))return;const r=o.querySelector('.ap-box').getBoundingClientRect();const x=r.left-R.left,y=r.top-R.top,w=r.width,h=r.height;k++;
     if(k%4===0){o.classList.add('on');return;}   /* the printed-style mark now and then */
     const pl=document.createElementNS(NS,'polyline');const j=(k%3)-1;   /* a hand's variation */
     pl.setAttribute('points',(x-1+j)+','+(y+h*0.55)+' '+(x+w*0.42)+','+(y+h+1.5+j)+' '+(x+w+3.5)+','+(y-3+j));pl.setAttribute('fill','none');pl.setAttribute('stroke','#1b1b1b');pl.setAttribute('stroke-width',k%2?'1.9':'2.4');   /* a ballpoint, a felt tip */pl.setAttribute('stroke-linecap','round');pl.setAttribute('stroke-linejoin','round');svg.appendChild(pl);});
   ap.appendChild(svg);host.style.padding='40px';host.style.background='#fff';host.style.width='810px';return {on:[...on],all:opts.map(o=>o.dataset.id)};});   /* the paper's own margin around the printed sheet */
 const sheetPng=path.join(OUT,'abc133-sheet.png');const apEl=await p.$('#abcPaper');await apEl.screenshot({path:sheetPng});
 await p.evaluate(()=>{document.documentElement.classList.remove('abc-paper');const h=document.querySelector('#abcPaper');h.innerHTML='';h.style.padding='';h.style.background='';h.style.width='';});
 await p.emulateMedia({media:'screen'});await sleep(300);
 ok('the sheet to read holds ticks in boxes of every kind (antecedent, behavior incl. the TB-1 target, consequence, setting event, outcome, adult within view, intensity)',
   truth.on.length>=30&&['a_','c_','se_','p_','r_'].every(pre=>truth.on.some(id=>id.startsWith(pre)))&&truth.on.includes('tb_scream')&&truth.on.includes('int_3'),{n:truth.on.length,sample:truth.on.slice(0,10)});
 /* ---- the photo: the page on a desk, taken at an angle, a little soft ---- */
 const qpage=await b.newPage({viewport:{width:1700,height:2100},deviceScaleFactor:1});
 const dataUrl='data:image/png;base64,'+fs.readFileSync(sheetPng).toString('base64');
 await qpage.setContent('<body style="margin:0;background:#7d8287;width:1700px;height:2100px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="'+dataUrl+'" style="width:1420px;box-shadow:0 8px 30px rgba(0,0,0,.5);transform:perspective(1700px) rotateX(7deg) rotateY(-5deg) rotateZ(2deg);filter:blur(0.5px) contrast(.95) brightness(.97)"></body>');await sleep(500);
 const photo=path.join(OUT,'abc133-photo.jpg');await qpage.screenshot({path:photo,type:'jpeg',quality:82});await qpage.close();
 /* ---- the scan ---- */
 await p.evaluate(()=>document.getElementById('abcScanBtn').click());await sleep(300);
 const dlg=await p.evaluate(()=>{const d=document.getElementById('abcScanDlg');return {open:!!(d&&d.open),file:!!document.getElementById('abcScanPick')};});
 ok('Scan a paper sheet opens its window with Take a photo and Choose a photo',dlg.open&&dlg.file,dlg);
 await p.setInputFiles('#abcScanPick',photo);
 let last=null;for(let i=0;i<60&&!last;i++){await sleep(500);last=await p.evaluate(()=>window.__abcScanLast?{n:window.__abcScanLast.boxes.length,unsure:window.__abcScanLast.unsure.length,src:window.__abcScanLast.C.source,boxes:window.__abcScanLast.boxes.map(b=>[b.id,b.on,b.sure,b.m&&+b.m.fill.toFixed(2),b.m&&+b.m.mean.toFixed(2)])}:null);}
 try{const du=await p.evaluate(()=>document.getElementById('abScCanvas').toDataURL('image/png'));fs.writeFileSync(path.join(OUT,'abc133-overlay.png'),Buffer.from(du.split(',')[1],'base64'));}catch(e){}
 const stat=await p.evaluate(()=>{const s=document.getElementById('abScStat');return {text:s?s.textContent.slice(0,260):'',cls:s&&s.className,fill:!document.getElementById('abScFill').disabled};});
 ok('the photo is read: the code found, the layout taken from the record, the squares placed, every box read',!!last&&last.n===truth.all.length&&last.src==='kept'&&stat.fill,{last:last&&{n:last.n,unsure:last.unsure,src:last.src},stat});
 if(last){const T=new Set(truth.on);const wrong=[];let right=0;for(const [id,on]of last.boxes){if(on===T.has(id))right++;else wrong.push([id,'read',on,'truth',T.has(id)]);}
  const acc=right/last.boxes.length;
  ok('at least 97% of the boxes read as the sheet shows them and no more than 6% are unsure',acc>=0.97&&last.unsure<=last.boxes.length*0.06,{acc:+acc.toFixed(3),tot:last.boxes.length,unsure:last.unsure,wrong:wrong.slice(0,12),sample:last.boxes.slice(0,5)});
  /* tick the editor */
  await p.evaluate(()=>document.getElementById('abScFill').click());await sleep(900);
  const ed=await p.evaluate(()=>{const ids=[...document.querySelectorAll('#abc-grid input[type=checkbox]:checked, #res-opts input[type=checkbox]:checked, #se-opts input[type=checkbox]:checked')].map(i=>i.id.replace(/^(a|b|p|se|c|r)-/,''));
    const im=[...document.querySelectorAll('input[name=immediate]')].find(x=>x.checked);return {ids,imm:im&&im.value,staff:document.querySelector('#e-staffpresent').value,inten:document.querySelector('#e-intensity').value,tab:document.querySelector('#tab-record').getAttribute('aria-selected'),flag:document.querySelector('#edit-flag').textContent,open:document.getElementById('abcScanDlg').open,filled:window.__abcScanFilled};});
  const want=truth.on.filter(id=>!/^(yn_|int_|i_)/.test(id)).sort(),got=ed.ids.sort();
  const miss=want.filter(x=>!got.includes(x)),extra=got.filter(x=>!want.includes(x));
  ok('Tick the incident editor ticks the sheet\'s boxes in the editor (the TB-1 target among them), sets Adult within view and the intensity, the outcome, shows the Record tab with a note to add the date and description',
    miss.length+extra.length<=Math.ceil(want.length*0.03)&&ed.staff==='yes'&&ed.inten==='3'&&ed.imm==='i_stopped'&&ed.tab==='true'&&/scanned paper sheet/.test(ed.flag)&&!ed.open&&ed.filled&&ed.filled.n>=want.length-2,{miss,extra,staff:ed.staff,inten:ed.inten,imm:ed.imm,tab:ed.tab,flag:ed.flag,filled:ed.filled});
  /* the editor now holds work: a second scan asks before replacing it */
  await p.evaluate(()=>{window.__asked=0;nbhUI.confirm=async()=>{window.__asked++;return false;};document.getElementById('abcScanBtn').click();});await sleep(300);
  await p.setInputFiles('#abcScanPick',photo);let l2=null;for(let i=0;i<60&&!l2;i++){await sleep(500);l2=await p.evaluate(()=>!document.getElementById('abScFill').disabled);}
  await p.evaluate(()=>document.getElementById('abScFill').click());await sleep(600);
  const asked=await p.evaluate(()=>({asked:window.__asked,open:document.getElementById('abcScanDlg').open,still:document.querySelectorAll('#abc-grid input[type=checkbox]:checked').length}));
  ok('scanning again while the editor holds unsaved entries asks before replacing them, and a No leaves them',asked.asked===1&&asked.open&&asked.still>0,asked);
  await p.evaluate(()=>document.getElementById('abcScanDlg').close());}
 /* ---- what the scan refuses, and why ---- */
 const ref=await p.evaluate(()=>{const c=s=>abcScan.check(s);const h=Object.keys(state.sheet.scanLayouts)[0];return {
   sample:c('ABC1;1;J.R.;inc;'+h+';S').why,other:c('ABC1;1;Someone Else;inc;'+h+';').why,setup:c('ABC1;1;J.R.;inc;zzzz;').why,bg:c('ABC1;1;J.R.;bg;x;').why,foreign:c('SP1;1;x;0;0').why,ok:c('ABC1;1;j.r.;inc;'+h+';').ok};});
 ok('it refuses, each with its reason: the SAMPLE sheet, another student\'s sheet, a sheet printed from a different set-up, the background sample sheet, a code of another form; the student box is matched without regard to case',
   /SAMPLE/.test(ref.sample)&&/Someone Else/.test(ref.other)&&/different set-up/.test(ref.setup)&&/background sample sheet/.test(ref.bg)&&/not an ABC-1/.test(ref.foreign)&&ref.ok===true,ref);
 /* a sheet printed before the record changed is still read: its layout is the one kept */
 const kept=await p.evaluate(()=>{const h=Object.keys(state.sheet.scanLayouts)[0];abcAddTargets([{id:'tb_elope',label:'Leaving the area (TB-1)',def:'Moves more than 3 m from the assigned area without permission.'}]);
   const host=document.querySelector('#abcPaper');host.innerHTML=abcPaper.html('blank');const now=abcScan.measure(host,'inc');host.innerHTML='';return {changed:now.hash!==h,old:abcScan.check('ABC1;1;J.R.;inc;'+h+';').source,fresh:abcScan.check('ABC1;1;J.R.;inc;'+now.hash+';').source};});
 ok('after a new TB-1 target the sheet\'s layout changes, yet a sheet printed before is still read from the layout kept with the record; a sheet of the new layout is read from the record as it is now',kept.changed&&kept.old==='kept'&&kept.fresh==='regenerated',kept);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
