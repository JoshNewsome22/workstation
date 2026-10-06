/* v21.45 Form SM-1 v2: the design (looks, themes, rating styles), the reward store, the target library, the schedules, the quick
   starts, the live preview, the printing extras, the contract's link to the sheet, and the walkthrough with Save as video.
   1. An older file (no design) opens to the classic sheet; Classic with "As the sheet type has it" draws what v21.44 drew.
   2. Every look draws every sheet type it takes (match, contract, smiley, cico, interval, rubric) with its own frame (.v2), the
      others (perf, interlock, weekly) keep the classic layout; the rating styles change the glyphs and the points possible.
   3. Save data and Open data keep the design, the store and the second schedule; a forged file is cleaned.
   4. The library places targets (no name twice, six at most); a quick start fills empty targets and periods and keeps entered ones;
      a schedule template and rows every N minutes; the store fills from the reward menu with pictures; Fill the empty lines from
      the sheet fills the contract; the preview follows the sheet; the fit notice and the extra pages (week, half page, menu, staff
      guide, practice) are made.
   5. The walkthrough builds for every sheet type and rating style with the lines that sheet needs, and the frames Save as video
      paints match the stage as shown.
   usage: node qa/sm1-v2-test.js   (WS_URL as in qa/lib.js) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html';
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined?'  '+(typeof i==='string'?i:JSON.stringify(i)):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch();const page=await br.newPage({viewport:{width:1180,height:820}});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  await page.goto(URL);await sleep(1500);
  await page.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};nbhUI.confirm=async()=>true;});
  /* 1. an older file */
  const old=await page.evaluate(()=>{const f={form:'SM-1',rev:'2026-10',S:{meta:{client:'Old File',nick:'Al',goal:'80'},chk:{pict:true},sys:'match',tg:[{word:'I sit',def:'d',cue:'',ex:'',nex:'',icon:'',img:'',goal:''},{word:'I work',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''}],per:[{t:'09:00',label:'Math',icon:'',img:''}]}};
    const o=fromFile(f);S=o;renderAll();const out=document.getElementById('sheetOut');return {look:smLook(),rate:smRateKey(),v2:!!out.querySelector('.v2'),faces:out.querySelectorAll('svg.face').length,d:JSON.stringify(S.d),store:smStore().length};});
  ok('an older file opens on Classic, the faces as before',old.look==='classic'&&old.rate==='auto'&&!old.v2&&old.faces>0&&old.d==='{}'&&old.store===0,old);
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1200);
  /* 2. looks and rating styles */
  const SYS=['match','contract','smiley','cico','interval','rubric'],LOOKS=['bright','theme','clean','discreet'];
  const grid=await page.evaluate(([SYS,LOOKS])=>{const r=[];for(const l of LOOKS)for(const s of SYS){S.d.look=l;S.sys=s;S.d.rate='thumbs';S.chk.weekly=false;renderAll();const o=document.getElementById('sheetOut');
    r.push({l,s,v2:!!o.querySelector('.v2.look-'+l),cells:o.querySelectorAll('.gset').length,title:(o.querySelector('.v2-title,.dch b')||{}).textContent||''});}return r;},[SYS,LOOKS]);
  ok('every look draws every sheet type in its own frame, with rating cells',grid.every(g=>g.v2&&g.cells>0),grid.filter(g=>!(g.v2&&g.cells>0)));
  const keep=await page.evaluate(()=>{const r={};S.d.look='bright';for(const s of ['perf','interlock']){S.sys=s;renderAll();const o=document.getElementById('sheetOut');r[s]=!o.querySelector('.v2')&&o.classList.contains('look-bright');}
    S.sys='contract';S.chk.weekly=true;renderAll();r.weekly=!document.querySelector('#sheetOut .v2');S.d.look='discreet';renderAll();r.weeklyCards=document.querySelectorAll('#sheetOut .dc').length;S.chk.weekly=false;return r;});
  ok('the performance count, the interlocking session and weekly sheets keep the classic layout in the look; discreet makes weekly day cards',keep.perf&&keep.interlock&&keep.weekly&&keep.weeklyCards===6,keep);
  const pts=await page.evaluate(()=>{const r={};S.d.look='bright';S.sys='match';const P=S.per.length,T=S.tg.length;
    for(const k of ['auto','thumbs','faces3','stars3','s15']){S.d.rate=k;S.d.rv='';renderAll();r[k]=possible().poss;}S.d.rate='p012';S.sys='cico';renderAll();r.cico=possible().poss;S.sys='contract';S.d.rate='s15';renderAll();r.contract15=possible().poss;
    S.d.rate='faces3';S.d.rv='3,1,0';S.sys='smiley';renderAll();r.smiley_rv=possible().poss;S.d.rv='';r.P=P;r.T=T;return r;});
  ok('the points possible follow the rating style (two-level Self & Match keeps the Match Points table; more levels: the top rating and the bonus)',
    pts.auto===pts.P*pts.T*2&&pts.thumbs===pts.auto&&pts.faces3===pts.P*pts.T*3&&pts.stars3===pts.P*pts.T*4&&pts.s15===pts.P*pts.T*6&&pts.cico===pts.P*pts.T*2&&pts.contract15===pts.P*pts.T*5&&pts.smiley_rv===pts.P*pts.T*3,pts);
  const themes=await page.evaluate(()=>{S.d.look='theme';S.sys='match';S.d.rate='stars3';const r=[];for(const t of Object.keys(SM_THEMES).filter(k=>!SM_THEMES[k].col)){S.d.theme=t;renderAll();const o=document.getElementById('sheetOut');r.push(t+':'+(o.querySelector('.v2.theme-'+t)?1:0)+(o.querySelectorAll('.v2-head svg.art').length>=2?1:0)+(o.querySelectorAll('.gstars').length?1:0));}return r;});
  ok('the seven themes, each with its pictures and the stars',themes.every(x=>/:111$/.test(x)),themes);
  /* v21.48 the student's photo on every look: shown, a blank circle to glue one onto, or off; Bright shows it by itself, the others
     only when asked; Open data keeps the choice and drops a forged one */
  const ph=await page.evaluate(()=>{const keep=JSON.stringify(S.d);const c=document.createElement('canvas');c.width=c.height=40;c.getContext('2d').fillRect(0,0,40,40);const img=c.toDataURL('image/jpeg',.8);
    const r={};for(const look of ['classic','bright','theme','clean','discreet'])for(const phs of ['','show','blank','off']){S.d=Object.assign(JSON.parse(keep),{look,theme:'space',phs,avimg:img,av:''});S.sys='match';S.chk.weekly=false;renderAll();
      const o=document.getElementById('sheetOut');r[look+'/'+(phs||'-')]=(o.querySelector('img.av-img')?'I':'')+(o.querySelector('.v2-ph-blank')?'B':'');}
    const f=fromFile({form:'SM-1',rev:'2026-10',S:Object.assign(JSON.parse(JSON.stringify(S)),{d:Object.assign(JSON.parse(keep),{phs:'blank'})})}),g=fromFile({form:'SM-1',rev:'2026-10',S:Object.assign(JSON.parse(JSON.stringify(S)),{d:Object.assign(JSON.parse(keep),{phs:'<b>'})})});
    S.d=JSON.parse(keep);renderAll();return {r,kept:f.d.phs,dropped:!('phs' in g.d)};});
  const want={'classic/-':'','classic/show':'I','classic/blank':'B','classic/off':'','bright/-':'I','bright/show':'I','bright/blank':'B','bright/off':'','theme/-':'','theme/show':'I','theme/blank':'B','theme/off':'','clean/-':'','clean/show':'I','clean/blank':'B','clean/off':'','discreet/-':'','discreet/show':'I','discreet/blank':'B','discreet/off':''};
  ok('the student’s photo: on every look when shown, a blank circle to glue onto, off when not; Bright shows it by itself',Object.keys(want).every(k=>ph.r[k]===want[k])&&ph.kept==='blank'&&ph.dropped,{ph,want});
  /* v21.46 the plain and colour themes: no pictures, the plain words, the colour on the header; Plain is black on white */
  const cols=await page.evaluate(()=>{S.d.look='theme';S.sys='match';S.d.rate='thumbs';S.d.accent='';const r={};for(const t of Object.keys(SM_THEMES).filter(k=>SM_THEMES[k].col)){S.d.theme=t;renderAll();const o=document.getElementById('sheetOut'),h=o.querySelector('.v2-head');
      r[t]={col:!!o.querySelector('.v2.theme-col.theme-'+t),art:o.querySelectorAll('svg.art').length,title:o.querySelector('.v2-title').textContent,bg:getComputedStyle(h).backgroundImage.slice(0,40),bgc:getComputedStyle(h).backgroundColor,fg:getComputedStyle(o.querySelector('.v2-title')).color};}
    const n=Object.keys(r).length;S.d.theme='sports';return {n,r};});
  ok('thirteen plain and colour themes, no pictures, the sheet type\'s own title',cols.n===13&&Object.values(cols.r).every(x=>x.col&&x.art===0&&x.title==='Sam’s Self & Match Sheet'),cols);
  ok('Plain is black on white; a colour theme has its colour on the header',cols.r.plain.bgc==='rgb(255, 255, 255)'&&/rgb\(17, 17, 17\)/.test(cols.r.plain.fg)&&/gradient/.test(cols.r.ocean.bg)&&/rgb\(255, 255, 255\)/.test(cols.r.ocean.fg),{plain:cols.r.plain,ocean:cols.r.ocean});
  const classicRate=await page.evaluate(()=>{S.d.look='classic';S.sys='match';S.d.rate='pm';renderAll();const o=document.getElementById('sheetOut');return {pm:o.querySelectorAll('.gt').length,faces:o.querySelectorAll('svg.face').length};});
  ok('a rating style applies to the classic sheet too',classicRate.pm>0,classicRate);
  /* 3. save and open */
  const rt=await page.evaluate(()=>{S.d={look:'theme',theme:'space',rate:'faces3',tw:'Coach',mid:'by lunch',bank:true,alt:true,qr:'https://example.org/v',cards:'4'};S.per2=[{t:'08:00',label:'Specials day',icon:'art',img:''}];renderAll();
    const f=JSON.parse(JSON.stringify({form:'SM-1',rev:'2026-10',S}));f.S.d.look='evil';f.S.d.extra='x';f.S.store.push({n:'<b>x</b>',icon:'nope',img:'javascript:1',p:'5',tier:'zz'});
    const o=fromFile(f);return {look:o.d.look,theme:o.d.theme,tw:o.d.tw,bank:o.d.bank,alt:o.d.alt,extra:'extra' in o.d,per2:o.per2.length&&o.per2[0].label,storeN:o.store.length,last:o.store[o.store.length-1]};});
  ok('Open data keeps the design, the store and the second schedule, and cleans what does not belong',rt.look===undefined&&rt.theme==='space'&&rt.tw==='Coach'&&rt.bank===true&&rt.alt===true&&!rt.extra&&rt.per2==='Specials day'&&rt.last.icon===''&&rt.last.img===''&&rt.last.tier==='',rt);
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1000);
  /* 4. the editors */
  const lib=await page.evaluate(()=>{S.tg=[{word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''}];const n1=smLibPlace(['task_start_y','stay_area','kind_words']);const n2=smLibPlace(['stay_area']);const n3=smLibPlace(SM_LIB.map(x=>x.id));
    return {n1,n2,n3,len:S.tg.length,words:S.tg.map(t=>t.word),lib:SM_LIB.length,icons:S.tg.every(t=>!t.icon||NBH_PICTOS[t.icon])};});
  ok('the library places targets, never the same one twice, six at most',lib.n1===3&&lib.n2===0&&lib.len===6&&lib.lib>=20&&lib.icons,lib);
  const qs=await page.evaluate(async()=>{S.tg=[{word:'My own target',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''}];S.per=[{t:'',label:'',icon:'',img:''}];await smQuick('cico');
    return {sys:S.sys,look:smLook(),rate:smRateKey(),tg:S.tg.map(t=>t.word).filter(Boolean),per:S.per.length,view:document.body.className.includes('view-sheet')};});
  ok('a quick start sets the sheet and the design, keeps the targets entered and fills the empty day',qs.sys==='cico'&&qs.look==='clean'&&qs.rate==='p012'&&qs.tg.length===1&&qs.tg[0]==='My own target'&&qs.per===7&&qs.view,qs);
  const sch=await page.evaluate(async()=>{await smUseSched(SM_SCHED.elem.rows,'elementary day');const a=S.per.length;document.querySelector('#viewSeg [data-view="system"]').click();
    document.getElementById('smEvN').value='10';document.getElementById('smEvC').value='6';document.getElementById('smEvT').value='13:00';document.getElementById('smEvGo').click();await new Promise(r=>setTimeout(r,300));
    return {a,b:S.per.length,t:S.per.map(p=>p.t).join(' ')};});
  ok('a schedule template, and rows every N minutes',sch.a===9&&sch.b===6&&sch.t==='13:00 13:10 13:20 13:30 13:40 13:50',sch);
  const st=await page.evaluate(async()=>{S.store=[];S.meta.menu='Drawing time · Line leader · iPad time · Recess with a friend';smRenderStore();document.getElementById('smStMenu').click();await new Promise(r=>setTimeout(r,200));
    S.d.look='bright';S.sys='match';renderAll();return {n:S.store.length,icons:S.store.map(o=>o.icon),prices:S.store.map(o=>o.p),tiles:document.querySelectorAll('#sheetOut .v2-store .tile').length};});
  ok('the store fills from the reward menu, with pictures and rising prices, and prints as tiles',st.n===4&&st.icons.filter(Boolean).length>=3&&st.tiles===4&&+st.prices[3]>+st.prices[0],st);
  const bc=await page.evaluate(()=>{['bc_task','bc_how','bc_rw','bc_record'].forEach(k=>{S.meta[k]='';});S.meta.bc_when='Kept';document.getElementById('smBcFill').click();return {task:S.meta.bc_task,how:S.meta.bc_how,rw:S.meta.bc_rw,when:S.meta.bc_when};});
  ok('Fill the empty lines from the sheet fills only empty lines',/goal/.test(bc.task)&&/of \d+ points/.test(bc.how)&&!!bc.rw&&bc.when==='Kept',bc);
  const prev=await page.evaluate(async()=>{document.querySelector('#viewSeg [data-view="targets"]').click();document.getElementById('smPrevBtn').click();await new Promise(r=>setTimeout(r,200));
    const a=document.querySelectorAll('#smPrevI .v2').length;S.d.look='clean';renderSheet();await new Promise(r=>setTimeout(r,100));const b=document.querySelectorAll('#smPrevI .v2.look-clean').length;document.getElementById('smPrevBtn').click();return {a,b,hidden:document.getElementById('smPrev').hidden};});
  ok('the live preview shows the sheet and follows a change',prev.a===1&&prev.b===1&&prev.hidden,prev);
  const pr=await page.evaluate(()=>{S.tg[0].ex='Opens the book when asked';S.tg[0].nex='Puts head down';document.querySelector('#viewSeg [data-view="sheet"]').click();S.d.look='bright';renderAll();const fit=document.querySelector('.sm2-fit');const pages={menu:smMenuPage(),guide:smGuidePage(),prac:smPracticePage()};
    return {fit:fit&&fit.textContent,menu:(pages.menu.match(/class="it"/g)||[]).length,guide:/How to Run This Sheet/.test(pages.guide)&&/Never/.test(pages.guide),prac:(pages.prac.match(/<tr>/g)||[]).length,btns:['smPrWeek','smPrMenu','smPrGuide','smPrPrac'].every(i=>document.getElementById(i))};});
  ok('the fit notice, My Reward Menu, the staff guide and the practice page',!!pr.fit&&/page/.test(pr.fit)&&pr.menu===4&&pr.guide&&pr.prac>=2&&pr.btns,pr);
  /* 5. the walkthrough */
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1000);
  await page.evaluate(()=>document.querySelector('#viewSeg [data-view="walk"]').click());await sleep(1200);
  const w=await page.evaluate(()=>{const r=[];const set=(sys,rate,look)=>{S.sys=sys;S.d.rate=rate;S.d.look=look;renderAll();TKWALK.build();return TKWALK.cues.map(c=>c.id);};
    r.push(['match','thumbs','bright',set('match','thumbs','bright')]);r.push(['match','faces3','theme',set('match','faces3','theme')]);r.push(['cico','auto','clean',set('cico','auto','clean')]);
    r.push(['interval','faces2','bright',set('interval','faces2','bright')]);r.push(['rubric','auto','clean',set('rubric','auto','clean')]);r.push(['contract','auto','classic',set('contract','auto','classic')]);
    r.push(['smiley','stars3','theme',set('smiley','stars3','theme')]);r.push(['match','pm','discreet',set('match','pm','discreet')]);return r.map(x=>({k:x.slice(0,3).join('/'),ids:x[3]}));});
  const has=(k,id)=>(w.find(x=>x.k===k)||{ids:[]}).ids.includes(id);
  ok('the walkthrough plays the lines each sheet needs',has('match/thumbs/bright','rate_thumbs')&&has('match/thumbs/bright','match_points')&&has('match/faces3/theme','match_bonus')&&has('cico/auto/clean','teacher_rates')&&!has('cico/auto/clean','honest')&&
    has('interval/faces2/bright','rows_iv')&&has('interval/faces2/bright','rate_iv')&&has('rubric/auto/clean','rate_rubric')&&has('contract/auto/classic','rate_check1')&&has('smiley/stars3/theme','rate_stars3')&&has('match/pm/discreet','rate_pm')&&w.every(x=>x.ids[0]==='intro'&&x.ids[x.ids.length-1]==='outro'),w);
  await page.evaluate(()=>{document.getElementById('simBtn').click();});await sleep(1000);
  await page.evaluate(()=>{document.querySelector('#viewSeg [data-view="walk"]').click();});await sleep(800);
  const wk=await page.evaluate(()=>{TKWALK.build();return {d:TKWALK.duration,ch:TKWALK.chapters.map(c=>c.id),audio:typeof WALK_AUDIO!=='undefined'&&Object.keys(WALK_AUDIO.lines).length,video:typeof TKVIDEO,info:window.NBH_WALK_INFO&&NBH_WALK_INFO.what};});
  ok('the simulated sheet: about 1½ to 2 minutes, seven chapters, its narration, Save as video',wk.d>80&&wk.d<160&&wk.ch.length===7&&wk.audio>=30&&wk.video==='object'&&wk.info==='sheet',wk);
  /* the frames Save as video paints are the stage as the page shows it (the simulation's notice gone first: it sits over the page) */
  await page.evaluate(()=>[...document.body.querySelectorAll('*')].forEach(e=>{if(!e.closest('#wkPlayer')&&getComputedStyle(e).position==='fixed')e.style.display='none';}));
  for(const t of [5,26,45,70,95]){const png=await page.evaluate(async t=>(await TKVIDEO.frame(t,1280)).toDataURL('image/png'),t);
    await page.evaluate(t=>TKWALK.renderAt(t),t);await sleep(150);await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='hidden';});
    const shot=await page.locator('#wkStage').screenshot();await page.evaluate(()=>{const b=document.getElementById('wkBig');if(b)b.style.visibility='';});
    const d=await page.evaluate(async([a,b])=>{const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});const A=await load(a),B=await load(b);
      const w=128,h=72,px=img=>{const m=document.createElement('canvas');m.width=640;m.height=360;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,0,0,640,360);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,w,h);return g.getImageData(0,0,w,h).data;};
      const p=px(A),q=px(B);let sum=0;const cell=new Array(64).fill(0),cn=new Array(64).fill(0);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const dd=(Math.abs(p[i]-q[i])+Math.abs(p[i+1]-q[i+1])+Math.abs(p[i+2]-q[i+2]))/3;sum+=dd;const c=Math.floor(y/(h/8))*8+Math.floor(x/(w/8));cell[c]+=dd;cn[c]++;}
      return{mean:+(sum/(w*h)).toFixed(2),worst:+Math.max(...cell.map((v,i)=>v/cn[i])).toFixed(2)};},[png,'data:image/png;base64,'+shot.toString('base64')]);
    if(!(d.mean<7&&d.worst<22)&&process.env.SM1_DUMP){require('fs').writeFileSync(process.env.SM1_DUMP+'/f'+t+'.png',Buffer.from(png.split(',')[1],'base64'));require('fs').writeFileSync(process.env.SM1_DUMP+'/s'+t+'.png',shot);}
    ok('t='+t+' s: the painted frame is the stage as shown',d.mean<7&&d.worst<22,d);}
  ok('no script errors',!errs.length,errs.slice(0,4));
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
