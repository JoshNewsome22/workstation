/* v24.21 the EA-1 to TD-1 joint and TD-1's plan consistency (the independent review): EA-1's function flows once decided, with a
   provenance line; TD-1 shows it under the function and in the summary statement; the plan names one function or a banner says
   where it differs; the Responding sheet's first question follows Setup; one integrity list (the step list plus the safety items)
   with the extinction step's chosen clause; the thinning decision reads its own window's integrity; the monitoring log reads its
   entries; the benchmark names its baseline and seeds the criterion. usage: node qa/td121-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const EA='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^EA-1_/.test(f)),TD='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^TD-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950}});const errs=[];
 const page=async url=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url.slice(-30)+': '+String(e)));await p.goto(BASE+url);await sleep(1500);await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});return p;};
 const setv=(p,nm,v)=>p.evaluate(([nm,v])=>{const e=document.querySelector('[name="'+nm+'"]');if(e.type==='checkbox')e.checked=!!v;else e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[nm,v]);
 const view=(p,v)=>p.evaluate(v=>{document.querySelector('#viewSeg [data-view="'+v+'"]').click();},v);
 /* ---------------- EA-1: the function flows once decided, with its provenance (R-002) ---------------- */
 const e=await page(EA);await e.evaluate(()=>{document.getElementById('simScenario').value='escape';document.getElementById('simBtn').click();});await sleep(1800);
 const ev=()=>e.evaluate(()=>{const v=__nbhFactsOut().evidence;return {fn:v.fn,key:v.fnKey,st:v.strength,prov:v.provenance,dec:v.decided,stmt:v.statement};});
 const e1=await ev();
 ok('the worked example hands on escape as Strong (Moderate when the counts drawn carry a trend flag) with a provenance line: the Roane rule result, IOA by condition, the second reading and the decision',e1.key==='escape'&&/^(Strong|Moderate)$/.test(e1.st)&&e1.dec===true&&/^Roane rule met: Demand u − l = 4 of 4 · IOA on 25% of sessions \(Demand 25%\) · second reading: not done · Decision ticked \(Function identified\)$/.test(e1.prov),e1);
 await setv(e,'d.fn',false);await setv(e,'d.func','');const e2=await ev();
 await setv(e,'d.fnkey','attention');const e3=await ev();
 await setv(e,'d.fnkey','');await setv(e,'d.stop',true);const e4=await ev();
 await setv(e,'d.stop',false);await setv(e,'d.func','Escape from demands (written by hand)');const e5=await ev();
 ok('with the Decision unticked nothing flows, even with the dropdown set; the statement says the Decision is not yet ticked; Analysis stopped for safety flows as a hypothesis; a function written in words flows',
   e2.key===''&&e2.fn===''&&e2.st===''&&/Not yet decided on EA-1/.test(e2.stmt)&&e3.key===''&&e3.st===''&&e4.key==='escape'&&e4.st==='Hypothesis'&&/analysis stopped for safety: a hypothesis/.test(e4.prov)&&e5.key==='escape'&&e5.fn==='Escape from demands (written by hand)'&&!/Not yet decided/.test(e5.stmt),{e2,e3,e4,e5});
 await e.close();
 /* ---------------- TD-1 ---------------- */
 const p=await page(TD);
 const fresh=await p.evaluate(()=>({prov:document.getElementById('tdFnProv').textContent,warn:document.getElementById('tdFnWarnSetup').hidden}));
 await p.evaluate(()=>{document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(2000);
 const sim=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();return {prov:document.getElementById('tdFnProv').textContent,stmt:document.querySelector('.td-stmt').textContent,warn:document.getElementById('tdFnWarnFinal').hidden,rb0:document.querySelector('[name="rb.0"]').value};});
 ok('a fresh form shows nothing under the function; the worked example shows what stands behind its function on Setup and in the summary statement, and the plan names one function',
   fresh.prov===''&&fresh.warn&&/^EA-1: Strong · Differentiated: Demand meets the rule/.test(sim.prov)&&/is maintained by escape from the task or demand \(social negative reinforcement\) \(EA-1, Multielement, 4 series; Strong: Roane rule met: Demand u − l = 4 of 4 · IOA on 25%/.test(sim.stmt)&&sim.warn&&sim.rb0==='escape',{fresh,sim});
 /* the consumer keeps EA-1's provenance with the function, and a typed function drops it */
 const cons=await p.evaluate(()=>{const r=__nbhFactsIn({evidence:{'EA-1':{fn:'Escape',fnKey:'escape',strength:'Moderate',statement:'Differentiated: Demand meets the rule (u − l = 3 of n = 4).',provenance:'Roane rule met: Demand u − l = 3 of 4 · IOA on 25% of sessions (Demand 0% (under the 20% plan)) · second reading: disagreed · Decision ticked (Function identified)',method:'Functional analysis',n:16,dates:'10/9/2026–10/24/2026'}}});return {prov:document.querySelector('[name="m.fnprov"]').value,shown:document.getElementById('tdFnProv').textContent,hasCase:!!window.nbhCase};});
 ok('when the case hands the function on, TD-1 keeps EA-1\'s strength, statement and provenance with it (the function matching)',!cons.hasCase||(/^Moderate · Differentiated: Demand meets the rule \(u − l = 3 of n = 4\)\. · Roane rule met: Demand u − l = 3 of 4 · IOA on 25%/.test(cons.prov)&&/^EA-1: Moderate/.test(cons.shown)),cons);
 /* ---- the plan names one function (R-003) ---- */
 await view(p,'setup');await sleep(200);await p.focus('[name="m.fn"]');await p.keyboard.press('ArrowDown');await sleep(300);   /* a real change (a key on the select): typed on this form */
 const mis=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();const f=document.getElementById('tdFnWarnFinal');return {rb0:document.querySelector('[name="rb.0"]').value,hidden:f.hidden,text:f.textContent,setup:document.getElementById('tdFnWarnSetup').hidden,respond:document.getElementById('tdFnWarnRespond').hidden,prov:document.getElementById('tdFnProv').textContent,fnprov:document.querySelector('[name="m.fnprov"]').value};});
 ok('changing Setup to attention makes the Responding sheet\'s first question follow, and a banner on Setup, Responding and the Final plan says the extinction card and the "On the target behavior" line still read as escape; the EA-1 provenance is dropped for a typed function',
   mis.rb0==='attention'&&!mis.hidden&&!mis.setup&&!mis.respond&&/Setup says attention, but the Responding sheet's "On the target behavior" line reads as escape; the Extinction card's form of extinction reads as escape/.test(mis.text)&&mis.fnprov===''&&/Chosen on this form/.test(mis.prov),mis);
 await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>getComputedStyle(document.getElementById('tdFnWarnFinal')).display);await p.emulateMedia({media:'screen'});
 await view(p,'setup');await sleep(200);await p.focus('[name="m.fn"]');await p.keyboard.press('ArrowUp');await sleep(300);
 const back=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();return {hidden:document.getElementById('tdFnWarnFinal').hidden,rb0:document.querySelector('[name="rb.0"]').value};});
 ok('the banner prints, and goes away when Setup says escape again',pr!=='none'&&back.hidden&&back.rb0==='escape',{pr,back});
 /* ---- one integrity list (R-024, E-13) ---- */
 const fid=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();const steps=window.__td46Steps();document.querySelector('#viewSeg [data-view="plan"]').click();const rows=[...document.querySelectorAll('#fidTbl tbody tr')].map(r=>[...r.children].map(td=>td.textContent.trim()));
   const safety=rows.filter(r=>r[1]==='Safety'),listed=rows.filter(r=>r[1]!=='Safety');const ext=steps.find(x=>/^Match the form to the function/.test(x.d));const extAll=[...document.querySelectorAll('#finalBody .plan-step')].map(x=>x.textContent).find(t=>/Match the form to the function/.test(t));
   return {n:rows.length,listed:listed.length,steps:steps.length,nums:listed.map(r=>r[0]).slice(0,5),stepNums:steps.map(x=>x.one?x.ns.join('–'):String(x.n)).slice(0,5),safety:safety.map(r=>r[0]).slice(0,2),ext:ext&&ext.d,extAll,so:document.querySelector('[name="mo[0].so"]').placeholder,head:document.querySelector('#fidHead + p').textContent,count:document.getElementById('tdFidCount').textContent};});
 ok('the integrity checklist is the Final plan\'s step list (numbered as there) plus the safety items (S1, S2 …), the Steps observed placeholder is their count, and the extinction step carries only the escape clause',
   fid.listed===fid.steps&&fid.steps>=10&&JSON.stringify(fid.nums)===JSON.stringify(fid.stepNums)&&fid.safety[0]==='S1'&&fid.so===String(fid.n)&&/Match the form to the function \(escape\): continue the task through the prompt sequence with guided compliance and do not remove the demand\./.test(fid.extAll||'')&&!/attention →/.test(fid.extAll||'')&&/The Final plan's step list/.test(fid.head)&&new RegExp('^'+fid.n+' items to score').test(fid.count),fid);
 /* ---- the decision box: the baseline named, the window's integrity, the entries read (R-023, R-111, R-112, E-22) ---- */
 await view(p,'monitor');await sleep(300);
 const box=()=>p.evaluate(()=>({v:document.getElementById('monVerdict').textContent,crit:document.querySelector('[name="mon.crit"]').value,ph:document.querySelector('[name="mon.crit"]').placeholder,rows:(()=>{const r=[];for(let i=0;i<40;i++){const t=document.querySelector('[name="mo['+i+'].t"]');if(!t||t.value==='')break;r.push({i,p:document.querySelector('[name="mo['+i+'].p"]').value,t:t.value,sc:document.querySelector('[name="mo['+i+'].sc"]').value,so:document.querySelector('[name="mo['+i+'].so"]').value,lv:document.querySelector('[name="mo['+i+'].lv"]').value});}return r;})()}));
 /* the window read deterministically: the last three level-3 sessions at criterion, 90% independent, 8 of 8 steps */
 {const r0=await box();for(const r of r0.rows.slice(-3)){await setv(p,'mo['+r.i+'].t','0.05');await setv(p,'mo['+r.i+'].ind','90');await setv(p,'mo['+r.i+'].sc','8');await setv(p,'mo['+r.i+'].so','8');}}await sleep(300);
 const b0=await box();const last=b0.rows.slice(-3);
 ok('the worked example advances at the 90% benchmark, naming the window\'s integrity, and the reduction is read against the logged baseline, named',/^DecisionAdvance one thinning level: target ≤ 0\.1[0-9]\/min and alternative ≥ 80% independent for the last 3 sessions at level 3; integrity 100% in the 3 observed\./.test(b0.v)&&/reduction from baseline [\d.]+\/min, the logged baseline \(the mean of 5 sessions\)/.test(b0.v)&&b0.crit===String(+(1.2*0.10).toFixed(2)),{v:b0.v.slice(0,400),crit:b0.crit});
 /* integrity below criterion inside the window: hold */
 const obs=last.find(r=>r.so!=='')||last[last.length-1];await setv(p,'mo['+obs.i+'].sc','5');await setv(p,'mo['+obs.i+'].so','8');await sleep(250);const b1=await box();
 await setv(p,'mo['+obs.i+'].sc','8');await sleep(250);await setv(p,'mo['+obs.i+'].err',true);await sleep(250);const b2=await box();await setv(p,'mo['+obs.i+'].err',false);
 ok('integrity below the criterion in a session of the decision window turns Advance into Hold: retrain first, and so does a reinforcement error in the window',/^DecisionHold: retrain first\. The target is at or below [\d.]+\/min for the last 3 sessions at level 3, but integrity was below 90% in 1 of the 3 observed: thin only on effects obtained at criterion integrity/.test(b1.v)&&/^DecisionHold: retrain first\..*1 of them had a reinforcement error/.test(b2.v),{b1:b1.v.slice(0,300),b2:b2.v.slice(0,300)});
 /* the entries read */
 await setv(p,'mo['+obs.i+'].sc','9');await setv(p,'mo['+obs.i+'].so','8');await sleep(250);
 const bad1=await p.evaluate(i=>({sc:document.querySelector('[name="mo['+i+'].sc"]').getAttribute('aria-invalid'),so:document.querySelector('[name="mo['+i+'].so"]').getAttribute('aria-invalid'),v:document.getElementById('monVerdict').textContent}),obs.i);
 await setv(p,'mo['+obs.i+'].sc','8');await setv(p,'mo[0].t','-1');await sleep(250);
 const bad2=await p.evaluate(()=>({t:document.querySelector('[name="mo[0].t"]').getAttribute('aria-invalid'),v:document.getElementById('monVerdict').textContent,nbl:[...document.querySelectorAll('#monBody tr')].filter(tr=>/^BL/.test(tr.querySelector('[name$=".p"]').value)).length}));
 await setv(p,'mo[0].t',b0.rows[0].t);await sleep(250);
 ok('steps correct above steps observed marks both cells and the session is not scored for integrity (Advance returns); a negative rate marks its cell and leaves the baseline',bad1.sc==='true'&&bad1.so==='true'&&/^DecisionAdvance/.test(bad1.v)&&!/112\.5/.test(bad1.v)&&bad2.t==='true'&&/the logged baseline \(the mean of 4 sessions\)/.test(bad2.v),{bad1:bad1.v.slice(0,200),bad2:bad2.v.slice(0,300)});
 /* no baseline phase logged: the Setup rate, named; no criterion: the placeholder seeded */
 const blIdx=b0.rows.filter(r=>/^BL/i.test(r.p)).map(r=>r.i);for(const i of blIdx)await setv(p,'mo['+i+'].p','Tx L0');await setv(p,'mon.crit','');await sleep(300);const b3=await box();
 for(const i of blIdx)await setv(p,'mo['+i+'].p','BL');await setv(p,'mon.crit',b0.crit);
 ok('with no baseline phase logged the benchmark is read against the Setup rate from Form EA-1, named; with no criterion the box names the benchmark and the placeholder carries it',/from baseline 1\.2\/min, the Setup rate from Form EA-1; no baseline phase is logged yet/.test(b3.v)&&/Criterion not set: the 90% benchmark from the Setup rate from Form EA-1; no baseline phase is logged yet is 0\.12\/min/.test(b3.v)&&b3.ph==='0.12'&&/Enter the criterion/.test(b3.v),{v:b3.v.slice(0,400),ph:b3.ph});
 /* a reversal whose second baseline does not return */
 const bl2=b0.rows.filter((r,k)=>/^BL/i.test(r.p)&&k>5).map(r=>r.i);for(const i of bl2)await setv(p,'mo['+i+'].t','0.1');await sleep(300);const b4=await box();for(const [k,i] of bl2.entries())await setv(p,'mo['+i+'].t',b0.rows.find(r=>r.i===i).t);
 ok('a second baseline that stays low is noted as a reversal that has not shown control',bl2.length>=2&&/The second baseline \(BL, mean 0\.10\/min over \d sessions\) did not return toward the first/.test(b4.v),{bl2,v:b4.v.slice(0,500)});
 /* the Setup rate */
 await setv(p,'m.rate','-2');const rate=await p.evaluate(()=>({inv:document.querySelector('[name="m.rate"]').getAttribute('aria-invalid'),irt:document.getElementById('irtOut').textContent}));await setv(p,'m.rate','1.2');
 ok('a negative Setup rate is marked and gives no IRT',rate.inv==='true'&&rate.irt==='—',rate);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
