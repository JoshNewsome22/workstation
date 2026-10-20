/* v23.72 Form MS-1's medication library: searched as you type, and close to complete for antipsychotics, mood
   stabilizers, anticonvulsants, anxiolytics and methylphenidate (the BCBA's request). iPad landscape, touch.
   1. the library: every medication the request names is in it, each with its class, uses, boxed warning and side
      effects (every side effect one the form knows); the medications a saved record holds keep their places;
   2. typing letters shows the medications whose name starts with them, then a word of the name, then a brand:
      "ris" Risperidone first, "valp" divalproex, "conc" methylphenidate (Concerta), "jorn" methylphenidate (Jornay PM);
      letters that match nothing say so, and Other is always there;
   3. the arrow keys and Enter pick; so does a tap; the card fills in (its class and boxed warning) and the box shows the
      choice; what is saved is the library box as before;
   4. focus with nothing typed: the whole list by class, the five classes asked for among them;
   5. a record opened (or the simulator) shows its medication in the box; Other moves on to the name box;
   6. the list shows on the iPad screen, not cut off by the card; on paper the chosen name prints, not the search box;
   7. no page errors. Simulated data only.  usage: node qa/ms1-library-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const WANT=['Risperidone','Aripiprazole','Quetiapine','Olanzapine','Ziprasidone','Lurasidone','Paliperidone','Clozapine','Asenapine','Brexpiprazole','Cariprazine','Iloperidone','Lumateperone',
  'Olanzapine / samidorphan','Olanzapine / fluoxetine','Pimavanserin','Xanomeline / trospium','Haloperidol','Chlorpromazine','Fluphenazine','Perphenazine','Trifluoperazine','Thioridazine','Thiothixene','Loxapine','Pimozide','Molindone','Prochlorperazine',
  'Lithium','Divalproex / valproate','Carbamazepine','Lamotrigine',
  'Oxcarbazepine','Topiramate','Levetiracetam','Zonisamide','Gabapentin','Clobazam','Cannabidiol (Epidiolex)','Acetazolamide','Brivaracetam','Cenobamate','Eslicarbazepine','Ethosuximide','Ethotoin','Felbamate','Fenfluramine','Ganaxolone','Lacosamide','Methsuximide','Midazolam (nasal)','Perampanel','Phenobarbital','Phenytoin','Pregabalin','Primidone','Rufinamide','Stiripentol','Tiagabine','Vigabatrin',
  'Clonazepam','Lorazepam','Diazepam','Alprazolam','Chlordiazepoxide','Clorazepate','Oxazepam','Buspirone','Hydroxyzine','Meprobamate',
  'Methylphenidate','Methylphenidate patch','Dexmethylphenidate','Serdexmethylphenidate / dexmethylphenidate'];
const OLD=['Risperidone','Aripiprazole','Quetiapine','Olanzapine','Ziprasidone','Lurasidone','Paliperidone','Clozapine','Haloperidol','Chlorpromazine','Lithium'];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));const f=L.forms().find(x=>x.id==='MS-1');
  await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(1500);
  const lib=await p.evaluate(([W,O])=>{const Lb=window.msLibrary,M=Lb.MEDS,names=M.map(m=>m.n);
    return {n:M.length,missing:W.filter(w=>!names.includes(w)),bad:M.filter((m,k)=>k!==Lb.OTHER&&!(m.cls&&m.use&&m.box&&m.se.length&&m.se.every(s=>Lb.SE[s]))).map(m=>m.n),
      old:O.map(n=>names.indexOf(n)).join(),other:Lb.OTHER,dup:names.filter((x,i,a)=>a.indexOf(x)!==i)};},[WANT,OLD]);
  ok('1 the library: every medication asked for, each with its class, uses, boxed warning and side effects ('+lib.n+' entries); the saved places kept',
    !lib.missing.length&&!lib.bad.length&&!lib.dup.length&&lib.n>=90&&lib.old==='0,1,2,3,4,5,6,7,8,9,10'&&lib.other===48,lib);
  const box='#msPick0';const opts=()=>p.evaluate(()=>[...document.querySelectorAll('#msOpts0 li')].map(li=>li.className+'|'+li.textContent.replace(/\s+/g,' ').trim()));
  const typed=async q=>{await p.fill(box,'');await p.type(box,q,{delay:20});await sleep(150);return opts();};
  const ris=await typed('ris'),valp=await typed('valp'),conc=await typed('conc'),jorn=await typed('jorn'),none=await typed('xyzq');
  ok('2 typing shows what starts with the letters: ris, valp, conc (Concerta), jorn (Jornay PM); nothing matching says so; Other always last',
    /^ms-opt\|Risperidone/.test(ris[0])&&/^ms-opt\|Divalproex \/ valproate/.test(valp[0])&&/^ms-opt\|Methylphenidate Concerta/.test(conc[0])&&/^ms-opt\|Methylphenidate Jornay PM/.test(jorn[0])
    &&/^ms-none\|No medication in the library starts with “xyzq”/.test(none[0])&&/Other \(enter manually\)$/.test(none[none.length-1])&&/Other \(enter manually\)$/.test(ris[ris.length-1]),{ris,valp,conc,jorn,none});
  await typed('lam');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await sleep(400);
  const k1=await p.evaluate(()=>{const s=document.querySelector('[name="md[0].lib"]');return {v:s.value,name:window.msLibrary.MEDS[+s.value].n,box:document.getElementById('msPick0').value,info:(document.getElementById('medInfo0')||{}).innerText||'',exp:document.getElementById('msPick0').getAttribute('aria-expanded')};});
  ok('3a the arrow keys and Enter pick: the card fills in and the box shows the choice',k1.name==='Lamotrigine'&&/^Lamotrigine \(Lamictal\)$/.test(k1.box)&&/Anticonvulsant/.test(k1.info)&&/Boxed warning/.test(k1.info)&&k1.exp==='false',k1);
  await p.tap('#msPick1');await sleep(300);await p.type('#msPick1','pera',{delay:20});await sleep(200);await p.tap('#msOpts1 .ms-opt');await sleep(400);
  const k2=await p.evaluate(()=>{const s=document.querySelector('[name="md[1].lib"]');return {name:window.msLibrary.MEDS[+s.value].n,info:(document.getElementById('medInfo1')||{}).innerText||''};});
  ok('3b a tap picks too (Perampanel, its boxed warning on the card)',k2.name==='Perampanel'&&/aggression, hostility/.test(k2.info),k2);
  const snap=await p.evaluate(()=>{try{return JSON.parse(nbhBridge.snapshot ? JSON.stringify(nbhBridge.snapshot()) : '{}');}catch(e){return {};}});
  const saved=await p.evaluate(()=>document.querySelector('[name="md[0].lib"]').value);
  ok('3c what is saved is the library box, a place in the list, as before',/^\d+$/.test(saved),{saved});
  await p.fill(box,'');await p.evaluate(()=>document.getElementById('msPick0').blur());await sleep(250);await p.focus(box);await sleep(300);
  const all=await opts();const grp=all.filter(x=>/^ms-grp/.test(x)).map(x=>x.split('|')[1]);
  ok('4 focus with nothing typed: the whole list by class, the classes asked for among them',['Antipsychotics','Mood stabilizers','Anticonvulsants','Anxiolytics','ADHD medications'].every(g=>grp.includes(g))&&all.filter(x=>/^ms-opt/.test(x)).length>=96,{grp,n:all.length});
  /* the list on the screen: not cut off by its card */
  const vis=await p.evaluate(()=>{const ul=document.getElementById('msOpts0');const r=ul.getBoundingClientRect();const x=r.left+r.width/2,y=Math.min(r.bottom-10,r.top+60);const el=document.elementFromPoint(x,y);return {h:Math.round(r.height),inView:r.top>=0&&r.top<innerHeight,own:!!(el&&ul.contains(el))};});
  ok('6a the list shows on the iPad screen, over the card, not cut off',vis.h>=200&&vis.inView&&vis.own,vis);
  await p.keyboard.press('Escape');await sleep(200);
  /* a record opened, and the simulator */
  await p.evaluate(()=>{const s=document.querySelector('[name="md[0].lib"]');s.value='0';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const o1=await p.inputValue(box);
  await p.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(1500);await p.evaluate(()=>{const b=document.querySelector('#viewSeg [data-view="plan"]');if(b)b.click();});await sleep(400);
  const o2=await p.evaluate(()=>[...document.querySelectorAll('.ms-pick-in')].map(i=>i.value).filter(Boolean));
  ok('5a a record opened, or the simulator, shows its medication in the box',o1==='Risperidone (Risperdal)'&&o2.length>=1&&o2.every(v=>/\(/.test(v)||/^Other/.test(v)),{o1,o2});
  await p.fill(box,'oth');await sleep(150);await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await sleep(300);
  const ot=await p.evaluate(()=>({f:document.activeElement&&document.activeElement.getAttribute('name'),v:document.querySelector('[name="md[0].lib"]').value}));
  ok('5b Other moves on to the name box',ot.f==='md[0].name'&&+ot.v===48,ot);
  await p.emulateMedia({media:'print'});await sleep(300);
  const pr=await p.evaluate(()=>{const s=document.querySelector('[name="md[0].lib"]'),c=document.querySelector('.ms-combo');return {sel:getComputedStyle(s).display,combo:getComputedStyle(c).display,text:s.options[s.selectedIndex]?s.options[s.selectedIndex].text:''};});
  await p.emulateMedia({media:'screen'});
  ok('6b on paper the chosen name prints, not the search box',pr.sel!=='none'&&pr.combo==='none'&&/\(/.test(pr.text),pr);
  ok('7 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
