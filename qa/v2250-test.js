/* v22.50 the staff directory, at the user's request: a Member of column (the class or team a person belongs to, and a person
   can be in several: a paste adds to them, and everyone selected can be added to a group or taken out of one) beside the
   role; a box on each row and Select all (everyone Find shows) to remove many people, or everyone, at once, or to set one box
   (role, member of, school, phone, note) for everyone selected; a pasted list that updates the people already there (what is
   pasted replaces their details, a box left empty keeps its value), or only fills empty boxes when that is unticked; a list
   from a group's members page no longer brings "Member" in as the role or the join date as the note, and a directory that
   has them offers to clear them. The CSV carries Member of, and a form's picker shows and searches it. iPad-like (touch).
   Simulated people only. usage: node qa/v2250-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;const fs=require('fs'),path=require('path'),os=require('os');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,800):''));if(!c)fails++;};
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const P=(id,name,email,role,note,group)=>({id,name,email,role:role||'',group:group||'',phone:'',site:'',note:note||'',upd:1});
/* the state a group's members page left: the membership as the role and the join date as the note */
const SEED={nbh:'people',v:1,gone:{},drv:null,list:[P('pa','Dana Whitfield','dana.whitfield@example.org','Member','Jul 14, 2021'),P('pb','Paula Brennan','paula.brennan@example.org','Member','May 08, 2019'),
  P('pc','Iris Calloway','iris.calloway@example.org','Member','Sep 06, 2012'),P('pd','Casey Morgan (simulated)','casey.morgan@example.org','Paraprofessional','')]};
const frameOf=(p,re)=>p.frames().find(f=>re.test(decodeURIComponent(f.url())));
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const ctx=await br.newContext({viewport:{width:1180,height:820},hasTouch:true,userAgent:IPAD,serviceWorkers:'block',acceptDownloads:true});
  await ctx.addInitScript(s=>{try{if(!sessionStorage.getItem('seeded')){localStorage.setItem('nbh.people',s);sessionStorage.setItem('seeded','1');}}catch(e){}},JSON.stringify(SEED));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/index.html');await sleep(2500);
  const yes=()=>p.evaluate(()=>{window.__asked=[];window.__cf=window.__cf||wsUI.confirm;wsUI.confirm=(m)=>{window.__asked.push(m);return Promise.resolve(true);};});
  const rows=()=>p.evaluate(()=>[...document.querySelectorAll('#ppBody tr')].map(tr=>Object.assign({shown:!tr.hidden,sel:tr.querySelector('.pp-sel').checked},Object.fromEntries([...tr.querySelectorAll('input[data-f]')].map(i=>[i.dataset.f,i.value])))));
  const stored=()=>p.evaluate(async()=>{const j=await pplLoad();return {list:j.list.map(x=>({id:x.id,name:x.name,role:x.role,group:x.group,note:x.note,email:x.email})),gone:Object.keys(j.gone)};});
  await p.click('#dirBtn');await sleep(500);await yes();
  /* ---- the window ---- */
  const head=await p.evaluate(()=>[...document.querySelectorAll('.pp-tbl thead th')].map(t=>t.textContent.trim()));
  ok('1 the table has a select box, then Name, Role, Member of, Email, Phone, School and Note',JSON.stringify(head)==='["","Name","Role","Member of","Email","Phone","School","Note","Remove"]'&&await p.isVisible('#ppAll'),head);
  let r=await rows();ok('2 each person has a box to select them, unticked, and the bulk bar is hidden',r.length===4&&r.every(x=>!x.sel)&&await p.evaluate(()=>$('#ppBulk').hidden),r);
  /* ---- the membership and join dates a group's page left ---- */
  let tidy=await p.evaluate(()=>{const t=$('#ppTidy');return t.hidden?null:t.textContent;});
  ok('3 three people with "Member" as the role and a join date as the note: the window offers to clear them',/^3 people have a group membership \(such as “Member”\) as the role or a join date as the note/.test(tidy||''),tidy);
  await p.click('#ppTidy button');await sleep(500);
  let st=await stored();r=await rows();
  ok('4 Clear those empties those roles and notes and keeps the rest (the paraprofessional\'s role stays)',st.list.every(x=>x.role!=='Member'&&!/\d{4}/.test(x.note))&&st.list.find(x=>x.id==='pd').role==='Paraprofessional'&&st.list.find(x=>x.id==='pa').email==='dana.whitfield@example.org'&&r.every(x=>x.role!=='Member')&&await p.evaluate(()=>$('#ppTidy').hidden),{st,r});
  /* ---- a group's members page pasted: no membership, no join date ---- */
  await p.click('#ppPasteBtn');
  await p.fill('#ppPasteIn','Riley Shaw (simulated)\triley.shaw@example.org\tMember\tMar 12, 2025\nMorgan Hale (simulated)\tmorgan.hale@example.org\tOwner\tApr 13, 2022');await p.click('#ppPasteGo');await sleep(700);
  st=await stored();let rs=st.list.find(x=>x.name==='Riley Shaw (simulated)'),mh=st.list.find(x=>x.name==='Morgan Hale (simulated)');
  ok('5 rows from a group\'s members page: the name and email come in, the membership and the join date do not',rs&&rs.email==='riley.shaw@example.org'&&!rs.role&&!rs.note&&mh&&!mh.role&&!mh.note,{rs,mh});
  /* ---- a list that updates: a heading row with Member of; replace is ticked by default ---- */
  await p.click('#ppPasteBtn');
  ok('6 the paste box says what it does with people already there, ticked: what is pasted replaces their details',await p.evaluate(()=>$('#ppReplace').checked&&/what you paste replaces their details, and a box left empty in the paste keeps what it has/.test($('#ppReplace').parentNode.textContent)));
  await p.fill('#ppPasteIn','Name\tRole\tMember of\tEmail\n'+
    'Dana Whitfield\tSpeech-language pathologist\tSLPs\tdana.whitfield@example.org\n'+
    'Casey Morgan (simulated)\t\tMs. Whitfield’s class\tcasey.morgan@example.org\n'+
    'Paula Brennan\tArt teacher\tFine arts\tpaula.brennan@example.org\n'+
    'Iris Calloway\tSpeech-language pathologist\tSLPs\tiris.calloway@example.org\n'+
    'Quinn Avery (simulated)\tMusic teacher\tFine arts\tquinn.avery@example.org');
  await p.click('#ppPasteGo');await sleep(800);
  st=await stored();const by=n=>st.list.find(x=>x.name===n)||{};
  const msg=await p.evaluate(()=>$('#ppPasteMsg').textContent);
  ok('7 the pasted list updates the people already there: their roles replaced, Member of filled',by('Dana Whitfield').role==='Speech-language pathologist'&&by('Dana Whitfield').group==='SLPs'&&by('Paula Brennan').role==='Art teacher'&&by('Paula Brennan').group==='Fine arts'&&by('Iris Calloway').group==='SLPs',st.list);
  ok('8 a box left empty in the paste keeps its value (the paraprofessional\'s role), and the new person is added',by('Casey Morgan (simulated)').role==='Paraprofessional'&&by('Casey Morgan (simulated)').group==='Ms. Whitfield’s class'&&by('Quinn Avery (simulated)').role==='Music teacher'&&st.list.length===7,st.list);
  ok('9 it says what it did: 1 added, 4 updated',/^1 person added, 4 updated\./.test(msg),msg);
  r=await rows();ok('10 the table shows Member of',r.find(x=>x.name==='Iris Calloway').group==='SLPs',r);
  /* ---- unticked: only empty boxes are filled ---- */
  await p.click('#ppPasteBtn');await p.uncheck('#ppReplace');
  await p.fill('#ppPasteIn','Name\tRole\tSchool\tEmail\nDana Whitfield\tBehavior specialist\tSimulated Elementary\tdana.whitfield@example.org');await p.click('#ppPasteGo');await sleep(700);
  st=await stored();
  ok('11 with it unticked the role stays as it was and only the empty School is filled',by('Dana Whitfield').role==='Speech-language pathologist'&&(await p.evaluate(async()=>(await pplLoad()).list.find(x=>x.name==='Dana Whitfield').site))==='Simulated Elementary',by('Dana Whitfield'));
  await p.check('#ppReplace');
  /* ---- more than one group: a paste adds to them ---- */
  await p.evaluate(()=>{if($('#ppPaste').hidden)$('#ppPasteBtn').click();});await p.fill('#ppPasteIn','Name\tEmail\tMember of\nCasey Morgan (simulated)\tcasey.morgan@example.org\tParaprofessionals');await p.click('#ppPasteGo');await sleep(700);
  st=await stored();
  ok('11b a person can be in more than one group: a pasted Member of is added to the groups the person has',by('Casey Morgan (simulated)').group==='Ms. Whitfield’s class; Paraprofessionals'&&by('Casey Morgan (simulated)').role==='Paraprofessional',by('Casey Morgan (simulated)'));
  /* ---- Find, Select all: everyone shown ---- */
  await p.fill('#ppFind','slps');await sleep(300);
  await p.check('#ppAll');await sleep(200);
  r=await rows();let bulk=await p.evaluate(()=>({hidden:$('#ppBulk').hidden,n:$('#ppSelN').textContent}));
  ok('12 Find narrows to a group, and Select all takes only the people shown',r.filter(x=>x.sel).map(x=>x.name).sort().join('|')==='Dana Whitfield|Iris Calloway'&&r.filter(x=>x.shown).length===2&&!bulk.hidden&&bulk.n==='2 selected',{r,bulk});
  /* set a box for everyone selected */
  await p.selectOption('#ppSetF','site');await p.fill('#ppSetV','Simulated Middle School');await p.click('#ppSetGo');await sleep(600);
  const asked=await p.evaluate(()=>window.__asked.slice(-1)[0]);
  st=await p.evaluate(async()=>(await pplLoad()).list.map(x=>({name:x.name,site:x.site})));
  ok('13 Set School for the 2 selected, after asking: both changed, no one else',/^Set School to “Simulated Middle School” for 2 people\?$/.test(asked)&&st.filter(x=>x.site==='Simulated Middle School').map(x=>x.name).sort().join('|')==='Dana Whitfield|Iris Calloway',{asked,st});
  /* an empty value clears that box */
  await p.selectOption('#ppSetF','site');await p.fill('#ppSetV','');await p.click('#ppSetGo');await sleep(600);
  st=await p.evaluate(async()=>(await pplLoad()).list.filter(x=>x.site==='Simulated Middle School').length);
  ok('14 Apply with nothing typed clears that box for everyone selected',st===0&&/^Clear School for 2 people\?$/.test(await p.evaluate(()=>window.__asked.slice(-1)[0])),st);
  /* add everyone selected to a group, then take them out of it: their other groups stay */
  await p.selectOption('#ppSetF','g+');await p.fill('#ppSetV','Testing team (simulated)');await p.click('#ppSetGo');await sleep(600);
  st=await p.evaluate(async()=>(await pplLoad()).list.filter(x=>/Testing team/.test(x.group)).map(x=>x.name+'|'+x.group).sort());
  ok('14b Add to a group adds it beside the groups they have, after asking',/^Add 2 people to “Testing team \(simulated\)”\?$/.test(await p.evaluate(()=>window.__asked.slice(-1)[0]))&&JSON.stringify(st)==='["Dana Whitfield|SLPs; Testing team (simulated)","Iris Calloway|SLPs; Testing team (simulated)"]'&&(await rows()).filter(x=>x.group==='SLPs; Testing team (simulated)').length===2,st);
  await p.selectOption('#ppSetF','g-');await p.fill('#ppSetV','testing team (simulated)');await p.click('#ppSetGo');await sleep(600);
  st=await p.evaluate(async()=>(await pplLoad()).list.filter(x=>/SLPs/.test(x.group)).map(x=>x.name+'|'+x.group).sort());
  ok('14c Take out of a group removes just that group (whatever its capitals), and keeps SLPs',/^Take 2 people out of “testing team \(simulated\)”\?$/.test(await p.evaluate(()=>window.__asked.slice(-1)[0]))&&JSON.stringify(st)==='["Dana Whitfield|SLPs","Iris Calloway|SLPs"]',st);
  /* a row Find hides is no longer selected */
  await p.fill('#ppFind','');await sleep(200);await p.fill('#ppFind','fine arts');await sleep(300);
  r=await rows();ok('15 when Find hides selected people they are unselected, so nothing is done to people you cannot see',r.filter(x=>x.sel).length===0&&await p.evaluate(()=>$('#ppBulk').hidden),r.filter(x=>x.sel));
  /* remove the people selected */
  await p.check('#ppAll');await sleep(150);await p.click('#ppDelSel');await sleep(600);
  st=await stored();
  ok('16 Remove takes out everyone selected (the 2 in fine arts), after asking, and remembers it for the other devices',/^Remove these 2 people from the staff directory\?$/.test(await p.evaluate(()=>window.__asked.slice(-1)[0]))&&st.list.length===5&&!st.list.some(x=>x.group==='Fine arts')&&st.gone.length===2,st);
  /* everyone */
  await p.fill('#ppFind','');await sleep(200);await p.check('#ppAll');await sleep(150);
  bulk=await p.evaluate(()=>$('#ppSelN').textContent);
  ok('17 Select all with nothing typed in Find takes everyone',bulk==='5 selected',bulk);
  /* save to a file before removing everyone; then remove everyone and open the file again */
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#ppSaveBtn')]);const fp=path.join(os.tmpdir(),'ppl50-'+process.pid+'.csv');await dl.saveAs(fp);const csv=fs.readFileSync(fp,'utf8');
  ok('18 the CSV has a Member of column',/^Name,Role,Member of,Email,Phone,School,Note\r\n/.test(csv)&&/\r\nIris Calloway,Speech-language pathologist,SLPs,iris\.calloway@example\.org,/.test(csv),csv.slice(0,300));
  await p.click('#ppDelSel');await sleep(600);
  st=await stored();
  ok('19 Remove with everyone selected empties the directory, and the question says it is everyone',st.list.length===0&&/^Remove these 5 people from the staff directory\? That is everyone in it\.$/.test(await p.evaluate(()=>window.__asked.slice(-1)[0]))&&/No one yet/.test(await p.evaluate(()=>$('#ppCount').textContent)),st);
  await p.setInputFiles('#ppFile',fp);await sleep(800);
  st=await stored();ok('20 the file opens again with Member of',st.list.length===5&&st.list.find(x=>x.name==='Dana Whitfield').group==='SLPs',st.list);
  try{fs.unlinkSync(fp);}catch(e){}
  await p.evaluate(()=>{wsUI.confirm=window.__cf;$('#dlg').close();});await sleep(300);
  /* ---- a form's picker shows Member of and finds by it ---- */
  await p.evaluate(()=>openForm('IA-1'));await sleep(3500);
  const fr=frameOf(p,/IA-1_/);
  await fr.evaluate(()=>{const n=document.querySelector('input[name="inf[0].name"]');n.scrollIntoView({block:'center'});});
  await fr.tap('input[name="inf[0].name"]');await sleep(500);await fr.type('input[name="inf[0].name"]','slp');await sleep(400);
  const pk=await fr.evaluate(()=>[...document.querySelectorAll('#nbhPpl button[data-pp]:not([data-pp=dir])')].map(x=>x.textContent));
  ok('21 in a form, typing "slp" finds the SLPs, and each shows its Member of',pk.length===2&&pk.every(t=>/SLPs/.test(t)),pk);
  }catch(x){console.log('FAIL exception '+(x&&x.stack||x));fails++;}
  ok('22 no script errors',errs.length===0,errs);
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
