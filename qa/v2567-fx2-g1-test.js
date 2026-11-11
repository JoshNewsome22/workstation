/* v25.67 fx2: the screen layout the BCBA approved on DM-1, IC-1, RR-1, TB-1, IA-1 and IN-1 is one shared block
   (tools/blocks/fx2.html, put in by tools/blocks/patch-fx2.py), and group 1 of the rollout carries it: SI-1, OB-1,
   SP-1, MT-1, VI-1, EA-1, DA-1 and PA-1. For each of the fourteen forms, on a 13-inch iPad sideways (1376 x 1032) and
   upright (1032 x 1376), touch, with the form's simulation loaded, on every sheet:
     1. nothing wider than the screen (also on a phone, 390 x 844, and an 11-inch iPad sideways, 1180 x 820);
     2. every box outside a table at 16 px or more, and 44 px tall (a box the layout leaves as the form drew it is
        listed as a NOTE: IN-1's student fields, as approved); on a touch screen the boxes in tables at 16 px too;
     3. no example of more than a few characters left inside a box (outside a table, or in a list shown as cards; an
        instruction the form keeps in its box, "From Form ...", and a short example in a row of label-and-box pairs
        stay);
     4. an example goes once its box holds an entry and comes back when it is emptied;
     5. headings in sentence case on screen (the same words, only the capitals change), as written while printing;
     6. the boxes of a row of fields in line;
     7. choices of two to four short answers as buttons (where the form keeps lists, FX2_CFG.noseg, they stay lists);
     8. lists of entries: cards on a touch screen at any width (the BCBA's v24.92 approval, "lists as cards on the
        iPad, tables on a laptop", and design review M17), each box under its column's name, and tables with a mouse
        (1300 x 900); tables of scores, trials, intervals and checklists stay tables;
     9. the masthead's description two lines with "Show the full introduction";
    10. the layout's own buttons 44 px tall;
    11. the print unchanged: the form printed with its layout and printed without it (the shared blocks taken out of
        the page as it is served) from the same data give the same pages and the same text, on the iPad;
    12. the master print: each form's styles read whole once the workstation scopes them, and a form collected for the
        packet (nbhPolish.plain(true)) gives its headings as written and its examples in their boxes, and takes the
        screen layout back after;
    13. no page errors;
    14. tools/blocks/patch-fx2.py --check: every form's copy is the source.
    15. nothing the form keeps out of sight (a box its own class hides) shown by the layout, on every sheet;
    16. in the recorders and timers (RUNNERS) nothing drawn over a label's words or a box, and on every sheet no example
        of the layout as an item of a row of label-and-box pairs, at 1376, 1180, 1032 and 390 px.
   WebKit when it is installed, otherwise Chromium as an iPad (qa/lib.js ipadBrowser). Simulated data only.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2567-fx2-g1-test.js [ID,ID...] */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const note=(n,i)=>console.log('NOTE '+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,600):''));
const G1=['SI-1','OB-1','SP-1','MT-1','VI-1','EA-1','DA-1','PA-1'],SIX=['DM-1','IC-1','RR-1','TB-1','IA-1','IN-1'];
const IDS=process.argv[2]?process.argv[2].split(','):[...G1,...SIX];
const file=id=>L.forms().find(x=>x.id===id).file;
const OUT=path.join(__dirname,'out','v2567-fx2-g1');fs.mkdirSync(OUT,{recursive:true});
/* spot checks on top of the checks of every table: lists that are cards at 820 px, tables that stay tables */
const CARDS={'SI-1':['#abTbl','#wbTbl','#alTbl','#pcTbl'],'OB-1':['#mbTbl','table.obck','table.oblog'],'SP-1':[],'MT-1':['table.mt-obsck'],
  'VI-1':['#evTbl','#registerTbl','#diffTbl','#cvLogTbl'],'EA-1':['#phaseTbl','table.ea-acct'],'DA-1':['#taskTbl'],'PA-1':['#raisdTbl','#poolTbl','#paUseTbl','#paSafeTbl','#ecoSetTbl','#ecoObsTbl'],
  'DM-1':['#teamTbl','#medTbl'],'IC-1':['#logTbl'],'RR-1':['#medTbl'],'TB-1':['#selTbl'],'IA-1':['#outTbl'],'IN-1':['#respTbl','#convTbl']};
const STAY={'SI-1':['#hardTbl','#prTbl'],'OB-1':['table.obs-count'],'SP-1':['#grid'],'MT-1':['#sessTbl'],'VI-1':['#agreeTbl','#hillTbl'],'EA-1':['#sessTbl','#trialTbl'],
  'DA-1':['#sessTbl','#pcTbl'],'PA-1':['#ssTbl','#ecoMatTbl'],'TB-1':['#qcTbl'],'IA-1':['#fastGrid'],'IN-1':['table.mx']};
/* boxes the layout leaves as the form drew them, approved as they are */
const KNOWN44={'IN-1':/^(setup|int) /,'IA-1':/^walk walk\./};
/* 16 the recorders and timers: EA-1's and PA-1's session runners, MT-1's timer, OB-1's live recorder (add a new group's) */
const RUNNERS='#eaRun, .pa-run, #tmr, #obRec';
/* the items that may not meet: every box in view, the words of every label (not the box inside it), every example; and
   no example of the layout as an item of a row of label-and-box pairs (a grid or a flex row, or a box beside its
   button), anywhere on a sheet */
const overlaps=p=>p.evaluate(RUN=>{const D=document;const sheets=[...D.querySelectorAll('.fx2-sh')].filter(s=>s.getClientRects().length);
  const vis=e=>{if(!e.getClientRects().length)return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)return false;const r=e.getBoundingClientRect();return r.width>2&&r.height>2;};
  const items=[],nm=e=>String(e.id||e.getAttribute('name')||e.getAttribute('data-m')||e.className||e.tagName).slice(0,30),txt=(e,k,n)=>{const rg=D.createRange();rg.selectNodeContents(e);[...rg.getClientRects()].forEach(r=>{if(r.width>2&&r.height>2)items.push({k,n,r,el:e.nodeType===1?e:e.parentElement.closest('label')||e.parentElement});});};
  sheets.forEach(s=>s.querySelectorAll(RUN).forEach(run=>{
    run.querySelectorAll('input:not([type=hidden]),select:not(.nbh-seg-src),textarea').forEach(e=>{if(vis(e))items.push({k:'box',n:nm(e),r:e.getBoundingClientRect(),el:e});});
    run.querySelectorAll('.fx2-hint,.fx2-cellhint,.nbh-hint').forEach(e=>{if(vis(e))txt(e,'example',e.textContent.trim().slice(0,30));});
    run.querySelectorAll('label').forEach(l=>{if(!vis(l))return;const tw=D.createTreeWalker(l,NodeFilter.SHOW_TEXT,{acceptNode:t=>!/\S/.test(t.nodeValue)||t.parentElement.closest('input,select,textarea,option,button,.fx2-hint,.nbh-hint,.fx2-cellhint,.nbh-seg')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
      let t;while((t=tw.nextNode()))if(vis(t.parentElement)){const rg=D.createRange();rg.selectNodeContents(t);[...rg.getClientRects()].forEach(r=>{if(r.width>2&&r.height>2)items.push({k:'label',n:l.textContent.trim().replace(/\s+/g,' ').slice(0,30),r,el:l});});}});}));
  const out=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(a.el===b.el||(a.k==='box'&&b.k==='box'&&(a.el.contains(b.el)||b.el.contains(a.el))))continue;
    const x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(x>2&&y>2)out.push(a.k+' "'+a.n+'" over '+b.k+' "'+b.n+'"');}
  const BQ='input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea';
  const row=p=>{if(!p||p.nodeType!==1)return false;const cs=getComputedStyle(p),d=cs.display;if(/flex/.test(d)){if(/column/.test(cs.flexDirection))return false;}else if(/grid/.test(d)){if((cs.gridTemplateColumns||'').split(' ').filter(Boolean).length<2)return false;}else return false;
    let n=0,x=0;for(let c=p.firstElementChild;c;c=c.nextElementSibling){if(c.matches(BQ)||c.querySelector(BQ)){n++;x++;}else if(c.matches('button')||c.querySelector('button'))n++;}return x>=1&&n>=2;};
  sheets.forEach(s=>s.querySelectorAll('.fx2-hint,.fx2-cellhint').forEach(e=>{if(vis(e)&&row(e.parentElement))out.push('example "'+e.textContent.trim().slice(0,30)+'" an item of the row '+String(e.parentElement.className).slice(0,24));}));
  return [...new Set(out)];},RUNNERS);
const clock=()=>{const T=new Date('2026-11-05T10:00:00').getTime();const D0=Date;const P0=performance.now();const now=()=>T+Math.floor(performance.now()-P0);
  class FD extends D0{constructor(...a){if(a.length)super(...a);else super(now());}static now(){return now();}}window.Date=FD;window.print=function(){};};
(async()=>{const ipad=await L.ipadBrowser(pw),cr=await pw.chromium.launch();const errs=[];console.log('engine for the iPad: '+ipad._nbhEngine);
  const sim=async p=>{await L.loadSim(p);await sleep(600);await p.evaluate(()=>{const b=[...document.querySelectorAll('dialog button,[role=dialog] button,[role=alertdialog] button')].find(x=>x.offsetParent&&/^(Replace|Load|OK|Yes)$/i.test(x.textContent.trim()));if(b)b.click();});await sleep(2200);};
  const open=async(ctx,id,tag)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+' '+tag+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/'+file(id));await sleep(1500);await sim(p);
    /* the toasts ("Simulation loaded: ...") come and go over the page; they are not the sheet's layout */
    await p.addStyleTag({content:'#nbhToasts,.nbh-toast{display:none!important}'});return p;};
  const views=p=>p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-view]')].map(b=>b.dataset.view))]);
  const view=async(p,v)=>{await p.evaluate(v=>{const b=document.querySelector('[data-view="'+v+'"]');if(b)b.click();},v);await sleep(750);await p.evaluate(()=>window.scrollTo(0,0));};
  /* 15: on each sheet, how many of each element are in view, keyed without the layout's own classes (the layout's own
     elements have no match on the page without it) */
  const shown=async p=>{const S={};for(const v of await views(p)){await view(p,v);await sleep(150);S[v]=await p.evaluate(()=>{const out={};
    const key=e=>{if(e.id)return '#'+e.id;const n=e.getAttribute('name')||e.getAttribute('data-m')||e.getAttribute('data-meta')||e.getAttribute('data-f');let a=e.parentElement;while(a&&!a.id)a=a.parentElement;
      return (a?'#'+a.id:'')+' '+e.tagName.toLowerCase()+(n?'['+n+']':'')+'.'+[...e.classList].filter(c=>!/^(fx2|nbh-)/.test(c)).sort().join('.')+' '+(e.matches('input,select,textarea')?'':e.textContent.trim().replace(/\s+/g,' ').slice(0,30));};
    document.querySelectorAll('.sheet *, .fx2-sh *').forEach(e=>{if(e.closest('.nbh-seg,.nbh-xs-bar,svg,canvas'))return;const k=key(e);
      out[k]=(out[k]||0)+(e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')?1:0);});return out;});}return S;};
  /* everything checked on the sheet in sight */
  const look=(p,spot)=>p.evaluate(spot=>{const C=window.FX2_CFG||{},D=document,R=D.documentElement;
    const vis=e=>!!(e.offsetParent||e.getClientRects().length)&&e.getBoundingClientRect().width>2&&getComputedStyle(e).visibility!=='hidden';
    const sheets=[...D.querySelectorAll('.fx2-sh')].filter(vis);const inS=e=>sheets.some(s=>s.contains(e));
    const BOX='input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]),select:not(.nbh-seg-src),textarea';
    const F=[...D.querySelectorAll(BOX)].filter(e=>inS(e)&&vis(e)&&!e.closest('.nbh-seg,dialog,[role=dialog]'));
    const nm=e=>(e.name||e.id||e.getAttribute('data-m')||e.getAttribute('data-x')||e.className||e.tagName).slice(0,40);
    const out=F.filter(e=>!e.closest('table')),card=F.filter(e=>e.closest('table.fx2-cards'));
    /* on a touch screen the boxes in tables too (under 16 px Safari zooms the page when one is tapped) */
    const touch=matchMedia('(pointer:coarse)').matches;
    const small=(touch?F:out).filter(e=>parseFloat(getComputedStyle(e).fontSize)<15.5).map(e=>nm(e)+':'+getComputedStyle(e).fontSize);
    const short=out.filter(e=>e.getBoundingClientRect().height<43.5).map(e=>nm(e)+':'+Math.round(e.getBoundingClientRect().height));
    const KI=C.keepin||{};const ph=out.concat(card).filter(e=>{const t=(e.getAttribute('placeholder')||'').trim();return t.length>8&&!/^From Form\b/.test(t)&&!KI[t]&&!(e.hasAttribute('data-fx2-inrow')&&t.length<=36);}).map(e=>nm(e)+':'+e.getAttribute('placeholder').slice(0,40));
    /* headings */
    const HS='.fx2-sh h3.sub, .fx2-sh .bar.nbh-band, .fx2-sh h2.nbh-band'+(C.heads?', '+C.heads:'');const H=[...D.querySelectorAll(HS)].filter(vis);
    const sq=t=>String(t||'').replace(/\s+/g,' ').trim();
    const hbad=H.filter(h=>{if(h.hasAttribute('data-fx2-origt'))return false;const o=h.getAttribute('data-fx2-orig');return o==null||sq(o).toLowerCase()!==sq(h.textContent).toLowerCase();}).map(h=>sq(h.textContent).slice(0,50));
    const hchanged=H.filter(h=>h.hasAttribute('data-fx2-orig')&&sq(h.getAttribute('data-fx2-orig'))!==sq(h.textContent)).length;
    /* rows of fields in line */
    let rows=0;const rbad=[];[...D.querySelectorAll('.fx2-sh .fx2-al')].filter(vis).forEach(g=>{const by={};[...g.children].filter(vis).forEach(f=>{const b=[...f.children].find(c=>vis(c)&&(c.matches('input,select,textarea')&&!/checkbox|radio|hidden/.test(c.type)&&!c.classList.contains('nbh-seg-src')||c.classList.contains('nbh-seg')));if(!b)return;
      const k=Math.round(f.getBoundingClientRect().top);(by[k]=by[k]||[]).push(Math.round(b.getBoundingClientRect().top));});
      Object.values(by).forEach(t=>{if(t.length<2)return;rows++;if(Math.max(...t)-Math.min(...t)>1)rbad.push(g.className.slice(0,40)+' '+t.join('/'));});});
    /* choices as buttons */
    const S=[...D.querySelectorAll('.fx2-sh select')].filter(s=>inS(s)&&(vis(s)||s.classList.contains('nbh-seg-src'))&&!s.multiple&&!s.closest('dialog,[role=dialog],.toolbar'));
    const want=S.filter(s=>{const o=s.options;if(o.length<3||o.length>5||o[0].value!=='')return false;for(let i=1;i<o.length;i++){const t=(o[i].textContent||'').trim();if(!t||t.length>24)return false;}return !(C.noseg&&s.closest(C.noseg));});
    /* where the buttons have no room on one line (a narrow column, a table cell) nbh-ui keeps the dropdown, as on the six */
    const cx=D.createElement('canvas').getContext('2d');const room=s=>{const cs=getComputedStyle(s);cx.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
      const o=[...s.options].slice(1);let need=o.reduce((n,x)=>n+cx.measureText(x.textContent.trim()).width+34,0)+(o.length-1)*6;
      cx.font='600 15px '+cs.fontFamily;need=Math.max(need,o.reduce((n,x)=>n+Math.max(56,cx.measureText(x.textContent.trim()).width+28),0)+(o.length-1)*2+4);let b=s.parentNode;
      while(b&&b.nodeType===1&&getComputedStyle(b).display.indexOf('inline')===0&&!/^T[DH]$/.test(b.tagName))b=b.parentNode;return !(b&&b.clientWidth&&b.clientWidth-8<need);};
    const segbad=want.filter(s=>!s.classList.contains('nbh-seg-src')&&!s.closest('table')&&room(s)).map(s=>nm(s)+':'+[...s.options].slice(1).map(o=>o.textContent.trim()).join('/').slice(0,40));
    const kept=S.filter(s=>C.noseg&&s.closest(C.noseg)&&s.classList.contains('nbh-seg-src')&&s.getAttribute('data-nbh-seg')==='1').map(nm);
    /* tables */
    const T=[...D.querySelectorAll('.fx2-sh table')].filter(t=>vis(t)&&t.tBodies[0]&&t.tBodies[0].rows.length);
    const tab=T.map(t=>{const r=t.tBodies[0].rows[0];const c=[...r.cells].find(x=>x.getAttribute('data-th')&&x.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea'))||[...r.cells].find(x=>/\w/.test(x.getAttribute('data-th')||''));
      return {sel:(t.id?'#'+t.id:'table.'+[...t.classList].filter(k=>k!=='fx2-cards'&&k!=='nbh-zebra')[0]),cards:t.classList.contains('fx2-cards'),boxes:!!t.querySelector('tbody input:not([type=hidden]),tbody select,tbody textarea'),tr:getComputedStyle(r).display,lab:c?getComputedStyle(c,'::before').content:''};});
    /* the spot checks: does a table the form names show on this sheet, and is it a list of entries */
    const sp={};(spot||[]).forEach(q=>{const m=T.filter(t=>t.matches(q));if(m.length)sp[q]=m.some(t=>t.classList.contains('fx2-cards'));});
    const hints=[...D.querySelectorAll('.fx2-hint')].filter(x=>/^For example/.test(x.textContent)&&!x.closest('table')).length;
    const btn=[...D.querySelectorAll('.fx2-btn')].filter(b=>vis(b)&&inS(b)).filter(b=>b.getBoundingClientRect().height<43.5).map(b=>b.textContent.trim().slice(0,30)+':'+Math.round(b.getBoundingClientRect().height));
    return {wide:R.scrollWidth-R.clientWidth,n:F.length,small,short,ph,hn:H.length,hbad,hchanged,rows,rbad,segs:want.length,segbad,kept,tab,btn,sp,hints};},spot);
  const res={};
  for(const id of IDS){res[id]={};
    for(const [w,h] of [[1376,1032],[1032,1376]]){const tag=w+'x'+h;const ctx=await L.ipadCtx(ipad,{viewport:{width:w,height:h}});await ctx.addInitScript(clock);const p=await open(ctx,id,tag);
      const V=await views(p);const agg={wide:[],small:[],short:[],ph:[],hbad:[],rbad:[],segbad:[],kept:[],tabs:[],btn:[],ovl:[]},spot={};let n=0,hn=0,hch=0,rows=0,segs=0,hints=0;
      for(const v of V){await view(p,v);const r=await look(p,[...(CARDS[id]||[]),...(STAY[id]||[])]);n+=r.n;hn+=r.hn;hch+=r.hchanged;rows+=r.rows;segs+=r.segs;hints+=r.hints;
        (await overlaps(p)).forEach(x=>agg.ovl.push(v+' '+x));
        for(const q in r.sp)spot[q]=(spot[q]||false)||r.sp[q];
        if(r.wide>1)agg.wide.push(v+':'+r.wide);['small','short','ph','hbad','rbad','segbad','kept','btn'].forEach(k=>r[k].forEach(x=>agg[k].push(v+' '+x)));r.tab.forEach(t=>agg.tabs.push(Object.assign({v},t)));}
      ok(`1 ${id} ${tag}: nothing wider than the screen on any of its ${V.length} sheets`,!agg.wide.length,agg.wide);
      ok(`2 ${id} ${tag}: every box at 16 px, in tables too on this touch screen (${n} boxes in all)`,!agg.small.length,agg.small.slice(0,8));
      const k44=KNOWN44[id],s44=agg.short.filter(x=>!(k44&&k44.test(x)));
      ok(`2 ${id} ${tag}: every box outside a table 44 px tall`,!s44.length,s44.slice(0,8));
      if(agg.short.length>s44.length)note(`${id} ${tag}: boxes the layout leaves as approved, under 44 px`,agg.short.filter(x=>!s44.includes(x)).slice(0,6));
      ok(`3 ${id} ${tag}: no example left inside a box`,!agg.ph.length,agg.ph.slice(0,8));
      ok(`5 ${id} ${tag}: ${hn} headings in sentence case on screen (${hch} changed), the words as written`,hn>0&&!agg.hbad.length,agg.hbad.slice(0,8));
      ok(`6 ${id} ${tag}: the boxes of a row of fields in line (${rows} rows)`,!agg.rbad.length,agg.rbad.slice(0,6));
      ok(`7 ${id} ${tag}: ${segs} choices of two to four short answers are buttons; the form's lists stay lists`,!agg.segbad.length&&!agg.kept.length,{segbad:agg.segbad.slice(0,6),kept:agg.kept.slice(0,6)});
      /* v25.67 fx2: on a touch screen the lists are cards at any width (the BCBA's v24.92 approval and design review M17) */
      const lists=agg.tabs.filter(t=>t.cards),notCard=lists.filter(t=>t.tr!=='grid'||!/\w/.test(t.lab));
      ok(`8 ${id} ${tag}: lists of entries are cards on this touch screen, each box under its column's name (${lists.length} lists)`,!notCard.length,notCard.slice(0,6));
      ok(`16 ${id} ${tag}: nothing drawn over a label or a box in the recorders and timers, and no example an item of a row of pairs`,!agg.ovl.length,agg.ovl.slice(0,8));
      ok(`10 ${id} ${tag}: the layout's own buttons 44 px tall`,!agg.btn.length,agg.btn.slice(0,6));
      if(w===1376){
        /* 9 the masthead */
        /* the description and, behind the link, the rest of the introduction (the note on saving) */
        const it=await p.evaluate(async()=>{const s=document.querySelector('header.nbh-mast p.nbh-sub'),n=document.querySelector('header.nbh-mast p.nbh-savenote'),b=document.querySelector('button.fx2-more');if(!s||!b)return {missing:true};
          const tall=()=>s.getBoundingClientRect().height+(n&&n.offsetParent?n.getBoundingClientRect().height:0);const p0=s.getBoundingClientRect().height,h0=tall(),t=b.textContent;b.click();await new Promise(r=>setTimeout(r,120));
          const h1=tall(),t1=b.textContent;b.click();await new Promise(r=>setTimeout(r,120));
          /* the link is drawn 32 px tall and takes a tap 44 px tall: a point 5 px above it and 5 px below it reach it */
          const r=b.getBoundingClientRect(),hit=y=>{const e=document.elementFromPoint(r.left+r.width/2,y);return !!e&&(e===b||b.contains(e));},tap=hit(r.top-5)&&hit(r.bottom+5);
          return {ok:p0<=(parseFloat(getComputedStyle(s).lineHeight)||20)*2.2&&h1>h0*1.2&&t==='Show the full introduction'&&t1==='Hide the full introduction'&&tall()===h0&&tap,p0,h0,h1,t,tap};});
        ok(`9 ${id}: the description is two lines with "Show the full introduction" (a tap 44 px tall)`,it.ok,it);
        /* 4 an example goes once its box is filled */
        let eg=null;for(const v of V){await view(p,v);eg=await p.evaluate(async()=>{const f=[...document.querySelectorAll('input,textarea')].find(x=>x._fx2eg&&x.offsetParent&&!x.readOnly&&!x.disabled&&!x.closest('table'));if(!f)return null;
          const h=f._fx2eg,v0=f.value,set=async v=>{f.value=v;f.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,150));return !!h.offsetParent;};
          const a=await set(''),b=await set('Simulated entry'),c=await set('');await set(v0);return {name:f.name||f.getAttribute('data-m')||f.id,t:h.textContent.slice(0,50),a,b,c,desc:(f.getAttribute('aria-describedby')||'').includes(h.id)};});if(eg)break;}
        if(!eg&&!hints)note(`${id}: no example outside a table to check (the form's examples are in its tables of data, which keep them)`);
        else ok(`4 ${id}: an example goes once its box holds an entry and comes back when it is emptied`+(eg?' ('+eg.t+')':''),!!eg&&eg.a&&!eg.b&&eg.c&&/^For example/.test(eg.t)&&eg.desc,eg);
        /* the spot checks: which tables the form makes lists of */
        const miss=(CARDS[id]||[]).filter(q=>spot[q]!==true),wrong=(STAY[id]||[]).filter(q=>spot[q]!==false);
        ok(`8 ${id}: the lists of entries are marked as lists (${(CARDS[id]||[]).join(' ')||'none'}), and ${(STAY[id]||[]).join(' ')||'no table named'} stay tables`,!miss.length&&!wrong.length,{miss,wrong});
        /* 12 collected for the packet */
        const pl=await p.evaluate(()=>{const H=[...document.querySelectorAll('[data-fx2-orig]')],F=[...document.querySelectorAll('[data-fx2-ph]')];if(!window.nbhPolish||!nbhPolish.plain)return {nopolish:true};
          nbhPolish.plain(true);const on={h:H.filter(h=>h.textContent.trim()===h.getAttribute('data-fx2-orig').trim()).length,f:F.filter(f=>f.getAttribute('placeholder')===f.getAttribute('data-fx2-ph')).length};
          nbhPolish.plain(false);const off={f:F.filter(f=>f.hasAttribute('placeholder')).length,h:H.filter(h=>h.textContent.trim()!==h.getAttribute('data-fx2-orig').trim()).length};
          return {nh:H.length,nf:F.length,on,off,changed:H.filter(h=>h.getAttribute('data-fx2-set')!==h.getAttribute('data-fx2-orig')).length};});
        ok(`12 ${id}: collected for the packet, its ${pl.nh} headings as written and its ${pl.nf} examples in their boxes; the screen layout after`,!pl.nopolish&&pl.on.h===pl.nh&&pl.on.f===pl.nf&&pl.off.f===0&&pl.off.h===pl.changed,pl);}
      await ctx.close();}
    /* 8 at 820 px (an iPad upright, the six's cards) */
    {const ctx=await L.ipadCtx(ipad,{viewport:{width:820,height:1180}});const p=await open(ctx,id,'820');const V=await views(p);const T=[],wide=[],ovl=[];
      for(const v of V){await view(p,v);const r=await look(p);(await overlaps(p)).forEach(x=>ovl.push(v+' '+x));if(r.wide>1)wide.push(v+':'+r.wide+' '+(await p.evaluate(()=>{const W=document.documentElement.clientWidth;return [...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();if(!(b.right>W+0.5&&b.width>0&&e.offsetParent))return false;for(let x=e.parentElement;x&&x!==document.body;x=x.parentElement)if(/auto|scroll|hidden|clip/.test(getComputedStyle(x).overflowX))return false;return true;}).slice(0,3).map(e=>e.tagName+'.'+String(e.className).slice(0,30)+'#'+e.id).join(' ');})));r.tab.forEach(t=>T.push(Object.assign({v},t)));}
      /* the layout's cards; a table it does not name stays as the form draws it (TB-1 lays out its own candidates) */
      const cards=T.filter(t=>t.cards),bad=cards.filter(t=>t.tr!=='grid'||!/\w/.test(t.lab)),stay=T.filter(t=>!t.cards&&t.boxes),stbad=[];
      ok(`8 ${id} 820x1180: ${cards.length} lists of entries are cards, each box under its column's name; ${stay.length} tables of scores, trials and checklists stay tables; nothing wider`,!bad.length&&!stbad.length&&!wide.length&&(!(CARDS[id]||[]).length||cards.length>0),{bad:bad.slice(0,5),stbad:stbad.slice(0,5),wide});
      ok(`16 ${id} 820x1180: nothing drawn over a label or a box in the recorders and timers, and no example an item of a row of pairs`,!ovl.length,ovl.slice(0,8));
      await ctx.close();}
    /* 8 with a mouse or trackpad (1300 x 900, no touch): the lists are tables, as on a laptop */
    {const ctx=await cr.newContext({viewport:{width:1300,height:900}});await ctx.addInitScript(clock);const p=await open(ctx,id,'mouse');const V=await views(p);const T=[],wide=[];
      for(const v of V){await view(p,v);const r=await look(p);r.tab.forEach(t=>T.push(Object.assign({v},t)));if(r.wide>1)wide.push(v+':'+r.wide);}
      const lists=T.filter(t=>t.cards),notTable=lists.filter(t=>t.tr!=='table-row');const fine=await p.evaluate(()=>matchMedia('(pointer:fine)').matches);
      ok(`8 ${id} 1300x900 with a mouse: ${lists.length} lists of entries are tables, as on a laptop; nothing wider`,fine&&!notTable.length&&!wide.length,{fine,notTable:notTable.slice(0,5),wide});
      await ctx.close();}
    /* 1 on a phone, and on an 11-inch iPad sideways */
    for(const [w,h,what] of [[390,844,'a phone\'s screen'],[1180,820,'an 11-inch iPad\'s screen']]){const ctx=await L.ipadCtx(ipad,{viewport:{width:w,height:h}});const p=await open(ctx,id,String(w));const V=await views(p);const wide=[];
      const ovl=[];for(const v of V){await view(p,v);const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(r>1)wide.push(v+':'+r);(await overlaps(p)).forEach(x=>ovl.push(v+' '+x));}
      ok(`1 ${id} ${w}x${h}: nothing wider than ${what} on any sheet`,!wide.length,wide);
      ok(`16 ${id} ${w}x${h}: nothing drawn over a label or a box in the recorders and timers, and no example an item of a row of pairs`,!ovl.length,ovl.slice(0,8));await ctx.close();}
    /* 11 the print, with the layout and without it, from the same data, on the iPad */
    {const strip=s=>s.replace(/<style id="fx2-v2492">[\s\S]*?<\/style>\n?/,'').replace(/<script id="fx2-v2492-js">[\s\S]*?<\/script>\n?/,'').replace(/<script id="fx2-cfg">[\s\S]*?<\/script>\n?/,'')
        .replace(/<script>document\.documentElement\.classList\.add\('fx2'\);[^<]*<\/script>\n?/,'');
      const mk=async(off)=>{const ctx=await L.ipadCtx(ipad,{viewport:{width:1376,height:1032}});await ctx.addInitScript(clock);
        if(off)await ctx.route('**/NBH-Workstation/'+file(id),async r=>{const res=await r.fetch();r.fulfill({response:res,body:strip(await res.text())});});return ctx;};
      const snapshot=p=>p.evaluate(()=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='snapshot'&&ev.data.snap){removeEventListener('message',h);res(ev.data.snap);}};addEventListener('message',h);postMessage({nbh:'snapshot'},'*');setTimeout(()=>res(null),10000);}));
      const restore=(p,s)=>p.evaluate(s=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){removeEventListener('message',h);res(true);}};addEventListener('message',h);postMessage({nbh:'restore',snap:s},'*');setTimeout(()=>res(false),10000);}),s);
      const keys=p=>p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(e=>[e.tagName,e.type,e.id,e.name,e.getAttribute('data-m'),e.getAttribute('data-x'),e.getAttribute('data-k')].join('|')));
      let ctx=await mk(false);let p=await open(ctx,id,'print');const s=await snapshot(p),k1=await keys(p),v1=await shown(p);await ctx.close();
      /* the saved file and the fields: the same with the layout as without it (the simulation loaded in each) */
      ctx=await mk(true);p=await open(ctx,id,'print (no layout)');const s0=await snapshot(p),k0=await keys(p),v0=await shown(p);await ctx.close();
      /* 15 an element the form keeps out of sight on a sheet (in view nowhere on it without the layout) is not shown by the
         layout's display rules (SP-1's Sheet no. box, before its own rule) */
      {const un=[];for(const v of Object.keys(v1)){const a=v1[v],b=v0[v]||{};for(const k of Object.keys(a))if(a[k]>0&&k in b&&b[k]===0)un.push(v+' '+k);}
        ok(`15 ${id}: nothing the form keeps out of sight shows with the layout (${Object.keys(v1).length} sheets at 1376 x 1032)`,!un.length,un.slice(0,8));}
      /* an id a form makes from the clock (IA-1's targets, "tmw3djtf86gt") differs between any two loads */
      const dj=x=>JSON.stringify(x&&(x.data||x)).replace(/"t[a-z0-9]{9,13}"/g,'"(id)"');const kd=k1.filter(x=>!k0.includes(x)).concat(k0.filter(x=>!k1.includes(x)));
      ok(`11 ${id}: every field keeps its id, name and data key, and the saved file (${s?Object.keys(s.data||s).length:0} entries) is the same with the layout as without it`,!!s&&!!s0&&dj(s)===dj(s0)&&!kd.length&&k1.length===k0.length,
        {keys:kd.slice(0,6),n:[k1.length,k0.length],data:s&&s0?Object.keys(s.data||{}).filter(k=>JSON.stringify((s.data||{})[k]).replace(/"t[a-z0-9]{9,13}"/g,'')!==JSON.stringify((s0.data||{})[k]).replace(/"t[a-z0-9]{9,13}"/g,'')).slice(0,6):'no snapshot'});
      const out={};for(const off of [false,true]){ctx=await mk(off);p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+' print'+(off?' (no layout)':'')+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
        await p.goto(BASE+'/NBH-Workstation/'+file(id));await sleep(1500);if(s){await restore(p,s);await sleep(2200);}
        /* as a print starts: the print media, and beforeprint (a headless page may deliver the media's change late) */
        const has=await p.evaluate(()=>!!window.fx2Layout);await p.emulateMedia({media:'print'});await p.evaluate(()=>dispatchEvent(new Event('beforeprint')));await sleep(600);
        /* once the screen's changes have gone back (on the print media's change, a moment after it). The paper is
           compared as the PDF reads, page by page: the page's own text in print media differs where it should not matter
           (a list's options count there, and polish prints a long choice through a copy where the layout's 16 px type
           made it too long for its box: DM-1's "Educational rights held by") */
        let text='';for(let k=0;k<8;k++){text=await p.evaluate(()=>document.body.innerText.replace(/\s+/g,' ').trim());
          if(!(await p.evaluate(()=>window.fx2Layout&&([...document.querySelectorAll('[data-fx2-orig]')].some(h=>!h.children.length&&h.textContent!==h.getAttribute('data-fx2-orig'))||
            [...document.querySelectorAll('[data-fx2-origt]')].some(h=>{const t=[...h.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());return t&&t._fx2o!=null&&t.nodeValue!==t._fx2o;})))))break;await sleep(400);}const f=path.join(OUT,id+(off?'-without':'-with')+'.pdf');
        fs.writeFileSync(f,await p.pdf({preferCSSPageSize:true,printBackground:true}));out[off?'without':'with']={has,text,f};await ctx.close();}
      const py=spawnSync('python3',['-c','import sys,json\ntry:\n import pymupdf as m\nexcept Exception:\n import fitz as m\nr=[]\nfor f in sys.argv[1:]:\n d=m.open(f); r.append([p.get_text() for p in d])\nprint(json.dumps(r))',out.with.f,out.without.f],{encoding:'utf8',maxBuffer:1<<27});
      let pages=null;try{pages=JSON.parse(py.stdout);}catch(e){}
      const cnt=f=>(fs.readFileSync(f,'latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
      const same=pages?pages[0].length===pages[1].length&&pages[0].every((t,i)=>t===pages[1][i]):cnt(out.with.f)===cnt(out.without.f);
      ok(`11 ${id}: the print is the same with the layout as without it (${pages?pages[0].length+' and '+pages[1].length:cnt(out.with.f)+' and '+cnt(out.without.f)} pages, the same text${pages?' on every page':''}); the snapshot ${s?'restored':'missing'}`,
        !!s&&out.with.has&&!out.without.has&&same,{pages:pages?[pages[0].length,pages[1].length]:null,text:out.with.text===out.without.text,has:[out.with.has,out.without.has],firstDiff:pages?pages[0].findIndex((t,i)=>t!==pages[1][i]):null,at:(()=>{const a=out.with.text,b=out.without.text;let i=0;while(i<a.length&&a[i]===b[i])i++;return i<Math.max(a.length,b.length)?[a.slice(Math.max(0,i-60),i+80),b.slice(Math.max(0,i-60),i+80)]:null;})()});}
  }
  /* 12 the master print keeps each form's styles whole */
  {const ctx=await cr.newContext({viewport:{width:1300,height:900}});const ws=await ctx.newPage();ws.on('pageerror',e=>errs.push('workstation: '+e.message));await ws.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
    const pk=await ws.evaluate(async files=>{const out=[];for(const f of files){const h=await (await fetch(f)).text();const d=new DOMParser().parseFromString(h,'text/html');
      const css=[...d.querySelectorAll('style:not([data-nbh-screen])')].map(x=>x.textContent).join('\n');const sc=scopeCSS(css,'.mp-0');const sh=new CSSStyleSheet();sh.replaceSync(sc);
      const cnt=r=>[...r].reduce((n,x)=>n+((x instanceof CSSMediaRule||x instanceof CSSSupportsRule)?cnt(x.cssRules):1),0);
      const written=(sc.match(/\{/g)||[]).length-(sc.match(/@(media|supports)[^{]*\{/g)||[]).length;out.push({f:f.slice(0,4),read:cnt(sh.cssRules),written});}return out;},IDS.map(file));
    ok('12 the master print keeps each form\'s styles: every form\'s rules, scoped by the workstation, read whole (no rule swallows the rest)',pk.every(x=>x.read>=x.written-200),pk);
    /* and the layout gives the packet no rule of its own: the workstation splits a rule's selectors at every comma and
       gives a control's name standing alone to every value it prints, so a rule of the layout that names input, select
       or textarea in a list could reach every value in the packet (a Focus rule did, before it was written otherwise).
       Every rule the shared block adds to the packet names the layout; a form's own block (fx2-own, which may hold the
       form's own rules for paper, as IN-1's does) adds no rule on every printed value of the form */
    const st=await ws.evaluate(async files=>{const strip=s=>s.replace(/<style id="fx2-v2492">[\s\S]*?<\/style>/,''),strip2=s=>strip(s).replace(/<style id="fx2-own">[\s\S]*?<\/style>/,'');
      const rules=css=>{const sh=new CSSStyleSheet();sh.replaceSync(scopeCSS(css,'.mp-0'));const o=[];const walk=(L,pre)=>{for(const x of L){if(x.cssRules&&!x.selectorText)walk(x.cssRules,pre+(x.conditionText||'')+'|');else o.push({k:pre+x.cssText,s:x.selectorText||''});}};walk(sh.cssRules,'');return o;};
      const out=[];for(const f of files){const h=await (await fetch(f)).text();const css=t=>[...new DOMParser().parseFromString(t,'text/html').querySelectorAll('style:not([data-nbh-screen])')].map(x=>x.textContent).join('\n');
        const w=rules(css(h)),o=rules(css(strip(h))),n=new Set(o.map(r=>r.k)),n2=new Set(rules(css(strip2(h))).map(r=>r.k));
        const paper=r=>!/(^|\|)[^|]*\bscreen\b[^|]*\|/.test(r.k)||/print/.test(r.k.split('{')[0]);   /* a rule for the screen only never reaches the paper */
        const stray=w.filter(r=>paper(r)&&!n.has(r.k)&&!/fx2/.test(r.s)).concat(o.filter(r=>paper(r)&&!n2.has(r.k)&&/(^|,\s*)\.mp-0 \.nbh-val/.test(r.s))).map(r=>r.k.slice(0,160));
        if(stray.length)out.push({f:f.slice(0,4),stray:stray.slice(0,3)});}return out;},IDS.map(file));
    ok('12 the master print gets no rule from the layout that reaches past it (every rule it adds names the layout)',!st.length,st);await ctx.close();}
  /* 14 the tool */
  {const forms=fs.readdirSync(path.join(ROOT,'NBH-Workstation')).filter(f=>/^[A-Z].*\.html$/.test(f)).map(f=>path.join(ROOT,'NBH-Workstation',f));
    const r=spawnSync('python3',[path.join(ROOT,'tools','blocks','patch-fx2.py'),'--check',...forms],{encoding:'utf8'});const cur=(r.stdout.match(/^current /mg)||[]).length;
    ok(`14 patch-fx2.py --check: every form that carries the layout holds the source's copy (${cur} forms)`,r.status===0&&cur>=IDS.length,{status:r.status,out:(r.stdout+r.stderr).slice(-600)});}
  ok('13 no page errors',!errs.length,errs.slice(0,6));
  await ipad.close();await cr.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);console.log('RESULT: 1 failure(s)');process.exit(1);});
