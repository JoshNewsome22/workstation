/* Sprint package A1: the plan follows your answers (TD-1, SR-1).
   TD-1, on the Responding sheet, "On the target behavior" follows question 4 (is the function-matched extinction
   step feasible here?). The steps are the checker's (scratchpad td1_ext_verify2.js), on a fresh form:
   1  function escape, Responding opened: the step is empty and a note points to question 4; no extinction step is
      recommended yet.
   2  question 4 "no": the step is the alternative (noncontingent escape or DNRA), the selector lists the alternative
      (NCE) first and no longer recommends escape extinction; Copy for the BIP, the consequence-protocol card, the
      staff flowchart and the final plan carry the alternative and no escape extinction (none of the checker's
      /xtinction|no break|guid/ lines in the copy).
   3  question 4 "yes": escape extinction comes back, in the field, the selector, the copy and the flowchart;
      unanswered again: the step empties.
   4  typed text survives every change of answer (questions 1 and 4) and every redraw; question 1 changed while the
      step holds filled-in words: the step follows the new function.
   5  the other functions: "no" gives each its alternative, listed first (attention and tangible NCR, automatic EE).
   6  a fresh escape case answered "yes" gets escape extinction.
   7  files: a saved file (by default the escape simulation saved here; A1_OLD_TD1=<file> uses an older one) opens
      with every field as saved and keeps the step through a visit to Responding and a print; the old fault (question
      4 "no", the escape extinction step) and an unanswered question with the step filled in open unchanged, with the
      note, the warning about the EXT card, and the button that replaces the step.
   8  Load simulation asks first in TD-1 and SR-1, with the question the other forms ask: Cancel keeps every field;
      Load loads.
   The review's cases (fix pass):
   9  the consequence-protocol card follows a change of answer: "yes", Send, then "no"; "no", Send, then "yes"; the
      escape simulation answered "no" (its card was never sent). Each leaves no escape extinction, and no "not
      feasible" after "yes", in the card, Copy for the BIP, the staff flowchart or the final plan; in the simulation,
      the note names every other place that still describes extinction, and once those are put right nothing in the
      three outputs does. Words edited on the card are kept and named, with a button that sends the protocol again;
      a card added from the build sheet after "no" does not start with the extinction step.
   10 a file saved before this change, "no" with the extinction step (and one unanswered with the step filled in):
      opening it says so; Copy for the BIP, Build staff flowchart and Print final plan only ask first (Go to
      Responding: nothing leaves the form; the other button goes ahead); no field is changed; a file that follows
      question 4 is copied without a question.
   11 after "no", the note names what still describes extinction: the simulations' own steps are the form's words
      (replaced by the alternative); a step with words added by hand is kept and named, with the button; the Demand
      fading card's escape-extinction step.
   12 attention and tangible: question 4 takes the Select sheet's own answer (is extinction feasible?) while it is
      empty, and the note names a disagreement between the two.
   13 wording: both extinction cards ("remove them"), a step written for a different function, the automatic
      recommendation after "no".
   No console or page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8301 node qa/sprint-a1-test.js [edition folder, default NBH-Workstation] */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const TD1='TD-1_Function-Based-Treatment-Developer_v2026-09.html',SR1='SR-1_Schedules-of-Reinforcement_v2026-10.html';
const EXT={escape:'Escape extinction: continue the prompt sequence; no break',attention:'Attention extinction: no attention, comments, or eye contact',tangible:'Tangible extinction: item not returned',automatic:'Neutral block or interruption; redirect to matched item',multiple:'Function-matched extinction for each function'};
const ALT={escape:'Noncontingent escape (breaks on the timer) or DNRA: the alternative earns a longer, sooner break than the behavior',attention:'NCR (attention on the timer) or DRA: the alternative earns more, sooner attention than the behavior',tangible:'NCR (the item on the timer) or DRA: the alternative earns longer, sooner access than the behavior',automatic:'Matched items available throughout (EE) and DRA; redirect to a matched item; block only per the safety plan',multiple:'For each function: noncontingent reinforcement or DRA, the alternative earning more, sooner, than the behavior'};
const ESC_EXT=/Escape extinction|continue the prompt sequence|no break|continue the instruction through the prompt sequence|function-matched extinction step/i;   /* escape extinction, in any of the words this form uses for it */
const CHECKER=/xtinction|no break|guid/i;   /* td1_ext_verify2.js: the lines of the BIP copy it reports */
let fails=0;const check=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(c||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,400)));if(!c)fails++;};

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
  const click=async(p,s)=>{const there=await p.evaluate(s=>{const b=document.querySelector(s);if(b)b.click();return !!b;},s);if(!there)check(false,'the button '+s+' is there');await sleep(300);};
  const note=p=>p.evaluate(()=>{const n=document.querySelector('#rbExtNote');return n&&!n.hidden?n.innerText.replace(/\s+/g,' ').trim():'';});
  /* each recommendation: its code, and its name and reasons one per line (run together, "Noncontingent escape" and
     "Extinction not feasible" would read as "escape extinction") */
  const recs=p=>p.evaluate(()=>[...document.querySelectorAll('#rbRec .rec')].map(r=>({code:r.querySelector('.tag').textContent.trim(),text:[r.querySelector('.rh b'),...r.querySelectorAll('p')].map(x=>x?x.textContent.replace(/\s+/g,' ').trim():'').join('\n')})));
  const bip=async p=>{await p.evaluate(()=>navigator.clipboard.writeText(''));await click(p,'#bipBtn');await sleep(300);return p.evaluate(()=>navigator.clipboard.readText());};
  const flow=async p=>{await view(p,'plan');await click(p,'#flowBtn');return p.evaluate(()=>document.querySelector('#flowBlock').innerText);};
  const card=(p,code)=>p.evaluate(code=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);if(!c)return null;const i=c.dataset.i;
    return {p0:(document.querySelector(`[name="cp[${i}].p0"]`)||{}).value,steps:[...c.querySelectorAll('ol.steps textarea')].map(t=>t.value)};},code);
  const fields=p=>p.evaluate(()=>{const f={};document.querySelectorAll('[name]').forEach(e=>{f[e.name]=e.type==='checkbox'?e.checked:e.value;});return f;});
  const saveText=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const openFile=async(p,text)=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'TD-1_old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(700);};
  const dlg=p=>p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');if(!d||!d.open)return null;return {head:d.querySelector('#nbhUiH').textContent,body:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)};});
  const press=(p,label)=>p.evaluate(l=>{const b=[...document.querySelectorAll('#nbhUiDlg #nbhUiF button')].find(x=>x.textContent===l);if(!b)return false;b.click();return true;},label);

  /* ---------- 1-4: the checker's steps, on a fresh form ---------- */
  console.log('\n=== TD-1: escape, question 4');
  let p=await open(TD1);
  check(await set(p,'m.fn','escape'),'function set to escape on the setup sheet');
  await view(p,'respond');
  check(await v(p,'rb.target')==='','1 unanswered: the step is empty',await v(p,'rb.target'));
  check(/question 4/i.test(await note(p)),'1 unanswered: the note points to question 4',await note(p));
  check(!(await recs(p)).some(r=>ESC_EXT.test(r.text)),'1 unanswered: no extinction step is recommended yet',await recs(p));
  await set(p,'rb.3','no');await sleep(200);
  check(await v(p,'rb.target')===ALT.escape,'2 "no": the step is the alternative at once',await v(p,'rb.target'));
  let R=await recs(p);
  check(R.length&&R[0].code==='NCE','2 "no": the alternative (NCE) is listed first',R.map(r=>r.code));
  check(!R.some(r=>ESC_EXT.test(r.text)),'2 "no": escape extinction is no longer recommended',R);
  check(await note(p)==='','2 "no": no note',await note(p));
  await view(p,'select');await view(p,'respond');
  check(await v(p,'rb.target')===ALT.escape,'2 "no": the step is kept through a redraw of the sheet');
  let t=await bip(p);
  check(t.includes('On the target behavior: '+ALT.escape),'2 Copy for the BIP carries the alternative',t.slice(0,300));
  check(!ESC_EXT.test(t),'2 Copy for the BIP has no escape extinction');
  check(t.split('\n').filter(l=>CHECKER.test(l)).length===0,'2 the checker finds no extinction line in the copy',t.split('\n').filter(l=>CHECKER.test(l)));
  /* only the step itself is filled, as in the checker's run, so the card's own generic extinction step sits in a slot
     the sheet's lines do not reach */
  await click(p,'#sendRespond');
  let C=await card(p,'R_PB');
  check(C&&C.p0==='none (not feasible in this setting)','2 the consequence-protocol card: its extinction form says "none (not feasible in this setting)"',C);
  check(C&&C.steps.includes('On the target behavior: '+ALT.escape)&&!C.steps.some(s=>ESC_EXT.test(s)),'2 the card\'s steps carry the alternative and no extinction step',C&&C.steps);
  let F=await flow(p);
  check(F.includes('Planned response')&&F.includes(ALT.escape),'2 the staff flowchart carries the alternative',F.slice(0,400));
  check(!ESC_EXT.test(F),'2 the staff flowchart has no escape extinction',(F.match(ESC_EXT)||[])[0]);
  t=await bip(p);
  check(t.includes(ALT.escape)&&!ESC_EXT.test(t),'2 Copy for the BIP with the card: the alternative, no escape extinction',(t.match(ESC_EXT)||[])[0]);
  await view(p,'final');
  const fin=await p.evaluate(()=>document.querySelector('#finalBody').innerText);
  check(fin.includes(ALT.escape)&&!ESC_EXT.test(fin),'2 the final plan carries the alternative, no escape extinction',(fin.match(ESC_EXT)||[])[0]);
  await view(p,'respond');
  await set(p,'rb.3','yes');await sleep(200);
  check(await v(p,'rb.target')===EXT.escape,'3 "yes": escape extinction comes back',await v(p,'rb.target'));
  R=await recs(p);
  check(R.length&&R[0].code==='R_PB'&&/continue the instruction through the prompt sequence/.test(R[0].text)&&!R.some(r=>r.code==='NCE'),'3 "yes": the selector recommends escape extinction first, NCE gone',R.map(r=>r.code));
  t=await bip(p);check(t.includes('On the target behavior: '+EXT.escape),'3 "yes": Copy for the BIP carries escape extinction');
  await view(p,'respond');await click(p,'#sendRespond');
  C=await card(p,'R_PB');check(C&&C.p0===EXT.escape,'3 "yes": the card\'s extinction form is escape extinction again',C&&C.p0);
  F=await flow(p);check(F.includes(EXT.escape),'3 "yes": the staff flowchart carries escape extinction');
  await view(p,'respond');
  await set(p,'rb.3','');await sleep(200);
  check(await v(p,'rb.target')===''&&/question 4/i.test(await note(p)),'3 unanswered again: the step empties and the note returns',[await v(p,'rb.target'),await note(p)]);
  /* 4: typed text */
  await set(p,'rb.3','yes');
  const TYPED='Hold the demand; prompt the break card; brief neutral guidance only (typed)';
  await set(p,'rb.target',TYPED);
  for(const a of ['no','','yes','no']){await set(p,'rb.3',a);await sleep(120);}
  await set(p,'rb.0','attention');await sleep(120);await set(p,'rb.0','escape');await sleep(120);
  await view(p,'select');await view(p,'respond');await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  check(await v(p,'rb.target')===TYPED,'4 typed text survives every change of answer, a redraw and a print',await v(p,'rb.target'));
  check(await note(p)==='','4 typed text: no note under it',await note(p));
  await set(p,'rb.target','');await set(p,'rb.3','');await set(p,'rb.3','yes');
  check(await v(p,'rb.target')===EXT.escape,'4 emptied by hand, then answered: filled in again');
  await set(p,'rb.0','attention');await sleep(150);
  check(await v(p,'rb.target')===EXT.attention,'4 question 1 changed while the step holds filled-in words: the step follows the function',await v(p,'rb.target'));
  await set(p,'rb.3','no');await sleep(150);
  check(await v(p,'rb.target')===ALT.attention,'4 and question 4 "no" for attention: its alternative',await v(p,'rb.target'));
  await p.close();

  /* ---------- 5: the other functions ---------- */
  console.log('\n=== TD-1: the other functions');
  const FIRST={escape:'NCE',attention:'NCR',tangible:'NCR',automatic:'EE',multiple:'NCR'};
  for(const fn of Object.keys(FIRST)){
    p=await open(TD1);await set(p,'m.fn',fn);await view(p,'respond');
    const empty=await v(p,'rb.target');
    await set(p,'rb.3','no');await sleep(150);
    const got=await v(p,'rb.target');R=await recs(p);
    await set(p,'rb.3','yes');await sleep(150);
    const yes=await v(p,'rb.target');
    check(empty===''&&got===ALT[fn]&&R.length&&R[0].code===FIRST[fn]&&yes===EXT[fn],`5 ${fn}: empty, "no" gives the alternative with ${FIRST[fn]} first, "yes" the extinction step`,{empty,got,first:R.map(r=>r.code),yes});
    await p.close();
  }

  /* ---------- 6: a fresh escape case answered "yes" ---------- */
  console.log('\n=== TD-1: a fresh escape case answered "yes"');
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','yes');await sleep(150);
  check(await v(p,'rb.target')===EXT.escape,'6 the step is escape extinction');
  t=await bip(p);check(t.includes('On the target behavior: '+EXT.escape),'6 Copy for the BIP carries it');
  await view(p,'respond');await click(p,'#sendRespond');F=await flow(p);
  check(F.includes(EXT.escape),'6 the staff flowchart carries it');
  await p.close();

  /* ---------- 7: files ---------- */
  console.log('\n=== TD-1: saved files');
  let base;
  if(process.env.A1_OLD_TD1){base=fs.readFileSync(process.env.A1_OLD_TD1,'utf8');console.log('  (file: '+process.env.A1_OLD_TD1+')');}
  else{p=await open(TD1);await p.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simScenario').value='escape_fct';document.querySelector('#simBtn').click();});await sleep(1200);base=await saveText(p);await p.close();}
  const B=JSON.parse(base);
  check(B.form==='TD-1'&&B.fields&&B.fields['rb.target']===EXT.escape&&B.fields['rb.3']==='yes'&&(B.counts.comps||[]).includes('EXT'),'7 the file: an escape case with question 4 "yes", the extinction step and an EXT card',{f:B.form,t:B.fields&&B.fields['rb.target'],a:B.fields&&B.fields['rb.3']});
  const variant=(a,tg)=>{const d=JSON.parse(base);d.fields['rb.3']=a;if(tg!==undefined)d.fields['rb.target']=tg;return JSON.stringify(d);};
  const same=async(p,want,label)=>{const f=await fields(p);const diff=Object.keys(want).filter(k=>k in f&&String(f[k])!==String(want[k]));check(diff.length===0,label,diff.slice(0,5).map(k=>[k,want[k],f[k]]));};
  /* as saved */
  p=await open(TD1);await openFile(p,base);
  await same(p,B.fields,'7 the file opens with every field as saved');
  await view(p,'respond');await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await same(p,B.fields,'7 ... and keeps them through a visit to Responding and a print');
  check(await note(p)==='','7 ... with no note (the step fits the answers)',await note(p));
  const re=JSON.parse(await saveText(p));
  check(Object.keys(B.fields).every(k=>!(k in re.fields)||String(re.fields[k])===String(B.fields[k]))&&JSON.stringify(re.counts.comps)===JSON.stringify(B.counts.comps),'7 ... and saves again the same');
  await p.close();
  /* the old fault: "not feasible" with the extinction step filled in */
  const OLD=variant('no');
  p=await open(TD1);await openFile(p,OLD);
  await view(p,'respond');await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  check(await v(p,'rb.target')===EXT.escape,'7 the old fault opens unchanged ("no", the extinction step): nothing is changed on opening or printing');
  let n=await note(p);
  check(/not feasible/.test(n)&&/Use the alternative/.test(n),'7 ... the note names it and offers to replace it',n);
  check(/Extinction \(matched to function\) card/.test(n),'7 ... and warns that the plan still holds the EXT card',n);
  await p.evaluate(()=>{if(window.nbhGuard)window.nbhGuard.clean();});
  await click(p,'#rbUseStep');
  check(await v(p,'rb.target')===ALT.escape,'7 the button replaces the step with the alternative',await v(p,'rb.target'));
  check(await p.evaluate(()=>!window.nbhGuard||window.nbhGuard.isDirty()),'7 ... and the form counts as changed (unsaved)');
  check(!/Use the alternative/.test(await note(p)),'7 ... the offer goes; the EXT warning stays while the card does',await note(p));
  await p.close();
  /* unanswered, with the step filled in (files saved before this change) */
  p=await open(TD1);await openFile(p,variant(''));
  await view(p,'respond');
  check(await v(p,'rb.target')===EXT.escape,'7 unanswered with the step filled in: opens unchanged');
  check(/before question 4 was answered/.test(await note(p)),'7 ... and the note says so',await note(p));
  await set(p,'rb.3','no');await sleep(150);
  check(await v(p,'rb.target')===ALT.escape,'7 ... answering "no" then gives the alternative');
  await p.close();
  /* a file with the step typed */
  p=await open(TD1);await openFile(p,variant('no','Our own words for the response (typed)'));await view(p,'respond');
  await set(p,'rb.3','yes');await set(p,'rb.3','no');
  check(await v(p,'rb.target')==='Our own words for the response (typed)'&&!/Use the/.test(await note(p)),'7 a typed step in a file is kept and not flagged');
  await p.close();

  /* ---------- 8: Load simulation asks first ---------- */
  for(const F2 of [{id:'TD-1',file:TD1,head:/^Load the simulated case\?$/,
      fill:async p=>{await set(p,'m.client','Real Student (typed)');await set(p,'m.beh','Real behavior (typed)');await set(p,'m.fn','tangible');await view(p,'respond');await set(p,'rb.3','no');await set(p,'rb.not','Typed rule');},
      state:p=>fields(p),loaded:p=>v(p,'m.client')},
    {id:'SR-1',file:SR1,head:/^Load (a|the) simulated .*\?$/,
      fill:async p=>{await p.evaluate(()=>{for(const [k,val] of [['client','Real Student (typed)'],['beh','Real behavior (typed)']]){const e=document.querySelector(`[data-m="${k}"]`);if(e){e.value=val;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}const s=document.querySelector('#catSearch');if(s){s.value='lag';s.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(200);},
      state:p=>p.evaluate(()=>JSON.stringify(S)+'|'+[...document.querySelectorAll('input,textarea,select')].map(e=>e.type==='checkbox'?e.checked:e.value).join('\u0001')),loaded:p=>p.evaluate(()=>S.meta.client)}]){
    console.log('\n=== '+F2.id+': Load simulation');
    p=await open(F2.file);await F2.fill(p);
    const before=await F2.state(p);
    await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(250);
    const d=await dlg(p);
    check(d&&F2.head.test(d.head)&&/Anything already entered will be replaced\./.test(d.body)&&d.btns.includes('Cancel'),'8 '+F2.id+': Load simulation asks first, with the shared question',d);
    if(d){await press(p,'Cancel');await sleep(400);}
    check(!(await dlg(p)),'8 '+F2.id+': the question closes on Cancel');
    const after=await F2.state(p);
    check(JSON.stringify(after)===JSON.stringify(before),'8 '+F2.id+': Cancel keeps every field');
    await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(250);
    const d2=await dlg(p);if(d2){await press(p,d2.btns.find(b=>b!=='Cancel'));}
    await sleep(1200);
    check(/SIMULATED/.test(await F2.loaded(p)||''),'8 '+F2.id+': the other button loads the simulation',await F2.loaded(p));
    await p.close();
  }

  /* ---------- the review's cases (fix pass) ---------- */
  const NONE='none (not feasible in this setting)',TGT='On the target behavior: ';
  const GEN='On the target behavior: deliver the function-matched extinction step (see the respond sheet) with a neutral face and no discussion.';
  const finalText=async p=>{await view(p,'final');return p.evaluate(()=>document.querySelector('#finalBody').innerText);};
  const sim=async(p,key)=>{await p.evaluate(k=>{const c=window.confirm;window.confirm=()=>true;document.querySelector('#simScenario').value=k;document.querySelector('#simBtn').click();window.confirm=c;},key);await sleep(1300);};
  /* the three outputs at once: Copy for the BIP, the staff flowchart, the final plan */
  const outs=async p=>({bip:await bip(p),flow:await flow(p),fin:await finalText(p)});
  const cardOk=C=>!!C&&!ESC_EXT.test(C.p0||'')&&!C.steps.some(s=>ESC_EXT.test(s));
  const cleanOf=(O,re)=>['bip','flow','fin'].filter(k=>re.test(O[k]));
  const setCard=(p,code,f,v)=>p.evaluate(([code,f,v])=>{const c=document.querySelector(`#compWrap .card[data-code="${code}"]`);const e=c&&document.querySelector(`[name="cp[${c.dataset.i}].${f}"]`);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},[code,f,v]);
  const toast=p=>p.evaluate(()=>{const h=document.querySelector('#nbhToasts');return h?h.innerText.replace(/\s+/g,' ').trim():'';});

  console.log('\n=== TD-1: the consequence-protocol card follows a change of answer');
  /* 9a: "yes", Send, then "no" */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','yes');await click(p,'#sendRespond');
  C=await card(p,'R_PB');check(C&&C.p0===EXT.escape&&C.steps.includes(TGT+EXT.escape),'9a "yes" + Send: the card holds escape extinction',C);
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  C=await card(p,'R_PB');
  check(C&&C.p0===NONE&&C.steps.includes(TGT+ALT.escape)&&cardOk(C)&&!C.steps.includes(GEN),'9a then "no": the card says "none" and carries the alternative, without asking for another Send',C);
  check(await note(p)==='','9a ... and no note (nothing left to put right)',await note(p));
  let O=await outs(p);
  check(cleanOf(O,ESC_EXT).length===0&&O.bip.includes(TGT+ALT.escape)&&O.flow.includes(ALT.escape)&&O.fin.includes(ALT.escape),'9a ... Copy for the BIP, the flowchart and the final plan: the alternative, no escape extinction',cleanOf(O,ESC_EXT));
  await p.close();
  /* 9b: "no", Send, then "yes" */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','no');await click(p,'#sendRespond');
  await view(p,'respond');await set(p,'rb.3','yes');await sleep(200);
  C=await card(p,'R_PB');
  check(C&&C.p0===EXT.escape&&C.steps.includes(TGT+EXT.escape)&&!C.steps.some(s=>s.includes(ALT.escape)),'9b "no" + Send, then "yes": the card holds escape extinction again, no "none" and no alternative',C);
  O=await outs(p);
  check(cleanOf(O,/not feasible in this setting|Noncontingent escape \(breaks on the timer\)/).length===0&&O.bip.includes('Extinction form: '+EXT.escape),'9b ... the three outputs no longer say "not feasible" or carry the alternative',cleanOf(O,/not feasible in this setting|Noncontingent escape \(breaks/));
  await view(p,'respond');check(await note(p)==='','9b ... and no note',await note(p));
  await p.close();
  /* 9c: the escape simulation (its card never sent), answered "no" */
  p=await open(TD1);await sim(p,'escape_fct');
  C=await card(p,'R_PB');check(C&&C.steps.includes(GEN),'9c the escape simulation: its card holds the generic extinction step',C&&C.steps);
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  C=await card(p,'R_PB');
  check(cardOk(C)&&!C.steps.includes(GEN)&&C.steps.includes(TGT+ALT.escape),'9c then "no": the card\'s generic step becomes the alternative',C&&C.steps);
  n=await note(p);
  check(/Extinction \(matched to function\) card/.test(n)&&/What staff do not do/.test(n)&&/the FCT card, Extinction procedure and step 5/.test(n)&&!/consequence-protocol card/.test(n),'9c ... the note names the EXT card, "What staff do not do" and the FCT card\'s Extinction procedure and step 5',n);
  O=await outs(p);
  /* the card's own lines in the copy: from its "Component:" line to the next component or section */
  const RPB=t=>{const i=t.indexOf('Component: Consequence protocol for problem behavior');if(i<0)return '';const r=t.slice(i+10),j=r.search(/\nComponent: |\n\n/);return j<0?r:r.slice(0,j);};
  check(RPB(O.bip).includes(TGT+ALT.escape)&&!/xtinction|no break|prompt sequence/i.test(RPB(O.bip)),'9c ... the card\'s lines in Copy for the BIP: the alternative, no extinction',RPB(O.bip));
  /* put right what the note names: the plan then carries extinction nowhere (the SΔ periods of a multiple schedule are not extinction of the behavior) */
  await view(p,'build');await p.evaluate(()=>{const c=document.querySelector('#compWrap .card[data-code="EXT"]');c.querySelector('[data-rm]').click();});
  await setCard(p,'FCT','p3','none (not feasible in this setting)');await setCard(p,'FCT','s4','Problem behavior: the break comes on the NCE timer, not after the behavior (typed)');
  await view(p,'respond');await set(p,'rb.not','No negotiation and no comments about the behavior (typed)');
  check(await note(p)==='','9c ... once those are edited the note is empty',await note(p));
  O=await outs(p);
  const BROAD=/extinction|no break|prompt sequence|guided compliance|not returned/i,SCHED=/extinction (component|period|challenge)|not feasible/i;
  const left=['bip','flow','fin'].flatMap(k=>O[k].split('\n').filter(l=>BROAD.test(l)&&!SCHED.test(l)).map(l=>k+': '+l.slice(0,120)));
  check(left.length===0,'9c ... and Copy for the BIP, the flowchart and the final plan describe extinction nowhere',left);
  await p.close();
  /* 9d: words edited on the card are kept, named, and Send again puts them right */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','yes');await click(p,'#sendRespond');
  await setCard(p,'R_PB','p0','Escape extinction with hand-over-hand guidance (typed on the card)');
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  C=await card(p,'R_PB');n=await note(p);
  check(C.p0==='Escape extinction with hand-over-hand guidance (typed on the card)'&&C.steps.includes(TGT+ALT.escape),'9d typed on the card, then "no": the typed words are kept, the step the form sent follows',C);
  check(/consequence-protocol card on the build sheet still holds the extinction step \(Extinction form\): send the consequence protocol again/.test(n)&&/Send the consequence protocol again/.test(n),'9d ... the note names the card, with a button that sends the protocol again',n);
  await p.evaluate(()=>{if(window.nbhGuard)window.nbhGuard.clean();});
  await click(p,'#rbSendAgain');
  C=await card(p,'R_PB');
  check(C.p0===NONE&&cardOk(C),'9d ... the button sends the protocol again: the card says "none"',C);
  check(await p.evaluate(()=>!window.nbhGuard||window.nbhGuard.isDirty()),'9d ... and the form counts as changed');
  await view(p,'respond');check(await note(p)==='','9d ... the note is empty',await note(p));
  await p.close();
  /* 9e: a card added from the build sheet after "no" */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','no');await view(p,'build');
  await p.evaluate(()=>{const s=document.querySelector('#addComp');s.value='R_PB';document.querySelector('#addCompBtn').click();});await sleep(200);
  C=await card(p,'R_PB');
  check(C&&!C.steps.includes(GEN)&&C.steps.includes(TGT+ALT.escape)&&cardOk(C),'9e a card added from the build sheet after "no" starts with the alternative, not the extinction step',C&&C.steps);
  await p.close();

  console.log('\n=== TD-1: a file saved before this change, opened and put to use');
  /* 10: the old fault ("no" with the extinction step) and an unanswered question with the step filled in */
  const FAULT=variant('no');const FB=JSON.parse(FAULT);
  p=await open(TD1);await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;};});await openFile(p,FAULT);
  check(/does not follow question 4/.test(await toast(p))&&/still the extinction step/.test(await toast(p)),'10 opening it says the plan does not follow question 4',await toast(p));
  await same(p,FB.fields,'10 ... and opens with every field as saved');
  /* Copy for the BIP */
  await p.evaluate(()=>navigator.clipboard.writeText('(nothing copied)'));
  await p.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(300);
  let D=await dlg(p);
  check(D&&/does not follow question 4/.test(D.head)&&/still the extinction step/.test(D.body)&&JSON.stringify(D.btns)===JSON.stringify(['Go to Responding','Copy anyway']),'10 Copy for the BIP asks first, naming the step, with Go to Responding and Copy anyway',D);
  await press(p,'Go to Responding');await sleep(300);
  check(await p.evaluate(()=>navigator.clipboard.readText())==='(nothing copied)'&&await p.evaluate(()=>document.body.className==='view-respond'),'10 ... Go to Responding: nothing is copied, and the Responding sheet is shown');
  await p.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(300);await press(p,'Copy anyway');await sleep(400);
  t=await p.evaluate(()=>navigator.clipboard.readText());
  check(t.includes('On the target behavior: '+EXT.escape),'10 ... Copy anyway copies the plan as it stands');
  /* the staff flowchart */
  await view(p,'plan');await p.evaluate(()=>{const b=document.querySelector('#flowBlock');b.innerHTML='';b.hidden=true;document.querySelector('#flowBtn').click();});await sleep(300);
  D=await dlg(p);check(D&&/does not follow question 4/.test(D.head)&&D.btns.includes('Build anyway'),'10 Build staff flowchart asks first',D);
  await press(p,'Go to Responding');await sleep(300);
  check(await p.evaluate(()=>document.querySelector('#flowBlock').hidden),'10 ... Go to Responding: no flowchart is built');
  await view(p,'plan');await p.evaluate(()=>document.querySelector('#flowBtn').click());await sleep(300);await press(p,'Build anyway');await sleep(300);
  check(await p.evaluate(()=>!document.querySelector('#flowBlock').hidden&&/Staff Procedure Flowchart/.test(document.querySelector('#flowBlock').innerText)),'10 ... Build anyway builds it');
  /* Print final plan only */
  await p.evaluate(()=>document.querySelector('#printFinalBtn').click());await sleep(300);
  D=await dlg(p);check(D&&/does not follow question 4/.test(D.head)&&D.btns.includes('Print anyway'),'10 Print final plan only asks first',D);
  await press(p,'Go to Responding');await sleep(200);
  check(await p.evaluate(()=>window.__prints)===0,'10 ... Go to Responding: nothing is printed');
  await p.evaluate(()=>document.querySelector('#printFinalBtn').click());await sleep(300);await press(p,'Print anyway');await sleep(300);
  check(await p.evaluate(()=>window.__prints)===1,'10 ... Print anyway prints');
  await same(p,FB.fields,'10 no field was changed by any of it');
  /* the note's button puts the step and the card right; the plan then leaves the form without a question */
  await view(p,'respond');n=await note(p);
  check(/still the extinction step\. The consequence-protocol card on the build sheet still holds the extinction step \(step 2\); the button puts both right\./.test(n),'10 the note: the step, and the card that holds it too',n);
  await click(p,'#rbUseStep');C=await card(p,'R_PB');
  check(await v(p,'rb.target')===ALT.escape&&cardOk(C)&&!C.steps.includes(GEN)&&C.steps.includes(TGT+ALT.escape),'10 ... the button: the step and the card carry the alternative',C&&C.steps);
  await p.evaluate(()=>navigator.clipboard.writeText(''));await p.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(400);
  check(!(await dlg(p))&&(await p.evaluate(()=>navigator.clipboard.readText())).includes(TGT+ALT.escape),'10 ... and Copy for the BIP then copies without asking');
  await p.close();
  /* unanswered with the step filled in */
  p=await open(TD1);await openFile(p,variant(''));
  check(/before question 4 was answered/.test(await toast(p)),'10 unanswered with the step filled in: opening it says so',await toast(p));
  await p.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(300);D=await dlg(p);
  check(D&&/before question 4 was answered/.test(D.body),'10 ... and Copy for the BIP asks first',D);
  if(D)await press(p,'Go to Responding');
  await p.close();
  /* a file that follows question 4 */
  p=await open(TD1);await openFile(p,base);
  check(await toast(p)==='','10 a file that follows question 4: no notice on opening',await toast(p));
  await p.evaluate(()=>navigator.clipboard.writeText(''));await p.evaluate(()=>document.querySelector('#bipBtn').click());await sleep(400);
  check(!(await dlg(p))&&(await p.evaluate(()=>navigator.clipboard.readText())).includes('FORM TD-1'),'10 ... Copy for the BIP copies without asking');
  await p.close();

  console.log('\n=== TD-1: after "no", what still describes extinction');
  /* 11: the simulations' own steps */
  for(const [key,fn] of [['sbt','escape'],['tangible_fct','tangible'],['auto_rrb','automatic']]){
    p=await open(TD1);await sim(p,key);await view(p,'respond');
    const before=await v(p,'rb.target');await set(p,'rb.3','no');await sleep(200);
    const after=await v(p,'rb.target');n=await note(p);
    check(/\(simulated\)$/.test(before)&&after===ALT[fn],`11 ${key}: the simulation's own step is the form's words, so "no" gives the alternative`,{before,after});
    if(key==='auto_rrb')check(/the RRB_RB card, Blocking rule and step 2/.test(n),'11 auto_rrb: the note names the blocking card',n);
    if(key==='sbt'){check(/the SBT_FCR card, step 2/.test(n)&&/the SBT_TR card, step 3/.test(n),'11 sbt: the note names the skill-based treatment steps that withhold the reinforcers',n);
      await set(p,'rb.3','yes');await sleep(200);check(await v(p,'rb.target')===EXT.escape,'11 sbt: "yes" again gives the escape extinction step');}
    await p.close();}
  /* the form's step with words added by hand */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'respond');await set(p,'rb.3','yes');
  const EXTENDED=EXT.escape+'; guide hand over hand';await set(p,'rb.target',EXTENDED);await set(p,'rb.3','no');await sleep(200);
  n=await note(p);
  check(await v(p,'rb.target')===EXTENDED&&/This step still describes extinction/.test(n)&&/Use the alternative/.test(n),'11 the extinction step with words added by hand, then "no": kept, and named with the button',n);
  await click(p,'#rbUseStep');check(await v(p,'rb.target')===ALT.escape&&await note(p)==='','11 ... the button gives the alternative');
  await p.close();
  /* an escape plan sent from the Select sheet: DF, NCE and EXT */
  p=await open(TD1);await set(p,'m.fn','escape');await view(p,'select');
  for(const [k,a] of [['q.escape.0','yes'],['q.escape.1','yes'],['q.escape.2','no']])await set(p,k,a);
  await click(p,'#sendBuild');await view(p,'respond');await set(p,'rb.3','no');await sleep(200);n=await note(p);
  check(/Extinction \(matched to function\) card/.test(n)&&/the DF card, step 4/.test(n),'11 DF + NCE + EXT from the Select sheet, then "no": the note names the EXT card and the DF card\'s step 4',n);
  await p.close();

  console.log('\n=== TD-1: the Select sheet\'s own feasibility question (attention, tangible)');
  for(const fn of ['attention','tangible']){
    p=await open(TD1);await set(p,'m.fn',fn);await view(p,'select');await set(p,`q.${fn}.0`,'no');await view(p,'respond');
    check(await v(p,'rb.3')==='no'&&await v(p,'rb.target')===ALT[fn],`12 ${fn}: the Select sheet answered "no", question 4 empty: it takes "no" and the step is the alternative`,[await v(p,'rb.3'),await v(p,'rb.target')]);
    await set(p,'rb.3','yes');await sleep(200);
    check(/question 1 on the Select sheet \(is extinction feasible\?\) is answered "no"/.test(await note(p)),`12 ${fn}: question 4 then "yes": the note names the disagreement`,await note(p));
    await p.close();}

  console.log('\n=== TD-1: wording');
  p=await open(TD1);await set(p,'m.fn','multiple');await view(p,'build');
  for(const c of ['EXT','SEXT'])await p.evaluate(c=>{const s=document.querySelector('#addComp');s.value=c;document.querySelector('#addCompBtn').click();},c);
  await view(p,'respond');await set(p,'rb.3','no');await sleep(200);
  check(/card and the Sensory extinction \/ protective attenuation card, which question 4 rules out here: remove them on the build sheet/.test(await note(p)),'13 both extinction cards: "remove them"',await note(p));
  await p.close();
  p=await open(TD1);{const d=JSON.parse(base);d.fields['rb.0']='attention';d.fields['rb.3']='yes';d.fields['rb.target']=EXT.escape;await openFile(p,JSON.stringify(d));}
  await view(p,'respond');
  check(/This step was filled in for a different function from the one question 1 names\./.test(await note(p))&&/Use the extinction step/.test(await note(p)),'13 a step written for a different function: the wording',await note(p));
  await p.close();
  p=await open(TD1);await set(p,'m.fn','automatic');await view(p,'respond');await set(p,'rb.3','no');await sleep(200);R=await recs(p);
  check(R[0]&&R[0].code==='EE'&&/blocking only as the safety plan sets out \(Piazza et al\., 2000; Vollmer, Marcus, & LeBlanc, 1994\)/.test(R[0].text),'13 the automatic recommendation after "no": its wording and its sources',R[0]);
  await p.close();

  const errs=log.filter(l=>l.type!=='warning');
  check(errs.length===0,'no console or page errors',errs.slice(0,4));
  await br.close();console.log('\nFAILURES: '+fails);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
