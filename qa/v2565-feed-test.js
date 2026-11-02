/* v25.65 (feeding review, batch 2, parcel FEED): the new Form FD-1, Feeding and Mealtime. Simulated data only.
   FEED-H3  the screen: the red flags, the clearance, the problem type and the computed who-leads line; no treatment page
            without the doctor's clearance (and the swallow evaluation when a swallowing flag or a texture problem is recorded).
   FEED-H4  a descriptive meal observation: what the adult did after refusal and after acceptance, escape as the working
            hypothesis, attention noted when coaxing follows half or more of the refusals; it says it does not test, and
            prints no line that a mealtime functional analysis is forbidden (the BCBA, 11/2).
   FEED-H5  the plan: mealtime structure first, the menu (high-p items for selectivity only), each item's TD-1 cards, the
            fixed rule, the review point ("Stop and refer to a medical feeding team before adding escape extinction"), and
            escape extinction as a marked RESTRICTIVE option, never the default, printed only with consent and the family,
            doctor and feeding specialist recorded (the BCBA, 11/2). A bite offered at the lips is not marked.
   FEED-H6  one bite-by-bite sheet: the measures, target foods at criterion (100%: the BCBA, 11/2), the graph with phase
            lines, and the weight line.
   FEED-M1  the three food lists and their notes; the foods ranked on Form PA-1 come in from the case.
   FEED-M5  rapid eating: the pacing pathway when ticked or when Form TB-1 holds the rapid-eating target.
   FEED-M7  the stop box, the setting-event ticks marked on the graph, and the line against delaying meals.
   FEED-M8  the texture order with its prescriber and date, and the latest step the SLP or feeding team wrote.
   FEED-L4  pica routes to TB-1's feed-pica and the TD-1 pica cards, with the doctor's line.
   FEED-L5  a sensory-based approach prints the comparison note.
   Also: the shared blocks are byte for byte those of Form IM-1, the case in and out, a saved file opens again (and a
   partial one), every TD-1 card key exists in the bank, and no page error.
   usage: node qa/v2565-feed-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),FILE='FD-1_Feeding-and-Mealtime_v2026-11.html',URL=L.BASE+'/NBH-Workstation/'+FILE;
const OUT=path.join(__dirname,'out','v2565-feed');fs.mkdirSync(OUT,{recursive:true});
const pdfText=f=>{try{return JSON.parse(cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps(" ".join(p.get_text() for p in d)))',f]).toString());}catch(e){return null;}};
const flat=t=>String(t||'').replace(/\s+/g,' ');
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  /* ---------- the file ---------- */
  const src=fs.readFileSync(path.join(W,FILE),'utf8'),im=fs.readFileSync(path.join(W,fs.readdirSync(W).find(f=>f.startsWith('IM-1_'))),'utf8');
  const tail=s=>s.slice(s.indexOf('/* ===================== NBH student packet'));
  ok('0a the shared blocks (packet, bridge, case, guard, nbh-ui, polish and the scripts they load) are byte for byte Form IM-1\'s',tail(src)===tail(im)&&/<style id="nbh-ui-css">/.test(src)&&/<style id="nbh-polish-css" data-nbh-screen>/.test(src));
  ok('0b its id is FD-1 and its title "Feeding and Mealtime", Revised November 2026',/<span class="nbh-formid">Form FD-1<\/span><span>Revised November 2026<\/span>/.test(src)&&/<title>Form FD-1 · Feeding and Mealtime · /.test(src)&&/<h1>Feeding and Mealtime<\/h1>/.test(src));
  const bank=fs.readFileSync(path.join(W,'nbh-td1-bank.js'),'utf8'),ids=new Set([...bank.matchAll(/"id":"([^"]+)"/g)].map(m=>m[1]));
  const keys=[...new Set([...src.matchAll(/data-cards="([^"]+)"/g)].flatMap(m=>m[1].split(/\s+/)).concat([...src.slice(src.indexOf('const CARDS=')).slice(0,4000).matchAll(/'([a-z_]+-[a-z0-9-]+)':/g)].map(m=>m[1])))];
  ok('0c every TD-1 card FD-1 links to is a key in nbh-td1-bank.js ('+keys.length+' keys)',keys.length>=15&&keys.every(k=>ids.has(k)),keys.filter(k=>!ids.has(k)));
  ok('0d no step is called "medical feeding team only" or "clinic only", and nothing says a mealtime functional analysis is forbidden',!/medical (feeding )?team only|clinic only|not run at school or home|is forbidden/i.test(src));

  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await sleep(1000);
  await p.evaluate(()=>{nbhUI.confirm=async()=>true;window.alert=()=>{};nbhUI.toast=()=>{};});
  const E=(f,a)=>p.evaluate(f,a);
  ok('0e opened on its own: nine red flags, the five problem-type options, and the plan item 1 ticked by default',await E(()=>document.querySelectorAll('#fdRF select[data-rf]').length===9&&document.querySelectorAll('#fdPtype option').length===5&&S.chk.m1===true&&!S.chk.ee));

  /* ---------- FEED-H3 ---------- */
  await E(()=>{document.getElementById('simBtn').click();});await sleep(600);
  const h3=await E(()=>({lead:document.getElementById('fdLead').textContent,plan:!document.getElementById('fdPlanBody').hidden}));
  ok('H3a the simulation (selectivity by type, every red flag no, clearance on file): "School or home plan may use the non-forcing menu (Part 3)."',/School or home plan may use the non-forcing menu \(Part 3\)\./.test(h3.lead)&&h3.plan,h3);
  const h3b=await E(()=>{S.rf.cough='yes';renderAll();const r={lead:document.getElementById('fdLead').textContent,plan:!document.getElementById('fdPlanBody').hidden,no:document.getElementById('fdNoPlan').textContent};S.rf.cough='no';renderAll();return r;});
  ok('H3b a red flag answered yes: "Medical feeding team leads ... until the team advises"; without the swallow evaluation no treatment page',/Medical feeding team leads\. The school and home plan holds mealtime structure, data and caregiver support only, until the team advises\./.test(h3b.lead)&&!h3b.plan&&/Clearance missing: the form will not print a treatment page\. Missing: the swallow evaluation/.test(h3b.no),h3b);
  const h3c=await E(()=>{const k=S.meta.mdClr;S.meta.mdClr='';renderAll();const r={lead:document.getElementById('fdLead').textContent,plan:!document.getElementById('fdPlanBody').hidden};S.meta.mdClr=k;renderAll();return r;});
  ok('H3c the doctor\'s clearance missing: the form will not print a treatment page',/Clearance missing: the form will not print a treatment page/.test(h3c.lead)&&!h3c.plan,h3c);
  const h3d=await E(()=>{S.rf.long='unk';renderAll();const r=document.getElementById('fdLead').textContent;S.rf.long='no';renderAll();return r;});
  ok('H3d an unknown red flag: not decided yet (unknown counts as not answered)',/Not decided yet: 1 red flag not answered or unknown/.test(h3d),h3d);

  /* ---------- FEED-H4 ---------- */
  const h4=await E(()=>{const rows=[...document.querySelectorAll('#fdObsTbl tbody tr')].map(r=>[...r.cells].map(c=>c.textContent));return {rows,hyp:document.getElementById('fdObsHyp').textContent,c:document.getElementById('fdObsCaution').textContent,n:document.querySelectorAll('#fdObsBites tbody tr').length};});
  const coax=h4.rows.find(r=>/^Coaxed/.test(r[0]))||[];
  ok('H4a the observation (12 bites): coaxing followed 57% of the 7 refusals and none of the acceptances; the six adult responses are listed',h4.n===12&&h4.rows.length===6&&coax[1]==='57%'&&coax[2]==='0%',h4.rows);
  ok('H4b escape is the working hypothesis, and attention is noted when coaxing followed half or more of the refusals',/Working hypothesis: escape/.test(h4.hyp)&&/Attention is noted: coaxed or talked followed 57% of refusals/.test(h4.hyp),h4.hyp);
  ok('H4c it says it describes and does not test, and builds no mealtime functional analysis (nothing printed as forbidden)',/describes what usually follows refusal; it does not test it/.test(h4.c)&&/does not build a mealtime functional analysis/.test(h4.c)&&!/not run at school|forbidden|clinic procedure/i.test(h4.c),h4.c);
  const h4d=await E(()=>/Staff never open it/.test(document.querySelector('.only-obs .instr').textContent)&&[...document.querySelectorAll('#fdObsBites select[data-f="clean"]')][0].innerHTML.includes('Not checked'));
  ok('H4d the mouth check is a request; staff never open the mouth; a check not done is "Not checked"',h4d);

  /* ---------- FEED-H5 ---------- */
  const h5=await E(()=>({rule:document.getElementById('fdRuleBox').textContent,items:[...document.querySelectorAll('#fdPlanBody .fdItem[data-item]')].filter(x=>!x.hidden).map(x=>x.dataset.item),
    cards:document.querySelector('.fdItem[data-item="m2"] .fdCard').textContent,steps1:document.getElementById('fdSteps1').textContent,ee:document.getElementById('fdEEText').textContent,eeOn:S.chk.ee}));
  ok('H5a the fixed rule: the student may always decline; a bite not taken within the wait is removed calmly; never force the mouth open; escape extinction named RESTRICTIVE and not part of the plan',/The student may always decline\. If a bite is not taken within 8 s, remove it calmly and offer the next one at the next set time\. Never force the mouth open\./.test(h5.rule)&&/RESTRICTIVE step that is not part of this plan/.test(h5.rule),h5.rule);
  ok('H5b on the menu path every item 1 to 6 is offered, item 1 (structure) first, with its steps',['m1','m2','m3','m4','m5','m6','ee'].every(k=>h5.items.includes(k))&&h5.items[0]==='m1'&&/Meals last 20 minutes\./.test(h5.steps1)&&/no coaxing, no reprimand/.test(h5.steps1),h5);
  ok('H5c each item names its TD-1 cards by key',/p_sf-preferred-food-same-bite/.test(h5.cards)&&/choice-condiment-on-vegetables/.test(h5.cards),h5.cards);
  ok('H5d escape extinction is an option, never the default: unticked, "Not part of this plan"',!h5.eeOn&&/Not part of this plan/.test(h5.ee),h5.ee);
  const h5e=await E(()=>{S.chk.ee=true;S.chk.eeHold=true;renderAll();const a=document.getElementById('fdEEText').textContent;
    Object.assign(S.plan,{eeConsent:'10/20/2026',eeFamily:'10/18/2026',eeDoctor:'Dr. Sample Peds, 10/19/2026',eeSpec:'Feeding specialist (simulated), 10/19/2026',eeMax:'30'});renderAll();
    const b=document.getElementById('fdEEText').textContent,rule=document.getElementById('fdRuleBox').textContent;S.chk.ee=false;S.chk.eeHold=false;['eeConsent','eeFamily','eeDoctor','eeSpec','eeMax'].forEach(k=>delete S.plan[k]);renderAll();return {a,b,rule};});
  ok('H5e ticked without consent and planning: not ready, so not part of the plan',/Not ready, so not part of this plan: missing the written consent, the planning with the family, the planning with the doctor, the planning with the feeding specialist, the longest hold/.test(h5e.a),h5e.a);
  ok('H5f with consent and the family, doctor and feeding specialist: "OPTION: RESTRICTIVE (escape extinction at meals)" says what it does, why, how long and what ends it; never force the mouth open',/OPTION: RESTRICTIVE \(escape extinction at meals\): the adult will keep the bite at the lips until it is taken/.test(h5e.b)&&/What it does:/.test(h5e.b)&&/Why:/.test(h5e.b)&&/How long: each bite is held no longer than 30 s/.test(h5e.b)&&/What the data must show/.test(h5e.b)&&/Never force the mouth open/.test(h5e.b)&&/except in the RESTRICTIVE step written below/.test(h5e.rule),h5e);
  const h5g=await E(()=>{S.plan.offer='lips';renderAll();const t=document.getElementById('fdSteps1').textContent;S.plan.offer='front';renderAll();return t;});
  ok('H5g a bite offered at the lips is an ordinary step, not marked restrictive',/at the student’s lips, and take it away calmly if it is not taken/.test(h5g)&&!/RESTRICTIVE/.test(h5g),h5g);
  const h5h=await E(()=>{S.meta.ptype='refusal';renderAll();const a=[...document.querySelectorAll('#fdPlanBody .fdItem[data-item]')].filter(x=>!x.hidden).map(x=>x.dataset.item);
    Object.assign(S.meta,{team:'Feeding program (simulated)',teamAdv:'10/25/2026'});renderAll();const b=[...document.querySelectorAll('#fdPlanBody .fdItem[data-item]')].filter(x=>!x.hidden).map(x=>x.dataset.item);
    Object.assign(S.meta,{ptype:'type',team:'',teamAdv:''});renderAll();return {a,b};});
  ok('H5h food refusal: structure only until the team advises; then the menu without the high-p items (selectivity only)',h5h.a.join()==='m1'&&h5h.b.includes('m2')&&!h5h.b.includes('m4')&&!h5h.b.includes('m5')&&h5h.b.includes('ee'),h5h);
  const h5i=await E(()=>{const keep=JSON.stringify(S.meals);S.plan.start=S.meals[3].date;S.plan.review='3';
    S.meals.slice(3).forEach(m=>{m.bites.forEach(b=>{if(b.food==='carrots'){b.acc='n';b.ref=true;b.clean='';}});});renderAll();
    const r={box:(document.getElementById('fdReferBox')||{}).textContent||''};S.meals=JSON.parse(keep);S.plan.review='10';S.plan.start=S.meals[3].date;renderAll();r.after=!!document.getElementById('fdReferBox');return r;});
  ok('H5i the review point: acceptance of a target food not risen prints "Stop and refer to a medical feeding team before adding escape extinction."',/^Stop and refer to a medical feeding team before adding escape extinction\./.test(h5i.box)&&/acceptance of carrots has not risen/.test(h5i.box)&&!h5i.after,h5i);

  /* ---------- FEED-H6 ---------- */
  const h6=await E(()=>{const rows=[...document.querySelectorAll('#fdMeals tbody tr')].map(r=>[...r.cells].map(c=>c.textContent));const svg=document.getElementById('fdPlot');
    return {rows:rows.length,first:rows[0],last:rows[rows.length-1],crit:document.getElementById('fdAtCrit').textContent,paths:svg.querySelectorAll('path').length,phase:[...svg.querySelectorAll('line')].filter(l=>l.getAttribute('stroke-dasharray')==='2 3').length,critText:document.getElementById('fdCrit').textContent};});
  ok('H6a ten meals: the first 30% accepted of 10 bites, the last 100% accepted, 100% mouth clean, 0% packed, refusal per presentation 0.00',h6.rows===10&&h6.first[5]==='30%'&&h6.last[5]==='100%'&&h6.last[6].startsWith('100%')&&h6.last[7]==='0%'&&h6.last[9]==='0.00',h6);
  ok('H6b target foods at criterion at 100% over the last 3 meals: green beans yes, carrots not yet (1 of 4), and the rule printed as the code applies it',h6.crit==='1'&&/every bite of it offered was accepted \(100%\) and every accepted bite that was checked was mouth clean at 30 s \(100%\)/.test(h6.critText),h6);
  ok('H6c the graph: acceptance and mouth clean lines, one phase line',h6.paths===2&&h6.phase===1,h6);
  const h6d=await E(()=>{S.wts.push({date:today(),wt:'47.9',unit:'lb',by:'School nurse (simulated)'});renderAll();const t=(document.getElementById('fdWtBox')||{}).textContent||'';S.wts.pop();renderAll();return t;});
  ok('H6d a weight lower than at the weigh-in before prints "Tell the nurse and the family\'s doctor."',/Tell the nurse and the family’s doctor\./.test(h6d),h6d);
  const h6e=await E(()=>{const m=S.meals[0];m.bites[0].clean='nc';m.bites[0].acc='y';m.bites[0].ref=false;const s=mStats(m);m.bites[0].acc='y';return {nc:s.nc,pAcc:s.pAcc};});
  ok('H6e a mouth check not done is left out of mouth clean and counted',h6e.nc===1,h6e);
  await E(()=>{document.getElementById('simBtn').click();});await sleep(500);

  /* ---------- FEED-M1 ---------- */
  const m1=await E(()=>({now:document.querySelectorAll('#fdNow tbody tr').length,t:document.querySelectorAll('#fdTarget tbody tr').length,pr:document.querySelectorAll('#fdPref tbody tr').length,txt:document.querySelector('.only-foods').textContent}));
  ok('M1a three lists (eats now, 4 target foods by group, preferred foods) and the two printed notes',m1.now===4&&m1.t===4&&m1.pr===3&&/Family or staff opinion is a starting list, not the ranking\./.test(m1.txt)&&/Eating a food after treatment does not mean the student now prefers it; keep offering preferred foods\./.test(m1.txt)&&/fruits and vegetables/i.test(m1.txt),m1);
  const m1b=await E(()=>{window.__nbhFactsIn({menu:[{name:'Grapes',type:'Edible',rank:1},{name:'Bubbles',type:'Activity',rank:2},{name:'cracker',type:'Edible',rank:3}]});document.getElementById('fdFromPA').click();return {n:S.foods.pref.length,st:document.getElementById('fdPAStatus').textContent,has:S.foods.pref.some(r=>r.food==='Grapes')};});
  ok('M1b "Add the foods ranked on Form PA-1" adds the case\'s edibles not yet listed (not an activity, not a duplicate)',m1b.n===4&&m1b.has&&/^1 added from Form PA-1/.test(m1b.st),m1b);

  /* ---------- FEED-M5 ---------- */
  const m5=await E(()=>{const a=document.getElementById('fdRapid').hidden;const r=window.__nbhFactsIn({behaviors:[{label:'Rapid eating and overfilling the mouth',def:'a bite placed while food is still in the mouth'}]});
    S.chk.r1=true;S.chk.r2=true;renderAll();const b=!document.getElementById('fdRapid').hidden,t=document.getElementById('fdStepsR').textContent;return {a,b,t,rapid:S.chk.rapid,filled:r.filled};});
  ok('M5a the rapid-eating target on Form TB-1 ticks rapid eating and offers the pacing pathway',m5.a&&m5.b&&m5.rapid&&m5.filled>=1,m5);
  ok('M5b in order: pre-cut portions and utensil down, then a cue faded by lowering its strength (not by spacing); the target from the data; blocking stays restrictive',/Pre-cut the portion.*utensil down/.test(m5.t)&&/lowering the vibration strength, not by spacing the cues further apart/.test(m5.t)&&/meal minutes × 60 ÷ bites/.test(m5.t)&&/Blocking a reach for the next bite is a RESTRICTIVE step/.test(m5.t),m5.t);
  const m5c=await E(()=>document.getElementById('fdCfaLine').textContent);
  ok('M5c every plan prints the choking first-aid line (trained, from the Screen)',/Staff at this meal are trained in choking first aid\./.test(m5c),m5c);

  /* ---------- FEED-M7 ---------- */
  const m7=await E(()=>({box:document.getElementById('fdStopBox').textContent,se:[...document.querySelectorAll('#fdPlot text[data-se]')].map(t=>t.textContent)}));
  ok('M7a the fixed stop box (cough, choking, wet voice, repeated gagging, vomiting, pain; the choking procedure) and "Do not delay, shorten or skip meals or snacks to build hunger."',/Stop the meal and tell the school nurse the same day if the student coughs or chokes, has a wet or gurgly voice, gags again and again, vomits, or shows signs of pain\./.test(m7.box)&&/cannot breathe, cough or speak, follow the choking procedure/.test(m7.box)&&/Do not delay, shorten or skip meals or snacks to build hunger\./.test(m7.box),m7.box);
  ok('M7b the meal ticks (slept poorly, ate within the last hour) are marked on the graph',m7.se.includes('S')&&m7.se.includes('A'),m7.se);

  /* ---------- FEED-M8 ---------- */
  const m8=await E(()=>{S.tex.push({date:today(),step:'Soft and bite-sized, pieces 1.5 cm',by:'School SLP (simulated)',role:'SLP'});renderAll();const t=document.getElementById('fdTexLine').textContent;S.tex.pop();renderAll();return t;});
  ok('M8 the plan prints the texture, the liquid and the bite size as prescribed, with the prescriber and the date, the latest step written, and that a step goes up only when the SLP or feeding team writes it',/texture Regular, cut to bite size; liquids Thin liquids; bite size Half a teaspoon/.test(m8)&&/School SLP \(simulated\)/.test(m8)&&/Latest step written: Soft and bite-sized, pieces 1\.5 cm/.test(m8)&&/goes up only when the SLP or the feeding team writes the next step/.test(m8),m8);

  /* ---------- FEED-L4, FEED-L5 ---------- */
  const l4=await E(()=>{S.rf.pica='yes';renderAll();const t=document.getElementById('fdPica').textContent,lead=document.getElementById('fdLead').textContent;S.rf.pica='no';renderAll();return {t,lead,gone:document.getElementById('fdPica').textContent===''};});
  ok('L4 a pica history links to TB-1 feed-pica and the TD-1 pica cards, and prints the doctor\'s line',/feed-pica/.test(l4.t)&&/rird-pica-block-redirect-discard/.test(l4.t)&&/Ask the doctor about medical checks \(for example lead and iron levels\)\. Pica assessments with baited items are clinic procedures\./.test(l4.t)&&l4.gone,l4);
  const l5=await E(()=>{S.meta.ther='Sequential oral sensory (SOS) feeding therapy';renderAll();const t=document.getElementById('fdSensory').textContent;S.meta.ther='Speech therapy';renderAll();return {t,gone:document.getElementById('fdSensory').textContent===''};});
  ok('L5 a sensory-based approach prints the comparison note',/In direct comparisons, a modified sequential oral sensory approach and sensory integration therapy did not raise consumption; behavioral treatment did\./.test(l5.t)&&l5.gone,l5);

  /* ---------- the case ---------- */
  const fi=await E(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({profile:{health:{allergies:'Peanut',conditions:'Reflux'},culture:'No pork',flags:{safety:['Pica']}},records:{dx:'Autism spectrum disorder'},behaviors:[{label:'Probe behavior'}]});
    return {r,m:{dx:S.meta.dx,diet:S.meta.diet,al:S.meta.allergy},pica:S.rf.pica,note:document.getElementById('fdCaseNote').textContent};});
  ok('C1 in: diagnoses and conditions (RR-1, DM-1), diet, allergies and DM-1\'s pica precaution fill empty fields',fi.m.dx==='Autism spectrum disorder; Reflux'&&fi.m.diet==='No pork'&&fi.m.al==='Peanut'&&fi.pica==='yes'&&fi.r.filled===4&&/From the case/.test(fi.note),fi);
  const fi2=await E(()=>{S.meta.allergy='Latex';const r=window.__nbhFactsIn({profile:{health:{allergies:'Peanut'}}});return {r,al:S.meta.allergy};});
  ok('C2 in: a field already typed is not overwritten',fi2.al==='Latex'&&fi2.r.filled===0,fi2);
  await E(()=>{document.getElementById('simBtn').click();});await sleep(500);
  const fo=await E(()=>window.__nbhFactsOut());
  ok('C3 out: the feeding part of the case (type, who leads, clearance, plan items, meals, at criterion, weight, review)',fo&&fo.feeding&&fo.feeding.type==='type'&&fo.feeding.lead==='menu'&&fo.feeding.treatmentPage===true&&fo.feeding.meals===10&&fo.feeding.atCriterion===1&&fo.feeding.plan.join()==='Mealtime structure,Simultaneous presentation,Differential reinforcement'&&fo.feeding.weightAlert===false&&!fo.feeding.restrictive,fo);

  /* ---------- saved files ---------- */
  const [dl]=await Promise.all([p.waitForEvent('download'),E(()=>{document.getElementById('saveBtn').click();})]);const fp=path.join(OUT,'fd1.json');await dl.saveAs(fp);
  const before=await E(()=>JSON.stringify(S));
  await E(()=>{S=blank();renderAll();});await p.setInputFiles('#fileIn',fp);await sleep(500);
  const after=await E(()=>JSON.stringify(S));
  ok('S1 Save data, then Open data: the same form comes back',JSON.parse(fs.readFileSync(fp,'utf8')).form==='FD-1'&&before===after,{b:before.length,a:after.length});
  const part=path.join(OUT,'fd1-partial.json');fs.writeFileSync(part,JSON.stringify({form:'FD-1',rev:'2026-11',S:{meta:{client:'SIMULATED – Partial'},rf:{wt:'no',bogus:'yes'},meals:[{date:'10/1/2026',bites:[{acc:'y',clean:'y'},{acc:'maybe'}]}]}}));
  await p.setInputFiles('#fileIn',part);await sleep(500);
  const pr=await E(()=>({c:S.meta.client,rf:S.rf,m:S.meals.length,acc:S.meals[0].bites[1].acc,m1:S.chk.m1,tg:S.foods.target.length,rows:document.querySelectorAll('#fdMeals tbody tr').length}));
  ok('S2 a file with only some parts opens: the rest empty, unknown values dropped, item 1 still ticked',pr.c==='SIMULATED – Partial'&&pr.rf.wt==='no'&&!('bogus' in pr.rf)&&pr.m===1&&pr.acc===''&&pr.m1===true&&pr.tg===0&&pr.rows===1,pr);

  /* ---------- print ---------- */
  await E(()=>{document.getElementById('simBtn').click();});await sleep(500);
  await p.emulateMedia({media:'print'});
  const pv=await E(()=>{const vis=el=>!!el&&getComputedStyle(el).display!=='none'&&!el.hidden&&!el.closest('[hidden]');return {plan:vis(document.getElementById('fdPlanBody')),m1:vis(document.querySelector('.fdItem[data-item="m1"]')),m4:vis(document.querySelector('.fdItem[data-item="m4"]')),ee:vis(document.querySelector('.fdItem[data-item="ee"]')),obs:vis(document.querySelector('section.only-obs')),guide:vis(document.querySelector('section.only-guide'))};});
  ok('P1 on paper: the parts print (the Guide only when asked, as on every form); the plan prints its ticked items only (no unticked item, no unticked restrictive option)',pv.plan&&pv.m1&&!pv.m4&&!pv.ee&&pv.obs&&!pv.guide,pv);
  const pdf=path.join(OUT,'fd1.pdf');await p.pdf({path:pdf,format:'Letter',printBackground:true});const pt=flat(pdfText(pdf));
  ok('P2 the PDF holds the who-leads line, the fixed rule, the stop box and the graph\'s page',!!pt&&/School or home plan may use the non-forcing menu/.test(pt)&&/The fixed rule\./.test(pt)&&/Stop rule \(every feeding plan\)/.test(pt)&&/Acceptance and mouth clean by meal/.test(pt),pt?pt.slice(0,300):'no text');
  await p.emulateMedia({media:'screen'});
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
