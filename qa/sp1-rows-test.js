/* Form SP-1 (v23.79, the BCBA's printout): on paper the grid's rows take the height their page has left.
   A simulated record, two weeks to a sheet, 9:00 to 3:30 in half hours, printed on Letter as an iPad prints it (and once
   as a laptop does), with long definitions, short ones, two rates, codes, one sheet, three sheets and long entries:
   1. every printed data sheet is one page: its height is within the page, and the room left under it is 30 px at most (unless its rows are at their 44 px cap, v24.10);
   2. the rows are those the page leaves (a long definition and its examples: about 24 px on sheet 1, against about 16 before);
   3. a later sheet, which repeats the definitions and carries the legend and the citation, is counted with them;
   4. the six fields print whole as text that wraps (several observers, a long target behavior), three to a row, each
      label whole;
   5. the Date line keeps its 24 px whatever the rows' height;
   6. on paper each data sheet is a page of its own with its whole grid, and in the PDF itself nothing runs past a page's
      foot and each data sheet's page is filled to within 34 px; no page errors. Simulated data only.
   usage: node qa/sp1-rows-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DEF='Contact of any part of the learner’s head or face with a fixed surface (wall, floor, table, desk, window, door, chair back), produced by movement of the head or upper body toward the surface, with force enough to be heard from 1 m or to leave a mark seen within 1 min.';
const EX=['Hitting the head against a door while walking in the hallway, heard from the classroom.','Bringing the forehead down onto the desk once during a writing task, heard from the doorway.','Striking the back of the head against the wall while seated on the floor, each contact heard from 1 m.','Lifting the head and bringing the face down onto the floor while lying face down, leaving a red mark.','Banging the side of the head against the bus window, heard from the seat in front.','A short, loud series of head hits against the table during a transition (simulated).'].join('\n');
const NON=['Putting the head down on the desk or the arms during work, or leaning it against the wall, with no striking movement.','Flopping onto the desk with no sound heard from 1 m and no mark.','The head touching a surface during a trip or a fall, with the whole body moving.','Rubbing the forehead on the carpet with no sound and no mark.','Resting the cheek on a cool window while waiting in line.'].join('\n');
const OBS='Dana Whitfield, Paula Brennan, Iris Calloway and Jordan Ellis (simulated)',BEH='Head hitting against hard surfaces in the classroom and the hallway (simulated)';
const CASES={long:{},short:{short:true},two:{levels:2},codes:{levels:2,codes:true,mode:'count'},single:{days:10},three:{days:30},names:{names:true},laptop:{ua:'laptop'}};
(async()=>{const br=await L.chromium.launch();const errs=[];const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sp1r-'));const R={};
  try{
  for(const [name,cs] of Object.entries(CASES)){
    const ctx=await br.newContext(Object.assign({viewport:{width:1180,height:820},serviceWorkers:'block'},cs.ua==='laptop'?{}:{hasTouch:true,userAgent:IPAD}));
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html');await sleep(1100);
    await p.evaluate(async()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;await loadSim();});await sleep(700);
    await p.evaluate(([cs,d,e,n,o,b])=>{
      Object.assign(state.cfg,{startMin:540,spanH:6.5,interval:30,days:cs.days||20,dayStart:1,mode:cs.mode||'tap',codes:!!cs.codes,perSheet:10,levels:cs.levels||1,actOn:false});
      if(typeof syncToolbar==='function')syncToolbar();render();
      const set=(k,v)=>{const t=document.querySelector('[data-meta="'+k+'"]');t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));};
      if(cs.short){set('definition','Hitting the head on a surface (simulated).');set('example','');set('nonexample','');}else{set('definition',d);set('example',e);set('nonexample',n);}
      if(cs.names){set('observer',o);set('behavior',b);}
      render();},[cs,DEF,EX,NON,OBS,BEH]);await sleep(500);
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(500);
    R[name]=await p.evaluate(()=>{const page=spPage('print');
      const sh=[...document.querySelectorAll('#spPrint > .sheet')].filter(s=>s.querySelector('table.scatter')).map(s=>{const t=s.querySelector('table.scatter'),rows=[...t.tBodies[0].rows];
        const kind=s.classList.contains('sp-page')?(s.nextElementSibling&&s.nextElementSibling.classList.contains('sp-page')?'cont':'last'):(s.querySelector('.legend')?'only':'first');
        const dr=t.tHead.rows[1];
        const f=[...s.querySelectorAll('.ident .f')].map(x=>{const lb=x.querySelector('label'),sp=x.querySelector('.sp-ftext');
          return {lab:lb.textContent,labW:Math.round(lb.getBoundingClientRect().width),labNeed:Math.ceil(lb.scrollWidth),text:sp?sp.textContent:null,lines:sp?Math.round((sp.getBoundingClientRect().height-3)/17):0,top:Math.round(x.getBoundingClientRect().top)};});
        return {kind,h:Math.round(s.getBoundingClientRect().height),rowh:Math.round(rows[0].getBoundingClientRect().height)-1,nR:rows.length,date:dr?Math.round(dr.getBoundingClientRect().height):0,
          inputs:s.querySelectorAll('.ident input').length,f};});
      return {page,sheets:sh,split:spSplit};});
    const f=path.join(tmp,name+'.pdf');await p.pdf({path:f,format:'Letter',preferCSSPageSize:true,printBackground:true});
    /* each page's text, and the lowest thing on it above the page's foot (the running head and foot lines left out), in px */
    const py='import sys,json,pymupdf\nd=pymupdf.open(sys.argv[1])\nout=[]\nfor p in d:\n  ys=[b[3] for b in p.get_text("blocks") if 40<b[1]<750]+[r["rect"].y1 for r in p.get_drawings() if 40<r["rect"].y1<790]\n  out.append([" ".join(p.get_text().split()),round((756-max(ys))/0.75) if ys else None])\nprint(json.dumps(out))';
    const pp=JSON.parse(cp.execFileSync('python3',['-I','-c',py,f],{encoding:'utf8'}));R[name].pdf=pp.map(x=>x[0]);R[name].free=pp.map(x=>x[1]);R[name].ipad=cs.ua!=='laptop';
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await ctx.close();
  }
  const all=Object.entries(R).flatMap(([n,r])=>r.sheets.map(s=>Object.assign({case:n,page:r.page,left:r.page-s.h},s)));
  ok('1 every printed data sheet is within its page, and leaves 30 px at most under it ('+all.length+' sheets, '+Object.keys(R).length+' setups)',
    all.length>=16&&all.every(s=>s.left>=0&&(s.left<=30||s.rowh>=44)),all.filter(s=>s.left<0||(s.left>30&&s.rowh<44)).map(s=>({c:s.case,k:s.kind,h:s.h,page:s.page,rowh:s.rowh})));
  const lg=R.long.sheets;
  ok('2 a long definition and its examples: sheet 1\'s rows are what the page leaves (24 px or more on an iPad), short ones taller still, up to 44',
    lg[0].kind==='first'&&lg[0].rowh>=24&&R.short.sheets[0].rowh>lg[0].rowh&&all.every(s=>s.rowh<=44&&s.rowh>=12),{long:lg.map(s=>[s.kind,s.rowh]),short:R.short.sheets.map(s=>[s.kind,s.rowh])});
  ok('3 a later sheet is counted with its definitions, legend and citation (a middle sheet without the legend gets taller rows)',
    lg[1].kind==='last'&&R.long.page-lg[1].h>=0&&R.three.sheets.some(s=>s.kind==='cont')&&R.three.sheets.find(s=>s.kind==='cont').rowh>R.three.sheets.find(s=>s.kind==='last').rowh,R.three.sheets.map(s=>[s.kind,s.rowh,R.three.page-s.h]));
  /* v24.03 the Sheet no. box is gone from the paper (the band names the sheet): the five printed fields, in two rows */
  const nf=R.names.sheets[0].f.filter(x=>x.top>0||x.lines>0),obs=nf.find(x=>x.lab==='Observer'),beh=nf.find(x=>x.lab==='Target behavior'),tops=[...new Set(nf.map(x=>x.top))];
  ok('4 the five printed fields print whole as text, one line each but the observers (three, v24.10; an entry longer than that ends in an ellipsis), three to a row, each label whole',R.names.sheets[0].inputs===0&&obs&&obs.text===OBS&&obs.lines<=3&&beh&&beh.text===BEH&&
    tops.length===2&&nf.every(x=>x.labW>=x.labNeed-1)&&R.names.pdf.join(' ').includes('Jordan Ellis (simulated)'),{nf,tops});
  ok('5 the Date line keeps its 24 px whatever the rows\' height',all.every(s=>s.date>=23&&s.date<=26),all.map(s=>[s.case,s.kind,s.rowh,s.date]));
  const bad=Object.entries(R).flatMap(([n,r])=>{const pg=r.pdf.filter(t=>/Scatterplot Data Sheet/.test(t));return pg.length===r.sheets.length+(r.sheets.length?0:0)&&pg.every(t=>/Intervals marked/.test(t))?[]:[{n,pages:pg.length,sheets:r.sheets.length}];});
  ok('6 on paper each data sheet is one page with its whole grid, in every setup',!bad.length,bad);
  /* as the PDF has it: nothing past the page's foot, and a data sheet's page left with at most 34 px (and the 48 px kept on
     an iPad for Safari's own line at the foot, which this browser does not print) */
  const pdfFree=Object.entries(R).flatMap(([n,r])=>r.pdf.map((t,i)=>({n,i:i+1,data:/Scatterplot Data Sheet/.test(t),free:r.free[i],max:(r.ipad?48:0)+34})));
  ok('6b in the PDF itself: nothing runs past a page\'s foot, and each data sheet\'s page is filled to within 34 px ('+pdfFree.filter(x=>x.data).length+' pages)',
    pdfFree.every(x=>x.free===null||x.free>=-1)&&pdfFree.filter(x=>x.data).every(x=>x.free!==null&&x.free<=x.max),pdfFree.filter(x=>(x.free!==null&&x.free<-1)||(x.data&&!(x.free<=x.max))));
  ok('7 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  try{fs.rmSync(tmp,{recursive:true,force:true});}catch(e){}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
