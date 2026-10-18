/* v22.35 the staff directory: the school staff the forms go to, typed once in the workstation (Staff directory, in the top
   bar) and offered in the forms' boxes where a staff member is named. Checks: the window (paste a list in its forms, add,
   change, find, remove, save to a CSV file and open it again); kept on the device across a reload, also when Safari refuses
   its settings store; the merge two devices' copies go through for Google Drive; a form in the workstation (IA-1's
   informants): tapping the name box lists the people, picking fills the name, role and email (and the form keeps them),
   typing narrows the list; a person typed by hand is offered to the directory, and saved; the form's "Edit the staff
   directory" opens the window; a box that is not a staff member's offers nothing. iPad-like (touch). Simulated people only.
   usage: node qa/v2235-staff-directory-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,700):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const LIST='Dana Whitfield, 4th grade teacher, dana.whitfield@example.org, 555-0142, Simulated Elementary\n'+
  'Paula Brennan <paula.brennan@example.org>; Iris Calloway <iris.calloway@example.org>\n'+
  'Casey Morgan (simulated)\tParaprofessional\tcasey.morgan@example.org';
const frameOf=(p,re)=>p.frames().find(f=>re.test(decodeURIComponent(f.url())));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);
  /* ---------- the window ---------- */
  ok('1 the top bar has Staff directory',await p.isVisible('#dirBtn'));
  await p.click('#dirBtn');await sleep(400);
  ok('2 it opens the Staff directory window, empty',await p.evaluate(()=>$('#dlg').open&&$('#dlgTitle').textContent==='Staff directory'&&!document.querySelectorAll('#ppBody tr').length));
  await p.click('#ppPasteBtn');await p.fill('#ppPasteIn',LIST);await p.click('#ppPasteGo');await sleep(700);
  const rows=()=>p.evaluate(()=>[...document.querySelectorAll('#ppBody tr')].map(tr=>Object.fromEntries([...tr.querySelectorAll('input[data-f]')].map(i=>[i.dataset.f,i.value]))));
  let r=await rows();
  ok('3 a pasted list: a line of parts, an email’s To line (two people), a spreadsheet row: four people',r.length===4&&r.some(x=>x.name==='Dana Whitfield'&&x.role==='4th grade teacher'&&x.email==='dana.whitfield@example.org'&&x.phone==='555-0142'&&x.site==='Simulated Elementary')
    &&r.some(x=>x.name==='Paula Brennan'&&x.email==='paula.brennan@example.org')&&r.some(x=>x.name==='Iris Calloway')&&r.some(x=>x.name==='Casey Morgan (simulated)'&&x.role==='Paraprofessional'),r);
  await p.click('#ppPasteBtn');await p.uncheck('#ppReplace');await p.fill('#ppPasteIn','Dana Whitfield, dana.whitfield@example.org, Room 12');   /* v22.50 fill-only */await p.click('#ppPasteGo');await sleep(600);
  r=await rows();ok('4 the same person again is not added twice (completed instead)',r.length===4,r);
  /* add one by hand */
  await p.click('#ppAdd');await sleep(200);
  await p.fill('#ppBody tr:first-child input[data-f=name]','Jordan Lee (simulated)');await p.press('#ppBody tr:first-child input[data-f=name]','Tab');
  await p.fill('#ppBody tr:first-child input[data-f=role]','School psychologist');await p.press('#ppBody tr:first-child input[data-f=role]','Tab');
  await p.fill('#ppBody tr:first-child input[data-f=email]','jordan.lee@example.org');await p.press('#ppBody tr:first-child input[data-f=email]','Tab');await sleep(500);
  let st=await p.evaluate(async()=>(await pplLoad()).list.map(x=>x.name+'|'+x.role+'|'+x.email));
  ok('5 Add a person: typed into the new row and kept',st.length===5&&st.includes('Jordan Lee (simulated)|School psychologist|jordan.lee@example.org'),st);
  await p.fill('#ppFind','para');await sleep(150);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('#ppBody tr')].filter(tr=>!tr.hidden).map(tr=>tr.querySelector('[data-f=name]').value));
  ok('6 Find narrows the list',vis.length===1&&vis[0]==='Casey Morgan (simulated)',vis);
  await p.fill('#ppFind','');await sleep(100);
  /* remove (the confirm answered yes) */
  await p.evaluate(()=>{window.__cf=wsUI.confirm;wsUI.confirm=()=>Promise.resolve(true);});
  await p.click('#ppBody tr:has(input[value="Iris Calloway"]) .pp-x');await sleep(500);
  await p.evaluate(()=>{wsUI.confirm=window.__cf;});
  st=await p.evaluate(async()=>{const j=await pplLoad();return {n:j.list.length,iris:j.list.some(x=>x.name==='Iris Calloway'),gone:Object.keys(j.gone).length};});
  ok('7 Remove takes the person out (and remembers it, for the other devices)',st.n===4&&!st.iris&&st.gone===1,st);
  /* save to a file, open it again */
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#ppSaveBtn')]);const fp=path.join(os.tmpdir(),'ppl-'+process.pid+'.csv');await dl.saveAs(fp);
  const csv=fs.readFileSync(fp,'utf8');
  ok('8 Save to a file: a CSV with a heading row and one row a person',dl.suggestedFilename()==='Staff directory.csv'&&/^Name,Role,Member of,Email,Phone,School,Note\r\n/.test(csv)&&csv.trim().split(/\r\n/).length===5&&/Dana Whitfield,4th grade teacher,,dana\.whitfield@example\.org,555-0142,Simulated Elementary,\r\n/.test(csv),csv);
  const back=await p.evaluate(t=>pplRead(t),csv);
  ok('9 the CSV reads back as the same people',back.length===4&&back.some(x=>x.name==='Jordan Lee (simulated)'&&x.role==='School psychologist'),back);
  await p.evaluate(async()=>{const j=await pplLoad();j.list=[];await pplSave(j);});
  await p.setInputFiles('#ppFile',fp);await sleep(700);
  st=await p.evaluate(async()=>(await pplLoad()).list.length);ok('10 Open a file puts them back',st===4,st);
  /* v22.35 a group's members page copied (one column: name, email, Member, join date), as a sheet of it would paste */
  const stack=await p.evaluate(()=>pplRead('Member\nEmail/ID\nRole\nJoin Date\nCasey Morgan (simulated)\ncasey.morgan@example.org\nMember\nOct 9, 2026\nJordan Lee (simulated)\njordan.lee@example.org\nOwner\nJul 14, 2021\n"Ms. A (simulated)"\n"ms.a@example.org"\n"Member"\n"Aug 4, 2026"'));
  ok('10b a members list a person over several lines (name, email, Member, a date) reads as one person each',stack.length===3&&stack.every(x=>x.name&&/@example\.org$/.test(x.email)&&!x.role)&&stack[2].name==='Ms. A (simulated)',stack);
  fs.unlinkSync(fp);
  await p.evaluate(()=>$('#dlg').close());
  /* ---------- kept on the device ---------- */
  await p.reload();await sleep(2200);
  st=await p.evaluate(async()=>(await pplLoad()).list.length);ok('11 kept across a reload',st===4,st);
  st=await p.evaluate(async()=>{localStorage.removeItem('nbh.people');return (await pplLoad()).list.length;});
  ok('12 kept in the workstation’s own store when Safari’s settings lose it',st===4,st);
  /* ---------- the merge for Google Drive ---------- */
  const m=await p.evaluate(()=>{const A={nbh:'people',list:[{id:'a',name:'Dana Whitfield',email:'d@example.org',upd:5},{id:'b',name:'Paula Brennan',email:'p@example.org',upd:5},{id:'c',name:'Iris',email:'i@example.org',upd:5}],gone:{}};
    const B={nbh:'people',list:[{id:'a',name:'Dana Whitfield',role:'Teacher',email:'d@example.org',upd:9},{id:'x',name:'Paula B.',email:'P@example.org',upd:7}],gone:{c:6}};
    const M=pplMerge(A,B);return M.list.map(p=>p.id+':'+(p.role||'')).sort();});
  ok('13 two devices’ copies merge: the later change stands, a removal stands, one person per email',JSON.stringify(m)==='["a:Teacher","x:"]',m);
  /* ---------- a form in the workstation: IA-1's informants ---------- */
  await p.evaluate(()=>openForm('IA-1'));await sleep(3500);
  const fr=frameOf(p,/IA-1_/);
  ok('14 IA-1 is open',!!fr);
  await fr.evaluate(()=>{const n=document.querySelector('input[name="inf[0].name"]');n.scrollIntoView({block:'center'});});
  await fr.tap('input[name="inf[0].name"]');await sleep(500);
  let pk=await fr.evaluate(()=>{const b=document.getElementById('nbhPpl');return b&&!b.hidden?[...b.querySelectorAll('button[data-pp]:not([data-pp=dir])')].map(x=>x.querySelector('.pp-n').textContent):null;});
  ok('15 tapping an informant’s name box lists the directory',pk&&pk.length===4&&pk[0]==='Casey Morgan (simulated)',pk);
  await fr.type('input[name="inf[0].name"]','dan');await sleep(300);
  pk=await fr.evaluate(()=>[...document.querySelectorAll('#nbhPpl button[data-pp]:not([data-pp=dir])')].map(x=>x.querySelector('.pp-n').textContent));
  ok('16 typing narrows it',pk.length===1&&pk[0]==='Dana Whitfield',pk);
  await fr.tap('#nbhPpl button[data-pp="0"]');await sleep(400);
  const row=await fr.evaluate(()=>['name','role','email'].map(f=>document.querySelector('input[name="inf[0].'+f+'"]').value));
  ok('17 picking fills the name, the role and the email',JSON.stringify(row)===JSON.stringify(['Dana Whitfield','4th grade teacher','dana.whitfield@example.org']),row);
  const kept=await fr.evaluate(()=>{const d=typeof collect==='function'?collect():null;return d?JSON.stringify(d).indexOf('dana.whitfield@example.org')>=0:null;});
  ok('18 the form keeps them (its own save has them)',kept!==false,kept);
  ok('19 the list closes after a pick',await fr.evaluate(()=>document.getElementById('nbhPpl').hidden));
  /* by hand: offered to the directory */
  await fr.tap('input[name="inf[1].name"]');await sleep(200);await fr.evaluate(()=>{const b=document.getElementById('nbhPpl');if(b)b.hidden=true;});
  await fr.fill('input[name="inf[1].name"]','Ms. A (simulated)');await fr.fill('input[name="inf[1].role"]','Speech-language pathologist');
  await fr.fill('input[name="inf[1].email"]','ms.a@example.org');await fr.press('input[name="inf[1].email"]','Tab');await sleep(600);
  const offer=await fr.evaluate(()=>{const b=[...document.querySelectorAll('.nbh-toast .pp-save')];return b.length?b[0].closest('.nbh-toast').textContent:'';});
  ok('20 a person typed by hand is offered to the directory',/Ms\. A \(simulated\).*not in your staff directory/.test(offer),offer);
  await fr.click('.nbh-toast .pp-save');await sleep(600);
  st=await p.evaluate(async()=>(await pplLoad()).list.find(x=>x.email==='ms.a@example.org')||null);
  ok('21 Save to directory keeps them, with their role',st&&st.name==='Ms. A (simulated)'&&st.role==='Speech-language pathologist',st);
  /* Edit the staff directory from the form */
  await fr.tap('input[name="inf[2].name"]');await sleep(400);
  await fr.tap('#nbhPpl button[data-pp="dir"]');await sleep(600);
  ok('22 the form’s Edit the staff directory opens the window in the workstation',await p.evaluate(()=>$('#dlg').open&&$('#dlgTitle').textContent==='Staff directory'&&document.querySelectorAll('#ppBody tr').length===5));
  await p.evaluate(()=>$('#dlg').close());
  /* a box that is not a staff member's offers nothing */
  const other=await fr.evaluate(()=>{const e=document.querySelector('input[name="inf[0].mo"]');e.focus();return new Promise(r=>setTimeout(()=>{const b=document.getElementById('nbhPpl');r(!b||b.hidden);},300));});
  ok('23 a box that is not a staff member’s offers nothing',other);
  /* ---------- Form DM-1's team: a role list and one box for phone and email; a parent is never offered ---------- */
  await p.evaluate(()=>openForm('DM-1'));await sleep(3500);
  const dm=frameOf(p,/DM-1_/);
  const roles=await dm.evaluate(()=>[...document.querySelector('select[name="t[0].role"]').options].map(o=>o.value));
  ok('26 DM-1\u2019s team roles include Parent, BHP, BIA, Fine arts teacher, ESE coordinator, Transportation leadership and Group home manager',['Parent','Behavioral Health Professional (BHP)','Behavior Intervention Associate (BIA)','Transportation leadership','Group home manager','Fine arts teacher','ESE coordinator'].every(r=>roles.includes(r)),roles);
  await dm.evaluate(()=>{for(let e=document.querySelector('input[name="t[0].name"]');e&&e!==document.body;e=e.parentElement)if(getComputedStyle(e).display==='none'){e.hidden=false;e.style.setProperty('display','block','important');}document.querySelector('input[name="t[0].name"]').scrollIntoView({block:'center'});});
  await dm.tap('input[name="t[0].name"]');await sleep(400);await dm.type('input[name="t[0].name"]','dana');await sleep(300);
  await dm.tap('#nbhPpl button[data-pp="0"]');await sleep(400);
  const tm=await dm.evaluate(()=>['role','name','contact'].map(f=>document.querySelector('[name="t[0].'+f+'"]').value));
  ok('27 DM-1\u2019s team: picking fills the name, the nearest role (4th grade teacher \u2192 Classroom teacher) and phone and email in their one box',JSON.stringify(tm)===JSON.stringify(['Classroom teacher','Dana Whitfield','dana.whitfield@example.org, 555-0142']),tm);
  await dm.evaluate(()=>{const set=(n,v)=>{const e=document.querySelector('[name="'+n+'"]');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};set('t[1].role','Parent');});
  await dm.tap('input[name="t[1].name"]');await sleep(200);await dm.evaluate(()=>{const b=document.getElementById('nbhPpl');if(b)b.hidden=true;});
  await dm.fill('input[name="t[1].contact"]','ana.rivera@example.org');await dm.fill('input[name="t[1].name"]','Ana Rivera');await dm.press('input[name="t[1].name"]','Tab');await sleep(600);
  const fam=await dm.evaluate(()=>[...document.querySelectorAll('.nbh-toast')].map(t=>t.textContent).join(' | '));
  ok('28 a parent typed into the team is never offered to the staff directory',!/Ana Rivera/.test(fam),fam);
  ok('24 Diagnostics counts the directory',/^5 people/.test(await p.evaluate(()=>pplDiag())));
  /* ---------- every form with a staff member's box offers the directory there (and never in the student's own boxes) ---------- */
  const fs2=require('fs'),WANT=['ABC_','AD-1_','CF-1_','CR-1_','CT-1_','DA-1_','DM-1_','Daily_','Delay-','EA-1_','EB-1_','GC-1_','IA-1_','IC-1_','IM-1_','IN-1_','MS-1_','MT-1_','OB-1_','PD-1_','QS-1_','RR-1_','RS-1_','SI-1_','SM-1_','ST-1_','SV-1_','Scatterplot','TB-1_','TD-1_','TI-1_','TV-1_'];
  const files=fs2.readdirSync(path.join(__dirname,'..','NBH-Workstation')).filter(f=>/\.html$/.test(f)&&WANT.some(w=>f.indexOf(w)===0));
  const ctx2=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block'});const none=[],student=[];
  for(const f of files){const q=await ctx2.newPage();q.on('pageerror',e=>errs.push(f+': '+e.message));await q.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(700);
    const r=await q.evaluate(()=>{let n=0,st=0;document.querySelectorAll('input').forEach(e=>{if(nbhUI.people.bindOf(e)){n++;if(/^(s_name|s_id|s\.name|m\.client|client)$/.test(e.name||'')||e.id==='m_client')st++;}});return {n,st};});
    if(!r.n)none.push(f);if(r.st)student.push(f);await q.close();}
  ok('29 every form with a staff member\u2019s box offers the directory ('+files.length+' forms)',files.length===WANT.length&&!none.length,{files:files.length,none});
  ok('30 never in the student\u2019s own boxes',!student.length,student);
  /* the Email it dialog of the respondent pages: the list shows in the dialog, and picking puts the email in To */
  const q=await ctx2.newPage();q.on('pageerror',e=>errs.push('IA-1 alone: '+e.message));await q.goto(L.BASE+'/NBH-Workstation/IA-1_Indirect-Functional-Assessment-Protocol_v2026-09.html');await sleep(1000);
  const dir=await p.evaluate(()=>localStorage.getItem('nbh.people'));
  await q.evaluate(d=>{localStorage.setItem('nbh.people',d);localStorage.setItem('nbh-invite-to','old.address@example.org');NBH_RESPOND.invite({links:[{url:'https://example.org/q'}]});},dir);await sleep(300);
  await q.tap('#nbhInvTo');await sleep(400);
  const iv=await q.evaluate(()=>{const b=document.getElementById('nbhPpl');return {host:b&&b.parentElement.tagName,vis:b&&!b.hidden,n:b?b.querySelectorAll('button[data-pp]').length:0};});
  await q.tap('#nbhPpl button[data-pp="0"]');await sleep(300);const to=await q.inputValue('#nbhInvTo');
  ok('31 Email it: tapping To (an old address in it) lists the directory in the dialog, and a pick puts that email in To',iv.host==='DIALOG'&&iv.vis&&iv.n>=5&&/@example\.org$/.test(to)&&to!=='old.address@example.org',{iv,to});
  await ctx2.close();
  ok('25 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
