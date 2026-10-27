/* v24.68 Form RS-1, from the BCBA's screenshots of the whole form (10/27): the reference list's years and sources; Readings
   This Year shows each summary; the year summary through a past month says the credential line is as of its end; the PDU
   cycle filled from the expiration date on request; the oversight note without a doubled period; the Guide's BST line.
   Simulated only.  usage: node qa/rev168-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1280,height:1100}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const G=await p.evaluate(()=>{const t=[...document.querySelectorAll('p.hint')].find(x=>/Reference list\./.test(x.textContent)).textContent.replace(/\s+/g,' ');return {t,bst:/a short written description, modeling, rehearsal and feedback, repeated until the skill is done correctly, then checked on the job/.test(document.body.textContent)};});
 ok('the reference list gives the BACB documents\' years and every source the form cites',['(2020). Ethics code for behavior analysts','(2021). RBT ethics code (2.0)','(2023). RBT test content outline (3rd ed.)','(2018). Supervisor training curriculum outline (2.0)','Supervision checklist for RBTs (version 2/2024)','Supervision checklist for RBT supervisors and RBT requirements coordinators (version 6/2026)','Sellers, T. P., Alai-Rosales','Sellers, T. P., LeBlanc','Sellers, T. P., Valentino','Turner, L. B.','Valentino, A. L.'].every(x=>G.t.includes(x))&&G.bst,G.t.slice(0,300));
 const A=await p.evaluate(()=>{const ks=yearKeys(setupYear()),k=ks[0];S.setup.rbt_name='Lee Park (simulated)';S.setup.path='recert';S.setup.rbt_exp='2028-11-01';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:'Under contract with the district (simulated).'}];
   const r=RD().find(x=>x.k==='kimball2023')||RD()[0];month(k).contacts=[{id:'c1',date:k+'-10',start:'12:30',end:'15:30',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-1',acts:[],sact:[],bst:[],feedback:'',follow:'',readings:[{id:'r1',k:r.k,apa:r.apa,doi:r.doi||'',sum:'',disc:'D (simulated)',next:''}]}];
   curKey=k;renderAll();setView('rbt');const rl=document.getElementById('rdYearList')||[...document.querySelectorAll('.rs-rd')].map(x=>x.parentElement)[0];
   return {sum:r.sum,list:[...document.querySelectorAll('.rs-rd')].map(x=>x.textContent).join(' | ')};});
 ok('Readings This Year shows the reading\'s summary (from the readings when the reading holds none)',A.list.includes('Summary: '+A.sum),A.list.slice(0,300));
 const Y=await p.evaluate(()=>{const ks=yearKeys(setupYear());setView('print');curKey=ks[0];renderPrint();const t=document.getElementById('yearOut').textContent,m=document.getElementById('monthOut').textContent;
   return {cred:(t.match(/As of \d+\/\d+\/\d{4}: \d+ days left[^.]*\./)||[''])[0],dbl:/\.\)\./.test(m),ov:(m.match(/Under contract with the district \(simulated\)\)/)||[''])[0]};});
 ok('the year summary through a past month says the credential line is as of that month\'s end',/^As of \d+\/31\/2026: \d+ days left/.test(Y.cred),Y);
 ok('the oversight note prints without a doubled period',!Y.dbl&&!!Y.ov,Y);
 await p.evaluate(()=>setView('rbt'));await sleep(200);
 const C=await p.evaluate(()=>{const b=document.getElementById('cycFillBtn');return {shown:!!b&&!document.getElementById('cycFill').hidden,t:b&&b.textContent};});
 ok('with the two-year path, the expiration date and no cycle dates, a button offers the two years ending on the expiration date',C.shown&&C.t==='Use the two years ending on the expiration date: 11/2/2026 to 11/1/2028',C);
 await p.click('#cycFillBtn');await sleep(200);
 const D=await p.evaluate(()=>({c:[S.cred.cycle_start,S.cred.cycle_end],f:[document.getElementById('cCycle').value,document.getElementById('cCycleEnd').value],hidden:document.getElementById('cycFill').hidden}));
 ok('it fills both dates (11/2/2026 to 11/1/2028) and goes away',D.c.join()==='2026-11-02,2028-11-01'&&D.f.join()==='2026-11-02,2028-11-01'&&D.hidden,D);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
