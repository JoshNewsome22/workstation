/* B3 (policy-td1): escape extinction with physical guidance (TD-1), and the physical prompt of the demand assessment
   (DA-1), which is based on the same rule. The review's findings are named (F1 ... F20).
   TD-1:
   1  a fresh escape case, question 4 "yes": the block on the Responding sheet names what is not in place (guidance,
      when the task ends, the assent plan, saying no, a withdrawal of assent, the parent's and the team's agreement);
      nothing is filled in; the least help and never force are fixed lines; Copy for the BIP, Build staff flowchart
      and Print final plan ask first (F7) and carry what is missing; the final plan prints the line for the parent's
      initials; the integrity checklist has the safety items (F8).
   2  escape extinction in other words (F1): the reviewer's five steps, a precursor step, the cards' own steps that
      write it (FCT, DF), a DNRA step only once edited; after "no", the block names where it is still written.
   3  multiple control (F1): the Extinction card as it comes counts until the block records whether escape is one of
      the functions; "No" leaves the question only; "Yes" carries the lines; the recommendation says what comes first.
   4  guidance "Yes" (F3, F5, F10, F12, F20): the form's words go into the stop rule, what the adult does instead, when
      the task ends and the withdrawal steps, each marked as the form's default until edited or ticked "Reviewed for
      this student"; the student's prompts are required and must not start with hands-on help; why guidance is needed
      is required; typed words are kept through every change of the answer.
   5  guidance "No" (F2): every step, setting or prompt order that still calls for hands-on help is named; the
      Extinction card's escape step follows the answer and has a one-tap change; "Physical guidance permitted" too;
      teaching prompts are named until ticked as teaching only, and then printed as such.
   6  the parent's agreement names the guidance answer (F4, F11): a change asks for it again; the initials line says
      what was explained; no team agreement holds it too (F17).
   7  saying no (F5): the question, and the rule staff follow when the no is also the target behavior.
   8  everything in place: no question; the copy, the final plan, the flowchart and the integrity checklist carry it.
   9  an Extinction card that permits guidance the Responding sheet has not allowed prints what the sheet says (F7).
   10 the hands-off rule for staff who see only the brief (Form EB-1) (F13).
   11 the cautions on the restraint-like items, protective equipment and sensory extinction cards (F14).
   12 hands-on help in the response of a plan for another function (F16).
   13 question 4 "no" with a card edited by hand (F6), a card the form sent, and the other functions.
   14 files: a file saved with the new answers opens and saves the same; a file saved before this change opens with
      nothing changed, a notice (F19), and the plan saying what is missing.
   15 the simulations (escape_fct with guidance, sbt and escape_nce without) are in place; the attention scenario has
      no block.
   16 the Guide; what prints.
   DA-1:
   17 the stop rule for the physical step shows while the prompting ends in physical guidance; the limit of 2 stops,
      the line for a hold or an injury (F15); it prints; the procedure and the Guide state it.
   No console or page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8373 node qa/policy-td1-test.js [edition folder, default NBH-Workstation]
   A1_OLD_TD1=<file> (optional) names an older TD-1 file for step 14; by default one is made from the simulation with
   the new fields taken out. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const TD1='TD-1_Function-Based-Treatment-Developer_v2026-09.html',DA1='DA-1_Demand-Assessment_v2026-10.html';
const EEHEAD='ESCAPE EXTINCTION: GUIDANCE, STOPPING, ASSENT, AND CONSENT',PGHEAD='PHYSICAL GUIDANCE: STOPPING, ASSENT, AND CONSENT';
const NOGUIDE='Physical guidance is not decided. Until it is, staff do not guide the student\'s hands.';
const NOCONSENT='The parent or guardian has not agreed to escape extinction yet. Do not start it until they agree to it, as its own item.';
const NOTEAM='The team has not agreed to escape extinction yet. Do not start it until the team agrees. Write who agreed, and when.';
const NOEND='The plan does not say what happens if distress goes on, or the behavior gets more dangerous.';
const NOASSENT='The student\'s assent plan is not named (Form SI-1).';
const NOSAYNO='It is not recorded whether the student\'s ways of saying no (Form SI-1) include the target behavior.';
const NORULE='Say which rule staff follow when the student\'s no is also the target behavior.';
const NOWITHDRAW='The plan does not yet say what happens if the student withdraws assent.';
const NOWHY='Write why hands-on guidance is needed: what was tried first, with dates and data.';
const NOPROMPTS='The student\'s prompts are not written. Staff do not guide until they are.';
const FIRSTPROMPTS='The student\'s prompts start with hands-on help. Help starts with the least: change the order.';
const CHANGED_YES='The guidance answer changed after the parent or guardian agreed: they agreed to escape extinction without hands-on guidance. Explain the change, and record their agreement again. Until then staff do not guide.';
const CHANGED_NO='The guidance answer changed after the parent or guardian agreed: they agreed to escape extinction with hands-on guidance, and the plan now has none. Tell them about the change, and record their agreement to the plan as it is now.';
const DEFAULTS=/still holds? the form's own words\. Read (?:them|it) and fit (?:them|it) to this student, or tick "Reviewed for this student"\./;
const LEAST={yes:'Before any guiding, staff give the instruction, then point or gesture, then show how (a model), then a light touch at the elbow or wrist, about 5 seconds apart. Staff guide the hands only after all of these, and only as the stop rule allows.',
 no:'Staff give the instruction, then point or gesture, then show how (a model), about 5 seconds apart. Help stops there: staff do not guide the student\'s hands.',
 '':'Until the guidance question is answered, help stops at a gesture or a model: staff give the instruction, point or gesture, and show how, and do not guide the student\'s hands.'};
const GENTLE='Guidance is gentle: the adult\'s hands help the student move, and never move the student against their pull.';
const NEVER=/Staff never use force, never hold the student still, and never hold the student's body to make them do the task: that is restraint, and restraint is never used to make a student comply\. Use the crisis plan \(Form CR-1\) only for imminent danger: when someone is about to be seriously hurt\. If a hold happens anyway, or the student is hurt: stop, make sure the student is safe, and tell the BCBA and the school administrator \(at home, the parent or guardian\) at once\. A hold is a restraint: follow the crisis plan's steps for reporting it, which start the same day \(Form CR-1\)\. Anyone who suspects abuse reports it right away to the Florida Abuse Hotline\./;
const STOP='Resistance: the student pulls away, pushes against your hand, or goes stiff. Distress: the student cries, screams, or shakes. Let go at once; the task stays in place.';
const END='If the distress goes on for 5 minutes (crying, screaming, or shaking), or the behavior gets more dangerous, end the task calmly, move to a calm activity, write down the time, and tell the BCBA the same day. Use the crisis plan (Form CR-1) only for imminent danger.';
const S0_LIB='Match the form to the function: escape → continue the task through the prompt sequence with guided compliance and do not remove the demand; attention → no attention, comments, or eye contact contingent on the behavior; tangible → the item is not returned contingent on the behavior.';
const S0_NO='Match the form to the function: escape → keep the task in place, give the instruction again with gestures and models only, and do not remove the demand; attention → no attention, comments, or eye contact contingent on the behavior; tangible → the item is not returned contingent on the behavior.';
const NOTLINE='Staff do not hold the student or use force to make them do the task. Guide only as the stop rule in the plan allows; if no one has shown you the stop rule, do not guide.';
const SIGN_TAIL='It was explained to me what staff will do, that the behavior may get worse for a while before it gets better, what else could be done instead, and that I can stop my agreement at any time, with no loss to my child, by telling the BCBA. I agree to it.';
let fails=0,oks=0;const check=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(c||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,600)));if(c)oks++;else fails++;};

(async()=>{
  const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:1180,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const log=[];
  const ED=process.argv[2]||'NBH-Workstation';console.log('edition: '+ED);
  const open=async(file)=>{const p=await ctx.newPage();wire(p,log);await p.goto(BASE+'/'+ED+'/'+file);await sleep(700);await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;};});return p;};
  /* a field set as a person sets it: the value, then input and change */
  const set=(p,n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector(`[name="${n}"]`);if(!e)return false;if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[n,v]);
  const v=(p,n)=>p.evaluate(n=>{const e=document.querySelector(`[name="${n}"]`);return e?(e.type==='checkbox'?e.checked:e.value):null;},n);
  const view=async(p,k)=>{await p.evaluate(k=>document.querySelector(`#viewSeg button[data-view="${k}"]`).click(),k);await sleep(250);};
  const click=async(p,s)=>{await p.evaluate(s=>document.querySelector(s).click(),s);await sleep(300);};
  const block=p=>p.evaluate(()=>{const b=document.querySelector('#eeBlock'),vis=s=>[...document.querySelectorAll('#eeBlock '+s)].some(r=>!r.hidden);
    return {shown:!!b&&!b.hidden,title:(document.querySelector('#eeTitle')||{}).textContent||'',note:document.querySelector('#eeNote').innerText.replace(/\s+/g,' ').trim(),
      esc:vis('.ee-esc'),main:vis('.ee-main'),yes:[...document.querySelectorAll('#eeBlock .ee-yes')].map(r=>!r.hidden),teach:vis('.ee-teach'),rev:vis('.ee-rev'),norule:vis('.ee-norule'),
      hints:[...document.querySelectorAll('#eeBlock [data-ee-def]')].filter(d=>!d.hidden).map(d=>d.dataset.eeDef),least:(document.querySelector('#eeLeast')||{}).textContent||'',
      never:(document.querySelector('#eeNever')||{}).textContent||'',offer:!document.querySelector('#eeOffer').hidden,consentLab:(document.querySelector('#eeConsentLab')||{}).textContent||'',
      fixes:[...document.querySelectorAll('#eeNote [data-ee-fix]')].map(b=>b.textContent)};});
  const dlg=p=>p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return null;return {head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)};});
  const press=(p,label)=>p.evaluate(l=>{const b=[...document.querySelectorAll('#nbhUiDlg #nbhUiF button')].find(x=>x.textContent===l);if(!b)return false;b.click();return true;},label);
  /* Copy for the BIP, the staff flowchart and Print final plan, answering a question with the given button */
  const copy=async(p,ans='Copy anyway')=>{await p.evaluate(()=>navigator.clipboard.writeText('(nothing copied)'));await click(p,'#bipBtn');const D=await dlg(p);if(D&&ans){await press(p,ans);await sleep(400);}return {D,text:await p.evaluate(()=>navigator.clipboard.readText())};};
  const bip=async p=>(await copy(p)).text;
  const eeSection=(t,h)=>{const i=t.indexOf(h||EEHEAD);if(i<0)return '';const j=t.indexOf('\n\n',i);return t.slice(i,j<0?undefined:j);};
  const flow=async(p,ans='Build anyway')=>{await view(p,'plan');await p.evaluate(()=>{const b=document.querySelector('#flowBlock');b.innerHTML='';b.hidden=true;});await click(p,'#flowBtn');const D=await dlg(p);if(D&&ans){await press(p,ans);await sleep(400);}
    return {D,text:await p.evaluate(()=>{const b=document.querySelector('#flowBlock');return b.hidden?'':b.innerText;})};};
  const final=async p=>{await view(p,'final');return p.evaluate(()=>({text:document.querySelector('#finalBody').innerText,sign:(document.querySelector('#finalBody .ee-sign .ee-say')||{}).textContent||null}));};
  const fid=async p=>{await view(p,'plan');return p.evaluate(()=>[...document.querySelectorAll('#fidTbl tbody tr')].map(r=>[...r.children].map(td=>td.textContent.trim())).filter(r=>r[1]==='Safety').map(r=>r[2]));};
  const fields=p=>p.evaluate(()=>{const f={};document.querySelectorAll('[name]').forEach(e=>{f[e.name]=e.type==='checkbox'?e.checked:e.value;});return f;});
  const saveText=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const openFile=async(p,text)=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'TD-1_file.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(800);};
  const toast=p=>p.evaluate(()=>[...document.querySelectorAll('#nbhToasts .nbh-toast span')].map(s=>s.textContent).join(' | '));
  const extBox=p=>p.evaluate(()=>{const b=document.querySelector('#compWrap .card[data-code="EXT"] .ee-card');return b?b.innerText.replace(/\s+/g,' ').trim():null;});
  const cardVal=(p,code,f)=>p.evaluate(([code,f])=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);if(!c)return null;const e=document.querySelector(`[name="cp[${c.dataset.i}].${f}"]`);return e?e.value:null;},[code,f]);
  const setCard=(p,code,f,val)=>p.evaluate(([code,f,val])=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);const e=document.querySelector(`[name="cp[${c.dataset.i}].${f}"]`);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[code,f,val]);
  const addCard=async(p,code)=>{await view(p,'build');await p.evaluate(c=>{document.querySelector('#addComp').value=c;document.querySelector('#addCompBtn').click();},code);await sleep(250);};
  const sim=async(p,k)=>{await p.evaluate(k=>{const c=window.confirm;window.confirm=()=>true;document.querySelector('#simScenario').value=k;document.querySelector('#simBtn').click();window.confirm=c;},k);await sleep(1400);};
  const fresh=async(fn,a)=>{const p=await open(TD1);await set(p,'m.fn',fn);await view(p,'respond');if(a)await set(p,'rb.3',a);await sleep(150);return p;};
  /* everything the block asks for, with or without guidance */
  const complete=async(p,pg)=>{await set(p,'ee.pg',pg);await sleep(100);
    if(pg==='yes'){await set(p,'ee.why','Gestures and models only for 2 weeks, 9/8 to 9/19: aggression 1.1 per minute (typed)');await set(p,'ee.prompts','Point to the first problem; model it on the whiteboard; a light touch at the wrist (typed)');}
    await set(p,'ee.assent','Form SI-1, reviewed with the student 10/1/2026 (typed)');await set(p,'ee.sayno','no');await set(p,'ee.rev',true);
    await set(p,'ee.consent',pg==='yes'?'pg':'nopg');await set(p,'ee.cwho','Ms. Rivera (mother), 10/2/2026, at the IEP meeting (typed)');await set(p,'ee.team','IEP team, 10/2/2026: teacher, para, BCBA, parent (typed)');await sleep(150);};

  /* ---------- 1: a fresh escape case ---------- */
  console.log('\n=== TD-1: a fresh escape case, question 4 "yes"');
  let p=await fresh('escape','');
  let B=await block(p);
  check(!B.shown,'1 question 4 unanswered, nothing written: no block yet',B.note);
  await set(p,'rb.3','yes');await sleep(150);
  B=await block(p);
  check(B.shown&&B.title==='Escape Extinction: Guidance, Stopping, Assent, and Consent','1 question 4 "yes": the block shows on the Responding sheet');
  check([NOGUIDE,NOEND,NOASSENT,NOSAYNO,NOWITHDRAW,NOCONSENT,NOTEAM].every(x=>B.note.includes(x)),'1 ... and names what is not in place: guidance, when the task ends, the assent plan, saying no, a withdrawal of assent, the parent\'s and the team\'s agreement',B.note);
  check(B.yes.every(x=>!x)&&!B.norule&&!B.rev&&!B.teach,'1 ... the rows for guidance, the rule for saying no, the review tick and the teaching prompts wait',B);
  check(B.least===LEAST['']&&NEVER.test(B.never)&&!B.never.includes('Guidance is gentle'),'1 ... the least help first and never force are fixed lines (no guidance before it is allowed)',{least:B.least,never:B.never});
  check(await v(p,'ee.stop')===''&&await v(p,'ee.instead')===''&&await v(p,'ee.end')===''&&await v(p,'ee.withdraw')===''&&await v(p,'ee.prompts')==='','1 nothing is filled in before the guidance question is answered');
  let C=await copy(p,'Go to Responding');
  check(C.D&&C.D.head==='Escape extinction is not ready.'&&C.D.body.includes(NOGUIDE)&&/Staff must not guide, and must not start escape extinction, until it is\. Copy the text anyway\?$/.test(C.D.body)&&JSON.stringify(C.D.btns)===JSON.stringify(['Go to Responding','Copy anyway']),'1 F7 Copy for the BIP asks first, naming what is missing, with Go to Responding and Copy anyway',C.D);
  check(C.text==='(nothing copied)'&&await p.evaluate(()=>document.body.className==='view-respond'),'1 ... Go to Responding: nothing is copied, and the Responding sheet is shown');
  let t=(await copy(p)).text,S=eeSection(t);
  check(S&&S.includes('- Not in place yet: '+NOGUIDE)&&S.includes('- Not in place yet: '+NOCONSENT)&&S.includes('Least help first: '+LEAST[''])&&NEVER.test(S),'1 ... Copy anyway: the section, with the least help, never force, and what is not in place',S.slice(0,300));
  check(!/^[^\n]*:\s*$/m.test(t)&&!/<[a-z]+[^>]*>|&[a-z]+;/.test(t),'1 ... with no empty "Label:" line and no markup');
  await view(p,'respond');await click(p,'#sendRespond');   /* the flowchart needs a card: the consequence protocol */
  let W=await flow(p);
  check(W.D&&W.D.head==='Escape extinction is not ready.'&&W.D.btns.includes('Build anyway'),'1 F7 Build staff flowchart asks first',W.D);
  check(/Before staff start escape extinction/i.test(W.text)&&W.text.includes(NOGUIDE)&&/Help with the task/.test(W.text)&&/not decided yet: staff do not guide/.test(W.text)&&W.text.includes(LEAST['']),'1 ... Build anyway: "Before staff start escape extinction", no guidance until it is decided, the least help',W.text.slice(0,400));
  await view(p,'final');await click(p,'#printFinalBtn');let D=await dlg(p);
  check(D&&D.head==='Escape extinction is not ready.'&&D.btns.includes('Print anyway'),'1 F7 Print final plan asks first',D);
  await press(p,'Go to Responding');await sleep(200);check(await p.evaluate(()=>window.__prints)===0,'1 ... Go to Responding: nothing is printed');
  await view(p,'final');await click(p,'#printFinalBtn');await press(p,'Print anyway');await sleep(300);check(await p.evaluate(()=>window.__prints)===1,'1 ... Print anyway prints');
  let F=await final(p);
  check(/Escape extinction: guidance, stopping, assent, and consent/i.test(F.text)&&F.text.includes('Not in place yet: '+NOCONSENT)&&F.sign&&F.sign.includes('when the behavior happens, the task stays in place, so the behavior does not end the work. Staff do not guide my child\'s hands.')&&F.sign.endsWith(SIGN_TAIL),'1 F11 the final plan: the group, what is not in place, and the initials line saying what was explained',F.sign);
  let I=await fid(p);
  check(I.length===4&&I[0]==='Gave the instruction, a gesture and a model; did not guide the student\'s hands.'&&I.includes('Used no force and did not hold the student.')&&I.includes('When the student said no, followed the assent plan.'),'1 F8 the integrity checklist has the safety items (no guidance yet)',I);
  await p.close();

  /* ---------- 2: escape extinction in other words ---------- */
  console.log('\n=== TD-1: escape extinction in other words (F1)');
  const VAR=['EE: no break; physically guide the student through the task','Escape-extinction: hand-over-hand until the task is done','Follow through with hand-over-hand guidance; the task is not removed','Physically guide the student to finish the task; no break','Keep the demand in place and use full physical prompting to complete it'];
  for(const q4 of ['','no'])for(const tx of VAR){
    p=await fresh('escape',q4);await set(p,'rb.target',tx);await sleep(150);B=await block(p);t=await bip(p);
    const ok=B.shown&&eeSection(t).length>0&&(q4!=='no'||B.note.includes('Question 4 says the extinction step is not feasible here, but escape extinction is still written in the step "On the target behavior"'));
    check(ok,`2 question 4 ${q4||'unanswered'}: "${tx}" shows the block${q4?' and names the step':''}, and the copy carries the section`,{note:B.note.slice(0,240)});
    await p.close();}
  p=await fresh('escape','');await set(p,'rb.prec','At the first scream keep the task in place on the desk (typed)');await sleep(150);
  check((await block(p)).shown,'2 a precursor step that keeps the task in place shows the block');await p.close();
  for(const code of ['FCT','DF']){p=await fresh('escape','');await addCard(p,code);await view(p,'respond');
    check((await block(p)).shown,`2 the ${code} card's own step that writes escape extinction shows the block (question 4 unanswered)`);await p.close();}
  p=await fresh('escape','no');await addCard(p,'DNRA');await view(p,'respond');
  check(!(await block(p)).shown,'2 "no" with the DNRA card as it comes: no block (its escape-extinction step is "where feasible")');
  await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="DNRA"]');const t=c.querySelectorAll('ol.steps textarea')[2];t.value='Place problem behavior on escape extinction (edited)';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  await view(p,'respond');B=await block(p);
  check(B.shown&&/still written in the Differential negative reinforcement of alternative behavior \(compliance or other target\) card/.test(B.note),'2 ... edited to use escape extinction: the block shows and names the card',B.note);
  await p.close();

  /* ---------- 3: multiple control ---------- */
  console.log('\n=== TD-1: multiple control (F1)');
  p=await fresh('multiple','');await addCard(p,'EXT');await view(p,'respond');B=await block(p);
  check(B.shown&&B.esc&&B.note.includes('It is not recorded yet whether escape is one of this student\'s functions.'),'3 the Extinction card as it comes: the block shows and asks whether escape is one of the functions',B.note);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: It is not recorded yet whether escape is one of this student\'s functions.'),'3 ... and the copy says so');
  check(/Physical guidance, stopping, assent, and consent/.test(await extBox(p)||''),'3 ... the Extinction card shows its box');
  await view(p,'respond');await set(p,'ee.esc','no');await sleep(150);B=await block(p);
  check(B.shown&&B.esc&&!B.main&&/Escape is recorded as not one of this student.s functions: nothing more is needed here\./.test(B.note),'3 "No": only the question stays, and nothing more is asked',B);
  C=await copy(p);check(!C.D&&!C.text.includes(EEHEAD),'3 ... the copy has no section and asks nothing');
  check(await extBox(p)===null,'3 ... and the Extinction card has no box');
  await view(p,'respond');await set(p,'ee.esc','yes');await sleep(150);B=await block(p);
  check(B.main&&B.note.includes(NOGUIDE)&&!B.note.includes('It is not recorded yet whether escape'),'3 "Yes": the lines are asked for',B.note);
  t=await bip(p);check(eeSection(t).includes('Escape is one of this student\'s functions: yes'),'3 ... and the copy records it');
  await p.close();
  p=await fresh('multiple','yes');
  const recs=await p.evaluate(()=>[...document.querySelectorAll('#rbRec .rec')].map(r=>r.innerText.replace(/\s+/g,' ')).join(' | '));
  check(/If escape is one of the functions, before escape extinction is used, the block "Escape Extinction: Guidance, Stopping, Assent, and Consent" below records whether staff may guide the student's hands/.test(recs),'3 where it is picked: the recommendation for multiple control says what comes first',recs.slice(0,300));
  check((await block(p)).shown,'3 question 4 "yes" for multiple control: the block shows');
  await p.close();
  p=await fresh('escape','yes');
  const recE=await p.evaluate(()=>[...document.querySelectorAll('#rbRec .rec')].map(r=>r.innerText.replace(/\s+/g,' ')).join(' | '));
  check(/Before escape extinction is used, the block "Escape Extinction: Guidance, Stopping, Assent, and Consent" below records/.test(recE),'3 ... and for an escape function',recE.slice(0,200));
  await view(p,'select');for(const [i,a] of [[0,'yes'],[1,'yes'],[2,'yes'],[3,'yes'],[4,'Communication']]){await set(p,'q.escape.'+i,a);}await sleep(200);
  const rec=await p.evaluate(()=>{const r=[...document.querySelectorAll('#selRec .rec')].find(x=>x.querySelector('.tag').textContent.trim()==='EXT');return r?r.innerText.replace(/\s+/g,' '):null;});
  check(rec&&/Before it is used: the Responding sheet records whether staff may guide the student.s hands, the stop rule for a student who resists, the student.s assent plan, and the parent.s and the team.s agreement to escape extinction as its own item\./.test(rec),'3 the Select sheet\'s EXT recommendation says what is needed before it is used',rec);
  await p.close();

  /* ---------- 4: guidance "Yes" ---------- */
  console.log('\n=== TD-1: guidance "Yes" (F3, F5, F10, F12, F20)');
  p=await fresh('escape','yes');
  check(await p.evaluate(()=>[...document.querySelector('[name="ee.pg"]').options].map(o=>o.textContent).join(' | '))===' | No: during escape extinction, staff do not guide the student’s hands; help stops at a gesture or a model | Yes: gentle guidance of the hands, only after the least help, and only as the stop rule allows','4 F12 the answers: "No" is about escape extinction; "Yes" is gentle guidance after the least help');
  await set(p,'ee.pg','yes');await sleep(150);
  const pre=await p.evaluate(()=>Object.fromEntries(['ee.prompts','ee.stop','ee.instead','ee.end','ee.withdraw'].map(n=>[n,document.querySelector(`[name="${n}"]`).value])));
  check(pre['ee.stop']===STOP&&!/"stop"|"no"/.test(pre['ee.stop']),'4 F5 the stop rule: resistance and distress, saying no left to the assent plan',pre['ee.stop']);
  check(/^Let go at once\. Keep the task in place/.test(pre['ee.instead'])&&/After 2 stops on the same instruction, do not guide it again this session/.test(pre['ee.instead']),'4 what the adult does instead: let go, the task stays, a calm pause, 2 stops',pre['ee.instead']);
  check(pre['ee.end']===END,'4 F10 when the task ends: distress for 5 minutes, or more dangerous',pre['ee.end']);
  check(/^When the student says no in one of the ways in the assent plan \(Form SI-1: words, a sign, a picture card, or a device\): stop guiding at once, say "Okay," and follow the assent plan/.test(pre['ee.withdraw'])&&/2 sessions in a row, or the assent plan's own review point comes first/.test(pre['ee.withdraw']),'4 F5 F18 the withdrawal steps: saying no in the student\'s own ways; the review point',pre['ee.withdraw']);
  check(pre['ee.prompts']==='','4 F3 the student\'s prompts are not filled in for them');
  B=await block(p);
  check(B.yes.every(Boolean)&&B.rev&&B.least===LEAST.yes&&B.never.startsWith(GENTLE)&&NEVER.test(B.never),'4 F3 F12 the rows show; the least help first and never force (gentle guidance) are fixed lines',{least:B.least,never:B.never.slice(0,120)});
  check([NOWHY,NOPROMPTS].every(x=>B.note.includes(x))&&DEFAULTS.test(B.note)&&!B.note.includes(NOGUIDE),'4 F20 F3 F5 why, the student\'s prompts and the review of the form\'s words are asked for',B.note);
  check(['ee.stop','ee.instead','ee.end','ee.withdraw'].every(x=>B.hints.includes(x)),'4 F5 each box holding the form\'s words says it is the default',B.hints);
  await set(p,'ee.prompts','Hand-over-hand right away, then fade to a gesture (typed)');await sleep(100);
  check((await block(p)).note.includes(FIRSTPROMPTS),'4 F3 prompts that start with hands-on help are named');
  await set(p,'ee.prompts','Point to the first problem; model it on the whiteboard; a light touch at the wrist (typed)');await sleep(100);
  B=await block(p);check(!B.note.includes(FIRSTPROMPTS)&&!B.note.includes(NOPROMPTS),'4 ... the least help first: not named');
  await set(p,'ee.rev',true);await sleep(100);B=await block(p);
  check(!DEFAULTS.test(B.note)&&!B.hints.length,'4 F5 "Reviewed for this student": the defaults are no longer named');
  await set(p,'ee.rev',false);const TYPED='Let go at the first pull; the task stays on the desk; 15 seconds of calm, then the model again (typed)';await set(p,'ee.instead',TYPED);await sleep(100);B=await block(p);
  check(!B.hints.includes('ee.instead')&&B.hints.includes('ee.stop')&&B.note.includes('The stop rule, what happens if distress goes on and what happens if the student says no still hold the form\'s own words.'),'4 ... a box edited is no longer the default; the others still are',B.note);
  await set(p,'ee.rev',true);
  await set(p,'ee.pg','no');await sleep(150);
  check(/^When the student says no .*: say "Okay," and follow the assent plan/.test(await v(p,'ee.withdraw')),'4 "No": the withdrawal steps the form wrote follow the answer');
  check(await v(p,'ee.rev')===false,'4 ... and "Reviewed for this student" is cleared, as the form wrote new words');
  B=await block(p);check(B.yes.every(x=>!x)&&B.least===LEAST.no&&!B.never.includes('Guidance is gentle'),'4 "No": the guidance rows are hidden; the least help stops at a model',B.least);
  t=await bip(p);S=eeSection(t);
  check(S.includes('Physical guidance: none during escape extinction. Staff do not guide the student\'s hands; help stops at a gesture or a model.')&&!/Stop guiding at once at resistance/.test(S)&&!S.includes(TYPED)&&S.includes('Least help first: '+LEAST.no),'4 F2 "No": the copy says none during escape extinction and leaves the stop rule out',S.slice(0,300));
  await set(p,'ee.pg','yes');await sleep(150);
  check(await v(p,'ee.instead')===TYPED&&await v(p,'ee.prompts')==='Point to the first problem; model it on the whiteboard; a light touch at the wrist (typed)','4 back to "Yes": the typed words are kept');
  await set(p,'ee.stop','');await sleep(100);
  check((await block(p)).note.includes('The stop rule is not written. Staff do not guide until it is.'),'4 a cleared stop rule is named: staff do not guide until it is written');
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: The stop rule is not written. Staff do not guide until it is.'),'4 ... in the copy too');
  await p.close();

  /* ---------- 5: guidance "No" ---------- */
  console.log('\n=== TD-1: guidance "No" (F2)');
  p=await fresh('escape','yes');await addCard(p,'EXT');await view(p,'respond');
  check(await cardVal(p,'EXT','s0')===S0_LIB,'5 the Extinction card as it comes: its escape step is guided compliance');
  await set(p,'ee.pg','no');await sleep(150);
  check(await cardVal(p,'EXT','s0')===S0_NO&&await cardVal(p,'EXT','p1')==='No (Responding sheet)','5 "No": the card\'s escape step (its own words) changes to gestures and models only, and "Physical guidance permitted" follows',[await cardVal(p,'EXT','s0'),await cardVal(p,'EXT','p1')]);
  await setCard(p,'EXT','s0',S0_LIB);await view(p,'respond');B=await block(p);
  check(B.note.includes('Step 1 of the Extinction (matched to function) card calls for hands-on help, but the guidance answer is No. Change it to gestures and models only.')&&B.fixes.includes('Use gestures and models only'),'5 the card\'s guided compliance with "No": named, with a one-tap change',B);
  check(/Step 1 of the Extinction \(matched to function\) card calls for hands-on help/.test(await extBox(p)||''),'5 ... the card\'s own box names it too');
  await view(p,'respond');await p.evaluate(()=>document.querySelector('#eeNote [data-ee-fix^="s0:"]').click());await sleep(200);
  check(await cardVal(p,'EXT','s0')===S0_NO&&!(await block(p)).note.includes('calls for hands-on help'),'5 ... one tap: the step uses gestures and models only, and the note goes');
  await setCard(p,'EXT','p1','yes');await view(p,'respond');B=await block(p);
  check(B.note.includes('"Physical guidance permitted" on the Extinction (matched to function) card says "yes", but the guidance answer is No.')&&B.fixes.includes('Use the Responding sheet’s answer'),'5 a card that permits guidance with "No": named, with a one-tap change',B.note);
  await p.evaluate(()=>document.querySelector('#eeNote [data-ee-fix^="p1:"]').click());await sleep(200);
  check(await cardVal(p,'EXT','p1')==='No (Responding sheet)','5 ... one tap: the card says no guidance');
  await view(p,'respond');await set(p,'rb.prec','Guide the student\'s hands to the break card at the first scream (typed)');await sleep(100);
  check((await block(p)).note.includes('The step "On the precursor" calls for hands-on help, but the guidance answer is No. Change it to gestures and models only.'),'5 a typed step with hands-on help is named');
  await set(p,'rb.prec','Point to the break card at the first scream (typed)');
  await set(p,'ee.prompts','Point; model; a light touch at the wrist (typed)');await sleep(100);
  check((await block(p)).note.includes('The student\'s prompts include hands-on help, but the guidance answer is No. Help stops at a gesture or a model.'),'5 the student\'s prompts with a touch, with "No": named');
  await set(p,'ee.prompts','Point; model; tap the page (typed)');
  await addCard(p,'P_MTL');await view(p,'respond');await set(p,'pr.hier','full physical → partial physical → gesture → independent (typed)');await sleep(150);B=await block(p);
  check(B.teach&&B.note.includes('Hands-on prompts are written in the prompt hierarchy (Prompting sheet) and step 1 of the Most-to-least prompting card, but staff do not guide during escape extinction. Change them, or tick that they are for teaching the replacement behavior or a skill only.'),'5 F2 hands-on teaching prompts with "No": named, with the tick for teaching only',B.note);
  await set(p,'ee.teach',true);await sleep(100);B=await block(p);
  check(!/Hands-on prompts are written in/.test(B.note),'5 ... ticked: no longer named');
  t=await bip(p);check(eeSection(t).includes('Teaching prompts: The hands-on prompts in the prompt hierarchy (Prompting sheet) and step 1 of the Most-to-least prompting card are for teaching the replacement behavior or a skill only. During escape extinction, staff do not guide the student\'s hands.'),'5 ... and the copy says what they are for',eeSection(t).slice(0,200));
  /* with guidance, only prompts that start with hands-on help are named */
  await view(p,'respond');await set(p,'ee.teach',false);await set(p,'pr.hier','independent → gesture → model → partial physical → full physical (typed)');await set(p,'ee.pg','yes');await sleep(150);B=await block(p);
  check(B.note.includes('Step 1 of the Most-to-least prompting card starts with hands-on help. In escape extinction, help starts with the least: change the order, or tick that it is for teaching the replacement behavior or a skill only.')&&!/prompt hierarchy \(Prompting sheet\) start/.test(B.note),'5 F3 with "Yes": a prompt order that starts with hands-on help is named; least-to-most is not',B.note);
  await p.close();

  /* ---------- 6: the agreement names the guidance answer ---------- */
  console.log('\n=== TD-1: the parent\'s and the team\'s agreement (F4, F11, F17)');
  p=await fresh('escape','yes');
  check(await p.evaluate(()=>[...document.querySelector('[name="ee.consent"]').options].map(o=>o.textContent).join(' | '))===' | Yes, without hands-on guidance: what staff will do, the risks and the other choices were explained, and they agreed | Yes, with gentle hands-on guidance and the stop rule: what staff will do, the risks and the other choices were explained, and they agreed | Not yet | No: they did not agree','6 F11 the answers say what was explained, and which guidance was agreed to');
  await complete(p,'no');B=await block(p);
  check(/^In place No physical guidance\./.test(B.note),'6 everything for "No", and the parent agreed without guidance: in place',B.note);
  await set(p,'ee.pg','yes');await sleep(150);B=await block(p);
  check(B.note.includes(CHANGED_YES),'6 F4 the guidance answer changed after the parent agreed: their agreement is asked for again',B.note);
  F=await final(p);check(F.sign&&F.sign.includes('Staff may guide my child\'s hands gently, only as the stop rule above allows.')&&F.sign.endsWith(SIGN_TAIL),'6 F4 F11 the initials line names gentle guidance with the stop rule',F.sign);
  await view(p,'respond');await set(p,'ee.consent','pg');await sleep(100);
  check(!(await block(p)).note.includes('guidance answer changed'),'6 ... recorded again (with guidance): no longer asked');
  await set(p,'ee.pg','no');await sleep(150);
  check((await block(p)).note.includes(CHANGED_NO),'6 ... guidance taken away after the parent agreed to it: the parent is told and agrees to the plan as it is',(await block(p)).note);
  await set(p,'ee.consent','nopg');await set(p,'ee.cwho','');await sleep(100);
  check((await block(p)).note.includes('Write who agreed to escape extinction, and when.'),'6 who agreed, and when, is asked for');
  await set(p,'ee.cwho','Ms. Rivera (mother), 10/2/2026 (typed)');await set(p,'ee.team','');await sleep(100);B=await block(p);
  check(B.note.includes(NOTEAM),'6 F17 no team agreement: escape extinction does not start',B.note);
  await set(p,'ee.team','IEP team, 10/2/2026 (typed)');await set(p,'ee.consent','no');await sleep(100);
  check(/did not agree to escape extinction\. Take it out of the plan/.test((await block(p)).note),'6 the parent did not agree: take escape extinction out of the plan');
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: The parent or guardian did not agree to escape extinction.'),'6 ... and the copy says so');
  await p.close();

  /* ---------- 7: saying no ---------- */
  console.log('\n=== TD-1: saying no (F5)');
  p=await fresh('escape','yes');await complete(p,'no');await set(p,'ee.sayno','');await sleep(100);
  check((await block(p)).note.includes(NOSAYNO),'7 not answered: named');
  await set(p,'ee.sayno','yes');await sleep(100);B=await block(p);
  check(B.norule&&B.note.includes(NORULE),'7 "Yes": the rule staff follow is asked for',B.note);
  const RULE='Pushing the work away counts as no: staff stop guiding, keep the task in place with gestures only, and prompt the "no" card, which is honored (typed)';
  await set(p,'ee.norule',RULE);await sleep(100);B=await block(p);
  check(/^In place/.test(B.note),'7 ... written: in place',B.note);
  t=await bip(p);S=eeSection(t);
  check(S.includes('The student\'s ways of saying no include the target behavior: yes')&&S.includes('The rule staff follow when the student\'s no is also the target behavior: '+RULE),'7 ... the copy carries the answer and the rule');
  await view(p,'respond');await click(p,'#sendRespond');   /* the flowchart needs a card */
  W=await flow(p);check(W.text.includes('When the student’s no is also the target behavior: '+RULE),'7 ... and so does the flowchart',W.text.slice(0,300));
  await p.close();

  /* ---------- 8: everything in place ---------- */
  console.log('\n=== TD-1: everything in place');
  p=await fresh('escape','yes');await addCard(p,'EXT');await view(p,'respond');await complete(p,'yes');B=await block(p);
  check(/^In place The stop rule, the assent plan, and the parent.s and the team.s agreement are written down\./.test(B.note),'8 the block reads "In place"',B.note);
  C=await copy(p,null);S=eeSection(C.text);
  check(!C.D&&S&&!/Not in place yet/.test(S),'8 Copy for the BIP copies without a question, and nothing is missing');
  check(['Physical guidance: allowed, gently: after a gesture, a model and a light touch, staff may guide the student\'s hands, and they let go at the first sign of resistance or distress.','Why hands-on guidance is needed: ','Least help first: '+LEAST.yes,'This student\'s prompts: Point to the first problem','Stop guiding at once at resistance or any sign of distress: '+STOP,'What the adult does instead: Let go at once.','If distress goes on, or the behavior gets more dangerous: '+END,'Never force: '+GENTLE,"The student's assent plan: Form SI-1",'The student\'s ways of saying no include the target behavior: no','If the student withdraws assent: ','The parent or guardian agreed to escape extinction, as its own item: yes, with gentle hands-on guidance and the stop rule: what staff will do, the risks and the other choices were explained to them','Who agreed, and when: Ms. Rivera','The team agreed: IEP team'].every(x=>S.includes(x))&&NEVER.test(S),'8 ... every line, never force with what to do after a hold',S);
  const bi=C.text.indexOf('RESPONDING TO THE PRECURSOR AND THE TARGET BEHAVIOR'),ei=C.text.indexOf(EEHEAD),ci=C.text.indexOf('CRISIS PROCEDURE');
  check(bi>=0&&ei>bi&&(ci<0||ci>ei),'8 ... placed after the response to the target behavior and before the crisis procedure');
  W=await flow(p,null);
  check(!W.D&&/Guiding the task, and when to stop/.test(W.text)&&W.text.includes(LEAST.yes)&&W.text.includes(END)&&NEVER.test(W.text)&&/If the student withdraws assent/.test(W.text)&&/Parent or guardian agreed: yes, with gentle hands-on guidance/.test(W.text)&&!/Before staff start escape extinction/i.test(W.text),'8 the flowchart: no question; the stop rule, the least help, when the task ends, never force, assent, the agreement',W.text.slice(0,400));
  await view(p,'final');await click(p,'#printFinalBtn');check(!(await dlg(p))&&await p.evaluate(()=>window.__prints)===1,'8 Print final plan prints without a question');
  F=await final(p);check(F.text.includes('Stop guiding at once at resistance or any sign of distress: '+STOP)&&F.sign&&!/Not in place yet/.test(F.text),'8 the final plan carries every line and the initials line');
  I=await fid(p);check(I.length===6&&I[0]==='Gave the instruction, a gesture, a model and a light touch before any guiding.'&&I.includes('Let go at once at resistance or distress; kept the task in place.')&&I.includes('After the set number of stops on one instruction, did not guide it again that session, and told the BCBA.')&&I.includes('Ended the task calmly when distress went on past the plan\'s limit, and told the BCBA.'),'8 F8 the integrity checklist: the 6 safety items with guidance',I);
  const saved=await saveText(p);
  await p.close();

  /* ---------- 9: an Extinction card that permits guidance ---------- */
  console.log('\n=== TD-1: "Physical guidance permitted" as the plan prints it (F7)');
  p=await fresh('escape','yes');await addCard(p,'EXT');await setCard(p,'EXT','p1','yes');await sleep(150);
  await view(p,'respond');B=await block(p);
  check(B.note.includes(NOGUIDE+' The plan calls for it in step 1 of the Extinction (matched to function) card and "Physical guidance permitted" on the Extinction (matched to function) card.'),'9 the card that permits guidance before the question is answered is named',B.note);
  t=await bip(p);
  check(t.includes('Physical guidance permitted: not decided (Responding sheet): staff do not guide')&&!/Physical guidance permitted: yes/.test(t),'9 the copy prints what the Responding sheet says, not "yes"');
  F=await final(p);check(F.text.includes('Physical guidance permitted: not decided (Responding sheet): staff do not guide'),'9 ... so does the final plan');
  W=await flow(p);check(W.text.includes('Physical guidance permitted: not decided (Responding sheet): staff do not guide'),'9 ... and the flowchart');
  await view(p,'respond');await set(p,'ee.pg','no');await sleep(100);
  check(await cardVal(p,'EXT','p1')==='yes','9 typed "Physical guidance permitted" is never written over by an answer');
  t=await bip(p);check(t.includes('Physical guidance permitted: no (Responding sheet): staff do not guide the student\'s hands'),'9 ... and with "No" the copy prints no guidance');
  await setCard(p,'EXT','p1','');await view(p,'respond');await set(p,'ee.pg','yes');await sleep(100);
  check(await cardVal(p,'EXT','p1')==='Yes, with the stop rule (Responding sheet)','9 an empty "Physical guidance permitted" follows the answer');
  await p.evaluate(()=>{const b=document.querySelector('[data-ee-go]');if(b)b.click();});await sleep(300);
  check(await p.evaluate(()=>document.body.classList.contains('view-respond')),'9 the card\'s button opens the Responding sheet');
  await p.close();

  /* ---------- 10: the hands-off rule for the brief ---------- */
  console.log('\n=== TD-1: the hands-off rule for staff who see only the brief (F13)');
  p=await fresh('escape','yes');await set(p,'rb.not','No break (typed)');await click(p,'#sendRespond');await view(p,'respond');B=await block(p);
  check(B.offer,'10 the block offers the hands-off rule for "What staff do not do"');
  await click(p,'#eeOffer [data-ee-not="add"]');
  check(await v(p,'rb.not')==='No break (typed). '+NOTLINE&&!(await block(p)).offer,'10 ... added after what was typed; the offer goes',await v(p,'rb.not'));
  check((await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="R_PB"]');return [...c.querySelectorAll('ol.steps textarea')].map(t=>t.value);})).includes('Staff do not: No break (typed). '+NOTLINE),'10 ... and the consequence-protocol card sent with the old line carries it');
  await p.close();
  p=await fresh('escape','yes');await click(p,'#eeOffer [data-ee-not="skip"]');
  check(!(await block(p)).offer&&await v(p,'ee.notoff')==='1'&&await v(p,'rb.not')==='','10 "No, thanks": the offer goes, and nothing is added');
  await p.close();

  /* ---------- 11: the cautions ---------- */
  console.log('\n=== TD-1: the cautions (F14)');
  p=await fresh('automatic','');
  for(const [code,re] of [['C_SR',/There are two exceptions only: protective equipment prescribed or recommended for this student by a doctor or therapist, used only as prescribed, with the team's and the parent's agreement and under district policy; and the crisis plan \(Form CR-1\) when someone is about to be seriously hurt\./],['SAFE',/Protective equipment \(for example arm guards or a helmet\) is used only as a doctor or therapist prescribed or recommended it for this student/],['SEXT',/Protective equipment here \(for example padded gloves or a padded surface\) is used only as a doctor or therapist prescribed or recommended it/]]){
    await addCard(p,code);const cau=await p.evaluate(c=>{const e=document.querySelector(`#compWrap .card[data-code="${c}"] .card-caution`);return e?e.innerText:'';},code);
    check(re.test(cau)&&/Staff never hold the student, and never put on or fasten an item that stops the student moving/.test(cau),`11 the ${code} card shows its caution`,cau);}
  F=await final(p);t=await bip(p);W=await flow(p);
  check(['C_SR','SAFE','SEXT'].length===3&&(F.text.match(/Caution\./g)||[]).length===3&&(t.match(/^Caution: /mg)||[]).length===3&&(W.text.match(/stops the student moving/g)||[]).length===3,'11 ... the final plan, the copy and the flowchart carry all three',[(F.text.match(/Caution\./g)||[]).length,(t.match(/^Caution: /mg)||[]).length]);
  await p.emulateMedia({media:'print'});
  check(await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card-caution')].every(e=>e.getClientRects().length>0)),'11 ... and they print');
  await p.emulateMedia({media:'screen'});await p.close();

  /* ---------- 12: hands-on help in a plan for another function ---------- */
  console.log('\n=== TD-1: hands-on help in another function\'s plan (F16)');
  p=await fresh('attention','yes');await set(p,'rb.target','Three-step guided compliance: tell, show, then guide the hands through the task (typed)');await sleep(150);B=await block(p);
  check(B.shown&&B.title==='Physical Guidance: Stopping, Assent, and Consent'&&B.note.includes(NOGUIDE)&&B.consentLab==='The parent or guardian agreed to physical guidance, as its own item','12 attention, guided compliance typed: the block shows, about physical guidance',B);
  C=await copy(p);check(C.D&&C.D.head==='Physical guidance is not ready.'&&eeSection(C.text,PGHEAD).includes('- Not in place yet: The parent or guardian has not agreed to physical guidance yet.'),'12 ... the copy asks first and carries the section',C.D);
  await view(p,'respond');await set(p,'ee.pg','no');await sleep(100);B=await block(p);
  check(B.note.includes('The step "On the target behavior" calls for hands-on help, but the guidance answer is No. Change it, or change the answer.')&&/No: staff do not guide the student.s hands; help stops at a gesture or a model/.test(await p.evaluate(()=>document.querySelector('[name="ee.pg"] option[value="no"]').textContent)),'12 ... "No": the step is named',B.note);
  await set(p,'rb.target','Tell, show, then wait (typed)');await sleep(150);
  check(!(await block(p)).shown&&!(await bip(p)).includes(PGHEAD),'12 ... the step without hands-on help: no block, no section');
  await p.close();

  /* ---------- 13: question 4 "no", and the other functions ---------- */
  console.log('\n=== TD-1: question 4 "no", and the other functions (F6)');
  p=await fresh('escape','yes');await click(p,'#sendRespond');
  /* the card's step edited by hand still holds escape extinction after "no" */
  await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="R_PB"]');const t=[...c.querySelectorAll('ol.steps textarea')].find(x=>/^On the target behavior: /.test(x.value));t.value='On the target behavior: escape extinction: keep the task in place (edited)';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);B=await block(p);
  check(B.shown&&/Question 4 says the extinction step is not feasible here, but escape extinction is still written in the Consequence protocol for problem behavior card\. Take it out/.test(B.note),'13 "no" while a card edited by hand still holds escape extinction: the block stays and says where it is written',B.note);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: Question 4 says the extinction step is not feasible here'),'13 ... and the copy says so');
  await view(p,'respond');await click(p,'#sendRespond');await view(p,'respond');B=await block(p);
  check(!B.shown,'13 the consequence protocol sent again (the alternative): the block goes');
  C=await copy(p,null);check(!C.D&&!C.text.includes(EEHEAD)&&!/Never force|Not in place yet/.test(C.text),'13 ... and Copy for the BIP has no section and asks nothing');
  F=await final(p);check(!/Escape extinction: guidance/i.test(F.text)&&!F.sign,'13 ... nor the final plan');
  W=await flow(p,null);check(!W.D&&!/Guiding the task|Help with the task|Before staff start escape extinction|Never force/i.test(W.text),'13 ... nor the staff flowchart');
  await p.close();
  p=await fresh('escape','yes');await click(p,'#sendRespond');await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  const st=await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="R_PB"]');return [...c.querySelectorAll('ol.steps textarea')].map(t=>t.value);});
  check(st.some(s=>/^On the target behavior: Noncontingent escape/.test(s))&&!(await block(p)).shown,'13 a card the form sent follows "no" (the alternative), and no block shows',st);
  await set(p,'rb.3','yes');await sleep(150);check((await block(p)).shown,'13 "yes" again: the block comes back');
  await p.close();
  for(const fn of ['attention','tangible','automatic']){
    p=await fresh(fn,'yes');if(fn!=='automatic')await addCard(p,'EXT');
    await view(p,'respond');B=await block(p);t=await bip(p);const box=await extBox(p);
    check(!B.shown&&!t.includes(EEHEAD)&&box===null,`13 ${fn}: no block, no section in the copy, no box on the EXT card`,{shown:B.shown,box});
    await p.close();}

  /* ---------- 14: files ---------- */
  console.log('\n=== TD-1: saved files (F19)');
  const SV=JSON.parse(saved);
  check(SV.fields['ee.pg']==='yes'&&SV.fields['ee.consent']==='pg'&&SV.fields['ee.sayno']==='no'&&SV.fields['ee.rev']===true,'14 the file holds the new answers');
  p=await open(TD1);await openFile(p,saved);
  let f=await fields(p);let diff=Object.keys(SV.fields).filter(k=>k in f&&String(f[k])!==String(SV.fields[k]));
  check(!diff.length,'14 it opens with every field as saved',diff.slice(0,5));
  check(!/escape extinction/i.test(await toast(p)),'14 ... with no notice: escape extinction is in place');
  await view(p,'respond');await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  f=await fields(p);diff=Object.keys(SV.fields).filter(k=>k in f&&String(f[k])!==String(SV.fields[k]));
  check(!diff.length,'14 ... keeps them through a visit to Responding and a print',diff.slice(0,5));
  const re=JSON.parse(await saveText(p));
  check(Object.keys(SV.fields).every(k=>String(re.fields[k])===String(SV.fields[k])),'14 ... and saves again the same');
  await p.close();
  let old;
  if(process.env.A1_OLD_TD1){old=JSON.parse(fs.readFileSync(process.env.A1_OLD_TD1,'utf8'));console.log('  (file: '+process.env.A1_OLD_TD1+')');}
  else{p=await open(TD1);await sim(p,'escape_fct');old=JSON.parse(await saveText(p));await p.close();
    Object.keys(old.fields).filter(k=>/^ee\./.test(k)).forEach(k=>delete old.fields[k]);
    const ci=(old.counts.comps||[]).indexOf('EXT');if(ci>=0){const i=(old.counts.idx||[])[ci];old.fields[`cp[${i}].p1`]='By plan: neutral guidance only';old.fields[`cp[${i}].s0`]=S0_LIB;}}
  check(!Object.keys(old.fields).some(k=>/^ee\./.test(k)),'14 the older file has none of the new fields');
  p=await open(TD1);await openFile(p,JSON.stringify(old));
  check(/This plan uses escape extinction\. The Responding sheet now asks about hands-on guidance, the stop rule, assent and the parent.s agreement\. Until they are answered, the plan says staff do not guide and do not start it\./.test(await toast(p)),'14 F19 opening it says the Responding sheet now asks about guidance, the stop rule, assent and consent',await toast(p));
  f=await fields(p);diff=Object.keys(old.fields).filter(k=>k in f&&String(f[k])!==String(old.fields[k]));
  check(!diff.length,'14 the older file opens with every field as saved',diff.slice(0,5));
  check(['ee.pg','ee.why','ee.prompts','ee.stop','ee.instead','ee.end','ee.assent','ee.sayno','ee.norule','ee.withdraw','ee.consent','ee.cwho','ee.team','ee.notoff'].every(k=>f[k]==='')&&f['ee.rev']===false&&f['ee.teach']===false,'14 ... the new boxes are empty: nothing is filled in on opening');
  await view(p,'respond');B=await block(p);
  check(B.shown&&B.note.includes(NOGUIDE)&&B.note.includes(NOCONSENT),'14 ... the block shows what is not in place',B.note);
  check(/The plan calls for it in .*"Physical guidance permitted" on the Extinction \(matched to function\) card\./.test(B.note),'14 ... the card that permits guidance is named',B.note);
  C=await copy(p);check(C.D&&eeSection(C.text).includes('- Not in place yet: '+NOGUIDE),'14 ... Copy for the BIP asks first and says so');
  f=await fields(p);diff=Object.keys(old.fields).filter(k=>k in f&&String(f[k])!==String(old.fields[k]));
  check(!diff.length&&f['ee.pg']==='','14 ... still nothing changed after the visit and the copy',diff.slice(0,5));
  await p.close();

  /* ---------- 15: the simulations ---------- */
  console.log('\n=== TD-1: the simulations');
  for(const [k,pg,show] of [['escape_fct','yes',true],['sbt','no',true],['escape_nce','no',true],['attention_ncr','',false]]){
    p=await open(TD1);await sim(p,k);await view(p,'respond');B=await block(p);C=await copy(p,null);const bx=await extBox(p);
    const ok=show?(B.shown&&/^In place/.test(B.note)&&await v(p,'ee.pg')===pg&&!C.D&&C.text.includes(EEHEAD)&&!/Not in place yet/.test(C.text)&&(bx===null||!/says "|calls for/.test(bx))):(!B.shown&&!C.D&&!C.text.includes(EEHEAD));
    check(ok,`15 ${k}: ${show?'worked through (guidance '+pg+'), in place, copied without a question':'no block'}`,{note:B.note,pg:await v(p,'ee.pg'),D:C.D,bx});
    if(k==='sbt')check(await cardVal(p,'EXT','s0')===S0_NO&&!/guided compliance/.test(C.text),'15 sbt: without guidance, the Extinction card\'s escape step uses gestures and models only; no guided compliance in the copy');
    if(show)check((await fid(p)).length===(pg==='yes'?6:4),`15 ${k}: the integrity checklist has the safety items`);
    await p.close();}

  /* ---------- 16: the Guide and print ---------- */
  console.log('\n=== TD-1: the Guide and print');
  p=await fresh('escape','yes');
  const guide=await p.evaluate(()=>{const g=document.querySelector('#guide #eeGuide');return g?g.innerText.replace(/\s+/g,' '):'';});
  check(/physical guidance in escape extinction/i.test(guide)&&/The least help first\./.test(guide)&&/A written stop rule\./.test(guide)&&/Why guidance\./.test(guide)&&/Never force\./.test(guide)&&/1003\.573\(3\)/.test(guide)&&/Florida Abuse Hotline \(§ 39\.201, F\.S\.\)/.test(guide)&&/Assent\./.test(guide)&&/Breaux & Smith, 2023/.test(guide)&&/Consent\. Escape extinction is its own consent item, and the agreement names the guidance answer/.test(guide)&&/Staff who see only the brief\./.test(guide)&&/C_SR, SAFE and SEXT cards/.test(guide),'16 the Guide explains the least help, the stop rule, why, never force (a hold, abuse), assent, consent, the brief and the cautions',guide.slice(0,300));
  check(await p.evaluate(()=>/Breaux, C\. A\., &amp; Smith, K\. \(2023\)/.test(document.querySelector('#refs').innerHTML)),'16 the references list Breaux and Smith (2023)');
  await addCard(p,'EXT');await view(p,'respond');await set(p,'ee.pg','yes');await sleep(150);
  await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await sleep(300);
  /* v21.81 the Guide prints only with "Include the guide and references" ticked (by Print / Save as PDF) */
  check(await p.evaluate(()=>{const e=document.querySelector('#eeGuide');return !!e&&e.getClientRects().length===0;}),'16 print: the Guide box is left out while "Include the guide and references" is off');
  await p.evaluate(()=>{const c=document.getElementById('printGuide');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  const pr=await p.evaluate(()=>{const vis=s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0;};
    return {block:vis('#eeBlock'),stop:vis('#eeBlock .ee-yes'),least:vis('#eeLeast'),never:vis('#eeNever'),box:vis('#compWrap .card[data-code="EXT"] .ee-card'),btn:vis('#compWrap .card[data-code="EXT"] .ee-card button'),guide:vis('#eeGuide'),offer:vis('#eeOffer'),hint:vis('#eeBlock [data-ee-def]')};});
  check(pr.block&&pr.stop&&pr.least&&pr.never&&pr.box&&!pr.btn&&pr.guide&&!pr.offer&&!pr.hint,'16 print: the block, the stop rule, the least help, never force, the EXT box (no button) and the Guide box print; the offer and the hints do not',pr);
  await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="final"]').click();});await sleep(200);
  check(await p.evaluate(()=>{const e=document.querySelector('#finalBody .ee-sign');return !!e&&e.getClientRects().length>0;}),'16 print: the line for the parent\'s initials prints with the final plan');
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await p.close();

  /* ---------- 17: DA-1 ---------- */
  console.log('\n=== DA-1: the physical prompt (F15)');
  p=await open(DA1);
  const rule=()=>p.evaluate(()=>{const e=document.querySelector('#pgRule');return e?{shown:!e.hidden,text:e.innerText.replace(/\s+/g,' ')}:null;});
  const setM=(m,val)=>p.evaluate(([m,val])=>{const e=document.querySelector(`[data-m="${m}"]`);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[m,val]);
  let R=await rule();check(R&&!R.shown,'17 fresh: no stop rule until a prompting sequence with physical guidance is chosen',R);
  await setM('prompt','Three-step: vocal, then model, then physical guidance, about 5 seconds apart');await sleep(150);
  R=await rule();
  check(R.shown&&/light touch that helps the student move, never force and never a hold: your hands never move the student against their pull/.test(R.text)&&/Let go at once if the student pulls away, pushes against your hand, or goes stiff, or cries, screams, or shakes/.test(R.text)&&/Keep the task in place\. After a short calm pause/.test(R.text)&&/assent plan \(Form SI-1\)/.test(R.text)&&/crisis plan \(Form CR-1\) only for imminent danger/.test(R.text),'17 three-step sequence: the stop rule shows (gentle, let go, the task stays, calm pause, assent, the crisis plan only for imminent danger)',R.text.slice(0,300));
  check(/After 2 stops on the same task in a session, do not guide it again that session: give its instructions with the vocal step and the model only, count them as not complied with, and tell the BCBA the same day\./.test(R.text)&&/If a hold happens anyway, or the student is hurt: stop the session, make sure the student is safe, and tell the BCBA and the school administrator \(at home, the parent or guardian\) at once\./.test(R.text)&&/Florida Abuse Hotline/.test(R.text)&&/Based on the rule Form TD-1 sets for escape extinction with physical guidance\./.test(R.text),'17 F15 ... the limit of 2 stops, the BCBA told the same day, a hold or an injury, and "based on" TD-1\'s rule',R.text.slice(-500));
  await setM('prompt','Two-step: vocal, then model (no physical guidance)');await sleep(150);
  check(!(await rule()).shown,'17 two-step sequence (no physical guidance): no stop rule');
  await p.evaluate(()=>{const s=document.querySelector('#taskTbl select[data-f="prompt"]');s.value='Vocal, model, physical';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  check((await rule()).shown,'17 a task prompted "vocal, model, physical": the stop rule shows');
  await p.emulateMedia({media:'print'});
  check(await p.evaluate(()=>document.querySelector('#pgRule').getClientRects().length>0),'17 the stop rule prints');
  await p.emulateMedia({media:'screen'});
  const da=await p.evaluate(()=>({proc:[...document.querySelectorAll('.only-assessment .instr li')].map(l=>l.textContent).join(' '),guide:[...document.querySelectorAll('.only-guide tr')].map(r=>r.textContent.replace(/\s+/g,' ')).find(x=>/^Physical guidance/.test(x))||''}));
  check(/Physical guidance is a light touch, never force: let go at once if the student resists or shows distress, keep the task in place, and give the instruction again from the vocal step after a short calm pause; after 2 stops on one task, do not guide it again that session/.test(da.proc),'17 the procedure on the Assessment sheet states the rule',da.proc.slice(-300));
  check(/never force and never a hold/.test(da.guide)&&/After 2 stops on one task in a session/.test(da.guide)&&/If a hold happens anyway, or the student is hurt/.test(da.guide)&&/1003\.573\(3\)/.test(da.guide)&&/based on the one Form TD-1 sets/.test(da.guide),'17 the Guide states it, and names TD-1\'s rule',da.guide.slice(0,200));
  await p.close();
  p=await open(DA1);await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simBtn').click();});await sleep(1300);
  check((await rule()).shown,'17 the simulation (three-step prompting) shows the stop rule');
  await p.close();

  const errs=log.filter(l=>l.type!=='warning');
  check(errs.length===0,'no console or page errors',errs.slice(0,4));
  await br.close();console.log('\n'+oks+' ok, FAILURES: '+fails);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
