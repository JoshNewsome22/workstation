/* v22.19 case history across a caseload (review F468). Case history's room (about 200 MB) is shared by every student on the
   device; once it is full the oldest saves go first. A student whose case has been quiet for a while used to lose every
   save to make room for a busy student's newer ones. Now no student's last 5 saves are taken for another student: the
   busy student's older saves go first, and a student's own last 5 only when nothing else is left. The cap is honoured, and
   the help says so. Two simulated students.   usage: node qa/v2219-history-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const r=await page.evaluate(async()=>{const day=864e5,t0=Date.now();
    const mk=(p,i,at,n)=>hxKeep({key:clKey(p),text:JSON.stringify({form:'CASE',packet:p,forms:{'TB-1':{title:'TB-1',snap:{total:1,data:{n:String(i),pad:'x'.repeat(n)}}}}}),dev:'iPad',why:'Save case',at:new Date(at).toISOString()});
    const A={client:'SIMULATED – Sample Student',sid:'SIM-0002'},B={client:'SIMULATED – Sample Student 2',sid:'SIM-0003'};
    const c0=HX.cap;HX.cap=1e9;
    /* the quiet student: 8 saves, all of them more than two weeks old, a day apart */
    for(let i=0;i<8;i++)await mk(A,i,t0-(40-i)*day,4000);
    /* the busy student: 20 saves in the last week */
    for(let i=0;i<20;i++)await mk(B,i,t0-7*day+i*3600e3,4000);
    const all=(await hxTx(['points'],'readonly',s=>s.getAll()))||[],one=Math.max(...all.map(p=>+p.size||0));
    /* the room holds 12 saves: 16 must go */
    HX.cap=one*12+10;await hxTrim();HX.cap=c0;
    const left=(await hxTx(['points'],'readonly',s=>s.getAll()))||[],texts=((await hxTx(['texts'],'readonly',s=>s.getAll()))||[]).length,kA=clKey(A),kB=clKey(B);
    const a=left.filter(p=>p.key===kA),b=left.filter(p=>p.key===kB),newestA=all.filter(p=>p.key===kA).sort((x,y)=>Date.parse(y.at)-Date.parse(x.at)).slice(0,5).map(p=>p.id);
    const tot=left.reduce((s,p)=>s+(+p.size||0),0);
    return {before:all.length,after:left.length,a:a.length,b:b.length,newestA:newestA.every(id=>a.some(p=>p.id===id)),tot,cap:one*12+10,texts};});
  ok('1 a full history keeps the quiet student\'s last 5 saves and takes the busy student\'s older ones ('+r.a+' and '+r.b+' left of 8 and 20)',r.a===5&&r.newestA&&r.b===7,r);
  ok('2 the total stays within the room, and each save\'s text goes with it',r.tot<=r.cap&&r.texts===r.after,r);
  const h=await page.evaluate(()=>document.documentElement.innerHTML.indexOf('never a student’s last 5')>=0);
  ok('3 the help says a student\'s last 5 saves are never taken for another\'s',h);
  ok('4 no page errors',!errs.length,errs.slice(0,3));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
