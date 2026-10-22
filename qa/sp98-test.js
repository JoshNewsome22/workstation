/* v23.98 Form SP-1: Print a sample sheet (the student's behaviors with made-up marks, every page SAMPLE, the student's marks
   untouched) and the how-to video link that prints as a QR code in the sheet's head. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
const setV=(p,v)=>p.evaluate(v=>{const i=document.querySelector('#spVideo');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));},v);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1200);
 // a student set up by hand: two behaviors, a few marks of their own, the activity column
 await p.evaluate(()=>{state.meta.client='Sample Student (simulated)';state.meta.behavior='Aggression';state.meta.definition='Hits, kicks or pushes another person.';state.meta.threshold='2';
   state.cfg.actOn=true;state.cfg.activity=['Arrival','Morning meeting','Independent math','Independent math','Specials','Lunch','Transition back','Writing','Group reading','Pack up'];
   cellOf(2,0).s=2;cellOf(5,3).s=1;commitBeh();
   state.behaviors.push({meta:{behavior:'Elopement',definition:'Leaves the assigned area without permission.',threshold:'1'},cells:{}});render();});
 await sleep(300);
 const before=await p.evaluate(()=>({cells:JSON.stringify(state.cells),cur:state.cur,n:state.behaviors.length,marked:summaryData().marked}));
 const smp=await p.evaluate(()=>{const pages=window.spSamplePages();const q=(el,s)=>[...el.querySelectorAll(s)];
   return {n:pages.length,sample:pages.every(x=>x.classList.contains('sp-sample')),banner:pages.every(x=>/SAMPLE/.test((x.querySelector('.sp-sambar')||{}).textContent||'')&&/do not count/i.test(x.querySelector('.sp-sambar').textContent)),
     title:pages.every(x=>/SAMPLE$/.test(x.querySelector('.nbh-print-title').textContent)),
     marks:pages.map(x=>q(x,'td.mark.lvl1,td.mark.lvl2,.cell[data-state="1"],.cell[data-state="2"]').length),x:pages.map(x=>q(x,'td.mark.lvlx,.cell[data-state="x"]').length),
     noSum:pages.every(x=>x.querySelector('table.scatter')&&!x.classList.contains('sp-guide')&&!/Pattern Summary|Control Chart/.test(x.textContent)),
     beh:pages.map(x=>(x.querySelector('.sp-rep')||x.querySelector('.ident')||x).textContent.slice(0,400)),
     hot:q(pages[0],'tbody tr').map(tr=>q(tr,'td.mark.lvl1,td.mark.lvl2,.cell[data-state="1"],.cell[data-state="2"]').length)};});
 ok('a sample page per behavior, each watermarked and bannered SAMPLE with the title marked, no summary, control chart or guide',smp.n===2&&smp.sample&&smp.banner&&smp.title&&smp.noSum,smp);
 ok('each sample page carries marks and one interval not observed',smp.marks.every(m=>m>=12)&&smp.x.every(x=>x===1),{marks:smp.marks,x:smp.x});
 ok('the marks sit mostly in the demand intervals named in the activity column (math, transition, writing, pack up)',(()=>{const h=smp.hot;const hot=[2,3,6,7,9].reduce((a,r)=>a+(h[r]||0),0),all=h.reduce((a,x)=>a+x,0);return all>0&&hot/all>=0.6;})(),smp.hot);
 const after=await p.evaluate(()=>({cells:JSON.stringify(state.cells),cur:state.cur,n:state.behaviors.length,marked:summaryData().marked,b0:Object.keys(state.behaviors[0].cells).length,b1:Object.keys(state.behaviors[1].cells).length,screen:document.querySelectorAll('#sheet td.mark.lvl1,#sheet td.mark.lvl2,#sheet .cell[data-state="1"],#sheet .cell[data-state="2"]').length,printall:document.documentElement.classList.contains('sp-printall')}));
 ok('the student\'s own marks, behavior and sheet are exactly as before',after.cells===before.cells&&after.cur===before.cur&&after.n===before.n&&after.marked===before.marked&&after.b1===0&&after.screen===2&&!after.printall,{before,after});
 const normal=await p.evaluate(()=>{const pages=window.spPrintSet();return {n:pages.length,sample:pages.filter(x=>x.classList.contains('sp-sample')).length,bar:pages.filter(x=>x.querySelector('.sp-sambar')).length,marks:pages[0].querySelectorAll('td.mark.lvl1,td.mark.lvl2,.cell[data-state="1"],.cell[data-state="2"]').length};});
 ok('the ordinary print set is unchanged: no SAMPLE on it, the student\'s own marks',normal.sample===0&&normal.bar===0&&normal.marks===2,normal);
 // the how-to video's QR code
 const q0=await p.evaluate(()=>document.querySelectorAll('.sp-qr').length);
 await setV(p,'https://youtu.be/example-walkthrough');await sleep(300);
 const q1=await p.evaluate(()=>({n:document.querySelectorAll('#sheet .nbh-print-meta .sp-qr').length,svg:document.querySelectorAll('#sheet .nbh-print-meta .sp-qr svg.qr path').length,text:(document.querySelector('.sp-qr')||{}).textContent||'',cfg:state.cfg.video,printed:window.spPrintSet().filter(x=>x.querySelector('table.scatter')&&!x.classList.contains('sp-guide')).every(x=>x.querySelector('.sp-qr svg.qr')),sample:window.spSamplePages().every(x=>x.querySelector('.sp-qr svg.qr'))}));
 ok('a video link kept on the record prints as a QR code with "Scan to watch" in the head of every data sheet, the sample included',q0===0&&q1.n===1&&q1.svg===1&&/Scan to watch how to fill out this sheet/.test(q1.text)&&q1.cfg==='https://youtu.be/example-walkthrough'&&q1.printed&&q1.sample,q1);
 const dec=await p.evaluate(()=>{const svg=document.querySelector('.sp-qr svg.qr');return {w:svg.getAttribute('width'),d:(svg.querySelector('path').getAttribute('d')||'').length};});
 ok('the QR code is drawn in the form (no network), as a path of modules',+dec.w>40&&dec.d>2000,dec);
 const st=await p.evaluate(()=>{const j=JSON.stringify(serialize());return {inFile:j.includes('example-walkthrough'),cfg:!!(JSON.parse(j).cfg||{}).video};});
 ok('the link is part of the record (Save data writes it with the sheet\'s setup)',st.inFile&&st.cfg,st);
 await setV(p,'not a link');await sleep(200);
 const q2=await p.evaluate(()=>({n:document.querySelectorAll('.sp-qr').length,cfg:state.cfg.video}));
 await setV(p,'');await sleep(200);
 const q3=await p.evaluate(()=>document.querySelectorAll('.sp-qr').length);
 ok('text that is not a web link prints no code; clearing the field removes it',q2.n===0&&q2.cfg==='not a link'&&q3===0,{q2,q3});
 // print on screen does not alter the live sheet; the sample button exists in the toolbar
 const btn=await p.evaluate(()=>{const b=document.querySelector('#sampleBtn');return b&&b.textContent.trim();});
 ok('the toolbar has "Print a sample sheet" beside Print',btn==='Print a sample sheet',btn);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
