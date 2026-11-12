/* v25.88 (the BCBA, 11/11, with pictures of a bank card that has 60 versions in one sideways row: "can this be designed
   better?") Form TD-1, Versions from the studies, as a list.
   A  the card with the most versions: a row a study, the list scrolls down and never sideways, about six rows in view;
      every row shows the whole line of what is special (nothing cut with dots), the ages and the function; "started here"
      sits whole inside its row; the row of the card opened is in view.
   B  Find: words narrow the rows (every word, in the study, the title, the behavior, the ages or the function), the count
      says how many of how many, the card opened stays, the box keeps the keyboard and its words; emptied, all come back.
   C  Newest first turns the order round, and back.
   D  before another study is picked there are no dead buttons, only the hint; after a pick: Side by side, Start from this
      version and Back to the study it started from, which goes back.
   E  a component with 8 versions or fewer has no Find box; opening a card of another component empties the words.
   F  the arrow keys move along the rows (Down and Up, as well as Right and Left).
   G  on a phone the row stacks in one column and nothing runs off the side.
   usage: WS_URL=http://127.0.0.1:8193 node qa/v2588-td1-versions-list-test.js */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const URL=(process.env.WS_URL||'http://127.0.0.1:8123')+'/NBH-Workstation/';const DIR=path.join(__dirname,'..','NBH-Workstation');
const TD=fs.readdirSync(DIR).find(f=>f.startsWith('TD-1_'));
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();const errs=[];
 try{
  const open=async(w,h)=>{const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
   await p.goto(URL+TD);await p.waitForFunction(()=>window.__tdBank&&window.__tdLibOf,null,{timeout:60000});await sleep(700);
   await p.evaluate(()=>{const x=document.querySelector('#viewSeg button[data-view="build"]');if(x)x.click();});await sleep(300);return p;};
  const p=await open(1180,820);
  /* the component with the most versions, its oldest-but-not-first card; and a component with 3 to 8 */
  const pick=await p.evaluate(()=>{const P=TD1_BANK.protocols.filter(x=>window.__tdLibOf(x.code)),by={};P.forEach(x=>{(by[x.code]=by[x.code]||[]).push(x);});
    const codes=Object.keys(by).sort((a,c)=>by[c].length-by[a].length),big=by[codes[0]],small=codes.map(c=>by[c]).find(v=>v.length>=3&&v.length<=8);
    return {n:big.length,id:big[Math.floor(big.length/3)].id,small:small?small[0].id:null,smallN:small?small.length:0};});
  const D='document.getElementById("tdBankHost").shadowRoot.querySelector(".detail")';
  const det=(f,a)=>p.evaluate(new Function('a','return ('+f+')('+D+',a)'),a);
  await p.evaluate(id=>window.__tdBank.show(id),pick.id);await sleep(500);
  let r=await det(d=>{const ul=d.querySelector('.vchips'),rows=[...ul.querySelectorAll('.vchip')],u=ul.getBoundingClientRect(),cur=ul.querySelector('.vchip[aria-current="true"]'),c=cur.getBoundingClientRect(),tag=cur.querySelector('.vbh').getBoundingClientRect();
    return {n:rows.length,side:ul.scrollWidth-ul.clientWidth,down:ul.scrollHeight-ul.clientHeight,h:Math.round(u.height),
      cut:rows.filter(x=>{const s=x.querySelector('.vs');return s.scrollWidth>s.clientWidth+1||getComputedStyle(s).textOverflow==='ellipsis'||getComputedStyle(s).whiteSpace==='nowrap';}).length,
      meta:rows.every(x=>/\S/.test(x.querySelector('.vm').textContent)),oneCol:rows.every(x=>{const a=x.getBoundingClientRect();return a.left>=u.left-1&&a.right<=u.right+1;}),
      tagIn:tag.left>=c.left&&tag.right<=c.right&&tag.width>60&&/^started here$/.test(cur.querySelector('.vbh').textContent),curIn:c.top>=u.top-1&&c.bottom<=u.bottom+1,
      inView:rows.filter(x=>{const a=x.getBoundingClientRect();return a.top>=u.top-1&&a.bottom<=u.bottom+1;}).length,minH:Math.min(...rows.map(x=>x.getBoundingClientRect().height)),cnt:d.querySelector('.vcnt').textContent};});
  ok('A '+pick.n+' versions: a row each, the list scrolls down and not sideways, three or more whole rows in view, each 44 px or taller',pick.n>=40&&r.n===pick.n&&r.side<=1&&r.down>200&&r.h<=300&&r.inView>=3&&r.minH>=44&&r.oneCol,r);
  ok('A every row shows its whole line (none cut with dots), its ages and function; the count says '+pick.n+' studies, oldest first',r.cut===0&&r.meta&&r.cnt===pick.n+' studies, oldest first',r);
  ok('A "started here" sits whole inside its row, and that row is in view',r.tagIn&&r.curIn,r);
  /* B Find */
  const word=await det((d,id)=>{const by={};TD1_BANK.protocols.forEach(x=>by[x.id]=x);const w=(by[id].lab.toLowerCase().match(/[a-z]{5,}/g)||[]);return w[w.length-1];},pick.id);
  await p.evaluate(()=>{document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vfq').focus();});
  await p.keyboard.type('zzqx');await sleep(150);
  r=await det((d,id)=>({ids:[...d.querySelectorAll('.vchip')].map(x=>x.dataset.v),cnt:d.querySelector('.vcnt').textContent,foc:(d.getRootNode().activeElement||{}).className,val:d.querySelector('.vfq').value}),pick.id);
  ok('B words no version has: only the card opened stays, the count says 1 of '+pick.n+' shown, the box keeps the keyboard and its words',r.ids.length===1&&r.ids[0]===pick.id&&r.cnt==='1 of '+pick.n+' shown, oldest first'&&r.foc==='vfq'&&r.val==='zzqx',r);
  for(let i=0;i<4;i++)await p.keyboard.press('Backspace');await p.keyboard.type(word+' 20');await sleep(150);
  r=await det((d,a)=>{const by={};TD1_BANK.protocols.forEach(x=>by[x.id]=x);const rows=[...d.querySelectorAll('.vchip')];
    return {n:rows.length,all:rows.filter(x=>x.dataset.v!==a.id).every(x=>{const t=x.textContent.toLowerCase()+' '+(by[x.dataset.v].beh||'').toLowerCase();return t.includes(a.word)&&t.includes('20');}),cnt:d.querySelector('.vcnt').textContent,foc:(d.getRootNode().activeElement||{}).className};},{id:pick.id,word});
  ok('B two words ("'+word+' 20"): fewer rows, each with both words, the count follows',r.n>=1&&r.n<pick.n&&r.all&&r.cnt===r.n+' of '+pick.n+' shown, oldest first'&&r.foc==='vfq',r);
  await p.evaluate(()=>{const q=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vfq');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(120);
  r=await det(d=>({n:d.querySelectorAll('.vchip').length,cnt:d.querySelector('.vcnt').textContent}));
  ok('B emptied: all the rows come back',r.n===pick.n&&/ studies, oldest first$/.test(r.cnt),r);
  /* C the order */
  const years=()=>det(d=>{const by={};TD1_BANK.protocols.forEach(x=>by[x.id]=x);return {y:[...d.querySelectorAll('.vchip')].map(x=>{const m=/\b(1[89]\d\d|20\d\d)/.exec(x.querySelector('.vc').textContent);return m?+m[1]:0;}),b:d.querySelector('.vord').textContent,cnt:d.querySelector('.vcnt').textContent,foc:(d.getRootNode().activeElement||{}).className};});
  const y0=await years();await det(d=>d.querySelector('.vord').click());await sleep(200);const y1=await years();
  ok('C Newest first turns the order round; the count line and the button say so; the button keeps the keyboard',y0.b==='Newest first'&&y1.b==='Oldest first'&&/newest first$/.test(y1.cnt)&&JSON.stringify(y1.y)===JSON.stringify(y0.y.slice().reverse())&&y1.y[0]>=y1.y[y1.y.length-1]&&y1.foc==='vord',{y0:y0.y.slice(0,5),y1:y1.y.slice(0,5),b:y1.b,cnt:y1.cnt,foc:y1.foc});
  await det(d=>d.querySelector('.vord').click());await sleep(200);
  /* D the buttons */
  r=await det(d=>{const v=x=>{const e=d.querySelector(x);return !!e&&e.getBoundingClientRect().height>0;};return {sbs:v('.vsbs'),re:v('.vre'),back:v('.vback'),note:(d.querySelector('.vnote')||{}).textContent,dis:[d.querySelector('.vsbs').disabled,d.querySelector('.vre').disabled]};});
  ok('D before a pick: no Side by side, no Start, no Back in view; the hint says to tap a study',!r.sbs&&!r.re&&!r.back&&r.dis[0]&&r.dis[1]&&r.note==='Tap a study to compare it with this one.',r);
  const other=await det((d,id)=>[...d.querySelectorAll('.vchip')].map(x=>x.dataset.v).find(v=>v!==id),pick.id);
  await det((d,v)=>d.querySelector('.vchip[data-v="'+v+'"]').click(),other);await sleep(300);
  r=await det(d=>{const v=x=>{const e=d.querySelector(x);return !!e&&e.getBoundingClientRect().height>=44;};return {sbs:v('.vsbs'),re:v('.vre'),back:v('.vback'),bt:(d.querySelector('.vback')||{}).textContent,dis:[d.querySelector('.vsbs').disabled,d.querySelector('.vre').disabled],cur:d.querySelector('.vchip[aria-current="true"]').dataset.v,head:d.querySelector('.vdiff .vh').textContent};});
  const baseCite=await p.evaluate(id=>{const s=window.__tdBank.state?window.__tdBank.state():null;return s&&s.base;},pick.id);
  ok('D after a pick: Side by side, Start from this version and Back to the study it started from, each 44 px tall; What’s different below',r.sbs&&r.re&&r.back&&!r.dis[0]&&!r.dis[1]&&/^Back to .+\d{4}/.test(r.bt)&&r.cur===other&&/^What’s different/.test(r.head)&&baseCite===pick.id,{r,baseCite});
  await det(d=>d.querySelector('.vback').click());await sleep(300);
  r=await det(d=>({cur:d.querySelector('.vchip[aria-current="true"]').dataset.v,back:!!d.querySelector('.vback'),head:d.querySelector('.vdiff .vh').textContent}));
  ok('D Back shows the study it started from again',r.cur===pick.id&&!r.back&&r.head==='This version at a glance',r);
  /* F the keys */
  r=await det(d=>{const rows=[...d.querySelectorAll('.vchip')];rows[0].focus();const k=key=>rows.find(x=>x===d.getRootNode().activeElement).dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,composed:true}));
    k('ArrowDown');const a=rows.indexOf(d.getRootNode().activeElement);k('ArrowRight');const c=rows.indexOf(d.getRootNode().activeElement);k('ArrowUp');const e=rows.indexOf(d.getRootNode().activeElement);k('ArrowLeft');return [a,c,e,rows.indexOf(d.getRootNode().activeElement)];});
  ok('F Down and Right move to the next row, Up and Left to the one before',r.join()==='1,2,1,0',r);
  /* E a small component, and the words emptied on another component */
  await p.evaluate(()=>{const q=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .vfq');q.value='zzqx';q.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(100);
  if(pick.small){await p.evaluate(id=>window.__tdBank.show(id),pick.small);await sleep(400);
   r=await det(d=>({n:d.querySelectorAll('.vchip').length,find:!!d.querySelector('.vfq'),ord:!!d.querySelector('.vord'),cnt:d.querySelector('.vcnt').textContent}));
   ok('E a component with '+pick.smallN+' versions: all its rows, no Find box',r.n===pick.smallN&&!r.find&&!r.ord&&r.cnt===pick.smallN+' studies, oldest first',r);}
  else ok('E a component with 3 to 8 versions exists in the bank',false);
  await p.evaluate(id=>window.__tdBank.show(id),pick.id);await sleep(400);
  r=await det(d=>({n:d.querySelectorAll('.vchip').length,val:d.querySelector('.vfq').value}));
  ok('E opened again from the list: the words are emptied and all the rows are back',r.n===pick.n&&r.val==='',r);
  await p.close();
  /* G a phone */
  const q=await open(430,900);await q.evaluate(id=>window.__tdBank.show(id),pick.id);await sleep(500);
  r=await q.evaluate(()=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail'),ul=d.querySelector('.vchips'),x=ul.querySelector('.vchip[aria-current="true"]'),c=x.querySelector('.vc').getBoundingClientRect(),s=x.querySelector('.vs').getBoundingClientRect(),m=x.querySelector('.vm').getBoundingClientRect();
    return {stack:s.top>=c.bottom-2&&m.top>=s.bottom-2&&Math.abs(s.left-c.left)<2&&Math.abs(m.left-c.left)<2,side:ul.scrollWidth-ul.clientWidth,page:document.documentElement.scrollWidth-window.innerWidth,find:d.querySelector('.vfq').getBoundingClientRect().height};});
  ok('G a phone (430 px): the study, its line and its ages stack in one column; nothing runs off the side; the Find box is 44 px tall',r.stack&&r.side<=1&&r.page<=1&&r.find>=44,r);
  await q.close();
  ok('Z no page error',!errs.length,errs);
 }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,900));}
 await b.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exit(fails?1:0);})();
