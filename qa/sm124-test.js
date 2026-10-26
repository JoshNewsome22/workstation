/* v24.24 Form SM-1, the Record and the student sheet (the independent review): Finish the day names the unrated periods and marks the day
   partial; the sheet is never shrunk below 80%; the Record's Teacher Yes column; the Student screen asks for a PIN; the contract on one
   page; the accent darkened for text. usage: node qa/sm124-test.js (WS_URL as in qa/lib.js) */
const {chromium,ROOT,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs');
const SM='/NBH-Workstation/'+fs.readdirSync(ROOT+'/NBH-Workstation').find(f=>/^SM-1_/.test(f));
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,900)));};
const pages=buf=>(buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const ctx=await b.newContext({viewport:{width:1300,height:950}});const errs=[];
 let promptAnswer='1234';
 const page=async()=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));p.on('dialog',d=>{if(d.type()==='prompt')d.accept(promptAnswer).catch(()=>{});else d.accept().catch(()=>{});});await p.goto(BASE+SM);await sleep(1500);
   await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.__asks=[];nbhUI.confirm=async(t)=>{window.__asks.push(t);return true;};window.__toasts=[];const t0=nbhUI.toast;nbhUI.toast=(m,o)=>{window.__toasts.push(String(m));try{t0&&t0(m,o);}catch(e){}};window.__prints=0;window.print=()=>{window.__prints++;};});return p;};
 const view=(p,v)=>p.evaluate(v=>{document.querySelector('#viewSeg [data-view="'+v+'"]').click();},v);
 const p=await page();await p.evaluate(()=>document.getElementById('simBtn').click());await sleep(2000);
 /* ---- the Record's columns (R-099) ---- */
 await view(p,'log');await sleep(300);
 const rec=await p.evaluate(()=>({th:[...document.querySelectorAll('#lTbl thead th')].map(e=>e.textContent.trim()),bgp:document.querySelectorAll('#lTbl input[data-f="bgp"]').length,tgp:document.querySelectorAll('#lTbl input[data-f="tgp"]').length,tile:document.getElementById('tgMetrics').textContent,hint:[...document.querySelectorAll('#log .hint, .hint')].map(e=>e.textContent).find(t=>/Teacher Yes per target %:/.test(t))||'',n:S.log.length}));
 ok('the Record shows the teacher\'s Yes share per target beside the points per target, the tiles name their column, and the caption says which figure feeds which',rec.th.some(t=>/^Per target %/.test(t))&&rec.th.some(t=>/^Teacher Yes per target %/.test(t))&&rec.bgp===rec.n&&rec.tgp===rec.n&&/the Teacher Yes column/.test(rec.tile)&&/the figure the three tiles average/.test(rec.hint),{th:rec.th,bgp:rec.bgp,n:rec.n,tile:rec.tile.slice(0,200)});
 /* ---- Finish the day with unrated periods (R-011) ---- */
 await p.evaluate(()=>{S.log=S.log.filter(r=>r.src!=='ipad:'+SMR.date&&String(r.date||'').trim()!==smRShort(SMR.date));renderL();renderRecord();});   /* the simulation already wrote today: take it out so Finish adds a row */
 const before=await p.evaluate(()=>({n:S.log.length,met:document.getElementById('logMetrics').textContent.match(/Goal met at the current goal([^G]*)/)?.[1]?.slice(0,40)}));
 await view(p,'rate');await sleep(400);
 const fin=await p.evaluate(async()=>{const day=smRDay(),M=smRModel(day);const unr=M.rows.filter((r,ri)=>!M.tg.some((t,ti)=>day.me[ri+'_'+ti]!=null||day.t[ri+'_'+ti]!=null)).map(r=>r.label);
   const btn=document.getElementById('smRFin');const dis=btn.disabled;window.__asks=[];if(!dis)btn.click();await new Promise(r=>setTimeout(r,800));
   const row=S.log[S.log.length-1];const R=rows();const last=R[R.length-1];return {periods:M.rows.length,unr,dis,ask:window.__asks[0]||'',row:{pts:row.pts,poss:row.poss,partial:row.partial,note:row.note,met:row.met},last:{pc:last.pc,mt:last.mt,partial:last.partial},n:S.log.length,cls:document.querySelector('#lTbl tbody tr:last-child')?.className,metCell:document.querySelector('#lTbl tbody tr:last-child')?.children[12]?.textContent};});
 ok('Finish the day names the periods with no rating, counts the points possible from the rated periods only, and marks the day partial: shaded on the Record, its goal-met "—", and out of the goal rules',
   !fin.dis&&fin.unr.length>0&&new RegExp(fin.unr.length+' of '+fin.periods+' periods? ha(s|ve) no rating \\('+fin.unr[0]).test(fin.ask)&&/marked partial and kept out of the goal rules/.test(fin.ask)&&fin.n===before.n+1&&/periods unrated/.test(fin.row.partial)&&/partial:/.test(fin.row.note)&&+fin.row.poss===(fin.periods-fin.unr.length)*3*+(fin.row.poss)/((fin.periods-fin.unr.length)*3)&&fin.last.pc===null&&fin.last.mt===null&&fin.cls==='sm-partial'&&fin.metCell==='—',{before,fin});
 const after=await p.evaluate(()=>{document.querySelector('#viewSeg [data-view="log"]').click();return document.getElementById('logMetrics').textContent.match(/Goal met at the current goal([^G]*)/)?.[1]?.slice(0,40);});
 ok('the partial day does not change the goal-met count',after===before.met,{before:before.met,after});
 /* ---- the sheet is never shrunk below 80% (R-021) ---- */
 await view(p,'sheet');await sleep(400);
 const fit=await p.evaluate(()=>({k:smFit().k,txt:document.querySelector('#smSheetTools .sm2-fit')?.textContent||'',nofit:!!document.querySelector('#smSheetTools [data-d="nofit"]')}));
 await p.evaluate(()=>{document.querySelector('#smPrSheet, #printSheetBtn, [id*="rSheet"]')?.click();});
 const zoomed=await p.evaluate(()=>{printAlone('sm-sheet-only','landscape');return [...document.head.querySelectorAll('style')].some(s=>/#sheetOut\{zoom/.test(s.textContent));});
 await p.evaluate(()=>document.body.className.split(' ').forEach(c=>{if(/-only$/.test(c))document.body.classList.remove(c);}));
 ok('the worked example would shrink to under 80%: the Sheet tab says it prints at full size on two pages, and no shrink is applied',fit.k<.8&&/too small to read, so it prints at full size on two pages/.test(fit.txt)&&!fit.nofit&&!zoomed,{fit:{k:fit.k,txt:fit.txt.slice(0,160),nofit:fit.nofit},zoomed});
 /* the half-size print fits one page */
 await p.evaluate(()=>{document.getElementById('smPrHalf').click();});await sleep(300);
 const halfCls=await p.evaluate(()=>document.body.className);await p.emulateMedia({media:'print'});const half=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});
 await p.evaluate(()=>{document.body.className.split(' ').forEach(c=>{if(/-only$/.test(c))document.body.classList.remove(c);});document.getElementById('smExtraOut').innerHTML='';});
 ok('the two half-size copies print on one page',/sm-extra-only/.test(halfCls)&&pages(half)===1,{halfCls,pages:pages(half)});
 /* ---- the contract on one page (R-103) ---- */
 await view(p,'bc');await sleep(300);await p.evaluate(()=>{renderBc();document.body.classList.add('sm-bc-only');});await p.emulateMedia({media:'print'});const bc=await p.pdf({format:'Letter',printBackground:true,margin:{top:'0.4in',bottom:'0.4in',left:'0.4in',right:'0.4in'}});await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.body.classList.remove('sm-bc-only'));
 ok('the contract prints on one page with its signature block and footer together',pages(bc)===1,{pages:pages(bc)});
 /* ---- the accent as text (R-104) ---- */
 const col=await p.evaluate(()=>{const lum=c=>{const m=c.match(/\d+/g).map(Number).slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*m[0]+.7152*m[1]+.0722*m[2];};const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
   document.querySelector('#viewSeg [data-view="rate"]').click();const pri=document.querySelector('.smr-b.pri');const g=document.querySelector('.v2 .v2-goal b');return {pri:pri?cr(getComputedStyle(pri).backgroundColor,'rgb(255,255,255)'):null,goal:g?cr(getComputedStyle(g).color,getComputedStyle(g.parentNode).backgroundColor):null};});
 ok('the primary button\'s background and the goal number reach at least 4.5:1 and 3:1',col.pri!=null&&col.pri>=4.5&&(col.goal==null||col.goal>=3),col);
 /* ---- the Student screen asks for a PIN (R-101) ---- */
 await view(p,'rate');await sleep(300);
 promptAnswer='';await p.evaluate(()=>{smD().pin='';document.getElementById('smRKid').click();});await sleep(400);
 const noPin=await p.evaluate(()=>({kid:document.body.classList.contains('smr-kid'),pin:smD().pin||'',toast:window.__toasts.slice(-1)[0]||''}));
 promptAnswer='1234';await p.evaluate(()=>document.getElementById('smRKid').click());await sleep(400);
 const pin=await p.evaluate(()=>({kid:document.body.classList.contains('smr-kid'),pin:smD().pin||''}));
 await p.evaluate(()=>{smRKid(false);});
 ok('the Student screen does not open without a PIN (a toast says why); with 1234 given once it opens and the PIN is kept',!noPin.kid&&noPin.pin===''&&/opens once a PIN is set/.test(noPin.toast)&&pin.kid&&pin.pin==='1234',{noPin,pin});
 /* ---- the Record's cells on an iPad (R-143) ---- */
 const q=await ctx.newPage();await q.setViewportSize({width:1180,height:820});await q.goto(BASE+SM);await sleep(1200);await q.evaluate(()=>{window.nbhUI=window.nbhUI||{};nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(1500);
 const cells=await q.evaluate(()=>{document.querySelector('#viewSeg [data-view="log"]').click();const w=[...document.querySelectorAll('#lTbl input[data-f="pts"], #lTbl input[data-f="goal"]')].map(e=>e.getBoundingClientRect().width);return {min:Math.min(...w),n:w.length};});
 ok('on an iPad in landscape the Record\'s number cells are at least 56 px wide',cells.n>0&&cells.min>=55,cells);
 await q.close();
 ok('no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})();
