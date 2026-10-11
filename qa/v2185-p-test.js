/* v21.85 helper P: staff phones. Form DD-1 makes a link per staff member (QR code, Copy, the list of links); a phone opens
   staff-data.html from it at 390 x 844 with touch, taps counts for two targets, an episode, + and - for a skill and an
   interval target, the assent, the setting and a note, and sends; taps survive a reload; taps made with no signal are kept
   on the phone and sent later; DD-1 collects through box.php (run here with php -S, as qa/reply-box-test.js does) and places
   each entry on its day and targets with Collected by, the assent and the setting, nothing twice; the site holds only
   ciphertext; the link carries the student's initials only; a day the Google Sheet writes holds the phone's number (and it
   is placed once the sheet is set aside); a stopped link's entries wait for Place it; Save data and Open keep the box and
   what was taken; the facts carry data.staff; the caseload's unattended hook; Remove the collected entries from the site;
   no page errors. Simulated students only. Needs php on the PATH.
   usage: node qa/v2185-p-test.js   (WS_URL as in qa/lib.js) */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2185-p';fs.mkdirSync(OUT,{recursive:true});
const W=BASE+'/NBH-Workstation/Daily_Behavior_Data_and_Visual_Analysis.html';
const PORT=+(process.env.BOX_PORT||18151),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const sha=t=>require('crypto').createHash('sha256').update(t).digest('hex');
const J=async(u,opt)=>{const r=await fetch(u,opt);let j=null;try{j=await r.json();}catch(e){}return {s:r.status,j};};
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const errsOf=log=>log.filter(x=>(x.type==='pageerror'||x.type==='error')&&!/ERR_INTERNET_DISCONNECTED|Failed to load resource|net::ERR_|Failed to fetch/i.test(x.text));
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let phpErr='';php.stderr.on('data',d=>{phpErr+=d;});php.on('error',e=>{phpErr+=String(e);});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await J(BOXURL+'?a=ping');up=!!(r.j&&r.j.ok);}catch(e){}}
  ok('0 box.php answers (php -S on '+PORT+')',up,phpErr.slice(0,200));if(!up){php.kill();process.exit(1);}
  const br=await chromium.launch();const log=[],plog=[];
  try{
  /* ================= DD-1: the record and the links ================= */
  const ctx=await br.newContext({viewport:{width:1300,height:900}});await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:BASE});
  const dd=await ctx.newPage();wire(dd,log);await dd.goto(W,{waitUntil:'load'});await sleep(1200);
  const T=await dd.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}
    S=blankState();S.meta.client='Mateo Rivera';S.meta.id='4471823';S.meta.school='Royal Palm School';
    const mk=(name,measure,kind)=>({id:uid('b'),kind:kind||'target',name,definition:name+' (simulated).',obsLength:'Entire school day',measure,direction:kind==='acquisition'?'increase':'decrease',aim:'',critDays:3,pairWith:'',color:PALETTE[0]});
    S.behaviors=[mk('Physical aggression','count'),mk('Elopement','count'),mk('Tantrum','duration'),mk('Requesting a break','trials','acquisition'),mk('On task','pint','acquisition'),mk('Latency to start work','latency')];
    S.rows=[];renderAll();document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));
    const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return localISO(d);};
    return {ids:Object.fromEntries(S.behaviors.map(b=>[b.name,b.id])),today:iso(0),yday:iso(-1),d2:iso(-2),d3:iso(-3)};});
  const B=T.ids;
  const p0=await dd.evaluate(async()=>{const p=document.getElementById('ddStaff');return {panel:!!p&&p.closest('#tab-data')!==null,line:document.getElementById('stBoxLine').textContent,
    tg:[...document.querySelectorAll('#stTgts input[data-stt]')].map(c=>c.dataset.stt),off:document.querySelector('#stTgts').textContent,noBox:(await __ddStaff.make('Ms. A',[S.behaviors[0].id],[])).err||'',staff:S.staff===undefined};});
  ok('1 the Staff phones panel is on the Daily data tab; no box address yet (served from 127.0.0.1), so a link is refused with the reason; the record holds no staff part',p0.panel&&/No reply box address/.test(p0.line)&&/reply box/i.test(p0.noBox)&&p0.staff,p0);
  ok('2 every target a phone can record is offered (count, duration, + / −), the latency target is named as not on phone links',p0.tg.length===5&&p0.tg.indexOf(B['Latency to start work'])<0&&/Not on phone links.*Latency to start work/.test(p0.off),p0);
  await dd.evaluate(u=>{document.getElementById('stAdv').open=true;const i=document.getElementById('stBoxIn');i.value=u;i.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);
  await dd.fill('#stWho','Ms. A, Room 12');await dd.fill('#stSets','Classroom, Specials, Lunch');
  await dd.evaluate(()=>document.getElementById('stMake').click());await sleep(1200);
  const m1=await dd.evaluate(()=>{const d=document.getElementById('dlgStQr'),s=S.staff;return {open:!!(d&&d.open),url:d&&d.querySelector('#stQrUrl').value,mods:+((d&&d.querySelector('#stQrBox svg'))||{getAttribute:()=>0}).getAttribute('data-modules'),
    t:d&&d.querySelector('#stQrT').textContent,box:s&&s.box,links:s&&s.links.map(l=>({code:l.code,who:l.who,made:l.made,t:l.t.length,st:l.st})),rows:[...document.querySelectorAll('#stLinks tbody tr')].map(tr=>tr.textContent),
    line:document.getElementById('stBoxLine').textContent};});
  ok('3 Make the link: the box is registered at the site (keys and token in the record), the link is listed (code, who, made, last entry) and shown as a QR code',m1.open&&m1.box&&/^[a-f0-9]{32}$/.test(m1.box.id)&&m1.box.site===BOXURL&&m1.box.priv&&m1.box.priv.d&&m1.links.length===1&&m1.links[0].who==='Ms. A, Room 12'&&m1.links[0].t===5&&
    m1.links[0].made===T.today&&m1.mods>=21&&/Ms\. A, Room 12/.test(m1.t)&&m1.rows.length===1&&m1.rows[0].indexOf(m1.links[0].code)>=0&&/—/.test(m1.rows[0])&&new RegExp('Reply box at 127\\.0\\.0\\.1:'+PORT+': 1 link').test(m1.line),m1);
  ok('4 the site holds the box as its token’s hash, nothing readable',fs.existsSync(data+'/'+m1.box.id+'/token')&&fs.readFileSync(data+'/'+m1.box.id+'/token','utf8').trim()===sha(m1.box.token));
  const PL=JSON.parse(Buffer.from(m1.url.split('#s=')[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
  ok('5 the link opens staff-data.html beside the form; after # it carries the box (address, id, public key: no private key), the initials only, the targets with their measures, the settings and who it is for',
    m1.url.indexOf(BASE+'/NBH-Workstation/staff-data.html#s=')===0&&PL.x.u===BOXURL&&PL.x.b===m1.box.id&&PL.x.k.x===m1.box.pub.x&&!('d' in PL.x.k)&&PL.s==='M.R.'&&PL.w==='Ms. A, Room 12'&&
    PL.t.map(t=>t.n+':'+t.m).join()==='Physical aggression:n,Elopement:n,Tantrum:d,Requesting a break:p,On task:i'&&PL.st.join()==='Classroom,Specials,Lunch'&&
    !/Mateo|Rivera|4471823|Royal Palm|token|priv/.test(JSON.stringify(PL))&&m1.url.indexOf(m1.box.token)<0&&m1.url.indexOf(m1.box.priv.d)<0,PL);
  await dd.evaluate(()=>document.getElementById('stQrCopy').click());await sleep(200);
  const clip=await dd.evaluate(()=>navigator.clipboard.readText());
  ok('6 Copy the link puts it on the clipboard',clip===m1.url,clip.slice(0,80));
  await dd.evaluate(()=>document.getElementById('dlgStQr').close());
  const m2=await dd.evaluate(async b=>{const r=await __ddStaff.make('Mr. B, Para',[b['Physical aggression'],b['Requesting a break']],['Lunch','Recess']);return {url:r.url,code:r.link&&r.link.code,n:S.staff.links.length,box:S.staff.box.id};},B);
  ok('7 a second link (Mr. B) in the same box, with its own code',m2.url&&m2.n===2&&m2.box===m1.box.id&&m2.code!==m1.links[0].code,m2);

  /* ================= the phone ================= */
  const ph=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3,userAgent:IPHONE});
  const pg=await ph.newPage();wire(pg,plog);await pg.goto(m1.url,{waitUntil:'load'});await sleep(600);
  const tap=async(t,a,n)=>{for(let i=0;i<(n||1);i++){await pg.tap(`section.t[data-t="${t}"] [data-a="${a}"]`);await sleep(40);}};
  const lay=await pg.evaluate(()=>{const de=document.documentElement,small=[],tiny=[];
    document.querySelectorAll('button,select,input').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&(r.height<43.5||r.width<43.5))small.push((e.textContent||e.id||e.type).trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height));});
    document.querySelectorAll('h2,p,label,span,button,output,li,input,select').forEach(e=>{if(!e.offsetParent&&getComputedStyle(e).position!=='fixed')return;const fs=parseFloat(getComputedStyle(e).fontSize);if(e.textContent.trim()&&fs<13.5)tiny.push(e.tagName+' '+fs);});
    const body=parseFloat(getComputedStyle(document.body).fontSize);
    return {h1:document.querySelector('h1').textContent,who:document.querySelector('.who').textContent,cards:document.querySelectorAll('section.t').length,sw:de.scrollWidth,cw:de.clientWidth,small,tiny,body,
      inputs:[...document.querySelectorAll('input,select')].map(e=>parseFloat(getComputedStyle(e).fontSize)),send:document.getElementById('sdSend').textContent,date:document.getElementById('sdDate').value,
      sets:[...document.querySelectorAll('#sdSet option')].map(o=>o.textContent)};});
  ok('8 the phone page (390 px, touch): the student as initials, who records, five targets, today’s date, the settings; no sideways scroll',lay.h1==='Behavior data · M.R.'&&/Ms\. A, Room 12/.test(lay.who)&&lay.cards===5&&lay.sw<=lay.cw&&lay.date===T.today&&/Send today/.test(lay.send)&&lay.sets.join('|')==='Choose the setting|Classroom|Specials|Lunch|Other…',lay);
  ok('9 16 px text and fields, every control at least 44 px',lay.body>=16&&lay.inputs.every(f=>f>=16)&&!lay.small.length,{small:lay.small,inputs:lay.inputs,body:lay.body,tiny:lay.tiny.slice(0,5)});
  await tap(B['Physical aggression'],'inc',3);await tap(B['Physical aggression'],'undo',1);await tap(B['Elopement'],'inc',2);
  await tap(B['Requesting a break'],'plus',3);await tap(B['Requesting a break'],'minus',1);await tap(B['On task'],'plus',2);await tap(B['On task'],'minus',2);await tap(B['On task'],'undo');await tap(B['On task'],'minus');
  await tap(B['Tantrum'],'dur');await sleep(1300);await tap(B['Tantrum'],'dur');
  await pg.tap('[data-as="agreed"]');await pg.selectOption('#sdSet','Classroom');await pg.fill('#sdNote','Calm after the break (simulated)');await sleep(100);
  const shown=await pg.evaluate(b=>({pa:document.querySelector(`section.t[data-t="${b['Physical aggression']}"] [data-o="n"]`).textContent,el:document.querySelector(`section.t[data-t="${b['Elopement']}"] [data-o="n"]`).textContent,
    rq:document.querySelector(`section.t[data-t="${b['Requesting a break']}"] [data-o="pm"]`).textContent,eps:document.querySelectorAll(`section.t[data-t="${b['Tantrum']}"] .eps li`).length}),B);
  await pg.reload({waitUntil:'load'});await sleep(500);
  const kept=await pg.evaluate(b=>{const s=__nbhStaffPage.state();return {pa:s.t[b['Physical aggression']].n,el:s.t[b['Elopement']].n,rq:[s.t[b['Requesting a break']].p,s.t[b['Requesting a break']].m],ot:[s.t[b['On task']].p,s.t[b['On task']].m],
    ep:s.t[b['Tantrum']].e.length,as:s.as,set:s.set,note:s.note,out:s.out.length,shown:document.querySelector(`section.t[data-t="${b['Physical aggression']}"] [data-o="n"]`).textContent,
    pressed:document.querySelector('[data-as="agreed"]').getAttribute('aria-pressed'),sel:document.getElementById('sdSet').value,ni:document.getElementById('sdNote').value,msg:document.getElementById('sdMsg').textContent};},B);
  ok('10 the taps show as made (+1, −1 undo, + and −, an episode timed with Start and Stop)',shown.pa==='2'&&shown.el==='2'&&/3 \+.*1 −.*75%/.test(shown.rq)&&shown.eps===1,shown);
  ok('11 a reload keeps every tap, the assent, the setting and the note (kept on the phone, nothing sent yet)',kept.pa===2&&kept.el===2&&kept.rq.join()==='3,1'&&kept.ot.join()==='2,2'&&kept.ep===1&&kept.as==='agreed'&&kept.set==='Classroom'&&/Calm after the break/.test(kept.note)&&kept.out===0&&kept.shown==='2'&&kept.pressed==='true'&&kept.sel==='Classroom'&&/Calm/.test(kept.ni)&&/not sent yet/.test(kept.msg),kept);
  await pg.tap('#sdSend');await sleep(1500);
  const s1=await pg.evaluate(()=>{const s=__nbhStaffPage.state();return {msg:document.getElementById('sdMsg').textContent,out:s.out.length,sent:s.sent.length,pa:s.t[Object.keys(s.t)[0]].n,list:document.getElementById('sdSent').textContent,keyHasBox:__nbhStaffPage.key};});
  ok('12 Send today’s data: the page says Sent. with the time; the counters start again; the sent list says what went',/^Sent\. \d{1,2}:\d{2} (am|pm)$/.test(s1.msg)&&s1.out===0&&s1.sent===1&&s1.pa===0&&/Physical aggression 2/.test(s1.list),s1);
  const files1=fs.readdirSync(data+'/'+m1.box.id).filter(f=>/^r-/.test(f));
  const raw=files1.map(f=>fs.readFileSync(data+'/'+m1.box.id+'/'+f,'utf8')).join('\n');
  ok('13 the site holds one locked message and nothing readable (no initials, names, counts, assent, setting or note)',files1.length===1&&!/M\.R\.|Mateo|Rivera|Physical|Elopement|Ms\. A|Classroom|agreed|Calm|nbh-staff|"n":|"d":/.test(raw)&&/"ct":"[A-Za-z0-9_-]{40,}"/.test(raw),raw.slice(0,300));
  /* no signal: yesterday's taps (the date changed on the phone), Send keeps them */
  await ph.setOffline(true);
  await pg.fill('#sdDate',T.yday);await pg.dispatchEvent('#sdDate','change');await sleep(100);
  await tap(B['Physical aggression'],'inc',4);await pg.tap('#sdSend');await sleep(1200);
  const off=await pg.evaluate(()=>{const s=__nbhStaffPage.state();return {msg:document.getElementById('sdMsg').textContent,out:s.out.length,date:s.out[0]&&s.out[0].date,old:document.getElementById('old').hidden};});
  ok('14 with no signal Send says Not sent yet and keeps the entry on the phone (for the date chosen)',/Not sent yet/.test(off.msg)&&off.out===1&&off.date===T.yday,off);
  await ph.setOffline(false);await pg.reload({waitUntil:'load'});await sleep(1500);
  const on=await pg.evaluate(()=>{const s=__nbhStaffPage.state();return {msg:document.getElementById('sdMsg').textContent,out:s.out.length,sent:s.sent.length,date:document.getElementById('sdDate').value};});
  ok('15 back online the waiting entry goes by itself (opening the page again), says Sent., and the page moves to today',on.out===0&&on.sent===2&&/^Sent\./.test(on.msg)&&on.date===T.today,on);
  /* Mr. B on the same phone: another link, its own record on the phone */
  const pb=await ph.newPage();wire(pb,plog);await pb.goto(m2.url,{waitUntil:'load'});await sleep(500);
  await pb.tap(`section.t[data-t="${B['Physical aggression']}"] [data-a="inc"]`);await pb.tap(`section.t[data-t="${B['Requesting a break']}"] [data-a="plus"]`);await pb.tap(`section.t[data-t="${B['Requesting a break']}"] [data-a="plus"]`);
  await pb.tap('[data-as="refused"]');await pb.selectOption('#sdSet','Lunch');await pb.tap('#sdSend');await sleep(1400);
  const sb=await pb.evaluate(()=>({msg:document.getElementById('sdMsg').textContent,cards:document.querySelectorAll('section.t').length,who:document.querySelector('.who').textContent}));
  ok('16 a second staff member’s link on the same phone keeps its own taps and sends',/^Sent\./.test(sb.msg)&&sb.cards===2&&/Mr\. B, Para/.test(sb.who),sb);

  /* ================= DD-1 collects ================= */
  await dd.evaluate(()=>document.getElementById('stCollect').click());await sleep(1800);
  const c1=await dd.evaluate(([b,T])=>{const R=d=>S.rows.find(r=>r.date===d),t=R(T.today),y=R(T.yday);
    const ep=t?episodesOf(t,S.behaviors.find(x=>x.id===b['Tantrum'])):[];
    return {rows:S.rows.length,t:t&&{pa:t.values[b['Physical aggression']],el:t.values[b['Elopement']],tn:t.values[b['Tantrum']],rq:[t.values[b['Requesting a break']],t.values[b['Requesting a break']+'::opp']],ot:t.values[b['On task']],basis:t.basis&&t.basis[b['On task']],
        by:t.by,as:t.assent,set:t.setting,notes:t.notes,ep:ep.map(e=>e.note+'|'+!!e.start+'|'+!!e.end+'|'+e.dur)},
      y:y&&{pa:y.values[b['Physical aggression']],el:y.values[b['Elopement']],tn:y.values[b['Tantrum']],rq:y.values[b['Requesting a break']],ot:y.values[b['On task']],by:y.by,as:y.assent},
      line:document.getElementById('stLine').textContent,links:[...document.querySelectorAll('#stLinks tbody tr')].map(tr=>tr.textContent),seen:S.staff.seen.length,got:S.staff.got.length,held:S.staff.held.length,
      cell:(document.querySelector(`#dataTable tr[data-r="${t&&t.id}"] input[data-v="${b['Physical aggression']}"]`)||{}).value,sd:shortDay(T.today)};},[B,T]);
  ok('17 Collect now places today’s entries on today’s row: the counts added (2 + 1), the episode in the log, + and − combined by opportunities, the interval percent with its intervals',
    c1.t&&c1.t.pa==='3'&&c1.t.el==='2'&&c1.t.rq.join()==='5,6'&&c1.t.ot==='50'&&c1.t.basis&&c1.t.basis.n===4&&c1.t.basis.s===2&&c1.t.ep.length===1&&/^From Ms\. A, Room 12’s phone\|true\|true\|0:0[12]$/.test(c1.t.ep[0])&&+c1.t.tn>0&&c1.cell==='3',c1);
  ok('18 who sent it is under Collected by (both), the assent and the setting where the day had none, the note after the day’s notes',c1.t&&c1.t.by==='Ms. A, Room 12; Mr. B, Para'&&c1.t.as==='agreed'&&c1.t.set==='Classroom'&&/Ms\. A, Room 12: Calm after the break \(simulated\)/.test(c1.t.notes),c1.t);
  ok('19 the entry sent later goes on its own day (yesterday): its count, a measured 0 for the targets watched with nothing tapped, by and assent',c1.y&&c1.y.pa==='4'&&c1.y.el==='0'&&c1.y.tn==='0'&&!c1.y.rq&&!c1.y.ot&&c1.y.by==='Ms. A, Room 12'&&c1.y.as==='agreed'&&c1.rows===2,c1.y);
  ok('20 the links list the last entry and the number taken; the panel says what came',c1.links.length===2&&c1.links[0].split(c1.sd).length===3&&/2$/.test(c1.links[0].replace(/QR.*$/,''))&&/Collected from staff phones/.test(c1.line)&&c1.seen===3&&c1.got===3&&c1.held===0,{links:c1.links,line:c1.line,seen:c1.seen});
  const c2=await dd.evaluate(async b=>{const before=JSON.stringify(S.rows);const r=await __ddStaff.collect(false);return {r,same:JSON.stringify(S.rows)===before,line:document.getElementById('stLine').textContent};},B);
  ok('21 collecting again places nothing twice',c2.r&&c2.r.placed===0&&c2.r.fresh===0&&c2.r.all===3&&c2.same&&/Nothing new/.test(c2.line),c2);
  const f1=await dd.evaluate(()=>{const o=window.__nbhFactsOut();return o&&o.data&&o.data.staff;});
  ok('22 the facts carry data.staff: the links (code, who, made, last), the entries taken, the last day',f1&&f1.links.length===2&&f1.links[0].who==='Ms. A, Room 12'&&f1.links[0].made===T.today&&f1.links[0].last===T.today&&/^[A-Z0-9]{8}$/.test(f1.links[0].code)&&f1.entries===3&&f1.last===T.today&&f1.links[1].last===T.today,f1);

  /* ================= a day the Google Sheet writes ================= */
  await dd.evaluate(([b,d2])=>{S.gs={id:'1SIMULATEDsheetIDforTESTSabcdefghijklmnop',url:'',title:'SIMULATED sheet',tabs:['Data TBx'],on:true,read:new Date().toISOString(),nameOk:'',applied:{},madeRows:[],madeBeh:[],
    cache:{student:{name:'Mateo Rivera',id:'4471823'},groups:[{tab:'Data TBx',col:1,name:'Physical aggression',kind:'target',measure:'count',two:false,def:'',ex:'',meas:'',obs:'',days:{[d2]:{v:7}}}]}};gsApply();renderAll();},[B,T.d2]);
  await pg.bringToFront();await pg.fill('#sdDate',T.d2);await pg.dispatchEvent('#sdDate','change');await tap(B['Physical aggression'],'inc',2);await tap(B['Elopement'],'inc',1);
  for(const id of [B['Tantrum'],B['Requesting a break'],B['On task']])await pg.tap(`section.t[data-t="${id}"] [data-a="watch"]`);
  await pg.tap('#sdSend');await sleep(1400);
  const g1=await dd.evaluate(async([b,d2])=>{const r=await __ddStaff.collect(false);const row=S.rows.find(x=>x.date===d2);return {r,pa:row.values[b['Physical aggression']],el:row.values[b['Elopement']],tn:row.values[b['Tantrum']],
    held:S.staff.held.map(h=>Object.keys(h.d).map(k=>h.why[k]).join()),txt:document.getElementById('stHeld').textContent,by:row.by};},[B,T.d2]);
  ok('23 a day and target the Google Sheet writes is held, not added on top: the sheet’s 7 stands, the other target is placed, a plain note says why and what to do',g1.r&&g1.r.placed===1&&g1.pa==='7'&&g1.el==='1'&&g1.tn===''&&g1.held.join('|')==='sheet'&&/Ms\. A, Room 12 · .*Physical aggression 2\. Held: the Google Sheet writes this day’s number for it.*add them on the sheet.*sheet’s number for that day: Physical aggression 7/.test(g1.txt)&&g1.by==='Ms. A, Room 12',g1);
  const g2=await dd.evaluate(async([b,d2])=>{S.gs.on=false;gsUndo();renderAll();const r=await __ddStaff.collect(false);const row=()=>S.rows.find(x=>x.date===d2),pa=()=>row().values[b['Physical aggression']];
    const off1=pa(),held=S.staff.held.length;S.gs.on=true;gsApply();renderAll();const onv=pa();S.gs.on=false;gsUndo();renderAll();const off2=pa();const r2=await __ddStaff.collect(false);
    return {r,off1,held,onv,off2,again:r2&&r2.placed,off3:pa()};},[B,T.d2]);
  ok('24 with the sheet set aside the held entry is placed by itself (2, the record’s own number); the sheet back writes 7 over it; set aside again it is 2, never placed twice',g2.r&&g2.r.placed===1&&g2.off1==='2'&&g2.held===0&&g2.onv==='7'&&g2.off2==='2'&&g2.again===0&&g2.off3==='2',g2);
  await dd.evaluate(()=>{gsUndo(true);S.gs=null;renderAll();});

  /* ================= a stopped link ================= */
  await dd.evaluate(code=>document.querySelector(`#stLinks button[data-sta="stop"][data-code="${code}"]`).click(),m2.code);
  await pb.bringToFront();await pb.tap(`section.t[data-t="${B['Physical aggression']}"] [data-a="inc"]`);await pb.tap('#sdSend');await sleep(1400);
  const st1=await dd.evaluate(async([b,code])=>{const r=await __ddStaff.collect(false);const t=S.rows.find(x=>x.date===localISO(new Date()));const pa1=t.values[b['Physical aggression']];
    const txt=document.getElementById('stHeld').textContent,btn=document.querySelector('#stHeld button[data-sta="place"]');if(btn)btn.click();await new Promise(r=>setTimeout(r,200));
    return {r,pa1,txt,btn:!!btn,pa2:S.rows.find(x=>x.date===localISO(new Date())).values[b['Physical aggression']],held:S.staff.held.length,row:document.querySelector(`#stLinks tr[data-code="${code}"]`).textContent};},[B,m2.code]);
  ok('25 an entry through a stopped link is held until Place it, then placed once',st1.r&&st1.r.placed===0&&st1.pa1==='3'&&/link that was stopped/.test(st1.txt)&&st1.btn&&st1.pa2==='4'&&st1.held===0&&/stopped/.test(st1.row)&&/Resume/.test(st1.row),st1);

  /* ================= Save data, a fresh form, Open ================= */
  const own=await dd.evaluate(()=>window.nbhBridge.ownSave());const F=JSON.parse(own);
  ok('26 Save data carries the box (id, token, both keys, the site), the links, the entries taken and the record of them',F.staff&&F.staff.box.id===m1.box.id&&F.staff.box.token===m1.box.token&&F.staff.box.priv.d===m1.box.priv.d&&F.staff.box.site===BOXURL&&F.staff.links.length===2&&F.staff.links[1].off===true&&F.staff.seen.length===5&&F.staff.got.length===5&&F.staff.log.length===5,F.staff&&{links:F.staff.links,seen:F.staff.seen.length});
  await dd.goto(W,{waitUntil:'load'});await sleep(1000);await dd.evaluate(()=>{window.confirm=()=>true;try{nbhUI.confirm=async()=>true;}catch(e){}document.querySelectorAll('section[data-panel]').forEach(s=>s.classList.toggle('hidden',s.dataset.panel!=='data'));});
  const fresh=await dd.evaluate(()=>({staff:S.staff===undefined,links:document.querySelectorAll('#stLinks tbody tr').length}));
  await dd.evaluate(t=>window.nbhBridge.ownOpen(t),own);await sleep(2600);
  const re=await dd.evaluate(b=>{const t=S.rows.find(x=>x.date===localISO(new Date()));return {id:S.staff&&S.staff.box&&S.staff.box.id,links:[...document.querySelectorAll('#stLinks tbody tr')].map(tr=>tr.dataset.code),pa:t&&t.values[b['Physical aggression']],by:t&&t.by,as:t&&t.assent,set:t&&t.setting,rows:S.rows.length};},B);
  ok('27 a fresh form has no staff part; Open brings the box, the links and the record back, and the collecting on opening places nothing twice',fresh.staff&&fresh.links===0&&re.id===m1.box.id&&re.links.length===2&&re.pa==='4'&&re.by==='Ms. A, Room 12; Mr. B, Para'&&re.as==='agreed'&&re.set==='Classroom'&&re.rows===3,{fresh,re});
  /* the caseload's hook: one more entry from Ms. A, collected unattended */
  await pg.bringToFront();await pg.fill('#sdDate',T.today);await pg.dispatchEvent('#sdDate','change');for(const id of [B['Tantrum'],B['Requesting a break'],B['On task']])await pg.tap(`section.t[data-t="${id}"] [data-a="watch"]`);
  await tap(B['Elopement'],'inc',3);await pg.tap('#sdSend');await sleep(1400);
  const hk=await dd.evaluate(async b=>{window.__asked=0;window.confirm=()=>{window.__asked++;return true;};window.alert=()=>{window.__asked++;};try{nbhUI.confirm=async()=>{window.__asked++;return true;};}catch(e){}
    const r=await window.__nbhStaffCollect();const r2=await window.__nbhStaffCollect();const t=S.rows.find(x=>x.date===localISO(new Date()));const q=document.getElementById('dlgStQr');return {r,r2,el:t.values[b['Elopement']],dlg:window.__asked+(q&&q.open?1:0)};},B);
  ok('28 window.__nbhStaffCollect, unattended: {ok, placed, err} with the new entry placed (Elopement 2 + 3), again nothing twice, no dialog',hk.r.ok===true&&hk.r.linked===true&&hk.r.placed>=1&&hk.r.err===''&&hk.el==='5'&&hk.r2.ok&&hk.r2.placed===0&&hk.dlg===0,hk);
  await dd.evaluate(()=>{try{nbhUI.confirm=async()=>true;}catch(e){}window.confirm=()=>true;});
  /* Remove the collected entries from the site */
  await dd.evaluate(()=>document.getElementById('stPurge').click());await sleep(900);
  const pr=await dd.evaluate(b=>({line:document.getElementById('stLine').textContent,el:S.rows.find(x=>x.date===localISO(new Date())).values[b['Elopement']],dis:document.getElementById('stPurge').disabled}),B);
  const left=fs.readdirSync(data+'/'+m1.box.id).filter(f=>/^r-/.test(f));
  ok('29 Remove the collected entries from the site: the site holds none, the record keeps them',left.length===0&&/6 entries removed from the site; they stay in this file/.test(pr.line)&&pr.el==='5'&&pr.dis,{left,pr});
  /* the hook on a form with no links, and with the box out of reach */
  const bl=await br.newPage();const blog=[];wire(bl,blog);await bl.goto(W,{waitUntil:'load'});await sleep(800);
  const h0=await bl.evaluate(()=>window.__nbhStaffCollect());
  const h2=await dd.evaluate(async()=>{const s=S.staff.box.site;S.staff.box.site='http://127.0.0.1:9/box.php';const r=await window.__nbhStaffCollect();S.staff.box.site=s;return r;});
  ok('30 the hook on a form with no staff links says linked:false; a box out of reach gives ok:false with the reason',h0.ok===false&&h0.linked===false&&h0.placed===0&&h0.err===''&&h2.ok===false&&h2.linked===true&&/no connection to 127\.0\.0\.1:9/.test(h2.err),{h0,h2});
  /* a link cut short */
  const pc=await ph.newPage();wire(pc,plog);await pc.goto(m1.url.slice(0,m1.url.length-40),{waitUntil:'load'});await sleep(300);
  ok('31 a link cut short says it does not open',/This link does not open/.test(await pc.evaluate(()=>document.body.textContent)));
  /* the phone at 430 px */
  await pg.setViewportSize({width:430,height:932});await sleep(200);const w430=await pg.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  ok('32 at 430 px too, no sideways scroll',w430.sw<=w430.cw,w430);
  ok('33 no page errors (DD-1, the phone pages)',!errsOf(log).length&&!errsOf(plog).length&&!errsOf(blog).length,{dd:errsOf(log),ph:errsOf(plog),bl:errsOf(blog)});
  }catch(e){ok('the test ran to the end',false,String(e&&e.stack||e));}
  await br.close();php.kill();
  console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);
})();
