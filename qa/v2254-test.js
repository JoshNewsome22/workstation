/* v22.54 the reinforcer assessment's clock during access (from the published procedures the practice holds): Form RA-1's
   session clock waits while the student has the item, the task materials stay away and a response made then is recorded
   apart; Clock during access can let the clock run instead; the summary says which; the Guide, the walkthrough and the
   references agree. Form SR-1's random-interval procedure samples every second, and names Bancroft and Bourret (2008).
   Form TD-1's random-ratio example is stated as a mean ratio. Simulated people only.
   usage: node qa/v2254-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const RA='Reinforcer_Assessment_Protocol.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});return p;};
  const txt=(p,id)=>p.evaluate(i=>(document.getElementById(i)||{}).textContent||'',id);
  const rows=(p,v)=>p.evaluate(v=>Object.fromEntries([...document.querySelectorAll('#ra-run-'+v+'-sum tr')].map(r=>[r.children[0].textContent,r.children[1].textContent])),v);
  let p=await open(RA);
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
  /* the setting on the three runners */
  const sel=await p.evaluate(()=>['so','co','pr'].map(v=>{const s=document.getElementById('ra-run-'+v+'-clock');return s?s.value+':'+[...s.options].map(o=>o.value).join('/'):null;}));
  ok('1 Clock during access on the single-operant, concurrent-operants and progressive-ratio runners, Pauses by default',sel.every(x=>x==='pause:pause/avail/run'),sel);
  ok('2 the old Minutes on the sheet switch is gone',await p.evaluate(()=>!document.getElementById('ra-run-so-mins')));
  /* a single-operant session: 3 s of access; the clock waits; a tap during access is recorded apart */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-so';const c=document.getElementById('ra-run-so-cond');c.value=[...c.options].find(o=>o.value!=='ctl').value;c.dispatchEvent(new Event('change'));});
  await sleep(300);
  await p.evaluate(()=>{const a=document.getElementById('ra-run-so-acc');a.value='3';a.dispatchEvent(new Event('input'));a.dispatchEvent(new Event('change'));document.getElementById('ra-run-so-start').click();});
  await sleep(1300);
  const t0=await txt(p,'ra-run-so-left');
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(300);
  const a1={left:await txt(p,'ra-run-so-left'),el:await txt(p,'ra-run-so-el'),cue:await txt(p,'ra-run-so-cuet'),n:await txt(p,'ra-run-so-n')};
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(1200);
  const a2={left:await txt(p,'ra-run-so-left'),el:await txt(p,'ra-run-so-el'),n:await txt(p,'ra-run-so-n'),msg:await txt(p,'ra-run-so-msg')};
  ok('3 during the access the clock waits: Time left holds, the elapsed line says so, and the cue says the materials stay out of reach',a1.left===a2.left&&/\(clock waiting\)/.test(a1.el)&&/\(clock waiting\)/.test(a2.el)&&/task materials stay out of reach; the clock waits/.test(a1.cue),{t0,a1,a2});
  ok('4 a response during the access is recorded apart, not counted',a1.n==='1'&&a2.n==='1'&&/During access: recorded apart, not counted \(1\)/.test(a2.msg),a2);
  await sleep(2600);
  const a3={left:await txt(p,'ra-run-so-left'),el:await txt(p,'ra-run-so-el')};
  await sleep(1100);
  const a4={left:await txt(p,'ra-run-so-left')};
  ok('5 after the access the clock runs again',!/clock waiting/.test(a3.el)&&a3.left!==a4.left,{a3,a4});
  await p.evaluate(()=>document.getElementById('ra-run-so-end').click());await sleep(400);
  const r1=await rows(p,'so');
  ok('6 the summary: time run with the clock waiting during 0:03 of access, minutes the response was available, the response during access recorded apart',/the clock waited during 0:03 of access, so 0:0\d with the response available/.test(r1['Time run']||'')&&/\(minutes the response was available\)/.test(r1['Minutes on the sheet']||'')&&/^1 \(materials away: recorded apart, not counted\)$/.test(r1['Responses during access']||''),r1);
  await p.evaluate(()=>document.getElementById('ra-run-so-discard').click());await sleep(300);
  /* the clock set to run: a tap during access is counted, not toward the schedule */
  await p.evaluate(()=>{document.getElementById('ra-run-so-clock').value='run';document.getElementById('ra-run-so-start').click();});await sleep(600);
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(200);
  const b1={left:await txt(p,'ra-run-so-left')};
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(1200);
  const b2={left:await txt(p,'ra-run-so-left'),n:await txt(p,'ra-run-so-n'),el:await txt(p,'ra-run-so-el')};
  await p.evaluate(()=>document.getElementById('ra-run-so-end').click());await sleep(400);
  const r2=await rows(p,'so');
  ok('7 with the clock set to run it counts the access, and a response during access is counted (not toward the schedule), as before',b1.left!==b2.left&&b2.n==='2'&&!/clock waiting/.test(b2.el)&&/of access counted as time run/.test(r2['Time run']||'')&&/\(minutes run\)/.test(r2['Minutes on the sheet']||'')&&/^1 \(counted, not toward the schedule\)$/.test(r2['Responses during access']||''),{b1,b2,r2});
  await p.evaluate(()=>document.getElementById('ra-run-so-discard').click());
  /* the progressive-ratio runner: the cap line waits too */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-pr';const c=document.getElementById('ra-run-pr-cond');c.value=[...c.options].find(o=>o.value!=='ctl').value;c.dispatchEvent(new Event('change'));});
  await sleep(300);
  await p.evaluate(()=>{const a=document.getElementById('ra-run-pr-acc');a.value='3';a.dispatchEvent(new Event('input'));a.dispatchEvent(new Event('change'));document.getElementById('ra-run-pr-start').click();});
  await sleep(500);
  await p.evaluate(()=>document.getElementById('ra-run-pr-resp').click());await sleep(1300);
  const c1={el:await txt(p,'ra-run-pr-el'),cue:await txt(p,'ra-run-pr-cuet'),cap:await txt(p,'ra-run-pr-cap')};
  ok('8 progressive ratio: during access the stop interval and the cap wait, and the cue says the materials stay out of reach',/\(clock waiting\)/.test(c1.el)&&/waits during access/.test(c1.cap)&&/task materials stay out of reach; the clock waits/.test(c1.cue),c1);
  await p.evaluate(()=>document.getElementById('ra-run-pr-end').click());await sleep(300);
  await p.evaluate(()=>document.getElementById('ra-run-pr-discard').click());
  /* the Guide, the walkthrough and the references */
  const g=await p.evaluate(()=>{const t=document.body.innerHTML;return {guide:/Glover et al\., 2008, took access time out of the session time; DeLeon et al\., 2014, stopped the clock/.test(t),cap:/Trosclair-Lasserre et al\., 2008, capped response time/.test(t),
    refs:/Glover, A\. C\., Roane, H\. S\., Kadey, H\. J\., &amp; Grow, L\. L\. \(2008\)/.test(t)&&/DeLeon, I\. G\., Chase, J\. A\., Frank-Crawford, M\. A\.,[^<]*\(2014\)/.test(t),
    old:/Minutes on the sheet decides|session clock keeps running/.test(t),walk:/Clock during access','Pauses \(minutes the response was available\)/.test(t)};});
  ok('9 the Guide gives the convention with its sources, the references list Glover et al. (2008) and DeLeon et al. (2014), and the walkthrough no longer says the clock keeps running',g.guide&&g.cap&&g.refs&&!g.old&&g.walk,g);
  const rg=await p.evaluate(()=>{const d=document.getElementById('raRespGuide');if(!d)return null;const li=[...d.querySelectorAll('li')].map(x=>x.textContent);return {n:li.length,open:d.open,print:getComputedStyle(d).display,first:li[0],ctl:li.some(x=>/Run a control session first/.test(x)),work:li.some(x=>/Glover et al\., 2008; Jerome &amp; Sturmey, 2008|Glover et al\., 2008; Jerome & Sturmey, 2008/.test(x)&&/Penrod et al\., 2008/.test(x)),ref:/Jerome, J\., &amp; Sturmey, P\. \(2008\)/.test(document.body.innerHTML),cite:/a harder response lowers rates and brings ratio strain sooner \(Penrod et al\., 2008\)/.test(document.body.innerHTML)};});
  ok('10 Setup: How to choose the response, eight points from the studies (easy and countable first, a unit of plan work when that is the question, checked in control), the cite line and Jerome and Sturmey (2008) in the references',!!rg&&rg.n===8&&/^Easy, quick and countable\./.test(rg.first)&&rg.ctl&&rg.work&&rg.ref&&rg.cite,rg);
  await p.close();
  /* SR-1 and TD-1 */
  const sr=await (await ctx.request.get(L.BASE+'/NBH-Workstation/SR-1_Schedules-of-Reinforcement_v2026-10.html')).text();
  const fam=await (async()=>{const q=await ctx.newPage();await q.goto(L.BASE+'/NBH-Workstation/SR-1_Schedules-of-Reinforcement_v2026-10.html');await sleep(1000);
    const r=await q.evaluate(()=>{const b=document.querySelector('#famSeg button[data-fam="basic"]'),cs=getComputedStyle(b);return {color:cs.color,bg:cs.backgroundColor,pressed:b.getAttribute('aria-pressed')};});await q.close();return r;})();
  ok('11a SR-1: a family button not chosen is readable (dark text on a light segment)',fam.pressed==='false'&&fam.color==='rgb(24, 46, 67)'&&fam.bg==='rgb(244, 247, 248)',fam);
  ok('11 SR-1 draws a random interval every second, so the probability stays at or under 1, and cites Bancroft and Bourret (2008)',/each second, with probability '\+\(1\/T\)/.test(sr)&&!/10\/T/.test(sr)&&/Bancroft, S\. L\., &amp; Bourret, J\. C\. \(2008\)/.test(sr)&&/Bancroft &amp; Bourret, 2008, make the same point/.test(sr));
  const td=await (await ctx.request.get(L.BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html')).text();
  ok('12 TD-1 states the random-ratio example as a mean ratio with its probability',/RR 4 \(p = \.25\): a spinner or a random-number app decides each response/.test(td)&&!/RR 0\.25/.test(td));
  /* the shell: Close case on a case with no student named and nothing typed */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push(e.message));await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await sh.evaluate(()=>{window.__asked=[];wsUI.confirm=async(t,o)=>{window.__asked.push({t:String(t),ok:o&&o.ok});return true;};window.__saved=0;const sc=window.saveCase;window.saveCase=async function(){window.__saved++;return sc.apply(this,arguments);};});
  await sh.evaluate(()=>openForm('RS-1'));await sh.waitForFunction(()=>!!state.status['RS-1']&&!!state.frames['RS-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
  const before=await sh.evaluate(()=>({filled:(state.status['RS-1']||{}).filled||0,edited:!!(state.status['RS-1']||{}).edited,typed:Object.values(packet()).some(v=>String(v||'').trim())}));
  const dlP=sh.waitForEvent('download',{timeout:2500}).catch(()=>null);
  await sh.evaluate(()=>document.getElementById('closeCase').click());const dl=await dlP;await sleep(800);
  const after=await sh.evaluate(()=>({asked:window.__asked.slice(-1)[0],saved:window.__saved,frames:Object.keys(state.frames).length,status:Object.keys(state.status).length}));
  ok('14 the shell: a blank form reads as work (its defaults), yet with no student named and nothing typed, Close case asks to close without saving, saves nothing and clears the form',before.filled>3&&!before.edited&&!before.typed&&!!after.asked&&/^Close this case\? No student has been named and nothing has been typed/.test(after.asked.t)&&after.asked.ok==='Close without saving'&&after.saved===0&&!dl&&after.frames===0&&after.status===0,{before,after,dl:!!dl});
  await sh.evaluate(()=>{document.getElementById('pClient').value='Mateo Rivera (simulated)';document.getElementById('pClient').dispatchEvent(new Event('input'));});
  await sh.evaluate(()=>openForm('RS-1'));await sh.waitForFunction(()=>!!state.status['RS-1']&&!!state.frames['RS-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
  await sh.evaluate(()=>{window.__asked=[];wsUI.confirm=async(t,o)=>{window.__asked.push({t:String(t),ok:o&&o.ok});return false;};});
  await sh.evaluate(()=>document.getElementById('closeCase').click());await sleep(800);
  const named=await sh.evaluate(()=>window.__asked.slice(-1)[0]);
  ok('15 with a student named, Close case still offers Save and close',!!named&&/^Close this case\? It is saved first/.test(named.t)&&/^Save and close/.test(named.ok),named);
  await sh.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('16 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
