/* v24.62 Form RS-1 and the Supervisor Training Curriculum Outline (2.0): each review of the effects of supervision records what
   was looked at (eight boxes in the outline's terms), kept in the list's order, printed with the review in the year summary,
   read back from the file and left out when empty; a review with only boxes ticked still prints and asks before removal.
   Simulated names only.  usage: node qa/ste162-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';renderAll();setView('rbt');});await sleep(300);
 await p.click('#addEff');await sleep(200);
 const id=await p.evaluate(()=>S.effects[0].id);
 const B=await p.evaluate(id=>({n:document.querySelectorAll('[data-efs="'+id+'"]').length,hint:/Supervisor Training Curriculum Outline \(2\.0\)/.test(document.getElementById('effList').parentElement.textContent)}),id);
 ok('each review shows eight "Looked at" boxes; the hint names the Curriculum Outline (2.0)',B.n===8&&B.hint,B);
 await p.check('#ef_'+id+'_s_self');await p.check('#ef_'+id+'_s_client');await p.check('#ef_'+id+'_s_view');await sleep(150);
 await p.fill('#ef_'+id+'_date',await p.evaluate(()=>yearKeys(setupYear())[0]+'-28'));
 const A=await p.evaluate(()=>{const ks=yearKeys(setupYear());setView('print');curKey=ks[0];renderPrint();const y=document.getElementById('yearOut').textContent;
   const o=fromFile(JSON.parse(JSON.stringify(saveObj())));const o2=fromFile({form:'RS-1',S:Object.assign(JSON.parse(JSON.stringify(S)),{effects:[{id:'z',date:'2026-09-01',view:'x (simulated)',src:['bogus']}]})});
   return {src:S.effects[0].src,printed:(y.match(/looked at .*?self-rating/)||[''])[0],back:o.effects[0].src,junk:!('src' in o2.effects[0])};});
 ok('the ticks are kept in the list\'s order, print with the review (even with nothing typed), come back from the file; anything else is dropped',JSON.stringify(A.src)==='["client","view","self"]'&&A.printed==='looked at the client’s data, the RBT’s satisfaction, the supervisor’s self-rating'&&JSON.stringify(A.back)===JSON.stringify(A.src)&&A.junk,A);
 await p.evaluate(()=>setView('rbt'));await sleep(200);
 await p.uncheck('#ef_'+id+'_s_self');await p.uncheck('#ef_'+id+'_s_client');await p.check('#ef_'+id+'_s_fid');await p.uncheck('#ef_'+id+'_s_view');await sleep(100);
 const C=await p.evaluate(()=>S.effects[0].src);
 ok('unticking keeps the rest',JSON.stringify(C)==='["fid"]',C);
 await p.evaluate(()=>{window.__asked=[];nbhUI.confirm=async m=>{window.__asked.push(m);return true;};});
 await p.click('[data-efdel]');await sleep(300);
 const D=await p.evaluate(()=>({gone:!S.effects,asked:window.__asked.length}));
 ok('a review with only boxes ticked asks before it is removed',D.gone&&D.asked===1,D);
 await p.click('#addEff');await sleep(200);
 const E=await p.evaluate(()=>{const id=S.effects[0].id;const e=document.getElementById('ef_'+id+'_s_obs');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));
   return {has:'src' in S.effects[0],file:!('src' in fromFile(JSON.parse(JSON.stringify(saveObj()))).effects?.[0]||{})};});
 ok('with every box clear the review holds no list',!E.has,E);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
