/* v25.72 the TD-1 review's approved improvements (T1, T2, T4, T5, T7, T11, T12) and its bugs (B1 to B9, and the two it saw but
   did not trace), on Form TD-1 with simulated students only ("SIMULATED – Sample Student"), touch and an iPad's user agent:
     T1/B6  the sheet's Add button takes a real tap at 1180 x 820, 1133 x 744, 1376 x 1032 and 1032 x 1376 and inside the
            workstation, and adds the ticked cards; the Recommended margin never covers it or This plan so far;
     T1/B1  the margin's Add button says what the sheet's says and does the same, on Select and on Responding;
     seen   on Prompting & errors one tap adds what the button said, and the next says they are already there;
     T4     at 1032 px upright the margin is under the questions (beside them at 1376 sideways);
     T5     a Build card's title reads whole on a phone (no word broken), its buttons share a row on an iPad, the video's
            sentence is behind "What the video shows";
     T7     the protocol bank loads after the form answers (the form works while the file is held back); a saved plan reopens
            exactly as built before and after the bank comes; Print waits for the bank and loses no tap; the offline copy
            lists the file; the bank's list shows more rows and no text under 12 px;
     T11    after Add, the first card is within the screen; the empty Add component box says what it holds;
     T12    no text under 12 px on the sheets (the shared top bar, its sheet list and the writing help's badge are not TD-1's);
     T2     the restrictive and optional marks on a folded card, in the staff packet and on the printed plan; a proposed
            card's banner in the packet;
     B2     This plan so far counts the cards as they arrive;
     B4     "Extinction step: not yet agreed" is on the extinction step, never on a RESTRICTIVE: or OPTION: step;
     B5     the printed Least restrictive review follows the plan (a proposed card's punishment step is named as proposed);
     B7     High contrast: the next sheet's name in the top bar reads at 4.5:1 or more (TD-1 and two other forms);
     B8     the packet prints a label apart from its example;
     B9     a step's box has its own name;
     seen   the printed attention plan does not number the same line twice.
   and the BCBA's answers to the held questions (11/10):
     T3     each bank row carries its tag in the BCBA's words, read as part of the row's name; "Leave out protocols with a
            punishment step" takes those rows out and the count says so;
     T6     the printed plan numbers only the lines staff carry out, as many as the screen's "staff steps"; the thinning levels
            are a small table and "Not in place yet" a list under its heading, without numbers or tick boxes; the packet's
            flowchart does not start a page of its own;
     T8     every question on the Select sheet has a number, in order, and the counter's total is there from the start and steady;
     T9     on Setup, Function comes directly after the student's name;
     T10    Step by step counts the questions on the sheet on screen, and the sheet as the top bar counts it (TD-1 and FS-1).
   Each bug's check fails on the code before v25.72. usage: WS_URL=http://127.0.0.1:8153 node qa/v2572-td1-layout-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const OUT=path.join(__dirname,'out','v2572-td1-layout');fs.mkdirSync(OUT,{recursive:true});
const TD='/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html';
const NAME='SIMULATED – Sample Student';
const PHONE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const SIZES={side:[1180,820],side11:[1133,744],side13:[1376,1032],up13:[1032,1376],up:[820,1180]};
const T=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timed out')),ms))]);
let ipad,errs=[];
async function ctxOf(size,o){const [w,h]=SIZES[size]||size;return L.ipadCtx(ipad,Object.assign({viewport:{width:w,height:h},serviceWorkers:'block'},o||{}));}
async function page(ctx,url){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));await p.goto(BASE+(url||TD),{waitUntil:'domcontentloaded'});await sleep(1500);return p;}
const bankIn=p=>p.waitForFunction(()=>window.__tdBank&&window.__tdBank.entry,null,{timeout:30000}).then(()=>true,()=>false);
const view=(p,v)=>p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v).then(()=>sleep(450));
const setAll=(p,o)=>p.evaluate(o=>{for(const [n,v] of Object.entries(o)){const e=document.querySelector('[name="'+n+'"]');if(!e)continue;e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}));}},o).then(()=>sleep(500));
async function escape(p){await setAll(p,{'m.client':NAME,'m.fn':'escape'});await view(p,'select');
  await setAll(p,{'q.escape.0':'yes','q.escape.1':'no','q.escape.2':'yes','q.escape.3':'yes','q.escape.4':'Communication','q.escape.5':'no'});}
const cards=p=>p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>c.dataset.code));
/* the four-card plan of the review: demand fading and the consequence protocol from Select, then two FCT protocols from the bank
   (one with its punishment step, one with its optional step) */
async function bankPlan(p){await escape(p);await p.evaluate(()=>document.querySelector('#sendBuild').click());await sleep(900);await bankIn(p);
  const sh=f=>p.evaluate(f);
  await sh(()=>{const d=document.querySelector('#tdBankHost').shadowRoot.querySelector('details.pan');d.open=true;d.dispatchEvent(new Event('toggle'));});await sleep(700);
  const find=async q=>{await p.evaluate(q=>{const r=document.querySelector('#tdBankHost').shadowRoot;const i=r.querySelector('input.q');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},q);await sleep(700);};
  const openRow=async rx=>{await p.evaluate(rx=>{const r=document.querySelector('#tdBankHost').shadowRoot;const b=[...r.querySelectorAll('button.it')].find(b=>new RegExp(rx,'i').test(b.innerText));b.click();},rx);await sleep(900);};
  const load=async rx=>{await p.evaluate(rx=>{const r=document.querySelector('#tdBankHost').shadowRoot;const b=[...r.querySelectorAll('.detail .load button')].find(b=>new RegExp(rx).test(b.textContent.trim()));b.click();},rx);await sleep(700);};
  const second=async()=>{await p.evaluate(()=>{const r=document.querySelector('#tdBankHost').shadowRoot;const b=[...r.querySelectorAll('.detail .load .td-ask')].find(b=>/^Add (a second|to the plan)/.test(b.textContent.trim()));if(b)b.click();});await sleep(1200);};
  await find('practice guide signaled schedule thinning');await openRow('practice guide');await load('^Add with punishment');await second();
  await find('FCT without extinction in school');await openRow('FCT without extinction in school');
  await sh(()=>document.querySelector('#tdBankHost').shadowRoot.querySelector('.optck').click());await sleep(300);await load('^Add to the plan');await second();
  await sh(()=>{const d=document.querySelector('#tdBankHost').shadowRoot.querySelector('details.pan');d.open=false;d.dispatchEvent(new Event('toggle'));});await sleep(300);}
/* where the sheet's Add button is, and what lies over it and over This plan so far, at every scroll position of the sheet */
const cover=p=>p.evaluate(async()=>{const s=document.querySelector('#sendBuild'),rec=document.querySelector('#selRec'),m=document.querySelector('#selMeter');const out={over:[],steps:0};
  const ov=(a,b)=>a.width>0&&b.width>0&&!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
  const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=180){window.scrollTo(0,y);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));out.steps++;
    const R=rec.getBoundingClientRect(),S=s.getBoundingClientRect(),M=m.getBoundingClientRect();if(ov(R,S))out.over.push('button@'+y);if(ov(R,M))out.over.push('meter@'+y);}
  return out;});
const hitTap=async(p,sel)=>{const l=p.locator(sel).first();await T(l.scrollIntoViewIfNeeded(),6000).catch(()=>{});await sleep(250);
  const hit=await p.evaluate(sel=>{const b=document.querySelector(sel);const r=b.getBoundingClientRect();if(!r.width)return 'not shown';const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t===b||b.contains(t)?'hit':'covered by '+(t?(t.id||t.className||t.tagName):'nothing');},sel);
  let tap='ok';try{await l.tap({timeout:4000});}catch(e){tap='tap failed: '+String(e.message).split('\n').slice(0,8).join(' / ').slice(0,400);}return {hit,tap};};
const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*r+0.7152*g+0.0722*b;};
/* every element with its own words drawn under 12 px (in the light DOM of the sheets, an open dialog, and the bank's panel) */
const SMALL=()=>{const out=[];const look=root=>root.querySelectorAll('*').forEach(e=>{if(e.closest&&e.closest('.toolbar,#nbhRail,.nbh-mast,.nbh-print-head'))return;
    let own=false;for(let n=e.firstChild;n;n=n.nextSibling)if(n.nodeType===3&&n.nodeValue.trim()){own=true;break;}if(!own||!e.getClientRects().length)return;
    const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;
    const fs=parseFloat(cs.fontSize);if(fs>0&&fs<11.95)out.push(fs+'px '+e.tagName+'.'+String(e.className).slice(0,30)+' "'+e.textContent.trim().slice(0,30)+'"');});
  document.querySelectorAll('.sheet,dialog[open]').forEach(look);const h=document.getElementById('tdBankHost');if(h&&h.shadowRoot)look(h.shadowRoot);return out;};

(async()=>{ipad=await L.ipadBrowser(pw);console.log('engine for the iPad: '+ipad._nbhEngine);
 try{
 /* ---------- T1/B6, B2, T11: the sheet's Add button at four iPad sizes ---------- */
 const t1={},b2={},t11={};
 for(const sz of ['side','side11','side13','up13']){const ctx=await ctxOf(sz);const p=await page(ctx);await escape(p);
   const want=await p.evaluate(()=>[...document.querySelectorAll('#selRec .td-pick:checked')].length);
   const cv=await cover(p);const h=await hitTap(p,'#sendBuild');await sleep(320);
   b2[sz]=await p.evaluate(()=>(document.querySelector('#buildMeter')||{}).textContent||'');await sleep(700);
   const got=await cards(p);t1[sz]={want,got:got.length,over:cv.over.slice(0,4),steps:cv.steps,hit:h.hit,tap:h.tap};
   t11[sz]=await p.evaluate(()=>{const c=document.querySelector('#compWrap .card');return {top:c?Math.round(c.getBoundingClientRect().top):null,vh:innerHeight};});
   if(sz==='side')await p.screenshot({path:path.join(OUT,'build-arrive-1180.png')});
   await ctx.close();}
 ok('T1/B6 the sheet\'s Add button takes a real tap at 1180x820, 1133x744, 1376x1032 and 1032x1376 and adds the ticked cards',Object.values(t1).every(x=>x.hit==='hit'&&x.tap==='ok'&&x.want>=2&&x.got===x.want),t1);
 ok('T1/B6 the Recommended margin never covers the Add button or This plan so far, at any scroll position',Object.values(t1).every(x=>x.steps>3&&!x.over.length),t1);
 ok('B2 This plan so far counts the cards as they arrive (no keystroke)',Object.values(b2).every(t=>/This plan so far: [1-9]\d* components?/.test(t)),b2);
 ok('T11 after Add, the first card is within the screen (1180x820, 1376x1032, 1032x1376)',['side','side13','up13'].every(s=>t11[s].top!=null&&t11[s].top<t11[s].vh-60),t11);
 note('T11 at 1133x744 the first card starts at',t11.side11);
 /* ---------- T1/B1: the margin's button; T4 ---------- */
 {const ctx=await ctxOf('side');const p=await page(ctx);await escape(p);
  const w=await p.evaluate(()=>({low:document.querySelector('#sendBuild').textContent.trim(),mar:((document.querySelector('#selRec .td9-add'))||{}).textContent||''}));
  const h=await hitTap(p,'#selRec .td9-add');await sleep(900);const got=await cards(p);
  ok('T1/B1 Select: the margin\'s button says what the sheet\'s says ("Add N to Build") and a tap on it adds the cards',w.low===w.mar.trim()&&/^Add 2 to Build$/.test(w.low)&&h.hit==='hit'&&got.length===2,{w,h,got});
  /* Responding to behavior */
  await view(p,'respond');await setAll(p,{'rb.1':'yes','rb.2':'no','rb.3':'yes','rb.4':'no'});
  const r0=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].length);
  const wr=await p.evaluate(()=>({low:document.querySelector('#sendRespond').textContent.trim(),mar:((document.querySelector('#rbRec .td9-add'))||{}).textContent||''}));
  await p.evaluate(()=>{document.querySelectorAll('#compWrap .card[data-code="R_PB"]').forEach(c=>{c.querySelector('[data-rm]').dataset.td9ok='1';c.querySelector('[data-rm]').click();});});await sleep(300);
  await view(p,'respond');const hr=await hitTap(p,'#rbRec .td9-add');await sleep(900);const gr=await cards(p);
  ok('T1/B1 Responding: the margin\'s button says what the sheet\'s says and a tap on it sends the consequence protocol to Build',wr.low===wr.mar.trim()&&hr.hit==='hit'&&gr.includes('R_PB'),{wr,hr,gr,r0});
  /* seen, not traced: Prompting & errors, one tap adds two cards and the next none: the button counts both lists now */
  await view(p,'teach');await sleep(300);
  const tw=await p.evaluate(()=>{const a=[...document.querySelectorAll('#teach .td9-add')];return {labels:a.map(x=>x.textContent.trim()),low:document.querySelector('#sendTeach').textContent.trim(),n:document.querySelectorAll('#compWrap .card').length};});
  const ht=await hitTap(p,'#prRec .td9-add');await sleep(900);const n1=(await cards(p)).length;await view(p,'teach');
  const tw2=await p.evaluate(()=>({labels:[...document.querySelectorAll('#teach .td9-add')].map(x=>x.textContent.trim())}));
  const said=+((/^Add (\d+) to Build/.exec(tw.labels[0])||[])[1]||0);
  ok('seen: on Prompting & errors both margins and the sheet say the same, one tap adds what they said, then they say it is there',tw.labels.length===2&&tw.labels.every(l=>l===tw.low)&&said>0&&n1-tw.n===said&&tw2.labels.every(l=>/^Add to Build · \d+ already there$/.test(l)),{tw,ht,n1,tw2});
  await ctx.close();}
 {const ctx=await ctxOf('up13');const p=await page(ctx);await escape(p);
  const r=await p.evaluate(()=>{const q=document.querySelector('#modelWrap').getBoundingClientRect(),m=document.querySelector('#selRec').getBoundingClientRect();return {below:m.top>=q.bottom-1,qw:Math.round(q.width)};});
  await p.evaluate(()=>scrollTo(0,document.querySelector('#modelWrap').getBoundingClientRect().top+scrollY-120));await sleep(300);await p.screenshot({path:path.join(OUT,'select-1032.png')});
  ok('T4 the 13-inch iPad upright (1032 px) gets the upright layout: the margin under the questions, the questions the sheet\'s width',r.below&&r.qw>700,r);await ctx.close();}
 {const ctx=await ctxOf('side13');const p=await page(ctx);await escape(p);
  const r=await p.evaluate(()=>{const q=document.querySelector('#modelWrap').getBoundingClientRect(),m=document.querySelector('#selRec').getBoundingClientRect();return {beside:m.left>=q.right-2};});
  ok('T4 sideways (1376 px) the margin stays beside the questions',r.beside,r);await ctx.close();}
 /* ---------- T8 numbers and the counter; T9 Function under the name ---------- */
 {const ctx=await ctxOf('side');const p=await page(ctx);const t8={};
  for(const fn of ['escape','attention']){await setAll(p,{'m.fn':fn});await view(p,'select');const rd=()=>p.evaluate(()=>({n:[...document.querySelectorAll('#modelWrap .qrow')].filter(r=>!r.closest('[hidden]')).map(r=>(r.querySelector('.qn')||{}).textContent||''),prog:(document.querySelector('#modelWrap .td9-prog')||{}).textContent||''}));
    const a=await rd();await p.evaluate(()=>{const s=[...document.querySelectorAll('#modelWrap select')].find(s=>!s.closest('[hidden]'));const o=[...s.options].find(o=>o.value);s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
    const b=await rd();t8[fn]={a,b};}
  ok('T8 every question on the Select sheet has a number, 1 to N in order (escape and attention, with the lower-rate and "Whose attention" questions)',Object.values(t8).every(x=>x.a.n.length>=6&&x.a.n.every((v,i)=>v===String(i+1))),t8);
  ok('T8 the counter is there from the start and its total stays as answers come',Object.values(t8).every(x=>/^0 of (\d+) answered$/.test(x.a.prog)&&x.b.prog===('1 of '+x.a.n.length+' answered')&&x.a.prog===('0 of '+x.a.n.length+' answered')),t8);
  await view(p,'setup');const t9=await p.evaluate(()=>{const f=[...document.querySelectorAll('#setup input:not([type=hidden]),#setup select,#setup textarea')].filter(e=>e.name);const i=f.findIndex(e=>e.name==='m.client');return {after:f[i+1]&&f[i+1].name,under:document.querySelector('[name="m.fn"]').getBoundingClientRect().top>document.querySelector('[name="m.client"]').getBoundingClientRect().top};});
  ok('T9 on Setup, Function comes directly after the student\'s name (and under it)',t9.after==='m.fn'&&t9.under,t9);
  await ctx.close();}
 /* ---------- T10 Step by step counts the sheet on screen (TD-1 and FS-1) ---------- */
 {const ctx=await ctxOf('side');const t10={};
  for(const f of [TD,'/NBH-Workstation/FS-1_FBA-Summary-Report_v2026-09.html']){const p=await page(ctx,f);const id=f.split('/').pop().slice(0,4);
   const r=await p.evaluate(async()=>{fx2Layout.step.enable();fx2Layout.step.set(1);await new Promise(x=>setTimeout(x,700));const out=[];let guard=0,lastKey=null;
     /* the top bar's count (nbh-ui: the sheet's place among the tabs on show, "2 of 13"; in its menu when the list is folded) */
     const top=()=>{const t=[...document.querySelectorAll('#viewSeg button,#viewSeg [role="tab"]')].filter(b=>!b.hidden&&getComputedStyle(b).display!=='none');const i=t.findIndex(b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-selected')==='true');return i>=0?(i+1)+' of '+t.length:'';};
     while(guard++<400){const S=fx2Layout.step.state();if(S.rev)break;if(S.key!==lastKey){out.push({key:S.key,first:S.progress,top:top()});lastKey=S.key;}else out[out.length-1].last=S.progress;fx2Layout.step.next();await new Promise(x=>setTimeout(x,40));}
     return out;});
   t10[id]=r;await p.close();}
  const parse=t=>{const m=/^Questions? (\d+)(?:–(\d+))? of (\d+)(?: · Sheet (\d+) of (\d+))?$/.exec(t||'');return m?{a:+m[1],z:+(m[2]||m[1]),n:+m[3],s:+(m[4]||0),t:+(m[5]||0)}:null;};
  const good=Object.values(t10).every(sh=>sh.length>=2&&sh.every(x=>{const a=parse(x.first),z=parse(x.last||x.first),tb=/^(\d+) of (\d+)$/.exec(x.top||'');return a&&z&&a.a===1&&z.z===z.n&&a.n===z.n&&tb&&a.s===+tb[1]&&a.t===+tb[2];}));
  ok('T10 Step by step: "Question 1 of N" at each sheet\'s start, N the questions on that sheet, and "Sheet S of T" as the top bar counts it (TD-1, FS-1)',good,t10);
  await ctx.close();}
 /* ---------- inside the workstation ---------- */
 {const ctx=await ctxOf('side');const ws=await ctx.newPage();ws.on('pageerror',e=>errs.push('workstation: '+e.message));ws.on('dialog',d=>d.accept().catch(()=>{}));
  await ws.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);let r={};
  try{await ws.evaluate(()=>openForm('TD-1'));await ws.waitForFunction(()=>!!state.status['TD-1'],null,{timeout:40000});await sleep(2500);
   const fr=ws.frames().find(f=>/TD-1_/.test(f.url()));await escape(fr);
   const fl=ws.frameLocator('iframe[src*="TD-1_"]').locator('#sendBuild');await T(fl.scrollIntoViewIfNeeded(),6000).catch(()=>{});await sleep(300);
   r.hit=await fr.evaluate(()=>{const b=document.querySelector('#sendBuild');const R=b.getBoundingClientRect();const t=document.elementFromPoint(R.left+R.width/2,R.top+R.height/2);return t===b||b.contains(t);});
   r.over=(await cover(fr)).over.slice(0,3);await T(fl.scrollIntoViewIfNeeded(),6000).catch(()=>{});await sleep(200);
   try{await fl.tap({timeout:4000});r.tap='ok';}catch(e){r.tap='failed';}await sleep(900);r.cards=(await cards(fr)).length;}catch(e){r.err=String(e.message).slice(0,200);}
  ok('T1/B6 inside the workstation (1180x820) the Add button is clear, takes a tap and adds the two cards',r.hit&&r.tap==='ok'&&r.cards===2&&!(r.over||[1]).length,r);await ctx.close();}
 /* ---------- the four-card plan: T2, B4, B5, B8, B9, T5 (iPad upright), T12 ---------- */
 {const ctx=await ctxOf('up');const p=await page(ctx);await bankPlan(p);
  const C=await cards(p);ok('the four-card plan is built (DF, R_PB, FCT, FCT)',C.join(',')==='DF,R_PB,FCT,FCT',C);
  const b4=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>[...c.querySelectorAll('ol.steps li')].map(li=>({k:(li.querySelector('textarea')||{}).value.slice(0,40),tag:!!li.querySelector('.td-exttag')})).filter(x=>x.tag)));
  ok('B4 the "Extinction step: not yet agreed" tag is on the practice guide\'s extinction step (Withhold the maintaining reinforcer), never on a RESTRICTIVE: or OPTION: step',
    b4[2].length===1&&/^Withhold the maintaining reinforcer/.test(b4[2][0].k)&&b4.every(L=>L.every(x=>!/^(RESTRICTIVE|OPTION):/.test(x.k))),b4);
  const b9=await p.evaluate(()=>[...document.querySelectorAll('#compWrap ol.steps li textarea')].map(t=>t.getAttribute('aria-label')||''));
  ok('B9 each step\'s box has its own name ("Step N"), not the Set-up box\'s words and the tag\'s run together',b9.length>20&&b9.every(n=>/^Step \d+$/.test(n)),b9.filter(n=>!/^Step \d+$/.test(n)).slice(0,4));
  /* T5 on the iPad upright: the code and the card's buttons on one row, the video sentence behind its link */
  const t5=await p.evaluate(()=>{const c=[...document.querySelectorAll('#compWrap .card')][2];const hd=c.querySelector('.chd');const it=[...hd.querySelectorAll(':scope > .tag, :scope > button')].filter(e=>e.getClientRects().length);
    const tops=it.map(e=>Math.round(e.getBoundingClientRect().top+e.getBoundingClientRect().height/2));const ln=c.querySelector('.td-vid-line'),d=ln&&ln.closest('details');
    return {n:it.length,spread:Math.max(...tops)-Math.min(...tops),title:Math.round(hd.querySelector('.chdt').getBoundingClientRect().bottom),first:Math.min(...it.map(e=>Math.round(e.getBoundingClientRect().top))),vid:!!ln,behind:!!(d&&!d.open&&/^What the video shows$/.test(d.querySelector('summary').textContent.trim())),words:ln?ln.textContent.length:0};});
  ok('T5 iPad upright: the title on its own line, the code and the card\'s buttons on one row; the video\'s sentence (its words kept) behind "What the video shows"',t5.n>=4&&t5.spread<=8&&t5.first>=t5.title-2&&t5.vid&&t5.behind&&t5.words>40,t5);
  /* T2 folded card marks */
  await p.evaluate(()=>document.querySelectorAll('#compWrap .card').forEach(c=>{if(!c.classList.contains('td-fold'))c.querySelector('.td-cfold').click();}));await sleep(500);
  const t2a=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>[...c.querySelectorAll('.td-kmark')].filter(e=>e.getClientRects().length).map(e=>e.textContent)));
  await p.evaluate(()=>scrollTo(0,document.querySelector('#compWrap').getBoundingClientRect().top+scrollY-80));await sleep(300);await p.screenshot({path:path.join(OUT,'build-folded-820.png')});
  ok('T2 a folded Build card names its restrictive step and its optional step',t2a[2].some(t=>/^Step 7: restrictive procedure \(punishment\)$/.test(t))&&t2a[3].some(t=>/^Step 5: optional step$/.test(t))&&!t2a[0].length&&!t2a[1].length,t2a);
  await p.evaluate(()=>document.querySelectorAll('#compWrap .card').forEach(c=>{if(c.classList.contains('td-fold'))c.querySelector('.td-cfold').click();}));await sleep(400);
  const t2o=await p.evaluate(()=>{const li=[...document.querySelectorAll('#compWrap .card')][3].querySelectorAll('ol.steps li')[4];return {cls:li.className,after:getComputedStyle(li,'::after').content};});
  ok('T2 the optional step keeps its own mark on the open card',/td9-opt/.test(t2o.cls)&&/Optional step/.test(t2o.after),t2o);
  /* the printed plan */
  await view(p,'final');await sleep(600);
  const fin=await p.evaluate(()=>{const st=[...document.querySelectorAll('#finalBody .plan-step')];const R=st.filter(s=>/^RESTRICTIVE:/.test(s.querySelector('.t').textContent)),O=st.filter(s=>/^OPTION:/.test(s.querySelector('.t').textContent));
    return {r:R.map(s=>s.className+'|'+((s.querySelector('.td-kn')||{}).textContent||'')),o:O.map(s=>s.className+'|'+((s.querySelector('.td-kn')||{}).textContent||'')),head:(document.getElementById('finalHead')||{}).textContent||'',lr:(document.getElementById('td82Lr')||{}).textContent||''};});
  ok('T2 the printed plan keeps the restrictive step\'s mark and the optional step\'s mark',fin.r.length>=1&&fin.r.every(x=>/td-k-restr/.test(x)&&/Restrictive procedure/.test(x))&&fin.o.length===1&&/td-k-opt/.test(fin.o[0])&&/Optional step/.test(fin.o[0]),fin);
  ok('B4 the plan at a glance marks only the card with an extinction step "(extinction step: not yet agreed)"',(fin.head.match(/\(extinction step: not yet agreed\)/g)||[]).length===1,fin.head.slice(0,400));
  ok('B5 the printed Least restrictive review follows the plan: the proposed card\'s punishment step is named as proposed, the card once',!/No punishment procedure is part of the plan/.test(fin.lr)&&/Punishment proposed, not yet in the plan: Functional communication training\./.test(fin.lr)&&/Proposed, not yet in the plan \(needs the less restrictive data first\): Functional communication training\./.test(fin.lr),fin.lr);
  ok('B5 the review on the plan\'s first page does not list time-out as not used while a proposed card holds it',!/Not used[^.]*time-out/.test(fin.head),(/Not used[^.]*\./.exec(fin.head)||[''])[0]);
  /* T12 small text on the sheets this work changed, and the compare dialog */
  const small={};for(const v of ['setup','select','build','final','respond','teach','plan']){await view(p,v);small[v]=await p.evaluate(SMALL);}
  await view(p,'build');await p.evaluate(()=>document.querySelector('#tdCmpBtn').click());await sleep(700);small.compare=await p.evaluate(SMALL);await p.screenshot({path:path.join(OUT,'compare-820.png')});
  await p.keyboard.press('Escape');await sleep(300);
  ok('T12 no text under 12 px on screen on the sheets and in the compare dialog',Object.values(small).every(a=>!a.length),Object.fromEntries(Object.entries(small).filter(([k,a])=>a.length).map(([k,a])=>[k,a.slice(0,5)])));
  /* the staff packet */
  await p.evaluate(()=>{window.print=()=>{};if(window.nbhUI)nbhUI.confirm=async()=>true;});
  await p.evaluate(async()=>{document.querySelector('#printPacketBtn').click();await new Promise(r=>setTimeout(r,1500));});
  const pk=await p.evaluate(()=>{const fb=document.getElementById('flowBlock');const procs=[...fb.querySelectorAll('.fl-proc')];const fct=procs.filter(x=>/Functional communication training/.test((x.querySelector('.fl-name')||{}).textContent||''));
    const restr=[...fb.querySelectorAll('.fl-proc ol li')].filter(li=>/^RESTRICTIVE:/.test(li.textContent)),opt=[...fb.querySelectorAll('.fl-proc ol li')].filter(li=>/^OPTION:/.test(li.textContent));
    return {txt:fb.textContent,labs:[...fb.querySelectorAll('.fl-par b')].map(b=>b.textContent),prop:fct.map(x=>!!x.querySelector('.td-proposed')),restr:restr.map(li=>li.className+'|'+((li.querySelector('.fl-kn')||{}).textContent||'')),opt:opt.map(li=>li.className+'|'+((li.querySelector('.fl-kn')||{}).textContent||''))};});
  ok('B8 the packet prints a label apart from its example ("Data collected:", no "Data collectede.g.")',!/collectede\.g\./.test(pk.txt)&&pk.labs.includes('Data collected:')&&!pk.labs.some(l=>/e\.g\./.test(l)),pk.labs);
  ok('T2 the staff packet: the proposed card carries the plan\'s "Proposed" banner, the other FCT card none',pk.prop.length===2&&pk.prop.filter(Boolean).length===1,pk.prop);
  ok('T2 the staff packet: the punishment step is boxed with its note, the optional step with its own',pk.restr.length>=1&&pk.restr.every(x=>/fl-k-restr/.test(x)&&/Restrictive procedure/.test(x))&&pk.opt.length===1&&/fl-k-opt/.test(pk.opt[0])&&/Optional step/.test(pk.opt[0]),{r:pk.restr,o:pk.opt});
  await p.emulateMedia({media:'print'});await p.pdf({path:path.join(OUT,'packet.pdf'),format:'Letter',printBackground:true}).catch(()=>{});await p.emulateMedia({media:'screen'});
  /* T7: the bank's list */
  await view(p,'build');await p.evaluate(()=>{const d=document.querySelector('#tdBankHost').shadowRoot.querySelector('details.pan');d.open=true;d.dispatchEvent(new Event('toggle'));});await sleep(500);
  await p.evaluate(()=>{const r=document.querySelector('#tdBankHost').shadowRoot;const i=r.querySelector('input.q');i.value='FCT';i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(800);
  const bk=await p.evaluate(()=>{const r=document.querySelector('#tdBankHost').shadowRoot,l=r.querySelector('div.list'),L=l.getBoundingClientRect();const rows=[...l.querySelectorAll('button.it')].filter(b=>{const x=b.getBoundingClientRect();return x.top>=L.top-1&&x.bottom<=L.bottom+1;}).length;return {rows,h:Math.round(L.height)};});
  const bsmall=await p.evaluate(SMALL);
  ok('T7 the bank\'s list shows more than six protocols at a glance (iPad upright) and no text under 12 px',bk.rows>6&&!bsmall.length,{bk,bsmall:bsmall.slice(0,5)});
  /* T3 the tags and the tick box */
  const t3=await p.evaluate(async()=>{const r=document.querySelector('#tdBankHost').shadowRoot,i=r.querySelector('input.q');i.value='FCT';i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(x=>setTimeout(x,600));
    const rows=()=>[...r.querySelectorAll('div.list button.it')];const B=window.__tdBank;
    const kind=id=>{const s=(B.entry(id)||{}).steps||[];return {p:s.some(x=>/^\s*RESTRICTIVE:\s*Punishment\b/i.test(x)),r:s.some(x=>/^\s*RESTRICTIVE:/i.test(x)),o:s.some(x=>/^\s*OPTION:/i.test(x))};};
    const tags=b=>[...b.querySelectorAll('.tg')].map(t=>t.textContent);
    const all=rows().map(b=>({k:kind(b.dataset.id),t:tags(b),name:b.getAttribute('aria-label')?'':b.textContent}));
    const wrong=all.filter(x=>(x.k.p!==x.t.includes('Punishment step (can be left out)'))||((x.k.r&&!x.k.p)!==x.t.includes('Restrictive step'))||(x.k.o!==x.t.includes('Optional step'))||x.t.some(t=>x.name.indexOf(t)<0)).length;
    const ck=r.querySelector('.nopunck'),lab=ck&&ck.closest('label');const before=all.length,np=all.filter(x=>x.k.p).length;
    if(!ck)return {before,np,wrong,lab:null,tagged:all.filter(x=>x.t.length).length};const unticked=!ck.checked;ck.click();await new Promise(x=>setTimeout(x,400));
    const after=rows().map(b=>kind(b.dataset.id));const cnt=r.querySelector('.cnt').textContent;ck.click();await new Promise(x=>setTimeout(x,300));
    return {before,np,wrong,lab:lab&&lab.textContent.trim(),unticked,after:after.length,anyP:after.some(k=>k.p),cnt,tagged:all.filter(x=>x.t.length).length};});
  ok('T3 each bank row carries its tag in the BCBA\'s words, from the steps\' own marks, as part of the row\'s name',t3.tagged>0&&t3.np>0&&!t3.wrong,t3);
  ok('T3 "Leave out protocols with a punishment step", unticked at first; ticked, those rows leave the list and the count says so',t3.lab==='Leave out protocols with a punishment step'&&t3.unticked&&!t3.anyP&&t3.after===t3.before-t3.np&&new RegExp('\\('+t3.np+' with a punishment step left out\\)').test(t3.cnt),t3);
  /* T6 the printed plan's numbers */
  await view(p,'respond');await setAll(p,{'rb.1':'yes','rb.2':'no','rb.3':'yes','rb.4':'no','ee.pg':'yes'});await view(p,'final');await sleep(700);
  const t6=await p.evaluate(()=>{const st=[...document.querySelectorAll('#finalBody .plan-step')];const m=/(\d+)<\/b> staff steps?/.exec((document.querySelector('#selMeter,#buildMeter')||{}).innerHTML||'');
    return {rows:st.length,nums:st.map(s=>s.querySelector('.n').textContent),meter:m?+m[1]:null,thinNum:st.filter(s=>/^(FCT|DRA) \d+:/.test(s.querySelector('.t').textContent)||/^Not in place yet/.test(s.querySelector('.t').textContent)).length,
      thinTable:document.querySelectorAll('#finalBody table.plan-thin tbody tr').length,ny:[...document.querySelectorAll('#finalBody .plan-nyh')].map(e=>e.textContent),nyl:document.querySelectorAll('#finalBody .plan-ny li').length,boxes:document.querySelectorAll('#finalBody .plan-list .box, #finalBody table.plan-thin .box').length,dec:!document.getElementById('td46Steps').hidden};});
  ok('T6 the printed plan numbers only the lines staff carry out, 1 to N in order, as many as the screen\'s staff steps',t6.rows>20&&t6.meter===t6.rows&&t6.nums.every((v,i)=>v===String(i+1))&&!t6.thinNum&&t6.dec,t6);
  ok('T6 the thinning levels print as a small table and "Not in place yet" as a list under its heading, without numbers or tick boxes',t6.thinTable>=5&&t6.ny.includes('Not in place yet')&&t6.nyl>=1&&!t6.boxes,t6);
  const t6p=await p.evaluate(()=>{const cs=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules];}catch(e){return [];}});const inPrint=r=>r.media&&/print/.test(r.media.mediaText)?[...r.cssRules]:[];const rules=cs.flatMap(r=>[r].concat(inPrint(r))).map(r=>r.cssText||'');
    return {flowAuto:rules.some(t=>/body\.print-packet #flowBlock/.test(t)&&/break-before: auto/.test(t)),headAvoid:rules.some(t=>/\.plan-group/.test(t)&&/break-after: avoid/.test(t))};});
  ok('T6 page breaks: the packet\'s flowchart follows the checklist on its page, a heading stays with what follows it',t6p.flowAuto&&t6p.headAvoid,t6p);
  /* the saved plan, for T7 below */
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.evaluate(()=>document.getElementById('saveBtn').click())]);fs.copyFileSync(await dl.path(),path.join(OUT,'plan.json'));
  await ctx.close();}
 /* ---------- T5 on the phone ---------- */
 {const ctx=await ipad.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:PHONE_UA,serviceWorkers:'block'});const p=await page(ctx);await escape(p);
  await p.evaluate(()=>document.querySelector('#sendBuild').click());await sleep(900);await p.evaluate(()=>window.__tdAddComp('FCT'));await sleep(900);
  const t5=await p.evaluate(()=>{const c=[...document.querySelectorAll('#compWrap .card')].find(c=>c.dataset.code==='FCT');const t=c.querySelector('.chdt');const tn=[...t.childNodes].find(n=>n.nodeType===3);const words=[];
    if(tn){const s=tn.nodeValue;let re=/\S+/g,m;while((m=re.exec(s))){const r=document.createRange();r.setStart(tn,m.index);r.setEnd(tn,m.index+m[0].length);const lines=new Set([...r.getClientRects()].map(x=>Math.round(x.top)));words.push([m[0],lines.size]);}}
    const hd=c.querySelector('.chd');const it=[...hd.querySelectorAll(':scope > .tag, :scope > button')].filter(e=>e.getClientRects().length);const cs=it.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2;}).sort((a,b)=>a-b);let rows=0,last=-99;cs.forEach(y=>{if(y-last>14){rows++;last=y;}});
    c.scrollIntoView();return {broken:words.filter(w=>w[1]>1).map(w=>w[0]),rows,tb:Math.round(t.getBoundingClientRect().bottom),bt:Math.min(...it.map(e=>Math.round(e.getBoundingClientRect().top)))};});
  await sleep(300);await p.screenshot({path:path.join(OUT,'card-phone.png')});
  ok('T5 phone: the card\'s title reads whole (no word broken across lines), on a line of its own, the buttons on two rows at most',!t5.broken.length&&t5.bt>=t5.tb-2&&t5.rows<=2,t5);
  await ctx.close();}
 /* ---------- T7: the bank loads after the form answers; a saved plan reopens as built; Print waits; offline ---------- */
 {const ctx=await ctxOf('side');let release;const gate=new Promise(r=>{release=r;});let asked=0;
  await ctx.route('**/nbh-td1-bank.js',async route=>{asked++;await Promise.race([gate,sleep(15000)]);await route.continue().catch(()=>{});});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.accept().catch(()=>{}));
  const t0=Date.now();let usable=false,r={};
  try{await T(p.goto(BASE+TD,{waitUntil:'domcontentloaded'}),12000);await sleep(1200);
   r=await T(p.evaluate(async()=>{const f=document.querySelector('[name="m.fn"]');f.value='escape';f.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#viewSeg button[data-view="select"]').click();await new Promise(x=>setTimeout(x,500));
     return {bank:typeof TD1_BANK!=='undefined',qs:document.querySelectorAll('#modelWrap .qrow').length,view:document.body.className,wait:(document.querySelector('#tdBankHost .td-bank-wait')||{}).textContent||''};}),5000);
   usable=!r.bank&&r.qs>=5&&r.view==='view-select';}catch(e){r.err=String(e.message).slice(0,120);}
  ok('T7 the form answers (Setup, Select and its questions) while the bank\'s file is still on its way',usable&&asked>=1,Object.assign({asked,ms:Date.now()-t0},r));
  ok('T7 the bank panel\'s place says the bank is loading',/^Loading the protocol bank/.test(r.wait||''),r.wait);
  /* the saved four-card plan opened before the bank is in: every field as saved, and Print waits for the bank */
  const saved=JSON.parse(fs.readFileSync(path.join(OUT,'plan.json'),'utf8'));let same={};
  try{await T(p.setInputFiles('#fileIn',path.join(OUT,'plan.json')),8000);await sleep(2500);
   const now=await T(p.evaluate(()=>{const o={};document.querySelectorAll('[name]').forEach(e=>{if(e.closest('#tdBankHost'))return;o[e.name]=e.type==='checkbox'||e.type==='radio'?(e.checked?e.value||'on':''):e.value;});return o;}),5000);
   const diff=Object.keys(saved.fields).filter(k=>{const a=saved.fields[k],b=now[k];return String(a==null?'':a)!==String(b==null?'':b)&&!(typeof a==='boolean'&&(b==='on')===a);});same.before=diff.slice(0,6);
   await p.evaluate(()=>{window.__prints=0;window.print=()=>{window.__prints++;};if(window.nbhUI)nbhUI.confirm=async()=>true;});
   await p.evaluate(()=>{const b=document.getElementById('printFinalBtn')||[...document.querySelectorAll('button')].find(x=>/^Print final plan only$/.test(x.textContent.trim()));if(b)b.click();else printFinal();});await sleep(600);
   same.printsBefore=await p.evaluate(()=>window.__prints);}catch(e){same.err=String(e.message).slice(0,120);}
  release();await bankIn(p);await sleep(1200);
  try{same.printsAfter=await p.evaluate(()=>window.__prints);
   const [dl]=await Promise.all([p.waitForEvent('download',{timeout:15000}),p.evaluate(()=>document.getElementById('saveBtn').click())]);const again=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
   same.after=Object.keys(saved.fields).filter(k=>JSON.stringify(saved.fields[k])!==JSON.stringify(again.fields[k])).slice(0,6);same.n=Object.keys(saved.fields).length;
   same.cards=(await cards(p)).join(',');await view(p,'final');same.refs=await p.evaluate(()=>/Sources of the protocols from the protocol bank/.test(document.getElementById('finalBody').textContent));}catch(e){same.err2=String(e.message).slice(0,120);}
  ok('T7 a saved plan opened before the bank is in has every field as saved, and saved again after the bank came it is the same file',same.before&&!same.before.length&&same.after&&!same.after.length&&same.n>500&&same.cards==='DF,R_PB,FCT,FCT'&&same.refs,same);
  ok('T7 Print final plan tapped before the bank is in waits for it and then prints once (no tap lost)',same.printsBefore===0&&same.printsAfter===1,same);
  await ctx.close();
  const sw=fs.readFileSync(path.join(ROOT,'NBH-Workstation','sw.js'),'utf8'),src=fs.readFileSync(path.join(ROOT,'NBH-Workstation',TD.split('/').pop()),'utf8');
  ok('T7 the offline copy lists the bank\'s file, and the form loads that same file',/'nbh-td1-bank\.js'/.test(sw)&&/id="td1-pbank"[^>]*nbh-td1-bank\.js/.test(src),null);}
 /* ---------- seen, not traced: the attention plan numbers no line twice ---------- */
 {const ctx=await ctxOf('up13');const p=await page(ctx);await setAll(p,{'m.client':NAME,'m.fn':'attention'});await view(p,'select');
  await p.evaluate(()=>{window.td117.add('FCT');});await sleep(400);await view(p,'respond');await setAll(p,{'rb.1':'yes','rb.2':'no','rb.3':'yes','rb.4':'no'});
  await p.evaluate(()=>document.getElementById('sendRespond').click());await sleep(900);await view(p,'final');await sleep(600);
  const d=await p.evaluate(()=>{const t=[...document.querySelectorAll('#finalBody .plan-step .t')].map(x=>x.textContent.trim());const seen={},dup=[];t.forEach((x,i)=>{if(seen[x]!=null)dup.push((seen[x]+1)+'='+(i+1)+': '+x.slice(0,60));else seen[x]=i;});return {n:t.length,dup};});
  ok('seen: the printed attention plan numbers no line twice (the consequence protocol card\'s line is not repeated under Responding)',d.n>5&&!d.dup.length,d);await ctx.close();}
 /* ---------- B7 High contrast: the top bar's next sheet ---------- */
 {const ctx=await ctxOf('side');const res={};
  for(const f of [TD,'/NBH-Workstation/FS-1_FBA-Summary-Report_v2026-09.html','/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html']){const p=await page(ctx,f);
   await p.evaluate(()=>document.documentElement.classList.add('nbh-hc'));await sleep(300);
   res[f.split('/').pop().slice(0,4)]=await p.evaluate(()=>{const s=document.querySelector('.toolbar .nbh-next small');if(!s||!s.getClientRects().length||!s.textContent.trim())return null;
     const bg=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/,\s*0\)$/.test(c)&&c!=='transparent')return c;e=e.parentElement;}return 'rgb(255,255,255)';};return {col:getComputedStyle(s).color,bg:bg(s),t:s.textContent};});
   if(res[f.split('/').pop().slice(0,4)]){const x=res[f.split('/').pop().slice(0,4)];const a=lum(x.col),b=lum(x.bg);x.ratio=+((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(2);}
   await p.close();}
  ok('B7 High contrast: the next sheet\'s name in the top bar reads at 4.5:1 or more (TD-1, FS-1, IA-1)',Object.values(res).filter(Boolean).length>=2&&Object.values(res).every(x=>!x||x.ratio>=4.5),res);
  await ctx.close();}
 ok('no page errors',!errs.length,errs.slice(0,6));
 }catch(e){ok('the run finished',false,String(e.stack||e).slice(0,600));}
 console.log('RESULT: '+(fails?fails+' failed':'all passed'));await ipad.close();process.exit(fails?1:0);})();
function note(n,i){console.log('NOTE '+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,400):''));}
