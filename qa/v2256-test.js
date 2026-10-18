/* v22.56 the media store (nbh-media.js): the sound tracks and pictures Form TV-1 carries are kept once on this device, by
   reference, out of the case file; the case file written, a backup and Drive carry them again; a case with the bytes inside
   moves them to the store when opened; the one-file edition carries the store's code. Simulated people only.
   usage: node qa/v2256-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:900},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await p.evaluate(()=>{window.confirm=()=>true;wsUI.confirm=async()=>true;wsUI.prompt=async()=>'';});   /* the backup's passphrase: none */
  /* the store itself */
  const s1=await p.evaluate(async()=>{const M=window.nbhMedia;if(!M)return {no:true};await M.sweep([]);
    const bytes=new Uint8Array(120000);for(let i=0;i<bytes.length;i++)bytes[i]=(i*13)&255;
    const r1=await M.put(new Blob([bytes],{type:'audio/mpeg'}),{kind:'audio'}),r2=await M.put(new Blob([bytes],{type:'audio/mpeg'}),{kind:'audio'});
    const d=await M.dataUrl(r1),back=await M.put(d),st=await M.stat(),u=await M.url(r1),got=await M.get(r1);
    const ab=await M.absorbText(JSON.stringify({a:d,b:'x'}),4000),inl=await M.inlineText(ab.text);
    return {isRef:M.isRef(r1),same:r1===r2,back:back===r1,count:st.count,bytes:st.bytes,mode:st.mode,url:/^blob:/.test(u),size:got&&got.size,mime:M.parse(r1).mime,
      abN:ab.n,abRef:ab.text.indexOf('nbh-media:')>=0&&ab.text.indexOf('data:audio')<0,inlBack:inl.text===JSON.stringify({a:d,b:'x'}),refs:M.refsIn(ab.text).length};});
  ok('1 nbhMedia: the same bytes give one reference and one copy; a data URL round-trips; absorbText and inlineText are inverses',s1.isRef&&s1.same&&s1.back&&s1.count===1&&s1.bytes===120000&&s1.mode==='idb'&&s1.url&&s1.size===120000&&s1.mime==='audio/mpeg'&&s1.abN===1&&s1.abRef&&s1.inlBack&&s1.refs===1,s1);
  /* TV-1 through the shell: a track added goes to the store, the form keeps a reference */
  await p.evaluate(()=>openForm('TV-1'));await p.waitForFunction(()=>!!state.status['TV-1']&&!!state.frames['TV-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
  const fr=p.frames().find(f=>f!==p.mainFrame()&&/TV-1/.test(f.url()))||p.frames().find(f=>f!==p.mainFrame());
  const t1=await fr.evaluate(async()=>{const M=window.nbhMedia;if(!M)return {no:true};
    const bytes=new Uint8Array(300000);for(let i=0;i<bytes.length;i++)bytes[i]=(i*7)&255;
    const f=new File([bytes],'song.mp3',{type:'audio/mpeg'});const dt=new DataTransfer();dt.items.add(f);const inp=document.getElementById('musIn');inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(r=>setTimeout(r,1200));const t=S.mus.tracks[0]||{};const own=document.getElementById('tvState').value;
    return {n:S.mus.tracks.length,label:t.label,isRef:M.isRef(t.src),ownRef:own.indexOf('nbh-media:')>=0,ownData:own.indexOf('data:audio')>=0,ownLen:own.length,url:/^blob:/.test(msrc(t.src)),max:MUS_MAX_STORE,listed:document.getElementById('musTracks').textContent.indexOf('song')>=0};});
  ok('2 TV-1: a sound file added is kept on the device and the form keeps a reference (the state text is small); it plays from an object URL; a track may be 60 MB',t1.n===1&&t1.label==='song'&&t1.isRef&&t1.ownRef&&!t1.ownData&&t1.ownLen<4000&&t1.url&&t1.max===60000000&&t1.listed,t1);
  /* the case file written carries the bytes; the caseload copy keeps the reference */
  const dlP=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
  await p.evaluate(()=>{document.getElementById('pClient').value='Mateo Rivera (simulated)';document.getElementById('pClient').dispatchEvent(new Event('input'));saveCase();});
  const dl=await dlP;let txt='';if(dl)txt=fs.readFileSync(await dl.path(),'utf8');
  const cl=await p.evaluate(async()=>{const L=await clList()||[];const r=L.find(x=>/Mateo/.test(x.client||''));return r?{len:r.text.length,ref:r.text.indexOf('nbh-media:')>=0,data:r.text.indexOf('data:audio')>=0}:{none:true};});
  ok('3 Save case: the file carries the sound (no reference), while the caseload copy on this device keeps the reference',!!dl&&txt.length>400000&&txt.indexOf('data:audio/mpeg;base64')>=0&&txt.indexOf('nbh-media:')<0&&cl.ref&&!cl.data&&cl.len<10000,{file:txt.length,cl});
  /* a case with the bytes inside, opened: the media moves to the store; the caseload copy is small */
  const re=await p.evaluate(async t=>{window.__toasts=[];const T=wsUI.toast;wsUI.toast=(m,o)=>{window.__toasts.push(String(m));return T(m,o);};
    await clearCase();await openCaseText(t,null,{asked:true});await new Promise(r=>setTimeout(r,2500));const L=await clList()||[];const r=L.find(x=>/Mateo/.test(x.client||''));
    return {len:r?r.text.length:-1,ref:!!r&&r.text.indexOf('nbh-media:')>=0,toast:window.__toasts.find(x=>/now kept on this device/.test(x))||''};},txt);
  ok('4 a case file with the sound inside, opened: the sound moves to the store (said once) and the copy kept here holds the reference',re.ref&&re.len<10000&&/1 sound or picture \(0\.3 MB\) now kept on this device/.test(re.toast),re);
  /* a backup carries the bytes */
  const bkP=p.waitForEvent('download',{timeout:20000}).catch(()=>null);await p.evaluate(()=>{clBackup();});const bk=await bkP;   /* not awaited: after the download it waits on the share sheet's answer */let bt='';if(bk)bt=fs.readFileSync(await bk.path(),'utf8');
  ok('5 the caseload backup carries the sound',!!bk&&bt.indexOf('data:audio/mpeg;base64')>=0&&bt.indexOf('nbh-media:')<0,{len:bt.length});
  /* Diagnostics, the forms' script, the offline list */
  const sw=await (await ctx.request.get(L.BASE+'/NBH-Workstation/sw.js')).text();
  const tvs=await (await ctx.request.get(L.BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html')).text();
  ok('6 the offline list names nbh-media.js and TV-1 loads the store',/'nbh-media\.js'/.test(sw)&&/<script src="nbh-media\.js"><\/script>/.test(tvs),{sw:/'nbh-media\.js'/.test(sw)});
  await p.evaluate(()=>document.getElementById('diag').click());await sleep(1200);
  const dg2=await p.evaluate(()=>{const c=document.getElementById('diagMedia');return c?c.textContent:null;});
  ok('7 Diagnostics: Sounds and pictures on this device, with the count and size (the two kept above)',!!dg2&&/^2 files, 0\.4 MB$/.test(dg2),dg2);
  /* the sweep: what nothing refers to goes, what the case refers to stays; Remove all takes the rest once the case is closed */
  await p.evaluate(()=>{const d=document.getElementById('dlg');if(d&&d.open)d.close();openForm('TV-1');});await p.waitForFunction(()=>!!state.frames['TV-1']&&!!state.status['TV-1'],null,{timeout:40000}).catch(()=>{});await sleep(1500);
  const sw1=await p.evaluate(async()=>{MEDIA_GRACE=0;const fr=state.frames['TV-1'];const held=!!(fr&&fr.contentWindow&&typeof fr.contentWindow.nbhMediaHeld==='function'&&/nbh-media:/.test(fr.contentWindow.nbhMediaHeld()));
    const gone=await mediaSweep();const st=await nbhMedia.stat();return {held,gone,count:st.count,bytes:st.bytes};});
  ok('8 the sweep: the bytes nothing refers to are deleted; the case\'s sound stays (TV-1 tells the workstation what it holds)',sw1.held&&sw1.gone===1&&sw1.count===1&&sw1.bytes===300000,sw1);
  const sw2=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));await clRemoveAll();await w(600);const a=(await nbhMedia.stat()).count;
    await clearCase();await w(600);await clRemoveAll();await w(600);const b=(await nbhMedia.stat()).count;const L=await clList()||[];return {open:a,closed:b,left:L.length};});
  ok('9 Remove all student data: the sound stays while the case on screen holds it, and goes once nothing on this device does',sw2.open===1&&sw2.closed===0&&sw2.left===0,sw2);
  await p.close();
  /* the one-file edition carries the store's code and TV-1 in it has it too */
  const one=await ctx.newPage();one.on('pageerror',e=>errs.push('one-file: '+e.message));await one.goto(L.BASE+'/deliver/NBH-Workstation.html');await sleep(2000);
  const o1=await one.evaluate(async()=>({media:!!window.nbhMedia,block:!!document.getElementById('nbh-embed-media'),ready:!!(await (window.EMBED&&EMBED.ready))}));
  await one.evaluate(()=>openForm('TV-1'));await one.waitForFunction(()=>!!state.status['TV-1']&&!!state.frames['TV-1'],null,{timeout:40000}).catch(()=>{});await sleep(2500);
  const of=one.frames().find(f=>f!==one.mainFrame());const o2=of?await of.evaluate(()=>({media:!!window.nbhMedia,mode:window.nbhMedia&&nbhMedia.mode()})).catch(e=>({err:String(e)})):{none:true};
  ok('10 the one-file edition: the store\'s code is inside it, for the workstation and for TV-1',o1.media&&o1.block&&o2.media===true,{o1,o2});
  await one.close();
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('11 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
