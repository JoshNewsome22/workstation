/* Sprint package A7: visual supports print at full size from the iPad (VS-1).
   Safari on the iPad and iPhone prints on portrait Letter inside its own half-inch margins, whatever the page asks for (SETUP.md,
   v21.42h; tk1-audit.js's 7.5 x 10 in area). As in the audit's land-test.js, each print view goes through the form's own "Print the
   visuals" button; in the Safari model a stylesheet laid over the page's own request asks for portrait Letter with 0.5 in margins,
   and a 1 in square placed on the page gives the scale (1.00: nothing shrunk). The iPad is emulated as iPadOS reports itself
   (Safari's Mac user agent, MacIntel with touch points), the iPhone by its user agent; a computer is a plain desktop Chromium.
   1  iPad, Sheets Automatic: every print view (the board landscape and portrait, card sheets at 1, 2 and 3 in, rule cards full, half
      and quarter with the poster, and the strips: first-then, the schedule both ways, the choice and token boards, the wait card and
      countdown, the feelings scale, the break and help cards) prints portrait at 1.00, as many sheets as a computer prints, and the
      board's ink fills the 7.5 x 10 in area at full size (a landscape board turned on its side). The audit's two cases are named as
      in land-test.js: VS1-board-land and VS1-board-port. The iPhone gets the same.
   2  a computer: the page request, the page sizes, the sheet counts and the square as before (the landscape board 11 x 8.5 in, every
      other sheet 8.5 x 11 in, 1.00), the board's ink 10 x 7.5 in at the sheet's half-inch border. Run against the committed form
      too (WS_URL to a copy of the edition holding it) to see that these are its numbers.
   3  Sheets forced: "Portrait sheets for Safari" on a computer prints the iPad layout; "Full sheets" on an iPad asks for the
      computer's paper, which Safari shrinks (the note says so).
   4  the iPad layout's own counts: a 2 in vertical schedule takes 3 steps a sheet (4 on a computer); 1 in cards with cut lines
      48 a sheet (54), every cut line inside the printable area; a poster with 8 rules, taller than the area, is scaled to fit its
      one sheet; after the print the form is as it was.
   5  files: the setting is saved and opens again; an old file (no Sheets) opens with every field as saved and Sheets Automatic.
   6  the screen: the board preview is the same size on the iPad and a computer; the line above each page's visuals names the
      layout; no console or page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8307 node qa/sprint-a7-test.js [edition folder, default NBH-Workstation]
          A7_OLD_VS1=<file> opens that saved file as the old file (default: one saved here, with its Sheets taken out)
          A7_ONLY=computer runs part 2 alone (for the committed form, which has no Sheets setting) */
const {chromium,fs,BASE,wire,sleep}=require(__dirname+'/lib.js');
const cp=require('child_process');
const ED=process.argv[2]||'NBH-Workstation',FILE='VS-1_Visual-Supports_v2026-10.html';
const OUT=__dirname+'/out/sprint-a7/';fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.env.A7_ONLY||'';
const IPAD_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const IPHONE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
let fails=0;const check=(c,msg,extra)=>{console.log((c?'  ok   ':'  FAIL ')+msg+(c||extra===undefined?'':'  '+JSON.stringify(extra).slice(0,500)));if(!c)fails++;};
const near=(a,b,t)=>Array.isArray(a)&&a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<=(t||.02));
const within=(box,area,t)=>!!box&&box[0]>=area[0]-(t||.01)&&box[1]>=area[1]-(t||.01)&&box[2]<=area[2]+(t||.01)&&box[3]<=area[3]+(t||.01);
const SAFARI=[.5,.5,8,10.5];   /* the area Safari prints in on portrait Letter, in inches from the sheet's corner */

/* the PDF: pages, sizes, the square on sheet 1, and each sheet's ink (anything darker than a light grey, the magenta square left out) */
function pdfInfo(file){return JSON.parse(cp.execFileSync('python3',['-c',`
import sys,json,pymupdf
d=pymupdf.open(sys.argv[1]);dpi=72
try:
  import numpy as np
except Exception:
  np=None
def boxes(pg):
  pm=pg.get_pixmap(dpi=dpi);W,H,n=pm.width,pm.height,pm.n
  if np is not None:
    a=np.frombuffer(pm.samples,dtype=np.uint8).reshape(H,W,n)[:,:,:3].astype(int)
    mag=(a[:,:,0]>235)&(a[:,:,1]<30)&(a[:,:,2]>235);ink=(a<200).any(axis=2)&~mag
    def bb(m):
      ys,xs=np.nonzero(m)
      return None if len(xs)==0 else [round(float(xs.min())/dpi,2),round(float(ys.min())/dpi,2),round(float(xs.max()+1)/dpi,2),round(float(ys.max()+1)/dpi,2)]
    return bb(mag),bb(ink)
  s=pm.samples;mb=[W,H,-1,-1];ib=[W,H,-1,-1]
  for y in range(H):
    for x in range(W):
      i=(y*W+x)*n;r,g,b=s[i],s[i+1],s[i+2]
      if r>235 and g<30 and b>235: t=mb
      elif r<200 or g<200 or b<200: t=ib
      else: continue
      t[0]=min(t[0],x);t[1]=min(t[1],y);t[2]=max(t[2],x+1);t[3]=max(t[3],y+1)
  f=lambda t:None if t[2]<0 else [round(v/dpi,2) for v in t]
  return f(mb),f(ib)
sq,_=boxes(d[0]);ink=[boxes(p)[1] for p in d]
print(json.dumps({'pages':len(d),'sizes':sorted(set((round(p.rect.width/72,2),round(p.rect.height/72,2)) for p in d)),'square':None if not sq else [round(sq[2]-sq[0],2),round(sq[3]-sq[1],2)],'ink':ink}))
`,file]).toString());}

const DEV={
  computer:{viewport:{width:1280,height:900}},
  ipad:{viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD_UA,ipad:true},
  ipadPortrait:{viewport:{width:820,height:1180},hasTouch:true,userAgent:IPAD_UA,ipad:true},
  iphone:{viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE_UA},
};
const log=[];
async function context(br,dev,hold){const o=Object.assign({},DEV[dev]);const ipad=o.ipad;delete o.ipad;const ctx=await br.newContext(o);
  if(ipad)await ctx.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'platform',{get:()=>'MacIntel'});Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:()=>5});});
  /* print() only counts; while held (the default), the form's clean-up 1.5 s after printing is not run, so the PDF is taken in the
     print layout the button set up (as land-test.js does) */
  await ctx.addInitScript(hold=>{window.print=function(){window.__printed=(window.__printed||0)+1;};
    if(hold){const st=window.setTimeout;window.setTimeout=function(f,ms,...a){if(window.__printed&&ms>=600&&ms<=1600)return 0;return st.call(window,f,ms,...a);};}},hold!==false);
  return ctx;}
async function openForm(ctx){const p=await ctx.newPage();const mine=[];wire(p,mine);p.__log=mine;log.push(mine);
  await p.goto(BASE+'/'+ED+'/'+FILE,{waitUntil:'load'});await sleep(600);
  await p.evaluate(()=>{window.confirm=()=>true;});await p.evaluate(()=>document.querySelector('#simBtn').click());await sleep(450);
  return p;}
/* one print view: the settings, the view, the button; then the square, the Safari model if asked, the PDF (printOn closes the page) */
async function printView(ctx,c,o){return printOn(await openForm(ctx),c,o);}
async function printOn(p,c,o){o=o||{};
  await p.evaluate(({v,set,sheets})=>{if(sheets)S.meta.sheets=sheets;eval(set||'');renderAll();document.querySelector('#viewSeg button[data-view="'+v+'"]').click();},{v:c.view,set:c.set,sheets:o.sheets});await sleep(250);
  const pre=await p.evaluate(v=>({note:(document.querySelector('.vs-sheets[data-v="'+v+'"]')||{}).textContent||'',verdict:(document.querySelector('#cardsVerdict')||{}).textContent||''}),c.view);
  await p.evaluate(()=>document.querySelector('#outPrintBtn').click());await sleep(250);
  const info=await p.evaluate(safari=>{
    const sq=document.createElement('div');sq.id='ref1in';
    sq.setAttribute('style','position:absolute!important;left:0!important;top:0!important;width:1in!important;height:1in!important;background:#ff00ff!important;z-index:2147483647!important;display:block!important;visibility:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important');
    document.body.appendChild(sq);
    if(safari){const sh=new CSSStyleSheet();sh.replaceSync('@page{size:8.5in 11in;margin:0.5in}');document.adoptedStyleSheets=[...document.adoptedStyleSheets,sh];}
    const req=[...document.head.querySelectorAll('style')].map(s=>s.textContent).filter(t=>/^@media print\{@page\{size:letter/.test(t)).pop()||'';
    return {printed:window.__printed||0,req,turned:document.body.classList.contains('vs-turn'),fitted:[...document.querySelectorAll('section.vs-show .page.vs-fitted')].map(e=>+e.dataset.fit)};},!!o.safari);
  await p.emulateMedia({media:'print'});await sleep(200);
  info.vb=await p.evaluate(()=>{const v=document.querySelector('section.vs-show .page .vb');if(!v)return null;const m=getComputedStyle(v).transform;return {t:m,turned:/^matrix\(\s*0,\s*1,\s*-1,\s*0/.test(m)};});
  const file=OUT+(o.name||c.id)+'.pdf';fs.writeFileSync(file,await p.pdf({preferCSSPageSize:true,printBackground:true}));
  const r=Object.assign({},info,pre,pdfInfo(file));await p.close();return r;}

/* the print views; pages: what a computer prints from the simulation with these settings */
const CASES=[
  {id:'VS1-board-land',view:'board',set:"S.meta.b_page='land'",pages:1,land:true,board:true},
  {id:'VS1-board-port',view:'board',set:"S.meta.b_page='port'",pages:1,board:true},
  {id:'board-land-5x6-top',view:'board',set:"S.meta.b_page='land';S.meta.b_rows='5';S.meta.b_cols='6';S.meta.b_bandpos='top';S.meta.b_label='above'",pages:1,land:true,board:true},
  {id:'board-port-2x2-noband',view:'board',set:"S.meta.b_page='port';S.meta.b_rows='2';S.meta.b_cols='2';S.meta.b_bandpos='none';S.meta.b_dot='small'",pages:1,board:true},
  {id:'cards-2in',view:'cards',set:"S.meta.c_size='2'",pages:7},
  {id:'cards-1in',view:'cards',set:"S.meta.c_size='1'",pages:2},
  {id:'cards-3in-square-nocut',view:'cards',set:"S.meta.c_size='3';S.meta.c_cut='no';S.meta.c_round='no'",pages:14},
  {id:'rules-half-and-poster',view:'rules',set:"S.meta.r_size='half';S.meta.r_what='both'",pages:4},
  {id:'rules-full',view:'rules',set:"S.meta.r_size='full';S.meta.r_what='cards'",pages:5},
  {id:'rules-quarter-and-poster',view:'rules',set:"S.meta.r_size='quarter';S.meta.r_what='both'",pages:3},
  {id:'strips-all',view:'strips',set:'',pages:8},
  {id:'strips-schedule-across',view:'strips',set:"S.meta.sc_dir='h';S.meta.sc_size='1.5'",pages:7},
  {id:'strips-choice6-token10-wait3',view:'strips',set:"S.meta.ch_n='6';ensure();S.choice.forEach(o=>{if(!o.k)o.k='ball';});S.meta.tk_n='10';S.meta.w_n='3';S.meta.ft_words='no'",pages:8},
];

(async()=>{
  const br=await chromium.launch();console.log('edition: '+ED+'   server: '+BASE);

  /* ---------- 2: a computer prints as before ---------- */
  console.log('\n=== 2. a computer: the page request, sizes, sheets and the square as before');
  let ctx=await context(br,'computer');const comp={};
  for(const c of CASES){const r=await printView(ctx,c,{name:'computer-'+c.id});comp[c.id]=r;
    const size=c.land?[11,8.5]:[8.5,11],req='@media print{@page{size:letter '+(c.land?'landscape':'portrait')+';margin:0}}';
    check(r.printed===1&&r.req===req&&!r.turned&&r.pages===c.pages&&r.sizes.length===1&&near(r.sizes[0],size,.01)&&near(r.square||[],[1,1],.011),
      c.id+': '+r.pages+' sheet'+(r.pages===1?'':'s')+' of '+size.join(' x ')+' in, the square '+(r.square||[]).join(' x ')+' in, '+r.req.replace('@media print{@page{','').replace('}}',''),r);
    if(c.board)check(within(r.ink[0],c.land?[.5,.5,10.5,8]:[.5,.5,8,10.5],.03)&&near([r.ink[0][2]-r.ink[0][0],r.ink[0][3]-r.ink[0][1]],c.land?[10,7.5]:[7.5,10],.04),'  the board’s ink is '+(c.land?'10 x 7.5':'7.5 x 10')+' in, at the sheet’s half-inch border',r.ink[0]);}
  await ctx.close();
  if(ONLY==='computer'){await br.close();console.log('\n'+(fails?fails+' FAILED':'all passed'));process.exit(fails?1:0);}

  /* ---------- 1: the iPad (and the iPhone), Sheets Automatic, in the Safari model ---------- */
  console.log('\n=== 1. the iPad, Sheets Automatic, printed as Safari prints (portrait Letter, 0.5 in margins)');
  ctx=await context(br,'ipad');const TREQ=/^@media print\{@page\{size:letter portrait;margin:\.5in;@top-left\{content:none\}/;
  for(const c of CASES){const r=await printView(ctx,c,{safari:true,name:'ipad-'+c.id});
    check(r.printed===1&&r.turned&&TREQ.test(r.req)&&r.sizes.length===1&&near(r.sizes[0],[8.5,11],.01)&&near(r.square||[],[1,1],.011)&&r.pages===comp[c.id].pages&&!r.fitted.length,
      c.id+': scale '+(r.square?r.square[0].toFixed(2):'?')+', '+r.pages+' portrait sheet'+(r.pages===1?'':'s')+' (a computer: '+comp[c.id].pages+'), nothing scaled to fit',r);
    check(r.ink.every(b=>!b||within(b,SAFARI,.02)),'  every sheet’s ink inside the 7.5 x 10 in area Safari prints',r.ink.filter(b=>b&&!within(b,SAFARI,.02)));
    if(c.board)check(near(r.ink[0],SAFARI,.03)&&(c.land?r.vb&&r.vb.turned:!(r.vb&&r.vb.turned))&&/^Safari on the iPad and iPhone prints portrait only/.test(r.note)&&(c.land?/turned on its side/.test(r.note):/fills that area/.test(r.note)),
      '  the board fills the area at full size, '+(c.land?'turned a quarter on its side':'not turned')+'; the note says so',{ink:r.ink[0],vb:r.vb,note:r.note});}
  await ctx.close();
  for(const dev of ['iphone','ipadPortrait']){ctx=await context(br,dev);const r=await printView(ctx,CASES[0],{safari:true,name:dev+'-VS1-board-land'});
    check(r.turned&&near(r.square||[],[1,1],.011)&&r.pages===1&&near(r.ink[0],SAFARI,.03)&&r.vb&&r.vb.turned,(dev==='iphone'?'the iPhone':'the iPad held upright (820 x 1180)')+': the landscape board turned, at full size, scale '+(r.square?r.square[0].toFixed(2):'?'),r);await ctx.close();}

  /* ---------- 3: Sheets forced ---------- */
  console.log('\n=== 3. Sheets forced either way');
  ctx=await context(br,'computer');
  for(const c of [CASES[0],CASES[4],CASES[7]]){const r=await printView(ctx,c,{sheets:'turn',name:'computer-turn-'+c.id});
    check(r.turned&&TREQ.test(r.req)&&near(r.square||[],[1,1],.011)&&r.pages===comp[c.id].pages&&r.sizes.length===1&&near(r.sizes[0],[8.5,11],.01)&&r.ink.every(b=>!b||within(b,SAFARI,.02))&&(!c.board||near(r.ink[0],SAFARI,.03)),
      'a computer, Sheets "Portrait sheets for Safari", '+c.id+': the iPad layout on portrait Letter with half-inch margins, '+r.pages+' sheet(s), scale 1.00',r);}
  await ctx.close();
  ctx=await context(br,'ipad');{const r=await printView(ctx,CASES[0],{sheets:'full',safari:true,name:'ipad-full-VS1-board-land'});
    check(!r.turned&&r.req==='@media print{@page{size:letter landscape;margin:0}}'&&/shrinks such a sheet/.test(r.note)&&r.square&&r.square[0]<.8,
      'an iPad, Sheets "Full sheets": the computer’s request (landscape, no margin), which Safari shrinks (here to '+(r.square?r.square[0]:'?')+'); the note says to set Automatic',{req:r.req,sq:r.square,note:r.note});}

  /* ---------- 4: the iPad layout's own counts, the fit, the clean-up ---------- */
  console.log('\n=== 4. the iPad layout: schedule, 1 in cards, a poster too tall for the area');
  const STEPS="while(S.sched.length<14)S.sched.push({k:'bus',ph:'',l:''});S.meta.sc_dir='v';S.meta.sc_size='2'";
  {const r=await printView(ctx,{id:'schedule-14x2in',view:'strips',set:STEPS},{safari:true,name:'ipad-schedule-14x2in'});
    const cctx=await context(br,'computer');const q=await printView(cctx,{id:'schedule-14x2in',view:'strips',set:STEPS},{name:'computer-schedule-14x2in'});await cctx.close();
    check(q.pages===10&&r.pages===11&&near(r.square||[],[1,1],.011)&&!r.fitted.length&&r.ink.every(b=>!b||within(b,SAFARI,.02)),
      'a 2 in vertical schedule of 14 steps: 4 steps a sheet on a computer ('+q.pages+' strip sheets in all), 3 on the iPad ('+r.pages+'), each inside the area at full size',{comp:q.pages,ipad:r.pages,fit:r.fitted});}
  {const r=await printView(ctx,CASES[5],{safari:true,name:'ipad-cards-1in-cutlines'});const q=comp[CASES[5].id];
    check(/48 per page/.test(r.verdict)&&/54 per page/.test(q.verdict)&&r.ink.every(b=>!b||within(b,SAFARI,.005))&&q.ink[0][0]<.48,
      '1 in cards with cut lines: 48 a sheet on the iPad (54 on a computer, whose outer cut lines sit at '+q.ink[0][0]+' in, in the sheet’s border); on the iPad every cut line is inside the area',{ipad:r.verdict,comp:q.verdict,ink:r.ink,compInk:q.ink[0]});}
  const POSTER="while(S.rules.length<8)S.rules.push({on:true,k:'calm',ph:'',l:'Calm body',say:'Still body, slow breath.'});S.rules.forEach(r=>r.on=true);S.meta.r_what='poster'";
  let k8=0;{const r=await printView(ctx,{id:'poster-8',view:'rules',set:POSTER},{safari:true,name:'ipad-poster-8'});k8=r.fitted[0];
    check(r.pages===1&&r.fitted.length===1&&r.fitted[0]>.9&&r.fitted[0]<1&&near(r.square||[],[1,1],.011)&&within(r.ink[0],SAFARI,.02),
      'a poster of 8 rules (taller than the area): scaled to '+Math.round(r.fitted[0]*1000)/10+'% to fit its one sheet, the page itself at 1.00',r);}
  await ctx.close();
  /* the fit is measured on the screen, where the screen fit zooms the sheet (1.5 on a wide screen): the same scale */
  {const wide=await br.newContext({viewport:{width:1920,height:1080}});await wide.addInitScript(()=>{window.print=function(){window.__printed=(window.__printed||0)+1;};const st=window.setTimeout;window.setTimeout=function(f,ms,...a){if(window.__printed&&ms>=600&&ms<=1600)return 0;return st.call(window,f,ms,...a);};});
    const p=await openForm(wide);const z=await p.evaluate(()=>document.querySelector('main.sheet').style.zoom||'1');const r=await printOn(p,{id:'poster-8',view:'rules',set:POSTER},{sheets:'turn',name:'wide-turn-poster-8'});
    check(parseFloat(z)>1.1&&r.fitted.length===1&&Math.abs(r.fitted[0]-k8)<.005&&r.pages===1,'the same poster on a wide screen (the sheet zoomed '+z+'), Sheets "Portrait sheets for Safari": scaled '+r.fitted[0]+', as on the iPad ('+k8+')',{z,fit:r.fitted,pages:r.pages});
    await wide.close();}
  ctx=null;
  /* the clean-up: the button's own timer runs (nothing held) */
  ctx=await context(br,'ipad',false);{const p=await openForm(ctx);
    await p.evaluate(s=>{eval(s);renderAll();document.querySelector('#viewSeg button[data-view="rules"]').click();},POSTER);await sleep(200);
    const before=await p.evaluate(()=>document.querySelector('#rulesOut').innerHTML);
    await p.evaluate(()=>document.querySelector('#outPrintBtn').click());await sleep(300);
    const during=await p.evaluate(()=>({turn:document.body.classList.contains('vs-turn'),fit:document.querySelectorAll('#rulesOut .vs-fit').length}));await sleep(1700);
    const after=await p.evaluate(()=>({cls:document.body.className,fit:document.querySelectorAll('.vs-fit,.vs-fitted').length,rule:[...document.head.querySelectorAll('style')].some(s=>/^@media print\{@page\{size:letter/.test(s.textContent)),html:document.querySelector('#rulesOut').innerHTML}));
    check(during.turn&&during.fit===1&&!/vs-turn|vs-out-only/.test(after.cls)&&!after.fit&&!after.rule&&after.html===before,'after the print the form is as it was: the turned print state, the page request and the scaled frame are gone, the poster drawn as before',{during,after:{cls:after.cls,fit:after.fit,rule:after.rule,same:after.html===before}});
    await p.close();}

  /* ---------- 5: files ---------- */
  console.log('\n=== 5. the setting in the saved file; an old file');
  await ctx.close();ctx=await context(br,'ipad');
  const saveText=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const openFile=async(p,text)=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'VS-1_old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(500);};
  {const p=await openForm(ctx);
    await p.evaluate(()=>{const s=document.querySelector('[data-m="sheets"]');s.value='turn';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(150);
    const saved=await saveText(p);const d=JSON.parse(saved||'{}');
    const q=await openForm(ctx);await openFile(q,saved);
    check(d.S&&d.S.meta.sheets==='turn'&&await q.evaluate(()=>S.meta.sheets==='turn'&&document.querySelector('[data-m="sheets"]').value==='turn'),'Sheets "Portrait sheets for Safari" is saved with the data and opens again',d.S&&d.S.meta.sheets);
    /* the old file: one saved before A7, or this one with its Sheets taken out */
    let old=process.env.A7_OLD_VS1?fs.readFileSync(process.env.A7_OLD_VS1,'utf8'):null;
    if(!old){const o=JSON.parse(saved);delete o.S.meta.sheets;o.S.photos=[{id:'pold1',label:'bus',img:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=='}];o.S.board[0]={k:'',ph:'pold1',l:'Our bus'};old=JSON.stringify(o);}
    const od=JSON.parse(old);check(!('sheets' in od.S.meta),'the old file has no Sheets setting'+(process.env.A7_OLD_VS1?' ('+process.env.A7_OLD_VS1.split('/').pop()+')':''));
    const r=await openForm(ctx);await openFile(r,old);
    const got=await r.evaluate(()=>JSON.parse(JSON.stringify(S)));const sheets=got.meta.sheets;delete got.meta.sheets;
    const diff=Object.keys(od.S).filter(k=>JSON.stringify(od.S[k])!==JSON.stringify(got[k]));
    check(sheets==='auto'&&!diff.length&&await r.evaluate(()=>document.querySelector('[data-m="sheets"]').value==='auto'),'the old file opens with every field as saved ('+Object.keys(od.S).length+' parts compared) and Sheets Automatic',{sheets,diff});
    const land=od.S.meta.b_page!=='port',pr=await printOn(r,{id:'old-board',view:'board',set:''},{safari:true,name:'ipad-old-file-board'});
    check(pr.turned&&near(pr.square||[],[1,1],.011)&&pr.pages===1&&near(pr.ink[0],SAFARI,.03)&&(land?pr.vb&&pr.vb.turned:!(pr.vb&&pr.vb.turned)),'and its board ('+(land?'landscape':'portrait')+') prints from the iPad at full size',pr);
    await p.close();await q.close();}
  await ctx.close();

  /* ---------- 6: the screen ---------- */
  console.log('\n=== 6. the screen');
  const screen=async dev=>{const c=await context(br,dev);const p=await openForm(c);
    const v=await p.evaluate(()=>{const cell=document.querySelector('#boardOut .cell2');const notes={};document.querySelectorAll('.vs-sheets').forEach(n=>{notes[n.dataset.v]=n.textContent;});
      return {cell:[cell.offsetWidth,cell.offsetHeight],page:[document.querySelector('#boardOut .page').offsetWidth,document.querySelector('#boardOut .page').offsetHeight],notes,noprint:[...document.querySelectorAll('.vs-sheets')].every(n=>n.classList.contains('noprint'))&&document.querySelector('[data-m="sheets"]').closest('.noprint')!==null};});
    await p.close();await c.close();return v;};
  const sc=await screen('computer'),si=await screen('ipad');
  check(sc.cell.join()===si.cell.join()&&sc.page.join()===si.page.join()&&sc.page.join()==='1056,816','the board preview is the same on both: the 11 x 8.5 in sheet, cells '+(sc.cell[0]/96).toFixed(2)+' in',{sc,si});
  check(/^Prints on Letter landscape with no margin/.test(sc.notes.board)&&/Sheets: Automatic\.$/.test(sc.notes.board)&&['cards','rules','strips'].every(k=>/^Each visual prints on its own Letter portrait sheet/.test(sc.notes[k])&&/\(on the Board page\)\.$/.test(sc.notes[k])),'a computer’s notes: Letter, no margin, true size; the Sheets setting is on the Board page',sc.notes);
  check(/turned on its side/.test(si.notes.board)&&['cards','rules','strips'].every(k=>/^Safari on the iPad and iPhone prints portrait only/.test(si.notes[k])),'the iPad’s notes: Safari’s area, full size, the board turned',si.notes);
  check(sc.noprint,'the notes and the Sheets setting stay off paper (noprint), so the form’s own print is unchanged');

  const errs=log.flat().filter(l=>l.type==='error'||l.type==='pageerror');
  check(!errs.length,'no console or page errors',errs.slice(0,5));
  await br.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
