/* v22.58 Form RA-1's progressive ratio, from the articles the practice holds: each ratio presented once or twice (Roane,
   Lerman, & Vorndran, 2001); every session keeps its minutes and all its responses, and the summary gives the median break
   point, the mean minutes and the responses per minute, with a cumulative record per condition (Penrod, Wallace, & Dyer,
   2008); access to an edible can last until it is consumed (Francisco, Borrero, & Sy, 2008), on the single-operant runner
   too; an older saved copy opens as before. Simulated data only.  usage: node qa/v2258-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const RA='Reinforcer_Assessment_Protocol.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+RA);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;});
  const txt=id=>p.evaluate(i=>(document.getElementById(i)||{}).textContent||'',id);
  const sum=v=>p.evaluate(v=>Object.fromEntries([...document.querySelectorAll('#ra-run-'+v+'-sum tr')].map(r=>[r.children[0].textContent,r.children[1].textContent])),v);
  const heads=()=>p.evaluate(()=>[...document.querySelectorAll('#prTbl thead th')].map(t=>t.textContent.trim()));
  /* 1 each ratio twice */
  const h1=await heads();
  await p.evaluate(()=>{const s=document.getElementById('prRep');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
  const h2=await heads(),par=await txt('prParams');
  const fr=h=>h.filter(x=>/^FR \d+$/.test(x));
  ok('1 Each ratio twice: the sheet\'s columns hold each ratio twice (20 of them), and the parameters line says so',fr(h1).length===14&&fr(h2).length===20&&fr(h2).slice(0,4).join()==='FR 1,FR 1,FR 2,FR 2'&&/each ratio twice/.test(par)&&h2.includes('Minutes')&&h2.includes('All responses'),{h1:fr(h1).slice(0,4),h2:fr(h2).slice(0,6),par});
  /* 2 a row ticked by hand: the break point is the last ratio completed; responses add both presentations */
  await p.evaluate(()=>{const c=document.querySelector('#prTbl [data-k="5"][data-f="cond"]');c.value='1';c.dispatchEvent(new Event('input',{bubbles:true}));
    [0,1,2].forEach(j=>{const b=document.querySelector('#prTbl [data-k="5"][data-j="'+j+'"]');b.checked=true;b.dispatchEvent(new Event('input',{bubbles:true}));});});await sleep(200);
  const r5=await p.evaluate(()=>({bp:document.getElementById('prB5').textContent,n:document.getElementById('prN5').textContent,k:document.getElementById('prK5').textContent}));
  ok('2 FR 1, FR 1 and FR 2 ticked: break point 2, 4 responses in the completed ratios, 3 ratios completed',r5.bp==='2'&&r5.n==='4'&&r5.k==='3',r5);
  /* 3 the runner with each ratio twice, then Save: minutes and all responses on the row */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-pr';const c=document.getElementById('ra-run-pr-cond');c.value='0';c.dispatchEvent(new Event('change'));
    const a=document.getElementById('ra-run-pr-acc');a.value='0';a.dispatchEvent(new Event('input'));document.getElementById('ra-run-pr-start').click();});await sleep(500);
  for(let i=0;i<7;i++){await p.evaluate(()=>document.getElementById('ra-run-pr-resp').click());await sleep(120);}   /* 1 + 1 + 2 + 2, and one toward FR 3 */
  const lad=await txt('ra-run-pr-lad');
  await p.evaluate(()=>document.getElementById('ra-run-pr-end').click());await sleep(400);
  const s3=await sum('pr');
  ok('3 the runner presents FR 1, FR 1, FR 2, FR 2 and then FR 3; 7 responses: break point FR 2, the summary gives the minutes and all responses',/FR 1 ✓FR 1 ✓FR 2 ✓FR 2 ✓FR 3: 1\/3/.test(lad)&&/^FR 2 /.test(s3['Break point']||'')&&/^7/.test(s3['All responses recorded']||'')&&/minutes the response was available/.test(s3['Minutes on the sheet']||''),{lad,s3});
  await p.evaluate(()=>document.getElementById('ra-run-pr-save').click());await sleep(400);
  const r0=await p.evaluate(()=>{const g=f=>{const e=document.querySelector('#prTbl [data-k="0"][data-f="'+f+'"]');return e?e.value:null;};return {cond:g('cond'),min:g('min'),all:g('all'),bp:document.getElementById('prB0').textContent,ticks:[...document.querySelectorAll('#prTbl [data-k="0"][data-f="done"]')].filter(x=>x.checked).length};});
  ok('4 Save to the sheet: the row has its ticks (4), break point 2, the minutes and all 7 responses',r0.cond==='0'&&r0.ticks===4&&r0.bp==='2'&&r0.all==='7'&&+r0.min>=0&&r0.min!=='',r0);
  /* 5 the summary: median, minutes, rate; the cumulative record */
  await p.evaluate(()=>{const g=(k,f,v)=>{const e=document.querySelector('#prTbl [data-k="'+k+'"][data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    g(0,'min','2');g(1,'cond','0');[0,1,2,3,4,5].forEach(j=>{const b=document.querySelector('#prTbl [data-k="1"][data-j="'+j+'"]');b.checked=true;b.dispatchEvent(new Event('input',{bubbles:true}));});g(1,'min','4');g(1,'all','18');
    g(2,'cond','0');[0,1].forEach(j=>{const b=document.querySelector('#prTbl [data-k="2"][data-j="'+j+'"]');b.checked=true;b.dispatchEvent(new Event('input',{bubbles:true}));});g(2,'min','1');g(2,'all','2');});await sleep(300);
  const rk=await p.evaluate(()=>{const H=[...document.querySelectorAll('#prRank thead th')].map(t=>t.textContent);const row=[...document.querySelectorAll('#prRank tbody tr')].find(r=>/Stimulus A|^A/.test(r.children[1].textContent)&&r.children[2].textContent==='3');
    return {H,row:row?[...row.children].map(c=>c.textContent):null};});
  const col=n=>rk.row?rk.row[rk.H.indexOf(n)]:null;
  ok('5 the summary: median break point 2 (sessions at 2, 3 and 1), mean minutes 2.3, responses per minute 27 / 7 = 3.9',!!rk.row&&col('Median break point')==='2.0'&&col('Mean minutes')==='2.3'&&col('Responses per minute')==='3.9',rk);
  const cum=await p.evaluate(()=>{const s=document.getElementById('prCum');return {lines:s.querySelectorAll('polyline').length,pts:s.querySelector('polyline')?s.querySelector('polyline').getAttribute('points').split(' ').length:0,cap:(s.closest('.figure')||{}).textContent||''};});
  ok('6 the cumulative record: one line per condition with responses recorded, a point per session, and the caption names Penrod et al. (2008)',cum.lines===1&&cum.pts===3&&/Penrod et al\., 2008/.test(cum.cap),cum);
  /* 7 access until consumed, single operant */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-so';const c=document.getElementById('ra-run-so-cond');c.value='0';c.dispatchEvent(new Event('change'));
    const m=document.getElementById('ra-run-so-amode');m.value='eat';m.dispatchEvent(new Event('change'));document.getElementById('ra-run-so-start').click();});await sleep(500);
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(1300);
  const e1={cue:await txt('ra-run-so-cueh'),cuet:await txt('ra-run-so-cuet'),btn:await p.evaluate(()=>!document.getElementById('ra-run-so-eat').hidden),el:await txt('ra-run-so-el'),msg:await txt('ra-run-so-msg')};
  await p.evaluate(()=>document.getElementById('ra-run-so-resp').click());await sleep(200);
  const n1=await txt('ra-run-so-n');
  await p.evaluate(()=>document.getElementById('ra-run-so-eat').click());await sleep(300);
  const e2={msg:await txt('ra-run-so-msg'),btn:await p.evaluate(()=>!document.getElementById('ra-run-so-eat').hidden),cue:await txt('ra-run-so-cueh')};
  ok('7 single operant, access until consumed: the cue waits for Consumed (the clock waits), a response meanwhile is recorded apart, Consumed ends the access',/Access until consumed/.test(e1.cue)&&/tap Consumed when it is eaten/.test(e1.cuet)&&e1.btn&&/clock waiting/.test(e1.el)&&/tap Consumed/.test(e1.msg)&&n1==='1'&&/^Consumed\. The task is back\./.test(e2.msg)&&!e2.btn&&!/until consumed/.test(e2.cue),{e1,n1,e2});
  await p.evaluate(()=>document.getElementById('ra-run-so-end').click());await sleep(400);
  const s7=await sum('so');
  ok('8 its summary: the condition says access until consumed, and the access time is the time it took',/access until consumed/.test(s7['Condition']||'')&&/^0:0[1-3]$/.test(s7['Access time']||''),s7);
  await p.evaluate(()=>document.getElementById('ra-run-so-discard').click());await sleep(300);
  /* 9 the progressive ratio waits too, the E key ends it, and the stop interval starts again from Consumed */
  await p.evaluate(()=>{document.body.className=document.body.className.replace(/view-\w+/,'')+' view-pr';const s=document.getElementById('prRep');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  await p.evaluate(()=>{const c=document.getElementById('ra-run-pr-cond');c.value='0';c.dispatchEvent(new Event('change'));const m=document.getElementById('ra-run-pr-amode');m.value='eat';m.dispatchEvent(new Event('change'));document.getElementById('ra-run-pr-start').click();});await sleep(400);
  await p.evaluate(()=>document.getElementById('ra-run-pr-resp').click());await sleep(2300);
  const q1={left:await txt('ra-run-pr-left'),cap:await txt('ra-run-pr-cap'),pill:await p.evaluate(()=>document.getElementById('ra-run-pill-t').textContent)};
  await p.keyboard.press('e');await sleep(1300);
  const q2={left:await txt('ra-run-pr-left'),msg:await txt('ra-run-pr-msg')};
  ok('9 progressive ratio: the stop interval waits while it is eaten; E taps Consumed, and the stop interval starts again then',q1.left==='2:00'&&/waits during access/.test(q1.cap)&&/^Consumed\. The task is back\. Now FR 2\./.test(q2.msg)&&/^1:5[89]$/.test(q2.left),{q1,q2});
  await p.evaluate(()=>document.getElementById('ra-run-pr-end').click());await sleep(300);await p.evaluate(()=>document.getElementById('ra-run-pr-discard').click());await sleep(300);
  /* 10 an older saved copy: no presentations setting, rows without minutes */
  await p.evaluate(()=>{const s=document.getElementById('prRep');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(300);
  const dlP=p.waitForEvent('download',{timeout:15000});await p.evaluate(()=>document.getElementById('saveBtn').click());const dl=await dlP;
  const d=JSON.parse(require('fs').readFileSync(await dl.path(),'utf8'));delete d.prRep;d.pr.forEach(r=>{delete r.min;delete r.all;});
  await p.setInputFiles('#fileIn',{name:'RA-1_old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(d))});await sleep(800);
  const old=await p.evaluate(()=>({rep:document.getElementById('prRep').value,cols:[...document.querySelectorAll('#prTbl thead th')].filter(t=>/^FR \d+$/.test(t.textContent.trim())).length,min:document.querySelector('#prTbl [data-k="3"][data-f="min"]').value,bp:document.getElementById('prB0').textContent}));
  ok('10 an older saved copy (no presentations setting, no minutes) opens with each ratio once, 14 ratio columns, empty minutes and its ticks',old.rep==='1'&&old.cols===14&&old.min===''&&old.bp!=='',old);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('11 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
