/* v22.18 the forms' toolbar on an iPad held upright, the view dots, and 400% zoom (review F480, F493, F494). On an iPad
   held upright (820 px, touch) a form's view tabs get a row of their own in the toolbar, so the form's pages show, not one
   or two of them; on the iPad held sideways (1180 px) every tab is whole and in sight (since v23.87 the tabs wrap as they need). Each view's dot says how filled it is by
   shape as well as colour (a ring for nothing yet, half filled for some, full for most), and on the light toolbar the
   amber and green stand out from white (3:1 or more). At 400% zoom (320 px wide) no view of SM-1, PA-1, TD-1 or EA-1 makes
   the page scroll sideways, and a field in a table keeps room for a few characters (not 14 px). Simulated student only.
   usage: node qa/v2218-screens-test.js */
const L=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const lum=c=>{const m=/rgba?\((\d+), (\d+), (\d+)/.exec(c);if(!m)return null;const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(+m[1])+0.7152*f(+m[2])+0.0722*f(+m[3]);};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);if(x==null||y==null)return 0;return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
async function shellForm(br,vp,id){const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:false,userAgent:IPAD,serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));await page.goto(L.BASE+'/NBH-Workstation/index.html');await L.sleep(1300);
  await page.evaluate(()=>{const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');});
  await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await L.sleep(1800);
  const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);const fr=page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);
  return {ctx,page,fr,errs};}
const tabs=fr=>fr.evaluate(()=>{const seg=document.getElementById('viewSeg'),bar=document.querySelector('.toolbar');if(!seg||!bar)return null;const sr=seg.getBoundingClientRect(),br=bar.getBoundingClientRect();
  const btns=[...seg.querySelectorAll('button')],whole=btns.filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.left>=sr.left-1&&r.right<=sr.right+1;}).length;
  const grp=seg.closest('.tgroup')||seg.parentElement,gr=grp.getBoundingClientRect(),others=[...bar.children].filter(g=>g!==grp&&g.offsetParent).map(g=>g.getBoundingClientRect().top);
  /* v23.88 sideways the tabs sit in the rail; upright a long strip is the Sheets menu */
  const rail=!!seg.closest('#nbhRail'),menu=document.documentElement.classList.contains('nbh-menu'),mb=document.querySelector('.toolbar .nbh-sheets');let items=0;if(mb&&mb.offsetParent){mb.click();items=document.querySelectorAll('#nbhSheets .nbh-sheet').length;mb.click();}
  const inWin=btns.filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.top>=0&&r.bottom<=innerHeight;}).length;
  return {n:btns.length,whole,inWin,rail,menu,items,segW:Math.round(sr.width),barW:Math.round(br.width),grpTop:Math.round(gr.top),othersTop:others.map(Math.round),barH:Math.round(br.height)};});
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  /* F480 */
  const P=await shellForm(br,{width:820,height:1180},'IA-1');const t=await tabs(P.fr);
  ok('1 an iPad held upright: IA-1\'s '+(t&&t.n)+' sheets are the Sheets menu, every one listed (v23.88)',!!t&&t.menu&&t.items===t.n,t);
  errs.push(...P.errs);await P.ctx.close();
  const W=await shellForm(br,{width:1180,height:820},'IA-1');const tw=await tabs(W.fr);
  /* v23.87: on a touch screen the tabs wrap onto as many rows as they need, so every sheet is in sight; the controls stay in the toolbar beside them */
  ok('2 held sideways (1180 px) every tab sits in the rail, whole and in sight (v23.88)',!!tw&&tw.rail&&tw.inWin===tw.n,tw);
  /* F493: the dots by shape, and their colours on the light toolbar */
  const d=await W.fr.evaluate(async()=>{const L=[...document.querySelectorAll('#viewSeg button[data-nbh-fill]')];const one=st=>L.find(b=>b.dataset.nbhFill===st&&b.getAttribute('aria-pressed')!=='true');
    const look=b=>{if(!b)return null;const s=getComputedStyle(b,'::after');return {img:s.backgroundImage,bg:s.backgroundColor,border:s.borderTopColor,w:s.width,disp:s.display};};
    return {part:look(one('part')),done:look(one('done')),empty:look(one('empty')),fills:L.map(b=>b.dataset.nbhFill)};});
  /* fill the form a little if no view is part filled yet */
  ok('3 a part-filled view\'s dot is half filled (a shape, not only a colour); a filled one is full; an empty one a ring',(!d.part||/linear-gradient/.test(d.part.img))&&(!d.done||d.done.img==='none')&&(!d.empty||/rgba\(0, 0, 0, 0\)|transparent/.test(d.empty.bg)),d);
  const css=await W.fr.evaluate(()=>{const b=document.createElement('button');b.dataset.nbhFill='done';b.setAttribute('aria-pressed','false');b.textContent='x';document.getElementById('viewSeg').appendChild(b);
    const c=document.createElement('button');c.dataset.nbhFill='part';c.setAttribute('aria-pressed','false');c.textContent='y';document.getElementById('viewSeg').appendChild(c);
    const r={done:getComputedStyle(b,'::after').backgroundColor,part:getComputedStyle(c,'::after').borderTopColor,partImg:getComputedStyle(c,'::after').backgroundImage,seg:getComputedStyle(document.getElementById('viewSeg')).backgroundColor};b.remove();c.remove();return r;});
  ok('4 on the light toolbar the green and amber dots stand out from white (3:1 or more)',contrast(css.done,'rgb(255, 255, 255)')>=3&&contrast(css.part,'rgb(255, 255, 255)')>=3&&/linear-gradient/.test(css.partImg),{css,green:contrast(css.done,'rgb(255, 255, 255)').toFixed(2),amber:contrast(css.part,'rgb(255, 255, 255)').toFixed(2)});
  errs.push(...W.errs);await W.ctx.close();
  /* F494 */
  const ctx=await br.newContext({viewport:{width:320,height:640},serviceWorkers:'block'});const wide=[],thin=[];
  for(const id of ['SM-1','PA-1','TD-1','EA-1']){const f=L.forms().find(x=>x.id===id);const p=await ctx.newPage();p.on('dialog',x=>x.accept().catch(()=>{}));p.on('pageerror',e=>errs.push(id+': '+e.message));
    await p.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await L.sleep(1200);await L.loadSim(p);await L.sleep(1200);
    const views=await p.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.view));
    for(const v of views){await p.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);await L.sleep(500);await p.evaluate(()=>window.nbhPolish&&nbhPolish.tscroll&&nbhPolish.tscroll());await L.sleep(120);
      const m=await p.evaluate(()=>{const de=document.documentElement;const th=[...document.querySelectorAll('td input:not([type=checkbox]):not([type=radio]):not([type=hidden]),td select')].filter(e=>e.offsetParent&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().width<26).length;return {sw:de.scrollWidth,cw:de.clientWidth,th};});
      if(m.sw>m.cw+1)wide.push(id+'/'+v+':'+m.sw);if(m.th)thin.push(id+'/'+v+':'+m.th);}
    await p.close();}
  ok('5 at 400% zoom (320 px) no view of SM-1, PA-1, TD-1 or EA-1 makes the page scroll sideways',!wide.length,wide);
  ok('6 at 400% zoom a field in a table keeps room for a few characters (none under 26 px)',!thin.length,thin);
  await ctx.close();
  ok('7 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
