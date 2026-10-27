/* v24.67 Form RS-1 (the BCBA's screenshots, 10/26): each signature box says whether the month on screen is signed (how and
   when) or not yet; the typed-signature panel starts empty and closed for each month, so a tick left from another month does
   not make a month look signed. Simulated only.  usage: node qa/sgs167-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1280,height:1100}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const [k1,k2]=await p.evaluate(()=>{const ks=yearKeys(setupYear());S.setup.rbt_name='Lee Park (simulated)';S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];curKey=ks[0];setView('print');renderAll();return [ks[0],ks[1]];});
 await sleep(300);
 const st=()=>p.evaluate(()=>[...document.querySelectorAll('[data-sigstat]')].map(e=>e.hidden?'(hidden)':e.textContent));
 const A=await st();
 ok('an unsigned month says so under each box, and how to sign',A.length===2&&A.every(t=>/^Not signed yet for August 2026: sign in the box, or type the name below, tick the box and press Adopt and sign\.$/.test(t)),A);
 await p.evaluate(()=>{document.querySelector('details.rs-typesig').open=true;});await p.fill('#ts_sup','Dana Cole');await p.check('#tsok_sup');await p.click('[data-tsgo="sup_img"]');await sleep(200);
 const B=await st();
 ok('after Adopt and sign, the supervisor\'s box says it is signed, typed and adopted, with the time; the RBT\'s still not',/^✓ Signed for August 2026: typed name adopted, \d+\/\d+\/\d{4}, \d+:\d\d [AP]M$/.test(B[0])&&/^Not signed yet/.test(B[1]),B);
 await p.evaluate(()=>{const d=document.querySelectorAll('details.rs-typesig')[1];d.open=true;});await p.fill('#ts_rbt','Lee Park');await p.check('#tsok_rbt');await sleep(100);
 await p.evaluate(k=>{const bt=[...document.querySelectorAll('#printMonthBar button')].find(x=>x.dataset.pmonth===k)||null;if(bt)bt.click();else{curKey=k;renderPrint();}},k2);await sleep(300);
 const C=await p.evaluate(()=>({key:curKey,tick:[...document.querySelectorAll('[data-tsok]')].map(c=>c.checked),name:[...document.querySelectorAll('[data-tsname]')].map(i=>i.value),open:[...document.querySelectorAll('details.rs-typesig')].map(d=>d.open),go:[...document.querySelectorAll('[data-tsgo]')].map(b=>b.disabled),stat:[...document.querySelectorAll('[data-sigstat]')].map(e=>e.textContent)}));
 ok('switching to September: the typed-signature panel is empty and closed, nothing ticked, and both boxes say not signed yet for September',C.key===k2&&C.tick.every(x=>!x)&&C.name.every(x=>!x)&&C.open.every(x=>!x)&&C.go.every(x=>x)&&C.stat.every(t=>/^Not signed yet for September 2026/.test(t)),C);
 await p.evaluate(k=>{curKey=k;renderPrint();},k1);await sleep(200);
 const D=await st();
 ok('back on August, the supervisor\'s signature is still there and says so',/^✓ Signed for August 2026/.test(D[0])&&/^Not signed yet for August 2026/.test(D[1]),D);
 await p.click('[data-padclear="sup_img"]');await sleep(150);const E=await st();
 ok('Clear the signature: the box says not signed yet again',/^Not signed yet for August 2026/.test(E[0]),E);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
