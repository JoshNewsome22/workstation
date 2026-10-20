/* v23.56 (review Wave 4, F513, F514, I263): Help covers the staff directory, @ names, questionnaires, the caseload backup,
   packets, walkthroughs and Diagnostics; Help, Google, set up once is one checklist (four APIs, the scopes, the two keys,
   the school IT's way past "Access blocked") with boxes that keep the keys on this device; Form DD-1 points there, not to
   HOSTING.md. usage: node qa/w4-help-google-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.google.client');localStorage.removeItem('nbh.google.apikey');}catch(e){}window.__t=[];const t=wsUI.toast;wsUI.toast=(m,o)=>{__t.push(String(m));return t(m,o);};});
  await p.evaluate(()=>document.getElementById('help').click());await sleep(800);
  const h=await p.evaluate(()=>{document.querySelectorAll('#dlgBody details').forEach(d=>d.open=true);return document.getElementById('dlgBody').innerText;});
  ok('1 Help: the staff directory, @ names, questionnaires and Email it, the caseload backup and Restore, packets, walkthroughs, Diagnostics',
    /Staff directory \(the top bar; also Go to\)/.test(h)&&/@ and the first letters of a name or a role/.test(h)&&/Questionnaires \(Forms IA-1, IN-1, SV-1 and CF-1\)/.test(h)&&/Email it sends it from your school Gmail/.test(h)&&
    /Back up the caseload \(Caseload\)/.test(h)&&/Restore puts a backup back/.test(h)&&/Save packet and Open packet/.test(h)&&/Walkthrough button/.test(h)&&/Diagnostics \(More\)/.test(h),h.length);
  ok('2 Help, Google, set up once: the project, the four APIs, the sign-in screen, the scopes, the sign-in key, the API key, and what IT does for "Access blocked"',
    /Google, set up once/.test(h)&&/Google Sheets API/.test(h)&&/Gmail API/.test(h)&&/Google Drive API/.test(h)&&/Google Picker API/.test(h)&&/drive\.file/.test(h)&&/gmail\.send/.test(h)&&/Client ID/.test(h)&&/API key/.test(h)&&/Manage third-party app access/.test(h));
  await p.fill('#hpGid','not-a-key');await p.click('#hpKeysSave');await sleep(300);
  const bad=await p.evaluate(()=>({t:__t.slice(-1)[0],k:localStorage.getItem('nbh.google.client')}));
  ok('3 a sign-in key that is not one is refused, and nothing is kept',/ends in \.apps\.googleusercontent\.com/.test(bad.t)&&!bad.k,bad);
  await p.fill('#hpGid','123-simulated.apps.googleusercontent.com');await p.fill('#hpApiKey','simulated-picker-key');await p.click('#hpKeysSave');await sleep(300);
  const good=await p.evaluate(()=>({k:clGid(),a:kvGet('nbh.google.apikey'),t:__t.slice(-1)[0]}));
  ok('4 Keep them on this device: the sign-in key and the API key are kept, where the Google features read them',good.k==='123-simulated.apps.googleusercontent.com'&&good.a==='simulated-picker-key'&&/^Kept on this/.test(good.t),good);
  /* Form DD-1 points to Help */
  const fs=require('fs'),dd=fs.readdirSync(L.ROOT+'/NBH-Workstation').find(f=>/^Daily_Behavior/.test(f)),t=fs.readFileSync(L.ROOT+'/NBH-Workstation/'+dd,'utf8');
  ok('5 Form DD-1 says how to make the key in the workstation\'s Help, not in HOSTING.md',!/HOSTING\.md/.test(t)&&/how to make one: the workstation’s Help, Google, set up once/.test(t));
  ok('6 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
