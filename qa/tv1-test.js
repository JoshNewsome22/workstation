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
   v21.51: the countdown, the marks, the reading line, the scroll across paragraphs and the cards following it, the clicker
   alone, the voice without a microphone, a list that builds, 9. the chapters and the captions (the voice itself: tv1-voice-test.js).
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
  await page.keyboard.press(' ');await sleep(400);const cd=await page.evaluate(()=>{const o=document.getElementById('tpCd');return {cd:o&&!o.hidden?o.textContent:'',run:TP.run};});
  ok('4 Space: 3, 2, 1 first (v21.51), then the scroll',cd.cd==='3'&&!cd.run,cd);
  await sleep(3000);const run=await page.evaluate(()=>({run:TP.run,b:document.getElementById('tpRun').textContent,cd:document.getElementById('tpCd').hidden}));await page.keyboard.press(' ');await sleep(100);
  ok('4 Space starts and stops the scroll',run.run&&run.b==='Stop'&&run.cd&&!(await page.evaluate(()=>TP.run)),run);
  await page.keyboard.press(' ');await sleep(300);await page.keyboard.press(' ');await sleep(3200);
  ok('4 Space again while it counts calls the countdown off',await page.evaluate(()=>!TP.run&&document.getElementById('tpCd').hidden));
  await page.evaluate(()=>document.querySelector('[data-c="nocd"]').click());
  const tpw=await page.evaluate(()=>{S.rows[0].tp='Words said here, not on the card.';tpRender();const a=document.querySelector('#tpStrip .tp-p .tp-t').textContent;S.rows[0].tp='';tpRender();const b=document.querySelector('#tpStrip .tp-p .tp-t').textContent;return {a,b,say:S.rows[0].say};});
  ok('4 a row\'s teleprompter words go on the teleprompter in place of its paragraphs; blank, the paragraphs',tpw.a==='Words said here, not on the card.'&&tpw.b===tpw.say.replace(/\n+/g,''),tpw);
  await page.click('#tpRec');await sleep(300);await page.keyboard.press('PageDown');await sleep(400);await page.keyboard.press('PageDown');await sleep(400);await page.click('#tpRec');
  const lg=await page.evaluate(()=>({log:S.log,line:document.getElementById('logLine').textContent,rec:document.getElementById('tpRec').textContent}));
  ok('4 the clock keeps each card\'s time (the card it started on, then each next)',lg.log.length===3&&lg.log.map(l=>l.i).join()==='1,2,3'&&lg.log[2].t>lg.log[1].t&&lg.log[1].t>=lg.log[0].t&&/3 card times/.test(lg.line)&&lg.rec==='Start the clock',lg);
  const csvP=await dl(()=>document.getElementById('logCsv').click());const csv=fs.readFileSync(csvP,'utf8');
  ok('4 the card times export as CSV',/^"Card","Seconds","Time","Segment","Title"\n"2",/.test(csv)&&csv.split('\n').length===4&&/"Covering"/.test(csv),csv);
  await page.evaluate(()=>document.querySelector('[data-c="mirror"]').click());await page.evaluate(()=>{const r=document.querySelector('[data-m="tpsize"]');r.value='80';r.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
  const mi=await page.evaluate(()=>{const sc=document.getElementById('tpScreen');return {m:sc.classList.contains('mirror'),tf:getComputedStyle(sc).transform,fs:getComputedStyle(document.querySelector('.tp-p')).fontSize};});
  ok('4 mirror flips the screen; the size sets the words',mi.m&&/^matrix\(-1/.test(mi.tf)&&mi.fs==='80px',mi);
  await page.evaluate(()=>document.querySelector('[data-c="mirror"]').click());
  /* v21.51 the marks, the reading line, the scroll across paragraphs with the cards following it, the voice without a microphone */
  const mk=await page.evaluate(()=>{const r=S.rows[0],o=r.tp;r.tp='Hello // there *Sam* {smile} 15 again';tpRender();const t=document.querySelector('#tpStrip .tp-p .tp-t');
    const res={pause:!!t.querySelector('.tp-pause'),em:(t.querySelector('.tp-em')||{}).textContent,note:(t.querySelector('.tp-note')||{}).textContent,tw:[...t.querySelectorAll('.tw')].map(e=>e.textContent).join(' '),sw:SW.filter(x=>x.k===0).map(x=>x.w).join(' '),n:words(r.tp)};
    r.tp=o;const s0=r.say;r.say='Welcome // to the *plan*. {breathe}';const b=document.createElement('div');b.innerHTML=cardHtml(r,{});res.card=b.querySelector('.pn-in').textContent;res.B=sheetRows()[0][1];r.say=s0;tpRender();return res;});
  ok('4 the marks: a pause, a word stressed and a note show on the teleprompter; the words are matched without them (15 as fifteen)',mk.pause&&mk.em==='Sam'&&mk.note==='smile'&&mk.tw==='Hello there Sam 15 again'&&mk.sw==='hello there sam fifteen again'&&mk.n===5,mk);
  ok('4 the marks never reach a card or the sheet',!/\/\/|\*|\{|breathe/.test(mk.card)&&/^Welcome to the plan\./.test(mk.card)&&mk.B==='Welcome to the plan.',mk);
  await page.evaluate(()=>{const r=document.querySelector('[data-m="tpline"]');r.value='50';r.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(100);
  const rl=await page.evaluate(()=>{const sc=document.getElementById('tpScreen');return {s:parseFloat(getComputedStyle(document.getElementById('tpStrip')).top),l:parseFloat(getComputedStyle(document.querySelector('.tp-line')).top),h:sc.clientHeight};});
  ok('4 the reading line where it is set (the script starts on it)',Math.abs(rl.s-rl.h*.5)<2&&Math.abs(rl.l-rl.h*.5)<2,rl);
  await page.evaluate(()=>{const r=document.querySelector('[data-m="tpline"]');r.value='30';r.dispatchEvent(new Event('input',{bubbles:true}));});
  const W=ms=>new Promise(r=>setTimeout(r,ms));
  const tpAt=await page.evaluate(()=>TP.i);
  const scr=await page.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));tpGo(0,true);TP.man=0;const P=[...document.querySelectorAll('#tpStrip .tp-p')],y0=TP.y;tpToggle();await w(700);const y1=TP.y;
    TP.y=P[1].offsetTop+4;await w(250);const i1=TP.i;TP.y=P[2].offsetTop+4;await w(250);const i2=TP.i;S.chk.tpmanual=true;TP.y=P[4].offsetTop+4;await w(250);const i3=TP.i;S.chk.tpmanual=false;tpToggle();
    return {y0,y1,i1,i2,i3,run:TP.run,want:[paras()[1].start,paras()[2].start],rd:document.querySelectorAll('#tpStrip .tw.rd').length};});
  ok('4 the scroll goes on from paragraph to paragraph, and the cards change as each reaches the reading line',scr.y1>scr.y0&&scr.i1===scr.want[0]&&scr.i2===scr.want[1]&&!scr.run,scr);
  ok('4 Only the clicker changes the cards: the scroll leaves the card',scr.i3===scr.i2,scr);
  await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('denied','NotAllowedError'));const m=document.querySelector('[data-m="tpmode"]');m.value='speak';m.dispatchEvent(new Event('change',{bubbles:true}));tpGo(0,true);tpToggle();});await sleep(900);
  const sp=await page.evaluate(()=>{const v=document.getElementById('tpVoice');const o={msg:v.hidden?'':v.textContent,md:tpMd(),y:TP.y,vo:document.body.classList.contains('tp-voice'),sens:getComputedStyle(document.querySelector('[data-m="tpsens"]').closest('label')).display};tpToggle();
    const m=document.querySelector('[data-m="tpmode"]');m.value='fixed';m.dispatchEvent(new Event('change',{bubbles:true}));o.after=document.body.classList.contains('tp-voice');return o;});
  ok('4 While I speak, with no microphone to be had: it says so and scrolls at the speed set; the microphone setting shows only in the voice modes',/microphone/.test(sp.msg)&&sp.md==='fixed'&&sp.y>0&&sp.vo&&sp.sens!=='none'&&!sp.after,sp);
  await page.evaluate(i=>tpGo(i,true),tpAt);
  await page.screenshot({path:path.join(OUT,'prompter.png')});
  /* 5 */
  const [pop]=await Promise.all([page.waitForEvent('popup'),page.click('#tpGfx')]);await sleep(700);
  const g0=await pop.evaluate(()=>{const l=[...document.querySelectorAll('.ly')].find(x=>x.style.opacity==='1'||x.style.opacity==='');const h=l&&l.querySelector('.pn-h');return {bg:getComputedStyle(document.body).backgroundColor,t:h?h.textContent:''};});
  const at=await page.evaluate(()=>[S.rows[TP.i].title,S.rows[TP.i+1].title]);
  const ff=await pop.evaluate(()=>getComputedStyle(document.querySelector('.ly .gx')).fontFamily);
  ok('5 the window draws the cards in Lato, built in (no network)',/^"TV Lato"/.test(ff)&&await pop.evaluate(()=>document.fonts.check("900 40px 'TV Lato'")),ff);
  const flat=await pop.evaluate(()=>{const c=document.querySelector('.ly .pn');const st=getComputedStyle(c);return {sh:st.boxShadow,bg:st.backgroundImage,lc:document.getElementById('lc').textContent.slice(0,60)};});
  ok('5 the Panel look: the panel is solid (a gradient, no shadow) and the logo comes with it',flat.sh==='none'&&/linear-gradient/.test(flat.bg)&&/pn-logo\{background-image:url\("data:image\//.test(flat.lc),flat);
  ok('5 the graphics window opens on green (the key) with the card shown on the teleprompter',g0.bg==='rgb(0, 177, 64)'&&g0.t===at[0],[g0,at]);
  await page.bringToFront();await page.keyboard.press('PageDown');await sleep(150);
  const mid=await pop.evaluate(()=>{const l=[...document.querySelectorAll('.ly')].find(x=>x.style.opacity==='1');return {layers:[...document.querySelectorAll('.ly')].map(x=>x.style.opacity),tx:l?[...l.querySelectorAll('.gx-tx')].map(e=>getComputedStyle(e).opacity).map(Number):[],pn:l?getComputedStyle(l.querySelector('.pn')).opacity:''};});
  ok('5 the next card in the same layout: the panel stays and only its words fade (as the Flowics template)',mid.pn==='1'&&mid.tx.length>0&&mid.tx.every(o=>o<1)&&mid.layers.filter(o=>o==='1').length===1,mid);
  await sleep(1100);
  const shown=async()=>pop.evaluate(()=>{const l=[...document.querySelectorAll('.ly')].find(x=>x.style.opacity==='1');const t=l&&l.querySelector('.pn-h');return t?t.textContent:'';});
  ok('5 the next card on the teleprompter changes the window',(await shown())===at[1],[await shown(),at]);
  await page.evaluate(()=>{setView('setup');const s=document.querySelector('[data-m="gbg"]');s.value='black';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(600);
  ok('5 a black background (luma key) reaches the open window',(await pop.evaluate(()=>getComputedStyle(document.body).backgroundColor))==='rgb(0, 0, 0)');
  /* v21.50b plain white (no key), and the ticker's speed */
  const setM=async(k,v,ev)=>{await page.evaluate(([k,v,ev])=>{const s=document.querySelector('[data-m="'+k+'"]');s.value=v;s.dispatchEvent(new Event(ev,{bubbles:true}));},[k,v,ev]);await sleep(700);};
  await setM('gbg','white','change');
  ok('5 White: the window is plain white, and the panel keeps no key-safe flattening it does not need',await pop.evaluate(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)'&&!document.querySelector('.ly[style*="opacity: 1"] .gx.flat')));
  const tk=()=>pop.evaluate(()=>{const t=[...document.querySelectorAll('.ly')].find(l=>l.style.opacity==='1').querySelector('.tk-in');const st=getComputedStyle(t);return {d:parseFloat(st.animationDuration),n:st.animationName,w:t.scrollWidth};});
  await setM('tkspd','90','input');const k90=await tk();await setM('tkspd','45','input');const k45=await tk();await setM('tkspd','0','input');const k0=await tk();
  const tl=await page.evaluate(()=>document.getElementById('tkV').textContent);await setM('tkspd','90','input');
  await setM('tksize','30','input');await setM('tkfont','lato','change');await setM('tkcol','#7a1020','input');
  const tf=await pop.evaluate(()=>{const t=[...document.querySelectorAll('.ly')].find(l=>l.style.opacity==='1').querySelector('.tk-in');const st=getComputedStyle(t);return {fs:st.fontSize,ff:st.fontFamily,c:st.color,sp:parseFloat(st.animationDuration),w:t.scrollWidth};});
  const tz=await page.evaluate(()=>document.getElementById('tkZ').textContent);
  ok('5 the ticker text: its size, its type and its colour reach the open window, and the speed holds for the new width',tf.fs==='30px'&&/^"TV Lato"/.test(tf.ff)&&tf.c==='rgb(122, 16, 32)'&&Math.abs(tf.sp-tf.w/2/90)<0.5&&tz==='(30 px)',tf);
  await setM('tksize','43','input');await setM('tkfont','merri','change');await setM('tkcol','#111111','input');
  ok('5 the ticker speed: half the speed takes twice as long; 0 holds it still; Setup says the speed',Math.abs(k45.d/k90.d-2)<0.05&&Math.abs(k90.d-k90.w/2/90)<0.5&&k0.n==='none'&&tl==='(still)',{k90,k45,k0,tl});
  /* v21.51 a list that builds: the points come one a click; the card before shows its whole list */
  const b_bi=await page.evaluate(()=>S.rows.findIndex(r=>String(r.body).split('\n').filter(x=>x.trim()).length>=3));
  await page.evaluate(i=>{setView('script');const c=document.querySelector('[data-i="'+i+'"][data-f="build"]');c.click();setView('prompter');tpGo(i,true);},b_bi);await sleep(1000);
  const rvs=()=>pop.evaluate(()=>{const l=[...document.querySelectorAll('.ly')].find(x=>x.style.opacity==='1');return [...l.querySelectorAll('[data-rv]')].map(e=>e.classList.contains('rv-hid')?0:1).join('');});
  const b_nb=await page.evaluate(i=>({b:S.rows[i].build,n:buildN(S.rows[i])}),b_bi);
  const b_r0=await rvs();await page.keyboard.press('PageDown');await sleep(450);const b_r1=await rvs();const b_p1=await page.evaluate(()=>[TP.i,TP.b,document.getElementById('tpPos').textContent]);
  await page.keyboard.press('PageDown');await sleep(450);const b_r2=await rvs();await page.keyboard.press('PageUp');await sleep(450);const b_r3=await rvs();
  ok('5 a list that builds (ticked on its row): hidden on its card, one point more a click, one less with Page Up',b_nb.b&&b_r0==='0'.repeat(b_nb.n)&&b_r1==='1'+'0'.repeat(b_nb.n-1)&&b_r2==='11'+'0'.repeat(b_nb.n-2)&&b_r3===b_r1&&b_p1[0]===b_bi&&new RegExp('point 1 of '+b_nb.n).test(b_p1[2]),{b_nb,b_r0,b_r1,b_r2,b_r3,b_p1});
  for(let k=0;k<b_nb.n;k++){await page.keyboard.press('PageDown');await sleep(120);}
  const b_nx=await page.evaluate(()=>TP.i);await sleep(600);await page.keyboard.press('PageUp');await sleep(1000);const b_r4=await rvs();
  ok('5 after the last point the next card; back from it, the whole list',b_nx===b_bi+1&&b_r4==='1'.repeat(b_nb.n)&&(await page.evaluate(()=>TP.i))===b_bi,{b_nx,b_r4});
  await page.evaluate(i=>{S.rows[i].build=false;},b_bi);
  await pop.setViewportSize({width:1280,height:720});await sleep(300);await pop.screenshot({path:path.join(OUT,'window.png')});await pop.close();
  /* 6 */
  await page.evaluate(()=>{S.rows[3].pics[0].cap='Sam at the art table';S.rows[3].x=['G','H','I'].concat(Array(17).fill(''));syncState();});
  const xP=await dl(()=>document.getElementById('xlsxBtn').click());
  const wb=await page.evaluate(async b=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));const sh=await readXlsx(u);return sh.map(s=>({name:s.name,n:s.rows.length,w:Math.max(...s.rows.map(r=>r.length)),r:s.rows}));},fs.readFileSync(xP).toString('base64'));
  ok('6 the workbook: the first tab every row (A to Z in the Chapters look), then a tab for each other segment',wb.length===10&&wb[0].name==='01_Training_Overview'&&wb[0].n===18&&wb[0].w>=22&&wb[1].name==='02_Student_Profile'&&wb[3].name==='04_Function_And_Data'&&wb[9].name==='10_Terms_And_Definitions',wb.map(s=>[s.name,s.n,s.w]));
  ok('6 a continued row repeats its paragraph\'s words in column B; captions in E, F; the template\'s columns G to I kept',wb[0].r[1][1]===wb[0].r[0][1]&&wb[0].r[1][2]==='Training Overview'&&wb[0].r[3][4]==='Sam at the art table'&&wb[0].r[3].slice(6,9).join()==='G,H,I',wb[0].r.slice(0,4));
  const before=await page.evaluate(()=>JSON.stringify(S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics.map(p=>p.cap),r.x.slice(0,3),chOf(r)])));
  await page.setInputFiles('#impIn',xP);await sleep(900);
  const after=await page.evaluate(()=>JSON.stringify(S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics.map(p=>p.cap),r.x.slice(0,3),chOf(r)])));
  ok('6 the workbook comes back in as it went out (the continued rows found again, each card in its chapter)',after===before,[before.slice(0,300),after.slice(0,300)]);
  const csvIn=path.join(OUT,'sheet.csv');fs.writeFileSync(csvIn,'﻿"Opening","Hello team.\nThis is the plan.","Welcome","• One\n• Two","","","","",""\r\n"Opening","Hello team.\nThis is the plan.","Agenda","Profile","","","","",""\r\n,,,,,,,,\r\n"Behaviors","Elopement means leaving.","Elopement","Leaving the area","Door","Hallway","x","y","z"\r\n');
  await page.setInputFiles('#impIn',csvIn);await sleep(700);
  const ci=await page.evaluate(()=>({rows:S.rows.map(r=>[r.seg,r.say,r.cont,r.title,r.body,r.pics[0].cap,r.pics[1].cap,r.x.join('')]),view:document.body.className}));
  ok('6 a CSV in the sheet\'s layout: three rows (the empty one skipped), the second continues the first, captions and the last columns kept',ci.rows.length===3&&ci.rows[1][2]===true&&ci.rows[1][1]===''&&ci.rows[0][1]==='Hello team.\nThis is the plan.'&&ci.rows[2][5]==='Door'&&ci.rows[2][6]==='Hallway'&&ci.rows[2][7]==='xyz'&&/view-script/.test(ci.view),ci.rows);
  /* 7 */
  await page.evaluate(()=>loadSim());await sleep(800);
  await page.evaluate(()=>{S.rows[2].build=true;S.wt=[[1,2.5],[3,4]];S.photos.push({id:'pa',label:'a',img:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='});S.rows[5].pics[0]={ph:'pa',cap:'Cap'};S.rows[5].lay='pic1';renderAll();});
  const sv=await dl(()=>document.getElementById('saveBtn').click());const saved=JSON.parse(fs.readFileSync(sv,'utf8'));
  const ref=await page.evaluate(()=>JSON.stringify({rows:S.rows,photos:S.photos,meta:S.meta,wt:S.wt}));
  await page.evaluate(()=>{S=blank();renderAll();});await page.setInputFiles('#fileIn',sv);await sleep(700);
  const back=await page.evaluate(()=>JSON.stringify({rows:S.rows,photos:S.photos,meta:S.meta,wt:S.wt}));
  ok('7 Save data and Open: the same script, pictures and settings back',saved.form==='TV-1'&&back===ref,[ref.length,back.length]);
  const bad={form:'TV-1',rev:'2026-10',S:{meta:{client:'<img src=x onerror=alert(1)>',c1:'red;background:url(x)'},rows:[{seg:'<b>s</b>',say:'hi',title:'<script>alert(1)<\/script>',body:'<img src=x onerror=alert(2)>',lay:'evil',cont:true,pics:[{ph:'zz',cap:'<i>c</i>'}]}],photos:[{id:'zz',img:'javascript:alert(1)'},{id:'<x>',img:'data:image/png;base64,AAAA'}],log:[{i:'x',t:'y'}],wt:[['x','y'],'zz',[1,2,3],[2,'<b>']]}};
  const badP=path.join(OUT,'bad.json');fs.writeFileSync(badP,JSON.stringify(bad));await page.setInputFiles('#fileIn',badP);await sleep(600);
  const b1=await page.evaluate(()=>({n:S.rows.length,cont:S.rows[0].cont,lay:S.rows[0].lay,ph:S.rows[0].pics[0].ph,photos:S.photos.length,imgs:document.querySelectorAll('#rows img,.tv-thumb img').length,scripts:[...document.querySelectorAll('#rows script,.tv-thumb script')].length,
    title:(document.querySelector('.tv-thumb .pn-h')||{}).textContent,log:S.log,c1:S.meta.c1,wt:JSON.stringify(S.wt)}));
  ok('7 a file from elsewhere: markup is text, a bad picture is dropped, a first row cannot continue, a bad layout is Automatic, a colour that is not a colour the default',b1.n===1&&!b1.cont&&b1.lay==='auto'&&b1.ph===''&&b1.photos===0&&b1.imgs===0&&b1.scripts===0&&b1.title==='<script>alert(1)</script>'&&b1.log[0].i===0&&b1.c1==='#222f5a'&&b1.wt==='[[0,0],[2,0]]',b1);
  const other=path.join(OUT,'other.json');fs.writeFileSync(other,JSON.stringify({form:'TK-1',S:{}}));await page.setInputFiles('#fileIn',other);await sleep(400);
  ok('7 a file saved by another form is refused; nothing changes',(await page.evaluate(()=>S.rows.length))===1);
  /* v21.51 the chapters and the captions of a take, from the card times (and the words heard) */
  await page.evaluate(()=>loadSim());await sleep(800);
  const cc=await page.evaluate(()=>{S.meta.look='chapters';const P=paras();S.log=P.map((p,k)=>({i:p.start,t:k?k*15+3:0,seg:S.rows[p.start].seg,title:S.rows[p.start].title}));S.wt=[];
    S.rows[0].say='Welcome // to *Sam’s* training, {smile} everyone. '+S.rows[0].say;const c=chaptersOf(),q=cuesOf();
    const k0=SW.filter(x=>x.k===0),s0=[...new Set(k0.map(x=>x.s))];S.wt=s0.map((s,j)=>[s,j*0.5]);const q2=cuesOf();const first2=q2.length>1?q2[1]:null;const idx2=first2?s0.findIndex(s=>first2.text.split(/\s/)[0]===SP[s].textContent.replace(/[,.]$/,'')):-1;
    return {c:c.list.map(x=>hms(x.t)+' '+x.l),note:c.note,chs:chList().list,q0:q.slice(0,3),n:q.length,maxLine:Math.max(...q.map(x=>Math.max(...x.text.split('\n').map(l=>l.length)))),lines:Math.max(...q.map(x=>x.text.split('\n').length)),
      mono:q.every((x,j)=>x.b>x.a&&(!q[j+1]||x.b<=q[j+1].a+1e-9)),marks:q.some(x=>/\/\/|\*|\{|smile/.test(x.text)),w2:first2&&first2.a,want2:idx2*0.5,idx2,q2a:q2[0]};});
  ok('9 YouTube chapters: the first at 0:00, one for each chapter of the bar (each 10 seconds or more)',cc.c.length===cc.chs.length&&cc.c[0]==='0:00 '+cc.chs[0]&&cc.c.every((x,j)=>x.endsWith(' '+cc.chs[j]))&&!cc.note,cc);
  ok('9 the captions: the script\'s words without the marks, two lines of at most 42 characters, in order, none overlapping',cc.n>15&&cc.maxLine<=42&&cc.lines<=2&&cc.mono&&!cc.marks&&cc.q0[0].a===0&&/^Welcome to Sam’s training, everyone\./.test(cc.q0[0].text.replace(/\n/g,' ')),cc);
  ok('9 with the words heard, a caption starts when its first word was said',cc.idx2>0&&Math.abs(cc.w2-cc.want2)<0.01,cc);
  const chP=await dl(()=>document.getElementById('chapBtn').click());const chT=fs.readFileSync(chP,'utf8');
  const srtP=await dl(()=>document.getElementById('srtBtn').click());const srt=fs.readFileSync(srtP,'utf8');
  const vttP=await dl(()=>document.getElementById('vttBtn').click());const vtt=fs.readFileSync(vttP,'utf8');
  ok('9 the files: the chapters as text for the description, SRT and WebVTT',/^0:00 Intro\n\d+:\d\d \S/.test(chT)&&/_YouTube-chapters\.txt$/.test(chP)&&/^1\n00:00:00,000 --> 00:00:\d\d,\d{3}\nWelcome to Sam’s/.test(srt)&&/\n\n2\n00:00:\d\d,\d{3} --> /.test(srt)&&/^WEBVTT\n\n00:00:00\.000 --> 00:00:\d\d\.\d{3}\n/.test(vtt)&&/_captions\.vtt$/.test(vttP),[chT.slice(0,80),srt.slice(0,120),vtt.slice(0,80)]);
  const short=await page.evaluate(()=>{const f=c=>S.rows.findIndex(r=>chOf(r)===c);S.log=[{i:f(0),t:0},{i:f(1),t:4},{i:f(2),t:30}].map(l=>Object.assign(l,{seg:S.rows[l.i].seg,title:S.rows[l.i].title}));const c=chaptersOf();return {n:c.list.length,note:c.note};});
  ok('9 a chapter under 10 seconds is left out, and fewer than three is said',short.n===2&&/at least three/.test(short.note)&&/1 shorter than 10 seconds/.test(short.note),short);
  /* 8 */
  await page.evaluate(()=>loadSim());await sleep(800);
  for(const look of ['chapters','panel','cards']){
  const lays=await page.evaluate(look=>{S.meta.look=look;const out={};['side','lower','full','title','pic1','pic2','split','none'].forEach(l=>{const r=JSON.parse(JSON.stringify(S.rows[6]));r.lay=l;if(/pic/.test(l)){r.pics=[{ph:'',cap:'One'},{ph:'',cap:'Two'}];}
    const box=document.createElement('div');box.style.cssText='position:absolute;left:0;top:0';box.innerHTML=stageHtml(r,960,{presenter:true});document.body.appendChild(box);fitGx(box);const g=box.querySelector('.gx').getBoundingClientRect(),c=box.querySelector('.gx-card,.gx-band,.pn');
    const cr=c?c.getBoundingClientRect():null,inn=box.querySelector('.gx-in');out[l]={inside:!cr||(cr.left>=g.left-1&&cr.right<=g.right+1&&cr.top>=g.top-1&&cr.bottom<=g.bottom+1),over:inn?inn.scrollHeight>inn.clientHeight+2:false,card:!!c};box.remove();});S.meta.look='chapters';return out;},look);
  ok('8 '+look+' look: every layout draws inside the stage, its text fitted to its card; no card on "No card"',Object.values(lays).every(x=>x.inside&&!x.over)&&!lays.none.card&&lays.title.card,lays);}
  const long=await page.evaluate(()=>{S.meta.look='cards';const r=JSON.parse(JSON.stringify(S.rows[6]));r.lay='side';r.body=Array.from({length:14},(_,i)=>'• A long point number '+i+' that goes on for a while').join('\n');const box=document.createElement('div');box.innerHTML=stageHtml(r,960,{});document.body.appendChild(box);fitGx(box);
    const b=box.querySelector('.gx-body'),inn=box.querySelector('.gx-in');const o={fs:parseFloat(b.style.fontSize),over:inn.scrollHeight>inn.clientHeight+2};box.remove();S.meta.look='chapters';return o;});
  ok('8 Cards look, a long card: the text shrinks until it fits',long.fs<46&&!long.over,long);
  /* the Panel look, as the sheet's columns: A the panel's title, B its paragraphs, C the gold heading, D the list; the band, the tag, the logo */
  const pn=await page.evaluate(()=>{setLook('panel');const r=newRow('Training Overview',{say:'The first paragraph.\n\nThe second paragraph.',title:'Covering',body:'• The FBA\n• The BIP\n• Denial vs. delay\n• The first nine weeks\n• One more\n• And another\n• The seventh'});
    const box=document.createElement('div');box.innerHTML=stageHtml(r,960,{});document.body.appendChild(box);fitGx(box);const q=x=>box.querySelector(x),inn=q('.pn-in');
    const o={t:q('.pn-t').textContent,tt:getComputedStyle(q('.pn-t')).textTransform,p:[...box.querySelectorAll('.pn-in p')].map(e=>e.textContent),h:q('.pn-h').textContent,hc:getComputedStyle(q('.pn-h')).color,b:[...box.querySelectorAll('.pn-l .b')].map(e=>e.textContent),
      band:q('.pn-band').textContent,tag:q('.pn-tag').textContent,logo:!!q('.pn-logo'),fs:parseFloat(inn.style.fontSize),lg:inn.style.getPropertyValue('--lg'),over:inn.scrollHeight>inn.clientHeight+2,
      left:Math.round(q('.pn').getBoundingClientRect().left-box.querySelector('.gx').getBoundingClientRect().left),w:Math.round(q('.pn').getBoundingClientRect().width)};box.remove();setLook('chapters');return o;});
  ok('8 the Panel look: A the title (in capitals), B two paragraphs, C the heading in gold, D seven bullets; the series band, the tag from the name, the logo',pn.t==='Training Overview'&&pn.tt==='uppercase'&&pn.p.join('|')==='The first paragraph.|The second paragraph.'&&pn.h==='Covering'&&pn.hc==='rgb(203, 185, 138)'&&pn.b.length===7&&/^•/.test(pn.b[0])&&
    pn.band==='Functional Treatments in Applied Behavior Analysis'&&pn.tag==='FBA & BIP Video Training: Sam S.'&&pn.logo,pn);
  ok('8 the Panel look: on the left half of the picture (16 to 962 of 1920)',pn.left===8&&pn.w===473,pn);
  ok('8 the Panel look: a long list closes up its spacing first; the words keep their size',pn.fs===30&&parseFloat(pn.lg)<1.15&&!pn.over,pn);
  await page.evaluate(()=>setView('graphics'));await sleep(500);await page.screenshot({path:path.join(OUT,'graphics.png'),fullPage:true});
  const gx=await page.evaluate(()=>({big:document.querySelectorAll('#gxBig .gx').length,grid:document.querySelectorAll('#gxGrid .gx-t').length,pos:document.getElementById('gxPos').textContent}));
  ok('8 the Graphics view: the card large and all 18 below',gx.big===1&&gx.grid===18&&gx.pos==='Card 1 of 18',gx);
  await page.evaluate(()=>{renderPrint();});const pr=await page.evaluate(()=>({h:document.querySelector('#printOut .pr-h').textContent,g:document.querySelectorAll('#printOut .pr-g').length,r:document.querySelectorAll('#printOut .pr-r').length}));
  ok('8 print: the script by segment, every row',/Sam’s Training Video/.test(pr.h)&&pr.g===10&&pr.r===18,pr);
  await page.emulateMedia({media:'print'});const vis=await page.evaluate(()=>({p:getComputedStyle(document.getElementById('printOut')).display,s:getComputedStyle(document.querySelector('.only-graphics')).display}));await page.emulateMedia({media:'screen'});
  ok('8 only the script prints',vis.p==='block'&&vis.s==='none',vis);
  /* 9 the Chapters look (the newer template): the chapter bar with the card's own chapter lit, the ticker, the A-Z sheet */
  await page.evaluate(()=>loadSim());await sleep(800);
  const c9=await page.evaluate(()=>{const r=S.rows.find(x=>x.title==='Physical aggression');const box=document.createElement('div');box.innerHTML=stageHtml(r,960,{});document.body.appendChild(box);fitGx(box);
    const o={look:S.meta.look,chs:S.meta.chapters.split('\n'),tabs:[...box.querySelectorAll('.pn-bar>div')].map(e=>e.textContent),on:[...box.querySelectorAll('.pn-bar>div.on')].map(e=>e.textContent),
      tick:[...box.querySelectorAll('.pn-tick .tk-in span')].length,tt:(box.querySelector('.pn-tick span')||{}).textContent,tag:!!box.querySelector('.pn-tag'),t:getComputedStyle(box.querySelector('.pn-t')).color,ff:getComputedStyle(box.querySelector('.pn-bar>div')).fontFamily};box.remove();return o;});
  ok('9 the draft sets six chapters for the bar; the card on a target behavior lights Behavior; the ticker runs the series; no tag; the title in the light gold; the bar in Merriweather',
    c9.look==='chapters'&&c9.chs.join('|')==='Intro|Behavior|Goals|The Plan|Response|Close'&&c9.tabs.join('|')===c9.chs.join('|')&&c9.on.join()==='Behavior'&&c9.tick===6&&c9.tt==='Functional Treatments in Applied Behavior Analysis'&&!c9.tag&&c9.t==='rgb(238, 217, 173)'&&/^"TV Merri"/.test(c9.ff),c9);
  await page.evaluate(()=>{const r=S.rows.find(x=>x.title==='Hypothesis');r.lay='split';r.title='Results';r.body='The words beside the picture.';});
  const xP2=await dl(()=>document.getElementById('xlsxBtn').click());
  const wb2=await page.evaluate(async b=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));const sh=await readXlsx(u);return sh[0].rows;},fs.readFileSync(xP2).toString('base64'));
  const iB=await page.evaluate(()=>S.rows.findIndex(x=>x.title==='Physical aggression')),iS=await page.evaluate(()=>S.rows.findIndex(x=>x.title==='Results'));
  ok('9 the sheet: P the chapters from the first row, Q to V the tabs (1 for the card\'s own chapter, 0.35 the others), a picture card\'s words in M and N',
    wb2.slice(0,6).map(r=>r[15]).join('|')==='Intro|Behavior|Goals|The Plan|Response|Close'&&wb2[iB].slice(16,22).join()==='0.35,1,0.35,0.35,0.35,0.35'&&wb2[iS][12]==='Results'&&wb2[iS][13]==='The words beside the picture.'&&!wb2[iS][2]&&!wb2[iS][3],[wb2[iB].slice(15,22),wb2[iS].slice(0,4),wb2[iS].slice(12,15)]);
  /* a sheet in the newer template's layout (as Scatter_Plot_Graphics): its chapters, a card beside a picture, the picture's file named */
  const Z=(o)=>{const r=Array(26).fill('');Object.entries(o).forEach(([k,v])=>{r[k.charCodeAt(0)-65]=v;});return r;};
  const q=x=>'"'+String(x).replace(/"/g,'""')+'"';
  const sc=[Z({A:'Welcome',B:'South Florida\n\nThe Average Problem',D:'•  Average is 73 degrees.\n\n•  July: hot.',P:'Intro'}),Z({A:'Welcome',B:'The problem with line graphs.',P:'Instrument'}),Z({A:'The Instrument',B:'Time of day runs down the side.',C:'Definition',D:'•  Open cell',P:'Close',Q:'0.35',R:'1',S:'0.35'}),
    Z({A:'Case 1: Joan',M:'Results',N:'Following the intervention you see an immediate drop.',O:'IMG_0004.jpeg'})];
  const scP=path.join(OUT,'scatter.csv');fs.writeFileSync(scP,sc.map(r=>r.map(q).join(',')).join('\n'));await page.setInputFiles('#impIn',scP);await sleep(800);
  const c10=await page.evaluate(()=>({look:S.meta.look,chs:S.meta.chapters.split('\n'),n:S.rows.length,ch:S.rows.map(r=>chList().list[chOf(r)]),sp:[S.rows[3].lay,S.rows[3].title,S.rows[3].body],o:document.body.innerText.includes('The sheet names a picture: IMG_0004.jpeg'),say0:S.rows[0].say}));
  ok('9 a sheet in the newer layout: its chapters (P), the card beside a picture (M, N), the chapter lit by its tabs (Q to Z), the picture it names',
    c10.look==='chapters'&&c10.chs.join('|')==='Intro|Instrument|Close'&&c10.n===4&&c10.ch.join('|')==='Intro|Intro|Instrument|Instrument'&&c10.sp.join('|')==='split|Results|Following the intervention you see an immediate drop.'&&c10.o&&c10.say0==='South Florida\n\nThe Average Problem',c10);
  const off=reqs.filter(u=>!u.startsWith(BASE+'/')&&!u.startsWith('data:')&&!u.startsWith('blob:')&&u!=='about:blank');
  ok('8 no request off the workstation\'s own folder',!off.length,off.slice(0,5));
  ok('8 no errors',!errs.length,errs.concat(miss));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
