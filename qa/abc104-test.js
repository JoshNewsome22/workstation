/* v24.04 Form ABC-1: the one-page paper ABC data sheet (blank, SAMPLE, background checks), the toolbar as a settings panel, the
   masthead's text and notes at full width, the student's photo (from the case, or chosen) and the how-to video link kept in
   the record and printed on the paper sheet. */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,500)));};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFklEQVR4nGP8z4AKmBhGBUYFRgUoFAAAt1kBBfwo9g8AAAAASUVORK5CYII=';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1400,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.setContent('<iframe id="f" src="'+URL+'" style="width:1380px;height:900px;border:0"></iframe>');await sleep(3500);
 const fr=p.frames().find(f=>f.url().includes('ABC_Recording'));
 const panel=await fr.evaluate(()=>{const bar=document.querySelector('.toolbar'),panel=bar.querySelector('.abc-panel');const cols=[...panel.querySelectorAll('.abc-col')];const col=id=>{const e=document.getElementById(id);const c=e&&e.closest('.abc-col');return c?cols.indexOf(c):-1;};
   return {heads:cols.map(c=>c.querySelector('h4').textContent),print:col('printBtn'),blank:col('abcBlankBtn'),sample:col('abcSampleBtn'),bg:col('abcBgBtn'),photo:col('abcPhotoPick'),video:col('abcVideo'),save:col('dl-json'),csv:col('dl-matrix'),sim:col('load-demo'),clear:col('clear-all'),
     packet:[...panel.querySelectorAll('button')].filter(x=>/packet/.test(x.textContent)).map(x=>x.closest('.tgroup').firstElementChild.textContent),quick:!!document.getElementById('abcBlankQuick'),caseTop:!!bar.querySelector(':scope > .nbh-case-grp'),
     widths:[getComputedStyle(document.querySelector('.nbh-mast .nbh-sub')).maxWidth,getComputedStyle(document.querySelector('#panel-record p.note')).maxWidth]};});
 ok('the toolbar is a settings panel: Printing (the record; the paper sheets), Files (photo, video link, the files and the packet), Simulation and reset; a quick blank-sheet button; the case in the top row',
   panel.heads.join('|')==='Printing|Files|Simulation and reset'&&panel.print===0&&panel.blank===0&&panel.sample===0&&panel.bg===0&&panel.photo===1&&panel.video===1&&panel.save===1&&panel.csv===1&&panel.sim===2&&panel.clear===2&&panel.packet.every(x=>x==='Files')&&panel.quick,panel);
 ok('the masthead\'s text and the notes run the width of the page',panel.widths.every(w=>w==='none'),panel.widths);
 /* the paper sheets */
 await fr.evaluate(()=>{document.querySelector('#h-client').value='Test Student (simulated)';document.querySelector('#h-observer').value='R. Smith';document.querySelector('#h-target').value='Elopement';document.querySelector('#h-window').value='10';document.querySelector('#h-checks').value='fixed:10';});
 const sheets=await fr.evaluate(()=>{const d=document.createElement('div');const count=(k,sel)=>{d.innerHTML=window.abcPaper.html(k);return d.querySelectorAll(sel).length;};
   d.innerHTML=window.abcPaper.html('blank');const txt=d.textContent;
   return {opts:count('blank','.ap-opt'),on:count('blank','.ap-opt.on'),cols:count('blank','.ap-col'),header:/Test Student \(simulated\)/.test(txt)&&/R\. Smith/.test(txt)&&/Elopement/.test(txt)&&/10 s/.test(txt)&&/Every 10 minutes/.test(txt),
     a:ANTECEDENTS.flatMap(g=>g.items).length,b:BEHAVIORS.length,pr:PRECURSORS.length,c:CONSEQUENCES.flatMap(g=>g.items).length,se:SETTING_EVENTS.length,withheld:(txt.match(/withheld/g)||[]).length,
     sampleOn:count('sample','.ap-opt.on'),sampleBar:count('sample','.ap-sambar'),sampleCls:count('sample','.ap.ap-sample'),sampleNarr:(d.innerHTML=window.abcPaper.html('sample'),/Teacher put the math sheet/.test(d.querySelector('.ap-lines').textContent)),
     bgBlocks:count('bg','.ap-bg'),bgOn:count('bg','.ap-opt.on')};});
 const want=sheets.a+sheets.b+sheets.pr+sheets.c+sheets.se+2+4+2+5;
 ok('the blank sheet holds every antecedent, behavior, precursor, consequence and setting event as a box, the outcome boxes, the withheld marks, and this record\'s header',sheets.opts===want&&sheets.on===0&&sheets.cols===3&&sheets.header&&sheets.withheld>=5,{sheets,want});
 ok('the sample sheet is marked SAMPLE (banner and watermark) with a made-up incident ticked and a narrative written',sheets.sampleOn>=7&&sheets.sampleBar===1&&sheets.sampleCls===1&&sheets.sampleNarr,sheets);
 ok('the background sample sheet holds two checks, every box blank',sheets.bgBlocks===2&&sheets.bgOn===0,sheets);
 /* each prints on one page */
 const pages={};for(const k of ['blank','sample','bg']){await fr.evaluate(k=>{document.querySelector('#abcPaper').innerHTML=window.abcPaper.html(k);document.documentElement.classList.add('abc-paper');},k);await p.emulateMedia({media:'print'});
   /* the frame's document printed through the top page would be the host page; measure the sheet's height against a page instead */
   pages[k]=await fr.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap');return {h:ap.getBoundingClientRect().height,w:ap.getBoundingClientRect().width};});await p.emulateMedia({media:'screen'});await fr.evaluate(()=>{document.documentElement.classList.remove('abc-paper');document.querySelector('#abcPaper').innerHTML='';});}
 ok('each paper sheet is one Letter page tall (under 9.6 in at 96 px/in, with the page margins)',Object.values(pages).every(x=>x.h>0&&x.h<=922),pages);
 /* printing: the print mode shows the paper sheet alone, then clears */
 await fr.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++;window.__paper=document.documentElement.classList.contains('abc-paper')&&document.querySelectorAll('#abcPaper .ap-opt').length;};document.getElementById('abcSampleBtn').click();});await sleep(1800);
 ok('Print a sample sheet prints the paper sheet alone and clears it after',await fr.evaluate(()=>window.__printed===1&&window.__paper>50&&!document.documentElement.classList.contains('abc-paper')&&document.querySelector('#abcPaper').innerHTML===''));
 /* the photo from the case, the video link, both in the record */
 await p.evaluate(ph=>{document.getElementById('f').contentWindow.postMessage({nbh:'packet',packet:{client:'Test Student (simulated)',photo:ph}},'*');},PNG);await sleep(600);
 await fr.evaluate(()=>{const v=document.getElementById('abcVideo');v.value='https://youtu.be/abc-walkthrough';v.dispatchEvent(new Event('input',{bubbles:true}));});
 const rec=await fr.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.abcPaper.html('blank');const h=readHeader();
   return {casePhoto:state.sheet.photo!==''&&state.sheet.photoCase===true,onSheet:!!d.querySelector('.ap-photo img'),qr:!!d.querySelector('.ap-qr svg'),hdr:h.photo===state.sheet.photo&&h.video==='https://youtu.be/abc-walkthrough',from:document.getElementById('abcPhotoFrom').textContent};});
 ok('the case\'s photo arrives with the packet and prints in the paper sheet\'s head; the video link prints as a QR code; both travel in the record\'s header',rec.casePhoto&&rec.onSheet&&rec.qr&&rec.hdr&&/follows the bar/.test(rec.from),rec);
 const io=await fr.evaluate(()=>{const h=readHeader();const d={format:'abc-conditional-probability',version:1,header:Object.assign({},h,{client:'Reopened Student (simulated)'}),entries:[],samples:[]};
   writeHeader({client:'Cleared'});const before={photo:state.sheet.photo,video:state.sheet.video};writeHeader(d.header);return {cleared:before.photo===''&&before.video==='',back:state.sheet.photo!==''&&state.sheet.video==='https://youtu.be/abc-walkthrough'&&document.getElementById('abcVideo').value==='https://youtu.be/abc-walkthrough'};});
 ok('a header without them clears the photo and the link; a saved header brings them back',io.cleared&&io.back,io);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
