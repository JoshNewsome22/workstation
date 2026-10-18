/* v21.86 helper Q: one email per person, answers straight back, collected without opening the form.
   The reply box (box.php under php -S, as qa/reply-box-test.js serves it) and the workstation's side of the mail contract simulated
   by a test parent page that frames the form and answers {nbh:'mail'}: ok for some, an error for one; unavailable (the Mail app,
   one person at a time); declined (Not now: nothing opens). Form IA-1: Send all due now groups the rows by person (3 people, 7 rows,
   3 messages), marks only the people sent, lists the failure; the respondent page opens with the informant's name and role filled
   and locked (Not you? change), the student as first name and last initial, and ends at Sent.; __nbhBoxCollect places with no
   dialog; facts out replies; Remind all not back; the Mail app flow (Next person (2 of 3)); Send these; a reply collected when the
   form opens on the Setup sheet. Forms CF-1, SV-1 and IN-1: their own box, the people list, Email everyone not sent yet (through
   the workstation, and through the Mail app), the pages prefilled, the replies placed by __nbhBoxCollect as Collect places a code,
   a misfit held and placed anyway, nothing twice, removed from the site, the box in the saved file, the email-code fallback, facts
   out. No page errors. Needs php on the PATH and the workstation served at BASE (qa/lib.js). */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2186-q';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.Q_BOX_PORT||8156),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
const F={ia:'IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html',cf:'CF-1_Contextual-Fit-Assessment_v2026-09.html',sv:'SV-1_Social-Validity_v2026-09.html',in:'IN-1_Stakeholder-Interview-Record_v2026-09.html'};
let fails=0;const ok=(name,c,info)=>{console.log((c?'PASS ':'FAIL ')+name+(c?'':' '+JSON.stringify(info===undefined?'':info).slice(0,700)));if(!c)fails++;};
const pad=n=>String(n).padStart(2,'0'),isoD=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=isoD(new Date()),dayOff=n=>{const d=new Date();d.setDate(d.getDate()+n);return isoD(d);},mdy=i=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(i);return (+m[2])+'/'+(+m[3])+'/'+m[1];};
const MAS=Array.from({length:16},(_,i)=>(i+1)+'. Simulated MAS item '+(i+1)+' about the student and his or her problem behavior');
const linksOf=t=>(String(t||'').match(/https?:\/\/\S+respond\.html#\S+/g)||[]);
/* the parent page: frames a form (?f=) and plays the workstation's mail side; MODE ok | unavailable | declined; an address with
   "fail" in it is refused in ok mode */
const PARENT=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Simulated workstation</title></head><body style="margin:0">
<iframe id="f" style="width:1280px;height:880px;border:0"></iframe>
<script>window.MODE='ok';window.ASKS=[];const q=new URLSearchParams(location.search);document.getElementById('f').src='/NBH-Workstation/'+q.get('f');
addEventListener('message',e=>{const d=e.data;if(!d||d.nbh!=='mail')return;ASKS.push(JSON.parse(JSON.stringify(d)));
  const r=MODE==='unavailable'?{nbh:'mail-result',req:d.req,unavailable:true,why:'no Google key on this iPad (simulated)'}
    :MODE==='declined'?{nbh:'mail-result',req:d.req,unavailable:true,declined:true,why:'Not now'}
    :{nbh:'mail-result',req:d.req,from:'jnewsome@school.example',results:d.messages.map(m=>({to:m.to,ok:!/fail/.test(m.to),err:/fail/.test(m.to)?'the address was refused (simulated)':''}))};
  setTimeout(()=>e.source.postMessage(r,'*'),150);});</script></body></html>`;
fs.writeFileSync(OUT+'/parent.html',PARENT);
const PURL=f=>BASE+'/qa/out/v2186-q/parent.html?f='+encodeURIComponent(f);
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let phpErr='';php.stderr.on('data',d=>{phpErr+=d;});php.on('error',e=>{phpErr+=String(e);});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=(await r.json()).ok;}catch(e){}}
  ok('A0 box.php answers (php -S on '+PORT+')',up,phpErr.slice(0,200));if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1300,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const page=await ctx.newPage();wire(page,log);
  const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);
  const frameOf=async file=>{await page.goto(PURL(file));for(let i=0;i<60;i++){const fr=page.frames().find(x=>x.url().indexOf('/NBH-Workstation/'+file)>=0);if(fr){try{if(await fr.evaluate(()=>!!window.__rp&&!!window.NBH_RESPOND&&document.readyState==='complete'))return fr;}catch(e){}}await sleep(150);}throw new Error('no frame '+file);};
  const asks=()=>page.evaluate(()=>window.ASKS);
  const mode=m=>page.evaluate(m=>{window.MODE=m;},m);
  const dlgBtn=(fr,a)=>fr.evaluate(a=>{const b=document.querySelector('dialog.nbh-mail button[data-mf="'+a+'"]');if(!b)return false;b.click();return true;},a);
  const dlgState=fr=>fr.evaluate(()=>{const d=document.querySelector('dialog.nbh-mail');return d?{open:d.open,title:d.querySelector('h3').textContent,body:d.querySelector('.nbh-mail-body').textContent,btns:[...d.querySelectorAll('.b button')].map(b=>b.textContent)}:null;});
  const waitDlg=async(fr,re)=>{for(let i=0;i<40;i++){const s=await dlgState(fr);if(s&&re.test(s.title))return s;await sleep(150);}return dlgState(fr);};
  /* a respondent page: what it shows before Send, then Send */
  const pageInfo=()=>rp.evaluate(()=>{const g=document.querySelectorAll('.grid2 input[type=text]');const me=document.querySelector('#nbhr-me');return {more:[...g].slice(2).map(x=>x.value).concat([...document.querySelectorAll('.grid2 select')].map(x=>x.value)),name:g[0]&&g[0].value,nameRO:g[0]&&g[0].readOnly,role:g[1]&&g[1].value,roleRO:g[1]&&g[1].readOnly,me:me&&!me.hidden?me.textContent:'',def:(document.querySelector('.def')||{}).textContent||'',
    sub:[...document.querySelectorAll('.nr-card .sub')].map(e=>e.textContent).join(' | '),foot:(document.querySelector('.foot')||{}).textContent||'',items:document.querySelectorAll('li.it').length};});
  const answerSend=async(pick,opts)=>{opts=opts||{};await rp.evaluate(([pick,opts])=>{const pk=new Function('i','return ('+pick+')(i)');
      document.querySelectorAll('li.it').forEach((li,i)=>{const v=pk(i);const r=li.querySelector('input[value="'+v+'"]');if(r)r.click();});
      const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();document.querySelectorAll('textarea:not(.code)').forEach((t,i)=>{if(opts.text)t.value=opts.text+' '+(i+1);});
      document.querySelector('button:not(.ghost)').click();},[String(pick),opts]);await sleep(1500);
    return rp.evaluate(()=>({done:(document.querySelector('#nbhr-done')||{}).innerHTML||'',code:document.querySelector('.code').hidden,row:document.querySelector('#nbhr-mail').closest('.row').hidden,mailHref:document.querySelector('#nbhr-mail').getAttribute('href')}));};

  /* ================= A. Form IA-1 in the (simulated) workstation ================= */
  let ia=await frameOf(F.ia);
  await ia.evaluate(([MAS,BOXURL])=>{window.confirm=()=>true;try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}
    const set=(n,v)=>{const el=document.querySelector('[name="'+n+'"]');el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
    set('m.client','Mateo Rivera');set('m.sid','4471823');set('m.email','bcba@example.org');set('m.assessor','J. Ellis');set('rp.w.mas',MAS.join('\n'));set('rp.box',BOXURL);
    set('m.beh','Hitting');set('m.def','Forceful contact of an open or closed hand with a peer or adult.');
    [['Ms. Lopez','lopez@example.org','Teacher'],['Mr. Okafor','okafor@example.org','Para'],['Ms. Chen','chen.fail@example.org','Aide']].forEach((p,i)=>{set('inf['+i+'].name',p[0]);set('inf['+i+'].email',p[1]);set('inf['+i+'].role',p[2]);});
    set('inf[0].mo','14');set('inf[0].daily','Yes');set('inf[0].set','Classroom and lunch');
    window.__ia1Targets.add('Screaming','A vocalization above conversation level for 3 seconds or more.');},[MAS,BOXURL]);
  await ia.evaluate(()=>document.querySelector('#viewSeg button[data-view="outs"]').click());await sleep(300);
  await ia.evaluate(()=>{const q=document.querySelector('#outPlan [data-oi="qabf"]');if(q.checked)q.click();document.querySelector('#outPlan').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#outPlanBtn').click();});await sleep(300);
  const rowId=(lab,inst,inf)=>ia.evaluate(([lab,inst,inf])=>{const T=__rp.targets(),r=T.list.find(x=>x.label===lab);const o=__rp.outs().find(x=>x.tgt===r.id&&x.inst===inst&&x.inf===inf);return o?o.id:null;},[lab,inst,inf]);
  for(const [l,i,c] of [['Screaming','mas','B'],['Screaming','mas','C'],['Hitting','mas','C'],['Screaming','fast','B']]){const id=await rowId(l,i,c);await ia.evaluate(id=>__rp.act('del',id),id);}
  const future=await rowId('Screaming','mas','A');
  await ia.evaluate(([future,f,due])=>{__rp.outs().forEach(o=>{o.due=due;if(o.id===future)o.plan=f;});__rp.render();},[future,dayOff(10),dayOff(7)]);
  const a0=await ia.evaluate(async()=>{const ok=await __rp.ensure();return {ok,rows:__rp.outs().length,due:__rp.dueNow().length,box:!!(__rp.box()&&__rp.box().site),id:__rp.box()&&__rp.box().id};});
  ok('A1 the board: 8 rows, 7 due now (one sends on a later date), the reply box registered',a0.ok&&a0.rows===8&&a0.due===7&&a0.box,a0);
  await ia.evaluate(()=>document.querySelector('#outSendDue').click());
  const a1d=await waitDlg(ia,/^Sent|^Not sent/);
  const A1=await asks();
  const m1=A1[0]&&A1[0].messages||[];
  ok('A2 Send all due now asks the workstation once, one message per person: 3 messages for the 7 rows, to each informant’s email',A1.length===1&&A1[0].id==='IA-1'&&typeof A1[0].req==='string'&&m1.length===3&&m1.map(m=>m.to).join()==='lopez@example.org,okafor@example.org,chen.fail@example.org'&&m1.map(m=>linksOf(m.text).length).join()==='3,2,2',{n:A1.length,to:m1.map(m=>m.to),links:m1.map(m=>linksOf(m.text).length)});
  ok('A3 each email: a plain greeting, each questionnaire with its own link, the please-send-by date, the answers come straight back; subject with the student by first name and last initial',m1.length===3&&/^Hello Ms\. Lopez,\n/.test(m1[0].text)&&/1\. FAST about Hitting:\nhttp/.test(m1[0].text)&&/MAS about Hitting:/.test(m1[0].text)&&/FAST about Screaming:/.test(m1[0].text)&&m1[0].text.indexOf('Please send them by '+mdy(dayOff(7))+'.')>0&&/Your answers come straight back to me when you press Send\./.test(m1[0].text)&&m1[0].subject==='3 questionnaires about Mateo R.'&&m1[0].name==='Ms. Lopez'&&/\nJ\. Ellis$/.test(m1[0].text)&&!/4471823|Rivera/.test(m1[0].text+m1[0].subject),m1[0]);
  const a4=await ia.evaluate(()=>({rows:__rp.outs().map(o=>o.inf+'/'+o.inst+'/'+(o.sent?'sent:'+o.how:'-')),note:document.querySelector('#outMailNote').textContent}));
  const sentOf=c=>a4.rows.filter(r=>r[0]===c);
  ok('A4 only the people the workstation reports sent are marked Sent (by email, today); Ms. Chen’s two rows stay unsent and the failure is listed plainly',sentOf('A').filter(r=>/sent:email/.test(r)).length===3&&sentOf('B').filter(r=>/sent:email/.test(r)).length===2&&sentOf('C').every(r=>/\/-$/.test(r))&&/Sent to 2 of 3/.test(a4.note)&&/from jnewsome@school\.example/.test(a4.note)&&/Not sent: Ms\. Chen \(chen\.fail@example\.org\): the address was refused \(simulated\)/.test(a4.note)&&a1d&&/Not sent/.test(a1d.body)&&/Ms\. Chen/.test(a1d.body),{a4,a1d});
  const a4b=await ia.evaluate(()=>{const o=__rp.outs().find(x=>x.inf==='A'&&x.inst==='fast'&&x.sent);return o&&o.sent;});
  ok('A5 the row’s Sent date is today',a4b===TODAY,a4b);
  await dlgBtn(ia,'close');
  /* the respondent's page */
  const [lA1,lA2,lA3]=linksOf(m1[0].text),[lB1,lB2]=linksOf(m1[1].text);
  await rp.goto(lA1);await sleep(500);
  const p1=await pageInfo();
  ok('A6 a personal link opens with the informant’s name and role filled and locked, “Answering as Ms. Lopez (Teacher). Not you? change”, and what the informant table knows (months, daily, settings) filled',p1.name==='Ms. Lopez'&&p1.nameRO&&p1.role==='Teacher'&&p1.roleRO&&/Answering as Ms\. Lopez \(Teacher\)\. Not you\? change/.test(p1.me)&&p1.more.join('|')==='14|Classroom and lunch|Yes',p1);
  ok('A7 the student by first name and last initial only (no ID, no last name); the answers go straight to the BCBA',/Student: Mateo R\./.test(p1.def)&&!/4471823|Rivera|M\.R\./.test(p1.def)&&/go straight to J\. Ellis/.test(p1.sub)&&/locked on this device/.test(p1.foot)&&p1.items===16,p1);
  const s1=await answerSend(i=>['Y','N','Y','NA'][i%4],{text:'Independent work'});
  ok('A8 Send ends at Sent. with no code to copy and no email to open',/<b>Sent\.<\/b>/.test(s1.done)&&s1.code&&s1.row,s1);
  await rp.goto(lA2);await sleep(500);const p2=await pageInfo();
  const s2=await answerSend(i=>String(i%7));
  ok('A9 the MAS link of the same person: prefilled too, 16 items on 0 to 6, Sent.',p2.name==='Ms. Lopez'&&p2.items===16&&/<b>Sent\.<\/b>/.test(s2.done),{p2,s2});
  await rp.goto(lB1);await sleep(500);const s3=await answerSend(()=>'N');
  ok('A10 Mr. Okafor sends his FAST',/<b>Sent\.<\/b>/.test(s3.done),s3);
  await rp.goto(lB2);await sleep(500);
  const nm=await rp.evaluate(()=>{document.querySelector('#nbhr-notme').click();const g=document.querySelectorAll('.grid2 input[type=text]');return {name:g[0].value,ro:g[0].readOnly,role:g[1].value,rro:g[1].readOnly,me:document.querySelector('#nbhr-me').hidden};});
  ok('A11 Not you? change empties the name and role for whoever is answering instead',nm.name===''&&!nm.ro&&nm.role===''&&!nm.rro&&nm.me,nm);
  /* collected without opening a dialog */
  const c1=await ia.evaluate(async()=>{const r=await window.__nbhBoxCollect();const v=n=>{const e=document.querySelector('[name="'+n+'"]');return e?e.value:null;};const T=__rp.targets(),scr=T.list.find(x=>x.label==='Screaming');
    return {r,dlg:document.querySelectorAll('dialog[open]').length,fa:[1,2,3,4].map(i=>v('fast[0]['+i+']')),fb:[1,2].map(i=>v('fast[1]['+i+']')),ma:v('mas[0][2]'),rows:__rp.outs().filter(o=>o.placed).map(o=>o.inf+'/'+o.inst+'/'+(T.list.find(x=>x.id===o.tgt)||{}).label+'/'+o.from).sort(),scrA:scr&&scr.fields['fast[0][1]']};});
  ok('A12 __nbhBoxCollect places the three replies with no dialog: Ms. Lopez in column A (FAST and MAS), Mr. Okafor in B; the board marks them Placed',c1.r&&c1.r.ok===true&&c1.r.placed===3&&c1.r.held===0&&c1.r.err===''&&c1.dlg===0&&c1.fa.join()==='Y,N,Y,NA'&&c1.fb.join()==='N,N'&&c1.ma==='1'&&c1.rows.join('|')==='A/fast/Hitting/Ms. Lopez|A/mas/Hitting/Ms. Lopez|B/fast/Hitting/Mr. Okafor',c1);
  const f1=await ia.evaluate(()=>{const f=window.__nbhFactsOut();return f&&f.replies;});
  ok('A13 facts out: replies {IA-1: placed 3, last today, waiting 2 (sent and not back), held 0}',f1&&f1['IA-1']&&f1['IA-1'].placed===3&&f1['IA-1'].last===TODAY&&f1['IA-1'].waiting===2&&f1['IA-1'].held===0,f1);
  const c2=await ia.evaluate(()=>window.__nbhBoxCollect());
  ok('A14 collected again: nothing twice',c2.ok&&c2.placed===0,c2);
  /* Remind all not back: the rows sent and past their date */
  await ia.evaluate(y=>{__rp.outs().forEach(o=>{if(o.sent&&!o.recv)o.due=y;});__rp.render();},dayOff(-1));
  await ia.evaluate(()=>document.querySelector('#outRemindAll').click());await waitDlg(ia,/^Sent|^Not sent/);
  const A2=await asks(),m2=A2[1]&&A2[1].messages||[];
  const r2=await ia.evaluate(()=>__rp.outs().filter(o=>o.rem).map(o=>o.inf+'/'+o.inst+'/'+o.rem));
  ok('A15 Remind all not back: one reminder per person for the rows sent and past their date (Ms. Lopez’s FAST about Screaming, Mr. Okafor’s MAS), marked reminded today',A2.length===2&&m2.length===2&&m2.map(m=>m.to).join()==='lopez@example.org,okafor@example.org'&&m2.every(m=>/^Reminder: /.test(m.subject)&&linksOf(m.text).length===1&&/I have not received your answers yet/.test(m.text))&&r2.length===2&&r2.every(x=>x.endsWith(TODAY)),{subj:m2.map(m=>m.subject),r2});
  await dlgBtn(ia,'close');
  /* the workstation cannot send: the Mail app, one person at a time */
  await mode('unavailable');
  await ia.evaluate(()=>{window.__mt=[];NBH_RESPOND.openMail=h=>window.__mt.push(h);__rp.outs().forEach(o=>{if(o.sent&&!o.recv){o.sent='';o.how='';o.rem='';}});__rp.render();});
  await ia.evaluate(()=>document.querySelector('#outSendDue').click());
  const u1=await waitDlg(ia,/^Email 1 of 3/);
  ok('A16 unavailable: the Mail app flow opens at the first person, “Next person (2 of 3)”, with why',u1&&/Email 1 of 3: Ms\. Lopez/.test(u1.title)&&u1.btns.indexOf('Next person (2 of 3)')>=0&&/no Google key on this iPad/.test(u1.body),u1);
  await dlgBtn(ia,'open');await sleep(150);
  const u2=await ia.evaluate(f=>({mt:window.__mt.slice(),a:__rp.outs().filter(o=>o.inf==='A'&&!o.recv&&o.id!==f).map(o=>!!o.sent)}),future);
  await dlgBtn(ia,'next');const u3=await dlgState(ia);await dlgBtn(ia,'next');const u4=await dlgState(ia);await dlgBtn(ia,'open');await sleep(150);
  const u5=await ia.evaluate(()=>({mt:window.__mt.length,note:document.querySelector('#outMailNote').textContent}));
  await dlgBtn(ia,'next');const u6=await dlgState(ia);
  ok('A17 Open in Mail hands the Mail app that person’s email (mailto with the subject and the links) and marks their rows',u2.mt.length===1&&/^mailto:lopez@example\.org\?subject=Reminder|^mailto:lopez@example\.org\?subject=/.test(u2.mt[0])&&decodeURIComponent(u2.mt[0]).indexOf('respond.html#')>0&&u2.a.every(Boolean),u2);
  ok('A18 Next person moves on (2 of 3, then 3 of 3 with Finish); a person skipped is not marked',u3&&/Email 2 of 3: Mr\. Okafor/.test(u3.title)&&u3.btns.indexOf('Next person (3 of 3)')>=0&&u4&&/Email 3 of 3: Ms\. Chen/.test(u4.title)&&u4.btns.indexOf('Finish')>=0&&u5.mt===2,{u3,u4,u5});
  const u7=await ia.evaluate(f=>__rp.outs().filter(o=>!o.recv&&o.id!==f).map(o=>o.inf+':'+(o.sent?'sent':'-')).sort().join(),future);
  ok('A19 after the flow: Ms. Lopez (1 row) and Ms. Chen (2 rows) marked sent, Mr. Okafor not; the note says the workstation could not send; Done names who was not opened',u7==='A:sent,B:-,C:sent,C:sent'&&/could not send \(no Google key on this iPad \(simulated\)\)/.test(u5.note)&&u6&&/Done/.test(u6.title)&&/Not opened: Mr\. Okafor/.test(u6.body),{u7,u6,note:u5.note});
  await dlgBtn(ia,'close');
  /* Not now in the workstation: nothing opens, the rows stay unsent */
  await mode('declined');const before=(await asks()).length;
  await ia.evaluate(()=>document.querySelector('#outSendDue').click());const dd=await waitDlg(ia,/^Not sent/);
  const d1=await ia.evaluate(()=>({b:__rp.outs().filter(o=>o.inf==='B'&&!o.recv).map(o=>!!o.sent),mt:window.__mt.length,note:document.querySelector('#outMailNote').textContent}));
  ok('A20 declined (Not now): no Mail app flow, Mr. Okafor’s rows stay unsent, a quiet “Not sent.”',(await asks()).length===before+1&&dd&&dd.title==='Not sent'&&d1.b.every(x=>!x)&&d1.mt===2&&/^Not sent\./.test(d1.note),{dd,d1});
  await dlgBtn(ia,'close');
  /* Send these: the plan panel's ticks (Hitting only) */
  await mode('ok');
  await ia.evaluate(()=>{const T=__rp.targets(),s=T.list.find(x=>x.label==='Screaming'),h=T.list.find(x=>x.label==='Hitting');const ch=document.querySelector('#outPlan [data-od="'+h.id+'"][data-code="C"]');if(ch.checked)ch.click();
    const c=document.querySelector('#outPlan [data-ot="'+s.id+'"]');if(c.checked)c.click();document.querySelector('#outPlan').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#outSendThese').click();});
  await waitDlg(ia,/^Sent|^Not sent/);const A4=await asks(),m4=A4[A4.length-1].messages;
  ok('A21 Send these (the plan panel, Hitting ticked): one email to Mr. Okafor with his one Hitting row not yet sent',m4.length===1&&m4[0].to==='okafor@example.org'&&linksOf(m4[0].text).length===1&&/MAS/.test(m4[0].subject),m4.map(m=>m.to+' '+m.subject));
  await dlgBtn(ia,'close');
  /* a reply arrives; the form opened again (on the Setup sheet) collects it by itself */
  const file=await ia.evaluate(async()=>{let t=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(x=>{t=x;});return o(b);};document.querySelector('#saveBtn').click();for(let i=0;i<20&&!t;i++)await new Promise(r=>setTimeout(r,100));URL.createObjectURL=o;return t;});
  await rp.goto(linksOf(m4[0].text)[0]);await sleep(500);const s5=await answerSend(i=>String(i%4));
  ia=await frameOf(F.ia);
  await ia.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'ia1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},file);
  await sleep(3000);
  const o1=await ia.evaluate(()=>({view:document.body.className,b:document.querySelector('[name="mas[1][2]"]')&&document.querySelector('[name="mas[1][2]"]').value,row:__rp.outs().filter(o=>o.inf==='B'&&o.inst==='mas').map(o=>o.placed+'/'+o.from)}));
  ok('A22 opened again on the Setup sheet, the form collects by itself: Mr. Okafor’s MAS placed in column B, its row Placed',/<b>Sent\.<\/b>/.test(s5.done)&&!/view-outs/.test(o1.view)&&o1.b==='1'&&o1.row.join()==='true/Mr. Okafor',{o1,s5:s5.done});
  /* opened on its own: there is no workstation to ask */
  const solo=await ctx.newPage();wire(solo,log);await solo.goto(BASE+'/NBH-Workstation/'+F.ia);await sleep(600);
  const so=await solo.evaluate(()=>NBH_RESPOND.mailAsk('IA-1',[{to:'a@b.org',name:'A',subject:'s',text:'t'}]));
  ok('A23 a form opened on its own goes straight to the Mail app (unavailable, no parent)',so.unavailable===true&&/on its own/.test(so.why),so);
  await solo.close();

  /* ================= B. Form CF-1: its own box, the people list, Email everyone ================= */
  await mode('ok');
  let cf=await frameOf(F.cf);
  await cf.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('client','Mateo Rivera');set('sid','4471823');set('bcba','J. Ellis');set('email','bcba@example.org');set('plan','BIP dated 9/2/26');
    S.raters[0].name='Ms. Lopez';S.raters[0].role='Classroom teacher';S.raters[0].when='Morning math';S.raters[1].name='Mr. Okafor';S.raters[1].role='Paraprofessional';renderAll();});
  await cf.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
  await sleep(700);
  const b0=await cf.evaluate(()=>({send:!!document.querySelector('#rbSend'),box:document.querySelector('#rbBox').value,coll:!!document.querySelector('#rbCollect'),rb:__rp.kit.rb().box}));
  ok('B1 CF-1: the dialog has the people list and the box field (the address typed in IA-1 on this device comes along), Collect has the box button; opening the dialog registers this file’s own box',b0.send&&b0.box===BOXURL&&b0.coll&&b0.rb&&b0.rb.site===BOXURL&&b0.rb.id!==a0.id,{b0,ia:a0.id});
  await cf.evaluate(u=>{const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);await sleep(900);
  const b1=await cf.evaluate(()=>({b:__rp.kit.rb().box,line:document.querySelector('#rbBoxLine').textContent,link:(NBH_RESPOND.payloadFromHash(__rp.link())||{}).box}));
  ok('B2 the box is registered for this file (its own id and keys, the site), and the dialog’s links carry it (no private key)',b1.b&&/^[a-f0-9]{32}$/.test(b1.b.id)&&b1.b.site===BOXURL&&/Reply box ready at 127\.0\.0\.1:/.test(b1.line)&&b1.link&&b1.link.b===b1.b.id&&!JSON.stringify(b1.link).includes('"d"')&&fs.existsSync(data+'/'+b1.b.id),{b:b1.b&&b1.b.id,line:b1.line});
  await cf.evaluate(()=>{document.querySelector('#rbFromSheet').click();document.querySelector('#rbAdd').click();});await sleep(100);
  await cf.evaluate(()=>{const rows=[...document.querySelectorAll('#rbRows tr[data-id]')];const put=(tr,f,v)=>{const e=tr.querySelector('[data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    put(rows[0],'email','lopez@example.org');put(rows[1],'email','okafor@example.org');put(rows[2],'name','Ms. Chen');put(rows[2],'role','SLP');put(rows[2],'email','chen.fail@example.org');document.querySelector('#rpDue').value='10/23/2026';});
  const b3=await cf.evaluate(()=>__rp.kit.rb().sends.map(s=>s.name+'/'+s.pg+'/'+s.round+'/'+s.email));
  ok('B3 Add the people on the sheet takes the two respondents; + Person adds Ms. Chen; each page picked from the role (teacher, para, related-service)',b3.join('|')==='Ms. Lopez/teacher/1/lopez@example.org|Mr. Okafor/para/1/okafor@example.org|Ms. Chen/rsp/1/chen.fail@example.org',b3);
  const nAsk=(await asks()).length;
  await cf.evaluate(()=>document.querySelector('#rbSendAll').click());await waitDlg(cf,/^Sent|^Not sent/);
  const B4=(await asks()).slice(nAsk),mc=B4[0]&&B4[0].messages||[];
  const b4=await cf.evaluate(()=>({s:__rp.kit.rb().sends.map(s=>s.name+':'+(s.sent?s.how:'-')),note:document.querySelector('#rbNote').textContent}));
  ok('B4 Email everyone not sent yet: one message each (3), id CF-1; Ms. Lopez and Mr. Okafor marked sent, Ms. Chen not, the failure named',B4.length===1&&B4[0].id==='CF-1'&&mc.length===3&&mc.every(m=>linksOf(m.text).length===1&&/Your answers come straight back to me when you press Send/.test(m.text)&&/Please send it by 10\/23\/2026/.test(m.text))&&/^Contextual fit, round 1 about Mateo R\.$/.test(mc[0].subject)&&b4.s.join()==='Ms. Lopez:email,Mr. Okafor:email,Ms. Chen:-'&&/Not sent: Ms\. Chen \(chen\.fail@example\.org\): the address was refused/.test(b4.note),{subj:mc.map(m=>m.subject),b4});
  await dlgBtn(cf,'close');
  await rp.goto(linksOf(mc[0].text)[0]);await sleep(500);const q1=await pageInfo();
  ok('B5 the CF-1 page: Ms. Lopez and her role filled and locked, the student as Mateo R., the answers straight to J. Ellis',q1.name==='Ms. Lopez'&&q1.nameRO&&q1.role==='Classroom teacher'&&q1.roleRO&&q1.more[0]==='Morning math'&&/Mateo R\./.test(q1.def)&&!/4471823/.test(q1.def)&&/your answers go straight to J\. Ellis\./.test(q1.sub)&&q1.items===21,q1);
  const t1=await answerSend(i=>String(6-(i%3)));
  await rp.goto(linksOf(mc[1].text)[0]);await sleep(500);const t2=await answerSend(i=>String(2+(i%2)));
  /* a reply that does not fit: a page with an item fewer */
  const misfit=await cf.evaluate(async u=>{const p=NBH_RESPOND.isShort&&NBH_RESPOND.isShort(u)?await NBH_RESPOND.openShort(u):NBH_RESPOND.payloadFromHash(u);   /* v21.88 the email's link is short */p.items.pop();p.who={name:'Ms. Extra',role:'Aide',sid:''};return __rp.kit.base()+NBH_RESPOND.payloadToHash(p);},linksOf(mc[1].text)[0]);
  await rp.goto(misfit);await sleep(500);const t3=await answerSend(()=>'4');
  ok('B6 the two respondents and a misfit page send to the box: Sent.',[t1,t2,t3].every(t=>/<b>Sent\.<\/b>/.test(t.done)&&t.code),[t1.done,t2.done,t3.done]);
  await cf.evaluate(()=>document.querySelector('#rpDlg').close());
  const b7=await cf.evaluate(async()=>{const r=await window.__nbhBoxCollect();return {r,dlg:document.querySelectorAll('dialog[open]').length,r0:S.raters[0].name,s0:S.scores[1]['0_0'],s20:S.scores[1]['20_0'],r1:S.raters[1].name,s1:S.scores[1]['0_1'],sends:__rp.kit.rb().sends.map(s=>s.name+':'+(s.back||'-')),held:__rp.kit.rb().box.held.map(h=>h.name+'/'+h.why)};});
  ok('B7 __nbhBoxCollect places the two in their own columns (round 1) with no dialog, marks them back, holds the misfit',b7.r.ok&&b7.r.placed===2&&b7.r.held===1&&b7.dlg===0&&b7.r0==='Ms. Lopez'&&b7.s0==='6'&&b7.s20==='4'&&b7.r1==='Mr. Okafor'&&b7.s1==='2'&&b7.sends.join()==='Ms. Lopez:'+TODAY+',Mr. Okafor:'+TODAY+',Ms. Chen:-'&&b7.held.join()==='Ms. Extra/fit',b7);
  const b8=await cf.evaluate(()=>{const f=window.__nbhFactsOut();return {rep:f&&f.replies,fit:!!(f&&f.fit)};});
  ok('B8 facts out: replies {CF-1: placed 2, last today, waiting 0, held 1}, beside the form’s own fit',b8.rep&&b8.rep['CF-1']&&b8.rep['CF-1'].placed===2&&b8.rep['CF-1'].last===TODAY&&b8.rep['CF-1'].waiting===0&&b8.rep['CF-1'].held===1&&b8.fit,b8);
  const b9=await cf.evaluate(async()=>{const r=await window.__nbhBoxCollect();document.querySelector('#rcBtn').click();await new Promise(r=>setTimeout(r,100));const h=document.querySelector('#rbHeld').textContent;document.querySelector('#rbHeld [data-hadd]').click();await new Promise(r=>setTimeout(r,100));
    const j=S.raters.findIndex(x=>x.name==='Ms. Extra');return {r,h,j,v:j>=0?S.scores[1]['0_'+j]:null,v20:j>=0?S.scores[1]['20_'+j]:'x',held:__rp.kit.rb().box.held.length};});
  ok('B9 nothing twice; the held reply is listed in Collect responses and Place it anyway puts it in a new column (its 20 ratings)',b9.r.placed===0&&/Reply from Ms\. Extra/.test(b9.h)&&/does not fit/.test(b9.h)&&b9.j>=2&&b9.v==='4'&&b9.v20===undefined&&b9.held===0,b9);
  await cf.evaluate(()=>document.querySelector('#rcDlg').close());
  const cfile=await cf.evaluate(async()=>{let t=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(x=>{t=x;});return o(b);};document.querySelector('#saveBtn').click();for(let i=0;i<20&&!t;i++)await new Promise(r=>setTimeout(r,100));URL.createObjectURL=o;return t;});
  const cj=JSON.parse(cfile);
  ok('B10 the saved CF-1 file carries its box (id, token, keys, the replies taken) and the people sent to',cj.S.rb&&cj.S.rb.box&&cj.S.rb.box.id===b1.b.id&&cj.S.rb.box.priv&&cj.S.rb.box.got.length===3&&cj.S.rb.sends.length===3&&cj.S.rb.placed>=3,cj.S.rb&&{got:cj.S.rb.box&&cj.S.rb.box.got.length,placed:cj.S.rb.placed});
  cf=await frameOf(F.cf);
  await cf.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'cf1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},cfile);await sleep(2200);
  const b11=await cf.evaluate(async()=>{const r=await window.__nbhBoxCollect();return {id:__rp.kit.rb().box&&__rp.kit.rb().box.id,r,n:S.raters[0].name,sends:__rp.kit.rb().sends.length};});
  ok('B11 reopened: the same box and the people; nothing placed twice',b11.id===b1.b.id&&b11.r.placed===0&&b11.n==='Ms. Lopez'&&b11.sends===3,b11);
  const b12=await cf.evaluate(async()=>{const j=await __rp.kit.client.purge();return j;});
  const left=fs.readdirSync(data+'/'+b1.b.id).filter(f=>/^r-/.test(f));
  ok('B12 Remove the collected replies from the site: the three gone there',b12&&b12.deleted===3&&left.length===0,{b12,left});
  /* the email code stays the way back when the box cannot be reached */
  const unreach=await cf.evaluate(async u=>{const p=NBH_RESPOND.isShort&&NBH_RESPOND.isShort(u)?await NBH_RESPOND.openShort(u):NBH_RESPOND.payloadFromHash(u);   /* v21.88 the email's link is short */p.box.u='http://127.0.0.1:8157/box.php';return __rp.kit.base()+NBH_RESPOND.payloadToHash(p);},linksOf(mc[0].text)[0]);
  await rp.goto(unreach);await sleep(500);const t4=await answerSend(()=>'5');
  ok('B13 a page whose box cannot be reached falls back to the email with the code, to the BCBA',/reply box could not be reached/.test(t4.done)&&!t4.code&&/^mailto:bcba%40example\.org/.test(t4.mailHref||''),t4);

  /* ================= C. Form SV-1 ================= */
  let sv=await frameOf(F.sv);
  await sv.evaluate(u=>{const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('client','Mateo Rivera');set('sid','4471823');set('bcba','J. Ellis');set('email','bcba@example.org');
    S.resp[0].name='Ms. Lopez';S.resp[0].role='Teacher (implementer)';S.resp[1].name='Ms. Grant';S.resp[1].role='Caregiver';renderAll();
    document.querySelector('#rpBtn').click();const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);await sleep(900);
  await sv.evaluate(()=>{document.querySelector('#rbFromSheet').click();const rows=[...document.querySelectorAll('#rbRows tr[data-id]')];['lopez@example.org','grant@example.org'].forEach((v,i)=>{const e=rows[i].querySelector('[data-f="email"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));});});
  const nA=(await asks()).length;await sv.evaluate(()=>document.querySelector('#rbSendAll').click());await waitDlg(sv,/^Sent|^Not sent/);
  const ms=((await asks())[nA]||{}).messages||[];
  const c1s=await sv.evaluate(()=>__rp.kit.rb().sends.map(s=>s.name+'/'+s.pg+'/'+s.round+'/'+(s.sent?'sent':'-')));
  ok('C1 SV-1: two people from the sheet (teacher, caregiver; the pre round), one email each through the workstation, both marked sent',ms.length===2&&ms[0].to==='lopez@example.org'&&c1s.join('|')==='Ms. Lopez/teacher/pre/sent|Ms. Grant/caregiver/pre/sent',{n:ms.length,c1s});
  await dlgBtn(sv,'close');await sv.evaluate(()=>document.querySelector('#rpDlg').close());
  await rp.goto(linksOf(ms[0].text)[0]);await sleep(500);const v1=await pageInfo();const w1=await answerSend(i=>i===0?'NA':'5');
  await rp.goto(linksOf(ms[1].text)[0]);await sleep(500);const w2=await answerSend(()=>'6');
  ok('C2 the SV-1 pages: the name filled and locked, the student as Mateo R.; both Sent.',v1.name==='Ms. Lopez'&&v1.nameRO&&/Answering as Ms\. Lopez \(Teacher \(implementer\)\)/.test(v1.me)&&/Mateo R\./.test(v1.def)&&/<b>Sent\.<\/b>/.test(w1.done)&&/<b>Sent\.<\/b>/.test(w2.done),{v1,w1:w1.done});
  const c3s=await sv.evaluate(async()=>{const r=await window.__nbhBoxCollect();const f=window.__nbhFactsOut();const ks=Object.keys(S.rat.pre);return {r,dlg:document.querySelectorAll('dialog[open]').length,n0:S.resp[0].name,n1:S.resp[1].name,k0:ks.filter(k=>/_0$/.test(k)).map(k=>S.rat.pre[k]),k1:ks.filter(k=>/_1$/.test(k)).map(k=>S.rat.pre[k]),rep:f&&f.replies,sv:!!(f&&f.sv)};});
  ok('C3 __nbhBoxCollect places both into their own rows (pre round, N/A kept as N/A) with no dialog; facts out replies {SV-1: placed 2, waiting 0, held 0}',c3s.r.ok&&c3s.r.placed===2&&c3s.dlg===0&&c3s.n0==='Ms. Lopez'&&c3s.n1==='Ms. Grant'&&c3s.k0[0]==='NA'&&c3s.k0.slice(1).every(v=>v==='5')&&c3s.k1.length>0&&c3s.k1.every(v=>v==='6')&&c3s.rep&&c3s.rep['SV-1']&&c3s.rep['SV-1'].placed===2&&c3s.rep['SV-1'].waiting===0&&c3s.rep['SV-1'].held===0&&c3s.rep['SV-1'].last===TODAY&&c3s.sv,c3s);

  /* ================= D. Form IN-1, through the Mail app ================= */
  let inn=await frameOf(F.in);await mode('unavailable');
  await inn.evaluate(u=>{window.__mt=[];NBH_RESPOND.openMail=h=>window.__mt.push(h);const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('client','Mateo Rivera');set('sid','4471823');set('bcba','J. Ellis');set('email','bcba@example.org');set('beh','Hitting: forceful contact of a hand with a peer.');
    document.querySelector('#rpBtn').click();const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);await sleep(900);
  await inn.evaluate(()=>{const add=(n,r,m)=>{document.querySelector('#rbAdd').click();const rows=[...document.querySelectorAll('#rbRows tr[data-id]')],tr=rows[rows.length-1];[['name',n],['role',r],['email',m]].forEach(([f,v])=>{const e=tr.querySelector('[data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});};
    add('Ms. Lopez','Teacher','lopez@example.org');add('Mr. Grant','Father','grant@example.org');});
  const d0=await inn.evaluate(()=>__rp.kit.rb().sends.map(s=>s.name+'/'+s.pg));
  await inn.evaluate(()=>document.querySelector('#rbSendAll').click());const e1=await waitDlg(inn,/^Email 1 of 2/);
  await dlgBtn(inn,'open');await sleep(100);await dlgBtn(inn,'next');await sleep(100);await dlgBtn(inn,'open');await sleep(100);await dlgBtn(inn,'next');const e2=await dlgState(inn);
  const d1i=await inn.evaluate(()=>({mt:window.__mt.slice(),s:__rp.kit.rb().sends.map(s=>s.name+':'+s.how+':'+(s.sent?'sent':'-')),note:document.querySelector('#rbNote').textContent}));
  ok('D1 IN-1 where the workstation cannot send: the Mail app one person at a time (Email 1 of 2, Next person (2 of 2)), both marked sent through the Mail app',d0.join()==='Ms. Lopez/school,Mr. Grant/parent'&&e1&&/Email 1 of 2: Ms\. Lopez/.test(e1.title)&&e1.btns.indexOf('Next person (2 of 2)')>=0&&d1i.mt.length===2&&/^mailto:lopez@example\.org/.test(d1i.mt[0])&&/^mailto:grant@example\.org/.test(d1i.mt[1])&&d1i.s.join()==='Ms. Lopez:mail:sent,Mr. Grant:mail:sent'&&e2&&/Done/.test(e2.title)&&/2 of 2 opened in the Mail app/.test(d1i.note),{d0,e1,d1i,e2});
  await dlgBtn(inn,'close');await inn.evaluate(()=>document.querySelector('#rpDlg').close());
  const body=decodeURIComponent(d1i.mt[0].replace(/^[^?]*\?/,'').split('&').find(x=>/^body=/.test(x)).slice(5));
  await rp.goto(linksOf(body)[0]);await sleep(500);const i1=await pageInfo();
  const x1=await answerSend(()=>'',{text:'Written answer'});
  ok('D2 the IN-1 page from the Mail app’s email: Ms. Lopez and Teacher filled and locked, the student as Mateo R.; Sent. (long answers need no file)',i1.name==='Ms. Lopez'&&i1.nameRO&&i1.role==='Teacher'&&/Mateo R\./.test(i1.def)&&/<b>Sent\.<\/b>/.test(x1.done)&&x1.code,{i1,x1});
  const d3=await inn.evaluate(async()=>{const r=await window.__nbhBoxCollect();const i=S.resp.findIndex(x=>x.n==='Ms. Lopez');const f=window.__nbhFactsOut();return {r,i,role:i>=0?S.resp[i].role:'',fmt:i>=0?S.resp[i].fmt:'',a:i>=0?Object.keys(S.ans).filter(k=>k.indexOf(i+'_')===0).length:0,rep:f&&f.replies,dlg:document.querySelectorAll('dialog[open]').length};});
  ok('D3 __nbhBoxCollect places Ms. Lopez’s answers into a new Teacher respondent (written), no dialog; facts out replies {IN-1: placed 1, waiting 1 (Mr. Grant), held 0}',d3.r.ok&&d3.r.placed===1&&d3.i>=0&&d3.role==='Teacher'&&/Written/.test(d3.fmt)&&d3.a>5&&d3.dlg===0&&d3.rep&&d3.rep['IN-1']&&d3.rep['IN-1'].placed===1&&d3.rep['IN-1'].waiting===1&&d3.rep['IN-1'].held===0,d3);

  /* ================= E. no errors ================= */
  const bad=log.concat(rlog).filter(l=>l.type==='pageerror'||(l.type==='error'&&!/8157|Failed to load resource|net::ERR|ERR_CONNECTION/i.test(l.text)));
  ok('E1 no page errors in the forms, the simulated workstation or the respondent pages',!bad.length,bad.slice(0,5));
  await br.close();php.kill();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
