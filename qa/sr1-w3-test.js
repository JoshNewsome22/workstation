/* Form SR-1, review Wave 3 part 1: an earning design pays the response that earns, never the behavior being reduced (F268); for a
   social function the reinforcer is the functional one and PA-1's items go to S- (F269); reduction cards say how the replacement is
   reinforced (F271); the escape line on the card (F272); the citations (F273-F275); the review date on the due list and the school
   kept out of Setting (F276); designer edge cases (F277). Simulated data only. usage: node qa/sr1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(800);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('SR-1_'));
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  /* set meta fields and redraw; read the design and the card */
  const put=(x)=>p.evaluate(x=>{Object.assign(S.meta,x);renderAll();},x);
  const look=()=>p.evaluate(()=>{const o=design(),t=h=>String(h||'').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ');
    return {nota:t(o&&o.nota),warn:(o?o.warn:[]).map(t),rule:t(o&&o.rule),data:(o?o.data:[]).map(t),card:document.getElementById('cardOut').innerText};});
  /* ---- F268 ---- */
  await put({ds_sel:'token',earn:'',earns:'',alt:'',alts:''});const a1=await look();
  await put({earn:'Calling out (simulated)',earns:'calling out'});const a2=await look();
  await put({earn:'Finishing a worksheet row (simulated)',earns:'a finished row',alt:'Raising a hand and waiting to be called on',alts:'a raised hand'});const a3=await look();
  ok('1 F268 an earning design with no response that earns, or with the behavior being reduced as it, is warned',
    a1.warn.some(w=>/^Name the response that earns/.test(w))&&a2.warn.some(w=>/The response that earns is the behavior being reduced/.test(w)),{w1:a1.warn,w2:a2.warn});
  ok('2 F268 the token rule and the card name the response that earns; the card still shows a different replacement',
    /Each time a finished row occurs 5 times/.test(a3.rule)&&!a3.warn.some(w=>/response that earns/i.test(w))&&/Response that earns:\s*Finishing a worksheet row \(simulated\)/.test(a3.card)&&!/Behavior:\s*Calling out/.test(a3.card)&&/Replacement:\s*Raising a hand/.test(a3.card),{rule:a3.rule,warn:a3.warn,card:a3.card.slice(0,600)});
  await put({earn:'',earns:''});const a4=await look();
  await put({ds_sel:'dro'});const a5=await look();
  ok('3 F268 with no response that earns typed, the replacement earns and is not printed twice; a reduction card shows the behavior',
    /Each time a raised hand occurs 5 times/.test(a4.rule)&&/Response that earns:\s*Raising a hand/.test(a4.card)&&!/Replacement:/.test(a4.card)&&/Behavior:\s*Calling out: any vocalization/.test(a5.card)&&!/Response that earns/.test(a5.card),{r4:a4.rule,c4:a4.card.slice(0,500),c5:a5.card.slice(0,500)});
  /* ---- F269 ---- */
  const q=await open(file('SR-1_'));
  const f1=await q.evaluate(()=>{window.__nbhFactsIn({behaviors:[{label:'Hitting (simulated)'},{label:'Asking for a break (simulated)',isRep:true}],fn:{key:'escape',label:'Escape from demands'},
    menu:[{name:'Drawing (simulated)'},{name:'Music (simulated)'}]});const m=S.meta;return {func:m.func,sr:m.sr,comp:m.th_comp,earn:m.earn,behs:m.behs};});
  ok('4 F269 for an escape function the reinforcer is the break and PA-1\'s items go to S-; F268 the replacement is the response that earns, the target the behavior',
    f1.func==='Escape or avoidance'&&/^a break from the task/.test(f1.sr)&&/Drawing \(simulated\)/.test(f1.comp)&&/\(Form PA-1\)$/.test(f1.comp)&&f1.earn==='Asking for a break (simulated)'&&f1.behs==='Hitting (simulated)',f1);
  const r=await open(file('SR-1_'));
  const f2=await r.evaluate(()=>{window.__nbhFactsIn({behaviors:[{label:'Hand flapping (simulated)'}],fn:{key:'automatic',label:'Automatic'},menu:[{name:'Drawing (simulated)'}]});return {sr:S.meta.sr,comp:S.meta.th_comp};});
  await put({ds_sel:'thin',sr:'Drawing, Music (Form PA-1)'});const b1=await look();
  ok('5 F269 an automatic function keeps PA-1\'s items as the reinforcer; a thinning schedule for attention that delivers PA-1 items is warned',
    /Drawing \(simulated\)/.test(f2.sr)&&!f2.comp&&b1.warn.some(w=>/should deliver the functional reinforcer \(adult attention: comments, praise, someone close\)/.test(w)),{f2,warn:b1.warn});
  await put({sr:'Teacher attention: being called on within 10 s, with a comment on the answer'});
  /* ---- F271 ---- */
  await put({ds_sel:'dro',alt:'',alts:''});const c1=await look();
  await put({alt:'Raising a hand and waiting to be called on',alts:'a raised hand'});const c2=await look();
  await put({ds_sel:'ncr'});const c3=await look();
  ok('6 F271 a DRO card with no replacement is warned; with one, the rule says how it is reinforced and the data count it',
    c1.warn.some(w=>/No replacement response is named: this card is DRO alone/.test(w))&&!/The replacement:/.test(c1.rule)
    &&/The replacement: answer a raised hand at once with being called on, every time; it does not change the timer or the count\./.test(c2.rule)&&c2.data.includes('Instances of a raised hand per session')&&/The replacement:/.test(c3.rule),{w1:c1.warn,r2:c2.rule,d2:c2.data,r3:c3.rule});
  /* ---- F272 ---- */
  await p.evaluate(()=>window.__nbhFactsIn({crisis:{stages:[{s:'Calm (simulated)'},{s:'Escalation (simulated)'}]}}));
  await put({ds_sel:'thin',func:'Escape or avoidance'});const e1=await look();
  await put({ds_sel:'dro',func:'Attention'});const e2=await look();
  await put({ds_sel:'chain'});const e3=await look();
  ok('7 F272 an escape thinning card and every chained card say no one holds the student and the crisis plan takes over; an attention DRO card does not',
    /No one holds the student, guides hand over hand/.test(e1.card)&&/crisis plan \(Form CR-1\) takes over/.test(e1.card)&&/stages: Calm \(simulated\); Escalation \(simulated\)\./.test(e1.card)
    &&!/No one holds the student/.test(e2.card)&&/No one holds the student/.test(e3.card),{e1:e1.card.slice(-700),e2:e2.card.slice(-400)});
  /* ---- F273-F275 ---- */
  const src=await p.evaluate(()=>document.documentElement.innerHTML);
  ok('8 F273-F275 the citations: Hagopian 11 of 25; Lerman et al. (1996) did not find slower extinction with self-injury; the first NCR interval after Kahng et al. (2000)',
    /fewer than half of the applications \(11 of 25\)/.test(src)&&!/90% or more in most cases/.test(src)&&/did not reproduce it with self-injury/.test(src)&&!/extinguishes more slowly, which cuts both ways/.test(src)
    &&!/after Vollmer et al\., 1993\)/.test(src)&&/as in Kahng et al\., 2000/.test(src)&&!/limited-hold comparison in schedule-thinning work/.test(src),'citations');
  /* ---- F276 ---- */
  const d1=await p.evaluate(()=>window.__nbhDue());await put({cd_review:''});const d2=await p.evaluate(()=>window.__nbhDue());
  await put({cd_review:'11/20/2026'});const d3=await p.evaluate(()=>window.__nbhDue());
  const s=await open(file('SR-1_'));
  const pk=await s.evaluate(()=>{window.__nbhApplyPacket({client:'Mateo Rivera (simulated)',sid:'4471823',grade:'3',site:'Sample Elementary (simulated)'},true);
    return {client:S.meta.client||document.querySelector('[data-m="client"]').value,setting:S.meta.setting||'',any:[...document.querySelectorAll('input,textarea')].some(e=>/Sample Elementary/.test(e.value))};});
  ok('9 F276 the card\'s review date is on the due list (either date form, none when blank); the packet\'s school does not land in Setting',
    JSON.stringify(d1)==='[{"what":"Schedule card review","date":"2026-10-16"}]'&&d2.length===0&&d3.length===1&&d3[0].date==='11/20/2026'&&/Mateo Rivera/.test(pk.client)&&pk.setting===''&&!pk.any,{d1,d2,d3,pk});
  /* ---- F277 ---- */
  await put({ds_sel:'dro',dro_type:'mom',dro_reset:'reset'});const g1=await look();
  await put({dro_type:'whole'});const g2=await look();
  await put({ds_sel:'drl',drl_var:'spaced',drl_target:'0'});const g3=await look();
  await put({drl_target:'20',drl_crit:''});const g4=await look();
  await put({ds_sel:'dro',dro_crit:'',dro_back:''});const g5=await look();
  ok('10 F277 momentary DRO is not called resetting; a 0% spaced DRL target is warned and stays finite; a blank step criterion or step-back rule is named',
    !/resetting/.test(g1.nota)&&/\(resetting\)/.test(g2.nota)&&g3.warn.some(w=>/A target of 0% is extinction, not DRL/.test(w))&&!/NaN|Infinity/.test(JSON.stringify(g3))
    &&g4.warn.some(w=>/^Write the criterion to step up before printing/.test(w))&&g5.warn.some(w=>/^Write the criterion to step up and the step-back rule before printing/.test(w)),{g1:g1.nota,g2:g2.nota,g3:g3.warn,g4:g4.warn,g5:g5.warn});
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
