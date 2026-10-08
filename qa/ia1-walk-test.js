/* v21.56 Form IA-1, the Walkthrough view of the FAST (tools/forms/IA-1/walk.js, put in by patch-walk.py):
   1. The view is a button in the View segment and a section shown by body.view-walk; the narration and Save as video are beside the form.
   2. An empty form builds every scene from the worked example (two informants: 17 lines, 7 chapters, about six minutes); the
      form's fields are exactly as they were after the build (the example is put in and taken out in one turn).
   3. The simulation builds the same scenes from the form's own three informants; the stage holds no field, only text.
   4. The pencil has written the answers; the camera reaches the totals, the verdict, the figure of the items, Section 1.
   5. The frames Save as video paints are the stage as shown (five moments).
   6. Leaving the view pauses; the link to the recorded version is a form field; no errors.
   7. (v21.57) The practice check stops the player and takes an answer; captions and chapters for YouTube; the informant version
      (six lines, a minute) and the Convergence walkthrough (ten lines, its own three-informant example) from the same empty form.
   usage: node qa/ia1-walk-test.js   (WS_URL as in qa/lib.js; ED=RPS-Workstation for the school's edition) */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const ED=process.env.ED||'NBH-Workstation';
const URL=BASE+'/'+ED+'/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i):''));if(!c)fails++;};
const IDS='intro,cats,define,informants,items,na,totals,verdict,practice,practice_answer,agree,pubitems,outagree,validity,concur,meaning,section1,next,outro';
const IDS_INF='i_intro,i_one,i_items,i_na,i_own,i_outro',IDS_CONV='c_intro,c_rows,c_vote,c_verdict,c_phys,c_fig,c_hyp,c_decide,c_fa,c_outro';
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:950}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const bits=await page.evaluate(()=>({btn:!!document.querySelector('#viewSeg [data-view="walk"]'),sec:!!document.getElementById('walk'),hidden:getComputedStyle(document.getElementById('walk')).display==='none',
    nar:!!document.querySelector('script[src="nbh-ia1-narration.js"]'),vid:!!document.querySelector('script[src="nbh-tk1-video.js"]'),audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.what,link:!!document.querySelector('#walk input[name="walk.video"]')}));
  ok('the Walkthrough button, its section (hidden until chosen), the narration and Save as video are there',bits.btn&&bits.sec&&bits.hidden&&bits.nar&&bits.vid&&bits.audio===35&&bits.video==='object'&&bits.info==='form'&&bits.link,bits);
  ok('the narration file is beside the form',fs.existsSync(path.join(ROOT,ED,'nbh-ia1-narration.js')));
  /* an empty form: the worked example */
  const fields=()=>page.evaluate(()=>[...document.querySelectorAll('[name]')].map(e=>e.name+'='+(e.type==='checkbox'?e.checked:e.value)).join('\u0001')+'|'+document.getElementById('nInf').value);
  const before=await fields();
  await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="walk"]').click();});await sleep(800);
  const wk=await page.evaluate(()=>{const st=document.getElementById('wkStage');return {d:TKWALK.duration,ids:TKWALK.cues.map(c=>c.id),ch:TKWALK.chapters.map(c=>c.id),view:document.body.className,ex:TKWALK.example,shown:getComputedStyle(document.getElementById('walk')).display,
    inputs:st.querySelectorAll('input,select,textarea,button').length,cols:st.querySelector('.iaw-fast table.grid.item thead tr').cells.length,rows:st.querySelectorAll('.iaw-fast table.grid.item tbody tr').length,
    papers:st.querySelectorAll('.iaw-paper').length,figs:st.querySelectorAll('.iaw-figs svg').length,note:document.getElementById('wkNote').textContent,
    verdict:(st.querySelector('.iaw-fast .verdict')||{}).textContent||''};});
  ok('an empty form: every scene from the worked example (the practice check included), seven chapters, five to seven minutes',wk.ids.join()===IDS&&wk.ch.length===7&&wk.d>300&&wk.d<420&&wk.view==='view-walk'&&wk.ex&&wk.shown==='block',wk);
  ok('the stage: four papers of text (no fields), the grid with two informants, the Agree and Pub. columns, three figures',wk.inputs===0&&wk.papers===4&&wk.cols===6&&wk.rows===16&&wk.figs===3&&/worked example/.test(wk.note),wk);
  /* (v21.58) the FAST's questions on the worksheet, on the stage's copy, and on the respondent page when none are pasted */
  const qs=await page.evaluate(()=>{const st=document.getElementById('wkStage');const cell=st.querySelector('.iaw-fast table.grid.item tbody tr td.catcell');return {stage:cell?cell.textContent.replace(/\s+/g,' ').trim():'',form:document.querySelector('#fastGrid tbody tr:nth-child(16) td.catcell .qtext').textContent,tag:document.querySelector('#fastGrid tbody tr td.catcell .qcat').textContent,wide:getComputedStyle(document.querySelector('#fast .twoup.fast-wide')).gridTemplateColumns.split(' ').length,count:document.querySelector('.rp-count[data-rpw="fast"]').textContent,rows:document.querySelectorAll('#fastGrid tbody tr').length,credit:(document.querySelector('#fast .fast-credit')||{}).textContent||'',creditStage:(st.querySelector('.iaw-fast .fast-credit')||{}).textContent||''};});
  ok('the FAST\'s sixteen questions: beside their numbers on the worksheet (one column, the category as a tag), on the stage\'s copy, and built in for the respondent page; the authors\' credit in APA form on the sheet and on the stage',/^Does the problem behavior occur when the person is not receiving attention/.test(qs.stage)&&/Social positive/.test(qs.stage)&&/^If the person is experiencing physical problems/.test(qs.form)&&qs.tag==='Social positive (attention / preferred items)'&&qs.wide===1&&qs.count==='(built in)'&&qs.rows===16&&/developed by Brian A\. Iwata \(University of Florida\), Iser G\. DeLeon .* and Eileen M\. Roscoe/.test(qs.credit)&&/Iwata, B\. A\., DeLeon, I\. G\., & Roscoe, E\. M\. \(2013\)\. Reliability and validity of the Functional Analysis Screening Tool\. Journal of Applied Behavior Analysis, 46\(1\), 271–284\. https:\/\/doi\.org\/10\.1002\/jaba\.31/.test(qs.credit)&&/developed by Brian A\. Iwata/.test(qs.creditStage),qs);
  ok('the example scores as the narration says: a one-item margin for B, agreement 73.3% on 15 items, the outcome agreed',/margin of one item/.test(wk.verdict)&&/73\.3%/.test(wk.verdict)&&/Outcome agreement 1 of 1/.test(wk.verdict),wk.verdict.slice(0,300));
  const after=await fields();
  ok('the form’s fields are exactly as they were after the build',before===after);
  /* the pencil's answers, and the camera's stops */
  const cam=await page.evaluate(()=>{const c=TKWALK.cues;const st=document.getElementById('wkStage');const inS=el=>{if(!el)return false;const r=el.getBoundingClientRect(),s=st.getBoundingClientRect();return r.top<s.bottom&&r.bottom>s.top&&r.left<s.right&&r.right>s.left;};
    const at=(id,sel,frac)=>{const q=c.find(x=>x.id===id);TKWALK.renderAt(q.start+q.dur*(frac==null?.7:frac));return inS(st.querySelector(sel));};
    const q=c.find(x=>x.id==='items');TKWALK.renderAt(q.start+q.dur-.2);const written=[...st.querySelectorAll('.iaw-write')].filter(e=>getComputedStyle(e).visibility==='visible').length;
    const agreeShown=getComputedStyle(st.querySelector('.iaw-fast table.grid.item tbody tr td.agr')).visibility==='visible';
    return {written,agreeShown,totals:at('totals','.iaw-fast table.grid:not(.item)'),verdict:at('verdict','.iaw-fast .verdict'),fig3:at('pubitems','.iaw-figs .figure:last-child svg',.3),s1:at('section1','.iaw-s1 .defs'),setup:at('informants','.iaw-setup table')};});
  ok('the pencil wrote all 32 answers and the Agree column appeared; the camera reaches the informants, the totals, the verdict, the items figure and Section 1',cam.written===32&&cam.agreeShown&&cam.totals&&cam.verdict&&cam.fig3&&cam.s1&&cam.setup,cam);
  /* (v21.57) the practice check: the last informant's totals, the answer, the player stopping at the answer, the viewer's choice */
  const qz=await page.evaluate(async()=>{const z=TKWALK.quiz;const q=TKWALK.cues.find(c=>c.id==='practice_answer');TKWALK.seek(q.start-1.2);TKWALK.play();await new Promise(r=>setTimeout(r,2600));
    const open=!document.getElementById('wkQuiz').hidden,playing=TKWALK.playing,t=TKWALK.time;
    document.querySelector('#wkQuizA .wk-qb[data-v="1"]').click();document.querySelector('#wkQuizM .wk-qb[data-v="1"]').click();const res=document.getElementById('wkQuizR').textContent;const cls=document.getElementById('wkQuizR').className;
    document.getElementById('wkQuizGo').click();await new Promise(r=>setTimeout(r,300));const after={playing:TKWALK.playing,hidden:document.getElementById('wkQuiz').hidden};TKWALK.pause();
    return {z,open,playing,t,start:q.start,res,cls,after};});
  ok('the practice check: informant B (2, 3, 1, 0), the answer social negative by one; the player stops at the answer with the question; a right answer is told; Play on plays on',
    qz.z&&qz.z.who==='B'&&qz.z.ans===1&&qz.z.margin===1&&qz.z.tots.map(x=>x[0]).join()==='2,3,1,0'&&qz.open&&!qz.playing&&Math.abs(qz.t-qz.start)<.6&&/^Right\./.test(qz.res)&&/ok/.test(qz.cls)&&qz.after.playing&&qz.after.hidden,qz);
  /* captions and chapters for YouTube */
  const cc=await page.evaluate(()=>{const c=TKWALK.captions(),ch=TKWALK.chapterList().split('\n');return {n:c.length,first:c[0],ordered:c.every((x,i)=>!i||x.a>=c[i-1].a),within:c.every(x=>x.b>x.a&&x.b-x.a<30),ch,d:TKWALK.duration};});
  ok('captions: one per caption piece in order, each a few seconds, from 0; the chapters list starts at 0:00 with seven lines',cc.n>50&&cc.first.a===0&&cc.ordered&&cc.within&&cc.ch.length===7&&/^0:00 The FAST$/.test(cc.ch[0])&&/^\d+:\d\d What it means$/.test(cc.ch[6]),cc);
  /* the informant version and the Convergence walkthrough, from the same empty form */
  const inf=await page.evaluate(()=>{document.querySelector('#walk .wk-modes [data-mode="inf"]').click();const st=document.getElementById('wkStage');const q=TKWALK.cues.find(c=>c.id==='i_items');TKWALK.renderAt(q.start+q.dur-.2);
    return {mode:TKWALK.mode,ids:TKWALK.cues.map(c=>c.id).join(),d:TKWALK.duration,ch:TKWALK.chapters.length,papers:st.querySelectorAll('.iaw-paper').length,written:[...st.querySelectorAll('.iaw-write')].filter(e=>getComputedStyle(e).visibility==='visible').length,file:NBH_WALK_INFO.file,ex:TKWALK.example};});
  ok('for informants: six lines in one chapter, about a minute, three papers (no figures), the pencil writes informant A\'s sixteen answers only',inf.mode==='inf'&&inf.ids===IDS_INF&&inf.d>55&&inf.d<100&&inf.ch===1&&inf.papers===3&&inf.written===16&&inf.file==='FAST for informants'&&inf.ex,inf);
  const cv=await page.evaluate(()=>{document.querySelector('#walk .wk-modes [data-mode="conv"]').click();const st=document.getElementById('wkStage');const tbl=st.querySelector('.iaw-sum table.grid');const verd=st.querySelector('.iaw-sum .verdict');
    const q=TKWALK.cues.find(c=>c.id==='c_fa');TKWALK.renderAt(q.start+q.dur-.3);const fa=st.querySelectorAll('.iaw-sum .verdict')[1];
    return {mode:TKWALK.mode,ids:TKWALK.cues.map(c=>c.id).join(),d:TKWALK.duration,ch:TKWALK.chapters.length,papers:st.querySelectorAll('.iaw-paper').length,rows:tbl?tbl.tBodies[0].rows.length:0,verdict:(verd||{}).textContent||'',fa:fa?getComputedStyle(fa).visibility+' '+fa.textContent.slice(0,120):'',written:[...st.querySelectorAll('.iaw-write')].filter(e=>getComputedStyle(e).visibility==='visible').map(e=>e.textContent).join('|'),file:NBH_WALK_INFO.file,ex:TKWALK.example,inputs:st.querySelectorAll('input,select,textarea,button').length};});
  ok('Convergence: ten lines in four chapters, two to three minutes, the sheet with ten rows (three informants on FAST, QABF, MAS and one interview), escape 2 of 3, the pencil enters the analysis and its correspondence appears',
    cv.mode==='conv'&&cv.ids===IDS_CONV&&cv.d>110&&cv.d<190&&cv.ch===4&&cv.papers===1&&cv.rows===10&&/Escape: 2 of 3 informants \(67%\)/.test(cv.verdict)&&/^visible .*Mean correspondence 0\.75/.test(cv.fa)&&cv.written==='Escape|10/21/2026|Multielement'&&cv.file==='Convergence walkthrough'&&cv.ex&&cv.inputs===0,cv);
  const after2=await fields();
  ok('the form’s fields are exactly as they were after all three builds (the three-informant example taken out again)',before===after2);
  await page.evaluate(()=>document.querySelector('#walk .wk-modes [data-mode="fast"]').click());
  /* the captions keep a decimal whole */
  const caps=await page.evaluate(()=>{const q=TKWALK.cues.find(x=>x.id==='agree');TKWALK.renderAt(q.start+q.dur*.45);const a=document.getElementById('wkCap2').textContent;const q2=TKWALK.cues.find(x=>x.id==='validity');TKWALK.renderAt(q2.start+q2.dur*.5);return [a,document.getElementById('wkCap2').textContent];});
  ok('a caption holds 71.5 or 63.8 as one number',caps.some(t=>/\b(71\.5|28\.6|63\.8|77\.8)\b/.test(t))&&!caps.some(t=>/\d\. \d/.test(t)),caps);
  /* the simulation: the form's own three informants */
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="setup"]').click());
  await page.evaluate(()=>document.getElementById('simBtn').click());await sleep(1500);
  const sim=await page.evaluate(()=>{document.querySelectorAll('[class*=toast]').forEach(e=>e.remove());document.querySelector('#viewSeg [data-view="walk"]').click();const st=document.getElementById('wkStage');
    return {ex:TKWALK.example,ids:TKWALK.cues.map(c=>c.id).join(),cols:st.querySelector('.iaw-fast table.grid.item thead tr').cells.length,name:(st.querySelector('.iaw-setup table tbody tr td:nth-child(2)')||{}).textContent||'',banner:!document.getElementById('simBanner').hidden};});
  ok('the simulation: built from the form’s own three informants, the same scenes',!sim.ex&&sim.ids===IDS&&sim.cols===7&&/Teacher \(simulated\)/.test(sim.name)&&sim.banner,sim);
  /* the frames Save as video paints are the stage as shown */
  await page.evaluate(()=>[...document.body.querySelectorAll('*')].forEach(e=>{if(!e.closest('#wkPlayer')&&getComputedStyle(e).position==='fixed')e.style.display='none';}));
  for(const t of [8,70,125,200,300]){const png=await page.evaluate(async t=>(await TKVIDEO.frame(t,1280)).toDataURL('image/png'),t);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    if(!(d.mean<7&&d.worst<22)&&process.env.IA1_DUMP){fs.writeFileSync(process.env.IA1_DUMP+'/f'+t+'.png',Buffer.from(png.split(',')[1],'base64'));fs.writeFileSync(process.env.IA1_DUMP+'/s'+t+'.png',shot);}
    ok('t='+t+' s: the frame Save as video paints is the stage as shown',d.mean<7&&d.worst<22,d);}
  /* leaving the view pauses; the link is a field of the form */
  const left=await page.evaluate(async()=>{TKWALK.seek(10);TKWALK.play();await new Promise(r=>setTimeout(r,400));const i=document.getElementById('walkVideo');i.value='https://youtu.be/example';i.dispatchEvent(new Event('input',{bubbles:true}));const open=!document.getElementById('walkVideoOpen').hidden;
    document.querySelector('#viewSeg [data-view="fast"]').click();await new Promise(r=>setTimeout(r,200));return {now:TKWALK.playing,view:document.body.className,open,href:document.getElementById('walkVideoOpen').getAttribute('href')};});
  ok('leaving the view pauses the walkthrough; the link to the recorded version opens as entered',!left.now&&left.view==='view-fast'&&left.open&&left.href==='https://youtu.be/example',left);
  /* the one-file edition carries the narration and Save as video inside it */
  const one=await br.newPage({viewport:{width:1300,height:950}});await one.goto(BASE+'/deliver/'+(ED==='RPS-Workstation'?'RPS':'NBH')+'-Workstation.html');await sleep(1500);
  await one.evaluate(()=>openForm('IA-1'));await one.waitForFunction(()=>!!state.status['IA-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const fr=one.frames().find(f=>f!==one.mainFrame()&&f.url())||one.frames().find(f=>f!==one.mainFrame());
  const inside=fr?await fr.evaluate(()=>({audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,walk:typeof TKWALK})).catch(e=>({err:String(e)})):{none:true};
  ok('the one-file edition: IA-1 has its narration and Save as video inside',inside.audio===35&&inside.video==='object'&&inside.walk==='object',inside);
  await one.close();
  ok('no errors',errs.length===0,errs);
  console.log(fails?fails+' FAILED':'ALL PASS');await br.close();process.exit(fails?1:0);})();
