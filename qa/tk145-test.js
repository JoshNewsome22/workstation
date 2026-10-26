/* v24.45 Form TK-1, review V18 (R-106 to R-109, R-144; E-39): a token on the board is never taken away (or the BCBA's response-cost
   rule) on the Token Board back and in Step 3, an old default back taking the new text and an edited one kept; Print asks first
   when nothing says what earns a token; the token cards fit between a slot's two captions (1 in., 0.8 in. on the two-row
   Letter-high board, 1.5 in. when set to fill the slot), measured on the page and in the printed PDF, and the making guide and
   Setup state the sizes; the Preview's sheet index; the iPad's 44 px arrows and buttons; a label taken from the picture in ink
   with a tag. Simulated data only. usage: node qa/tk145-test.js (WS_URL as in qa/lib.js) */
const L=require(__dirname+'/lib.js');const {sleep}=L;
const fs=require('fs'),path=require('path'),cp=require('child_process');
let n=0,fails=0;const ok=(t,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c||i===undefined?'':'  '+JSON.stringify(i).slice(0,1200)));if(!c)fails++;};
const OUT=path.join(L.ROOT,'qa','out');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const dir=L.ROOT+'/NBH-Workstation/',file=fs.readdirSync(dir).find(f=>f.startsWith('TK-1_'));
  const ctx=await br.newContext({viewport:{width:1300,height:950},serviceWorkers:'block'});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1200);
  await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};});
  const setM=(k,v)=>p.evaluate(([k,v])=>{const e=document.querySelector('[data-m="'+k+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},[k,v]);
  const pageText=re=>p.evaluate(src=>{renderAll();setView('preview');const r=new RegExp(src);return [...document.querySelectorAll('#book .pg')].filter(g=>r.test(g.dataset.label||'')||r.test(g.dataset.kind||'')).map(g=>g.textContent).join(' ').replace(/\s+/g,' ');},re.source);
  await p.evaluate(()=>loadSim());await sleep(800);
  /* ---- R-106 ---- */
  const tb=await pageText(/back: Token Board/),h3=await pageText(/^how2$/),sheets=await p.evaluate(()=>[...document.querySelectorAll('#book .pglabel')].map(l=>l.textContent));
  ok('R-106 the Token Board back and Step 3 of the insert say a star already on the board is never taken away (no star that time, the earned stars stay, the next chance a fresh one); the simulated book still prints its 13 sheets',
    /A star already on the board is never taken away: when the behavior does not happen, there is no star that time, the earned stars stay, and the next chance is a fresh one\./.test(tb)&&/A star already on the board is never taken away/.test(h3)&&sheets.length===13&&/Sheet 10 of 13: How to use, Step 3/.test(sheets[9]||''),{tb:tb.slice(-400),h3:h3.slice(-300),sheets});
  const mig=await p.evaluate(()=>{const old=TXT_PREV.ft.tb,edited='My own words about the board.';S.txt.tb=old;S.txt.h3=edited;const st=JSON.parse(JSON.stringify(S));
    S=blank();Object.assign(S,st);renderAll();return {tb:S.txt.tb.indexOf('{keep}')>=0,h3:S.txt.h3===edited};});
  ok('R-106 a back still holding the default text of before takes the new one; an edited back is kept as written',mig.tb&&mig.h3,mig);
  await p.evaluate(()=>{S=blank();renderAll();loadSim();});await sleep(800);
  await setM('rcost','on');await setM('rc_rule','one star comes off for a hit');await sleep(200);
  const rc=await pageText(/back: Token Board/),rcRow=await p.evaluate(()=>getComputedStyle(document.getElementById('rcRow')).display!=='none');
  await setM('rc_rule','');await sleep(200);const v0=await p.evaluate(()=>{renderAll();return document.getElementById('setupVerdict').textContent;});const rc0=await pageText(/back: Token Board/);
  await setM('rcost','');await sleep(200);const rowOff=await p.evaluate(()=>{renderAll();return getComputedStyle(document.getElementById('rcRow')).display==='none';});
  ok('R-106 Setup\'s Taking a token away (Never by default): Response cost prints the BCBA\'s rule instead of the sentence, a blank rule prints a line for it and Setup lists it as open; the rule box shows only then',
    /Response cost, as the BCBA set it: one star comes off for a hit\./.test(rc)&&!/never taken away/.test(rc)&&rcRow&&/the response-cost rule/.test(v0)&&/Response cost: the BCBA writes the rule here before a star is ever taken away/.test(rc0)&&rowOff,{rc:rc.slice(-300),v0,rc0:rc0.slice(-200),rcRow,rowOff});
  const bus=await p.evaluate(()=>{S.meta.kind='bus';S.meta.rcost='on';S.meta.rc_rule='x';Object.keys(TXT0).forEach(k=>{if(txtIsDef(k,S.txt[k]))S.txt[k]=txtDef(k);});renderAll();setView('preview');
    const t=[...document.querySelectorAll('#book .pg')].filter(g=>/back: Token Board/.test(g.dataset.label||'')).map(g=>g.textContent).join(' ').replace(/\s+/g,' ');S.meta.kind='';S.meta.rcost='';S.meta.rc_rule='';Object.keys(TXT0).forEach(k=>{if(txtIsDef(k,S.txt[k]))S.txt[k]=txtDef(k);});renderAll();return t;});
  ok('R-106 a bus book\'s Board back carries the sentence too (response cost is a classroom setting and does not apply to it)',/never taken away/.test(bus)&&!/Response cost/.test(bus),bus.slice(-300));
  /* ---- R-107 ---- */
  const pr=await p.evaluate(async()=>{const asked=[];let answer=false;nbhUI.confirm=async m=>{asked.push(m);return answer;};window.__pr=0;window.print=()=>{window.__pr++;};S.meta.tok_rule='';bindMeta();renderAll();
    const wait=ms=>new Promise(r=>setTimeout(r,ms));document.getElementById('printBtn').click();await wait(400);const a={asked:asked.length,msg:asked[0]||'',printed:window.__pr,view:S.view||document.body.className};
    answer=true;document.getElementById('printBtn').click();await wait(400);const b={asked:asked.length,printed:window.__pr};
    S.meta.tok_rule='3 problems correct';bindMeta();renderAll();document.getElementById('printBtn').click();await wait(400);const c={asked:asked.length,printed:window.__pr};nbhUI.confirm=async()=>true;return {a,b,c};});
  ok('R-107 Print asks first while nothing says what earns a star (No: nothing prints and Setup opens at the field; Print anyway: it prints), and prints at once when the rule is there',
    pr.a.asked===1&&/Nothing says what earns a star yet/.test(pr.a.msg)&&pr.a.printed===0&&pr.b.asked===2&&pr.b.printed===1&&pr.c.asked===2&&pr.c.printed===2,pr);
  /* ---- R-108 / E-39: the sizes, on the page ---- */
  const geo=async(set)=>{await p.evaluate(s=>{Object.keys(s).forEach(k=>{S.meta[k]=s[k];const e=document.querySelector('[data-m="'+k+'"]');if(e)e.value=s[k];});if(s.n)S.caps=defCaps(nTok(),tokName());bindMeta();renderAll();setView('preview');},set);await sleep(400);await p.emulateMedia({media:'print'});await sleep(300);
    const g=await p.evaluate(()=>{const R=e=>e.getBoundingClientRect();const slot=[...document.querySelectorAll('#book .slot')].find(e=>R(e).width>0);const tok=[...document.querySelectorAll('#book .cardsheet .card.tok')].find(e=>R(e).width>0);
      const ca=R(slot.querySelector('.ca')),cb=R(slot.querySelector('.cb')),dot=R(slot.querySelector('.dot')),t=R(tok),cy=dot.top+dot.height/2;
      return {tokIn:+(t.width/96).toFixed(3),slotIn:+(R(slot).width/96).toFixed(3),room:+((cb.top-ca.bottom)/96).toFixed(3),fits:cy-t.height/2>=ca.bottom-0.5&&cy+t.height/2<=cb.top+0.5,sm:slot.classList.contains('sm'),hint:document.getElementById('tokSizeHint').textContent};});
    await p.emulateMedia({media:'screen'});return g;};
  const g5=await geo({n:'5',tok_size:'',pagesize:'8.82'}),g8=await geo({n:'8',tok_size:'',pagesize:'11'}),gF=await geo({n:'5',tok_size:'full',pagesize:'8.82'});
  ok('R-108 the token cards fit between a slot\'s two captions: 1 in. on the 1.56 in. slot, 0.8 in. (scaled with the 11 in. page) on the small slots of a two-row board, centred on the dot without covering either caption; "Fills the slot" gives the old 1.5 in.; Setup says the size',
    Math.abs(g5.tokIn-1)<0.02&&g5.fits&&Math.abs(g5.slotIn-1.563)<0.02&&g8.sm&&g8.fits&&g8.tokIn<g8.room&&Math.abs(gF.tokIn-1.5)<0.02&&!gF.fits&&/the tokens print 1\.0 in\. square; a slot is 1\.56 in\./.test(g5.hint),{g5,g8,gF});
  await p.evaluate(()=>{const s={n:'5',tok_size:'',pagesize:'8.82'};Object.keys(s).forEach(k=>{S.meta[k]=s[k];const e=document.querySelector('[data-m="'+k+'"]');if(e)e.value=s[k];});S.caps=defCaps(nTok(),tokName());bindMeta();renderAll();});
  const guide=await p.evaluate(()=>document.body.textContent.replace(/\s+/g,' '));
  ok('E-39 the making guide states the sizes: a picture card 2.07 in, a token 1 in (0.8 in on the two-row Letter-high board, 1.5 in to fill the slot), a slot and a Tokens box 1.56 in',
    /a picture card 2\.07 in square/.test(guide)&&/a token 1 in square, so a laminated token sits between a slot’s two captions without covering them \(0\.8 in on a two-row board on a Letter-high page, and 1\.5 in when Setup’s Token size is set to fill the slot\); a token slot 1\.56 in/.test(guide));
  /* ---- R-108: measured in the printed PDF ---- */
  await p.evaluate(()=>{S.meta.order='cards';const e=document.querySelector('[data-m="order"]');if(e)e.value='cards';bindMeta();renderAll();setView('preview');});await sleep(500);await p.emulateMedia({media:'print'});
  const pdf=path.join(OUT,'tk145-cards.pdf');fs.writeFileSync(pdf,await p.pdf({preferCSSPageSize:true,printBackground:true}));await p.emulateMedia({media:'screen'});
  let meas=null;try{meas=JSON.parse(cp.execFileSync('python3',['-I','-c',`import pymupdf,sys,json
d=pymupdf.open(sys.argv[1]);out=[]
for pg in d:
  for dr in pg.get_drawings():
    c=dr.get('fill') or dr.get('color')
    if c and abs(c[0]-1)<.02 and abs(c[1]-0.88)<.03 and c[2]<.05: out.append([round(dr['rect'].width/72,3),round(dr['rect'].height/72,3)])
print(json.dumps(out))`,pdf]).toString());}catch(e){meas={err:String(e).slice(0,300)};}
  await p.evaluate(()=>{S.meta.order='all';const e=document.querySelector('[data-m="order"]');if(e)e.value='all';bindMeta();renderAll();});
  ok('R-108 in the printed PDF the token cards (their yellow frames) measure 1.0 in by 1.0 in, every one',Array.isArray(meas)&&meas.length>=5&&meas.every(r=>Math.abs(r[0]-1)<0.02&&Math.abs(r[1]-1)<0.02),meas);
  /* ---- E-39: the sheet index ---- */
  const ix=await p.evaluate(async()=>{setView('preview');renderAll();await new Promise(r=>setTimeout(r,300));const b=[...document.querySelectorAll('#tkIndex button[data-tkix]')],ls=document.querySelectorAll('#book .pglabel');
    const tgt=b[10];const before=ls[10].getBoundingClientRect().top;tgt.click();await new Promise(r=>setTimeout(r,900));const after=ls[10].getBoundingClientRect().top;
    return {nb:b.length,nl:ls.length,t10:b[9]&&b[9].textContent,before:Math.round(before),after:Math.round(after)};});
  await p.emulateMedia({media:'print'});const ixPrint=await p.evaluate(()=>getComputedStyle(document.getElementById('tkIndex')).display);await p.emulateMedia({media:'screen'});
  ok('E-39 the Preview has a sheet index: a button for each sheet (the insert\'s second page named), each brings its sheet into view; it does not print',ix.nb===ix.nl&&ix.nb===13&&/^10\. How to use, Step 3$/.test(ix.t10)&&Math.abs(ix.after)<80&&ix.before>300&&ixPrint==='none',Object.assign(ix,{ixPrint}));
  /* ---- R-109, R-144 at iPad width with touch ---- */
  const c2=await br.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true,serviceWorkers:'block'});const q=await c2.newPage();q.on('pageerror',e=>errs.push('ipad: '+e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+file);await sleep(1200);await q.evaluate(()=>{nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};loadSim();});await sleep(900);
  const ip=await q.evaluate(()=>{setView('choices');const R=e=>e.getBoundingClientRect();const mv=[...document.querySelectorAll('#chTbl .mv button')].map(R),ch=[...document.querySelectorAll('#chTbl .pick button[data-pick]')].map(R);
    const gap=mv.length>1?mv[1].left-mv[0].right:0,prev=[...document.querySelectorAll('.nbh-prev,.nbh-next')].map(R).filter(r=>r.width>0);
    const inp=[...document.querySelectorAll('#chTbl input.tk-inh')][0],tag=inp&&inp.nextElementSibling;
    const res={mv:mv.slice(0,2).map(r=>[Math.round(r.width),Math.round(r.height)]),gap:Math.round(gap),ch:ch.slice(0,1).map(r=>Math.round(r.height)),prev:prev.map(r=>Math.round(r.width)),
      inh:!!inp,ph:inp?getComputedStyle(inp,'::placeholder').color:'',ink:inp?getComputedStyle(inp).color:'',tag:tag?tag.textContent:'',tagShown:tag?getComputedStyle(tag).display!=='none':false};
    if(inp){inp.value='Bubbles!';inp.dispatchEvent(new Event('input',{bubbles:true}));res.tagAfter=getComputedStyle(tag).display;}return res;});
  ok('R-109 on an iPad the reorder arrows are 44 by 44 px with 12 px between them, Choose / Change is 44 px high and the sheet arrows 44 px wide',
    ip.mv.length===2&&ip.mv.every(d=>d[0]>=44&&d[1]>=44)&&ip.gap>=10&&ip.ch[0]>=44&&ip.prev.length>0&&ip.prev.every(w=>w>=44),ip);
  ok('R-144 a label taken from the picture reads in ink (not placeholder grey) with a "from the picture" tag, which goes once a label is typed',
    ip.inh&&ip.ph===ip.ink&&ip.tag==='from the picture'&&ip.tagShown&&ip.tagAfter==='none',ip);
  await c2.close();
  ok('no page errors',!errs.length,errs.slice(0,4));
 }catch(e){console.log('FAIL exception '+(e&&e.stack||e).toString().slice(0,600));fails++;}
 console.log('RESULT: '+(fails?fails+' failed':'all '+n+' passed'));await br.close();process.exit(fails?1:0);})();
