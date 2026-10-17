/* v22.42 restraint in the staff handouts (review F378, F379, F388). EB-1 calls for help at the first sign, never at the crisis
   plan's peak, and does not carry the crisis team who would hold; it names a line that asks limited-contact staff to put hands
   on the student, and the plan words a bus attendant would not know. QS-1 builds its tier table in one order of events with
   an explicit handover to the crisis plan, and never prints a restraint step on the handout every adult gets.
   Simulated people only. usage: node qa/v2242-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const CRISIS={precursor:'Vocal protest rising in volume (simulated)',dbeh:'Aggression toward staff (simulated)',stages:[
  {s:'Prevention (before any sign)',do:'Timer and break card in view at the start of every work block'},
  {s:'Escalation',do:'Move back to 2 m and say nothing'},
  {s:'Peak / imminent risk',do:'Restraint only if a closed fist is raised toward the head or face',who:'Two CPI-trained adults'},
  {s:'Recovery',do:'Release, offer water'}]};
const PLAN={prec:'Pushes the worksheet away (simulated)',beh:'Hitting: strikes another person (simulated)',
  respond:{prec:'Offer the break card once (simulated)',target:'Keep the task in place; prompt the break card (simulated)',crisis:'Trigger: 2 hits within 10 s → second adult, clear peers, district crisis procedure',after:'Return to the task at the step left (simulated)'}};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  /* ---- EB-1 ---- */
  const e=await ctx.newPage();e.on('pageerror',x=>errs.push('EB-1: '+x.message));await e.goto(L.BASE+'/NBH-Workstation/EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html');await sleep(900);
  const a=await e.evaluate(({plan,crisis})=>{__nbhFactsIn({plan,crisis});review();
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {when:v('e.callwhen'),who:v('e.callwho'),mark:document.getElementById('p_callwhen').textContent,chk:document.getElementById('ebChecks').textContent};},{plan:PLAN,crisis:CRISIS});
  ok('1 F378: Call when is the first sign, not the crisis plan’s peak; marked to rewrite',a.when==='As soon as you see pushes the worksheet away (simulated), or if anyone is at risk of being hurt.'&&!/Peak|closed fist|\.,/.test(a.when)&&/from the plan/.test(a.mark),a);
  ok('2 F378: the crisis team who would hold is not carried, and the brief asks whom this setting calls and how',a.who===''&&/Call who and How/.test(a.chk),a);
  const b=await e.evaluate(()=>{const put=(sel,t)=>{let el=[...document.querySelectorAll(sel)].find(x=>!x.value.trim());if(!el){add(sel.match(/#(\w+)Wrap/)[1]);el=[...document.querySelectorAll(sel)].find(x=>!x.value.trim());}el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));};
    put('#respWrap [name]','Do not hold him; move the other students away (simulated)');review();const c0=document.getElementById('ebChecks').textContent;
    put('#respWrap [name]','Block the hit, then physically guide him back to his seat (simulated)');put('#respWrap [name]','Use planned ignoring and redirect to the FCR (simulated)');review();
    const c1=document.getElementById('ebChecks').textContent,j=document.getElementById('jargon').textContent;
    const btn=document.getElementById('ebAfterLine');if(btn)btn.click();return {c0,c1,j,after:document.querySelector('[name="e.after"]').value};});
  ok('3 F379: a line that tells staff not to hold passes',!/Hands on the student/.test(b.c0),b.c0);
  ok('4 F379: a line asking limited-contact staff to block or guide is named, with the rule',/Hands on the student/.test(b.c1)&&/Block the hit/.test(b.c1)&&/trained and certified/.test(b.c1),b.c1);
  ok('5 F379: the plan words a bus attendant would not know are named',/planned ignoring/.test(b.j)&&/FCR/.test(b.j)&&/redirect/.test(b.j),b.j);
  ok('6 After It Is Over offers the line that the school office hears of a hold or an injury the same day',/tell the school office the same day/.test(b.after),b.after);
  /* ---- QS-1 ---- */
  const q=await ctx.newPage();q.on('pageerror',x=>errs.push('QS-1: '+x.message));await q.goto(L.BASE+'/NBH-Workstation/QS-1_Staff-Quick-Start_v2026-10.html');await sleep(900);
  const t=await q.evaluate(({plan,crisis})=>{__nbhFactsIn({plan,crisis});return S.tiers.filter(r=>r.name||r.see||r.do).map(r=>({name:r.name,see:r.see,do:r.do}));},{plan:PLAN,crisis:CRISIS});
  const all=JSON.stringify(t);
  ok('7 F388: the tiers in one order: the earliest sign and its response, the behavior and its response, the handover, the recovery',t.length===4&&/Pushes the worksheet/.test(t[0].see)&&/break card once/.test(t[0].do)&&/Hitting/.test(t[1].see)&&/Keep the task/.test(t[1].do)&&/crisis plan governs/.test(t[2].name)&&/Recovery/.test(t[3].name)&&/Return to the task/.test(t[3].do),t);
  ok('8 F388: the plan’s own trigger is the handover, and only trained, certified staff step in from there',/2 hits within 10 s/.test(t[2].see)&&/Form CR-1\) governs/.test(t[2].do)&&/trained and certified/.test(t[2].do),t[2]);
  ok('9 F388: no restraint step and no crisis team on the handout every adult gets; the behavior is not paired with the prevention stage',!/Restraint only|CPI-trained|closed fist|Timer and break card/.test(all),all);
  const q2=await ctx.newPage();q2.on('pageerror',x=>errs.push('QS-1b: '+x.message));await q2.goto(L.BASE+'/NBH-Workstation/QS-1_Staff-Quick-Start_v2026-10.html');await sleep(900);
  const t2=await q2.evaluate(({crisis})=>{__nbhFactsIn({crisis});return S.tiers.filter(r=>r.name||r.see||r.do).map(r=>r.name+' | '+r.do);},{crisis:CRISIS});
  ok('10 F388: with the crisis plan alone, its restraint step reads "Crisis plan, Form CR-1: trained staff only"',t2.some(x=>/^Peak/.test(x)&&/Crisis plan, Form CR-1: trained staff only/.test(x))&&!t2.some(x=>/Restraint only|CPI/.test(x)),t2);
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('11 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
