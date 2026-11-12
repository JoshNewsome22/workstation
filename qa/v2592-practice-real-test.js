/* v25.92 (the BCBA, 11/12, asked why the people in the animated-film style could not be in the practice: they can)
   practice.html draws the real-looking scene of the explainers with a second cast (nbh-scene3d-style.js, the pair in
   the style of an animated film), and with what the practice asks of a student that the explainers never did.
   0  the second pack is in the folder and the offline list, carries its notice, names no address and no maker's label,
      and practice.html asks for it by name with no script tag;
   A  practice.html takes up the real-looking scene once the people have been read: the clay scene is hidden, the picture
      is a picture, there are no controls over it (tap is off there), and nothing was asked for outside the folder;
   B  a hand raised is a hand that shows: at "raises a hand" the student's hand is above the top of his head joint and
      beside it, well above the table; at rest both his hands are at the table;
   C  out of seat is out of the seat: at "leaves the seat" his hips are well above where they are seated, he has moved
      along, and both arms hang (his hands below the table top);
   D  calling out is a bubble of text, and so is the adult's answer to a raised hand;
   E  a face that looks ahead looks ahead: with the adult's look set straight, her head joint's forward (the face, as the
      person was made) points at the viewer's side of the room, not across it;
   F  the scene is taken up only between visits: a pack that arrives while a scene is being scored waits for its end;
   G  a scene runs to its end and is scored against its answer, as with the clay figures; the NCR practice runs too;
   H  ?clay=1 and ?flat=1 never ask for a pack; where the pack cannot be read the clay scene stays and nothing breaks;
   I  ?cast=real draws the explainers' own pair in the practice, and asks for that pack only.
   Simulated people only. usage: node qa/v2592-practice-real-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
const fs=require('fs'),path=require('path');let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),PR=L.BASE+'/NBH-Workstation/practice.html',PACK='nbh-scene3d-style.js',REALPACK='nbh-scene3d-real.js';
(async()=>{const br=await L.chromium.launch();const errs=[],outside=[];
 try{
  {const pk=fs.readFileSync(path.join(W,PACK),'utf8'),sw=fs.readFileSync(path.join(W,'sw.js'),'utf8'),pr=fs.readFileSync(path.join(W,'practice.html'),'utf8');
   ok('0 the second pack is in the folder (under 7.5 MB) and the offline list, opens with its notice (simulated people, nothing about a student, Poly Haven CC0), sets NBHSceneStyle, and names no address and no maker’s label; practice.html asks for both packs by name with no script tag',
     pk.length<7.5e6&&sw.includes(PACK)&&/^\/\* nbh-scene3d-style\.js/.test(pk)&&/simulated/.test(pk.slice(0,1200))&&/Nothing here is about a student/.test(pk.slice(0,1200))&&/Poly Haven \(CC0\)/.test(pk.slice(0,1200))&&/window\.NBHSceneStyle=\{"v":1/.test(pk)&&!/https?:\/\//.test(pk)&&!/tripo|uthana|kling|mixamo\.com/i.test(pk)
     &&/loadScript\('nbh-scene3d-style\.js'/.test(pr)&&/loadScript\('nbh-scene3d-real\.js'/.test(pr)&&!/<script[^>]+nbh-scene3d-(style|real)/.test(pr),{size:pk.length});}
  const open=async(url,opt)=>{const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));const asked=[];
    p.on('request',r=>{const u=r.url();if(u.includes(PACK)||u.includes(REALPACK))asked.push(u);if(!/^(http:\/\/127\.0\.0\.1|http:\/\/localhost|data:|blob:|about:)/.test(u))outside.push(u);});
    if(opt&&opt.route)await opt.route(p);await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.NBHPractice,null,{timeout:30000});return {p,ctx,asked};};
  const ready=p=>p.waitForFunction(()=>/ready|failed/.test(NBHPractice.get().realState),null,{timeout:90000}).then(()=>true,()=>false);
  const {p,ctx}=await open(PR);const E=f=>p.evaluate(f);
  const up=await ready(p);await sleep(300);
  const a=await E(()=>{const g=NBHPractice.get(),cast=g.cast,st=document.getElementById('prStage'),hosts=[...st.querySelectorAll('.nbh-scene3d')].map(h=>({real:h.classList.contains('nbh-scene3d-real'),shown:getComputedStyle(h).display!=='none',label:h.getAttribute('aria-label')}));
    return {real:g.real,cast,state:g.realState,hosts,tabs:[...st.querySelectorAll('.ns-part')].filter(b=>b.tabIndex===0||b.getAttribute('role')||getComputedStyle(b).pointerEvents!=='none').length};});
  await E(()=>{document.getElementById('prVeil').hidden=true;NBHPractice.show(0.2);});await sleep(200);
  const shot=(await p.locator('#prStage .nbh-scene3d-real canvas').screenshot({type:'png'})).length;
  ok('A practice.html takes up the real-looking scene once the people are read: one scene shows and it is the real-looking one, named as simulated people, a picture and not a blank, no controls over it, and nothing asked for outside the folder',
    up&&a.real&&a.cast==='style'&&a.state==='ready'&&a.hosts.length===2&&a.hosts.filter(h=>h.shown).length===1&&a.hosts.find(h=>h.shown).real&&/simulated/.test(a.hosts.find(h=>h.shown).label||'')&&a.tabs===0&&shot>60000&&!outside.length,{a,shot,outside:outside.slice(0,3)});
  /* the student's joints, in the room's measure (metres; the table top is at 0.775) */
  const body=()=>E(()=>{const s=NBHPractice.scene(),T=s.three.THREE,o={hands:[]};s.three.scene.traverse(n=>{if(!n.isBone)return;const w=n.getWorldPosition(new T.Vector3());if(w.x<0)return;
      const nm=n.name.replace(/[^A-Za-z0-9]/g,'');if(/(Left|Right)HandMiddle1$/.test(nm))o.hands.push([+w.x.toFixed(3),+w.y.toFixed(3)]);else if(/Head$/.test(nm))o.head=[+w.x.toFixed(3),+w.y.toFixed(3)];else if(/Hips$/.test(nm))o.hips=[+w.x.toFixed(3),+w.y.toFixed(3)];});
    o.hands.sort((x,y)=>y[1]-x[1]);return o;});
  await E(()=>NBHPractice.set({mode:'count',seed:4242,len:120}));await E(()=>{document.getElementById('prVeil').hidden=true;});
  const ev=await E(()=>NBHPractice.get().EV.map(e=>[e.k,e.t,e.dur||0,e.say||'']));const at=k=>ev.find(e=>e[0]===k);
  const bub=()=>E(()=>[...document.querySelectorAll('#prStage .nbh-scene3d-real .ns3-bubble')].filter(b=>b.style.display!=='none').map(b=>[b.dataset.who,b.textContent]));
  await E(()=>NBHPractice.show(0.2));const b0=await body();
  const hand=at('hand');await p.evaluate(t=>NBHPractice.show(t),hand[1]+hand[2]*.5);const b1=await body();
  ok('B a hand raised shows: at rest both of the student’s hands are at the table; when he raises a hand, one hand is above his head joint, off to its side, and at least 35 cm above the table',
    b0.hands.every(h=>h[1]<.95)&&b1.hands[0][1]>b1.head[1]+.02&&Math.abs(b1.hands[0][0]-b1.head[0])>.05&&b1.hands[0][1]>.775+.35&&b1.hands[1][1]<.95,{b0,b1});
  const u=at('up');await p.evaluate(t=>NBHPractice.show(t),u[1]+u[2]*.5);const b2=await body();
  ok('C out of seat: his hips are at least 12 cm higher than seated, he has moved along the table, and both arms hang with the hands below the table top',
    b2.hips[1]>b0.hips[1]+.12&&b2.hips[0]>b0.hips[0]+.15&&b2.hands.every(h=>h[1]<.775),{seated:b0.hips,standing:b2.hips,hands:b2.hands});
  const c=at('call');await p.evaluate(t=>NBHPractice.show(t),c[1]+Math.min(.5,c[2]*.5));const s1=await bub();
  const cd=at('called');await p.evaluate(t=>NBHPractice.show(t),cd[1]+1.6);const s2=await bub();
  ok('D calling out is a bubble with what he says; the adult’s answer to a raised hand is a bubble too',s1.length===1&&s1[0][0]==='student'&&s1[0][1]===c[3]&&s2.some(b=>b[0]==='adult'&&b[1]==='Yes?'),{s1,s2,call:c});
  /* her face: the head joint's forward as she was made, carried by how the joint has turned since */
  const face=await E(()=>{const s=NBHPractice.scene(),T=s.three.THREE;let head=null;s.three.scene.traverse(n=>{if(n.isBone&&/Head$/.test(n.name.replace(/[^A-Za-z0-9]/g,''))&&n.getWorldPosition(new T.Vector3()).x<0)head=n;});
    const fwd=()=>{const d=new T.Vector3(0,0,1).applyQuaternion(head.getWorldQuaternion(new T.Quaternion()));return [+d.x.toFixed(3),+d.y.toFixed(3),+d.z.toFixed(3)];};
    const set=l=>s.set({papers:{show:true},sheet:{show:true},adult:{look:l},student:{}});set([0,0]);const ahead=fwd();set([-1,0]);const away=fwd();set([0,.95]);const down=fwd();return {ahead,away,down};});
  ok('E the adult’s face follows the look: straight ahead it points to the viewer’s side of the room (not across it), to her right it turns that way, and down it tips down with the face still toward the viewer',
    face.ahead[2]>.9&&Math.abs(face.ahead[0])<.3&&face.away[0]<face.ahead[0]-.3&&face.down[1]<face.ahead[1]-.2&&face.down[2]>.5,face);
  await ctx.close();
  /* F: the pack held back until a scene is running */
  {let release=null;const gate=new Promise(r=>{release=r;});
   const o=await open(PR,{route:async pg=>{await pg.route('**/'+PACK,async r=>{await gate;await r.continue();});}});const q=o.p;
   await q.evaluate(()=>{window.__prFast=1;window.__prSpeed=4;NBHPractice.set({mode:'count',seed:4242,len:60,pace:'class'});});await q.click('#prStart');
   await q.waitForFunction(()=>NBHPractice.get().phase==='run',null,{timeout:20000});release();
   const waited=await q.waitForFunction(()=>NBHPractice.get().realState==='waiting',null,{timeout:90000}).then(()=>true,()=>false);const f1=await q.evaluate(()=>{const g=NBHPractice.get();return {phase:g.phase,real:g.real,state:g.realState};});
   await q.evaluate(()=>{window.__prSpeed=30;});await q.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:60000}).catch(()=>{});await sleep(300);
   const f2=await q.evaluate(()=>{const g=NBHPractice.get(),r=document.getElementById('prResult');return {phase:g.phase,real:g.real,state:g.realState,shown:!!r&&!r.hidden,text:r?r.textContent.slice(0,120):''};});
   ok('F a pack that arrives while a scene is being scored waits: the clay scene stays to the end of the visit, then the real-looking one is taken up; G the visit is scored as before',
     waited&&f1.phase==='run'&&!f1.real&&f2.phase==='done'&&f2.real&&f2.state==='ready'&&f2.shown&&/\d/.test(f2.text),{waited,f1,f2});
   await q.evaluate(()=>{window.__prSpeed=30;NBHPractice.set({mode:'ncr',seed:4242,len:60});});await q.click('#prStart');await sleep(600);
   const n1=await q.evaluate(()=>{const g=NBHPractice.get();return {phase:g.phase,real:g.real};});await q.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:60000}).catch(()=>{});
   const n2=await q.evaluate(()=>{const g=NBHPractice.get(),r=document.getElementById('prResult');return {phase:g.phase,real:g.real,shown:!!r&&!r.hidden};});
   ok('G the NCR practice ("you are the adult") runs in the real-looking scene to its end and shows its result',n1.real&&n2.phase==='done'&&n2.real&&n2.shown,{n1,n2});
   await o.ctx.close();}
  /* H */
  {const h=[];
   for(const [nm,url,opt] of [['clay',PR+'?clay=1'],['flat',PR+'?flat=1'],['blocked',PR,{route:async pg=>{await pg.route('**/'+PACK,r=>r.abort());}}]]){
     const o=await open(url,opt);if(nm==='blocked')await ready(o.p);else await sleep(1500);
     await o.p.evaluate(()=>{window.__prFast=1;window.__prSpeed=30;NBHPractice.set({mode:'count',seed:4242,len:60});});await o.p.click('#prStart');await o.p.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:60000}).catch(()=>{});
     h.push(Object.assign({nm,asked:o.asked.length},await o.p.evaluate(()=>{const g=NBHPractice.get(),st=document.getElementById('prStage');return {real:g.real,state:g.realState,phase:g.phase,svg:!!st.querySelector('svg'),hosts:st.querySelectorAll('.nbh-scene3d').length};})));await o.ctx.close();}
   ok('H ?clay=1 and ?flat=1 never ask for a pack (the clay scene, the flat drawing); where the pack cannot be read the clay scene stays; a visit runs to its end in each',
     h[0].asked===0&&!h[0].real&&h[0].state===''&&h[0].phase==='done'&&!h[0].svg&&h[1].asked===0&&!h[1].real&&h[1].svg&&h[1].phase==='done'&&h[2].asked>0&&!h[2].real&&h[2].state==='failed'&&h[2].phase==='done'&&h[2].hosts===1,h);}
  {const o=await open(PR+'?cast=real');const up2=await ready(o.p);const g=await o.p.evaluate(()=>{const g=NBHPractice.get();return {real:g.real,cast:g.cast,state:g.realState,style:!!window.NBHSceneStyle,own:!!window.NBHSceneReal};});
   ok('I ?cast=real draws the explainers’ own pair in the practice and asks for that pack only',up2&&g.real&&g.cast==='real'&&g.state==='ready'&&g.own&&!g.style&&o.asked.length===1&&o.asked[0].includes(REALPACK),{g,asked:o.asked});await o.ctx.close();}
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
