/* v22.67 Form VI-1, review Wave 3 part 1: a setting event or MO is retained, never eliminated by agreement (F158); a
   consequence is tested by its contingency in the Contingency view, not by matched non-occurrences (F159); the treatment-as-test confirms
   without withdrawing treatment, and a step that arranges conditions needs the consent that covers it and a stop rule,
   read from the case's consent (Form IC-1) (F160); the Contingency view says what ABC-1 supplies, and the antecedent rows give the odds
   ratio and Yule's Q, which classify incident-plus-sample counts (F163). Simulated data only.
   usage: node qa/v2267-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/Variable_Isolation_Protocol.html');await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const joint=()=>p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#jointTbl tbody tr')].map(tr=>{const f=[...tr.querySelectorAll('input,select')].map(x=>x.value);return [f[0],f.slice(1).join(' | ')];}).filter(x=>x[0])));
  let j=await joint();
  ok('1 F158 setting events are retained, not eliminated: poor sleep and the substitute adult',j['Poor sleep']==='No | Mostly | 0 | Retained: setting event or MO'&&j['Substitute adult']==='No | Mostly | 0 | Retained: setting event or MO',j);
  ok('2 F159 a consequence reads n/a on the non-occurrence side and is tested by its contingency: escape and attention',j['Escape delivered']==='Yes | n/a |  | Consequence: see Contingency'&&j['Attention delivered']==='No | n/a |  | Consequence: see Contingency',j);
  ok('3 antecedents as before: the independent demand implicated by difference, the denied tangible eliminated',j['Independent demand']==='Yes | Mostly | 7 | Implicated (difference only)'&&j['Denied tangible']==='No | Mostly | 0 | Eliminated',j);
  const hd=await p.evaluate(()=>[...document.querySelectorAll('#nonTbl thead th.v')].map(th=>th.textContent+(th.classList.contains('vi-cons')?' [cons]':'')));
  ok('4 the non-occurrence ledger marks the consequences\' columns (Contingency)',hd[1]==='Escape delivered · Contingency [cons]'&&hd[3]==='Attention delivered · Contingency [cons]'&&hd[0]==='Independent demand',hd);
  /* the class decides: the same candidate classed as an antecedent is eliminated */
  const reclass=v=>p.evaluate(v=>{const tr=[...document.querySelectorAll('#registerTbl tbody tr')].find(t=>t.querySelector('td:nth-child(2) input').value==='Poor sleep');const s=tr.querySelector('td:nth-child(3) select');s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));},v);
  await reclass('Antecedent / SD');await sleep(150);const j2=await joint();await reclass('Setting event / MO');await sleep(150);
  ok('5 the register\'s class decides: poor sleep classed as an antecedent is eliminated, as a setting event retained',/Eliminated$/.test(j2['Poor sleep'])&&/Retained: setting event/.test((await joint())['Poor sleep']),j2['Poor sleep']);
  const body=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('6 the rule as written: the joint method for an antecedent; a consequence by its contingency (Martens et al., 2008); a setting event by concomitant variation',/That holds for an antecedent\. A consequence follows the behavior by definition, so it cannot be present in a period without the behavior and the joint method says nothing about it: test it by its contingency in the Contingency view \(Martens et al\., 2008\)\. A setting event or motivating operation raises the odds on the days it is present/.test(body));
  /* F160 the decision */
  const dec1=await p.evaluate(()=>document.querySelector('label[for="dec1"]').textContent.replace(/\s+/g,' '));
  ok('7 decision 1 confirms without withdrawing treatment; a reversal needs the consent an FA needs and a stop rule',/Confirm the hypothesis without withdrawing treatment: a brief embedded probe, or a multiple baseline across tasks or settings/.test(dec1)&&/A reversal that withdraws treatment so the behavior returns is an experimental manipulation: it needs the consent an FA needs and a written stop rule/.test(dec1),dec1);
  const interp=await p.evaluate(()=>document.getElementById('hillInterp').textContent);
  ok('8 the high-confidence advice no longer plans a reversal: it needs the parent\'s consent and a stop rule',/confirmed without withdrawing treatment/.test(interp)&&/needs the parent's consent for it and a written stop rule/.test(interp)&&!/with a planned reversal/.test(interp),interp);
  const warn=()=>p.evaluate(()=>{const b=document.getElementById('decWarn');return b.hidden?'':b.textContent;});
  const setv=(n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[n,v]);
  const w0=await warn();
  await setv('dec_stop','');const w1=await warn();
  await setv('dec_consent','');const w2=await warn();
  await p.evaluate(()=>{const r=document.querySelector('input[name="decision"][value="4"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});const w3=await warn();
  await p.evaluate(()=>{const r=document.querySelector('input[name="decision"][value="5"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});const w4=await warn();
  ok('9 the caution: none with the consent and stop rule written; a missing stop rule, then a missing consent, are named; none for "collect more data"',w0===''&&/Write the stop rule/.test(w1)&&/record the consent that covers it/.test(w2)&&/Write the stop rule/.test(w3)&&w4==='',{w0,w1,w2,w3,w4});
  /* the case's consent */
  await p.evaluate(()=>{const r=document.querySelector('input[name="decision"][value="1"]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});
  const exc={consent:{src:'IC-1',state:'Current, with exceptions',on:true,method:'sign',obtained:'2026-09-01',date:'2026-09-01',parent:'2026-09-01',exceptions:'no experimental analysis, no recording',procs:['indirect','abc','fa'],covered:['indirect','abc','scatter','var'],dec:{fa:{dec:'no',stop:''}},v:2}};
  await p.evaluate(f=>window.__nbhFactsIn(f),exc);await sleep(200);
  const c1=await p.evaluate(()=>document.querySelector('[name="dec_consent"]').value),w5=await warn();
  ok('10 the case\'s consent with the FA excepted: the consent line says NOT consented, with the exceptions, and the caution says to confirm without withdrawing treatment',c1==='Form IC-1: the experimental analysis is NOT consented (exceptions: no experimental analysis, no recording)'&&/does not cover an experimental analysis/.test(w5)&&/Confirm the hypothesis without withdrawing treatment/.test(w5),{c1,w5});
  const yes={consent:Object.assign({},exc.consent,{state:'Current',exceptions:'',covered:['indirect','abc','scatter','var','fa'],dec:{fa:{dec:'yes',stop:'Two hits in one session, or any injury (simulated).'}}})};
  await p.evaluate(f=>window.__nbhFactsIn(f),yes);await sleep(200);
  const c2=await p.evaluate(()=>({c:document.querySelector('[name="dec_consent"]').value,s:document.querySelector('[name="dec_stop"]').value})),w6=await warn();
  ok('11 consented: the line is replaced (the case wrote it), the parent\'s stop rule fills the empty box, and the caution clears',c2.c==='Form IC-1: the experimental analysis is consented (9/1/2026)'&&c2.s==='Two hits in one session, or any injury (simulated) (Form IC-1)'&&w6==='',{c2,w6});
  await setv('dec_consent','Typed by the BCBA: consent on the district form (simulated)');await p.evaluate(f=>window.__nbhFactsIn(f),exc);await sleep(150);
  ok('12 a consent line the BCBA typed is kept',await p.evaluate(()=>document.querySelector('[name="dec_consent"]').value)==='Typed by the BCBA: consent on the district form (simulated)');
  /* F163 the Contingency view */
  const ant=()=>p.evaluate(()=>[...document.querySelectorAll('.antRow')].slice(0,3).map(r=>({ratio:r.querySelector('.o3').textContent,cls:r.querySelector('.o4').textContent.replace(/\s+/g,' ')})));
  const a1=await ant();
  await p.evaluate(()=>{const s=document.getElementById('cKind');s.value='abc';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);const a2=await ant();
  ok('13 interval counts: the ratio and its label as before, with the odds ratio and Yule\'s Q beside',/^Evocative odds ratio 50\.32, Yule’s Q 0\.96$/.test(a1[0].cls)&&a1[0].ratio!=='—',a1);
  ok('14 incident-plus-sample counts (ABC-1): no ratio, the classification from Q with ABC-1\'s bands',a2[0].ratio==='—'&&/^Evocative \(strong\) odds ratio/.test(a2[0].cls)&&/^Abative \(moderate\)/.test(a2[1].cls)&&/^No effect \(negligible\)/.test(a2[2].cls),a2);
  ok('15 the data requirements say what ABC-1 supplies (the consequence side) and what it does not (the antecedent side)',/Consequence side: Form ABC-1 supplies the four figures for each consequence/.test(body)&&/P\(B \| A\) needs the antecedent coded in every interval, with and without the behavior, which ABC-1 does not record/.test(body)&&!/Form ABC-1 produces the counts directly/.test(body));
  /* saved and opened */
  const dlP=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('btnSave').click());const d=JSON.parse(fs.readFileSync(await (await dlP).path(),'utf8'));
  ok('16 the new fields are saved apart (x): the consent line, the stop rule, how the counts were taken',d.x&&d.x.dec_consent==='Typed by the BCBA: consent on the district form (simulated)'&&/Two hits/.test(d.x.dec_stop)&&d.x.c_kind==='abc',d.x);
  const stmt=await p.evaluate(()=>document.querySelector('[name="h_statement"]').value);
  const old=JSON.parse(JSON.stringify(d));delete old.x;
  await p.setInputFiles('#fileIn',{name:'VI1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await sleep(900);
  const o=await p.evaluate(()=>({st:document.querySelector('[name="h_statement"]').value,c:document.querySelector('[name="dec_consent"]').value,k:document.getElementById('cKind').value}));
  ok('17 a file without the new fields opens field for field (the hypothesis in place), the new ones empty',o.st===stmt&&o.c===''&&o.k==='',o);
  await p.setInputFiles('#fileIn',{name:'VI1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(900);
  ok('18 the saved file opens with them',await p.evaluate(()=>document.querySelector('[name="dec_consent"]').value)==='Typed by the BCBA: consent on the district form (simulated)');
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('19 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
