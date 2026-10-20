/* One interview, one write-up (v23.43, review I22 and F44; the BCBA's decision: Form IN-1 owns an interview). IN-1's evidence
   carries each interview; Form IA-1 fills an interview card from it, marked "from Form IN-1", the informant matched by name or
   put in an empty row, only empty fields filled, never twice, a removed card not placed again, the target IN-1 names; the card
   counts toward the informants' agreement; IA-1's evidence leaves it out of its instruments and informant count, and Form FS-1
   counts it on IN-1's row. Simulated data only. usage: node qa/i22-interview-once-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
const LAB='Stakeholder interview (Form IN-1)';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=p=>fs.readdirSync(dir).find(x=>x.startsWith(p+'_'));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async id=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file(id));await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  /* ---- IN-1: two interviews and a page answered in writing, no hypothesis yet ---- */
  const inn=await open('IN-1');
  const ev=await inn.evaluate(()=>{S=blank();S.meta.beh='Aggression (simulated)';
    S.resp=[{n:'Dana Whitfield (simulated)',role:'Teacher',rel:'5th grade teacher',d:'10/6/2026',by:'',fmt:'Face to face',cf:'',see:'',know:''},
      {n:'Ana Rivera (simulated)',role:'Parent or guardian',rel:'Mother',d:'10/8/2026',by:'',fmt:'Telephone',cf:'',see:'',know:''},
      {n:'Paula Brennan (simulated)',role:'Staff member',rel:'Paraprofessional',d:'10/9/2026',by:'',fmt:'Written (respondent page)',cf:'',see:'',know:''}];
    const put=(i,k,v)=>{const j=qs(i).findIndex(q=>q.k===k);S.ans[akey(i,j)]=v;};
    put(0,'most','Independent math work, 10:15 to 10:45');put(0,'least','Art and recess');put(0,'trigger','A multi-step worksheet is handed out');
    put(0,'after','He is sent to the calm corner and the work is put away');put(0,'fn','To escape the math work');put(0,'setting','Short sleep');
    const se=qs(0).findIndex(q=>q.k==='se');S.mx[akey(0,se)]=['Yes','No','Sometimes','No','No','No'];
    put(1,'trigger','Being told to turn off the tablet');put(1,'fn','He wants my attention');put(1,'escape','Bath time');
    put(2,'trigger','Transitions');put(2,'fn','Escape');
    renderAll();return (window.__nbhFactsOut()||{}).evidence;});
  const iv=(ev&&ev.interviews)||[];
  ok('1 IN-1, no hypothesis yet: the evidence still goes, function empty, with the two interviews and not the page answered in writing',!!ev&&ev.form==='IN-1'&&ev.fn===''&&ev.n===3&&iv.length===2&&iv[0].name==='Dana Whitfield (simulated)'&&iv[1].name==='Ana Rivera (simulated)'&&ev.dates==='10/6/2026–10/9/2026',ev);
  ok('2 each interview carries its answers: most and least likely, the trigger, setting events, what happens afterwards, the view of function and its key',
    iv[0]&&iv[0].most==='Independent math work, 10:15 to 10:45'&&iv[0].least==='Art and recess'&&iv[0].trigger==='A multi-step worksheet is handed out'&&
    iv[0].se==='Yes: Poor sleep the night before Sometimes: A schedule change; Short sleep'&&iv[0].after==='He is sent to the calm corner and the work is put away'&&iv[0].fnKey==='escape'&&iv[0].beh==='Aggression (simulated)'&&
    iv[1]&&iv[1].after==='Gets out of: Bath time'&&iv[1].fnKey==='attention'&&iv[1].role==='Parent or guardian',iv);
  const ev2=await inn.evaluate(()=>{S.meta.hyp='Escape from difficult work (simulated)';S.meta.fn='escape';return (window.__nbhFactsOut()||{}).evidence;});
  ok('3 with a hypothesis the evidence is as before (its function, strength and statement) and carries the interviews too',ev2&&ev2.fnKey==='escape'&&ev2.strength==='Weak'&&/Escape from difficult work/.test(ev2.statement)&&(ev2.interviews||[]).length===2,ev2);
  /* ---- IA-1: informant A is the teacher; the parent is not on the sheet ---- */
  const ia=await open('IA-1');
  const fill=async(p,f)=>p.evaluate(f=>window.__nbhFactsIn(f),f);
  await ia.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    s('m.beh','Aggression');s('inf[0].name','Dana Whitfield (simulated)');s('inf[0].role','teacher');
    /* informant C completed the FAST: escape */
    s('inf[2].name','Iris Calloway (simulated)');});
  const r1=await fill(ia,{evidence:{'IN-1':ev2}});
  const cards=async p=>p.evaluate(()=>[...document.querySelectorAll('#intWrap .card')].map(c=>{const v=n=>{const e=c.querySelector('[name$="].'+n+'"]');return e?e.value:'';};const t=c.querySelector('.int-src');
    return {inst:v('inst'),who:v('who'),d:v('d'),routine:v('routine'),low:v('routineLow'),se:v('se'),a:v('a'),c:v('c'),fn:v('fn'),src:v('src'),tag:!!t&&t.style.display!=='none'&&/from Form IN-1/.test(t.textContent)};}));
  const c1=await cards(ia);
  ok('4 IA-1: each interview fills a card, marked "from Form IN-1", with its instrument, date and answers',c1.length===2&&c1.every(c=>c.inst===LAB&&c.tag)&&
    c1[0].d==='10/6/2026'&&c1[0].routine==='Independent math work, 10:15 to 10:45'&&c1[0].low==='Art and recess'&&c1[0].a==='A multi-step worksheet is handed out'&&c1[0].c==='He is sent to the calm corner and the work is put away'&&c1[0].fn==='escape'&&
    c1[1].d==='10/8/2026'&&c1[1].fn==='attention'&&c1[1].c==='Gets out of: Bath time'&&r1&&/2 interviews from Form IN-1 on the Interviews sheet/.test(r1.note||''),{c1,r1});
  const inf=await ia.evaluate(()=>[0,1,2].map(i=>({n:document.querySelector('[name="inf['+i+'].name"]').value,r:document.querySelector('[name="inf['+i+'].role"]').value})));
  ok('5 the informant: the teacher is A (her name on the sheet); the parent goes into the empty row B with her relationship',c1[0].who==='A'&&c1[1].who==='B'&&inf[1].n==='Ana Rivera (simulated)'&&inf[1].r==='Mother'&&inf[2].n==='Iris Calloway (simulated)',{c1,inf});
  /* typed words stay; a second delivery adds nothing */
  await ia.evaluate(()=>{const e=document.querySelector('[name="int[0].routine"]');e.value='Math, after lunch (typed)';e.dispatchEvent(new Event('input',{bubbles:true}));
    const s=document.querySelector('[name="int[1].se"]');s.value='';s.dispatchEvent(new Event('input',{bubbles:true}));});
  const r2=await fill(ia,{evidence:{'IN-1':ev2}});const c2=await cards(ia);
  ok('6 delivered again: no card twice, the typed routine kept',c2.length===2&&c2[0].routine==='Math, after lunch (typed)'&&c2[1].who==='B',{c2,r2});
  /* the cards count toward the informants' agreement; the FAST for C: escape */
  const conv=await ia.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}};
    for(let k=0;k<16;k++)s('fast[2]['+k+']',[4,5,6,7].includes(k)?'Y':'N');   /* the escape items, 5 to 8 */
    document.querySelector('#viewSeg [data-view="summary"]').click();
    return [...document.querySelectorAll('#convTbl tbody tr')].map(r=>[...r.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim()));});
  const in1Rows=conv.filter(r=>r[0]===LAB);
  ok('7 the cards are on the convergence table and counted toward the informants\' agreement',in1Rows.length===2&&in1Rows.every(r=>/counted/.test(r[5]))&&/Dana Whitfield/.test(in1Rows[0][1]),conv);
  const out=await ia.evaluate(()=>(window.__nbhFactsOut()||{}).evidence);
  ok('8 IA-1\'s evidence leaves the interviews from IN-1 out of its instruments and informant count (C, with the FAST, still counts), and says how many there were',!!out&&!/Form IN-1/.test(out.method)&&out.interviews&&out.interviews.in1===2&&out.n===1&&/^FAST \(indirect\)$/.test(out.method),out);
  /* a card removed is not placed again */
  await ia.evaluate(()=>{const e=document.getElementById('nInt');e.value='1';e.dispatchEvent(new Event('change',{bubbles:true}));});
  await fill(ia,{evidence:{'IN-1':ev2}});const c3=await cards(ia);
  ok('9 a card removed is not placed again when the case is delivered',c3.length===1&&c3[0].who==='A',c3);
  /* saved and opened again: the mark and the source stay */
  const saved=await ia.evaluate(()=>new Promise(res=>{const u=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=u;res(t);});return u(b);};document.getElementById('saveBtn').click();setTimeout(()=>res(null),3000);}));
  const ib=await open('IA-1');
  await ib.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'IA-1.json',{type:'application/json'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,1200));},saved);
  const c4=await cards(ib);
  ok('10 saved and opened again: the card keeps its mark and its source',!!saved&&c4.length===1&&c4[0].tag&&c4[0].src==='dana whitfield (simulated)|10/6/2026'&&c4[0].inst===LAB,c4);
  /* two targets: the interview goes to the one IN-1 names */
  const ic=await open('IA-1');
  const t2=await ic.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};
    s('m.beh','Elopement');const A=window.__ia1Targets;const r=A.add('Aggression','');return {cur:A.cur(),other:r.id};});
  const ev3=JSON.parse(JSON.stringify(ev2));ev3.interviews.forEach(x=>x.beh='Aggression and property destruction (simulated)');
  await fill(ic,{evidence:{'IN-1':ev3}});
  const t3=await ic.evaluate(o=>{const A=window.__ia1Targets;const here=[...document.querySelectorAll('#intWrap .card')].filter(c=>c.querySelector('[name$="].src"]').value).length;
    A.switchTo(o.other);const there=[...document.querySelectorAll('#intWrap .card')].map(c=>({src:c.querySelector('[name$="].src"]').value,tag:c.querySelector('.int-src').style.display!=='none',inst:c.querySelector('[name$="].inst"]').value}));return {here,there};},t2);
  ok('11 with two targets the interviews fill the cards of the target IN-1 names, not the open one',t3.here===0&&t3.there.filter(c=>c.src&&c.tag&&c.inst===LAB).length===2,t3);
  /* ---- FS-1: each interview counted once ---- */
  const f1=await open('FS-1');
  const rows=await f1.evaluate(o=>{window.__nbhFactsIn({evidence:{'IA-1':o.ia,'IN-1':o.inn}});return S.src.filter(r=>r.form).map(r=>({form:r.form,contrib:r.contrib}));},{ia:out,inn:ev2});
  const rIA=rows.find(r=>r.form==='IA-1')||{},rIN=rows.find(r=>r.form==='IN-1')||{};
  ok('12 FS-1: IA-1\'s row says its interviews from IN-1 are counted on that form\'s row; IN-1\'s row counts the interviews',/^FAST \(indirect\) \(1 informants; its 2 interviews from Form IN-1 are counted on that form’s row\)\./.test(rIA.contrib||'')&&/^Stakeholder interviews \(indirect\): 2 interviewed, 1 answered in writing \(3 interviews\)\. Escape from difficult work/.test(rIN.contrib||''),rows);
  const one=JSON.parse(JSON.stringify(out));one.interviews={in1:1};
  const rows1=await (await open('FS-1')).evaluate(o=>{window.__nbhFactsIn({evidence:{'IA-1':o}});return S.src.filter(r=>r.form==='IA-1').map(r=>r.contrib);},one);
  ok('13 one interview from IN-1: "its interview from Form IN-1 is counted on that form’s row"',/^FAST \(indirect\) \(1 informants; its interview from Form IN-1 is counted on that form’s row\)\./.test(rows1[0]||''),rows1);
  ok('14 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
