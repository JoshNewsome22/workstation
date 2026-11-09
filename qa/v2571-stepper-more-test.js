/* v25.71 step by step on the eleven forms left at All at once in v25.70 (the BCBA's approval, 11/9: the questions one,
   two or three at a time, "like TurboTax", with "Review the blank ones"): ABC-1, VI-1, DT-1 and AD-1 (their sheets are
   panes the form shows itself, now counted each in turn: FX2_CFG.step.panes), TD-1 (its own layout no longer leaves
   boxes outside the questions), GB-1, CF-1 and TK-1 (a sheet drawn as it opens: drawn before it is counted, and a form
   opened on a sheet with nothing to answer starts at the first that has), TV-1 (a script segment is one question:
   FX2_CFG.step.runs) and DD-1 and EA-1 (their graphs settled). On each form, on an iPad held upright (1024 x 1366, touch
   and an iPad's user agent, one question a screen) and a laptop (1440 x 900, a mouse, three questions a screen), the
   form's simulation loaded and its first sheet open:
     1. the form offers Step by step (FX2_CFG.step); the bar at the foot, Next and Back 56 px tall;
     2. Next walks every screen of every sheet: the progress line "Question(s) N(–Z) of M · Sheet S of T" goes on by the
        screen's questions, the same M throughout, the sheet by one, and ends at Review the blank ones after the last
        question of the last sheet; each sheet's count when it is open is the count it was given from the others;
     3. on every screen: a question at least; every box on screen in a question; a box's label on screen with it; no
        table cut in two; a large table, a runner, a timer or a graph (FX2_CFG.step.alone) alone on its screen; the parts
        named whole (FX2_CFG.step.one, alone, runs) never split across questions;
     4. a question hidden by the form is skipped and joins the line when it shows (a question hidden, as the form hides
        one, then shown; and on DD-1 the form's own: Days shown -> Custom range shows From and To);
     5. Review the blank ones lists exactly the questions with no answer (counted on the walk from the boxes on screen),
        under their sheets' names, and a button goes to its question with the cursor in its box;
     6. Back walks back to the first question;
     7. nothing else changes: every field's name, id and value the same in Step by step as All at once; the print
        media lays the page out the same with Step by step on as off; while the page is plain (a print, the master packet)
        no mark is in it and the marks come back after; Done (All at once) leaves no mark behind;
     8. no page errors.
   A few screenshots of the iPad screens in qa/out/v2571-stepper/. Simulated data only.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2571-stepper-more-test.js [ID,ID...] [--ipad|--laptop] */
const L=require(__dirname+'/lib.js');const {BASE,sleep}=L;
const fs=require('fs'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const OUT=path.join(__dirname,'out','v2571-stepper');fs.mkdirSync(OUT,{recursive:true});
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const NEW=['ABC-1','VI-1','DT-1','AD-1','TD-1','GB-1','CF-1','TK-1','TV-1','DD-1','EA-1'];
const args=process.argv.slice(2);const named=(args.find(a=>!a.startsWith('--'))||'').split(',').filter(Boolean);
const ALL=L.forms();const LIST=ALL.filter(f=>NEW.includes(f.id)&&(!named.length||named.includes(f.id)));
const SIZES=[{tag:'iPad 1024x1366',vp:{width:1024,height:1366},touch:true,per:1},{tag:'laptop 1440x900',vp:{width:1440,height:900},touch:false,per:3}]
  .filter(s=>!(args.includes('--ipad')&&!s.touch)&&!(args.includes('--laptop')&&s.touch));
const url=f=>BASE+'/NBH-Workstation/'+encodeURI(f.file);
const parse=t=>{const m=/^Questions? (\d+)(?:–(\d+))? of (\d+)(?: · Sheet (\d+) of (\d+))?$/.exec(t||'');return m?{a:+m[1],z:+(m[2]||m[1]),n:+m[3],s:+(m[4]||1),t:+(m[5]||1)}:null;};
const ST=p=>p.evaluate(()=>fx2Layout.step.state());
const fieldsSig=p=>p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(f=>[f.tagName,f.type,f.name,f.id,f.type==='checkbox'||f.type==='radio'?f.checked:f.value].join('|')));
const printSig=async p=>{await p.emulateMedia({media:'print'});await sleep(300);const s=await p.evaluate(()=>{let h=5381,n=0;for(const e of document.body.getElementsByTagName('*')){if(e.closest('#nbhToasts,.fx2-stbar,.fx2-stsw,.fx2-strev'))continue;const r=e.getClientRects();if(!r.length)continue;const b=e.getBoundingClientRect();
  /* a link a form puts at the foot of the page for a moment to save a file (it takes no room) */
  if(e.matches('body > a')&&!b.width&&!b.height)continue;
  const t=e.tagName+':'+Math.round(b.top+scrollY)+':'+Math.round(b.left+scrollX)+':'+Math.round(b.width)+':'+Math.round(b.height);n++;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;}return {n,h:(h>>>0).toString(36)};});
  await p.emulateMedia({media:'screen'});await sleep(300);return s;};
/* the screen as it is */
const screen=p=>p.evaluate(()=>{const vis=e=>!!e.getClientRects().length;const S=fx2Layout.step.state();const CF=(window.FX2_CFG&&FX2_CFG.step)||{};
  const isF=f=>/^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName)&&!/^(hidden|file|button|submit|reset|image)$/i.test(f.type||'');
  const live=f=>isF(f)&&!f.disabled&&!f.readOnly&&vis(f)&&!f.closest('.toolbar,dialog,.nbh-mast,.fx2-stsw,.fx2-stbar,.fx2-strev,#nbhRail,nav');
  const shown=[...document.querySelectorAll('input,select,textarea')].filter(live);
  const pinned=f=>{for(let a=f;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a).position;if(s==='fixed'||s==='sticky')return true;}return false;};
  const q=[...document.querySelectorAll('[data-fx2-st="q"]')];
  const loose=shown.filter(f=>!pinned(f)&&!f.closest('[data-fx2-st="q"]')).map(f=>f.name||f.id||f.tagName);
  const nolab=shown.filter(f=>{const l=f.id&&document.querySelector('label[for="'+CSS.escape(f.id)+'"]');return l&&!vis(l);}).map(f=>f.name||f.id);
  const cutT=[...document.querySelectorAll('table')].filter(t=>t.querySelector('[data-fx2-st]')).length;
  /* a part named whole, partly on screen: some of its boxes on screen and some out of sight by a mark */
  const whole=[CF.one,CF.alone,CF.runs].filter(Boolean).join(',');
  const split=whole?[...document.querySelectorAll(whole)].filter(w=>{const f=[...w.querySelectorAll('input,select,textarea')].filter(isF);const on=f.filter(vis).length;return on&&f.some(x=>!vis(x)&&x.closest('[data-fx2-st="x"]')&&w.contains(x.closest('[data-fx2-st="x"]')));}).length:0;
  /* the questions of this screen: heavy, alone, and blank as the boxes on screen say (the fields of the screen) */
  const sq=S.screen.map(i=>S.qs[i]);const heavy=sq.some(x=>x.heavy)&&sq.length>1;
  const alone=CF.alone?[...document.querySelectorAll(CF.alone)].filter(w=>vis(w)&&[...w.querySelectorAll('input,select,textarea')].some(live)).length&&sq.length>1:false;
  const filled=f=>f.type==='checkbox'||f.type==='radio'?f.checked:f.tagName==='SELECT'?(f.selectedIndex>0&&!!f.value):!!String(f.value||'').trim();
  const qf=shown.filter(f=>f.closest('[data-fx2-st="q"]'));
  return {S:{progress:S.progress,si:S.si,sheets:S.sheets,counts:S.counts,rev:S.rev,at:S.at,screens:S.screens},sq:sq.map(x=>({t:x.title,b:x.blank,n:x.n})),nq:q.length,loose:loose.slice(0,6),nolab:nolab.slice(0,4),cutT,split,heavy,alone,
    domBlank:sq.length===1?!qf.some(filled):null,noField:sq.length&&!qf.length};});

async function run(br,f,sz){
  const errs=[];const tag=f.id+' ('+sz.tag+')';
  const ctx=await br.newContext(Object.assign({viewport:sz.vp,deviceScaleFactor:1,serviceWorkers:'block'},sz.touch?{hasTouch:true,isMobile:true,userAgent:IPAD}:{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
  const press=async sel=>{const l=p.locator(sel);if(sz.touch)await l.tap();else await l.click();};
  try{
    await p.goto(url(f));await p.waitForFunction(()=>window.fx2Layout&&fx2Layout.step,null,{timeout:20000});await sleep(1200);
    await p.evaluate(()=>{window.confirm=()=>true;try{Object.keys(localStorage).filter(k=>/^nbh\.(fx2\.step|focus)/.test(k)).forEach(k=>localStorage.removeItem(k));}catch(e){}if(window.nbhUI&&nbhUI.focus&&nbhUI.focus.on())nbhUI.focus.set(false);});
    await L.loadSim(p);await sleep(1500);
    const vs=await p.$$eval('#viewSeg button[data-view]',b=>b.filter(x=>!x.disabled&&!x.hidden).map(x=>x.dataset.view));
    const view=v=>p.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);
    for(const v of vs){await view(v);await sleep(300);}await view(vs[0]);await sleep(700);
    const offers=await p.evaluate(()=>!!(window.FX2_CFG&&FX2_CFG.step)&&!!document.querySelector('.fx2-stsw'));
    ok('1 '+tag+': the form offers Step by step (FX2_CFG.step), the switch under its toolbar',offers);
    if(!offers)throw new Error('no Step by step');
    const P0=await printSig(p);await sleep(300);const F0=await fieldsSig(p);
    await press('.fx2-stsw [data-fx2-stm="1"]');await sleep(700);
    if(sz.per!==1){await press('.fx2-stsw [data-fx2-stn="'+sz.per+'"]');await sleep(700);}
    const b=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {n:r('.fx2-stbar .fx2-stnext').height,k:r('.fx2-stbar .fx2-stback').height,top:r('.fx2-stbar').top,ih:innerHeight};});
    ok('1 '+tag+': the bar at the foot, Next and Back 56 px tall',b.n>=56&&b.k>=56&&b.top>b.ih*0.75,b);
    /* 2, 3: Next through every screen */
    const s0=await ST(p);const scanned=s0.counts.slice();
    const bad=[],order=[],blanks={},opened={};let last=null,guard=0,shots=0,maxPer=0,hid=null;
    while(guard++<700){const sc=await screen(p);if(sc.S.rev)break;const pr=parse(sc.S.progress);
      if(!pr)bad.push('progress "'+sc.S.progress+'"');
      else{if(last?!(pr.a===last.z+1&&pr.n===last.n&&pr.t===last.t&&(pr.s===last.s||pr.s===last.s+1)):!(pr.a===1&&pr.s===1))order.push((last?last.t0:'start')+' -> '+sc.S.progress);last=Object.assign(pr,{t0:sc.S.progress});maxPer=Math.max(maxPer,pr.z-pr.a+1);}
      opened[sc.S.si]=sc.S.counts[sc.S.si];
      if(!sc.nq)bad.push(sc.S.progress+': no question on screen');
      if(sc.noField)bad.push(sc.S.progress+': a question with no box on screen');
      if(sc.loose.length)bad.push(sc.S.progress+': boxes in no question '+sc.loose.join(','));
      if(sc.nolab.length)bad.push(sc.S.progress+': a label out of sight '+sc.nolab.join(','));
      if(sc.cutT)bad.push(sc.S.progress+': a table cut in two');
      if(sc.split)bad.push(sc.S.progress+': a part named whole split');
      if(sc.heavy||sc.alone)bad.push(sc.S.progress+': a large table, runner or graph shares its screen');
      if(sz.per===1){if(sc.domBlank!==sc.sq[0].b)bad.push(sc.S.progress+': blank as counted '+sc.sq[0].b+', as the boxes say '+sc.domBlank);
        if(sc.domBlank){const k=sc.S.sheets[sc.S.si];(blanks[k]=blanks[k]||[]).push(sc.sq[0].t);}}
      if(sz.touch&&shots<1&&pr&&pr.s===Math.min(2,pr.t)&&sc.sq.length){await p.screenshot({path:path.join(OUT,f.id+'-ipad-'+(++shots)+'.png')});}
      /* 4: a question hidden by the form, once, in the middle of the walk */
      if(!hid&&pr&&pr.s>=1&&pr.a>2){hid=await p.evaluate(async()=>{const S0=fx2Layout.step.state(),t0=S0.qs.length;const q=[...document.querySelectorAll('[data-fx2-st="q"]')].reverse();
          const LF='input:not([type=hidden]):not([readonly]):not([disabled]),select:not([disabled]),textarea:not([readonly]):not([disabled])';const e=q.find(x=>(x.matches(LF)||x.querySelector(LF))&&x.getClientRects().length);if(!e)return {skip:1};
          e.style.setProperty('display','none','important');e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));const t1=fx2Layout.step.state().qs.length;
          e.style.removeProperty('display');if(!e.getAttribute('style'))e.removeAttribute('style');e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));const S2=fx2Layout.step.state();return {t0,t1,t2:S2.qs.length,p0:S0.progress,p2:S2.progress};});
        /* the screen's own question hidden, the screen moved on to the next: Back is where it was */
        if(hid&&!hid.skip&&hid.p2!==hid.p0){await press('.fx2-stbar .fx2-stback');await sleep(300);hid.p3=(await ST(p)).progress;}else if(hid)hid.p3=hid.p2;}
      await press('.fx2-stbar .fx2-stnext');await sleep(sz.touch?230:200);}
    const end=await screen(p);
    const mism=scanned.map((c,i)=>opened[i]!=null&&opened[i]!==c?s0.sheets[i]+' '+c+' counted, '+opened[i]+' open':null).filter(Boolean);
    ok('2 '+tag+': Next walks '+guard+' screens, '+(last?last.n:0)+' questions on '+(last?last.t:0)+' sheet(s), in order, and ends at Review the blank ones',end.S.rev&&last&&last.z===last.n&&last.s===last.t&&!order.length&&!bad.some(x=>/^progress/.test(x)),{order:order.slice(0,4),end:end.S,last});
    ok('2 '+tag+': each sheet\'s count when it is open is the count it was given ('+scanned.join(',')+')',!mism.length&&Object.keys(opened).length===scanned.length,{mism,opened});
    ok('3 '+tag+': every screen holds a question; every box on screen in one, with its label; no table or whole part cut; large tables, runners and graphs alone'+(sz.per>1?' (up to '+maxPer+' a screen)':''),!bad.filter(x=>!/^progress|blank as counted/.test(x)).length,bad.filter(x=>!/^progress|blank as counted/.test(x)).slice(0,6));
    ok('4 '+tag+': a question the form hides is skipped ('+(hid&&hid.t0)+' then '+(hid&&hid.t1)+') and joins again when it shows ('+(hid&&hid.t2)+')',hid&&(hid.skip||(hid.t1<hid.t0&&hid.t2===hid.t0&&hid.p3===hid.p0)),hid);
    /* 5: the review */
    if(sz.per===1)ok('5 '+tag+': the blank ones as counted are the questions whose boxes are empty',!bad.some(x=>/blank as counted/.test(x)),bad.filter(x=>/blank as counted/.test(x)).slice(0,4));
    const rv=await p.evaluate(()=>{const r=document.querySelector('.fx2-strev');if(!r)return null;const g={};let cur='';for(const e of r.querySelectorAll('h3,li button')){if(e.tagName==='H3')cur=e.textContent;else(g[cur]=g[cur]||[]).push(e.textContent);}
      return {h:r.querySelector('h2').textContent,n:r.querySelectorAll('li button').length,g,next:document.querySelector('.fx2-stbar .fx2-stnext').textContent,focus:document.activeElement&&document.activeElement.id};});
    if(sz.per===1){const want=Object.values(blanks).reduce((a,x)=>a+x.length,0);const labels=await p.evaluate(ks=>ks.map(k=>{const b=document.querySelector('#viewSeg button[data-view="'+k+'"]');return b?b.textContent.replace(/\s+/g,' ').trim():k;}),Object.keys(blanks));
      const names=Object.values(rv&&rv.g||{}).flat().sort().join('|'),wantN=Object.values(blanks).flat().sort().join('|');
      ok('5 '+tag+': Review the blank ones lists the '+want+' question(s) with no answer, under '+Object.keys(blanks).length+' sheet name(s); Next reads Done',rv&&rv.h==='Review the blank ones'&&rv.n===want&&names===wantN&&Object.keys(rv.g).length===Object.keys(blanks).length&&rv.next==='Done'&&rv.focus==='fx2StRevH',{rv:rv&&{n:rv.n,heads:Object.keys(rv.g),next:rv.next},want,sheets:labels,diff:[names.slice(0,300),wantN.slice(0,300)]});}
    else ok('5 '+tag+': Review the blank ones at the end, Next reads Done',rv&&rv.h==='Review the blank ones'&&rv.next==='Done',rv&&{n:rv.n,next:rv.next});
    if(rv&&rv.n>0){const j=await p.evaluate(async()=>{const b=[...document.querySelectorAll('.fx2-strev li button')];const pick=b[Math.floor(b.length/2)];const want=pick.textContent;pick.click();await new Promise(r=>setTimeout(r,700));
        const a=document.activeElement,S=fx2Layout.step.state();return {want,act:a&&(a.name||a.id||a.tagName),inQ:!!(a&&a.closest&&a.closest('[data-fx2-st="q"]')),rev:S.rev,titles:S.screen.map(i=>S.qs[i].title),blank:S.screen.some(i=>S.qs[i].blank)};});
      ok('5 '+tag+': a blank one\'s button goes to its question, the cursor in its box ("'+j.want.slice(0,60)+'")',!j.rev&&j.inQ&&j.titles.includes(j.want)&&j.blank,j);}
    /* 6: Back to the first question */
    let back=0;for(;back<700;back++){const s=await ST(p);if(!s.rev&&s.at===0&&s.si<=0)break;await press('.fx2-stbar .fx2-stback');await sleep(120);}
    const s6=await ST(p);const p6=parse(s6.progress);ok('6 '+tag+': Back walks back to the first question ('+back+' presses, "'+s6.progress+'")',p6&&p6.a===1&&s6.si===0,s6.progress);
    /* 7: the same fields, the paper, plain, Done */
    const F1=await fieldsSig(p);ok('7 '+tag+': every field\'s name, id and value the same in Step by step',JSON.stringify(F1)===JSON.stringify(F0),{n0:F0.length,n1:F1.length,d:F1.filter((x,i)=>x!==F0[i]).slice(0,3)});
    const P1=await printSig(p);ok('7 '+tag+': the print media lays the page out as with Step by step off',P1.h===P0.h&&P1.n===P0.n,{P0,P1});
    /* 4: DD-1's own hidden question: Days shown -> Custom range shows From and To on the Graphs sheet */
    if(f.id==='DD-1'){const r=await p.evaluate(async()=>{const go=v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');b.click();};go('results');await new Promise(r=>setTimeout(r,900));fx2Layout.step.build();await new Promise(r=>setTimeout(r,300));
        const sel=document.getElementById('r_rng');const was=sel.value;const t0=fx2Layout.step.state().qs.length;const opt=[...sel.options].find(o=>/custom/i.test(o.value+o.text));if(!opt)return null;
        sel.value=opt.value;sel.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,900));const S1=fx2Layout.step.state();
        sel.value=was;sel.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,900));const t2=fx2Layout.step.state().qs.length;
        return {t0,t1:S1.qs.length,from:S1.qs.some(q=>/^From/.test(q.title)),t2};});
      ok('4 '+tag+': DD-1\'s Custom range shows From and To, and they join the questions ('+(r&&r.t0)+' then '+(r&&r.t1)+'), and leave again ('+(r&&r.t2)+')',r&&r.t1>r.t0&&r.from&&r.t2===r.t0,r);
      /* the live recorder (a runner), once shown, is one question on a screen of its own */
      const lv=await p.evaluate(async()=>{const go=v=>{document.querySelector('#viewSeg button[data-view="'+v+'"]').click();};go('data');await new Promise(r=>setTimeout(r,900));fx2Layout.step.build();await new Promise(r=>setTimeout(r,300));
        const L=document.getElementById('ddLive'),btn=()=>[...L.querySelectorAll('.ddl-hd button')].find(x=>/show|hide/i.test(x.textContent));const t0=fx2Layout.step.state().qs.length;const b=btn();if(!b)return null;b.click();await new Promise(r=>setTimeout(r,900));
        const S=fx2Layout.step.state(),i=S.qs.findIndex(q=>/ddl/.test(q.tag));let alone=null;if(i>=0){const has=()=>fx2Layout.step.state().screen.indexOf(i)>=0;while(!has()&&fx2Layout.step.state().at>0)fx2Layout.step.back();while(!has()&&fx2Layout.step.state().at<S.screens-1)fx2Layout.step.next();await new Promise(r=>setTimeout(r,300));const S2=fx2Layout.step.state();alone=S2.screen.length===1&&S2.screen[0]===i;}
        const q=i>=0?S.qs[i]:null;const b2=btn();if(b2)b2.click();await new Promise(r=>setTimeout(r,900));return {t0,t1:S.qs.length,q,alone,t2:fx2Layout.step.state().qs.length};});
      ok('4 '+tag+': DD-1\'s live recorder, once shown, joins as one question ('+(lv&&lv.q&&lv.q.n)+' boxes) on a screen of its own, and leaves when hidden',lv&&lv.q&&lv.q.heavy&&lv.alone&&lv.t1===lv.t0+1&&lv.t2===lv.t0,lv);
      await view(vs[0]);await sleep(600);}
    const pl=await p.evaluate(()=>{const P=window.nbhPolish;if(!P||!P.plain)return null;P.plain(true);const during=document.querySelectorAll('[data-fx2-st]').length,cls=document.documentElement.classList.contains('fx2-st');P.plain(false);
      return new Promise(r=>setTimeout(()=>r({during,cls,after:document.querySelectorAll('[data-fx2-st="q"]').length}),400));});
    ok('7 '+tag+': while the page is plain (a print, the master packet) no mark is in it; the marks come back after',pl&&!pl.during&&!pl.cls&&pl.after>0,pl);
    await p.evaluate(()=>fx2Layout.step.review());await sleep(400);await press('.fx2-stbar .fx2-stnext');await sleep(700);
    const off=await p.evaluate(()=>({on:fx2Layout.step.on(),marks:document.querySelectorAll('[data-fx2-st],[data-fx2-stf],[data-fx2-scan]').length,bar:!!document.querySelector('.fx2-stbar,.fx2-strev'),cls:document.documentElement.classList.contains('fx2-st')}));
    const F2=await fieldsSig(p);
    ok('7 '+tag+': Done shows the whole form (All at once), no mark left, the fields as they were',!off.on&&!off.marks&&!off.bar&&!off.cls&&JSON.stringify(F2)===JSON.stringify(F0),off);
  }catch(e){ok(tag+': the checks ran',false,String(e&&e.stack||e).slice(0,600));}
  ok('8 '+tag+': no page errors',!errs.length,errs.slice(0,4));
  await ctx.close();}

(async()=>{const br=await L.chromium.launch();
  if(!LIST.length)ok('the forms named are among the eleven',false,named);
  for(const f of LIST)for(const sz of SIZES)await run(br,f,sz);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
