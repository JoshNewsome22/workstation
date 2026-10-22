/* v21.83 helper N: on an iPad the form's pinned toolbar folds while the user reads down the form or types.
   Ten forms with different toolbars (TD-1, IA-1, DD-1, EA-1, RR-1, QS-1, TV-1, SM-1, VS-1, TK-1) at 820x1180 and 1180x820
   with touch: a finger swipe down the form folds the toolbar to its view buttons on one 44 px strip with a Tools button
   (the content under it starts at least 60 px higher than with the bar unfolded, or than at the top of the form when the
   bar is short), the view buttons stay in sight, nothing on the page moves when it folds, a swipe up unfolds it, a tap in
   a text field folds it and leaving the field unfolds it, Tools unfolds it; no sideways scroll; the print PDF page count is
   the same folded or not; never on a desktop wider than 1194 px with a mouse. No page errors.
   usage: node qa/v2183-n-test.js [ID,ID...]   (WS_URL as in qa/lib.js) */
const {chromium,BASE,forms,loadSim,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const cnt=b=>(b.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
const IDS=(process.argv[2]||'TD-1,IA-1,DD-1,EA-1,RR-1,QS-1,TV-1,SM-1,VS-1,TK-1').split(',');
const M=()=>{const t=document.querySelector('.toolbar'),r=t.getBoundingClientRect(),s=document.getElementById('viewSeg').getBoundingClientRect(),R=document.documentElement;
  return {y:Math.round(scrollY),fold:R.classList.contains('nbh-fold'),st:window.nbhUI&&nbhUI.fold(),top:Math.round(r.top),bot:Math.round(r.bottom),h:Math.round(r.height),
    seg:{top:Math.round(s.top),bot:Math.round(s.bottom),w:Math.round(s.width)},sw:R.scrollWidth,iw:innerWidth,tools:(()=>{const b=document.getElementById('nbhFoldBtn');return !!(b&&b.offsetParent&&b.getBoundingClientRect().width>0);})()};};
(async()=>{const br=await chromium.launch();const errs=[];const all=forms();
  /* a finger swipe (CDP touch events; dy > 0 scrolls down the form) */
  const swipe=async(p,cdp,dy)=>{const v=p.viewportSize(),x=Math.round(v.width/2),y0=Math.round(v.height*(dy>0?0.75:0.35)),n=10;
    const T=(type,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y:Math.round(y)}]});
    for(let k=0;k<2;k++){const s0=await p.evaluate(()=>scrollY);
      await T('touchStart',y0);for(let i=1;i<=n;i++){await T('touchMove',y0-dy*i/n);await sleep(16);}await T('touchEnd');await sleep(500);
      /* headless Chromium now and then drops the first swipe on a page (no scroll at all): once more */
      if(Math.abs(await p.evaluate(()=>scrollY)-s0)>4)break;}};
  for(const [W,H] of [[820,1180],[1180,820]]){
    for(const id of IDS){const f=all.find(x=>x.id===id);const tag=id+' '+W+'x'+H;
      /* a fresh browser profile for each form (no saved work from the form before) */
      const ctx=await br.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true,deviceScaleFactor:1});
      const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
      await p.goto(BASE+'/NBH-Workstation/'+f.file,{waitUntil:'load'});await sleep(900);const cdp=await ctx.newCDPSession(p);
      /* the form's own simulated student (a full form, long enough to read down) */
      await p.evaluate(()=>{window.confirm=()=>true;});await loadSim(p);await sleep(1300);
      /* the first view long enough to read down (more than half a screen below the bar) */
      const vw=await p.$$eval('#viewSeg button',b=>b.length);let view='';
      for(let i=0;i<vw;i++){const r=await p.evaluate(i=>{const b=document.querySelectorAll('#viewSeg button')[i];b.click();return b.textContent.trim();},i);await sleep(450);
        const long=await p.evaluate(()=>{const t=document.querySelector('.toolbar');return document.documentElement.scrollHeight-innerHeight>t.getBoundingClientRect().top+scrollY+t.offsetHeight+innerHeight*0.6&&[...document.querySelectorAll('textarea,input[type=text],input:not([type])')].some(i=>i.offsetParent&&!i.closest('.toolbar')&&!i.readOnly&&!i.disabled);});
        if(long){view=r;break;}}
      await p.evaluate(()=>scrollTo(0,0));await sleep(300);
      const a=await p.evaluate(M);
      /* the bar unfolded, the page put part-way down by a script (a script's scroll never folds it) */
      const Y=await p.evaluate(()=>{const t=document.querySelector('.toolbar');const y=Math.min(t.getBoundingClientRect().top+scrollY+700,document.documentElement.scrollHeight-innerHeight-400);scrollTo(0,Math.max(0,y));return scrollY;});await sleep(400);
      const u=await p.evaluate(M);
      ok(tag+' ('+view+' view): a script\'s scroll leaves the bar unfolded and pinned ('+u.h+' px)',!u.fold&&u.top===0,{u,Y});
      /* v23.88: with the sheets in the rail (sideways) or the Sheets menu (upright) the toolbar is already one row: nothing to fold */
      const mode=await p.evaluate(()=>window.nbhSheets?nbhSheets.mode():'');
      if(mode&&u.h<=60){const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,btn:!!document.querySelector('.toolbar .nbh-sheets, .toolbar .nbh-arrows')}));
        ok(tag+': the bar is already one row ('+mode+', '+u.h+' px): nothing to fold (v23.88); the sheet controls in the bar; no sideways scroll',o.btn&&o.sw<=o.iw+1,{mode,u,o});await ctx.close();continue;}
      /* a swipe down folds it; the content under the bar is not moved */
      const anchor=await p.evaluate(()=>{const e=document.elementFromPoint(innerWidth/2,innerHeight*0.7);e.setAttribute('data-anc','1');return Math.round(e.getBoundingClientRect().top+scrollY);});
      await swipe(p,cdp,160);
      const b=await p.evaluate(M);const anc2=await p.evaluate(()=>{const e=document.querySelector('[data-anc]');return Math.round(e.getBoundingClientRect().top+scrollY);});
      const gain=u.bot-b.bot,need=Math.min(60,u.h-44);
      const hMax=(mode==='menu'||mode==='rail')?56:44;   /* v23.88 in the Sheets menu the folded strip is the Sheets button and the arrows (50 px) */
      ok(tag+': a swipe down folds the bar to a '+b.h+' px strip with Tools, the content starts '+gain+' px higher than unfolded ('+(a.bot-b.bot)+' px higher than at the top)',
        b.fold&&b.st===1&&b.h>=36&&b.h<=hMax&&b.top===0&&gain>=need&&a.bot-b.bot>=60&&b.tools,{a,u,b,gain,need,mode});
      if(mode==='menu'||mode==='rail'){const sb=await p.evaluate(m=>{const e=document.querySelector(m==='menu'?'.toolbar .nbh-sheets':'.toolbar .nbh-arrows');const r=e&&e.getBoundingClientRect();return r?{top:Math.round(r.top),bot:Math.round(r.bottom),w:Math.round(r.width)}:null;},mode);
        ok(tag+': the sheet controls stay in sight on the strip (v23.88, '+mode+')',!!sb&&sb.top>=0&&sb.bot<=b.bot+1&&sb.w>=80,sb);}
      else ok(tag+': the view buttons stay in sight on the strip',b.seg.top>=0&&b.seg.bot<=b.bot+1&&b.seg.bot-b.seg.top>=34&&b.seg.w>=120,b.seg);
      ok(tag+': nothing on the page moved when it folded',Math.abs(anc2-anchor)<=1,{anchor,anc2});
      ok(tag+': no sideways scroll, folded',b.sw<=b.iw+1,{sw:b.sw,iw:b.iw});
      /* a swipe up unfolds it */
      await swipe(p,cdp,-90);const c=await p.evaluate(M);
      ok(tag+': a swipe up unfolds it ('+c.h+' px)',!c.fold&&c.st===0&&Math.abs(c.h-u.h)<=2,{c,u});
      /* the top of the form unfolds it */
      await swipe(p,cdp,160);const d0=await p.evaluate(M);
      await p.evaluate(()=>scrollTo(0,0));await sleep(400);const d=await p.evaluate(M);
      ok(tag+': folded again, then the top of the form unfolds it',d0.fold&&!d.fold&&d.h===a.h,{d0,d});
      /* Tools unfolds it */
      await p.evaluate(Y=>scrollTo(0,Y),Y);await sleep(300);await swipe(p,cdp,160);
      const tb=await p.evaluate(()=>{const b=document.getElementById('nbhFoldBtn').getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,fold:document.documentElement.classList.contains('nbh-fold')};});
      if(tb.fold){await p.touchscreen.tap(tb.x,tb.y);await sleep(350);}
      const e=await p.evaluate(M);ok(tag+': a tap on Tools unfolds it',tb.fold&&!e.fold,{tb,e});
      /* a tap in a text field folds it; leaving the field unfolds it */
      await p.evaluate(Y=>scrollTo(0,Y),Y);await sleep(300);
      const fx=await p.evaluate(Y=>{
        /* a field part-way down the form, put in the middle of the screen by a script */
        const q=[...document.querySelectorAll('textarea,input[type=text],input:not([type]),input[type=number],input[type=date],input[type=search]')].filter(i=>!i.closest('.toolbar')&&!i.disabled&&!i.readOnly&&i.offsetParent&&i.getBoundingClientRect().width>20);
        const top=i=>i.getBoundingClientRect().top+scrollY;
        const el=q.find(i=>top(i)>=Y+innerHeight*0.3&&top(i)<=Y+innerHeight*0.6)||q.find(i=>top(i)>Y+innerHeight*0.3)||q.find(i=>top(i)>innerHeight*0.6);
        if(!el)return null;scrollTo(0,top(el)-innerHeight*0.5);const r=el.getBoundingClientRect();el.setAttribute('data-ff','1');return {x:r.left+Math.min(20,r.width/2),y:r.top+r.height/2,tag:el.tagName,name:el.name||el.id||el.getAttribute('aria-label')||''};},Y);
      if(!fx){ok(tag+': a text field to tap',false,'none');}
      else{await sleep(350);const fr=await p.evaluate(()=>{const r=document.querySelector('[data-ff]').getBoundingClientRect();return {x:r.left+Math.min(20,r.width/2),y:r.top+r.height/2};});
        await p.touchscreen.tap(fr.x,fr.y);await sleep(400);
        const g=await p.evaluate(M);const foc=await p.evaluate(()=>!!(document.activeElement&&document.activeElement.hasAttribute('data-ff')));
        ok(tag+': a tap in a text field ('+fx.tag+' '+String(fx.name).slice(0,24)+') folds the bar to '+g.h+' px',foc&&g.fold&&g.st===2&&g.h<=(mode==='menu'||mode==='rail'?56:44),{g,foc,fx,mode});
        await swipe(p,cdp,-90);const g2=await p.evaluate(M);ok(tag+': it stays folded while the field has focus',g2.fold,g2);
        await p.evaluate(()=>document.activeElement.blur());await sleep(300);const h=await p.evaluate(M);
        ok(tag+': leaving the field unfolds it',!h.fold&&h.st===0,h);}
      /* print: the same PDF page count folded and not */
      if(W===820){await p.evaluate(()=>scrollTo(0,0));await sleep(250);const n0=cnt(await p.pdf({format:'Letter',preferCSSPageSize:true}));await sleep(700);
        await p.evaluate(Y=>scrollTo(0,Y),Y);await sleep(300);await swipe(p,cdp,160);const pm=await p.evaluate(M),pf=pm.fold;
        const n1=cnt(await p.pdf({format:'Letter',preferCSSPageSize:true}));
        ok(tag+': print PDF page count the same folded ('+n1+') as not ('+n0+')',pf&&n0===n1&&n0>0,{pm,n0,n1,Y});}
      await p.close();await ctx.close();}}
  /* a desktop wider than 1194 px with a mouse: never folds */
  const dp=await br.newPage({viewport:{width:1300,height:900}});dp.on('pageerror',e=>errs.push('desktop: '+e.message));
  await dp.goto(BASE+'/NBH-Workstation/'+all.find(x=>x.id==='TD-1').file,{waitUntil:'load'});await sleep(900);
  await dp.mouse.move(650,600);for(let i=0;i<10;i++){await dp.mouse.wheel(0,150);await sleep(60);}await sleep(400);
  const dz=await dp.evaluate(M);await dp.evaluate(()=>{const i=document.querySelector('textarea');if(i)i.focus();});await sleep(200);const dz2=await dp.evaluate(M);
  ok('TD-1 1300x900 with a mouse: scrolling and typing never fold the bar',dz.y>500&&!dz.fold&&!dz2.fold&&!dz.tools,{dz,dz2});
  /* the same desktop, the form in a 1000 px frame of a 1300 px window (as in the workstation, same origin and not): never folds */
  for(const cross of [false,true]){const fp=await br.newPage({viewport:{width:1300,height:900}});fp.on('pageerror',e=>errs.push('framed: '+e.message));
    const src=BASE+'/NBH-Workstation/'+all.find(x=>x.id==='TD-1').file;
    if(cross)await fp.setContent('<iframe src="'+src+'" style="width:1000px;height:860px;border:0"></iframe>');
    else{await fp.route(BASE+'/__frame.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body style="margin:0"><iframe src="'+src+'" style="width:1000px;height:860px;border:0"></iframe>'}));await fp.goto(BASE+'/__frame.html');}
    await sleep(1500);const fr=fp.frames().find(x=>x.url().includes('TD-1'));
    await fp.mouse.move(500,500);for(let i=0;i<10;i++){await fp.mouse.wheel(0,150);await sleep(60);}await sleep(400);
    const fz=await fr.evaluate(M);ok('TD-1 in a 1000 px frame of a 1300 px desktop window'+(cross?' (another origin)':'')+': scrolling never folds the bar',fz.iw<=1000&&fz.y>500&&!fz.fold,fz);await fp.close();}
  ok('no page errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
