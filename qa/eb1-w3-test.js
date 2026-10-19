/* Form EB-1, review Wave 3: what to do at the earliest sign (F381), the plan's version and its changes (F382), a worked example
   in which asking pays more than hitting (F383), the student profile in the brief (F384), kept out of students' sight (F385),
   the case by every route (F387), the brief to the case and PR-1 (I191), the photo with permission (I193), setting starters
   (I194), show and try (I195). Simulated data only. usage: node qa/eb1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const EB='EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html',PR='PR-1_Periodic-Plan-Review_v2026-09.html';
const PIX='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.slice(0,4)+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});return p;};
  const p=await open(EB);
  const plan1={src:'TD-1',beh:'Hits the person next to him (simulated)',rep:'Holds up the break card',prec:'Goes quiet and pulls his hood up',respond:{prec:'Prompt the break card at the first sign; say nothing else',target:'Block and redirect',not:'No break after hitting'},
    adoption:{version:1,date:'2026-09-01'},versions:[{v:1,why:'adopted',date:'2026-09-01'}]};
  const prof={src:'DM-1',signals:'Covers his ears for stop; holds his stomach when something hurts',avoid:'Do not touch his backpack',flags:{safety:['Elopement','Traffic','Physical management restrictions'],photo:'Yes'}};
  const crisis={src:'CR-1',precursor:'Pacing',stages:[{s:'Early precursor',do:'Stop talking, point once at the timer and offer the break card',who:'Any adult'}]};
  const beh=[{label:'Hitting (simulated)'},{label:'Leaving the bus seat (simulated)'}];
  /* ---------- F381, F384 ---------- */
  const a=await p.evaluate(([plan,prof,crisis,beh])=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('m.client','Mateo Rivera');set('m.sid','4471823');const c=document.querySelector('#f_ctx');c.value='School bus and transportation';c.dispatchEvent(new Event('change',{bubbles:true}));
    const r=window.__nbhFactsIn({plan,profile:prof,crisis,behaviors:beh});build(true);
    return {r,earlydo:val('e.earlydo'),sig:val('e.signals'),markE:document.querySelector('#p_earlydo').textContent,markS:document.querySelector('#p_signals').textContent,ver:val('e.planver'),
      sug:$$('#ebPlanSug [data-ebsug]').map(b=>b.parentElement.textContent),out:document.querySelector('#out').innerHTML,checks:document.querySelector('#ebWarn').textContent};},[plan1,prof,crisis,beh]);
  ok('1 F381 "When you see it" takes the plan’s response to the precursor, marked to rewrite, and the brief prints it under the earliest sign',
    a.earlydo==='Prompt the break card at the first sign; say nothing else'&&/from the plan/.test(a.markE)&&/<b>Earliest sign:<\/b> Goes quiet[^<]*<\/p><p class="eb-p2"><b>When you see it:<\/b> Prompt the break card/.test(a.out),a);
  ok('2 F384 the student profile: how the student shows no, stop or pain is placed (marked from the profile) and printed; what to avoid is offered for Never Do This',
    /Covers his ears/.test(a.sig)&&/from the student profile/.test(a.markS)&&/shows no, stop or pain:<\/b> Covers his ears/.test(a.out)&&a.sug.some(t=>/the student profile: what to avoid.*Do not touch his backpack/.test(t)),a.sug);
  ok('3 F384 the profile’s safety precautions the brief does not mention are named, and the physical management restrictions are always shown',
    /The student profile \(Form DM-1\) flags Elopement, Traffic;/.test(a.checks)&&/Physical management restrictions are recorded on Form DM-1/.test(a.checks),a.checks);
  ok('4 F387, I194 the plan’s other targets and the bus starters are offered, each named for its block',
    a.sug.some(t=>/another target in the plan.*Leaving the bus seat/.test(t))&&a.sug.some(t=>/a starter for this setting.*driver stays in the driver/.test(t))&&a.sug.some(t=>/next safe stop/.test(t)),a.sug);
  const cr2=await p.evaluate(crisis=>{const e=document.querySelector('[name="e.earlydo"]');e.value='';delete PULLED['e.earlydo'];delete PLACED['e.earlydo'];window.__nbhFactsIn({plan:{src:'TD-1',beh:'x',respond:{}},crisis});return val('e.earlydo');},crisis);
  ok('5 F381 with no response to the precursor in the plan, the crisis plan’s early stage is taken',cr2==='Stop talking, point once at the timer and offer the break card',cr2);
  /* ---------- F382 ---------- */
  const v=await p.evaluate(([plan1,prof])=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    ['e.see','e.ask','e.earlydo'].forEach(k=>set(k,''));PULLED={};PLACED={};set('e.planver','');
    window.__nbhFactsIn({plan:plan1,profile:prof});const v1=val('e.planver');set('e.ask','Shows the blue card');   /* rewritten by hand */
    const plan2=JSON.parse(JSON.stringify(plan1));plan2.rep='Says "break" or taps the break card';plan2.adoption.version=2;plan2.versions.push({v:2,why:'review',date:'2026-10-06'});
    window.__nbhFactsIn({plan:plan2,profile:prof});const box=document.querySelector('#ebChange'),txt=box.textContent,hid=box.hidden,still=val('e.ask'),ver=val('e.planver');
    box.querySelector('[data-ebchg="use"]').click();const used=val('e.ask'),mark=document.querySelector('#p_ask').textContent;
    const txt2=document.querySelector('#ebChange').textContent;document.querySelector('[data-ebchg="ver"]').click();const ver2=val('e.planver'),gone=document.querySelector('#ebChange').hidden;
    set('e.date','2026-10-15');build(true);const out=document.querySelector('#out').innerHTML;
    return {v1,hid,txt,still,ver,used,mark,txt2,ver2,gone,foot:(out.match(/<div class="eb-foot">[\s\S]*?<\/div>/)||[''])[0],ack:(out.match(/<div class="eb-ack">[\s\S]*?<\/p>/)||[''])[0]};},[plan1,prof]);
  ok('6 F382 the brief records the plan version; a revised plan shows "The plan has changed here" for each field it carried, rewritten or not, and nothing is overwritten unasked',
    v.v1==='version 1, adopted 9/1/2026'&&!v.hid&&/The plan has changed here \(this brief was built from the plan version 1, adopted 9\/1\/2026; the plan is now version 2, revised 10\/6\/2026\)/.test(v.txt)&&/How the Student Asks now reads “Says "break" or taps the break card”/.test(v.txt)&&v.still==='Shows the blue card'&&v.ver==='version 1, adopted 9/1/2026',v);
  ok('7 F382 "Use the plan’s words" places the new text (marked); the version is marked current only when asked, and printed in the footer and on the signed page with the issue date',
    v.used==='Says "break" or taps the break card'&&/from the plan/.test(v.mark)&&/Mark it built from the plan version 2/.test(v.txt2)&&v.ver2==='version 2, revised 10/6/2026'&&v.gone&&
    /Built from the behavior plan, version 2, revised 10\/6\/2026\. Issued October 15, 2026\./.test(v.foot)&&/<b>Brief<\/b><span>issued October 15, 2026 \u00b7 built from the plan, version 2, revised 10\/6\/2026<\/span>/.test(v.ack),v);
  const dt=await p.evaluate(()=>{const e=document.querySelector('[name="e.date"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));review();const t=document.querySelector('#ebWarn').textContent;document.querySelector('#ebToday').click();return {t,d:val('e.date')};});
  ok('8 F382 a brief with no issue date is listed, with "Use today"',/Date issued is empty/.test(dt.t)&&/^\d{4}-\d{2}-\d{2}$/.test(dt.d),dt);
  /* ---------- F385, I193, I195 ---------- */
  const f5=await p.evaluate(pix=>{window.__nbhApplyPacket({client:'Mateo Rivera',photo:pix},true);build(true);const o1=document.querySelector('#out').innerHTML;
    EB_PROFILE.flags.photo='No';build(true);const o2=document.querySelector('#out').innerHTML;EB_PROFILE.flags.photo='Yes';
    return {photo1:/<img class="eb-photo"/.test(o1),photo2:/<img class="eb-photo"/.test(o2),id:/4471823/.test(o1.split('eb-ack')[0]),sight:/Keep it where students cannot see it: not on the visor, a clipboard or an open sub folder\./.test(o1),
      tryl:(o1.match(/Shown how, and tried once: \u2610 honoring the request/g)||[]).length,cname:document.querySelector('#f_cname').getAttribute('data-m')};},PIX);
  ok('9 F385, I193 the brief stays out of students’ sight, carries no student ID, and shows the photo only with photo permission',f5.sight&&!f5.id&&f5.photo1&&!f5.photo2,f5);
  ok('10 I195, F387 each signature block has a show-and-try line; the bar’s BCBA fills "Who to ask"',f5.tryl===2&&f5.cname==='bcba',f5);
  /* ---------- I194 cafeteria with choking ---------- */
  const caf=await p.evaluate(()=>{EB_PROFILE.flags.safety=['Choking'];const c=document.querySelector('#f_ctx');c.value='Cafeteria and lunch';c.dispatchEvent(new Event('change',{bubbles:true}));
    const s=$$('#ebPlanSug [data-ebsug]').map(b=>b.parentElement.textContent);const i=EB_SUG.findIndex(x=>x.src==='starter'&&x.k==='prev');document.querySelector('[data-ebsug="'+i+'"]').click();
    return {s,lines:lines('prev'),mark:document.querySelector('#p_prev').textContent};});
  ok('11 I194 a cafeteria brief gets its starters, a choking line when the profile flags choking, and a starter used is marked as a starter',
    caf.s.some(t=>/end of a table/.test(t))&&caf.s.some(t=>/lists choking: watch what goes into the student/.test(t))&&caf.lines.some(t=>/end of a table/.test(t))&&/a starter/.test(caf.mark),caf);
  /* ---------- F383 the worked example ---------- */
  const sim=await p.evaluate(async()=>{document.querySelector('#simBtn').click();await new Promise(r=>setTimeout(r,400));return {early:val('e.earlydo'),askdo:val('e.askdo'),resp:lines('resp'),out:document.querySelector('#out').textContent};});
  ok('12 F383 the worked example: the card at the earliest sign; asking earns more (three minutes with headphones); after a hit nothing extra, and the other student moved only at a safe stop',
    /Hold up the blue card/.test(sim.early)&&/three minutes with his headphones/.test(sim.askdo)&&!sim.resp.some(t=>/^Offer the blue card once/.test(t))&&sim.resp.some(t=>/next safe stop/.test(t))&&sim.resp.some(t=>/Do not offer the card or time alone right then/.test(t)),sim);
  /* ---------- save and open ---------- */
  const rt=await p.evaluate(()=>{const d=collect();const placed=JSON.stringify(d.placed||{}),src=JSON.stringify(d.pullsrc||{});ebRecord(JSON.parse(JSON.stringify(d)));return {placed,src,back:JSON.stringify(PLACED),bsrc:JSON.stringify(PULL_SRC),f:!!d.f['e.earlydo']};});
  ok('13 save and open: the new fields, the texts placed and where they came from are kept',rt.f&&rt.placed===rt.back&&rt.src===rt.bsrc,rt);
  /* ---------- I191 ---------- */
  const out=await p.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('e.planver','version 1, adopted 9/1/2026');set('e.date','2026-09-02');return window.__nbhFactsOut().brief;});
  const pr=await open(PR);const line=await pr.evaluate(b=>prAlsoText({brief:b,plan:{adoption:{version:2}}}),out);
  ok('14 I191 the brief goes to the case, and PR-1 says to give out a new one when the plan has moved on',out&&out.ctx==='School bus and transportation'&&out.vn===1&&out.date==='2026-09-02'&&
    /The brief for limited-contact staff \(Form EB-1\): School bus and transportation \(Bus driver and bus attendant, route 214 \(simulated\)\), issued 9\/2, built from the plan version 1, adopted 9\/1\/2026; the plan is now version 2: give out a new brief\./.test(line),{out,line});
  await pr.close();
  ok('15 no page errors',errs.length===0,errs);
  }catch(e){console.error(e);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
