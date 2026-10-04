/* v21.44 sprint A6: bigger tap targets on the live data sheets (MT-1, TI-1, ABC-1); ABC-1's Load simulation asks first;
   ABC-1 names a file it cannot read.
   1. Touch (verify-tap/measure.js again, with a touch screen: a coarse pointer), at 1180x820 and 820x1180, each form on
      its own with its simulation loaded:
      MT-1 Data sheet: every interval mark (+, - and N/A) at least 44 x 44 px, at least 4 px from the next mark in its row
        and from the mark below it; in every layout (the three methods, the IOA column off and on, 2, 3, 4 and 6 columns)
        nothing runs past the right edge of the screen, out of its sub-table or over another sub-table; the timer's +, -
        and N/A and its other buttons at least 44 x 44 px and 4 px apart.
      TI-1 Setup and Scoring sheet: every bare tick box (Critical, IOA collected) sits in a tappable box of at least 44 x 44
        px inside its cell, at least 4 px from any other target; a tap near each corner of that box, and at its centre,
        ticks or unticks the box and the record follows. The code lists are 44 px tall. The runner (set up, one step at a
        time, every step listed, ended): every button at least 44 x 44 px and 4 px from the next.
      ABC-1 Record and Background samples: the recording rows at least 40 px apart (centre to centre, as measure.js
        finds them), with at least 4 px between rows, and a tap on a row's words (centre, both ends, top and bottom)
        ticks it. Incidents: Edit and Delete, and Delete in the sample list, at least 44 x 44 px and 4 px apart. The
        buttons used while recording (the timer, its bar while observing, the stopwatch, the format switch, Save
        incident) at least 44 px tall and 4 px apart.
      At 820 px no page runs past the right edge. Inside the workstation (each form in its frame) the same sizes hold. On a
      phone (390 px) MT-1's marks stay 44 px and its page never scrolls sideways.
   2. The computer layout does not change: with a mouse at 1180x820, every element of each live view sits where the form
      before this package (A6_BASE) puts it, from the same saved record.
   3. The same taps score the same marks as before (A6_BASE, by touch at 1180x820): MT-1's sheet and timer, TI-1's tick
      boxes and runner, ABC-1's rows with Save incident and Save sample.
   4. ABC-1's Load simulation asks first, with the shared question (Anything already entered will be replaced, and
      Cancel): Cancel keeps the typed header, the saved incident and the one being entered; Load replaces them; a
      test's window.confirm stub is honoured (no question shown).
   5. ABC-1's Open data: another form's file, an OB-1, DD-1 or SP-1 file (no form tag), a case file, a student packet, a
      .csv and a JSON array each give a message on the tab in use, saying what the file is where the file tells, and
      nothing on the form changes; its own file opens; a record in an older shape opens; the files in A6_OLD (ABC-1.json,
      MT-1.json, TI-1.json from an earlier version) open in their forms; the workstation's restore of the record says
      nothing.
   6. Print: the three forms print the same pages as before (A6_BASE), blank and from the simulated record, with a mouse
      and with a touch screen (compare-print.py; page counts without PyMuPDF).
   7. No page error and no console error in the forms as they are now.
   Usage: WS_URL=http://127.0.0.1:8306 WS_ROOT=<worktree> node qa/sprint-a6-test.js [NBH-Workstation|RPS-Workstation]
          A6_BASE=<commit> (the form before this package, default 655e3ee; for another edition give one whose files of that
          edition were built from the same sources, or the comparisons 2, 3 and 6 are skipped)
          A6_OLD=<folder> (ABC-1.json, MT-1.json and TI-1.json saved by an earlier version, e.g. the audit's oldsave/)
          A6_ONLY=touch,layout,taps,sim,files,print (some of the parts; all by default) */
const {chromium,fs,path,ROOT,BASE,forms,sleep}=require(__dirname+'/lib.js');
const {execFileSync}=require('child_process');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a6/';
const A6_BASE=process.env.A6_BASE||'655e3ee';
const COMPARE=ED==='NBH-Workstation'||!!process.env.A6_BASE;
const A6_OLD=process.env.A6_OLD||'';
const ONLY=process.env.A6_ONLY?process.env.A6_ONLY.split(','):null;
const F=forms(ED),FILE={};
for(const id of ['MT-1','TI-1','ABC-1','OB-1','DD-1','SP-1'])FILE[id]=(F.find(f=>f.id===id)||{}).file;
if(!FILE['MT-1']||!FILE['TI-1']||!FILE['ABC-1']){console.error('FAIL MT-1, TI-1 and ABC-1 are not all in '+ED);process.exit(1);}
const NOW={},WAS={};for(const id of Object.keys(FILE))if(FILE[id])NOW[id]=BASE+'/'+ED+'/'+encodeURI(FILE[id]);
let fails=0,passes=0;
const ok=(name,cond,detail)=>{console.log((cond?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail).slice(0,cond?300:2000):''));if(cond)passes++;else fails++;};
const errs=[],baseErrs=[];
/* geometry helpers, in every page */
const HELPERS=`window.__a6={
  vis(e){if(!e)return false;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('[hidden]');},
  box(e){const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};},
  gap(a,b){return Math.max(b.l-a.r,a.l-b.r,b.t-a.b,a.t-b.b);},
  name(e){return e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.getAttribute('data-act')?'[act='+e.getAttribute('data-act')+']':'')+' '+String(e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim().slice(0,22);},
  /* the nearest box that scrolls its content (a list that scrolls inside its own box), and the part of an element the
     boxes around it show */
  scroller(e){for(let a=e.parentElement;a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){const cs=getComputedStyle(a);if(cs.overflowX!=='visible'||cs.overflowY!=='visible')return a;}return null;},
  clip(e){let r=this.box(e);for(let a=e.parentElement;a&&a!==document.body&&a!==document.documentElement;a=a.parentElement){const cs=getComputedStyle(a);
      if(cs.overflowX!=='visible'||cs.overflowY!=='visible'){const b=this.box(a);r={l:Math.max(r.l,b.l),t:Math.max(r.t,b.t),r:Math.min(r.r,b.r),b:Math.min(r.b,b.b)};}}
    r.w=r.r-r.l;r.h=r.b-r.t;return r;},
  /* the size of each target and its distance to the nearest other one: within one scrolling box as laid out, between
     two boxes as far as each shows */
  report(list){const B=list.map(e=>this.box(e)),C=list.map(e=>this.clip(e)),S=list.map(e=>this.scroller(e));let small=[],near=Infinity,pair='';
    B.forEach((b,i)=>{if(b.w<43.99||b.h<43.99)small.push(this.name(list[i])+' '+Math.round(b.w*10)/10+'x'+Math.round(b.h*10)/10);
      for(let j=i+1;j<B.length;j++){let g;if(S[i]===S[j])g=this.gap(b,B[j]);else{if(C[i].w<=0||C[i].h<=0||C[j].w<=0||C[j].h<=0)continue;g=this.gap(C[i],C[j]);}
        if(g<near){near=g;pair=this.name(list[i])+' / '+this.name(list[j]);}}});
    return {n:list.length,small,near:Math.round(near*10)/10,pair};}
};`;
async function fresh(br,o){
  const ctx=await br.newContext(Object.assign({viewport:{width:1180,height:820}},o||{}));
  await ctx.addInitScript({content:HELPERS});await ctx.addInitScript(()=>{window.print=function(){};});
  return ctx;
}
async function open(ctx,url,where,base){
  const p=await ctx.newPage(),into=base?baseErrs:errs;p.__native=[];
  p.on('pageerror',e=>into.push(where+' pageerror: '+String(e.message||e).slice(0,240)));
  p.on('console',m=>{if(m.type()==='error')into.push(where+' console: '+m.text().slice(0,240));});
  p.on('dialog',d=>{if(d.type()!=='beforeunload')p.__native.push(d.type()+': '+d.message().slice(0,120));d.accept().catch(()=>{});});
  await p.goto(url,{waitUntil:'load'});await sleep(900);return p;
}
const stub=p=>p.evaluate(()=>{window.confirm=()=>true;});
const sim=async p=>{await stub(p);await p.evaluate(()=>document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample').click());await sleep(1700);};
const view=async(p,v)=>{await p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);await sleep(450);};
const ownSave=p=>p.evaluate(()=>window.nbhBridge.ownSave());
const ownOpen=async(p,t)=>{const r=await p.evaluate(t=>window.nbhBridge.ownOpen(t),t);await sleep(400);return r;};
const uiDlg=p=>p.evaluate(()=>{const d=document.querySelector('#nbhUiDlg');return d&&d.open?{head:document.getElementById('nbhUiH').textContent,body:document.getElementById('nbhUiB').textContent,
  buttons:[...d.querySelectorAll('#nbhUiF button')].map(b=>b.textContent)}:null;});
const uiPress=(p,label)=>p.evaluate(l=>{const b=[...document.querySelectorAll('#nbhUiDlg[open] #nbhUiF button')].find(b=>b.textContent===l);if(b)b.click();return !!b;},label);
const noOverflow=p=>p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
/* a tap at a point, after checking that the point is on the element meant */
async function tapOn(p,sel,fx,fy,inset){
  const pt=await p.evaluate(([sel,fx,fy,inset])=>{const e=document.querySelector(sel);if(!e)return {err:'no '+sel};const tgt=e.closest('label.ti-ck')||e;
    const r0=tgt.getBoundingClientRect();if(r0.top<120||r0.bottom>innerHeight-60)e.scrollIntoView({block:'center'});const r=tgt.getBoundingClientRect();
    const x=fx<0?r.left+inset:fx>1?r.right-inset:r.left+r.width*fx,y=fy<0?r.top+inset:fy>1?r.bottom-inset:r.top+r.height*fy;
    const hit=document.elementFromPoint(x,y),on=!!hit&&(hit===tgt||tgt.contains(hit)||(hit.tagName==='LABEL'&&hit.control===e));
    return {x,y,on,hit:hit?(hit.id||hit.className||hit.tagName):null};},[sel,fx,fy,inset||3]);
  if(pt.err||!pt.on)return pt;
  await p.touchscreen.tap(pt.x,pt.y);await sleep(220);return pt;
}

/* ------------------------------------------------------------------ 1. touch */
const MT_LAYOUTS=[];for(const m of ['Momentary time sampling','Partial interval','Whole interval'])for(const io of ['No','Yes'])for(const c of ['4','2','3','6'])MT_LAYOUTS.push([m,io,c]);
async function mtTouch(br,W,H){
  const tag=`touch ${W}x${H}: MT-1`;const ctx=await fresh(br,{viewport:{width:W,height:H},hasTouch:true});
  const p=await open(ctx,NOW['MT-1'],tag);await sim(p);await view(p,'sheet');
  const coarse=await p.evaluate(()=>matchMedia('(pointer:coarse)').matches);
  ok(tag+': the browser reports a coarse pointer',coarse);
  const measure=()=>p.evaluate(()=>{const A=window.__a6,wrap=document.getElementById('ivWrap'),wr=A.box(wrap);
    const T=[...wrap.querySelectorAll('table.iv')],tables=T.map(t=>A.box(t)),marks=[],idx={};
    T.forEach((t,ti)=>[...t.tBodies[0].rows].forEach((tr,ri)=>[...tr.querySelectorAll('button')].forEach((b,bi)=>{const m=Object.assign({ti,ri,bi},A.box(b));marks.push(m);idx[ti+':'+ri+':'+bi]=m;})));
    let minRow=Infinity,minCol=Infinity;
    for(const m of marks){const n=idx[m.ti+':'+m.ri+':'+(m.bi+1)];if(n)minRow=Math.min(minRow,n.l-m.r);const d=idx[m.ti+':'+(m.ri+1)+':'+m.bi];if(d)minCol=Math.min(minCol,d.t-m.b);}
    const small=marks.filter(m=>m.w<43.99||m.h<43.99);
    const outside=marks.filter(m=>{const t=tables[m.ti];return m.l<t.l-0.5||m.r>t.r+0.5;}).length;
    const tabOut=tables.filter(t=>t.l<wr.l-0.5||t.r>wr.r+0.5).length;let overlap=0;
    for(let i=0;i<tables.length;i++)for(let j=i+1;j<tables.length;j++){const a=tables[i],b=tables[j];if(a.l<b.r-0.5&&b.l<a.r-0.5&&a.t<b.b-0.5&&b.t<a.b-0.5)overlap++;}
    const de=document.documentElement,r1=n=>Math.round(n*10)/10;
    /* a sub-table's box scrolls only where the screen is narrower than one sub-table (a phone), never on an iPad */
    const inner=[...wrap.children].filter(d=>d.scrollWidth>d.clientWidth+1||d.scrollHeight>d.clientHeight+1).length;
    return {marks:marks.length,small:small.length,smallEx:small.slice(0,2).map(m=>[r1(m.w),r1(m.h)]),minW:r1(Math.min(...marks.map(m=>m.w))),minH:r1(Math.min(...marks.map(m=>m.h))),
      minRow:r1(minRow),minCol:r1(minCol),outside,tabOut,overlap,inner,sw:de.scrollWidth,cw:de.clientWidth,tables:tables.length,
      across:tables.filter(t=>Math.abs(t.t-tables[0].t)<1).length};});
  const m0=await measure();
  ok(tag+': every interval mark (+, - and N/A) is at least 44 x 44 px',m0.marks>0&&!m0.small,{marks:m0.marks,min:[m0.minW,m0.minH],small:m0.smallEx});
  ok(tag+': at least 4 px between marks in a row and between rows',m0.minRow>=4&&m0.minCol>=4,{inRow:m0.minRow,toRowBelow:m0.minCol});
  const bad=[];let worst={w:99,h:99,row:99,col:99};const across={};
  for(const [m,io,c] of MT_LAYOUTS){
    await p.evaluate(([m,io,c])=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};set('method',m);set('ioaOn',io);set('cols',c);},[m,io,c]);
    await sleep(120);const r=await measure();
    worst={w:Math.min(worst.w,r.minW),h:Math.min(worst.h,r.minH),row:Math.min(worst.row,r.minRow),col:Math.min(worst.col,r.minCol)};
    across[m.split(' ')[0]+(io==='Yes'?'+IOA':'')+' '+c]=r.across+' of '+r.tables;
    if(r.small||r.minRow<4||r.minCol<4||r.outside||r.tabOut||r.overlap||r.inner||r.sw>r.cw)bad.push({layout:[m,io,c],r});
  }
  ok(tag+': in all 24 layouts the marks keep their size and gaps, and nothing runs past the screen, out of its sub-table or over another',!bad.length,bad.length?bad.slice(0,3):{worst,across});
  /* the timer */
  const t=await p.evaluate(()=>{const A=window.__a6;return {rec:A.report([...document.querySelectorAll('#tmr .tmr-btns button')].filter(e=>A.vis(e))),
    ctl:A.report([...document.querySelectorAll('#tmr .tmr-ctl button,#tmr .tmr-ctl select')].filter(e=>A.vis(e)))};});
  ok(tag+': the timer\'s +, - and N/A are at least 44 x 44 px and 4 px apart',t.rec.n===3&&!t.rec.small.length&&t.rec.near>=4,t.rec);
  ok(tag+': the timer\'s other buttons are at least 44 x 44 px and 4 px apart',t.ctl.n>=6&&!t.ctl.small.length&&t.ctl.near>=4,t.ctl);
  /* a Playwright screenshot ends the touch emulation of the page (the pointer reads fine afterwards), so it comes last */
  ok(tag+': still a coarse pointer when measured',await p.evaluate(()=>matchMedia('(pointer:coarse)').matches));
  await p.screenshot({path:OUT+'mt1-'+W+'x'+H+'.png'});
  await ctx.close();
}
/* a phone (390 px): every mark stays 44 px; the page never scrolls sideways; a sheet without the IOA column fits across
   (an interval's span takes two lines), one with it scrolls sideways in its own box */
async function mtPhone(br){
  const tag='touch 390x844 (a phone): MT-1';const ctx=await fresh(br,{viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const p=await open(ctx,NOW['MT-1'],tag);await view(p,'sheet');const bad=[],seen={};
  for(const [m,io,c] of MT_LAYOUTS){
    await p.evaluate(([m,io,c])=>{const set=(k,v)=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));};set('method',m);set('ioaOn',io);set('cols',c);},[m,io,c]);
    await sleep(100);
    const r=await p.evaluate(()=>{const A=window.__a6,w=document.getElementById('ivWrap'),wr=A.box(w),de=document.documentElement;
      const items=[...w.children],B=[...w.querySelectorAll('button')].map(b=>A.box(b));
      return {sw:de.scrollWidth,cw:de.clientWidth,minW:Math.min(...B.map(b=>b.w)),minH:Math.min(...B.map(b=>b.h)),
        itemOut:items.filter(d=>A.box(d).r>wr.r+0.5).length,scroll:items.filter(d=>d.scrollWidth>d.clientWidth+1).length,
        vscroll:items.filter(d=>d.scrollHeight>d.clientHeight+1).length};});
    seen[m.split(' ')[0]+(io==='Yes'?'+IOA':'')]=r.scroll?'scrolls in its box':'fits';
    if(r.sw>r.cw||r.minW<44||r.minH<44||r.itemOut||r.vscroll||(io==='No'&&r.scroll))bad.push({layout:[m,io,c],r});
  }
  ok(tag+': in all 24 layouts the marks stay 44 px, the page never scrolls sideways, and a sheet without the IOA column fits across',!bad.length,bad.length?bad.slice(0,3):seen);
  await ctx.close();
}
async function tiTouch(br,W,H){
  const tag=`touch ${W}x${H}: TI-1`;const ctx=await fresh(br,{viewport:{width:W,height:H},hasTouch:true});
  const p=await open(ctx,NOW['TI-1'],tag);await sim(p);
  const ticks=root=>p.evaluate(root=>{const A=window.__a6,R=document.querySelector(root);
    const ins=[...R.querySelectorAll('input[type=checkbox]')].filter(e=>A.vis(e));
    const others=[...R.querySelectorAll('select,textarea,input:not([type=checkbox]),button,label.ti-ck')].filter(e=>A.vis(e));
    return ins.map(i=>{const l=i.closest('label.ti-ck'),cell=i.closest('td,th'),lb=A.box(l||i),cb=A.box(cell),ib=A.box(i);
      const inside=ib.l>=lb.l-0.5&&ib.r<=lb.r+0.5&&ib.t>=lb.t-0.5&&ib.b<=lb.b+0.5,inCell=lb.l>=cb.l-0.5&&lb.r<=cb.r+0.5&&lb.t>=cb.t-0.5&&lb.b<=cb.b+0.5;
      let near=Infinity,who='';for(const o of others){if(o===l||o===i||(l&&l.contains(o)))continue;const g=A.gap(lb,A.box(o));if(g<near){near=g;who=A.name(o);}}
      return {k:(i.dataset.s!==undefined?'step '+(+i.dataset.s+1):'obs '+(+i.dataset.o+1))+' '+i.dataset.f,label:!!l,w:Math.round(lb.w*10)/10,h:Math.round(lb.h*10)/10,inside,inCell,near:Math.round(near*10)/10,who};});},root);
  const judge=(name,list)=>{const bad=list.filter(x=>!x.label||x.w<44||x.h<44||!x.inside||!x.inCell||x.near<4);
    ok(tag+': '+name+': every bare tick box sits in a tappable box of at least 44 x 44 px inside its cell, 4 px from any other target',list.length>0&&!bad.length,
      bad.length?bad.slice(0,4):{n:list.length,min:[Math.min(...list.map(x=>x.w)),Math.min(...list.map(x=>x.h))],near:Math.min(...list.map(x=>x.near))});};
  await view(p,'setup');judge('Setup',await ticks('#stepTbl'));
  /* taps near each corner and at the centre tick and untick the box; the record follows */
  const taps=async(sel,read)=>{const got=[];for(const [fx,fy] of [[-1,-1],[2,-1],[-1,2],[2,2],[0.5,0.5]]){
      const before=await p.evaluate(s=>document.querySelector(s).checked,sel);const pt=await tapOn(p,sel,fx,fy,3);
      if(pt.err||!pt.on){got.push('missed '+JSON.stringify(pt));continue;}
      const after=await p.evaluate(([s,read])=>{const e=document.querySelector(s);return {ck:e.checked,rec:new Function('return '+read)()};},[sel,read]);
      got.push(after.ck!==before&&after.rec===after.ck?'ok':'no: '+JSON.stringify({before,after}));}
    return got;};
  let g=await taps('#stepTbl input[data-s="2"][data-f="crit"]','!!S.steps[2].crit');
  ok(tag+': Setup: a tap near each corner of step 3\'s Critical box, and at its centre, ticks or unticks it and the record',g.every(x=>x==='ok'),g);
  await view(p,'sheet');
  const sheet=await ticks('#piTbl');judge('Scoring sheet',sheet);
  ok(tag+': Scoring sheet: the Critical and IOA collected boxes are all there',sheet.filter(x=>/crit/.test(x.k)).length>=8&&sheet.filter(x=>/ioa/.test(x.k)).length>=4,sheet.map(x=>x.k));
  g=await taps('#piTbl input[data-s="1"][data-f="crit"]','!!S.steps[1].crit');
  ok(tag+': Scoring sheet: taps on step 2\'s Critical box tick and untick it and the record',g.every(x=>x==='ok'),g);
  g=await taps('#piTbl input[data-o="1"][data-f="ioa"]','!!S.obs[1].ioa');
  ok(tag+': Scoring sheet: taps on observation 2\'s IOA collected box tick and untick it and the record',g.every(x=>x==='ok'),g);
  const sel=await p.evaluate(()=>{const A=window.__a6,L=[...document.querySelectorAll('#piTbl td.obs select')].filter(e=>A.vis(e));
    return {n:L.length,minH:Math.min(...L.map(e=>e.getBoundingClientRect().height)),report:A.report(L)};});
  ok(tag+': Scoring sheet: the code lists are 44 px tall and 4 px apart',sel.n>=40&&sel.minH>=44&&sel.report.near>=4,{n:sel.n,minH:sel.minH,near:sel.report.near});
  ok(tag+': no sideways scrolling of the page',await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  /* the runner, in each of its states */
  /* measured from the top of the page, where the runner's status bar is not yet stuck over the list below it */
  const runner=what=>p.evaluate(()=>{window.scrollTo(0,0);const A=window.__a6;return A.report([...document.querySelectorAll('#tiRun button')].filter(e=>A.vis(e)));});
  const judgeRun=(name,r)=>ok(tag+': the runner, '+name+': every button at least 44 x 44 px and 4 px from the next',r.n>0&&!r.small.length&&r.near>=4,r);
  judgeRun('before an observation',await runner());
  await p.evaluate(()=>document.getElementById('tiRunOpen').click());await sleep(300);
  await p.evaluate(()=>{const s=document.getElementById('tiRunCol'),o=[...s.options].pop();s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));
    [...document.querySelectorAll('#tiRun button[data-act="type"]')].find(b=>b.dataset.v==='Unannounced').click();});await sleep(250);
  judgeRun('set up',await runner());
  await p.evaluate(()=>document.getElementById('tiRunStart').click());await sleep(600);
  const live=await p.evaluate(()=>!!document.getElementById('tiRunLive'));
  ok(tag+': the runner starts',live);
  judgeRun('one step at a time',await runner());
  const strip=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#tiRun .ti-run-strip button')].filter(e=>A.vis(e)));});
  ok(tag+': the runner\'s step strip: 44 x 44 px each, 4 px apart',strip.n>=8&&!strip.small.length&&strip.near>=4,strip);
  await p.evaluate(()=>[...document.querySelectorAll('#tiRun button[data-act="mode"]')].find(b=>b.dataset.v==='all').click());await sleep(500);
  judgeRun('every step listed',await runner());
  const rows=await p.evaluate(()=>{const A=window.__a6;const L=[...document.querySelectorAll('#tiRun .ti-run-rowhd')].filter(e=>A.vis(e));return {n:L.length,minH:Math.min(...L.map(e=>e.getBoundingClientRect().height))};});
  ok(tag+': the runner\'s list: each step\'s line (tap to go to it) is at least 44 px tall',rows.n>=8&&rows.minH>=44,rows);
  await p.evaluate(()=>document.querySelector('#tiRun button[data-act="code"][data-i="0"]').click());await sleep(200);
  await p.evaluate(()=>document.getElementById('tiRunEnd').click());await sleep(500);
  if(await uiDlg(p))await uiPress(p,(await uiDlg(p)).buttons.slice(-1)[0]);await sleep(400);
  judgeRun('ended, not yet saved',await runner());
  ok(tag+': still a coarse pointer when measured',await p.evaluate(()=>matchMedia('(pointer:coarse)').matches));
  await p.screenshot({path:OUT+'ti1-'+W+'x'+H+'.png'});
  await ctx.close();
}
async function abcTouch(br,W,H){
  const tag=`touch ${W}x${H}: ABC-1`;const ctx=await fresh(br,{viewport:{width:W,height:H},hasTouch:true});
  const p=await open(ctx,NOW['ABC-1'],tag);await sim(p);
  const rowsOf=root=>p.evaluate(root=>{const A=window.__a6,R=document.querySelector(root);
    const ins=[...R.querySelectorAll('.opt input[type=checkbox],.opt input[type=radio]')].filter(e=>A.vis(e));
    const rows=ins.map(i=>{let u=A.box(i);for(const l of [...(i.labels||[])].filter(e=>A.vis(e))){const b=A.box(l);u={l:Math.min(u.l,b.l),t:Math.min(u.t,b.t),r:Math.max(u.r,b.r),b:Math.max(u.b,b.b)};}return {id:i.id,u};});
    for(const a of rows){let best=null;for(const b of rows){if(a===b||Math.abs(a.u.l-b.u.l)>20)continue;const d=Math.abs((a.u.t+a.u.b)/2-(b.u.t+b.u.b)/2);if(d<1)continue;
      if(!best||d<best.d)best={d,gap:Math.max(b.u.t-a.u.b,a.u.t-b.u.b)};}a.pitch=best?Math.round(best.d*10)/10:null;a.gap=best?Math.round(best.gap*10)/10:null;}
    return rows.map(r=>({id:r.id,pitch:r.pitch,gap:r.gap}));},root);
  const judgeRows=(name,rows)=>{const bad=rows.filter(r=>r.pitch!==null&&(r.pitch<40||r.gap<4)),P=rows.filter(r=>r.pitch!==null);
    ok(tag+': '+name+': the recording rows sit at least 40 px apart, with at least 4 px between them',P.length>=10&&!bad.length,
      bad.length?bad.slice(0,4):{rows:rows.length,minPitch:Math.min(...P.map(r=>r.pitch)),minGap:Math.min(...P.map(r=>r.gap))});};
  const rowTaps=async ids=>{const out=[];for(const id of ids){
      const lab=await p.evaluate(id=>!!document.querySelector('label[for="'+id+'"]'),id);if(!lab){out.push(id+' no label');continue;}
      for(const [fx,fy] of [[0.5,0.5],[-1,0.5],[2,0.5],[0.5,-1],[0.5,2]]){const before=await p.evaluate(id=>document.getElementById(id).checked,id);
        const pt=await tapOn(p,'label[for="'+id+'"]',fx,fy,fx<0||fx>1?4:3);const after=await p.evaluate(id=>document.getElementById(id).checked,id);
        const radio=await p.evaluate(id=>document.getElementById(id).type==='radio',id);
        out.push(pt.on&&(radio?after:after!==before)?'ok':id+' '+fx+','+fy+' '+JSON.stringify({pt,before,after}));}}
    return out;};
  await view(p,'record');
  judgeRows('Record',await rowsOf('#panel-record'));
  let g=await rowTaps(['a-a_acad','b-b_scream','c-c_dem_rem','i-i_stopped','r-r_bip','se-se_sleep']);
  ok(tag+': Record: a tap anywhere on a row\'s words (centre, both ends, top, bottom) ticks or unticks it',g.every(x=>x==='ok'),g.filter(x=>x!=='ok').slice(0,4));
  const recBtns=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#panel-record .obs-ctl button,#panel-record .segmented button,#panel-record .sw button,#save-entry,#clear-entry')].filter(e=>A.vis(e)));});
  ok(tag+': Record: the timer, the format switch, the stopwatch and Save incident are at least 44 x 44 px and 4 px apart',recBtns.n>=10&&!recBtns.small.length&&recBtns.near>=4,recBtns);
  /* while observing, the bar's buttons */
  await p.evaluate(()=>document.getElementById('obsStart').click());await sleep(700);
  const bar=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#obsBar button')].filter(e=>A.vis(e)));});
  ok(tag+': while observing, the bar\'s buttons are at least 44 x 44 px and 4 px apart',bar.n>=2&&!bar.small.length&&bar.near>=4,bar);
  await p.evaluate(()=>document.getElementById('obsEnd').click());await sleep(400);if(await uiDlg(p))await uiPress(p,(await uiDlg(p)).buttons.slice(-1)[0]);await sleep(300);
  await view(p,'incidents');
  const inc=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#inc-table [data-edit],#inc-table [data-del]')].filter(e=>A.vis(e)));});
  ok(tag+': Incidents: Edit and Delete are at least 44 x 44 px and 4 px apart',inc.n>=40&&!inc.small.length&&inc.near>=4,inc);
  const incOther=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#panel-incidents button.btn:not([data-edit]):not([data-del])')].filter(e=>A.vis(e)));});
  ok(tag+': Incidents: the other buttons are at least 44 px tall',!incOther.small.length,incOther);
  await view(p,'background');
  judgeRows('Background samples',await rowsOf('#panel-background'));
  g=await rowTaps(['bga-a_acad','bgc-c_staff_att','bgp-p_whine','bgse-se_sleep']);
  ok(tag+': Background samples: a tap anywhere on a row\'s words ticks or unticks it',g.every(x=>x==='ok'),g.filter(x=>x!=='ok').slice(0,4));
  const bg=await p.evaluate(()=>{const A=window.__a6;return A.report([...document.querySelectorAll('#bg-table [data-delsample],#bg-save,#bg-delete-all')].filter(e=>A.vis(e)));});
  ok(tag+': Background samples: Delete, Save sample and Delete all are at least 44 x 44 px and 4 px apart',bg.n>=40&&!bg.small.length&&bg.near>=4,bg);
  const o=await noOverflow(p);ok(tag+': no sideways scrolling of the page',o.sw<=o.cw,o);
  ok(tag+': still a coarse pointer when measured',await p.evaluate(()=>matchMedia('(pointer:coarse)').matches));
  await view(p,'record');await p.screenshot({path:OUT+'abc1-'+W+'x'+H+'.png'});
  await ctx.close();
}

/* the same three forms inside the workstation, where each one sits in a frame narrower than the screen */
async function shellTouch(br,W,H){
  const tag=`touch ${W}x${H}, in the workstation`;const ctx=await fresh(br,{viewport:{width:W,height:H},hasTouch:true});
  const page=await open(ctx,BASE+'/'+ED+'/index.html',tag);
  const frameOf=async id=>{await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000}).catch(()=>{});await sleep(1300);
    const fr=page.frames().find(f=>f.url().includes(encodeURI(FILE[id]))||f.url().includes(FILE[id]));
    if(fr){await fr.evaluate(()=>{window.confirm=()=>true;document.querySelector('#simBtn,#btnSim,#load-demo,#btnLoadExample').click();});await sleep(1700);}
    return fr;};
  const fview=(fr,v)=>fr.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v).then(()=>sleep(400));
  let fr=await frameOf('MT-1');
  if(!fr)ok(tag+': MT-1 opens',false);else{await fview(fr,'sheet');
    const r=await fr.evaluate(()=>{const A=window.__a6,B=[...document.querySelectorAll('#ivWrap button')].filter(e=>A.vis(e)).map(e=>A.box(e)),de=document.documentElement;
      return {n:B.length,minW:Math.round(Math.min(...B.map(b=>b.w))*10)/10,minH:Math.round(Math.min(...B.map(b=>b.h))*10)/10,sw:de.scrollWidth,cw:de.clientWidth};});
    ok(tag+': MT-1: every mark at least 44 x 44 px, and the sheet fits its frame without sideways scrolling',r.n>0&&r.minW>=44&&r.minH>=44&&r.sw<=r.cw,r);}
  fr=await frameOf('TI-1');
  if(!fr)ok(tag+': TI-1 opens',false);else{await fview(fr,'sheet');
    const r=await fr.evaluate(()=>{const A=window.__a6,L=[...document.querySelectorAll('#piTbl input[type=checkbox]')].filter(e=>A.vis(e)).map(i=>A.box(i.closest('label.ti-ck')||i));
      return {n:L.length,minW:Math.min(...L.map(b=>b.w)),minH:Math.min(...L.map(b=>b.h))};});
    ok(tag+': TI-1: every bare tick box sits in a tappable box of at least 44 x 44 px',r.n>=12&&r.minW>=44&&r.minH>=44,r);}
  fr=await frameOf('ABC-1');
  if(!fr)ok(tag+': ABC-1 opens',false);else{await fview(fr,'record');
    const r=await fr.evaluate(()=>{const A=window.__a6,ins=[...document.querySelectorAll('#panel-record .opt input[type=checkbox]')].filter(e=>A.vis(e));
      const c=ins.map(i=>{const l=i.labels&&i.labels[0],b=A.box(l||i);return {l:b.l,m:(b.t+b.b)/2};});let min=Infinity;
      for(const a of c)for(const b of c){if(a===b||Math.abs(a.l-b.l)>20)continue;const d=Math.abs(a.m-b.m);if(d>=1&&d<min)min=d;}
      const de=document.documentElement;return {n:ins.length,minPitch:Math.round(min*10)/10,sw:de.scrollWidth,cw:de.clientWidth};});
    ok(tag+': ABC-1: the recording rows sit at least 40 px apart, and nothing runs past the frame',r.n>=80&&r.minPitch>=40&&r.sw<=r.cw,r);}
  await page.screenshot({path:OUT+'shell-'+W+'x'+H+'.png'});
  await ctx.close();
}

/* ------------------------------------------------------------------ 2. the computer layout */
const LAYOUT_VIEWS={'MT-1':['sheet','log'],'TI-1':['setup','sheet','sum'],'ABC-1':['record','incidents','background','analysis']};
const layoutOf=p=>p.evaluate(()=>{const R=document.querySelector('main')||document.body,out=[];
  for(const e of R.querySelectorAll('*')){if(e.matches('label.ti-ck'))continue;const r=e.getBoundingClientRect();if(!r.width&&!r.height)continue;
    out.push(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+' '+[r.left,r.top,r.width,r.height].map(v=>Math.round(v*10)/10).join(','));}
  out.push('page '+document.documentElement.scrollWidth+'x'+document.documentElement.scrollHeight);return out;});
async function record(br,id,o){/* the simulated record, saved by the form before this package (or now, without A6_BASE) */
  const ctx=await fresh(br,o);const p=await open(ctx,WAS[id]||NOW[id],'record '+id,!!WAS[id]);await sim(p);const t=await ownSave(p);await ctx.close();return t;}
async function computerLayout(br){
  for(const id of ['MT-1','TI-1','ABC-1']){
    const text=await record(br,id);const sig={};
    for(const which of ['was','now']){const ctx=await fresh(br,{});const p=await open(ctx,which==='was'?WAS[id]:NOW[id],'mouse '+which+' '+id,which==='was');
      await ownOpen(p,text);sig[which]={};
      for(const v of LAYOUT_VIEWS[id]){await view(p,v);await p.evaluate(()=>window.scrollTo(0,0));await sleep(150);sig[which][v]=await layoutOf(p);}
      await ctx.close();}
    for(const v of LAYOUT_VIEWS[id]){const a=sig.was[v],b=sig.now[v],diff=[];
      for(let i=0;i<Math.max(a.length,b.length)&&diff.length<4;i++)if(a[i]!==b[i])diff.push({was:a[i],now:b[i]});
      ok('mouse 1180x820: '+id+' '+v+': every element sits where it did before this package ('+a.length+' elements)',!diff.length&&a.length===b.length,diff);}
  }
}

/* ------------------------------------------------------------------ 3. the same taps, the same marks */
async function mtTaps(p){
  /* the timer: two marks scored with its buttons as they come due, then marks on the sheet */
  await view(p,'sheet');
  const tapSel=async sel=>{const r=await tapOn(p,sel,0.5,0.5);return r.on?'':sel+' '+JSON.stringify(r);};
  const miss=[];miss.push(await tapSel('#tmrStart'));await sleep(5700);miss.push(await tapSel('#tmr .tmr-btns [data-rec="1"]'));await sleep(5100);
  miss.push(await tapSel('#tmr .tmr-btns [data-rec="0"]'));await sleep(200);miss.push(await tapSel('#tmrStart'));await sleep(300);
  for(const [i,v] of [[4,'1'],[5,'0'],[6,'x'],[7,'1'],[7,'1'],[8,'0'],[59,'1'],[30,'x']])miss.push(await tapSel('#ivWrap [data-mk="'+i+'"][data-v="'+v+'"]'));
  await p.evaluate(()=>{const e=document.querySelector('[data-m="ioaOn"]');e.value='Yes';e.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(200);
  for(const [i,v] of [[4,'1'],[5,'1'],[6,'0'],[0,'x']])miss.push(await tapSel('#ivWrap [data-io="'+i+'"][data-v="'+v+'"]'));
  return {miss:miss.filter(Boolean),got:await p.evaluate(()=>({marks:S.marks,ioa:S.ioa,sum:document.getElementById('sumMetrics').innerText.replace(/\s+/g,' '),ioaOut:document.getElementById('ioaOut').innerText.replace(/\s+/g,' ')}))};
}
async function tiTaps(p){
  await view(p,'sheet');const miss=[];const tapSel=async(sel,fx,fy)=>{const r=await tapOn(p,sel,fx==null?0.5:fx,fy==null?0.5:fy);if(!r.on)miss.push(sel+' '+JSON.stringify(r));};
  /* the boxes: tapped on the box itself, where both forms take a tap */
  await tapSel('#piTbl input[data-s="1"][data-f="crit"]');await tapSel('#piTbl input[data-o="1"][data-f="ioa"]');await tapSel('#piTbl input[data-o="3"][data-f="ioa"]');await tapSel('#piTbl input[data-o="3"][data-f="ioa"]');
  await view(p,'setup');await tapSel('#stepTbl input[data-s="3"][data-f="crit"]');await view(p,'sheet');
  /* the runner, into a new column: one step at a time, then every step listed */
  await tapSel('#tiRunOpen');await sleep(300);
  await p.evaluate(()=>{const s=document.getElementById('tiRunCol'),o=[...s.options].pop();s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
  await tapSel('#tiRun button[data-act="type"][data-v="Unannounced"]');await tapSel('#tiRunStart');await sleep(500);
  for(const v of ['C','EC','EO','NA','C','C'])await tapSel('#tiRunWork button[data-act="code"][data-v="'+v+'"]');
  await tapSel('#tiRun .ti-run-strip button[data-i="9"]');await tapSel('#tiRunWork button[data-act="code"][data-v="EC"]');
  await tapSel('#tiRun button[data-act="mode"][data-v="all"]');await sleep(400);
  for(const [i,v] of [[11,'C'],[12,'EO'],[13,'C'],[6,'NA']])await tapSel('#tiRunWork button[data-act="code"][data-i="'+i+'"][data-v="'+v+'"]');
  await tapSel('#tiRunEnd');await sleep(400);
  const q=await uiDlg(p);if(q)await uiPress(p,q.buttons.slice(-1)[0]);await sleep(300);
  await tapSel('#tiRun button[data-act="save"]');await sleep(500);const q2=await uiDlg(p);if(q2)await uiPress(p,q2.buttons.slice(-1)[0]);await sleep(500);
  return {miss,got:await p.evaluate(()=>({nObs:S.nObs,cells:S.cells,opp:S.opp,obs:S.obs.map(o=>({ioa:!!o.ioa,type:o.type,ctx:o.ctx,date:o.date})),crit:S.steps.map(s=>!!s.crit),notes:(S.meta||{}).notes||'',
    sum:(document.querySelector('#sumOut,#summary,.only-sum')||document.body).innerText.replace(/\s+/g,' ').slice(0,4000)}))};
}
async function abcTaps(p){
  await view(p,'record');const miss=[];const tapSel=async(sel,fx,fy)=>{const r=await tapOn(p,sel,fx==null?0.5:fx,fy==null?0.5:fy);if(!r.on)miss.push(sel+' '+JSON.stringify(r));};
  await p.evaluate(()=>{const s=(k,v)=>{const e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};s('e-date','2026-10-01');s('e-time','09:42');s('e-activity','independent math');});
  for(const id of ['a-a_acad','a-a_signal','b-b_scream','p-p_whine','c-c_dem_rem','c-c_staff_att','i-i_stopped','r-r_bip','se-se_sleep','c-c_staff_att'])await tapSel('label[for="'+id+'"]');
  await tapSel('#save-entry');await sleep(300);
  await view(p,'background');
  await p.evaluate(()=>{const s=(k,v)=>{const e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};s('bg-date','2026-10-01');s('bg-time','10:05');});
  for(const id of ['bga-a_acad','bgc-c_staff_att','bgc-c_help','bgp-p_motor','bgse-se_sleep'])await tapSel('label[for="'+id+'"]');
  await tapSel('#bg-save');await sleep(300);
  return {miss,got:await p.evaluate(()=>({entries:state.entries.map(e=>Object.assign({},e,{id:'-'})),samples:state.samples.map(s=>Object.assign({},s,{id:'-'}))}))};
}
async function sameTaps(br){
  const plans=[['MT-1',mtTaps,false],['TI-1',tiTaps,true],['ABC-1',abcTaps,false]];
  for(const [id,fn,withSim] of plans){
    const text=withSim?await record(br,id):null;const res={};
    for(const which of ['was','now']){const ctx=await fresh(br,{hasTouch:true});const p=await open(ctx,which==='was'?WAS[id]:NOW[id],'taps '+which+' '+id,which==='was');
      if(text)await ownOpen(p,text);res[which]=await fn(p);await ctx.close();}
    ok('touch 1180x820: '+id+': every tap landed on the target meant, before and now',!res.was.miss.length&&!res.now.miss.length,{was:res.was.miss.slice(0,3),now:res.now.miss.slice(0,3)});
    const a=JSON.stringify(res.was.got),b=JSON.stringify(res.now.got);let at=0;while(at<a.length&&a[at]===b[at])at++;
    ok('touch 1180x820: '+id+': the same taps score the same marks as before this package',a===b,a===b?{bytes:a.length}:{was:a.slice(Math.max(0,at-80),at+200),now:b.slice(Math.max(0,at-80),at+200)});
    if(id==='MT-1')ok('touch 1180x820: MT-1: the taps scored what they were meant to (timer +, - into intervals 1 and 2; the sheet\'s marks; IOA marks)',
      (()=>{const m=res.now.got.marks,i=res.now.got.ioa;return m[0]==='1'&&m[1]==='0'&&m[4]==='1'&&m[5]==='0'&&m[6]==='x'&&!m[7]&&m[8]==='0'&&m[59]==='1'&&m[30]==='x'&&i[4]==='1'&&i[5]==='1'&&i[6]==='0'&&i[0]==='x';})(),
      {marks:res.now.got.marks,ioa:res.now.got.ioa});
    if(id==='ABC-1')ok('touch 1180x820: ABC-1: the incident and the sample hold what was tapped',
      (()=>{const e=res.now.got.entries[0]||{},s=res.now.got.samples[0]||{};return res.now.got.entries.length===1&&JSON.stringify(e.antecedents)==='["a_acad","a_signal"]'&&JSON.stringify(e.behaviors)==='["b_scream"]'&&
        JSON.stringify(e.consequences)==='["c_dem_rem"]'&&e.immediate==='i_stopped'&&JSON.stringify(e.resolution)==='["r_bip"]'&&JSON.stringify(e.settingEvents)==='["se_sleep"]'&&
        JSON.stringify(s.antecedents)==='["a_acad"]'&&JSON.stringify(s.events.slice().sort())==='["c_help","c_staff_att"]';})(),res.now.got);
    if(id==='TI-1')ok('touch 1180x820: TI-1: the runner wrote observation #5 and the boxes the taps ticked',
      (()=>{const g=res.now.got;return g.nObs===5&&g.cells['0_4']==='C'&&g.cells['1_4']==='EC'&&g.cells['2_4']==='EO'&&g.cells['3_4']==='NA'&&g.cells['9_4']==='EC'&&g.cells['12_4']==='EO'&&g.obs[4].type==='Unannounced'&&g.obs[1].ioa===!JSON.parse(text).S.obs[1].ioa;})(),
      {nObs:res.now.got.nObs,col5:Object.keys(res.now.got.cells).filter(k=>/_4$/.test(k)).map(k=>k+'='+res.now.got.cells[k])});
  }
}

/* ------------------------------------------------------------------ 4. ABC-1's simulation asks first */
async function abcSim(br){
  const tag='ABC-1 Load simulation';const ctx=await fresh(br,{});const p=await open(ctx,NOW['ABC-1'],tag);
  const set=(k,v)=>p.evaluate(([k,v])=>{const e=document.getElementById(k);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  await set('h-client','Real Student A');
  await p.evaluate(()=>{document.getElementById('a-a_acad').click();document.getElementById('b-b_agg_staff').click();});await set('e-narrative','Typed incident: the worksheet was handed out and the student pushed it away.');
  await p.evaluate(()=>document.getElementById('save-entry').click());await sleep(300);
  await set('e-narrative','An incident still being entered');await p.evaluate(()=>{document.getElementById('b-b_scream').click();});
  const look=()=>p.evaluate(()=>({client:document.getElementById('h-client').value,n:state.entries.length,samples:state.samples.length,narr:document.getElementById('e-narrative').value,
    scream:document.getElementById('b-b_scream').checked,fn:document.getElementById('a-function').value}));
  const before=await look();
  ok(tag+': the real work is in place before the question',before.client==='Real Student A'&&before.n===1&&before.scream,before);
  await p.evaluate(()=>document.getElementById('load-demo').click());await sleep(400);
  const q=await uiDlg(p);
  ok(tag+': asks first, with the question the other forms ask (anything already entered will be replaced), and Cancel',
    !!q&&/^Load the simulated record\?$/.test(q.head)&&/Anything already entered will be replaced\./.test(q.body)&&JSON.stringify(q.buttons)==='["Cancel","Load"]',q);
  ok(tag+': nothing has changed while the question is open',JSON.stringify(await look())===JSON.stringify(before));
  await uiPress(p,'Cancel');await sleep(300);
  const afterCancel=await look();
  ok(tag+': Cancel keeps the typed header, the saved incident and the one being entered',JSON.stringify(afterCancel)===JSON.stringify(before)&&!(await uiDlg(p)),afterCancel);
  await p.evaluate(()=>document.getElementById('load-demo').click());await sleep(400);await uiPress(p,'Load');await sleep(900);
  const loaded=await look();
  ok(tag+': Load replaces them: 46 incidents, 60 samples, the simulated header, the entry form cleared, the function set to escape',
    loaded.n===46&&loaded.samples===60&&/^SIMULATED/.test(loaded.client)&&loaded.narr===''&&!loaded.scream&&loaded.fn==='escape',loaded);
  ok(tag+': no browser dialog',!p.__native.length,p.__native);
  await ctx.close();
  /* a test that stubs window.confirm gets the simulation at once */
  const c2=await fresh(br,{});const p2=await open(c2,NOW['ABC-1'],tag+' (stub)');await stub(p2);
  await p2.evaluate(()=>document.getElementById('load-demo').click());await sleep(900);
  ok(tag+': with window.confirm stubbed, it loads at once without showing the question',!(await uiDlg(p2))&&(await p2.evaluate(()=>state.entries.length))===46);
  await c2.close();
}

/* ------------------------------------------------------------------ 5. ABC-1's Open data */
async function abcFiles(br){
  const tag='ABC-1 Open data';const dir=OUT+'files/';fs.mkdirSync(dir,{recursive:true});
  const save=async(id,name)=>{const ctx=await fresh(br,{});const p=await open(ctx,NOW[id],'save '+id);await sim(p);const t=await ownSave(p);await ctx.close();if(!t)return null;fs.writeFileSync(dir+name,t);return dir+name;};
  const files={mt1:await save('MT-1','MT-1_saved.json'),ob1:FILE['OB-1']?await save('OB-1','OB-1_saved.json'):null,dd1:FILE['DD-1']?await save('DD-1','DD-1_saved.json'):null,
    sp1:FILE['SP-1']?await save('SP-1','SP-1_saved.json'):null,abc:await save('ABC-1','ABC-1_saved.json')};
  fs.writeFileSync(dir+'CASE_Sample.json',JSON.stringify({form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:{client:'Sample Student'},forms:{},facts:{}}));files.cas=dir+'CASE_Sample.json';
  fs.writeFileSync(dir+'PACKET_Sample.json',JSON.stringify({form:'PACKET',rev:'2026-09',packet:{client:'Sample Student'}}));files.pkt=dir+'PACKET_Sample.json';
  fs.writeFileSync(dir+'ABC_incidents.csv','﻿id,date,time\n1,2026-10-01,09:42\n');files.csv=dir+'ABC_incidents.csv';
  fs.writeFileSync(dir+'list.json','[1,2,3]');files.arr=dir+'list.json';
  fs.writeFileSync(dir+'AD-1_saved.json',JSON.stringify({version:'AD-1 2026-09',fields:{},tables:{}}));files.ad1=dir+'AD-1_saved.json';
  const cases=[['mt1','an MT-1 file',/Form MT-1/],['ob1','an OB-1 file (no form tag)',/Form OB-1/],['dd1','a DD-1 file (no form tag)',/Form DD-1/],['sp1','an SP-1 file (no form tag)',/Form SP-1/],['cas','a case file',/case file.*Open case/],['pkt','a student packet',/student packet.*Open packet/],
    ['csv','a .csv',/not a file saved with Save data/],['arr','a JSON list',/./],['ad1','an AD-1 file (its tag in "version")',/Form AD-1/]];
  const ctx=await fresh(br,{});const p=await open(ctx,NOW['ABC-1'],tag);await sim(p);await view(p,'record');
  const look=()=>p.evaluate(()=>({n:state.entries.length,s:state.samples.length,client:document.getElementById('h-client').value,fn:state.faFunction,first:state.entries[0]&&state.entries[0].id}));
  const before=await look();
  for(const [k,what,re] of cases){if(!files[k]){console.log('NOTE no '+what+' to try');continue;}
    await p.setInputFiles('#file-input',files[k]);await sleep(700);const q=await uiDlg(p),after=await look(),status=await p.evaluate(()=>document.getElementById('data-status').textContent);
    ok(tag+' with '+what+': says so on the tab in use, names what the file is, and changes nothing',
      !!q&&q.head==='That file could not be read as a saved ABC-1 record.'&&re.test(q.body)&&/Nothing on this form was changed/.test(q.body)&&JSON.stringify(after)===JSON.stringify(before)&&/could not be read as a saved ABC-1 record/.test(status),
      {q,changed:JSON.stringify(after)!==JSON.stringify(before)});
    if(q)await uiPress(p,'OK');await sleep(150);}
  ok(tag+': no browser dialog',!p.__native.length,p.__native);
  await ctx.close();
  /* its own file, and older ones */
  const opens=async(id,file,check,name)=>{const c=await fresh(br,{});const q=await open(c,NOW[id],'open '+id);await q.setInputFiles(id==='ABC-1'?'#file-input':'#fileIn',file);await sleep(900);
    const r=await q.evaluate(check);const d=await uiDlg(q);ok(name,r.ok&&!d,Object.assign({},r,{dialog:d}));await c.close();};
  const own=JSON.parse(fs.readFileSync(files.abc,'utf8'));
  await opens('ABC-1',files.abc,()=>({ok:state.entries.length===46&&state.samples.length===60&&/^Loaded 46 incidents and 60 background samples/.test(document.getElementById('data-status').textContent),n:state.entries.length}),
    tag+': its own file opens (46 incidents, 60 samples)');
  const oldShape={version:1,exported:'2026-05-01T14:00:00.000Z',header:{client:'Old ABC Student',observer:'Observer B',location:'Room 4',start:'2026-04-20',end:'2026-04-30',target:'Screaming'},
    entries:[Object.assign({},own.entries[0],{id:'old1'})],samples:[Object.assign({},own.samples[0],{id:'olds1'})]};
  fs.writeFileSync(dir+'ABC_old-shape.json',JSON.stringify(oldShape));
  await opens('ABC-1',dir+'ABC_old-shape.json',()=>({ok:state.entries.length===1&&state.samples.length===1&&document.getElementById('h-client').value==='Old ABC Student',client:document.getElementById('h-client').value}),
    tag+': a record in an older shape (no format, no function) opens');
  if(A6_OLD){
    for(const [id,check] of [['ABC-1',n=>`state.entries.length===${n.entries.length}&&state.samples.length===${(n.samples||[]).length}`],['MT-1',n=>`Object.keys(S.marks).filter(k=>S.marks[k]).length===${Object.keys(n.S.marks||{}).filter(k=>n.S.marks[k]).length}&&S.meta.client===${JSON.stringify(n.S.meta.client)}`],
        ['TI-1',n=>`S.steps.length===${n.S.steps.length}&&S.nObs===${n.S.nObs}&&Object.keys(S.cells).filter(k=>S.cells[k]).length===${Object.keys(n.S.cells||{}).filter(k=>n.S.cells[k]).length}`]]){
      const f=path.join(A6_OLD,id+'.json');if(!fs.existsSync(f)){console.log('NOTE no '+f);continue;}
      const n=JSON.parse(fs.readFileSync(f,'utf8'));
      await opens(id,f,new Function('return {ok:!!('+check(n)+')}'),id+': the file saved by an earlier version opens whole ('+f+')');}
  } else console.log('NOTE A6_OLD not set: files saved by an earlier version not tried');
  /* the workstation's restore of the record (through Open data, quietly) says nothing */
  const c3=await fresh(br,{});const r=await open(c3,NOW['ABC-1'],'restore ABC-1');
  await r.evaluate(t=>new Promise(res=>{const h=ev=>{if(ev.data&&ev.data.nbh==='restored'){window.removeEventListener('message',h);res(ev.data.report);}};window.addEventListener('message',h);
    window.postMessage({nbh:'restore',snap:{total:0,data:{},own:t}},'*');setTimeout(()=>res(null),8000);}),fs.readFileSync(files.abc,'utf8'));await sleep(600);
  const rs=await r.evaluate(()=>({n:state.entries.length,toasts:[...document.querySelectorAll('#nbhToasts .nbh-toast')].map(t=>t.textContent)}));
  ok(tag+': the workstation\'s restore of the record brings it back and says nothing',rs.n===46&&!(await uiDlg(r))&&!rs.toasts.some(t=>/could not be read/.test(t)),rs);
  await c3.close();
}

/* ------------------------------------------------------------------ 6. print */
async function printSame(br){
  const pages=b=>{const m=b.toString('latin1').match(/\/Type\s*\/Page(?![s])/g);return m?m.length:0;};
  for(const [label,o] of [['mouse',{}],['touch',{hasTouch:true}]]){
    const dirs={was:OUT+'print/'+label+'-was/',now:OUT+'print/'+label+'-now/'};Object.values(dirs).forEach(d=>{fs.rmSync(d,{recursive:true,force:true});fs.mkdirSync(d,{recursive:true});});
    const counts={};
    for(const id of ['MT-1','TI-1','ABC-1']){
      const text=await record(br,id,o);
      for(const which of ['was','now'])for(const name of ['blank','simulated']){
        /* one clock for both, or a time field filled in as the page opens (ABC-1's start time) differs by a minute */
        const ctx=await fresh(br,Object.assign({viewport:{width:1280,height:900}},o));await ctx.clock.setFixedTime(new Date(2026,9,5,9,0,0)).catch(()=>{});
        const p=await open(ctx,which==='was'?WAS[id]:NOW[id],'print '+label+' '+which+' '+id,which==='was');
        if(name==='simulated')await ownOpen(p,text);
        await p.emulateMedia({media:'print'});await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await sleep(400);
        const buf=await p.pdf({path:dirs[which]+id+'-'+name+'.pdf',preferCSSPageSize:true,printBackground:true});counts[label+' '+which+' '+id+' '+name]=pages(buf);
        await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await ctx.close();}
    }
    let cmp=null;try{cmp=execFileSync('python3',[__dirname+'/compare-print.py',dirs.was,dirs.now],{encoding:'utf8'});}catch(e){cmp=null;}
    if(cmp){const m=/identical: (\d+) of (\d+)/.exec(cmp);const same=!!m&&m[1]===m[2]&&m[2]==='6';
      ok('print ('+label+'): the three forms print the same pages as before this package ('+A6_BASE+'), blank and simulated',same,cmp.trim().split('\n'));}
    else{const k=Object.keys(counts).filter(x=>/ was /.test(x));ok('print ('+label+'): the same number of pages as before this package (no PyMuPDF for a page-by-page comparison)',k.every(x=>counts[x]===counts[x.replace(' was ',' now ')]),counts);}
    console.log('print pages ('+label+')',JSON.stringify(counts));
  }
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  console.log('sprint A6 on',ED,'at',BASE);
  const br=await chromium.launch();
  /* the forms before this package, served beside the checkout when the server's root is WS_ROOT, else from the disk */
  let base=COMPARE;
  if(base){fs.mkdirSync(OUT+'base/',{recursive:true});
    for(const id of ['MT-1','TI-1','ABC-1']){let buf=null;try{buf=execFileSync('git',['show',A6_BASE+':'+ED+'/'+FILE[id]],{cwd:ROOT,maxBuffer:64<<20,stdio:['ignore','pipe','ignore']});}catch(e){}
      if(!buf){base=false;break;}fs.writeFileSync(OUT+'base/'+FILE[id],buf);WAS[id]=BASE+'/qa/out/sprint-a6/base/'+encodeURI(FILE[id]);}
    if(base){const c=await br.newContext();const q=await c.newPage();const r=await q.goto(WAS['MT-1']).catch(()=>null);await c.close();
      if(!r||!r.ok())for(const id of ['MT-1','TI-1','ABC-1'])WAS[id]='file://'+OUT+'base/'+FILE[id];}}
  if(!base){for(const k of Object.keys(WAS))delete WAS[k];console.log('NOTE the forms at '+A6_BASE+' are not available for '+ED+': the comparisons with the forms before this package (2, 3, 6) are skipped');}
  const on=k=>!ONLY||ONLY.includes(k);
  if(on('touch')){for(const [W,H] of [[1180,820],[820,1180]]){await mtTouch(br,W,H);await tiTouch(br,W,H);await abcTouch(br,W,H);await shellTouch(br,W,H);}await mtPhone(br);}
  if(base&&on('layout'))await computerLayout(br);
  if(base&&on('taps'))await sameTaps(br);
  if(on('sim'))await abcSim(br);
  if(on('files'))await abcFiles(br);
  if(base&&on('print'))await printSame(br);
  ok('no page error and no console error in the forms as they are now',!errs.length,errs);
  if(baseErrs.length)console.log('NOTE errors in the forms before this package:',JSON.stringify(baseErrs).slice(0,600));
  console.log(fails?'RESULT: '+fails+' failure(s), '+passes+' passed':'RESULT: all '+passes+' passed');
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
