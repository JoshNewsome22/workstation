/* v24.60 Form RS-1 and the two ethics codes: the supervisor's section 4 duties are named where the form follows them
   (4.10 and 4.08 at The Effects of Supervision, 4.08 at the goals, 4.03 at supervisory volume, 4.11 and 4.12 at the end of
   supervision, RBT Ethics Code 1.06 at the RBT's skills), and the Notice of Alleged Violation list stays as the BCBA
   Handbook gives it. usage: node qa/eth160-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1180,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const T=await p.evaluate(()=>{S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'RBT Supervisor',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];renderAll();setView('rbt');
   const t=document.querySelector('.only-rbt').textContent,it=k=>(document.querySelector('[data-ckitem="'+k+'"]')||{}).textContent||'';
   return {eff:/Ethics Code for Behavior Analysts asks the same of the supervisor: 4\.10, .* 4\.08, document the formal feedback given/.test(t),goals:/improvement plan goes here as a goal.*\(Ethics Code for Behavior Analysts 4\.08\)/.test(t),
     vol:/4\.03: at the limit, the self-assessment is documented/.test(it('sup_volume')),end:/4\.11 and 4\.12/.test(it('end_talk')),skills:/RBT Ethics Code 1\.06/.test(it('skills')),
     nav:/RBT Ethics Code \(2\.0\) standard 1\.03, 1\.05, 3\.01, 3\.02, 3\.03, 3\.04 or 3\.05/.test(t)};});
 ok('The Effects of Supervision names Code 4.10 and 4.08',T.eff,T);ok('the goals name 4.08\'s improvement plan',T.goals,T);
 ok('the checklist names 4.03 (volume), 4.11 and 4.12 (ending) and RBT Ethics Code 1.06 (competence)',T.vol&&T.end&&T.skills,T);
 ok('the Notice of Alleged Violation standards are as the BCBA Handbook lists them',T.nav,T);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
