/* v21.39: respondent pages for IA-1's instruments (one per target behavior, personalized), the answer code they send back, and Collect responses */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const FAST=['1. In what situations do you usually interact with the student?','2. How often does the problem behavior occur?','3. How severe are the problem behaviors when they occur?','4. Does he or she seem to enjoy the behavior when no one is around?'].concat(Array.from({length:12},(_,i)=>(i+5)+'. Simulated FAST item '+(i+5)+' about the student and his or her problem behavior'));
const PBQ=Array.from({length:15},(_,i)=>'Simulated PBQ item '+(i+1));
const grab=async(page,fn)=>page.evaluate(async f=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};const r=(new Function('return ('+f+')'))()();await new Promise(r=>setTimeout(r,700));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {r,text:got?await got.text():''};},fn.toString());
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};});
 ok('library loaded beside the form',await page.evaluate(()=>!!window.NBH_RESPOND&&!window.NBH_RESPOND_MISSING));
 await page.evaluate((w)=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.client','Georgi Sample');set('m.sid','12345');set('m.assessor','J. Newsome, BCBA');set('m.email','bcba@example.org');set('m.beh','Self-injury');set('m.def','Forceful contact of the hand or head with a surface.');set('rp.w.fast',w.join('\n'));
   /* the case supplies a second target, as Form TB-1 would through the workstation */
   nbhCase.facts={behaviors:[{label:'Self-injury',def:'ignored: the form\'s own definition wins',src:'TB-1'},{label:'Elopement',def:'Leaving the assigned area without permission.',src:'TB-1'}]};},FAST);
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const dlg=await page.evaluate(()=>({open:document.querySelector('#rpDlg').open,targets:[...rpTarget.options].map(o=>o.textContent),name:rpName.value,student:rpStudent.value,email:rpEmail.value,rows:document.querySelectorAll('#rpTargets tbody tr').length,sing:document.querySelector('#rpTargets [data-rt="sing"]').value,def:document.querySelector('#rpTargets [data-rt="def"]').value,ready:!rpSave.disabled,preview:rpPrev.textContent}));
 ok('dialog: own target first, the case\'s second, "every target"; first name, label; terms and definition prefilled; ready',dlg.open&&dlg.targets.length===3&&/Self-injury \(this form\)/.test(dlg.targets[0])&&/Elopement \(TB-1\)/.test(dlg.targets[1])&&/Every target/.test(dlg.targets[2])&&dlg.name==='Georgi'&&dlg.student==='G.S. (ID 12345)'&&dlg.rows===1&&dlg.sing==='self-injury'&&/Forceful contact/.test(dlg.def)&&dlg.ready,dlg);
 ok('preview personalizes: name and the behavior term',/interact with Georgi\?/.test(dlg.preview)&&/does self-injury occur/.test(dlg.preview),dlg.preview);
 await page.evaluate(()=>{rpPron.value='he';rpPron.dispatchEvent(new Event('change'));document.querySelector('#rpTargets [data-rt="plur"]').value='self-injurious behaviors';document.querySelector('#rpTargets').dispatchEvent(new Event('input',{bubbles:true}));rpDue.value='10/10/2026';});
 ok('plural phrase and pronouns in the preview',/How severe are self-injurious behaviors when they occur/.test(await page.evaluate(()=>rpPrev.textContent)));
 /* the page as a file */
 const f1=await grab(page,()=>__rp.file());
 ok('page file named by instrument, behavior and label; personalized; no full name',/^IA-1_FAST_Self-injury_respondent_G\.S\._ID_12345_\.html$/.test(f1.r)&&/Does he seem to enjoy self-injury/.test(f1.text)&&/"def":"Forceful contact/.test(f1.text)&&!/Georgi Sample/.test(f1.text),f1.r);
 /* the informant answers it */
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(f1.text,{waitUntil:'load'});await sleep(300);
 const r1=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,q2:document.querySelectorAll('li.it .q')[1].textContent,def:document.querySelector('.def').textContent,conf:document.querySelectorAll('input[name=nbhr-confirm]').length===3&&/Do you understand this definition of Self-injury/.test(document.querySelector('#nbhr-conf').textContent)}));
 ok('page shows the definition, the Yes / No / Unsure question about it, and the personalized items',r1.items===16&&/How often does self-injury occur\?/.test(r1.q2)&&/What counts as Self-injury: Forceful contact/.test(r1.def)&&r1.conf,r1);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Ms. Rivera';inp[1].value='Teacher';inp[2].value='14';document.querySelector('select').value='Yes';inp[3].value='Classroom, lunch';
   const pat=['Y','N','NA','Y','N','Y','Y','N','N','N','Y','NA','N','N','Y','N'];document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+pat[i]+'"]').click();});document.querySelectorAll('textarea')[0].value='Independent math work';document.querySelector('button:not(.ghost)').click();});await sleep(150);
 ok('send refuses until the definition question is answered',await rp.evaluate(()=>!document.querySelector('.warn').hidden&&/understand the definition/.test(document.querySelector('.warn').textContent)&&document.querySelector('.code').hidden));
 await rp.evaluate(()=>{document.querySelector('input[name=nbhr-confirm][value=yes]').click();document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const sent=await rp.evaluate(()=>({code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),done:!document.querySelector('.done').hidden}));
 const dec=await page.evaluate(c=>NBH_RESPOND.decode(c),sent.code);
 ok('Send gives a code carrying the behavior and the definition answer, and a mailto to the assessor',/^NBH1\./.test(sent.code)&&dec.beh==='Self-injury'&&dec.confirmed==='yes'&&dec.ans.length===16&&/^mailto:bcba%40example\.org\?subject=FAST%20answers/.test(sent.mail)&&sent.mail.length<1900,{dec,len:sent.mail.length});
 /* a second respondent's code about the other target, made from the Elopement page */
 await page.evaluate(()=>{rpTarget.value='1';rpTarget.dispatchEvent(new Event('change'));});
 const f2=await grab(page,()=>__rp.file());
 await rp.setContent(f2.text,{waitUntil:'load'});await sleep(200);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Mr. Okafor';inp[1].value='Para';document.querySelectorAll('li.it').forEach(li=>li.querySelector('input[value="N"]').click());document.querySelector('input[name=nbhr-confirm][value=yes]').click();document.querySelector('button:not(.ghost)').click();});await sleep(200);
 const code2=await rp.evaluate(()=>document.querySelector('.code').value);
 ok('the second page is about Elopement with its own definition',/"def":"Leaving the assigned area/.test(f2.text)&&/"behLabel":"Elopement"/.test(f2.text)&&/Elopement_respondent/.test(f2.r),f2.r);
 /* every target at once: two files, two links */
 await page.evaluate(()=>{rpTarget.value='*';rpTarget.dispatchEvent(new Event('change'));});
 const multi=await page.evaluate(()=>({terms:__rp.terms().map(t=>t.label),links:__rp.links().map(l=>l.label+' '+l.url.length),save:rpSave.textContent}));
 ok('every target: two term rows, two links, the button says pages',multi.terms.join()==='Self-injury,Elopement'&&multi.links.length===2&&/pages/.test(multi.save),multi);
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 /* collect: the Self-injury response is placed; the Elopement one is held with its codes to copy */
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(({a,b})=>{rcText.value='From: Ms. Rivera\n\n'+a+'\n\n--\n'+b;__rp.read([rcText.value]);},{a:sent.code,b:code2});await sleep(100);
 const found=await page.evaluate(()=>({rows:document.querySelectorAll('#rcOut tbody tr').length,txt:document.querySelector('#rcOut').textContent,held:document.querySelectorAll('.rp-other').length,copy:!!document.querySelector('#rcOut [data-copy]')}));
 ok('one FAST response about Self-injury listed as understood; the Elopement one held with a copy button',found.rows===1&&/about Self-injury: 1 response found/.test(found.txt)&&/understood/.test(found.txt)&&found.held===1&&/1 response about Elopement/.test(found.txt)&&found.copy,found.txt.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {a:[1,2,3,4,16].map(i=>v('fast[0]['+i+']')),name:v('inf[0].name'),role:v('inf[0].role'),mo:v('inf[0].mo'),daily:v('inf[0].daily'),ml:v('fast.ml_s'),banner:document.querySelector('#gfBanner').textContent,view:document.body.className};});
 ok('answers placed on the FAST worksheet, informant table and Section 1',placed.a.join()==='Y,N,NA,Y,N'&&placed.name==='Ms. Rivera'&&placed.role==='Teacher'&&placed.mo==='14'&&placed.daily==='Yes'&&/A: Independent math work/.test(placed.ml)&&/Collected 1 FAST response about Self-injury/.test(placed.banner)&&placed.view==='view-fast',placed);
 /* a numeric instrument through the hosted link, on a form with no target named: it takes the response's */
 await page.evaluate(w=>{const e=document.querySelector('[name="rp.w.pbq"]');e.value=w.join('\n');e.dispatchEvent(new Event('input',{bubbles:true}));},PBQ);
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(100);await page.evaluate(()=>{rpInst.value='pbq';rpInst.dispatchEvent(new Event('change'));rpTarget.value='0';rpTarget.dispatchEvent(new Event('change'));});
 const link2=await page.evaluate(()=>__rp.links()[0].url);await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await rp.goto(link2);await sleep(500);
 const r2=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,nums:document.querySelectorAll('li.it:first-child .opts label').length,key:(document.querySelector('.key')||{}).textContent||''}));
 ok('respond.html renders the PBQ from the link: 15 items, 0 to 6, with the anchors',r2.items===15&&r2.nums===7&&/about 10%/.test(r2.key),r2);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Mr. Okafor';inp[1].value='Para';document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+(i%7)+'"]').click();});document.querySelector('input[name=nbhr-confirm][value=yes]').click();document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const code3=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>{const e=document.querySelector('[name="m.beh"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#rcBtn').click();});await sleep(100);
 await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code3);await sleep(100);
 ok('a form with no target named takes the response\'s target',/takes Self-injury from the responses/.test(await page.evaluate(()=>document.querySelector('#rcOut').textContent)));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const pbq=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {ver:document.querySelector('#pbqVer').value,a:[1,2,8,15].map(i=>v('pbq[0]['+i+']')),name:v('inf[0].name'),beh:v('m.beh')};});
 ok('PBQ answers placed with the 15-item version; the target named from the response',pbq.ver==='15'&&pbq.a.join()==='0,1,0,0'&&pbq.name==='Mr. Okafor'&&pbq.beh==='Self-injury',pbq);
 /* the wording, the name, the pronouns, the terms and the email save with the file */
 const data=(await grab(page,()=>document.querySelector('#saveBtn').click())).text;
 ok('wording, pronouns, terms and email in the saved file',/rp\.w\.fast/.test(data)&&/"rp\.pron": ?"he"/.test(data)&&/self-injurious behaviors/.test(data)&&/bcba@example\.org/.test(data));
 await page.reload();await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await (await page.$('#fileIn')).setInputFiles({name:'ia1.json',mimeType:'application/json',buffer:Buffer.from(data)});await sleep(500);
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(150);
 const back=await page.evaluate(()=>({pron:rpPron.value,plur:document.querySelector('#rpTargets [data-rt="plur"]').value,count:document.querySelector('[data-rpw="fast"]').textContent}));
 ok('reopened: pronouns, the plural phrase and the wording count come back',back.pron==='he'&&back.plur==='self-injurious behaviors'&&/16 pasted/.test(back.count),back);
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
