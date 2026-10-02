const {chromium,fs,BASE,wire,sleep}=require('./lib');
const path=require('path');
const DL='/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/qa/dl-v2133';
fs.mkdirSync(DL,{recursive:true});
const out=[];const say=(...a)=>{const s=a.join(' ');out.push(s);console.log(s);};
async function dl(page,trigger){const [d]=await Promise.all([page.waitForEvent('download',{timeout:8000}),trigger()]);const p=path.join(DL,d.suggestedFilename());await d.saveAs(p);return {name:d.suggestedFilename(),size:fs.statSync(p).size,path:p};}
async function delAll(page,sel,lenExpr){for(let k=0;k<40;k++){const n=await page.evaluate(lenExpr);if(n<1)break;await click(page,sel);await sleep(80);if(n===1)break;}}
async function loadSim(page){for(const s of ['#simBtn','#btnLoadExample','#load-demo']){const ok=await page.evaluate(x=>{const el=document.querySelector(x);if(!el)return false;el.click();return true;},s);if(ok)return s;}return null;}
const click=(page,sel)=>page.evaluate(s=>{const el=document.querySelector(s);if(!el)throw new Error('no '+s);el.click();},sel);
(async()=>{
 const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 async function open(file){const log=[];const page=await ctx.newPage();wire(page,log);await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(600);return {page,log};}
 const errs=l=>l.filter(x=>x.type!=='warning');

 /* ---------- MT-1 ---------- */
 {const {page,log}=await open('MT-1_Discontinuous-Measurement_v2026-09.html');
  say('MT-1 start type:',await page.$eval('[data-m="start"]',e=>e.type));
  // typed-time conversion on an older record
  const conv=await page.evaluate(()=>{const r={};for(const v of ['1:30 PM','9:05 am','9:15','2','12:10 am','7:00 to 8:00','13:45'])r[v]=toHM24(v);return r;});
  say('MT-1 toHM24:',JSON.stringify(conv));
  await loadSim(page);await sleep(400);
  const st=await page.evaluate(()=>({v:document.querySelector('[data-m="start"]').value,s:S.meta.start,n:S.sess.length,rows:document.querySelectorAll('#sessTbl tbody tr').length,dels:document.querySelectorAll('#sessTbl .rowDel').length}));
  say('MT-1 after sim:',JSON.stringify(st));
  await click(page,'[data-view="log"]');
  const before=await page.evaluate(()=>S.sess.map(r=>r.p));
  await click(page,'#sessTbl .rowDel[data-del="3"]');await sleep(200);
  const after=await page.evaluate(()=>({p:S.sess.map(r=>r.p),rows:document.querySelectorAll('#sessTbl tbody tr').length,plot:document.querySelectorAll('#mtPlot circle').length}));
  say('MT-1 delete row 4:',before.join(','),'->',after.p.join(','),'rows',after.rows,'points',after.plot);
  // delete down to none: one blank row stays
  await delAll(page,'#sessTbl .rowDel','S.sess.length');await sleep(100);
  say('MT-1 delete all -> rows',await page.evaluate(()=>S.sess.length),'blank',await page.evaluate(()=>emptyRow(S.sess[0])));
  // timer stamp writes HH:MM
  await page.evaluate(()=>{S.meta.start='';bindMeta();});
  await click(page,'[data-view="sheet"]');await click(page,'#tmrStart');await sleep(300);
  say('MT-1 timer stamp start:',await page.evaluate(()=>S.meta.start),'field',await page.$eval('[data-m="start"]',e=>e.value));
  await click(page,'#tmrReset').catch(()=>{});
  const sv=await dl(page,()=>click(page,'#saveBtn'));say('MT-1 save:',sv.name,sv.size);
  // reopen a file with a typed time
  const j=JSON.parse(fs.readFileSync(sv.path,'utf8'));j.S.meta.start='1:30 PM';const tp=path.join(DL,'mt1-typed.json');fs.writeFileSync(tp,JSON.stringify(j));
  await page.setInputFiles('#fileIn',tp);await sleep(400);
  say('MT-1 open typed start ->',await page.evaluate(()=>S.meta.start),'field',await page.$eval('[data-m="start"]',e=>e.value));
  say('MT-1 errors:',JSON.stringify(errs(log)));await page.close();}

 /* ---------- IN-1 ---------- */
 {const {page,log}=await open('IN-1_Stakeholder-Interview-Record_v2026-09.html');
  await loadSim(page);await sleep(400);
  const b=await page.evaluate(()=>({n:S.resp.map(r=>r.n),a0:S.ans['0_0'],a2:S.ans['2_0'],a3:S.ans['3_0'],a4:S.ans['4_0'],mx0:S.mx['0_4'],cur:S.cur,dels:document.querySelectorAll('#respTbl .rowDel').length}));
  say('IN-1 before:',JSON.stringify(b));
  await page.evaluate(()=>{S.cur=3;renderBar();showCur();});
  await click(page,'#respTbl .rowDel[data-del="2"]');await sleep(300);
  const a=await page.evaluate(()=>({n:S.resp.map(r=>r.n),a0:S.ans['0_0'],a2:S.ans['2_0'],a3:S.ans['3_0'],a4:S.ans['4_0'],mx0:S.mx['0_4'],cur:S.cur,ints:document.querySelectorAll('#intBody .resp-int').length,
    curName:document.querySelector('#intBody .resp-int.cur td:nth-child(2)').textContent,convCols:document.querySelectorAll('#convTbl thead th').length}));
  say('IN-1 after deleting respondent 3 (aide):',JSON.stringify(a));
  say('IN-1 answers moved up: SLP answer now at 2_0 =',a.a2===b.a3,'student at 3_0 =',a.a3===b.a4,'4_0 gone =',a.a4===undefined,'parent kept =',a.a0===b.a0,'cur follows SLP =',a.cur===2&&/SLP/.test(a.curName));
  await delAll(page,'#respTbl .rowDel','S.resp.length');await sleep(100);
  say('IN-1 delete all -> resp',await page.evaluate(()=>S.resp.length),'name',JSON.stringify(await page.evaluate(()=>S.resp[0].n)),'answers left',await page.evaluate(()=>Object.keys(S.ans).length+Object.keys(S.mx).length));
  await loadSim(page);await sleep(300);
  const sv=await dl(page,()=>click(page,'#saveBtn'));say('IN-1 save:',sv.name,sv.size);
  say('IN-1 errors:',JSON.stringify(errs(log)));await page.close();}

 /* ---------- BC-1 ---------- */
 {const {page,log}=await open('BC-1_Behavioral-Contrast_v2026-09.html');
  await loadSim(page);await sleep(400);
  await click(page,'[data-view="data"]');
  const b=await page.evaluate(()=>({n:S.rows.length,con:S.rows.map(r=>r.con).join(','),dels:document.querySelectorAll('#dataTbl .rowDel').length,verdict:(document.querySelector('#anVerdict')||{}).textContent.slice(0,60)}));
  say('BC-1 before:',JSON.stringify(b));
  await click(page,'#dataTbl .rowDel[data-del="4"]');await sleep(300);
  const a=await page.evaluate(()=>({n:S.rows.length,con:S.rows.map(r=>r.con).join(','),rows:document.querySelectorAll('#dataTbl tbody tr').length,pts:document.querySelectorAll('#bcPlot circle').length,verdict:(document.querySelector('#anVerdict')||{}).textContent.slice(0,60)}));
  say('BC-1 after deleting row 5:',JSON.stringify(a));
  await delAll(page,'#dataTbl .rowDel','S.rows.length');await sleep(100);
  say('BC-1 delete all -> rows',await page.evaluate(()=>S.rows.length));
  await loadSim(page);await sleep(300);
  const sv=await dl(page,()=>click(page,'#saveBtn'));say('BC-1 save:',sv.name,sv.size);
  const cv=await dl(page,()=>click(page,'#csvBtn'));say('BC-1 csv:',cv.name,cv.size);
  say('BC-1 errors:',JSON.stringify(errs(log)));await page.close();}

 /* ---------- RM-1 ---------- */
 {const {page,log}=await open('RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09.html');
  await loadSim(page);await sleep(400);
  await click(page,'[data-view="log"]');
  const b=await page.evaluate(()=>({n:S.ch.length,types:S.ch.map(c=>c.type).join('|'),dels:document.querySelectorAll('#chTbl .rowDel').length}));
  say('RM-1 before:',JSON.stringify(b));
  await click(page,'#chTbl .rowDel[data-del="1"]');await sleep(300);
  const a=await page.evaluate(()=>({n:S.ch.length,types:S.ch.map(c=>c.type).join('|'),rows:document.querySelectorAll('#chTbl tbody tr').length,typeTbl:document.querySelectorAll('#typeTbl tr').length}));
  say('RM-1 after deleting challenge 2:',JSON.stringify(a));
  await delAll(page,'#chTbl .rowDel','S.ch.length');await sleep(100);
  say('RM-1 delete all -> rows',await page.evaluate(()=>S.ch.length));
  await loadSim(page);await sleep(300);
  const sv=await dl(page,()=>click(page,'#saveBtn'));say('RM-1 save:',sv.name,sv.size);
  const cv=await dl(page,()=>click(page,'#csvBtn'));say('RM-1 csv:',cv.name,cv.size);
  say('RM-1 errors:',JSON.stringify(errs(log)));await page.close();}

 /* ---------- DD-1 ---------- */
 {const {page,log}=await open('Daily_Behavior_Data_and_Visual_Analysis.html');
  await loadSim(page);await sleep(800);
  await click(page,'[data-tab="results"]');await sleep(500);
  const g=await page.evaluate(()=>({graphs:document.querySelectorAll('#resultsOut svg.graph').length,btns:document.querySelectorAll('#resultsOut [data-act="saveGraph"]').length,
    hiddenInPrint:getComputedStyle(document.querySelector('.dd-graphsave')).display}));
  say('DD-1 graphs',g.graphs,'save buttons',g.btns,'display',g.hiddenInPrint);
  const pr=await page.evaluate(()=>{const m=window.matchMedia;return null;});
  await page.emulateMedia({media:'print'});
  say('DD-1 print display of save button:',await page.evaluate(()=>getComputedStyle(document.querySelector('.dd-graphsave')).display));
  await page.emulateMedia({media:'screen'});
  const png=await dl(page,()=>click(page,'#resultsOut [data-act="saveGraph"]'));
  const head=fs.readFileSync(png.path).slice(0,8);
  say('DD-1 png:',png.name,png.size,'bytes, signature',head.toString('hex'),'=',head.toString('hex')==='89504e470d0a1a0a'?'PNG':'NOT PNG');
  // dimensions from IHDR
  const buf=fs.readFileSync(png.path);say('DD-1 png size px:',buf.readUInt32BE(16)+'x'+buf.readUInt32BE(20));
  // existing per-row deletion on the data sheet and the behavior table
  await click(page,'[data-tab="data"]');await sleep(300);
  const d0=await page.evaluate(()=>({rows:S.rows.length,dels:document.querySelectorAll('#dataTable [data-act="delRow"]').length}));
  await page.evaluate(()=>{const b=document.querySelectorAll('#dataTable [data-act="delRow"]');b[Math.floor(b.length/2)].click();});await sleep(300);
  say('DD-1 data rows',d0.rows,'delete buttons',d0.dels,'-> after deleting a middle day',await page.evaluate(()=>S.rows.length));
  await click(page,'[data-tab="setup"]');
  const b0=await page.evaluate(()=>({n:S.behaviors.length,dels:document.querySelectorAll('#behTable [data-act="delBeh"]').length}));
  await page.evaluate(()=>document.querySelectorAll('#behTable [data-act="delBeh"]')[1].click());await sleep(300);
  say('DD-1 behaviors',b0.n,'delete buttons',b0.dels,'-> after deleting the second',await page.evaluate(()=>S.behaviors.length),'rows with orphan keys',await page.evaluate(()=>{const ids=new Set(S.behaviors.map(b=>b.id));return S.rows.filter(r=>Object.keys(r.values).some(k=>!ids.has(k.replace(/::opp$/,'')))).length;}));
  const sv=await dl(page,()=>click(page,'#btnSave'));say('DD-1 save:',sv.name,sv.size);
  say('DD-1 errors:',JSON.stringify(errs(log)));await page.close();}

 /* ---------- ABC-1 and SP-1: no change; confirm the existing deletion and time pickers ---------- */
 {const {page,log}=await open('ABC_Recording_Conditional_Probability_Analysis.html');
  await loadSim(page);await sleep(600);
  const t=await page.evaluate(()=>({etime:document.querySelector('#e-time').type,bgtime:document.querySelector('#bg-time').type,n:state.entries.length,dels:document.querySelectorAll('#inc-table [data-del]').length}));
  await page.evaluate(()=>document.querySelector('[data-tab="incidents"],[aria-controls="panel-incidents"]')?.click());
  await page.evaluate(()=>{const b=document.querySelectorAll('#inc-table [data-del]');b[Math.floor(b.length/2)].click();});await sleep(300);
  say('ABC-1 times',t.etime,t.bgtime,'incidents',t.n,'delete buttons',t.dels,'-> after deleting a middle incident',await page.evaluate(()=>state.entries.length),'analysis N',await page.evaluate(()=>{document.querySelector('[data-tab="analysis"],[aria-controls="panel-analysis"]')?.click();return (document.querySelector('#analysis-out')||{}).textContent.slice(0,0)+'ok';}));
  say('ABC-1 errors:',JSON.stringify(errs(log)));await page.close();}
 {const {page,log}=await open('Scatterplot_Pattern_Analysis.html');
  await loadSim(page);await sleep(600);
  const s=await page.evaluate(()=>({behaviors:state.behaviors.length,cur:state.cur,timeInputs:document.querySelectorAll('input[type="text"][placeholder*=":"]').length,delHidden:document.querySelector('#delBeh').hidden}));
  await page.evaluate(()=>{useBeh(0);document.querySelector('#delBeh').click();});await sleep(300);
  say('SP-1 behaviors',s.behaviors,'remove hidden',s.delHidden,'typed time fields',s.timeInputs,'-> after removing the first behavior',await page.evaluate(()=>state.behaviors.length));
  say('SP-1 errors:',JSON.stringify(errs(log)));await page.close();}
 await br.close();
 fs.writeFileSync(path.join(DL,'..','v2133-test.out'),out.join('\n')+'\n');
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
