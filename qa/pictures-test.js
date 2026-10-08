/* v21.62 My pictures (nbh-pictures.js): the cut on synthetic photos (a plain sheet with shading and grain, a soft shadow; a
   ring; a busy background kept whole; a picture with its own clear background; the white ground; a dark sheet); the flow in
   Form VS-1 (Take a photo from the picker, the camera input, the name, Save and use it here, the copy with its library id);
   the library shared with Forms SM-1 and TK-1 in the same browser (the picker's My pictures, one picture then several at
   once, one copy per picture); the library dialog (rename, save to a file, remove, open the file); a pasted picture; a file
   opened on a fresh browser adding its pictures to My pictures (absorb); the forms without the file beside them; the shell
   and the one-file build carrying the file; no errors. */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const OUT=__dirname+'/out/pictures';fs.mkdirSync(OUT,{recursive:true});
const F={vs:BASE+'/NBH-Workstation/VS-1_Visual-Supports_v2026-10.html',sm:BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html',tk:BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html',tv:BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html'};
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
/* the synthetic photos, drawn in the page: a sheet of paper with shading and grain, an item on it with a soft shadow */
const DRAW=`
  function paper(W,H,o){o=o||{};const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,o.p0||'#fbfaf6');gr.addColorStop(1,o.p1||'#dcd8cf');g.fillStyle=gr;g.fillRect(0,0,W,H);
    const id=g.getImageData(0,0,W,H),d=id.data;let s=12345;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
    for(let i=0;i<d.length;i+=4){const n=(rnd()-0.5)*(o.noise||8);d[i]+=n;d[i+1]+=n;d[i+2]+=n;}g.putImageData(id,0,0);return c;}
  function toy(c,o){o=o||{};const g=c.getContext('2d'),W=c.width,H=c.height,x=o.x||W*0.5,y=o.y||H*0.52,r=o.r||Math.min(W,H)*0.26;
    g.save();g.filter='blur(14px)';g.fillStyle='rgba(40,30,20,'+(o.shade||0.3)+')';g.beginPath();g.ellipse(x+r*0.25,y+r*0.35,r*1.05,r*0.85,0,0,Math.PI*2);g.fill();g.restore();
    g.save();if(o.soft)g.filter='blur(1.5px)';g.fillStyle=o.color||'#c8322a';g.beginPath();
    if(o.ring){g.arc(x,y,r,0,Math.PI*2);g.arc(x,y,r*0.42,0,Math.PI*2,true);}else g.roundRect(x-r,y-r*0.8,r*2,r*1.6,r*0.3);g.fill();
    g.fillStyle='rgba(255,255,255,0.35)';g.beginPath();g.ellipse(x-r*0.4,y-r*0.4,r*0.3,r*0.15,-0.6,0,Math.PI*2);g.fill();
    if(!o.ring){g.fillStyle='#2b2b2b';g.fillRect(x-r*0.3,y+r*0.1,r*0.6,r*0.25);}g.restore();return c;}
  function busy(W,H){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#8a7a66';g.fillRect(0,0,W,H);let s=777;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
    for(let i=0;i<400;i++){g.fillStyle='hsl('+Math.floor(rnd()*360)+',60%,'+(30+rnd()*50)+'%)';g.fillRect(rnd()*W,rnd()*H,20+rnd()*120,20+rnd()*120);}return c;}
  function alphaPic(W,H){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#2a7bd5';g.beginPath();g.arc(W*0.4,H*0.6,H*0.25,0,Math.PI*2);g.fill();return c;}
  async function measure(img){const c=await NBHPIC.loadCanvas(img,2000);const W=c.width,H=c.height,d=c.getContext('2d').getImageData(0,0,W,H).data;
    let minx=W,miny=H,maxx=-1,maxy=-1,op=0,semi=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=d[(y*W+x)*4+3];if(a>24){if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}if(a===255)op++;else if(a>0)semi++;}
    const px=(x,y)=>{const i=(y*W+x)*4;return [d[i],d[i+1],d[i+2],d[i+3]];};
    return {W,H,box:[minx,miny,maxx-minx+1,maxy-miny+1],opaque:op,semi,corner:px(2,2),centre:px(W>>1,H>>1),kind:img.slice(5,14)};}
  function toFile(c,name,type){return new Promise(res=>c.toBlob(b=>res(new File([b],name,{type:type||'image/png'})),type||'image/png',0.92));}
  function feed(sel,file){const dt=new DataTransfer();dt.items.add(file);const i=document.querySelector(sel);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));}`;
const near=(a,b,t)=>Math.abs(a-b)<=t;
(async()=>{const br=await chromium.launch();const log=[];
  const ctx=await br.newContext({viewport:{width:1300,height:900}});
  const vs=await ctx.newPage();wire(vs,log);await vs.goto(F.vs);await sleep(600);
  check('A1 VS-1 loads nbh-pictures.js beside it (window.NBHPIC, a store)',await vs.evaluate(async()=>!!window.NBHPIC&&typeof NBHPIC.process==='function'&&(await NBHPIC.ready())==='idb'),await vs.evaluate(()=>NBHPIC.mode()));
  /* ---- A. the cut ---- */
  const cut=await vs.evaluate(async DRAW=>{eval(DRAW);const out={};const run=async(name,c,opt)=>{const t0=performance.now();const r=await NBHPIC.process(c,opt||{});const m=await measure(r.img);m.ms=Math.round(performance.now()-t0);m.cut=r.cut;m.plain=r.plain;m.had=r.had;m.empty=r.empty;m.bytes=r.img.length;out[name]=m;};
    await run('red',toy(paper(1200,900,{}),{}));await run('soft',toy(paper(1200,900,{noise:14}),{soft:true,color:'#2f8f3a'}));
    await run('ring',toy(paper(1000,1000,{}),{ring:true,color:'#2a4fa0',shade:0.15}));await run('dark',toy(paper(1200,900,{p0:'#2a2a2e',p1:'#111114',noise:6}),{color:'#f2c230'}));
    await run('busy',toy(busy(1200,900),{}));await run('alpha',alphaPic(800,600));await run('white',toy(paper(1200,900,{}),{}),{ground:'w'});await run('nocut',toy(paper(1200,900,{}),{}),{remove:false});
    await run('small',toy(paper(1600,1200,{}),{r:90,x:400,y:300}));return out;},DRAW);
  const sq=m=>m.W===600&&m.H===600;
  const clearCorner=m=>m.corner[3]===0;
  const fills=m=>near(m.box[2],480,8)&&near(m.box[0],60,6);
  check('A2 a red item on a shaded, grainy sheet with a soft shadow: cut, a 600 px square PNG, the corners clear, the item 480 px wide and centred, its colour kept',cut.red.cut&&cut.red.plain&&sq(cut.red)&&clearCorner(cut.red)&&fills(cut.red)&&cut.red.kind==='image/png'&&near(cut.red.centre[0],200,8)&&near(cut.red.centre[1],50,8)&&cut.red.centre[3]===255,JSON.stringify(cut.red));
  check('A3 the edge is feathered (some part-clear pixels), not a halo: fewer than 4% of the opaque count',cut.red.semi>200&&cut.red.semi<cut.red.opaque*0.04,cut.red.semi+' of '+cut.red.opaque);
  check('A4 a green item with a soft edge on a grainier sheet: cut and centred too',cut.soft.cut&&sq(cut.soft)&&clearCorner(cut.soft)&&fills(cut.soft)&&near(cut.soft.centre[1],143,10),JSON.stringify(cut.soft.box)+' '+cut.soft.centre);
  check('A5 a ring: the paper seen through it is cut away too (the centre clear), the ring 480 px',cut.ring.cut&&cut.ring.centre[3]===0&&near(cut.ring.box[2],480,8)&&clearCorner(cut.ring),JSON.stringify(cut.ring.box)+' centre '+cut.ring.centre);
  check('A6 a yellow item on a dark sheet: cut the same way',cut.dark.cut&&clearCorner(cut.dark)&&fills(cut.dark)&&near(cut.dark.centre[0],242,8),JSON.stringify(cut.dark.box));
  check('A7 a busy background is not plain: the photo is kept whole, square, as a JPEG with white bars',!cut.busy.plain&&!cut.busy.cut&&sq(cut.busy)&&cut.busy.kind==='image/jpe'&&cut.busy.corner[0]===255&&cut.busy.corner[3]===255,JSON.stringify(cut.busy));
  check('A8 a picture with its own clear background (a subject copied out of Photos) is kept as it is, made square',cut.alpha.had&&cut.alpha.cut&&sq(cut.alpha)&&cut.alpha.kind==='image/png'&&clearCorner(cut.alpha)&&near(cut.alpha.box[2],480,6),JSON.stringify(cut.alpha.box));
  check('A9 the white ground: a JPEG, white corners, the item cut and centred',cut.white.cut&&cut.white.kind==='image/jpe'&&cut.white.corner[0]===255&&cut.white.corner[1]===255&&cut.white.centre[0]>180&&sq(cut.white),JSON.stringify(cut.white.corner));
  check('A10 the cut unticked: the whole photo, square, white bars',!cut.nocut.cut&&sq(cut.nocut)&&cut.nocut.corner[0]===255&&cut.nocut.kind==='image/jpe',JSON.stringify(cut.nocut.corner));
  check('A11 a small item in a large frame is trimmed and drawn up to the same 480 px',cut.small.cut&&fills(cut.small)&&clearCorner(cut.small),JSON.stringify(cut.small.box));
  check('A12 each cut under two seconds here',Object.values(cut).every(m=>m.ms<2000),Object.entries(cut).map(([k,m])=>k+':'+m.ms+'ms').join(' '));
  /* ---- B. the flow in VS-1: the picker's Take a photo ---- */
  await vs.click('#viewSeg button[data-view="board"]');await vs.click('#bTbl .pick[data-i="0"] button[data-pick]');await sleep(200);
  const pk=await vs.evaluate(()=>({open:document.querySelector('#pickDlg').open,cam:!!document.querySelector('#pdCam'),lib:!!document.querySelector('#pdLib'),opt:!!document.querySelector('#pdCat option[value="_mine"]')}));
  check('B1 the picker has Take a photo, My pictures… and a My pictures category',pk.open&&pk.cam&&pk.lib&&pk.opt,JSON.stringify(pk));
  await vs.click('#pdCam');await sleep(200);
  const ad=await vs.evaluate(()=>{const d=document.querySelector('#nbhPicDlg'),i=document.querySelector('#npCamIn');return {open:d&&d.open,cap:i&&i.getAttribute('capture'),acc:i&&i.getAttribute('accept'),save:document.querySelector('#npSave').textContent,hint:document.querySelector('#npHint').textContent.slice(0,40),work:document.querySelector('#npWork').hidden};});
  check('B2 Take a photo opens the Add dialog over the picker: the camera input opens the camera (capture=environment, image/*), the hint, the button says Save and use it here',ad.open&&ad.cap==='environment'&&ad.acc==='image/*'&&ad.save==='Save and use it here'&&/plain sheet of paper/.test(ad.hint)&&ad.work,JSON.stringify(ad));
  await vs.evaluate(async DRAW=>{eval(DRAW);feed('#npCamIn',await toFile(toy(paper(1200,900,{}),{}),'red-toy.jpg','image/jpeg'));},DRAW);
  await sleep(1500);
  const wk=await vs.evaluate(()=>({work:!document.querySelector('#npWork').hidden,src:document.querySelector('#npSrc').src.slice(0,15),out:document.querySelector('#npOut').src.slice(0,15),name:document.querySelector('#npName').value,note:document.querySelector('#npNote').textContent.slice(0,30),busy:document.querySelector('#npBusy').hidden}));
  check('B3 the photo is cut and shown beside the picture; the name is offered from the file name',wk.work&&wk.busy&&wk.src==='data:image/jpeg'&&wk.out==='data:image/png;'&&wk.name==='red-toy'&&/cut away/.test(wk.note),JSON.stringify(wk));
  await vs.screenshot({path:OUT+'/add-dialog.png'});
  await vs.fill('#npName','Red toy');await vs.click('#npSave');await sleep(900);
  const used=await vs.evaluate(async()=>{const p=S.photos[0];const c=p&&await NBHPIC.loadCanvas(p.img,2000);return {dlg:document.querySelector('#nbhPicDlg').open,pick:document.querySelector('#pickDlg').open,ph:S.board[0].ph,id:p&&p.id,lib:p&&p.lib,label:p&&p.label,png:p&&/^data:image\/png/.test(p.img),w:c&&c.width,n:NBHPIC.list().length,libLabel:NBHPIC.list()[0]&&NBHPIC.list()[0].label,img:!!document.querySelector('#boardOut img')};});
  check('B4 Save and use it here: both dialogs close, the picture is in My pictures (named), copied into the form’s photos at 400 px as a PNG with its library id, and on board cell 1',!used.dlg&&!used.pick&&used.ph===used.id&&/^m[a-z0-9]+$/.test(used.lib||'')&&used.label==='Red toy'&&used.png&&used.w===400&&used.n===1&&used.libLabel==='Red toy'&&used.img,JSON.stringify(used));
  const libId=used.lib;
  /* ---- C. shared with SM-1 in the same browser ---- */
  const sm=await ctx.newPage();wire(sm,log);await sm.goto(F.sm);await sleep(700);
  await sm.click('#viewSeg button[data-view="targets"]');await sm.click('#tTbl .pick[data-i="0"] button[data-pick]');await sleep(400);
  await sm.selectOption('#pdCat','_mine');await sleep(150);
  const smg=await sm.evaluate(()=>[...document.querySelectorAll('#pdGrid button[data-lib]')].map(b=>b.dataset.lib+'|'+b.textContent));
  check('C1 SM-1’s picker lists the picture under My pictures',smg.length===1&&smg[0].startsWith(libId+'|Red toy'),smg.join(','));
  await sm.click('#pdGrid button[data-lib]');await sleep(700);
  const smc=await sm.evaluate(async()=>{const o=S.tg[0];o.word='Sitting';renderAll();const c=o.img&&await NBHPIC.loadCanvas(o.img,2000);return {icon:o.icon,png:/^data:image\/png/.test(o.img||''),w:c&&c.width,open:document.querySelector('#pickDlg').open,pv:!!document.querySelector('#tTbl .pick[data-i="0"] .pv img'),sheet:document.querySelectorAll('#sheetOut img').length};});
  check('C2 chosen in SM-1: the cell holds a 256 px PNG copy, the picker closes, the table shows it',smc.icon===''&&smc.png&&smc.w===256&&!smc.open&&smc.pv,JSON.stringify(smc));
  /* ---- D. TK-1: one picture, then several at once; one copy per library picture ---- */
  const tk=await ctx.newPage();wire(tk,log);await tk.goto(F.tk);await sleep(900);
  await tk.click('#viewSeg button[data-view="choices"]');await tk.click('#chTbl .pick[data-i="4"] button[data-pick]');await sleep(300);
  await tk.selectOption('#pdCat','_mine');await sleep(150);await tk.click('#pdGrid button[data-lib]');await sleep(700);
  const tk1=await tk.evaluate(async()=>{const p=S.photos[0];const c=p&&await NBHPIC.loadCanvas(p.img,2000);return {n:S.photos.length,ph:S.ch[4].ph,id:p&&p.id,lib:p&&p.lib,w:c&&c.width,card:document.querySelectorAll('#book .pg[data-kind="cards-ch"] .card img').length===1};});
  check('D1 TK-1: the picture goes on choice 5 as a 600 px copy with its library id, printed on the card',tk1.n===1&&tk1.ph===tk1.id&&tk1.lib===libId&&tk1.w===600&&tk1.card,JSON.stringify(tk1));
  await tk.click('#chSix');await sleep(300);await tk.selectOption('#pdCat','_mine');await sleep(150);await tk.click('#pdGrid button[data-lib]');await sleep(100);
  const on=await tk.evaluate(()=>({on:document.querySelectorAll('#pdGrid button.on').length,n:document.querySelector('#pdGrid button.on')&&document.querySelector('#pdGrid button.on').dataset.n,count:document.querySelector('#pdCount').textContent.slice(0,20)}));
  await tk.selectOption('#pdCat','fun');await tk.fill('#pdQ','puzzle');await sleep(120);await tk.click('#pdGrid button[data-k="puzzle"]');await sleep(80);await tk.click('#pdGo');await sleep(800);
  const six=await tk.evaluate(()=>({n:S.photos.length,c0:S.ch[0].ph===S.photos[0].id,c1:S.ch[1].k==='puzzle',open:document.querySelector('#pickDlg').open}));
  check('D2 several at once: the picture tapped first and a pictogram second go on cards 1 and 2; still one copy of the picture in the book',on.on===1&&on.n==='1'&&six.n===1&&six.c0&&six.c1&&!six.open,JSON.stringify(on)+' '+JSON.stringify(six));
  /* ---- E. the library dialog: rename, save to a file, remove, open the file ---- */
  await tk.click('#chTbl .pick[data-i="2"] button[data-pick]');await sleep(200);await tk.click('#pdLib');await sleep(300);
  const lib=await tk.evaluate(()=>({open:document.querySelector('#nbhPicLib').open,cards:document.querySelectorAll('#nlGrid .np-card').length,count:document.querySelector('#nlCount').textContent,foot:document.querySelector('#nbhPicLib .np-foot').textContent.slice(0,30)}));
  check('E1 My pictures… opens the library over the picker, with the one picture',lib.open&&lib.cards===1&&lib.count==='1 picture'&&/Kept in this browser/.test(lib.foot),JSON.stringify(lib));
  await tk.screenshot({path:OUT+'/library.png'});
  await tk.evaluate(()=>{const i=document.querySelector('#nlGrid input[data-rename]');i.value='Red toy car';i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
  const rn=await tk.evaluate(id=>NBHPIC.get(id).label,libId);
  const rn2=await vs.evaluate(async id=>{await NBHPIC.all();return NBHPIC.get(id).label;},libId);
  check('E2 a rename sticks, and the other form sees it',rn==='Red toy car'&&rn2==='Red toy car',rn+' / '+rn2);
  await tk.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};});
  await tk.click('#nlExport');await sleep(600);
  const ex=await tk.evaluate(()=>{let o=null;try{o=JSON.parse(window.__saved||'');}catch(e){}return {ok:!!o&&o.nbh==='my-pictures'&&o.pictures.length===1&&o.pictures[0].label==='Red toy car'&&/^data:image\/png/.test(o.pictures[0].img),note:document.querySelector('#nlNote').textContent.slice(0,40)};});
  check('E3 Save the pictures to a file writes a My pictures file with the picture',ex.ok&&/Saved: a file with 1 picture/.test(ex.note),JSON.stringify(ex));
  await tk.evaluate(()=>{window.confirm=()=>true;});await tk.click('#nlGrid button[data-del]');await sleep(500);
  const rm=await tk.evaluate(()=>({n:NBHPIC.list().length,cards:document.querySelectorAll('#nlGrid .np-card').length,empty:!document.querySelector('#nlEmpty').hidden,still:S.photos.length}));
  const rmVs=await vs.evaluate(async()=>{await NBHPIC.all();return NBHPIC.list().length;});
  check('E4 Remove takes it out of the library everywhere; the book keeps its copy',rm.n===0&&rm.cards===0&&rm.empty&&rm.still===1&&rmVs===0,JSON.stringify(rm)+' vs '+rmVs);
  await tk.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([window.__saved],'My-pictures.json',{type:'application/json'}));const i=document.querySelector('#nlImportIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(700);
  const im=await tk.evaluate(id=>({n:NBHPIC.list().length,label:NBHPIC.get(id)&&NBHPIC.get(id).label,note:document.querySelector('#nlNote').textContent,cards:document.querySelectorAll('#nlGrid .np-card').length}),libId);
  check('E5 Open a pictures file brings it back, same id and name',im.n===1&&im.label==='Red toy car'&&/1 picture added/.test(im.note)&&im.cards===1,JSON.stringify(im));
  await tk.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['{"x":1}'],'other.json',{type:'application/json'}));const i=document.querySelector('#nlImportIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
  check('E6 another file is refused with a note',await tk.evaluate(()=>/not a My pictures file/.test(document.querySelector('#nlNote').textContent)&&NBHPIC.list().length===1));
  await tk.click('#nlClose');await sleep(150);await tk.click('#pdClose');
  /* ---- F. a pasted picture, from the Pictures page of VS-1 ---- */
  await vs.click('#viewSeg button[data-view="library"]');await sleep(150);
  const pg=await vs.evaluate(()=>({cam:!document.querySelector('#phCam').hidden,mine:!document.querySelector('#phMine').hidden,hint:/My pictures/.test(document.querySelector('.only-library .hint,section .hint').textContent)}));
  check('F1 VS-1’s Pictures page has Take a photo and My pictures…',pg.cam&&pg.mine,JSON.stringify(pg));
  await vs.click('#phCam');await sleep(200);
  await vs.evaluate(async DRAW=>{eval(DRAW);const f=await toFile(alphaPic(700,500),'subject.png');const dt=new DataTransfer();dt.items.add(f);const ev=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(ev,'clipboardData',{value:dt});document.querySelector('#nbhPicDlg').dispatchEvent(ev);},DRAW);
  await sleep(900);
  const pz=await vs.evaluate(()=>({work:!document.querySelector('#npWork').hidden,note:document.querySelector('#npNote').textContent.slice(0,50),cut:document.querySelector('#npCut').disabled,save:document.querySelector('#npSave').textContent}));
  check('F2 a picture pasted into the dialog (one with a clear background) is taken: kept as it is, the cut tick off',pz.work&&/clear background already/.test(pz.note)&&pz.cut&&pz.save==='Save to My pictures',JSON.stringify(pz));
  await vs.fill('#npName','Blue ball');await vs.click('#npSave');await sleep(800);
  const pz2=await vs.evaluate(()=>({n:NBHPIC.list().length,labels:NBHPIC.list().map(p=>p.label).join(','),photos:S.photos.length,lib:S.photos[1]&&S.photos[1].lib}));
  check('F3 saved from the Pictures page: in My pictures and in this form’s photos',pz2.n===2&&/Blue ball/.test(pz2.labels)&&pz2.photos===2&&/^m/.test(pz2.lib||''),JSON.stringify(pz2));
  /* the picker's My pictures also refreshed in SM-1, open all along */
  await sm.click('#tTbl .pick[data-i="1"] button[data-pick]');await sleep(500);await sm.selectOption('#pdCat','_mine');await sleep(150);
  check('G1 SM-1’s picker, opened again, lists both pictures',await sm.$$eval('#pdGrid button[data-lib]',b=>b.length)===2);await sm.click('#pdClose');
  /* ---- H. a file opened on a fresh browser: its pictures join My pictures there (absorb) ---- */
  await vs.evaluate(()=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{window.__saved=t;});return o(b);};document.querySelector('#saveBtn').click();});await sleep(400);
  const file=await vs.evaluate(()=>window.__saved);
  const ctx2=await br.newContext({viewport:{width:1300,height:900}});const v2=await ctx2.newPage();wire(v2,log);await v2.goto(F.vs);await sleep(600);
  const fresh=await v2.evaluate(async()=>(await NBHPIC.all()).length);
  await v2.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'vs.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},file);await sleep(1500);
  const ab=await v2.evaluate(async id=>{const a=await NBHPIC.all();return {n:a.length,has:!!NBHPIC.get(id),label:NBHPIC.get(id)&&NBHPIC.get(id).label,lib:S.photos[0]&&S.photos[0].lib,board:S.board[0].ph};},libId);
  check('H1 a fresh browser starts with no pictures; a VS-1 file opened there adds the two its photos came from, named as the form\u2019s copies are',fresh===0&&ab.n===2&&ab.has&&ab.label==='Red toy'&&ab.lib===libId&&ab.board,JSON.stringify(ab));
  await ctx2.close();
  /* ---- I. the forms without the file beside them ---- */
  const ctx3=await br.newContext({viewport:{width:1300,height:900}});await ctx3.route('**/nbh-pictures.js',r=>r.abort());
  const v3=await ctx3.newPage();const log3=[];wire(v3,log3);await v3.goto(F.vs);await sleep(600);
  await v3.click('#bTbl .pick[data-i="0"] button[data-pick]');await sleep(200);
  const no=await v3.evaluate(()=>({mine:!!window.NBHPIC,cam:!!document.querySelector('#pdCam'),opt:!!document.querySelector('#pdCat option[value="_mine"]'),grid:document.querySelectorAll('#pdGrid button[data-k]').length>50,phCam:document.querySelector('#phCam').hidden}));
  check('I1 without nbh-pictures.js the picker is as before (no Take a photo, no My pictures), the Pictures page hides its buttons, no errors',!no.mine&&!no.cam&&!no.opt&&no.grid&&no.phCam&&!log3.filter(l=>!/nbh-pictures\.js|Failed to load resource/.test(l.text)).length,JSON.stringify(no)+' '+JSON.stringify(log3));
  await ctx3.close();
  /* ---- J. TV-1's picture dialog ---- */
  const tv=await ctx.newPage();wire(tv,log);await tv.goto(F.tv);await sleep(900);
  const tvd=await tv.evaluate(()=>({cam:!!document.querySelector('#picCam')&&!document.querySelector('#picCam').hidden,mine:!!document.querySelector('#picMine')&&!document.querySelector('#picMine').hidden}));
  check('J1 TV-1’s picture dialog offers Take a photo and From My pictures',tvd.cam&&tvd.mine,JSON.stringify(tvd));
  /* ---- K. the shell and the one-file build carry the file ---- */
  const idx=fs.readFileSync(__dirname+'/../NBH-Workstation/index.html','utf8'),bs=fs.readFileSync(__dirname+'/../tools/build-single.py','utf8');
  check('K1 the shell puts nbh-pictures.js into a form in the one-file edition; the build packs it; Diagnostics names it',/PICTAG2/.test(idx)&&/nbh-embed-pictures/.test(idx)&&/nbh-embed-pictures/.test(bs)&&/\['My pictures'/.test(idx));
  const one=__dirname+'/../deliver/RPS-Workstation.html';
  if(fs.existsSync(one)){const h=fs.readFileSync(one,'utf8');check('K2 the one-file RPS edition holds the nbh-embed-pictures block',/id="nbh-embed-pictures"/.test(h));}
  check('K3 the file beside the forms is tools/blocks/nbh-pictures.js byte for byte',fs.readFileSync(__dirname+'/../NBH-Workstation/nbh-pictures.js').equals(fs.readFileSync(__dirname+'/../tools/blocks/nbh-pictures.js')));
  check('Z no page errors',!log.length,JSON.stringify(log).slice(0,600));
  await br.close();console.log('RESULT: '+(fails?fails+' FAILED':'ALL PASS'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
