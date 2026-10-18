/* v22.62 Form AD-1's session runner (DeLeon et al., 2014): the work clock stops during access and exchange and after a
   removal, the total clock runs throughout, the time from each removal to the next response is the resume time, tokens
   are traded before the block, the block is the responses times the unit, the session ends by Section B's rule
   (responses, or responses or work time whichever comes first), and the runner writes the row to the session log.
   The page's clock is replaced by one the test moves, so every time is exact. Simulated data only.
   usage: node qa/v2262-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html');await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;document.getElementById('btnSim').click();});await sleep(900);
  await p.evaluate(()=>{window.__t=Date.now();Date.now=()=>window.__t;document.querySelector('button.tab[data-p="p4"]').click();const d=document.getElementById('adRun');d.open=true;d.dispatchEvent(new Event('toggle'));});await sleep(300);
  const adv=async s=>{await p.evaluate(s=>{window.__t+=s*1000;},s);await sleep(320);};
  const st=()=>p.evaluate(()=>adRunner.state());
  const tap=async id=>{await p.evaluate(id=>document.getElementById(id).click(),id);await sleep(60);};
  const txt=id=>p.evaluate(id=>document.getElementById(id).textContent.replace(/\s+/g,' ').trim(),id);
  const setR=async(id,v)=>{await p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);await sleep(120);};
  const setF=async(k,v)=>{await p.evaluate(([k,v])=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);await sleep(250);};
  const lastRow=()=>p.evaluate(()=>{const tb=document.getElementById('tbSess');return {n:tb.rows.length,v:[...tb.rows[tb.rows.length-1].querySelectorAll('input,select')].map(x=>x.value)};});
  const n0=(await lastRow()).n;
  /* 1 the arrangements and the rule */
  const opts=await p.evaluate(()=>[...document.getElementById('adrCond').options].map(o=>o.value).join());
  await setR('adrCond','dis');
  ok('1 the arrangements in the evaluation; the rule from Section B',opts==='bl,dis,acc,tok'&&await txt('adrRule')==='Ends at the 10th response; 30 s per response, delivered at once.',{opts,rule:await txt('adrRule')});
  /* 2-3 distributed */
  await p.evaluate(()=>{document.getElementById('adrPhase').value='ME';});await tap('adrStart');
  const s0=await st();await adv(20);await p.keyboard.press('p');await tap('adrResp');
  const sA=await st(),w1=await txt('adrWork');await adv(31);const sR=await st();
  for(let i=2;i<=10;i++){await adv(12);await tap('adrResp');await adv(31);}
  const sD=await st(),msg=await txt('adrMsg');
  ok('2 distributed: access starts at the response with the work clock stopped; the removal waits for the next response; ten deliveries end the session',s0==='work'&&sA==='access'&&w1==='0:20'&&sR==='removed'&&sD==='done'&&/^Session over: 10 responses, 2\.28 min of work, 5:00 of access, 7\.28 min in all; resumes 13\.0 s on average/.test(msg),{s0,sA,w1,sR,sD,msg});
  await tap('adrWrite');let r=await lastRow();
  ok('3 the row written: phase, arrangement, opportunities, responses, problem behavior (the P key), work 2.28 min, access 300 s, total 7.28 min, resumes 13.0 s',r.n===n0+1&&r.v.slice(1).join('|')==='ME|Distributed|10|10|1|2.28|300|7.28|13.0'&&/^\d{4}-\d\d-\d\d$/.test(r.v[0]),r);
  const dsum=await p.evaluate(()=>{const tr=[...document.querySelectorAll('#sumOut tbody tr')].find(t=>/^Distributed/.test(t.textContent.trim()));return tr?tr.cells[1].textContent.trim():null;});
  ok('4 the comparison counts the new session',dsum==='6'&&await st()==='ready',{dsum});
  /* 5 tokens */
  await setR('adrCond','tok');await tap('adrStart');
  for(let i=1;i<=10;i++){await adv(15);await p.keyboard.press('Space');}
  const sX=await st(),bank=await txt('adrBank');await adv(8);await tap('adrNext');const sB=await st(),left=await txt('adrAcc');await adv(301);const sD2=await st();
  await tap('adrWrite');r=await lastRow();
  ok('5 tokens (Space for each response): ten banked, traded with the exchange time kept apart, then the 5:00 block; work 2.50, access 300, total 7.63, no resumes',sX==='exchange'&&bank==='10 (5:00)'&&sB==='block'&&left==='5:00'&&sD2==='done'&&r.v.slice(2).join('|')==='Accumulated + tokens|10|10|0|2.50|300|7.63|',{sX,bank,sB,left,sD2,r});
  /* 6 whichever comes first */
  await setF('w_mode','both');await setF('w_time','1');await setR('adrCond','acc');
  const rule=await txt('adrRule');await tap('adrStart');
  for(let i=1;i<=4;i++){await adv(14);await tap('adrResp');}
  await adv(5);const sC=await st(),left2=await txt('adrAcc');await adv(121);const sD3=await st();await tap('adrWrite');r=await lastRow();
  ok('6 the 10th response or 1 min of work time, whichever comes first: the cap comes first after 4 responses, the work ends at exactly 1:00 and the block is 4 × 30 s',rule==='Ends at the 10th response or 1 min of work time, whichever comes first; 30 s per response, banked.'&&sC==='block'&&left2==='1:59'&&sD3==='done'&&r.v.slice(2).join('|')==='Accumulated|4|4|0|1.00|120|3.00|',{rule,sC,left2,sD3,r});
  /* 7 discard and the checks before a start */
  const n1=(await lastRow()).n;await setR('adrCond','bl');await tap('adrStart');await adv(5);await tap('adrResp');await tap('adrDiscard');await sleep(150);
  const sDisc=await st(),n2=(await lastRow()).n;
  await setF('r_unit','');await setR('adrCond','dis');await tap('adrStart');const refuse=await txt('adrMsg'),sRef=await st();
  ok('7 Discard writes nothing; a reinforced session without an amount per response does not start',sDisc==='ready'&&n2===n1&&sRef==='ready'&&refuse==='Enter the amount per response in Section B first.',{sDisc,n1,n2,sRef,refuse});
  await p.emulateMedia({media:'print'});const disp=await p.evaluate(()=>getComputedStyle(document.getElementById('adRun')).display);await p.emulateMedia({media:'screen'});
  ok('8 the runner is not printed',disp==='none',disp);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('9 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
