/* Form CR-1's Does This Need a Report? names Florida's rule and the Florida Abuse Hotline (v23.41, review F342, wording
   approved by the BCBA): the When line cites s. 39.201, F.S.; a Where line gives the hotline, 24 hours, online through DCF,
   the reporter's name kept confidential, and 911 for immediate danger; the To whom box and the printed report record
   say the same. Simulated data only. usage: node qa/cr1-report-fl-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),f=fs.readdirSync(L.ROOT+'/NBH-Workstation/').find(x=>x.startsWith('CR-1_'));
  const p=await br.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(1000);
  const a=await p.evaluate(()=>{const ul=document.querySelector('[data-m="rpTo"]').closest('section,div.card,main')||document.body;
    const lis=[...document.querySelectorAll('li')].map(l=>l.textContent.replace(/\s+/g,' ').trim());
    return {when:lis.find(t=>/^When:/.test(t))||'',where:lis.find(t=>/^Where:/.test(t))||'',state:lis.some(t=>/Your state’s law/.test(t)),ph:document.querySelector('[data-m="rpTo"]').placeholder};});
  ok('1 When cites Florida law (s. 39.201, F.S.), not "your state"',/Florida law \(§ 39\.201, F\.S\.\) requires anyone who knows or has reasonable cause to suspect that a child is abused, abandoned or neglected to report it immediately\./.test(a.when)&&!a.state,a);
  ok('2 Where names the Florida Abuse Hotline, its number, 24 hours, online through DCF, the name kept confidential, and 911',a.where==='Where: the Florida Abuse Hotline, 1-800-96-ABUSE (1-800-962-2873), 24 hours a day, or online through the Department of Children and Families. School staff give their name when they report, and it is kept confidential. If a child is in immediate danger, call 911.',a.where);
  const r=await p.evaluate(()=>{const h=window.__crRepRecord?__crRepRecord():'';const d=document.createElement('div');d.innerHTML=h;const row=[...d.querySelectorAll('tr')].find(x=>/To whom/.test(x.textContent));return row?row.textContent.replace(/\s+/g,' ').trim():'';});
  ok('3 the To whom box and the printed report record give the hotline (or 911) when nothing is written',a.ph==='Florida Abuse Hotline (or 911), the person who took the report, the reference number'&&/^To whom ?Florida Abuse Hotline \(or 911\), the person who took the report, the reference number$/.test(r),{ph:a.ph,r});
  ok('4 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
