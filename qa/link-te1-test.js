/* v21.44 the TK-1 / TE-1 link, TE-1's side, alone (no shell). The TK-1 files are made by hand from the plan's link
   record: a TK-1 saved file whose S.meta.lk holds {v:1,on:1,card,base,board:{n,tok,term,last,card,cardLabel,ch,tg}}.
   Checks:
   1  Off by default: no lk in the record, blank or simulated; the bridge total is the committed TE-1's plus one (the
      hidden #teLink) and the filled count is the same; the printed text and the page count are the same as the
      committed TE-1's; #lkPrint and the link heading do not print; an Unlink leaves no lk behind.
   12 Blank TE-1 plus a TK-1 simulation file: who and the token form pre-ticked, the behavior and the count offered
      unticked, 5 cards offered unticked; the compare changes nothing but lk; Apply fills empty fields and adds the
      backup rows with the note, deletes no row and leaves the audit alone; the hints and Undo. A filled TE-1 (the
      simulation): long behavior is Keep only, a count difference is named, ≈ matches, existing rows are kept;
      Keep, then a recompare reads "kept different". The identity block. The last-token sentence and line. A TK-1
      file with the link off.
   14 #lkPrint prints only while linked ("not compared yet" and "in step").
   Files: packet, this form's own file, an SM-1 file, a case with no TK-1 and junk are refused with S unchanged; a
   CASE json and a .case.html are accepted. Plus a save/open round trip of lk, junk lk read as off, phone width,
   console errors, and screenshots of the panel (off, on, after a compare with differences) at 1280 and 390 px.
   usage: node qa/link-te1-test.js */
const {chromium,fs,BASE,wire,sleep}=require('/home/user/workstation/qa/lib.js');
const {execSync}=require('child_process');
const FILE='TE-1_Token-Economy-Designer_v2026-09.html',URL1=BASE+'/NBH-Workstation/'+FILE,URL0=BASE+'/NBH-Workstation/__te1_committed.html';
const SHOTS=process.env.LINK_SHOTS||__dirname+'/out/link-te1';
/* the baseline is the TE-1 from before the link: the parent of the first commit that holds the link core (HEAD itself
   holds the link now, so comparing with HEAD would compare the file with itself) */
const G=c=>execSync('git -C /home/user/workstation '+c,{maxBuffer:64<<20}).toString('utf8');
const FIRST=G("log --format=%H -S 'nbh-link (v21.44)' -- NBH-Workstation/"+FILE).trim().split('\n').filter(Boolean).pop();
const PRE=FIRST?G('rev-parse '+FIRST+'^').trim():'HEAD';
const HEAD=G('show '+PRE+':NBH-Workstation/'+FILE);
if(/nbh-link \(v21\.44\)/.test(HEAD))throw new Error('the baseline TE-1 ('+PRE+') already holds the link');

/* a TK-1 saved file, by hand. The simulated book: six choices (one left without a label here, so five are named),
   six targets, five stars, the first target card paired */
const BOARD=o=>Object.assign({n:'5',tok:'Star',term:'none',last:'Medal',card:0,cardLabel:'Sitting',
  ch:['Tablet','Puzzle','Ball','Bubbles','Lego',''],tg:['Sitting','Raise hand','Writing','Waiting','All done','Reading']},o||{});
const TK=(board,meta,on)=>JSON.stringify({form:'TK-1',rev:'2026-10',saved:'2026-10-03T13:58:00.000Z',S:{meta:Object.assign({client:'SIMULATED \u2013 Sample Student',sid:'SIM-000',n:'5',
  lk:board===null?'':JSON.stringify({v:1,on:on===0?0:1,card:0,base:{},board})},meta||{}),ch:[],tg:[],tok:[{k:'tk:star',ph:'',l:''}]}},null,1);

let fails=0;const out=[];
function ok(name,cond,extra){out.push((cond?'ok   ':'FAIL ')+name+(cond||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,500)));if(!cond)fails++;}

async function open(ctx,url,log){const p=await ctx.newPage();wire(p,log);await p.goto(url||URL1);await sleep(400);
  await p.evaluate(()=>{window.confirm=()=>true;});return p;}
const status=p=>p.evaluate(()=>new Promise(r=>{const h=e=>{if(e.data&&e.data.nbh==='status'&&e.data.status){removeEventListener('message',h);r(e.data.status);}};addEventListener('message',h);postMessage({nbh:'status'},'*');}));
const sim=p=>p.evaluate(async()=>{await loadSim();});
const sOf=p=>p.evaluate(()=>JSON.stringify(S));
const noLk=j=>{const o=JSON.parse(j);delete o.meta.lk;return JSON.stringify(o);};
/* a file into the panel's own file input, as a person picking it would */
async function feed(p,text,name){await p.evaluate(([t,n])=>{const fi=document.querySelector('#lkPanel .lk-fileIn'),dt=new DataTransfer();
  dt.items.add(new File([t],n,{type:/html$/.test(n)?'text/html':'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},[text,name]);await sleep(250);}
const rows=p=>p.evaluate(()=>{const o={};nbhLink.rows().forEach(r=>{o[r.key]=r;});return o;});
const st=p=>p.evaluate(()=>nbhLink.state());
const link=p=>p.evaluate(()=>{document.querySelector('#lkPanel [data-lk="on"]').click();});
const printVis=p=>p.evaluate(()=>{const v=e=>!!e&&getComputedStyle(e).display!=='none'&&!!e.getClientRects().length;
  return {print:v(document.querySelector('#lkPrint')),printText:document.querySelector('#lkPrint').textContent,head:v(document.querySelector('h3.lk-head')),guide:v(document.querySelector('.only-guide p.lk-onlyprint')),panel:v(document.querySelector('#lkPanel'))};});
/* the sticky toolbar is let go for the picture, so it does not sit over the panel */
async function shot(p,name){await p.evaluate(()=>{setView('setup');if(!document.getElementById('shotCss')){const st=document.createElement('style');st.id='shotCss';st.textContent='.toolbar{position:static!important}';document.head.appendChild(st);}document.querySelectorAll('.nbh-toast').forEach(e=>e.remove());document.querySelector('h3.lk-head').scrollIntoView();});await sleep(150);
  const box=await p.evaluate(()=>{const a=document.querySelector('h3.lk-head').getBoundingClientRect(),b=document.querySelector('#lkPanel').getBoundingClientRect();
    return {x:0,y:Math.max(0,a.top+scrollY-8),width:document.documentElement.clientWidth,height:Math.ceil(b.bottom-a.top+16)};});
  await p.screenshot({path:SHOTS+'/'+name,clip:box,fullPage:true});await p.evaluate(()=>{const e=document.getElementById('shotCss');if(e)e.remove();});}

(async()=>{
  fs.mkdirSync(SHOTS,{recursive:true});
  const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});
  await ctx.route(URL0,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:HEAD}));
  const log=[];

  /* ---- 1. off by default, against the committed TE-1 ---- */
  {const A=await open(ctx,URL0,log),B=await open(ctx,URL1,log);
    const a0=await status(A),b0=await status(B);
    ok('1 blank: the bridge total is the committed one plus one (#teLink)',b0.total===a0.total+1,{was:a0,now:b0});
    ok('1 blank: the filled count is unchanged',b0.filled===a0.filled,{was:a0,now:b0});
    ok('1 blank: no lk in the record',await B.evaluate(()=>!('lk' in S.meta)));
    await sim(A);await sim(B);
    const a1=await status(A),b1=await status(B);
    ok('1 simulation: total +1, filled unchanged',b1.total===a1.total+1&&b1.filled===a1.filled,{was:a1,now:b1});
    ok('1 simulation: no lk in the record',await B.evaluate(()=>!('lk' in S.meta)));
    ok('1 simulation: the record is the committed one',(await sOf(A))===(await sOf(B)));
    for(const [nm,fn] of [['simulation',async()=>{}],['blank',async p=>{await p.evaluate(()=>{S=blank();renderAll();});}]]){
      await fn(A);await fn(B);
      await A.emulateMedia({media:'print'});await B.emulateMedia({media:'print'});
      const ta=await A.evaluate(()=>document.querySelector('main.sheet').innerText),tb=await B.evaluate(()=>document.querySelector('main.sheet').innerText);
      ok('1 '+nm+': the printed text is the committed one',ta===tb,{a:ta.length,b:tb.length,firstDiff:[...ta].findIndex((c,i)=>c!==tb[i])});
      const pv=await printVis(B);ok('1 '+nm+': neither #lkPrint, the link heading nor the Guide paragraph prints',!pv.print&&!pv.head&&!pv.guide&&!pv.panel,pv);
      await A.emulateMedia({media:'screen'});await B.emulateMedia({media:'screen'});
      const pa=(await A.pdf({format:'Letter'})).toString('latin1').match(/\/Type\s*\/Page[^s]/g).length,pb=(await B.pdf({format:'Letter'})).toString('latin1').match(/\/Type\s*\/Page[^s]/g).length;
      ok('1 '+nm+': the same number of printed pages ('+pb+')',pa===pb,{was:pa,now:pb});}
    /* the Guide paragraph and the heading print once linked; an Unlink leaves no lk */
    const bb=await status(B);await link(B);await sleep(100);
    ok('1 link on: lk in the record and in #teLink',await B.evaluate(()=>NBHLink.isOn(S.meta.lk)&&document.querySelector('#teLink').value===S.meta.lk));
    const b2=await status(B);ok('1 link on: the bridge counts #teLink as filled',b2.filled===bb.filled+1&&b2.total===bb.total,{bb,b2});
    await B.evaluate(()=>nbhLink.unlink());await sleep(100);
    ok('1 Unlink: no lk left in the record, #teLink empty, the panel is off',await B.evaluate(()=>!('lk' in S.meta)&&document.querySelector('#teLink').value===''&&!nbhLink.state().on));
    await A.close();await B.close();}

  /* ---- 12. blank TE-1 plus TK-1's simulation file ---- */
  {const p=await open(ctx,URL1,log);
    await shot(p,'te1-off-1280.png');
    ok('12 off text names the book’s choice cards',await p.evaluate(()=>/token count, token and choice cards, and you choose what to take\./.test(document.querySelector('#lkPanel .lk-offtxt').textContent)));
    /* an audit item ticked and unticked leaves S.aud[0] false, which Undo must keep */
    await p.evaluate(()=>{const c=()=>document.querySelector('#auditWrap input[data-a="0"]');c().click();c().click();});
    ok('12 setup: the audit item ticked and unticked leaves S.aud[0] false',await p.evaluate(()=>S.aud[0]===false||S.aud['0']===false));
    await link(p);await sleep(100);await shot(p,'te1-on-1280.png');
    const before=await sOf(p);
    await feed(p,TK(BOARD()),'TK-1_SIMULATED_2026-10-03.json');
    const s=await st(p),R=await rows(p),after=await sOf(p);
    await shot(p,'te1-blank-compare-1280.png');
    ok('12 compare: the table is shown, from the file',s.table&&s.lk.last.via==='file'&&s.lk.last.file==='TK-1_SIMULATED_2026-10-03.json',s);
    ok('12 compare: S is unchanged apart from lk',noLk(before)===noLk(after));
    ok('12 compare: the board is kept in the record',s.lk.board&&s.lk.board.n==='5'&&s.lk.board.ch[0]==='Tablet'&&s.lk.board.cardLabel==='Sitting',s.lk.board);
    ok('12 rows: who, beh, n, tok, menu',Object.keys(R).join()==='who,beh,n,tok,menu',Object.keys(R));
    ok('12 who: empty here, pre-ticked',R.who.st===3&&R.who.pressed==='take',R.who);
    ok('12 token form: empty here, pre-ticked',R.tok.st===3&&R.tok.pressed==='take'&&R.tok.take,R.tok);
    ok('12 behavior: offered, unticked',R.beh.st===3&&R.beh.take&&R.beh.pressed==='',R.beh);
    ok('12 tokens per exchange: offered, unticked',R.n.st===3&&R.n.take&&R.n.pressed==='',R.n);
    ok('12 backup menu: 5 cards offered, unticked',R.menu.st===3&&R.menu.take&&R.menu.pressed===''&&R.menu.there.split('; ').length===5,R.menu);
    const pv=await p.evaluate(()=>document.querySelector('#lkPanel tr.lk-note[data-for="menu"]').textContent);
    ok('12 backup menu: the preview names the five',/Adds 5 backup rows .*Tablet, Puzzle, Ball, Bubbles, Lego\./.test(pv),pv);
    ok('12 behavior: the note to restate it as a response',await p.evaluate(()=>/restate it as a response/.test(document.querySelector('#lkPanel tr.lk-note[data-for="beh"]').textContent)));
    ok('12 status: 5 items to look at',/5 items to look at below\./.test(s.status[0]),s.status);
    await p.evaluate(()=>{['beh','n','menu'].forEach(k=>nbhLink.press(k,'take'));});
    await p.evaluate(()=>nbhLink.apply());await sleep(150);
    const S1=JSON.parse(await sOf(p)),s1=await st(p),R1=await rows(p);
    ok('12 apply: client and sid filled',S1.meta.client==='SIMULATED \u2013 Sample Student'&&S1.meta.sid==='SIM-000',S1.meta);
    ok('12 apply: behavior and count taken',S1.meta.beh==='Sitting'&&S1.meta.epN==='5',S1.meta);
    ok('12 apply: the token form written',S1.meta.tokForm==='Stars on the token board book (Form TK-1), 5 to earn.',S1.meta.tokForm);
    const note='Choice card in the token board book (Form TK-1)';
    ok('12 apply: five backup rows with the note, the fifth appended, no row deleted',S1.bk.length===5&&S1.bk.map(r=>r.n).join()==='Tablet,Puzzle,Ball,Bubbles,Lego'&&S1.bk.every(r=>r.note===note&&!r.c&&!r.cost&&!r.pref&&!r.conf),S1.bk);
    ok('12 apply: the audit and the thinning record untouched',JSON.stringify(S1.aud)===JSON.stringify(JSON.parse(before).aud)&&JSON.stringify(S1.thin)===JSON.stringify(JSON.parse(before).thin));
    ok('12 apply: the other fields untouched',['bcba','date','setting','who','tokWhy','tokEstab','tokEvid','tokPlan','tp','tpN','ep','te','teN','exWhen','exDelay','loss','lossRule','refresh','econ','rights','audAction','review'].every(k=>!S1.meta[k]));
    ok('12 apply: the screen shows it',await p.evaluate(()=>document.querySelector('[data-m="beh"]').value==='Sitting'&&document.querySelectorAll('#bkTbl tbody tr').length===5&&document.querySelector('[data-m="epN"]').value==='5'));
    ok('12 apply: the toast',s1.toast==='5 items taken from Form TK-1. Nothing else changed.',s1.toast);
    ok('12 apply: everything in step afterwards',Object.values(R1).every(r=>r.st===1)&&s1.lk.last.res==='step',R1);
    ok('12 apply: the took line (160 characters at most)',/^Taken .+: the student’s name and ID; the behavior from the book’s target card 1; tokens per exchange 5; the token form/.test(s1.lk.took||'')&&s1.lk.took.length<=160,s1.lk.took);
    const hints=await p.evaluate(()=>({n:document.querySelector('#lkHintN').hidden?'':document.querySelector('#lkHintN').textContent,bk:document.querySelector('#lkHintBk').hidden?'':document.querySelector('#lkHintBk').textContent}));
    ok('12 hints: the count and the cards',/^Form TK-1’s board prints 5 slots \(compared .+\)\.$/.test(hints.n)&&/^Choice cards in the book \(compared .+\): Tablet, Puzzle, Ball, Bubbles, Lego; all are on this menu\.$/.test(hints.bk),hints);
    /* 13. Undo */
    ok('13 Undo is offered',s1.undo);
    await p.evaluate(()=>nbhLink.undo());await sleep(100);
    const S2=await sOf(p);
    ok('13 Undo restores S exactly',S2===after,{a:after.length,b:S2.length});
    ok('13 Undo: the screen too',await p.evaluate(()=>document.querySelector('[data-m="beh"]').value===''&&document.querySelectorAll('#bkTbl tbody tr').length===4&&!nbhLink.state().undo));
    ok('13 Undo keeps an unticked audit item exactly (S.aud[0] false)',JSON.parse(S2).aud['0']===false,JSON.parse(S2).aud);
    await p.evaluate(()=>{const i=document.querySelector('[data-m="epN"]');i.value='7';i.dispatchEvent(new Event('input',{bubbles:true}));});
    ok('12 hints follow a typed count',await p.evaluate(()=>/This plan opens the exchange after 7\./.test(document.querySelector('#lkHintN').textContent)));
    await p.evaluate(()=>{const i=document.querySelector('[data-m="epN"]');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));});
    /* 14. print */
    await p.emulateMedia({media:'print'});
    const pr=await printVis(p);
    ok('14 linked: #lkPrint prints, with the heading, not the panel',pr.print&&pr.head&&!pr.panel&&pr.guide,pr);
    ok('14 linked: the print line states what the book holds',/^Compared with this plan on .+ 2026: 5 slots of stars; choice cards Tablet, Puzzle, Ball, Bubbles, Lego\.$/.test(pr.printText),pr.printText);
    await p.emulateMedia({media:'screen'});
    await p.close();}

  /* ---- the simulated TE-1 against a book with differences ---- */
  {const p=await open(ctx,URL1,log);await sim(p);await link(p);await sleep(100);
    const before=await sOf(p);
    await feed(p,TK(BOARD({n:'7'})),'TK-1_SIMULATED_2026-10-03.json');
    const R=await rows(p),s=await st(p);
    ok('12b who in step (both simulations)',R.who.st===1,R.who);
    ok('12b behavior: both set and different, Keep only',R.beh.st===7&&!R.beh.take&&R.beh.keep,R.beh);
    ok('12b count: Keep only, the difference named',R.n.st===7&&!R.n.take&&R.n.keep&&await p.evaluate(()=>/The book prints 7 slots; this plan opens the exchange after 5\. Change the book on Form TK-1 \(Compare there\)\./.test(document.querySelector('#lkPanel tr.lk-note[data-for="n"]').textContent)),R.n);
    ok('12b token form: "Laminated stars" is the same as Star',R.tok.st===1,R.tok);
    const mn=await p.evaluate(()=>document.querySelector('#lkPanel tr.lk-note[data-for="menu"]').textContent);
    ok('12b menu: four cards offered unticked, the near match shown with ≈',R.menu.st===7&&R.menu.take&&R.menu.pressed===''&&/Card “Tablet” ≈ backup “Tablet, video clips”\./.test(mn)&&/Adds 4 backup rows .*Puzzle, Ball, Bubbles, Lego\./.test(mn),{R:R.menu,mn});
    ok('12b menu: the backups that are not cards are named',/On this menu but not on a choice card: Fruit chew, Five minutes with the magnetic tiles, Choose the next work task\./.test(mn),mn);
    ok('12b nothing is pre-ticked',Object.values(R).every(r=>r.pressed===''),R);
    ok('12b compare changed nothing but lk',noLk(before)===noLk(await sOf(p)));
    await shot(p,'te1-compare-1280.png');
    await p.setViewportSize({width:390,height:844});await sleep(200);
    ok('20 phone: no sideways page scroll with the table open',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]));
    await shot(p,'te1-compare-390.png');
    await p.setViewportSize({width:1280,height:900});await sleep(100);
    await p.evaluate(()=>{nbhLink.press('menu','take');nbhLink.press('beh','keep');nbhLink.press('n','keep');});
    await p.evaluate(()=>nbhLink.apply());await sleep(150);
    const S1=JSON.parse(await sOf(p)),B0=JSON.parse(before);
    ok('12b apply: the four existing backups kept as they were, four appended with the note',S1.bk.length===8&&JSON.stringify(S1.bk.slice(0,4))===JSON.stringify(B0.bk.slice(0,4))&&S1.bk.slice(4).every(r=>r.note==='Choice card in the token board book (Form TK-1)'),S1.bk.map(r=>r.n));
    ok('12b apply: the behavior, the count, the token form and the audit unchanged',S1.meta.beh===B0.meta.beh&&S1.meta.epN==='5'&&S1.meta.tokForm===B0.meta.tokForm&&JSON.stringify(S1.aud)===JSON.stringify(B0.aud));
    ok('12b toast',(await st(p)).toast==='1 item taken from Form TK-1. Nothing else changed.',(await st(p)).toast);
    await feed(p,TK(BOARD({n:'7'})),'TK-1_SIMULATED_2026-10-03.json');
    const R2=await rows(p),s2=await st(p);
    ok('12b recompare: the kept rows read "kept different"',R2.beh.st===4&&/^kept different/.test(R2.beh.label)&&R2.n.st===4&&R2.menu.st===1,R2);
    ok('12b recompare: the status says 2 differences kept',/2 differences kept/.test(s2.status[0]),s2.status);
    const pf=await p.evaluate(()=>{const s=JSON.stringify(S);return fromFile(JSON.parse(s)).meta.lk===S.meta.lk;});
    ok('10 Save then Open keeps meta.lk (fromFile)',pf);
    /* a changed book: the kept behavior on TK-1 changes, so the row reads "changed on Form TK-1" (TE-1 owns it: unticked, Keep only) */
    await feed(p,TK(BOARD({n:'7',cardLabel:'Puts the block in'})),'TK-1_x.json');
    const R3=await rows(p);ok('12b a card changed on TK-1: "changed on Form TK-1", nothing pre-ticked',R3.beh.st===5&&R3.beh.pressed==='',R3.beh);
    await p.close();}

  /* ---- identity, the last token, link off ---- */
  {const p=await open(ctx,URL1,log);
    await p.evaluate(()=>{S.meta.client='Jordan B.';S.meta.sid='1234';renderAll();});await link(p);await sleep(50);
    const before=await sOf(p);
    await feed(p,TK(BOARD({term:'pic',last:'Gold medal'}),{client:'Sam K.',sid:'1234'}),'TK-1_Sam.json');
    let s=await st(p),R=await rows(p);
    ok('7 identity: blocked, Apply disabled',R.who.st===0&&s.blocked&&!s.apply&&await p.evaluate(()=>document.querySelector('#lkPanel [data-lk="apply"]').disabled),{R:R.who,s});
    ok('7 identity: the status names both',/for another student\? Form TK-1 names Sam K\.; this plan names Jordan B\./.test(s.status[0]),s.status);
    const ib=await p.evaluate(()=>({board:!!NBHLink.readLk(S.meta.lk).board,cards:/Kite|Tablet/.test(JSON.stringify(S)),hn:document.querySelector('#lkHintN').hidden,hb:document.querySelector('#lkHintBk').hidden}));
    ok('7 identity: the other student\'s board is not kept, and no hint shows it',!ib.board&&!ib.cards&&ib.hn&&ib.hb,ib);
    await p.evaluate(()=>nbhLink.apply());await sleep(50);
    ok('7 identity: nothing written before the press',noLk(await sOf(p))===noLk(before));
    await p.evaluate(()=>document.querySelector('#lkPanel button[data-act="keep"][data-key="who"]').click());
    s=await st(p);ok('7 identity: "These are the same student" enables Apply',!s.blocked&&s.apply,s);
    await p.evaluate(()=>{['tok','menu','who'].forEach(k=>{if(nbhLink.rows().find(r=>r.key===k&&r.pressed==='take'))nbhLink.press(k,'take');});});
    await p.evaluate(()=>nbhLink.apply());await sleep(50);
    ok('7 identity: once confirmed, the board is kept',await p.evaluate(()=>{const b=NBHLink.readLk(S.meta.lk).board;return !!b&&b.ch[0]==='Tablet'&&!document.querySelector('#lkHintBk').hidden;}));
    await feed(p,TK(BOARD({term:'pic',last:'Gold medal'}),{client:'Sam K.',sid:'1234'}),'TK-1_Sam.json');
    const tt=await p.evaluate(()=>document.querySelector('#lkPanel tr.lk-note[data-for="tok"]').textContent);
    ok('12 last token pictured: the sentence',tt==='Writes: Stars on the token board book (Form TK-1), 5 to earn; the last one is a gold medal with an orange double border, so the student can see it opens the exchange.',tt);
    ok('12 last token pictured: the information line',await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-info')].some(t=>t.textContent==='The book marks the last token: an orange double border (gold medal).')));
    await feed(p,TK(BOARD({term:'ring',n:'6'}),{client:'Jordan B.',sid:'1234'}),'TK-1_Jordan.json');
    const tr=await p.evaluate(()=>({t:document.querySelector('#lkPanel tr.lk-note[data-for="tok"]').textContent,i:[...document.querySelectorAll('#lkPanel tr.lk-info')].map(t=>t.textContent)}));
    ok('12 last token ringed: the sentence and lines',tr.t==='Writes: Stars on the token board book (Form TK-1), 6 to earn; the last one has an orange double border, so the student can see it opens the exchange.'&&tr.i.includes('The book marks the last token: an orange double border.'),tr);
    await p.evaluate(()=>{S.meta.epN='4';renderAll();});await feed(p,TK(BOARD({term:'ring',n:'6'}),{client:'Jordan B.',sid:'1234'}),'TK-1_Jordan.json');
    ok('12 the count check beside a marked last token',await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-info')].some(t=>t.textContent==='The book marks its 6th token as the last, but this plan opens the exchange after 4.')));
    const b2=await sOf(p);
    await feed(p,TK(null),'TK-1_off.json');s=await st(p);
    ok('12 a TK-1 file with the link off: the message, no table, S unchanged',s.msg==="Form TK-1’s link is off, so its file does not name its cards. Turn on Link with Form TE-1 on TK-1’s Setup page, then compare again."&&!s.table&&(await sOf(p))===b2,s);
    await feed(p,TK(BOARD(),{},0),'TK-1_off2.json');s=await st(p);
    ok('12 a TK-1 record with on:0 reads as off too',/link is off/.test(s.msg)&&(await sOf(p))===b2,s.msg);

    /* ---- files ---- */
    const T=[['packet',JSON.stringify({form:'PACKET',rev:'2026-09',packet:{client:'x'}}),'PACKET_x.json','That file is a student packet, not a file Form TK-1 saved. Nothing was changed.'],
      ['own file',JSON.stringify({form:'TE-1',rev:'2026-09',saved:'x',S:{meta:{client:'x'}}}),'TE-1_x.json',"That is a file this form saved, not Form TK-1’s. Nothing was changed."],
      ['SM-1 file',JSON.stringify({form:'SM-1',rev:'2026-09',S:{meta:{}}}),'SM-1_x.json','That file was saved by Form SM-1, not by Form TK-1. Nothing was changed.'],
      ['case with no TK-1',JSON.stringify({form:'CASE',rev:'2026-09',forms:{'TE-1':{snap:{own:'{}'}}}}),'CASE_x.json','That case file holds no Form TK-1. Nothing was changed.'],
      ['junk','not a file at all \u0000','x.json','That file could not be read as a file Form TK-1 saved. Nothing was changed.'],
      ['a cut JSON',TK(BOARD()).slice(0,300),'TK-1_cut.json','That file could not be read as a file Form TK-1 saved. Nothing was changed.']];
    for(const [nm,t,f,m] of T){await feed(p,t,f);s=await st(p);ok('files: '+nm+' refused, S unchanged',s.msg===m&&!s.table&&(await sOf(p))===b2,s.msg);}
    const own=TK(BOARD(),{client:'Jordan B.',sid:'1234'});
    const kase={form:'CASE',rev:'2026-09',saved:'2026-10-02T10:00:00Z',packet:{},forms:{'TK-1':{title:'Form TK-1',snap:{total:9,data:{},own}}}};
    await feed(p,JSON.stringify(kase),'CASE_Jordan_2026-10-02.json');s=await st(p);
    ok('files: a CASE json is accepted',s.table&&!s.msg&&s.lk.last.file==='CASE_Jordan_2026-10-02.json',s);
    await p.evaluate(()=>nbhLink.leave());
    const html='<!doctype html><html><body><script type="application/json" id="nbh-case">'+JSON.stringify(Object.assign({id:'abc'},kase)).replace(/</g,'\\u003c')+'</'+'script></body></html>';
    await feed(p,html,'Jordan.case.html');s=await st(p);
    ok('files: a .case.html is accepted',s.table&&!s.msg&&s.lk.last.file==='Jordan.case.html',s);
    ok('files: Leave closes the table and writes nothing',await p.evaluate(()=>{const a=JSON.stringify(S);nbhLink.leave();return JSON.stringify(S)===a&&!nbhLink.state().table;}));
    /* junk records read as off, with no error */
    const junk=await p.evaluate(()=>['not json','{"v":2,"on":1}','x'.repeat(5000),'{"v":1,"on":"1"}','[1]'].map(j=>{S.meta.lk=j;renderAll();return nbhLink.state().on||document.querySelector('#lkPanel .lk-off').hidden;}));
    ok('10 junk lk reads as off',junk.every(x=>x===false),junk);
    await p.evaluate(()=>{delete S.meta.lk;renderAll();});
    await p.close();}

  /* ---- 14. print: not compared yet; phone width off/on ---- */
  {const p=await open(ctx,URL1,log);await link(p);await sleep(50);
    await p.emulateMedia({media:'print'});const pr=await printVis(p);
    ok('14 linked, not compared: the print line',pr.print&&pr.printText==='Linked with this plan; not compared yet.',pr);
    await p.evaluate(()=>nbhLink.unlink());await sleep(50);const pr2=await printVis(p);
    ok('14 unlinked again: nothing of the link prints',!pr2.print&&!pr2.head&&!pr2.guide,pr2);
    await p.emulateMedia({media:'screen'});
    await p.setViewportSize({width:390,height:844});await sleep(200);
    ok('20 phone, off: no sideways page scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await shot(p,'te1-off-390.png');
    await link(p);await sleep(100);
    ok('20 phone, on: no sideways page scroll',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await shot(p,'te1-on-390.png');
    ok('alone: Compare and Open beside hidden, the file button and the sibling link shown',await p.evaluate(()=>{const q=s=>document.querySelector('#lkPanel '+s);
      return q('[data-lk="compare"]').hidden&&q('[data-lk="beside"]').hidden&&!q('[data-lk="file"]').hidden&&!q('.lk-sib').hidden&&q('.lk-sib').getAttribute('href')==='TK-1_Token-Board-Book_v2026-10.html';}));
    await p.close();}

  /* ---- the review findings (fixes after the first review) ---- */
  const type=(p,sel,v)=>p.evaluate(([sel,v])=>{const i=document.querySelector(sel);i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));},[sel,v]);
  const openData=(p,text)=>p.evaluate(t=>{const fi=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],'TE-1_Other.json',{type:'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},text);
  const noteOf=(p,k)=>p.evaluate(k=>{const t=document.querySelector('#lkPanel tr.lk-note[data-for="'+k+'"]');return t?t.textContent:'';},k);
  const infos=p=>p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-info')].map(t=>t.textContent));
  {const p=await open(ctx,URL1,log);
    /* the unsaved-work guard: opening the book's file is not a save, and a take is an edit */
    await type(p,'[data-m="bcba"]','A. Clinician');
    const d0=await p.evaluate(()=>nbhGuard.isDirty());
    await link(p);await sleep(50);await feed(p,TK(BOARD()),'TK-1_SIMULATED_2026-10-03.json');await sleep(1100);
    ok('R guard: unsaved typing stays unsaved after the book\'s file is opened in the panel',d0&&await p.evaluate(()=>nbhGuard.isDirty()));
    await p.evaluate(()=>nbhGuard.clean());await p.evaluate(()=>nbhLink.apply());await sleep(100);
    ok('R guard: a take marks the form unsaved',await p.evaluate(()=>nbhGuard.isDirty()));
    /* Undo goes as soon as anything else changes; it never puts one student's record over another */
    ok('R Undo: offered after the take',(await st(p)).undo);
    await type(p,'[data-m="setting"]','Room 12, typed after the take');await sleep(50);
    const u1=await p.evaluate(()=>({undo:nbhLink.state().undo,shown:!document.querySelector('#lkPanel .lk-undo').hidden,r:nbhLink.undo(),setting:S.meta.setting}));
    ok('R Undo: withdrawn by an edit, and the edit stays',!u1.undo&&!u1.shown&&u1.r===false&&u1.setting==='Room 12, typed after the take',u1);
    await p.evaluate(()=>{S=blank();renderAll();});await link(p);await sleep(50);
    await feed(p,TK(BOARD()),'TK-1_SIMULATED_2026-10-03.json');await p.evaluate(()=>nbhLink.apply());await sleep(100);
    const other=JSON.stringify({form:'TE-1',rev:'2026-09',saved:'2026-10-03T12:00:00Z',S:{meta:{client:'Jordan B.',beh:'Raises hand',lk:JSON.stringify({v:1,on:1,base:{}})},bk:[{n:'Stickers',c:'',cost:'',pref:'',conf:'',note:''}],thin:[],aud:{}}});
    await openData(p,other);await sleep(300);
    const u2=await p.evaluate(()=>({undo:nbhLink.state().undo,shown:!document.querySelector('#lkPanel .lk-undo').hidden,r:nbhLink.undo(),client:S.meta.client,bk:S.bk.map(r=>r.n).filter(Boolean)}));
    ok('R Undo: withdrawn when Open data brings another record; that record stays',!u2.undo&&!u2.shown&&u2.r===false&&u2.client==='Jordan B.'&&u2.bk.join()==='Stickers',u2);
    await p.close();}
  {const p=await open(ctx,URL1,log);
    /* typed after the compare: the token form and a backup are not written over or doubled */
    await link(p);await sleep(50);await feed(p,TK(BOARD()),'TK-1_SIMULATED_2026-10-03.json');
    await type(p,'[data-m="tokForm"]','Laminated coins in a cup, my own words');
    await type(p,'#bkTbl input[data-k="0"][data-f="n"]','Puzzle');
    await p.evaluate(()=>nbhLink.press('menu','take'));
    await p.evaluate(()=>nbhLink.apply());await sleep(100);
    const sv=await p.evaluate(()=>({tok:S.meta.tokForm,bk:S.bk.map(r=>r.n).filter(Boolean),toast:nbhLink.state().toast,client:S.meta.client,tokRow:nbhLink.rows().find(r=>r.key==='tok')}));
    ok('R stale table: the typed token form is kept, the typed backup is not doubled, both are named',sv.tok==='Laminated coins in a cup, my own words'&&sv.bk.join()==='Puzzle'&&sv.client==='SIMULATED \u2013 Sample Student'&&
      /Not taken, because this plan changed after the compare: Token form and Backup menu\./.test(sv.toast)&&sv.tokRow.here==='Laminated coins in a cup, my own words',sv);
    /* the menu: each card can be left out; a card inside a backup's name is ≈, not missing */
    await feed(p,TK(BOARD()),'TK-1_SIMULATED_2026-10-03.json');
    const pk0=await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr[data-key="menu"] button[data-act="choose"]')].map(b=>b.textContent+'='+b.getAttribute('aria-pressed')));
    ok('R menu: one button per card to add, all picked',pk0.join()==='Tablet=true,Ball=true,Bubbles=true,Lego=true',pk0);
    await p.evaluate(()=>nbhLink.press('menu','take'));
    await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr[data-key="menu"] button[data-act="choose"]')].find(b=>b.textContent==='Ball').click());
    const pk1=await p.evaluate(()=>({p:[...document.querySelectorAll('#lkPanel tr[data-key="menu"] button[data-act="choose"]')].map(b=>b.getAttribute('aria-pressed')).join(),pressed:nbhLink.rows().find(r=>r.key==='menu').pressed}));
    ok('R menu: a card left out; the row stays ticked',pk1.p==='true,false,true,true'&&pk1.pressed==='take',pk1);
    ok('R menu: the preview names the picked cards',/Adds 3 backup rows \(class and cost to fill in\): Tablet, Bubbles, Lego\./.test(await noteOf(p,'menu')));
    await p.evaluate(()=>nbhLink.apply());await sleep(100);
    ok('R menu: only the picked cards are added',(await p.evaluate(()=>S.bk.map(r=>r.n).filter(Boolean).join()))==='Puzzle,Tablet,Bubbles,Lego');
    await p.evaluate(()=>{S.bk=[{n:'Five minutes with the magnetic tiles',c:'',cost:'',pref:'',conf:'',note:''},{n:'Praise',c:'',cost:'',pref:'',conf:'No',note:''}];renderAll();});
    await feed(p,TK(BOARD({ch:['Magnetic tiles','Praise','','','','']})),'TK-1_x.json');
    const mz=await p.evaluate(()=>({r:nbhLink.rows().find(r=>r.key==='menu'),hint:document.querySelector('#lkHintBk').textContent}));const mzn=await noteOf(p,'menu');
    ok('R menu: "Magnetic tiles" ≈ "Five minutes with the magnetic tiles", not added again',mz.r.st===1&&/Card “Magnetic tiles” ≈ backup “Five minutes with the magnetic tiles”\./.test(mzn),{r:mz.r,mzn});
    ok('R menu: a card whose backup is not a reinforcer (RA-1) is named, in the row and the hint',/Card “Praise” is a backup this plan records as not a reinforcer \(RA-1\)\./.test(mzn)&&/“Praise” is a backup this plan records as not a reinforcer \(RA-1\)\./.test(mz.hint),{mzn,hint:mz.hint});
    await p.close();}
  {const p=await open(ctx,URL1,log);
    /* the token form: a different one is offered, never ticked, even when the book changed its token */
    await p.evaluate(()=>{S.meta.tokForm='Points on a laminated card, initialled by the aide';renderAll();});await link(p);await sleep(50);
    await feed(p,TK(BOARD()),'TK-1_x.json');await p.evaluate(()=>nbhLink.press('tok','keep'));await p.evaluate(()=>nbhLink.apply());await sleep(50);
    await feed(p,TK(BOARD({tok:'Coin'})),'TK-1_x.json');
    let R=await rows(p);
    ok('R token form: changed on Form TK-1, Replace offered and not ticked',R.tok.st===5&&R.tok.take&&R.tok.pressed==='',R.tok);
    /* the count: the sentence names the book's count only when this plan has none or the same */
    await p.evaluate(()=>{S.meta.tokForm='';S.meta.epN='7';renderAll();});await feed(p,TK(BOARD()),'TK-1_x.json');
    ok('R token form: no count that contradicts tokens per exchange',/^Writes: Stars on the token board book \(Form TK-1\)\.$/.test(await noteOf(p,'tok')),await noteOf(p,'tok'));
    /* establishing (1 or 2) and more than 10: information, not a difference */
    for(const [ep,re] of [['1',/^This plan opens the exchange after 1 token \(establishing the token\); the book prints 3 to 10 slots \(now 5\)\.$/],['2',/after 2 tokens \(establishing/],['12',/^This plan opens the exchange after 12 tokens; the book holds 10 at most \(now 10\)\.$/]]){
      await p.evaluate(e=>{S.meta.epN=e;renderAll();},ep);await feed(p,TK(BOARD({term:'ring',n:ep==='12'?'10':'5'})),'TK-1_x.json');
      R=await rows(p);const inf=await infos(p);
      ok('R count '+ep+': an information line, no row to look at, no last-token warning',!R.n&&inf.some(t=>re.test(t))&&!inf.some(t=>/as the last, but/.test(t)),{R:Object.keys(R),inf});}
    /* a problem behavior as the behavior the tokens are earned for */
    await p.evaluate(()=>{S.meta.epN='5';S.meta.beh='Elopement';renderAll();window.nbhCase=window.nbhCase||{};window.__case0=window.nbhCase.facts;window.nbhCase.facts={behaviors:[{label:'Elopement',isRep:false},{label:'Asks for a break',isRep:true}]};});
    await feed(p,TK(BOARD({cardLabel:'Ask for break'})),'TK-1_x.json');
    R=await rows(p);const pb=await noteOf(p,'beh');
    ok('R problem behavior: warned, no Keep, no Take',/This plan’s behavior, “Elopement”, is a problem behavior on Form TB-1\. Tokens are earned for the replacement behavior \(TB-1: “Asks for a break”\); correct it here\./.test(pb)&&!R.beh.keep&&!R.beh.take,{R:R.beh,pb});
    await p.evaluate(()=>{window.nbhCase.facts=window.__case0;});
    /* a long behavior: no promise that the book can take it; the pairing line only with a behavior here */
    await p.evaluate(()=>{S.meta.beh='Places one block in the bin from the tray during independent work';renderAll();});
    await feed(p,TK(BOARD({cardLabel:''})),'TK-1_x.json');R=await rows(p);
    ok('R long behavior: "only here" with no promise, and the 40-character note',R.beh.st===2&&R.beh.label==='only here'&&/A card holds 40 characters/.test(await noteOf(p,'beh')),{R:R.beh,n:await noteOf(p,'beh')});
    await p.evaluate(()=>{S.meta.beh='';renderAll();});await feed(p,TK(BOARD()),'TK-1_x.json');
    ok('R behavior empty: no pairing line',!/pairs its target card/.test(await noteOf(p,'beh')),await noteOf(p,'beh'));
    /* plurals, articles, a junk result */
    await feed(p,TK(BOARD({tok:'Bus',term:'pic',last:'Unicorn'})),'TK-1_x.json');
    ok('R wording: "Buses", "a unicorn"',/^Writes: Buses on the token board book \(Form TK-1\), 5 to earn; the last one is a unicorn with/.test(await noteOf(p,'tok')),await noteOf(p,'tok'));
    await p.evaluate(()=>{S.meta.lk=JSON.stringify({v:1,on:1,last:{when:'2026-10-03T12:00:00Z',res:'look 9999'}});renderAll();});
    ok('R junk result: no "in step" claim',await p.evaluate(()=>!/in step/.test(document.querySelector('#lkPanel .lk-status').textContent)&&/^Compared with this plan on /.test(document.querySelector('#lkPrint').textContent)));
    /* the keyboard: after Apply the focus goes to Undo */
    await p.evaluate(()=>{S=blank();renderAll();});await link(p);await feed(p,TK(BOARD()),'TK-1_x.json');
    await p.focus('#lkPanel [data-lk="apply"]');await p.keyboard.press('Enter');await sleep(150);
    ok('R keyboard: focus moves to Undo after Apply',await p.evaluate(()=>document.activeElement&&document.activeElement.dataset.lk==='undo'));
    /* a long file name at phone width */
    await p.setViewportSize({width:390,height:844});await feed(p,TK(BOARD()),'TK-1_'+'Alexandria_Konstantinopoulos_Vanderberg'.repeat(3)+'.json');await p.evaluate(()=>nbhLink.leave());await sleep(100);
    const lw=await p.evaluate(()=>{const e=document.querySelector('#lkPanel');return {pw:e.scrollWidth,pc:e.clientWidth,doc:document.documentElement.scrollWidth,w:innerWidth};});
    ok('R phone: a long file name wraps inside the panel',lw.pw<=lw.pc+1&&lw.doc<=lw.w+1,lw);
    await p.close();}

  const errs=log.filter(l=>!/Failed to load resource: the server responded with a status of 404/.test(l.text));
  ok('no console errors',!errs.length,errs);
  await br.close();
  console.log(out.join('\n'));console.log(fails?fails+' FAILED':'ALL OK ('+out.length+' checks)');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
