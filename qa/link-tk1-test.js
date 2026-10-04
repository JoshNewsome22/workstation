/* v21.43 the TK-1 / TE-1 link, Form TK-1's side (plan section 9). Form TK-1 alone, with Form TE-1's own simulation file
   (as its Save data writes it) and hand-made TE-1 files as the partner, then both forms open in the workstation:
   1  off by default: no lk; the same record, field totals, printed text, page count and saved file as the TK-1 from
      before the link; the blank book prints 11 sheets; an Unlink leaves no lk behind
   2  one core: the link core sits in the built TK-1 byte for byte (and in TE-1); the sibling names are the ALL entries
   3  a blank book and TE-1's simulation: the compare changes nothing but lk; the student and the Choices ticked, the long
      behavior information only, the count and the token in step, the schedule unticked; Apply changes only the client,
      the sid and cards 1 to 4
   4  conflicts: "different" with nothing ticked; Keep, then "kept different"; "changed on Form TE-1", ticked
   5  the count: 1 and 12 are information only; 7 is taken with the captions written for 7; edited captions are asked
      about first, and Cancel leaves the book as it was
   6  a backup gone from the plan after a take: the amber line, the card kept; an RA-1 No backup never offered, named
   7  identity: another student holds Apply until "These are the same student"; nothing is written before
   8  the problem-behavior guard (window.nbhCase.facts stubbed): no Take, no Keep
   9  files: a packet, this form's own file, an SM-1 file and a case without TE-1 refused with S unchanged; a CASE json
      and a .case.html accepted
   10 round trips: Save then Open, #tkState, the last token's own picture; junk lk reads as off; the record holds at
      1800 characters or less with 40-character labels
   11 the schedule paragraph: exactly one after a take, replaced after a change on the plan; no "{" from the plan's words
   13 Undo puts S back exactly
   shell 15 Compare from TK-1 reads TE-1 through the relay and leaves it alone; 18 spoofed answers are ignored and
      counted; 19 Save case, Open case and an autosave keep both link records, and a Keep changes the case's signature
   Plus no sideways page scroll at 390 px, no console errors, and pictures of the panel (off, on, compared with
   differences, after Apply) at 820 x 1180, 1180 x 820 and 390 x 844 (LINK_SHOTS, default qa/out/link-tk1/).
   usage: node qa/link-tk1-test.js   (WS_URL names the server and WS_ROOT the folder, as in lib.js) */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {execSync}=require('child_process');
const TKF='TK-1_Token-Board-Book_v2026-10.html',TEF='TE-1_Token-Economy-Designer_v2026-09.html';
const URL1=BASE+'/NBH-Workstation/'+TKF,URL0=BASE+'/NBH-Workstation/__tk1_before_link.html',TEURL=BASE+'/NBH-Workstation/'+TEF;
const SHOTS=process.env.LINK_SHOTS||__dirname+'/out/link-tk1';
const BANNER='/* ===== nbh-link (tools/blocks/nbh-link.js) ===== */\n';
/* the baseline: the TK-1 from before the link, the parent of the first commit whose TK-1 holds the link core (HEAD may
   hold the link already, so comparing with HEAD could compare the file with itself) */
const G=c=>execSync('git -C "'+ROOT+'" '+c,{maxBuffer:512<<20}).toString('utf8');
const FIRST=G("log --format=%H -S 'nbh-link (tools/blocks/nbh-link.js)' -- NBH-Workstation/"+TKF).trim().split('\n').filter(Boolean).pop();
const PRE=FIRST?G('rev-parse '+FIRST+'^').trim():'HEAD';
const BEFORE=G('show '+PRE+':NBH-Workstation/'+TKF);
if(BEFORE.includes('nbh-link (tools/blocks/nbh-link.js)'))throw new Error('the baseline TK-1 ('+PRE+') already holds the link');

let fails=0;const out=[];
function ok(name,cond,extra){out.push((cond?'ok   ':'FAIL ')+name+(cond||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,700)));if(!cond)fails++;}

async function open(ctx,url,log){const p=await ctx.newPage();wire(p,log);await p.goto(url||URL1);await sleep(500);
  await p.evaluate(()=>{window.confirm=()=>true;});return p;}
const sOf=p=>p.evaluate(()=>JSON.stringify(S));
const noLk=j=>{const o=JSON.parse(j);delete o.meta.lk;return JSON.stringify(o);};
const lkOf=p=>p.evaluate(()=>S.meta.lk||'');
/* the bridge's own count (input, select and textarea, less file and hidden ones), computed in the page */
const totals=p=>p.evaluate(()=>{let n=0,t=0;document.querySelectorAll('input,select,textarea').forEach(e=>{if(e.type==='file'||e.type==='hidden')return;t++;
  if(e.type==='checkbox'||e.type==='radio'){if(e.checked)n++;}else if(String(e.value||'').trim())n++;});return {filled:n,total:t};});
const sim=p=>p.evaluate(async()=>{await loadSim();});
/* a file into the panel's own file input, as a person picking it would */
async function feed(p,text,name){await p.evaluate(([t,n])=>{const fi=document.querySelector('#lkPanel .lk-fileIn'),dt=new DataTransfer();
  dt.items.add(new File([t],n,{type:/html$/.test(n)?'text/html':'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},[text,name]);await sleep(350);}
const rows=p=>p.evaluate(()=>{const o={};nbhLink.rows().forEach(r=>{o[r.key]=r;});return o;});
const st=p=>p.evaluate(()=>nbhLink.state());
const link=async p=>{await p.evaluate(()=>{document.querySelector('#lkPanel [data-lk="on"]').click();});await sleep(120);};
const apply=async p=>{const r=await p.evaluate(()=>nbhLink.apply());await sleep(350);return r;};
const press=(p,k,w)=>p.evaluate(([k,w])=>nbhLink.press(k,w),[k,w]);
/* a row ticked for a Take, whatever it was; and every ticked row but the ones named let go */
const tick=(p,k)=>p.evaluate(k=>{const r=nbhLink.rows().find(x=>x.key===k);if(r&&r.pressed!=='take')nbhLink.press(k,'take');},k);
const only=(p,keep)=>p.evaluate(keep=>{nbhLink.rows().forEach(r=>{if(r.pressed&&!keep.includes(r.key))nbhLink.press(r.key,r.pressed);});},keep);
const noteOf=(p,k)=>p.evaluate(k=>{const t=document.querySelector('#lkPanel tr.lk-note[data-for="'+k+'"]');return t?[...t.querySelectorAll('td > div')].map(d=>d.textContent):[];},k);
const infos=p=>p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-info')].map(t=>t.textContent));
/* the text a Save data writes, caught as it is handed to the browser */
const saved=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{URL.createObjectURL=o;b.text().then(res);return o.call(URL,b);};document.querySelector('#saveBtn').click();}));
const openData=(p,text)=>p.evaluate(t=>{const fi=document.querySelector('#fileIn'),dt=new DataTransfer();dt.items.add(new File([t],'TK-1_x.json',{type:'application/json'}));fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));},text).then(()=>sleep(400));
const pdfPages=async p=>{await p.evaluate(()=>setView('preview'));await sleep(150);await p.emulateMedia({media:'print'});await p.evaluate(()=>fitAll());
  const n=((await p.pdf({printBackground:true,preferCSSPageSize:true})).toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;await p.emulateMedia({media:'screen'});return n;};
const bookText=async p=>{await p.emulateMedia({media:'print'});await p.evaluate(()=>fitAll());const t=await p.evaluate(()=>document.querySelector('#book').innerText);await p.emulateMedia({media:'screen'});return t;};
/* the panel's picture: from its band heading to its foot; the sticky toolbar is let go so it does not sit over it */
async function shot(p,name){await p.evaluate(()=>{setView('setup');if(!document.getElementById('shotCss')){const s=document.createElement('style');s.id='shotCss';s.textContent='.toolbar{position:static!important}';document.head.appendChild(s);}
    document.querySelectorAll('.nbh-toast').forEach(e=>e.remove());[...document.querySelectorAll('h2.nbh-band')].find(e=>/Linked with Form TE-1/.test(e.textContent)).scrollIntoView();});await sleep(200);
  const box=await p.evaluate(()=>{const a=[...document.querySelectorAll('h2.nbh-band')].find(e=>/Linked with Form TE-1/.test(e.textContent)).getBoundingClientRect(),b=document.querySelector('#lkPanel').getBoundingClientRect();
    return {x:0,y:Math.max(0,a.top+scrollY-8),width:document.documentElement.clientWidth,height:Math.ceil(b.bottom-a.top+16)};});
  await p.screenshot({path:SHOTS+'/'+name,clip:box,fullPage:true});await p.evaluate(()=>{const e=document.getElementById('shotCss');if(e)e.remove();});}
const wide=p=>p.evaluate(()=>({doc:document.documentElement.scrollWidth,w:document.documentElement.clientWidth,panel:document.querySelector('#lkPanel').scrollWidth,pc:document.querySelector('#lkPanel').clientWidth}));

(async()=>{
  fs.mkdirSync(SHOTS,{recursive:true});
  const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1280,height:900}});
  await ctx.route(URL0,r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:BEFORE}));
  const log=[];

  /* ---- Form TE-1's simulation, as its own Save data writes it; the hand-made plans are changed copies of it ---- */
  let SIM;{const te=await open(ctx,TEURL,log);await te.evaluate(async()=>{await loadSim();});SIM=await saved(te);await te.close();}
  const PLAN=fn=>{const d=JSON.parse(SIM);if(fn)fn(d.S,d);return JSON.stringify(d,null,1);};
  const simS=JSON.parse(SIM).S;
  ok('fixture: TE-1\'s simulation file is its own saved file',JSON.parse(SIM).form==='TE-1'&&simS.meta.epN==='5'&&simS.bk.length===4);

  /* ---- 2. one core ---- */
  {const core=fs.readFileSync(path.join(ROOT,'tools/blocks/nbh-link.js'),'utf8');
    const tk=fs.readFileSync(path.join(ROOT,'NBH-Workstation',TKF),'utf8'),te=fs.readFileSync(path.join(ROOT,'NBH-Workstation',TEF),'utf8');
    ok('2 the core is in the built TK-1 once, byte for byte, under its banner',tk.split(BANNER).length===2&&tk.split(BANNER+core).length===2&&tk.split('nbh-link (v21.44)').length===2);
    ok('2 the core in TE-1 is the same file, byte for byte',te.split('<script id="nbh-link">'+core+'</script>').length===2);
    const sib=/sibling:'([^']+)'/.exec(tk.slice(tk.indexOf('v21.43 the link with Form TE-1'))),idx=fs.readFileSync(path.join(ROOT,'NBH-Workstation/index.html'),'utf8');
    const all=id=>{const m=new RegExp("\\['"+id+"','[^']*','([^']+)'\\]").exec(idx);return m?m[1]:'';};
    ok('2 TK-1\'s sibling is the ALL entry for TE-1, and the file is there',!!sib&&sib[1]===all('TE-1')&&fs.existsSync(path.join(ROOT,'NBH-Workstation',sib[1]))&&fs.existsSync(path.join(ROOT,'RPS-Workstation',sib[1])),{sib:sib&&sib[1],all:all('TE-1')});
    ok('2 the TK-1 file name is the ALL entry for TK-1',all('TK-1')===TKF);}

  /* ---- 1. off by default, against the TK-1 from before the link ---- */
  {const A=await open(ctx,URL0,log),B=await open(ctx,URL1,log);
    const a0=await totals(A),b0=await totals(B);
    ok('1 blank: the field totals are the ones from before the link',JSON.stringify(a0)===JSON.stringify(b0),{was:a0,now:b0});
    ok('1 blank: no lk in the record, and the record is the one from before',!('lk' in (await B.evaluate(()=>S.meta)))&&(await sOf(A))===(await sOf(B)));
    ok('1 blank: the panel is off, with its sentence and one button',await B.evaluate(()=>!document.querySelector('#lkPanel .lk-off').hidden&&document.querySelector('#lkPanel .lk-on').hidden&&
      /^Link this book with Form TE-1, the token economy plan for the same student\./.test(document.querySelector('#lkPanel .lk-offtxt').textContent)&&document.querySelector('#lkPanel [data-lk="on"]').textContent==='Link with Form TE-1'));
    ok('1 blank: the Setup verdict is the one from before',(await A.evaluate(()=>document.querySelector('#setupVerdict').innerHTML))===(await B.evaluate(()=>document.querySelector('#setupVerdict').innerHTML)));
    const pa=await pdfPages(A),pb=await pdfPages(B);
    ok('1 blank: the book prints 11 sheets, as before',pb===11&&pa===pb,{was:pa,now:pb});
    ok('1 blank: the printed text is the one from before',(await bookText(A))===(await bookText(B)));
    await sim(A);await sim(B);await sleep(300);
    const a1=await totals(A),b1=await totals(B);
    ok('1 simulator: the same totals, no lk, the same record',JSON.stringify(a1)===JSON.stringify(b1)&&(await sOf(A))===(await sOf(B))&&!('lk' in (await B.evaluate(()=>S.meta))),{was:a1,now:b1});
    ok('1 simulator: the same Setup verdict',(await A.evaluate(()=>document.querySelector('#setupVerdict').innerHTML))===(await B.evaluate(()=>document.querySelector('#setupVerdict').innerHTML)));
    const sa=JSON.parse(await saved(A)),sb=JSON.parse(await saved(B));
    ok('1 simulator: the saved file is the one from before (apart from the time)',JSON.stringify(sa.S)===JSON.stringify(sb.S)&&sa.form===sb.form&&sa.rev===sb.rev);
    const qa=await pdfPages(A),qb=await pdfPages(B);
    ok('1 simulator: the same number of printed sheets ('+qb+')',qa===qb,{was:qa,now:qb});
    ok('1 simulator: the printed text is the one from before',(await bookText(A))===(await bookText(B)));
    await B.evaluate(()=>setView('setup'));await link(B);
    ok('1 link on: lk in the record and in #tkState; the verdict names it',await B.evaluate(()=>NBHLink.isOn(S.meta.lk)&&JSON.parse(document.querySelector('#tkState').value).meta.lk===S.meta.lk&&/Linked with Form TE-1 \(not compared yet\)\.$/.test(document.querySelector('#setupVerdict').textContent)));
    ok('1 link on: the totals do not move (the panel has no field)',JSON.stringify(await totals(B))===JSON.stringify(b1));
    await B.evaluate(()=>nbhLink.unlink());await sleep(150);
    ok('1 Unlink: no lk left, the panel off, the verdict as before',await B.evaluate(()=>!('lk' in S.meta)&&!nbhLink.state().on&&!JSON.parse(document.querySelector('#tkState').value).meta.lk)&&
      (await A.evaluate(()=>document.querySelector('#setupVerdict').innerHTML))===(await B.evaluate(()=>document.querySelector('#setupVerdict').innerHTML)));
    await A.close();await B.close();}

  /* ---- 3. a blank book and TE-1's simulation file; 13. Undo ---- */
  {const p=await open(ctx,URL1,log);
    await link(p);
    const before=await sOf(p);
    await feed(p,SIM,'TE-1_SIMULATED_2026-10-03.json');
    const s=await st(p),R=await rows(p),after=await sOf(p);
    ok('3 compare: the table is shown, from the file',s.table&&s.lk.last.via==='file'&&s.lk.last.file==='TE-1_SIMULATED_2026-10-03.json',s);
    ok('3 compare: S is unchanged apart from lk',noLk(before)===noLk(after));
    ok('3 alone: Compare and Open beside hidden; the file button and the new-tab link to Form TE-1 shown',await p.evaluate(()=>{const q=s=>document.querySelector('#lkPanel '+s);
      return q('[data-lk="compare"]').hidden&&q('[data-lk="beside"]').hidden&&!q('[data-lk="file"]').hidden&&!q('.lk-sib').hidden&&q('.lk-sib').getAttribute('href')==='TE-1_Token-Economy-Designer_v2026-09.html';}));
    ok('3 rows: who, card, n, tok, menu, sched',Object.keys(R).join()==='who,card,n,tok,menu,sched',Object.keys(R));
    ok('3 who: empty here, ticked',R.who.st===3&&R.who.pressed==='take',R.who);
    const beh=simS.meta.beh;
    const cn=await noteOf(p,'card');
    ok('3 card: the plan\'s behavior is '+beh.length+' characters, information only (no Take, no Keep)',R.card.what==='Target card 1'&&!R.card.take&&!R.card.keep&&R.card.pressed===''&&
      cn.some(t=>t==='Form TE-1’s behavior is '+beh.length+' characters; a card holds 40. Write a short label on Targets card 1, then compare again and press Keep to pair them.'),{R:R.card,cn});
    ok('3 n and tok in step ("Laminated stars ..." is the Star)',R.n.st===1&&R.tok.st===1,{n:R.n,tok:R.tok});
    ok('3 menu: ticked, the four backups',R.menu.st===3&&R.menu.pressed==='take'&&R.menu.there.split('; ').length===4,R.menu);
    ok('3 menu: the preview names the four and the cards',(await noteOf(p,'menu')).some(t=>/^Puts Tablet, video clips, Fruit chew, Five minutes with the magnetic tiles and Choose the next work task on cards 1 to 4\./.test(t)));
    ok('3 sched: offered, unticked',R.sched.st===3&&R.sched.take&&R.sched.pressed==='',R.sched);
    const inf=await infos(p);
    ok('3 information: the price line and "not linked back"',inf.includes('Form TE-1: 10 responses per token, 5 tokens per exchange, 50 responses per exchange, unit price 10.')&&
      inf.includes('Form TE-1 is not linked back; turn on Link with Form TK-1 there to see this book from the plan.'),inf);
    ok('3 status: 4 items to look at',/^Linked with Form TE-1 · 4 items to look at below\.$/.test(s.status[0]),s.status);
    ok('3 Setup verdict: compared, 4 items to look at',/Linked with Form TE-1 \(compared [^:]+: 4 items to look at\)\.$/.test(await p.evaluate(()=>document.querySelector('#setupVerdict').textContent)));
    await apply(p);
    const S0=JSON.parse(before),S1=JSON.parse(await sOf(p)),s1=await st(p);
    const L=['Tablet, video clips','Fruit chew','Five minutes with the magnetic tiles','Choose the next work task'];
    ok('3 apply: client and sid',S1.meta.client===simS.meta.client&&S1.meta.sid===simS.meta.sid,S1.meta);
    ok('3 apply: cards 1 to 4 hold the backups\' names, 5 and 6 still empty',S1.ch.slice(0,4).map(o=>o.l).join('|')===L.join('|')&&S1.ch.slice(4).every(o=>!o.k&&!o.ph&&!o.l),S1.ch);
    const chg=Object.keys(S1).filter(k=>JSON.stringify(S1[k])!==JSON.stringify(S0[k]));
    const mchg=Object.keys(Object.assign({},S0.meta,S1.meta)).filter(k=>k!=='lk'&&S0.meta[k]!==S1.meta[k]);
    ok('3 apply: only the client, the sid and the cards change (tg, n, caps and txt as they were)',chg.sort().join()==='ch,meta'&&mchg.sort().join()==='client,sid'&&JSON.stringify(S1.tg)===JSON.stringify(S0.tg)&&S1.meta.n===S0.meta.n&&JSON.stringify(S1.caps)===JSON.stringify(S0.caps)&&JSON.stringify(S1.txt)===JSON.stringify(S0.txt),{chg,mchg});
    ok('3 apply: the toast',s1.toast==='2 items taken from Form TE-1. Nothing else changed.',s1.toast);
    ok('3 apply: the took line',/^Taken .+: the student’s name and ID; choice cards 1 to 4 from the backups$/.test(s1.lk.took||''),s1.lk.took);
    const rp=await p.evaluate(()=>document.querySelector('#lkPanel .lk-rp').textContent);
    ok('3 apply: the reprint line names the choice cards',/^Reprint: the choice-card page \(changed by the link .+\)\.$/.test(rp),rp);
    ok('3 apply: the board summary carries the new cards for Form TE-1',JSON.stringify(s1.lk.board.ch)===JSON.stringify(L.concat(['',''])),s1.lk.board);
    ok('3 apply: the screen shows them',await p.evaluate(()=>[...document.querySelectorAll('#chTbl tbody tr')].slice(0,4).every((tr,i)=>tr.querySelector('input').value===S.ch[i].l)&&document.querySelector('[data-m="client"]').value===S.meta.client));
    ok('3 apply: "From the case" is untouched and the record holds the menu names it saw',s1.lk.menuSeen&&s1.lk.menuSeen.length===4);
    /* 13. Undo */
    ok('13 Undo is offered',s1.undo);
    await p.evaluate(()=>nbhLink.undo());await sleep(300);
    const S2=await sOf(p);
    ok('13 Undo restores S exactly',S2===after,{a:after.length,b:S2.length});
    ok('13 Undo: the screen too, and Undo is gone',await p.evaluate(()=>!document.querySelector('[data-m="client"]').value&&[...document.querySelectorAll('#chTbl tbody tr')].every(tr=>!tr.querySelector('input').value)&&!nbhLink.state().undo));
    /* an edit after a take withdraws Undo, and the edit stays */
    await feed(p,SIM,'TE-1_SIMULATED_2026-10-03.json');await apply(p);
    await p.evaluate(()=>{const i=document.querySelector('[data-m="first"]');i.value='Ana';i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
    const u=await p.evaluate(()=>({undo:nbhLink.state().undo,r:nbhLink.undo(),first:S.meta.first}));
    ok('13 an edit after the take withdraws Undo; the edit stays',!u.undo&&u.r===false&&u.first==='Ana',u);
    await p.close();}

  /* ---- 4. conflicts ---- */
  {const p=await open(ctx,URL1,log);await sim(p);await p.evaluate(()=>{setView('setup');S.tg[0].l='Work';renderAll();});await link(p);
    const plan1=PLAN(S=>{S.meta.beh='Sits at the desk';});
    await feed(p,plan1,'TE-1_a.json');let R=await rows(p);
    ok('4 no base: card "Work" against "Sits at the desk" is "different", nothing ticked',R.card.st===7&&R.card.label==='different'&&R.card.here==='Work'&&R.card.pressed===''&&R.card.take&&R.card.keep,R.card);
    ok('4 the card buttons: six, card 1 pressed',(await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr[data-key="card"] button[data-act="choose"]')].map(b=>b.getAttribute('aria-pressed')).join()))==='true,false,false,false,false,false');
    ok('4 the take preview names the picture it brings',(await noteOf(p,'card')).some(t=>/^Writes “Sits at the desk” on target card 1/.test(t)));
    await press(p,'card','keep');await apply(p);
    await feed(p,plan1,'TE-1_a.json');R=await rows(p);
    ok('4 Keep, then a recompare: "kept different"',R.card.st===4&&/^kept different/.test(R.card.label)&&R.card.pressed==='',R.card);
    await feed(p,PLAN(S=>{S.meta.beh='Raises a hand to ask for help';}),'TE-1_b.json');R=await rows(p);
    ok('4 a plan with another behavior: "changed on Form TE-1", ticked',R.card.st===5&&R.card.label==='changed on Form TE-1'&&R.card.pressed==='take',R.card);
    /* the card buttons choose the card; the choice goes into the record, and the board summary pairs it */
    await p.evaluate(()=>document.querySelector('#lkPanel tr[data-key="card"] button[data-act="choose"][data-i="3"]').click());await sleep(150);
    R=await rows(p);const lk=JSON.parse(await lkOf(p));
    ok('4 card button 4: the row compares card 4, and the record pairs it',R.card.what==='Target card 4'&&lk.card===3&&lk.board.card===3&&lk.board.cardLabel===R.card.here,{R:R.card,card:lk.card,board:lk.board});
    await press(p,'card','take');await apply(p);
    ok('4 Take: card 4 holds the behavior, the other cards as they were',await p.evaluate(()=>S.tg[3].l==='Raises a hand to ask for help'&&S.tg[0].l==='Work'&&S.tg[1].k==='raisehand'));
    R=await rows(p);ok('4 after the take: in step on card 4',R.card.st===1&&R.card.what==='Target card 4',R.card);
    /* a label that matches the behavior finds its card */
    await p.evaluate(()=>{S.tg[5].l='Sits at the desk';renderAll();});await feed(p,plan1,'TE-1_a.json');R=await rows(p);
    ok('4 a card whose label is the behavior is the one compared',R.card.what==='Target card 6'&&R.card.st===1,R.card);
    await p.close();}

  /* ---- 5. the count ---- */
  {const p=await open(ctx,URL1,log);await link(p);
    for(const [ep,re] of [['1',/^Form TE-1 opens the exchange after 1 token \(establishing the token\); the board prints 3 to 10 slots \(now 5\)\.$/],['12',/^Form TE-1 asks for 12 tokens per exchange; the board holds 10 at most \(now 5\)\.$/],
      ['',/^Form TE-1 has no tokens per exchange yet; it can take this book’s 5 when it compares\.$/],['4.5',/^Form TE-1 has no whole number of tokens per exchange yet\.$/]]){
      await feed(p,PLAN(S=>{S.meta.epN=ep;}),'TE-1_n.json');const R=await rows(p),inf=await infos(p);
      ok('5 tokens per exchange '+JSON.stringify(ep)+': information only, no row',!R.n&&inf.some(t=>re.test(t)),{keys:Object.keys(R),inf});}
    const before=await sOf(p);
    await feed(p,PLAN(S=>{S.meta.epN='7';}),'TE-1_n.json');let R=await rows(p);
    ok('5 seven: a row, "different", unticked, with the preview',R.n&&R.n.st===7&&R.n.pressed===''&&R.n.take&&(await noteOf(p,'n')).includes('Prints 7 slots on the Board and 7 boxes on the Tokens page; the captions are written for 7.'),R.n);
    await only(p,[]);await tick(p,'n');await apply(p);
    ok('5 seven taken: n is 7 and the captions are the defaults for 7',await p.evaluate(()=>S.meta.n==='7'&&JSON.stringify(S.caps)===JSON.stringify(defCaps(7,tokName()))&&document.querySelector('[data-m="n"]').value==='7'&&document.querySelectorAll('#book .pg[data-kind="bd"] .slot').length===7));
    ok('5 seven taken: the reprint line names the Board and the Tokens pages',/^Reprint: the Board, Tokens and token-card pages/.test(await p.evaluate(()=>document.querySelector('#lkPanel .lk-rp').textContent)),await p.evaluate(()=>document.querySelector('#lkPanel .lk-rp').textContent));
    /* once printed, the pages printed come off the reprint line */
    await p.evaluate(()=>{S.meta.order='fronts';renderAll();window.dispatchEvent(new Event('afterprint'));});await sleep(150);
    const rp1=JSON.parse(await lkOf(p)).rp;
    ok('5 afterprint, the fronts printed: the Board and Tokens come off the reprint line, the token cards stay',JSON.stringify(rp1)==='["token-card"]',rp1);
    await p.evaluate(()=>{S.meta.order='all';renderAll();window.dispatchEvent(new Event('afterprint'));});await sleep(150);
    const lkp=JSON.parse(await lkOf(p));
    ok('5 afterprint, the whole book printed: the reprint line is gone',!lkp.rp&&!lkp.rpd&&await p.evaluate(()=>document.querySelector('#lkPanel .lk-rp').hidden),lkp);
    /* edited captions: asked first; Cancel leaves the book exactly as it was */
    await p.evaluate(()=>{S.caps[1].b='Nice!';renderAll();});
    await feed(p,PLAN(S=>{S.meta.epN='4';}),'TE-1_n.json');
    const b2=await sOf(p);
    await p.evaluate(()=>{window.__asked=[];window.confirm=t=>{window.__asked.push(t);return false;};});
    await only(p,[]);await tick(p,'n');const res=await apply(p);
    const asked=await p.evaluate(()=>window.__asked);
    ok('5 edited captions: the question is asked',asked.length===1&&asked[0]==='Change the board to 4 tokens?\nYour edited captions are written again for 4 slots.',asked);
    ok('5 Cancel: nothing taken, S exactly as it was',res.taken===0&&(await sOf(p))===b2,res);
    R=await rows(p);ok('5 Cancel: the row keeps its state (not "kept")',R.n.st===5||R.n.st===7,R.n);
    await p.evaluate(()=>{window.confirm=()=>true;});await tick(p,'n');await apply(p);
    ok('5 OK: 4 slots, the captions written again for 4',await p.evaluate(()=>S.meta.n==='4'&&JSON.stringify(S.caps)===JSON.stringify(defCaps(4,tokName()))));
    ok('5 the last-token line when the book marks it and the count differs',await (async()=>{await p.evaluate(()=>{S.meta.term='ring';renderAll();});await feed(p,PLAN(S=>{S.meta.epN='6';}),'TE-1_n.json');
      return (await infos(p)).includes('The book marks its 4th token as the last, but Form TE-1 opens the exchange after 6.');})());
    ok('5 the thinning line when the plan\'s last step has another count',await (async()=>{await feed(p,PLAN(S=>{S.thin.push({d:'10/14/26',w:'Exchange production',tp:'10',ep:'8',te:'8',crit:''});}),'TE-1_n.json');
      return (await infos(p)).includes('Form TE-1’s thinning record has 8 tokens per exchange on 10/14/26; a new step means a new Board and Tokens page.');})());
    ok('5 token loss on the plan: the information line',await (async()=>{await feed(p,PLAN(S=>{S.meta.loss='Yes — described below';S.meta.lossRule='One token comes off for a thrown block, never below zero.';}),'TE-1_n.json');
      return (await infos(p)).includes('Form TE-1 records token loss: One token comes off for a thrown block, never below zero. The book’s backs do not describe it.');})());
    void before;await p.close();}

  /* ---- 6. the menu: a backup gone from the plan, RA-1 No ---- */
  {const p=await open(ctx,URL1,log);await link(p);await feed(p,SIM,'TE-1_SIMULATED.json');await apply(p);
    await feed(p,PLAN(S=>{S.bk.splice(1,1);}),'TE-1_minus.json');
    const w=await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-note[data-for="menu"] .lk-warn')].map(e=>e.textContent));
    ok('6 a backup gone from the plan: the amber line',w.includes('Card 2, Fruit chew, is no longer on Form TE-1’s menu.'),w);
    ok('6 ... and the card stays as it is',await p.evaluate(()=>S.ch[1].l==='Fruit chew'));
    await feed(p,PLAN(S=>{S.bk.push({n:'Praise',c:'Social / attention',cost:'',pref:'',conf:'No',note:''});}),'TE-1_no.json');
    let R=await rows(p),mn=await noteOf(p,'menu');
    ok('6 an RA-1 No backup: named, not offered, and the row is in step without it',R.menu.st===1&&!R.menu.take&&mn.some(t=>t.includes('“Praise” (not a reinforcer on RA-1)')),{R:R.menu,mn});
    await feed(p,PLAN(S=>{S.bk[1].conf='No';}),'TE-1_no2.json');
    const w2=await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-note[data-for="menu"] .lk-warn')].map(e=>e.textContent));
    ok('6 a card that matches an RA-1 No backup: the amber line',w2.includes('Card 2, Fruit chew, matches a backup Form TE-1 records as not a reinforcer (RA-1).'),w2);
    /* more backups than empty cards: the names tapped last are taken */
    await p.evaluate(()=>{S.ch[2]=cello();S.ch[3]=cello();S.ch[4].l='Bubbles';S.ch[5].l='Puzzle';renderAll();});
    await feed(p,PLAN(S=>{S.bk.push({n:'Stickers',c:'',cost:'',pref:'',conf:'',note:''});}),'TE-1_more.json');
    const b=()=>p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr[data-key="menu"] button[data-act="choose"]')].map(e=>e.textContent+'='+e.getAttribute('aria-pressed')).join());
    ok('6 two empty cards, three backups: the first two picked',(await b())==='Five minutes with the magnetic tiles=true,Choose the next work task=true,Stickers=false',await b());
    await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr[data-key="menu"] button[data-act="choose"]')].find(e=>e.textContent==='Stickers').click());await sleep(100);
    ok('6 a tap on the third: it is picked, the one picked longest ago gives way',(await b())==='Five minutes with the magnetic tiles=false,Choose the next work task=true,Stickers=true',await b());
    R=await rows(p);if(R.menu.pressed!=='take')await press(p,'menu','take');
    await p.evaluate(()=>{['who','sched'].forEach(k=>{const r=nbhLink.rows().find(x=>x.key===k);if(r&&r.pressed)nbhLink.press(k,'take');});});
    await apply(p);
    ok('6 only the picked backups go on the empty cards, in the plan\'s order',await p.evaluate(()=>S.ch[2].l==='Choose the next work task'&&S.ch[3].l==='Stickers'&&S.ch[4].l==='Bubbles'),await p.evaluate(()=>S.ch.map(o=>o.l)));
    R=await rows(p);
    ok('6 a take that leaves the row different reads "taken in part", not "kept"',R.menu.st===4&&/^taken in part \(.+\)$/.test(R.menu.label)&&!!JSON.parse(await lkOf(p)).td.menu,R.menu);
    await press(p,'menu','keep');await apply(p);R=await rows(p);
    ok('6 ... and a Keep of it reads "kept different"',R.menu.st===4&&/^kept different \(.+\)$/.test(R.menu.label)&&!JSON.parse(await lkOf(p)).td,R.menu);
    /* no empty card: no buttons, the names given with the reason */
    await feed(p,PLAN(S=>{S.bk.push({n:'Bubbles',c:'',cost:'',pref:'',conf:'',note:''},{n:'Swing',c:'',cost:'',pref:'',conf:'',note:''});}),'TE-1_full.json');
    mn=await noteOf(p,'menu');R=await rows(p);
    ok('6 no empty card: nothing offered, no buttons, the reason named',!R.menu.take&&!(await b())&&mn.some(t=>t.includes('“Swing” (no empty card: empty one on Choices first)')),{R:R.menu,mn});
    await p.close();}

  /* ---- 7. identity; 8. the problem-behavior guard ---- */
  {const p=await open(ctx,URL1,log);await p.evaluate(()=>{S.meta.client='Sam K.';S.meta.sid='1234';renderAll();});await link(p);
    const before=await sOf(p);
    await feed(p,PLAN(S=>{S.meta.client='Jordan B.';}),'TE-1_Jordan.json');
    let s=await st(p),R=await rows(p);
    ok('7 another student: blocked, Apply disabled',R.who.st===0&&s.blocked&&!s.apply&&await p.evaluate(()=>document.querySelector('#lkPanel [data-lk="apply"]').disabled),{who:R.who,s});
    ok('7 the status names both',/for another student\? Form TE-1 names Jordan B\.; this book names Sam K\./.test(s.status[0]),s.status);
    await p.evaluate(()=>nbhLink.apply());await sleep(200);
    ok('7 nothing is written before the press',noLk(await sOf(p))===noLk(before));
    await p.evaluate(()=>document.querySelector('#lkPanel button[data-act="keep"][data-key="who"]').click());
    s=await st(p);ok('7 "These are the same student" enables Apply',!s.blocked&&s.apply,s);
    await apply(p);
    ok('7 after the press: the client stays, the menu is taken',await p.evaluate(()=>S.meta.client==='Sam K.'&&S.ch[0].l==='Tablet, video clips'));
    /* 8 */
    await p.evaluate(()=>{window.nbhCase=window.nbhCase||{};window.__f0=window.nbhCase.facts;window.nbhCase.facts={behaviors:[{label:'Elopement',isRep:false,rep:'Asks for a break',src:'TB-1'},{label:'Asks for a break',isRep:true,src:'TB-1'}]};});
    await feed(p,PLAN(S=>{S.meta.client='Sam K.';S.meta.beh='Elopement';}),'TE-1_prob.json');
    R=await rows(p);const w=await p.evaluate(()=>[...document.querySelectorAll('#lkPanel tr.lk-note[data-for="card"] .lk-warn')].map(e=>e.textContent));
    ok('8 a problem behavior: warned, no Take and no Keep',!R.card.take&&!R.card.keep&&w.includes('Form TE-1’s behavior, “Elopement”, is a problem behavior on Form TB-1. Tokens are earned for the replacement behavior (TB-1: “Asks for a break”); correct it on Form TE-1.'),{R:R.card,w});
    await p.evaluate(()=>{window.nbhCase.facts=window.__f0;});
    await feed(p,PLAN(S=>{S.meta.client='Sam K.';S.meta.beh='Elopement';}),'TE-1_prob.json');R=await rows(p);
    ok('8 without the case\'s behaviors the same behavior can be taken',R.card.take,R.card);
    await p.close();}

  /* ---- 9. files ---- */
  {const p=await open(ctx,URL1,log);await sim(p);await p.evaluate(()=>setView('setup'));await link(p);
    const b0=await sOf(p);
    const own=JSON.stringify({form:'TK-1',rev:'2026-10',saved:'x',S:JSON.parse(b0)});
    const T=[['packet',JSON.stringify({form:'PACKET',rev:'2026-09',packet:{client:'x'}}),'PACKET_x.json','That file is a student packet, not a file Form TE-1 saved. Nothing was changed.'],
      ['this form\'s own file',own,'TK-1_x.json','That is a file this form saved, not Form TE-1’s. Nothing was changed.'],
      ['an SM-1 file',JSON.stringify({form:'SM-1',rev:'2026-09',S:{meta:{}}}),'SM-1_x.json','That file was saved by Form SM-1, not by Form TE-1. Nothing was changed.'],
      ['a case without TE-1',JSON.stringify({form:'CASE',rev:'2026-09',forms:{'TK-1':{snap:{own}}}}),'CASE_x.json','That case file holds no Form TE-1. Nothing was changed.'],
      ['junk','not a file at all','x.json','That file could not be read as a file Form TE-1 saved. Nothing was changed.']];
    for(const [nm,t,f,m] of T){await feed(p,t,f);const s=await st(p);ok('9 '+nm+': refused, S unchanged',s.msg===m&&!s.table&&(await sOf(p))===b0,s.msg);}
    const kase={form:'CASE',rev:'2026-09',saved:'2026-10-02T10:00:00Z',packet:{},forms:{'TE-1':{title:'Form TE-1',snap:{total:9,data:{},own:SIM}}}};
    await feed(p,JSON.stringify(kase),'CASE_Sam_2026-10-02.json');let s=await st(p);
    ok('9 a CASE json is accepted',s.table&&!s.msg&&s.lk.last.file==='CASE_Sam_2026-10-02.json',s);
    await p.evaluate(()=>nbhLink.leave());
    const html='<!doctype html><html><body><script type="application/json" id="nbh-case">'+JSON.stringify(Object.assign({id:'abc'},kase)).replace(/</g,'\\u003c')+'</'+'script></body></html>';
    await feed(p,html,'Sam.case.html');s=await st(p);
    ok('9 a .case.html is accepted',s.table&&!s.msg&&s.lk.last.file==='Sam.case.html',s);
    ok('9 Leave closes the table and writes nothing',await p.evaluate(()=>{const a=JSON.stringify(S);nbhLink.leave();return JSON.stringify(S)===a&&!nbhLink.state().table;}));
    /* the panel's file is not this book's own: the unsaved-work guard keeps a typed change unsaved */
    await p.evaluate(()=>{const i=document.querySelector('[data-m="bcba"]');i.value='A. Clinician';i.dispatchEvent(new Event('input',{bubbles:true}));});
    await feed(p,SIM,'TE-1_SIMULATED.json');await sleep(1100);
    ok('9 the guard: a typed change stays unsaved after the plan\'s file is opened in the panel',await p.evaluate(()=>nbhGuard.isDirty()));
    await p.evaluate(()=>nbhGuard.clean());await press(p,'sched','take');await apply(p);
    ok('9 the guard: a take is unsaved work',await p.evaluate(()=>nbhGuard.isDirty()));
    await p.close();}

  /* ---- 10. round trips ---- */
  {const p=await open(ctx,URL1,log);await sim(p);await p.evaluate(()=>{setView('setup');S.tokL[0]={k:'tk:heart',ph:'',l:''};S.meta.term='pic';renderAll();});await link(p);
    await feed(p,SIM,'TE-1_SIMULATED.json');await press(p,'card','keep');await apply(p);
    const lk0=await lkOf(p),S0=await sOf(p);
    ok('10 the board summary names the last token\'s own picture',JSON.parse(lk0).board.last==='Heart'&&JSON.parse(lk0).board.term==='pic',JSON.parse(lk0).board);
    const file=await saved(p);await p.evaluate(()=>{S=blank();renderAll();});await openData(p,file);
    ok('10 Save, then Open: meta.lk kept, and the whole record',(await lkOf(p))===lk0&&(await sOf(p))===S0);
    ok('10 ... the last token keeps its own picture (tk:heart, term pic)',await p.evaluate(()=>S.tokL[0].k==='tk:heart'&&S.meta.term==='pic'));
    ok('10 ... and the panel reads the record again (the card kept; the Choices and the schedule still to look at)',await p.evaluate(()=>nbhLink.state().on&&/^Linked with Form TE-1 · 2 items to look at · compared .+ with the file TE-1_SIMULATED\.json \(saved .+\)\.$/.test(nbhLink.state().status[0])),await p.evaluate(()=>nbhLink.state().status));
    await p.evaluate(()=>{const t=document.querySelector('#tkState'),v=JSON.stringify(S);S=blank();renderAll();t.value=v;t.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
    ok('10 restoreState(#tkState): meta.lk kept',(await lkOf(p))===lk0&&(await sOf(p))===S0);
    const junk=await p.evaluate(()=>['not json','{"v":2,"on":1}','x'.repeat(5000),'{"v":1,"on":"1"}','[1]','{"v":1,"on":1,"base":"x","board":7,"card":9,"last":{"when":"no"}}'].map(j=>{S.meta.lk=j;renderAll();
      const s=nbhLink.state();return {on:s.on,off:!document.querySelector('#lkPanel .lk-off').hidden,v:document.querySelector('#setupVerdict').textContent.includes('Linked')};}));
    ok('10 junk lk reads as off (or as a plain record), with no error',junk.slice(0,5).every(x=>!x.on&&x.off&&!x.v)&&junk[5].on,junk);
    await p.evaluate(()=>{delete S.meta.lk;renderAll();});
    /* the record stays at 1800 characters or less with six 40-character labels on each page and a long token name */
    await p.evaluate(()=>{const L=i=>('Label number '+i+' that runs to forty chars.').padEnd(40,'x').slice(0,40);for(let i=0;i<6;i++){S.ch[i].l=L(i);S.tg[i].l=L(10+i);}S.meta.tokname='T'.repeat(40);renderAll();});
    await link(p);await feed(p,SIM,'TE-1_'+'Long_file_name_'.repeat(6)+'.json');await press(p,'sched','take');await press(p,'card','keep');await press(p,'tok','keep');await apply(p);
    const big=await p.evaluate(()=>({len:S.meta.lk.length,r:NBHLink.readLk(S.meta.lk)}));
    ok('10 pack: '+big.len+' characters, 1800 or less, and still on',big.len<=1800&&big.r&&big.r.on===1&&big.r.board&&big.r.board.ch.length===6,{len:big.len});
    const back=await p.evaluate(()=>{const f=fromFile({form:'TK-1',S:JSON.parse(JSON.stringify(S))});return f.meta.lk===S.meta.lk;});
    ok('10 pack: the record survives fromFile\'s 2000-character cut',back);
    await p.close();}

  /* ---- 11. the schedule paragraph ---- */
  {const p=await open(ctx,URL1,log);await sim(p);await p.evaluate(()=>setView('setup'));await link(p);
    const paras=()=>p.evaluate(()=>String(S.txt.te).split(/\n[ \t]*\n\s*/).filter(x=>/^\*\*This book[’']s schedule/.test(x.trim())));
    await feed(p,SIM,'TE-1_SIMULATED.json');await only(p,[]);await tick(p,'sched');await apply(p);
    let ps=await paras();
    ok('11 after a take: exactly one schedule paragraph, the last one, with the plan\'s words',ps.length===1&&/\*\*This book’s schedule \(Form TE-1\):\*\* ten blocks placed earn one star\. The exchange: End of each independent work block, 5 min, at the desk; Under 10 s — the fifth star is handed over and the exchange begins immediately\.$/.test(ps[0])&&
      (await p.evaluate(()=>/\*\*This book’s schedule[^\n]*$/.test(S.txt.te))),ps);
    ok('11 the reprint line names the Token Economy back',/^Reprint: the Token Economy back page/.test(await p.evaluate(()=>document.querySelector('#lkPanel .lk-rp').textContent)));
    ok('11 the back prints it, in bold words then the text',await p.evaluate(()=>{const b=[...document.querySelectorAll('#book .pg[data-kind="tk"][data-side="back"]')];return !!b.length&&/This book’s schedule \(Form TE-1\): ten blocks placed earn one star\./.test(b.map(e=>e.textContent).join(' '))&&b.some(x=>[...x.querySelectorAll('b')].some(e=>e.textContent==='This book’s schedule (Form TE-1):'));}));
    const fit=await p.evaluate(()=>({contd:document.querySelectorAll('#book .pg.contd').length,fs:[...document.querySelectorAll('#book .pg.back .bbody')].map(e=>parseFloat(getComputedStyle(e).fontSize)*72/96)}));
    ok('11 the backs still print at 11 pt or more ('+fit.contd+' continuation page'+(fit.contd===1?'':'s')+')',fit.fs.every(x=>x>=10.99),fit);
    let R=await rows(p);ok('11 in step after the take',R.sched.st===1,R.sched);
    await feed(p,PLAN(S=>{S.meta.tp='FR 8 — eight {blocks} placed *earn* one_star';S.meta.exDelay='';}),'TE-1_tp.json');R=await rows(p);
    ok('11 changed on the plan: "changed on Form TE-1", ticked',R.sched.st===5&&R.sched.pressed==='take',R.sched);
    await apply(p);ps=await paras();
    ok('11 a second take replaces it: still one paragraph, the new words, no markup from the plan',ps.length===1&&/\*\*This book’s schedule \(Form TE-1\):\*\* eight blocks placed earn onestar\. The exchange: End of each independent work block, 5 min, at the desk\.$/.test(ps[0]),ps);
    await feed(p,PLAN(S=>{S.meta.tp='FR 3';S.meta.tpN='3';}),'TE-1_tpN.json');await apply(p);ps=await paras();
    ok('11 a plan with only a number: "every 3 responses earn one {token}", which prints the token\'s name',ps.length===1&&/:\*\* every 3 responses earn one \{token\}\. The exchange:/.test(ps[0])&&
      await p.evaluate(()=>/every 3 responses earn one star\./.test([...document.querySelectorAll('#book .pg[data-kind="tk"][data-side="back"]')].map(e=>e.textContent).join(' '))),ps);
    await p.evaluate(()=>setView('backs'));await sleep(200);
    ok('11 the Backs view and the book never show "{"',await p.evaluate(()=>!/[{}]/.test(document.querySelector('#bkOut').innerText)&&!/[{}]/.test(document.querySelector('#book').textContent)));
    await p.close();}

  /* ---- the token ---- */
  {const p=await open(ctx,URL1,log);await link(p);
    await feed(p,PLAN(S=>{S.meta.tokForm='Gold coins in a cup on the desk';}),'TE-1_coin.json');let R=await rows(p);
    ok('tok: a drawn token named on the plan: "different", Take offered and not ticked',R.tok.st===7&&R.tok.take&&R.tok.pressed==='',R.tok);
    await only(p,[]);await tick(p,'tok');await apply(p);
    ok('tok: Take puts the coin on the board, the first caption follows it',await p.evaluate(()=>S.tok[0].k==='tk:coin'&&S.caps[0].b==='Your First Coin!'&&tokName()==='Coin'));
    await feed(p,PLAN(S=>{S.meta.tokForm='Points on a laminated card, initialled by the aide';}),'TE-1_pts.json');R=await rows(p);
    ok('tok: a token form naming no drawn token: Keep only, with the reason',!R.tok.take&&R.tok.keep&&(await noteOf(p,'tok')).some(t=>/names none of the tokens this book draws/.test(t)),R.tok);
    await feed(p,PLAN(S=>{S.meta.tokForm='';}),'TE-1_none.json');R=await rows(p);
    ok('tok: no token form on the plan: "only here", Form TE-1 can take it',R.tok.st===2&&/Form TE-1 can take this when it compares/.test(R.tok.label),R.tok);
    await p.close();}

  /* ---- pictures of the panel, and phone width ---- */
  {const plan=PLAN();
    for(const [w,h] of [[820,1180],[1180,820],[390,844]]){
      const c2=await br.newContext({viewport:{width:w,height:h}});const p=await open(c2,URL1,log);await sim(p);
      await p.evaluate(()=>{setView('setup');S.ch[3]=cello();S.ch[4]=cello();renderAll();});
      await shot(p,'tk1-off-'+w+'x'+h+'.png');
      await link(p);await shot(p,'tk1-on-'+w+'x'+h+'.png');
      await feed(p,plan,'TE-1_SIMULATED_2026-10-03.json');await p.evaluate(()=>nbhLink.press('sched','take'));
      const W=await wide(p);ok('20 '+w+' x '+h+': no sideways page scroll with the table open',W.doc<=W.w+1&&W.panel<=W.pc+1,W);
      await shot(p,'tk1-compare-'+w+'x'+h+'.png');
      await apply(p);const W2=await wide(p);ok('20 '+w+' x '+h+': none after Apply',W2.doc<=W2.w+1&&W2.panel<=W2.pc+1,W2);
      await shot(p,'tk1-applied-'+w+'x'+h+'.png');
      await c2.close();}}

  /* ---- the workstation: 15, 18, 19 ---- */
  {const c3=await br.newContext({viewport:{width:1440,height:900}});await c3.addInitScript(()=>{window.print=function(){};});
    const sh=await c3.newPage();const slog=[];wire(sh,slog);
    await sh.goto(BASE+'/NBH-Workstation/index.html');await sh.waitForFunction(()=>typeof openForm==='function');await sleep(700);
    await sh.evaluate(()=>{window.alert=()=>{};});
    const frameOf=file=>sh.frames().find(f=>f.url().includes(file));
    const openF=async(id,file)=>{await sh.evaluate(i=>openForm(i),id);await sh.waitForFunction(i=>!!state.status[i],id,{timeout:20000});await sleep(1300);const f=frameOf(file);await f.evaluate(()=>{window.confirm=()=>true;});return f;};
    const te=await openF('TE-1',TEF);await te.evaluate(async()=>{await loadSim();});await sleep(300);
    const tk=await openF('TK-1',TKF);await tk.evaluate(async()=>{await loadSim();});await sleep(300);await tk.evaluate(()=>setView('setup'));
    const teS0=await te.evaluate(()=>JSON.stringify(S));
    const n0=await sh.evaluate(()=>(state.relayLog||[]).length);
    /* 15: Link turns the link on and compares straight away, through the relay */
    await tk.evaluate(()=>document.querySelector('#lkPanel [data-lk="on"]').click());
    await tk.waitForFunction(()=>nbhLink.state().table,null,{timeout:15000}).catch(()=>{});
    const ts=await tk.evaluate(()=>nbhLink.state()),lg=await sh.evaluate(k=>(state.relayLog||[]).slice(k),n0);
    ok('15 Link in the workstation compares at once: the table, via the shell',ts.table&&ts.lk.last.via==='shell',ts);
    ok('15 relayLog: TK-1 asked for TE-1 and was answered',lg.some(x=>x.from==='TK-1'&&x.want==='TE-1'&&x.did==='answered'),lg);
    ok('15 TE-1\'s S is unchanged by the read',(await te.evaluate(()=>JSON.stringify(S)))===teS0);
    ok('15 the status says the Form TE-1 open in this workstation',/compared .+ with the Form TE-1 open in this workstation\./.test(ts.status[0])||/to look at below\./.test(ts.status[0]),ts.status);
    ok('15 framed: Compare and Open beside shown, the new-tab link hidden',await tk.evaluate(()=>{const q=s=>document.querySelector('#lkPanel '+s);return !q('[data-lk="compare"]').hidden&&!q('[data-lk="beside"]').hidden&&q('.lk-sib').hidden;}));
    const R15=await tk.evaluate(()=>{const o={};nbhLink.rows().forEach(r=>{o[r.key]=r.st;});return o;});
    ok('15 the two simulations: the student, the count and the token in step',R15.who===1&&R15.n===1&&R15.tok===1,R15);
    /* 18: spoofed answers */
    const forged=JSON.stringify({form:'TE-1',rev:'2026-09',saved:'x',S:{meta:{client:'Forged',beh:'Forged',epN:'9',tokForm:'coins'},bk:[{n:'Forged backup'}],thin:[],aud:{}}});
    await tk.evaluate(()=>nbhLink.leave());
    const tkS0=await tk.evaluate(()=>JSON.stringify(S)),ig0=await tk.evaluate(()=>nbhLink.ignored());
    await te.evaluate(f=>{const w=[...parent.document.querySelectorAll('iframe')].find(x=>/TK-1_/.test(x.src)).contentWindow;w.postMessage({nbh:'answer',want:'TE-1',ok:true,title:'x',snap:{total:1,data:{},own:f}},'*');},forged);await sleep(300);
    await sh.evaluate(f=>{state.frames['TK-1'].contentWindow.postMessage({nbh:'answer',want:'TE-1',ok:true,title:'x',snap:{total:1,data:{},own:f}},'*');},forged);await sleep(300);
    const s18=await tk.evaluate(()=>({ig:nbhLink.ignored(),table:nbhLink.state().table,S:JSON.stringify(S)}));
    ok('18 an answer from the sibling frame and one from the shell while not waiting: both ignored and counted, nothing changed',s18.ig===ig0+2&&!s18.table&&s18.S===tkS0,{ig0,s18:{ig:s18.ig,table:s18.table}});
    /* while waiting: a forged answer from the sibling is ignored, and the real one is taken */
    await tk.evaluate(()=>nbhLink.compare());
    await te.evaluate(f=>{const w=[...parent.document.querySelectorAll('iframe')].find(x=>/TK-1_/.test(x.src)).contentWindow;w.postMessage({nbh:'answer',want:'TE-1',ok:true,title:'x',snap:{total:1,data:{},own:f}},'*');},forged);
    await tk.waitForFunction(()=>nbhLink.state().table,null,{timeout:15000}).catch(()=>{});
    const s18b=await tk.evaluate(()=>({ig:nbhLink.ignored(),rows:nbhLink.rows().map(r=>r.there).join('|')}));
    ok('18 while waiting: the sibling\'s answer ignored, the real one read',s18b.ig===ig0+3&&!/Forged/.test(s18b.rows)&&/Tablet, video clips/.test(s18b.rows),s18b);
    /* 19: both forms linked; Save case, Open case and the autosave keep both records */
    await tk.evaluate(()=>{const r=nbhLink.rows().find(x=>x.key==='card');if(r&&r.keep)nbhLink.press('card','keep');});await tk.evaluate(()=>nbhLink.apply());await sleep(400);
    await te.evaluate(()=>document.querySelector('#lkPanel [data-lk="on"]').click());
    await te.waitForFunction(()=>nbhLink.state().table,null,{timeout:15000}).catch(()=>{});
    const lkTK=await tk.evaluate(()=>S.meta.lk),lkTE=await te.evaluate(()=>S.meta.lk||'');
    ok('19 both forms hold a link record (TE-1 read TK-1\'s board through the relay)',NBHLink_on(lkTK)&&NBHLink_on(lkTE)&&JSON.parse(lkTE).board&&JSON.parse(lkTE).board.ch[0]==='Tablet',{tk:lkTK.slice(0,80),te:lkTE.slice(0,200)});
    await sh.evaluate(()=>{document.querySelector('#pClient').value='SIMULATED – Sample Student';});
    const caseText=await sh.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{URL.createObjectURL=o;b.text().then(res);return o.call(URL,b);};document.querySelector('#saveCase').click();}));
    const kase=JSON.parse(caseText),ownTK=JSON.parse(kase.forms['TK-1'].snap.own),ownTE=JSON.parse(kase.forms['TE-1'].snap.own);
    ok('19 Save case: both link records are in the case file',ownTK.S.meta.lk===lkTK&&ownTE.S.meta.lk===lkTE&&JSON.parse(kase.forms['TK-1'].snap.data['#tkState']).meta.lk===lkTK);
    await sh.evaluate(async t=>{state.restoring=true;try{await loadCase(JSON.parse(t),'file');}finally{state.restoring=false;}},caseText);await sleep(1500);
    let tk2=frameOf(TKF),te2=frameOf(TEF);
    ok('19 Open case: both link records come back',(await tk2.evaluate(()=>S.meta.lk))===lkTK&&(await te2.evaluate(()=>S.meta.lk))===lkTE);
    ok('19 Open case: the panels read them',await tk2.evaluate(()=>nbhLink.state().on&&!nbhLink.state().table)&&await te2.evaluate(()=>nbhLink.state().on));
    await sh.evaluate(()=>{state.autoSig='';});await sh.evaluate(async()=>{await autoSave();});
    const auto=await sh.evaluate(()=>localStorage.getItem(AUTO.key));
    ok('19 the autosave holds both records',!!auto&&JSON.parse(JSON.parse(auto).forms['TK-1'].snap.own).S.meta.lk===lkTK&&JSON.parse(JSON.parse(auto).forms['TE-1'].snap.own).S.meta.lk===lkTE);
    await sh.evaluate(async t=>{state.restoring=true;try{await loadCase(JSON.parse(t),'autosave');}finally{state.restoring=false;}},auto);await sleep(1500);
    tk2=frameOf(TKF);te2=frameOf(TEF);
    ok('19 an autosave restore brings both back',(await tk2.evaluate(()=>S.meta.lk))===lkTK&&(await te2.evaluate(()=>S.meta.lk))===lkTE);
    /* a Keep is a change the case notices: TK-1's status signature moves */
    await tk2.evaluate(()=>{window.confirm=()=>true;});
    const sigOf=async()=>{await sh.evaluate(()=>{Object.values(state.frames).forEach(fr=>ask(fr,'status'));});await sleep(500);return sh.evaluate(()=>caseSig());};
    const sig0=await sigOf();
    await tk2.evaluate(()=>nbhLink.compare());await tk2.waitForFunction(()=>nbhLink.state().table,null,{timeout:15000}).catch(()=>{});
    await tk2.evaluate(()=>{const r=nbhLink.rows().find(x=>x.keep&&x.pressed!=='keep'&&x.st!==4);if(r)nbhLink.press(r.key,'keep');});const kr=await tk2.evaluate(()=>nbhLink.apply());await sleep(400);
    const sig1=await sigOf();
    ok('19 a Keep in TK-1 changes the case\'s signature',kr&&kr.kept>=1&&sig1!==sig0,{kr,sig0,sig1});
    const ws=await sh.evaluate(()=>({doc:document.documentElement.scrollWidth,w:innerWidth}));ok('shell: no sideways scroll',ws.doc<=ws.w+1,ws);
    const se=slog.filter(l=>l.type==='pageerror'||(l.type==='error'&&!/Failed to load resource: the server responded with a status of 404/.test(l.text)));
    ok('shell: no console errors',!se.length,se);
    await c3.close();}

  const errs=log.filter(l=>!/Failed to load resource: the server responded with a status of 404/.test(l.text)&&l.type!=='warning');
  ok('no console errors',!errs.length,errs);
  await br.close();
  console.log(out.join('\n'));console.log(fails?fails+' FAILED':'ALL OK ('+out.length+' checks)');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
function NBHLink_on(s){try{const o=JSON.parse(s);return !!o&&o.v===1&&o.on===1;}catch(e){return false;}}
