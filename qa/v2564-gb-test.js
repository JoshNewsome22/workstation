/* v25.64 Form GB-1, the changes the BCBA approved from the review of the forms against the JABA research (PLAN H8, H9,
   M5, M9, L1, L2, L3). What is checked, with a simulated student:
   H8 a new reduction objective ticks "Counts only when" (final schedule, usual staff, every setting) once something is
      written in it, and the sentence says so; unticked boxes stay unticked through Save data and Open data; Apply to
      empty fields names the copied target "TD-1 thinning step" and asks whether it is also the annual goal; with no box
      ticked a Check line names it (Rooker et al., 2013); the Setup table names it a thinning step; the Guide no longer
      says the plan's thinning rule is the goal.
   H9 a paired acquisition objective shows Produces, Under and Easier than the behavior (not an unpaired one); Produces
      is filled from the case's function for the paired behavior; a different reinforcer is refused; Easier unticked is
      noted; Under joins the condition; the criterion's example asks for "before any problem behavior"; a generalization
      objective of the replacement says the replacement is honored in the probe settings; the goal sheet prints Produces.
   M5 "The goal is a lower rate, not zero" adds "while ... stays available when needed"; a target of 0 and a behavior
      that can injure get Check lines; the decision aid cites Deitz and Repp (1973).
   M9 the standard (the BCBA, 11/2): 100% independent across 3 consecutive teaching sessions; A4 holds a new objective at
      90% or 9 of 10 trials to it and cites Richling et al. (2019), and no longer cites "Wong et al., 2022"; an objective
      saved before v25.64 at 90% keeps it and is told the standard; a new objective's criterion is applied to each target
      (each target independent on every trial of it in 2 consecutive sessions in which it was presented; Wong & Fienup,
      2022), printed on the sheet; a listener program needs a mixed-array check (Cordeiro et al., 2022); 1 session is
      below the standard; the Guide states the standard and the reference list carries the studies; the bank's note and
      its load no longer asks to raise an entry (the bank's criteria are written to 100%; interval criteria keep their level).
   L1 a reduction objective has the people, settings and materials and a maintenance check (filled for a new one), in
      the sentence, with the A7 note.
   L2 "Target is N% below the current level" and a typical peer level beside the target.
   L3 the bank loads an entry's people/settings and maintenance check; a 1-session entry is checked; "Replacements only"
      lists the entries marked as replacements.
   Plus: a file saved before v25.64 opens and prints as it did (no new phrase, line or check); no page errors.
   Simulated data only.  usage: node qa/v2564-gb-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const F=L.forms().find(x=>x.id==='GB-1');
const URL0=L.BASE+'/NBH-Workstation/'+encodeURI(F.file);
const OLD=path.join(__dirname,'data','sim','mateo','gb1-save.json');
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const open=async file=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(URL0);await sleep(1300);
    if(file){await p.setInputFiles('#fileIn',{name:'saved.json',mimeType:'application/json',buffer:fs.readFileSync(file)});await sleep(1500);}
    await p.evaluate(()=>{window.set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e.type==='checkbox')e.checked=v;else e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));};
      window.V=n=>{const e=document.querySelector('[name="'+n+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;};
      window.OUT=k=>(document.querySelector('[data-out="'+k+'"]')||{}).textContent||'';
      window.CHK=k=>[...document.querySelectorAll('[data-out="'+k+'"] .gb-chk')].map(e=>e.className.replace('gb-chk ','')+' '+e.textContent);});
    return p;};
  const save=async p=>{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:20000}),p.evaluate(()=>document.getElementById('saveBtn').click())]);
    const f=path.join(os.tmpdir(),'v2564-gb-'+Date.now()+'.json');await dl.saveAs(f);return f;};
  const p=await open(null);

  /* H8 and L1, L2: a new reduction objective */
  const A=await p.evaluate(()=>{const o={blank:[V('red[0].cwFinal'),V('red[0].v64'),V('red[0].maint')]};
    set('m.client','Sample Student (simulated)');set('red[0].beh','Calling out: speaking without being called on (simulated)');
    o.cw=[V('red[0].cwFinal'),V('red[0].cwStaff'),V('red[0].cwSet')];o.v64=V('red[0].v64');o.maint=V('red[0].maint');
    set('red[0].dir','decrease');set('red[0].meas','rate per hour');set('red[0].cur','12 per hour');set('red[0].ml','more');set('red[0].tgt','3 per hour');
    set('red[0].ctx','Room 12 during whole-group instruction');set('red[0].crit','5');set('red[0].meth','a frequency count on Form DD-1');set('red[0].peer','2 per hour');
    o.s1=OUT('red0');o.c1=CHK('red0');
    set('red[0].gen','two adults; the classroom and the library');o.c2=CHK('red0');o.s2=OUT('red0');
    set('red[0].cwFinal',false);set('red[0].cwStaff',false);set('red[0].cwSet',false);o.s3=OUT('red0');
    return o;});
  ok('H8 a new reduction objective is blank until written in, then ticks the three "Counts only when" boxes; the sentence says it counts only at the final schedule, with the usual staff, in every setting',
    !A.blank[0]&&!A.blank[1]&&!A.blank[2]&&A.cw.every(Boolean)&&A.v64==='1'&&
    /counted only once the plan runs at its final reinforcement schedule \(TD-1’s last thinning level\), with the staff who usually run it \(not only the BCBA\) and in every setting named, as measured by/.test(A.s1)&&
    !/counted only/.test(A.s3),A);
  ok('L1 the reduction objective has the people, settings and materials and a maintenance check (filled for a new one) in its sentence (no semicolon), and the A7 note until both are given',
    /a probe 2 and 4 weeks after the final schedule is reached, then at each progress report/.test(A.maint)&&/as measured by a frequency count on Form DD-1, with a maintenance check: a probe 2 and 4 weeks after the final schedule/.test(A.s1)&&
    A.c1.some(x=>/^gb-note . A7: add the people, settings and materials the reduction must hold across/.test(x))&&/, with two adults; the classroom and the library, counted only/.test(A.s2)&&A.c2.some(x=>/^gb-ok . A7/.test(x)),A);
  ok('L2 the sentence gives the typical peer level beside the target, and the line under it how far the target lies below the current level',
    /to no more than 3 per hour \(typical peer level: 2 per hour\) in Room 12/.test(A.s1)&&/Target is 75% below the current level\./.test(A.s1),A.s1);
  /* H8: unticked stays unticked through Save data and Open data */
  const f1=await save(p);const p1=await open(f1);
  const A2=await p1.evaluate(()=>({cw:[V('red[0].cwFinal'),V('red[0].cwStaff'),V('red[0].cwSet')],v64:V('red[0].v64'),s:OUT('red0')}));
  ok('H8 boxes unticked before saving stay unticked after Open data, and the objective keeps its mark',A2.cw.every(x=>x===false)&&A2.v64==='1'&&!/counted only/.test(A2.s)&&/maintenance check/.test(A2.s),A2);
  await p1.close();

  /* H8: Apply to empty fields, TD-1's thinning step */
  const p2=await open(null);
  const B=await p2.evaluate(async()=>{window.postMessage({nbh:'plan',from:'the test',fields:{'m.beh':'Aggression toward staff (simulated)','m.rate':'1.4','mon.crit':'0.2','mon.n':'3','m.repdesc':'hand the break card to an adult (simulated)','mon.ind':'90'}},'*');
    await new Promise(r=>setTimeout(r,300));document.getElementById('applyPlan').click();await new Promise(r=>setTimeout(r,300));
    const step=()=>{const n=document.querySelector('#redWrap .card .gb64-step');return n?n.textContent:'';};
    const o={tgt:V('red[0].tgt'),step:V('red[0].tdstep'),hint:step(),cw:V('red[0].cwFinal'),label:document.querySelector('#planTable tbody tr:nth-child(4) td').textContent};
    o.c0=CHK('red0');set('red[0].cwFinal',false);set('red[0].cwStaff',false);set('red[0].cwSet',false);o.c1=CHK('red0');
    set('red[0].tgt','0 per minute');o.hint2=step();o.c2=CHK('red0');
    o.guide=document.querySelector('[data-pane="guide"]').textContent;return o;});
  ok('H8 Apply to empty fields copies TD-1\'s criterion as the target, named "TD-1 thinning step" with the question whether it is also the annual goal; the Setup table names it a thinning step',
    B.tgt==='0.2 per minute'&&B.step==='0.2 per minute'&&/TD-1 thinning step: 0\.2 per minute.*Is this also the annual goal\? If not, write the goal level here\./.test(B.hint)&&B.cw===true&&/thinning step/.test(B.label)&&/the level written here is the annual goal/.test(B.hint2),B);
  ok('H8 a Check line shows when the target is TD-1\'s thinning step and no "Counts only when" box is ticked, citing Rooker et al. (2013); it goes once the target is the annual goal',
    !B.c0.some(x=>/thinning step/.test(x))&&B.c1.some(x=>/Check: the target level is TD-1’s thinning step \(0\.2 per minute\).*11 of 23 applications, Rooker et al\., 2013/.test(x))&&!B.c2.some(x=>/thinning step/.test(x)),B);
  ok('H8 the Guide says the plan\'s criterion is a thinning step and the annual goal is judged under the final plan',
    !/this form reads them from there rather than inviting a second/.test(B.guide)&&/The annual goal is judged under the final plan/.test(B.guide)&&/11 of 23 \(Rooker et al\., 2013\)/.test(B.guide),B.guide.slice(0,200));
  /* M5 */
  const M=await p2.evaluate(()=>{const o={};set('red[0].lower',true);o.c1=CHK('red0');
    set('red[0].beh','Calling out (simulated)');set('red[0].tgt','0.05 per minute');o.s=OUT('red0');o.c2=CHK('red0');
    o.aid=(document.querySelector('#redWrap .card .gb64-lower .gb64-hint')||{}).textContent||'';return o;});
  ok('M5 "The goal is a lower rate, not zero" adds that the behavior stays available; a target of 0 and a behavior that can injure get Check lines; the decision aid gives the evidence',
    M.c1.some(x=>/lower rate, not zero” is ticked, and the target level is 0/.test(x))&&M.c1.some(x=>/behavior that can injure \(aggression toward staff\) is reduced toward zero/.test(x))&&
    /, while calling out stays available when needed, over 3 consecutive measurements/.test(M.s)&&!M.c2.some(x=>/lower rate/.test(x))&&/Deitz & Repp, 1973/.test(M.aid)&&/Never for behavior that can injure/.test(M.aid),M);
  await p2.close();

  /* H9 and M9: a paired acquisition objective, with the case's function */
  const p3=await open(null);await p3.evaluate(()=>document.querySelector('#viewSeg button[data-view="acq"]').click());
  const C=await p3.evaluate(async()=>{const o={};
    set('m.client','Sample Student (simulated)');set('red[0].beh','Aggression (simulated)');
    const card=document.querySelector('#acqWrap .card'),vis=n=>{const e=document.querySelector('[name="'+n+'"]');return !!(e&&e.getClientRects().length);};
    set('acq[0].beh','ask for a break with the break card');o.visBefore=vis('acq[0].prod');o.apply=V('acq[0].apply');
    set('acq[0].pair','R1');o.visAfter=[vis('acq[0].prod'),vis('acq[0].under'),vis('acq[0].ez1')];o.ph=document.querySelector('[name="acq[0].crit"]').placeholder;
    window.__nbhFactsIn({fn:{key:'escape',label:'Escape from demands'},behaviors:[{label:'Aggression (simulated)',fnKey:'escape'}]});await new Promise(r=>setTimeout(r,200));
    o.prod=V('acq[0].prod');
    set('acq[0].cond','an instructional demand and the break card within reach');set('acq[0].under','work is presented');
    set('acq[0].crit','independently in at least 90% of opportunities');set('acq[0].n','3');set('acq[0].unit','sessions');set('acq[0].meth','trial-by-trial data on Form SA-1');
    o.s=OUT('acq0');o.c1=CHK('acq0');
    set('acq[0].prod','attention from an adult or a peer');o.c2=CHK('acq0');set('acq[0].prod','a break from the task');
    ['ez1','ez2','ez3'].forEach(k=>set('acq[0].'+k,true));o.c3=CHK('acq0');
    document.getElementById('buildSheet').click();o.sheet=document.getElementById('sheetOut').textContent;
    document.getElementById('addGen').click();await new Promise(r=>setTimeout(r,200));
    const gi=Math.max(...[...document.querySelectorAll('#acqWrap .card')].map(c=>+c.querySelector('[data-out]').dataset.out.replace('acq','')));
    set('acq['+gi+'].meth','generalization probes on Form DD-1');o.gen=OUT('acq'+gi);
    return o;});
  ok('H9 Produces, Under and Easier than the behavior show only once the objective is paired; the criterion\'s example then asks for the skill before any problem behavior',
    !C.visBefore&&C.visAfter.every(Boolean)&&/before any problem behavior/.test(C.ph),C);
  ok('H9 Produces is filled from the case\'s function for the paired behavior (escape: a break from the task), and Under joins the condition',
    C.prod==='a break from the task'&&/given an instructional demand and the break card within reach, when work is presented, Sample Student/.test(C.s),{prod:C.prod,s:C.s.slice(0,300)});
  ok('H9 a replacement that gets a different reinforcer is refused; Easier than the behavior unticked is noted, and passes once ticked (Horner & Day, 1991; Day et al., 1994)',
    C.c1.some(x=>/^gb-ok . Replacement: it gets a break from the task, the reinforcer of the behavior it replaces \(escape from demands\)/.test(x))&&C.c1.some(x=>/^gb-note . Replacement: nothing is ticked under Easier than the behavior.*Horner & Day, 1991/.test(x))&&
    C.c2.some(x=>/^gb-no . Replacement: it gets attention from an adult or a peer, and the behavior it replaces \(R1\) is maintained by escape from demands: a replacement that gets a different reinforcer will not compete with the behavior \(Day et al\., 1994\)/.test(x))&&
    C.c3.some(x=>/^gb-ok . Replacement: easier than the behavior/.test(x)),C);
  ok('H9 the goal sheet prints what the replacement produces; a generalization objective of the replacement says it is honored in the probe settings',
    /Produces: a break from the task, when work is presented\./.test(C.sheet)&&/as measured by generalization probes on Form DD-1; in the probe settings the replacement is honored each time it is used/.test(C.gen),{sheet:C.sheet.slice(0,600),gen:C.gen.slice(0,400)});
  ok('M9 a new acquisition objective\'s criterion is applied to each target, each target independent on every trial of it in 2 consecutive sessions (Wong & Fienup, 2022), on the card and the goal sheet',
    C.apply==='each target'&&/Criterion applied to each target: .*independent on every trial of it in 2 consecutive sessions in which it was presented.*\(Wong & Fienup, 2022\)/.test(C.s)&&/Criterion applied to each target/.test(C.sheet),{apply:C.apply,s:C.s.slice(0,600)});
  const D=await p3.evaluate(()=>{const o={};const pre='acq[0].';
    set(pre+'crit','independently in at least 80% of opportunities');o.c80=CHK('acq0');
    set(pre+'crit','correctly in at least 9 of 10 trials');o.c9=CHK('acq0');
    set(pre+'crit','correctly in 10 of 10 trials');o.c10=CHK('acq0');
    set(pre+'crit','independently in at least 90% of opportunities');o.c90=CHK('acq0');
    set(pre+'crit','independently in 100% of opportunities');o.c100=CHK('acq0');
    set(pre+'n','1');o.c1=CHK('acq0');set(pre+'n','3');
    set(pre+'beh','touch the picture an adult names');o.cL=CHK('acq0');
    o.html=document.documentElement.outerHTML;o.guide=document.querySelector('[data-pane="guide"]').textContent;o.refs=document.getElementById('gbRefs').textContent;return o;});
  ok('M9 A4 holds a new objective to the standard, 100% across 3 consecutive teaching sessions, citing Richling et al. (2019) (best maintenance in 11 of 12, about one extra session): 80%, 90% and 9 of 10 trials are noted, 100% and 10 of 10 pass, 1 session is noted; "Wong et al., 2022" is gone',
    D.c80.some(x=>/^gb-note . A4: mastery level 80%: the workstation’s standard is 100% independent across 3 consecutive teaching sessions, with 2 instructors for the whole set.*Richling et al\. \(2019\), 100% across 3 sessions gave the best maintenance in 11 of 12 evaluations, at about one extra session/.test(x))&&
    D.c90.some(x=>/^gb-note . A4: mastery level 90%: the workstation’s standard is 100%/.test(x))&&D.c9.some(x=>/^gb-note . A4: mastery level 9 of 10 \(90%\): the workstation’s standard is 100%/.test(x))&&
    D.c10.some(x=>/^gb-ok . A4: mastery level 10 of 10 \(100%\)/.test(x))&&D.c100.some(x=>/^gb-ok . A4: mastery level 100%/.test(x))&&
    D.c1.some(x=>/^gb-note . A4: across 1 session: below the workstation’s standard of 3 consecutive sessions/.test(x))&&!/Wong et al\., 2022/.test(D.html),{c80:D.c80,c90:D.c90,c9:D.c9,c10:D.c10,c1:D.c1});
  ok('M9 a listener program applied to each target needs a mixed-array check (Cordeiro et al., 2022); the Guide states the standard; the reference list carries the studies',
    D.cL.some(x=>/^gb-note . Each target: in a listener \(match-to-sample\) program, a target also needs a mixed-array check.*one-cue responding.*Cordeiro et al\., 2022/.test(x))&&/5\. The Mastery Standard/i.test(D.guide)&&/is 100%\s+independent across 3 consecutive teaching sessions, with 2 instructors for the whole set/.test(D.guide)&&
    ['Richling, S. M.','Wong, K. K., & Fienup, D. M. (2022)','Cordeiro, M. C.','Rooker, G. W.','Horner, R. H., & Day, H. M. (1991)','Deitz, S. M., & Repp, A. C. (1973)','Walker, H. M., & Hops, H. (1976)','Stokes, T. F., & Baer, D. M. (1977)'].every(r=>D.refs.includes(r)),{cL:D.cL});
  await p3.close();

  /* L3: the bank */
  const p4=await open(null);
  const E=await p4.evaluate(async()=>{const R=document.getElementById('gbBankHost').shadowRoot,B=GB1_BANK.entries,o={};
    const withGen=B.find(e=>e.gen&&e.maint&&!e.see&&e.n==='3'&&/ 100% /.test(' '+e.crit+' '));   /* v25.64 the bank's criteria raised to 100% (the BCBA, 11/2) */o.id=withGen&&withGen.id;
    R.querySelector('details').open=true;R.querySelector('.it[data-id="'+withGen.id+'"]')||(R.querySelector('.q').value=withGen.lab,R.querySelector('.q').dispatchEvent(new Event('input')));
    window.__gbBank.show(withGen.id);R.querySelector('.ld[data-i="0"]').click();o.st0=R.querySelector('.st').textContent;o.gen=V('acq[0].gen');o.maint=V('acq[0].maint');o.s=OUT('acq0');
    window.__gbBank.show('fi-negation');o.det=(R.querySelector('.chk1')||{}).textContent||'';R.querySelector('.add').click();await new Promise(r=>setTimeout(r,200));
    o.st=R.querySelector('.st').textContent;const last=Math.max(...[...document.querySelectorAll('#acqWrap .card')].map(c=>+c.querySelector('[data-out]').dataset.out.replace('acq','')));o.c1=CHK('acq'+last);
    const rep=window.__gbBank.search('','','',true);o.rep=rep.length;o.repOk=rep.every(id=>{const e=window.__gbBank.entry(id);return e.rep===true&&e.fn.length>0;});o.withFn=B.filter(e=>e.fn.length).length;
    R.querySelector('.rpx').checked=true;R.querySelector('.rpx').dispatchEvent(new Event('change'));o.listed=R.querySelectorAll('.it').length;R.querySelector('.rpx').checked=false;R.querySelector('.rpx').dispatchEvent(new Event('change'));o.all=R.querySelectorAll('.it').length;
    o.n=B.length;o.note=GB1_BANK.note;return o;});
  ok('L3 an entry whose studies tested carryover loads its people/settings and maintenance check, which the sentence carries',
    !!E.id&&E.gen==='two adults and two settings beyond where it was taught'&&/a probe 2 and 4 weeks after mastery/.test(E.maint)&&/, with two adults and two settings beyond where it was taught, as measured by/.test(E.s),E);
  ok('L3 a 1-session entry is checked against the 3-session standard in the bank and after the load',
    /asks for 1 session, below the workstation’s standard of 3 consecutive sessions/.test(E.det)&&/asks for 1 session/.test(E.st)&&E.c1.some(x=>/A4: across 1 session/.test(x)),E);
  ok('L3 "Replacements only" lists the entries marked as replacements (each with the function it replaced), and unticked the whole bank again; the bank\'s note states the standard',
    E.rep===E.withFn&&E.rep>0&&E.repOk&&E.listed===E.rep&&E.all===E.n&&/The workstation’s standard is now 100% independent across 3 consecutive teaching sessions/.test(E.note)&&!/is below the workstation’s standard/.test(E.st0)   /* v25.64 the entry is written to 100% now: no note at load */,{rep:E.rep,withFn:E.withFn,listed:E.listed,all:E.all,n:E.n});
  await p4.close();

  /* a file saved before v25.64 */
  const p5=await open(OLD);
  const O=await p5.evaluate(()=>{const o={};o.v64=[...document.querySelectorAll('[name$=".v64"]')].map(e=>e.value).join('');
    o.cw=[...document.querySelectorAll('[name$=".cwFinal"]')].some(e=>e.checked);o.apply=[...document.querySelectorAll('[name$=".apply"]')].map(e=>e.value).join('');
    o.outs=[...document.querySelectorAll('[data-out]')].map(e=>e.textContent).join(' | ');o.a4=[...document.querySelectorAll('[data-out^="acq"] .gb-chk')].map(e=>e.className.replace('gb-chk ','')+' '+e.textContent).filter(x=>/A4/.test(x));document.getElementById('buildSheet').click();o.sheet=document.getElementById('sheetOut').textContent;return o;});
  ok('a file saved before v25.64 opens as saved: no box ticked, no default, no new phrase, line or check on the cards or the goal sheet',
    !O.v64&&!O.cw&&!O.apply&&![O.outs,O.sheet].some(t=>/counted only|stays available|Target is \d|Criterion applied|Replacement:|Produces:|typical peer level/.test(t)),{v64:O.v64,cw:O.cw,apply:O.apply,outs:O.outs.slice(0,500)});
  ok('M9 an objective saved before v25.64 keeps the 90% it saved: A4 passes it and tells the standard now',
    O.a4.length>0&&O.a4.every(x=>/^gb-ok . A4: mastery level 90%.*the standard when this objective was written; the workstation’s standard is now 100% across 3 consecutive sessions/.test(x)),O.a4);
  await p5.close();
  ok('no page errors',!errs.length,errs.slice(0,5));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
