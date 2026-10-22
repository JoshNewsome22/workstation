/* v23.96 the record RS-1 emails or saves keeps its layout: the record's screen styles travel in the page, and the tables and
   header carry their styles inline for mail programs that drop a style block. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const f=fs.readdirSync(ROOT+'/NBH-Workstation').find(x=>x.startsWith('RS-1_'));await p.goto(URL+f);await p.waitForTimeout(1200);
 await p.evaluate(()=>document.querySelector('#simBtn').click());await p.waitForTimeout(500);await p.evaluate(()=>{const b=[...document.querySelectorAll('dialog button, [role=dialog] button')].find(b=>/^Load$/.test(b.textContent.trim()));b&&b.click();});await p.waitForTimeout(2000);
 const pg=await p.evaluate(()=>{const g=window.__rsShare.page('month');const st=(g.html.match(/<style>([\s\S]*?)<\/style>/)||['',''])[1];return {rules:(st.match(/\.rs-paper[^{]*\{/g)||[]).length,screen:/\.rs-paper table\.p-t th/.test(st),print:/@media print/.test(st)||/9pt/.test(st),td:(g.html.match(/<td[^>]*style="border:1px solid #999/g)||[]).length,head:/class="p-head" style="/.test(g.html),title:g.title,name:/Jordan Lee/.test(g.html)};});
 ok('the page carries the record\'s screen styles (dozens of .rs-paper rules, the table rules among them) and none of the print block',pg.rules>20&&pg.screen&&!pg.print,pg);
 ok('the tables and the header carry their styles inline as well',pg.td>40&&pg.head,pg);
 ok('the simulated month\'s record is the one sent, named for the RBT',pg.name&&/Jordan Lee/.test(pg.title),pg);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
