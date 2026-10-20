/* v23.59 (review Wave 4, I247, F486): one naming routine, in nbh-ui.js, for every form.
   1. No form carries its own copy of the routine that names its controls for a screen reader; nbh-ui.js (written from
      tools/blocks/nbh-ui.html) has it once.
   2. Forms opened on their own still name their controls, a field in a table by its row and column (TB-1's "Socially
      significant?", DM-1's tables), and so does a form opened in the workstation.
   3. A chart drawn as an image with no name of its own is named after its card's heading, in any form (it was ABC-1's
      alone); a control added later is named too. Simulated data only.  usage: node qa/i247-names-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;const path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const W=path.join(L.ROOT,'NBH-Workstation'),forms=fs.readdirSync(W).filter(f=>/^[A-Z].*\.html$/.test(f));
  const own=forms.filter(f=>/function nbhNameControls|function nbhHasName/.test(fs.readFileSync(path.join(W,f),'utf8')));
  const ui=fs.readFileSync(path.join(W,'nbh-ui.js'),'utf8'),srcP=path.join(L.ROOT,'tools','blocks','nbh-ui.html'),src=fs.existsSync(srcP)?fs.readFileSync(srcP,'utf8'):null;
  ok('1 no form carries its own copy of the naming routine ('+forms.length+' forms); nbh-ui.js has it once'+(src?', and its source':''),
    forms.length===47&&!own.length&&(ui.match(/function nbhNameControls/g)||[]).length===1&&(src===null||(src.match(/function nbhNameControls/g)||[]).length===1),{own:own.slice(0,5)});
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const file=pre=>forms.find(f=>f.startsWith(pre));
  const named=async(p,root)=>p.evaluate(r=>{const d=r?document.querySelector(r).contentDocument:document;const cells=[...d.querySelectorAll('td input:not([type=hidden]),td select,td textarea')].filter(e=>e.offsetParent);
    return {cells:cells.length,named:cells.filter(e=>(e.getAttribute('aria-label')||'').trim()).length,soc:[...d.querySelectorAll('select[aria-label]')].map(e=>e.getAttribute('aria-label')).filter(a=>/Socially significant/i.test(a)).slice(0,2)};},root);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('TB-1: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(file('TB-1_')));await sleep(1300);await L.loadSim(p);await sleep(2000);
  const tb=await named(p);
  ok('2a TB-1 on its own: the fields in its tables are named, "Socially significant?" with its row',tb.cells>5&&tb.named===tb.cells&&tb.soc.length>0,tb);
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('DM-1: '+e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(file('DM-1_')));await sleep(1300);await L.loadSim(q);await sleep(2000);
  const dm=await named(q);
  ok('2b DM-1 on its own: every field in its tables is named',dm.cells>5&&dm.named===dm.cells,dm);
  /* 3. a chart and a control added later */
  const late=await q.evaluate(async()=>{const card=document.querySelector('.card');if(!card)return {err:'no card'};
    const h=card.querySelector('h2,h3')||card.insertBefore(Object.assign(document.createElement('h2'),{textContent:'Test heading'}),card.firstChild);
    const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.setAttribute('role','img');card.appendChild(sv);
    const lab=document.createElement('label');lab.textContent='A box added later';const i=document.createElement('input');card.appendChild(lab);card.appendChild(i);
    await new Promise(r=>setTimeout(r,900));return {chart:sv.getAttribute('aria-label'),head:h.textContent.replace(/\s+/g,' ').trim(),box:i.getAttribute('aria-label')||''};});
  ok('3a a chart drawn as an image with no name is named after its card\'s heading (in DM-1; it was ABC-1\'s alone)',late.chart&&late.chart===late.head.slice(0,90)+' chart',late);
  ok('3b a field added after the page loaded is named from the words before it',/A box added later/.test(late.box),late);
  /* 2c in the workstation */
  const s=await ctx.newPage();s.on('pageerror',e=>errs.push('shell: '+e.message));
  await s.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);await s.evaluate(()=>openForm('TB-1'));
  await s.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:20000}).catch(()=>{});await sleep(1500);
  const sh=await s.evaluate(()=>{const d=state.frames['TB-1'].contentDocument;const c=[...d.querySelectorAll('input,select,textarea')].filter(e=>e.offsetParent&&e.type!=='hidden'&&e.type!=='file');
    const has=e=>(e.getAttribute('aria-label')||'').trim()||e.getAttribute('aria-labelledby')||(e.id&&d.querySelector('label[for="'+CSS.escape(e.id)+'"]'))||e.closest('label')||(e.getAttribute('title')||'').trim();
    return {n:c.length,unnamed:c.filter(e=>!has(e)).map(e=>e.name||e.id).slice(0,5)};});
  ok('2c TB-1 opened in the workstation: every control on screen has a name',sh.n>10&&!sh.unnamed.length,sh);
  ok('4 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
