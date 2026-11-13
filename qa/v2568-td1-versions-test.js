/* v25.68 (the BCBA, 11/6) Form TD-1: versions from the studies on a bank card, the high-p video, the BIP quality check.
   On an iPad Pro sideways (1376 x 1032, touch), with Chromium:
   A. the bank: the 36 high-probability request sequence cards (A_HIGHP) carry cmp, their comparison rows, each quoted value
      a sentence of the card's own steps; no other card carries it; no other field of theirs is new
      (v25.72: 33 cards, then Planer et al., 2018, and Trejo & Fryling, 2018; both show the first video, so 12 became 14);
   B. the versions bar: on a card of every component (each has two or more cards) one chip per card, oldest first, in a list of
      buttons with aria-current; the card opened marked "started here"; filters shown only when they match a card of that
      component, each narrowing the chips; a chip shows its card and keeps the one it started from; What's different with
      row headers, the rows that differ shaded, the quoted step under each value; for another component the bank's own rows
      and the note that the detailed rows are written for the high-p sequence so far; Start from this version; Side by side
      in two columns with the steps lined up (one column under 1000 px), Add this version to the plan adding the card exactly
      as Add to the plan does; the keyboard (Enter on a chip, the arrow keys); nothing of it saved;
   C. the video: Watch the video on all 36 cards, with the line computed from the card's rows as the approved mockup does;
      the file loaded only when asked, played from the device (2:49, 1080p since v25.75); the player's note; the FCT video as it was;
      the plan cards built from an A_HIGHP card (from the bank or the menu) carry the button and the line, nothing saved,
      nothing printed; the offline copy's list finds the file through the loadScript pattern;
   D. the quality check on the Final plan sheet: the eight items of research #14 in order, each met / not met / not
      applicable with the place to fix it (an empty form: none met; the simulation: all but team communication; filled in:
      all met; a replacement already in the repertoire with no teaching planned: teaching not applicable); the Go to buttons;
      a line before "Adopted by the team"; never blocking Copy for the BIP or Print; not printed, not copied, not saved;
   E. touch targets of 44 px; no page errors;
   F. (the BCBA, 11/6) four more versions: each high-p card shows the closest video (praise only for the 18 cards that praise
      each easy request, the class, seatwork and peer videos for their own cards, the first video for the other 14); the
      card a video was made from says so; each file loaded only when asked and played from the device.
   usage: WS_URL=http://127.0.0.1:8640 WS_ROOT=. node qa/v2568-td1-versions-test.js */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
const DIR=path.join(ROOT,'NBH-Workstation');const file=pre=>fs.readdirSync(DIR).find(f=>f.startsWith(pre));
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,700)));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* the bank, read here on its own */
const bsrc=fs.readFileSync(path.join(DIR,'nbh-td1-bank.js'),'utf8');const bctx={};vm.createContext(bctx);vm.runInContext(bsrc.replace('const TD1_BANK=','this.TD1_BANK='),bctx);const BANK=bctx.TD1_BANK;
const HP=BANK.protocols.filter(p=>p.code==='A_HIGHP');
const ROWK=['n_easy','spacing','easy_reinforcer','to_hard','missed_easy','hard_reinforcer','extinction','order','fading','who'];
/* what the video shows (TD-1's own A_HIGHP steps) and the mockup's line */
const VS={spacing:'1–3 s',easy_reinforcer:'Praise and a small edible',to_hard:'Within 3 s',missed_easy:'Wait 30 s, start a new sequence',summary:'3 easy requests 1–3 s apart, praise and a snack after each, the hard request within 3 s, a 30-s restart after a missed one'};
const LAB={spacing:'Time between them',easy_reinforcer:'After each easy one',to_hard:'The hard request comes',missed_easy:'If an easy one is missed'};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const vline=c=>{const dd=Object.keys(LAB).filter(k=>norm(c[k])!==norm(VS[k])&&!/^not stated/i.test(c[k]||'')).map(k=>LAB[k].toLowerCase()+': '+c[k]);
 return 'The video shows TD-1’s steps for this card: '+VS.summary+'. '+(dd.length?'This version differs in '+dd.join('; ')+'.':'This version matches it on timing and reinforcers.');};
/* (F) the four more versions: the card each was made from, the version named, and the cards that show it */
const PRAISE=['a_highp-momentum-cooperation','a_highp-medium-p-substitute','a_highp-orienting-dtt','a_highp-momentum-compliance','a_highp-household','a_highp-interspersed-requests','a_highp-multiple-adults','a_highp-with-escape-extinction','a_highp-peer-social-initiations','a_highp-fade-sequence-do-requests','a_highp-short-5s-interval','a_highp-escape-extinction-instruction-pace','a_highp-four-quick-requests','a_highp-higher-quality-reinforcer','a_highp-medical-hold-still','a_highp-before-giving-up-toy','a_highp-medical-exam-requests','a_highp-varied-order-sequence','a_highp-medium-p-sequences-work-as-well-residential'];
const XV={a_highp_praise:{src:'a_highp-momentum-cooperation',after:'Wilder, Sheppard, et al. (2025)',file:'nbh-td1-video-highp-praise.js',dur:105.9,cards:PRAISE},
 a_highp_class:{src:'a_highp-group-transition-fading',after:'Ardoin et al. (1999)',file:'nbh-td1-video-highp-class.js',dur:86.4,cards:['a_highp-group-transition-fading']},
 a_highp_seatwork:{src:'a_highp-math-seatwork-start',after:'Wehby & Hollahan (2000)',file:'nbh-td1-video-highp-seatwork.js',dur:88.7,cards:['a_highp-math-seatwork-start']},
 a_highp_peer:{src:'a_highp-variant-peer-requests',after:'Davis & Reichle (1996)',file:'nbh-td1-video-highp-peer.js',dur:82.6,cards:['a_highp-variant-peer-requests']}};
const keyFor=id=>Object.keys(XV).find(k=>XV[k].cards.includes(id))||'a_highp';
const xline=(p,shows)=>{const k=keyFor(p.id);if(k==='a_highp')return vline(p.cmp);const x=XV[k],S=shows[k],c=p.cmp;if(p.id===x.src)return 'The video shows this card’s steps: '+S.summary+'.';
 const dd=Object.keys(LAB).filter(r=>norm(c[r])!==norm(S[r])&&!/^not stated/i.test(c[r]||'')).map(r=>LAB[r].toLowerCase()+': '+c[r]);
 return 'The video shows the closest version, after '+x.after+': '+S.summary+'. '+(dd.length?'This version differs in '+dd.join('; ')+'.':'This version matches it on timing and reinforcers.');};
/* what each of the four shows: the card it was made from, its own rows */
const SHOWS={};Object.keys(XV).forEach(k=>{const c=HP.find(h=>h.id===XV[k].src).cmp;SHOWS[k]={spacing:c.spacing,easy_reinforcer:c.easy_reinforcer,to_hard:c.to_hard,missed_easy:c.missed_easy}});
SHOWS.a_highp_praise.summary='3 easy requests 1–2 s apart, brief praise only after each, the hard request 1–2 s after the last, nothing said if it is not done, a 15-s restart from the first after a missed one';
SHOWS.a_highp_class.summary='3 easy instructions to the whole class at most 5 s apart, the transition within 5 s, praise for named students and the class, then faded to 1';
SHOWS.a_highp_seatwork.summary='3 math requests beside the desk, each within 10 s, praise for each, the seatwork request within 10 s of the third, another request when one is not followed';
SHOWS.a_highp_peer.summary='a classmate gives 3 easy play requests with a play comment after each, the social request within 5 s of the third, a new sequence about 30 s after a missed one';
(async()=>{
 /* ---------------- A. the bank ---------------- */
 {const shape=HP.every(p=>p.cmp&&ROWK.every(k=>typeof p.cmp[k]==='string'&&p.cmp[k])&&p.cmp.cite&&+p.cmp.year>1900&&typeof p.cmp.special==='string'&&p.cmp.quotes&&typeof p.cmp.quotes==='object');
  const qbad=[];HP.forEach(p=>Object.entries(p.cmp.quotes||{}).forEach(([k,q])=>{if(q&&!(p.steps||[]).includes(q))qbad.push(p.id+':'+k);}));
  const others=BANK.protocols.filter(p=>p.code!=='A_HIGHP'&&'cmp' in p).map(p=>p.id);
  const KEYS=new Set(['id','code','lab','fn','beh','age','kw','params','steps','data','mat','result','note','src','ta','ta_note','vol','scenes','cmp']);
  const extra=HP.filter(p=>Object.keys(p).some(k=>!KEYS.has(k))).map(p=>p.id);
  ok('A the 36 high-p cards carry cmp (10 rows, the study, its year, what is special, the quoted steps) (v25.72: 33, then Planer et al., 2018, and Trejo & Fryling, 2018; v25.79: Romano & Roll, 2000)',HP.length===36&&shape,{n:HP.length});
  ok('A every quoted value is a sentence of the card’s own steps; no other card carries cmp; no other new field',!qbad.length&&!others.length&&!extra.length,{qbad,others:others.slice(0,4),extra});}
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const errs=[];
 const ctxOf=(w,h)=>b.newContext({viewport:{width:w||1376,height:h||1032},hasTouch:true,isMobile:true,deviceScaleFactor:1,userAgent:IPAD});
 async function open(w,h){const ctx=await ctxOf(w,h);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(URL+file('TD-1_'));await p.waitForFunction(()=>window.__tdBank&&window.__tdVideo&&window.__tdQc,null,{timeout:30000});await sleep(800);
  await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.nbhUI.confirm=async()=>true;});return {ctx,p};}
 const view=(p,v)=>p.evaluate(v=>{const x=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(x)x.click();},v);
 const D='document.getElementById("tdBankHost").shadowRoot.querySelector(".detail")';
 const det=(p,f)=>p.evaluate(new Function('return ('+f+')('+D+')'));
 let {ctx,p}=await open();
 await view(p,'build');await sleep(300);
 /* ---------------- B. the versions bar ---------------- */
 const BASE='a_highp-varied-order-sequence',PICK='a_highp-momentum-compliance';
 {const r=await p.evaluate(()=>{const P=TD1_BANK.protocols.filter(x=>window.__tdLibOf(x.code)),by={};P.forEach(x=>{(by[x.code]=by[x.code]||[]).push(x.id);});const out=[];
   Object.keys(by).forEach(c=>{window.__tdBank.show(by[c][0]);const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');out.push([c,by[c].length,d.querySelectorAll('.vers .vchip').length]);});return out;});
  ok('B every component has two or more cards, and a card of each shows the bar with one chip per card',r.length>=60&&r.every(x=>x[1]>=2&&x[2]===x[1]),r.filter(x=>x[2]!==x[1]).slice(0,5));}
 await p.evaluate(id=>window.__tdBank.show(id),BASE);await sleep(200);
 {const r=await det(p,d=>{const ch=[...d.querySelectorAll('.vchip')];const by={};TD1_BANK.protocols.forEach(x=>by[x.id]=x);
   return {n:ch.length,years:ch.map(c=>+by[c.dataset.v].cmp.year),list:!!d.querySelector('ul.vchips>li>button.vchip'),lis:d.querySelectorAll('ul.vchips>li').length,
    cur:ch.filter(c=>c.getAttribute('aria-current')==='true').map(c=>c.dataset.v),base:ch.filter(c=>/started here/.test(c.textContent)).map(c=>c.dataset.v),
    under:(()=>{const h=d.querySelector('h4'),v=d.querySelector('.vers');return !!(h&&v&&(h.compareDocumentPosition(v)&Node.DOCUMENT_POSITION_FOLLOWING));})(),
    cites:ch.slice(0,2).map(c=>c.querySelector('.vc').textContent+' / '+c.querySelector('.vs').textContent)};});
  ok('B the high-p card: 36 chips (v25.79), oldest first, a list of buttons; the card opened marked "started here" and aria-current, under the title',r.n===36&&r.years.every((y,i)=>!i||y>=r.years[i-1])&&r.list&&r.lis===36&&r.cur.length===1&&r.cur[0]===BASE&&r.base.length===1&&r.base[0]===BASE&&r.under,r);
  ok('B a chip names the study and a short line of what is special',/Mace et al\., 1988/.test(r.cites[0])&&/'don't' requests/.test(r.cites[0]),r.cites);}
 /* filters */
 {const r=await p.evaluate(([base])=>{const R=document.getElementById('tdBankHost').shadowRoot,d=()=>R.querySelector('.detail');const by={};TD1_BANK.protocols.forEach(x=>by[x.id]=x);
   const labs=[...d().querySelectorAll('.vf')].map(x=>x.textContent);const res={labs,group:d().querySelector('.vfil').getAttribute('role')};
   const food=d().querySelector('.vf[data-vf="food"]');food.click();const ids=[...d().querySelectorAll('.vchip')].map(c=>c.dataset.v);
   res.food=ids.filter(i=>i!==base).every(i=>/food|bite|feed|meal/i.test(by[i].cmp.who+' '+by[i].cmp.special+' '+by[i].lab));res.foodN=ids.length;res.pressed=d().querySelector('.vf[data-vf="food"]').getAttribute('aria-pressed');res.cnt=d().querySelector('.vcnt').textContent;res.base=ids.includes(base);
   d().querySelector('.vf[data-vf="praise"]').click();res.praise=[...d().querySelectorAll('.vchip')].map(c=>c.dataset.v).filter(i=>i!==base).every(i=>/praise/i.test(by[i].cmp.easy_reinforcer)&&!/edible|item|snack|treat|food|video/i.test(by[i].cmp.easy_reinforcer));
   d().querySelector('.vf[data-vf="all"]').click();res.all=d().querySelectorAll('.vchip').length;
   window.__tdBank.show('fct-practical-guide-thinning');res.fct=[...d().querySelectorAll('.vf')].map(x=>x.textContent);window.__tdBank.show(base);return res;},[BASE]);
  ok('B the filters: all six for the high-p cards, a group of toggle buttons; Feeding and Praise only narrow the chips (the card opened stays); All brings them back',r.labs.join('|')==='All|Escape-maintained|Snack or item after each|Praise only|School or classroom|Feeding'&&r.group==='group'&&r.food&&r.foodN>=4&&r.foodN<36&&r.pressed==='true'&&r.base&&/of 36 shown/.test(r.cnt)&&r.praise&&r.all===36,r);   /* v25.79: 36 cards */
  ok('B a filter that matches no card of a component is not shown (FCT: no snack or praise-only filter)',!r.fct.includes('Snack or item after each')&&!r.fct.includes('Praise only')&&r.fct.includes('All'),r.fct);}
 /* a chip */
 await p.evaluate(id=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');d.querySelector('.vchip[data-v="'+id+'"]').click();},PICK);await sleep(200);
 {const r=await det(p,d=>({title:d.querySelector('h4').textContent,cur:(d.querySelector('.vchip[aria-current="true"]')||{}).dataset,base:[...d.querySelectorAll('.vchip')].filter(c=>/started here/.test(c.textContent)).map(c=>c.dataset.v),
   head:d.querySelector('.vdiff .vh').textContent,rowh:d.querySelectorAll('.vtab tbody th[scope="row"]').length,colh:[...d.querySelectorAll('.vtab thead th[scope="col"]')].map(x=>x.textContent),shaded:d.querySelectorAll('.vtab tr.vd').length,
   q:d.querySelectorAll('.vtab .vq').length,qtxt:(d.querySelector('.vtab tr.vd td.vcur .vq')||{}).textContent||'',focus:(d.getRootNode().activeElement||{}).dataset,add:(d.querySelector('.load')||{}).dataset}));
  const pk=HP.find(x=>x.id===PICK),bs=HP.find(x=>x.id===BASE),nd=ROWK.filter(k=>norm(pk.cmp[k])!==norm(bs.cmp[k])).length;
  ok('B a chip shows its card (Add to the plan then adds that one) and keeps the card it started from',r.title===pk.lab&&r.cur&&r.cur.v===PICK&&r.base.length===1&&r.base[0]===BASE&&r.add&&r.add.id===PICK,r);
  ok('B What’s different: a row header for each of the 10 rows, the two studies as column headers, the differing rows shaded, the quoted step under each value',r.rowh===10&&r.colh.length===2&&/Lemons & Wilder, 2026/.test(r.colh[0])&&/Mace et al\., 1988/.test(r.colh[1])&&r.shaded===nd&&r.head==='What’s different ('+nd+' of 10 rows)'&&r.q>=6&&/^“.+”$/.test(r.qtxt),r);
  ok('B the keyboard focus stays on the chip that was used',r.focus&&r.focus.v===PICK,r.focus);}
 /* another component: the bank's own rows and the note */
 {const r=await p.evaluate(()=>{const P=TD1_BANK.protocols.filter(x=>x.code==='FCT');window.__tdBank.show(P[0].id);window.__tdBank.pick(P[1].id);const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');
   const rows=[...d.querySelectorAll('.vtab tbody th')].map(x=>x.textContent.replace(/ ●.*$/,'').replace(/ \(differs\)$/,''));const L=window.__tdLibOf('FCT').params.map(x=>x[0]);
   return {rows,L,note:d.querySelector('.vsame').textContent};});
  const prm=r.rows.slice(0,-4);
  ok('B another component: the card’s settings, the study, In the study, ages and function, and the note that the detailed rows are written for the high-p sequence so far',prm.every(k=>r.L.includes(k))&&r.rows.slice(-4).join('|')==='The study|In the study|Ages|Function'&&/The detailed comparison rows are written for the high-probability request sequence so far\./.test(r.note),r);}
 /* Start from this version */
 await p.evaluate(([a,c])=>{window.__tdBank.show(a);window.__tdBank.pick(c);},[BASE,PICK]);await sleep(100);
 {const r=await p.evaluate(()=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');const s0=[d.querySelector('.vsbs').disabled,d.querySelector('.vre').disabled];d.querySelector('.vre').click();
   const st=window.__tdBank.state();return {s0,st,s1:[d.querySelector('.vsbs').disabled,d.querySelector('.vre').disabled],base:[...d.querySelectorAll('.vchip')].filter(c=>/started here/.test(c.textContent)).map(c=>c.dataset.v),head:d.querySelector('.vdiff .vh').textContent};});
  ok('B Start from this version: the card shown becomes "started here"; Side by side and Start wait for another pick',!r.s0[0]&&!r.s0[1]&&r.st.base===PICK&&r.base[0]===PICK&&r.s1[0]&&r.s1[1]&&r.head==='This version at a glance',r);}
 /* keyboard on the chips */
 {await p.evaluate(()=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');d.querySelector('.vchip').focus();});
  await p.keyboard.press('ArrowRight');const f1=await det(p,d=>(d.getRootNode().activeElement||{}).dataset.v);await p.keyboard.press('Enter');await sleep(200);
  const r=await det(p,d=>({cur:(d.querySelector('.vchip[aria-current="true"]')||{}).dataset.v,focus:(d.getRootNode().activeElement||{}).dataset.v,second:[...d.querySelectorAll('.vchip')][1].dataset.v}));
  ok('B the keyboard: Right moves along the chips, Enter shows that version, the focus stays on it',f1===r.second&&r.cur===r.second&&r.focus===r.second,{f1,r});}
 /* side by side, wide */
 await p.evaluate(([a,c])=>{window.__tdBank.show(a);window.__tdBank.pick(c);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vsbs').click();},[BASE,PICK]);await sleep(300);
 {const r=await det(p,d=>{const P=[...d.querySelectorAll('.vpane')].map(x=>x.getBoundingClientRect());const L=[...d.querySelectorAll('.vpane')].map(x=>[...x.querySelectorAll('ol.vsteps li')].map(l=>Math.round(l.getBoundingClientRect().top)));
   const H=[...d.querySelectorAll('.vpane')].map(x=>Math.round(x.querySelectorAll(':scope>div')[3].getBoundingClientRect().top));
   return {n:P.length,side:P.length===2&&P[1].left>P[0].right-1&&Math.abs(P[0].top-P[1].top)<2,L,H,adds:[...d.querySelectorAll('.vpane .load button.add')].map(x=>x.textContent),ids:[...d.querySelectorAll('.vpane .load')].map(x=>x.dataset.id),pressed:d.querySelector('.vsbs').getAttribute('aria-pressed'),
    lab:[...d.querySelectorAll('.vpane .vcolhd')].map(x=>x.textContent),vid:d.querySelectorAll('.vpane button.vid').length,lines:d.querySelectorAll('.vpane .vidln').length};});
  const k=Math.min(r.L[0].length,r.L[1].length);
  ok('B Side by side on the iPad sideways: two columns, Started from and This version, each with Add this version to the plan and Watch the video',r.n===2&&r.side&&r.pressed==='true'&&r.lab.join('|')==='Started from|This version'&&r.adds.join('|')==='Add this version to the plan|Add this version to the plan'&&r.ids.join('|')===BASE+'|'+PICK&&r.vid===2&&r.lines===2,r);
  ok('B the two columns line up: the settings and each step start at the same height in both',k>=5&&r.L[0].slice(0,k).every((t,i)=>Math.abs(t-r.L[1][i])<2)&&Math.abs(r.H[0]-r.H[1])<2,{L:r.L,H:r.H});}
 /* Add this version to the plan (the right column) adds the card exactly as Add to the plan */
 const cardOf=()=>{const c=[...document.querySelectorAll('#compWrap .card')].pop();if(!c)return null;const i=c.dataset.i,o={code:c.dataset.code};
  [...c.querySelectorAll('[name^="cp['+i+']."]')].forEach(e=>{o[e.name.replace(/^cp\[\d+\]\./,'')]=e.value;});return o;};
 const before=await p.evaluate(()=>JSON.stringify(window.__tdCollect().fields));
 await p.evaluate(()=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');d.querySelectorAll('.vpane')[1].querySelector('button.add').click();});await sleep(700);
 const viaCol=await p.evaluate(cardOf),stCol=await det(p,d=>{const s=d.querySelectorAll('.vpane')[1].querySelector('.st');return s&&!s.hidden?s.textContent:'';});
 /* nothing of the bar saved: the fields are the same apart from the new card's */
 {const after=await p.evaluate(()=>window.__tdCollect().fields);const was=JSON.parse(before);const diff=Object.keys(after).filter(k=>after[k]!==was[k]&&!/^cp\[\d+\]\./.test(k));
  ok('B the versions bar, its filters and Side by side save nothing (only the card added changes the fields)',!diff.length,diff.slice(0,6));}
 await ctx.close();
 ({ctx,p}=await open());await view(p,'build');await sleep(300);
 await p.evaluate(id=>{window.__tdBank.show(id);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.add').click();},PICK);await sleep(700);
 const viaAdd=await p.evaluate(cardOf);
 ok('B Add this version to the plan adds that card exactly as Add to the plan does (steps, settings, data, materials, the study), and says so in its column',!!viaCol&&viaCol.bank===PICK&&JSON.stringify(viaCol)===JSON.stringify(viaAdd)&&/^Added to the plan: /.test(stCol),{viaCol:viaCol&&Object.keys(viaCol).length,diff:viaCol&&viaAdd?Object.keys(viaCol).filter(k=>viaCol[k]!==viaAdd[k]):'',stCol});
 await ctx.close();
 /* side by side under 1000 px: one column */
 ({ctx,p}=await open(900,1200));await view(p,'build');await sleep(300);
 await p.evaluate(([a,c])=>{window.__tdBank.show(a);window.__tdBank.pick(c);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vsbs').click();},[BASE,PICK]);await sleep(300);
 {const r=await det(p,d=>{const P=[...d.querySelectorAll('.vpane')].map(x=>x.getBoundingClientRect());return {n:P.length,below:P.length===2&&P[1].top>=P[0].bottom-1&&Math.abs(P[0].left-P[1].left)<2,w:P.map(x=>Math.round(x.width)),dw:Math.round(d.getBoundingClientRect().width)};});
  const sc=await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);
  ok('B under 1000 px Side by side is one column (This version under Started from), with no sideways scroll of the page',r.n===2&&r.below&&sc,r);}
 await ctx.close();
 /* ---------------- C. the video ---------------- */
 ({ctx,p}=await open());await view(p,'build');await sleep(300);
 {const r=await p.evaluate(()=>{const V=window.__tdVideo,P=TD1_BANK.protocols;return {hp:P.filter(x=>x.code==='A_HIGHP').every(x=>V.has(x.id)),fct:V.has('fct-practical-guide-thinning'),dra:V.key('dra-teacher-approval-rules'),none:V.has('rird-arm-overcorrection'),n:V.count(),N:((window.NBH_VIDEOS||{}).list||[]).length,loaded:!!window.NBH_TD1_VIDEO||[...document.scripts].some(s=>/nbh-td1-video/.test(s.src))};});
  ok('C every high-p card has the video, the FCT card its own, a DRA card the DRA attention video, the overcorrection card none, every video of the list (43 at v25.97, with the three on antecedent changes to the work; 40 at v25.96, with the three on extinction; 37 at v25.91, with the three on token economies and the three on prompting; 26 at v25.76, with the Good Behavior Game video; 25 at v25.73, with the choice-of-task video; 24 at v25.70: the eleven for DRO, NCR and RIRD, the four for DRA and three more for FCT: v2568-td1-procvideos-test); no video file loaded until asked',r.hp&&r.fct&&r.dra==='dra_attention'&&!r.none&&r.n===r.N&&r.N===43&&!r.loaded,r);}
 {const r=await p.evaluate(()=>{const out=[];TD1_BANK.protocols.filter(x=>x.code==='A_HIGHP').forEach(x=>{window.__tdBank.show(x.id);const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');
   const b=d.querySelector('.load button.vid'),l=d.querySelector('.load .vidln');out.push({id:x.id,btn:b?b.textContent:'',line:l?l.textContent:'',after:!!(b&&l&&(b.compareDocumentPosition(l)&Node.DOCUMENT_POSITION_FOLLOWING))});});return out;});
  const wrong=r.filter(x=>{const c=HP.find(h=>h.id===x.id).cmp;return x.btn!=='Watch how'||!x.after||x.line!==xline(HP.find(h=>h.id===x.id),SHOWS);});
  ok('C Watch how (v25.70; it was Watch the video) on all 36 high-p cards (v25.79), and under it the line the mockup computes: what the video shows, how this version differs',r.length===36&&!wrong.length,wrong.slice(0,2));
  const m=r.find(x=>x.id==='a_highp-momentum-compliance');
  ok('C the line for Mace et al. (1988) names the praise-only version shown, and its own spacing and the hard request’s timing',m&&m.line==='The video shows the closest version, after Wilder, Sheppard, et al. (2025): 3 easy requests 1–2 s apart, brief praise only after each, the hard request 1–2 s after the last, nothing said if it is not done, a 15-s restart from the first after a missed one. This version differs in time between them: About 10 s; the hard request comes: Within 5 s (never over 10 s).',m&&m.line);
  const l=r.find(x=>x.id==='a_highp-edible-then-direct');
  ok('C the line for Lipschultz et al. (2018), an edible after each easy one, names the first video and how it differs',l&&l.line===vline(HP.find(h=>h.id===l.id).cmp)&&/^The video shows TD-1’s steps for this card: 3 easy requests 1–3 s apart, praise and a snack after each/.test(l.line),l&&l.line);}
 await p.evaluate(()=>{window.__tdBank.show('a_highp-edible-then-direct');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.vid').click();});
 await p.waitForFunction(()=>{const v=document.getElementById('tv-video');return v&&v.readyState>=1&&!v.hidden&&v.dataset.id==='a_highp';},null,{timeout:30000}).catch(()=>{});
 {const o=await p.evaluate(()=>{const d=document.getElementById('tdVideo'),v=document.getElementById('tv-video');return {open:d&&!d.hidden,src:v?v.src.slice(0,5):'',dur:v?v.duration:0,w:v?v.videoWidth:0,h:v?v.videoHeight:0,title:d.querySelector('#tv-title').textContent,ai:d.querySelector('.tv-ai').textContent,note:d.querySelector('.tv-note').textContent,err:d.querySelector('#tv-msg').classList.contains('tv-err'),script:[...document.scripts].some(s=>/nbh-td1-video-highp\.js$/.test(s.src))};});
  ok('C the player loads nbh-td1-video-highp.js when asked and plays from the device: about 2:49, 1080p (v25.75, the re-drawn frame)',o.open&&o.script&&o.src==='blob:'&&Math.abs(o.dur-169.2)<1.5&&o.w===1920&&o.h===1080&&!o.err,o);
  ok('C the player’s note: AI-generated, simulated people, the sequence and not a real session, adapt every step, the Responding to behavior sheet if the hard request is not done',/^High-probability request sequence/.test(o.title)&&/AI-generated/.test(o.ai)&&/simulated people/.test(o.ai)&&/simulated: it shows the sequence, not a real session/.test(o.note)&&/Adapt every step to the student’s plan/.test(o.note)&&/If the student does not do the hard request, follow the Responding to behavior sheet for the function\./.test(o.note),o);}
 await p.keyboard.press('Escape');await sleep(200);
 /* the FCT video as it was */
 await p.evaluate(()=>{window.__tdBank.show('fct-practical-guide-thinning');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.vid').click();});
 await p.waitForFunction(()=>{const v=document.getElementById('tv-video');return v&&v.readyState>=1&&!v.hidden&&/fct/.test(v.dataset.id||'');},null,{timeout:30000}).catch(()=>{});
 {const o=await p.evaluate(()=>{const d=document.getElementById('tdVideo'),v=document.getElementById('tv-video');return {title:d.querySelector('#tv-title').textContent,note:d.querySelector('.tv-note').textContent,dur:v.duration,line:(document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vidln')||{}).textContent||''};});
  ok('C the FCT video is as it was: its title, its note, about 117 s; v25.70 (FCT has four videos) the line under its button says it shows this card’s steps',o.title==='Functional communication training: the break request, step by step'&&o.note==='Made with an AI video model from the card’s steps, with the step’s name in the picture and narration added. The people and the room are simulated: it shows the sequence, not a real session. Adapt every step to the student’s plan, and complete the escape-extinction consent block (Responding to behavior sheet) before using escape extinction.'&&Math.abs(o.dur-117.0)<1.5&&/^The video shows this card’s steps: for escape, a break card/.test(o.line),o);}
 await p.keyboard.press('Escape');await sleep(200);
 /* the plan's cards */
 await p.evaluate(()=>{window.__tdBank.show('a_highp-momentum-compliance');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.add').click();});await sleep(800);
 await p.evaluate(()=>{const s=document.getElementById('addComp');s.value='A_HIGHP';document.getElementById('addCompBtn').click();});await sleep(500);
 await p.evaluate(()=>{window.__tdBank.show('dra-teacher-approval-rules');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.add').click();});await sleep(800);
 await sleep(2700);
 {const c=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,bank:(c.querySelector('[name$="].bank"]')||{}).value||'',btn:!!c.querySelector('.td-vid-btn'),line:(c.querySelector('.td-vid-line')||{}).textContent||''})));
  const m=HP.find(x=>x.id==='a_highp-momentum-compliance');
  ok('C the plan card from a high-p bank card carries Watch the video and its line; a high-p card from the menu carries the button and what the video shows; the DRA card its closest DRA video and its line',c.length===3&&c[0].bank===m.id&&c[0].btn&&c[0].line===xline(m,SHOWS)&&c[1].code==='A_HIGHP'&&!c[1].bank&&c[1].btn&&c[1].line==='The video shows TD-1’s steps for this card: '+VS.summary+'.'&&c[2].code==='DRA'&&c[2].btn&&/^The video shows the closest version, after Hall, Lund & Jackson \(1968\): no reminders, urging or scolding while the student is off task/.test(c[2].line),c);}
 await p.evaluate(()=>document.querySelectorAll('#compWrap .card .td-vid-btn')[1].click());
 await p.waitForFunction(()=>{const v=document.getElementById('tv-video');return v&&!document.getElementById('tdVideo').hidden&&v.dataset.id==='a_highp'&&v.src.startsWith('blob:');},null,{timeout:20000}).catch(()=>{});
 ok('C the menu card’s button opens the same player with the high-p video',await p.evaluate(()=>{const v=document.getElementById('tv-video');return !document.getElementById('tdVideo').hidden&&v.dataset.id==='a_highp'&&/^High-probability/.test(document.getElementById('tv-title').textContent);}));
 await p.keyboard.press('Escape');await sleep(200);
 {const r=await p.evaluate(()=>{const f=window.__tdCollect().fields;const txt=Object.values(f).join(' ');let pr=false;
   for(const ss of document.styleSheets){try{for(const r of ss.cssRules){if(r.media&&/print/.test(r.media.mediaText)&&/td-vid-line/.test(r.cssText)&&/td-vid-btn/.test(r.cssText))pr=true;}}catch(e){}}
   return {saved:/The video shows|Watch the video|blob:/.test(txt),pr,noprint:[...document.querySelectorAll('.td-vid-line')].every(x=>x.classList.contains('noprint'))};});
  ok('C nothing of the video or its line is in the save file; the button and the line are left out of print',!r.saved&&r.pr&&r.noprint,r);}
 /* the offline copy's list: pwa-sw's loadScript('...') pattern finds the file; v25.69 the videos' list is TD-1's copy of
    nbh-videos.js, whose names pwa-sw finds as quoted nbh-td1-video-….js names */
 {const html=fs.readFileSync(path.join(DIR,file('TD-1_')),'utf8');const refs=[...html.matchAll(/\b(?:fetch|loadScript)\(\s*(["'])([^"']+)\1/g)].map(m=>m[2]).concat([...html.matchAll(/(["'])(nbh-td1-video-[A-Za-z0-9-]+\.js)\1/g)].map(m=>m[2]));
  const js=fs.readFileSync(path.join(DIR,'nbh-td1-video-highp.js'),'utf8');const m=/NBH_TD1_VIDEO\['a_highp'\]='([A-Za-z0-9+/=]+)'/.exec(js);const bin=m?Buffer.from(m[1],'base64'):Buffer.alloc(0);
  const hd=/(\d+) bytes, SHA-256 ([0-9a-f]{64})/.exec(js);
  ok('C the offline copy finds nbh-td1-video-highp.js (TD-1 names it in loadScript, as the FCT video); its header gives the video’s size and SHA-256',refs.includes('nbh-td1-video-highp.js')&&refs.includes('nbh-td1-video-fct.js')&&!!hd&&+hd[1]===bin.length&&hd[2]===crypto.createHash('sha256').update(bin).digest('hex')&&bin.length>5e6,{refs,len:bin.length});}
 await ctx.close();
 /* ---------------- D. the quality check ---------------- */
 ({ctx,p}=await open());
 await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;};window.__clip='';try{Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__clip=t;return Promise.resolve();}},configurable:true});}catch(e){}});
 await view(p,'final');await sleep(500);
 const ITEMS=['The function is stated','Setting changes tied to the function','A replacement behavior that serves the same function','Teaching strategies','Reinforcement','Reactive strategies','Goals','Team communication'];
 const qc=()=>p.evaluate(()=>{const b=document.getElementById('tdQc'),a=document.getElementById('tdQcAdopt');const L=[...b.querySelectorAll('.td-qc-it')];
   return {shown:!b.hidden&&b.getBoundingClientRect().height>0,items:L.map(x=>x.querySelector('.td-qc-t').textContent),st:L.map(x=>x.dataset.st),stTxt:L.map(x=>x.querySelector('.td-qc-st').textContent),go:L.map(x=>(x.querySelector('.td-qc-go')||{}).textContent||''),sum:b.querySelector('.td-qc-sum').textContent,
    adopt:a&&!a.hidden?a.textContent:'',adoptBefore:!!(a&&(()=>{const g=[...document.querySelectorAll('#td82Block .plan-group')].find(x=>/Adopted by the team/.test(x.textContent));return g&&(a.compareDocumentPosition(g)&Node.DOCUMENT_POSITION_FOLLOWING)&&a.nextElementSibling===g;})()),
    before:(()=>{const fh=document.getElementById('finalHead');return !!(fh&&(b.compareDocumentPosition(fh)&Node.DOCUMENT_POSITION_FOLLOWING));})()};});
 {const r=await qc();
  ok('D the Final plan sheet opens with the quality check, before the plan, Copy, Print and adoption: the eight items of research #14, in order',r.shown&&r.before&&r.items.join('|')===ITEMS.join('|'),r);
  ok('D an empty form: every item Not met, each with the place to fix it; the line before "Adopted by the team" repeats the count',r.st.every(s=>s==='not')&&r.stTxt.every(s=>/Not met$/.test(s))&&r.go.every(g=>/^Go to /.test(g))&&r.sum==='0 of 8 met · 8 not met'&&/Quality check before sign-off: 0 of 8 met/.test(r.adopt)&&r.adoptBefore,r);}
 /* never blocks */
 await p.evaluate(()=>{document.querySelector('#tdQc [data-qc-do="print"]').click();});await sleep(300);
 await p.evaluate(()=>{document.getElementById('printFinalBtn').click();});await sleep(300);
 await p.evaluate(()=>{document.querySelector('#tdQc [data-qc-do="bip"]').click();});await sleep(500);
 {const r=await p.evaluate(()=>({prints:window.__prints,clip:window.__clip||'',dlg:!!document.querySelector('dialog[open]')}));
  ok('D it never blocks: with every item not met, Print final plan only prints (from the check and from the toolbar) and Copy for the BIP copies; the check is not in the text',r.prints===2&&r.clip.length>0&&!/Quality check|Not met|BSP-QE/.test(r.clip),{prints:r.prints,clip:r.clip.slice(0,80)});}
 /* Go to */
 await p.evaluate(()=>{document.querySelector('#tdQc .td-qc-it[data-qc="fn"] .td-qc-go').click();});await sleep(500);
 ok('D Go to Setup: Function opens the Setup sheet at the function',await p.evaluate(()=>/view-setup/.test(document.body.className)&&document.activeElement&&document.activeElement.name==='m.fn'));
 /* the simulation */
 await p.evaluate(()=>{document.getElementById('simScenario').value='escape_fct';document.getElementById('simBtn').click();});await sleep(2500);
 await view(p,'final');await sleep(600);
 {const r=await qc();
  ok('D the simulation (escape, FCT): every item met but team communication, which names who collects which data',r.st.join(',')==='met,met,met,met,met,met,met,not'&&/7 of 8 met · 1 not met/.test(r.sum)&&/Not met: team communication/.test(r.adopt),r);}
 await p.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};s('ad.data','Teacher: count per hour (simulated)');s('ad.review','2026-12-04');});await sleep(900);
 {const r=await qc();
  ok('D filled in on the sheet, the check follows at once: 8 of 8 met',r.st.every(s=>s==='met')&&r.sum==='8 of 8 met'&&/8 of 8 met\./.test(r.adopt),r);}
 /* not applicable: the replacement already in the repertoire, no teaching planned */
 {const r=await p.evaluate(()=>{const s=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');if(e){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}};
   const was={rep:document.querySelector('[name="m.rep"]').value,hier:document.querySelector('[name="pr.hier"]').value};
   const st0=window.__tdQc.items().find(x=>x.k==='teach').st;s('m.rep','yes');s('pr.hier','');
   const keep=[...document.querySelectorAll('#compWrap .card')].map(c=>c.dataset.code);
   /* the check reads the plan's cards: with no teaching card and no prompting in a replacement's steps, teaching is not applicable */
   const C=window.__tdComps,G=window.__tdGroups(),T=new Set(G[1][1].concat(G[2][1]));window.__tdComps=()=>C().filter(c=>!T.has(c.code));
   const it=window.__tdQc.items().find(x=>x.k==='teach');window.__tdComps=C;s('m.rep',was.rep);s('pr.hier',was.hier);return {st0,st:it.st,why:it.why,keep:keep.length};});
  ok('D Teaching strategies reads Not applicable when Setup says the replacement is already in the repertoire and no teaching is planned',r.st0==='met'&&r.st==='na'&&/already in the student’s repertoire/.test(r.why),r);}
 /* not printed, not saved */
 {await p.emulateMedia({media:'print'});const r=await p.evaluate(()=>({qc:getComputedStyle(document.getElementById('tdQc')).display,ad:getComputedStyle(document.getElementById('tdQcAdopt')).display}));await p.emulateMedia({media:'screen'});
  const f=await p.evaluate(()=>{const f=window.__tdCollect().fields;return Object.keys(f).filter(k=>/^(td)?qc\b|quality.?check/i.test(k)).concat(Object.values(f).some(v=>/Quality check before sign-off/.test(String(v)))?['text']:[]);});
  ok('D the check is not printed and keeps nothing in the save file',r.qc==='none'&&r.ad==='none'&&!f.length,{r,f});}
 /* ---------------- F. four more versions (the BCBA, 11/6) ---------------- */
 await view(p,'build');await sleep(300);
 {const r=await p.evaluate(()=>TD1_BANK.protocols.filter(x=>x.code==='A_HIGHP').map(x=>({id:x.id,k:window.__tdVideo.key(x.id)})));
  const wrong=r.filter(x=>x.k!==keyFor(x.id)),cnt={};r.forEach(x=>{cnt[x.k]=(cnt[x.k]||0)+1;});
  ok('F each high-p card shows the closest video: praise only 19 (v25.79: the Romano & Roll, 2000, card), the class 1, seatwork 1, peer 1, the first video 14 (v25.72: 12, then the Planer et al., 2018, and Trejo & Fryling, 2018, cards)',!wrong.length&&cnt.a_highp_praise===19&&cnt.a_highp_class===1&&cnt.a_highp_seatwork===1&&cnt.a_highp_peer===1&&cnt.a_highp===14,{wrong:wrong.slice(0,3),cnt});}
 for(const k of Object.keys(XV)){const x=XV[k];
  await p.evaluate(id=>{window.__tdBank.show(id);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.vid').click();},x.src);
  await p.waitForFunction(k=>{const v=document.getElementById('tv-video');return v&&v.readyState>=1&&!v.hidden&&v.dataset.id===k;},k,{timeout:30000}).catch(()=>{});
  const o=await p.evaluate(f=>{const d=document.getElementById('tdVideo'),v=document.getElementById('tv-video');return {k:v.dataset.id,dur:v.duration,w:v.videoWidth,h:v.videoHeight,title:d.querySelector('#tv-title').textContent,note:d.querySelector('.tv-note').textContent,err:d.querySelector('#tv-msg').classList.contains('tv-err'),script:[...document.scripts].some(s=>s.src.endsWith('/'+f))};},x.file);
  ok('F '+k+': its card opens it, '+x.file+' loaded when asked, played from the device (about '+x.dur+' s, 1080p), the note names its study',o.k===k&&o.script&&Math.abs(o.dur-x.dur)<1.5&&o.w===1920&&o.h===1080&&!o.err&&o.note.includes(x.after)&&/simulated: it shows the sequence, not a real session/.test(o.note),o);
  await p.keyboard.press('Escape');await sleep(200);}
 /* ---------------- E. touch and errors ---------------- */
 await view(p,'build');await sleep(300);
 await p.evaluate(([a,c])=>{window.__tdBank.show(a);window.__tdBank.pick(c);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vsbs').click();},[BASE,PICK]);await sleep(300);
 {const r=await det(p,d=>{const h=s=>[...d.querySelectorAll(s)].map(x=>Math.round(x.getBoundingClientRect().height));return {chip:Math.min(...h('.vchip')),f:Math.min(...h('.vf')),sbs:h('.vsbs')[0],re:h('.vre')[0],add:Math.min(...h('.vpane button.add')),vid:Math.min(...h('.vpane button.vid'))};});
  await view(p,'final');await sleep(400);const g=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('#tdQc .td-qc-go,#tdQc .tool,#tdQcAdopt .td-qc-go')].map(x=>Math.round(x.getBoundingClientRect().height))));
  ok('E on the iPad every new control is at least 44 px tall (chips, filters, Side by side, Start, Add this version, Watch the video, the check’s buttons)',Object.values(r).every(x=>x>=44)&&g>=44,{r,g});}
 await ctx.close();
 ok('E no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})().catch(e=>{console.log('FAIL crash '+(e&&e.stack||e));console.log('RESULT: crashed');process.exit(1);});
