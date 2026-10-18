/* v22.64 Form PA-1 from the reinforcer-assessment articles: the summary flags a never-selected item (Glover et al., 2008;
   Francisco et al., 2008), the top two close together (Roane et al., 2001), an item approached alone but rarely chosen in
   pairs (Roscoe et al., 1999; Penrod et al., 2008) and the middle of the hierarchy (Piazza et al., 1996); the paired-stimulus
   list can run three administrations, each every pair once in its own order (DeLeon et al., 2009); with Sample both, then
   again, a pair with no selection is presented again after the student samples both, by the Neither key or when the window
   runs out, and only the second no-selection is scored Neither (Fisher et al., 1992). Simulated data only.
   usage: node qa/v2264-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/PA-1_Preference-Assessment-Protocol_v2026-09.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const save=async()=>{const dlP=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('saveBtn').click());const dl=await dlP;return JSON.parse(fs.readFileSync(await dl.path(),'utf8'));};
  const open=async d=>{await p.setInputFiles('#fileIn',{name:'PA1_test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(900);};
  /* a pool of six, every pair once: Tablet, Bubbles and Squeeze ball at 80% each, Picture book 40%, Musical toy 20%,
     Blocks never selected; Musical toy approached on every single-stimulus trial */
  const d=await save();const st=d.state||d;
  const names=['Tablet (video)','Bubbles','Squeeze ball','Picture book','Musical toy','Blocks'];
  st.n=6;st.psRep=1;names.forEach((nm,i)=>{st.stim[i]=Object.assign({},st.stim[i]||{},{name:nm});});
  const tr=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)tr.push({l:i,r:j,sel:(i===0&&j===1)||(i===1&&j===2)?'R':'L',pb:false});
  st.ps=Object.assign({},st.ps||{},{seed:1,trials:tr});
  const T=st.ssTrials||5;st.ss=names.map((_,i)=>Array.from({length:T},()=>({a:i===4||i===0?'A':'',e:'',pb:false})));
  await open(d);
  const flags=await p.evaluate(()=>[...document.querySelectorAll('#sumFlags li')].map(li=>li.textContent.replace(/\s+/g,' ')));
  const has=re=>flags.some(f=>re.test(f));
  ok('1 never selected: Blocks, a weak candidate (Glover et al., 2008), while a low-but-selected item may still reinforce alone (Francisco et al., 2008)',has(/^Never selected: Blocks\. .*Glover et al\. \(2008\).*Francisco et al\., 2008/),flags);
  ok('2 the top two close on paired stimulus (80% and 80%): test both in RA-1 progressive ratio (Roane et al., 2001)',has(/^The top two are close on paired stimulus: Tablet \(video\) 80%, Bubbles 80%\. .*progressive ratio.*Roane et al\., 2001/),flags);
  ok('3 approached alone, rarely chosen in pairs: Musical toy (single stimulus 100%, paired 20%), to RA-1 single operant then progressive ratio',has(/^Approached alone, rarely chosen in pairs: Musical toy \(single stimulus 100%, paired 20%\)\. .*Roscoe et al\., 1999.*Penrod et al\., 2008/),flags);
  ok('4 the middle of the hierarchy named, with Piazza et al. (1996)',has(/^The middle of the hierarchy \([^)]+\): in Piazza et al\. \(1996\)/),flags);
  /* three administrations */
  await p.evaluate(()=>document.querySelector('#psRepSeg button[data-rep="3"]').click());await sleep(500);
  const ad=await p.evaluate(()=>{const ss=[...document.querySelectorAll('#psTbl select[data-f="sel"]')].map(s=>{const td=s.closest('td'),r=td.previousElementSibling,l=r&&r.previousElementSibling;return {k:+s.dataset.k,l:l&&l.dataset.lbl,r:r&&r.dataset.lbl};}).sort((a,b)=>a.k-b.k);
    return {n:ss.length,blocks:[0,1,2].map(b=>ss.slice(b*15,b*15+15).map(t=>[+t.l,+t.r].sort().join('-')).sort().join(',')),order:[0,1,2].map(b=>ss.slice(b*15,b*15+15).map(t=>t.l+'-'+t.r).join(',')),info:document.getElementById('psInfo').textContent};});
  const all=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)all.push(i+'-'+j);const want=all.sort().join(',');
  ok('5 Three times: 45 trials, three administrations of every pair once, each in its own order',ad.n===45&&ad.blocks.every(b=>b===want)&&new Set(ad.order).size===3&&/Three administrations of 15 trials \(1–15, 16–30, 31–45\), each in its own order; the hierarchy combines them \(DeLeon et al\., 2009\)/.test(ad.info),{n:ad.n,info:ad.info,blocks:ad.blocks.map(b=>b===want)});
  /* sample both, then again */
  await p.evaluate(()=>{document.querySelector('#psNoneSeg button[data-none="1"]').click();const w=document.getElementById('pa-run-ps-win');w.value='1';w.dispatchEvent(new Event('input',{bubbles:true}));w.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  const msg=()=>p.evaluate(()=>document.getElementById('pa-run-ps-msg').textContent.replace(/\s+/g,' '));
  const dis=id=>p.evaluate(id=>document.getElementById(id).disabled,id);
  const click=async id=>{await p.evaluate(id=>document.getElementById(id).click(),id);await sleep(150);};
  await click('pa-run-ps-start');await click('pa-run-ps-n');const m1=await msg(),sv1=await dis('pa-run-ps-save'),st1=await dis('pa-run-ps-start');
  await click('pa-run-ps-start');await click('pa-run-ps-n');const m2=await msg(),sv2=await dis('pa-run-ps-save');
  await click('pa-run-ps-save');await sleep(200);const sel0=await p.evaluate(()=>document.querySelector('#psTbl select[data-f="sel"][data-k="0"]').value);
  ok('6 Sample both: Neither the first time presents the pair again after sampling; the second time it is scored Neither and saved',/sample each item briefly/.test(m1)&&sv1&&!st1&&/^Neither\. Remove both items\./.test(m2)&&!sv2&&sel0==='N',{m1,sv1,st1,m2,sv2,sel0});
  await click('pa-run-ps-start');await sleep(1700);const m3=await msg(),st3=await dis('pa-run-ps-start');
  await click('pa-run-ps-start');await sleep(1700);const m4=await msg();
  ok('7 the window running out does the same: sample and present again, then scored Neither',/sample each item briefly/.test(m3)&&!st3&&/No selection within 1 s: scored Neither/.test(m4),{m3,st3,m4});
  await click('pa-run-ps-save');await sleep(200);
  await p.evaluate(()=>document.querySelector('#psNoneSeg button[data-none="0"]').click());await sleep(150);
  await click('pa-run-ps-start');await click('pa-run-ps-n');const m5=await msg();
  ok('8 Score Neither (the default) scores at once, as before',/^Neither\. Remove both items\./.test(m5),m5);
  const method=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('9 the paired-stimulus method says both, with their sources',/DeLeon et al\. \(2009\) ran the paired-stimulus assessment three times/.test(method)&&/only no selection the second time is scored Neither \(Fisher et al\., 1992; Piazza et al\., 1996\)/.test(method));
  const rt=await save();const rs=rt.state||rt;
  ok('10 the settings are saved with the file (psRep 3, psNone 0)',rs.psRep===3&&rs.psNone===0,{psRep:rs.psRep,psNone:rs.psNone});
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('11 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
