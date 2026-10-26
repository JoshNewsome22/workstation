/* v24.46 a reading line on screen runs the width of the card on an iPad (the BCBA's screenshot of 10/26: Form RS-1's
   "The Requirements in Brief" stopped two thirds across a card whose heading band and source note ran its full width).
   Checks: on an iPad in landscape (1366 x 1024, touch) RS-1's requirement items reach the card's width, as its source note
   does; on a 1920 monitor they stop near 160 characters, narrower than the card; text a form set narrower on purpose keeps
   its 80-character cap on every form; nothing marked wider is wider than its container; paper is unchanged (RS-1's printed
   pages word for word against the previous release when WS_PREV_URL is set).
   usage: node qa/wide146-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const PREV=process.env.WS_PREV_URL||'';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,700)));};
const RS='RS-1_RBT-Supervision-Log_v2026-10.html';
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const probe=()=>{const box=document.getElementById('reqBox');const lis=[...box.querySelectorAll('li')];const chk=box.querySelector('.check');const bw=box.getBoundingClientRect().width;
  return {box:Math.round(bw),chk:chk?Math.round(chk.getBoundingClientRect().width):0,li:lis.map(l=>Math.round(l.getBoundingClientRect().width)),ul:Math.round(box.querySelector('ul').getBoundingClientRect().width),
    wider:lis.filter(l=>l.classList.contains('nbh-wider')).length,n:lis.length,mw:lis[0]?getComputedStyle(lis[0]).maxWidth:'',fs:lis[0]?parseFloat(getComputedStyle(lis[0]).fontSize):0};};
const pdfText=f=>{try{return JSON.parse(cp.execFileSync('python3',['-I','-c','import pymupdf,sys,json;d=pymupdf.open(sys.argv[1]);print(json.dumps([p.get_text() for p in d]))',f]).toString());}catch(e){return null;}};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 /* ---- the iPad in landscape ---- */
 let ctx=await b.newContext({viewport:{width:1366,height:1024},hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block'});let p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(BASE+'/NBH-Workstation/'+RS);await sleep(1500);const ip=await p.evaluate(probe);await ctx.close();
 /* a list item runs to the ul's width less its marker indent: compare with the ul, which spans the card */
 ok('iPad landscape: every requirement item reaches the card\'s width (as the source note under it does), not two thirds of it',ip.n>=8&&ip.wider>=ip.n-1&&ip.li.every(w=>w>=ip.ul-4)&&ip.ul>=ip.box-20&&ip.chk>=ip.box-2,ip);
 /* ---- RS-1's quick-length buttons on a contact card (the BCBA's screenshot of 10/26): one row of one width ---- */
 {const c2=await b.newContext({viewport:{width:1366,height:1024},hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block'});const q=await c2.newPage();q.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await q.goto(BASE+'/NBH-Workstation/'+RS);await sleep(1500);
  await q.evaluate(()=>{window.confirm=()=>true;window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(2500);
  await q.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^\s*Month\s*$/.test(x.textContent));if(b)b.click();});await sleep(800);
  const L=await q.evaluate(()=>{const d=document.querySelector('details.rs-contact');if(!d)return null;d.open=true;const l=d.querySelector('.rs-len');const bs=[...l.querySelectorAll('.tool')].map(x=>x.getBoundingClientRect());
    return {dir:getComputedStyle(l).flexDirection,n:bs.length,tops:[...new Set(bs.map(r=>Math.round(r.top)))].length,widths:[...new Set(bs.map(r=>Math.round(r.width)))],left:Math.round(bs[0].left-l.getBoundingClientRect().left),minH:Math.min(...bs.map(r=>r.height))};});
  ok('RS-1 on an iPad: a contact\'s five quick-length buttons sit in one row from the left, one width, 44 px tall (they were stacked in a centred column)',L&&L.dir==='row'&&L.n===5&&L.tops===1&&L.widths.length===1&&L.left<90&&L.minH>=44,L);
  await c2.close();}
 /* ---- desktop monitors: an item is as wide as the list or 160 characters, whichever is less ---- */
 const desk={};let ctx2;for(const W of [1920,2560]){ctx2=await b.newContext({viewport:{width:W,height:1200},serviceWorkers:'block'});p=await ctx2.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
   await p.goto(BASE+'/NBH-Workstation/'+RS);await sleep(1500);const d=await p.evaluate(probe);
   d.ch160=await p.evaluate(()=>{const li=document.querySelector('#reqBox li.nbh-wider');const s=document.createElement('span');s.style.cssText='display:block;visibility:hidden;width:160ch;height:0;max-width:none';li.appendChild(s);const w=s.getBoundingClientRect().width;s.remove();return Math.round(w);});
   desk[W]=d;if(W===2560)break;await ctx2.close();}
 ok('desktop monitors (1920, 2560): each item runs the list\'s width or 160 characters, whichever is less (the card here stays under 160, so the items fill it)',
   Object.values(desk).every(d=>d.n>=8&&d.li.every(w=>Math.abs(w-Math.min(d.ul,d.ch160))<=3)),desk);
 ctx=ctx2;
 /* ---- every form: what is marked wider fits its container; text set narrow on purpose keeps 80 characters ---- */
 const files=fs.readdirSync(path.join(ROOT,'NBH-Workstation')).filter(f=>/\.html$/.test(f)&&f!=='index.html'&&!/^nbh-|respondent|walk/i.test(f));
 const per=[];const PCTX=PREV?await b.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}):null;
 const grab=async(pg,base,f)=>{await pg.goto(base+'/NBH-Workstation/'+f);await sleep(900);return pg.evaluate(()=>{const W=[...document.querySelectorAll('.nbh-wide')].filter(e=>e.offsetParent);
     return {over:W.filter(e=>e.getBoundingClientRect().width>e.parentElement.getBoundingClientRect().width+1).length,list:W.map(e=>({mw:getComputedStyle(e).maxWidth,wider:e.classList.contains('nbh-wider'),t:e.tagName+'.'+e.className.slice(0,30)}))};});};
 for(const f of files){const q=await ctx.newPage();const q0=PCTX?await PCTX.newPage():null;try{const now=await grab(q,BASE,f);const was=q0?await grab(q0,PREV,f):null;
     const narrow=now.list.filter(x=>!x.wider);let same=true,diff=[];
     if(was){if(was.list.length!==now.list.length){same=false;diff.push('count '+was.list.length+' to '+now.list.length);}else now.list.forEach((x,i)=>{const num=v=>String(v).replace(/[\d.]+px/g,m=>Math.round(parseFloat(m))+'px');if(!x.wider&&num(x.mw)!==num(was.list[i].mw)){same=false;diff.push(x.t+' '+was.list[i].mw+' to '+x.mw);}});}
     per.push({f:f.slice(0,22),wide:now.list.length,wider:now.list.length-narrow.length,narrow:narrow.length,over:now.over,narrowOk:same,diff:diff.slice(0,2)});}catch(e){per.push({f,err:String(e).slice(0,80)});}await q.close();if(q0)await q0.close();}
 if(PCTX)await PCTX.close();
 ok('every form: no text block marked wider runs past its container',per.every(x=>!x.err&&x.over===0),per.filter(x=>x.err||x.over));
 ok('every form: text not given the wider line keeps its 80-character cap (the masthead lines, uncapped before, stay so)',per.every(x=>x.narrowOk!==false),per.filter(x=>x.narrowOk===false));
 ok('the wider line is used on most forms (at least 30 of '+per.length+' carry it on their first sheet)',per.filter(x=>x.wider>0).length>=30,per.map(x=>x.f.slice(0,5)+':'+x.wider));
 await ctx.close();
 /* ---- paper is unchanged ---- */
 if(PREV){const pages=[];for(const base of [BASE,PREV]){const c=await b.newContext({viewport:{width:1366,height:1024},serviceWorkers:'block'});const q=await c.newPage();await q.goto(base+'/NBH-Workstation/'+RS);await sleep(1500);
   await q.emulateMedia({media:'print'});const buf=await q.pdf({preferCSSPageSize:true,printBackground:true});const fp=path.join(ROOT,'qa','out','wide146-'+pages.length+'.pdf');fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,buf);pages.push(pdfText(fp));await c.close();}
   ok('paper: Form RS-1 prints the same pages, word for word, as the previous release',pages[0]&&pages[1]&&pages[0].length===pages[1].length&&pages[0].every((t,i)=>t.replace(/Printed[^\n]*\n?/g,'').replace(/\s+/g,' ')===pages[1][i].replace(/Printed[^\n]*\n?/g,'').replace(/\s+/g,' ')),{now:pages[0]&&pages[0].length,prev:pages[1]&&pages[1].length});}
 else console.log('(set WS_PREV_URL to compare the printed pages)');
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
