/* v25.67 (the BCBA, 11/6: "make sure that it scores just like the original studies intended"): on the questionnaire a parent or
   teacher answers, each instrument's own uncertain or not-applicable answer keeps its meaning, and its value and scoring:
   - QABF (Matson & Vollmer, 1995): 0 never, 1 rarely, 2 some, 3 often, and "Does not apply" (the X), not "Not sure"; sent as NA,
     which IA-1 reads as blank (adds nothing to the subscale);
   - FAST (Iwata, DeLeon & Roscoe, 2013): Yes, No and "Not sure" (the N/A, for "a lack of information or that the question is
     not applicable"), sent as NA, which IA-1 reads as N/A (left out of agreement; only Yes is counted);
   - MAS, PBQ and CF-1: no uncertain answer, as before. Simulated data only. */
const {chromium,fs,path,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(!c&&i!==undefined?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const G=JSON.parse(fs.readFileSync(path.join(__dirname,'data','respond-golden.json'),'utf8'));
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
(async()=>{const br=await chromium.launch();const errs=[];
 try{
  const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE,serviceWorkers:'block'});
  const base=await ctx.newPage();base.on('pageerror',e=>errs.push(e.message));await base.goto(BASE+'/NBH-Workstation/respond.html');await sleep(500);
  const fast=JSON.parse(JSON.stringify(G['IA-1'].payload));
  const make=(over)=>{const p=Object.assign(JSON.parse(JSON.stringify(fast)),over);return p;};
  const items=[1,2,3,4,5].map(n=>({n,text:'Simulated item '+n+' (the instrument’s wording is not reproduced here).'}));
  const pages={
    qabf:make({inst:'qabf',title:'QABF',heading:'Questions About Behavioral Function (QABF)',items,scale:{kind:'num',min:0,max:3,anchors:['0 never','1 rarely','2 some','3 often'],na:true,naLabel:'X: does not apply'},
      instructions:'Rate how often the student shows the behavior in each situation. Choose N/A when the question does not apply.'}),
    fast:fast,
    mas:make({inst:'mas',title:'MAS',heading:'Motivation Assessment Scale (MAS)',items,scale:{kind:'num',min:0,max:6,anchors:['0 never','1 almost never','2 seldom','3 half the time','4 usually','5 almost always','6 always']}})};
  const R={};
  for(const [k,pl] of Object.entries(pages)){
    const hash=await base.evaluate(x=>NBH_RESPOND.payloadToHash(x),pl);
    const q=await ctx.newPage();q.on('pageerror',e=>errs.push(k+': '+e.message));await q.goto(BASE+'/NBH-Workstation/respond.html'+hash);await sleep(700);
    R[k]=await q.evaluate(()=>{const li=document.querySelector('li.it');const labs=li?[...li.querySelectorAll('.opts label')]:[];
      return {choices:labs.map(l=>l.textContent.trim()).join('|'),last:(labs.length?labs[labs.length-1].querySelector('input').value:''),key:(document.querySelector('.key')||{}).textContent||'',
        instr:[...document.querySelectorAll('.nr-card .sub')].map(e=>e.textContent).join(' ')};});
    /* answer the first item with the last choice and read what would be sent */
    R[k].sent=await q.evaluate(()=>{const li=document.querySelector('li.it');if(!li)return null;const ins=li.querySelectorAll('.opts input');const r=ins[ins.length-1];r.checked=true;r.dispatchEvent(new Event('change',{bubbles:true}));
      try{return (window.__nbhRespondLast||null);}catch(e){return null;}});
    await q.close();}
  ok('1 QABF: 0, 1, 2, 3 and "Does not apply" (the X), not "Not sure"',R.qabf.choices==='0|1|2|3|Does not apply',R.qabf);
  ok('2 QABF: "Does not apply" is sent as NA, as the X was',R.qabf.last==='NA',R.qabf);
  ok('3 QABF: the key explains it, and the instructions say "Does not apply", not N/A or "Not sure"',/Does not apply: the question does not fit this student/.test(R.qabf.key)&&/“Does not apply”/.test(R.qabf.instr)&&!/N\/A|Not sure/.test(R.qabf.instr),R.qabf);
  ok('4 FAST: Yes, No and "Not sure" (its N/A), sent as NA',R.fast.choices==='Yes|No|Not sure'&&R.fast.last==='NA',R.fast);
  ok('5 FAST: the key says "Not sure" also covers a question that does not apply (Iwata et al., 2013)',/Not sure: you do not know, or the question does not apply/.test(R.fast.key),R.fast.key);
  ok('6 MAS: 0 to 6 and no uncertain answer, as before',R.mas.choices==='0|1|2|3|4|5|6',R.mas);
  /* IA-1 reads them as the instruments intend (its own reader, gfValue, taken from the form): QABF X blank (adds nothing to the
     subscale), FAST N/A as NA (left out of agreement; only Yes is counted) */
  const src=fs.readFileSync(path.join(__dirname,'..','NBH-Workstation','IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html'),'utf8');
  const fn=src.slice(src.indexOf('function gfValue(key,raw){'),src.indexOf('function gfAnalyze(text){'));
  const gfValue=new Function('INST',fn+';return gfValue;')({qabf:{scale:3},mas:{scale:6},pbq:{scale:6}});
  const rd={qx:gfValue('qabf','X: does not apply'),qna:gfValue('qabf','NA'),q2:gfValue('qabf','2'),fna:gfValue('fast','NA'),fns:gfValue('fast','Not sure'),fy:gfValue('fast','Y')};
  ok('7 IA-1 reads the QABF X (sent as NA) as blank and the FAST N/A (sent as NA) as NA',rd.qx===''&&rd.qna===''&&rd.q2==='2'&&rd.fna==='NA'&&rd.fns==='NA'&&rd.fy==='Y',rd);
  ok('8 no page errors',errs.length===0,errs);
 }catch(e){ok('run',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
