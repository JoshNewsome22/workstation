/* v21.44 short respondent links (nbh-respond.js: #z=, deflate against the forms' own wording, a CRC-32 over the questionnaire).
   1. The dictionaries in nbh-respond.js are exactly tools/respond-dict/v1.json (frozen), and the links in qa/data/
      respond-golden.json, made when version 1 was new, still open to the same questionnaires: a link sent today must open
      for as long as respond.html is in use.
   2. For IA-1 (the FAST, sixteen items of realistic length pasted), IN-1, SV-1 and CF-1 with the simulated case: the link the
      form makes is short (SV-1, CF-1 and IN-1 under 800 characters, IA-1 under 2,500), opens to exactly the questionnaire the
      form built, and respond.html shows it.
   3. An old #p= link still opens; a short link with its end cut off says it does not open (it never shows a wrong page); a
      second link opened in the same tab (only the part after # differs) shows its own questionnaire.
   usage: node qa/respond-short-test.js   (WS_URL as in qa/lib.js)   node qa/respond-short-test.js --golden  rewrites the golden file */
const {chromium,BASE,ROOT,sleep,fs,path}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  '+(typeof i==='string'?i:JSON.stringify(i)):''));if(!c)fails++;};
const GOLD=path.join(ROOT,'qa/data/respond-golden.json');
const FORMS=['IA-1_Indirect-Functional-Assessment-Protocol_v2026-09','IN-1_Stakeholder-Interview-Record_v2026-09','SV-1_Social-Validity_v2026-09','CF-1_Contextual-Fit-Assessment_v2026-09'];
const LIMIT={'IA-1':2500,'IN-1':800,'SV-1':800,'CF-1':800};
/* invented items of the FAST's length and style (the real wording is pasted by the user and is not in the repository) */
const FASTLIKE=['Does the behavior tend to happen when the student has been left alone or no adult is paying attention?','Does the behavior tend to happen when an adult turns to talk with another student or another adult?','After the behavior, do adults usually stop what they are doing to talk with the student or calm the student down?','Is the student generally well behaved when getting a lot of attention, or when an adult is close by?','Does the behavior tend to happen when a preferred item, snack or activity is taken away or is not available?','Does the behavior usually stop soon after the student is given the item or activity that was asked for?','Is the student usually calm when free to use preferred items or activities without limits?','Does the behavior tend to happen when the student is asked to do a difficult task or to stop a preferred activity?','Does the behavior usually stop soon after the task is removed or the request is dropped?','Is the student usually well behaved when nothing is being asked of the student and no task is in front of the student?','Does the behavior happen in the same way across many places, people and times of day?','Does the behavior happen even when nobody is around or watching the student?','Does the student seem to enjoy the behavior itself, as if it feels good, even with nothing else gained?','Does the behavior happen more often when the student is sick, tired or has not slept well?','Is the behavior cyclical, happening for several days and then stopping for a while?','Does the student have a medical condition that might cause discomfort or pain at times?'];
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1180,height:820}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  /* 1. frozen dictionaries */
  const src=fs.readFileSync(path.join(ROOT,'NBH-Workstation/nbh-respond.js'),'utf8');
  const m=/var DICTS=\{1:\{\n([\s\S]*?)\n  \}\};/.exec(src);
  const emb=m?JSON.parse('{'+m[1].replace(/^    ([a-z]):/gm,'"$1":')+'}'):null;
  const v1=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/respond-dict/v1.json'),'utf8')).dict;
  ok('the dictionaries in nbh-respond.js are v1.json, byte for byte',!!emb&&JSON.stringify(emb)===JSON.stringify(v1),emb&&Object.keys(emb));
  ok('the RPS edition carries the same file',fs.readFileSync(path.join(ROOT,'RPS-Workstation/nbh-respond.js'),'utf8')===src);
  const made={};
  for(const f of FORMS){const id=f.slice(0,4);
    await page.goto(BASE+'/NBH-Workstation/'+f+'.html');await sleep(1200);
    await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(800);
    await page.evaluate(F=>{window.__pl=[];const o=NBH_RESPOND.payloadToHash;NBH_RESPOND.payloadToHash=function(p){const h=o.apply(this,arguments);window.__pl.push({p:JSON.parse(JSON.stringify(p)),h});return h;};
      const t=document.getElementById('rpwFast');if(t){t.value=F.map((x,i)=>(i+1)+'. '+x).join('\n');t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));}
      document.getElementById('rpBtn').click();const e=document.getElementById('rpEmail');if(e&&!e.value){e.value='bcba@example.org';e.dispatchEvent(new Event('input',{bubbles:true}));}
      const w=document.getElementById('rpWord');if(w&&!w.value){w.value='get upset';w.dispatchEvent(new Event('input',{bubbles:true}));}},FASTLIKE);
    await sleep(300);await page.evaluate(()=>{document.getElementById('rpMail').click();const d=document.querySelector('.nbh-inv[open]');if(d)d.close();});await sleep(200);
    const r=await page.evaluate(()=>{const x=window.__pl[window.__pl.length-1];const back=NBH_RESPOND.payloadFromHash(x.h);return {h:x.h,same:JSON.stringify(back)===JSON.stringify(x.p),old:('#p='+btoa(unescape(encodeURIComponent(JSON.stringify(x.p))))).length,title:x.p.title};});
    const url=BASE+'/NBH-Workstation/respond.html'+r.h;
    ok(id+': the link is short ('+url.length+' characters; '+r.old+' the old way)',/^#z=1[a-z]/.test(r.h)&&url.length<LIMIT[id],url.length);
    ok(id+': it opens to exactly the questionnaire the form built',r.same);
    made[id]=r;
    const q=await br.newPage();const qe=[];q.on('pageerror',e=>qe.push(e.message));await q.goto(url);await sleep(500);
    const shown=await q.evaluate(()=>document.body.innerText);
    ok(id+': respond.html shows it',shown.indexOf(r.title)>=0&&!/does not open|carries no questionnaire/.test(shown)&&!qe.length,qe.slice(0,2));
    await q.close();}
  /* 3. old links, cut links */
  const q=await br.newPage();await q.goto(BASE+'/NBH-Workstation/respond.html');await sleep(300);
  const oldh=await q.evaluate(()=>'#p='+btoa(unescape(encodeURIComponent(JSON.stringify({v:1,form:'SV-1',inst:'teacher-pre',title:'An old link',items:[{n:'G1',text:'One statement.'}],scale:{kind:'yn'},email:'a@b.org'})))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''));
  await q.goto(BASE+'/NBH-Workstation/respond.html'+oldh);await sleep(1200);
  ok('an old #p= link still opens',/An old link/.test(await q.evaluate(()=>document.body.innerText)));
  const cut=made['SV-1'].h.slice(0,made['SV-1'].h.length-12);
  await q.goto(BASE+'/NBH-Workstation/respond.html'+cut);await sleep(1200);
  ok('a short link cut short says it does not open',/This link does not open/.test(await q.evaluate(()=>document.body.innerText)));
  await q.goto(BASE+'/NBH-Workstation/respond.html'+made['SV-1'].h);await sleep(400);
  await q.evaluate(h=>{location.hash=h.slice(1);},made['CF-1'].h);await sleep(1200);
  ok('a second link opened in the same tab shows its own questionnaire',(await q.evaluate(()=>document.body.innerText)).indexOf(made['CF-1'].title)>=0);
  await q.close();
  /* 1b. the golden links */
  if(process.argv.includes('--golden')){fs.mkdirSync(path.dirname(GOLD),{recursive:true});
    const g={};for(const [id,r] of Object.entries(made))g[id]={hash:r.h,payload:await page.evaluate(h=>NBH_RESPOND.payloadFromHash(h),r.h)};
    fs.writeFileSync(GOLD,JSON.stringify(g,null,1)+'\n');console.log('wrote',GOLD);}
  if(fs.existsSync(GOLD)){const g=JSON.parse(fs.readFileSync(GOLD,'utf8'));
    for(const [id,x] of Object.entries(g)){const back=await page.evaluate(h=>NBH_RESPOND.payloadFromHash(h),x.hash);
      ok(id+': the version-1 link made when it was new still opens to the same questionnaire',JSON.stringify(back)===JSON.stringify(x.payload));}}
  else ok('the golden links are there (qa/data/respond-golden.json)',false);
  ok('no script errors',!errs.length,errs.slice(0,3));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
