/* v21.83 helper M: several targets in one plan.
   TD-1  "Targets in this plan" (Setup sheet): every reduction target from the case (TB-1's problem behaviors, FS-1's
         function per target), filled while empty, ticks for the parts of the plan that address each, the flags "Not
         addressed by the plan yet" and "Function differs from the plan's", Copy for the BIP listing every target with its
         definition and function, the final plan printing them, Save data / Open data, facts out plan.targets (plan.beh
         kept as the first target).
   PR-1  "Results by target" (question 2): a row per target from f.data.behaviors matched by name to f.plan.targets or
         f.behaviors (baseline mean, current mean, change, the decision rule met or not by review.rules, a per-target
         decision), empty cells only, printed, saved, a per-target line in the decision log, facts out review.targets.
   The v21.82 blocks keep working (their own tests are run separately). Simulated students only (Mateo Rivera, ID 4471823).
   usage: WS_URL=http://127.0.0.1:8141 node qa/v2183-m-test.js */
const {chromium,BASE,wire,sleep,fs,path}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const OUT=path.join(__dirname,'out','v2183-m');fs.mkdirSync(OUT,{recursive:true});
const TD1='/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
const PR1='/NBH-Workstation/PR-1_Periodic-Plan-Review_v2026-09.html';
/* three reduction targets, two functions: hitting and screaming escape (screaming's function is not given by FS-1, so it
   is the plan's), calling out attention; a replacement that is not a target */
const F={
  behaviors:[{label:'Hitting',def:'Striking a peer or adult with an open or closed hand',isRep:false,type:'Problem behavior',fn:'',src:'TB-1'},
    {label:'Screaming',def:'Vocalizing above conversational volume for 3 s or longer',isRep:false,type:'Problem behavior',src:'TB-1'},
    {label:'Calling out',def:'Speaking to the teacher without raising a hand during whole-group instruction',isRep:false,type:'Problem behavior',src:'TB-1'},
    {label:'Break card',def:'Handing the break card to an adult',isRep:true,type:'Replacement behavior',src:'TB-1'}],
  fn:{key:'escape',label:'Escape',statements:['When given multi-step math work, Mateo hits to escape the task.'],
    perBehavior:[{label:'Hitting',fn:'Escape',fnKey:'escape'},{label:'Calling out',fn:'Attention',fnKey:'attention'}]},
  behaviorsFS:[{label:'Hitting',def:'Striking a peer or adult',fn:'Escape',fnKey:'escape',ant:'Multi-step math worksheet',cons:'Task removed',src:'FS-1'},
    {label:'Calling out',def:'',fn:'Attention',fnKey:'attention',ant:'Teacher helping peers',cons:'Teacher answers',src:'FS-1'}]};
(async()=>{const br=await chromium.launch();const log=[];
  /* ======================= TD-1 ======================= */
  {const p=await br.newPage({viewport:{width:1024,height:1366}});wire(p,log);
    await p.addInitScript(()=>{window.print=function(){};});
    await p.goto(BASE+TD1,{waitUntil:'load'});await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});
    const e0=await p.evaluate(()=>({tbl:!!document.querySelector('#setup #td83Tbl'),none:!!document.querySelector('#td83Tbl tbody .td83-none'),out:window.__nbhFactsOut(),fin:document.getElementById('td83Final').textContent}));
    ok('TD-1 0a the table sits on the Setup sheet and is empty; no facts out; the final plan shows nothing',e0.tbl&&e0.none&&e0.out===null&&e0.fin==='',e0);
    /* the simulated plan (escape, with antecedent, teaching and responding parts), Mateo's name */
    await p.evaluate(()=>{document.getElementById('simScenario').value='escape_nce';document.getElementById('simBtn').click();});await sleep(1500);
    await p.evaluate(()=>{const s=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;};s('m.client','Mateo Rivera');s('m.sid','4471823');
      const f=document.querySelector('[name="m.fn"]');f.value='escape';f.dispatchEvent(new Event('change',{bubbles:true}));});
    const beh0=await p.evaluate(()=>document.querySelector('[name="m.beh"]').value);
    const r1=await p.evaluate(F=>window.__nbhFactsIn(JSON.parse(JSON.stringify(F))),F);await sleep(200);
    const t1=await p.evaluate(()=>({rows:[...document.querySelectorAll('#td83Tbl tbody tr[data-k]')].map(tr=>({label:tr.querySelector('[data-f=label]').value,def:tr.querySelector('[data-f=def]').value,fn:tr.querySelector('[data-f=fn]').value,
      ant:tr.querySelector('[data-f=ant]').checked,teach:tr.querySelector('[data-f=teach]').checked,respond:tr.querySelector('[data-f=respond]').checked,st:tr.querySelector('.td83-st').textContent})),
      sum:document.getElementById('td83Sum').textContent,sumHidden:document.getElementById('td83Sum').hidden,toast:(document.querySelector('#nbhToasts')||{}).textContent||''}));
    const R=t1.rows;
    ok('TD-1 1a three reduction targets filled from the case, the replacement left out',R.length===3&&R.map(r=>r.label).join('|')==='Hitting|Screaming|Calling out',R);
    ok('TD-1 1b definitions from TB-1; functions per target from FS-1 (hitting escape, calling out attention), screaming the plan\'s',
      /open or closed hand/.test(R[0].def)&&R[0].fn==='escape'&&R[1].fn===''&&R[2].fn==='attention'&&/without raising a hand/.test(R[2].def),R);
    ok('TD-1 1c the targets sharing the plan\'s function get the parts the plan has ticked; calling out none',R[0].ant&&R[0].teach&&R[0].respond&&R[1].ant&&R[1].teach&&R[1].respond&&!R[2].ant&&!R[2].teach&&!R[2].respond,R);
    ok('TD-1 1d flags: calling out is not addressed and its function differs from the plan\'s; the others are addressed',
      /Not addressed by the plan yet/.test(R[2].st)&&/Function differs from the plan.s \(escape \/ avoidance\): needs its own strategies/.test(R[2].st)&&/^Addressed by: antecedent strategies, replacement and teaching, consequence and responding$/.test(R[0].st)&&!/Not addressed|differs/.test(R[1].st),R.map(r=>r.st));
    ok('TD-1 1e the summary above the table names calling out',!t1.sumHidden&&/Not addressed by the plan yet: Calling out/.test(t1.sum)&&/Calling out \(attention\)/.test(t1.sum),t1.sum);
    ok('TD-1 1f facts in reports the targets; the notice names them; the target behavior field kept',r1&&r1.filled>=3&&/3 targets in this plan/.test(r1.note)&&/3 targets in this plan/.test(t1.toast)&&(await p.evaluate(()=>document.querySelector('[name="m.beh"]').value))===beh0,{r1,toast:t1.toast});
    /* untick screaming's three parts: it is flagged; a note on one part addresses it again */
    await p.evaluate(()=>{['ant','teach','respond'].forEach(k=>{const e=document.getElementById('td83'+k+'1');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));});});
    const s2=await p.evaluate(()=>document.querySelector('#td83Tbl tbody tr[data-k="1"] .td83-st').textContent);
    ok('TD-1 2a a target with no part ticked reads "Not addressed by the plan yet"',/Not addressed by the plan yet/.test(s2)&&!/differs/.test(s2),s2);
    await p.evaluate(()=>{const e=document.querySelector('#td83Tbl tbody tr[data-k="1"] [data-f="respondN"]');e.value='Same planned ignoring as hitting';e.dispatchEvent(new Event('input',{bubbles:true}));});
    const s3=await p.evaluate(()=>document.querySelector('#td83Tbl tbody tr[data-k="1"] .td83-st').textContent);
    ok('TD-1 2b a short note counts as addressing that part',/^Addressed by: consequence and responding$/.test(s3),s3);
    /* a second fill keeps the table */
    await p.evaluate(()=>{const e=document.querySelector('#td83Tbl tbody tr[data-k="0"] [data-f="def"]');e.value='Typed: hitting with a hand or fist';e.dispatchEvent(new Event('input',{bubbles:true}));});
    await p.evaluate(F=>{F.behaviors.push({label:'Spitting',def:'x',isRep:false});window.__nbhFactsIn(F);},JSON.parse(JSON.stringify(F)));
    const k2=await p.evaluate(()=>JSON.parse(document.querySelector('[name="tg.rows"]').value));
    ok('TD-1 2c a later fill keeps what is there (no new row, the typed definition kept)',k2.length===3&&k2[0].def==='Typed: hitting with a hand or fist'&&k2[1].respondN==='Same planned ignoring as hitting',k2);
    /* the plan's function changed to multiple control: no different-function flag */
    /* Copy for the BIP */
    const bip=await p.evaluate(()=>window.__bipText());const tb=bip.split('TARGET BEHAVIOR AND FUNCTION\n')[1]||'';const blk=tb.split('\n\n')[0];
    ok('TD-1 3a BIP text lists every target with its definition and function instead of one target line',/^Targets in this plan:\n1\. Hitting: Typed: hitting with a hand or fist\. Function: escape \/ avoidance\./.test(blk)&&/\n2\. Screaming: Vocalizing above conversational volume for 3 s or longer\. Function: escape \/ avoidance \(the plan's\)\./.test(blk)&&/\n3\. Calling out: Speaking to the teacher without raising a hand during whole-group instruction\. Function: attention, not the plan's main function \(escape \/ avoidance\): it needs strategies of its own\. Not addressed by the plan yet\./.test(blk)&&!/\nTarget behavior: /.test(blk)&&/Function \(EA-1\): Escape/.test(blk),blk);
    ok('TD-1 3b the v21.82 sections still follow (STUDENT AND FAMILY CONSIDERATIONS order kept, ADOPTION AND REVISIONS)',bip.indexOf('TARGET BEHAVIOR AND FUNCTION')<bip.indexOf('BASELINE AND CRITERIA')&&/LEAST RESTRICTIVE REVIEW/.test(bip),bip.slice(0,300));
    /* the final plan */
    await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="final"]').click());await sleep(300);
    const fin=await p.evaluate(()=>document.getElementById('td83Final').innerText);
    ok('TD-1 4a the final plan lists the three targets with function and the parts that address them',/Targets in this plan/i.test(fin)&&/1\. Hitting/.test(fin)&&/2\. Screaming.*Addressed by: consequence and responding \(Same planned ignoring as hitting\)/.test(fin)&&/3\. Calling out.*Not addressed by the plan yet/.test(fin),fin);
    await p.emulateMedia({media:'print'});
    const pr=await p.evaluate(()=>{window.dispatchEvent(new Event('beforeprint'));const v=el=>!!el&&getComputedStyle(el).display!=='none';return {fin:v(document.getElementById('td83Final'))&&document.getElementById('td83Final').getBoundingClientRect().height>40,tbl:v(document.getElementById('td83Tbl')),add:v(document.getElementById('td83Add')),x:v(document.querySelector('.td83-x'))};});
    await p.emulateMedia({media:'screen'});
    ok('TD-1 4b printed: the table and the final-plan list print, the buttons do not',pr.fin&&pr.tbl&&!pr.add&&!pr.x,pr);
    /* facts out */
    const o=await p.evaluate(()=>window.__nbhFactsOut());const P=o&&o.plan,TG=P&&P.targets;
    ok('TD-1 5a plan.targets [{label, fn, ant, teach, respond, covered}] for the three targets',Array.isArray(TG)&&TG.length===3&&TG[0].label==='Hitting'&&TG[0].fn==='escape'&&TG[0].ant===true&&TG[0].teach===true&&TG[0].respond===true&&TG[0].covered===true&&
      TG[1].fn==='escape'&&TG[1].ant===false&&TG[1].respond==='Same planned ignoring as hitting'&&TG[1].covered===true&&TG[2].fn==='attention'&&TG[2].fnDiffers===true&&TG[2].covered===false&&TG[2].ant===false,TG);
    ok('TD-1 5b plan.beh, plan.fn and the v21.82 keys stay',P.beh===beh0&&P.fn==='escape'&&P.src==='TD-1'&&P.respond,{beh:P.beh,fn:P.fn});
    /* Save data, Clear all, Open data */
    const file=await p.evaluate(()=>new Promise(res=>{const U=URL,mk=U.createObjectURL,ck=HTMLAnchorElement.prototype.click;
      U.createObjectURL=b=>{b.text().then(t=>{U.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;res(t);});return 'blob:nbh-test';};HTMLAnchorElement.prototype.click=function(){};
      document.getElementById('saveBtn').click();}));
    const sf=JSON.parse(file).fields;
    ok('TD-1 6a Save data holds the targets (tg.rows)',JSON.parse(sf['tg.rows']||'[]').length===3,sf['tg.rows']);
    await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('clearBtn').click();});await sleep(700);
    const cl=await p.evaluate(()=>({v:document.querySelector('[name="tg.rows"]').value,rows:document.querySelectorAll('#td83Tbl tbody tr[data-k]').length,fin:document.getElementById('td83Final').textContent}));
    ok('TD-1 6b Clear all empties the table',cl.v===''&&cl.rows===0&&cl.fin==='',cl);
    await p.setInputFiles('#fileIn',{name:'TD-1_Mateo_Rivera.json',mimeType:'application/json',buffer:Buffer.from(file)});await sleep(1300);
    const bk=await p.evaluate(()=>({rows:[...document.querySelectorAll('#td83Tbl tbody tr[data-k]')].map(tr=>tr.querySelector('[data-f=label]').value+'/'+tr.querySelector('[data-f=fn]').value+'/'+tr.querySelector('[data-f=ant]').checked),
      note:document.querySelector('#td83Tbl tbody tr[data-k="1"] [data-f="respondN"]').value,out:window.__nbhFactsOut().plan.targets.length}));
    ok('TD-1 6c Open data brings the targets back: rows, functions, ticks, notes',bk.rows.join('|')==='Hitting/escape/true|Screaming//false|Calling out/attention/false'&&bk.note==='Same planned ignoring as hitting'&&bk.out===3,bk);
    /* add and remove a target, the plan's function made multiple */
    await p.evaluate(()=>document.getElementById('td83Add').click());await sleep(150);
    await p.evaluate(()=>{const e=document.querySelector('#td83Tbl tbody tr[data-k="3"] [data-f="label"]');e.value='Spitting';e.dispatchEvent(new Event('input',{bubbles:true}));});
    const ad=await p.evaluate(()=>window.__nbhFactsOut().plan.targets.map(t=>t.label).join('|'));
    ok('TD-1 7a Add a target adds an editable row',ad==='Hitting|Screaming|Calling out|Spitting',ad);
    await p.evaluate(()=>document.querySelector('.td83-x[data-k="3"]').click());await sleep(300);
    const rm=await p.evaluate(()=>window.__nbhFactsOut().plan.targets.length);
    ok('TD-1 7b Remove takes it out',rm===3,rm);
    const mu=await p.evaluate(()=>{const f=document.querySelector('[name="m.fn"]');f.value='multiple';f.dispatchEvent(new Event('change',{bubbles:true}));return document.querySelector('#td83Tbl tbody tr[data-k="2"] .td83-st').textContent;});
    ok('TD-1 7c with the plan under multiple control, no different-function flag',!/differs/.test(mu)&&/Not addressed/.test(mu),mu);
    /* the Tick button */
    const tk=await p.evaluate(()=>{const f=document.querySelector('[name="m.fn"]');f.value='attention';f.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('td83Tick').click();
      return JSON.parse(document.querySelector('[name="tg.rows"]').value).map(r=>r.ant+','+r.teach+','+r.respond);});
    ok('TD-1 7d "Tick what the plan already covers" ticks the targets sharing the plan\'s function (now attention: calling out, and screaming, which follows the plan\'s)',tk[2]==='true,true,true'&&tk[1]==='true,true,true',tk);
    await p.close();}

  /* ======================= PR-1 ======================= */
  {const p=await br.newPage({viewport:{width:1024,height:1366}});wire(p,log);
    await p.addInitScript(()=>{window.print=function(){};});
    await p.goto(BASE+PR1,{waitUntil:'load'});await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
    const e0=await p.evaluate(()=>({tbl:!!document.querySelector('section.only-ev #pr83Tbl'),out:window.__nbhFactsOut()}));
    ok('PR-1 0a the Results by target table is in question 2; blank form out stays null',e0.tbl&&e0.out===null,e0);
    await p.evaluate(()=>{const s=(k,v)=>{const el=document.querySelector('[data-m="'+k+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
      s('client','Mateo Rivera');s('sid','4471823');s('date','10/05/2026');s('intPct','95');});
    /* the case: plan.targets from TD-1 and DD-1's record for the three targets and the replacement */
    const G={plan:{beh:'Hitting',fn:'escape',targets:[{label:'Hitting',fn:'escape',ant:true,teach:true,respond:true,covered:true},{label:'Screaming',fn:'escape',ant:true,teach:true,respond:true,covered:true},{label:'Calling out',fn:'attention',ant:false,teach:false,respond:false,covered:false}]},
      behaviors:F.behaviors,
      data:{from:'2026-08-17',to:'2026-10-02',days:30,conds:[{name:'Baseline',from:'2026-08-17',to:'2026-08-28',days:10},{name:'Treatment',from:'2026-08-31',to:'2026-10-02',days:20}],
        behaviors:[{name:'hitting',kind:'target',unit:'per day',measure:'count',direction:'decrease',base:{days:10,mean:8},cur:{days:20,mean:2},curName:'Treatment'},
          {name:'Screaming',kind:'target',unit:'per day',measure:'count',direction:'decrease',base:{days:10,mean:5},cur:{days:20,mean:4.5}},
          {name:'Calling out',kind:'target',unit:'per hour',measure:'rate',direction:'decrease',base:{days:10,mean:6},cur:{days:6,mean:3}},
          {name:'Break card',kind:'replacement',unit:'per day',measure:'count',direction:'increase',base:{days:10,mean:0},cur:{days:20,mean:7}}]}};
    await p.evaluate(()=>{document.querySelector('[data-m="beh"]').value='';});
    const r1=await p.evaluate(G=>window.__nbhFactsIn(G),G);await sleep(150);
    const t1=await p.evaluate(()=>[...document.querySelectorAll('#pr83Tbl tbody tr[data-k]')].map(tr=>({name:tr.querySelector('[data-f=name]').value,base:tr.querySelector('[data-f=base]').value,cur:tr.querySelector('[data-f=cur]').value,days:tr.querySelector('[data-f=days]').value,
      chg:tr.querySelector('.pr83-chg').textContent,rule:tr.querySelector('.pr83-rule').textContent,dec:tr.querySelector('[data-f=decision]').value})));
    ok('PR-1 1a one row per reduction target, named as the plan names them, the replacement left out',t1.length===3&&t1.map(r=>r.name).join('|')==='Hitting|Screaming|Calling out',t1);
    ok('PR-1 1b baseline and current means from DD-1 matched by name (hitting matched case-insensitively)',t1[0].base==='8'&&t1[0].cur==='2'&&t1[0].days==='20'&&t1[1].base==='5'&&t1[1].cur==='4.5'&&t1[2].base==='6'&&t1[2].cur==='3'&&t1[2].days==='6',t1);
    ok('PR-1 1c change from baseline: -75%, -10%, -50%',t1[0].chg==='-75%'&&t1[1].chg==='-10%'&&t1[2].chg==='-50%',t1.map(r=>r.chg));
    ok('PR-1 1d the rule (25% reduction, 10 days): hitting met, screaming not met, calling out too few days',/^Met/.test(t1[0].rule)&&/^Not met/.test(t1[1].rule)&&/^Too few days \(6 of 10\)/.test(t1[2].rule),t1.map(r=>r.rule));
    ok('PR-1 1e per-target decisions filled: hitting fade, screaming modify, calling out continue',t1[0].dec==='fade'&&t1[1].dec==='modify'&&t1[2].dec==='continue',t1.map(r=>r.dec));
    ok('PR-1 1f facts in reports the rows',r1&&r1.filled>=3&&/results by target/.test(r1.note||''),r1);
    /* typed cells stay; a second fill does not overwrite */
    await p.evaluate(()=>{const s=(k,f,v)=>{const e=document.querySelector('#pr83Tbl tbody tr[data-k="'+k+'"] [data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
      s(1,'decision','continue');s(1,'note','Teacher reports fewer long episodes');s(2,'cur','');});
    await p.evaluate(G=>{G.data.behaviors[1].cur.mean=1;window.__nbhFactsIn(G);},JSON.parse(JSON.stringify(G)));
    const t2=await p.evaluate(()=>JSON.parse(JSON.stringify(S.tg)));
    ok('PR-1 2a only empty cells are filled: the typed decision and note kept, the emptied current mean filled again',t2[1].decision==='continue'&&t2[1].cur==='4.5'&&t2[1].note==='Teacher reports fewer long episodes'&&t2[2].cur==='3',t2);
    /* the overall decision stays */
    await p.evaluate(()=>{const el=document.querySelector('[data-m="dec"]');el.value='Modify the plan';el.dispatchEvent(new Event('change',{bubbles:true}));const n=document.querySelector('[data-m="next"]');n.value='11/02/2026';n.dispatchEvent(new Event('input',{bubbles:true}));});
    const o1=await p.evaluate(()=>window.__nbhFactsOut().review);const TG=o1&&o1.targets;
    ok('PR-1 3a review.targets [{name, base, cur, chg, met, decision}]',Array.isArray(TG)&&TG.length===3&&TG[0].name==='Hitting'&&TG[0].base===8&&TG[0].cur===2&&TG[0].chg===-75&&TG[0].met===true&&TG[0].decision==='fade'&&
      TG[1].chg===-10&&TG[1].met===false&&TG[1].decision==='continue'&&TG[2].met===false&&TG[2].days===6&&TG[2].decision==='continue',TG);
    ok('PR-1 3b the overall decision and the rules stay (modify; improvePct 25, minDays 10)',o1.decision==='modify'&&o1.rules.improvePct===25&&o1.rules.minDays===10,o1);
    /* printed */
    await p.emulateMedia({media:'print'});
    const pr=await p.evaluate(()=>{const v=el=>!!el&&getComputedStyle(el).display!=='none';return {sec:v(document.getElementById('pr83Sec')),tbl:document.getElementById('pr83Tbl').getBoundingClientRect().height>60,add:v(document.getElementById('pr83Add'))};});
    await p.emulateMedia({media:'screen'});
    ok('PR-1 4a printed: the per-target results print with the form, the button does not',pr.sec&&pr.tbl&&!pr.add,pr);
    /* save, clear, open */
    const save=()=>p.evaluate(async()=>{let got=null;const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{got=b;return 'blob:caught';};HTMLAnchorElement.prototype.click=function(){};
      try{document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,200));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}return got?await got.text():null;});
    const saved=await save();const sj=JSON.parse(saved);
    ok('PR-1 5a Save writes the per-target rows',Array.isArray(sj.S.tg)&&sj.S.tg.length===3&&sj.S.tg[0].decision==='fade',sj.S.tg);
    await p.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(400);
    ok('PR-1 5b Clear empties them',await p.evaluate(()=>(!S.tg||!S.tg.length)&&document.querySelectorAll('#pr83Tbl tbody tr[data-k]').length===0));
    const fp=path.join(OUT,'PR-1_saved.json');fs.writeFileSync(fp,saved);
    await p.setInputFiles('#fileIn',fp);await sleep(800);
    const rt=await p.evaluate(()=>({tg:JSON.parse(JSON.stringify(S.tg)),rows:document.querySelectorAll('#pr83Tbl tbody tr[data-k]').length,rule:document.querySelector('#pr83Tbl tbody tr[data-k="0"] .pr83-rule').textContent}));
    ok('PR-1 5c Open puts them back',JSON.stringify(rt.tg)===JSON.stringify(sj.S.tg)&&rt.rows===3&&/^Met/.test(rt.rule),rt);
    /* close the review: the log line */
    await p.evaluate(()=>document.querySelector('#prCloseRev').click());await sleep(600);
    const lg=await p.evaluate(()=>({e:JSON.parse(JSON.stringify(S.log[S.log.length-1])),tt:document.querySelector('#prLogTbl tbody tr').textContent,tg:JSON.parse(JSON.stringify(S.tg)),out:window.__nbhFactsOut().review.log.slice(-1)[0]}));
    ok('PR-1 6a the closed review\'s log entry has a short per-target line',/^Hitting -75% \(met\), fade; Screaming -10% \(not met\), continue; Calling out -50% \(too few days\), continue$/.test(lg.e.targets||''),lg.e);
    ok('PR-1 6b the log table and review.log carry it',/By target: Hitting -75% \(met\), fade/.test(lg.tt)&&lg.out&&lg.out.targets===lg.e.targets,{tt:lg.tt.slice(0,300),out:lg.out});
    ok('PR-1 6c after the close the targets stay with their baselines; this period\'s figures and decisions are cleared for the next review',lg.tg.length===3&&lg.tg[0].base==='8'&&lg.tg[0].cur===''&&lg.tg[0].decision===''&&lg.tg[1].note==='',lg.tg);
    const saved2=await save();const sj2=JSON.parse(saved2);
    const bad=await p.evaluate(s=>{const x=fromFile(s);return x.log.slice(-1)[0].targets;},sj2);
    ok('PR-1 6d the log line is read back from a saved file',bad===lg.e.targets,bad);
    /* refill from the case for the next review */
    await p.evaluate(G=>window.__nbhFactsIn(G),G);
    const t3=await p.evaluate(()=>S.tg.map(r=>r.cur+'/'+r.decision).join('|'));
    ok('PR-1 6e the next review fills the current means and decisions again from the case',t3==='2/fade|4.5/modify|3/continue',t3);
    /* without plan.targets: f.behaviors names the rows */
    await p.evaluate(()=>{S=blank();renderAll();});
    const t4=await p.evaluate(G=>{delete G.plan;window.__nbhFactsIn(G);return S.tg.map(r=>r.name).join('|');},JSON.parse(JSON.stringify(G)));
    ok('PR-1 7a without TD-1\'s targets the rows come from TB-1\'s behaviors',t4==='Hitting|Screaming|Calling out',t4);
    const pdf=await p.pdf({format:'Letter'});fs.writeFileSync(path.join(OUT,'PR-1_print.pdf'),pdf);
    ok('PR-1 7b the print renders',pdf.length>20000,pdf.length);
    await p.close();}
  const errs=log.filter(x=>x.type==='pageerror');
  ok('no page errors',errs.length===0,errs);
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
