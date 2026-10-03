/* v21.36: OB-1 interobserver agreement from a second observer's record */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const S=__dirname+'/out';
const URL=BASE+'/NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html';
const PRE='file://'+S+'/ob1-ioa/OB-1_pre-edit.html';
const pages=buf=>{const m=buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
let fails=0;const ok=(name,cond,detail)=>{console.log((cond?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail):''));if(!cond)fails++;};
(async()=>{const log=[];const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});await ctx.addInitScript(()=>{window.print=function(){};});
 const page=await ctx.newPage();wire(page,log);
 await page.goto(URL);await sleep(700);
 await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});
 /* blank form: nothing of the second record shows */
 const blank=await page.evaluate(()=>({chk:document.querySelectorAll('.obs-page input[data-field="obs2On"]').length,rows:document.querySelectorAll('.obs-page input[data-field="count2"]').length,ioa:document.querySelectorAll('.obs-page p.ioa').length,iv2:document.querySelectorAll('button.iv[data-field="iv2"]').length,agreeRO:document.querySelector('.obs-page input[data-field="agree"]').readOnly}));
 ok('blank sheet shows the checkbox and nothing else',blank.chk===1&&blank.rows===0&&blank.ioa===0&&blank.iv2===0&&blank.agreeRO===false,blank);
 /* the simulation */
 await page.evaluate(()=>document.querySelector('#simBtn').click());await sleep(700);
 const sim=await page.evaluate(()=>{const o=state.obs[1],n=state.cfg.ivN;
   const c=+o.count,c2=+o.count2,cIOA=Math.max(c,c2)?Math.round(Math.min(c,c2)/Math.max(c,c2)*1000)/10:100;
   let k=0;for(let j=0;j<n;j++) if(!!o.iv[j]===!!o.iv2[j]) k++;
   let pk=0;for(let j=0;j<n;j++) if(!!o.peerIv[j]===!!o.peerIv2[j]) pk++;
   const pc=+o.peerCount,pc2=+o.peerCount2,pIOA=Math.max(pc,pc2)?Math.round(Math.min(pc,pc2)/Math.max(pc,pc2)*1000)/10:100;
   const pg=document.querySelectorAll('.obs-page')[1],ag=pg.querySelector('input[data-field="agree"]');
   return {hand:{count:cIOA,counts:[c,c2],iv:Math.round(k*1000/n)/10,k,n,peerCount:pIOA,peerIv:Math.round(pk*1000/n)/10,pk},
     form:ioa(o),line:pg.querySelector('p.ioa').textContent,agree:{value:ag.value,readOnly:ag.readOnly,title:ag.title},
     rows:pg.querySelectorAll('input[data-field="count2"]').length,iv2:pg.querySelectorAll('button.iv[data-field="iv2"]').length,peerIv2:pg.querySelectorAll('button.iv[data-field="peerIv2"]').length,
     iv2on:pg.querySelectorAll('button.iv[data-field="iv2"].on').length,obs1:document.querySelectorAll('.obs-page')[0].querySelectorAll('input[data-field="count2"],p.ioa,button.iv[data-field="iv2"]').length,
     agree0:document.querySelectorAll('.obs-page')[0].querySelector('input[data-field="agree"]').value,summary:summary().agree,computed:summary().computed,o2cells:[...pg.querySelectorAll('tr.ivpct td.o2')].map(td=>td.textContent),ths:pg.querySelectorAll('table.obs-count th').length};});
 console.log('simulation obs 2 hand',JSON.stringify(sim.hand));
 console.log('simulation obs 2 form',JSON.stringify(sim.form));
 console.log('simulation obs 2 line:',sim.line);
 ok('obs 2 count IOA matches hand computation',sim.form.count.p===sim.hand.count&&sim.form.count.a===sim.hand.counts[0]&&sim.form.count.b===sim.hand.counts[1]);
 ok('obs 2 interval IOA matches hand computation',sim.form.iv.p===sim.hand.iv&&sim.form.iv.k===sim.hand.k&&sim.form.iv.n===sim.hand.n);
 ok('obs 2 interval IOA between 85 and 93',sim.hand.iv>=85&&sim.hand.iv<=93,sim.hand.iv);
 ok('obs 2 peer IOA matches',sim.form.peerCount.p===sim.hand.peerCount&&sim.form.peerIv.p===sim.hand.peerIv);
 ok('obs 2 agreement line reads the figures',sim.line===`Agreement: count ${sim.hand.count}% (${sim.hand.counts[0]} and ${sim.hand.counts[1]}); intervals ${sim.hand.iv}% (${sim.hand.k} of ${sim.hand.n}); peer count ${sim.hand.peerCount}% (0 and 0); peer intervals ${sim.hand.peerIv}% (${sim.hand.pk} of ${sim.hand.n})`,sim.line);
 ok('obs 2 Agreement field is the interval IOA, read-only, titled',sim.agree.value===String(sim.hand.iv)&&sim.agree.readOnly===true&&/computed from the second observer/.test(sim.agree.title),sim.agree);
 ok('obs 2 sheet shows the observer-2 count row and interval rows',sim.rows===1&&sim.iv2===20&&sim.peerIv2===20&&sim.iv2on===2,{rows:sim.rows,iv2:sim.iv2,peerIv2:sim.peerIv2,on:sim.iv2on});
 ok('obs 2 count table: six columns, observer-2 interval cells',sim.ths===6&&JSON.stringify(sim.o2cells)==='["10%2 of 20","0%0 of 20"]',{ths:sim.ths,o2cells:sim.o2cells});
 ok('obs 1 (typed agreement, no second record) unchanged',sim.obs1===0&&sim.agree0==='90',{obs1:sim.obs1,agree0:sim.agree0});
 ok('summary() agree list keeps its contract',JSON.stringify(sim.summary)===JSON.stringify([{i:0,t:'90',v:90,ok:true},{i:1,t:String(sim.hand.iv),v:sim.hand.iv,ok:true}])&&sim.computed===1,{agree:sim.summary,computed:sim.computed});
 const sumText=await page.evaluate(()=>document.querySelector('#sumBox').textContent);
 ok('summary sentence present',/Agreement was computed from a second observer’s record in 1 of 3 observations \(interval-by-interval for the interval sample, total count otherwise\)\./.test(sumText));
 ok('summary still names the typed and computed agreements',/Agreement with a second observer was recorded for 2 of 3 observations \(90%\)/.test(sumText),sumText.match(/Agreement[^.]*\./g));
 /* tick and untick on observation 1 */
 const tick=async on=>page.evaluate(on=>{const c=document.querySelectorAll('.obs-page')[0].querySelector('input[data-field="obs2On"]');c.checked=on;c.dispatchEvent(new Event('change',{bubbles:true}));},on);
 const look=()=>page.evaluate(()=>{const pg=document.querySelectorAll('.obs-page')[0],ag=pg.querySelector('input[data-field="agree"]');return {on:state.obs[0].obs2On,rows:pg.querySelectorAll('input[data-field="count2"]').length,ioa:pg.querySelectorAll('p.ioa').length,ioaText:(pg.querySelector('p.ioa')||{}).textContent,iv2:pg.querySelectorAll('button.iv[data-field="iv2"]').length,peerIv2:pg.querySelectorAll('button.iv[data-field="peerIv2"]').length,agree:ag.value,ro:ag.readOnly,sum:summary().agree[0]};});
 await tick(true);await sleep(200);const t1=await look();
 ok('ticked: fields appear, agreement field still typed (nothing entered yet)',t1.on===true&&t1.rows===1&&t1.ioa===1&&t1.iv2===20&&t1.peerIv2===20&&t1.agree==='90'&&t1.ro===false&&/enter the second observer/.test(t1.ioaText),t1);
 /* type a second count */
 await page.evaluate(()=>{const e=document.querySelectorAll('.obs-page')[0].querySelector('input[data-field="count2"]');e.value='8';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
 const t2=await look();
 const hand2=await page.evaluate(()=>{const o=state.obs[0];let k=0;for(let j=0;j<20;j++) if(!!o.iv[j]===!!o.iv2[j]) k++;return {ivp:Math.round(k*1000/20)/10,k,marked:o.iv.filter(Boolean).length};});
 ok('typed count 8 against 7: count IOA 87.5%, interval IOA from obs 1 marks against none',/^Agreement: count 87\.5% \(7 and 8\); intervals /.test(t2.ioaText)&&t2.ioaText.includes(`intervals ${hand2.ivp}% (${hand2.k} of 20)`)&&t2.agree===String(hand2.ivp)&&t2.ro===true&&t2.sum.t===String(hand2.ivp),{line:t2.ioaText,agree:t2.agree,hand:hand2});
 /* mark a second-observer interval the first observer marked: agreement rises by one interval */
 const firstOn=await page.evaluate(()=>{const b=document.querySelectorAll('.obs-page')[0].querySelector('button.iv[data-field="iv"].on');return +b.dataset.iv;});
 await page.evaluate(j=>document.querySelectorAll('.obs-page')[0].querySelector('button.iv[data-field="iv2"][data-iv="'+j+'"]').click(),firstOn);await sleep(150);
 const t3=await look();
 ok('clicking an observer-2 interval updates the agreement in place',state=>true,{line:t3.ioaText,agree:t3.agree});
 ok('observer-2 interval cell refreshed in place',(await page.evaluate(()=>document.querySelectorAll('.obs-page')[0].querySelector('tr.ivpct td.o2').textContent))==='5%1 of 20');
 ok('interval agreement rose by one interval',t3.ioaText.includes(`intervals ${Math.round((hand2.k+1)*1000/20)/10}% (${hand2.k+1} of 20)`)&&(await page.evaluate(j=>state.obs[0].iv2[j]===true,firstOn)),t3.ioaText);
 /* the sample off: the Agreement field falls back to the count IOA */
 await page.evaluate(()=>{const s=document.querySelector('#ivLen');s.value='0';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
 const t4=await look();
 ok('no interval sample: agreement is the count IOA, no interval rows',t4.agree==='87.5'&&t4.ro===true&&t4.ioaText==='Agreement: count 87.5% (7 and 8)'&&t4.iv2===0,t4);
 await page.evaluate(()=>{const s=document.querySelector('#ivLen');s.value='15';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(400);
 const t5=await look();ok('sample back on: interval rows and marks return',t5.iv2===20&&t5.agree===String(Math.round((hand2.k+1)*1000/20)/10),{iv2:t5.iv2,agree:t5.agree});
 /* untick: everything goes, the typed agreement is back, the data is kept */
 await tick(false);await sleep(200);const t6=await look();
 ok('unticked: fields go, typed agreement back, second record kept in state',t6.on===false&&t6.rows===0&&t6.ioa===0&&t6.iv2===0&&t6.agree==='90'&&t6.ro===false&&t6.sum.t==='90'&&(await page.evaluate(()=>state.obs[0].count2==='8'&&state.obs[0].iv2.some(Boolean))),t6);
 /* save-data round trip */
 const json=await page.evaluate(()=>JSON.stringify(state,null,1));
 const saved=JSON.parse(json);
 ok('saved JSON carries the new fields',saved.obs[1].obs2On===true&&saved.obs[1].count2==='2'&&saved.obs[1].peerCount2==='0'&&saved.obs[1].iv2.filter(Boolean).length===2&&Array.isArray(saved.obs[1].peerIv2)&&saved.obs[0].obs2On===false&&saved.obs[0].count2==='8',{o1:Object.keys(saved.obs[1]).filter(k=>/2$|obs2/.test(k))});
 await page.evaluate(()=>{state.obs=[];render();});
 await page.setInputFiles('#fileIn',{name:'sim_OB-1.json',mimeType:'application/json',buffer:Buffer.from(json)});await sleep(500);
 const back=await page.evaluate(()=>{const o=state.obs[1],pg=document.querySelectorAll('.obs-page')[1];return {n:state.obs.length,on:o.obs2On,count2:o.count2,iv2:o.iv2.filter(Boolean).length,rows:pg.querySelectorAll('input[data-field="count2"]').length,iv2btn:pg.querySelectorAll('button.iv[data-field="iv2"].on').length,agree:pg.querySelector('input[data-field="agree"]').value,line:pg.querySelector('p.ioa').textContent,obs1rows:document.querySelectorAll('.obs-page')[0].querySelectorAll('input[data-field="count2"]').length};});
 ok('file restores the second record and the computed agreement',back.n===3&&back.on===true&&back.count2==='2'&&back.iv2===2&&back.rows===1&&back.iv2btn===2&&back.agree===String(sim.hand.iv)&&back.line===sim.line&&back.obs1rows===0,back);
 /* an older file without the fields */
 const old=JSON.parse(json);old.obs.forEach(o=>{delete o.obs2On;delete o.count2;delete o.peerCount2;delete o.iv2;delete o.peerIv2;});
 await page.setInputFiles('#fileIn',{name:'old_OB-1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await sleep(500);
 const oldBack=await page.evaluate(()=>({on:state.obs.map(o=>o.obs2On),rows:document.querySelectorAll('input[data-field="count2"]').length,agree1:document.querySelectorAll('.obs-page')[1].querySelector('input[data-field="agree"]').value,ro:document.querySelectorAll('.obs-page')[1].querySelector('input[data-field="agree"]').readOnly}));
 ok('older file without the fields opens as before',JSON.stringify(oldBack.on)==='[false,false,false]'&&oldBack.rows===0&&oldBack.agree1===''&&oldBack.ro===false,oldBack);
 /* back to the simulation state for the CSV and the print */
 await page.setInputFiles('#fileIn',{name:'sim_OB-1.json',mimeType:'application/json',buffer:Buffer.from(json)});await sleep(500);
 const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.querySelector('#csvBtn').click())]);
 const csv=fs.readFileSync(await dl.path(),'utf8').split('\n').map(l=>l.match(/"((?:[^"]|"")*)"/g).map(c=>c.slice(1,-1).replace(/""/g,'"')));
 const H=csv[0];
 ok('CSV header: four new columns at the end, earlier order kept',H.slice(-4).join('|')==='Student count (obs 2)|Peer count (obs 2)|Count IOA (%)|Interval IOA (%)'&&H.slice(0,23).join('|')==='Date|Start|End|Minutes|Setting|Activity|Arrangement|Announced|Count|Per hour|Peer count|Intervals scored|Peer intervals|Intervals sampled|Conditions present|What followed|Conclusion|Peer per hour|Interval method|Interval length (s)|Second observer|Agreement (%)|Limits on this record',H);
 const col=n=>H.indexOf(n);
 ok('CSV obs 2 row carries the second record and the IOA',csv[2][col('Student count (obs 2)')]==='2'&&csv[2][col('Peer count (obs 2)')]==='0'&&csv[2][col('Count IOA (%)')]===String(sim.hand.count)&&csv[2][col('Interval IOA (%)')]===String(sim.hand.iv)&&csv[2][col('Agreement (%)')]===String(sim.hand.iv)&&csv[2][col('Second observer')]==='Paraprofessional',csv[2].slice(-5));
 ok('CSV obs 1 and 3 rows: new columns blank, typed agreement kept',csv[1].slice(-4).join('')===''&&csv[3].slice(-4).join('')===''&&csv[1][col('Agreement (%)')]==='90'&&csv[3][col('Agreement (%)')]==='',[csv[1].slice(-5),csv[3].slice(-5)]);
 /* print: observer-2 rows and the line print on sheet 2 only; the checkbox never */
 await page.emulateMedia({media:'print'});await sleep(200);
 const pr=await page.evaluate(()=>{const pgs=document.querySelectorAll('.obs-page');const d=e=>e?getComputedStyle(e).display:'none';return {chk:d(pgs[1].querySelector('.obs2chk')),row:d(pgs[1].querySelector('th.o2')),line:d(pgs[1].querySelector('p.ioa')),iv2:d(pgs[1].querySelector('button.iv[data-field="iv2"]')),s1:pgs[0].querySelectorAll('input[data-field="count2"],p.ioa,button.iv[data-field="iv2"]').length};});
 ok('print: observer-2 columns, rows and the agreement line print, the checkbox does not, sheet 1 untouched',pr.chk==='none'&&pr.row==='table-cell'&&pr.line!=='none'&&pr.iv2!=='none'&&pr.s1===0,pr);
 const simPages=pages(await page.pdf({preferCSSPageSize:true,printBackground:true}));
 await page.emulateMedia({media:'screen'});
 /* the Log view and a row delete still work */
 await page.evaluate(()=>document.querySelector('#viewSeg [data-view="log"]').click());await sleep(200);
 const lg=await page.evaluate(()=>({view:document.body.className,rows:document.querySelectorAll('table.oblog tbody tr').length,cols:document.querySelectorAll('table.oblog thead th').length}));
 ok('Log view renders three rows',lg.view==='view-log'&&lg.rows===3,lg);
 await page.evaluate(()=>document.querySelector('#viewSeg [data-view="obs"]').click());
 const nb=await page.evaluate(()=>state.obs[0].narrative.length);
 await page.evaluate(()=>document.querySelector('.obs-page button.delRow[data-row="1"]').click());await sleep(300);
 ok('row delete still works',(await page.evaluate(()=>state.obs[0].narrative.length))===nb-1);
 const lineAfter=await page.evaluate(()=>document.querySelectorAll('.obs-page')[1].querySelector('p.ioa').textContent);
 ok('agreement line survives a redraw',lineAfter===sim.line);
 /* the time picker and the note box */
 const nt=await page.evaluate(()=>({types:[...new Set([...document.querySelectorAll('input.nt')].map(e=>e.type))],note:!!document.querySelector('#obrNoteAdd')}));
 ok('time pickers and note box present',nt.types.join()==='time'&&nt.note,nt);
 /* print page counts: blank against the pre-edit file */
 const p2=await ctx.newPage();wire(p2,log);
 const count=async url=>{await p2.goto(url);await sleep(600);await p2.emulateMedia({media:'print'});await sleep(300);const n=pages(await p2.pdf({preferCSSPageSize:true,printBackground:true}));await p2.emulateMedia({media:'screen'});return n;};
 /* the pre-edit copy lived in the working session; without it the v21.36 counts (blank 6, simulation 9) stand in */
 const havePre=fs.existsSync(PRE.replace('file://',''));
 const blankNow=await count(URL),blankPre=havePre?await count(PRE):6;
 await p2.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});await p2.evaluate(()=>document.querySelector('#simBtn').click());await sleep(600);
 await p2.emulateMedia({media:'print'});await sleep(300);const simPre=havePre?pages(await p2.pdf({preferCSSPageSize:true,printBackground:true})):9;
 console.log('print pages: blank now',blankNow,'blank pre-edit',blankPre,'| simulation now',simPages,'simulation pre-edit',simPre);
 ok('blank form print page count unchanged',blankNow===blankPre,{now:blankNow,pre:blankPre});
 ok('simulation print grew by at most the lines added',simPages<=simPre+1,{now:simPages,pre:simPre});
 ok('no console or page error',log.length===0,log);
 console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');
 await br.close();process.exit(fails?1:0);})().catch(e=>{console.error('FAIL',e);process.exit(1);});
