/* Form TK-1, the token board book: setup fields save and reopen; the token count rewrites the captions and the
   slots; the name form; the QR code only with a link, and its modules agree with the same library run in node
   (no independent decoder is available offline); the case prefills the targets and choices; the picker places a
   pictogram and a photo; the print page counts of every order; print colours; the shell over the form; no errors. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/tk1/shots';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';const cp=require('child_process');
const qrlib=require(__dirname+'/../tools/vendor/qrcode-generator/qrcode.js');
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const pages=f=>cp.execSync(`python3 -c "import pymupdf;d=pymupdf.open('${f}');print(d.page_count,[(round(p.rect.width/72,1),round(p.rect.height/72,1)) for p in d][:2])"`).toString().trim();
(async()=>{const br=await chromium.launch();const log=[];const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
  await page.goto(URL);await sleep(600);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
  console.log('title:',await page.title());
  const views=['setup','choices','targets','board','backs','preview','guide'];
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(150);await page.screenshot({path:`${OUT}/blank-${v}.png`,fullPage:true});}
  const pdf=async(name)=>{await page.click('#viewSeg button[data-view="preview"]');await sleep(150);await page.emulateMedia({media:'print'});await page.evaluate(()=>fitAll());await page.pdf({path:`${OUT}/${name}.pdf`,printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:'screen'});return pages(`${OUT}/${name}.pdf`);};
  /* blank book: the default order is "all" with the how-to off: 8 + 3 card sheets */
  const blank=await pdf('blank');check('blank print: 11 landscape sheets (4 fronts, 4 backs, 3 card sheets)',blank.startsWith('11 [(11.0, 8.5)'),blank);
  check('blank Board prints a line to write the name on',await page.evaluate(()=>!!document.querySelector('#book .pg[data-kind="bd"] .ttl .blank')));
  check('the 11 x 7.33 in page is centred on Letter with four corner trim marks; the frame band is 0.22 in',await page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="ch"]');const cv=p.querySelector('.cv'),f=p.querySelector('.frame'),pn=p.querySelector('.panel');const r=x=>Math.round(x/96*100)/100;return p.querySelectorAll('.trim').length===8&&r(cv.offsetTop)===0.58&&r(cv.offsetHeight)===7.33&&r(f.offsetLeft)===0.45&&r(pn.offsetLeft)===0.3&&r(pn.offsetTop)===0.3;}));
  check('Choices and Targets boxes 2.85 x 2.55 in with 0.6 in dots; the panel light grey by default',await page.evaluate(()=>{const b=document.querySelector('#book .pg[data-kind="ch"] .bx'),d=b.querySelector('.dot');const r=x=>Math.round(x/96*100)/100;return r(b.offsetWidth)===2.85&&r(b.offsetHeight)===2.55&&r(d.offsetWidth)===0.6&&getComputedStyle(document.querySelector('#book .pg[data-kind="ch"] .panel')).backgroundColor==='rgb(243, 244, 245)';}));
  check('token slots 1.95 x 1.8 in on a band exactly tall enough',await page.evaluate(()=>{const s=document.querySelector('#book .pg[data-kind="bd"] .slot'),st=document.querySelector('#book .pg[data-kind="bd"] .strip');const r=x=>Math.round(x/96*100)/100;return r(s.offsetWidth)===1.95&&r(s.offsetHeight)===1.8&&r(st.offsetHeight)===2.04;}));
  check('no QR code without a link',await page.evaluate(()=>document.querySelectorAll('#book .qr').length===0));
  /* setup fields, typed, then saved and reopened */
  await page.click('#viewSeg button[data-view="setup"]');
  await page.fill('[data-m="client"]','Test Student');await page.fill('[data-m="first"]','Ana');await page.fill('[data-m="qr"]','https://example.org/tk');await page.fill('[data-m="credit"]','Made for the Test team');
  await page.selectOption('[data-m="n"]','7');await sleep(300);
  check('token count 7 writes seven captions',await page.evaluate(()=>S.caps.length===7&&S.caps[2].b==='Just 5 More!'&&S.caps[6].b==='Just 1 More!'&&S.caps[0].b==='Your First Star!'&&S.caps[0].a==='Hurry and Get'),await page.evaluate(()=>S.caps.map(c=>c.b).join(' | ')));
  check('seven slots on the Board in two rows and seven park boxes',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="bd"] .slot').length===7&&document.querySelectorAll('#book .pg[data-kind="bd"] .srow').length===2&&document.querySelectorAll('#book .pg[data-kind="tk"] .ybx').length===7));
  await page.fill('#capTbl input[data-i="1"][data-f="b"]','Nice!');await sleep(300);
  check('a caption edit reaches the Board',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="bd"] .slot .cb')[1].textContent==='Nice!'));
  check('"Ana’s Chart" with the default possessive',await page.evaluate(()=>document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent.includes('Ana’s Chart')));
  await page.fill('[data-m="first"]','James');await page.selectOption('[data-m="poss"]','bare');await sleep(300);
  check('"James’ Chart" with the bare apostrophe',await page.evaluate(()=>document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent.includes('James’ Chart')));
  await page.fill('[data-m="setting"]','Bus');await page.selectOption('[data-m="layout"]','rules');await sleep(300);
  check('Rules-row layout: "James’ Bus Chart", one photo, an Earn box, the strip',await page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="bd"]');return p.querySelector('.ttl').textContent.includes('James’ Bus Chart')&&p.querySelectorAll('.bd-photo').length===1&&!!p.querySelector('.earn .bx.green')&&p.querySelectorAll('.slot').length===7;}));
  await page.selectOption('[data-m="layout"]','ft');await sleep(200);
  /* the QR code: present with a link; its modules agree with the same library run in node */
  const qr=await page.evaluate(()=>{const s=document.querySelector('#book .pg[data-kind="ch"] .qr svg');if(!s)return null;const d=s.querySelector('path').getAttribute('d');const cells=new Set();d.replace(/M(\d+) (\d+)h1v1h-1z/g,(m,x,y)=>{cells.add((x-2)+','+(y-2));return '';});return {n:+s.dataset.modules,cells:[...cells].sort()};});
  const q=qrlib(0,'M');q.addData('https://example.org/tk');q.make();const n=q.getModuleCount(),cells=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))cells.push(c+','+r);cells.sort();
  check('QR code appears with a link, '+n+' modules (type '+((n-17)/4)+', M), and matches the node run of the same library cell for cell',!!qr&&qr.n===n&&qr.cells.length===cells.length&&qr.cells.every((v,i)=>v===cells[i]),qr?qr.n+' modules on the page':'none');
  check('QR modules follow 21 + 4 (type - 1) for the type the library chose',!!qr&&(qr.n-17)%4===0&&qr.n===21+4*((n-17)/4-1));
  console.log('   (no independent QR decoder is available offline; the check is the same library in node and the module count)');
  check('every printed page carries the QR code (four fronts)',await page.evaluate(()=>document.querySelectorAll('#book .pg.front[data-kind]:not([data-kind^="cards"]):not([data-kind^="how"]) .qr').length===4));
  await page.selectOption('[data-m="panel"]','grey');await sleep(200);check('the mid-grey panel is an option',await page.evaluate(()=>getComputedStyle(document.querySelector('#book .pg[data-kind="tg"] .panel')).backgroundColor==='rgb(217, 221, 225)'));
  await page.evaluate(()=>{const e=document.querySelector('[data-c="fill"]');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(250);await page.click('#viewSeg button[data-view="preview"]');await sleep(150);
  check('Fill the Letter page: the page grows to 8.5 in, no trim marks, the boxes keep their size',await page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="ch"]');const r=x=>Math.round(x/96*100)/100;return r(p.querySelector('.cv').offsetHeight)===8.5&&p.querySelectorAll('.trim').length===0&&r(p.querySelector('.bx').offsetHeight)===2.55;}));
  await page.evaluate(()=>{const e=document.querySelector('[data-c="fill"]');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);await page.click('#viewSeg button[data-view="setup"]');
  /* save, clear, reopen */
  await page.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await page.evaluate(()=>document.querySelector('#saveBtn').click());await sleep(300);const saved=await page.evaluate(()=>window.__saved);const before=await page.evaluate(()=>JSON.stringify(S));
  await page.evaluate(()=>{S=blank();renderAll();});check('cleared before reopening',await page.evaluate(()=>!S.meta.client&&S.caps.length===5));
  await page.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},saved);await sleep(300);
  const after=await page.evaluate(()=>JSON.stringify(S));check('save and reopen: identical state (client, first name, count, captions, QR, credit, layout)',before===after,saved.length+' bytes');
  if(before!==after){const a=JSON.parse(before),b=JSON.parse(after);for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(b[k]))console.log('  differs:',k,JSON.stringify(a[k]).slice(0,120),'|',JSON.stringify(b[k]).slice(0,120));}
  check('the fields show the reopened values',await page.evaluate(()=>document.querySelector('[data-m="first"]').value==='James'&&document.querySelector('[data-m="n"]').value==='7'&&document.querySelector('#capTbl input[data-i="1"][data-f="b"]').value==='Nice!'));
  await page.evaluate(async()=>{const dt=new DataTransfer();dt.items.add(new File(['{"form":"VS-1","S":{}}'],'x.json'));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  check('a file from another form changes nothing',await page.evaluate(()=>S.meta.first==='James'));
  /* the case prefills the targets and the choices */
  await page.evaluate(()=>{S=blank();renderAll();});
  const rep=await page.evaluate(()=>window.__nbhFactsIn({behaviors:[{label:'Hitting',rep:'Ask for a break'},{label:'Raise my hand',isRep:true,def:'hand up'}],goals:{acq:[{beh:'Waiting'}]},menu:[{name:'Puzzle',rank:2},{name:'Tablet',rank:1},{name:'Bubbles',rank:3}],src:{behaviors:'TB-1'}}));
  check('the case fills targets (replacement, then objective) and choices (menu by rank), with library pictures where the label names one',await page.evaluate(()=>S.tg[0].l==='Ask for a break'&&S.tg[1].l==='Raise my hand'&&S.tg[1].k==='raisehand'&&S.tg[2].l==='Waiting'&&S.tg[2].k==='waiting'&&S.ch[0].l==='Tablet'&&S.ch[0].k==='tablet'&&S.ch[2].l==='Bubbles'),JSON.stringify(rep));
  const rep2=await page.evaluate(()=>window.__nbhFactsIn({behaviors:[{label:'Other',rep:'Other rep'}],menu:[{name:'Other item'}]}));
  check('nothing already entered is overwritten',rep2.filled===0&&await page.evaluate(()=>S.tg[0].l==='Ask for a break'),JSON.stringify(rep2));
  const rep3=await page.evaluate(()=>window.__nbhFactsPick({behaviors:[{label:'Sitting',isRep:true}],goals:{acq:[],red:[]},menu:[{name:'Ball'}],fn:null}));
  check('the picker adds to the empty slots',rep3.filled===2&&await page.evaluate(()=>S.tg[3].l==='Sitting'&&S.tg[3].k==='sitting'&&S.ch[3].l==='Ball'),JSON.stringify(rep3));
  /* the picker places a pictogram and a photo */
  await page.click('#viewSeg button[data-view="choices"]');await page.click('#chTbl .pick[data-i="4"] button[data-pick]');await sleep(150);
  await page.selectOption('#pdCat','fun');await page.fill('#pdQ','puzzle');await sleep(100);await page.click('#pdGrid button[data-k="puzzle"]');await sleep(250);
  check('the picker places a pictogram in choice 5',await page.evaluate(()=>S.ch[4].k==='puzzle'&&!!document.querySelector('#book .pg[data-kind="cards-ch"] .card:nth-child(5) svg')));
  await page.click('#chTbl .pick[data-i="5"] button[data-pick]');await sleep(150);
  await page.evaluate(()=>{const c=document.createElement('canvas');c.width=90;c.height=60;const x=c.getContext('2d');x.fillStyle='#36c';x.fillRect(0,0,90,60);c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'bus.png',{type:'image/png'}));const i=document.querySelector('#photoIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});});await sleep(600);
  check('an uploaded photo becomes choice 6 and prints on the card sheet',await page.evaluate(()=>S.photos.length===1&&S.ch[5].ph===S.photos[0].id&&S.photos[0].label==='bus'&&!!document.querySelector('#book .pg[data-kind="cards-ch"] .card:nth-child(6) img')));
  /* the student photo and the token */
  await page.click('#viewSeg button[data-view="setup"]');await page.click('#phPick button[data-pick]');await sleep(150);await page.selectOption('#pdCat','_photos');await sleep(100);await page.click('#pdGrid button[data-ph]');await sleep(250);
  check('the photo replaces the avatar in both Board corners',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="bd"] .bd-photo img').length===2));
  await page.click('#tokPick button[data-pick]');await sleep(150);await page.click('#pdGrid button[data-k="tk:heart"]');await sleep(300);
  check('the heart token renames the first caption and prints on the Tokens corners and the token cards',await page.evaluate(()=>S.caps[0].b==='Your First Heart!'&&document.querySelectorAll('#book .pg[data-kind="tk"] .tkcorner svg').length===2&&document.querySelectorAll('#book .pg[data-kind="cards-tk"] .card.tok').length===5));
  /* the backs and the how-to text */
  await page.click('#viewSeg button[data-view="backs"]');await page.fill('textarea[data-b="cb"]','## My heading\nFirst line **bold** and __under__.\n\nSecond paragraph with {n} boxes and a {token}.');await sleep(300);
  check('the back text renders the markup and the placeholders',await page.evaluate(()=>{const b=document.querySelector('#book .pg[data-kind="ch"][data-side="back"] .bbody');return !!b&&b.querySelector('h4').textContent==='My heading'&&!!b.querySelector('b')&&!!b.querySelector('u')&&/five boxes and a Heart/.test(b.textContent);}));
  check('the Token Economy back carries the credit line beside the logo',await page.evaluate(()=>{S.meta.credit='Credit here';renderOut();const c=document.querySelector('#book .pg[data-kind="tk"][data-side="back"] .credit');return !!c&&c.textContent.trim()==='Credit here'&&c.querySelector('img').getAttribute('src').startsWith('data:image');}));
  /* a back too long for 15 pt continues on a second back page, after a blank sheet in a duplex order */
  await page.evaluate(()=>{window.__tb=S.txt.tb;S.txt.tb=S.txt.tb+'\n\n'+S.txt.te;S.meta.order='duplex';renderAll();});await sleep(300);
  check('a long back continues on a second back page with a blank sheet before it (duplex 8 -> 10)',await page.evaluate(()=>{const k=[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind+'/'+(p.dataset.side||'x')).join(' ');const body=document.querySelector('#book .pg[data-kind="bd"][data-side="back"] .bbody');return k==='ch/front ch/back tg/front tg/back bd/front bd/back blank/x bd/back tk/front tk/back'&&parseFloat(body.style.fontSize)>=15&&!!document.querySelector('#book .pg.contd .cont');}),await page.evaluate(()=>[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind).join(' ')));
  await page.evaluate(()=>{S.txt.tb=window.__tb;renderAll();});
  /* print orders and page counts */
  await page.evaluate(()=>{document.querySelector('#simBtn').click();});await sleep(600);
  const setOrder=async(o,how)=>{await page.click('#viewSeg button[data-view="setup"]');await page.selectOption('[data-m="order"]',o);if(how!==undefined){await page.evaluate(h=>{const e=document.querySelector('[data-c="pg_how"]');e.checked=h;e.dispatchEvent(new Event('change',{bubbles:true}));},how);}await sleep(200);};
  await setOrder('fronts',false);let r=await pdf('fronts');check('fronts only: 4 pages',r.startsWith('4 [(11.0, 8.5)'),r);
  await setOrder('duplex',false);r=await pdf('duplex');check('fronts and backs for duplex: 8 pages',r.startsWith('8 ['),r);
  check('duplex order interleaves front 1, back 1, front 2, back 2',await page.evaluate(()=>[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind+'/'+p.dataset.side).join(' ')==='ch/front ch/back tg/front tg/back bd/front bd/back tk/front tk/back'));
  await setOrder('duplex',true);r=await pdf('duplex-how');check('with the how-to insert: 10 pages',r.startsWith('10 ['),r);
  await setOrder('cards');r=await pdf('cards');check('the card sheets: 3 pages (choices with Other, targets with Other, tokens)',r.startsWith('3 [')&&await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="cards-ch"] .card').length===7&&document.querySelectorAll('#book .pg[data-kind="cards-tg"] .card').length===7&&document.querySelectorAll('#book .pg[data-kind="cards-tk"] .card').length===5),r);
  await setOrder('all',true);r=await pdf('all');check('all: 13 pages (8 book, 2 how-to, 3 card sheets)',r.startsWith('13 ['),r);
  await setOrder('spare');r=await pdf('spare');check('card labels shrink to fit the card rather than clip',await page.evaluate(()=>[...document.querySelectorAll('#book .card .cl')].every(e=>e.scrollWidth<=e.clientWidth+1)));
  check('a sheet of one card: 1 portrait page, 30 large cards',r.startsWith('1 [(8.5, 11.0)')&&await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="spare"] .card').length===30),r);
  await page.evaluate(()=>{S.meta.sp_size='small';renderOut();});r=await pdf('spare-small');check('the small sheet: 42 cards',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="spare"] .card').length===42));
  await page.evaluate(()=>{S.meta.sp_size='large';S.meta.sp_card='tok';renderOut();});check('a sheet of the token',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="spare"] .card.tok').length===30));
  await setOrder('all',true);await pdf('sim');
  /* print colours: the frame, a tab and the Then box on the rendered PDF */
  const px=cp.execSync(`python3 -c "
import pymupdf
d=pymupdf.open('${OUT}/sim.pdf');p=d[0];pm=p.get_pixmap(dpi=72)
def at(x,y): return pm.pixel(int(x*72),int(y*72))
print(at(0.55,4.0),at(10.62,1.0),at(10.8,8.3))
p=d[4];pm=p.get_pixmap(dpi=72);print(at(7.3,3.3))"`).toString().trim();
  const cols=px.match(/\((\d+), (\d+), (\d+)\)/g).map(s=>s.match(/\d+/g).map(Number));
  const near=(c,ref,tol)=>c.every((v,i)=>Math.abs(v-ref[i])<=tol);
  check('print colours are real: slate band, green CHOICES tab, white below the trim, green Then box',near(cols[0],[105,140,168],12)&&near(cols[1],[174,213,158],14)&&near(cols[2],[255,255,255],2)&&near(cols[3],[184,224,168],14),px);
  /* the simulator fills the book */
  check('the simulator: six choices, six targets, star, QR link, how-to on',await page.evaluate(()=>S.ch.every(o=>o.k)&&S.tg.every(o=>o.k)&&S.tok[0].k==='tk:star'&&!!S.meta.qr&&S.chk.pg_how===true&&S.meta.first==='Sam'));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* backs fit the page: no body overflows after the fit */
  await page.click('#viewSeg button[data-view="preview"]');await sleep(200);await page.evaluate(()=>fitAll());
  check('every back and how-to page fits its panel after the fit',await page.evaluate(()=>[...document.querySelectorAll('#book .fit')].every(e=>e.scrollHeight<=e.clientHeight+2)),await page.evaluate(()=>[...document.querySelectorAll('#book .fit')].map(e=>e.style.fontSize||'16pt').join(' ')));
  /* csv */
  await page.evaluate(()=>{window.__saved=null;document.querySelector('#csvBtn').click();});await sleep(200);const csv=await page.evaluate(()=>window.__saved);
  check('csv: header + 6 choices + 6 targets + 2 board + 5 slots = 20 lines',csv.split('\n').length===20,csv.split('\n').length);
  /* phone */
  await page.setViewportSize({width:390,height:800});await sleep(300);let overflow=0;
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`).catch(()=>{});await sleep(250);const sw=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);if(sw[0]!==sw[1]){overflow++;console.log('  PHONE OVERFLOW',v,sw.join('/'));}}
  check('no horizontal overflow on a phone',overflow===0);
  check('no console or page errors on the form',log.length===0,JSON.stringify(log).slice(0,300));
  await page.close();
  /* the shell over the form: open, status, simulation, facts, snapshot and restore carry the pictures */
  const log2=[];const ctx=await br.newContext({viewport:{width:1440,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});const sh=await ctx.newPage();wire(sh,log2);
  await sh.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
  check('the index lists TK-1 and counts 44 forms',await sh.evaluate(()=>FORMS.flatMap(g=>g[1]).some(f=>f[0]==='TK-1')&&FORMS.flatMap(g=>g[1]).length===44&&/0 of 44 ticked/.test(document.body.innerText)));
  await sh.evaluate(()=>openForm('TK-1'));const ok=await sh.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:20000}).then(()=>true).catch(()=>false);
  check('TK-1 opens in the shell and answers status',ok);
  const fr=sh.frames().find(f=>f.url().includes('TK-1_'));await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await fr.evaluate(()=>document.querySelector('#simBtn').click());await sleep(500);
  const facts=await sh.evaluate(async()=>{const b=await grab('TK-1','facts',{facts:{behaviors:[{label:'Probe',rep:'Probe replacement'}],src:{behaviors:'TB-1'}}},3000);return b&&b.report;});
  check('the shell hands the case to the form (full slots: nothing filled, a note instead)',!!facts&&facts.filled===0,JSON.stringify(facts));
  const snap=await sh.evaluate(async()=>{const r=await grab('TK-1','snapshot',null,8000);return r&&r.snap;});
  check('a snapshot carries the whole state in tk.state',!!snap&&typeof snap.data['#tkState']==='string'&&JSON.parse(snap.data['#tkState']).ch[0].k==='ipad');
  await fr.evaluate(()=>{S=blank();renderAll();});const restored=await sh.evaluate(async s=>{const r=await grab('TK-1','restore',{snap:s},8000);return !!r;},snap);
  check('restore brings the pictures and captions back',restored&&await fr.evaluate(()=>S.ch[0].k==='ipad'&&S.tg[3].l==='Waiting'&&S.meta.first==='Sam'&&S.caps.length===5));
  const f2=await sh.evaluate(async()=>{const b=await grab('TK-1','facts?',null,3000);return b;});
  check('no console or page errors in the shell',log2.filter(l=>l.type==='pageerror').length===0,JSON.stringify(log2).slice(0,300));
  await br.close();console.log('RESULT: '+(fails?fails+' FAILED':'ALL PASS'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
