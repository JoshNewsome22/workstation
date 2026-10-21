/* v23.85 Form TD-1's protocol bank (the BCBA's request: treatment protocols from the articles). On an iPad Pro (touch,
   Fit on), with a simulated student:
   1. the Build sheet has the bank between "+ Add" and the cards, closed, with its count; every protocol is whole (a component
      of this form, its steps, the study, what happened, at least one dated reference), its settings are labels of its
      component, no step names a procedure the bank never uses, and no two references are cited alike;
   2. the search finds by words, by kind of component and by function; a word in no protocol lists none; with this plan's
      function (escape, on Setup) the plan's choice lists the protocols for escape and those for any function;
   3. Add to the plan makes a card of the protocol's component with exactly the study's steps (as many as it has), its
      settings in their boxes, its data and materials, and the card names the study;
   4. Undo removes that card; a card edited since is kept and said so;
   5. the final plan shows the steps, names the study beside the component and lists the protocol's references at its end;
      the text for the BIP names the study;
   6. Save data, then Open data: the card comes back with the same steps and its study; a card added from the menu keeps the
      component's own steps; a file saved before the bank (no counts.ns) still opens as before;
   7. "Add from the protocol bank" opens the bank at its search;
   8. the bank keeps no record data (the save file is the same with it open and searched), and it is not printed;
   9. no page errors. Simulated data only.  usage: node qa/td1-bank-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='TD-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1400);
  await p.evaluate(()=>{window.R=()=>document.getElementById('tdBankHost').shadowRoot;
    const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));};
    s('m.client','Mateo Rivera (simulated)');s('m.beh','Aggression (simulated)');
    document.querySelector('#viewSeg button[data-view="build"]').click();});await sleep(400);
  const A=await p.evaluate(()=>{const h=document.getElementById('tdBankHost'),d=h.shadowRoot.querySelector('details'),B=TD1_BANK,REF=B.refs;
    const lib=c=>window.__tdLibOf(c),groups=window.__tdGroups().flatMap(g=>g[1]);
    const bad=B.protocols.filter(x=>!(lib(x.code)&&groups.includes(x.code)&&x.lab&&x.beh&&x.result&&x.steps&&x.steps.length>=2&&x.steps.every(s=>s&&s.trim())&&x.src&&x.src.length&&x.src.every(k=>REF[k]&&/\(\d{4}[a-z]?\)/.test(REF[k].apa)))).map(x=>x.id);
    const labs=B.protocols.filter(x=>lib(x.code)&&Object.keys(x.params||{}).some(k=>!lib(x.code).params.some(q=>q[0]===k))).map(x=>x.id);
    const never=B.protocols.filter(x=>x.steps.concat([x.lab]).some(s=>/\b(shock|aversive|ammonia|lemon juice|water mist|seclu|spank|slap)/i.test(s))).map(x=>x.id);
    const cites=Object.values(REF).map(r=>r.cite),dup=cites.filter((c,i)=>cites.indexOf(c)!==i);
    const add=document.getElementById('addCompBtn'),wrap=document.getElementById('compWrap');
    return {between:!!(add.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(h.compareDocumentPosition(wrap)&Node.DOCUMENT_POSITION_FOLLOWING),
      open:d.open,n:B.protocols.length,sum:d.querySelector('summary').textContent,bad,labs,never,dup};});
  ok('1 the bank is between "+ Add" and the cards, closed, with its count; every protocol is whole, its settings are its component\'s, no step uses a procedure the bank never uses, no two references cited alike ('+A.n+' protocols)',
    A.between&&!A.open&&A.n>=5&&/\(\d+ treatment protocols/.test(A.sum)&&!A.bad.length&&!A.labs.length&&!A.never.length&&!A.dup.length,A);
  /* the protocol the checks add: one whose number of steps differs from its component's */
  const T=await p.evaluate(()=>{const P=TD1_BANK.protocols,L=c=>window.__tdLibOf(c);const t=P.find(x=>x.steps.length!==L(x.code).steps.length&&Object.keys(x.params||{}).length&&x.data)||P.find(x=>x.steps.length!==L(x.code).steps.length)||P[0];
    return {id:t.id,code:t.code,lab:t.lab,n:t.steps.length,def:L(t.code).steps.length,word:t.lab.split(/\s+/).find(w=>w.length>5).replace(/[^A-Za-z-]/g,''),kind:window.__tdBank.kindOf(t.id)};});
  const S=await p.evaluate(T=>{const s=(q,k,f)=>window.__tdBank.search(q,k,f),B=TD1_BANK;
    return {w:s(T.word),none:s('xylophone zebra'),kind:s('',T.kind).length,kindAll:B.protocols.filter(x=>window.__tdBank.kindOf(x.id)===T.kind).length,
      esc:s('','','escape'),escOk:s('','','escape').every(id=>{const x=window.__tdBank.entry(id);return !x.fn.length||x.fn.includes('escape');})};},T);
  await p.evaluate(()=>{const e=document.querySelector('[name="m.fn"]');e.value='escape';['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));});await sleep(300);
  const C=await p.evaluate(()=>{const f=R().querySelector('.fn'),o=[...f.options].map(x=>x.value+'|'+x.textContent);f.value='plan';f.dispatchEvent(new Event('change'));
    const want=TD1_BANK.protocols.filter(x=>!x.fn.length||x.fn.includes('escape')).map(x=>x.id).sort();
    const got=[...R().querySelectorAll('.it')].map(b=>b.dataset.id).sort();f.value='';f.dispatchEvent(new Event('change'));return {o,ok:JSON.stringify(want)===JSON.stringify(got),n:got.length};});
  ok('2 the search finds by words, by kind and by function; this plan\'s function lists the escape protocols and those for any function',S.w.includes(T.id)&&!S.none.length&&S.kind===S.kindAll&&S.escOk&&C.o.some(x=>/^plan\|This plan.s: escape/.test(x))&&C.ok,{T,S,C});
  /* Add to the plan */
  await p.evaluate(id=>{R().querySelector('details').open=true;R().querySelector('.it[data-id="'+id+'"]').click();},T.id);await sleep(200);
  const D=await p.evaluate(id=>{const n0=document.querySelectorAll('#compWrap .card').length;R().querySelector('.add').click();
    const c=document.querySelector('#compWrap').lastElementChild,i=c.dataset.i,x=TD1_BANK.protocols.find(y=>y.id===id),L=window.__tdLibOf(x.code);
    const steps=[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value);
    const prm=L.params.map((q,k)=>[q[0],document.querySelector('[name="cp['+i+'].p'+k+'"]').value]).filter(q=>x.params[q[0]]);
    return {added:document.querySelectorAll('#compWrap .card').length===n0+1,code:c.dataset.code===x.code,steps:JSON.stringify(steps)===JSON.stringify(x.steps),
      prm:prm.every(q=>q[1]===x.params[q[0]])&&prm.length===Object.keys(x.params).length,data:document.querySelector('[name="cp['+i+'].data"]').value===(x.data||''),
      mat:document.querySelector('[name="cp['+i+'].mat"]').value===(x.mat||''),src:c.querySelector('.td-bank-src').textContent,hid:c.querySelector('.td-bank-src').hidden,st:R().querySelector('.st').textContent,i};},T.id);
  ok('3 Add to the plan makes a card of the protocol\'s component with exactly its '+T.n+' steps (the component has '+T.def+'), its settings, data and materials, and the card names the study',
    D.added&&D.code&&D.steps&&D.prm&&D.data&&D.mat&&!D.hid&&D.src.startsWith('Protocol from the protocol bank: '+T.lab+' (')&&/Added to the plan/.test(D.st),D);
  const U=await p.evaluate(()=>{const n0=document.querySelectorAll('#compWrap .card').length;const u=[...R().querySelectorAll('.st button')].find(b=>/Undo/.test(b.textContent));u.click();
    const a={gone:document.querySelectorAll('#compWrap .card').length===n0-1,st:R().querySelector('.st').textContent};
    R().querySelector('.add').click();const c=document.querySelector('#compWrap').lastElementChild,t=c.querySelector('ol.steps textarea');t.value=t.value+' (edited, simulated)';t.dispatchEvent(new Event('input',{bubbles:true}));
    const n1=document.querySelectorAll('#compWrap .card').length;[...R().querySelectorAll('.st button')].find(b=>/Undo/.test(b.textContent)).click();
    a.kept=document.querySelectorAll('#compWrap .card').length===n1;a.st2=R().querySelector('.st').textContent;t.value=t.value.replace(' (edited, simulated)','');t.dispatchEvent(new Event('input',{bubbles:true}));return a;});
  ok('4 Undo removes the added card; a card edited since is kept, and said so',U.gone&&/Undone/.test(U.st)&&U.kept&&/edited since/.test(U.st2),U);
  /* a card from the menu too, for the round trip */
  await p.evaluate(()=>{const s=document.getElementById('addComp');s.value=[...s.options].map(o=>o.value).find(v=>v==='A_NCA')||[...s.options].map(o=>o.value).filter(Boolean)[0];document.getElementById('addCompBtn').click();});await sleep(200);
  const P5=await p.evaluate(T=>{document.querySelector('#viewSeg button[data-view="final"]').click();const fb=document.getElementById('finalBody').innerText,x=TD1_BANK.protocols.find(y=>y.id===T.id);
    const refs=x.src.map(k=>TD1_BANK.refs[k].apa);const bip=window.__bipText();
    return {steps:x.steps.every(s=>fb.includes(s)),from:fb.includes('Protocol from '+T.lab),refs:refs.every(r=>fb.includes(r))&&/Sources of the protocols from the protocol bank/i.test(fb),
      miss:refs.filter(r=>!fb.includes(r)),bip:bip.includes('Protocol from '+T.lab)};},T);
  ok('5 the final plan shows the steps, names the study beside the component and lists its references; the BIP text names the study',P5.steps&&P5.from&&P5.refs&&P5.bip,P5);
  /* Save data, then Open data */
  const save=async()=>{const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.evaluate(()=>document.getElementById('saveBtn').click())]);return JSON.parse(fs.readFileSync(await dl.path(),'utf8'));};
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="build"]').click());
  const before=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,steps:[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value),src:c.querySelector('.td-bank-src').textContent})));
  const f1=await save();const tmp=path.join(os.tmpdir(),'td1-bank-sim-'+process.pid+'.json');fs.writeFileSync(tmp,JSON.stringify(f1));
  await p.evaluate(()=>{document.getElementById('compWrap').innerHTML='';});
  await p.setInputFiles('#fileIn',tmp);await sleep(900);
  const after=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,steps:[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value),src:c.querySelector('.td-bank-src').textContent})));
  const menu=await p.evaluate(()=>{const c=[...document.querySelectorAll('#compWrap .card')].find(x=>!document.querySelector('[name="cp['+x.dataset.i+'].bank"]').value);const L=window.__tdLibOf(c.dataset.code);
    return JSON.stringify([...c.querySelectorAll('ol.steps textarea')].map(t=>t.value))===JSON.stringify(L.steps);});
  /* a file from before the bank: no counts.ns, no bank fields */
  const old=JSON.parse(JSON.stringify(f1));delete old.counts.ns;Object.keys(old.fields).forEach(k=>{if(/\.(bank|bsrc)$/.test(k))delete old.fields[k];});
  const ix=old.counts.comps.findIndex(c=>c===T.code);if(ix>=0){const i=old.counts.idx[ix];Object.keys(old.fields).forEach(k=>{const m=new RegExp('^cp\\['+i+'\\]\\.s(\\d+)$').exec(k);if(m&&+m[1]>=T.def)delete old.fields[k];});}
  fs.writeFileSync(tmp,JSON.stringify(old));await p.setInputFiles('#fileIn',tmp);await sleep(900);
  const oldOk=await p.evaluate(def=>{const c=[...document.querySelectorAll('#compWrap .card')];return c.length&&c.every(x=>x.querySelectorAll('ol.steps textarea').length===window.__tdLibOf(x.dataset.code).steps.length)&&c.every(x=>x.querySelector('.td-bank-src').hidden);},T.def);
  try{fs.unlinkSync(tmp);}catch(e){}
  ok('6 Save data and Open data bring the bank card back with its steps and its study; a menu card keeps its own steps; a file from before the bank still opens',
    JSON.stringify(before)===JSON.stringify(after)&&f1.counts&&Array.isArray(f1.counts.ns)&&menu&&oldOk,{before:before.map(x=>[x.code,x.steps.length]),after:after.map(x=>[x.code,x.steps.length]),ns:f1.counts&&f1.counts.ns,menu,oldOk});
  const O=await p.evaluate(async()=>{R().querySelector('details').open=false;document.getElementById('tdBankOpen').click();await new Promise(r=>setTimeout(r,500));
    return {open:R().querySelector('details').open,focus:R().activeElement&&R().activeElement.classList.contains('q')};});
  ok('7 "Add from the protocol bank" opens the bank at its search',O.open&&O.focus,O);
  await p.evaluate(()=>{R().querySelector('details').open=false;});const g1=await save();
  await p.evaluate(()=>{const r=R();r.querySelector('details').open=true;const q=r.querySelector('.q');q.value='delay';q.dispatchEvent(new Event('input'));r.querySelector('.kind').selectedIndex=1;r.querySelector('.kind').dispatchEvent(new Event('change'));});
  const g2=await save();const strip=o=>{const c=JSON.parse(JSON.stringify(o));delete c.saved;return c;};
  await p.emulateMedia({media:'print'});await sleep(200);const pr=await p.evaluate(()=>getComputedStyle(document.getElementById('tdBankHost')).display);await p.emulateMedia({media:'screen'});
  ok('8 the bank keeps no record data (the save file the same with it open and searched), and is not printed',JSON.stringify(strip(g1))===JSON.stringify(strip(g2))&&pr==='none',{pr,diff:Object.keys(g2.fields).filter(k=>g1.fields[k]!==g2.fields[k])});
  ok('9 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
