/* v21.65 the reply box: box.php's API (ping, new, put, list, del, drop, the refusals, CORS); Form IA-1 registering a box, its
   links and pages carrying the box, a respondent page locking the answers on the device and sending them to the box (no
   email), the form collecting them (placed on the target and the informant columns, the board marked Received and Placed), a
   reply about a target the file does not hold held then added and placed, nothing twice, the keys and the taken replies in the
   file and back, the replies removed from the site, an unreadable reply counted, a box out of reach (the links without it, the
   page falling back to the email), the invitation's wording, the QR code; no errors.
   Needs php on the PATH (php -S) and the workstation served at BASE (qa/lib.js). */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/reply-box';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
const PORT=8126,BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const FAST=['1. In what situations do you usually interact with the student?','2. How often does the problem behavior occur?','3. How severe are the problem behaviors when they occur?','4. Does he or she seem to enjoy the behavior when no one is around?'].concat(Array.from({length:12},(_,i)=>(i+5)+'. Simulated FAST item '+(i+5)+' about the student and his or her problem behavior'));
const hex=n=>Array.from({length:n},(_,i)=>'0123456789abcdef'[(i*7+3)%16]).join('');
const sha=t=>require('crypto').createHash('sha256').update(t).digest('hex');
const J=async(u,opt)=>{const r=await fetch(u,opt);let j=null;try{j=await r.json();}catch(e){}return {s:r.status,j,h:r.headers};};
const post=(u,o)=>J(u,{method:'POST',headers:{'Content-Type':'text/plain'},body:typeof o==='string'?o:JSON.stringify(o)});
(async()=>{
  /* ---- the program, on a port of its own with an empty data folder ---- */
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let phpErr='';php.stderr.on('data',d=>{phpErr+=d;});php.on('error',e=>{phpErr+=String(e);});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await J(BOXURL+'?a=ping');up=r.j&&r.j.ok;}catch(e){}}
  check('A1 box.php answers ping (php -S on '+PORT+')',up,up?'':phpErr.slice(0,200));
  if(!up){console.log('FAILED (the program did not start)');php.kill();process.exit(1);}
  /* ---- A. the API ---- */
  const B1=hex(32),T1='00112233445566778899aabbccddeeff',T2='ffeeddccbbaa99887766554433221100';
  let r=await post(BOXURL+'?a=new',{b:B1,t:sha(T1)});check('A2 a box is made',r.s===200&&r.j.ok&&r.j.had===false,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=new',{b:B1,t:sha(T1)});check('A3 made again with the same token: had',r.s===200&&r.j.had===true,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=new',{b:B1,t:sha(T2)});check('A4 another token for the same id is refused (409)',r.s===409,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=new',{b:'short',t:sha(T1)});check('A5 a bad id is refused (400)',r.s===400,JSON.stringify(r.j));
  const reply={v:1,k:{x:'A'.repeat(43),y:'B'.repeat(43)},iv:'A'.repeat(16),ct:'C'.repeat(64)};
  r=await post(BOXURL+'?a=put&b='+B1,reply);check('A6 a reply is kept',r.s===200&&/^r-\d+-[a-f0-9]{12}$/.test(r.j.id||''),JSON.stringify(r.j));const id1=r.j.id;
  r=await post(BOXURL+'?a=put&b='+B1,{v:1,k:{x:'A'},iv:'',ct:''});check('A7 a body that is not a reply is refused (400)',r.s===400&&/not a reply/.test(r.j.error),JSON.stringify(r.j));
  r=await post(BOXURL+'?a=put&b='+hex(32).replace(/^./,'f'),reply);check('A8 a reply for a box that does not exist is refused (404)',r.s===404,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=put&b='+B1,JSON.stringify(Object.assign({},reply,{ct:'C'.repeat(70000)})));check('A9 a reply over 64 KB is refused (413)',r.s===413,JSON.stringify(r.j));
  r=await J(BOXURL+'?a=list&b='+B1+'&t='+T2);check('A10 the list needs the right token (403)',r.s===403,JSON.stringify(r.j));
  r=await J(BOXURL+'?a=list&b='+B1+'&t='+T1);check('A11 the list gives the reply (id, time, key, iv, ct) with CORS for any page',r.s===200&&r.j.count===1&&r.j.replies[0].id===id1&&r.j.replies[0].k.x===reply.k.x&&r.j.replies[0].ct===reply.ct&&/\d{4}-\d{2}-\d{2}T/.test(r.j.replies[0].at)&&r.h.get('access-control-allow-origin')==='*',JSON.stringify(r.j).slice(0,200));
  r=await fetch(BOXURL+'?a=put&b='+B1,{method:'OPTIONS',headers:{Origin:'null','Access-Control-Request-Method':'POST'}});check('A12 a preflight is answered 204 with the headers',r.status===204&&r.headers.get('access-control-allow-origin')==='*'&&/POST/.test(r.headers.get('access-control-allow-methods')||''),String(r.status));
  r=await post(BOXURL+'?a=del&b='+B1,{t:T1,ids:[id1,'r-1-bad']});check('A13 the collected reply is removed with the token',r.s===200&&r.j.deleted===1,JSON.stringify(r.j));
  r=await J(BOXURL+'?a=list&b='+B1+'&t='+T1);check('A14 the list is empty after',r.j.count===0,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=drop&b='+B1,{t:T2});check('A15 dropping needs the token (403)',r.s===403,JSON.stringify(r.j));
  r=await post(BOXURL+'?a=drop&b='+B1,{t:T1});const r2=await J(BOXURL+'?a=list&b='+B1+'&t='+T1);check('A16 the box is dropped and gone (404)',r.s===200&&r.j.dropped===true&&r2.s===404,JSON.stringify(r.j)+' '+r2.s);
  check('A17 the data folder keeps the web out (.htaccess) and holds no box now',/Require all denied/.test(fs.readFileSync(data+'/.htaccess','utf8'))&&!fs.existsSync(data+'/'+B1),fs.readdirSync(data).join());
  /* ---- B. the form ---- */
  const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1300,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(900);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{(window.__al=window.__al||[]).push(String(m));};try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}});
  const set=(name,v)=>page.evaluate(([n,v])=>{const el=document.querySelector(`[name="${n}"]`);if(!el)return null;el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return el.value;},[name,v]);
  const val=name=>page.evaluate(n=>{const el=document.querySelector(`[name="${n}"]`);return el?el.value:null;},name);
  const view=async v=>{await page.evaluate(v=>document.querySelector(`#viewSeg button[data-view="${v}"]`).click(),v);await sleep(300);};
  const saveFile=async()=>{await page.evaluate(()=>{window.__saved=null;const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};document.querySelector('#saveBtn').click();});await sleep(500);return JSON.parse(await page.evaluate(()=>window.__saved));};
  const openFile=async t=>{await page.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'ia1.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},t);await sleep(600);};
  await view('setup');
  await set('m.client','Georgi Sample');await set('m.sid','12345');await set('m.email','bcba@example.org');await set('m.assessor','J. Newsome');await set('rp.w.fast',FAST.join('\n'));
  await set('m.beh','Hitting');await set('m.def','Forceful contact of a hand with a peer.');
  await set('inf[0].name','Ms. Rivera');await set('inf[0].email','rivera@example.org');await set('inf[1].name','Mr. Okafor');await set('inf[1].email','okafor@example.org');
  const b0=await page.evaluate(()=>({url:__rp.boxUrl(),box:__rp.box(),line:document.querySelector('#rpBoxLine').textContent}));
  check('B1 served from 127.0.0.1 with no address given: no box, the answers come by email',b0.url===''&&b0.box===null&&/No reply box/.test(b0.line),JSON.stringify(b0));
  await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
  const norm=await page.evaluate(()=>{const e=document.querySelector('#rpBox');const out=[];['https://newsomebh.com','https://newsomebh.com/reply/','https://newsomebh.com/reply/box.php','http://127.0.0.1:8126/box.php'].forEach(v=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));out.push(__rp.boxUrl());});return out;});
  check('B2 the address typed is completed to box.php (a site, the reply folder, the program itself)',norm.join('|')==='https://newsomebh.com/reply/box.php|https://newsomebh.com/reply/box.php|https://newsomebh.com/reply/box.php|'+BOXURL,norm.join('|'));
  await page.evaluate(()=>{document.querySelector('#rpBox').dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
  const b1=await page.evaluate(()=>({box:__rp.box(),line:document.querySelector('#rpBoxLine').textContent,rem:document.querySelector('[name="rp.box"]').value,dev:localStorage.getItem('nbh.ia1.respondent')}));
  check('B3 the box is registered at the site: keys and token in the form, the address remembered in the file and on the device',b1.box&&/^[a-f0-9]{32}$/.test(b1.box.id)&&/^[a-f0-9]{32}$/.test(b1.box.token)&&b1.box.site===BOXURL&&b1.box.pub.x&&b1.box.priv.d&&/Reply box ready at 127\.0\.0\.1:8126: 0 replies collected/.test(b1.line)&&b1.rem===BOXURL&&/rp\.box/.test(b1.dev||''),JSON.stringify(b1).slice(0,300));
  check('B4 the site holds the box (its token as a hash) and nothing readable',fs.existsSync(data+'/'+b1.box.id+'/token')&&fs.readFileSync(data+'/'+b1.box.id+'/token','utf8').trim()===sha(b1.box.token),fs.readdirSync(data).join());
  const l1=await page.evaluate(()=>{const u=__rp.links()[0].url;return {u,p:NBH_RESPOND.payloadFromHash(u)};});
  check('B5 the link carries the box (address, id, public key), not the private key',l1.p&&l1.p.box&&l1.p.box.u===BOXURL&&l1.p.box.b===b1.box.id&&l1.p.box.k.x===b1.box.pub.x&&l1.p.box.k.y===b1.box.pub.y&&!/"d"/.test(JSON.stringify(l1.p.box))&&!/priv/.test(l1.u),JSON.stringify(l1.p.box));
  const pg=await page.evaluate(()=>{const p=__rp.payload();return {box:!!(p.box&&p.box.b),email:p.email};});
  check('B6 the page file carries the box too, and the email for the fallback',pg.box&&pg.email==='bcba@example.org',JSON.stringify(pg));
  await page.evaluate(()=>document.querySelector('#rpDlg').close());
  /* ---- C. the informants answer ---- */
  const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);
  const answer=async(url,name,role,pattern)=>{await rp.goto(url);await sleep(400);
    await rp.evaluate(([name,role,pat])=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value=name;inp[1].value=role;inp[2].value='14';document.querySelector('select').value='Yes';inp[3].value='Classroom';
      document.querySelectorAll('li.it').forEach((li,i)=>{li.querySelector('input[value="'+pat[i%pat.length]+'"]').click();});const ta=document.querySelectorAll('textarea');if(ta[0])ta[0].value='Independent work';
      document.querySelector('input[name=nbhr-confirm][value=yes]').click();},[name,role,pattern]);
    const before=await rp.evaluate(()=>({btn:document.querySelector('button:not(.ghost)').textContent,foot:document.querySelector('.foot').textContent}));
    await rp.evaluate(()=>document.querySelector('button:not(.ghost)').click());await sleep(1500);
    const after=await rp.evaluate(()=>({done:document.querySelector('.done').innerHTML,doneHidden:document.querySelector('.done').hidden,code:document.querySelector('.code').hidden,mail:document.querySelector('#nbhr-mail').hidden||document.querySelector('#nbhr-mail').closest('.row').hidden,href:location.href.slice(0,60),warn:document.querySelector('.warn').hidden}));
    return {before,after};};
  const c1=await answer(l1.u,'Ms. Rivera','Teacher',['Y','N','NA','Y']);
  check('C1 the page says the answers are locked for the BCBA; Send sends them to the box: Sent, no code, no email, no mailto',/locked on this device/.test(c1.before.foot)&&/Send my answers to J\. Newsome/.test(c1.before.btn)&&/<b>Sent\.<\/b>/.test(c1.after.done)&&!c1.after.doneHidden&&c1.after.code&&c1.after.mail&&/respond\.html/.test(c1.after.href),JSON.stringify(c1.after));
  const c2=await answer(l1.u,'Mr. Okafor','Para',['N']);
  check('C2 a second informant sends too',/<b>Sent\.<\/b>/.test(c2.after.done),JSON.stringify(c2.after));
  const l2=await page.evaluate(u=>{const p=NBH_RESPOND.payloadFromHash(u);p.beh='Screaming';p.behLabel='Screaming';p.def='A vocalization above conversation level for 3 s or more.';return location.href.replace(/[#?].*$/,'').replace(/[^\/]*$/,'')+'respond.html'+NBH_RESPOND.payloadToHash(p);},l1.u);
  const c3=await answer(l2,'Ms. Chen','Aide',['Y']);
  check('C3 a reply about a target the file does not hold is sent as well',/<b>Sent\.<\/b>/.test(c3.after.done),JSON.stringify(c3.after));
  const onSite=fs.readdirSync(data+'/'+b1.box.id).filter(f=>/^r-/.test(f));
  check('C4 the site holds three ciphertexts and no answer in the clear',onSite.length===3&&!onSite.some(f=>/Rivera|Hitting|Georgi/.test(fs.readFileSync(data+'/'+b1.box.id+'/'+f,'utf8'))),onSite.join());
  /* ---- D. the form collects ---- */
  const d1=await page.evaluate(async()=>{const r=await __rp.collect(false);const v=n=>document.querySelector('[name="'+n+'"]').value;return {r,a:[1,2,3,4].map(i=>v('fast[0]['+i+']')),b:[1,2].map(i=>v('fast[1]['+i+']')),n0:v('inf[0].name'),n1:v('inf[1].name'),role1:v('inf[1].role'),ml:v('fast.ml_s'),banner:document.querySelector('#gfBanner').textContent,got:__rp.box().got.length,held:__rp.box().held.map(h=>h.beh+':'+h.why),outs:__rp.outs().map(o=>o.inst+'/'+o.inf+'/'+(o.recv?'recv':'')+'/'+(o.placed?'placed':'')+'/'+o.from)};});
  check('D1 Collect: two replies placed in the informants’ own columns (Rivera A, Okafor B), the third held; the board marked Received and Placed',d1.r&&d1.r.placed===2&&d1.r.held===1&&d1.r.unread===0&&d1.a.join()==='Y,N,NA,Y'&&d1.b.join()==='N,N'&&d1.n0==='Ms. Rivera'&&d1.n1==='Mr. Okafor'&&d1.role1==='Para'&&/Independent work/.test(d1.ml)&&/Collected 2 FAST responses about Hitting from the reply box/.test(d1.banner)&&/1 held/.test(d1.banner)&&d1.got===3&&d1.held.join()==='Screaming:target'&&d1.outs.filter(o=>/^fast\/[AB]\/recv\/placed\/(Ms\. Rivera|Mr\. Okafor)$/.test(o)).length===2,JSON.stringify(d1).slice(0,500));
  const d2=await page.evaluate(async()=>{const r=await __rp.collect(false);return {r,line:document.querySelector('#outBoxLine').textContent};});
  check('D2 collecting again takes nothing twice',d2.r&&d2.r.placed===0&&d2.r.fresh===0&&d2.r.all===3&&/Nothing new/.test(d2.line),JSON.stringify(d2));
  await view('outs');
  const d3=await page.evaluate(()=>({held:document.querySelector('#outHeld').textContent,btn:!!document.querySelector('#outHeld [data-hadd]'),line:document.querySelector('#outBoxLine').textContent,purge:document.querySelector('#outPurgeBtn').disabled,go:[...document.querySelectorAll('#outBody button[data-act="go"]')].length}));
  check('D3 the Send-outs sheet shows the held reply with Add it as a target, the box line, Remove on, the placed rows with Open the worksheet',/FAST reply from Ms\. Chen about Screaming/.test(d3.held)&&/does not hold that target/.test(d3.held)&&d3.btn&&/Reply box ready at 127\.0\.0\.1:8126: 3 replies collected, 1 held/.test(d3.line)&&!d3.purge&&d3.go>=2,JSON.stringify(d3));
  await page.evaluate(()=>document.querySelector('#outHeld [data-hadd]').click());await sleep(500);
  const d4=await page.evaluate(()=>{const T=__rp.targets();const r=T.list.find(x=>x.label==='Screaming');return {has:!!r,f1:r&&r.fields['fast[2][1]'],name:document.querySelector('[name="inf[0].name"]').value,held:__rp.box().held.length,outs:__rp.outs().filter(o=>o.tgt===(r&&r.id)).map(o=>o.inst+'/'+o.inf+'/'+o.from),banner:document.querySelector('#gfBanner').textContent,opts:[...document.querySelector('#tgtSel').options].map(o=>o.textContent).join('|')};});
  check('D4 Add it as a target and place it: Screaming is a target with Ms. Chen’s answers in a free column, its row received',d4.has&&d4.f1==='Y'&&d4.held===0&&d4.outs.join()==='fast/C/Ms. Chen'&&/Collected 1 FAST response about Screaming/.test(d4.banner)&&/Screaming/.test(d4.opts),JSON.stringify(d4));
  /* ---- E. the invitation, the QR code ---- */
  const e1=await page.evaluate(async()=>{const o=__rp.outs().find(x=>x.inf==='A'&&x.inst==='fast');await __rp.act('email',o.id);await new Promise(r=>setTimeout(r,200));const d=document.querySelector('dialog.nbh-inv');const out={to:d&&d.querySelector('#nbhInvTo').value,body:d&&d.querySelector('#nbhInvBo').value};if(d){d.close();d.remove();}return out;});
  check('E1 the invitation says the answers come straight back, to the informant’s email',/come straight back to me when you press Send/.test(e1.body||'')&&!/by email\./.test(e1.body||'')&&e1.to==='rivera@example.org',JSON.stringify(e1).slice(0,200));
  const e2=await page.evaluate(async()=>{const o=__rp.outs().find(x=>x.inf==='B'&&x.inst==='fast');await __rp.act('unrecv',o.id);const btn=document.querySelectorAll('#outBody button[data-act="qr"]').length;await __rp.act('qr',o.id);await new Promise(r=>setTimeout(r,200));const d=document.querySelector('#qrDlg'),svg=d.querySelector('svg');const out={btn,open:d.open,mods:svg&&+svg.dataset.modules,path:svg&&svg.querySelector('path').getAttribute('d').length,forWhom:document.querySelector('#qrFor').textContent,note:document.querySelector('#qrNote').textContent,copy:!!document.querySelector('#qrCopy')};d.close();return out;});
  check('E2 QR on a row not yet back: the dialog shows the link as a code (modules, dark cells) for that informant, with Copy',e2.btn>=1&&e2.open&&e2.mods>=21&&e2.mods<=177&&e2.path>500&&/FAST about Hitting, for B \u00b7 Mr\. Okafor/.test(e2.forWhom)&&/camera/.test(e2.note)&&e2.copy,JSON.stringify(e2));
  const e3=await page.evaluate(()=>{const s=__rp.qr('https://a.io/');return /^<svg /.test(s)&&/data-modules="21"/.test(s);});
  check('E3 a short link makes the smallest code (21 modules)',e3);
  check('E4 the Respondent pages dialog has a QR code button',await page.evaluate(()=>!!document.querySelector('#rpQr')&&document.querySelector('#rpQr').textContent==='QR code'));
  /* ---- F. the file ---- */
  const file=await saveFile();
  check('F1 the saved file carries the box: id, token, both keys, the site, the replies taken, nothing held',file.box&&file.box.id===b1.box.id&&file.box.token===b1.box.token&&file.box.priv.d&&file.box.pub.x&&file.box.site===BOXURL&&file.box.got.length===3&&file.box.held.length===0,JSON.stringify(file.box).slice(0,200));
  await page.goto(URL);await sleep(900);await page.evaluate(()=>{window.confirm=()=>true;});
  const f2=await page.evaluate(()=>({box:__rp.box(),url:__rp.boxUrl()}));
  check('F2 a fresh form on this device: no box of its own yet, the address remembered',f2.box===null&&f2.url===BOXURL,JSON.stringify(f2));
  await openFile(JSON.stringify(file));await sleep(1800);
  const f3=await page.evaluate(async()=>{const r=await __rp.collect(false);return {id:__rp.box().id,got:__rp.box().got.length,r,line:document.querySelector('#outBoxLine').textContent,beh:document.querySelector('[name="m.beh"]').value};});
  check('F3 opened again: the same box, the taken replies remembered, nothing placed twice',f3.id===b1.box.id&&f3.got===3&&f3.r&&f3.r.placed===0&&f3.r.all===3&&/Nothing new/.test(f3.line),JSON.stringify(f3));
  /* a file whose box lives at a site, opened where no address is known: the box's own site serves */
  await page.evaluate(()=>{try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}const e=document.querySelector('[name="rp.box"]');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));});
  const f4=await page.evaluate(()=>({url:__rp.boxUrl(),link:!!(NBH_RESPOND.payloadFromHash(__rp.links()[0].url)||{}).box,line:document.querySelector('#rpBoxLine').textContent}));
  check('F4 with no address known, the links still carry the box the file was registered at',f4.url===''&&f4.link&&/Reply box ready/.test(f4.line),JSON.stringify(f4));
  await set('rp.box',BOXURL);
  /* ---- G. removing from the site, an unreadable reply ---- */
  const g1=await page.evaluate(async()=>{const j=await __rp.purge();return {j,line:document.querySelector('#outBoxLine').textContent};});
  const g1s=await J(BOXURL+'?a=list&b='+b1.box.id+'&t='+b1.box.token);
  check('G1 Remove the collected replies from the site: three gone there, kept in the file',g1.j&&g1.j.deleted===3&&/3 replies removed from the site/.test(g1.line)&&g1s.j.count===0,JSON.stringify(g1)+' '+JSON.stringify(g1s.j));
  r=await post(BOXURL+'?a=put&b='+b1.box.id,{v:1,k:{x:'A'.repeat(43),y:'B'.repeat(43)},iv:'A'.repeat(16),ct:'C'.repeat(64)});
  const g2=await page.evaluate(async()=>{const r=await __rp.collect(false);return {r,got:__rp.box().got.length,line:document.querySelector('#outBoxLine').textContent};});
  check('G2 a reply that cannot be unlocked is counted, not placed, and not tried again',r.s===200&&g2.r&&g2.r.unread===1&&g2.r.placed===0&&g2.got===4&&/1 reply could not be read/.test(g2.line),JSON.stringify(g2));
  /* ---- H. a box out of reach ---- */
  await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
  await page.evaluate(()=>{const e=document.querySelector('#rpBox');e.value='http://127.0.0.1:8127/box.php';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
  const h1=await page.evaluate(()=>({line:document.querySelector('#rpBoxLine').textContent,link:!!(NBH_RESPOND.payloadFromHash(__rp.links()[0].url)||{}).box,site:__rp.box().site}));
  check('H1 an address that does not answer: the line says so, the links go without a box (the answers by email), the file keeps its box',/No connection to 127\.0\.0\.1:8127/.test(h1.line)&&!h1.link&&h1.site===BOXURL,JSON.stringify(h1));
  await page.evaluate(()=>document.querySelector('#rpDlg').close());
  const l3=await page.evaluate(u=>{const p=NBH_RESPOND.payloadFromHash(u);p.box.u='http://127.0.0.1:8127/box.php';return location.href.replace(/[#?].*$/,'').replace(/[^\/]*$/,'')+'respond.html'+NBH_RESPOND.payloadToHash(p);},l1.u);
  await rp.goto(l3);await sleep(400);
  await rp.evaluate(()=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value='Ms. Rivera';inp[1].value='Teacher';document.querySelectorAll('li.it').forEach(li=>li.querySelector('input[value="Y"]').click());document.querySelector('input[name=nbhr-confirm][value=yes]').click();document.querySelector('button:not(.ghost)').click();});await sleep(1500);
  const h2=await rp.evaluate(()=>({done:document.querySelector('#nbhr-done').textContent,cls:document.querySelector('#nbhr-done').className,code:document.querySelector('.code').value,mailTxt:document.querySelector('#nbhr-mail').textContent,href:document.querySelector('#nbhr-mail').getAttribute('href'),btn:document.querySelector('button:not(.ghost)').textContent}));
  check('H2 the page whose box cannot be reached falls back: the code shown, Open the email to the BCBA, Send to try again',/reply box could not be reached/.test(h2.done)&&h2.cls==='warn'&&/^NBH1\./.test(h2.code)&&/Open the email/.test(h2.mailTxt)&&/^mailto:bcba%40example\.org/.test(h2.href)&&/Send my answers/.test(h2.btn),JSON.stringify(h2).slice(0,300));
  const bad=log.concat(rlog).filter(l=>l.type==='pageerror'||(l.type==='error'&&!/8127|Failed to load resource|net::ERR|fetch/i.test(l.text)));
  check('I1 no script errors in the form or the pages',!bad.length,JSON.stringify(bad).slice(0,400));
  await br.close();php.kill();
  console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
