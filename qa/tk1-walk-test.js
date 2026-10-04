/* Form TK-1, the Walkthrough view (v21.43): the narrated walkthrough built from the book. The view opens with no errors;
   TKWALK and its timeline (duration, the cues in the narration's order, the terminal or the plain last-token line as the
   book has it); the state at points of the timeline (the cards on their boxes, the chosen card under Then and the target
   under First, the tokens in their slots, the last one the terminal token, the slots empty after the reset); renderAt is a
   pure function of time; sync (what a line says happens while that line plays; no overlapping lines, short pauses); the
   build's own narration and hand drawings are used; building it changes nothing in the book (S) or in print; leaving the view pauses; reduced motion
   cuts each cue to its end; the controls have names; no sideways scroll on the iPad and a phone; a picture of the stage at
   the middle of every cue (TK1_WALK_SHOTS, default qa/out/tk1-walk/). */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
const SHOTS=process.env.TK1_WALK_SHOTS||__dirname+'/out/tk1-walk';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(detail?' ('+detail+')':''));if(!ok)fails++;};
const ORDER=['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','tk_page','rule','start','tok_first','tok_none','tok_more','LAST','exchange','reset','tips','outro'];
const REQUIRED=new Set(['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','rule','start','tok_first','tok_more','LAST','exchange','reset','tips','outro']);
const errorsOf=log=>log.filter(l=>l.type==='error'||l.type==='pageerror');
/* in the page: what the stage shows at time t (visible cards with their centres; the boxes of the pages) */
const PROBE=`window.__wkProbe=function(t){TKWALK.renderAt(t);
  const vis=el=>{let o=1;for(let e=el;e&&e!==document.body;e=e.parentElement){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return 0;o*=parseFloat(cs.opacity);}return o;};
  const R=el=>{const r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2};};
  const cards=[...document.querySelectorAll('#wkStage [data-card]')].filter(e=>vis(e)>.5).map(e=>Object.assign(R(e),{id:e.dataset.card,last:!!e.querySelector('.card.tok.last'),fly:e.classList.contains('wk-fc')}));
  const pg=k=>document.querySelector('#wkStage .wk-page[data-pg="'+k+'"]');const pv=k=>vis(pg(k))>.5;
  const all=(k,s)=>[...pg(k).querySelectorAll(s)].map(R);
  return{cards,pages:{ch:pv('ch'),tg:pv('tg'),bd:pv('bd'),tk:pv('tk')},chBx:all('ch','.bx'),tgBx:all('tg','.bx'),first:all('bd','.bx.ft.grey')[0],then:all('bd','.bx.ft.green')[0],
    slots:all('bd','.slot'),ybx:all('tk','.ybx'),cap:(document.querySelector('#wkStage .wk-cap')||{}).textContent||''};};
  window.__wkTf=function(t){TKWALK.renderAt(t);return [...document.querySelectorAll('#wkStage *')].filter(e=>e.style&&(e.style.transform||e.style.opacity)).map(e=>e.style.transform+'|'+e.style.opacity+'|'+e.style.visibility).join(';');};`;
const inside=(c,r,tol)=>r&&Math.abs(c.cx-r.cx)<=(tol||2)&&Math.abs(c.cy-r.cy)<=(tol||2);
const inRect=(c,r)=>r&&c.cx>=r.x&&c.cx<=r.x+r.w&&c.cy>=r.y&&c.cy<=r.y+r.h;
async function open(br,vp,setup){const page=await br.newPage({viewport:vp||{width:1180,height:820}});const log=[];wire(page,log);
  await page.goto(URL);await sleep(500);await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;});
  if(setup)await page.evaluate(setup);await sleep(250);
  await page.evaluate(()=>document.querySelectorAll('.nbh-toast,[class*="toast"]').forEach(e=>e.remove()));
  await page.addScriptTag({content:PROBE});return{page,log};}
const sim=()=>{document.querySelector('#simBtn').click();};
const pdfPages=async page=>{await page.click('#viewSeg button[data-view="preview"]');await sleep(200);await page.emulateMedia({media:'print'});await page.evaluate(()=>fitAll());
  const buf=await page.pdf({printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:'screen'});return(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;};

async function timeline(page,label){
  const r=await page.evaluate(()=>({has:typeof TKWALK==='object',D:TKWALK.duration,cues:TKWALK.cues,chapters:TKWALK.chapters,term:termOn(),n:nTok()}));
  check(label+': TKWALK exists',r.has);
  check(label+': duration between 120 and 300 s',r.D>=120&&r.D<=300,r.D.toFixed(1)+' s');
  const ids=r.cues.map(c=>c.id);const want=r.term?'tok_last_term':'tok_last',other=r.term?'tok_last':'tok_last_term';
  const exp=ORDER.map(id=>id==='LAST'?want:id).filter(id=>ids.includes(id)||REQUIRED.has(id==='tok_last_term'||id==='tok_last'?'LAST':id));
  check(label+': the cues in the narration’s order',JSON.stringify(ids)===JSON.stringify(exp),ids.join(' '));
  check(label+': '+(r.term?'the terminal-token line plays':'the plain last-token line plays')+', not the other',ids.includes(want)&&!ids.includes(other));
  let cont=true;r.cues.forEach((c,i)=>{if(i&&Math.abs(c.start-(r.cues[i-1].start+r.cues[i-1].dur))>1e-6)cont=false;if(!(c.dur>=c.narr))cont=false;});
  check(label+': the cues follow one another, each as long as its narration at least',cont&&Math.abs(r.cues[0].start)<1e-9);
  const chs=r.chapters.map(c=>c.id).join(' ');check(label+': seven chapters in order',chs==='book choices targets board session exchange tips',chs);
  return r;}
async function states(page,label,r){
  const cue=id=>r.cues.find(c=>c.id===id);const mid=id=>cue(id).start+cue(id).dur/2,end=id=>cue(id).start+cue(id).dur-.03;
  const P=t=>page.evaluate(t=>window.__wkProbe(t),t);
  let s=await P(mid('intro'));check(label+': the book opens on the Choices page with the other pages under it',s.pages.ch&&s.pages.tg&&s.pages.bd&&s.pages.tk);
  s=await P(mid('ch_show'));const chOn=s.cards.filter(c=>/^ch\d$/.test(c.id));
  check(label+': each choice card sits exactly on its box of the Choices page',chOn.length>=1&&chOn.every(c=>inside(c,s.chBx[+c.id.slice(2)])),chOn.length+' cards');
  s=await P(end('ch_pick'));const picked=s.cards.find(c=>c.fly&&/^ch/.test(c.id));
  check(label+': after the pick the chosen card is off the page, beside the book',!!picked&&!s.chBx.some(b=>inRect(picked,b)));
  s=await P(mid('tg_show'));check(label+': the Choices page has turned to the Targets page',!s.pages.ch&&s.pages.tg);
  const tgOn=s.cards.filter(c=>/^tg\d$/.test(c.id)&&!c.fly);check(label+': each target card sits exactly on its box of the Targets page',tgOn.length>=1&&tgOn.every(c=>inside(c,s.tgBx[+c.id.slice(2)])));
  s=await P(end('bd_place'));const pk=await page.evaluate(()=>{const c=[...document.querySelectorAll('#wkStage .wk-page[data-pg="bd"] .wk-in[data-card]')].map(e=>e.dataset.card);return c;});
  const thenC=s.cards.filter(c=>/^ch/.test(c.id)),firstC=s.cards.filter(c=>/^tg/.test(c.id));
  check(label+': after bd_place the chosen card is in the Then box',thenC.length===1&&inside(thenC[0],s.then,2.5),thenC.map(c=>c.id).join());
  check(label+': and the target card in the First box',firstC.length===1&&inside(firstC[0],s.first,2.5));
  const nextMid=r.cues[r.cues.findIndex(c=>c.id==='bd_place')+1];s=await P(nextMid.start+nextMid.dur/2);
  check(label+': the chosen card stays in the Then box in the next cue',s.cards.some(c=>/^ch/.test(c.id)&&inside(c,s.then,2.5)));
  const nEnd0=id=>cue(id).start+cue(id).narr;
  const inSlots=s2=>s2.cards.filter(c=>/^tok/.test(c.id)&&s2.slots.some(b=>inside(c,b,2.5)));
  s=await P(cue('tk_page')?mid('tk_page'):mid('rule'));check(label+': in the session the Board and the Tokens page are both shown, the tokens on their boxes',s.pages.bd&&s.pages.tk&&s.cards.filter(c=>/^tok/.test(c.id)&&s.ybx.some(b=>inside(c,b,2.5))).length===r.n);
  s=await P(end('tok_first'));check(label+': one token in the first slot after tok_first',inSlots(s).length===1&&inside(inSlots(s)[0],s.slots[0],2.5));
  s=await P(end('tok_more'));check(label+': n-1 tokens in the slots after tok_more',inSlots(s).length===r.n-1,inSlots(s).length+' of '+r.n);
  const LAST=r.term?'tok_last_term':'tok_last';s=await P(end(LAST));const sl=inSlots(s);
  check(label+': all '+r.n+' tokens in the slots at the end of '+LAST,sl.length===r.n&&s.slots.every(b=>sl.some(c=>inside(c,b,2.5))));
  const lastOne=sl.find(c=>inside(c,s.slots[r.n-1],2.5));
  check(label+': '+(r.term?'the last placed token is the terminal token (class last)':'no token is marked last when the option is off'),r.term?!!lastOne&&lastOne.last&&sl.filter(c=>c.last).length===1:sl.every(c=>!c.last));
  /* the exchange: the tokens are traded back to the Tokens page, the item is shown and handed over, then the learner keeps it (off the frame) */
  const ex=cue('exchange');let itemSeen=false;for(let k=1;k<12;k++){const q=await P(ex.start+ex.dur*k/12);if(q.cards.some(c=>c.id==='item'))itemSeen=true;}
  s=await P(end('exchange'));check(label+': in the exchange the item is shown; after it the Then box is empty and the tokens are back on the Tokens page (the trade)',itemSeen&&!s.cards.some(c=>inside(c,s.then,10))&&inSlots(s).length===0&&s.cards.filter(c=>/^tok/.test(c.id)&&s.ybx.some(b=>inside(c,b,2.5))).length===r.n);
  s=await P(nEnd0('exchange'));check(label+': sync: the tokens are off the board before exchange’s line ends',inSlots(s).length===0);
  s=await P(end('reset'));check(label+': after the reset the slots are empty and the tokens are back on the Tokens page',inSlots(s).length===0&&s.cards.filter(c=>/^tok/.test(c.id)&&s.ybx.some(b=>inside(c,b,2.5))).length===r.n);
  check(label+': after the reset the book is back on the Choices page with every card on its box',s.pages.ch&&s.cards.filter(c=>/^ch\d$/.test(c.id)).every(c=>inside(c,s.chBx[+c.id.slice(2)])));
  /* sync: what a line says happens while that line plays (checked at the end of its narration), the lines never overlap, the pauses stay short */
  const nEnd=id=>cue(id).start+cue(id).narr;
  s=await P(nEnd('ch_pick'));check(label+': sync: the chosen card is off the page before ch_pick’s line ends',s.cards.some(c=>c.fly&&/^ch/.test(c.id)&&!s.chBx.some(b=>inRect(c,b))));
  s=await P(nEnd('bd_place'));check(label+': sync: both cards are in their boxes before bd_place’s line ends',s.cards.some(c=>/^tg/.test(c.id)&&inside(c,s.first,2.5))&&s.cards.some(c=>/^ch/.test(c.id)&&inside(c,s.then,2.5)));
  s=await P(nEnd('tok_first'));check(label+': sync: the first token is in its slot before tok_first’s line ends',inSlots(s).length===1);
  s=await P(nEnd(LAST));check(label+': sync: the last token is in its slot before '+LAST+'’s line ends',inSlots(s).length===r.n);
  s=await P(nEnd('reset'));check(label+': sync: the cards are back on their pages before reset’s line ends',s.pages.ch&&s.cards.filter(c=>/^ch\d$/.test(c.id)).every(c=>inside(c,s.chBx[+c.id.slice(2)])));
  const gaps=r.cues.map(c=>c.dur-c.narr);check(label+': no overlapping narration, at least 0.3 s between lines',gaps.every(g=>g>=.3),'shortest '+Math.min(...gaps).toFixed(2)+' s');
  const longGaps=r.cues.filter(c=>c.dur-c.narr>(c.id==='tok_more'?99:2.5)).map(c=>c.id+' '+(c.dur-c.narr).toFixed(1));
  check(label+': no long silence after a line (tok_more on big boards excepted)',!longGaps.length,longGaps.join(', ')||'longest '+Math.max(...r.cues.filter(c=>c.id!=='tok_more').map(c=>c.dur-c.narr)).toFixed(2)+' s');
  /* captions: the narrated text, a piece at a time */
  let capOk=true;for(const c of r.cues){const cp=(await P(c.start+Math.min(.3,c.narr/3))).cap;if(!cp||!c.text.startsWith(cp.slice(0,Math.min(20,cp.length))))capOk=false;}
  check(label+': each cue opens with the start of its narrated text as the caption',capOk);}

(async()=>{const br=await chromium.launch();
  /* ---- the simulator's book: terminal token off ---- */
  {const {page,log}=await open(br,null,sim);
    await page.click('#viewSeg button[data-view="preview"]');await sleep(300);
    const before=await page.evaluate(()=>JSON.stringify(S));const pp0=await pdfPages(page);
    await page.click('#viewSeg button[data-view="walk"]');await sleep(500);
    check('the Walkthrough button opens the view',await page.evaluate(()=>document.body.classList.contains('view-walk')&&getComputedStyle(document.querySelector('section.only-walk')).display!=='none'));
    check('the other views are hidden in the Walkthrough view',await page.evaluate(()=>['setup','choices','targets','board','backs','preview','guide'].every(v=>{const s=document.querySelector('section.only-'+v);return !s||getComputedStyle(s).display==='none';})));
    const r=await timeline(page,'simulator');await states(page,'simulator',r);
    /* determinism */
    const ts=[0,r.D*.13,r.D*.37,r.D*.52,r.D*.61,r.D*.8,r.D-.01];let det=true;
    for(const t of ts){const a=await page.evaluate(t=>__wkTf(t),t);await page.evaluate(t=>__wkTf(t),r.D-t);const b=await page.evaluate(t=>__wkTf(t),t);if(a!==b||!a)det=false;}
    check('renderAt is deterministic: the same t gives the same transforms, whatever was drawn before',det);
    const a1=await page.evaluate(t=>__wkTf(t),r.D*.55);await page.evaluate(()=>TKWALK.build());await page.addScriptTag({content:PROBE});const a2=await page.evaluate(t=>__wkTf(t),r.D*.55);
    check('a rebuild of the same book draws the same frame',a1===a2);
    const after=await page.evaluate(()=>JSON.stringify(S));check('building the walkthrough leaves the book (S) unchanged',before===after,before.length+' chars');
    /* screenshots of the stage at the middle of every cue */
    await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    for(const c of r.cues){await page.evaluate(t=>TKWALK.renderAt(t),c.start+c.dur/2);await sleep(40);await (await page.$('#wkFrame')).screenshot({path:SHOTS+'/cue-'+c.id+'.png'});}
    await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    /* controls */
    const names=await page.evaluate(()=>[...document.querySelectorAll('#wkPlayer button,#wkPlayer input,#wkPlayer [role="slider"]')].map(e=>[e.id||e.dataset.ch||e.className,(e.getAttribute('aria-label')||e.textContent||'').trim()]));
    check('every control of the player has an accessible name',names.length>=14&&names.every(n=>n[1]),names.filter(n=>!n[1]).map(n=>n[0]).join(',')||names.length+' controls');
    const sizes=await page.evaluate(()=>[...document.querySelectorAll('#wkPlayer .wk-bar button,#wkPlayer .wk-chaps button')].map(e=>{const r=e.getBoundingClientRect();return Math.min(r.width,r.height);}));
    check('the buttons are big touch targets (40 px or more)',sizes.every(v=>v>=40),Math.min(...sizes).toFixed(0)+' px smallest');
    /* play, chapters, leaving the view pauses */
    await page.click('#wkSnd');const snd=await page.evaluate(()=>document.getElementById('wkSnd').getAttribute('aria-pressed'));check('Sound toggles off',snd==='false');
    await page.click('#viewSeg button[data-view="walk"]');await sleep(200);
    await page.click('#wkChaps button[data-ch="session"]');await sleep(100);
    const ch=await page.evaluate(()=>({t:TKWALK.time,want:TKWALK.chapters.find(c=>c.id==='session').start,cur:(document.querySelector('#wkChaps button[aria-current="step"]')||{}).dataset}));
    check('a chapter button jumps to its chapter and is shown as current',Math.abs(ch.t-ch.want)<.05&&ch.cur&&ch.cur.ch==='session');
    await page.click('#wkPlay');await sleep(900);const pl=await page.evaluate(()=>({p:TKWALK.playing,t:TKWALK.time,lbl:document.getElementById('wkPlay').getAttribute('aria-label')}));
    check('Play plays (the clock runs, the button says Pause)',pl.p&&pl.t>ch.want+.4&&pl.lbl==='Pause',pl.t.toFixed(2)+' s');
    await page.keyboard.press('Space');await sleep(150);const sp=await page.evaluate(()=>TKWALK.playing);await page.keyboard.press('Space');await sleep(300);const sp2=await page.evaluate(()=>TKWALK.playing);
    check('Space pauses and plays',!sp&&sp2);
    await page.click('#viewSeg button[data-view="setup"]');await sleep(150);const t1=await page.evaluate(()=>({p:TKWALK.playing,t:TKWALK.time}));await sleep(500);const t2=await page.evaluate(()=>TKWALK.time);
    check('leaving the view pauses the walkthrough',!t1.p&&Math.abs(t2-t1.t)<1e-6);
    await page.click('#viewSeg button[data-view="walk"]');await sleep(300);const back=await page.evaluate(()=>({p:TKWALK.playing,t:TKWALK.time}));
    check('coming back keeps the place, paused',!back.p&&Math.abs(back.t-t1.t)<.05);
    await page.click('#wkCc');const cc=await page.evaluate(()=>[document.getElementById('wkCc').getAttribute('aria-pressed'),getComputedStyle(document.querySelector('#wkStage .wk-cap')).display]);
    check('Captions turn off',cc[0]==='false'&&cc[1]==='none');await page.click('#wkCc');
    /* print unchanged */
    const pp1=await pdfPages(page);check('the print page count is unchanged by the walkthrough',pp0===pp1&&pp0>0,pp0+' and '+pp1+' sheets');
    const after2=await page.evaluate(()=>JSON.stringify(S));check('the book (S) is still unchanged after playing and printing',before===after2);
    /* reduced motion: each cue cuts to its end state; the captions keep the real time */
    await page.click('#viewSeg button[data-view="walk"]');await sleep(200);await page.emulateMedia({reducedMotion:'reduce'});
    const rm=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='ch_pick'),d=TKWALK.cues.find(q=>q.id==='tok_first');
      const a=__wkTf(c.start+c.dur*.3),b=__wkTf(c.start+c.dur*.7),e=__wkTf(c.start+c.dur-.02),f=__wkTf(d.start+d.dur*.4),g=__wkTf(d.start+d.dur-.02);return{red:TKWALK.reduced,same:a===b&&b===e&&f===g};});
    check('reduced motion: no tweening, each cue shows its end state throughout',rm.red&&rm.same);
    await page.emulateMedia({reducedMotion:'no-preference'});
    const rm2=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='ch_pick');return __wkTf(c.start+c.dur*.3)!==__wkTf(c.start+c.dur*.7);});check('without reduced motion the cue animates',rm2);
    check('simulator: no console errors',errorsOf(log).length===0,JSON.stringify(errorsOf(log)).slice(0,300));
    await page.close();}
  /* ---- terminal token on (its own picture), and the ring only with ten tokens ---- */
  for(const [mode,n] of [['pic','5'],['ring','10']]){const {page,log}=await open(br,null,sim);
    await page.evaluate(([m,n])=>{S.meta.term=m;S.meta.n=n;ensure();recaps(true);renderAll();},[mode,n]);await sleep(300);
    await page.evaluate(()=>document.querySelectorAll('.nbh-toast,[class*="toast"]').forEach(e=>e.remove()));
    const before=await page.evaluate(()=>JSON.stringify(S));
    await page.click('#viewSeg button[data-view="walk"]');await sleep(500);
    const label='terminal '+mode+', '+n+' tokens';const r=await timeline(page,label);await states(page,label,r);
    if(mode==='pic'){await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});const c=r.cues.find(q=>q.id==='tok_last_term');
      await page.evaluate(t=>TKWALK.renderAt(t),c.start+c.dur/2);await sleep(40);await (await page.$('#wkFrame')).screenshot({path:SHOTS+'/cue-tok_last_term.png'});}
    check(label+': the book (S) is unchanged',before===await page.evaluate(()=>JSON.stringify(S)));
    check(label+': no console errors',errorsOf(log).length===0,JSON.stringify(errorsOf(log)).slice(0,300));await page.close();}
  /* ---- a blank book (sample pictures, noted) and a Rules-row book (noted, drawn First-Then) ---- */
  {const {page,log}=await open(br);await page.click('#viewSeg button[data-view="walk"]');await sleep(500);
    const b=await page.evaluate(()=>({note:document.getElementById('wkNote').textContent,n:document.querySelectorAll('#wkStage .wk-page[data-pg="ch"] .wk-in').length,S:JSON.stringify(S),blank:S.ch.every(o=>!o.k&&!o.ph)}));
    check('blank book: sample pictures on the six boxes, and the note says so',b.n===6&&/sample pictures/.test(b.note)&&b.blank,b.note.slice(0,80));
    await page.evaluate(()=>{S.meta.layout='rules';S.meta.pagesize='11';renderAll();});await page.click('#viewSeg button[data-view="setup"]');await page.click('#viewSeg button[data-view="walk"]');await sleep(400);
    const rr=await page.evaluate(()=>({note:document.getElementById('wkNote').textContent,ft:!!document.querySelector('#wkStage .wk-page[data-pg="bd"] .bx.ft.green'),lay:S.meta.layout,ps:S.meta.pagesize}));
    check('Rules-row book: drawn First-Then for the walkthrough, with a note, the book keeps its Rules row and page size',rr.ft&&/Rules row/.test(rr.note)&&rr.lay==='rules'&&rr.ps==='11');
    check('blank and Rules-row books: no console errors',errorsOf(log).length===0,JSON.stringify(errorsOf(log)).slice(0,300));await page.close();}
  /* ---- the narration through Web Audio: the build's walk-audio.js, or (while it is not built yet) short test tones in its format ---- */
  {const built=fs.existsSync(__dirname+'/../tools/forms/TK-1/walk-audio.js');
    const wav=sec=>{const sr=8000,n=Math.round(sr*sec),b=Buffer.alloc(44+n*2);b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
      b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(800*Math.sin(i/sr*2*Math.PI*440)),44+i*2);return 'data:audio/wav;base64,'+b.toString('base64');};
    const page=await br.newPage({viewport:{width:1180,height:820}});const log=[];wire(page,log);
    if(!built){const ids=['intro','ch_show','ch_pick','tg_show','tg_pick','bd_place','tk_page','rule','start','tok_first','tok_none','tok_more','tok_last','tok_last_term','exchange','reset','tips','outro'];
      const lines={};ids.forEach(id=>{lines[id]={t:'Test line '+id+'.',d:6,a:wav(1.2)};});
      await page.addInitScript(L=>{window.WALK_AUDIO={voice:'test',speed:1,lines:L};},lines);}
    await page.goto(URL);await sleep(500);await page.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(400);
    await page.evaluate(()=>document.querySelectorAll('.nbh-toast,[class*="toast"]').forEach(e=>e.remove()));
    await page.click('#viewSeg button[data-view="walk"]');await sleep(400);
    const lens=await page.evaluate(()=>{const L=WALK_AUDIO.lines;return TKWALK.cues.every(c=>Math.abs(c.narr-L[c.id].d)<1e-9&&c.text===L[c.id].t);});
    check('narration'+(built?'':' (test tones)')+': each cue takes its length and its caption from WALK_AUDIO',lens);
    if(built){const um=await page.evaluate(()=>TKWALK.unmeasured);check('narration: every recorded line has its measured phrase timings (captions and actions follow the voice; a re-voiced line needs measuring again)',um.length===0,um.join(',')||'all lines');
      const cf=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='tok_first');TKWALK.renderAt(c.start+5.6);return document.querySelector('#wkStage .wk-cap').textContent;});
      check('narration: the caption changes with the voice (tok_first, 5.6 s in: "Give a token...")',/^Give a token/.test(cf),cf.slice(0,40));}
    if(built){const real=await page.evaluate(()=>({note:document.getElementById('wkNote').textContent,
        hands:typeof WALK_HANDS==='object'&&['learner','teacher'].every(w=>['point','pinch','open'].every(p=>{const e=document.querySelector('#wkStage .wk-hand.wk-'+w+' .wk-pose:nth-child('+(['point','pinch','open'].indexOf(p)+1)+')');return e&&e.innerHTML.length>1000&&e.innerHTML.replace(/\s/g,'').slice(0,200)===WALK_HANDS[w][p].svg.replace(/\s/g,'').slice(0,200);}))}));
      check('the build’s own files are used: the drawn hands are WALK_HANDS (no placeholders) and no note about missing narration',real.hands&&!/narration is not/.test(real.note),real.note.slice(0,80));}
    await page.click('#wkPlay');await sleep(1500);
    const a=await page.evaluate(()=>({m:TKWALK.audioMode,p:TKWALK.playing,t:TKWALK.time}));
    check('narration: Play starts the Web Audio clock (the audio context is the timeline clock)',a.m==='web'&&a.p&&a.t>.3,a.m+' at '+a.t.toFixed(2)+' s');
    await page.click('#wkPlay');await sleep(100);const p1=await page.evaluate(()=>TKWALK.time);await sleep(500);const p2=await page.evaluate(()=>TKWALK.time);
    check('narration: Pause holds the clock',Math.abs(p2-p1)<1e-6);
    await page.click('#wkPlay');await sleep(600);const p3=await page.evaluate(()=>TKWALK.time);check('narration: Play continues from the same place',p3>p2+.2&&p3<p2+2,p2.toFixed(2)+' -> '+p3.toFixed(2));
    await page.evaluate(()=>TKWALK.seek(60));await sleep(500);const p4=await page.evaluate(()=>({t:TKWALK.time,p:TKWALK.playing}));check('narration: a seek while playing goes on playing from there',p4.p&&p4.t>60.2&&p4.t<61.5,p4.t.toFixed(2));
    await page.evaluate(()=>TKWALK.pause());
    check('narration: no console errors',errorsOf(log).length===0,JSON.stringify(errorsOf(log)).slice(0,300));await page.close();}
  /* ---- the fixes of the review: content, timing and the player's behaviour ---- */
  {const page=await br.newPage({viewport:{width:1180,height:820}});const log=[];wire(page,log);
    await page.addInitScript(()=>{window.__ctxs=[];const C=window.AudioContext;if(C){window.AudioContext=function(o){const c=new C(o);window.__ctxs.push(c);return c;};window.AudioContext.prototype=C.prototype;}
      window.__wl=0;try{if(navigator.wakeLock){const r=navigator.wakeLock.request.bind(navigator.wakeLock);navigator.wakeLock.request=function(t){window.__wl++;return r(t).catch(()=>({release:async()=>{},addEventListener(){}}));};}
        else Object.defineProperty(navigator,'wakeLock',{value:{request(){window.__wl++;return Promise.resolve({release:async()=>{},addEventListener(){}});}}});}catch(e){}});
    await page.goto(URL);await sleep(500);await page.evaluate(()=>{window.confirm=()=>true;nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(400);
    await page.evaluate(()=>document.querySelectorAll('.nbh-toast,[class*="toast"]').forEach(e=>e.remove()));
    await page.click('#viewSeg button[data-view="walk"]');await sleep(400);await page.addScriptTag({content:PROBE});
    /* the content */
    const c1=await page.evaluate(()=>{const ex=TKWALK.cues.find(c=>c.id==='exchange');TKWALK.renderAt(ex.start+ex.dur*.6);
      return{lbl:(document.querySelector('#wkStage .wk-ilbl')||{}).textContent||'',h3:document.querySelectorAll('#wkTx h3').length,h4:document.querySelectorAll('#wkTx h4').length,
        snd:document.getElementById('wkSnd').getAttribute('aria-label'),cc:document.getElementById('wkCc').getAttribute('aria-label'),fields:document.querySelectorAll('#wkPlayer input,#wkPlayer select,#wkPlayer textarea').length};});
    check('the item label names no number of minutes (the time or amount is set before the session)',c1.lbl&&!/\d/.test(c1.lbl),c1.lbl);
    check('the transcript’s chapter headings are h3 (under the section’s h2)',c1.h3===7&&c1.h4===0);
    check('toggle buttons keep one name (Sound; CC first in the CC name), aria-pressed carries the state',c1.snd==='Sound'&&/^CC/.test(c1.cc));
    check('the player has no form fields (the workstation saves form fields: watching must not count as an unsaved change)',c1.fields===0);
    /* the first token comes as the interval ends; the ring keeps its tick until the token is in its slot */
    const tf=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='tok_first');const out=[];for(let t=c.start;t<c.start+c.dur;t+=.1){TKWALK.renderAt(t);
        const sl=[...document.querySelectorAll('#wkStage .wk-page[data-pg="bd"] .wk-in[data-card="tok0"]')].some(e=>e.style.opacity==='1');out.push([t-c.start,(document.querySelector('#wkStage .wk-rt')||{}).textContent,sl]);}return out;});
    const placed=tf.find(x=>x[2]),tickAt=tf.filter(x=>x[1]==='✓');
    check('the first token is in its slot within 4 s of the interval’s end',placed&&placed[0]<4.6,placed&&placed[0].toFixed(1)+' s into the line');
    check('the ring keeps its tick from the interval’s end until the token is placed',tickAt.length&&placed&&tickAt[tickAt.length-1][0]>=placed[0]-.25&&tf.filter(x=>x[0]>.7&&x[0]<placed[0]-.2).every(x=>x[1]==='✓'));
    const tn=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='tok_none');if(!c)return null;const o=[];for(let t=c.start;t<c.start+4;t+=.1){TKWALK.renderAt(t);o.push((document.querySelector('#wkStage .wk-rt')||{}).textContent+'|'+document.querySelector('#wkStage .wk-ring .fg').style.strokeDashoffset);}return o;});
    check('no-token interval: the ring stops part way and shows a dash',!tn||tn.some(x=>/^–\|/.test(x)&&parseFloat(x.split('|')[1])>200));
    /* praise names the behavior, whatever the target's label */
    const pr=await page.evaluate(()=>{S.tg[0].l='Raise hand';S.tg[0].k='';S.tg[0].ph='';for(let i=1;i<6;i++){S.tg[i].l='';S.tg[i].k='';S.tg[i].ph='';}renderAll();
      const b=[...document.querySelectorAll('#wkStage .wk-bub')].map(e=>e.textContent);const chip=(document.querySelector('#wkStage .wk-c1')||{}).textContent||'';return{b,chip};});
    check('praise names a target that is not an -ing word ("Great job: raise hand!"), and rebuilding follows renderAll while the view is open',pr.b.length&&pr.b.every(x=>/raise hand/i.test(x)),pr.b[0]);
    const pr2=await page.evaluate(()=>{S.tg[2].l='Writing';renderAll();return{b:[...document.querySelectorAll('#wkStage .wk-bub')].map(e=>e.textContent)[0],chip:(document.querySelector('#wkStage .wk-c1')||{}).textContent};});
    check('the demo target is an ongoing (-ing) behavior when the book has one',/writing/i.test(pr2.b)&&/writing/i.test(pr2.chip),pr2.b);
    await page.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(400);await page.click('#viewSeg button[data-view="setup"]');await page.click('#viewSeg button[data-view="walk"]');await sleep(300);
    /* the seek bar: keys skip five seconds, End while playing ends (does not start again), it follows playback */
    const k1=await page.evaluate(async()=>{TKWALK.seek(30);const s=document.getElementById('wkSeek');s.focus();s.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));const a=TKWALK.time;
      s.dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true,cancelable:true}));const b=TKWALK.time;return{a,b};});
    check('seek bar keys: arrow +5 s, Page Up +30 s',Math.abs(k1.a-35)<.01&&Math.abs(k1.b-65)<.01,k1.a+' '+k1.b);
    await page.click('#wkPlay');await sleep(1200);const wl=await page.evaluate(()=>window.__wl);check('Play asks to keep the screen on (wake lock)',wl>=1,wl+' requests');
    const f1=await page.evaluate(()=>getComputedStyle(document.querySelector('#wkSeek .wk-sthumb')).left);await sleep(1500);const f2=await page.evaluate(()=>getComputedStyle(document.querySelector('#wkSeek .wk-sthumb')).left);
    check('the seek bar follows playback while it has focus',f1!==f2,f1+' -> '+f2);
    /* the Walkthrough button again, with the book unchanged, does not stop playback */
    await page.click('#viewSeg button[data-view="walk"]');await sleep(200);check('tapping Walkthrough again while playing keeps playing',await page.evaluate(()=>TKWALK.playing));
    /* the system takes the sound: the player pauses and says so */
    const it=await page.evaluate(async()=>{const c=window.__ctxs[window.__ctxs.length-1];await c.suspend();await new Promise(r=>setTimeout(r,1500));return{p:TKWALK.playing,lbl:document.getElementById('wkPlay').getAttribute('aria-label'),m:(document.querySelector('#wkFrame .wk-msg')||{}).textContent||''};});
    check('an interrupted audio context pauses the player and says so',!it.p&&it.lbl==='Play'&&/interrupted/.test(it.m),JSON.stringify(it));
    const e1=await page.evaluate(async()=>{TKWALK.seek(TKWALK.duration-2);TKWALK.play();await new Promise(r=>setTimeout(r,400));const s=document.getElementById('wkSeek');s.focus();s.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,300));return{t:TKWALK.time,p:TKWALK.playing,D:TKWALK.duration};});
    check('End on the seek bar while playing goes to the end (it does not start again)',!e1.p&&e1.t>e1.D-.1,JSON.stringify(e1));
    /* Space on the transcript opens it; Escape in the full-screen panel is handled once */
    const sp=await page.evaluate(()=>{TKWALK.seek(10);const sm=document.querySelector('.wk-tx summary');sm.focus();return true;});await page.keyboard.press('Space');await sleep(150);
    const sp2=await page.evaluate(()=>({open:document.querySelector('.wk-tx').open,p:TKWALK.playing}));check('Space on the transcript opens it and does not play',sp2.open&&!sp2.p);
    const esc=await page.evaluate(()=>{const p=document.getElementById('wkPlayer');p.requestFullscreen=null;p.webkitRequestFullscreen=null;Element.prototype.requestFullscreen=undefined;document.getElementById('wkFs').click();
      const on=p.classList.contains('wk-fs'),inert=!!document.querySelector('.toolbar')&&document.querySelector('.toolbar').closest('[inert]')!==null;
      const dp=!document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));return{on,inert,off:!p.classList.contains('wk-fs'),dp,still:!!document.querySelector('[inert]')};});
    check('full-screen panel: what is behind it is inert, Escape closes it and is marked handled (the workstation does not also leave full screen)',esc.on&&esc.inert&&esc.off&&esc.dp===true&&!esc.still,JSON.stringify(esc));
    check('review fixes: no console errors',errorsOf(log).length===0,JSON.stringify(errorsOf(log)).slice(0,300));await page.close();}
  /* ---- inside a workstation frame: hiding the frame (another form opened) pauses the walkthrough ---- */
  {const page=await br.newPage({viewport:{width:1180,height:820}});const log=[];wire(page,log);await page.goto(BASE+'/qa/');
    await page.evaluate(u=>{document.body.innerHTML='<iframe id="f" src="'+u+'" style="width:1100px;height:800px"></iframe>';},URL);await sleep(1500);
    const fr=page.frames().find(f=>f.url().includes('TK-1'));await fr.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(400);
    await fr.evaluate(()=>setView('walk'));await sleep(300);await fr.click('#wkPlay');await sleep(1000);const a=await fr.evaluate(()=>TKWALK.playing);
    await page.evaluate(()=>{document.getElementById('f').hidden=true;});await sleep(1200);const b=await fr.evaluate(()=>({p:TKWALK.playing,t:TKWALK.time}));
    check('in a frame: hiding the frame pauses the walkthrough',a&&!b.p,JSON.stringify({a,b}));await page.close();}
  /* ---- touch screens: the controls stay big (the shared 40 px rule for touch does not shrink them) ---- */
  for(const vp of [{width:820,height:1180},{width:390,height:844}]){const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:true});const page=await ctx.newPage();await page.goto(URL);await sleep(500);
    await page.evaluate(()=>{nbhUI.confirm=async()=>true;document.querySelector('#simBtn').click();});await sleep(300);await page.evaluate(()=>setView('walk'));await sleep(400);
    const sz=await page.evaluate(()=>[...document.querySelectorAll('#wkPlayer .wk-bar button,#wkPlayer .wk-chaps button,#wkSeek')].map(e=>{const r=e.getBoundingClientRect();return Math.min(r.width,r.height);}));
    check(vp.width+' touch: every control 44 px or more',sz.every(v=>v>=44),Math.min(...sz).toFixed(0)+' px smallest');
    if(vp.width<500){const w=await page.evaluate(()=>{const f=document.getElementById('wkFrame').getBoundingClientRect();return{w:f.width,l:f.left,r:f.right,iw:innerWidth,sw:document.documentElement.scrollWidth};});
      check('phone: the picture uses the width less 16 px gutters, with no sideways scroll',w.w>=w.iw-34&&w.l>=15&&w.r<=w.iw-15&&w.sw<=w.iw,JSON.stringify(w));}
    await ctx.close();}
  /* ---- no sideways scroll on the iPad (both ways) and a phone ---- */
  for(const vp of [{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){const {page,log}=await open(br,vp,sim);
    await page.click('#viewSeg button[data-view="walk"]');await sleep(500);
    const o=await page.evaluate(()=>{const p=document.getElementById('wkPlayer').getBoundingClientRect(),f=document.getElementById('wkFrame').getBoundingClientRect();
      const kids=[...document.querySelectorAll('#wkPlayer .wk-bar>*,#wkPlayer .wk-chaps>*')].map(e=>e.getBoundingClientRect());
      return{sw:document.documentElement.scrollWidth,iw:innerWidth,pr:p.right,fw:f.width,fh:f.height,kids:kids.every(r=>r.right<=p.right+1&&r.left>=p.left-1)};});
    check(vp.width+' x '+vp.height+': no sideways scroll, the player and its controls inside the page',o.sw<=o.iw&&o.pr<=o.iw&&o.kids,o.sw+' / '+o.iw);
    if(vp.width===1180){const rv=await page.evaluate(()=>{const tb=document.querySelector('.toolbar').getBoundingClientRect(),f=document.getElementById('wkFrame').getBoundingClientRect();return{tb:tb.bottom,top:f.top,bot:f.bottom,ih:innerHeight};});
      check('iPad landscape: entering the view brings the whole picture into view below the sticky toolbar',rv.top>=rv.tb-1&&rv.bot<=rv.ih,JSON.stringify(rv));}
    check(vp.width+' x '+vp.height+': the picture is 16:9',Math.abs(o.fw/o.fh-16/9)<.01,o.fw.toFixed(0)+' x '+o.fh.toFixed(0));
    await (await page.$('#wkPlayer')).screenshot({path:SHOTS+'/player-'+vp.width+'.png'});
    check(vp.width+': no console errors',errorsOf(log).length===0);await page.close();}
  await br.close();console.log(fails?'FAILURES: '+fails:'ALL PASS');process.exit(fails?1:0);})();
