/* v24.28 Form ABC-1 from the independent review (R-025, R-059, R-060, R-061, R-129, R-130; E-26, E-27, E-45): the analysis opens on
   one topography and names a pooled verdict; the per-topography table; undefined ratios read as dashes and thin rows sort last; the
   strongest pairings need five incidents; the incident row opens as a card on a narrow screen; the classroom sheet; the simulation's
   narratives follow their codes; the EO tags stay on paper with a reason.
   usage: node qa/abc128-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(ctx)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(URL);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{return t0&&t0(m,o);}catch(e){}};});return p;};
 const tab=(p,id)=>p.evaluate(id=>{document.getElementById('tab-'+id).click();},id);
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 let p=await open(ctx);
 await p.evaluate(()=>document.getElementById('load-demo').click());await sleep(2500);
 await tab(p,'analysis');await sleep(800);
 /* ---- R-025 one topography by default; the pool named ---- */
 const a1=await p.evaluate(()=>{const sel=document.getElementById('a-behavior'),out=document.getElementById('analysis-out');
   const counts=behaviorCounts(state.entries.filter(e=>e.mode!=='open'));
   return {val:sel.value,top:counts[0].item.id,n:counts.length,note:document.getElementById('a-topo').textContent,pooled:!!out.querySelector('.abc-pooled'),single:/A single topography is selected/.test(out.textContent),
     hint:[...out.querySelectorAll('.card header .hint')].map(h=>h.textContent).find(t=>/ranking of hypotheses/.test(t))||'',topo:!!out.querySelector('table.abc-topo')};});
 ok('after Load simulation the analysis opens on the most frequent topography (no case target in the record), the note reads "1 of N topographies", and no pooled banner shows',a1.val===a1.top&&a1.n>=5&&a1.note==='1 of '+a1.n+' topographies in the record'&&!a1.pooled&&a1.single&&!/pooled/.test(a1.hint),a1);
 ok('the By topography table is there with one behavior selected (it reads the whole record)',a1.topo,a1);
 const a2=await p.evaluate(async()=>{const sel=document.getElementById('a-behavior');sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,600));
   const out=document.getElementById('analysis-out'),g=out.querySelector('.abc-pooled');const tb=out.querySelector('table.abc-topo');
   const rows=[...tb.querySelectorAll('tbody tr')].map(tr=>({name:tr.children[0].textContent.trim(),n:+tr.children[1].textContent,lead:tr.children[6].textContent.trim(),thin:tr.classList.contains('thin'),leadCells:tr.querySelectorAll('td.lead').length}));
   return {pooled:!!g,text:g&&g.textContent,role:g&&g.getAttribute('role'),note:document.getElementById('a-topo').textContent,hint:[...out.querySelectorAll('.card header .hint')].map(h=>h.textContent).find(t=>/ranking of hypotheses/.test(t))||'',rows,verdict:(out.querySelector('.abc-topo-v')||{}).textContent||'',aPooled:state.aPooled};});
 ok('All behaviors pooled is a choice: the banner names the count and TB-1’s rule, the summary card says pooled, the note says pooled',a2.pooled&&a2.role==='status'&&new RegExp('Pooled across '+a1.n+' topographies').test(a2.text)&&/Beavers/.test(a2.text)&&/pooled across \d+ topographies/.test(a2.hint)&&/pooled across \d+ topographies/.test(a2.note)&&a2.aPooled===true,a2);
 ok('the By topography table has a row per topography (n, the four classes, which leads), thin rows under five marked, and a line saying whether they agree',a2.rows.length===a1.n&&a2.rows.every(r=>r.n>0&&(r.thin?r.n<5:r.n>=5)&&(/^—/.test(r.lead)||r.leadCells===1))&&/(agree|disagree)/.test(a2.verdict),a2);
 /* reload keeps the analyst's choice; Reset goes back to one topography */
 const a3=await p.evaluate(async()=>{refreshAll();await new Promise(r=>setTimeout(r,300));const kept=document.getElementById('a-behavior').value;
   document.getElementById('a-reset').click();await new Promise(r=>setTimeout(r,500));return {kept,after:document.getElementById('a-behavior').value,aPooled:state.aPooled};});
 ok('a re-render keeps the pool once chosen; Reset filters goes back to one topography',a3.kept===''&&a3.after===a1.top&&a3.aPooled===false,a3);
 /* ---- R-059 undefined ratios, thin rows last, five-incident pairings ---- */
 const c1=await p.evaluate(()=>{const sel=document.getElementById('a-behavior');sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));return new Promise(r=>setTimeout(()=>{
   const out=document.getElementById('analysis-out');const h=[...out.querySelectorAll('.card header h2')].find(x=>/Conditional probability of each consequence/.test(x.textContent));const card=h.closest('.card');
   const rows=[...card.querySelectorAll('table tbody tr')].map(tr=>({name:tr.children[0].textContent.trim(),pbc:tr.children[2].textContent.trim(),cpup:tr.children[4].textContent.trim(),camp:tr.children[5].textContent.trim(),n:+(tr.children[1].textContent.match(/\((\d+)\//)||[])[1]}));
   const S=analysisSet(),cs=consequenceStats(S.coded,S.samples).filter(r=>r.n>0);const noBase=cs.filter(r=>r.noBase).map(r=>r.item.label);
   const h2=[...out.querySelectorAll('.card header h2')].find(x=>/Contingency space/.test(x.textContent));const st=h2?[...h2.closest('.card').querySelectorAll('table tbody tr')].map(tr=>({name:tr.children[0].textContent.trim(),thin:/thin/.test(tr.children[10].textContent)})):[];
   const h4=[...out.querySelectorAll('h4')].find(x=>/Strongest antecedent/.test(x.textContent));const pr=h4?[...h4.nextElementSibling.querySelectorAll('tbody tr')].map(tr=>+(tr.children[2].textContent.match(/\((\d+)\//)||[])[1]):null;
   r({rows,noBase,st,pr});},600));});
 const nb=c1.rows.filter(r=>c1.noBase.includes(r.name));
 ok('a consequence never seen in a no-behavior check shows — for p(B|C) and CP:UP and says so, instead of 100% and 138',c1.noBase.length>=1&&nb.length===c1.noBase.length&&nb.every(r=>r.pbc==='—'&&r.cpup==='—'&&/undefined/.test(r.camp)&&/never seen in a no-behavior check/.test(r.camp)),{nb,noBase:c1.noBase});
 const firstNB=c1.rows.findIndex(r=>c1.noBase.includes(r.name)),lastOK=c1.rows.map((r,i)=>c1.noBase.includes(r.name)||r.n<5?-1:i).filter(i=>i>=0).pop();
 ok('rows without a base rate and thin rows sort last in the consequence table, and thin rows last in the strength table',firstNB>lastOK&&(c1.st.length===0||c1.st.map(r=>r.thin).every((t,i,a)=>!(t&&a.slice(i).some(x=>!x)))),{order:c1.rows.map(r=>r.name+(c1.noBase.includes(r.name)?'*':'')+r.n),st:c1.st});
 ok('every Strongest pairing rests on five or more shared incidents',c1.pr&&c1.pr.length>0&&c1.pr.every(a=>a>=5),c1.pr);
 /* ---- R-129 the simulation's narratives follow their codes ---- */
 const nr=await p.evaluate(()=>{const A={a_acad:'math worksheet',a_gen:'direction to begin',a_trans:'next activity',a_denied:'told not now',a_rem_item:'taken away',a_rem_food:'snack',a_rem_staff_att:'another student',a_rem_peer_att:'another table',a_alone_work:'working alone',a_alone_nothing:'nothing to do',a_loud:'loud'};
   const E=state.entries;const withN=E.filter(e=>e.narrative);const codedOnly=E.filter(e=>e.mode==='coded');
   const match=withN.filter(e=>{const k=(e.antecedents||[]).find(k=>A[k]);return !k||e.narrative.includes(A[k]);}).length;
   const distinct=new Set(withN.map(e=>e.narrative)).size;
   return {total:E.length,withN:withN.length,match,distinct,codedBlank:codedOnly.every(e=>!e.narrative),bothHave:E.filter(e=>e.mode==='both').every(e=>e.narrative),sample:withN[0]&&withN[0].narrative};});
 ok('the simulated narratives name their own first antecedent, differ from one another, and sit only on the incidents recorded as coded + narrative',nr.total===46&&nr.withN>5&&nr.match===nr.withN&&nr.distinct>=nr.withN*0.8&&nr.codedBlank&&nr.bothHave&&/^Simulated record\./.test(nr.sample),nr);
 /* ---- R-061 / E-27 the classroom sheet; R-130 the EO note ---- */
 await p.evaluate(()=>{document.querySelector('#h-client').value='Test Student Simulated';document.querySelector('#h-target').value='Elopement';});
 const cs=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.abcPaper.html('class');const ap=d.querySelector('.ap');const txt=d.textContent;
   const codes=window.abcPaper.codes();const a=[...d.querySelectorAll('.ap-col')];
   return {cls:ap.className,ini:/TSS/.test(txt),full:/Test Student Simulated/.test(txt),opts:d.querySelectorAll('.ap-opt').length,cols:a.length,aN:a[0].querySelectorAll('.ap-opt[data-id]').length,cN:a[2].querySelectorAll('.ap-opt[data-id]').length,
     codes:{a:codes.a.length,c:codes.c.length,chosen:codes.chosen},tags:a[0].querySelectorAll('h5 i').length,lines:d.querySelectorAll('.ap-ln').length,target:/Elopement/.test(a[1].textContent),foot:/Initials only/.test(txt),
     eo:(()=>{d.innerHTML=window.abcPaper.html('blank');return /names the group so the box is found quickly; it is not a verdict/.test(d.textContent)&&d.querySelectorAll('.ap-grp h5 i').length>=4;})()};});
 ok('the classroom sheet carries initials (not the name), the record’s most-used eight antecedent and eight consequence codes, the header’s target, the EO tags, seven ruled lines and the initials-only footer',/ap-class/.test(cs.cls)&&cs.ini&&!cs.full&&cs.cols===3&&cs.aN===8&&cs.cN===8&&cs.codes.a===8&&cs.codes.c===8&&!cs.codes.chosen&&cs.tags>=2&&cs.lines===7&&cs.target&&cs.foot,cs);
 ok('the blank sheet keeps the EO tags and its footer says what they are for (R-130: kept, with the reason written)',cs.eo,cs);
 /* chosen codes: the picker, the note, the file */
 const pk=await p.evaluate(async()=>{document.getElementById('abcClassCodes').click();await new Promise(r=>setTimeout(r,200));const d=document.getElementById('abcClassPick');const boxes=[...d.querySelectorAll('input')];
   boxes.forEach(b=>{b.checked=false;});['a_acad','a_trans','a_denied','c_dem_rem','c_staff_att'].forEach(id=>{const b=boxes.find(x=>x.value===id);if(b)b.checked=true;});
   d.querySelector('[data-cp="save"]').click();await new Promise(r=>setTimeout(r,200));
   const codes=window.abcPaper.codes();const note=document.getElementById('abcClassNote').textContent;const h=readHeader();
   const sheet=document.createElement('div');sheet.innerHTML=window.abcPaper.html('class');const cols=[...sheet.querySelectorAll('.ap-col')];
   return {gone:!document.getElementById('abcClassPick'),codes,note,saved:h.classCodes,aN:cols[0].querySelectorAll('.ap-opt[data-id]').length,cN:cols[2].querySelectorAll('.ap-opt[data-id]').length,toast:window.__toasts.slice(-1)[0]};});
 ok('Choose its codes: the ticked codes are used, the note says Chosen, the record carries them, and the sheet shows just those',pk.gone&&pk.codes.chosen&&pk.codes.a.slice().sort().join()==='a_acad,a_denied,a_trans'&&pk.codes.c.slice().sort().join()==='c_dem_rem,c_staff_att'&&/^Chosen: 3 antecedent and 2 consequence codes/.test(pk.note)&&Array.isArray(pk.saved)&&pk.saved.length===5&&pk.aN===3&&pk.cN===2&&/5 codes chosen/.test(pk.toast),pk);
 /* one Letter page, as the other paper sheets */
 await p.evaluate(()=>{state.sheet.classCodes=[];document.querySelector('#abcPaper').innerHTML=window.abcPaper.html('class');document.documentElement.classList.add('abc-paper');});
 await p.emulateMedia({media:'print'});await sleep(300);
 const pg=await p.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap');const r=ap.getBoundingClientRect();const fs=[...ap.querySelectorAll('.ap-opt span:last-child, .ap-f span, .ap-grp h5')].map(e=>parseFloat(getComputedStyle(e).fontSize));return {h:r.height,w:r.width,minFs:Math.min(...fs),boxes:parseFloat(getComputedStyle(ap.querySelector('.ap-box')).width)};});
 await p.emulateMedia({media:'screen'});await p.evaluate(()=>{document.documentElement.classList.remove('abc-paper');document.querySelector('#abcPaper').innerHTML='';});
 ok('the classroom sheet is one Letter page tall (under 9.6 in at 96 px/in) with no text under 8 pt and 14 px boxes',pg.h>0&&pg.h<=922&&pg.minFs>=10.5&&pg.boxes>=14,pg);
 /* the settings panel holds the button and the picker; printing prints the sheet alone */
 const pn=await p.evaluate(async()=>{window.__printed=0;window.print=()=>{window.__printed++;window.__cls=document.documentElement.classList.contains('abc-paper')&&document.querySelectorAll('#abcPaper .ap.ap-class').length;};
   const col=id=>{const e=document.getElementById(id);const c=e&&e.closest('.abc-col');return c?[...c.parentNode.children].indexOf(c):-1;};
   window.print=()=>{window.__printed++;window.__cls=document.documentElement.classList.contains('abc-paper')&&document.querySelectorAll('#abcPaper .ap.ap-class').length;window.dispatchEvent(new Event('beforeprint'));const h=document.getElementById('nbh-print-head');window.__head=h?h.textContent:'';window.dispatchEvent(new Event('afterprint'));};
   document.getElementById('abcClassBtn').click();await new Promise(r=>setTimeout(r,1800));
   return {btn:col('abcClassBtn'),pick:col('abcClassCodes'),printed:window.__printed,cls:window.__cls,cleared:!document.documentElement.classList.contains('abc-paper'),head:window.__head,client:document.querySelector('#h-client').value};});
 ok('Print a classroom sheet sits with the paper sheets in the settings panel, prints the sheet alone and clears it after',pn.btn===0&&pn.pick===0&&pn.printed===1&&pn.cls===1&&pn.cleared,pn);
 ok('while the classroom sheet prints, the running head carries the initials, not the name; the student box is restored after',/Student TSS/.test(pn.head)&&!/Test Student Simulated/.test(pn.head)&&pn.client==='Test Student Simulated',pn);
 await p.close();
 /* ---- R-060 / E-45 the incident list on an iPad held upright ---- */
 const ipad=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 p=await open(ipad);
 await p.evaluate(()=>document.getElementById('load-demo').click());await sleep(2500);
 await tab(p,'incidents');await sleep(800);
 const i1=await p.evaluate(()=>{const T=document.getElementById('inc-table');const tr=T.querySelector('tbody tr');const last=tr.lastElementChild;
   return {hidden:getComputedStyle(last).display==='none',cue:T.classList.contains('can-scroll'),swipe:(T.nextElementSibling&&T.nextElementSibling.className==='matrix-swipe')?T.nextElementSibling.textContent:'',wide:T.scrollWidth>T.clientWidth+4,cols:[...T.querySelectorAll('thead th')].map(th=>th.textContent.trim())};});
 ok('on the iPad the Edit and Delete column is gone from the rows (the Consequence column is no longer under it), and the list carries the sideways cue when it is wider than its box',i1.hidden&&(!i1.wide||(i1.cue&&/Scroll sideways/.test(i1.swipe)))&&(!i1.wide||/Tap a row/.test(i1.swipe)),i1);
 const i2=await p.evaluate(async()=>{const T=document.getElementById('inc-table');const tr=T.querySelector('tbody tr');const id=tr.querySelector('[data-edit]').dataset.edit;const e=state.entries.find(x=>x.id===id);
   tr.children[3].click();await new Promise(r=>setTimeout(r,300));const d=document.getElementById('abcIncCard');const box=d&&d.querySelector('.abc-ic');
   const r={shown:d&&d.style.display==='block',role:box&&box.getAttribute('role'),title:box&&box.querySelector('h3').textContent,rows:box?[...box.querySelectorAll('.abc-ic-row b')].map(b=>b.textContent):[],focus:document.activeElement&&document.activeElement.tagName,
     edit:!!(box&&box.querySelector('[data-edit="'+id+'"]')),del:!!(box&&box.querySelector('[data-del="'+id+'"]')),date:e.date,cons:box&&box.querySelector('.abc-ic-row:nth-of-type(4) .tag, .abc-ic-row .tag')?true:false};
   box.querySelector('[data-close]:not([data-edit]):not([data-del])').click();await new Promise(r=>setTimeout(r,100));r.closed=d.style.display==='none';
   const n0=state.entries.length;tr.children[2].click();await new Promise(r=>setTimeout(r,200));document.querySelector('#abcIncCard [data-del]').click();await new Promise(r=>setTimeout(r,400));
   r.deleted=state.entries.length===n0-1&&!state.entries.some(x=>x.id===id);r.closed2=document.getElementById('abcIncCard').style.display==='none';return r;});
 ok('a tap on a row opens the incident as a card: the date and time, antecedent, behavior, consequence, after and narrative rows, Edit and Delete inside, focus in the card; Close closes it; Delete inside removes the incident',i2.shown&&i2.role==='dialog'&&i2.title.startsWith(i2.date)&&i2.rows.includes('Antecedent')&&i2.rows.includes('Consequence')&&i2.focus==='BUTTON'&&i2.edit&&i2.del&&i2.closed&&i2.deleted&&i2.closed2,i2);
 const i3=await p.evaluate(async()=>{const T=document.getElementById('inc-table');const tr=T.querySelector('tbody tr');const id=tr.querySelector('[data-edit]').dataset.edit;tr.children[1].click();await new Promise(r=>setTimeout(r,200));
   document.querySelector('#abcIncCard [data-edit]').click();await new Promise(r=>setTimeout(r,400));
   return {panel:[...document.querySelectorAll('section.panel')].find(s=>!s.hidden).dataset.panel,editing:state.editingId===id||document.body.className.indexOf('editing')>=0||!!document.querySelector('#e-date')&&document.querySelector('#e-date').value===state.entries.find(x=>x.id===id).date,closed:document.getElementById('abcIncCard').style.display==='none'};});
 ok('Edit inside the card opens the incident on the Record tab and closes the card',i3.panel==='record'&&i3.editing&&i3.closed,i3);
 await p.close();
 /* ---- desktop: the column stays, a row click opens nothing ---- */
 p=await open(ctx);await p.evaluate(()=>document.getElementById('load-demo').click());await sleep(2500);await tab(p,'incidents');await sleep(600);
 const dk=await p.evaluate(async()=>{const T=document.getElementById('inc-table');const tr=T.querySelector('tbody tr');tr.children[3].click();await new Promise(r=>setTimeout(r,200));const d=document.getElementById('abcIncCard');
   return {col:getComputedStyle(tr.lastElementChild).display!=='none',card:!!(d&&d.style.display==='block')};});
 ok('on a desktop the Edit and Delete column stays and a row click opens no card',dk.col&&!dk.card,dk);
 await p.close();
 ok('no page errors',errs.length===0,errs);
 await b.close();console.log('RESULT: '+(bad?bad+' failed of '+n:'all '+n+' passed'));process.exit(bad?1:0);})().catch(e=>{console.log('FAIL crash '+e);process.exit(1);});
