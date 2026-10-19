/* Form SI-1, review Wave 3: other students named are shown as "a classmate" on the summary, the FS-1 line and the case, and words
   that look like names are pointed out (F60); "Preferred" only once the leader has met every other component (F61); the assent status
   from the start of each session, with the counts beside it, and FS-1 printing them (F62); the plan's components in, and the student's
   goal and reward out (F63); the assent plan out, consent and age in (F64); teasing and tiredness not counted (F67); what the student
   marked written as marked (F68); the review notice names the rule that fired (F69). Simulated data only.
   usage: node qa/si1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1200,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('SI-1_'));await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.print=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const setIv=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-ivt="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[k,v]);
  const tick=(k,on)=>p.evaluate(([k,on])=>{const e=document.querySelector('[data-c="'+k+'"]');e.checked=on;e.dispatchEvent(new Event('change',{bubbles:true}));},[k,on]);
  const txt=id=>p.evaluate(id=>document.getElementById(id).textContent.replace(/\s+/g,' '),id);
  const facts=()=>p.evaluate(()=>(window.__nbhFactsOut()||{}).student||null);
  const clear=async()=>{await p.evaluate(()=>document.getElementById('clearBtn').click());await sleep(250);};
  /* ---- F60 ---- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const s1=await p.evaluate(()=>({others:document.querySelector('[data-m="others"]').value,hyp:document.getElementById('hypOut').textContent,sum:document.getElementById('sumOut').textContent,
    facts:JSON.stringify(window.__nbhFactsOut()),said:document.querySelector('[data-ivt="rather"]').value,names:document.getElementById('hypNames').textContent}));
  ok('1 F60 the worked example lists its classmate once: the line, the summary and the case say "a classmate", and the answer stays as said',
    s1.others==='Jaden'&&!/Jaden/.test(s1.hyp+s1.sum+s1.facts)&&/Not be in the same group as a classmate\./.test(s1.hyp)&&/Jaden/.test(s1.said)&&s1.names==='',{s1:{...s1,sum:s1.sum.slice(0,200)}});
  await setM('others','');await sleep(350);
  const s2=await p.evaluate(()=>({names:document.getElementById('hypNames').textContent,sumN:document.getElementById('sumNames').textContent,sum:document.getElementById('sumOut').textContent}));
  await p.evaluate(()=>document.querySelector('#hypNames [data-sinames="replace"]').click());await sleep(200);
  const s3=await p.evaluate(()=>({others:document.querySelector('[data-m="others"]').value,names:document.getElementById('hypNames').textContent,sum:document.getElementById('sumOut').textContent}));
  ok('2 F60 an unlisted name in the answers is pointed out on the Interview and Summary pages (titles such as Ms. and Mr. are not), and one tap lists it',
    /look like names: Jaden\./.test(s2.names)&&/look like names: Jaden\./.test(s2.sumN)&&/Jaden/.test(s2.sum)&&s3.others==='Jaden'&&s3.names===''&&!/Jaden/.test(s3.sum),{s2:s2.names,s3:{...s3,sum:''}});
  await setM('others','');await setIv('rather','Jaden is mean to me. Not with Jaden.');await sleep(300);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('sumPrintBtn').click();});await sleep(300);
  const s4=await p.evaluate(()=>({others:S.meta.others,hyp:document.getElementById('hypOut').textContent}));
  await setM('others','');await sleep(200);
  await p.evaluate(()=>{nbhUI.confirm=async()=>false;document.getElementById('sumPrintBtn').click();});await sleep(300);
  const s5=await p.evaluate(()=>({kept:S.meta.names_kept,names:document.getElementById('hypNames').textContent,sum:document.getElementById('sumOut').textContent}));
  ok('3 F60 Print the summary page asks once: "a classmate" (capitalized at a sentence start), or kept as written and not asked again',
    s4.others==='Jaden'&&/Would rather: “A classmate is mean to me\. Not with a classmate\.”/.test(s4.hyp)&&s5.kept==='Jaden'&&s5.names===''&&/Jaden is mean/.test(s5.sum),{s4,s5:{...s5,sum:''}});
  await p.evaluate(()=>{S.meta.names_kept='';nbhUI.confirm=async()=>true;});
  const pageTxt=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('4 F60 the note under "Before the first question", the Summary page, the Guide and the reference say why',
    /Other students\. Students often name other students\. Write the answer as the student said it, and list each name once/.test(pageTxt)&&/a parent may see only what is about their own child \(FERPA, 34 CFR 99\.12\(a\)\)/.test(pageTxt)&&
    /The family reads this page, so other students the student names are shown as “a classmate”/.test(pageTxt)&&/a parent may inspect only the information about their own child/.test(pageTxt)&&/Family Educational Rights and Privacy, 34 C\.F\.R\. § 99\.12 \(2024\)/.test(pageTxt),'text');
  /* ---- F62 and F64 on the worked example ---- */
  await setM('others','Jaden');await sleep(300);
  const sim=await facts();
  ok('5 F62 F64 the worked example: partial (one session declined at the start) with the counts; the assent plan goes to the case; quotes inside an answer keep their partners',
    sim.assent==='partial'&&sim.assentNote==='given at the start of 11 of 12 logged sessions; declined at the start of 1 session; withdrawn during 2 sessions'&&sim.assentPlan&&/^At the start of each session/.test(sim.assentPlan.ask)&&
    sim.assentPlan.log&&sim.assentPlan.log.sessions===12&&sim.assentPlan.log.declined===1&&/^pause, offer a choice/.test(sim.assentPlan.steps)&&/or "I want to go back"; Stands up/.test(sim.stop.signs)&&/^Get through math class/.test(sim.goal)&&/^Drawing time/.test(sim.reward)&&/^Ms\. Ortiz/.test(sim.helpers),sim);
  /* ---- F67, F68 ---- */
  await clear();
  const lists=await p.evaluate(()=>[...document.querySelectorAll('#befList label')].map(l=>l.textContent));
  ok('6 F67 teasing is not counted (what happens after decides); the old noise line is split: loud, crowded or bright is escape, tired or hungry a setting event',
    lists.includes('A classmate bothers me or teases menot counted: what happens after decides')&&lists.includes('It is loud, crowded or brightescape')&&lists.includes('I am tired, hungry or not feeling wellsetting event: not counted'),lists);
  await tick('b_peer',true);await tick('b_tired',true);await sleep(150);
  const h0=await txt('hypOut');
  ok('7 F67 a classmate teasing and being tired add nothing to the function counts',/Nothing the student marked carries a function tag\./.test(h0)&&/the student marked: a classmate bothering or teasing; tired, hungry or not feeling well\./.test(h0),h0);
  await setM('beh','when I get loud');await tick('b_hard',true);await tick('a_out',true);await sleep(200);
  const h1=await txt('hypOut');
  await p.evaluate(()=>document.querySelector('#verSeg [data-ver="young"]').click());await sleep(200);
  const h2=await txt('hypOut');
  await p.evaluate(()=>document.querySelector('#verSeg [data-ver="read"]').click());
  for(const k of ['b_hard','b_peer','b_tired','a_out'])await tick(k,false);await setIv('before','My worksheet is too long.');await sleep(200);
  const h3=await txt('hypOut');
  ok('8 F68 marked lines are written as marked, in the version the student saw; the student\'s word for the behavior and typed answers are quoted',
    /before “when I get loud”, the student marked: work too hard, too long or boring; a classmate bothering or teasing; tired, hungry or not feeling well\. Afterwards, the student marked: gets out of the work, or it gets shorter or easier\. What the student names points to escape \(escape 2\)\./.test(h1)&&!/I am given work/.test(h1)&&
    /the student marked: work hard or boring; someone bothering; tired or hungry\. Afterwards, the student marked: does not have to do the work\./.test(h2)&&/before “when I get loud”, the student said: “My worksheet is too long\.”/.test(h3),{h1,h2,h3});
  /* ---- F69 ---- */
  const verdict=rows=>p.evaluate(rows=>{S.al=rows.map((w,i)=>({date:'9/'+(i+1),sess:'Session '+(i+1),got:w==='N'?'N':'Y',wmin:w==='W'?'5':'',changed:'',note:''}));renderAll();return document.getElementById('assentVerdict').textContent;},rows);
  const v1=await verdict([...'YYYYYYYYYYYYYYYYYWWW']),v2=await verdict([...'WYWYWYWYWYWYWYWYYYYY']),v3=await verdict([...'YYYYYWYWYWYWYWYWYWWW']);
  ok('9 F69 the notice names the rule that fired: three in a row alone, the share alone, or both',
    /^3 withdrawals in a row \(the last 3 sessions logged\)\. Review the procedure/.test(v1)&&!/above the/.test(v1)&&/^Withdrawal in 40% of sessions \(8 of 20\), above the 25% working convention\. Review/.test(v2)&&!/in a row/.test(v2)&&
    /^Withdrawal in 45% of sessions \(9 of 20\), above the 25% working convention, and 3 withdrawals in a row \(the last 3 sessions logged\)\./.test(v3),{v1,v2,v3});
  /* ---- F62 ---- */
  const st=rows=>p.evaluate(rows=>{S.al=rows.map((g,i)=>({date:'10/'+(i+1),sess:'Session '+(i+1),got:g==='W'?'Y':g==='-'?'':g,wmin:g==='W'?'6':'',changed:'',note:''}));renderAll();
    const f=(window.__nbhFactsOut()||{}).student||{};return {st:f.assent,nt:f.assentNote,sum:(document.getElementById('sumOut').textContent.match(/Assent overall:[^.]*\./)||[''])[0]};},rows);
  const a1=await st(['Y','W','Y']),a2=await st(['Y','W','Y','-']),a3=await st(['Y','N','Y']),a4=await st(['N','N']);
  ok('10 F62 one honored withdrawal leaves assent given, a blank cell is "not recorded", a decline at the start is partial, none given is refused',
    a1.st==='given'&&a1.nt==='given at the start of all 3 logged sessions; withdrawn during 1 session'&&a1.sum==='Assent overall: given (read from the log): given at the start of all 3 logged sessions; withdrawn during 1 session.'&&
    a2.st==='given'&&a2.nt==='given at the start of 3 of 4 logged sessions; withdrawn during 1 session; not recorded for 1 session'&&a3.st==='partial'&&a4.st==='refused'&&a4.nt==='declined at the start of all 2 logged sessions',{a1,a2,a3,a4});
  const hint=await p.evaluate(()=>document.querySelector('[data-m="a_status"]').parentElement.textContent);
  ok('11 F62 the hint under "Assent overall" says what the code does',/a withdrawal during a session is reported beside it\), refused when none had it, partial when some were declined at the start\. A blank cell counts as not recorded\./.test(hint),hint);
  /* ---- F61 ---- */
  const pref=pr=>p.evaluate(pr=>{S.pc=[{name:'Break card',words:'',rank:'2',say:''},{name:'Short worksheet',words:'',rank:'1',say:''},{name:'Token board',words:'',rank:'3',say:''}];
    S.pr=pr.map(x=>({date:'10/1',a:x[0],b:x[1],chose:x[2],note:''}));renderAll();const f=(window.__nbhFactsOut()||{}).student||{};
    return {v:document.querySelector('#prefOut .verdict').textContent,gaps:document.querySelectorAll('#pairTbl td.gap').length,cell:(document.querySelector('#pairTbl tbody tr:first-child td:nth-of-type(3)')||{}).textContent,
      res:(document.getElementById('sumOut').textContent.match(/Result:[^\n]*?(offers\.|yet\.)/)||[''])[0],pref:f.preference||''};},pr);
  const P1=await pref([['0','2','A'],['0','2','A'],['0','2','A'],['1','2','A'],['1','2','A'],['1','2','A']]);
  const P2=await pref([['0','2','A'],['0','2','A'],['0','2','A'],['1','2','A'],['1','2','A'],['1','2','A'],['0','1','A']]);
  const P3=await pref([['0','2','A'],['0','2','A'],['0','2','A'],['1','2','A'],['1','2','A'],['1','2','A'],['0','1','A'],['1','0','B']]);
  ok('12 F61 a leader never offered against the other leader is not called preferred; the pair table shows the gap; once met, it is',
    /^Break card leads, chosen 3 of 3 times offered \(100%\), but has not yet been offered against Short worksheet\. Offer that pair next, on each side, before calling it preferred\.$/.test(P1.v)&&P1.gaps===2&&P1.cell==='3 of 3'&&/Break card leads \(3 of 3 offers\) but has not yet been offered against Short worksheet, so no preference is called yet\./.test(P1.res)&&!/^Chose/.test(P1.pref)&&
    /^Preferred: Break card, chosen 4 of 4 times offered \(100%\).*It was always shown on the same side; offer it on the other side too\.$/.test(P2.v)&&P2.gaps===0&&/^Preferred: Break card, chosen 5 of 5.*/.test(P3.v)&&!/same side/.test(P3.v)&&/^Chose Break card most \(5 of 5 offers\)$/.test(P3.pref),{P1,P2,P3});
  /* ---- F63, F64 in ---- */
  await clear();
  const dob=(()=>{const d=new Date();d.setFullYear(d.getFullYear()-11);d.setDate(d.getDate()-20);return d.toISOString().slice(0,10);})();
  const r1=await p.evaluate(dob=>{const r=window.__nbhFactsIn({plan:{rep:'Hands the break card to the adult',teach:['Functional communication training (FCT)'],antCards:['Choice of task order'],sched:['Fixed-ratio schedule (FR 3)'],src:'TD-1'},consent:{src:'IC-1',on:true,v:2,date:'2026-09-01',state:'Given'},profile:{dob}});
    return {r,pc:S.pc.map(x=>x.name),opts:document.querySelectorAll('#prTbl tbody tr:first-child select[data-f="a"] option').length,paware:document.querySelector('[data-m="paware"]').value,age:document.querySelector('[data-m="age"]').value,beh:S.meta.beh||''};},dob);
  const r2=await p.evaluate(()=>{S.meta.paware='No, interview deferred';S.meta.age='10';const r=window.__nbhFactsIn({plan:{rep:'Something else',teach:[],antCards:[],sched:[]},consent:{on:true,v:2},profile:{dob:'2015-01-01'}});return {r,pc:S.pc.map(x=>x.name).join('|'),paware:S.meta.paware,age:S.meta.age};});
  ok('13 F63 F64 from the case into empty parts only: the plan\'s components (replacement first), parent aware from a current consent, the age from the date of birth; the behavior stays the student\'s',
    r1.r.filled===6&&r1.pc.join('|')==='Replacement: Hands the break card to the adult|Functional communication training (FCT)|Choice of task order|Fixed-ratio schedule (FR 3)'&&r1.opts===5&&r1.paware==='Yes'&&r1.age==='11'&&r1.beh===''&&
    r2.r.filled===0&&r2.pc===r1.pc.join('|')&&r2.paware==='No, interview deferred'&&r2.age==='10',{r1,r2});
  const gh=await p.evaluate(()=>document.getElementById('qGoal').textContent+' | '+document.getElementById('qReward').textContent);
  ok('14 F63 the goal and reward hints no longer promise what GB-1 and PA-1 do not do',/Copy it into Form GB-1 beside the plan’s goals; it also goes to the case with the interview\./.test(gh)&&/Test the list on Form PA-1; it also goes to the case with the interview\./.test(gh)&&!/can carry it/.test(gh),gh);
  /* ---- FS-1 prints the counts ---- */
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('FS-1: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/'+file('FS-1_'));await sleep(900);
  const fsr=await q.evaluate(()=>{const o=fsBgCompose({student:{assent:'given',assentNote:'given at the start of all 3 logged sessions; withdrawn during 1 session',date:'2026-10-01',hypothesis:'x'}});const o2=fsBgCompose({student:{assent:'partial',date:'2026-10-01'}});return {a:o.assent,b:o.bgStudent,a2:o2.assent};});
  ok('15 F62 FS-1 prints the counts beside the status, and a status sent without them reads as before',
    /^Assent given \(Form SI-1, [^)]+\); given at the start of all 3 logged sessions; withdrawn during 1 session$/.test(fsr.a)&&/Assent: given \(given at the start of all 3 logged sessions; withdrawn during 1 session\)\./.test(fsr.b)&&/^Partial assent: given for some parts or some sessions \(Form SI-1, [^)]+\)$/.test(fsr.a2),fsr);
  ok('16 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
