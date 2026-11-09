/* v25.70 step by step (approved by the BCBA, 11/9: the questions one, two or three at a time, "like TurboTax", with
   "Review the blank ones"), the shared layout's step 13 (tools/blocks/fx2.html), switched on by a form's own settings
   (FX2_CFG.step). On each form that offers it, on an 11-inch iPad sideways (1180 x 820) and upright (820 x 1180), touch
   and an iPad's user agent, the form's simulation loaded:
     1. the switch under the toolbar: All at once pressed and nothing marked until Step by step is chosen; then 1, 2 or 3
        questions per screen, kept for the form on this device;
     2. the bar at the foot: Back and Next 56 px tall or more, in the lower part of the screen (a thumb's reach), and a
        progress line "Question N of M · Sheet S of T" (polite, for a screen reader), the same M on every sheet;
     3. on every screen only its questions are on screen: every box on screen belongs to one of them, every question
        holds a box, each box's label is on screen with it, a table, a list, a set of choices (radio buttons of one
        name) never cut in two;
     4. Next walks every screen of every sheet in order (the question numbers go up by the screen's questions, the sheet
        number by one) and ends at "Review the blank ones"; Back walks back to the start;
     5. a question the form hides (its part out of sight) is skipped and comes back when the form shows it again;
     6. Review the blank ones: one button per question with no answer, under its sheet's name; a button goes to that
        question's sheet and screen with the cursor in its box; Done shows the whole form (All at once) and keeps Step by
        step, with its 1, 2 or 3, for the next time the form is opened on this device (the BCBA, 11/9); All at once
        chosen is kept the same way;
     7. the keyboard: Enter in a one-line box goes to the next question (from the screen's last, the next screen),
        Shift+Enter back; after Next the cursor is on the screen's first question;
     8. the same fields: every field's name, id and value the same in Step by step as All at once, and a value typed on
        a screen is in the field once All at once is back;
     9. the paper: the print media lays the page out the same with Step by step on as off; while the page is plain (the
        master print collects it) no mark is left in it, and the marks come back after;
    10. turning it off leaves nothing behind (every element and attribute as before, but the switch's own state);
    11. Focus on turns Step by step off;
    12. no page errors.
   Every check runs on the pilot forms (DM-1, IA-1, FS-1); every other form that offers it is walked as below (13).
   With --sweep (or FX2_SWEEP=1), every form instead, or those named: Step by step forced on
   (fx2Layout.step.enable()), every sheet walked: no page error, every box on screen in a question, no question empty, the
   count of each sheet when it is open the same as counted from the others (nbh-ui's way), and screens with more than 8
   boxes listed. The forms that need tuning are listed (NOTE lines), not failed: Step by step is switched on per form
   only where it works. Screenshots in qa/out/v2570-stepper/. Simulated data only.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2570-stepper-test.js [ID,ID...]        the forms that offer it (or those named)
          WS_URL=... node qa/v2570-stepper-test.js --sweep [ID,ID...]  every form (or those named), forced on */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;
const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const note=(n,i)=>console.log('NOTE '+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,900):''));
const OUT=path.join(__dirname,'out','v2570-stepper');fs.mkdirSync(OUT,{recursive:true});
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const args=process.argv.slice(2),SWEEP=args.includes('--sweep')||!!process.env.FX2_SWEEP;
const ALL=L.forms();const named=(args.find(a=>!a.startsWith('--'))||'').split(',').filter(Boolean);
/* the forms that offer Step by step: FX2_CFG.step in their own settings */
const offers=f=>/window\.FX2_CFG\.step\s*=\s*(true|\{)/.test(fs.readFileSync(path.join(L.ROOT||path.resolve(__dirname,'..'),'NBH-Workstation',f.file),'utf8'));
const ON=ALL.filter(f=>offers(f)&&(!named.length||named.includes(f.id)));
const PILOT=['DM-1','IA-1','FS-1'];
const url=f=>BASE+'/NBH-Workstation/'+encodeURI(f.file);
/* in the page */
const ST=p=>p.evaluate(()=>fx2Layout.step.state());
/* every element and attribute, as qa/v2191-focus-test.js reads them for Focus; left out too: the classes and marks nbh-ui and
   nbh-polish give parts as they come into sight or as the page scrolls (nbh-wide, the toolbar's fold, nbh-flush), which
   All at once gives them too once the part is seen; and, as there, nbh-ui's dressing of the fields in sight on a touch
   screen (the buttons of a short list) is taken off first */
const snap=p=>p.evaluate(()=>{try{if(window.nbhUI&&nbhUI.fields)nbhUI.fields.reset();}catch(e){}const out=[];for(const e of document.documentElement.getElementsByTagName('*')){if(e.closest('#nbhToasts,.fx2-stsw,#nbhFoldBtn')||e.matches('body > a[download]'))continue;
  if(e.ownerSVGElement){out.push(e.tagName);continue;}
  const a=[...e.attributes].filter(x=>!(e===document.documentElement&&x.name==='class')&&x.name!=='style'&&!(e.closest('#viewSeg')&&/^(data-nbh-fill|title)$/.test(x.name))&&!/^(aria-label|role|data-nbh-fs)$/.test(x.name)).map(x=>x.name+'='+(x.name==='class'?x.value.trim().split(/\s+/).filter(c=>!/^nbh-/.test(c)).join(' '):x.value)).sort().join(' ');
  out.push(e.tagName+'['+a+']');}return out;});
const fieldsSig=p=>p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(f=>[f.tagName,f.type,f.name,f.id,f.type==='checkbox'||f.type==='radio'?f.checked:f.value].join('|')));
const printSig=async p=>{await p.emulateMedia({media:'print'});await sleep(250);const s=await p.evaluate(()=>{let h=5381,n=0;for(const e of document.body.getElementsByTagName('*')){if(e.closest('#nbhToasts,.fx2-stbar,.fx2-stsw,.fx2-strev'))continue;const r=e.getClientRects();if(!r.length)continue;const b=e.getBoundingClientRect();
  const t=e.tagName+':'+Math.round(b.top+scrollY)+':'+Math.round(b.left+scrollX)+':'+Math.round(b.width)+':'+Math.round(b.height);n++;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;}return {n,h:(h>>>0).toString(36)};});
  await p.emulateMedia({media:'screen'});await sleep(250);return s;};
/* the screen as it is: the boxes on screen, which question each is in, the labels, what is cut in two */
const screen=p=>p.evaluate(()=>{const vis=e=>!!e.getClientRects().length;const S=fx2Layout.step.state();
  const isF=f=>/^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName)&&!/^(hidden|file|button|submit|reset|image)$/i.test(f.type||'');
  const shown=[...document.querySelectorAll('input,select,textarea')].filter(f=>isF(f)&&!f.disabled&&!f.readOnly&&vis(f)&&!f.closest('.toolbar,dialog,.nbh-mast,.fx2-stsw,.fx2-stbar,.fx2-strev,#nbhRail,nav'));
  const pinned=f=>{for(let a=f;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a).position;if(s==='fixed'||s==='sticky')return true;}return false;};
  const q=[...document.querySelectorAll('[data-fx2-st="q"]')];
  const loose=shown.filter(f=>!pinned(f)&&!f.closest('[data-fx2-st="q"]')).map(f=>f.name||f.id||f.tagName);
  /* a label for a box on screen is on screen too */
  const nolab=shown.filter(f=>{const l=f.id&&document.querySelector('label[for="'+CSS.escape(f.id)+'"]');return l&&!vis(l);}).map(f=>f.name||f.id);
  /* a table or a set of radio buttons of one name cut in two: part on screen, part out of sight but not hidden by the form */
  const RW=(window.FX2_CFG&&FX2_CFG.step&&FX2_CFG.step.rows)||'';   /* a questionnaire the form asks item by item (FX2_CFG.step.rows) */
  const cutT=[...document.querySelectorAll('table')].filter(t=>t.querySelector('[data-fx2-st]')&&!(RW&&t.matches(RW))).length;
  const radios={};[...document.querySelectorAll('input[type=radio]')].forEach(r=>{if(!r.name)return;const k=r.name;(radios[k]=radios[k]||[]).push(r);});
  const cutR=Object.keys(radios).filter(k=>{const l=radios[k],a=l.filter(vis).length;return a&&a<l.length&&l.some(r=>!vis(r)&&r.closest('[data-fx2-st="x"]'));});
  const act=document.activeElement;const inQ=!!(act&&act.closest&&(act.closest('[data-fx2-st="q"]')||act.closest('.fx2-strev')));
  return {S:{progress:S.progress,at:S.at,screens:S.screens,si:S.si,sheets:S.sheets,counts:S.counts,screen:S.screen,rev:S.rev,blanks:S.blanks},nq:q.length,nshown:shown.length,loose:loose.slice(0,6),nolab:nolab.slice(0,4),cutT,cutR:cutR.slice(0,4),inQ,
    live:!!document.querySelector('.fx2-stbar [aria-live="polite"]'),bar:(()=>{const b=document.querySelector('.fx2-stbar');if(!b)return null;const r=x=>x.getBoundingClientRect();const n=b.querySelector('.fx2-stnext'),k=b.querySelector('.fx2-stback');return {nh:r(n).height,kh:r(k).height,top:r(b).top,ih:innerHeight};})()};});
const parse=t=>{const m=/^Questions? (\d+)(?:–(\d+))? of (\d+)(?: · Sheet (\d+) of (\d+))?$/.exec(t||'');return m?{a:+m[1],z:+(m[2]||m[1]),n:+m[3],s:+(m[4]||1),t:+(m[5]||1)}:null;};

async function openForm(ctx,f,errs){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f.id+': '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  await p.goto(url(f));await p.waitForFunction(()=>window.fx2Layout&&fx2Layout.step,null,{timeout:20000});await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;try{Object.keys(localStorage).filter(k=>/^nbh\.(fx2\.step|focus)/.test(k)).forEach(k=>localStorage.removeItem(k));}catch(e){}if(window.nbhUI&&nbhUI.focus&&nbhUI.focus.on())nbhUI.focus.set(false);});
  await L.loadSim(p);await sleep(1500);return p;}

async function pilot(br,f,vp){
  const errs=[];const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block'});const p=await openForm(ctx,f,errs);const tag=f.id+' ('+vp.width+'x'+vp.height+')';
  try{
    /* 1 */
    const s0=await p.evaluate(()=>({sw:!!document.querySelector('.fx2-stsw'),all:(document.querySelector('.fx2-stsw [data-fx2-stm=""]')||{}).getAttribute?document.querySelector('.fx2-stsw [data-fx2-stm=""]').getAttribute('aria-pressed'):null,
      marks:document.querySelectorAll('[data-fx2-st]').length,bar:!!document.querySelector('.fx2-stbar'),cls:document.documentElement.classList.contains('fx2-st'),per:!!document.querySelector('.fx2-stsw [data-fx2-stn]:not([hidden])')&&getComputedStyle(document.querySelector('.fx2-stsw .fx2-stg.fx2-stper')).display}));
    ok('1 '+tag+': the switch under the toolbar, All at once pressed, nothing marked and no bar until Step by step is chosen',s0.sw&&s0.all==='true'&&!s0.marks&&!s0.bar&&!s0.cls&&s0.per==='none',s0);
    /* each sheet once, as a person looks through the form (the form settles what it draws), then back to the first */
    const vs=await p.$$eval('#viewSeg button[data-view]',b=>b.filter(x=>!x.disabled&&!x.hidden).map(x=>x.dataset.view));
    const view=v=>p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);
    for(const v of vs){await view(v);await sleep(350);}if(vs[0]){await view(vs[0]);await sleep(600);}
    /* the print media first: nbh-polish's own plain() (a print starting) leaves classes of its own (nbh-flush, the toolbar's fold) */
    const P0=await printSig(p);await sleep(300);const S0=await snap(p),F0=await fieldsSig(p);
    await p.locator('.fx2-stsw [data-fx2-stm="1"]').tap();await sleep(700);
    let sc=await screen(p);let pr=parse(sc.S.progress);
    const kept=await p.evaluate(k=>{try{return localStorage.getItem(k);}catch(e){return null;}},'nbh.fx2.step.'+f.id);
    ok('1 '+tag+': Step by step on: one question a screen, kept for the form ('+kept+')',kept==='1'&&pr&&pr.a===1&&pr.z===1,{kept,sc:sc.S});
    /* 2 */
    const b=sc.bar;ok('2 '+tag+': Back and Next 56 px tall or more, in the lower part of the screen; the progress line "'+sc.S.progress+'" is polite',b&&b.nh>=56&&b.kh>=56&&b.top>b.ih*0.75&&sc.live&&pr&&pr.n>0,{b,progress:sc.S.progress,live:sc.live});
    await p.screenshot({path:path.join(OUT,f.id+'-'+vp.width+'x'+vp.height+'-q1.png')});
    /* 3, 4: Next through every screen */
    const bad=[],walk=[];let last=null,guard=0,shots=0;
    while(guard++<400){sc=await screen(p);if(sc.S.rev)break;pr=parse(sc.S.progress);walk.push(sc.S.progress);
      if(!pr)bad.push('progress '+sc.S.progress);
      else{if(last&&!(pr.a===last.z+1&&pr.n===last.n&&(pr.s===last.s||pr.s===last.s+1)))bad.push('after "'+last.t0+'" came "'+sc.S.progress+'"');last=Object.assign(pr,{t0:sc.S.progress});}
      if(sc.loose.length)bad.push(sc.S.progress+': boxes on screen in no question '+sc.loose.join(','));
      if(sc.nolab.length)bad.push(sc.S.progress+': a label out of sight '+sc.nolab.join(','));
      if(sc.cutT)bad.push(sc.S.progress+': a table cut in two');if(sc.cutR.length)bad.push(sc.S.progress+': choices cut in two '+sc.cutR.join(','));
      if(!sc.nq)bad.push(sc.S.progress+': no question on screen');
      if(shots<2&&pr&&pr.s>=2){await p.screenshot({path:path.join(OUT,f.id+'-'+vp.width+'x'+vp.height+'-s2-'+(++shots)+'.png')});}
      await p.locator('.fx2-stbar .fx2-stnext').tap();await sleep(260);}
    ok('3 '+tag+': on every screen only its questions are on screen, each with its label; no table or set of choices cut in two',!bad.filter(x=>!/^after|^progress/.test(x)).length,bad.filter(x=>!/^after|^progress/.test(x)).slice(0,6));
    ok('4 '+tag+': Next walks every screen in order ('+walk.length+' screens, '+(last?last.n:0)+' questions on '+(last?last.t:0)+' sheets) and ends at Review the blank ones',sc.S.rev&&last&&last.z===last.n&&last.s===last.t&&!bad.some(x=>/^after|^progress/.test(x)),{bad:bad.filter(x=>/^after|^progress/.test(x)).slice(0,4),end:sc.S,last});
    /* 6: the review */
    await p.screenshot({path:path.join(OUT,f.id+'-'+vp.width+'x'+vp.height+'-review.png')});
    const rv=await p.evaluate(()=>{const r=document.querySelector('.fx2-strev');const S=fx2Layout.step.state();return {h:r&&r.querySelector('h2').textContent,n:r?r.querySelectorAll('li button').length:-1,heads:r?[...r.querySelectorAll('h3')].map(h=>h.textContent):[],
      next:document.querySelector('.fx2-stbar .fx2-stnext').textContent,sheetsHidden:[...document.querySelectorAll('.fx2-sh')].filter(s=>s.getClientRects().length&&s.querySelector('input:not([type=hidden]),select,textarea')&&[...s.querySelectorAll('input,select,textarea')].some(x=>x.getClientRects().length&&!x.closest('.fx2-strev'))).length,focus:document.activeElement&&document.activeElement.id};});
    ok('6 '+tag+': Review the blank ones lists '+rv.n+' question(s) under '+rv.heads.length+' sheet name(s), the sheets out of sight, the cursor on its heading, and Next reads Done',rv.h==='Review the blank ones'&&rv.n>=0&&rv.next==='Done'&&!rv.sheetsHidden&&rv.focus==='fx2StRevH',rv);
    if(rv.n>0){const j=await p.evaluate(async()=>{const b=[...document.querySelectorAll('.fx2-strev li button')];const pick=b[Math.floor(b.length/2)];const want=pick.textContent;pick.click();await new Promise(r=>setTimeout(r,500));
        const a=document.activeElement,S=fx2Layout.step.state();return {want,act:a&&(a.name||a.id||a.tagName),inQ:!!(a&&a.closest&&a.closest('[data-fx2-st="q"]')),rev:S.rev,titles:S.screen.map(i=>S.qs[i].title),blank:S.screen.some(i=>S.qs[i].blank)};});
      ok('6 '+tag+': a blank one\'s button goes to its sheet and screen, the cursor in its box ("'+j.want+'")',!j.rev&&j.inQ&&j.titles.includes(j.want)&&j.blank,j);
      await p.evaluate(()=>fx2Layout.step.review());await sleep(300);}
    /* 7: Back walks back to the start */
    let back=0;for(;back<400;back++){const s=await ST(p);if(!s.rev&&s.at===0&&s.si<=0)break;await p.locator('.fx2-stbar .fx2-stback').tap();await sleep(150);}
    sc=await screen(p);pr=parse(sc.S.progress);ok('4 '+tag+': Back walks back to the first question ('+back+' presses)',pr&&pr.a===1&&sc.S.si<=0,sc.S);
    /* 7: the keyboard */
    const kb=await p.evaluate(()=>{const S=fx2Layout.step.state();const q=[...document.querySelectorAll('[data-fx2-st="q"]')];const line=/^(text|search|email|tel|url|number|)$/i;
      const f=q.map(x=>(x.matches('input')?[x]:[...x.querySelectorAll('input')]).find(i=>line.test(i.type)&&!i.readOnly&&!i.disabled&&i.getClientRects().length)).filter(Boolean)[0];if(!f)return null;f.setAttribute('data-qa-k','1');return {p:S.progress};});
    if(kb){await p.focus('[data-qa-k]');await p.keyboard.press('Enter');await sleep(400);const a=await p.evaluate(()=>({p:fx2Layout.step.state().progress,act:document.activeElement&&document.activeElement.closest&&!!document.activeElement.closest('[data-fx2-st="q"]')}));
      await p.keyboard.press('Shift+Enter');await sleep(400);const c=await p.evaluate(()=>({p:fx2Layout.step.state().progress}));
      ok('7 '+tag+': Enter goes on ("'+kb.p+'" to "'+a.p+'", the cursor in the next question), Shift+Enter back ("'+c.p+'")',a.p!==kb.p&&a.act&&c.p===kb.p,{kb,a,c});
      await p.evaluate(()=>{const x=document.querySelector('[data-qa-k]');if(x)x.removeAttribute('data-qa-k');});}
    else note('7 '+tag+': no one-line box on the first screen for the keyboard check');
    await p.locator('.fx2-stbar .fx2-stnext').tap();await sleep(400);sc=await screen(p);
    ok('7 '+tag+': after Next the cursor is on the screen\'s first question',sc.inQ,{act:await p.evaluate(()=>document.activeElement&&document.activeElement.outerHTML.slice(0,120))});
    /* 5: a question the form hides is skipped, and comes back */
    const h5=await p.evaluate(async()=>{const S0=fx2Layout.step.state();const q=[...document.querySelectorAll('[data-fx2-st="q"]')].reverse();const LF='input:not([type=hidden]):not([readonly]):not([disabled]),select:not([disabled]),textarea:not([readonly]):not([disabled])';const e=q.find(x=>(x.matches(LF)||x.querySelector(LF))&&x.getClientRects().length);if(!e)return null;const t0=S0.qs.length;
      e.style.setProperty('display','none','important');e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));const t1=fx2Layout.step.state().qs.length;
      e.style.removeProperty('display');if(!e.getAttribute('style'))e.removeAttribute('style');e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));const t2=fx2Layout.step.state().qs.length;return {t0,t1,t2};});
    ok('5 '+tag+': a question the form hides is skipped ('+(h5&&h5.t0)+' then '+(h5&&h5.t1)+') and back when it shows ('+(h5&&h5.t2)+')',h5&&h5.t1<h5.t0&&h5.t2===h5.t0,h5);
    /* 8: the same fields; a value typed on a screen */
    const F1=await fieldsSig(p);ok('8 '+tag+': every field\'s name, id and value the same in Step by step',JSON.stringify(F1)===JSON.stringify(F0),{n0:F0.length,n1:F1.length,d:F1.filter((x,i)=>x!==F0[i]).slice(0,3)});
    /* 9: the paper */
    const P1=await printSig(p);ok('9 '+tag+': the print media lays the page out as with Step by step off',P1.h===P0.h&&P1.n===P0.n,{P0,P1});
    /* 6 Done, 10: nothing left behind; then a value typed in Step by step is in the field */
    await p.evaluate(()=>fx2Layout.step.review());await sleep(300);await p.locator('.fx2-stbar .fx2-stnext').tap();await sleep(700);
    if(vs[0]){await view(vs[0]);await sleep(700);}
    const S1=await snap(p);const d=(()=>{const A=new Map(),B=new Map();S0.forEach(x=>A.set(x,(A.get(x)||0)+1));S1.forEach(x=>B.set(x,(B.get(x)||0)+1));
      const only=(X,Y)=>[...X].filter(([k,n])=>(Y.get(k)||0)<n).map(([k,n])=>k.slice(0,160)+' x'+(n-(Y.get(k)||0)));const a=only(A,B),b=only(B,A);return a.length||b.length?{n:[S0.length,S1.length],before:a.slice(0,5),after:b.slice(0,5)}:null;})();
    const off=await p.evaluate(()=>({marks:document.querySelectorAll('[data-fx2-st],[data-fx2-stf]').length,bar:!!document.querySelector('.fx2-stbar,.fx2-strev'),cls:document.documentElement.classList.contains('fx2-st'),all:document.querySelector('.fx2-stsw [data-fx2-stm=""]').getAttribute('aria-pressed'),kept:localStorage.getItem('nbh.fx2.step.'+document.documentElement.getAttribute('data-fx2'))}));
    ok('6 '+tag+': Done shows the whole form (All at once), Step by step kept for next time ('+off.kept+'), and 10: nothing left behind (every element and attribute as before)',!d&&!off.marks&&!off.bar&&!off.cls&&off.all==='true'&&off.kept==='1',{d,off});
    await p.evaluate(()=>fx2Layout.step.set(2));await sleep(500);
    const ty=await p.evaluate(()=>{const f=[...document.querySelectorAll('[data-fx2-st="q"] input[type=text], [data-fx2-st="q"] textarea, [data-fx2-st="q"]:is(input[type=text],textarea)')].find(x=>x.getClientRects().length&&!x.readOnly&&!x.disabled);if(!f)return null;f.setAttribute('data-qa-t','1');return {name:f.name||f.id,was:f.value};});
    if(ty){await p.fill('[data-qa-t]','Simulated answer '+vp.width);await sleep(200);const pr2=parse((await ST(p)).progress);
      ok('1 '+tag+': two questions a screen ("'+(await ST(p)).progress+'")',pr2&&pr2.z-pr2.a<=1,await ST(p));
      await p.evaluate(()=>fx2Layout.step.set(''));await sleep(400);const v=await p.evaluate(()=>{const f=document.querySelector('[data-qa-t]');const v=f.value;f.removeAttribute('data-qa-t');return v;});
      ok('8 '+tag+': a value typed in Step by step is in its field once All at once is back ('+ty.name+')',v==='Simulated answer '+vp.width,v);}
    /* 9: the master print collects the page plain (after the snapshot: nbh-polish's plain leaves classes of its own) */
    await p.evaluate(()=>fx2Layout.step.set(1));await sleep(500);
    const pl=await p.evaluate(()=>{const P=window.nbhPolish;if(!P||!P.plain)return null;P.plain(true);const during=document.querySelectorAll('[data-fx2-st]').length,cls=document.documentElement.classList.contains('fx2-st');P.plain(false);
      return new Promise(r=>setTimeout(()=>r({during,cls,after:document.querySelectorAll('[data-fx2-st="q"]').length}),300));});
    ok('9 '+tag+': while the page is plain (the master print) no mark is in it; the marks come back after',pl&&!pl.during&&!pl.cls&&pl.after>0,pl);
    /* 11: Focus on turns it off */
    await p.evaluate(()=>fx2Layout.step.set(1));await sleep(500);
    const fo=await p.evaluate(async()=>{if(!window.nbhUI||!nbhUI.focus)return null;nbhUI.focus.set(true);await new Promise(r=>setTimeout(r,600));const r={step:fx2Layout.step.on(),marks:document.querySelectorAll('[data-fx2-st]').length,focus:nbhUI.focus.on()};nbhUI.focus.set(false);await new Promise(r=>setTimeout(r,300));return r;});
    ok('11 '+tag+': Focus on turns Step by step off',fo&&!fo.step&&!fo.marks&&fo.focus,fo);
    /* 6: after Done, the form opens again in Step by step with its 1, 2 or 3; All at once chosen is kept the same way */
    await p.locator('.fx2-stsw [data-fx2-stm="1"]').tap();await sleep(500);await p.locator('.fx2-stsw [data-fx2-stn="3"]').tap();await sleep(500);
    await p.evaluate(()=>fx2Layout.step.review());await sleep(300);await p.locator('.fx2-stbar .fx2-stnext').tap();await sleep(500);
    const reopen=async()=>{await p.reload();await p.waitForFunction(()=>window.fx2Layout&&fx2Layout.step&&document.querySelector('.fx2-stsw'),null,{timeout:20000});await sleep(1500);
      return p.evaluate(()=>{const S=fx2Layout.step.state(),q=s=>document.querySelector(s);return {on:S.on,per:S.per,bar:!!q('.fx2-stbar'),all:q('.fx2-stsw [data-fx2-stm=""]').getAttribute('aria-pressed'),
        three:q('.fx2-stsw [data-fx2-stn="3"]').getAttribute('aria-pressed'),progress:S.progress,kept:localStorage.getItem('nbh.fx2.step.'+document.documentElement.getAttribute('data-fx2'))};});};
    const r1=await reopen();const pr1=parse(r1.progress);
    ok('6 '+tag+': after Done the form opens again in Step by step, 3 a screen ("'+r1.progress+'")',r1.on&&r1.per===3&&r1.bar&&r1.all==='false'&&r1.three==='true'&&r1.kept==='3'&&pr1&&pr1.a===1,r1);
    await p.locator('.fx2-stsw [data-fx2-stm=""]').tap();await sleep(500);
    const r2=await reopen();
    ok('6 '+tag+': All at once chosen, the form opens again All at once',!r2.on&&!r2.bar&&r2.all==='true'&&r2.kept===null,r2);
  }catch(e){ok(tag+': the checks ran',false,String(e&&e.stack||e).slice(0,600));}
  ok('12 '+tag+': no page errors',!errs.length,errs.slice(0,4));
  await ctx.close();}

/* every form: Step by step forced on, every sheet walked */
async function sweep(br,f){
  const errs=[];const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,isMobile:true,userAgent:IPAD,serviceWorkers:'block'});const out={id:f.id,why:[]};
  try{const p=await openForm(ctx,f,errs);
    await p.evaluate(()=>{fx2Layout.step.enable();fx2Layout.step.set(1);});await sleep(800);
    let s=await ST(p);out.sheets=s.sheets.length;out.total=s.counts.reduce((a,b)=>a+b,0);const scanned=s.counts.slice();const opened={};let guard=0,big=0,loose=0,empty=0,nolab=0,prog=0,last=null;
    while(guard++<600){const sc=await screen(p);if(sc.S.rev)break;const pr=parse(sc.S.progress);if(!pr)prog++;else{if(last&&pr.a!==last.z+1)prog++;last=pr;}
      opened[sc.S.si]=sc.S.counts[sc.S.si];if(sc.loose.length)loose++;if(!sc.nq)empty++;if(sc.nolab.length)nolab++;
      const n=await p.evaluate(()=>{const S=fx2Layout.step.state();return S.screen.reduce((a,i)=>a+S.qs[i].n,0);});if(n>8)big++;
      await p.evaluate(()=>fx2Layout.step.next());await sleep(120);}
    const mism=scanned.map((c,i)=>opened[i]!=null&&opened[i]!==c?s.sheets[i]+' '+c+'/'+opened[i]:null).filter(Boolean);
    if(!out.total)out.why.push('no questions found');if(guard>=600)out.why.push('Next never reached the end');
    if(loose)out.why.push(loose+' screen(s) with boxes in no question');if(empty)out.why.push(empty+' screen(s) with no question');if(nolab)out.why.push(nolab+' screen(s) with a label out of sight');
    if(prog)out.why.push('the progress line skipped '+prog+' time(s)');if(mism.length)out.why.push('sheet counts differ when open: '+mism.join('; '));
    if(big)out.big=big;
    await p.evaluate(()=>fx2Layout.step.set(''));await sleep(300);const left=await p.evaluate(()=>document.querySelectorAll('[data-fx2-st]').length);if(left)out.why.push(left+' marks left');
  }catch(e){out.why.push('error '+String(e.message||e).slice(0,160));}
  if(errs.length)out.why.push('page errors: '+errs.slice(0,2).join(' | ').slice(0,200));
  await ctx.close();return out;}

(async()=>{const br=await L.chromium.launch();
  if(!SWEEP){if(!ON.length)ok('a form offers Step by step (FX2_CFG.step)',false);
    /* the pilot forms: every check, on the iPad both ways; the other forms that offer it: every sheet walked */
    for(const f of ON.filter(f=>PILOT.includes(f.id)))for(const vp of [{width:1180,height:820},{width:820,height:1180}])await pilot(br,f,vp);
    for(const f of ON.filter(f=>!PILOT.includes(f.id))){const r=await sweep(br,f);ok('13 '+f.id+' offers Step by step: '+r.total+' questions on '+r.sheets+' sheet(s) walked, every box on screen in a question, the counts of every sheet the same open as counted, no page error',!r.why.length,r.why);}}
  if(SWEEP){const list=named.length?ALL.filter(f=>named.includes(f.id)):ALL;const res=[];
    for(const f of list){const r=await sweep(br,f);res.push(r);console.log((r.why.length?'TUNE ':'OK   ')+f.id+'  '+r.total+' questions on '+r.sheets+' sheet(s)'+(r.big?', '+r.big+' screen(s) over 8 boxes':'')+(r.why.length?': '+r.why.join('; '):''));}
    fs.writeFileSync(path.join(OUT,'sweep.json'),JSON.stringify(res,null,1));
    note('works as it is: '+res.filter(r=>!r.why.length).map(r=>r.id).join(','));note('needs tuning: '+res.filter(r=>r.why.length).map(r=>r.id).join(','));}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
