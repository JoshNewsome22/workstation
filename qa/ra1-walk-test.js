/* v21.60 Form RA-1, the Walkthrough video with hands (tools/forms/RA-1/walk.js, put in by patch-walk.py):
   1. The view's section is at the top of the Walkthrough sheet (shown by body.view-walk); the narration and Save as video are beside the form.
   2. The build is the worked example whatever the form holds (16 lines, 6 chapters, about five minutes), with no field on the stage;
      the form's state is exactly as it was after the build (the example is put in and taken out in one turn).
   3. The hands: the student's hand carries blocks into the bin (the blocks lie in the bin after a session's placements); the assessor's hand
      delivers the tablet during the stimulus session and takes it away.
   4. The session panel: the control session ends at 12 responses, 2.4 a minute; the tablet session at 58 and 11.6, with the clock paused
      during an access; the praise session at 13; the allocation ends 34, 9, 1; the progressive-ratio session breaks at FR 15.
   5. The sheet copies carry the example's verdicts (Clear, Clear, None; Preferred, Lower, Not chosen; High, High, Low; Confirmed,
      Confirmed, Not supported), the echoes filled, and the camera reaches each of them.
   6. The old drawn stories and the job aids are still there; captions and chapters for YouTube; the frames Save as video paints.
   7. Leaving the view pauses; the link to the recorded version is a data-meta field; no errors.
   usage: node qa/ra1-walk-test.js   (WS_URL as in qa/lib.js; ED=RPS-Workstation for the school's edition) */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const ED=process.env.ED||'NBH-Workstation';
const URL=BASE+'/'+ED+'/Reinforcer_Assessment_Protocol.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i):''));if(!c)fails++;};
const IDS='intro,response,control,reinforce,effect,sheet,praise,co_setup,co_run,co_read,pr_run,pr_read,rules,runner,summary,outro';
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:950}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;if(window.nbhUI)nbhUI.confirm=async()=>true;});
  const bits=await page.evaluate(()=>({btn:!!document.querySelector('#viewSeg [data-view="walk"]'),sec:!!document.getElementById('wkSec'),inWalk:!!document.querySelector('#walk #wkSec'),first:document.getElementById('walk').firstElementChild&&document.getElementById('walk').firstElementChild.id,hidden:getComputedStyle(document.getElementById('walk')).display==='none',
    nar:!!document.querySelector('script[src="nbh-ra1-narration.js"]'),vid:!!document.querySelector('script[src="nbh-tk1-video.js"]'),audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.what,priv:!!(window.NBH_WALK_INFO&&NBH_WALK_INFO.priv),
    link:!!document.querySelector('#wkSec input[data-meta="walkVideo"]'),stories:document.querySelectorAll('#walk .story[data-story]').length,aids:!!document.getElementById('wk-aids'),guide:/Walkthrough video/.test(document.getElementById('guide').textContent)}));
  ok('the section at the top of the Walkthrough sheet (hidden until chosen), the narration (16 lines) and Save as video beside the form, the link field, the old stories and job aids, the Guide note',
    bits.btn&&bits.sec&&bits.inWalk&&bits.first==='wkSec'&&bits.hidden&&bits.nar&&bits.vid&&bits.audio===16&&bits.video==='object'&&bits.info==='form'&&bits.priv&&bits.link&&bits.stories===6&&bits.aids&&bits.guide,bits);
  ok('the narration file is beside the form',fs.existsSync(path.join(ROOT,ED,'nbh-ra1-narration.js')));
  /* the form's state before and after the build: nothing entered, then the simulation */
  const state=()=>page.evaluate(()=>JSON.stringify([...document.querySelectorAll('#setup input,#setup select,#so input,#so select,#co input,#co select,#pr input,#pr select,#summary input,#summary select,[data-meta]')].map(e=>e.type==='checkbox'?e.checked:e.value))+'|'+document.getElementById('soReadout').textContent+'|'+document.querySelector('#summary .echo-client').textContent);
  const before=await state();
  await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="walk"]').click();});await sleep(900);
  const wk=await page.evaluate(()=>{const st=document.getElementById('wkStage');return {d:TKWALK.duration,ids:TKWALK.cues.map(c=>c.id),ch:TKWALK.chapters.map(c=>c.id),view:document.body.className,ex:TKWALK.example,shown:getComputedStyle(document.getElementById('walk')).display,
    inputs:st.querySelectorAll('input,select,textarea,button').length,papers:st.querySelectorAll('.raw-paper').length,hands:st.querySelectorAll('.raw-hand').length,poses:st.querySelectorAll('.raw-hand .wk-pose svg').length,blocks:st.querySelectorAll('.raw-blk').length,note:document.getElementById('wkNote').textContent,
    so:[...st.querySelectorAll('.raw-so table.rank tbody tr')].map(r=>r.cells[r.cells.length-1].textContent.trim()),co:[...st.querySelectorAll('.raw-co table.rank tbody tr')].map(r=>r.cells[6].textContent.trim()),
    pr:[...st.querySelectorAll('.raw-pr table.rank tbody tr')].map(r=>r.cells[1].textContent.trim()+':'+r.cells[8].textContent.trim()),sum:[...st.querySelectorAll('.raw-sum table.rank tbody tr')].map(r=>r.cells[8].textContent.trim()),
    echo:(st.querySelector('.raw-sum .raw-echo-client')||{}).textContent,run:!!st.querySelector('.raw-run .ra-run'),runClock:(st.querySelector('.raw-run .ra-run-big')||{}).textContent,formReadout:document.getElementById('soReadout').textContent};});
  ok('an empty form: the worked example, sixteen lines in six chapters, about five minutes; no field on the stage; five papers; two hands of three poses; blocks',
    wk.ids.join()===IDS&&wk.ch.join()==='why,so,co,pr,table,result'&&wk.d>270&&wk.d<330&&wk.view==='view-walk'&&wk.ex&&wk.shown==='block'&&wk.inputs===0&&wk.papers===5&&wk.hands===2&&wk.poses===6&&wk.blocks===44&&/worked example/.test(wk.note),wk);
  ok('the sheet copies carry the example\'s verdicts, the echoes, the runner part way through a session',
    wk.so.join()===',Clear,Clear,None'&&wk.co.join()==='Preferred,Lower,Not chosen'&&wk.pr.join()==='Tablet (video):High,Fruit chew:High,Control:,Praise + high five:Low'&&wk.sum.join()==='Confirmed,Confirmed,Not supported'&&/SIMULATED/.test(wk.echo)&&wk.run&&wk.runClock==='3:48'&&wk.formReadout==='No sessions scored yet.',wk);
  ok('the form\'s state is exactly as it was after the build',before===(await state()));
  /* the panel and the hands through the sessions: a pure function of t */
  const at=(id,frac)=>page.evaluate(([id,frac])=>{const c=TKWALK.cues.find(x=>x.id===id);const t=c.start+c.dur*frac;TKWALK.renderAt(t);const st=document.getElementById('wkStage');const q=s=>st.querySelector(s);const tx=s=>(q(s)||{}).textContent||'';
    const vis=e=>e&&getComputedStyle(e).visibility==='visible'&&+getComputedStyle(e).opacity>.5;const sr=st.getBoundingClientRect(),k=sr.width/1280;
    const inBin=[...st.querySelectorAll('.raw-blk')].filter(e=>{const r=e.getBoundingClientRect();const x=(r.left+r.width/2-sr.left)/k,y=(r.top+r.height/2-sr.top)/k;return vis(e)&&x>460&&x<630&&y>345&&y<515;}).length;
    const tabR=q('.raw-fc[data-card="tablet"]').getBoundingClientRect();const tab={x:(tabR.left+tabR.width/2-sr.left)/k,y:(tabR.top+tabR.height/2-sr.top)/k};
    const hand=who=>{const p=[...st.querySelectorAll('.raw-hand.wk-'+who+' .wk-pose')].find(vis);if(!p)return null;const r=p.getBoundingClientRect();const o={x:(r.left-sr.left)/k,y:(r.top-sr.top)/k,w:r.width/k,h:r.height/k};return o.y<720&&o.y+o.h>0&&o.x<1280&&o.x+o.w>0?o:null;};   /* in the frame */
    return{t,cond:tx('.raw-cond'),left:tx('.raw-left'),state:tx('.raw-state'),n:tx('.raw-n'),rate:tx('.raw-rate'),acc:vis(q('.raw-acc')),acct:tx('.raw-acct'),panel:vis(q('.raw-panel')),inBin,tab,HL:hand('learner'),HT:hand('teacher'),
      co:[...st.querySelectorAll('.raw-cocnt')].map(e=>e.textContent),pct:[...st.querySelectorAll('.raw-copct')].map(e=>e.textContent),done:st.querySelectorAll('.raw-fr.done').length,bp:tx('.raw-prbpv'),stop:tx('.raw-prst'),cap:tx('.wk-cap'),world:vis(q('.raw-worldwrap'))};},[id,frac]);
  const c1=await at('control',.99),r2=await at('reinforce',.99),p1=await at('praise',.99),co=await at('co_run',.99),pr=await at('pr_run',.99),sh=await at('sheet',.5),rs=await at('response',.5);
  let r1=null;for(const f of [.15,.2,.25,.3,.35,.4,.45,.5,.55,.6]){const x=await at('reinforce',f);if(x.acc){r1=x;break;}}r1=r1||await at('reinforce',.3);
  ok('the control session ends at 12 responses, 2.4 a minute, the clock at 0:00; the panel is shown; its blocks lie in the bin',c1.cond==='Control'&&c1.n==='12'&&c1.rate==='2.4'&&c1.left==='0:00'&&c1.state==='session over'&&c1.panel&&c1.inBin===3,c1);
  ok('the tablet session: during an access the clock is paused, the ring counts the 20 s, the tablet lies on the mat and both hands are in the frame; it ends at 58 responses, 11.6 a minute',
    r1.cond==='Tablet (video)'&&r1.state==='paused'&&r1.acc&&/\d+ s/.test(r1.acct)&&Math.abs(r1.tab.x-545)<30&&Math.abs(r1.tab.y-232)<30&&r1.HL&&r1.HT&&r2.n==='58'&&r2.rate==='11.6'&&r2.state==='session over'&&Math.abs(r2.tab.y-80)<30,{r1,r2});
  ok('the praise session ends at 13 responses; the allocation ends 34, 9, 1 (77%, 20%, 2%); the progressive ratio breaks at FR 15 after eight ratios and the stop interval',
    p1.n==='13'&&p1.rate==='2.6'&&co.co.join()==='34,9,1'&&co.pct.join()==='77%,20%,2%'&&pr.done===8&&pr.bp==='FR 15'&&pr.stop==='0 s',{p1,co:co.co,pct:co.pct,pr:{done:pr.done,bp:pr.bp,stop:pr.stop}});
  ok('the response scene: the student\'s hand is in the frame, a block in the bin, the panel still hidden; the sheet scene shows the papers over the table and no hand',rs.HL&&rs.inBin>=1&&!rs.panel&&sh.world&&!sh.HL&&!sh.HT&&/row on the sheet|graph plots|verdict|clear effect|visual analysis/.test(sh.cap),{rs:{HL:!!rs.HL,inBin:rs.inBin,panel:rs.panel},sh:{world:sh.world,HL:!!sh.HL,cap:sh.cap}});
  /* the camera reaches each paper */
  const cam=await page.evaluate(()=>{const c=TKWALK.cues;const st=document.getElementById('wkStage');const inS=el=>{if(!el)return false;const r=el.getBoundingClientRect(),s=st.getBoundingClientRect();return r.top<s.bottom&&r.bottom>s.top&&r.left<s.right&&r.right>s.left;};
    const at=(id,sel,frac)=>{const q=c.find(x=>x.id===id);TKWALK.renderAt(q.start+q.dur*(frac==null?.6:frac));return inS(st.querySelector(sel));};
    return{so:at('sheet','.raw-so table.rank'),co:at('co_read','.raw-co table.rank'),pr:at('pr_read','.raw-pr table.rank'),run:at('runner','.raw-run .ra-run'),sum:at('summary','.raw-sum table.rank')};});
  ok('the camera reaches the single-operant rank table, the allocation table, the break-point table, the runner and the summary',cam.so&&cam.co&&cam.pr&&cam.run&&cam.sum,cam);
  /* captions and chapters for YouTube */
  const cc=await page.evaluate(()=>{const c=TKWALK.captions(),ch=TKWALK.chapterList().split('\n');return {n:c.length,first:c[0],ordered:c.every((x,i)=>!i||x.a>=c[i-1].a),within:c.every(x=>x.b>x.a&&x.b-x.a<30),ch,decimal:c.some(x=>/2\.4|11\.6/.test(x.text))};});
  ok('captions: one per caption piece in order, each a few seconds, from 0, decimals kept whole; the chapters list starts at 0:00 with six lines',cc.n>40&&cc.first.a===0&&cc.ordered&&cc.within&&cc.ch.length===6&&/^0:00 Why test$/.test(cc.ch[0])&&/^\d+:\d\d The result$/.test(cc.ch[5]),cc);
  /* the frames Save as video paints are the stage as shown (the hands, the panel, the papers, the cards): five moments */
  await page.evaluate(()=>[...document.body.querySelectorAll('*')].forEach(e=>{if(!e.closest('#wkPlayer')&&getComputedStyle(e).position==='fixed')e.style.display='none';}));
  for(const t of [10,62,100,160,275]){const png=await page.evaluate(async t=>(await TKVIDEO.frame(t,1280)).toDataURL('image/png'),t);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    if(!(d.mean<7&&d.worst<22)&&process.env.RA1_DUMP){fs.writeFileSync(process.env.RA1_DUMP+'/f'+t+'.png',Buffer.from(png.split(',')[1],'base64'));fs.writeFileSync(process.env.RA1_DUMP+'/s'+t+'.png',shot);}
    ok('t='+t+' s: the frame Save as video paints is the stage as shown',d.mean<7&&d.worst<22,d);}
  /* leaving the view pauses; the link field */
  const lv=await page.evaluate(async()=>{TKWALK.seek(3);TKWALK.play();await new Promise(r=>setTimeout(r,700));const was=TKWALK.playing;document.querySelector('#viewSeg [data-view="so"]').click();await new Promise(r=>setTimeout(r,200));
    const i=document.getElementById('walkVideo');i.value='https://youtu.be/abc';i.dispatchEvent(new Event('input'));await new Promise(r=>setTimeout(r,100));
    return{was,now:TKWALK.playing,view:document.body.className,open:!document.getElementById('walkVideoOpen').hidden};});
  ok('leaving the view pauses the walkthrough; the link field opens its link',lv.was&&!lv.now&&lv.view==='view-so'&&lv.open,lv);
  /* the one-file edition carries the narration and Save as video inside it */
  const one=await br.newPage({viewport:{width:1300,height:950}});await one.goto(BASE+'/deliver/'+(ED==='RPS-Workstation'?'RPS':'NBH')+'-Workstation.html');await sleep(1500);
  await one.evaluate(()=>openForm('RA-1'));await one.waitForFunction(()=>!!state.status['RA-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const fr=one.frames().find(f=>f!==one.mainFrame()&&f.url())||one.frames().find(f=>f!==one.mainFrame());
  const inside=fr?await fr.evaluate(()=>({audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,walk:typeof TKWALK})).catch(e=>({err:String(e)})):{none:true};
  ok('the one-file edition: the narration (16 lines) and Save as video are inside it, the walkthrough built in',inside.audio===16&&inside.video==='object'&&inside.walk==='object',inside);
  await one.close();
  ok('no errors',!errs.length,errs.slice(0,5));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
