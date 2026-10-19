/* Form TD-1, review Wave 3 part 3: the assessment and target-selection cards are the BCBA's, so they print under their own
   heading and leave the integrity checklist, the plan's step list and the staff flowchart's steps (F183); the Integrity and
   Progress Log names Form DD-1 as the record, and an empty log stays out of the IEP packet (F182).
   Simulated data only. usage: node qa/td1-w3c-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const AX=['C_CSA','C_ACSA','C_HELMET','C_MEDREF','P_ASSESS','E_ASSESS','VBMAPP','EFL','AFLS','PEAK'];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TD-1_'));await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const view=v=>p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);
  /* ---- F182 a blank log ---- */
  await view('monitor');
  const m0=await p.evaluate(()=>({cls:document.getElementById('monitor').className,t:document.getElementById('monitor').textContent.replace(/\s+/g,' ')}));
  ok('1 F182 the log names Form DD-1 as the session record and Form TI-1 as the integrity record; a log with no session is marked empty',
    /Form DD-1 is the session record and Form TI-1 the integrity record; this log serves the thinning decision only, and an empty log stays out of the IEP packet\./.test(m0.t)&&/\btd-empty\b/.test(m0.cls),m0.cls);
  /* ---- F183 ---- */
  const sim=async k=>{await p.evaluate(k=>{document.getElementById('simScenario').value=k;document.getElementById('simBtn').click();},k);await sleep(1300);};
  const look=()=>p.evaluate(AX=>{const cards=[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,name:c.querySelector('h3,h4,.card-h,b')?c.querySelector('h3,h4,.card-h,b').textContent:''}));
    const fid=[...document.querySelectorAll('#fidTbl tbody tr')].map(r=>r.textContent.replace(/\s+/g,' '));
    document.getElementById('flowBtn').click();const flow=document.getElementById('flowBlock');
    const bcba=[...flow.querySelectorAll('.fl-node')].find(n=>/For the BCBA/.test(n.textContent));
    document.querySelector('#viewSeg button[data-view="final"]').click();
    const fb=document.getElementById('finalBody'),grp=[...fb.querySelectorAll('.plan-group')].map(g=>g.textContent);
    const asr=[...fb.querySelectorAll('.plan-group')].find(g=>/^Assessments the BCBA completes/.test(g.textContent));
    const asComps=[];if(asr){let n=asr.nextElementSibling;while(n&&!n.classList.contains('plan-group')){if(n.classList.contains('plan-comp'))asComps.push({name:n.querySelector('.ph b').textContent,steps:n.querySelectorAll('.plan-step').length,li:n.querySelectorAll('ul.plan-assess li').length});n=n.nextElementSibling;}}
    const bip=window.__bipText(),steps=window.__td46Steps()||[];
    return {ax:cards.filter(c=>AX.includes(c.code)).map(c=>c.code),n:cards.length,fid,note:document.getElementById('tdFidNote').textContent,noteHidden:document.getElementById('tdFidNote').hidden,
      grp,asComps,lastGroup:grp[grp.length-1],bip,steps:JSON.stringify(steps),flowSteps:[...flow.querySelectorAll('.fl-node:not([style*="dashed"]) .fl-code')].map(e=>e.textContent),
      bcba:bcba?[...bcba.querySelectorAll('.fl-code')].map(e=>e.textContent):null,planSteps:fb.querySelectorAll('.plan-step').length,
      mon:document.getElementById('monitor').className};},AX);
  await sim('auto_s2');const a=await look();
  const NAMES=['Augmented competing-stimulus assessment','Social-function re-test under protective equipment','Medical and prescriber consultation for self-injury','VB-MAPP-linked target selection'];
  ok('2 F183 the simulation (automatic, Subtype 2) holds four of the BCBA\'s assessments',a.ax.join()==='C_ACSA,C_HELMET,C_MEDREF,VBMAPP',a.ax);
  ok('3 F183 the integrity checklist leaves them out and says so',a.fid.length>0&&!a.fid.some(r=>/Augmented competing-stimulus|VB-MAPP|re-test under protective|prescriber consultation/.test(r))&&!a.noteHidden&&
    a.note==='Not scored here: '+NAMES.join('; ')+'. The BCBA completes them; they are not staff steps.',{note:a.note,rows:a.fid.filter(r=>/VB-MAPP|competing/.test(r))});
  ok('4 F183 the final plan lists them under their own heading, after the staff components, as a list, not as numbered steps',
    /^Assessments the BCBA completes before or alongside the plan$/.test(a.lastGroup)&&a.asComps.map(c=>c.name).join('|')===NAMES.join('|')&&a.asComps.every(c=>c.steps===0&&c.li>0)&&
    !a.grp.slice(0,-1).some(g=>/Assessments the BCBA/.test(g)),{grp:a.grp,as:a.asComps});
  const bipStaff=a.bip.slice(0,a.bip.indexOf('ASSESSMENTS THE BCBA COMPLETES (NOT STAFF STEPS)')),bipAs=a.bip.slice(a.bip.indexOf('ASSESSMENTS THE BCBA COMPLETES (NOT STAFF STEPS)'));
  ok('5 F183 the BIP text: the staff components are numbered without them; they follow under ASSESSMENTS THE BCBA COMPLETES (NOT STAFF STEPS), each step a dash',
    bipStaff.length>500&&!NAMES.some(n=>bipStaff.includes(n))&&NAMES.every(n=>bipAs.includes('Assessment: '+n))&&/\n- Score the Milestones/.test(bipAs)&&!/\n\d+\. /.test(bipAs.split('\n\n').slice(0,4).join('\n\n')),{staffHas:NAMES.filter(n=>bipStaff.includes(n))});
  ok('6 F183 the plan\'s step list (Form QS-1\'s quick start, Form TI-1\'s steps) leaves them out',a.steps.length>200&&!NAMES.some(n=>a.steps.includes(n))&&!/Score the Milestones/.test(a.steps),a.steps.slice(0,300));
  ok('7 F183 the staff flowchart names them in a "For the BCBA" box, not among the staff steps',a.bcba&&a.bcba.join()==='C_ACSA,C_HELMET,C_MEDREF,VBMAPP'&&!a.flowSteps.some(c=>AX.includes(c)),{bcba:a.bcba,steps:a.flowSteps});
  ok('8 F182 the simulation\'s log has sessions, so it is not marked empty',!/\btd-empty\b/.test(a.mon),a.mon);
  await sim('escape_fct');const b=await look();
  ok('9 F183 another simulation (escape, FCT): VB-MAPP alone under the heading; the plan\'s numbered steps are unchanged in count from the staff cards',b.ax.join()==='VBMAPP'&&b.asComps.length===1&&b.asComps[0].name==='VB-MAPP-linked target selection'&&b.planSteps>0,{ax:b.ax,as:b.asComps});
  /* a plan with no assessment card */
  const c=await p.evaluate(AX=>{[...document.querySelectorAll('#compWrap .card')].filter(x=>AX.includes(x.dataset.code)).forEach(x=>{const d=x.querySelector('.del,[data-del],button.rm,button[title*="Remove"]');if(d)d.click();else x.remove();});
    document.querySelector('#viewSeg button[data-view="plan"]').click();document.querySelector('#viewSeg button[data-view="final"]').click();
    return {hidden:document.getElementById('tdFidNote').hidden,grp:[...document.querySelectorAll('#finalBody .plan-group')].map(g=>g.textContent),bip:/ASSESSMENTS THE BCBA/.test(window.__bipText())};},AX);
  ok('10 F183 a plan with none: no note, no heading',c.hidden&&!c.grp.some(g=>/Assessments the BCBA/.test(g))&&!c.bip,c);
  /* ---- F182 the IEP packet ---- */
  const sh=await ctx.newPage();sh.on('pageerror',e=>errs.push('shell: '+e.message));
  await sh.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);await sh.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};});
  await sh.evaluate(()=>openForm('TD-1'));await sh.waitForFunction(()=>!!state.status['TD-1'],null,{timeout:30000});await sleep(1200);
  const tf=sh.frames().find(f=>/TD-1_Function/.test(f.url()));
  const shape=bl=>sh.evaluate(async bl=>{const c=await grab('TD-1','collect',undefined,6000);const s=c?packetShape(c,0,Object.assign(packetOpts(),bl?{blanks:true}:{}),{}):null;
    const d=new DOMParser().parseFromString('<div>'+(s?s.html:'')+'</div>','text/html');return {len:s?s.html.length:0,mon:!!d.querySelector('#monitor'),fin:!!d.querySelector('#final'),
      keep:!!d.querySelector('#final[data-mp-keep]')};},bl);
  const k0=await shape(false),kb=await shape(true);
  await tf.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1500);
  const k1=await shape();
  ok('11 F182 in the IEP packet a log with no session stays out; a log with sessions goes in; the final plan keeps its own page',k0.len>1000&&!k0.mon&&k1.mon&&k1.fin&&k1.keep,{k0,k1});
  ok('12 F182 a packet printed with its blank boxes kept keeps the empty log too, for handwriting',kb.mon,kb);
  ok('13 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
