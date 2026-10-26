/* v24.53 the safety copy gives pictures back as they were (the BCBA, 10/26: after an update, Form RS-1's signatures,
   drawn and typed earlier that day, were gone while the days and contacts came back on the iPad). A simulated RBT's
   August is signed in RS-1 inside the workstation (a drawn supervisor's signature, the RBT's typed and adopted), the
   Autosave copy is written, and then:
     A  each stored picture is made to come back without its type, as a stored file can on Safari (a copy written by an
        earlier version: no types kept beside it): Restore brings both signatures back, as PNG pictures;
     B  the same with the types kept beside the pictures (a copy written by this version);
     C  on an iPad (its user agent) the copy keeps the pictures as text, not as stored files, and Restore brings both back;
     D  a picture that cannot be read at all is still left out and named in the restore's note, as before.
   Simulated names only. usage: node qa/pics153-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const U=BASE+'/NBH-Workstation/index.html';
const frameRS=p=>p.frames().find(f=>/RS-1_/.test(f.url()));
/* the workstation with RS-1 open, August signed: the supervisor's drawn on the pad, the RBT's typed and adopted */
async function signed(b,opt){const ctx=await b.newContext(Object.assign({viewport:{width:1366,height:1024}},opt||{}));const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.goto(U);await sleep(1500);await p.evaluate(()=>openForm('RS-1'));await p.waitForFunction(()=>!!state.status['RS-1'],null,{timeout:40000});await sleep(1500);
  const fr=frameRS(p);
  await fr.evaluate(()=>{const k=yearKeys(setupYear())[0];S.setup.rbt_name='Lee Park (simulated)';const m=month(k);
    m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];
    m.contacts=[{id:'c1',date:k+'-04',start:'09:00',end:'10:00',sup:S.sups[0].id,format:'indiv',group:'',mode:'person',obs:'yes',client:'',acts:[],sact:[],bst:[],feedback:'',follow:'',ck:{},ckp:{}}];
    m.sig.sup_name='Dana Cole (simulated), BCBA';m.sig.sup_date=k+'-31';curKey=k;renderAll();setView('print');renderPrint();});await sleep(600);
  await fr.evaluate(()=>document.querySelector('canvas.rs-pad[data-pad="sup_img"]').scrollIntoView({block:'center'}));await sleep(300);
  const bb=await (await fr.$('canvas.rs-pad[data-pad="sup_img"]')).boundingBox();await p.mouse.move(bb.x+40,bb.y+70);await p.mouse.down();
  for(let i=0;i<30;i++)await p.mouse.move(bb.x+40+i*14,bb.y+70+Math.sin(i/3)*28);await p.mouse.up();await sleep(200);
  await fr.evaluate(()=>{const d=document.querySelector('[data-tsgo="rbt_img"]').closest('details');d.open=true;const nm=d.querySelector('[data-tsname]');nm.value='Lee Park';nm.dispatchEvent(new Event('input',{bubbles:true}));
    const c=d.querySelector('[data-tsok]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));d.querySelector('[data-tsgo]').click();});await sleep(300);
  const before=await fr.evaluate(()=>{const g=month(curKey).sig;return {sup:g.sup_img||'',rbt:g.rbt_img||''};});
  const t0=Date.now()-1;await p.waitForFunction(t=>state.auto.at&&state.auto.at.getTime()>t&&state.autoSig===caseSig()&&!state.auto.busy,t0,{timeout:45000}).catch(()=>{});
  return {ctx,p,errs,before};}
/* every stored RS-1 picture: what it is kept as */
const stored=p=>p.evaluate(async()=>{const rows=await nbhCopies.list();const f=rows.map(r=>r.forms&&r.forms['RS-1']).filter(Boolean)[0]||{};
  return {pics:(f.pics||[]).map(x=>typeof x==='string'?'text':x instanceof Blob?'blob':typeof x),types:f.types||null};});
/* the store's records rewritten in place (the raw IndexedDB store, as the browser would hand them back) */
const rewrite=async(s,how)=>{await s.p.close();await sleep(500);const q=await s.ctx.newPage();q.on('pageerror',e=>s.errs.push(String(e).slice(0,160)));await q.goto(BASE+'/NBH-Workstation/__blank-pics153');s.p=q;
  return q.evaluate(async how=>{try{Object.keys(localStorage).filter(k=>k.indexOf('nbh.copies.pend|')===0).forEach(k=>localStorage.removeItem(k));}catch(e){}const db=await new Promise((res,rej)=>{const r=indexedDB.open('nbh-copies');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
  const all=await new Promise(res=>{const q=db.transaction('copies').objectStore('copies').getAll();q.onsuccess=()=>res(q.result);});let k=0;
  for(const rec of all){const f=rec.forms&&rec.forms['RS-1'];if(!f||!f.pics)continue;
    f.pics=await Promise.all(f.pics.map(async x=>{const blob=typeof x==='string'?await (await fetch(x)).blob():x;k++;
      if(how==='broken')return new Blob([new Uint8Array([1,2,3])],{type:''});return new Blob([await blob.arrayBuffer()]);}));   /* no type, as a stored file can come back */
    if(how!=='keepTypes')delete f.types;
    await new Promise(res=>{const t=db.transaction('copies','readwrite');t.objectStore('copies').put(rec);t.oncomplete=res;});}
  db.close();return k;},how);};
/* reload, Restore the copy, open RS-1: its August signatures */
async function restored(p){await p.goto(U);await sleep(3000);
  const offer=await p.evaluate(()=>{const d=document.querySelector('#dlg');return d&&d.open?d.innerText:'';});
  await p.evaluate(()=>{const li=[...document.querySelectorAll('#dlg .as-list li')].find(l=>l.innerText.includes('RS-1'));const b=li&&li.querySelector('button[data-as="r"]');if(b)b.click();});
  await p.waitForFunction(()=>Object.keys(state.frames).length>=1&&!state.restoring,null,{timeout:90000}).catch(()=>{});await sleep(2500);
  await p.evaluate(()=>{openForm('RS-1');return settled('RS-1',20000);});await sleep(2500);
  const note=await p.evaluate(()=>(window.__notes||[]).join(' ')+' '+[...document.querySelectorAll('.toast,#dlg,#cfDlg,.notice')].map(e=>e.innerText).join(' '));
  const fr=frameRS(p);const g=await fr.evaluate(()=>{const k=yearKeys(setupYear())[0];const m=S.months[k]||{};return {sup:(m.sig||{}).sup_img||'',rbt:(m.sig||{}).rbt_img||'',how:[(m.sig||{}).sup_how,(m.sig||{}).rbt_how],days:(m.days||[]).length,contacts:(m.contacts||[]).length};});
  return {offer:!!offer&&/RS-1/.test(offer),note,...g};}
const png=u=>/^data:image\/png;base64,iVBORw0KGgo/.test(u);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 /* A: an older copy whose pictures come back without a type */
 {const s=await signed(b);ok('A: August is signed in RS-1 (a drawn and a typed signature, both PNG pictures) and Autosave keeps a copy of it',png(s.before.sup)&&png(s.before.rbt),{sup:s.before.sup.slice(0,30),rbt:s.before.rbt.slice(0,30)});
  const k=await rewrite(s,'noTypes');const r=await restored(s.p);
  ok('A: each stored picture comes back without its type (as on Safari) and no type kept beside it: Restore brings both signatures back, as they were',k>=2&&r.offer&&r.sup===s.before.sup&&r.rbt===s.before.rbt&&r.how.join()==='drawn,typed'&&r.days===1&&r.contacts===1,{k,offer:r.offer,sup:r.sup.slice(0,40),rbt:r.rbt.slice(0,40),how:r.how,days:r.days});
  ok('A: no page errors',!s.errs.length,s.errs.slice(0,3));await s.ctx.close();}
 /* B: a copy of this version, the types beside the pictures */
 {const s=await signed(b);const st=await stored(s.p);
  ok('B: the copy keeps each picture\'s type beside it',!!st.types&&st.types.length===st.pics.length&&st.types.every(t=>t==='image/png'),st);
  await rewrite(s,'keepTypes');const r=await restored(s.p);
  ok('B: pictures that come back without a type take the one kept beside them: both signatures back',r.sup===s.before.sup&&r.rbt===s.before.rbt,{sup:r.sup.slice(0,40),rbt:r.rbt.slice(0,40)});await s.ctx.close();}
 /* C: an iPad keeps the pictures as text */
 {const s=await signed(b,{userAgent:IPAD,hasTouch:true});const st=await stored(s.p);
  ok('C: on an iPad the copy keeps the pictures as text, not as stored files',st.pics.length>=2&&st.pics.every(x=>x==='text'),st);
  const r=await restored(s.p);
  ok('C: on an iPad Restore brings both signatures back',r.sup===s.before.sup&&r.rbt===s.before.rbt&&r.days===1,{sup:r.sup.slice(0,40),rbt:r.rbt.slice(0,40)});
  ok('C: no page errors',!s.errs.length,s.errs.slice(0,3));await s.ctx.close();}
 /* D: a picture that cannot be read is left out, as before (not passed off as a picture) */
 {const s=await signed(b);await rewrite(s,'broken');const r=await restored(s.p);
  ok('D: a stored picture that is not a picture any more is left out, not given to the form (the rest of the work comes back)',!r.sup&&!r.rbt&&r.days===1&&r.contacts===1,{sup:r.sup.slice(0,40),days:r.days});
  const fr=frameRS(s.p);const L=await fr.evaluate(()=>{curKey=yearKeys(setupYear())[0];renderAll();setView('print');renderPrint();const v=k=>{const e=document.querySelector('[data-siglost="'+k+'"]');return e&&!e.hidden&&!!e.offsetParent?e.textContent:'';};
    return {sup:v('sup_img'),rbt:v('rbt_img'),printed:/Signed electronically/.test(document.getElementById('monthOut').textContent)};});
  ok('D: the sign page says each signature did not come back and is to be signed again; the record prints no "Signed electronically" line without it',/drawn here on .* did not come back.*Sign again/.test(L.sup)&&/typed and adopted here.* did not come back/.test(L.rbt)&&!L.printed,L);
  await fr.evaluate(()=>{const d=document.querySelector('[data-tsgo="rbt_img"]').closest('details');d.open=true;const nm=d.querySelector('[data-tsname]');nm.value='Lee Park';nm.dispatchEvent(new Event('input',{bubbles:true}));
    const c=d.querySelector('[data-tsok]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));d.querySelector('[data-tsgo]').click();renderSign();});await sleep(200);
  const L2=await fr.evaluate(()=>{const e=document.querySelector('[data-siglost="rbt_img"]');return {hidden:e.hidden,img:!!month(curKey).sig.rbt_img};});
  ok('D: signed again, the note goes',L2.hidden&&L2.img,L2);await s.ctx.close();}
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
