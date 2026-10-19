/* Form DT-1, review Wave 3 part 1: what staff do about problem behavior during the delay and what happens to the demand when
   a session stops (F398); a delay trial is completed when the reinforcer is delivered, every delay trial counts, and a wait
   that ended without the reinforcer is counted on its own (F400); the integrity criterion as DT-1's own (F405); generalization
   probes record problem behavior (F406); each probe's delivery rule (F407). Simulated data only. usage: node qa/dt1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const DT='Delay-Tolerance-Protocol-Toolkit.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+DT);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const src=await p.evaluate(async()=>await (await fetch(location.href)).text());

  /* ---- F398 ---- */
  const a=await p.evaluate(()=>{const pb=document.querySelector('[name=pb_during]'),sd=document.querySelector('[name=stop_demand]');
    return {opts:pb?[...pb.options].map(o=>o.textContent):[],sd:sd?sd.value:'',crit:document.querySelector('[name=step_crit]').value,
      ti:[...document.querySelectorAll('#tbTI tr td:first-child')].map(t=>t.textContent).find(t=>/Problem and collateral/.test(t))||''};});
  ok('1 F398 Step 4 says what staff do about problem behavior during the delay and what happens to the demand when a session stops; the integrity check scores what Tab 4 writes',
    a.opts.includes('Extinction: the delay runs on; the behavior does not end the wait or bring the reinforcer')&&a.opts.some(o=>/crisis plan stage says \(Form CR-1\)/.test(o))&&
    /^The demand in progress is finished \(with guidance as Form TD-1 writes it\) before the student leaves; nothing else is delivered$/.test(a.sd)&&/handled as written on Tab 4/.test(a.ti),a);
  ok('2 F398 the drill\'s stop-rule question: finish the demand in progress, then end the session',/Finish the demand in progress as Tab 4 writes it, then end the session; deliver nothing extra and write the row as it stands\.',1\]/.test(src)&&/stopping is not a way out/.test(src));
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1200);
  const sm=await p.evaluate(()=>({pb:document.querySelector('[name=pb_during]').value,sd:document.querySelector('[name=stop_demand]').value,dd:document.querySelector('[name=dd_rule]').value,pd:document.querySelector('[name=pd_rule]').value,
    t7:[...document.getElementById('tbTrials').rows][6].querySelectorAll('input,select')[1].value,d7:[...document.getElementById('tbTrials').rows][6].querySelectorAll('input,select')[9].value,
    sc:document.getElementById('oSC').textContent,done:document.getElementById('oDone').textContent,end:document.getElementById('oEnd').textContent,diff:document.getElementById('oDiff').textContent,
    gen:[...document.getElementById('tbGen').rows].map(tr=>[...tr.querySelectorAll('input,select')].slice(6,8).map(x=>x.value).join('/'))}));
  ok('3 F398 F400 the example writes the consequence and the demand, and its failed wait is No response, not delivered (never an impulsive choice)',
    /^Extinction/.test(sm.pb)&&/finished with guidance \(Form TD-1\)/.test(sm.sd)&&sm.t7==='No response'&&sm.d7==='No'&&sm.sc==='5/6 (83.3%)'&&sm.done==='5/6 (83.3%)'&&sm.end==='1'&&sm.diff==='not read (contingency-based)',sm);
  /* ---- F400 the reviewer's cases ---- */
  const set=rows=>p.evaluate(rows=>{const tb=document.getElementById('tbTrials');tb.innerHTML='';const add=document.querySelector('[data-add="tbTrials"]');rows.forEach(v=>{add.click();const f=tb.rows[tb.rows.length-1].querySelectorAll('input,select');v.forEach((x,i)=>{if(f[i])f[i].value=x;});});
    const last=tb.rows[tb.rows.length-1].querySelector('input,select');last.dispatchEvent(new Event('input',{bubbles:true}));last.dispatchEvent(new Event('change',{bubbles:true}));
    return {sc:document.getElementById('oSC').textContent,done:document.getElementById('oDone').textContent,end:document.getElementById('oEnd').textContent,diff:document.getElementById('oDiff').textContent,obt:document.getElementById('oObt').textContent};},rows);
  const c1=await set([['Delay','SC','90','70','3','Indep.','Yes','0','0','Yes','Finished the two problems at 70 s']]);
  const c2=await set([['Delay','SC','90','91','','','','0','0','Yes',''],['Delay','SC','90','91','','','','0','0','Yes',''],['Delay','SC','90','91','','','','0','0','Yes',''],['Delay','No response','90','','','','','1','0','No','Aggression; no break']]);
  ok('4 F400 under a contingency-based delay, a requirement met at 70 s of a 90-s step is completed, with no differential read',c1.done==='1/1 (100.0%)'&&c1.end==='0'&&c1.obt==='70.0'&&c1.diff==='not read (contingency-based)',c1);
  ok('5 F400 a wait that ended in aggression with no reinforcer stays in the denominator (3 of 4, 75%) and is counted as ended without reinforcement',c2.sc==='3/4 (75.0%)'&&c2.done==='3/4 (75.0%)'&&c2.end==='1',c2);
  await p.evaluate(()=>{const r=document.querySelector('[name=delaytype][value=tbpd]');r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));});
  const c3=await set([['Delay','SC','90','70','3','Indep.','Yes','0','0','Yes','']]);
  ok('6 F400 under a time-based delay the shortfall is read as a differential (-20)',c3.diff==='-20.0',c3);
  ok('7 F400 the default session criterion counts completed delay trials',/^Delay completed \(requirement met, reinforcer delivered\) on at least 80% of delay trials$/.test(await p.evaluate(()=>document.querySelector('[name=step_crit]').defaultValue)));
  const old=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;const d=JSON.parse(txt);d.tables.tbTrials=[['Delay','SC','90','91','3','Indep.','Yes','0','0','An old note']];
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,600));
    const v=[...document.getElementById('tbTrials').rows[0].querySelectorAll('input,select')].map(x=>x.value);return {v,done:document.getElementById('oDone').textContent};});
  ok('8 F400 a file saved before the Delivered column opens with its note in place, and its trial completed by the clock as before',old.v[9]===''&&old.v[10]==='An old note'&&old.done==='1/1 (100.0%)',old);
  /* ---- F405 F406 F407 ---- */
  ok('9 F405 the integrity note states the rule as this protocol\'s and says what TI-1\'s 80-89% band means here',/This is this protocol's rule \(Form PR-1 uses 90% too\)\. Form TI-1 reads 80&ndash;89% as a band that calls for a re-check; here it means re-check and retrain, not advance\./.test(src)&&!/integrity criterion TI-1, TD-1 and PR-1 use/.test(src));
  ok('10 F406 generalization probes record problem behavior per minute and whether the stop rule was met',/<th class="num" style="width:8%">PB \/ min<\/th><th style="width:8%">Stop rule met<\/th>/.test(src)&&sm.gen.length===5&&sm.gen[4]==='0.4/No',sm.gen);
  ok('11 F407 each probe has a delivery rule, and the example delivers real outcomes on drawn trials',sm.dd==='Real outcome on randomly drawn trials'&&sm.pd==='Real outcome on randomly drawn trials'&&/Experienced choice, classroom adaptation/.test(src),sm);
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
