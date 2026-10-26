/* v23.94 Form RS-1: the section text runs the width of its column; a wrapped label keeps its box on the row; Share the record
   (email through the workstation, a file to attach; the concerns never included). */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561');const ROOT=process.env.WS_ROOT||'.';
const file=pre=>fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>f.startsWith(pre));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1180,height:820},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL+'/NBH-Workstation/'+file('RS-1_'));await sleep(1200);
 const set=async(sel,v)=>p.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
 await set('#sName','Jordan Lee (simulated)');await set('#sEmail','jlee@example.org');
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.toolbar button')].find(b=>/^Month/.test(b.textContent.trim()));b&&b.click();});await sleep(500);
 const m=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const a=r('#mStart'),c=r('#mBreak'),l=r('label[for=mBreak]'),la=r('label[for=mStart]');return {row:Math.abs(la.top-l.top)<2,same:Math.abs(a.bottom-c.bottom)<2,lines:l.height>la.height+8,lh:[la.height,l.height],tops:[a.top,c.top]};});
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.toolbar button')].find(b=>/^Setup/.test(b.textContent.trim()));b&&b.click();});await sleep(300);
 ok('on the Month sheet at iPad width the usual-hours boxes sit on one line (v24.50: the labels are short enough not to wrap; a wrapped one would not move its box)',m.same,m);
 const w=await p.evaluate(()=>{const h=document.querySelector('.only-setup p.hint'),sec=h.closest('section')||h.parentElement;return {hint:h.getBoundingClientRect().width,col:h.parentElement.getBoundingClientRect().width,cap:getComputedStyle(h).maxWidth};});
 ok('the setup\'s explanatory text runs the width of its column (no 80-character cap on screen)',w.cap==='none'&&w.hint>=w.col-4&&w.hint>700,w);
 const sh=await p.evaluate(()=>({h2:!!document.querySelector('#rs-share'),rbt:document.querySelector('#shRbt').value,btns:['#shMonth','#shYear','#shFile'].every(s=>document.querySelector(s))}));
 ok('Share the record sits on Sign and print, with the RBT\'s email from Setup and the three buttons',sh.h2&&sh.rbt==='jlee@example.org'&&sh.btns,sh);
 /* a concern entered (v24.54: set in the record itself; the first box of that page section is the credential's notes, which
    the year summary prints, and the month's PDF now carries the year summary) */
 await p.evaluate(()=>{S.concerns=[{id:'q1',date:'2026-10-01',concern:'This text is confidential and must not travel',investigated:'',decision:'',plan:'',outcome:'',outcome_date:''}];renderAll();});
 const pg=await p.evaluate(()=>{const pg=window.__rsShare.page('month');return pg&&{title:pg.title,hasConc:/must not travel/.test(pg.html),hasRbt:/Jordan Lee/.test(pg.html),css:/\.rs-paper/.test(pg.html),recips:window.__rsShare.recipients().map(r=>r.to)};});
 ok('the page to send is the month\'s record as it prints, with its styles, the RBT named, and no concerns text',pg&&pg.hasRbt&&pg.css&&!pg.hasConc&&/RBT supervision record/.test(pg.title)&&pg.recips.join()==='jlee@example.org',pg);
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}),p.evaluate(()=>document.querySelector('#shFile').click())]);const path=await dl.path();const txt=fs.readFileSync(path,'latin1');
 ok('Save the record as a file downloads the record (v24.52: a PDF named after the RBT and the month, no concerns text)',/\.pdf$/.test(dl.suggestedFilename())&&/^%PDF-/.test(txt)&&/\(Jordan\)/.test(txt)&&!/\(travel\)/.test(txt),dl.suggestedFilename());
 const [dl2]=await Promise.all([p.waitForEvent('download',{timeout:8000}),p.evaluate(()=>document.querySelector('#shMonth').click())]);
 const note=await p.evaluate(()=>document.querySelector('#shNote').textContent);
 ok('on its own the page cannot send: it says so and gives the file instead',/cannot send email/.test(note)&&/\.pdf$/.test(dl2.suggestedFilename()),note);
 /* inside the workstation: the request reaches the shell, which answers (no Google key here: unavailable, with its reason) */
 const p2=await ctx.newPage();const errs2=[];p2.on('pageerror',e=>errs2.push(String(e)));await p2.goto(URL+'/NBH-Workstation/index.html');await sleep(1300);
 await p2.evaluate(()=>openForm('RS-1'));await p2.waitForFunction(()=>!!state.status['RS-1'],null,{timeout:40000});await sleep(1500);
 const fr=p2.frames().find(f=>/RS-1_/.test(f.url()));
 await fr.evaluate(()=>{const s=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};s('#sName','Jordan Lee (simulated)');s('#shOther','bcba2@example.org');});
 const [dl3]=await Promise.all([p2.waitForEvent('download',{timeout:10000}).catch(()=>null),fr.evaluate(()=>document.querySelector('#shMonth').click())]);await sleep(1200);
 const note2=await fr.evaluate(()=>document.querySelector('#shNote').textContent);
 ok('inside the workstation the request goes to the shell: without a Google key it answers why, and the file is given',/Google sign-in key|not set|could not send|Not sent/.test(note2)&&/file to attach/.test(note2)&&!!dl3,note2);
 ok('no page errors',!errs.length&&!errs2.length,errs.concat(errs2).slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
