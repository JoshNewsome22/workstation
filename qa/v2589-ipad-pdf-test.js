/* v25.89 (the BCBA, 11/11, of the workstation installed on an iPad: "it is not allowing me to select print") An installed
   app gets no print options from the device, so the page makes a PDF of its printed pages itself and hands it to the share
   sheet (tools/blocks/nbh-pwa-save.js, nbh-pdf-make.js, nbh-html2canvas.js). Not seen on an iPad: here Chromium plays one
   (the iPad's name, navigator.standalone, a share sheet that records what it is given, a Print that brings no options).
   A  Print with no print options: after a few seconds the offer (Make the PDF, Close), not the old notice; remembered.
   B  Make the PDF: progress, then "The PDF is ready: N pages", N within one of the browser's own print of the same form.
   C  Print or share the PDF: the share sheet is given one file, a PDF of N letter pages, a picture a page; the first
      page has ink in its body and in its foot (the page number), and none in the side margin.
   D  the form afterwards: nothing left marked, its print rules as they were, the box typed in unchanged.
   E  the next Print goes straight to the offer, with Try Print again, which asks the device once more.
   F  a device whose print options do come: no offer, and the memory is cleared.
   G  a landscape form makes landscape pages.
   H  outside the installed app nothing changes: Print is the browser's, no offer.
   I  the maker's own rules: which @media rules count as printed; the offline copy lists both new files.
   usage: WS_URL=http://127.0.0.1:8193 node qa/v2589-ipad-pdf-test.js */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const URL=(process.env.WS_URL||'http://127.0.0.1:8123')+'/NBH-Workstation/';const DIR=path.join(__dirname,'..','NBH-Workstation');
const file=pre=>fs.readdirSync(DIR).find(f=>f.startsWith(pre));
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pagesOf=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g)||[]).length;
(async()=>{const b=await chromium.launch();const errs=[];
 try{
  /* the installed app on an iPad, as far as a page can tell; `works` makes its Print bring the options (beforeprint) */
  const app=async(works)=>{const ctx=await b.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
   await ctx.addInitScript(works=>{try{Object.defineProperty(navigator,'standalone',{get:()=>true,configurable:true});}catch(e){}
     window.__prints=0;window.print=function(){window.__prints++;if(works)window.dispatchEvent(new Event('beforeprint'));};
     window.__shared=[];navigator.canShare=()=>true;navigator.share=async d=>{const f=d&&d.files&&d.files[0];window.__shared.push(f);};},works);
   const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));return {ctx,p};};
  const offer=p=>p.evaluate(()=>{const d=document.getElementById('nbhPdfOffer');if(!d)return null;const bs=[...d.querySelectorAll('button')];return {open:d.open!==false,title:d.querySelector('#nbhPdfOfferT').textContent,btn:bs.map(x=>x.textContent),dis:bs.map(x=>x.disabled),status:d.querySelector('[role=status]').textContent,h:Math.min(...bs.map(x=>x.getBoundingClientRect().height)),ign:d.getAttribute('data-html2canvas-ignore')};});
  const tap=(p,label)=>p.evaluate(label=>{const x=[...document.querySelectorAll('#nbhPdfOffer button')].find(y=>y.textContent===label);if(x)x.click();return !!x;},label);
  const IC=file('IC-1_');
  /* the browser's own print of the same form, for the page count */
  let ref;{const ctx=await b.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});const p=await ctx.newPage();await p.goto(URL+IC);await sleep(1500);
    await p.evaluate(()=>{const t=document.querySelector('textarea,input[type=text]');if(t){t.value='An invented note';t.dispatchEvent(new Event('input',{bubbles:true}));}});
    ref=pagesOf(await p.pdf({format:'Letter',preferCSSPageSize:true}));await ctx.close();}
  let {ctx,p}=await app(false);
  await p.goto(URL+IC);await sleep(1500);
  const before=await p.evaluate(()=>{const t=document.querySelector('textarea,input[type=text]');if(t){t.value='An invented note';t.dispatchEvent(new Event('input',{bubbles:true}));}
    let n=0;const walk=rs=>{for(const r of rs||[]){if(r.media&&/print/.test(r.media.mediaText))n++;try{if(r.cssRules&&!r.selectorText)walk(r.cssRules);}catch(e){}}};for(const s of document.styleSheets){try{walk(s.cssRules);}catch(e){}}
    return {inApp:window.nbhShareSave&&window.nbhShareSave.inApp,printRules:n,val:t?t.value:null};});
  await p.evaluate(()=>window.print());
  await sleep(1200);const early=await offer(p);await sleep(2900);
  let r=await offer(p);
  ok('A in the installed app, Print with no print options: nothing for the first second, then the offer with Make the PDF and Close, each 44 px tall',before.inApp===true&&early===null&&r&&r.open&&r.title==='Print or save these pages'&&r.btn.join('|')==='Make the PDF|Close'&&r.h>=44&&r.ign==='true',{before,early,r});
  ok('A that the device gave no print options is remembered on the device, and Print was asked once',await p.evaluate(()=>localStorage.getItem('nbh.noprint')==='1'&&window.__prints===1));
  await tap(p,'Make the PDF');await sleep(250);
  const mid=await offer(p);
  await p.waitForFunction(()=>{const s=document.querySelector('#nbhPdfOffer [role=status]');return s&&/is ready|could not/.test(s.textContent);},null,{timeout:180000});
  r=await offer(p);const N=+(/(\d+) page/.exec(r.status)||[])[1];
  ok('B while it is made the buttons wait and a line says what is happening',mid&&mid.dis.every(x=>x)&&/Getting ready|Drawing page \d+ of \d+/.test(mid.status),mid);
  ok('B the PDF is ready: '+N+' pages, within one of the browser\'s own print ('+ref+'); the button now says Print or share the PDF',/^The PDF is ready: \d+ pages\.$/.test(r.status)&&ref>=5&&Math.abs(N-ref)<=1&&r.btn[0]==='Print or share the PDF'&&!r.dis[0],{r,ref});
  await tap(p,'Print or share the PDF');await sleep(600);
  const sh=await p.evaluate(async()=>{const f=window.__shared[0];if(!f)return null;const u=new Uint8Array(await f.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
    const pages=(s.match(/\/Type \/Page /g)||[]).length,imgs=(s.match(/\/Filter \/DCTDecode/g)||[]).length,box=(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(s)||[]).slice(1).map(Number);
    /* the first page's picture: ink in the body and at the foot, none in the side margin */
    const a=s.indexOf('stream\n',s.indexOf('/DCTDecode'))+7,e=s.indexOf('\nendstream',a),jp=u.subarray(a,e);const bm=await createImageBitmap(new Blob([jp],{type:'image/jpeg'}));
    const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const g=c.getContext('2d');g.drawImage(bm,0,0);
    const ink=(x0,y0,x1,y1)=>{const d=g.getImageData(Math.round(x0*c.width),Math.round(y0*c.height),Math.max(1,Math.round((x1-x0)*c.width)),Math.max(1,Math.round((y1-y0)*c.height))).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]<420)n++;return n/(d.length/4);};
    return {name:f.name,type:f.type,size:u.length,head:s.slice(0,8),tail:s.slice(-6),pages,imgs,box,w:bm.width,h:bm.height,body:ink(0.1,0.08,0.9,0.5),foot:ink(0.5,0.955,0.96,0.99),side:ink(0,0.1,0.035,0.9),xref:/startxref\n\d+\n%%EOF\n$/.test(s),status:document.querySelector('#nbhPdfOffer [role=status]').textContent};});
  ok('C the share sheet is given one file: a PDF named for the form, '+N+' letter pages, a picture a page',sh&&/\.pdf$/.test(sh.name)&&/Informed|IC-1/i.test(sh.name)&&sh.type==='application/pdf'&&sh.head.startsWith('%PDF-1.')&&sh.xref&&sh.pages===N&&sh.imgs===N&&sh.box[0]===612&&sh.box[1]===792&&sh.size>100000,sh);
  ok('C the first page: 1632 x 2112 dots, ink in its body and at its foot (the page number), none in the side margin',sh&&sh.w===1632&&sh.h===2112&&sh.body>0.01&&sh.foot>0.002&&sh.side===0&&/^Done\./.test(sh.status),sh);
  await tap(p,'Close');await sleep(200);
  const after=await p.evaluate(()=>{const t=document.querySelector('textarea,input[type=text]');let n=0;const walk=rs=>{for(const r of rs||[]){if(r.media&&/print/.test(r.media.mediaText))n++;try{if(r.cssRules&&!r.selectorText)walk(r.cssRules);}catch(e){}}};for(const s of document.styleSheets){try{walk(s.cssRules);}catch(e){}}
    return {marks:document.querySelectorAll('[data-html2canvas-ignore]').length,printRules:n,val:t?t.value:null,box:!!document.getElementById('nbhPdfOffer'),clones:document.querySelectorAll('iframe.html2canvas-container').length};});
  ok('D afterwards: the offer is gone, nothing is left marked, the form\'s '+before.printRules+' print rules are as they were, the box typed in is unchanged',!after.box&&after.marks===0&&after.printRules===before.printRules&&before.printRules>0&&after.val===before.val&&after.clones===0,{before,after});
  await p.evaluate(()=>window.print());await sleep(400);
  r=await offer(p);const pr0=await p.evaluate(()=>window.__prints);
  ok('E the next Print goes straight to the offer, without asking the device, and offers Try Print again',r&&r.btn.join('|')==='Make the PDF|Try Print again|Close'&&pr0===1,{r,pr0});
  await tap(p,'Try Print again');await sleep(300);
  ok('E Try Print again closes the offer and asks the device once more',await p.evaluate(()=>!document.getElementById('nbhPdfOffer')&&window.__prints===2));
  await ctx.close();
  /* F a device whose print options do come */
  ({ctx,p}=await app(true));await p.goto(URL+IC);await sleep(1200);
  await p.evaluate(()=>{localStorage.setItem('nbh.noprint','1');window.print();});await sleep(400);await tap(p,'Try Print again');await sleep(4200);
  ok('F where the print options do come: no offer, and the memory is cleared',await p.evaluate(()=>!document.getElementById('nbhPdfOffer')&&localStorage.getItem('nbh.noprint')===null&&window.__prints===1));
  /* G landscape */
  await p.goto(URL+file('Daily_'));await sleep(1500);
  await p.evaluate(()=>window.nbhShareSave.offerPdf(window,null,null));await tap(p,'Make the PDF');
  await p.waitForFunction(()=>{const s=document.querySelector('#nbhPdfOffer [role=status]');return s&&/is ready|could not/.test(s.textContent);},null,{timeout:120000});
  await tap(p,'Print or share the PDF');await sleep(500);
  r=await p.evaluate(async()=>{const f=window.__shared[0];if(!f)return {st:document.querySelector('#nbhPdfOffer [role=status]').textContent};const s=await f.text();return {box:(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(s)||[]).slice(1).map(Number),name:f.name};});
  ok('G a landscape form (Daily data) makes landscape pages',r.box&&r.box[0]===792&&r.box[1]===612,r);
  await ctx.close();
  /* H outside the installed app */
  {const c2=await b.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});await c2.addInitScript(()=>{window.__prints=0;window.__native=window.print=function(){window.__prints++;};});const q=await c2.newPage();q.on('pageerror',e=>errs.push(String(e)));
   await q.goto(URL+IC);await sleep(1200);await q.evaluate(()=>window.print());await sleep(4200);
   ok('H outside the installed app: Print is the browser\'s own, no offer, nothing loaded',await q.evaluate(()=>window.print===window.__native&&window.__prints===1&&!document.getElementById('nbhPdfOffer')&&window.nbhShareSave.inApp===false&&typeof window.nbhPdfMake==='undefined'&&typeof window.html2canvas==='undefined'));
   /* I the maker's rules */
   await q.addScriptTag({url:URL+'nbh-pdf-make.js'});
   r=await q.evaluate(()=>{const f=window.nbhPdfMake.flip;return [f('print'),f('screen'),f('only screen and (max-width:600px)'),f('print and (max-width:600px)'),f('(max-width:600px)'),f('not print'),f('screen, print'),f('all')];});
   ok('I which rules count as printed: print rules on, screen rules off, the others as they are',JSON.stringify(r)===JSON.stringify(['all','not all','not all','all and (max-width:600px)','(max-width:600px)','not all','not all, all','all']),r);
   r=await q.evaluate(()=>{const P=window.nbhPdfMake.paper(document),M=window.nbhPdfMake.marginWords(document);return {P,keys:Object.keys(M.boxes).sort(),foot:Object.keys(M.boxes).map(k=>M.words(M.boxes[k].c,2,7)).join(' | ')};});
   ok('I the paper is the form\'s own (letter, its margins), and the margin words carry the page number',r.P.w===816&&r.P.h===1056&&r.P.cw>600&&r.P.cw<760&&r.keys.length>=1&&/2/.test(r.foot),r);
   await c2.close();}
  const sw=fs.readFileSync(path.join(DIR,'sw.js'),'utf8'),lib=fs.readFileSync(path.join(DIR,'nbh-html2canvas.js'),'utf8');
  ok('I the offline copy lists nbh-html2canvas.js and nbh-pdf-make.js; the library carries its licence',/["']nbh-html2canvas\.js["']/.test(sw)&&/["']nbh-pdf-make\.js["']/.test(sw)&&/MIT License/.test(lib.slice(0,1800))&&/Permission is hereby granted/.test(lib.slice(0,1800)));
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await b.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
