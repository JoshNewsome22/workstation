/* v24.16 Form ABC-1 navigation (the 10/25 review): the Analysis's jump links with the reading first and a Contents link on
   each card; the Record tab's Observation header folded to a line once the observation runs; Save incident in the
   observation bar. usage: node qa/abc116-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('load-demo').click();});await sleep(1500);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(1200);
 const nav=await p.evaluate(()=>{const out=document.getElementById('analysis-out');const nav=out.querySelector(':scope > #anNav');const cards=[...out.querySelectorAll(':scope > .card')];
   return {navs:out.querySelectorAll('#anNav').length,first:out.firstElementChild&&out.firstElementChild.id,links:nav?[...nav.querySelectorAll('a')].map(a=>a.textContent):[],firstCard:cards[0]&&cards[0].querySelector('h2').textContent,verdict:cards[0]&&cards[0].classList.contains('an-verdict'),ids:cards.every(c=>c.id),ups:cards.filter(c=>c.querySelector(':scope > header .an-up')).length,cards:cards.length,longest:Math.max(...(nav?[...nav.querySelectorAll('a')].map(a=>a.textContent.length):[0]))};});
 ok('the Analysis opens with one row of jump links (short names), the reading first and marked, every card with an id and a Contents link',
   nav.navs===1&&nav.first==='anNav'&&nav.links.length>=12&&nav.links[0]==='The reading'&&nav.links.includes('Antecedents')&&nav.firstCard==='Reading the record as a whole'&&nav.verdict&&nav.ids&&nav.ups===nav.cards&&nav.longest<=26,nav);
 await p.evaluate(()=>{const a=[...document.querySelectorAll('#anNav a')].find(a=>a.textContent==='Antecedents');a.click();});await sleep(900);
 const jump=await p.evaluate(()=>{const a=[...document.querySelectorAll('#anNav a')].find(a=>a.textContent==='Antecedents');const c=document.getElementById(a.getAttribute('href').slice(1));return {top:Math.round(c.getBoundingClientRect().top),y:Math.round(scrollY),hash:location.hash};});
 ok('a jump link scrolls to its card, under the sticky toolbar, without changing the address',jump.y>2000&&jump.top>=0&&jump.top<=200&&jump.hash==='',jump);
 await p.evaluate(()=>{const a=document.querySelector('#analysis-out .card .an-up');a.click();});await sleep(900);
 const back=await p.evaluate(()=>Math.round(document.getElementById('anNav').getBoundingClientRect().top));
 ok('a card\'s Contents link goes back to the list',back>=0&&back<=200,back);
 await p.evaluate(()=>{const s=document.getElementById('f-abehavior')||document.querySelector('#panel-analysis select');s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
 const again=await p.evaluate(()=>{const out=document.getElementById('analysis-out');return {navs:out.querySelectorAll('#anNav').length,first:out.firstElementChild.id,verdictFirst:/Reading the record/.test(out.querySelector(':scope > .card h2').textContent)};});
 ok('re-rendered with a filter the analysis still has one list and the reading first',again.navs===1&&again.first==='anNav'&&again.verdictFirst,again);
 await p.emulateMedia({media:'print'});
 const pr=await p.evaluate(()=>({nav:getComputedStyle(document.getElementById('anNav')).display,up:getComputedStyle(document.querySelector('#analysis-out .an-up')).display}));
 await p.emulateMedia({media:'screen'});
 ok('neither the list nor the Contents links print',pr.nav==='none'&&pr.up==='none',pr);
 /* the Record tab: the header folds when the observation starts; Save incident in the bar */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="record"]').click();document.getElementById('h-client').value='A.B.';document.getElementById('h-observer').value='Ms. R';document.getElementById('h-location').value='Rm 14';});await sleep(300);
 const before=await p.evaluate(()=>({h:Math.round(document.getElementById('panel-record').getBoundingClientRect().height),folded:document.getElementById('abcHdrCard').classList.contains('abc-folded'),bar:document.getElementById('obsBar').hidden,btn:document.getElementById('abcHdrFold').textContent}));
 await p.evaluate(()=>document.getElementById('obsStart').click());await sleep(800);
 const run=await p.evaluate(()=>({h:Math.round(document.getElementById('panel-record').getBoundingClientRect().height),folded:document.getElementById('abcHdrCard').classList.contains('abc-folded'),sum:document.getElementById('abcHdrSum').textContent,sumShown:!document.getElementById('abcHdrSum').hidden,body:getComputedStyle(document.querySelector('#abcHdrCard > .body')).display,bar:document.getElementById('obsBar').hidden,save:document.getElementById('obsBarSave').offsetWidth>0,btn:document.getElementById('abcHdrFold').textContent,exp:document.getElementById('abcHdrFold').getAttribute('aria-expanded')}));
 ok('when the observation starts the Observation header folds to a summary line (student, observer, setting) and the bar shows Save incident',
   !before.folded&&before.btn==='Hide'&&run.folded&&run.sumShown&&/A\.B\./.test(run.sum)&&/Ms\. R/.test(run.sum)&&/Rm 14/.test(run.sum)&&run.body==='none'&&!run.bar&&run.save&&run.btn==='Show'&&run.exp==='false'&&before.h-run.h>150,{before,run});
 await p.evaluate(()=>document.getElementById('abcHdrSum').click());await sleep(200);
 const open=await p.evaluate(()=>({folded:document.getElementById('abcHdrCard').classList.contains('abc-folded'),btn:document.getElementById('abcHdrFold').textContent,sumShown:!document.getElementById('abcHdrSum').hidden}));
 ok('tapping the summary opens the header again',!open.folded&&open.btn==='Hide'&&!open.sumShown,open);
 await p.evaluate(()=>document.getElementById('obsBarSave').click());await sleep(300);
 const nosave=await p.evaluate(()=>({n:state.entries.length,msg:document.getElementById('obsBarSaved').textContent,bad:document.getElementById('obsBarSaved').classList.contains('bad')}));
 ok('Save incident in the bar with nothing ticked shows the save\'s own message beside it and saves nothing',nosave.n===46&&/at least one behavior/.test(nosave.msg)&&nosave.bad,nosave);
 await p.evaluate(()=>{const cb=document.querySelector('#abc-grid input[id^="b-"]');cb.click();document.getElementById('obsBarSave').click();});await sleep(400);
 const saved=await p.evaluate(()=>({n:state.entries.length,msg:document.getElementById('obsBarSaved').textContent,bad:document.getElementById('obsBarSaved').classList.contains('bad'),cleared:![...document.querySelectorAll('#abc-grid input[type=checkbox]')].some(c=>c.checked)}));
 ok('with a behavior ticked, Save incident in the bar saves it, says so with the count, and the form clears',saved.n===47&&/Saved/.test(saved.msg)&&/47 on file/.test(saved.msg)&&!saved.bad&&saved.cleared,saved);
 await p.evaluate(()=>{document.getElementById('abcTmrFold').click();});await sleep(200);
 const tmr=await p.evaluate(()=>({folded:document.getElementById('obsCard').classList.contains('abc-folded'),body:getComputedStyle(document.querySelector('#obsCard > .body')).display,btn:document.getElementById('abcTmrFold').textContent}));
 ok('the Timer card folds by hand too',tmr.folded&&tmr.body==='none'&&tmr.btn==='Show',tmr);
 await p.evaluate(()=>{document.getElementById('abcTmrFold').click();document.getElementById('obsEnd').click();});await sleep(500);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
