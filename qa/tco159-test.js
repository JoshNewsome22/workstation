/* v24.59 Form RS-1 and the RBT Test Content Outline (3rd ed.): a contact offers the outline's tasks of the domains ticked
   on it (none before a domain is ticked); a ticked task is kept on the contact in the outline's order; unticking a domain
   drops its tasks; the printed record and the spreadsheet give the codes beside the domains; the year summary prints the
   tasks covered of 43, by domain, and the ones not yet covered; the file keeps the codes and takes no others.
   Simulated names only. usage: node qa/tco159-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1180,height:1000},acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const N=await p.evaluate(()=>({n:TCOT.length,per:'ABCDEF'.split('').map(L=>TCOT.filter(x=>x.c[0]===L).length).join(',')}));
 ok('the outline\'s 43 tasks, 8, 3, 11, 7, 4 and 10 by domain',N.n===43&&N.per==='8,3,11,7,4,10',N);
 await p.evaluate(()=>{const k=yearKeys(setupYear())[0];S.setup.rbt_name='Lee Park (simulated)';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];
   m.contacts=[{id:'c1',date:k+'-04',start:'09:00',end:'10:00',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}}];
   curKey=k;openC=new Set(['c1']);renderAll();setView('month');renderMonth();const d=document.querySelector('details.rs-contact');if(d)d.open=true;});await sleep(300);
 const E0=await p.evaluate(()=>document.querySelector('[data-tcot="c1"]').innerHTML);
 ok('before a domain is ticked, no tasks are offered; it says to tick an area',!/data-tco=/.test(E0)&&/Tick an area above, and its tasks appear here/.test(E0),E0);
 await p.check('input[data-c="c1"][data-arr="acts"][value="Behavior acquisition"]');await p.check('input[data-c="c1"][data-arr="acts"][value="Behavior reduction"]');await sleep(200);
 const E1=await p.evaluate(()=>[...document.querySelectorAll('[data-tcot="c1"] input[data-tco]')].map(i=>i.dataset.tco));
 ok('ticking Behavior acquisition and Behavior reduction offers their 18 tasks (C.1 to C.11, D.1 to D.7)',E1.length===18&&E1[0]==='C.1'&&E1[17]==='D.7',E1);
 await p.check('input[data-c="c1"][data-tco="D.3"]');await p.check('input[data-c="c1"][data-tco="C.7"]');await p.check('input[data-c="c1"][data-tco="C.3"]');await sleep(150);
 const E2=await p.evaluate(()=>month(curKey).contacts[0].tco);
 ok('the tasks ticked are kept on the contact in the outline\'s order',JSON.stringify(E2)==='["C.3","C.7","D.3"]',E2);
 await p.uncheck('input[data-c="c1"][data-arr="acts"][value="Behavior reduction"]');await sleep(200);
 const E3=await p.evaluate(()=>({tco:month(curKey).contacts[0].tco,shown:document.querySelectorAll('[data-tcot="c1"] input[data-tco]').length}));
 ok('unticking Behavior reduction drops its task (D.3) and its tasks are no longer offered',JSON.stringify(E3.tco)==='["C.3","C.7"]'&&E3.shown===11,E3);
 /* printed record, csv, year summary, file */
 const P=await p.evaluate(()=>{setView('print');renderPrint();return {rec:/Behavior acquisition \(C\.3, C\.7\)/.test(document.getElementById('monthOut').textContent),year:(document.getElementById('yearOut').textContent.match(/RBT Test Content Outline \(3rd ed\.\) tasks covered in supervision:.*?F\.10\./)||[''])[0]};});
 ok('the printed record gives the codes beside the domain',P.rec,P);
 ok('the year summary prints the tasks covered of 43, by domain, and those not yet covered',/tasks covered in supervision: 2 of 43 \(A 0 of 8, B 0 of 3, C 2 of 11, D 0 of 7, E 0 of 4, F 0 of 10\)\. Not yet: A\.1, A\.2, .*C\.1, C\.2, C\.4, .*F\.10\.$/.test(P.year),P.year);
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:10000}),p.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=require('fs').readFileSync(await dl.path(),'utf8');
 ok('the spreadsheet gives the codes beside the domain',/Behavior acquisition \(C\.3, C\.7\)/.test(csv),csv.split('\n').slice(0,3).join(' | ').slice(0,300));
 const F=await p.evaluate(()=>{const k=curKey,o=fromFile(JSON.parse(JSON.stringify(saveObj())));const S2=JSON.parse(JSON.stringify(S));S2.months[k].contacts[0].tco=['C.7','Z.9','C.3','c.1'];const o2=fromFile({form:'RS-1',S:S2});
   S2.months[k].contacts[0].tco=[];const o3=fromFile({form:'RS-1',S:S2});return {back:o.months[k].contacts[0].tco,clean:o2.months[k].contacts[0].tco,none:'tco' in o3.months[k].contacts[0]};});
 ok('the file keeps the codes, takes no others (sorted), and holds none when there are none',JSON.stringify(F.back)==='["C.3","C.7"]'&&JSON.stringify(F.clean)==='["C.3","C.7"]'&&!F.none,F);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
