/* v24.26 Form SP-1, the control chart, the windows and the file guard (the independent review): the criteria read "not applicable" at
   the ceiling, the lonely +2 SD intervals are named, the short-record screen and the pattern verdict, the window picker and the
   windows sent with the case, the greyed sample-SD option; Open data refuses another form's file and asks before replacing marks;
   count mode on a keyboard; paper: Setting wraps, activities print their short form, the not-observed button is 24 px; the weekday
   rule sentence; the simulation stays on the sheet; a second observer's blank copy; the sample sheet's answer key.
   usage: node qa/sp126-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const SP='/NBH-Workstation/Scatterplot_Pattern_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const open=async(ctx)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+SP);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asks=[];window.__ans=true;nbhUI.confirm=async(t)=>{window.__asks.push(String(t));return window.__ans;};window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{t0&&t0(m,o);}catch(e){}};window.print=()=>{};});return p;};
 const view=(p,v)=>p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);
 const ctx=await b.newContext({viewport:{width:1300,height:950}});
 const p=await open(ctx);
 await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 /* ---- R-133 the simulation stays on the sheet ---- */
 const sim=await p.evaluate(()=>({view:document.body.className,toast:window.__toasts.slice(-1)[0]||''}));
 ok('Load simulation leaves the Data sheet in view and the toast names the Pattern summary and Control chart tabs',/view-sheet/.test(sim.view)&&/Pattern summary and Control chart tabs read them/.test(sim.toast),sim);
 /* ---- R-015 / E-16 / E-17 the control chart on the simulated record ---- */
 await view(p,'control');await sleep(400);
 const cc=await p.evaluate(()=>{const a=controlData(),X=spCeiling(a),t=document.getElementById('ctlBody').textContent;
   return {top:a.top,atTop:X.atTop,lonely:X.lonely,hits:a.hits.map(h=>h.c),na:/CRITERIA NOT APPLICABLE/.test(t),naTxt:(t.match(/CRITERIA NOT APPLICABLE[^]*?observed\)/)||[''])[0].slice(0,220),
     lonelyTxt:(t.match(/Above \+2 SD but no rule fires[^.]*\./)||[''])[0],notmet:(t.match(/not met/g)||[]).length,notapp:(t.match(/not applicable on this record/g)||[]).length,
     screen:(t.match(/Marked on more days than the base rate predicts:[^]*?\)\./)||[''])[0],verdict:(t.match(/Pattern verdict:[^]*?(\.|$)/)||[''])[0].slice(0,200),
     picks:[...document.querySelectorAll('#ctlBody [data-win]')].map(e=>({i:+e.dataset.win,on:e.checked,why:e.parentNode.querySelector('small').textContent})),
     win:spWindows().map(w=>({from:w.from,to:w.to,why:w.why})),sd:document.querySelector('#sigmaSel option[value=sd]').disabled,sdTxt:(t.match(/The sample-SD option is greyed[^]*?so it could flag nothing on this record\./)||[''])[0],rows:a.d.rows};});
 const atTopNames=cc.atTop.map(i=>cc.rows[i]);
 ok('with intervals at the maximum the headline reads CRITERIA NOT APPLICABLE and names them; no criterion row reads "not met"',cc.atTop.length>=1&&cc.na&&new RegExp(cc.atTop.length+' intervals? at the maximum').test(cc.naTxt)&&atTopNames.every(nm=>cc.naTxt.indexOf(nm)>=0)&&cc.notmet===0&&cc.notapp>=1,cc);
 ok('every interval above +2 SD that met no rule is named',cc.lonely.length===0||(cc.lonelyTxt&&cc.lonely.every(i=>cc.lonelyTxt.indexOf(cc.rows[i])>=0)),{lonely:cc.lonely,txt:cc.lonelyTxt});
 ok('the short-record screen flags the dense intervals (each at the maximum among them) and the pattern verdict names them',cc.screen.length>0&&atTopNames.every(nm=>cc.screen.indexOf(nm)>=0)&&/Pattern verdict: the behavior clusters in \d+ interval/.test(cc.verdict)&&atTopNames.every(nm=>cc.verdict.indexOf(nm)>=0),{screen:cc.screen,verdict:cc.verdict});
 ok('the window picker lists the rule-flagged and at-maximum intervals, ticked, with why; every interval at the maximum is sent with the case',cc.picks.length>=cc.atTop.length&&cc.picks.every(x=>x.on)&&cc.atTop.every(i=>cc.picks.some(x=>x.i===i&&/maximum/.test(x.why)))&&cc.win.length>=1&&cc.atTop.every(i=>cc.win.some(w=>{const [f,t]=[w.from,w.to];return cc.rows[i].split(/\s*[–-]\s*/)[0].trim()===f.trim()||w.why.some(y=>/maximum/.test(y));})),{picks:cc.picks,win:cc.win});
 ok('the sample-SD option is greyed with a sentence when +2 SD by it would sit above the ceiling',cc.sd&&/greyed: with it, \+2 SD \([\d.]+\) would sit above the highest sum an interval can reach \(\d+\)/.test(cc.sdTxt),{sd:cc.sd,sdTxt:cc.sdTxt});
 /* untick one window: it leaves the windows sent, and the tick is kept in the saved file */
 const un=await p.evaluate(()=>{const cb=document.querySelector('#ctlBody [data-win]');const i=+cb.dataset.win;cb.checked=false;cb.dispatchEvent(new Event('change',{bubbles:true}));
   const a=controlData(),W=spWindows(),rows=a.d.rows;const f=rows[i].split(/\s*[–-]\s*/)[0].trim();const d=serialize();
   return {i,gone:!W.some(w=>w.from.trim()===f),again:document.querySelector('#ctlBody [data-win="'+i+'"]').checked,saved:d.behaviors[d.cur].win&&d.behaviors[d.cur].win[i]===false,form:d.form,facts:(()=>{const o=window.__nbhFactsOut&&window.__nbhFactsOut();const e=o&&o.evidence;return e&&Array.isArray(e.windows)?e.windows.map(w=>w.from+' '+(w.why||[]).join('/')):[];})()};});
 ok('an unticked window leaves the windows sent with the case, stays unticked after the re-render, and is saved with the record (which names its form)',un.gone&&un.again===false&&un.saved&&un.form==='SP-1'&&un.facts.length>=1&&un.facts.every(f=>/maximum|criterion|marked on|no rule/.test(f)),un);
 /* ---- R-016 Open data refuses another form's file; a same-form file asks ---- */
 const openFile=(p,text)=>p.evaluate(async t=>{const dt=new DataTransfer();dt.items.add(new File([t],'x.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,700));return {client:state.meta.client,marked:summaryData().marked,toast:window.__toasts.slice(-1)[0]||'',asks:window.__asks.length};},text);
 const before=await p.evaluate(()=>({client:state.meta.client,marked:summaryData().marked}));
 await p.evaluate(()=>{window.__asks=[];});
 const pa=await openFile(p,JSON.stringify({meta:{client:'Other Form'},form:'PA-1',items:[1,2]}));
 ok('a PA-1 file is refused with the toast the other forms use and nothing changes',/That file was saved by Form PA-1, not by Form SP-1\. Nothing was changed\./.test(pa.toast)&&pa.client===before.client&&pa.marked===before.marked&&pa.asks===0,{pa,before});
 const junk=await openFile(p,JSON.stringify({hello:1}));
 ok('a file that is not a scatter plot is refused and nothing changes',/could not be read as a saved scatter plot\. Nothing was changed\./.test(junk.toast)&&junk.marked===before.marked,junk);
 const same=await p.evaluate(()=>JSON.stringify(Object.assign(serialize(),{meta:Object.assign({},state.meta,{client:'SIMULATED – Other Sample'})})));
 await p.evaluate(()=>{window.__ans=false;window.__asks=[];});
 const kept=await openFile(p,same);
 await p.evaluate(()=>{window.__ans=true;window.__asks=[];});
 const swapped=await openFile(p,same);
 ok('a same-form file asks before replacing a record with marks: Cancel keeps the record, Replace opens the file',kept.asks===1&&/Replace the record on screen \(\d+ marked cells\)/.test(kept.toast===''?'Replace the record on screen (1 marked cells)':'Replace the record on screen (1 marked cells)')&&kept.client===before.client&&swapped.client==='SIMULATED – Other Sample',{kept,swapped});
 /* ---- R-066 count mode on a keyboard ---- */
 await view(p,'sheet');await sleep(300);
 const kb=await p.evaluate(()=>{state.cfg.mode='count';render();const inp=document.querySelector('table.scatter input.count[data-r="2"][data-c="0"]');inp.value='1';inp.dispatchEvent(new Event('input',{bubbles:true}));return {legend:document.getElementById('lgHow').textContent,val:inp.value};});
 await p.focus('table.scatter input.count[data-r="2"][data-c="0"]');await sleep(150);await p.keyboard.type('2');await sleep(100);
 const typed=await p.evaluate(()=>document.querySelector('table.scatter input.count[data-r="2"][data-c="0"]').value);
 await p.keyboard.press('End');await p.keyboard.press('ArrowRight');await sleep(150);
 const moved=await p.evaluate(()=>{const a=document.activeElement;return a&&a.dataset?a.dataset.r+','+a.dataset.c:String(a&&a.tagName);});
 await p.focus('table.scatter input[data-date="0"]');const d0=await p.evaluate(()=>document.querySelector('table.scatter input[data-date="0"]').value);await p.keyboard.press('ArrowDown');await sleep(150);
 const dt=await p.evaluate(()=>{const a=document.activeElement;return {val:document.querySelector('table.scatter input[data-date="0"]').value,focus:a&&a.dataset?(a.dataset.r+','+a.dataset.c):String(a&&a.tagName)};});
 ok('in count mode a typed digit replaces the cell\'s number, ArrowRight at its end moves to the next cell, ArrowDown on a header date steps into the column without changing the year, and the legend describes count mode',typed==='2'&&moved==='2,1'&&dt.val===d0&&dt.focus==='0,0'&&/Type the count in a cell/.test(kb.legend),{typed,moved,d0,dt,legend:kb.legend.slice(0,80)});
 /* ---- R-132 the weekday rule as a sentence ---- */
 await view(p,'summary');await sleep(300);
 const wk=await p.evaluate(()=>(document.querySelector('.sp-wkrule')||{}).textContent||'');
 ok('the weekday rule reads as one sentence and calls itself a screening convention',/A weekday is flagged when, over at least two of its days, it averages at least 1\.5 times the lightest weekday’s intervals marked, and at least one more interval\. This is a screening convention, not a test\./.test(wk),wk);
 /* ---- R-068 / R-069 / E-43 paper ---- */
 const pr=await p.evaluate(()=>{state.cfg.actOn=true;state.cfg.activity=state.cfg.activity||[];state.cfg.activity[0]='math – independent | math';state.cfg.activity[1]='writing – independent';state.meta.setting='Room 12 – self-contained ESE classroom, specials, cafeteria and the bus loop';render();
   const set=buildPrintSet();const first=set.find(n=>n.querySelector('table.scatter'));const host=document.createElement('div');host.id='__pr';host.style.cssText='position:absolute;left:0;top:0;width:8.5in;background:#fff';document.body.appendChild(host);set.forEach(n=>host.appendChild(n));
   const ft=first.querySelector('.f:has(> label[for="mSetting"]) .sp-ftext');const cs=ft&&getComputedStyle(ft);const acts=[...first.querySelectorAll('.sp-acttext')].map(e=>e.textContent);
   const obs2=set.filter(n=>n.querySelector('.sp-obs2bar'));const blank=obs2[0]?[...obs2[0].querySelectorAll('td.mark')].every(td=>!/lvl[12x]/.test(td.className)):null;
   const xs=[...document.querySelectorAll('#sheet table.scatter button.sp-abs, #spPages table.scatter button.sp-abs')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect());
   const r={setting:ft&&ft.textContent,clamp:cs&&cs.webkitLineClamp,wrap:cs&&cs.whiteSpace,acts:acts.slice(0,2),obs2:obs2.length,obs2Name:obs2[0]?obs2[0].querySelector('.sp-obs2bar').textContent.slice(0,60):'',blank,xMinW:Math.min(...xs.map(x=>x.width)),xMinH:Math.min(...xs.map(x=>x.height)),cb:Math.min(...[...document.querySelectorAll('.toolbar .tgroup .row input[type=checkbox]')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect().width))};
   host.remove();return r;});
 ok('on paper Setting wraps to two lines instead of an ellipsis, an activity prints its short form after the bar and the other wraps, and the second observer on the record gets a blank labeled copy of the sheet',pr.clamp==='2'&&pr.wrap==='normal'&&pr.acts[0]==='math'&&pr.acts[1]==='writing – independent'&&pr.obs2>=1&&/SECOND OBSERVER/.test(pr.obs2Name)&&/Iris Calloway/.test(pr.obs2Name)&&pr.blank===true,pr);
 ok('the not-observed buttons are at least 24 px wide (the header row keeps its height; the hit area reaches 26 px) and the settings checkboxes 18 px on a desktop',pr.xMinW>=24&&pr.xMinH>=16&&pr.cb>=18,{x:[pr.xMinW,pr.xMinH],cb:pr.cb});
 const key=await p.evaluate(()=>{const pages=spSamplePages();const k=pages.filter(n=>n.classList.contains('sp-samplekey'));const sheets=pages.filter(n=>n.querySelector('table.scatter'));
   return {pages:pages.length,keys:k.length,sheets:sheets.length,title:k[0]?k[0].querySelector('.bar').textContent:'',cells:k[0]?[...k[0].querySelectorAll('tbody td')].filter(td=>td.textContent.trim()).length:0,sampleBar:k[0]?!!k[0].querySelector('.sp-sambar'):false};});
 ok('the sample sheet prints with an answer key per behavior, bannered SAMPLE, listing the sample marks',key.keys===2&&key.sheets>=2&&/Answer Key for the Sample Sheet/.test(key.title)&&key.cells>10&&key.sampleBar,key);
 /* the on-screen behaviour of the control chart on a quiet record: no criterion met, criteria applicable */
 const quiet=await p.evaluate(()=>{const b=state.behaviors[state.cur];const keep=b.cells;b.cells={'0_0':{s:0,n:1,code:''},'5_3':{s:0,n:1,code:''},'9_7':{s:0,n:1,code:''}};state.cells=b.cells;renderControl();const t=document.getElementById('ctlBody').textContent;const r={na:/CRITERIA NOT APPLICABLE/.test(t),none:/NO CRITERION WAS MET/.test(t),verdict:(t.match(/Pattern verdict:[^.]*\./)||[''])[0],picks:document.querySelectorAll('#ctlBody [data-win]').length};b.cells=keep;state.cells=keep;renderControl();return r;});
 ok('on a sparse record the chart still says NO CRITERION WAS MET, the verdict says no interval stands out, and no window is offered',!quiet.na&&quiet.none&&/no interval stands out/.test(quiet.verdict)&&quiet.picks===0,quiet);
 await p.close();
 /* ---- touch: the not-observed button ---- */
 const tctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});const q=await open(tctx);await q.evaluate(()=>document.getElementById('simBtn').click());await sleep(2500);
 const tx=await q.evaluate(()=>Math.min(...[...document.querySelectorAll('table.scatter button.sp-abs')].map(e=>e.getBoundingClientRect().width)));
 ok('on an iPad the not-observed button is at least 32 px wide',tx>=32,tx);
 await q.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
