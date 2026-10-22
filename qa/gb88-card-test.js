/* v23.88 Form GB-1's acquisition card (PART 2 step 3, screen D, approved by the BCBA). On an iPad (touch), with a simulated
   student's saved file (the five simulated runs of step 2):
   1. an acquisition card has the present level, the people/settings/materials, the maintenance check, and why/who agreed;
      the criterion's example reads 90%;
   2. the sentence carries the generalization, the present level and the maintenance check;
   3. the checks against the standard show under the objective: a non-behavior is refused (A1), a criterion without a
      number is named (A3), a level under 90% gets the note with the evidence (A4), a level of 90% passes, generalization
      and maintenance are asked for until given (A7), the present level (A8);
   4. the goal sheet leaves an empty card out, prints the checks not met and the why line;
   5. a reduction objective reads a short behavior name "(as defined on TB-1)" and the baseline's number, the source apart;
   6. Save data then Open data keeps the new boxes;
   7. the five simulated files open with no page errors.
   usage: node qa/gb88-card-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='GB-1');
const SIM=process.env.WS_SIM||path.join(__dirname,'data','sim');   /* the five simulated students' saved files (PART 2 step 2), simulated data only */
const keys=fs.existsSync(SIM)?fs.readdirSync(SIM).filter(k=>fs.existsSync(path.join(SIM,k,'gb1-save.json'))):[];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1200);
    if(file){await p.setInputFiles('#fileIn',{name:'saved.json',mimeType:'application/json',buffer:fs.readFileSync(file)});await sleep(1800);
      await p.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d&&getComputedStyle(d).display!=='none'){const b=d.querySelector('button');if(b)b.click();}}).catch(()=>{});await sleep(400);}
    await p.evaluate(()=>{window.sheet=v=>{document.querySelector('#viewSeg button[data-view="'+v+'"]').click();};window.set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));};window.V=n=>(document.querySelector('[name="'+n+'"]')||{}).value||'';});
    return p;};
  const mateo=keys.find(k=>/mateo/i.test(k))||keys[0];
  const p=await open(mateo?path.join(SIM,mateo,'gb1-save.json'):null);
  /* 1. the boxes */
  const A=await p.evaluate(()=>{sheet('acq');const cards=[...document.querySelectorAll('#acqWrap .card')];const filled=cards.find(c=>c.querySelector('input[name$=".beh"]').value)||cards[0];const i=/acq\[(\d+)\]/.exec(filled.querySelector('input[name$=".beh"]').name)[1];
    return {i,boxes:['level','gen','maint','why'].map(k=>!!filled.querySelector('input[name="acq['+i+'].'+k+'"]')),ph:filled.querySelector('input[name="acq['+i+'].crit"]').placeholder,cards:cards.length};});
  ok('1 an acquisition card has the present level, the generalization, the maintenance check and the why boxes; the criterion’s example reads 90%',A.boxes.every(Boolean)&&/90%/.test(A.ph),A);
  const i=A.i;
  /* 2. the sentence and 3. the checks */
  const B=await p.evaluate(i=>{const pre='acq['+i+'].';set(pre+'beh','hand the break card to the adult within 5 s of a demand');set(pre+'cond','a task demand in any classroom and the break card within reach');set(pre+'crit','independently in at least 80% of opportunities');set(pre+'n','3');set(pre+'unit','sessions');set(pre+'meth','trial-by-trial data on Form SA-1');
    set(pre+'level','');set(pre+'gen','');set(pre+'maint','');
    const out=()=>document.querySelector('[data-out="acq'+i+'"]');const chk=()=>[...out().querySelectorAll('.gb-chk')].map(e=>e.className.replace('gb-chk ','')+' '+e.textContent.slice(0,70));
    const c1=chk();const s1=out().textContent;
    set(pre+'crit','independently in at least 90% of opportunities');set(pre+'level','says break only when prompted');set(pre+'gen','two adults; the ESE classroom and art');set(pre+'maint','a probe 2 and 4 weeks after mastery');const c2=chk();const s2=out().textContent;
    set(pre+'beh','will not hit when frustrated');const c3=chk();set(pre+'beh','hand the break card to the adult within 5 s of a demand');
    set(pre+'crit','most of the time');const c4=chk();set(pre+'crit','independently in at least 90% of opportunities');
    return {c1,s1:s1.slice(0,400),c2,s2:s2.slice(0,500),c3,c4};},i);
  ok('2 the sentence carries the generalization, the present level and the maintenance check',/, with two adults; the ESE classroom and art, as measured by/.test(B.s2)&&/present level: says break only when prompted/.test(B.s2)&&/maintenance check: a probe 2 and 4 weeks/.test(B.s2)&&!/present level/.test(B.s1),B);
  ok('3 the checks: 80% gets the note with the evidence, generalization and the present level are asked for; 90% with all boxes passes every check; a non-behavior is refused; a criterion without a number is named',
    B.c1.some(x=>/gb-note . A4: mastery level 80%/.test(x))&&B.c1.some(x=>/gb-note . A7/.test(x))&&B.c1.some(x=>/gb-note . A8/.test(x))&&B.c2.every(x=>/^gb-ok/.test(x))&&B.c2.length>=6&&B.c3.some(x=>/gb-no . A1/.test(x))&&B.c4.some(x=>/gb-no . A3: missing a criterion with a number/.test(x)),B);
  /* 4. the sheet */
  const C=await p.evaluate(i=>{set('acq['+i+'].why','replaces hitting (R1); parent agreed (simulated)');set('acq['+i+'].crit','independently in at least 80% of opportunities');
    const before=document.querySelectorAll('#acqWrap .card').length;document.querySelector('#addAcq').click();const after=document.querySelectorAll('#acqWrap .card').length;
    document.querySelector('#buildSheet').click();const sheetEl=document.querySelector('#sheetOut');const li=sheetEl.querySelectorAll('ol.gs li').length;const filledCards=[...document.querySelectorAll('#acqWrap .card, #redWrap .card')].filter(c=>[...c.querySelectorAll('input')].some(e=>/\.(beh|cond|crit|meth|cur|tgt)$/.test(e.name)&&e.value)).length;
    const T=sheetEl.textContent;return {before,after,li,filledCards,why:/Why, and who agreed: replaces hitting/.test(T),note:/A4: mastery level 80%/.test(T),okLines:/✓/.test(T)};},i);
  ok('4 the goal sheet leaves an empty card out, prints the checks not met and the why line, not the ones met',C.after===C.before+1&&C.li===C.filledCards&&C.why&&C.note&&!C.okLines,C);
  /* 5. the reduction objective */
  const D=await p.evaluate(()=>{sheet('red');const cards=[...document.querySelectorAll('#redWrap .card')];if(!cards.length)document.querySelector('#addRed').click();const c=document.querySelector('#redWrap .card');const j=/red\[(\d+)\]/.exec(c.querySelector('input[name$=".beh"]').name)[1];const pre='red['+j+'].';
    set(pre+'beh','Aggression: hitting, kicking or head-butting an adult or peer with enough force to be heard');set(pre+'dir','decrease');set(pre+'meas','rate per minute');set(pre+'cur','0.31 per minute (EA-1 escape condition; DD-1 18.6 per hour)');set(pre+'ml','more');set(pre+'tgt','0.03 per minute');set(pre+'ctx','the ESE classroom');set(pre+'crit','5');set(pre+'meth','a frequency count on DD-1');
    const s=document.querySelector('[data-out="red'+j+'"]').textContent;document.querySelector('#buildSheet').click();const T=document.querySelector('#sheetOut').textContent;
    return {s:s.slice(0,300),short:/of Aggression \(as defined on TB-1\) from 0\.31 per minute to no more than 0\.03 per minute/.test(s),src:/Baseline source: EA-1 escape condition; DD-1 18\.6 per hour/.test(T),ph:c.querySelector('input[name$=".ctx"]').placeholder};});
  ok('5 a reduction objective reads the short behavior name "(as defined on TB-1)" and the baseline’s number, its source apart on the sheet; the context hint asks for the classroom’s name',D.short&&D.src&&/classroom’s name/.test(D.ph),D);
  /* 6. save and open */
  const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>document.querySelector('#saveBtn').click());const d=await dl;const file=path.join(require('os').tmpdir(),'gb88-'+Date.now()+'.json');await d.saveAs(file);
  const p2=await open(file);
  const E=await p2.evaluate(i=>{sheet('acq');return {level:V('acq['+i+'].level'),gen:V('acq['+i+'].gen'),maint:V('acq['+i+'].maint'),why:V('acq['+i+'].why'),sentence:(document.querySelector('[data-out="acq'+i+'"]')||{}).textContent||''};},i);
  ok('6 Save data then Open data keeps the new boxes and the sentence',E.level==='says break only when prompted'&&/two adults/.test(E.gen)&&/2 and 4 weeks/.test(E.maint)&&/replaces hitting/.test(E.why)&&/present level: says break only when prompted/.test(E.sentence),E);
  await p2.close();
  /* 7. the five files */
  const res=[];for(const k of keys){const pk=await open(path.join(SIM,k,'gb1-save.json'));const r=await pk.evaluate(()=>{sheet('acq');document.querySelector('#buildSheet').click();return {cards:document.querySelectorAll('#acqWrap .card, #redWrap .card').length,li:document.querySelectorAll('#sheetOut ol.gs li').length};});res.push({k,...r});await pk.close();}
  ok('7 the simulated files open and build their sheets',res.length===keys.length&&res.every(r=>r.cards>0&&r.li>0),res);
  ok('8 no page errors',errs.length===0,errs.slice(0,5));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
