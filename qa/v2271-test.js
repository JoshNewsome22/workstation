/* v22.71 Form RA-1's walkthroughs in one look, the table seen from above: the drawn stories, the practice questions and the
   printed job aids draw with NBHTable (the hands, the tray, the bins, the items and the data collector's screen; a sheet shown
   alone, full size), no figures; the video opens each chapter on its own scene and keeps its notes inside the frame; the
   runners' Clock during access menu reads in full. Simulated data only. usage: node qa/v2271-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/Reinforcer_Assessment_Protocol.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#viewSeg [data-view="walk"]').click();});await sleep(1200);
  /* the stories */
  const st=await p.evaluate(()=>[...document.querySelectorAll('#walk .story[data-story]')].map(s=>({k:s.dataset.story,nst:!!s.querySelector('.scene.nst .nst-stage'),old:!!s.querySelector('.scene svg.tbl:not(.nst svg)'),
    w:Math.round(s.querySelector('.nst-frame').getBoundingClientRect().width),h:Math.round(s.querySelector('.nst-frame').getBoundingClientRect().height)})));
  ok('1 every story draws the table from above (NBHTable), 16:9, with no figures',st.length===6&&st.every(s=>s.nst&&!s.old&&Math.abs(s.w/s.h-16/9)<.02),st);
  const step=(k,n)=>p.evaluate(([k,n])=>{window.SCENES[k].go(n);},[k,n]);
  const look=k=>p.evaluate(k=>{const s=document.querySelector('.story[data-story="'+k+'"] .scene');const vis=e=>e&&!e.closest('.nst-off')&&getComputedStyle(e).opacity!=='0';
    const pose=w=>[...s.querySelectorAll('.nst-'+w+' .nst-pose')].filter(e=>e.style.opacity==='1').length;
    return {learner:pose('learner'),teacher:pose('teacher'),held:vis(s.querySelector('.nst-held')),board:vis(s.querySelector('.nst-board')),table:vis(s.querySelector('.nst-trayb')),
      obs:vis(s.querySelector('.nst-obsw'))?[...s.querySelectorAll('.nst-obs:not(.nst-obs2) [class^="nst-o"]')].map(e=>e.textContent).join(' | '):'',
      tablet:vis(s.querySelector('.nst-it')),does:(s.querySelector('.does')||{}).textContent||''};},k);
  await step('so',0);await sleep(900);const a=await look('so');
  const f0=await p.evaluate(()=>window.SCENES.so.frames[0]);
  ok('2 a step with the student placing a block: the student\'s hand, the block held, the table, and the screen as the step writes it',a.learner===1&&a.held&&a.table&&!a.board&&a.obs.startsWith([f0.obs.t1,f0.obs.t2,f0.obs.t3].join(' | ')),{a,obs:f0.obs});
  const bi=await p.evaluate(()=>window.SCENES.so.frames.findIndex(f=>f.board));await step('so',bi);await sleep(900);const b=await look('so');
  ok('3 a step that shows a sheet shows it alone, full size: no table, no hands',bi>=0&&b.board&&!b.table&&b.learner===0&&b.teacher===0,b);
  const hi=await p.evaluate(()=>window.SCENES.setup.frames.findIndex(f=>f.s==='hi5'));await step('setup',hi);await sleep(900);const c=await look('setup');
  ok('4 the high five: both hands, the assessor\'s from across the table',c.learner===1&&c.teacher===1&&c.table,c);
  const wi=await p.evaluate(()=>window.SCENES.so.frames.findIndex(f=>f.tablet==='student'));await step('so',wi);await sleep(900);const d=await look('so');
  ok('5 the tablet in front of the student while the access runs',wi>=0&&d.tablet,d);
  ok('6 what the student does is a line under the picture, not on it',await p.evaluate(()=>{const s=document.querySelector('.story[data-story="so"] .scene');const does=s.querySelector('.does'),fr=s.querySelector('.nst-frame');
    return !!does&&does.getBoundingClientRect().top>=fr.getBoundingClientRect().bottom-1&&getComputedStyle(s.querySelector('.say2')).display==='none';}));
  const lad=await p.evaluate(()=>{const k=window.SCENES.pr.frames.findIndex(f=>f.lad);window.SCENES.pr.go(k);const s=document.querySelector('.story[data-story="pr"] .nst-lad');return {k,cells:s?s.querySelectorAll('svg')[0].querySelectorAll('.lc').length:0,shown:!!s&&!s.classList.contains('nst-off')};});
  ok('7 the progressive ratio\'s ladder on the screen, in two rows',lad.k>=0&&lad.shown&&lad.cells>=5,lad);
  /* practice and job aids */
  ok('8 the practice questions draw the same way',await p.evaluate(()=>!!document.querySelector('#walk .scene.nst:not(.story .scene)')));
  const aids=await p.evaluate(()=>{window.raWalk.buildJobAids();const h=document.getElementById('wk-aids');const fr=[...h.querySelectorAll('.jp-scene .nst-frame')];const cv=h.querySelector('.jp-cover-scene .nst-frame');
    return {n:fr.length,w:[...new Set(fr.map(f=>f.style.width))],cover:cv&&cv.style.width,key:/Reading the Drawings/.test(h.textContent)&&!/Who Is Who in the Drawings/.test(h.textContent),old:h.querySelectorAll('svg.tbl:not(.nst svg)').length};});
  ok('9 the printed job aids draw every step at its printed width (1.72 in; the cover 4.4 in), with a key to the table seen from above',aids.n>20&&aids.w.length===1&&aids.w[0]==='165px'&&aids.cover==='422px'&&aids.key&&aids.old===0,aids);
  await p.evaluate(()=>{document.getElementById('wk-aids').innerHTML='';});
  /* the video */
  const cut=await p.evaluate(()=>{TKWALK.build&&TKWALK.build();const ch=TKWALK.chapters;const stg=document.getElementById('wkStage');const op=e=>e?+getComputedStyle(e).opacity:-1;
    const at=t=>{TKWALK.renderAt(t);return {mats3:op(stg.querySelector('.raw-mat3')),papers:op(stg.querySelector('.raw-worldwrap')),panel:op(stg.querySelector('.raw-panel'))};};
    const co=ch.find(c=>c.id==='co'),pr=ch.find(c=>c.id==='pr');return {co:at(co.start),coBefore:at(co.start-.05),pr:at(pr.start),n:ch.length};});
  ok('10 a chapter opens on its own scene: Concurrent operants on its three stations, the single-operant panel gone; Progressive ratio with the papers gone',
    cut.co.mats3>.99&&cut.co.panel<.01&&cut.coBefore.mats3<.01&&cut.pr.papers<.01&&cut.n===6,cut);
  const notes=await p.evaluate(()=>{const stg=document.getElementById('wkStage');const out=[];const D=TKWALK.cues;
    for(const c of D)for(let f=.1;f<1;f+=.1){TKWALK.renderAt(c.start+c.dur*f);stg.querySelectorAll('.raw-fx > .raw-note').forEach(n=>{if(+getComputedStyle(n).opacity<.5)return;const l=parseFloat(n.style.left),w=n.offsetWidth;if(l-w/2<-1||l+w/2>1281)out.push([c.id,n.textContent,l,w]);});}
    return out;});
  ok('11 the notes on the stage stay inside the frame',notes.length===0,notes.slice(0,5));
  /* the runners' menu */
  const menu=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="so"]').click();const s=document.getElementById('ra-run-so-clock');
    return {opts:[...s.options].map(o=>o.value+':'+o.textContent),fits:s.scrollWidth<=s.clientWidth+1&&s.getBoundingClientRect().width>=200,
      all:['co','pr'].every(v=>[...document.getElementById('ra-run-'+v+'-clock').options].map(o=>o.textContent).join('|')==='Pauses: minutes available|Runs: minutes less access|Runs: all minutes')};});
  ok('12 Clock during access reads in full: Pauses: minutes available, Runs: minutes less access, Runs: all minutes',menu.opts.join('|')==='pause:Pauses: minutes available|avail:Runs: minutes less access|run:Runs: all minutes'&&menu.fits&&menu.all,menu);
  const runCopy=await p.evaluate(()=>{const w=document.querySelector('#wkStage .raw-run');return w?w.textContent.replace(/\s+/g,' '):'';});
  ok('13 the video\'s runner says what its narration says: the clock waits during access',/Pauses: minutes available/.test(runCopy)&&/the clock waits during access/.test(runCopy)&&!/Minutes run less access time/.test(runCopy),runCopy.slice(0,300));
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('14 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
