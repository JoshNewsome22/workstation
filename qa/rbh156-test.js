/* v24.56 Form RS-1 against the RBT Handbook (06/2026), read again (the BCBA, 10/26): a contact dated before the supervisor's
   training date does not count (and one after it does); two RBT Requirements Coordinators are flagged (one per
   organization); a month that ended not met reminds of the self-report duty; the requirements say that each organization
   meets them separately and that paying for supervision does not make the RBT the employer; the sign page states the
   BACB's Acceptable Signatures Policy. Simulated names only. usage: node qa/rbh156-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const R=await p.evaluate(()=>{const k=yearKeys(setupYear())[0];S.setup.rbt_name='Lee Park (simulated)';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:k+'-10',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];
   const c=(id,d,f)=>({id,date:k+'-'+d,start:'09:00',end:'10:00',sup:'s1',format:f||'indiv',group:'',mode:'person',obs:'yes',client:'',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}});
   m.contacts=[c('c1','05'),c('c2','12')];curKey=k;renderAll();setView('month');renderMonth();
   const is=cIssues(m.contacts[0],k),is2=cIssues(m.contacts[1],k),st=stats(k);
   return {before:is.map(i=>i.lvl+':'+i.t),after:is2.map(i=>i.lvl+':'+i.t),cnt:st.checks.find(x=>x.k==='contacts').d,status:st.status,verdict:(document.getElementById('compVerdict')||{}).textContent};});
 ok('a contact dated before the supervisor\'s training date does not count, and says why; one after it counts',R.before.some(t=>/^fail:Before Dana Cole \(simulated\)’s supervisor training .*does not count/.test(t))&&!R.after.length&&/^1 of 2/.test(R.cnt),R);
 ok('the month (ended, one contact short) reads not met and reminds of the self-report duty',R.status==='fail'&&/Not met: see the red marks\. The RBT and the supervisor self-report supervision noncompliance to the BACB in a timely manner/.test(R.verdict),{status:R.status,verdict:R.verdict});
 const C=await p.evaluate(()=>{S.sups.push({id:'s2',name:'Sam Ortiz (simulated)',cred:'BCBA',cert:'',role:ROLES[1],trained:'yes',trained_date:'2024-01-01',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''});
   const one=supIssues(S.sups[1]).map(i=>i.t);S.sups.push({id:'s3',name:'Lee Rivera (simulated)',cred:'BCBA',cert:'',role:ROLES[2],trained:'yes',trained_date:'2024-01-01',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''});
   const two=supIssues(S.sups[1]).map(i=>i.t);S.sups.splice(1,2);return {one,two};});
 ok('one Requirements Coordinator is fine; a second one is flagged (one per organization)',!C.one.some(t=>/More than one/.test(t))&&C.two.some(t=>/More than one RBT Requirements Coordinator is marked: an RBT has one per organization/.test(t)),C);
 const T=await p.evaluate(()=>{setView('print');renderPrint();const req=[...document.querySelectorAll('.rs-req,#reqBox,#reqBox2')].map(e=>e.textContent).join(' ');
   return {orgs:/meets every requirement at each one separately/.test(req)&&/pays for supervision is not the supervisor’s employer/.test(req),sig:/BACB accepts an electronic signature, drawn or typed, when the right person signs with the intent to sign the record \(RBT Handbook, Acceptable Signatures Policy\)/.test(document.querySelector('.only-print').textContent)};});
 ok('the requirements say each organization meets them separately and that paying for supervision does not make the RBT the employer',T.orgs,T);
 ok('the sign page states the BACB\'s Acceptable Signatures Policy (a drawn or typed electronic signature, signed with intent)',T.sig,T);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
