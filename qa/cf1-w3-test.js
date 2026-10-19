/* Form CF-1, review Wave 3: item 21 waits until the plan has run (F208); the case keeps a complete round 1 until round 2 is
   complete, and PR-1 says what a figure rests on (F209); round 2's own date and timing, and the due list (F212); initials only
   (F213); the filed copy by role (F214); what a self-report can show (F215); the reply box described (F216); the CSV (F217).
   Simulated data only. usage: node qa/cf1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async pre=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(pre+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file(pre));await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}
      const o=URL.createObjectURL;window.__dl=[];URL.createObjectURL=b=>{const r={text:null};window.__dl.push(r);b.text().then(t=>{r.text=t;});return o(b);};
      HTMLAnchorElement.prototype.click=function(){if(this.download&&window.__dl.length)window.__dl[window.__dl.length-1].name=this.download;};});return p;};
  const p=await open('CF-1_');
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(800);
  const set=(n,v)=>p.evaluate(([n,v])=>{const e=document.querySelector(`[data-m="${n}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[n,v]);
  /* ---- F208 ---- */
  const g1=await p.evaluate(()=>{const tr=[...document.querySelectorAll('#cfTbl tbody tr')].find(t=>t.children[0]&&t.children[0].textContent==='21');const A=analyse(1);
    return {skip:tr.classList.contains('cf-skip'),dis:[...tr.querySelectorAll('select')].every(s=>s.disabled),note:tr.children[1].textContent,possible:A.possible,n:A.n,stored:S.scores[1]['20_0']};});
  await set('when','After a period of implementation');
  const g2=await p.evaluate(()=>{const A=analyse(1);const tr=[...document.querySelectorAll('#cfTbl tbody tr')].find(t=>t.children[0]&&t.children[0].textContent==='21');return {possible:A.possible,n:A.n,skip:tr.classList.contains('cf-skip')};});
  await set('when','Before the plan starts');
  ok('1 F208 a round given before the plan starts leaves item 21 out: not rated, out of the means, explained; once the plan has run it counts',
    g1.skip&&g1.dis&&/Not asked in a round given before the plan starts/.test(g1.note)&&g1.possible===80&&g1.n===80&&g1.stored==='4'&&g2.possible===84&&g2.n===84&&!g2.skip,{g1,g2});
  await p.evaluate(()=>document.getElementById('rpBtn').click());await sleep(300);
  const pay=await p.evaluate(()=>{const p=__rp.payload();return {n:p.items.length,t21:p.items[20].text,ins:p.instructions,student:document.getElementById('rpStudent').value};});
  ok('2 F208 the respondent page keeps 21 items but asks for item 21 to be left blank before the plan has run; F213 the label is the initials only',
    pay.n===21&&/^Leave this one blank if the plan has not started yet: I have seen enough/.test(pay.t21)&&/Rate every statement but the last, which waits until the plan has run\./.test(pay.ins)&&!/no statement is skipped/.test(pay.ins)&&pay.student==='S.S.S.',pay);
  await p.evaluate(()=>document.getElementById('rpDlg').close());
  /* ---- F209 ---- */
  const keep=await p.evaluate(()=>{const s2=S.scores[2],k0=Object.keys(s2);window.__s2=JSON.parse(JSON.stringify(s2));S.scores[2]={};S.scores[2][k0[0]]=s2[k0[0]];renderAll();return window.__nbhFactsOut().fit;});
  const done=await p.evaluate(()=>{S.scores[2]=window.__s2;renderAll();return window.__nbhFactsOut().fit;});
  /* the same rating missing in both rounds: like for like, short of complete */
  const prov=await p.evaluate(()=>{const k=Object.keys(S.scores[2])[0],v1=S.scores[1][k],v2=S.scores[2][k];delete S.scores[1][k];delete S.scores[2][k];renderAll();const f=window.__nbhFactsOut().fit;S.scores[1][k]=v1;S.scores[2][k]=v2;renderAll();return f;});
  ok('3 F209 one round-2 reply does not replace a complete round 1: round 1 goes on, round 2 is named as in progress; a complete round 2 takes over',
    keep.round===1&&keep.n===80&&keep.band==='Adequate fit'&&keep.round2&&keep.round2.n===1&&keep.round2.state==='in progress'&&done.round===2&&done.band==='Strong fit'&&!done.round2,{keep,done});
  ok('4 F209 a round rated by the same people on the same items, short of complete, carries its band as provisional',prov.round===2&&!prov.band&&prov.bandProvisional==='Strong fit'&&prov.n===79,prov);
  const pr=await open('PR-1_');
  const line=await pr.evaluate(([a,b])=>[prFitLine(a),prFitLine(b)],[keep,prov]);
  ok('5 F209 PR-1\'s line says how many ratings and respondents the figure rests on, a round 2 in progress, and a provisional band',
    /^Form CF-1, scale 1-6: mean \d\.\d\d \(Adequate fit\), \d+\/\d+\/\d{4}\. Round 1: 80 of 80 ratings from 4 respondents\. Round 2 in progress: 1 of 80 ratings\./.test(line[0])
    &&/^Form CF-1, scale 1-6: mean \d\.\d\d \(Strong fit, provisional\), \d+\/\d+\/\d{4}\. Round 2: 79 of 80 ratings from 4 respondents\./.test(line[1]),line);
  /* ---- F212 ---- */
  const d0=await p.evaluate(()=>({date2:S.meta.date2,fitDate:window.__nbhFactsOut().fit.date,due:window.__nbhDue(),f:!!document.querySelector('#r2Meta [data-m="date2"]')&&!!document.querySelector('#r2Meta [data-m="when2"]')}));
  const d1=await p.evaluate(()=>{const s=S.scores[2];S.scores[2]={};renderAll();const r=window.__nbhDue();S.scores[2]=s;renderAll();return r;});
  await set('when2','After a period of implementation');
  const d2=await p.evaluate(()=>{S.round=2;renderAll();return {possible:analyse(2).possible,v:document.getElementById('barVerdict').textContent};});
  ok('6 F212 round 2 has its own date and timing: the case dates it, item 21 counts once the plan has run, and the verdict follows round 2\'s moment',
    d0.f&&!!d0.date2&&d0.fitDate===(()=>{const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(d0.date2);return m?'20'+m[3]+'-'+('0'+m[1]).slice(-2)+'-'+('0'+m[2]).slice(-2):'';})()&&d2.possible===84&&/Continue, and measure integrity as planned/.test(d2.v),{d0,d2});
  ok('7 F212 the re-administration date is on the due list while round 2 holds no rating',d0.due.length===0&&d1.length===1&&d1[0].what==='Re-administer contextual fit (round 2)'&&!!d1[0].date,{d0:d0.due,d1});
  /* ---- F215 ---- */
  ok('8 F215 a strong verdict says the people rating it say they can, and that Form ST-1 shows whether they can',/say they know it, can do it, and have the conditions to carry it out; Form ST-1 shows whether they can\./.test(d2.v),d2.v);
  await set('when2','Before the plan starts');
  /* ---- F214 ---- */
  const pr1=async on=>{await p.evaluate(on=>{document.getElementById('cfByRole').checked=on;S.round=1;renderAll();},on);await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const r=await p.evaluate(()=>({head:[...document.querySelectorAll('#cfTbl thead th')].map(t=>t.textContent).slice(2,6),who:[...document.querySelectorAll('#flagTbl tbody tr')].map(t=>t.lastElementChild.textContent).join('|'),
      nameCol:getComputedStyle(document.querySelector('#rTbl th:nth-child(2)')).display}));
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});
    r.after=await p.evaluate(()=>[...document.querySelectorAll('#cfTbl thead th')].map(t=>t.textContent).slice(2,6));return r;};
  const a1=await pr1(true),a2=await pr1(false);
  ok('9 F214 the filed copy names respondents by number and role, with the names column off the paper; the screen keeps the names; unticked, the names print',
    a1.head.join('|')==='R1 Classroom teacher|R2 Paraprofessional|R3 Paraprofessional|R4 Speech-language pathologist'&&!/Teacher|Aide/.test(a1.who.replace(/Classroom teacher/g,''))&&a1.nameCol==='none'
    &&a1.after.join('|')==='Teacher|Aide A|Aide B|SLP'&&a2.head.join('|')==='Teacher|Aide A|Aide B|SLP'&&a2.nameCol!=='none',{a1,a2});
  /* ---- F216 ---- */
  const tx=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('10 F216 the Guide and the dialog describe the reply box',/the answers are sealed on the respondent’s device and go to the reply box when they press Send; otherwise they travel only in the email the respondent sends\. The page stores nothing\./.test(tx)
    &&/With the reply box set up, the answers are sealed on their device and go to the reply box/.test(tx),'text');
  /* ---- F217 ---- */
  await p.evaluate(()=>{window.__dl=[];document.getElementById('csvBtn').click();});await sleep(400);
  const csv=await p.evaluate(()=>window.__dl[0]);const lines=String(csv&&csv.text||'').split('\n');
  ok('11 F217 Export CSV gives both rounds side by side, the change, the domain means and the enhancement rows, named for the student and the date',
    csv&&/^CF-1_SIMULATED_\S*_\d{4}-\d{2}-\d{2}\.csv$/.test(csv.name)&&/"Teacher round 1".*"Teacher round 2".*"Mean round 1","Mean round 2","Change"/.test(lines[0])&&lines.some(l=>/^"","Overall contextual fit","","4\.01","5\.22","1\.21"$/.test(l))
    &&lines.some(l=>/^"Item","Domain","Barrier","Type"/.test(l)),{name:csv&&csv.name,head:lines[0],tail:lines.slice(-8)});
  ok('12 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
