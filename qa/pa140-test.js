/* v24.40 one shared simulated student, PA-1 and RA-1 (review R-028, R-121, E-02). PA-1's "clear hierarchy" scenario is
   loaded five times (the standard example, then New example four times): each time the paired-stimulus leader is the MSWO
   leader, the top-two set agrees, and the Summary raises no "top two are close" caution. RA-1's simulation tests three of
   PA-1's items with the percentages PA-1's paired-stimulus hierarchy gives them. usage: node qa/pa140-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1300,height:950}});p.on('pageerror',e=>errs.push('PA-1: '+String(e).slice(0,120)));
 await p.goto(BASE+'/NBH-Workstation/PA-1_Preference-Assessment-Protocol_v2026-09.html');await sleep(1500);
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
 const read=()=>p.evaluate(()=>{const rows=id=>[...document.querySelectorAll(id+' tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()));
   const ps=rows('#psRank').map(r=>({n:r[1],p:parseFloat(r[4])})),ms=rows('#msRank').map(r=>({n:r[1],p:parseFloat(r[4])}));const flags=[...document.querySelectorAll('#sumFlags li')].map(l=>l.textContent.slice(0,80));
   return {seed:nbhSim.state.seed,scn:document.getElementById('simScenario').value,ps,ms,flags,desc:(document.getElementById('simDesc')||{}).textContent||''};});
 await p.evaluate(()=>{document.getElementById('simScenario').value='clear';document.getElementById('simBtn').click();});await sleep(2500);
 const runs=[await read()];for(let k=0;k<4;k++){await p.evaluate(()=>document.querySelector('.nbh-sim-new').click());await sleep(2500);runs.push(await read());}
 const seeds=runs.map(r=>r.seed);
 ok('PA-1: the clear scenario loaded five times, the standard example (seed 1) then four New examples with seeds of their own',runs.every(r=>r.scn==='clear')&&seeds[0]===1&&new Set(seeds).size===5,{seeds});
 const agree=runs.map(r=>({seed:r.seed,psTop:r.ps[0]&&r.ps[0].n,msTop:r.ms[0]&&r.ms[0].n,ps2:r.ps.slice(0,2).map(x=>x.n).sort().join('+'),ms2:r.ms.slice(0,2).map(x=>x.n).sort().join('+'),gap:r.ps[0]&&r.ps[1]?r.ps[0].p-r.ps[1].p:null}));
 ok('every load: the paired-stimulus leader is the MSWO leader (the tablet), and the top-two sets agree',agree.every(a=>a.psTop==='Tablet (video)'&&a.msTop==='Tablet (video)'&&a.ps2===a.ms2),agree);
 ok('every load: the Summary raises no "top two are close" caution on either method (the leader is clear of the second by more than 10 points)',runs.every(r=>!r.flags.some(f=>/top two are close/i.test(f)))&&agree.every(a=>a.gap>10),runs.map(r=>r.flags));
 ok('the scenario keeps a hierarchy below the leaders that varies with the example (the lower items are still drawn)',new Set(runs.map(r=>r.ps.map(x=>x.n+x.p).join('|'))).size>=2,runs.map(r=>r.ps.map(x=>x.p).join(',')));
 const pa1={};runs[0].ps.forEach(x=>{pa1[x.n]=x.p;});await p.close();
 /* RA-1 */
 const q=await b.newPage({viewport:{width:1300,height:950}});q.on('pageerror',e=>errs.push('RA-1: '+String(e).slice(0,120)));
 await q.goto(BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(1500);
 await q.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};document.getElementById('simBtn').click();});await sleep(2500);
 const ra=await q.evaluate(()=>{const col=f=>[...document.querySelectorAll('#stimTbl [data-f="'+f+'"]')].map(e=>e.value);const m=k=>(document.querySelector('[data-meta="'+k+'"]')||{}).value||'';const names=col('name'),types=col('type'),pa=col('pa');
   return {stim:names.map((n,i)=>[n,types[i],pa[i]]),pasrc:m('pasrc'),recs:m('recs'),rotate:m('rotate'),mo:m('mo'),coa:m('coa_mat'),text:[...document.querySelectorAll('[data-meta]')].map(e=>e.value||'').join(' ')+' '+names.join(' ')};});
 ok('RA-1: the simulation tests three of PA-1\'s example items, the tablet, bubbles and the picture book, all leisure items',ra.stim.map(s=>s[0]).join('|')==='Tablet (video)|Bubbles|Picture book'&&ra.stim.every(s=>s[1]==='Leisure item'),ra.stim);
 ok('their "PA-1 rank / %" values are the percentages PA-1\'s standard clear example gives them on paired stimulus (100, 80, 40), and the source line says so',ra.stim.map(s=>+s[2]).join(',')==='100,80,40'&&ra.stim.every(s=>pa1[s[0]]===+s[2])&&/Form PA-1, paired stimulus/.test(ra.pasrc),{stim:ra.stim,pa1,pasrc:ra.pasrc});
 ok('the narrative names them (recommendations, rotation, motivating operations, the COA materials) and no fruit chew or high five is left (praise as usual stays in the motivating-operations line)',/Bubbles/.test(ra.recs)&&/picture book/i.test(ra.recs)&&/bubbles/.test(ra.rotate)&&/bubbles/.test(ra.mo)&&/bubbles \(MP\)/.test(ra.coa)&&!/fruit|high five/i.test(ra.text)&&/praise as usual/.test(ra.mo),{recs:ra.recs,rotate:ra.rotate,mo:ra.mo});
 await q.close();
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
