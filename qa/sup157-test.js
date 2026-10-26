/* v24.57 Form RS-1 and Sellers, Alai-Rosales & MacDonald (2016), the article the BCBA sent on 10/26: the reading is in the
   readings picker with its summary; each supervisor takes the date the supervision conditions were given in writing (kept,
   printed with the supervisor, read back from the file; not a BACB check: the month's verdict does not change); the RBT
   record has The Effects of Supervision (add, type, remove asked first), kept with the RBT, read back from the file and
   printed with the year summary up to the month it runs through. Simulated names only.
   usage: node qa/sup157-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,800)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const p=await b.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/RS-1_RBT-Supervision-Log_v2026-10.html');await sleep(1500);
 const R=await p.evaluate(()=>{const r=(typeof NBH_READINGS!=='undefined'?NBH_READINGS:[]).find(x=>x.k==='sellers2016');return r&&{apa:r.apa,doi:r.doi,sum:r.sum.length};});
 ok('the article is in the readings, cited with its DOI and a short summary',!!R&&/^Sellers, T\. P\., Alai-Rosales, S\., & MacDonald, R\. P\. F\. \(2016\)\. Taking full responsibility/.test(R.apa)&&/Behavior Analysis in Practice, 9, 299–308\.$/.test(R.apa)&&R.doi==='10.1007/s40617-016-0144-x'&&R.sum>100,R);
 /* the supervision conditions in writing */
 await p.evaluate(()=>{S.setup.rbt_name='Lee Park (simulated)';S.sups=[{id:'s1',name:'Dana Cole (simulated)',cred:'BCBA',cert:'',role:'',trained:'yes',trained_date:'2024-03-08',portal:'yes',norel:true,oversight:OVERS[0][0],oversight_note:''}];renderAll();setView('setup');});await sleep(300);
 const before=await p.evaluate(()=>({st:stats(yearKeys(setupYear())[0]).status,iss:supIssues(S.sups[0]).length}));
 await p.fill('#sp_s1_agree,[data-sup="s1"][data-f="agree"]','2026-08-03').catch(async()=>{await p.evaluate(()=>{const e=document.querySelector('[data-sup="s1"][data-f="agree"]');e.value='2026-08-03';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});});
 await sleep(200);
 const A=await p.evaluate(()=>{const k=yearKeys(setupYear())[0];const m=month(k);m.days=[{id:'d1',date:k+'-04',start:'08:00',end:'15:00',brk:'30',act:'',none:false}];curKey=k;renderPrint();
   const o=fromFile(JSON.parse(JSON.stringify(saveObj())));const o2=fromFile({form:'RS-1',S:Object.assign(JSON.parse(JSON.stringify(S)),{sups:[Object.assign({},S.sups[0],{agree:''})]})});
   return {kept:S.sups[0].agree,printed:/supervision conditions in writing 8\/3\/2026/.test(document.getElementById('monthOut').textContent),back:o.sups[0].agree,emptyGone:!('agree' in o2.sups[0]),st:stats(k).status,iss:supIssues(S.sups[0]).length};});
 ok('a supervisor takes the date the supervision conditions were given in writing; it prints with the supervisor and comes back from the file (and is left out when empty)',A.kept==='2026-08-03'&&A.printed&&A.back==='2026-08-03'&&A.emptyGone,A);
 ok('it is a record, not a BACB check: the supervisor\'s requirements and the month\'s verdict are as before',A.iss===before.iss,{before,after:{iss:A.iss}});
 /* the effects of supervision */
 await p.evaluate(()=>setView('rbt'));await sleep(200);
 await p.click('#addEff');await sleep(200);
 const id=await p.evaluate(()=>S.effects[0].id);
 await p.fill('#ef_'+id+'_view','The feedback after observations helps most (simulated).');await p.fill('#ef_'+id+'_data','Plan checklist up from 78% to 92% (simulated).');await p.fill('#ef_'+id+'_change','Feedback the same day (simulated).');
 await p.fill('#ef_'+id+'_date',await p.evaluate(()=>yearKeys(setupYear())[0]+'-28'));
 const E=await p.evaluate(()=>({e:JSON.parse(JSON.stringify(S.effects)),count:document.getElementById('effCount').textContent,vis:!!document.getElementById('effList').offsetParent}));
 ok('The Effects of Supervision on the RBT record: Add a review gives a dated review; the RBT\'s view, the data and the change are kept',E.vis&&E.e.length===1&&/helps most/.test(E.e[0].view)&&/78% to 92%/.test(E.e[0].data)&&/same day/.test(E.e[0].change)&&E.count==='1 review',E);
 const Y=await p.evaluate(()=>{const ks=yearKeys(setupYear());setView('print');curKey=ks[0];const s=document.getElementById('yrThrough');renderPrint();const all=document.getElementById('yearOut').textContent;
   const o=fromFile(JSON.parse(JSON.stringify(saveObj())));return {printed:/Reviews of the effects of supervision/.test(all)&&/helps most/.test(all)&&/78% to 92%/.test(all),back:o.effects&&o.effects.length===1&&o.effects[0].view===S.effects[0].view};});
 ok('the review prints with the year summary and comes back from the file',Y.printed&&Y.back,Y);
 await p.evaluate(()=>{window.__asked=[];nbhUI.confirm=async m=>{window.__asked.push(m);return true;};setView('rbt');});await sleep(200);
 await p.click('[data-efdel]');await sleep(300);
 const D=await p.evaluate(()=>({gone:!S.effects,asked:window.__asked.length,rows:document.querySelectorAll('#effList .rs-eff').length,file:!('effects' in fromFile(JSON.parse(JSON.stringify(saveObj()))))}));
 ok('Remove this review asks first, then removes it; with none left the file holds no effects list',D.gone&&D.asked===1&&D.rows===0&&D.file,D);
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
