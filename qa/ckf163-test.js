/* v24.63 Form RS-1 (the BCBA's August record, 10/26): the year summary through a past month says "as of" and how many checklist
   items are ticked with a later date; "at the end of supervision" says it is for when supervision ends; the RBT record shows
   the Test Content Outline coverage and where the tasks are ticked; in the PDF no page ends inside a line or the closing note
   (a simulated August like the BCBA's: 16 days, three contacts, the checklists ticked today). Simulated names only.
   usage: node qa/ckf163-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const pagesOf=s=>[...s.matchAll(/\/Type \/Page \/Parent[^\n]*\/Contents (\d+) 0 R/g)].map(m=>{const i=s.indexOf('\n'+m[1]+' 0 obj\n');const a=s.indexOf('stream\n',i)+7;return s.slice(a,s.indexOf('endstream',a));});
const words=pg=>[...pg.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map(m=>m[1].replace(/\\(.)/g,'$1'));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const k=await p.evaluate(()=>{const ks=yearKeys(setupYear()),k=ks.find(x=>/-08$/.test(x))||ks[0];S.setup.rbt_name='Lee Park (simulated)';S.setup.rbt_exp='2028-11-01';S.setup.employer='Simulated Services Inc.';S.setup.site='Simulated School';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'1-00-00000',role:'RBT Supervisor',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[];let d=10;while(m.days.length<16){const x=new Date(k+'-'+String(d).padStart(2,'0')+'T00:00:00');if(x.getDay()%6)m.days.push({id:'d'+d,date:k+'-'+String(d).padStart(2,'0'),start:'08:00',end:'15:00',brk:'30',act:'',none:false});d++;}
   m.contacts=[10,17,24].map((dd,i)=>({id:'c'+i,date:k+'-'+dd,start:'12:30',end:'15:30',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0001',sact:['Observation, BST and performance feedback'],acts:['Data collection and graphing','Behavior acquisition'],tco:i?['A.1','C.3']:['A.1'],bst:['Instruction','Feedback'],feedback:'Simulated feedback '+i+'.',follow:'Simulated follow-up.'}));
   const t=todayISO();S.ckl={};CKL.forEach(g=>g[2].forEach(i=>{if(!i.auto&&g[0]!=='end')S.ckl[i.k]=t;}));S.ckl[CKL[0][2].find(i=>!i.auto).k]=k+'-12';
   curKey=k;renderAll();return k;});
 await p.evaluate(()=>setView('rbt'));await sleep(300);
 const R=await p.evaluate(()=>{const sum=document.getElementById('ckSum').textContent,t=document.getElementById('tcoSum'),sec=t&&t.parentElement.textContent;
   return {sum,end:/At the end of supervision: 0 of 3 \(when supervision ends\)/.test(sum),hint:/set the date to when it was done/.test(sec),tco:t&&t.textContent,where:/under Content covered, tick an area/.test(sec),vis:!!t&&!!t.offsetParent};});
 ok('on screen: "at the end of supervision" says it is for when supervision ends; the list says to date each item when it was done',R.end&&R.hint,R);
 ok('the RBT record shows the Test Content Outline coverage: 2 of 43, A.1 and C.3 covered, and where the tasks are ticked',R.vis&&/2 of 43 tasks covered/.test(R.tco)&&/A\. Data collection and graphing 1 of 8A\.1A\.2/.test(R.tco.replace(/, /g,''))&&/C\.3/.test(R.tco)&&R.where,R.tco);
 const Y=await p.evaluate(k=>{setView('print');curKey=k;renderPrint();return document.getElementById('yearOut').textContent;},k);
 const asOf=k.slice(5,7).replace(/^0/,'')+'/31/'+k.slice(0,4);
 ok('the year summary through August says "as of" its date, counts what was done by then, and how many more are ticked later',Y.includes('The BACB supervision checklists, as of '+asOf+':')&&/before supervision starts \d of \d/.test(Y)&&/ more items are ticked with a later date and count from that month on/.test(Y)&&/at the end of supervision 0 of 3 \(when supervision ends\)/.test(Y),(Y.match(/The BACB supervision checklists[^.]*\./)||[''])[0]);
 const st=await p.evaluate(()=>{const i=CKL.flatMap(g=>g[2]).find(x=>x.every);S.ckl[i.k]='2026-03-01';const a=ckState(i,'2026-08-31'),b=ckState(i);return {asOf:a.ok,now:b.ok,late:b.late};});
 ok('a review every 3 or 6 months counts as current at the record\'s date, and late at today\'s',st.asOf&&!st.now&&st.late,st);
 const P=await p.evaluate(async k=>{curKey=k;renderPrint();const r=await window.__rsShare.pdfOf('month');return {s:atob(r.b64),pages:r.pages};},k);
 const pg=pagesOf(P.s).map(words);
 const where=re=>pg.findIndex(w=>re.test(w.join(' ')));
 const last=pg[pg.length-1].join(' ');
 ok('the PDF: the closing note is whole on one page, with "year summary through" beside it; no page holds only that line',where(/Keep supervision records/)===where(/year summary through/)&&where(/Keep supervision records/)>=0&&pg.every(w=>w.length>12),{pages:pg.length,keep:where(/Keep supervision records/),thru:where(/year summary through/),counts:pg.map(w=>w.length)});
 ok('the month and its year summary, as before: the year summary starts a page of its own, the chart a picture',where(/Year Summary/i)>0&&/\/Subtype \/Image/.test(P.s),{y:where(/Year Summary/i)});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed')+' (pages '+pg.length+')');await b.close();process.exit(bad?1:0);})();
