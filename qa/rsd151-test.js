/* v24.51 Form RS-1: the Month page's service days and contacts easier to read and check (the BCBA's iPad screenshots,
   10/26). Simulated September (usual hours 8:45 to 3:30; one day starting at 9:45, one ending at 3:00): the weekday and
   the date share one line; the two days that are not the usual hours are marked (the value and the row), listed above
   the table, and a tap on one goes to its row; the first day of each week has a stronger line; the minutes not in
   services read 0 when empty; with every day the usual hours, the line says so; each contact's card shows its time of
   day. usage: node qa/rsd151-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const c=await b.newContext({viewport:{width:1366,height:1024},hasTouch:true,isMobile:true,userAgent:IPAD});const p=await c.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1200);
 const k=await p.evaluate(()=>{const k=yearKeys(setupYear())[1];S.setup.rbt_name='Lee Park (simulated)';S.setup.day_start='08:45';S.setup.day_end='15:30';S.setup.days=[1,2,3,4,5];
  S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
  const m=month(k);m.days=[];for(let d=1;d<=30;d++){const x=new Date(2026,8,d);if(x.getDay()%6===0)continue;m.days.push({id:'d'+d,date:k+'-'+String(d).padStart(2,'0'),start:d===8?'09:45':'08:45',end:d===30?'15:00':'15:30',brk:'',act:'',none:false});}
  m.contacts=[{id:'c1',date:k+'-04',start:'10:30',end:'12:30',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}}];
  curKey=k;renderAll();setView('month');return k;});await sleep(400);
 const R=await p.evaluate(k=>{const row=id=>document.querySelector('#dayTbl tr[data-did="'+id+'"]');const r1=row('d1'),wd=r1.querySelector('.wd').getBoundingClientRect(),di=r1.querySelector('input[type=date]').getBoundingClientRect();
   const r8=row('d8'),r30=row('d30'),r7=row('d7'),r2=row('d2');
   return {oneLine:Math.abs((wd.top+wd.bottom)/2-(di.top+di.bottom)/2)<6,
     off8:r8.classList.contains('offrow')&&r8.querySelector('td[data-l="Start"]').classList.contains('off')&&/usually 8:45 am/.test(r8.querySelector('td[data-l="Start"]').title)&&!r8.querySelector('td[data-l="End"]').classList.contains('off'),
     off30:r30.querySelector('td[data-l="End"]').classList.contains('off'),usual:!r2.classList.contains('offrow'),
     line:(document.getElementById('dayDiff')||{}).textContent||'',wk:r7.classList.contains('wk')&&!r2.classList.contains('wk'),
     ph:r2.querySelector('input[data-f="brk"]').placeholder,card:document.querySelector('details.rs-contact>summary').textContent};},k);
 ok('the weekday and the date share one line',R.oneLine,R);
 ok('the days that are not the usual hours are marked: the value (with the usual in its title) and the row; a usual day is not',R.off8&&R.off30&&R.usual,R);
 ok('the line above the table lists them: "2 days not the usual hours", Tue 9/8 start 9:45 am, Wed 9/30 end 3:00 pm',/^2 days not the usual hours/.test(R.line)&&/Tue 9\/8 start 9:45 am/.test(R.line)&&/Wed 9\/30 end 3:00 pm/.test(R.line),R.line);
 await p.tap('#dayDiff [data-ddgo="d30"]');await sleep(700);
 const G=await p.evaluate(()=>{const r=document.querySelector('#dayTbl tr[data-did="d30"]').getBoundingClientRect();return {inView:r.top>=0&&r.bottom<=innerHeight,flash:document.querySelector('#dayTbl tr[data-did="d30"]').classList.contains('flash'),focus:document.activeElement&&document.activeElement.id};});
 ok('a tap on a listed day brings its row into view, marks it a moment and puts the cursor in the changed value',G.inView&&G.flash&&G.focus==='d_d30_end',G);
 ok('the first day of each week has a stronger line above it; the minutes not in services read 0 when empty',R.wk&&/0/.test(R.ph),{wk:R.wk,ph:R.ph});
 ok('each contact\'s card shows its time of day beside its minutes',/120 min \(10:30 am–12:30 pm\)/.test(R.card),R.card);
 /* every day the usual hours */
 await p.evaluate(k=>{const m=month(k);m.days.forEach(d=>{d.start='08:45';d.end='15:30';});renderDays();},k);await sleep(200);
 const L2=await p.evaluate(()=>({line:document.getElementById('dayDiff').textContent,off:document.querySelectorAll('#dayTbl td.off').length}));
 ok('with every day the usual hours, nothing is marked and the line says so',L2.off===0&&/Every day is the usual hours/.test(L2.line),L2);
 /* a change in a row is picked up at once */
 await p.fill('#d_d9_end','14:00');await p.dispatchEvent('#d_d9_end','change');await sleep(300);
 const L3=await p.evaluate(()=>({line:document.getElementById('dayDiff').textContent,off:!!document.querySelector('#dayTbl tr[data-did="d9"] td[data-l="End"].off')}));
 ok('a day changed in the table is marked and listed at once',L3.off&&/^1 day not the usual hours/.test(L3.line)&&/end 2:00 pm/.test(L3.line),L3);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
