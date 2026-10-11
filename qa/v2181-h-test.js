/* v21.81 helper H.
   1. Form TD-1: Print / Save as PDF leaves the Guide (a literature review) and the References out unless the new tick
      "Include the guide and references" is on: fewer PDF pages without it, the same count as before with it; the
      workstation's master print (the 'collect' answer) leaves them out too unless ticked; the tick is a named field, so it
      goes into Save data and comes back with Open data (and Clear all turns it off).
   2. Every form in the workstation opens on its first tab, the first tab is not the Guide, and no working tab follows the
      Guide (only reference tabs: References, Evidence guide, Methods & references, Statute).
   No page errors. Simulated students only (the forms' own load simulators).
   usage: node qa/v2181-h-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,forms,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const cnt=b=>(b.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
const GUIDE=/^(guide|evidence guide|methods & references|statute|references)$/i, MAIN=/^guide$/i;
(async()=>{const br=await chromium.launch();const log=[];
  /* ================= 1. TD-1 ================= */
  const p=await br.newPage({viewport:{width:1300,height:950}});wire(p,log);
  await p.addInitScript(()=>{window.print=function(){};});
  await p.goto(BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html',{waitUntil:'load'});await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('simBtn').click();});await sleep(1500);
  const t0=await p.evaluate(()=>{const c=document.getElementById('printGuide');return {has:!!c,on:c&&c.checked,near:!!(c&&c.closest('.tgroup')&&c.closest('.tgroup').querySelector('#printBtn')),label:c&&c.closest('label').textContent.trim()};});
  ok('1a the tick sits by Print / Save as PDF, off by default',t0.has&&t0.on===false&&t0.near&&/Include the guide and references/.test(t0.label),t0);
  const off=cnt(await p.pdf({format:'Letter',preferCSSPageSize:true}));
  const collect=()=>p.evaluate(()=>new Promise(res=>{const h=e=>{if(e.data&&e.data.nbh==='payload'){window.removeEventListener('message',h);res(e.data.html);}};window.addEventListener('message',h);window.postMessage({nbh:'collect'},'*');}))
    .then(html=>p.evaluate(html=>{const d=new DOMParser().parseFromString('<div id="r">'+html+'</div>','text/html');const txt=q=>{const e=d.querySelector(q);return e?(e.textContent||'').replace(/\s+/g,''):null;};
      return {guide:txt('#guide'),refs:txt('#refs'),setup:(txt('#setup')||'').length,final:(txt('#final')||'').length};},html));
  const m0=await collect();
  ok('1b the master print (collect) leaves out the Guide and the References when the tick is off (their pages are empty and dropped)',m0.guide===''&&m0.refs===''&&m0.setup>100&&m0.final>0,m0);
  await p.evaluate(()=>{const c=document.getElementById('printGuide');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});
  const on=cnt(await p.pdf({format:'Letter',preferCSSPageSize:true}));
  ok('1c PDF pages: fewer without the tick than with it (off '+off+', on '+on+')',off>0&&on-off>=8,{off,on});
  const m1=await collect();
  ok('1d ticked: the master print carries the Guide and the References',m1.guide.length>2000&&m1.refs.length>2000,{g:m1.guide&&m1.guide.length,r:m1.refs&&m1.refs.length});
  /* Save data (the file caught as it is written), Clear all, then Open data with that file */
  const file=await p.evaluate(()=>new Promise(res=>{const U=URL,mk=U.createObjectURL,ck=HTMLAnchorElement.prototype.click;
    U.createObjectURL=b=>{b.text().then(t=>{U.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;res(t);});return 'blob:nbh-test';};HTMLAnchorElement.prototype.click=function(){};
    document.getElementById('saveBtn').click();}));
  const saved=JSON.parse(file).fields['opt.printGuide'];
  await p.evaluate(()=>{window.confirm=()=>true;document.getElementById('clearBtn').click();});await sleep(500);
  const cl=await p.evaluate(()=>({on:document.getElementById('printGuide').checked,skip:document.getElementById('guide').classList.contains('pr-skip')}));
  await p.setInputFiles('#fileIn',{name:'TD-1_SIMULATED.json',mimeType:'application/json',buffer:Buffer.from(file)});await sleep(1200);
  const bk=await p.evaluate(()=>({back:document.getElementById('printGuide').checked,skip:document.getElementById('guide').classList.contains('pr-skip')||document.getElementById('refs').classList.contains('pr-skip')}));
  const rt={saved,cleared:cl.on,skipC:cl.skip,back:bk.back,skip:bk.skip};
  ok('1e the tick is saved with the form\'s data and comes back on Open data (cleared: off and the Guide left out)',rt.saved===true&&rt.cleared===false&&rt.skipC===true&&rt.back===true&&rt.skip===false,rt);
  const kept=await p.evaluate(()=>{const c=document.getElementById('printGuide');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    return [...document.querySelectorAll('#guide > .nbh-wh, #guide > .nbh-as-guide')].every(e=>e.classList.contains('noprint'));});
  ok('1f the Guide\'s own screen-only parts stay screen-only after the tick goes off and on',kept);
  const again=cnt(await p.pdf({format:'Letter',preferCSSPageSize:true}));
  ok('1g ticked again: the same page count',again===on,{again,on});
  await p.close();
  /* ================= 2. every form's tab bar ================= */
  const F=forms();const bad=[];const rows=[];
  const ctx=await br.newContext({viewport:{width:1200,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
  const one=async f=>{const pg=await ctx.newPage();const lg=[];wire(pg,lg);
    await pg.goto(BASE+'/NBH-Workstation/'+f.file,{waitUntil:'load'}).catch(e=>lg.push({type:'pageerror',text:String(e)}));await sleep(900);
    const r=await pg.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button[data-view]')];const lab=x=>x.textContent.replace(/\s+/g,' ').trim();
      const pressed=b.filter(x=>x.getAttribute('aria-pressed')==='true');
      return {tabs:b.map(lab),keys:b.map(x=>x.dataset.view),pressed:pressed.map(lab),body:document.body.className};});
    lg.filter(x=>x.type==='pageerror').forEach(x=>log.push({type:'pageerror',text:f.id+': '+x.text}));
    await pg.close();return {f,r};};
  for(let i=0;i<F.length;i+=6){(await Promise.all(F.slice(i,i+6).map(one))).forEach(x=>rows.push(x));}
  rows.forEach(({f,r})=>{const t=r.tabs;if(!t.length){return;}
    const gi=t.findIndex(x=>GUIDE.test(x));const tail=gi<0?[]:t.slice(gi);
    const why=[];
    if(GUIDE.test(t[0]))why.push('first tab is '+t[0]);
    if(gi>=0&&tail.some(x=>!GUIDE.test(x)))why.push('a working tab after the Guide: '+t.join(' | '));
    const mi=t.findIndex(x=>MAIN.test(x));if(mi>=0&&t.slice(mi+1).some(x=>!/^(references|evidence guide)$/i.test(x)))why.push('the Guide is not last');
    if(r.pressed.length!==1||r.pressed[0]!==t[0])why.push('opens on '+r.pressed.join(',')+' not the first tab');
    if(why.length)bad.push(f.id+': '+why.join('; '));});
  const withBar=rows.filter(x=>x.r.tabs.length).length;
  ok('2a every form ('+withBar+' with a tab bar) opens on its first tab, which is not the Guide; the Guide (and only reference tabs) come last',bad.length===0,bad);
  const g=rows.filter(x=>x.r.tabs.some(t=>MAIN.test(t))).map(x=>x.f.id+':'+x.r.tabs[0]+'…'+x.r.tabs.slice(-2).join('/'));
  console.log('   e.g. '+g.slice(0,8).join('  '));
  const want={'TD-1':'setup','IA-1':'setup','EA-1':'setup','PA-1':'indirect','DM-1':'student','IC-1':'consent','MS-1':'plan','RR-1':'sources','TB-1':'select','RA-1':'setup','VI-1':'p1'};
  const miss=rows.filter(x=>want[x.f.id]&&(x.r.keys[0]!==want[x.f.id]||!new RegExp('(^|\\s)view-'+want[x.f.id]+'(\\s|$)').test(x.r.body))).map(x=>x.f.id+' '+x.r.keys[0]+' body='+x.r.body);
  ok('2b the eleven forms that opened on the Guide open on their first working tab (key and body class)',miss.length===0,miss);
  await ctx.close();
  const errs=log.filter(x=>x.type==='pageerror');
  ok('no page errors',errs.length===0,errs.slice(0,6));
  await br.close();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
