/* Form DT-1, review Wave 3 part 2: the arrangement chosen on Tab 1 drives the sheet, with an FCT baseline on the reinforcer the
   plan delays and the example rewritten on it (F399, I201); figures carried instead of typed twice (F404); the research-grade
   measures folded away and left off paper while closed (I205). Simulated data only. usage: node qa/dt1-w3b-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const DT='Delay-Tolerance-Protocol-Toolkit.html';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+DT);await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__said=m;};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=m=>{window.__said=m;};}});return p;};
  const st=p=>p.evaluate(()=>({choice:document.getElementById('preChoice').hidden,esc:document.getElementById('preEsc').hidden,fct:document.getElementById('preFct').hidden,
    keep:[...document.querySelectorAll('.arr-keep')].filter(k=>!k.hidden).map(k=>k.closest('.arr-blk').id),lede:document.getElementById('preLede').textContent,
    crit:document.querySelector('[name=step_crit]').value,lbl:document.getElementById('oSC').previousElementSibling.textContent,
    opt:[...document.getElementById('tbTrials').rows[0].querySelectorAll('select')[1].options].map(o=>o.value+'='+o.textContent).join(','),
    th:document.querySelector('#tbBase').closest('table').tHead.rows[0].cells[1].textContent,progTh:document.querySelector('#tbProg').closest('table').tHead.rows[0].cells[5].textContent}));
  const p=await open();
  /* ---- F399 / I201 ---- */
  const s0=await st(p);
  ok('1 I201 with no arrangement chosen every block of Tab 2 shows, and the tab says the arrangement decides',!s0.choice&&!s0.esc&&!s0.fct&&/^Choose the arrangement on Tab 1/.test(s0.lede),s0);
  await p.click('label[for=a3]');await sleep(200);const s1=await st(p);
  ok('2 F399 delay tolerance after FCT: the dimension check, the choice baseline and the aversiveness check give way to the FCT baseline; the session sheet and Progress read delays waited',
    s1.choice&&s1.esc&&!s1.fct&&/FCT baseline below takes the place/.test(s1.lede)&&s1.lbl==='Delays waited, delay trials'&&s1.opt==='=,SC=Waited,IMP=Did not wait,No response=No response'&&s1.progTh==='% waited'&&
    /FCT baseline in place of the dimension check/.test(await p.evaluate(()=>document.getElementById('arrNote').textContent)),s1);
  await p.click('label[for=a2]');await sleep(200);const s2=await st(p);
  ok('3 I201 an escape arrangement shows the choice assessments with the aversiveness check, the self-control choice named as the smaller task now, and an untouched criterion follows',
    !s2.choice&&!s2.esc&&s2.fct&&s2.opt==='=,SC=SC (task now),IMP=IMP (task later),No response=No response'&&s2.th==='Delay to the later task (s)'&&/aversiveness check \(E\)/.test(s2.lede)&&
    s2.crit==='Self-control choice (the smaller task now) on at least 80% of delay trials (a trial with no response counts against it)',s2);
  await p.evaluate(()=>{const c=document.querySelector('[name=step_crit]');c.value='Our own criterion (simulated)';c.dispatchEvent(new Event('input',{bubbles:true}));});await p.click('label[for=a1]');await sleep(200);const s3=await st(p);
  ok('4 I201 a criterion the person wrote is kept when the arrangement changes',s3.crit==='Our own criterion (simulated)'&&s3.th==='Delay to SC option (s)'&&s3.opt==='=,SC=SC,IMP=IMP,No response=No response'&&s3.esc&&!s3.choice,s3);
  await p.evaluate(()=>{const f=document.querySelector('#tbMag input[type=date]');f.value='2026-09-01';f.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.click('label[for=a3]');await sleep(200);const s4=await st(p);
  ok('5 I201 a block holding entries stays in view when the arrangement does not call for it, and says so',!s4.choice&&s4.keep.join()==='preChoice'&&s4.esc,s4);
  /* the example */
  await p.evaluate(()=>document.getElementById('btnSim').click());await sleep(1500);
  const sm=await p.evaluate(()=>{const v=n=>document.querySelector('[name='+n+']').value;return {st:{choice:document.getElementById('preChoice').hidden,esc:document.getElementById('preEsc').hidden,fct:document.getElementById('preFct').hidden},
    mag:document.getElementById('tbMag').rows.length,base:document.getElementById('tbBase').rows.length,av:document.getElementById('tbAv').rows.length,
    fct:[...document.getElementById('tbFct').rows].map(tr=>[tr.cells[2].querySelector('input').value,tr.cells[7].textContent,tr.cells[9].textContent].join('/')),
    prog:[...document.getElementById('tbProg').rows].slice(0,4).map(tr=>[...tr.querySelectorAll('input')].slice(3,7).map(i=>i.value).join('/')),
    dim:v('dim_values'),lock:v('pre_lock'),va:v('pg_va'),dd:v('dd_units'),pre:v('pre_summary'),sc:document.getElementById('oSC').textContent,ioa:v('ioa_beh')};});
  ok('6 F399 the example is on the FCT path: no choice assessments, a baseline that honors the break card at once and then delays that same break, carried as sessions 1 to 4',
    sm.st.choice&&sm.st.esc&&!sm.st.fct&&sm.mag===0&&sm.base===0&&sm.av===0&&sm.fct.join()==='0/—/0.00,30/16.7%/0.25,30/0.0%/0.33,0/—/0.00'&&sm.prog.join()==='0/0//0,30/31/16.7/0.25,30//0/0.33,0/0//0'&&sm.sc==='5/6 (83.3%)',sm);
  ok('7 F399 the example\'s conclusions say what its sessions show: the break delayed, not tablet time, and no impulsive choice',
    /delaying the break, with the same work in place, evokes the aggression/.test(sm.va)&&!/the delay, not the task/.test(sm.va)&&!/tablet/.test(sm.dim+sm.lock+sm.dd)&&/2-min break the break card asks for/.test(sm.lock)&&/No choice assessment was run/.test(sm.pre)&&/^Delay waited on each delay trial/.test(sm.ioa),sm);
  /* ---- F404 ---- */
  const q=await p.evaluate(()=>{const before=document.getElementById('tbQlog').rows.length;document.getElementById('btnQlogAdd').click();return before;});await sleep(300);
  const ql=await p.evaluate(()=>{const R=[...document.getElementById('tbQlog').rows];return {n:R.length,last:[...R[R.length-1].querySelectorAll('input')].map(i=>i.value)};});
  ok('8 F404 Tab 7\'s agreement and integrity are logged with one press (100% and 91.7%, session 22\'s phase)',ql.n===q+1&&ql.last[1]==='Training'&&ql.last[3]==='100'&&ql.last[4]==='91.7'&&/^Delay waited on each delay trial/.test(ql.last[2]),ql);
  await p.evaluate(()=>{document.querySelector('[name=ss_phase]').value='Maintenance probe';document.querySelector('[name=ss_date]').value='2026-10-30';document.getElementById('btnCarry').click();});await sleep(500);
  const mt=await p.evaluate(()=>({m:[...document.getElementById('tbMaint').rows].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value).join('/')),said:window.__said}));
  ok('9 F404 a session sheet whose phase is a maintenance probe writes its figures into the first maintenance probe not yet run',/^2 weeks\/\d{4}-\d\d-\d\d\/2026-10-30\/83\.3\/93\.6\/0\.03\/$/.test(mt.m[0])&&/maintenance schedule on Tab 8/.test(mt.said),mt);
  await p.evaluate(()=>{document.querySelector('[name=ss_phase]').value='Generalization probe';document.querySelector('[name=ss_date]').value='2026-10-31';document.getElementById('btnCarry').click();});await sleep(500);
  const gn=await p.evaluate(()=>[...document.getElementById('tbGen').rows].map(tr=>[...tr.querySelectorAll('input,select')].map(i=>i.value).join('/')));
  ok('10 F404 a generalization probe session goes to a probe row of its own on Tab 8, the dimension left to the person',gn.length===6&&gn[5]==='///2026-10-31/83.3/93.6/0.03/',gn);
  /* a fresh form: the baseline carried, and the discounting probe logged */
  const p2=await open();await p2.click('label[for=a3]');await sleep(200);
  await p2.evaluate(()=>{const R=document.getElementById('tbFct').rows;[['2026-09-01','Request honored at once (0 s)','0','20','8','0','0','0',''],['2026-09-02','Delay on the same reinforcer','20','10','5','5','2','4','']].forEach((v,i)=>{const f=R[i].querySelectorAll('input,select');v.forEach((x,j)=>{f[j].value=x;});});
    document.querySelector('#tbFct input').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('btnFctCarry').click();});await sleep(400);
  const c1=await p2.evaluate(()=>[...document.getElementById('tbProg').rows].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value).join('/')));
  await p2.evaluate(()=>{[...document.getElementById('tbProg').rows][1].querySelectorAll('input')[8].value='Kept decision';
    document.getElementById('tbFct').rows[1].querySelectorAll('input,select')[6].value='3';document.getElementById('btnFctCarry').click();});await sleep(400);
  const c2=await p2.evaluate(()=>[...document.getElementById('tbProg').rows].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value).join('/')));
  ok('11 F404 the FCT baseline is carried to Progress as sessions 1 and 2, phase Baseline; carried again, the rows are rewritten and their decision kept',
    c1[0]==='1/2026-09-01/Baseline/0/0//0//Baseline (Tab 2, FCT baseline)'&&c1[1]==='2/2026-09-02/Baseline/20//40/0.4//Baseline (Tab 2, FCT baseline)'&&c2[1]==='2/2026-09-02/Baseline/20//60/0.4//Kept decision'&&c2.filter(r=>/Baseline/.test(r)).length===2,{c1,c2});
  await p2.evaluate(()=>{const d=document.querySelector('[name=dd_date]');d.value='2026-09-03';const A=document.getElementById('ddA');A.value='100';
    const R=document.getElementById('tbDD').rows;[['0','100'],['5','80'],['10','70'],['30','50'],['60','30'],['120','20']].forEach((v,i)=>{const f=R[i].querySelectorAll('input');f[0].value=v[0];f[1].value=v[1];});
    document.getElementById('btnDDlogAdd').click();});await sleep(300);
  await p2.evaluate(()=>{document.querySelector('[name=dd_date]').value='2026-10-03';document.getElementById('tbDD').rows[3].querySelectorAll('input')[1].value='60';document.getElementById('btnDDlogAdd').click();});await sleep(300);
  const dl=await p2.evaluate(()=>({log:[...document.getElementById('tbDDlog').rows].map(tr=>[...tr.querySelectorAll('input')].map(i=>i.value)),auc:document.getElementById('outAUC').textContent,lk:document.getElementById('outLogK').textContent}));
  ok('12 F404 a discounting probe is logged with one press: the first as Baseline, a later one as Re-probe, with AUC, log k and the half-value delay',
    dl.log[0][0]==='2026-09-03'&&dl.log[0][1]==='Baseline'&&/^0\.\d{3}$/.test(dl.log[0][2])&&dl.log[0][3]!==''&&/^Half-value delay /.test(dl.log[0][4])&&dl.log[1][0]==='2026-10-03'&&dl.log[1][1]==='Re-probe'&&dl.log[1][2]===dl.auc&&dl.log[1][3]===dl.lk,dl);
  /* ---- I205 ---- */
  const ad0=await p2.evaluate(()=>[...document.querySelectorAll('details.adv')].map(d=>d.open));
  const ad1=await p.evaluate(()=>[...document.querySelectorAll('details.adv')].map(d=>d.open));
  ok('13 I205 the fit figures, the probability probe and Step 5\'s research options are folded away; the example opens the two it uses, and a logged probe opens the fit figures',
    ad1.join()==='true,true,false'&&ad0.join()==='true,false,false'&&await p.evaluate(()=>!!document.querySelector('details.adv #outK')&&!!document.querySelector('#advPD [name=pd_A]')&&!!document.querySelector('details.adv [name=opt_eft]')),{ad0,ad1});
  const p3=await open();await p3.emulateMedia({media:'print'});
  const pr=await p3.evaluate(()=>[...document.querySelectorAll('details.adv')].map(d=>getComputedStyle(d).display));
  ok('14 I205 a folded section is left off paper',pr.every(x=>x==='none'),pr);
  /* save and open */
  const rt=await p.evaluate(async()=>{let txt=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{txt=t;});return o(b);};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('btnSave').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=o;HTMLAnchorElement.prototype.click=ac;
    const d=JSON.parse(txt);document.getElementById('a1').checked=true;document.getElementById('a1').dispatchEvent(new Event('change',{bubbles:true}));
    const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(d)],'x.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,600));
    return {saved:d.tables.tbFct.length,arr:d.fields.arrange,fct:document.getElementById('preFct').hidden,rows:document.getElementById('tbFct').rows.length,sum:document.querySelector('[name=fct_summary]').value};});
  ok('15 the FCT baseline and its summary are saved with the record and come back with it, the sheet laid out for the FCT path again',rt.saved===4&&rt.arr==='fct'&&!rt.fct&&rt.rows===4&&/delaying the break evokes the aggression/.test(rt.sum),rt);
  const src=await p.evaluate(async()=>await (await fetch(location.href)).text());
  ok('16 the Walkthrough: the choice baseline is required for the two choice arrangements, and the FCT path\'s baseline is in the order of work',
    /required for the two choice arrangements \(Tab 1\)/.test(src)&&/<b>FCT baseline<\/b>On the FCT path \(Tab 1\), A and B are not run/.test(src)&&!/required in every study the toolkit reviews/.test(src));
  ok('17 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
