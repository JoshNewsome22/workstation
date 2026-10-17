/* v21.89 the layout review's fixes stay fixed: an iPad held upright keeps the bar to one row and the chips in the heading;
   the folded student line is one line; the crumb gives the form's name its room; a finger gets 44 px crumb buttons; TD-1's
   view tabs take the toolbar's width; a 12-inch page has a toolbar as wide as it; DD-1 has no empty strip inside the
   workstation; on a phone the 1-6 scale is one row and the date to send by is in words; "Grade 5th grade" is not written.
   Chromium with iPad and iPhone user agents and touch. Simulated student only.  usage: node qa/v2189-layout-test.js */
const {chromium,BASE,sleep,loadSim}=require(__dirname+'/lib.js');
const fs=require('fs');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
async function shell(br,vp,touch,ua){const ctx=await br.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch,userAgent:ua||undefined,serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1300);
  await page.evaluate(()=>{const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pGrade','5th grade');set('#pSite','Royal Palm School Elementary, Room 14 (simulated)');set('#pBcba','Sample BCBA');});
  return {ctx,page,errs};}
async function open(page,id){await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(1500);
  await page.evaluate(()=>{try{foldBar(true);}catch(e){}const t=document.getElementById('tipHide');if(t&&t.offsetParent)t.click();});await sleep(300);
  const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);return page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);}
const H=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().height):-1;},sel);
(async()=>{const br=await chromium.launch();
  try{
  /* the iPad held upright */
  {const {ctx,page,errs}=await shell(br,{width:820,height:1180},true,IPAD);const fr=await open(page,'DM-1');
    const m=await page.evaluate(()=>({bar:Math.round(document.getElementById('bar').getBoundingClientRect().height),chipsTop:!!document.querySelector('header.top #wsChips'),
      sum:Math.round(document.getElementById('barSum').getBoundingClientRect().height),det:document.getElementById('sumDet').textContent,
      crumb:[...document.querySelectorAll('.crumb .acts button')].filter(b=>b.offsetParent).map(b=>Math.round(b.getBoundingClientRect().width))}));
    ok('1 iPad upright: the chips are in the heading and the folded bar is at most 120 px (it was 191 to 217)',m.chipsTop&&m.bar<=120,m);
    ok('2 the folded student line stays one line with a long school name',m.sum<=44,m.sum);
    ok('3 “5th grade” is written as it is, not “Grade 5th grade”',/5th grade/.test(m.det)&&!/Grade 5th/.test(m.det),m.det);
    ok('4 a finger: every crumb button is at least 44 px wide',m.crumb.length>0&&m.crumb.every(w=>w>=44),m.crumb);
    ok('5 no page errors (iPad upright)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* the iPad, 1024 wide, and TD-1 with its simulated case */
  {const {ctx,page,errs}=await shell(br,{width:1024,height:768},true,IPAD);const fr=await open(page,'TD-1');
    const t=await page.evaluate(()=>Math.round(document.getElementById('crumbTitle').getBoundingClientRect().width));
    ok('6 iPad 1024: the crumb gives the form’s name at least 200 px (it had 98)',t>=200,t);
    await fr.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});try{await loadSim(fr);}catch(e){}await sleep(800);
    const tb=await fr.evaluate(()=>{const t=document.querySelector('.toolbar'),v=document.getElementById('viewSeg');const tops=v?new Set([...v.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>Math.round(b.getBoundingClientRect().top))).size:0;
      return {h:Math.round(t.getBoundingClientRect().height),rows:tops};});
    ok('7 TD-1: the view tabs take the toolbar’s width: at most 3 rows and a toolbar under 230 px (it was 6 rows, 295 px)',tb.rows<=3&&tb.h<230,tb);
    ok('8 no page errors (iPad 1024)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* the iPad sideways: a 12-inch page and DD-1 */
  {const {ctx,page,errs}=await shell(br,{width:1180,height:820},true,IPAD);let fr=await open(page,'SM-1');
    const w=await fr.evaluate(()=>{const a=document.querySelector('.toolbar').getBoundingClientRect(),b=document.querySelector('.sheet').getBoundingClientRect();return {tb:[Math.round(a.left),Math.round(a.right)],sheet:[Math.round(b.left),Math.round(b.right)]};});
    ok('9 SM-1 (a 12-inch page): its toolbar is as wide as the page',Math.abs(w.tb[0]-w.sheet[0])<=2&&Math.abs(w.tb[1]-w.sheet[1])<=2,w);
    fr=await open(page,'DD-1');const mh=await fr.evaluate(()=>{const m=document.querySelector('.nbh-mast');return m?Math.round(m.getBoundingClientRect().height):0;});
    ok('10 DD-1 inside the workstation: no empty strip above its toolbar',mh===0,mh);
    const pm=await fr.evaluate(()=>{const m=document.querySelector('.nbh-mast');const st=m?getComputedStyle(m).display:'';return st;});
    ok('11 no page errors (iPad sideways)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* a phone: the questionnaire */
  {const G=JSON.parse(fs.readFileSync(__dirname+'/data/respond-golden.json','utf8'));
    const ctx=await br.newContext({viewport:{width:375,height:667},hasTouch:true,isMobile:true,userAgent:IPHONE,serviceWorkers:'block'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/respond.html');await sleep(500);
    for(const lang of ['en','es']){const p=JSON.parse(JSON.stringify(G['SV-1'].payload));p.student='M.R. (ID 4471823)';p.due='2026-10-19';if(lang==='es')p.lang='es';
      const h=await page.evaluate(p=>NBH_RESPOND.payloadToHash(p),p);const q=await ctx.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(BASE+'/NBH-Workstation/respond.html'+h);await sleep(900);
      const r=await q.evaluate(()=>{const it=document.querySelector('li.it');const tops=it?new Set([...it.querySelectorAll('label.num')].map(l=>Math.round(l.getBoundingClientRect().top))).size:0;
        const ws=it?[...it.querySelectorAll('label.num')].map(l=>Math.round(l.getBoundingClientRect().width)):[];
        return {rows:tops,ws,due:[...document.querySelectorAll('p.sub')].map(p=>p.textContent).find(t=>/send it by|antes del/.test(t))||'',sw:document.documentElement.scrollWidth};});
      if(lang==='en'){ok('12 phone (375): the 1 to 6 scale is one row of buttons at least 44 px wide, nothing wider than the screen',r.rows===1&&r.ws.length===6&&r.ws.every(w=>w>=44)&&r.sw<=375,r);
        ok('13 the date to send by in words: “Please send it by Monday, October 19.”',r.due==='Please send it by Monday, October 19.',r.due);}
      else ok('14 in Spanish: “Por favor envíelo antes del lunes, 19 de octubre.”',r.due==='Por favor envíelo antes del lunes, 19 de octubre.',r.due);
      await q.close();}
    ok('15 no page errors (phone)',!errs.length,errs.slice(0,3));await ctx.close();}
  /* a phone: the workstation itself */
  {const {ctx,page,errs}=await shell(br,{width:390,height:844},true,IPHONE);await open(page,'DM-1');
    const t=await page.evaluate(()=>Math.round(document.getElementById('crumbTitle').getBoundingClientRect().width));
    ok('16 phone: the form’s name has a row of its own in the crumb (it had 2 px)',t>=250,t);
    /* SP-1 on the phone: a tapped cell is marked where it is; the page does not move; no double-tap zoom */
    const sp=await open(page,'SP-1');await sp.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};});try{await loadSim(sp);}catch(e){}await sleep(900);
    await sp.evaluate(()=>{const v=[...document.querySelectorAll('#viewSeg button')].find(b=>/Data sheet/.test(b.textContent));if(v)v.click();const b=document.querySelector('[data-mode="tap"]');if(b)b.click();});await sleep(800);
    let tgt=null;for(const c of (await sp.$$('button.cell')).slice(30)){const bb=await c.boundingBox();if(bb&&bb.width>4){tgt=c;break;}}
    await tgt.scrollIntoViewIfNeeded();await sp.evaluate(()=>{window.scrollBy(0,-60);/* the simulated data's own message (a toast, dismissible) may sit over the cell: a user would close it first */document.querySelectorAll('#nbhToasts .nbh-toast').forEach(t=>t.remove());});await sleep(300);
    /* v22.47 as Safari on the iPad and the iPhone: no scroll anchoring, so a line added above the grid (the consent line, when
       the case comes round after the tap) would move the page under the finger; the tapped cell must stay where it was on
       the screen */
    await sp.evaluate(()=>{const st=document.createElement('style');st.textContent='html,body{overflow-anchor:none!important}';document.head.appendChild(st);});
    const y0=await sp.evaluate(()=>scrollY),rc=await tgt.evaluate(e=>[e.dataset.r,e.dataset.c,e.dataset.state]),cy0=await tgt.evaluate(e=>Math.round(e.getBoundingClientRect().top)),bb=await tgt.boundingBox();
    await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await sleep(700);
    const a1=await sp.evaluate(([r,c])=>({y:scrollY,cy:Math.round(document.querySelector("table.scatter [data-r='"+r+"'][data-c='"+c+"']").getBoundingClientRect().top),st:document.querySelector("table.scatter [data-r='"+r+"'][data-c='"+c+"']").dataset.state,ta:getComputedStyle(document.documentElement).touchAction,tw:Math.round(document.querySelector('th.timecol').getBoundingClientRect().width)}),rc);
    ok('16b SP-1 on a phone: the tapped cell changes and stays where it was on the screen (as on Safari, with no scroll anchoring), no double-tap zoom, the time column narrow',a1.st!==rc[2]&&Math.abs(a1.cy-cy0)<=1&&a1.ta==='manipulation'&&a1.tw<=70,{y0,cy0,rc,a1});
    ok('17 no page errors (phone workstation)',!errs.length,errs.slice(0,3));await ctx.close();}
  }finally{await br.close();}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
