/* v24.42 Form PA-1, review V15 (R-070, R-071, R-134; E-24, E-44): tied percentages share a rank (=2) and count as the average
   of the positions in the composite, a tie shares a tier, the method's rank sits beside its percentage on the Summary; the
   "top N are close" bullet names every item within ten points; the paired-stimulus conventions are labelled; a brief MSWO
   runs on the Monitoring sheet and logs its top three, opened from the toolbar, the URL, a hand-off flag and a message;
   "Twice, sides reversed" is the default for six or fewer; the Sheets menu offers "Only sheets with data".
   usage: node qa/pa142-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const URL=BASE+'/NBH-Workstation/PA-1_Preference-Assessment-Protocol_v2026-09.html';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(url,vp)=>{const p=await b.newPage({viewport:vp||{width:1300,height:950}});p.on('pageerror',e=>errs.push('PA-1: '+String(e).slice(0,160)));
   await p.goto(url);await sleep(1400);await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});return p;};
 const NAMES=['Tablet','Bubbles','Picture book','Musical toy','Squeeze ball','Stickers'];
 /* the form's state goes out through Save data and back in through Open data (its script keeps the state to itself) */
 const getS=p=>p.evaluate(()=>nbhBridge.ownSave().then(t=>JSON.parse(t)));
 const putS=async(p,o)=>{const r=await p.evaluate(t=>nbhBridge.ownOpen(t),JSON.stringify(o));await sleep(400);if(!r)throw new Error('ownOpen refused');};
 const pool=async p=>{const o=await getS(p);NAMES.forEach((nm,i)=>{o.stim[i].name=nm;o.stim[i].type='Leisure item';});await putS(p,o);};
 /* a paired-stimulus result from a "beats" rule, through the sheet's own trial list */
 const fillPS=async(p,beats)=>{await p.evaluate(()=>document.getElementById('psGen').click());await sleep(200);const o=await getS(p);o.ps.trials.forEach(t=>{t.sel=beats(t.l,t.r)?'L':'R';});await putS(p,o);return o.ps.trials.length;};
 const rows=(p,id)=>p.evaluate(id=>[...document.querySelectorAll(id+' tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>({t:td.textContent.replace(/\s+/g,' ').trim(),title:td.getAttribute('title')||''}))),id);

 /* ---- 1. ties ---- */
 let p=await open(URL);await pool(p);
 /* the default for six items is twice, sides reversed: ten presentations an item */
 const def=await p.evaluate(()=>({pressed:document.querySelector('#psRepSeg button[aria-pressed="true"]').textContent.trim(),info:document.getElementById('psInfo').textContent}));
 const nt=await fillPS(p,(a,b)=>{if(a===0)return true;if(b===0)return false;const c={1:2,2:3,3:1};if(a<=3&&b<=3)return c[a]===b;if(a<=3)return true;if(b<=3)return false;return a<b;});
 const ps=await rows(p,'#psRank');
 ok('six items default to "Twice, sides reversed" (30 trials); a leader at 100% then three items at 60% show ranks 1, =2, =2, =2, 5, 6, the tie titled as counting 3 in the composite',
   def.pressed==='Twice, sides reversed'&&/15 pairs × 2 = 30 trials/.test(def.info)&&nt===30&&ps.map(r=>r[0].t).join(' ')==='1 =2 =2 =2 5 6'&&ps.slice(1,4).every(r=>r[4].t==='60%'&&/counts as 3 in the composite/.test(r[0].title))&&ps[0][4].t==='100%',{def,nt,ps:ps.map(r=>[r[0].t,r[1].t,r[4].t,r[0].title])});
 const sum=await rows(p,'#sumTbl');
 const tiers=sum.map(r=>[r[0].t,r[3].t,r[7].t,r[8].t]);
 ok('the Summary shows the paired-stimulus rank beside the percentage (100% #1, 60% =2), mean ranks 1 and 3, and the three tied items share one tier (MP) with the leader HP and the last two LP',
   tiers[0][1]==='100% #1'&&tiers[0][2].startsWith('1.0')&&tiers[0][3]==='HP'&&tiers.slice(1,4).every(r=>r[1]==='60% =2'&&r[2].startsWith('3.0')&&r[3]==='MP')&&tiers.slice(4).every(r=>r[3]==='LP'),tiers);
 const facts=await p.evaluate(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();return (o&&o.menu||[]).map(m=>m.name+':'+m.tier+':'+m.mean);});
 ok('the case menu carries the same tiers and means',facts.join(' ')==='Tablet:HP:1 Bubbles:MP:3 Picture book:MP:3 Musical toy:MP:3 Squeeze ball:LP:5 Stickers:LP:6',facts);
 /* ---- 2. the close bullet names all three ---- */
 {const o=await getS(p);o.psRep=1;o.psRepUser=true;o.ps.trials=[];await putS(p,o);}
 await fillPS(p,(a,b)=>{const c={0:1,1:2,2:0};if(a<=2&&b<=2)return c[a]===b;if(a<=2)return true;if(b<=2)return false;return a<b;});
 const flag=await p.evaluate(()=>[...document.querySelectorAll('#sumFlags li')].map(l=>l.textContent).find(t=>/are close/.test(t))||'');
 ok('three items tied at 80%: "The top three are close on paired stimulus: Tablet 80%, Bubbles 80%, Picture book 80% ... test all three in Form RA-1"',
   /^The top three are close on paired stimulus: Tablet 80%, Bubbles 80%, Picture book 80%\./.test(flag)&&/test all three in Form RA-1/.test(flag),flag.slice(0,200));
 /* ---- 3. the conventions ---- */
 const conv=await p.evaluate(()=>document.querySelector('#ps .warn').textContent.replace(/\s+/g,' '));
 ok('the paired-stimulus procedure states the 30-s window and the immediate Neither as this practice\'s conventions against Fisher et al. (1992)\'s 5 s with prompted sampling',
   /The 30-s window, and scoring Neither at once when it passes, are this practice's conventions/.test(conv)&&/Fisher et al\. \(1992\) allowed 5 s and, on no approach, prompted the student to sample each item/.test(conv),conv.slice(0,120));
 /* ---- 4. the brief MSWO ---- */
 await p.evaluate(()=>document.getElementById('paQuickBtn').click());await sleep(300);
 const q1=await p.evaluate(()=>({view:document.body.className,hidden:document.getElementById('paQuick').hidden,sel:document.querySelectorAll('#paQuickTbl select').length,out:document.getElementById('paQuickOut').textContent}));
 ok('Brief MSWO in the toolbar opens the Monitoring sheet with the panel: 6 trials × 3 sessions of selects, and the readout explains the procedure',
   q1.view==='view-monitor'&&!q1.hidden&&q1.sel===18&&/No sessions scored yet/.test(q1.out),q1);
 const q2=await p.evaluate(()=>{const pick=(k,order)=>order.forEach((v,t)=>{const s=document.querySelector('#paQuickTbl select[data-qs="'+k+'"][data-t="'+t+'"]');s.value=String(v);s.dispatchEvent(new Event('input',{bubbles:true}));});
   pick(0,[1,0,2,3,4,5]);pick(1,[0,1,2,3,'none']);pick(2,[0,1,3,2,4,5]);return document.getElementById('paQuickOut').textContent;});
 ok('three sessions scored: the readout names the top three with MSWO percentages scored as the sheet scores (Tablet 75%: 3 of 4 times available; Bubbles 60%; Picture book 30%)',
   /3 of 3 sessions scored/.test(q2)&&/Top three: Tablet 75%, Bubbles 60%, Picture book 30%\./.test(q2),q2);
 await p.evaluate(()=>{document.getElementById('paQuickNote').value='Mid-morning (simulated)';document.getElementById('paQuickNote').dispatchEvent(new Event('input'));document.getElementById('paQuickLog').click();});await sleep(400);
 const q3=await (async()=>{const o=await getS(p);const r=o.stab[0];const nm=v=>v===''?'':o.stim[+v].name;const stat=await p.evaluate(()=>document.querySelector('#stabStat div span').textContent.trim());return {date:r.date,top:[nm(r.r1),nm(r.r2),nm(r.r3)].join('|'),ses:r.ses,note:r.note,stat,cleared:o.quick.sel.every(a=>a.every(v=>v==='')),ms:o.ms.every(s=>s.sel.every(v=>v===''))};})();
 const today=await p.evaluate(()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');});
 ok('Log the top three writes today\'s row to the brief-MSWO log (Tablet, Bubbles, Picture book, 3 sessions, the note), the log counts one, the run is cleared and the full MSWO sheet untouched',
   q3.date===today&&q3.top==='Tablet|Bubbles|Picture book'&&q3.ses==='3'&&q3.note==='Mid-morning (simulated)'&&q3.stat==='1'&&q3.cleared&&q3.ms,q3);
 await p.close();
 /* ---- 5. the openers: the URL, the hand-off flag, the message ---- */
 p=await open(URL+'#quick-mswo');
 const h1=await p.evaluate(()=>({view:document.body.className,hidden:document.getElementById('paQuick').hidden}));
 await p.evaluate(()=>{document.getElementById('paQuickClose').click();document.querySelector('#viewSeg [data-view="indirect"]').click();});
 await p.evaluate(()=>{localStorage.setItem('nbh.pa1.quick',JSON.stringify({what:'mswo',t:Date.now(),from:'RA-1'}));});
 await p.goto(URL);await sleep(1400);await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
 const h2=await p.evaluate(()=>({view:document.body.className,hidden:document.getElementById('paQuick').hidden,flag:localStorage.getItem('nbh.pa1.quick')}));
 ok('opened with #quick-mswo the panel is up on the Monitoring sheet; a hand-off flag another form set (nbh.pa1.quick) opens it at the next load and is consumed',
   h1.view==='view-monitor'&&!h1.hidden&&h2.view==='view-monitor'&&!h2.hidden&&h2.flag===null,{h1,h2});
 await p.evaluate(()=>{document.getElementById('paQuickClose').click();document.querySelector('#viewSeg [data-view="indirect"]').click();});
 await p.evaluate(()=>{window.dispatchEvent(new MessageEvent('message',{data:{nbh:'quick',what:'mswo'},source:window.parent}));});await sleep(200);
 const h3=await p.evaluate(()=>({view:document.body.className,hidden:document.getElementById('paQuick').hidden}));
 await p.evaluate(()=>{document.getElementById('paQuickClose').click();window.dispatchEvent(new MessageEvent('message',{data:{nbh:'quick',what:'mswo'},source:null}));});await sleep(200);
 const h4=await p.evaluate(()=>document.getElementById('paQuick').hidden);
 ok('a {nbh:"quick", what:"mswo"} message from the parent window opens it; from any other window it does not',h3.view==='view-monitor'&&!h3.hidden&&h4===true,{h3,h4});
 /* ---- 6. the presentations default, the simulation ---- */
 const d1=await p.evaluate(()=>{const e=document.getElementById('nStim');e.value='8';e.dispatchEvent(new Event('change'));const a=document.querySelector('#psRepSeg button[aria-pressed="true"]').textContent.trim();
   e.value='5';e.dispatchEvent(new Event('change'));const b=document.querySelector('#psRepSeg button[aria-pressed="true"]').textContent.trim();
   document.querySelector('#psRepSeg button[data-rep="3"]').click();e.value='8';e.dispatchEvent(new Event('change'));const c=document.querySelector('#psRepSeg button[aria-pressed="true"]').textContent.trim();return [a,b,c];});
 ok('eight items default to "Each pair once", five to "Twice, sides reversed"; a choice made by hand ("Three times") is kept when the pool changes',d1.join('|')==='Each pair once|Twice, sides reversed|Three times',d1);
 await p.evaluate(()=>{document.getElementById('simScenario').value='clear';document.getElementById('simBtn').click();});await sleep(2500);
 for(let i=0;i<40;i++){if(await p.evaluate(()=>!(window.nbhSim&&nbhSim.state.busy)))break;await sleep(250);}await sleep(400);
 const simRep=(await getS(p)).psRep;
 const sim=await p.evaluate(()=>({info:document.getElementById('psInfo').textContent,ranks:[...document.querySelectorAll('#psRank tbody tr td:first-child')].map(td=>td.textContent.trim()).join(' '),top:document.querySelector('#psRank tbody tr td:nth-child(2)').textContent.trim(),
   sum:[...document.querySelectorAll('#sumTbl tbody tr')].slice(0,2).map(tr=>tr.children[3].textContent.replace(/\s+/g,' ').trim())}));
 ok('the simulation keeps each pair once (15 trials), its clear hierarchy ranks 1 to 6 with no tie, the tablet first, and the Summary reads "100% #1", "80% #2"',
   simRep===1&&/15 pairs × 1 = 15 trials/.test(sim.info)&&sim.ranks==='1 2 3 4 5 6'&&sim.top==='Tablet (video)'&&sim.sum.join('|')==='100% #1|80% #2',{simRep,sim});
 /* ---- 7. the Sheets menu filter ---- */
 const m1=await p.evaluate(()=>{nbhSheets.open();const pop=document.getElementById('nbhSheets');const cb=pop.querySelector('.nbh-sheetsf input');cb.checked=true;cb.dispatchEvent(new Event('change'));
   const shown=[...pop.querySelectorAll('.nbh-sheet')].filter(b=>!b.hidden).map(b=>b.textContent.replace(/^\d+\. /,'').trim());const cnt=pop.querySelector('.nbh-sheetsf small').textContent;nbhSheets.close();return {shown,cnt};});
 await p.evaluate(()=>{document.getElementById('clearBtn').click();});await sleep(300);
 const m2=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="ps"]').click();nbhSheets.open();const pop=document.getElementById('nbhSheets');const shown=[...pop.querySelectorAll('.nbh-sheet')].filter(b=>!b.hidden).map(b=>b.textContent.replace(/^\d+\. /,'').trim());
   const cb=pop.querySelector('.nbh-sheetsf input');cb.checked=false;cb.dispatchEvent(new Event('change'));const all=[...pop.querySelectorAll('.nbh-sheet')].filter(b=>!b.hidden).length;nbhSheets.close();return {shown,all,kept:localStorage.getItem('nbh.sheets.data')};});
 ok('"Only sheets with data" in the Sheets menu: with the simulation loaded every sheet with data stays (8 of 11: the competing-stimulus sheet is empty in this scenario, the Walkthrough and Guide hold none); on a cleared form only the open sheet stays; unticked, all eleven return',
   m1.shown.length===8&&!m1.shown.some(s=>/Walkthrough|Guide|Competing/.test(s))&&m1.cnt==='8 of 11'&&m2.shown.join('|')==='Paired stimulus'&&m2.all===11&&m2.kept==='',{m1,m2});
 await p.close();
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
