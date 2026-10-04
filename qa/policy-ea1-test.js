/* The enhancement sprint (B2): EA-1's alone or no-interaction condition.
   Supervised is the default (door open or shared room, an adult who can see and hear the student, the student free to
   leave, a walk-out ends the session and the named adult follows); true alone can be chosen only after the four steps
   (the policy check with who confirmed it; the stop-or-step-in rule: when, the longest time alone, who steps in and how;
   how the student is watched; the parent's agreement), and falls back to supervised when one goes, taking the form's own
   card wording with it; the Guide, the cards, the walkthrough, the session runner, the job aids and the print say so
   (the print is read from the PDF); files saved before open supervised for the sessions to come, with a line of history;
   walk-outs are counted on their own line; Load simulation asks first; the runner, the yoked replay and the data are
   otherwise unchanged (checked against the form as it was before, from git).
   Run: WS_URL=http://127.0.0.1:<port> WS_ROOT=<checkout> node qa/policy-ea1-test.js
   The PDF text is read with Python's pymupdf when it is installed; without it the print checks read the page instead. */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
const FILE='EA-1_Experimental-Analysis-Protocol_v2026-09.html';
const EDITION=process.env.WS_EDITION||'NBH-Workstation';   /* RPS-Workstation for the school edition */
const URL=BASE+'/'+EDITION+'/'+FILE;
const OUT=__dirname+'/out/policy-ea1/';
const PRE=OUT+EDITION+'_EA-1_pre.html';
const BEFORE='db95334';   /* the commit this change was built on: the form before it, for the unchanged-behaviour checks */
const OLD=__dirname+'/data/EA-1-v2124-sim.json';   /* a file saved by v21.24 (a simulated case): no arrangement in it */
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'  '+JSON.stringify(d).slice(0,900)));if(!c)fails++;};
const pages=buf=>{const m=buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
fs.mkdirSync(OUT,{recursive:true});
let havePre=fs.existsSync(PRE);
if(!havePre){try{fs.writeFileSync(PRE,execFileSync('git',['-C',ROOT,'show',BEFORE+':'+EDITION+'/'+FILE],{maxBuffer:64<<20}));havePre=true;}catch(e){console.log('NOTE the form before this change is not available from git ('+BEFORE+'); the unchanged-behaviour checks are skipped');}}
/* the text of each page of a PDF, or null when pymupdf is not there */
const PY='import sys,json,pymupdf\nd=pymupdf.open(sys.argv[1])\nprint(json.dumps([p.get_text() for p in d]))';
function pdfText(file){try{return JSON.parse(execFileSync('python3',['-c',PY,file],{maxBuffer:64<<20,stdio:['ignore','pipe','ignore']}).toString());}catch(e){return null;}}
const flat=s=>String(s||'').replace(/\s+/g,' ');

/* in the page */
const SET=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(!e)throw new Error('no field '+n);if(e.type==='checkbox')e.checked=!!v;else e.value=v;
  e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
const STUB=()=>{window.confirm=()=>true;window.alert=()=>{};};
(async()=>{const br=await chromium.launch();const log=[];
 const ctx=await br.newContext({viewport:{width:1280,height:1000}});
 /* a seeded Math.random that a test can restart, so a simulation draws the same numbers in two copies of the form */
 await ctx.addInitScript(()=>{let s=1;Math.random=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};window.__seed=n=>{s=n;};window.print=()=>{};});
 const open=async u=>{const p=await ctx.newPage();wire(p,log);await p.goto(u||URL);await sleep(800);return p;};
 const set=(p,n,v)=>p.evaluate(([n,v,f])=>{(new Function('n','v',f))(n,v);},[n,v,'('+SET.toString()+')(n,v)']);
 const v=(p,n)=>p.evaluate(n=>{const e=document.querySelector('[name="'+n+'"]');return e?(e.type==='checkbox'?e.checked:e.value):null;},n);
 const toasts=p=>p.evaluate(()=>[...document.querySelectorAll('.nbh-toast span')].map(t=>t.textContent).join(' | '));
 const clearToasts=p=>p.evaluate(()=>document.querySelectorAll('.nbh-toast').forEach(t=>t.remove()));
 const locked=p=>p.evaluate(()=>[...document.querySelector('[name="s.alone"]').options].find(o=>o.value==='true').disabled);
 const RULE={when:'the first head hit against a hard surface, or any hit that leaves a mark',max:'5',who:'Ms. B, at the window, goes in at once and blocks; the data collector presses End early'};
 const STEPS={'s.alonePolicy':true,'s.alonePolicyNote':'District policy 5.12 read; confirmed by Ms. Lopez, ESE director, 10/4/2026','s.aloneWhen':RULE.when,'s.aloneMax':RULE.max,'s.aloneWho':RULE.who,'s.aloneWatch':'window','s.aloneParent':true,'s.aloneParentNote':'10/4/2026, in a meeting; signed and kept with Form IC-1'};
 const fill=async p=>{await p.evaluate(()=>{const b=document.querySelector('#aloneOpen');if(b&&!b.hidden)b.click();});for(const k of Object.keys(STEPS))await set(p,k,STEPS[k]);await sleep(120);};
 const saveFile=p=>p.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
   document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,250));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():null;});
 const openFile=async(p,text)=>{await p.evaluate(STUB);const inp=await p.$('#fileIn');await inp.setInputFiles({name:'ea1.json',mimeType:'application/json',buffer:Buffer.from(text)});await sleep(900);};
 const card=(p,i)=>p.evaluate(i=>({name:document.querySelector(`[name="c[${i}].name"]`).value,eo:document.querySelector(`[name="c[${i}].eo"]`).value,sd:document.querySelector(`[name="c[${i}].sd"]`).value,beh:document.querySelector(`[name="c[${i}].beh"]`).value,cons:document.querySelector(`[name="c[${i}].cons"]`).value}),i);
 const tpl=async(p,k)=>{await set(p,'v.chosen',k);await p.evaluate(()=>document.querySelector('#loadTpl').click());await sleep(350);};
 const note=p=>p.evaluate(()=>{const n=document.querySelector('#aloneNote');return {hidden:n.hidden,t:n.textContent,flag:n.classList.contains('ea-flag'),np:n.classList.contains('noprint'),fix:!!n.querySelector('[data-alfix]')};});
 const run=(p,i)=>p.evaluate(i=>{const s=document.querySelector('#eaCond');s.value=String(i);s.dispatchEvent(new Event('change'));
   return {script:document.querySelector('#eaScript').textContent,min:eaMin.value,cons:eaCons.value,ncr:eaNcr.value,hold:eaHold.value,prompt:eaPrompt.value,mode:eaMode.value,follow:eaFollow.value};},i);
 const toSessions=p=>p.evaluate(()=>document.querySelector('#viewSeg [data-view="sessions"]').click()).then(()=>sleep(250));
 const printPdf=async(p,name)=>{await p.emulateMedia({media:'print'});await sleep(200);const b=await p.pdf({preferCSSPageSize:true,printBackground:true});await p.emulateMedia({media:'screen'});fs.writeFileSync(OUT+name,b);return {n:pages(b),text:pdfText(OUT+name)};};
 const printDom=async(p,sel)=>{await p.emulateMedia({media:'print'});await sleep(150);const t=await p.evaluate(s=>document.querySelector(s).innerText,sel);await p.emulateMedia({media:'screen'});return t;};

 /* ---------------- 1. the blank form: supervised by default, true alone locked ---------------- */
 let p=await open();
 const W=await p.evaluate(()=>window.eaAlone&&window.eaAlone.words);
 ok('the form exposes its alone wording',!!(W&&W.std&&W.std.sup&&W.std.true&&W.scr&&W.rrb),Object.keys(W||{}));
 let st=await p.evaluate(()=>{const s=document.querySelector('[name="s.alone"]');return {v:s.value,opts:[...s.options].map(o=>[o.value,o.disabled,o.textContent]),txt:document.querySelector('#aloneTxt').textContent,
   panel:document.querySelector('#aloneTrue').hidden,btn:!document.querySelector('#aloneOpen').hidden,paras:[...document.querySelectorAll('#aloneBox .ea-nsc')].filter(e=>!e.hidden).map(e=>e.textContent),
   staff:document.querySelector('[name="s.staff"]').placeholder,hist:document.querySelector('#aloneHist').hidden};});
 ok('Setup & safety: Supervised is chosen on a new form; the menu has only Supervised and True alone',st.v==='sup'&&st.opts.length===2&&/^Supervised \(the default\)$/.test(st.opts[0][2])&&/^True alone \(only after the four steps below\)$/.test(st.opts[1][2]),st.opts);
 ok('true alone cannot be picked until the four steps are done',st.opts[1][0]==='true'&&st.opts[1][1]===true,st.opts);
 ok('the supervised text: door open or shared room, an adult who can see and hear the student, beside the open doorway (never in it), elopement history',
   /door stays open, or the student stays in the shared room/.test(st.txt)&&/where they can see and hear the student the whole time/.test(st.txt)&&/outside the room beside the open doorway \(never in it\)/.test(st.txt)&&/does not interact/.test(st.txt)&&/elopement history/.test(st.txt)&&/a second adult waits outside, beside the doorway/.test(st.txt)&&!/sight and earshot/.test(st.txt),st.txt);
 const P=st.paras.join(' || ');
 ok('no social consequences, where the choice is made: no adult reacts; in a shared room, seat the student away from peers and note any reaction',/No social consequences: no adult reacts to anything the student does/.test(P)&&/eye contact/.test(P)&&/In a shared room, seat the student where other students are unlikely to react, and write any reaction in Notes/.test(P),P);
 ok('a student who walks out: End early, "left the room", the adult named under Staffing follows and steps in at an exit, a road or water (CR-1)',/If the student walks out: no one keeps the student in/.test(P)&&/press End early and write “left the room” in Notes/.test(P)&&/The adult named under Staffing follows, close enough to keep the student safe\. If the student heads for an exit, a road, water or another danger, that adult steps in at once, as the crisis plan says \(Form CR-1\)\./.test(P),P);
 ok('stepping in: a hold is a physical restraint (CR-1), and an injury the behavior does not explain is reported the same day (TB-1)',/Stepping in: blocking, moving the danger away, or ending the session/.test(P)&&/Holding the student is a physical restraint\. Use it only as the crisis plan allows \(Form CR-1\); the crisis plan also says who tells the parent, and how\./.test(P)&&/reported the same day under the safeguarding procedure, as TB-1’s safeguarding rule says/.test(P),P);
 ok('Staffing and ratio asks who follows a student who walks out; no history line on a new form',/who follows a student who walks out/.test(st.staff)&&st.hist,st.staff);
 ok('the true alone steps are folded away behind "Plan a true alone condition"',st.panel&&st.btn,st);
 const g=await p.evaluate(()=>{const h=document.querySelector('#guide #guideAlone');const b=h&&h.nextElementSibling;return h?{h:h.textContent,t:b.textContent,np:!!h.closest('.noprint'),s1:document.querySelector('#guide').textContent.includes('run supervised (section 1b'),s6:document.querySelector('#guide').textContent.includes('Interpretation counts these sessions on their own line')}:null;});
 ok('the Guide, section 1b: supervised, never kept in (the named adult follows), no social consequences, stepping in, true alone after four steps, ignore',
   !!g&&!g.np&&g.s1&&g.s6&&/Supervised, the default/.test(g.t)&&/beside the open doorway \(never in it\)/.test(g.t)&&/Never kept in/.test(g.t)&&/adult named under Staffing follows/.test(g.t)&&/If leaving is itself the target behavior \(elopement\), tap it as Target/.test(g.t)&&/No social consequences/.test(g.t)&&/In a shared room/.test(g.t)&&/Stepping in/.test(g.t)&&/physical restraint/.test(g.t)&&/True alone, only after a policy check/.test(g.t)&&/students with disabilities \(s\. 1003\.573\(2\)/.test(g.t)&&/four steps/.test(g.t)&&/parent’s agreement/.test(g.t)&&/student can open it alone/.test(g.t)&&/Ignoring means no interaction/.test(g.t),g);

 /* ---------------- 2. the gate ---------------- */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());
 await set(p,'s.alone','true');await sleep(150);
 ok('true alone set without the steps falls back to supervised, and names all eight things still to do',await v(p,'s.alone')==='sup'&&/True alone is off: tick the policy check; write which policies you read and who confirmed them; write when to stop or step in; give the longest time alone, in minutes; write who steps in, and how; choose how the student is watched; tick that the parent was told and agreed; write when and how the parent agreed\. The alone condition is supervised again\./.test(await toasts(p)),{v:await v(p,'s.alone'),t:await toasts(p)});
 await p.evaluate(()=>document.querySelector('#aloneOpen').click());await sleep(80);
 const flag=await p.evaluate(()=>({shown:!document.querySelector('#aloneTrue').hidden,t:document.querySelector('#aloneTrue .ea-flag').textContent,labels:[...document.querySelectorAll('#aloneTrue .dlab')].map(l=>l.textContent),door:[...document.querySelectorAll('#aloneTrue .drow')].pop().textContent,
   watch:[...document.querySelector('[name="s.aloneWatch"]').options].map(o=>o.textContent),sub:document.querySelector('#aloneTrue .ea-sub').textContent}));
 ok('the panel opens with the warning: seclusion of students with disabilities (s. 1003.573(2)), district policy, APD Rule 65G-8, keep it supervised',flag.shown&&/^Check policy first\./.test(flag.t)&&/seclusion or isolation/.test(flag.t)&&/Florida law bars school staff from using seclusion with students with disabilities/.test(flag.t)&&/1003\.573\(2\), F\.S\.; see Form CR-1/.test(flag.t)&&/District policy may apply this to every student/.test(flag.t)&&/Agency for Persons with Disabilities \(APD\)/.test(flag.t)&&/Rule 65G-8 counts “enforced isolation or confinement of an individual in a room or area” as seclusion/.test(flag.t)&&/keep the condition supervised/.test(flag.t)&&!/Florida public schools may not use seclusion/.test(flag.t),flag.t);
 ok('the four steps: the policy check and who confirmed it; when, the longest time alone, who steps in; how watched; the parent; the door',JSON.stringify(flag.labels)===JSON.stringify(['1. Policy check','Policies read, and who confirmed them','2. Stop or step in when','Longest time alone (min)','Who steps in, and how','3. How the student is watched','4. Parent told and agreed','When and how the parent agreed','The door']),flag.labels);
 ok('watched and heard: the window choice hears the student, the video has sound, and recording follows the rules and consent',flag.watch[1]==='Without a break, through a window or one-way mirror, and able to hear the student'&&flag.watch[2]==='Without a break, on a live video feed with sound'&&/If the video records, follow the district’s rules and the parent’s consent for recording/.test(flag.sub),flag);
 ok('the door: never locked, latched or held shut; closed only if the policy allows it and the student can open it alone',/Never locked, latched or held shut, and no one stands in the way/.test(flag.door)&&/Close it only if the policy allows it and the student can open it alone\. If they cannot, leave it open\./.test(flag.door),flag.door);
 /* each step, and words that do not count */
 const order=Object.keys(STEPS);const lockedAfter=[];
 for(const k of order){await set(p,k,STEPS[k]);await sleep(60);lockedAfter.push(await locked(p));}
 ok('still locked until the last of the eight is done, then open',lockedAfter.slice(0,7).every(Boolean)&&lockedAfter[7]===false,lockedAfter);
 const tiny={};for(const [k,x] of [['s.alonePolicyNote','x'],['s.aloneWhen','x'],['s.aloneWho','x'],['s.aloneParentNote','x'],['s.aloneMax','0'],['s.aloneMax','abc']]){await set(p,k,x);await sleep(50);tiny[k+'='+x]=await locked(p);await set(p,k,STEPS[k]);await sleep(50);}
 ok('one letter, a time of 0 or a word for the time does not count as a step',Object.values(tiny).every(Boolean),tiny);
 await set(p,'s.aloneMax','5 min');await sleep(60);const minOk=!(await locked(p));await set(p,'s.aloneMax','5');
 ok('"5 min" counts as a time',minOk,minOk);
 await clearToasts(p);await set(p,'s.alone','true');await sleep(150);
 st=await p.evaluate(()=>({v:document.querySelector('[name="s.alone"]').value,cls:document.querySelector('#aloneBox').classList.contains('is-true'),txt:document.querySelector('#aloneTxt').textContent,rd:document.querySelector('#aloneReady').textContent,rdNp:document.querySelector('#aloneReady').classList.contains('noprint')}));
 ok('true alone can then be chosen; the text says alone in the room, watched and heard, door never locked, latched or held shut',st.v==='true'&&st.cls&&/alone in the room/.test(st.txt)&&/through a window or one-way mirror, and can be heard/.test(st.txt)&&/never locked, latched or held shut/.test(st.txt)&&/True alone is set\. The four steps print with the safety plan\./.test(st.rd)&&st.rdNp,st);
 await p.evaluate(()=>{const e=document.querySelector('[name="s.aloneWhen"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(120);
 const typing=await p.evaluate(()=>({v:document.querySelector('[name="s.alone"]').value,rd:document.querySelector('#aloneReady').textContent}));
 await p.evaluate(()=>document.querySelector('[name="s.aloneWhen"]').dispatchEvent(new Event('change',{bubbles:true})));await sleep(150);
 ok('emptying "Stop or step in when": a warning while typing, then supervised again on leaving the box',typing.v==='true'&&/Finish this, or true alone turns off/.test(typing.rd)&&await v(p,'s.alone')==='sup'&&/True alone is off: write when to stop or step in\./.test(await toasts(p)),typing);
 for(const [k,x] of [['s.alonePolicy',false],['s.aloneParent',false],['s.aloneWatch',''],['s.aloneMax','']]){
  await fill(p);await set(p,'s.alone','true');await sleep(100);await set(p,k,x);await sleep(150);
  ok('taking away '+k+' turns true alone off',await v(p,'s.alone')==='sup',await v(p,'s.alone'));}
 await p.close();

 /* ---------------- 3. the templates, the Conditions sheet and the session runner ---------------- */
 p=await open();await p.evaluate(STUB);
 await tpl(p,'standard');let c=await card(p,2);
 ok('standard template, supervised: the Alone / No interaction card has the supervised wording; its consequence is still None',c.name==='Alone / No interaction'&&c.eo===W.std.sup.eo&&c.sd===W.std.sup.sd&&c.beh===W.std.sup.beh&&c.cons==='None',c);
 ok('the supervised card: door open, able to see and hear, free to leave, ignore for aggression, the named adult follows',/door stays open/.test(c.eo)&&/able to see and hear the student the whole time/.test(c.eo)&&/may leave at any time/.test(c.eo)&&/use ignore/.test(c.eo)&&/no talk, eye contact, touch or reaction/.test(c.beh)&&/no one blocks or brings them back/.test(c.beh)&&/the adult named under Staffing follows, close enough to keep the student safe/.test(c.beh),c);
 let n=await note(p);ok('Conditions sheet: a screen-only line says the card follows Setup & safety: supervised',!n.hidden&&n.np&&!n.flag&&/follows Setup & safety: supervised/.test(n.t),n);
 await tpl(p,'alone');c=await card(p,0);ok('extended-alone template, supervised wording',c.eo===W.scr.sup.eo&&c.sd===W.scr.sup.sd&&c.beh===W.scr.sup.beh,c);
 await tpl(p,'rrb');c=await card(p,2);ok('RRB template: the No interaction card keeps the therapist in the room, with no closed-door alternative',c.name==='No interaction'&&c.eo===W.rrb.sup.eo&&!/close the door/.test(c.eo)&&/able to see and hear the student/.test(c.eo),c);
 const ra=await p.evaluate(()=>{const s=document.querySelector('[name="rrb.mode"]');const o=[...s.options].find(o=>o.value==='alone');return {dis:o.disabled,t:o.textContent,txt:document.querySelector('#rrbPanel p.method').textContent};});
 ok('RRB alone is a true alone: its option is locked while the condition is supervised, and the panel names the four steps',ra.dis&&/True alone/.test(ra.t)&&/set on Setup & safety first/.test(ra.t)&&/after the four steps there/.test(ra.txt),ra);
 await tpl(p,'trial');c=await card(p,3);ok('trial-based Ignore keeps the teacher nearby, able to see and hear the student',c.name==='Ignore'&&/the teacher stays nearby, able to see and hear the student/.test(c.eo),c);
 n=await note(p);ok('no alone-type card, no line',n.hidden,n);
 /* true alone */
 await fill(p);await set(p,'s.alone','true');await sleep(120);
 await tpl(p,'standard');c=await card(p,2);
 ok('standard template, true alone: the true alone wording, with no claim that the policy was checked',c.eo===W.std.true.eo&&c.sd===W.std.true.sd&&c.beh===W.std.true.beh&&c.cons==='None'&&/never locked, latched or held shut/.test(c.eo)&&/watches and listens without a break/.test(c.eo)&&/set on Setup & safety, with its stop rule/.test(c.eo)&&!/policy checked/.test(c.eo+W.scr.true.eo+W.rrb.true.eo),c);
 await toSessions(p);
 let r=await run(p,2);
 ok('runner, true alone: the line names the watching, when to stop, the longest time and who steps in',r.script.includes('How it is runTrue alone: watched without a break through a window or one-way mirror, and can be heard. Stop or step in when: the first head hit against a hard surface, or any hit that leaves a mark. Stop at 5 min at the latest. Who steps in, and how: Ms. B, at the window, goes in at once and blocks; the data collector presses End early.')&&!/Check this card/.test(r.script),r.script.slice(0,500));
 const tim=[r.min,r.cons,r.ncr,r.hold,r.prompt,r.mode,r.follow].join('/');
 /* the fallback takes the form's own wording with it */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());await clearToasts(p);
 await set(p,'s.alonePolicy',false);await sleep(200);
 c=await card(p,2);const tt=await toasts(p);
 ok('true alone off (the policy check unticked): card 3 goes back to the supervised wording, and the message says so',await v(p,'s.alone')==='sup'&&c.eo===W.std.sup.eo&&c.sd===W.std.sup.sd&&c.beh===W.std.sup.beh&&/True alone is off: tick the policy check\. The alone condition is supervised again\. Card 3 now has the supervised wording\./.test(tt),{c,tt});
 await toSessions(p);r=await run(p,2);
 ok('runner, after the fallback: "Supervised" and the supervised card, with nothing of true alone left',/How it is runSupervised: the door open or the shared room; an adult who can see and hear the student the whole time, not interacting\. If the student walks out, press End early/.test(r.script)&&!/True alone|Empty room|No one in the room/.test(r.script)&&!/Check this card/.test(r.script)&&[r.min,r.cons,r.ncr,r.hold,r.prompt,r.mode,r.follow].join('/')===tim,r.script.slice(0,400));
 /* RRB: the opt-in to true alone wording, and back */
 await fill(p);await set(p,'s.alone','true');await sleep(100);
 await tpl(p,'rrb');c=await card(p,2);ok('RRB template under true alone with no-interaction chosen: supervised wording',c.eo===W.rrb.sup.eo,c);
 await set(p,'rrb.mode','alone');await sleep(150);
 ok('RRB alone can be chosen once true alone is set',await v(p,'rrb.mode')==='alone',await v(p,'rrb.mode'));
 n=await note(p);ok('the card worded for no-interaction is flagged, printably, with a button for the true alone wording (never rewritten unasked)',n.flag&&!n.np&&/Check card 3/.test(n.t)&&/the supervised wording, but Setup & safety says true alone/.test(n.t)&&n.fix&&(await card(p,2)).eo===W.rrb.sup.eo,n);
 await toSessions(p);r=await run(p,2);
 ok('runner: the card that still says supervised under true alone is flagged',/Check this cardIt does not say the condition is run as true alone: it has the supervised wording\. Update it on the Conditions sheet\./.test(r.script),r.script.slice(0,600));
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="conditions"]').click());await sleep(100);
 await p.evaluate(()=>document.querySelector('#aloneNote [data-alfix]').click());await sleep(150);c=await card(p,2);
 ok('the button puts in the true alone wording, and the flag goes',c.eo===W.rrb.true.eo&&c.sd===W.rrb.true.sd&&!(await note(p)).flag,c);
 await clearToasts(p);await set(p,'s.aloneWatch','');await sleep(200);c=await card(p,2);
 ok('true alone off: RRB back to no-interaction and card 3 back to the supervised wording, in one message',await v(p,'s.alone')==='sup'&&await v(p,'rrb.mode')==='noint'&&c.eo===W.rrb.sup.eo&&c.sd===W.rrb.sup.sd&&/The RRB analysis is back to no-interaction\. Card 3 now has the supervised wording\./.test(await toasts(p)),{m:await v(p,'s.alone'),r:await v(p,'rrb.mode'),c,t:await toasts(p)});
 /* typed wording is never touched, and is flagged in the runner */
 await tpl(p,'standard');await set(p,'c[2].eo','Our own words: Ms. B sits by the door with a book; no talk.');await sleep(150);
 n=await note(p);ok('a card with wording of its own is left as typed, with a reminder to check it',/left as typed/.test(n.t)&&!n.flag,n);
 await fill(p);await set(p,'s.alone','true');await sleep(150);await set(p,'s.alonePolicy',false);await sleep(150);
 ok('changing the arrangement either way never rewrites typed card text',(await card(p,2)).eo==='Our own words: Ms. B sits by the door with a book; no talk.',await card(p,2));
 await toSessions(p);r=await run(p,2);
 ok('runner: a card with wording of its own is flagged: check that it says the condition is supervised',/Check this cardThis card has wording of its own: check that it says the condition is supervised\./.test(r.script),r.script.slice(0,500));
 const rp=await run(p,3);ok('runner: no such lines for Play (control)',!/How it is run|Check this card/.test(rp.script),rp.script.slice(0,120));
 await p.close();

 /* ---------------- 4. the runner, the simulation and the data, against the form before this change ---------------- */
 const simSnap=async(u,key)=>{const q=await open(u);await q.evaluate(STUB);
   await q.evaluate(k=>{document.querySelector('#simScenario').value=k;window.__seed(4242);document.querySelector('#simBtn').click();},key);await sleep(900);
   const s=await q.evaluate(()=>{const f={};document.querySelectorAll('[name]').forEach(e=>{f[e.name]=e.type==='checkbox'?e.checked:e.value;});
     const runner=[...document.querySelectorAll('#condWrap .card')].map(c=>{const s=document.querySelector('#eaCond');s.value=c.dataset.cond;s.dispatchEvent(new Event('change'));
       return [eaMode.value,eaMin.value,eaFollow.value,eaCons.value,eaNcr.value,eaHold.value,eaPrompt.value].join('/');});
     return {f,runner,crit:document.querySelector('#critVerdict').textContent,rrb:(document.querySelector('#rrbVerdict')||{}).textContent,lod:(document.querySelector('#lodOutEA')||{}).textContent,ioa:document.querySelector('#ioaStat').textContent};});
   await q.close();return s;};
 if(havePre){
  const preUrl='file://'+PRE;
  for(const key of ['escape','automatic','undiff','rrb','cfa','latency','trial']){
   const a=await simSnap(preUrl,key),b=await simSnap(URL,key);
   const diff=Object.keys(Object.assign({},a.f,b.f)).filter(k=>a.f[k]!==b.f[k]);
   /* by design: the alone-type cards' wording, the trial-based Ignore card's wording, and the new fields */
   const expected=k=>/^s\.alone/.test(k)||/^c\[\d+\]\.(eo|sd|beh)$/.test(k)&&(()=>{const i=/\d+/.exec(k)[0];const nm=b.f['c['+i+'].name'];return /^(Alone \/ No interaction|Alone \/ No interaction \(screen\)|No interaction|Ignore)$/.test(nm);})();
   const bad=diff.filter(k=>!expected(k));
   console.log('NOTE simulation "'+key+'": '+Object.keys(b.f).length+' fields compared; changed by design: '+diff.filter(expected).join(', '));
   ok('simulation "'+key+'": every field the same as before except the alone-type cards and the new fields',bad.length===0,{bad:bad.map(k=>[k,a.f[k],b.f[k]])});
   ok('simulation "'+key+'": the session runner reads every card as before',JSON.stringify(a.runner)===JSON.stringify(b.runner),{pre:a.runner,now:b.runner});
   ok('simulation "'+key+'": interpretation, IOA and the RRB and LOD readings unchanged',a.crit===b.crit&&a.ioa===b.ioa&&a.rrb===b.rrb&&a.lod===b.lod,{pre:a.crit.slice(0,200),now:b.crit.slice(0,200)});
  }
 }

 /* ---------------- 5. Load simulation asks first; a session at the table; a walk-out ---------------- */
 p=await open();
 await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(200);
 let dlg=await p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?{h:d.querySelector('#nbhUiH').textContent,b:d.querySelector('#nbhUiB').textContent,btns:[...d.querySelectorAll('#nbhUiF button')].map(x=>x.className+':'+x.textContent)}:null;});
 ok('Load simulation asks the question the other forms use, naming the scenario',!!dlg&&dlg.h==='Load the simulated analysis?'&&/^Scenario: Standard FA: escape/.test(dlg.b)&&/Every sheet is filled with a worked example\. Anything already entered will be replaced\./.test(dlg.b)&&JSON.stringify(dlg.btns)==='[":Cancel","primary:Load"]',dlg);
 await p.evaluate(()=>[...document.querySelectorAll('#nbhUiF button')].find(b=>b.textContent==='Cancel').click());await sleep(300);
 ok('Cancel loads nothing',await v(p,'m.client')===''&&await p.evaluate(()=>document.querySelector('#simBanner').hidden),await v(p,'m.client'));
 await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);   /* answered after the runner's own 60-ms re-read */
 await p.evaluate(()=>document.querySelector('#nbhUiF .primary').click());await sleep(500);
 const sim=await p.evaluate(()=>({client:document.querySelector('[name="m.client"]').value,banner:!document.querySelector('#simBanner').hidden,view:document.body.className,
   cond:[...document.querySelector('#eaCond').options].map(o=>o.textContent),cards:[...document.querySelectorAll('#condWrap .card')].map(c=>c.querySelector('[name$=".name"]').value),script:document.querySelector('#eaScript').textContent.slice(0,60)}));
 ok('Load fills the form and opens Sessions & graph',/^SIMULATED/.test(sim.client)&&sim.banner&&/view-sessions/.test(sim.view),sim);
 ok('the session runner lists the simulation\'s conditions even when the question was answered late',sim.cond.length===sim.cards.length&&sim.cond.every((t,i)=>t.startsWith(sim.cards[i]))&&/Attention/.test(sim.script),sim);
 const before=await p.evaluate(()=>document.querySelector('#critVerdict').textContent);
 /* a session run on the alone card at the table, saved to the log as before */
 await p.evaluate(()=>{const s=document.querySelector('#eaCond');s.value='2';s.dispatchEvent(new Event('change'));eaMin.value='1';});
 await p.evaluate(STUB);await p.evaluate(()=>eaStart.click());await sleep(300);await p.evaluate(()=>{eaTarget.click();eaTarget.click();});await p.evaluate(()=>eaEnd.click());await sleep(200);await p.evaluate(()=>eaSave.click());await sleep(200);
 const row=await p.evaluate(()=>{const n=+document.querySelector('#nSess').value;for(let i=n-1;i>=0;i--){const c=document.querySelector(`[name="s[${i}].c"]`).value;if(c!=='')return {i,c,v:document.querySelector(`[name="s[${i}].v"]`).value,t:document.querySelector(`[name="s[${i}].t"]`).checked,n:document.querySelector(`[name="s[${i}].n"]`).value};}return null;});
 ok('a session ended early on the alone card is logged as before: count, Term. checked, the runner\'s note',!!row&&row.c==='2'&&row.v==='2'&&row.t&&/ended early at/.test(row.n),row);
 /* that session was a walk-out: Interpretation counts it on its own line, not with the safety stops */
 const terms=await p.evaluate(()=>{const n=+document.querySelector('#nSess').value;let k=0;for(let i=0;i<n;i++){if(document.querySelector(`[name="s[${i}].c"]`).value!==''&&document.querySelector(`[name="s[${i}].v"]`).value!==''&&document.querySelector(`[name="s[${i}].t"]`).checked)k++;}return k;});
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(250);
 const crit1=await p.evaluate(()=>document.querySelector('#critVerdict').textContent);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="sessions"]').click());await sleep(150);
 await set(p,'s['+row.i+'].n',row.n+'; left the room');await p.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(250);
 const crit2=await p.evaluate(()=>document.querySelector('#critVerdict').textContent);
 const stopLine=k=>new RegExp(k+' session\\(s\\) terminated per the safety criteria');
 ok('Interpretation: a session with "left the room" in Notes is counted on its own line, and not with the safety stops',stopLine(terms).test(crit1)&&!/left the room/.test(crit1)&&/1 session\(s\) ended because the student left the room\. If this keeps happening, run the condition with the adult in the room, or plan an analysis of leaving\./.test(crit2)&&(terms>1?stopLine(terms-1).test(crit2):!/terminated per the safety criteria/.test(crit2)),{terms,crit1:crit1.slice(-400),crit2:crit2.slice(-400)});
 await p.close();

 /* ---------------- 6. print, read from the PDF ---------------- */
 p=await open();
 const blank=await printPdf(p,'blank.pdf');
 const pageWith=(pp,re)=>pp?pp.findIndex(t=>re.test(flat(t))):-1;
 if(!blank.text)console.log('NOTE pymupdf is not installed: the print checks read the page in print media instead of the PDF');
 let pt=blank.text?flat(blank.text[pageWith(blank.text,/Alone or no-interaction/)]||''):flat(await printDom(p,'#setup'));
 ok('print, supervised: the safety plan names the arrangement, what it means, the walk-out and stepping in, without the true alone steps',/Supervised \(the default\)\. The door stays open/.test(pt)&&/No social consequences: no adult reacts/.test(pt)&&/If the student walks out: no one keeps the student in/.test(pt)&&/Stepping in: blocking/.test(pt)&&!/Check policy first/.test(pt)&&!/Plan a true alone condition/.test(pt)&&!/True alone stays locked/.test(pt),pt.slice(pt.indexOf('Alone or no-interaction'),pt.indexOf('Alone or no-interaction')+900));
 if(blank.text){const mi=pageWith(blank.text,/Measurement and Agreement/);ok('print: the Measurement section is whole on one page',mi>=0&&/Procedural fidelity checks/.test(flat(blank.text[mi]))&&/Wallace and Iwata/.test(flat(blank.text[mi])),mi);}
 const gp=blank.text?flat(blank.text.join(' ')):flat(await printDom(p,'#guide'));ok('print: the Guide carries section 1b',/1b\. The Alone Condition in Schools and Homes/.test(gp)&&/Never kept in/.test(gp)&&/Stepping in/.test(gp),gp.slice(0,80));
 await fill(p);await set(p,'s.alone','true');await sleep(150);
 const tru=await printPdf(p,'true.pdf');
 if(tru.text){const ti=pageWith(tru.text,/Check policy first/);pt=flat(tru.text[ti]||'');
  ok('print, true alone (PDF): the warning, the ticks as "Done.", the rule in three parts, the watching, the parent, the door, on one page',ti>=0&&/Done\. I read the rules on seclusion and isolation that apply here/.test(pt)&&pt.includes(STEPS['s.alonePolicyNote'])&&pt.includes(RULE.when)&&/Longest time alone \(min\) 5/.test(pt)&&pt.includes(RULE.who)&&/Without a break, through a window or one-way mirror, and able to hear the student/.test(pt)&&/Done\. The parent was told that the student will be alone in the room/.test(pt)&&pt.includes(STEPS['s.aloneParentNote'])&&/Never locked, latched or held shut/.test(pt),pt.slice(0,1500));
  const all=flat(tru.text.join(' '));ok('print, true alone (PDF): the arrangement prints, the screen-only status does not',/True alone \(only after the four steps below\)\. The student is alone in the room/.test(all)&&!/True alone is set|Finish this, or true alone|Plan a true alone condition/.test(all),all.slice(0,200));}
 else{pt=flat(await printDom(p,'#setup'));ok('print, true alone (page): the warning, the steps and the door',/Check policy first/.test(pt)&&/Done\. I read the rules/.test(pt)&&/Done\. The parent was told/.test(pt)&&/Never locked, latched or held shut/.test(pt),pt.slice(0,600));}
 /* the workstation's master print: the same parts travel with the sheet */
 const pay=await p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='payload'){window.removeEventListener('message',h);res(ev.data.html);}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}));
 ok('master print (the workstation packet) carries the true alone steps, the rule and the ticks',pay.includes('Check policy first')&&pay.includes(RULE.who.slice(0,30))&&pay.includes('is-true')&&/<span class="ea-tick" aria-hidden="true">Done\.<\/span>/.test(pay)&&!/id="aloneOpen"/.test(pay)&&!/id="aloneReady"/.test(pay),{len:pay.length});
 await set(p,'s.alone','sup');await sleep(150);
 const pay2=await p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='payload'){window.removeEventListener('message',h);res(ev.data.html);}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}));
 ok('master print, supervised again: the steps travel but stay hidden on paper (not is-true)',!/class="ea-alone is-true"/.test(pay2)&&/Supervised \(the default\)\./.test(pay2),{len:pay2.length});
 await p.close();
 /* page counts: the blank form grows by the Guide's section 1b and by the safety plan's own page for the Measurement section */
 if(havePre){const q=await open();const count=async u=>{await q.goto(u);await sleep(600);await q.emulateMedia({media:'print'});const n=pages(await q.pdf({preferCSSPageSize:true,printBackground:true}));await q.emulateMedia({media:'screen'});return n;};
  const pre=await count('file://'+PRE),now=await count(URL);console.log('NOTE blank print: '+pre+' pages before, '+now+' now');
  ok('blank print: at most two pages more than before (the Guide\'s section 1b; the Measurement section on the next page)',now<=pre+2&&now>=pre,{pre,now});await q.close();}

 /* ---------------- 7. files saved before, and round trips ---------------- */
 p=await open();const old=fs.readFileSync(OLD,'utf8');const oldF=JSON.parse(old).fields;
 await openFile(p,old);
 st=await p.evaluate(()=>{const s=document.querySelector('[name="s.alone"]');const h=document.querySelector('#aloneHist');return {v:s.value,shown:s.options[s.selectedIndex].textContent,hist:h.hidden?null:h.textContent,keep:document.querySelector('[name="s.aloneHist"]').value};});
 let tt7=await toasts(p);
 ok('a v21.24 file opens supervised for the sessions to come, and says so',st.v==='sup'&&/^Supervised \(the default\)$/.test(st.shown)&&/This file was saved by an earlier version of EA-1\. The alone condition is now supervised for the sessions to come\. Card 3 now has the supervised wording\./.test(tt7),{st,tt7});
 ok('its line of history: how the alone condition was run was not recorded; check the session notes',!!st.hist&&/^Earlier sessions: This file was saved by an earlier version of EA-1, which did not record how the alone condition was run\. Check your session notes for the sessions already run\. From now on the condition is supervised\. Card 3 now has the supervised wording\.$/.test(st.hist)&&st.keep===st.hist.replace(/^Earlier sessions: /,''),st);
 c=await card(p,2);ok('its Alone / No interaction card, which held the earlier template wording, now has the supervised wording',c.eo===W.std.sup.eo&&c.sd===W.std.sup.sd&&c.beh===W.std.sup.beh,c);
 const back=await p.evaluate(keys=>keys.map(k=>{const e=document.querySelector('[name="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):undefined;}),Object.keys(oldF));
 const lost=Object.keys(oldF).filter((k,i)=>back[i]!==undefined&&back[i]!==oldF[k]&&!/^c\[2\]\.(eo|sd|beh)$/.test(k));
 ok('every other field of the v21.24 file comes back unchanged',lost.length===0,lost.map(k=>[k,oldF[k]]));
 n=await note(p);ok('the Conditions sheet: nothing left to flag',!n.flag&&/follows Setup & safety: supervised/.test(n.t),n);
 pt=flat(await printDom(p,'#setup'));ok('print: the line of history is on the safety plan',/Earlier sessions: This file was saved by an earlier version of EA-1/.test(pt),pt.slice(pt.indexOf('Stepping in'),pt.indexOf('Stepping in')+700));
 let txt=await saveFile(p);let d=JSON.parse(txt);
 ok('saved again, the file says supervised and keeps the line of history',d.fields['s.alone']==='sup'&&/did not record how the alone condition was run/.test(d.fields['s.aloneHist']||''),{a:d.fields['s.alone'],h:d.fields['s.aloneHist']});
 await p.reload();await sleep(800);await openFile(p,txt);
 ok('reopened: supervised, the history still there, and no message this time',await v(p,'s.alone')==='sup'&&await p.evaluate(()=>!document.querySelector('#aloneHist').hidden)&&!/earlier version/.test(await toasts(p)),await toasts(p));
 /* an older file with no alone-type condition: supervised, quietly, no history */
 await p.reload();await sleep(800);const noAl=JSON.parse(old);noAl.fields['c[2].name']='Tangible';noAl.fields['c[2].eo']='Preferred item removed; returned for 30 s contingent on each target';
 await openFile(p,JSON.stringify(noAl));
 ok('an older file with no alone or no-interaction card opens supervised with no history and no message',await v(p,'s.alone')==='sup'&&await v(p,'s.aloneHist')===''&&!/earlier version/.test(await toasts(p)),{h:await v(p,'s.aloneHist'),t:await toasts(p)});
 /* a file saved just before this change (v21.43), with RRB alone */
 if(havePre){const q=await open('file://'+PRE);await q.evaluate(STUB);await q.evaluate(()=>{document.querySelector('#simScenario').value='rrb';document.querySelector('#simBtn').click();});await sleep(900);
  await q.evaluate(()=>{const s=document.querySelector('[name="rrb.mode"]');s.value='alone';s.dispatchEvent(new Event('change',{bubbles:true}));});
  const t43=await saveFile(q);await q.close();const f43=JSON.parse(t43).fields;
  await p.reload();await sleep(800);await openFile(p,t43);
  const rr=await p.evaluate(()=>({m:document.querySelector('[name="s.alone"]').value,r:document.querySelector('[name="rrb.mode"]').value,flag:!document.querySelector('#rrbAloneFlag').hidden,hist:document.querySelector('#aloneHist').textContent,eo:document.querySelector('[name="c[2].eo"]').value,nm:document.querySelector('[name="c[2].name"]').value}));
  ok('a v21.43 file with RRB alone opens supervised: RRB is now no-interaction, its card has the supervised wording, and the history says so',f43['c[2].eo']===W.rrb.old.eo&&rr.m==='sup'&&rr.r==='noint'&&!rr.flag&&rr.nm==='No interaction'&&rr.eo===W.rrb.sup.eo&&/The RRB analysis was set to Alone \(the therapist out of the room\); it is now No-interaction\. Card 3 now has the supervised wording\./.test(rr.hist),rr);}
 /* a file saved by this change's first build, with the arrangement left "not recorded" */
 await p.reload();await sleep(800);const nr=JSON.parse(old);nr.fields['s.alone']='';
 await openFile(p,JSON.stringify(nr));
 ok('a file with the arrangement left blank is read as an older file',await v(p,'s.alone')==='sup'&&/did not record/.test(await v(p,'s.aloneHist')),await v(p,'s.alone'));
 /* a file that holds true alone without the steps (edited by hand) */
 await p.reload();await sleep(800);
 const bad=JSON.parse(old);Object.assign(bad.fields,STEPS,{'s.alone':'true','s.aloneWho':''});
 await openFile(p,JSON.stringify(bad));
 ok('a file holding true alone without all four steps opens supervised, and says so',await v(p,'s.alone')==='sup'&&/held true alone without all four steps: the alone condition is supervised/.test(await toasts(p)),{v:await v(p,'s.alone'),t:await toasts(p)});
 /* a true alone file round trip */
 await p.reload();await sleep(800);await p.evaluate(STUB);
 await fill(p);await set(p,'s.alone','true');await set(p,'m.client','Round Trip');await sleep(150);
 txt=await saveFile(p);d=JSON.parse(txt);
 ok('Save data holds the arrangement and every part of the four steps',d.fields['s.alone']==='true'&&Object.keys(STEPS).every(k=>d.fields[k]===STEPS[k]),Object.keys(STEPS).map(k=>[k,d.fields[k]]));
 await p.reload();await sleep(800);await openFile(p,txt);
 st=await p.evaluate(()=>({m:document.querySelector('[name="s.alone"]').value,cls:document.querySelector('#aloneBox').classList.contains('is-true'),panel:!document.querySelector('#aloneTrue').hidden,who:document.querySelector('[name="s.aloneWho"]').value,ticks:[...document.querySelectorAll('#aloneBox .ea-tick')].map(t=>t.textContent)}));
 ok('reopened: true alone, with its steps shown and both ticks reading "Done." for the paper',st.m==='true'&&st.cls&&st.panel&&st.who===RULE.who&&JSON.stringify(st.ticks)==='["Done.","Done."]',st);
 await p.close();

 /* ---------------- 8. the walkthrough and the job aids ---------------- */
 p=await open();await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());await sleep(500);
 const at=async n=>{await p.evaluate(n=>window.SCENES.alone.go(n),n);await sleep(1500);};
 await at(0);const w0=await p.evaluate(()=>({door:getComputedStyle(document.querySelector('#wk-alone .ea-door')).display!=='none',adult:getComputedStyle(document.querySelector('#wk-alone .adult-at')).display!=='none'}));
 await at(3);const w3=await p.evaluate(()=>({st:document.querySelector('#wk-alone .student-at').getAttribute('transform'),shoe:document.querySelector('#wk-alone .student .shoe.near').getAttribute('d'),chair:getComputedStyle(document.querySelector('#wk-alone .chair-s')).display!=='none'}));
 await at(4);const w4=await p.evaluate(()=>({ad:document.querySelector('#wk-alone .adult-at').getAttribute('transform')}));
 await at(7);const w7=await p.evaluate(()=>({door:getComputedStyle(document.querySelector('#wk-alone .ea-door')).display!=='none',win:getComputedStyle(document.querySelector('#wk-alone .eaw .wall1')).display!=='none',adult:getComputedStyle(document.querySelector('#wk-alone .adult-at')).display!=='none'}));
 await at(6);
 const wk=await p.evaluate(()=>{const S=window.SCENES.alone;const board=document.querySelector('#wk-alone .eaw .board .bc').textContent;
   const sec=document.querySelector('#wk-alone').textContent,setupCard=document.querySelector('#wk-setup .card4 .pm-none').textContent,screenCard=document.querySelector('#wk-alone .card4 .pm-none').textContent;
   return {n:S.frames.length,board,steps:[...document.querySelectorAll('#wk-alone ol.storysteps li')].map(l=>l.textContent),sec,setupCard,screenCard,drill:window.eaWalk.drill.total,
     qs:window.eaWalk.drill.Q.map(q=>({q:q.q,o:q.o}))};});
 ok('the alone story: supervised first, with the door open and the therapist in the room',wk.n===11&&w0.door&&w0.adult&&/^Supervised, the form’s default/.test(wk.steps[0])&&/able to see and hear the student the whole time/.test(wk.steps[0]),{n:wk.n,w0,s:wk.steps[0]});
 ok('the walk-out: the student is standing and walking toward the open door, feet on the floor, the chair left empty',/^translate\(-118(\.0)? -26(\.0)?\)$/.test(w3.st||'')&&/^M550 284 /.test(w3.shoe||'')&&w3.chair&&/No one keeps the student in/.test(wk.steps[3])&&/left the room/.test(wk.steps[3])&&/The adult named under Staffing follows/.test(wk.steps[3]),{w3,s:wk.steps[3]});
 ok('the step-in: the therapist beside the student, clear of the doorway, with an open hand; a hold is a restraint',/^translate\(330(\.0)? 0\)/.test(w4.ad||'')&&/the therapist steps in/i.test(wk.steps[4])&&/open hand between the student’s hand and head, from beside the student/.test(wk.steps[4])&&/A hold is a physical restraint, used only as the crisis plan allows/.test(wk.steps[4]),{w4,s:wk.steps[4]});
 ok('true alone in the story: the four-step board, then the student alone behind the window',/True alone: only after four steps/.test(wk.board)&&/4  The parent told and agreed/.test(wk.board)&&/latched/.test(wk.board)&&w7.win&&!w7.adult&&!w7.door&&/True alone, when it is set/.test(wk.steps[7])&&/watches and listens/.test(wk.steps[7]),{board:wk.board.slice(0,200),w7});
 ok('the section text: supervised by default, never in the doorway, the named adult follows, stepping in, walk-outs on their own line',/run supervised unless true alone is set on Setup & safety/.test(wk.sec)&&/never in the doorway/.test(wk.sec)&&/Never keep the student in/.test(wk.sec)&&/The adult named under Staffing follows/.test(wk.sec)&&/A hold is a physical restraint/.test(wk.sec)&&/the four steps/.test(wk.sec)&&/counted on their own line/.test(wk.sec)&&!/watch without going in/.test(wk.sec),wk.sec.slice(0,200));
 ok('the setup section and the screen card quote the supervised cards word for word',wk.setupCard.includes(W.std.sup.eo)&&wk.setupCard.includes(W.std.sup.beh)&&wk.screenCard.includes(W.scr.sup.eo),wk.setupCard.slice(0,200));
 const wq=wk.qs.find(q=>/walks out through the open door/.test(q.q));
 ok('practice: one question more, on the student who walks out; the right answer has the named adult follow',wk.drill===19&&!!wq&&wq.o.some(o=>o[1]===1&&/adult named under Staffing follows/.test(o[0])),{n:wk.drill,q:wq});
 const aids=async()=>p.evaluate(()=>{window.eaWalk.buildJobAids();const h=document.getElementById('wk-aids');const cols=[...h.querySelectorAll('table.jp-card th')].map(t=>t.textContent);const ai=cols.indexOf('Alone / No interaction');
   const cells=[...h.querySelectorAll('table.jp-card tbody tr')].map(tr=>tr.children[ai].textContent);const fix=[...h.querySelectorAll('table.jp-fix tr')].map(tr=>tr.textContent);
   const chk=[...h.querySelectorAll('table.jp-chk')][0].textContent;const steps=h.querySelectorAll('.jp-step').length;
   const setup=[...h.querySelectorAll('section')[1].querySelectorAll('.jp-cols ul')[0].children].map(li=>li.textContent);const r={cells,fix,chk,steps,setup,all:h.textContent};h.innerHTML='';return r;});
 let ja=await aids();
 ok('job aids, supervised: the alone column, the Set Up line and the checklist are the supervised ones',ja.cells[1]===W.std.sup.eo&&ja.cells[0]===W.std.sup.sd&&/An adult able to see and hear the student the whole time/.test(ja.chk)&&/never in the doorway/.test(ja.chk)&&ja.setup.some(t=>/^Alone or no-interaction: supervised\./.test(t)),{c:ja.cells.slice(0,2),s:ja.setup});
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());await fill(p);await set(p,'s.alone','true');await sleep(150);
 const steps0=ja.steps;ja=await aids();
 ok('job aids, true alone: the true alone column, the Set Up line and the true alone checklist, as many drawings',ja.cells[1]===W.std.true.eo&&ja.setup.some(t=>/^Alone or no-interaction: true alone, as set on Setup & safety/.test(t))&&/the four steps done/.test(ja.chk)&&/The stop-or-step-in rule followed as written/.test(ja.chk)&&ja.steps===steps0,{c:ja.cells[1],s:ja.setup});
 ok('the job aids never carry the case\'s own rule, policy or parent notes (they hold no student information)',![RULE.when,RULE.who,STEPS['s.alonePolicyNote'],STEPS['s.aloneParentNote']].some(x=>ja.all.includes(x.slice(0,30)))&&!ja.fix.some(t=>/Alone/.test(t)),{f:ja.fix});
 await p.close();

 ok('no console or page error in any page',log.filter(x=>x.type==='pageerror'||x.type==='error').length===0,log.slice(0,6));
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
