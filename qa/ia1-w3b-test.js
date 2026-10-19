/* Form IA-1, review Wave 3 part 2 (F45, I21): facts the case holds are not typed again on the Setup sheet. Each target's urgency
   (and frequency) from Form TB-1; the medications and health conditions from Form DM-1; the informants from the case by choice
   (DM-1's family contact and team, ST-1's staff) into empty informant rows; the family's home language beside the respondent
   page's language; the functional analysis's outcome from Form EA-1. DM-1 sends its team. Simulated data only. usage: node qa/ia1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async f=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  /* ---- DM-1 sends its team ---- */
  const dm=await open(file('DM-1_'));
  const team=await dm.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e.tagName==='SELECT'&&![...e.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=v;e.appendChild(o);}e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('t[0].name','Dana Whitfield (simulated)');s('t[0].role',[...document.querySelector('[name="t[0].role"]').options].map(o=>o.value).find(v=>/teacher/i.test(v))||'Teacher');s('t[0].contact','dana.whitfield@example.org, ext. 4410');
    s('t[1].name','Paula Brennan (simulated)');s('t[1].role',[...document.querySelector('[name="t[1].role"]').options].map(o=>o.value).find(v=>/para/i.test(v))||'Paraprofessional');s('t[1].contact','555-0142');
    return ((window.__nbhFactsOut()||{}).profile||{}).team;});
  ok('1 DM-1 sends its team: name, role, and the email when the contact holds one',Array.isArray(team)&&team.length===2&&team[0].name==='Dana Whitfield (simulated)'&&team[0].email==='dana.whitfield@example.org'&&/teacher/i.test(team[0].role)&&!('email' in team[1])&&/para/i.test(team[1].role),team);
  /* ---- IA-1 ---- */
  const ia=await open(file('IA-1_'));
  const F={behaviors:[{label:'Hitting (simulated)',def:'Striking another person with an open or closed hand.',urg:'4',src:'TB-1'},{label:'Elopement (simulated)',def:'Leaving the assigned area without permission.',urg:'2',src:'TB-1'},
      {label:'Asking for a break',def:'Hands the break card.',isRep:true,type:'Replacement',src:'TB-1'}],
    profile:{src:'DM-1',health:{meds:[{name:'Methylphenidate ER',dose:'27 mg',times:'8 AM'}],conditions:'Asthma (inhaler in the nurse’s office)',allergies:'Peanuts'},
      home:{name:'Ana Rivera',rel:'Mother',email:'ana.rivera@example.org',lang:'Spanish'},language:{home:'Spanish',interpreter:true},team:[{name:'Dana Whitfield (simulated)',role:'General education teacher',email:'dana.whitfield@example.org'},{name:'Paula Brennan (simulated)',role:'Paraprofessional'}]},
    staff:{people:[{name:'Iris Calloway (simulated)',role:'Paraprofessional'},{name:'Paula Brennan (simulated)',role:'Paraprofessional'}]}};
  const a=await ia.evaluate(F=>{const r=window.__nbhFactsIn(F);const g=n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:'';};
    const A=window.__ia1Targets,L=A.list();return {r,labels:L.map(x=>x.label),cur:g('m.beh'),freq:g('m.freq'),tx:g('m.tx'),med:g('m.med'),other:L.filter(x=>x.id!==A.cur()).map(x=>x.fields['m.freq'])};},F);
  ok('2 F45 each target\'s urgency from TB-1 (the target on screen and the other\'s record); the replacement is not a target',a.labels.join('|')==='Hitting (simulated)|Elopement (simulated)'&&a.cur==='Hitting (simulated)'&&a.freq==='4'&&a.other.join()==='2',a);
  ok('3 F45 the medications and the health conditions from DM-1 into their empty fields',a.tx==='Methylphenidate ER 27 mg, 8 AM (Form DM-1)'&&a.med==='Health record (Form DM-1): conditions: Asthma (inhaler in the nurse’s office); allergies: Peanuts'&&/the targets’ urgency, the health record and the analysis’s outcome from the case/.test(a.r.note||''),a);
  const sw=await ia.evaluate(()=>{const A=window.__ia1Targets,o=A.list().find(x=>x.id!==A.cur());A.switchTo(o.id);const v=document.querySelector('[name="m.freq"]').value;A.switchTo(A.list()[0].id);return v;});
  ok('4 F45 switching to the other target shows its urgency',sw==='2',sw);
  const b=await ia.evaluate(()=>{const box=document.getElementById('iaInfCase');return {hidden:box.hidden,items:[...box.querySelectorAll('label')].map(l=>l.textContent.replace(/\s+/g,' ').trim())};});
  ok('5 I21 "Informants from the case" lists the family contact, the team and the ST-1 staff once each, with role, email and a home language other than English',!b.hidden&&b.items.length===4&&
    b.items[0]==='Ana Rivera (Mother) · ana.rivera@example.org · Spanish Form DM-1'&&b.items[1]==='Dana Whitfield (simulated) (General education teacher) · dana.whitfield@example.org Form DM-1'&&b.items[2]==='Paula Brennan (simulated) (Paraprofessional) Form DM-1'&&b.items[3]==='Iris Calloway (simulated) (Paraprofessional) Form ST-1',b);
  const c=await ia.evaluate(async()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('inf[0].name','Typed informant (simulated)');
    const box=document.getElementById('iaInfCase');[...box.querySelectorAll('input[data-ip]')].forEach(cb=>{cb.checked=/Ana Rivera|Dana Whitfield|Iris Calloway/.test(cb.parentElement.textContent);});
    document.getElementById('iaInfAdd').click();await new Promise(r=>setTimeout(r,400));
    const n=+document.getElementById('nInf').value,rows=[];for(let i=0;i<n;i++){const g=f=>document.querySelector('[name="inf['+i+'].'+f+'"]').value;rows.push([g('name'),g('role'),g('email')].join('|'));}
    return {n,rows,msg:(document.getElementById('iaInfMsg')||{}).textContent||'',left:[...box.querySelectorAll('label')].map(l=>l.textContent.replace(/\s+/g,' ').trim())};});
  ok('6 I21 the ticked people go into the empty informant rows with role and email, the count grows to fit, a typed row is kept, and the list keeps only those not added',
    c.n===4&&c.rows[0]==='Typed informant (simulated)||'&&c.rows[1]==='Ana Rivera|Mother|ana.rivera@example.org'&&c.rows[2]==='Dana Whitfield (simulated)|General education teacher|dana.whitfield@example.org'&&c.rows[3]==='Iris Calloway (simulated)|Paraprofessional|'&&/3 informants added\./.test(c.msg)&&c.left.length===1&&/^Paula Brennan/.test(c.left[0]),c);
  /* ---- the home language beside the respondent page's language ---- */
  const d=await ia.evaluate(()=>{const n=document.getElementById('iaLangCase');const sel=document.getElementById('rpLang');const a={hidden:n.hidden,t:n.textContent};sel.value='es';sel.dispatchEvent(new Event('change',{bubbles:true}));const b=n.hidden;sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));return {a,b};});
  ok('7 I21 the respondent page dialog names the family\'s home language beside the page\'s language until Español is chosen',!d.a.hidden&&d.a.t==='The family’s home language is Spanish (Form DM-1): choose Español for the page the parent answers.'&&d.b===true,d);
  /* ---- only empty fields; a second pass ---- */
  const e=await ia.evaluate(F=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('m.tx','Typed (simulated)');s('m.freq','3');
    const r=window.__nbhFactsIn(F);return {tx:document.querySelector('[name="m.tx"]').value,freq:document.querySelector('[name="m.freq"]').value,r};},F);
  ok('8 F45 what is typed is kept, and a second pass fills nothing',e.tx==='Typed (simulated)'&&e.freq==='3'&&!/urgency, the health record/.test((e.r&&e.r.note)||''),e);
  /* ---- the panel does not print ---- */
  await ia.emulateMedia({media:'print'});const pr=await ia.evaluate(()=>getComputedStyle(document.getElementById('iaInfCase')).display);await ia.emulateMedia({media:'screen'});
  ok('9 I21 the list of people from the case does not print',pr==='none',pr);
  const ia2=await open(file('IA-1_'));const f2=await ia2.evaluate(()=>{window.__nbhFactsIn({behaviors:[{label:'Hitting',def:'x',urg:'3'}]});return {hidden:document.getElementById('iaInfCase').hidden,freq:document.querySelector('[name="m.freq"]').value,lang:(document.getElementById('iaLangCase')||{hidden:true}).hidden};});
  ok('10 F45 I21 with no people and no home language in the case, no list and no note',f2.hidden&&f2.freq==='3'&&f2.lang,f2);
  const fa=await ia2.evaluate(()=>{const ev={'EA-1':{form:'EA-1',method:'Functional analysis (Multielement)',design:'Multielement',from:'2026-09-28',to:'2026-10-09',fn:'Escape',fnKey:'escape',strength:'Strong'}};
    const r=window.__nbhFactsIn({behaviors:[{label:'Hitting',def:'x',urg:'3'}],evidence:ev});const g=n=>document.querySelector('[name="'+n+'"]').value;return {out:g('fa.out'),date:g('fa.date'),design:g('fa.design'),note:(r&&r.note)||''};});
  const fa2=await ia.evaluate(()=>{window.__nbhFactsIn({evidence:{'EA-1':{fnKey:'escape',design:'Multielement',to:'2026-10-09'}}});return document.querySelector('[name="fa.out"]').value;});
  ok('11 F45 the functional analysis\'s outcome, design and last date from EA-1 into the empty FA outcome of a one-target file; a file of several targets is left for the BCBA',
    fa.out==='escape'&&fa.date==='10/9/2026'&&fa.design==='Multielement (Iwata et al., 1982/1994)'&&/the analysis’s outcome/.test(fa.note)&&fa2==='',{fa,fa2});
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
