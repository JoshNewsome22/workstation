/* v21.39: CF-1 respondent pages (one per respondent and round), the answer code they send back, and Collect responses
   placing it into the respondent's column and round */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html';
const PRE=process.env.CF1_PRE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/respond-sv/CF-1_pre-edit.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g)||[]).length;
const grab=async(page,fn)=>page.evaluate(async fn=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
  const r=(new Function('return ('+fn+')()'))();await new Promise(r=>setTimeout(r,250));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {r,text:got?await got.text():''};},fn.toString());
const answer=async(rp,who,pick)=>rp.evaluate(([who,pick])=>{const inp=document.querySelectorAll('input[type=text]');who.forEach((v,i)=>{inp[i].value=v;});const pk=/=>/.test(pick)?new Function('return ('+pick+')')():()=>pick;
  document.querySelectorAll('li.it').forEach((li,i)=>{const v=pk(i);if(v)li.querySelector('input[value="'+v+'"]').click();});document.querySelector('button:not(.ghost)').click();},[who,String(pick)]).catch(()=>{});
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
 const page=await ctx.newPage();wire(page,log);
 /* the blank print, before anything is entered */
 await page.goto(URL);await sleep(700);await page.emulateMedia({media:'print'});const blankNow=pages(await page.pdf({preferCSSPageSize:true,printBackground:true}));await page.emulateMedia({media:null});
 let blankPre=4;if(fs.existsSync(PRE)){const p2=await ctx.newPage();await p2.goto('file://'+PRE);await sleep(700);await p2.emulateMedia({media:'print'});blankPre=pages(await p2.pdf({preferCSSPageSize:true,printBackground:true}));await p2.close();}
 ok('blank print page count unchanged against the pre-edit file ('+blankPre+')',blankNow===blankPre,{blankNow,blankPre});
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};});
 ok('library loaded beside the form',await page.evaluate(()=>!!window.NBH_RESPOND&&!window.NBH_RESPOND_MISSING));
 ok('toolbar has the two buttons; the email field is on Setup',await page.evaluate(()=>!!document.querySelector('#rpBtn')&&!!document.querySelector('#rcBtn')&&!!document.querySelector('[data-m="email"]')));
 await page.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
   set('client','Sample Student');set('sid','12345');set('bcba','J. Newsome, BCBA');set('email','bcba@example.org');set('plan','BIP dated 8/12/26 (Form TD-1)');});
 /* the dialog, prefilled */
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const dlg=await page.evaluate(()=>({open:document.querySelector('#rpDlg').open,student:rpStudent.value,email:rpEmail.value,round:rpRound.value,status:document.querySelector('#rpStatus').hidden,saveOn:!rpSave.disabled,note:rpNote.textContent}));
 ok('dialog prefilled: initials and ID, email, the current round; 21 items',dlg.open&&dlg.student==='S.S. (ID 12345)'&&dlg.email==='bcba@example.org'&&dlg.round==='1'&&dlg.status&&dlg.saveOn&&/21 items, round 1/.test(dlg.note),dlg);
 await page.evaluate(()=>{rpEmail.value='';rpEmail.dispatchEvent(new Event('input'));});
 ok('no email: save disabled with a reason',await page.evaluate(()=>rpSave.disabled&&!document.querySelector('#rpStatus').hidden&&/Enter your email/.test(document.querySelector('#rpStatus').textContent)));
 await page.evaluate(()=>{rpEmail.value='bcba@example.org';rpEmail.dispatchEvent(new Event('input'));rpDue.value='10/10/2026';});
 const pay=await page.evaluate(()=>__rp.payload());
 ok('payload: form CF-1, teacher round 1, the 21 items in order, 1 to 6, four extras',pay.form==='CF-1'&&pay.inst==='teacher-r1'&&pay.items.length===21&&/step by step/.test(pay.items[0].text)&&/hard day/.test(pay.items[20].text)&&pay.scale.max===6&&pay.extras.map(x=>x.id).join()==='name,role,when,mo'&&/BIP dated 8\/12\/26/.test(pay.sub),pay.inst);
 /* the page as a file */
 const file=await grab(page,()=>__rp.file());
 ok('page file named and self-contained, no full name',/^CF-1_teacher-r1_respondent_S\.S\._ID_12345_\.html$/.test(file.r)&&/NBH_RESPOND_RUNTIME/.test(file.text)&&/without looking it up/.test(file.text)&&!/Sample Student/.test(file.text),file.r);
 const link=await page.evaluate(()=>__rp.link());
 ok('link points at respond.html with the payload',/\/NBH-Workstation\/respond\.html#p=[A-Za-z0-9_-]{100,}$/.test(link),link.slice(0,80));
 /* the teacher answers the file */
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(file.text,{waitUntil:'load'});await sleep(300);
 const r1=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,opts:document.querySelectorAll('li.it .opts label').length,inputs:document.querySelectorAll('input[type=text]').length,open:document.querySelectorAll('textarea:not(.code)').length,student:document.querySelector('.def').textContent,key:document.querySelector('.key').textContent}));
 ok('respondent page renders 21 items with 1 to 6, four questions about the respondent, no open items, the student label',r1.items===21&&r1.opts===126&&r1.inputs===4&&r1.open===0&&/S\.S\. \(ID 12345\)/.test(r1.student)&&/strongly disagree/.test(r1.key),r1);
 await answer(rp,['Ms. Rivera','Teacher','Morning math and the return from lunch','14'],i=>String(6-(i%3)));await sleep(300);
 const sent=await rp.evaluate(()=>({prog:document.querySelector('.prog').textContent,code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),done:!document.querySelector('.done').hidden}));
 ok('21 of 21 answered, then Send gives a code and a mailto to the case BCBA',/21 of 21/.test(sent.prog)&&/^NBH1\./.test(sent.code)&&/^mailto:bcba%40example\.org\?subject=Contextual%20fit%20round%201%20answers/.test(sent.mail)&&sent.mail.indexOf(encodeURIComponent(sent.code))>0&&sent.done,{prog:sent.prog,mail:sent.mail.slice(0,90)});
 ok('mailto fits an email link',sent.mail.length<1900,sent.mail.length);
 /* collect it */
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(c=>{rcText.value='From: Ms. Rivera\n\n'+c+'\n\nSent today';__rp.read([rcText.value]);},sent.code);await sleep(100);
 const found=await page.evaluate(()=>({rows:document.querySelectorAll('#rcOut tbody tr').length,txt:document.querySelector('#rcOut').textContent}));
 ok('one response found: Teacher, round 1, 21 of 21, goes to the first empty row',found.rows===1&&/1 response found/.test(found.txt)&&/Teacher/.test(found.txt)&&/21 of 21/.test(found.txt)&&/Respondent 1 \(empty row\)/.test(found.txt),found.txt.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>({n:S.raters.length,r:S.raters[0],s0:S.scores[1]['0_0'],s1:S.scores[1]['1_0'],s2:S.scores[1]['2_0'],s20:S.scores[1]['20_0'],round:S.round,view:document.body.className,cell:document.querySelector('#cfTbl select[data-i="0"][data-j="0"]').value,head:document.querySelector('#cfTbl thead').textContent}));
 ok('placed into respondent 1, round 1: name, role as typed, periods, months, the 21 ratings; the Ratings sheet shows them',placed.n===4&&placed.r.name==='Ms. Rivera'&&placed.r.role==='Teacher'&&/Morning math/.test(placed.r.when)&&placed.r.mo==='14'&&placed.s0==='6'&&placed.s1==='5'&&placed.s2==='4'&&placed.s20==='4'&&placed.round===1&&placed.view==='view-rate'&&placed.cell==='6'&&/Ms\. Rivera/.test(placed.head),placed);
 /* a paraprofessional through the hosted link lands in the next column; the role defaults from the page when left blank */
 await page.evaluate(()=>{document.querySelector('#rpBtn').click();rpRole.value='para';rpRole.dispatchEvent(new Event('change'));});
 const link2=await page.evaluate(()=>__rp.link());await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await rp.goto(link2);await sleep(500);
 const r2=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,band:document.querySelector('.band').textContent,sub:document.querySelector('.sub').textContent}));
 ok('respond.html renders the paraprofessional round 1 page from the link',r2.items===21&&/Form CF-1/.test(r2.band)&&/a paraprofessional who will run the plan/.test(r2.sub),r2);
 await answer(rp,['Aide B','','Afternoon writing','3'],i=>i===11?'':String(2+(i%2)));await sleep(300);
 ok('one item left blank: the first Send stops and names it; the second press sends on purpose',await rp.evaluate(()=>!document.querySelector('.warn').hidden&&/Unanswered item: <span class="miss">12<\/span>/.test(document.querySelector('.warn').innerHTML)&&/press Send once more/.test(document.querySelector('.warn').textContent)&&document.querySelector('.code').hidden));
 await rp.evaluate(()=>document.querySelector('button:not(.ghost)').click());await sleep(300);
 ok('the second press sends with the gap stated',await rp.evaluate(()=>/Sending with 1 left blank/.test(document.querySelector('.warn').textContent)&&!document.querySelector('.code').hidden));
 const code2=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code2);await sleep(100);
 const f2=await page.evaluate(()=>document.querySelector('#rcOut').textContent);
 ok('the second respondent goes to respondent 2 (20 of 21: one left blank), role from the page',/Respondent 2 \(empty row\)/.test(f2)&&/20 of 21/.test(f2)&&/Paraprofessional/.test(f2),f2.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const p2=await page.evaluate(()=>({n:S.raters.length,r:S.raters[1],s0:S.scores[1]['0_1'],s11:S.scores[1]['11_1'],r0:S.raters[0].name,flag:document.querySelector('#flagTbl').textContent}));
 ok('paraprofessional placed in column 2; the blank item stays blank; column 1 untouched; the Barriers sheet flags her low ratings',p2.n===4&&p2.r.name==='Aide B'&&p2.r.role==='Paraprofessional'&&p2.r.when==='Afternoon writing'&&p2.r.mo==='3'&&p2.s0==='2'&&p2.s11===undefined&&p2.r0==='Ms. Rivera'&&/Aide B/.test(p2.flag),p2);
 /* the teacher's round 2 lands in the teacher's own column */
 await page.evaluate(()=>{document.querySelector('#rpBtn').click();rpRole.value='teacher';rpRound.value='2';rpRound.dispatchEvent(new Event('change'));});
 const link3=await page.evaluate(()=>__rp.link());await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await rp.goto('about:blank');await rp.goto(link3);await sleep(500);
 ok('round 2 page says so',/Round 2 \(after enhancement\)/.test(await rp.evaluate(()=>document.querySelector('h1').textContent)));
 await answer(rp,['MS. RIVERA','Teacher','',''],()=>'6');await sleep(300);
 const code3=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code3);await sleep(100);
 const f3=await page.evaluate(()=>document.querySelector('#rcOut').textContent);
 ok('the same respondent (name matched, case aside) goes to her own column',/Respondent 1 \(Ms\. Rivera\)/.test(f3),f3.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const p3=await page.evaluate(()=>({n:S.raters.length,name:S.raters[0].name,when:S.raters[0].when,r1:S.scores[1]['0_0'],r2:S.scores[2]['0_0'],r2b:S.scores[2]['20_0'],round:S.round,sum:document.querySelector('#sumVerdict').textContent}));
 ok('round 2 ratings placed in column 1 beside round 1; her periods kept; the Summary compares the rounds',p3.n===4&&p3.name==='Ms. Rivera'&&/Morning math/.test(p3.when)&&p3.r1==='6'&&p3.r2==='6'&&p3.r2b==='6'&&p3.round===2&&/Round 1 .* round 2/.test(p3.sum),p3);
 /* a code of another form is refused */
 await page.evaluate(()=>{const c=NBH_RESPOND.encode({v:1,form:'SV-1',inst:'teacher-pre',n:11,ans:[],date:'2026-10-03',name:'X'});document.querySelector('#rcBtn').click();rcText.value=c;__rp.read([c]);});await sleep(100);
 ok('an SV-1 code is refused by name',/belong to another form \(SV-1\)/.test(await page.evaluate(()=>document.querySelector('#rcOut').textContent)));
 await page.evaluate(()=>document.querySelector('#rcDlg').close());
 /* round trip through Save data */
 const data=await grab(page,()=>document.querySelector('#saveBtn').click());
 ok('the email and the collected columns are in the saved file',/bcba@example\.org/.test(data.text)&&/Ms\. Rivera/.test(data.text)&&/Aide B/.test(data.text));
 await page.reload();await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await (await page.$('#fileIn')).setInputFiles({name:'cf1.json',mimeType:'application/json',buffer:Buffer.from(data.text)});await sleep(500);
 const back=await page.evaluate(()=>({email:document.querySelector('[data-m="email"]').value,name:S.raters[0].name,role:S.raters[1].role,r2:S.scores[2]['0_0'],r1:S.scores[1]['0_1']}));
 ok('reopened: email, respondents and both rounds back',back.email==='bcba@example.org'&&back.name==='Ms. Rivera'&&back.role==='Paraprofessional'&&back.r2==='6'&&back.r1==='2',back);
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(100);
 ok('the dialog takes the email from the reopened file',await page.evaluate(()=>rpEmail.value==='bcba@example.org'&&!rpSave.disabled));
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
