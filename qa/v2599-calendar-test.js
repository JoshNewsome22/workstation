/* v25.99 (the BCBA, 11/13: "connecting my Google Calendar to somewhere in the workstation so that I can keep track of days
   events ... click and go straight to the upcoming Google meet on the calendar") today's Google Calendar on the start screen.
   Google (the sign-in window and the Calendar answers) is simulated; the clock is Friday 11/13/2026, 9:50 AM in New York.
   A  off at first: with a Google key there is one quiet offer on the start screen and no calendar; without a key, nothing;
   B  a tap on the offer asks Google once, for calendar.events.readonly only, and the start screen shows Today's calendar:
      the day, a row for each event in order (the all-day one first), without the cancelled, the declined and the
      working-location entries;
   C  the event going on says Now and is marked; the next one says "In 8 min"; a past one is marked past;
   D  Join: the calendar's own video link ("Join Meet", opens in a new tab), a Zoom address in the place ("Join"); the
      one going on and the one about to start are emphasised; a past event has none; an address that is not https, or
      a script, is never made a link;
   E  one request to Google, a read (GET) of today from local midnight to midnight with the sign-in's token; nothing written;
   F  an event that names a student kept here has Open for that case; with Initials only on, the name in the title is
      shown as initials;
   G  kept for the session only: after a reload the events are there without a new sign-in; nothing of them in the
      device's lasting store;
   H  Hide the calendar: the calendar goes, the offer is back, and the events and the sign-in are forgotten;
   I  said plainly: the Calendar API not turned on; a sign-in that ended (the events stay, marked signed out, and Refresh
      asks again); the Google window closed (nothing is turned on);
   J  a phone: the rows stack, nothing wider than the screen, Join at least 44 px high;
   Z  no page error. Simulated people and events only.  usage: node qa/v2599-calendar-test.js   (WS_URL as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1700):''));if(!c)fails++;};
const WS=L.BASE+'/'+L.ED+'/index.html',T0=new Date('2026-11-13T14:50:00Z');   /* 9:50 AM in New York */
const G={mode:'ok',reqs:[]};
const at=(h,m)=>'2026-11-13T'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':00-05:00';
const EVENTS=()=>[
  {id:'e3',status:'confirmed',summary:'Consultation: grade 4 team',start:{dateTime:at(9,40)},end:{dateTime:at(10,10)},hangoutLink:'https://meet.google.com/abc-defg-hij'},
  {id:'e0',status:'confirmed',summary:'Report cards due',start:{date:'2026-11-13'},end:{date:'2026-11-14'}},
  {id:'e2',status:'confirmed',summary:'Morning arrival check',start:{dateTime:at(8,0)},end:{dateTime:at(8,30)},hangoutLink:'https://meet.google.com/old-past-one'},
  {id:'e4',status:'confirmed',summary:'IEP meeting: Mateo Rivera',start:{dateTime:at(9,58)},end:{dateTime:at(10,28)},conferenceData:{entryPoints:[{entryPointType:'phone',uri:'tel:+15550100'},{entryPointType:'video',uri:'https://meet.google.com/xyz-uvwx-rst'}]},location:'Conference room B'},
  {id:'e5',status:'confirmed',summary:'District training',start:{dateTime:at(13,0)},end:{dateTime:at(13,45)},location:'https://us02web.zoom.us/j/123456789'},
  {id:'e6',status:'confirmed',summary:'Parent call <b>bold</b>',start:{dateTime:at(14,0)},end:{dateTime:at(14,30)},location:'Room 12',description:'Dial <a href="javascript:alert(1)">here</a> or http://meet.google.com/insecure-one'},
  {id:'e7',status:'cancelled',summary:'Cancelled meeting',start:{dateTime:at(11,0)},end:{dateTime:at(11,30)}},
  {id:'e8',status:'confirmed',summary:'Declined meeting',start:{dateTime:at(11,0)},end:{dateTime:at(11,30)},attendees:[{self:true,responseStatus:'declined'}]},
  {id:'e9',status:'confirmed',summary:'Office',eventType:'workingLocation',start:{date:'2026-11-13'},end:{date:'2026-11-14'}}];
async function google(route){const req=route.request(),u=new URL(req.url());
  const json=(o,st)=>route.fulfill({status:st||200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(o)});
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'GET'}});
  G.reqs.push({m:req.method(),path:u.pathname,q:Object.fromEntries(u.searchParams),auth:req.headers()['authorization']||''});
  if(u.pathname!=='/calendar/v3/calendars/primary/events')return json({error:{code:404,message:'not simulated'}},404);
  if(G.mode==='off')return json({error:{code:403,message:'Google Calendar API has not been used in project 123 before or it is disabled.',errors:[{reason:'accessNotConfigured'}]}},403);
  if(G.mode==='401')return json({error:{code:401,message:'Invalid Credentials'}},401);
  return json({items:EVENTS()});}
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const device=async(o,key)=>{const ctx=await br.newContext(Object.assign({serviceWorkers:'block',timezoneId:'America/New_York',locale:'en-US'},o));
    await ctx.addInitScript(key=>{window.__gsAsk=0;window.__gsFail='';window.__gsScopes=[];
      window.google={accounts:{oauth2:{hasGrantedAllScopes:()=>true,initTokenClient(cfg){return {requestAccessToken(){window.__gsAsk++;window.__gsScopes.push(cfg.scope);
        setTimeout(()=>{if(window.__gsFail){if(cfg.error_callback)cfg.error_callback({type:window.__gsFail});return;}cfg.callback({access_token:'simulated-calendar-token-'+window.__gsAsk,expires_in:3600,scope:cfg.scope});},20);}};}}}};
      try{if(key)localStorage.setItem('nbh.google.client','123-simulated.apps.googleusercontent.com');}catch(e){}},key);
    await ctx.route('https://www.googleapis.com/**',google);await ctx.route('https://accounts.google.com/**',r=>r.fulfill({contentType:'text/javascript',body:'/* simulated */'}));
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:T0});await p.goto(WS);await sleep(1300);
    await p.evaluate(async()=>{wsUI.confirm=async()=>true;window.alert=()=>{};const Lq=await clList();for(const r of Lq||[])await clTx('readwrite',st=>st.delete(r.key));
      const rec=(name,sid)=>({key:clScope()+'|'+sid+'|'+name.toLowerCase(),scope:clScope(),client:name,sid,site:'Test Elementary (simulated)',grade:'4',bcba:'Jordan Ellis (simulated)',saved:'2026-11-12T15:00:00',
        sum:{items:[],lastData:'',forms:3},text:JSON.stringify({form:'CASE',rev:'2026-09',saved:'2026-11-12T15:00:00',packet:{client:name,sid},forms:{}})});
      for(const r of [rec('Mateo Rivera (simulated)','4471823'),rec('Nina Park (simulated)','5550123')])await clTx('readwrite',st=>st.put(r));
      localStorage.removeItem('nbh.gcal.on');localStorage.removeItem('nbh.caseload.ini');sessionStorage.removeItem('nbh.gcal.ev');sessionStorage.removeItem('nbh.google.cal');await paintBlank();await new Promise(r=>setTimeout(r,300));});
    return {ctx,p};};
  const read=p=>p.evaluate(()=>{const c=document.getElementById('blankCal'),o=document.getElementById('blankCalOffer'),N=s=>String(s||'').replace(/\s+/g,' ').trim();
    const vis=e=>!!(e&&!e.hidden&&e.offsetParent);
    return {cal:vis(c),offer:vis(o),offerBtn:o&&o.querySelector('#gcOn')?N(o.querySelector('#gcOn').textContent):'',head:c?N((c.querySelector('h2')||{}).textContent):'',sub:c?N((c.querySelector('.gc-sub')||{}).textContent):'',
      err:c?N((c.querySelector('.gc-err')||{}).textContent):'',none:c?N((c.querySelector('.gc-none')||{}).textContent):'',foot:c?N((c.querySelector('.gc-foot')||{}).textContent):'',
      rows:c?[...c.querySelectorAll('.gc-row')].map(r=>{const a=r.querySelector('a.gc-join'),b=r.querySelector('button[data-clopen]'),w=r.querySelector('.gc-what');
        return {cls:r.className,when:N(r.querySelector('.gc-when').textContent),pill:N((r.querySelector('.gc-pill')||{}).textContent),what:N([...w.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('')),where:N((w.querySelector('small')||{}).textContent),
          html:w.innerHTML.indexOf('<b>')>=0,join:a?{t:N(a.textContent),href:a.getAttribute('href'),target:a.target,rel:a.rel,hot:a.classList.contains('gc-hot'),h:Math.round(a.getBoundingClientRect().height),label:a.getAttribute('aria-label')}:null,
          open:b?{t:N(b.textContent),key:b.dataset.clopen}:null,links:r.querySelectorAll('a').length};}):[],
      ask:window.__gsAsk,scopes:window.__gsScopes,on:localStorage.getItem('nbh.gcal.on'),ssEv:!!sessionStorage.getItem('nbh.gcal.ev'),ssTok:!!sessionStorage.getItem('nbh.google.cal'),
      ls:Object.keys(localStorage).some(k=>/IEP meeting|Consultation: grade 4/.test(localStorage.getItem(k)||'')),toast:N((document.querySelector('.toast,[role=status].ws-toast,#toast')||{}).textContent),sw:document.documentElement.scrollWidth,iw:innerWidth};});
  /* ---------------- no Google key: nothing ---------------- */
  const N0=await device({viewport:{width:1366,height:1024}},false);const a0=await read(N0.p);await N0.ctx.close();
  /* ---------------- an iPad with the key ---------------- */
  const I=await device({viewport:{width:1366,height:1024},hasTouch:true},true);const p=I.p;
  const a1=await read(p);
  ok('A off at first: with a Google key, one offer on the start screen ("Show today’s Google Calendar here") and no calendar, nothing asked of Google; without a key, neither',
    !a0.cal&&!a0.offer&&!a1.cal&&a1.offer&&a1.offerBtn==='Show today’s Google Calendar here'&&a1.ask===0&&G.reqs.length===0,{a0:[a0.cal,a0.offer],a1:[a1.cal,a1.offer,a1.offerBtn,a1.ask],reqs:G.reqs.length});
  await p.click('#gcOn');await sleep(900);const b=await read(p);
  const whats=b.rows.map(r=>r.what),whens=b.rows.map(r=>r.when);
  ok('B a tap on the offer asks Google once, for calendar.events.readonly only; the start screen then shows Today’s calendar, Friday, November 13, with six rows in order (the all-day one first), without the cancelled, declined and working-location entries',
    b.ask===1&&b.scopes.length===1&&b.scopes[0]==='https://www.googleapis.com/auth/calendar.events.readonly'&&b.cal&&!b.offer&&b.on==='1'&&b.head==='Today’s calendar'&&b.sub==='Friday, November 13'&&
    JSON.stringify(whats)===JSON.stringify(['Report cards due','Morning arrival check','Consultation: grade 4 team','IEP meeting: Mateo Rivera','District training','Parent call <b>bold</b>'])&&
    JSON.stringify(whens)===JSON.stringify(['All day','8:00 AM – 8:30 AM','9:40 AM – 10:10 AM','9:58 AM – 10:28 AM','1:00 PM – 1:45 PM','2:00 PM – 2:30 PM'])&&!b.rows[5].html&&b.rows[5].where==='Room 12'&&b.rows[3].where==='Conference room B'&&b.rows[4].where==='',
    {ask:b.ask,scopes:b.scopes,cal:b.cal,head:b.head,sub:b.sub,whats,whens,err:b.err});
  ok('C the event going on says Now and is marked; the next one says "In 8 min"; the past one is marked past; the others carry no pill',
    b.rows.length===6&&b.rows[2].pill==='Now'&&/gc-now/.test(b.rows[2].cls)&&b.rows[3].pill==='In 8 min'&&!/gc-now/.test(b.rows[3].cls)&&/gc-past/.test(b.rows[1].cls)&&!b.rows[1].pill&&!b.rows[0].pill&&!b.rows[4].pill&&!/gc-past/.test(b.rows[4].cls),b.rows.map(r=>[r.cls,r.pill]));
  const j2=b.rows[2]&&b.rows[2].join,j3=b.rows[3]&&b.rows[3].join,j4=b.rows[4]&&b.rows[4].join;
  ok('D Join: the event going on has "Join Meet" to its own Meet, in a new tab, emphasised; the next has its video link (not the phone number), emphasised; the Zoom address in the place gives "Join", not emphasised; the past event and the one with only a script and a plain-http address have no link at all',
    j2&&j2.t==='Join Meet'&&j2.href==='https://meet.google.com/abc-defg-hij'&&j2.target==='_blank'&&/noopener/.test(j2.rel)&&j2.hot&&/Join Google Meet: Consultation/.test(j2.label)&&
    j3&&j3.href==='https://meet.google.com/xyz-uvwx-rst'&&j3.hot&&j4&&j4.t==='Join'&&j4.href==='https://us02web.zoom.us/j/123456789'&&!j4.hot&&
    !b.rows[1].join&&b.rows[1].links===0&&!b.rows[5].join&&b.rows[5].links===0&&!b.rows[0].join,{j2,j3,j4,past:b.rows[1].links,bad:b.rows[5].links});
  const r0=G.reqs[0]||{q:{}};
  ok('E one request to Google: a read of the account’s own calendar for today, from local midnight to the next (5:00 UTC), single events in start order, with the sign-in’s token; nothing written',
    G.reqs.length===1&&r0.m==='GET'&&r0.path==='/calendar/v3/calendars/primary/events'&&r0.q.timeMin==='2026-11-13T05:00:00.000Z'&&r0.q.timeMax==='2026-11-14T05:00:00.000Z'&&r0.q.singleEvents==='true'&&r0.q.orderBy==='startTime'&&r0.auth==='Bearer simulated-calendar-token-1'&&G.reqs.every(x=>x.m==='GET'),G.reqs);
  const key=await p.evaluate(async()=>{const Lq=await clList();const r=Lq.find(x=>/Mateo/.test(x.client));return {key:r.key,ini:clIniOf(r)};});
  const f1=b.rows[3].open;await p.evaluate(async()=>{localStorage.setItem('nbh.caseload.ini','1');await paintBlank();});await sleep(300);const f2=await read(p);
  await p.evaluate(async()=>{localStorage.removeItem('nbh.caseload.ini');await paintBlank();});await sleep(200);
  ok('F the event that names a student kept here has Open for that case ("Open Mateo"), and no other row has one; with Initials only on, the title reads "IEP meeting: '+key.ini+'" and the button "Open '+key.ini+'"',
    f1&&f1.key===key.key&&f1.t==='Open Mateo'&&b.rows.filter(r=>r.open).length===1&&f2.rows[3].what==='IEP meeting: '+key.ini&&f2.rows[3].open&&f2.rows[3].open.t==='Open '+key.ini&&f2.rows[3].open.key===key.key,{f1,key,f2:f2.rows[3]});
  await p.reload();await sleep(1500);const g=await read(p);
  ok('G kept for the session only: after a reload the six events are there with no new sign-in and no new request; none of their words is in the device’s lasting store',
    g.cal&&g.rows.length===6&&g.ask===0&&G.reqs.length===1&&g.ssEv&&!g.ls&&!b.ls,{cal:g.cal,rows:g.rows.length,ask:g.ask,reqs:G.reqs.length,ls:g.ls});
  await p.click('#gcOff');await sleep(500);const h=await read(p);
  ok('H Hide the calendar: the calendar goes, the offer is back, and the events, the sign-in and the switch are forgotten',!h.cal&&h.offer&&h.on===null&&!h.ssEv&&!h.ssTok,h);
  /* said plainly */
  G.mode='off';await p.click('#gcOn');await sleep(900);const i1=await read(p);
  G.mode='ok';await p.click('#gcSign');await sleep(900);const i2=await read(p);
  G.mode='401';await p.evaluate(()=>{GCAL.tried=0;GCAL.at=0;});await p.click('#gcRefresh');await sleep(900);const i3=await read(p);
  G.mode='ok';const ask3=i3.ask;await p.click('#gcRefresh');await sleep(900);const i4=await read(p);
  await p.click('#gcOff');await sleep(400);await p.evaluate(()=>{window.__gsFail='popup_closed';});await p.click('#gcOn');await sleep(700);const i5=await read(p);
  ok('I said plainly: the Calendar API not turned on (the message names Help and the step, with a way to try again); then it works; a sign-in that ended keeps the events on screen, marked signed out, and Refresh asks Google again; the Google window closed turns nothing on',
    i1.cal&&/Google Calendar API is not turned on/.test(i1.err)&&/Help/.test(i1.err)&&i1.rows.length===0&&/Show today’s events/.test(i1.none)&&i2.rows.length===6&&!i2.err&&
    i3.rows.length===6&&/signed out since/.test(i3.foot)&&!i3.ssTok&&i4.ask===ask3+1&&i4.rows.length===6&&!/signed out/.test(i4.foot)&&!i5.cal&&i5.offer&&i5.on===null,
    {i1:[i1.err,i1.rows.length,i1.none],i2:[i2.rows.length,i2.err],i3:[i3.rows.length,i3.foot,i3.ssTok],i4:[i4.ask,ask3,i4.foot],i5:[i5.cal,i5.offer,i5.on]});
  await I.ctx.close();
  /* ---------------- a phone ---------------- */
  G.mode='ok';const P=await device({viewport:{width:390,height:844},hasTouch:true,isMobile:true},true);
  await P.p.tap('#gcOn');await sleep(900);const j=await read(P.p);
  const stack=await P.p.evaluate(()=>{const r=document.querySelectorAll('#blankCal .gc-row')[2],w=r.querySelector('.gc-when').getBoundingClientRect(),t=r.querySelector('.gc-what').getBoundingClientRect(),a=r.querySelector('.gc-act').getBoundingClientRect();return w.bottom<=t.top+1&&t.bottom<=a.top+1&&a.right<=innerWidth;});
  ok('J a phone: six rows, each stacked (when, what, Join), nothing wider than the screen, Join at least 44 px high',j.rows.length===6&&stack&&j.sw<=j.iw&&j.rows[2].join.h>=44,{rows:j.rows.length,stack,sw:j.sw,iw:j.iw,h:j.rows[2]&&j.rows[2].join&&j.rows[2].join.h});
  await P.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
