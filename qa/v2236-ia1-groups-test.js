/* v22.36 Form IA-1's results by group. A team of eight (five school staff whose FAST answers point to escape, three at home
   pointing to attention or tangible): up to twelve informants; each informant's setting read from the role (or chosen) and
   their named groups; the Results by Group table (all, school, home, the named groups, an analysis made from chosen
   informants) counted by the convergence sheet's rule, with groups under 3 informants flagged; the groups that differ named;
   a worksheet's Analyze narrows its totals, verdict and agreement to one group; the analyses ticked "In the case" go out
   with the evidence, the main one marked, and its leading category fills the indirect hypothesis while it is empty; all of
   it kept in the file. Form FS-1 lists each analysis on its evidence table (once); Form TD-1 shows the groups and that
   they differ. Simulated people only.
   usage: node qa/v2236-ia1-groups-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const TEAM=[['Dana Whitfield','Classroom teacher','Classroom teachers'],['Paula Brennan','Paraprofessional','Classroom teachers'],['Iris Calloway','Art teacher','Fine arts'],
  ['Jordan Lee (simulated)','Music teacher','Fine arts'],['Casey Morgan (simulated)','ESE coordinator',''],['Ana Rivera','Parent',''],['Ms. A (simulated)','Home ABA provider',''],['Mr. B (simulated)','Grandparent','']];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',acceptDownloads:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('IA-1: '+e.message));await p.goto(L.BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html');await sleep(1500);
  ok('1 up to twelve informants',await p.evaluate(()=>document.getElementById('nInf').max==='12'));
  await p.evaluate(()=>{const n=document.getElementById('nInf');n.value=8;n.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  await p.evaluate(T=>{const set=(nm,v)=>{const e=document.querySelector('[name="'+nm+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('m.beh','Elopement (simulated)');
    T.forEach((t,i)=>{set(`inf[${i}].name`,t[0]);set(`inf[${i}].role`,t[1]);if(t[2])set(`inf[${i}].grp`,t[2]);});
    for(let r=0;r<8;r++)for(let it=1;it<=16;it++){const y=r<5?(it>=5&&it<=8):(it>=1&&it<=4&&it!==3);set(`fast[${r}][${it}]`,y?'Y':'N');}},TEAM);
  await sleep(500);
  const g=await p.evaluate(()=>[...document.querySelectorAll('#anGrp tbody tr')].map(tr=>tr.querySelector('select').selectedOptions[0].textContent));
  ok('2 each informant\u2019s setting from the role: five school, three home (parent, home ABA provider, grandparent)',JSON.stringify(g)===JSON.stringify(Array(5).fill('From the role: School').concat(Array(3).fill('From the role: Home'))),g);
  const rows=()=>p.evaluate(()=>[...document.querySelectorAll('#anTbl tbody tr')].map(tr=>({k:tr.dataset.ank,who:tr.cells[1].textContent,cons:tr.cells[2].textContent.replace(/\s+/g,' ').trim()})));
  let R=await rows();const by=k=>R.find(x=>x.k===k)||{};
  ok('3 the table: all informants, school, home, and the two named groups',['all','school','home','g:classroom teachers','g:fine arts'].every(k=>R.some(x=>x.k===k))&&R.length===5,R);
  ok('4 all informants: escape, 5 of 8; school: escape, 5 of 5; home: attention and tangible tied, 3 of 3',/^Escape: 5 of 8/.test(by('all').cons)&&/^Escape: 5 of 5/.test(by('school').cons)&&/tie: Attention and Tangible \(3 of 3/.test(by('home').cons),R);
  ok('5 a group of two is marked as too few for consensus',/fewer than 3 informants/.test(by('g:fine arts').cons)&&by('g:fine arts').who==='C, D',by('g:fine arts'));
  const v=await p.evaluate(()=>document.getElementById('anVerdict').textContent);
  ok('6 the groups that differ are named (school escape; home attention or tangible)',/different functions: School escape; Home attention or tangible/.test(v),v);
  /* Analyze: the FAST for home only */
  await p.evaluate(()=>{const s=document.querySelector('[data-an-view="fast"]');s.value='home';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const fv=await p.evaluate(()=>({cols:[...document.querySelectorAll('#fastTot thead th')].map(t=>t.textContent).join(','),ver:document.getElementById('fastVerdict').textContent,
    dim:[...document.querySelectorAll('#fastGrid tbody tr:first-child td')].slice(2,10).map(td=>td.classList.contains('an-x')?1:0).join('')}));
  ok('7 Analyze for Home: the FAST totals, verdict and agreement are for F, G, H; the other columns are dimmed',fv.cols==='Category,F,G,H'&&/Analyzed for Home: informants F, G, H/.test(fv.ver)&&/agreement 100\.0%/.test(fv.ver)&&fv.dim==='11111000',fv);
  /* a setting chosen over the role, and an analysis made from chosen informants */
  await p.evaluate(()=>{const e=document.querySelector('[name="inf[4].where"]');e.value='Community';e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  R=await rows();ok('8 a setting chosen over the role (E: Community) moves the informant',by('school').who==='A, B, C, D'&&by('community').who==='E',R);
  await p.click('#viewSeg button[data-view="summary"]');await sleep(200);await p.click('#anNew');await p.fill('#anNewName','Leadership and coordinator');await p.check('[data-an-pick="0"]');await p.check('[data-an-pick="4"]');await p.click('#anNewAdd');await sleep(200);
  R=await rows();const cu=R.find(x=>/^c:/.test(x.k));
  ok('9 New analysis from chosen informants (A and E)',cu&&cu.who==='A, E',R);
  /* in the case, and the main analysis */
  await p.evaluate(()=>{['school','home'].forEach(k=>{const c=document.querySelector('[data-an-use="'+k+'"]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});
    const fn=document.querySelector('[name="m.fn"]');fn.value='';fn.dispatchEvent(new Event('input',{bubbles:true}));
    const m=document.getElementById('anMainSel');m.value='home';m.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const ev=await p.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.evidence?o.evidence.groups:null;});
  ok('10 the analyses ticked go out with the evidence (all, school, home), the main one marked; school (4 of 4) Moderate',ev&&ev.map(x=>x.key).join(',')==='all,school,home'&&ev.find(x=>x.key==='home').main&&ev.find(x=>x.key==='school').fnKey==='escape'&&ev.find(x=>x.key==='school').strength==='Moderate',ev);
  /* the main analysis fills the indirect hypothesis while it is empty: home is a tie (no single category), school leads escape */
  await p.evaluate(()=>{const m=document.getElementById('anMainSel');m.value='school';m.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  ok('11 the main analysis\u2019s leading category fills the empty indirect hypothesis (school: escape)',await p.evaluate(()=>document.querySelector('[name="m.fn"]').value)==='escape');
  /* kept in the file */
  const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>document.getElementById('saveBtn').click())]);
  const fp=require('path').join(require('os').tmpdir(),'ia1-groups-'+process.pid+'.json');await dl.saveAs(fp);
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('IA-1 opened: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html');await sleep(1200);
  await q.setInputFiles('#fileIn',fp);await sleep(1200);require('fs').unlinkSync(fp);
  const back=await q.evaluate(()=>({rows:[...document.querySelectorAll('#anTbl tbody tr')].map(tr=>tr.dataset.ank).join(','),use:[...document.querySelectorAll('[data-an-use]:checked')].map(c=>c.dataset.anUse).join(','),
    main:document.getElementById('anMainSel').value,view:document.querySelector('[data-an-view="fast"]').value,grp:document.querySelector('[name="inf[2].grp"]').value,where:document.querySelector('[name="inf[4].where"]').value}));
  ok('12 saved and opened again: the groups, settings, the analysis made, the ticks, the main one and the FAST view',/c:/.test(back.rows)&&back.use==='all,school,home'&&back.main==='school'&&back.view==='home'&&back.grp==='Fine arts'&&back.where==='Community',back);
  /* print: the table prints, with the ticks as Yes */
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const c=document.querySelector('#anTbl input[type=checkbox]'),y=document.querySelector('#anTbl .an-pr');return {cb:getComputedStyle(c).display,yes:getComputedStyle(y).display,txt:y.textContent};});
  await p.emulateMedia({media:'screen'});
  ok('13 on paper the ticks read Yes',pr.cb==='none'&&pr.yes!=='none'&&pr.txt==='Yes',pr);
  /* Form FS-1: a row each */
  const evAll=await p.evaluate(()=>window.__nbhFactsOut().evidence);
  const f=await ctx.newPage();f.on('pageerror',e=>errs.push('FS-1: '+e.message));await f.goto(L.BASE+'/NBH-Workstation/FS-1_FBA-Summary-Report_v2026-09.html');await sleep(1200);
  const fs=await f.evaluate(ev=>{window.__nbhFactsIn({evidence:{'IA-1':ev}});const a=S.src.filter(r=>r.form==='IA-1').map(r=>r.contrib.slice(0,60));window.__nbhFactsIn({evidence:{'IA-1':ev}});return {a,b:S.src.filter(r=>r.form==='IA-1').length};},evAll);
  ok('14 Form FS-1: the assessment\u2019s row and a row each for school and home, not added twice',fs.a.length===3&&fs.a.some(x=>/^School \(A, B, C, D\): Escape/.test(x))&&fs.a.some(x=>/^Home \(F, G, H\): tie/.test(x))&&fs.b===3,fs);
  /* Form TD-1: the groups, and that they differ */
  const t=await ctx.newPage();t.on('pageerror',e=>errs.push('TD-1: '+e.message));await t.goto(L.BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(1200);
  const groupsDiffer=JSON.parse(JSON.stringify(evAll));groupsDiffer.groups.find(x=>x.key==='home').fnKey='attention';groupsDiffer.groups.find(x=>x.key==='home').n=3;groupsDiffer.groups.find(x=>x.key==='school').n=4;
  const td=await t.evaluate(ev=>{window.__nbhFactsIn({evidence:{'IA-1':ev}});const b=document.getElementById('tdByGroup');return b?{t:b.textContent,print:b.classList.contains('noprint')}:null;},groupsDiffer);
  ok('15 Form TD-1 shows each group\u2019s result and that they point to different functions (on screen)',td&&/School/.test(td.t)&&/Home/.test(td.t)&&/different functions/.test(td.t)&&td.print,td);
  ok('16 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
