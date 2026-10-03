/* v21.39: respondent pages for IN-1's question sets (open-ended answers), the answer code they send back by email or
   as a file when it is too long for an email link (the library holds it back), and Collect responses into a respondent's interview record */
const {chromium,fs,BASE,ROOT,wire,sleep}=require(__dirname+'/lib.js');
const FILE='NBH-Workstation/IN-1_Stakeholder-Interview-Record_v2026-09.html',URL=BASE+'/'+FILE;
/* the pre-edit form for the print-page comparison: a copy set aside (IN1_PRE), else the committed version. v21.40 added
   five questions to the parent set, which the blank print carries (one empty parent interview), so the blank print is one
   page longer than before v21.40 (6 pages before, 7 after); a pre-v21.40 copy is one page shorter, a later one the same. */
let PRE=process.env.IN1_PRE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/v2140/in1/IN-1.pre.html';
if(!fs.existsSync(PRE)){try{const h=require('child_process').execSync('git show HEAD:'+FILE,{cwd:ROOT,maxBuffer:1<<26});PRE=__dirname+'/out/in1-respond/pre.html';fs.writeFileSync(PRE,h);}catch(e){PRE='';}}
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const grab=async(pg,fn)=>pg.evaluate(async(src)=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
  const name=await (new Function('return ('+src+')')())();await new Promise(r=>setTimeout(r,250));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {name,text:got?await got.text():''};},fn.toString());
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
 const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};});
 ok('library loaded beside the form',await page.evaluate(()=>!!window.NBH_RESPOND&&!window.NBH_RESPOND_MISSING));
 ok('toolbar has the two buttons and the setup sheet the email field',await page.evaluate(()=>!!document.querySelector('#rpBtn')&&!!document.querySelector('#rcBtn')&&!!document.querySelector('[data-m="email"]')));
 await page.evaluate(()=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('client','Sample Student');set('sid','12345');set('bcba','J. Newsome, BCBA');set('email','bcba@example.org');set('beh','Aggression: forceful contact of the hand with another person.');});
 /* the dialog, prefilled */
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const dlg=await page.evaluate(()=>({open:document.querySelector('#rpDlg').open,student:rpStudent.value,email:rpEmail.value,beh:rpBeh.value,status:document.querySelector('#rpStatus').hidden,saveOn:!rpSave.disabled,word:document.querySelector('#rpWordRow').style.display}));
 ok('dialog prefilled: initials and ID, email, behavior; ready; the student word row hidden',dlg.open&&dlg.student==='S.S. (ID 12345)'&&dlg.email==='bcba@example.org'&&/Aggression: forceful/.test(dlg.beh)&&dlg.status&&dlg.saveOn&&dlg.word==='none',dlg);
 await page.evaluate(()=>{rpInst.value='student';rpInst.dispatchEvent(new Event('change'));});
 ok('student set without the student\'s word: save disabled with a reason',await page.evaluate(()=>rpSave.disabled&&!document.querySelector('#rpStatus').hidden&&/own word/.test(document.querySelector('#rpStatus').textContent)&&document.querySelector('#rpWordRow').style.display===''));
 await page.evaluate(()=>{rpWord.value='hit';rpWord.dispatchEvent(new Event('input'));});
 const stu=await page.evaluate(()=>({on:!rpSave.disabled,q:__rp.payload().open.map(o=>o.label).join('\n')}));
 ok('student set: the word replaces [target behavior], 12 answers (v21.40: the communication question added)',stu.on&&/when you hit\./.test(stu.q)&&!/\[target behavior\]/.test(stu.q)&&stu.q.split('\n').length===12,stu.q.slice(0,120));
 await page.evaluate(()=>{rpInst.value='parent';rpInst.dispatchEvent(new Event('change'));rpDue.value='10/10/2026';});
 const pay=await page.evaluate(()=>{const p=__rp.payload();return {form:p.form,inst:p.inst,items:p.items.length,open:p.open.length,yns:p.open.filter(o=>o.type==='yns').length,heads:p.open.filter(o=>o.type==='yns'&&/^\d+\. /.test(o.label)).length,max:p.open.filter(o=>o.max===1500).length,first:p.open[0].label,email:p.email,due:p.due,mailMax:p.mailMax};});
 ok('parent payload: form IN-1, no items, 35 answers (15 yns checklist rows under 2 question heads, 20 text answers of 1500; v21.40 added five questions), mailMax 1800',pay.form==='IN-1'&&pay.inst==='parent'&&pay.items===0&&pay.open===35&&pay.yns===15&&pay.heads===2&&pay.max===20&&/^1\. Describe your child/.test(pay.first)&&pay.email==='bcba@example.org'&&pay.due==='10/10/2026'&&pay.mailMax===1800,pay);
 /* the page as a file */
 const html=await grab(page,()=>__rp.file());
 ok('page file named and self-contained',/^IN-1_Parent_respondent_S\.S\._ID_12345_\.html$/.test(html.name)&&/NBH_RESPOND_RUNTIME/.test(html.text)&&/What are your child/.test(html.text)&&!/Sample Student/.test(html.text),html.name);
 const link=await page.evaluate(()=>__rp.link());
 ok('link points at respond.html with the payload',/\/NBH-Workstation\/respond\.html#p=[A-Za-z0-9_-]{100,}$/.test(link),link.slice(0,80));
 /* the parent answers the file */
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(html.text,{waitUntil:'load'});await sleep(300);
 const r1=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,prog:!!document.querySelector('.prog'),tas:document.querySelectorAll('textarea:not(.code)').length,maxl:document.querySelector('textarea:not(.code)').getAttribute('maxlength'),
   yns:document.querySelectorAll('.yns').length,choice:document.querySelectorAll('.yns .opts label').length,notes:document.querySelectorAll('.yns input[type=text]').length,heads:Array.from(document.querySelectorAll('label.f')).filter(l=>/^5\. Do you believe .* \u2014 Currently on medication\?$/.test(l.textContent)||/^8\. Does the problem behavior occur more often when: \u2014 A certain type/.test(l.textContent)).length,
   student:document.querySelector('.def').textContent,extras:document.querySelectorAll('.grid2 input[type=text]').length}));
 ok('respondent page: no items card, 35 answers (20 typed at 1500, 15 as Yes / No / Sometimes with a note), 2 question heads, the student label',r1.items===0&&!r1.prog&&r1.tas===20&&r1.maxl==='1500'&&r1.yns===15&&r1.choice===45&&r1.notes===15&&r1.heads===2&&/S\.S\. \(ID 12345\)/.test(r1.student)&&r1.extras===2,r1);
 await rp.evaluate(()=>{document.querySelector('button:not(.ghost)').click();});await sleep(100);
 ok('send without a name asks first',await rp.evaluate(()=>!document.querySelector('.warn').hidden&&/Your name/.test(document.querySelector('.warn').textContent)));
 const LONG='He is funny and affectionate and very into his tablet; he is easier at home than at school as long as the day is predictable and nobody rushes him.';
 await rp.evaluate((LONG)=>{const inp=document.querySelectorAll('.grid2 input[type=text]');inp[0].value='Ms. Rivera';inp[1].value='Mother';
   document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value=(i+1)+'. '+LONG;});
   document.querySelectorAll('.yns').forEach((y,i)=>{y.querySelectorAll('.opts label')[i%3].click();});
   document.querySelector('.yns input[type=text]').value='since March';},LONG);
 /* v21.40 (25): the page asks whether the respondent understands the definition; Send waits for an answer */
 await rp.evaluate(()=>{document.querySelector('button:not(.ghost)').click();});await sleep(100);
 ok('send without the definition answered asks for it',await rp.evaluate(()=>!document.querySelector('.warn').hidden&&/understand the definition/.test(document.querySelector('.warn').textContent)));
 await rp.evaluate(()=>{document.querySelector('#nbhr-conf input[value="yes"]').click();});
 await rp.evaluate(()=>{document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const sent=await rp.evaluate(()=>{const sc=Array.from(document.querySelectorAll('.nr-card')).pop(),row2=document.querySelector('#nbhr-mail').parentNode;return {code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),mailHidden:document.querySelector('#nbhr-mail').hidden,
   done:Array.from(sc.querySelectorAll('.warn,.done')).filter(e=>!e.hidden).map(e=>e.textContent).join(' | '),order:Array.from(row2.querySelectorAll('button')).map(b=>b.textContent),lead:row2.querySelector('button').className};});
 ok('Send gives a code too long for an email link: held by the page, said so, Save as a file (primary) then Copy the code lead, the mail link hidden',/^NBH1\./.test(sent.code)&&sent.mail.length>1800&&/longer than an email link can carry/.test(sent.done)&&/bcba@example\.org/.test(sent.done)&&sent.order[0]==='Save as a file'&&sent.order[1]==='Copy the code'&&sent.lead===''&&sent.mailHidden,{len:sent.mail.length,order:sent.order,lead:sent.lead,done:sent.done.slice(0,80)});
 const dec=await rp.evaluate(c=>{const o=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.slice(5).replace(/-/g,'+').replace(/_/g,'/')),ch=>ch.charCodeAt(0))));return {form:o.form,inst:o.inst,name:o.name,role:o.role,q4_0:o.open.q4_0,q4_1:o.open.q4_1,q0:o.open.q0.slice(0,20),n:Object.keys(o.open).length,confirmed:o.confirmed};},sent.code);
 ok('the code carries the set, the name, the relationship, each checklist row with its note, every answer and the definition answer',dec.form==='IN-1'&&dec.inst==='parent'&&dec.name==='Ms. Rivera'&&dec.role==='Mother'&&dec.q4_0==='Yes; since March'&&dec.q4_1==='No'&&dec.q0==='1. He is funny and a'&&dec.n===35&&dec.confirmed==='yes',dec);
 const saved=await grab(rp,()=>{Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Save as a file').click();return 'x';});
 ok('Save as a file gives the code as a .nbhr.txt',/^NBH1\.[A-Za-z0-9_-]+\n$/.test(saved.text)&&saved.text.trim()===sent.code,saved.text.slice(0,40));
 /* collect the file */
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await (await page.$('#rcFile')).setInputFiles({name:'IN-1_parent_Ms._Rivera.nbhr.txt',mimeType:'text/plain',buffer:Buffer.from(saved.text)});await sleep(300);
 const found=await page.evaluate(()=>({status:document.querySelector('#rcStatus').textContent,rows:document.querySelectorAll('#rcOut tbody tr').length,txt:document.querySelector('#rcOut').textContent,to:document.querySelector('#rcOut [data-rcto]').value,opts:Array.from(document.querySelector('#rcOut [data-rcto]').options).map(o=>o.textContent)}));
 ok('the file read: one parent response, 35 of 35, understood the definition, going to the empty first respondent',/1 file read/.test(found.status)&&found.rows===1&&/1 response found/.test(found.txt)&&/Ms\. Rivera/.test(found.txt)&&/Mother/.test(found.txt)&&/35 of 35/.test(found.txt)&&/understood/.test(found.txt)&&found.to==='0'&&found.opts.join('|')==='1. Parent or guardian (empty)|New respondent: Parent or guardian',found);
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const today=new Date(),ymd=(today.getMonth()+1)+'/'+today.getDate()+'/'+String(today.getFullYear()).slice(2);
 const placed=await page.evaluate(()=>({n:S.resp.length,r:S.resp[0],a0:S.ans['0_0'],a1:S.ans['0_1'],mx4:S.mx['0_4'],n4:S.ans['0_4'],mx7:S.mx['0_7'],n7:S.ans['0_7'],a14:S.ans['0_14'],banner:document.querySelector('#rcBanner').textContent,hidden:document.querySelector('#rcBanner').hidden,view:document.body.className,
   head:document.querySelector('#intBody .resp-int.cur table.ihead').textContent,row:document.querySelector('#respTbl tbody tr input[data-f="n"]').value,pct:document.querySelector('#respTbl tbody tr td:nth-child(8)').textContent,radio:document.querySelector('[name="mx_0_4_0"][value="Yes"]').checked}));
 ok('placed into respondent 1: name, relationship, date, interviewer, written format; every answer; the checklists with the note; the interview shown',placed.n===1&&placed.r.n==='Ms. Rivera'&&placed.r.rel==='Mother'&&placed.r.d===ymd&&placed.r.by==='J. Newsome, BCBA'&&placed.r.role==='Parent or guardian'&&placed.r.fmt==='Written (respondent page)'&&/^1\. He is funny/.test(placed.a0)&&/^2\. He is funny/.test(placed.a1)&&placed.mx4.join()==='Yes,No,Sometimes,Yes,No'&&/^Currently on medication: since March\n5\. He is funny/.test(placed.n4)&&placed.mx7.length===10&&placed.mx7[0]==='Sometimes'&&/^8\. He is funny/.test(placed.n7)&&/^15\. He is funny/.test(placed.a14)
   &&/Collected 1 response from respondent pages into respondent 1 \(Ms\. Rivera\)/.test(placed.banner)&&!placed.hidden&&placed.view==='view-int'&&/Ms\. Rivera/.test(placed.head)&&placed.row==='Ms. Rivera'&&placed.pct==='100%'&&placed.radio,placed);
 /* a code of another form is refused */
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);
 await page.evaluate(()=>{const c=NBH_RESPOND.encode({v:1,form:'IA-1',inst:'fast',n:16,ans:[]});rcText.value=c;__rp.read([c]);});
 ok('a code of another form is refused by name',await page.evaluate(()=>/belong to another form \(IA-1\)/.test(document.querySelector('#rcOut').textContent)));
 /* the school set through the hosted link: short answers, so the email route works, and a second respondent lands in a new slot */
 await page.evaluate(()=>document.querySelector('#rcDlg').close());await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(100);
 await page.evaluate(()=>{rpInst.value='school';rpInst.dispatchEvent(new Event('change'));});
 const link2=await page.evaluate(()=>__rp.link());
 await rp.goto(link2);await sleep(500);
 const r2=await rp.evaluate(()=>({tas:document.querySelectorAll('textarea:not(.code)').length,items:document.querySelectorAll('li.it').length,prog:!!document.querySelector('.prog'),first:document.querySelector('label.f').textContent,student:document.querySelector('.def').textContent,band:document.querySelector('h1').textContent}));
 ok('respond.html renders the school set from the link like the file: 20 typed answers (v21.40: six questions added, one a checklist), no items card, the student label',r2.tas===20&&r2.items===0&&!r2.prog&&/S\.S\. \(ID 12345\)/.test(r2.student)&&/Teacher, Staff Member/.test(r2.band),r2);
 await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Mr. Okafor';inp[1].value='5th grade teacher';document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value='Short answer '+(i+1);});document.querySelector('#nbhr-conf input[value="unsure"]').click();document.querySelector('button:not(.ghost)').click();});await sleep(300);
 const sent2=await rp.evaluate(()=>({code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),done:document.querySelector('.done').textContent}));
 ok('short answers: Send gives a code and a mailto to the interviewer that fits an email link',/^NBH1\./.test(sent2.code)&&/^mailto:bcba%40example\.org\?subject=Teacher%20and%20staff%20questions%20for%20Form%20IN-1/.test(sent2.mail)&&sent2.mail.length<1900&&/email program should open/.test(sent2.done),{len:sent2.mail.length,mail:sent2.mail.slice(0,90)});
 await page.evaluate(()=>document.querySelector('#rpDlg').close());await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);
 await page.evaluate(c=>{rcText.value='From: Mr. Okafor\n\n'+c+'\n\nSent today';__rp.read([rcText.value]);},sent2.code);await sleep(100);
 const found2=await page.evaluate(()=>({to:document.querySelector('#rcOut [data-rcto]').value,opts:Array.from(document.querySelector('#rcOut [data-rcto]').options).map(o=>o.textContent).join('|'),txt:document.querySelector('#rcOut').textContent}));
 ok('the pasted school response goes to a new Teacher by default (no school respondent yet)',found2.to==='new:Teacher'&&found2.opts==='New respondent: Teacher|New respondent: Staff member|New respondent: Related service provider'&&/20 of 26/.test(found2.txt)&&/unsure/.test(found2.txt)&&/5th grade teacher/.test(found2.txt),found2);
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed2=await page.evaluate(()=>({n:S.resp.length,r:S.resp[1],a:S.ans['1_0'],a13:S.ans['1_13'],a19:S.ans['1_19'],mx19:S.mx['1_19'],head:document.querySelector('#intBody .resp-int[data-ri="1"] table.ihead').textContent,cur:S.cur,first:S.resp[0].n,bar:document.querySelector('#rbar').textContent,conv:document.querySelector('#convTbl').textContent}));
 ok('second respondent in the next slot as a teacher (written, unsure about the definition on the heading), the first kept, the convergence table carrying both',placed2.n===2&&placed2.r.role==='Teacher'&&placed2.r.n==='Mr. Okafor'&&placed2.r.rel==='5th grade teacher'&&placed2.r.fmt==='Written (respondent page)'&&placed2.r.cf==='unsure'&&/respondent page: unsure about the definition/.test(placed2.head)&&placed2.a==='Short answer 1'&&placed2.a13==='Short answer 14'&&placed2.a19==='Short answer 20'&&placed2.mx19.join()===',,,,,'&&placed2.cur===1&&placed2.first==='Ms. Rivera'&&/Mr\. Okafor/.test(placed2.bar)&&/Mr\. Okafor/.test(placed2.conv)&&/Short answer 7/.test(placed2.conv),placed2);
 /* a third of the same set lands after the second, not on the first */
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);
 await page.evaluate(c=>{__rp.read([c,c.replace(/NBH1\./,'NBH1.')]);},sent2.code);
 const found3=await page.evaluate(()=>({rows:document.querySelectorAll('#rcOut tbody tr').length,to:document.querySelector('#rcOut [data-rcto]').value,opts:Array.from(document.querySelector('#rcOut [data-rcto]').options).map(o=>o.textContent).join('|')}));
 ok('the same teacher again (once, though pasted twice) goes to their own record by name',found3.rows===1&&found3.to==='1'&&/^2\. Mr\. Okafor\|New respondent: Teacher/.test(found3.opts),found3);
 await page.evaluate(()=>document.querySelector('#rcDlg').close());
 /* the email and the collected interviews save with the file */
 const data=await grab(page,()=>{document.querySelector('#saveBtn').click();return 'x';});
 ok('email and the collected answers in the saved file',/"email": ?"bcba@example\.org"/.test(data.text)&&/Ms\. Rivera/.test(data.text)&&/since March/.test(data.text)&&/Short answer 14/.test(data.text));
 await page.reload();await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await (await page.$('#fileIn')).setInputFiles({name:'in1.json',mimeType:'application/json',buffer:Buffer.from(data.text)});await sleep(500);
 const back=await page.evaluate(()=>({email:document.querySelector('[data-m="email"]').value,n:S.resp.length,mx:S.mx['0_4'],name:S.resp[1].n,fmt:S.resp[0].fmt,cf:S.resp[1].cf,sel:document.querySelector('#respTbl tbody tr select[data-f="fmt"]').value}));
 ok('reopened: email back on the setup sheet, both respondents, the checklist, the written format and the definition answer kept',back.email==='bcba@example.org'&&back.n===2&&back.mx.join()==='Yes,No,Sometimes,Yes,No'&&back.name==='Mr. Okafor'&&back.fmt==='Written (respondent page)'&&back.cf==='unsure'&&back.sel==='Written (respondent page)',back);
 /* print: a blank form prints the same number of pages as before the edit */
 let pre=-1,post=-1;if(PRE&&fs.existsSync(PRE)){const pp=await ctx.newPage();await pp.goto('file://'+PRE);await sleep(500);await pp.emulateMedia({media:'print'});pre=pages(await pp.pdf({format:'Letter',printBackground:true}));
   await pp.goto('file://'+ROOT+'/'+FILE);await sleep(500);await pp.emulateMedia({media:'print'});post=pages(await pp.pdf({format:'Letter',printBackground:true}));await pp.close();}
 ok('blank print page count '+post+' pages (pre-edit copy '+pre+'; v21.40 adds one page of parent questions to a blank print)',pre>0&&post===7&&(post===pre+1||post===pre),{pre,post});
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
