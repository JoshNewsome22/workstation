/* v24.48 Relapse and its mitigation (Kimball, Greer, Fuhrman & Lambert, 2023), the reading the BCBA sent on 10/26: Form RS-1's
   Readings discussed finds it, with a summary for the RBT; Form TD-1's plan has a Relapse safeguards part (BCBA Test Content
   Outline, 6th ed., item H.5): the four moments relapse comes from, marked where the plan meets them, ten safeguards with their
   evidence, the ticked ones on paper (the plan and the Final plan) and in the case, kept by a save, ticked by the simulation, and
   a link to Form RM-1; Form SR-1 and Form RM-1 carry the review's numbers and references. Simulated data only.
   usage: node qa/rel148-test.js (WS_URL as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
const fs=require('fs');
let n=0,fails=0;const ok=(t,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c||i===undefined?'':'  '+JSON.stringify(i).slice(0,1200)));if(!c)fails++;};
const dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1180,height:860},serviceWorkers:'block'});
  /* ---------------- Form RS-1 ---------------- */
  let p=await ctx.newPage();p.on('pageerror',e=>errs.push('RS-1 '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('RS-1_'));await sleep(1200);
  const rd=await p.evaluate(()=>{const R=NBH_READINGS,i=R.findIndex(r=>r.k==='kimball2023'),r=R[i]||{};
    return {i,sorted:R.every((x,j)=>!j||R[j-1].k<x.k),apa:r.apa,doi:r.doi,y:r.y,sum:r.sum||'',n:R.length};});
  ok('RS-1 the references file carries the reading in its place (sorted by key), APA reference, DOI, year and a summary of at most 460 characters',
    rd.i>=0&&rd.sorted&&rd.apa==='Kimball, R. T., Greer, B. D., Fuhrman, A. M., & Lambert, J. M. (2023). Relapse and its mitigation: Toward behavioral inoculation. Journal of Applied Behavior Analysis, 56(2), 282–301.'&&rd.doi==='10.1002/jaba.971'&&rd.y===2023&&rd.sum.length>200&&rd.sum.length<=460,rd);
  ok('RS-1 the summary names the four kinds of relapse and what staff do',['Resurgence','Renewal','Reinstatement','Spontaneous recovery','never pay off problem behavior'].every(w=>rd.sum.includes(w)),rd.sum);
  await p.evaluate(()=>{addContact();});await sleep(400);
  await p.evaluate(()=>document.querySelector('[data-rdadd]').click());await sleep(300);
  const finds={};for(const q of ['relapse inoculation','resurgence renewal','Kimball']){await p.fill('#rdQ',q);await sleep(150);finds[q]=await p.evaluate(()=>[...document.querySelectorAll('#rdList .rd-it[data-k]')].map(b=>b.dataset.k).slice(0,3));}
  ok('RS-1 the picker finds it by the title, by the kinds of relapse and by the author',Object.values(finds).every(L=>L[0]==='kimball2023'),finds);
  await p.fill('#rdQ','relapse inoculation');await sleep(150);await p.evaluate(()=>document.querySelector('#rdList .rd-it[data-k="kimball2023"]').click());await sleep(400);
  await p.evaluate(()=>{const c=month(curKey).contacts[0];c.date=curKey+'-06';c.start='09:00';c.end='10:00';const r=c.readings[0];const e=document.querySelector('[data-rd="'+r.id+'"][data-f="disc"]');e.value='Which of the four the RBT has seen after a break (simulated).';e.dispatchEvent(new Event('input',{bubbles:true}));renderContacts();renderPrint();});await sleep(300);
  const rec=await p.evaluate(()=>{const r=month(curKey).contacts[0].readings[0];return {k:r.k,sum:r.sum.length,month:document.querySelector('#monthOut').textContent,rbt:document.querySelector('#readList').textContent,doi:!!document.querySelector('#readList a[href*="10.1002/jaba.971"]'),year:document.querySelector('#yearOut').textContent};});
  ok('RS-1 added to a contact with its summary; the monthly record, the RBT record (with the DOI) and the year summary carry it',
    rec.k==='kimball2023'&&rec.sum===rd.sum.length&&/Kimball, R\. T\./.test(rec.month)&&/Kimball, R\. T\./.test(rec.rbt)&&rec.doi&&/four the RBT has seen/.test(rec.rbt)&&/Readings discussed in supervision (this year|through [A-Z][a-z]+ \d{4}):\s*1/.test(rec.year),{k:rec.k,rbt:rec.rbt.slice(0,300)});
  await p.close();
  /* ---------------- Form TD-1 ---------------- */
  p=await ctx.newPage();p.on('pageerror',e=>errs.push('TD-1 '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TD-1_'));await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const view=v=>p.evaluate(v=>document.querySelector('#viewSeg [data-view="'+v+'"]').click(),v).then(()=>sleep(300));
  await view('plan');
  const lay=await p.evaluate(()=>{const hs=[...document.querySelectorAll('#plan h3.sub')].map(h=>h.textContent.trim());const a=document.querySelector('#rlSec a.rl-rm');
    return {hs,boxes:[...document.querySelectorAll('#rlList input[type=checkbox]')].map(e=>e.name),tags:[...document.querySelectorAll('#rlList .rl-ev')].map(e=>e.textContent),
      text:document.querySelector('#rlSec').textContent.replace(/\s+/g,' '),href:a&&a.getAttribute('href'),tgt:a&&a.target,note:!!document.querySelector('#rlSec textarea[name="rl.note"]'),
      moments:[...document.querySelectorAll('#rlRisk .rl-m')].map(m=>({k:m.dataset.k,on:m.classList.contains('on'),t:m.textContent})),fits:[...document.querySelectorAll('#rlList .rl-fit')].filter(e=>!e.hidden).length};});
  const gi=lay.hs.indexOf('Generalization and Maintenance'),ri=lay.hs.indexOf('Relapse Safeguards'),si=lay.hs.indexOf('Social Validity and Acceptability');
  ok('TD-1 the plan has Relapse Safeguards between Generalization and Maintenance and Social Validity, with item H.5 of the BCBA Test Content Outline (6th ed.)',
    gi>=0&&ri===gi+1&&si===ri+1&&/BCBA Test Content Outline \(6th ed\.\) item H\.5: plan for and attempt to mitigate possible relapse of the target behavior/.test(lay.text),{hs:lay.hs});
  ok('TD-1 ten safeguards, each with its evidence as the review grades it, a box for the changes ahead, and the review cited',
    lay.boxes.join()==='rl.sd,rl.common,rl.multi,rl.value,rl.more,rl.dra,rl.brief,rl.integ,rl.ncr,rl.break'&&lay.tags.length===10&&lay.tags.every(t=>/^(Clinical studies|Early studies|Mixed results|Not yet tested|Practice)$/.test(t))&&lay.note&&
    /Kimball, Greer, Fuhrman, and Lambert \(2023\)/.test(lay.text)&&/a mean of 81% less/.test(lay.text)&&/only 29% of FCT studies/.test(lay.text),{boxes:lay.boxes,tags:lay.tags});
  ok('TD-1 an empty plan: the four moments with the review\'s numbers, none marked as met, no "fits this plan" chip; a link to Form RM-1 (a file of the workstation, a new tab standalone)',
    lay.moments.map(m=>m.k).join()==='resurgence,renewal,reinstatement,recovery'&&lay.moments.every(m=>!m.on)&&/76%–91%/.test(lay.moments[0].t)&&/59%–67%/.test(lay.moments[1].t)&&/24%–42%/.test(lay.moments[1].t)&&
    lay.fits===0&&lay.href&&fs.existsSync(dir+lay.href)&&lay.href.startsWith('RM-1_')&&lay.tgt==='_blank',{moments:lay.moments,href:lay.href,fits:lay.fits});
  /* print: nothing ticked, the part stays off paper */
  await p.emulateMedia({media:'print'});
  const pr0=await p.evaluate(()=>({sec:getComputedStyle(document.getElementById('rlSec')).display,head:getComputedStyle(document.getElementById('rlHead')).display}));
  await p.emulateMedia({media:'screen'});
  ok('TD-1 on paper, a plan with no safeguard ticked and no note leaves the part out',pr0.sec==='none'&&pr0.head==='none',pr0);
  /* the simulation */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);await view('plan');
  const sim=await p.evaluate(()=>{return {on:[...document.querySelectorAll('#rlList input:checked')].map(e=>e.name.slice(3)),note:document.querySelector('[name="rl.note"]').value,
    moments:[...document.querySelectorAll('#rlRisk .rl-m')].map(m=>({k:m.dataset.k,on:m.classList.contains('on'),here:(m.querySelector('.rl-in')||{}).textContent||''})),
    fits:[...document.querySelectorAll('#rlList .rl-fit')].filter(e=>!e.hidden).map(e=>e.closest('label').querySelector('input').name.slice(3)+':'+e.textContent),
    codes:[...document.querySelectorAll('#compWrap .card')].map(c=>c.dataset.code)};});
  const hasExt=sim.codes.some(c=>['EXT','EE','SEXT'].includes(c));
  ok('TD-1 the simulation ticks the safeguards its plan uses (signals, value, DRA, common stimuli, several adults, integrity, the first days back) and writes a simulated note',
    ['sd','common','multi','value','dra','integ','break'].every(k=>sim.on.includes(k))&&!sim.on.includes('ncr')&&/^Simulated:/.test(sim.note),sim);
  ok('TD-1 the moments the simulated plan meets are marked: resurgence by its replacement response and thinning ladder, reinstatement by its extinction; the safeguards for them say so',
    sim.moments[0].on&&/In this plan: .*FCT/.test(sim.moments[0].here)&&/thinning ladder/.test(sim.moments[0].here)&&sim.moments[2].on===hasExt&&(!hasExt||/extinction \(/.test(sim.moments[2].here))&&
    !sim.moments[1].on&&!sim.moments[3].on&&sim.fits.includes('sd:fits this plan')&&sim.fits.includes('value:fits this plan')&&(!hasExt||sim.fits.includes('integ:this plan uses extinction')),sim);
  /* the Final plan */
  await view('final');
  const fin=await p.evaluate(()=>{const b=document.getElementById('rlFinal');return {hidden:b.hidden,group:(b.querySelector('.plan-group')||{}).textContent,items:[...b.querySelectorAll('li')].map(l=>l.textContent),note:(b.querySelector('.rl-note')||{}).textContent||'',
    inSheet:!!b.closest('#final'),afterBody:document.getElementById('finalBody').compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING};});
  ok('TD-1 the Final plan carries the ticked safeguards in the words staff use, and the changes ahead',
    !fin.hidden&&fin.inSheet&&fin.afterBody&&fin.group==='Relapse safeguards'&&fin.items.length===7&&fin.items.some(t=>/^Signals for “now” and “not now”\. Use the signals every time/.test(t))&&fin.items.some(t=>/Problem behavior never earns the reinforcer/.test(t))&&/Changes ahead: Simulated: a substitute aide/.test(fin.note),fin);
  /* on paper: the ticked ones */
  await view('plan');await p.emulateMedia({media:'print'});
  const pr1=await p.evaluate(()=>({sec:getComputedStyle(document.getElementById('rlSec')).display,shown:[...document.querySelectorAll('#rlList label')].filter(l=>getComputedStyle(l).display!=='none').map(l=>l.querySelector('input').name.slice(3)),
    link:getComputedStyle(document.querySelector('#rlSec a.rl-rm').parentNode).display,fit:[...document.querySelectorAll('#rlList .rl-fit')].every(e=>e.hidden||getComputedStyle(e).display==='none')}));
  await p.emulateMedia({media:'screen'});
  ok('TD-1 on paper the plan shows only the ticked safeguards, without the link or the chips',pr1.sec!=='none'&&pr1.shown.length===7&&!pr1.shown.includes('ncr')&&pr1.link==='none'&&pr1.fit,pr1);
  /* the case */
  const facts=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.plan&&o.plan.relapse;});
  ok('TD-1 the case carries plan.relapse: the moments the plan meets, the ticked safeguards with the staff line, the changes ahead',
    facts&&facts.moments.includes('resurgence')&&facts.safeguards.length===7&&facts.safeguards[0].k==='sd'&&/Use the signals every time/.test(facts.safeguards[0].staff)&&/^Simulated:/.test(facts.note)&&/Kimball/.test(facts.src),facts);
  /* save and open */
  const rt0=await p.evaluate(()=>{const R=window.__tdRelapse,d=JSON.parse(JSON.stringify(R.collect()));window.__rlSaved=d;R.restore({counts:{}});return document.querySelectorAll('#rlList input:checked').length+(document.getElementById('rlFinal').hidden?0:100);});
  await p.evaluate(()=>window.__tdRelapse.restore(window.__rlSaved));await view('final');
  const rt=await p.evaluate(()=>({on:window.__tdRelapse.ticked(),note:document.querySelector('[name="rl.note"]').value,fin:document.querySelectorAll('#rlFinal li').length,hidden:document.getElementById('rlFinal').hidden}));rt.off=rt0;
  ok('TD-1 a saved plan opens with its safeguards and note, and the Final plan shows them (a cleared form shows none)',rt.off===0&&rt.on.length===7&&/^Simulated:/.test(rt.note)&&rt.fin===7&&!rt.hidden,rt);
  /* a tick by hand repaints the Final plan; unticking all hides it */
  const hand=await p.evaluate(()=>{const e=document.querySelector('[name="rl.ncr"]');e.click();const a=document.querySelectorAll('#rlFinal li').length;
    document.querySelectorAll('#rlList input:checked').forEach(x=>x.click());const t=document.querySelector('[name="rl.note"]');t.value='';t.dispatchEvent(new Event('input',{bubbles:true}));
    return {a,hidden:document.getElementById('rlFinal').hidden,none:document.getElementById('rlSec').classList.contains('rl-none')};});
  ok('TD-1 a tick by hand joins the Final plan at once; with none ticked and no note the Final plan has no Relapse safeguards block',hand.a===8&&hand.hidden&&hand.none,hand);
  await p.close();
  /* the link inside a frame: the shell is asked to open RM-1 beside TD-1; when it does not answer, TD-1 opens RM-1 in a tab */
  const host=await ctx.newPage();host.on('pageerror',e=>errs.push('host '+e.message));await host.goto(L.BASE+'/NBH-Workstation/'+file('RM-1_'));await sleep(500);
  const fr=await host.evaluate(src=>new Promise(res=>{document.body.innerHTML='';window.__msgs=[];window.addEventListener('message',e=>{if(e.data&&e.data.nbh==='open')window.__msgs.push(e.data);});
    const f=document.createElement('iframe');f.style.cssText='width:1100px;height:800px';f.src=src;f.onload=()=>res(true);document.body.appendChild(f);}),L.BASE+'/NBH-Workstation/'+file('TD-1_'));await sleep(1500);
  const frame=host.frames().find(f=>/TD-1_/.test(f.url()));
  const popups=[];ctx.on('page',pg=>popups.push(pg.url()));
  await frame.evaluate(()=>{document.querySelector('#viewSeg [data-view="plan"]').click();document.querySelector('#rlSec a.rl-rm').click();});await sleep(400);
  const asked=await host.evaluate(()=>window.__msgs.slice());await sleep(1800);
  ok('TD-1 inside the workstation the link asks the shell to open Form RM-1 beside it; with no answer, RM-1 opens in a tab',asked.length===1&&asked[0].want==='RM-1'&&asked[0].beside===true&&popups.length===1&&/RM-1_/.test(popups[0]),{asked,popups});
  await host.evaluate(()=>{window.addEventListener('message',e=>{if(e.data&&e.data.nbh==='open')e.source.postMessage({nbh:'opened',want:'RM-1',ok:true},'*');});});
  await frame.evaluate(()=>document.querySelector('#rlSec a.rl-rm').click());await sleep(2000);
  ok('TD-1 when the shell answers that it opened RM-1, no tab opens',popups.length===1,popups);
  await host.close();
  /* ---------------- Form SR-1 ---------------- */
  p=await ctx.newPage();p.on('pageerror',e=>errs.push('SR-1 '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('SR-1_'));await sleep(1200);
  const sr=await p.evaluate(()=>{const m=CAT.find(c=>c.id==='momentum'),u=CAT.find(c=>c.id==='mult');return {prog:m.prog,refs:m.refs,used:u.used,urefs:u.refs,list:document.getElementById('srRefs').textContent};});
  ok('SR-1 the momentum entry gives the prevalence of resurgence at thinning, and the multiple schedule the review\'s finding for the S−; both cite the review, which is in the references',
    /76%–91% of cases during schedule thinning after FCT \(as reviewed by Kimball et al\., 2023\)/.test(sr.prog.replace(/&ndash;/g,'–'))&&sr.refs.includes('kimball23')&&/resurged less/.test(sr.used)&&sr.urefs.includes('kimball23')&&/Kimball, R\. T\., Greer, B\. D\., Fuhrman, A\. M\., & Lambert, J\. M\. \(2023\)/.test(sr.list),{prog:sr.prog.slice(-200),used:sr.used.slice(-200)});
  await p.close();
  /* ---------------- Form RM-1 ---------------- */
  p=await ctx.newPage();p.on('pageerror',e=>errs.push('RM-1 '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('RM-1_'));await sleep(1200);
  const rm=await p.evaluate(()=>{const t=document.body.textContent.replace(/\s+/g,' ');return {h5:/item H\.5 asks the analyst to plan for and attempt to mitigate possible relapse of the target behavior \(Behavior Analyst Certification Board, 2022\)/.test(t),
    ref:/Behavior Analyst Certification Board\. \(2022\)\. BCBA test content outline \(6th ed\.\)\. Author\./.test(document.getElementById('rmRefs').textContent.replace(/\s+/g,' ')),neely:/see Neely et al\. \(2018\)\. Kimball et al\. \(2023\) report from that review that only 29% of the FCT studies used this tactic\./.test(document.documentElement.innerHTML.replace(/\s+/g,' '))};});
  ok('RM-1 item H.5 beside the definitions, the BACB outline in the references, and the 29% figure for common stimuli',rm.h5&&rm.ref&&rm.neely,rm);
  await p.close();
  ok('no page errors',errs.length===0,errs);
 }catch(e){ok('test ran: '+e.message,false);}
 await br.close();console.log(fails?fails+' FAILED of '+n:'ALL PASS ('+n+')');process.exit(fails?1:0);})();
