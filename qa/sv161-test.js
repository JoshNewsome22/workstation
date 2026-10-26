/* v24.61 Form RS-1 and the 2016 supervision articles and Parsons, Rollyson & Reid (2012), sent by the BCBA on 10/26: the five
   readings are in the picker, cited as printed; a supervisor's written conditions take what they cover (kept, printed, read back
   from the file, left out when empty; not a BACB check); behavior skills training takes the written description and practice to
   mastery, with the old four boxes where they were; a group contact names the meeting practices; The Effects of Supervision
   carries the articles' questions and the trouble paragraph. Simulated names only.
   usage: node qa/sv161-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const R=await p.evaluate(()=>{const L=typeof NBH_READINGS!=='undefined'?NBH_READINGS:[];const g=k=>L.find(x=>x.k===k)||{};
   return {b:g('sellers2016b'),t:g('turner2016'),c:g('sellers2016c'),v:g('valentino2016'),p:g('parsons2012'),old:!!g('sellers2016').apa,sorted:L.map(x=>x.k).join()===L.map(x=>x.k).sort().join(),long:L.filter(x=>(x.sum||'').length>460).length};});
 ok('the five readings are in the picker, cited as printed, with their DOIs where printed',/^Sellers, T\. P\., Valentino, A\. L\., & LeBlanc, L\. A\. \(2016\)\. Recommended practices for individual supervision/.test(R.b.apa)&&/9, 274–286\.$/.test(R.b.apa)&&R.b.doi==='10.1007/s40617-016-0110-7'&&
   /^Turner, L\. B\., Fischer, A\. J\., & Luiselli, J\. K\. \(2016\)/.test(R.t.apa)&&/9, 287–298\.$/.test(R.t.apa)&&R.t.doi==='10.1007/s40617-016-0121-4'&&
   /^Sellers, T\. P\., LeBlanc, L\. A\., & Valentino, A\. L\. \(2016\)\. Recommendations for detecting and addressing barriers/.test(R.c.apa)&&/9, 309–319\.$/.test(R.c.apa)&&R.c.doi==='10.1007/s40617-016-0142-z'&&
   /^Valentino, A\. L\., LeBlanc, L\. A\., & Sellers, T\. P\. \(2016\)\. The benefits of group supervision/.test(R.v.apa)&&R.v.doi==='10.1007/s40617-016-0138-8'&&
   /^Parsons, M\. B\., Rollyson, J\. H\., & Reid, D\. H\. \(2012\)\. Evidence-based staff training/.test(R.p.apa)&&/5\(2\), 2–11\.$/.test(R.p.apa)&&!('doi' in R.p)&&R.old&&R.sorted&&!R.long,R);
 await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:'',agree:'2026-08-03'}];renderAll();setView('setup');});await sleep(300);
 const before=await p.evaluate(()=>({iss:supIssues(S.sups[0]).length,st:stats(yearKeys(setupYear())[0]).status}));
 const box0=await p.evaluate(()=>({closed:!document.querySelector('details[data-covbox="s1"]').open,n:document.querySelector('[data-covn="s1"]').textContent}));
 await p.click('details[data-covbox="s1"] > summary');await sleep(150);
 const box=await p.evaluate(()=>({n:document.querySelectorAll('[data-cov="s1"]').length,vis:!!document.querySelector('#sup_s1_cov_roles')&&!!document.querySelector('#sup_s1_cov_roles').offsetParent}));
 ok('each supervisor shows what the written conditions cover: folded with its count, ten boxes when opened',box0.closed&&box0.n==='0 of 10 ticked'&&box.n===10&&box.vis,{box0,box});
 await p.check('#sup_s1_cov_end');await p.check('#sup_s1_cov_roles');await p.check('#sup_s1_cov_eval');await sleep(150);
 const A=await p.evaluate(()=>{const k=yearKeys(setupYear())[0];const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];curKey=k;renderPrint();
   const o=fromFile(JSON.parse(JSON.stringify(saveObj())));const o2=fromFile({form:'RS-1',S:Object.assign(JSON.parse(JSON.stringify(S)),{sups:[Object.assign({},S.sups[0],{covers:['nonsense']})]})});
   return {cnt:document.querySelector('[data-covn="s1"]').textContent,c:S.sups[0].covers,printed:(document.getElementById('monthOut').textContent.match(/supervision conditions in writing 8\/3\/2026 \(covering [^)]*\)/)||[''])[0],back:o.sups[0].covers,junk:!('covers' in o2.sups[0]),iss:supIssues(S.sups[0]).length,st:stats(k).status};});
 ok('the ticks are kept in the list\'s order, print with the supervisor, come back from the file, and anything else is dropped',JSON.stringify(A.c)==='["roles","eval","end"]'&&A.cnt==='3 of 10 ticked'&&A.printed==='supervision conditions in writing 8/3/2026 (covering responsibilities, how performance is judged, ending and hand-off)'&&JSON.stringify(A.back)===JSON.stringify(A.c)&&A.junk,A);
 ok('a record, not a BACB check: the supervisor\'s requirements are as before',A.iss===before.iss,{before,A});
 await p.uncheck('#sup_s1_cov_end');await p.uncheck('#sup_s1_cov_roles');await p.uncheck('#sup_s1_cov_eval');await sleep(100);
 const G=await p.evaluate(()=>({gone:!('covers' in S.sups[0]),file:!('covers' in fromFile(JSON.parse(JSON.stringify(saveObj()))).sups[0])}));
 ok('with every box clear the supervisor holds no covers list, and neither does the file',G.gone&&G.file,G);
 /* behavior skills training and the group contact */
 const B=await p.evaluate(()=>{const k=yearKeys(setupYear())[0];curKey=k;const m=month(k);m.contacts=[{id:'c1',date:k+'-05',start:'09:00',end:'10:00',sup:'s1',format:'group',group:'3',mode:'person',obs:'yes',client:'SIM-0001',sact:[],acts:[],bst:[]}];setView('month');renderAll();
   const d=document.querySelector('details.rs-contact[data-cid="c1"]');if(d)d.open=true;return BST.slice();});
 await sleep(300);
 const ids=await p.evaluate(()=>['b0','b3','b4','b5'].map(j=>{const e=document.getElementById('c_c1_'+j);return e&&e.value;}));
 ok('behavior skills training: the four boxes where they were, then the written description and practice to mastery',JSON.stringify(ids)==='["Instruction","Feedback","Written description","Practice to mastery"]',{ids,B});
 await p.evaluate(()=>{const e=document.getElementById('c_c1_b5');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));const f=document.getElementById('c_c1_b0');f.checked=true;f.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
 const B2=await p.evaluate(()=>{const c=month(curKey).contacts[0];const o=fromFile(JSON.parse(JSON.stringify(saveObj())));renderPrint();
   const grp=document.querySelector('[data-grp="c1"]');return {bst:c.bst,back:JSON.stringify(o.months?Object.values(o.months).flatMap(m=>m.contacts||[]).find(x=>x.id==='c1').bst:null),printed:/Instruction, Practice to mastery/.test(document.getElementById('monthOut').textContent),
     hint:grp&&!grp.hidden&&/agenda sent ahead/.test(grp.textContent)&&/Valentino, LeBlanc & Sellers, 2016/.test(grp.textContent),parsons:/Parsons, Rollyson & Reid, 2012/.test(document.querySelector('details.rs-contact[data-cid="c1"]').textContent)};});
 ok('the new steps are kept, printed and read back; the hint names Parsons et al. (2012)',JSON.stringify(B2.bst)==='["Instruction","Practice to mastery"]'&&B2.printed&&B2.parsons&&(B2.back===null||B2.back==='["Instruction","Practice to mastery"]'),B2);
 ok('a group contact names the meeting practices of Valentino, LeBlanc & Sellers (2016)',B2.hint,B2);
 const E=await p.evaluate(()=>{setView('rbt');const h=document.getElementById('effList').parentElement.textContent;return {q:/What do you like best about the supervision activities\?/.test(h)&&/Are there any additional supports I could provide\?/.test(h),t:/When supervision itself runs into trouble/.test(h)&&/apologize/.test(h)};});
 ok('The Effects of Supervision carries the articles\' questions for the RBT and what to do when supervision runs into trouble',E.q&&E.t,E);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
