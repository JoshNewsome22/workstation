/* v24.93 Forms TB-1, IA-1 and IN-1 on screen: the v24.92 layout (DM-1, IC-1, RR-1) carried to the next three forms.
   WebKit (Safari's engine) with a touch screen at the width of a form on an iPad sideways (860 px); Chromium at 1300 px
   for a laptop. Simulated data only.
   1. every sheet: nothing wider than the screen; every box at 16 px or more; no example of more than a few characters
      left inside a box (IN-1's "Record what the respondent said" is an instruction and stays in its box);
   2. the masthead's description is two lines with "Show the full introduction" on all three forms;
   3. on the iPad the lists of entries are cards (TB-1's selected targets and clusters; IA-1's informants and instrument
      plan; IN-1's respondents), each box under its column's name; on the laptop they are tables;
   4. tables of scores by item and checklists stay tables on the iPad (IA-1's FAST items, TB-1's quality checklist,
      IN-1's yes/no/sometimes grids);
   5. IN-1's side-by-side answers: one card per question, each answer under the person's name and role; a respondent's
      remove button in the card's corner, the percent complete under "Complete";
   6. IN-1: the interview questions at 16 px;
   7. choices of two to four short answers are buttons on the iPad (IA-1's Daily contact?, IN-1's Sees the student);
   8. while the page measures itself for paper, every row of a card list counts;
   9. no page errors;
  10. the master print keeps each of the six forms' styles whole once the workstation scopes them to the form's section;
  11. a form collected for the master print (after nbhPolish.plain(true)) gives its headings as written and its examples
      in their boxes, and takes the screen layout back after.
   usage: node qa/fx3-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const file=id=>L.forms().find(x=>x.id===id).file;
(async()=>{const wk=await pw.webkit.launch(),cr=await pw.chromium.launch();const errs=[];
  const ipad=await wk.newContext({viewport:{width:860,height:900},hasTouch:true}),lap=await cr.newContext({viewport:{width:1300,height:900}});
  /* these forms ask in the page before loading the simulation */
  const sim=async p=>{await L.loadSim(p);await sleep(600);await p.evaluate(()=>{const b=[...document.querySelectorAll('dialog button,[role=dialog] button,[role=alertdialog] button')].find(x=>x.offsetParent&&/^(Replace|Load|OK|Yes)$/i.test(x.textContent.trim()));if(b)b.click();});await sleep(2200);};
  const open=async(ctx,id)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/'+file(id));await sleep(1800);await sim(p);return p;};
  const view=async(p,v)=>{await p.evaluate(v=>document.querySelector('[data-view="'+v+'"]').click(),v);await sleep(600);};
  const pages={};
  for(const id of ['TB-1','IA-1','IN-1']){const p=await open(ipad,id);pages[id]=p;
    const views=await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-view]')].map(b=>b.dataset.view))]);const bad=[];
    for(const v of views){await view(p,v);
      const r=await p.evaluate(()=>{const sh=[...document.querySelectorAll('.fx2-sh')].find(s=>s.offsetParent);if(!sh)return null;const vis=e=>e.offsetParent&&e.getBoundingClientRect().width>2;
        const F=[...sh.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select:not(.nbh-seg-src),textarea')].filter(vis);
        return {wide:document.documentElement.scrollWidth-document.documentElement.clientWidth,small:F.filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.name||e.id).slice(0,3),
          ph:F.filter(e=>{const t=(e.getAttribute('placeholder')||'').trim();return t.length>8&&!/^From Form [A-Z]{2,3}-\d/.test(t)&&!/^(Record what the respondent said|Anything the respondent added)$/.test(t);}).map(e=>(e.name||e.id)+':'+e.getAttribute('placeholder')).slice(0,3)};});
      if(r&&(r.wide>1||r.small.length||r.ph.length))bad.push(v+' '+JSON.stringify(r));}
    ok('1 '+id+' every sheet: nothing wider than the screen, boxes at 16 px, no example left in a box',!bad.length,bad);}
  /* 2 */
  const intro=[];for(const id of ['TB-1','IA-1','IN-1']){const p=pages[id];
    intro.push(await p.evaluate(async id=>{const p=document.querySelector('header.nbh-mast p.nbh-sub'),b=document.querySelector('button.fx2-more');if(!p||!b)return {id,missing:true};const h0=p.getBoundingClientRect().height;b.click();await new Promise(r=>setTimeout(r,100));
      const h1=p.getBoundingClientRect().height;b.click();await new Promise(r=>setTimeout(r,100));return {id,ok:h0<=(parseFloat(getComputedStyle(p).lineHeight)||20)*2.2&&h1>h0*1.3,h0,h1};},id));}
  ok('2 the description is two lines with "Show the full introduction" on TB-1, IA-1 and IN-1',intro.every(x=>x.ok),intro);
  /* 3 */
  const LISTS=[['TB-1','select','#selTbl'],['TB-1','cluster','#cluster table.rank'],['IA-1','setup','#infTbl'],['IA-1','setup','#setup table:has([name="plan.fast.u"])'],['IA-1','summary','#anGrp'],['IN-1','setup','#respTbl']];
  const shape=async(p,sel)=>p.evaluate(sel=>{const t=document.querySelector(sel);if(!t)return null;const r=t.tBodies[0]&&t.tBodies[0].rows[0];if(!r)return {empty:true};
    const F='input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select:not(.nbh-seg-src),textarea';const c=[...r.cells].find(x=>x.querySelector(F)&&x.getAttribute('data-th'));
    return {tr:getComputedStyle(r).display,lab:c?getComputedStyle(c,'::before').content:'',w:c?Math.round(c.querySelector(F).getBoundingClientRect().width):0};},sel);
  const onPad=[];for(const [id,v,sel] of LISTS){await view(pages[id],v);onPad.push([id,sel,await shape(pages[id],sel)]);}
  const lp={};for(const id of ['TB-1','IA-1','IN-1'])lp[id]=await open(lap,id);
  const onLap=[];for(const [id,v,sel] of LISTS){await view(lp[id],v);onLap.push([id,sel,await shape(lp[id],sel)]);}
  ok('3 lists of entries: cards on the iPad (each box under its column name, wide enough to read), tables on the laptop',
    onPad.every(x=>x[2]&&x[2].tr==='grid'&&/\w/.test(x[2].lab)&&x[2].w>=180)&&onLap.every(x=>x[2]&&x[2].tr==='table-row'),{onPad,onLap});
  /* 4 */
  const keep=[];for(const [id,v,sel] of [['IA-1','fast','#fastGrid'],['TB-1','check','#qcTbl'],['IN-1','int','table.mx']]){await view(pages[id],v);
    keep.push([id,sel,await pages[id].evaluate(sel=>{const t=[...document.querySelectorAll(sel)].find(x=>x.offsetParent);return t&&getComputedStyle(t.tBodies[0].rows[0]).display;},sel)]);}
  ok('4 tables of scores by item and checklists stay tables on the iPad',keep.every(x=>x[2]==='table-row'),keep);
  /* 5 */
  const inp=pages['IN-1'];await view(inp,'conv');
  const cv=await inp.evaluate(()=>{const t=document.getElementById('convTbl'),r=t.tBodies[0].rows[0],h=t.tHead.rows[0].cells[1];
    return {tr:getComputedStyle(r).display,title:r.cells[0].getAttribute('data-fx2k'),name:h.childNodes[0].textContent.trim(),lab:r.cells[1].getAttribute('data-th'),k:r.cells[1].getAttribute('data-fx2k'),before:getComputedStyle(r.cells[1],'::before').content,
      full:Math.round(r.cells[1].getBoundingClientRect().width)>=Math.round(r.getBoundingClientRect().width)-40};});
  ok('5 IN-1 side-by-side answers: one card per question, each answer under the person\'s name and role',cv.tr==='grid'&&cv.title==='title'&&cv.lab.indexOf(cv.name+' (')===0&&cv.k==='rowide'&&cv.before.indexOf(cv.name)>0&&cv.full,cv);
  await view(inp,'setup');
  const rs=await inp.evaluate(()=>{const r=document.getElementById('respTbl').tBodies[0].rows[0],rb=r.getBoundingClientRect();const act=[...r.cells].find(c=>c.getAttribute('data-fx2k')==='act'),cmp=[...r.cells].find(c=>/^Complete/.test(c.getAttribute('data-th')||''));
    const ab=act&&act.getBoundingClientRect();return {act:!!act,corner:ab?(rb.right-ab.right<30&&ab.top-rb.top<30):false,cmpK:cmp&&cmp.getAttribute('data-fx2k'),cmpLab:cmp?getComputedStyle(cmp,'::before').content:''};});
  ok('5 IN-1 a respondent\'s remove button in the card\'s corner, the percent complete under "Complete"',rs.act&&rs.corner&&rs.cmpK==='ro'&&/Complete/.test(rs.cmpLab),rs);
  /* 6 */
  await view(inp,'int');
  const q=await inp.evaluate(()=>{const h=[...document.querySelectorAll('.qcard .qh')].find(x=>x.offsetParent);const a=[...document.querySelectorAll('.qcard textarea')].find(x=>x.offsetParent);return {q:parseFloat(getComputedStyle(h).fontSize),a:parseFloat(getComputedStyle(a).fontSize),ph:a.getAttribute('placeholder')};});
  ok('6 IN-1 the interview questions at 16 px; the answer box keeps its instruction inside',q.q>=16&&q.a>=16&&/^(Record what|Anything)/.test(q.ph||''),q);
  /* 7 */
  const ia=pages['IA-1'];await view(ia,'setup');await view(inp,'setup');
  const sg=[await ia.evaluate(()=>{const s=document.querySelector('#infTbl select[name$=".daily"], #infTbl select');return s?{seg:!!(s.nextElementSibling&&s.nextElementSibling.classList.contains('nbh-seg'))||!!s.parentElement.querySelector('.nbh-seg'),name:s.name}:null;}),
    await inp.evaluate(()=>{const s=[...document.querySelectorAll('#respTbl select')].find(x=>[...x.options].some(o=>/Daily/.test(o.textContent)));return s?{seg:!!s.parentElement.querySelector('.nbh-seg'),name:s.name}:null;})];
  ok('7 choices of two to four short answers are buttons on the iPad',sg.every(x=>x&&x.seg),sg);
  /* 8 */
  const mm=await inp.evaluate(()=>{const t=document.getElementById('respTbl'),h=document.documentElement;h.classList.add('nbh-pr-measure');const n=[...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display==='table-row').length;h.classList.remove('nbh-pr-measure');return {n,all:t.tBodies[0].rows.length};});
  ok('8 while the page measures itself for paper every row counts, as a table row',mm.n===mm.all&&mm.all>0,mm);
  /* 10 the packet: the workstation gathers each form's styles into the master print, scoped to the form's section; a
     selector it cannot scope cleanly (a comma inside :not(...) beside a box) once left a parenthesis open there and the
     rest of the packet's styles were lost. Each of the six forms keeps nearly all its rules (the scoping drops about 125
     a form by design: the copies for printed values it cannot make) */
  const ws=await lap.newPage();await ws.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  const pk=await ws.evaluate(async files=>{const out=[];for(const f of files){const h=await (await fetch(f)).text();const d=new DOMParser().parseFromString(h,'text/html');
    const css=[...d.querySelectorAll('style')].map(x=>x.textContent).join('\n');const sc=scopeCSS(css,'.mp-0');const sh=new CSSStyleSheet();sh.replaceSync(sc);
    const cnt=r=>[...r].reduce((n,x)=>n+((x instanceof CSSMediaRule||x instanceof CSSSupportsRule)?cnt(x.cssRules):1),0);
    const written=(sc.match(/\{/g)||[]).length-(sc.match(/@(media|supports)[^{]*\{/g)||[]).length;out.push({f:f.slice(0,4),read:cnt(sh.cssRules),written});}return out;},
    ['DM-1','IC-1','RR-1','TB-1','IA-1','IN-1'].map(file));
  ok('10 the master print keeps each form\'s styles: the six forms\' rules, scoped by the workstation, read whole (no rule swallows the rest)',pk.every(x=>x.read>=x.written-160),pk);
  /* 11 the packet collects a form after nbhPolish.plain(true): headings as written and examples back in their boxes, and the
     screen layout again after plain(false) */
  const pl=await pages['TB-1'].evaluate(()=>{const H=[...document.querySelectorAll('[data-fx2-orig]')],F=[...document.querySelectorAll('[data-fx2-ph]')];
    nbhPolish.plain(true);const on={h:H.filter(h=>h.textContent.trim()===h.getAttribute('data-fx2-orig').trim()).length,f:F.filter(f=>f.getAttribute('placeholder')===f.getAttribute('data-fx2-ph')).length};
    nbhPolish.plain(false);const off={h:H.filter(h=>h.textContent.trim()===h.getAttribute('data-fx2-orig').trim()&&h.textContent.trim()!==h.textContent.trim().toLowerCase()).length,f:F.filter(f=>f.hasAttribute('placeholder')).length};
    return {nh:H.length,nf:F.length,on,off};});
  ok('11 TB-1 collected for the packet: headings as written and the examples in their boxes; the screen layout after',pl.nh>3&&pl.nf>3&&pl.on.h===pl.nh&&pl.on.f===pl.nf&&pl.off.f===0&&pl.off.h<pl.nh,pl);
  ok('9 no page errors',!errs.length,errs.slice(0,5));
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');await wk.close();await cr.close();process.exit(fails?1:0);})();
