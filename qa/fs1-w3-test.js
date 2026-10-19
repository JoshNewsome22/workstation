/* Form FS-1, review Wave 3 part 1: a synthesized (IISCA) result is recorded and counts (F168); each source names its target and each
   target's level comes from its own sources (F169); a disagreement lowers a level only from the same tier or better (F170); the
   Guide stays off the report and prints on its own (F172); Unknown counts as assessed only from a test (F173); the levels are named
   by design (F174); the example's second consequence is the escape it reports (F177). Simulated data only.
   usage: node qa/fs1-w3-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),FSF=fs.readdirSync(L.ROOT+'/NBH-Workstation').find(f=>f.startsWith('FS-1_'));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+FSF);await sleep(1000);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const p=await open();
  /* ---- F168 ---- */
  const a=await p.evaluate(()=>{window.__nbhFactsIn({evidence:{'EA-1':{form:'EA-1',method:'Functional analysis (IISCA, multielement)',fn:'Synthesized contingencies (multiple)',fnKey:'multiple',strength:'Strong',statement:'Differentiated: synthesized test meets the rule.',n:10}}});
    const r=S.src.find(x=>x.form==='EA-1'),E=evidence();S.beh[0].lab='Aggression (simulated)';S.beh[0].fn=r.fn;S.beh[0].ant='a demand';S.beh[0].cons='a break with the tablet and adult attention';
    return {fn:r.fn,band:E.band,top:E.top&&E.top.fn,stmt:stmtText(S.beh[0]),key:window.__nbhFactsOut().fn.key};});
  ok('1 F168 an IISCA\'s synthesized result is recorded as such, counts at level 1, and reaches the case as more than one function',
    a.fn==='Synthesized / more than one (as tested)'&&a.band===1&&a.top===a.fn&&/The function is a synthesized contingency \(the consequences tested together\) \(level 1, demonstrated\)\.$/.test(a.stmt)&&a.key==='multiple',a);
  /* ---- F169 ---- */
  const b=await p.evaluate(()=>{S=blank();ensure();S.beh=[newBeh(),newBeh()];const [g,h]=S.beh;
    Object.assign(g,{lab:'Aggression (simulated)',fn:'Escape / avoidance (social negative)',ant:'a demand',cons:'the demand removed'});
    Object.assign(h,{lab:'Head hitting (simulated)',fn:'Automatic (nonsocial)',ant:'time alone',cons:'the sensation it produces'});
    S.src=[{form:'EA-1',method:'Functional analysis, analogue conditions',fn:'Automatic (nonsocial)',str:'Strong',tgt:h.id,contrib:'',dates:'',who:''},
      {form:'ABC-1',method:'Structured descriptive with conditional probabilities',fn:'Escape / avoidance (social negative)',str:'Moderate',tgt:g.id,contrib:'',dates:'',who:''},
      {form:'SP-1',method:'Scatter plot / temporal pattern analysis',fn:'Escape / avoidance (social negative)',str:'Moderate',tgt:g.id,contrib:'',dates:'',who:''},
      {form:'IA-1',method:'Indirect: structured interview or rating scale',fn:'Escape / avoidance (social negative)',str:'Moderate',tgt:g.id,contrib:'',dates:'',who:''}];
    renderAll();const rep=document.getElementById('reportOut').textContent,box=document.getElementById('confBox').textContent;
    return {sh:stmtText(h),sg:stmtText(g),rep,box,cols:[...document.querySelector('#srcTbl thead tr').cells].map(c=>c.textContent),
      opts:[...document.querySelectorAll('#srcTbl tbody tr')[0].querySelectorAll('select')[1].options].map(o=>o.textContent),conv:document.querySelectorAll('#convNote table').length};});
  ok('2 F169 each source names its target; head hitting\'s statement stands on its own functional analysis (level 1), aggression\'s on its descriptive sources (level 2)',
    b.cols.includes('Target')&&b.opts.join('|')==='All targets|Aggression (simulated)|Head hitting (simulated)'&&/The function is automatic \(level 1, demonstrated\)\.$/.test(b.sh)&&
    /The hypothesized function is escape \/ avoidance, consistent with the descriptive record and not yet tested \(level 2\)\.$/.test(b.sg),b);
  ok('3 F169 the findings, the level box and the convergence table are written per target, without one target\'s sources outvoting the other\'s',
    /Head hitting \(simulated\)\. Across 1 source that assessed function for this target, 1 supports Automatic/.test(b.rep)&&/Aggression \(simulated\)\. Across 3 sources that assessed function for this target, 3 support Escape/.test(b.rep)&&
    !/more than this function/.test(b.rep)&&/Head hitting \(simulated\): level 1 — Function demonstrated\./.test(b.box)&&b.conv===2,b);
  /* ---- F170 ---- */
  const c=await p.evaluate(()=>{S=blank();ensure();S.beh[0].lab='Aggression (simulated)';S.beh[0].fn='Escape / avoidance (social negative)';
    const row=(m,f,s)=>({form:'',method:m,fn:f,str:s,tgt:'',contrib:'',dates:'',who:''});
    S.src=[row('Functional analysis, analogue conditions','Escape / avoidance (social negative)','Strong')].concat([1,2,3].map(()=>row('Indirect: structured interview or rating scale','Attention (social positive)','Moderate')));
    renderAll();const A={E:evidence(),box:document.getElementById('confBox').textContent,rep:document.getElementById('reportOut').textContent};
    S.src=[row('Functional analysis, analogue conditions','Escape / avoidance (social negative)','Strong'),row('Indirect: structured interview or rating scale','Escape / avoidance (social negative)','Contradicts')];
    renderAll();const D={E:evidence(),box:document.getElementById('confBox').textContent};
    S.src=[row('Functional analysis, analogue conditions','Escape / avoidance (social negative)','Strong'),row('Functional analysis, trial-based or IISCA','Escape / avoidance (social negative)','Contradicts')];
    renderAll();const X={E:evidence(),box:document.getElementById('confBox').textContent};
    return {a:A.E.band,abox:A.box,arep:A.rep,d:D.E.band,dbox:D.box,x:X.E.band,xbox:X.box};});
  ok('4 F170 three interviews naming attention do not lower a functional analysis that demonstrated escape; the disagreement is named',
    c.a===1&&/The disagreement from a lower tier \(Attention \(social positive\) with more supporting sources \(3 against 1\)\) is recorded and weighed; it does not lower a level reached by a stronger design\./.test(c.abox)&&/all from a lower tier, so the level stands/.test(c.arep),c);
  ok('5 F170 an interview marked Contradicts does not lower it either; a second functional analysis that contradicts it does',
    c.d===1&&/The disagreement from a lower tier \(1 contradicting source\)/.test(c.dbox)&&c.x===2&&/Reduced from level 1, the tier of its strongest design, because 1 source at the same tier or better contradicts it\./.test(c.xbox),c);
  /* ---- the example: F173, F174, F177 ---- */
  await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(900);
  const d=await p.evaluate(()=>({rep:document.getElementById('reportOut').textContent,box:document.getElementById('confBox').textContent,conv:document.getElementById('convNote').textContent,
    dd:S.src.find(r=>/Daily rate/.test(r.method)),cons:S.beh[1].cons,E:evidence()}));
  ok('6 F173 a daily count is not a source that assessed function: the example counts 7, not 8',d.dd.fn===''&&d.E.nSrc===7&&/Aggression toward staff\. Across 7 sources that assessed function for this target, 6 support/.test(d.rep),{rep:d.rep.slice(0,900),n:d.E.nSrc});
  ok('7 F174 the levels are named by what the design shows, never as a confidence',/Aggression toward staff: level 2 — Contingency described, not tested\./.test(d.box)&&/level 2 conclusion \(contingency described, not tested\)/.test(d.rep)&&!/confidence\)/.test(d.rep)&&
    /The hypothesized function is escape \/ avoidance, consistent with the descriptive record and not yet tested \(level 2\)\./.test(d.rep),d.box);
  ok('8 F177 the example\'s head hitting produces the escape its statement reports',d.cons==='a pause in the demand'&&!/adult moving closer/.test(d.rep),d.cons);
  const u=await p.evaluate(()=>{const r=S.src.find(r=>/Daily rate/.test(r.method));r.fn='Unknown – record separately';renderAll();
    return {n:evidence().nSrc,conv:document.getElementById('convNote').textContent};});
  ok('9 F173 Unknown on a daily-rate record is listed, not counted',u.n===7&&/Recorded as Unknown, but a descriptive, daily-rate or indirect record cannot show that no function operates, so listed and not counted among the sources that assessed function: DD-1\./.test(u.conv),u);
  /* ---- F172 ---- */
  await p.emulateMedia({media:'print'});
  const pr=await p.evaluate(()=>{const g=document.querySelector('section.only-guide'),r=document.querySelector('section.only-rep');const a={guide:getComputedStyle(g).display,rep:getComputedStyle(r).display};
    document.body.classList.add('fs-print-guide');const b={guide:getComputedStyle(g).display,rep:getComputedStyle(r).display};document.body.classList.remove('fs-print-guide');
    return {a,b,nodes:window.nbhPrintNodes().map(n=>n.className),btn:!!document.getElementById('printGuideBtn')};});
  await p.emulateMedia({media:'screen'});
  ok('10 F172 the Guide stays off the printed report and the packet, and Print the guide prints it alone',pr.a.guide==='none'&&pr.a.rep==='block'&&pr.b.guide==='block'&&pr.b.rep==='none'&&pr.nodes.join()==='only-setup,only-ev,only-beh,only-path,only-rep'&&pr.btn,pr);
  ok('11 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
