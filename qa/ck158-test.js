/* v24.58 Form RS-1: the BACB's two Supervision Checklists as one list on the RBT record (the BCBA, 10/26). Four phases;
   items the form records show their state from the record (training, roles, portal, expiration, 5% tracking, effects
   reviews); the rest are ticked with a date (today by default; the date can be changed; unticking clears it); the
   Requirements Coordinator's items show only with a coordinator; the 6-monthly and quarterly reviews give their next date
   and are late after it; both are on the workstation's due line; the ticks are kept with the RBT and read back from the
   file (an unknown key or a bad date is not taken); the year summary prints where the checklists stand.
   Simulated names only. usage: node qa/ck158-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1180,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';S.setup.rbt_exp='2027-11-01';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'RBT Supervisor',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   renderAll();setView('rbt');});await sleep(300);
 const A=await p.evaluate(()=>{const it=k=>document.querySelector('[data-ckitem="'+k+'"]');return {groups:[...document.querySelectorAll('#ckList .rs-ckgrp h3')].map(h=>h.textContent),
   items:document.querySelectorAll('#ckList li').length,trained:it('sup_trained').className,portal:it('portal').className,exp:it('calendar').textContent,five:it('five').className,rcItem:!!it('rc_sups'),
   ticks:document.querySelectorAll('#ckList input[data-bck]').length,sum:document.getElementById('ckSum').textContent,vis:!!document.getElementById('ckList').offsetParent};});
 ok('the checklists show on the RBT record in the four phases',A.vis&&A.groups.join('|')==='Before supervision starts|During the first month|Each month or quarter|At the end of supervision',A);
 ok('items the form records show their state from it (training and portal recorded: done; the expiration date; no service days yet: 5% not yet)',/\bok\b/.test(A.trained)&&/\bok\b/.test(A.portal)&&/expires 11\/1\/2027/.test(A.exp)&&!/\bok\b/.test(A.five),A);
 ok('without a Requirements Coordinator, the coordinator\'s items are not shown',!A.rcItem&&A.items===25,{items:A.items,rc:A.rcItem});
 /* tick, date, untick */
 await p.check('#bck_expect');await sleep(150);
 const T=await p.evaluate(()=>({d:(S.ckl||{}).expect,today:todayISO(),date:document.getElementById('bck_expect_d').value,cls:document.querySelector('[data-ckitem="expect"]').className}));
 ok('ticking an item dates it today and marks it done',T.d===T.today&&T.date===T.today&&/\bok\b/.test(T.cls),T);
 await p.fill('#bck_expect_d','2026-09-02');await p.dispatchEvent('#bck_expect_d','change');await sleep(150);
 await p.uncheck('#bck_skills').catch(()=>{});await p.check('#bck_skills');await sleep(100);await p.uncheck('#bck_skills');await sleep(150);
 const U=await p.evaluate(()=>({expect:S.ckl.expect,skills:'skills' in (S.ckl||{})}));
 ok('the date can be changed, and unticking clears an item',U.expect==='2026-09-02'&&!U.skills,U);
 /* recurring: next date, late, due line */
 await p.check('#bck_review6');await p.check('#bck_codeq');await sleep(150);await p.fill('#bck_review6_d','2026-04-01');await p.dispatchEvent('#bck_review6_d','change');await p.fill('#bck_codeq_d',await p.evaluate(()=>todayISO()));await p.dispatchEvent('#bck_codeq_d','change');await sleep(200);
 const R=await p.evaluate(()=>({r6:document.querySelector('[data-ckitem="review6"]').className,r6t:document.querySelector('[data-ckitem="review6"]').textContent,cq:document.querySelector('[data-ckitem="codeq"]').textContent,due:window.__nbhDue().filter(x=>/^Review the/.test(x.what)).map(x=>x.what+' '+x.date)}));
 ok('the 6-monthly review done 4/1/2026 is due again since 10/1/2026 (marked late); the quarterly one done today gives its next date',/\blate\b/.test(R.r6)&&/Due again since 10\/1\/2026/.test(R.r6t)&&/Next by/.test(R.cq),R);
 ok('both reviews are on the workstation\'s due line with the RBT\'s name',R.due.length===2&&R.due.some(x=>/RBT Ethics Code, RBT Handbook and BACB website \(Lee Park \(simulated\)\) 2026-10-01/.test(x)),R.due);
 /* with a coordinator */
 await p.evaluate(()=>{S.sups.push({id:'s2',name:'Sam Ortiz (simulated)',cred:'BCBA',cert:'',role:ROLES[1],trained:'yes',trained_date:'2024-01-01',portal:'no',norel:true,oversight:OVERS[0][0],oversight_note:''});renderRbt();});
 const C=await p.evaluate(()=>({rc:!!document.querySelector('[data-ckitem="rc_sups"]')&&!!document.querySelector('[data-ckitem="rc_check"]'),portal:document.querySelector('[data-ckitem="portal"]').className}));
 ok('with a Requirements Coordinator, the coordinator\'s items show, and the portal item follows the coordinator\'s listing (not marked: not done)',C.rc&&!/\bok\b/.test(C.portal),C);
 /* the file, and the year summary */
 const F=await p.evaluate(()=>{const o=fromFile(JSON.parse(JSON.stringify(saveObj())));const bad=fromFile({form:'RS-1',S:Object.assign(JSON.parse(JSON.stringify(S)),{ckl:{expect:'2026-09-02',nonsense:'2026-01-01',reqs:'soon'}})});
   setView('print');renderPrint();return {back:JSON.stringify(o.ckl)===JSON.stringify(S.ckl),bad:bad.ckl,printed:(document.getElementById('yearOut').textContent.match(/The BACB supervision checklists:[^.]*\./)||[''])[0]};});
 ok('the ticks are kept with the RBT and come back from the file; an unknown item or a bad date is not taken',F.back&&JSON.stringify(F.bad)==='{"expect":"2026-09-02"}',F);
 ok('the year summary prints where the checklists stand, with the last joint review',/before supervision starts \d+ of \d+; during the first month \d+ of \d+; each month or quarter \d+ of \d+; at the end of supervision 0 of 3 \(when supervision ends\); the codes, the handbook and the BACB website last reviewed together 4\/1\/2026\./.test(F.printed),F.printed);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
