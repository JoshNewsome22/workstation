/* v21.44 the TK-1 / TE-1 link, the shell side: the 'open' message (index.html openFor, OPEN_PAIR).
   Plan tests 16 (open beside opens the partner and makes the split), 17 (the cases the shell ignores) and
   20 (no console errors, no sideways page scroll at 390 px). The messages are posted from inside the form
   frames, so this runs whether or not the forms carry the link panel yet; replies are caught in the frame. */
const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
const R=[];const ok=(c,m)=>{R.push([!!c,m]);console.log((c?'ok   ':'BAD  ')+m);};
const J=JSON.stringify;

async function shell(br,viewport){
  const ctx=await br.newContext({viewport});await ctx.addInitScript(()=>{window.print=function(){};});
  const page=await ctx.newPage();const log=[];wire(page,log);
  await page.goto(BASE+'/NBH-Workstation/index.html');await page.waitForFunction(()=>typeof openForm==='function'&&typeof openFor==='function');await sleep(600);
  return {ctx,page,log};}
async function frameOf(page,id){const file=await page.evaluate(i=>(ALL.find(f=>f[0]===i)||[])[2]||'',id);return page.frames().find(f=>f.url().includes(file));}
async function open(page,id){await page.evaluate(i=>openForm(i),id);await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000});await sleep(300);return frameOf(page,id);}
/* post from inside a frame; every 'opened' reply that frame receives is kept in window.__opened */
async function post(fr,msgs){return fr.evaluate(ms=>{
  if(!window.__openedL){window.__openedL=1;window.__opened=[];
    window.addEventListener('message',ev=>{const d=ev.data;if(d&&d.nbh==='opened')window.__opened.push({d,parent:ev.source===window.parent});});}
  ms.forEach(m=>window.parent.postMessage(m,'*'));},msgs);}
const replies=fr=>fr.evaluate(()=>window.__opened||[]);
const lastLog=page=>page.evaluate(()=>(state.relayLog||[]).slice(-1)[0]||null);
const logSince=(page,n)=>page.evaluate(k=>(state.relayLog||[]).slice(k),n);
const logLen=page=>page.evaluate(()=>(state.relayLog||[]).length);
const errs=log=>log.filter(l=>l.type==='error'||l.type==='pageerror');

(async()=>{const br=await chromium.launch();

 /* ---------- 16: Form TE-1 alone asks for Form TK-1 beside it ---------- */
 {const {ctx,page,log}=await shell(br,{width:1440,height:900});
  const te=await open(page,'TE-1');
  ok(!(await page.evaluate(()=>!!state.frames['TK-1'])),'16 TK-1 is not open before the ask');
  const t0=Date.now();
  await post(te,[{nbh:'open',want:'TK-1',beside:true}]);
  await page.waitForFunction(()=>!!state.frames['TK-1'],null,{timeout:3000}).catch(()=>{});
  ok(await page.evaluate(()=>!!state.frames['TK-1']),'16 the ask opens a TK-1 frame');
  ok(J(await page.evaluate(()=>state.split))===J(['TE-1','TK-1']),'16 split is [TE-1, TK-1]: '+J(await page.evaluate(()=>state.split)));
  ok(J(await lastLog(page))===J({from:'TE-1',want:'TK-1',did:'opened'}),'16 relayLog notes it: '+J(await lastLog(page)));
  await sleep(200);
  const rp=await replies(te);
  ok(rp.length===1&&rp[0].parent&&J(rp[0].d)===J({nbh:'opened',want:'TK-1',ok:true}),'16 TE-1 is answered once, from its parent: '+J(rp));
  ok(await page.evaluate(()=>document.body.classList.contains('ws-split')&&!state.frames['TE-1'].hidden&&!state.frames['TK-1'].hidden),'16 both frames show side by side');
  const answered=await page.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:20000}).then(()=>true).catch(()=>false);
  ok(answered,'16 the TK-1 frame loads and answers status ('+(Date.now()-t0)+' ms after the ask)');
  ok(await page.evaluate(()=>state.frames['TK-1'].dataset.loaded==='1'),'16 the TK-1 frame fired load');
  /* the same ask again, after a second, with both open and the split showing: nothing moves */
  await sleep(1100);
  await post(te,[{nbh:'open',want:'TK-1',beside:true}]);await sleep(300);
  ok(J(await page.evaluate(()=>state.split))===J(['TE-1','TK-1'])&&Object.keys(await page.evaluate(()=>state.frames)).length===2,'16 a second ask with both showing keeps the split and opens nothing new');
  ok((await replies(te)).length===2,'16 the second ask is answered too');
  /* three columns: the partner takes a column next to the asker, never the asker's own */
  await open(page,'GB-1');await open(page,'SM-1');
  await page.evaluate(()=>{setSplit(['GB-1','SM-1','TE-1']);state.cur='TE-1';layoutFrames();});
  await page.evaluate(()=>{const fr=state.frames['TK-1'];fr.remove();delete state.frames['TK-1'];delete state.status['TK-1'];});
  await sleep(1100);
  await post(te,[{nbh:'open',want:'TK-1',beside:true}]);
  await page.waitForFunction(()=>!!state.frames['TK-1'],null,{timeout:3000}).catch(()=>{});
  const sp3=await page.evaluate(()=>state.split);
  ok(sp3.includes('TE-1')&&sp3.includes('TK-1')&&sp3.length===3&&Math.abs(sp3.indexOf('TE-1')-sp3.indexOf('TK-1'))===1,'16 with three columns showing, TK-1 replaces a neighbour of TE-1: '+J(sp3));
  /* and from the other side: Form TK-1 alone asks for Form TE-1 */
  await ctx.close();
  const s2=await shell(br,{width:1440,height:900});
  const tk=await open(s2.page,'TK-1');
  const t1=Date.now();
  await post(tk,[{nbh:'open',want:'TE-1',beside:true}]);
  await s2.page.waitForFunction(()=>!!state.frames['TE-1'],null,{timeout:3000}).catch(()=>{});
  ok(J(await s2.page.evaluate(()=>state.split))===J(['TK-1','TE-1']),'16 from TK-1: split is [TK-1, TE-1]');
  const teUp=await s2.page.waitForFunction(()=>state.frames['TE-1']&&state.frames['TE-1'].dataset.loaded==='1',null,{timeout:20000}).then(()=>true).catch(()=>false);
  ok(teUp,'16 from TK-1: the TE-1 frame loads (by '+(Date.now()-t1)+' ms after the ask)');
  await sleep(200);
  const rp2=await replies(tk);
  ok(rp2.length===1&&rp2[0].parent&&rp2[0].d.ok===true&&rp2[0].d.want==='TE-1','16 from TK-1: answered ok: '+J(rp2));
  ok(!errs(log).length&&!errs(s2.log).length,'16 no console errors: '+J(errs(log).concat(errs(s2.log))).slice(0,300));
  await s2.ctx.close();}

 /* ---------- 17: what the shell ignores ---------- */
 {const {ctx,page,log}=await shell(br,{width:1440,height:900});
  const te=await open(page,'TE-1'),sm=await open(page,'SM-1');
  await page.evaluate(()=>openForm('TE-1'));await sleep(200);
  const frames0=()=>page.evaluate(()=>Object.keys(state.frames).sort().join(','));
  const before=await frames0();
  /* from the shell window itself */
  let n=await logLen(page);
  await page.evaluate(()=>window.postMessage({nbh:'open',want:'TK-1',beside:true},'*'));await sleep(400);
  ok(J(await logSince(page,n))===J([{from:'',want:'TK-1',did:'open ignored: not a form frame'}]),'17 from the shell window: ignored, '+J(await logSince(page,n)));
  ok(await frames0()===before,'17 from the shell window: nothing opens');
  /* from a frame that is not one of the shell's own forms (a window the page made itself) */
  n=await logLen(page);
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='qaStray';f.srcdoc='<p>stray</p>';document.body.appendChild(f);});
  await sleep(300);
  await page.evaluate(()=>document.getElementById('qaStray').contentWindow.parent.postMessage({nbh:'open',want:'TK-1',beside:true},'*'));
  await page.evaluate(()=>{const f=document.getElementById('qaStray');f.contentWindow.eval("parent.postMessage({nbh:'open',want:'TK-1',beside:true},'*')");});
  await sleep(400);
  const stray=await logSince(page,n);
  ok(stray.length>=1&&stray.every(x=>x.did==='open ignored: not a form frame'),'17 from a stray frame: ignored, '+J(stray));
  ok(await frames0()===before,'17 from a stray frame: nothing opens');
  await page.evaluate(()=>document.getElementById('qaStray').remove());
  /* from Form SM-1, a form of this workstation that is not in the pair */
  n=await logLen(page);
  await post(sm,[{nbh:'open',want:'TK-1',beside:true},{nbh:'open',want:'TE-1',beside:true}]);await sleep(400);
  ok(J(await logSince(page,n))===J([{from:'SM-1',want:'TK-1',did:'open ignored: not its pair'},{from:'SM-1',want:'TE-1',did:'open ignored: not its pair'}]),'17 from SM-1: ignored, '+J(await logSince(page,n)));
  ok(await frames0()===before&&!(await replies(sm)).length,'17 from SM-1: nothing opens and SM-1 gets no reply');
  /* Form TE-1 asking for a form other than its partner, or for nothing, or for itself */
  n=await logLen(page);
  await post(te,[{nbh:'open',want:'GB-1',beside:true},{nbh:'open',beside:true},{nbh:'open',want:'TE-1',beside:true},{nbh:'open',want:{id:'TK-1'},beside:true}]);await sleep(400);
  const np=await logSince(page,n);
  ok(np.length===4&&np.every(x=>x.from==='TE-1'&&x.did==='open ignored: not its pair'),'17 TE-1 wanting GB-1, nothing, itself or an object: ignored, '+J(np));
  ok(await frames0()===before&&!(await replies(te)).length,'17 want GB-1: no GB-1 frame and no reply');
  /* while a case or an autosave is being restored */
  n=await logLen(page);
  await page.evaluate(()=>{state.restoring=true;});
  await post(te,[{nbh:'open',want:'TK-1',beside:true}]);await sleep(400);
  const rb=await replies(te);
  ok(rb.length===1&&rb[0].parent&&J(rb[0].d)===J({nbh:'opened',want:'TK-1',ok:false,why:'busy'}),'17 while restoring: answered busy, '+J(rb));
  ok(await frames0()===before,'17 while restoring: nothing opens');
  ok(J(await logSince(page,n))===J([{from:'TE-1',want:'TK-1',did:'open refused: restoring'}]),'17 while restoring: noted, '+J(await logSince(page,n)));
  await page.evaluate(()=>{state.restoring=false;});
  /* twice within a second: the first opens, the second is ignored */
  n=await logLen(page);
  await post(te,[{nbh:'open',want:'TK-1',beside:true},{nbh:'open',want:'TK-1',beside:true}]);await sleep(500);
  const ts=await logSince(page,n);
  ok(J(ts)===J([{from:'TE-1',want:'TK-1',did:'opened'},{from:'TE-1',want:'TK-1',did:'open ignored: too soon'}]),'17 twice within 1 s: the second is ignored, '+J(ts));
  const rr=await replies(te);
  ok(rr.length===2&&rr[1].d.ok===true,'17 twice within 1 s: one ok reply (after the busy one), '+J(rr.slice(1)));
  ok(await page.evaluate(()=>!!state.frames['TK-1']&&Object.keys(state.frames).length===3),'17 twice within 1 s: one TK-1 frame');
  ok(!(await replies(sm)).length,'17 SM-1 never received an opened reply');
  await page.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:20000}).catch(()=>{});
  ok(!errs(log).length,'17 no console errors: '+J(errs(log)).slice(0,300));
  await ctx.close();}

 /* ---------- 20: phone width ---------- */
 {const {ctx,page,log}=await shell(br,{width:390,height:844});
  const te=await open(page,'TE-1');
  const over=()=>page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,w:window.innerWidth}));
  let o=await over();ok(o.doc<=o.w&&o.body<=o.w,'20 390 px, TE-1 open: no sideways page scroll '+J(o));
  await post(te,[{nbh:'open',want:'TK-1',beside:true}]);
  await page.waitForFunction(()=>state.frames['TK-1']&&state.frames['TK-1'].dataset.loaded==='1',null,{timeout:20000}).catch(()=>{});
  await page.waitForFunction(()=>!!state.status['TK-1'],null,{timeout:20000}).catch(()=>{});await sleep(800);
  ok(J(await page.evaluate(()=>state.split))===J(['TE-1','TK-1']),'20 390 px: the split is made');
  o=await over();ok(o.doc<=o.w&&o.body<=o.w,'20 390 px, side by side: no sideways page scroll '+J(o));
  /* the link panels, where a form already carries one */
  for(const id of ['TE-1','TK-1']){const fr=await frameOf(page,id);
    const p=fr?await fr.evaluate(()=>{const el=document.getElementById('lkPanel');const d=document.documentElement;
      return {panel:!!el,pw:el?el.scrollWidth:0,pc:el?el.clientWidth:0,doc:d.scrollWidth,w:d.clientWidth};}):null;
    if(p&&p.panel)ok(p.pw<=p.pc+1&&p.doc<=p.w+1,'20 390 px: Form '+id+"'s link panel does not scroll sideways "+J(p));
    else console.log('note '+id+' carries no #lkPanel yet '+J(p));}
  ok(!errs(log).length,'20 390 px: no console errors '+J(errs(log)).slice(0,300));
  const warns=log.filter(l=>l.type==='warning');if(warns.length)console.log('note warnings',J(warns).slice(0,300));
  await ctx.close();}

 await br.close();
 const bad=R.filter(r=>!r[0]);
 console.log(bad.length?'FAILED '+bad.length+' of '+R.length:'ALL OK '+R.length+' checks');
 process.exit(bad.length?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
