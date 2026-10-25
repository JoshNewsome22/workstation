/* v24.10 Form SP-1, the printed sheet's compact top: one line a field with an ellipsis, short dates, the photo 0.62 in, the
   example and the non-example side by side; a behavior's definitions and its grid on one page even with long definitions,
   several observers and the photo (a PDF of the set is counted); the screen unchanged; the walkthrough still builds.
   usage: node qa/sp110-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),cp=require('child_process');
const URL=BASE+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 await p.goto(URL);await sleep(1500);
 /* a record like the BCBA's: long definitions, several observers, four weeks of school days on two sheets, the photo on */
 await p.evaluate(()=>{const ex=['Hitting the head against the door while walking in the hallway with enough force to produce a sound or leave a mark.','Bringing the forehead down onto the desk once during a writing task, heard from the doorway.','Repeatedly striking the back of the head against the wall while seated on the floor, each contact audible from 1 m (each contact scored).','Lifting the head and banging the face onto the floor while lying face down, leaving reddening on the forehead.','Banging the side of the head against the car window, audible from the front seat.','A short, low bang of the forehead on the table (less than 15 cm of travel) that leaves a red mark.'];
   const nx=['Putting the head down on the desk or the arms during work, or leaning it against the wall, without a striking movement (putting the head down during work, a noncompliance entry).','Flopping onto the desk with no sound audible from 1 m and no mark (flopping onto the desk, a precursor entry).','The head contacting a surface during a trip or a fall, with the whole body moving through space rather than the head moving toward the surface.','Rocking that brings the head near the chair back without contact.','Butting the head into an adult or a peer (aggression).','Leaning the head back against a car headrest.'];
   Object.assign(state.meta,{client:'A. Student (simulated)',observer:'Simon, Robin, Chris, Darbro',setting:'Royal Palm School',behavior:'Head banging against surfaces',
     definition:'Contact of any part of the learner’s head or face with a fixed or stationary surface (wall, floor, table, desk, window, door, chair back, bed frame, or vehicle window), produced by movement of the learner’s head or upper body toward the surface, with force sufficient to produce a sound audible from 1 m, or reddening or a mark at the site seen within 1 min.',
     example:ex.join('\n'),nonexample:nx.join('\n'),week:'',photo:'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',photoOn:'1',photoCase:true});
   state.cfg.days=20;state.cfg.perSheet=10;state.cfg.actOn=true;state.cfg.guide=true;document.querySelector('#mfOnly').checked=true;
   const d=new Date(2026,9,12);for(let i=0;i<20;i++){while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1);state.meta['date'+i]=toISO(d);d.setDate(d.getDate()+1);}
   state.meta.week=longDate(state.meta.date0)+' – '+longDate(state.meta.date19);commitBeh();renderMeta();render();});
 const built=await p.evaluate(()=>{fitForPrint(true);const set=window.spPrintSet('print');const host=document.querySelector('#spPrint');host.innerHTML='';set.forEach(e=>host.appendChild(e));document.documentElement.classList.add('sp-printall');
   const sheets=[...host.children];return {n:sheets.length,kinds:sheets.map(e=>e.classList.contains('sp-guide')?'guide':e.querySelector('table.scatter')?'grid':'other'),screenIdent:!!document.querySelector('#sheet .ident.sp-ident2'),screenRows:document.querySelectorAll('#sheet .defs > .drow').length};});
 ok('the print set is sheet 1, the guide, sheet 2 (no marks, so no summary); the screen’s own fields and definitions are untouched',built.kinds.join()==='grid,guide,grid'&&!built.screenIdent&&built.screenRows===3,built);
 await p.emulateMedia({media:'print'});
 const pr=await p.evaluate(()=>{const host=document.querySelector('#spPrint');const s1=host.children[0];const id=s1.querySelector('.ident');const f=[...id.querySelectorAll('.f')].filter(x=>getComputedStyle(x).display!=='none');const v=x=>x.querySelector('.sp-ftext');const cs=x=>getComputedStyle(v(x));
   const ph=id.querySelector('.sp-photo');const dates=f.find(x=>/Dates/.test(x.textContent));const tgt=f.find(x=>/Target/.test(x.textContent));const obs=f.find(x=>/Observer/.test(x.textContent));const stg=f.find(x=>/Setting/.test(x.textContent));
   const pair=s1.querySelector('.defs .sp-defpair');const heights=[...host.children].map(e=>Math.round(e.getBoundingClientRect().height));const rowh=[...host.children].map(e=>e.style.getPropertyValue('--rowh'));
   return {ident2:id.classList.contains('sp-ident2'),photo:ph&&Math.round(ph.getBoundingClientRect().width),identH:Math.round(id.getBoundingClientRect().height),dates:v(dates).textContent,nowrap:cs(stg).whiteSpace,ellipsis:cs(stg).textOverflow,fs:cs(stg).fontSize,obsClamp:cs(obs).webkitLineClamp,
     tgtW:Math.round(tgt.getBoundingClientRect().width),obsW:Math.round(obs.getBoundingClientRect().width),pair:pair&&pair.querySelectorAll('.drow').length,pairW:pair&&[...pair.querySelectorAll('.drow')].map(x=>Math.round(x.getBoundingClientRect().width)),
     defsH:Math.round(s1.querySelector('.defs').getBoundingClientRect().height),heights,rowh,page:spPage('print')};});
 ok('on paper the fields are two one-line rows with the photo 0.62 in beside them, the dates short, the target behavior across two columns, the observers allowed three lines',
   pr.ident2&&pr.photo>=58&&pr.photo<=61&&pr.identH<=72&&pr.dates==='10/12/26 – 11/6/26'&&pr.nowrap==='nowrap'&&pr.ellipsis==='ellipsis'&&pr.fs==='12.5px'&&pr.obsClamp==='3'&&pr.tgtW>pr.obsW*1.6,pr);
 ok('the example and the non-example print side by side, each half the sheet; the definitions block is under 290 px with six lines of each (it was over 400)',pr.pair===2&&Math.abs(pr.pairW[0]-pr.pairW[1])<4&&pr.defsH<290,pr);
 ok('every printed sheet is no taller than its page, so the grid shares the page with the definitions',pr.heights.every(h=>h<=pr.page)&&pr.rowh.filter(Boolean).every(r=>parseInt(r)>=12),pr);
 await p.pdf({path:'/tmp/sp110.pdf',format:'Letter',printBackground:true});
 let pages=0;try{const out=cp.execSync("python3 -W ignore -c \"import fitz;print('PAGES',len(fitz.open('/tmp/sp110.pdf')))\" 2>&1").toString();const m=/PAGES (\d+)/.exec(out);pages=m?+m[1]:-1;}catch(e){pages=-1;}
 ok('the PDF of the set is three pages: sheet 1 with its grid, the guide, sheet 2',pages===3,{pages});
 await p.emulateMedia({media:'screen'});await p.evaluate(()=>{document.documentElement.classList.remove('sp-printall');document.querySelector('#spPrint').innerHTML='';endPrint();});
 /* the walkthrough builds from the same clone */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const w=await p.evaluate(()=>({cues:TKWALK.cues.length,ident2:!!document.querySelector('#wkStage .ident.sp-ident2'),dates:(document.querySelector('#wkStage .sp-wkbox .sp-ftext')||{}).textContent}));
 ok('the walkthrough builds with the compact top and short dates',w.cues>=11&&w.ident2&&/^\d+\/\d+\/\d\d – \d+\/\d+\/\d\d$/.test(w.dates),w);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
