/* v22.47 one local-date helper (review I259, after F504). The forms (nbh-ui.js), the workstation and the respondent pages
   (nbh-respond.js) share nbhDay: the day on the device's own calendar. At 11:30 pm in Florida, when the world clock is
   already on tomorrow, every one of them gives today. And no file the workstation ships takes a day from the world clock
   (toISOString().slice(0,10) and the like): this check stops a new one. usage: node qa/v2247-dates-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const ROOT=process.env.WS_ROOT||path.join(__dirname,'..');
const UTC_DAY=/toISOString\(\)\s*\.\s*(?:slice|substr|substring)\(\s*0\s*,\s*10\s*\)|toISOString\(\)\s*\.\s*split\(\s*['"]T['"]\s*\)\s*\[\s*0\s*\]|toJSON\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/;
const SKIP=/^(pdf-lib\.min\.js|nbh-pictos\.js|sw\.js|.*-narration\.js)$/;
const files=[];const add=(dir,re)=>{try{fs.readdirSync(dir).forEach(f=>{const p=path.join(dir,f);if(fs.statSync(p).isDirectory())return;if(re.test(f)&&!SKIP.test(f))files.push(p);});}catch(e){}};
add(path.join(ROOT,'NBH-Workstation'),/\.(html|js)$/);add(path.join(ROOT,'tools','blocks'),/\.(html|js)$/);
try{fs.readdirSync(path.join(ROOT,'tools','forms')).forEach(d=>add(path.join(ROOT,'tools','forms',d),/\.(html|js)$/));}catch(e){}
const hits=[];files.forEach(p=>fs.readFileSync(p,'utf8').split('\n').forEach((l,i)=>{if(UTC_DAY.test(l))hits.push(path.relative(ROOT,p)+':'+(i+1));}));
ok('1 no shipped file takes a day from the world clock ('+files.length+' files read)',files.length>60&&hits.length===0,hits);
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',timezoneId:'America/New_York'});
  const at=async(url)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(url+': '+e.message));await p.clock.setFixedTime(new Date('2026-10-17T03:30:00Z'));await p.goto(L.BASE+url);await sleep(900);return p;};
  const sh=await at('/NBH-Workstation/index.html');
  const a=await sh.evaluate(()=>({today:nbhDay.today(),utc:new Date().toISOString().slice(0,10),iso:nbhDay.iso(new Date(2026,0,5,23,59))}));
  ok('2 the workstation at 11:30 pm in Florida: today is still the 16th (the world clock says the 17th)',a.today==='2026-10-16'&&a.utc==='2026-10-17'&&a.iso==='2026-01-05',a);
  const tb=await at('/NBH-Workstation/TB-1_Target-Behavior-Development_v2026-09.html');
  const b=await tb.evaluate(()=>nbhDay.today());
  ok('3 a form (nbh-ui.js) gives the same day',b==='2026-10-16',b);
  const rp=await at('/NBH-Workstation/respond.html');
  const c=await rp.evaluate(()=>typeof nbhDay==='object'&&nbhDay.today());
  ok('4 a respondent page (nbh-respond.js) gives the same day',c==='2026-10-16',c);
  }catch(e){console.log('FAIL exception '+(e&&e.stack||e));fails++;}
  ok('5 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
