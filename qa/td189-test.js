/* v24.89 Form TD-1's screen layout (the 10/28 design review): questions beside what they recommend, Not sure read as a
   blank answer, labels and examples above the boxes, Build settings that grow, Remove asks, Change links on the Final
   plan, the text sizes; the saved file and the paper unchanged. Runs in Chromium and in WebKit (Safari's engine).
   usage: node qa/td189-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let webkit=null;try{({webkit}=require('/opt/node22/lib/node_modules/playwright'));}catch(e){}
const URL=BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const sim=async p=>{await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asked=[];window.__answer=true;nbhUI.confirm=async q=>{window.__asked.push(String(q));return window.__answer;};
  document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(1800);};
const view=async(p,v)=>{await p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);await sleep(800);};

async function main(){
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1366,height:1024},hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 ok('the layout is on (html.td9) with its screen-only style and its script',await p.evaluate(()=>document.documentElement.classList.contains('td9')&&/@media screen/.test(document.getElementById('td-v2489').textContent)&&!!document.getElementById('td-v2489-js')&&!!window.tdLayout));
 await sim(p);
 /* the selectors: questions beside the margin */
 const sp={};for(const v of ['select','antecedent','reinf','teach','skills','respond']){await view(p,v);sp[v]=await p.evaluate(()=>{const pairs=()=>[...document.querySelectorAll('.td9-recs')].filter(x=>x.offsetParent).map(rec=>{let q=rec.previousElementSibling;while(q&&!q.classList.contains('td9-q'))q=q.previousElementSibling;return [q,rec];});
   const shown=[...document.querySelectorAll('.sheet')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.id);
   return pairs().map(([q,a])=>{const ra=a.getBoundingClientRect(),rq=q.getBoundingClientRect();
     return {side:ra.left>rq.right-2,head:(a.querySelector('.td9-rh')||{}).textContent,add:(a.querySelector('.td9-add')||{}).textContent,prog:(q.querySelector('.td9-prog')||{}).textContent,shown:shown.join('+')};});});}
 ok('each selector page shows its own sheet only, with its questions and the Recommended margin beside them, "N of M answered" and one Add button',Object.entries(sp).every(([v,a])=>a.length>=1&&a.every(x=>x.shown===v&&x.side&&/^Recommended/.test(x.head)&&/^Add /.test(x.add)&&/ of \d+ answered$/.test(x.prog))),sp);
 /* Not sure (the prompting and error-correction selectors recommend a default until answered) */
 await view(p,'teach');
 const ns=await p.evaluate(async()=>{const fn=document.querySelector('[name="m.fn"]').value;const sels=[...document.querySelectorAll('select[data-q],select[data-qm]')].filter(x=>x.offsetParent);
   const yn=sels.filter(s=>[...s.options].map(o=>o.value).join('|')==='|yes|no|not sure');const other=sels.filter(s=>!yn.includes(s));
   const recs=()=>[...document.querySelectorAll('.td9-recs')].filter(x=>x.offsetParent).map(w=>[...w.querySelectorAll('.td-rec')].map(r=>(r.querySelector('.tag')||{}).textContent+(r.classList.contains('on')?'+':'')).join(',')).join(';');
   const out={fn,n:yn.length,others:other.map(s=>[...s.options].map(o=>o.textContent).join('|')),same:[],diff:[]};
   const set=async(s,v)=>{s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,250));};
   for(const s of yn){const keep=s.value;await set(s,'');const a=recs();await set(s,'not sure');const b=recs();(a===b?out.same:out.diff).push(s.name+':'+a+'/'+b);await set(s,keep);}
   await set(yn[0],'not sure');
   out.blank=out.same.length?'x':'';out.notsure=out.diff.length?'y':'x';out.anyRecs=out.same.some(x=>/:[A-Z]/.test(x));const s=yn[0];
   out.label=s.options[s.selectedIndex].textContent;out.name=s.name;out.prog=document.querySelector('.td9-prog').textContent;
   out.seg=!!s.parentNode.querySelector('.nbh-segb[data-v="not sure"]');
   return out;});
 /* saved and opened again through the form's own Save data and Open data */
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.evaluate(()=>document.getElementById('saveBtn').click())]);const fp=await dl.path();const file=JSON.parse(require('fs').readFileSync(fp,'utf8'));ns.saved=file.fields[ns.name];
 await p.evaluate(n=>{const s=document.querySelector('[name="'+n+'"]');s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));},ns.name);
 await p.setInputFiles('#fileIn',fp);await sleep(1500);ns.reopened=await p.evaluate(n=>document.querySelector('[name="'+n+'"]').value,ns.name);
 ok('a Yes or No question offers Not sure, as a button beside Yes and No; it is saved as "not sure" and opens again as Not sure, counts as answered, and recommends exactly what a blank answer does',ns.n>=3&&ns.seg&&ns.label==='Not sure'&&ns.saved==='not sure'&&ns.reopened==='not sure'&&ns.diff.length===0&&ns.same.length===ns.n&&ns.anyRecs&&/^\d+ of \d+ answered/.test(ns.prog),ns);
 ok('a question with its own third answer (Unknown, Not tried...) or other answers is left as it was (no Not sure added)',ns.others.every(o=>!/Not sure/.test(o)),ns.others);
 const allNs={yn:0,ns:0};for(const v of ['select','antecedent','reinf','teach','skills','respond']){await view(p,v);const c=await p.evaluate(()=>{const k=[...document.querySelectorAll('select[data-q],select[data-qm]')].filter(s=>s.offsetParent||s.closest('.qrow')).map(s=>[...s.options].map(o=>o.value).join('|'));return {yn:k.filter(x=>x==='|yes|no').length,ns:k.filter(x=>x==='|yes|no|not sure').length};});allNs.yn+=c.yn;allNs.ns+=c.ns;}
 ok('no question is left with only Yes and No: each offers Not sure ('+allNs.ns+' on the example\'s sheets)',allNs.yn===0&&allNs.ns>=15,allNs);
 await view(p,'select');
 /* text sizes and contrast */
 const ty=await p.evaluate(()=>{const g=(s,k)=>{const e=document.querySelector(s);return e?getComputedStyle(e)[k||'fontSize']:null;};return {q:g('.qrow .qt'),hint:g('.td9-hint','color')};});
 ok('questions are 16 px (Apple 17 pt default, USWDS 16 px floor) and hints #55656C (5.6:1 on the panel)',ty.q==='16px'&&(!ty.hint||ty.hint==='rgb(85, 101, 108)'),ty);
 /* Build cards */
 await view(p,'build');
 const bc=await p.evaluate(async()=>{const sel=document.getElementById('addComp');sel.value='TA_CHAIN';document.getElementById('addCompBtn').click();await new Promise(r=>setTimeout(r,700));
   const c=document.querySelector('#compWrap .card[data-code="TA_CHAIN"]');const f=[...c.querySelectorAll('.param .f')];
   const steps=f.find(x=>/Steps in the student/.test(x.textContent));const t=c.querySelector('ol.steps textarea');t.value='RESTRICTIVE: example step';t.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));
   return {tags:f.map(x=>(x.querySelector('textarea,input')||{}).tagName),named:f.every(x=>/^cp\[\d+\]\.p\d+$/.test((x.querySelector('textarea')||{}).name)),fs:getComputedStyle(f[0].querySelector('textarea')).fontSize,
     ph:f.filter(x=>(x.querySelector('textarea').getAttribute('placeholder')||'').trim()).length,hints:c.querySelectorAll('.param .td9-hint').length,num:steps&&steps.querySelector('textarea').getAttribute('inputmode'),
     srcb:(c.querySelector('.td9-srcb')||{}).textContent,src:getComputedStyle(c.querySelector('p.method.td9-src')).display,stepsn:(c.querySelector('.td9-stepsn')||{}).textContent,restr:t.closest('li').classList.contains('td9-restr'),
     who:(c.querySelector('.td-who small.eg')||{}).textContent};});
 ok('a Build card\'s settings are boxes that grow (textarea, same names cp[i].pN), at 16 px, with the example under the label and not inside the box',bc.tags.every(t=>t==='TEXTAREA')&&bc.named&&bc.fs==='16px'&&bc.ph===0&&bc.hints>=3,bc);
 ok('a count opens the number keypad; sources sit behind "Studies this card is based on (N)"; the steps open with what the list holds; a RESTRICTIVE: step is marked; examples read "For example"',bc.num==='numeric'&&/^Studies this card is based on \(\d+\)$/.test(bc.srcb)&&bc.src==='none'&&/^\d+ steps/.test(bc.stepsn)&&bc.restr&&/^For example, /.test(bc.who),bc);
 /* Remove asks when a person taps it */
 const before=await p.evaluate(()=>document.querySelectorAll('#compWrap .card').length);
 await p.evaluate(()=>{window.__answer=false;window.__asked=[];});await p.click('#compWrap .card[data-code="TA_CHAIN"] [data-rm]');await sleep(300);
 const kept=await p.evaluate(()=>({n:document.querySelectorAll('#compWrap .card').length,q:window.__asked[0]||''}));
 await p.evaluate(()=>{window.__answer=true;});await p.click('#compWrap .card[data-code="TA_CHAIN"] [data-rm]');await sleep(400);
 const gone=await p.evaluate(()=>document.querySelectorAll('#compWrap .card').length);
 ok('Remove on a Build card asks first ("Remove the Task analysis... card? Its settings and steps..."); Keep it keeps the card, Remove card removes it',kept.n===before&&/^Remove the Task analysis.*card\?\nIts settings and steps/.test(kept.q)&&gone===before-1,{before,kept,gone});
 const prog=await p.evaluate(async()=>{window.__asked=[];const n0=document.querySelectorAll('#compWrap .card').length;document.querySelector('#compWrap .card [data-rm]').click();await new Promise(r=>setTimeout(r,300));return {d:n0-document.querySelectorAll('#compWrap .card').length,asked:window.__asked.length};});
 ok('a card the form removes itself (a recommendation turned off) goes without the question, as before',prog.d===1&&prog.asked===0,prog);
 /* the staff flowchart still carries each card's settings (it reads them from the growing boxes) */
 const fc=await p.evaluate(async()=>{const vals=[...document.querySelectorAll('#compWrap .card .param textarea')].map(t=>t.value.trim()).filter(Boolean);
   document.getElementById('flowBtn').click();await new Promise(r=>setTimeout(r,800));const t=document.getElementById('flowBlock').textContent;
   return {n:vals.length,found:vals.filter(v=>t.includes(v.slice(0,20))).length,v:vals[0]};});
 ok('the staff flowchart (Build staff flowchart) still carries every card\'s settings, read from the growing boxes ('+fc.found+' of '+fc.n+')',fc.n>=10&&fc.found===fc.n,fc);
 /* the Final plan's Change links */
 await p.evaluate(async()=>{document.getElementById('simBtn').click();await new Promise(r=>setTimeout(r,1800));});
 await view(p,'final');
 const fl=await p.evaluate(()=>{const c=[...document.querySelectorAll('.td9-chg')].filter(x=>x.offsetParent);return {n:c.length,labels:c.map(x=>x.getAttribute('aria-label')).slice(0,12),glance:!!document.querySelector('table.td9-glance')};});
 ok('the Final plan has a Change link on each part of the summary and on each component at a glance',fl.n>=8&&fl.glance&&fl.labels.some(l=>/^Change target behavior/.test(l))&&fl.labels.some(l=>/^Change criterion/.test(l)),fl);
 await p.evaluate(()=>[...document.querySelectorAll('.td9-chg')].find(x=>/^Change target behavior/.test(x.getAttribute('aria-label'))).click());await sleep(500);
 const g1=await p.evaluate(()=>document.querySelector('#viewSeg button[aria-pressed="true"],#viewSeg button.on,#viewSeg button[aria-current]')?.dataset.view||[...document.querySelectorAll('#viewSeg button')].find(b=>b.classList.contains('active')||b.getAttribute('aria-selected')==='true')?.dataset.view);
 await view(p,'final');
 await p.evaluate(()=>document.querySelector('table.td9-glance .td9-chg').click());await sleep(600);
 const g2=await p.evaluate(()=>{const c=document.querySelector('#compWrap .card');const r=c&&c.getBoundingClientRect();return {vis:!!(c&&c.offsetParent),top:r&&Math.round(r.top)};});
 ok('Change on the summary opens Setup; Change on a component opens its Build card',g1==='setup'&&g2.vis&&g2.top<500,{g1,g2});
 /* paper */
 await view(p,'teach');
 await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});
 const pr=await p.evaluate(()=>{const shown=s=>[...document.querySelectorAll(s)].filter(e=>getComputedStyle(e).display!=='none'&&e.getClientRects().length).length;
   const ch=[...document.querySelectorAll('option[data-td9-choose]')];const ph=[...document.querySelectorAll('[data-td9-ph]')];
   return {added:shown('.td9-hint,.td9-add,.td9-addnote,.td9-rh,.td9-prog,.td9-chg,.td9-srcb,.td9-more,.td9-stepsh,.td9-stepsn'),choose:ch.length,chooseBlank:ch.every(o=>o.textContent===''),ph:ph.length,phBack:ph.every(f=>f.getAttribute('placeholder')===f.getAttribute('data-td9-ph')),
     src:[...document.querySelectorAll('#compWrap p.method.td9-src')].every(e=>getComputedStyle(e).display!=='none'),stepsb:[...document.querySelectorAll('#compWrap b.td9-stepsb')].every(e=>getComputedStyle(e).display!=='none'),
     grid:getComputedStyle(document.querySelector('.sheet.td9-grid')).display,q:getComputedStyle(document.querySelector('.qrow .qt')).fontSize};});
 await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 const back=await p.evaluate(()=>[...document.querySelectorAll('option[data-td9-choose]')].every(o=>o.textContent==='Choose…'));
 ok('on paper nothing the layout adds prints, the blank answers stay blank, the examples are back in their boxes, the source lines and the steps heading print, and the sheet keeps its own layout and sizes',pr.added===0&&pr.chooseBlank&&pr.phBack&&pr.src&&pr.stepsb&&pr.grid==='block'&&pr.q!=='16px'&&back,pr);
 /* iPad upright */
 const u=await b.newPage({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});await u.goto(URL);await sleep(1500);await sim(u);await view(u,'teach');
 const up=await u.evaluate(()=>{const pairs=()=>[...document.querySelectorAll('.td9-recs')].filter(x=>x.offsetParent).map(rec=>{let q=rec.previousElementSibling;while(q&&!q.classList.contains('td9-q'))q=q.previousElementSibling;return [q,rec];});const [qq,aa]=pairs()[0];const a=aa.getBoundingClientRect(),q=qq.getBoundingClientRect();return {below:a.top>=q.bottom-2,sx:document.documentElement.scrollWidth<=window.innerWidth+1};});
 await view(u,'build');
 const up2=await u.evaluate(()=>{const w=document.querySelector('.td-who');return w?getComputedStyle(w).gridTemplateColumns.split(' ').length:0;});
 ok('iPad upright: the Recommended margin drops under the questions, Run by / When / Where stack, and the page does not scroll sideways',up.below&&up.sx&&up2===1,{up,up2});
 ok('no page errors in Chromium',errs.length===0,errs);
 await b.close();
}
async function safari(){
 if(!webkit){ok('WebKit is installed (Safari\'s engine)',false,'not installed');return;}
 let b;try{b=await webkit.launch();}catch(e){ok('WebKit starts',false,e.message.slice(0,200));return;}
 const p=await b.newPage({viewport:{width:1366,height:1024},hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1800);await sim(p);await view(p,'teach');
 const w=await p.evaluate(()=>{const pairs=()=>[...document.querySelectorAll('.td9-recs')].filter(x=>x.offsetParent).map(rec=>{let q=rec.previousElementSibling;while(q&&!q.classList.contains('td9-q'))q=q.previousElementSibling;return [q,rec];});const pr=pairs()[0];const a=pr&&pr[1].getBoundingClientRect(),q=pr&&pr[0].getBoundingClientRect();
   return {split:!!pr,side:!!pr&&a.left>q.right-2,ns:document.querySelectorAll('.nbh-segb[data-v="not sure"]').length,q:getComputedStyle(document.querySelector('.qrow .qt')).fontSize,ua:navigator.userAgent.slice(-30)};});
 ok('WebKit (Safari\'s engine): the layout draws the same way: margin beside the questions, Not sure buttons, 16 px questions',w.split&&w.side&&w.ns>0&&w.q==='16px',w);
 await view(p,'build');
 const r=await p.evaluate(async()=>{const c=document.querySelector('#compWrap .card');const t=c.querySelector('.param textarea');return {ta:!!t,fs:t&&getComputedStyle(t).fontSize};});
 ok('WebKit: Build settings are 16 px boxes (iPad Safari does not zoom into them)',r.ta&&r.fs==='16px',r);
 ok('no page errors in WebKit',errs.length===0,errs);
 await b.close();
}
(async()=>{try{await main();await safari();}catch(e){ok('test ran to the end',false,String(e.stack||e).slice(0,600));}console.log(bad?`td189: ${bad} of ${n} FAILED`:`td189: all ${n} passed`);process.exit(bad?1:0);})();
