/* v24.18 Form TD-1 navigation (the 10/25 review): the Build sheet's component list and folding cards; Package Summary links;
   the planners folded while not in use; the Final plan's section links. usage: node qa/td118-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 /* a fresh form: the planners fold while not in use */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="antecedent"]').click());await sleep(500);
 const pl=await p.evaluate(()=>{const w=document.getElementById('hpPlanWrap');const tbl=w.querySelector('table');return {empty:w.dataset.empty,note:getComputedStyle(w.querySelector('.td-plfold')).display,tbl:tbl?getComputedStyle(tbl).display:'none',h3:getComputedStyle(w.querySelector('h3.sub')).display};});
 ok('on a fresh form the high-p planner shows its heading and a "not in this plan yet" line, its tables folded away',pl.empty==='1'&&pl.note!=='none'&&pl.tbl==='none'&&pl.h3!=='none',pl);
 await p.evaluate(()=>document.querySelector('#hpPlanWrap .td-plshow').click());await sleep(200);
 const pl2=await p.evaluate(()=>{const w=document.getElementById('hpPlanWrap');return {open:w.classList.contains('td-open'),tbl:getComputedStyle(w.querySelector('table')).display,note:getComputedStyle(w.querySelector('.td-plfold')).display};});
 ok('Show the planner opens it',pl2.open&&pl2.tbl!=='none'&&pl2.note==='none',pl2);
 await p.reload();await sleep(1500);
 await p.evaluate(()=>{td117.add('A_HIGHP');document.querySelector('#viewSeg [data-view="antecedent"]').click();});await sleep(600);
 const pl3=await p.evaluate(()=>{const w=document.getElementById('hpPlanWrap');return {empty:w.dataset.empty,tbl:getComputedStyle(w.querySelector('table')).display,note:getComputedStyle(w.querySelector('.td-plfold')).display};});
 ok('with the high-p card on Build the planner is open by itself',pl3.empty==='0'&&pl3.tbl!=='none'&&pl3.note==='none',pl3);
 /* the worked example: Build's list and folding cards */
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1500);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="build"]').click());await sleep(500);
 const bl=await p.evaluate(()=>{const nav=document.getElementById('tdCompList');const cards=[...document.querySelectorAll('#compWrap .card')];return {hidden:nav.hidden,links:[...nav.querySelectorAll('a')].map(a=>a.getAttribute('href')),ids:cards.map(c=>'#'+c.id),btns:[...nav.querySelectorAll('button')].map(b=>b.textContent),fold:cards.every(c=>c.querySelector('.td-cfold')&&c.querySelector('.td-cfold').textContent==='Hide steps')};});
 ok('Build lists every card with a link to it, Fold all and Open all, and each card has Hide steps',!bl.hidden&&bl.links.length===bl.ids.length&&bl.links.join()===bl.ids.join()&&bl.btns.join('|')==='Fold all|Open all'&&bl.fold,bl);
 await p.evaluate(()=>document.querySelector('#tdCompList button[data-all="fold"]').click());await sleep(200);
 const fd=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#compWrap .card')];return {all:cards.every(c=>c.classList.contains('td-fold')),param:getComputedStyle(cards[0].querySelector('.param')).display,steps:getComputedStyle(cards[0].querySelector('ol.steps')).display,head:getComputedStyle(cards[0].querySelector('.chd')).display,sum:cards[0].querySelector('.td-foldsum').textContent,btn:cards[0].querySelector('.td-cfold').textContent,h:Math.round(document.getElementById('compWrap').getBoundingClientRect().height)};});
 ok('Fold all folds every card to its title and a summary line (steps, who runs it, when, its first parameters)',fd.all&&fd.param==='none'&&fd.steps==='none'&&fd.head!=='none'&&/^\d+ steps · run by Classroom teacher/.test(fd.sum)&&/Mand form/.test(fd.sum)&&fd.btn==='Show steps'&&fd.h<1800,fd);
 await p.evaluate(()=>{const a=[...document.querySelectorAll('#tdCompList a')][3];a.click();});await sleep(500);
 const jp=await p.evaluate(()=>{const a=[...document.querySelectorAll('#tdCompList a')][3];const c=document.querySelector(a.getAttribute('href'));return {open:!c.classList.contains('td-fold'),top:Math.round(c.getBoundingClientRect().top),y:Math.round(scrollY),btn:c.querySelector('.td-cfold').textContent};});
 ok('a link in the list opens that card and scrolls to it under the toolbar',jp.open&&jp.y>100&&jp.top>=0&&jp.top<=200&&jp.btn==='Hide steps',jp);
 await p.evaluate(()=>document.querySelector('#tdCompList button[data-all="open"]').click());await sleep(200);
 const op=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].every(c=>!c.classList.contains('td-fold')&&!c.querySelector('.td-foldsum')));
 ok('Open all opens them',op);
 await p.evaluate(()=>document.querySelector('#compWrap .card .td-cfold').click());await sleep(150);
 const one=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#compWrap .card')];return {first:cards[0].classList.contains('td-fold'),rest:cards.slice(1).every(c=>!c.classList.contains('td-fold'))};});
 ok('a card\'s own Hide steps folds that card only',one.first&&one.rest,one);
 await p.evaluate(()=>document.querySelector('#compWrap .card .td-foldsum').click());await sleep(150);
 ok('tapping the summary line opens it again',await p.evaluate(()=>!document.querySelector('#compWrap .card').classList.contains('td-fold')));
 /* a card added or removed updates the list */
 await p.evaluate(()=>td117.add('A_RAPPORT'));await sleep(300);
 const added=await p.evaluate(()=>({links:document.querySelectorAll('#tdCompList a').length,cards:document.querySelectorAll('#compWrap .card').length,last:[...document.querySelectorAll('#tdCompList a')].pop().textContent}));
 ok('a card added appears in the list',added.links===added.cards&&/A_RAPPORT/.test(added.last),added);
 await p.evaluate(()=>document.querySelector('#compWrap .card[data-code="A_RAPPORT"] [data-rm]').click());await sleep(300);
 ok('a card removed leaves it',await p.evaluate(()=>document.querySelectorAll('#tdCompList a').length===document.querySelectorAll('#compWrap .card').length&&![...document.querySelectorAll('#tdCompList a')].some(a=>/A_RAPPORT/.test(a.textContent))));
 /* the Package Summary links */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="plan"]').click();});await sleep(500);
 const pk=await p.evaluate(()=>{const links=[...document.querySelectorAll('#planSummary a.td-pkglink')];return {n:links.length,cards:document.querySelectorAll('#compWrap .card').length,href:links[2]&&links[2].getAttribute('href')};});
 await p.evaluate(()=>{document.querySelectorAll('#planSummary a.td-pkglink')[2].click();});await sleep(500);
 const pk2=await p.evaluate(()=>({view:document.body.className,top:Math.round(document.querySelector(document.querySelectorAll('#planSummary a.td-pkglink')[2].getAttribute('href')).getBoundingClientRect().top),y:Math.round(scrollY)}));
 ok('each Package Summary entry links to its card: the third opens Build at that card',pk.n===pk.cards&&/^#tdcard-/.test(pk.href||'')&&pk2.view==='view-build'&&pk2.y>100&&pk2.top>=0&&pk2.top<=200,{pk,pk2});
 /* the Final plan's section links */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();});await sleep(800);
 const fn=await p.evaluate(()=>{const nav=document.getElementById('tdFinNav');const links=nav?[...nav.querySelectorAll('a')].map(a=>a.textContent):[];return {n:links.length,links,before:nav&&nav.nextElementSibling&&nav.nextElementSibling.id,navs:document.querySelectorAll('#tdFinNav').length};});
 ok('the Final plan opens with one row of links to its sections, the component groups and the adoption sections among them',fn.navs===1&&fn.n>=6&&fn.links.some(t=>/Teaching the replacement/.test(t))&&fn.links.some(t=>/Adopted by the team/.test(t))&&fn.before==='finalBody',fn);
 await p.evaluate(()=>{[...document.querySelectorAll('#tdFinNav a')].find(a=>/Adopted by the team/.test(a.textContent)).click();});await sleep(500);
 const fj=await p.evaluate(()=>{const g=[...document.querySelectorAll('#final .plan-group')].find(x=>/Adopted by the team/.test(x.textContent));return {top:Math.round(g.getBoundingClientRect().top),y:Math.round(scrollY)};});
 ok('a section link scrolls to its section',fj.y>500&&fj.top>=0&&fj.top<=200,fj);
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="final"]').click();});await sleep(800);
 ok('reopening the Final plan keeps one row of links',await p.evaluate(()=>document.querySelectorAll('#tdFinNav').length===1));
 /* print: none of it prints, and a folded card prints whole */
 await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="build"]').click();document.querySelector('#tdCompList button[data-all="fold"]').click();});await sleep(300);
 await p.emulateMedia({media:'print'});
 const pr=await p.evaluate(()=>{const c=document.querySelector('#compWrap .card');return {list:getComputedStyle(document.getElementById('tdCompList')).display,sum:getComputedStyle(c.querySelector('.td-foldsum')).display,steps:getComputedStyle(c.querySelector('ol.steps')).display,param:getComputedStyle(c.querySelector('.param')).display,plnote:getComputedStyle(document.querySelector('#hpPlanWrap .td-plfold')).display};});
 await p.emulateMedia({media:'screen'});
 ok('in print the list, the summary lines and the planner note are left out and a folded card prints whole',pr.list==='none'&&pr.sum==='none'&&pr.steps!=='none'&&pr.param!=='none'&&pr.plnote==='none',pr);
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
