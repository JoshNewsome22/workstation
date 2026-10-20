/* v23.67 (review Wave 4, I245): a low-light screen for evening work.
   1. Help's Screen buttons (Normal, Low light) set it, kept on this device with the text size and contrast; the
      workstation's window turns dark, the forms in it with it (not turned twice), and a form opened on its own turns itself.
   2. Pictures keep their own colours: an image in a form, and in the workstation, is turned back.
   3. Paper is never changed: printed, nothing is turned. Normal clears it. Simulated data only.
   usage: node qa/i245-low-light-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1000):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.view');}catch(e){}});
  await p.evaluate(()=>openForm('TK-1'));await p.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:20000}).catch(()=>{});await sleep(800);
  await p.evaluate(()=>document.getElementById('help').click());await sleep(600);
  await p.evaluate(()=>{const d=[...document.querySelectorAll('#dlgBody details')].find(x=>/Side by side/.test(x.querySelector('summary').textContent));d.open=true;});
  const btn=await p.evaluate(()=>[...document.querySelectorAll('[data-view-dark]')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed')));
  await p.click('[data-view-dark="1"]');await sleep(800);
  const fr=()=>p.frames().find(f=>/TK-1_/.test(f.url()));
  const sh=await p.evaluate(()=>({kept:localStorage.getItem('nbh.view'),cls:document.documentElement.className,filter:getComputedStyle(document.documentElement).filter,logo:(()=>{const i=document.querySelector('img');return i?getComputedStyle(i).filter:'';})()}));
  const fm=await fr().evaluate(()=>{const i=document.querySelector('img');return {cls:document.documentElement.className,filter:getComputedStyle(document.documentElement).filter,img:i?getComputedStyle(i).filter:'(no image)'};});
  ok('1a Help shows Screen: Normal and Low light; Low light is kept on this device and turns the workstation\'s window',btn.length===2&&/"dark":true/.test(sh.kept||'')&&/nbh-dark/.test(sh.cls)&&/invert\(1\)/.test(sh.filter),{btn,sh});
  ok('1b the form in the window is told, and is not turned a second time',/nbh-dark/.test(fm.cls)&&/nbh-framed/.test(fm.cls)&&fm.filter==='none',fm);
  ok('2 pictures keep their own colours: an image in the form and in the workstation is turned back',/invert\(1\)/.test(fm.img)&&/invert\(1\)/.test(sh.logo),{form:fm.img,shell:sh.logo});
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('alone: '+e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(L.forms().find(f=>f.id==='DD-1').file));await sleep(1200);
  const al=await q.evaluate(()=>({cls:document.documentElement.className,filter:getComputedStyle(document.documentElement).filter}));
  ok('1c a form opened on its own turns itself',/nbh-dark/.test(al.cls)&&/invert\(1\)/.test(al.filter),al);
  await q.emulateMedia({media:'print'});await p.emulateMedia({media:'print'});await sleep(300);
  const pr={alone:await q.evaluate(()=>getComputedStyle(document.documentElement).filter),shell:await p.evaluate(()=>getComputedStyle(document.documentElement).filter)};
  await q.emulateMedia({media:'screen'});await p.emulateMedia({media:'screen'});
  ok('3a paper is never changed: printed, nothing is turned',pr.alone==='none'&&pr.shell==='none',pr);
  await p.click('[data-view-dark="0"]');await sleep(700);
  const n=await p.evaluate(()=>({kept:localStorage.getItem('nbh.view'),filter:getComputedStyle(document.documentElement).filter}));const fn=await fr().evaluate(()=>document.documentElement.className);
  ok('3b Normal clears it, in the workstation and the forms',n.kept===null&&n.filter==='none'&&!/nbh-dark/.test(fn),{n,fn});
  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
