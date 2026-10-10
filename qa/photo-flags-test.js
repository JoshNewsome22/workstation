/* v21.68 the student's photo and Form DM-1's flags (NBH-Workstation/index.html: state.photo, setPhoto, paintPhoto, packet();
   DM-1 __nbhFactsOut flags; IA-1's rp.photo from the packet):
   1. with no photo the circle shows a camera, then the student's initials once a name is typed;
   2. a chosen picture is brought to 240 px square JPEG, shown on the bar; folded, on the summary line; with a form open, on the
      crumb; closed, gone from the crumb;
   3. it travels in the packet file and the case file; a case opened brings it back; Close case takes it off; a forged value
      is refused;
   4. Form IA-1 takes it for the respondent pages while it holds none; the dialog's Take it off clears it;
   5. Form DM-1's safety precautions, the photo permission No and an outdated crisis plan show on the case line and the folded
      line; setting a photo then says so;
   6. no page errors.
   usage: node qa/photo-flags-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const OUT=__dirname+'/out/photo-flags/';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const log=[];wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=m=>{window.__alert=String(m);};try{wsUI.confirm=async()=>true;}catch(e){}});
  const settle=async id=>{const t=Date.now();while(Date.now()-t<15000&&!(await page.evaluate(id=>!!state.status[id],id)))await sleep(150);};
  /* 1. the circle */
  const c0=await page.evaluate(()=>({cam:!!document.querySelector('#pPhotoIni svg'),img:document.querySelector('#pPhotoImg').hidden,photo:state.photo}));
  await page.fill('#pClient','Rivera, Mateo');await page.evaluate(()=>document.querySelector('#pClient').dispatchEvent(new Event('input',{bubbles:true})));
  const c1=await page.evaluate(()=>document.querySelector('#pPhotoIni').textContent);
  await page.fill('#pClient','Mateo Rivera');await page.evaluate(()=>document.querySelector('#pClient').dispatchEvent(new Event('input',{bubbles:true})));
  const c2=await page.evaluate(()=>document.querySelector('#pPhotoIni').textContent);
  ok('1 with no photo the circle shows a camera, then the student’s initials once a name is typed (Last, First and First Last alike)',c0.cam&&c0.img&&c0.photo===''&&c1==='MR'&&c2==='MR',{c0,c1,c2});
  /* 2. a picture: a 900 x 600 drawing, brought to 240 square */
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=900;c.height=600;const g=c.getContext('2d');g.fillStyle='#3a7bd5';g.fillRect(0,0,900,600);g.fillStyle='#f6c343';g.beginPath();g.arc(450,300,200,0,Math.PI*2);g.fill();return c.toDataURL('image/png');});
  await page.setInputFiles('#pPhotoFile',{name:'student.png',mimeType:'image/png',buffer:Buffer.from(png.split(',')[1],'base64')});await sleep(600);await page.waitForSelector('#phUse',{timeout:5000});await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(400);
  const p1=await page.evaluate(async()=>{const v=state.photo;const im=new Image();im.src=v;await im.decode();return {kind:v.slice(0,23),len:v.length,w:im.naturalWidth,h:im.naturalHeight,shown:!document.querySelector('#pPhotoImg').hidden&&document.querySelector('#pPhotoImg').src===v,ini:document.querySelector('#pPhotoIni').hidden,inPacket:packet().photo===v};});
  ok('2a the picture is brought to 240 px square JPEG, about 15 KB, shown on the bar in place of the initials, and is in the packet',p1.kind==='data:image/jpeg;base64,'&&p1.len<80000&&p1.w===240&&p1.h===240&&p1.shown&&p1.ini&&p1.inPacket,p1);
  await page.evaluate(()=>foldBar(true));await sleep(200);
  const p2=await page.evaluate(()=>({folded:document.body.classList.contains('bar-folded'),sum:!document.querySelector('#sumPhoto').hidden&&getComputedStyle(document.querySelector('#sumPhoto')).display!=='none',crumb:document.querySelector('#crumbPhoto').hidden}));
  await page.evaluate(()=>foldBar(false));
  ok('2b folded, the summary line shows the photo; with no form open the crumb does not',p2.folded&&p2.sum&&p2.crumb,p2);
  await page.evaluate(()=>openForm('DM-1',true));await settle('DM-1');await sleep(300);
  const p3=await page.evaluate(()=>({crumb:!document.querySelector('#crumbPhoto').hidden&&document.querySelector('#crumbPhoto').src===state.photo,hasForm:document.body.classList.contains('has-form')}));
  await page.evaluate(()=>document.querySelector('#closeForm').click());await sleep(500);
  const p4=await page.evaluate(()=>({crumb:document.querySelector('#crumbPhoto').hidden,hasForm:document.body.classList.contains('has-form'),photo:!!state.photo}));
  ok('2c with a form open the crumb shows the photo; closed, the crumb drops it and the photo stays on the case',p3.crumb&&p3.hasForm&&p4.crumb&&!p4.hasForm&&p4.photo,{p3,p4});
  await page.screenshot({path:OUT+'bar.png'});
  /* 3. the files */
  const grab=async fn=>page.evaluate(async f=>{let got=null;const mk=URL.createObjectURL;URL.createObjectURL=b=>{got=b;return 'blob:x';};const ck=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};try{await new Function('return ('+f+')()')();await new Promise(r=>setTimeout(r,200));}finally{URL.createObjectURL=mk;HTMLAnchorElement.prototype.click=ck;}return got?await got.text():'';},fn.toString());
  const pk=JSON.parse(await grab(()=>document.querySelector('#savePacket').click()));
  ok('3a the packet file carries the photo',pk.form==='PACKET'&&pk.packet.photo&&/^data:image\/jpeg;base64,/.test(pk.packet.photo)&&pk.packet.client==='Mateo Rivera',Object.keys(pk.packet));
  const photo=pk.packet.photo;
  const cf={form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:{client:'Mateo Rivera',sid:'4471823',grade:'3',site:'Royal Palm School',bcba:'J. Newsome',photo},forms:{},cur:null};
  await page.evaluate(()=>{setPhoto('',true);});
  await page.evaluate(t=>openCaseText(t,null),JSON.stringify(cf));await sleep(600);
  const p5=await page.evaluate(()=>({photo:state.photo.length,shown:!document.querySelector('#pPhotoImg').hidden,client:document.querySelector('#pClient').value}));
  ok('3b a case file opened brings the photo back with the details',p5.photo===photo.length&&p5.shown&&p5.client==='Mateo Rivera',p5);
  const forged=Object.assign({},cf,{packet:Object.assign({},cf.packet,{photo:'javascript:alert(1)'})});
  await page.evaluate(t=>openCaseText(t,null),JSON.stringify(forged));await sleep(600);
  const p6=await page.evaluate(()=>({photo:state.photo,cam:!!document.querySelector('#pPhotoIni svg')||document.querySelector('#pPhotoIni').textContent==='MR',img:document.querySelector('#pPhotoImg').hidden}));
  ok('3c a forged photo in a case file is refused: no photo, the initials back',p6.photo===''&&p6.cam&&p6.img,p6);
  await page.evaluate(t=>openCaseText(t,null),JSON.stringify(cf));await sleep(600);
  await page.evaluate(()=>document.querySelector('#closeCase').click());await sleep(800);
  const p7=await page.evaluate(()=>({photo:state.photo,client:document.querySelector('#pClient').value,img:document.querySelector('#pPhotoImg').hidden}));
  ok('3d Close case takes the photo off with the details',p7.photo===''&&p7.client===''&&p7.img,p7);
  /* 4. Form IA-1's respondent pages, and the dialog */
  await page.fill('#pClient','Mateo Rivera');await page.evaluate(()=>document.querySelector('#pClient').dispatchEvent(new Event('input',{bubbles:true})));
  await page.setInputFiles('#pPhotoFile',{name:'student.png',mimeType:'image/png',buffer:Buffer.from(png.split(',')[1],'base64')});await sleep(600);await page.waitForSelector('#phUse',{timeout:5000});await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(400);
  await page.evaluate(()=>openForm('IA-1',true));await settle('IA-1');await sleep(1500);
  const ia=await page.evaluate(()=>{const w=state.frames['IA-1'].contentWindow;const v=w.document.querySelector('[name="rp.photo"]').value;return {same:v===state.photo,len:v.length};});
  ok('4a Form IA-1 takes the photo for its respondent pages while it holds none of its own',ia.same&&ia.len>1000,ia);
  await page.evaluate(()=>{const w=state.frames['IA-1'].contentWindow;const e=w.document.querySelector('[name="rp.photo"]');e.value='data:image/jpeg;base64,/9j/own';});
  await page.evaluate(()=>pushPacketTo(state.frames['IA-1']));await sleep(400);
  const ia2=await page.evaluate(()=>state.frames['IA-1'].contentWindow.document.querySelector('[name="rp.photo"]').value);
  ok('4b a photo of the form’s own is left alone',ia2==='data:image/jpeg;base64,/9j/own',ia2);
  await page.evaluate(()=>document.querySelector('#pPhotoBtn').click());await sleep(300);
  const d1=await page.evaluate(()=>({open:document.querySelector('#dlg').open,title:document.querySelector('#dlgTitle').textContent,big:!!document.querySelector('#dlgBody .ph-big'),drop:!!document.querySelector('#phDrop')}));
  await page.evaluate(()=>document.querySelector('#phDrop').click());await sleep(300);
  const d2=await page.evaluate(()=>({photo:state.photo,open:document.querySelector('#dlg').open,ini:document.querySelector('#pPhotoIni').textContent,toast:([...document.querySelectorAll('#wsToasts .ws-toast')].pop()||{}).textContent||''}));
  ok('4c tapping the photo opens its dialog; Take it off clears it and the initials return',d1.open&&d1.title==='The student’s photo'&&d1.big&&d1.drop&&d2.photo===''&&!d2.open&&d2.ini==='MR'&&/off the case/.test(d2.toast),{d1,d2});
  /* 5. Form DM-1's flags */
  await page.evaluate(()=>openForm('DM-1',true));await settle('DM-1');await sleep(300);
  await page.evaluate(()=>{const w=state.frames['DM-1'].contentWindow,d=w.document;const set=(n,v)=>{const e=d.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    ['sf.elope','sf.water','sf.pica'].forEach(n=>{const e=d.querySelector('[name="'+n+'"]');e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});set('s.photo','No');set('p.crisis','Yes, outdated');set('pf.strengths','enjoys music');});
  await page.evaluate(()=>ask(state.frames['DM-1'],'status'));let t=Date.now();let fl=null;
  while(Date.now()-t<12000){fl=await page.evaluate(()=>state.facts&&state.facts.profile&&state.facts.profile.flags);if(fl&&fl.safety&&fl.safety.length===3)break;await sleep(300);}
  await sleep(300);
  const f1=await page.evaluate(()=>({flags:state.facts.profile.flags,row:document.querySelector('#factsTxt').textContent,hidden:document.querySelector('#factsRow').hidden,flag:!!document.querySelector('#factsTxt .flag')}));
  ok('5a the case line shows Form DM-1’s safety precautions, the missing photo permission and the outdated crisis plan',f1.flags&&f1.flags.safety.join()==='Elopement,Pica,Water'&&f1.flags.photo==='No'&&f1.flags.crisis==='Yes, outdated'&&/Safety: Elopement, Pica, Water/.test(f1.row)&&/No photo\/media permission/.test(f1.row)&&/Crisis plan outdated/.test(f1.row)&&/\(DM-1\)/.test(f1.row)&&!f1.hidden&&f1.flag,f1);
  await page.evaluate(()=>foldBar(true));await sleep(200);
  const f2=await page.evaluate(()=>document.querySelector('#sumCase').textContent);await page.evaluate(()=>foldBar(false));
  ok('5b the folded line says so too',/safety: elopement, pica, water/.test(f2)&&/no photo permission/.test(f2)&&/crisis plan outdated/.test(f2),f2);
  await page.setInputFiles('#pPhotoFile',{name:'student.png',mimeType:'image/png',buffer:Buffer.from(png.split(',')[1],'base64')});await sleep(700);await page.waitForSelector('#phUse',{timeout:5000});await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(400);
  const f3=await page.evaluate(()=>({photo:!!state.photo,toast:([...document.querySelectorAll('#wsToasts .ws-toast')].pop()||{}).textContent||''}));
  ok('5c setting a photo while Form DM-1 says the permission is No says so, and keeps the photo',f3.photo&&/photo\/media permission on file is No/.test(f3.toast),f3);
  await page.evaluate(()=>{const w=state.frames['DM-1'].contentWindow,d=w.document;['sf.elope','sf.water','sf.pica'].forEach(n=>{const e=d.querySelector('[name="'+n+'"]');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}));});const e=d.querySelector('[name="s.photo"]');e.value='Yes';e.dispatchEvent(new Event('change',{bubbles:true}));const c=d.querySelector('[name="p.crisis"]');c.value='Yes, current';c.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.evaluate(()=>ask(state.frames['DM-1'],'status'));t=Date.now();let f4=null;
  while(Date.now()-t<12000){f4=await page.evaluate(()=>({row:document.querySelector('#factsTxt').textContent,fl:state.facts&&state.facts.profile&&state.facts.profile.flags}));if(f4.fl&&!f4.fl.safety.length)break;await sleep(300);}
  ok('5d the flags leave the line when they are cleared on the form (the profile stays)',f4.fl&&!f4.fl.safety.length&&!/Safety:|photo\/media|Crisis plan/.test(f4.row)&&/Profile/.test(f4.row),f4);
  await page.screenshot({path:OUT+'flags.png'});
  const bad=log.filter(l=>!/favicon|net::ERR/.test(l.text));
  ok('6 no page errors',!bad.length,bad.slice(0,5));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2);});
