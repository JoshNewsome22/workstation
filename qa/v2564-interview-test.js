/* v25.64 the interview parcel (the BCBA's approved recommendations from the JABA assessment review, ASSESS): Forms IA-1, IN-1 and SI-1.
   IA-1: the open-ended interview's published figures and the NRRS screen in the instrument table (H1, H8); the interview rule and the
   attention flag on the cards (H1); the "Demand assessment first (Form DA-1)" Decision tick and the escape rule line (H8); the recent
   studies in Guide section 2 (M1). IN-1: four added questions, kept out of an old record's completion figure and table (H2); the
   synthesis rule, the attention flag and the evidence sent as candidate conditions (H1); the interviewer checklist (M8). SI-1: the
   open question before the list, each tick's "said unprompted" or "picked from the list", and the rules (H4); sign types, the
   target-behavior check, assent skills (H3); draft antecedent statements (M7); a fair alternative (L3); the checklist (M8).
   Simulated data only. usage: node qa/v2564-interview-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const open=async pre=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(pre+' '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file(pre));await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const txt=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():null;},sel);
  /* the saved file a form writes, caught as it is made */
  const catchSave=p=>p.evaluate(()=>{window.__saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  const feed=(p,t)=>p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},t);

  /* ================= IA-1 ================= */
  const ia=await open('IA-1_');
  const set=(n,v)=>ia.evaluate(([n,v])=>{const e=document.querySelector(`[name="${n}"]`);if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
  const glance=await ia.evaluate(()=>[...document.querySelectorAll('table.glance tbody tr')].map(r=>r.textContent.replace(/\s+/g,' ')));
  const oe=glance.find(r=>/^FAI \/ open-ended/.test(r.trim()))||'',nr=glance.find(r=>/^ ?NRRS/.test(r))||'';
  ok('1 H1 IA-1 instrument table: the open-ended interview row prints the published figures (36% / 64%, 46.9% false positives, 5.6% missed, attention named wrongly, 60% to 74%, Hanley et al. 2014 for 3 children) and keeps its old words',
    /Not psychometrically scored; Hanley \(2012\) uses the interview/.test(oe)&&/36% of the contingencies the open-ended interview implicated were relevant and 64% were not \(Fisher et al\., 2016, 5 children\)/.test(oe)&&/46\.9% of the functions it identified were false positives, and it missed only 5\.6%/.test(oe)&&/attention was the function named wrongly most often/.test(oe)&&/60% to 74%/.test(oe)&&/all 3 children in Hanley et al\. \(2014\)/.test(oe)&&/a condition to test, never a reason to drop one/.test(oe),oe);
  ok('2 H8 IA-1 instrument table: the NRRS is an optional screen that seeds DA-1, with its reliability (84% categories, 32.9% tasks) and its time (about 14 minutes)',
    /NRRS \(optional screen\)/.test(nr)&&/about 14 minutes/.test(nr)&&/M = 84%/.test(nr)&&/32\.9%/.test(nr)&&/Form DA-1/.test(nr)&&/Not scored on this form/.test(nr),nr);
  const rule=await ia.evaluate(()=>{const e=document.getElementById('iaIntRule');return {t:e.textContent.replace(/\s+/g,' '),np:!!e.closest('.noprint'),sheet:e.closest('.sheet').id};});
  ok('3 H1 IA-1 interview sheet prints the rule: candidates, every function a condition to test, no condition dropped',rule.sheet==='interview'&&!rule.np&&/Interviews are better at ruling a function in as a candidate than at confirming it\. Use every function named here as a condition to test\. Do not drop an FA condition because no interview named it\./.test(rule.t),rule);
  const flag=async v=>{await set('int[0].fn',v);await sleep(120);return ia.evaluate(()=>{const c=document.querySelector('#intWrap .card[data-int="0"] .ia-attn'),c2=document.querySelector('#intWrap .card[data-int="1"] .ia-attn');return {on:!!c&&!c.hidden&&getComputedStyle(c).display!=='none',t:c?c.textContent:'',other:!!c2&&!c2.hidden};});};
  const fA=await flag('attention'),fE=await flag('escape');
  ok('4 H1 IA-1 an interview card whose function is attention carries the flag; escape does not, nor does another card',fA.on&&/Attention is the function interviews most often name wrongly: test it against a control before any plan relies on it\./.test(fA.t)&&!fE.on&&!fA.other,{fA,fE});
  await set('int[0].fn','');
  /* an escape lead from one informant's FAST (items 5 to 8) */
  await set('m.client','SIMULATED – Sample Student');await set('m.beh','Hitting');
  for(let it=1;it<=16;it++)await set(`fast[0][${it}]`,it>=5&&it<=8?'Y':'N');await sleep(400);
  const vEsc=await txt(ia,'#convVerdict');
  for(let it=1;it<=16;it++)await set(`fast[0][${it}]`,it>=1&&it<=4?'Y':'N');await sleep(400);
  const vAtt=await txt(ia,'#convVerdict');
  ok('5 H8 IA-1 an escape lead adds the rule line: choose the demand-condition tasks on Form DA-1, informants\' choice alone risks a false negative; another lead does not',
    /Escape leads: choose the demand-condition tasks on Form DA-1\. Informants’ choice of demand alone risks a false negative \(Call et al\., 2016; Roscoe et al\., 2009\)/.test(vEsc)&&!/Form DA-1/.test(vAtt),{vEsc:vEsc.slice(0,500),vAtt:vAtt.slice(0,300)});
  const dec=await ia.evaluate(()=>{const e=document.querySelector('[name="dec.da"]');return e?{t:e.parentElement.textContent.replace(/\s+/g,' ').trim(),type:e.type}:null;});
  await set('dec.da',true);
  await catchSave(ia);await ia.evaluate(()=>document.getElementById('saveBtn').click());await sleep(400);
  const snap=JSON.parse(await ia.evaluate(()=>window.__saved));
  ok('6 H8 IA-1 Decision has the tick "Demand assessment first (Form DA-1)", and the saved file carries it',dec&&dec.type==='checkbox'&&dec.t==='Demand assessment first (Form DA-1): escape or tangible-and-escape lead, or a demand named by any informant'&&snap.fields['dec.da']===true,{dec,v:snap.fields['dec.da']});
  /* a file saved before the tick existed */
  const old=JSON.parse(JSON.stringify(snap));[old.fields].concat((old.targets||[]).map(t=>t.fields||{})).forEach(f=>{delete f['dec.da'];f['dec.fa']=true;});
  await feed(ia,JSON.stringify(old));await sleep(700);
  const oldIn=await ia.evaluate(()=>({da:document.querySelector('[name="dec.da"]').checked,fa:document.querySelector('[name="dec.fa"]').checked,client:document.querySelector('[name="m.client"]').value}));
  ok('7 H8 IA-1 a file saved before the tick opens: its Decision as saved, the new tick unticked',!oldIn.da&&oldIn.fa&&/SIMULATED/.test(oldIn.client),oldIn);
  const g2=await ia.evaluate(()=>({ev:document.getElementById('iaM1').textContent.replace(/\s+/g,' '),g:document.getElementById('iaM1g').textContent.replace(/\s+/g,' '),refs:document.body.innerHTML}));
  ok('8 M1 IA-1 Guide section 2: Call et al. (2024) and Rahaman et al. (2024) with their figures, and the applied line for treatment without an FA',
    /randomly assigned 57 young children/.test(g2.ev)&&/17 of 26 children \(65\.4%\)/.test(g2.ev)&&/25 of 31 \(80\.6%\) without the analysis and 22 of 26 \(84\.6%\) with it/.test(g2.ev)&&/six of the nine children who dropped out/.test(g2.ev)&&/60% to 74%/.test(g2.ev)&&
    /When a functional analysis cannot be run, a combined indirect and descriptive hypothesis can go to function-based treatment as a test/.test(g2.g)&&/Form EA-1 follows if it does not work, not more indirect data/.test(g2.g)&&
    ['Call, N. A., Bernstein','Call, N. A., Miller','Fisher, W. W., Greer','Greer, B. D., Mitteer','Hanley, G. P., Jin','Rahaman, J. A.','Roscoe, E. M., Rooker','Wiggins, H. C.'].every(r=>g2.refs.includes(r)),{ev:g2.ev,g:g2.g});

  /* ================= IN-1 ================= */
  const inp=await open('IN-1_');
  const q=await inp.evaluate(()=>({p:Q_PARENT.length,s:Q_SCHOOL.length,st:Q_STUDENT.length,pk:Q_PARENT.slice(-4).map(x=>x.k),sk:Q_SCHOOL.slice(-4).map(x=>x.k),
    ex:Q_PARENT.slice(-4).map(x=>x.ex||''),pq:Q_PARENT.slice(-4).map(x=>x.q),opt:[...document.querySelectorAll('#rpInst option')].map(o=>o.textContent)}));
  ok('9 H2 IN-1 the parent and school sets each end with the four added questions (priority, just before and together, calming or ending, when it does not happen); the student set is unchanged; the respondent page counts 24',
    q.p===24&&q.s===24&&q.st===12&&q.pk.join()==='prio,seq,calm,none'&&q.sk.join()==='prio,seq,calm,none'&&/which one worries you most\? Which should we work on first\?/.test(q.pq[0])&&/just before it starts\? Which behaviors happen together, and in what order\?/.test(q.pq[1])&&
    /calm your child down, or to get the episode to end/.test(q.pq[2])&&/When does it not happen, even when you would expect it to\?/.test(q.pq[3])&&q.ex[1]==='Ask for the last time it happened, not what usually happens.'&&q.ex[2]===q.ex[1]&&!q.ex[0]&&/24 questions, two checklists/.test(q.opt[0])&&/24 questions, one checklist/.test(q.opt[1]),q);
  await inp.evaluate(()=>document.getElementById('simBtn').click());await sleep(800);
  const s0=await inp.evaluate(()=>({pct:S.resp.map((r,i)=>pct(i)),rows:[...document.querySelectorAll('#convTbl tbody tr td:first-child')].map(t=>t.textContent),verdict:document.getElementById('convVerdict').textContent,
    cards:document.querySelectorAll('#intBody .resp-int[data-ri="0"] .qcard').length}));
  ok('10 H2 IN-1 a record without answers to the added questions keeps its completion figures, and the table shows none of their rows',
    s0.pct[0]===100&&!s0.rows.some(r=>/Most concerning|does not happen|Just before it|calms it/.test(r))&&/comparable answers recorded/.test(s0.verdict)&&s0.cards===25,s0);
  const ans=(i,j,t)=>inp.evaluate(([i,j,t])=>{const e=document.querySelector(`textarea[data-a="${i}|${j}"]`);e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));},[i,j,t]);
  await ans(0,20,'The hitting. That one first.');await ans(1,21,'He protests, pushes the paper, then stands; the hitting comes after.');await sleep(300);
  const s1=await inp.evaluate(()=>{const ev=(window.__nbhFactsOut()||{}).evidence||{};return {pct0:pct(0),rows:[...document.querySelectorAll('#convTbl tbody tr')].map(t=>t.textContent.replace(/\s+/g,' ')),pr:ev.priority,pc:ev.precursors};});
  ok('11 H2 IN-1 once answered, the added questions count, reach the table, and go out as the priority (for TB-1) and candidate precursors marked "reported, confirm by observation"',
    s1.pct0<100&&s1.pct0>80&&s1.rows.some(r=>/^Most concerning; work on first.*The hitting\. That one first\./.test(r))&&s1.rows.some(r=>/^Just before it, and what happens together \(reported: confirm by observation\).*He protests/.test(r))&&
    Array.isArray(s1.pr)&&s1.pr.length===1&&s1.pr[0].text==='The hitting. That one first.'&&s1.pr[0].role==='Parent or guardian'&&Array.isArray(s1.pc)&&s1.pc[0].basis==='reported, confirm by observation'&&s1.pc[0].role==='Teacher',s1);
  const h1=await inp.evaluate(()=>{const ev=(window.__nbhFactsOut()||{}).evidence||{};const r=document.getElementById('inIntRule');return {rule:r.textContent.replace(/\s+/g,' '),np:!!r.closest('.noprint'),ev:{fn:ev.fn,fnKey:ev.fnKey,strength:ev.strength,use:ev.use,c:ev.candidates,st:ev.statement},
    cand:document.getElementById('inCand').textContent};});
  ok('12 H1 IN-1 the synthesis sheet prints the rule, and the evidence goes to EA-1 as candidate conditions to include, its function, key and strength kept for FS-1',
    !h1.np&&/Interviews are better at ruling a function in as a candidate than at confirming it\. Use every function named here as a condition to test\. Do not drop an FA condition because no interview named it\./.test(h1.rule)&&
    h1.ev.fnKey==='multiple'&&h1.ev.strength==='Weak'&&h1.ev.use==='candidates'&&JSON.stringify(h1.ev.c)==='["attention","tangible","escape"]'&&/informant report/.test(h1.ev.st)&&/For Form EA-1: candidate conditions to include \(attention; access to items or activities; escape from demands\), not the function\. Do not drop a condition because no interview named it\.$/.test(h1.ev.st)&&
    /candidate conditions to include in the analysis, not as the function/.test(h1.cand),h1);
  const att=async v=>{await inp.evaluate(v=>{const e=document.querySelector('[data-m="fn"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},v);await sleep(100);return inp.evaluate(()=>{const e=document.getElementById('inAttn');return {on:!e.hidden&&getComputedStyle(e).display!=='none',t:e.textContent};});};
  const aOn=await att('attention'),aOff=await att('escape');await att('multiple');
  ok('13 H1 IN-1 an attention hypothesis carries the flag; escape does not',aOn.on&&/Attention is the function interviews most often name wrongly: test it against a control before any plan relies on it\./.test(aOn.t)&&!aOff.on,{aOn,aOff});
  /* M8 the checklist */
  await inp.evaluate(()=>{const f=(sel,v)=>{const e=document.querySelector(sel);if(e.type==='checkbox')e.checked=v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    f('[data-ck="0|open"]',true);f('[data-ck="0|prio"]',true);f('[data-ck="0|closed"]','3');f('[data-ck="0|by"]','Second person who listened');});await sleep(150);
  const ck=await inp.evaluate(()=>({ck:S.resp[0].ck,n:document.querySelector('#intBody .resp-int[data-ri="0"] .in-ckn').textContent,items:[...document.querySelectorAll('#intBody .resp-int[data-ri="0"] .in-ckl')].map(l=>l.textContent.trim())}));
  await catchSave(inp);await inp.evaluate(()=>document.getElementById('saveBtn').click());await sleep(400);
  const savedIn=await inp.evaluate(()=>window.__saved);
  await inp.evaluate(()=>{S=blank();renderAll();});await feed(inp,savedIn);await sleep(500);
  const ck2=await inp.evaluate(()=>S.resp[0].ck);
  const oldRec=JSON.parse(savedIn);oldRec.S.resp.forEach(r=>{delete r.ck;});oldRec.S.resp[1].ck={open:true,bogus:1,closed:'x'};
  await feed(inp,JSON.stringify(oldRec));await sleep(500);
  const ck3=await inp.evaluate(()=>({a:S.resp[0].ck,b:S.resp[1].ck,n:S.resp.length}));
  ok('14 M8 IN-1 each interview has the checklist (seven items, the closed-question count, who checked); it is saved with the interview, and an old record opens with an empty one',
    ck.items.length===7&&/^Opened with an open question$/.test(ck.items[0])&&/^Asked about goals$/.test(ck.items[6])&&JSON.stringify(ck.ck)==='{"open":true,"prio":true,"closed":"3","by":"Second person who listened"}'&&ck.n==='2 of 7 done'&&
    JSON.stringify(ck2)===JSON.stringify(ck.ck)&&JSON.stringify(ck3.a)==='{}'&&JSON.stringify(ck3.b)==='{"open":true}'&&ck3.n===5,{ck,ck2,ck3});
  const gIn=await inp.evaluate(()=>document.body.innerHTML);
  ok('15 H2 M8 IN-1 the Guide names the added questions and the checklist with their sources, and the reference list carries them',
    /Added to the parent and school sets \(v25\.64\)/.test(gIn)&&/Interviewer checklist<\/th>/.test(gIn)&&['Fisher, W. W., Greer','Greer, B. D., Mitteer','Hanley, G. P., Jin','Herscovitch, B.','Iwata, B. A., Wong','Miltenberger, R. G.'].every(r=>gIn.includes(r)),'guide');

  /* ================= SI-1 ================= */
  const si=await open('SI-1_');
  const gate=()=>si.evaluate(()=>({wait:document.getElementById('befList').classList.contains('si-wait'),vis:getComputedStyle(document.getElementById('befList')).display!=='none',btn:!document.querySelector('.si-gate[data-gate="before"]').hidden}));
  const g0=await gate();
  await si.evaluate(()=>{const e=document.querySelector('[data-ivt="before"]');e.value='The worksheet is too long.';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(150);
  const g1=await gate();
  const rules=await si.evaluate(()=>({r:document.getElementById('siRules').textContent.replace(/\s+/g,' '),after:(document.querySelector('#qAfter small')||{}).textContent||''}));
  ok('16 H4 SI-1 the list of examples waits until the student\'s own answer is typed; the rules are printed; the after question carries the note about the last time',
    g0.wait&&!g0.vis&&g0.btn&&!g1.wait&&g1.vis&&!g1.btn&&/Ask each question open-ended first, and type the student’s own answer\. Read the list of examples only after that/.test(rules.r)&&/give the same short, neutral thanks after every answer; do not praise or question a particular answer; do not repeat a question once it has been answered/.test(rules.r)&&/^Ask about the last time, not about “usually”\./.test(rules.after),{g0,g1,rules});
  const tick=(k,on)=>si.evaluate(([k,on])=>{const e=document.querySelector('[data-c="'+k+'"]');e.checked=on;e.dispatchEvent(new Event('change',{bubbles:true}));},[k,on]);
  const how=(k,v)=>si.evaluate(([k,v])=>document.querySelector('.si-how[data-how="'+k+'"] button[data-howv="'+v+'"]').click(),[k,v]);
  await tick('b_hard',true);await tick('a_out',true);await tick('a_talk',true);await how('b_hard','u');await how('a_out','p');await how('a_talk','p');await sleep(200);
  const hy=await si.evaluate(()=>({line:document.getElementById('hypOut').textContent.replace(/\s+/g,' '),how:JSON.stringify(S.how),lab:[...document.querySelectorAll('#befList label')].map(l=>l.textContent)[0],shown:!document.querySelector('.si-how[data-how="b_hard"]').hidden,hidden:document.querySelector('.si-how[data-how="b_told"]').hidden,
    m:[...document.querySelectorAll('#hypMetrics .metric')].map(x=>x.textContent.replace(/\s+/g,' '))}));
  ok('17 H4 SI-1 each tick is marked said unprompted or picked from the list; the hypothesis counts the unprompted ones first and reports the picked ones on a second line',
    /before the behavior, the student marked: work too hard, too long or boring\. Afterwards, nothing said unprompted\./.test(hy.line)&&/What the student names points to escape \(escape 1\)\./.test(hy.line)&&
    /The student also picked from the list: after: an adult comes over and talks; after: gets out of the work, or it gets shorter or easier \((attention 1, escape 1|escape 1, attention 1)\)\./.test(hy.line)&&hy.how==='{"b_hard":"u","a_out":"p","a_talk":"p"}'&&hy.lab==='I am given work that is too hard, too long or boringescape'&&hy.shown&&hy.hidden&&
    /escape1lines the student marked; and 1 picked from the list/.test(hy.m.join('|')),hy);
  await tick('a_out',false);await sleep(100);
  const hy2=await si.evaluate(()=>JSON.stringify(S.how));
  ok('18 H4 SI-1 unticking a line clears its mark',hy2==='{"b_hard":"u","a_talk":"p"}',hy2);
  /* H3 */
  await si.evaluate(()=>{S.wb[0].beh='Hits the adult who gave the work';S.wb[1].beh='Says "stop" or hands over the stop card';S.wb[1].k='direct';renderAll();});
  const w0=await si.evaluate(()=>({w:document.getElementById('siWbWarn').textContent,cols:[...document.querySelectorAll('#wbTbl thead th')].map(t=>t.textContent),opt:[...document.querySelectorAll('#wbTbl select[data-f="k"]')[1].options].map(o=>o.value+':'+o.textContent),
    sel:document.querySelectorAll('#wbTbl select[data-f="k"]')[1].value,nowd:document.querySelector('.si-nowd').textContent,np:!!document.querySelector('.si-nowd').closest('.noprint'),ab:[...document.querySelectorAll('#abTbl thead th')].map(t=>t.textContent)}));
  await si.evaluate(()=>window.__nbhFactsIn({behaviors:[{label:'Hitting'}]}));await sleep(100);
  const w1=await si.evaluate(()=>({w:document.getElementById('siWbWarn').textContent.replace(/\s+/g,' '),st:((window.__nbhFactsOut()||{}).student||{}).stop}));
  await si.evaluate(()=>{window.__nbhFactsIn({behaviors:[]});const e=document.querySelector('#wbTbl input[data-f="tb"][data-i="2"]');S.wb[2].beh='Throws the worksheet';renderAB();const c=document.querySelector('#wbTbl input[data-f="tb"][data-i="2"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(100);
  const w2=await si.evaluate(()=>({w:document.getElementById('siWbWarn').textContent.replace(/\s+/g,' '),tb:S.wb[2].tb}));
  ok('19 H3 SI-1 each sign has a type (direct or indirect); a withdrawal sign that matches a TB-1 label, or is ticked as one, prints the warning; "No withdrawal is not the same as assent" is printed',
    w0.w===''&&w0.cols.includes('Type')&&w0.cols.includes('Also a target behavior (TB-1)')&&w0.ab.includes('Type')&&w0.sel==='direct'&&w0.opt.join('|')===':|direct:Direct|indirect:Indirect'&&w0.nowd==='No withdrawal is not the same as assent.'&&!w0.np&&
    /^Row 1 \(“Hits the adult who gave the work”, like the target behavior “Hitting” on Form TB-1\): this is also a target behavior\. If ending the activity after it is how the behavior is maintained, ending the session reinforces it\. Teach a direct “stop” response now\. Honor that response at once, every time\. For the target behavior itself, follow the safety and stop rules of the plan or of Form EA-1\./.test(w1.w)&&
    !/Row 2/.test(w1.w)&&w1.st&&w1.st.alsoTarget==='Hits the adult who gave the work'&&/^Row 3 \(“Throws the worksheet”\): this is also a target behavior/.test(w2.w)&&!/Row 1/.test(w2.w)&&w2.tb===true,{w0,w1,w2});
  const skill=async(st,sk)=>{await si.evaluate(([st,sk])=>{[['a_status',st],['a_skill',sk]].forEach(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});},[st,sk]);await sleep(80);
    return si.evaluate(()=>({open:!document.getElementById('siTeachWrap').hidden,note:document.getElementById('siSkillNote').textContent}));};
  const k1=await skill('not able',''),k2=await skill('','no'),k3=await skill('given','yes');
  ok('20 H3 SI-1 "Not able to give assent" opens the teaching plan for a clear yes, no and stop instead of ending the question; so does a skill not yet there; a clear yes, no and stop does not',
    k1.open&&/Not able to give assent: consent alone does not end the question/.test(k1.note)&&k2.open&&/cannot yet make a clear yes, no and stop/.test(k2.note)&&!k3.open&&k3.note==='',{k1,k2,k3});
  /* L3 */
  const fair=async(t,f)=>{await si.evaluate(([t,f])=>{[['w_alt',t],['w_fair',f]].forEach(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});},[t,f]);await sleep(80);return txt(si,'#siFairOut');};
  const f1=await fair('Do the same worksheet later',''),f2=await fair('A walk','Only the same task, later'),f3=await fair('A walk, then drawing','As good as what the student leaves'),f4=await fair('Copy notes','A worse task, or a loss');
  const lbl=await si.evaluate(()=>document.querySelector('[data-m="w_alt"]').parentElement.querySelector('label').textContent);
  ok('21 L3 SI-1 the withdrawal plan asks what the student can do instead and whether it is as good, and flags the same task later, or a worse one',
    /^What the student can do instead, and whether it is as good as what they leave \(not a worse task, not a loss\)$/.test(lbl)&&/^The only alternative is the same task later\. That is a delay, not a choice/.test(f1)&&f2===f1&&f3===''&&/^The alternative is worse than what the student leaves/.test(f4),{lbl,f1,f2,f3,f4});
  /* M7 and the round trip, on the simulation */
  await si.evaluate(()=>document.getElementById('simBtn').click());await sleep(700);
  const dr=await si.evaluate(()=>({h:document.getElementById('siDraft').textContent.replace(/\s+/g,' '),np:!!document.getElementById('siDraft').closest('.noprint'),ant:((window.__nbhFactsOut()||{}).student||{}).antecedents,sum:document.getElementById('sumOut').textContent.replace(/\s+/g,' ')}));
  ok('22 M7 SI-1 each hard row with a reason becomes a statement to test, printed as the student\'s report to confirm by a classroom comparison or DA-1, and sent to the case for DA-1 and FS-1',
    !dr.np&&/The student is more likely to show the behavior \(the student’s words: “when I walk out”\) when Math \(period 4\) is too hard or too long, or because of the people there; test: easier versus usual difficulty; shorter versus usual length; different people nearby versus the usual group\./.test(dr.h)&&
    /The student’s report; confirm by a brief classroom comparison or Form DA-1\./.test(dr.h)&&Array.isArray(dr.ant)&&dr.ant.length===4&&dr.ant[0].activity==='Math (period 4)'&&JSON.stringify(dr.ant[0].da)==='{"difficulty":true,"length":true,"people":true}'&&/confirm by a brief classroom comparison or Form DA-1/.test(dr.ant[0].basis)&&
    /when Transition after lunch is noisy, or because of the people there/.test(dr.h)&&/Draft statements to test/.test(dr.sum),dr);
  await si.evaluate(()=>{const f=(sel,v)=>{const e=document.querySelector(sel);if(e.type==='checkbox')e.checked=v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    f('[data-sick="open"]',true);f('[data-sick="thanks"]',true);f('[data-sick="closed"]','2');S.wb[0].k='direct';S.wb[2].k='indirect';S.wb[3].tb=true;S.how.b_hard='u';S.how.a_talk='p';renderAll();});
  const ckS=await si.evaluate(()=>({ck:S.ck,items:[...document.querySelectorAll('#siCk label.ck')].map(l=>l.textContent.trim()),n:document.querySelector('#siCk .si-ckn').textContent}));
  await catchSave(si);await si.evaluate(()=>document.getElementById('saveBtn').click());await sleep(400);
  const savedSi=await si.evaluate(()=>window.__saved);const before=await si.evaluate(()=>JSON.stringify(S));
  await si.evaluate(()=>{S=blank();renderAll();});await feed(si,savedSi);await sleep(500);
  const after=await si.evaluate(()=>JSON.stringify(S));
  ok('23 M8 SI-1 the checklist (the adult list and the three rules) is saved; the record, marks, types and ticks included, comes back identical',
    ckS.items.length===10&&ckS.items[7]==='Gave the same short, neutral thanks after every answer'&&ckS.items[9]==='Did not repeat a question once it was answered'&&JSON.stringify(ckS.ck)==='{"open":true,"thanks":true,"closed":"2"}'&&ckS.n==='2 of 10 done'&&before===after&&/"tb": ?true/.test(savedSi),{ckS,same:before===after});
  /* a file saved before v25.64 */
  const oldSi=JSON.parse(savedSi);delete oldSi.S.how;delete oldSi.S.ck;oldSi.S.ab.forEach(r=>{delete r.k;});oldSi.S.wb.forEach(r=>{delete r.k;delete r.tb;});delete oldSi.S.meta.a_skill;
  await si.evaluate(()=>{S=blank();renderAll();});await feed(si,JSON.stringify(oldSi));await sleep(500);
  const os=await si.evaluate(()=>({how:S.how,ck:S.ck,k:S.wb.map(r=>r.k),tb:S.wb.map(r=>r.tb),line:document.getElementById('hypOut').textContent.replace(/\s+/g,' '),err:document.querySelector('#siWbWarn').textContent}));
  ok('24 SI-1 a file saved before v25.64 opens: every tick counted as before, no marks, no types, no warning',JSON.stringify(os.how)==='{}'&&JSON.stringify(os.ck)==='{}'&&os.k.every(x=>x==='')&&os.tb.every(x=>x===false)&&
    /What the student names points to escape and attention \(escape 4, attention 1\)\.|What the student names points to escape \(escape 4, attention 1\)\./.test(os.line)&&!/also picked/.test(os.line)&&os.err==='',os);
  const gS=await si.evaluate(()=>document.body.innerHTML+' '+document.body.textContent);
  ok('25 H3 H4 M7 L3 SI-1 the Guide and the reference list carry the sources the form prints',['Morris, C., Oliveira','Najafichaghabouri, M.','Sparling, J.','Staubitz, J. L.'].every(r=>gS.includes(r))&&/mere failure to object should not, absent affirmative agreement, be construed as assent/.test(gS)&&/A tick marked “picked from the list” is left out of that count/.test(gS),'guide');
  ok('26 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
