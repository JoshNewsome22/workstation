/* v24.06 Form ABC-1: the student's own target behaviors (Form TB-1's) on the paper sheet and kept out of the walkthrough.
   The paper sheet prints the defined targets first, bold, tagged TB-1, with their definitions, still on one page; the
   walkthrough's example carries its own defined target and never the record's, and the example's target never reaches the
   record or the paper sheet. usage: node qa/abc106-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 await p.goto(URL);await sleep(1500);
 /* two targets defined on Form TB-1 reach the form (as the case packet brings them) */
 const scr=await p.evaluate(()=>{const n=abcAddTargets([{label:'Hitting peers with an open hand',def:'Open-hand contact with a peer with enough force to be heard across the room.'},{label:'Leaving the classroom without permission',def:'Crosses the door threshold without an adult’s permission.'}]);
   const g=document.querySelector('#abc-grid');return {added:n,tags:[...g.querySelectorAll('.abc-tb')].length,first:BEHAVIORS[0].id};});
 ok('the targets join the Record tab\'s Target behavior list first, tagged TB-1 (as before)',scr.added===2&&scr.tags===2&&/^tb_hitting/.test(scr.first),scr);
 const paper=await p.evaluate(()=>{const out={};for(const k of ['blank','sample']){const d=document.createElement('div');d.innerHTML=abcPaper.html(k);const grp=[...d.querySelectorAll('.ap-col')][1].querySelector('.ap-grp');const opts=[...grp.querySelectorAll('.ap-opt')];
     out[k]={head:grp.querySelector('h5').textContent,first:opts.slice(0,2).map(o=>({id:o.dataset.id,tb:o.classList.contains('ap-tb'),bold:!!o.querySelector('b'),tag:(o.querySelector('.ap-tbtag')||{}).textContent,def:(o.querySelector('.ap-def')||{}).textContent})),third:opts[2].dataset.id,thirdTb:opts[2].classList.contains('ap-tb'),n:opts.length,tbN:grp.querySelectorAll('.ap-tb').length};}return out;});
 const B=paper.blank;
 ok('the paper sheet prints the defined targets first, bold, tagged TB-1, with their definitions, and the heading says so; the coded list follows unmarked',
   /defined on Form TB-1 first/.test(B.head)&&B.first[0].id==='tb_hitting_peers_with_an_open_h'&&B.first[0].tb&&B.first[0].bold&&B.first[0].tag==='TB-1'&&/Open-hand contact/.test(B.first[0].def)&&B.first[1].tb&&/door threshold/.test(B.first[1].def)&&B.third==='b_agg_staff'&&!B.thirdTb&&B.tbN===2&&B.n===22&&paper.sample.tbN===2,paper);
 /* still one page each, with two defined targets on it */
 const pages={};for(const k of ['blank','sample']){await p.evaluate(k=>{document.querySelector('#abcPaper').innerHTML=abcPaper.html(k);document.documentElement.classList.add('abc-paper');},k);await p.emulateMedia({media:'print'});
   pages[k]=await p.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap');return {h:ap.getBoundingClientRect().height,w:ap.getBoundingClientRect().width};});await p.emulateMedia({media:'screen'});await p.evaluate(()=>{document.documentElement.classList.remove('abc-paper');document.querySelector('#abcPaper').innerHTML='';});}
 ok('each sheet is still one Letter page tall with the defined targets and their definitions on it',Object.values(pages).every(x=>x.h>0&&x.h<=922),pages);
 /* the walkthrough: its own defined target, never the record's; nothing of the example reaches the record */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const w=await p.evaluate(()=>{const st=document.querySelector('#wkStage'),P=[...st.querySelectorAll('.abw-pg')];const grp=P[0].querySelectorAll('.ap-col')[1].querySelector('.ap-grp');const tb=grp.querySelector('.ap-tb');
   const c=TKWALK.cues.find(c=>c.id==='beh');TKWALK.renderAt(c.start+c.dur-.2);const on=tb&&tb.classList.contains('on');TKWALK.renderAt(0);
   const d=document.createElement('div');d.innerHTML=abcPaper.html('blank');
   return {leak:/Hitting peers|Leaving the classroom|door threshold/.test(st.textContent),leakTx:/Hitting peers|Leaving the classroom/.test(document.querySelector('#wkTx').textContent),
     own:tb&&tb.dataset.id,ownLabel:tb&&tb.querySelector('b').textContent,ownDef:tb&&/10 seconds/.test(tb.textContent),tbN:grp.querySelectorAll('.ap-tb').length,on,line:/defined on Form TB-1, are printed first/.test(c.text),
     recordHas:BEHAVIORS.some(b=>b.id==='tb_sample'),paperHas:/tb_sample|Screaming and crying/.test(d.innerHTML),recordTb:BEHAVIORS.filter(b=>b.caseT).length};});
 ok('the walkthrough\'s example shows its own defined target (Screaming and crying, tagged, with a definition), ticked in the behavior line whose narration says the defined targets print first; the record\'s target names are nowhere in it',
   !w.leak&&!w.leakTx&&w.own==='tb_sample'&&w.ownLabel==='Screaming and crying'&&w.ownDef&&w.tbN===1&&w.on&&w.line,w);
 ok('the example\'s target never reaches the record or its paper sheet',!w.recordHas&&!w.paperHas&&w.recordTb===2,w);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
