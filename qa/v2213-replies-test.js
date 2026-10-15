/* v22.13 the reply box against misuse (review F499, F500). Form IA-1 with a box on box.php (php -S): Ms. Rivera answers
   through her own link and is placed; a second answer through her link, and an answer signed by someone else through Mr.
   Okafor's link, are held with when they came and placed only when the BCBA keeps them; a reply the form cannot open (junk)
   is counted, said, and taken out of the box so junk cannot fill it. The invitation says a personal link is not to be
   forwarded (English and Spanish). Simulated names only.   Needs php on the PATH.   usage: node qa/v2213-replies-test.js */
const {chromium,fs,path,ROOT,BASE,wire,sleep}=require(__dirname+'/lib.js');
const {spawn}=require('child_process');
const OUT=__dirname+'/out/v2213';fs.mkdirSync(OUT,{recursive:true});
const URL=BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html';
const PORT=+(process.env.V2213_PORT||8136),BOXURL='http://127.0.0.1:'+PORT+'/box.php';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const FAST=Array.from({length:16},(_,i)=>(i+1)+'. Simulated FAST item '+(i+1)+' about the student and the problem behavior');
(async()=>{
  const data=OUT+'/data';fs.rmSync(data,{recursive:true,force:true});fs.mkdirSync(data,{recursive:true});
  const php=spawn('php',['-S','127.0.0.1:'+PORT,'-t',path.join(ROOT,'tools/reply-box/public_html/reply')],{env:Object.assign({},process.env,{NBH_REPLY_DATA:data}),stdio:['ignore','ignore','pipe']});
  let up=false;for(let i=0;i<40&&!up;i++){await sleep(250);try{const r=await fetch(BOXURL+'?a=ping');up=(await r.json()).ok;}catch(e){}}
  if(!up){console.log('FAIL box.php did not start on '+PORT);process.exit(1);}
  const br=await chromium.launch();const log=[];
  try{
  const ctx=await br.newContext({viewport:{width:1300,height:900}});const page=await ctx.newPage();wire(page,log);await page.goto(URL);await sleep(900);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};try{localStorage.removeItem('nbh.ia1.respondent');}catch(e){}});
  const set=(n,v)=>page.evaluate(([n,v])=>{const el=document.querySelector('[name="'+n+'"]');if(!el)return;el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));},[n,v]);
  const view=async v=>{await page.evaluate(v=>document.querySelector('#viewSeg button[data-view="'+v+'"]').click(),v);await sleep(300);};
  await view('setup');
  await set('m.client','Mateo Rivera');await set('m.sid','4471823');await set('m.email','simulated.bcba@palmbeachschools.org');await set('m.assessor','Simulated BCBA');await set('rp.w.fast',FAST.join('\n'));
  await set('m.beh','Hitting');await set('m.def','Forceful contact of a hand with a peer.');
  await set('inf[0].name','Ms. Rivera');await set('inf[0].email','rivera@example.org');await set('inf[1].name','Mr. Okafor');await set('inf[1].email','okafor@example.org');
  await page.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(200);
  await page.evaluate(u=>{const e=document.querySelector('#rpBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);await sleep(900);
  await page.evaluate(()=>document.querySelector('#rpDlg').close());
  const box=await page.evaluate(()=>__rp.box());
  await view('outs');await page.evaluate(()=>document.querySelector('#outPlanBtn').click());await sleep(300);
  const links=await page.evaluate(()=>{const f=c=>__rp.outs().find(o=>o.inst==='fast'&&o.inf===c);const a=f('A'),b=f('B');return {a:a&&__rp.personLink(a).url,b:b&&__rp.personLink(b).url,ida:a&&a.id,idb:b&&b.id};});
  ok('1 the box is registered and each informant has a personal link carrying the send-out row',!!box&&!!box.id&&!!links.a&&!!links.b&&links.a!==links.b,{box:!!box,links:!!links.a});
  /* the answers, from the respondent page */
  const rp=await ctx.newPage();const rlog=[];wire(rp,rlog);
  const answer=async(url,name,pat)=>{await rp.goto(url);await sleep(400);
    await rp.evaluate(([name,pat])=>{const inp=document.querySelectorAll('input[type=text]');inp[0].value=name;inp[1].value='Teacher';inp[2].value='14';const s=document.querySelector('select');if(s)s.value='Yes';if(inp[3])inp[3].value='Classroom';
      document.querySelectorAll('li.it').forEach((li,i)=>{const r=li.querySelector('input[value="'+pat[i%pat.length]+'"]');if(r)r.click();});const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();},[name,pat]);
    await rp.evaluate(()=>document.querySelector('button:not(.ghost)').click());await sleep(1500);
    return rp.evaluate(()=>/Sent\./.test(document.querySelector('.done').innerHTML));};
  const s1=await answer(links.a,'Ms. Rivera',['Y','N']);
  const s2=await answer(links.a,'Ms. Rivera',['N']);
  const s3=await answer(links.b,'Ms. Chen',['Y']);
  const junk=await (await fetch(BOXURL+'?a=put&b='+box.id,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({v:1,k:{x:'A'.repeat(43),y:'B'.repeat(43)},iv:'A'.repeat(16),ct:'C'.repeat(64)})})).json();
  const onSite=()=>fs.readdirSync(path.join(data,box.id)).filter(f=>/^r-/.test(f));
  ok('2 three answers sent through the two links, and one junk reply put in the box',s1&&s2&&s3&&!!junk.id&&onSite().length===4,{s1,s2,s3,junk,n:onSite().length});
  const c=await page.evaluate(async()=>{const r=await __rp.collect(false);const v=n=>document.querySelector('[name="'+n+'"]').value;
    return {r,held:__rp.box().held.map(h=>h.why+':'+(h.name||'')+':'+(h.sentTo||'')+':'+(h.at?'at':'')),a1:v('fast[0][1]'),b1:v('fast[1][1]'),banner:document.querySelector('#gfBanner').textContent,
      text:document.querySelector('#outHeld').textContent,keep:[...document.querySelectorAll('#outHeld [data-hadd]')].map(b=>b.textContent)};});
  ok('3 Collect places only Ms. Rivera\'s first answer, in her own column; nothing goes into Mr. Okafor\'s column',c.r&&c.r.placed===1&&c.a1==='Y'&&c.b1==='',c);
  ok('4 the second answer through Ms. Rivera\'s link and the one signed Ms. Chen through Mr. Okafor\'s link are held, each with when it came',c.r&&c.r.held===2&&c.held.indexOf('again:Ms. Rivera:Ms. Rivera:at')>=0&&c.held.indexOf('name:Ms. Chen:Mr. Okafor:at')>=0,c.held);
  ok('5 the held replies say why (a second reply; the link may have been passed on) and offer Keep and place it or Discard',/a second reply through the link sent to Ms\. Rivera/.test(c.text)&&/made for Mr\. Okafor but is signed Ms\. Chen: the link may have been passed on/.test(c.text)&&/It came \d{4}-\d\d-\d\d/.test(c.text)&&c.keep.filter(t=>t==='Keep and place it').length===2,{text:c.text.slice(0,400),keep:c.keep});
  ok('6 the junk reply is counted, said, and taken out of the box at once (three replies left on the site)',c.r&&c.r.unread===1&&c.r.removed===1&&/could not be opened \(not locked for this box\) and was removed from the box/.test(c.banner)&&onSite().length===3,{r:c.r,banner:c.banner,n:onSite().length});
  /* the BCBA keeps the one signed Ms. Chen (it was handed on by Mr. Okafor) and discards the second from Ms. Rivera's link */
  const k=await page.evaluate(()=>{const H=()=>__rp.box().held;const iName=H().findIndex(h=>h.why==='name'),iAgain=H().findIndex(h=>h.why==='again');
    document.querySelector('#outHeld [data-hadd="'+iName+'"]').click();const j=H().findIndex(h=>h.why==='again');document.querySelector('#outHeld [data-hdrop="'+j+'"]').click();
    const v=n=>document.querySelector('[name="'+n+'"]').value;return {held:H().length,a1:v('fast[0][1]'),names:[0,1,2].map(i=>v('inf['+i+'].name')),cols:[0,1,2].map(i=>v('fast['+i+'][1]'))};});
  ok('7 kept, Ms. Chen\'s answers are placed in a column of her own; discarded, the second reply is gone; Ms. Rivera\'s answers are unchanged',k.held===0&&k.a1==='Y'&&k.cols.filter(x=>x==='Y').length===2&&k.names.indexOf('Ms. Chen')>=0,k);
  const again=await page.evaluate(async()=>{const r=await __rp.collect(false);return {r,line:document.querySelector('#outBoxLine').textContent};});
  ok('8 collecting again takes nothing twice and the junk does not come back',again.r&&again.r.placed===0&&again.r.fresh===0&&again.r.unread===0,again);
  /* the invitation */
  const inv=await page.evaluate(()=>{const en=NBH_RESPOND.personMail({to:'rivera@example.org',name:'Ms. Rivera',items:[{title:'FAST',url:'https://example.org/respond.html#x',boxed:true}]}),
      es=NBH_RESPOND.personMail({lang:'es',to:'r@example.org',name:'Sra. Rivera',items:[{title:'FAST',url:'https://example.org/respond.html#x',boxed:true}]});return {en:en.text,eh:en.html,es:es.text};});
  ok('9 the invitation says the link is for that person only and not to be forwarded, in English and Spanish, in the text and the page',/This link is for you only: please do not forward it/.test(inv.en)&&/This link is for you only/.test(inv.eh)&&/Este enlace es solo para usted: por favor no lo reenvíe/.test(inv.es),inv.en.slice(0,400));
  /* ---- the same in a form on the shared kit (CF-1; SV-1 and IN-1 use the same code) ---- */
  const cf=await ctx.newPage();wire(cf,log);await cf.goto(BASE+'/NBH-Workstation/'+encodeURI(fs.readdirSync(path.join(ROOT,'NBH-Workstation')).find(f=>f.startsWith('CF-1_'))));await sleep(900);
  await cf.evaluate(()=>{window.confirm=()=>true;const set=(n,v)=>{const e=document.querySelector('[data-m="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('client','Mateo Rivera');set('sid','4471823');set('bcba','Simulated BCBA');set('email','simulated.bcba@palmbeachschools.org');
    S.raters[0].name='Ms. Lopez';S.raters[0].role='Classroom teacher';S.raters[1].name='Mr. Okafor';S.raters[1].role='Paraprofessional';renderAll();});
  await cf.evaluate(()=>document.querySelector('#rpBtn').click());await sleep(300);
  await cf.evaluate(u=>{const e=document.querySelector('#rbBox');e.value=u;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},BOXURL);await sleep(900);
  await cf.evaluate(()=>document.querySelector('#rbFromSheet').click());await sleep(200);
  const cl=await cf.evaluate(()=>{const k=__rp.kit;return {box:k.rb().box&&k.rb().box.id,links:k.rb().sends.map(s=>k.personLink(s))};});
  await cf.evaluate(()=>document.querySelector('#rpDlg').close());
  const cfAnswer=async(url,name)=>{await rp.goto(url);await sleep(500);
    await rp.evaluate(name=>{const n=document.querySelector('input[type=text]');n.readOnly=false;n.value=name;n.dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelectorAll('li.it').forEach(li=>{const r=li.querySelector('input[value="5"]')||li.querySelector('input[type=radio]');if(r)r.click();});
      const c=document.querySelector('input[name=nbhr-confirm][value=yes]');if(c)c.click();document.querySelector('button:not(.ghost)').click();},name);await sleep(1500);
    return rp.evaluate(()=>/Sent\./.test((document.querySelector('#nbhr-done')||document.querySelector('.done')||{}).innerHTML||''));};
  const t1=await cfAnswer(cl.links[0],'Ms. Lopez'),t2=await cfAnswer(cl.links[0],'Ms. Lopez'),t3=await cfAnswer(cl.links[1],'Ms. Chen');
  await fetch(BOXURL+'?a=put&b='+cl.box,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({v:1,k:{x:'A'.repeat(43),y:'B'.repeat(43)},iv:'A'.repeat(16),ct:'C'.repeat(64)})});
  const cc=await cf.evaluate(async()=>{const r=await __rp.kit.collect(false);document.querySelector('#rcBtn').click();await new Promise(z=>setTimeout(z,150));
    return {r,held:__rp.kit.rb().box.held.map(h=>h.why+':'+(h.name||'')+':'+(h.sentTo||'')),text:document.querySelector('#rbHeld').textContent,keep:document.querySelectorAll('#rbHeld [data-hkeep]').length,raters:S.raters.map(x=>x.name),line:document.querySelector('#rbCollectLine').textContent};});
  ok('11 CF-1 (the shared kit): the three answers sent; Ms. Lopez placed once; her second reply and the one signed Ms. Chen through Mr. Okafor\'s link held, with Keep and place it',t1&&t2&&t3&&cc.r&&cc.r.placed===1&&cc.r.held===2&&cc.held.indexOf('again:Ms. Lopez:Ms. Lopez')>=0&&cc.held.indexOf('name:Ms. Chen:Mr. Okafor')>=0&&cc.keep===2&&/passed on/.test(cc.text),{t:[t1,t2,t3],cc});
  ok('12 CF-1: the junk reply is said and taken out of the box',cc.r&&cc.r.junk===1&&cc.r.removed===1&&/removed from the box/.test(cc.line)&&fs.readdirSync(path.join(data,cl.box)).filter(f=>/^r-/.test(f)).length===3,{r:cc.r,line:cc.line});
  const ck=await cf.evaluate(()=>{const H=()=>__rp.kit.rb().box.held;const i=H().findIndex(h=>h.why==='name');document.querySelector('#rbHeld [data-hkeep="'+i+'"]').click();
    const j=H().findIndex(h=>h.why==='again');document.querySelector('#rbHeld [data-hdrop="'+j+'"]').click();return {held:H().length,raters:S.raters.map(x=>x.name)};});
  ok('13 CF-1: kept, Ms. Chen gets a column of her own; discarded, the second reply is gone',ck.held===0&&ck.raters.indexOf('Ms. Chen')>=0&&ck.raters.filter(x=>x==='Ms. Lopez').length===1,ck);
  ok('10 no page errors',!log.length&&!rlog.length,log.concat(rlog));
  }catch(e){ok('crashed',false,String(e.stack||e));}
  await br.close();php.kill();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
