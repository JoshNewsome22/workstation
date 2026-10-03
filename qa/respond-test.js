/* v21.39: respondent pages for IA-1's instruments, the answer code they send back, and Collect responses */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const FAST=Array.from({length:16},(_,i)=>(i+1)+'. Simulated FAST item '+(i+1)+' (wording pasted by the assessor)');
const PBQ=Array.from({length:15},(_,i)=>'Simulated PBQ item '+(i+1));
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};});
 ok('library loaded beside the form',await page.evaluate(()=>!!window.NBH_RESPOND&&!window.NBH_RESPOND_MISSING));
 ok('toolbar has the two buttons',await page.evaluate(()=>!!document.querySelector('#rpBtn')&&!!document.querySelector('#rcBtn')));
 await page.evaluate((w)=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.client','Sample Student');set('m.sid','12345');set('m.assessor','J. Newsome, BCBA');set('m.email','bcba@example.org');set('m.beh','Aggression');set('m.def','Forceful contact of the hand with another person.');set('rp.w.fast',w.join('\n'));},FAST);
 ok('wording count shown',/16 pasted/.test(await page.evaluate(()=>document.querySelector('[data-rpw="fast"]').textContent)));
 /* the dialog, prefilled */
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const dlg=await page.evaluate(()=>({open:document.querySelector('#rpDlg').open,student:rpStudent.value,email:rpEmail.value,beh:rpBeh.value,status:rpStatus.hidden,saveOn:!rpSave.disabled}));
 ok('dialog prefilled: initials and ID, email, behavior; ready',dlg.open&&dlg.student==='S.S. (ID 12345)'&&dlg.email==='bcba@example.org'&&/Aggression: Forceful/.test(dlg.beh)&&dlg.status&&dlg.saveOn,dlg);
 await page.evaluate(()=>{rpInst.value='mas';rpInst.dispatchEvent(new Event('change'));});
 ok('no MAS wording: save disabled with a reason',await page.evaluate(()=>rpSave.disabled&&!rpStatus.hidden&&/No wording for the MAS/.test(rpStatus.textContent)));
 await page.evaluate(()=>{rpInst.value='fast';rpInst.dispatchEvent(new Event('change'));rpDue.value='10/10/2026';});
 /* the page as a file */
 const html=await page.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
   const name=__rp.file();URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {name,html:await got.text()};});
 ok('page file named and self-contained',/^IA-1_FAST_respondent_S\.S\._ID_12345_\.html$/.test(html.name)&&/NBH_RESPOND_RUNTIME/.test(html.html)&&/Simulated FAST item 16/.test(html.html)&&!/Sample Student/.test(html.html),html.name);
 const link=await page.evaluate(()=>__rp.link());
 ok('link points at respond.html with the payload',/\/NBH-Workstation\/respond\.html#p=[A-Za-z0-9_-]{100,}$/.test(link),link.slice(0,80));
 /* the informant answers the file */
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(html.html,{waitUntil:'load'});await sleep(300);
 const r1=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,opts:document.querySelectorAll('li.it .opts label').length,open:document.querySelectorAll('textarea').length,student:document.querySelector('.def').textContent}));
 ok('respondent page renders 16 items with yes/no/NA, the open questions and the student label',r1.items===16&&r1.opts===48&&r1.open>=6&&/S\.S\. \(ID 12345\)/.test(r1.student),r1);
 await rp.evaluate(()=>{document.querySelector('button:not(.ghost)').click();});await sleep(100);
 ok('send without answers asks first',await rp.evaluate(()=>!document.querySelector('.warn').hidden&&/Your name/.test(document.querySelector('.warn').textContent)));
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Ms. Rivera';inp[1].value='Teacher';inp[2].value='14';document.querySelector('select').value='Yes';inp[3].value='Classroom, lunch';
   const pat=['Y','N','NA','Y','N','Y','Y','N','N','N','Y','NA','N','N','Y','N'];document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+pat[i]+'"]').click();});
   document.querySelectorAll('textarea')[0].value='Independent math work';});
 const before=await rp.evaluate(()=>document.querySelector('.prog').textContent);
 await rp.evaluate(()=>{document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const sent=await rp.evaluate(()=>({code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),done:!document.querySelector('.done').hidden}));
 ok('16 of 16 answered, then Send gives a code and a mailto to the assessor',/16 of 16/.test(before)&&/^NBH1\./.test(sent.code)&&/^mailto:bcba%40example\.org\?subject=FAST%20answers/.test(sent.mail)&&sent.mail.indexOf(encodeURIComponent(sent.code))>0&&sent.done,{before,mail:sent.mail.slice(0,80)});
 ok('mailto fits an email link',sent.mail.length<1900,sent.mail.length);
 /* collect it */
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(c=>{rcText.value='From: Ms. Rivera\n\n'+c+'\n\nSent today';__rp.read([rcText.value]);},sent.code);await sleep(100);
 const found=await page.evaluate(()=>({rows:document.querySelectorAll('#rcOut tbody tr').length,txt:document.querySelector('#rcOut').textContent}));
 ok('one FAST response found, 16 of 16, informant A',found.rows===1&&/FAST: 1 response found/.test(found.txt)&&/16 of 16/.test(found.txt)&&/Informant A/.test(found.txt),found.txt.slice(0,200));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {a:[1,2,3,4,16].map(i=>v('fast[0]['+i+']')),name:v('inf[0].name'),role:v('inf[0].role'),mo:v('inf[0].mo'),daily:v('inf[0].daily'),set:v('inf[0].set'),ml:v('fast.ml_s'),banner:document.querySelector('#gfBanner').textContent,view:document.body.className};});
 ok('answers placed on the FAST worksheet, informant table and Section 1 filled',placed.a.join()==='Y,N,NA,Y,N'&&placed.name==='Ms. Rivera'&&placed.role==='Teacher'&&placed.mo==='14'&&placed.daily==='Yes'&&/Classroom/.test(placed.set)&&/A: Independent math work/.test(placed.ml)&&/Collected 1 FAST response/.test(placed.banner)&&placed.view==='view-fast',placed);
 /* a numeric instrument through the hosted link */
 await page.evaluate(w=>{const e=document.querySelector('[name="rp.w.pbq"]');e.value=w.join('\n');e.dispatchEvent(new Event('input',{bubbles:true}));rpInst.value='pbq';rpInst.dispatchEvent(new Event('change'));},PBQ);
 const link2=await page.evaluate(()=>__rp.link());
 await rp.goto(link2);await sleep(500);
 const r2=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,nums:document.querySelectorAll('li.it:first-child .opts label').length,key:(document.querySelector('.key')||{}).textContent||''}));
 ok('respond.html renders the PBQ from the link: 15 items, 0 to 6, with the anchors',r2.items===15&&r2.nums===7&&/about 10%/.test(r2.key),r2);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Mr. Okafor';inp[1].value='Para';document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+(i%7)+'"]').click();});document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const code2=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>document.querySelector('#rpDlg').close());await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);
 await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code2);await sleep(100);await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const pbq=await page.evaluate(()=>{const v=n=>document.querySelector('[name="'+n+'"]').value;return {ver:document.querySelector('#pbqVer').value,a:[1,2,8,15].map(i=>v('pbq[0]['+i+']')),name:v('inf[0].name')};});
 ok('PBQ answers placed with the 15-item version',pbq.ver==='15'&&pbq.a.join()==='0,1,0,0'&&pbq.name==='Mr. Okafor',pbq);
 /* the wording and the email save with the file */
 const data=await page.evaluate(async()=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};document.querySelector('#saveBtn').click();await new Promise(r=>setTimeout(r,300));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return got?await got.text():'';});
 ok('wording and email in the saved file',/rp\.w\.fast/.test(data)&&/bcba@example\.org/.test(data));
 await page.reload();await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await (await page.$('#fileIn')).setInputFiles({name:'ia1.json',mimeType:'application/json',buffer:Buffer.from(data)});await sleep(500);
 ok('reopened: wording count back, informant kept',/16 pasted/.test(await page.evaluate(()=>document.querySelector('[data-rpw="fast"]').textContent))&&await page.evaluate(()=>document.querySelector('[name="inf[0].name"]').value==='Mr. Okafor'));
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
