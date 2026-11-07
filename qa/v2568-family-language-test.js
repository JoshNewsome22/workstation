/* v25.68 research #12 and #13 (the BCBA, 11/6): what goes home, in plain language and in Haitian Creole. Simulated data only.
   #12 Check wording's reading check for the family pages: a grade by a standard formula (Flesch-Kincaid for English, the
   Fernandez Huerta reading ease for Spanish, none for Haitian Creole), sentences over 25 words, the words of the trade with
   plain words; it suggests and changes nothing; a page joins it with one attribute (data-nbh-family), as IC-1's family copy
   can; the respondent dialogs (IA-1, SV-1, CF-1) check what the respondent reads; a field on a family page shows it in Check
   wording. #13 Haitian Creole beside English and Spanish: DM-1's family language, IA-1, SV-1 and CF-1's respondent pages and
   their emails, SR-1's family version, HD-1's sheets, SM-1's home note; every Creole text says "Draft translation: a district
   translator reviews it before it goes home" on screen and on paper; English and Spanish families see what they saw before.
   usage: WS_URL=http://127.0.0.1:8648 WS_ROOT=<worktree> node qa/v2568-family-language-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0,n=0;const ok=(name,c,info)=>{n++;console.log((c?'PASS ':'FAIL ')+name+(info!==undefined&&!c?'  '+JSON.stringify(info).slice(0,1200):''));if(!c)fails++;};
const DRAFT='Draft translation: a district translator reviews it before it goes home.';
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async()=>{const br=await L.chromium.launch();const errs=[];
 try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',file=pre=>fs.readdirSync(dir).find(f=>f.startsWith(pre));
  const ctx=await br.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const open=async(f,c)=>{const p=await (c||ctx).newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto(L.BASE+'/NBH-Workstation/'+f);await sleep(900);
    await p.evaluate(()=>{window.confirm=()=>true;window.alert=()=>{};if(window.nbhUI){nbhUI.confirm=async()=>true;nbhUI.toast=()=>{};}});return p;};
  const rdState=p=>p.evaluate(()=>{const r=document.getElementById('nbh-wording-ui').shadowRoot,d=r.querySelector('dialog.rdg');
    return d?{open:d.open,text:d.innerText,secs:[...d.querySelectorAll('section.rl')].map(s=>({lang:s.lang,text:s.innerText})),replace:[...d.querySelectorAll('button')].map(b=>b.textContent).filter(t=>/replace|change all|take out|use this/i.test(t)),
      focus:r.activeElement&&r.activeElement.id}:null;});

  /* ---------------- #12 the reading check ---------------- */
  const hd=await open(file('HD-1_'));
  const R=await hd.evaluate(()=>{const W=window.nbhWording;
    const en='At school, Sam earns a reward for stretches of time without hitting. Right now a stretch is five minutes, and it grows as Sam succeeds. The plan uses extinction, and the reward is contingent on calm hands, on a schedule of reinforcement that the team will thin slowly over the next several weeks as long as the data show that hitting stays low at school and at home and the teacher agrees.';
    const es='En la escuela, Sam gana unos minutos para dibujar por ratos sin pegar. Ahora cada rato es de cinco minutos, y se alarga a medida que Sam lo logra. En casa pueden hacer lo mismo: fíjense en los ratos sin pegar y felicítenle. Usamos la extinción y un programa de reforzamiento.';
    const ht='Lekòl, Sam genyen kèk minit pou desine pou chak moman li pase san frape. Kounye a, yon moman dire senk minit, epi l ap vin pi long pandan Sam ap reyisi chak jou nan semèn nan lè li rete kalm nan klas la ak lakay li tou avèk fanmi li.';
    return {en:W.readability(en,'en'),es:W.readability(es,'Spanish'),ht:W.readability(ht,'Haitian Creole'),lang:[W.langOf('Haitian Creole'),W.langOf('Kreyòl ayisyen'),W.langOf('Spanish'),W.langOf('English')]};});
  ok('12.1 English: the Flesch-Kincaid grade level, a grade read against the aim of grades 6 to 8',R.en.formula==='Flesch–Kincaid grade level'&&typeof R.en.grade==='number'&&R.en.grade>0&&/^(within|above|easier)$/.test(R.en.status)&&R.en.aim==='grades 6 to 8',R.en);
  ok('12.2 a sentence over 25 words is flagged with its count',R.en.long.length===1&&R.en.long[0].words>25,R.en.long);
  const jt=R.en.jargon.map(j=>j.text.toLowerCase());
  ok('12.3 the words of the trade ("extinction", "contingent", "schedule of reinforcement") each with plain words',jt.includes('extinction')&&jt.some(t=>/^contingent/.test(t))&&jt.includes('schedule of reinforcement')&&R.en.jargon.every(j=>j.plain&&j.plain.length>3),R.en.jargon);
  ok('12.4 Spanish: the Fernandez Huerta reading ease with Flesch\'s school level, and Spanish jargon ("extinción", "programa de reforzamiento")',R.es.formula==='Fernández Huerta reading ease'&&typeof R.es.score==='number'&&/grade/.test(R.es.band)&&R.es.jargon.some(j=>/extinci/i.test(j.text))&&R.es.jargon.some(j=>/programa de reforzamiento/i.test(j.text)),R.es);
  ok('12.5 Haitian Creole: no formula (none is standard), the long sentence still listed',R.ht.formula==='none'&&R.ht.grade===null&&R.ht.long.length===1,R.ht);
  ok('12.6 the language from its name: Haitian Creole, Kreyòl ayisyen, Spanish, English',JSON.stringify(R.lang)==='["ht","ht","es","en"]',R.lang);
  /* HD-1's sheets: each one a family page, with its button */
  await hd.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  await hd.evaluate(()=>{S.meta.lang='English';S.chk.tally=true;S.chk.check=true;S.chk.sleep=true;renderSheets();if(typeof setView==='function')try{setView('sheets');}catch(e){}});await sleep(700);
  const showSheets=async p=>{await p.evaluate(()=>{const b=document.querySelector('button[data-view="sheets"]');if(b)b.click();window.scrollTo(0,0);});await sleep(700);};
  await showSheets(hd);
  const fam=await hd.evaluate(()=>{const hs=[...document.querySelectorAll('#sheetOut > .hs')];const f=window.nbhWording.family();const r=document.getElementById('nbh-wording-ui').shadowRoot;const chips=[...r.querySelectorAll('.fw')].map(b=>{const q=b.getBoundingClientRect();return {w:q.width,h:q.height,label:b.getAttribute('aria-label')};});
    return {sheets:hs.length,marked:hs.filter(x=>x.hasAttribute('data-nbh-family')).length,shown:hs.filter(x=>x.getClientRects().length).length,family:f.length,chips,draft:document.querySelectorAll('#sheetOut .hs-draft').length,ht:document.querySelectorAll('#sheetOut [lang="ht"]').length};});
  ok('12.7 every home sheet is a family page (data-nbh-family), and each one on the screen has a Reading level button of 44 px or more, named for VoiceOver',fam.sheets>=3&&fam.marked===fam.sheets&&fam.shown===fam.sheets&&fam.chips.length>=1&&fam.chips.every(c=>c.w>=44&&c.h>=44&&/^Check the reading level: /.test(c.label)),fam);
  ok('12.8 an English family\'s sheets carry no Creole and no draft mark (as before)',fam.draft===0&&fam.ht===0,fam);
  /* the dialog, from a page: grade, long sentences, jargon; nothing replaced; the page unchanged */
  const before=await hd.evaluate(()=>document.getElementById('sheetOut').innerHTML.length);
  const rr=await hd.evaluate(()=>{const el=document.querySelector('#sheetOut > .hs');const res=window.nbhWording.reading(el);return res;});await sleep(300);
  const st=await rdState(hd);
  ok('12.9 the Reading level dialog opens for a sheet: its grade by formula, the long sentences, the words to explain, the formulas named',!!st&&st.open&&st.secs.length>=1&&/Flesch–Kincaid/.test(st.text)&&/Sentences over 25 words|No sentence is over 25 words/.test(st.text)&&/Words a family may not know|No words of the trade/.test(st.text)&&Array.isArray(rr),st&&st.text.slice(0,600));
  ok('12.10 it only suggests: no Replace, Change or Use button, and its focus is on its heading',!!st&&st.replace.length===0&&st.focus==='rdT',st&&{replace:st.replace,focus:st.focus});
  await hd.keyboard.press('Escape');await sleep(250);
  const after=await hd.evaluate(()=>({len:document.getElementById('sheetOut').innerHTML.length,open:document.getElementById('nbh-wording-ui').shadowRoot.querySelector('dialog.rdg').open}));
  ok('12.11 Escape closes it, and the page is as it was',!after.open&&after.len===before,{before,after});
  /* one attribute joins a page (IC-1's family copy): the button appears for it */
  const join=await hd.evaluate(async()=>{const d=document.createElement('div');d.id='icJoin';d.setAttribute('data-nbh-family','');d.style.cssText='width:600px;min-height:120px;margin:20px';d.innerHTML='<h2>Your copy (simulated)</h2><p>We will watch Sample Student in class and talk with you about what we see. The plan uses differential reinforcement.</p>';
    document.querySelector('main').prepend(d);window.scrollTo(0,0);await new Promise(r=>setTimeout(r,400));window.dispatchEvent(new Event('resize'));await new Promise(r=>setTimeout(r,600));
    const f=window.nbhWording.family().find(x=>x.el===d);const res=window.nbhWording.readPage(d);d.remove();return {chip:!!f,title:f&&f.title,res:res.map(x=>({lang:x.lang,j:x.jargon.map(j=>j.text)}))};});
  ok('12.12 any element marked data-nbh-family joins the check with that one attribute (as IC-1\'s family copy can): a button, its title, the jargon found',join.chip&&/Your copy/.test(join.title)&&join.res.length===1&&join.res[0].j.some(t=>/differential reinforcement/i.test(t)),join);
  await hd.emulateMedia({media:'print'});const pr=await hd.evaluate(()=>getComputedStyle(document.getElementById('nbh-wording-ui')).display);await hd.emulateMedia({media:'screen'});
  ok('12.13 nothing of the check prints',pr==='none',pr);
  /* a field on a family page: Check wording shows the reading for the family (SR-1's own words for home) */
  const sr=await open(file('SR-1_'));
  await sr.evaluate(()=>document.getElementById('simBtn').click());await sleep(400);
  await sr.evaluate(()=>{Object.assign(S.meta,{ds_sel:'dro',client:'Sample Student',beh:'Hitting (simulated)',behs:'',sr:'a few minutes of drawing (simulated)',srs:''});renderAll();
    const b=[...document.querySelectorAll('button,[role=tab]')].find(x=>/^\s*Card\s*$/i.test(x.textContent));if(b)b.click();});await sleep(400);
  const pan=await sr.evaluate(async()=>{const ta=document.querySelector('textarea[data-m="home_en"]');ta.value='We use extinction for hitting, and the reward is contingent on calm hands at home.';ta.dispatchEvent(new Event('input',{bubbles:true}));
    ta.scrollIntoView();ta.focus();await new Promise(r=>setTimeout(r,300));const okOpen=window.nbhWording.open(ta);await new Promise(r=>setTimeout(r,400));
    const r=document.getElementById('nbh-wording-ui').shadowRoot,fam=r.getElementById('ckFam');const out={open:okOpen,text:fam?fam.innerText:'',btns:fam?[...fam.querySelectorAll('button')].map(b=>b.textContent):[]};window.nbhWording.close();
    ta.value='';ta.dispatchEvent(new Event('input',{bubbles:true}));return out;});
  ok('12.14 a field for the family (SR-1\'s own words for home): Check wording shows its reading level and the words to explain, with Find in text only',pan.open&&/Reading level for the family \(English\)/.test(pan.text)&&/extinction/i.test(pan.text)&&pan.btns.length>0&&pan.btns.every(t=>t==='Find in text'),pan);

  /* ---------------- #13 Haitian Creole ---------------- */
  const dm=await open(file('DM-1_'));
  const d1=await dm.evaluate(async()=>{const dl=[...document.querySelectorAll('#dmLangs option')].map(o=>o.value);const f=document.querySelector('[name="s.lang"]');f.value='Haitian Creole';f.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(r=>setTimeout(r,50));const nt=document.getElementById('dmHtNote');const out={dl,list:f.getAttribute('list'),note:nt.hidden?'':nt.textContent,contact:(document.querySelector('[name="c[0].lang"]')||{}).getAttribute&&document.querySelector('[name="c[0].lang"]').getAttribute('list')};
    const fo=window.__nbhFactsOut&&window.__nbhFactsOut();out.home=fo&&fo.profile&&fo.profile.language&&fo.profile.language.home;f.value='';f.dispatchEvent(new Event('input',{bubbles:true}));return out;});
  ok('13.1 DM-1: Home language offers Haitian Creole beside English and Spanish (the contacts\' language too), and goes to the case as typed',d1.dl.slice(0,3).join()==='English,Spanish,Haitian Creole'&&d1.list==='dmLangs'&&d1.contact==='dmLangs'&&d1.home==='Haitian Creole',d1);
  ok('13.2 DM-1: for Haitian Creole, the line under it names what has a Creole version and says it is a draft translation',/Home note/.test(d1.note)&&/HD-1/.test(d1.note)&&/SR-1/.test(d1.note)&&/IA-1, SV-1, CF-1/.test(d1.note)&&d1.note.indexOf(DRAFT)>=0,d1.note);
  /* the respondent pages */
  const ia=await open(file('IA-1_'));
  await ia.evaluate(()=>document.getElementById('simBtn').click());await sleep(700);
  const i1=await ia.evaluate(()=>{const s=document.getElementById('rpLang');const opts=[...s.options].map(o=>o.value);s.value='ht';s.dispatchEvent(new Event('change',{bubbles:true}));
    const ts=__rp.terms(),t=ts[0]||{label:'Hitting (simulated)',sing:'hitting',plur:'hitting',def:''};document.getElementById('rpInst').value='qabf';const p=__rp.payloadFor(t);
    const html=NBH_RESPOND.pageHTML(p);const nt=document.getElementById('rpLangNoteHt'),note=nt&&!nt.hidden?nt.textContent:'';s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));
    return {opts,lang:p.lang,extras:p.extras.map(x=>x.label),anchors:p.scale.anchors,sub:p.sub,html:html.slice(0,200),note,hasRead:!!document.getElementById('rpReadLvl')};});
  ok('13.3 IA-1: the page\'s language offers Kreyòl ayisyen; the page made in it carries lang "ht", the About you questions and the scale in Creole',i1.opts.join()===',es,ht'&&i1.lang==='ht'&&i1.extras[0]==='Non ou'&&/pa janm/.test(i1.anchors[0])&&/Kesyon sou poukisa/.test(i1.sub)&&/<html lang="ht">/.test(i1.html),i1);
  ok('13.4 IA-1: the dialog says the Creole is a draft translation, and has a Check reading level button',i1.note.indexOf(DRAFT)>=0&&i1.hasRead,i1);
  /* the page itself, as the parent sees it */
  const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push('respondent page: '+e.message));
  const htmlPage=await ia.evaluate(()=>{const s=document.getElementById('rpLang');s.value='ht';const ts=__rp.terms(),t=ts[0]||{label:'Hitting (simulated)',sing:'hitting',plur:'hitting',def:'Hitting (simulated)'};document.getElementById('rpInst').value='qabf';const p=__rp.payloadFor(t);p.due='2026-11-16';s.value='';return NBH_RESPOND.pageHTML(p);});
  await pg.setContent(htmlPage);await sleep(500);
  const rp=await pg.evaluate(()=>({lang:document.documentElement.lang,draft:(document.getElementById('nbhr-draft')||{}).innerText||'',text:document.body.innerText,send:[...document.querySelectorAll('button')].map(b=>b.textContent)}));
  ok('13.5 the respondent page in Creole: lang "ht", the draft mark first (English and Creole), its own words in Creole, the date in Creole',rp.lang==='ht'&&rp.draft.indexOf(DRAFT)>=0&&/Tradiksyon sa a se yon bouyon/.test(rp.draft)&&/Kesyon yo|Sou ou/.test(rp.text)&&rp.send.some(t=>/Voye/.test(t))&&/lendi 16 novanm/.test(rp.text),{lang:rp.lang,draft:rp.draft,send:rp.send,text:rp.text.slice(0,500)});
  await pg.emulateMedia({media:'print'});const dp=await pg.evaluate(()=>{const d=document.getElementById('nbhr-draft');return d?getComputedStyle(d).display:'missing';});await pg.emulateMedia({media:'screen'});
  ok('13.6 the respondent page\'s draft mark prints',dp!=='none'&&dp!=='missing',dp);
  await pg.close();
  const mail=await ia.evaluate(()=>NBH_RESPOND.personMail({to:'parentA@example.org',name:'Sample Parent A',items:[{title:'QABF',label:'QABF',url:'https://example.org/respond.html#x',due:'11/16/2026'}],student:'S.S.',bcba:'Jordan Ellis, BCBA',lang:'ht'}));
  ok('13.7 the email for a Creole page is in Creole, its first line the draft mark',mail.text.split('\n')[0]==='['+DRAFT+']'&&/Bonjou Sample Parent A/.test(mail.text)&&/pa pita pase 11\/16\/2026/.test(mail.text)&&/Louvri kesyonè a/.test(mail.html),mail.text.slice(0,400));
  const pz=await ia.evaluate(()=>NBH_RESPOND.personalize('Kisa ki konn rive jis anvan konpòtman an? Èske elèv la konn chèche atansyon?',{lang:'ht',name:'S.S.',beh:'frape'}));
  ok('13.8 a Creole item takes the student\'s label and the behavior\'s term',pz==='Kisa ki konn rive jis anvan frape? Èske S.S. konn chèche atansyon?',pz);
  /* the reading check from the respondent dialog, in the page's language */
  const rdi=await ia.evaluate(async()=>{const s=document.getElementById('rpLang');s.value='ht';document.getElementById('rpDlg').showModal();document.getElementById('rpReadLvl').click();await new Promise(r=>setTimeout(r,300));
    const r=document.getElementById('nbh-wording-ui').shadowRoot,d=r.querySelector('dialog.rdg');const o={open:d&&d.open,langs:d?[...d.querySelectorAll('section.rl')].map(x=>x.lang):[],text:d?d.innerText:''};window.nbhWording.closeReading();document.getElementById('rpDlg').close();s.value='';return o;});
  ok('13.9 IA-1\'s Check reading level reads the Creole page as Creole (no formula, said so)',rdi.open&&rdi.langs.join()==='ht'&&/No standard reading-level formula exists for Haitian Creole/.test(rdi.text),rdi);
  const sv=await open(file('SV-1_'));
  await sv.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const s1=await sv.evaluate(()=>{const s=document.getElementById('rpLang');const opts=[...s.options].map(o=>o.value);s.value='ht';s.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('rpRole').value='caregiver';document.getElementById('rpRound').value='post';
    const p=rpPayload();const nt=document.getElementById('rpLangNoteHt');const o={opts,lang:p.lang,title:p.title,items:p.items.map(x=>x.text),n:p.items.length,anchors:p.scale.anchors,note:nt.hidden?'':nt.textContent,inst:p.inst};
    s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));const e=rpPayload();o.en=e.items.length;o.enInst=e.inst;return o;});
  ok('13.10 SV-1: the caregiver\'s post round in Creole: every statement in Creole, the scale too, the same items and inst as the English page (the answers go back the same)',s1.opts.join()===',es,ht'&&s1.lang==='ht'&&s1.n===s1.en&&s1.inst===s1.enInst&&s1.items.every(t=>!/^The |^I /.test(t))&&/^Konpòtman plan sa a/.test(s1.items[0])&&/dakò/.test(s1.anchors[5])&&s1.note.indexOf(DRAFT)>=0,s1);
  const cf=await open(file('CF-1_'));
  await cf.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const c1=await cf.evaluate(()=>{const s=document.getElementById('rpLang');s.value='ht';s.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('rpRound').value='1';
    const p=rpPayload();const o={lang:p.lang,n:p.items.length,first:p.items[0].text,last:p.items[20].text,inst:p.inst,extras:p.extras.map(x=>x.id).join(),note:document.getElementById('rpLangNoteHt').hidden?'':document.getElementById('rpLangNoteHt').textContent};
    s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));const e=rpPayload();o.en=e.items.length;o.enLang=e.lang||'';o.enExtras=e.extras.map(x=>x.id).join();return o;});
  ok('13.11 CF-1: a Creole page for an adult who runs the plan: 21 statements in Creole (the last waits before the plan starts), the same answers back; English as before',c1.lang==='ht'&&c1.n===21&&c1.en===21&&/^Mwen ka dekri/.test(c1.first)&&/^Kite sa a vid/.test(c1.last)&&c1.extras===c1.enExtras&&c1.enLang===''&&c1.note.indexOf(DRAFT)>=0,c1);
  /* SR-1: the family's version in Creole */
  const s2=await sr.evaluate(()=>{const put=x=>{Object.assign(S.meta,x);renderAll();const r=window.__nbhFactsOut();const b=document.getElementById('srHomeOut');return {home:r&&r.schedule&&r.schedule.home,box:b.innerText,htBox:!!b.querySelector('[lang="ht"]'),fields:[...document.querySelectorAll('#srHomeHt > div')].filter(d=>!d.hidden&&!document.getElementById('srHomeHt').hidden).map(d=>d.dataset.ht).sort().join()};};
    const a=put({ds_sel:'dro',client:'Mateo Rivera',beh:'Hitting (simulated)',sr:'a few minutes of drawing (simulated)',home_en:'',home_es:'',ht_beh:'',ht_sr:'',home_ht:'',ht_on:''});
    window.__nbhFactsIn({profile:{language:{home:'Haitian Creole'}}});
    const b=put({});const c=put({ht_beh:'frape',ht_sr:'kèk minit pou desine'});const d=put({ht_beh:'',ht_sr:''});window.__nbhFactsIn({profile:{language:{home:'English'}}});const e=put({});return {a,b,c,e};});
  ok('13.12 SR-1: an English-speaking case shows no Creole box; the facts carry ht empty until the words are written',!s2.a.htBox&&s2.a.home.ht===''&&s2.a.home.needHt.length===2,s2.a);
  ok('13.13 SR-1: the family\'s language is Haitian Creole (Form DM-1): the Creole box shows with the draft mark, and asks only for the words it uses',s2.b.htBox&&s2.b.box.indexOf(DRAFT)>=0&&s2.b.fields==='beh,sr',s2.b);
  ok('13.14 SR-1: with the words in Creole, the Creole paragraph goes to the case (schedule.home.ht)',/^Lekòl, Mateo genyen kèk minit pou desine pou chak moman li pase san frape\. /.test(s2.c.home.ht)&&s2.c.home.needHt.length===0&&/^At school, Mateo earns/.test(s2.c.home.en),s2.c.home);
  /* HD-1: a Creole family's sheets */
  const h2=await hd.evaluate(()=>{S.meta.lang='Haitian Creole';S.chk.tally=true;S.chk.check=true;S.chk.sleep=true;S.chk.sched=true;window.__nbhFactsIn({schedule:{home:{en:'At school, Mateo earns drawing time (simulated).',es:'',need:[],ht:'Lekòl, Mateo genyen tan pou desine (similasyon).',needHt:[]}}});
    S.meta.lang='Haitian Creole';renderSheets();const hs=[...document.querySelectorAll('#sheetOut > .hs')];
    return hs.map(x=>({id:x.dataset.sheet,draft:(x.querySelector('.hs-draft')||{}).textContent||'',title:(x.querySelector('.hs-title')||{}).textContent||'',htBox:!!x.querySelector('.hs-box[lang="ht"]'),enBox:!!x.querySelector('.hs-box:not([lang]), .hs-box[lang="en"]'),
      safe:[...x.querySelectorAll('.hs-safe')].map(p=>p.getAttribute('lang')||'en'),first:(x.querySelector('.hs-box')||{}).getAttribute?x.querySelector('.hs-box').getAttribute('lang'):'',fam:x.hasAttribute('data-nbh-family')}));});
  const tally=h2.find(x=>x.id==='tally')||{},sched=h2.find(x=>x.id==='sched')||{};
  ok('13.15 HD-1: a Creole family: every sheet says it is a draft translation, and is still a family page',h2.length>=4&&h2.every(x=>x.draft.indexOf(DRAFT)>=0&&x.fam),h2.map(x=>[x.id,x.draft.slice(0,40)]));
  ok('13.16 HD-1: the Creole first and the English beside it: the title, the How to fill this in box, the safety line',/^Fèy pou konte lakay · Home Tally Sheet$/.test(tally.title)&&tally.htBox&&tally.enBox&&tally.first==='ht'&&tally.safe.join()==='ht,en',tally);
  ok('13.17 HD-1: the school\'s plan at home in Creole first when SR-1 has it',/^Plan lekòl la, lakay · The School’s Plan, at Home$/.test(sched.title)&&sched.first==='ht',sched);
  await hd.emulateMedia({media:'print'});const hp=await hd.evaluate(()=>[...document.querySelectorAll('#sheetOut .hs-draft')].map(d=>getComputedStyle(d).display));await hd.emulateMedia({media:'screen'});
  ok('13.18 HD-1: the draft mark prints on every Creole sheet',hp.length>=4&&hp.every(d=>d!=='none'),hp);
  const h3=await hd.evaluate(()=>{S.meta.lang='Spanish';renderSheets();return {draft:document.querySelectorAll('#sheetOut .hs-draft').length,ht:document.querySelectorAll('#sheetOut [lang="ht"]').length};});
  ok('13.19 HD-1: a Spanish family\'s sheets carry no Creole',h3.draft===0&&h3.ht===0,h3);
  /* SM-1's home note */
  const sm=await open(file('SM-1_'));
  await sm.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  const m1=await sm.evaluate(()=>{S.chk.home=true;window.__nbhFactsIn({profile:{language:{home:'English'}}});const en=tearOff();window.__nbhFactsIn({profile:{language:{home:'Haitian Creole',interpreter:true}}});const ht=tearOff();return {en,ht};});
  ok('13.20 SM-1: the home note in Creole, with the English beside each line and the draft mark',/lang="ht"/.test(m1.ht)&&m1.ht.indexOf(DRAFT)>=0&&/Nòt pou lakay/.test(m1.ht)&&/Today I earned/.test(m1.ht)&&/Siyati paran/.test(m1.ht)&&/data-nbh-family/.test(m1.ht),m1.ht.slice(0,300));
  ok('13.21 SM-1: an English family\'s home note says what it said before (one attribute added for the reading check)',/^<div class="tear" data-nbh-family="" data-nbh-family-title="Home note"><span class="cut">/.test(m1.en)&&/Today I earned/.test(m1.en)&&!/lang="ht"/.test(m1.en)&&m1.en.indexOf(DRAFT)<0,m1.en.slice(0,200));
  /* the iPad: the Reading level button with touch */
  const ip=await br.newContext({viewport:{width:1376,height:1032},hasTouch:true,isMobile:true,deviceScaleFactor:2,userAgent:IPAD,serviceWorkers:'block'});
  const hi=await open(file('HD-1_'),ip);
  await hi.evaluate(()=>document.getElementById('simBtn').click());await sleep(500);
  await hi.evaluate(()=>{S.meta.lang='Haitian Creole';S.chk.tally=true;renderSheets();});await showSheets(hi);await sleep(600);
  const box=await hi.evaluate(()=>{const r=document.getElementById('nbh-wording-ui').shadowRoot,b=r.querySelector('.fw');if(!b)return null;const el=window.nbhWording.family()[0].el;el.scrollIntoView({block:'start'});return true;});
  await sleep(700);
  const bb=await hi.evaluate(()=>{const r=document.getElementById('nbh-wording-ui').shadowRoot,b=r.querySelector('.fw');if(!b)return null;const q=b.getBoundingClientRect();return {x:q.x+q.width/2,y:q.y+q.height/2,w:q.width,h:q.height};});
  if(bb)await hi.touchscreen.tap(bb.x,bb.y);await sleep(400);
  const ti=await rdState(hi);
  ok('13.22 iPad (sideways, touch): a tap on a Creole sheet\'s Reading level button opens the check, Kreyòl and English apart',!!box&&!!bb&&bb.w>=44&&bb.h>=44&&!!ti&&ti.open&&ti.secs.map(s=>s.lang).sort().join()==='en,ht',{bb,secs:ti&&ti.secs.map(s=>s.lang)});
  await ip.close();
  ok('13.23 no page errors',errs.length===0,errs);
 }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
 await br.close();console.log((fails?'RESULT: '+fails+' failure(s)':'RESULT: all passed')+' ('+n+' checks)');process.exit(fails?1:0);})();
