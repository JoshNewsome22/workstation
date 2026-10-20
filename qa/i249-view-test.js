/* v23.63 (review Wave 4, I249): text size and contrast, on screen only.
   1. Help's Text size and Contrast buttons set it, kept on this device (nbh.view), for the workstation and every form: an
      open form is told at once, a form opened later as it loads, a form opened on its own reads it; Normal clears it.
   2. Larger and Largest make a form's text 15 and 30 per cent bigger; High contrast makes its text black and its notes and
      field borders darker.
   3. Paper is never changed: printed, a form lays out exactly as with the setting off.
   4. At Largest, on an upright iPad's width, no form scrolls sideways that did not at Normal, and none has a page error.
   Simulated data only.  usage: node qa/i249-view-test.js   env ONLY=TB-1,DD-1 for some forms in part 4 */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
const only=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:900}});ctx.on('dialog',d=>d.accept().catch(()=>{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(900);
  await p.evaluate(()=>{try{localStorage.removeItem('nbh.view');}catch(e){}});
  await p.evaluate(()=>openForm('TB-1'));await p.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:20000}).catch(()=>{});await sleep(800);
  const fr=()=>p.frames().find(f=>/TB-1_/.test(f.url()));
  const size=async f=>f.evaluate(()=>{const h=[...document.querySelectorAll('label,p,th,td,legend')].find(e=>e.offsetParent&&e.getClientRects().length&&e.textContent.trim().length>3);return h?h.getBoundingClientRect().height:0;});
  const lum=c=>{const m=/(\d+), (\d+), (\d+)/.exec(c||'');return m?(+m[1]*0.2126+ +m[2]*0.7152+ +m[3]*0.0722):999;};
  const look=async f=>f.evaluate(()=>{const i=[...document.querySelectorAll('input[type=text],textarea')].find(x=>x.offsetParent);const n=[...document.querySelectorAll('.hint,.muted,.help,small,.note,.method')].find(x=>x.offsetParent);
    return {color:getComputedStyle(document.body).color,border:i?getComputedStyle(i).borderTopColor:'',note:n?getComputedStyle(n).color:''};});
  const h0=await size(fr()),l0=await look(fr());
  await p.evaluate(()=>document.getElementById('help').click());await sleep(600);
  await p.evaluate(()=>{const d=[...document.querySelectorAll('#dlgBody details')].find(x=>/Side by side/.test(x.querySelector('summary').textContent));d.open=true;});
  const btn=await p.evaluate(()=>[...document.querySelectorAll('[data-view-t],[data-view-hc]')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed')));
  await p.click('[data-view-t="2"]');await sleep(700);
  const a=await p.evaluate(()=>({kept:localStorage.getItem('nbh.view'),shell:document.documentElement.className,dlg:getComputedStyle(document.getElementById('dlg')).zoom}));
  const fa=await fr().evaluate(()=>document.documentElement.className);const h2=await size(fr());
  ok('1a Help shows Text size (Normal, Larger, Largest) and Contrast (Normal, High); Largest is kept on this device, the dialogs follow and the open form is told at once',
    btn.length===5&&/"t":2/.test(a.kept||'')&&/nbh-tx-2/.test(a.shell)&&+a.dlg>1.2&&/nbh-tx-2/.test(fa),{btn,a,fa});
  ok('2a Largest: the form\'s text is about 30 per cent bigger ('+h0.toFixed(1)+' to '+h2.toFixed(1)+' px)',h0>0&&h2/h0>1.22&&h2/h0<1.38,{h0,h2});
  await p.click('[data-view-hc="1"]');await sleep(700);
  const hc=Object.assign(await look(fr()),{cls:await fr().evaluate(()=>document.documentElement.className)});
  ok('2b High contrast: the form\'s text is black, its field borders and its notes darker than at Normal',/nbh-hc/.test(hc.cls)&&hc.color==='rgb(0, 0, 0)'&&lum(hc.border)<lum(l0.border)&&(!l0.note||lum(hc.note)<lum(l0.note)),{l0,hc});
  /* a form opened later, and one opened on its own */
  await p.evaluate(()=>{try{$('#dlg').close();}catch(e){}openForm('CF-1');});await p.waitForFunction(()=>!!state.status['CF-1'],null,{timeout:20000}).catch(()=>{});await sleep(800);
  const later=await p.frames().find(f=>/CF-1_/.test(f.url())).evaluate(()=>document.documentElement.className);
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('alone: '+e.message));const forms=L.forms();
  await q.goto(L.BASE+'/NBH-Workstation/'+encodeURI(forms.find(f=>f.id==='DD-1').file));await sleep(1200);
  const alone=await q.evaluate(()=>document.documentElement.className);
  ok('1b a form opened later is told as it loads, and a form opened on its own reads the setting',/nbh-tx-2/.test(later)&&/nbh-hc/.test(later)&&/nbh-tx-2/.test(alone)&&/nbh-hc/.test(alone),{later,alone});
  /* 3. paper: the print layout with the setting on is the one with it off */
  const sig=async f=>f.evaluate(()=>{const out=[];const all=document.querySelectorAll('body *');for(let i=0;i<all.length&&out.length<1500;i++){const r=all[i].getBoundingClientRect();if(r.width||r.height)out.push(Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+','+Math.round(r.height));}
    let h=5381;const s=out.join('|');for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return {n:out.length,h:h>>>0,H:document.documentElement.scrollHeight};});
  await q.emulateMedia({media:'print'});await sleep(400);const pOn=await sig(q);
  await q.evaluate(()=>nbhUI.view.apply({}));await sleep(400);const pOff=await sig(q);await q.emulateMedia({media:'screen'});
  ok('3 printed, a form lays out exactly as with the setting off (DD-1, '+pOn.n+' boxes)',pOn.n>50&&pOn.h===pOff.h&&pOn.H===pOff.H,{pOn,pOff});
  /* Normal clears it */
  await p.evaluate(()=>{viewSet({t:0,hc:false});});await sleep(700);
  const n=await p.evaluate(()=>({kept:localStorage.getItem('nbh.view'),shell:document.documentElement.className}));const fn=await fr().evaluate(()=>document.documentElement.className);
  ok('1c Normal and Normal contrast clear it, in the workstation and the forms',n.kept===null&&!/nbh-tx|nbh-hc/.test(n.shell)&&!/nbh-tx|nbh-hc/.test(fn),{n,fn});
  /* 4. every form at Largest on an upright iPad's width */
  const c2=await br.newContext({viewport:{width:1024,height:1366}});c2.on('dialog',d=>d.accept().catch(()=>{}));
  const wide=[],perr=[];
  for(const f of forms.filter(x=>!only.length||only.includes(x.id))){const pg=await c2.newPage();pg.on('pageerror',e=>perr.push(f.id+': '+e.message));
    await pg.goto(L.BASE+'/NBH-Workstation/'+encodeURI(f.file));await sleep(900);
    const sw=async()=>pg.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    const s0=await sw();await pg.evaluate(()=>nbhUI.view.apply({t:2,hc:true}));await sleep(700);const s2=await sw();
    if(s2>4&&s2>s0+4)wide.push(f.id+' '+s0+' > '+s2);await pg.close();}
  ok('4 at Largest on an upright iPad\'s width, no form scrolls sideways that did not at Normal, and none has a page error ('+(only.length||forms.length)+' forms)',!wide.length&&!perr.length,{wide,perr:perr.slice(0,4)});
  ok('5 no page errors',!errs.length,errs.slice(0,4));
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
