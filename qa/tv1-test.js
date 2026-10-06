/* v21.50 Form TV-1, Training Video (tools/forms/TV-1):
   1. no script yet: Setup says so; the case (the shell's facts) is kept, not filled, until Draft from the case;
   2. the draft: a segment for each part ticked, the definitions, the hypothesis, the goals and the menu from the case; the
      parts the case cannot know as [prompts]; a second draft adds to the end and changes nothing written;
   3. the simulator: Sam's script, its cards, a paragraph with two cards (Same words as above);
   4. the teleprompter: Page Down, the arrows, Enter and Space; a paragraph's second card keeps the paragraph; the clock keeps
      the card times and they export as CSV; mirror; the size;
   5. the graphics window: opens on the chosen key background, the next card on the teleprompter changes it;
   6. the sheet: Export for Sheets writes the first tab (every row, nine columns, a continued paragraph's words repeated) and a
      tab for each segment; the workbook and a CSV in the sheet's layout come back in, the continued rows found again;
   7. Save data and Open give the same script back; a file from elsewhere cannot put markup or a stray picture in;
   8. the card layouts each draw inside the stage; print; no errors and no request off the page's own folder.
   usage: node qa/tv1-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html';
const OUT=path.join(__dirname,'out','tv1');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950},acceptDownloads:true});const page=await ctx.newPage();
  const errs=[],reqs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});ctx.on('request',r=>reqs.push(r.url()));const miss=[];ctx.on('response',r=>{if(r.status()>=400)miss.push(r.status()+' '+r.url());});
  await page.goto(URL);await sleep(1200);
  await page.evaluate(()=>{nbhUI.confirm=async()=>true;});
  const dl=async fn=>{const [d]=await Promise.all([page.waitForEvent('download'),page.evaluate(fn)]);const p=path.join(OUT,d.suggestedFilename());await d.saveAs(p);return p;};
  /* 1 */
  const v0=await page.evaluate(()=>({v:document.getElementById('setupVerdict').textContent,n:S.rows.length,segs:document.querySelectorAll('#segPick input').length,caseLine:document.getElementById('caseLine').textContent}));
  ok('1 no script yet: Setup says so, ten segments to tick, no case',v0.n===0&&/No script yet/.test(v0.v)&&v0.segs===10&&/No case yet/.test(v0.caseLine),v0);
  const CASE={behaviors:[{label:'Elopement',def:'Leaving the assigned area by more than three feet without permission',ex:'walking out of the classroom door',nex:'going to the bathroom with a pass',dim:'frequency'},{label:'Asking for a break',isRep:true,type:'replacement'}],
    fn:{label:'Escape from demands',statements:['When Jo is given a long task, Jo leaves the area, and the task is taken away.']},goals:{red:[{beh:'Elopement',text:'Elopement will decrease to zero a day for 15 days'}],acq:[{beh:'Asking for a break',text:'Jo will ask for a break in 8 of 10 opportunities'}]},
    menu:[{name:'Music',rank:2},{name:'Tablet time',rank:1}],src:{behaviors:'TB-1'}};
  const r1=await page.evaluate(c=>{const r=window.__nbhFactsIn(c);return {r,n:S.rows.length,line:document.getElementById('caseLine').textContent};},CASE);
  ok('1 the case is kept, nothing filled; Setup names what it holds',r1.r.filled===0&&r1.n===0&&/two target behaviors/.test(r1.line)&&/function/.test(r1.line)&&/goals/.test(r1.line)&&/reinforcer menu/.test(r1.line),r1);
  /* 2 */
  await page.evaluate(()=>{setView('setup');document.querySelector('[data-m="first"]').value='Jo';document.querySelector('[data-m="first"]').dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelectorAll('#segPick input').forEach(c=>{c.checked=['overview','behaviors','function','goals','reinforce','response'].includes(c.dataset.seg);});document.getElementById('draftBtn').click();});await sleep(600);
  const d1=await page.evaluate(()=>({segs:[...new Set(S.rows.map(r=>r.seg))],rows:S.rows.map(r=>({seg:r.seg,say:r.say,title:r.title,body:r.body,cont:r.cont,lay:r.lay})),view:document.body.className}));
  ok('2 the segments ticked, in order',JSON.stringify(d1.segs)===JSON.stringify(['Training Overview','Target Behaviors','Function & Data','Goals of Intervention','Reinforcement System','Response Plan'])&&/view-script/.test(d1.view),d1.segs);
  const said=d1.rows.map(r=>r.say).join(' '),cards=d1.rows.map(r=>r.title+' '+r.body).join(' ');
  ok('2 the definition, examples and non-examples from TB-1, the replacement not tracked as a problem behavior',/Elopement is defined as leaving the assigned area by more than three feet without permission\./.test(said)&&/For example: walking out of the classroom door\./.test(said)&&/It does not include going to the bathroom with a pass\./.test(said)&&!/Asking for a break is defined/.test(said),said.slice(0,600));
  ok('2 one behavior tracked (said in words); the hypothesis; the goals; the menu, the most preferred first',/One behavior is tracked/.test(said)&&/When Jo is given a long task/.test(said)&&/Elopement will decrease to zero a day for 15 days\./.test(cards)&&/Jo will ask for a break in 8 of 10 opportunities\./.test(cards)&&/• Tablet time\n• Music/.test(cards),cards.slice(0,800));
  ok('2 the function card continues the hypothesis paragraph (Same words as above)',d1.rows.some(r=>r.seg==='Function & Data'&&r.cont&&r.title==='Function'&&r.body==='Escape from demands'),d1.rows.filter(r=>r.seg==='Function & Data'));
  ok('2 what the case cannot know is a [prompt]; the response plan is numbered steps, a full-screen card',/\[How reinforcement is delivered/.test(said)&&d1.rows.some(r=>r.seg==='Response Plan'&&r.lay==='full'&&/^1\. \[first step\]/.test(r.body)),0);
  const sum=await page.evaluate(()=>({sum:document.getElementById('scriptSum').textContent,v:document.getElementById('setupVerdict').textContent}));
  ok('2 the script\'s total: cards, paragraphs, words, time, and what is still to write',/\d+ cards · \d+ paragraphs · [\d,]+ words · about \d+:\d\d at 140 words a minute · \d+ still to write/.test(sum.sum)&&/Still to write/.test(sum.v),sum);
  await page.evaluate(()=>{S.rows[0].say='Written by hand.';document.querySelectorAll('#segPick input').forEach(c=>{c.checked=c.dataset.seg==='takeaways';});document.getElementById('draftBtn').click();});await sleep(400);
  const d2=await page.evaluate(()=>({n:S.rows.length,first:S.rows[0].say,last:S.rows[S.rows.length-1].seg}));
  ok('2 a second draft adds to the end; what was written stays',d2.n===d1.rows.length+1&&d2.first==='Written by hand.'&&d2.last==='Key Takeaways',d2);
  /* 3 */
  await page.evaluate(()=>loadSim());await sleep(900);
  const s1=await page.evaluate(()=>({n:S.rows.length,p:paras().length,segs:new Set(S.rows.map(r=>r.seg)).size,cont:S.rows.filter(r=>r.cont).map(r=>r.title),client:S.meta.client,td:S.rows.filter(r=>todo(r.say)||todo(r.title)||todo(r.body)).map(r=>r.title),
    thumbs:document.querySelectorAll('.tv-thumb .gx').length,dis:[...document.querySelectorAll('textarea[data-f="say"]')].filter(t=>t.disabled).length}));
  ok('3 the simulator: 18 cards in 15 paragraphs over ten segments, three cards on a paragraph above, nothing left to write',s1.n===18&&s1.p===15&&s1.segs===10&&s1.cont.join('|')==='Training Overview|Function|Earning'&&!s1.td.length&&/^SIMULATED/.test(s1.client),s1);
  ok('3 each row shows its card; a continued row\'s words are the paragraph above (its box is off)',s1.thumbs===18&&s1.dis===3,s1);
  /* 4 */
  await page.evaluate(()=>setView('prompter'));await sleep(500);
  const tp=async()=>page.evaluate(()=>({i:TP.i,on:[...document.querySelectorAll('#tpStrip .tp-p')].findIndex(e=>e.classList.contains('on')),chip:(document.querySelector('#tpStrip .tp-c.on')||{}).textContent,pos:document.getElementById('tpPos').textContent,foot:document.getElementById('tpFoot').textContent,y:TP.y}));
  const t0=await tp();ok('4 the teleprompter opens on card 1, paragraph 1; the next is the same paragraph',t0.i===0&&t0.on===0&&/^Card 1 of 18/.test(t0.pos)&&/Next: \(same paragraph\) Training Overview/.test(t0.foot),t0);
  await page.keyboard.press('PageDown');await sleep(500);const t1=await tp();
  ok('4 Page Down: card 2, the same paragraph (the strip does not move), its chip lit',t1.i===1&&t1.on===0&&t1.y===t0.y&&/^2 · Training Overview/.test(t1.chip),t1);
  await page.keyboard.press('ArrowRight');await sleep(500);const t2=await tp();
  ok('4 the arrow: card 3, the next paragraph, the strip moves up to it',t2.i===2&&t2.on===1&&t2.y>t1.y,t2);
  await page.keyboard.press('Enter');await page.keyboard.press('ArrowLeft');await page.keyboard.press('PageUp');await sleep(500);const t3=await tp();
  ok('4 Enter forward, the left arrow and Page Up back',t3.i===1,t3);
  await page.keyboard.press(' ');await sleep(700);const run=await page.evaluate(()=>({run:TP.run,b:document.getElementById('tpRun').textContent}));await page.keyboard.press(' ');await sleep(100);
  ok('4 Space starts and stops the scroll',run.run&&run.b==='Stop'&&!(await page.evaluate(()=>TP.run)),run);
  await page.click('#tpRec');await sleep(300);await page.keyboard.press('PageDown');await sleep(400);await page.keyboard.press('PageDown');await sleep(400);await page.click('#tpRec');
  const lg=await page.evaluate(()=>({log:S.log,line:document.getElementById('logLine').textContent,rec:document.getElementById('tpRec').textContent}));
  ok('4 the clock keeps each card\'s time (the card it started on, then each next)',lg.log.length===3&&lg.log.map(l=>l.i).join()==='1,2,3'&&lg.log[2].t>lg.log[1].t&&lg.log[1].t>=lg.log[0].t&&/3 card times/.test(lg.line)&&lg.rec==='Start the clock',lg);
  const csvP=await dl(()=>document.getElementById('logCsv').click());const csv=fs.readFileSync(csvP,'utf8');
  ok('4 the card times export as CSV',/^"Card","Seconds","Time","Segment","Title"\n"2",/.test(csv)&&csv.split('\n').length===4&&/"Covering"/.test(csv),csv);
  await page.evaluate(()=>document.querySelector('[data-c="mirror"]').click());await page.evaluate(()=>{const r=document.querySelector('[data-m="tpsize"]');r.value='80';r.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  const mi=await page.evaluate(()=>{const sc=document.getElementById('tpScreen');return {m:sc.classList.contains('mirror'),tf:getComputedStyle(sc).transform,fs:getComputedStyle(document.querySelector('.tp-p')).fontSize};});
  ok('4 mirror flips the screen; the size sets the words',mi.m&&/^matrix\(-1/.test(mi.tf)&&mi.fs==='80px',mi);
  await page.evaluate(()=>document.querySelector('[data-c="mirror"]').click());
  await page.screenshot({path:path.join(OUT,'prompter.png')});
  /* 5 */
  const [pop]=await Promise.all([page.waitForEvent('popup'),page.click('#tpGfx')]);await sleep(700);
  const g0=await pop.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,t:(document.querySelector('#la .gx-title,#lb .gx-title')&&[...document.querySelectorAll('.ly')].find(l=>l.style.opacity==='1'||l.style.opacity==='').querySelector('.gx-title').textContent)}));
  const at=await page.evaluate(()=>[S.rows[TP.i].title,S.rows[TP.i+1].title]);
  const ff=await pop.evaluate(()=>getComputedStyle(document.querySelector('.ly .gx')).fontFamily);
  ok('5 the window draws the cards in the type chosen (sans serif)',/^Inter, "Helvetica Neue"/.test(ff),ff);
  const flat=await pop.evaluate(()=>{const c=document.querySelector('.ly .gx-card');const st=getComputedStyle(c);return {sh:st.boxShadow,bg:st.backgroundColor};});
  ok('5 on the key background a card is opaque and has no shadow (nothing for the key to take part of)',flat.sh==='none'&&flat.bg==='rgb(255, 255, 255)',flat);
  ok('5 the graphics window opens on green (the key) with the card shown on the teleprompter',g0.bg==='rgb(0, 177, 64)'&&g0.t===at[0],[g0,at]);
  await page.bringToFront();await page.keyboard.press('PageDown');await sleep(700);
  const shown=async()=>pop.evaluate(()=>{const l=[...document.querySelectorAll('.ly')].find(x=>x.style.opacity==='1');const t=l&&l.querySelector('.gx-title');return t?t.textContent:'';});
  ok('5 the next card on the teleprompter changes the window',(await shown())===at[1],[await shown(),at]);
  await page.evaluate(()=>{setView('setup');const s=document.querySelector('[data-m="gbg"]');s.value='black';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(600);
  ok('5 a black background (luma key) reaches the open window',(await pop.evaluate(()=>getComputedStyle(document.body).backgroundColor))==='rgb(0, 0, 0)');
  await pop.setViewportSize({width:1280,height:720});await sleep(300);await pop.screenshot({path:path.join(OUT,'window.png')});await pop.close();
  /* 6 */
  await page.evaluate(()=>{S.rows[3].pics[0].cap='Sam at the art table';S.rows[3].x=['G','H','I'];syncState();});
  const xP=await dl(()=>document.getElementById('xlsxBtn').click());
  const wb=await page.evaluate(async b=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));const sh=await readXlsx(u);return sh.map(s=>({name:s.name,n:s.rows.length,w:Math.max(...s.rows.map(r=>r.length)),r:s.rows}));},fs.readFileSync(xP).toString('base64'));
  ok('6 the workbook: the first tab every row (nine columns), then a tab for each other segment',wb.length===10&&wb[0].name==='01_Training_Overview'&&wb[0].n===18&&wb[0].w===9&&wb[1].name==='02_Student_Profile'&&wb[3].name==='04_Function_And_Data'&&wb[9].name==='10_Terms_And_Definitions',wb.map(s=>[s.name,s.n,s.w]));
  ok('6 a continued row repeats its paragraph\'s words in column B; captions in E, F; the template\'s columns G to I kept',wb[0].r[1][1]===wb[0].r[0][1]&&wb[0].r[1][2]==='Training Overview'&&wb[0].r[3][4]==='Sam at the art table'&&wb[0].r[3].slice(6).join()==='G,H,I',wb[0].r.slice(0,4));
  const before=await page.evaluate(()=>JSON.stringify(S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics.map(p=>p.cap),r.x])));
  await page.setInputFiles('#impIn',xP);await sleep(900);
  const after=await page.evaluate(()=>JSON.stringify(S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics.map(p=>p.cap),r.x])));
  ok('6 the workbook comes back in as it went out (the continued rows found again)',after===before,[before.slice(0,300),after.slice(0,300)]);
  const csvIn=path.join(OUT,'sheet.csv');fs.writeFileSync(csvIn,'﻿"Opening","Hello team.\nThis is the plan.","Welcome","• One\n• Two","","","","",""\r\n"Opening","Hello team.\nThis is the plan.","Agenda","Profile","","","","",""\r\n,,,,,,,,\r\n"Behaviors","Elopement means leaving.","Elopement","Leaving the area","Door","Hallway","x","y","z"\r\n');
  await page.setInputFiles('#impIn',csvIn);await sleep(700);
  const ci=await page.evaluate(()=>({rows:S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics[0].cap,r.pics[1].cap,r.x.join('')]),view:document.body.className}));
  ok('6 a CSV in the sheet\'s layout: three rows (the empty one skipped), the second continues the first, captions and the last columns kept',ci.rows.length===3&&ci.rows[1][2]===true&&ci.rows[1][1]===''&&ci.rows[0][1]==='Hello team.\nThis is the plan.'&&ci.rows[2][5]==='Door'&&ci.rows[2][6]==='Hallway'&&ci.rows[2][7]==='xyz'&&/view-script/.test(ci.view),ci.rows);
  /* 7 */
  await page.evaluate(()=>loadSim());await sleep(800);
  await page.evaluate(()=>{S.photos.push({id:'pa',label:'a',img:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='});S.rows[5].pics[0]={ph:'pa',cap:'Cap'};S.rows[5].lay='pic1';renderAll();});
  const sv=await dl(()=>document.getElementById('saveBtn').click());const saved=JSON.parse(fs.readFileSync(sv,'utf8'));
  const ref=await page.evaluate(()=>JSON.stringify({rows:S.rows,photos:S.photos,meta:S.meta}));
  await page.evaluate(()=>{S=blank();renderAll();});await page.setInputFiles('#fileIn',sv);await sleep(700);
  const back=await page.evaluate(()=>JSON.stringify({rows:S.rows,photos:S.photos,meta:S.meta}));
  ok('7 Save data and Open: the same script, pictures and settings back',saved.form==='TV-1'&&back===ref,[ref.length,back.length]);
  const bad={form:'TV-1',rev:'2026-10',S:{meta:{client:'<img src=x onerror=alert(1)>',c1:'red;background:url(x)'},rows:[{seg:'<b>s</b>',say:'hi',title:'<script>alert(1)<\/script>',body:'<img src=x onerror=alert(2)>',lay:'evil',cont:true,pics:[{ph:'zz',cap:'<i>c</i>'}]}],photos:[{id:'zz',img:'javascript:alert(1)'},{id:'<x>',img:'data:image/png;base64,AAAA'}],log:[{i:'x',t:'y'}]}};
  const badP=path.join(OUT,'bad.json');fs.writeFileSync(badP,JSON.stringify(bad));await page.setInputFiles('#fileIn',badP);await sleep(600);
  const b1=await page.evaluate(()=>({n:S.rows.length,cont:S.rows[0].cont,lay:S.rows[0].lay,ph:S.rows[0].pics[0].ph,photos:S.photos.length,imgs:document.querySelectorAll('#rows img,.tv-thumb img').length,scripts:[...document.querySelectorAll('#rows script,.tv-thumb script')].length,
    title:(document.querySelector('.tv-thumb .gx-title')||{}).textContent,log:S.log,c1:S.meta.c1}));
  ok('7 a file from elsewhere: markup is text, a bad picture is dropped, a first row cannot continue, a bad layout is Automatic, a colour that is not a colour the default',b1.n===1&&!b1.cont&&b1.lay==='auto'&&b1.ph===''&&b1.photos===0&&b1.imgs===0&&b1.scripts===0&&b1.title==='<script>alert(1)</script>'&&b1.log[0].i===0&&b1.c1==='#1d3b5a',b1);
  const other=path.join(OUT,'other.json');fs.writeFileSync(other,JSON.stringify({form:'TK-1',S:{}}));await page.setInputFiles('#fileIn',other);await sleep(400);
  ok('7 a file saved by another form is refused; nothing changes',(await page.evaluate(()=>S.rows.length))===1);
  /* 8 */
  await page.evaluate(()=>loadSim());await sleep(800);
  const lays=await page.evaluate(()=>{const out={};['side','lower','full','title','pic1','pic2','none'].forEach(l=>{const r=JSON.parse(JSON.stringify(S.rows[6]));r.lay=l;if(/pic/.test(l)){r.pics=[{ph:'',cap:'One'},{ph:'',cap:'Two'}];}
    const box=document.createElement('div');box.style.cssText='position:absolute;left:0;top:0';box.innerHTML=stageHtml(r,960,{presenter:true});document.body.appendChild(box);fitGx(box);const g=box.querySelector('.gx').getBoundingClientRect(),c=box.querySelector('.gx-card,.gx-band');
    const cr=c?c.getBoundingClientRect():null,inn=box.querySelector('.gx-in');out[l]={inside:!cr||(cr.left>=g.left-1&&cr.right<=g.right+1&&cr.top>=g.top-1&&cr.bottom<=g.bottom+1),over:inn?inn.scrollHeight>inn.clientHeight+2:false,card:!!c};box.remove();});return out;});
  ok('8 every layout draws inside the stage, its text fitted to its card; no card on "No card"',Object.values(lays).every(x=>x.inside&&!x.over)&&!lays.none.card&&lays.title.card,lays);
  const long=await page.evaluate(()=>{const r=JSON.parse(JSON.stringify(S.rows[6]));r.lay='side';r.body=Array.from({length:14},(_,i)=>'• A long point number '+i+' that goes on for a while').join('\n');const box=document.createElement('div');box.innerHTML=stageHtml(r,960,{});document.body.appendChild(box);fitGx(box);
    const b=box.querySelector('.gx-body'),inn=box.querySelector('.gx-in');const o={fs:parseFloat(b.style.fontSize),over:inn.scrollHeight>inn.clientHeight+2};box.remove();return o;});
  ok('8 a long card: the text shrinks until it fits',long.fs<46&&!long.over,long);
  await page.evaluate(()=>setView('graphics'));await sleep(500);await page.screenshot({path:path.join(OUT,'graphics.png'),fullPage:true});
  const gx=await page.evaluate(()=>({big:document.querySelectorAll('#gxBig .gx').length,grid:document.querySelectorAll('#gxGrid .gx-t').length,pos:document.getElementById('gxPos').textContent}));
  ok('8 the Graphics view: the card large and all 18 below',gx.big===1&&gx.grid===18&&gx.pos==='Card 1 of 18',gx);
  await page.evaluate(()=>{renderPrint();});const pr=await page.evaluate(()=>({h:document.querySelector('#printOut .pr-h').textContent,g:document.querySelectorAll('#printOut .pr-g').length,r:document.querySelectorAll('#printOut .pr-r').length}));
  ok('8 print: the script by segment, every row',/Sam’s Training Video/.test(pr.h)&&pr.g===10&&pr.r===18,pr);
  await page.emulateMedia({media:'print'});const vis=await page.evaluate(()=>({p:getComputedStyle(document.getElementById('printOut')).display,s:getComputedStyle(document.querySelector('.only-graphics')).display}));await page.emulateMedia({media:'screen'});
  ok('8 only the script prints',vis.p==='block'&&vis.s==='none',vis);
  const off=reqs.filter(u=>!u.startsWith(BASE+'/')&&!u.startsWith('data:')&&!u.startsWith('blob:')&&u!=='about:blank');
  ok('8 no request off the workstation\'s own folder',!off.length,off.slice(0,5));
  ok('8 no errors',!errs.length,errs.concat(miss));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
