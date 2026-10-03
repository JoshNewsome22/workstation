/* Task V/U verification for the five forms that gained the shared toolbar */
const {chromium,fs,BASE,wire,sleep}=require('./lib');
const out=[];const say=(...a)=>{const s=a.join(' ');out.push(s);console.log(s);};
const FORMS=[
 {id:'abc1',file:'ABC_Recording_Conditional_Probability_Analysis.html',keys:['record','incidents','background','analysis','methods','data','walk'],panel:k=>'#panel-'+k,
  ids:['load-demo','printBtn','dl-json','up-json','file-input','dl-csv','dl-matrix','clear-all'],sim:'#load-demo',
  rowTab:'incidents',rowSel:'#inc-table [data-del]',count:'state.entries.length',clear:'#clear-all',cleared:'state.entries.length+state.samples.length'},
 {id:'dd1',file:'Daily_Behavior_Data_and_Visual_Analysis.html',keys:['setup','data','results'],panel:k=>'#tab-'+k,
  ids:['btnLoadExample','btnPrintTop','btnSave','btnLoad','fileImport','btnCsv','btnClearAll'],sim:'#btnLoadExample',
  rowTab:'setup',rowSel:'#behTable [data-act="delBeh"]',count:'S.behaviors.length',clear:'#btnClearAll',cleared:'S.rows.length',reloads:true},
 {id:'vi1',file:'Variable_Isolation_Protocol.html',keys:['p0','p1','p2','p3','p4','p5','p6','p7','p8'],panel:k=>'#'+k,
  ids:['btnSim','btnPrint','btnSave','btnLoad','fileIn','btnClear'],sim:'#btnSim',simAsks:true,
  clear:'#btnClear',cleared:"[...document.querySelectorAll('.panel input[type=text]')].filter(i=>i.value.trim()&&i.value!==i.defaultValue).length"},
 {id:'dt1',file:'Delay-Tolerance-Protocol-Toolkit.html',keys:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],panel:k=>'#'+k,
  ids:['btnSim','btnPrint','btnSave','btnLoad','fileIn','btnClear'],sim:'#btnSim',simAsks:true,
  replaceTab:'p4',replaceBtn:'#btnFade',replaceCount:"document.querySelectorAll('#tbFade tr').length",clear:'#btnClear',cleared:"document.querySelectorAll('#tbFade tr').length",reloads:true},
 {id:'ad1',file:'AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html',keys:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],panel:k=>'#'+k,
  ids:['btnSim','btnPrint','btnSave','btnLoad','fileIn','btnClear'],sim:'#btnSim',
  replaceTab:'p3',replaceBtn:'#btnLadder',replaceCount:"document.querySelectorAll('#tbStep tr').length",clear:'#btnClear',cleared:"document.querySelectorAll('#tbSess tr').length",reloads:true}];
const click=(page,sel)=>page.evaluate(s=>{const el=document.querySelector(s);if(!el)throw new Error('no '+s);el.click();},sel);
const dlgOpen=page=>page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return !!(d&&d.open);});
const dlgHead=page=>page.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?d.querySelector('.u-h').textContent+' | '+[...d.querySelectorAll('.u-f button')].map(b=>b.className+':'+b.textContent).join(','):'(closed)';});
const dlgOk=page=>click(page,'#nbhUiDlg .u-f .danger, #nbhUiDlg .u-f .primary');
const dlgCancel=page=>page.evaluate(()=>{const b=[...document.querySelectorAll('#nbhUiDlg .u-f button')].find(b=>!/danger|primary/.test(b.className));b.click();});
async function pages(page){const pdf=await page.pdf({preferCSSPageSize:true});const m=pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);return m?m.length:-1;}
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1440,height:900}});await ctx.addInitScript(()=>{window.print=function(){};});
 let fails=0;const bad=(...a)=>{fails++;say('  FAIL',...a);};
 for(const F of FORMS){if(process.env.ONLY&&!process.env.ONLY.split(',').includes(F.id))continue;const log=[];const page=await ctx.newPage();wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/'+F.file);await sleep(900);
  say('=== '+F.id);
  // toolbar + ids
  const tb=await page.evaluate(ids=>({toolbar:!!document.querySelector('.toolbar'),seg:[...document.querySelectorAll('.toolbar #viewSeg button[data-view]')].map(b=>b.dataset.view),
    inBar:ids.map(i=>{const e=document.getElementById(i);return i+':'+(e?(e.closest('.toolbar')?'bar':'ELSEWHERE'):'MISSING');}),
    more:!!document.querySelector('.toolbar #nbhMoreBtn'),fit:!!document.querySelector('.toolbar #nbhFitBtn'),
    quick:(()=>{const q=document.getElementById('nbhSaveQuick');return q?(q.closest('.toolbar')?'in bar':'elsewhere')+' display='+getComputedStyle(q).display:'MISSING';})(),
    compact:document.documentElement.classList.contains('nbh-compact'),
    caseBtn:(()=>{const b=document.getElementById('nbhCaseBtn');return b?(b.closest('.toolbar')?'in bar':'elsewhere')+(b.closest('.nbh-case-grp').hidden?' (group hidden: no case facts standalone)':' shown'):'MISSING';})(),
    oldNav:(()=>{const n=document.querySelector('nav.nbh-tabs');return n?getComputedStyle(n).display:'gone';})(),
    actions:!!document.querySelector('.nbh-actions'),
    pn:(()=>{const p=document.querySelector('.nbh-pagenav');return p?(p.hidden?'hidden':'shown: '+p.querySelector('.nbh-pn-where').textContent):'MISSING';})(),
    body:document.body.className}),F.ids);
  say('  toolbar',tb.toolbar,'views',tb.seg.join(','),'| ids',tb.inBar.join(' '));
  say('  more',tb.more,'fit',tb.fit,'compact',tb.compact,'| quick save',tb.quick,'| case',tb.caseBtn,'| old nav display',tb.oldNav,'| .nbh-actions left',tb.actions,'| body',JSON.stringify(tb.body));
  say('  page bar at load:',tb.pn);
  if(!tb.toolbar||tb.seg.join(',')!==F.keys.join(','))bad('view keys');
  if(tb.inBar.some(s=>/MISSING|ELSEWHERE/.test(s)))bad('ids');
  if(!tb.more||tb.quick==='MISSING'||tb.caseBtn==='MISSING'||tb.oldNav!=='none'||tb.actions)bad('chrome');
  if(!/^shown: Page 1 of/.test(tb.pn))bad('pagenav at load');
  // view switching
  for(const k of F.keys){await click(page,'#viewSeg button[data-view="'+k+'"]');await sleep(120);
   const r=await page.evaluate(({k,keys,sel})=>{const vis=e=>!!(e&&(e.offsetParent||e.getClientRects().length));
     const shown=keys.filter(x=>vis(document.querySelector(sel.replace('%',x))));
     const pressed=[...document.querySelectorAll('#viewSeg button[data-view]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.view);
     const sel2=[...document.querySelectorAll('nav.nbh-tabs [role=tab][aria-selected="true"]')].length;
     const p=document.querySelector('.nbh-pagenav');
     return {shown:shown.join(','),pressed:pressed.join(','),oldSelected:sel2,body:document.body.classList.contains('view-'+k),pn:p&&!p.hidden?p.querySelector('.nbh-pn-where').textContent:'HIDDEN',next:p?p.querySelector('.nbh-pn-next').textContent.trim():''};},{k,keys:F.keys,sel:F.panel('%')});
   const ok=r.shown===k&&r.pressed===k&&r.oldSelected===1&&r.body&&/^Page \d+ of \d+/.test(r.pn);
   say('  view',k.padEnd(10),ok?'ok ':'BAD','shown',r.shown,'pressed',r.pressed,'body.view',r.body,'|',r.pn,'|',r.next);
   if(!ok)bad('view '+k);}
  // page bar moves
  await click(page,'#viewSeg button[data-view="'+F.keys[0]+'"]');await sleep(100);
  await click(page,'.nbh-pagenav .nbh-pn-next');await sleep(150);
  const pn2=await page.evaluate(()=>({where:document.querySelector('.nbh-pagenav .nbh-pn-where').textContent,pressed:document.querySelector('#viewSeg button[aria-pressed="true"]').dataset.view,
     top:Math.round(document.querySelector('.nbh-pagenav').getBoundingClientRect().top),y:window.scrollY}));
  say('  page bar Next ->',pn2.where,'| pressed',pn2.pressed,'| bar top',pn2.top);
  if(pn2.pressed!==F.keys[1])bad('pagenav next');
  // simulation and the progress dots
  const dotsBefore=await page.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.nbhFill||'-').join(','));
  await click(page,F.sim);await sleep(300);
  if(await dlgOpen(page)){say('  sim asks:',await dlgHead(page));await dlgOk(page);}
  await sleep(1500);
  const dots=await page.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.view+'='+(b.dataset.nbhFill||'-')+(b.title?'('+b.title.replace(/ fields filled/,'')+')':'')).join(' '));
  say('  dots before sim:',dotsBefore);say('  dots after sim: ',dots);
  if(!/=done|=part/.test(dots))bad('no progress dots');
  // Task U: a middle row through the styled dialog, Cancel, then Clear all
  if(F.rowSel){await click(page,'#viewSeg button[data-view="'+F.rowTab+'"]');await sleep(200);
   const n0=await page.evaluate(F.count);
   await page.evaluate(s=>{const b=document.querySelectorAll(s);b[Math.floor(b.length/2)].click();},F.rowSel);await sleep(150);
   say('  row delete asks:',await dlgHead(page));await dlgOk(page);await sleep(300);
   const n1=await page.evaluate(F.count);
   await page.evaluate(s=>{const b=document.querySelectorAll(s);b[Math.floor(b.length/2)].click();},F.rowSel);await sleep(150);
   const asked=await dlgOpen(page);await dlgCancel(page);await sleep(200);
   const n2=await page.evaluate(F.count);
   say('  rows',n0,'-> delete middle via dialog ->',n1,'-> cancel ->',n2,asked?'':'(NO DIALOG ON SECOND)');
   if(n1!==n0-1||n2!==n1||!asked)bad('row delete');}
  if(F.replaceBtn){await click(page,'#viewSeg button[data-view="'+F.replaceTab+'"]');await sleep(150);
   const c0=await page.evaluate(F.replaceCount);await click(page,F.replaceBtn);await sleep(150);
   say('  replace asks:',await dlgHead(page));await dlgCancel(page);await sleep(150);const c1=await page.evaluate(F.replaceCount);
   await click(page,F.replaceBtn);await sleep(150);await dlgOk(page);await sleep(300);const c2=await page.evaluate(F.replaceCount);
   say('  replace table rows',c0,'-> cancel',c1,'-> replace',c2);if(c1!==c0)bad('replace cancel');}
  const pagesAfterSim=await pages(page);
  // clear all through the dialog
  await click(page,F.clear);await sleep(150);say('  clear asks:',await dlgHead(page));
  await dlgCancel(page);await sleep(150);const keep=await page.evaluate(F.cleared);
  await click(page,F.clear);await sleep(150);await dlgOk(page);
  if(F.reloads){await page.waitForLoadState('load');await sleep(900);}else await sleep(400);
  const gone=await page.evaluate(F.cleared);
  say('  clear: cancel keeps',keep,'| clear all ->',gone);if(!(keep>0&&gone===0))bad('clear all');
  const pagesEmpty=await pages(page);
  say('  print pages: empty',pagesEmpty,'after sim',pagesAfterSim);
  // compact toolbar: the quick save shows
  const q=await page.evaluate(()=>{const q=document.getElementById('nbhSaveQuick');return q?getComputedStyle(q).display:'missing';});
  say('  quick save display (compact',await page.evaluate(()=>document.documentElement.classList.contains('nbh-compact')),'):',q);
  await page.screenshot({path:__dirname+'/out/v2134/'+F.id+'-verify.png'});
  const errs=log.filter(l=>l.type!=='warning');say('  errors:',JSON.stringify(errs).slice(0,400));if(errs.length)bad('errors');
  await page.close();}
 await br.close();say('FAILS',fails);
 fs.writeFileSync(__dirname+'/out/v2134/verify.out',out.join('\n')+'\n');
 process.exit(fails?1:0);})().catch(e=>{console.error('CRASH',e);process.exit(2);});
