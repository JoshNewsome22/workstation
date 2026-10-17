/* v22.44 the data map for the district (review I254): Help's Where the student's data goes offers a printable page with what is kept
   where (the same table), each Google permission and what it allows, what the practice website keeps, and how a record is destroyed.
   It names no student and no account. usage: node qa/v2244-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await p.evaluate(()=>{const s=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('#pClient','Mateo Rivera');s('#pSid','4471823');});
  const r=await p.evaluate(()=>{document.getElementById('help').click();const btn=!!document.querySelector('#dlgBody #dmPrint');const h=dmHtml();const d=document.createElement('div');d.innerHTML=h.replace(/<style>[\s\S]*?<\/style>/,'');return {btn,t:d.textContent,h};});
  ok('1 Help, Where the student’s data goes, offers Print the data map for the district',r.btn);
  ok('2 the page answers in order: what is kept where, the Google permissions, the website, how a record is destroyed',['1. What is kept where','2. What each Google permission allows','3. What the practice website keeps','4. How a record is destroyed'].every((x,i,a)=>r.t.indexOf(x)>=0&&(i===0||r.t.indexOf(x)>r.t.indexOf(a[i-1]))),r.t.slice(0,300));
  ok('3 each Google permission is named with what it allows',/drive\.file/.test(r.t)&&/gmail\.send/.test(r.t)&&/cannot read, list or delete mail/.test(r.t)&&/spreadsheets\.readonly/.test(r.t)&&/writes nothing/.test(r.t),r.t.slice(0,800));
  ok('4 the same table as Help, without the button; the version printed',/The caseload, its history/.test(r.t)&&!/dmPrint/.test(r.h)&&new RegExp('version '+(await p.evaluate(()=>WS_REL)).replace('.','\\.')).test(r.t));
  ok('5 no student, ID or account on the page',!/Mateo|Rivera|4471823|@/.test(r.t),r.t.match(/Mateo|Rivera|4471823|@\S+/));
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  ok('6 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
