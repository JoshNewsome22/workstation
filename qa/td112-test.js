/* v24.12 Form TD-1's protocol steps refer to this student: the rewriting (pronouns, her by what follows, they's verb, the name,
   the student); the facts from Form DM-1 (name, pronouns, sex) set the choice; a card's steps show and add rewritten while
   In the study keeps the study's words; the Setup choice changes them and is saved. usage: node qa/td112-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const TD='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^TD-1_/.test(f)),DM='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^DM-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 await p.goto(BASE+TD);await sleep(2000);
 const W=await p.evaluate(()=>{document.querySelector('#mClient').value='Ellis, Jordan';const w=(t,m)=>tdRefer.word(t,m);const S1='Tell her she has two minutes to finish the current activity and that when the timer rings she will start the next one, naming both.';
   const S2="If she does not start, prompt the change; place the next activity's materials in front of her and praise her effort.";
   return {he1:w(S1,'he'),he2:w(S2,'he'),they1:w('If she does not start, she has her materials and she starts when she is ready.','they'),they2:w('When she starts the new activity within 30 s, give praise; she always finishes.','they'),
     name1:w(S1,'name'),name2:w('Give her her materials and let her finish by herself.','name'),stu:w('Praise her and let her finish. The girl keeps the girl’s token.','student'),she:w('Give him his token when he asks for it himself.','she'),keep:w('Show her the next activity.','he')};});
 ok('he/him: she, her (object), her (possessive) and the capitals',W.he1==='Tell him he has two minutes to finish the current activity and that when the timer rings he will start the next one, naming both.'&&W.he2==="If he does not start, prompt the change; place the next activity's materials in front of him and praise his effort."&&W.keep==='Show him the next activity.',W);
 ok('they/them: the verb agrees after they (does/do, has/have, starts/start, is/are), always kept',W.they1==='If they do not start, they have their materials and they start when they are ready.'&&W.they2==='When they start the new activity within 30 s, give praise; they always finish.',W);
 ok('by name: the first name from "Last, First", a subject right after the name as "that Jordan", the possessive as Jordan’s',W.name1==='Tell Jordan that Jordan has two minutes to finish the current activity and that when the timer rings Jordan will start the next one, naming both.'&&W.name2==='Give Jordan Jordan’s materials and let Jordan finish by Jordan.',W);
 ok('the student; and she/her from him/his/himself; the girl as the student',W.stu==='Praise the student and let the student finish. The student keeps the student’s token.'&&W.she==='Give her her token when she asks for it herself.',W);
 /* the facts from Form DM-1 choose the form of address; a card shows and adds its steps rewritten, the study's paragraph kept */
 const card=await p.evaluate(async()=>{window.__nbhFactsIn({profile:{who:{first:'Jordan',pref:'',pron:'he/him',sex:'Male'}}});await new Promise(r=>setTimeout(r,200));
   const pr=TD1_BANK.protocols.find(q=>(q.steps||[]).some(x=>/\bshe\b/i.test(x))&&!/menstrual|pad/i.test(q.id+q.lab));window.__tdBankShow(pr.id);await new Promise(r=>setTimeout(r,300));
   const R=document.getElementById('tdBankHost').shadowRoot,det=R.querySelector('.detail');const steps=[...det.querySelectorAll('ol.steps li')].map(l=>l.textContent);const study=det.querySelector('p.tx').textContent;const note=(det.querySelector('.td-whonote')||{}).textContent;
   return {id:pr.id,mode:tdRefer.mode(),label:tdRefer.label(),note,steps:steps.join(' | '),study,studyIs:study===pr.beh,orig:pr.steps.join(' | '),setupNote:document.querySelector('#tdReferNote').textContent};});
 ok('with he/him on Form DM-1 the card’s steps show he/him and no she/her; the note says so; In the study keeps the study’s paragraph',card.mode==='he'&&/\b(he|him|his)\b/.test(card.steps)&&!/\b(she|her|hers|herself)\b/i.test(card.steps)&&/he \/ him, from the pronouns on Form DM-1/.test(card.note)&&card.studyIs&&/he \/ him/.test(card.setupNote),card);
 const added=await p.evaluate(async()=>{const R=document.getElementById('tdBankHost').shadowRoot;R.querySelector('.detail .add').click();await new Promise(r=>setTimeout(r,600));
   const ask=R.querySelector('.detail .td-askrow');if(ask){[...ask.querySelectorAll('button')].find(b=>/second/.test(b.textContent)).click();await new Promise(r=>setTimeout(r,500));}
   const tas=[...document.querySelectorAll('textarea[name$=".s0"]')];const last=tas[tas.length-1];const i=/cp\[(\d+)\]/.exec(last.name)[1];const all=[...document.querySelectorAll('textarea[name^="cp['+i+'].s"]')].map(t=>t.value).filter(Boolean).join(' | ');
   return {i,all,she:/\b(she|her|hers|herself)\b/i.test(all),he:/\b(he|him|his)\b/.test(all)};});
 ok('Add to the plan writes the rewritten steps into the card',added.he&&!added.she,added);
 const byName=await p.evaluate(async()=>{const s=document.querySelector('#tdRefer');s.value='name';s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
   const R=document.getElementById('tdBankHost').shadowRoot,det=R.querySelector('.detail');const steps=[...det.querySelectorAll('ol.steps li')].map(l=>l.textContent).join(' | ');
   return {mode:tdRefer.mode(),saved:document.querySelector('[name="m.refer"]').value,note:document.querySelector('#tdReferNote').textContent,h4:(det.querySelector('h4')||{}).textContent,hasName:/Jordan/.test(steps),pron:/\b(he|him|his|she|her)\b/.test(steps),hidden:det.hidden,steps:steps.slice(0,200)};});
 ok('Refer to the student as "by first name" redraws the card with Jordan and is saved with the plan',byName.hasName&&!byName.pron&&byName.mode==='name'&&byName.saved==='name'&&/by name \(Jordan\)/.test(byName.note),byName);
 /* Form DM-1 sends the name, pronouns and sex */
 await p.goto(BASE+DM);await sleep(1500);
 const dm=await p.evaluate(()=>{document.querySelector('#sFirst').value='Jordan';document.querySelector('#sPron').value='he/him';document.querySelector('#sSex').value='Male';const o=window.__nbhFactsOut();return o&&o.profile&&o.profile.who;});
 ok('Form DM-1’s profile facts carry the first name, pronouns and sex',dm&&dm.first==='Jordan'&&dm.pron==='he/him'&&dm.sex==='Male',dm);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
