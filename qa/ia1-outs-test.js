/* v21.64 Form IA-1: several targets in one file (the toolbar's list, + Target, Remove, each with worksheets of its own, the
   informants shared; the file carries every target and reopens; a file saved before this opens as one target; the case adds a
   record per target, a removed one not added back until asked); the Send-outs board (the plan: targets x instruments x
   informants with an informant left out for a target; the page, the link, the email and the reminder from a row, Sent and Not
   sent by hand, the dates, the due list for the workstation, the calendar file, a row taken off); Collect responses placing a
   code on the target it names and in the column of the informant whose name it carries, marking the board; a response about a
   target the file does not hold held, then added as a target; the workstation: TB-1's targets become IA-1's records and the
   board's dates reach the case bar; no errors. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/ia1-outs';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const QABF=Array.from({length:25},(_,i)=>(i+1)+'. Simulated QABF item '+(i+1)+' about the problem behavior.').join('\n');
(async()=>{const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1300,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(900);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};});
  const set=(name,v)=>page.evaluate(([n,v])=>{const el=document.querySelector(`[name="${n}"]`);if(!el)return null;el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return el.value;},[name,v]);
  const val=name=>page.evaluate(n=>{const el=document.querySelector(`[name="${n}"]`);return el?el.value:null;},name);
  const view=async v=>{await page.evaluate(v=>document.querySelector(`#viewSeg button[data-view="${v}"]`).click(),v);await sleep(200);};
  const opts=()=>page.evaluate(()=>[...document.querySelector('#tgtSel').options].map(o=>o.textContent));
  const switchTo=async i=>{await page.evaluate(i=>{const s=document.querySelector('#tgtSel');s.value=s.options[i].value;s.dispatchEvent(new Event('change'));},i);await sleep(300);};
  const saveFile=async()=>{await page.evaluate(()=>{window.__saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};document.querySelector('#saveBtn').click();});await sleep(500);return JSON.parse(await page.evaluate(()=>window.__saved));};
  const openFile=async t=>{await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'ia1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},t);await sleep(600);};
  await view('setup');
  await set('m.client','Georgi Sample');await set('m.sid','12345');await set('m.email','bcba@example.org');await set('m.assessor','J. Newsome');await set('rp.w.qabf',QABF);
  /* ---- A. targets ---- */
  const a1=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),del:document.querySelector('#tgtDel').disabled,note:document.querySelector('#tgtNote').textContent}));
  check('A1 a fresh form holds one untitled target: the toolbar’s list says so, Remove is off, the Setup note explains',a1.opts.join()==='1. (untitled target)'&&a1.del&&/holds one target behavior/.test(a1.note),JSON.stringify(a1));
  await set('m.beh','Hitting');await set('m.def','Forceful contact of a hand with a peer.');await view('fast');await set('fast[0][1]','Y');await set('fast[0][2]','N');
  await page.evaluate(()=>document.querySelector('#tgtAdd').click());await sleep(400);
  const a2=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),cur:document.querySelector('#tgtSel').selectedIndex,beh:document.querySelector('[name="m.beh"]').value,f1:document.querySelector('[name="fast[0][1]"]').value,view:document.body.className,del:document.querySelector('#tgtDel').disabled}));
  check('A2 + Target adds a second, untitled target with empty worksheets and opens Setup on it; Remove is on',a2.opts.join('|')==='1. Hitting|2. (untitled target)'&&a2.cur===1&&a2.beh===''&&a2.f1===''&&a2.view==='view-setup'&&!a2.del,JSON.stringify(a2));
  await set('m.beh','Screaming');await set('inf[0].name','Ms. Rivera');await set('inf[0].email','rivera@example.org');await set('inf[1].name','Mr. Okafor');await set('inf[1].email','okafor@example.org');await view('fast');await set('fast[0][1]','N');
  await switchTo(0);
  const a3={beh:await val('m.beh'),f1:await val('fast[0][1]'),f2:await val('fast[0][2]'),n0:await val('inf[0].name'),e1:await val('inf[1].email'),opt:(await opts()).join('|')};
  await switchTo(1);const a3b={beh:await val('m.beh'),f1:await val('fast[0][1]'),n1:await val('inf[1].name')};
  check('A3 switching keeps each target’s worksheets apart and the informants shared (names and emails on both)',a3.beh==='Hitting'&&a3.f1==='Y'&&a3.f2==='N'&&a3.n0==='Ms. Rivera'&&a3.e1==='okafor@example.org'&&a3.opt==='1. Hitting|2. Screaming'&&a3b.beh==='Screaming'&&a3b.f1==='N'&&a3b.n1==='Mr. Okafor',JSON.stringify(a3)+' '+JSON.stringify(a3b));
  const file=await saveFile();
  check('A4 the saved file carries both targets (their fields) and the current one, with the current target’s fields as before',file.targets&&file.targets.length===2&&file.targets[0].label==='Hitting'&&file.targets[0].fields['fast[0][1]']==='Y'&&file.targets[1].fields['fast[0][1]']==='N'&&file.cur===file.targets[1].id&&file.fields['m.beh']==='Screaming'&&file.fields['inf[0].email']==='rivera@example.org',JSON.stringify(Object.keys(file)));
  await openFile(JSON.stringify({form:'IA-1',counts:{inf:2,int:1},fields:{'m.beh':'Biting','m.def':'Teeth on skin.','fast[0][1]':'Y','inf[0].name':'Old file'}}));
  const a5=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),f1:document.querySelector('[name="fast[0][1]"]').value,n:document.querySelector('#nInf').value}));
  check('A5 a file saved before this opens as one target',a5.opts.join()==='1. Biting'&&a5.f1==='Y'&&a5.n==='2',JSON.stringify(a5));
  await openFile(JSON.stringify(file));
  const a4b=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),cur:document.querySelector('#tgtSel').selectedIndex,beh:document.querySelector('[name="m.beh"]').value,f1:document.querySelector('[name="fast[0][1]"]').value,e0:document.querySelector('[name="inf[0].email"]').value}));
  check('A4b reopened: both targets, the one that was current shown, its worksheet and the shared informants back',a4b.opts.join('|')==='1. Hitting|2. Screaming'&&a4b.cur===1&&a4b.beh==='Screaming'&&a4b.f1==='N'&&a4b.e0==='rivera@example.org',JSON.stringify(a4b));
  /* the case (Form TB-1 through the workstation) */
  await page.evaluate(()=>{nbhCase.apply({behaviors:[{label:'Hitting',def:'Def from TB-1',src:'TB-1'},{label:'Screaming',def:'Loud vocal above conversation.',src:'TB-1'},{label:'Biting',def:'Teeth on skin.',src:'TB-1'},{label:'Asks for a break',isRep:true,src:'TB-1'}]});});await sleep(300);
  const a6=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),cur:document.querySelector('#tgtSel').selectedIndex,def:document.querySelector('[name="m.def"]').value}));
  check('A6 the case adds a record per target it holds (the replacement left out), fills an empty definition, keeps the targets already here',a6.opts.join('|')==='1. Hitting|2. Screaming|3. Biting'&&a6.cur===1&&a6.def==='Loud vocal above conversation.',JSON.stringify(a6));
  await switchTo(2);await page.evaluate(()=>document.querySelector('#tgtDel').click());await sleep(400);
  await page.evaluate(()=>{nbhCase.apply({behaviors:[{label:'Hitting',src:'TB-1'},{label:'Screaming',src:'TB-1'},{label:'Biting',src:'TB-1'}]});});await sleep(300);
  const a7=await opts();
  await page.evaluate(()=>document.querySelector('#tgtFromCase').click());await sleep(300);const a8=await opts();
  check('A7 a target removed by hand is not added back by the case; Take the targets from the case adds it again',a7.join('|')==='1. Hitting|2. Screaming'&&a8.join('|')==='1. Hitting|2. Screaming|3. Biting',a7.join('|')+' / '+a8.join('|'));
  await switchTo(2);await page.evaluate(()=>document.querySelector('#tgtDel').click());await sleep(400);await switchTo(0);
  /* ---- B. the board ---- */
  await view('outs');
  const td=await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
  const due=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
  const b0=await page.evaluate(()=>({t:document.querySelectorAll('#outPlan [data-ot]').length,i:document.querySelectorAll('#outPlan [data-oi]').length,chips:document.querySelectorAll('#outPlan [data-od][data-code]').length,noword:document.querySelectorAll('#outPlan .tag.na').length}));
  check('B0 the plan panel lists the two targets, the five instruments (MAS, PBQ and WEFA marked as having no wording yet) and three informant chips per target',b0.t===2&&b0.i===5&&b0.chips===6&&b0.noword===3,JSON.stringify(b0));
  await page.evaluate(({td,due})=>{document.querySelector('#outPlanOn').value=td;document.querySelector('#outDueBy').value=due;document.querySelector('#outPlan [data-oi="mas"]').checked=false;
    const chip=document.querySelector('#outPlan [data-od][data-code="C"]');chip.checked=false;chip.dispatchEvent(new Event('change',{bubbles:true}));},{td,due});await sleep(200);
  await page.evaluate(()=>document.querySelector('#outPlanBtn').click());await sleep(300);
  const b1=await page.evaluate(()=>({rows:document.querySelectorAll('#outBody tr[data-id]').length,sum:document.querySelector('#outSum').textContent,note:document.querySelector('#outNote').textContent,drop:JSON.stringify(__rp.drop()),chipC:document.querySelector('#outPlan [data-od][data-code="C"]').checked,plan:__rp.outs()[0].plan,due:__rp.outs()[0].due}));
  check('B1 Plan the send-outs makes a row per target, instrument and informant, less the informant left out for the first target: 10 rows with the dates',b1.rows===10&&/10 send-outs: 10 planned/.test(b1.sum)&&/10 send-outs planned/.test(b1.note)&&/"C"/.test(b1.drop)&&!b1.chipC&&b1.plan===td&&b1.due===due,JSON.stringify(b1));
  await page.evaluate(()=>document.querySelector('#outPlanBtn').click());await sleep(200);
  check('B2 pressed again, nothing doubles',await page.evaluate(()=>document.querySelectorAll('#outBody tr[data-id]').length===10&&/on the board already/.test(document.querySelector('#outNote').textContent)));
  const rowOf=(label,inst,code)=>page.evaluate(([l,i,c])=>{const o=__rp.outs().find(o=>o.inst===i&&o.inf===c&&(__rp.targets().list.find(r=>r.id===o.tgt)||{}).label===l);return o?o.id:null;},[label,inst,code]);
  const act=async(id,a)=>{await page.evaluate(([id,a])=>document.querySelector('#outBody tr[data-id="'+id+'"] button[data-act="'+a+'"]').click(),[id,a]);await sleep(400);};
  const hfA=await rowOf('Hitting','fast','A');
  await page.evaluate(()=>{window.__dl=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{window.__dl.push(b);return o(b);};HTMLAnchorElement.prototype.click=function(){if(this.download)window.__dlName=this.download;};});
  await act(hfA,'page');
  const b3=await page.evaluate(id=>({name:window.__dlName,made:__rp.outs().filter(o=>o.made).length,st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent,note:document.querySelector('#outNote').textContent.slice(0,40)}),hfA);
  check('B3 Page saves that target and instrument’s respondent page and marks every row of that pair "Page made"',/^IA-1_FAST_Hitting_respondent_G\.S\._ID_12345_\.html$/.test(b3.name||'')&&b3.made===2&&b3.st==='Page made'&&/Page saved/.test(b3.note),JSON.stringify(b3));
  const hqB=await rowOf('Hitting','qabf','B');await act(hqB,'link');
  const b4=await page.evaluate(id=>({box:!document.querySelector('#outLinkBox').hidden,url:document.querySelector('#outLinkBox').value.slice(0,60),ok:/respond\.html#[pz]=/.test(document.querySelector('#outLinkBox').value),st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent}),hqB);
  check('B4 Link puts the row’s link in the box (and on the clipboard) and marks the pair made',b4.box&&b4.ok&&b4.st==='Page made',JSON.stringify(b4));
  await page.evaluate(()=>{window.__inv=[];NBH_RESPOND.invite=o=>{window.__inv.push(o);};});
  await act(hfA,'email');
  const b5=await page.evaluate(id=>{const o=__rp.outs().find(x=>x.id===id);return {n:window.__inv.length,to:window.__inv[0]&&window.__inv[0].to,links:window.__inv[0]&&window.__inv[0].links.length,label:window.__inv[0]&&window.__inv[0].links[0].label,sent:o.sent,how:o.how,st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent,sentCell:document.querySelector('#outBody tr[data-id="'+id+'"] td:nth-child(7)').textContent};},hfA);
  check('B5 Email opens the invitation to that informant’s address with the row’s link and marks the row sent today by email',b5.n===1&&b5.to==='rivera@example.org'&&b5.links===1&&b5.label==='Hitting'&&b5.sent===td&&b5.how==='email'&&b5.st==='Sent'&&/\(email\)/.test(b5.sentCell),JSON.stringify(b5));
  await act(hfA,'remind');
  const b6=await page.evaluate(id=>{const o=__rp.outs().find(x=>x.id===id);return {n:window.__inv.length,title:window.__inv[1]&&window.__inv[1].title,rem:o.rem,st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent,badge:document.querySelector('#outBody tr[data-id="'+id+'"] td:nth-child(6)').textContent};},hfA);
  check('B6 Remind opens the invitation again as a reminder and notes the date; the row stays sent',b6.n===2&&/^Reminder: FAST/.test(b6.title||'')&&b6.rem===td&&b6.st==='Sent'&&/reminded/.test(b6.badge),JSON.stringify(b6));
  const sfB=await rowOf('Screaming','fast','B');await act(sfB,'sent');
  const b7=await page.evaluate(id=>{const o=__rp.outs().find(x=>x.id===id);return {sent:o.sent,how:o.how,st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent};},sfB);
  await act(sfB,'unsent');const b8=await page.evaluate(id=>{const o=__rp.outs().find(x=>x.id===id);return {sent:o.sent,st:document.querySelector('#outBody tr[data-id="'+id+'"] .tag').textContent};},sfB);
  check('B7 Sent by hand marks the row; Not sent takes it back',b7.sent===td&&b7.how==='by hand'&&b7.st==='Sent'&&b8.sent===''&&b8.st==='Planned',JSON.stringify(b7)+' '+JSON.stringify(b8));
  const b9=await page.evaluate(()=>{const d=__rp.due();return {n:d.length,send:d.filter(x=>/^Send the/.test(x.what)).length,back:d.filter(x=>/back from/.test(x.what)).length,one:d.find(x=>/back from/.test(x.what))};});
  check('B9 the due list for the workstation names the rows not yet sent (send on) and the one sent but not back (please send by)',b9.n===10&&b9.send===9&&b9.back===1&&/^FAST back from A · Ms\. Rivera \(Hitting\)$/.test(b9.one.what)&&b9.one.date===due,JSON.stringify(b9));
  const b10=await page.evaluate(()=>{const c=__rp.ics();return {n:c.n,ev:(c.text.match(/BEGIN:VEVENT/g)||[]).length,summ:/SUMMARY:Send FAST to B · Mr\. Okafor \(Hitting\)/.test(c.text),back:/SUMMARY:FAST back from A · Ms\. Rivera \(Hitting\)/.test(c.text),cal:/^BEGIN:VCALENDAR\r\n/.test(c.text)&&/END:VCALENDAR\r\n$/.test(c.text),dates:(c.text.match(/DTSTART;VALUE=DATE:(\d{8})/g)||[]).map(x=>x.slice(-8))};});
  check('B10 the calendar file holds an all-day event per send-on date not sent and per please-send-by date not back',b10.n===10&&b10.ev===10&&b10.summ&&b10.back&&b10.cal&&b10.dates.indexOf(td.replace(/-/g,''))>=0&&b10.dates.indexOf(due.replace(/-/g,''))>=0,JSON.stringify(b10));
  await page.evaluate(id=>{const i=document.querySelector('#outBody tr[data-id="'+id+'"] input[data-od="due"]');i.value='2026-12-24';i.dispatchEvent(new Event('change',{bubbles:true}));},sfB);await sleep(200);
  check('B11 a date typed on a row sticks',await page.evaluate(id=>__rp.outs().find(x=>x.id===id).due==='2026-12-24',sfB));
  const sqC=await rowOf('Screaming','qabf','C');await act(sqC,'del');
  check('B12 the x takes a row off the board',await page.evaluate(()=>__rp.outs().length===9&&document.querySelectorAll('#outBody tr[data-id]').length===9));
  await page.screenshot({path:OUT+'/board.png',fullPage:true});
  /* ---- C. Collect responses: by target and by informant name ---- */
  const codes=await page.evaluate(()=>{const sig=(document.querySelector('[name="rp.w.fast"]').value?'':'');const s=(window.__rp.quiet('fast',{label:'Hitting',def:'x'})||{}).sig;
    const mk=(beh,name,role,first)=>NBH_RESPOND.encode({v:1,form:'IA-1',inst:'fast',student:'G.S.',beh,name,role,ans:Array.from({length:16},(_,i)=>i===0?first:(i%2?'N':'Y')),n:16,date:'10/8/2026',confirmed:'yes',sig:s,open:{ml:'Math'}});
    return {scream:mk('Screaming','Mr. Okafor','Para','Y'),hit:mk('Hitting','Ms. Rivera','Teacher','N'),zzz:mk('Zzz target','Someone','Aide','Y')};});
  await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
  await page.evaluate(c=>{rcText.value='Mail 1\n'+c.scream+'\n\nMail 2\n'+c.hit+'\n\nMail 3\n'+c.zzz;__rp.read([rcText.value]);},codes);await sleep(200);
  const c1=await page.evaluate(()=>({rows:[...document.querySelectorAll('#rcOut tbody tr')].map(tr=>[...tr.children].slice(1,4).map(td=>td.textContent).join('|')+'|'+tr.querySelector('.gf-slot').textContent),txt:document.querySelector('#rcOut').textContent,held:document.querySelectorAll('.rp-other').length,add:!!document.querySelector('#rcOut [data-addt]')}));
  check('C1 the responses about the file’s targets are listed with the target and the informant they match by name; the one about a target not held is held, with Add it as a target here',c1.rows.length===2&&c1.rows[0]==='Screaming|FAST|Mr. Okafor|Informant B'&&c1.rows[1]==='Hitting|FAST|Ms. Rivera|Informant A'&&/FAST about Screaming: 1 response found/.test(c1.txt)&&/FAST about Hitting: 1 response found/.test(c1.txt)&&c1.held===1&&/1 response about Zzz target/.test(c1.txt)&&c1.add,JSON.stringify(c1));
  await page.evaluate(()=>document.querySelector('#rcGo').click());await sleep(900);
  const c2=await page.evaluate(()=>({view:document.body.className,cur:document.querySelector('#tgtSel').selectedIndex,beh:document.querySelector('[name="m.beh"]').value,b1:document.querySelector('[name="fast[1][1]"]').value,b2:document.querySelector('[name="fast[1][2]"]').value,a1:document.querySelector('[name="fast[0][1]"]').value,nameB:document.querySelector('[name="inf[1].name"]').value,banner:document.querySelector('#gfBanner').textContent,ml:document.querySelector('[name="fast.ml_s"]').value}));
  await switchTo(0);const c2b={beh:await val('m.beh'),a1:await val('fast[0][1]'),a2:await val('fast[0][2]'),b1:await val('fast[1][1]'),ml:await val('fast.ml_s')};
  check('C2 imported: Mr. Okafor’s answers go to Screaming’s column B and Ms. Rivera’s to Hitting’s column A, each target’s own Section 1 filled, the informant names kept',c2.view==='view-fast'&&c2.beh==='Screaming'&&c2.b1==='Y'&&c2.b2==='N'&&c2.a1==='N'&&c2.nameB==='Mr. Okafor'&&/B: Math/.test(c2.ml)&&/Collected 1 FAST response about Screaming; 1 FAST response about Hitting/.test(c2.banner)&&c2b.beh==='Hitting'&&c2b.a1==='N'&&c2b.a2==='N'&&c2b.b1===''&&/A: Math/.test(c2b.ml),JSON.stringify(c2)+' '+JSON.stringify(c2b));
  const c3=await page.evaluate(()=>{const L=__rp.targets().list,lab=o=>(L.find(r=>r.id===o.tgt)||{}).label;const rows=__rp.outs().filter(o=>o.recv).map(o=>lab(o)+'/'+o.inst+'/'+o.inf+'/'+o.from+'/'+o.recv+'/'+(o.placed?'placed':'')+'/'+o.sent);return rows.sort();});
  check('C3 the board marks those two rows received, placed, from whom and when (the one never marked sent counts as sent too)',c3.length===2&&c3[0]==='Hitting/fast/A/Ms. Rivera/2026-10-08/placed/'+td&&c3[1]==='Screaming/fast/B/Mr. Okafor/2026-10-08/placed/2026-10-08',JSON.stringify(c3));
  await page.evaluate(()=>document.querySelector('#rcBtn').click());await sleep(150);
  await page.evaluate(c=>{rcText.value=c.zzz;__rp.read([rcText.value]);},codes);await sleep(200);
  await page.evaluate(()=>document.querySelector('#rcOut [data-addt]').click());await sleep(300);
  const c4=await page.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),rows:document.querySelectorAll('#rcOut tbody tr').length,held:document.querySelectorAll('.rp-other').length}));
  check('C4 Add it as a target here adds the target and lists the response to place',c4.opts.join('|')==='1. Hitting|2. Screaming|3. Zzz target'&&c4.rows===1&&c4.held===0,JSON.stringify(c4));
  await page.evaluate(()=>document.querySelector('#rcDlg').close());
  const file2=await saveFile();
  check('C5 the saved file carries the board and the drops; reopened, the board is back',file2.outs.length===9&&file2.drop&&Object.keys(file2.drop).length===1&&await (async()=>{await openFile(JSON.stringify(file2));return page.evaluate(()=>{document.querySelector('#viewSeg button[data-view="outs"]').click();return __rp.outs().length===9&&document.querySelectorAll('#outBody tr[data-id]').length===9&&__rp.outs().filter(o=>o.recv).length===2;});})(),JSON.stringify(Object.keys(file2)));
  check('Z0 no errors on the form',!log.length,JSON.stringify(log).slice(0,500));
  /* ---- D. in the workstation: TB-1's targets become records; the board's dates reach the case bar ---- */
  const log2=[];const sh=await ctx.newPage();wire(sh,log2);await sh.goto(BASE+'/NBH-Workstation/index.html');await sleep(900);
  const open=async id=>{await sh.evaluate(id=>openForm(id),id);const fr=await sh.waitForSelector(`iframe[title*="Form ${id})"]`,{timeout:8000});await sleep(1200);return (await fr.contentFrame());};
  const tb=await open('TB-1');await tb.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};document.querySelector('#simBtn').click();});await sleep(600);
  const ia=await open('IA-1');await sleep(6500);
  const d1=await ia.evaluate(()=>({opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent),def:__rp.targets().list[0].def.slice(0,20)}));
  check('D1 in the workstation, TB-1’s targets become IA-1’s records, with their definitions',d1.opts.length>=4&&/Aggression/.test(d1.opts[0])&&d1.def.length>5,JSON.stringify(d1));
  await ia.evaluate(({td,due})=>{document.querySelector('[name="m.email"]').value='bcba@example.org';document.querySelector('#viewSeg button[data-view="outs"]').click();document.querySelector('#outPlanOn').value=td;document.querySelector('#outDueBy').value=due;document.querySelectorAll('#outPlan [data-oi]').forEach(c=>{c.checked=c.dataset.oi==='fast';});document.querySelectorAll('#outPlan [data-ot]').forEach((c,i)=>{c.checked=i===0;});document.querySelector('#outPlanBtn').click();},{td,due});
  await sleep(9000);
  const d2=await sh.evaluate(()=>({due:(state.due||[]).filter(x=>/Send the FAST/.test(x.what||'')).length,bar:(document.querySelector('#factsTxt')||{}).textContent||'',row:document.querySelector('#factsRow')&&!document.querySelector('#factsRow').hidden}));
  check('D2 the planned send-outs reach the workstation’s due list',d2.due>=1&&d2.row,JSON.stringify(d2).slice(0,300));
  check('Z1 no errors in the workstation',!log2.length,JSON.stringify(log2).slice(0,400));
  await br.close();console.log('RESULT: '+(fails?fails+' FAILED':'ALL PASS'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
