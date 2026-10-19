/* Form TB-1's tables on a screen (v23.34): wider than a phone, each candidate is two lines with every answer under its label, so
   on an iPad at Fit 150% no answer is cut short under its arrow and the behavior reads across; the agreement pilot the same way;
   the selected targets' Type column has its choices' room; paper prints the tables with their header rows; a phone keeps them
   with their sideways scroll. Simulated data only. usage: node qa/tb1-screen-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const fill=()=>{const lab=['Head-directed: head banging against hard surfaces (simulated)','Head-directed: head hitting with open or closed hand (simulated)','Lower body directed: elbow-to-thigh (simulated)'];
  lab.forEach((t,i)=>{if(!document.querySelector('[name="cand['+i+'].beh"]'))document.getElementById('addCand').click();
    const s=(k,v)=>{const x=document.querySelector('[name="cand['+i+'].'+k+'"]');x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));};
    s('beh',t);s('by','Teacher, parent');s('rate','<1');s('urg','4');s('sig','Yes');s('rel','No');s('cusp','Yes');s('dec','Target – single topography');});};
/* each box's room against its words: a select's text, measured in its own font, fits inside its padding */
const fits=()=>{const c=document.createElement('canvas').getContext('2d'),out=[];
  document.querySelectorAll('#candBody tr').forEach((tr,r)=>{if(r>2)return;tr.querySelectorAll('select,input').forEach(el=>{const cs=getComputedStyle(el);c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const t=el.tagName==='SELECT'?(el.selectedIndex>=0?el.options[el.selectedIndex].text:''):el.value;if(!t)return;
    const room=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);out.push({n:el.name,t,w:Math.ceil(c.measureText(t).width),room:Math.floor(room)});});});return out;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1366,height:1024},deviceScaleFactor:2,hasTouch:true,userAgent:UA});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('shell: '+e.message));await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(1500);
  await p.evaluate(()=>{wsUI.confirm=async()=>true;wsUI.alert=async()=>{};const h=document.getElementById('railHide');if(h)h.click();});
  await p.evaluate(()=>openForm('TB-1'));await p.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:30000});await sleep(1500);
  const f=p.frames().find(x=>/TB-1_/.test(x.url()));f.page().on('pageerror',()=>{});
  await f.evaluate(fill);await sleep(800);
  const a=await f.evaluate(fits);const z=await f.evaluate(()=>(document.getElementById('nbhFitBtn')||{}).textContent);
  const cut=a.filter(x=>x.w>x.room);
  ok('1 on an iPad Pro at Fit 150% every answer in the first three candidates fits its box (urgency, Yes and No, the decision, who reported it, the rate)',/150%/.test(z)&&a.length===21&&!cut.length,{z,cut});
  const g=await f.evaluate(()=>{const tr=document.querySelector('#candBody tr'),td=[...tr.children],r=e=>e.getBoundingClientRect(),beh=tr.querySelector('textarea');
    const lh=parseFloat(getComputedStyle(beh).lineHeight)||20;
    return {two:r(td[4]).top>r(td[1]).bottom-2&&Math.abs(r(td[4]).top-r(td[8]).top)<40,lines:Math.round((beh.scrollHeight-parseFloat(getComputedStyle(beh).paddingTop)-parseFloat(getComputedStyle(beh).paddingBottom))/lh),
      label:getComputedStyle(td[5],'::before').content,head:getComputedStyle(document.querySelector('#candTbl thead')).display,behW:Math.round(r(beh).width),wide:Math.round(r(document.getElementById('candTbl')).width)};});
  ok('2 each candidate is two lines: the behavior across (one line here), then the urgency, the three questions and the decision, each under its label',g.two&&g.lines<=2&&g.label==='"Socially significant?"'&&g.head==='none'&&g.behW>g.wide*0.5,g);
  /* the selected targets and the agreement pilot, with the simulation */
  await f.evaluate(()=>{nbhUI.confirm=async()=>true;document.getElementById('simBtn').click();});await sleep(1500);
  const sel=await f.evaluate(()=>{const c=document.createElement('canvas').getContext('2d'),out=[];document.querySelectorAll('#selTbl select').forEach(el=>{const cs=getComputedStyle(el);c.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const t=el.selectedIndex>=0?el.options[el.selectedIndex].text:'';if(!t)return;const room=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);out.push({n:el.name,t,w:Math.ceil(c.measureText(t).width),room:Math.floor(room)});});return out;});
  ok('3 the selected targets\' Type, Urgency and sheet choices fit their boxes ("Cluster (multiple topographies)", "Replacement / alternative behavior")',sel.length>=10&&!sel.filter(x=>x.w>x.room).length,sel.filter(x=>x.w>x.room));
  await f.evaluate(()=>{const b=document.querySelector('#viewSeg button[data-view="check"]');if(b)b.click();});await sleep(600);
  const io=await f.evaluate(()=>{const tr=document.querySelector('#ioaBody tr'),td=[...tr.children],r=e=>e.getBoundingClientRect(),d=tr.querySelector('[name$=".d"]'),cs=getComputedStyle(d),c=document.createElement('canvas').getContext('2d');c.font=cs.fontSize+' '+cs.fontFamily;
    return {rows:r(td[1]).top>r(td[0]).bottom-2&&r(td[5]).top>r(td[1]).bottom-2,date:Math.ceil(c.measureText(d.value).width)<=d.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),label:getComputedStyle(td[8],'::before').content,head:getComputedStyle(document.querySelector('#ioaTbl thead')).display};});
  ok('4 the agreement pilot: the target as a heading, then the date, observers, minutes and index, then A, B, the agreement and the disagreements, each labelled; the date fits',io.rows&&io.date&&io.label==='"Disagreements and edits made"'&&io.head==='none',io);
  /* paper */
  const page=await f.evaluate(()=>location.href);
  const q=await ctx.newPage();q.on('pageerror',e=>errs.push('TB-1: '+e.message));await q.goto(page);await sleep(1200);await q.evaluate(fill);await sleep(400);
  await q.emulateMedia({media:'print'});const pr=await q.evaluate(()=>({head:getComputedStyle(document.querySelector('#candTbl thead')).display,tr:getComputedStyle(document.querySelector('#candBody tr')).display,
    before:getComputedStyle(document.querySelector('#candBody td:nth-child(6)'),'::before').content,ioa:getComputedStyle(document.querySelector('#ioaTbl thead')).display}));await q.emulateMedia({media:'screen'});
  ok('5 paper prints the tables with their header rows, as before',pr.head==='table-header-group'&&pr.tr==='table-row'&&(pr.before==='none'||pr.before==='normal')&&pr.ioa==='table-header-group',pr);
  /* a phone */
  const ph=await br.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true});const m=await ph.newPage();m.on('pageerror',e=>errs.push('phone: '+e.message));
  await m.goto(page);await sleep(1200);await m.evaluate(fill);await sleep(300);
  const mp=await m.evaluate(()=>({tr:getComputedStyle(document.querySelector('#candBody tr')).display,head:getComputedStyle(document.querySelector('#candTbl thead')).display,scroll:document.querySelector('.tb1-scroll').scrollWidth>document.querySelector('.tb1-scroll').clientWidth}));
  ok('6 a phone keeps the table, scrolling sideways in its box',mp.tr==='table-row'&&mp.head==='table-header-group'&&mp.scroll,mp);
  ok('7 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
