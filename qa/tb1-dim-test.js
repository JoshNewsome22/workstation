/* Form TB-1's measurement words (v23.35): the dimension "Count / frequency", with Rate a category of its own; the estimate
   columns "Est. rate (per day)" (v23.41: a number per day is a rate); a file saved with the old "Count / rate" keeps its answer and shows Count / frequency; the
   case and the library picker say Count / frequency; the cluster check keeps count and rate members apart.
   Simulated data only. usage: node qa/tb1-dim-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file('TB-1_'));await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});return p;};
  const p=await open();
  const a=await p.evaluate(()=>{const sel=document.querySelector('[name="tgt[0].dim"]');return {opts:[...sel.options].map(o=>o.text),heads:[...document.querySelectorAll('#candTbl thead th,table.rank thead th')].map(t=>t.textContent).filter(t=>/Est\./.test(t))};});
  ok('1 the dimension list offers Count / frequency and Rate as separate choices, and no "Count / rate"',a.opts.includes('Count / frequency')&&a.opts.includes('Rate')&&a.opts.indexOf('Rate')===a.opts.indexOf('Count / frequency')+1&&!a.opts.some(o=>/Count \/ rate/.test(o)),a.opts);
  ok('2 the candidate list’s and the cluster builder’s estimate columns are "Est. rate (per day)": a number per day is a rate (v23.41)',a.heads.length>=2&&a.heads.every(t=>t==='Est. rate (per day)'),a.heads);
  /* an older file, saved with the old words */
  const saved=await p.evaluate(()=>new Promise(res=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('tgt[0].lab','Hitting (simulated)');s('tgt[0].def','Striking another person with an open or closed hand (simulated).');s('tgt[0].dim','Count / rate');s('tgt[1].lab','Calling out (simulated)');s('tgt[1].dim','Rate');
    const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  ok('3 the stored value stays "Count / rate", so files saved before and after this release read the same',!!saved&&/"tgt\[0\]\.dim": ?"Count \/ rate"/.test(saved),saved&&saved.slice(0,80));
  const q=await open();
  const b=await q.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'TB-1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,900));const e=document.querySelector('[name="tgt[0].dim"]');const o=window.__nbhFactsOut&&window.__nbhFactsOut();
    return {v:e.value,shown:e.options[e.selectedIndex]&&e.options[e.selectedIndex].text,r:document.querySelector('[name="tgt[1].dim"]').value,dims:o&&o.behaviors?o.behaviors.map(x=>x.dim):null};},saved);
  ok('4 a file saved with "Count / rate" opens with its answer kept, shown as Count / frequency; Rate stays Rate',b.v==='Count / rate'&&b.shown==='Count / frequency'&&b.r==='Rate',b);
  ok('5 the case says Count / frequency (and Rate), so Forms FS-1, QS-1 and the rest print the BCBA’s words',JSON.stringify(b.dims)==='["Count / frequency","Rate"]',b.dims);
  await q.emulateMedia({media:'print'});const pr=await q.evaluate(()=>document.querySelector('[name="tgt[0].dim"]').closest('.f,td,div').textContent.replace(/\s+/g,' '));await q.emulateMedia({media:'screen'});
  ok('6 the printed definition card reads Count / frequency',/Count \/ frequency/.test(pr)&&!/Count \/ rate/.test(pr),pr.slice(0,120));
  /* the cluster check */
  const c=await q.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    s('clus[0].top[0].f','Hitting an adult (simulated)');s('clus[0].top[0].d','Count / rate');s('clus[0].top[1].f','Kicking an adult (simulated)');s('clus[0].top[1].d','Rate');
    return document.getElementById('clusVerdict0').textContent;});
  ok('7 the cluster check keeps a count member and a rate member apart, in the BCBA’s words',/Mixed dimensions or sampling methods \(Count \/ frequency; Rate\)\. Split\./.test(c),c.slice(0,300));
  ok('8 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
