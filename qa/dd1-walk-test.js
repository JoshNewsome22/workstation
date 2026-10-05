/* v21.47 Form DD-1, the Walkthrough view (tools/forms/DD-1/walk.js, put in by patch-walk.py):
   1. The view is a fourth tab and a fourth View button; the narration and Save as video are beside the form.
   2. With the simulation it builds every scene, about 2½ to 3 minutes in five chapters; a form without duration episodes,
      skills, or phase changes leaves those scenes out; a form with no behaviors still opens (the intro and the outro).
   3. The sheet on the stage is a copy of this form's sheet, its fields turned into text, today's row written in by the pencil;
      the camera reaches the first behavior's graph and its analysis.
   4. The frames Save as video paints are the stage as shown (five moments).
   5. Leaving the view pauses it; the form's data is not changed by a build; no errors.
   usage: node qa/dd1-walk-test.js   (WS_URL as in qa/lib.js; ED=RPS-Workstation for the school's edition) */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const ED=process.env.ED||'NBH-Workstation';
const URL=BASE+'/'+ED+'/Daily_Behavior_Data_and_Visual_Analysis.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:950}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const bits=await page.evaluate(()=>({tab:!!document.querySelector('nav.nbh-tabs [data-tab="walk"]'),btn:!!document.querySelector('#viewSeg [data-view="walk"]'),sec:!!document.getElementById('tab-walk'),
    nar:!!document.querySelector('script[src="nbh-dd1-narration.js"]'),vid:!!document.querySelector('script[src="nbh-tk1-video.js"]'),audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.what}));
  ok('the Walkthrough tab, its button, the narration and Save as video are there',bits.tab&&bits.btn&&bits.sec&&bits.nar&&bits.vid&&bits.audio===15&&bits.video==='object'&&bits.info==='form',bits);
  ok('the narration file is beside the form',fs.existsSync(path.join(ROOT,ED,'nbh-dd1-narration.js')));
  /* an empty form still opens */
  const empty=await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="walk"]').click();const a=TKWALK.cues.map(c=>c.id);const keep=S.behaviors;S.behaviors=[];TKWALK.build();const b=TKWALK.cues.map(c=>c.id);S.behaviors=keep;TKWALK.build();return {a,b,rows:S.rows.length};});
  ok('a new form (no days yet) shows the sheet’s parts without the day; with no behaviors, the intro and the outro',empty.rows===0&&empty.a.join()==='intro,types,defs,units,adults,outro'&&empty.b.join()==='intro,outro',empty);
  await page.evaluate(async()=>{document.querySelector('#viewSeg [data-view="data"]').click();await loadExample();});await sleep(1000);
  const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{document.querySelectorAll('[class*=toast]').forEach(e=>e.remove());document.querySelector('#viewSeg [data-view="walk"]').click();});await sleep(1200);
  const wk=await page.evaluate(()=>{const st=document.getElementById('wkStage');return {d:TKWALK.duration,ids:TKWALK.cues.map(c=>c.id),ch:TKWALK.chapters.map(c=>c.id),view:document.body.classList.contains('view-walk'),
    inputs:st.querySelectorAll('input,select,button').length,rows:st.querySelectorAll('#wkSheet tbody tr').length,dayRows:S.rows.length,today:!!st.querySelector('tr.ddw-today'),graph:!!st.querySelector('.ddw-gpaper svg.graph'),
    vals:[...[...st.querySelectorAll('#wkSheet tbody tr')][0].cells].map(td=>td.textContent.replace(/\s+/g,' ').trim()).slice(0,5).join(' '),cards:st.querySelectorAll('.sd-card').length};});
  ok('the simulation: every scene, 2½ to 3 minutes, five chapters',wk.ids.join()==='intro,types,defs,units,day,obsmin,blankzero,episodes,percent,phase,cond,graph,analysis,adults,outro'&&wk.d>150&&wk.d<190&&wk.ch.length===5&&wk.view,wk);
  ok('the stage holds a copy of the sheet as text, with today’s row added, and the graph',wk.inputs===0&&wk.rows===wk.dayRows+1&&wk.today&&wk.graph&&/^Mon \d+\/\d+ 360 9 5 2/.test(wk.vals)&&wk.cards===6,wk);
  const after=await page.evaluate(()=>JSON.stringify(S));
  ok('building the walkthrough does not change the form’s data',before===after);
  /* the camera reaches the graph and the analysis */
  const cam=await page.evaluate(()=>{const c=TKWALK.cues;const at=id=>{const q=c.find(x=>x.id===id);TKWALK.renderAt(q.start+q.dur-.5);const st=document.getElementById('wkStage').getBoundingClientRect();
      const svg=document.querySelector('#wkStage .ddw-gpaper svg.graph').getBoundingClientRect(),mg=document.querySelector('#wkStage .ddw-gpaper .metric-grid').getBoundingClientRect();
      const inS=r=>r.top<st.bottom&&r.bottom>st.top;return {svg:inS(svg),mg:inS(mg)};};return {graph:at('graph'),analysis:at('analysis'),day:(()=>{const q=c.find(x=>x.id==='day');TKWALK.renderAt(q.start+q.dur-.2);return [...document.querySelectorAll('#wkStage .ddw-write')].filter(e=>getComputedStyle(e).visibility==='visible').length;})()};});
  ok('the camera shows the graph, then the analysis; the pencil has written today’s row',cam.graph.svg&&cam.analysis.mg&&cam.day>=8,cam);
  /* a form with no episodes, no skill, no phase changes leaves those scenes out */
  const lean=await page.evaluate(()=>{const keep=JSON.stringify(S);S.behaviors=S.behaviors.filter(b=>b.measure==='count');S.rows.forEach(r=>{r.phaseType='none';r.phaseLabel='';r.episodes={};});
    TKWALK.build();const ids=TKWALK.cues.map(c=>c.id);Object.assign(S,JSON.parse(keep));TKWALK.build();return ids;});
  ok('without episodes, skills or changes, those scenes are left out',!lean.includes('episodes')&&!lean.includes('percent')&&!lean.includes('phase')&&!lean.includes('cond')&&lean.includes('day')&&lean.includes('graph'),lean);
  /* the frames Save as video paints are the stage as shown */
  await page.evaluate(()=>[...document.body.querySelectorAll('*')].forEach(e=>{if(!e.closest('#wkPlayer')&&getComputedStyle(e).position==='fixed')e.style.display='none';}));
  for(const t of [8,60,92,132,158]){const png=await page.evaluate(async t=>(await TKVIDEO.frame(t,1280)).toDataURL('image/png'),t);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    if(!(d.mean<7&&d.worst<22)&&process.env.DD1_DUMP){fs.writeFileSync(process.env.DD1_DUMP+'/f'+t+'.png',Buffer.from(png.split(',')[1],'base64'));fs.writeFileSync(process.env.DD1_DUMP+'/s'+t+'.png',shot);}
    ok('t='+t+' s: the frame Save as video paints is the stage as shown',d.mean<7&&d.worst<22,d);}
  /* leaving the view pauses */
  const left=await page.evaluate(async()=>{TKWALK.seek(10);TKWALK.play();await new Promise(r=>setTimeout(r,400));const was=TKWALK.playing||true;document.querySelector('#viewSeg [data-view="data"]').click();await new Promise(r=>setTimeout(r,200));return {was,now:TKWALK.playing,view:document.body.classList.contains('view-data')};});
  ok('leaving the view pauses the walkthrough',!left.now&&left.view,left);
  /* the one-file edition carries the narration and Save as video inside it */
  const one=await br.newPage({viewport:{width:1300,height:950}});await one.goto(BASE+'/deliver/'+(ED==='RPS-Workstation'?'RPS':'NBH')+'-Workstation.html');await sleep(1500);
  await one.evaluate(()=>openForm('DD-1'));await one.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const fr=one.frames().find(f=>f!==one.mainFrame()&&/Daily_Behavior|DD-1|blob:|about:srcdoc/.test(f.url()+'')&&f.url())||one.frames().find(f=>f!==one.mainFrame());
  const inside=fr?await fr.evaluate(()=>({audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,walk:typeof TKWALK})).catch(e=>({err:String(e)})):{none:true};
  ok('the one-file edition: DD-1 has its narration and Save as video inside',inside.audio===15&&inside.video==='object'&&inside.walk==='object',inside);
  await one.close();
  ok('no errors',errs.length===0,errs);
  console.log(fails?fails+' FAILED':'ALL PASS');await br.close();process.exit(fails?1:0);})();
