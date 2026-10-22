/* v23.97 Form RS-1: Readings discussed on a contact from the workstation's references (a summary each), what was discussed and the
   follow-up; on the monthly record, the RBT record and the year summary; the emailed record as an attached page (the mail carries
   attachments). */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
const file=pre=>fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>f.startsWith(pre));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'')));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1180,height:820}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL+file('RS-1_'));await sleep(1200);
 const d=await p.evaluate(()=>({n:(typeof NBH_READINGS!=='undefined'?NBH_READINGS:[]).length,whole:(typeof NBH_READINGS!=='undefined'?NBH_READINGS:[]).every(r=>r.apa&&r.sum&&r.k),fct:(typeof NBH_READINGS!=='undefined'?NBH_READINGS:[]).some(r=>/Carr, E\. G\., & Durand/.test(r.apa))}));
 ok('the references file loads beside the form: every reference the banks cite, each with a summary',d.n>=600&&d.whole&&d.fct,d);
 await p.evaluate(()=>{addContact();});await sleep(400);
 await p.evaluate(()=>document.querySelector('[data-rdadd]').click());await sleep(300);
 await p.fill('#rdQ','functional communication Carr');await sleep(200);
 const list=await p.evaluate(()=>[...document.querySelectorAll('#rdList .rd-it[data-k]')].map(b=>b.querySelector('b').textContent.slice(0,40)));
 ok('Add a reading opens the picker; a search by words finds the reference',list.length>=1&&/Carr/.test(list[0]),list);
 await p.evaluate(()=>document.querySelector('#rdList .rd-it[data-k]').click());await sleep(400);
 const r1=await p.evaluate(()=>{const c=month(curKey).contacts[0],r=c.readings[0];return {apa:r.apa.slice(0,30),sum:r.sum.length,field:document.querySelector('[data-rd="'+r.id+'"][data-f="sum"]').value.length,closed:!document.querySelector('#rdPick').open};});
 ok('the reading joins the contact with its summary prefilled, and the picker closes',r1.sum>80&&r1.field===r1.sum&&r1.closed&&/Carr/.test(r1.apa),r1);
 await p.evaluate(()=>{const c=month(curKey).contacts[0],r=c.readings[0];const s=(f,v)=>{const e=document.querySelector('[data-rd="'+r.id+'"][data-f="'+f+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('disc','We compared the two mand forms with the RBT (simulated).');s('next','Run five FCT trials with the break card before the next contact (simulated).');});
 const r2=await p.evaluate(()=>{const r=month(curKey).contacts[0].readings[0];return {disc:r.disc,next:r.next};});
 ok('what was discussed and the follow-up are kept on the reading',/compared the two mand forms/.test(r2.disc)&&/five FCT trials/.test(r2.next),r2);
 await p.evaluate(()=>{const c=month(curKey).contacts[0];c.date=curKey+'-05';c.start='09:00';c.end='10:00';renderContacts();renderPrint();});await sleep(300);
 const pr=await p.evaluate(()=>({month:document.querySelector('#monthOut').textContent,rbt:document.querySelector('#readList').textContent,year:document.querySelector('#yearOut').textContent}));
 ok('the monthly record carries the reading under its contact, with the discussion and the follow-up',/Readings discussed:/.test(pr.month)&&/Carr, E\. G\./.test(pr.month)&&/compared the two mand forms/.test(pr.month)&&/five FCT trials/.test(pr.month),pr.month.slice(0,80));
 ok('the RBT record lists it for the year and the year summary counts it',/Carr, E\. G\./.test(pr.rbt)&&/compared the two mand forms/.test(pr.rbt)&&/Readings discussed in supervision this year:\s*1/.test(pr.year));
 const own=await p.evaluate(async()=>{document.querySelector('[data-rdadd]').click();await new Promise(r=>setTimeout(r,200));document.querySelector('#rdOwnRef').value='Smith, A. (2020). A reading of my own. Journal, 1(1), 1–2.';document.querySelector('#rdOwnSum').value='My own summary.';document.querySelector('#rdOwnAdd').click();await new Promise(r=>setTimeout(r,300));const L=month(curKey).contacts[0].readings;return {n:L.length,apa:L[1]&&L[1].apa,sum:L[1]&&L[1].sum};});
 ok('a reading not in the list is typed and kept the same way',own.n===2&&/A reading of my own/.test(own.apa)&&own.sum==='My own summary.',own);
 await p.evaluate(()=>{const b=document.querySelectorAll('[data-rdrm]')[1];b.click();});await sleep(300);
 ok('Remove this reading takes it off the contact',await p.evaluate(()=>month(curKey).contacts[0].readings.length===1));
 const mail=await p.evaluate(()=>{const pg=window.__rsShare.page('month');return {file:window.__rsShare.fileName(pg),note:window.__rsShare.noteText(pg),html:/attached as a page/.test(window.__rsShare.noteHtml(pg)),rec:/Readings discussed:/.test(pg.html)};});
 ok('the email is a short note with the record attached as a page; the page holds the readings',/\.html$/.test(mail.file)&&/attached as a page/.test(mail.note)&&mail.html&&mail.rec,mail);
 const p2=await b.newPage();const errs2=[];p2.on('pageerror',e=>errs2.push(String(e)));await p2.goto(URL+'index.html');await sleep(1200);
 const raw=await p2.evaluate(()=>{const u=gmRaw({to:'a@example.org',name:'A',subject:'s',text:'t',html:'<p>h</p>',attachments:[{name:'r.html',type:'text/html',b64:btoa('<p>x</p>')}]});const s=atob(u.replace(/-/g,'+').replace(/_/g,'/')+'=='.slice(0,(4-u.length%4)%4));return {mixed:/multipart\/mixed/.test(s),alt:/multipart\/alternative/.test(s),att:/Content-Disposition: attachment; filename="r\.html"/.test(s),type:/Content-Type: text\/html; name="r\.html"/.test(s),plain:gmRaw({to:'a@example.org',subject:'s',text:'t',html:'<p>h</p>'}).length>10};});
 ok('the workstation\'s mail carries an attachment as multipart/mixed around the text and page parts; a message without one is as before',raw.mixed&&raw.alt&&raw.att&&raw.type&&raw.plain,raw);
 ok('no page errors',!errs.length&&!errs2.length,errs.concat(errs2).slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
