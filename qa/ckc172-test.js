/* v24.72 Form RS-1 (the BCBA's August PDF, 10/27; the simulated year here): the printed and PDF year summary carries the checklist average by month,
   as the Year page does; the month PDF still keeps the closing note whole. Simulated names only.
   usage: node qa/ckc172-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const pagesOf=s=>[...s.matchAll(/\/Type \/Page \/Parent[^\n]*\/Contents (\d+) 0 R/g)].map(m=>{const i=s.indexOf('\n'+m[1]+' 0 obj\n');const a=s.indexOf('stream\n',i)+7;return s.slice(a,s.indexOf('endstream',a));});
const words=pg=>[...pg.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map(m=>m[1].replace(/\\(.)/g,'$1'));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 let k=await p.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();const ks=yearKeys(setupYear()).filter(x=>stats(x).ckN);const k=ks[ks.length-1];curKey=k;renderAll();return {k,want:ks.length};});
 const want=k.want;k=k.k;
 await sleep(300);
 const Y=await p.evaluate(k=>{setView('print');curKey=k;renderPrint();const o=document.getElementById('yearOut'),h=[...o.querySelectorAll('h4')].find(x=>/Checklist average by month/.test(x.textContent));
   return {k,h:!!h,svg:!!(h&&h.parentElement.querySelector('svg[aria-label="Observation checklist average by month"]')),pts:h?h.parentElement.querySelectorAll('circle').length:0,after:h&&/Percent supervised by month/.test((h.parentElement.previousElementSibling||{}).textContent||'')};},k);
 ok('the printed year summary has "Checklist average by month" with its chart, after the percent chart',Y.h&&Y.svg&&Y.after,Y);
 ok('the chart has a point for each month with a scored checklist (simulated year, through the last scored month)',want>=1&&Y.pts===want,{want,Y});
 const P=await p.evaluate(async k=>{curKey=k;renderPrint();const r=await window.__rsShare.pdfOf('month');return {s:atob(r.b64),pages:r.pages};},k);
 const pg=pagesOf(P.s).map(words),where=re=>pg.findIndex(w=>re.test(w.join(' ')));
 const imgs=(P.s.match(/\/Subtype \/Image/g)||[]).length;
 ok('the month PDF: the year summary has both charts as pictures',imgs>=2&&where(/Year Summary/i)>0,{imgs,y:where(/Year Summary/i)});
 ok('the month PDF: the closing note is whole on one page, with "year summary through" beside it',where(/Keep supervision records/)>=0&&where(/Keep supervision records/)===where(/year summary through/),{pages:pg.length});
 const YP=await p.evaluate(async()=>{const r=await window.__rsShare.pdfOf('year');return r.pages;});
 ok('the year PDF is still one or two pages',YP>=1&&YP<=2,YP);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed')+' (pages '+pg.length+', year '+YP+')');await b.close();process.exit(bad?1:0);})();
