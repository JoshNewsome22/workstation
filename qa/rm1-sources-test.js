/* Form RM-1's sources say only what can be checked (v23.50): Lattal (1968), an unpublished experiment on behavioral
   contrast, is cited for contrast as Lattal & Miles (2024) describe it, not for resurgence; the unchecked "29%" for
   Neely et al. (2018) is gone and the review is named for what it covers; both cited works are in the References.
   usage: node qa/rm1-sources-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=fs.readdirSync(dir).find(f=>f.startsWith('RM-1_'));
  const p=await (await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(900);
  const r=await p.evaluate(()=>({src:[...document.querySelectorAll('table.mit td.src')].map(t=>t.textContent),body:document.body.textContent}));
  const lean=r.src.find(t=>/gradual leaning/.test(t))||'',com=r.src.find(t=>/programming common stimuli/.test(t))||'';
  ok('1 gradual leaning: resurgence from Ho et al. and Jarmolowicz & Lattal; Lattal (1968) for behavioral contrast, as cited in Lattal & Miles (2024)',
    /resurgence eventually \(Ho et al\., 2018; Jarmolowicz & Lattal, 2014\), and an unpublished experiment found the same for behavioral contrast \(Lattal, 1968, as cited in Lattal & Miles, 2024\)\./.test(lean),lean);
  ok('2 common stimuli: no unchecked figure (v24.48: the 29% as Kimball et al., 2023, report it), and Neely et al. (2018) named for what it reviews',/Stokes & Baer, 1977\); for how FCT studies have tested generalization and maintenance, see Neely et al\. \(2018\)\./.test(com)&&(!/29%/.test(com)||/Kimball et al\. \(2023\) report from that review that only 29% of the FCT studies used this tactic\./.test(com)),com);   /* v24.48 the figure back, as the review the BCBA sent reports it */
  ok('3 both cited works are in the References; Lattal (1968) is not listed on its own',/Lattal, K\. A\., & Miles, A\. K\. \(2024\)\. Resurgence and behavioral contrast/.test(r.body)&&/Neely, L\., Garcia, E\., Bankston, B\., & Green, A\. \(2018\)/.test(r.body)&&!/Lattal, K\. A\. \(1968\)/.test(r.body));
  ok('4 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
