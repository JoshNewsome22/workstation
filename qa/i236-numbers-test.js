/* v23.64 (review Wave 4, I236, F471): today's numbers from a caseload card, without opening the case.
   Two simulated students kept on this device, one on screen with Form DD-1 open:
   1. every student's card (Caseload and the start screen), Today and the command box offer Today's numbers;
   2. for the student not on screen: the sheet lists their DD-1 targets as their kept case holds them; +, +, Save puts 2 on
      the day's total in their kept copy, out of sight, and the case on screen is not touched (no form loaded, nothing
      unsaved);
   3. for the student on screen: their open DD-1 takes it (the day's total goes up by one) and the case shows unsaved work;
   4. a percent target takes correct and not correct as "x of n"; nothing to save is refused; a kept copy saved again
      meanwhile is not written over. Simulated students only.  usage: node qa/i236-numbers-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const ymd=t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'),TODAY=ymd(new Date());
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};wsUI.choose=async()=>'switch';}catch(e){}window.__t=[];const t=wsUI.toast;wsUI.toast=(m,o)=>{__t.push(String(m));return t(m,o);};});
  /* a case with DD-1 from its simulation, kept for two simulated students */
  const made=await p.evaluate(async()=>{openForm('DD-1');const fr=state.frames['DD-1'];const t0=performance.now();while(!state.status['DD-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));
    const w=fr.contentWindow;w.confirm=()=>true;w.alert=()=>{};if(w.nbhUI)w.nbhUI.confirm=async()=>true;const b=w.document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample');if(b){b.click();await new Promise(r=>setTimeout(r,2000));}
    const s=await grab('DD-1','snapshot',null,8000);const tg=w.ddDayTargets();return {snap:s&&s.snap,title:s&&s.title,targets:tg.targets.map(x=>({id:x.id,name:x.name,k:x.k,measure:x.measure}))};});
  const N=made.targets.find(x=>x.k==='n'),P=made.targets.find(x=>x.k==='p');
  ok('0 the simulated DD-1 has a counted target'+(P?' and a percent one':''),!!(made.snap&&N),made.targets);
  const A={client:'Mateo Rivera (simulated)',sid:'4471823',grade:'4',site:'Test Elementary (simulated)',bcba:'Jordan Ellis (simulated)'},B={client:'Leo Whitfield (simulated)',sid:'5550199',grade:'3',site:'Test Elementary (simulated)',bcba:'Jordan Ellis (simulated)'};
  const keys=await p.evaluate(async({A,B,made})=>{const out={};for(const pk of [B,A]){const d={form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:pk,forms:{'DD-1':{title:made.title,snap:made.snap}},cur:'DD-1'};
      await clearCase();await openCaseText(JSON.stringify(d),null,{asked:true,quiet:true});await caseloadKeep(packet(),{'DD-1':{title:made.title,snap:made.snap}},[]);out[pk===A?'a':'b']=clKey(packet());}
    await settled('DD-1',15000);return out;},{A,B,made});
  await sleep(1500);
  /* 1. the buttons */
  await p.evaluate(()=>caseloadOpen());await sleep(1200);
  const cards=await p.evaluate(()=>[...document.querySelectorAll('#dlgBody .cl-card')].map(c=>({k:c.dataset.clrow,day:!!c.querySelector('[data-clday]')})));
  const cmd=await p.evaluate(()=>CMDS.some(c=>/Today’s numbers/.test(c.n)));
  ok('1 every student\'s card in Caseload has Today\'s numbers, and the command box offers it',cards.length>=2&&cards.every(c=>c.day)&&cmd,{cards,cmd});
  /* 2. the student not on screen */
  const before=await p.evaluate(()=>({frames:Object.keys(state.frames),dirty:caseDirty(),client:$('#pClient').value}));
  await p.evaluate(k=>document.querySelector('#dlgBody [data-clday="'+k+'"]').click(),keys.b);await sleep(1200);
  const sheet=await p.evaluate(()=>({who:($('#dyWho')||{}).value,rows:[...document.querySelectorAll('#dyRows tr[data-dyt]')].map(r=>r.dataset.dyt+':'+r.dataset.dyk)}));
  ok('2a the sheet opens for that student with their DD-1 targets, as their kept case holds them',sheet.who===keys.b&&sheet.rows.some(x=>x.startsWith(N.id+':n')),{sheet,N});
  const iN=sheet.rows.findIndex(x=>x.startsWith(N.id+':'));
  await p.evaluate(i=>{const tr=document.querySelectorAll('#dyRows tr[data-dyt]')[i];const plus=tr.querySelector('.dy-pm[data-d="1"]');plus.click();plus.click();},iN);
  await p.click('#dySave');await sleep(4500);
  const after=await p.evaluate(async({k,id,date})=>{const r=(await clList()).find(x=>x.key===k);const d=parseCase(r.text);const S=JSON.parse(d.forms['DD-1'].snap.own);const row=S.rows.find(x=>x.date===date);
      return {v:row?row.values[id]:null,by:row?row.by:null,frames:Object.keys(state.frames),dirty:caseDirty(),client:$('#pClient').value,toast:__t.slice(-1)[0]};},{k:keys.b,id:N.id,date:TODAY});
  const S0=JSON.parse(made.snap.own),row0=(S0.rows||[]).find(x=>x.date===TODAY),v0=row0?Number(row0.values[N.id])||0:0;
  ok('2b +, +, Save: their kept copy\'s Form DD-1 holds 2 more on today\'s total ('+v0+' to '+after.v+'), placed out of sight',Number(after.v)===v0+2&&/Leo Whitfield/.test(after.toast||''),after);
  ok('2c the case on screen is not touched: the same forms loaded, nothing unsaved, the same student',after.frames.join()===before.frames.join()&&after.dirty===before.dirty&&after.client===before.client,{before,after});
  /* 3. the student on screen */
  await p.evaluate(()=>dayNumbersOpen(''));await sleep(1000);
  const w3=await p.evaluate(()=>($('#dyWho')||{}).value);
  const i3=await p.evaluate(id=>[...document.querySelectorAll('#dyRows tr[data-dyt]')].findIndex(r=>r.dataset.dyt===id),N.id);
  const live0=await p.evaluate(({id,date})=>Number(state.frames['DD-1'].contentWindow.ddDayTargets(date).targets.find(x=>x.id===id).v)||0,{id:N.id,date:TODAY});
  await p.evaluate(i=>{document.querySelectorAll('#dyRows tr[data-dyt]')[i].querySelector('.dy-pm[data-d="1"]').click();},i3);await p.click('#dySave');await sleep(3000);
  const live=await p.evaluate(({id,date})=>({v:Number(state.frames['DD-1'].contentWindow.ddDayTargets(date).targets.find(x=>x.id===id).v)||0,dirty:caseDirty()}),{id:N.id,date:TODAY});
  ok('3 for the student on screen, the open Form DD-1 takes it ('+live0+' to '+live.v+') and the case shows unsaved work',w3===keys.a&&live.v===live0+1&&live.dirty,{w3,live0,live});
  /* 4. a percent; nothing to save; saved again meanwhile */
  if(P){const r=await p.evaluate(({id,date})=>state.frames['DD-1'].contentWindow.ddDayEntry({date,d:{[id]:{p:3,m:1}},w:'Jordan Ellis (simulated)'}),{id:P.id,date:TODAY});
    ok('4a a percent target takes correct and not correct ("3 of 4")',r.ok&&r.placed.some(x=>x.id===P.id&&/3 of 4/.test(x.what)),r);}
  await p.evaluate(k=>dayNumbersOpen(k),keys.b);await sleep(900);const n0=await p.evaluate(()=>__t.length);await p.click('#dySave');await sleep(600);
  const none=await p.evaluate(n0=>__t.slice(n0),n0);
  ok('4b nothing to save is refused, and nothing is written',none.some(x=>/Nothing to save/.test(x)),none);
  const meanwhile=await p.evaluate(async({k,id,date})=>{const r=(await clList()).find(x=>x.key===k);const old=r.saved;
      const orig=window.clFrameFor;window.clFrameFor=async function(){const f=await orig.apply(this,arguments);r.saved=new Date(Date.now()+5000).toISOString();await clTx('readwrite',st=>st.put(r));return f;};
      const res=await dyDeliver(k,{date,d:{[id]:{n:5}},w:'test'});window.clFrameFor=orig;const r2=(await clList()).find(x=>x.key===k);const S=JSON.parse(parseCase(r2.text).forms['DD-1'].snap.own);const row=S.rows.find(x=>x.date===date);
      return {res,v:row?Number(row.values[id]):null};},{k:keys.b,id:N.id,date:TODAY});
  ok('4c a kept copy saved again meanwhile (another tab, Drive) is not written over, and the sheet says so',meanwhile.res&&!meanwhile.res.ok&&/saved again meanwhile/.test(meanwhile.res.why)&&meanwhile.v===Number(after.v),meanwhile);
  /* the start screen and Today */
  await p.evaluate(()=>{try{$('#dlg').close();}catch(e){}todayOpen();});await sleep(1200);const td=await p.evaluate(()=>!!document.querySelector('#dlgBody #tdDay'));
  await p.evaluate(()=>{try{$('#dlg').close();}catch(e){}});await p.evaluate(async()=>{await clearCase();});await sleep(1500);
  const bl=await p.evaluate(()=>({btn:!!document.querySelector('#blDay'),cards:[...document.querySelectorAll('#blank .cl-card [data-clday]')].length}));
  ok('1b Today and the start screen offer it, and the start screen\'s cards',td&&bl.btn&&bl.cards>=2,{td,bl});
  ok('5 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
