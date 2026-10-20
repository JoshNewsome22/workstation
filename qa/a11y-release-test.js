/* v23.60 (review Wave 4, I246): an accessibility check in the release run, so a release can be said to meet WCAG 2.1 AA
   with evidence, and a regression like the zoom setting is caught the day it is made.
   1. axe-core's WCAG 2.1 A and AA rules on the workstation (empty, a form open, Help, Caseload), on every form with its
      simulation loaded, and on the pages families and staff answer on (respond.html, staff-data.html): no critical or
      serious problem, except those qa/a11y-known.json lists with the reason each is accepted. The rest (moderate, minor)
      are counted in qa/out/a11y/summary.txt.
   2. Every check the review's accessibility findings were fixed with is in the release list: names in tables and the
      questionnaire page (F485, F486), arrow keys and Autosave's announcements (F487, F491), Tab and Shift+Tab (F489,
      F490, F492), the screens (F493, F494), zoom (F488), one naming routine (I247).
   Needs axe-core: npm install in qa (qa/package.json), or NODE_PATH naming a folder that has it.
   usage: node qa/a11y-release-test.js   env ONLY=TB-1,DM-1 for some forms */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;const path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const OUT=path.join(__dirname,'out','a11y');fs.mkdirSync(OUT,{recursive:true});
const only=(process.env.ONLY||'').split(',').filter(Boolean);
let AXE=null,AXEV='';try{const p=require.resolve('axe-core/axe.min.js',{paths:[__dirname,path.join(__dirname,'node_modules')].concat((process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean))});
  AXE=fs.readFileSync(p,'utf8');AXEV=JSON.parse(fs.readFileSync(path.join(path.dirname(p),'package.json'),'utf8')).version;}catch(e){}
const KNOWN=JSON.parse(fs.readFileSync(path.join(__dirname,'a11y-known.json'),'utf8')).accepted||[];
const known=(page,rule)=>KNOWN.some(k=>k.rule===rule&&(k.page==='*'||k.page===page));
async function axe(p){await p.addScriptTag({content:AXE});
  return p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},iframes:false,resultTypes:['violations']});
    return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,at:v.nodes.slice(0,3).map(x=>x.target.join(' ')+': '+String(x.failureSummary||'').split('\n')[1])}));});}
(async()=>{
  if(!AXE){ok('axe-core is installed (npm install in qa, or NODE_PATH)',false,'not found');console.log('RESULT: 1 failed');process.exit(1);}
  const br=await L.chromium.launch();const res={},errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',bypassCSP:true});   /* respond.html and staff-data.html allow only their own scripts; axe is added by the test */await ctx.addInitScript(()=>{window.print=function(){};});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  if(!only.length){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push('index: '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(900);res['index: empty']=await axe(p);
    await p.evaluate(()=>openForm('TB-1'));await p.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:20000}).catch(()=>{});await sleep(600);res['index: a form open']=await axe(p);
    await p.click('#help').catch(()=>{});await sleep(500);res['index: Help']=await axe(p);await p.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
    await p.click('#caseloadBtn').catch(()=>{});await sleep(900);res['index: Caseload']=await axe(p);
    await p.close();}
  for(const f of L.forms().filter(x=>!only.length||only.includes(x.id))){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.id+': '+e.message));
    try{await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file),{waitUntil:'load'});await sleep(700);await L.loadSim(p);await sleep(1400);res[f.id]=await axe(p);}
    catch(e){res[f.id]=[{id:'could-not-run',impact:'critical',n:1,help:String(e).slice(0,160),at:[]}];}
    await p.close();}
  if(!only.length)for(const u of ['respond.html','staff-data.html']){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(u+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+u,{waitUntil:'load'});await sleep(900);res[u]=await axe(p);await p.close();}
  /* 1. the results */
  const bad=[],acc=[],soft={};
  for(const [pg,vs] of Object.entries(res))for(const v of vs){
    if(v.impact==='critical'||v.impact==='serious'){(known(pg,v.id)?acc:bad).push(pg+': '+v.id+' ('+v.impact+') x'+v.n+' — '+v.help+(v.at.length?' — '+v.at.join(' | '):''));}
    else soft[v.id]=(soft[v.id]||0)+v.n;}
  fs.writeFileSync(path.join(OUT,'summary.txt'),'axe-core '+AXEV+', WCAG 2.1 A and AA, '+Object.keys(res).length+' pages\n\nNot accepted:\n'+(bad.join('\n')||'none')+
    '\n\nAccepted (qa/a11y-known.json):\n'+(acc.join('\n')||'none')+'\n\nModerate and minor, by rule (nodes):\n'+(Object.entries(soft).map(([k,n])=>k+' '+n).join('\n')||'none')+'\n');
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(res,null,1));
  ok('1 axe-core '+AXEV+' (WCAG 2.1 A, AA) on '+Object.keys(res).length+' pages: no critical or serious problem but those qa/a11y-known.json accepts ('+acc.length+' accepted)',Object.keys(res).length>=(only.length||50)&&!bad.length,bad);
  /* 2. the review's findings stay checked */
  const list=fs.readFileSync(path.join(__dirname,'release-list.txt'),'utf8');
  const need=['v2209-names-test','v2206-version-test','v2207-keys-test','v2218-screens-test','w4-zoom-typing-test','v2175-test','i247-names-test'];
  const miss=need.filter(t=>!new RegExp('^'+t+'(\\.js)?\\b','m').test(list)||!fs.existsSync(path.join(__dirname,t+'.js')));
  ok('2 every check the review\'s accessibility findings were fixed with is in the release list ('+need.length+')',!miss.length,miss);
  ok('3 no page errors',!errs.length,errs.slice(0,5));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
