/* Form TB-1, review Wave 3 part 1: lowering the target count asks first (F30); the bank leaves a student's examples out and can be
   deleted (F32); a cluster target's card takes its members (F33); candidates already taken are not taken again (F34); the pilot
   works out its percentage, marks one under 80% and holds the checklist row (F35); the form's conventions named (F38); the
   template off paper unless used, and the definitions alone (F39). Simulated data only. usage: node qa/tb1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TB-1_'));await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__asked=[];window.__answer=true;
      if(window.nbhUI){nbhUI.confirm=async m=>{window.__asked.push(m);return window.__answer;};nbhUI.toast=()=>{};}});return p;};
  const put=(p,n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector(`[name="${n}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
  const setN=(p,v)=>p.evaluate(v=>{const e=document.getElementById('nTgt');e.value=String(v);e.dispatchEvent(new Event('change',{bubbles:true}));},v);
  const cards=p=>p.evaluate(()=>document.querySelectorAll('#tgtWrap .card').length);
  /* ---- F30 ---- */
  const p=await open();
  await put(p,'tgt[3].lab','Spitting (simulated)');
  await p.evaluate(()=>{window.__answer=false;});await setN(p,3);await sleep(200);
  const a1={n:await p.evaluate(()=>document.getElementById('nTgt').value),cards:await cards(p),asked:await p.evaluate(()=>window.__asked.slice()),lab:await p.evaluate(()=>document.querySelector('[name="tgt[3].lab"]').value)};
  await p.evaluate(()=>{window.__answer=true;window.__asked=[];});await setN(p,3);await sleep(200);
  const a2={n:await p.evaluate(()=>document.getElementById('nTgt').value),cards:await cards(p)};
  await p.evaluate(()=>{window.__asked=[];});await setN(p,2);await sleep(200);
  const a3={cards:await cards(p),asked:await p.evaluate(()=>window.__asked.length)};
  ok('1 F30 lowering the count past a target that holds text asks first; Cancel keeps it, Remove removes it; an empty target goes without a question',
    a1.n==='4'&&a1.cards===4&&a1.asked.length===1&&/^Remove target “Spitting \(simulated\)”\?/.test(a1.asked[0])&&a1.lab==='Spitting (simulated)'&&a2.n==='3'&&a2.cards===3&&a3.cards===2&&a3.asked===0,{a1,a2,a3});
  /* ---- F32 ---- */
  const q=await open();
  await put(q,'tgt[0].lab','Hand flapping (simulated)');await put(q,'tgt[0].def','Moving both hands up and down at the wrist three or more times in a row.');
  await put(q,'tgt[0].ex','Flapping both hands while Ana Rivera (simulated) reads in Room 12');await put(q,'tgt[0].nex','Waving goodbye');await put(q,'tgt[0].border','Clapping: not scored');
  /* the bank as the browser keeps it (IndexedDB nbh-tb1-bank) */
  const bankAll=()=>q.evaluate(()=>new Promise(res=>{const o=indexedDB.open('nbh-tb1-bank',1);o.onsuccess=()=>{try{const x=o.result.transaction('defs','readonly').objectStore('defs').getAll();x.onsuccess=()=>res(x.result||[]);x.onerror=()=>res([]);}catch(e){res([]);}};o.onerror=()=>res([]);}));
  const save=async noex=>{await q.evaluate(()=>document.querySelector('#tgtWrap .card[data-tgt="0"] .tb1lib-host').shadowRoot.querySelector('.bank').click());await sleep(300);
    await q.evaluate(nx=>{const d=document.getElementById('tb1BankHost').shadowRoot.querySelector('dialog');const c=d.querySelector('.bknoex');window.__noexDefault=c.checked;c.checked=nx;d.querySelector('.bksave').click();},noex);await sleep(600);
    return {def0:await q.evaluate(()=>window.__noexDefault),list:(await bankAll()).map(e=>({lab:e.lab,def:e.def,ex:e.ex,nex:e.nex,border:e.border}))};};
  const b1=await save(true);
  await put(q,'tgt[0].lab','Hand flapping, both hands (simulated)');const b2=await save(false);
  const guide=await q.evaluate(()=>document.getElementById('guide').textContent.replace(/\s+/g,' '));
  ok('2 F32 the bank leaves the examples, non-examples and borderline cases out unless asked, and says why; the Guide says what the bank keeps on the device',
    b1.def0===true&&b1.list.length===1&&b1.list[0].def&&b1.list[0].ex===''&&b1.list[0].nex===''&&b1.list[0].border===''&&b2.list.some(e=>/both hands/.test(e.lab)&&/Ana Rivera/.test(e.ex))
    &&/stays in this browser, on this device, for every student, until it is removed or the bank is deleted \(Delete my bank in the library panel\)/.test(guide),{b1,b2,g:guide.slice(0,200)});
  await q.evaluate(()=>{window.__asked=[];document.getElementById('tb1LibPanel').shadowRoot.querySelector('.bclear').click();});await sleep(800);
  const b3=Object.assign(await q.evaluate(()=>({asked:window.__asked.slice(),note:document.getElementById('tb1LibPanel').shadowRoot.querySelector('.bn').textContent})),{n:(await bankAll()).length});
  ok('3 F32 Delete my bank empties the bank in this browser after a question',b3.asked.length===1&&/^Delete the 2 definitions in my bank from this browser\?/.test(b3.asked[0])&&b3.n===0&&/empty/.test(b3.note),b3);
  /* ---- F33 ---- */
  const r=await open();
  await put(r,'clus[0].lab','Aggression (simulated)');await put(r,'clus[0].fn','Escape / avoidance (social negative)');
  await put(r,'clus[0].top[0].f','Hitting an adult (simulated)');await put(r,'clus[0].top[0].d','Count / rate');await put(r,'clus[0].top[1].f','Kicking an adult (simulated)');await put(r,'clus[0].top[1].d','Count / rate');
  await put(r,'tgt[0].lab','Aggression (simulated)');await put(r,'tgt[0].type','Cluster (multiple topographies)');await sleep(400);
  const g=n=>r.evaluate(n=>document.querySelector(`[name="${n}"]`).value,n);
  const c1={tops:await g('tgt[0].tops'),fn:await g('tgt[0].fn'),dim:await g('tgt[0].dim'),clus:await g('tgt[0].clus')};
  await put(r,'clus[0].top[2].f','Scratching an adult (simulated)');await sleep(400);const c2=await g('tgt[0].tops');
  await put(r,'tgt[0].tops','Hitting and kicking');await sleep(400);
  const c3={tops:await g('tgt[0].tops'),note:await r.evaluate(()=>(document.querySelector('#tgtWrap .card .tbc-note')||{}).textContent||'')};
  ok('4 F33 a cluster target takes its members, function, dimension and cluster number from sheet 3, follows a member added there, and keeps a list typed on the card with a note',
    c1.tops==='Hitting an adult (simulated)\nKicking an adult (simulated)'&&c1.fn==='Escape / avoidance (social negative)'&&c1.dim==='Count / rate'&&c1.clus==='1'
    &&c2==='Hitting an adult (simulated)\nKicking an adult (simulated)\nScratching an adult (simulated)'&&c3.tops==='Hitting and kicking'&&/differ from Cluster 1’s members on sheet 3/.test(c3.note),{c1,c2,c3});
  /* ---- F34 ---- */
  const s=await open();
  await s.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
  const n0=await s.evaluate(()=>document.getElementById('nTgt').value);
  await s.evaluate(()=>document.getElementById('selFromCand').click());await sleep(300);
  const d1={n:await s.evaluate(()=>document.getElementById('nTgt').value),note:await s.evaluate(()=>document.getElementById('selNote').textContent)};
  const t=await open();
  await put(t,'cand[0].beh','Elopement from the classroom (simulated)');await put(t,'cand[0].dec','Target – single topography');
  await put(t,'cand[1].beh','Spitting at peers (simulated)');await put(t,'cand[1].dec','Target – single topography');
  await put(t,'sel[0].lab','Elopement (simulated)');
  await t.evaluate(()=>document.getElementById('selFromCand').click());await sleep(300);
  const d2=await t.evaluate(()=>[0,1,2,3].map(i=>document.querySelector(`[name="sel[${i}].lab"]`).value));
  await t.evaluate(()=>document.getElementById('selFromCand').click());await sleep(300);
  const d3=await t.evaluate(()=>[0,1,2,3].map(i=>document.querySelector(`[name="sel[${i}].lab"]`).value));
  ok('5 F34 candidates already in the targets, under a label written for the BIP or taken by the button before, are not added again',
    d1.n===n0&&/Every candidate marked Target is in the targets already/.test(d1.note)&&d2.join('|')==='Elopement (simulated)|Spitting at peers (simulated)||'&&d3.join('|')===d2.join('|'),{n0,d1,d2,d3});
  /* ---- F35 ---- */
  const io=()=>s.evaluate(()=>[0,1,2,3,4].map(t=>{const a=document.querySelector(`[name="ioa[${t}].a"]`),q=document.querySelector(`[name="qc[${t}].18"]`);return {a:a.value,ro:a.readOnly,low:a.closest('tr').classList.contains('ioa-low'),qd:q.disabled,qc:q.checked};}));
  const e1=await io();
  await put(s,'ioa[0].x','14');const e2=await io();
  await put(s,'ioa[0].x','19');const e3=await io();
  await put(s,'ioa[2].x','3');await put(s,'ioa[2].y','4');const e4=await io();
  ok('6 F35 the pilot works out each percentage from the counts (agreements over intervals, or the smaller total over the larger) and keeps it read-only',
    e1.map(x=>x.a).join()==='95,90,100,92.3,88'&&e1.every(x=>x.ro&&!x.low&&!x.qd&&x.qc)&&e4[2].a==='75',{e1,e4});
  ok('7 F35 a pilot under 80% is marked and its checklist row is unticked and held until a pilot reaches 80%',
    e2[0].a==='70'&&e2[0].low&&e2[0].qd&&!e2[0].qc&&e3[0].a==='95'&&!e3[0].low&&!e3[0].qd&&!e3[0].qc&&e4[2].low&&e4[2].qd,{e2:e2[0],e3:e3[0],e4:e4[2]});
  const fo=await s.evaluate(()=>window.__nbhFactsOut().behaviors.map(b=>b.ioa));
  ok('8 F35 each target\'s pilot goes to the case: date, index, percentage and whether it reached 80%',fo.length>=4&&fo[0]&&fo[0].pct===95&&fo[0].met===true&&/exact count/.test(fo[0].index)&&!!fo[0].date&&fo[2].pct===75&&fo[2].met===false,fo);
  /* ---- F38 ---- */
  const src=await s.evaluate(()=>[...document.querySelectorAll('#qcBody tr')].map(tr=>tr.children[1].textContent));
  ok('9 F38 the checklist names the form\'s own conventions as such',src[5]==='Form convention (Guide section 4); cf. Kazdin, 2011'&&src[6]===src[5]&&/^Form convention \(Guide section 2\); cf\. Johnston & Pennypacker, 2009/.test(src.find(x=>/Guide section 2/.test(x))||''),src.slice(4,12));
  /* ---- F39 ---- */
  const shown=async(pg,what)=>{await pg.evaluate(w=>{document.getElementById('tbPrintWhat').value=w;},what);await pg.emulateMedia({media:'print'});await pg.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const d=await pg.evaluate(()=>['#rrbTpl','#guide','#refs','#define'].map(q=>getComputedStyle(document.querySelector(q)).display));await pg.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await pg.emulateMedia({media:'screen'});
    return d.concat(await pg.evaluate(()=>document.body.classList.contains('tb-defs-only')));};
  const blank=await open();const f1=await shown(blank,'all'),f2=await shown(s,'all'),f3=await shown(s,'defs');
  ok('10 F39 a plan with no RRB target leaves the template and the distance table off paper; one that uses them prints them',f1[0]==='none'&&f1[3]!=='none'&&f2[0]!=='none',{f1,f2});
  ok('11 F39 "The definitions only" leaves the Guide and the References off paper, once',f3[1]==='none'&&f3[2]==='none'&&f3[3]!=='none'&&f3[4]===false&&f2[1]!=='none',{f2,f3});
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
