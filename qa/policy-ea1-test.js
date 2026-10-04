/* The enhancement sprint (B2): EA-1's alone or no-interaction condition.
   Supervised is the default (door open or shared room, an adult in sight and earshot, the student free to leave); true
   alone can be chosen only after the policy check, the stop-or-step-in rule and how the student is watched; the Guide,
   the cards, the walkthrough, the session runner, the job aids and the print say so; files saved before keep what they
   say (they read as not recorded and are flagged, never rewritten); Load simulation asks first; the runner, the yoked
   replay and the data are otherwise unchanged (checked against the form as it was before, from git).
   Run: WS_URL=http://127.0.0.1:<port> WS_ROOT=<checkout> node qa/policy-ea1-test.js */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
const FILE='EA-1_Experimental-Analysis-Protocol_v2026-09.html';
const EDITION=process.env.WS_EDITION||'NBH-Workstation';   /* RPS-Workstation for the school edition */
const URL=BASE+'/'+EDITION+'/'+FILE;
const OUT=__dirname+'/out/policy-ea1/';
const PRE=OUT+EDITION+'_EA-1_pre.html';
const BEFORE='db95334';   /* the commit this change was built on: the form before it, for the unchanged-behaviour checks */
const OLD=__dirname+'/data/EA-1-v2124-sim.json';   /* a file saved by v21.24 (a simulated case): no arrangement in it */
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':'  '+JSON.stringify(d).slice(0,700)));if(!c)fails++;};
const pages=buf=>{const m=buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
fs.mkdirSync(OUT,{recursive:true});
let havePre=fs.existsSync(PRE);
if(!havePre){try{fs.writeFileSync(PRE,execFileSync('git',['-C',ROOT,'show',BEFORE+':'+EDITION+'/'+FILE],{maxBuffer:64<<20}));havePre=true;}catch(e){console.log('NOTE the form before this change is not available from git ('+BEFORE+'); the unchanged-behaviour checks are skipped');}}

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
 const fill=async(p,rule)=>{await set(p,'s.alonePolicy',true);await set(p,'s.alonePolicyNote','District, agency and state policy read; J. N., 10/4/2026');
   await set(p,'s.aloneStop',rule);await set(p,'s.aloneWatch','window');await sleep(120);};
 const saveFile=p=>p.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
   document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,250));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():null;});
 const openFile=async(p,text)=>{await p.evaluate(STUB);const inp=await p.$('#fileIn');await inp.setInputFiles({name:'ea1.json',mimeType:'application/json',buffer:Buffer.from(text)});await sleep(900);};
 const RULE='Stop at the first head hit that could cause harm, or at 5 min, whichever comes first. The therapist, watching at the window, goes in at once and blocks; the data collector presses End early.';

 /* ---------------- 1. the blank form: supervised by default, true alone locked ---------------- */
 let p=await open();
 const W=await p.evaluate(()=>window.eaAlone&&window.eaAlone.words);
 ok('the form exposes its alone wording',!!(W&&W.std&&W.std.sup&&W.std.true&&W.scr&&W.rrb),Object.keys(W||{}));
 let st=await p.evaluate(()=>{const s=document.querySelector('[name="s.alone"]');return {v:s.value,opts:[...s.options].map(o=>[o.value,o.disabled,o.textContent]),txt:document.querySelector('#aloneTxt').textContent,
   panel:document.querySelector('#aloneTrue').hidden,btn:!document.querySelector('#aloneOpen').hidden,nsc:document.querySelector('#aloneBox .ea-nsc').textContent};});
 ok('Setup & safety: Supervised is chosen on a new form',st.v==='sup'&&/^Supervised \(the default\)$/.test(st.opts[0][2]),st);
 ok('true alone cannot be picked until the three steps are done',st.opts[1][0]==='true'&&st.opts[1][1]===true,st.opts);
 ok('the supervised text says door open or shared room, in sight and earshot, never kept in, End early and follow',
   /door stays open, or the student stays in the shared room/.test(st.txt)&&/in sight and earshot/.test(st.txt)&&/No one keeps the student in/.test(st.txt)&&/End early/.test(st.txt)&&/left the room/.test(st.txt)&&/follow at a distance/.test(st.txt),st.txt);
 ok('no social consequences is described where the choice is made',/nothing anyone does depends on the behavior/.test(st.nsc)&&/eye contact/.test(st.nsc),st.nsc);
 ok('the true alone steps are folded away behind "Plan a true alone condition"',st.panel&&st.btn,st);
 /* the Guide */
 const g=await p.evaluate(()=>{const h=document.querySelector('#guide #guideAlone');const b=h&&h.nextElementSibling;return h?{h:h.textContent,t:b.textContent,np:!!h.closest('.noprint'),s1:document.querySelector('#guide').textContent.includes('run supervised (section 1b')}:null;});
 ok('the Guide has section 1b with the supervised default, never kept in, no social consequences, the policy check and ignore',
   !!g&&!g.np&&g.s1&&/Supervised, the default/.test(g.t)&&/Never kept in/.test(g.t)&&/No social consequences/.test(g.t)&&/True alone, only after a policy check/.test(g.t)&&/1003\.573/.test(g.t)&&/Ignoring means no interaction/.test(g.t),g);

 /* ---------------- 2. the gate ---------------- */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());
 await set(p,'s.alone','true');await sleep(150);
 ok('true alone set without the steps falls back to supervised, and says why',await v(p,'s.alone')==='sup'&&/True alone is off: tick the policy check; write the stop-or-step-in rule; choose how the student is watched/.test(await toasts(p)),{v:await v(p,'s.alone'),t:await toasts(p)});
 await p.evaluate(()=>document.querySelector('#aloneOpen').click());await sleep(80);
 const flag=await p.evaluate(()=>({shown:!document.querySelector('#aloneTrue').hidden,t:document.querySelector('#aloneTrue .ea-flag').textContent}));
 ok('the panel opens with the warning to check district, agency and state policy on seclusion and isolation',flag.shown&&/Check policy first/.test(flag.t)&&/seclusion or isolation/.test(flag.t)&&/Districts, agencies and states/.test(flag.t)&&/keep the condition supervised/.test(flag.t),flag);
 const dis=()=>p.evaluate(()=>[...document.querySelector('[name="s.alone"]').options].find(o=>o.value==='true').disabled);
 await set(p,'s.alonePolicy',true);await sleep(80);const d1=await dis();
 await set(p,'s.aloneStop',RULE);await sleep(80);const d2=await dis();
 await set(p,'s.aloneWatch','video');await sleep(80);const d3=await dis();
 ok('still locked with one or two steps done; open when all three are',d1&&d2&&!d3,{d1,d2,d3});
 await set(p,'s.alone','true');await sleep(150);
 st=await p.evaluate(()=>({v:document.querySelector('[name="s.alone"]').value,cls:document.querySelector('#aloneBox').classList.contains('is-true'),txt:document.querySelector('#aloneTxt').textContent,rd:document.querySelector('#aloneReady').textContent}));
 ok('true alone can then be chosen; the text says alone in the room, watched without a break on video, door never locked',st.v==='true'&&st.cls&&/alone in the room/.test(st.txt)&&/on a live video feed/.test(st.txt)&&/never locked or held shut/.test(st.txt)&&/True alone is set/.test(st.rd),st);
 await p.evaluate(()=>{const e=document.querySelector('[name="s.aloneStop"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(120);
 const typing=await p.evaluate(()=>({v:document.querySelector('[name="s.alone"]').value,rd:document.querySelector('#aloneReady').textContent}));
 await p.evaluate(()=>document.querySelector('[name="s.aloneStop"]').dispatchEvent(new Event('change',{bubbles:true})));await sleep(150);
 ok('emptying the stop rule: a warning while typing, then supervised again on leaving the box',typing.v==='true'&&/Finish this, or true alone turns off/.test(typing.rd)&&await v(p,'s.alone')==='sup'&&/True alone is off: write the stop-or-step-in rule/.test(await toasts(p)),typing);
 await set(p,'s.aloneStop',RULE);await set(p,'s.alone','true');await sleep(120);await set(p,'s.alonePolicy',false);await sleep(150);
 ok('unticking the policy check turns true alone off',await v(p,'s.alone')==='sup',await v(p,'s.alone'));
 await set(p,'s.alonePolicy',true);await set(p,'s.alone','true');await sleep(120);await set(p,'s.aloneWatch','');await sleep(150);
 ok('clearing how the student is watched turns true alone off',await v(p,'s.alone')==='sup',await v(p,'s.alone'));
 await p.close();

 /* ---------------- 3. the templates and the Conditions sheet ---------------- */
 p=await open();await p.evaluate(STUB);
 const card=(p,i)=>p.evaluate(i=>({name:document.querySelector(`[name="c[${i}].name"]`).value,eo:document.querySelector(`[name="c[${i}].eo"]`).value,sd:document.querySelector(`[name="c[${i}].sd"]`).value,beh:document.querySelector(`[name="c[${i}].beh"]`).value,cons:document.querySelector(`[name="c[${i}].cons"]`).value}),i);
 const tpl=async(p,k)=>{await set(p,'v.chosen',k);await p.evaluate(()=>document.querySelector('#loadTpl').click());await sleep(350);};
 const note=p=>p.evaluate(()=>{const n=document.querySelector('#aloneNote');return {hidden:n.hidden,t:n.textContent,flag:n.classList.contains('ea-flag'),np:n.classList.contains('noprint'),fix:!!n.querySelector('[data-alfix]')};});
 await tpl(p,'standard');let c=await card(p,2);
 ok('standard template, supervised: the Alone / No interaction card has the supervised wording; its consequence is still None',c.name==='Alone / No interaction'&&c.eo===W.std.sup.eo&&c.sd===W.std.sup.sd&&c.beh===W.std.sup.beh&&c.cons==='None',c);
 ok('the supervised card says door open, in sight and earshot, free to leave, and ignore for aggression',/door stays open/.test(c.eo)&&/in sight and earshot/.test(c.eo)&&/may leave at any time/.test(c.eo)&&/use ignore/.test(c.eo)&&/no talk, eye contact, touch or reaction/.test(c.beh)&&/no one blocks or brings them back/.test(c.beh),c);
 let n=await note(p);ok('Conditions sheet: a screen-only line says the card follows Setup & safety: supervised',!n.hidden&&n.np&&!n.flag&&/follows Setup & safety: supervised/.test(n.t),n);
 await tpl(p,'alone');c=await card(p,0);ok('extended-alone template, supervised wording',c.eo===W.scr.sup.eo&&c.sd===W.scr.sup.sd,c);
 await tpl(p,'rrb');c=await card(p,2);ok('RRB template: the No interaction card keeps the therapist in the room, with no closed-door alternative',c.name==='No interaction'&&c.eo===W.rrb.sup.eo&&!/close the door/.test(c.eo),c);
 const ra=await p.evaluate(()=>{const s=document.querySelector('[name="rrb.mode"]');const o=[...s.options].find(o=>o.value==='alone');return {dis:o.disabled,t:o.textContent};});
 ok('RRB alone is a true alone: its option is locked while the condition is supervised',ra.dis&&/True alone/.test(ra.t)&&/set on Setup & safety first/.test(ra.t),ra);
 await tpl(p,'trial');c=await card(p,3);ok('trial-based Ignore keeps the teacher nearby',c.name==='Ignore'&&/the teacher stays nearby, in sight and earshot/.test(c.eo),c);
 n=await note(p);ok('no alone-type card, no line',n.hidden,n);
 /* true alone */
 await p.evaluate(()=>document.querySelector('#aloneOpen').click());await fill(p,RULE);await set(p,'s.alone','true');await sleep(120);
 await tpl(p,'standard');c=await card(p,2);ok('standard template, true alone: the card has the true alone wording',c.eo===W.std.true.eo&&c.sd===W.std.true.sd&&c.beh===W.std.true.beh&&c.cons==='None'&&/never locked or held shut/.test(c.eo),c);
 await tpl(p,'rrb');c=await card(p,2);ok('RRB template under true alone with no-interaction chosen: supervised wording',c.eo===W.rrb.sup.eo,c);
 await set(p,'rrb.mode','alone');await sleep(150);
 ok('RRB alone can be chosen once true alone is set',await v(p,'rrb.mode')==='alone',await v(p,'rrb.mode'));
 n=await note(p);ok('the card worded for no-interaction is flagged, printably, with a button for the true alone wording',n.flag&&!n.np&&/Check card 3/.test(n.t)&&/the supervised wording, but Setup & safety says true alone/.test(n.t)&&n.fix,n);
 await p.evaluate(()=>document.querySelector('#aloneNote [data-alfix]').click());await sleep(150);c=await card(p,2);
 ok('the button puts in the true alone wording, and the flag goes',c.eo===W.rrb.true.eo&&c.sd===W.rrb.true.sd&&!(await note(p)).flag,c);
 await set(p,'s.aloneWatch','');await sleep(200);
 ok('true alone off: RRB goes back to no-interaction, and the card is flagged again (not rewritten)',await v(p,'s.alone')==='sup'&&await v(p,'rrb.mode')==='noint'&&(await card(p,2)).eo===W.rrb.true.eo&&(await note(p)).flag,{m:await v(p,'s.alone'),r:await v(p,'rrb.mode'),t:await toasts(p)});
 /* typed wording is never touched */
 await tpl(p,'standard');await set(p,'c[2].eo','Our own words: Ms. B sits by the door with a book; no talk.');await sleep(150);
 n=await note(p);ok('a card with wording of its own is left as typed, with a reminder to check it',/left as typed/.test(n.t)&&!n.flag,n);
 await set(p,'s.aloneWatch','window');await set(p,'s.alone','true');await sleep(150);
 ok('changing the arrangement never rewrites typed card text',(await card(p,2)).eo==='Our own words: Ms. B sits by the door with a book; no talk.',await card(p,2));
 /* the session runner: one line on how the condition is run; its timings are the card's, as before */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="sessions"]').click());await sleep(250);
 const run=i=>p.evaluate(i=>{const s=document.querySelector('#eaCond');s.value=String(i);s.dispatchEvent(new Event('change'));
   return {script:document.querySelector('#eaScript').textContent,min:eaMin.value,cons:eaCons.value,ncr:eaNcr.value,hold:eaHold.value,prompt:eaPrompt.value,mode:eaMode.value,follow:eaFollow.value};},i);
 let r=await run(2);ok('runner, true alone: the line names the watching and the stop rule',/How it is runTrue alone: watched without a break through a window or one-way mirror\. Stop or step in: Stop at the first head hit/.test(r.script),r.script.slice(0,300));
 await set(p,'s.alone','sup');await p.evaluate(()=>document.querySelector('#viewSeg [data-view="sessions"]').click());await sleep(250);
 r=await run(2);ok('runner, supervised: the line says door open, in sight and earshot, End early when the student walks out',/How it is runSupervised: the door open or the shared room; an adult in sight and earshot, not interacting\. If the student walks out, press End early/.test(r.script),r.script.slice(0,300));
 const rp=await run(3);ok('runner: no such line for Play (control)',!/How it is run/.test(rp.script),rp.script.slice(0,120));
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

 /* ---------------- 5. Load simulation asks first ---------------- */
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
 /* a session run on the alone card at the table, saved to the log as before */
 await p.evaluate(()=>{const s=document.querySelector('#eaCond');s.value='2';s.dispatchEvent(new Event('change'));eaMin.value='1';});
 await p.evaluate(STUB);await p.evaluate(()=>eaStart.click());await sleep(300);await p.evaluate(()=>{eaTarget.click();eaTarget.click();});await p.evaluate(()=>eaEnd.click());await sleep(200);await p.evaluate(()=>eaSave.click());await sleep(200);
 const row=await p.evaluate(()=>{const n=+document.querySelector('#nSess').value;for(let i=n-1;i>=0;i--){const c=document.querySelector(`[name="s[${i}].c"]`).value;if(c!=='')return {i,c,v:document.querySelector(`[name="s[${i}].v"]`).value,t:document.querySelector(`[name="s[${i}].t"]`).checked,n:document.querySelector(`[name="s[${i}].n"]`).value};}return null;});
 ok('a session ended early on the alone card is logged as before: count, Term. checked, the runner\'s note',!!row&&row.c==='2'&&row.v==='2'&&row.t&&/ended early at/.test(row.n),row);
 await p.close();

 /* ---------------- 6. print ---------------- */
 const printText=async(p,sel)=>{await p.emulateMedia({media:'print'});await sleep(150);const t=await p.evaluate(s=>document.querySelector(s).innerText,sel);await p.emulateMedia({media:'screen'});return t;};
 p=await open();
 let pt=await printText(p,'#setup');
 ok('print, supervised: the safety plan names the arrangement and what it means, without the true alone steps',/Supervised \(the default\)\. The door stays open/.test(pt)&&/No social consequences: nothing anyone does depends on the behavior/.test(pt)&&!/Check policy first/.test(pt)&&!/Plan a true alone condition/.test(pt),pt.slice(pt.indexOf('Alone or no-interaction')-10,pt.indexOf('Alone or no-interaction')+600));
 const gp=await printText(p,'#guide');ok('print: the Guide carries section 1b',/1b\. The Alone Condition in Schools and Homes/.test(gp)&&/Never kept in/.test(gp),gp.slice(0,80));
 await p.evaluate(()=>document.querySelector('#aloneOpen').click());await fill(p,RULE);await set(p,'s.alone','true');await sleep(150);
 pt=await printText(p,'#setup');
 ok('print, true alone: the arrangement, the policy warning, the policy check and the door',/True alone \(only after the three steps below\)\. The student is alone in the room/.test(pt)&&/Check policy first/.test(pt)&&/Policy check/.test(pt)&&/I checked the district’s, the agency’s and the state’s policy on seclusion and isolation/.test(pt)&&/Stop-or-step-in rule/.test(pt)&&/How the student is watched/.test(pt)&&/Never locked or held shut/.test(pt),pt.slice(pt.indexOf('Alone or no-interaction')-10,pt.indexOf('Alone or no-interaction')+1200));
 await p.emulateMedia({media:'print'});await sleep(150);
 const pc=await p.evaluate(()=>{const on=n=>{const e=document.querySelector('[name="'+n+'"]');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';};
   return {pol:on('s.alonePolicy')&&document.querySelector('[name="s.alonePolicy"]').checked,note:on('s.alonePolicyNote'),stop:on('s.aloneStop')&&document.querySelector('[name="s.aloneStop"]').value,watch:on('s.aloneWatch')&&document.querySelector('[name="s.aloneWatch"]').selectedOptions[0].textContent,menu:on('s.alone')};});
 await p.emulateMedia({media:'screen'});
 ok('print, true alone: the policy check ticked, the policies, the rule and how the student is watched are on the page; the menu gives way to its words',pc.pol&&pc.note&&pc.stop===RULE&&pc.watch==='Without a break, through a window or one-way mirror'&&!pc.menu,pc);
 /* the workstation's master print: the same parts travel with the sheet */
 const pay=await p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='payload'){window.removeEventListener('message',h);res(ev.data.html);}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}));
 ok('master print (the workstation packet) carries the true alone steps and the rule',pay.includes('Check policy first')&&pay.includes(RULE.slice(0,40))&&pay.includes('is-true')&&!/id="aloneOpen"/.test(pay),{len:pay.length});
 await set(p,'s.alone','sup');await sleep(150);
 const pay2=await p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='payload'){window.removeEventListener('message',h);res(ev.data.html);}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}));
 ok('master print, supervised again: the steps travel but stay hidden on paper (not is-true)',!/class="ea-alone is-true"/.test(pay2)&&/Supervised \(the default\)\./.test(pay2),{len:pay2.length});
 await p.close();
 /* page counts: the blank form grows by the Guide's section 1b (one page); the safety plan stays on its page */
 if(havePre){const q=await open();const count=async u=>{await q.goto(u);await sleep(600);await q.emulateMedia({media:'print'});const n=pages(await q.pdf({preferCSSPageSize:true,printBackground:true}));await q.emulateMedia({media:'screen'});return n;};
  const pre=await count('file://'+PRE),now=await count(URL);console.log('NOTE blank print: '+pre+' pages before, '+now+' now');
  ok('blank print: at most one page more than before (the Guide\'s section 1b)',now<=pre+1&&now>=pre,{pre,now});await q.close();}

 /* ---------------- 7. files saved before, and round trips ---------------- */
 p=await open();const old=fs.readFileSync(OLD,'utf8');const oldF=JSON.parse(old).fields;
 await openFile(p,old);
 st=await p.evaluate(()=>{const s=document.querySelector('[name="s.alone"]');return {v:s.value,shown:s.options[s.selectedIndex].textContent,txt:document.querySelector('#aloneTxt').textContent};});
 ok('a v21.24 file opens as "not recorded", and says to check how earlier sessions were run',st.v===''&&/^Not recorded: saved by an earlier version of EA-1$/.test(st.shown)&&/saved before EA-1 asked/.test(st.txt)&&/sessions still to come/.test(st.txt),st);
 const back=await p.evaluate(keys=>keys.map(k=>{const e=document.querySelector('[name="'+k+'"]');return e?(e.type==='checkbox'?e.checked:e.value):undefined;}),Object.keys(oldF));
 const lost=Object.keys(oldF).filter((k,i)=>back[i]!==undefined&&back[i]!==oldF[k]);
 ok('every field of the v21.24 file comes back unchanged (the old card wording included)',lost.length===0&&(await v(p,'c[2].eo'))===oldF['c[2].eo'],lost.map(k=>[k,oldF[k]]));
 n=await note(p);ok('its Alone / No interaction card is flagged (old wording) with a button for the supervised wording',n.flag&&!n.np&&/Check card 3/.test(n.t)&&/earlier version of EA-1/.test(n.t)&&/not recorded/.test(n.t)&&n.fix,n);
 let txt=await saveFile(p);let d=JSON.parse(txt);
 ok('saved again, it still says not recorded and keeps the old card text',d.fields['s.alone']===''&&d.fields['c[2].eo']===oldF['c[2].eo'],{a:d.fields['s.alone']});
 await p.reload();await sleep(800);await openFile(p,txt);
 ok('reopened, still not recorded (stable)',await v(p,'s.alone')==='',await v(p,'s.alone'));
 await p.evaluate(()=>document.querySelector('#aloneNote [data-alfix]').click());await sleep(150);c=await card(p,2);
 ok('"Use the supervised wording" updates only that card\'s wording',c.eo===W.std.sup.eo&&c.sd===W.std.sup.sd&&c.beh===W.std.sup.beh&&await v(p,'c[2].name')==='Alone / No interaction'&&await v(p,'c[1].eo')===oldF['c[1].eo'],c);
 await set(p,'s.alone','sup');await sleep(150);ok('choosing Supervised for the sessions to come clears "not recorded"',await v(p,'s.alone')==='sup'&&!/saved before EA-1 asked/.test(await p.evaluate(()=>document.querySelector('#aloneTxt').textContent)),await v(p,'s.alone'));
 /* a file saved just before this change (v21.43), with RRB alone */
 if(havePre){const q=await open('file://'+PRE);await q.evaluate(STUB);await q.evaluate(()=>{document.querySelector('#simScenario').value='rrb';document.querySelector('#simBtn').click();});await sleep(900);
  await q.evaluate(()=>{const s=document.querySelector('[name="rrb.mode"]');s.value='alone';s.dispatchEvent(new Event('change',{bubbles:true}));});
  const t43=await saveFile(q);await q.close();
  await p.reload();await sleep(800);await openFile(p,t43);
  const rr=await p.evaluate(()=>({m:document.querySelector('[name="s.alone"]').value,r:document.querySelector('[name="rrb.mode"]').value,flag:!document.querySelector('#rrbAloneFlag').hidden,ft:document.querySelector('#rrbAloneFlag').textContent,note:document.querySelector('#aloneNote').textContent}));
  ok('a v21.43 file with RRB alone keeps it, flags it, and flags the old card',rr.m===''&&rr.r==='alone'&&rr.flag&&/earlier version of EA-1, where Alone meant the therapist left and closed the door/.test(rr.ft)&&/Check card 3/.test(rr.note),rr);
  await set(p,'s.alone','sup');await sleep(200);
  ok('choosing Supervised then sets RRB back to no-interaction, and says so',await v(p,'rrb.mode')==='noint'&&/back to no-interaction/.test(await toasts(p)),await v(p,'rrb.mode'));}
 /* a file that holds true alone without the steps (edited by hand) */
 await p.reload();await sleep(800);
 const bad=JSON.parse(old);bad.fields['s.alone']='true';bad.fields['s.alonePolicy']=true;bad.fields['s.aloneStop']='';
 await openFile(p,JSON.stringify(bad));
 ok('a file holding true alone without the stop rule opens supervised, and says so',await v(p,'s.alone')==='sup'&&/held true alone without/.test(await toasts(p)),{v:await v(p,'s.alone'),t:await toasts(p)});
 /* a true alone file round trip */
 await p.reload();await sleep(800);await p.evaluate(STUB);
 await p.evaluate(()=>document.querySelector('#aloneOpen').click());await fill(p,RULE);await set(p,'s.alone','true');await set(p,'m.client','Round Trip');await sleep(150);
 txt=await saveFile(p);d=JSON.parse(txt);
 ok('Save data holds the arrangement and the three steps',d.fields['s.alone']==='true'&&d.fields['s.alonePolicy']===true&&d.fields['s.aloneStop']===RULE&&d.fields['s.aloneWatch']==='window'&&/District/.test(d.fields['s.alonePolicyNote']),d.fields['s.alone']);
 await p.reload();await sleep(800);await openFile(p,txt);
 st=await p.evaluate(()=>({m:document.querySelector('[name="s.alone"]').value,cls:document.querySelector('#aloneBox').classList.contains('is-true'),panel:!document.querySelector('#aloneTrue').hidden,stop:document.querySelector('[name="s.aloneStop"]').value}));
 ok('reopened: true alone, with its steps shown',st.m==='true'&&st.cls&&st.panel&&st.stop===RULE,st);
 await p.close();

 /* ---------------- 8. the walkthrough and the job aids ---------------- */
 p=await open();await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());await sleep(500);
 const wk=await p.evaluate(()=>{const S=window.SCENES.alone;S.go(0);const door=document.querySelector('#wk-alone .ea-door');const d0=door&&getComputedStyle(door).display!=='none';
   const adult0=getComputedStyle(document.querySelector('#wk-alone .adult-at')).display!=='none';
   S.go(7);const d7=door&&getComputedStyle(door).display!=='none',win7=getComputedStyle(document.querySelector('#wk-alone .eaw .wall1')).display!=='none',adult7=getComputedStyle(document.querySelector('#wk-alone .adult-at')).display!=='none';
   S.go(6);const board=document.querySelector('#wk-alone .eaw .board .bc').textContent;
   const sec=document.querySelector('#wk-alone').textContent,setupCard=document.querySelector('#wk-setup .card4 .pm-none').textContent;
   return {n:S.frames.length,d0,adult0,d7,win7,adult7,board,steps:[...document.querySelectorAll('#wk-alone ol.storysteps li')].map(l=>l.textContent),sec,setupCard,drill:window.eaWalk.drill.total,
     qs:window.eaWalk.drill.Q.map(q=>q.q)};});
 ok('the alone story: supervised first, with the door open and the therapist in the room',wk.n===11&&wk.d0&&wk.adult0&&/^Supervised, the form’s default/.test(wk.steps[0]),{n:wk.n,d0:wk.d0,a:wk.adult0,s:wk.steps[0]});
 ok('the story shows the student leaving freely and the adult stepping in at the criterion',/No one keeps the student in/.test(wk.steps[3])&&/left the room/.test(wk.steps[3])&&/the therapist steps in/.test(wk.steps[4]),wk.steps.slice(3,5));
 ok('true alone in the story: the three-step board, then the student alone behind the window',/True alone: only after three steps/.test(wk.board)&&/Policy check/.test(wk.board)&&wk.win7&&!wk.adult7&&!wk.d7&&/True alone, when it is set/.test(wk.steps[7]),{board:wk.board.slice(0,120),win7:wk.win7,adult7:wk.adult7});
 ok('the section text: supervised by default, never keep the student in, true alone only when set',/run supervised unless true alone is set on Setup & safety/.test(wk.sec)&&/Never keep the student in/.test(wk.sec)&&/True alone, only when it is set on Setup & safety/.test(wk.sec)&&!/watch without going in/.test(wk.sec),wk.sec.slice(0,200));
 ok('the setup section quotes the supervised card word for word',wk.setupCard.includes(W.std.sup.eo)&&wk.setupCard.includes(W.std.sup.beh),wk.setupCard.slice(0,200));
 ok('practice: one question more, on the student who walks out',wk.drill===19&&wk.qs.some(q=>/walks out through the open door/.test(q)),{n:wk.drill});
 const aids=async()=>p.evaluate(()=>{window.eaWalk.buildJobAids();const h=document.getElementById('wk-aids');const cols=[...h.querySelectorAll('table.jp-card th')].map(t=>t.textContent);const ai=cols.indexOf('Alone / No interaction');
   const cells=[...h.querySelectorAll('table.jp-card tbody tr')].map(tr=>tr.children[ai].textContent);const fix=[...h.querySelectorAll('table.jp-fix tr')].map(tr=>tr.textContent);
   const chk=[...h.querySelectorAll('table.jp-chk')][0].textContent;const steps=h.querySelectorAll('.jp-step').length;
   const setup=[...h.querySelectorAll('section')[1].querySelectorAll('.jp-cols ul')[0].children].map(li=>li.textContent);const r={cells,fix,chk,steps,setup,all:h.textContent};h.innerHTML='';return r;});
 let ja=await aids();
 ok('job aids, supervised: the alone column, the Set Up line and the checklist are the supervised ones',ja.cells[1]===W.std.sup.eo&&ja.cells[0]===W.std.sup.sd&&/An adult in sight and earshot the whole time/.test(ja.chk)&&ja.setup.some(t=>/^Alone or no-interaction: supervised\./.test(t)),{c:ja.cells.slice(0,2),s:ja.setup});
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());await p.evaluate(()=>document.querySelector('#aloneOpen').click());await fill(p,RULE);await set(p,'s.alone','true');await sleep(150);
 const steps0=ja.steps;ja=await aids();
 ok('job aids, true alone: the true alone column, the Set Up line and the true alone checklist, as many drawings',ja.cells[1]===W.std.true.eo&&ja.setup.some(t=>/^Alone or no-interaction: true alone, as set on Setup & safety/.test(t))&&/The stop-or-step-in rule followed as written/.test(ja.chk)&&ja.steps===steps0,{c:ja.cells[1],s:ja.setup});
 ok('the job aids never carry the case\'s own stop rule (they hold no student information)',!ja.all.includes(RULE.slice(0,40))&&!ja.fix.some(t=>/Alone/.test(t)),{f:ja.fix});
 await p.close();

 ok('no console or page error in any page',log.filter(x=>x.type==='pageerror'||x.type==='error').length===0,log.slice(0,6));
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
