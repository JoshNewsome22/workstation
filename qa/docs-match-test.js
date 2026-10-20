/* v23.58 (review Wave 4, I264, I261, F508, F516): the notes say what the app does. Key phrases only, so harmless
   rewording passes:
   1. Every "N forms" in the guides (README.md, tools/README.md, qa/README.md, the folder's START-HERE.md, README.txt,
      HOSTING.md, SETUP.md's opening, sw.js's header) and in the workstation's own text is the number of forms it lists.
   2. Every button START-HERE.md names in bold is one the workstation (or, for Load simulation, the forms) has; every
      Help section a guide names (Help, *...*) is one of Help's sections; every HOSTING.md section START-HERE.md names
      is a heading there.
   3. The version: Help says the one running, and SETUP.md has its notes under its heading.
   4. Privacy: no guide says that nothing leaves the device; START-HERE.md and HOSTING.md point to Help's table of
      where the student's data goes, and that table has a row for each feature that sends something.
   usage: node qa/docs-match-test.js */
const L=require(__dirname+'/lib.js');const {sleep,fs}=L;const path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const R=L.ROOT,W=path.join(R,'NBH-Workstation');
const read=p=>{try{return fs.readFileSync(p,'utf8');}catch(e){return null;}};
const apos=s=>String(s).replace(/\\u2019|\u2019/g,"'");
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ix=read(path.join(W,'index.html')),start=read(path.join(W,'START-HERE.md')),host=read(path.join(W,'HOSTING.md')),setup=read(path.join(W,'SETUP.md'))||'';
  const p=await br.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  const app=await p.evaluate(()=>({n:ALL.length,rel:WS_REL,ed:typeof DRV_ED==='string'?DRV_ED:''}));
  /* 1. the counts */
  const docs={'README.md':read(path.join(R,'README.md')),'tools/README.md':read(path.join(R,'tools','README.md')),'qa/README.md':read(path.join(R,'qa','README.md')),
    'START-HERE.md':start,'README.txt':read(path.join(W,'README.txt')),'HOSTING.md':host,'SETUP.md (opening)':setup.split(/\n---\n/)[0],
    'sw.js (header)':(read(path.join(W,'sw.js'))||'').split('*/')[0],'index.html (outside comments)':(ix||'').replace(/\/\*[\s\S]*?\*\//g,'')};
  const missing=Object.keys(docs).filter(k=>docs[k]===null);if(missing.length)console.log('note: not in this tree, not checked: '+missing.join(', '));
  const wrong=[];Object.keys(docs).forEach(k=>{const t=docs[k];if(!t)return;for(const m of t.matchAll(/(.{0,30})\b(\d+) forms\b/g))if(+m[2]!==app.n)wrong.push(k+': '+m[0].replace(/\s+/g,' '));});
  ok('1 every "N forms" in the guides and the workstation is the '+app.n+' forms it lists (sw.js said 44, the READMEs 46)',!wrong.length&&!!start,wrong);
  /* 2. the names */
  const NOT_UI=new Set(['From the website','As an app','Which release is running','What to upload','Updating','The reply box','Google','Checking it']);
  const forms=fs.readdirSync(W).filter(f=>/^[A-Z][A-Z0-9]*-\d_.*\.html$/.test(f)).map(f=>read(path.join(W,f))).join('\n');
  const bold=[...new Set([...(start||'').matchAll(/\*\*([^*]+)\*\*/g)].map(m=>m[1]))];
  const has=(src,x)=>{const e=x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('>\\s*'+e+'\\s*(<|&nbsp;|&hellip;)|\''+e+'\'|"'+e+'"|title="'+e).test(src);};
  const noUI=bold.filter(b=>!NOT_UI.has(b)&&!has(ix,b)&&!has(forms,b));
  ok('2a every button START-HERE.md names in bold is in the workstation ('+bold.filter(b=>!NOT_UI.has(b)).length+' names)',bold.length>15&&!noUI.length,noUI);
  const folds=[...ix.matchAll(/fold\('((?:[^'\\]|\\.)*)'/g)].map(m=>apos(m[1]));
  const isFold=t=>{t=apos(t);if(/^On a shared (iPad|computer)$/.test(t))return folds.includes('On a shared ');return folds.includes(t);};
  const cited=[];[['START-HERE.md',start],['SETUP.md (opening)',docs['SETUP.md (opening)']],['HOSTING.md',host]].forEach(([k,t])=>{for(const m of (t||'').matchAll(/Help, \*([^*]+)\*/g))cited.push([k,m[1]]);});
  for(const m of (start||'').matchAll(/\(\*(On a shared computer)\*/g))cited.push(['START-HERE.md',m[1]]);
  const badFold=cited.filter(([k,t])=>!isFold(t)).map(x=>x.join(': '));
  ok('2b every Help section the guides name is one of Help\'s sections ('+cited.length+' named)',cited.length>=8&&!badFold.length,{badFold,folds});
  const heads=[...(host||'').matchAll(/^## (.+)$/gm)].map(m=>m[1]);
  const hc=[...(start||'').matchAll(/HOSTING\.md, \*([^*]+)\*/g)].map(m=>m[1]),badH=hc.filter(h=>!heads.some(x=>x===h||x.startsWith(h+' ')));
  ok('2c every HOSTING.md section START-HERE.md names is a heading there',hc.length>=3&&!badH.length,{badH,heads});
  /* 3. the version */
  await p.evaluate(()=>document.getElementById('help').click());await sleep(700);
  const hv=await p.evaluate(()=>(document.getElementById('hpVer')||{}).textContent||'');
  ok('3 Help says the version running ('+app.rel+'), and SETUP.md has its notes under its heading',hv.includes(app.rel)&&setup.includes('### '+app.rel+':'),{hv,rel:app.rel});
  /* 4. privacy */
  const claim=/\b(nothing|no data)\b[^.\n]{0,25}\b(ever )?leaves (the|this|your) (machine|device|computer|iPad|browser)\b/i;
  const says=Object.keys(docs).filter(k=>k!=='index.html (outside comments)'&&docs[k]&&claim.test(docs[k])).map(k=>k+': '+docs[k].match(claim)[0]);
  ok('4a no guide says that nothing leaves the device',!says.length,says);
  ok('4b START-HERE.md and HOSTING.md point to Help\'s table of where the student\'s data goes',/Help, \*Where the student's data goes\*/.test(start||'')&&/Where the student's data goes/.test(host||''));
  const dw=await p.evaluate(()=>{const d=[...document.querySelectorAll('#dlgBody details')].find(x=>/Where the student/.test(x.querySelector('summary').textContent));if(!d)return '';d.open=true;return d.innerText;});
  const need=['Case files','Share for editing','Share in Drive','Use Google Drive','Questionnaires sent by email','reply box','Short questionnaire links','Google Sheet'].concat(app.ed==='rps'?[]:['Rewrite with Claude']);
  const lack=need.filter(x=>!dw.includes(x));
  ok('4c Help\'s table has a row for each feature that sends something ('+need.length+')',dw.length>200&&!lack.length,lack);
  ok('5 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
