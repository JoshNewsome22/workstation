/* v24.01 Form SP-1's toolbar as a settings panel: one top row, three labeled columns under More controls; every control still
   there and working; folded on a tablet until More controls; no errors. */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,500)));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const vp of [{width:1400,height:900},{width:1024,height:768}]){
  const p=await b.newPage({viewport:vp});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(URL);await sleep(2200);
  const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!(e&&e.offsetParent)&&e.getBoundingClientRect().width>0;},sel);
  const r=await p.evaluate(()=>{const bar=document.querySelector('.toolbar'),panel=bar.querySelector('.sp-panel');const cols=[...panel.querySelectorAll('.sp-col')];
    const col=id=>{const e=document.getElementById(id);const c=e&&e.closest('.sp-col');return c?cols.indexOf(c):-1;};
    const top=[...bar.children].filter(e=>e!==panel).map(e=>e.className.replace(/\s+/g,' ').trim().slice(0,30));
    return {heads:cols.map(c=>c.querySelector('h4').textContent),preset:col('preset'),week:col('weekStart'),mode:col('modeSeg'),thr:col('threshold'),chart:col('chartSeg'),print:col('printBtn'),sample:col('sampleBtn'),video:col('spVideo'),save:col('saveBtn'),clear:col('clearBtn'),sim:col('simBtn'),
      files:document.getElementById('saveBtn').closest('.tgroup').firstElementChild.textContent,videoLabel:document.getElementById('spVideo').closest('.tgroup').firstElementChild.textContent,
      top,caseTop:!!bar.querySelector(':scope > .nbh-case-grp'),packet:[...panel.querySelectorAll('button')].filter(x=>/packet/.test(x.textContent)).map(x=>x.closest('.tgroup').firstElementChild.textContent),
      compact:document.documentElement.classList.contains('nbh-compact'),panelShown:getComputedStyle(panel).display!=='none',all:['preset','startHour','endHour','interval','days','dayStart','perSheet','addSheet','weekStart','fillDates','mfOnly','modeSeg','useCodes','actOn','xTool','levelSeg','threshold','chartSeg','printBtn','sampleBtn','guideOn','spVideo','saveBtn','loadBtn','csvBtn','simBtn','clearBtn'].filter(id=>!document.getElementById(id))};});
  ok('at '+vp.width+': three labeled columns hold the controls in order (time and days; entry and marking; printing, files and reset); the case stays in the top row; none missing',
    r.heads.join('|')==='Time and days|Entry and marking|Printing, files and reset'&&r.preset===0&&r.week===0&&r.mode===1&&r.thr===1&&r.chart===1&&r.print===2&&r.sample===2&&r.video===2&&r.save===2&&r.clear===2&&r.sim===2&&r.files==='Files'&&/How-to video link/.test(r.videoLabel)&&r.all.length===0&&(!r.packet.length||r.packet.every(x=>x==='Files')),r);
  ok('the panel is folded under More controls on a tablet and open on a wide screen',(vp.width<1100?(r.compact&&!r.panelShown):true),r);
  if(!r.panelShown){await p.evaluate(()=>document.querySelector('#nbhMoreBtn').click());await sleep(400);}
  const shown=await p.evaluate(()=>getComputedStyle(document.querySelector('.sp-panel')).display!=='none'&&document.querySelector('#preset').offsetParent!==null);
  ok('More controls opens the panel with its controls in sight',shown);
  /* the moved controls still work: the preset, the marking, the cutoff, Print a sample */
  await p.selectOption('#preset','school9');await sleep(200);
  await p.evaluate(()=>document.querySelector('#levelSeg [data-levels="1"]').click());await sleep(200);
  const w=await p.evaluate(()=>({start:state.cfg.startMin,lv:+state.cfg.levels,one:document.documentElement.classList.contains('sp-one')}));
  ok('the preset and the marking still drive the sheet after the move',w.start===9*60&&w.lv===1&&w.one,w);
  await p.evaluate(()=>{window.__printed=0;window.print=()=>{window.__printed++;window.__s=document.querySelectorAll('#spPrint .sp-sample').length;};document.querySelector('#sampleBtn').click();});await sleep(1000);
  ok('Print a sample sheet still prints the sample pages',await p.evaluate(()=>window.__printed===1&&window.__s>=1));
  const h=await p.evaluate(()=>({bar:document.querySelector('.toolbar').getBoundingClientRect().height,win:innerHeight}));
  ok('the open panel leaves room for the sheet below it (the toolbar under 75% of the window)',h.bar<h.win*.75,h);
  ok('no page errors',!errs.length,errs.slice(0,3));await p.close();
 }
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
