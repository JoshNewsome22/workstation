/* Form SP-1 (v23.68, the BCBA's request): a data sheet after the first carries the behavior's operational definition,
   example and non-example, as sheet 1 does.
   1. the simulated record (15 days, 10 to a sheet): sheet 2 shows sheet 1's definition, example and non-example;
   2. it follows what is typed on sheet 1;
   3. behavior 2's sheet 2 has behavior 2's;
   4. on paper (Letter, as an iPad prints): every sheet 2 page has the definitions and the whole grid, for each behavior;
   5. long definitions (6 examples, 5 non-examples) still leave sheet 2 one page, the definitions whole;
   6. empty, they print as lines to write on, labels and all. Simulated data only.
   usage: node qa/sp1-sheet2-defs-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DEF='Contact of any part of the learner’s head or face with a fixed surface (wall, floor, table, desk, window, door, chair back), produced by movement of the head or upper body toward the surface, with force enough to be heard from 1 m or to leave a mark seen within 1 min.';
const EX=['Hitting the head against a door while walking in the hallway, heard from the classroom.','Bringing the forehead down onto the desk once during a writing task, heard from the doorway.','Striking the back of the head against the wall while seated on the floor, each contact heard from 1 m.','Lifting the head and bringing the face down onto the floor while lying face down, leaving a red mark.','Banging the side of the head against the bus window, heard from the seat in front.','A short, loud series of head hits against the table during a transition (simulated).'].join('\n');
const NON=['Putting the head down on the desk or the arms during work, or leaning it against the wall, with no striking movement.','Flopping onto the desk with no sound heard from 1 m and no mark.','The head touching a surface during a trip or a fall, with the whole body moving.','Rubbing the forehead on the carpet with no sound and no mark.','Resting the cheek on a cool window while waiting in line.'].join('\n');
const sq=t=>String(t||'').replace(/\s+/g,' ').trim();
(async()=>{const br=await L.chromium.launch();const errs=[];const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sp1d-'));
  const pdfPages=async(p,name)=>{await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(400);
    const f=path.join(tmp,name);await p.pdf({path:f,format:'Letter',preferCSSPageSize:true,printBackground:true});
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});await sleep(200);
    return JSON.parse(cp.execFileSync('python3',['-I','-c','import sys,json,pymupdf\nd=pymupdf.open(sys.argv[1])\nprint(json.dumps([p.get_text() for p in d]))',f],{encoding:'utf8'})).map(sq);};
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1200);
  await p.evaluate(async()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;await loadSim();});await sleep(800);
  const rep=()=>p.evaluate(()=>{const g=k=>{const t=document.querySelector('#spPages .sp-page .sp-defrep [data-rep="'+k+'"]');return t?t.textContent:null;};
    return {pages:document.querySelectorAll('#spPages .sp-page').length,def:g('definition'),ex:g('example'),non:g('nonexample'),
      s1:{def:document.querySelector('[data-meta="definition"]').value,ex:document.querySelector('[data-meta="example"]').value,non:document.querySelector('[data-meta="nonexample"]').value},
      labs:[...document.querySelectorAll('#spPages .sp-page .sp-defrep .dlab')].map(x=>x.textContent)};});
  const a=await rep();
  ok('1 sheet 2 shows sheet 1\'s operational definition, example and non-example',a.pages===1&&!!a.s1.def&&a.def===a.s1.def&&a.ex===a.s1.ex&&a.non===a.s1.non&&a.labs.join()==='Operational definition,Example,Non-example',a);
  await p.evaluate(()=>{const t=document.querySelector('[data-meta="example"]');t.value='A changed example (simulated).';t.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  const b=await rep();
  ok('2 it follows what is typed on sheet 1',b.ex==='A changed example (simulated).',b);
  await p.evaluate(()=>document.querySelector('#behSeg button[data-b="1"]').click());await sleep(600);
  const c=await rep();const d1=await p.evaluate(()=>state.behaviors[0].meta?state.behaviors[0].meta.definition:null);
  ok('3 behavior 2\'s sheet 2 has behavior 2\'s definitions',c.pages===1&&!!c.def&&c.def===c.s1.def&&c.def!==a.def,{c,a:a.def});
  await p.evaluate(()=>document.querySelector('#behSeg button[data-b="0"]').click());await sleep(600);
  const pages=await pdfPages(p,'sim.pdf');
  const s2=pages.map((t,i)=>({i:i+1,t})).filter(x=>/Scatterplot Data Sheet/.test(x.t)&&/sheet 2 of 2/.test(x.t)&&!/SECOND OBSERVER/.test(x.t));   /* v24.26: the second observer's blank copy is not the record's sheet */
  const bad=s2.filter(x=>!/Operational definition/.test(x.t)||!/Non-example/.test(x.t)||!/Intervals marked/.test(x.t)).map(x=>x.i);
  ok('4 on paper every sheet 2 has the definitions and the whole grid on its page, for each behavior',s2.length===2&&!bad.length&&s2[0].t.includes(sq(a.s1.def).slice(0,60)),{n:s2.length,bad,head:s2.map(x=>x.t.slice(0,500))});
  await p.evaluate(([d,e,n])=>{const set=(k,v)=>{const t=document.querySelector('[data-meta="'+k+'"]');t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));};set('definition',d);set('example',e);set('nonexample',n);},[DEF,EX,NON]);await sleep(500);
  const long=await pdfPages(p,'long.pdf');
  const l2=long.map((t,i)=>({i:i+1,t})).filter(x=>/Scatterplot Data Sheet — behavior 1 of 2 — sheet 2 of 2/.test(x.t)&&!/SECOND OBSERVER/.test(x.t));
  ok('5 long definitions: sheet 2 is still one page, its definitions whole and its grid on it',l2.length===1&&l2[0].t.includes('waiting in line.')&&l2[0].t.includes('within 1 min.')&&/Intervals marked/.test(l2[0].t),{n:l2.length,t:l2.map(x=>x.t.slice(0,300))});
  await p.evaluate(()=>{['definition','example','nonexample'].forEach(k=>{const t=document.querySelector('[data-meta="'+k+'"]');t.value='';t.dispatchEvent(new Event('input',{bubbles:true}));});});await sleep(400);
  const empty=await pdfPages(p,'empty.pdf');
  const e2=empty.filter(t=>/behavior 1 of 2 — sheet 2 of 2/.test(t)&&!/SECOND OBSERVER/.test(t));
  await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(300);
  const h=await p.evaluate(()=>[...document.querySelectorAll('.sp-printed .sp-defrep .sp-dtext')].map(x=>Math.round(x.getBoundingClientRect().height)));
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});
  const seg=e2.length?e2[0].slice(e2[0].indexOf('Days 11')):'';
  ok('6 empty, they print as lines to write on, labels and all',e2.length===1&&/Operational definition\s*Example\s*Non-example/.test(seg)&&h.length>=3&&h.every(x=>x>=12),{seg:seg.slice(0,200),h});
  ok('7 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  try{fs.rmSync(tmp,{recursive:true,force:true});}catch(e){}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
