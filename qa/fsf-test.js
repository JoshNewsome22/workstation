/* v24.93 Forms in Fullscreen (the BCBA's iPad screenshot, 10/28). WebKit (Safari's engine) with a touch screen, at an
   iPad sideways (1180 px) and upright (820 px), and Chromium at 1440 px for a laptop.
   1. Forms shows only in Fullscreen with a form open (not in the ordinary view);
   2. a tap on Forms brings the list of forms over the page, Fullscreen kept (the heading and bar stay away);
   3. choosing a form in the list opens it, puts the list away, and Fullscreen stays;
   4. a tap beside the list, Forms again, and Escape each put the list away without leaving Fullscreen; Escape a second
      time leaves Fullscreen as before; Exit leaves Fullscreen with the list away;
   5. no page errors.  usage: node qa/fsf-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
(async()=>{const wk=await pw.webkit.launch(),cr=await pw.chromium.launch();const errs=[];
  for(const [eng,vw,vh,touch] of [[wk,1180,820,true],[wk,820,1180,true],[cr,1440,900,false]]){
    const tag=(touch?'iPad ':'laptop ')+vw;const ctx=await eng.newContext({viewport:{width:vw,height:vh},hasTouch:touch});const p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/index.html');await sleep(2500);
    await p.evaluate(()=>{try{localStorage.removeItem('nbh.ws.full');}catch(e){}});
    const st=()=>p.evaluate(()=>{const B=document.body,r=document.querySelector('nav.rail'),f=document.getElementById('fsForms'),rr=r.getBoundingClientRect();
      return {full:B.classList.contains('ws-full'),list:B.classList.contains('fs-forms'),btn:f.offsetParent!==null&&getComputedStyle(f).display!=='none',exp:f.getAttribute('aria-expanded'),
        railShown:getComputedStyle(r).display!=='none'&&rr.width>200&&rr.left>=-1&&getComputedStyle(r).visibility==='visible',head:getComputedStyle(document.querySelector('header.top')).display,cur:(document.querySelector('#rail .item.cur, #rail .item[aria-current]')||{}).dataset?.id||null};});
    const openId=id=>p.evaluate(id=>{const b=document.querySelector('#rail .item[data-id="'+id+'"] button.open')||document.querySelector('#rail [data-open="'+id+'"]');b.click();},id);
    await openId('DM-1');await sleep(2500);
    const s0=await st();
    await p.evaluate(()=>document.getElementById('fullBtn').click());await sleep(500);
    const s1=await st();
    ok('1 '+tag+': Forms shows only in Fullscreen with a form open',!s0.btn&&s1.full&&s1.btn,{s0,s1});
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(500);
    const s2=await st();
    ok('2 '+tag+': Forms brings the list over the page; Fullscreen stays',s2.full&&s2.list&&s2.railShown&&s2.exp==='true'&&s2.head==='none',s2);
    await openId('IC-1');await sleep(2500);
    const s3=await st();const curF=await p.evaluate(()=>{const fr=[...document.querySelectorAll('iframe')].find(f=>f.offsetParent&&/IC-1_/.test(f.src||f.getAttribute('src')||''));return !!fr;});
    ok('3 '+tag+': choosing a form opens it, puts the list away, Fullscreen stays',s3.full&&!s3.list&&!s3.railShown&&curF,{s3,curF});
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(300);
    await p.evaluate(()=>document.getElementById('railScrim').click());await sleep(400);const a=await st();
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(300);
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(400);const b=await st();
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(300);
    await p.keyboard.press('Escape');await sleep(400);const c=await st();
    await p.keyboard.press('Escape');await sleep(400);const d=await st();
    await p.evaluate(()=>document.getElementById('fullBtn').click());await sleep(300);
    await p.evaluate(()=>document.getElementById('fsForms').click());await sleep(300);
    await p.evaluate(()=>document.getElementById('fullBtn').click());await sleep(400);const e=await st();
    ok('4 '+tag+': beside the list, Forms again and Escape put it away in Fullscreen; Escape again and Exit leave Fullscreen',
      a.full&&!a.list&&!a.railShown&&b.full&&!b.list&&c.full&&!c.list&&!d.full&&!e.full&&!e.list&&!e.btn,{a,b,c,d,e});
    await ctx.close();}
  ok('5 no page errors',!errs.length,errs.slice(0,5));
  await wk.close();await cr.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
