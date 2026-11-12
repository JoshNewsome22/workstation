/* v25.90 (the BCBA, 11/12: real-looking people in the explainers, "starting with the FCT thinning one as a trial")
   the real-looking scene: simulated people with skeletons in a classroom of real-looking things (nbh-scene3d.js,
   createReal) drawn from a pack carried as one script (nbh-scene3d-real.js). v25.90 used it for the FCT explainer only;
   v25.91 (the BCBA, 11/12: "Go with your recommendations") for DRO and NCR as well, with fingers that close.
   0  the pack is in the folder and the offline list, carries its notice, names no address, and the page asks for it by
      name only when an explainer that uses it is opened; the page says the people are simulated;
   A  explain.html#fct draws the real-looking scene once the people have been read: the clay scene is hidden, the
      picture is a picture, and nothing was asked for outside the folder;
   B  every part that shows has a real control: a name, a role, a tab stop, at least 44 px each way, inside the picture;
      the timer's and the signal's controls carry what they show, and that agrees with the page's own line;
   C  a tap on a part and Enter on a part say what the part is for and mark it;
   D  speech is a bubble of text over the picture;
   E  the picture is a function of the moment: going away and coming back puts every control where it was;
   F  the people move with the procedure: his arm goes to the card when he asks, hers to the signal when it changes;
   G  DRO and NCR draw the real-looking scene too, each with its own parts; the pack is read once for all three;
   H  ?clay=1 and ?flat=1 never ask for the pack; where the pack cannot be read the clay scene stays and nothing breaks;
   I  opened from a folder (no server) the real-looking scene still draws;
   J  a phone's width: the picture fits and nothing is wider than the screen;
   K  a moment is drawn quickly enough to scrub.
   Simulated people only. usage: node qa/v2590-real-scene-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),EX=L.BASE+'/NBH-Workstation/explain.html',PACK='nbh-scene3d-real.js';
(async()=>{const br=await L.chromium.launch();const errs=[],outside=[];
 try{
  const pk=fs.readFileSync(path.join(W,PACK),'utf8'),sw=fs.readFileSync(path.join(W,'sw.js'),'utf8'),ex=fs.readFileSync(path.join(W,'explain.html'),'utf8'),js=fs.readFileSync(path.join(W,'nbh-scene3d.js'),'utf8'),pr=fs.readFileSync(path.join(W,'practice.html'),'utf8');
  const head=pk.slice(0,pk.indexOf('window.NBHSceneReal='));
  ok('0a the pack is in the folder and the offline list, under 9 MB, with its notice (simulated people, nothing about a student, Poly Haven CC0), and it names no address',
    sw.includes("'"+PACK+"'")&&pk.length<9e6&&/simulated/.test(head)&&/no real person/.test(head)&&/Nothing here is about a student/.test(head)&&/Poly Haven \(CC0\)/.test(head)&&!/https?:\/\//.test(pk),{len:pk.length,head:head.slice(0,200)});
  ok('0b explain.html asks for the pack by name, with no script tag for it (it is read only when an explainer that uses it is opened); practice.html does not name it; the scene script offers createReal',
    /loadScript\('nbh-scene3d-real\.js'/.test(ex)&&!/<script[^>]+nbh-scene3d-real/.test(ex)&&!pr.includes(PACK)&&/createReal/.test(js)&&/REAL=\{fct:1,dro:1,ncr:1\}/.test(ex));
  ok('0c the page says the people are simulated, and its words fit the student shown (he asks, his card)',/The people are simulated, not real people/.test(ex)&&/He asks now \(touches his card\)/.test(ex)&&!/She asks/.test(ex));

  const ctx=await br.newContext({viewport:{width:1180,height:860},serviceWorkers:'block'});
  const p=await ctx.newPage();const asked=[];p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{const u=r.url();asked.push(u);if(!u.startsWith(L.BASE)&&!u.startsWith('data:')&&!u.startsWith('blob:'))outside.push(u);});
  await p.emulateMedia({reducedMotion:'reduce'});
  const E=(f,a)=>p.evaluate(f,a);
  const ready=pg=>pg.waitForFunction(()=>window.NBHExplain&&/^(ready|failed)$/.test(NBHExplain.get().realState),null,{timeout:90000}).then(()=>true,()=>false);
  await p.goto(EX+'#fct');const got=await ready(p);await sleep(300);
  const seek=t=>E(t=>{NBHExplain.seek(t);},t);
  const facts=()=>E(()=>{const g=NBHExplain.get(),R=document.querySelector('#exStage .nbh-scene3d-real'),C=document.querySelector('#exStage .nbh-scene3d:not(.nbh-scene3d-real)'),st=document.querySelector('#exStage').getBoundingClientRect();
    const parts={};if(R)[...R.querySelectorAll('.ns-part')].forEach(b=>{if(b.style.display==='none')return;const r=b.getBoundingClientRect();parts[b.dataset.part]={x:Math.round(r.left-st.left),y:Math.round(r.top-st.top),w:Math.round(r.width),h:Math.round(r.height),role:b.getAttribute('role'),tab:b.tabIndex,name:b.getAttribute('aria-label'),val:b.firstChild&&b.firstChild.textContent||'',inside:r.left>=st.left-1&&r.right<=st.right+1&&r.top>=st.top-1&&r.bottom<=st.bottom+1};});
    return {cur:g.cur,real:g.real,state:g.realState,realShown:!!R&&R.style.display!=='none',clayShown:!!C&&C.style.display!=='none',label:R&&R.getAttribute('aria-label'),role:R&&R.getAttribute('role'),parts,step:document.querySelector('#exStep').textContent,now:document.querySelector('#exNow').textContent,
      bubble:[...document.querySelectorAll('#exStage .nbh-scene3d-real .ns3-bubble')].filter(b=>b.style.display!=='none').map(b=>b.dataset.who+': '+b.textContent).join(' | '),partText:document.querySelector('#exPart').textContent,on:R?[...R.querySelectorAll('.ns-part.on')].map(b=>b.dataset.part).join(','):''};});
  /* the picture, read back: how many different colours, and how much of it is one colour */
  const picture=()=>E(()=>{const c=document.querySelector('#exStage .nbh-scene3d-real canvas');NBHExplain.scene().redraw();const o=document.createElement('canvas');o.width=160;o.height=90;const x=o.getContext('2d');x.drawImage(c,0,0,160,90);const d=x.getImageData(0,0,160,90).data,seen={};let top=0;
    for(let i=0;i<d.length;i+=4){const key=(d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4);seen[key]=(seen[key]||0)+1;if(seen[key]>top)top=seen[key];}return {colours:Object.keys(seen).length,most:top/(160*90)};});
  await seek(2);const a=await facts(),pic=await picture();
  ok('A the pack is asked for once, the people are read, and the real-looking scene is on show with the clay one hidden: a named picture of many colours',
    got&&a.state==='ready'&&a.real&&a.realShown&&!a.clayShown&&a.role==='img'&&/simulated adult and student/.test(a.label||'')&&pic.colours>150&&pic.most<.5&&asked.filter(u=>u.includes('nbh-scene3d-real')).length===1,{a:{state:a.state,real:a.real,realShown:a.realShown,clayShown:a.clayShown,label:a.label},pic});
  const need=['adult','student','signal','timer','papers','sheet','card'],bad=need.filter(k=>{const q=a.parts[k];return !q||q.w<44||q.h<44||!q.inside||q.role!=='button'||q.tab!==0||!q.name;});
  await seek(53);const red=await facts();
  ok('B at a moment on green the adult, the student, the signal, the timer, her papers, his picture and the request card each have a control (a name, a button, a tab stop, 44 px or more, inside the picture); the timer’s control carries the time on the page’s line and the signal’s its colour, on green and on red',
    !bad.length&&!a.parts.item&&!a.parts.tokens&&a.parts.signal.val==='green'&&a.step.includes(a.parts.timer.val)&&/^Green/.test(a.step)&&red.parts.signal.val==='red'&&red.step.includes(red.parts.timer.val)&&/^Red/.test(red.step),{bad,parts:a.parts,step:a.step,redStep:red.step,redSig:red.parts.signal,redTimer:red.parts.timer});
  await p.click('#exStage .nbh-scene3d-real [data-part="signal"]');await sleep(150);const c1=await facts();
  await p.focus('#exStage .nbh-scene3d-real [data-part="card"]');await p.keyboard.press('Enter');await sleep(150);const c2=await facts();
  ok('C a tap on the signal and Enter on the request card each mark the part and say what it is for',c1.on==='signal'&&/^The signal/.test(c1.partText)&&c2.on==='card'&&/^The request card/.test(c2.partText),{c1:[c1.on,c1.partText.slice(0,60)],c2:[c2.on,c2.partText.slice(0,60)]});
  await seek(6);const d=await facts();
  ok('D what the adult says is a bubble of text over the picture',/^adult: Hi! Tell me about your picture\.$/.test(d.bubble),d.bubble);
  await seek(55.6);const e1=await facts();await seek(20);await seek(120);await seek(55.6);const e2=await facts();
  const moved=Object.keys(e1.parts).filter(k=>{const u=e1.parts[k],w=e2.parts[k];return !w||Math.abs(u.x-w.x)>1||Math.abs(u.y-w.y)>1||Math.abs(u.w-w.w)>1||Math.abs(u.h-w.h)>1;});
  ok('E the picture is a function of the moment: after going to two other moments and back, every control is where it was',Object.keys(e1.parts).length>=7&&!moved.length,{moved,e1:e1.parts,e2:e2.parts});
  /* where the hands are, on the picture: the knuckles of each hand, carried to the screen */
  const hands=()=>E(()=>{const s=NBHExplain.scene(),T=s.three.THREE,cam=s.three.cam,out={};s.three.scene.traverse(n=>{if(n.isBone&&/(Left|Right)HandMiddle1$/.test(n.name)){const w=n.getWorldPosition(new T.Vector3()),q=w.clone().project(cam);(out[w.x<0?'adult':'student']=out[w.x<0?'adult':'student']||[]).push({x:+w.x.toFixed(3),y:+w.y.toFixed(3),z:+w.z.toFixed(3),sx:+q.x.toFixed(3)});}});return out;});
  await seek(2);const h0=await hands();await seek(55.6);const h1=await hands();await seek(49.9);const h2=await hands();
  const minX=a2=>Math.min.apply(null,a2.map(q=>q.x)),maxY=a2=>Math.max.apply(null,a2.map(q=>q.y));
  ok('F the people move with the procedure: when he asks, his nearer hand goes toward the middle of the table (to his card); when the signal changes, one of her hands is up at the signal card, well above the table',
    h0.student&&h0.student.length===2&&h0.adult.length===2&&minX(h1.student)<minX(h0.student)-.06&&minX(h1.student)<.34&&maxY(h2.adult)>maxY(h0.adult)+.12,{h0,h1,h2});
  await p.click('[data-pick="dro"]');await sleep(400);await seek(5);const g1=await facts(),gh0=await hands();await seek(26.6);const g1b=await facts(),gh1=await hands();
  await p.click('[data-pick="ncr"]');await sleep(400);await seek(62);const g2=await facts();await p.click('[data-pick="fct"]');await sleep(300);const g3=await facts();
  const minZ=a2=>Math.min.apply(null,a2.map(q=>q.z)),gp=g1.parts;
  ok('G DRO draws the real-looking scene with its own parts (the sign, the timer, her papers, his work; no signal, no card), and at problem behavior his hands pull back from the work and what he says is a bubble; NCR draws it too, with her comment after the buzz as a bubble; FCT comes back at once, and the pack was read once for all three',
    g1.cur==='dro'&&g1.realShown&&!g1.clayShown&&!!gp.note&&!!gp.timer&&!!gp.papers&&!!gp.sheet&&!gp.signal&&!gp.card&&/^student: No!$/.test(g1b.bubble)&&minZ(gh1.student)<minZ(gh0.student)-.08&&g2.cur==='ncr'&&g2.realShown&&!g2.clayShown&&/^adult: \(Name\)/.test(g2.bubble)&&g3.cur==='fct'&&g3.realShown&&!g3.clayShown&&asked.filter(u=>u.includes('nbh-scene3d-real')).length===1,
    {g1:[g1.realShown,g1.clayShown,Object.keys(gp).join(',')],g1b:g1b.bubble,z:[minZ(gh0.student),minZ(gh1.student)],g2:[g2.realShown,g2.bubble],g3:[g3.realShown,g3.clayShown]});
  /* K speed */
  const times=await E(()=>{const ts=[];for(let i=0;i<24;i++){const t0=performance.now();NBHExplain.seek(3+i*5.3);ts.push(performance.now()-t0);}ts.sort((x,y)=>x-y);return {median:Math.round(ts[12]),worst:Math.round(ts[23])};});
  ok('K a moment is drawn quickly enough to scrub (median under 200 ms, worst under 800 ms, drawing in software here)',times.median<200&&times.worst<800,times);
  await ctx.close();

  /* H: clay asked for, flat asked for, and a pack that cannot be read */
  const one=async(url,opt)=>{const c=await br.newContext({viewport:{width:(opt&&opt.w)||1180,height:860},serviceWorkers:'block'});const q=await c.newPage();const er=[],rq=[];q.on('pageerror',e=>er.push(e.message));q.on('request',r=>rq.push(r.url()));
    if(opt&&opt.block)await q.route('**/nbh-scene3d-real.js',r=>r.abort());await q.goto(url);if(opt&&opt.wait)await ready(q);else await sleep(1500);
    await q.evaluate(()=>NBHExplain.seek(6));await sleep(200);
    const f=await q.evaluate(()=>{const g=NBHExplain.get(),R=document.querySelector('#exStage .nbh-scene3d-real'),C=document.querySelector('#exStage .nbh-scene3d:not(.nbh-scene3d-real)'),S=document.querySelector('#exStage');
      return {state:g.realState,real:g.real,realThere:!!R,realShown:!!R&&R.style.display!=='none',clayShown:!!C&&C.style.display!=='none',svg:!!document.querySelector('#exStage svg'),now:document.querySelector('#exNow').textContent,sw:Math.round((R||S).getBoundingClientRect().width),cw:R?Math.round(R.querySelector('canvas').getBoundingClientRect().width):0,ratio:R?+(R.getBoundingClientRect().width/R.getBoundingClientRect().height).toFixed(2):0,wide:document.documentElement.scrollWidth-document.documentElement.clientWidth};});
    f.asked=rq.filter(u=>u.includes('nbh-scene3d-real')).length;f.errs=er;await c.close();return f;};
  const hc=await one(EX+'?clay=1#fct'),hf=await one(EX+'?flat=1#fct'),hb=await one(EX+'#fct',{block:true,wait:true});
  ok('H ?clay=1 keeps the clay scene and ?flat=1 the flat drawing, neither asking for the pack; where the pack cannot be read the clay scene stays, nothing of the other is left behind, the explainer still runs, and there is no page error',
    hc.asked===0&&hc.clayShown&&!hc.realThere&&hc.state===''&&hf.asked===0&&hf.svg&&!hf.realThere&&hb.asked===1&&hb.state==='failed'&&hb.clayShown&&!hb.realThere&&/^He asks on green/.test(hb.now)&&!hc.errs.length&&!hf.errs.length&&!hb.errs.length,{hc,hf,hb});
  const hi=await one('file://'+path.join(W,'explain.html')+'#fct',{wait:true});
  ok('I opened from a folder, with no server, the real-looking scene is read and shown',hi.state==='ready'&&hi.realShown&&!hi.clayShown&&!hi.errs.length,hi);
  const hj=await one(EX+'#fct',{w:390,wait:true});
  ok('J on a phone’s width the real-looking picture fits (16:9, its canvas as wide as its box) and nothing is wider than the screen',hj.state==='ready'&&hj.realShown&&hj.sw<=390&&hj.sw>300&&Math.abs(hj.ratio-1.78)<.03&&Math.abs(hj.cw-hj.sw)<=1&&hj.wide<=0,hj);
  ok('Z no page error, and no request left the folder',!errs.length&&!outside.length,{errs,outside:outside.slice(0,4)});
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
