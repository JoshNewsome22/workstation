/* v25.68 wave 1, forms: the BCBA's four decisions of 11/6 and four research recommendations, at least one check each.
   Simulated data only ("Sample Student", "S.S.", the simulated BCBA "Jordan Ellis"); no participant or student names.
   SR   decision 1  SR-1's family paragraphs for "FCT or DRA without extinction" and "A wait that ends on what the student does"
                    carry no "New wording" mark
   TK   decision 2  TK-1 "when the board is full": the Choices back and Step 1 say the learner chooses at the exchange, in that
                    mode only; an edited back is kept; the narration is as it was
   TB   decision 3  a TB-1 target card's Measure and Criterion fields: empty to start, printed when filled, sent with the target
        decision 4  the replacement-behavior picker fills a Replacement-type card (with Replace / Fill empty fields only, and undo)
   IP   research #1 the implementation plan for each adult: ST-1 records it, QS-1 or EB-1 prints it on the adult's page, TI-1
                    checks it at the first visit (3 to 5 school days in)
   FB   research #4 TI-1's Send feedback: one short message (own graph, one praise, one step, next check), sent as the
                    questionnaires are (the workstation's mail request) or printed as a slip, logged, initials only
   EBD  research #8 PR-1's E/BD eligibility evidence page: a task list with statuses and sources, what is missing, never a verdict
   AR   research #20 PR-1's exit archive: retention dates, the countdown only after the BCBA confirms district storage, one index line
   PAD  the new parts on an iPad sideways and upright (Chromium with an iPad's user agent and touch): no page-wide scroll, 44 px targets
   usage: WS_URL=http://127.0.0.1:8642 WS_ROOT=. node qa/v2568-forms-test.js [section...] */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const FILE=id=>L.forms().find(x=>x.id===id).file;
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k);
const SHOTS=path.join(__dirname,'out','v2568-forms');try{fs.mkdirSync(SHOTS,{recursive:true});}catch(e){}
/* the v25.65 test's simulated TB-1 case, saved by the form before v25.67 */
const OLD_TB=(()=>{const src=fs.readFileSync(path.join(__dirname,'v2565-tb1lib-test.js'),'utf8');const m=/const OLD=(\{.*?\});\n/.exec(src);return JSON.parse(m[1]);})();
(async()=>{const br=await L.chromium.launch();const errs=[];
 const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block',acceptDownloads:true});
 const open=async(id,c)=>{const p=await (c||ctx).newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
   await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(FILE(id)));await sleep(1300);await p.evaluate(()=>{window.alert=()=>{};}).catch(()=>{});return p;};
 const sim=async p=>{await L.loadSim(p);await sleep(900);await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('button.primary,button.danger')||[...d.querySelectorAll('button')].pop();b&&b.click();}});await sleep(900);};
 const sec=async(k,fn)=>{if(!want(k))return;try{await fn();}catch(e){ok(k+': the section ran to the end',false,String(e&&e.stack||e));}};
 const printShown=async(p,sel,pg)=>{const m=pg||p;await m.emulateMedia({media:'print'});const r=await p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>getComputedStyle(e).display!=='none'&&!!e.offsetParent),sel);await m.emulateMedia({media:'screen'});return r;};
 const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);

 /* ---------------- SR: decision 1 ---------------- */
 await sec('SR',async()=>{
  const s=await open('SR-1');
  const h=await s.evaluate(async()=>{const set=(k,v)=>{S.meta[k]=v;};const out={};
    S.meta.client='SIMULATED – Sample Student';set('beh','Hitting');set('alt','the break card');set('sr','a short break with the drawing kit');set('func','Escape or avoidance');
    set('ds_sel','nox');renderAll();await new Promise(r=>setTimeout(r,200));out.nox=window.srHome();out.noxBox=(document.getElementById('srHomeOut')||{}).textContent||'';out.noxNote=!!document.getElementById('srHomeNew');
    Object.assign(S.meta,{ds_sel:'wait',wt_sig:'“Wait, please,” and the wait card',wt_does:'holds the wait card and keeps working',wt_item:'a puzzle on the desk',wt_s0:'5',wt_sT:'60'});renderAll();await new Promise(r=>setTimeout(r,200));
    out.wait=window.srHome();out.waitBox=(document.getElementById('srHomeOut')||{}).textContent||'';out.waitNote=!!document.getElementById('srHomeNew');
    out.src=[...document.scripts].map(x=>x.textContent).join('\n');return out;});
  ok('SR 1 "FCT or DRA without extinction": the family version is written (English) and carries no "New wording" mark',h.nox&&/Asking always works better/.test(h.nox.en)&&!h.nox.fresh&&!h.noxNote&&!/New wording/.test(h.noxBox),{nox:h.nox,box:h.noxBox.slice(0,200)});
  ok('SR 2 "A wait that ends on what the student does": the family version is written and carries no "New wording" mark',h.wait&&/holds the wait card and keeps working/.test(h.wait.en)&&!h.wait.fresh&&!h.waitNote&&!/New wording/.test(h.waitBox),{wait:h.wait,box:h.waitBox.slice(0,200)});
  ok('SR 3 the Spanish paragraph of each design is still made (the wait waits for its own words in Spanish)',/Pedir siempre funciona mejor/.test(h.nox.draftEs||'')&&/aprendiendo a esperar/.test(h.wait.draftEs||''),{nox:(h.nox.draftEs||'').slice(0,80),wait:(h.wait.draftEs||'').slice(0,80)});
  ok('SR 4 no "New wording" note is left anywhere in the form',!/New wording for this design/.test(h.src));
  await s.close();});

 /* ---------------- TK: decision 2 ---------------- */
 await sec('TK',async()=>{
  const p=await open('TK-1');await sim(p);
  const r=await p.evaluate(async()=>{const sel=document.querySelector('[data-m="ch_when"]'),w=ms=>new Promise(r=>setTimeout(r,ms));const o={};
    const book=()=>(document.getElementById('book')||{}).textContent||'';
    o.d0={cb:S.txt.cb,h1:S.txt.h1,tb:S.txt.tb,book:book()};
    sel.value='full';sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));await w(700);
    o.full={cb:S.txt.cb,h1:S.txt.h1,tb:S.txt.tb,book:book(),bk:(document.getElementById('bkOut')||{}).textContent||'',ta:(document.querySelector('textarea[data-b="cb"]')||{}).value||''};
    sel.value='';sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));await w(500);
    o.back={cb:S.txt.cb,h1:S.txt.h1};
    /* an edited back stays as written */
    S.txt.cb=S.txt.cb+' Our own line.';sel.value='full';sel.dispatchEvent(new Event('change',{bubbles:true}));await w(500);o.edited={cb:S.txt.cb,h1:S.txt.h1};
    sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));await w(300);S.txt.cb=TXT0.cb;renderAll();await w(300);
    /* the Rules row layout takes the mode too; a bus book never does */
    const lay=document.querySelector('[data-m="layout"]');lay.value='rules';lay.dispatchEvent(new Event('change',{bubbles:true}));await w(400);
    sel.value='full';sel.dispatchEvent(new Event('change',{bubbles:true}));await w(500);o.rules={cb:S.txt.cb,h1:S.txt.h1};
    S.meta.kind='bus';renderAll();await w(500);o.bus={cb:S.txt.cb,h1:S.txt.h1,isDef:txtIsDef('cb',S.txt.cb),bus:TXT_BUS.cb};
    S.meta.kind='';lay.value='ft';lay.dispatchEvent(new Event('change',{bubbles:true}));sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));await w(400);
    o.src=[...document.scripts].map(x=>x.textContent).join('\n');return o;});
  ok('TK 1 the default mode ("before the work") keeps the Choices back and Step 1 as they were: choose before the task',/before a task begins, so they can choose what they are working for/.test(r.d0.cb)&&/^STEP 1 : YOUR LEARNER PICKS SOMETHING TO EARN/.test(r.d0.h1)&&/under the word “Then\.”/.test(r.d0.cb),{cb:r.d0.cb.slice(0,160)});
  ok('TK 2 "when the board is full": the Choices back says the learner chooses at the exchange, when the board is full',/chooses \*\*when the board is full\*\*, at the exchange/.test(r.full.cb)&&/When the last \{token\} goes on the board, show the learner the choice board and let them select the item to trade the \{tokens\} for/.test(r.full.cb)&&!/before a task begins/.test(r.full.cb),r.full.cb.slice(0,400));
  ok('TK 3 "when the board is full": Step 1 says the same, under the heading "YOUR LEARNER PICKS AT THE EXCHANGE"',/^STEP 1 : YOUR LEARNER PICKS AT THE EXCHANGE\n/.test(r.full.h1)&&/at the exchange/.test(r.full.h1)&&/give that item right away/.test(r.full.h1),r.full.h1.slice(0,300));
  ok('TK 4 the printed book and the backs editor show the mode\'s words; the Token Board back is unchanged',/at the exchange/.test(r.full.book)&&/at the exchange/.test(r.full.ta)&&r.full.tb===r.d0.tb,{book:/at the exchange/.test(r.full.book),ta:r.full.ta.slice(0,80)});
  ok('TK 5 back to "before the work": the default text returns, word for word',r.back.cb===r.d0.cb&&r.back.h1===r.d0.h1);
  ok('TK 6 a back edited by hand is kept as written when the mode changes',/Our own line\.$/.test(r.edited.cb)&&/before a task begins/.test(r.edited.cb)&&/PICKS AT THE EXCHANGE/.test(r.edited.h1),r.edited.cb.slice(-120));
  ok('TK 7 the Rules row layout takes the mode (its Earn box line replaced too); a bus book keeps its own text',/at the exchange/.test(r.rules.cb)&&!/green \*\*Earn\*\* box/.test(r.rules.cb)&&/give that item right away/.test(r.rules.cb)&&r.bus.cb===r.bus.bus,{rules:r.rules.cb.slice(-300),bus:r.bus.cb===r.bus.bus});
  ok('TK 8 the narration stays as it is (it shows choosing before the work)',/exchange:'The board is full, so trade the tokens for the Then item right away/.test(r.src)&&/tok_last:'One more interval with the target behavior, and the last token goes in\. Now the board is full, and your learner has earned the item they chose\.'/.test(r.src));
  await p.close();});

 /* ---------------- TB: decisions 3 and 4 ---------------- */
 await sec('TB',async()=>{
  const p=await open('TB-1');
  await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#viewSeg button[data-view="define"]').click();});await sleep(400);
  const f0=await p.evaluate(()=>({ms:!!document.querySelector('[name="tgt[0].measure"]'),cr:!!document.querySelector('[name="tgt[0].crit"]'),
    v:[document.querySelector('[name="tgt[0].measure"]').value,document.querySelector('[name="tgt[0].crit"]').value],
    lab:[...document.querySelectorAll('#tgtCard0 .drow.tb-mc .dlab')].map(x=>x.textContent),empty:[...document.querySelectorAll('#tgtCard0 .drow.tb-mc')].every(r=>r.classList.contains('tb-mc-empty'))}));
  ok('TB 1 every target card has a Measure (what is counted and how) and a Criterion field, empty to start',f0.ms&&f0.cr&&f0.v.join('')===''&&f0.empty&&f0.lab[0]==='Measure (what is counted and how)'&&f0.lab[1]==='Criterion',f0);
  await p.fill('[name="tgt[0].lab"]','Elopement from the assigned area');await p.dispatchEvent('[name="tgt[0].lab"]','change');
  await p.fill('[name="tgt[0].measure"]','Count each departure past the doorway; the minutes away on the duration sheet');
  const pr=await printShown(p,'#tgtCard0 .drow.tb-mc');
  ok('TB 2 printed only when filled: the Measure row prints, the empty Criterion row does not',pr[0]===true&&pr[1]===false,pr);
  const fx=await p.evaluate(()=>{const o=window.__nbhFactsOut();return (o&&o.behaviors||[]).map(b=>({label:b.label,measure:b.measureText,crit:b.criterionText,has:'criterionText' in b}));});
  ok('TB 3 the measure goes to the case with the target (behaviors[i].measureText); an empty criterion adds nothing',fx[0]&&fx[0].label==='Elopement from the assigned area'&&/Count each departure/.test(fx[0].measure)&&!fx[0].has,fx);
  /* decision 4: a Replacement-type card */
  await p.selectOption('[name="tgt[1].type"]','Replacement / alternative behavior');await sleep(300);
  const pl=await p.evaluate(()=>{const host=document.querySelector('#tgtCard1 .tb1rlib-host');return {top:!!host.closest('.tb1rlib-top'),btn:host.shadowRoot.querySelector('button.open').textContent,
    other:!!document.querySelector('#tgtCard0 .tb1rlib-host').closest('.dval')};});
  ok('TB 4 on a Replacement-type card the picker moves to the top of the card as "Fill this card from the replacement-behavior library"; other cards keep it beside their replacement field',pl.top&&/^Fill this card from the replacement-behavior library$/.test(pl.btn)&&pl.other,pl);
  const H1='#tgtCard1 .tb1rlib-host';
  await p.locator(H1+' button.open').click();await sleep(250);
  await p.locator(H1+' .it[data-id="r-break"]').click();await sleep(400);
  const E=await p.evaluate(()=>TB1_RLIB.entries.find(e=>e.id==='r-break'));
  const c1=await p.evaluate(()=>{const g=k=>document.querySelector('[name="tgt[1].'+k+'"]').value;return {lab:g('lab'),def:g('def'),ex:g('ex'),nex:g('nex'),measure:g('measure'),crit:g('crit'),rep:g('rep'),
    msg:document.querySelector('#tgtCard1 .tb1rlib-host').shadowRoot.querySelector('.msg').textContent,undo:!document.querySelector('#tgtCard1 .tb1rlib-host').shadowRoot.querySelector('.undo').hidden,
    ttl:document.getElementById('tgtTtl1').textContent,mcEmpty:[...document.querySelectorAll('#tgtCard1 .drow.tb-mc')].map(r=>r.classList.contains('tb-mc-empty'))};});
  ok('TB 5 choosing "Asks for a break" fills the card: label, definition, examples, non-examples, measure and criterion (the replacement field untouched)',c1.lab===E.lab&&c1.def===E.def&&c1.ex===E.ex&&c1.nex===E.nex&&c1.measure===E.measure&&c1.crit===E.crit&&c1.rep===''&&c1.ttl===E.lab&&/Filled from the library: Asks for a break/.test(c1.msg)&&c1.undo&&c1.mcEmpty.every(x=>!x),c1);
  const fr=await p.evaluate(()=>{const o=window.__nbhFactsOut();return (o.behaviors||[]).find(b=>b.isRep)||null;});
  ok('TB 6 the replacement target goes to the case with its measure and criterion',fr&&fr.label===E.lab&&fr.measureText===E.measure&&fr.criterionText===E.crit,fr);
  /* undo, then a clash: Fill empty fields only keeps a typed definition and leaves the dependent fields empty */
  await p.locator(H1+' .undo').click();await sleep(300);
  const u=await p.evaluate(()=>{const g=k=>document.querySelector('[name="tgt[1].'+k+'"]').value;return ['lab','def','ex','nex','measure','crit'].map(g).join('');});
  ok('TB 7 Undo the fill puts the card back as it was',u==='',u);
  await p.fill('[name="tgt[1].def"]','Our team’s own definition of the break request (simulated).');await p.dispatchEvent('[name="tgt[1].def"]','input');
  await p.evaluate(()=>{window.confirm=(m)=>{window.__asked=(window.__asked||[]).concat([m]);return (window.__asked.length%2)===0;};});   /* first question Replace? no; then Fill empty only? yes */
  await p.locator(H1+' .it[data-id="r-break"]').click();await sleep(500);
  const c2=await p.evaluate(()=>{const g=k=>document.querySelector('[name="tgt[1].'+k+'"]').value;return {lab:g('lab'),def:g('def'),ex:g('ex'),measure:g('measure'),asked:window.__asked||[],msg:document.querySelector('#tgtCard1 .tb1rlib-host').shadowRoot.querySelector('.msg').textContent};});
  ok('TB 8 with a definition typed, "Fill empty fields only" keeps it, fills the label, and leaves the examples, non-examples, measure and criterion empty',c2.def==='Our team’s own definition of the break request (simulated).'&&c2.lab===E.lab&&c2.ex===''&&c2.measure===''&&c2.asked.length===2&&/were left empty/.test(c2.msg),c2);
  await p.evaluate(()=>{window.confirm=()=>true;});
  await p.locator(H1+' .it[data-id="r-help"]').click();await sleep(500);
  const E2=await p.evaluate(()=>TB1_RLIB.entries.find(e=>e.id==='r-help'));
  const c3=await p.evaluate(()=>{const g=k=>document.querySelector('[name="tgt[1].'+k+'"]').value;return {lab:g('lab'),def:g('def'),measure:g('measure')};});
  ok('TB 9 with Replace the card takes the entry in full',c3.lab===E2.lab&&c3.def===E2.def&&c3.measure===E2.measure,c3);
  await p.type('[name="tgt[1].crit"]',' Checked monthly.');await sleep(200);
  const nou=await p.evaluate(()=>{const R=document.querySelector('#tgtCard1 .tb1rlib-host').shadowRoot;return {undo:R.querySelector('.undo').hidden,nou:!R.querySelector('.nou').hidden};});
  ok('TB 10 an edit after the fill ends the undo, and the picker says so',nou.undo&&nou.nou,nou);
  /* a problem-behavior card still writes into its replacement field (v25.67) */
  await p.locator('#tgtCard0 .tb1rlib-host button.open').click();await sleep(250);await p.locator('#tgtCard0 .tb1rlib-host .it').first().click();await sleep(300);
  const r0=await p.evaluate(()=>({rep:document.querySelector('[name="tgt[0].rep"]').value,def:document.querySelector('[name="tgt[0].def"]').value}));
  ok('TB 11 on a problem-behavior card the picker still writes "label — definition" into the replacement field only',/ — /.test(r0.rep)&&r0.def==='',r0);
  /* the card's type changed back: the picker goes back beside the replacement field */
  await p.selectOption('[name="tgt[1].type"]','Single topography');await sleep(250);
  ok('TB 12 a card whose type changes from Replacement takes the picker back beside its replacement field',await p.evaluate(()=>!!document.querySelector('#tgtCard1 .tb1rlib-host').closest('.dval')&&!document.querySelector('#tgtCard1 .tb1rlib-top .tb1rlib-host')));
  /* a case saved before opens as saved, with no measure or criterion sent */
  const p2=await open('TB-1');
  await p2.evaluate(t=>{window.confirm=()=>true;const dt=new DataTransfer();dt.items.add(new File([t],'tb1-old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},JSON.stringify(OLD_TB));
  await sleep(1300);
  const d=await p2.evaluate(F=>{const bad=[];Object.keys(F).forEach(k=>{const el=document.querySelector('[name="'+k+'"]');if(!el){bad.push(k+' missing');return;}const v=el.type==='checkbox'?el.checked:el.value;if(v!==F[k])bad.push(k);});
    const o=window.__nbhFactsOut(),b=(o&&o.behaviors)||[];return {bad,sent:b.some(x=>'measureText' in x||'criterionText' in x),empty:[...document.querySelectorAll('.drow.tb-mc')].every(r=>r.classList.contains('tb-mc-empty')),n:document.querySelectorAll('.drow.tb-mc').length};},OLD_TB.fields);
  ok('TB 13 a TB-1 case saved before opens with every field as saved, its Measure and Criterion rows empty (not printed) and nothing new sent',d.bad.length===0&&!d.sent&&d.empty&&d.n>0,d);
  const pr2=await printShown(p2,'.drow.tb-mc');
  ok('TB 14 that case prints as before: no Measure or Criterion row reaches paper',pr2.length>0&&pr2.every(x=>!x),pr2);
  await p2.close();await p.close();});

 /* ---------------- IP: research #1 ---------------- */
 const PLAN={steps:'Steps 1 to 6 during reading group; the break card all day',when:'9:00 to 10:30, every school day',where:'The reading table',materials:'The break card, the timer, the point sheet',first:'2026-11-09',
   page:'QS-1',coping:[{barrier:'A substitute para on Fridays',fix:'The one-page card stays in the sub folder'},{barrier:'The timer is not at the table',fix:'A second timer lives in the reading bin'}],checkFrom:'2026-11-12',checkBy:'2026-11-16'};
 await sec('IP',async()=>{
  const st=await open('ST-1');
  await st.evaluate(()=>document.querySelector('#viewSeg button[data-view="sum"]').click());await sleep(300);
  const e0=await st.evaluate(()=>({box:!!document.getElementById('stIp'),empty:document.getElementById('stIp').classList.contains('st-ip-empty')}));
  const pe=await printShown(st,'#stIp');
  ok('IP 1 ST-1: each trainee has an Implementation Plan on the Competency sheet; empty, it does not print',e0.box&&e0.empty&&pe[0]===false,{e0,pe});
  await st.evaluate(async()=>{const set=(k,v)=>{const el=document.querySelector('[data-m="'+k+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set('trainee','Jordan Ellis (simulated)');set('pos','Paraprofessional');set('ip_steps','Steps 1 to 6 during reading group');set('ip_when','9:00 to 10:30');set('ip_where','The reading table');set('ip_mat','The break card and the timer');
    set('ip_first','2026-11-09');set('ip_b1','A substitute para on Fridays');set('ip_f1','The card stays in the sub folder');set('ip_page','eb');
    window.__nbhFactsIn({plan:{adoption:{date:'2026-11-02',start:'2026-11-09',team:'simulated team'}}});await new Promise(r=>setTimeout(r,300));});
  const s1=await st.evaluate(()=>{const o=window.__nbhStaffFacts(),p=(o&&o.people||[])[0]||{};return {p,check:document.getElementById('stIpCheck').textContent,adopt:document.getElementById('stIpAdopt').textContent,
    due:(window.__nbhDue()||[]).filter(x=>/implementation plan/.test(x.what)),empty:document.getElementById('stIp').classList.contains('st-ip-empty')};});
  ok('IP 2 the plan goes to the case with the adult (staff.people[i].plan): steps, when, where, materials, first day, the coping plan and their page',s1.p.name==='Jordan Ellis (simulated)'&&s1.p.plan&&s1.p.plan.steps==='Steps 1 to 6 during reading group'&&s1.p.plan.first==='2026-11-09'&&s1.p.plan.page==='EB-1'&&s1.p.plan.coping.length===1&&s1.p.plan.coping[0].fix==='The card stays in the sub folder'&&!s1.empty,s1.p);
  ok('IP 3 the check falls at the first TI-1 visit, 3 to 5 school days after the first day (11/12 to 11/16 for Monday 11/9), and is on the Due list',s1.p.plan.checkFrom==='2026-11-12'&&s1.p.plan.checkBy==='2026-11-16'&&/between 11\/12\/2026 and 11\/16\/2026/.test(s1.check)&&s1.due.length===1&&s1.due[0].date==='2026-11-16',{check:s1.check,due:s1.due});
  ok('IP 4 ST-1 says when the plan was adopted on Form TD-1',/adopted on 11\/2\/2026/.test(s1.adopt),s1.adopt);
  /* a second trainee has a plan of their own */
  await st.evaluate(async()=>{document.getElementById('stAddBtn').click();await new Promise(r=>setTimeout(r,300));const el=document.querySelector('[data-m="trainee"]');el.value='Sample Para Two (simulated)';el.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
  const s2=await st.evaluate(()=>({v:document.querySelector('[data-m="ip_steps"]').value,ppl:(window.__nbhStaffFacts()||{people:[]}).people.map(p=>({n:p.name,plan:!!p.plan}))}));
  ok('IP 5 each trainee has their own plan: a new trainee starts empty, and only the first sends one',s2.v===''&&s2.ppl.length===2&&s2.ppl[0].plan&&!s2.ppl[1].plan,s2);
  const pr=await printShown(st,'#stIp');
  ok('IP 6 an empty plan (the open trainee) does not print',pr[0]===false,pr);
  await st.close();
  /* QS-1 prints the plan on the adult's page */
  const qs=await open('QS-1');await sim(qs);
  const q0=await qs.evaluate(()=>({n:document.querySelectorAll('#out .qs-page').length,foot:(document.querySelector('#out .qs-page .qs-foot')||{}).textContent||'',html:handoutHTML()}));
  await qs.evaluate(P=>{window.__nbhFactsIn({staff:{people:[{name:'Ms. Lee, teacher (simulated)',role:'',met:true,plan:P},{name:'Bus Driver (simulated)',role:'Driver',plan:Object.assign({},P,{page:'EB-1'})}],all:true}});},PLAN);await sleep(800);
  const q1=await qs.evaluate(()=>{const pg=[...document.querySelectorAll('#out .qs-page')];const ip=pg.filter(x=>x.classList.contains('qs-ip'));return {n:pg.length,ip:ip.length,txt:ip.map(x=>x.textContent).join(' '),foot:(pg[0].querySelector('.qs-foot')||{}).textContent||'',
    ipl:S.ipl,note:(document.getElementById('qsIpNote')||{}).textContent||''};});
  ok('IP 7 QS-1 prints the plan on that adult\'s page, one page, "My implementation plan", with the steps, when, where, materials, first day and the coping plan',q1.ip===1&&q1.n===q0.n+1&&/My implementation plan/.test(q1.txt)&&/Ms\. Lee, teacher \(simulated\)/.test(q1.txt)&&/The reading table/.test(q1.txt)&&/A substitute para on Fridays/.test(q1.txt)&&/The one-page card stays in the sub folder/.test(q1.txt)&&/Checked together at the first observation, between/.test(q1.txt),{n0:q0.n,q1:Object.assign({},q1,{txt:q1.txt.slice(0,300)})});
  ok('IP 8 the handout\'s page count follows (every footer reads "of '+(q0.n+1)+'"); the plan whose page is EB-1 is not on QS-1',new RegExp('Page 1 of '+(q0.n+1)).test(q1.foot)&&!/Bus Driver/.test(q1.txt)&&/Ms\. Lee/.test(q1.note),{foot:q1.foot,note:q1.note});
  await qs.evaluate(()=>{window.__nbhFactsIn({staff:{people:[{name:'Ms. Lee, teacher (simulated)',role:'',met:true}],all:true}});});await sleep(700);
  const q2a=await qs.evaluate(()=>({ip:document.querySelectorAll('#out .qs-page.qs-ip').length,ipl:'ipl' in S}));
  await qs.close();
  const qs2=await open('QS-1');await sim(qs2);const h0=await qs2.evaluate(()=>handoutHTML());
  await qs2.evaluate(()=>{window.__nbhFactsIn({staff:{people:[{name:'Ms. Lee, teacher (simulated)',role:'',met:true}],all:true}});});await sleep(700);
  const q2=await qs2.evaluate(()=>({html:handoutHTML(),ipl:'ipl' in S}));
  ok('IP 9 with no plan in the case the handout is exactly what it was (nothing added, nothing saved); a plan taken away goes from the handout',q2.html===h0&&!q2.ipl&&q2a.ip===0&&!q2a.ipl,{same:q2.html===h0,ipl:q2.ipl,q2a});
  const q3=await qs2.evaluate(()=>{const r=window.__nbhFactsPick({behaviors:[{label:'Leaving the reading table (simulated)',def:'Moves more than 1 m from the table without permission.',dim:'Frequency',measureText:'Count each departure; the minutes away on the duration sheet',src:'TB-1'},{label:'Calling out (simulated)',def:'Speaks without a raised hand.',dim:'Frequency',src:'TB-1'}]});
    return {r,rows:S.rec.filter(x=>/simulated\)$/.test(x.measure)).map(x=>({m:x.measure,how:x.how}))};});
  ok('TB 15 a form that reads TB-1\'s targets uses the measure: QS-1\'s record row takes it as "How" (a target without one reads as before)',q3.rows.length===2&&q3.rows[0].how==='Count each departure; the minutes away on the duration sheet'&&q3.rows[1].how==='Count each one',q3);
  await qs2.close();
  /* EB-1 */
  const eb=await open('EB-1');await sim(eb);
  const b0=await eb.evaluate(()=>({h:handoutHTML(val('m.client'),true),c:JSON.stringify(collect().f)}));
  await eb.evaluate(P=>{window.__nbhFactsIn({staff:{people:[{name:'Bus Driver (simulated)',role:'Driver',plan:Object.assign({},P,{page:'EB-1'})},{name:'Ms. Lee, teacher (simulated)',plan:P}]}});},PLAN);await sleep(700);
  const b1=await eb.evaluate(()=>{const h=handoutHTML(val('m.client'),true),c=collect();return {ip:(h.match(/class="eb-ip"/g)||[]).length,before:h.indexOf('class="eb-ip"')<h.indexOf('class="eb-ack"'),txt:h,ipl:c.ipl};});
  ok('IP 10 EB-1 prints the plan of the adult whose page is EB-1, after the brief and before the acknowledgment, and saves it with the brief',b1.ip===1&&b1.before&&/Bus Driver \(simulated\), Driver/.test(b1.txt)&&!/Ms\. Lee/.test(b1.txt)&&Array.isArray(b1.ipl)&&b1.ipl.length===1,{ip:b1.ip,before:b1.before,ipl:b1.ipl});
  const b2=await eb.evaluate(()=>{const d=collect();ebRecord(d);build(true);return {ip:((document.getElementById('out')||{}).innerHTML.match(/class="eb-ip"/g)||[]).length};});
  ok('IP 11 the saved brief opens with the plan page',b2.ip===1,b2);
  const eb2=await open('EB-1');await sim(eb2);const b3=await eb2.evaluate(()=>({h:handoutHTML(val('m.client'),true),c:JSON.stringify(collect().f),ipl:'ipl' in collect()}));
  ok('IP 12 a brief with no plan in the case prints and saves as before',b3.h===b0.h&&b3.c===b0.c&&!b3.ipl,{h:b3.h===b0.h,c:b3.c===b0.c,ipl:b3.ipl});
  await eb.close();await eb2.close();
  /* TI-1: the first visit's check */
  const ti=await open('TI-1');await sim(ti);
  const t0=await ti.evaluate(()=>({int:S.meta.int,box:(document.getElementById('tiIpBox')||{}).innerHTML||''}));
  await ti.evaluate(P=>{window.__nbhFactsIn({staff:{people:[{name:S.meta.int,role:'RBT',plan:Object.assign({},P,{first:(S.obs.map(o=>o.date).filter(Boolean).sort()[0])||'2026-11-09'})}]}});},PLAN);await sleep(500);
  await ti.evaluate(()=>document.querySelector('#viewSeg button[data-view="rt"]').click());await sleep(300);
  const t1=await ti.evaluate(()=>({h:document.getElementById('tiIpBox').textContent,sel:!!document.getElementById('tiIpRun'),plan:!!S.ipPlan,empty:document.getElementById('tiIpBox').classList.contains('ti-ip-empty')}));
  ok('IP 13 TI-1 shows the interventionist\'s plan from Form ST-1 to check at the first visit (3 to 5 school days in), with the steps run as planned and each barrier',t0.box===''&&t1.sel&&t1.plan&&/Implementation Plan, Checked at the First Visit/i.test(t1.h)&&/3 to 5 school days in/.test(t1.h)&&/A substitute para on Fridays/.test(t1.h),{t0:t0.box.slice(0,60),t1});
  const pe2=await printShown(ti,'#tiIpBox');
  ok('IP 14 the check does not print until something is recorded',pe2[0]===false,pe2);
  await ti.selectOption('#tiIpRun','Partly');await sleep(150);await ti.selectOption('#tiIpCame0','Yes');await sleep(150);await ti.selectOption('#tiIpWork0','No');await sleep(150);
  await ti.fill('#tiIpDate','2026-11-12');await ti.dispatchEvent('#tiIpDate','change');await sleep(200);
  const t2=await ti.evaluate(()=>{const o=window.__nbhFactsOut();return {ic:o&&o.integrity&&o.integrity.ipCheck,ipc:S.ipc};});
  ok('IP 15 the check goes to the case with the integrity (integrity.ipCheck): run as planned, each barrier, whether it came up and whether the fix worked',t2.ic&&t2.ic.run==='Partly'&&t2.ic.date==='2026-11-12'&&t2.ic.barriers[0].came==='Yes'&&t2.ic.barriers[0].worked==='No'&&/substitute/.test(t2.ic.barriers[0].barrier),t2);
  const pe3=await printShown(ti,'#tiIpBox');
  ok('IP 16 once recorded, the check prints',pe3[0]===true,pe3);
  await ti.close();});

 /* ---------------- FB: research #4 ---------------- */
 await sec('FB',async()=>{
  const url=L.BASE+'/NBH-Workstation/'+encodeURI(FILE('TI-1'));
  const host=await ctx.newPage();host.on('pageerror',e=>errs.push('host: '+e.message));
  await host.goto(L.BASE+'/NBH-Workstation/respond.html').catch(()=>{});
  /* the workstation's part, played by the page around the form: it takes the mail request and answers it as sent */
  await host.setContent('<!doctype html><title>host</title><body style="margin:0"><iframe id="f" src="'+url+'" style="width:1300px;height:900px;border:0"></iframe></body>');
  await host.evaluate(()=>{window.__mail=[];addEventListener('message',ev=>{const d=ev.data||{};if(d.nbh!=='mail')return;window.__mail.push(JSON.parse(JSON.stringify(d)));ev.source.postMessage({nbh:'mail-result',req:d.req,from:'jordan.ellis@example.org',results:(d.messages||[]).map(m=>({to:m.to,ok:true}))},'*');});});
  await sleep(2500);const fr=host.frames().find(f=>/TI-1_/.test(f.url()));
  await fr.evaluate(()=>{window.alert=()=>{};window.confirm=()=>true;});await L.loadSim(fr);await sleep(1200);
  await fr.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){const b=d.querySelector('button.primary,button.danger')||[...d.querySelectorAll('button')].pop();b&&b.click();}});await sleep(900);
  await fr.evaluate(()=>{S.meta.client='SIMULATED – Sample Student';S.meta.int='Sample Para (simulated)';renderAll();document.querySelector('#viewSeg button[data-view="rt"]').click();});await sleep(500);
  const p0=await fr.evaluate(()=>{const k=window.__ti2568.pick,M=window.__ti2568.message(k);return {k,M,box:document.getElementById('tiSend').textContent,dis:document.getElementById('tiSendMail').disabled,ini:window.__ti2568.initials()};});
  ok('FB 1 Send feedback offers one praise (a step done as written) and one step to fix (a step missed), and the next check by the fading rule',p0.k&&/^You did step \d+ as written: /.test(p0.k.praise)&&/^Step \d+: /.test(p0.k.fix)&&/^\d{4}-\d{2}-\d{2}$/.test(p0.k.next)&&/The fading rule: /.test(p0.box),p0.k);
  ok('FB 2 the message holds the adult\'s own integrity on each check, the praise, the one step, the next check; the student by initials only',p0.ini==='S.S.'&&/\(S\.S\.\)$/.test(p0.M.subject)&&/Your integrity on each check: \d/.test(p0.M.text)&&/What went well: You did step/.test(p0.M.text)&&/The one step to work on: Step/.test(p0.M.text)&&/Next check: by \d/.test(p0.M.text)&&!/Sample Student/.test(p0.M.text+p0.M.html+p0.M.subject),{subject:p0.M.subject,text:p0.M.text});
  ok('FB 3 with no email for the adult, sending is off and the panel says to enter it (or print a slip)',p0.dis&&/Enter the adult’s email/.test(p0.box));
  await fr.fill('#tiSendTo','sample.para@example.org');await fr.dispatchEvent('#tiSendTo','change');await sleep(300);
  await fr.fill('#tiSendPraise','You gave the break the moment the card was handed over, every time.');await fr.dispatchEvent('#tiSendPraise','input');
  const j=await fr.evaluate(()=>window.__ti2568.pick.j);
  await fr.click('#tiSendMail');await sleep(900);
  const s1=await fr.evaluate(j=>({fb:(S.obs[j]||{}).fb,msg:document.getElementById('tiSendMsg').textContent}),j);
  const mails=await host.evaluate(()=>JSON.parse(JSON.stringify(window.__mail||[])));if(process.env.DBG)console.log(JSON.stringify(mails).slice(0,600));
  ok('FB 4 it goes as the questionnaires go: one mail request to the workstation, to the adult alone, with the text and its page version',mails.length===1&&mails[0].messages.length===1&&mails[0].messages[0].to==='sample.para@example.org'&&/<table role="presentation"/.test(mails[0].messages[0].html)&&/You gave the break the moment/.test(mails[0].messages[0].text),mails.map(m=>({to:m.messages.map(x=>x.to)})));
  ok('FB 5 sending fills that check\'s feedback record: date and time given, by email, own graph, praise and the step named, the next check, and logs when and how',s1.fb&&/^\d{4}-\d{2}-\d{2}$/.test(s1.fb.date)&&/^\d{2}:\d{2}$/.test(s1.fb.time)&&s1.fb.fmt==='email'&&s1.fb.own&&s1.fb.praise&&s1.fb.named&&/^\d{4}-\d{2}-\d{2}$/.test(s1.fb.next)&&Array.isArray(s1.fb.sent)&&s1.fb.sent.length===1&&s1.fb.sent[0].how==='email'&&/Sent to Sample Para/.test(s1.msg),s1);
  const keep=await fr.evaluate(j=>{const was=JSON.parse(JSON.stringify((S.obs[j]||{}).fb));renderAll();return {was,fb:(S.obs[j]||{}).fb};},j);keep.same=canon(keep.was)===canon(keep.fb);
  ok('FB 6 the record keeps the log through a redraw (the form\'s clean-up keeps "sent"), and never the message\'s words',keep.same&&!JSON.stringify(keep.fb).includes('break the moment'),keep.fb);
  /* the slip */
  await fr.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++;window.__slip={cls:document.documentElement.className,html:(document.getElementById('tiSlip')||{}).innerHTML||''};};});
  await fr.click('#tiSendSlip');await sleep(400);
  const sl=await fr.evaluate(j=>({p:window.__printed,slip:window.__slip,sent:((S.obs[j]||{}).fb||{}).sent}),j);
  ok('FB 7 Print it as a slip prints the slip alone (its own print mode) with the adult\'s graph, the praise, the step and the next check, and logs it',sl.p===1&&/ti-slip-printing/.test(sl.slip.cls)&&/<svg /.test(sl.slip.html)&&/What went well/.test(sl.slip.html)&&/Next check/.test(sl.slip.html)&&/student S\.S\./.test(sl.slip.html)&&sl.sent.length===2&&sl.sent[1].how==='slip',{p:sl.p,cls:sl.slip&&sl.slip.cls,sent:sl.sent});
  await sleep(1600);const pp=await printShown(fr,'#tiSend',host);
  ok('FB 8 the Send feedback panel never prints with the form',pp[0]===false,pp);
  await host.close();
  /* an older record opens as it was and gains nothing */
  const t=await open('TI-1');await sim(t);
  const o=await t.evaluate(()=>{const a=JSON.stringify(S);renderAll();return {same:JSON.stringify(S)===a,keys:['ipc','ipPlan'].filter(k=>k in S),sent:S.obs.some(o=>o.fb&&o.fb.sent),email:'intEmail' in S.meta};});
  ok('FB 9 a TI-1 record (the simulation) opens and redraws unchanged: no plan check, no log, no email added',o.same&&!o.keys.length&&!o.sent&&!o.email,o);
  await t.close();});

 /* ---------------- EBD: research #8 ---------------- */
 const CASE={fn:{label:'Escape from demands (social negative reinforcement)',key:'escape'},plan:{adoption:{date:'2026-09-08',start:'2026-09-14',team:'simulated team'}},
   integrity:{obs:[{date:'2026-09-21',type:'Unannounced',pct:82,n:11},{date:'2026-10-05',type:'Unannounced',pct:91,n:11},{date:'2026-10-19',type:'Unannounced',pct:95,n:11}],overall:89.3,criterion:90,src:'TI-1'},
   data:{from:'2026-08-24',to:'2026-10-30',days:20,behaviors:[{name:'Aggression',unit:'per day',base:{mean:4.2,days:10},cur:{mean:1.1,days:10},baseName:'Baseline',curName:'FCT with the break card'}],src:'DD-1'},
   records:{interventions:[{name:'Classroom check-in, check-out (Tier 2)',dates:'1/2026 to 4/2026',outcome:'No change in referrals'}]}};
 await sec('EBD',async()=>{
  const p=await open('PR-1');
  await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="dec"]').click());await sleep(300);
  const e0=await p.evaluate(()=>({items:window.__pr2568.ebdItems().map(x=>x.st),txt:document.getElementById('prEbdSec').textContent}));
  ok('EBD 1 the E/BD evidence page lists the five items Rule 6A-6.03016 asks for, each Missing with nothing in the case, and says what is missing',e0.items.length===5&&e0.items.every(s=>s==='miss')&&/Missing for the staffing:/.test(e0.txt)&&/the FBA \(Form FS-1\)/.test(e0.txt),e0.items);
  ok('EBD 2 the page carries "Check the current wording before printing" on screen, and never says the student is eligible',/Check the current wording before printing/.test(e0.txt)&&!/\beligible\b/i.test(e0.txt)&&/decision is the team/.test(e0.txt),e0.txt.slice(0,200));
  await p.evaluate(C=>{window.__nbhFactsIn(C);},CASE);await sleep(500);
  const e1=await p.evaluate(()=>({items:window.__pr2568.ebdItems().map(x=>({k:x.k,st:x.st,d:x.detail,f:x.from})),txt:document.getElementById('prEbdList').textContent}));
  const by=k=>e1.items.find(x=>x.k===k)||{};
  ok('EBD 3 with the case: the FBA is in the case (Form FS-1) but its date is asked for',by('fba').st==='part'&&/Escape from demands/.test(by('fba').d)&&/Form FS-1/.test(by('fba').f),by('fba'));
  ok('EBD 4 the plan: adopted on Form TD-1, 3 TI-1 checks since it started, their dates and mean, against TI-1\'s criterion (no verdict)',by('bip').st==='ok'&&/Plan adopted 9\/8\/2026, started 9\/14\/2026/.test(by('bip').d)&&/3 integrity checks since it started, 9\/21\/2026 to 10\/19\/2026; mean 89\.3%/.test(by('bip').d),by('bip'));
  ok('EBD 5 how long it ran and the response, from DD-1\'s phases',by('resp').st==='ok'&&/about 6\.6 weeks/.test(by('resp').d)&&/Aggression: 4\.2 per day in Baseline \(10 days\), 1\.1 in FCT with the break card/.test(by('resp').d),by('resp'));
  ok('EBD 6 the MTSS interventions from Form RR-1; the exclusions still missing until the team writes them',by('mtss').st==='ok'&&/check-in, check-out/.test(by('mtss').d)&&by('excl').st==='miss'&&/Missing for the staffing: the date of the FBA report; the exclusions the team noted\./.test(e1.txt),{mtss:by('mtss'),txt:e1.txt.slice(-200)});
  await p.fill('[data-m="ebdFba"]','2026-08-20');await p.dispatchEvent('[data-m="ebdFba"]','input');
  await p.fill('[data-m="ebdExcl"]','The team considered and recorded the exclusions on the district form (simulated).');await p.dispatchEvent('[data-m="ebdExcl"]','input');await sleep(300);
  const e2=await p.evaluate(()=>({st:window.__pr2568.ebdItems().map(x=>x.st),txt:document.getElementById('prEbdList').textContent,f:(window.__nbhFactsOut()||{}).review}));
  ok('EBD 7 every item in the case: the page says so and leaves the decision to the team',e2.st.every(s=>s==='ok')&&/Every item has its evidence in the case\. The team reads it and decides\./.test(e2.txt)&&!/\beligible\b/i.test(e2.txt),e2.st);
  ok('EBD 8 not offered to the IEP meeting packet until "Offer it" is set',!(e2.f&&e2.f.ebd),e2.f&&Object.keys(e2.f));
  await p.selectOption('[data-m="ebdIep"]','yes');await sleep(200);
  const e3=await p.evaluate(()=>(window.__nbhFactsOut()||{}).review);
  ok('EBD 9 offered: the case carries the task list for the IEP meeting packet (review.ebd: the items, their status and source, what is missing)',e3&&e3.ebd&&e3.ebd.items.length===5&&e3.ebd.items[1].from==='Forms TD-1 and TI-1'&&Array.isArray(e3.ebd.missing)&&!/\beligible\b/i.test(JSON.stringify(e3.ebd))&&!/&rsquo;|<[a-z]/.test(JSON.stringify(e3.ebd)),e3&&e3.ebd);
  const pn=await printShown(p,'#prEbdSec');
  ok('EBD 10 the form\'s own print leaves the page out (it prints as before)',pn[0]===false,pn);
  await p.evaluate(()=>{window.__pp=null;window.print=()=>{window.__pp=document.documentElement.className;};});
  await p.click('#prEbdPrint');await sleep(200);
  const pm=await p.evaluate(()=>window.__pp);
  await p.evaluate(()=>document.documentElement.classList.add('pr-ebd-printing'));const only=await p.evaluate(()=>1);
  await p.emulateMedia({media:'print'});const vis=await p.evaluate(()=>({ebd:getComputedStyle(document.getElementById('prEbdSec')).display,setup:getComputedStyle(document.querySelector('section.only-setup')).display,head:getComputedStyle(document.querySelector('.nbh-print-head')).display}));await p.emulateMedia({media:'screen'});
  await p.evaluate(()=>document.documentElement.classList.remove('pr-ebd-printing'));
  ok('EBD 11 "Print the E/BD evidence page" prints that page alone, with the form\'s print head',/pr-ebd-printing/.test(pm||'')&&vis.ebd!=='none'&&vis.setup==='none'&&vis.head!=='none',{pm,vis,only});
  await p.close();});

 /* ---------------- AR: research #20 ---------------- */
 await sec('AR',async()=>{
  const p=await open('PR-1');await sim(p);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.archive.gs7');localStorage.removeItem('nbh.archive.gs7y');localStorage.removeItem('nbh.archive.index');}catch(e){}document.querySelector('#viewSeg button[data-view="exit"]').click();});await sleep(300);
  const a0=await p.evaluate(()=>({empty:document.getElementById('prArch').classList.contains('pr-arch-empty'),due:(window.__nbhDue()||[]).filter(x=>/from this iPad/.test(x.what)),cnt:document.getElementById('prArchCount').textContent,f:((window.__nbhFactsOut()||{}).review||{}).archive}));
  const pa=await printShown(p,'#prArch');
  ok('AR 1 the archive starts empty: it does not print, sends nothing, and no countdown runs',a0.empty&&!a0.due.length&&/starts once you confirm/.test(a0.cnt)&&!a0.f&&pa[0]===false,a0);
  await p.evaluate(()=>{const c=document.querySelector('[data-m="client"]');c.value='SIMULATED – Sample Student';c.dispatchEvent(new Event('input',{bubbles:true}));});
  const set=async(k,v)=>{await p.fill('[data-m="'+k+'"]',v);await p.dispatchEvent('[data-m="'+k+'"]','input');};
  await set('arExit','2027-06-04');await set('arFileDate','2027-06-04');await set('arFile','S.S._case_2027-06-04.json');await set('arGs7','GS7 item (simulated): student behavior records');await set('arGs7y','5');await sleep(300);
  const a1=await p.evaluate(()=>({keep:document.getElementById('prArchKeep').textContent,due:(window.__nbhDue()||[]).filter(x=>/from this iPad/.test(x.what)),cnt:document.getElementById('prArchCount').textContent,line:window.__pr2568.indexLine()}));
  ok('AR 2 the retention dates: the BCBA\'s own records at least 7 years (Ethics Code 2.05), the district\'s by its GS7 item, both from the closing date',/until at least 6\/4\/2034/.test(a1.keep)&&/Ethics Code 2\.05/.test(a1.keep)&&/until 6\/4\/2032 \(GS7 item \(simulated\): student behavior records, 5 years\)/.test(a1.keep),a1.keep);
  ok('AR 3 before the BCBA confirms the file is in district storage there is no countdown and nothing on the Due list',!a1.due.length&&/starts once you confirm/.test(a1.cnt),a1);
  await p.click('#prArchConfirm');await sleep(200);
  const a2=await p.evaluate(()=>({msg:document.getElementById('prArchMsg').textContent,conf:S.meta.arConfirm||''}));
  ok('AR 4 confirming asks first where the file is',/Write where the final file is first/.test(a2.msg)&&!a2.conf,a2);
  await set('arWhere','The district records system, ESE folder (simulated)');await p.click('#prArchConfirm');await sleep(300);
  const a3=await p.evaluate(()=>({conf:S.meta.arConfirm,due:(window.__nbhDue()||[]).filter(x=>/from this iPad/.test(x.what)),cnt:document.getElementById('prArchCount').textContent,line:window.__pr2568.indexLine(),f:((window.__nbhFactsOut()||{}).review||{}).archive,today:(d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))(new Date())}));
  const plus30=(()=>{const d=new Date(a3.today+'T12:00:00');d.setDate(d.getDate()+30);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
  ok('AR 5 once confirmed, the "remove from this iPad" countdown starts: 30 days, on the Due list, and the form removes nothing itself',a3.conf===a3.today&&a3.due.length===1&&a3.due[0].date===plus30&&/Remove S\.S\. from this iPad by/.test(a3.cnt)&&/Forget a student/.test(a3.cnt),a3);
  ok('AR 6 one index line: initials, the dates and where the file is, never the name; sent with the review',/^S\.S\. · /.test(a3.line)&&/final file 6\/4\/2027 \(S\.S\._case_2027-06-04\.json\)/.test(a3.line)&&/in The district records system/.test(a3.line)&&/keep until 6\/4\/2034/.test(a3.line)&&!/Sample Student/.test(a3.line)&&a3.f&&a3.f.line===a3.line&&a3.f.removeBy===plus30,a3.line);
  await p.click('#prArchKeepLine');await sleep(200);
  const a4=await p.evaluate(()=>({L:JSON.parse(localStorage.getItem('nbh.archive.index')||'[]'),n:document.getElementById('prArchN').textContent,gs7:localStorage.getItem('nbh.archive.gs7')}));
  ok('AR 7 the index line can be kept on this iPad (it stays when the student is removed), and the GS7 item is kept for the next student',a4.L.length===1&&/^S\.S\. · /.test(a4.L[0])&&a4.n==='(1)'&&/GS7 item \(simulated\)/.test(a4.gs7||''),a4);
  const pa2=await printShown(p,'#prArch');
  ok('AR 8 a recorded archive prints with the review',pa2[0]===true,pa2);
  await p.close();
  const p2=await open('PR-1');await p2.evaluate(()=>document.querySelector('#viewSeg button[data-view="exit"]').click());await sleep(300);
  const b=await p2.evaluate(()=>({here:document.getElementById('prGs7Here').textContent,v:S.meta.arGs7||''}));
  await p2.click('#prGs7Use');await sleep(200);
  const b2=await p2.evaluate(()=>({v:S.meta.arGs7,y:S.meta.arGs7y}));
  ok('AR 9 typed once: the next student\'s archive offers the GS7 item kept on this iPad, and takes it only when asked',/Kept on this iPad from an earlier student/.test(b.here)&&b.v===''&&/GS7 item \(simulated\)/.test(b2.v)&&b2.y==='5',{b,b2});
  await p2.evaluate(()=>{try{localStorage.removeItem('nbh.archive.gs7');localStorage.removeItem('nbh.archive.gs7y');localStorage.removeItem('nbh.archive.index');}catch(e){}});
  await p2.close();
  /* a saved PR-1 record opens as it was */
  const p3=await open('PR-1');await sim(p3);
  const c=await p3.evaluate(()=>{const a=JSON.stringify(S);renderAll();const keys=Object.keys(S.meta).filter(k=>/^(ar|ebd)/.test(k)&&S.meta[k]);const r=(window.__nbhFactsOut()||{}).review||{};return {same:JSON.stringify(S)===a,keys,ebd:'ebd' in r,ar:'archive' in r};});
  ok('AR 10 a PR-1 record (the simulation) opens and redraws unchanged, with no archive or E/BD entry added or sent',c.same&&!c.keys.length&&!c.ebd&&!c.ar,c);
  await p3.close();});

 /* ---------------- PAD: the iPad ---------------- */
 await sec('PAD',async()=>{
  for(const vp of [{width:1376,height:1032,n:'sideways'},{width:1032,height:1376,n:'upright'}]){
   const ic=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:true,userAgent:L.IPAD_UA,deviceScaleFactor:1,serviceWorkers:'block'});
   const go=async(id,fn,shot)=>{const p=await open(id,ic);await fn(p);await sleep(500);
     const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));await p.screenshot({path:path.join(SHOTS,shot+'-'+vp.n+'.png')});return {p,r};};
   /* a button or a disclosure: 44 px (its own height, or its CSS minimum where the form's fit-to-screen zoom rounds it under); a
      field: the height every field of these forms has on a touch screen (the polish layer's 38 px), so the new ones match */
   const small=async(p,sel)=>p.evaluate(s=>{const field=x=>/^(INPUT|SELECT|TEXTAREA)$/.test(x.tagName);const base=(()=>{const f=[...document.querySelectorAll('.sheet input:not([type=checkbox]):not([type=radio]):not([type=hidden])')].find(x=>x.offsetParent);return f?f.getBoundingClientRect().height:38;})();
     return [...document.querySelectorAll(s)].filter(e=>e.offsetParent&&!e.disabled).map(e=>{const h=e.getBoundingClientRect().height,mh=parseFloat(getComputedStyle(e).minHeight)||0;
       return {t:(e.textContent||e.id||e.getAttribute('aria-label')||'').trim().slice(0,40),h:Math.round(h),need:field(e)?Math.round(base):44,ok:field(e)?h>=base-0.5:(h>=44||mh>=44)};}).filter(x=>!x.ok);},sel);
   {const {p,r}=await go('TB-1',async p=>{await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="define"]').click());await sleep(300);await p.selectOption('[name="tgt[1].type"]','Replacement / alternative behavior');await sleep(300);
       await p.locator('#tgtCard1 .tb1rlib-host button.open').tap();await sleep(300);await p.evaluate(()=>document.getElementById('tgtCard1').scrollIntoView());},'tb1-replacement-card');
    const b=await p.evaluate(()=>{const R=document.querySelector('#tgtCard1 .tb1rlib-host').shadowRoot;return [...R.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>({t:e.textContent.slice(0,30),h:e.getBoundingClientRect().height,mh:parseFloat(getComputedStyle(e).minHeight)||0})).filter(x=>x.h<44&&x.mh<44);});
    ok('PAD TB-1 '+vp.n+': the replacement card\'s picker fits the screen (no page-wide scroll) and its buttons are 44 px',r.sw<=r.iw+1&&!b.length,{r,b});await p.close();}
   {const {p,r}=await go('TI-1',async p=>{await sim(p);await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="rt"]').click();});await sleep(300);await p.evaluate(()=>document.getElementById('tiSend').scrollIntoView());},'ti1-send-feedback');
    const s=await small(p,'#tiSend button,#tiSend select,#tiSend input,#tiSend summary');
    ok('PAD TI-1 '+vp.n+': Send feedback fits the screen; its buttons are 44 px and its fields as tall as the form\'s own',r.sw<=r.iw+1&&!s.length,{r,s});await p.close();}
   {const {p,r}=await go('PR-1',async p=>{await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="dec"]').click());await sleep(300);await p.evaluate(()=>document.getElementById('prEbdSec').scrollIntoView());},'pr1-ebd');
    const s=await small(p,'#prEbdSec button,#prEbdSec select');
    ok('PAD PR-1 '+vp.n+': the E/BD page fits the screen; its button is 44 px and its field as tall as the form\'s own',r.sw<=r.iw+1&&!s.length,{r,s});await p.close();}
   {const {p,r}=await go('PR-1',async p=>{await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="exit"]').click());await sleep(300);await p.evaluate(()=>document.getElementById('prArch').scrollIntoView());},'pr1-archive');
    const s=await small(p,'#prArch button,#prArch input,#prArch summary');
    ok('PAD PR-1 '+vp.n+': the archive fits the screen; its buttons are 44 px and its fields as tall as the form\'s own',r.sw<=r.iw+1&&!s.length,{r,s});await p.close();}
   {const {p,r}=await go('ST-1',async p=>{await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="sum"]').click());await sleep(300);await p.evaluate(()=>document.getElementById('stIp').scrollIntoView());},'st1-implementation-plan');
    ok('PAD ST-1 '+vp.n+': the implementation plan fits the screen',r.sw<=r.iw+1,r);await p.close();}
   await ic.close();}});

 ok('no page errors',errs.length===0,errs.slice(0,8));
 await br.close();
 console.log((fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed')+' ('+n+' checks)');process.exit(fails?1:0);})();
