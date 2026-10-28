/* v24.25 Form TB-1, the sign-off sheet and the case (the independent review): Load simulation is blocked while a student is on the
   form; the Quality check's countable rows come from the card and lock, n/a on the cluster, precursor and force rows, a verdict per
   target; 44 px cells and 32 px cluster controls on a touch screen; the simulation and the templates carry no wording flags; the
   distance threshold labeled and out of the classroom cards; the target-count question names the targets and the cards come
   back; the pilot's Index is a select with A and B named from it; the definition box is named by its row label; the chip row on
   Definitions; the Selected Targets cells wrap. (v24.93: on screen an example stands under its label, so the box's example is read
   from where the layout keeps it, data-fx2-ph; printing puts it back in the box.)  usage: node qa/tb125-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const TB='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^TB-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(ctx)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+TB);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asks=[];window.__alerts=[];window.__ans=true;nbhUI.confirm=async(t)=>{window.__asks.push(String(t));return window.__ans;};nbhUI.alert=async(t)=>{window.__alerts.push(String(t));};window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{t0&&t0(m,o);}catch(e){}};window.print=()=>{};});return p;};
 const set=(p,nm,v)=>p.evaluate(([nm,v])=>{const e=document.querySelector('[name="'+nm+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[nm,v]);
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 /* ---- 1. the simulation is blocked while a student is on the form (R-012) ---- */
 const p=await open(ctx);
 await set(p,'m.client','REVIEWER TEST CASE');await set(p,'m.sid','RT-001');
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(600);
 const blocked=await p.evaluate(()=>({alerts:window.__alerts.slice(),asks:window.__asks.length,client:document.querySelector('[name="m.client"]').value,cards:document.querySelectorAll('#tgtWrap .card').length,lab:document.querySelector('[name="tgt[0].lab"]').value,facts:(window.__nbhFactsOut&&window.__nbhFactsOut()||{}).behaviors||[]}));
 ok('with a student on the form, Load simulation is blocked with the reason (the case, the forms that read it, Save case) and nothing is loaded',blocked.alerts.length===1&&/blocked while a student is on this form \(REVIEWER TEST CASE\)/.test(blocked.alerts[0])&&/OB-1, ABC-1, IA-1, SP-1, DD-1 and TD-1/.test(blocked.alerts[0])&&/Save case/.test(blocked.alerts[0])&&blocked.asks===0&&blocked.client==='REVIEWER TEST CASE'&&!blocked.lab&&!blocked.facts.length,blocked);
 await set(p,'m.client','');await set(p,'m.sid','');
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 const loaded=await p.evaluate(()=>({asks:window.__asks.slice(),client:document.querySelector('[name="m.client"]').value,cards:document.querySelectorAll('#tgtWrap .card').length}));
 ok('on an empty form the question names the consequence (the case, SIMULATED – Sample Student) and the simulation loads',loaded.asks.length===1&&/every open form that reads the case shows them, under the name SIMULATED/.test(loaded.asks[0])&&/SIMULATED/.test(loaded.client)&&loaded.cards===5,loaded);
 /* ---- 2. the simulation and the templates carry no wording flags (R-038) ---- */
 const flags=await p.evaluate(()=>{const r=[];document.querySelectorAll('textarea[name]').forEach(el=>{const v=String(el.value||'');if(v.length<6)return;let f;try{f=nbhWording.check(v,el);}catch(e){return;}if(f.length)r.push(el.name+': '+f.map(x=>x.id+':'+x.text).join(', '));});
   const c=document.querySelector('[name="cand[5].beh"]');if(c&&nbhWording.check(c.value,c).length)r.push('cand[5].beh');return r;});
 ok('the simulation\'s cards, the RRB template loaded into target 5, the collateral list and candidate 6 carry zero wording flags',flags.length===0,flags);
 /* ---- 3. the Quality check derives the countable rows and locks them; the verdict row (R-013) ---- */
 await p.evaluate(()=>tb125.view('check'));await sleep(300);
 const simQc=await p.evaluate(()=>{const row=t=>[...document.querySelectorAll('#qcTbl [data-verdict]')].find(td=>+td.dataset.verdict===t).textContent.trim();const q=(t,i)=>document.querySelector(`[name="qc[${t}].${i}"]`);
   return {v:[0,1,2,3,4].map(row),derivedLocked:[1,5,6,7,8,9,11,12].every(i=>q(0,i).disabled&&q(0,i).checked),from:document.querySelectorAll('#qcTbl tr.qc-derived .qc-from').length,na:[4,13,14].every(i=>q(0,i).tagName==='SELECT'&&[...q(0,i).options].some(o=>o.value==='na')),judge:!q(0,2).disabled&&!q(0,16).disabled,sv1:q(1,16).checked};});
 ok('on the simulation the derived rows are ticked and locked, the three n/a rows are selects, the judgment rows stay open, and the verdicts read Ready except Self-injury (Socially valid unticked: 1 row open)',simQc.v[0]==='Ready for baseline'&&simQc.v[1]==='1 row open'&&simQc.v[2]==='Ready for baseline'&&simQc.v[3]==='Ready for baseline'&&simQc.v[4]==='Ready for baseline'&&simQc.derivedLocked&&simQc.from===8&&simQc.na&&simQc.judge&&!simQc.sv1,simQc);
 /* the bad card from the review (A-9): target 3 rewritten */
 await p.evaluate(()=>tb125.view('define'));await sleep(200);
 await set(p,'tgt[2].lab','Noncompliance');await set(p,'tgt[2].def','Student becomes aggressive and noncompliant when frustrated and does not follow directions because he wants to escape work and get attention.');
 await set(p,'tgt[2].ex','Refuses to work');await set(p,'tgt[2].nex','');await set(p,'tgt[2].border','');await set(p,'tgt[2].dim','Duration');await set(p,'tgt[2].on','');await set(p,'tgt[2].off','');
 const hint=await p.evaluate(()=>document.getElementById('dimHint2').textContent);
 await p.evaluate(()=>tb125.view('check'));await sleep(300);
 const badQc=await p.evaluate(()=>{const q=i=>document.querySelector(`[name="qc[2].${i}"]`);const open=[1,5,6,7,8,11].map(i=>({i,checked:q(i).checked,disabled:q(i).disabled,title:q(i).title}));return {open,v:[...document.querySelectorAll('#qcTbl [data-verdict]')].find(td=>+td.dataset.verdict===2).textContent.trim(),unit:q(9).checked,mo:q(12).checked,title8:q(8).title,title1:q(1).title};});
 ok('the bad card: examples, non-examples, borderline, onset/offset, "no inferred states" and "no function words" are open and locked, the unit and MO rows stay ticked, the verdict reads 6 rows open, and the card says onset and offset are required',badQc.open.every(o=>!o.checked&&o.disabled)&&badQc.v==='6 rows open'&&badQc.unit&&badQc.mo&&/onset and offset are required for duration/.test(badQc.title8)&&/frustrated/.test(badQc.title1)&&/Onset and offset required for this dimension/.test(hint)&&/Task refusal: latency/.test(hint),{badQc,hint});
 /* n/a on the cluster row counts as answered; a judgment row can still be ticked by hand */
 const naV=await p.evaluate(()=>{const s=document.querySelector('[name="qc[2].13"]');s.value='na';s.dispatchEvent(new Event('change',{bubbles:true}));const q=document.querySelector('[name="qc[2].2"]');q.checked=false;q.dispatchEvent(new Event('change',{bubbles:true}));
   return {state13:tb125.state()['qc[2].13'],state2:tb125.state()['qc[2].2'],v:[...document.querySelectorAll('#qcTbl [data-verdict]')].find(td=>+td.dataset.verdict===2).textContent.trim()};});
 ok('n/a is kept as the answer and the verdict counts a judgment row unticked by hand',naV.state13==='na'&&naV.state2===false&&naV.v==='7 rows open',naV);
 /* the verdict prints */
 await p.emulateMedia({media:'print'});const printed=await p.evaluate(()=>{const tr=document.querySelector('#qcTbl tr.qc-verdict');return tr&&getComputedStyle(tr).display!=='none'&&/Ready for baseline/.test(tr.textContent);});await p.emulateMedia({media:'screen'});
 ok('the verdict row is on the printed sheet',printed);
 /* ---- 4. the target count: the question names the targets and the cards come back (R-039) ---- */
 const cnt=await p.evaluate(async()=>{window.__asks=[];const e=document.getElementById('nTgt');e.value='3';e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
   const ask=window.__asks[0]||'',cards=document.querySelectorAll('#tgtWrap .card').length;e.value='5';e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,400));
   return {ask,cards,back:document.querySelectorAll('#tgtWrap .card').length,lab4:document.querySelector('[name="tgt[3].lab"]').value,lab5:document.querySelector('[name="tgt[4].lab"]').value,ex5:document.querySelector('[name="tgt[4].ex"]').value.split('\n').length,ioa5:document.querySelector('[name="ioa[4].x"]').value,toast:window.__toasts.slice(-1)[0]||''};});
 ok('lowering 5 to 3 names the two targets in the question; set back to 5 the cards return with their examples and pilot, and a toast says so',/Remove 2 targets \(Break request \(replacement\), Arranging and ordering/.test(cnt.ask)&&/brings them back/.test(cnt.ask)&&cnt.cards===3&&cnt.back===5&&/^Break request/.test(cnt.lab4)&&/Arranging and ordering/.test(cnt.lab5)&&cnt.ex5>=5&&cnt.ioa5==='1056'&&/2 targets are back/.test(cnt.toast),cnt);
 /* ---- 5. the pilot's Index is a select; A and B named from it; the RRB row consistent (R-040, R-126) ---- */
 await p.evaluate(()=>tb125.view('check'));await sleep(300);
 const idx=await p.evaluate(()=>{const g=(t,k)=>document.querySelector(`[name="ioa[${t}].${k}"]`);return {sel:g(0,'i').tagName,opts:[...g(0,'i').options].map(o=>o.value),v:[0,1,2,3,4].map(t=>g(t,'i').value),a:[0,2,3].map(t=>g(t,'x').placeholder),b:[0,2,3].map(t=>g(t,'y').placeholder),al:g(2,'x').getAttribute('aria-label'),rrb:[g(4,'x').value,g(4,'y').value,g(4,'a').value],th:[...document.querySelectorAll('#ioaTbl thead th')].map(e=>e.textContent.replace(/\s+/g,' ').trim())};});
 ok('Index is a select (Total count, Interval, Exact count, Trial by trial); A and B read Agreements / Intervals scored, Observer A total / Observer B total, Agreements / Trials scored by the row; Minutes; the RRB row reads 1056 of 1200 = 88',idx.sel==='SELECT'&&JSON.stringify(idx.opts)==='["","Total count","Interval","Exact count","Trial by trial"]'&&JSON.stringify(idx.v)==='["Exact count","Exact count","Total count","Trial by trial","Interval"]'&&idx.a[0]==='Agreements'&&idx.b[0]==='Intervals scored'&&idx.a[1]==='Observer A total'&&idx.b[1]==='Observer B total'&&idx.a[2]==='Agreements'&&idx.b[2]==='Trials scored'&&/Noncompliance, Observer A total/.test(idx.al)&&idx.rrb[0]==='1056'&&idx.rrb[1]==='1200'&&idx.rrb[2]==='88'&&idx.th.some(t=>/^Minutes$/.test(t)),idx);
 const sw=await p.evaluate(()=>{const s=document.querySelector('[name="ioa[2].i"]');s.value='Interval';s.dispatchEvent(new Event('change',{bubbles:true}));const x=document.querySelector('[name="ioa[2].x"]');return {ph:x.placeholder,pct:document.querySelector('[name="ioa[2].a"]').value};});
 ok('changing the index relabels A and B and recomputes the percent (2 of 2 intervals: 100)',sw.ph==='Agreements'&&sw.pct==='100',sw);
 /* an older file's free-text index opens as its kind */
 const old=await p.evaluate(()=>{tb125.ioa()['ioa[1].i']='exact count per interval (1-min intervals)';tb125.ioa()['ioa[3].i']='something else';tb125.buildQC();return {k1:document.querySelector('[name="ioa[1].i"]').value,k3:document.querySelector('[name="ioa[3].i"]').value,ph3:document.querySelector('[name="ioa[3].x"]').placeholder};});
 ok('a free-text index from an older file opens as its kind, and an unknown one is kept as an extra option',old.k1==='Exact count'&&old.k3==='something else'&&old.ph3==='A',old);
 /* ---- 6. the distance threshold (R-034) and the Elopement dimension (R-035) ---- */
 const dist=await p.evaluate(()=>({b0:document.querySelector('[name="tgt[0].border"]').value,b1:document.querySelector('[name="tgt[1].border"]').value,ft:document.querySelector('[name="ft.applied"]').value,ph:(e=>e.placeholder||e.getAttribute('data-fx2-ph')||'')(document.querySelector('[name="ft.applied"]')),guide:document.body.textContent.match(/video-coded or session-room observation[^.]*\./)?.[0]||'',dim:document.querySelector('[name="tgt[2].dim"]').value,unit:document.querySelector('[name="tgt[2].unit"]').value}));
 ok('the simulated classroom cards carry no 15.24 cm rule, the guide labels the threshold for video-coded or session-room observation as about 6 in., and the simulated Elopement card times the departures',!/15\.24/.test(dist.b0)&&!/15\.24/.test(dist.b1)&&/video-coded or session-room/.test(dist.ft)&&/about 6 in\./.test(dist.ph)&&/video-coded or session-room observation/.test(dist.guide)&&dist.dim==='Duration'&&/time out of the area/.test(dist.unit),dist);
 /* ---- 7. the definition box is named by its row label (R-041); the chip row (R-127); the Selected Targets cells wrap (R-128) ---- */
 const a11y=await p.evaluate(()=>{const ta=document.querySelector('[name="tgt[0].def"]');const nav=document.getElementById('tgtNav');const chips=[...nav.querySelectorAll('a')].map(a=>a.textContent);
   const lab=document.querySelector('[name="sel[4].lab"]');return {al:ta.getAttribute('aria-label'),ph:ta.placeholder||ta.getAttribute('data-fx2-ph')||'',chips,navShown:getComputedStyle(nav).display!=='none',selTag:lab.tagName,selH:lab.getBoundingClientRect().height,selSh:lab.scrollHeight,clip:lab.scrollWidth>lab.clientWidth+1};});
 await p.evaluate(()=>{tb125.view('define');document.querySelector('#tgtNav a[href="#tgtCard3"]').click();});await sleep(700);
 const jumped=await p.evaluate(()=>{const r=document.getElementById('tgtCard3').getBoundingClientRect();return r.top>=-5&&r.top<400;});
 ok('the definition box is named "Operational definition" with the recipe as its placeholder; the chip row lists the five targets, Template and Thresholds and a chip scrolls to the card; the Selected Targets label is a wrapping box that is not clipped',a11y.al==='Operational definition'&&/Form · body part/.test(a11y.ph)&&a11y.chips.length===7&&/^4\. Break request/.test(a11y.chips[3])&&a11y.chips[5]==='Template'&&a11y.chips[6]==='Thresholds'&&a11y.navShown&&a11y.selTag==='TEXTAREA'&&!a11y.clip&&a11y.selH>=a11y.selSh-2&&jumped,{a11y,jumped});
 /* a saved file reopens with the n/a answers and the select's index */
 const io=await p.evaluate(async()=>{const d=tb125.collect();const na=d.fields['qc[2].13'];tb125.restore(JSON.parse(JSON.stringify(d)));await new Promise(r=>setTimeout(r,300));tb125.view('check');return {na,after:tb125.state()['qc[2].13'],sel:document.querySelector('[name="qc[2].13"]').value,idx:document.querySelector('[name="ioa[2].i"]').value,v2:[...document.querySelectorAll('#qcTbl [data-verdict]')].find(td=>+td.dataset.verdict===2).textContent.trim()};});
 ok('a saved file keeps n/a and the index and reopens the same',io.na==='na'&&io.after==='na'&&io.sel==='na'&&io.idx==='Interval'&&io.v2==='7 rows open',io);
 await p.close();
 /* ---- 8. touch sizes (R-014) ---- */
 const tctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 const q=await open(tctx);await q.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 const touch=await q.evaluate(()=>{tb125.view('check');const cells=[...document.querySelectorAll('#qcTbl tbody td.c')].filter(td=>!td.dataset.verdict).map(td=>td.getBoundingClientRect());const boxes=[...document.querySelectorAll('#qcTbl td.c input[type=checkbox]')].map(e=>e.getBoundingClientRect());
   tb125.view('cluster');const sels=[...document.querySelectorAll('#clusWrap table.rank.cmp td select, #clusWrap table.rank.cmp td input')].map(e=>e.getBoundingClientRect().height);
   tb125.view('check');const td=[...document.querySelectorAll('#qcTbl tbody td.c')].find(c=>{const i=c.querySelector('input');return i&&!i.disabled;});const q=td.querySelector('input');const was=q.checked;td.dispatchEvent(new MouseEvent('click',{bubbles:true}));
   return {cells:cells.length,minW:Math.min(...cells.map(r=>r.width)),minH:Math.min(...cells.map(r=>r.height)),box:Math.min(...boxes.map(r=>r.width)),sels:sels.length,selMin:Math.min(...sels),toggled:q.checked!==was,coarse:matchMedia('(pointer:coarse)').matches};});
 ok('on an iPad every checklist cell is a 44 px tap area that toggles its box, the boxes are 24 px, and every cluster control is at least 32 px tall',touch.coarse&&touch.minW>=44&&touch.minH>=44&&touch.box>=24&&touch.sels>0&&touch.selMin>=32&&touch.toggled,touch);
 await q.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
