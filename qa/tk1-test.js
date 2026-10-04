/* Form TK-1, the token board book: the page laid out from the assessor's Illustrator files (8.82 x 5.82 in, centred on
   Letter with trim marks; the 11 in page and Fill the Letter page); setup fields save and reopen; the token count
   rewrites the captions and the slots; the name form; the QR code only with a link, its modules equal to the same library
   run in node, and decoded from the printed page by zxing-cpp where python3 has it (pip install zxing-cpp); the default
   texts fit their backs; the case prefills the targets and choices; the picker places a pictogram and a photo; the print
   page counts of every order; print colours; the shell over the form; no errors. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/tk1/shots';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';const cp=require('child_process');
const qrlib=require(__dirname+'/../tools/vendor/qrcode-generator/qrcode.js');
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const zx=(()=>{try{cp.execSync('python3 -c "import zxingcpp, pymupdf"',{stdio:'ignore'});return true;}catch(e){return false;}})();
/* the QR codes zxing-cpp finds on one page of a PDF, rendered at the given resolution */
const decode=(f,i,dpi)=>cp.execSync(`python3 -c "import pymupdf,zxingcpp;from PIL import Image;d=pymupdf.open('${f}');pm=d[${i}].get_pixmap(dpi=${dpi});im=Image.frombytes('RGB',(pm.width,pm.height),pm.samples);print('|'.join(b.text for b in zxingcpp.read_barcodes(im)))"`).toString().trim();
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
  const geo=()=>page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="ch"]');const cv=p.querySelector('.cv'),b=p.querySelector('.band'),pn=p.querySelector('.panel'),bx=p.querySelector('.bx');const i=x=>Math.round(x/96*100)/100;
    /* points of the page, from the drawn rectangles (offsetWidth is whole pixels): the page box is 635.04 pt times the page's scale */
    const cr=cv.getBoundingClientRect(),k=635.04*parseFloat(getComputedStyle(p).getPropertyValue('--s'))/cr.width,q=x=>Math.round(x*k*10)/10;
    return {left:i(cv.offsetLeft),top:i(cv.offsetTop),w:i(cv.offsetWidth),h:i(cv.offsetHeight),band:q(b.getBoundingClientRect().width),panelL:q(pn.getBoundingClientRect().left-cr.left),trims:p.querySelectorAll('.trim').length,box:q(bx.getBoundingClientRect().width),dot:q(bx.querySelector('.dot').getBoundingClientRect().width),boxIn:Math.round(bx.getBoundingClientRect().width*k/72*100)/100,bg:getComputedStyle(pn).backgroundColor};});
  let g=await geo();
  check('the 8.82 x 5.82 in page sits centred on Letter (1.09 in in, 1.34 in down) with four corner trim marks; the band 616.2 pt, the panel 15.4 pt in from the bound edge',g.left===1.09&&g.top===1.34&&g.w===8.82&&g.h===5.82&&g.trims===8&&g.band===616.2&&g.panelL===15.4,JSON.stringify(g));
  check('Choices boxes 146.88 pt plus their 2 pt edge, the dots 18 pt in radius plus the stroke; the panel #f5f5f5 as in the file',g.box===148.9&&g.dot===37&&g.bg==='rgb(245, 245, 245)',JSON.stringify(g));
  check('token slots 110.53 pt plus the edge on a band 126.61 pt below the panel, as in the file',await page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="bd"]'),s=p.querySelector('.slot'),st=p.querySelector('.strip');const k=635.04/p.querySelector('.cv').getBoundingClientRect().width,q=x=>Math.round(x*k*10)/10;return q(s.getBoundingClientRect().width)===112.5&&q(st.getBoundingClientRect().height)===126.6;}));
  check('the Token Economy back carries the assessor\u2019s resources line by default, and the backs carry no picture',await page.evaluate(()=>{const c=document.querySelector('#book .pg[data-kind="tk"][data-side="back"] .credit');return !!c&&/To find more resources and information visit/.test(c.textContent)&&/www\.Behavior-Charts\.com/.test(c.textContent)&&document.querySelectorAll('#book .pg.back img').length===0;}));
  check('the default texts fit their backs with the credit line (no continuation page, the body at 11 pt or more)',await page.evaluate(()=>!document.querySelector('#book .pg.contd')&&[...document.querySelectorAll('#book .pg.back .bbody')].every(b=>parseFloat(getComputedStyle(b).fontSize)*72/96>=10.99)),await page.evaluate(()=>[...document.querySelectorAll('#book .pg.back .bbody')].map(b=>(parseFloat(getComputedStyle(b).fontSize)*72/96).toFixed(2)+'pt').join(' ')+(document.querySelector('#book .pg.back.compact')?', the credit on one line':'')));
  check('no QR code without a link',await page.evaluate(()=>document.querySelectorAll('#book .qr').length===0));
  /* setup fields, typed, then saved and reopened */
  await page.click('#viewSeg button[data-view="setup"]');
  await page.fill('[data-m="client"]','Test Student');await page.fill('[data-m="first"]','Ana');await page.fill('[data-m="qr"]','https://example.org/tk');await page.fill('[data-m="credit"]','Made for the Test team');
  await page.selectOption('[data-m="n"]','7');await sleep(300);
  check('token count 7 writes seven captions',await page.evaluate(()=>S.caps.length===7&&S.caps[2].b==='Just 5 More!'&&S.caps[6].b==='Just 1 More!'&&S.caps[0].b==='Your First Star!'&&S.caps[0].a==='Hurry and Get'),await page.evaluate(()=>S.caps.map(c=>c.b).join(' | ')));
  check('seven slots on the Board in two rows and seven park boxes',await page.evaluate(()=>{const s=[...document.querySelectorAll('#book .pg[data-kind="bd"] .slot')];return s.length===7&&new Set(s.map(e=>e.style.top)).size===2&&document.querySelectorAll('#book .pg[data-kind="tk"] .ybx').length===7;}));
  await page.fill('#capTbl input[data-i="1"][data-f="b"]','Nice!');await sleep(300);
  check('a caption edit reaches the Board',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="bd"] .slot .cb')[1].textContent==='Nice!'));
  check('"Ana’s Chart" with the default possessive',await page.evaluate(()=>document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent.includes('Ana’s Chart')));
  await page.fill('[data-m="first"]','James');await page.selectOption('[data-m="poss"]','bare');await sleep(300);
  check('"James’ Chart" with the bare apostrophe',await page.evaluate(()=>document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent.includes('James’ Chart')));
  await page.fill('[data-m="setting"]','Bus');await page.selectOption('[data-m="layout"]','rules');await sleep(300);
  check('Rules-row layout: "James’ Bus Chart", one photo, an Earn box, the strip',await page.evaluate(()=>{const p=document.querySelector('#book .pg[data-kind="bd"]');return p.querySelector('.ttl').textContent.includes('James’ Bus Chart')&&p.querySelectorAll('.bd-photo').length===1&&!!p.querySelector('.earn .bx.green')&&p.querySelectorAll('.slot').length===7;}));
  await page.selectOption('[data-m="layout"]','ft');await sleep(200);
  /* the QR code: present with a link; its modules agree with the same library run in node */
  const qrOf=()=>page.evaluate(()=>{const s=document.querySelector('#book .pg[data-kind="ch"] .qr svg');if(!s)return null;const d=s.querySelector('path.mod').getAttribute('d');const cells=new Set();d.replace(/M(\d+) (\d+)h1v1h-1z/g,(m,x,y)=>{cells.add((x-2)+','+(y-2));return '';});return {n:+s.dataset.modules,ec:s.dataset.ec,mid:s.dataset.mid,cells:[...cells].sort(),finders:s.querySelectorAll('rect.fd').length};});
  /* the same library in node: every dark module, less the finders and the middle square when the code is framed */
  const same=(qr,ec)=>{const q=qrlib(0,ec);q.addData('https://example.org/tk');q.make();const n=q.getModuleCount(),cells=[];const fr=ec==='H';const [c0,w]=fr&&qr&&qr.mid?qr.mid.split(',').map(Number):[0,0];
    const skip=(r,c)=>fr&&((r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7)||(r>=c0&&r<c0+w&&c>=c0&&c<c0+w));for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c)&&!skip(r,c))cells.push(c+','+r);cells.sort();
    return {n,ok:!!qr&&qr.n===n&&qr.ec===ec&&qr.cells.length===cells.length&&qr.cells.every((v,i)=>v===cells[i])};};
  let qr=await qrOf(),cmp=same(qr,'H');
  check('QR code with a link, in the assessor\u2019s SCAN ME style by default: level H, '+cmp.n+' modules, three rounded finders, the data modules equal to the node run of the same library',cmp.ok&&qr.finders===6,qr?qr.n+' modules, level '+qr.ec:'none');
  await page.evaluate(()=>{const e=document.querySelector('[data-c="qrframe"]');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(250);qr=await qrOf();cmp=same(qr,'M');const n=cmp.n;
  check('untick the style: a plain black code, level M, '+n+' modules (type '+((n-17)/4)+'), every module equal to the node run',cmp.ok&&qr.finders===0,qr?qr.n+' modules, level '+qr.ec:'none');
  check('QR modules follow 21 + 4 (type - 1) for the type the library chose',(n-17)%4===0&&n===21+4*((n-17)/4-1));
  await page.evaluate(()=>{const e=document.querySelector('[data-c="qrframe"]');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(250);
  check('every printed page carries the QR code (four fronts)',await page.evaluate(()=>document.querySelectorAll('#book .pg.front[data-kind]:not([data-kind^="cards"]):not([data-kind^="how"]) .qr').length===4));
  await page.selectOption('[data-m="panel"]','grey');await sleep(200);check('the mid-grey panel is an option',await page.evaluate(()=>getComputedStyle(document.querySelector('#book .pg[data-kind="tg"] .panel')).backgroundColor==='rgb(217, 221, 225)'));
  await page.selectOption('[data-m="pagesize"]','11');await sleep(250);await page.click('#viewSeg button[data-view="preview"]');await sleep(150);g=await geo();
  check('the 11 in page: the same page scaled 1.247 to 11 x 7.26 in, with trim marks',g.w===11&&g.h===7.26&&g.trims===8&&g.boxIn===2.58,JSON.stringify(g));
  await page.click('#viewSeg button[data-view="setup"]');await page.selectOption('[data-m="pagesize"]','fill');await sleep(250);await page.click('#viewSeg button[data-view="preview"]');await sleep(150);g=await geo();
  check('Fill the Letter page: 11 x 8.5 in, no trim marks, the boxes keep the 11 in page\u2019s size',g.w===11&&g.h===8.5&&g.trims===0&&g.boxIn===2.58,JSON.stringify(g));
  await page.click('#viewSeg button[data-view="setup"]');await page.selectOption('[data-m="pagesize"]','8.82');await sleep(200);
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
  /* several pictures at once: "Choose the six pictures", tapped in order, go on cards 1 to 6 with their own names */
  await page.click('#chSix');await sleep(250);
  const six=await page.evaluate(()=>[...document.querySelectorAll('#pdGrid button[data-k]')].map(b=>b.dataset.k).filter(k=>!k.includes(':')).slice(40,46));
  for(const k of six){await page.click('#pdGrid button[data-k="'+k+'"]');await sleep(40);}
  const badges=await page.evaluate(()=>[...document.querySelectorAll('#pdGrid button.on')].length);
  await page.click('#pdGo');await sleep(300);
  check('several at once: six pictures tapped in order fill choices 1 to 6, labels cleared to the pictures\u2019 names',badges===6&&await page.evaluate(k=>S.ch.every((o,i)=>o.k===k[i]&&!o.l),six),six.join(' '));

  /* (v21.42i) the arrows move a card with its label; a row's Choose opens on one picture, the switch to several sticks for the session */
  check('the arrow moves card 1 down to 2 and card 2 up to 1; the first up and the last down arrows are off',await page.evaluate(()=>{const a=S.ch[0].k,b=S.ch[1].k;S.ch[0].l='Lab';document.querySelector('#chTbl button[data-mv="ch:0:1"]').click();const ok=S.ch[0].k===b&&S.ch[1].k===a&&S.ch[1].l==='Lab';S.ch[1].l='';document.querySelector('#chTbl button[data-mv="ch:1:-1"]').click();renderAll();return ok&&S.ch[0].k===a&&document.querySelector('#chTbl button[data-mv="ch:0:-1"]').disabled&&document.querySelector('#chTbl button[data-mv="ch:5:1"]').disabled;}));
  await page.click('#chTbl .pick[data-i="2"] button[data-pick]');await sleep(150);
  const one=await page.evaluate(()=>!PICK.multi&&document.querySelector('#pdOne').getAttribute('aria-pressed')==='true'&&getComputedStyle(document.querySelector('#pdMultiLab')).display!=='none');
  await page.click('#pdMulti');await sleep(80);
  const sev=await page.evaluate(()=>PICK.multi&&document.querySelector('#photoIn').multiple&&/cards 3 to 6/.test(document.querySelector('#pdTitle').textContent));
  await page.click('#pdClose');await page.click('#viewSeg button[data-view="targets"]');await page.click('#tgTbl .pick[data-i="0"] button[data-pick]');await sleep(150);
  const kept=await page.evaluate(()=>PICK.multi);await page.click('#pdOne');await page.click('#pdClose');
  check('a row opens the picker on one picture; Several at once sets the title and lets several photos upload, and stays on for the next row',one&&sev&&kept,[one,sev,kept].join(' '));
  check('Setup names a picture used twice among the six',await page.evaluate(()=>{const k=S.ch[1].k;S.ch[1].k=S.ch[0].k;renderAll();const t=document.querySelector('#setupVerdict').textContent;S.ch[1].k=k;renderAll();return /same picture on choices 1 and 2/.test(t)&&!/same picture/.test(document.querySelector('#setupVerdict').textContent);}));
  check('Setup and the Preview show the build of the form',await page.evaluate(()=>/build v21\.42i/.test(document.querySelector('#buildLine').textContent)&&/Form build v21\.42i/.test(document.querySelector('#prevLine').textContent)));
  /* (v21.43) the terminal token: off by default; the same picture or its own picture with the orange double border; its ring on the last slot and the last box; the back text says so */
  check('the terminal token: off by default, then the last slot, the last box and the last token card are marked, with its own picture when chosen, and the backs say so',await page.evaluate(()=>{const q=s=>document.querySelectorAll('#book '+s);const off=q('.last').length===0&&!/The last .* looks different/.test(q('.pg[data-kind="bd"][data-side="back"]')[0].textContent);
    S.meta.term='pic';renderAll();const n=nTok();const sl=q('.pg[data-kind="bd"] .slot'),bx=q('.pg[data-kind="tk"] .ybx'),tk=q('.pg[data-kind="cards-tk"] .card.tok');
    const pic=sl[n-1].classList.contains('last')&&q('.pg[data-kind="bd"] .slot.last').length===1&&bx[n-1].classList.contains('last')&&q('.pg[data-kind="tk"] .ybx.last').length===1&&tk.length===n&&tk[n-1].classList.contains('last')&&q('.pg[data-kind="cards-tk"] .card.tok.last').length===1&&tk[n-1].innerHTML!==tk[0].innerHTML&&/looks different from the others/.test(q('.pg[data-kind="bd"][data-side="back"]')[0].textContent)&&getComputedStyle(tk[n-1]).borderTopStyle==='double';
    S.meta.term='ring';renderAll();const tk2=q('.pg[data-kind="cards-tk"] .card.tok');const ring=tk2[n-1].classList.contains('last')&&tk2[n-1].querySelector('.cp').innerHTML===tk2[0].querySelector('.cp').innerHTML;
    S.meta.term='none';renderAll();return off&&pic&&ring&&q('.last').length===0;}));
  check('a saved book reopens with its last-token picture and with an SVG photo',await page.evaluate(()=>{const keep=JSON.stringify(S);S.tokL[0]={k:'tk:trophy',ph:'',l:''};S.meta.term='pic';S.photos.push({id:'psvg',label:'drawn',img:'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>')});S.ch[5]={k:'',ph:'psvg',l:''};
    const o=fromFile(JSON.parse(JSON.stringify({form:'TK-1',S})));const ok=o.tokL[0].k==='tk:trophy'&&o.meta.term==='pic'&&o.photos.some(p=>p.id==='psvg')&&o.ch[5].ph==='psvg';S=JSON.parse(keep);renderAll();return ok;}));
  /* (v21.43) the user's two cards in the picture library: YouTube (the logo) and Waiting (a word card: TK-1 prints its label alone) */
  check('the library holds the YouTube logo and the Waiting word card; a word card prints its label alone, the table still shows the word',await page.evaluate(()=>{const P=window.NBH_PICTOS||{};if(!P.youtube||!P.waitingword||P.waitingword.w!==1||P.youtube.l!=='YouTube'||P.waitingword.l!=='Waiting')return false;
    const keep=JSON.stringify(S);S.ch[0]={k:'youtube',ph:'',l:''};S.tg[3]={k:'waitingword',ph:'',l:''};renderAll();
    const ch=document.querySelectorAll('#book .pg[data-kind="cards-ch"] .card')[0],tg=document.querySelectorAll('#book .pg[data-kind="cards-tg"] .card')[3];
    const ok=ch.querySelector('.cl').textContent==='YouTube'&&!!ch.querySelector('.cp svg')&&tg.querySelector('.cl').textContent==='Waiting'&&tg.querySelector('.cp').innerHTML===''&&!!document.querySelector('#tgTbl .pick[data-i="3"] .pv svg')&&/Google LLC/.test(window.NBH_PICTO_LICENSE);
    S=JSON.parse(keep);renderAll();return ok;}));
  check('the library holds the practice\u2019s Bike, Playground, Chips and Fruit pictures; each prints on its card as an embedded picture under its label',await page.evaluate(()=>{const P=window.NBH_PICTOS||{};const ks=['cardbike','cardplayground','cardchips','cardfruit'],ls=['Bike','Playground','Chips','Fruit'];
    if(!ks.every((k,i)=>P[k]&&P[k].l===ls[i]&&/data:image\/webp;base64,/.test(P[k].s)))return false;const keep=JSON.stringify(S);ks.forEach((k,i)=>S.ch[i]={k,ph:'',l:''});renderAll();
    const cards=[...document.querySelectorAll('#book .pg[data-kind="cards-ch"] .card')];const ok=ks.every((k,i)=>cards[i].querySelector('.cl').textContent===ls[i]&&!!cards[i].querySelector('.cp svg image'));
    S=JSON.parse(keep);renderAll();return ok;}));
  check('From the case: a problem behavior goes on Targets only as its replacement, a reduction goal never, and the note says why',await page.evaluate(()=>{const keep=JSON.stringify(S);S.tg=S.tg.map(()=>cello());renderAll();
    const r=window.__nbhFactsPick({behaviors:[{label:'Elopement',isRep:false,rep:'Asks for a break'},{label:'Hitting',isRep:false,rep:''},{label:'Raises hand',isRep:true}],goals:{acq:[{beh:'Writes name'}],red:[{beh:'Aggression'}]},menu:[]});
    const labs=S.tg.map(o=>o.l).filter(Boolean);const ok=r.filled===3&&labs.join('|')==='Asks for a break|Raises hand|Writes name'&&!labs.some(l=>/Elopement|Hitting|Aggression/.test(l))&&/2 items were left out/.test(r.note)&&!/full/.test(r.note);
    S=JSON.parse(keep);renderAll();return ok;}));
  check('the six-at-once buttons sit above each table and below it',await page.evaluate(()=>document.querySelectorAll('[data-six="ch"]').length===2&&document.querySelectorAll('[data-six="tg"]').length===2));
  /* the photos face each other: the right one mirrored by default, the left or neither on request; the one photo of the Rules row follows the right */
  await page.click('#viewSeg button[data-view="board"]');await sleep(150);
  check('the Board photos face each other: right mirrored by default, left or neither on request',await page.evaluate(()=>{const f=()=>[...document.querySelectorAll('#book .pg[data-kind="bd"] .bd-photo')].map(e=>(e.classList.contains('l')?'l':'r')+(e.classList.contains('flip')?'F':'')).join(',');const out=[];out.push(f());S.meta.ph_flip='l';renderOut();out.push(f());S.meta.ph_flip='none';renderOut();out.push(f());S.meta.ph_flip='r';renderOut();const m=getComputedStyle(document.querySelector('#bdOut .bd-photo.flip')).transform;return out.join('|')==='l,rF|lF,r|l,r'&&/matrix\(-1/.test(m)&&document.querySelectorAll('#phLook .bd-photo').length===2;}));
  await page.click('#viewSeg button[data-view="setup"]');await page.click('#phPick button[data-pick]');await sleep(150);await page.selectOption('#pdCat','_photos');await sleep(100);await page.click('#pdGrid button[data-ph]');await sleep(250);
  check('the photo replaces the avatar in both Board corners',await page.evaluate(()=>document.querySelectorAll('#book .pg[data-kind="bd"] .bd-photo img').length===2));
  check('the default token is the assessor\u2019s star art in the Tokens corners and on the token cards',await page.evaluate(()=>S.tok[0].k==='tk:star'&&document.querySelectorAll('#book .pg[data-kind="tk"] .tkcorner .card.tok img').length===2&&document.querySelectorAll('#book .pg[data-kind="cards-tk"] .card.tok img').length===5));
  await page.click('#tokPick button[data-pick]');await sleep(150);await page.click('#pdGrid button[data-k="tk:heart"]');await sleep(300);
  check('the heart token renames the first caption and prints on the Tokens corners and the token cards',await page.evaluate(()=>S.caps[0].b==='Your First Heart!'&&document.querySelectorAll('#book .pg[data-kind="tk"] .tkcorner svg').length===2&&document.querySelectorAll('#book .pg[data-kind="cards-tk"] .card.tok').length===5));
  /* the backs and the how-to text */
  await page.click('#viewSeg button[data-view="backs"]');await page.fill('textarea[data-b="cb"]','## My heading\nFirst line **bold** and __under__.\n\nSecond paragraph with {n} boxes and a {token}.');await sleep(300);
  check('the back text renders the markup and the placeholders',await page.evaluate(()=>{const b=document.querySelector('#book .pg[data-kind="ch"][data-side="back"] .bbody');return !!b&&b.querySelector('h4').textContent==='My heading'&&!!b.querySelector('b')&&!!b.querySelector('u')&&/five boxes and a heart\./.test(b.textContent);}));
  check('an edited credit line prints on the Token Economy back; a cleared one prints nothing',await page.evaluate(()=>{S.meta.credit='Credit here';renderOut();const c=document.querySelector('#book .pg[data-kind="tk"][data-side="back"] .credit');const ok=!!c&&c.textContent.trim()==='Credit here';S.meta.credit='';renderOut();return ok&&!document.querySelector('#book .pg[data-kind="tk"][data-side="back"] .credit');}));
  /* a back too long for 11 pt continues on a second back page, after a blank sheet in a duplex order; the first part keeps its size */
  await page.evaluate(()=>{window.__tb=S.txt.tb;S.txt.tb=S.txt.tb+'\n\n'+S.txt.te;S.meta.order='duplex';renderAll();});await sleep(300);
  check('a long back continues on further back pages, each after a blank sheet in the duplex order',await page.evaluate(()=>{const k=[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind+'/'+(p.dataset.side||'x')).join(' ');const body=document.querySelector('#book .pg[data-kind="bd"][data-side="back"] .bbody');return /^ch\/front ch\/back tg\/front tg\/back bd\/front bd\/back (blank\/x bd\/back )+tk\/front tk\/back$/.test(k)&&parseFloat(body.style.fontSize)>=11&&body.dataset.fixed===body.style.fontSize&&!!document.querySelector('#book .pg.contd .cont');}),await page.evaluate(()=>[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind).join(' ')));
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
print(at(1.2,4.12),at(9.77,2.715),at(10.8,8.3))
p=d[4];pm=p.get_pixmap(dpi=72);print(at(6.65,3.42))"`).toString().trim();
  const cols=px.match(/\((\d+), (\d+), (\d+)\)/g).map(s=>s.match(/\d+/g).map(Number));
  const near=(c,ref,tol)=>c.every((v,i)=>Math.abs(v-ref[i])<=tol);
  check('print colours are the files\u2019: slate band #698da9, green CHOICES tab #acd69b, white outside the trim, green Then box #acd69a',near(cols[0],[105,141,169],6)&&near(cols[1],[172,214,155],6)&&near(cols[2],[255,255,255],2)&&near(cols[3],[172,214,154],6),px);
  /* the QR codes read back from the printed page */
  if(zx){const a=decode(`${OUT}/sim.pdf`,0,300),b=decode(`${OUT}/sim.pdf`,0,150);const want=await page.evaluate(()=>S.meta.qr);
    check('zxing-cpp reads the SCAN ME code from the printed Choices page at 300 and 150 dpi',a===want&&b===want,a+' / '+b);
    await page.evaluate(()=>{S.chk.qrframe=false;renderOut();});await pdf('sim-plain');const c=decode(`${OUT}/sim-plain.pdf`,0,150);
    check('zxing-cpp reads the plain code at 150 dpi',c===want,c);await page.evaluate(()=>{S.chk.qrframe=true;renderOut();});}
  else console.log('   (zxing-cpp is not installed for python3; the printed QR codes were not decoded)');
  /* iPad and iPhone printing: portrait sheets with each book page turned, at full size (a 1 in square prints 1 in) */
  await page.evaluate(()=>{S.meta.sheets='turn';renderOut();const r=document.createElement('div');r.id='ref1in';r.style.cssText='position:absolute;left:0;top:0;width:1in;height:1in;background:#f00;z-index:9';document.querySelector('#book').prepend(r);});
  r=await pdf('turned');
  const sq=cp.execSync(`python3 -c "
import pymupdf
d=pymupdf.open('${OUT}/turned.pdf');pm=d[0].get_pixmap(dpi=72);xs=[x for y in range(pm.height) for x in range(pm.width) if pm.pixel(x,y)[0]>240 and pm.pixel(x,y)[1]<20 and pm.pixel(x,y)[2]<20]
print(round((max(xs)-min(xs)+1)/72,2))"`).toString().trim();
  check('portrait sheets, page turned: 13 portrait pages, nothing shrunk (a 1 in square prints '+sq+' in), fronts turned one way and backs the other, the card sheets portrait',r.startsWith('13 [(8.5, 11.0)')&&sq==='1.0'&&await page.evaluate(()=>{const w=[...document.querySelectorAll('#book .pgw>.pg')];return w.length===10&&w.filter(p=>/rotate\(90deg\)/.test(p.style.transform)).length>=4&&w.some(p=>/rotate\(-90deg\)/.test(p.style.transform))&&document.querySelectorAll('#book > .pg.tsheet').length===3;}),r);
  await page.evaluate(()=>{document.getElementById('ref1in').remove();S.meta.sheets='land';renderOut();});

  check('the simulator: six choices, six targets, star, QR link, how-to on',await page.evaluate(()=>S.ch.every(o=>o.k)&&S.tg.every(o=>o.k)&&S.tok[0].k==='tk:star'&&!!S.meta.qr&&S.chk.pg_how===true&&S.meta.first==='Sam'));
  for(const v of views){await page.click(`#viewSeg button[data-view="${v}"]`);await sleep(200);await page.screenshot({path:`${OUT}/sim-${v}.png`,fullPage:true});}
  /* backs fit the page: no body overflows after the fit */
  await page.click('#viewSeg button[data-view="preview"]');await sleep(200);await page.evaluate(()=>fitAll());
  check('every back and how-to page fits its panel after the fit (print layout)',await page.evaluate(()=>[...document.querySelectorAll('#book .fit')].every(e=>e.scrollHeight<=e.clientHeight+2)),await page.evaluate(()=>[...document.querySelectorAll('#book .fit')].map(e=>e.style.fontSize||'16pt').join(' ')));
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
