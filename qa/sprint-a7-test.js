/* Sprint package A7: visual supports print at full size from the iPad (VS-1).
   Safari on the iPad and iPhone prints on portrait Letter inside its own margins (about half an inch, with the address and date at
   the foot; SETUP.md, v21.42h), whatever the page asks for. As in the audit's land-test.js, each print view goes through the form's
   own "Print the visuals" button; in the Safari model a stylesheet laid over the page's own request asks for portrait Letter with
   0.5 in margins, and a 1 in square placed on the page gives the scale (1.00: nothing shrunk; measured from the PDF's own drawing).
   Turned, the form draws each sheet for the area TK-1 lays its turned sheets out in, 7.4 x 9.45 in (TK-1's TW and TH), centred at
   the top of Safari's 7.5 x 10 in, so a foot or margins a little larger than modelled never push a sliver onto a sheet of its own.
   The iPad is emulated as iPadOS reports itself (Safari's Mac user agent, MacIntel with touch points), the iPhone by its user agent;
   a computer is a plain desktop Chromium.
   1  iPad, Sheets Automatic: every print view (the board landscape and portrait, card sheets at 1, 2 and 3 in, rule cards full, half
      and quarter with the poster, and the strips: first-then, the schedule both ways, the choice and token boards, the wait card and
      countdown, the feelings scale, the break and help cards) prints portrait at 1.00, as many sheets as a computer prints, nothing
      scaled to fit, and every sheet's ink inside TK-1's area; the board fills that area (a landscape board turned on its side). With
      a 0.25 in foot as well (a bottom margin of 0.75 in): the same sheets at 1.00. The audit's two cases are named as in
      land-test.js: VS1-board-land and VS1-board-port. The iPhone and the iPad held upright get the turned board too.
   2  a computer: the page request, the page sizes, the sheet counts and the square as before (the landscape board 11 x 8.5 in, every
      other sheet 8.5 x 11 in, 1.00), the board's ink 10 x 7.5 in at the sheet's half-inch border. Run against the committed form
      too (WS_URL to a copy of the edition holding it) to see that these are its numbers.
   3  Sheets forced: "Portrait sheets for Safari" on a computer prints the iPad layout; "Full sheets" on an iPad asks for the
      computer's paper, which Safari shrinks (the note says so).
   4  the iPad layout's own counts: a 2 in vertical schedule takes 3 steps a sheet (4 on a computer); 1 in cards with cut lines 48 a
      sheet (54), every cut line inside the area, the verdict giving both counts (the Safari one on the screen only); a horizontal
      schedule of fourteen 2 in steps goes on 2 sheets in whole rows, nothing scaled (a computer runs its one strip past the sheet);
      a poster of all sixteen rules, still too tall for the area, is scaled to fit its one sheet, and the rule cards' note names it
      with that percentage before the print; the same scale on a zoomed wide screen; after the print the form is as it was.
   5  files: the setting is saved and opens again; a file saved before A7 (OLD_VS1 below, saved by the committed form: a portrait
      board with a photo, 1 in cards) opens with every part as saved and Sheets Automatic, in a fresh page and after Sheets was set
      either way in the same page; its board prints from the iPad at full size.
   6  the screen and the form's own print: on the iPad the outputs drawn on the screen are a computer's, byte for byte (so the form's
      own print, the workstation's Print and the packet are as before), and the whole-form print has a computer's page count; the
      board preview is the same; the line above each page's visuals names the layout; no console or page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8307 node qa/sprint-a7-test.js [edition folder, default NBH-Workstation]
          A7_OLD_VS1=<file> opens that saved file as the old file instead of OLD_VS1
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
const TK1=[.55,.5,7.95,9.95];  /* TK-1's 7.4 x 9.45 in, centred at the top of it: every turned sheet's ink lies inside */
const MODEL='0.5in',FOOT='0.5in 0.5in 0.75in';   /* Safari's margins as modelled; and with a 0.25 in foot under the sheet */

/* a file saved by the committed form before A7 (no Sheets setting): the simulation with a portrait board whose first cell is a
   photo labelled "Our bus", 1 in cards and a sixth rule ticked; JSON.stringify(OLD_VS1,null,1) is the file as the form wrote it */
const OLD_VS1={"form":"VS-1","rev":"2026-10","saved":"2026-10-04T13:07:35.393Z","S":{"meta":{"client":"SIMULATED – Sample Student","b_title":"MY NEEDS","b_bandpos":"bottom","b_color":"#cfe3cf","b_rows":"3","b_cols":"4","b_page":"port","b_dot":"yes","b_label":"below","b_dim":"full","c_size":"1","c_label":"above","c_cut":"yes","c_round":"yes","r_size":"half","r_title":"Our Classroom Expectations","r_what":"both","ft_words":"yes","sc_dir":"v","sc_size":"2","sc_title":"Sam’s Schedule","ch_title":"I want…","ch_n":"4","tk_n":"5","tk_title":"I am working for…","w_n":"5","w_words":"Wait. It is coming.","fs_title":"How big is my feeling?"},"chk":{"s_ft":true,"s_sched":true,"s_choice":true,"s_token":true,"s_wait":true,"s_scale":true,"s_break":true},"photos":[{"id":"pmutu5pzj4vz","label":"bus","img":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAAoADwDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AlwGoJIAAAAAAAAAAAAAAAAAAAAAB/9k="}],"board":[{"k":"","ph":"pmutu5pzj4vz","l":"Our bus"},{"k":"eat","ph":"","l":""},{"k":"drink","ph":"","l":""},{"k":"walk","ph":"","l":""},{"k":"phone","ph":"","l":""},{"k":"sleep","ph":"","l":""},{"k":"clothes","ph":"","l":""},{"k":"computer","ph":"","l":""},{"k":"doctor","ph":"","l":""},{"k":"family","ph":"","l":""},{"k":"home","ph":"","l":""},{"k":"help","ph":"","l":""}],"cards":[{"k":"writing","ph":"","l":"Writing","qty":"40"},{"k":"math","ph":"","l":"Math","qty":"20"},{"k":"recess","ph":"","l":"Recess","qty":"20"}],"rules":[{"on":true,"k":"safehands","ph":"","l":"Safe hands","say":"Hands to myself and gentle with things."},{"on":true,"k":"walkingfeet","ph":"","l":"Walking feet","say":"In the hallway we walk."},{"on":true,"k":"sitting","ph":"","l":"Sitting","say":"Bottom on the chair, feet on the floor."},{"on":true,"k":"waiting","ph":"","l":"Waiting","say":"My turn is coming. Hands in my lap."},{"on":true,"k":"quiet","ph":"","l":"Quiet voice","say":"Inside voice, so everyone can work."},{"on":true,"k":"listening","ph":"","l":"Listening ears","say":"Eyes on the speaker, mouth quiet."},{"on":false,"k":"raisehand","ph":"","l":"Raise my hand","say":"Hand up and wait to be called on."},{"on":false,"k":"askhelp","ph":"","l":"Ask for help","say":"Hand up, or the help card."},{"on":false,"k":"takebreak","ph":"","l":"Take a break","say":"Use the break card, then come back."},{"on":false,"k":"stayarea","ph":"","l":"Stay in my area","say":"In my space until the teacher says."},{"on":false,"k":"calm","ph":"","l":"Calm body","say":"Still body, slow breath."},{"on":false,"k":"eyes","ph":"","l":"Eyes on the teacher","say":"Look at the teacher when she talks."},{"on":false,"k":"kindwords","ph":"","l":"Kind words","say":"Say it kindly or ask for help."},{"on":false,"k":"lineup","ph":"","l":"Line up","say":"Walking feet to my spot in line."},{"on":false,"k":"cleanup","ph":"","l":"Clean up","say":"Put things back where they go."},{"on":false,"k":"stop","ph":"","l":"Stop","say":"Stop and look at the adult."}],"ft":[{"k":"writing","ph":"","l":"First"},{"k":"ipad","ph":"","l":"Then"}],"sched":[{"k":"arrival","ph":"","l":""},{"k":"reading","ph":"","l":""},{"k":"math","ph":"","l":""},{"k":"snack","ph":"","l":""},{"k":"recess","ph":"","l":""},{"k":"lunch","ph":"","l":""}],"choice":[{"k":"ipad","ph":"","l":""},{"k":"ball","ph":"","l":""},{"k":"drawing","ph":"","l":""},{"k":"puzzle","ph":"","l":""},{"k":"bubbles","ph":"","l":""},{"k":"story","ph":"","l":""}],"tk":[{"k":"sticker","ph":"","l":""},{"k":"ipad","ph":"","l":""}],"fs":[{"k":"calmface","ph":"","l":"Calm","d":"I am ready to learn."},{"k":"ok","ph":"","l":"A little upset","d":"Take three slow breaths."},{"k":"worried","ph":"","l":"Upset","d":"Ask for a break with my card."},{"k":"frustrated","ph":"","l":"Very upset","d":"Go to the calm corner; squeeze the ball."},{"k":"angry","ph":"","l":"Too big","d":"Get an adult. Use my words or my card."}]}};

/* the PDF: pages, sizes, the square on sheet 1 (its rectangle as drawn; else its pixels) and each sheet's ink (anything darker than a
   light grey, the magenta square left out) */
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
rect=None
for dr in d[0].get_drawings():
  c=dr.get('fill')
  if c and c[0]>.9 and c[1]<.15 and c[2]>.9: rect=dr['rect']
square=[round(rect.width/72,3),round(rect.height/72,3)] if rect else (None if not sq else [round(sq[2]-sq[0],2),round(sq[3]-sq[1],2)])
print(json.dumps({'pages':len(d),'sizes':sorted(set((round(p.rect.width/72,2),round(p.rect.height/72,2)) for p in d)),'square':square,'ink':ink}))
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
/* the settings and the view, then the note and the verdict as the screen shows them (the note's measure runs a moment after) */
async function setUp(p,c,o){o=o||{};
  await p.evaluate(({v,set,sheets})=>{if(sheets)S.meta.sheets=sheets;eval(set||'');renderAll();document.querySelector('#viewSeg button[data-view="'+v+'"]').click();},{v:c.view,set:c.set,sheets:o.sheets});await sleep(400);
  return p.evaluate(v=>({note:(document.querySelector('.vs-sheets[data-v="'+v+'"]')||{}).textContent||'',verdict:(document.querySelector('#cardsVerdict')||{}).textContent||'',
    printedVerdict:(()=>{const e=document.querySelector('#cardsVerdict');if(!e)return '';const k=e.cloneNode(true);k.querySelectorAll('.noprint').forEach(x=>x.remove());return k.textContent;})()}),c.view);}
/* one print view: the settings, the view, the button; then the square, the Safari model if asked, the PDF (printOn closes the page) */
async function printView(ctx,c,o){return printOn(await openForm(ctx),c,o);}
async function printOn(p,c,o){o=o||{};const pre=await setUp(p,c,o);
  await p.evaluate(()=>document.querySelector('#outPrintBtn').click());await sleep(250);
  const info=await p.evaluate(model=>{
    const sq=document.createElement('div');sq.id='ref1in';
    sq.setAttribute('style','position:absolute!important;left:0!important;top:0!important;width:1in!important;height:1in!important;background:#ff00ff!important;z-index:2147483647!important;display:block!important;visibility:visible!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important');
    document.body.appendChild(sq);
    if(model){const sh=new CSSStyleSheet();sh.replaceSync('@page{size:8.5in 11in;margin:'+model+'}');document.adoptedStyleSheets=[...document.adoptedStyleSheets,sh];}
    const req=[...document.head.querySelectorAll('style')].map(s=>s.textContent).filter(t=>/^@media print\{@page\{size:letter/.test(t)).pop()||'';
    return {printed:window.__printed||0,req,turned:document.body.classList.contains('vs-turn'),fitted:[...document.querySelectorAll('section.vs-show .page.vs-fitted')].map(e=>+e.dataset.fit)};},o.safari?(o.model||MODEL):'');
  await p.emulateMedia({media:'print'});await sleep(200);
  info.vb=await p.evaluate(()=>{const v=document.querySelector('section.vs-show .page .vb');if(!v)return null;const m=getComputedStyle(v).transform;return {t:m,turned:/^matrix\(\s*0,\s*1,\s*-1,\s*0/.test(m)};});
  const file=OUT+(o.name||c.id)+'.pdf';fs.writeFileSync(file,await p.pdf({preferCSSPageSize:true,printBackground:true}));
  const r=Object.assign({},info,pre,pdfInfo(file));if(!o.keep)await p.close();return r;}
const sq1=r=>near(r.square||[],[1,1],.011);

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
const TREQ=/^@media print\{@page\{size:letter portrait;margin:\.5in;@top-left\{content:none\}/;

(async()=>{
  const br=await chromium.launch();console.log('edition: '+ED+'   server: '+BASE);

  /* ---------- 2: a computer prints as before ---------- */
  console.log('\n=== 2. a computer: the page request, sizes, sheets and the square as before');
  let ctx=await context(br,'computer');const comp={};
  for(const c of CASES){const r=await printView(ctx,c,{name:'computer-'+c.id});comp[c.id]=r;
    const size=c.land?[11,8.5]:[8.5,11],req='@media print{@page{size:letter '+(c.land?'landscape':'portrait')+';margin:0}}';
    check(r.printed===1&&r.req===req&&!r.turned&&r.pages===c.pages&&r.sizes.length===1&&near(r.sizes[0],size,.01)&&sq1(r),
      c.id+': '+r.pages+' sheet'+(r.pages===1?'':'s')+' of '+size.join(' x ')+' in, the square '+(r.square||[]).join(' x ')+' in, '+r.req.replace('@media print{@page{','').replace('}}',''),r);
    if(c.board)check(within(r.ink[0],c.land?[.5,.5,10.5,8]:[.5,.5,8,10.5],.03)&&near([r.ink[0][2]-r.ink[0][0],r.ink[0][3]-r.ink[0][1]],c.land?[10,7.5]:[7.5,10],.04),'  the board’s ink is '+(c.land?'10 x 7.5':'7.5 x 10')+' in, at the sheet’s half-inch border',r.ink[0]);}
  await ctx.close();
  if(ONLY==='computer'){await br.close();console.log('\n'+(fails?fails+' FAILED':'all passed'));process.exit(fails?1:0);}

  /* ---------- 1: the iPad (and the iPhone), Sheets Automatic, in the Safari model ---------- */
  console.log('\n=== 1. the iPad, Sheets Automatic, printed as Safari prints (portrait Letter, 0.5 in margins; then with a 0.25 in foot)');
  ctx=await context(br,'ipad');
  for(const c of CASES){const r=await printView(ctx,c,{safari:true,name:'ipad-'+c.id});
    check(r.printed===1&&r.turned&&TREQ.test(r.req)&&r.sizes.length===1&&near(r.sizes[0],[8.5,11],.01)&&sq1(r)&&r.pages===comp[c.id].pages&&!r.fitted.length,
      c.id+': scale '+(r.square?r.square[0].toFixed(2):'?')+', '+r.pages+' portrait sheet'+(r.pages===1?'':'s')+' (a computer: '+comp[c.id].pages+'), nothing scaled to fit',r);
    check(r.ink.every(b=>!b||within(b,TK1,.02)),'  every sheet’s ink inside TK-1’s 7.4 x 9.45 in area at the top of the area Safari prints',r.ink.filter(b=>b&&!within(b,TK1,.02)));
    if(c.board)check(near(r.ink[0],TK1,.03)&&(c.land?r.vb&&r.vb.turned:!(r.vb&&r.vb.turned))&&/^Safari on the iPad and iPhone prints portrait only/.test(r.note)&&(c.land?/turns the board on its side/.test(r.note):/lays the board out in the area/.test(r.note))&&/nothing is shrunk/.test(r.note),
      '  the board fills that area, '+(c.land?'9.45 x 7.4 in turned a quarter on its side':'7.4 x 9.45 in, not turned')+'; the note says so',{ink:r.ink[0],vb:r.vb,note:r.note});
    const f=await printView(ctx,c,{safari:true,model:FOOT,name:'ipad-foot-'+c.id});
    check(f.pages===comp[c.id].pages&&sq1(f)&&!f.fitted.length,'  with a 0.25 in foot as well: '+f.pages+' sheet'+(f.pages===1?'':'s')+' at '+(f.square?f.square[0].toFixed(2):'?')+', no sliver on a sheet of its own',{pages:f.pages,sq:f.square});}
  await ctx.close();
  for(const dev of ['iphone','ipadPortrait']){ctx=await context(br,dev);const r=await printView(ctx,CASES[0],{safari:true,name:dev+'-VS1-board-land'});
    check(r.turned&&sq1(r)&&r.pages===1&&near(r.ink[0],TK1,.03)&&r.vb&&r.vb.turned,(dev==='iphone'?'the iPhone':'the iPad held upright (820 x 1180)')+': the landscape board turned, at full size, scale '+(r.square?r.square[0].toFixed(2):'?'),r);await ctx.close();}

  /* ---------- 3: Sheets forced ---------- */
  console.log('\n=== 3. Sheets forced either way');
  ctx=await context(br,'computer');
  for(const c of [CASES[0],CASES[4],CASES[7]]){const r=await printView(ctx,c,{sheets:'turn',name:'computer-turn-'+c.id});
    check(r.turned&&TREQ.test(r.req)&&sq1(r)&&r.pages===comp[c.id].pages&&r.sizes.length===1&&near(r.sizes[0],[8.5,11],.01)&&r.ink.every(b=>!b||within(b,TK1,.02))&&(!c.board||near(r.ink[0],TK1,.03)),
      'a computer, Sheets "Portrait sheets for Safari", '+c.id+': the iPad layout on portrait Letter with half-inch margins, '+r.pages+' sheet(s), scale 1.00',r);}
  await ctx.close();
  ctx=await context(br,'ipad');{const r=await printView(ctx,CASES[0],{sheets:'full',safari:true,name:'ipad-full-VS1-board-land'});
    check(!r.turned&&r.req==='@media print{@page{size:letter landscape;margin:0}}'&&/shrinks such a sheet/.test(r.note)&&r.square&&r.square[0]<.8,
      'an iPad, Sheets "Full sheets": the computer’s request (landscape, no margin), which Safari shrinks (here to '+(r.square?r.square[0]:'?')+'); the note says to set Automatic',{req:r.req,sq:r.square,note:r.note});}

  /* ---------- 4: the iPad layout's own counts, the fit, the clean-up ---------- */
  console.log('\n=== 4. the iPad layout: schedules, 1 in cards, a poster too tall for the area');
  const STEPS="while(S.sched.length<14)S.sched.push({k:'bus',ph:'',l:''});S.meta.sc_dir='v';S.meta.sc_size='2'";
  {const r=await printView(ctx,{id:'schedule-14x2in',view:'strips',set:STEPS},{safari:true,name:'ipad-schedule-14x2in'});
    const cctx=await context(br,'computer');const q=await printView(cctx,{id:'schedule-14x2in',view:'strips',set:STEPS},{name:'computer-schedule-14x2in'});await cctx.close();
    check(q.pages===10&&r.pages===11&&sq1(r)&&!r.fitted.length&&r.ink.every(b=>!b||within(b,TK1,.02))&&/The schedule takes 3 steps a sheet \(4 here\), on 5 sheets\./.test(r.note),
      'a 2 in vertical schedule of 14 steps: 4 steps a sheet on a computer ('+q.pages+' strip sheets in all), 3 on the iPad ('+r.pages+'), each inside the area at full size; the note says so',{comp:q.pages,ipad:r.pages,fit:r.fitted,note:r.note});}
  {const r=await printView(ctx,CASES[5],{safari:true,name:'ipad-cards-1in-cutlines'});const q=comp[CASES[5].id];
    check(/^80 cards at 1 inch: 54 per page, 2 pages\. Print the visuals lays them out for Safari: 48 per page, 2 pages\.$/.test(r.verdict)&&!/Safari|48/.test(r.printedVerdict)&&/54 per page/.test(r.printedVerdict)&&/54 per page/.test(q.verdict)&&!/Safari/.test(q.verdict)&&r.ink.every(b=>!b||within(b,TK1,.005))&&q.ink[0][0]<.48,
      '1 in cards with cut lines: 48 a sheet on the iPad (54 on a computer, whose outer cut lines sit at '+q.ink[0][0]+' in, in the sheet’s border); every cut line inside the area; the verdict gives both counts, the Safari one on the screen only',{ipad:r.verdict,printed:r.printedVerdict,comp:q.verdict,ink:r.ink,compInk:q.ink[0]});}
  const ACROSS="S.chk={s_sched:true};while(S.sched.length<14)S.sched.push({k:'bus',ph:'',l:''});S.meta.sc_dir='h';S.meta.sc_size='2'";
  {const r=await printView(ctx,{id:'schedule-across-14x2in',view:'strips',set:ACROSS},{safari:true,name:'ipad-schedule-across-14x2in'});
    const cctx=await context(br,'computer');const q=await printView(cctx,{id:'schedule-across-14x2in',view:'strips',set:ACROSS},{name:'computer-schedule-across-14x2in'});await cctx.close();
    check(r.pages===2&&sq1(r)&&!r.fitted.length&&r.ink.every(b=>!b||within(b,TK1,.02))&&/The schedule’s 14 steps go on 2 sheets, 9 a sheet/.test(r.note)&&q.pages===2&&q.ink[1]&&q.ink[1][1]<.6,
      'a horizontal schedule of fourteen 2 in steps: on the iPad 2 sheets of whole rows (9 steps, then 5), nothing scaled, inside the area, and the note says so; a computer runs its one strip onto a second sheet, as before',{ipad:r.pages,fit:r.fitted,note:r.note,comp:q.pages,compInk:q.ink});}
  const POSTER="S.rules.forEach(r=>r.on=true);S.meta.r_what='poster'";
  let k16=0;{const p=await openForm(ctx);const pre=await setUp(p,{view:'rules',set:POSTER});const r=await printOn(p,{id:'poster-16',view:'rules',set:POSTER},{safari:true,name:'ipad-poster-16'});k16=r.fitted[0];
    const pct=Math.min(99,Math.round(k16*100));
    check(r.pages===1&&r.fitted.length===1&&r.fitted[0]>.9&&r.fitted[0]<1&&sq1(r)&&within(r.ink[0],TK1,.02),
      'a poster of all 16 rules (taller than the area): scaled to '+Math.round(r.fitted[0]*1000)/10+'% to fit its one sheet, the page itself at 1.00',r);
    check(new RegExp('so nothing is shrunk but the poster, still too tall for that area: it prints at '+pct+'% to fit its sheet\\.').test(pre.note),'  before the print, the rule cards’ note names the poster and the '+pct+'% it prints at',pre.note);}
  await ctx.close();
  /* the fit is measured on the screen, where the screen fit zooms the sheet (1.5 on a wide screen): the same scale */
  {const wide=await br.newContext({viewport:{width:1920,height:1080}});await wide.addInitScript(()=>{window.print=function(){window.__printed=(window.__printed||0)+1;};const st=window.setTimeout;window.setTimeout=function(f,ms,...a){if(window.__printed&&ms>=600&&ms<=1600)return 0;return st.call(window,f,ms,...a);};});
    const p=await openForm(wide);const z=await p.evaluate(()=>document.querySelector('main.sheet').style.zoom||'1');const r=await printOn(p,{id:'poster-16',view:'rules',set:POSTER},{sheets:'turn',name:'wide-turn-poster-16'});
    check(parseFloat(z)>1.1&&r.fitted.length===1&&Math.abs(r.fitted[0]-k16)<.005&&r.pages===1&&new RegExp('but the poster, still too tall for that area: it prints at '+Math.min(99,Math.round(k16*100))+'% to fit').test(r.note),'the same poster on a wide screen (the sheet zoomed '+z+'), Sheets "Portrait sheets for Safari": scaled '+r.fitted[0]+', as on the iPad ('+k16+'), and the note names it',{z,fit:r.fitted,pages:r.pages,note:r.note});
    await wide.close();}
  /* the clean-up: the button's own timer runs (nothing held) */
  ctx=await context(br,'ipad',false);{const p=await openForm(ctx);
    await p.evaluate(s=>{eval(s);renderAll();document.querySelector('#viewSeg button[data-view="rules"]').click();},POSTER);await sleep(300);
    const before=await p.evaluate(()=>document.querySelector('#rulesOut').innerHTML);
    await p.evaluate(()=>document.querySelector('#outPrintBtn').click());await sleep(300);
    const during=await p.evaluate(()=>({turn:document.body.classList.contains('vs-turn'),fit:document.querySelectorAll('#rulesOut .vs-fit').length,drawn:document.querySelector('#rulesOut .page').style.width}));await sleep(1700);
    const after=await p.evaluate(()=>({cls:document.body.className,fit:document.querySelectorAll('.vs-fit,.vs-fitted').length,rule:[...document.head.querySelectorAll('style')].some(s=>/^@media print\{@page\{size:letter/.test(s.textContent)),html:document.querySelector('#rulesOut').innerHTML,lay:typeof LAY!=='undefined'&&LAY}));
    check(during.turn&&during.fit===1&&during.drawn==='7.4in'&&!/vs-turn|vs-out-only/.test(after.cls)&&!after.fit&&!after.rule&&!after.lay&&after.html===before,'after the print the form is as it was: the turned print state, the page request and the sheets drawn for Safari are gone, the poster drawn as before',{during,after:{cls:after.cls,fit:after.fit,rule:after.rule,lay:after.lay,same:after.html===before}});
    await p.close();}

  /* ---------- 5: files ---------- */
  console.log('\n=== 5. the setting in the saved file; a file saved before A7');
  await ctx.close();ctx=await context(br,'ipad');
  const saveText=p=>p.evaluate(()=>new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t);});return o(b);};document.querySelector('#saveBtn').click();setTimeout(()=>res(null),3000);}));
  const openFile=async(p,text)=>{await p.evaluate(t=>{const dt=new DataTransfer();dt.items.add(new File([t],'VS-1_old.json',{type:'application/json'}));const i=document.querySelector('#fileIn');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));},text);await sleep(500);};
  const setSheets=(p,v)=>p.evaluate(v=>{const s=document.querySelector('[data-m="sheets"]');s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));},v);
  {const p=await openForm(ctx);
    await setSheets(p,'turn');await sleep(150);
    const saved=await saveText(p);const d=JSON.parse(saved||'{}');
    const q=await openForm(ctx);await openFile(q,saved);
    check(d.S&&d.S.meta.sheets==='turn'&&await q.evaluate(()=>S.meta.sheets==='turn'&&document.querySelector('[data-m="sheets"]').value==='turn'),'Sheets "Portrait sheets for Safari" is saved with the data and opens again',d.S&&d.S.meta.sheets);
    const old=process.env.A7_OLD_VS1?fs.readFileSync(process.env.A7_OLD_VS1,'utf8'):JSON.stringify(OLD_VS1,null,1);
    const od=JSON.parse(old);check(od.form==='VS-1'&&!('sheets' in od.S.meta),'the old file is a VS-1 file with no Sheets setting ('+(process.env.A7_OLD_VS1?process.env.A7_OLD_VS1.split('/').pop():'saved by the committed form before A7, '+old.length+' bytes')+')');
    const compare=async(r,how)=>{const got=await r.evaluate(()=>JSON.parse(JSON.stringify(S)));const sheets=got.meta.sheets;delete got.meta.sheets;
      const diff=Object.keys(od.S).filter(k=>JSON.stringify(od.S[k])!==JSON.stringify(got[k]));const shown=await r.evaluate(()=>document.querySelector('[data-m="sheets"]').value);
      check(sheets==='auto'&&shown==='auto'&&!diff.length,'the old file opens '+how+' with every part as saved ('+Object.keys(od.S).length+' parts compared) and Sheets Automatic',{sheets,shown,diff});};
    const r=await openForm(ctx);await openFile(r,old);await compare(r,'in a fresh page');
    for(const v of ['full','turn']){const s=await openForm(ctx);await setSheets(s,v);await sleep(150);await openFile(s,old);await compare(s,'after Sheets was set to '+(v==='full'?'Full sheets':'Portrait sheets for Safari')+' in the same page');
      const t=await s.evaluate(()=>({turned:turned(),note:(document.querySelector('.vs-sheets[data-v="board"]')||{}).textContent}));check(t.turned&&/Sheets: Automatic\.$/.test(t.note),'  and prints turned, as Automatic does on an iPad; the note says Automatic',t);await s.close();}
    const land=od.S.meta.b_page!=='port',pr=await printOn(r,{id:'old-board',view:'board',set:''},{safari:true,name:'ipad-old-file-board'});
    check(pr.turned&&sq1(pr)&&pr.pages===1&&near(pr.ink[0],TK1,.03)&&(land?pr.vb&&pr.vb.turned:!(pr.vb&&pr.vb.turned)),'and its board ('+(land?'landscape':'portrait')+', the photo in its first cell) prints from the iPad at full size, filling the area',pr);
    await p.close();await q.close();}
  await ctx.close();

  /* ---------- 6: the screen and the form's own print ---------- */
  console.log('\n=== 6. the screen and the form’s own print');
  const OUTS=()=>({board:document.querySelector('#boardOut').innerHTML,cards:document.querySelector('#cardsOut').innerHTML,rules:document.querySelector('#rulesOut').innerHTML,strips:document.querySelector('#stripsOut').innerHTML});
  const WHOLE="S.meta.c_size='1';while(S.sched.length<8)S.sched.push({k:'bus',ph:'',l:''});S.meta.sc_dir='v';S.meta.sc_size='2'";
  const SETS=['',WHOLE,"S.meta.c_size='1.5';S.meta.c_cut='no';S.meta.b_page='port'",ACROSS,"S.rules.forEach(r=>r.on=true);S.meta.r_size='quarter'"];
  const screenOf=async(dev)=>{const c=await context(br,dev);const p=await openForm(c);const outs=[];
    for(const s of SETS)outs.push(await p.evaluate(({s,g})=>{S=JSON.parse(window.__s0||(window.__s0=JSON.stringify(S)));eval(s);renderAll();return eval('('+g+')')();},{s,g:OUTS.toString()}));
    /* the whole-form print (Print / Save as PDF, as the workstation's Print), the reviewer's case: 1 in cards and eight 2 in steps */
    await p.evaluate(s=>{S=JSON.parse(window.__s0);eval(s);renderAll();},WHOLE);await p.evaluate(()=>document.querySelector('#printBtn').click());await sleep(200);
    await p.emulateMedia({media:'print'});await sleep(200);const file=OUT+'whole-'+dev+'.pdf';fs.writeFileSync(file,await p.pdf({preferCSSPageSize:true,printBackground:true}));
    const v=await p.evaluate(()=>{const cell=document.querySelector('#boardOut .cell2');const notes={};document.querySelectorAll('.vs-sheets').forEach(n=>{notes[n.dataset.v]=n.textContent;});
      return {cell:[cell.offsetWidth,cell.offsetHeight],page:[document.querySelector('#boardOut .page').offsetWidth,document.querySelector('#boardOut .page').offsetHeight],notes,noprint:[...document.querySelectorAll('.vs-sheets')].every(n=>n.classList.contains('noprint'))&&document.querySelector('[data-m="sheets"]').closest('.noprint')!==null};});
    await p.close();await c.close();return Object.assign(v,{outs,whole:pdfInfo(file).pages});};
  const sc=await screenOf('computer'),si=await screenOf('ipad');
  const same=SETS.map((s,i)=>Object.keys(sc.outs[i]).filter(k=>sc.outs[i][k]!==si.outs[i][k]));
  check(same.every(d=>!d.length),'on the iPad the visuals on the screen are a computer’s, byte for byte ('+SETS.length+' settings, the four pages), so the form’s own print, the workstation’s Print and the packet are as before',same);
  check(sc.whole===si.whole&&sc.whole>20,'the whole-form print with 1 in cards and eight 2 in steps: '+si.whole+' pages on the iPad, as on a computer ('+sc.whole+')',{computer:sc.whole,ipad:si.whole});
  check(sc.cell.join()===si.cell.join()&&sc.page.join()===si.page.join()&&sc.page.join()==='1056,816','the board preview is the same on both: the 11 x 8.5 in sheet, cells '+(sc.cell[0]/96).toFixed(2)+' in',{sc:[sc.cell,sc.page],si:[si.cell,si.page]});
  check(/^Prints on Letter landscape with no margin/.test(sc.notes.board)&&/Sheets: Automatic\.$/.test(sc.notes.board)&&['cards','rules','strips'].every(k=>/^Each visual prints on its own Letter portrait sheet/.test(sc.notes[k])&&/\(on the Board page\)\.$/.test(sc.notes[k])),'a computer’s notes: Letter, no margin, true size; the Sheets setting is on the Board page',sc.notes);
  check(/turns the board on its side on a portrait sheet and lays it out in the area inside them, 9\.45 by 7\.4 in: nothing is shrunk, and the cells print 1\.90 in \(1\.93 in as shown here\)/.test(si.notes.board)&&['cards','rules','strips'].every(k=>/^Safari on the iPad and iPhone prints portrait only, inside its own margins, so Print the visuals lays /.test(si.notes[k])&&/7\.4 by 9\.45 in/.test(si.notes[k])),'the iPad’s notes: Safari’s area, nothing shrunk, the board turned and the size its cells print at',si.notes);
  check(sc.noprint,'the notes and the Sheets setting stay off paper (noprint), so the form’s own print is unchanged');

  const errs=log.flat().filter(l=>l.type==='error'||l.type==='pageerror');
  check(!errs.length,'no console or page errors',errs.slice(0,5));
  await br.close();
  console.log('\n'+(fails?fails+' FAILED':'all passed'));process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
