/* IA-1 respondent dialog: the student photo in the page file, the public address for links (v21.41b) */
const {chromium,BASE,wire,sleep}=require('./lib.js');const fs=require('fs');const path=require('path');
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(x||'').slice(0,300)));if(!c)fails++;};
const grab=async(page,fn)=>{await page.evaluate(()=>{window.__dl=[];URL.createObjectURL=b=>{window.__blob=b;return 'blob:x';};HTMLAnchorElement.prototype.click=function(){window.__dl.push(this.download);};});await page.evaluate(fn);await sleep(400);
 return await page.evaluate(async()=>({r:window.__dl[0],text:window.__blob?await window.__blob.text():''}));};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1100,height:800}});const page=await ctx.newPage();wire(page,log);
 await page.goto(URL);await sleep(700);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 await page.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('m.beh','Elopement');set('m.def','Leaving the assigned area without permission.');set('m.email','bcba@example.org');set('rp.w.fast',Array.from({length:16},(_,i)=>(i+1)+'. Does the problem behavior occur when (s)he is asked to work? (item '+(i+1)+')').join('\n'));});
 /* a 300x200 PNG through the file input */
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=200;const g=c.getContext('2d');g.fillStyle='#4a7';g.fillRect(0,0,300,200);g.fillStyle='#fff';g.fillRect(100,50,100,100);return c.toDataURL('image/png');});
 const tmp=path.join(__dirname,'out','photo-test.png');fs.mkdirSync(path.dirname(tmp),{recursive:true});fs.writeFileSync(tmp,Buffer.from(png.split(',')[1],'base64'));
 await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
 await (await page.$('#rpPhoto')).setInputFiles(tmp);await sleep(600);
 const ph=await page.evaluate(()=>({v:document.querySelector('[name="rp.photo"]').value,thumb:!document.querySelector('#rpPhotoThumb').hidden,note:document.querySelector('#rpNote').textContent}));
 ok('the photo is shrunk to a small JPEG, kept in rp.photo, shown as a thumbnail, and the note says the link leaves it out',/^data:image\/jpeg;base64,/.test(ph.v)&&ph.v.length<40000&&ph.thumb&&/photo is in the page file/.test(ph.note),{len:ph.v.length,thumb:ph.thumb,note:ph.note});
 const pay=await page.evaluate(()=>({file:__rp.payload().photo?__rp.payload().photo.slice(0,15):'',link:__rp.link()}));
 ok('the file payload carries the photo; the link does not',pay.file==='data:image/jpeg'&&!/image/.test(pay.link)&&pay.link.length<6000,{file:pay.file,len:pay.link.length});
 const f1=await grab(page,()=>__rp.file());
 const rp=await ctx.newPage();await rp.setContent(f1.text,{waitUntil:'load'});await sleep(300);
 const shown=await rp.evaluate(()=>{const i=document.querySelector('img.photo');return i?{w:i.naturalWidth,h:i.naturalHeight,ok:/^data:image\/jpeg/.test(i.src)}:null;});
 ok('the page shows the photo at the top, 224px on the long side',shown&&shown.ok&&shown.w===224&&shown.h===149,shown);
 /* (s)he in the pasted wording becomes the chosen pronoun on the page */
 await page.evaluate(()=>{rpPron.value='she';rpPron.dispatchEvent(new Event('change'));});
 const f2=await grab(page,()=>__rp.file());
 ok('(s)he in the wording reads as the chosen pronoun on the page',/when she is asked to work/.test(f2.text)&&!/\(s\)he/.test(f2.text.replace(/"sig":"[^"]*"/,'')),f2.text.match(/.{0,40}asked to work.{0,10}/)[0]);
 /* the public address for links */
 await page.evaluate(()=>{rpBase.value='https://example.org/respond/';rpBase.dispatchEvent(new Event('input'));});
 const link=await page.evaluate(()=>__rp.link());
 ok('with a public address the link points there, respond.html added',/^https:\/\/example\.org\/respond\/respond\.html#[pz]=/.test(link),link.slice(0,70));
 const dev=await page.evaluate(()=>JSON.parse(localStorage.getItem('nbh.ia1.respondent')||'{}'));
 ok('the address is remembered on the device; the photo is not',dev['rp.base']==='https://example.org/respond/'&&!dev['rp.photo'],Object.keys(dev));
 /* the photo saves with the file and Clear all removes it */
 const data=(await grab(page,()=>{document.querySelector('#rpDlg').close();document.querySelector('#saveBtn').click();})).text;
 ok('the saved file carries the photo and the address',/"rp\.photo": ?"data:image\/jpeg/.test(data)&&/example\.org\/respond/.test(data));
 await page.evaluate(()=>document.querySelector('#clearBtn').click());await sleep(300);
 const after=await page.evaluate(()=>({photo:document.querySelector('[name="rp.photo"]').value,base:document.querySelector('[name="rp.base"]').value,w:document.querySelector('[name="rp.w.fast"]').value.length>0}));
 ok('Clear all removes the photo and keeps the address and the wording',after.photo===''&&after.base==='https://example.org/respond/'&&after.w,after);
 ok('no console or page error',log.length===0,log);
 console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
