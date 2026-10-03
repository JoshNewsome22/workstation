/* v21.39: SV-1 respondent pages (one per respondent role and round), the answer code they send back, and Collect responses
   placing it into the respondent's row and round */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/SV-1_Social-Validity_v2026-09.html';
const PRE=process.env.SV1_PRE||'/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/respond-sv/SV-1_pre-edit.html';
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(d)));if(!c)fails++;};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g)||[]).length;
const grab=async(page,fn)=>page.evaluate(async fn=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(got)return;return ck.apply(this,arguments);};
  const r=(new Function('return ('+fn+')()'))();await new Promise(r=>setTimeout(r,250));URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;return {r,text:got?await got.text():''};},fn.toString());
const answer=async(rp,name,mode,pick,opens)=>rp.evaluate(([name,mode,pick,opens])=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value=name;if(inp[1])inp[1].value=mode;const pk=/=>/.test(pick)?new Function('return ('+pick+')')():()=>pick;
  document.querySelectorAll('li.it').forEach((li,i)=>{const v=pk(i);if(v)li.querySelector('input[value="'+v+'"]').click();});
  document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{t.value=opens[i]||'';});document.querySelector('button:not(.ghost)').click();},[name,mode,String(pick),opens]).catch(()=>{});
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
   set('client','Sample Student');set('sid','12345');set('nick','Sam');set('bcba','J. Newsome, BCBA');set('email','bcba@example.org');set('beh','Tipping the desk and leaving the room');set('plan','BIP dated 8/12/26');});
 /* the dialog, prefilled */
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 const dlg=await page.evaluate(()=>({open:document.querySelector('#rpDlg').open,student:rpStudent.value,email:rpEmail.value,nick:rpNick.value,beh:rpBeh.value,status:document.querySelector('#rpStatus').hidden,saveOn:!rpSave.disabled,note:rpNote.textContent}));
 ok('dialog prefilled: initials and ID, email, first name, behavior; teacher pre = 11 items',dlg.open&&dlg.student==='S.S. (ID 12345)'&&dlg.email==='bcba@example.org'&&dlg.nick==='Sam'&&/Tipping/.test(dlg.beh)&&dlg.status&&dlg.saveOn&&/11 items for the teacher \(implementer\), pre round/.test(dlg.note),dlg);
 const pay=await page.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('change'));};set('rpRole','student');set('rpRound','post');const s=__rp.payload();set('rpRole','admin');set('rpRound','pre');const a=__rp.payload();set('rpRole','teacher');set('rpRound','pre');rpDue.value='10/10/2026';return {s,a};});
 ok('student post page: 5 student items in the student wording, 3 open items in the student wording',pay.s.inst==='student-post'&&pay.s.items.map(x=>x.n).join()==='G6,P7a,P7b,E8a,E8b'&&/I want to get better at/.test(pay.s.items[0].text)&&pay.s.open.length===3&&/What do you most want to be different for you at school/.test(pay.s.open[0].label),pay.s.items.map(x=>x.n));
 ok('administrator pre page: the adult items and P8; the nick in the wording',pay.a.inst==='admin-pre'&&pay.a.items.length===12&&pay.a.items.some(x=>x.n==='P8')&&/something Sam will actually need/.test(pay.a.items[1].text),pay.a.items.map(x=>x.n));
 /* the page as a file */
 const file=await grab(page,()=>__rp.file());
 ok('page file named and self-contained, no full name',/^SV-1_teacher-pre_respondent_S\.S\._ID_12345_\.html$/.test(file.r)&&/NBH_RESPOND_RUNTIME/.test(file.text)&&/Sam will actually need/.test(file.text)&&!/Sample Student/.test(file.text),file.r);
 const link=await page.evaluate(()=>__rp.link());
 ok('link points at respond.html with the payload',/\/NBH-Workstation\/respond\.html#p=[A-Za-z0-9_-]{100,}$/.test(link),link.slice(0,80));
 /* the teacher answers the file */
 const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);await rp.setContent(file.text,{waitUntil:'load'});await sleep(300);
 const r1=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,opts:document.querySelectorAll('li.it .opts label').length,open:document.querySelectorAll('textarea:not(.code)').length,student:document.querySelector('.def').textContent,key:document.querySelector('.key').textContent,first:document.querySelector('li.it .q').textContent,na:document.querySelector('li.it .opts label:last-child input').value,openFirst:!!(document.querySelector('textarea').compareDocumentPosition(document.querySelector('ol.items'))&Node.DOCUMENT_POSITION_FOLLOWING)}));
 ok('respondent page renders 11 items with 1 to 6 and N/A, the two open items first, the student label and the anchors',r1.items===11&&r1.opts===77&&r1.open===2&&r1.na==='NA'&&r1.openFirst&&/S\.S\. \(ID 12345\)/.test(r1.student)&&/Tipping the desk/.test(r1.student)&&/strongly disagree/.test(r1.key)&&/^G1\./.test(r1.first),r1);
 await answer(rp,'Ms. Rivera','on my own',i=>String(6-(i%3)),['Fewer blow-ups during independent work.','No.']);await sleep(300);
 const sent=await rp.evaluate(()=>({prog:document.querySelector('.prog').textContent,code:document.querySelector('.code').value,mail:document.querySelector('#nbhr-mail').getAttribute('href'),done:!document.querySelector('.done').hidden}));
 ok('11 of 11 answered, then Send gives a code and a mailto to the case BCBA',/11 of 11/.test(sent.prog)&&/^NBH1\./.test(sent.code)&&/^mailto:bcba%40example\.org\?subject=Social%20validity%20pre-round%20answers/.test(sent.mail)&&sent.mail.indexOf(encodeURIComponent(sent.code))>0&&sent.done,{prog:sent.prog,mail:sent.mail.slice(0,90)});
 ok('mailto fits an email link',sent.mail.length<1900,sent.mail.length);
 /* collect it */
 await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
 await page.evaluate(c=>{rcText.value='From: Ms. Rivera\n\n'+c+'\n\nSent today';__rp.read([rcText.value]);},sent.code);await sleep(100);
 const found=await page.evaluate(()=>({rows:document.querySelectorAll('#rcOut tbody tr').length,txt:document.querySelector('#rcOut').textContent}));
 ok('one response found: teacher, pre, 11 of 11, goes to the first empty row',found.rows===1&&/1 response found/.test(found.txt)&&/Teacher \(implementer\)/.test(found.txt)&&/Pre/.test(found.txt)&&/11 of 11/.test(found.txt)&&/Respondent 1 \(empty row\)/.test(found.txt),found.txt.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const placed=await page.evaluate(()=>({n:S.resp.length,r:S.resp[0],g1:S.rat.pre.G1_0,g2:S.rat.pre.G2_0,g3:S.rat.pre.G3_0,p6:S.rat.pre.P6_0,go:S.open.pre.Go_0,po:S.open.pre.Po_0,round:S.round,view:document.body.className,cell:document.querySelector('#gTbl_pre select[data-k="G1_0"]').value,prog:document.querySelector('#progTxt').textContent}));
 ok('placed into respondent 1, pre round: name, role, mode, pre date, ratings, open items; the Goals sheet shows them',placed.n===4&&placed.r.name==='Ms. Rivera'&&placed.r.role==='Teacher (implementer)'&&placed.r.mode==='Self-completed'&&/^\d{4}-\d\d-\d\d$/.test(placed.r.pre)&&placed.g1==='6'&&placed.g2==='5'&&placed.g3==='4'&&placed.p6==='5'&&/Fewer blow-ups/.test(placed.go)&&placed.po==='No.'&&placed.round==='pre'&&placed.view==='view-goals'&&placed.cell==='6'&&/^11 of /.test(placed.prog),placed);
 /* a caregiver through the hosted link lands in the next row */
 await page.evaluate(()=>{document.querySelector('#rpBtn').click();rpRole.value='caregiver';rpRole.dispatchEvent(new Event('change'));});
 const link2=await page.evaluate(()=>__rp.link());await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await rp.goto(link2);await sleep(500);
 const r2=await rp.evaluate(()=>({items:document.querySelectorAll('li.it').length,band:document.querySelector('.band').textContent,sub:document.querySelector('.sub').textContent}));
 ok('respond.html renders the caregiver pre page from the link: 11 items',r2.items===11&&/Form SV-1/.test(r2.band)&&/caregiver, pre round/.test(r2.sub),r2);
 await answer(rp,'Mother (D. S.)','interview',i=>i===2?'NA':String(3+(i%2)),['That the school stops calling me at work.','']);await sleep(300);
 const code2=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code2);await sleep(100);
 const f2=await page.evaluate(()=>document.querySelector('#rcOut').textContent);
 ok('the second respondent goes to respondent 2 (11 of 11 answered, one of them N/A)',/Respondent 2 \(empty row\)/.test(f2)&&/11 of 11/.test(f2),f2.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const p2=await page.evaluate(()=>({n:S.resp.length,r:S.resp[1],g1:S.rat.pre.G1_1,g3:S.rat.pre.G3_1,go:S.open.pre.Go_1,r0:S.resp[0].name,cell:document.querySelector('#gTbl_pre select[data-k="G3_1"]').value}));
 ok('caregiver placed in row 2 with Interview mode; N/A placed as the form\'s N/A; row 1 untouched',p2.n===4&&p2.r.name==='Mother (D. S.)'&&p2.r.role==='Caregiver'&&p2.r.mode==='Interview'&&p2.g1==='3'&&p2.g3==='NA'&&/calling me at work/.test(p2.go)&&p2.r0==='Ms. Rivera'&&p2.cell==='NA',p2);
 /* the teacher's post round lands in the teacher's own row */
 await page.evaluate(()=>{document.querySelector('#rpBtn').click();rpRole.value='teacher';rpRound.value='post';rpRole.dispatchEvent(new Event('change'));});
 const link3=await page.evaluate(()=>__rp.link());await page.evaluate(()=>document.querySelector('#rpDlg').close());
 await rp.goto('about:blank');await rp.goto(link3);await sleep(500);
 const r3=await rp.evaluate(()=>({items:Array.from(document.querySelectorAll('li.it .q b')).map(b=>b.textContent),open:document.querySelectorAll('textarea:not(.code)').length}));
 ok('teacher post page: 18 items (G, P and E) and the three open items',r3.items.length===18&&r3.items[11]==='E1.'&&r3.items[17]==='E7.'&&r3.open===3,r3);
 await answer(rp,'ms. rivera','','5',['Same as before.','No.','Desk-tipping is rare now.']);await sleep(300);
 const code3=await rp.evaluate(()=>document.querySelector('.code').value);
 await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(100);await page.evaluate(c=>{rcText.value=c;__rp.read([c]);},code3);await sleep(100);
 const f3=await page.evaluate(()=>document.querySelector('#rcOut').textContent);
 ok('the same respondent (name matched, case aside) goes to her own row',/Respondent 1 \(Ms\. Rivera\)/.test(f3)&&/Post/.test(f3),f3.slice(0,300));
 await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(300);
 const p3=await page.evaluate(()=>({n:S.resp.length,name:S.resp[0].name,post:S.resp[0].post,pre:S.rat.pre.G1_0,e1:S.rat.post.E1_0,e7:S.rat.post.E7_0,eo:S.open.post.Eo_0,round:S.round,sum:document.querySelector('#secMetrics').textContent}));
 ok('post ratings placed in row 1 beside the pre round; the Summary counts both rounds (Effects mean with E5 reversed)',p3.n===4&&p3.name==='Ms. Rivera'&&/^\d{4}-/.test(p3.post)&&p3.pre==='6'&&p3.e1==='5'&&p3.e7==='5'&&/rare now/.test(p3.eo)&&p3.round==='post'&&/Effects, post4\.57/.test(p3.sum),p3);
 /* a code of another form is refused */
 await page.evaluate(()=>{const c=NBH_RESPOND.encode({v:1,form:'CF-1',inst:'teacher-r1',n:21,ans:[],date:'2026-10-03',name:'X'});document.querySelector('#rcBtn').click();rcText.value=c;__rp.read([c]);});await sleep(100);
 ok('a CF-1 code is refused by name',/belong to another form \(CF-1\)/.test(await page.evaluate(()=>document.querySelector('#rcOut').textContent)));
 await page.evaluate(()=>document.querySelector('#rcDlg').close());
 /* round trip through Save data */
 const data=await grab(page,()=>document.querySelector('#saveBtn').click());
 ok('the email and the collected rows are in the saved file',/bcba@example\.org/.test(data.text)&&/Ms\. Rivera/.test(data.text)&&/"E1_0": "5"/.test(data.text));
 await page.reload();await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await (await page.$('#fileIn')).setInputFiles({name:'sv1.json',mimeType:'application/json',buffer:Buffer.from(data.text)});await sleep(500);
 const back=await page.evaluate(()=>({email:document.querySelector('[data-m="email"]').value,name:S.resp[0].name,role:S.resp[1].role,e1:S.rat.post.E1_0,go:S.open.pre.Go_1}));
 ok('reopened: email, respondents, ratings and open items back',back.email==='bcba@example.org'&&back.name==='Ms. Rivera'&&back.role==='Caregiver'&&back.e1==='5'&&/calling me/.test(back.go),back);
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(100);
 ok('the dialog takes the email from the reopened file',await page.evaluate(()=>rpEmail.value==='bcba@example.org'&&!rpSave.disabled));
 ok('no console or page error on the form or the respondent page',log.length===0&&rlog.length===0,{log,rlog});
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
