/* v21.71 placing the student's photo, and the photo on Form DD-1's sheet (NBH-Workstation/index.html: cropPhoto, placePhoto,
   pushPhoto; DD-1: the packet listener and S.meta.photoCase):
   1. a tall picture opens Place the photo, starting a little below its top; dragging and the slider move and enlarge it,
      and Use this photo keeps the square under the circle as 240 px; Cancel keeps what was there;
   2. Adjust position, from the photo dialog, opens the same picture again (the whole of it, this session);
   3. Form DD-1, holding no photo of its own, takes the case's photo onto its sheet (round, printed above the table), follows a
      new one, drops it when the case's is taken off, and keeps a photo chosen on the form itself;
   4. no page errors.  usage: node qa/photo-crop-test.js */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,500):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1300,height:900}});const log=[];wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html',{waitUntil:'load'});await sleep(800);
  await page.evaluate(()=>{window.confirm=()=>true;try{wsUI.confirm=async()=>true;}catch(e){}});
  await page.fill('#pClient','Mateo Rivera');await page.evaluate(()=>document.querySelector('#pClient').dispatchEvent(new Event('input',{bubbles:true})));
  /* a 600 x 900 picture: red band at the top (the head), blue below */
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=900;const g=c.getContext('2d');g.fillStyle='#2050c0';g.fillRect(0,0,600,900);g.fillStyle='#d02020';g.fillRect(0,0,600,180);return c.toDataURL('image/png');});
  const file={name:'student.png',mimeType:'image/png',buffer:Buffer.from(png.split(',')[1],'base64')};
  await page.setInputFiles('#pPhotoFile',file);await page.waitForSelector('#phUse',{timeout:5000});await sleep(200);
  const st=await page.evaluate(()=>{const im=document.querySelector('#phImg');const m=/translate\((-?[\d.]+)px, ?(-?[\d.]+)px\)/.exec(im.style.transform);return {title:document.querySelector('#dlgTitle').textContent,w:parseFloat(im.style.width),h:parseFloat(im.style.height),x:+m[1],y:+m[2]};});
  ok('1a a tall picture opens Place the photo, filling the square, starting a little below its top',/Place the photo/.test(st.title)&&Math.round(st.w)===260&&Math.round(st.h)===390&&st.x===0&&st.y<0&&st.y>-40,st);
  const top=async()=>page.evaluate(async()=>{const im=new Image();im.src=state.photo;await im.decode();const c=document.createElement('canvas');c.width=240;c.height=240;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(120,4,1,1).data;return {r:d[0],b:d[2],w:im.naturalWidth};});
  /* drag the picture down to its top edge */
  const vb=await page.locator('#phView').boundingBox();
  await page.mouse.move(vb.x+130,vb.y+130);await page.mouse.down();await page.mouse.move(vb.x+130,vb.y+230,{steps:5});await page.mouse.up();await sleep(100);
  const y2=await page.evaluate(()=>+/translate\(-?[\d.]+px, ?(-?[\d.]+)px\)/.exec(document.querySelector('#phImg').style.transform)[1]);
  await page.evaluate(()=>{const z=document.querySelector('#phZoom');z.value='2';z.dispatchEvent(new Event('input',{bubbles:true}));});
  const zw=await page.evaluate(()=>parseFloat(document.querySelector('#phImg').style.width));
  await page.evaluate(()=>{const z=document.querySelector('#phZoom');z.value='1';z.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(400);
  const t1=await top();
  ok('1b dragging moves it (stopping at the picture’s edge), the slider enlarges it, and Use this photo keeps the square: the top band shows at the top',y2===0&&Math.round(zw)===520&&t1.w===240&&t1.r>150&&t1.b<100,{y2,zw,t1});
  const before=await page.evaluate(()=>state.photo);
  await page.setInputFiles('#pPhotoFile',file);await page.waitForSelector('#phCancel',{timeout:5000});await page.evaluate(()=>document.querySelector('#phCancel').click());await sleep(300);
  ok('1c Cancel keeps the photo there was',await page.evaluate(b=>state.photo===b,before));
  /* 2 adjust */
  await page.evaluate(()=>document.querySelector('#pPhotoBtn').click());await sleep(200);
  await page.evaluate(()=>document.querySelector('#phAdjust').click());await page.waitForSelector('#phUse',{timeout:5000});await sleep(200);
  const ad=await page.evaluate(()=>({w:parseFloat(document.querySelector('#phImg').style.width),h:parseFloat(document.querySelector('#phImg').style.height),src:!!state.photoSrc}));
  await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(300);
  ok('2 Adjust position opens the whole picture again',ad.src&&Math.round(ad.w)===260&&Math.round(ad.h)===390,ad);
  /* 3 DD-1 */
  await page.evaluate(()=>openForm('DD-1'));const t0=Date.now();while(Date.now()-t0<15000&&!(await page.evaluate(()=>!!state.status['DD-1'])))await sleep(200);await sleep(800);
  const fr=page.frames().find(f=>/Daily_Behavior/.test(f.url()));
  const cur=await page.evaluate(()=>state.photo);const d1=await fr.evaluate(c=>({same:S.meta.photo===c,cas:S.meta.photoCase,img:!!document.querySelector('#sheetTop .idwrap img'),round:getComputedStyle(document.querySelector('#sheetTop .idwrap img')).borderRadius}),cur);
  ok('3a Form DD-1 takes the case’s photo onto its sheet, round, above the table',d1.same&&d1.cas&&d1.img&&d1.round==='50%',d1);
  await page.setInputFiles('#pPhotoFile',file);await page.waitForSelector('#phUse');await page.evaluate(()=>{const z=document.querySelector('#phZoom');z.value='1.5';z.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#phUse').click();});await sleep(700);
  const cur2=await page.evaluate(()=>state.photo);const d2=await fr.evaluate(c=>S.meta.photo===c&&c!=='',cur2);
  await page.evaluate(()=>{document.querySelector('#pPhotoBtn').click();});await sleep(200);await page.evaluate(()=>document.querySelector('#phDrop').click());await sleep(700);
  const d3=await fr.evaluate(()=>({p:S.meta.photo,img:!!document.querySelector('#sheetTop .idwrap img')}));
  ok('3b it follows a new photo and drops it when the case’s is taken off',d2&&d3.p===''&&!d3.img,{d2,d3});
  await fr.evaluate(()=>{S.meta.photo='data:image/png;base64,iVBORw0KGgo=';S.meta.photoCase=false;});
  await page.setInputFiles('#pPhotoFile',file);await page.waitForSelector('#phUse');await page.evaluate(()=>document.querySelector('#phUse').click());await sleep(700);
  ok('3c a photo chosen on DD-1 itself is kept',await fr.evaluate(()=>S.meta.photo==='data:image/png;base64,iVBORw0KGgo='));
  const errs=log.filter(l=>l.type==='pageerror').map(l=>l.text);ok('4 no page errors',!errs.length,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.log('CRASH',e.message);process.exit(2);});
