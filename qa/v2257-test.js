/* v22.57 the media store, phase 2: every form's pictures and the student photo are kept in the store by the caseload copy,
   History's restore points and Drive's copy brought here, each holding references; a form other than TV-1 is handed its
   pictures inline when the case opens or one form is restored; the case file and the backup carry the bytes; a picture is
   the same picture inline or as a reference for Drive's "same copy" test; a student removed takes them. Simulated people only.
   usage: node qa/v2257-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;wsUI.confirm=async()=>true;wsUI.prompt=async()=>'';MEDIA_GRACE=0;});
  /* the student and the student photo: a thumb and the original */
  await p.evaluate(()=>{const noise=(w,h,q)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),d=x.createImageData(w,h);
      for(let i=0;i<d.data.length;i++)d.data[i]=(i*2654435761>>>((i%7)+3))&255;x.putImageData(d,0,0);return c.toDataURL('image/jpeg',0.8);};
    document.getElementById('pClient').value='Mateo Rivera (simulated)';document.getElementById('pClient').dispatchEvent(new Event('input'));
    document.getElementById('pSid').value='4471823';document.getElementById('pSid').dispatchEvent(new Event('input'));
    setPhoto(noise(240,240,0.8),true);photoSrcIn(noise(800,600,0.8));window.__src=state.photoSrc;});
  const ph0=await p.evaluate(()=>({thumb:(state.photo||'').length,src:(state.photoSrc||'').length}));
  /* Form VS-1 with a picture */
  await p.evaluate(()=>openForm('VS-1'));await p.waitForFunction(()=>!!state.status['VS-1']&&!!state.frames['VS-1'],null,{timeout:40000}).catch(()=>{});await sleep(2000);
  const fr=()=>p.frames().find(f=>f!==p.mainFrame()&&/VS-1/.test(f.url()))||p.frames().find(f=>f!==p.mainFrame());
  await fr().evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=240;const x=c.getContext('2d'),d=x.createImageData(320,240);
    for(let i=0;i<d.data.length;i++)d.data[i]=(i*40503>>>(i%5))&255;x.putImageData(d,0,0);
    c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'bus.png',{type:'image/png'}));const i=document.querySelector('#photoIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));});});
  await sleep(1500);
  const v0=await fr().evaluate(()=>({n:S.photos.length,len:(S.photos[0]||{}).img?S.photos[0].img.length:0,data:/^data:image\//.test((S.photos[0]||{}).img||'')}));
  ok('0 set up: a student photo (thumb and original) and a VS-1 picture inline',ph0.thumb>4000&&ph0.src>4000&&v0.n===1&&v0.data&&v0.len>4000,{ph0,v0});
  /* Save case: the file carries the picture and the photo; the caseload copy and History hold references */
  const dlP=p.waitForEvent('download',{timeout:20000}).catch(()=>null);await p.evaluate(()=>{saveCase();});const dl=await dlP;let txt='';if(dl)txt=fs.readFileSync(await dl.path(),'utf8');
  await sleep(2500);
  const kept=await p.evaluate(async()=>{const L=await clList()||[];const r=L.find(x=>/Mateo/.test(x.client||''));if(!r)return {none:true};const d=parseCase(r.text);
    const vs=JSON.stringify(d.forms['VS-1'].snap);const pts=await hxPoints(r.key);const ht=pts[0]?await hxText(pts[0].id):'';const hd=ht?parseCase(ht):null;
    return {len:r.text.length,vsRef:vs.indexOf('nbh-media:')>=0,vsData:/data:image\/(jpeg|png);base64,[A-Za-z0-9+\/=]{4000}/.test(vs),srcRef:nbhMedia.isRef(d.photoSrc),thumbIn:/^data:image\//.test((d.packet||{}).photo||''),
      pts:pts.length,hRef:!!hd&&nbhMedia.isRef(hd.photoSrc)&&JSON.stringify(hd.forms['VS-1'].snap).indexOf('nbh-media:')>=0,hLen:ht.length};});
  const fileOk=txt.length>0&&txt.indexOf('nbh-media:')<0&&txt.indexOf(await p.evaluate(()=>window.__src.slice(30,200)))>=0;
  ok('1 Save case: the file carries the picture and the original photo (no reference)',!!dl&&fileOk,{file:txt.length});
  ok('2 the caseload copy holds references for the picture and the original photo (the bar\'s thumb stays inline), and is small',kept.vsRef&&!kept.vsData&&kept.srcRef&&kept.thumbIn&&kept.len<60000,kept);
  ok('3 History\'s restore point holds the references too',kept.pts>=1&&kept.hRef&&kept.hLen<60000,kept);
  /* the case opened from the caseload: the form and the bar get the bytes */
  const re=await p.evaluate(async()=>{await clearCase();const L=await clList()||[];const r=L.find(x=>/Mateo/.test(x.client||''));await openCaseText(r.text,null,{asked:true,quiet:true});
    await new Promise(z=>setTimeout(z,3000));return {src:state.photoSrc===window.__src,photo:(state.photo||'').length};});
  await p.waitForFunction(()=>!!state.status['VS-1']&&!!state.frames['VS-1'],null,{timeout:40000}).catch(()=>{});await sleep(1500);
  const v1=await fr().evaluate(()=>({n:S.photos.length,data:/^data:image\//.test((S.photos[0]||{}).img||''),imgs:[...document.querySelectorAll('img')].filter(i=>/^nbh-media:/.test(i.getAttribute('src')||'')).length}));
  ok('4 opened from the caseload: VS-1 gets its picture inline and the bar the original photo',re.src&&re.photo>4000&&v1.n===1&&v1.data&&v1.imgs===0,{re,v1});
  /* History: restore one form, the form gets its picture inline */
  await fr().evaluate(()=>{S.photos=[];if(typeof renderAll==='function')renderAll();});await sleep(800);
  const r1=await p.evaluate(async()=>{const k=clKey(packet());await hxOpen(k);await new Promise(z=>setTimeout(z,1200));const V=HX.view;const e=V&&V.E&&V.E.find(x=>x.src==='here');if(!e)return {none:true,E:V&&V.E&&V.E.length};
    await hxOne(e.id,'VS-1');await new Promise(z=>setTimeout(z,3000));return {ok:true};});
  await p.waitForFunction(()=>!!state.status['VS-1']&&!!state.frames['VS-1'],null,{timeout:40000}).catch(()=>{});await sleep(1500);
  const v2=await fr().evaluate(()=>({n:S.photos.length,data:/^data:image\//.test((S.photos[0]||{}).img||'')}));
  ok('5 History, restore one form: VS-1 comes back with its picture inline',r1.ok&&v2.n===1&&v2.data,{r1,v2});
  /* the caseload backup carries the bytes */
  const bkP=p.waitForEvent('download',{timeout:20000}).catch(()=>null);await p.evaluate(()=>{clBackup();});const bk=await bkP;let bt='';if(bk)bt=fs.readFileSync(await bk.path(),'utf8');
  ok('6 the caseload backup carries the picture and the photo, no reference',!!bk&&bt.indexOf('nbh-media:')<0&&bt.indexOf(await p.evaluate(()=>window.__src.slice(30,200)))>=0,{len:bt.length});
  /* Drive's "same copy": the copy Drive holds (inline) is the same as this device's (references) */
  const same=await p.evaluate(async()=>{const L=await clList()||[];const r=L.find(x=>/Mateo/.test(x.client||''));const inl=(await nbhMedia.inlineText(r.text)).text;
    const back=await mediaPackText(inl);return {same:await mediaSameText(inl,r.text),diff:await mediaSameText(inl.replace('Mateo','Mateo2'),r.text),back:back===r.text};});
  ok('7 a copy with the bytes inside is the same as this device\'s copy with references (and packs back to it exactly); a changed copy is not',same.same&&!same.diff&&same.back,same);
  /* Remove the student: their pictures go once nothing refers to them */
  const gone=await p.evaluate(async()=>{const a=(await nbhMedia.stat()).count;await clearCase();await clRemoveAll();await new Promise(z=>setTimeout(z,800));return {before:a,after:(await nbhMedia.stat()).count};});
  ok('8 Remove all student data: the picture and the photo leave the store',gone.before>=2&&gone.after===0,gone);
  await p.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('9 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
