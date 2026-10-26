/* v24.49 Form RS-1: catch-up mode (the BCBA, 10/26: "a catchup mode for people transferring their supervision information
   into the system and dont want it to seem like you were out of compliance for some months when in reality you are just
   entering the information"). An August record half typed in in October (simulated, one contact of the two needed):
   with the mode off it reads "not met" and the month offers to turn the mode on; with it on, August reads "being entered"
   on the month bar, the compliance panel, the year table, the chart and the printed year summary, and is left out of
   "Months compliant"; a real problem (a supervisor who is not a BCBA or BCaBA) still shows; "All of this month is
   entered" or both signatures give the real verdict again; the mark is kept in the file only when set; months not yet
   entered stay blank, never "not met". usage: node qa/rs149-catchup-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1024}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const aug=await p.evaluate(()=>yearKeys(setupYear())[0]);
 /* a simulated RBT and supervisor; August's service and one contact of the two needed, typed in after the month ended */
 await p.evaluate(k=>{S.setup.rbt_name='Jordan Lee (simulated)';
   S.sups=[{id:'sim1',name:'A. Rivera (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:k+'-01',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false},{id:'d2',date:k+'-05',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];
   m.contacts=[{id:'c1',date:k+'-05',start:'09:00',end:'10:00',sup:'sim1',format:'indiv',group:'',mode:'person',obs:'yes',client:'',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}}];
   renderAll();setView('month');const b2=document.querySelector('#monthBar button[data-month="'+k+'"]');if(b2)b2.click();},aug);await sleep(300);
 const look=()=>p.evaluate(k=>{renderMonth();renderPrint();renderYear();const s=stats(k),o=document.getElementById('yearOut');
   const prow=[...o.querySelectorAll('table.p-t')[0].querySelectorAll('tbody tr')][0];const T=[...o.querySelectorAll('svg text')].map(t=>t.textContent);
   const yrow=[...document.querySelectorAll('#yearTbl tbody tr')][0];const bar=document.querySelector('#monthBar button[data-month="'+k+'"] small');
   const ce=document.getElementById('enteredChip'),nd=document.getElementById('catchNudge');
   return {st:s.status,bar:bar&&bar.textContent,verdict:(document.getElementById('compVerdict')||{}).textContent||'',ytbl:yrow&&yrow.lastElementChild.textContent,
     print:prow&&prow.lastElementChild.textContent,chartNo:T.filter(t=>/✕/.test(t)).length,metric:((document.querySelector('#yearMetrics')||{}).textContent||'').match(/Months compliant\s*(\d+ of \d+)/),
     chip:!!ce&&!!ce.offsetParent,nudge:!!nd&&!!nd.offsetParent,sep:stats(yearKeys(setupYear())[1]).status,file:JSON.stringify(fromFile({form:'RS-1',S:JSON.parse(JSON.stringify(S))}).months[k]).includes('"entered"')};},aug);
 const L0=await look();
 ok('mode off: August, half entered after it ended, reads not met (as before), and offers to turn on catch-up mode',L0.st==='fail'&&/not met/.test(L0.bar)&&L0.nudge&&!L0.chip,L0);
 await p.click('#catchGo');await sleep(300);const L1=await look();const sel=await p.evaluate(()=>document.getElementById('sCatch').value);
 ok('"Turn on catch-up mode" turns it on (the Setup choice reads On)',sel==='on'&&L1.st==='entering',{sel,st:L1.st});
 ok('mode on: August reads "being entered" on the month bar and the compliance panel, never "not met"',/being entered/.test(L1.bar)&&/^Being entered \(catch-up mode\)/.test(L1.verdict)&&!/not met/i.test(L1.bar),{bar:L1.bar,verdict:L1.verdict});
 ok('mode on: the year table and the printed year summary say "being entered"; the chart has no "not met" mark; Months compliant leaves August out',/^Being entered$/.test(L1.ytbl)&&/^being entered$/.test(L1.print)&&L1.chartNo===0&&L1.metric&&L1.metric[1]==='0 of 0',{ytbl:L1.ytbl,print:L1.print,chartNo:L1.chartNo,metric:L1.metric&&L1.metric[1]});
 ok('months not yet entered (September) are blank, not "not met", in either mode; the month offers "All of this month is entered"',L0.sep==='none'&&L1.sep==='none'&&L1.chip&&!L1.nudge,{sep0:L0.sep,sep1:L1.sep,chip:L1.chip});
 /* a real problem still shows */
 await p.evaluate(()=>{S.sups[0].cred='';});const L2=await look();await p.evaluate(()=>{S.sups[0].cred='BCBA';});
 ok('mode on: a supervisor without a BCBA or BCaBA still marks the month not met',L2.st==='fail',L2.st);
 /* the month marked entered: the real verdict */
 await p.click('#mEntered');await sleep(200);const L3=await look();
 ok('"All of this month is entered": the real verdict again (not met: one contact of two), and the mark is kept in the file',L3.st==='fail'&&/not met/.test(L3.bar)&&L3.file&&L3.metric&&L3.metric[1]==='0 of 1',{st:L3.st,bar:L3.bar,file:L3.file,metric:L3.metric&&L3.metric[1]});
 await p.click('#mEntered');await sleep(200);const L4=await look();
 ok('unticked, it is being entered again, and the file holds no mark',L4.st==='entering'&&!L4.file,{st:L4.st,file:L4.file});
 /* both signatures: final */
 await p.evaluate(k=>{month(k).sig={sup_name:'A. Rivera, BCBA (simulated)',sup_date:k+'-31',rbt_name:'Jordan Lee, RBT (simulated)',rbt_date:k+'-31'};},aug);const L5=await look();
 ok('signed by both, the month gives its real verdict (the chip is not offered)',L5.st==='fail'&&!L5.chip,{st:L5.st,chip:L5.chip});
 await p.evaluate(k=>{month(k).sig={};},aug);
 /* a month met in full reads met in either mode once entered */
 await p.evaluate(k=>{month(k).contacts.push({id:'c2',date:k+'-04',start:'13:00',end:'13:30',sup:'sim1',format:'indiv',group:'',mode:'person',obs:'no',client:'',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}});month(k).entered=true;},aug);const L6=await look();
 const ck6=await p.evaluate(k=>stats(k).checks.map(c=>c.k+':'+c.s+':'+c.d),aug);
 ok('with both contacts in and the month marked entered, it reads met',L6.st==='ok',{st:L6.st,ck6});
 /* the setting off */
 await p.evaluate(k=>{delete month(k).entered;month(k).contacts.pop();const s=document.getElementById('sCatch');s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));},aug);await sleep(300);const L7=await look();
 ok('catch-up mode off again (Setup): August reads not met, as it is',L7.st==='fail'&&/not met/.test(L7.bar),{st:L7.st,bar:L7.bar});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
