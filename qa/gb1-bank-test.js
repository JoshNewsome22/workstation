/* v23.82 Form GB-1's objective bank (the BCBA's request: premade acquisition objectives from peer-reviewed studies). On an iPad
   Pro (touch, Fit on), with a simulated student:
   1. the Acquisition objectives sheet has the bank above the objectives, closed, with its count; every entry has the
      objective's parts, a teaching summary and at least one reference with its year; every reference an entry names exists;
      no two references share a citation (v23.83: first authors with one surname are told apart by their initials);
   2. each entry's skill reads in the objective's sentence as written (after "will"), and its unit is one of the sheet's;
   3. the search finds by words ("break", "wait", "greet"), by kind of skill and by function; a word in no entry lists none;
      with this case's function (escape, from FS-1 through the case) the case's choice lists the escape skills and those for
      any function;
   4. Load into A1 fills only the empty fields (a typed criterion is kept and said so), never the target date or the paired
      reduction objective, writes the entry and its sources into the Note, and the objective as written reads the entry;
   5. Undo puts A1 back as it was; with Replace text already typed ticked, the typed criterion is replaced;
   6. Add an acquisition objective and load makes A2 and fills it; the load buttons follow the objectives;
   7. "Add from the objective bank" opens the bank at its search;
   8. the bank keeps no record data: the save file (Save data) is the same with the bank open and searched, and it holds
      no field of the bank's; on paper the bank is not printed;
   9. no page errors. Simulated data only.  usage: node qa/gb1-bank-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='GB-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1400);
  await p.evaluate(()=>{window.R=()=>document.getElementById('gbBankHost').shadowRoot;});   /* the bank's shadow root, in the page */
  await p.evaluate(()=>{const s=document.querySelector('[name="m.client"]');s.value='Mateo Rivera (simulated)';s.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#viewSeg button[data-view="acq"]').click();if(!document.querySelector('#acqWrap .card'))document.getElementById('addAcq').click();});await sleep(500);
  const A=await p.evaluate(()=>{const h=document.getElementById('gbBankHost'),d=h.shadowRoot.querySelector('details'),B=GB1_BANK,REF=B.refs;
    const bad=B.entries.filter(e=>!(e.beh&&e.cond&&e.crit&&e.n&&e.unit&&e.meth&&e.teach&&e.src&&e.src.length&&e.src.every(k=>REF[k]&&/\(\d{4}[a-z]?\)/.test(REF[k].apa)))).map(e=>e.id);
    const units=[...document.querySelector('[name="acq[0].unit"]').options].map(o=>o.value);
    const cites=Object.values(REF).map(r=>r.cite),dup=cites.filter((c,i)=>cites.indexOf(c)!==i);
    return {before:!!(h.compareDocumentPosition(document.getElementById('acqWrap'))&Node.DOCUMENT_POSITION_FOLLOWING),open:d.open,n:B.entries.length,sum:d.querySelector('summary').textContent,bad,dup,
      units:B.entries.filter(e=>!units.includes(e.unit)).map(e=>e.id),will:B.entries.filter(e=>gbWill(e.beh,'Mateo Rivera (simulated)')!==e.beh).map(e=>[e.id,gbWill(e.beh,'Mateo Rivera (simulated)')])};});
  ok('1 the bank is above the objectives, closed, with its count; every entry is whole, each with a dated reference, no two references cited alike ('+A.n+' entries)',A.before&&!A.open&&A.n>=30&&/\(\d+ starting objectives/.test(A.sum)&&!A.bad.length&&!A.dup.length,A);
  ok('2 each entry\'s skill reads in the sentence as written, and its unit is one of the sheet\'s',!A.will.length&&!A.units.length,{will:A.will,units:A.units});
  const S=await p.evaluate(()=>{const s=(q,dm,f)=>window.__gbBank.search(q,dm,f);
    const esc=GB1_BANK.entries.filter(e=>!e.fn.length||e.fn.includes('escape')).map(e=>e.id).sort();
    return {brk:s('break'),wait:s('wait'),greet:s('greet'),none:s('xylophone zebra'),dom:s('','Tolerance and waiting').length,domAll:GB1_BANK.entries.filter(e=>e.dom==='Tolerance and waiting').length,
      att:s('','','attention'),esc,attOk:s('','','attention').every(id=>{const e=window.__gbBank.entry(id);return !e.fn.length||e.fn.includes('attention');})};});
  await p.evaluate(()=>window.__nbhFactsIn({fn:{key:'escape',label:'Escape from demands'},behaviors:[{label:'Aggression (simulated)',fnKey:'escape'}]}));await sleep(300);
  const C=await p.evaluate(()=>{const f=R().querySelector('.fn'),o=[...f.options].map(x=>x.value+'|'+x.textContent);f.value='case';f.dispatchEvent(new Event('change'));
    return {o,listed:[...R().querySelectorAll('.it')].map(b=>b.dataset.id).sort(),viaApi:window.__gbBank.search('','','case').sort()};});
  ok('3 the search finds by words, by kind and by function; this case\'s function lists the escape skills and those for any function',S.brk.includes('fc-break')&&S.wait.includes('tw-wait')&&S.greet[0]==='so-greet'&&!S.none.length&&
    S.dom===S.domAll&&S.attOk&&S.att.includes('fc-att')&&C.o.some(x=>/^case\|This case.s: escape/.test(x))&&JSON.stringify(C.listed)===JSON.stringify(S.esc),{S,C:{o:C.o,n:C.listed.length,esc:S.esc.length}});
  /* a load into A1 with a criterion typed */
  await p.evaluate(()=>{const c=document.querySelector('[name="acq[0].crit"]');c.value='with no more than one prompt (simulated)';c.dispatchEvent(new Event('input',{bubbles:true}));
    const r=R();r.querySelector('.fn').value='';r.querySelector('.fn').dispatchEvent(new Event('change'));r.querySelector('details').open=true;r.querySelector('.it[data-id="fc-break"]').click();});await sleep(300);
  const D=await p.evaluate(()=>{R().querySelector('.ld[data-i="0"]').click();const g=k=>document.querySelector('[name="acq[0].'+k+'"]').value;const e=window.__gbBank.entry('fc-break');
    return {st:R().querySelector('.st').textContent,beh:g('beh')===e.beh,cond:g('cond')===e.cond,crit:g('crit'),n:g('n'),unit:g('unit'),meth:g('meth')===e.meth,date:g('date'),pair:g('pair'),note:g('note'),
      out:document.querySelector('[data-out="acq0"]').textContent};});
  ok('4 Load into A1 fills only the empty fields (the typed criterion kept, and said so), not the date or the paired objective; the Note names the entry and its sources',
    D.beh&&D.cond&&D.meth&&D.n==='3'&&D.unit==='sessions'&&D.crit==='with no more than one prompt (simulated)'&&!D.date&&!D.pair&&/^From the objective bank: Ask for a break from work \(Carr & Durand, 1985;/.test(D.note)&&
    /Kept as typed: Criterion/.test(D.st)&&/will ask for a break \(in words, with a sign or with the break card\) and go to the break area with no more than one prompt/.test(D.out),D);
  const U=await p.evaluate(()=>{const u=[...R().querySelectorAll('.st button')].find(b=>/Undo/.test(b.textContent));u.click();const g=k=>document.querySelector('[name="acq[0].'+k+'"]').value;
    const a={beh:g('beh'),note:g('note'),crit:g('crit'),st:R().querySelector('.st').textContent};
    R().querySelector('.rpl').checked=true;R().querySelector('.ld[data-i="0"]').click();a.crit2=g('crit');a.beh2=g('beh');return a;});
  ok('5 Undo puts A1 back as it was; with Replace text already typed, the typed criterion is replaced',!U.beh&&!U.note&&U.crit==='with no more than one prompt (simulated)'&&/Undone/.test(U.st)&&
    U.crit2==='independently, before any problem behavior, in at least 90% of opportunities'&&!!U.beh2,U);
  const G=await p.evaluate(()=>{R().querySelector('.rpl').checked=false;R().querySelector('.it[data-id="tw-wait"]').click();R().querySelector('.add').click();
    const cards=[...document.querySelectorAll('#acqWrap .card')].length,beh=(document.querySelector('[name="acq[1].beh"]')||{}).value;
    return {cards,beh,ok:beh===window.__gbBank.entry('tw-wait').beh};});await sleep(400);
  const Gb=await p.evaluate(()=>[...R().querySelectorAll('.ld')].map(b=>b.dataset.i));
  ok('6 Add an acquisition objective and load makes A2 and fills it; the load buttons follow the objectives',G.cards===2&&G.ok&&JSON.stringify(Gb)==='["0","1"]',{G,Gb});
  const O=await p.evaluate(async()=>{R().querySelector('details').open=false;document.getElementById('gbBankOpen').click();await new Promise(r=>setTimeout(r,500));
    return {open:R().querySelector('details').open,focus:R().activeElement&&R().activeElement.classList.contains('q')};});
  ok('7 "Add from the objective bank" opens the bank at its search',O.open&&O.focus,O);
  /* the save file with the bank closed, then open and searched */
  const save=async()=>{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.evaluate(()=>{const b=document.getElementById('saveBtn')||[...document.querySelectorAll('button')].find(x=>/^Save data$/.test(x.textContent.trim()));b.click();})]);
    const fp=await dl.path();return JSON.parse(require('fs').readFileSync(fp,'utf8'));};
  await p.evaluate(()=>{R().querySelector('details').open=false;});const f1=await save();
  await p.evaluate(()=>{const r=R();r.querySelector('details').open=true;const q=r.querySelector('.q');q.value='help';q.dispatchEvent(new Event('input'));r.querySelector('.dom').value='Daily living';r.querySelector('.dom').dispatchEvent(new Event('change'));});
  const f2=await save();const strip=o=>{const c=JSON.parse(JSON.stringify(o));delete c.savedAt;delete c.saved;delete c.when;return c;};
  const k1=Object.keys(f1.fields||f1),k2=Object.keys(f2.fields||f2);
  await p.emulateMedia({media:'print'});await sleep(200);const pr=await p.evaluate(()=>getComputedStyle(document.getElementById('gbBankHost')).display);await p.emulateMedia({media:'screen'});
  ok('8 the bank keeps no record data (the save file the same with it open and searched, none of its boxes in it), and is not printed',
    JSON.stringify(strip(f1.fields||f1))===JSON.stringify(strip(f2.fields||f2))&&!k2.some(k=>/bank|^q$|dom|fn$/.test(k)&&!/^m\.fn$/.test(k))&&pr==='none',{k1:k1.length,k2:k2.length,pr,diff:k2.filter(k=>!k1.includes(k))});
  ok('9 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
