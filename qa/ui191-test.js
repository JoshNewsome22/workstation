/* v24.91 the examples in a row of several boxes, on an iPad (the BCBA's TD-1 screenshots, 10/28). WebKit (Safari's
   engine) with a touch screen, at the width TD-1 has on an iPad sideways with the sheets list open (860 px).
   1. TD-1 Setup, "Replacement behavior already in repertoire?": each box's example under its own box, none under the
      row's name, and the box itself empty (one example, not two);
   2. the list in that row is named by the row ("Replacement behavior already in repertoire?"), not by the boxes beside
      it; so are "Component FA" and "Function type and MEFA confirmation";
   3. Function type and MEFA confirmation: the MEFA box's example under it;
   4. the Baseline level row: its four parts apart (no two overlapping) and "Intervals with the behavior, % (if used)";
   5. before printing, the boxes have their examples back and no example is on the page; after, they are dressed again;
   6. every form (47): no example under a row's name for a box that has a label of its own in that row, and no list or
      box named by another box's label;
   7. no page errors.  usage: node qa/ui191-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;let webkit;try{({webkit}=require('playwright'));}catch(e){({webkit}=require('/opt/node22/lib/node_modules/playwright'));}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
(async()=>{const br=await webkit.launch();const ctx=await br.newContext({viewport:{width:860,height:760},hasTouch:true});const errs=[];
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+'/NBH-Workstation/'+f);await sleep(2200);return p;};
  const td=await open(L.forms().find(x=>x.id==='TD-1').file);
  const name=n=>td.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return (e.getAttribute('aria-label')||(e.labels&&e.labels[0]&&e.labels[0].textContent)||'').replace(/\s+/g,' ').trim();},n);
  const row=n=>td.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]'),r=e.closest('.drow'),lab=e.parentNode.tagName==='LABEL'?e.parentNode:null,nx=lab&&lab.nextElementSibling;
    return {dlabHints:r.querySelectorAll('.dlab .nbh-hint').length,ph:e.getAttribute('placeholder'),under:nx&&nx.classList.contains('nbh-hint')?nx.textContent:'',below:nx?Math.round(nx.getBoundingClientRect().top-lab.getBoundingClientRect().bottom):null};},n);
  const a=await row('m.repdesc'),b=await row('m.replevel'),c=await row('m.cfa.mefa');
  ok('1 Replacement behavior already in repertoire?: each example under its own box, none under the row\'s name, the box empty',
    a.dlabHints===0&&a.under==='e.g., hand an adult the break card within 5 s of a demand'&&a.ph===''&&b.under==='e.g., says break when prompted; not yet on their own'&&b.ph===''&&a.below>=0&&a.below<20,[a,b]);
  const nm=[await name('m.rep'),await name('m.cfa.run'),await name('m.cfa.type')];
  ok('2 the lists in those rows are named by their row',nm[0]==='Replacement behavior already in repertoire?'&&nm[1]==='Component FA (Bann & Morris, 2026)'&&nm[2]==='Function type and MEFA confirmation',nm);
  ok('3 the MEFA box\'s example under it',c.dlabHints===0&&c.under==='e.g., yes; tangible quotient 1.0; trend rules not applied'&&c.ph==='',c);
  const bl=await td.evaluate(()=>{const d=document.querySelector('[name="m.rate"]').closest('.dval'),R=[...d.querySelectorAll(':scope>label')].map(l=>l.getBoundingClientRect());
    let over=0;for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const x=R[i],y=R[j];if(x.left<y.right&&y.left<x.right&&x.top<y.bottom&&y.top<x.bottom)over++;}
    return {over,n:R.length,text:d.textContent.replace(/\s+/g,' ').trim()};});
  ok('4 the Baseline level row: four parts, none overlapping, the intervals label reworded',bl.n===4&&bl.over===0&&/Intervals with the behavior, % \(if used\)/.test(bl.text)&&!/^% intervals/.test(bl.text),bl);
  const pr=await td.evaluate(async()=>{dispatchEvent(new Event('beforeprint'));await new Promise(r=>setTimeout(r,100));const e=document.querySelector('[name="m.repdesc"]');
    const on={ph:e.getAttribute('placeholder'),hints:document.querySelectorAll('.nbh-hint').length};dispatchEvent(new Event('afterprint'));await new Promise(r=>setTimeout(r,700));
    return {on,after:{ph:e.getAttribute('placeholder'),hint:!!(e.parentNode.nextElementSibling&&e.parentNode.nextElementSibling.classList.contains('nbh-hint'))}};});
  ok('5 before printing the box has its example back and no example is on the page; after, it is dressed again',pr.on.ph==='e.g., hand an adult the break card within 5 s of a demand'&&pr.on.hints===0&&pr.after.ph===''&&pr.after.hint,pr);
  await td.close();
  const bad=[];
  for(const f of L.forms()){const p=await open(f.file);
    const r=await p.evaluate(()=>{const out=[];document.querySelectorAll('.drow').forEach(row=>{const dl=row.querySelector(':scope>.dlab');if(!dl)return;
      const labs=[...row.querySelectorAll('.dval label')].filter(l=>l.querySelector('input,select,textarea'));
      const own=labs.map(l=>{const c=l.cloneNode(true);c.querySelectorAll('input,select,textarea,.nbh-hint').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,' ').trim();}).filter(Boolean);
      if(!own.length)return;
      labs.forEach(l=>{const e=l.querySelector('input,textarea');const ph=e&&e.getAttribute('data-nbh-ph');if(ph&&[...dl.querySelectorAll('.nbh-hint')].some(h=>h.textContent===ph))out.push('hint under the row name: '+ph.slice(0,40));});
      row.querySelectorAll('.dval > select, .dval > input, .dval > textarea').forEach(e=>{const a=(e.getAttribute('aria-label')||'').trim();if(a&&own.some(t=>t.length>3&&a.includes(t)))out.push('named by another box: '+a.slice(0,60));});});return out;});
    if(r.length)bad.push(f.id+': '+r.slice(0,3).join(' | '));await p.close();}
  ok('6 every form: no example under a row\'s name for a box with its own label, no list named by another box\'s label',!bad.length,bad);
  ok('7 no page errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
