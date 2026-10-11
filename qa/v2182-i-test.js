/* v21.82 helper I: Form TD-1 (the BIP).
   1  "Adopted by the team" on the Final plan sheet: meeting date, team present, parent attended, parent input, student
      views, prior written notice, implementation start, plan version (1, then one more per revision). Saved with Save data,
      back with Open data, printed on the final plan and in Copy for the BIP.
   2  "Record a revision" adds a numbered row (date, why, notice date), newest last; the version counts them.
   3  Form PR-1's newest closed review deciding modify / fade / exit after the last version shows a notice with a one-tap
      button; nothing is added until it is tapped; afterwards the notice is gone.
   4  Student and family considerations filled from DM-1 / SI-1 only where empty (typed text kept).
   5  Copy for the BIP carries the least-restrictive review, who collects which data, social validity, review and exit,
      the considerations and the adoption record; an empty form still gives the title only.
   6  Facts out: plan.adoption, plan.versions, plan.considerations in the v21.82 contract's shapes. No page errors.
   Simulated students only (Mateo Rivera, ID 4471823).
   usage: WS_URL=http://127.0.0.1:8131 node qa/v2182-i-test.js */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const TD1='/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
const F={profile:{language:{home:'Spanish',interpreter:true,notes:'mother prefers Spanish at meetings'},culture:'Extended family shares pickup; weekend church routine'},
  student:{date:'2026-09-20',preference:'Wants to earn time with the tablet and to ask for breaks with a card',assent:'given'},
  review:{date:'2026-10-05',next:'2026-11-02',decision:'modify',exit:{threshold:'Hitting at or below 1 per week for 8 weeks',every:'monthly',thresholdN:1},
    log:[{date:'2026-09-14',decision:'continue',decisionText:'Keep going'},{date:'2026-10-05',decision:'modify',decisionText:'Thin the break schedule to FR 3'}]},
  sv:{pre:{mean:4.2,n:3,date:'2026-09-01'},post:{mean:5.1,n:2,date:'2026-10-01'},scale:'1-6',flagged:['Time the plan takes'],form:'TARS'},
  data:{behaviors:[{name:'Hitting',kind:'target',measure:'rate',unit:'per hour'},{name:'Break card',kind:'replacement',measure:'count',unit:'per day'}]}};
(async()=>{const br=await chromium.launch();const log=[];
  const p=await br.newPage({viewport:{width:1300,height:950}});wire(p,log);
  await p.addInitScript(()=>{window.print=function(){};});
  await p.goto(BASE+TD1,{waitUntil:'load'});await sleep(1200);
  const v=n=>p.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;},n);
  const set=(n,x)=>p.evaluate(([n,x])=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,x]);
  /* empty form */
  const e0=await p.evaluate(()=>({bip:window.__bipText(),out:window.__nbhFactsOut(),blk:!!document.querySelector('#final #td82Block'),ver:document.getElementById('td82Ver').textContent,rows:document.querySelectorAll('#td82Vers tbody tr').length}));
  ok('0a the empty form: Copy for the BIP gives the title only',e0.bip.split('\n').filter(Boolean).length<=2,e0.bip.slice(0,200));
  ok('0b the empty form: no facts out',e0.out===null,e0.out);
  ok('0c the block sits on the Final plan sheet, version 1, one row (the adopted plan)',e0.blk&&e0.ver==='1'&&e0.rows===1,e0);
  /* the simulated case, then the adoption record typed */
  await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('simBtn').click();});await sleep(1500);
  await p.evaluate(()=>{const s=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;};s('m.client','Mateo Rivera');s('m.sid','4471823');});
  await set('ad.date','2026-10-02');await set('ad.team','LEA representative, ESE teacher, BCBA, Ms. Rivera (mother)');await set('ad.parent','yes');
  await set('ad.pinput','Asked that the break card also be used at home');await set('ad.student','Mateo chose the tablet as his reward');
  await set('ad.notice','2026-10-03');await set('ad.start','2026-10-07');
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="final"]').click());await sleep(300);
  const a1=await p.evaluate(()=>({ver:document.getElementById('td82Ver').textContent,r1:document.querySelector('#td82Vers tbody tr').textContent,lr:document.getElementById('td82Lr').textContent,
    vis:document.getElementById('td82Block').getBoundingClientRect().height>200}));
  ok('1a the adoption record shows on the Final plan sheet with the adopted row (version 1, October 2, 2026)',a1.vis&&a1.ver==='1'&&/October 2, 2026/.test(a1.r1)&&/Adopted/.test(a1.r1)&&/October 3, 2026/.test(a1.r1),a1);
  ok('1b the least-restrictive review says what was considered and why the plan is least restrictive',/What was considered/.test(a1.lr)&&/Why the plan is least restrictive/.test(a1.lr)&&/No punishment procedure/.test(a1.lr),a1.lr);
  /* revisions */
  await p.evaluate(()=>document.getElementById('td82Rev').click());await sleep(200);
  await p.evaluate(()=>{const s=(id,x)=>{const e=document.getElementById(id);e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};s('td82d0','2026-10-20');s('td82w0','faded');s('td82p0','2026-10-21');s('td82n0','Prompts faded to gestures');});
  await p.evaluate(()=>document.getElementById('td82Rev').click());await sleep(200);
  await p.evaluate(()=>{const s=(id,x)=>{const e=document.getElementById(id);e.value=x;e.dispatchEvent(new Event('change',{bubbles:true}));};s('td82d1','2026-11-03');s('td82w1','other');});
  const r2=await p.evaluate(()=>({ver:document.getElementById('td82Ver').textContent,rows:[...document.querySelectorAll('#td82Vers tbody tr')].map(t=>t.querySelector('td').textContent),json:JSON.parse(document.querySelector('[name="ad.versions"]').value)}));
  ok('2a two revisions: rows 1, 2, 3 newest last, the version is 3',r2.ver==='3'&&r2.rows.join()==='1,2,3'&&r2.json.length===2&&r2.json[0].v===2&&r2.json[0].why==='faded'&&r2.json[0].date==='2026-10-20'&&r2.json[0].notice==='2026-10-21'&&r2.json[1].v===3&&r2.json[1].why==='other',r2);
  /* facts out */
  const o1=await p.evaluate(()=>window.__nbhFactsOut());const A=o1&&o1.plan&&o1.plan.adoption,V=o1&&o1.plan&&o1.plan.versions;
  ok('6a plan.adoption has the contract keys',A&&A.date==='2026-10-02'&&/ESE teacher/.test(A.team)&&A.parent==='yes'&&/break card/.test(A.parentInput)&&/tablet/.test(A.student)&&A.notice==='2026-10-03'&&A.start==='2026-10-07'&&A.version===3,A);
  ok('6b plan.versions: [{v,date,why,notice}] newest last, the adopted plan first',Array.isArray(V)&&V.length===3&&V[0].v===1&&V[0].why==='adopted'&&V[0].date==='2026-10-02'&&V[0].notice==='2026-10-03'&&V[1].v===2&&V[1].why==='faded'&&V[1].date==='2026-10-20'&&V[2].v===3&&V[2].date==='2026-11-03',V);
  ok('6c the plan\'s other keys stay (beh, respond, src)',o1.plan.beh&&o1.plan.respond&&o1.plan.src==='TD-1',Object.keys(o1.plan));
  /* Save data, Clear all, Open data */
  const file=await p.evaluate(()=>new Promise(res=>{const U=URL,mk=U.createObjectURL,ck=HTMLAnchorElement.prototype.click;
    U.createObjectURL=b=>{b.text().then(t=>{U.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;res(t);});return 'blob:nbh-test';};HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('saveBtn').click();}));
  const sf=JSON.parse(file).fields;
  ok('1c Save data holds the adoption fields and the revisions',sf['ad.date']==='2026-10-02'&&sf['ad.parent']==='yes'&&JSON.parse(sf['ad.versions']).length===2,{d:sf['ad.date'],v:sf['ad.versions']});
  await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('clearBtn').click();});await sleep(600);
  const cl=await p.evaluate(()=>({d:document.querySelector('[name="ad.date"]').value,ver:document.getElementById('td82Ver').textContent,rows:document.querySelectorAll('#td82Vers tbody tr').length}));
  ok('1d Clear all empties the record (version 1, one row)',cl.d===''&&cl.ver==='1'&&cl.rows===1,cl);
  await p.setInputFiles('#fileIn',{name:'TD-1_Mateo_Rivera.json',mimeType:'application/json',buffer:Buffer.from(file)});await sleep(1200);
  const bk=await p.evaluate(()=>({d:document.querySelector('[name="ad.date"]').value,team:document.querySelector('[name="ad.team"]').value,ver:document.getElementById('td82Ver').textContent,rows:document.querySelectorAll('#td82Vers tbody tr').length,w0:(document.getElementById('td82w0')||{}).value,n0:(document.getElementById('td82n0')||{}).value}));
  ok('1e Open data brings the record back: fields, version 3, three rows',bk.d==='2026-10-02'&&/BCBA/.test(bk.team)&&bk.ver==='3'&&bk.rows===3&&bk.w0==='faded'&&bk.n0==='Prompts faded to gestures',bk);
  /* printed */
  const pdfTxt=await p.evaluate(()=>{window.dispatchEvent(new Event('beforeprint'));const b=document.getElementById('td82Block');return {txt:b.innerText,disp:getComputedStyle(b).display};});
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const b=document.getElementById('td82Block'),fin=document.getElementById('final');const r=b.getBoundingClientRect();
    return {shown:getComputedStyle(fin).display!=='none'&&r.height>100,btn:getComputedStyle(document.getElementById('td82Rev')).display,lr:getComputedStyle(document.getElementById('td82Lr')).display};});
  await p.emulateMedia({media:'screen'});
  ok('1f printed: the block prints with the final plan (the Record button does not)',pr.shown&&pr.btn==='none'&&pr.lr!=='none'&&/Adopted by the team/i.test(pdfTxt.txt),pr);
  /* the PR-1 notice */
  await set('cn.culture','Typed culture note');
  const fi=await p.evaluate(F=>{const r=window.__nbhFactsIn(JSON.parse(JSON.stringify(F)));const n=document.getElementById('td82Notice');return {r,hidden:n.hidden,txt:n.textContent,rows:document.querySelectorAll('#td82Vers tbody tr').length};},F);
  ok('3a newest PR-1 decision (modify, 2026-10-05) is not after the last version (2026-11-03): no notice',fi.hidden===true,fi);
  /* remove the two revisions: the last version is now the adoption, 2026-10-02 */
  await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('.td82-x[data-k="1"]').click();});await sleep(300);
  await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('.td82-x[data-k="0"]').click();});await sleep(300);
  const n1=await p.evaluate(()=>{const n=document.getElementById('td82Notice');return {hidden:n.hidden,txt:n.textContent,rows:document.querySelectorAll('#td82Vers tbody tr').length,ver:document.getElementById('td82Ver').textContent};});
  ok('3b after the adoption only: the notice reads "Form PR-1 decided modify on October 5, 2026: record the revision", no row added',!n1.hidden&&/Form PR-1 decided modify on October 5, 2026: record the revision/.test(n1.txt)&&n1.rows===1&&n1.ver==='1',n1);
  await p.evaluate(()=>document.getElementById('td82FromPR').click());await sleep(300);
  const n2=await p.evaluate(()=>({hidden:document.getElementById('td82Notice').hidden,json:JSON.parse(document.querySelector('[name="ad.versions"]').value||'[]'),ver:document.getElementById('td82Ver').textContent}));
  ok('3c one tap adds version 2 (2026-10-05, modified, the decision text) and the notice goes',n2.hidden&&n2.ver==='2'&&n2.json.length===1&&n2.json[0].date==='2026-10-05'&&n2.json[0].why==='modified'&&/FR 3/.test(n2.json[0].note||''),n2);
  const n3=await p.evaluate(F=>{F.review.log.push({date:'2026-10-06',decision:'continue'});window.__nbhFactsIn(F);return document.getElementById('td82Notice').hidden;},JSON.parse(JSON.stringify(F)));
  ok('3d a newest decision of continue shows no notice',n3===true);
  /* considerations */
  const c1={culture:await v('cn.culture'),lang:await v('cn.lang'),interp:await v('cn.interp'),pref:await v('cn.pref'),rev:await v('ad.review'),exit:await v('ad.exit'),sv:await v('ad.sv'),data:await v('ad.data')};
  ok('4a considerations filled where empty: home language, interpreter, the student\'s preference; typed culture kept',c1.culture==='Typed culture note'&&/^Spanish/.test(c1.lang)&&c1.interp==='yes'&&/ask for breaks/.test(c1.pref),c1);
  ok('4b review date, exit criteria, social validity and data filled from PR-1, SV-1, DD-1',c1.rev==='2026-11-02'&&/8 weeks/.test(c1.exit)&&/monthly/.test(c1.exit)&&/4\.2/.test(c1.sv)&&/5\.1/.test(c1.sv)&&/1-6/.test(c1.sv)&&/Time the plan takes/.test(c1.sv)&&/Hitting: rate, per hour/.test(c1.data),c1);
  await set('cn.lang','Typed: Spanish and English');
  await p.evaluate(F=>{F.profile.language.home='Portuguese';F.student.preference='Other';window.__nbhFactsIn(F);},JSON.parse(JSON.stringify(F)));
  ok('4c a second fill keeps what is there',(await v('cn.lang'))==='Typed: Spanish and English'&&/ask for breaks/.test(await v('cn.pref')));
  const o2=await p.evaluate(()=>window.__nbhFactsOut().plan.considerations);
  ok('6d plan.considerations {culture, language, interpreter:true, preference}',o2&&o2.culture==='Typed culture note'&&o2.language==='Typed: Spanish and English'&&o2.interpreter===true&&/tablet/.test(o2.preference),o2);
  /* Copy for the BIP */
  const bip=await p.evaluate(()=>window.__bipText());
  const has=h=>bip.indexOf(h)>=0;
  ok('5a BIP text: STUDENT AND FAMILY CONSIDERATIONS after the target behavior',has('STUDENT AND FAMILY CONSIDERATIONS')&&bip.indexOf('STUDENT AND FAMILY CONSIDERATIONS')>bip.indexOf('TARGET BEHAVIOR AND FUNCTION')&&/Interpreter needed: yes/.test(bip),bip.slice(0,600));
  ok('5b BIP text: LEAST RESTRICTIVE REVIEW with what was considered and why',has('LEAST RESTRICTIVE REVIEW')&&/What was considered/.test(bip)&&/Why the plan is least restrictive/.test(bip));
  ok('5c BIP text: WHO COLLECTS WHICH DATA, SOCIAL VALIDITY, REVIEW AND EXIT',has('WHO COLLECTS WHICH DATA\n')&&/Hitting: rate/.test(bip)&&has('SOCIAL VALIDITY\n')&&has('REVIEW AND EXIT\nNext review: November 2, 2026')&&/Exit criteria: .*8 weeks/.test(bip));
  ok('5d BIP text: ADOPTION AND REVISIONS (adopted on, parent, notice, version 2 and its row)',has('ADOPTION AND REVISIONS\nAdopted by the team on October 2, 2026')&&/Parent attended: yes/.test(bip)&&/Prior written notice: October 3, 2026/.test(bip)&&/Plan version: 2/.test(bip)&&/- Version 2, October 5, 2026: modified/.test(bip),bip.slice(bip.indexOf('ADOPTION')));
  /* a punishment component and the typed punishment review */
  await set('rb.punish','Overcorrection proposed by the team on 9/30; declined in favor of FCT and extinction');
  const lr2=await p.evaluate(()=>window.__bipText().split('LEAST RESTRICTIVE REVIEW')[1].split('\n\n')[0]);
  ok('5e the typed punishment review is what the plan says was considered',/What was considered: Overcorrection proposed/.test(lr2),lr2);
  /* the social validity from the plan sheet when SV-1 gave nothing */
  await set('ad.sv','');const sv2=await p.evaluate(()=>window.__bipText().split('SOCIAL VALIDITY\n')[1].split('\n\n')[0]);
  ok('5f without SV-1, social validity comes from the Implementation plan sheet\'s ratings',/Teacher, pre-treatment: acceptability 6 of 7/.test(sv2),sv2);
  /* the toast: one notice, both parts */
  ok('4d one "From the case" notice names the new parts',await p.evaluate(()=>/From the case: .*(home language|the next review date|social validity)/.test((document.querySelector('#nbhToasts')||{}).textContent||'')));
  const errs=log.filter(x=>x.type==='pageerror');
  ok('no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
