/* Form IN-1, review Wave 3: the packet leaves the interview hypothesis out (F51); the student's interview is Form SI-1's and a
   student page waits for assent (F53); written answers counted apart (F54); the consent date and a respondent dated before it
   (F55); the label is the initials only (F56); how often each informant sees the student (F57). Simulated data only.
   usage: node qa/in1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('IN-1_'));await sleep(1000);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}
    const o=URL.createObjectURL;window.__dl=[];URL.createObjectURL=b=>{const r={text:null};window.__dl.push(r);b.text().then(t=>{r.text=t;});return o(b);};
    HTMLAnchorElement.prototype.click=function(){if(this.download&&window.__dl.length)window.__dl[window.__dl.length-1].name=this.download;};});
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(800);
  /* ---- F51 ---- */
  await p.evaluate(()=>{window.__dl=[];[...document.querySelectorAll('button')].find(b=>b.textContent==='Save packet').click();});await sleep(500);
  const pk=await p.evaluate(()=>window.__dl[0]);const pj=pk&&pk.text?JSON.parse(pk.text):{};const hint=await p.evaluate(()=>document.querySelector('[data-m="fn"]').closest('td').textContent);
  ok('1 F51 the student packet carries the student and the behavior but not the interview hypothesis; the hint says how the hypothesis travels',
    !!pk&&JSON.stringify(pj).indexOf('"fn"')<0&&/SIMULATED/.test(JSON.stringify(pj))&&/through the case as a weak, tier-4 source; the student packet does not carry it/.test(hint),{pj,hint:hint.slice(-200)});
  /* ---- F54 ---- */
  const fmt=(i,v)=>p.evaluate(([i,v])=>{const e=document.querySelector(`[data-r="${i}"][data-f="fmt"]`);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));},[i,v]);
  const meth=()=>p.evaluate(()=>window.__nbhFactsOut().evidence.method);
  const m0=await meth();await fmt(3,'Written (respondent page)');await fmt(1,'Written (respondent page)');const m1=await meth();
  const card=await p.evaluate(()=>document.getElementById('convMetrics').textContent);
  for(const i of [0,2,4])await fmt(i,'Written (respondent page)');const m2=await meth();
  for(const [i,v] of [[0,'Face to face'],[1,'Face to face'],[2,'Face to face'],[3,'Virtual'],[4,'Face to face']])await fmt(i,v);
  ok('2 F54 written answers are counted apart from interviews in the evidence and the metrics',m0==='Stakeholder interviews (indirect)'&&m1==='Stakeholder interviews (indirect): 3 interviewed, 2 answered in writing'
    &&/2 answered in writing, not interviewed/.test(card)&&m2==='Written stakeholder questionnaires (indirect)',{m0,m1,m2,card:card.slice(0,200)});
  /* ---- F55 ---- */
  const iso=await p.evaluate(()=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(S.resp[2].d);return '20'+m[3]+'-'+('0'+m[1]).slice(-2)+'-'+('0'+m[2]).slice(-2);});
  await p.evaluate(iso=>window.__nbhFactsIn({consent:{state:'Current',on:true,obtained:iso,date:iso}}),iso);await sleep(200);
  const c1=await p.evaluate(()=>({row:document.getElementById('inConsentRow').hidden,txt:document.getElementById('inConsent').textContent,v:document.getElementById('respVerdict').innerText}));
  ok('3 F55 the consent from Form IC-1 is on the Setup sheet, and each respondent dated before it is named',c1.row===false&&/^Consent on file since \d+\/\d+\/\d{4} \(Form IC-1\)$/.test(c1.txt)
    &&/Respondent 1 \(Simulated parent\) is dated before consent was obtained/.test(c1.v)&&/Respondent 2 \(Simulated teacher\) is dated before consent/.test(c1.v)&&!/Respondent 3 \(Simulated aide\) is dated before/.test(c1.v),c1);
  /* ---- F53 ---- */
  const guide=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('4 F53 a student respondent is pointed to Form SI-1 for the student\'s own interview, on Setup and in the Guide',/The student’s own interview, with the assent plan and the student’s hypothesis for the report, is Form SI-1\. Use this set only when the district form is required, and record assent on SI-1 first\./.test(c1.v)
    &&/The student’s own interview for the report, with the assent plan and the student’s hypothesis, is Form SI-1: use this set when the district form is required, after assent is recorded there\./.test(guide),c1.v.slice(-300));
  /* ---- F56 ---- */
  await p.evaluate(()=>document.getElementById('rpBtn').click());await sleep(300);
  const l1=await p.evaluate(()=>document.getElementById('rpStudent').value);
  await p.evaluate(()=>{const c=document.getElementById('rpSid');c.checked=true;c.dispatchEvent(new Event('change'));});const l2=await p.evaluate(()=>document.getElementById('rpStudent').value);
  await p.evaluate(()=>{const c=document.getElementById('rpSid');c.checked=false;c.dispatchEvent(new Event('change'));});const l3=await p.evaluate(()=>document.getElementById('rpStudent').value);
  ok('5 F56 the page\'s student label is the initials only; the student number is added only when ticked',l1==='S.S.S.'&&l2==='S.S.S. (ID SIM-000)'&&l3==='S.S.S.',{l1,l2,l3});
  const st=await p.evaluate(()=>{const em=document.getElementById('rpEmail');em.value='bcba@example.org';em.dispatchEvent(new Event('input'));const s=document.getElementById('rpInst');s.value='student';s.dispatchEvent(new Event('change'));const w=document.getElementById('rpWord');w.value='hit';w.dispatchEvent(new Event('input'));
    const a={dis:document.getElementById('rpSave').disabled,why:document.getElementById('rpStatus').textContent,row:document.getElementById('rpAssentRow').style.display};
    const c=document.getElementById('rpAssent');c.checked=true;c.dispatchEvent(new Event('change'));a.after=document.getElementById('rpSave').disabled;return a;});
  ok('6 F53 a student page waits for the assent recorded on Form SI-1',st.dis&&/Record the student’s assent on Form SI-1 first/.test(st.why)&&st.row===''&&st.after===false,st);
  await p.evaluate(()=>document.getElementById('rpDlg').close());
  /* ---- F57 ---- */
  const f57=await p.evaluate(()=>({head:[...document.querySelectorAll('#respTbl thead th')].map(t=>t.textContent),see:document.querySelector('[data-r="3"][data-f="see"]').value,know:document.querySelector('[data-r="3"][data-f="know"]').value,
    conv:document.querySelector('#convTbl thead').textContent}));
  ok('7 F57 the Respondents table asks how often each person sees the student and since when, and the convergence table shows it under each name',
    f57.head.includes('Sees the student')&&f57.head.includes('Known since; settings')&&f57.see==='Less often'&&/two in six weeks/.test(f57.know)&&/sees the student less often · Since September; speech sessions, two in six weeks/.test(f57.conv),f57);
  await p.evaluate(()=>{const e=document.querySelector('[data-r="0"][data-f="see"]');e.value='Weekly';e.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.evaluate(()=>{window.__dl=[];document.getElementById('saveBtn').click();});await sleep(500);
  const sv=await p.evaluate(()=>window.__dl[0]&&window.__dl[0].text);const sj=sv?JSON.parse(sv):{};const rs=(sj.S||sj).resp||[];
  ok('8 F57 the two answers are saved with the respondent',rs[0]&&rs[0].see==='Weekly'&&/Since birth/.test(rs[0].know||''),rs[0]);
  ok('9 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
