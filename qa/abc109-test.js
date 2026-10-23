/* v24.09 Form ABC-1, the paper sheet printed from a narrow frame (an iPad inside the workstation): the sheet is a fixed 7.6 in
   wide for print; the print host is zoomed to the frame's width on iOS (abcPaper.fit, forced here); the sheets stay one page.
   usage: node qa/abc109-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 /* the form in a frame as narrow as an iPad held upright inside the workstation */
 await p.setContent('<iframe id="f" src="'+URL+'" style="width:600px;height:900px;border:0"></iframe>');await sleep(2500);
 const fr=p.frames().find(f=>f.url().includes('ABC_Recording'));
 const narrow=await fr.evaluate(()=>{const host=document.querySelector('#abcPaper');host.innerHTML=abcPaper.html('blank');document.documentElement.classList.add('abc-paper');const k=abcPaper.fit(true);
   return {w:document.documentElement.clientWidth,k,zoom:host.style.zoom,ios:CSS.supports('-webkit-touch-callout','none')};});
 await p.emulateMedia({media:'print'});
 const pr=await fr.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap'),host=document.querySelector('#abcPaper');const r=ap.getBoundingClientRect();return {apW:ap.offsetWidth,seen:r.width,h:r.height,hostZoom:host.style.zoom,bodyM:getComputedStyle(document.body).marginLeft};});
 await p.emulateMedia({media:'screen'});
 ok('in a 600 px frame the sheet is laid out 7.6 in wide (730 px) and the host zoomed to the frame (0.82), so the sheet as printed is the frame\'s width; the body has no margin',
   narrow.w===600&&Math.abs(narrow.k-600/729.6)<.01&&narrow.zoom===narrow.k.toString().slice(0,5)&&pr.apW===730&&Math.abs(pr.seen-600)<3&&pr.bodyM==='0px',{narrow,pr});
 const reset=await fr.evaluate(()=>{const host=document.querySelector('#abcPaper');document.documentElement.classList.remove('abc-paper');host.innerHTML='';host.style.zoom='';const k=abcPaper.fit(false);return {k,zoom:host.style.zoom};});
 ok('not forced, a desktop browser leaves the host alone (no iOS)',reset.k===1&&reset.zoom==='',reset);
 /* a wide page: no zoom even when forced; each sheet still one page at 7.6 in */
 await p.goto(URL);await sleep(1500);
 const pages={};for(const k of ['blank','sample','bg']){await p.evaluate(k=>{document.querySelector('#abcPaper').innerHTML=abcPaper.html(k);document.documentElement.classList.add('abc-paper');abcPaper.fit(true);},k);await p.emulateMedia({media:'print'});
   pages[k]=await p.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap');return {h:ap.getBoundingClientRect().height,w:ap.offsetWidth,zoom:document.querySelector('#abcPaper').style.zoom};});await p.emulateMedia({media:'screen'});await p.evaluate(()=>{document.documentElement.classList.remove('abc-paper');document.querySelector('#abcPaper').innerHTML='';});}
 ok('on a wide page the host is not zoomed and each sheet is 7.6 in wide and one Letter page tall',Object.values(pages).every(x=>x.h>0&&x.h<=922&&x.w===730&&x.zoom===''),pages);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
