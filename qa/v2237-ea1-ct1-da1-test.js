/* v22.37 what IC-1's consent record means on Forms EA-1, CT-1 and DA-1 (review F148, F13, F348, F141).
   EA-1: "Parent consent obtained" only when IC-1 covers the experimental analysis; otherwise a NOT-consented or revoked line,
   replacing an earlier automatic one; the stop rule fills the session-termination criteria; a screen-only flag on Setup &
   safety and in the runner; Start session and Save to the log ask for a reason and write it with the session; nothing
   changes outside the workstation. CT-1: "Consent for home programming" only from the implementation consent; an earlier
   fill from the assessment consent is replaced or cleared; a screen-only notice on the Competency sheet. DA-1: the "Before
   the first session" block and the stop-rule columns of the trial record, saved, restored, printed; an older file opens
   with them empty. The forms are opened on their own and the case simulated with nbhCase.apply. Simulated people only.
   usage: node qa/v2237-ea1-ct1-da1-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const W=L.BASE+'/NBH-Workstation/';
const EXCEPT={consent:{src:'IC-1',state:'Current, with exceptions',on:true,method:'sign',kind:'initial',obtained:'2026-10-06',date:'2026-10-06',parent:'2026-10-06',
  exceptions:'No experimental analysis; no video or audio recording',procs:['records','indirect','abc','fa','demand'],covered:['records','indirect','abc','demand'],
  dec:{fa:{dec:'no',stop:'Any tissue damage; 3 head hits within 10 s; the student asks to stop.'}},bip:'',v:2}};
const REVOKED={consent:{src:'IC-1',state:'Revoked',on:false,method:'sign',kind:'initial',ended:'2026-10-09',date:'2026-10-09',parent:'',exceptions:'',procs:['indirect','fa'],covered:[],dec:{fa:{dec:'yes'}},bip:'',v:2}};
const FULL={consent:{src:'IC-1',state:'Current',on:true,method:'sign',kind:'initial',obtained:'2026-10-06',date:'2026-10-06',parent:'2026-10-06',exceptions:'',
  procs:['indirect','abc','fa','demand'],covered:['indirect','abc','fa','demand'],dec:{fa:{dec:'yes',stop:''}},bip:'2026-10-14',v:2}};
const LEGACY={consent:{date:'2026-10-06',parent:'2026-10-06',src:'IC-1'}};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900},serviceWorkers:'block'});
  const open=async(file,tag)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(W+file);await sleep(900);await p.evaluate(()=>{window.confirm=()=>true;window.__nbhSilent=1;});return p;};
  const EA='EA-1_Experimental-Analysis-Protocol_v2026-09.html',CT='CT-1_Caregiver-Training_v2026-09.html',DA='DA-1_Demand-Assessment_v2026-10.html';

  /* ---------------- EA-1 ---------------- */
  let ea=await open(EA,'EA-1');
  await L.loadSim(ea);await sleep(900);
  const st0=await ea.evaluate(()=>{document.getElementById('eaStart').click();return new Promise(r=>setTimeout(()=>r({s:eaRunner.state(),dlg:!!document.querySelector('#eaNcDlg[open]'),flag:document.getElementById('eaConsentFlag').hidden}),300));});
  ok('EA1 outside the workstation: Start session runs at once, no question, no flag',st0.s==='run'&&!st0.dlg&&st0.flag,st0);
  await ea.close();

  ea=await open(EA,'EA-1');
  await ea.evaluate(c=>nbhCase.apply(c),EXCEPT);
  const e1b=await ea.evaluate(()=>{const f=document.getElementById('eaConsentFlag'),r=document.getElementById('eaRunConsent');
    return {v:document.querySelector('[name="s.consent"]').value,t:document.querySelector('[name="s.term"]').value,fh:f.hidden,ft:f.textContent,np:f.classList.contains('noprint'),rh:r.hidden,rnp:!!r.closest('.noprint'),rt:r.textContent};});
  ok('EA2 consent with exceptions: the safety plan says the analysis is NOT consented, naming the exceptions',
    e1b.v==='Form IC-1: the experimental analysis is NOT consented (consent with exceptions: No experimental analysis; no video or audio recording)',e1b.v);
  ok('EA3 the parent\'s stop rule fills the session-termination criteria, marked from IC-1',e1b.t==='Any tissue damage; 3 head hits within 10 s; the student asks to stop (Form IC-1, Specific procedures A)',e1b.t);
  ok('EA4 a screen-only flag on Setup & safety and in the runner',!e1b.fh&&e1b.np&&/does not cover the experimental analysis/.test(e1b.ft)&&!e1b.rh&&e1b.rnp&&/asks why/.test(e1b.rt),e1b);
  await ea.emulateMedia({media:'print'});
  const pr=await ea.evaluate(()=>getComputedStyle(document.getElementById('eaConsentFlag')).display);
  ok('EA5 the flag does not print',pr==='none',pr);await ea.emulateMedia({media:'screen'});
  await ea.close();

  ea=await open(EA,'EA-1');
  const e2=await ea.evaluate(([a,b])=>{nbhCase.apply(a);const v1=document.querySelector('[name="s.consent"]').value;
    const el=document.querySelector('[name="s.consent"]');el.value=v1+'\nAdministrator notified 10/7/2026 (Iris Calloway)';el.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply(b);return {v1,v2:el.value};},[LEGACY,REVOKED]);
  ok('EA6 an old case (dates only) still reads as consent obtained',e2.v1==='Parent consent obtained 10/6/2026 (Form IC-1)',e2.v1);
  ok('EA7 revoked later: the earlier automatic line is replaced, the typed line kept',e2.v2==='Consent revoked on 10/9/2026 (Form IC-1); the experimental analysis is NOT consented\nAdministrator notified 10/7/2026 (Iris Calloway)',e2.v2);
  const e3=await ea.evaluate(c=>{nbhCase.apply(c);return {v:document.querySelector('[name="s.consent"]').value,f:document.getElementById('eaConsentFlag').hidden,r:document.getElementById('eaRunConsent').hidden};},FULL);
  ok('EA8 the analysis consented with its own yes: "Parent consent obtained" replaces the NOT line, flags gone',/^Parent consent obtained 10\/6\/2026 \(Form IC-1\)\nAdministrator notified/.test(e3.v)&&e3.f&&e3.r,e3);
  const e4=await ea.evaluate(c=>{const el=document.querySelector('[name="s.consent"]');el.value='Consent confirmed by phone with Ana Rivera (simulated)';el.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply(c);return el.value;},EXCEPT);
  ok('EA9 a consent line typed by hand is never overwritten',e4==='Consent confirmed by phone with Ana Rivera (simulated)',e4);
  await ea.close();

  /* the runner: asks for a reason, Cancel leaves it ready, the reason goes with the session */
  ea=await open(EA,'EA-1');
  await L.loadSim(ea);await sleep(900);
  await ea.evaluate(c=>nbhCase.apply(c),EXCEPT);
  const r1=await ea.evaluate(()=>{document.getElementById('eaStart').click();return new Promise(r=>setTimeout(()=>{const d=document.getElementById('eaNcDlg');r({open:!!(d&&d.open),s:eaRunner.state(),b:d?document.getElementById('eaNcB').textContent:''});},250));});
  ok('EA10 Start session asks why, before anything runs',r1.open&&r1.s==='ready'&&/does not cover the experimental analysis/.test(r1.b),r1);
  const r2=await ea.evaluate(()=>{document.getElementById('eaNcOk').click();const still=document.getElementById('eaNcDlg').open;document.getElementById('eaNcNo').click();
    return new Promise(r=>setTimeout(()=>r({still,open:document.getElementById('eaNcDlg').open,s:eaRunner.state(),msg:document.getElementById('eaMsg').textContent}),200));});
  ok('EA11 no reason: it stays open; Cancel: nothing starts',r2.still&&!r2.open&&r2.s==='ready'&&/Not started/.test(r2.msg),r2);
  const r3=await ea.evaluate(async()=>{document.getElementById('eaStart').click();await new Promise(r=>setTimeout(r,200));
    document.getElementById('eaNcR').value='Team decision after the IEP meeting; parent to be called today (simulated)';document.getElementById('eaNcOk').click();await new Promise(r=>setTimeout(r,200));
    const s1=eaRunner.state();document.getElementById('eaTarget').click();document.getElementById('eaEnd').click();await new Promise(r=>setTimeout(r,300));
    const s2=eaRunner.state();document.getElementById('eaSave').click();await new Promise(r=>setTimeout(r,300));
    const n=+document.getElementById('nSess').value;let row=-1,note='';for(let i=0;i<n;i++){const v=document.querySelector('[name="s['+i+'].n"]');if(v&&/Run without IC-1 consent/.test(v.value)){row=i;note=v.value;}}
    return {s1,s2,s3:eaRunner.state(),dlg:document.getElementById('eaNcDlg').open,row,note};});
  ok('EA12 with a reason the session runs; saving writes the reason with that session, asked once',r3.s1==='run'&&r3.s2==='done'&&r3.s3==='ready'&&!r3.dlg&&r3.row>=0&&
    /Run without IC-1 consent for the experimental analysis: Team decision after the IEP meeting; parent to be called today \(simulated\)/.test(r3.note),r3);
  /* consent covered at the start, then the case says otherwise before Save */
  const r4=await ea.evaluate(async([full,ex])=>{nbhCase.apply(full);document.getElementById('eaStart').click();await new Promise(r=>setTimeout(r,200));const s1=eaRunner.state(),d1=document.getElementById('eaNcDlg').open;
    document.getElementById('eaEnd').click();await new Promise(r=>setTimeout(r,300));nbhCase.apply(ex);
    document.getElementById('eaSave').click();await new Promise(r=>setTimeout(r,200));const d2=document.getElementById('eaNcDlg').open;
    document.getElementById('eaNcR').value='Second reason (simulated)';document.getElementById('eaNcOk').click();await new Promise(r=>setTimeout(r,300));
    const n=+document.getElementById('nSess').value;let hit=0;for(let i=0;i<n;i++){const v=document.querySelector('[name="s['+i+'].n"]');if(v&&/Run without IC-1 consent for the experimental analysis: Second reason/.test(v.value))hit++;}
    return {s1,d1,d2,hit,s:eaRunner.state()};},[FULL,EXCEPT]);
  ok('EA13 consent covered at Start: no question; not covered by Save: Save asks and records it',r4.s1==='run'&&!r4.d1&&r4.d2&&r4.hit===1&&r4.s==='ready',r4);
  await ea.close();

  /* ---------------- CT-1 ---------------- */
  let ct=await open(CT,'CT-1');
  const c0=await ct.evaluate(()=>{const n=document.getElementById('ctConsentNote');return {h:n.hidden,t:n.textContent,np:n.classList.contains('noprint'),inSum:!!n.closest('.only-sum')};});
  ok('CT1 empty field: the notice shows on the Competency sheet, screen only, naming the two usual routes',!c0.h&&c0.np&&c0.inSum&&/not consent to carry out the plan at home/.test(c0.t)&&/Consent to implement the BIP/.test(c0.t)&&/parent counseling and training/.test(c0.t),c0);
  const c1=await ct.evaluate(c=>{nbhCase.apply(c);return {v:document.querySelector('[data-m="consent"]').value,m:S.meta.consent||'',h:document.getElementById('ctConsentNote').hidden};},LEGACY);
  ok('CT2 the assessment consent alone no longer fills "Consent for home programming"',c1.v===''&&c1.m===''&&!c1.h,c1);
  const c2=await ct.evaluate(c=>{const el=document.querySelector('[data-m="consent"]');el.value='9/1/2026 (Form IC-1; parent signed 9/3/2026)';el.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply(c);return {v:el.value,m:S.meta.consent,h:document.getElementById('ctConsentNote').hidden};},FULL);
  ok('CT3 an earlier fill from the assessment consent is replaced by the implementation consent; notice gone',c2.v==='BIP implementation consent 10/14/2026 (Form IC-1)'&&c2.m===c2.v&&c2.h,c2);
  await ct.close();
  ct=await open(CT,'CT-1');
  const c3=await ct.evaluate(c=>{const el=document.querySelector('[data-m="consent"]');el.value='9/1/2026 (Form IC-1)';el.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply(c);return {v:el.value,m:S.meta.consent,h:document.getElementById('ctConsentNote').hidden};},LEGACY);
  ok('CT4 an earlier automatic fill with no implementation consent in the case is cleared; notice shows',c3.v===''&&c3.m===''&&!c3.h,c3);
  const c4=await ct.evaluate(c=>{const el=document.querySelector('[data-m="consent"]');el.value='IEP of 9/20/2026 lists parent counseling and training';el.dispatchEvent(new Event('input',{bubbles:true}));
    nbhCase.apply(c);const n=document.getElementById('ctConsentNote');return {v:el.value,h:n.hidden,t:n.textContent};},EXCEPT);
  ok('CT5 a line typed by hand stays; the notice says the case has no implementation consent',c4.v==='IEP of 9/20/2026 lists parent counseling and training'&&!c4.h&&/has no consent to implement the BIP/.test(c4.t),c4);
  await ct.emulateMedia({media:'print'});
  const cp=await ct.evaluate(()=>getComputedStyle(document.getElementById('ctConsentNote')).display);
  ok('CT6 the notice does not print',cp==='none',cp);
  await ct.close();

  /* ---------------- DA-1 ---------------- */
  let da=await open(DA,'DA-1');
  const d0=await da.evaluate(()=>{const h0=document.getElementById('preFirst').hidden;const s=document.querySelector('[data-m="conseq"]');
    s.value=[...s.options].find(o=>/^Brief escape/.test(o.value)).value;s.dispatchEvent(new Event('change',{bubbles:true}));
    const h1=document.getElementById('preFirst').hidden;s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));
    const p=document.querySelector('[data-m="prompt"]');p.value=[...p.options].find(o=>/physical guidance/.test(o.value)&&/^Three/.test(o.value)).value;p.dispatchEvent(new Event('change',{bubbles:true}));
    return {h0,h1,h2:document.getElementById('preFirst').hidden,inA:!!document.getElementById('preFirst').closest('.only-assessment')};});
  ok('DA1 "Before the first session" shows on the Assessment sheet with the brief escape or physical guidance only',d0.h0&&!d0.h1&&!d0.h2&&d0.inA,d0);
  const d1=await da.evaluate(c=>{nbhCase.apply(c);return {c:document.querySelector('[data-m="preConsent"]').value,x:document.querySelector('[data-m="preCrisis"]').checked,m:S.meta.preCrisis};},
    Object.assign({},{consent:Object.assign({},EXCEPT.consent,{covered:['records','indirect','abc']})},{crisis:{precursor:'Pushing the desk (simulated)'}}));
  ok('DA2 consent from the case says IC-1 does not cover the demand assessment; the crisis-plan box is ticked',/^Consent on file since 10\/6\/2026, with exceptions: .*\(Form IC-1\); it does NOT cover the demand assessment/.test(d1.c)&&d1.x&&d1.m==='1',d1);
  const d1b=await da.evaluate(c=>{nbhCase.apply(c);return document.querySelector('[data-m="preConsent"]').value;},FULL);
  ok('DA3 the case changes: its own earlier line is replaced',d1b==='Consent on file since 10/6/2026 (Form IC-1); it covers the demand assessment',d1b);
  const d2=await da.evaluate(()=>{const set=(sel,v)=>{const e=document.querySelector(sel);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    set('[data-m="preAdmin"]','10/13/2026');set('[data-m="preAssent"]','Says "stop", pushes the work away (simulated)');
    document.getElementById('addSess').click();
    set('#sessTbl [data-f="stops"][data-i="0"]','2');set('#sessTbl [data-f="why"][data-i="0"]','Still upset after the calm pause');
    const h=document.querySelector('#sessTbl [data-f="hold"][data-i="0"]');h.click();
    return {sess:S.sess[0],meta:{a:S.meta.preAdmin,s:S.meta.preAssent},hdr:[...document.querySelectorAll('#sessTbl thead th')].map(t=>t.textContent)};});
  ok('DA4 the trial record keeps guidance stops, why it stopped early, and hold or injury reported',d2.sess.stops==='2'&&d2.sess.why==='Still upset after the calm pause'&&d2.sess.hold==='1'&&
    d2.hdr.includes('Guidance stops')&&d2.hdr.includes('Stopped early: why')&&d2.hdr.includes('Hold or injury: reported'),d2);
  /* save and open the file again */
  const saved=await da.evaluate(()=>JSON.stringify({form:'DA-1',rev:'2026-10',saved:new Date().toISOString(),S}));
  await da.close();da=await open(DA,'DA-1');
  await da.setInputFiles('#fileIn',{name:'DA-1_saved.json',mimeType:'application/json',buffer:Buffer.from(saved)});await sleep(500);
  const d3=await da.evaluate(()=>({c:document.querySelector('[data-m="preConsent"]').value,a:document.querySelector('[data-m="preAdmin"]').value,x:document.querySelector('[data-m="preCrisis"]').checked,
    s:document.querySelector('[data-m="preAssent"]').value,st:document.querySelector('#sessTbl [data-f="stops"][data-i="0"]').value,w:document.querySelector('#sessTbl [data-f="why"][data-i="0"]').value,
    h:document.querySelector('#sessTbl [data-f="hold"][data-i="0"]').checked,vis:!document.getElementById('preFirst').hidden}));
  ok('DA5 the new fields save and restore with the file',/covers the demand assessment/.test(d3.c)&&d3.a==='10/13/2026'&&d3.x&&/pushes the work away/.test(d3.s)&&d3.st==='2'&&d3.w==='Still upset after the calm pause'&&d3.h&&d3.vis,d3);
  await da.emulateMedia({media:'print'});
  const d4=await da.evaluate(()=>({b:getComputedStyle(document.getElementById('preFirst')).display,c:getComputedStyle(document.querySelector('#sessTbl [data-f="hold"][data-i="0"]')).display,
    w:document.getElementById('sessTbl').getBoundingClientRect().width,sh:document.querySelector('main.sheet').getBoundingClientRect().width}));
  ok('DA6 the block and the new columns print, the trial record within the page width',d4.b!=='none'&&d4.c!=='none'&&d4.w<=d4.sh+2,d4);
  await da.emulateMedia({media:'screen'});
  /* an older file: no new fields */
  const old=JSON.stringify({form:'DA-1',rev:'2026-10',saved:'2026-10-01T12:00:00Z',S:{meta:{client:'Mateo Rivera (simulated)',sid:'4471823',prompt:'Three-step: vocal, then model, then physical guidance, about 5 seconds apart'},
    tasks:[{name:'Math worksheet'},{name:'Copying sentences'},{name:'Sorting'}],sess:[{t:'0',date:'10/1',min:'5',given:'10',comp:'4',lat:'40',pb:'3',aff:'2',note:'older file'}],probes:[]}});
  await da.setInputFiles('#fileIn',{name:'DA-1_old.json',mimeType:'application/json',buffer:Buffer.from(old)});await sleep(500);
  const d5=await da.evaluate(()=>({c:document.querySelector('[data-m="preConsent"]').value,a:document.querySelector('[data-m="preAdmin"]').value,x:document.querySelector('[data-m="preCrisis"]').checked,
    st:document.querySelector('#sessTbl [data-f="stops"][data-i="0"]').value,h:document.querySelector('#sessTbl [data-f="hold"][data-i="0"]').checked,n:document.querySelector('#sessTbl [data-f="note"][data-i="0"]').value,
    vis:!document.getElementById('preFirst').hidden,sess:S.sess[0]}));
  ok('DA7 an older file opens with the new fields empty, its own data kept',d5.c===''&&d5.a===''&&!d5.x&&d5.st===''&&!d5.h&&d5.n==='older file'&&d5.vis&&d5.sess.stops===''&&d5.sess.hold==='',d5);
  /* the simulation still loads */
  await L.loadSim(da);await sleep(800);
  const d6=await da.evaluate(()=>({n:S.sess.length,why:S.sess[5].why,x:document.querySelector('[data-m="preCrisis"]').checked}));
  ok('DA8 the simulation loads with the stop rule\'s record filled',d6.n===18&&/calm pause/.test(d6.why)&&d6.x,d6);
  await da.close();

  ok('no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
