/* v24.66 Form RS-1 (the BCBA's emailed record, 10/26): a contact's readings are kept through the saved file; a reading discussed prints its summary between the reference and what
   was discussed (an older reading without one takes the readings' own); a contact's tasks print beside their own area, on
   the record and in the spreadsheet. Simulated only.  usage: node qa/rds166-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await (await b.newContext({acceptDownloads:true,viewport:{width:1280,height:1000}})).newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const R=await p.evaluate(()=>{const RDx=RD(),r1=RDx.find(x=>x.k==='kimball2023')||RDx[0],r2=RDx.find(x=>x.k==='parsons2012')||RDx[1];const k=yearKeys(setupYear())[1];curKey=k;S.setup.rbt_name='Lee Park (simulated)';
   month(k).contacts=[{id:'c1',date:k+'-10',start:'12:30',end:'15:30',sup:'',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-1',sact:[],acts:['Data collection and graphing','Behavior assessment','Behavior acquisition'],tco:['A.1','A.5','B.2','C.9'],bst:[],feedback:'Simulated.',follow:'',
     readings:[{id:'r1',k:r1.k,apa:r1.apa,doi:r1.doi||'',sum:r1.sum,disc:'Simulated discussion.',next:'Simulated follow-up.'},{id:'r2',k:r2.k,apa:r2.apa,doi:'',sum:'',disc:'Second (simulated).',next:''}]}];
   setView('print');renderPrint();const t=document.getElementById('monthOut').textContent;const csv=typeof csvText==='function'?csvText():'';
   const o=fromFile(JSON.parse(JSON.stringify(saveObj())));
   const back=(o.months[k].contacts[0].readings||[]).map(r=>({apa:r.apa,sum:r.sum,disc:r.disc,next:r.next}));const want=month(k).contacts[0].readings.map(r=>({apa:r.apa,sum:r.sum,disc:r.disc,next:r.next}));
   const S2=JSON.parse(JSON.stringify(saveObj()));S2.S.months[k].contacts[0].readings=[{apa:''},'x',{apa:'Kept (simulated)',disc:5}];const o2=fromFile(S2);
   return {t,s1:r1.sum,s2:r2.sum,same:JSON.stringify(back)===JSON.stringify(want),n:back.length,bad:JSON.stringify((o2.months[k].contacts[0].readings||[]).map(r=>[r.apa,r.disc,!!r.id]))};});
 ok('a contact\'s readings come back from the saved file (they were dropped when the form was reopened), and a bad entry is not taken',R.same&&R.n===2&&R.bad==='[["Kept (simulated)","5",true]]',{same:R.same,n:R.n,bad:R.bad});
 const i1=R.t.indexOf(R.s1),i2=R.t.indexOf(R.s2);
 ok('each reading prints its summary, after the reference and before what was discussed',i1>0&&R.t.indexOf('Summary: '+R.s1)>0&&i1<R.t.indexOf('Simulated discussion.')&&R.t.indexOf('Summary: '+R.s2)>0,{i1,i2});
 ok('the areas print each with its own tasks',R.t.includes('Data collection and graphing (A.1, A.5); Behavior assessment (B.2); Behavior acquisition (C.9)'),(R.t.match(/Data collection and graphing[^\n]{0,160}/)||[''])[0]);
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:10000}),p.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=require('fs').readFileSync(await dl.path(),'utf8');
 ok('the spreadsheet does the same',csv.includes('Data collection and graphing (A.1, A.5); Behavior assessment (B.2); Behavior acquisition (C.9)'),csv.slice(0,300));
 const W=await p.evaluate(async()=>{const k=curKey,txt=JSON.stringify(saveObj());S.months={};renderAll();const okd=await window.nbhBridge.ownOpen(txt);const c=(S.months[k]&&S.months[k].contacts||[])[0];return {okd,n:c&&c.readings?c.readings.length:0};});
 ok('the workstation\'s own reopening (the safety copy, Save case) gives the readings back',W.okd&&W.n===2,W);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
