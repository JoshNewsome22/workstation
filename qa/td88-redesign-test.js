/* v23.88 Form TD-1's redesign (PART 2 step 3, screens A, B, C and E, approved by the BCBA). On an iPad (touch), with a
   simulated student's saved file (the five simulated runs of step 2):
   1. Select treatment: each recommendation is a row with a tick, the core ticked (the consequence protocol among them), the
      Add button counts the ticks; an untick is kept in the form (sel.picks) and the button's count follows;
   2. the plan's size is in sight on the Select and Build sheets (components, staff steps, pages, duplicates);
   3. a card has Run by / When / Where boxes and a set-up tick on each step; a card from the library has its set-up steps
      ticked for you; the plan's compiled list counts the every-session steps only, the set-up steps printed apart and
      unnumbered under the card;
   4. the final plan's first page: the notice of what is not ready (escape extinction's consent among them), the summary
      statement, the definitions with the present level, both criteria (or their gaps), the review line, the plan at a
      glance (one row per staff component), the least-restrictive review with escape extinction's status; the old
      "Components in this plan" wall is gone;
   5. the text for the BIP carries the summary statement, the glance, the review and the set-up lines;
   6. the bank: adding a protocol whose component is already a card asks replace / add a second card / cancel; Replace
      keeps the card and its who/when and swaps the steps; Undo puts the words back; Add a second card adds one;
   7. the bank's list ranks the protocols for this plan's function first when nothing is searched;
   8. Save data then Open data keeps the ticks, who/when/where and the set-up marks;
   9. the five simulated files open and render a plan with steps, no page errors;
  10. no page errors in all of the above;
  11. upright (820 px), the sheet controls keep the toolbar to one row on every sheet (a long name is capped);
  12. the Sheets menu stays open through a click made in code (TD-1's autosave clicks Save data); a real tap outside closes it;
  13. the masthead paragraph and the Autosave note run the form's width on screen.
   Needs: qa/data/sim/<key>/td1-save.json (the simulated runs; WS_SIM names another folder).
   usage: node qa/td88-redesign-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='TD-1');
const SIM=process.env.WS_SIM||path.join(__dirname,'data','sim');   /* the five simulated students' saved files (PART 2 step 2), simulated data only */
const keys=fs.existsSync(SIM)?fs.readdirSync(SIM).filter(k=>fs.existsSync(path.join(SIM,k,'td1-save.json'))):[];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  ok('0 the simulated files are at hand ('+keys.length+')',keys.length>=3,{SIM,keys});
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const open=async(file)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1400);
    if(file){await p.setInputFiles('#fileIn',{name:'saved.json',mimeType:'application/json',buffer:fs.readFileSync(file)});await sleep(2200);
      await p.evaluate(()=>{const d=document.querySelector('#cfDlg');if(d&&getComputedStyle(d).display!=='none'){const b=d.querySelector('button');if(b)b.click();}}).catch(()=>{});await sleep(500);}
    await p.evaluate(()=>{window.R=()=>document.getElementById('tdBankHost').shadowRoot;window.sheet=v=>{document.querySelector('#viewSeg button[data-view="'+v+'"]').click();};window.fire=e=>['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));});
    return p;};
  const mateo=keys.find(k=>/mateo/i.test(k))||keys[0];
  const p=await open(path.join(SIM,mateo,'td1-save.json'));
  /* 1. the ticks */
  const A=await p.evaluate(async()=>{sheet('select');await new Promise(r=>setTimeout(r,400));const rows=[...document.querySelectorAll('#selRec .td-rec')];const picks=rows.map(r=>({code:r.querySelector('.tag').textContent.trim(),on:r.querySelector('.td-pick').checked,core:!!r.querySelector('.td-chip.core')}));
    const btn=document.querySelector('#sendBuild').textContent;const first=rows[0]&&rows[0].querySelector('.td-pick');
    let after='',saved='';if(first){first.checked=false;first.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));after=document.querySelector('#sendBuild').textContent;saved=(document.querySelector('[name="sel.picks"]')||{}).value||'';}
    return {picks,btn,after,saved,meter:(document.querySelector('#selMeter .td-meter')||{}).textContent||''};});
  ok('1 Select: rows with ticks, the core ticked (the consequence protocol among them), the button counts the ticks, an untick is kept',
    A.picks.length>=2&&A.picks.some(x=>x.code==='R_PB'&&x.core&&x.on)&&A.picks.filter(x=>x.core).every(x=>x.on)&&/^Add the \d+ ticked component/.test(A.btn)&&A.after!==A.btn&&/":0/.test(A.saved),A);
  /* 2. the meter */
  ok('2 the plan’s size in sight: components, staff steps, pages, duplicates',/This plan so far: \d+ components? · \d+ staff steps? · about \d+ pages?/.test(A.meter)&&/Duplicates:/.test(A.meter)&&/(A plan staff can run|More than staff can run)/.test(A.meter),A.meter);
  /* 3. the card */
  const B=await p.evaluate(async()=>{sheet('build');await new Promise(r=>setTimeout(r,400));const cards=[...document.querySelectorAll('#compWrap .card')];
    const who=cards.every(c=>c.querySelector('input[name$=".who"]')&&c.querySelector('input[name$=".when"]')&&c.querySelector('input[name$=".where"]'));
    const su=cards.every(c=>[...c.querySelectorAll('ol.steps li')].every(li=>li.querySelector('input.td-su')));
    const n0=cards.length;const d=window.__tdAddComp('FCT',null);const libTicked=[...d.querySelectorAll('ol.steps li')].filter(li=>li.querySelector('input.td-su').checked).map(li=>li.querySelector('textarea').value.slice(0,40));
    const libSteps=[...d.querySelectorAll('ol.steps textarea')].map(t=>t.value);const setupLike=libSteps.filter(s=>/^(confirm|identify|assess|select|choose|define|decide|train|prepare|collect baseline)/i.test(s)).length;
    d.querySelector('input[name$=".who"]').value='classroom staff (simulated)';fire(d.querySelector('input[name$=".who"]'));
    const cs=window.__tdComps();const mine=cs.find(c=>c.i===+d.dataset.i);
    sheet('final');await new Promise(r=>setTimeout(r,600));const steps=document.querySelectorAll('#finalBody .plan-step').length;const setups=document.querySelectorAll('#finalBody .plan-setup li').length;const whos=document.querySelectorAll('#finalBody .plan-who').length;
    const expectSteps=cs.filter(c=>!window.__tdIsAssess||true).reduce((a,c)=>a+c.steps.length,0);
    return {who,su,n0,n1:document.querySelectorAll('#compWrap .card').length,libTicked,setupLike,mine:{steps:mine.steps.length,setup:mine.setup.length,who:mine.who},steps,setups,whos,expectSteps,dup:document.querySelectorAll('#compWrap .td-dup').length};});
  ok('3 a card has who/when/where and a set-up tick on each step; the library card’s set-up steps are ticked; the plan numbers the every-session steps only, the set-up steps apart; a second card says so',
    B.who&&B.su&&B.n1===B.n0+1&&B.libTicked.length===B.setupLike&&B.mine.setup===B.libTicked.length&&B.mine.who==='classroom staff (simulated)'&&B.steps>=B.expectSteps&&B.setups>=B.mine.setup&&B.whos>=1&&B.dup>=1,B);
  /* 4. page 1 */
  const C=await p.evaluate(()=>{const h=document.querySelector('#finalHead');const T=h.textContent;const defs=[...h.querySelectorAll('.defs .dlab')].map(e=>e.textContent.trim());
    return {notice:!!h.querySelector('.td-notice'),noticeItems:h.querySelectorAll('.td-notice li').length,noticeEE:/escape extinction|guide|assent|agreed/i.test((h.querySelector('.td-notice')||{}).textContent||''),stmt:(h.querySelector('.td-stmt')||{}).textContent||'',defs,
      crit:/Criterion for the target/.test(T)&&/Criterion for the replacement/.test(T),review:/Review/.test(T),glance:h.querySelectorAll('table.td-glance tbody tr').length,comps:window.__tdComps().filter(c=>!window.__tdIsAssess(c)).length,
      lr:[...h.querySelectorAll('.td-lr .row .st')].map(e=>e.textContent.trim()),wall:/Components in this plan/.test(T),present:/Present level/.test(T)};});
  ok('4 page 1: the notice (escape extinction’s consent among its items), the summary statement, the definitions with the present level, both criteria, the review, the plan at a glance, the least-restrictive review; no wall of components',
    C.notice&&C.noticeItems>=1&&C.noticeEE&&/maintained by/.test(C.stmt)&&C.defs.includes('Replacement behavior')&&C.crit&&C.review&&C.glance>=C.comps&&C.lr.length>=3&&C.lr.some(x=>/Not yet consented|Agreed|Declined/.test(x))&&C.lr.includes('Separate')&&!C.wall,C);
  /* 5. the BIP text */
  const D=await p.evaluate(()=>{const t=window.__tdBipText();return {sum:/SUMMARY STATEMENT/.test(t),glance:/THE PLAN AT A GLANCE/.test(t),lr:/LEAST RESTRICTIVE REVIEW/.test(t),nr:/NOT READY TO START/.test(t),setup:/Set-up \(once, not an integrity item\)/.test(t),who:/Run by: classroom staff \(simulated\)/.test(t)};});
  ok('5 the text for the BIP carries the summary statement, what is not ready, the glance, the review, who runs a card and its set-up lines',D.sum&&D.glance&&D.lr&&D.nr&&D.setup&&D.who,D);
  /* 6. replace or add */
  const E=await p.evaluate(async()=>{sheet('build');await new Promise(r=>setTimeout(r,300));const R0=R();R0.querySelector('details').open=true;const q=R0.querySelector('.q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
    const pr=TD1_BANK.protocols.filter(x=>x.code==='FCT'&&x.steps.length>=4&&!x.steps.some(t=>/^RESTRICTIVE: Punishment/.test(t)))[1];const it=R0.querySelector('.it[data-id="'+pr.id+'"]');if(!it)return {noItem:pr.id};it.click();await new Promise(r=>setTimeout(r,300));
    const cards=()=>[...document.querySelectorAll('#compWrap .card')].filter(c=>c.dataset.code==='FCT');const c0=cards()[0];const i=c0.dataset.i;const before=[...c0.querySelectorAll('ol.steps textarea')].map(t=>t.value);const whoBefore=c0.querySelector('input[name$=".who"]').value;
    const n0=document.querySelectorAll('#compWrap .card').length;
    R0.querySelector('.add').click();await new Promise(r=>setTimeout(r,250));const asks=[...R0.querySelectorAll('.same .td-ask')].map(b=>b.textContent);
    const rep=R0.querySelector('.same .td-ask.primary');if(!rep)return {asks};rep.click();await new Promise(r=>setTimeout(r,500));
    const after=[...c0.querySelectorAll('ol.steps textarea')].map(t=>t.value);const n1=document.querySelectorAll('#compWrap .card').length;const said=(R0.querySelector('.st')||{}).textContent||'';const bsrc=document.querySelector('[name="cp['+i+'].bsrc"]').value;const whoAfter=c0.querySelector('input[name$=".who"]').value;
    const u=[...R0.querySelectorAll('.st button')].find(b=>/Undo/.test(b.textContent));if(u)u.click();await new Promise(r=>setTimeout(r,400));const undone=[...c0.querySelectorAll('ol.steps textarea')].map(t=>t.value);const n2=document.querySelectorAll('#compWrap .card').length;
    R0.querySelector('.add').click();await new Promise(r=>setTimeout(r,250));const second=[...R0.querySelectorAll('.same .td-ask')].find(b=>/second/.test(b.textContent));if(second)second.click();await new Promise(r=>setTimeout(r,500));const n3=document.querySelectorAll('#compWrap .card').length;
    return {asks,n0,n1,n2,n3,changed:JSON.stringify(before)!==JSON.stringify(after),stepsNow:after.filter(Boolean).length,prSteps:pr.steps.length,said:said.slice(0,80),bsrc:bsrc.slice(0,40),whoKept:whoBefore===whoAfter,restored:JSON.stringify(before)===JSON.stringify(undone)};});
  ok('6 the bank asks replace / add a second card / cancel for a component already in the plan; Replace swaps the steps and keeps the card and its who; Undo puts the words back; a second card adds one',
    E.asks&&E.asks.length===3&&E.n1===E.n0&&E.changed&&E.stepsNow===E.prSteps&&/Replaced/.test(E.said)&&E.bsrc&&E.whoKept&&E.restored&&E.n2===E.n0&&E.n3===E.n0+1,E);
  /* 7. ranked for this plan */
  const G=await p.evaluate(async()=>{const R0=R();const q=R0.querySelector('.q');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
    const fn=document.querySelector('[name="m.fn"]').value;const ids=[...R0.querySelectorAll('.it')].slice(0,12).map(b=>b.dataset.id);const P=TD1_BANK.protocols;const top=ids.map(id=>P.find(x=>x.id===id)).filter(Boolean);
    return {fn,cnt:R0.querySelector('.cnt').textContent,first:top.slice(0,5).map(x=>(x.fn||[]).join('/')||'any'),firstFits:top.length>0&&(!top[0].fn||!top[0].fn.length||top[0].fn.includes(fn))};});
  ok('7 with nothing searched the list puts this plan’s function first and says so',G.fn&&G.firstFits&&/protocols for this plan’s function \(/.test(G.cnt)   /* v24.73: the count line's wording since v24.30 */,G);
  /* 8. save and open */
  const T=await p.evaluate(()=>{sheet('build');const cb=document.querySelector('#compWrap .card input.td-su');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change',{bubbles:true}));return {k:cb.dataset.k,on:cb.checked,ov:cb.closest('.card').querySelector('input.td-suov').value};});
  const dl=p.waitForEvent('download',{timeout:60000});await p.evaluate(()=>document.querySelector('#saveBtn').click());const d=await dl;const file=path.join(require('os').tmpdir(),'td88-'+Date.now()+'.json');await d.saveAs(file);
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));const f=saved.fields||{};
  const p2=await open(file);
  const H=await p2.evaluate(()=>{sheet('select');const picks=(document.querySelector('[name="sel.picks"]')||{}).value||'';const rows=[...document.querySelectorAll('#selRec .td-rec')];const firstOff=rows[0]&&!rows[0].querySelector('.td-pick').checked;
    const who=[...document.querySelectorAll('#compWrap input[name$=".who"]')].map(e=>e.value).filter(Boolean);const su=[...document.querySelectorAll('#compWrap input.td-su')].filter(e=>e.checked).length;const c0=document.querySelector('#compWrap .card');return {picks,firstOff,who,su,first:c0.querySelector('input.td-su').checked,ov:c0.querySelector('input.td-suov').value};});
  ok('8 Save data then Open data keeps the ticks, who/when/where and the set-up marks',/":0/.test(f['sel.picks']||'')&&Object.keys(f).some(k=>/\.who$/.test(k)&&f[k])&&Object.keys(f).some(k=>/\.suov$/.test(k)&&/[01]/.test(f[k]))&&/":0/.test(H.picks)&&H.firstOff&&H.who.includes('classroom staff (simulated)')&&H.su>=1&&H.first===T.on&&H.ov===T.ov,{f:Object.keys(f).filter(k=>/picks|\.who|\.su/.test(k)).slice(0,8),H,T});
  await p2.close();
  /* 9. the five files */
  const res=[];for(const k of keys){const pk=await open(path.join(SIM,k,'td1-save.json'));const r=await pk.evaluate(async()=>{sheet('final');await new Promise(r=>setTimeout(r,700));return {steps:document.querySelectorAll('#finalBody .plan-step').length,glance:document.querySelectorAll('table.td-glance tbody tr').length,cards:document.querySelectorAll('#compWrap .card').length,stmt:/maintained by/.test((document.querySelector('.td-stmt')||{}).textContent||'')};});res.push({k,...r});await pk.close();}
  ok('9 the simulated files open and render a plan with its steps and first page',res.length===keys.length&&res.every(r=>r.steps>0&&r.cards>0&&r.glance>0&&r.stmt),res);
  /* 11 and 12. upright: the Sheets menu (the sheet controls on one row with a long sheet name; the menu stays open through a click made in code, TD-1's autosave clicks Save data) */
  {const cu=await br.newContext({viewport:{width:820,height:1180},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const pu=await cu.newPage();pu.on('pageerror',e=>errs.push(e.message));
    await pu.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1500);
    const U=await pu.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const tb=document.querySelector('.toolbar');const h=()=>Math.round(tb.getBoundingClientRect().height);const out={mode:window.nbhSheets&&nbhSheets.mode(),h0:h()};
      for(const v of ['select','respond','final']){const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(!b)continue;b.click();await w(350);out['h_'+v]=h();out['name_'+v]=(document.querySelector('.toolbar .nbh-sheets')||{}).textContent;}
      out.sw=document.documentElement.scrollWidth;out.iw=innerWidth;return out;});
    ok('11 upright, the sheet controls keep the toolbar to one row on every sheet (Select treatment, Responding to behavior, Final plan)',U.mode==='menu'&&U.h0<=64&&U.h_select<=64&&U.h_respond<=64&&U.h_final<=64&&U.sw<=U.iw,U);
    const M=await pu.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.querySelector('.toolbar .nbh-sheets').click();await w(200);const a=!!document.getElementById('nbhSheets');
      const sb=document.getElementById('saveBtn');if(sb)sb.click();document.body.dispatchEvent(new MouseEvent('click',{bubbles:true}));await w(400);const b=!!document.getElementById('nbhSheets');return {a,b,items:document.querySelectorAll('#nbhSheets .nbh-sheet').length};});
    await pu.tap('h1').catch(()=>{});await sleep(300);const closed=await pu.evaluate(()=>!document.getElementById('nbhSheets'));
    ok('12 the Sheets menu opens with every sheet, stays open through a click made in code (autosave’s Save data), and a real tap outside closes it',M.a&&M.b&&M.items>=10&&closed,{M,closed});
    await cu.close();}
  /* 13. the masthead's paragraph and the Autosave note run the form's width on screen (v21.93's 80-character measure lifted for them) */
  {const W=await p.evaluate(()=>{const m=document.querySelector('.nbh-mast'),sub=document.querySelector('.nbh-mast .nbh-sub'),note=document.querySelector('.nbh-savenote');const w=e=>e?Math.round(e.getBoundingClientRect().width):null;const inner=m?w(m.querySelector('.nbh-mast-inner')||m):null;return {inner,sub:w(sub),note:w(note),subMax:sub&&getComputedStyle(sub).maxWidth,noteMax:note&&getComputedStyle(note).maxWidth};});
    ok('13 the masthead paragraph and the Autosave note run the form’s width on screen',W.inner>0&&W.sub>=W.inner*0.8&&W.note>=W.inner*0.8&&W.subMax==='none'&&W.noteMax==='none',W);}
  ok('10 no page errors',errs.length===0,errs.slice(0,5));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
