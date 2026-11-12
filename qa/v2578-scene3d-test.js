/* v25.78 (the BCBA, 11/11: "3D" for the drawn pages, after three rounds on the look) the lit 3D scene (nbh-scene3d.js) that
   the explainers and the counting practice draw with where the device can draw it; the flat drawing stays as the
   fallback (v2578-explain-test and v2578-practice-test open the pages with ?flat=1 and test that).
   0  the script is in the folder and the offline list, both pages name it, it carries its licence notice and the lighting's
      credit, and it names no address but the XHTML namespace;
   A  explain.html draws in 3D by default (a canvas, no SVG), and the picture is a picture (many colours, not one);
   B  every part that shows has a real control over it: a name, a role, a tab stop, at least 44 px each way, inside the
      picture; a part that does not show has none; the timer's and the signal's controls carry what they show, and that
      agrees with the page's own line;
   C  a tap on a part and Enter on a part say what the part is for and mark it;
   D  speech is a bubble of text and the rule is a label, both readable as text;
   E  the picture is a function of the moment: going away and coming back gives the same controls in the same places;
   F  practice.html draws in 3D with no controls over the picture (tap is off there), runs a scene and scores it;
   G  ?flat=1, and a device that cannot draw 3D, get the flat drawing and nothing breaks;
   H  a narrow screen: the picture fits, nothing is wider than the screen, the controls stay at least 44 px;
   I  drawing a moment is quick enough to scrub (a generous limit: this machine draws in software).
   v25.90: the FCT explainer draws the real-looking scene by default (qa/v2590-real-scene-test.js); this test opens it with
   ?clay=1, which keeps the clay scene tested here.
   Simulated people only. usage: node qa/v2578-scene3d-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const W=path.join(L.ROOT,'NBH-Workstation'),EX=L.BASE+'/NBH-Workstation/explain.html',PR=L.BASE+'/NBH-Workstation/practice.html';
(async()=>{const br=await L.chromium.launch();const errs=[],outside=[];
 try{
  const js=fs.readFileSync(path.join(W,'nbh-scene3d.js'),'utf8'),sw=fs.readFileSync(path.join(W,'sw.js'),'utf8'),ex=fs.readFileSync(path.join(W,'explain.html'),'utf8'),pr=fs.readFileSync(path.join(W,'practice.html'),'utf8');
  const urls=[...new Set(js.match(/https?:\/\/[A-Za-z0-9.\/_#?=-]+/g)||[])];
  ok('0 nbh-scene3d.js is in the folder and the offline list, both pages name it after the flat scene, it carries the MIT notice and the lighting’s credit, and it names no address but the XHTML namespace',
   /'nbh-scene3d\.js'/.test(sw)&&[ex,pr].every(s=>/<script src="nbh-scene\.js"><\/script>\s*<script src="nbh-scene3d\.js"><\/script>/.test(s))&&/The MIT License\. Copyright \(c\) 2010-2026 three\.js authors/.test(js.slice(0,3000))&&/Poly Haven[^\n]*CC0/.test(js.slice(0,3000))&&urls.join()==='http://www.w3.org/1999/xhtml'&&/drawn && s\.indexOf\('nbh-scene\.js'\) < 0/.test(sw),{urls});

  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('request',r=>{const u=r.url();if(!u.startsWith(L.BASE)&&!u.startsWith('data:')&&!u.startsWith('blob:'))outside.push(u);});
  await p.emulateMedia({reducedMotion:'reduce'});
  const E=(f,a)=>p.evaluate(f,a);
  await p.goto(EX+'#dro');await p.waitForFunction(()=>window.NBHExplain&&document.querySelector('#exStage .nbh-scene3d canvas'),null,{timeout:30000}).catch(()=>{});await sleep(500);
  /* the picture, read back: how many different colours, and how much of it is one colour */
  const look=t=>E(t=>{if(t!==null)NBHExplain.seek(t);const c=document.querySelector('#exStage canvas');if(!c)return null;const k=document.createElement('canvas');k.width=160;k.height=90;const x=k.getContext('2d');x.drawImage(c,0,0,160,90);const d=x.getImageData(0,0,160,90).data,seen={};let top=0;
    for(let i=0;i<d.length;i+=4){const key=(d[i]>>4)+','+(d[i+1]>>4)+','+(d[i+2]>>4);seen[key]=(seen[key]||0)+1;if(seen[key]>top)top=seen[key];}return {colours:Object.keys(seen).length,most:top/(160*90)};},t);
  const a=await E(()=>({d3:document.documentElement.classList.contains('nbh-3d'),canvas:!!document.querySelector('#exStage .nbh-scene3d canvas'),svg:!!document.querySelector('#exStage svg'),label:(document.querySelector('#exStage .nbh-scene3d')||{getAttribute(){return '';}}).getAttribute('aria-label'),role:(document.querySelector('#exStage .nbh-scene3d')||{getAttribute(){return '';}}).getAttribute('role')}));
  const pic=await look(5);
  ok('A explain.html draws the lit 3D scene by default (a canvas with a name, no SVG), and the picture is a picture (many colours, no one colour over most of it)',a.d3&&a.canvas&&!a.svg&&a.role==='img'&&/adult and a student/.test(a.label||'')&&pic&&pic.colours>150&&pic.most<.5,{a,pic});

  const parts=t=>E(t=>{if(t!==null)NBHExplain.seek(t);const st=document.querySelector('#exStage .nbh-scene3d').getBoundingClientRect();return {now:document.getElementById('exStep').textContent,note:(document.querySelector('#exStage .ns3-note')||{}).textContent||'',
    bubbles:[...document.querySelectorAll('#exStage .ns3-bubble')].filter(b=>b.style.display!=='none').map(b=>b.dataset.who+': '+b.textContent),
    parts:[...document.querySelectorAll('#exStage .ns-part')].map(b=>{const r=b.getBoundingClientRect(),shown=getComputedStyle(b).display!=='none';return {name:b.dataset.part,shown,role:b.getAttribute('role'),tab:b.tabIndex,label:b.getAttribute('aria-label'),w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left-st.left),y:Math.round(r.top-st.top),inside:r.left>=st.left-1&&r.top>=st.top-1&&r.right<=st.right+1&&r.bottom<=st.bottom+1,val:(b.querySelector('.ns3-val')||{}).textContent||''};})};},t);
  const d5=await parts(5),by=(r,n)=>r.parts.find(q=>q.name===n),shown=r=>r.parts.filter(q=>q.shown);
  ok('B1 DRO at 0:05: the adult, the student, the timer, the papers, the student’s work and the sign have controls (a name, a role, a tab stop, at least 44 px each way, inside the picture); the signal, the card, the tokens and the item have none',
   ['adult','student','timer','papers','sheet','note'].every(n=>by(d5,n).shown)&&['signal','card','tokens','item'].every(n=>!by(d5,n).shown)&&shown(d5).every(q=>q.role==='button'&&q.tab===0&&q.label&&q.w>=44&&q.h>=44&&q.inside),d5.parts);
  const tm=by(d5,'timer').val,m=/(\d+:\d\d) left/.exec(d5.now);
  ok('B2 the timer’s control carries the time the timer shows, and it is the time in the page’s own line',/^\d+:\d\d$/.test(tm)&&m&&m[1]===tm,{tm,now:d5.now});
  await p.goto(EX+'?clay=1#fct');await p.reload();await p.waitForFunction(()=>window.NBHExplain&&document.querySelector('#exStage .nbh-scene3d canvas'),null,{timeout:30000}).catch(()=>{});await sleep(400);
  const f37=await parts(37);
  ok('B3 FCT on green: the signal shows and its control says green, the request card has a control, and the timer agrees with the page’s line',by(f37,'signal').shown&&by(f37,'signal').val==='green'&&by(f37,'card').shown&&/^Green/.test(f37.now)&&f37.now.includes(by(f37,'timer').val),{now:f37.now,sig:by(f37,'signal'),tm:by(f37,'timer').val});
  /* a red moment: find one from the page's own line */
  const red=await E(()=>{for(let t=0;t<150;t+=1){NBHExplain.seek(t);if(/^Red/.test(document.getElementById('exStep').textContent))return t+1;}return -1;});
  const fr=red>0?await parts(red):null;
  ok('B4 on red the signal’s control says red',!!fr&&by(fr,'signal').val==='red',{red,now:fr&&fr.now,sig:fr&&by(fr,'signal')});

  await E(()=>NBHExplain.seek(37));await p.click('#exStage [data-part="timer"]');await sleep(150);
  const c1=await E(()=>({txt:document.getElementById('exPart').textContent,on:document.querySelector('#exStage [data-part="timer"]').classList.contains('on')}));
  await p.focus('#exStage [data-part="adult"]');await p.keyboard.press('Enter');await sleep(150);
  const c2=await E(()=>({txt:document.getElementById('exPart').textContent,on:document.querySelector('#exStage [data-part="adult"]').classList.contains('on'),off:!document.querySelector('#exStage [data-part="timer"]').classList.contains('on'),ring:getComputedStyle(document.querySelector('#exStage [data-part="adult"]')).boxShadow!=='none'}));
  ok('C a tap on the timer says what the timer is for and marks it; Enter on the adult does the same for the adult and unmarks the timer',c1.on&&c1.txt.length>20&&!/Tap a part|each says what it is for/.test(c1.txt)&&c2.on&&c2.off&&c2.ring&&c2.txt!==c1.txt&&c2.txt.length>20,{c1,c2});

  /* speech and the rule, as text: look for a moment with a bubble */
  const sp=await E(()=>{for(let t=0;t<150;t+=.5){NBHExplain.seek(t);const b=[...document.querySelectorAll('#exStage .ns3-bubble')].find(b=>b.style.display!=='none'&&b.textContent);if(b){const r=b.getBoundingClientRect(),st=document.querySelector('#exStage .nbh-scene3d').getBoundingClientRect(),n=document.querySelector('#exStage .ns3-note'),nr=n&&getComputedStyle(n).display!=='none'?n.getBoundingClientRect():null;
      return {t,who:b.dataset.who,text:b.textContent,inside:r.left>=st.left-1&&r.right<=st.right+1&&r.top>=st.top-1,clearOfNote:!nr||r.top>=nr.bottom-1||r.bottom<=nr.top+1||r.left>=nr.right||r.right<=nr.left,note:n?n.textContent:'',fs:parseFloat(getComputedStyle(b).fontSize)};}}return null;});
  ok('D speech is a bubble of text inside the picture (at least 14 px), clear of the rule’s label; the rule is a label of text',!!sp&&sp.text.length>3&&sp.inside&&sp.clearOfNote&&sp.fs>=14&&/^Interval: /.test(d5.note),{sp,note:d5.note});

  const e1=await parts(62);await parts(5);const e2=await parts(62);const sig=r=>JSON.stringify(r.parts.map(q=>[q.name,q.shown,q.x,q.y,q.w,q.h,q.val]))+r.now+r.note+r.bubbles.join();
  ok('E the picture is a function of the moment: 1:02, then 0:05, then 1:02 again gives the same controls in the same places, the same words',sig(e1)===sig(e2),{a:sig(e1).slice(0,500),b:sig(e2).slice(0,500)});

  const times=await E(()=>{const out=[];for(let i=0;i<24;i++){const t0=performance.now();NBHExplain.seek(3+i*5.5);out.push(performance.now()-t0);}out.sort((a,b)=>a-b);return {median:Math.round(out[12]),worst:Math.round(out[23])};});
  ok('I a moment is drawn quickly enough to scrub (median under 150 ms, worst under 600 ms, drawing in software here)',times.median<150&&times.worst<600,times);

  await p.setViewportSize({width:390,height:780});await sleep(500);
  const h=await E(()=>{NBHExplain.seek(37);const st=document.querySelector('#exStage .nbh-scene3d').getBoundingClientRect(),c=document.querySelector('#exStage canvas').getBoundingClientRect();return {sw:Math.round(st.width),ratio:+(st.width/st.height).toFixed(2),cw:Math.round(c.width),wide:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('#exStage .ns-part')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.getBoundingClientRect()).filter(r=>r.width<43.5||r.height<43.5).length};});
  ok('H on a phone’s width the picture fits (16:9, its canvas as wide as its box), nothing is wider than the screen, and every control is still at least 44 px each way',h.sw<=390&&h.sw>300&&Math.abs(h.ratio-1.78)<.03&&Math.abs(h.cw-h.sw)<=1&&h.wide<=0&&h.small===0,h);
  await p.setViewportSize({width:1180,height:820});

  /* the counting practice: 3D, no controls over the picture, a scene runs and is scored */
  await p.goto(PR);await p.waitForFunction(()=>window.NBHPractice&&document.querySelector('#prStage .nbh-scene3d canvas'),null,{timeout:30000}).catch(()=>{});await sleep(400);
  const f0=await E(()=>({d3:document.documentElement.classList.contains('nbh-3d'),svg:!!document.querySelector('#prStage svg'),tabs:[...document.querySelectorAll('#prStage .ns-part')].filter(b=>b.tabIndex===0||b.getAttribute('role')||getComputedStyle(b).pointerEvents!=='none').length}));
  await E(()=>{window.__prFast=1;window.__prSpeed=20;NBHPractice.set({mode:'count',seed:4242,len:60,pace:'class'});});await p.click('#prStart');await sleep(700);await p.keyboard.press('PageDown');
  const mid=(await p.locator('#prStage canvas').screenshot({type:'png'})).length;   /* a drawn picture does not squeeze to a few bytes */
  await p.waitForFunction(()=>NBHPractice.get().phase==='done',null,{timeout:30000}).catch(()=>{});
  const f1=await E(()=>{const r=document.getElementById('prResult');return {phase:NBHPractice.get().phase,shown:!!r&&!r.hidden,text:r?r.textContent.slice(0,200):''};});
  ok('F practice.html draws the lit 3D scene with no controls over the picture; a scene runs to its end and is scored against its answer',f0.d3&&!f0.svg&&f0.tabs===0&&mid>40000&&f1.phase==='done'&&f1.shown&&/\d/.test(f1.text),{f0,mid,f1});

  /* the flat drawing: asked for, and where 3D cannot be drawn */
  await p.goto(EX+'?flat=1#dro');await sleep(900);
  const g1=await E(()=>({d3:document.documentElement.classList.contains('nbh-3d'),svg:!!document.querySelector('#exStage svg'),canvas:!!document.querySelector('#exStage canvas'),parts:document.querySelectorAll('#exStage svg [data-part]').length}));
  const ctx2=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});const q=await ctx2.newPage();q.on('pageerror',e=>errs.push('no-3d: '+e.message));
  await q.addInitScript(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type){return /webgl/i.test(type)?null:g.apply(this,arguments);};});
  await q.goto(EX+'#fct');await sleep(1200);
  const g2=await q.evaluate(()=>{NBHExplain.seek(37);return {d3:document.documentElement.classList.contains('nbh-3d'),svg:!!document.querySelector('#exStage svg'),left:document.querySelectorAll('#exStage .nbh-scene3d').length,now:document.getElementById('exStep').textContent};});
  await q.goto(PR);await sleep(1000);const g3=await q.evaluate(()=>({svg:!!document.querySelector('#prStage svg'),left:document.querySelectorAll('#prStage .nbh-scene3d').length}));await ctx2.close();
  ok('G ?flat=1 gives the flat drawing; a device that cannot draw 3D gets the flat drawing on both pages, with nothing of the 3D scene left behind, and the explainer still runs',!g1.d3&&g1.svg&&!g1.canvas&&g1.parts>=8&&!g2.d3&&g2.svg&&g2.left===0&&/^Green/.test(g2.now)&&g3.svg&&g3.left===0,{g1,g2,g3});
  ok('Z no page error, and no request left the folder',!errs.length&&!outside.length,{errs,outside:outside.slice(0,4)});
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
