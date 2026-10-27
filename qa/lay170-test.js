/* v24.70 Form RS-1 layout (the BCBA, 10/27): the pinned toolbar spans the page; Every supervisee is one line that opens to the
   table and stays as left; each checklist phase folds with its count (finished phases and the end of supervision start
   folded) and a ticked item's date sits beside it; long guidance opens from "More". Simulated only.
   usage: node qa/lay170-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1100,height:900}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();setView('rbt');});await sleep(400);
 const T=await p.evaluate(()=>{const t=document.querySelector('.toolbar').getBoundingClientRect(),s=document.querySelector('.sheet').getBoundingClientRect();return {t:[Math.round(t.left),Math.round(t.right)],s:[Math.round(s.left),Math.round(s.right)]};});
 ok('the pinned toolbar spans the page column (nothing shows beside it)',T.t[0]<=T.s[0]+1&&T.t[1]>=T.s[1]-1,T);
 const W=await p.evaluate(()=>{const d=document.querySelector('#rbtAll details.rs-who-d');return {d:!!d,open:d&&d.open,sum:d&&d.querySelector('summary').textContent,rows:document.querySelectorAll('#rbtAll tbody tr').length};});
 ok('Every supervisee is one line (each RBT and the month\'s state), folded; the table is inside it',W.d&&!W.open&&/^Every supervisee, \w+ 2026 Jordan Lee \(simulated\): .+ · Casey Morgan \(simulated\): /.test(W.sum)&&W.rows===2,W);
 await p.click('#rbtAll details.rs-who-d > summary');await sleep(150);await p.evaluate(()=>renderAll());await sleep(200);
 const W2=await p.evaluate(()=>document.querySelector('#rbtAll details.rs-who-d').open);
 ok('opened, it stays open when the page redraws',W2,W2);
 const C=await p.evaluate(()=>{S.ckl={};CKL[0][2].filter(i=>!i.auto&&ckOn(i)).forEach(i=>S.ckl[i.k]='2026-08-10');window.__ckOpen={};ckPaint();
   const G=[...document.querySelectorAll('#ckList details.rs-ckgrp')].map(d=>({g:d.dataset.ckg,open:d.open,n:d.querySelector('.rs-ckn').textContent}));
   const before=G.find(x=>x.g==='before');return {G,full:before&&ckSummary().find(z=>z.g==='before')};});
 const g=k=>C.G.find(x=>x.g===k)||{};
 ok('each phase folds with its count; a finished phase and the end of supervision start folded, the rest open',C.G.length===4&&(C.full.n===C.full.of?!g('before').open:true)&&g('first').open&&g('ongoing').open&&!g('end').open&&/^0 of 3 \(when supervision ends\)$/.test(g('end').n)&&/^\d+ of \d+$/.test(g('first').n),C);
 const D=await p.evaluate(()=>{const k=CKL[1][2].find(i=>!i.auto&&ckOn(i)).k;S.ckl[k]='2026-08-12';ckPaint();const li=document.querySelector('#ckList li[data-ckitem="'+k+'"]'),lab=li.querySelector('div>label'),dt=li.querySelector('.rs-ckd');const a=lab.getBoundingClientRect(),c=dt.getBoundingClientRect();return {side:c.left>a.left+100&&c.top<a.bottom,first:document.querySelector('details[data-ckg="first"]').open};});
 ok('a ticked item\'s date sits beside it, not on a line of its own; a phase stays as the user left it after a tick',D.side&&D.first,D);
 const H=await p.evaluate(()=>getComputedStyle(document.getElementById('ckSum')).display);
 ok('the line of counts above the phases is hidden (each heading carries its own)',H==='none',H);
 const M=await p.evaluate(()=>[...document.querySelectorAll('details.rs-more')].map(d=>({open:d.open,s:d.querySelector('summary').textContent,has:d.textContent.length})));
 ok('long guidance (the effects of supervision, the checklists) opens from "More"',M.length>=2&&M.every(x=>!x.open&&/^More/.test(x.s)&&x.has>150),M);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
