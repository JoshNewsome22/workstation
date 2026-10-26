/* v24.37 wide tables on the iPad, part 2 (review V13: R-020/E-08, R-019/E-35). On an 820 px touch screen: DD-1's Daily data
   tab shows the day card (a row a behavior, the day's minutes, phase, condition and notes) in place of the sheet, with the
   sheet a tap away; it writes the record the sheet reads, moves between days, adds today; a wide screen shows the sheet only.
   DA-1's session record hides its three safety columns under 900 px and sets a Safety line under each session that opens to
   the fields, writing the same record; a wide screen shows the columns; neither prints. usage: node qa/ux137-test.js */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const DD='Daily_Behavior_Data_and_Visual_Analysis.html',DA='DA-1_Demand-Assessment_v2026-10.html';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ipad=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 const desk=await b.newContext({viewport:{width:1400,height:900}});
 async function open(ctx,file,sim){const p=await ctx.newPage();await p.addInitScript(()=>{window.vis=el=>!!(el&&el.offsetParent);});p.on('pageerror',e=>errs.push(file.slice(0,6)+': '+String(e).slice(0,100)));await p.goto(BASE+'/NBH-Workstation/'+file);await sleep(1500);
   await p.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});if(sim){await loadSim(p);await sleep(2500);}return p;}
 /* ---- DD-1: the day card ---- */
 let p=await open(ipad,DD,true);await p.evaluate(()=>showTab('data'));await sleep(900);
 let r=await p.evaluate(()=>{const card=document.getElementById('ddCard'),seg=document.getElementById('ddEntrySeg'),wrap=document.querySelector('.sheet-wrap[aria-label="Daily data sheet"]'),bar=wrap&&wrap.previousElementSibling;
   const rows=S.rows,sel=document.getElementById('ddCardSel');const cur=rows.find(x=>x.id===sel.value);const today=localISO(new Date());
   return {card:vis(card),seg:vis(seg),segOn:seg.querySelector('button.on').dataset.ev,sheet:vis(wrap),bar:!!(bar&&bar.classList.contains('nbh-xs-bar')&&vis(bar)),behRows:card.querySelectorAll('.dc-row').length,nBeh:orderedBehaviors().length,
     days:sel.options.length,nRows:rows.length,curIsLast:cur===rows[rows.length-1],curIsToday:cur&&cur.date===today,hasToday:rows.some(x=>x.date===today),addToday:!!card.querySelector('[data-dc="today"]'),
     fields:[...card.querySelectorAll('.dc-day-fields [data-f]')].map(e=>e.dataset.f),docW:document.documentElement.scrollWidth,title:card.querySelector('h3').textContent};});
 ok('DD-1 (R-020, E-08): on the iPad the Daily data tab opens on the day card (Day card chosen): a row for every behavior, a list of every day with the newest shown (no today in the example, so Add today offered), the day\'s minutes, phase change, condition and notes; the sheet and its scroll bar are out of view; the page as wide as the screen',
   r.card&&r.seg&&r.segOn==='card'&&!r.sheet&&!r.bar&&r.behRows===r.nBeh&&r.nBeh>=2&&r.days===r.nRows&&r.nRows>5&&(r.curIsToday||(!r.hasToday&&r.curIsLast))&&(r.hasToday!==r.addToday)&&r.fields.join()==='obsMin,phaseType,phaseLabel,notes'&&r.docW===820&&r.title==='Day card',r);
 /* typing in the card writes the record and the sheet */
 r=await p.evaluate(async()=>{const card=document.getElementById('ddCard');const sel=document.getElementById('ddCardSel');const row=S.rows.find(x=>x.id===sel.value);
   const inp=card.querySelector('.dc-row input[data-v]:not([readonly])');const key=inp.dataset.v;const before=row.values[key];inp.value='7';inp.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
   const twin=document.querySelector(`#dataTable tr[data-r="${CSS.escape(row.id)}"] input[data-v="${CSS.escape(key)}"]`);
   const notes=card.querySelector('[data-f="notes"]');notes.value='card note';notes.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
   const tn=document.querySelector(`#dataTable tr[data-r="${CSS.escape(row.id)}"] input[data-f="notes"]`);
   return {before,after:row.values[key],twin:twin&&twin.value,notes:row.notes,tn:tn&&tn.value,bad:inp.classList.contains('nbh-bad')};});
 ok('a value typed on the card goes to the record and to the sheet\'s cell; so does the day\'s note',r.after==='7'&&r.twin==='7'&&r.notes==='card note'&&r.tn==='card note'&&!r.bad,r);
 /* a wrong value is marked as the sheet marks it */
 r=await p.evaluate(async()=>{const card=document.getElementById('ddCard');const inp=card.querySelector('.dc-row input[data-v]:not([readonly])');inp.value='-2';inp.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));const m=inp.classList.contains('nbh-bad')||inp.getAttribute('aria-invalid')==='true';inp.value='7';inp.dispatchEvent(new Event('input',{bubbles:true}));return m;});
 ok('a value below zero is marked on the card as on the sheet',r===true,r);
 /* moving between days: the arrow, the list */
 r=await p.evaluate(async()=>{const card=document.getElementById('ddCard'),sel=()=>document.getElementById('ddCardSel');const rows=S.rows;const i0=rows.findIndex(x=>x.id===sel().value);
   card.querySelector('[data-dc="prev"]').click();await new Promise(r=>setTimeout(r,200));const i1=rows.findIndex(x=>x.id===sel().value);
   const s=sel();s.value=rows[0].id;s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));const i2=rows.findIndex(x=>x.id===sel().value);const prevOff=card.querySelector('[data-dc="prev"]').disabled;
   return {i0,i1,i2,prevOff,nextOn:!card.querySelector('[data-dc="next"]').disabled};});
 ok('the left arrow shows the day before; the list jumps to any day; at the first day the left arrow rests and the right one is live',r.i1===r.i0-1&&r.i2===0&&r.prevOff&&r.nextOn,r);
 /* Add today */
 r=await p.evaluate(async()=>{const card=document.getElementById('ddCard');const t=localISO(new Date());const n0=S.rows.length;const b=card.querySelector('[data-dc="today"]');if(b){b.click();await new Promise(r=>setTimeout(r,400));}
   const sel=document.getElementById('ddCardSel');const cur=S.rows.find(x=>x.id===sel.value);return {had:!b,n0,n1:S.rows.length,curToday:cur&&cur.date===t,inSheet:!!document.querySelector(`#dataTable tr[data-r="${CSS.escape(cur.id)}"]`),gone:!card.querySelector('[data-dc="today"]')};});
 ok('Add today adds the day to the record (and the sheet) and shows it on the card; the button then goes',(r.had||(r.n1===r.n0+1&&r.curToday&&r.inSheet&&r.gone)),r);
 /* the full sheet, a tap away; remembered */
 r=await p.evaluate(async()=>{document.querySelector('#ddEntrySeg [data-ev="sheet"]').click();await new Promise(r=>setTimeout(r,600));const wrap=document.querySelector('.sheet-wrap[aria-label="Daily data sheet"]');const bar=wrap.previousElementSibling;
   return {card:vis(document.getElementById('ddCard')),sheet:vis(wrap),bar:!!(bar&&bar.classList.contains('nbh-xs-bar')&&vis(bar)),kept:localStorage.getItem('nbh.dd1.entry'),on:document.querySelector('#ddEntrySeg button.on').dataset.ev};});
 ok('Full sheet brings the sheet back with its scroll bar and puts the card away; the choice is kept on the device',!r.card&&r.sheet&&r.bar&&r.kept==='sheet'&&r.on==='sheet',r);
 await p.evaluate(()=>{document.querySelector('#ddEntrySeg [data-ev="card"]').click();});await sleep(300);
 /* the blank week and interval entry carry no card */
 r=await p.evaluate(async()=>{document.getElementById('btnBlankWeek').click();await new Promise(r=>setTimeout(r,400));const a={card:vis(document.getElementById('ddCard')),seg:vis(document.getElementById('ddEntrySeg')),sheet:vis(document.querySelector('.sheet-wrap[aria-label="Daily data sheet"]'))};
   document.getElementById('ddBlankBack').click();await new Promise(r=>setTimeout(r,400));const b={card:vis(document.getElementById('ddCard'))};return {a,b};});
 ok('the blank week to print shows the sheet, not the card (and no choice); back to the data, the card returns',!r.a.card&&!r.a.seg&&r.a.sheet&&r.b.card,r);
 /* print: no card */
 await p.emulateMedia({media:'print'});const pr=await p.evaluate(()=>[document.getElementById('ddCard'),document.getElementById('ddEntrySeg')].map(e=>getComputedStyle(e).display));await p.emulateMedia({media:'screen'});
 ok('neither the card nor the choice prints',pr.every(d=>d==='none'),pr);
 await p.close();
 /* a wide screen: the sheet, no card */
 p=await open(desk,DD,true);await p.evaluate(()=>showTab('data'));await sleep(700);
 r=await p.evaluate(()=>({card:vis(document.getElementById('ddCard')),seg:vis(document.getElementById('ddEntrySeg')),sheet:vis(document.querySelector('.sheet-wrap[aria-label="Daily data sheet"]'))}));await p.close();
 ok('on a 1400 px desktop the sheet shows and the card and the choice do not',!r.card&&!r.seg&&r.sheet,r);
 /* ---- DA-1: the safety columns under each session ---- */
 p=await open(ipad,DA,true);await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="assessment"]').click());await sleep(600);
 r=await p.evaluate(()=>{const th=[...document.querySelectorAll('#sessTbl thead th.da-sc')];const safe=[...document.querySelectorAll('#sessTbl tr.da-safe')];const first=safe[0];const btn=first&&first.querySelector('.da-safe-btn');
   return {n:S.sess.length,th:th.length,thVis:th.filter(vis).length,tdVis:[...document.querySelectorAll('#sessTbl td.da-sc')].filter(vis).length,safe:safe.length,safeVis:safe.filter(vis).length,sum:btn&&btn.textContent.replace(/\s+/g,' ').trim(),expanded:btn&&btn.getAttribute('aria-expanded'),bodyHidden:first&&first.querySelector('.da-safe-body').hidden,bodiesShown:safe.filter(x=>vis(x.querySelector('.da-safe-body'))).length,
     s0:S.sess[0]&&{stops:S.sess[0].stops,why:S.sess[0].why,hold:S.sess[0].hold}};});
 const sumOk=r.sum&&/^Safety/.test(r.sum)&&(r.s0&&r.s0.stops!==''&&r.s0.stops!=null?new RegExp(r.s0.stops+' guidance stop').test(r.sum):/guidance stops not counted/.test(r.sum))&&(r.s0&&r.s0.hold?/hold or injury reported/.test(r.sum):/no hold or injury/.test(r.sum));
 ok('DA-1 (R-019, E-35): on the iPad the three safety columns are out of the session record and a Safety line sits under every session, closed, summing that session\'s guidance stops, early stop and hold',
   r.n>=3&&r.th===3&&r.thVis===0&&r.tdVis===0&&r.safe===r.n&&r.safeVis===r.n&&sumOk&&r.expanded==='false'&&r.bodyHidden===true&&r.bodiesShown===0,r);
 r=await p.evaluate(async()=>{const first=document.querySelector('#sessTbl tr.da-safe');const btn=first.querySelector('.da-safe-btn');btn.click();await new Promise(r=>setTimeout(r,100));const body=first.querySelector('.da-safe-body');
   const inp=body.querySelector('input[data-f="stops"]');inp.value='2';inp.dispatchEvent(new Event('input',{bubbles:true}));const why=body.querySelector('input[data-f="why"]');why.value='two stops';why.dispatchEvent(new Event('input',{bubbles:true}));
   const hold=body.querySelector('input[data-f="hold"]');hold.checked=true;hold.dispatchEvent(new Event('input',{bubbles:true}));hold.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
   const col=document.querySelector('#sessTbl tr[data-s="0"]:not(.da-safe)');
   return {open:!body.hidden&&vis(body)&&btn.getAttribute('aria-expanded')==='true',labels:[...body.querySelectorAll('label > span')].map(s=>s.textContent),rec:{stops:S.sess[0].stops,why:S.sess[0].why,hold:S.sess[0].hold},twins:{stops:col.querySelector('input[data-f="stops"]').value,why:col.querySelector('input[data-f="why"]').value,hold:col.querySelector('input[data-f="hold"]').checked},sum:btn.textContent.replace(/\s+/g,' ').trim()};});
 ok('the line opens to the three fields; what is typed there goes to the record and to the columns, and the line reads it back',
   r.open&&r.labels.join('|')==='Guidance stops|Stopped early: why|Hold or injury: reported'&&r.rec.stops==='2'&&r.rec.why==='two stops'&&r.rec.hold==='1'&&r.twins.stops==='2'&&r.twins.why==='two stops'&&r.twins.hold===true&&/2 guidance stops · stopped early: two stops · hold or injury reported/.test(r.sum),r);
 /* the computed columns still update from the row (the rows are found by their number, not their place) */
 r=await p.evaluate(async()=>{const col=document.querySelector('#sessTbl tr[data-s="1"]:not(.da-safe)');const g=col.querySelector('input[data-f="given"]'),c=col.querySelector('input[data-f="comp"]');g.value='10';g.dispatchEvent(new Event('input',{bubbles:true}));c.value='5';c.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));return col.children[6].textContent.trim();});
 ok('a session\'s compliance still recomputes in its own row with the Safety rows between',/^50/.test(r),r);
 await p.emulateMedia({media:'print'});const dpr=await p.evaluate(()=>({safe:[...document.querySelectorAll('#sessTbl tr.da-safe')].filter(e=>getComputedStyle(e).display!=='none').length,cols:[...document.querySelectorAll('#sessTbl th.da-sc')].filter(e=>getComputedStyle(e).display!=='none').length}));await p.emulateMedia({media:'screen'});
 ok('on paper the three columns print and the Safety lines do not',dpr.safe===0&&dpr.cols===3,dpr);
 await p.close();
 p=await open(desk,DA,true);await p.evaluate(()=>document.querySelector('#viewSeg button[data-view="assessment"]').click());await sleep(500);r=await p.evaluate(()=>({thVis:[...document.querySelectorAll('#sessTbl th.da-sc')].filter(vis).length,safeVis:[...document.querySelectorAll('#sessTbl tr.da-safe')].filter(vis).length}));await p.close();
 ok('on a 1400 px desktop the three columns show and the Safety lines do not',r.thVis===3&&r.safeVis===0,r);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
