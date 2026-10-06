/* v21.49 Form TK-1, the Bus ride type (tools/forms/TK-1/bus.js):
   1. the Book type: the bus band shows only on a bus book; a classroom book is as before (its own count, no ride plan);
   2. the checkpoints: spread over the ride (the last one the chosen minutes before the stop), at a set interval (the board fills
      once or more, an even interval suggested), the landmarks (in route order, inside the ride) and every other landmark;
   3. the Board: one token for all the rules (the checkpoints under the slots) or a row for each rule (its Tokens page and token
      sheet as many as the slots); the goal under the Earn box;
   4. the ride plan for the bus staff: after the book's pages, fitted to its page, on the iPad's portrait sheet too;
   5. the addresses: never printed, never in the CSV, never sent; Open in Maps only on a tap, to Apple Maps;
   6. a saved file brings the bus ride back; a file made elsewhere cannot put markup in through a landmark;
   7. the walkthrough of a bus book: its scenes in order (one of each pair as the settings say), measured narration, five
      chapters and a sixth, the frames Save as video paints the stage as shown; no errors.
   usage: node qa/tk1-bus-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1300,height:950},acceptDownloads:true});const page=await ctx.newPage();
  const errs=[],reqs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});page.on('request',r=>reqs.push(r.url()+' '+(r.postData()||'')));
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;nbhUI.confirm=async()=>true;window.__opened=[];window.open=(u,n,f)=>{window.__opened.push([u,n,f]);return null;};});
  const set=async(k,v)=>{await page.evaluate(()=>setView('setup'));await page.selectOption('[data-m="'+k+'"]',v);await sleep(350);};
  const typeIn=async(sel,v)=>{await page.evaluate(()=>setView('setup'));await page.fill(sel,v);await page.dispatchEvent(sel,'change');await sleep(350);};
  const labels=()=>page.evaluate(()=>[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.label||''));
  /* 1. classroom: as before */
  const c0=await page.evaluate(()=>({band:document.getElementById('busBand').hidden,kind:S.meta.kind||'',n:nTok(),bus:isBus(),plan:[...document.querySelectorAll('#book .pg')].some(p=>p.dataset.kind==='busplan'),lay:!document.querySelector('.class-only').hidden}));
  ok('a classroom book: no bus band, the Board layout choice, its own token count, no ride plan',c0.band&&!c0.bus&&c0.n===5&&!c0.plan&&c0.lay,c0);
  await page.evaluate(()=>loadSim());await sleep(1200);const cl=await page.evaluate(()=>({n:nTok(),ttl:document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent,plan:[...document.querySelectorAll('#book .pg')].some(p=>p.dataset.kind==='busplan')}));
  ok('the classroom simulator is the classroom book (Sam’s Chart, five tokens, no ride plan)',cl.n===5&&/Sam’s Chart/.test(cl.ttl)&&!/Bus/.test(cl.ttl)&&!cl.plan,cl);
  /* 2. a bus book and its simulator */
  await set('kind','bus');await page.evaluate(()=>loadSim());await sleep(1300);
  const b0=await page.evaluate(()=>({band:document.getElementById('busBand').hidden,lay:document.querySelector('.class-only').hidden,R:busRide(),n:nTok(),cps:busCps().map(c=>c.t),labs:busCps().map(c=>c.lab),
    ttl:document.querySelector('#book .pg[data-kind="bd"] .ttl').textContent,slots:[...document.querySelectorAll('#book .pg[data-kind="bd"] .slot .cb')].map(e=>e.textContent),rules:[...document.querySelectorAll('#book .pg[data-kind="bd"] .rule .rl')].map(e=>e.textContent)}));
  ok('a bus book: the bus band shows, the Board layout choice goes',!b0.band&&b0.lay,b0);
  ok('spread over 25 minutes, the last 2 minutes before the stop: 4:30, 9:15, 13:45, 18:30, 23:00',JSON.stringify(b0.cps)==='[4.5,9.25,13.75,18.5,23]'&&b0.labs.join()==='4:30,9:15,13:45,18:30,23:00',b0);
  ok('the Board: Sam’s Bus Chart, the three bus rules, the checkpoints under the slots',/Sam’s Bus Chart/.test(b0.ttl)&&b0.rules.join('|')==='Stay in my seat|Quiet voice|Hands to self'&&b0.slots.join()===b0.labs.join(),b0);
  await set('bus_lead','4');ok('4 minutes before the stop: the last at 21:00',await page.evaluate(()=>busCps().slice(-1)[0].t===21));await set('bus_lead','2');
  /* the goal: with every token a missed checkpoint means no item (the note says so); 4 of 5 prints under the Earn box */
  const g0=await page.evaluate(()=>({note:document.getElementById('busCalc').textContent,goal:!!document.querySelector('#book .pg[data-kind="bd"] .ggoal')}));
  ok('every token needed: the note says one miss means no item, and suggests most of the tokens',/one missed checkpoint means no item/.test(g0.note)&&/4 of 5/.test(g0.note)&&!g0.goal,g0);
  await typeIn('[data-m="bus_goal"]','4');const g1=await page.evaluate(()=>({g:(document.querySelector('#book .pg[data-kind="bd"] .ggoal')||{}).textContent,plan:document.querySelector('#book .pg[data-kind="busplan"]').textContent}));
  ok('a goal of 4: “with 4 of 5” under the Earn box, and on the ride plan',/with 4 of 5/.test(g1.g||'')&&/4 of the 5/.test(g1.plan),g1);await typeIn('[data-m="bus_goal"]','');
  /* a set interval */
  await set('bus_time','fixed');await set('bus_every','3');
  const f0=await page.evaluate(()=>({K:busCps().length,t:busCps().map(c=>c.t),note:document.getElementById('busCalc').textContent,cap:busSlotLab(0)}));
  ok('a token every 3 minutes on 25 minutes: 8 checkpoints; the board of 5 fills once and the 3 after it are said; no checkpoint labels under the slots',f0.K===8&&f0.t[7]===24&&/fills once/.test(f0.note)&&/The last 3 tokens before the stop do not fill another board\./.test(f0.note)&&f0.cap===null,f0);
  await set('n','4');await set('bus_every','4');const f2=await page.evaluate(()=>document.getElementById('busCalc').textContent);
  ok('a board of 4, a token every 4 minutes: 6 checkpoints; the even intervals suggested (2, 3, 5 or 6 minutes)',/6 checkpoints/.test(f2)&&/a token every 2, 3, 5 or 6 minutes comes out even/.test(f2),f2.slice(0,400));await set('n','5');
  await set('bus_every','5');const f1=await page.evaluate(()=>({K:busCps().length,warn:document.querySelector('#busCalc .verdict').className,txt:document.getElementById('busCalc').textContent}));
  ok('every 5 minutes on 25: 4 checkpoints, the board does not fill (still open)',f1.K===4&&/v-mid/.test(f1.warn)&&/does not fill before the stop/.test(f1.txt),f1);
  await set('bus_time','spread');
  /* the landmarks */
  await set('bus_step','land');const l0=await page.evaluate(()=>({n:nTok(),labs:busCps().map(c=>c.lab),slots:[...document.querySelectorAll('#book .pg[data-kind="bd"] .slot')].length,disabled:document.querySelector('[data-m="n"]').disabled}));
  ok('landmarks: the five landmarks are the checkpoints, the count follows them, the count choice is set by them',l0.n===5&&l0.labs.join('|')==='Grocery store|The park|Fire station|Library|The bridge'&&l0.slots===5&&l0.disabled,l0);
  await set('bus_step','fewer');const l1=await page.evaluate(()=>({n:nTok(),labs:busCps().map(c=>c.lab),caps:S.caps.length}));
  ok('every other landmark, the last kept: the store, the fire station, the bridge; the board has 3',l1.n===3&&l1.labs.join('|')==='Grocery store|Fire station|The bridge'&&l1.caps===3,l1);
  await page.evaluate(()=>{setView('setup');});await page.fill('input[name="lm.1.min"]','40');await sleep(400);
  const l2=await page.evaluate(()=>({labs:busCps().map(c=>c.lab),note:document.getElementById('busCalc').textContent}));
  ok('a landmark past the end of the ride is left out (and said)',!l2.labs.includes('The park')&&/no minute inside the 25-minute ride/.test(l2.note),l2);
  await page.fill('input[name="lm.1.min"]','10');await sleep(300);await set('bus_step','timer');
  /* 3. a row for each rule */
  await set('bus_rule','each');
  const e0=await page.evaluate(()=>{const bd=document.querySelector('#book .pg[data-kind="bd"]'),tk=document.querySelector('#book .pg[data-kind="tk"]'),cs=[...document.querySelectorAll('#book .pg')].find(p=>p.dataset.kind==='cards-tk');
    return{rows:bd.querySelectorAll('.grule').length,slots:bd.querySelectorAll('.gslot').length,cps:[...bd.querySelectorAll('.gcp')].map(e=>e.textContent),earn:!!bd.querySelector('.gearn .bx'),boxes:tk.querySelectorAll('.ybx').length,toks:cs?cs.querySelectorAll('.card.tok').length:0,total:tokTotal(),strip:!!bd.querySelector('.strip')};});
  ok('a row for each rule: 3 rows of 5 slots, the checkpoints over the columns, the Earn box, no strip',e0.rows===3&&e0.slots===15&&e0.cps.join()==='4:30,9:15,13:45,18:30,23:00'&&e0.earn&&!e0.strip,e0);
  ok('its Tokens page has a box for each of the 15 tokens, and the token sheet prints 15',e0.boxes===15&&e0.toks===15&&e0.total===15,e0);
  /* nothing on the board's page runs off it */
  const e1=await page.evaluate(()=>{const bd=document.querySelector('#book .pg[data-kind="bd"] .panel'),r=bd.getBoundingClientRect();return [...bd.querySelectorAll('.gslot,.grule,.gearn,.gcp')].filter(e=>{const q=e.getBoundingClientRect();return q.right>r.right+1||q.bottom>r.bottom+1||q.left<r.left-1||q.top<r.top-1;}).length;});
  ok('a row for each rule: everything inside the panel',e1===0,e1);
  await set('bus_rule','all');
  /* 4. the ride plan */
  const p0=await page.evaluate(()=>{const L=[...document.querySelectorAll('#book .pg')].map(p=>p.dataset.kind),pl=document.querySelector('#book .pg[data-kind="busplan"]'),bp=pl.querySelector('.bp');
    return{order:L.join(','),port:pl.classList.contains('port'),fits:bp.scrollHeight<=bp.clientHeight+1,route:!!pl.querySelector('svg.bp-route'),log:pl.querySelectorAll('table.bp-log tr').length,txt:pl.textContent};});
  ok('the ride plan comes after the book’s pages (before the how-to and the card sheets), portrait, fitted, with the route and the log',/tk,tk,busplan,how1/.test(p0.order)&&p0.port&&p0.fits&&p0.route&&p0.log>=4,p0);
  ok('the plan names the rules, the checkpoints, the item at the stop, the driver note, the fading steps',/Stay in my seat/.test(p0.txt)&&/4:30, 9:15, 13:45, 18:30, 23:00/.test(p0.txt)&&/adult who meets the bus/.test(p0.txt)&&/never the driver while driving/.test(p0.txt)&&/Step 1: a timer/.test(p0.txt)&&/\(now\)/.test(p0.txt),p0.txt.slice(0,300));
  /* a crowded plan still fits: five rules and a long note */
  await page.evaluate(()=>{S.tg[3]=cello('feetfloor','Feet on the floor');S.tg[4]=cello('calm','Calm body');S.meta.bus_note='A long note. '.repeat(40);renderAll();});await sleep(500);
  const p1=await page.evaluate(()=>{const bp=document.querySelector('#book .pg[data-kind="busplan"] .bp');return{fits:bp.scrollHeight<=bp.clientHeight+1,rows:bp.querySelectorAll('table.bp-log tr').length};});
  ok('five rules and a long note: the plan still fits its page (the log gives up rows)',p1.fits&&p1.rows>=4,p1);
  await page.evaluate(()=>{S.tg[3]=cello();S.tg[4]=cello();S.meta.bus_note='';renderAll();});await sleep(300);
  /* the iPad's portrait sheet */
  await set('sheets','turn');const p2=await page.evaluate(()=>{const pl=document.querySelector('#book .pg[data-kind="busplan"]'),bp=pl.querySelector('.bp'),r=pl.getBoundingClientRect(),q=bp.getBoundingClientRect();return{ts:pl.classList.contains('tsheet'),inside:q.right<=r.right+1&&q.bottom<=r.bottom+1};});
  ok('on the iPad’s portrait sheet: the plan is scaled into the printable area',p2.ts&&p2.inside,p2);await set('sheets','auto');
  await page.evaluate(()=>{document.querySelector('[data-c="pg_bus"]').click();});await sleep(300);
  ok('untick the ride plan: it does not print',!(await labels()).some(l=>/Bus ride plan/.test(l)));await page.evaluate(()=>{document.querySelector('[data-c="pg_bus"]').click();});await sleep(300);
  await set('order','cards');ok('the card sheets alone: no ride plan',!(await labels()).some(l=>/Bus ride plan/.test(l)));await set('order','all');
  /* 5. the addresses */
  const A1='1600 Example School Rd, Sampletown',A2='42 Private Home Ln, Sampletown';
  ok('Open in Maps is off with no addresses',await page.evaluate(()=>document.getElementById('busMaps').disabled));
  await page.evaluate(()=>{setView('setup');document.querySelector('details.bus-maps').open=true;});await page.fill('[data-m="bus_fromA"]',A1);await page.fill('[data-m="bus_toA"]',A2);await sleep(400);
  const r0=reqs.length;await page.click('#busMaps');await sleep(300);
  const op=await page.evaluate(()=>window.__opened);
  ok('Open in Maps (a tap): Apple Maps with the two addresses, driving, in a new tab',op.length===1&&/^https:\/\/maps\.apple\.com\/\?saddr=1600%20Example%20School%20Rd%2C%20Sampletown&daddr=42%20Private%20Home%20Ln%2C%20Sampletown&dirflg=d$/.test(op[0][0])&&op[0][2]==='noopener',op);
  const leak=await page.evaluate(([a,b])=>{const t=document.getElementById('book').innerHTML+document.getElementById('bdOut').innerHTML;return t.includes(a)||t.includes(b)||t.includes('Private Home');},[A1,A2]);
  ok('the addresses are not on any printed page',!leak);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.getElementById('csvBtn').click())]);const csv=fs.readFileSync(await dl.path(),'utf8');
  ok('the addresses are not in the CSV (the landmarks are)',!csv.includes('Private Home')&&!csv.includes('Example School')&&/Bus landmark/.test(csv),csv.slice(0,200));
  ok('the form sent nothing anywhere with the addresses',!reqs.some(u=>/Private|Example%20School|Example School/.test(u)),reqs.slice(r0));
  /* 6. a saved file */
  const [sv]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>document.getElementById('saveBtn').click())]);const file=JSON.parse(fs.readFileSync(await sv.path(),'utf8'));
  ok('the saved file holds the bus ride (and the addresses, kept only in it)',file.S.meta.kind==='bus'&&file.S.meta.bus_min==='25'&&file.S.lm.length===5&&file.S.meta.bus_toA===A2,file.S.meta);
  const re=await page.evaluate(f=>{const bad=JSON.parse(JSON.stringify(f));bad.S.lm[0]={k:'<img src=x onerror=alert(1)>',ph:'zz"><b>',l:'Store',min:'5<script>'};bad.S.lm.push(...Array(20).fill({k:'store',l:'x',min:'3'}));
    const o=fromFile(bad);return{n:o.lm.length,k:o.lm[0].k,ph:o.lm[0].ph,min:o.lm[0].min,kind:o.meta.kind,good:fromFile(f).lm.map(x=>x.l||x.k).join('|')};},file);
  ok('a file’s landmarks: at most ten, an unknown picture or photo id dropped, the minute digits only',re.n===10&&re.k===''&&re.ph===''&&re.min==='5'&&re.kind==='bus'&&re.good==='Grocery store|The park|Fire station|Library|The bridge',re);
  /* 7. the walkthrough */
  await page.addStyleTag({content:'.toolbar,.nbh-mast,[class*=toast],.nbh-pagenav{display:none!important}'});
  await page.evaluate(()=>setView('walk'));await sleep(1500);
  const w0=await page.evaluate(()=>({ids:TKWALK.cues.map(c=>c.id).join(),d:TKWALK.duration,ch:TKWALK.chapters.map(c=>c.label).join('|'),um:TKWALK.unmeasured,routes:document.querySelectorAll('#wkStage .wk-route').length,addr:document.getElementById('wkStage').innerHTML.includes('Private Home')}));
  ok('the bus walkthrough: its scenes in order (spread, a missed rule, the item at the stop)',w0.ids==='b_intro,b_rules,b_item,b_route,b_spread,b_start,b_tok,b_none,b_more,b_last,b_arrive,b_land,b_fewer,b_plan,b_outro',w0);
  ok('about two and a half minutes, six chapters, the two routes drawn, no address on it',w0.d>130&&w0.d<190&&w0.ch==='The board|The route|The ride|The item|Fading|For the staff'&&w0.routes===2&&!w0.addr,w0);
  ok('every recorded line has its measured word timings',w0.um.length===0,w0.um);
  /* (v21.49c) the narration is recorded, so it names no rule, landmark or item of its own: what is said fits any book; the praise
     bubbles name this book's own rules (here rules like a classroom's, as a book can have) */
  const nm=await page.evaluate(()=>{const keep=JSON.stringify(S);S.tg[0]=cello('','Working');S.tg[1]=cello('','Accepting change');S.tg[2]=cello('','Waiting');renderAll();TKWALK.build();
    const said=TKWALK.cues.map(c=>c.text).join(' ').toLowerCase(),bub=[...document.querySelectorAll('#wkStage .wk-bub')].map(e=>e.textContent.toLowerCase());
    S=JSON.parse(keep);ensure();renderAll();TKWALK.build();return{said,bub};});
  ok('the bus narration names no example rule, landmark or item',!/staying in the seat|quiet voice|hands to self|a store|a park|a bridge|a sticker|a song|a tablet/.test(nm.said),nm.said.slice(0,200));
  ok('the praise names the book’s own rules (working, accepting change, waiting)',nm.bub.some(b=>/working/.test(b))&&nm.bub.some(b=>/accepting change/.test(b))&&nm.bub.some(b=>/waiting/.test(b)),nm.bub);
  /* the bus rolls to each checkpoint as its token is earned */
  const w1=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='b_last');TKWALK.renderAt(c.start+c.dur-.3);const bd=[...document.querySelectorAll('#wkStage .wk-page[data-pg="bd"] .wk-in')].filter(e=>e.dataset.card&&/^tok/.test(e.dataset.card)&&getComputedStyle(e).opacity==='1').length;
    const on=[...document.querySelectorAll('#wkStage .wk-cpb.on')].filter(e=>+getComputedStyle(e).opacity>.9).length;return{bd,on};});
  ok('at the end of the ride: the five tokens on the board, the five checkpoints ticked',w1.bd===5&&w1.on===5,w1);
  const vars=await page.evaluate(()=>{const out={};const keep=JSON.stringify(S);
    const run=(m)=>{Object.assign(S.meta,m);TKWALK.build();return TKWALK.cues.map(c=>c.id).join();};
    out.each=run({bus_rule:'each'});out.fixed=run({bus_rule:'all',bus_time:'fixed',bus_every:'4'});out.onbus=run({bus_time:'spread',bus_reward:'bus'});
    S=JSON.parse(keep);ensure();TKWALK.build();return out;});
  ok('a row for each rule plays b_each; a set interval b_fixed and b_full; the item on the bus b_onbus',/b_tok,b_each,b_more,b_last/.test(vars.each)&&!/b_none/.test(vars.each)&&/b_fixed,.*b_full/.test(vars.fixed)&&/b_onbus/.test(vars.onbus)&&!/b_arrive/.test(vars.onbus),vars);
  /* the frames Save as video paints are the stage as shown */
  await page.evaluate(()=>[...document.body.querySelectorAll('*')].forEach(e=>{if(!e.closest('#wkPlayer')&&getComputedStyle(e).position==='fixed')e.style.display='none';}));
  const at=await page.evaluate(()=>['b_route','b_tok','b_land','b_plan'].map(id=>{const c=TKWALK.cues.find(q=>q.id===id);return c.start+c.dur*.8;}));
  for(const t of at){const png=await page.evaluate(async t=>(await TKVIDEO.frame(t,1280)).toDataURL('image/png'),t);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    if(!(d.mean<7&&d.worst<22)&&process.env.BUS_DUMP){fs.writeFileSync(process.env.BUS_DUMP+'/f'+Math.round(t)+'.png',Buffer.from(png.split(',')[1],'base64'));fs.writeFileSync(process.env.BUS_DUMP+'/s'+Math.round(t)+'.png',shot);}
    ok('t='+t.toFixed(1)+' s: the frame Save as video paints is the stage as shown',d.mean<7&&d.worst<22,d);}
  /* a classroom file opened after a bus book: it stays a classroom book, with none of the bus book's settings */
  const cf=await page.evaluate(()=>{const keep=JSON.stringify(S);S.meta.bus_rule='each';S.meta.bus_reward='bus';renderAll();
    const o=fromFile({form:'TK-1',S:{meta:{first:'Ann',n:'4'},ch:[],tg:[]}});S=o;renderAll();const r={kind:S.meta.kind,rule:S.meta.bus_rule,rw:S.meta.bus_reward,sel:document.querySelector('[data-m="kind"]').value,band:document.getElementById('busBand').hidden,n:nTok()};
    S=JSON.parse(keep);ensure();renderAll();return r;});
  ok('a classroom file opened after a bus book: a classroom book, the bus settings its own defaults',cf.kind===''&&cf.sel===''&&cf.band&&cf.rule==='all'&&cf.rw==='arrive'&&cf.n===4,cf);
  /* an iPad-sized window: the player is small and its captions go under the picture; the video's frame still has them in it,
     even when the window is resized while it is painted (the player made small again: how an iPad's video lost them)
     (the dark caption bar at the foot of the picture), and with CC off it has none */
  const capAt=await page.evaluate(()=>{const c=TKWALK.cues.find(q=>q.id==='b_route');return c.start+c.dur*.6;});
  const capBar=async()=>page.evaluate(async t=>{const pr=TKVIDEO.frame(t,1280);window.dispatchEvent(new Event('resize'));const cv=await pr,g=cv.getContext('2d'),d=g.getImageData(240,600,800,100).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<60&&d[i+1]<60&&d[i+2]<70)n++;return n;},capAt);
  await page.setViewportSize({width:700,height:900});await sleep(800);
  const small=await page.evaluate(()=>document.getElementById('wkPlayer').classList.contains('wk-small'));const withCap=await capBar();
  await page.evaluate(()=>document.getElementById('wkCc').click());await sleep(200);const noCap=await capBar();await page.evaluate(()=>document.getElementById('wkCc').click());
  const restored=await page.evaluate(()=>getComputedStyle(document.querySelector('#wkStage .wk-cap')).display);
  ok('a small player (as on an iPad): the video frame has the captions in it; with CC off it has none; the page is as it was',small&&withCap>4000&&noCap<500&&restored==='none',{small,withCap,noCap,restored});
  await page.setViewportSize({width:1300,height:950});await sleep(800);
  /* the ride plan in the walkthrough is fitted before its parts are measured: each glow is inside the page */
  const pl=await page.evaluate(()=>{const pg=document.querySelector('#wkStage .wk-planpg .pg'),bp=pg.querySelector('.bp');return{fits:bp.scrollHeight<=bp.clientHeight+1};});
  ok('the walkthrough’s ride plan fits its page',pl.fits,pl);
  /* back to a classroom book: the classroom walkthrough */
  const back=await page.evaluate(()=>{S.meta.kind='';ensure();renderAll();TKWALK.build();return{first:TKWALK.cues[0].id,plan:[...document.querySelectorAll('#book .pg')].some(p=>p.dataset.kind==='busplan'),band:document.getElementById('busBand').hidden};});
  ok('a book turned back to the classroom: the classroom walkthrough, no ride plan, no bus band',back.first==='intro'&&!back.plan&&back.band,back);
  /* the one-file edition carries both narration files inside: the classroom's 18 lines and the bus ride's 19 */
  const one=await ctx.newPage();await one.goto(BASE+'/deliver/NBH-Workstation.html');await sleep(1500);
  await one.evaluate(()=>openForm('TK-1'));await one.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:30000}).catch(()=>{});await sleep(1500);
  const fr=one.frames().find(f=>f!==one.mainFrame());
  const inside=fr?await fr.evaluate(()=>{const L=typeof WALK_AUDIO!=='undefined'?Object.keys(WALK_AUDIO.lines):[];return{n:L.length,bus:L.filter(k=>/^b_/.test(k)).length};}).catch(e=>({err:String(e)})):{none:true};
  ok('the one-file edition: TK-1 has both narrations inside (37 lines, 19 of them the bus ride)',inside.n===37&&inside.bus===19,inside);await one.close();
  /* beside the form, each narration file stays under 1.9 MB */
  ok('each narration file beside TK-1 is under 1.9 MB',['nbh-tk1-narration.js','nbh-tk1-bus-narration.js'].every(f=>fs.statSync(path.join(ROOT,'NBH-Workstation',f)).size<1900000));
  ok('no errors',errs.length===0,errs);
  console.log(fails?fails+' FAILED':'ALL PASS');await br.close();process.exit(fails?1:0);})();
