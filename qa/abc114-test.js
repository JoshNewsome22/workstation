/* v24.14 Form ABC-1 polish (the 10/25 review): the Data file tab's tools; the wide analysis table's scroll cue on an iPad;
   the legend's italic word no longer a swatch; a bar's value label past the dashed marker; the TB-1 definition under the
   target on the Record tab; More controls' columns. usage: node qa/abc114-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/ABC_Recording_Conditional_Probability_Analysis.html';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1300,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(URL);await sleep(1500);
 /* the Data file tab's tools */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="data"]').click());await sleep(500);
 const dt=await p.evaluate(()=>{const ids=[...document.querySelectorAll('#panel-data [data-for]')].map(b=>b.dataset.for+':'+(b.offsetWidth>0?'shown':'hidden')+':'+b.textContent.trim());
   return {ids,card1:!!document.querySelector('#panel-data .card:first-of-type #abcDataTools'),card2:!!document.querySelector('#panel-data .card:nth-of-type(2) #abcSimTools'),hint:[...document.querySelectorAll('#panel-data p.hint')].some(h=>/asks first/.test(h.textContent))};});
 ok('the Data file tab holds Save data, Open data, the two CSV exports (first card), Load simulation and Clear all (second card), all shown',
   dt.ids.join('|')==='dl-json:shown:Save data|up-json:shown:Open data|dl-csv:shown:Export incidents CSV|dl-matrix:shown:Export analysis CSV|load-demo:shown:Load simulation|clear-all:shown:Clear all'&&dt.card1&&dt.card2&&dt.hint,dt);
 await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;});
 await p.click('#panel-data [data-for="load-demo"]');await sleep(1200);
 const sim=await p.evaluate(()=>({n:state.entries.length,m:state.samples.length,status:document.querySelector('#data-status').textContent}));
 ok('Load simulation on the Data file tab loads the simulated record (46 incidents, 60 samples)',sim.n===46&&sim.m===60,sim);
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="data"]').click());await sleep(400);   /* Load simulation opens the analysis */
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null),p.click('#panel-data [data-for="dl-json"]')]);
 ok('Save data on the Data file tab downloads the data file',!!dl&&/\.json$/i.test(dl.suggestedFilename()),dl&&dl.suggestedFilename());
 /* the legend, the bar label, More controls */
 await p.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(1200);
 const lg=await p.evaluate(()=>{const sp=[...document.querySelectorAll('#panel-analysis .legend span')].find(x=>/incidents without that condition/.test(x.textContent));if(!sp)return {none:true};
   const is=[...sp.querySelectorAll('i')];return {n:is.length,sw:getComputedStyle(is[0]).width,wordSw:is[1]&&getComputedStyle(is[1]).width,wordW:is[1]&&is[1].getBoundingClientRect().width,italic:is[1]&&getComputedStyle(is[1]).fontStyle};});
 ok('the legend\'s italic "without" is a word again (the swatch is the first <i> only)',lg.n===2&&lg.sw==='10px'&&lg.wordSw!=='10px'&&lg.wordW>30&&lg.italic==='italic',lg);
 const hb=await p.evaluate(()=>{const svg=hBar([{label:'a',value:.04,ghost:.10,note:'4% (2/46)'},{label:'b',value:.5,ghost:.1,note:'50% (23/46)'}]);const d=new DOMParser().parseFromString(svg,'image/svg+xml');
   const lines=[...d.querySelectorAll('line[stroke-dasharray="3 2"]')].map(l=>+l.getAttribute('x1'));const texts=[...d.querySelectorAll('text[font-weight="600"]')].map(t=>+t.getAttribute('x'));const rects=[...d.querySelectorAll('rect')].map(r=>+r.getAttribute('x')+ +r.getAttribute('width'));
   return {lines,texts,rects};});
 ok('a value label starts past the dashed marker when the bar is shorter than the marker, and stays at the bar end otherwise',
   hb.texts[0]>hb.lines[0]+4&&Math.abs(hb.texts[1]-(hb.rects[1]+7))<0.6,hb);
 const mc=await p.evaluate(()=>{const panel=document.querySelector('.toolbar .abc-panel');const cols=[...panel.querySelectorAll('.abc-col')];const col=id=>{const e=document.getElementById(id);const c=e&&e.closest('.abc-col');return c?cols.indexOf(c):-1;};
   const grp=document.getElementById('load-demo').closest('.tgroup');return {heads:cols.map(c=>c.querySelector('h4').textContent),photo:col('abcPhotoPick'),video:col('abcVideo'),save:col('dl-json'),sim:col('load-demo'),resetLabel:grp.firstElementChild.textContent,files:cols[1].querySelectorAll('.tgroup').length};});
 ok('More controls: Printing and the paper sheets holds the photo and video groups, Files holds the files only, the reset group has its own label',
   mc.heads.join('|')==='Printing and the paper sheets|Files|Simulation and reset'&&mc.photo===0&&mc.video===0&&mc.save===1&&mc.files===1&&mc.sim===2&&mc.resetLabel==='The worked example, or starting over',mc);
 /* the TB-1 definition on the Record tab */
 const tb=await p.evaluate(()=>{abcAddTargets([{label:'Hitting peers with an open hand',def:'Open-hand contact with a peer with enough force to be heard across the room.'}]);
   const o=document.querySelector('#abc-grid [data-opt="b-tb_hitting_peers_with_an_open_h"]');const d=o&&o.querySelector('label .abc-tbdef');return {tag:!!(o&&o.querySelector('.abc-tb')),def:d&&d.textContent,block:d&&getComputedStyle(d).display,title:o&&o.title};});
 ok('a TB-1 target shows its definition under its name on the Record tab (the tooltip kept)',tb.tag&&/enough force/.test(tb.def||'')&&tb.block==='block'&&/enough force/.test(tb.title||''),tb);
 /* desktop: the analysis tables fit, so no cue */
 const dk=await p.evaluate(()=>{const ws=[...document.querySelectorAll('#panel-analysis .matrix-wrap')];return {n:ws.length,can:ws.filter(w=>w.classList.contains('can-scroll')).length,notes:ws.filter(w=>w.nextElementSibling&&w.nextElementSibling.classList.contains('matrix-swipe')&&getComputedStyle(w.nextElementSibling).display!=='none').length};});
 ok('on a wide screen the tables fit and no table shows the scroll cue',dk.n>=3&&dk.can===0&&dk.notes===0,dk);
 ok('no page errors (desktop)',!errs.length,errs.slice(0,4));
 /* an iPad upright: the 13-column table scrolls sideways, fades at its edge, says so, keeps its row labels */
 const ctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});const q=await ctx.newPage();const errs2=[];q.on('pageerror',e=>errs2.push(String(e)));
 await q.goto(URL);await sleep(1500);
 await q.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('load-demo').click();});await sleep(1200);
 await q.evaluate(()=>document.querySelector('#viewSeg [data-view="analysis"]').click());await sleep(1500);
 const ip=await q.evaluate(()=>{const w=[...document.querySelectorAll('#panel-analysis .matrix-wrap')].find(x=>x.querySelector('th.colh'));if(!w)return {none:true};const th=w.querySelector('th.rowh'),td=w.querySelector('tbody th.rowh');
   const out={can:w.classList.contains('can-scroll'),atEnd:w.classList.contains('at-end'),mask:/gradient/.test(getComputedStyle(w).webkitMaskImage||getComputedStyle(w).maskImage||''),note:w.nextElementSibling&&getComputedStyle(w.nextElementSibling).display,noteText:w.nextElementSibling&&w.nextElementSibling.textContent,sticky:getComputedStyle(th).position,stickyRow:getComputedStyle(td).position,sw:w.scrollWidth,cw:w.clientWidth};
   w.scrollLeft=w.scrollWidth;return new Promise(r=>setTimeout(()=>{out.atEndAfter=w.classList.contains('at-end');out.maskAfter=/gradient/.test(getComputedStyle(w).webkitMaskImage||getComputedStyle(w).maskImage||'');out.labelLeft=Math.round(td.getBoundingClientRect().left-w.getBoundingClientRect().left);r(out);},150));});
 ok('on an iPad the antecedent-to-consequence table scrolls sideways, fades at its right edge, says "Scroll sideways", and keeps its row labels in place',
   ip.can&&!ip.atEnd&&ip.mask&&ip.note==='block'&&/Scroll sideways/.test(ip.noteText||'')&&ip.sticky==='sticky'&&ip.stickyRow==='sticky'&&ip.sw>ip.cw+100,ip);
 ok('scrolled to its end the fade goes and the row labels are still at the left edge',ip.atEndAfter&&!ip.maskAfter&&ip.labelLeft>=0&&ip.labelLeft<40,ip);
 ok('no page errors (iPad)',!errs2.length,errs2.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
