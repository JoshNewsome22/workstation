/* Form RR-1, review Wave 3 part 4 (I12): one timeline of the record on the Synthesis sheet. The incidents, the ledger's removals,
   the medication starts and changes, the dated events and the absence dates on one date axis, a lane each; the dated events
   numbered and listed; the incidents in the 14 days before and from each change counted. Display only.
   Simulated data only. usage: node qa/rr1-w3d-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  /* the simulations date the record back from the last school day; the dates below are those of Saturday 17 October 2026 */
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.setFixedTime(new Date(2026,9,17,12,0,0));await p.goto(L.BASE+'/NBH-Workstation/'+file('RR-1_'));await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const sim=async k=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(900);};
  const look=()=>p.evaluate(()=>{const svg=document.querySelector('#rrTl svg');const q=s=>svg?[...svg.querySelectorAll(s)]:[];
    return {hidden:document.getElementById('rrTlWrap').hidden,hint:document.getElementById('rrTlHint').hidden?'':document.getElementById('rrTlHint').textContent,
      lanes:q('text').filter(t=>t.getAttribute('x')==='6').map(t=>t.textContent),inc:q('line[stroke="#254657"]').length,rem:q('rect[fill="#9b4e15"]').length,
      medFull:q('path[fill="#0E5C63"]').length,medHollow:q('path[fill="#ffffff"]').length,ev:q('circle').map(c=>c.nextElementSibling.textContent),ab:q('line[stroke="#7d8f89"]').length,
      early:q('text[font-style="italic"]').map(t=>t.textContent).join(''),legend:[...document.querySelectorAll('#rrTlEv li')].map(l=>l.textContent),
      around:document.getElementById('rrTlAround').textContent,label:svg?svg.getAttribute('aria-label'):''};});
  /* ---- the escape simulation ---- */
  await sim('escape');const a=await look();
  ok('1 I12 the timeline: incidents, removals, medication and dated events, one lane each, on one axis',!a.hidden&&a.lanes.join('|')==='Incidents|Removals (ledger)|Medication|Dated events'&&a.inc===11&&a.rem===3&&a.label==='Timeline of the record, 9/3/2026 to 10/14/2026: 11 incidents, 3 removals, 2 medication starts and changes, 2 dated events',a);
  ok('2 I12 the medication change read from the "Changes" text; a start two years earlier is named at the left edge, not drawn',a.medHollow===1&&a.medFull===0&&a.early==='◂ Methylphenidate started 9/1/2024',a);
  ok('3 I12 the dated events numbered on the axis and listed under it',a.ev.join()==='1,2'&&a.legend.join(' | ')==='9/3/2026 · Schedule / staff change: New para assigned to math block | 9/18/2026 · Medication change / stop: Methylphenidate increased',a.legend);
  ok('4 I12 the incidents on record before and from each change are counted once a change (the event that repeats the medication change is not counted twice); the record\'s first incident is named',
    a.around==='Incidents on record in the 14 days before and the 14 days from each change: 9/3/2026, event 1 (schedule / staff change): 0 and 3; 9/18/2026, Methylphenidate ER changed: 4 and 4. The record’s first incident is 9/9/2026. Counts only.',a.around);
  /* ---- absence dates and a second medication, live ---- */
  const b=await p.evaluate(()=>{const s=(k,v)=>{const e=document.querySelector('[name="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('a.dates','9/8, 9/22/2026 and 2026-10-06');s('md[1].n','Guanfacine (simulated)');s('md[1].start','2026-09-25');s('md[1].chg','increased 10/2; stopped 10/9/2026');return 1;});
  const c=await look();
  ok('5 I12 absence dates typed on the Incidents sheet (a year inferred where left out) add an Absences lane; a second medication\'s start and changes are drawn, as soon as they are entered',
    c.lanes.join('|')==='Incidents|Removals (ledger)|Medication|Dated events|Absences'&&c.ab===3&&c.medFull===1&&c.medHollow===3&&/10\/2\/2026, Guanfacine \(simulated\) changed: 4 and 3; 10\/9\/2026, Guanfacine \(simulated\) changed: 3 and 2\./.test(c.around),c);
  /* ---- printing, and nothing new saved but the absence dates ---- */
  await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>({fig:getComputedStyle(document.getElementById('rrTlWrap')).display,hint:getComputedStyle(document.getElementById('rrTlHint')).display}));await p.emulateMedia({media:'screen'});
  ok('6 I12 the timeline prints on the Synthesis sheet',pr.fig!=='none',pr);
  const saved=await p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  ok('7 I12 display only: the saved file holds the absence dates field and no figure',saved&&JSON.parse(saved).fields['a.dates']==='9/8, 9/22/2026 and 2026-10-06'&&!/rrTl|<svg/.test(saved),saved&&saved.length);
  /* ---- too little to align ---- */
  await sim('attn');const d=await look();
  ok('8 I12 with incidents and nothing else dated, no figure; the screen says what it needs (not printed)',d.hidden&&/appears here once incidents or removals and one other kind of dated entry/.test(d.hint),d);
  await p.emulateMedia({media:'print'});const h2=await p.evaluate(()=>getComputedStyle(document.getElementById('rrTlHint')).display);await p.emulateMedia({media:'screen'});
  ok('9 I12 the hint does not print',h2==='none',h2);
  await sim('setting');const e=await look();
  ok('10 I12 the setting-event simulation: no removals lane, the medication and the change at home on the axis',!e.hidden&&e.lanes.join('|')==='Incidents|Medication|Dated events'&&e.inc===8&&/9\/4\/2026, event 1 \(change at home\): 0 and 2; 9\/17\/2026, Risperidone changed: 2 and 3\./.test(e.around),e);
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
