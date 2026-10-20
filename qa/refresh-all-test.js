/* v23.75 Refresh all, on the start screen (the BCBA's iPad: each student's case opened, and its Form DD-1, to bring the
   day's data onto their card). The reply box run here with php -S, as qa/v2186-collect-test.js does; a simulated student
   (Mateo Rivera, ID 4471823) whose Form DD-1 has a staff phone link; the case kept on this iPad and closed:
   1. the start screen has Refresh all under the caseload's heading, with when it last ran;
   2. a phone sends two elopements; one tap brings them onto the student's case without opening it, the card is drawn
      again with the day, the line says what came in, a notice names the student; nothing is left open;
   3. a second tap: nothing new, nothing placed twice;
   4. by itself: after 30 minutes, with the start screen showing and no case open, the next entry comes in; not while a
      case is open, nor within 30 minutes of the last;
   5. a student with a Google Sheet linked: the line says the sheets are read with a tap; the tap opens Google's sign-in
      first (here it fails, simulated), says so, and still brings the replies in;
   6. on an iPad and on a phone the button is a finger's size and nothing is wider than the screen;
   7. no page errors. Simulated data only. Needs php on the PATH.  usage: node qa/refresh-all-test.js */
const {chromium,fs,path,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/refresh-all';fs.mkdirSync(OUT,{recursive:true});
const PORT=+(process.env.BOX_PORT||18175),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPHONE=IPAD.replace('iPad; CPU OS','iPhone; CPU iPhone OS');
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=!!((await r.json())||{}).ok;}catch(e){}}
  ok('0 box.php answers (php -S on '+PORT+')',up);if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1200);
  await page.evaluate(async()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};window.alert=()=>{};window.__asked=0;wsUI.choose=async()=>{window.__asked++;return '';};
    window.__toasts=[];const t0=wsUI.toast;wsUI.toast=(m,o)=>{window.__toasts.push(String(m));return t0.call(wsUI,m,o);};
    try{localStorage.removeItem('nbh.caseload.refresh');}catch(e){}
    const L=await clList();for(const r of L||[])await clTx('readwrite',st=>st.delete(r.key));
    const set=(s,v)=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera (simulated)');set('#pSid','4471823');set('#pSite','Test Elementary (simulated)');});
  await page.evaluate(()=>openForm('DD-1'));await page.waitForFunction(()=>!!state.status['DD-1'],null,{timeout:30000});await sleep(1200);
  const fr=page.frames().find(f=>/Daily_Behavior_Data/.test(f.url()));
  const T=await fr.evaluate(async u=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
    S=blankState();S.meta.client='Mateo Rivera (simulated)';S.meta.id='4471823';S.meta.school='Test Elementary (simulated)';
    const mk=(name,measure)=>({id:uid('b'),kind:'target',name,definition:name+' (simulated).',obsLength:'Entire school day',measure,direction:'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Elopement','count'),mk('Physical aggression','count')];S.rows=[];renderAll();
    document.getElementById('stAdv').open=true;const i=document.getElementById('stBoxIn');i.value=u;i.dispatchEvent(new Event('change',{bubbles:true}));
    const r=await __ddStaff.make('Ms. A (simulated), Room 12',[S.behaviors[0].id],[]);try{const d=document.getElementById('dlgStQr');if(d&&d.open)d.close();}catch(e){}
    return {url:r.url,el:S.behaviors[0].id,today:localISO(new Date())};},BOXURL);
  await page.evaluate(async()=>{await caseKeepOnly();});await page.evaluate(()=>clearCase());await sleep(900);
  const s1=await page.evaluate(()=>{const b=$('#blRefresh'),n=$('#blRfNote'),h=$('#blankCl h2');return {btn:b&&b.textContent.trim(),note:n&&n.textContent,after:!!h&&h.nextElementSibling&&h.nextElementSibling.classList.contains('bl-rf'),h:b&&Math.round(b.getBoundingClientRect().height)};});
  ok('1 the start screen has Refresh all under the caseload\'s heading, with when it last ran',s1.btn==='Refresh all'&&s1.after&&/^Not refreshed yet on this iPad\./.test(s1.note)&&s1.h>=44,s1);
  const PICS=process.env.PICS;if(PICS)await page.screenshot({path:PICS+'/Refresh_all_before.png'});
  const card0=await page.evaluate(()=>{const c=[...document.querySelectorAll('#blankCl .cl-card')].find(x=>/Mateo/.test(x.textContent));return c?c.querySelector('.cl-tw').textContent.replace(/\s+/g,' '):'';});
  /* the phone */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE});
  const pg=await ph.newPage();await pg.goto(T.url,{waitUntil:'load'});await sleep(600);
  for(let i=0;i<2;i++){await pg.tap(`section.t[data-t="${T.el}"] [data-a="inc"]`);await sleep(60);}
  await pg.tap('#sdSend');await sleep(1500);
  const sent=await pg.evaluate(()=>document.getElementById('sdMsg').textContent);
  ok('2a the phone sends two elopements for today',/^Sent\./.test(sent),sent);
  await page.tap('#blRefresh');await page.waitForFunction(()=>!RF.busy&&/^Refreshed/.test(($('#blRfNote')||{}).textContent||''),null,{timeout:60000});await sleep(800);
  const a=await page.evaluate(async([el,today])=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const d=parseCase(r.text),own=JSON.parse(d.forms['DD-1'].snap.own);
    const row=(own.rows||[]).find(x=>x.date===today),c=[...document.querySelectorAll('#blankCl .cl-card')].find(x=>/Mateo/.test(x.textContent));
    return {val:row&&row.values&&row.values[el],note:$('#blRfNote').textContent,toasts:window.__toasts.slice(),card:c?c.querySelector('.cl-tw').textContent.replace(/\s+/g,' '):'',frames:Object.keys(state.frames).length,host:document.querySelectorAll('#clHost iframe').length,asked:window.__asked};},[T.el,T.today]);
  if(PICS)await page.screenshot({path:PICS+'/Refresh_all_after.png'});
  ok('2b one tap brings them onto the case without opening it; the card is drawn again; the line and a notice say so; nothing left open',
    String(a.val)==='2'&&/^Refreshed today at .*: 1 student with something new\.$/.test(a.note)&&a.toasts.some(t=>/Mateo Rivera \(simulated\): 1 placed on Form DD-1/.test(t))&&a.card!==card0&&a.frames===0&&a.host===0&&a.asked===0,{a,card0});
  await page.evaluate(()=>{window.__toasts=[];});await page.tap('#blRefresh');await page.waitForFunction(()=>!RF.busy&&/^Refreshed/.test(($('#blRfNote')||{}).textContent||''),null,{timeout:60000});await sleep(500);
  const b=await page.evaluate(async([el,today])=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const own=JSON.parse(parseCase(r.text).forms['DD-1'].snap.own);const row=(own.rows||[]).find(x=>x.date===today);
    return {val:row&&row.values[el],note:$('#blRfNote').textContent,toasts:window.__toasts.slice()};},[T.el,T.today]);
  ok('3 a second tap: nothing new, nothing placed twice',String(b.val)==='2'&&/nothing new\.$/.test(b.note)&&b.toasts.some(t=>/^Nothing new\./.test(t)),b);
  /* by itself */
  await pg.reload({waitUntil:'load'});await sleep(500);await pg.tap(`section.t[data-t="${T.el}"] [data-a="inc"]`);await sleep(60);await pg.tap('#sdSend');await sleep(1500);
  const au=await page.evaluate(async()=>{window.__toasts=[];const soon=await rfAll(true);
    localStorage.setItem('nbh.caseload.refresh',new Date(Date.now()-31*60e3).toISOString());
    state.pending['XX-0']={title:'x'};const open=await rfAll(true);delete state.pending['XX-0'];
    const late=await rfAll(true);return {soon,open,late:late&&late.replies.map(o=>o.g.placed),toasts:window.__toasts.slice()};});
  const v4=await page.evaluate(async([el,today])=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const own=JSON.parse(parseCase(r.text).forms['DD-1'].snap.own);return (own.rows||[]).find(x=>x.date===today).values[el];},[T.el,T.today]);
  const sched=await page.evaluate(()=>[...document.scripts].some(s=>/setInterval\(\(\)=>rfAll\(true\),60e3\)/.test(s.textContent)));
  ok('4 by itself: the next entry comes in after 30 minutes (2 + 1), with a notice; not while a case is open; checked every minute',
    v4!==undefined&&String(v4)==='3'&&au.soon===null&&au.open===null&&String(au.late)==='1'&&au.toasts.some(t=>/^Refreshed by itself: Mateo Rivera/.test(t))&&sched,{au,v4,sched});
  /* a linked Google Sheet, signed out */
  const gs=await page.evaluate(async()=>{const r=(await clList()||[]).find(x=>/Mateo Rivera/.test(x.client||''));const d=parseCase(r.text),own=JSON.parse(d.forms['DD-1'].snap.own);
    (own.S||own).gs=Object.assign({},(own.S||own).gs||{},{id:'sheet-simulated',on:true});d.forms['DD-1'].snap.own=JSON.stringify(own);r.text=JSON.stringify(d);await clTx('readwrite',st=>st.put(r));
    try{sessionStorage.removeItem('nbh.google.tok');}catch(e){}kvSet('nbh.google.client','test-simulated.apps.example.org');
    window.__signin=0;clSignIn=()=>{window.__signin++;return Promise.reject(new Error('the sign-in was closed (simulated)'));};
    await paintBlank();await new Promise(z=>setTimeout(z,300));return {note:$('#blRfNote').textContent,sheets:RF.sheets};});
  await page.tap('#blRefresh');await page.waitForFunction(()=>!RF.busy&&/^Refreshed/.test(($('#blRfNote')||{}).textContent||''),null,{timeout:60000});await sleep(300);
  const gs2=await page.evaluate(()=>({signin:window.__signin,toasts:window.__toasts.slice(-2)}));
  ok('5 a linked Google Sheet, signed out: the line says a tap reads it; the tap opens Google\'s sign-in first, and the replies still come in',
    gs.sheets===1&&/the Google Sheets are read when you tap it/.test(gs.note)&&gs2.signin===1,{gs,gs2});
  /* sizes */
  const ipad=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));
  const q=await (await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,userAgent:IPHONE,serviceWorkers:'block'})).newPage();q.on('pageerror',e=>errs.push(e.message));
  await q.goto(BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await q.evaluate(async()=>{const r={key:clScope()+'|5550199|leo whitfield (simulated)',scope:clScope(),client:'Leo Whitfield (simulated)',sid:'5550199',site:'Test Elementary (simulated)',grade:'2',saved:new Date().toISOString(),sum:{items:[],lastData:'',forms:1},text:JSON.stringify({form:'CASE',rev:'2026-09',packet:{client:'Leo Whitfield (simulated)'},forms:{}})};
    await clTx('readwrite',st=>st.put(r));await paintBlank();await new Promise(z=>setTimeout(z,400));});
  const phs=await q.evaluate(()=>{const b=$('#blRefresh');return b&&{h:Math.round(b.getBoundingClientRect().height),r:Math.round(b.getBoundingClientRect().right),sw:document.documentElement.scrollWidth};});
  ok('6 on an iPad and on a phone the button is a finger\'s size, nothing wider than the screen',ipad.sw<=ipad.w&&!!phs&&phs.h>=44&&phs.r<=390&&phs.sw<=390,{ipad,phs});
  ok('7 no page errors',!errs.length,errs.slice(0,5));
  }catch(x){fails++;console.log('FAIL exception',x&&x.stack||x);}
  finally{await br.close();php.kill();}
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
