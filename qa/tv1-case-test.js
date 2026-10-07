/* v21.52 Form TV-1 drafted from the whole case, through the shell: the simulators of TB-1, FS-1, GB-1 and PA-1 (as before)
   and of DM-1 (the profile), TD-1 (the plan) and CR-1 (the crisis plan) give the shell its facts, and TV-1's Draft from the
   case writes every segment from them: only what no form holds is left in [brackets]; the cards follow, with the >> marks.
   usage: node qa/tv1-case-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:1000}});wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(800);
  const open=async id=>{await page.evaluate(id=>openForm(id),id);const fr=await page.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const sim=async id=>{const f=await open(id);await f.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(1000);return f;};
  for(const id of ['TB-1','FS-1','GB-1','PA-1','DM-1','TD-1','CR-1'])await sim(id);
  await sleep(8000);
  const facts=await page.evaluate(()=>state.facts);
  ok('the shell reads the profile (DM-1), the plan (TD-1) and the crisis plan (CR-1) with the four sources before',!!(facts&&facts.profile&&facts.plan&&facts.crisis&&facts.behaviors&&facts.fn&&facts.menu&&facts.src.profile==='DM-1'&&facts.src.plan==='TD-1'&&facts.src.crisis==='CR-1'),facts&&{src:facts.src,plan:facts.plan,profile:facts.profile,crisis:facts.crisis});
  const bar=await page.evaluate(()=>document.getElementById('factsTxt').textContent);
  ok('the case bar names them',/Profile/.test(bar)&&/Plan:/.test(bar)&&/Crisis plan: 5 stages/.test(bar),bar);
  const tv=await open('TV-1');await sleep(1500);
  const d=await tv.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('draftBtn').click();return new Promise(r=>setTimeout(()=>r({line:document.getElementById('caseLine').textContent,
    rows:S.rows.map(r=>({seg:r.seg,title:r.title,say:r.say,body:r.body,lay:r.lay,cont:r.cont,todo:todo(r.say)||todo(r.title)||todo(r.body)})),cues:(S.rows.map(r=>r.say).join(' ').match(/(^|\s)>>(?=\s|$)/g)||[]).length,steps:paras().reduce((a,p)=>a+paraSteps(p),0)}),900));});
  fs.writeFileSync(__dirname+'/out/tv1/case-draft.json',JSON.stringify(d,null,1));
  const row=t=>d.rows.find(r=>r.title===t)||{};const F=facts;
  ok('Setup names the profile, the plan and the crisis plan in the case',/profile \(Form DM-1\)/.test(d.line)&&/plan \(Form TD-1\)/.test(d.line)&&/crisis plan \(Form CR-1\)/.test(d.line),d.line);
  ok('Strengths: the profile\'s strengths and interests, said and on the card, nothing left to write',!row('Strengths').todo&&/strengths: warm, funny/i.test(row('Strengths').say)&&/enjoys tablet videos/i.test(row('Strengths').say)&&/• Warm/.test(row('Strengths').body),row('Strengths'));
  ok('Communication: how the student communicates and signals, what helps and what to avoid',!row('Communication').todo&&/Expressive communication: 2-3 word phrases/.test(row('Communication').say)&&/What to avoid:/.test(row('Communication').say)&&/^Says: /.test(row('Communication').body),row('Communication'));
  ok('Proactive: the plan\'s antecedent strategies',!row('Proactive').todo&&row('Proactive').say.includes(F.plan.ant[0].replace(/[.]+$/,''))&&row('Proactive').body.split('\n').length>=2,row('Proactive'));
  ok('Reinforcement: the replacement behavior and how it is reinforced, from the plan',!row('Works For').todo&&row('Works For').say.includes(F.plan.rep),row('Works For'));
  ok('Response: the steps for the precursor, the behavior, afterwards and what staff do not do',!row('Steps').todo&&row('Steps').say.includes(F.plan.respond.prec.replace(/[.]+$/,''))&&/What staff do not do:/.test(row('Steps').say)&&/^1\. First sign: /.test(row('Steps').body),row('Steps'));
  ok('Safety: the crisis plan\'s five stages, said in order and numbered on the card',/crisis plan takes over/.test(row('Safety').say)&&row('Safety').body.split('\n').length===5&&/^1\. Prevention/.test(row('Safety').body)&&row('Safety').lay==='full',row('Safety'));
  ok('Remember: the takeaways from the plan',!row('Remember').todo&&/things matter most/.test(row('Remember').say),row('Remember'));
  const left=d.rows.filter(r=>r.todo).map(r=>r.title);
  ok('only what no form holds is left to write (the presenter, typed on Setup, and the terms)',left.join()==='Presenter,Terms',left);
  ok('the draft puts in the next-card marks: one for each step after a paragraph\'s first',d.cues>0&&d.cues===d.steps,{cues:d.cues,steps:d.steps});
  const bad=log.filter(l=>l.type==='pageerror'||(l.type==='error'&&!/favicon|ERR_FILE/.test(l.text)));
  ok('no errors',!bad.length,bad);
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
