/* Form FS-1, review Wave 3 part 2: the experimental-analysis detail shows only the format that was run and treatment results stay
   out of the FBA (F171); the setting event reaches Form TD-1 (F175); Form RR-1's earlier plan reaches the records paragraph (F176);
   the window from the evidence sheet, the report date and a check before signing (I87). Simulated data only.
   usage: node qa/fs1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open(file('FS-1_'));
  const vis=()=>p.evaluate(()=>['.xa-rrb','.xa-cfa','.xa-tx'].map(q=>document.querySelector(q).hidden));
  const v0=await vis();
  await p.evaluate(()=>{const s=document.querySelector('[data-x="rrbUsed"]');s.value='Yes';s.dispatchEvent(new Event('change',{bubbles:true}));});const v1=await vis();
  ok('1 F171 a format\'s detail rows show only when it was run',v0.join()==='true,true,true'&&v1.join()==='false,true,true',{v0,v1});
  const t=await p.evaluate(()=>{S.xa.txRpm='M 2.4 to 0.1 (simulated)';S.xa.rbWithdrawn='Yes: RRB stayed at zero';renderAll();
    return {hid:document.querySelector('.xa-tx').hidden,note:document.querySelector('.xa-tx-note').textContent,rep:document.getElementById('reportOut').textContent};});
  ok('2 F171 treatment results an older record holds are shown, marked as belonging to Form PR-1 or DD-1, and the report leaves them out',
    !t.hid&&/belong on Form PR-1 or Form DD-1, not in the FBA/.test(t.note)&&/Arranging and ordering: experimental analysis\./.test(t.rep)&&!/Treatment outcome|Response blocking:/.test(t.rep),t);
  await p.emulateMedia({media:'print'});const pv=await p.evaluate(()=>{S.xa={};renderAll();return ['.xa-rrb','.xa-cfa','.xa-tx'].map(q=>getComputedStyle(document.querySelector(q)).display);});await p.emulateMedia({media:'screen'});
  ok('3 F171 a blank or unused format prints nothing',pv.every(x=>x==='none'),pv);
  /* ---- I87 ---- */
  const w=await p.evaluate(()=>{S.src[0]=Object.assign(S.src[0],{method:'Indirect: records review',dates:'8/10/26',fn:'Escape / avoidance (social negative)',str:'Moderate'});
    S.src[1]=Object.assign(S.src[1],{method:'Scatter plot / temporal pattern analysis',dates:'8/22/26–9/5/26',fn:'Escape / avoidance (social negative)',str:'Moderate'});
    S.src[2]=Object.assign(S.src[2],{method:'Descriptive ABC narrative recording',dates:'2026-10-13',fn:'',str:'Strong'});renderAll();
    const rep=document.getElementById('reportOut').textContent,ready=document.getElementById('fsReady').textContent;document.getElementById('fsWinBtn').click();
    return {rep,ready,win:S.meta.window,today:(d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear())(new Date())};});
  ok('4 I87 the window comes from the first and last dates on the evidence sheet, the report is dated today, and the field offers the dates',
    w.rep.includes('Assessment conducted 8/10/26 – 10/13/26 (the first and last dates on the evidence sheet). Report dated '+w.today+'.')&&w.win==='8/10/26 – 10/13/26',w);
  ok('5 I87 a check before signing names what the report still needs',/^Before signing, the report still needs: the parent’s consent \(Form IC-1\); the student’s assent; the settings not assessed; the limitations; what would change this conclusion; .*the function of the source rated but not named \(ABC-1\)\.$/.test(w.ready),w.ready);
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const r=await p.evaluate(()=>({ready:document.getElementById('fsReady').textContent,cls:document.getElementById('fsReady').className,pr:getComputedStyle(document.getElementById('fsReady')).display}));
  ok('6 I87 the example is ready to sign, and the check stays off paper',/^Ready to sign:/.test(r.ready)&&/ok/.test(r.cls)&&await p.evaluate(()=>document.getElementById('fsReady').classList.contains('noprint')),r);
  /* ---- F176 ---- */
  const rr=await open(file('RR-1_'));
  const out=await rr.evaluate(()=>{const b=document.getElementById('simBtn')||document.querySelector('[id*=sim i]');if(b)b.click();return null;});await sleep(1200);
  const rec=await rr.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.records&&o.records.prior;});
  const bg=await p.evaluate(rec=>{S.meta.bgRecords='';renderAll();window.__nbhFactsIn({records:{prior:rec}});return S.meta.bgRecords||document.querySelector('[data-m="bgRecords"]').value;},rec);
  ok('7 F176 Form RR-1 sends the earlier plan, and FS-1\'s records paragraph names it',rec&&rec.bipStatus==='BIP on file, current'&&/^\d{4}-\d\d-\d\d$/.test(rec.bipDate)&&/Earlier plan: BIP on file, current, dated \d{1,2}\/\d{1,2}\/\d{4}\./.test(bg),{rec,bg});
  /* ---- F175 ---- */
  const td=await open(file('TD-1_'));
  const se=await td.evaluate(()=>{const r=window.__nbhFactsIn({behaviors:[{label:'Aggression (simulated)'}],behaviorsFS:[{label:'Aggression (simulated)',se:'less than 6 hours of sleep (simulated)',ant:'a demand',cons:'the demand removed'}]});
    return {v:document.querySelector('[name="ant.se"]').value,note:r&&r.note};});
  ok('8 F175 FS-1\'s setting event reaches Form TD-1\'s setting-event check',se.v==='Setting event (Form FS-1): less than 6 hours of sleep (simulated)',se);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
