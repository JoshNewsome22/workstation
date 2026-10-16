/* v22.31 Form SP-1 printed on an iPad: each data sheet on one page with its definitions. On a touch screen the controls
   are made finger-sized (40 px), and that rule also applied while printing, so every square of the grid printed 40 px
   tall: the grid never fitted under the definitions and went to a page of its own (and the citation to another). The
   definition, examples and non-examples printed at the height their box had on screen, so long ones were cut off.
   Chromium with touch (pointer:coarse, as on the iPad), Letter, with long simulated definitions. Simulated data only.
   usage: node qa/v2231-sp1-print-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DEF='Contact of any part of the learner’s head or face with a fixed surface (wall, floor, table, desk, window, door, chair back), produced by movement of the head or upper body toward the surface, with force enough to be heard from 1 m or to leave a mark seen within 1 min.';
const EX=['Hitting the head against a door while walking in the hallway, heard from the classroom.','Bringing the forehead down onto the desk once during a writing task, heard from the doorway.','Striking the back of the head against the wall while seated on the floor, each contact heard from 1 m.','Lifting the head and bringing the face down onto the floor while lying face down, leaving a red mark.','Banging the side of the head against the bus window, heard from the seat in front.','A short, low bang of the forehead on the table (less than 15 cm of travel) that leaves a red mark.'].join('\n');
const NON=['Putting the head down on the desk or the arms during work, or leaning it against the wall, with no striking movement (a noncompliance entry).','Flopping onto the desk with no sound heard from 1 m and no mark (a precursor entry).','The head touching a surface during a trip or a fall, with the whole body moving.','Rubbing the forehead on the carpet with no sound and no mark.','Resting the cheek on a cool window while waiting in line.'].join('\n');
const LAST='waiting in line.';
(async()=>{const br=await L.chromium.launch();const errs=[];const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sp1p-'));
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1200);
  ok('0 the page is a touch screen here, as on an iPad',await p.evaluate(()=>matchMedia('(pointer:coarse)').matches));
  await p.evaluate(async()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;await loadSim();});await sleep(800);
  await p.evaluate(([d,e,n])=>{const set=(k,v)=>{const t=document.querySelector('[data-meta="'+k+'"]');t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));};set('definition',d);set('example',e);set('nonexample',n);},[DEF,EX,NON]);await sleep(500);
  const info=await p.evaluate(()=>({beh:state.behaviors.length,days:state.cfg.days,per:state.cfg.perSheet}));
  await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(400);
  const cell=await p.evaluate(()=>{const c=document.querySelector('#spPrint table.scatter tbody td:not(.time)')||document.querySelector('#spPrint table.scatter tbody td');return c?Math.round(c.getBoundingClientRect().height):0;});
  const rowh=await p.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rowh'))||0);
  ok('1 on paper a grid row is the height the sheet gives it ('+rowh+' px), not a finger-sized 40 px or more',cell>0&&cell<=rowh+3,{cell,rowh});
  const pdf=path.join(tmp,'sp1.pdf');await p.pdf({path:pdf,format:'Letter',preferCSSPageSize:true,printBackground:true});
  await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});
  const py=`import sys,json,pymupdf\nd=pymupdf.open(sys.argv[1])\nprint(json.dumps([p.get_text() for p in d]))`;
  const pages=JSON.parse(cp.execFileSync('python3',['-I','-c',py,pdf],{encoding:'utf8'}));
  const firsts=pages.map((t,i)=>({i,t})).filter(x=>/Scatterplot Data Sheet/.test(x.t)&&/sheet 1 of/.test(x.t));
  const bad=firsts.filter(x=>!/Intervals marked/.test(x.t)).map(x=>x.i+1);
  ok('2 each behavior’s first sheet: the definitions and the whole grid on the same page',firsts.length>=1&&!bad.length,{pages:pages.length,firsts:firsts.map(x=>x.i+1),bad,info});
  const lone=pages.map((t,i)=>({i,t})).filter(x=>/Scatter plot method after Touchette/.test(x.t)&&!/Intervals marked/.test(x.t)).map(x=>x.i+1);   /* the data sheet's citation, not the control chart's references */
  ok('3 no page holds only the citation',!lone.length,{lone,pages:pages.length});
  const full=firsts.length&&firsts.slice(0,1).every(x=>   /* behavior 1 carries the long simulated definitions */x.t.replace(/\s+/g,' ').includes(LAST)&&x.t.replace(/\s+/g,' ').includes('within 1 min.'));
  ok('4 the definition and the non-examples print in full, not cut at their box',!!full,firsts.slice(0,1).map(x=>x.t.replace(/\s+/g,' ').slice(0,400)));
  const sheets=pages.filter(t=>/Scatterplot Data Sheet/.test(t)).length,grids=pages.filter(t=>/Intervals marked/.test(t)).length;
  ok('5 every data sheet is one page: as many pages with a grid as sheets, each with its heading',sheets>0&&pages.filter(t=>/Scatterplot Data Sheet/.test(t)&&/Intervals marked/.test(t)).length===sheets,{sheets,grids,pages:pages.length});
  ok('6 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  if(process.env.KEEP)fs.copyFileSync(path.join(tmp,'sp1.pdf'),process.env.KEEP);try{fs.rmSync(tmp,{recursive:true,force:true});}catch(e){}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
