/* v21.93 the forms pass (the design review's second part) stays built. On screen every form draws its fields the same way:
   a field that was a line to write on is drawn as the box the newer forms use (the polish script marks it nbh-box and
   nbh-was-ul), with a border on all four sides and 36 px tall outside a table; fields inside tables stay compact; bare grid
   cells stay bare. A reading line is about 80 characters at most: every long paragraph in a sheet is capped (nbh-wide, 80ch).
   A label that names a field is 12 px at least. None of it is on paper: with the previous release served at WS_PREV_URL (the
   release run does this), every one of the 46 forms prints the same words in the same places from both, with a mouse and with
   a finger. Chromium; simulated data only (nothing is typed; the forms are read as they open).
   usage: node qa/v2193-fields-test.js     (WS_PREV_URL=http://127.0.0.1:8128 for the print comparison) */
const {chromium,BASE,sleep,forms}=require(__dirname+'/lib.js');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const PREV=process.env.WS_PREV_URL||'';
const measure=()=>{const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
  const F=[...document.querySelectorAll('.nbh-fld')].filter(vis);
  const ul=F.filter(e=>e.classList.contains('nbh-ul')).length,box=F.filter(e=>e.classList.contains('nbh-box')),was=F.filter(e=>e.classList.contains('nbh-was-ul')).length;
  const bad=[];for(const e of box){if(e.classList.contains('nbh-intd'))continue;const c=getComputedStyle(e);const w=['Top','Right','Bottom','Left'].map(s=>parseFloat(c['border'+s+'Width'])||0);
    const h=e.getBoundingClientRect().height/(parseFloat(getComputedStyle(e.closest('.sheet')||document.body).zoom)||1);
    if(w.some(x=>x<0.5)||(e.tagName!=='TEXTAREA'&&h<35))bad.push({id:e.id||e.name||e.tagName,w,h:Math.round(h)});}
  const labs=[...document.querySelectorAll('label.nbh-lab')].filter(vis).map(l=>parseFloat(getComputedStyle(l).fontSize));
  const small=[...document.querySelectorAll('.sheet label')].filter(l=>vis(l)&&!l.closest('table,.toolbar,dialog,.nbh-pm')&&!l.querySelector('input,select,textarea,div,p')&&(l.textContent||'').trim()).map(l=>parseFloat(getComputedStyle(l).fontSize)).filter(f=>f<11.95);
  const prose=[...document.querySelectorAll('.sheet p,.sheet li')].filter(p=>vis(p)&&!p.closest('table,.toolbar,dialog')&&(p.textContent||'').trim().length>120&&![...p.children].some(c=>/^(DIV|TABLE|UL|OL|P|FIGURE)$/.test(c.tagName)));
  const wide=prose.filter(p=>{const c=getComputedStyle(p);const ch=(()=>{const s=document.createElement('span');s.textContent='0000000000';s.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:inherit';p.appendChild(s);const w=s.getBoundingClientRect().width/10;s.remove();return w;})();
    const z=parseFloat(getComputedStyle(p.closest('.sheet')||document.body).zoom)||1;return p.getBoundingClientRect().width/z>81*ch/z+1;}).map(p=>(p.textContent||'').trim().slice(0,40));
  return {fields:F.length,ul,box:box.length,was,bad:bad.slice(0,4),labs:labs.length,labMin:labs.length?Math.min(...labs):null,small:small.length,prose:prose.length,wide:wide.slice(0,3),wideN:wide.length};};
const pdfText=(shell,buf)=>shell.evaluate(async b64=>{const lib=await pdfjsLoad();const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const pdf=await lib.getDocument({data:bytes}).promise;const out=[];
  for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();out.push(tc.items.filter(t=>t.str&&t.str.trim()).map(t=>t.str.trim()+'@'+Math.round(t.transform[4])+','+Math.round(t.transform[5])).join('|'));}
  return out;},Buffer.from(buf).toString('base64'));
(async()=>{const br=await chromium.launch();
  try{
  const list=forms('NBH-Workstation');
  /* ---- 1. on screen, every form: laptop with a mouse, then an iPad held upright ---- */
  for(const [tag,vp,touch] of [['laptop 1440',{width:1440,height:900},false],['iPad upright 820',{width:820,height:1180},true]]){
    const ctx=await br.newContext({viewport:vp,hasTouch:touch,isMobile:touch,userAgent:touch?IPAD:undefined,serviceWorkers:'block'});
    let n=0,ulN=0,badN=0,smallN=0,wideN=0,errsN=0;const notes=[];
    for(const f of list){const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
      try{await page.goto(BASE+'/NBH-Workstation/'+f.file);await sleep(700);const m=await page.evaluate(measure);n++;
        ulN+=m.ul;badN+=m.bad.length;smallN+=m.small;wideN+=m.wideN;if(errs.length)errsN++;
        if(m.ul||m.bad.length||m.small||m.wideN||errs.length)notes.push({id:f.id,ul:m.ul,bad:m.bad,small:m.small,wide:m.wide,errs:errs.slice(0,1)});}
      catch(e){notes.push({id:f.id,err:String(e).slice(0,80)});}
      await page.close();}
    ok('1 '+tag+': '+n+' forms read; no field is drawn as a line any more (nbh-ul: '+ulN+')',n===list.length&&ulN===0,notes.slice(0,4));
    ok('2 '+tag+': every boxed field outside a table has a border on all four sides and is 36 px tall (bad: '+badN+')',badN===0,notes.filter(x=>x.bad&&x.bad.length).slice(0,4));
    ok('3 '+tag+': no label that names a field is under 12 px (small: '+smallN+')',smallN===0,notes.filter(x=>x.small).slice(0,4));
    ok('4 '+tag+': no reading line in a sheet is longer than about 80 characters (wide: '+wideN+')',wideN===0,notes.filter(x=>x.wideN).slice(0,4));
    ok('5 '+tag+': no page errors',errsN===0,notes.filter(x=>x.errs&&x.errs.length).slice(0,3));
    await ctx.close();}
  /* ---- 2. the forms that were drawn as lines now show boxes: DM-1 and TB-1 carry fields marked nbh-was-ul ---- */
  {const ctx=await br.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const page=await ctx.newPage();
    const r={};for(const [id,file] of [['DM-1','DM-1_Student-Demographics-and-Profile_v2026-09.html'],['TB-1','TB-1_Target-Behavior-Development_v2026-09.html'],['FS-1','FS-1_FBA-Summary-Report_v2026-09.html']]){
      await page.goto(BASE+'/NBH-Workstation/'+file);await sleep(700);r[id]=await page.evaluate(measure);}
    ok('6 DM-1 and TB-1 (lines before) now carry boxed fields marked as lines before; FS-1 (boxes before) carries none',r['DM-1'].was>10&&r['TB-1'].was>3&&r['FS-1'].was===0&&r['FS-1'].box>5,{dm:r['DM-1'].was,tb:r['TB-1'].was,fs:r['FS-1'].was});
    /* TD-1's Guide: its long paragraphs sit within the cap, narrower than the sheet */
    await page.goto(BASE+'/NBH-Workstation/TD-1_Function-Based-Treatment-Developer_v2026-09.html');await sleep(700);
    await page.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button')].find(x=>/Guide/.test(x.textContent));if(b)b.click();});await sleep(400);
    const g=await page.evaluate(()=>{const ps=[...document.querySelectorAll('.sheet p')].filter(p=>p.getBoundingClientRect().height>0&&p.textContent.length>200);const sheet=document.querySelector('.sheet').getBoundingClientRect().width;
      return {n:ps.length,marked:ps.filter(p=>p.classList.contains('nbh-wide')).length,narrower:ps.filter(p=>p.getBoundingClientRect().width<sheet*0.9).length,sheet:Math.round(sheet),w:ps.slice(0,2).map(p=>Math.round(p.getBoundingClientRect().width))};});
    ok('7 TD-1’s Guide: its long paragraphs are capped and sit narrower than the sheet',g.n>=2&&g.marked===g.n&&g.narrower===g.n,g);
    await ctx.close();}
  /* ---- 3. paper is unchanged: every form against the previous release, with a mouse and with a finger ---- */
  if(!PREV)console.log('(set WS_PREV_URL to the previous release’s address to compare every form’s printed pages word for word)');
  else{const sctx=await br.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const shell=await sctx.newPage();await shell.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
    for(const [tag,o] of [['mouse',{}],['touch',{hasTouch:true,isMobile:true,userAgent:IPAD,viewport:{width:820,height:1180}}]]){
      const diff=[];let n=0;const ctx=await br.newContext(Object.assign({viewport:{width:1180,height:820},serviceWorkers:'block'},o));
      for(const f of list){const R={};
        for(const [w,base] of [['prev',PREV],['now',BASE]]){const p=await ctx.newPage();try{await p.goto(base+'/NBH-Workstation/'+f.file);await sleep(900);await p.emulateMedia({media:'print'});await sleep(200);
            R[w]=await pdfText(shell,await p.pdf({preferCSSPageSize:true,printBackground:true}));}catch(e){R[w]=['ERR '+String(e).slice(0,60)];}await p.close();}
        n++;const same=R.prev.length===R.now.length&&R.prev.every((t,i)=>t===R.now[i]);if(!same)diff.push({id:f.id,prev:R.prev.length,now:R.now.length,page:R.prev.findIndex((t,i)=>t!==R.now[i])+1});}
      ok('8 printed with a '+tag+': all '+n+' forms print the previous release’s pages, every word in the same place',n===list.length&&!diff.length,diff.slice(0,6));
      await ctx.close();}
    await sctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
