/* v25.81 (the BCBA, 11/11: "Yes" to the item safety check) Form PA-1's Item Safety Check for non-food items.
   A  the section: on the Indirect sheet after How Each Stimulus Will Be Used; a row for every stimulus as the form opens
      (the two per-item tables used to be empty on a new form); the standard it names; left off the printout while empty.
   B  the flags: not checked yet; the question unanswered; an item that fits the tube; the hazards read from an item's
      own words (magnets, water beads, cords); a food row points to Restrictions and Form IC-1; an activity or a social
      item needs no check.
   C  a student who mouths non-food items (the answer, or Pica / Choking in Form DM-1's safety precautions inside a case):
      "Do not use with this student" on an item that fits the tube and on magnets, balloons and water beads; an item that
      passes is still checked against the small-ball size. A student who does not: the same item is a caution only.
   D  the runner: with such a student and an item marked or unchecked, Start asks first; Cancel leaves it not started;
      the go-ahead is noted with its date and not asked again for the same items.
   E  the file: the answers are saved and come back; a file saved before opens as it did.
   Simulated people and invented items only. usage: node qa/v2581-item-safety-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const PA=L.forms().find(f=>f.id==='PA-1').file,U=L.BASE+'/NBH-Workstation/'+encodeURI(PA);
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(U);await sleep(1200);
    await p.evaluate(()=>{window.__asked=[];window.__ans=false;nbhUI.confirm=async t=>{window.__asked.push(t);return /with these items/i.test(t)?window.__ans:true;};});return p;};
  const pool=(p,rows)=>p.evaluate(rows=>{rows.forEach(([i,name,type,note])=>{const set=(f,v)=>{const e=document.querySelector('#poolTbl [data-f="'+f+'"][data-i="'+i+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('name',name);set('type',type);if(note)set('note',note);});},rows);
  const size=(p,i,v)=>p.selectOption('#paSafeTbl select[data-sf="size"][data-i="'+i+'"]',v);
  const read=p=>p.evaluate(()=>{const row=i=>{const tr=document.querySelectorAll('#paSafeTbl tbody tr')[i];return tr?tr.cells[tr.cells.length-1].textContent:null;};const fl=document.getElementById('paSafeFlag'),cs=document.getElementById('paSafeCase');
    return {r:[0,1,2,3,4,5].map(row),flag:fl.hidden?'':fl.textContent,cs:cs.hidden?'':cs.textContent,empty:document.getElementById('paSafeBox').classList.contains('pa65-empty'),stop:[...document.querySelectorAll('#paSafeTbl .pa-sf-stop')].length};});
  const saved=async p=>{const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);return JSON.parse(L.fs.readFileSync(await dl.path(),'utf8'));};
  const reopen=async(p,o)=>{await p.setInputFiles('#fileIn',{name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(o))});await sleep(600);};

  /* ---------------- A. the section ---------------- */
  let p=await open();
  const a=await p.evaluate(()=>{const box=document.getElementById('paSafeBox'),use=document.getElementById('paUseBox'),sh=box.closest('.sheet');
    return {after:!!(use.compareDocumentPosition(box)&Node.DOCUMENT_POSITION_FOLLOWING),sheet:sh&&sh.id,h:box.querySelector('h3').textContent,text:box.querySelector('p.method').textContent,
      rows:document.querySelectorAll('#paSafeTbl tbody tr').length,useRows:document.querySelectorAll('#paUseTbl tbody tr').length,pool:document.querySelectorAll('#poolTbl tbody tr').length,
      opts:[...document.querySelectorAll('#paSafeMouth option')].map(o=>o.textContent).join('|'),size:[...document.querySelector('#paSafeTbl select[data-sf="size"]').options].map(o=>o.value).join('|'),
      labels:[...document.querySelectorAll('#paSafeTbl select,#paSafeTbl input')].every(e=>(e.getAttribute('aria-label')||'').length>8),empty:box.classList.contains('pa65-empty'),
      cards:/#paSafeTbl/.test((window.FX2_CFG||{}).cards||''),gate:typeof window.paSafeGate};});
  ok('A1 the Item Safety Check is on the Indirect sheet after How Each Stimulus Will Be Used, with the question and a row for every stimulus as the form opens (the table above too)',a.after&&/safety check/i.test(a.h)&&a.rows===a.pool&&a.useRows===a.pool&&a.pool>=5&&a.opts==='|No|Sometimes|Yes, often|Not known'&&a.size==='|big|small|na'&&a.labels&&a.gate==='function',a);
  ok('A2 it names the federal small-parts cylinder (1.25 in. across, up to 2.25 in. deep, 16 CFR 1501) and the small-ball size (1.75 in.), says the test is written for children under 3, and that it does not replace the nurse’s or the doctor’s orders',/1\.25 in\. \(3\.2 cm\) across and up to 2\.25 in\. \(5\.7 cm\) deep \(16 CFR 1501\)/.test(a.text)&&/1\.75 in\. \(4\.4 cm\) across \(16 CFR 1500\.18\)/.test(a.text)&&/written for children under 3/.test(a.text)&&/not proof that an item is safe/.test(a.text)&&/does not replace the nurse.s or the doctor.s orders/.test(a.text),a.text);
  ok('A3 with nothing entered the block is left off the printout (as a file saved before prints), and on an iPad its table is laid out as cards',a.empty&&a.cards,a);

  /* ---------------- B. the flags ---------------- */
  await pool(p,[[0,'Magnet tiles','Leisure item'],[1,'Spinning top','Leisure item'],[2,'Crackers','Edible'],[3,'Tickles','Social'],[4,'Sensory bin','Sensory','filled with water beads'],[5,'Stretchy band','Sensory']]);await sleep(200);
  let r=await read(p);
  ok('B1 every object not yet checked says so; the summary lists them and asks for the answer to the question',/^Not checked yet\./.test(r.r[0])&&r.r[1]==='Not checked yet.'&&/4 items are not checked yet: Magnet tiles, Spinning top, Sensory bin, Stretchy band\./.test(r.flag)&&/Answer the question above/.test(r.flag)&&r.stop===0,r);
  ok('B2 hazards are read from the item’s own words: magnets, water beads (from its note) and a cord or band',/Magnets: two or more swallowed/.test(r.r[0])&&/Water beads grow after they are swallowed/.test(r.r[4])&&/Cords and strings can wrap around the neck/.test(r.r[5]),r.r);
  ok('B3 a food row points to Restrictions and Form IC-1, and a social item needs no check',/A food item: its approval, allergies and diet orders are in Restrictions above and on Form IC-1/.test(r.r[2])&&r.r[3]==='',[r.r[2],r.r[3]]);
  await p.selectOption('#paSafeMouth','No');await size(p,1,'small');await size(p,0,'big');await sleep(200);r=await read(p);
  ok('B4 a student who does not mouth items: an item that fits the tube is a caution (arm’s reach, in sight, count the pieces), and magnets are named without "Do not use"',/^Small enough to swallow or to block the airway\. Use it only within arm.s reach and in sight, count the pieces out and back, or choose a larger version\.$/.test(r.r[1])&&/^Magnets:/.test(r.r[0])&&r.stop===0&&!/Do not use/.test(r.flag)&&!r.empty,r);
  await p.fill('#paSafeTbl input[data-sf="haz"][data-i="1"]','has a button battery');await sleep(200);r=await read(p);
  ok('B5 a hazard typed in "Other hazards seen" is read too (a button battery: the battery door screwed shut)',/Button or coin batteries can burn the throat within hours of being swallowed: use the item only if its battery door is screwed shut/.test(r.r[1]),r.r[1]);

  /* ---------------- C. a student who mouths non-food items ---------------- */
  await p.selectOption('#paSafeMouth','Sometimes');await sleep(200);r=await read(p);
  ok('C1 the answer Sometimes: the item that fits the tube, the magnets and the water beads are each "Do not use with this student", said first and in bold',/^Do not use with this student: the item, or a piece of it, fits in the tube, and the student mouths non-food items \(the answer above: sometimes\)\./.test(r.r[1])&&/^Do not use with this student\. Magnets:/.test(r.r[0])&&!/Passes the tube check/.test(r.r[0])&&/^Do not use with this student\. Water beads/.test(r.r[4])&&r.stop===3,r);
  ok('C2 the summary names the three items and what to do, and the one still unchecked',/Do not use with this student: Magnet tiles, Spinning top, Sensory bin\. Take them out of the pool, or record in Notes why the BCBA allows them and how they will be watched\./.test(r.flag)&&/One item is not checked yet: Stretchy band\./.test(r.flag),r.flag);
  await size(p,5,'big');await sleep(150);r=await read(p);
  ok('C3 an item that passes the tube check is still to be checked against the small-ball size and looked at before every use; its cord caution stays',/Passes the tube check\. For this student also check it against the small-ball size \(1\.75 in\., 4\.4 cm\), and look at it before every use\./.test(r.r[5])&&/Cords and strings/.test(r.r[5])&&!/Do not use/.test(r.r[5]),r.r[5]);

  /* ---------------- D. the runner ---------------- */
  await p.evaluate(()=>{const b=document.querySelector('[data-view="ss"]');if(b)b.click();});await sleep(200);
  const g1=await p.evaluate(async()=>{window.__ans=false;document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));
    return {asked:window.__asked.filter(t=>/with these items/.test(t)),btn:document.getElementById('pa-run-ss-start').textContent,msg:document.getElementById('pa-run-ss-msg').textContent};});
  ok('D1 Start asks first, naming why and which items; Cancel leaves the runner not started and says what to do',g1.asked.length===1&&/This student mouths non-food items \(the answer above: sometimes\)/.test(g1.asked[0])&&/Marked Do not use: Magnet tiles, Spinning top, Sensory bin\./.test(g1.asked[0])&&/only if the BCBA has decided/.test(g1.asked[0])&&g1.btn==='Start trial'&&/Not started: finish the Item Safety Check/.test(g1.msg),g1);
  const g2=await p.evaluate(async()=>{window.__ans=true;window.__asked=[];document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,400));
    const o={asked:window.__asked.filter(t=>/with these items/.test(t)).length,btn:document.getElementById('pa-run-ss-start').textContent,flag:document.getElementById('paSafeFlag').textContent};
    document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,100));document.getElementById('pa-run-ss-end').click();await new Promise(r=>setTimeout(r,300));
    window.__asked=[];document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));o.again=window.__asked.filter(t=>/with these items/.test(t)).length;return o;});
  ok('D2 "Run with these items" starts it, the go-ahead is noted with its date in the summary, and it is not asked again for the same items',g2.asked===1&&g2.btn==='Pause'&&/Run with these items confirmed by the assessor on \d+\/\d+\/\d{4}\./.test(g2.flag)&&g2.again===0,g2);

  /* ---------------- E. the file ---------------- */
  await p.evaluate(()=>{const b=document.querySelector('[data-view="indirect"]');if(b)b.click();});await sleep(200);
  await p.fill('#paSafeBy','A. Rivera, RBT');await p.fill('#paSafeDate','11/11/2026');await sleep(150);
  const file=await saved(p);await p.close();
  p=await open();await reopen(p,file);r=await read(p);
  const back=await p.evaluate(()=>({m:document.getElementById('paSafeMouth').value,s:[...document.querySelectorAll('#paSafeTbl select[data-sf="size"]')].map(e=>e.dataset.i+':'+e.value).join(' '),h:document.querySelector('#paSafeTbl input[data-sf="haz"][data-i="1"]').value,by:document.getElementById('paSafeBy').value,d:document.getElementById('paSafeDate').value}));
  ok('E1 saved and opened again: the answer, each tube check, the hazard typed, who checked and when, and the same flags',back.m==='Sometimes'&&back.s==='0:big 1:small 3: 4: 5:big'&&back.h==='has a button battery'&&back.by==='A. Rivera, RBT'&&back.d==='11/11/2026'&&r.stop===3&&!r.empty,{back,r});
  await p.close();

  /* ---------------- C (in a case). Form DM-1's safety precautions ---------------- */
  p=await open();
  await pool(p,[[0,'Spinning top','Leisure item'],[1,'Balloon','Leisure item']]);
  await p.evaluate(()=>nbhCase.apply({profile:{client:'Mateo Rivera',flags:{safety:['Elopement','Pica','Choking']}}}));await sleep(300);
  await size(p,0,'small');await sleep(200);r=await read(p);
  ok('C4 inside a case whose Form DM-1 lists pica and choking, with the question left blank: the page says so, the small item and the balloon are "Do not use with this student", and no answer is asked for',/Form DM-1.s safety precautions list pica and choking for this student\. Treat every item as one the student may put in the mouth\./.test(r.cs)&&/^Do not use with this student: .*\(Form DM-1.s safety precautions: pica, choking\)\./.test(r.r[0])&&/^Do not use with this student\. Uninflated or broken balloons/.test(r.r[1])&&!/Answer the question above/.test(r.flag),r);
  await p.evaluate(()=>{const b=document.querySelector('[data-view="ss"]');if(b)b.click();});await sleep(200);
  const g3=await p.evaluate(async()=>{window.__ans=false;document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));return {asked:window.__asked.filter(t=>/with these items/.test(t)),btn:document.getElementById('pa-run-ss-start').textContent};});
  ok('D3 in that case Start asks first too, giving Form DM-1 as the reason',g3.asked.length===1&&/Form DM-1.s safety precautions: pica, choking/.test(g3.asked[0])&&g3.btn==='Start trial',g3);
  await p.close();
  /* a student who does not mouth items is never asked */
  p=await open();await pool(p,[[0,'Spinning top','Leisure item']]);await p.selectOption('#paSafeMouth','No');await size(p,0,'small');
  await p.evaluate(()=>{const b=document.querySelector('[data-view="ss"]');if(b)b.click();});await sleep(200);
  const g4=await p.evaluate(async()=>{document.getElementById('pa-run-ss-start').click();await new Promise(r=>setTimeout(r,300));return {asked:window.__asked.length,btn:document.getElementById('pa-run-ss-start').textContent};});
  ok('D4 with the answer No, Start does not ask',g4.asked===0&&g4.btn==='Pause',g4);
  await p.close();
  /* ---------------- E2. a file saved before ---------------- */
  p=await open();const blank=await saved(p);
  const old=JSON.parse(JSON.stringify(blank));const strip=o=>{if(o&&typeof o==='object'){Object.keys(o).forEach(k=>{if(/^safe(Mouth|By|Date|Ack)$/.test(k)||k==='size'||k==='haz')delete o[k];else strip(o[k]);});}};strip(old);
  await reopen(p,old);r=await read(p);
  ok('E2 a file without these fields opens as before: the rows drawn, nothing marked, the block left off the printout',r.stop===0&&r.empty&&r.r.every(x=>x===''||x===null)&&r.flag==='',r);
  await p.close();
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
