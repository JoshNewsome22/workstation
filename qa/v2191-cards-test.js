/* v21.91 the caseload's students as cards, on the start screen and in Caseload: one column on a phone (390), two on an iPad
   held upright (820), three or more on an iPad held sideways (1180) and a laptop (1440); no sideways scrolling; 44 px
   targets. Each card: the photo's 96 px copy kept with the student (made at Save case, or the first time for a student kept
   before), never shown with Initials only; the school and grade; the main target behavior's recent days as a small line
   whose points are the data's; what needs you first with its Open; when and where the student was last saved (and Google
   Drive); Open and Remove as before; an actions area for more buttons.
   Simulated students only (Mateo Rivera 4471823; SIMULATED – Sample Student; SIMULATED – Sample Student 2).
   usage: node qa/v2191-cards-test.js */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const UA={ipad:'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphone:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  mac:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'};
const OUT=__dirname+'/out/v2191-cards/';
const ELOP=[5,4,6,5,4,4,3,5,3,3,2,3,2,2,1,2,1,1,0,1,1,0,0,1,0];
async function shell(br,vp,ua,touch){const ctx=await br.newContext({viewport:vp,userAgent:ua,hasTouch:!!touch,isMobile:!!touch&&vp.width<500,serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};wsUI.choose=async()=>'switch';
    try{['nbh.caseload.off','nbh.caseload.ini','nbh.drive.on'].forEach(k=>localStorage.removeItem(k));}catch(e){}const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));});
  return {ctx,page,errs};}
const photo=(page,c1,c2)=>page.evaluate(([c1,c2])=>{const c=document.createElement('canvas');c.width=240;c.height=240;const g=c.getContext('2d');g.fillStyle=c1;g.fillRect(0,0,240,240);g.fillStyle=c2;g.beginPath();g.arc(120,100,55,0,7);g.fill();g.fillRect(50,170,140,70);return c.toDataURL('image/jpeg',0.8);},[c1,c2]);
/* how the cards sit: how many across in the first row, sideways scrolling, the smallest target */
const measure=(page,root)=>page.evaluate(root=>{const R=document.querySelector(root),C=[...R.querySelectorAll('.cl-card')];const t0=C.length?Math.round(C[0].getBoundingClientRect().top):0;
  const across=C.filter(c=>Math.abs(Math.round(c.getBoundingClientRect().top)-t0)<=2).length;
  const tg=[...R.querySelectorAll('.cl-card button,.cl-find input')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),b.textContent.trim().slice(0,20)||b.id];});
  const sc=document.scrollingElement||document.documentElement,box=R.closest('#dlgBody')||R.closest('.blank');
  return {n:C.length,across,minH:Math.min(...tg.map(x=>x[1])),minW:Math.min(...tg.map(x=>x[0])),small:tg.filter(x=>x[0]<44||x[1]<44).slice(0,4),
    page:sc.scrollWidth-innerWidth,box:box?box.scrollWidth-box.clientWidth:0,cards:C.filter(c=>c.scrollWidth>c.clientWidth+1).length,acts:C.filter(c=>c.querySelector('.cl-card-acts')).length};},root);
(async()=>{const br=await chromium.launch();
  try{
  /* the three students: Mateo kept by Save case's own path (Form DD-1 simulated, his photo); the other two as records */
  const A=await shell(br,{width:1440,height:900},UA.mac,false);
  await A.page.evaluate(()=>{const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');set('#pGrade','5');});
  const ph1=await photo(A.page,'#7fa7b8','#f1d3b5'),ph2=await photo(A.page,'#c9b27c','#5a3d2b');
  await A.page.evaluate(v=>setPhoto(v),ph1);
  await A.page.evaluate(()=>openForm('DD-1'));await A.page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:40000});await sleep(1500);
  const dd=A.page.frames().find(f=>/Daily_Behavior/.test(f.url()));await dd.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}document.querySelector('#btnLoadExample').click();});await sleep(2500);
  const kept=await A.page.evaluate(async()=>{await gatherFacts(false);const k=await caseKeepOnly();await new Promise(r=>setTimeout(r,800));const r=(await clList()).find(x=>x.client==='Mateo Rivera');return {k,thumb:r&&r.thumb,trend:r&&r.sum&&r.sum.trend,saved:r&&r.saved,dev:r&&r.dev};});
  const dims=kept.thumb&&kept.thumb.src?await A.page.evaluate(src=>new Promise(res=>{const i=new Image();i.onload=()=>res([i.naturalWidth,i.naturalHeight,src.length]);i.onerror=()=>res(null);i.src=src;}),kept.thumb.src):null;
  ok('1 Save case keeps a 96 px JPEG copy of the photo with the student (and the trend from Form DD-1)',kept.k&&!!kept.thumb&&kept.thumb.at===kept.saved&&/^data:image\/jpeg;base64,/.test(kept.thumb.src)&&!!dims&&dims[0]>0&&dims[0]<=96&&dims[1]<=96&&dims[2]<20000&&!!kept.trend&&kept.trend.pts.length>0,{k:kept.k,at:kept.thumb&&kept.thumb.at,saved:kept.saved,dims,trend:kept.trend&&kept.trend.name});
  await A.page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();});await sleep(900);
  const iso=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const days=ELOP.map((v,i)=>({date:iso(i-ELOP.length-1),vals:{'Mand for help':i%3,'Elopement':v}}));
  const recs=await A.page.evaluate(async([ph2,days])=>{const now=Date.now();
    const mk=(p,saved,facts,sum,extra)=>Object.assign({key:clKey(p),scope:clScope(),client:p.client,sid:p.sid,site:p.site,grade:p.grade,bcba:'',saved,sum,
      text:JSON.stringify({form:'CASE',rev:'2026-09',saved,packet:p,forms:{'IC-1':{title:'Informed Consent',snap:{total:1,data:{},own:''}}},facts})},extra||{});
    const B=mk({client:'SIMULATED – Sample Student',sid:'SIM-0002',site:'Sample Elementary',grade:'3'},new Date(now-864e5).toISOString(),{src:{}},
      {items:[{k:'Due',t:'The plan review is due Friday (Form PR-1)',open:'PR-1'},{k:'Overdue',t:'The parent notice for the restraint on 10/8 is overdue',open:'CR-1'}],lastData:'',forms:1},{dev:'laptop',drv:{id:'f9',ver:'4',dirty:false}});
    const C=mk({client:'SIMULATED – Sample Student 2',sid:'SIM-0003',site:'Sample Middle',grade:'7',photo:ph2},new Date(now-3*864e5).toISOString(),
      {src:{data:'DD-1'},data:{from:days[0].date,to:days[days.length-1].date,days:days.length,src:'DD-1',behaviors:[{name:'Mand for help',kind:'replacement',unit:'occurrences',days:days.length},{name:'Elopement',kind:'target',unit:'occurrences',days:days.length}],byDay:days}},
      {items:[],lastData:days[days.length-1].date,forms:1});
    await clTx('readwrite',st=>{st.put(B);st.put(C);});return (await clList()).map(r=>JSON.parse(JSON.stringify(r)));},[ph2,days]);
  const recC0=recs.find(r=>r.client==='SIMULATED – Sample Student 2');
  ok('1b the student kept before v21.91 has no photo copy and no trend yet',!!recC0&&!recC0.thumb&&!('trend' in (recC0.sum||{})));
  await A.ctx.close();
  const WIDTHS=[[390,844,UA.iphone,true,1],[820,1180,UA.ipad,true,2],[1180,820,UA.ipad,true,3],[1440,900,UA.mac,false,3]];
  let last=null;
  for(const [w,h,ua,touch,cols] of WIDTHS){const S=await shell(br,{width:w,height:h},ua,touch);
    await S.page.evaluate(async R=>{await clTx('readwrite',st=>{R.forEach(r=>st.put(r));});},recs);
    await S.page.evaluate(()=>paintBlank());await sleep(1800);
    const b=await measure(S.page,'#blankCl');
    ok('2 '+w+' wide, the start screen: '+cols+(cols>=3?' or more':'')+' card'+(cols===1?'':'s')+' across, no sideways scrolling, every target at least 44 px, an actions area in each',
      b.n===3&&(cols>=3?b.across>=3:b.across===cols)&&b.page<=0&&b.box<=1&&!b.cards&&b.minH>=44&&b.minW>=44&&b.acts===3,b);
    await S.page.screenshot({path:OUT+'blank-'+w+'.png',fullPage:false});
    await S.page.evaluate(()=>caseloadOpen());await sleep(900);
    const d=await measure(S.page,'#dlgBody');
    const keep=await S.page.evaluate(()=>({needs:[...document.querySelectorAll('#dlgBody h3.cl-h')].map(h=>h.textContent),list:document.querySelectorAll('#dlgBody .td-list li').length}));
    ok('3 '+w+' wide, Caseload: '+cols+(cols>=3?' or more':'')+' across, no sideways scrolling, 44 px targets; “What needs you, across the caseload” still above the students',
      d.n===3&&(cols>=3?d.across>=3:d.across===cols)&&d.page<=0&&d.box<=1&&!d.cards&&d.minH>=44&&d.minW>=44&&d.acts===3&&keep.needs.indexOf('What needs you, across the caseload')>=0&&keep.needs.indexOf('What needs you, across the caseload')<keep.needs.indexOf('Students')&&keep.list>=2,{d,keep});
    await S.page.screenshot({path:OUT+'caseload-'+w+'.png',fullPage:false});
    await S.page.evaluate(()=>{const b=document.getElementById('dlgBody');b.scrollTop=b.scrollHeight;});await sleep(200);
    await S.page.screenshot({path:OUT+'caseload-'+w+'-cards.png',fullPage:false});
    await S.page.evaluate(()=>{try{$('#dlg').close();}catch(e){}});
    if(w!==1440){ok('3b no page errors ('+w+')',!S.errs.length,S.errs.slice(0,3));await S.ctx.close();}else last=S;}
  const {page,errs}=last;
  /* the student kept before: the photo copy and the trend made the first time the card was shown, and kept */
  const C=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='SIMULATED – Sample Student 2'),card=[...document.querySelectorAll('#blankCl .cl-card')].find(c=>c.dataset.clrow===r.key);
    const img=card&&card.querySelector('.cl-ph img');return {thumb:r.thumb,saved:r.saved,trend:r.sum&&r.sum.trend,img:img&&img.getAttribute('src'),pts:card&&card.querySelector('.cl-spark')&&card.querySelector('.cl-spark').dataset.pts,name:card&&(card.querySelector('.cl-tt b')||{}).textContent,poly:card&&card.querySelector('.cl-spark polyline')&&card.querySelector('.cl-spark polyline').getAttribute('points').split(' ').length,tt:card&&card.querySelector('.cl-tt').textContent};});
  const want=ELOP.slice(-20);
  ok('4 a student kept before: the photo copy is made the first time and kept with them, and shown',!!C.thumb&&C.thumb.at===C.saved&&/^data:image\/jpeg/.test(C.thumb.src)&&C.img===C.thumb.src,{thumb:!!C.thumb,at:C.thumb&&C.thumb.at,saved:C.saved,img:!!C.img});
  ok('5 the trend line: the main target behavior (Elopement, not the replacement), its last 20 days, the points are the data',!!C.trend&&C.trend.name==='Elopement'&&C.name==='Elopement'&&C.pts===want.join(' ')&&C.poly===20&&C.trend.pts.map(p=>p[1]).join(' ')===want.join(' ')&&/4 → 0 occurrences/.test(C.tt)&&/20 days/.test(C.tt),{C,want});
  const Am=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='Mateo Rivera'),d=JSON.parse(r.text).facts.data,B=d.behaviors||[];
    const up=b=>/replacement|acquisition|skill/i.test(b.kind||'')||b.direction==='increase',has=b=>(d.byDay||[]).some(x=>x.vals&&x.vals[b.name]!=null),m=B.find(b=>!up(b)&&has(b))||B.find(has);
    const card=[...document.querySelectorAll('#blankCl .cl-card')].find(c=>c.dataset.clrow===r.key),sp=card&&card.querySelector('.cl-spark');
    return {want:m&&d.byDay.filter(x=>x.vals&&x.vals[m.name]!=null).slice(-20).map(x=>x.vals[m.name]).join(' '),name:m&&m.name,pts:sp&&sp.dataset.pts,shown:card&&(card.querySelector('.cl-tt b')||{}).textContent,img:!!(card&&card.querySelector('.cl-ph img'))};});
  ok('6 Mateo’s trend line: Form DD-1’s main target behavior and its days, point for point',!!Am.want&&Am.pts===Am.want&&Am.shown===Am.name&&Am.img,Am);
  /* what needs you next, and when and where saved */
  const B1=await page.evaluate(async()=>{const r=(await clList()).find(x=>x.client==='SIMULATED – Sample Student'),c=[...document.querySelectorAll('#blankCl .cl-card')].find(x=>x.dataset.clrow===r.key);
    const n=c.querySelector('.cl-next'),b=n&&n.querySelector('button');return {hot:c.classList.contains('hot'),k:n&&n.querySelector('.td-k').textContent,t:n&&n.textContent,btn:b&&b.textContent,form:b&&b.dataset.clform,open:b&&b.dataset.clopen===r.key,saved:c.querySelector('.cl-saved').textContent};});
  ok('7 what needs you next: the most urgent item (Overdue before Due), with “and 1 more” and its Open CR-1',B1.k==='Overdue'&&/parent notice/.test(B1.t)&&/and 1 more/.test(B1.t)&&B1.btn==='Open CR-1'&&B1.form==='CR-1'&&B1.open&&B1.hot,B1);
  const sv=await page.evaluate(()=>[...document.querySelectorAll('#blankCl .cl-card')].map(c=>[c.querySelector('.cl-nm').textContent,c.querySelector('.cl-saved').textContent]));
  const sOf=n=>(sv.find(x=>x[0]===n)||[])[1]||'';
  ok('8 when and where: “Saved today on this Mac”, “Saved yesterday on the laptop”, “Saved 3 days ago”',/^Saved today on this Mac/.test(sOf('Mateo Rivera'))&&sOf('Sample Student')==='Saved yesterday on the laptop'&&sOf('Sample Student 2')==='Saved 3 days ago',sv);
  const sub=await page.evaluate(()=>[...document.querySelectorAll('#blankCl .cl-card')].map(c=>c.querySelector('.cl-sub').textContent+' | '+(c.querySelector('.cl-sid')||{}).textContent));
  ok('8b the school and grade (and the ID)',sub.some(s=>/^Royal Palm School · Grade 5 \| ID 4471823$/.test(s))&&sub.some(s=>/^Sample Middle · Grade 7/.test(s)),sub);
  /* Initials only: no photos, initials, no ID */
  await page.evaluate(()=>caseloadOpen());await sleep(700);
  await page.evaluate(()=>{const c=document.getElementById('clIni');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
  const I=await page.evaluate(()=>({img:document.querySelectorAll('#dlgBody .cl-card img').length,ini:[...document.querySelectorAll('#dlgBody .cl-card .cl-ini')].map(x=>x.textContent),nm:[...document.querySelectorAll('#dlgBody .cl-card .cl-nm')].map(x=>x.textContent),txt:document.querySelector('#dlgBody .cl-cards').textContent,
    blank:document.querySelectorAll('#blankCl .cl-card img').length}));
  ok('9 Initials only: no photo on any card (Caseload and the start screen), the initials instead, no name and no ID',I.img===0&&I.blank===0&&I.ini.includes('MR')&&I.nm.includes('M. R.')&&I.nm.includes('S. S.')&&!/Mateo|Rivera|4471823|SIM-000/.test(I.txt),I);
  await page.screenshot({path:OUT+'caseload-initials-1440.png'});
  await page.evaluate(()=>{const c=document.getElementById('clIni');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(700);
  /* Google Drive in use: where it is */
  await page.evaluate(()=>{localStorage.setItem('nbh.drive.on','1');caseloadOpen();});await sleep(900);
  const dv=await page.evaluate(()=>[...document.querySelectorAll('#dlgBody .cl-card')].map(c=>[c.querySelector('.cl-nm').textContent,c.querySelector('.cl-saved').textContent]));
  const dOf=n=>(dv.find(x=>x[0]===n)||[])[1]||'';
  ok('10 with Google Drive: “Saved yesterday on the laptop · in Google Drive”; one not sent yet says so',dOf('Sample Student')==='Saved yesterday on the laptop · in Google Drive'&&/· waiting for Google Drive$/.test(dOf('Mateo Rivera')),dv);
  await page.evaluate(()=>{localStorage.removeItem('nbh.drive.on');caseloadOpen();});await sleep(800);
  /* Open, the next item's Open, Remove */
  const kC=await page.evaluate(async()=>(await clList()).find(x=>x.client==='SIMULATED – Sample Student 2').key);
  await page.evaluate(k=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.dataset.clrow===k);c.querySelector('.cl-card-acts [data-clopen]').click();},kC);
  await page.waitForFunction(()=>packet().client==='SIMULATED – Sample Student 2',null,{timeout:30000}).catch(()=>{});await sleep(800);
  const o1=await page.evaluate(()=>({who:packet().client,dlg:document.getElementById('dlg').open}));
  ok('11 a card’s Open opens that student’s case',o1.who==='SIMULATED – Sample Student 2'&&!o1.dlg,o1);
  await page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();});await sleep(900);await page.evaluate(()=>paintBlank());await sleep(700);
  await page.evaluate(()=>{const c=[...document.querySelectorAll('#blankCl .cl-card')].find(x=>x.querySelector('.cl-nm').textContent==='Sample Student');c.querySelector('.cl-next [data-clopen]').click();});
  await page.waitForFunction(()=>packet().client==='SIMULATED – Sample Student'&&state.cur==='CR-1',null,{timeout:30000}).catch(()=>{});
  const o2=await page.evaluate(()=>({who:packet().client,cur:state.cur}));
  ok('12 the next item’s Open opens the student at that form (Form CR-1)',o2.who==='SIMULATED – Sample Student'&&o2.cur==='CR-1',o2);
  await page.evaluate(async()=>{state.lastSig=caseSig();await clearCase();});await sleep(800);
  await page.evaluate(()=>caseloadOpen());await sleep(700);
  const kB=await page.evaluate(async()=>(await clList()).find(x=>x.client==='SIMULATED – Sample Student').key);
  await page.evaluate(k=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(x=>x.dataset.clrow===k);c.querySelector('[data-cldel]').click();},kB);await sleep(900);
  const rm=await page.evaluate(async k=>({left:(await clList()).map(r=>r.client),cards:[...document.querySelectorAll('#dlgBody .cl-card')].map(c=>c.dataset.clrow).includes(k)}),kB);
  ok('13 Remove takes the student off this device and off the cards',rm.left.length===2&&!rm.left.includes('SIMULATED – Sample Student')&&!rm.cards,rm);
  ok('14 no page errors (1440)',!errs.length,errs.slice(0,3));
  await last.ctx.close();
  }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e).slice(0,800));}
  finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
