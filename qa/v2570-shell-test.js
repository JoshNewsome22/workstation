/* v25.70 the shell's next round (the BCBA, 11/9; S/research/NEXT.md, NEXT2.md #2): Undo, What's new, Watch how, the case
   progress rings and Back where you left off. Simulated data only ("Sample Student", the forms' own simulations).
   The BCBA's iPad sideways at 1180 x 820 (touch, Safari's user agent; the screenshots) and a laptop at 1440 x 900 (the forms
   opened on their own, for the sweep).
   U  Undo. U1 every form, opened on its own with its simulation: Clear all (as a person taps it: More controls, Clear all,
      the form's question answered Clear all) offers Undo at the foot of the form, and Undo puts back exactly what Save data
      wrote before (every value; the save times left out); DD-1, DT-1 and AD-1, whose Clear all loads the page again, too.
      U2 Cancel at the question offers nothing and changes nothing. U3 a row removed (Form OB-1's Remove last, Form CN-1's
      note) comes back. U4 a tap by a script (the workstation's own Save, a test's click) is not watched. U5 in the
      workstation on the iPad: the form's Undo is in the workstation's message (44 px, named "Undo: …", role status); it goes
      after about 8 s; Ctrl Z does it. U6 a student removed from the caseload comes back with their case history and pin;
      left alone, the removal stands. U7 Close, Remove from the case: Undo puts the form back in the case with its work.
      U8 Fill open forms: Undo puts back each form it changed. U9 a line removed from the Documents list comes back.
      U10 reduced motion: no toast animation.
   W  What's new: after an update on a device that has kept a student (its version changed: v25.69 to v25.70, the release
      simulated by serving index.html with WS_REL v25.70), the first Today shows the card with the release's lines (3 to 6)
      and the full notes link; Got it or × removes it and the focus stays in Today; the next Today has none; a new device has
      none; a version the list does not describe has none.
   H  Watch how: Form TD-1's bank card and plan card say Watch how and play in TD-1's own player; Form TI-1's Main
      procedure set to DRO shows Watch how (44 px on the iPad, named), which opens the video library over the workstation at
      the DRO videos (#family=dro), FCT at its one video; no video file is fetched before a video is played; never printed;
      Save data is the same with it shown. Form DT-1's Delay requirement (its choices name DRA and DRO) opens the FCT video,
      whatever requirement is chosen: delay tolerance is part of FCT schedule thinning (the BCBA, 11/9). Help's data list
      says what this device remembers for Back where you left off, as it says the pin.
   R  the rings: the case map shows four rings for the student on screen (Assessment, Plan, Implementation, Review), each
      with its words ("3 of 7 assessment forms started, 3 with data"), the numbers from the forms open; the caseload card
      the same four, kept with the student at Save case; nothing printed.
   P  Back where you left off: the place is kept as one works (the student's key, the form, its sheet, the scroll); the
      workstation opened again (more than 45 s later) opens the student at that form, sheet and place with the strip "Back
      where you left off"; Start fresh leaves no student open and the next opening starts as usual; a reload within 45 s
      starts as usual.
   S  the screenshots at 1180 x 820, in qa/out/v2570-shell/. No page errors anywhere.
   usage: WS_URL=http://127.0.0.1:8711 WS_ROOT=<worktree> node qa/v2570-shell-test.js [U W H R P | U1 U2 U3 U5] */
const L=require(__dirname+'/lib.js');const {sleep,fs,path}=L;
let fails=0,n=0;const ok=(k,c,i)=>{n++;console.log((c?'PASS ':'FAIL ')+k+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1500):''));if(!c)fails++;};
const F=L.forms(),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const ONLY=process.argv.slice(2);const want=k=>!ONLY.length||ONLY.includes(k)||ONLY.includes(k[0]);   /* U runs U1-U10; U3 runs U3 alone */
const OUT=path.join(__dirname,'out','v2570-shell');try{fs.mkdirSync(OUT,{recursive:true});}catch(e){}
const errs=[];
async function ctxFor(br,w,h,touch,extra){const c=await br.newContext(Object.assign({viewport:{width:w,height:h},serviceWorkers:'block',acceptDownloads:true},touch?{hasTouch:true,isMobile:true,userAgent:L.IPAD_UA}:{},extra||{}));
  await c.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2570')){sessionStorage.setItem('v2570','1');localStorage.setItem('nbh.ws.installTip','dismissed');
    ['nbh.ws.pinbars','nbh.focus','nbh.ws.full','nbh.ws.rail','nbh.ws.navmode','nbh.railoff','nbh.ws.n90off'].forEach(k=>localStorage.removeItem(k));}}catch(e){}window.print=function(){};});
  return c;}
const watchPage=(p,tag)=>{p.on('pageerror',e=>errs.push(tag+': '+String(e.message||e).slice(0,240)));p.on('dialog',d=>d.accept().catch(()=>{}));return p;};
async function shell(c,tag,student,keep){const p=watchPage(await c.newPage(),tag);await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(3200);
  if(!keep)await p.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});});
  if(student)await setStudent(p,student);return p;}
const setStudent=(p,nm)=>p.evaluate(nm=>{const set=(s,v)=>{const e=document.querySelector(s);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  set('#pClient',nm);set('#pSid','000000');set('#pGrade','5');set('#pSite','Sample Elementary');set('#pBcba','Sample BCBA');},nm);
const frameOf=(p,id)=>p.frames().find(f=>decodeURIComponent(f.url()).includes(FILE[id]));
async function waitForm(p,id,ms){for(let i=0;i<(ms||40000)/250;i++){if(await p.evaluate(id=>!!state.status[id]&&!state.pending[id],id))return true;await sleep(250);}return false;}
async function openIn(p,id,sim){await p.evaluate(i=>openForm(i),id);await waitForm(p,id,60000);await sleep(1200);const fr=frameOf(p,id);if(!fr)return null;
  if(sim){await L.loadSim(fr);await sleep(1200);await answerAll(fr);await sleep(800);}return fr;}
/* the form's own question (nbhUI), answered with its last button (OK, Load, Replace) */
async function answerAll(t){for(let i=0;i<3;i++){const o=await t.evaluate(()=>{const d=document.getElementById('nbhUiDlg');if(d&&d.open){d.querySelector('.u-f button:last-child').click();return true;}return false;}).catch(()=>false);if(!o)break;await sleep(1100);}}
const fileOf=t=>t.evaluate(()=>{const m=nbhUI.undoMark();return m.own||'';});
const sameAs=(t,txt)=>t.evaluate(x=>nbhUI.undoSame(nbhUI.undoMark().own||'',x),txt);
const CLEAR='#clearBtn,#btnClear,#clear-all,#btnClearAll,[data-for="clear-all"]';
async function reach(t,sel,touch){const l=t.locator(sel).first();if(!(await l.isVisible().catch(()=>false))){const m=t.locator('#nbhMoreBtn');if(await m.isVisible().catch(()=>false)){if(touch)await m.tap();else await m.click();await sleep(350);}}
  if(!(await l.isVisible().catch(()=>false)))return null;return l;}
const shot=(p,name)=>p.screenshot({path:path.join(OUT,name+'.png')}).catch(()=>{});
const ago=ms=>new Date(Date.now()-ms).toISOString();

(async()=>{const br=await L.chromium.launch();
 /* ---------------- U1-U4: the forms on their own ---------------- */
 if(want('U1'))try{
  const res=[],bad=[];
  for(const f of F){const c=await ctxFor(br,1440,900,false),q=watchPage(await c.newPage(),'U1 '+f.id);const r={id:f.id};
    try{await q.goto(L.BASE+'/NBH-Workstation/'+f.file);await sleep(2000);await L.loadSim(q);await sleep(1100);await answerAll(q);await sleep(900);
      const before=await fileOf(q);r.len=before.length;const btn=await reach(q,CLEAR,false);
      if(!btn){r.no='Clear all not reached';}
      else{await btn.click({timeout:5000});await sleep(450);const dl=await q.evaluate(()=>{const d=document.getElementById('nbhUiDlg');return !!(d&&d.open);});if(dl)await q.locator('#nbhUiDlg .u-f button:last-child').click();
        await sleep(2400);r.cleared=!(await sameAs(q,before).catch(()=>true));
        const u=q.locator('#nbhToasts .nbh-undo');for(let i=0;i<12&&!(await u.count());i++)await sleep(300);r.offered=await u.count();
        if(r.offered){r.box=await u.first().boundingBox();r.lab=await u.first().getAttribute('aria-label');r.role=await q.evaluate(()=>document.getElementById('nbhToasts').getAttribute('role'));
          await u.first().click();await sleep(3200);r.same=await sameAs(q,before);r.msg=await q.evaluate(()=>[...document.querySelectorAll('#nbhToasts .nbh-toast')].map(x=>x.textContent).join(' | '));}}
    }catch(e){r.err=String(e.message||e).slice(0,200);}
    res.push(r);if(!(r.cleared&&r.offered&&r.same&&/Undone/.test(r.msg||'')))bad.push(r);await c.close();}
  ok('U1 Clear all on every form ('+res.length+'), opened on its own with its simulation: Undo is offered at its foot and puts back exactly what Save data wrote before ('+(res.length-bad.length)+' of '+res.length+')',res.length===F.length&&!bad.length,bad);
  ok('U1 the form\'s Undo is a 44 px button named "Undo: Form cleared." in the form\'s message area (role status)',res.filter(r=>r.box).every(r=>r.box.height>=44&&r.lab==='Undo: Form cleared.'&&r.role==='status'),res.filter(r=>r.box&&!(r.box.height>=44&&r.lab==='Undo: Form cleared.')).slice(0,3));
  fs.writeFileSync(path.join(OUT,'u1-forms.json'),JSON.stringify(res,null,1));
  }catch(e){ok('U1: the run finished without an error',false,String(e.stack||e).slice(0,600));}
 /* U2 Cancel; U3 a row; U4 a script's tap */
 if(want('U2')||want('U3'))try{
  if(want('U2')){const c=await ctxFor(br,1440,900,false),q=watchPage(await c.newPage(),'U2');await q.goto(L.BASE+'/NBH-Workstation/'+FILE['OB-1']);await sleep(2000);await L.loadSim(q);await sleep(1100);await answerAll(q);await sleep(800);
    const before=await fileOf(q);const btn=await reach(q,CLEAR,false);await btn.click();await sleep(450);await q.locator('#nbhUiDlg .u-f button:first-child').click();await sleep(2600);
    const r2={undo:await q.locator('#nbhToasts .nbh-undo').count(),same:await sameAs(q,before)};
    ok('U2 Cancel at the form\'s question: nothing changes and no Undo is offered',r2.undo===0&&r2.same,r2);
    /* U4: a script's click on Clear all (answered) is not watched */
    await q.evaluate(()=>{document.querySelectorAll('#nbhToasts .nbh-toast').forEach(t=>t.remove());});
    await q.evaluate(sel=>{document.querySelector(sel).click();},CLEAR);await sleep(400);await answerAll(q);await sleep(2500);
    const r4={undo:await q.locator('#nbhToasts .nbh-undo').count(),cleared:!(await sameAs(q,before))};
    ok('U4 a tap made by a script (not a person) is not watched: no Undo',r4.undo===0&&r4.cleared,r4);await c.close();}
  if(want('U3')){const res3=[];for(const id of ['CF-1','MT-1','SA-1']){const c=await ctxFor(br,1440,900,false),q=watchPage(await c.newPage(),'U3 '+id);await q.goto(L.BASE+'/NBH-Workstation/'+FILE[id]);await sleep(2000);await L.loadSim(q);await sleep(1100);await answerAll(q);await sleep(800);
    /* the first sheet with a Remove last in sight */
    const views=await q.evaluate(()=>[...document.querySelectorAll('#viewSeg button[data-view]')].map(b=>b.dataset.view));let rm=null;
    for(const v of [''].concat(views)){if(v)await q.evaluate(v=>{const b=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(b)b.click();},v);await sleep(500);
      const l=q.locator('button:visible',{hasText:/^Remove last$/}).first();if(await l.count()){rm=l;break;}}
    const r3={id,has:!!rm};
    if(rm){const before=await fileOf(q),n0=await q.evaluate(()=>document.querySelectorAll('input,select,textarea').length);await rm.scrollIntoViewIfNeeded();await rm.click();await sleep(450);await answerAll(q);await sleep(2200);
      r3.n1=await q.evaluate(()=>document.querySelectorAll('input,select,textarea').length);r3.n0=n0;const u=q.locator('#nbhToasts .nbh-undo');r3.undo=await u.count();r3.text=await q.evaluate(()=>[...document.querySelectorAll('#nbhToasts .nbh-toast')].map(x=>x.textContent).join('|'));
      if(r3.undo){await u.first().click();await sleep(3000);r3.same=await sameAs(q,before);r3.n2=await q.evaluate(()=>document.querySelectorAll('input,select,textarea').length);}}
    res3.push(r3);await c.close();}
   const good=res3.filter(r=>r.has&&r.n1<r.n0&&r.undo===1&&/Removed\./.test(r.text)&&r.same&&r.n2===r.n0);
   ok('U3 a row removed (Remove last, in Forms '+res3.filter(r=>r.has).map(r=>r.id).join(', ')+'): "Removed." with Undo, and Undo brings the row and its values back',res3.some(r=>r.has)&&good.length===res3.filter(r=>r.has).length,res3);}
 }catch(e){ok('U forms: the run finished without an error',false,String(e.stack||e).slice(0,600));}

 /* ---------------- U5-U10, R, H, W: the workstation on the iPad ---------------- */
 if(want('U5')||want('R')||want('H'))try{
  const c=await ctxFor(br,1180,820,true),p=await shell(c,'WS','Sample Student');
  await p.evaluate(()=>{wsUI.confirm=async()=>true;});
  const dm=await openIn(p,'DM-1',true);const ic=await openIn(p,'IC-1',true);const tb=await openIn(p,'TB-1',true);const ti=await openIn(p,'TI-1',false);
  if(want('R')){
    await p.evaluate(()=>{Object.values(state.frames).forEach(fr=>ask(fr,'status'));});await sleep(1500);
    await p.evaluate(()=>document.getElementById('caseMap').click());await sleep(700);
    const cm=await p.evaluate(()=>{const R=[...document.querySelectorAll('#dlgBody .ws-rings-lg .ws-ring')].map(r=>({k:r.dataset.ph,l:r.getAttribute('aria-label'),role:r.getAttribute('role')}));
      const want=wsRings.phases(wsRings.stNow());return {R,want:want.map(x=>wsRings.ringWords(x)),st:wsRings.stNow()};});
    ok('R1 the case map: four rings for Sample Student\'s case (Assessment, Plan, Implementation, Review), each a picture with its words, the numbers from the forms open',
      cm.R.length===4&&cm.R.map(r=>r.k).join()==='assess,plan,run,review'&&cm.R.every((r,i)=>r.role==='img'&&r.l===cm.want[i])&&/^Assessment: 3 of 7 assessment forms started, \d with data$/.test(cm.R[0].l)&&/^Implementation: 1 of 3 implementation forms started/.test(cm.R[2].l)&&/^Review: 0 of 1 review form started$/.test(cm.R[3].l),cm);
    await shot(p,'R1-case-map-rings');
    const pr=await p.evaluate(()=>{const s=document.createElement('style');s.textContent='';return [...document.querySelectorAll('#ws-v2570-css')].map(x=>/@media print\{[^}]*\.ws-rings/.test(x.textContent)).join();});
    ok('R1 the rings are screen only (the print rule hides them)',pr==='true',pr);
    await p.evaluate(()=>document.getElementById('dlg').close());
    await p.evaluate(async()=>{await saveCase();});await sleep(1500);
    await p.evaluate(()=>caseloadOpen());await sleep(900);
    const cl=await p.evaluate(async()=>{const card=[...document.querySelectorAll('#dlgBody .cl-card')].find(c=>/Sample Student/.test(c.getAttribute('aria-label')||''));
      const R=card?[...card.querySelectorAll('.ws-ring')].map(r=>r.getAttribute('aria-label')):[];const rec=(await clList()).find(r=>/Sample Student/.test(r.client));
      return {R,kept:!!(rec&&rec.sum&&rec.sum.prog&&rec.sum.prog['DM-1']>4),fromRec:rec?wsRings.recSt(rec).map(x=>wsRings.ringWords(x)):[],inFile:/"prog"/.test(rec&&rec.text||'')};});
    ok('R2 the caseload card: the same four rings, kept with the student at Save case (in the caseload\'s summary, not in the case file)',cl.R.length===4&&cl.kept&&JSON.stringify(cl.R)===JSON.stringify(cl.fromRec)&&cl.R[0]===cm.want[0]&&!cl.inFile,cl);
    await p.evaluate(()=>{const c=[...document.querySelectorAll('#dlgBody .cl-card')].find(c=>/Sample Student/.test(c.getAttribute('aria-label')||''));if(c)c.scrollIntoView({block:'center'});});await sleep(400);await shot(p,'R2-caseload-rings');await p.evaluate(()=>document.getElementById('dlg').close());}
  if(want('H')){
    /* TI-1: the main procedure set to DRO */
    const reqs=[];p.on('request',r=>{if(/nbh-td1-video-[a-z0-9-]+\.js/.test(r.url()))reqs.push(r.url());});
    await p.evaluate(()=>openForm('TI-1'));await sleep(1200);
    const before=await fileOf(ti);
    await ti.evaluate(()=>{const s=document.querySelector('select[data-m="proc"]');s.value='dro';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
    const w=await ti.evaluate(()=>{const s=document.querySelector('select[data-m="proc"]'),a=s.nextElementSibling,b=a&&a.getBoundingClientRect();return a&&a.classList.contains('nbh-watch')?{t:a.textContent.trim(),lab:a.getAttribute('aria-label'),h:Math.round(b.height),np:a.classList.contains('noprint'),hid:a.hidden}:null;});
    ok('H1 Form TI-1, Main procedure set to DRO: Watch how under it, 44 px on the iPad, named for the DRO videos, screen only',!!w&&w.t==='Watch how'&&w.h>=44&&/^Watch how: DRO, the videos in the video library$/.test(w.lab)&&w.np&&!w.hid,w);
    const aft=await fileOf(ti);
    ok('H1 Save data with Watch how shown holds only the choice (DRO), nothing of the button',/"dro"/.test(aft)&&!/Watch how|nbh-watch/.test(aft),{len:aft.length});
    await ti.evaluate(()=>{const s=document.querySelector('select[data-m="proc"]');s.scrollIntoView({block:'center'});});await sleep(400);await shot(p,'H1-ti1-watch-how');
    const prt=await ti.evaluate(()=>{const a=document.querySelector('.nbh-watch');return !!a;});await ti.page().emulateMedia({media:'print'}).catch(()=>{});
    const pv=await ti.evaluate(()=>getComputedStyle(document.querySelector('.nbh-watch')).display);await ti.page().emulateMedia({media:'screen'}).catch(()=>{});
    ok('H1 never printed (display none in print)',prt&&pv==='none',pv);
    await ti.locator('.nbh-watch').first().tap();await sleep(2600);
    const lib=await p.evaluate(()=>{const fr=window.__wsVideos&&__wsVideos.frame();let h='',chip='',view='';try{h=fr.contentWindow.location.hash;chip=fr.contentWindow.__vl.chip();view=fr.contentWindow.__vl.view();}catch(e){}return {open:__wsVideos.isOpen(),h,chip,view};});
    ok('H2 the tap opens the video library over the workstation at the DRO videos (#family=dro, the DRO chip), and no video file is fetched',lib.open&&lib.h==='#family=dro'&&lib.chip==='fam:dro'&&lib.view==='home'&&!reqs.length,{lib,reqs});
    await shot(p,'H2-library-dro');
    await p.evaluate(()=>__wsVideos.close());await sleep(500);
    await ti.evaluate(()=>{const s=document.querySelector('select[data-m="proc"]');const o=[...s.options].find(x=>/^ncr$/.test(x.value));s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
    const w2=await ti.evaluate(()=>{const a=document.querySelector('.nbh-watch');return a?{fam:a.dataset.fam,lab:a.getAttribute('aria-label'),hid:a.hidden}:null;});
    await ti.evaluate(()=>{const s=document.querySelector('select[data-m="proc"]');s.value='other';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(900);
    const w3=await ti.evaluate(()=>{const a=document.querySelector('.nbh-watch');return a?a.hidden:null;});
    ok('H3 NCR: Watch how follows the choice; Other (no video): it goes',w2&&w2.fam==='ncr'&&!w2.hid&&w3===true,{w2,w3});
    /* DT-1: the delay requirement's Watch how is FCT's (schedule thinning), not the DRA videos its choices name */
    const dt=await openIn(p,'DT-1',false);
    const dw=await dt.evaluate(async()=>{const s=document.querySelector('select[name="req_type"]'),out=[];
      for(const i of [1,3,4,0]){s.selectedIndex=i;s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));
        const a=s.nextElementSibling&&s.nextElementSibling.classList.contains('nbh-watch')?s.nextElementSibling:null;out.push({opt:s.options[i].text.slice(0,24),fam:a&&a.dataset.fam,hid:a?a.hidden:null,lab:a&&a.getAttribute('aria-label'),title:a&&a.title});}
      s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,800));return out;});
    ok('H5 Form DT-1\'s Delay requirement (DRA, DRO or chained): Watch how opens the FCT video (delay tolerance is part of FCT schedule thinning); no requirement chosen: it goes',dw.length===4&&dw.slice(0,3).every(w=>w.fam==='fct'&&w.hid===false&&w.lab==='Watch how: FCT, the video in the video library'&&/FCT schedule thinning/.test(w.title))&&dw[3].hid===true,dw);
    await dt.evaluate(()=>{const s=document.querySelector('select[name="req_type"]');s.nextElementSibling.click();});await sleep(2600);
    const dl=await p.evaluate(()=>{const fr=window.__wsVideos&&__wsVideos.frame();let h='',view='',key='';try{h=fr.contentWindow.location.hash;view=fr.contentWindow.__vl.view();key=fr.contentWindow.__vl.key();}catch(e){}return {open:__wsVideos.isOpen(),h,view,key};});
    ok('H5 the tap opens the video library over the workstation at the FCT video (#video=fct-practical-guide-thinning), not the DRA videos',dl.open&&dl.h==='#video=fct-practical-guide-thinning'&&!/dra/.test(dl.h),dl);
    await shot(p,'H5-dt1-watch-how-fct');
    await p.evaluate(()=>__wsVideos.close());await sleep(500);reqs.length=0;   /* the FCT video, opened on the tap, fetched its file: TD-1's check below starts afresh */
    /* Help, Where the student's data goes: a line for what Back where you left off remembers, said as the pin is */
    const hd=await p.evaluate(async()=>{document.getElementById('help').click();await new Promise(r=>setTimeout(r,600));const d=[...document.querySelectorAll('#dlgBody details')].find(x=>/Where the student/.test(x.querySelector('summary').textContent));
      const r=d?[...d.querySelectorAll('.hp-data tr')].map(t=>t.textContent).find(t=>/Back where you left off/.test(t))||'':'';document.getElementById('dlg').close();return {r,dm:/Back where you left off/.test(dmHtml())};});
    ok('H6 Help\'s data list (and the printed data map): this device remembers the last student, form and place opened, for Back where you left off, the student by their key as the pin keeps them',/^Back where you left off: the last student, form and place opened/.test(hd.r)&&/remembers the student by their key \(the name and ID, as a caseload card.s pin keeps them\)/.test(hd.r)&&/Start fresh/.test(hd.r)&&hd.dm,hd);
    /* TD-1: the cards say Watch how and play in TD-1's own player */
    const td=await openIn(p,'TD-1',true);
    const t1=await td.evaluate(()=>{const b=[...document.querySelectorAll('.td-vid-btn')];return {n:b.length,txt:[...new Set(b.map(x=>x.textContent.trim()))],old:document.body.innerText.includes('Watch the video')};});
    ok('H4 Form TD-1\'s plan cards with a video say Watch how (the wording aligned; no Watch the video left on screen)',t1.n>=1&&t1.txt.join()==='Watch how'&&!t1.old,t1);
    /* the sheet that holds the plan's cards (Build components), the first card with a video in view */
    await td.evaluate(()=>{const v=document.querySelector('#viewSeg button[data-view="build"]');if(v)v.click();});await sleep(900);
    await td.evaluate(()=>{const b=[...document.querySelectorAll('.td-vid-btn')].find(x=>x.getClientRects().length);if(b)b.scrollIntoView({block:'center'});});await sleep(500);await shot(p,'H4-td1-watch-how');
    ok('H4 nothing fetched before a tap: no video file yet',!reqs.length,reqs);
    await td.locator('.td-vid-btn:visible').first().tap();await sleep(2500);
    const pl=await td.evaluate(()=>{const b=document.getElementById('tdVideo');const v=b&&b.querySelector('video');return {open:!!b&&!b.hidden,src:!!(v&&v.src)};});
    ok('H4 Watch how on a TD-1 card plays in TD-1\'s own player (the file fetched on the tap)',pl.open&&pl.src&&reqs.length>=1,{pl,reqs});
    await shot(p,'H4-td1-player');await td.evaluate(()=>window.__tdVideo.close());}
  if(want('U5')){
    /* U5: the form's Undo inside the workstation (IC-1: More controls, Clear all) */
    await p.evaluate(()=>openForm('IC-1'));await sleep(1500);
    const before=await fileOf(ic);
    await p.evaluate(()=>{const v=document.getElementById('aView');if(v)v.click();});await sleep(300);
    const more=await p.evaluate(()=>{const it=document.querySelector('#wsViewMenu [data-wn-for="nbhMoreBtn"]');if(it&&it.offsetParent){it.click();return true;}return false;});await sleep(600);
    let btn=await reach(ic,CLEAR,true);let r5={more,reached:!!btn};
    if(btn){await btn.tap();await sleep(500);await ic.locator('#nbhUiDlg .u-f button:last-child').tap().catch(()=>{});await sleep(2400);
      const u=p.locator('#wsToasts .ws-undo-b');r5.n=await u.count();if(r5.n){r5.box=await u.first().boundingBox();r5.lab=await u.first().getAttribute('aria-label');r5.role=await p.evaluate(()=>document.getElementById('wsToasts').getAttribute('role')||document.getElementById('wsToasts').getAttribute('aria-live'));
        await shot(p,'U5-form-undo-in-workstation');
        await p.keyboard.press('Control+z');await sleep(3200);r5.same=await sameAs(ic,before);r5.msg=await p.evaluate(()=>document.getElementById('wsToasts').textContent);}}
    ok('U5 in the workstation: IC-1\'s Clear all shows Undo in the workstation\'s message (44 px, named), and Ctrl Z puts the form back exactly',r5.reached&&r5.n===1&&r5.box.height>=44&&r5.lab==='Undo: Form cleared.'&&r5.same&&/Undone/.test(r5.msg||''),r5);
    /* U5b: it goes by itself after about 8 s */
    await p.evaluate(()=>__ws2570.offer('Test message for the timer.',()=>true));const t0=Date.now();let gone=0;
    for(let i=0;i<40;i++){await sleep(500);if(!(await p.evaluate(()=>__ws2570.undoLive()))){gone=Date.now()-t0;break;}}
    ok('U5 the Undo goes by itself after about 8 s ('+Math.round(gone/100)/10+' s)',gone>=7000&&gone<=10500,gone);
    /* U7 Close, Remove from the case */
    await p.evaluate(()=>{document.querySelectorAll('#wsToasts .ws-toast').forEach(t=>t.remove());openForm('TB-1');});await sleep(1500);
    const tbBefore=await fileOf(tb);
    /* the question answered as a person answers it: Remove from the case */
    p.evaluate(()=>document.getElementById('closeForm').click());await sleep(700);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('#cfFoot button')].find(x=>/Remove from the case/.test(x.textContent));b.click();});await sleep(1200);
    const r7={inCase:await p.evaluate(()=>inCase('TB-1')),undo:await p.locator('.ws-undo-b').count()};
    if(r7.undo){await shot(p,'U7-remove-from-case-undo');await p.locator('.ws-undo-b').first().tap();await waitForm(p,'TB-1',30000);await sleep(2500);
      r7.back=await p.evaluate(()=>({inCase:inCase('TB-1'),cur:state.cur,order:state.caseOrder.includes('TB-1')}));const tb2=frameOf(p,'TB-1');r7.same=tb2?await sameAs(tb2,tbBefore):false;}
    ok('U7 Close, Remove from the case: the form leaves the case, and Undo puts it back in the case, open, with its work exactly',!r7.inCase&&r7.undo===1&&r7.back&&r7.back.inCase&&r7.back.cur==='TB-1'&&r7.back.order&&r7.same,r7);
    /* U8 Fill open forms */
    await p.evaluate(()=>{document.querySelectorAll('#wsToasts .ws-toast').forEach(t=>t.remove());});
    const ids=await p.evaluate(()=>Object.keys(state.frames));const B0={};for(const id of ids){const fr=frameOf(p,id);if(fr)B0[id]=await fileOf(fr);}
    /* the student's name emptied in TI-1 first (a field that holds it), so the details have somewhere to go */
    const emptied=await ti.evaluate(()=>{let k=0;document.querySelectorAll('input').forEach(i=>{if(i.value==='Sample Student'){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));k++;}});return k;});await sleep(600);
    const B1={};for(const id of ids){const fr=frameOf(p,id);if(fr)B1[id]=await fileOf(fr);}
    await p.evaluate(()=>document.getElementById('pushPacket').click());await sleep(2600);
    const r8={emptied,undo:await p.locator('.ws-undo-b').count(),text:await p.evaluate(()=>document.getElementById('wsToasts').textContent)};
    const changed=[];for(const id of ids){const fr=frameOf(p,id);if(fr&&!(await sameAs(fr,B1[id])))changed.push(id);}r8.changed=changed;
    if(r8.undo){await shot(p,'U8-fill-open-forms-undo');await p.locator('.ws-undo-b').first().tap();await sleep(3500);const still=[];for(const id of ids){const fr=frameOf(p,id);if(fr&&!(await sameAs(fr,B1[id])))still.push(id);}r8.still=still;}
    ok('U8 Fill open forms: Undo puts back each form it changed, exactly as it was ('+changed.join(', ')+')',r8.undo===1&&changed.length>=1&&r8.still&&!r8.still.length&&/Details sent to \d+ open form/.test(r8.text),r8);
    /* U9 a line of the Documents list */
    await p.evaluate(()=>{state.docs=[{form:'packet',title:'Sample packet (simulated)',at:new Date(Date.now()-60000).toISOString(),how:'print'},{form:'DD-1',title:'Sample week (simulated)',at:new Date().toISOString(),how:'pdf'}];kvSet('nbh.ws.docsRemoveAsked','1');__wsSR.docsOpen();});await sleep(700);
    const at0=await p.evaluate(()=>state.docs[0].at);
    await p.locator('#dlgBody [data-srdocx="'+at0+'"]').tap();await sleep(900);
    const r9={n:await p.evaluate(()=>state.docs.length),row:await p.locator('#dlg .ws-undo-row .ws-undo-b').count()};
    if(r9.row){await shot(p,'U9-documents-undo');await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(900);r9.back=await p.evaluate(()=>({n:state.docs.length,first:state.docs[0].title,lines:document.querySelectorAll('#dlgBody [data-srdocx]').length}));}
    ok('U9 a line removed from the Documents list: Undo, inside the open box, puts it back in its place',r9.n===1&&r9.row===1&&r9.back&&r9.back.n===2&&r9.back.first==='Sample packet (simulated)'&&r9.back.lines===2,r9);
    await p.evaluate(()=>document.getElementById('dlg').close());
    /* U6 a student removed from the caseload */
    await p.evaluate(async()=>{await saveCase();});await sleep(1500);
    const key=await p.evaluate(()=>clKey(packet()));await p.evaluate(k=>clPinSet(k,true),key);
    const h0=await p.evaluate(async k=>(await hxPoints(k)).length,key);
    await p.evaluate(()=>caseloadOpen());await sleep(900);
    await p.locator('#dlgBody [data-cldel]').first().evaluate(b=>b.click());await sleep(1800);
    const r6={h0,gone:await p.evaluate(async k=>!(await clList()).some(r=>r.key===k),key),hGone:await p.evaluate(async k=>(await hxPoints(k)).length,key),row:await p.locator('#dlg .ws-undo-row .ws-undo-b').count(),txt:await p.evaluate(()=>(document.querySelector('#dlg .ws-undo-row')||{}).textContent||'')};
    if(r6.row){await shot(p,'U6-caseload-undo');await p.locator('#dlg .ws-undo-row .ws-undo-b').tap();await sleep(1500);
      r6.back=await p.evaluate(async k=>({rec:(await clList()).some(r=>r.key===k),h:(await hxPoints(k)).length,pin:clPins().includes(k),card:[...document.querySelectorAll('#dlgBody .cl-card')].some(c=>c.dataset.clrow===k)}),key);}
    ok('U6 a student removed from the caseload: "Sample Student removed from this iPad." with Undo in the box; Undo brings back the record, its case history ('+h0+' points) and its pin',
      r6.gone&&r6.hGone===0&&r6.row===1&&/^Sample Student removed from this iPad\./.test(r6.txt)&&r6.back&&r6.back.rec&&r6.back.h===h0&&h0>=1&&r6.back.pin&&r6.back.card,r6);
    /* left alone, the removal stands */
    await p.locator('#dlgBody [data-cldel]').first().evaluate(b=>b.click());await sleep(10500);
    const r6b=await p.evaluate(async k=>({rec:(await clList()).some(r=>r.key===k),row:!!document.querySelector('#dlg .ws-undo-row')}),key);
    ok('U6 left alone for 8 s, the removal stands and the Undo goes',!r6b.rec&&!r6b.row,r6b);
    /* U10 reduced motion */
    const c2=await ctxFor(br,1180,820,true,{reducedMotion:'reduce'}),p2=await shell(c2,'U10',null);
    const an=await p2.evaluate(()=>{const t=document.createElement('div');t.className='ws-toast';document.getElementById('wsToasts').appendChild(t);const a=getComputedStyle(t).animationName;t.remove();return a;});
    ok('U10 with reduced motion the workstation\'s message does not animate',an==='none',an);await c2.close();
  }
  await c.close();
 }catch(e){ok('U/R/H workstation: the run finished without an error',false,String(e.stack||e).slice(0,700));}

 /* ---------------- W: What's new ---------------- */
 if(want('W'))try{
  const NEXT='v25.70';
  const routed=async c=>{await c.route('**/NBH-Workstation/index.html',async r=>{const res=await r.fetch();let b=await res.text();b=b.replace("const WS_REL='v25.69';","const WS_REL='"+NEXT+"';");await r.fulfill({response:res,body:b});});};
  /* a device that has kept a student, on v25.69 */
  const c=await ctxFor(br,1180,820,true);await c.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2570w')){sessionStorage.setItem('v2570w','1');localStorage.setItem('nbh.ws.rel','v25.69');localStorage.setItem('nbh.caseload.off','1');}}catch(e){}});
  await routed(c);const p=await shell(c,'W',null);
  const rel=await p.evaluate(()=>WS_REL);
  await p.evaluate(()=>todayOpen());await sleep(900);
  const w1=await p.evaluate(()=>{const s=document.getElementById('wsWhatsNew');if(!s)return null;const a=s.querySelector('a'),x=s.querySelector('.ws-wn-x'),g=s.querySelector('.ws-wn-ok');
    return {h:s.querySelector('h3').textContent,n:s.querySelectorAll('li').length,href:a&&a.getAttribute('href'),tgt:a&&a.target,xl:x.getAttribute('aria-label'),xh:Math.round(x.getBoundingClientRect().height),gh:Math.round(g.getBoundingClientRect().height),first:document.querySelector('#dlgBody').children[1]===s};});
  ok('W1 after the update ('+rel+'), the first Today shows What\'s new at its top: the release\'s lines (3 to 6), the full notes, Got it and a named × (44 px)',rel===NEXT&&!!w1&&w1.n>=3&&w1.n<=6&&/v25\.70/.test(w1.h)&&w1.href==='SETUP.md'&&w1.tgt==='_blank'&&w1.xl==='Dismiss What’s new'&&w1.xh>=44&&w1.gh>=44&&w1.first,w1);
  await shot(p,'W1-whats-new');
  await p.locator('#wsWhatsNew .ws-wn-ok').tap();await sleep(400);
  const w2=await p.evaluate(()=>({card:!!document.getElementById('wsWhatsNew'),open:document.getElementById('dlg').open,focus:!!document.activeElement&&!!document.activeElement.closest('#dlg')}));
  ok('W2 Got it removes the card; Today stays open with the focus in it',!w2.card&&w2.open&&w2.focus,w2);
  await p.evaluate(()=>document.getElementById('dlg').close());await p.evaluate(()=>todayOpen());await sleep(800);
  const w3=await p.evaluate(()=>!!document.getElementById('wsWhatsNew'));
  ok('W3 the next Today has no card (once per version on this device)',!w3);
  await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(3200);await p.evaluate(()=>todayOpen());await sleep(800);const w3b=await p.evaluate(()=>!!document.getElementById('wsWhatsNew'));
  ok('W3 nor after opening the workstation again',!w3b);await c.close();
  /* a new device: never an update */
  const c4=await ctxFor(br,1180,820,true);await routed(c4);const p4=await shell(c4,'W4',null);await p4.evaluate(()=>todayOpen());await sleep(800);
  const w4=await p4.evaluate(()=>({card:!!document.getElementById('wsWhatsNew'),rel:localStorage.getItem('nbh.ws.rel')}));
  ok('W4 a new device (no student ever kept): no card; the version is noted',!w4.card&&w4.rel===NEXT,w4);await c4.close();
  /* the version the list does not describe (v25.69 as shipped now): no card */
  const c5=await ctxFor(br,1180,820,true);await c5.addInitScript(()=>{try{if(window.top===window&&!sessionStorage.getItem('v2570w')){sessionStorage.setItem('v2570w','1');localStorage.setItem('nbh.ws.rel','v25.68');localStorage.setItem('nbh.caseload.off','1');}}catch(e){}});
  const p5=await shell(c5,'W5',null);await p5.evaluate(()=>todayOpen());await sleep(800);const w5=await p5.evaluate(()=>({card:!!document.getElementById('wsWhatsNew'),list:__ws2570.wn().v,rel:WS_REL}));
  ok('W5 a version the list does not describe (the list says '+w5.list+', this is '+w5.rel+'): no card',!w5.card,w5);await c5.close();
 }catch(e){ok('W: the run finished without an error',false,String(e.stack||e).slice(0,600));}

 /* ---------------- P: Back where you left off ---------------- */
 if(want('P'))try{
  const c=await ctxFor(br,1180,820,true),p=await shell(c,'P','Sample Student');await p.evaluate(()=>{wsUI.confirm=async()=>true;});
  const td=await openIn(p,'TD-1',true);await sleep(800);
  const sh=await td.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button')].filter(x=>x.offsetParent!==null||true);const t=b[1];t.click();return {v:t.dataset.view||'',t:t.textContent.trim().replace(/\s+/g,' ')};});await sleep(900);
  await td.evaluate(()=>window.scrollTo(0,700));await sleep(400);const y0=await td.evaluate(()=>Math.round(scrollY));
  await p.evaluate(async()=>{await saveCase();});await sleep(3000);
  const pl=await p.evaluate(()=>__ws2570.placeRead());
  ok('P1 the place is kept as one works: the student\'s key, Form TD-1, its sheet ('+sh.t+') and the scroll ('+y0+' px), on this device only',!!pl&&pl.form==='TD-1'&&pl.sheet&&pl.sheet.v===sh.v&&Math.abs(pl.y-y0)<=2&&/sample student/.test(pl.key)&&Object.keys(pl).sort().join()==='at,form,key,sheet,y',pl);
  await p.close();
  /* 2 minutes later (the kept time set back, on a page of the same site that is not the workstation), with nothing else open */
  const pm=await c.newPage();await pm.goto(L.BASE+'/NBH-Workstation/manifest.json');
  const kept=await pm.evaluate(()=>{const k=Object.keys(localStorage).find(x=>/^nbh\.ws\.place\|/.test(x));if(!k)return null;const o=JSON.parse(localStorage.getItem(k));o.at=new Date(Date.now()-120000).toISOString();localStorage.setItem(k,JSON.stringify(o));return o;});
  await pm.close();
  const p1=await shell(c,'P1',null);
  let r1=null;for(let i=0;i<40;i++){await sleep(500);r1=await p1.evaluate(()=>({cur:state.cur,client:packet().client,strip:(()=>{const s=document.querySelector('#wsResume');return s&&!s.hidden?{t:s.textContent,role:s.getAttribute('role'),btn:Math.round(s.querySelector('.wr-f').getBoundingClientRect().height)}:null;})()}));if(r1.cur==='TD-1'&&r1.strip)break;}
  await sleep(3500);const fr=frameOf(p1,'TD-1');const at=fr?await fr.evaluate(()=>{const b=[...document.querySelectorAll('#viewSeg button')].find(x=>x.getAttribute('aria-pressed')==='true'||x.classList.contains('active')||x.classList.contains('on'));return {v:b&&b.dataset.view,y:Math.round(scrollY)};}):null;
  ok('P3 opened again 2 minutes later: Sample Student\'s case at Form TD-1, its sheet and its place, with the quiet strip "Back where you left off · Start fresh" (role status, 44 px)',
    !!kept&&r1.cur==='TD-1'&&/Sample Student/.test(r1.client)&&r1.strip&&/^Back where you left off: Sample Student · Form TD-1/.test(r1.strip.t)&&/Start fresh/.test(r1.strip.t)&&r1.strip.role==='status'&&r1.strip.btn>=44&&at&&at.v===sh.v&&Math.abs(at.y-y0)<=40,{kept,r1,at,sh,y0});
  await shot(p1,'P3-back-where-you-left-off');
  await p1.locator('#wsResume .wr-f').tap();await sleep(1800);
  const r2=await p1.evaluate(()=>({cur:state.cur,client:packet().client,frames:Object.keys(state.frames).length,place:__ws2570.placeRead()}));
  ok('P4 Start fresh: no student open, and the place is forgotten',!r2.cur&&!r2.client&&!r2.frames&&!r2.place,r2);
  await p1.close();const p3=await shell(c,'P5',null,true);await sleep(2500);const r3=await p3.evaluate(()=>({cur:state.cur,client:packet().client,dlg:document.getElementById('dlg').open?document.getElementById('dlgTitle').textContent:''}));
  ok('P5 the next opening starts as usual: no student, and no earlier work offered',!r3.cur&&!r3.client&&!r3.dlg,r3);
  /* within 45 s: opened again at once (a reload) it starts as usual */
  await setStudent(p3,'Sample Student');await p3.evaluate(()=>{wsUI.confirm=async()=>true;});await openIn(p3,'DM-1',false);await p3.evaluate(async()=>{await saveCase();});await sleep(2600);
  const k2=await p3.evaluate(()=>__ws2570.placeRead());await p3.close();
  const p4=await shell(c,'P2',null);await sleep(2500);const r0=await p4.evaluate(()=>({cur:state.cur,client:packet().client,strip:!!document.querySelector('#wsResume:not([hidden])')}));
  ok('P2 opened again within 45 s (a reload): it starts as usual, no student open',!!k2&&k2.form==='DM-1'&&!r0.cur&&!r0.client&&!r0.strip,{k2,r0});
  await c.close();
 }catch(e){ok('P: the run finished without an error',false,String(e.stack||e).slice(0,600));}

 ok('no page errors anywhere',!errs.length,errs.slice(0,6));
 await br.close();
 console.log(fails?'RESULT: '+fails+' of '+n+' failed':'RESULT: all '+n+' passed');process.exit(fails?1:0);})();
