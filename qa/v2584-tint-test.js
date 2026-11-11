/* v25.84 (the BCBA, 11/11, with a picture of the installed app on an iPad: "Why does the very top of the app have a faded
   white tint?") The strip above the workstation (the installed app's status bar, Safari's own bar) takes its colour from the
   page: the theme-color tag and the page's background colour.
   A  the wide layout (the dark top bar): the tag carries the bar's colour, the page's and the root's background colour are
      the bar's, and the page is still painted with its paper (a one-colour picture layer over that colour).
   B  the phone layout (the white heading): the tag stays white and the page's background is the paper, as before.
   C  the tag follows the layout when the window changes width.
   D  on paper the page's background is white.
   usage: node qa/v2584-tint-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const U=L.BASE+'/NBH-Workstation/index.html',BAR='rgb(31, 58, 77)';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const read=p=>p.evaluate(()=>{const cs=getComputedStyle(document.body),m=document.querySelector('meta[name="theme-color"]');const paper=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    const t=document.createElement('i');t.style.color=paper;document.body.appendChild(t);const pc=getComputedStyle(t).color;t.remove();
    return {a:document.body.classList.contains('ws-a'),bg:cs.backgroundColor,img:cs.backgroundImage,root:getComputedStyle(document.documentElement).backgroundColor,meta:m?m.getAttribute('content'):null,
      head:getComputedStyle(document.querySelector('header.top')).backgroundColor,paper:pc};});
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(U);await sleep(2200);
  let r=await read(p);
  ok('A1 the wide layout: the theme-color tag is the dark top bar\'s colour',r.a&&r.head===BAR&&(r.meta===null||r.meta==='#1f3a4d'),r);
  ok('A2 the page\'s and the root\'s background colour are the bar\'s, and the page is painted with its paper over it',r.bg===BAR&&r.root===BAR&&r.img.indexOf('linear-gradient('+r.paper+', '+r.paper+')')===0,r);
  await p.setViewportSize({width:390,height:844});await sleep(900);r=await read(p);
  ok('B the phone layout: the tag is white, the page\'s background is the paper with no picture layer',!r.a&&(r.meta===null||r.meta==='#ffffff')&&r.bg===r.paper&&r.img==='none'&&r.head==='rgb(255, 255, 255)',r);
  await p.setViewportSize({width:1180,height:820});await sleep(900);r=await read(p);
  ok('C back at the wide layout the tag follows',r.a&&(r.meta===null||r.meta==='#1f3a4d')&&r.bg===BAR,r);
  await p.emulateMedia({media:'print'});await sleep(300);
  r=await p.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,img:getComputedStyle(document.body).backgroundImage,root:getComputedStyle(document.documentElement).backgroundColor}));
  ok('D on paper: a white page, no picture layer, no dark colour',r.bg==='rgb(255, 255, 255)'&&r.img==='none'&&r.root!==BAR,r);
  await p.close();
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
