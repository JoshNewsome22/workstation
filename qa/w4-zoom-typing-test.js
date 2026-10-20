/* v23.55 (review Wave 4, F488, F473, F517): zoom is not stopped (an iPad or iPhone only keeps Safari from zooming into a
   tapped field); the view tabs' progress dots wait until typing pauses and then catch up; typing in IA-1 has no long
   freeze; Help counts 47 forms. Simulated data only.  usage: node qa/w4-zoom-typing-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const vp=async(ua,f)=>{const ctx=await br.newContext(ua?{userAgent:ua,viewport:{width:1024,height:1366}}:{viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);const v=await p.evaluate(()=>document.querySelector('meta[name=viewport]').content);await ctx.close();return v;};
  const caps=fs.readdirSync(dir).filter(f=>/\.html$/.test(f)&&/maximum-scale/.test(fs.readFileSync(dir+f,'utf8').match(/<meta name="viewport"[^>]*>/)||''));
  ok('1 no page in the workstation stops zoom in its own markup (it was 48)',caps.length===0,caps);
  const d1=await vp('','index.html'),d2=await vp('',file('VI-1')||file('Variable_Isolation')),i1=await vp(IPAD,'index.html'),i2=await vp(IPAD,file('CR-1_'));
  ok('2 a laptop: the workstation and a form can zoom (no maximum-scale)',!/maximum-scale/.test(d1)&&!/maximum-scale/.test(d2),{d1,d2});
  ok('3 an iPad: maximum-scale=1 is put back by script, so Safari does not zoom into a tapped field (pinch zoom works there anyway)',/maximum-scale=1/.test(i1)&&/maximum-scale=1/.test(i2),{i1,i2});
  /* the dots wait for a pause */
  const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('IA-1: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+file('IA-1_'));await sleep(1200);await L.loadSim(p);await sleep(2500);
  await p.evaluate(()=>{window.__calls=0;const pr=nbhUI.progress;nbhUI.progress=function(){window.__calls++;return pr.apply(this,arguments);};
    window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())__lt.push(e.duration);}).observe({type:'longtask'});
    const el=[...document.querySelectorAll('textarea')].find(e=>e.offsetParent!==null&&!e.readOnly&&!e.disabled);el.focus();el.setSelectionRange(el.value.length,el.value.length);});
  await p.keyboard.type('the quick brown fox jumps over the lazy dog',{delay:60});
  const during=await p.evaluate(()=>window.__calls);await sleep(2600);const after=await p.evaluate(()=>({n:window.__calls,lt:Math.round(Math.max(0,...__lt))}));
  ok('4 while typing, the progress dots are not counted; a moment after the last key they are',during===0&&after.n>=1,{during,after:after.n});
  ok('5 typing in IA-1 (simulation loaded): no freeze of half a second or more (it reached 0.6 s)',after.lt<500,after);
  await ctx.close();
  /* Help */
  const h=await br.newContext();const hp=await h.newPage();await hp.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  const src=fs.readFileSync(dir+'index.html','utf8');
  ok('6 Help counts 47 forms (the one-file edition and the note on forms opened on their own)',/All 47 forms are inside this file/.test(src)&&/Each of the 47 forms also works on its own/.test(src)&&!/\b46 forms\b/.test(src.replace(/<!--[\s\S]*?-->/g,'')),null);
  await h.close();
  ok('7 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
