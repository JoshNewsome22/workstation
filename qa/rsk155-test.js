/* v24.55 Form RS-1: months on Sign and print, and each month's signed record kept in the form as a PDF (the BCBA, 10/26:
   switch to another month's print page without going back; "store the saved months as pdfs in the form ... so the pdfs
   can be retrieved again"; "overwrite a pdf with a newer save if a change had to be made"). Sign and print shows the
   year's months, a tap shows that month's record to sign; Keep this month as a PDF keeps it with the RBT (a PDF in the
   form's file, read back as one); the list says when, pages, signed or not; after a change the list and the button say so
   and Replace (asked first) keeps the new one with the earlier copy's date; Open and Save to Files give the PDF; Remove
   (asked) removes it; a month not signed by both asks first; emailing the month's record keeps the PDF sent.
   Simulated names only. usage: node qa/rsk155-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const RS='/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html';
const HOST='<!doctype html><meta charset="utf-8"><title>host</title><iframe id="f" src="'+RS+'" style="width:1180px;height:800px"></iframe><script>window.mails=[];'
  +'addEventListener("message",e=>{const d=e.data||{};if(d.nbh!=="mail")return;mails.push(d);e.source.postMessage({nbh:"mail-result",req:d.req,sent:d.messages.length},"*");});</script>';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:1000},acceptDownloads:true});await ctx.route('**/__rsk-host.html',r=>r.fulfill({status:200,contentType:'text/html',body:HOST}));
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/__rsk-host.html');await sleep(2000);const fr=p.frames().find(f=>/RS-1_/.test(f.url()));
 /* a simulated RBT: August and September with days and contacts, August signed by both */
 await fr.evaluate(()=>{window.__asked=[];nbhUI.confirm=async(m)=>{window.__asked.push(String(m));return window.__answer!==false;};
   const [aug,sep]=yearKeys(setupYear());S.setup.rbt_name='Lee Park (simulated)';S.setup.rbt_email='lpark.sim@example.org';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   [aug,sep].forEach((k,j)=>{const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false},{id:'d2',date:k+'-05',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];
     m.contacts=[{id:'c1',date:k+'-04',start:'09:00',end:'10:00',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'',acts:[],sact:[],bst:[],feedback:'Simulated '+(j?'September':'August')+'.',follow:'',ck:{},ckp:{}}];});
   month(aug).sig={sup_name:'Dana Cole (simulated), BCBA',sup_date:'2026-10-26',rbt_name:'Lee Park (simulated), RBT',rbt_date:'2026-10-26'};
   curKey=aug;renderAll();setView('print');renderPrint();});await sleep(500);
 const bar=await fr.evaluate(()=>{const bs=[...document.querySelectorAll('#printMonthBar button')];return {n:bs.length,vis:!!(document.getElementById('printMonthBar')||{}).offsetParent,cur:(bs.find(b=>b.getAttribute('aria-pressed')==='true')||{}).dataset,first:bs[0]&&bs[0].textContent};});
 ok('Sign and print shows the year\'s twelve months across its top, the month being signed marked',bar.n===12&&bar.vis&&bar.cur&&bar.cur.pmonth===await fr.evaluate(()=>yearKeys(setupYear())[0]),bar);
 await fr.click('#printMonthBar button:nth-child(2)');await sleep(300);
 const sw=await fr.evaluate(()=>({key:curKey,title:document.getElementById('signTitle').textContent,out:/Simulated September/.test(document.getElementById('monthOut').textContent),subj:window.__rsShare.subject('month'),view:document.body.className}));
 ok('a tap on September shows September\'s record to sign and print, on the same page (title, record, the email\'s subject)',/Sign the Record for September 2026/.test(sw.title)&&sw.out&&/September 2026/.test(sw.subj)&&sw.key.endsWith('-09'),sw);
 await fr.click('#printMonthBar button:nth-child(1)');await sleep(300);
 /* keep August */
 const none=await fr.evaluate(()=>({btn:document.getElementById('kpKeep').textContent,list:document.getElementById('kpList').textContent}));
 ok('nothing kept yet: the button offers to keep August, the list says none',/Keep August 2026 as a PDF/.test(none.btn)&&/No month is kept/.test(none.list),none);
 await fr.click('#kpKeep');await fr.waitForFunction(()=>/Kept: August 2026/.test(document.getElementById('kpNote').textContent),null,{timeout:15000}).catch(()=>{});
 const K1=await fr.evaluate(()=>{const kp=month(curKey).kept||{};const row=document.querySelector('#kpList tbody tr');return {b64:(kp.b64||'').slice(0,8),pages:kp.pages,signed:kp.signed,at:kp.at,asked:window.__asked.length,row:row&&row.textContent,mark:!!document.querySelector('#printMonthBar button[aria-pressed="true"] .rs-kpmark'),btn:document.getElementById('kpKeep').textContent};});
 ok('Keep this month as a PDF keeps August\'s record as a PDF with the RBT (signed by both: nothing asked); the list shows it, with a PDF mark on the month',K1.b64==='JVBERi0x'&&K1.pages>=2&&K1.signed&&K1.asked===0&&/August 2026/.test(K1.row)&&/signed by both/.test(K1.row)&&/unchanged/.test(K1.row)&&K1.mark&&/Kept .*keep it again/.test(K1.btn),K1);
 /* in the file, and read back as a PDF */
 const F=await fr.evaluate(()=>{const o=fromFile(JSON.parse(JSON.stringify(saveObj())));const k=curKey;const bad=fromFile({form:'RS-1',S:Object.assign(JSON.parse(JSON.stringify(S)),{months:{[k]:Object.assign({},S.months[k],{kept:{at:'x',b64:'PGh0bWw+',pages:1}})}})});
   return {back:o.months[k].kept&&o.months[k].kept.b64===S.months[k].kept.b64&&o.months[k].kept.at===S.months[k].kept.at,bad:!!bad.months[k].kept};});
 ok('the kept PDF is in the form\'s file and comes back from it; something that is not a PDF is not taken',F.back&&!F.bad,F);
 /* a change after keeping: said, then Replace */
 await fr.evaluate(()=>{month(curKey).days.push({id:'d3',date:curKey+'-06',start:'08:00',end:'12:00',brk:'',act:'',none:false});renderPrint();});
 const C=await fr.evaluate(()=>({btn:document.getElementById('kpKeep').textContent,row:document.querySelector('#kpList tbody tr').textContent}));
 ok('after a change to August, the list says the record changed and the button offers to replace the PDF',/Replace the kept PDF: August 2026 has changed/.test(C.btn)&&/changed/.test(C.row)&&!/unchanged/.test(C.row),C);
 await fr.evaluate(()=>{window.__answer=false;});await fr.click('#kpKeep');await sleep(500);
 const N=await fr.evaluate(at=>({same:month(curKey).kept.at===at,asked:window.__asked.slice(-1)[0]}),K1.at);
 ok('Replace asks first; said no, the kept PDF stays as it was',N.same&&/Replace the PDF of August 2026 kept .* with the record as it is now/.test(N.asked),N);
 await fr.evaluate(()=>{window.__answer=true;});await sleep(1100);await fr.click('#kpKeep');await fr.waitForFunction(()=>/Replaced: August 2026/.test(document.getElementById('kpNote').textContent),null,{timeout:15000}).catch(()=>{});
 const R=await fr.evaluate(at=>{const kp=month(curKey).kept;return {newer:kp.at!==at,prev:kp.prev,row:document.querySelector('#kpList tbody tr').textContent,note:document.getElementById('kpNote').textContent};},K1.at);
 ok('said yes, the new PDF replaces it; the list keeps the date of the copy it replaced, and the record is unchanged since',R.newer&&R.prev.length===1&&R.prev[0]===K1.at&&/replaced the copy of/.test(R.row)&&/unchanged/.test(R.row),R);
 /* open and save */
 const [pop]=await Promise.all([ctx.waitForEvent('page',{timeout:8000}).catch(()=>null),fr.click('#kpList [data-kpopen]')]);
 ok('Open shows the kept PDF',!!pop&&/^blob:/.test(pop.url()),pop&&pop.url());if(pop)await pop.close();
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}),fr.click('#kpList [data-kpsave]')]);const head=fs.readFileSync(await dl.path()).slice(0,5).toString('latin1');
 ok('Save to Files gives the PDF, named for the month and the RBT',head==='%PDF-'&&/^RBT supervision record, August 2026 Lee Park \(simulated\)\.pdf$/.test(dl.suggestedFilename()),{head,name:dl.suggestedFilename()});
 /* September, not signed: asked first */
 await fr.click('#printMonthBar button:nth-child(2)');await sleep(300);await fr.evaluate(()=>{window.__answer=false;});await fr.click('#kpKeep');await sleep(500);
 const U=await fr.evaluate(()=>({kept:!!month(curKey).kept,asked:window.__asked.slice(-1)[0]}));
 ok('a month not signed by both asks before keeping its PDF (said no: nothing kept)',!U.kept&&/September 2026 is not signed by both/.test(U.asked),U);
 /* emailing the month's record keeps the PDF sent */
 await fr.evaluate(()=>{window.__answer=true;const k=curKey;month(k).sig={sup_name:'Dana Cole (simulated), BCBA',sup_date:'2026-10-26',rbt_name:'Lee Park (simulated), RBT',rbt_date:'2026-10-26'};renderPrint();});
 await fr.click('#shMonth');await fr.waitForFunction(()=>/^Sent to/.test(document.getElementById('shNote').textContent),null,{timeout:20000}).catch(()=>{});
 const E=await fr.evaluate(()=>({kept:!!month(curKey).kept&&month(curKey).kept.b64,note:document.getElementById('shNote').textContent}));const sent=await p.evaluate(()=>window.mails.slice(-1)[0].messages[0].attachments[0].b64);
 ok('emailing September\'s record keeps the PDF that was sent, and says so',E.kept===sent&&/The PDF sent is kept in the form/.test(E.note),{note:E.note,same:E.kept===sent});
 /* remove */
 await fr.click('#printMonthBar button:nth-child(1)');await sleep(300);await fr.click('#kpList tr.cur [data-kpdel]');await sleep(400);
 const D=await fr.evaluate(()=>({kept:!!month(curKey).kept,days:month(curKey).days.length,asked:window.__asked.slice(-1)[0],rows:document.querySelectorAll('#kpList tbody tr').length}));
 ok('Remove asks, then removes August\'s PDF; the record stays; September\'s PDF is still listed',!D.kept&&D.days===3&&/Remove the PDF kept for August 2026/.test(D.asked)&&D.rows===1,D);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
