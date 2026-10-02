/* v21.32: OB-1 narrative tools and the Log; the shell's side-by-side mode */
const {chromium,BASE,wire,sleep}=require('./lib');
const OUT='/tmp/';
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1440,height:1000}});await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);
 /* --- OB-1 on its own --- */
 await page.goto(BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');await sleep(700);await page.evaluate(()=>{window.confirm=m=>{(window.__dlg=window.__dlg||[]).push(String(m));return true;};});   /* v21.34: the forms ask through nbhUI.confirm, which honours a stubbed window.confirm */
 await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(600);
 const r1=await page.evaluate(()=>{const o=state.obs[0];return {types:[...new Set([...document.querySelectorAll('input.nt')].map(e=>e.type))],t0:o.narrative.map(r=>r.t).slice(0,4),vals:[...document.querySelectorAll('.obs-page')][0].querySelectorAll('input.nt').length,dels:document.querySelectorAll('button.delRow').length,conv:[toHM24('9:14'),toHM24('12:20'),toHM24('1:05'),toHM24('7:30'),toHM24('3:15 pm'),toHM24('13:05'),hm12('13:05')]};});
 console.log('OB1 narrative',JSON.stringify(r1));
 /* delete the second line of observation 1 */
 const before=await page.evaluate(()=>state.obs[0].narrative.length);
 await page.evaluate(()=>{window.confirm=()=>true;document.querySelector('.obs-page button.delRow[data-row="1"]').click();});
 const after=await page.evaluate(()=>state.obs[0].narrative.length);
 console.log('delete row',before,'->',after);
 /* the note box: two notes out of order land in time order in the chosen observation */
 await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="obs"]').click();const sel=document.querySelector('#obrInto');sel.value='0';sel.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.evaluate(()=>{document.querySelector('#obrNoteT').value='23:50';document.querySelector('#obrNoteW').value='late note (probe)';document.querySelector('#obrNoteAdd').click();});
 await page.evaluate(()=>{document.querySelector('#obrNoteT').value='00:05';document.querySelector('#obrNoteW').value='early note (probe)';document.querySelector('#obrNoteAdd').click();});
 const r2=await page.evaluate(()=>({narr:state.obs[0].narrative.map(r=>r.t+' '+r.w.slice(0,22)),last:document.querySelector('#obrNoteLast').textContent,box:document.querySelector('#obrNoteW').value}));
 console.log('notes',JSON.stringify(r2));
 /* the Log */
 await page.evaluate(()=>document.querySelector('#viewSeg [data-view="log"]').click());await sleep(300);
 const r3=await page.evaluate(()=>({view:document.body.className,rows:document.querySelectorAll('table.oblog tbody tr').length,stat:document.querySelector('#logStat').textContent,visible:getComputedStyle(document.querySelector('#obsLog')).display,pagesHidden:getComputedStyle(document.querySelector('#obsPages')).display}));
 console.log('log',JSON.stringify(r3));
 await page.screenshot({path:OUT+'ob1-log.png'});
 await page.evaluate(()=>{const e=document.querySelector('table.oblog input[data-field="setting"]');e.value='Room 12 (edited in the log)';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
 await sleep(200);
 console.log('log edit',await page.evaluate(()=>({state:state.obs[0].setting,sheet:document.querySelector('.obs-page input[data-field="setting"]').value})));
 await page.evaluate(()=>document.querySelector('table.oblog button.logOpen').click());await sleep(300);
 console.log('open from log ->',await page.evaluate(()=>document.body.className));
 await page.evaluate(()=>window.scrollTo(0,document.querySelector('#obrNote').getBoundingClientRect().top+window.scrollY-120));await sleep(200);
 await page.screenshot({path:OUT+'ob1-note.png'});
 /* print still shows no log and no delete column */
 await page.emulateMedia({media:'print'});
 console.log('print: log',await page.evaluate(()=>getComputedStyle(document.querySelector('#obsLog')).display),'delete col',await page.evaluate(()=>getComputedStyle(document.querySelector('td.nx')).display));
 await page.emulateMedia({media:'screen'});
 /* --- side by side in the shell --- */
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 for(const id of ['OB-1','MT-1','ABC-1','TB-1']){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000}).catch(()=>{});}
 await page.evaluate(()=>setSplit(['OB-1','MT-1','ABC-1']));await sleep(500);
 const vis=async()=>page.evaluate(()=>({split:state.split,cur:state.cur,shown:Object.entries(state.frames).filter(([k,f])=>!f.hidden).map(([k,f])=>k+':'+Math.round(f.getBoundingClientRect().width)),panes:[...document.querySelectorAll('#paneBar .pane')].map(p=>p.dataset.pane+(p.classList.contains('cur')?'*':'')),cls:document.body.classList.contains('ws-split'),crumb:document.querySelector('#crumbId').textContent}));
 console.log('split 3',JSON.stringify(await vis()));
 await page.screenshot({path:OUT+'split3.png'});
 await page.evaluate(()=>openForm('TB-1'));await sleep(300);console.log('open TB-1 while split',JSON.stringify(await vis()));
 await page.evaluate(()=>document.querySelector('#paneBar [data-pane-close="TB-1"]').click());await sleep(300);console.log('close pane TB-1',JSON.stringify(await vis()));
 await page.evaluate(()=>document.querySelector('#paneBar [data-pane="MT-1"]').click());await sleep(200);console.log('click pane MT-1',JSON.stringify(await vis()));
 await page.evaluate(()=>document.querySelector('#closeForm').click());await sleep(300);await page.evaluate(()=>document.querySelector('#cfFoot button.danger').click());await sleep(400);console.log('close MT-1',JSON.stringify(await vis()));
 await page.evaluate(()=>setSplit([]));await sleep(300);console.log('one form',JSON.stringify(await vis()));
 await page.click('#splitBtn');await sleep(300);console.log('chooser',await page.evaluate(()=>({open:document.querySelector('#dlg').open,rows:document.querySelectorAll('.sb-row').length,note:document.querySelector('#sbNote').textContent})));
 await page.screenshot({path:OUT+'chooser.png'});
 await page.evaluate(()=>{document.querySelectorAll('.sb-row input').forEach(c=>c.checked=true);document.querySelectorAll('.sb-row input')[0].dispatchEvent(new Event('change'));document.querySelector('#sbGo').click();});await sleep(400);
 console.log('chooser go',JSON.stringify(await vis()));
 await page.setViewportSize({width:820,height:1100});await sleep(400);
 console.log('narrow',await page.evaluate(()=>getComputedStyle(document.querySelector('#frames')).flexDirection));
 await page.screenshot({path:OUT+'split-narrow.png'});
 console.log('LOG',JSON.stringify(log).slice(0,500));await br.close();})().catch(e=>{console.error('FAIL',e);process.exit(1);});
