/* v24.08 Form ABC-1: under the student's defined target behaviors the paper sheet's coded list is seven common codes and Other;
   a sheet with no defined targets keeps the whole list; a code named like a defined target is left out; the walkthrough's
   example follows. usage: node qa/abc108-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 await p.goto(URL);await sleep(1500);
 const list=k=>{const d=document.createElement('div');d.innerHTML=abcPaper.html(k);const g=d.querySelectorAll('.ap-col')[1].querySelector('.ap-grp');return {ids:[...g.querySelectorAll('.ap-opt')].map(o=>o.dataset.id),head:g.querySelector('h5').textContent};};
 const none=await p.evaluate(list,'blank');
 ok('with no defined targets the sheet keeps the whole coded list (20 codes, Other last)',none.ids.length===20&&none.ids[0]==='b_agg_staff'&&none.ids[19]==='b_other'&&!/TB-1/.test(none.head),none);
 await p.evaluate(()=>abcAddTargets([{label:'Head banging against surfaces',def:'Contact of any part of the head with a surface.'},{label:'Elopement',def:'Leaves the supervised area.'}]));
 const some=await p.evaluate(list,'blank');
 ok('with two defined targets the list is the targets, then seven common codes and Other; the code named like a defined target (Elopement) is left out; the heading names the defined targets',
   some.ids.length===9&&/^tb_head/.test(some.ids[0])&&some.ids[1]==='tb_elopement'&&some.ids.slice(2).join()==='b_agg_staff,b_agg_peer,b_nssi,b_prop_others,b_disrupt,b_lowcomp,b_other'&&/defined on Form TB-1 first/.test(some.head),some);
 const samp=await p.evaluate(list,'sample');
 ok('the sample sheet prints the same short list',samp.ids.length===9&&samp.ids[2]==='b_agg_staff',samp);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const w=await p.evaluate(()=>{const g=document.querySelector('#wkStage .abw-pg').querySelectorAll('.ap-col')[1].querySelector('.ap-grp');return [...g.querySelectorAll('.ap-opt')].map(o=>o.dataset.id);});
 ok('the walkthrough\'s example shows its own defined target and the short list',w.length===9&&w[0]==='tb_sample'&&w[8]==='b_other'&&!w.some(x=>/^tb_head|tb_elopement/.test(x)),w);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
