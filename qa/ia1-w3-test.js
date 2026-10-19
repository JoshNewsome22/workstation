/* Form IA-1, review Wave 3: no photo on the pages without DM-1's permission (F40); the PBQ's own level (F42); no consensus under three
   informants (F43); the FAST's N/A rule on the page (F46); safer analyses for dangerous behavior (F47); the social-positive verdict's
   count and hedge (F48); no video from a student's case (F49); the label is the initials only. Simulated data only.
   usage: node qa/ia1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('IA-1_'));await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});
  const set=(n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector(`[name="${n}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
  await set('m.client','Georgi Sample');await set('m.sid','12345');await set('m.assessor','J. Ellis, BCBA');await set('m.email','bcba@example.org');await set('m.beh','Hitting');await set('m.def','Open-hand contact with an adult.');
  const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  await p.evaluate(png=>{const e=document.querySelector('[name="rp.photo"]');e.value=png;e.dispatchEvent(new Event('input',{bubbles:true}));},PNG);
  /* ---- F40 ---- */
  const perm=async w=>{await p.evaluate(w=>{nbhCase.facts={profile:{flags:{photo:w}}};window.__nbhFactsIn({profile:{flags:{photo:w}}});},w);await sleep(150);
    return p.evaluate(()=>{const q=__rp.quiet('fast',{label:'Hitting',def:'Open-hand contact with an adult.'})||{};const a=document.getElementById('rpPhotoPerm'),b=document.getElementById('outPhotoPerm');
      return {photo:!!q.photo,student:q.student,note:a.hidden?'':a.textContent,out:b.hidden?'':b.textContent};});};
  const pNo=await perm('No'),pUnk=await perm('Unknown'),pYes=await perm('Yes');
  ok('1 F40 with no photo permission on DM-1 the pages carry no photo, and both the dialog and the Send-outs sheet say so; Unknown asks for a check; Yes sends it',
    !pNo.photo&&/records no photo or media permission: the pages show the student by initials only/.test(pNo.note)&&pNo.out===pNo.note&&pUnk.photo&&/check it before a page carries/.test(pUnk.note)&&pYes.photo&&pYes.note==='',{pNo,pUnk,pYes});
  ok('2 the page labels the student by initials only, without the student number',pYes.student==='G.S.',pYes.student);
  /* ---- F46 ---- */
  const i1=await p.evaluate(()=>(__rp.quiet('fast',{label:'Hitting',def:'x'})||{}).instructions||'');
  await p.evaluate(()=>{const e=document.querySelector('[name="rp.lang"]');if(e){e.value='es';e.dispatchEvent(new Event('input',{bubbles:true}));}});
  const i2=await p.evaluate(()=>(__rp.quiet('fast',{label:'Hitting',def:'x'})||{}).instructions||'');
  await p.evaluate(()=>{const e=document.querySelector('[name="rp.lang"]');if(e){e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));}});
  const sheet=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('3 F46 the FAST page and sheet give the FAST\'s own rule: yes or no, and N/A when uncertain (the Spanish page keeps its reviewed words)',
    /^Answer each question Yes or No\. If you are uncertain about an answer, choose N\/A/.test(i1)&&i2===''&&/when the informant is uncertain about an answer, N\/A \(Iwata, DeLeon & Roscoe, 2013\)/.test(sheet),{i1,i2});
  /* ---- F42 ---- */
  for(let it=1;it<=15;it++)await set(`pbq[0][${it}]`,[1,9,13].includes(it)?'2':'0');await sleep(300);
  const pb=await p.evaluate(()=>[...document.querySelectorAll('#convTbl tbody tr')].filter(r=>r.cells.length>=6&&/PBQ/.test(r.cells[0].textContent)).map(r=>r.cells[5].textContent));
  ok('4 F42 a PBQ column of three items each at 2 is not an outcome: no item reaches the published profile\'s level of 3',pb.length===1&&/weak \(no item at 3 or higher in the leading column \(the PBQ profile's level\)\)/.test(pb[0]),pb);
  ok('5 F42 the sheet and the Guide state the published reading',/a leading column with no item at 3 or higher is not counted here \(Lewis, Scott & Sugai, 1994\)/.test(sheet)&&/this form counts a column only when one of its items reaches 3/.test(sheet),'text');
  /* ---- F43 ---- */
  for(let it=1;it<=16;it++)await set(`fast[0][${it}]`,it>=5&&it<=8?'Y':'N');await sleep(400);
  const cv=await p.evaluate(()=>({tag:(document.querySelector('#convVerdict .tag')||{}).textContent||'',fn:document.querySelector('[name="m.fn"]').value,st:(window.__nbhFactsOut()||{}).evidence}));
  ok('6 F43 one informant\'s outcome is not called consensus, the hypothesis field waits for the assessor, and the evidence says "informant outcomes"',
    /Escape.*: 1 of 1 informant with an outcome \(no consensus possible under 3\)/.test(cv.tag)&&cv.fn===''&&cv.st&&/Informant outcomes: /.test(cv.st.statement)&&!/Informant consensus/.test(cv.st.statement)&&cv.st.strength!=='Moderate',cv);
  /* ---- F47, F48 ---- */
  const src=await p.evaluate(()=>document.documentElement.innerHTML);
  ok('7 F47 dangerous behavior points to a latency-based, trial-based or precursor analysis on EA-1 with CR-1 in place, on the Decision and in the Guide',
    /for dangerous behavior a latency-based, trial-based or precursor analysis on Form EA-1, with the crisis plan \(Form CR-1\) in place first/.test(src)&&/latency-based \(Thomason-Sassi, Iwata, Neidert &amp; Roscoe, 2011\)/.test(src)&&!/Full multielement functional analysis \(informants disagree, weak differentiation, escape hypothesis, or dangerous behavior\)/.test(src),'text');
  ok('8 F48 the social-positive verdict carries the count and the hedge',/matched the functional analysis in 7 of 7 cases: a single-function test with a matched control \(Iwata &amp; Dozier, 2008\) may be enough to verify/.test(src)&&!/is a defensible verification/.test(src),'text');
  /* ---- F49 ---- */
  await set('m.client','Ana Rivera');
  await p.evaluate(()=>document.getElementById('wkVideo').click());await sleep(300);
  const v1=await p.evaluate(()=>({note:document.getElementById('wkVideoNote').textContent,dlg:!!document.querySelector('.wkv-dlg')}));
  await set('m.client','SIMULATED – Sample Student');await set('m.sid','SIM-000');
  await p.evaluate(()=>{document.getElementById('wkVideoNote').textContent='';document.getElementById('wkVideo').click();});await sleep(300);
  const v2=await p.evaluate(()=>{const d=document.querySelector('.wkv-dlg');const r={dlg:!!d,note:document.getElementById('wkVideoNote').textContent};if(d){const x=d.querySelector('.wkv-x');if(x)x.click();}return r;});
  ok('9 F49 Save as video is refused while the form holds a student\'s case, and allowed for the worked example',/holds a student’s case, which the video would carry/.test(v1.note)&&!v1.dlg&&(v2.dlg||typeof VideoEncoder==='undefined')&&!/holds a student/.test(v2.note),{v1,v2});
  ok('10 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
