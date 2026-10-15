/* v22.21 the walkthrough's recorded narration is read when the Walkthrough is first opened (review F474). IA-1, DD-1, RA-1,
   SM-1 and TK-1 keep their narration in a file beside the form (0.9 to 3 MB each) and read it every time the form opened,
   so a form used only for its sheets carried the audio in the iPad's memory. Now: opening the form reads no narration
   file; opening its Walkthrough reads it (TK-1 both of its files, in order) and the walkthrough is built with the
   recorded voice, without the "not beside this form" note, the same as before. Every tool that writes the tag (the
   forms' builds, check-build) keeps it inert, and the one-file edition's embed matches it. Simulated data only.
   usage: node qa/v2221-narration-test.js */
const L=require(__dirname+'/lib.js');const {execFileSync}=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const FORMS=[['IA-1',['nbh-ia1-narration.js']],['DD-1',['nbh-dd1-narration.js']],['RA-1',['nbh-ra1-narration.js']],['SM-1',['nbh-sm1-narration.js']],['TK-1',['nbh-tk1-narration.js','nbh-tk1-bus-narration.js']]];
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  for(const [id,files] of FORMS){
    const f=L.forms().find(x=>x.id===id)||{file:'Daily_Behavior_Data_and_Visual_Analysis.html'};
    const p=await ctx.newPage();const got=[];p.on('request',r=>{const m=/(nbh-[a-z0-9-]+-narration\.js)/.exec(r.url());if(m)got.push(m[1]);});
    p.on('dialog',d=>d.accept().catch(()=>{}));p.on('pageerror',e=>errs.push(id+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await L.sleep(1500);
    const pre=await p.evaluate(()=>({audio:typeof WALK_AUDIO,lazy:[...document.querySelectorAll('script[type="text/x-nbh-narration"]')].map(s=>s.dataset.src),eager:document.querySelectorAll('script[src*="-narration.js"]').length,api:!!window.nbhNarration,loaded:window.nbhNarration&&nbhNarration.loaded}));
    ok('1 '+id+' opens without reading its narration ('+files.join(', ')+')',!got.length&&pre.audio==='undefined'&&pre.eager===0&&pre.api&&!pre.loaded&&JSON.stringify(pre.lazy)===JSON.stringify(files),{got,pre});
    await p.evaluate(()=>{document.querySelectorAll('[class*=toast]').forEach(e=>e.remove());document.querySelector('#viewSeg [data-view="walk"]').click();});
    await p.waitForFunction(()=>window.nbhNarration&&nbhNarration.loaded,null,{timeout:20000}).catch(()=>{});await L.sleep(1200);
    const post=await p.evaluate(()=>{const A=typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO.lines||{};const cues=TKWALK.cues||[];
      const voiced=cues.filter(c=>A[c.id]&&A[c.id].a&&Math.abs((c.narr||0)-A[c.id].d)<1e-6).length;
      const w=document.getElementById('walk')||document.body;
      return {n:Object.keys(A).length,bus:Object.keys(A).filter(k=>/^b_/.test(k)).length,cues:cues.length,voiced,d:TKWALK.duration,note:/recorded narration \([^)]*\) is not beside this form/.test(w.innerText),view:document.body.classList.contains('view-walk')};});
    ok('2 '+id+'\'s Walkthrough reads '+files.join(' then ')+' and is built with the recorded voice ('+post.voiced+' of '+post.cues+' cues), no "not beside this form" note',
      JSON.stringify(got)===JSON.stringify(files)&&post.view&&post.n>0&&post.cues>0&&post.voiced>=post.cues*0.8&&post.d>0&&!post.note&&(id!=='TK-1'||post.bus>0),{got,post});
    /* back to the sheets and to the Walkthrough again: nothing read twice */
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg [data-view]')].find(b=>b.dataset.view!=='walk');b.click();});await L.sleep(400);
    await p.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());await L.sleep(600);
    ok('3 '+id+': opened again, the Walkthrough reads nothing again',got.length===files.length,got);
    await p.close();}
  /* the tools keep the tag inert */
  const R=L.ROOT;const forms=L.fs.readdirSync(R+'/NBH-Workstation').filter(f=>/^[A-Z].*\.html$/.test(f)).map(f=>'NBH-Workstation/'+f);
  let chk='';try{execFileSync('python3',['tools/blocks/patch-narration.py','--check',...forms],{cwd:R,encoding:'utf8'});chk='ok';}catch(e){chk=String(e.stdout||e);}
  ok('4 no form loads a narration file when it opens (patch-narration.py --check)',chk==='ok',chk);
  const idx=L.fs.readFileSync(R+'/NBH-Workstation/index.html','utf8');
  const tagRes=[...idx.matchAll(/const NARTAG\d?=(\/.*?\/);/g)].map(m=>eval(m[1]));
  const lazyTags=FORMS.flatMap(([,fs])=>fs).map(f=>'<script type="text/x-nbh-narration" data-src="'+f+'"></script>');
  ok('5 the one-file edition puts each narration inside its form from the new tag ('+tagRes.length+' patterns)',tagRes.length===6&&lazyTags.every(t=>tagRes.some(re=>re.test(t))),{n:tagRes.length});
  ok('6 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
