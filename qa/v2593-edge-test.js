/* v25.93 (the BCBA, 11/12, with a picture of the installed app on an iPad: "Still has the white tint at the top of the
   page") since iPadOS 26 the device blurs the top of an installed web app (the status bar and about 40 points under it)
   unless a solid bar is fixed to the top edge of the screen. In the installed app on an iPad or iPhone the workstation's
   dark top bar is now fixed there, and an empty row of its height keeps the page under it where it was.
   This test cannot see the device's blur. It checks what the device is reported to look for, and that nothing moved.
   A  in a browser (not installed) nothing changes: no class, the top bar is the first row of the column as before;
   B  installed (navigator.standalone): the top bar is fixed at the very top, full width, more than 10 px tall, with a
      solid colour (the bar's own, #1f3a4d), and it is what lies 4 px under the middle of the top edge;
   C  nothing moved: the start screen is the same picture with the bar fixed and (the installed app with ?edge=0) not
      fixed: no pixel differs by more than the smoothing of letters does between two loads of one page;
   D  the same with a menu of the top bar open, and with a form open (the bars over the form);
   E  the empty row follows the bar: a bar that is hidden leaves no gap;
   F  ?edge=0 turns it off in the installed app, ?edge=1 turns it on in a browser.
   Simulated people only. usage: node qa/v2593-edge-test.js   (WS_URL and WS_ROOT as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;const zlib=require('zlib');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const open=async(installed,q)=>{const ctx=await br.newContext({viewport:{width:1376,height:1032},hasTouch:true,serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
    if(installed)await p.addInitScript(()=>{Object.defineProperty(Navigator.prototype,'standalone',{get:()=>true,configurable:true});});
    await p.addInitScript(()=>{try{localStorage.setItem('nbh.ws.whatsnew.seen','all');}catch(e){}});
    const u=L.shellUrl();await p.goto(u+(q?(u.includes('?')?'&':'?')+q:''));await sleep(1800);
    await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});await sleep(200);return {p,ctx};};
  const facts=p=>p.evaluate(()=>{const R=document.documentElement,h=document.querySelector('header.top'),cs=getComputedStyle(h),r=h.getBoundingClientRect(),sp=getComputedStyle(document.body,'::before'),
      at=document.elementFromPoint(Math.round(innerWidth/2),4),next=[...document.body.children].find(e=>e!==h&&e.getBoundingClientRect().height>0&&getComputedStyle(e).position==='static'&&!/^(SCRIPT|STYLE)$/.test(e.tagName));
    return {edge:R.classList.contains('ws-edge'),flag:window.__wsEdge,wsa:document.body.classList.contains('ws-a'),pos:cs.position,bg:cs.backgroundColor,top:Math.round(r.top),left:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),vw:innerWidth,
      under:!!at&&h.contains(at),spacer:sp.content==='none'||sp.display==='none'?0:Math.round(parseFloat(sp.height)||0),nextTop:next?Math.round(next.getBoundingClientRect().top):null,nextTag:next?next.tagName+'.'+next.className:''};});
  /* two pictures, compared as their pixels (PNG: the same pixels make the same bytes only by chance of the encoder, so they are decoded) */
  const px=buf=>{let o=8,idat=[],w=0,h=0;while(o<buf.length){const n=buf.readUInt32BE(o),t=buf.toString('latin1',o+4,o+8);if(t==='IHDR'){w=buf.readUInt32BE(o+8);h=buf.readUInt32BE(o+12);}if(t==='IDAT')idat.push(buf.subarray(o+8,o+8+n));o+=12+n;}
    const raw=zlib.inflateSync(Buffer.concat(idat)),bpp=(raw.length/h-1)/w,st=w*bpp,out=Buffer.alloc(st*h);
    for(let y=0;y<h;y++){const f=raw[y*(st+1)],row=raw.subarray(y*(st+1)+1,(y+1)*(st+1));for(let x=0;x<st;x++){const a=x>=bpp?out[y*st+x-bpp]:0,b=y?out[(y-1)*st+x]:0,c=x>=bpp&&y?out[(y-1)*st+x-bpp]:0;let v=row[x];
        if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c);v+=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}out[y*st+x]=v&255;}}
    return {w,h,bpp,out};};
  const differ=(b1,b2)=>{const A=px(b1),B=px(b2);if(A.w!==B.w||A.h!==B.h||A.bpp!==B.bpp)return -1;let n=0;for(let i=0;i<A.out.length;i+=A.bpp){for(let k=0;k<A.bpp;k++)if(Math.abs(A.out[i+k]-B.out[i+k])>8){n++;break;}}return n;};   /* a step of 8 in 255: the letters of a bar drawn as its own layer are smoothed a shade differently (2 in 255 here, and so are two loads of the same page) */
  const B0=await open(false);const a=await facts(B0.p);await B0.ctx.close();
  /* the installed app twice: with the bar fixed (I) and, by ?edge=0, as it was (N), so the two differ in nothing else */
  const N=await open(true,'edge=0'),I=await open(true);
  const n=await facts(N.p),b=await facts(I.p);
  ok('A in a browser nothing changes: no class, the dark top bar is the first row of the column (not fixed), no empty row',a.wsa&&!a.edge&&a.flag===false&&a.pos!=='fixed'&&a.spacer===0&&a.top===0,a);
  ok('B installed: the top bar is fixed at the very top, across the whole width, more than 10 px tall, a solid #1f3a4d, and it is what lies 4 px under the middle of the top edge; the empty row is as tall as the bar',
    b.wsa&&b.edge&&b.flag===true&&b.pos==='fixed'&&b.top===0&&b.left===0&&b.w===b.vw&&b.w>=.9*b.vw&&b.h>10&&b.bg==='rgb(31, 58, 77)'&&b.under&&b.spacer===b.h&&b.h===a.h,b);
  const d0=differ(await N.p.screenshot({type:'png'}),await I.p.screenshot({type:'png'}));
  ok('C nothing moved: what follows the bar starts where it did, and the start screen is the same picture (no pixel differs by more than letter smoothing)',b.nextTop===n.nextTop&&n.nextTop===n.h&&!n.edge&&n.pos!=='fixed'&&d0===0,{n:n.nextTop,b:b.nextTop,tag:n.nextTag,d0});
  /* a menu of the top bar */
  const menu=async p=>{const t=p.locator('#wsNav button[aria-haspopup],#wsNav [aria-expanded]').first();await t.click();await sleep(400);return p.evaluate(()=>{const m=[...document.querySelectorAll('[role="menu"],.wa-menu,#wsViewMenu,#wsSheetMenu')].find(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden');const r=m&&m.getBoundingClientRect();return r?[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]:null;});};
  const m1=await menu(N.p),m2=await menu(I.p);const d1=differ(await N.p.screenshot({type:'png'}),await I.p.screenshot({type:'png'}));
  await N.p.keyboard.press('Escape');await I.p.keyboard.press('Escape');await sleep(200);
  /* a form open: the bars over the form */
  const form=async p=>{await p.evaluate(()=>openForm('TD-1'));await sleep(2500);return p.evaluate(()=>{const h=document.querySelector('header.top'),r=h.getBoundingClientRect(),f=document.querySelector('iframe'),fr=f&&f.getBoundingClientRect();return {ov:document.body.classList.contains('ws-ov'),pos:getComputedStyle(h).position,head:[Math.round(r.top),Math.round(r.height)],frame:fr?[Math.round(fr.left),Math.round(fr.top),Math.round(fr.width),Math.round(fr.height)]:null};});};
  const f1=await form(N.p),f2=await form(I.p);
  ok('D a menu of the top bar opens in the same place and the picture is the same; with a form open the top bar and the form’s frame are where they were',
    !!m1&&JSON.stringify(m1)===JSON.stringify(m2)&&d1===0&&!!f1.frame&&JSON.stringify(f1.frame)===JSON.stringify(f2.frame)&&JSON.stringify(f1.head)===JSON.stringify(f2.head)&&f1.ov===f2.ov,{m1,m2,d1,f1,f2});
  await I.p.evaluate(()=>{document.querySelector('header.top').style.display='none';});await sleep(300);const e1=await I.p.evaluate(()=>{const sp=getComputedStyle(document.body,'::before');return {v:getComputedStyle(document.documentElement).getPropertyValue('--ws-edge-h').trim(),h:sp.content==='none'?0:Math.round(parseFloat(sp.height)||0)};});
  await I.p.evaluate(()=>{document.querySelector('header.top').style.display='';});await sleep(300);const e2=await I.p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ws-edge-h').trim());
  ok('E the empty row follows the bar: a hidden bar leaves no gap, and the row comes back with the bar',e1.v==='0px'&&e1.h===0&&e2===b.h+'px',{e1,e2});
  await N.ctx.close();await I.ctx.close();
  const O=await open(true,'edge=0'),P=await open(false,'edge=1');const o=await facts(O.p),q=await facts(P.p);
  ok('F ?edge=0 turns it off in the installed app; ?edge=1 turns it on in a browser',!o.edge&&o.pos!=='fixed'&&o.spacer===0&&q.edge&&q.pos==='fixed'&&q.spacer===q.h,{o,q});
  await O.ctx.close();await P.ctx.close();
  ok('Z no page error',!errs.length,errs.slice(0,4));
 }catch(e){ok('the run finished without an exception',false,String(e&&e.stack||e));}
 await br.close();console.log(fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed');process.exitCode=fails?1:0;})();
