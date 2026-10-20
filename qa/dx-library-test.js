/* v23.76 Form DM-1's diagnoses (the BCBA's request: the DSM-5-TR in the workstation, in the diagnoses, with what is good
   to know). Form DM-1 alone and in the workstation, on an iPad (touch):
   1. the library holds the DSM-5-TR classification as an index: over 1,000 entries in 22 chapters, each a name, its
      page, its chapter, and the ICD-10-CM code where the manual prints one; nothing of the manual's text (no
      specifiers, notes or criteria);
   2. the search: a name's first letters, a word of it, a short name (ADHD, OCD, dyslexia) or a code;
   3. on the iPad the box opens the list (the most usual first), typing narrows it, a tap fills the name and its code;
      the list is on screen, not cut off by the table;
   4. "parent report" in the source keeps the code empty, as before;
   5. Good to know: for each diagnosis entered, its DSM-5-TR chapter and page, notes for the FBA and BIP with their
      sources, and the scope note; a name from the earlier list (saved in older cases) finds its page by its code; a name
      not in the list says so;
   6. Look up: any diagnosis without entering it; the box is emptied after (nothing of it stays in the case);
   7. every note has a title, a summary, practice points and a source, and is reached by at least one diagnosis;
   8. the keyboard: arrows and Enter pick;
   9. paper: the table prints, Good to know and the list do not;
  10. axe-core's WCAG 2.1 A and AA rules on the view with the list open and a card open (where axe-core is installed);
  11. no page errors. Simulated data only.  usage: node qa/dx-library-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
let AXE=null;try{AXE=require('fs').readFileSync(require.resolve('axe-core/axe.min.js',{paths:[__dirname,path.join(__dirname,'node_modules')].concat((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean))}),'utf8');}catch(e){AXE=null;}
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const F=L.forms().find(x=>x.id==='DM-1');
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(F.file));await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;const b=document.querySelector('[data-view="health"]');if(b)b.click();
    window.$=s=>document.querySelector(s);window.val=n=>document.querySelector('[name="'+n+'"]').value;
    window.setv=(n,x)=>{const e=document.querySelector('[name="'+n+'"]');e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};});await sleep(400);
  /* 1 the index */
  const lib=await p.evaluate(()=>{const D=dxLibrary.DXD;return {n:D.dx.length,ch:D.ch.length,pages:D.dx.every(d=>Number.isInteger(d[2])&&d[2]>0&&d[2]<1000),chs:D.dx.every(d=>d[3]>=0&&d[3]<D.ch.length),
    coded:D.dx.filter(d=>d[1]).length,bad:D.dx.filter(d=>d[0].length>160||/specify|note:|criteri|coding|code first/i.test(d[0])).map(d=>d[0]).slice(0,4),
    asd:D.dx.find(d=>d[0]==='Autism spectrum disorder'),tour:D.dx.find(d=>/^Tourette/.test(d[0]))};});
  ok('1 the library is the DSM-5-TR classification as an index: '+lib.n+' entries in '+lib.ch+' chapters, each a name, a page and a chapter, '+lib.coded+' with their code; no text of the manual',
    lib.n>1000&&lib.ch===22&&lib.pages&&lib.chs&&lib.coded>=850&&!lib.bad.length&&!!lib.asd&&lib.asd[1]==='F84.0'&&lib.asd[2]===56&&!!lib.tour&&lib.tour[1]==='F95.2',lib);
  /* 2 the search */
  const se=await p.evaluate(()=>{const f=q=>dxLibrary.search(q).slice(0,8).map(e=>e.n+'|'+e.c);return {adh:f('adh'),dys:f('dysl'),code:f('F84'),tour:f('tour'),ocd:f('ocd'),empty:f('zzzz')};});
  ok('2 the search finds by first letters, a word, a short name and a code',/^Attention-deficit\/hyperactivity disorder\|/.test(se.adh[0])&&se.adh.some(x=>/combined presentation\|F90\.2/.test(x))&&se.dys.some(x=>/reading\|F81\.0/.test(x))
    &&/^Autism spectrum disorder\|F84\.0/.test(se.code[0])&&/^Tourette.s disorder\|F95\.2/.test(se.tour[0])&&se.ocd.some(x=>/^Obsessive-compulsive disorder\|F42\.2/.test(x))&&!se.empty.length,se);
  /* 3 the picker on the iPad */
  await p.evaluate(()=>document.querySelector('#dxTbl').scrollIntoView({block:'start'}));await sleep(200);
  await p.tap('[name="dx[0].name"]');await sleep(300);
  const o1=await p.evaluate(()=>{const u=$('#dxPop');return {shown:!u.hidden,grp:(u.querySelector('.dx-grp')||{}).textContent,n:u.querySelectorAll('.dx-opt').length,exp:document.querySelector('[name="dx[0].name"]').getAttribute('aria-expanded')};});
  await p.type('[name="dx[0].name"]','auti',{delay:30});await sleep(300);
  const o2=await p.evaluate(()=>{const u=$('#dxPop'),r=u.getBoundingClientRect(),first=u.querySelector('.dx-opt'),fr=first.getBoundingClientRect(),hit=document.elementFromPoint(fr.left+fr.width/2,fr.top+fr.height/2);
    return {first:first.querySelector('.dx-on').textContent,onScreen:r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth,top:!!hit&&u.contains(hit),h:Math.round(fr.height)};});
  await p.tap('#dxPop .dx-opt');await sleep(400);
  const o3=await p.evaluate(()=>({name:val('dx[0].name'),code:val('dx[0].code'),closed:$('#dxPop').hidden}));
  ok('3 on the iPad: the box opens the list (the most usual first), typing narrows it, a tap fills the name and its code; the list is on screen and on top',
    o1.shown&&/Most often in school records/.test(o1.grp)&&o1.n>40&&o1.exp==='true'&&o2.first==='Autism spectrum disorder'&&o2.onScreen&&o2.top&&o2.h>=44&&o3.name==='Autism spectrum disorder'&&o3.code==='F84.0'&&o3.closed,{o1,o2,o3});
  /* 4 parent report */
  const pr=await p.evaluate(async()=>{setv('dx[1].src','parent report');const b=document.querySelector('[name="dx[1].name"]');b.focus();b.value='tour';b.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(r=>setTimeout(r,200));document.querySelector('#dxPop .dx-opt').click();await new Promise(r=>setTimeout(r,200));return {name:val('dx[1].name'),code:val('dx[1].code')};});
  ok('4 "parent report" in the source keeps the code empty, as before',/^Tourette/.test(pr.name)&&pr.code==='',pr);
  /* 5 Good to know */
  await p.evaluate(async()=>{setv('dx[2].name','ADHD, combined presentation');setv('dx[2].code','F90.2');setv('dx[3].name','Made-up condition (simulated)');document.activeElement.blur();dxLibrary.paint();await new Promise(r=>setTimeout(r,200));});
  const k=await p.evaluate(()=>{const c=[...document.querySelectorAll('#dxKnowList details.dxk')].map(d=>({n:d.querySelector('.dxk-n').textContent,c:d.querySelector('.dxk-c').textContent,where:d.querySelector('.dxk-where').textContent,
      h:[...d.querySelectorAll('h5')].map(h=>h.textContent),src:[...d.querySelectorAll('.dxk-src li')].map(l=>l.textContent),scope:(d.querySelector('.dxk-scope')||{}).textContent||''}));return c;});
  const asd=k.find(x=>x.n==='Autism spectrum disorder'),adhd=k.find(x=>/^Attention-deficit\/hyperactivity disorder, combined presentation$/.test(x.n)),made=k.find(x=>/Made-up/.test(x.n));
  ok('5 Good to know: the chapter and page, the notes and their sources, the scope; an earlier list\'s name (ADHD, combined presentation) finds its DSM-5-TR entry and page by its code; a name not in the list says so',
    !!asd&&/Neurodevelopmental Disorders: page 56/.test(asd.where)&&asd.h.join()==='At school,For the FBA and BIP,Work with'&&asd.src.some(s=>/Shaw KA.*2025/.test(s))&&/do not diagnose/.test(asd.scope)
    &&!!adhd&&/page 68/.test(adhd.where)&&adhd.src.some(s=>/Wolraich/.test(s))&&!!made&&/Not found in the DSM-5-TR list/.test(made.where),k.map(x=>[x.n,x.where.slice(0,60),x.h.length]));
  /* 6 look up */
  await p.evaluate(()=>document.getElementById('dxKnow').scrollIntoView({block:'start'}));await sleep(200);
  await p.tap('#dxLook');await p.type('#dxLook','ptsd',{delay:30});await sleep(300);await p.tap('#dxPop .dx-opt');await sleep(300);
  const lk=await p.evaluate(()=>{const d=document.querySelector('#dxKnowList details.dxk-look');return {first:d&&d.querySelector('.dxk-n').textContent,open:!!d&&d.open,box:$('#dxLook').value,named:!!$('#dxLook').name,saved:JSON.stringify(window.nbhBridge?nbhBridge.snapshot():{}).toLowerCase().includes('ptsd')};});
  ok('6 Look up: any diagnosis without entering it, its card first and open; the box emptied, nothing of it in the form\'s data',/^Posttraumatic stress disorder/.test(lk.first)&&lk.open&&lk.box===''&&!lk.named&&!lk.saved,lk);
  /* 7 the notes */
  const nt=await p.evaluate(()=>{const N=dxLibrary.DXN,used=new Set(dxLibrary.DXL.map(e=>e.t).filter(Boolean));
    return {n:Object.keys(N).length,bad:Object.entries(N).filter(([k,v])=>!(v.t&&v.b&&v.f&&v.f.length&&v.r&&v.r.length)).map(x=>x[0]),orphan:Object.keys(N).filter(k=>!used.has(k)),with:dxLibrary.DXL.filter(e=>e.t).length};});
  ok('7 every note ('+nt.n+') has a title, a summary, practice points and a source, and is reached by a diagnosis ('+nt.with+' entries have notes)',nt.n>=60&&!nt.bad.length&&!nt.orphan.length,nt);
  /* 8 the keyboard */
  const kb=await p.evaluate(async()=>{const b=document.querySelector('[name="dx[4].name"]');b.focus();b.value='selective';b.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
    b.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));const act=b.getAttribute('aria-activedescendant');b.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await new Promise(r=>setTimeout(r,100));
    return {act,name:val('dx[4].name'),code:val('dx[4].code')};});
  ok('8 the keyboard: Arrow Down marks an option, Enter picks it',kb.act==='dxO0'&&kb.name==='Selective mutism'&&kb.code==='F94.0',kb);
  /* 10 axe */
  if(AXE){await p.evaluate(()=>{const b=document.querySelector('[name="dx[0].name"]');b.focus();document.querySelector('#dxKnowList details.dxk').open=true;});await sleep(300);
    await p.addScriptTag({content:AXE});const ax=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},rules:{'meta-viewport':{enabled:false}},resultTypes:['violations']});
      return r.violations.map(v=>v.id+': '+v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(' | '));});
    ok('10 WCAG 2.1 A and AA (axe-core) with the list open and a card open',!ax.length,ax);}
  else console.log('NOTE axe-core is not installed: 10 skipped');
  /* 9 paper */
  await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.emulateMedia({media:'print'});await sleep(200);
  const pp=await p.evaluate(()=>({know:getComputedStyle($('#dxKnow')).display,pop:getComputedStyle($('#dxPop')).display,tbl:getComputedStyle($('#dxTbl')).display}));
  ok('9 paper: the table prints; Good to know and the list do not',pp.know==='none'&&pp.pop==='none'&&pp.tbl!=='none',pp);
  await p.emulateMedia({media:'screen'});
  /* in the workstation */
  const w=await ctx.newPage();w.on('pageerror',e=>errs.push('shell: '+e.message));await w.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await w.evaluate(async()=>{openForm('DM-1');const t0=performance.now();while(!state.status['DM-1']&&performance.now()-t0<20000)await new Promise(r=>setTimeout(r,60));});await sleep(1500);
  const fr=w.frames().find(f=>/DM-1_/.test(f.url()));
  const inWs=fr?await fr.evaluate(()=>{const b=document.querySelector('[data-view="health"]');if(b)b.click();return !!window.dxLibrary&&dxLibrary.search('autism')[0].c==='F84.0'&&!!document.getElementById('dxKnow');}):false;
  ok('3b in the workstation, the same',inWs);
  await w.close();
  ok('11 no page errors',!errs.length,errs.slice(0,4));
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
