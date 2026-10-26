/* v24.52 Form RS-1: the shared record is a PDF (the BCBA, 10/26, Gmail on the iPad: "Does the email send an attachment of the
   pdf summary or just the html link?" - the .html attachment opened as page code). Inside the workstation an emailed record
   carries a PDF (application/pdf, named .pdf) and the note says so; the PDF is well formed (objects where the cross-reference
   table says, letter pages, "Page n of N" at each foot); a month of many contacts breaks between contacts, never inside one;
   the year summary is one page with its chart as a picture; Save the record and Save the RBT's copy give PDFs without the
   concerns text; if a PDF cannot be made on the device the page goes as before. A stand-in host page answers the mail
   request. Simulated names and addresses only. usage: node qa/rspdf152-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');const fs=require('fs');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
const RS='/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html';
const HOST='<!doctype html><meta charset="utf-8"><title>host</title><iframe id="f" src="'+RS+'" style="width:1180px;height:800px"></iframe><script>window.mails=[];window.reply={};'
  +'addEventListener("message",e=>{const d=e.data||{};if(d.nbh!=="mail")return;mails.push(d);e.source.postMessage(Object.assign({nbh:"mail-result",req:d.req,sent:d.messages.length},reply),"*");});</script>';
/* the PDF read back: each object where the table says, and each page's content */
const readPdf=buf=>{const s=buf.toString('latin1'),o={ok:/^%PDF-1\.\d/.test(s)&&/%%EOF\n?$/.test(s)};
  const sx=+(/startxref\n(\d+)/.exec(s)||[])[1];o.xref=s.slice(sx,sx+4)==='xref';const ent=s.slice(sx).split('\n').slice(3).filter(l=>/^\d{10} \d{5} n/.test(l));
  o.offsets=ent.every((l,i)=>{const off=+l.slice(0,10);return !off||s.startsWith((i+1)+' 0 obj',off);});
  o.count=+(/\/Count (\d+)/.exec(s)||[])[1];o.letter=(s.match(/\/MediaBox \[0 0 612 792\]/g)||[]).length;
  o.pages=[...s.matchAll(/\/Type \/Page \/Parent[^\n]*\/Contents (\d+) 0 R/g)].map(m=>{const i=s.indexOf('\n'+m[1]+' 0 obj\n');const a=s.indexOf('stream\n',i)+7;return s.slice(a,s.indexOf('endstream',a));});
  o.images=(s.match(/\/Subtype \/Image/g)||[]).length;o.tz=[...s.matchAll(/ ([\d.]+) Tz /g)].map(m=>+m[1]);return o;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1220,height:880},acceptDownloads:true});
 await ctx.route('**/__rspdf-host.html',r=>r.fulfill({status:200,contentType:'text/html',body:HOST}));
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/__rspdf-host.html');await sleep(2000);const fr=p.frames().find(f=>/RS-1_/.test(f.url()));
 /* a simulated September: twelve contacts, each with its own feedback word, so a page break inside a contact shows */
 await fr.evaluate(()=>{const k=yearKeys(setupYear())[1];S.setup.rbt_name='Lee Park (simulated)';S.setup.rbt_email='lpark.sim@example.org';S.setup.cc1='dcole.sim@example.org';
   S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];
   const m=month(k);m.days=[];for(let d=1;d<=30;d++){const x=new Date(2026,8,d);if(x.getDay()%6===0)continue;m.days.push({id:'d'+d,date:k+'-'+String(d).padStart(2,'0'),start:'08:45',end:'15:30',brk:'',act:'',none:false});}
   m.contacts=[];for(let i=1;i<=12;i++)m.contacts.push({id:'c'+i,date:k+'-'+String(i+2).padStart(2,'0'),start:'10:00',end:'10:45',sup:'s1',format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0002',acts:['Observation'],sact:['Feedback'],bst:[],
     feedback:'Zeta'+i+' the team practiced the steps of the plan and reviewed the data together (simulated); accuracy rose across the week and the next step is to fade prompts (simulated).',follow:'Keep going (simulated).',ck:{},ckp:{}});
   m.conc=[{id:'q1',text:'This text is confidential and must not travel'}];curKey=k;renderAll();setView('print');renderPrint();});await sleep(400);
 /* email this month's record */
 await fr.evaluate(()=>document.querySelector('#shMonth').click());await fr.waitForFunction(()=>/^Sent to/.test(document.querySelector('#shNote').textContent),null,{timeout:20000}).catch(()=>{});
 const M=await p.evaluate(()=>window.mails.slice(-1)[0]);const note=await fr.evaluate(()=>document.querySelector('#shNote').textContent);
 const att=M&&M.messages[0].attachments[0];
 ok('Email this month\'s record: each reader\'s message carries a PDF (application/pdf, named .pdf), not a page',!!att&&att.type==='application/pdf'&&/\.pdf$/.test(att.name)&&M.messages.length===2&&M.messages.every(x=>x.attachments.length===1&&x.attachments[0].type==='application/pdf'),{n:M&&M.messages.length,type:att&&att.type,name:att&&att.name});
 ok('the email\'s note says the record is attached as a PDF, by its file name; the form says it was sent',!!M&&/attached as a PDF \(.+\.pdf\)/.test(M.messages[0].text)&&/attached as a PDF/.test(M.messages[0].html)&&/^Sent to lpark\.sim@example\.org, dcole\.sim@example\.org/.test(note),{note,text:M&&M.messages[0].text.slice(0,300)});
 const P=readPdf(Buffer.from(att?att.b64:'','base64'));
 ok('the PDF is well formed: header and end mark, each object where the cross-reference table says, letter pages',P.ok&&P.xref&&P.offsets&&P.count>=2&&P.letter===P.count&&P.pages.length===P.count,{ok:P.ok,xref:P.xref,offsets:P.offsets,count:P.count,letter:P.letter,pages:P.pages.length});
 ok('each page has the title and "Page n of N" at its foot',P.pages.every((s,i)=>s.includes('(Page '+(i+1)+' of '+P.count+')')&&/\(RBT supervision record, September 2026: Lee Park \(simulated\)\)/.test(s.replace(/\\\(/g,'(').replace(/\\\)/g,')'))),P.pages.map(s=>s.slice(-160)));
 const where=w=>P.pages.map((s,i)=>s.includes('('+w+')')?i:-1).filter(i=>i>=0);
 /* a contact is its row and its feedback; its feedback's last words (fade prompts) are on the page that has its first word */
 const whole=[];for(let i=1;i<=12;i++){const pz=where('Zeta'+i)[0];whole.push(pz!==undefined&&P.pages[pz].slice(P.pages[pz].indexOf('(Zeta'+i+')')).includes('(prompts)'));}
 ok('twelve contacts over the pages: no contact is split between pages (its feedback ends on the page it starts)',whole.every(Boolean)&&P.count>=3,{whole,count:P.count});
 ok('no concerns text in the PDF, and every word is fitted to its place (width scaling within 55-125%)',!P.pages.some(s=>s.includes('(travel)'))&&P.tz.length>100&&P.tz.every(z=>z>=55&&z<=125),{tz:[Math.min(...P.tz),Math.max(...P.tz)]});
 /* the year summary */
 await fr.evaluate(()=>document.querySelector('#shYear').click());await sleep(2500);const Y=await p.evaluate(()=>window.mails.slice(-1)[0]);const ya=Y&&Y.messages[0].attachments[0];const PY=readPdf(Buffer.from(ya?ya.b64:'','base64'));
 ok('Email the year summary: a one-page PDF with the chart as a picture',!!ya&&ya.type==='application/pdf'&&/year summary/i.test(ya.name)&&PY.ok&&PY.offsets&&PY.count===1&&PY.images>=1,{name:ya&&ya.name,count:PY.count,images:PY.images});
 /* save as a file, and the RBT's copy */
 const dl=async sel=>{const [d]=await Promise.all([p.waitForEvent('download',{timeout:10000}),fr.evaluate(s=>document.querySelector(s).click(),sel)]);return {name:d.suggestedFilename(),pdf:readPdf(fs.readFileSync(await d.path()))};};
 const F1=await dl('#shFile'),n1=await fr.evaluate(()=>document.querySelector('#shNote').textContent);
 ok('Save the record as a file gives the PDF, and says so',/\.pdf$/.test(F1.name)&&F1.pdf.ok&&F1.pdf.offsets&&/saved as a PDF/.test(n1)&&!F1.pdf.pages.some(s=>s.includes('(travel)')),{name:F1.name,n1});
 const F2=await dl('#shRbtCopy'),n2=await fr.evaluate(()=>document.querySelector('#shNote').textContent);
 ok('Save the RBT\'s copy gives a PDF named for the RBT\'s copy (plain characters: a curly apostrophe made the browser call it "download"), no concerns, and says so',/RBT's copy\)\.pdf$/.test(F2.name)&&F2.pdf.ok&&F2.pdf.pages[0].includes('copy\\)')&&!F2.pdf.pages.some(s=>s.includes('(travel)'))&&/saved as a PDF/.test(n2),{name:F2.name,n2});
 /* no PDF on this device: the page as before */
 await fr.evaluate(()=>{HTMLCanvasElement.prototype.getContext=function(){return null;};});
 await fr.evaluate(()=>document.querySelector('#shMonth').click());await sleep(1500);const H=await p.evaluate(()=>window.mails.slice(-1)[0]);const ha=H&&H.messages[0].attachments[0];
 const F3=await dl('#shFile');
 ok('if a PDF cannot be made here, the email carries the page and Save gives the page, as before',!!ha&&ha.type==='text/html'&&/\.html$/.test(ha.name)&&/\.html$/.test(F3.name),{email:ha&&ha.name,file:F3.name});
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
