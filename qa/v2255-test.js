/* v22.55 Form TE-1, the token economy designer (review F418-F427, I211, I213, I214, I215). Token loss marked in use shows
   its safeguards (the behavior, how many, the floor, what was tried first, the parent's consent, the review, how it is
   measured, when it stops) and the audit is not in order while one is missing; the audit's three points that must hold (the
   token tested, nothing the student is entitled to made earnable, token loss's safeguards) are named first and keep the
   verdict from green, which is a plain count; each point says research (with its source), rights or practice; the figures
   under the schedules carry no colour, each backup has its own price and the next step is read from the current step's own
   result; "generalized" counts the wants behind the backups not marked No; the thinning step holds its advance rule, its
   step-back rule and its result, and a step that changes two schedules is flagged and uncounted; the plan prints without
   the Guide unless asked; the packet's school stays out of "Setting and periods"; the token system goes to the case; a
   break request is never the fill's behavior; the case's allergies, diet, accommodations, food decision, RA-1 verdicts and
   the student's likes reach the menu (DM-1 sends the accommodations, RA-1 its verdicts); the student's assent; the
   exchange log; the plan for ending the system; dated audits kept. iPad-like (touch) at 1180 x 820, and a phone's width.
   Simulated people only. usage: node qa/v2255-test.js (45 checks) */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const TE='TE-1_Token-Economy-Designer_v2026-09.html';
const T=(label,o)=>Object.assign({label,isRep:false,src:'TB-1',type:'Single topography'},o||{});
const R=(label,o)=>Object.assign({label,isRep:true,src:'TB-1',type:'Replacement / alternative behavior'},o||{});
const ESC={fn:'Escape / avoidance (social negative)',fnKey:'escape'};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
  const open=async(file,c)=>{const p=await (c||ctx).newPage();p.on('pageerror',e=>errs.push(file.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{nbhUI.confirm=async()=>true;}catch(e){}});return p;};
  const sim=p=>p.evaluate(async()=>{await loadSim();});
  const setM=(p,k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector(`[data-m="${k}"]`);e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},[k,v]);
  const tick=(p,on)=>p.evaluate(on=>{document.querySelectorAll('#auditWrap input[data-a]').forEach(c=>{const i=+c.dataset.a,v=on.includes(i);});
    for(let i=0;i<15;i++){const c=document.querySelector(`#auditWrap input[data-a="${i}"]`),v=on.includes(i);if(c.checked!==v){c.checked=v;c.dispatchEvent(new Event('change',{bubbles:true}));}}},on);
  const cell=(p,tb,i,f,v,attr)=>p.evaluate(([tb,i,f,v,attr])=>{const e=document.querySelector(`#${tb} [data-${attr}="${i}"][data-f="${f}"]`);if(e.type==='checkbox')e.checked=!!v;else e.value=v;
    e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[tb,i,f,v,attr]);
  const bk=(p,i,f,v)=>cell(p,'bkTbl',i,f,v,'k'),th=(p,i,f,v)=>cell(p,'thinTbl',i,f,v,'t'),ex=(p,i,f,v)=>cell(p,'exTbl',i,f,v,'x');
  const V=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);return e?{cls:(e.querySelector('.verdict')||e).className,text:e.textContent.replace(/\s+/g,' ').trim()}:null;},sel);
  const all15=[...Array(15).keys()];
  const caught=p=>p.evaluate(()=>new Promise(res=>{const mk=URL.createObjectURL,ck=HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{URL.createObjectURL=mk;b.text().then(res);return 'blob:x';};
    HTMLAnchorElement.prototype.click=function(){HTMLAnchorElement.prototype.click=ck;};document.querySelector('#saveBtn').click();}));
  const openFile=(p,t,n)=>p.evaluate(([t,n])=>{const fi=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],n,{type:'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},[t,n]).then(()=>sleep(500));
  const pages=async p=>{const b=await p.pdf({format:'Letter'});return (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;};

  /* ---------- F418 token loss ---------- */
  let p=await open(TE);await sim(p);
  await setM(p,'loss','Yes — described below');await setM(p,'lossRule','');
  let f=await p.evaluate(()=>({on:document.querySelector('#lossTbl').classList.contains('on'),rows:[...document.querySelectorAll('#lossTbl tr.lossYes')].map(r=>getComputedStyle(r).display),note:document.querySelector('#lossNote').textContent}));
  ok('1 F418 token loss marked in use: its safeguard rows show, and the note names everything the plan does not record',f.on&&f.rows.length===7&&f.rows.every(d=>d!=='none')&&
    /the plan does not record the rule, the behavior that loses a token, how many tokens are lost, the floor, what was tried first and its data, the parent’s consent, who reviewed it and when, how its effect is measured and when it stops\./.test(f.note)&&/Standard 2\.15/.test(f.note)&&/Standard 2\.11/.test(f.note)&&/300\.324/.test(f.note),f);
  await tick(p,all15);let v=await V(p,'#audVerdict');
  ok('2 F418 ... with every audit point ticked, the audit is not in order (red) and names token loss first',/v-no/.test(v.cls)&&/^Not in order yet: token loss is in use, and the plan does not record the rule/.test(v.text),v);
  await p.evaluate(f=>nbhCase.apply(f),{behaviors:[T('Aggression (simulated)',ESC),R('Break request (simulated)',ESC)],consent:{src:'IC-1',state:'Current',on:true,covered:['bip'],dec:{},bip:'2026-10-01',v:2}});
  const dl=await p.evaluate(()=>[...document.querySelectorAll('#teLossBehs option')].map(o=>o.value));
  for(const [k,val] of [['lossRule','One star comes off the strip for each instance (simulated)'],['lossBeh','Aggression (simulated)'],['lossN','1'],['lossFloor','0; an exchange earned is never lost'],['lossTried','NCR and DRA for six weeks; DD-1 showed no change (simulated)'],
    ['lossCons','10/14/2026'],['lossIep','10/15/2026'],['lossRev','District behavior review, Jordan Ellis (simulated), 10/14/2026'],['lossMeas','Aggression on Form DD-1, looked at weekly'],['lossStop','No decrease within three weeks, or a rise in another behavior']])await setM(p,k,val);
  v=await V(p,'#audVerdict');f=await V(p,'#lossNote');
  ok('3 F418 the case\'s problem behaviors are offered for the behavior that loses a token; with every safeguard recorded the gate closes and the audit reads in order',
    dl.includes('Aggression (simulated)')&&!dl.includes('Break request (simulated)')&&/v-info/.test(f.cls)&&/consent to implement the BIP on 10\/1\/2026/.test(f.text)&&/v-ok/.test(v.cls)&&v.text==='15 of 15 confirmed.',{dl,f,v});
  await setM(p,'loss','No');
  f=await p.evaluate(()=>[...document.querySelectorAll('#lossTbl tr.lossYes')].map(r=>getComputedStyle(r).display));
  await p.emulateMedia({media:'print'});const fp=await p.evaluate(()=>[...document.querySelectorAll('#lossTbl tr.lossYes')].map(r=>getComputedStyle(r).display));await p.emulateMedia({media:'screen'});
  ok('4 F418 token loss not in use: the safeguard rows are hidden, on screen and on paper (the rule row, why not, stays)',f.every(d=>d==='none')&&fp.every(d=>d==='none')&&await p.evaluate(()=>getComputedStyle(document.querySelector('[data-m="lossRule"]').closest('tr')).display!=='none'),{f,fp});
  await p.close();

  /* ---------- F420 the audit ---------- */
  p=await open(TE);await sim(p);
  await tick(p,all15.filter(i=>i!==1&&i!==11));v=await V(p,'#audVerdict');
  ok('5 F420 the token untested and an entitlement unconfirmed, the other 13 ticked: not green, both named first, then a plain count',/v-no/.test(v.cls)&&
    /^Not in order yet: the token has not been tested as a reinforcer, so there is no token economy to judge yet \(a board the student ignores is not one\); it is not confirmed that nothing the student is entitled to has been made earnable\. 13 of 15 confirmed; not yet: the token has been tested/.test(v.text)&&
    !/matches what the research describes|small change rather than a redesign/.test(v.text),v);
  await tick(p,all15.filter(i=>i!==1));v=await V(p,'#audVerdict');
  ok('6 F420 the token untested alone: amber, never green (14 of 15)',/v-mid/.test(v.cls)&&/^Not in order yet: the token has not been tested/.test(v.text)&&/14 of 15 confirmed/.test(v.text),v);
  f=await p.evaluate(()=>[...document.querySelectorAll('#auditWrap label.chk')].map(l=>({t:l.childNodes[1].textContent,tag:l.querySelector('.te-tag').textContent,gate:l.querySelector('.te-tag').classList.contains('te-gate')})));
  ok('7 F420 each point says research (with a source and year), rights or practice; three must hold; the delivery and request points are reworded',f.length===15&&f.filter(x=>x.gate).length===3&&
    f.every(x=>/^(must hold · )?(research: .*\(.*\d{4}.*\)|rights|practice)/.test(x.tag))&&f[2].t==='Tokens are delivered immediately (the plan states the window)'&&f[10].t==='Once an exchange is earned, the student can ask for it'&&
    [1,11,12].every(i=>f[i].gate)&&f.filter(x=>/^research/.test(x.tag.replace('must hold · ',''))).every(x=>/\d{4}/.test(x.tag)),f.map(x=>x.tag));
  await tick(p,all15);v=await V(p,'#audVerdict');
  ok('8 F420 every point confirmed and nothing open: in order (green), the count alone',/v-ok/.test(v.cls)&&v.text==='15 of 15 confirmed.',v);
  await p.close();

  /* ---------- F423 the figures under the schedules ---------- */
  p=await open(TE);await sim(p);
  const ups=[];for(const n of ['5','10','','1']){await setM(p,'teN',n);ups.push(await V(p,'#upVerdict'));}
  ok('9 F423 no colour and no advice from the unit price, however the deliveries are counted (5, 10, blank, 1); responses per exchange comes first',
    ups.every(x=>/v-info/.test(x.cls)&&!/v-ok|v-mid|v-no/.test(x.cls)&&/^Responses per exchange 50 \(10 × 5\)/.test(x.text)&&!/Appropriate during acquisition|A high unit price|A low unit price/.test(x.text)),ups.map(x=>[x.cls,x.text.slice(0,140)]));
  await setM(p,'teN','5');v=await V(p,'#upVerdict');
  ok('10 F423 each backup\'s price from its token cost, and the range',/Price of each backup \(its token cost × 10 responses\): Tablet, video clips 10; Fruit chew 20; Five minutes with the magnetic tiles 30; Choose the next work task 50; from 10 to 50 responses\./.test(v.text)&&/No band is drawn under these figures/.test(v.text),v.text);
  const r1=/At the current step \(step 4, [^)]*Token production, 50 responses per exchange\): the result recorded is “Rate fell about 20% and has not fully recovered \(Form DD-1\): holding here rather than thinning further”\. Judge the next step by it and by the step-back rule \(“Rate below 80% of step 3’s for three sessions: back to five blocks per star”\)\./.test(v.text);
  await th(p,3,'res','');const v2=await V(p,'#upVerdict');
  ok('11 F423 the next step is read from the current step\'s own result and step-back rule; with no result, it says to record one',r1&&/At the current step \(step 4[^)]*\): no result is recorded yet\. Record the rate or percentage on Form DD-1 before the next step\./.test(v2.text),{a:v.text.slice(-420),b:v2.text.slice(-200)});
  await p.close();

  /* ---------- F424 generalized ---------- */
  p=await open(TE);await sim(p);
  f=await p.evaluate(()=>({kinds:document.querySelector('#genMetrics').textContent.replace(/\s+/g,' '),row3:[S.bk[3].c,S.bk[3].mo],v:document.querySelector('#genVerdict').textContent}));
  ok('12 F424 the simulated menu spans three kinds (the tablet and the tiles are one want), and "Choose the next work task" is a choice, not a break',/Kinds of backup ?3 ?a preferred activity or item, food or drink, choice or control/.test(f.kinds)&&f.row3[0]==='Other'&&f.row3[1]==='Choice or control'&&/^Spans 3 kinds of backup/.test(f.v),f);
  ok('13 F424 untested backups are counted and said',/2 of them have not been tested on Form RA-1\./.test(f.v),f.v);
  for(const i of [1,2,3])await bk(p,i,'conf','No');v=await V(p,'#genVerdict');
  ok('14 F424 backups marked No are not counted: with the fruit chew, the tiles and the task choice at No, one kind (red), and they are named',/v-no/.test(v.cls)&&/^One kind of backup \(a preferred activity or item\), counting the 1 of 4 backups not marked No on Form RA-1\./.test(v.text)&&
    /3 backups are marked not a reinforcer on Form RA-1 \(Fruit chew, Five minutes with the magnetic tiles, Choose the next work task\) and are not counted\./.test(v.text)&&!/Generalized|does not depend on one establishing operation/.test(v.text),v);
  await p.close();

  /* ---------- F425 the thinning record ---------- */
  p=await open(TE);await sim(p);
  f=await p.evaluate(()=>({head:[...document.querySelectorAll('#thinTbl thead th')].map(t=>t.textContent).join('|'),boxes:[...document.querySelectorAll('#thinTbl tbody tr')][3].querySelectorAll('td.te-crit textarea').length,
    opts:[...document.querySelector('#thinTbl select[data-f="w"]').options].map(o=>o.textContent),flags:document.querySelector('#thinFlags').textContent}));
  ok('15 F425 each step holds its advance rule, its step-back rule and its result in their own boxes; "Both ratios" is not offered, "Step back" is',/Advance when \/ step back when \/ result/.test(f.head)&&f.boxes===3&&!f.opts.includes('Both ratios')&&f.opts.includes('Step back')&&f.flags==='',f);
  await th(p,3,'ep','8');f=await p.evaluate(()=>({flags:document.querySelector('#thinFlags').textContent,item:(document.querySelector('#auditWrap input[data-a="8"]').closest('label').querySelector('.te-flag')||{}).textContent||'',n:document.querySelector('#audMetrics').textContent}));
  ok('16 F425 a step labelled token production that also raised the exchange ratio (so each token buys less too) is named, and the audit\'s one-at-a-time point is flagged and not counted',/Step 4 changed token production, exchange production and token exchange at once \(against step 3\): the effect cannot be put down to either/.test(f.flags)&&/not counted while it does/.test(f.item)&&/11 of 15/.test(f.n),f);
  await th(p,3,'ep','5');await th(p,3,'back','');f=await V(p,'#thinFlags');
  ok('17 F425 the current step without a step-back rule is named',/Step 4, the current step, has no step-back rule/.test(f.text),f);
  const old=JSON.parse(fs.readFileSync(path.join(__dirname,'data','sprint-a9','TE-1.json'),'utf8'));old.S.thin[3].w='Both ratios';old.S.thin[3].ep='8';
  await openFile(p,JSON.stringify(old),'TE-1_both.json');
  f=await p.evaluate(()=>({w:document.querySelectorAll('#thinTbl select[data-f="w"]')[3].value,flags:document.querySelector('#thinFlags').textContent}));
  ok('18 F425 a file that holds "Both ratios" keeps it, and the step is flagged',f.w==='Both ratios'&&/Step 4 is recorded as thinning both ratios at once/.test(f.flags),f);
  await p.close();

  /* ---------- F426 print ---------- */
  p=await open(TE);await sim(p);
  await p.emulateMedia({media:'print'});
  const pr=()=>p.evaluate(()=>{const d=e=>!!e&&getComputedStyle(e).display!=='none';const h=[...document.querySelectorAll('.only-guide h2')];
    return {chainH:d(h.find(x=>/A Token System Is a Chain/.test(x.textContent))),unit:d(h.find(x=>/^Unit Price$/.test(x.textContent))),src:d(h.find(x=>/^Sources$/.test(x.textContent))),refs:d(document.querySelector('#teRefs')),
      boxes:d(document.querySelector('.chain')),table:d(document.querySelector('[data-m="tp"]').closest('table'))};});
  const p0=await pr(),n0=await pages(p);
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>{const c=document.querySelector('[data-te="print-guide"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));setView('setup');});
  await p.emulateMedia({media:'print'});const p1=await pr(),n1=await pages(p);await p.emulateMedia({media:'screen'});
  ok('19 F426 on paper the Guide\'s research pages print only when asked for; the sources line and the reference list always print; the schedules print once (the table, not the chain boxes)',
    !p0.chainH&&!p0.unit&&p0.src&&p0.refs&&!p0.boxes&&p0.table&&p1.chainH&&p1.unit&&n1>n0&&await p.evaluate(()=>document.body.classList.contains('te-print-guide')),{p0,p1,n0,n1});
  await p.close();

  /* ---------- F427 the packet's school ---------- */
  p=await open(TE);
  await p.evaluate(()=>window.__nbhApplyPacket({client:'Mateo Rivera (simulated)',sid:'4471823',site:'Simulated Elementary'},true));
  f=await p.evaluate(()=>({set:document.querySelector('[data-m="setting"]').value,client:S.meta.client}));
  await setM(p,'setting','Room 12, math block (simulated)');
  const det=await p.evaluate(()=>new Promise(r=>{const h=e=>{if(e.data&&e.data.nbh==='status'&&e.data.status){removeEventListener('message',h);r(e.data.details);}};addEventListener('message',h);postMessage({nbh:'status'},'*');}));
  ok('20 F427 the packet\'s school does not go into "Setting and periods", and the setting is never read back as the school',f.set===''&&f.client==='Mateo Rivera (simulated)'&&det&&!('site' in det)&&det.sid==='4471823',{f,det});
  await p.close();

  /* ---------- F421 out ---------- */
  p=await open(TE);
  const none=await p.evaluate(()=>window.__nbhFactsOut());
  await sim(p);const tk=await p.evaluate(()=>(window.__nbhFactsOut()||{}).token);
  ok('21 F421 the token system goes to the case as one fact (nothing while the plan is empty): the behavior, the three schedules, the backups with their price, the steps, token loss, the plan for ending it, the audit, the log',
    none===null&&!!tk&&tk.src==='TE-1'&&/^Places one block/.test(tk.beh)&&tk.schedules.tp.n===10&&tk.schedules.ep.n===5&&tk.rpe===50&&tk.backups.length===4&&tk.backups[2].price===30&&tk.backups[1].cleared===true&&
    tk.steps.length===4&&JSON.stringify(tk.step.changed)==='["Token production"]'&&/Rate fell about 20%/.test(tk.step.result)&&tk.loss.on===false&&tk.fade.next==='Self-monitoring (Form SM-1)'&&tk.audit.n===12&&tk.audit.of===15&&
    tk.audit.mustHold[0]==='The token has been tested as a reinforcer rather than assumed to be one'&&tk.log.n===5&&tk.log.refused['Five minutes with the magnetic tiles']===2&&/^Partial/.test(tk.student.assent),tk);
  await p.close();
  {const c2=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const page=await c2.newPage();page.on('pageerror',e=>errs.push('shell: '+e.message));
   await page.goto(L.BASE+'/NBH-Workstation/index.html');await page.waitForFunction(()=>typeof openForm==='function');await sleep(800);await page.evaluate(()=>{window.alert=()=>{};});
   await page.evaluate(()=>openForm('TE-1'));const h=await page.waitForSelector('iframe[title*="Form TE-1)"]',{state:'attached',timeout:15000});const fr=await h.contentFrame();
   await fr.waitForFunction(()=>document.readyState==='complete'&&!!window.nbhCase,null,{timeout:15000});await fr.evaluate(async()=>{nbhUI.confirm=async()=>true;await loadSim();});
   const got=await page.waitForFunction(()=>state.facts&&state.facts.token&&state.facts.src.token==='TE-1'&&state.facts.token.rpe===50,null,{timeout:30000}).then(()=>true,()=>false);
   ok('22 F421 in the workstation the case keeps it (state.facts.token, from Form TE-1)',got,await page.evaluate(()=>state.facts&&state.facts.src));
   await c2.close();}

  /* ---------- F422 the break request ---------- */
  p=await open(TE);
  const run=(f)=>p.evaluate(f=>{S=blank();renderAll();const rep=nbhCase.apply(f);return {beh:S.meta.beh||'',input:document.querySelector('[data-m="beh"]').value,ph:document.querySelector('[data-m="beh"]').placeholder,rep};},f);
  const escCase={behaviors:[T('Aggression (simulated)',Object.assign({rep:'Break request'},ESC)),R('Break request',ESC)],goals:{red:[],acq:[{beh:'hand the break card to an adult (simulated)'}]}};
  let x=await run(escCase);
  ok('23 F422 an escape case whose replacement and objective are the break request: the field stays empty, its prompt asks for the work, and the fill says why',
    x.beh===''&&x.input===''&&x.ph==='Name the work or skill response each token follows (items completed, intervals on task)'&&x.rep.filled===0&&/^“Break request” asks for a break, which already reinforces it, so it is not placed: name the work or skill each token follows$/.test(x.rep.note||''),x);
  x=await run(Object.assign({},escCase,{goals:{red:[],acq:[{beh:'hand the break card to an adult (simulated)'},{beh:'complete five math problems independently (simulated)'}]}}));
  ok('24 F422 a skill objective that is not the request is placed instead',x.beh==='Complete five math problems independently',x);
  x=await run({behaviors:[T('Calling out (simulated)',{fn:'Attention (social positive)',fnKey:'attention',rep:'Raises a hand to get attention'})]});
  ok('25 F422 a replacement that serves the problem behavior\'s function (attention) is not the fill\'s choice either',x.beh===''&&/serves the function of the behavior it replaces/.test(x.rep.note||''),x);
  await run(escCase);
  await p.evaluate(()=>{document.querySelector('#nbhCaseBtn').click();});await sleep(300);
  const L1=await p.evaluate(()=>[...document.querySelectorAll('#nbhcBody input[data-kind="beh"],#nbhcBody input[data-kind="acq"]')].map(c=>({k:c.dataset.kind,i:+c.dataset.i,on:c.checked,dis:c.disabled,own:(c.closest('label').querySelector('.nbhc-own')||{}).textContent||''})));
  await p.evaluate(()=>{document.querySelectorAll('#nbhcBody input[type="checkbox"]').forEach(c=>{c.checked=c.dataset.kind==='beh'&&c.dataset.i==='1';});document.querySelector('#nbhcUse').click();});await sleep(300);
  await p.evaluate(()=>document.querySelector('#nbhCaseDlg').close());
  f=await p.evaluate(()=>{const n=document.getElementById('teBehFcr');return {beh:S.meta.beh,note:n&&!n.hidden?n.textContent:'',np:!!n&&n.classList.contains('noprint')};});
  ok('26 F422 the From the case list shows the break request unticked with why (not disabled); ticked, Use still places it, and a note under the field says why tokens usually follow the work',
    L1.length===3&&L1.every(i=>!i.on&&!i.dis&&/asks for a break, which already reinforces it: a token for each request adds a second reinforcer for leaving the work\. Tokens usually follow the work, with a break as one of the backups\. Tick it to place it anyway\.$/.test(i.own))&&
    f.beh==='Break request'&&/^“Break request” asks for a break, which already reinforces it/.test(f.note)&&f.np,{L1,f});
  await p.close();

  /* ---------- F419 the case's facts about the backups ---------- */
  p=await open(TE);
  const caseB={profile:{src:'DM-1',health:{allergies:'Peanuts (simulated)'},culture:'No pork (simulated)',accom:'Break every 20 min; preferential seating (simulated)'},
    consent:{src:'IC-1',state:'Current',on:true,covered:['bip','pref','reinf'],dec:{ed:{dec:'no'}},v:2},
    reinf:{items:[{name:'Tablet (simulated)',verdict:'Confirmed',bp:12},{name:'Bubbles (simulated)',verdict:'Relative only'},{name:'Praise (simulated)',verdict:'Not supported',bp:1}],plan:5},
    student:{likes:'Drawing comics (simulated)',preference:'Shorter worksheets (simulated)'},
    menu:[{name:'Tablet (simulated)',type:'Leisure item',rank:1,tier:'HP'},{name:'Bubbles (simulated)',type:'Leisure item',rank:2,tier:'HP'},{name:'Pretzels (simulated)',type:'Edible',rank:3,tier:'MP'}]};
  await p.evaluate(f=>{S=blank();renderAll();setView('gen');nbhCase.apply(f);},caseB);
  f=await p.evaluate(()=>({box:document.querySelector('#teCaseBox').textContent,np:document.querySelector('#teCaseBox').classList.contains('noprint'),conf:S.bk.map(b=>b.conf),opts:[...document.querySelector('#bkTbl select[data-f="conf"]').options].map(o=>o.value)}));
  ok('27 F419 the case\'s allergies, diet, accommodations, the food decision, RA-1\'s verdicts and the student\'s likes show above the menu (on screen)',f.np&&/Allergies \(Form DM-1\): Peanuts \(simulated\)/.test(f.box)&&/Cultural, religious or dietary considerations \(Form DM-1\): No pork/.test(f.box)&&
    /Food items \(Form IC-1\): the parent said no to food or drink items/.test(f.box)&&/IEP accommodations \(Form DM-1\): Break every 20 min/.test(f.box)&&/Reinforcer verdicts \(Form RA-1\): Tablet \(simulated\): Confirmed \(break point 12\)/.test(f.box)&&/What the student likes \(Form SI-1\): Drawing comics/.test(f.box),f.box);
  ok('28 F419 RA-1\'s verdicts fill the RA-1 column in its own words (Relative only is not a No); a cell RA-1 does not name stays empty',JSON.stringify(f.conf.slice(0,3))==='["Yes","Relative only",""]'&&['Yes','Probable','Relative only','No','Not tested'].every(o=>f.opts.includes(o)),f);
  await bk(p,0,'conf','Probable');await p.evaluate(f=>nbhCase.apply(f),caseB);
  const kept=await p.evaluate(()=>S.bk[0].conf);
  let g=await p.evaluate(()=>[...document.querySelectorAll('#genFlags .verdict')].map(e=>[e.className,e.textContent]));
  const g1=g.find(x=>/the parent said no/.test(x[1])),g2=g.find(x=>/^Not yet cleared/.test(x[1]));
  await bk(p,2,'clr',true);const g3=await p.evaluate(()=>document.querySelector('#genFlags').textContent);
  ok('29 F419 a value typed in the RA-1 column is kept; a food backup is flagged until cleared (with the allergies and diet), and while the parent\'s No stands it stays red',kept==='Probable'&&!!g1&&/v-no/.test(g1[0])&&/take “Pretzels \(simulated\)” off the menu/.test(g1[1])&&
    !!g2&&/v-mid/.test(g2[0])&&/allergies: Peanuts \(simulated\) \(Form DM-1\); diet or culture: No pork \(simulated\) \(Form DM-1\)/.test(g2[1])&&!/Not yet cleared/.test(g3)&&/the parent said no/.test(g3),{kept,g,g3});
  await bk(p,3,'n','Break in the beanbag (simulated)');await p.evaluate(()=>{const s=document.querySelector('#bkTbl [data-k="3"][data-f="c"]');s.value='Escape or break';s.dispatchEvent(new Event('change',{bubbles:true}));});
  await tick(p,[11]);
  g=await p.evaluate(()=>({f:document.querySelector('#genFlags').textContent,a:document.querySelector('#audVerdict').textContent,item:(document.querySelector('#auditWrap input[data-a="11"]').closest('label').querySelector('.te-flag')||{}).textContent||''}));
  await bk(p,3,'note','An extra break beyond the IEP\'s every-20-minute break (simulated)');const g4=await p.evaluate(()=>[...document.querySelectorAll('#genFlags .verdict')].map(e=>[e.className,e.textContent]).find(x=>/beanbag/.test(x[1])));
  ok('30 F419 a backup that matches an IEP accommodation is flagged and keeps the entitlement point from holding; a note naming the IEP answers it',/Break in the beanbag \(simulated\) matches the IEP accommodation “Break every 20 min” \(Form DM-1\)\. What the IEP provides is given as the IEP says, not earned \(34 CFR §300\.323\(c\)\(2\), \(d\)\)/.test(g.f)&&
    /“Break in the beanbag \(simulated\)” matches an IEP accommodation/.test(g.a)&&/matches an IEP accommodation/.test(g.item)&&!!g4&&/v-info/.test(g4[0])&&/Its notes say which it is/.test(g4[1]),{g,g4});
  ok('31 F419 the rights example says what the student already has a right to is not earnable, and extras may be backups',await p.evaluate(()=>document.querySelector('[data-m="rights"]').placeholder)==='What the student already has a right to (meals, snack, drink, the bathroom, belongings, and the breaks and adult attention the IEP or the school day provides) is not earnable; extras may be backups');
  await p.close();
  {const dm=await open('DM-1_Student-Demographics-and-Profile_v2026-09.html');await dm.evaluate(()=>{document.querySelector('#simBtn').click();});await sleep(1500);
   const acc=await dm.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.profile&&o.profile.accom;});await dm.close();
   const ra=await open('Reinforcer_Assessment_Protocol.html');await ra.evaluate(()=>{document.querySelector('#simBtn').click();});await sleep(2500);
   const rf=await ra.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.reinf;});
   const shown=await ra.evaluate(()=>[...document.querySelectorAll('#sumTbl tbody tr')].map(tr=>tr.lastElementChild.textContent.trim()));await ra.close();
   ok('32 F419 Form DM-1 hands its accommodations to the case, and Form RA-1 each item\'s verdict as its Summary shows it, with the break point',/Break every 20 min/.test(acc||'')&&!!rf&&rf.items.length===shown.length&&rf.items.every((it,i)=>it.verdict===shown[i])&&rf.items.some(it=>it.verdict==='Confirmed'&&it.bp>0)&&rf.plan===5,{acc,rf,shown});}

  /* ---------- I214 the student's voice ---------- */
  p=await open(TE);
  await p.evaluate(()=>{S=blank();renderAll();nbhCase.apply({student:{assent:'refused',likes:'Drawing (simulated)',stop:{signs:'Pushes the work away (simulated)',steps:'Stop the task (simulated)'},date:'2026-09-28'}});});
  f=await p.evaluate(()=>({a:S.meta.stuAssent,s:S.meta.stuStop,field:document.querySelector('[data-m="stuAssent"]').value,note:document.querySelector('#stuNote').textContent,box:document.querySelector('#teStu').textContent}));
  await p.evaluate(()=>nbhCase.apply({student:{assent:'given',stop:{signs:'Something else (simulated)'}}}));const f2=await p.evaluate(()=>[S.meta.stuAssent,S.meta.stuStop]);
  ok('33 I214 Form SI-1\'s assent and how the student says no go into empty fields (a refusal is named), and are not replaced once there',f.a==='Refused'&&f.field==='Refused'&&f.s==='Pushes the work away (simulated). What staff do: Stop the task (simulated)'&&/^The student has refused\./.test(f.note)&&/From Form SI-1, 9\/28\/2026/.test(f.box)&&f2[0]==='Refused'&&f2[1]===f.s,{f,f2});
  await sim(p);
  ok('34 I214 the student\'s own choice of backups has its own line (the simulation fills it)',/^Shown the menu, the student pointed to the tablet/.test(await p.evaluate(()=>document.querySelector('[data-m="stuChoice"]').value)));

  /* ---------- I213 the exchange log ---------- */
  f=await V(p,'#exSum');
  await ex(p,4,'same','No: banked to a later day');const f3=await p.evaluate(()=>({sum:document.querySelector('#exSum').textContent,item:(document.querySelector('#auditWrap input[data-a="4"]').closest('label').querySelector('.te-flag')||{}).textContent||''}));
  ok('35 I213 the exchange log counts what was bought and refused, flags a backup refused more than once, and an exchange banked to a later day (on the audit\'s same-day point too)',
    /^5 exchanges logged over 3 days, 25 tokens\. Bought: Tablet, video clips 3; Fruit chew 1; Choose the next work task 1\. Refused: Five minutes with the magnetic tiles 2\. On the day earned: 5 of 5\./.test(f.text)&&/Refused more than once: Five minutes with the magnetic tiles \(2 times\)\. .*any backup refused twice is replaced/.test(f.text)&&
    /Banked to a later day: 1 of 5 exchanges/.test(f3.sum)&&/1 exchange banked to a later day/.test(f3.item),{f,f3});

  /* ---------- I215 ending the token system ---------- */
  const fd0=await p.evaluate(()=>[S.meta.fadeTerm,S.meta.fadeNext]);await setM(p,'fadeTerm','');f=await V(p,'#fadeNote');
  ok('36 I215 the plan for ending the token system has its terminal schedule, fading rule and what takes its place; a missing part is named once the system is being thinned',/^FR 20 per star/.test(fd0[0])&&fd0[1]==='Self-monitoring (Form SM-1)'&&/^No plan yet for the terminal schedule\./.test(f.text),f);
  await setM(p,'fadeTerm',fd0[0]);

  /* ---------- I211 dated audits kept ---------- */
  await p.evaluate(()=>document.querySelector('#audKeep').click());await sleep(200);
  f=await p.evaluate(()=>({h:JSON.parse(JSON.stringify(S.audHist)),li:document.querySelector('#audHistBox').textContent,date:S.meta.audDate,out:window.__nbhFactsOut().token.audit.kept}));
  ok('37 I211 Keep this audit: dated, kept in the history (shown and printed), and handed to the case',f.h.length===1&&f.h[0].date===f.date&&f.h[0].n===12&&f.h[0].d===15&&JSON.stringify(f.h[0].gates)==='[1]'&&/^Audits kept/.test(f.li)&&/12 of 15 confirmed; must hold, open: the token has been tested/.test(f.li)&&f.out.length===1&&f.out[0].n===12,f);

  /* ---------- save and open ---------- */
  await th(p,3,'back','Rate below 80% of step 3’s for three sessions: back to five blocks per star.');
  const s1=await p.evaluate(()=>JSON.stringify(S)),saved=await caught(p);await p.evaluate(()=>{S=blank();renderAll();});await openFile(p,saved,'TE-1_round.json');
  ok('38 save and open give back the same record, the new parts with it (the exchange log, the audits kept, the step-back rules, the wants and clearances, token loss, the end plan)',(await p.evaluate(()=>JSON.stringify(S)))===s1&&JSON.parse(saved).S.ex.length===5&&JSON.parse(saved).S.audHist.length===1);
  const oldT=fs.readFileSync(path.join(__dirname,'data','sprint-a9','TE-1.json'),'utf8'),o=JSON.parse(oldT);await openFile(p,oldT,'TE-1.json');
  f=await p.evaluate(()=>JSON.parse(JSON.stringify(S)));
  ok('39 a file saved before v22.54 opens as it was (its behavior, menu, RA-1 answers and ticks), with the new parts empty',f.meta.beh===o.S.meta.beh&&JSON.stringify(f.bk.map(b=>[b.n,b.c,b.conf]))===JSON.stringify(o.S.bk.map(b=>[b.n,b.c,b.conf]))&&JSON.stringify(f.aud)===JSON.stringify(o.S.aud)&&
    f.ex.length===3&&f.ex.every(r=>Object.values(r).every(v=>v===''))&&f.audHist.length===0&&f.thin.every(r=>r.back===''&&r.res==='')&&f.bk.every(b=>b.mo===''&&b.clr===''),f.bk);

  /* ---------- the link with Form TK-1 ---------- */
  f=await p.evaluate(()=>{S=blank();renderAll();const r=lkTake({key:'menu',add:['Puzzle (simulated)']});return {r,row:S.bk[0],panel:!!document.querySelector('#lkPanel [data-lk="on"]'),api:!!lkApi};});
  ok('40 the link with Form TK-1 is there, and a choice card taken from the book is a backup row of the menu\'s full shape',f.panel&&f.api&&f.r!==false&&JSON.stringify(Object.keys(f.row))==='["n","c","mo","cost","pref","conf","clr","note"]'&&f.row.n==='Puzzle (simulated)'&&f.row.note==='Choice card in the token board book (Form TK-1)',f);
  await p.close();

  /* ---------- the student's voice, the loss block and the rest on a phone ---------- */
  {const c3=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});const q=await open(TE,c3);await sim(q);
   const w=[];for(const view of ['setup','sch','gen','aud','guide']){await q.evaluate(v=>setView(v),view);await sleep(150);w.push(await q.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth));}
   ok('41 at a phone\'s width no view scrolls sideways (the wide tables scroll in their own boxes)',w.every(x=>x<=1),w);
   await c3.close();}
  /* the review date still comes due on the case's list (the case flow reads it), and the fill's own earlier rules hold */
  p=await open(TE);await sim(p);
  const due=await p.evaluate(()=>{const o=nbhCase.out()||{};return {due:o.due||[],token:!!o.token};});
  ok('42 the review date still reaches the case\'s due list beside the token system',due.due.some(d=>/Review date/.test(d.what))&&due.token,due);
  x=await p.evaluate(()=>{S=blank();renderAll();return nbhCase.apply({behaviors:[{label:'Aggression',isRep:false,src:'TB-1',type:'Single topography',rep:'Keeps hands to self (no hitting, kicking, or biting)'}]});});
  ok('43 a replacement with no function recorded and no break in it is still placed as before',await p.evaluate(()=>S.meta.beh)==='Keeps hands to self (no hitting, kicking, or biting)'&&x.filled===1,x);
  /* the FCR note follows the field: gone once the work is typed */
  await setM(p,'beh','Requests a break with the card (simulated)');const q1=await p.evaluate(()=>{const n=document.getElementById('teBehFcr');return !!n&&!n.hidden;});
  await setM(p,'beh','Completes a worksheet row (simulated)');const q2=await p.evaluate(()=>{const n=document.getElementById('teBehFcr');return !!n&&!n.hidden;});
  ok('44 F422 the note under the field shows while it holds a break request, and goes once the work is typed',q1&&!q2,{q1,q2});
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('45 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
