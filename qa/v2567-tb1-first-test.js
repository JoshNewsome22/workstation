/* v25.67 (the BCBA, 11/6): TB-1's "Statements about hurting oneself" stays under Precursors, and its risk-procedure line
   (the entry's `first`) is shown above everything else: in the entry's full view and when it is loaded into a card. The
   replacement library's "Stays within reach" counts an offered hand the student takes by choice. Simulated data only. */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const URL=L.BASE+'/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html';
const host=t=>`#tgtWrap .card[data-tgt="${t}"] .tb1lib-host`;
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await sleep(1200);
  await p.evaluate(()=>{if(window.nbhUI){nbhUI.confirm=async()=>true;}window.alert=()=>{};});
  await p.evaluate(()=>{const b=document.querySelector('#viewSeg button[data-view="define"]');if(b)b.click();});await sleep(300);
  const E=await p.evaluate(()=>TB1_LIB.entries.find(e=>e.id==='pre-self-harm-talk'));
  ok('1 the entry is a precursor and has its first line',E&&E.cat==='Precursors'&&/risk procedure first/.test(E.first||''),E&&{cat:E.cat,first:E.first});
  const n=await p.evaluate(()=>TB1_LIB.entries.filter(e=>e.first).length);
  ok('2 only that entry has one',n===1,n);
  await p.locator(host(0)+' select.pick').selectOption('pre-self-harm-talk');await sleep(150);
  await p.locator(host(0)+' button.go').click();await sleep(500);
  if(await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);}))await p.evaluate(()=>{const d=document.getElementById('nbhUiDlg');const b=[...d.querySelectorAll('button')].find(b=>/replace|load|ok|yes/i.test(b.textContent));if(b)b.click();});
  await sleep(400);
  const done=await p.evaluate(h=>{const R=document.querySelector(h).shadowRoot,f=R.querySelector('.done .first'),m=R.querySelector('.done .msg');
    return {shown:!!f&&!f.hidden&&getComputedStyle(f).display!=='none',txt:f?f.textContent:'',bg:f?getComputedStyle(f).backgroundColor:'',before:!!(f&&m&&f.compareDocumentPosition(m)&Node.DOCUMENT_POSITION_FOLLOWING),
      lab:document.querySelector('[name="tgt[0].lab"]').value};},host(0));
  ok('3 loaded into a card: the risk line shows first, in red',done.shown&&/risk procedure first/.test(done.txt)&&done.before&&done.bg==='rgb(253, 236, 235)',done);
  ok('4 the risk line is not loaded into the card fields',!/risk procedure first/.test(await p.evaluate(()=>[...document.querySelectorAll('[name^="tgt[0]."]')].map(e=>e.value).join(' '))));
  /* the full entry */
  await p.evaluate(h=>{const b=document.querySelector(h).shadowRoot.querySelector('button.read');if(b)b.click();},host(0));await sleep(500);
  const det=await p.evaluate(()=>{const P=document.querySelector('#tb1LibPanel');const R=P&&P.shadowRoot;const f=R&&R.querySelector('.first');
    return {has:!!f,txt:f?f.textContent:'',bg:f?getComputedStyle(f).backgroundColor:''};});
  ok('5 the full entry shows the risk line under its heading, in red',det.has&&/risk procedure first/.test(det.txt)&&det.bg==='rgb(253, 236, 235)',det);
  /* another entry has none */
  await p.locator(host(1)+' select.pick').selectOption('pre-protest').catch(()=>{});await sleep(100);
  await p.locator(host(1)+' button.go').click().catch(()=>{});await sleep(500);
  const other=await p.evaluate(h=>{const R=document.querySelector(h)&&document.querySelector(h).shadowRoot;const f=R&&R.querySelector('.done .first');return f?f.hidden:null;},host(1));
  ok('6 an entry without one shows no risk line',other===true,other);
  /* the replacement library: an offered hand, taken by choice */
  const r=await p.evaluate(()=>TB1_RLIB.entries.find(e=>e.id==='r-stay-near'));
  ok('7 "Stays within reach" counts an offered hand the student takes, and no adult takes hold',r&&/offered hand by the student's own choice/.test(r.def)&&/never takes hold/.test(r.note),r&&r.def);
  ok('8 no page errors',errs.length===0,errs);
 }catch(e){ok('run',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
