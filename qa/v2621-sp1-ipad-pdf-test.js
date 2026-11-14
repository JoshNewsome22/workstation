/* v26.21 (the BCBA's own printout of Form SP-1 from the workstation installed on an iPad, 11/14: the grid's rows 4 mm high
   above an empty foot of the page, the scan's corner squares on "Total" and "Intervals marked", the times touching the
   line beside them). The installed app makes the PDF itself (nbh-pdf-make.js); Chromium plays the iPad. Simulated data only.
   A  the PDF the app makes, the iPad upright and on its side: one page a sheet, each data sheet 729 px wide (no screen
      enlargement left on it) and filling its page (what is left under it is less than a row for every row could take), its
      rows taller than the estimate gave; a later pass draws the same sheet.
   B  the scan code under the grid carries the new row height, and the grid it describes is the grid drawn.
   C  the words keep clear: every time 3 px or more from the line beside it and inside its cell; "Total" and "Intervals
      marked" do not touch a corner square.
   D  the page the app made is read back by the form's own scan: the code found, the corner squares found, the shaded cells read.
   E  the browser's own Print is as it was: the rows the estimate gives; the same words clear.
   usage: WS_URL=http://127.0.0.1:8124 node qa/v2621-sp1-ipad-pdf-test.js   (WS_EDITION as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {chromium,sleep}=L;const fs=require('fs'),path=require('path');
const OUT=path.join(L.ROOT,'qa','out','v2621');fs.mkdirSync(OUT,{recursive:true});
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1100):''));if(!c)fails++;};
/* a record like the one printed: 13 half-hour rows from 9:00, five days, the activity column, one level, tap marks */
const setUp=async p=>{await p.evaluate(async()=>{nbhUI.confirm=async()=>true;window.confirm=()=>true;await loadSim();});await sleep(800);
  return p.evaluate(()=>{commitBeh();Object.assign(state.cfg,{startMin:9*60,spanH:6.5,interval:30,days:5,levels:1,codes:false,actOn:true,mode:'tap',perSheet:10});state.meta.sid='SIM-000';
    const truth={};state.behaviors.forEach((b,bi)=>{b.cells={};if(b.obs2)b.obs2={};for(let r=0;r<13;r++)for(let c=0;c<5;c++){const on=(r*5+c*3+bi)%4===0;if(on)b.cells[r+'_'+c]={s:2,n:null,code:''};if(bi===0)truth[r+'_'+c]=on?2:0;}});
    state.cells=state.behaviors[state.cur].cells;useBeh(0,true);render();return {truth,nR:rowLabels().length,beh:state.behaviors.length,est:spRowsOf('only',rowLabels().length,'print',spSetExtra())};});};
/* inside the page: make the PDF, looking at the copy it is drawn from on the first two passes */
const make=()=>(async()=>{
  const load=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});
  if(!window.html2canvas)await load('nbh-html2canvas.js');if(!window.nbhPdfMake)await load('nbh-pdf-make.js');
  const seen=[],real=window.html2canvas;
  const look=d=>{const w=d.defaultView,R=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};},rng=d.createRange(),T=n=>{rng.selectNodeContents(n);return R(rng);};
    const hit=(a,b)=>a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b;
    return Array.from(d.querySelectorAll('#spPrint > .sheet')).map(s=>{const t=s.querySelector('table.scatter');if(!t)return {grid:false,h:R(s).h};
      const rows=Array.from(t.tBodies[0].rows),times=rows.map(tr=>tr.querySelector('td.time')),box=s.querySelector('.sp-scan');
      const words=el=>{const tw=d.createTreeWalker(el,4,null);let n,out=null;while((n=tw.nextNode())){if(!/\S/.test(n.nodeValue))continue;const x=T(n);out=out?{l:Math.min(out.l,x.l),t:Math.min(out.t,x.t),r:Math.max(out.r,x.r),b:Math.max(out.b,x.b)}:x;}return out;};
      const gap=times.map(td=>{const c=R(td),x=words(td);return [Math.round((c.r-x.r)*10)/10,Math.round((x.l-c.l)*10)/10];});
      const tot=t.querySelector('thead th.tot'),ft=t.querySelector('tfoot tr.sp-foot td.time'),fid=k=>R(s.querySelector('.sp-fid.'+k));
      return {grid:true,w:R(s).w,h:R(s).h,zoom:s.style.zoom||'',tf:w.getComputedStyle(s).transform,rowh:parseFloat(s.style.getPropertyValue('--rowh')),row:R(rows[0]).h,nR:rows.length,
        gridH:R(t.tFoot).b-R(t.tHead).t,code:box?box.dataset.spCode||'':'',svg:box&&box.querySelector('svg')?box.querySelector('svg').outerHTML.length+':'+box.querySelector('svg').outerHTML.slice(-400):'',
        gapMin:Math.min.apply(null,gap.map(g=>g[0])),leftMin:Math.min.apply(null,gap.map(g=>g[1])),
        totHit:hit(words(tot),fid('sp-tr')),footHit:hit(words(ft),fid('sp-bl')),footIn:words(ft).l>=R(ft).l&&words(ft).r<=R(ft).r+0.5&&words(ft).b<=R(ft).b+0.5};});};
  const wrapped=(root,o)=>{const oc=o.onclone;o.onclone=d=>{const before=seen.length<1?look(d).map(x=>x.svg||''):null;if(oc)oc(d);if(seen.length<2){const a=look(d);if(before)a.forEach((x,i)=>{x.svgWas=before[i];});seen.push(a);}};return real(root,o);};
  const r=await window.nbhPdfMake(window,{html2canvas:wrapped});
  const u=new Uint8Array(await r.blob.arrayBuffer());let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
  /* the first page's picture, for the scan */
  const a=s.indexOf('stream\n',s.indexOf('/DCTDecode'))+7,e=s.indexOf('\nendstream',a);
  return {pages:r.pages,ch:r.paper.ch,cw:r.paper.cw,seen,jpg:btoa(s.slice(a,e)),live:Array.from(document.querySelectorAll('#spPrint > .sheet')).length};
})();
(async()=>{const b=await chromium.launch();const errs=[];
 try{
  for(const [name,vw,vh] of [['upright',820,1180],['on its side',1180,820]]){
    const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
    await ctx.addInitScript(()=>{try{Object.defineProperty(navigator,'standalone',{get:()=>true,configurable:true});}catch(e){}window.print=function(){};});
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+String(e).slice(0,160)));
    await p.goto(L.formUrl('Scatterplot_Pattern_Analysis.html'));await sleep(1500);
    const su=await setUp(p);
    const fitOn=await p.evaluate(()=>{const s=document.querySelector('#sheet');return parseFloat(s.style.zoom||'1');});
    const r=await p.evaluate(make);const S=r.seen[0],S2=r.seen[1]||[],G=S.filter(x=>x.grid);
    ok('A '+name+': the record is 13 rows, 2 behaviors'+(name==='on its side'?', and on its side the screen shows the sheet enlarged ('+fitOn+')':''),su.nR===13&&su.beh===2&&(name!=='on its side'||fitOn>1.02),{su,fitOn});
    ok('A '+name+': '+r.pages+' pages from '+S.length+' sheets, two of them data sheets',r.pages>=S.length&&G.length===2,{pages:r.pages,sheets:S.length,grids:G.length});
    ok('A '+name+': each data sheet is the paper\'s width ('+r.cw+' px), with no enlargement on it',G.every(x=>Math.abs(x.w-r.cw)<1&&x.zoom===''&&x.tf==='none'),G.map(x=>[x.w,x.zoom,x.tf]));
    ok('A '+name+': each data sheet fills its page and stays on it (left under it: '+G.map(x=>Math.round(r.ch-x.h)).join(', ')+' px of '+r.ch+')',G.every(x=>x.h<=r.ch&&(r.ch-x.h<x.nR+8||x.rowh===44)),G.map(x=>[x.h,x.rowh]));
    ok('A '+name+': the rows are taller than the estimate gave ('+su.est+' px): '+G.map(x=>x.rowh).join(', ')+' px, each row drawn one px more',G.every(x=>x.rowh>su.est&&Math.abs(x.row-(x.rowh+1))<0.6),G.map(x=>[x.rowh,x.row]));
    const G2=S2.filter(x=>x.grid);
    ok('A '+name+': the pass that draws the first page lays the sheets out the same',G2.length===G.length&&G2.every((x,i)=>Math.abs(x.h-G[i].h)<0.6&&x.rowh===G[i].rowh&&x.code===G[i].code),G2.map(x=>[x.h,x.rowh]));
    const geo=await p.evaluate(codes=>codes.map(c=>{const g=window.__spScan.geometry(c);return g?{rowh:g.rowh,H:g.H,nR:g.nR}:null;}),G.map(x=>x.code));
    ok('B '+name+': the scan code carries the new row height, its picture was drawn again, and the grid it describes is the grid drawn',
      G.every((x,i)=>geo[i]&&geo[i].rowh===x.rowh&&geo[i].nR===x.nR&&Math.abs(geo[i].H-x.gridH)<=2&&x.svg!==x.svgWas&&+x.code.split(';')[9]===x.rowh),{geo,grid:G.map(x=>[x.rowh,x.gridH,x.code])});
    ok('C '+name+': every time keeps 3 px or more from the line beside it (least '+Math.min.apply(null,G.map(x=>x.gapMin))+') and stays inside its cell (least '+Math.min.apply(null,G.map(x=>x.leftMin))+' from its left edge)',G.every(x=>x.gapMin>=3&&x.leftMin>=0),G.map(x=>[x.gapMin,x.leftMin]));
    ok('C '+name+': "Total" and "Intervals marked" touch no corner square, and "Intervals marked" is inside its cell',G.every(x=>!x.totHit&&!x.footHit&&x.footIn),G.map(x=>[x.totHit,x.footHit,x.footIn]));
    if(name==='upright'){
      const jpg=path.join(OUT,'page1-'+L.ED+'.jpg');fs.writeFileSync(jpg,Buffer.from(r.jpg,'base64'));
      await p.evaluate(()=>{const bh=state.behaviors[0];Object.keys(bh.cells).forEach(k=>{delete bh.cells[k];});useBeh(0,true);render();window.__spScanLast=null;document.getElementById('spScanBtn').click();});await sleep(300);
      await p.setInputFiles('#spScanPick',jpg);let last=null;for(let i=0;i<80&&!last;i++){await sleep(500);last=await p.evaluate(()=>window.__spScanLast?{cells:window.__spScanLast.cells.map(c=>[c.r,c.c,c.lv]),unsure:window.__spScanLast.unsure.length,rowh:window.__spScanLast.G.rowh}:null);}
      const st=await p.evaluate(()=>document.getElementById('scStat').textContent);
      let right=0,marks=0,marksRight=0;if(last)last.cells.forEach(([rr,c,lv])=>{const t=su.truth[rr+'_'+c];if(t===2)marks++;if(lv===t){right++;if(t===2)marksRight++;}});
      ok('D the page the app made is read back by the scan: the code found, the grid placed by its new row height ('+(last&&last.rowh)+'), all 65 cells read and every shaded one found ('+marksRight+' of '+marks+')',
        !!last&&/Read:/.test(st)&&last.cells.length===65&&last.rowh===G[0].rowh&&right===65&&marks>=10&&marksRight===marks,{st:st.slice(0,160),n:last&&last.cells.length,right,marks,marksRight,unsure:last&&last.unsure});
    }
    await ctx.close();
  }
  /* E the browser's own Print */
  {const ctx=await b.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push('print: '+String(e).slice(0,160)));
    await p.goto(L.formUrl('Scatterplot_Pattern_Analysis.html'));await sleep(1500);const su=await setUp(p);
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});await sleep(500);
    const r=await p.evaluate(()=>{const rng=document.createRange(),R=e=>e.getBoundingClientRect(),T=n=>{rng.selectNodeContents(n);return rng.getBoundingClientRect();},hit=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      const W=el=>{const tw=document.createTreeWalker(el,4,null);let n,o=null;while((n=tw.nextNode())){if(!/\S/.test(n.nodeValue))continue;const x=T(n);o=o?{left:Math.min(o.left,x.left),top:Math.min(o.top,x.top),right:Math.max(o.right,x.right),bottom:Math.max(o.bottom,x.bottom)}:x;}return o;};
      return Array.from(document.querySelectorAll('#spPrint > .sheet')).filter(s=>s.querySelector('table.scatter')).map(s=>{const t=s.querySelector('table.scatter');
        const gaps=Array.from(t.tBodies[0].rows).map(tr=>{const td=tr.querySelector('td.time');return R(td).right-W(td).right;});
        return {rowh:parseFloat(s.style.getPropertyValue('--rowh')),gap:Math.round(Math.min.apply(null,gaps)*10)/10,totHit:hit(W(t.querySelector('thead th.tot')),R(s.querySelector('.sp-fid.sp-tr'))),footHit:hit(W(t.querySelector('tfoot tr.sp-foot td.time')),R(s.querySelector('.sp-fid.sp-bl'))),code:+s.querySelector('.sp-scan').dataset.spCode.split(';')[9]};});});
    const pdf=await p.pdf({format:'Letter',preferCSSPageSize:true,printBackground:true});const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g)||[]).length;
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await p.emulateMedia({media:'screen'});
    ok('E the browser\'s own Print keeps the rows the estimate gives ('+su.est+' px), in the sheet and in its code; '+pages+' pages',r.length===2&&r.every(x=>x.rowh===su.est&&x.code===su.est)&&pages>=2,{r,est:su.est,pages});
    ok('E there too the times keep 3 px from the line and no words touch a corner square',r.every(x=>x.gap>=3&&!x.totHit&&!x.footHit),r);
    await ctx.close();}
  ok('no page errors',errs.length===0,errs);
 }catch(e){console.log('FAIL the test stopped: '+(e&&e.stack||e));fails++;}
 await b.close();console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);})();
