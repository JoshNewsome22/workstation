/* B3 (policy-td1): escape extinction with physical guidance (TD-1), and the physical prompt of the demand assessment
   (DA-1), which follows the same rule.
   TD-1, on a fresh form:
   1  function escape, Responding opened: no escape-extinction block until question 4 says "yes"; then the block shows
      what is not in place yet: guidance not decided (so staff do not guide), no assent plan, nothing on a withdrawal
      of assent, no consent from the parent or guardian (so escape extinction does not start), no team agreement.
      Copy for the BIP, the final plan (with the line for the parent's initials) and the staff flowchart carry the same.
   2  guidance "yes": the boxes fill with the stop rule (resistance, distress), what the adult does instead (the task
      stays in place, a short calm pause, the instruction again with the least help, a set number of stops), the least
      help first, and the withdrawal-of-assent steps; the stop-rule rows show. "No" swaps the words filled in for the
      prompts and the withdrawal and hides the stop rule; typed words are never replaced, and a cleared stop rule is
      flagged ("Staff do not guide until it is").
   3  the assent plan, the parent's agreement, who and when, and the team: the block reads "In place"; the copy, the
      final plan and the flowchart carry every line, "Never force" and the crisis-plan limit, and nothing "not in place".
      The parent did not agree: the plan says to take escape extinction out.
   4  question 4 "no", and the attention, tangible and automatic functions (an EXT card included): no block, and no
      escape-extinction lines in the copy, the final plan or the flowchart.
   5  where the BCBA picks the procedure: the selector's EXT recommendation says what is needed before it is used; the
      EXT card shows a box with the answers, and flags a card that disagrees with them; answering the guidance question
      writes the card's "Physical guidance permitted" while it is empty, never over typed words.
   6  the C_SR card (restraint-like items) carries its caution on the card, in the final plan, the copy and the flowchart.
   7  the Guide explains it; printing shows the block, the stop rule, the EXT box (without its button), the C_SR caution
      and the initials line.
   8  files: a file saved with the new answers opens with every field as saved and saves again the same; a file saved
      before this change (no new fields) opens with nothing changed, the new boxes empty, and the plan saying what is
      not in place; nothing is filled in until the guidance question is answered.
   9  the simulations: the escape scenarios are worked through (escape_fct with guidance, sbt and escape_nce without),
      with nothing missing; the attention scenario has no block.
   DA-1:
   10 the stop rule for the physical step shows while the prompting sequence (or a task's prompting) ends in physical
      guidance, and not for the two-step or vocal-only sequence; it prints; the procedure and the Guide state it; the
      simulation shows it.
   No console or page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8373 node qa/policy-td1-test.js [edition folder, default NBH-Workstation]
   A1_OLD_TD1=<file> (optional) names an older TD-1 file for step 8; by default one is made from the simulation with
   the new fields taken out. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const TD1='TD-1_Function-Based-Treatment-Developer_v2026-09.html',DA1='DA-1_Demand-Assessment_v2026-10.html';
const EEHEAD='ESCAPE EXTINCTION: GUIDANCE, STOPPING, ASSENT, AND CONSENT';
const NOGUIDE='Physical guidance is not decided. Until it is, staff do not guide the student\'s hands.';
const NOCONSENT='The parent or guardian has not agreed to escape extinction yet. Do not start it until they agree to it, as its own item.';
const NEVER=/Staff never use force, never hold the student still, and never hold the student's body to make them do the task: that is restraint, and restraint is never used to make a student comply\. Use the crisis plan \(Form CR-1\) only for imminent danger/;
const EEWORDS=/ESCAPE EXTINCTION: GUIDANCE|Never force|Physical guidance:|withdraws assent|Not in place yet|as its own item/i;
let fails=0;const check=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(c||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,500)));if(!c)fails++;};

(async()=>{
  const br=await chromium.launch();
  const ctx=await br.newContext({viewport:{width:1180,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const log=[];
  const ED=process.argv[2]||'NBH-Workstation';console.log('edition: '+ED);
  const open=async(file)=>{const p=await ctx.newPage();wire(p,log);await p.goto(BASE+'/'+ED+'/'+file);await sleep(700);return p;};
  /* a field set as a person sets it: the value, then input and change */
  const set=(p,n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector(`[name="${n}"]`);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[n,v]);
  const v=(p,n)=>p.evaluate(n=>{const e=document.querySelector(`[name="${n}"]`);return e?e.value:null;},n);
  const view=async(p,k)=>{await p.evaluate(k=>document.querySelector(`#viewSeg button[data-view="${k}"]`).click(),k);await sleep(250);};
  const click=async(p,s)=>{await p.evaluate(s=>document.querySelector(s).click(),s);await sleep(300);};
  const block=p=>p.evaluate(()=>{const b=document.querySelector('#eeBlock');return {shown:!!b&&!b.hidden,note:b?document.querySelector('#eeNote').innerText.replace(/\s+/g,' ').trim():'',
    yesRows:[...document.querySelectorAll('#eeBlock .ee-yes')].map(r=>!r.hidden),never:(document.querySelector('#eeNever')||{}).textContent||''};});
  const bip=async p=>{await p.evaluate(()=>navigator.clipboard.writeText(''));await click(p,'#bipBtn');await sleep(300);return p.evaluate(()=>navigator.clipboard.readText());};
  const eeSection=t=>{const i=t.indexOf(EEHEAD);if(i<0)return '';const j=t.indexOf('\n\n',i);return t.slice(i,j<0?undefined:j);};
  const final=async p=>{await view(p,'final');return p.evaluate(()=>({text:document.querySelector('#finalBody').innerText,sign:!!document.querySelector('#finalBody .ee-sign')}));};
  const flow=async p=>{await view(p,'plan');await click(p,'#flowBtn');return p.evaluate(()=>document.querySelector('#flowBlock').innerText);};
  const fields=p=>p.evaluate(()=>{const f={};document.querySelectorAll('[name]').forEach(e=>{f[e.name]=e.type==='checkbox'?e.checked:e.value;});return f;});
  const saveText=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const openFile=async(p,text)=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'TD-1_file.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(800);};
  const extBox=p=>p.evaluate(()=>{const b=document.querySelector('#compWrap .card[data-code="EXT"] .ee-card');return b?b.innerText.replace(/\s+/g,' ').trim():null;});
  const cardParam=(p,code,k)=>p.evaluate(([code,k])=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);if(!c)return null;const e=document.querySelector(`[name="cp[${c.dataset.i}].p${k}"]`);return e?e.value:null;},[code,k]);
  const setParam=(p,code,k,val)=>p.evaluate(([code,k,val])=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);const e=document.querySelector(`[name="cp[${c.dataset.i}].p${k}"]`);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[code,k,val]);
  const addCard=async(p,code)=>{await view(p,'build');await p.evaluate(c=>{document.querySelector('#addComp').value=c;document.querySelector('#addCompBtn').click();},code);await sleep(250);};

  /* ---------- 1: escape, question 4, nothing answered ---------- */
  console.log('\n=== TD-1: escape, question 4 "yes", nothing else answered');
  let p=await open(TD1);
  await set(p,'m.fn','escape');await view(p,'respond');
  let B=await block(p);
  check(!B.shown,'1 question 4 unanswered: no escape-extinction block yet',B);
  await set(p,'rb.3','yes');await sleep(200);
  B=await block(p);
  check(B.shown,'1 question 4 "yes": the block shows on the Responding sheet');
  check(B.note.includes(NOGUIDE)&&B.note.includes(NOCONSENT)&&/assent plan is not named/.test(B.note)&&/withdraws assent/.test(B.note)&&/team agreed/.test(B.note),'1 ... and names what is not in place: guidance, the assent plan, a withdrawal of assent, the parent\'s and the team\'s agreement',B.note);
  check(B.yesRows.every(x=>!x),'1 ... the stop-rule rows wait for "yes" to guidance');
  check(NEVER.test(B.never)&&!/light touch/.test(B.never),'1 ... "Never force" is on the sheet (no guidance words before guidance is allowed)',B.never);
  check(await v(p,'ee.stop')===''&&await v(p,'ee.prompts')===''&&await v(p,'ee.withdraw')==='','1 nothing is filled in before the guidance question is answered');
  let t=await bip(p),S=eeSection(t);
  check(S&&S.includes('- Not in place yet: '+NOGUIDE)&&S.includes('- Not in place yet: '+NOCONSENT)&&NEVER.test(S),'1 Copy for the BIP: the section, with "Never force" and what is not in place',S.slice(0,300));
  check(!/^[^\n]*:\s*$/m.test(t)&&!/<[a-z]+[^>]*>|&[a-z]+;/.test(t),'1 ... with no empty "Label:" line and no markup');
  let F=await final(p);
  check(/ESCAPE EXTINCTION: GUIDANCE|Escape extinction: guidance/i.test(F.text)&&F.text.includes('Not in place yet: '+NOCONSENT)&&F.sign,'1 the final plan: the group, what is not in place, and the line for the parent\'s initials',F.text.slice(-400));
  await view(p,'respond');await click(p,'#sendRespond');   /* the flowchart needs a card: the consequence protocol */
  let W=await flow(p);
  check(/Before staff start escape extinction/i.test(W)&&W.includes(NOGUIDE)&&/Help with the task/.test(W)&&/Physical guidance is not decided yet/.test(W),'1 the staff flowchart: "Before staff start escape extinction", and no guidance until it is decided',W.slice(0,500));

  /* ---------- 2: guidance yes / no; typed words kept ---------- */
  console.log('\n=== TD-1: the guidance question');
  await view(p,'respond');await set(p,'ee.pg','yes');await sleep(200);
  const pre=await p.evaluate(()=>({prompts:document.querySelector('[name="ee.prompts"]').value,stop:document.querySelector('[name="ee.stop"]').value,instead:document.querySelector('[name="ee.instead"]').value,withdraw:document.querySelector('[name="ee.withdraw"]').value}));
  check(/point or gesture/.test(pre.prompts)&&/show how \(a model\)/.test(pre.prompts)&&/light touch/.test(pre.prompts)&&/Guide the hands only after these/.test(pre.prompts),'2 "yes": the least help first (gesture, model, light touch, then guidance)',pre.prompts);
  check(/pulls away, pushes against your hand, or goes stiff/.test(pre.stop)&&/Distress/.test(pre.stop),'2 ... the stop rule: resistance and distress',pre.stop);
  check(/^Let go at once\. Keep the task in place/.test(pre.instead)&&/short calm pause/.test(pre.instead)&&/again, starting with the least help/.test(pre.instead)&&/After 2 stops on the same instruction, do not guide it again this session/.test(pre.instead)&&/tell the BCBA/.test(pre.instead),'2 ... what the adult does instead: let go, the task stays, a calm pause, again with the least help, 2 stops',pre.instead);
  check(/^Stop guiding at once\. Follow the student's assent plan \(Form SI-1\)/.test(pre.withdraw)&&/end the session if the student still says no/.test(pre.withdraw),'2 ... and what happens if the student withdraws assent',pre.withdraw);
  B=await block(p);
  check(B.yesRows.every(Boolean)&&!B.note.includes(NOGUIDE)&&/^Guidance is a light touch/.test(B.never),'2 ... the stop-rule rows show, guidance is decided, and "Never force" names the light touch',B);
  const TYPED='Let go at the first pull; the task stays on the desk; 15 seconds of calm, then the model again (typed)';
  await set(p,'ee.instead',TYPED);
  await set(p,'ee.pg','no');await sleep(150);
  check(/Staff do not guide the student's hands/.test(await v(p,'ee.prompts'))&&!/light touch/.test(await v(p,'ee.prompts')),'2 "no": the prompts filled in for "yes" become the prompts without guidance',await v(p,'ee.prompts'));
  check(/^Follow the student's assent plan/.test(await v(p,'ee.withdraw')),'2 "no": the withdrawal steps filled in for "yes" follow the answer',await v(p,'ee.withdraw'));
  B=await block(p);check(B.yesRows.every(x=>!x),'2 "no": the stop-rule rows are hidden');
  t=await bip(p);S=eeSection(t);
  check(S.includes('Physical guidance: none. Staff do not guide the student\'s hands; help stops at a gesture or a model.')&&!/Stop guiding at once at resistance/.test(S)&&!S.includes(TYPED),'2 "no": the copy says no guidance and leaves the stop rule out',S.slice(0,300));
  await set(p,'ee.pg','yes');await sleep(150);
  check(await v(p,'ee.instead')===TYPED,'2 back to "yes": the typed words are kept');
  const MYPROMPTS='Point to the first problem; then model it on the whiteboard (typed)';
  await set(p,'ee.prompts',MYPROMPTS);await set(p,'ee.pg','no');await set(p,'ee.pg','yes');
  check(await v(p,'ee.prompts')===MYPROMPTS,'2 typed prompts survive every change of the answer');
  await set(p,'ee.stop','');await sleep(150);
  B=await block(p);
  check(B.note.includes('The stop rule is not written. Staff do not guide until it is.'),'2 a cleared stop rule is flagged: staff do not guide until it is written',B.note);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: The stop rule is not written. Staff do not guide until it is.'),'2 ... in the copy too');
  await set(p,'ee.stop','Pulls away, pushes against my hand, goes stiff, cries or says "stop" (typed)');

  /* ---------- 3: assent and consent ---------- */
  console.log('\n=== TD-1: assent and consent');
  await set(p,'ee.assent','Form SI-1, reviewed with the student 10/1/2026 (typed)');
  await set(p,'ee.consent','yes');await sleep(150);
  B=await block(p);check(B.note.includes('Write who agreed to escape extinction, and when.'),'3 consent "yes" without who and when: asked for',B.note);
  await set(p,'ee.cwho','Ms. Rivera (mother), 10/2/2026, at the IEP meeting (typed)');await set(p,'ee.team','IEP team, 10/2/2026: teacher, para, BCBA, parent (typed)');await sleep(150);
  B=await block(p);check(/^In place/.test(B.note),'3 everything written: the block reads "In place"',B.note);
  t=await bip(p);S=eeSection(t);
  check(['Physical guidance: a light touch only, and only as the stop rule allows.','Prompts, least help first: '+MYPROMPTS,'Stop guiding at once at resistance or any sign of distress: ','What the adult does instead: '+TYPED,"The student's assent plan: Form SI-1",'If the student withdraws assent: ','The parent or guardian agreed to escape extinction, as its own item: yes, after it was explained to them','Who agreed, and when: Ms. Rivera','The team agreed: IEP team'].every(x=>S.includes(x))&&NEVER.test(S)&&!/Not in place yet/.test(S),'3 Copy for the BIP: every line, "Never force", nothing missing',S);
  const bi=t.indexOf('RESPONDING TO THE PRECURSOR AND THE TARGET BEHAVIOR'),ei=t.indexOf(EEHEAD),ci=t.indexOf('CRISIS PROCEDURE');
  check(bi>=0&&ei>bi&&(ci<0||ci>ei),'3 ... placed after the response to the target behavior and before the crisis procedure');
  F=await final(p);
  check(F.text.includes('What the adult does instead: '+TYPED)&&F.text.includes('The parent or guardian agreed to escape extinction, as its own item: yes')&&F.sign&&!/Not in place yet/.test(F.text),'3 the final plan carries every line and the initials line',F.text.slice(-300));
  W=await flow(p);
  check(/Guiding the task, and when to stop/.test(W)&&W.includes(TYPED)&&/Never force/i.test(W)&&/If the student withdraws assent/.test(W)&&/Parent or guardian agreed: yes/.test(W)&&!/Before staff start escape extinction/i.test(W),'3 the staff flowchart: the stop rule, never force, assent, the parent\'s agreement; nothing "before staff start"',W.slice(0,600));
  await view(p,'respond');await set(p,'ee.consent','no');await sleep(150);
  B=await block(p);check(/did not agree to escape extinction\. Take it out of the plan/.test(B.note),'3 the parent did not agree: take escape extinction out of the plan',B.note);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: The parent or guardian did not agree to escape extinction.'),'3 ... and the copy says so');
  await set(p,'ee.consent','yes');

  /* ---------- 4: question 4 "no" and the other functions ---------- */
  console.log('\n=== TD-1: question 4 "no", and the other functions');
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  /* the consequence-protocol card sent in step 1 still holds the escape-extinction step */
  B=await block(p);
  check(B.shown&&/Question 4 says the extinction step is not feasible here, but escape extinction is still written in the Consequence protocol for problem behavior card\. Take it out/.test(B.note),'4 "no" while a card still holds escape extinction: the block stays and says where it is written',B.note);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: Question 4 says the extinction step is not feasible here'),'4 ... and the copy says so');
  await view(p,'respond');await click(p,'#sendRespond');await view(p,'respond');
  B=await block(p);check(!B.shown,'4 the consequence protocol sent again (the alternative): the block goes');
  t=await bip(p);check(!t.includes(EEHEAD)&&!/Never force|Not in place yet/.test(t),'4 ... and Copy for the BIP has no escape-extinction section');
  F=await final(p);check(!/Escape extinction: guidance/i.test(F.text)&&!F.sign,'4 ... nor the final plan');
  W=await flow(p);check(!/Guiding the task|Help with the task|Before staff start escape extinction|Never force/i.test(W),'4 ... nor the staff flowchart');
  const saved=await saveText(p);
  await view(p,'respond');await set(p,'rb.3','yes');await sleep(150);
  check((await block(p)).shown&&await v(p,'ee.instead')===TYPED,'4 "yes" again: the block and every answer come back');
  await p.close();
  /* "not feasible" with DNRA, whose own step makes escape extinction conditional ("where feasible; if not, ..."): not
     flagged until the step is edited to use it */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','no');await sleep(150);
  await addCard(p,'DNRA');await view(p,'respond');
  check(!(await block(p)).shown,'4 "no" with the DNRA card as it comes: no block (its escape-extinction step is "where feasible")');
  await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="DNRA"]');const t=c.querySelectorAll('ol.steps textarea')[2];t.value='Place problem behavior on escape extinction (edited)';t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  await view(p,'respond');B=await block(p);
  check(B.shown&&/still written in the Differential negative reinforcement of alternative behavior \(compliance or other target\) card/.test(B.note),'4 ... edited to use escape extinction: the block shows and names the card',B.note);
  await p.close();
  /* multiple control: the block shows with question 4 "yes", and the plan carries the lines once the question is answered */
  p=await open(TD1);await set(p,'m.fn','multiple');await view(p,'respond');await set(p,'rb.3','yes');await sleep(150);
  B=await block(p);t=await bip(p);
  check(B.shown&&/If escape is one of the functions, answer the guidance question below/.test(B.note)&&!t.includes(EEHEAD),'4 multiple control, question 4 "yes": the block asks, and the copy has no section yet',B.note);
  await view(p,'respond');await set(p,'ee.pg','no');await sleep(150);t=await bip(p);
  check(t.includes(EEHEAD)&&eeSection(t).includes('Physical guidance: none.'),'4 ... answered: the copy carries the lines');
  await p.close();
  for(const fn of ['attention','tangible','automatic']){
    p=await open(TD1);await set(p,'m.fn',fn);await view(p,'respond');await set(p,'rb.3','yes');await sleep(150);
    if(fn!=='automatic')await addCard(p,'EXT');
    await view(p,'respond');B=await block(p);t=await bip(p);
    const box=await extBox(p);
    check(!B.shown&&!t.includes(EEHEAD)&&box===null,`4 ${fn}: no block, no section in the copy, no box on the EXT card`,{shown:B.shown,box});
    await p.close();
  }

  /* ---------- 5: where the procedure is picked ---------- */
  console.log('\n=== TD-1: the selector and the EXT card');
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'select');
  for(const [i,a] of [[0,'yes'],[1,'yes'],[2,'yes'],[3,'yes'],[4,'Communication']]){await set(p,'q.escape.'+i,a);}
  await sleep(200);
  const rec=await p.evaluate(()=>{const r=[...document.querySelectorAll('#selRec .rec')].find(x=>x.querySelector('.tag').textContent.trim()==='EXT');return r?r.innerText.replace(/\s+/g,' '):null;});
  check(rec&&/Before it is used: the Responding sheet records whether staff may guide the student.s hands, the stop rule for a student who resists, the student.s assent plan, and the parent.s agreement to escape extinction as its own item\./.test(rec),'5 the selector\'s EXT recommendation says what is needed before it is used',rec);
  await click(p,'#sendBuild');
  let bx=await extBox(p);
  check(bx&&bx.includes(NOGUIDE)&&bx.includes(NOCONSENT)&&/Open the Responding sheet/.test(bx),'5 the EXT card: a box with what is not in place and a way to the Responding sheet',bx);
  await setParam(p,'EXT',1,'By plan: neutral guidance only');await sleep(150);
  bx=await extBox(p);check(/This card permits physical guidance \("By plan: neutral guidance only"\)\. Answer the guidance question on the Responding sheet, and write the stop rule there\./.test(bx),'5 a card that permits guidance before the question is answered is flagged',bx);
  await view(p,'respond');await set(p,'ee.pg','no');await sleep(150);
  check(await cardParam(p,'EXT',1)==='By plan: neutral guidance only','5 typed "Physical guidance permitted" is never written over');
  bx=await extBox(p);check(/This card says physical guidance is permitted, but the Responding sheet says no guidance\./.test(bx),'5 ... and a card that disagrees with "no" is flagged',bx);
  await setParam(p,'EXT',1,'');await view(p,'respond');await set(p,'ee.pg','yes');await sleep(150);
  check(await cardParam(p,'EXT',1)==='Yes, with the stop rule (Responding sheet)','5 an empty "Physical guidance permitted" follows the answer ("yes")',await cardParam(p,'EXT',1));
  await set(p,'ee.pg','no');await sleep(150);
  check(await cardParam(p,'EXT',1)==='No (Responding sheet)','5 ... and follows it again ("no") while it holds the words the form wrote',await cardParam(p,'EXT',1));
  await p.evaluate(()=>{const b=document.querySelector('[data-ee-go]');if(b)b.click();});await sleep(300);
  check(await p.evaluate(()=>document.body.classList.contains('view-respond')),'5 the card\'s button opens the Responding sheet');

  /* ---------- 6: the C_SR caution ---------- */
  console.log('\n=== TD-1: the restraint-like items card (C_SR)');
  const p6=await open(TD1);await set(p6,'m.fn','automatic');await sleep(150);
  {const p=p6;await addCard(p,'C_SR');
  const cau=await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="C_SR"] .card-caution');return c?c.innerText:'';});
  check(/Restraint-like items here are ones the student chooses and can take off/.test(cau)&&/Staff never hold the student, and never put on or fasten an item that stops the student moving/.test(cau)&&/that is restraint/.test(cau),'6 the C_SR card shows its caution',cau);
  F=await final(p);check(/Caution\. Restraint-like items here are ones the student chooses/.test(F.text),'6 ... the final plan carries it');
  t=await bip(p);check(t.includes('Caution: Restraint-like items here are ones the student chooses'),'6 ... Copy for the BIP carries it');
  W=await flow(p);check(/Restraint-like items here are ones the student chooses/.test(W),'6 ... the staff flowchart carries it');
  await p.emulateMedia({media:'print'});
  check(await p.evaluate(()=>{const e=document.querySelector('#compWrap .card[data-code="C_SR"] .card-caution');return !!e&&e.getClientRects().length>0;}),'6 ... and it prints');
  await p.emulateMedia({media:'screen'});await p.close();}

  /* ---------- 7: the Guide and print ---------- */
  console.log('\n=== TD-1: the Guide and print');
  const guide=await p.evaluate(()=>{const g=document.querySelector('#guide #eeGuide');return g?g.innerText.replace(/\s+/g,' '):''; });
  check(/physical guidance in escape extinction/i.test(guide)&&/The least help first/.test(guide)&&/A written stop rule/.test(guide)&&/Never force/.test(guide)&&/1003\.573\(3\)/.test(guide)&&/Assent/.test(guide)&&/Consent\. Escape extinction is its own consent item/.test(guide),'7 the Guide explains the least help, the stop rule, never force, assent and consent',guide.slice(0,300));
  await view(p,'respond');await set(p,'ee.pg','yes');
  await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await sleep(300);
  const pr=await p.evaluate(()=>{const vis=s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0;};
    return {block:vis('#eeBlock'),stop:vis('#eeBlock .ee-yes'),never:vis('#eeNever'),box:vis('#compWrap .card[data-code="EXT"] .ee-card'),btn:vis('#compWrap .card[data-code="EXT"] .ee-card button'),guide:vis('#eeGuide')};});
  check(pr.block&&pr.stop&&pr.never&&pr.box&&!pr.btn&&pr.guide,'7 print: the block, the stop rule, "Never force", the EXT box (no button) and the Guide box print',pr);
  await p.evaluate(()=>{document.querySelector('#viewSeg button[data-view="final"]').click();});await sleep(200);
  check(await p.evaluate(()=>{const e=document.querySelector('#finalBody .ee-sign');return !!e&&e.getClientRects().length>0;}),'7 print: the line for the parent\'s initials prints with the final plan');
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await p.close();

  /* ---------- 8: files ---------- */
  console.log('\n=== TD-1: saved files');
  const SV=JSON.parse(saved);
  check(SV.fields['ee.instead']===TYPED&&SV.fields['ee.consent']==='yes','8 the file holds the new answers');
  p=await open(TD1);await openFile(p,saved);
  let f=await fields(p);
  let diff=Object.keys(SV.fields).filter(k=>k in f&&String(f[k])!==String(SV.fields[k]));
  check(!diff.length,'8 it opens with every field as saved',diff.slice(0,5));
  await view(p,'respond');await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  f=await fields(p);diff=Object.keys(SV.fields).filter(k=>k in f&&String(f[k])!==String(SV.fields[k]));
  check(!diff.length,'8 ... and keeps them through a visit to Responding and a print',diff.slice(0,5));
  const re=JSON.parse(await saveText(p));
  check(Object.keys(SV.fields).every(k=>String(re.fields[k])===String(SV.fields[k])),'8 ... and saves again the same');
  await p.close();
  /* a file from before this change: the simulation saved, the new fields taken out (or a file named by A1_OLD_TD1) */
  let old;
  if(process.env.A1_OLD_TD1){old=JSON.parse(fs.readFileSync(process.env.A1_OLD_TD1,'utf8'));console.log('  (file: '+process.env.A1_OLD_TD1+')');}
  else{p=await open(TD1);await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simScenario').value='escape_fct';document.querySelector('#simBtn').click();});await sleep(1300);old=JSON.parse(await saveText(p));await p.close();
    Object.keys(old.fields).filter(k=>/^ee\./.test(k)).forEach(k=>delete old.fields[k]);
    const ci=(old.counts.comps||[]).indexOf('EXT');if(ci>=0){const i=(old.counts.idx||[])[ci];old.fields[`cp[${i}].p1`]='By plan: neutral guidance only';}}
  check(!Object.keys(old.fields).some(k=>/^ee\./.test(k)),'8 the older file has none of the new fields');
  p=await open(TD1);await openFile(p,JSON.stringify(old));
  f=await fields(p);diff=Object.keys(old.fields).filter(k=>k in f&&String(f[k])!==String(old.fields[k]));
  check(!diff.length,'8 the older file opens with every field as saved',diff.slice(0,5));
  check(['ee.pg','ee.prompts','ee.stop','ee.instead','ee.assent','ee.withdraw','ee.consent','ee.cwho','ee.team'].every(k=>f[k]===''),'8 ... the new boxes are empty: nothing is filled in on opening');
  await view(p,'respond');B=await block(p);
  check(B.shown&&B.note.includes(NOGUIDE)&&B.note.includes(NOCONSENT),'8 ... the block shows what is not in place (guidance not decided, so no guiding; no consent, so not started)',B.note);
  bx=await extBox(p);check(/This card permits physical guidance/.test(bx||''),'8 ... and the EXT card that permits guidance is flagged',bx);
  t=await bip(p);check(eeSection(t).includes('- Not in place yet: '+NOGUIDE),'8 ... and Copy for the BIP says so');
  f=await fields(p);diff=Object.keys(old.fields).filter(k=>k in f&&String(f[k])!==String(old.fields[k]));
  check(!diff.length&&f['ee.pg']==='','8 ... still nothing changed after the visit and the copy',diff.slice(0,5));
  await p.close();

  /* ---------- 9: the simulations ---------- */
  console.log('\n=== TD-1: the simulations');
  for(const [k,pg,show] of [['escape_fct','yes',true],['sbt','no',true],['escape_nce','no',true],['attention_ncr','',false]]){
    p=await open(TD1);await p.evaluate(k=>{window.confirm=()=>true;document.querySelector('#simScenario').value=k;document.querySelector('#simBtn').click();},k);await sleep(1300);
    await view(p,'respond');B=await block(p);t=await bip(p);bx=await extBox(p);
    const ok=show?(B.shown&&/^In place/.test(B.note)&&await v(p,'ee.pg')===pg&&t.includes(EEHEAD)&&!/Not in place yet/.test(t)&&(bx===null||!/This card/.test(bx))):(!B.shown&&!t.includes(EEHEAD));
    check(ok,`9 ${k}: ${show?'worked through (guidance '+pg+'), nothing missing, no card flagged':'no block'}`,{note:B.note,pg:await v(p,'ee.pg'),bx});
    await p.close();
  }

  /* ---------- 10: DA-1 ---------- */
  console.log('\n=== DA-1: the physical prompt');
  p=await open(DA1);
  const rule=()=>p.evaluate(()=>{const e=document.querySelector('#pgRule');return e?{shown:!e.hidden,text:e.innerText.replace(/\s+/g,' ')}:null;});
  const setM=(m,val)=>p.evaluate(([m,val])=>{const e=document.querySelector(`[data-m="${m}"]`);e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[m,val]);
  let R=await rule();check(R&&!R.shown,'10 fresh: no stop rule until a prompting sequence with physical guidance is chosen',R);
  await setM('prompt','Three-step: vocal, then model, then physical guidance, about 5 seconds apart');await sleep(150);
  R=await rule();
  check(R.shown&&/light touch that helps the student move, never force and never a hold/.test(R.text)&&/Let go at once if the student pulls away, pushes against your hand, or goes stiff/.test(R.text)&&/Keep the task in place\. After a short calm pause/.test(R.text)&&/assent plan \(Form SI-1\)/.test(R.text)&&/crisis plan \(Form CR-1\) only for imminent danger/.test(R.text),'10 three-step sequence: the stop rule shows (light touch, let go, the task stays, calm pause, assent, crisis plan only for imminent danger)',R.text.slice(0,300));
  await setM('prompt','Two-step: vocal, then model (no physical guidance)');await sleep(150);
  check(!(await rule()).shown,'10 two-step sequence (no physical guidance): no stop rule');
  await p.evaluate(()=>{const s=document.querySelector('#taskTbl select[data-f="prompt"]');s.value='Vocal, model, physical';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  check((await rule()).shown,'10 a task prompted "vocal, model, physical": the stop rule shows');
  await p.emulateMedia({media:'print'});
  check(await p.evaluate(()=>document.querySelector('#pgRule').getClientRects().length>0),'10 the stop rule prints');
  await p.emulateMedia({media:'screen'});
  const da=await p.evaluate(()=>({proc:[...document.querySelectorAll('.only-assessment .instr li')].map(l=>l.textContent).join(' '),guide:[...document.querySelectorAll('.only-guide tr')].map(r=>r.textContent.replace(/\s+/g,' ')).find(x=>/^Physical guidance/.test(x))||''}));
  check(/Physical guidance is a light touch, never force: let go at once if the student resists or shows distress, keep the task in place/.test(da.proc),'10 the procedure on the Assessment sheet states the rule',da.proc.slice(-260));
  check(/never force and never a hold/.test(da.guide)&&/1003\.573\(3\)/.test(da.guide)&&/Form TD-1/.test(da.guide),'10 the Guide states it, and names TD-1\'s rule',da.guide.slice(0,200));
  await p.close();
  p=await open(DA1);await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simBtn').click();});await sleep(1300);
  check((await rule()).shown,'10 the simulation (three-step prompting) shows the stop rule');
  await p.close();

  const errs=log.filter(l=>l.type!=='warning');
  check(errs.length===0,'no console or page errors',errs.slice(0,4));
  await br.close();console.log('\nFAILURES: '+fails);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
