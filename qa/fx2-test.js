/* v24.92 Forms DM-1, IC-1 and RR-1 on screen (the design review of 10/28). WebKit (Safari's engine) with a touch
   screen at the width of a form on an iPad sideways (860 px); Chromium at 1300 px for a laptop. Simulated data only.
   1. every sheet: nothing wider than the screen; every box at 16 px or more; no example of more than a few characters
      left inside a box (a box the case fills says so inside it: "From Form IC-1 (the case fills it where it can)");
   2. the masthead's description is two lines with "Show the full introduction", which opens and closes it;
   3. section headings in sentence case on screen ("1. Why we are asking"), as written while the page prints;
   4. a table of entries is cards on the iPad (each box under its column's name) and a table on the laptop;
   5. DM-1: a contact with a name is one summary line; Change shows its boxes; a blank contact waits behind "Add a
      contact", which brings it; the Packet sheet lists the forms in this file, "Show all 45 forms" the rest;
   6. DM-1: blank medication rows wait behind "Add a medication" on the iPad, which brings one; while the page measures
      itself for paper they are rows again (the printout's page breaks unchanged);
   7. IC-1: a procedure's decision is one large button per answer; a tap sets the list (the saved value) and a second
      tap clears it; "Read with the parent" hides part 6 and the staff's sheets, "Back to staff view" brings them back;
   8. RR-1: the school calendar folds to "Show the school calendar (9 dates or ranges)" and opens;
   9. choices of two to four short answers are buttons on the iPad (DM-1's Sex, Lives with the student);
  10. no page errors.  usage: node qa/fx2-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const file=id=>L.forms().find(x=>x.id===id).file;
(async()=>{const wk=await pw.webkit.launch(),cr=await pw.chromium.launch();const errs=[];
  const ipad=await wk.newContext({viewport:{width:860,height:900},hasTouch:true}),lap=await cr.newContext({viewport:{width:1300,height:900}});
  const open=async(ctx,id,sim=true)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    await p.goto(BASE+'/NBH-Workstation/'+file(id));await sleep(1800);if(sim){await L.loadSim(p);await sleep(2200);}return p;};
  const view=async(p,v)=>{await p.evaluate(v=>document.querySelector('[data-view="'+v+'"]').click(),v);await sleep(600);};
  const pages={};
  for(const id of ['DM-1','IC-1','RR-1']){const p=await open(ipad,id);pages[id]=p;
    const views=await p.evaluate(()=>[...new Set([...document.querySelectorAll('[data-view]')].map(b=>b.dataset.view))]);const bad=[];
    for(const v of views){await view(p,v);
      const r=await p.evaluate(()=>{const sh=[...document.querySelectorAll('.sheet')].find(s=>s.offsetParent);if(!sh)return null;const vis=e=>e.offsetParent&&e.getBoundingClientRect().width>2;
        const F=[...sh.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select:not(.nbh-seg-src),textarea')].filter(vis);
        return {wide:document.documentElement.scrollWidth-document.documentElement.clientWidth,small:F.filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.name||e.id).slice(0,3),
          ph:F.filter(e=>(e.getAttribute('placeholder')||'').trim().length>8&&!/^From Form [A-Z]{2,3}-\d/.test(e.getAttribute('placeholder'))).map(e=>(e.name||e.id)+':'+e.getAttribute('placeholder')).slice(0,3)};});
      if(r&&(r.wide>1||r.small.length||r.ph.length))bad.push(v+' '+JSON.stringify(r));}
    ok('1 '+id+' every sheet: nothing wider than the screen, boxes at 16 px, no example left in a box',!bad.length,bad);}
  /* 2, 3 */
  const ic=pages['IC-1'];await view(ic,'consent');
  const m=await ic.evaluate(async()=>{const p=document.querySelector('header.nbh-mast p.nbh-sub'),b=document.querySelector('.fx2-more');const h0=p.getBoundingClientRect().height;b.click();await new Promise(r=>setTimeout(r,100));
    const h1=p.getBoundingClientRect().height,t1=b.textContent;b.click();await new Promise(r=>setTimeout(r,100));return {h0,h1,t0:'Show the full introduction',t1,lh:parseFloat(getComputedStyle(p).lineHeight)||20,back:p.getBoundingClientRect().height};});
  ok('2 the description is two lines with "Show the full introduction", which opens and closes it',m.h0<=m.lh*2.2&&m.h1>m.h0*1.5&&m.t1==='Hide the full introduction'&&Math.abs(m.back-m.h0)<2,m);
  const hd=await ic.evaluate(async()=>{const h=[...document.querySelectorAll('#consent h3.sub')].find(x=>/^1\./.test(x.textContent));const s=h.textContent;dispatchEvent(new Event('beforeprint'));await new Promise(r=>setTimeout(r,50));
    const pr=h.textContent;dispatchEvent(new Event('afterprint'));await new Promise(r=>setTimeout(r,50));return {s,pr,after:h.textContent};});
  ok('3 headings in sentence case on screen, as written on paper',hd.s==='1. Why we are asking'&&hd.pr==='1. Why We Are Asking'&&hd.after===hd.s,hd);
  /* 4 */
  const dm=pages['DM-1'];await view(dm,'health');
  const card=await dm.evaluate(()=>{const t=document.getElementById('medTbl'),r=t.tBodies[0].rows[0],c=r.cells[0];return {tr:getComputedStyle(r).display,lab:getComputedStyle(c,'::before').content,inp:Math.round(c.querySelector('input').getBoundingClientRect().width)};});
  const lp=await open(lap,'DM-1');await view(lp,'health');
  const tab=await lp.evaluate(()=>{const t=document.getElementById('medTbl');return {t:getComputedStyle(t).display,tr:getComputedStyle(t.tBodies[0].rows[0]).display,th:getComputedStyle(t.tHead).display};});
  ok('4 a table of entries: cards on the iPad (each box under its column name, wide enough to read), a table on the laptop',card.tr==='grid'&&/Medication/.test(card.lab)&&card.inp>=240&&tab.t==='table'&&tab.tr==='table-row'&&tab.th!=='none',{card,tab});
  /* 5 */
  await view(dm,'student');
  const c=await dm.evaluate(async()=>{const w=document.getElementById('conWrap'),cs=[...w.querySelectorAll('.card.con')];const c0=cs[0];
    const sum=c0.querySelector('.fx2-csumt').textContent,closed=getComputedStyle(c0.querySelector('.ident')).display;c0.querySelector('.fx2-csum button').click();await new Promise(r=>setTimeout(r,80));
    const opened=getComputedStyle(c0.querySelector('.ident')).display,btn=c0.querySelector('.fx2-csum button').textContent;
    return {sum,closed,opened,btn,n:cs.length};});
  ok('5 DM-1 a contact with a name is one summary line; Change shows its boxes',/^Sample Parent A, Mother; educational rights: yes, shared; lives with the student: part-time; \(000\) 000-0001$/.test(c.sum)&&c.closed==='none'&&c.opened!=='none'&&c.btn==='Done',c);
  const blank=await open(ipad,'DM-1',false);
  const bc=await blank.evaluate(async()=>{const w=document.getElementById('conWrap'),vis=()=>[...w.querySelectorAll('.card.con')].filter(c=>getComputedStyle(c).display!=='none').length;const v0=vis();
    document.querySelector('.fx2-conadd').click();await new Promise(r=>setTimeout(r,200));const v1=vis();return {v0,v1,n:w.querySelectorAll('.card.con').length,first:getComputedStyle(w.querySelector('.card.con .ident')).display};});
  ok('5 DM-1 an empty form shows one contact, open; "Add a contact" brings the next',bc.v0===1&&bc.v1===2&&bc.first!=='none',bc);
  await view(dm,'packet');
  const pk=await dm.evaluate(async()=>{const t=document.getElementById('pkTbl'),shown=()=>[...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display!=='none').length;const ticked=t.querySelectorAll('input[type=checkbox]:checked').length;
    const s0=shown(),b=document.querySelector('.fx2-pkall'),t0=b.textContent;b.click();await new Promise(r=>setTimeout(r,100));const s1=shown(),t1=b.textContent;b.click();await new Promise(r=>setTimeout(r,100));
    return {ticked,s0,t0,s1,t1,all:t.tBodies[0].rows.length,s2:shown()};});
  ok('5 DM-1 Packet: the forms in this file, "Show all" the rest, and back',pk.s0===pk.ticked&&pk.ticked>0&&pk.t0==='Show all '+pk.all+' forms'&&pk.s1===pk.all&&pk.t1==='Show only the '+pk.ticked+' forms in this file'&&pk.s2===pk.ticked,pk);
  /* 6 */
  await view(blank,'health');
  const tm=await blank.evaluate(async()=>{const t=document.getElementById('medTbl'),shown=()=>[...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display!=='none').length;const s0=shown(),b=t.parentElement.nextElementSibling;
    const txt=b.textContent;b.click();await new Promise(r=>setTimeout(r,150));return {s0,s1:shown(),txt,all:t.tBodies[0].rows.length};});
  ok('6 DM-1 blank medication rows wait behind "Add a medication", which brings one',tm.s0===1&&tm.s1===2&&tm.txt==='Add a medication'&&tm.all>2,tm);
  /* the rows waiting behind it are still rows while the page measures itself for paper (nbh-polish keeps a sheet's last
     blocks together by their measured height; a shorter table moved a page break) */
  const tmm=await blank.evaluate(()=>{const t=document.getElementById('medTbl'),h=document.documentElement;h.classList.add('nbh-pr-measure');
    const n=[...t.tBodies[0].rows].filter(r=>getComputedStyle(r).display!=='none').length;h.classList.remove('nbh-pr-measure');return {n,all:t.tBodies[0].rows.length};});
  ok('6 DM-1 while the page measures itself for paper every medication row counts',tmm.n===tmm.all&&tmm.all>2,tmm);
  /* 7 */
  await view(ic,'proc');
  const dec=await ic.evaluate(async()=>{const s=document.querySelector('[name="fa.dec"]'),g=s.nextElementSibling,bs=[...g.querySelectorAll('button')];const v0=s.value;
    bs[1].click();await new Promise(r=>setTimeout(r,60));const v1=s.value,p1=bs[1].getAttribute('aria-pressed');bs[1].click();await new Promise(r=>setTimeout(r,60));const v2=s.value;bs[0].click();
    return {wide:g.classList.contains('nbh-seg-wide'),n:bs.length,texts:bs.map(b=>b.textContent),v0,v1,p1,v2,h:Math.round(bs[0].getBoundingClientRect().height)};});
  ok('7 IC-1 a procedure\'s decision: one large button per answer; a tap sets it, a second clears it',dec.wide&&dec.n===3&&dec.texts[0]==='Yes, I consent to this procedure'&&dec.v1==='no'&&dec.p1==='true'&&dec.v2===''&&dec.h>=48,dec);
  await view(ic,'consent');
  const pv=await ic.evaluate(async()=>{const part6=[...document.querySelectorAll('#consent h3.sub')].find(h=>/How consent was obtained/i.test(h.textContent)),sig=document.querySelector('#consent .ic-sigs');
    const st=()=>({p6:getComputedStyle(part6).display,status:getComputedStyle(document.getElementById('statusBox')).display,sig:getComputedStyle(sig).display,rec:[...document.querySelectorAll('[data-view="record"]')].every(b=>getComputedStyle(b).display==='none'),
      fs:parseFloat(getComputedStyle(document.querySelector('#consent ul li')).fontSize),exit:getComputedStyle(document.querySelector('.fx2-pvexit')).display});
    const a=st();document.querySelector('#consent .fx2-pvbar button').click();await new Promise(r=>setTimeout(r,100));const b=st();document.querySelector('.fx2-pvexit').click();await new Promise(r=>setTimeout(r,100));return {a,b,c:st()};});
  ok('7 IC-1 "Read with the parent": part 6, the status and the staff\'s sheets out of sight, larger type, signatures kept; "Back to staff view" restores',
    pv.a.p6!=='none'&&pv.b.p6==='none'&&pv.b.status==='none'&&pv.b.sig!=='none'&&pv.b.rec&&pv.b.fs>=18&&pv.b.exit!=='none'&&pv.c.p6!=='none'&&pv.c.exit==='none'&&!pv.c.rec,pv);
  /* 8 */
  const rr=pages['RR-1'];await view(rr,'removals');
  const ns=await rr.evaluate(async()=>{const b=document.querySelector('.fx2-nsbar'),ed=document.getElementById('rlNsEdit');const t0=b.textContent,d0=getComputedStyle(ed).display;b.click();await new Promise(r=>setTimeout(r,100));
    return {t0,d0,t1:b.textContent,d1:getComputedStyle(ed).display};});
  ok('8 RR-1 the school calendar folds to one line and opens',/^Show the school calendar \(\d+ dates or ranges\)$/.test(ns.t0)&&ns.d0==='none'&&ns.t1==='Hide the school calendar'&&ns.d1!=='none',ns);
  /* 9 */
  await view(dm,'student');
  const sg=await dm.evaluate(()=>['s.sex','c[0].lives'].map(n=>{const s=document.querySelector('[name="'+n+'"]');return n+':'+(s.nbhSeg?[...s.nbhSeg.querySelectorAll('button')].map(b=>b.textContent).join('/'):'list');}));
  ok('9 choices of two to four short answers are buttons on the iPad',sg[0]==='s.sex:Female/Male/Not recorded'&&sg[1]==='c[0].lives:Yes/Part-time/No',sg);
  ok('10 no page errors',!errs.length,errs.slice(0,5));
  await wk.close();await cr.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
