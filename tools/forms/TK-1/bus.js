/* ===== (v21.49) The Bus ride type: the token board for a ride on the school bus =====
   Setup's "Book type" makes the book a bus-ride book: the Board carries the bus rules (the Targets page's cards, two to five)
   and the item in the Earn box, and the tokens come at checkpoints along the route rather than at the end of a classroom
   interval. Everything here is a function (this file goes into script.js before script-main.js, whose constants it uses only
   when called), and it keeps its settings in the book's own state: the meta keys bus_* and kind, the landmarks in S.lm.
   - The ride: its length in minutes, typed. The addresses (optional) stay in this file only: they are never printed, never
     sent, and Open in Maps hands them to the Maps app on this device only when it is tapped.
   - How a token is earned: one token at a checkpoint when every rule was followed ("all"), or each rule its own row of
     tokens ("each": a missed rule leaves only its own slot empty).
   - When: spread over the ride (the ride's length less the minutes kept before the stop, divided by the tokens, so the last
     token comes just before the stop) or at a set interval (the board can fill more than once on a long ride).
   - Fading the timer: the checkpoints become landmarks on the route (a store, a park, a bridge), then every other landmark.
   - The item: given at the stop by the adult who meets the student, or on the bus when the board fills.
   - The ride plan: a portrait page for the bus staff (the route drawn plainly, what earns a token, when, what to say, the item,
     the fading steps and a ride log). */
function isBus(){return S.meta.kind==='bus';}
function busEach(){return isBus()&&S.meta.bus_rule==='each';}
function busNum(k,def,lo,hi){const v=num(S.meta[k]);return v==null?def:Math.max(lo,Math.min(hi,v));}
function busRide(){return busNum('bus_min',25,3,120);}
function busStep(){const s=S.meta.bus_step;return s==='land'||s==='fewer'?s:'timer';}
function busTime(){return S.meta.bus_time==='fixed'?'fixed':'spread';}
function busReward(){return S.meta.bus_reward==='bus'?'bus':'arrive';}
function busFrom(){return String(S.meta.bus_from||'').trim()||'School';}
function busTo(){return String(S.meta.bus_to||'').trim()||'Home';}
/* the bus rules: the Targets page's cards with a picture or a label, in order (the board shows up to five; a row each, up to four) */
function busRules(){const u=S.tg.filter(o=>has(o)||String(o.l||'').trim());return u.slice(0,busEach()?4:5);}
/* minutes as the bus staff read them off a timer: 4:30 */
function busClock(t){const s=Math.round(t*60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
/* the landmarks with a name and a minute inside the ride, in route order; "fewer" keeps every other one, the last always */
function busLms(){const R=busRide();return (S.lm||[]).map((o,i)=>({o,i,name:String(lbl(o)||'').trim(),t:num(o.min)})).filter(x=>x.name&&x.t!=null&&x.t>0&&x.t<=R).sort((a,b)=>a.t-b.t||a.i-b.i);}
function busLmUsed(){const L=busLms();return busStep()==='fewer'?L.filter((_,i)=>(L.length-1-i)%2===0):L;}
/* the number of token slots a row of the Board has: the landmarks set it (two to ten) once they are the checkpoints; a board
   with a row for each rule holds up to six; 0 when the classroom count stands */
function busNTok(){if(!isBus())return 0;const base=Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));
  const n=busStep()==='timer'?base:Math.max(2,Math.min(10,busLmUsed().length||base));return busEach()?Math.min(6,n):n;}
function tokTotal(){return busEach()?nTok()*Math.max(2,busRules().length):nTok();}
/* the checkpoints of one ride: {t (minutes into the ride), lab (what the slot and the plan say), lm (the landmark's card)} */
function busCps(){const R=busRide(),st=busStep();
  if(st!=='timer')return busLmUsed().map(x=>({t:x.t,lab:x.name,lm:x.o}));
  if(busTime()==='fixed'){const ev=busNum('bus_every',5,1,30),out=[];for(let j=1;j*ev<=R-.5+1e-9&&out.length<60;j++)out.push({t:j*ev,lab:busClock(j*ev)});return out;}
  const n=nTok(),lead=busNum('bus_lead',2,0,10),last=Math.max(R*.5,R-lead),iv=last/n;
  return Array.from({length:n},(_,i)=>{const t=i===n-1?Math.round(last*4)/4:Math.round(iv*(i+1)*4)/4;return{t,lab:busClock(t)};});}
/* the plan of a ride, with what the form has to say about it */
function busPlan(){const R=busRide(),st=busStep(),cps=busCps(),n=nTok(),rules=busRules(),k=busEach()?Math.max(2,rules.length):1,warn=[],note=[];
  const fixed=st==='timer'&&busTime()==='fixed',K=cps.length,fills=fixed?Math.floor(K/n):1;
  const gaps=cps.map((c,i)=>c.t-(i?cps[i-1].t:0)),gmin=gaps.length?Math.min(...gaps):0,gmax=gaps.length?Math.max(...gaps):0;
  if(rules.length<2)warn.push('Put at least two bus rules on the Targets page (seatbelt on, stay in your seat, quiet voice, hands to self): the Board shows them in a row'+(busEach()?', one row of tokens each':'')+'.');
  if(st==='timer'&&!fixed&&R/n<1)warn.push('The tokens are under a minute apart: hard for the bus staff to keep up with. Use fewer tokens.');
  if(st==='timer'&&!fixed&&R/n>10)note.push('About '+Math.round(R/n)+' minutes between tokens is a long wait while the board is new; start with more tokens (or a token every 3 to 5 minutes) and thin them later.');
  if(fixed){const ev=busNum('bus_every',5,1,30);
    if(!K)warn.push('A token every '+ev+' minutes gives no checkpoint on a '+R+'-minute ride.');
    else if(K<n)warn.push('A token every '+ev+' minutes gives '+K+' checkpoint'+(K===1?'':'s')+' on this ride: the board of '+n+' does not fill before the stop. Use a shorter interval, fewer tokens, or spread the tokens over the ride.');
    else if(K>n){const even=[2,3,4,5,6,8,10,15].filter(e=>{const k=Math.floor((R-.5+1e-9)/e);return k>=n&&k%n===0;});
      note.push('The board fills '+(fills===1?'once':fills+' times')+' on this ride (every '+n+' tokens, '+busClock(n*ev)+')'+(fills>1?': an exchange each time it fills'+(busReward()==='arrive'?'; with the item given at the stop, each full board is counted and traded there':''):'')+'.'+(K%n?' The last '+(K%n)+' token'+(K%n===1?'':'s')+' before the stop do'+(K%n===1?'es':'')+' not fill another board'+(even.length?': a token every '+(even.length>1?even.slice(0,-1).join(', ')+' or '+even[even.length-1]:even[0])+' minutes comes out even.':'.'):''));}
    if(ev>10)note.push('More than 10 minutes between tokens is a long wait while the board is new.');}
  if(st!=='timer'){const L=busLms(),all=(S.lm||[]).filter(o=>String(lbl(o)||'').trim());
    if(all.length>L.length)note.push((all.length-L.length)+' landmark'+(all.length-L.length===1?' has':'s have')+' no minute inside the '+R+'-minute ride and '+(all.length-L.length===1?'is':'are')+' left out.');
    if(L.length<2)warn.push('Add the landmarks along the route (at least two, better four to six), each with the minute it is passed: they become the checkpoints.');
    else{if(cps.length<2)warn.push('Every other landmark leaves fewer than two checkpoints: add landmarks, or go back to the landmarks step.');
      const lastT=cps.length?cps[cps.length-1].t:0;if(R-lastT>5)note.push('The last landmark is '+Math.round(R-lastT)+' minutes before the stop, so the board is full well before the item: add a landmark nearer the stop, or give the item on the bus.');
      if(cps.length>2&&gmin>0&&gmax>2.5*gmin)note.push('The landmarks are unevenly spaced ('+busClock(gmin)+' to '+busClock(gmax)+' apart): the long gaps are the hard part of the ride; add a landmark in the longest one if there is one to see.');
      if(cps.some((c,i)=>i&&c.t===cps[i-1].t))warn.push('Two landmarks have the same minute: give each its own.');}}
  if(busReward()==='bus')note.push('An item on the bus: check the district’s transportation rules first, and any allergy or choking-risk plan, before a snack is eaten on the bus; a non-food item (a sticker, a song, a few minutes with a tablet) is the usual choice.');
  const total=n*k,goal=Math.max(1,Math.min(total,Math.round(num(S.meta.bus_goal)||total)));
  /* the stops are fixed, so a missed checkpoint cannot be made up later on the ride: with every token needed, one miss means no item */
  if(!fixed&&goal===total&&total>=3)note.push('With every token needed, one missed checkpoint means no item on that ride (the checkpoints cannot be made up before the stop). While the board is new, a goal of most of the tokens ('+(total-1)+' of '+total+', for example) keeps the item within reach; raise it to every token as the rides go well.');
  return{R,st,cps,n,k,rules,each:busEach(),fixed,K,fills,goal,total,warn,note,gaps};}

/* ---------------- Setup: the bus band ---------------- */
const BUS_STEPS=[['timer','A timer at the checkpoint times (to start)'],['land','Landmarks on the route as the checkpoints'],['fewer','Every other landmark (fewer checkpoints)']];
function busMapsUrl(){const a=String(S.meta.bus_fromA||'').trim(),b=String(S.meta.bus_toA||'').trim();if(!a||!b)return '';
  return 'https://maps.apple.com/?saddr='+encodeURIComponent(a)+'&daddr='+encodeURIComponent(b)+'&dirflg=d';}
/* the landmark rows: rebuilt only when they change in number (or a picture changes), so typing in one keeps its place */
function busTables(){const tb=$('#lmTbl tbody');if(!tb)return;const ae=document.activeElement,typing=ae&&ae.closest&&ae.closest('#lmTbl')&&/^(INPUT|SELECT)$/.test(ae.tagName);
  if(typing&&tb.children.length===S.lm.length)return;
  tb.innerHTML=S.lm.length?S.lm.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('lm',i,o)+'</td><td><input data-r="lm" data-i="'+i+'" data-f="l" name="lm.'+i+'.l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'the store, the park, the bridge')+'" aria-label="Landmark '+(i+1)+': its name"></td><td><input data-r="lm" data-i="'+i+'" data-f="min" name="lm.'+i+'.min" value="'+esc(o.min)+'" inputmode="decimal" placeholder="min" aria-label="Landmark '+(i+1)+': minutes into the ride" style="width:5.5em"></td><td><button type="button" class="tool" data-lmdel="'+i+'" aria-label="Remove landmark '+(i+1)+'">Remove</button></td></tr>').join(''):'<tr><td colspan="5" class="hint">No landmarks yet. Add the ones your learner can see from the window, in the order the bus passes them, with the minute each is passed (ride along once with a watch, or ask the driver).</td></tr>';
  const ad=$('#lmAdd');if(ad)ad.disabled=S.lm.length>=10;}
/* what the plan comes to: the checkpoints of this ride, and what the form has to say about them */
function busCalc(){const band=$('#busBand');if(!band)return;const on=isBus();
  $$('.bus-only').forEach(e=>{e.hidden=!on;});$$('.class-only').forEach(e=>{e.hidden=on;});if(!on)return;
  if(S.caps.length!==nTok()){S.caps=defCaps(nTok(),tokName());const ct=$('#capTbl tbody');if(ct&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#capTbl')))renderTbls();}
  const p=busPlan(),m=S.meta,ns=$('[data-m="n"]');if(ns){ns.disabled=p.st!=='timer';const h=$('#busNHint');if(h)h.textContent=p.st!=='timer'?'On the landmark steps the landmarks set the count: '+p.n+' token'+(p.n===1?'':'s')+(p.each?' a row':'')+'.':p.each&&num(m.n)>6?'A row for each rule holds up to six tokens: '+p.n+' a row.':'';}
  $$('.bus-spread').forEach(e=>{e.hidden=!(p.st==='timer'&&!p.fixed);});$$('.bus-fixed').forEach(e=>{e.hidden=!(p.st==='timer'&&p.fixed);});$$('.bus-each').forEach(e=>{e.hidden=!p.each;});$$('.bus-time').forEach(e=>{e.hidden=p.st!=='timer';});
  const mb=$('#busMaps');if(mb){const u=busMapsUrl();mb.disabled=!u;mb.title=u?'Opens the Maps app with directions between the two addresses':'Type both addresses to open the route in Maps';}
  const rows=p.cps.slice(0,p.fixed?Math.max(p.n,12):60).map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+busClock(c.t)+'</td><td>'+(c.lm?esc(c.lab):p.fixed?'timer (every '+busClock(busNum('bus_every',5,1,30))+')':'timer')+'</td><td>'+(p.fixed&&p.K>p.n?'board '+(Math.floor(i/p.n)+1)+', token '+(i%p.n+1)+(i>=p.fills*p.n?' (does not fill a board)':''):'token '+(i+1)+(i===p.cps.length-1&&!p.fixed?' (the last: the board is full)':''))+'</td></tr>').join('');
  const more=p.fixed&&p.K>Math.max(p.n,12)?'<tr><td colspan="4" class="hint">and so on, every '+busClock(busNum('bus_every',5,1,30))+', to '+busClock(p.cps[p.K-1].t)+' ('+p.K+' in all)</td></tr>':'';
  const head=p.cps.length?(p.st==='timer'?(p.fixed?'A token every '+busClock(busNum('bus_every',5,1,30))+' on a '+p.R+'-minute ride: '+p.K+' checkpoint'+(p.K===1?'':'s')+'.':p.n+' tokens spread over a '+p.R+'-minute ride: about one every '+busClock(p.cps[p.cps.length-1].t/p.n)+', the last '+busClock(p.R-p.cps[p.cps.length-1].t)+' before the stop.'):p.cps.length+' landmark'+(p.cps.length===1?'':'s')+' as the checkpoints'+(p.st==='fewer'?' (every other one, the last kept)':'')+'.'):'No checkpoints yet.';
  const rule=p.each?' Each rule earns its own token at every checkpoint: '+p.k+' rows of '+p.n+' ('+p.total+' tokens); the item comes with '+(p.goal===p.total?'every token':p.goal+' of the '+p.total)+'.':' One token at a checkpoint when every rule was followed since the last one.';
  const rw=busReward()==='arrive'?' The item is given at the stop ('+esc(busTo())+') by the adult who meets your learner.':' The item is given on the bus when the board fills.';
  const out=$('#busCalc');if(out)out.innerHTML='<div class="verdict '+(p.warn.length?'v-mid':'v-ok')+'"><b>'+(p.warn.length?'Still open:':'The ride plan.')+'</b> '+(p.warn.length?esc(p.warn.join(' '))+' ':'')+esc(head)+esc(rule)+rw+'</div>'+(p.note.length?'<ul class="hint bus-notes">'+p.note.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
    (p.cps.length?'<div class="grid-wrap"><table class="rt" id="busCpTbl"><thead><tr><th style="width:8%">#</th><th style="width:16%">Into the ride</th><th>Checkpoint</th><th style="width:30%">On the board</th></tr></thead><tbody>'+rows+more+'</tbody></table></div>':'');}
function busWire(){
  document.addEventListener('click',e=>{const d=e.target.closest('button[data-lmdel]');if(d){S.lm.splice(+d.dataset.lmdel,1);ensure();renderAll();return;}
    if(e.target.closest('#lmAdd')){if(S.lm.length<10){S.lm.push(Object.assign(cello(),{min:''}));renderAll();const ins=$$('#lmTbl input[data-f="l"]');if(ins.length)ins[ins.length-1].focus();}return;}
    if(e.target.closest('#busSwap')){const m=S.meta;[m.bus_from,m.bus_to]=[m.bus_to||'',m.bus_from||''];[m.bus_fromA,m.bus_toA]=[m.bus_toA||'',m.bus_fromA||''];renderAll();return;}
    if(e.target.closest('#busMaps')){const u=busMapsUrl();if(u)window.open(u,'_blank','noopener');return;}});
  /* a landmark's minute changes how many checkpoints there are: the token count, the captions and the plan follow at once */
  document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.r==='lm'){if(S.caps.length!==nTok())ensure();}});
  document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&(el.dataset.m==='kind'||/^bus_(rule|step|time)$/.test(el.dataset.m||''))){ensure();renderAll();}});}

/* ---------------- the Board ---------------- */
/* the caption under a token slot: the checkpoint (its time or its landmark) when Setup prints them; the caption otherwise */
function busSlotLab(i){if(!isBus()||S.chk.bus_cap===false)return null;const p=busPlan();if(p.fixed&&p.K!==p.n)return null;const c=p.cps[i];return c?c.lab:null;}
/* a row for each rule: the rule's card on the left, its token slots, the checkpoints over the columns, the Earn box on the right */
function busGeom(){const p=busPlan(),mode=pageMode(),ch=mode==='fill'?612/scl():PH,inH=ch-2.67-2.65-6,k=p.k,n=p.n;
  const top=86,head=p.cps.length&&S.chk.bus_cap!==false?16:0,rowsH=inH-top-head-10,rp=Math.min(104,rowsH/k);
  const tgtW=118,xs=12+tgtW+10,earnW=Math.min(128,rowsH-56),earnX=PANW-6-12-earnW,cw=(earnX-16-xs)/n,sz=Math.max(26,Math.min(rp-10,cw-6,72));
  return{p,k,n,top,head,rowsH,rp,tgtW,xs,earnW,earnX,cw,sz,inH};}
function busGoalHtml(){if(!isBus())return '';const p=busPlan();return p.goal<p.total?'<div class="ggoal" style="font-size:'+(11*scl()).toFixed(2)+'pt">with '+p.goal+' of '+p.total+'</div>':'';}
function busTokIn(){return (busGeom().sz-6)*scl()/72;}
function busGridBoard(){const g=busGeom(),p=g.p,rules=p.rules.slice();while(rules.length<g.k)rules.push(cello());const fs=v=>(v*scl()).toFixed(2)+'pt';
  let h=photoHtml('r')+'<div class="ttl rules" data-frac="1"><span class="ul">'+nameTitle()+'</span></div>';
  if(g.head)for(let j=0;j<g.n;j++){const c=p.cps[j];h+='<div class="gcp" style="left:'+pt(g.xs+j*g.cw)+';width:'+pt(g.cw)+';top:'+pt(g.top)+';font-size:'+fs(9.5)+'">'+esc(c?c.lab:'')+'</div>';}
  rules.forEach((o,r)=>{const y=g.top+g.head+r*g.rp,ph=Math.max(20,g.rp-26);
    h+='<div class="grule" style="left:'+pt(12)+';top:'+pt(y)+';width:'+pt(g.tgtW)+';height:'+pt(g.rp-6)+'"><div class="gl" style="font-size:'+fs(12)+'">'+esc(lbl(o))+'</div><div class="gp" style="height:'+pt(ph)+';width:'+pt(Math.min(g.tgtW,ph*1.25))+'">'+(isWord(o)?'':pic(o,''))+'</div></div>';
    for(let j=0;j<g.n;j++)h+='<div class="gslot" style="left:'+pt(g.xs+j*g.cw+(g.cw-g.sz)/2)+';top:'+pt(y+(g.rp-6-g.sz)/2)+';width:'+pt(g.sz)+';height:'+pt(g.sz)+'"><span class="dot"></span></div>';
    if(r)h+='<i class="grow" style="left:'+pt(8)+';right:'+pt(g.earnW+24)+';top:'+pt(y-3)+'"></i>';});
  const ey=g.top+g.head+(g.rowsH-g.head-(g.earnW+40))/2;
  h+='<div class="earn gearn" style="left:'+pt(g.earnX)+';top:'+pt(Math.max(g.top-6,ey))+';width:'+pt(g.earnW+4)+'"><div class="lab">Earn</div><div class="bx ft green" style="width:'+pt(g.earnW+3)+';height:'+pt(g.earnW+3)+'"><span class="dot"></span></div>'+(p.goal<p.total?'<div class="ggoal" style="font-size:'+fs(11)+'">with '+p.goal+' of '+p.total+'</div>':'')+'</div>';
  return pgOpen('bd','front')+'<div class="panel">'+h+'</div>'+pgClose;}
/* the Tokens page of a board with a row for each rule: a box for every token, in the Board's own rows and columns */
function busGridTokens(){const g=busGeom(),sz=g.sz,gap=8,W=g.n*sz+(g.n-1)*gap*1.6,x0=(PANW-6-W)/2,room=g.inH-104-40,rowH=Math.min(sz+gap*1.6,room/g.k),y0=104+Math.max(0,(room-g.k*rowH+gap*1.6)/2);let b='';
  for(let r=0;r<g.k;r++)for(let j=0;j<g.n;j++)b+='<div class="ybx gy" style="left:'+pt(x0+j*(sz+gap*1.6))+';top:'+pt(y0+r*rowH)+';width:'+pt(sz)+';height:'+pt(sz)+'"><span class="dot"></span></div>';
  const corner=has(S.tok[0])?tokCard(55*scl()/72):'';
  return pgOpen('tk','front')+'<div class="panel"><div class="tkcorner l">'+corner+'</div><div class="tkcorner r">'+corner+'</div><div class="ttl tk" data-frac=".8"><span class="ul">Tokens!!!</span></div>'+b+'<div class="foot">See Instructions On The Back</div></div>'+pgClose;}

/* ---------------- the ride plan, for the bus staff (a portrait page) ---------------- */
/* the route drawn plainly: a road from the start to the stop, the checkpoints on it where they fall in the ride (no map, nothing
   of the real streets: the addresses are never drawn or printed) */
const BUS_X0=70,BUS_X1=700;
function busRoadY(x){const u=(x-BUS_X0)/(BUS_X1-BUS_X0);return 104-30*Math.sin(u*Math.PI*2.2)+8*u;}
function busRoadPath(){let d='';for(let x=BUS_X0;x<=BUS_X1+.1;x+=6)d+=(d?'L':'M')+x.toFixed(1)+' '+busRoadY(x).toFixed(1);return d;}
function busIcon(kind,x,y,s){s=s||1;const T='translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+s+')';
  if(kind==='school')return '<g transform="'+T+'"><path d="M-22 0V-26L0-40L22-26V0Z" fill="#e8d3b0" stroke="#5b4a32" stroke-width="2"/><path d="M-26-26L0-44L26-26" fill="none" stroke="#a33a2c" stroke-width="4" stroke-linejoin="round"/><rect x="-6" y="-14" width="12" height="14" fill="#7a5a36"/><rect x="-17" y="-22" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/><rect x="10" y="-22" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/><path d="M0-44V-58" stroke="#5b4a32" stroke-width="2"/><path d="M0-58H12L9-54L12-50H0" fill="#d9483b"/></g>';
  if(kind==='home')return '<g transform="'+T+'"><path d="M-20 0V-24H20V0Z" fill="#f7e6c4" stroke="#5b4a32" stroke-width="2"/><path d="M-25-22L0-42L25-22" fill="#c9553f" stroke="#5b4a32" stroke-width="2" stroke-linejoin="round"/><rect x="-5" y="-14" width="10" height="14" fill="#6b8fb3"/><rect x="9" y="-19" width="7" height="7" fill="#bfe1f5" stroke="#5b4a32"/></g>';
  if(kind==='bus')return '<g transform="'+T+'"><rect x="-26" y="-22" width="52" height="20" rx="4" fill="#f6c21b" stroke="#3d3a2a" stroke-width="2"/><rect x="-21" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="-9" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="3" y="-18" width="9" height="7" fill="#d9eefa"/><rect x="15" y="-18" width="8" height="9" fill="#d9eefa"/><circle cx="-14" cy="-1" r="4.5" fill="#333"/><circle cx="14" cy="-1" r="4.5" fill="#333"/></g>';
  if(kind==='pin')return '<g transform="'+T+'"><path d="M0 0C-3-8-10-12-10-20A10 10 0 0 1 10-20C10-12 3-8 0 0Z" fill="#2f7fbf" stroke="#1d4a77" stroke-width="1.5"/><circle cx="0" cy="-20" r="4" fill="#fff"/></g>';
  return '<g transform="'+T+'"><circle r="9" fill="#fff" stroke="#1d4a77" stroke-width="2"/><path d="M0-5V0L4 3" stroke="#ef7d00" stroke-width="2" fill="none" stroke-linecap="round"/></g>';}
/* the road, the two ends and their names (the walkthrough draws the checkpoints and the bus over it) */
function busRouteBase(){const startHome=/home|house/i.test(busFrom())&&!/home|house/i.test(busTo());
  return '<path d="'+busRoadPath()+'" fill="none" stroke="#9aa3ab" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="'+busRoadPath()+'" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="9 9"/>'+
    busIcon(startHome?'home':'school',BUS_X0-34,busRoadY(BUS_X0)+12,1.05)+busIcon(startHome?'school':'home',BUS_X1+34,busRoadY(BUS_X1)+12,1.05)+
    '<text x="'+(BUS_X0-34)+'" y="'+(busRoadY(BUS_X0)+30).toFixed(1)+'" class="bp-end" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#1d2b36">'+esc(busFrom())+'</text><text x="'+(BUS_X1+34)+'" y="'+(busRoadY(BUS_X1)+30).toFixed(1)+'" class="bp-end" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#1d2b36">'+esc(busTo())+'</text>';}
function busRouteSvg(p,opt){opt=opt||{};const cps=p.cps,R=p.R,many=cps.length>14,step=many?Math.ceil(cps.length/14):1;
  let s='<svg class="bp-route" viewBox="0 0 770 190" role="img" aria-label="The route drawn plainly: '+esc(busFrom())+' to '+esc(busTo())+', with the checkpoints">'+busRouteBase();
  cps.forEach((c,i)=>{const x=BUS_X0+(BUS_X1-BUS_X0)*Math.min(1,c.t/R),y=busRoadY(x),lab=!many||i%step===step-1||i===cps.length-1;
    s+=c.lm?busIcon('pin',x,y-6,1):busIcon('clock',x,y,1);
    s+='<g class="bp-tok"><circle cx="'+x.toFixed(1)+'" cy="'+(y-38).toFixed(1)+'" r="10" fill="#ffe066" stroke="#b08900" stroke-width="1.6"/><text x="'+x.toFixed(1)+'" y="'+(y-34.5).toFixed(1)+'">'+(p.fixed&&p.fills>1?(i%p.n+1):i+1)+'</text></g>';
    if(lab)s+='<text x="'+x.toFixed(1)+'" y="'+(y+26).toFixed(1)+'" class="bp-cp">'+esc(c.lm?c.lab:busClock(c.t))+'</text>'+(c.lm?'<text x="'+x.toFixed(1)+'" y="'+(y+38).toFixed(1)+'" class="bp-cpt">about '+busClock(c.t)+'</text>':'');});
  if(!opt.nobus)s+=busIcon('bus',BUS_X0+6,busRoadY(BUS_X0+6)-2,.9);
  return s+'</svg>';}
function busPlanPage(){const p=busPlan(),T=turned(),f=String(S.meta.first||'').trim(),ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';
  const who=f?esc(f)+ap:'The student’s',nm=f?esc(f):'the student';const tok=esc(plural(tokName()).toLowerCase()),one=esc(tokName().toLowerCase());
  const cards=p.rules.map(o=>'<div class="bp-card"><div class="bp-cpic">'+(isWord(o)?'':pic(o,''))+'</div><div class="bp-cl">'+esc(lbl(o)||'(a rule)')+'</div></div>').join('')||'<p class="hint">(the bus rules go on the Targets page)</p>';
  const ev=busClock(busNum('bus_every',5,1,30));
  const when=p.st==='timer'?(p.fixed?'A timer set to go off every <b>'+ev+'</b> ('+p.K+' checkpoint'+(p.K===1?'':'s')+' on the '+p.R+'-minute ride'+(p.K>p.n?'; the board of '+p.n+' fills '+(p.fills===1?'once':p.fills+' times'):'')+').':'A timer at these times into the ride: <b>'+p.cps.map(c=>busClock(c.t)).join(', ')+'</b>. The last comes '+busClock(p.R-(p.cps.length?p.cps[p.cps.length-1].t:p.R))+' before the stop.')+' A vibrating watch or a phone on vibrate keeps it quiet on a noisy bus.':'As the bus passes each landmark: <b>'+p.cps.map(c=>esc(c.lab)).join(', ')+'</b>'+(p.st==='fewer'?' (every other landmark on the route)':'')+'.';
  const earn=p.each?'Each rule earns its own '+one+' at every checkpoint: a row of '+p.n+' for each rule. A missed rule leaves only its own slot empty for that checkpoint.':'One '+one+' at each checkpoint when '+nm+' followed <b>every</b> rule since the last checkpoint.';
  const item=busReward()==='arrive'?'At the stop ('+esc(busTo())+'): the board goes with '+nm+' to the adult who meets the bus, who gives the item right away when the board has '+(p.goal<p.total?p.goal+' of the '+p.total+' '+tok:'every '+one)+'. Tell that adult beforehand what the item is and where it is kept.':'On the bus, as soon as the board '+(p.goal<p.total?'has '+p.goal+' of the '+p.total+' '+tok:'is full')+': the item for the time or amount agreed, then the '+tok+' come off for the next board. Food on the bus only if the district’s transportation rules and the student’s health plan allow it.';
  const steps=[['timer','Step 1: a timer at the checkpoint times.'],['land','Step 2: landmarks on the route instead of the timer, about as many as before.'],['fewer','Step 3: every other landmark.'],['','Step 4: the board at the stop only, then praise alone. Go back a step if the rides get harder.']];
  const stepHtml=steps.map(([k,w])=>'<li'+(k===p.st?' class="on"':'')+'>'+w+(k===p.st?' <b>(now)</b>':'')+'</li>').join('');
  const logCols=Math.min(p.fixed?Math.max(1,p.K):p.cps.length||p.n,14);
  const logHead='<tr><th class="d">Date</th><th class="ap">AM / PM</th>'+Array.from({length:logCols},(_,i)=>'<th class="c">'+(i+1)+'</th>').join('')+'<th class="t">'+(p.each?'Tokens':'Tokens')+'</th><th class="i">Item?</th><th class="w">Initials</th></tr>';
  const logRow='<tr><td></td><td></td>'+Array.from({length:logCols},()=>'<td class="c"></td>').join('')+'<td class="t">/'+(p.fixed?p.K:p.total)+'</td><td class="i">Y&nbsp;&nbsp;N</td><td></td></tr>';
  const note=String(S.meta.bus_note||'').trim();
  const sub=esc(busFrom())+' to '+esc(busTo())+' &middot; about '+p.R+' minutes &middot; '+(p.st==='timer'?'timer':p.st==='land'?'landmarks':'every other landmark')+' &middot; '+(p.each?'a row for each rule':'one '+one+' for all the rules');
  return '<div class="pg port front'+(T?' tsheet':'')+'" data-kind="busplan" style="--s:1"><div class="bp">'+
    '<div class="bp-h"><div class="bp-t">'+who+' Bus Ride Plan</div><div class="bp-s">For the bus staff &middot; '+sub+'</div></div>'+
    busRouteSvg(p)+
    '<div class="bp-cols"><div class="bp-col"><h4>What earns a '+one+'</h4><div class="bp-cards">'+cards+'</div><p>'+earn+'</p></div>'+
    '<div class="bp-col"><h4>When</h4><p>'+when+'</p><h4>The item</h4><p>'+item+'</p></div></div>'+
    '<h4>At each checkpoint</h4><ol class="bp-ol"><li><b>Rules followed:</b> give the '+one+' right away, with brief praise that names the rule (&ldquo;Great job staying in your seat!&rdquo;), and let '+nm+' put it on the board.</li><li><b>Not followed:</b> no '+one+' this time. Calmly name the rule once (&ldquo;Seatbelt on.&rdquo;); the earned '+tok+' stay on the board, and the next checkpoint is a fresh chance.</li><li>The bus aide or monitor runs the board, never the driver while driving. Keep the board and '+tok+' attached (hook-and-loop) so nothing loose drops or goes in a mouth.</li></ol>'+
    '<div class="bp-cols"><div class="bp-col"><h4>Fading</h4><ol class="bp-steps">'+stepHtml+'</ol></div><div class="bp-col">'+(note?'<h4>Notes</h4><p>'+esc(note).replace(/\n/g,'<br>')+'</p>':'<h4>Notes</h4><div class="bp-lines"><i></i><i></i><i></i></div>')+'</div></div>'+
    '<h4>Ride log</h4><table class="bp-log">'+logHead+Array.from({length:7},()=>logRow).join('')+'</table><p class="bp-key">Tick a box for each checkpoint with a '+one+' (leave it empty when there was none); write the '+tok+' earned and whether the item was given.</p>'+
    '</div></div>';}

/* ---------------- the simulator's bus ride (Load simulator on a bus book): nothing in it is real ---------------- */
function busSim(){Object.assign(S.meta,{kind:'bus',site:'Elementary, bus route 12 (sample)',setting:'',bus_min:'25',bus_from:'School',bus_to:'Home',bus_fromA:'',bus_toA:'',bus_rule:'all',bus_time:'spread',bus_lead:'2',bus_every:'5',bus_step:'timer',bus_reward:'arrive',bus_goal:'',
    bus_note:'Sam sits in the second seat on the right, by the window, with the board on the seat back. Mom meets the bus.'});
  S.ch=['sticker','musicfun','ipad','snackfun','cardbubbles','cardbooks'].map(k=>cello(k));
  S.tg=[cello('sitting','Stay in my seat'),cello('quiet','Quiet voice'),cello('safehands','Hands to self'),cello(),cello(),cello()];
  S.lm=[['store','Grocery store','5'],['park','The park','10'],['','Fire station','14'],['libraryplace','Library','18'],['','The bridge','22']].map(([k,l,m])=>Object.assign(cello(k,l),{min:m}));}
/* the ride plan fits its page: the log gives up rows first (down to three), then the type shrinks a little (to 8.5 pt) */
function busFitPlan(root){$$('.pg[data-kind="busplan"] .bp',root||document).filter(bp=>root||!bp.closest('#wkStage')).forEach(bp=>{if(!bp.clientHeight)return;bp.style.fontSize='';const over=()=>bp.scrollHeight>bp.clientHeight+1;
  const rows=[...bp.querySelectorAll('table.bp-log tr')].slice(1);let i=rows.length;while(over()&&i>3)rows[--i].remove();
  let fs=10.5,g=0;while(over()&&fs>8.5&&g++<12){fs-=.25;bp.style.fontSize=fs+'pt';}});}

/* what the walkthrough needs of a bus book (called inside its copy of the state, on the timer step): the ride's checkpoints,
   the landmark steps, the ride plan page, and what to say about a book that is not finished */
function busWalkF(){const p=busPlan(),m=S.meta,keep=m.bus_step,sheets=m.sheets;
  m.bus_step='land';const land=busCps();m.bus_step='fewer';const fewer=busCps();m.bus_step=keep;
  m.sheets='land';let planHtml='';try{planHtml=busPlanPage();}finally{m.sheets=sheets;}
  const gap=p.cps.length?(p.fixed?busNum('bus_every',5,1,30):p.cps[p.cps.length-1].t/p.cps.length)*60:120;
  const notes=['This walkthrough shows the bus ride from this book: its rules, its item, its route and checkpoints; it starts with the timer (Step 1) and then shows the landmarks and the fewer checkpoints.'];
  return{p,each:p.each,n:p.n,k:p.k,R:p.R,fixed:p.fixed,cps:p.cps,land,fewer,gap,planHtml,notes,reward:busReward(),from:busFrom(),to:busTo(),
    rules:p.rules.map(o=>String(lbl(o)||'').trim()),first:String(S.meta.first||'').trim()};}
