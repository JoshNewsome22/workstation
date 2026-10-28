/* v24.41 Form TD-1's Build cards on the iPad: a card filled from the protocol bank lays its settings one a row with every box
   aligned; Run by, When and Where carry one example line each, not a placeholder as well. v24.89 (the 10/28 design review): the
   label sits above its box with the example under the label, at 15 px and 16 px, and the example reads "For example".
   usage: node qa/ux141-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const F='TD-1_Function-Based-Treatment-Developer_v2026-09.html';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 async function card(width,touch){const ctx=await b.newContext({viewport:{width,height:1000},hasTouch:!!touch,isMobile:!!touch});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(width+': '+String(e).slice(0,100)));
   await p.goto(BASE+'/NBH-Workstation/'+F);await sleep(1500);
   const r=await p.evaluate(async()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;nbhUI.toast=nbhUI.toast||(()=>{});
     const vb=document.querySelector('#viewSeg button[data-view="build"]');if(vb)vb.click();await new Promise(r=>setTimeout(r,300));const sel=document.getElementById('addComp');sel.value='TA_CHAIN';document.getElementById('addCompBtn').click();await new Promise(r=>setTimeout(r,300));const c=document.querySelector('#compWrap .card[data-code="TA_CHAIN"]');c.classList.add('td-from-bank');   /* as a protocol from the bank marks it */
     const bank=[...document.querySelectorAll('#compWrap .card')].filter(k=>k.classList.contains('td-from-bank'));
     await new Promise(r=>setTimeout(r,900));
     const fs=[...c.querySelectorAll('.param .f')].map(f=>{const l=f.querySelector('label'),i=f.querySelector('input,textarea');const lr=l.getBoundingClientRect(),ir=i.getBoundingClientRect();return {label:l.textContent.trim().slice(0,22),lx:Math.round(lr.left),ix:Math.round(ir.left),ly:Math.round(lr.top),iy:Math.round(ir.top),iw:Math.round(ir.width),fs:getComputedStyle(i).fontSize,lfs:getComputedStyle(l).fontSize,short:i.classList.contains('td9-short')};});
     const who=[...c.querySelectorAll('.td-who label')].map(l=>{const i=l.querySelector('input'),eg=l.querySelector('small.eg');const hints=[...l.querySelectorAll('.nbh-hint, [data-nbh-hint], small, .nbh-eg')].filter(e=>e.offsetParent).map(e=>e.textContent.trim());return {ph:i.getAttribute('placeholder')||'',eg:eg?eg.textContent.trim():'',hints:hints.length,visible:!!(eg&&eg.offsetParent)};});
     return {n:bank.length,fs,who,docW:document.documentElement.scrollWidth};});
   await ctx.close();return r;}
 const ipad=await card(1180,true);
 const xs=ipad.fs.map(f=>f.ix),same=Math.max(...xs)-Math.min(...xs);
 ok('iPad (1180 px): a chaining card from the bank lays its seven settings one a row, each label above its box and every box starting at the same x',ipad.fs.length>=6&&same<=1&&ipad.fs.every(f=>f.iy>f.ly+8&&Math.abs(f.ix-f.lx)<=2),{same,fs:ipad.fs.slice(0,4)});
 ok('the boxes are wide (over half the card; a count is a short box with the number keypad) and the label and box text sizes sit a step apart (15 px and 16 px)',ipad.fs.every(f=>(f.iw>400||f.short&&f.iw>=120)&&f.fs==='16px'&&f.lfs==='15px'),ipad.fs.slice(0,2));
 ok('Run by, When and Where carry one example line each under the box and no placeholder inside it',ipad.who.length===3&&ipad.who.every(w=>!w.ph&&/^For example, /.test(w.eg)&&w.visible&&w.hints===1),ipad.who);
 const phone=await card(560,true);
 ok('phone (560 px): the labels sit above their boxes, the boxes at the card\'s left edge, nothing widening the page',phone.fs.every(f=>f.iy>f.ly+8&&Math.abs(f.ix-f.lx)<=2)&&phone.docW===560,{fs:phone.fs.slice(0,3),docW:phone.docW});
 const desk=await card(1400,false);
 ok('desktop (1400 px): the same column layout on a card from the bank',Math.max(...desk.fs.map(f=>f.ix))-Math.min(...desk.fs.map(f=>f.ix))<=1,desk.fs.slice(0,3));
 ok('no page errors',!errs.length,errs.slice(0,3));
 console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));await b.close();process.exit(bad?1:0);})();
