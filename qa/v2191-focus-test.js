/* v21.91 focus mode: one part of a form at a time. For every form and every one of its views, with Focus on: no page errors;
   exactly one part open and the folded ones out of sight; every field on screen inside the open part; Next walks through
   every part to fill in and Back comes back; a value typed then Next shows in that part's folded line; Enter moves to the
   next field (and from a part's last one-line field to the next part); the print media lays out exactly as with Focus off;
   turning Focus off leaves no mark, attribute or element behind. Then the workstation: the crumb's Focus button and the
   command box, the setting told to open forms and to forms opened later and kept on the device, the form's Whole page
   button, the master print's copy unchanged by Focus, a tap on an iPad; a phone, an iPad upright and a laptop: no sideways
   scroll and 44 px targets. Chromium with iPad and iPhone user agents and touch. Simulated student only.
   usage: node qa/v2191-focus-test.js [form-id regex]    (WS_URL=http://127.0.0.1:8126 for a worktree's server) */
const {chromium,BASE,sleep,forms}=require(__dirname+'/lib.js');
let fails=0,checks=0;const ok=(n,c,i)=>{checks++;console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const FILT=process.argv[2]?new RegExp(process.argv[2]):null;
const ALLF=forms().filter(f=>!FILT||FILT.test(f.id));
const url=f=>BASE+'/NBH-Workstation/'+encodeURI(f);
/* in the page: the views, a click on one, what Focus shows */
const views=p=>p.$$eval('#viewSeg button[data-view]',b=>b.filter(x=>!x.disabled&&!x.hidden&&x.getClientRects().length).map(x=>x.dataset.view));
const view=(p,v)=>p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);
async function state(p){return p.evaluate(()=>{
  const F=nbhUI.focus,u=F.units(),cur=F.cur();
  const open=new Set([...document.querySelectorAll('[data-nbh-fx="c"],[data-nbh-fx="hc"]')].map(e=>e.getAttribute('data-nbh-fx-u')));
  const foldSeen=[...document.querySelectorAll('[data-nbh-fx="f"]')].filter(e=>e.getClientRects().length).length;
  const pinned=e=>{for(let a=e;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a).position;if(s==='fixed'||s==='sticky')return true;}return false;};
  const seen=[...document.querySelectorAll('input,select,textarea')].filter(f=>!/^(hidden|file|button|submit|reset|image)$/i.test(f.type)&&f.getClientRects().length&&!f.closest('.toolbar,dialog,#nbhFxBar,.nbh-mast')&&!pinned(f));
  const loose=seen.filter(f=>{const h=f.closest('[data-nbh-fx-u]');return !h||+h.getAttribute('data-nbh-fx-u')!==cur;}).map(f=>f.id||f.name||f.className||f.tagName);
  const bar=document.getElementById('nbhFxBar');
  return {u,cur,open:[...open],foldSeen,loose:loose.slice(0,5),nloose:loose.length,bar:!!(bar&&bar.getClientRects().length),
    sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth};});}
/* the page as paper lays it out: every box's place and size */
async function printSig(p){
  await p.emulateMedia({media:'print'});await sleep(200);
  const s=await p.evaluate(()=>{let h=5381,n=0;const all=document.body.getElementsByTagName('*');
    for(const e of all){if(e.closest('#nbhToasts,#nbhFxBar,#nbhFxRing'))continue;const r=e.getClientRects();if(!r.length)continue;const b=e.getBoundingClientRect();
      const t=e.tagName+':'+Math.round(b.top+scrollY)+':'+Math.round(b.left+scrollX)+':'+Math.round(b.width)+':'+Math.round(b.height);n++;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;}
    return {n,h:(h>>>0).toString(36),H:document.documentElement.scrollHeight};});
  await p.emulateMedia({media:'screen'});await sleep(200);return s;}
/* every element and its attributes (what Focus off must give back exactly). Left out: inline styles and the insides of drawings,
   which the forms set to fit the room they have (a sticky bar's offset, a walkthrough's picture; Focus writes neither, and the
   page's own element is checked on its own below), the accessible names a form adds as it goes, and the progress dots */
const snap=p=>p.evaluate(()=>{const out=[];for(const e of document.documentElement.getElementsByTagName('*')){if(e.closest('#nbhToasts')||(e.matches('body > a[download]')))continue;   /* a file being saved: there for a moment */
  if(e.ownerSVGElement){out.push(e.tagName);continue;}
  const a=[...e.attributes].filter(x=>!(e===document.documentElement&&x.name==='class')&&x.name!=='style'&&!(e.closest('#viewSeg')&&/^(data-nbh-fill|title)$/.test(x.name))&&!/^(aria-label|role)$/.test(x.name)).map(x=>x.name+'='+(x.name==='class'?x.value.trim().split(/\s+/).join(' '):x.value)).sort().join(' ');
  out.push(e.tagName+'['+a+']');}return out;});
const traces=p=>p.evaluate(()=>({attrs:[...document.querySelectorAll('*')].filter(e=>[...e.attributes].some(a=>/^data-nbh-fx/.test(a.name))).length,
  els:!!document.querySelector('#nbhFxBar,#nbhFxRing,#nbh-fx-css'),html:document.documentElement.hasAttribute('data-nbh-fx')||/--nbh-fx/.test(document.documentElement.getAttribute('style')||'')}));

async function formSweep(br){
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:false,userAgent:IPAD,serviceWorkers:'block',deviceScaleFactor:1});
  let typedOk=0,typedTried=0,enterOk=0,enterTried=0,lastOk=0,lastTried=0;const enterBad=[];
  for(const f of ALLF){
    const p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
    try{
      await p.goto(url(f.file));await p.waitForFunction(()=>window.nbhUI&&nbhUI.focus,null,{timeout:20000});await sleep(900);
      await p.evaluate(()=>{window.confirm=()=>true;try{localStorage.removeItem('nbh.focus');}catch(e){}if(nbhUI.focus.on())nbhUI.focus.set(false);});
      const vs=await views(p);const off={};
      /* Focus off: each view once, its paper layout */
      const offW={};for(const v of vs){await view(p,v);await sleep(350);off[v]=await printSig(p);offW[v]=await p.evaluate(()=>document.documentElement.scrollWidth);}
      /* what a form fits to the window (a sticky bar's offset, a walkthrough's picture) is fitted afresh before the first look, as
         Focus has it fitted again when it is turned off */
      await view(p,vs[0]);await sleep(300);await p.evaluate(()=>window.dispatchEvent(new Event('resize')));await sleep(500);const S0=await snap(p);
      /* Focus on */
      await p.evaluate(()=>nbhUI.focus.set(true));await sleep(500);
      const bad=[];let walked=0,parts=0;
      for(const v of vs){
        await view(p,v);await sleep(450);
        let pr=await printSig(p);await sleep(150);
        /* a page still drawing itself (a graph, a list filled in late) is measured again, with Focus off and on in turn */
        if(pr.h!==off[v].h||pr.n!==off[v].n){await sleep(700);await p.evaluate(()=>nbhUI.focus.set(false));await sleep(400);const o2=await printSig(p);
          await p.evaluate(()=>nbhUI.focus.set(true));await sleep(500);pr=await printSig(p);
          if(pr.h!==o2.h||pr.n!==o2.n)bad.push(v+': the print media differs from Focus off '+JSON.stringify([off[v],o2,pr]));}
        let st=await state(p);parts+=st.u.length;
        if(st.u.length){
          if(st.open.length!==1||+st.open[0]!==st.cur)bad.push(v+': '+st.open.length+' parts open (cur '+st.cur+')');
          if(st.foldSeen)bad.push(v+': '+st.foldSeen+' folded elements still on screen');
          if(st.nloose)bad.push(v+': '+st.nloose+' fields on screen outside the open part '+st.loose.join(','));
          if(!st.bar)bad.push(v+': no bar at the foot');
          if(st.sw>Math.max(st.cw,offW[v])+1)bad.push(v+': Focus makes the page scroll sideways '+st.sw+'>'+Math.max(st.cw,offW[v]));
          /* Next through every part to fill in, Back to the first */
          const seq=st.u.filter(x=>x.step).map(x=>x.i);
          if(seq.length){
            await p.evaluate(i=>nbhUI.focus.go(i),seq[0]);await sleep(60);
            const got=[await p.evaluate(()=>nbhUI.focus.cur())];
            for(let k=1;k<seq.length;k++){await p.evaluate(()=>nbhUI.focus.next());await sleep(40);got.push(await p.evaluate(()=>nbhUI.focus.cur()));}
            if(got.join()!==seq.join())bad.push(v+': Next went '+got.join()+' not '+seq.join());
            const back=[];for(let k=1;k<seq.length;k++){await p.evaluate(()=>nbhUI.focus.back());await sleep(40);back.push(await p.evaluate(()=>nbhUI.focus.cur()));}
            if(back.join()!==seq.slice(0,-1).reverse().join())bad.push(v+': Back went '+back.join());
            walked+=seq.length;
            st=await state(p);if(st.open.length!==1)bad.push(v+': after the walk '+st.open.length+' parts open');if(st.nloose)bad.push(v+': after the walk '+st.nloose+' fields outside the open part');
          }
          /* Enter: the next field of the part */
          const ent=await p.evaluate(()=>{const F=nbhUI.focus,u=F.units();const line=/^(text|search|email|tel|url|number|)$/i;
            for(const x of u){if(!x.step||x.nf)continue;F.go(x.i);const els=[...document.querySelectorAll('[data-nbh-fx-u="'+x.i+'"]')];
              const fl=[];els.forEach(e=>{(e.matches('input,select,textarea')?[e]:[...e.querySelectorAll('input,select,textarea')]).forEach(q=>{if(!/^(hidden|file|button|submit|reset|image)$/i.test(q.type)&&!q.disabled&&!q.readOnly&&q.getClientRects().length&&!q.closest('.toolbar,dialog'))fl.push(q);});});
              /* a box the form will not let take the cursor (it hands it back) is no test of Enter */
              const takes=q=>{try{q.focus({preventScroll:true});}catch(e){}const t=document.activeElement===q;try{q.blur();}catch(e){}return t;};
              const k=fl.findIndex((q,j)=>j<fl.length-1&&q.tagName==='INPUT'&&line.test(q.type)&&takes(fl[j+1]));if(k<0)continue;
              fl[k].setAttribute('data-qa-a','1');fl[k+1].setAttribute('data-qa-b','1');
              /* a form that answers Enter in that box itself (adds a row, picks an entry) keeps it (it stops the key or marks it handled): seen just before Focus's own listener */
              window.__qaOwn=true;const h=e=>{if(e.key==='Enter')window.__qaOwn=e.defaultPrevented;document.documentElement.removeEventListener('keydown',h);};document.documentElement.addEventListener('keydown',h);
              return {i:x.i};}return null;});
          if(ent){await p.focus('[data-qa-a]');await p.keyboard.press('Enter');await sleep(80);
            const moved=await p.evaluate(()=>{const a=document.activeElement,r=!!(a&&a.hasAttribute('data-qa-b'));document.querySelectorAll('[data-qa-a],[data-qa-b]').forEach(e=>{e.removeAttribute('data-qa-a');e.removeAttribute('data-qa-b');});return {r,own:window.__qaOwn};});
            if(!moved.own){enterTried++;if(moved.r)enterOk++;else{bad.push(v+': Enter did not move to the next field');enterBad.push(f.id+' '+v);}}}
        }
      }
      /* back to the first view, Focus off: nothing left behind */
      await view(p,vs[0]);await sleep(450);
      await p.evaluate(()=>nbhUI.focus.set(false));await sleep(600);
      const S1=await snap(p),tr=await traces(p);
      const cmp=(A,B)=>{if(A.length!==B.length)return 'elements '+A.length+' then '+B.length;for(let i=0;i<A.length;i++)if(A[i]!==B[i])return [A[i].slice(0,300),B[i].slice(0,300)];return null;};
      let diff=cmp(S0,S1);
      ok(f.id+': with Focus on, every view ('+vs.length+') has one part open, the folded ones out of sight, every field on screen in the open part, a bar at the foot, no sideways scroll; Next and Back walk '+walked+' parts in order ('+parts+' parts in all)',!bad.filter(b=>!/print media|Enter/.test(b)).length,bad.filter(b=>!/print media|Enter/.test(b)));
      ok(f.id+': the print media lays out every view as with Focus off',!bad.some(b=>/print media/.test(b)),bad.filter(b=>/print media/.test(b)));
      ok(f.id+': turning Focus off leaves nothing behind (every element and attribute as before; no marks, bar, ring or styles)',!diff&&!tr.attrs&&!tr.els&&!tr.html,{diff,tr});
      /* a value typed, then Next: it shows on that part's folded line; Enter in a part's last one-line field opens the next part */
      await p.evaluate(()=>nbhUI.focus.set(true));await sleep(400);
      let typed=null,last=null;
      for(const v of vs){
        if(typed&&last)break;
        await view(p,v);await sleep(400);
        if(!typed){const t=await p.evaluate(()=>{const F=nbhUI.focus,u=F.units(),sq=u.filter(x=>x.step&&!x.nf).map(x=>x.i);
            for(let k=0;k<sq.length-1;k++){F.go(sq[k]);const els=[...document.querySelectorAll('[data-nbh-fx-u="'+sq[k]+'"]')];
              for(const e of els){const c=(e.matches('input,textarea')?[e]:[...e.querySelectorAll('input,textarea')]).find(q=>(q.tagName==='TEXTAREA'||/^(text|search|)$/i.test(q.type))&&!q.disabled&&!q.readOnly&&!q.value&&q.getClientRects().length&&!q.closest('.toolbar,dialog'));
                if(c){c.setAttribute('data-qa-t','1');return {i:sq[k]};}}}return null;});
          if(t){typedTried++;await p.fill('[data-qa-t]','Mateo Rivera sample');await sleep(150);await p.evaluate(()=>{const q=document.querySelector('[data-qa-t]');if(q)q.removeAttribute('data-qa-t');nbhUI.focus.next();});await sleep(450);
            const s=await p.evaluate(i=>{const h=document.querySelector('[data-nbh-fx="hf"][data-nbh-fx-u="'+i+'"]');return h?{sum:h.getAttribute('data-nbh-fx-sum')||'',done:h.hasAttribute('data-nbh-fx-done'),after:getComputedStyle(h,'::after').content}:null;},t.i);
            typed={v,s};if(s&&/Mateo Rivera/.test(s.sum)&&s.done&&/Mateo Rivera/.test(s.after))typedOk++;}}
        if(!last){const l=await p.evaluate(()=>{const F=nbhUI.focus,u=F.units(),sq=u.filter(x=>x.step&&!x.nf).map(x=>x.i);
            for(let k=0;k<sq.length-1;k++){F.go(sq[k]);const els=[...document.querySelectorAll('[data-nbh-fx-u="'+sq[k]+'"]')],fl=[];
              els.forEach(e=>{(e.matches('input,select,textarea')?[e]:[...e.querySelectorAll('input,select,textarea')]).forEach(q=>{if(!/^(hidden|file|button|submit|reset|image)$/i.test(q.type)&&!q.disabled&&!q.readOnly&&q.getClientRects().length&&!q.closest('.toolbar,dialog'))fl.push(q);});});
              const z=fl[fl.length-1];if(z&&z.tagName==='INPUT'&&/^(text|search|email|tel|url|number|)$/i.test(z.type)){z.setAttribute('data-qa-z','1');
                window.__qaOwn=true;const h=e=>{if(e.key==='Enter')window.__qaOwn=e.defaultPrevented;document.documentElement.removeEventListener('keydown',h);};document.documentElement.addEventListener('keydown',h);
                return {i:sq[k],to:sq[k+1]};}}return null;});
          if(l){lastTried++;await p.focus('[data-qa-z]');await p.keyboard.press('Enter');await sleep(150);
            const c=await p.evaluate(()=>{const z=document.querySelector('[data-qa-z]');if(z)z.removeAttribute('data-qa-z');const a=document.activeElement,h=a&&a.closest&&a.closest('[data-nbh-fx-u]');return {cur:nbhUI.focus.cur(),in:h?+h.getAttribute('data-nbh-fx-u'):-1,own:window.__qaOwn};});
            if(c.own)lastTried--;else{last={l,c};if(c.cur===l.to)lastOk++;}}}
      }
      if(typed)ok(f.id+' ['+typed.v+']: a value typed, then Next: the part folds to a line with a tick and the value',typed.s&&/Mateo Rivera/.test(typed.s.sum)&&typed.s.done&&/Mateo Rivera/.test(typed.s.after),typed);
      if(last)ok(f.id+': Enter in the last one-line field of a part opens the next part',last.c.cur===last.l.to,last);
      await p.evaluate(()=>nbhUI.focus.set(false));
      ok(f.id+': no page errors',!errs.length,errs.slice(0,3));
    }catch(e){ok(f.id+': the sweep ran',false,String(e&&e.message||e).slice(0,300));}
    await p.close();
  }
  ok('Enter moved to the next field in '+enterOk+' of '+enterTried+' parts tried',enterOk===enterTried&&enterTried>0,{enterOk,enterTried,enterBad});
  await ctx.close();
}

async function shellChecks(br){
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage(),errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1300);
  await page.evaluate(()=>{try{localStorage.removeItem('nbh.focus');}catch(e){}const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
    set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
  const open=async id=>{await page.evaluate(id=>openForm(id),id);await page.waitForFunction(id=>!!state.status[id],id,{timeout:40000});await sleep(1200);
    await page.evaluate(()=>{try{foldBar(true);}catch(e){}const t=document.getElementById('tipHide');if(t&&t.offsetParent)t.click();});await sleep(200);
    const file=await page.evaluate(id=>ALL.find(f=>f[0]===id)[2],id);return page.frames().find(f=>f.url().indexOf(encodeURI(file))>=0||f.url().indexOf(file)>=0);};
  const pal=await page.evaluate(()=>{const r=palList('focus');return r.map(x=>x.n);});
  ok('shell: the command box offers “Focus: one part of a form at a time” first for “focus”',pal[0]==='Focus: one part of a form at a time',pal.slice(0,4));
  const fr=await open('BC-1');
  const b0=await page.evaluate(()=>{const b=document.getElementById('focusBtn'),r=b.getBoundingClientRect(),n=document.getElementById('popOut').getBoundingClientRect();return {p:b.getAttribute('aria-pressed'),w:Math.round(r.width),h:Math.round(r.height),nh:Math.round(n.height),top:Math.round(r.top-n.top),seen:!!b.offsetParent,lbl:b.querySelector('.lbl').textContent,svg:!!b.querySelector('svg')};});
  ok('shell: the crumb has a Focus button (an icon and “Focus”), off, beside Own tab and as tall, at least 44 px wide on a finger',b0.seen&&b0.p==='false'&&b0.lbl==='Focus'&&b0.svg&&b0.w>=44&&b0.h===b0.nh&&b0.top===0,b0);
  await page.click('#focusBtn');await sleep(700);
  const s1=await page.evaluate(()=>({p:document.getElementById('focusBtn').getAttribute('aria-pressed'),ls:localStorage.getItem('nbh.focus')}));
  const f1=await fr.evaluate(()=>({on:nbhUI.focus.on(),bar:!!document.querySelector('#nbhFxBar:not([hidden])'),cur:nbhUI.focus.cur(),units:nbhUI.focus.units().length,own:!!document.getElementById('nbhFocusBtn')}));
  ok('shell: Focus pressed: the button is lit, the choice kept on the device (nbh.focus), the open form shows one part with its bar',s1.p==='true'&&s1.ls==='on'&&f1.on&&f1.bar&&f1.units>1,{s1,f1});
  ok('shell: a form inside the workstation has no Focus button of its own (the crumb’s is the switch)',!f1.own,f1);
  /* a tap on a folded part, and on Next, on the iPad */
  const tap=await fr.evaluate(()=>{const h=[...document.querySelectorAll('[data-nbh-fx="hf"]')].find(e=>e.getClientRects().length&&+e.getAttribute('data-nbh-fx-u')>nbhUI.focus.cur());if(!h)return null;window.scrollTo(0,Math.max(0,h.getBoundingClientRect().top+scrollY-260));const r=h.getBoundingClientRect();return {x:r.left+Math.min(60,r.width/2),y:r.top+r.height/2,i:+h.getAttribute('data-nbh-fx-u'),h:Math.round(r.height)};});
  const fe=await fr.frameElement(),fb=await fe.boundingBox();
  if(tap){await page.touchscreen.tap(fb.x+tap.x,fb.y+tap.y);await sleep(500);}
  const c2=await fr.evaluate(()=>nbhUI.focus.cur());
  ok('shell, iPad: a tap on a folded part opens it; the folded line is at least 44 px tall',!!tap&&c2===tap.i&&tap.h>=44,{tap,c2});
  await fr.evaluate(()=>nbhUI.focus.go(0));await sleep(300);
  const nb=await fr.evaluate(()=>{const b=document.querySelector('#nbhFxBar .nbh-fx-next'),r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:Math.round(r.width),h:Math.round(r.height),all:[...document.querySelectorAll('#nbhFxBar button')].map(x=>Math.round(Math.min(x.getBoundingClientRect().width,x.getBoundingClientRect().height)))};});
  await page.touchscreen.tap(fb.x+nb.x,fb.y+nb.y);await sleep(500);
  const c3=await fr.evaluate(()=>({cur:nbhUI.focus.cur(),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  ok('shell, iPad: a tap on Next opens the next part; the bar’s buttons are 44 px; no sideways scroll',c3.cur===1&&nb.all.every(x=>x>=44)&&c3.sw<=c3.cw+1,{nb,c3});
  /* the master print's copy of the form is the same with Focus on */
  await page.evaluate(()=>focusSet(false));await sleep(500);
  const pay0=await page.evaluate(async()=>{const r=await grab('BC-1','collect');return r&&r.html;});
  await page.evaluate(()=>focusSet(true));await sleep(600);await fr.evaluate(()=>nbhUI.focus.go(1));await sleep(300);
  const pay1=await page.evaluate(async()=>{const r=await grab('BC-1','collect');return r&&r.html;});await sleep(300);
  const after=await fr.evaluate(()=>({cur:nbhUI.focus.cur(),open:document.querySelectorAll('[data-nbh-fx="c"],[data-nbh-fx="hc"]').length}));
  ok('shell: the master print copies the form exactly as with Focus off (no marks in it), and Focus is back after',!!pay0&&pay0===pay1&&!/data-nbh-fx/.test(pay1)&&after.cur===1&&after.open>0,{len:[pay0&&pay0.length,pay1&&pay1.length],after,first:pay0&&pay1&&[...pay0].findIndex((c,i)=>c!==pay1[i])});
  /* a form opened later picks it up; the form's Whole page button turns it off everywhere */
  const fr2=await open('IC-1');
  const f2=await fr2.evaluate(()=>({on:nbhUI.focus.on(),units:nbhUI.focus.units().length}));
  ok('shell: a form opened later opens in Focus',f2.on&&f2.units>1,f2);
  await fr2.click('#nbhFxBar .nbh-fx-off');await sleep(600);
  const s3=await page.evaluate(()=>({p:document.getElementById('focusBtn').getAttribute('aria-pressed'),ls:localStorage.getItem('nbh.focus')}));
  const o3=await fr.evaluate(()=>nbhUI.focus.on()),o4=await fr2.evaluate(()=>nbhUI.focus.on());
  ok('shell: the form’s Whole page button turns Focus off for the workstation and every open form',s3.p==='false'&&s3.ls===null&&!o3&&!o4,{s3,o3,o4});
  /* the command box entry */
  await page.evaluate(()=>{const c=CMDS.find(x=>x.n==='Focus: one part of a form at a time');c.go();});await sleep(600);
  const s4=await page.evaluate(()=>document.getElementById('focusBtn').getAttribute('aria-pressed')),o5=await fr2.evaluate(()=>nbhUI.focus.on());
  ok('shell: Focus from the command box turns it on',s4==='true'&&o5,{s4,o5});
  /* kept on the device: the workstation opened again */
  await page.reload();await sleep(1500);
  const s5=await page.evaluate(()=>({p:document.getElementById('focusBtn').getAttribute('aria-pressed')}));
  const fr3=await open('DM-1');const o6=await fr3.evaluate(()=>({on:nbhUI.focus.on(),units:nbhUI.focus.units().length}));
  ok('shell: opened again, the workstation remembers Focus and the form opens in it',s5.p==='true'&&o6.on&&o6.units>1,{s5,o6});
  const crumb=await page.evaluate(()=>[...document.querySelectorAll('.crumb .acts button')].filter(b=>b.offsetParent).map(b=>[b.id,Math.round(b.getBoundingClientRect().width)]));
  ok('shell, iPad: every crumb button is at least 44 px wide, the Focus button among them',crumb.every(x=>x[1]>=44)&&crumb.some(x=>x[0]==='focusBtn'),crumb);
  await page.evaluate(()=>focusSet(false));
  ok('shell: no page errors',!errs.length,errs.slice(0,3));
  await ctx.close();
}

/* a form opened on its own: its own Focus switch; a phone, an iPad upright, a laptop */
async function sizes(br){
  const runs=[['phone 390',{width:390,height:844},IPHONE,true],['iPad upright 820',{width:820,height:1180},IPAD,true],['iPad sideways 1180',{width:1180,height:820},IPAD,true],['laptop 1440',{width:1440,height:900},null,false]];
  const files=['BC-1_Behavioral-Contrast_v2026-09.html','DM-1_Student-Demographics-and-Profile_v2026-09.html','IC-1_Informed-Consent-FBA-BIP_v2026-09.html','AD-1_Accumulated-vs-Distributed-Reinforcement_v2026-09.html','Scatterplot_Pattern_Analysis.html'];
  for(const [name,vp,ua,touch] of runs){
    const ctx=await br.newContext({viewport:vp,hasTouch:touch,isMobile:touch&&vp.width<500,userAgent:ua||undefined,serviceWorkers:'block',deviceScaleFactor:1});
    const bad=[],errs=[];
    for(const file of files){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
      await p.goto(url(file));await p.waitForFunction(()=>window.nbhUI&&nbhUI.focus,null,{timeout:20000});await sleep(800);
      await p.evaluate(()=>{try{localStorage.removeItem('nbh.focus');}catch(e){}const sb=document.querySelector('#simBtn,#btnSim');window.confirm=()=>true;if(sb)sb.click();});await sleep(900);
      const btn=await p.evaluate(()=>{const b=document.getElementById('nbhFocusBtn');return b?{p:b.getAttribute('aria-pressed'),t:b.textContent.trim()}:null;});
      if(!btn||btn.p!=='false'||btn.t!=='Focus')bad.push(file+': no Focus switch in the toolbar '+JSON.stringify(btn));
      /* how wide each page is with Focus off (a few forms already scroll sideways on a phone: a wide table) */
      const vs3=(await views(p)).slice(0,3),offSw={};for(const v of vs3){await view(p,v);await sleep(350);offSw[v]=await p.evaluate(()=>document.documentElement.scrollWidth);}
      await view(p,vs3[0]);await sleep(300);
      await p.evaluate(()=>document.getElementById('nbhFocusBtn').click());await sleep(700);
      for(const v of vs3){await view(p,v);await sleep(450);
        const m=await p.evaluate(()=>{const R=document.documentElement,bar=document.getElementById('nbhFxBar'),ring=document.getElementById('nbhFxRing');const br=bar.getBoundingClientRect(),rr=ring.getBoundingClientRect();
          const heads=[...document.querySelectorAll('[data-nbh-fx="hf"]')].filter(e=>e.getClientRects().length).map(e=>Math.round(e.getBoundingClientRect().height));
          const btns=[...bar.querySelectorAll('button')].map(b=>Math.round(Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height)));
          return {sw:R.scrollWidth,cw:R.clientWidth,bar:[Math.round(br.left),Math.round(br.right)],ring:[Math.round(rr.left),Math.round(rr.right)],ringShown:getComputedStyle(ring).display!=='none',heads:Math.min.apply(null,heads.concat([99])),btns,ls:localStorage.getItem('nbh.focus')};});
        const W=Math.max(m.cw,offSw[v]||0);
        if(m.sw>W+1)bad.push(file+' '+v+': Focus makes the page scroll sideways '+m.sw+'>'+W);
        if(m.bar[0]<0||m.bar[1]>W)bad.push(file+' '+v+': the bar runs off the screen '+m.bar);
        if(m.ringShown&&(m.ring[0]<0||m.ring[1]>W))bad.push(file+' '+v+': the ring runs off the screen '+m.ring);
        if(touch&&m.heads<44)bad.push(file+' '+v+': a folded line is '+m.heads+' px tall');
        if(m.btns.some(x=>x<44))bad.push(file+' '+v+': a bar button under 44 px '+m.btns);
        if(m.ls!=='on')bad.push(file+': the switch did not keep the choice');}
      await p.evaluate(()=>document.querySelector('#nbhFxBar .nbh-fx-off').click());await sleep(300);
      const off=await p.evaluate(()=>({on:nbhUI.focus.on(),ls:localStorage.getItem('nbh.focus'),p:document.getElementById('nbhFocusBtn').getAttribute('aria-pressed')}));
      if(off.on||off.ls!==null||off.p!=='false')bad.push(file+': Whole page did not turn it off '+JSON.stringify(off));
      await p.close();}
    ok(name+': a form on its own has a Focus switch in its toolbar that is kept on the device; Focus never makes the page scroll sideways; the bar and the ring stay on screen; folded lines and the bar’s buttons are 44 px'+(touch?'':' (bar)')+'; Whole page turns it off',!bad.length,bad.slice(0,6));
    ok(name+': no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();
  }
  /* a form opened later in its own tab picks the setting up */
  const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block'});const p=await ctx.newPage();
  await p.goto(url('BC-1_Behavioral-Contrast_v2026-09.html'));await sleep(900);await p.evaluate(()=>localStorage.setItem('nbh.focus','on'));
  const q=await ctx.newPage();await q.goto(url('CF-1_Contextual-Fit-Assessment_v2026-09.html'));await sleep(1200);
  const on=await q.evaluate(()=>({on:nbhUI.focus.on(),p:document.getElementById('nbhFocusBtn').getAttribute('aria-pressed')}));
  await q.evaluate(()=>document.getElementById('nbhFocusBtn').click());await sleep(500);
  const other=await p.evaluate(()=>nbhUI.focus.on());
  ok('a form opened later on this device opens in Focus; turned off there, another open tab follows',on.on&&on.p==='true'&&!other,{on,other});
  await ctx.close();
}

(async()=>{const br=await chromium.launch();
  try{
    if(!process.env.ONLY||process.env.ONLY==='forms')await formSweep(br);
    if(!process.env.ONLY||process.env.ONLY==='shell')await shellChecks(br);
    if(!process.env.ONLY||process.env.ONLY==='sizes')await sizes(br);
  }catch(e){ok('the test ran',false,String(e&&e.stack||e).slice(0,500));}
  await br.close();console.log(fails?'RESULT: '+fails+' failure(s) in '+checks+' checks':'RESULT: all passed ('+checks+' checks)');process.exit(fails?1:0);})();
