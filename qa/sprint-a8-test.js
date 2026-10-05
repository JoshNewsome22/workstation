/* v21.44 sprint A8 (index.html): a name corrected on the bar reaches the open forms; fullscreen is remembered; the bar
   keeps to one row on an iPad held sideways.
   1. rename (the audit's rename.js, then the tap), at 1180x820 with touch and an iPad's user agent: "Jordon Rivera"
      typed on the bar with ID 10234 and grade 4; DM-1, IC-1, TB-1, OB-1 and FS-1 opened (each takes the packet); the
      name corrected to "Jordan Rivera" and Fill open forms pressed: the strip offers "Use Jordan Rivera in these 5
      forms". The letters differ, so the different-student warning stays (the five forms and the earlier name, Show me)
      and the offer comes second. Dismissed, Fill open forms brings it back. The tap asks first (both students, their
      details, the five forms); Cancel changes nothing; Same student puts Jordan Rivera in all five (DM-1's first name
      included), lists the change in each, and changes nothing else (each form's fields compared before and after); the
      strip goes and the form list keeps no warning mark. Then the ID (10234 to 10243) and the grade (4 to 5) corrected
      on the bar: the forms holding them are offered "Use ID 10243 and grade 5 in these N forms" as a plain correction
      (no warning), and one tap, with no question, changes those fields alone.
   2. swaps: letters swapped ("Jordna Rivera", "Jordan Rievra": the warning kept, asked first) and capitals ("jordan
      rivera", "JORDAN RIVERA": a plain correction, one tap) corrected on the bar with IC-1 and DM-1 open and Fill open
      forms pressed: offered, and after the tap both forms hold the bar's name as written (DM-1's first and last name).
      A form with no name of its own (GC-1, the grade only) has its grade corrected with the name, under the same
      question; after Same student a later grade correction there takes one tap. A name a form took while it was still
      being typed ("Jor") is offered the rest, after asking.
   3. different: another student is never changed. A form holding a name the bar never held (Sam Lee, typed into CN-1)
      gets the warning only (Show me, no offer); a correction offered meanwhile to the other forms (asked first) leaves
      Sam Lee in CN-1. The bar changed to another student (Maria Lopez): the warning only, nothing offered, nothing
      changed. Dismiss hides the strip until something new comes up. Similar names (Mark Lee and Mary Lee, Ana and Ava
      Lopez, Aiden and Aidan Smith, Jordan and Jordyn Rivera): the warning and Show me stay, the offer is the second
      action and the tap asks; Cancel changes nothing. Chris Lee to Christina Lee, Sam to Samantha Lee, and a sibling
      with her own ID (Mark Lee 40111 grade 3, Mary Lee 40222 grade 5): the warning only. The rules themselves on lists
      of name pairs (the guard's same name; what may be offered, typed or not).
   4. drive: the folder opened from a drive (file://), where Chromium keeps each form apart from the page: the strip
      still offers the correction, and the tap (after its question) names the forms it could not reach instead of
      changing them.
   5. autosave: the name corrected, the forms corrected with the strip's tap: Autosave keeps one safety copy, under the
      corrected name, whether its copy was written before the tap or not.
   6. full: fullscreen remembered. On, then a reload and the restore offer answered (Restore): the form is back in
      fullscreen; a form opened after a reload: fullscreen; Exit, a reload, a form opened: the bars; the last form closed
      in fullscreen: the bars, the setting kept, and the next form opens in fullscreen; Escape from inside a form turns
      it off for good; a browser whose storage throws on every call (and one whose localStorage cannot even be reached):
      the page works, fullscreen still turns on and off, nothing is kept and nothing fails. Installed on an iPad, Own tab
      fills the window for that form without keeping fullscreen as the setting.
   7. bars (the audit's verify-bars/measure.js and wrap.js): with "Autosaved 12:59 PM" and "Saved for offline use"
      showing, the case buttons keep to one row and the form begins no more than 212 px from the top, at 1180x820 with
      touch and an iPad's user agent, the bar folded or not (no student yet); the same at 1133x744 (the iPad mini),
      1024x768 and 1366x1024 with touch and at 1180x820, 1280x800 and 1440x900 with a mouse; with the longest chip
      texts the heading keeps its 56 px and the case buttons their one row; at 1000 and 1024 px, with the longest chip
      texts and "Use these details" showing, a long name keeps at least 160 px; upright (820x1180) and on a phone the
      chips stay in the bar; in fullscreen the form begins under the bar over it; turning the iPad moves the chips and
      back, and a chip still opens its window.
   8. no page error and no console error in the shell.
   Usage: WS_URL=http://127.0.0.1:8308 WS_ROOT=<worktree> node qa/sprint-a8-test.js [NBH-Workstation|RPS-Workstation]
          A8_ONLY=rename,swaps,different,drive,autosave,full,bars (some of the parts; all by default) */
const {chromium,fs,path,ROOT,BASE,forms,sleep}=require(__dirname+'/lib.js');
const ED=process.argv[2]||'NBH-Workstation';
const OUT=__dirname+'/out/sprint-a8/';
const ONLY=process.env.A8_ONLY?process.env.A8_ONLY.split(','):null;
const F=forms(ED),FILE=Object.fromEntries(F.map(f=>[f.id,f.file]));
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let fails=0,passes=0;
const ok=(name,cond,detail)=>{console.log((cond?'PASS ':'FAIL ')+name+(detail!==undefined?' '+JSON.stringify(detail).slice(0,cond?300:2500):''));if(cond)passes++;else fails++;};
const errs=[];
function wire(page,tag){
  page.on('dialog',d=>d.accept().catch(()=>{}));
  page.on('pageerror',e=>errs.push(tag+' pageerror: '+String(e.message||e).slice(0,240)));
  page.on('console',m=>{if(m.type()==='error')errs.push(tag+' console: '+m.text().slice(0,240));});
}
/* the iPad's one-time install tip is a strip of its own: measured without it, as a person who has seen it once does */
const NOTIP=()=>{window.print=function(){};try{if(window.top===window)localStorage.setItem('nbh.ws.installTip','dismissed');}catch(e){}};
async function ipad(br,vp,extra){
  return br.newContext(Object.assign({viewport:vp||{width:1180,height:820},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:IPAD},extra||{}));
}
async function shell(ctx,tag,url){
  const page=await ctx.newPage();wire(page,tag);
  await page.goto(url||BASE+'/'+ED+'/index.html',{waitUntil:'load'});await sleep(1300);
  await closeDlg(page);
  return page;
}
const closeDlg=page=>page.evaluate(()=>{['#dlg','#cfDlg'].forEach(s=>{const d=document.querySelector(s);if(d&&d.open)d.close();});}).catch(()=>{});
const frameOf=(page,id)=>page.frames().find(f=>{const u=f.url();return u.includes(FILE[id])||u.includes(encodeURI(FILE[id]))||u.includes(encodeURIComponent(FILE[id]));});
async function open(page,id){
  await page.evaluate(i=>openForm(i),id);
  await page.waitForFunction(i=>!!state.status[i],id,{timeout:20000}).catch(()=>{});
  await sleep(1600);
  return frameOf(page,id);
}
/* the student fields a form's own packet finds: its name (or first and last), ID and grade */
const idOf=fr=>fr.evaluate(()=>{
  const M=window.__nbhPacketMap||{},o={};
  const val=k=>{for(const s of (M[k]||[])){let e=null;try{e=document.querySelector(s);}catch(x){}if(e&&e.tagName!=='BUTTON')return e.value;}return undefined;};
  for(const k of ['client','first','last','sid','grade'])o[k]=val(k);
  return o;
});
/* every field of a form, as the workstation's snapshot keys them */
const snapOf=(page,id)=>page.evaluate(async i=>{const r=await grab(i,'snapshot',null,8000);return r&&r.snap?r.snap.data:null;},id);
const diff=(a,b)=>{a=a||{};b=b||{};return Object.keys(Object.assign({},a,b)).filter(k=>a[k]!==b[k]).map(k=>k+': '+JSON.stringify(a[k])+' > '+JSON.stringify(b[k]));};
const strip=page=>page.evaluate(()=>({on:$('#alertbar').classList.contains('on'),text:$('#alertText').textContent,
  fix:$('#alertFix').hidden?'':$('#alertFix').textContent,go:!$('#alertGo').hidden,second:$('#alertFix').classList.contains('second')}));
const waitStrip=(page,fn,ms,arg)=>page.waitForFunction(fn,arg===undefined?null:arg,{timeout:ms||12000}).then(()=>true).catch(()=>false);
const notice=page=>page.evaluate(()=>({open:$('#cfDlg').open,title:$('#cfTitle').textContent,body:$('#cfBody').textContent}));
const closeNotice=page=>page.evaluate(()=>{const b=document.querySelector('#cfFoot button');if($('#cfDlg').open&&b)b.click();});
/* the styled question (two buttons: Cancel, then the answer); answer(page,true) takes the answer, false Cancel */
const question=page=>page.evaluate(()=>{const b=[...document.querySelectorAll('#cfFoot button')];
  return $('#cfDlg').open&&b.length===2?{open:true,title:$('#cfTitle').textContent,body:$('#cfBody').textContent,cancel:b[0].textContent,ok:b[1].textContent}:{open:false};});
const answer=(page,yes)=>page.evaluate(y=>{const b=[...document.querySelectorAll('#cfFoot button')];if($('#cfDlg').open&&b.length===2)b[y?1:0].click();},yes);
const barEdit=page=>page.evaluate(()=>{const b=document.getElementById('barEdit');if(b&&b.offsetParent)b.click();});
/* the bar's name, ID and grade, each box left as a person leaves it */
async function setBar(page,name,sid,grade){
  await barEdit(page);await sleep(150);
  await page.fill('#pClient',name);await page.press('#pClient','Tab');
  if(sid!==undefined){await page.fill('#pSid',sid);await page.press('#pSid','Tab');}
  if(grade!==undefined){await page.fill('#pGrade',grade);await page.press('#pGrade','Tab');}
}
/* this tab's safety copies, as Autosave keeps them */
const copies=page=>page.evaluate(async()=>{const l=await CP.list();return l.filter(r=>r.tab===state.auto.tab).map(r=>({key:r.key,student:r.student,forms:Object.keys(r.forms||{})}));});
const typeNote=(fr,t)=>fr.evaluate(t=>{const e=[...document.querySelectorAll('textarea')].find(x=>x.offsetParent);
  if(e){e.focus();e.value=(e.value?e.value+' ':'')+t;['input','change'].forEach(k=>e.dispatchEvent(new Event(k,{bubbles:true})));e.blur();}},t);
const status=(page,ids)=>page.evaluate(ids=>ids.forEach(i=>{if(state.frames[i])ask(state.frames[i],'status');}),ids);
/* a value typed into a form's own student field, as a person would */
const typeIn=(fr,key,v)=>fr.evaluate(([key,v])=>{const M=window.__nbhPacketMap||{};
  for(const s of (M[key]||[])){const e=document.querySelector(s);if(e&&e.tagName!=='BUTTON'){e.focus();e.value=v;['input','change'].forEach(t=>e.dispatchEvent(new Event(t,{bubbles:true})));e.blur();return true;}}
  return false;},[key,v]);

/* ---------------- 1. rename ---------------- */
async function rename(br){
  const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
  const page=await shell(ctx,'rename');
  await page.tap('#pClient');await page.keyboard.type('Jordon Rivera');
  await page.fill('#pSid','10234');await page.fill('#pGrade','4');
  const ids=['DM-1','IC-1','TB-1','OB-1','FS-1'],frs={};
  for(const id of ids)frs[id]=await open(page,id);
  const before={};for(const id of ids)before[id]=frs[id]?await idOf(frs[id]):null;
  ok('rename: the five forms took Jordon Rivera from the bar (DM-1 as first and last name)',
    before['DM-1']&&before['DM-1'].first==='Jordon'&&before['DM-1'].last==='Rivera'&&['IC-1','TB-1','OB-1','FS-1'].every(id=>before[id]&&before[id].client==='Jordon Rivera'),before);
  const snap0={};for(const id of ids)snap0[id]=await snapOf(page,id);
  /* corrected on the bar and sent, as rename.js does it */
  await barEdit(page);await sleep(300);
  await page.fill('#pClient','Jordan Rivera');await page.evaluate(()=>document.getElementById('pushPacket').click());
  await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden&&/5 forms/.test($('#alertFix').textContent));
  const s1=await strip(page);
  await page.screenshot({path:OUT+'rename-strip.png'});
  ok('rename: the strip offers "Use Jordan Rivera in these 5 forms"',s1.on&&s1.fix==='Use Jordan Rivera in these 5 forms',s1);
  ok('rename: the letters differ, so the different-student warning stays (the five forms, the earlier name, Show me) and the offer comes second',
    s1.text==='Different student. 5 forms hold a name other than Jordan Rivera — “Jordon Rivera” in DM-1, IC-1, TB-1, OB-1 and FS-1. '+
      'Anything printed now would mix two students. Or the same student, the name corrected on the bar? Then put Jordan Rivera in them.'&&s1.go&&s1.second,s1);
  const box=await page.evaluate(()=>{const r=$('#alertFix').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};});
  ok('rename: the button is at least 40 px tall on a touch screen',box.h>=40,box);
  /* dismissed, then Fill open forms: the strip comes back, as its notice says */
  await page.tap('#alertHide');await sleep(400);
  const hid=!(await strip(page)).on;
  await page.evaluate(()=>document.querySelectorAll('.ws-toast').forEach(t=>t.remove()));
  await page.evaluate(()=>document.getElementById('pushPacket').click());await sleep(700);
  const back=await strip(page),toast=await page.evaluate(()=>[...document.querySelectorAll('.ws-toast')].map(t=>t.textContent).join(' | '));
  ok('rename: dismissed, then Fill open forms: the strip comes back with the offer its notice points to',hid&&back.on&&back.fix===s1.fix&&/The strip above offers to correct the 5 still holding the earlier details/.test(toast),{hid,back,toast});
  /* the tap asks first; Cancel changes nothing */
  await page.tap('#alertFix');await sleep(500);
  const q1=await question(page);
  ok('rename: the tap asks first, naming both students, their details and the five forms',q1.open&&q1.title==='Is Jordon Rivera the same student as Jordan Rivera?'&&
    q1.body.includes('DM-1, IC-1, TB-1, OB-1 and FS-1 hold Jordon Rivera (ID 10234, grade 4); the bar says Jordan Rivera (ID 10234, grade 4).')&&
    /only if this is the same student/.test(q1.body)&&/If it is another student, choose Cancel/.test(q1.body)&&q1.cancel==='Cancel'&&q1.ok==='Same student: correct them',q1);
  await answer(page,false);await sleep(900);
  const kept={};for(const id of ids)kept[id]=await idOf(frs[id]);
  ok('rename: Cancel changes nothing, and the strip stays',kept['DM-1'].first==='Jordon'&&['IC-1','TB-1','OB-1','FS-1'].every(id=>kept[id].client==='Jordon Rivera')&&(await strip(page)).on,kept);
  /* the tap again, answered */
  await page.tap('#alertFix');await sleep(500);await answer(page,true);await sleep(1500);
  const n1=await notice(page);
  const after={};for(const id of ids)after[id]=await idOf(frs[id]);
  ok('rename: one tap puts Jordan Rivera in DM-1, IC-1, TB-1, OB-1 and FS-1, DM-1\'s first name included',
    after['DM-1'].first==='Jordan'&&after['DM-1'].last==='Rivera'&&['IC-1','TB-1','OB-1','FS-1'].every(id=>after[id].client==='Jordan Rivera'),after);
  ok('rename: the notice lists what it changed, form by form',n1.open&&/Corrected in 5 forms/.test(n1.title)&&ids.every(id=>n1.body.includes('Form '+id+':'))&&/first name Jordon → Jordan/.test(n1.body),n1);
  const snap1={};for(const id of ids)snap1[id]=await snapOf(page,id);
  const d1={};for(const id of ids)d1[id]=diff(snap0[id],snap1[id]);
  ok('rename: nothing else in the five forms changed (every field compared before and after)',
    ids.every(id=>d1[id].length>=1&&d1[id].every(s=>/: "Jordon( Rivera)?" > "Jordan( Rivera)?"$/.test(s))),d1);
  await closeNotice(page);
  const gone=await waitStrip(page,()=>!$('#alertbar').classList.contains('on'),9000);
  const marks=await page.evaluate(()=>document.querySelectorAll('#rail .dirty').length);
  ok('rename: the strip goes, and the form list keeps no warning mark',gone&&marks===0,{gone,marks,strip:await strip(page)});
  /* the ID and the grade, corrected on the bar */
  const hold={sid:ids.filter(id=>before[id].sid==='10234'),grade:ids.filter(id=>before[id].grade==='4')};
  await page.evaluate(()=>{const b=document.getElementById('barEdit');if(b&&b.offsetParent)b.click();});await sleep(300);
  await page.fill('#pSid','10243');await page.fill('#pGrade','5');await page.press('#pGrade','Tab');
  const both=[...new Set(hold.sid.concat(hold.grade))];
  const want='Use ID 10243 and grade 5 in '+(both.length===1?'Form '+both[0]:'these '+both.length+' forms');
  const s2=await page.waitForFunction(w=>$('#alertbar').classList.contains('on')&&$('#alertFix').textContent===w,want,{timeout:12000}).then(()=>strip(page)).catch(()=>strip(page));
  ok('rename: the corrected ID and grade are offered to the forms holding the earlier ones ("'+want+'"), as a plain correction (no warning)',
    s2.on&&s2.fix===want&&/^Corrected on the bar: ID 10234 is now 10243, grade 4 is now 5\./.test(s2.text)&&!/Different student/.test(s2.text)&&!s2.go&&!s2.second,{s2,hold});
  const snap2={};for(const id of ids)snap2[id]=await snapOf(page,id);
  await page.tap('#alertFix');await sleep(400);
  const q2=await question(page);
  ok('rename: an ID one slip from the earlier one (two figures swapped) is corrected without a question',!q2.open,q2);
  await sleep(1100);
  const after2={};for(const id of ids)after2[id]=await idOf(frs[id]);
  ok('rename: the tap puts the ID and the grade in those forms',hold.sid.every(id=>after2[id].sid==='10243')&&hold.grade.every(id=>after2[id].grade==='5')&&ids.every(id=>(after2[id].client||after2[id].first+' '+after2[id].last)==='Jordan Rivera'),{after2,hold});
  const snap3={};for(const id of ids)snap3[id]=await snapOf(page,id);
  const d2={};for(const id of ids)d2[id]=diff(snap2[id],snap3[id]);
  ok('rename: and nothing else (every field compared)',ids.every(id=>d2[id].every(s=>/: "10234" > "10243"$|: "4" > "5"$/.test(s))&&(both.includes(id)?d2[id].length>=1:!d2[id].length)),d2);
  await closeNotice(page);
  await ctx.close();
}

/* ---------------- 2. swaps ---------------- */
async function swaps(br){
  /* [the earlier name on the bar, the name now, asked first (the letters differ)] */
  const pairs=[['Jordna Rivera','Jordan Rivera',true],['Jordan Rievra','Jordan Rivera',true],['jordan rivera','Jordan Rivera',false],['JORDAN RIVERA','Jordan Rivera',false]];
  for(const [a,b,asks] of pairs){
    const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'swaps');
    await page.fill('#pClient',a);await page.press('#pClient','Tab');
    const frs={};for(const id of ['IC-1','DM-1'])frs[id]=await open(page,id);
    const took={IC:await idOf(frs['IC-1']),DM:await idOf(frs['DM-1'])};
    await barEdit(page);await sleep(200);
    await page.fill('#pClient',b);await page.evaluate(()=>document.getElementById('pushPacket').click());
    const got=await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden,12000);
    const s=await strip(page),warned=/^Different student\./.test(s.text);
    ok('swaps '+a+' > '+b+': offered after Fill open forms ('+(asks?'the letters differ: the warning kept, the offer second':'capitals only: a plain correction, no warning')+')',
      took.IC.client===a&&got&&s.fix==='Use '+b+' in these 2 forms'&&warned===asks&&s.go===asks&&s.second===asks&&(asks||s.text.startsWith('Corrected on the bar: '+a+' is now '+b+'.')),{took,s});
    await page.tap('#alertFix');await sleep(500);
    const q=await question(page);
    if(q.open)await answer(page,true);
    await sleep(1500);
    const after={IC:await idOf(frs['IC-1']),DM:await idOf(frs['DM-1'])};
    ok('swaps '+a+' > '+b+': '+(asks?'asked first, then':'one tap, no question, and')+' IC-1 and DM-1 (its first and last name) hold '+b,
      q.open===asks&&after.IC.client===b&&[after.DM.first,after.DM.last].join(' ')===b,{q,after});
    await closeNotice(page);
    const gone=await waitStrip(page,()=>!$('#alertbar').classList.contains('on'),9000);
    ok('swaps '+a+' > '+b+': the strip goes',gone,await strip(page));
    await ctx.close();
  }
  /* a form with no name of its own (GC-1 keeps the grade only): its grade corrected with the name, under the same
     question; once the answer is Same student, a later grade correction there is offered as it is */
  {const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'swaps nameless');
    await setBar(page,'Jordon Rivera','10234','4');
    const fi=await open(page,'IC-1'),fg=await open(page,'GC-1');
    const took=(await idOf(fg)).grade,who=await page.evaluate(()=>state.whoIs['GC-1']);
    await setBar(page,'Jordan Rivera',undefined,'5');
    await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&/2 forms/.test($('#alertFix').textContent),12000);
    const s=await strip(page);
    await page.tap('#alertFix');await sleep(500);const q=await question(page);await answer(page,true);await sleep(1500);await closeNotice(page);
    const after={IC:await idOf(fi),GC:(await idOf(fg)).grade};
    ok('swaps: a form with no name (GC-1, grade '+took+') has its grade corrected with the name, under the same question',
      took==='4'&&!who&&s.fix==='Use Jordan Rivera and grade 5 in these 2 forms'&&/Corrected on the bar: grade 4 is now 5\. Form GC-1 still holds the earlier details\./.test(s.text)&&
      q.open&&q.body.startsWith('Form IC-1 holds Jordon Rivera (ID 10234, grade 4); Form GC-1 holds no name, only grade 4; the bar says Jordan Rivera (ID 10234, grade 5).')&&
      after.IC.client==='Jordan Rivera'&&after.IC.grade==='5'&&after.GC==='5',{took,who,s,q,after});
    await setBar(page,'Jordan Rivera',undefined,'6');
    await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden&&/grade 6/.test($('#alertFix').textContent),12000);
    const s2=await strip(page);
    await page.tap('#alertFix');await sleep(500);const q2=await question(page);await sleep(1200);await closeNotice(page);
    ok('swaps: after Same student, a later grade correction in the form with no name is offered as it is (one tap, no question)',
      s2.fix==='Use grade 6 in these 2 forms'&&!s2.second&&!/Different student|Another student/.test(s2.text)&&!q2.open&&(await idOf(fg)).grade==='6',{s2,q2});
    await ctx.close();}
  /* a name a form took while it was still being typed on the bar */
  const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
  const page=await shell(ctx,'swaps typing');
  await page.tap('#pClient');await page.keyboard.type('Jor');
  await page.evaluate(()=>openForm('IC-1'));
  await page.waitForFunction(()=>!!state.status['IC-1'],null,{timeout:20000}).catch(()=>{});await sleep(1600);
  const fr=frameOf(page,'IC-1'),took=(await idOf(fr)).client;
  await page.focus('#pClient');await page.keyboard.press('End');await page.keyboard.type('dan Rivera');await page.press('#pClient','Tab');
  await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden,12000);
  const s=await strip(page);
  ok('swaps: a form that took the name while it was being typed ("'+took+'") is offered the rest, the warning kept',took==='Jor'&&s.fix==='Use Jordan Rivera in Form IC-1'&&/^Different student\./.test(s.text)&&s.second,{took,s});
  await page.tap('#alertFix');await sleep(500);const q=await question(page);if(q.open)await answer(page,true);await sleep(1500);
  ok('swaps: asked first, then IC-1 holds Jordan Rivera',q.open&&q.title==='Is Jor the same student as Jordan Rivera?'&&(await idOf(fr)).client==='Jordan Rivera',{q,now:await idOf(fr)});
  await closeNotice(page);
  await ctx.close();
}

/* ---------------- 3. different ---------------- */
async function different(br){
  const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
  const page=await shell(ctx,'different');
  await page.fill('#pClient','Jordan Rivera');await page.press('#pClient','Tab');
  const ids=['IC-1','TB-1','CN-1'],frs={};for(const id of ids)frs[id]=await open(page,id);
  const took=await Promise.all(ids.map(id=>idOf(frs[id])));
  ok('different: IC-1, TB-1 and CN-1 took Jordan Rivera',took.every(o=>o.client==='Jordan Rivera'),took);
  /* a name the bar never held, typed into CN-1 */
  await typeIn(frs['CN-1'],'client','Sam Lee');
  const w1=await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&/Sam Lee/.test($('#alertText').textContent),12000);
  const s1=await strip(page);
  ok('different: a name the bar never held gets the warning only (Show me, no offer)',w1&&s1.text.startsWith('Different student. Form CN-1 holds a name other than Jordan Rivera — “Sam Lee”. ')&&s1.go&&!s1.fix,s1);
  /* Dismiss: hidden while nothing changes */
  await page.tap('#alertHide');await sleep(5600);
  const s1b=await strip(page);
  ok('different: Dismiss hides the strip while the forms stay as they are',!s1b.on,s1b);
  /* a correction on the bar meanwhile: offered to IC-1 and TB-1 (asked first), not to CN-1, and the strip comes back for it */
  await page.fill('#pClient','Jordan Riviera');await page.press('#pClient','Tab');
  await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden,12000);
  const s2=await strip(page);
  ok('different: with a correction as well, the strip warns for all three and offers the correction to the two that hold the earlier name',s2.on&&
    s2.text.startsWith('Different student. 3 forms hold a name other than Jordan Riviera — “Jordan Rivera” in IC-1 and TB-1; “Sam Lee” in CN-1. ')&&
    s2.text.endsWith('Then put Jordan Riviera in IC-1 and TB-1.')&&s2.fix==='Use Jordan Riviera in these 2 forms'&&s2.go&&s2.second,s2);
  await page.tap('#alertFix');await sleep(500);
  const q2=await question(page);
  ok('different: the question names the two forms, not CN-1',q2.open&&q2.body.startsWith('IC-1 and TB-1 hold Jordan Rivera; the bar says Jordan Riviera.'),q2);
  await answer(page,true);await sleep(1500);
  const n2=await notice(page);await closeNotice(page);
  const after=await Promise.all(ids.map(id=>idOf(frs[id])));
  ok('different: the correction reaches IC-1 and TB-1, and Sam Lee stays in CN-1',after[0].client==='Jordan Riviera'&&after[1].client==='Jordan Riviera'&&after[2].client==='Sam Lee'&&!/CN-1/.test(n2.body),{after,n2});
  /* the bar changed to another student while the forms hold the earlier name */
  const snapA={};for(const id of ids)snapA[id]=await snapOf(page,id);
  await page.fill('#pClient','Maria Lopez');await page.press('#pClient','Tab');
  await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&/3 forms hold/.test($('#alertText').textContent),12000);
  await sleep(3000);
  const s3=await strip(page);
  ok('different: another student on the bar gets the warning only, with nothing offered',s3.on&&/^Different student\. 3 forms hold a name other than Maria Lopez/.test(s3.text)&&!s3.fix&&!/Corrected|same student/.test(s3.text),s3);
  await page.evaluate(()=>applyFixes());await sleep(800);await closeNotice(page);
  const snapB={};for(const id of ids)snapB[id]=await snapOf(page,id);
  const dd=ids.map(id=>diff(snapA[id],snapB[id])).flat();
  ok('different: and nothing in the forms changes, even if the correction is called',!dd.length,dd);
  await ctx.close();
  /* similar names, and a sibling with her own ID: the first student's name (and ID and grade) on the bar and in IC-1 and
     TB-1, then the other's typed on the bar. ask: the warning stays, the offer is second and asks first; none: the
     warning only; idask: the same name with another ID altogether, offered as a correction but asked first */
  const sim=[['Mark Lee','Mary Lee','ask'],['Ana Lopez','Ava Lopez','ask'],['Aiden Smith','Aidan Smith','ask'],['Jordan Rivera','Jordyn Rivera','ask'],
    ['Chris Lee','Christina Lee','none'],['Sam','Samantha Lee','none'],['Mark Lee|40111|3','Mary Lee|40222|5','none'],['Kim Park|50111|2','Kim Park|50999|2','idask']];
  const c2=await ipad(br);await c2.addInitScript(NOTIP);
  const p2=await shell(c2,'different similar');
  await p2.fill('#pClient','Student');await p2.press('#pClient','Tab');
  const f2={};for(const id of ['IC-1','TB-1'])f2[id]=await open(p2,id);
  for(const [x,y,want] of sim){
    const [a,aid,ag]=x.split('|'),[b,bid,bg]=y.split('|');
    await setBar(p2,a,aid,ag);
    for(const id of ['IC-1','TB-1']){await typeIn(f2[id],'client',a);if(aid){await typeIn(f2[id],'sid',aid);await typeIn(f2[id],'grade',ag);}}
    await status(p2,['IC-1','TB-1']);
    await p2.waitForFunction(a=>['IC-1','TB-1'].every(i=>state.whoIs[i]===a),a,{timeout:9000}).catch(()=>{});
    await setBar(p2,b,bid,bg);
    await waitStrip(p2,([b,want])=>$('#alertbar').classList.contains('on')&&(want==='idask'?!$('#alertFix').hidden:$('#alertText').textContent.includes('other than '+b)),12000,[b,want]);
    await sleep(want==='none'?2600:300);
    const s=await strip(p2);
    const warn=s.on&&s.text.startsWith('Different student. 2 forms hold a name other than '+b+' — “'+a+'” in IC-1 and TB-1. Anything printed now would mix two students.')&&s.go;
    if(want==='idask'){
      await p2.tap('#alertFix').catch(()=>{});await sleep(500);
      const q=await question(p2);await answer(p2,false);await sleep(700);
      const held=[await idOf(f2['IC-1']),await idOf(f2['TB-1'])].map(o=>o.sid);
      ok('different: '+a+' with ID '+aid+' to ID '+bid+': offered as a correction (no warning), and asked first; Cancel changes nothing',
        s.on&&s.text==='Corrected on the bar: ID '+aid+' is now '+bid+'. IC-1 and TB-1 still hold the earlier details. (Another student? Close them instead.)'&&
        s.fix==='Use ID '+bid+' in these 2 forms'&&!s.go&&!s.second&&q.open&&q.title==='Is this the same student?'&&held.every(n=>n===aid),{s,q,held});
    } else if(want==='ask'){
      await p2.tap('#alertFix').catch(()=>{});await sleep(500);
      const q=await question(p2);await answer(p2,false);await sleep(700);
      const held=[await idOf(f2['IC-1']),await idOf(f2['TB-1'])].map(o=>o.client);
      ok('different: '+a+' to '+b+': the warning and Show me stay, the offer is second and asks first; Cancel changes nothing',
        warn&&s.fix==='Use '+b+' in these 2 forms'&&s.second&&q.open&&q.title==='Is '+a+' the same student as '+b+'?'&&held.every(n=>n===a),{s,q,held});
    } else {
      const snap0=[await snapOf(p2,'IC-1'),await snapOf(p2,'TB-1')];
      await p2.evaluate(()=>applyFixes());await sleep(700);const q=await question(p2);
      const snap1=[await snapOf(p2,'IC-1'),await snapOf(p2,'TB-1')],dd=diff(snap0[0],snap1[0]).concat(diff(snap0[1],snap1[1]));
      ok('different: '+x.replace(/\|/g,' ')+' to '+y.replace(/\|/g,' ')+': the warning only, nothing offered, nothing changed (even if the correction is called)',
        warn&&!s.fix&&!/same student|Corrected/.test(s.text)&&!q.open&&!dd.length,{s,q,dd});
    }
    await closeNotice(p2);
  }
  /* the rules, on pairs. The guard's same name: [a, b, the same student's name?] */
  const same=[['Jordan Rivera','jordan  rivera',true],['Rivera, Jordan','Jordan Rivera',true],['José Rivera','Jose Rivera',true],["Liam O'Brien",'Liam OBrien',true],
    ['Mary Ann Lee','Maryann Lee',true],['Jordna Rivera','Jordan Rivera',false],['Myra Lee','Mary Lee',false],['Student 1','Student 2',false],['Mark Lee','Mary Lee',false]];
  const gs=await p2.evaluate(p=>p.map(([a,b])=>sameName(a,b)),same);
  const ws=same.filter((p,i)=>gs[i]!==p[2]).map(p=>p[0]+' / '+p[1]);
  ok('different: the guard takes capitals, spaces, accents, punctuation and the order of the words for the same name, and swapped letters, numbers and other names for another',!ws.length,ws);
  /* what may be offered: [the earlier name on the bar, the name now, typed (a form took it while it was being typed), offered?] */
  const pairs=[['Jordon Rivera','Jordan Rivera',0,true],['Jordan Rivra','Jordan Rivera',0,true],['Jordna Rivera','Jordan Rivera',0,true],['Jordan','Jordan Rivera',0,true],
    ['Rivera','Jordan Rivera',0,true],['jordan  rivera','Jordan Rivera',0,true],['Jose Rivera','José Rivera',0,true],['Rivera, Jordon','Jordan Rivera',0,true],
    ['Jo','Jordan Rivera',1,true],['Jordan Riv','Jordan Rivera',1,true],
    ['Jo','Jordan Rivera',0,false],['J Rivera','Jordan Rivera',0,false],['Jon Rivera','Jonathan Rivera',0,false],['Chris Lee','Christina Lee',0,false],['Sam','Samantha Lee',0,false],
    ['Jordan Rivera','Maria Lopez',0,false],['Jordan Rivera','Jordan Smith',0,false],['Jordan Rivera','Jaden Rivera',0,false],['Student 1','Student 2',0,false],
    ['Jordan Rivera','Rivera',0,false],['Al','Ed',0,false],['Sam Lee','Samuel Leeds',0,false],['Ana Lopez','Mia Lopez',0,false],['J','Jordan Rivera',1,false]];
  const got=await p2.evaluate(p=>p.map(([a,b,t])=>nameFixes(a,b,!!t)),pairs);
  const wrong=pairs.filter((p,i)=>got[i]!==p[3]).map(p=>p[0]+' / '+p[1]+(p[2]?' (typed)':''));
  ok('different: a slip of a letter or two (in any order), words added, or a name still being typed may be offered; initials, short forms written out and other names are not',!wrong.length,wrong);
  await c2.close();
}

/* ---------------- 4. drive ---------------- */
async function drive(br){
  const url='file://'+path.join(ROOT,ED,'index.html');
  const ctx=await br.newContext({viewport:{width:1180,height:820}});await ctx.addInitScript(NOTIP);
  const page=await shell(ctx,'drive',url);
  await page.fill('#pClient','Jordon Rivera');await page.press('#pClient','Tab');
  await open(page,'IC-1');await open(page,'TB-1');
  const reach=await page.evaluate(()=>{try{return !!state.frames['IC-1'].contentWindow.document.body;}catch(e){return false;}});
  if(reach){console.log('NOTE drive: this browser lets the page into forms opened from a drive; the part is skipped');await ctx.close();return;}
  await page.fill('#pClient','Jordan Rivera');await page.press('#pClient','Tab');
  await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden,14000);
  const s=await strip(page);
  ok('drive: from a drive the strip still offers the correction',s.on&&s.fix==='Use Jordan Rivera in these 2 forms',s);
  await page.click('#alertFix');await sleep(500);
  const q=await question(page);await answer(page,true);await sleep(1200);
  const n=await notice(page);
  ok('drive: the tap (after its question) names the forms it could not reach, to be corrected by hand',q.open&&n.open&&/Nothing was changed/.test(n.title)&&/Form IC-1, Form TB-1/.test(n.body)&&/by hand/.test(n.body),{q,n});
  await ctx.close();
}

/* ---------------- 5. autosave ---------------- */
async function autosave(br){
  /* tap first: the strip's tap before Autosave writes again; autosave first: Autosave writes between the correction on
     the bar and the tap (as its timer does while the person keeps working) */
  for(const order of ['tap first','autosave first']){
    const ctx=await br.newContext({viewport:{width:1180,height:820}});await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'autosave '+order);
    await page.fill('#pClient','Jordon Rivera');await page.press('#pClient','Tab');
    const fr=await open(page,'CN-1');
    await typeNote(fr,'Met with the teacher.');await sleep(600);
    await page.evaluate(async()=>{state.auto.last=0;await autoSave(true);});await sleep(800);
    const c0=await copies(page);
    await setBar(page,'Jordan Rivera');await sleep(1200);
    if(order==='autosave first'){await typeNote(fr,'Then the morning routine.');await sleep(600);await page.evaluate(async()=>{state.auto.last=0;await autoSave(true);});await sleep(800);}
    const c1=await copies(page);
    await waitStrip(page,()=>$('#alertbar').classList.contains('on')&&!$('#alertFix').hidden,12000);
    await page.evaluate(()=>$('#alertFix').click());await sleep(500);await answer(page,true);await sleep(3000);
    await closeNotice(page);
    await page.evaluate(async()=>{for(let i=0;i<50&&state.auto.busy;i++)await new Promise(r=>setTimeout(r,100));state.auto.last=0;await autoSave(true);});await sleep(1000);
    const c2=await copies(page);
    ok('autosave '+order+': the name corrected in the forms with the strip\'s tap, Autosave keeps one safety copy, under Jordan Rivera, with CN-1',
      c0.length===1&&c1.length===(order==='tap first'?1:2)&&c2.length===1&&c2[0].student==='Jordan Rivera'&&c2[0].forms.includes('CN-1'),{c0,c1,c2});
    await ctx.close();
  }
}

/* ---------------- 6. full ---------------- */
const isFull=page=>page.evaluate(()=>document.body.classList.contains('ws-full'));
const kept=page=>page.evaluate(()=>{try{return localStorage.getItem('nbh.ws.full');}catch(e){return 'unreadable';}});
async function full(br){
  const ctx=await ipad(br);await ctx.addInitScript(NOTIP);
  let page=await shell(ctx,'full');
  await page.fill('#pClient','Jordan Rivera');await page.press('#pClient','Tab');
  const fr=await open(page,'CN-1');
  /* a note typed, so Autosave keeps a copy to offer after the reload (the student's name stays the bar's) */
  if(fr)await fr.evaluate(()=>{const t=[...document.querySelectorAll('textarea')].find(e=>e.offsetParent);
    if(t){t.focus();t.value='Met with the teacher about the morning routine.';['input','change'].forEach(k=>t.dispatchEvent(new Event(k,{bubbles:true})));t.blur();}});
  await sleep(600);
  await page.tap('#fullBtn');await sleep(400);
  ok('full: on, and kept on this device',await isFull(page)&&await kept(page)==='on',{full:await isFull(page),kept:await kept(page)});
  await page.evaluate(async()=>{state.auto.last=0;await autoSave(true);});await sleep(800);
  /* a reload (an iPad reopening the tab): the restore offer, answered */
  await page.reload({waitUntil:'load'});await sleep(2500);
  const offer=await page.evaluate(()=>!!document.querySelector('#dlg[open] button[data-as="r"]'));
  if(offer){await page.evaluate(()=>document.querySelector('#dlg[open] button[data-as="r"]').click());
    await page.waitForFunction(()=>!!state.status['CN-1'],null,{timeout:20000}).catch(()=>{});await sleep(1500);}
  const back=await page.evaluate(()=>({full:document.body.classList.contains('ws-full'),cur:state.cur,frameTop:(()=>{const f=[...document.querySelectorAll('.frames iframe')].find(f=>!f.hidden);return f?Math.round(f.getBoundingClientRect().top):null;})()}));
  await page.screenshot({path:OUT+'full-after-restore.png'});
  ok('full: after a reload and Restore, the form is back in fullscreen',offer&&back.full&&back.cur==='CN-1'&&back.frameTop<=60,{offer,back});
  /* Exit: the bars, kept that way */
  await page.tap('#fullBtn');await sleep(300);
  ok('full: Exit brings the bars back and the setting goes',!(await isFull(page))&&await kept(page)===null,{full:await isFull(page),kept:await kept(page)});
  await page.reload({waitUntil:'load'});await sleep(2200);await closeDlg(page);
  await open(page,'TB-1');
  ok('full: after Exit and a reload, a form opens with the bars',!(await isFull(page)),{full:await isFull(page)});
  /* a form opened after a reload, with the setting on */
  await page.tap('#fullBtn');await sleep(300);
  await page.reload({waitUntil:'load'});await sleep(2200);await closeDlg(page);
  ok('full: after a reload, nothing open, the bars (nothing to fill the screen with)',!(await isFull(page)),{full:await isFull(page),kept:await kept(page)});
  await open(page,'TB-1');
  ok('full: after a reload, the first form opened comes up in fullscreen',await isFull(page)&&await kept(page)==='on',{full:await isFull(page),kept:await kept(page)});
  /* the last form closed: the bars, the setting kept; the next form: fullscreen again */
  await page.tap('#closeForm');await sleep(300);await page.evaluate(()=>{const b=document.querySelector('#cfFoot button.danger');if(b)b.click();});await sleep(500);
  ok('full: the last form closed ends fullscreen and keeps the setting',!(await isFull(page))&&await kept(page)==='on'&&await page.evaluate(()=>state.cur===null),{full:await isFull(page),kept:await kept(page)});
  const f2=await open(page,'IC-1');
  ok('full: the next form opened comes up in fullscreen',await isFull(page),{full:await isFull(page)});
  /* Escape from inside the form */
  await f2.click('body',{position:{x:5,y:300}}).catch(()=>{});await f2.press('body','Escape');await sleep(500);
  ok('full: Escape from inside the form turns it off, and the setting with it',!(await isFull(page))&&await kept(page)===null,{full:await isFull(page),kept:await kept(page)});
  await ctx.close();
  /* storage that throws on every call, then storage that cannot be reached at all (the workstation page only) */
  for(const [label,init] of [
    ['storage that throws on every call',()=>{if(window.top!==window)return;const t=function(){throw new DOMException('The operation is insecure.','SecurityError');};
      Storage.prototype.getItem=t;Storage.prototype.setItem=t;Storage.prototype.removeItem=t;}],
    ['localStorage that cannot be reached',()=>{if(window.top!==window)return;try{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('The operation is insecure.','SecurityError');}});}catch(e){}}]]){
    const c=await br.newContext({viewport:{width:1180,height:820}});await c.addInitScript(()=>{window.print=function(){};});await c.addInitScript(init);
    const before=errs.length;
    const p=await shell(c,'full '+label);
    await open(p,'TB-1');
    await p.click('#fullBtn');await sleep(300);const on=await isFull(p);
    await p.click('#fullBtn');await sleep(300);const off=!(await isFull(p));
    await p.click('#fullBtn');await sleep(300);
    await p.reload({waitUntil:'load'});await sleep(1800);await closeDlg(p);
    await open(p,'TB-1');const after=await isFull(p);
    const mine=errs.slice(before);
    ok('full: with '+label+', the page works, fullscreen turns on and off, and nothing is kept (no error)',on&&off&&!after&&!mine.length,{on,off,after,errors:mine});
    await c.close();
  }
  /* installed on an iPad (the Home Screen app): Own tab fills the window for that form, and is not kept as the setting */
  {const c=await ipad(br,null);await c.addInitScript(NOTIP);
    await c.addInitScript(()=>{try{Object.defineProperty(Navigator.prototype,'standalone',{configurable:true,get(){return true;}});}catch(e){}});
    let p=await shell(c,'full installed');
    const inApp=await p.evaluate(()=>!!(window.nbhShareSave&&window.nbhShareSave.inApp));
    await open(p,'CN-1');
    await p.tap('#popOut');await sleep(600);
    const own={full:await isFull(p),kept:await kept(p)};
    await p.reload({waitUntil:'load'});await sleep(1800);await closeDlg(p);
    await open(p,'TB-1');
    const next={full:await isFull(p),kept:await kept(p)};
    ok('full: installed on an iPad, Own tab fills the window, and the next launch opens a form with the bars (not kept as the setting)',inApp&&own.full&&own.kept===null&&!next.full&&next.kept===null,{inApp,own,next});
    await c.close();}
}

/* ---------------- 7. bars ---------------- */
async function geo(page){
  return page.evaluate(()=>{
    const r=s=>{const e=document.querySelector(s);if(!e||getComputedStyle(e).display==='none')return null;const b=e.getBoundingClientRect();return {y:Math.round(b.top),h:Math.round(b.height)};};
    const acts=document.querySelector('.bar .grp.acts');
    const kids=acts&&getComputedStyle(acts).display!=='none'?[...acts.children].filter(c=>getComputedStyle(c).display!=='none'&&c.getBoundingClientRect().height>0):[];
    const fr=[...document.querySelectorAll('.frames iframe')].find(f=>!f.hidden);
    const box=document.querySelector('#wsChips');
    return {vw:innerWidth,coarse:matchMedia('(pointer:coarse)').matches,folded:document.body.classList.contains('bar-folded'),
      header:r('header.top'),bar:r('.bar'),crumb:r('.crumb'),tip:r('#tipBar'),rows:[...new Set(kids.map(c=>Math.round(c.getBoundingClientRect().top)))].length,
      frameTop:fr?Math.round(fr.getBoundingClientRect().top):null,chipsIn:box?(box.closest('header.top')?'heading':box.closest('.bar')?'bar':'?'):'none',
      auto:document.querySelector('#autoChip').textContent,off:document.querySelector('#offChip').hidden?'':document.querySelector('#offChip').textContent,
      chipsH:box?Math.round(box.getBoundingClientRect().height):null};
  });
}
const setChips=(page,a,o)=>page.evaluate(([a,o])=>{const c=document.querySelector('#autoChip');c.textContent=a;c.className='chip on';const d=document.querySelector('#offChip');d.hidden=false;d.textContent=o;d.className='chip on';},[a,o]);
async function bars(br){
  const sizes=[['1180x820 touch',{width:1180,height:820},true],['1133x744 touch (iPad mini)',{width:1133,height:744},true],['1024x768 touch',{width:1024,height:768},true],
    ['1366x1024 touch',{width:1366,height:1024},true],['1180x820 mouse',{width:1180,height:820},false],['1280x800 mouse',{width:1280,height:800},false],['1440x900 mouse',{width:1440,height:900},false]];
  for(const [tag,vp,touch] of sizes){
    const ctx=touch?await ipad(br,vp):await br.newContext({viewport:vp});await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'bars '+tag);
    for(const id of ['OB-1','CN-1']){
      await open(page,id);
      /* the details open: no student yet (OB-1, the first form), then with the student's name and Done showing (CN-1) */
      await setChips(page,'Autosaved 12:59 PM','Saved for offline use');await sleep(150);
      const g0=await geo(page),how=id==='OB-1'?'no student yet':'the details open with a name';
      ok('bars '+tag+' '+id+': '+how+', the chips showing: the case buttons on one row, the form at '+g0.frameTop+' px (at most 212)',g0.rows===1&&g0.frameTop<=212&&g0.chipsIn==='heading'&&!g0.folded,g0);
      /* the student entered and the details folded (Done), as the audit measured */
      if(!(await page.evaluate(()=>$('#pClient').value)))await page.fill('#pClient','Sample Student');
      await page.evaluate(()=>{const b=document.querySelector('#barFold');if(b&&!b.hidden)b.click();});await sleep(300);
      await setChips(page,'Autosaved 12:59 PM','Saved for offline use');await sleep(150);
      const g1=await geo(page);
      if(id==='CN-1'&&tag==='1180x820 touch')await page.screenshot({path:OUT+'bars-1180-folded.png'});
      ok('bars '+tag+' '+id+': folded, "Autosaved 12:59 PM" showing: one row, the form at '+g1.frameTop+' px (at most 212)',g1.rows===1&&g1.frameTop<=212&&g1.folded&&g1.header.h===56,g1);
      await page.evaluate(()=>{const b=document.querySelector('#barEdit');if(b&&b.offsetParent)b.click();});await sleep(200);
    }
    /* the longest texts the two chips can show, with a long school name under the student's */
    await page.fill('#pSite','Royal Palm Beach Elementary School of the Arts and Sciences');await page.evaluate(()=>who());
    await page.evaluate(()=>{const b=document.querySelector('#barFold');if(b&&!b.hidden)b.click();});await sleep(200);
    await setChips(page,'Autosave: storage full','Not saved for offline use: no room');await sleep(150);
    const g2=await geo(page);
    ok('bars '+tag+': the longest chip texts and a long school name: the heading keeps 56 px, the case buttons one row',g2.header.h===56&&g2.rows===1&&g2.frameTop<=212,g2);
    /* fullscreen */
    await page.click('#fullBtn');await sleep(300);const g3=await geo(page);
    ok('bars '+tag+': in fullscreen the form begins under the bar over it',g3.frameTop!==null&&g3.frameTop<=g3.crumb.h+2,g3);
    await page.click('#fullBtn');await sleep(200);
    await ctx.close();
  }
  /* the first visit in an iPad's Safari: the offline app's one-time install tip is a strip of its own (verify-bars/
     measure.js, run on a fresh browser, counts it); it is the only thing added to the 212 px */
  {const ctx=await ipad(br);await ctx.addInitScript(()=>{window.print=function(){};});
    const page=await shell(ctx,'bars tip');await open(page,'CN-1');
    await setChips(page,'Autosaved 12:59 PM','Saved for offline use');await sleep(150);const g=await geo(page);
    ok('bars 1180x820 touch, first visit: the install tip ('+(g.tip?g.tip.h:0)+' px) is the only strip added (the form at '+g.frameTop+' px)',
      !g.tip||g.frameTop<=212+g.tip.h+1,g);
    await ctx.close();}
  /* 1000 and 1024 px, the bar empty and a form holding a long name ("Use these details" showing), the longest chip texts:
     the title gives way before the student's name */
  for(const [w,h] of [[1000,800],[1024,768]]){
    const ctx=await ipad(br,{width:w,height:h});await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'bars name '+w);const fr=await open(page,'IC-1');
    await fr.evaluate(()=>{const M=window.__nbhPacketMap||{};const put=(k,v)=>{for(const s of (M[k]||[])){const x=document.querySelector(s);if(x&&x.tagName!=='BUTTON'){x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));return;}}};
      put('client','Christopher Montgomery-Alexander');put('site','Royal Palm Beach Elementary School');put('sid','10243');});
    await status(page,['IC-1']);await page.waitForFunction(()=>!$('#whoTake').hidden,null,{timeout:9000}).catch(()=>{});
    await setChips(page,'Autosave: storage full','Not saved for offline use: no room');await sleep(200);
    const m=await page.evaluate(()=>{const n=$('#whoName'),hd=document.querySelector('header.top'),t=$('#whoTake'),h1=document.querySelector('header.top h1');
      return {name:n.textContent,shown:n.clientWidth,needs:n.scrollWidth,take:t.hidden?'':t.textContent,title:h1.clientWidth,titleNeeds:h1.scrollWidth,
        headerH:Math.round(hd.getBoundingClientRect().height),over:hd.scrollWidth>hd.clientWidth+1};});
    if(w===1024)await page.screenshot({path:OUT+'bars-name-1024.png',clip:{x:0,y:0,width:w,height:70}});
    ok('bars '+w+'x'+h+': the longest chip texts and "Use these details": the long name keeps '+m.shown+' px (at least 160), the heading its 56 px',
      m.take==='Use these details'&&m.shown>=160&&m.headerH===56&&!m.over,m);
    await ctx.close();
  }
  /* upright and on a phone the chips stay in the bar */
  for(const [tag,vp] of [['820x1180 touch (upright)',{width:820,height:1180}],['390x844 phone',{width:390,height:844}]]){
    const ctx=await ipad(br,vp);await ctx.addInitScript(NOTIP);
    const page=await shell(ctx,'bars '+tag);await open(page,'CN-1');
    await setChips(page,'Autosaved 12:59 PM','Saved for offline use');await sleep(150);
    const g=await geo(page);
    ok('bars '+tag+': the chips stay in the bar (the form at '+g.frameTop+' px; the case buttons take '+g.rows+' rows here, as before)',g.chipsIn==='bar',g);
    await ctx.close();
  }
  /* turning the iPad: the chips move and come back, and still open their window */
  const ctx=await ipad(br);await ctx.addInitScript(NOTIP);const page=await shell(ctx,'bars turn');await open(page,'CN-1');
  const a=(await geo(page)).chipsIn;
  await page.setViewportSize({width:820,height:1180});await sleep(500);const b=(await geo(page)).chipsIn;
  await page.setViewportSize({width:1180,height:820});await sleep(500);const c=await geo(page);
  await page.tap('#autoChip');await sleep(700);
  const dlg=await page.evaluate(()=>({open:$('#dlg').open,title:$('#dlgTitle').textContent}));
  ok('bars: turning the iPad moves the chips into the bar and back, and the Autosave chip still opens its window',a==='heading'&&b==='bar'&&c.chipsIn==='heading'&&dlg.open&&/Autosave/.test(dlg.title),{a,b,c:c.chipsIn,dlg});
  await ctx.close();
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  console.log('sprint A8 on',ED,'at',BASE);
  const br=await chromium.launch();
  const on=k=>!ONLY||ONLY.includes(k);
  if(on('rename'))await rename(br);
  if(on('swaps'))await swaps(br);
  if(on('different'))await different(br);
  if(on('drive'))await drive(br);
  if(on('autosave'))await autosave(br);
  if(on('full'))await full(br);
  if(on('bars'))await bars(br);
  ok('no page error and no console error in the shell',!errs.length,errs);
  console.log(fails?'RESULT: '+fails+' failure(s), '+passes+' passed':'RESULT: all '+passes+' passed');
  await br.close();process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
