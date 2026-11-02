/* v25.56 Form TD-1: Compare two interventions and How the parts fit (the review page approved by the BCBA, 11/1).
   On an iPad (touch):
   1. the data is in the form: attributes, pairs and rules, and every study a pair or rule names is in the protocol bank;
   2. Compare two interventions (Build): NCR against DRA shows every row (fit to function, how it works, advantages,
      limitations, when each fits, using parts of both, restrictiveness, evidence) and the rule that applies if both are
      in the plan; a pair no study compares says it is drawn from general attributes;
   3. a card's Compare button opens the comparison with that card first and another card of the plan second;
   4. with NCR and FCT cards (attention function, extinction on question 4), How the parts fit raises the conflict;
      "Different reinforcers" answers it, the answer is kept in fit.ans and survives Save data / Open data;
   5. while it is not answered, Copy for the BIP and Print final plan ask first (the question names it; "Go to Build"
      goes to the Build sheet); answered, they do not ask;
   6. the BIP text carries "HOW THE PARTS FIT TOGETHER" with the flag and its answer;
   7. single-card rules: a plan of FCT with question 4 open and no extinction gets the caution; extinction on question 4
      clears it ("no" on question 4 is the BCBA's decision and raises no caution);
      an automatic-only component in an escape plan gets the function caution;
   8. upright (820 px) the box and the dialog stay inside the window;
   9. no page errors.
   usage: node qa/td1-compare-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='TD-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1400);
  const set=(n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));},[n,v]);
  /* 1 */
  const d1=await p.evaluate(()=>{const D=window.__tdCompare.data,B=TD1_BANK;const keys=new Set();D.pairs.forEach(x=>x.evidence.forEach(k=>keys.add(k)));D.rules.forEach(r=>r.cite.forEach(k=>{if(/^[a-z]+\d{4}[a-z]?$/.test(k))keys.add(k);}));
    return {attrs:Object.keys(D.attrs).length,pairs:D.pairs.length,rules:D.rules.length,missing:[...keys].filter(k=>!B.refs[k])};});
  ok('1 the comparison data is in the form ('+d1.attrs+' components, '+d1.pairs+' pairs, '+d1.rules+' rules) and every study it names is in the bank',d1.attrs>=80&&d1.pairs>=50&&d1.rules>=20&&!d1.missing.length,d1);
  /* 2 */
  await set('m.fn','escape');await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="build"]').click());await sleep(300);
  await p.click('#tdCmpBtn');await sleep(300);
  await p.selectOption('#tdCmpA','NCR');await p.selectOption('#tdCmpB','DRA');await sleep(200);
  const t2=await p.evaluate(()=>{const d=document.getElementById('tdCmpDlg');return {open:d.open,rows:[...d.querySelectorAll('tbody th[scope=row]')].map(x=>x.textContent),gen:!!d.querySelector('.td-cmp-gen'),rule:[...d.querySelectorAll('.td-cmp-rule')].map(x=>x.textContent.slice(0,60)),txt:d.querySelector('#tdCmpOut').textContent};});
  const want=['Fit to function','How it works','Advantages over the other','Limitations compared with the other','When it is the better fit','Using parts of both','Restrictiveness, staff effort, speed','Evidence'];
  ok('2a Compare NCR with DRA: every row',t2.open&&want.every(w=>t2.rows.includes(w))&&!t2.gen,t2.rows);
  ok('2b the rule that applies if both are in the plan, and the studies',t2.rule.some(x=>/Conflict if both/.test(x))&&/Goh/.test(t2.txt)&&/this student’s function \(escape\)/.test(t2.txt),{rule:t2.rule});
  await p.selectOption('#tdCmpA','A_EXERCISE');await p.selectOption('#tdCmpB','S_DRH');await sleep(200);
  const g=await p.evaluate(()=>{const d=document.getElementById('tdCmpDlg');return {gen:!!d.querySelector('.td-cmp-gen'),rows:[...d.querySelectorAll('tbody th[scope=row]')].map(x=>x.textContent)};});
  ok('2c a pair no study compares says so and shows the general rows only',g.gen&&!g.rows.includes('Advantages over the other')&&g.rows.includes('Evidence'),g);
  await p.click('#tdCmpClose');await sleep(150);
  /* 3, 4: an attention plan (escape extinction would add its own question) */
  await set('m.fn','attention');await set('rb.3','yes');
  const ix=await p.evaluate(()=>{const a=window.__tdAddComp('NCR'),b=window.__tdAddComp('FCT');return [a.dataset.i,b.dataset.i];});await sleep(400);
  await p.click(`#tdcard-${ix[1]} [data-cmp]`);await sleep(300);
  const t3=await p.evaluate(()=>({a:document.getElementById('tdCmpA').value,b:document.getElementById('tdCmpB').value,open:document.getElementById('tdCmpDlg').open}));
  ok('3 a card\'s Compare opens with that card first and the plan\'s other card second',t3.open&&t3.a==='FCT'&&t3.b==='NCR',t3);
  await p.click('#tdCmpClose');await sleep(150);
  const f4=await p.evaluate(()=>{const b=document.getElementById('tdFit');return {hidden:b.hidden,items:[...b.querySelectorAll('.td-fit-item')].map(x=>x.dataset.k),conf:[...b.querySelectorAll('.td-fit-conflict')].length,open:window.__tdFit.open().map(f=>f.k)};});
  const key='ncr-dra-same-reinforcer';
  ok('4a NCR with FCT raises the conflict on Build',!f4.hidden&&f4.items.includes(key)&&f4.open.includes(key),f4);
  /* 5 */
  await p.evaluate(()=>{window.__asked=[];window.nbhUI.confirm=(q,o)=>{window.__asked.push({q,o});return Promise.resolve(false);};});
  await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="plan"]').click();});await sleep(200);
  await p.evaluate(()=>document.getElementById('bipBtn').click());await sleep(400);
  const a5=await p.evaluate(()=>({asked:window.__asked.slice(),view:document.body.className}));
  ok('5a Copy for the BIP asks while the conflict is not answered; Go to Build goes to Build',a5.asked.length===1&&/work against each other/.test(a5.asked[0].q)&&/Noncontingent|NCR|noncontingent/i.test(a5.asked[0].q)&&a5.asked[0].o.cancel==='Go to Build'&&a5.view==='view-build',a5);
  await p.selectOption(`[data-fitk="${key}"]`,'diff');await sleep(300);
  const f4b=await p.evaluate(k=>({ans:document.querySelector('[name="fit.ans"]').value,open:window.__tdFit.open().length,done:!!document.querySelector('.td-fit-item.td-fit-done[data-k="'+k+'"]')}),key);
  ok('4b "Different reinforcers" answers it and is kept in fit.ans',f4b.open===0&&f4b.done&&JSON.parse(f4b.ans)[key]==='diff',f4b);
  await p.evaluate(()=>{window.__asked=[];});await p.evaluate(()=>document.getElementById('bipBtn').click());await sleep(400);
  ok('5b answered, Copy for the BIP does not ask about it',await p.evaluate(()=>!window.__asked.some(x=>/work against each other/.test(x.q))));
  /* 6 */
  const bip=await p.evaluate(()=>window.__tdBipText());
  ok('6 the BIP text carries How the parts fit together with the answer',/HOW THE PARTS FIT TOGETHER\n- [^\n]*with[^\n]*different reinforcers, so they do not compete/.test(bip),bip.split('HOW THE PARTS FIT TOGETHER')[1]&&bip.split('HOW THE PARTS FIT TOGETHER')[1].slice(0,300));
  /* 4c save and open */
  const dlw=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>document.querySelector('#saveBtn').click());const dl=await dlw;const fp=require('path').join(require('os').tmpdir(),'td1cmp-'+Date.now()+'.json');await dl.saveAs(fp);
  const p2=await ctx.newPage();p2.on('pageerror',e=>errs.push(e.message));await p2.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);
  await p2.setInputFiles('#fileIn',fp);await sleep(2200);
  await p2.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d&&getComputedStyle(d).display!=='none'){const b=d.querySelector('button');if(b)b.click();}}).catch(()=>{});await sleep(400);
  const r4=await p2.evaluate(k=>({open:window.__tdFit.open().length,sel:(document.querySelector('[data-fitk="'+k+'"]')||{}).value}),key);
  ok('4c Save data then Open data keeps the answer',r4.open===0&&r4.sel==='diff',r4);
  await p2.close();
  /* print asks */
  await p.selectOption(`[data-fitk="${key}"]`,'');await sleep(200);
  await p.evaluate(()=>{window.__asked=[];document.getElementById('printFinalBtn').click();});await sleep(400);
  ok('5c Print final plan asks while it is not answered',await p.evaluate(()=>window.__asked.length===1&&/work against each other/.test(window.__asked[0].q)));
  /* 7 */
  await set('m.fn','escape');await p.evaluate(()=>{document.getElementById('compWrap').innerHTML='';});await set('rb.3','');await p.evaluate(()=>window.__tdAddComp('FCT'));await sleep(300);
  const f7=await p.evaluate(()=>window.__tdFit.flags().map(f=>f.r.id));
  await set('rb.3','yes');await sleep(200);const f7b=await p.evaluate(()=>window.__tdFit.flags().map(f=>f.r.id));
  ok('7a FCT with question 4 open and no extinction: the caution; extinction on question 4 clears it',f7.includes('reinforcement-without-extinction')&&!f7b.includes('reinforcement-without-extinction'),{f7,f7b});
  await p.evaluate(()=>window.__tdAddComp('SEXT'));await sleep(300);
  /* v25.64 (H4) a mismatched extinction step is its own rule, a conflict (function-mismatch-extinction) */
  const f7c=await p.evaluate(()=>window.__tdFit.flags().filter(f=>/^function-mismatch/.test(f.r.id)).map(f=>f.cards[0].code));
  ok('7b an automatic-only component (sensory extinction) in an escape plan: the function flag',f7c.includes('SEXT'),f7c);
  /* 8 */
  await p.evaluate(()=>{const d=document.getElementById('bipDlg');if(d&&d.open)d.close();});
  await p.setViewportSize({width:820,height:1180});await sleep(300);
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="build"]').click());await sleep(200);
  await p.click('#tdCmpBtn');await sleep(300);
  const w8=await p.evaluate(()=>{const W=document.documentElement.clientWidth,b=document.getElementById('tdFit').getBoundingClientRect(),d=document.getElementById('tdCmpDlg').getBoundingClientRect();return {W,box:Math.round(b.right),dlg:Math.round(d.right),sw:document.documentElement.scrollWidth};});
  ok('8 upright, the box and the dialog stay inside the window',w8.box<=w8.W&&w8.dlg<=w8.W&&w8.sw<=w8.W+1,w8);
 }catch(e){ok('the run finished',false,e.message);}
 ok('9 no page errors',!errs.length,errs.slice(0,4));
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exitCode=fails?1:0;})();
