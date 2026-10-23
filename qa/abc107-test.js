/* v24.07 Form ABC-1, the paper sheet as an iPad prints it: text autosizing off on the sheet, the narrative's ruled lines as
   elements (no gradient), the check interval its own field, the intensity legend on one line; still one page with defined
   targets and a long target on it; the walkthrough still writes its narrative. usage: node qa/abc107-test.js */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(JSON.stringify(m.location())))errs.push('console: '+m.text());});
 await p.goto(URL);await sleep(1500);
 await p.evaluate(()=>{abcAddTargets([{label:'Hitting peers with an open hand',def:'Open-hand contact with a peer with enough force to be heard across the room.'},{label:'Leaving the classroom without permission',def:'Crosses the door threshold without an adult’s permission.'}]);
   document.querySelector('#h-client').value='A. Student (simulated)';document.querySelector('#h-target').value='Head banging against surfaces; hitting peers';document.querySelector('#h-window').value='20';document.querySelector('#h-checks').value='fixed:5';readHeader();});
 const sheet=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=abcPaper.html('sample');const L=d.querySelector('.ap-lines');const row2=d.querySelector('.ap-id2');
   return {ln:L.querySelectorAll('.ap-ln').length,txt:L.querySelector('.ap-txt')&&/Teacher put the math sheet/.test(L.querySelector('.ap-txt').textContent),row2:[...row2.querySelectorAll('.ap-f b')].map(b=>b.textContent),check:[...row2.querySelectorAll('.ap-f')].find(f=>/^Check interval/.test(f.textContent)).querySelector('span').textContent,win:[...row2.querySelectorAll('.ap-f')].find(f=>/^Consequence window/.test(f.textContent)).querySelector('span').textContent,legend:!!row2.querySelector('.ap-lg')};});
 ok('the narrative box is five ruled lines (elements) with the text laid over them; the check interval is its own field beside the consequence window; the legend has its class',
   sheet.ln===5&&sheet.txt&&sheet.row2.join('|')==='Adult within view|Peak intensity|Consequence window|Check interval'&&sheet.check==='Every 5 minutes'&&sheet.win==='20 s'&&sheet.legend,sheet);
 const pages={};for(const k of ['blank','sample','bg']){await p.evaluate(k=>{document.querySelector('#abcPaper').innerHTML=abcPaper.html(k);document.documentElement.classList.add('abc-paper');},k);await p.emulateMedia({media:'print'});
   pages[k]=await p.evaluate(()=>{const ap=document.querySelector('#abcPaper .ap'),cs=getComputedStyle(ap),L=ap.querySelector('.ap-lines');return {h:ap.getBoundingClientRect().height,tsa:cs.getPropertyValue('-webkit-text-size-adjust')||cs.textSizeAdjust,bg:L?getComputedStyle(L).backgroundImage:'none',lnH:L?L.querySelector('.ap-ln').getBoundingClientRect().height:0,legendLines:(()=>{const s=ap.querySelector('.ap-lg');return s?Math.round(s.getBoundingClientRect().height/10):0;})()};});await p.emulateMedia({media:'screen'});await p.evaluate(()=>{document.documentElement.classList.remove('abc-paper');document.querySelector('#abcPaper').innerHTML='';});}
 ok('printed, the sheet has text autosizing off (declared none; Chromium reports it as 100%), the ruled lines carry no gradient, and each sheet is still one Letter page with two defined targets and a long target on it',
   Object.values(pages).every(x=>x.h>0&&x.h<=922&&/^(none|100%)$/.test(x.tsa))&&/\.ap\{-webkit-text-size-adjust:none!important/.test(require('fs').readFileSync(ROOT+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html','utf8'))&&pages.blank.bg==='none'&&pages.blank.lnH>12&&pages.blank.legendLines<=1,pages);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());
 await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:30000}).catch(()=>{});await sleep(1500);
 const w=await p.evaluate(()=>{const st=document.querySelector('#wkStage');const c=TKWALK.cues.find(c=>c.id==='narr');TKWALK.renderAt(1);const t0=st.querySelector('.ap-lines .ap-txt').textContent.length;TKWALK.renderAt(c.start+c.dur-.2);const t1=st.querySelector('.ap-lines .ap-txt').textContent;TKWALK.renderAt(0);
   return {t0,full:/Teacher put the math sheet/.test(t1)&&/No peers reacted/.test(t1),lines:st.querySelectorAll('.ap-lines .ap-ln').length};});
 ok('the walkthrough writes its narrative over the ruled lines, sentence by sentence, and it is gone again at 0',w.t0===0&&w.full&&w.lines===5,w);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
