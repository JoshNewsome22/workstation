/* v24.03 Form SP-1: the case's photo on the data sheet (from the packet, as the bar carries it), the photo's own column and no
   Sheet no. box, the walkthrough's glows placed again when a page reflows, the head line's words. */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
const URL=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,500)));};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFklEQVR4nGP8z4AKmBhGBUYFRgUoFAAAt1kBBfwo9g8AAAAASUVORK5CYII=';
const PNG2='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 /* the form inside a frame, as the workstation holds it, so the packet message arrives from the parent */
 const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.setContent('<iframe id="f" src="'+URL+'" style="width:1280px;height:900px;border:0"></iframe>');await sleep(3000);
 const fr=p.frames().find(f=>f.url().includes('Scatterplot'));
 const send=(photo)=>p.evaluate(ph=>{document.getElementById('f').contentWindow.postMessage({nbh:'packet',packet:{client:'Test Student (simulated)',photo:ph}},'*');},photo);
 await send(PNG);await sleep(600);
 const r1=await fr.evaluate(()=>({photo:state.meta.photo,caseP:state.meta.photoCase,on:state.meta.photoOn,shown:!document.getElementById('spPhoto').hidden,col:getComputedStyle(document.getElementById('spPhoto')).gridColumnStart,inIdent:!!document.querySelector('.ident .sp-photo'),has:document.querySelector('.ident').classList.contains('has-photo'),sheetNo:document.getElementById('mCode').closest('.f').offsetParent===null,from:document.getElementById('spPhotoFrom').textContent,off:document.getElementById('spPhotoOff').hidden}));
 ok('the case\'s photo arrives with the packet and goes on the sheet, in the head\'s own column; the Sheet no. box is gone; the note says it follows the bar',r1.photo===PNG&&r1.caseP===true&&r1.on==='1'&&r1.shown&&r1.inIdent&&r1.col==='4'&&r1.has&&r1.sheetNo&&/follows the bar/.test(r1.from)&&r1.off,r1);
 await send(PNG2);await sleep(500);
 ok('a new photo on the bar follows onto the sheet',await fr.evaluate(ph=>state.meta.photo===ph&&state.meta.photoCase===true,PNG2));
 await fr.evaluate(()=>{document.getElementById('spPhotoOn').click();});await sleep(300);
 ok('"on the sheet" unticked takes the case\'s photo off the sheet and keeps the choice',await fr.evaluate(()=>state.meta.photoOn==='0'&&document.getElementById('spPhoto').hidden&&!document.querySelector('.ident').classList.contains('has-photo')));
 await fr.evaluate(()=>{document.getElementById('spPhotoOn').click();});await sleep(200);
 fs.writeFileSync('/tmp/sp103-pic.png',Buffer.from(PNG.split(',')[1],'base64'));await fr.setInputFiles('#spPhotoFile','/tmp/sp103-pic.png');await sleep(900);
 const r2=await fr.evaluate(()=>({own:/^data:image\/jpeg/.test(state.meta.photo||''),caseP:state.meta.photoCase,btn:document.getElementById('spPhotoOff').textContent,hidden:document.getElementById('spPhotoOff').hidden,from:document.getElementById('spPhotoFrom').textContent}));
 ok('a photo chosen here is the form\'s own; the button offers the case\'s photo back',r2.own&&r2.caseP===false&&/case/.test(r2.btn)&&!r2.hidden&&/own photo/.test(r2.from),r2);
 await send(PNG);await sleep(400);
 ok('the bar\'s photo does not replace the form\'s own',await fr.evaluate(()=>/^data:image\/jpeg/.test(state.meta.photo)&&state.meta.photoCase===false));
 await fr.evaluate(()=>{document.getElementById('spPhotoOff').click();});await sleep(300);
 ok('"Use the case\'s photo" goes back to the bar\'s photo',await fr.evaluate(ph=>state.meta.photo===ph&&state.meta.photoCase===true,PNG));
 const pr=await fr.evaluate(()=>{const pages=window.spPrintSet();const s=pages[0];return {img:!!s.querySelector('.ident .sp-photo img'),cols:s.querySelector('.ident').classList.contains('has-photo'),sheetNo:!!s.querySelector('.ident .f.sp-nosheet')&&getComputedStyle(document.querySelector('#sheet .ident .f.sp-nosheet')).display==='none'};});
 ok('the printed sheet carries the photo in its column and no Sheet no. box',pr.img&&pr.cols&&pr.sheetNo,pr);
 /* the walkthrough: the head line's words; a glow follows its target when the guide page reflows */
 await fr.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await fr.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const wk=await fr.evaluate(async()=>{const C=TKWALK.cues,H=C.find(c=>c.id==='head'),Dy=C.find(c=>c.id==='daily');const st=document.querySelector('#wkStage');const P2=st.querySelectorAll('.spw-pg')[1];
   const off=el=>{let x=0,y=0,n=el;while(n&&n!==P2){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}return {x:x+P2.offsetLeft,y,w:el.offsetWidth,h:el.offsetHeight};};
   const t=P2.querySelector('.sp-ginit');TKWALK.renderAt(Dy.start+1.5);const g=()=>[...st.querySelectorAll('.spw-glow')].filter(e=>e.style.visibility==='visible')[0];
   const near=(g,r)=>Math.abs(parseFloat(g.style.top)+parseFloat(g.style.height)/2-(r.y+r.h/2))<2;
   const before=near(g(),off(t));
   /* a reflow: a paragraph grows above the table */
   const para=document.createElement('p');para.textContent='A line of text that was not there when the walkthrough was built, so the table below moves down.';para.style.cssText='font-size:16px;line-height:1.5;margin:0 0 20px';P2.querySelector('.sheet').insertBefore(para,P2.querySelector('.sp-ginit').closest('table').previousElementSibling||P2.querySelector('.sp-ginit'));
   await new Promise(r=>setTimeout(r,250));TKWALK.renderAt(Dy.start+1.6);const after=near(g(),off(t));
   return {head:H.text,narr:H.narr,before,after,moved:off(t).y};});
 ok('the head line now says the sheet number is printed',/sheet number are printed for you/.test(wk.head)&&wk.narr>5,wk.head);
 ok('the guide page\'s glow sits on the initials table, and follows it after the page reflows',wk.before&&wk.after,wk);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
