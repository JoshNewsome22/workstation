const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const str=v=>v==null||typeof v==='object'?'':String(v);
const T=v=>str(v).trim();

/* ---------------- state ---------------- */
/* Every list has a fixed set of fields per row; a row is blank until something is typed. The pulled map keeps the words
   the case placed, keyed by the field's path, so a mark can say which fields still hold them (v21.16 audit F12 on EB-1). */
/* v22.48 (review F392, F395, I199) a tier row has a kind (the earliest sign, a tier, the handover to the crisis plan, the recovery)
   and can be marked for trained staff only; a skill is one the student has or one being taught; a rule can be marked for trained
   staff only; and each adult's part is a list of its own (who, their part, trained on this plan). */
const ROW={stats:['n','label'],five:['head','text'],day:['head','text'],talk:['sit','say','not'],skills:['name','pct','text','kind'],
  read:['name','signs','do'],tiers:['name','see','do','say','kind','train'],rules:['do','dont','train'],rec:['measure','counts','how'],
  phases:['head','when','text','next'],calls:['role','name','when'],parts:['who','part','trained']};
const START={stats:3,five:5,day:6,talk:5,skills:3,read:2,tiers:5,rules:6,rec:6,phases:4,calls:5,parts:3};
const MAXR={stats:4,five:7,day:9,talk:10,skills:6,read:2,tiers:7,rules:12,rec:14,phases:6,calls:6,parts:8};
/* the fields of a row that are choices, not words: never marked as the plan's words, never counted as the row being written */
const CHOICE={kind:1,train:1,trained:1};
const row=k=>{const o={};ROW[k].forEach(f=>{o[f]='';});return o;};
/* v22.48 new fields: the issue (I198: its number, what changed, who holds a copy), the line for when the student says stop (I197),
   the flow sheet's request, what honoring it gives and what follows (F392), the crisis call (F391), whether the consequence box is
   in the consented plan (F396), the reading check (I200), and S.ok: the plan's words the BCBA has reviewed and kept (F390). */
function blank(){const S={meta:{client:'',sid:'',grade:'',school:'',bcba:'',program:'',first:'',pron:'he',start:'',plan:'',issued:'',issueNo:''},
  who:'',goal:'',statnote:'',when:'',may:'',gets:'',health:'',title2:'',spotHead:'',spotText:'',chips:'',newline:'',title3:'',readnote:'',mustknow:'',stop:'',
  consLead:'',consRules:'',consSay:'',consOk:'',title4:'',recnote:'',onevoice:'',flowOn:'yes',flowCalm:'',flowCall:'',askName:'',flowHonor:'',flowThen:'',callCrisis:'',
  checkOn:'no',changes:'',holders:'',pulled:{},changed:{},ok:{}};
  Object.keys(ROW).forEach(k=>{S[k]=[];for(let i=0;i<START[k];i++)S[k].push(row(k));});return S;}
let S=blank();
function ensure(){const b=blank();if(!S||typeof S!=='object')S=b;if(!S.meta||typeof S.meta!=='object')S.meta={};
  Object.keys(b.meta).forEach(k=>{if(typeof S.meta[k]!=='string')S.meta[k]=b.meta[k];});if(!/^(he|she|they)$/.test(S.meta.pron))S.meta.pron='he';
  Object.keys(b).forEach(k=>{if(k==='meta'||k==='pulled'||k==='changed'||k==='ok'||ROW[k])return;if(typeof S[k]!=='string')S[k]=b[k];});
  if(!S.pulled||typeof S.pulled!=='object')S.pulled={};
  if(!S.ok||typeof S.ok!=='object'||Array.isArray(S.ok))S.ok={};
  if(!S.changed||typeof S.changed!=='object'||Array.isArray(S.changed))S.changed={};
  Object.keys(ROW).forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];S[k]=S[k].slice(0,MAXR[k]).map(r=>{const o=row(k);if(r&&typeof r==='object')ROW[k].forEach(f=>{o[f]=str(r[f]);});return o;});
    while(S[k].length<Math.min(START[k],MAXR[k]))S[k].push(row(k));});
  if(S.flowOn!=='no')S.flowOn='yes';if(S.checkOn!=='yes')S.checkOn='no';}
const getP=p=>p.split('.').reduce((o,k)=>o==null?undefined:o[k],S);
function setP(p,v){const ks=p.split('.');let o=S;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]];}o[ks[ks.length-1]]=v;}
const filled=k=>S[k].filter(r=>ROW[k].some(f=>!CHOICE[f]&&T(r[f])));
const lines=s=>str(s).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);

/* ---------------- pronouns and names ---------------- */
function P(){const p=S.meta.pron;return p==='she'?{sub:'she',obj:'her',pos:'her',is:'is',has:'has',does:'does'}:p==='they'?{sub:'they',obj:'them',pos:'their',is:'are',has:'have',does:'do'}:{sub:'he',obj:'him',pos:'his',is:'is',has:'has',does:'does'};}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function firstName(){const f=T(S.meta.first);if(f)return f;const c=T(S.meta.client);if(!c)return 'the student';
  const m=/^([^,]+),\s*(.+)$/.exec(c);const given=m?m[2]:c;return given.split(/\s+/)[0]||'the student';}
function fmtDate(d){if(!d)return '';const p=String(d).split('-');if(p.length!==3)return d;const dt=new Date(+p[0],+p[1]-1,+p[2]);
  return isNaN(dt)?d:dt.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});
  if(v==='out'||v==='flow'||v==='setup')buildSoon(0);}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- the editor ---------------- */
/* a field: label, the control bound to a path, and the mark when the case placed its words */
/* v21.74 a line rewritten here while the plan has since changed carries the plan's new words, to take or to keep mine */
function chgMark(p){const nv=T(S.changed[p]);if(!nv)return '';return '<span class="qs-chg" data-chg="'+esc(p)+'"><b>The plan has changed here.</b> It now says: &ldquo;'+esc(nv)+'&rdquo; <button type="button" class="tool" data-usenew="'+esc(p)+'">Use the plan&rsquo;s words</button> <button type="button" class="tool" data-keepmine="'+esc(p)+'">Keep mine</button></span>';}
function mark(p){return mark0(p)+chgMark(p);}
/* v22.48 (review F390) a field still holding the plan's words is marked until it is rewritten, or until the BCBA has read it and
   kept it as it is (Keep as is: S.ok holds the words kept; new words from the plan mark it again) */
const isPulled=p=>{const v=T(getP(p)),w=T(S.pulled[p]);return !!(v&&w&&v===w&&T(S.ok[p])!==v);};
const PULL_HTML=p=>'from the plan &mdash; rewrite <button type="button" class="qs-okb" data-okp="'+esc(p)+'" title="I have read it: keep the plan’s words as they are">Keep as is</button>';
function mark0(p){return isPulled(p)?'<span class="qs-pull" data-mark="'+esc(p)+'">'+PULL_HTML(p)+'</span>':'<span data-mark="'+esc(p)+'"></span>';}
function fld(label,p,opt){opt=opt||{};const v=getP(p),id='f_'+p.replace(/\W+/g,'_');
  let c;if(opt.select)c='<select id="'+id+'" data-k="'+p+'"'+(opt.m?' data-m="'+opt.m+'"':'')+'>'+opt.select.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===v?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  else if(opt.ta)c='<textarea id="'+id+'" data-k="'+p+'" rows="'+(opt.rows||2)+'"'+(opt.ph?' placeholder="'+esc(opt.ph)+'"':'')+'>'+esc(v)+'</textarea>';
  else c='<input id="'+id+'" data-k="'+p+'"'+(opt.type?' type="'+opt.type+'"':'')+(opt.m?' data-m="'+opt.m+'"':'')+(opt.ph?' placeholder="'+esc(opt.ph)+'"':'')+' value="'+esc(v)+'">';
  return '<div class="qsf"><label for="'+id+'">'+label+(opt.small?'<small>'+opt.small+'</small>':'')+'</label><div class="qs-fw">'+c+(opt.select?'':mark(p))+'</div></div>';}
function rows(k,cols,opt){opt=opt||{};const R=S[k];let h='<table class="qs-rows"><thead><tr><th></th>'+cols.map(c=>'<th'+(c.w?' style="width:'+c.w+'"':'')+'>'+c.h+'</th>').join('')+'<th></th></tr></thead><tbody>';
  R.forEach((r,i)=>{h+='<tr><td class="n">'+(i+1)+'</td>'+cols.map(c=>{const p=k+'.'+i+'.'+c.f;const v=r[c.f];
    const ctl=c.sel?'<select data-k="'+p+'" aria-label="'+esc(c.h)+' '+(i+1)+'">'+c.sel.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===v?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>'
      :c.ta?'<textarea data-k="'+p+'" rows="'+(c.rows||2)+'"'+(c.ph?' placeholder="'+esc(c.ph)+'"':'')+' aria-label="'+esc(c.h)+' '+(i+1)+'">'+esc(v)+'</textarea>':'<input data-k="'+p+'"'+(c.ph?' placeholder="'+esc(c.ph)+'"':'')+' aria-label="'+esc(c.h)+' '+(i+1)+'" value="'+esc(v)+'">';
    return '<td>'+ctl+(c.sel?'':mark(p))+'</td>';}).join('')+'<td class="x"><button type="button" class="rowDel noprint" data-del="'+k+'" data-i="'+i+'" title="Delete this row" aria-label="Delete row '+(i+1)+'">&times;</button></td></tr>';});
  h+='</tbody></table><div class="qs-tools"><button type="button" class="tool" data-add="'+k+'"'+(R.length>=MAXR[k]?' disabled':'')+'>'+(opt.add||'Add a row')+'</button></div>';return h;}
const sub=(t,s)=>'<h3 class="qs-sub">'+t+(s?'<small>'+s+'</small>':'')+'</h3>';
const TIER_KINDS=[['','—'],['sign','Earliest sign'],['tier','A tier'],['hand','Crisis handover'],['rec','Recovery']];
const TRAIN_OPTS=[['','Every adult'],['yes','Trained staff only']];
function renderSetup(){const p=P();
  $('#edSetup').innerHTML=sub('The Student')+
    fld('Student',"meta.client",{m:'client',ph:'as on the plan'})+fld('Student ID',"meta.sid",{m:'sid',small:'for the file; not printed'})+fld('Grade',"meta.grade",{m:'grade',small:'for the file; not printed'})+fld('School and district',"meta.school",{m:'school',small:'for the file; not printed'})+
    fld('What staff call the student','meta.first',{ph:'first name as the adults use it',small:'the headings use it'})+
    fld('Pronouns','meta.pron',{select:[['he','he / him / his'],['she','she / her / her'],['they','they / them / their']]})+
    sub('This Quick Start')+
    fld('Program or classroom','meta.program',{ph:'e.g. the transition program; Room 12',small:'printed above the title'})+
    fld('Read before','meta.start',{type:'date',small:'the first day, when there is one'})+
    fld('It comes from','meta.plan',{ph:'e.g. '+p.pos+' behavior intervention plan of August 2026',small:'named on page one; blank means the plan'})+
    fld('Date issued','meta.issued',{type:'date',small:'printed on every page'})+fld('Case BCBA',"meta.bcba",{m:'bcba',small:'printed under Who to call'})+
    /* v22.48 (review I198) the issue: its number, what changed since the last one, and who holds a copy */
    sub('This Issue','old copies can be found and replaced, and staff read what changed')+
    fld('Issue number','meta.issueNo',{ph:'1',small:'printed on every page'})+
    fld('What changed in this issue','changes',{ta:true,rows:3,ph:'one change a line; printed on page one; blank for the first issue'})+
    fld('Who holds a copy','holders',{ta:true,rows:3,ph:'one person a line, with the issue they hold: e.g. Ms. Lee, classroom teacher: issue 2',small:'kept in the file; not printed'})+
    '<div class="qs-tools"><button type="button" class="tool" id="qsNewIssue">Start a new issue</button></div>';}
function renderWho(){const p=P(),f=firstName();
  $('#edWho').innerHTML=sub('Who '+p.sub+' '+p.is,'one fact a line; the plain, likeable facts first')+
    fld('Who '+f+' is','who',{ta:true,rows:7,ph:'age and program; what '+p.sub+' '+p.is+' like; what '+p.sub+' works for; what '+p.sub+' '+p.has+' already done well'})+
    fld('A goal of '+p.pos+' own','goal',{ph:'e.g. a job in the school office; printed in bold at the end of the box'})+
    sub('Where '+p.sub+' '+p.is+' now','two to four tiles with a number each')+rows('stats',[{f:'n',h:'Number',w:'22%',ph:'e.g. 0, or 2 a day'},{f:'label',h:'What it counts',ph:'e.g. days with no leaving the room'}],{add:'Add a tile'})+
    fld('Under the tiles','statnote',{ta:true,rows:2,ph:'over how many days, from which record, and what the trend has been'})+
    sub('The five things that matter most','a bold lead, then one sentence; three to five')+rows('five',[{f:'head',h:'The lead',w:'30%',ph:'e.g. Predictability is the intervention.'},{f:'text',h:'The sentence',ta:true,ph:'what to do, in the words staff use'}],{add:'Add a thing'})+
    sub('Why the behavior happens','three boxes read left to right')+
    fld('When','when',{ta:true,rows:3,ph:'the situations that set it off'})+fld(cap(f)+' may','may',{ta:true,rows:3,ph:'what the behavior looks like, in plain words'})+fld('Which gets '+p.obj,'gets',{ta:true,rows:3,ph:'what the behavior has been getting '+p.obj+': the function, as staff would see it'})+
    sub('Health and safety')+fld('Every adult must know','health',{ta:true,rows:3,ph:'allergies, medical facts, supervision rules, the precautions on file'});}
function renderDay(){const p=P(),f=firstName();
  $('#edDay').innerHTML=sub('The page title')+fld('Title','title2',{ph:'Most hard moments are prevented before they start'})+
    sub('A day with '+f,'a card for each part of the day; a label and two or three sentences')+rows('day',[{f:'head',h:'Label',w:'24%',ph:'e.g. Arrival'},{f:'text',h:'What happens',ta:true,ph:'who does what, and when'}],{add:'Add a card'})+
    sub('One routine to spell out','the hardest transition of the day, if there is one; blank leaves it out')+fld('Label','spotHead',{ph:'e.g. Getting on the bus'})+fld('What to do','spotText',{ta:true,rows:3})+
    sub('How to talk to '+p.obj)+fld('The rules of thumb','chips',{ta:true,rows:3,ph:'one a line, three or four words each: e.g. One instruction, then wait',small:'printed as chips above the table'})+
    rows('talk',[{f:'sit',h:'Situation',w:'22%'},{f:'say',h:'Say this',ta:true,ph:'the exact words'},{f:'not',h:'Not that',ta:true,w:'28%',ph:'the words that make it worse'}],{add:'Add a row'})+
    sub('Skills','the ones '+p.sub+' already '+p.has+', and the ones being taught; a number is where the record stands')+rows('skills',[{f:'name',h:'Skill',w:'22%'},{f:'kind',h:'Status',w:'14%',sel:[['',cap(p.sub)+' '+p.has+' it'],['teach','Being taught']]},{f:'pct',h:'Number',w:'11%',ph:'e.g. 95%'},{f:'text',h:'What it looks like and how to answer it',ta:true}],{add:'Add a skill'})+
    sub('Something new?')+fld('One line','newline',{ph:'what to expect and what to do when '+p.sub+' meets something new'});}
function renderHard(){const p=P(),f=firstName();
  $('#edHard').innerHTML=sub('The page title')+fld('Title','title3',{ph:'Calm, brief, and the same from every adult'})+
    sub('First: read the moment','two boxes, optional: the two states the adult has to tell apart, and what each calls for')+rows('read',[{f:'name',h:'State',w:'18%',ph:'e.g. Upset'},{f:'signs',h:'What it looks like',ta:true},{f:'do',h:'What it calls for',ta:true}],{add:'Add a state'})+
    fld('Under the boxes','readnote',{ph:'e.g. When in doubt, go brief and neutral first.'})+
    sub('Tier by tier','in the order things happen; the kind says which row is the earliest sign, the handover to the crisis plan and the recovery, which the flow sheet runs under every branch')+
    rows('tiers',[{f:'name',h:'Tier',w:'14%',ph:'e.g. 0 · Earliest sign'},{f:'kind',h:'Kind',w:'11%',sel:TIER_KINDS},{f:'see',h:'What you see',ta:true,w:'19%'},{f:'do',h:'What you do',ta:true},{f:'say',h:'What you say',ta:true,w:'20%',ph:'the exact words'},{f:'train',h:'Who',w:'11%',sel:TRAIN_OPTS}],{add:'Add a tier'})+
    sub('A line every adult must know','optional, printed in red under the table; blank leaves it out')+fld('The line','mustknow',{ta:true,rows:2})+
    /* v22.48 (review I197) how the student says stop, and what every adult does then: from the assent plan (Form SI-1) */
    sub('When '+p.sub+' says stop','from '+p.pos+' assent plan (Form SI-1): how '+p.sub+' says it and what you do; printed under the tiers')+fld('The line','stop',{ta:true,rows:3,ph:'how '+p.sub+' says stop, and what every adult does then'})+
    sub('If a consequence is warranted','optional; prints only when it is in the consented plan and something is written here')+
    fld('In the consented plan?','consOk',{select:[['','Not confirmed: the box does not print'],['yes','Yes: it is in the plan the parent consented to']]})+
    fld('What the team has found','consLead',{ta:true,rows:3,ph:'what has and has not changed '+p.pos+' later behavior'})+fld('Say once, after '+p.sub+' '+p.is+' calm','consSay',{ph:'the exact words, with blanks where they belong'})+
    fld('The rules','consRules',{ta:true,rows:4,ph:'one a line; a lead and a colon make the lead bold: e.g. Only: for a safety event'});}
function renderRules(){const p=P();
  $('#edRules').innerHTML=sub('The page title')+fld('Title','title4',{ph:'One plan, one voice, one record'})+
    sub('Non-negotiables for every adult','each do beside the don’t it replaces')+rows('rules',[{f:'do',h:'Do',ta:true},{f:'dont',h:'Don’t',ta:true},{f:'train',h:'Who',w:'13%',sel:TRAIN_OPTS}],{add:'Add a pair'})+
    sub('What you record, every school day')+rows('rec',[{f:'measure',h:'Measure',w:'22%'},{f:'counts',h:'What counts',ta:true},{f:'how',h:'How',ta:true,w:'26%',ph:'e.g. Count; exact words in the note'}],{add:'Add a measure'})+
    fld('Under the table','recnote',{ph:'e.g. The first day is the next row of the same record: same counts, same sheet, no new baseline.'})+
    sub('The first weeks','each step advances on '+p.pos+' data, not the calendar')+rows('phases',[{f:'head',h:'Step',w:'16%',ph:'e.g. 1 · Model'},{f:'when',h:'When',w:'14%',ph:'e.g. days 1–3'},{f:'text',h:'What happens',ta:true},{f:'next',h:'Next, when',ta:true,w:'26%',ph:'what has to be true before the next step'}],{add:'Add a step'})+
    sub('Who to call','a card each; a role with no name prints a line to write one')+rows('calls',[{f:'role',h:'Role',w:'24%'},{f:'name',h:'Name',w:'26%'},{f:'when',h:'For what',ta:true}],{add:'Add a card'})+
    fld('The crisis call','callCrisis',{select:[['','Not chosen: the flow sheet prints a line to write a name']].concat(filled('calls').map(c=>[T(c.role)||T(c.name),T(c.role)+(T(c.name)?' ('+T(c.name)+')':'')])),small:'the card the flow sheet calls at the handover; someone on site'})+
    /* v22.48 (review I199) each adult's part, and whether they are trained on this plan (Form ST-1) */
    sub('Each adult’s part','who does what; printed on page four when filled')+rows('parts',[{f:'who',h:'Who',w:'26%',ph:'e.g. Ms. Lee, classroom teacher'},{f:'part',h:'Their part',ta:true},{f:'trained',h:'Trained on this plan',w:'16%',sel:[['','Not yet'],['yes','Yes (Form ST-1)']]}],{add:'Add a person'})+
    sub('One voice')+fld('The closing line','onevoice',{ta:true,rows:2,ph:'e.g. During an escalation one adult speaks; the others clear the area and stay quiet. A handover is said out loud.'});}
function renderFlow(){const p=P(),f=firstName(),sk=filled('skills');
  $('#edFlow').innerHTML=fld('Print the flow sheet','flowOn',{select:[['yes','Yes, as its own page'],['no','No']]})+
    fld('When '+p.sub+' '+p.is+' working','flowCalm',{ta:true,rows:3,ph:'two or three lines: the routines that keep a good day going; blank uses the first cards of page two'})+
    /* v22.48 (review F392) the request is the one the BCBA picks; what honoring it gives comes from the plan */
    fld('The request','askName',{select:[['','The first skill on page two']].concat(sk.map(x=>[T(x.name),T(x.name)])),small:'the branch '+f+' uses the request'})+
    fld('Honor it','flowHonor',{ta:true,rows:3,ph:'what '+p.sub+' gets for the request, how much, and any wait the plan builds in'})+
    fld('Then','flowThen',{ta:true,rows:2,ph:'what follows; blank leaves it to the recovery row'})+
    fld('The call','flowCall',{ta:true,rows:2,ph:'who is called at the handover and how; blank uses the crisis call chosen on Rules & calls'})+
    /* v22.48 (review I200) the reading check */
    sub('A reading check','a page each adult answers after reading, before training; not a competency check')+
    fld('Print the reading check','checkOn',{select:[['no','No'],['yes','Yes, as the last page']]})+
    '<div class="qs-key" id="qsKey"></div>';}
function renderEditor(){renderSetup();renderWho();renderDay();renderHard();renderRules();renderFlow();}
function renderMarks(){$$('[data-mark]').forEach(el=>{const p=el.dataset.mark;const on=isPulled(p);
  if(on&&!el.classList.contains('qs-pull')){el.className='qs-pull';el.innerHTML=PULL_HTML(p);}else if(!on&&el.classList.contains('qs-pull')){el.className='';el.innerHTML='';}});}
function autosize(ta){if(!ta||ta.tagName!=='TEXTAREA')return;ta.style.height='auto';ta.style.height=Math.min(400,ta.scrollHeight+2)+'px';}
document.addEventListener('input',e=>{const el=e.target;if(!el.dataset||el.dataset.k===undefined)return;setP(el.dataset.k,el.value);autosize(el);renderMarks();buildSoon(300);});
document.addEventListener('change',e=>{const el=e.target;if(!el.dataset||el.dataset.k===undefined)return;setP(el.dataset.k,el.value);
  if(el.dataset.k==='meta.pron'||el.dataset.k==='meta.first'||el.dataset.k==='meta.client'||/^calls\.\d+\.(role|name)$|^skills\.\d+\.name$/.test(el.dataset.k)){renderEditor();}buildSoon(0);});
document.addEventListener('click',async e=>{const a=e.target.closest('button[data-add]');if(a){const k=a.dataset.add;if(S[k].length<MAXR[k])S[k].push(row(k));renderEditor();buildSoon(0);return;}
  const d=e.target.closest('button.rowDel[data-del]');if(!d)return;e.preventDefault();const k=d.dataset.del,i=+d.dataset.i,r=S[k][i];if(!r)return;
  if(ROW[k].some(f=>T(r[f]))&&!(await nbhUI.confirm('Delete this row?\nWhat it holds is deleted.',{ok:'Delete',danger:true})))return;
  S[k].splice(i,1);Object.keys(S.pulled).forEach(p=>{if(p.indexOf(k+'.')===0)delete S.pulled[p];});Object.keys(S.changed).forEach(p=>{if(p.indexOf(k+'.')===0)delete S.changed[p];});renderEditor();buildSoon(0);});
document.addEventListener('click',e=>{const u=e.target.closest('button[data-usenew]'),k=e.target.closest('button[data-keepmine]');if(!u&&!k)return;
  const p=(u||k).dataset[u?'usenew':'keepmine'],nv=T(S.changed[p]);if(!nv)return;
  if(u)setP(p,nv);
  S.pulled[p]=nv;   /* kept or used: the plan's new words are known, so they do not ask again */
  delete S.changed[p];renderEditor();buildSoon(0);});
/* v22.48 (review F390) Keep as is: the BCBA has read the plan's words in this field and keeps them; and all at once, after a question */
document.addEventListener('click',async e=>{const b=e.target.closest('button[data-okp]');
  if(b){e.preventDefault();const p=b.dataset.okp;S.ok[p]=T(getP(p));renderMarks();buildSoon(0);return;}
  if(e.target.closest('#qsOkAll')){const L=Object.keys(pulledNow());if(!L.length)return;
    if(!(await nbhUI.confirm('Keep the plan’s words in all '+L.length+' fields?\nOnly when you have read each one and it already says what staff should do, in words they use. The draft mark then comes off the pages.',{ok:'Keep them all'})))return;
    L.forEach(p=>{S.ok[p]=T(getP(p));});renderMarks();buildSoon(0);return;}
  /* v22.48 (review I198) a new issue: the next number, issued today, and a fresh list of what changed */
  if(e.target.closest('#qsNewIssue')){const n=(parseInt(S.meta.issueNo,10)||1)+1;
    if(!(await nbhUI.confirm('Start issue '+n+'?\nThe issue number goes up, the date issued becomes today, and What changed starts empty for this issue. Record who receives the new copy under Who holds a copy, and collect the old ones.',{ok:'Start issue '+n})))return;
    S.meta.issueNo=String(n);S.meta.issued=ymd();S.changes='';renderEditor();buildSoon(0);
    nbhUI.toast('Issue '+n+' started. Write what changed, so staff read the change instead of rereading every page.',{kind:'ok'});}});

/* ---------------- the handout ---------------- */
const nl=s=>esc(s).replace(/\n/g,'<br>');
const paras=s=>lines(s).map(x=>'<p>'+esc(x)+'</p>').join('');
function band(kick,title,subHtml){return '<div class="qs-band"><p class="qs-kick">'+esc(kick)+'</p><h1>'+esc(title)+'</h1>'+(subHtml?'<div class="qs-gold"></div><p>'+subHtml+'</p>':'')+'</div>';}
/* v22.48 (review F393, I198, F390) the page foot carries the issue and its date, and a draft says so on every page; the plan
   governs and the handling line are under page one's title and in the sheet's margin (pageCss), where the browser prints one */
function issueLine(){const n=T(S.meta.issueNo),d=T(S.meta.issued);return [n?'Issue '+n:'',d?'issued '+fmtShort(d):''].filter(Boolean).join(', ');}
function fmtShort(d){const q=String(d).split('-');if(q.length!==3)return d;const dt=new Date(+q[0],+q[1]-1,+q[2]);return isNaN(dt)?d:dt.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
function foot(n,N){const il=issueLine(),dr=draftN();
  return (dr?'<div class="qs-wm" aria-hidden="true">Draft</div>':'')+'<div class="qs-foot"><span>'+esc(T(S.meta.client)||'Student')+' &middot; Staff quick start'+(il?' &middot; '+esc(il):'')+' &middot; Page '+n+' of '+N+'</span><span class="conf">'+(dr?'<b class="dr">Draft: not yet reviewed by the case BCBA</b> &middot; ':'')+'Confidential student record (FERPA)</span></div>';}
const lab=t=>'<p class="qs-lab">'+t+'</p>';
/* "Lead: the rest" makes the lead bold */
function leadLine(s){const m=/^([^:]{2,40}):\s*(.+)$/.exec(s);return m?'<b>'+esc(m[1])+':</b> '+esc(m[2]):esc(s);}
function page1(N){const p=P(),f=firstName(),st=filled('stats'),five=filled('five');
  const sub='Read before '+(S.meta.start?p.pos+' first day, '+esc(fmtDate(S.meta.start)):'you work with '+p.obj)+'. Drawn from '+esc(T(S.meta.plan)||p.pos+' behavior intervention plan')+' and '+p.pos+' team&rsquo;s records.';
  let h='<div class="qs-page" data-page="1">'+band('Staff quick start'+(T(S.meta.program)?' · '+T(S.meta.program):''),'Working with '+f,sub);
  /* v22.48 (review F393) on paper the pages run on and the page foot is the sheet's margin, which not every browser prints: the
     handling line is printed here, under the title, once */
  {const il=issueLine(),dr=draftN();h+='<p class="qs-handle">'+(dr?'<b>Draft: not yet reviewed by the case BCBA.</b> ':'')+(il?esc(cap(il))+'. ':'')+'Where this and the plan differ, the plan governs. Keep it out of students&rsquo; sight; do not copy it or pass it on; return it when you no longer work with '+esc(f)+'.</p>';}
  if(lines(S.changes).length)h+='<div class="qs-strip blue" style="margin:0 0 8px"><b>What changed in '+(T(S.meta.issueNo)?'issue '+esc(T(S.meta.issueNo)):'this issue')+':</b> '+lines(S.changes).map(x=>esc(/[.!?]["\u201d]?$/.test(x)?x:x+'.')).join(' ')+'</div>';
  const who=lines(S.who);
  if(who.length||T(S.goal)||st.length){h+='<div class="qs-cols">';
    if(who.length||T(S.goal))h+='<div class="qs-col w">'+lab('Who '+p.sub+' '+p.is)+'<div class="qs-box qs-who">'+who.map(x=>'<p>'+esc(x)+'</p>').join('')+(T(S.goal)?'<p><b>'+esc(T(S.goal))+'</b></p>':'')+'</div></div>';
    if(st.length)h+='<div class="qs-col">'+lab('Where '+p.sub+' '+p.is+' now')+'<div class="qs-tiles">'+st.map(s=>'<div class="qs-tile"><b'+(T(s.n).length>3?' class="small"':'')+'>'+esc(T(s.n)||'&ndash;')+'</b><span>'+esc(s.label)+'</span></div>').join('')+'</div>'+(T(S.statnote)?'<p class="qs-note">'+nl(T(S.statnote))+'</p>':'')+'</div>';
    h+='</div>';}
  if(five.length)h+=lab('The '+['','one thing','two things','three things','four things','five things','six things','seven things'][five.length]+' that matter most')+'<ol class="qs-five">'+five.map((x,i)=>'<li><span class="n">'+(i+1)+'</span><p>'+(T(x.head)?'<b>'+esc(T(x.head))+'</b> ':'')+esc(T(x.text))+'</p></li>').join('')+'</ol>';
  if(T(S.when)||T(S.may)||T(S.gets))h+=lab('Why the behavior happens')+'<div class="qs-chain"><div class="qs-box blue"><p class="k">When</p><p>'+nl(T(S.when))+'</p></div><div class="qs-arrow">&rarr;</div><div class="qs-box pink"><p class="k red">'+esc(cap(f))+' may</p><p>'+nl(T(S.may))+'</p></div><div class="qs-arrow">&rarr;</div><div class="qs-box mint"><p class="k teal">Which gets '+esc(p.obj)+'</p><p>'+nl(T(S.gets))+'</p></div></div>';
  if(T(S.health))h+='<div class="qs-box pink" style="margin-top:10px;display:flex;gap:12px"><p class="k red" style="flex:0 0 104px;margin:0">Health and safety</p><p style="margin:0">'+nl(T(S.health))+'</p></div>';
  return h+foot(1,N)+'</div>';}
function page2(N){const p=P(),f=firstName(),day=filled('day'),talk=filled('talk'),chips=lines(S.chips),sk=filled('skills');
  let h='<div class="qs-page" data-page="2">'+band('Every day · Prevent and teach',T(S.title2)||'Most hard moments are prevented before they start');
  if(day.length)h+=lab('A day with '+f)+'<div class="qs-cards'+(day.length===2||day.length===4?' two':'')+'">'+day.map(c=>'<div class="qs-card"><p class="k">'+esc(T(c.head)||'Every day')+'</p><p>'+nl(T(c.text))+'</p></div>').join('')+'</div>';
  if(T(S.spotText))h+='<div class="qs-spot"><p class="k">'+esc(T(S.spotHead)||'One routine')+'</p><p>'+nl(T(S.spotText))+'</p></div>';
  if(chips.length||talk.length){h+=lab('How to talk to '+p.obj);if(chips.length)h+='<div class="qs-chips">'+chips.map(c=>'<span>'+esc(c)+'</span>').join('')+'</div>';
    if(talk.length)h+='<table class="qs-t"><thead><tr><th>Situation</th><th class="teal">Say this</th><th class="red">Not that</th></tr></thead><tbody>'+talk.map(r=>'<tr><td class="sit">'+nl(T(r.sit))+'</td><td class="say">'+nl(T(r.say))+'</td><td class="not">'+nl(T(r.not))+'</td></tr>').join('')+'</tbody></table>';}
  /* v22.48 (review F395) the skills the student has, apart from the ones being taught */
  const skCards=L=>'<div class="qs-skills"'+(L.length!==3?' style="grid-template-columns:repeat('+Math.min(L.length,4)+',1fr)"':'')+'>'+L.map(s=>'<div class="qs-skill">'+(T(s.pct)?'<span class="pct">'+esc(T(s.pct))+'</span>':'')+'<b>'+esc(T(s.name))+'</b><p>'+nl(T(s.text))+'</p></div>').join('')+'</div>';
  const skHas=sk.filter(s=>T(s.kind)!=='teach'),skTeach=sk.filter(s=>T(s.kind)==='teach');
  if(skHas.length)h+=lab('Skills '+p.sub+' already '+p.has)+skCards(skHas);
  if(skTeach.length)h+=lab('Skills being taught: '+p.sub+' '+(p.sub==='they'?'are':'is')+' still learning these; prompt and praise them')+skCards(skTeach);
  if(T(S.newline))h+='<div class="qs-strip"><b>Something new?</b> '+esc(T(S.newline))+'</div>';
  return h+foot(2,N)+'</div>';}
/* v22.48 (review F392) a row's kind says what it is; a row from before kinds is the recovery only when it is named so (never by its
   place in the table, nor by the word "after" in its name), and the handover when it says the crisis plan governs */
const tierKind=r=>T(r.kind)||(/^\s*(\d+\s*[·.:-]\s*)?(recovery|calm again)\b/i.test(T(r.name))?'rec':/crisis plan governs|hand(s)?\s*over/i.test(T(r.name))?'hand':'');
const tierClass=(r,i,n)=>{const k=tierKind(r);return k==='rec'?'rec':k==='sign'?'t0':k==='hand'?'t3':'t'+Math.min(i,4);};
const trainBadge=r=>T(r.train)==='yes'?'<span class="qs-train">Trained staff only</span>':'';
function page3(N){const rd=filled('read'),ti=filled('tiers');
  let h='<div class="qs-page" data-page="3">'+band('When it gets hard · Respond',T(S.title3)||'Calm, brief, and the same from every adult');
  if(rd.length){h+=lab('First: read the moment')+'<div class="qs-cols">'+rd.map((r,i)=>'<div class="qs-col"><div class="qs-box '+(i?'yellow':'blue')+'" style="height:100%"><p><b>'+esc(T(r.name))+'</b>'+(T(r.signs)?' ('+esc(T(r.signs))+')':'')+(T(r.do)?': '+esc(T(r.do)):'')+'</p></div></div>').join('')+'</div>';
    if(T(S.readnote))h+='<p class="qs-note" style="margin-top:5px">'+esc(T(S.readnote))+'</p>';}
  if(ti.length)h+=lab('Tier by tier')+'<table class="qs-t"><thead><tr><th>What you see</th><th class="teal">What you do</th><th>What you say</th></tr></thead><tbody>'+ti.map((r,i)=>'<tr class="'+tierClass(r,i,ti.length)+'"><td class="see">'+(T(r.name)?'<b>'+esc(T(r.name))+'</b>':'')+trainBadge(r)+nl(T(r.see))+'</td><td>'+nl(T(r.do))+'</td><td class="sayc">'+nl(T(r.say))+'</td></tr>').join('')+'</tbody></table>';
  if(T(S.mustknow))h+='<div class="qs-strip red" style="margin-top:9px">'+leadLine(T(S.mustknow).replace(/\n+/g,' '))+'</div>';
  if(lines(S.stop).length)h+='<div class="qs-strip blue" style="margin-top:9px"><b>When '+esc(firstName())+' says stop.</b> '+lines(S.stop).map(leadLine).join(' ')+'</div>';
  /* v22.48 (review F396) the consequence box prints only when the BCBA confirms it is in the consented plan, and says which plan */
  if(S.consOk==='yes'&&(T(S.consLead)||T(S.consRules)||T(S.consSay))){const p=P();h+='<div class="qs-consq"><div class="h">In the plan'+(T(S.meta.plan)?' ('+esc(T(S.meta.plan))+')':'')+' · If a consequence is warranted · Serious incidents only</div><div class="b"><div>'+(T(S.consLead)?'<p style="margin:0">'+nl(T(S.consLead))+'</p>':'')+(T(S.consSay)?'<p class="say">Say once, after '+esc(p.sub)+' '+esc(p.is)+' calm: &ldquo;'+esc(T(S.consSay))+'&rdquo;</p>':'')+'</div>'+(lines(S.consRules).length?'<ul>'+lines(S.consRules).map(x=>'<li>'+leadLine(x)+'</li>').join('')+'</ul>':'')+'</div></div>';}
  return h+foot(3,N)+'</div>';}
function page4(N){const p=P(),ru=filled('rules'),rc=filled('rec'),ph=filled('phases'),ca=filled('calls');const skN=filled('skills').map(s=>T(s.name).toLowerCase());
  let h='<div class="qs-page" data-page="4">'+band('Rules · Record · Calls',T(S.title4)||'One plan, one voice, one record');
  if(ru.length)h+=lab('Non-negotiables for every adult')+'<table class="qs-t"><thead><tr><th class="teal" style="width:50%">Do</th><th class="red">Don&rsquo;t</th></tr></thead><tbody>'+ru.map(r=>'<tr><td class="do">'+trainBadge(r)+nl(T(r.do))+'</td><td class="dont">'+nl(T(r.dont))+'</td></tr>').join('')+'</tbody></table>';
  if(rc.length){h+=lab('What you record, every school day')+'<table class="qs-t"><thead><tr><th>Measure</th><th>What counts</th><th>How</th></tr></thead><tbody>'+rc.map(r=>{const m=T(r.measure).toLowerCase();const cls=/^abc\b|^note\b/.test(m)?'abc':skN.some(s=>s&&m.indexOf(s)>=0)||/\bwell$|asks for|uses the/.test(m)?'rep':'';
    return '<tr'+(cls?' class="'+cls+'"':'')+'><td class="m">'+esc(T(r.measure))+'</td><td>'+nl(T(r.counts))+'</td><td>'+nl(T(r.how))+'</td></tr>';}).join('')+'</tbody></table>';
    if(T(S.recnote))h+='<p class="qs-note" style="margin-top:5px">'+esc(T(S.recnote))+'</p>';}
  if(ph.length)h+=lab('The first weeks: each step advances on '+p.pos+' data, not the calendar')+'<div class="qs-phases"'+(ph.length!==4?' style="grid-template-columns:repeat('+Math.min(ph.length,4)+',1fr)"':'')+'>'+ph.map(x=>'<div class="qs-phase"><b>'+esc(T(x.head))+'</b>'+(T(x.when)?'<i>'+esc(T(x.when))+'</i>':'')+'<p>'+nl(T(x.text))+'</p>'+(T(x.next)?'<p class="next">Next: '+esc(T(x.next))+'</p>':'')+'</div>').join('')+'</div>';
  const cc=crisisCard();
  if(ca.length)h+=lab('Who to call')+'<div class="qs-calls"'+(ca.length!==5?' style="grid-template-columns:repeat('+ca.length+',1fr)"':'')+'>'+ca.map(c=>'<div class="qs-call'+(c===cc?' crisis':'')+'">'+(c===cc?'<span class="qs-cc">Crisis call</span>':'')+'<b>'+esc(T(c.name)||T(c.role))+'</b>'+(T(c.name)&&T(c.role)?'<p>'+esc(T(c.role))+'</p>':'')+(T(c.when)?'<p>'+nl(T(c.when))+'</p>':'')+(T(c.name)?'':'<div class="line"></div>')+'</div>').join('')+'</div>';
  const pa=filled('parts');
  if(pa.length)h+=lab('Each adult&rsquo;s part')+'<table class="qs-t"><thead><tr><th style="width:30%">Who</th><th class="teal">Their part</th><th style="width:13%">Trained</th></tr></thead><tbody>'+pa.map(r=>'<tr><td class="m">'+esc(T(r.who))+'</td><td>'+nl(T(r.part))+'</td><td>'+(T(r.trained)==='yes'?'Yes':'Not yet')+'</td></tr>').join('')+'</tbody></table>';
  if(T(S.onevoice))h+='<div class="qs-strip blue"><b>One voice.</b> '+esc(T(S.onevoice))+'</div>';
  return h+foot(4,N)+'</div>';}
/* the flow sheet: one glance from "what do you see?" to what to do, drawn from the pages */
/* v22.48 (review F391) the crisis call: the card the BCBA chose, else one that names the administrator, the office or the crisis
   team; never simply the first card, and never the consulting BCBA by default */
function crisisCard(){const ca=filled('calls'),k=T(S.callCrisis).toLowerCase();
  return (k&&ca.find(c=>T(c.role).toLowerCase()===k||T(c.name).toLowerCase()===k))||ca.find(c=>/admin|front office|principal|crisis/i.test(T(c.role)))||null;}
/* v22.48 (review F392) the request the branch is about: the one picked, else the first skill */
function askSkill(){const sk=filled('skills'),k=T(S.askName).toLowerCase();return (k&&sk.find(x=>T(x.name).toLowerCase()===k))||sk[0]||null;}
function flowPage(pn,N){const p=P(),f=firstName(),ti=filled('tiers'),day=filled('day'),sk=filled('skills'),talk=filled('talk'),ca=filled('calls');
  const node=(cls,k,body)=>'<div class="node '+cls+'">'+(k?'<p class="k">'+esc(k)+'</p>':'')+body+'</div>';
  const q=s=>{s=T(s);return /^["\u201c\u2018']/.test(s)?nl(s):'&ldquo;'+nl(s)+'&rdquo;';};
  const down='<div class="down">&#9660;</div>';
  const recI=ti.findIndex(r=>tierKind(r)==='rec');const rec=recI>=0?ti[recI]:null;const steps=ti.filter((r,i)=>i!==recI);
  const sI=steps.findIndex(r=>tierKind(r)==='sign'),anyKind=ti.some(r=>T(r.kind));
  const t0=sI>=0?steps[sI]:(!anyKind&&steps.length>1?steps[0]:null),beh=steps.filter(r=>r!==t0);
  const calm=lines(S.flowCalm).length?lines(S.flowCalm):day.slice(0,3).map(c=>(T(c.head)?T(c.head)+': ':'')+T(c.text));
  const ask=askSkill();const askSay=ask?talk.find(r=>T(r.sit).toLowerCase().indexOf(T(ask.name).toLowerCase().split(/\s+/)[0])>=0&&T(r.say)):null;
  let h='<div class="qs-page qs-flow" data-page="'+pn+'">'+band('The flow sheet · One glance','What you see, what you do','Three branches. Every one ends the same way: back to the plan, the same from every adult.');
  h+='<div class="root">What do you see?</div><div class="stem"></div><div class="bar"></div><div class="cols">';
  /* 1 calm, and the earliest sign */
  h+='<div class="col"><div class="stem"></div>'+node('see calm','You see',esc(f)+' is working, or settling')+down+node('','Keep the day going',calm.length?'<ul class="plain">'+calm.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>the routines on page two</p>');
  if(t0)h+=down+node('see t0','You see · '+(T(t0.name)||'the earliest sign'),nl(T(t0.see)))+down+node('','Do',nl(T(t0.do))||'<p>the first row of page three</p>')+(T(t0.say)?down+node('','Say',q(t0.say)):'');
  h+='</div>';
  /* 2 the request */
  h+='<div class="col"><div class="stem"></div>'+node('see ask','You see',ask?esc(f)+' uses the request: '+esc(T(ask.name)):esc(f)+' asks for what '+esc(p.sub)+' needs')+down+node('','Honor it',T(S.flowHonor)?nl(T(S.flowHonor)):'<p>give what the plan says the request earns: how much, and whether the plan builds in a wait</p>')+(askSay?down+node('','Say',q(askSay.say)):'')+(T(S.flowThen)?down+node('','Then',nl(T(S.flowThen))):'')+'</div>';
  /* 3 the behavior, tier by tier, then the call */
  h+='<div class="col"><div class="stem"></div>';
  if(beh.length)beh.forEach((r,i)=>{const cls=tierClass(r,ti.indexOf(r),ti.length);h+=(i?down:'')+node('see '+cls,'You see · '+(T(r.name)||'tier '+(i+1)),nl(T(r.see)))+down+node('','Do'+(T(r.say)?' · Say':'')+(T(r.train)==='yes'?' · trained staff only':''),nl(T(r.do))+(T(r.say)?'<p style="margin:3px 0 0">'+q(r.say)+'</p>':''));});
  else h+=node('see t2','You see','the behavior')+down+node('','Do','<p>the tiers on page three</p>');
  const cc=crisisCard();
  const call=lines(S.flowCall).length?lines(S.flowCall).map(esc).join('<br>'):cc?esc(T(cc.name)||T(cc.role))+(T(cc.name)&&T(cc.role)?' ('+esc(T(cc.role))+')':'')+(T(cc.when)?': '+esc(T(cc.when)):''):'';
  h+=down+node('call','Call',(call?'<p>'+call+'</p>':'<p>Name: <span class="wline"></span></p><p class="small">the person on site the school names for a crisis</p>')+'<p style="margin:3px 0 0">Then the crisis plan, Form CR-1, which governs from here.</p>')+'</div></div>';
  h+='<div class="wide">'+node('see rec','Then, every branch · '+(rec&&T(rec.name)?T(rec.name):'Recovery'),rec?nl(T(rec.do))+(T(rec.say)?'<p style="margin:3px 0 0">'+q(rec.say)+'</p>':''):'<p>brief, neutral, back to the same task; praise the first right thing</p>')+'</div>';
  h+='<p class="leg">Drawn from pages 1 to 4 on '+esc(new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}))+'. Where this page and the plan differ, the plan governs.</p>';
  return h+foot(pn,N)+'</div>';}
/* v22.48 (review I200) a reading check: a few questions from these pages, answered in each adult's own words after reading and
   before training. It shows the handout was read and catches a misreading; it is not a competency check (reading alone does not
   produce correct implementation: Parsons, Rollyson, & Reid, 2012), so training with practice and feedback follows (Form ST-1). */
function readQs(){const p=P(),f=firstName(),ti=filled('tiers'),ru=filled('rules'),rc=filled('rec'),ask=askSkill(),cc=crisisCard(),Q=[];
  const t0=ti.find(r=>tierKind(r)==='sign')||(!ti.some(r=>T(r.kind))?ti[0]:null),hand=ti.find(r=>tierKind(r)==='hand');
  if(t0&&(T(t0.see)||T(t0.do)))Q.push({q:'What is the first sign that '+f+' is getting stuck, and what do you do then?',a:[T(t0.see),T(t0.do)].filter(Boolean).join(' → ')});
  if(ask)Q.push({q:'When '+f+' uses '+(p.pos)+' request ('+T(ask.name).toLowerCase()+'), what do you do?',a:T(S.flowHonor)||T(ask.text)});
  const r1=ru.find(r=>T(r.dont)&&T(r.do));if(r1)Q.push({q:'Name one thing you never do with '+f+', and what you do instead.',a:T(r1.dont)+' → '+T(r1.do)});
  if(hand||cc){const hn=hand?T(hand.name).replace(/^\s*\d+\s*[·.:-]\s*/,''):'';Q.push({q:'At the crisis tier'+(hn&&!/crisis plan|hand\s*(s\s*)?over/i.test(hn)?' ('+hn.toLowerCase()+')':'')+', whom do you call, and who steps in?',a:(cc?(T(cc.name)||T(cc.role)):'the person on site the school names')+'; only staff trained and certified in the district’s method step in'});}
  if(rc.length)Q.push({q:'What do you record for '+f+' every school day?',a:rc.map(r=>T(r.measure)).filter(Boolean).join('; ')});
  if(lines(S.stop).length)Q.push({q:'How does '+f+' say stop, and what do you do?',a:lines(S.stop).join(' ')});
  return Q.slice(0,6);}
function checkPage(pn,N){const f=firstName(),Q=readQs();
  let h='<div class="qs-page qs-check" data-page="'+pn+'">'+band('Reading check','Before you start with '+f,'Answer in your own words, after reading these pages and before training. It is a reading check, not a test of how you run the plan: training with practice and feedback follows.');
  h+='<div class="qs-checkid"><span>Name <span class="wline"></span></span><span>Role <span class="wline"></span></span><span>Date <span class="wline short"></span></span></div>';
  h+=(Q.length?'<ol class="qs-qs">'+Q.map(x=>'<li><p>'+esc(x.q)+'</p><div class="ans"></div><div class="ans"></div></li>').join('')+'</ol>':'<p class="qs-note">Fill pages one to four first: the questions come from them.</p>');
  h+='<p class="qs-note">Hand it back to the case BCBA'+(T(S.meta.bcba)?' ('+esc(T(S.meta.bcba))+')':'')+'. A wrong answer is a line to explain again before the first day, not a mark against you.</p>';
  return h+foot(pn,N)+'</div>';}
function keyHTML(){const Q=readQs();return Q.length?'<b>The answers, from these pages (on screen only)</b><ol>'+Q.map(x=>'<li><i>'+esc(x.q)+'</i><br>'+esc(x.a||'(not on the pages yet)')+'</li>').join('')+'</ol>':'<span class="hint">The questions come from pages one to four; fill them first.</span>';}
function handoutHTML(){const fl=S.flowOn!=='no',ck=S.checkOn==='yes',N=4+(fl?1:0)+(ck?1:0);
  return page1(N)+page2(N)+page3(N)+page4(N)+(fl?flowPage(5,N):'')+(ck?checkPage(N,N):'');}

/* ---------------- review: the plan's words, jargon, length ---------------- */
const JARGON=['reinforcement','reinforcer','reinforce','extinction','differential reinforcement','DRA','DRO','DNRA','NCR','NCE','FCT','functional communication',
  'SD','discriminative stimulus','establishing operation','EO','MO','motivating operation','mand','tact','intraverbal','contingency','schedule of reinforcement',
  'VI','VR','FI','FR','prompt fading','errorless','antecedent','consequence','topography','precursor','behavioral momentum','high-p','escape-maintained',
  'satiation','deprivation','latency','IRT','token economy','response cost','stimulus control','generalization','baseline','criterion','fidelity','integrity',
  /* v22.48 (review F390) words the check passed on a full case */
  'setting event','neutralizing routine','presession','pairing','social negative','social positive','negative reinforcement','positive reinforcement',
  'automatic reinforcement','RRB','functional analysis','IISCA','A-CSA','competing stimulus','SGD','CRF','thinning','multiple schedule','delay tolerance','escape extinction'];
/* v22.48 the settings (the flow sheet and reading check on or off, a confirmation, a choice of card or request) are not text */
const NOT_TEXT={meta:1,pulled:1,changed:1,ok:1,flowOn:1,checkOn:1,consOk:1,callCrisis:1,askName:1};
function allText(){const out=[];Object.keys(S).forEach(k=>{if(NOT_TEXT[k])return;if(ROW[k])S[k].forEach(r=>ROW[k].forEach(f=>{if(!CHOICE[f])out.push(r[f]);}));else out.push(S[k]);});return out.map(T).filter(Boolean).join(' ');}
function jargonHits(){const low=' '+allText().toLowerCase()+' ',hit=[];JARGON.forEach(w=>{const re=new RegExp('(^|[^a-z])'+w.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&')+'([^a-z]|$)');if(re.test(low))hit.push(w);});return hit;}
function pulledNow(){const out={};Object.keys(S.pulled).forEach(p=>{if(isPulled(p))out[p]=T(S.pulled[p]);});return out;}
/* v22.48 (review F390) a draft: a field still holds the plan's words unreviewed, or a line waits on "the plan has changed here" */
function draftN(){return Object.keys(pulledNow()).length+Object.keys(S.changed).filter(p=>T(S.changed[p])).length;}
const PAGE_H=10*96,HEAD_H=0.46*96+22;
function pageHeights(html){let m=$('#qsMeasure');if(!m){m=document.createElement('div');m.id='qsMeasure';m.className='noprint';m.setAttribute('aria-hidden','true');
    m.style.cssText='position:absolute;left:-10000px;top:0;width:7.5in;visibility:hidden;pointer-events:none';document.body.appendChild(m);}
  m.innerHTML=html;const out=$$('.qs-page',m).map(p=>p.getBoundingClientRect().height);m.innerHTML='';return out.some(h=>h>0)?out:null;}
function reviewHTML(html){const pulled=Object.keys(pulledNow()).length,jar=jargonHits(),hs=pageHeights(html);
  let h='<b>What is left to do</b>';
  h+=pulled?'<div class="bad">'+pulled+' field'+(pulled===1?' still holds':'s still hold')+' the plan&rsquo;s words, not yet rewritten or kept (marked on the pages). Until each is, every page prints <b>Draft</b>, and the rows of rules and tiers that hold them are not handed on to Forms TI-1 and TV-1 as checked. <button type="button" class="tool" id="qsOkAll">Keep them all as they are&hellip;</button></div>':'<div class="ok">Nothing placed from the plan is left unreviewed.</div>';
  const ch=Object.keys(S.changed).filter(p=>T(S.changed[p])).length;
  if(ch)h+='<div class="bad">'+ch+' line'+(ch===1?'':'s')+' you rewrote '+(ch===1?'is':'are')+' under a part of the plan that has changed since: take the plan&rsquo;s new words or keep yours (marked on the pages).</div>';
  /* v22.48 (review F391, I197, F396) what the case says this quick start still lacks */
  if(!crisisCard()&&!lines(S.flowCall).length)h+='<div class="bad">No card is chosen as the crisis call (Rules &amp; calls): the flow sheet prints a line to write a name. The call at the handover goes to someone on site who runs the school&rsquo;s crisis response, not the consulting BCBA.</div>';
  if(CASE&&CASE.student&&CASE.student.stop&&!lines(S.stop).length)h+='<div class="bad">'+esc(firstName())+'&rsquo;s assent plan (Form SI-1) says how '+P().sub+' says stop; page three does not say it yet.</div>';
  if(stopConflict())h+='<div class="bad">The plan uses escape extinction and '+esc(firstName())+' has ways of saying stop, but the plan does not say which rule staff follow when '+P().pos+' stop is also the behavior (Form TD-1, Respond). Settle it there before the stop line goes to staff.</div>';
  {const np=filled('parts').filter(r=>!T(r.part)).length;if(np)h+='<div class="bad">'+np+(np===1?' person under Each adult&rsquo;s part has':' people under Each adult&rsquo;s part have')+' no part written yet (Rules &amp; calls): say what each one does, so each knows '+(np===1?'their':'their own')+' part (34 CFR &sect;300.323(d)(2)).</div>';}
  if(S.consOk!=='yes'&&(T(S.consLead)||T(S.consRules)||T(S.consSay)))h+='<div class="bad">The consequence box does not print until you confirm it is in the plan the parent consented to (When it&rsquo;s hard).</div>';
  h+=jar.length?'<div class="bad">Technical wording still on the pages: '+jar.map(w=>'<span class="j">'+esc(w)+'</span>').join('')+'</div>':'<div class="ok">No technical wording found.</div>';
  if(hs){const over=hs.map((hh,i)=>({i:i+1,px:hh-(PAGE_H-(i===0?HEAD_H:0))})).filter(o=>o.px>1);
    h+=over.length?'<div class="bad">'+over.map(o=>'Page '+o.i+' runs over by about '+Math.ceil(o.px/14)+' line'+(Math.ceil(o.px/14)===1?'':'s')).join('; ')+'. Cut lines rather than shrinking the type.</div>':'<div class="ok">Every page fits on one letter page.</div>';}
  return h;}
let buildT=0;
/* v22.48 (review F393) the sheet's own foot, where the browser prints it: the issue, the plan governs, the handling, and Draft */
function pageCss(){let st=$('#qsPageCss');if(!st){st=document.createElement('style');st.id='qsPageCss';document.head.appendChild(st);}
  const il=issueLine(),q=x=>String(x).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\r\n]+/g,' ');
  const t=(draftN()?'DRAFT: not yet reviewed \u00B7 ':'')+(il?cap(il)+' \u00B7 ':'')+'The plan governs where this differs \u00B7 Confidential (FERPA): keep it out of students\u2019 sight; do not copy or pass it on';
  st.textContent='@media print{@page{@bottom-left{content:"'+q(t)+'"!important;color:#9b2c1f!important;font-size:8pt!important}}}';}
function build(){ensure();pageCss();const html=handoutHTML();$('#out').innerHTML=html;$('#flowPrev').innerHTML=flowPage(5,5);
  const r=reviewHTML(html);$('#review').innerHTML=r;$('#outReview').innerHTML=r;const k=$('#qsKey');if(k)k.innerHTML=keyHTML();renderMarks();}
function buildSoon(ms){clearTimeout(buildT);buildT=setTimeout(build,ms||0);}
window.addEventListener('beforeprint',build);
$('#printBtn').addEventListener('click',async ()=>{build();const n=draftN();
  if(n&&!(await nbhUI.confirm('Print a draft?\n'+n+' field'+(n===1?' still holds':'s still hold')+' the plan’s words, not yet rewritten or kept, so every page prints “Draft: not yet reviewed by the case BCBA”. Staff should get the reviewed copy.',{ok:'Print the draft'})))return;
  setView('out');window.print();});

/* ---------------- save, open, clear ---------------- */
function ymd(){const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
$('#saveBtn').addEventListener('click',()=>{const nm=(T(S.meta.client)||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'QS-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  a.download='QS-1_'+nm+'_'+ymd()+'.json';document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){if(!d||typeof d!=='object'||d.form!=='QS-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank();if(s.meta&&typeof s.meta==='object'&&!Array.isArray(s.meta))Object.keys(o.meta).forEach(k=>{o.meta[k]=str(s.meta[k])||o.meta[k];});
  Object.keys(o).forEach(k=>{if(k==='meta'||k==='pulled')return;if(ROW[k])o[k]=Array.isArray(s[k])?s[k].slice(0,MAXR[k]):o[k];else if(typeof s[k]==='string')o[k]=s[k];});
  o.pulled={};if(s.pulled&&typeof s.pulled==='object'&&!Array.isArray(s.pulled))Object.keys(s.pulled).forEach(p=>{if(typeof s.pulled[p]==='string'&&/^[\w.]+$/.test(p))o.pulled[p]=s.pulled[p];});
  o.changed={};if(s.changed&&typeof s.changed==='object'&&!Array.isArray(s.changed))Object.keys(s.changed).forEach(p=>{if(typeof s.changed[p]==='string'&&/^[\w.]+$/.test(p))o.changed[p]=s.changed[p];});
  return o;}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='QS-1'?d.form:'';const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved QS-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form QS-1. Nothing was changed.':'That file could not be read as a saved QS-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{ensure();renderEditor();build();}catch(err){S=prev;ensure();renderEditor();build();alert('That file could not be read as a saved QS-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderEditor();build();caseState(null);setView('setup');}});

/* ---------------- the case: what the other forms hold, placed here as a starting point ---------------- */
let CASE=null;
function caseState(f){CASE=f;const box=$('#caseState');if(!box)return;
  if(!f){box.className='warn';box.innerHTML='<b>Nothing from the case yet.</b> Open this form in the workstation with the case’s other forms open (DM-1, TB-1, FS-1, TD-1, CR-1, GB-1, PA-1), or open a case file, and what they hold is placed here as a starting point. You can also write everything yourself.';return;}
  const s=f.src||{},bits=[];if(f.profile)bits.push('the profile and precautions (Form '+(s.profile||'DM-1')+')');if((f.behaviors||[]).length)bits.push(f.behaviors.length+(f.behaviors.length===1?' behavior':' behaviors')+' (Form '+(s.behaviors||'TB-1')+')');
  if(f.fn&&(f.fn.label||f.fn.key))bits.push('the function (Form '+(s.fn||'FS-1')+')');if(f.plan)bits.push('the plan (Form '+(s.plan||'TD-1')+')');if(f.crisis)bits.push('the crisis stages (Form '+(s.crisis||'CR-1')+')');
  const g=f.goals||{};if((g.red||[]).length||(g.acq||[]).length)bits.push('the goals (Form '+(s.goals||'GB-1')+')');if((f.menu||[]).length)bits.push('the reinforcer menu (Form '+(s.menu||'PA-1')+')');
  box.className='note';box.innerHTML='<b>From the case:</b> '+(bits.length?bits.join(', '):'nothing this form uses')+'. Placed into empty fields only, each marked until rewritten. <b>From the case</b> on the toolbar picks items into fields already in use.';}
/* v21.74 what the case places. An empty field takes the plan's words. A field still holding the words placed before follows
   the plan when it changes (it was never rewritten). A field rewritten here keeps its words; when the plan's words for it change
   it is marked (S.changed) with the new words, to use or to keep. A field takes one value in a pass (the first source wins). */
let PASS=new Set();
function place(p,v){v=T(v);if(!v||PASS.has(p))return false;PASS.add(p);
  const cur=T(getP(p)),was=T(S.pulled[p]);
  if(!cur){setP(p,v);S.pulled[p]=v;delete S.changed[p];return true;}
  if(was&&cur===was){if(v===was)return false;setP(p,v);S.pulled[p]=v;delete S.changed[p];return true;}
  if(was&&v!==was){if(T(S.changed[p])!==v)S.changed[p]=v;return false;}
  return false;}
/* a list line (a day card) placed once: the same words already on a card, or placed there before, are not placed again */
function placeRow(k,f,v){v=T(v);if(!v)return false;
  for(let i=0;i<S[k].length;i++){if(T(S[k][i][f])===v||T(S.pulled[k+'.'+i+'.'+f])===v){PASS.add(k+'.'+i+'.'+f);return false;}}
  const i=blankRow(k);return i>=0&&place(k+'.'+i+'.'+f,v);}
const md=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?(+m[2])+'/'+(+m[3]):String(iso||'');};
const nfmt=x=>x==null?'':String(Math.round(x*10)/10);
/* v22.48 a row holding only a choice (a kind, a status) is blank: nothing of it prints */
function blankRow(k){let i=S[k].findIndex(r=>!ROW[k].some(f=>!CHOICE[f]&&T(r[f])));
  if(i<0){if(S[k].length>=MAXR[k])return -1;S[k].push(row(k));i=S[k].length-1;}return i;}
/* v22.48 (review F394) a choice field (a tier's kind, a skill's status) is set from the case only while empty, and is never marked */
function setIfEmpty(p,v){if(!T(getP(p))&&T(v))setP(p,T(v));}
/* the words on the data sheet staff hold (Form DD-1), by its measure */
const DD_HOW={count:'Count each one',rate:'Count each one; the sheet works out the rate',duration:'Minutes, start to stop',pdur:'Minutes, start to stop; the sheet works out the share of the time',
  interval:'Mark each interval as the sheet shows',mts:'Look at the end of each interval and mark it',pint:'Mark an interval if it happens at any time in it',wint:'Mark an interval only if it lasts the whole interval',
  trials:'Tally correct / chances',pct:'Tally times / chances',latency:'Seconds from the direction to the start'};
/* two names for the same skill: the same words, or two or more of the longer words in common */
function sameSkill(a,b){const n=x=>T(x).toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();if(!n(a)||!n(b))return false;if(n(a)===n(b))return true;
  const W=x=>new Set(n(x).split(' ').filter(w=>w.length>=4));const A=W(a),B=W(b);let k=0;A.forEach(w=>{if(B.has(w))k++;});return k>=2;}
/* the plan's line that begins with a label, from Form TD-1's step list (v22.46), without the label */
function planLine(plan,re){const st=plan&&Array.isArray(plan.steps)?plan.steps:[];const x=st.find(z=>z&&re.test(T(z.d)));return x?T(x.d).replace(/^[^:]{3,120}:\s*/,''):'';}
function stopConflict(){const f=CASE;if(!f||!f.plan||!f.student||!f.student.stop)return false;const st=Array.isArray(f.plan.steps)?f.plan.steps:[];
  const ee=st.some(x=>/escape extinction|physical guidance/i.test(T(x.grp)))||/escape extinction/i.test(JSON.stringify(f.plan.respond||{}));
  return ee&&!planLine(f.plan,/^The rule staff follow when the student/i);}
function howOf(b){const d=str(b.dim).toLowerCase(),u=T(b.unit);if(/freq|count|rate/.test(d))return 'Count each one';if(/dur/.test(d))return 'Minutes, start to stop';if(/laten/.test(d))return 'Seconds from the direction';if(/percent|%|trial|opportun/.test(d))return 'Tally times / chances';return T(b.dim);}
const uniq=a=>a.filter((x,i)=>x&&a.indexOf(x)===i);
window.__nbhFactsIn=function(f){ensure();PASS=new Set();const p=P();let n=0;
  const pf=f.profile||null,behs=f.behaviors||[],fn=f.fn||null,plan=f.plan||null,cr=f.crisis||null,goals={red:(f.goals&&f.goals.red)||[],acq:(f.goals&&f.goals.acq)||[]},menu=f.menu||[];
  const isRep=b=>!!(b.isRep||/replacement|alternative/i.test(b.type||''));const prob=behs.filter(b=>!isRep(b)),reps=behs.filter(isRep);
  /* v22.48 (review F397) the Who box follows the plan as every other field does: a box still holding what the case placed takes the
     new words; a box rewritten here keeps its words and is offered the plan's new ones (S.changed). */
  {const L=[];if(pf){if(pf.strengths)L.push('Strengths: '+pf.strengths);if(pf.interests)L.push('Likes: '+pf.interests);if(pf.expr||pf.recep)L.push('Communicates: '+[pf.expr,pf.recep].filter(Boolean).join('; '));if(pf.signals)L.push('Shows yes, no and stop: '+pf.signals);if(pf.at)L.push('Uses: '+pf.at);}
    if(menu.length&&window.nbhCase)L.push('Works for: '+nbhCase.menuLine(menu,5));if(L.length&&place('who',L.join('\n')))n++;}
  /* v22.48 (review F389) health and safety from the health record (Form DM-1): the conditions and allergies, an emergency medicine
     by name (never a dose), what a seizure can look like, and the precautions on file; the nurse is added to Who to call */
  const hh=(pf&&pf.health)||{},cond=T(hh.conditions),alg=T(hh.allergies),seiz=/seiz|epilep/i.test(cond),HL=[];
  if(cond)HL.push('Health conditions on record: '+cond.replace(/[.\s]+$/,'')+'. Ask the nurse what to watch for.');
  if(seiz)HL.push('Seizures: follow the nurse’s seizure plan. Staring, going still or falling can be a seizure, not refusal: stay with '+p.obj+', note the time, and call the nurse at once.');
  if(alg)HL.push('Allergies: '+alg.replace(/[.\s]+$/,'')+'.');
  const resc=(hh.meds||[]).filter(m=>m&&/rescue|emergenc|epi-?pen|epinephrine|inhaler|albuterol|diastat|valtoco|nayzilam|midazolam|glucagon/i.test(T(m.name)+' '+T(m.reason)+' '+T(m.times))).map(m=>T(m.name)+(T(m.reason)?' (for '+T(m.reason).toLowerCase()+')':''));
  if(resc.length)HL.push('Emergency medicine on file: '+resc.join(', ')+'. The nurse keeps it and gives it.');
  if(pf&&pf.flags&&(pf.flags.safety||[]).length)HL.push('Precautions on file: '+pf.flags.safety.join(', ')+'.');
  if(HL.length&&place('health',HL.join('\n')))n++;
  /* v21.74 where things stand: the record on Form DD-1 (the last recorded school days), else the levels on the goals (GB-1) */
  const dd=f.data&&(f.data.behaviors||[]).filter(b=>b.days>0);
  /* v22.48 (review F394) where things stand is read within the current phase: the level since it began, with the level before it in
     brackets; the whole window only when the record has one phase */
  if(dd&&dd.length){const tiles=dd.filter(b=>b.kind==='target').slice(0,3).concat(dd.filter(b=>b.kind!=='target').slice(0,1)).slice(0,MAXR.stats);
    const conds=(f.data.conds||[]).filter(c=>c&&c.name),multi=conds.length>1,cur=multi?conds[conds.length-1]:null;
    tiles.forEach((b,i)=>{while(S.stats.length<=i)S.stats.push(row('stats'));
      const pc=b.two||/%/.test(b.unit||''),sfx=pc?'%':'',use=multi&&b.cur&&b.cur.mean!=null?b.cur.mean:b.mean,v=nfmt(use)+sfx;
      const l=String(b.name||'').toLowerCase()+(b.measure==='count'?', a day':pc?', on average':' ('+(b.unit||'')+'), on average')+(multi&&b.base&&b.base.mean!=null?' ('+nfmt(b.base.mean)+sfx+' before)':'');
      if(place('stats.'+i+'.n',v))n++;if(place('stats.'+i+'.label',l))n++;});
    const note=multi&&cur?'Since “'+cur.name+'” began on '+md(cur.from)+' ('+cur.days+' recorded school day'+(cur.days===1?'':'s')+'), from the record on Form DD-1. In brackets: the level before it began.'
      :'Across the last '+f.data.days+' recorded school day'+(f.data.days===1?'':'s')+' ('+md(f.data.from)+' to '+md(f.data.to)+'), from the record on Form DD-1.';
    if(place('statnote',note))n++;}
  else{const cur=goals.red.filter(g=>T(g.cur));cur.slice(0,MAXR.stats).forEach((g,i)=>{while(S.stats.length<=i)S.stats.push(row('stats'));if(place('stats.'+i+'.n',g.cur))n++;if(place('stats.'+i+'.label',g.beh+' now'))n++;});
  if(cur.length&&place('statnote','The levels written on the goals (Form GB-1); the record on Form DD-1 is the source.'))n++;}
  if(plan){const r=plan.respond||{};const seeds=[(plan.antCards||[]).length?'Before it starts: '+plan.antCards.join(', '):'',plan.reinf||plan.pref?'What '+p.sub+' works for: '+(plan.reinf||plan.pref):'',plan.rep?'The request to honor: '+plan.rep:'',r.target?'If the behavior happens: '+r.target:'',r.after?'After it is over: '+r.after:''].filter(Boolean);
    seeds.forEach((s,i)=>{if(S.five[i]&&!T(S.five[i].head)&&place('five.'+i+'.text',s))n++;});}
  /* v22.48 (review F395) When: the setting events and triggers of FS-1's summary statements (on fn.perBehavior in the workstation),
     else TB-1's antecedents */
  const fsB=(f.behaviorsFS||[]).length?f.behaviorsFS:(fn&&Array.isArray(fn.perBehavior)?fn.perBehavior:[]);
  const fsW=uniq(fsB.map(b=>[T(b.se),T(b.ant)].filter(Boolean).join(', and ')));
  const antL=fsW.length?fsW:uniq(behs.map(b=>T(b.ant)));if(antL.length&&place('when',antL.map(x=>cap(x)).join('\n')))n++;
  if(prob.length&&place('may',prob.map(b=>b.label).join('; ')))n++;
  if(fn&&(fn.label||fn.key)&&place('gets',fn.label||fn.key))n++;
  if(plan&&(plan.ant||[]).length)plan.ant.slice(0,6).forEach(a=>{if(placeRow('day','text',a))n++;});
  if(pf&&pf.helps&&placeRow('day','text','What helps: '+pf.helps))n++;
  /* v22.39 (review F461) DM-1's "what to avoid" is a note about the student, not a non-negotiable: it goes with the day, beside What helps;
     rule 1 pairs the plan's own lines (its response, and its "staff do not") */
  if(pf&&pf.avoid&&placeRow('day','text','Avoid: '+pf.avoid))n++;
  /* v22.48 (review F395) the replacement and the skill goals are skills being taught, unless the record (Form DD-1) shows one at its
     aim; a goal's annual objective is not printed as something the student can do; a goal naming a skill already listed is not
     listed again */
  const sk=[];reps.forEach(b=>sk.push({name:b.label,text:b.def}));prob.forEach(b=>{if(b.rep&&!sk.some(s=>sameSkill(s.name+' '+s.text,b.rep)))sk.push({name:b.rep,text:''});});
  goals.acq.forEach(g=>{if(!sk.some(x=>sameSkill(x.name+' '+x.text,g.beh)))sk.push({name:g.beh,text:''});});
  const ddRep=(f.data&&f.data.behaviors||[]).filter(b=>b&&b.kind!=='target');
  sk.slice(0,MAXR.skills).forEach((s,i)=>{while(S.skills.length<=i)S.skills.push(row('skills'));if(T(S.skills[i].name)&&T(S.skills[i].name)!==s.name)return;
    if(place('skills.'+i+'.name',s.name))n++;if(s.text&&place('skills.'+i+'.text',s.text))n++;
    const d=ddRep.find(b=>sameSkill(b.name,s.name+' '+s.text)),pc=d&&(d.two||/%/.test(d.unit||'')),lv=d?(d.cur&&d.cur.mean!=null?d.cur.mean:d.mean):null;
    if(lv!=null&&place('skills.'+i+'.pct',nfmt(lv)+(pc?'%':d.measure==='count'?' a day':'')))n++;
    setIfEmpty('skills.'+i+'.kind',d&&d.aimMet?'':'teach');});
  /* v22.42 (review F388) the tier table in one order of events: the earliest sign and the plan's response to it, the behavior and
     the plan's response, then the handover (the plan's own crisis trigger: from here the crisis plan, Form CR-1, governs, and
     only staff trained and certified in the district's method step in), then the recovery. The crisis plan's stages are not
     poured into the rows the plan already holds, and a stage that names a restraint or a hold never prints on this handout,
     which goes to every adult: it reads "Crisis plan, Form CR-1: trained staff only". */
  const QS_RX=/restrain|restraint|\bhold(s|ing)?\b|immobili[sz]|prone|supine|take-?down|physical (intervention|management)|\btransport/i;
  const cst=cr?(cr.stages||[]).filter(s=>s&&T(s.s)):[],tierRow=k=>{while(S.tiers.length<=k&&S.tiers.length<MAXR.tiers)S.tiers.push(row('tiers'));return !!S.tiers[k];};
  const HAND='From here the crisis plan (Form CR-1) governs. Make the crisis call on Who to call. Only staff trained and certified in the district’s method step in; everyone else moves the other students away and keeps calling.';
  if(plan){const r=plan.respond||{},pr=plan.prec||(cr&&cr.precursor);
    if((pr||r.prec)&&place('tiers.0.name','0 · Earliest sign'))n++;if(pr&&place('tiers.0.see',pr))n++;if(r.prec&&place('tiers.0.do',r.prec))n++;if(pr||r.prec)setIfEmpty('tiers.0.kind','sign');
    if((plan.beh||r.target)&&place('tiers.1.name','1 · The behavior'))n++;if(plan.beh&&place('tiers.1.see',plan.beh))n++;if(r.target&&place('tiers.1.do',r.target))n++;if(plan.beh||r.target)setIfEmpty('tiers.1.kind','tier');
    let k=2;if(T(r.crisis)||cst.length){if(tierRow(2)){if(place('tiers.2.name','2 · The crisis plan governs'))n++;setIfEmpty('tiers.2.kind','hand');setIfEmpty('tiers.2.train','yes');
      const trig=T(r.crisis)&&!(T(r.crisis).length<80&&/CR-1|crisis (intervention )?plan/i.test(r.crisis))?T(r.crisis):T(cr&&(cr.dbeh||cr.beh));
      if(trig&&place('tiers.2.see',QS_RX.test(trig)?trig.split(/[→;]|->/)[0].trim():trig))n++;if(place('tiers.2.do',HAND))n++;}k=3;}
    if(r.after&&tierRow(k)){if(place('tiers.'+k+'.name','Recovery'))n++;if(place('tiers.'+k+'.do',r.after))n++;setIfEmpty('tiers.'+k+'.kind','rec');}}
  else if(cst.length){if(cr.precursor&&place('tiers.0.see',cr.precursor))n++;
    if(cr.precursor)setIfEmpty('tiers.0.kind','sign');
    cst.slice(0,MAXR.tiers-1).forEach((s,i)=>{const k=i+1;if(!tierRow(k))return;if(place('tiers.'+k+'.name',s.s))n++;
      const rx=QS_RX.test(T(s.do)+' '+T(s.s)+' '+T(s.who)),d=rx?'Crisis plan, Form CR-1: trained staff only.':T(s.do)+(T(s.who)?' ('+T(s.who)+')':'');if(place('tiers.'+k+'.do',d))n++;
      setIfEmpty('tiers.'+k+'.kind',/recover|post-?crisis/i.test(T(s.s))?'rec':/peak|crisis|imminent|danger/i.test(T(s.s))?'hand':/prevent|before any sign/i.test(T(s.s))?'':'tier');if(rx)setIfEmpty('tiers.'+k+'.train','yes');});}
  if(plan){const r=plan.respond||{};
    /* v21.87 the plan's Never once: it went into a new Don't row each time the case arrived (until the list was full) once
       DM-1's What to avoid held rule 1 */
    /* v22.48 (review F390) a "staff do not" that lists No-s reads as a double negative in the Don't column ("Don't: No break"): it is
       placed as the things not to do */
    const notL=T(r.not)&&/^no\s/i.test(T(r.not))?'Any of these: '+T(r.not).replace(/[.\s]+$/,'').split(/\s*[,;]\s*|\s+or\s+/).map(x=>x.replace(/^(and\s+)?no\s+/i,'')).filter(Boolean).join(', ')+'.':T(r.not);
    if(notL&&!S.rules.some((x,i)=>T(x.dont)===notL||T(S.pulled['rules.'+i+'.dont'])===notL)){if(!T(S.rules[0].dont)?place('rules.0.dont',notL):placeRow('rules','dont',notL))n++;}if(r.target&&place('rules.0.do',r.target))n++;}
  /* v22.48 (review F394) the record table is the data sheet staff hold: Form DD-1's rows, its words for how; TB-1's definitions say
     what counts. A row placed from TB-1 and never touched goes when DD-1 does not count it. Without DD-1, TB-1's targets as before. */
  const ddAll=(f.data&&f.data.behaviors||[]).filter(b=>b&&T(b.name));
  if(ddAll.length){const defOf=nm=>{const b=behs.find(x=>T(x.label).toLowerCase()===T(nm).toLowerCase())||behs.find(x=>sameSkill(x.label,nm));return b?T(b.def):'';};
    S.rec.forEach((r,i)=>{const m=T(r.measure);if(!m||!isPulled('rec.'+i+'.measure')||ddAll.some(b=>T(b.name).toLowerCase()===m.toLowerCase()))return;
      if(['counts','how'].every(fl=>!T(r[fl])||isPulled('rec.'+i+'.'+fl))){ROW.rec.forEach(fl=>{r[fl]='';delete S.pulled['rec.'+i+'.'+fl];delete S.changed['rec.'+i+'.'+fl];});}});
    ddAll.forEach(b=>{let i=S.rec.findIndex(r=>T(r.measure).toLowerCase()===T(b.name).toLowerCase());if(i<0){i=blankRow('rec');if(i<0)return;if(place('rec.'+i+'.measure',b.name))n++;}
      const d=defOf(b.name);if(d&&place('rec.'+i+'.counts',d))n++;if(place('rec.'+i+'.how',DD_HOW[b.measure]||'As on the data sheet (Form DD-1)'))n++;});}
  else prob.concat(reps).forEach(b=>{if(S.rec.some(r=>T(r.measure).toLowerCase()===T(b.label).toLowerCase()))return;const i=blankRow('rec');if(i<0)return;if(place('rec.'+i+'.measure',b.label))n++;if(place('rec.'+i+'.counts',b.def))n++;if(place('rec.'+i+'.how',isRep(b)?'Tally times / chances':howOf(b)))n++;});
  /* v22.48 (review F395) GB-1's criterion count is no longer placed as a first-weeks step ("Next: 3") */
  /* v22.48 (review F391) Who to call from the case, in the order an adult needs them: the administrator or front office (someone on site
     who runs the crisis response; the school writes the name), the nurse when the health record lists a condition, the parent from
     Form DM-1 (no phone number printed: the school's records have it), and the case BCBA. The administrator's card is the crisis call
     until the BCBA chooses another. */
  const hasCall=re=>S.calls.some(c=>re.test(T(c.role)));
  const addCall=(role,name,when)=>{const i=blankRow('calls');if(i<0)return false;place('calls.'+i+'.role',role);if(name)place('calls.'+i+'.name',name);return place('calls.'+i+'.when',when);};
  if(!hasCall(/admin|front office|principal|crisis/i)&&addCall('Administrator or front office','','The crisis tier: someone on site who runs the school’s crisis response. The same day after any hold or injury.'))n++;
  if(!T(S.callCrisis)){const c=S.calls.find(x=>/admin|front office|principal|crisis/i.test(T(x.role)));if(c)S.callCrisis=T(c.role);}
  if(cond&&!hasCall(/nurse/i)&&addCall('School nurse','','Any health concern; at once for '+(seiz?'a possible seizure, ':'')+'an injury, or a question about medicine.'))n++;
  const hm=pf&&pf.home;if(hm&&T(hm.name)&&!S.calls.some(c=>T(c.name)===T(hm.name))&&addCall('Parent'+(T(hm.rel)?' ('+T(hm.rel)+')':''),T(hm.name),'The daily note'+(T(hm.pref)?' ('+T(hm.pref).toLowerCase()+')':'')+'. After a hold or an injury the parent is told the same school day, by the person the school names.'))n++;
  if(T(S.meta.bcba)&&!S.calls.some(c=>T(c.name)===T(S.meta.bcba))){const i=blankRow('calls');if(i>=0){place('calls.'+i+'.role','Case BCBA');place('calls.'+i+'.name',S.meta.bcba);if(place('calls.'+i+'.when','After any serious incident, and for questions'))n++;}}
  /* v22.48 (review F392) the request and what honoring it gives, from the plan (Form TD-1's request card) */
  const rq=plan&&plan.request;if(rq&&T(rq.name))setIfEmpty('askName',(S.skills.find(x=>sameSkill(T(x.name)+' '+T(x.text),rq.name))||{}).name||'');
  if(!T(S.askName)&&reps.length)setIfEmpty('askName',(S.skills.find(x=>sameSkill(T(x.name),reps[0].label))||{}).name||'');
  if(rq&&(T(rq.reinf)||T(rq.thin))){const hl=[T(rq.reinf)?'Give it: '+T(rq.reinf).replace(/^e\.g\.,?\s*/i,'').replace(/[.\s]+$/,'')+'.':'',T(rq.thin)?'The plan builds in waiting ('+T(rq.thin).replace(/[.\s]+$/,'')+'): give the wait the BCBA has set for now, then the break.':''].filter(Boolean);
    if(hl.length&&place('flowHonor',hl.join(' ')))n++;}
  /* v22.48 (review I197) when the student says stop: how (the assent plan, Form SI-1) and what every adult does, from the assent plan
     or the plan's own lines (Form TD-1) */
  const sto=f.student&&f.student.stop,SL=[];
  if(sto&&T(sto.signs))SL.push('How '+p.sub+' says it: '+T(sto.signs).replace(/[.\s]+$/,'')+'.');
  const wd=sto&&T(sto.steps)||planLine(plan,/^If the student withdraws assent/i);if(wd)SL.push('What you do: '+wd.replace(/[.\s]+$/,'')+'.');
  const nr=planLine(plan,/^The rule staff follow when the student/i);if(nr)SL.push('When '+p.pos+' stop is also the behavior: '+nr.replace(/[.\s]+$/,'')+'.');
  if(SL.length&&place('stop',SL.join('\n')))n++;
  /* v22.48 (review I199) each adult's part: the people trained on this plan (Form ST-1), named with their role */
  const ppl=f.staff&&Array.isArray(f.staff.people)?f.staff.people:[];
  ppl.forEach(x=>{const who=T(x.name)+(T(x.role)?', '+T(x.role):'');if(!T(x.name)||S.parts.some(r=>T(r.who)===who))return;const i=blankRow('parts');if(i<0)return;if(place('parts.'+i+'.who',who))n++;setIfEmpty('parts.'+i+'.trained',x.met?'yes':'');});
  caseState(f);renderEditor();buildSoon(0);return {filled:n};};
window.__nbhFactsPick=function(sel){ensure();PASS=new Set();let n=0;const notes=[];
  const isRep=b=>!!(b.isRep||/replacement|alternative/i.test(b.type||''));
  (sel.behaviors||[]).forEach(b=>{if(isRep(b)){if(S.skills.some(s=>T(s.name).toLowerCase()===T(b.label).toLowerCase())){notes.push(b.label+' is already a skill');return;}const i=blankRow('skills');if(i<0){notes.push('the skills are full');return;}place('skills.'+i+'.name',b.label);place('skills.'+i+'.text',b.def);n++;}
    else{if(S.rec.some(r=>T(r.measure).toLowerCase()===T(b.label).toLowerCase())){notes.push(b.label+' is already recorded');return;}const i=blankRow('rec');if(i<0){notes.push('the record table is full');return;}place('rec.'+i+'.measure',b.label);place('rec.'+i+'.counts',b.def);place('rec.'+i+'.how',howOf(b));n++;}});
  ((sel.goals&&sel.goals.red)||[]).forEach(g=>{if(T(g.cur)){const i=blankRow('stats');if(i>=0){place('stats.'+i+'.n',g.cur);place('stats.'+i+'.label',g.beh+' now');n++;}}});
  ((sel.goals&&sel.goals.acq)||[]).forEach(g=>{if(S.skills.some(s=>sameSkill(T(s.name)+' '+T(s.text),g.beh)))return;const i=blankRow('skills');if(i<0)return;place('skills.'+i+'.name',g.beh);setIfEmpty('skills.'+i+'.kind','teach');n++;});
  if(sel.fn&&(sel.fn.label||sel.fn.key)&&place('gets',sel.fn.label||sel.fn.key))n++;
  /* v22.48 (review F397) a picked line is added; the box is recorded as the plan's words only when it held them unchanged before */
  if((sel.menu||[]).length){const line='Works for: '+sel.menu.map(m=>m.name).join(', ');if(T(S.who).indexOf(line)<0){const was=isPulled('who')||!T(S.who);S.who=[T(S.who),line].filter(Boolean).join('\n');if(was)S.pulled.who=S.who;n++;}}
  renderEditor();buildSoon(0);return {filled:n,note:notes.join('; ')};};

/* v21.74 out: the non-negotiables (for Form TI-1's checklist) and the tiers (for Form DD-1's incident log) */
/* v22.48 (review F390) a row that still holds the plan's words unreviewed goes out marked draft: Form TI-1 does not take it as a step */
window.__nbhFactsOut=function(){try{ensure();const dr=(k,i)=>ROW[k].some(fl=>isPulled(k+'.'+i+'.'+fl)||T(S.changed[k+'.'+i+'.'+fl]));
  const rules=S.rules.map((r,i)=>({r,i})).filter(x=>ROW.rules.some(fl=>!CHOICE[fl]&&T(x.r[fl]))).map(x=>{const o={do:T(x.r.do),dont:T(x.r.dont)};if(dr('rules',x.i))o.draft=true;if(T(x.r.train)==='yes')o.trained=true;return o;});
  const tiers=S.tiers.map((r,i)=>({r,i})).filter(x=>ROW.tiers.some(fl=>!CHOICE[fl]&&T(x.r[fl]))).map(x=>{const o={name:T(x.r.name),see:T(x.r.see),do:T(x.r.do),say:T(x.r.say),kind:tierKind(x.r)};if(dr('tiers',x.i))o.draft=true;if(T(x.r.train)==='yes')o.trained=true;return o;});   /* v21.77 the words to say too (Form TV-1's tiers) */
  return rules.length||tiers.length?{quick:{rules,tiers,draft:draftN(),src:'QS-1'}}:null;}catch(e){return null;}};

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(allText()&&!(await nbhUI.confirm('Load a simulated case?\nA worked example fills every page. Anything already entered will be replaced.',{ok:'Load'})))return;
  const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+7);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()+1);
  const iso=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  S=blank();
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',school:'Lincoln Elementary, Riverside USD (simulated)',bcba:'Jordan Ellis, BCBA (simulated)',program:'Room 12 · Lincoln Elementary (simulated)',first:'Sam',pron:'he',start:iso(d),plan:'his behavior intervention plan of August 2026 (simulated)',issued:iso(new Date()),issueNo:'2'};
  S.changes='Throwing no longer leads to a break: the task stays, smaller (tier 2)\nThe hand-raise wait grows on his data, not by the week';
  S.holders='Ms. Lee, classroom teacher (simulated): issue 2\nMr. Ortiz, paraeducator (simulated): issue 2\nMs. Grant, music teacher (simulated): issue 1, to collect';
  S.who='Nine, in fourth grade; his third year at Lincoln.\nFunny, quick with numbers, proud of being the class helper.\nKnows every adult’s name and job; he will know yours in a day.\nWorks for adult attention, a job or errand, the class computer, and time with Mr. Ortiz.\nReads above grade level; writing by hand is the hardest thing he is asked to do.';
  S.goal='His own goal: to run the morning announcements.';
  S.stats=[{n:'0.4',label:'leaving the room, a day'},{n:'1',label:'throwing materials, a week'},{n:'92%',label:'asks for a break instead'}];
  S.statnote='Across the last 20 recorded school days (Form DD-1). The hardest stretch was the first month of the plan; it has held for six weeks.';
  S.five=[{head:'The break card is the plan.',text:'He holds it up, you say yes at once, every time, even the third time in an hour. Two minutes at the back table, then back to the task.'},
    {head:'Attention is his currency.',text:'About four positives to every correction; almost none for calling out or arguing. A big reaction is what the behavior is for.'},
    {head:'Shorten the writing, not the thinking.',text:'Any task that needs a page of handwriting gets a choice: half the page, the computer, or telling it to an adult first.'},
    {head:'Preview every change.',text:'Substitutes, assemblies, a different seat: “Something is different today. Everything else is the same.”'},
    {head:'A hard day is not a failed plan.',text:'Record it, tell the BCBA the same day, and run the same plan tomorrow. The day after a hard day has usually been at or near zero.'}];
  S.when='He gets a writing task longer than half a page, a correction in front of the class, or a change nobody previewed.';
  S.may='Push the work away, argue, throw the materials, or leave the room.';
  S.gets='Out of the writing, and a long conversation with an adult.';
  S.health='Asthma: his inhaler is kept in the office (the nurse gives it), and he knows when he needs it. No food allergies. Supervision: an adult within sight in the hallway and at dismissal.';
  S.day=[{head:'Arrival',text:'Mr. Ortiz meets him at the door. Same first job daily: attendance folder to the office, then the schedule and the point sheet at his desk.'},
    {head:'Any writing task',text:'Show the choice before the task: half the page, the computer, or say it first. Praise the start within a minute.'},
    {head:'All day',text:'A word to him every ten to fifteen minutes: his name, a comment on his work. Say what he is earning at every block.'},
    {head:'The job',text:'An errand at 10:30, earned by a reasonably good morning, not a perfect one.'},
    {head:'Lunch and recess',text:'Sits with the two friends he picked; an adult checks in once, not more. Recess ends with a two-minute warning.'},
    {head:'The last hour',text:'The lowest-demand block of the day, a check-in at 2:15, and the computer time he earned before the bus.'}];
  S.spotHead='Back from recess';S.spotText='The hardest transition of his day. Two-minute warning, then one instruction at the door: “Hands washed, then the reading folder.” Wait ten seconds before saying anything else. He settles once the folder is open.';
  S.chips='One instruction, then wait\n“Hands on the desk,” not “Stop that”\nNo sarcasm\nAnswer once';
  S.talk=[{sit:'A change is coming',say:'“Sam, something is different today. Ms. Lee is out. Everything else is the same.”',not:'A long explanation.'},
    {sit:'“This is stupid. I’m not doing it.”',say:'“Half the page or the computer?”',not:'“Then you’ll miss recess.”'},
    {sit:'He asks for a break',say:'“Yes. Two minutes or three?” Set the timer.',not:'“After you finish this.”'},
    {sit:'The timer ends',say:'“Timer’s done. First the two problems, then your job.”',not:'“Are you ready to come back?” (a question invites no)'},
    {sit:'He has a good moment',say:'“You started right away. That’s the plan.”',not:'“Good job.” (too vague to teach)'}];
  /* v22.48 (review F396) the worked example: the hand-raise wait grows on his data, not by the calendar */
  S.skills=[{name:'Asking for a break',pct:'92%',text:'Holds up the card or says “break.” Say yes at once, set a visible timer, little talk. Praise the ask and the return.',kind:''},
    {name:'Getting attention well',pct:'80%',text:'Raises his hand and waits. Answer within seconds at first; when he waits well on 8 of 10 chances for 3 days running, wait 10 seconds longer.',kind:'teach'},
    {name:'The point sheet',pct:'Plan, App. C',text:'Start right away, Hands to self, Stay with the class: daily goals 90%, 90%, 100%. He rates first, then you. Never remove a point he earned.',kind:''}];
  S.newline='Expect “I don’t want to.” Offer two choices or “Try it for two minutes?”, then praise the try.';
  S.read=[{name:'Upset',signs:'slumped, quiet, eyes down, asks the same worried question twice',do:'short and warm. Name the feeling once, offer the card, praise him for telling you, back to the plan.'},
    {name:'Testing',signs:'grinning, watching your face, what-if questions',do:'brief and neutral. One flat correction, almost no conversation, redirect to what he is earning.'}];
  S.readnote='When in doubt, go brief and neutral first, and offer the conversation once he is calm.';
  /* v22.48 (review F396) throwing does not buy a break: the task stays, smaller, and the card stays the better deal; each row has its
     kind, and the handover is for trained staff */
  S.tiers=[{name:'0 · Earliest sign',see:'Pushes the paper away, head down, the same question again.',do:'Move closer and keep teaching. Restate the expectation and what he is earning, once. Offer the card or a choice.',say:'“Do you need a break? Two minutes or three?”',kind:'sign',train:''},
    {name:'1 · Refusing',see:'Arguing, “no,” calling out, still in his seat.',do:'Ignore the words; keep teaching the class. One neutral correction, then praise the next right thing within seconds.',say:'“Hands on the desk. Half the page or the computer?”',kind:'tier',train:''},
    {name:'2 · Throwing',see:'Throws the materials, leaves his seat, slams the desk.',do:'Move the other students’ attention, not him. Keep the task going, smaller (half the page, or the computer), and offer the card once. No break for throwing. Write it up the same day.',say:'“That is not safe. Half the page or the computer? The card is right here.”',kind:'tier',train:''},
    {name:'3 · Leaving the room',see:'Out of the door without permission.',do:'One adult follows at a distance and keeps him in sight; the other stays with the class and makes the crisis call. Nobody chases or blocks the hallway.',say:'“I’m here when you are ready. The office knows where we are.”',kind:'hand',train:'yes'},
    {name:'Recovery',see:'Calm for a few minutes; often says sorry.',do:'A brief practice of the ask, then a neutral return to the same task. No lecture. Praise the first appropriate thing. Tell the parent the good part of the day too.',say:'“You’re calm. Let’s get back to the reading folder.” An apology gets “Thank you.”',kind:'rec',train:''}];
  S.stop='How he says it: “stop,” “I’m done,” or the red card.\nWhat you do: say “Okay,” stop the task, and offer the two cards (a different task, or a break). If he takes neither within a minute, end the session and tell the BCBA the same day.';
  S.mustknow='A hard day is reported the same day, to the BCBA and the parent: nobody carries it alone, and nobody debates it with Sam.';
  /* v22.48 (review F396) no consequence box in the worked example: the plan has none, and nothing earned is taken away */
  S.rules=[{do:'One sentence of rule for a what-if, once, then redirect',dont:'Debate consequences during an escalation'},
    {do:'If the plan says call, call, without announcing it',dont:'Sarcasm, or “If you ___, we’ll call ___”'},
    {do:'Keep every point he has earned',dont:'Remove or threaten earned points'},
    {do:'A break from the card: an adult nearby and a timer',dont:'Leave him alone in the hallway'},
    {do:'The job, the computer, Mr. Ortiz: after calm and the task',dont:'Use them to end a behavior in progress'},
    {do:'Move the other students’ attention',dont:'Hold him, grab him or block the door',train:''}];
  S.rec=[{measure:'Leaving the room',counts:'Out of the door without permission, any distance',how:'Count; where he went and who followed'},
    {measure:'Throwing materials',counts:'Any object thrown or swept off the desk',how:'Count; what and at whom'},
    {measure:'Refusing',counts:'Arguing or “no” that stops instruction for a minute or more',how:'Count'},
    {measure:'Asks for a break well',counts:'Uses the card or the word, and returns within three minutes',how:'Tally times / chances'},
    {measure:'Point sheet',counts:'Points earned on each of the three expectations',how:'His and your ratings; daily %'},
    {measure:'ABC note',counts:'Each tier 2 or 3 event: what came before, his words, what adults did, how it ended',how:'Written the same day'}];
  S.recnote='The first day with the new team is the next row of his record: same counts, same sheet, no fresh start to the count.';
  S.phases=[{head:'1 · Model',when:'days 1–3',text:'Mr. Ortiz models each step; the new adult gives the praise.',next:'2 days running: no tier 3, 80% of points'},
    {head:'2 · Hand over',when:'days 3–7',text:'The new adult runs it all; Mr. Ortiz at arrival, dismissal and on call.',next:'3 days, no tier 3, no more than one tier 2 a day'},
    {head:'3 · On their own',when:'weeks 2–4',text:'The team runs the plan; the BCBA observes twice a week.',next:'5 days in a row on the point-sheet goals'},
    {head:'4 · Expand',when:'week 4 on',text:'One new setting or adult at a time, previewed first.',next:'each addition holds two weeks without a tier 3'}];
  S.calls=[{role:'Administrator',name:'',when:'The crisis call; calls the parent the same day'},{role:'Classroom teacher',name:'',when:'Daily lead for the plan'},{role:'Paraeducator (Mr. Ortiz)',name:'',when:'Tier 2, the data, the checks'},{role:'Parent',name:'Ms. Alvarez (simulated)',when:'Daily home note; the same day after a tier 3'},{role:'Case BCBA',name:'Jordan Ellis, BCBA (simulated)',when:'After any tier 3, and for questions'}];
  S.callCrisis='Administrator';
  S.parts=[{who:'Ms. Lee, teacher (simulated)',part:'Leads in class: the choices, the praise, the point sheet, the daily note.',trained:'yes'},
    {who:'Mr. Ortiz, para (simulated)',part:'Arrival, the job, the breaks, the data sheet; follows at tier 3.',trained:'yes'},
    {who:'Specials teachers',part:'The five things and the rules; honor the card; call the office at tier 3.',trained:''}];
  S.askName='Asking for a break';S.flowHonor='Give it: two minutes at the back table with a visible timer, little talk. While he is learning to wait, the timer starts after the wait the BCBA has set for now.';S.flowThen='“Timer’s done. First the two problems, then your job.” Praise the return.';
  S.onevoice='During an escalation one adult speaks; the others move the class on and stay quiet. A handover is said out loud: “Mr. Ortiz has it now.”';
  S.flowOn='yes';S.checkOn='yes';S.pulled={};S.changed={};S.ok={};
  renderEditor();build();setView('out');
  nbhUI.toast('Simulation loaded: a worked quick start for a simulated student, four pages, the flow sheet and the reading check.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

/* ---------------- start ---------------- */
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
ensure();renderEditor();build();
