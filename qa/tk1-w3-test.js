/* Form TK-1, review Wave 3: a request the plan teaches is not made a token target, and the walkthrough never demonstrates one (F298);
   the ride plan's safety box, the aide and the call (F299); DM-1's photo permission (F300); backs for each kind of Board (F301); what
   earns a token (F302); checkpoints against the usual stretch (F303); Choices from high and middle preference only (F304); the board
   to the case and TE-1's token-loss rule (F305); the printed slips (F306); the Maps addresses cleared (F307). Simulated data only.
   usage: node qa/tk1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TK-1_'));await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};window.__opened=[];window.open=(...a)=>{window.__opened.push(a);return null;};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const verdict=()=>p.evaluate(()=>{renderAll();return document.getElementById('setupVerdict').textContent;});
  const backText=kind=>p.evaluate(kind=>{setView('preview');return [...document.querySelectorAll('#book .pg')].filter(x=>x.dataset.kind===kind&&/back/.test(x.className+' '+(x.dataset.label||''))).map(g=>g.textContent).join(' ').replace(/\s+/g,' ');},kind);
  /* ---- F298 ---- */
  const r1=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({fn:{key:'escape',label:'Escape'},plan:{teach:['Functional communication training (FCT)']},
    behaviors:[{label:'Hitting',fn:'Escape',fnKey:'escape',rep:'Asking for a break'},{label:'Asking for help',isRep:true,def:'Says or signs help'},{label:'Rocking',fnKey:'automatic',rep:'Staying in my seat'}],goals:{acq:[{beh:'Writing my name'}]}});
    return {r,tg:S.tg.filter(o=>o.l).map(o=>o.l),note:document.getElementById('tkReqOut').textContent,hidden:document.getElementById('tkReqOut').hidden};});
  ok('1 F298 a request the plan teaches is left off the Targets page from the case, with the reason on Setup; other targets come in',
    !r1.tg.includes('Asking for a break')&&!r1.tg.includes('Asking for help')&&r1.tg.includes('Staying in my seat')&&r1.tg.includes('Writing my name')&&!r1.hidden&&
    /Not put on the Targets page from the case: Asking for a break; Asking for help\. A request the plan teaches earns what it asks for, every time \(Form TD-1\), not a token/.test(r1.note)&&/left out Asking for a break, Asking for help/.test(r1.r.note||''),r1);
  const v1=await verdict();
  ok('2 F298 one target is a finished Targets page (no "of the six targets"), and the back says to give what was asked for, every time',!/of the six targets/.test(v1)&&/If the target is asking for something, like a break, still give what was asked for, every time\./.test(await backText('tg')),v1);
  const demo=await p.evaluate(()=>{S.tg[0]=cellFor('Asking for a break');S.tg[1]=cellFor('Writing');for(let i=2;i<6;i++)S.tg[i]=cello();renderAll();setView('walk');TKWALK.build();const t=(TKWALK.stage||document.body).textContent;setView('setup');return t.replace(/\s+/g,' ');});
  ok('3 F298 the walkthrough never demonstrates a request as the token target',!/(Great|Way to keep) asking for a break/i.test(demo)&&/writing/i.test(demo),demo.slice(0,300));
  /* ---- F302 ---- */
  await p.evaluate(()=>{S=blank();renderAll();});await p.evaluate(()=>loadSim());await sleep(700);
  const v2=await verdict();await setM('tok_rule','3 problems correct');await sleep(300);const v3=await p.evaluate(()=>document.getElementById('setupVerdict').textContent);
  const bd=await p.evaluate(()=>{setView('preview');return (document.querySelector('#book .pg[data-kind="bd"] .bd-rule')||{}).textContent||'';});
  ok('4 F302 what earns a token: Setup asks for it, the Board prints it, and the Token Board back states it',/what earns a star \(Tokens: Earns a token\)/.test(v2)&&!/what earns a star/.test(v3)&&bd==='Earns a star: 3 problems correct'&&/This book’s rule: 3 problems correct earns one star\./.test(await backText('bd')),{v2,v3,bd});
  const r2=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({token:{schedules:{tp:{text:'1 token for every 3 problems completed',n:3}}},behaviors:[{label:'Raising my hand',isRep:true,def:'Hand up, quiet, until called on',ex:'Hand up during math',nex:'Calling out with a hand up'}]});
    setView('preview');return {rule:S.meta.tok_rule,back:[...document.querySelectorAll('#book .pg')].filter(x=>x.dataset.kind==='tg'&&/back/.test(x.className+' '+(x.dataset.label||''))).map(g=>g.textContent).join(' ').replace(/\s+/g,' ')};});
  ok('5 F302 the rule fills from Form TE-1, and Form TB-1\'s definition of a target placed prints on the Teaching Targets back',r2.rule==='1 token for every 3 problems completed'&&/What counts \(Form TB-1\):\s*Raising my hand: Hand up, quiet, until called on Examples: Hand up during math Not examples: Calling out with a hand up/.test(r2.back),r2);
  /* ---- F304 ---- */
  const r3=await p.evaluate(()=>{S=blank();renderAll();const r=window.__nbhFactsIn({menu:[{name:'Stickers',tier:'LP',rank:5},{name:'Blocks',tier:'MP',rank:4},{name:'Train videos',tier:'HP',rank:1},{name:'Drawing time',tier:'HP',rank:2},{name:'Bubbles'},{name:'Helping the custodian',tier:'MP',rank:3}]});
    return {ch:S.ch.filter(o=>o.l).map(o=>o.l),note:r.note||''};});
  ok('6 F304 the Choices take high-preference items first, then middle; never a low-preference or unranked item; the note says to fill the rest',
    r3.ch.join('|')==='Train videos|Drawing time|Helping the custodian|Blocks'&&/4 choices from Form PA-1/.test(r3.note)&&/fill the rest from a fresh preference check/.test(r3.note),r3);
  /* ---- F300 ---- */
  await p.evaluate(()=>{S=blank();renderAll();});await p.evaluate(()=>loadSim());await sleep(600);
  const ph=await p.evaluate(async()=>{nbhCase.facts={profile:{flags:{photo:'No'}}};renderAll();const a={note:document.getElementById('tkPhotoPerm').textContent,hid:document.getElementById('tkPhotoPerm').hidden,v:document.getElementById('setupVerdict').textContent};
    nbhUI.confirm=async()=>false;document.querySelector('#phPick button[data-pick]').click();await new Promise(r=>setTimeout(r,250));const d=document.getElementById('pickDlg');a.opened=!!(d&&d.open);nbhUI.confirm=async()=>true;
    S.photos.push({id:'p1',img:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',label:'Photo'});S.photo[0]={k:'',ph:'p1',l:''};renderAll();
    a.v2=document.getElementById('setupVerdict').textContent;a.prev=document.getElementById('prevLine').textContent;nbhCase.facts=null;S.photo[0]=cello();renderAll();return a;});
  ok('7 F300 with no photo permission on DM-1: a lasting note, no photo asked for, the picker asks first, and a photo already in the book is named on Setup and the Preview',
    !ph.hid&&/^Form DM-1: no photo or media permission\. Use the avatar, or a picture the student picks\.$/.test(ph.note)&&!/a photo \(the/.test(ph.v)&&!ph.opened&&/the book holds a photo, but Form DM-1 records no photo or media permission/.test(ph.v2)&&/The book holds a photo, and Form DM-1 records no photo or media permission\./.test(ph.prev),ph);
  /* ---- F301, F306 ---- */
  await p.evaluate(()=>{S=blank();renderAll();});await p.evaluate(()=>loadSim());await sleep(600);
  const ft=await p.evaluate(()=>({cb:S.txt.cb,h1:S.txt.h1,te:S.txt.te}));
  await setM('layout','rules');await sleep(300);
  const rl=await p.evaluate(()=>({tb:S.txt.tb,cb:S.txt.cb,tt:S.txt.tt}));
  await p.evaluate(()=>{S.txt.tt='My own words for the targets back.';renderAll();});await setM('layout','ft');await sleep(300);
  const back=await p.evaluate(()=>({tb:S.txt.tb,tt:S.txt.tt}));
  ok('8 F301 a Rules row gets backs about the row and the Earn box; an edited back is kept when the layout changes back',/^__\*\*THE RULES ROW\*\*__/.test(rl.tb)&&/place the picture in the green \*\*Earn\*\* box\./.test(rl.cb)&&/The rules in the row are worked on together/.test(rl.tt)&&/^__\*\*FIRST-THEN\*\*__/.test(back.tb)&&back.tt==='My own words for the targets back.',{rl,back});
  ok('9 F306 the slips: the learner makes the choice, no "extras book", reaching for the token is not the test',/2\. If needed, help with the pointing, but let your learner make the choice\./.test(ft.cb)&&/let your learner make the choice/.test(ft.h1)&&!/extras book/.test(ft.h1)&&/Print a sheet of this card/.test(ft.h1)&&!/reaches for the token/.test(ft.te)&&/The test that it has worked: the behavior that earns tokens goes up\./.test(ft.te),ft);
  const old=await p.evaluate(()=>{S.txt.h1=TXT_OLD.h1;S.txt.te=TXT_OLD.te;ensure();return {h1:S.txt.h1===txtDef('h1'),te:S.txt.te===txtDef('te')};});
  ok('10 F306 a book saved with the old default backs takes the corrected ones',old.h1&&old.te,old);
  /* ---- the bus: F301, F299, F303, F305, F307 ---- */
  await p.evaluate(()=>{S=blank();S.meta.kind='bus';renderAll();});await p.evaluate(()=>loadSim());await sleep(800);
  const bus=await p.evaluate(()=>({tb:fill(S.txt.tb),plan:(()=>{const d=document.createElement('div');d.innerHTML=busPlanPage();return d.textContent.replace(/\s+/g,' ');})(),calc:document.getElementById('busCalc').textContent}));
  ok('11 F301 a bus book\'s Token Board back: tokens at the checkpoints, the item at the stop from the adult who meets the bus, the checkpoints as the schedule',
    /At each checkpoint on the ride, when the rules were followed, give the star/.test(bus.tb)&&/There are five boxes; when the board is full, your learner gets the item at the stop, from the adult who meets the bus\./.test(bus.tb)&&/The checkpoints are the schedule/.test(bus.tb)&&!/FIRST|THEN item/.test(bus.tb),bus.tb.slice(0,900));
  ok('12 F299 the ride plan: If it becomes unsafe, the plans\' steps, the call, and a hold only as a reported emergency step',
    /If it becomes unsafe\s*Seatbelt and seat rules are put right at once, not only by holding back a star\./.test(bus.plan)&&/Call: Transportation dispatch, 555-0100 \(sample\)\./.test(bus.plan)&&/A physical hold is an emergency step only, by trained staff under the district’s procedure, documented and reported \(s\. 1003\.573, F\.S\.\)\./.test(bus.plan),bus.plan.slice(0,600));
  await setM('bus_aide','no');await sleep(250);const noAide=await p.evaluate(()=>document.getElementById('busCalc').textContent);await setM('bus_aide','yes');
  const r4=await p.evaluate(()=>{const keep={a:S.meta.bus_aide,s:S.meta.bus_safe};S.meta.bus_aide='';S.meta.bus_safe='';
    window.__nbhFactsIn({profile:{trans:'Bus 000 with aide (simulated)',flags:{safety:['Elopement','Aggression']}},plan:{respond:{target:'Block, prompt the break card, and wait at a safe distance.'}},crisis:{stages:[{s:'Calm',do:'Praise.'},{s:'Escalation',do:'Offer the break card and space.'},{s:'Peak',do:'Clear the area; call for the trained team.'}]}});
    const r={a:S.meta.bus_aide,s:S.meta.bus_safe};S.meta.bus_aide=keep.a;S.meta.bus_safe=keep.s;renderAll();return r;});
  ok('13 F299 no aide on the bus is a blocker on Setup; from the case: the aide from DM-1\'s transportation line, and the safety concerns, the behavior plan and the crisis plan\'s steps',
    /No aide or monitor rides this bus/.test(noAide)&&r4.a==='yes'&&r4.s==='Safety concerns on file (Form DM-1): Elopement, Aggression.\nWhen the behavior happens (Form TD-1): Block, prompt the break card, and wait at a safe distance.\nThe crisis plan (Form CR-1), escalation: Offer the break card and space.\nThe crisis plan (Form CR-1), peak: Clear the area; call for the trained team.',{noAide:noAide.slice(0,200),r4});
  await setM('bus_base','3');await sleep(250);const b3=await p.evaluate(()=>document.getElementById('busCalc').textContent);
  await setM('bus_base','');await sleep(250);const b0=await p.evaluate(()=>document.getElementById('busCalc').textContent);await setM('bus_base','6');
  ok('14 F303 checkpoints longer apart than the usual stretch are a warning with a count to use; without the stretch, a note asks for it',
    /The tokens come about every 4:30, longer than the 3:00 the student usually rides without breaking a rule, so few would be earned: use more tokens \(about 9 over this ride\)\./.test(b3)&&/Type how long the student usually rides before a rule is broken/.test(b0)&&!/Type how long/.test(b3),{b3:b3.slice(0,300),b0:b0.slice(0,500)});
  const loss=await p.evaluate(async()=>{nbhCase.facts={token:{loss:{on:true,rule:'One star off for hitting, never below zero'}}};renderAll();const a={note:document.getElementById('tkLossNote').textContent};
    document.getElementById('tkLossUse').click();await new Promise(r=>setTimeout(r,250));a.rule=S.meta.loss_rule;a.plan=(()=>{const d=document.createElement('div');d.innerHTML=busPlanPage();return d.textContent.replace(/\s+/g,' ');})();nbhCase.facts=null;S.meta.loss_rule='';renderAll();return a;});
  ok('15 F305 TE-1\'s token loss: a lasting notice on Setup, and after asking the ride plan prints the plan\'s rule instead of "the earned stars stay"',
    /Form TE-1 records token loss: One star off for hitting, never below zero\. The ride plan says the earned stars stay on the board\./.test(loss.note)&&loss.rule==='One star off for hitting, never below zero'&&/token loss follows the plan \(Form TE-1\): One star off for hitting, never below zero\. \s*the next checkpoint/.test(loss.plan),loss);
  const out=await p.evaluate(()=>window.__nbhFactsOut());
  ok('16 F305 the board goes to the case: kind, rules, count, the ride\'s checkpoints and goal, the aide',out&&out.board&&out.board.kind==='bus'&&out.board.targets.join('|')==='Stay in my seat|Quiet voice|Hands to self'&&out.board.count===5&&out.board.bus&&out.board.bus.checkpoints.join(',')==='4:30,9:15,13:45,18:30,23:00'&&out.board.bus.goal===5&&out.board.bus.aide==='yes',out);
  await p.evaluate(()=>{setView('setup');document.querySelector('details.bus-maps').open=true;});await setM('bus_fromA','1 Sample School Rd');await setM('bus_toA','2 Sample Stop Ln');await sleep(200);
  await p.evaluate(()=>document.getElementById('busMaps').click());await sleep(250);
  const mp=await p.evaluate(()=>({n:window.__opened.length,a:S.meta.bus_fromA,b:S.meta.bus_toA,f:document.querySelector('[data-m="bus_toA"]').value}));
  ok('17 F307 Open in Maps hands the addresses to Maps, then clears them from the book',mp.n===1&&mp.a===''&&mp.b===''&&mp.f==='',mp);
  /* ---- the shell and DM-1 ---- */
  const ix=fs.readFileSync(dir+'index.html','utf8');
  ok('18 F305 the workstation counts the board in the case (TK-1 as its source) and names it on the case line',/FACT_SRC\['TK-1'\]='board';FACT_GEN\.push\('TK-1'\);/.test(ix)&&/<b>Token board:<\/b>/.test(ix),'index');
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('DM-1: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/'+file('DM-1_'));await sleep(900);
  const dm=await q.evaluate(()=>{const e=document.querySelector('[name="s.trans"]');e.value='Bus 000 with aide (simulated)';e.dispatchEvent(new Event('input',{bubbles:true}));const o=window.__nbhFactsOut();return o&&o.profile&&o.profile.trans;});
  ok('19 F299 Form DM-1 sends its transportation line with the profile',dm==='Bus 000 with aide (simulated)',dm);
  ok('20 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
