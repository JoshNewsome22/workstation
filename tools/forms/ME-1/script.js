const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:null;};
const T=v=>String(v==null?'':v).trim();
const NONE='–';

/* ---- a row can be deleted anywhere (the workstation's pattern, v21.33) ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ================= v25.78 (the BCBA, 11/11) the medical event record =================
   One entry for each medical event that needed more than routine care. Every event has the same parts (what happened, what
   was done at school, the medical care, who was told, the return to school, the report question, what was changed, the
   follow-up, the photos and papers); the kind of event adds its own questions. Nothing here is a clinical judgment or a
   decision aid: it is written after the event. */
const KINDS=[['','Choose the kind of event'],['ing','Something swallowed that is not food'],['sz','Seizure'],['inj','Injury'],['alg','Allergic reaction'],['br','Choking or trouble breathing'],['ill','Illness or another medical problem'],['oth','Other']];
const KSHORT={ing:'Swallowed item',sz:'Seizure',inj:'Injury',alg:'Allergic reaction',br:'Choking or breathing',ill:'Illness',oth:'Other'};
const KPART={ing:'What Was Swallowed',sz:'The Seizure',inj:'The Injury',alg:'The Reaction',br:'The Choking or Breathing Trouble',ill:'The Illness'};
const YN=[['','–'],['y','Yes'],['n','No']];
const YNU=[['','–'],['y','Yes'],['n','No'],['u','Not known']];
const CARE=[['','–'],['none','First aid only'],['nurse','School nurse only'],['doctor','Doctor or urgent care'],['er','Emergency room'],['adm','Admitted to the hospital']];
const CAREN=Object.fromEntries(CARE);
const TRANS=[['','–'],['amb','Ambulance'],['parent','Parent or guardian'],['other','Another way (say how, under What happened)'],['na','Did not leave school']];
const PLAN=[['','–'],['y','Yes'],['part','In part'],['n','No'],['none','No plan on file']];
const DIST=[['','–'],['y','Yes'],['notyet','Not yet'],['nr','Not required']];
const REP=[['','Not answered'],['no','No: nothing gives a reason to suspect abuse or neglect'],['yes','Yes: a report is being made']];
const SRC=[['','–'],['staff','A reinforcer or sensory item given by staff'],['class','Classroom or therapy material'],['found','Found on the floor or the ground'],['home','Brought from home'],['unk','Not known'],['other','Somewhere else']];
const USUAL=[['','–'],['usual','Like this student’s usual seizures'],['longer','Longer than usual'],['diff','Different from usual'],['first','The first known seizure'],['unk','Not known']];
const INJK=[['','–'],['fall','A fall'],['struck','Struck by or against something'],['sib','Self-injury'],['peer','Another student'],['hold','During a restraint or a transport'],['play','Sports or play'],['unseen','Not seen'],['other','Something else']];
const ATTK=[['paper','Discharge papers'],['note','Doctor’s note or clearance'],['item','Photo of the item'],['student','Photo of the student (an injury)'],['other','Other']];
const ATTKN=Object.fromEntries(ATTK);
const CONS={ic1:'Yes, on Form IC-1',other:'Yes, other written consent',no:'No'};
/* each field: key, label, kind of box ('' a line, 'ta' a box, 'd' a date, 't' a time, 'sel' a list), the list */
const P_WHAT=[['date','Date','d'],['time','Time','t'],['where','Where (room, playground, bus)'],['doing','What the student was doing'],
  ['what','What happened: what was seen and done, in the order it happened','ta'],['seen','Was it seen to happen?','sel',YNU],['noticed','Who saw it, or noticed it first (name, role)'],['present','Other adults present']];
const P_KIND={
  ing:[['ingWhat','What was swallowed (the item and what it is made of)'],['ingCount','How many'],['ingSize','About how big each one is'],['ingSource','Where the item came from','sel',SRC],['ingSourceNote','More about where it came from'],
    ['ingPoison','Poison Control called (1-800-222-1222)','sel',YN],['ingPoisonNote','What Poison Control said'],['ingPassed','Passed, or cleared by the doctor (date, and who said so)']],
  sz:[['szStart','Started at','t'],['szEnd','Ended at','t'],['szDur','How long it lasted, in minutes (when the times are not known)'],['szLook','What it looked like','ta'],['szAware','Did the student respond during it?','sel',YNU],
    ['szUsual','Compared with this student’s seizures','sel',USUAL],['szRescue','Rescue medicine given','sel',YN],['szRescueMed','Which medicine, and how much'],['szRescueTime','Given at','t'],['szRescueBy','Given by (name, role)'],['szRecover','Afterwards: how the student was, and for how long','ta']],
  inj:[['injPart','Part of the body'],['injKind','How it happened','sel',INJK],['injHow','More about how it happened'],['injHead','A blow to the head','sel',YNU],['injLOC','Lost consciousness','sel',YNU],['injLook','What the injury looked like','ta']],
  alg:[['algTrigger','What set it off (food, sting, medicine), if known'],['algSigns','What was seen (hives, swelling, breathing, vomiting)','ta'],['algEpi','Epinephrine given','sel',YN],['algEpiTime','Given at','t'],['algEpiBy','Given by (name, role)']],
  br:[['brWhat','What it was (food, an object, asthma)'],['brAction','What was done (back blows, abdominal thrusts, inhaler)','ta'],['brBy','Done by (name, role)'],['brAfter','Afterwards: breathing, color, speech']],
  ill:[['illSigns','What was seen (fever, vomiting, pain, a change in alertness)','ta'],['illTemp','Temperature, if taken']],
  oth:[]};
const P_DID=[['firstAid','First aid given at school, and by whom','ta'],['nurseSeen','Seen by the school nurse','sel',YN],['nurseWho','Nurse (name)'],['nurseTime','Seen at','t'],['nurseNote','What the nurse found and did','ta'],
  ['emsCalled','911 called','sel',YN],['emsTime','Called at','t'],['emsBy','Called by (name, role)'],['planFollowed','The student’s health plan was followed','sel',PLAN],['planNote','More about the plan (what was done, what could not be)']];
const P_CARE=[['care','Care needed','sel',CARE],['transport','How the student got there','sel',TRANS],['facility','Where (hospital, clinic)'],['leftAt','Left school at','t'],['dischAt','Discharged or sent home (date, time)'],
  ['dx','What the doctor said (in the doctor’s words, or the papers’ words)','ta'],['instr','Discharge instructions','ta'],['tx','Medicine or treatment given or prescribed'],['restrict','Limits on activity, diet or anything else'],['fuAppt','Follow-up appointment (with whom, when)']];
const P_TOLD=[['parWho','Parent or guardian told (who)'],['parWhen','When'],['parHow','How (phone, in person, message)'],['admWho','Administrator told (who)'],['admWhen','When'],['bcbaWhen','BCBA told (when)'],
  ['distRep','The school’s or agency’s own incident report made','sel',DIST],['distWhen','When'],['distNo','Its number, or where it is filed'],['othTold','Others told (teacher, bus, therapists)']];
const P_BACK=[['retDate','Back at school (date)','d'],['clrNeed','A doctor’s clearance is needed to return','sel',YN],['clrGot','Clearance received (date, from whom)'],['retRestrict','Limits on return (activity, diet, supervision)'],['staffTold','Staff told of the limits (who, when)']];
const P_REP=[['repNeed','Does anything give a reason to suspect abuse or neglect?','sel',REP],['repWhen','Report made (date and time)'],['repTo','To whom (and the reference number)'],['repBy','By whom']];
const P_AFTER=[['cause','What may have contributed','ta'],['changes','What was changed (items removed, supervision, the plan)','ta'],['flagsRev','Form DM-1’s safety precautions looked at again (date)']];
const P_BY=[['by','Written by (name)'],['byRole','Role']];
const PARTS=[['What Happened',P_WHAT],['kind',null],['What Was Done at School',P_DID],['Medical Care',P_CARE],['Who Was Told',P_TOLD],['Back at School',P_BACK],['Does This Need a Report?',P_REP],['After the Event',P_AFTER],['Written by',P_BY]];
const ALLF=[].concat(P_WHAT,...Object.values(P_KIND),P_DID,P_CARE,P_TOLD,P_BACK,P_REP,P_AFTER,P_BY);
const FKEYS=ALLF.map(f=>f[0]);
const SELOK=Object.fromEntries(ALLF.filter(f=>f[2]==='sel').map(f=>[f[0],f[3].map(o=>o[0])]));
/* what else is worth opening after each kind of event */
const NEXT={
  ing:['Form DM-1, Safety Precautions: tick <b>Pica / mouthing non-food items</b> and <b>Choking risk</b> if they now apply, so every adult sees them.','Form PA-1: look at the item pool again and take out anything small enough to swallow.','Form TD-1, protocol bank: the <b>pica safety checklist</b> (scan each room before the student goes in) and the cards that block pica at the first touch.','If it was eaten on purpose and has happened before, define it on Form TB-1 and count it on Form DD-1.'],
  sz:['Form DM-1: the seizure disorder under the health record, <b>Medical emergency risk</b> under Safety Precautions, and the seizure action plan on file.','Form CR-1: any restraint position that is unsafe for this student, with the nurse.','Form MS-1, if a medicine was started or changed.'],
  inj:['Form IM-1, if the injury came from self-injury.','Form CR-1 and its restraint log, if it happened during a restraint or a transport.','Form DD-1’s incident log, if a behavior led to it.'],
  alg:['Form DM-1: the allergy under the health record, and who holds the epinephrine.','Form PA-1 and Form FD-1: take the food out of every list.'],
  br:['Form DM-1, Safety Precautions: <b>Choking risk / food stuffing</b>.','Form FD-1, if it happened at a meal: the texture and bite-size order, with the speech-language pathologist.'],
  ill:['Form MS-1, if a medicine may be involved.'],oth:[]};

/* ---------------- state ---------------- */
const uid=()=>'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const evBlank=()=>{const o={id:uid(),kind:'',rec:'',tasks:[],att:[]};FKEYS.forEach(k=>{o[k]='';});return o;};
function blank(){return{meta:{},chk:{},events:[]};}
let S=blank(),CUR=-1,CASE={note:''},PH_PRINT=false;
function ensure(){
  ['meta','chk'].forEach(k=>{if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={};});
  if(!Array.isArray(S.events))S.events=[];
  S.events.forEach(e=>{if(!e.id)e.id=uid();if(!Array.isArray(e.tasks))e.tasks=[];if(!Array.isArray(e.att))e.att=[];FKEYS.forEach(k=>{if(typeof e[k]!=='string')e[k]='';});});
  if(CUR>=S.events.length)CUR=S.events.length-1;
}
/* dates as the sheets write them (M/D/YYYY, M/D/YY) or ISO; times as 10:42, 10:42 AM, 2:05pm, 14:05 */
function pDate(s){s=T(s);let m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[1]-1,+m[2],12);}
  m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3],12);return null;}
function pTime(s){const m=/^(\d{1,2})(?:[:.](\d{2}))?(?:[:.]\d{2})?\s*([ap])?\.?m?\.?$/i.exec(T(s));if(!m)return null;let h=+m[1];const mi=+(m[2]||0),ap=(m[3]||'').toLowerCase();
  if(h>23||mi>59)return null;if(ap){if(h<1||h>12)return null;h=h%12+(ap==='p'?12:0);}return h*60+mi;}
const MDY=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
const today=()=>MDY(new Date());
const nowT=()=>{const d=new Date();let h=d.getHours();const ap=h<12?'AM':'PM';h=h%12||12;return h+':'+String(d.getMinutes()).padStart(2,'0')+' '+ap;};
const iso=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';
const opts=(a,v)=>a.map(o=>`<option value="${esc(o[0])}"${o[0]===v?' selected':''}>${esc(o[1])}</option>`).join('');
const optName=(list,v)=>{const o=list.find(x=>x[0]===v);return o&&v?o[1]:'';};
/* when the event happened: its date with its time, or the end of that day when no time was written (so an entry is
   marked late only when it surely is) */
function evWhen(e){const d=pDate(e.date);if(!d)return null;const t=pTime(e.kind==='sz'&&T(e.szStart)?e.szStart:e.time);const w=new Date(d);if(t==null)w.setHours(23,59,0,0);else w.setHours(Math.floor(t/60),t%60,0,0);return w;}
function isLate(e){const w=evWhen(e),r=Date.parse(e.rec||'');return !!w&&isFinite(r)&&r-w.getTime()>864e5;}
function recLine(e){const r=Date.parse(e.rec||'');if(!isFinite(r))return '';const d=new Date(r);let h=d.getHours();const ap=h<12?'AM':'PM';h=h%12||12;
  return 'First written '+MDY(d)+' '+h+':'+String(d.getMinutes()).padStart(2,'0')+' '+ap;}
/* a seizure's length: from its times, else the minutes typed */
function szMin(e){const a=pTime(e.szStart),b=pTime(e.szEnd);if(a!=null&&b!=null){let m=b-a;if(m<0)m+=1440;return m;}const n=num(e.szDur);return n!=null&&n>=0?n:null;}
const szText=e=>{const m=szMin(e);return m==null?'':(m<1?'under a minute':m===1?'about 1 minute':'about '+(Math.round(m*10)/10)+' minutes');};
const used=e=>!!e&&(!!e.kind||FKEYS.some(k=>T(e[k]))||e.tasks.length>0||e.att.length>0);
/* what an event still needs */
function openOf(e){const o=[];if(!used(e))return o;const d=pDate(e.date),due=d?iso(d):'';
  e.tasks.forEach(t=>{if(T(t.what)&&!T(t.done)){const td=pDate(t.due);o.push({what:T(t.what),due:td?iso(td):due});}});
  if(!T(e.parWho)&&!T(e.parWhen))o.push({what:'Record that the parent or guardian was told',due});
  if(e.distRep==='notyet')o.push({what:'The school’s or agency’s own incident report is not made yet',due});
  if(e.clrNeed==='y'&&!T(e.clrGot))o.push({what:'The doctor’s clearance to return is not received yet',due});
  if(['doctor','er','adm'].includes(e.care)){if(!T(e.instr)&&!e.att.some(a=>a.kind==='paper'))o.push({what:'The discharge instructions are not recorded or attached',due});
    if(!T(e.retDate))o.push({what:'The return to school is not recorded',due});}
  if(e.kind==='ing'&&!T(e.ingPassed))o.push({what:'Not yet recorded as passed, or cleared by the doctor',due});
  if(!e.repNeed)o.push({what:'Answer the report question (abuse or neglect)',due});
  else if(e.repNeed==='yes'&&!['repWhen','repTo','repBy'].every(k=>T(e[k])))o.push({what:'Record the report made (when, to whom, by whom)',due});
  return o;}
function evSorted(){return S.events.map((e,i)=>({e,i,w:evWhen(e)})).sort((a,b)=>(a.w&&b.w)?a.w-b.w||a.i-b.i:a.w?-1:b.w?1:a.i-b.i);}
const evNo=i=>evSorted().findIndex(x=>x.i===i)+1;
const evTitle=(e,n)=>'Medical event '+n+(e.kind?' · '+KSHORT[e.kind]:'')+(T(e.date)?' · '+T(e.date):'')+(T(e.time)?' '+T(e.time):'');

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- the Events page ---------------- */
const short=(s,n)=>{s=T(s).replace(/\s+/g,' ');return s.length>n?s.slice(0,n-1).trimEnd()+'…':s;};
function renderList(){const L=evSorted().slice().reverse(),N=L.length;
  $('#meList tbody').innerHTML=N?L.map(({e,i},k)=>{const op=openOf(e),sz=e.kind==='sz'?szText(e):'';
    return `<tr${i===CUR?' class="sel"':''}><td class="num">${N-k}</td><td>${esc(T(e.date)||NONE)}${T(e.time)?' <span class="hint">'+esc(T(e.time))+'</span>':''}${isLate(e)?' <span class="meTag red">Late entry</span>':''}</td><td>${esc(KSHORT[e.kind]||NONE)}${sz?' <span class="hint">'+esc(sz)+'</span>':''}</td><td>${esc(short(e.what||e.ingWhat||e.szLook||e.injLook||'',110)||NONE)}</td><td>${esc(CAREN[e.care]&&e.care?CAREN[e.care]:NONE)}</td><td>${esc(T(e.retDate)||NONE)}</td><td class="num">${op.length?'<span class="meTag amb">'+op.length+' open</span>':used(e)?'None':NONE}</td><td class="num">${e.att.length||NONE}</td><td class="noprint"><button type="button" data-open="${i}">Open</button></td>${delCell('events',i,'event')}</tr>`;}).join('')
    :'<tr><td colspan="10" class="hint">No medical event is recorded. Press New event to write one.</td></tr>';
  $('#meCount').textContent=N+' event'+(N===1?'':'s');
  const all=[];evSorted().forEach(({e,i},k)=>openOf(e).forEach(o=>all.push({o,i,n:k+1,e})));
  $('#meOpen').innerHTML=all.length?all.map(x=>`<li>Event ${x.n}${x.e.kind?' ('+esc(KSHORT[x.e.kind])+(T(x.e.date)?', '+esc(T(x.e.date)):'')+')':''}: ${esc(x.o.what)}${x.o.due&&x.o.due!==iso(pDate(x.e.date))?' <span class="hint">due '+esc(MDY(pDate(x.o.due)))+'</span>':''}</li>`).join(''):'<li class="hint">Nothing is open.</li>';}
function newEvent(){if(S.events.length>=200){nbhUI.toast('This record holds 200 events, its limit. Save it and start a new record.',{kind:'warn'});return;}
  const e=evBlank();e.date=today();e.time=nowT();e.rec=new Date().toISOString();e.by=T(S.meta.bcba);S.events.push(e);CUR=S.events.length-1;renderAll();setView('event');const x=$('#meEdit select');if(x)x.focus();}
$('#meNew').addEventListener('click',newEvent);$('#meNew2').addEventListener('click',newEvent);
$('#meList').addEventListener('click',e=>{const b=e.target.closest('button[data-open]');if(!b)return;CUR=+b.dataset.open;renderAll();setView('event');});

/* ---------------- this event ---------------- */
function box(e,f){const [k,lab,ty,list]=f,v=e[k]||'',a=`data-ev="${k}" aria-label="${esc(lab)}"`;
  const c=ty==='ta'?`<textarea ${a} rows="3">${esc(v)}</textarea>`:ty==='sel'?`<select ${a}>${opts(list,v)}</select>`:`<input ${a} value="${esc(v)}"${ty==='d'?' placeholder="M/D/YYYY"':ty==='t'?' placeholder="10:42AM"':''}>`;
  return `<div${ty==='ta'?' style="grid-column:1/-1"':''}><label>${esc(lab)}</label>${c}</div>`;}
const grid=(e,F)=>'<div class="fieldgrid">'+F.map(f=>box(e,f)).join('')+'</div>';
const HINTS={'What Happened':'Write what was seen and done, in plain words. A diagnosis goes under Medical Care, in the doctor’s words.',
  'What Was Done at School':'In an emergency the health plan and 911 come first. Write this afterwards.',
  'Does This Need a Report?':'Anyone who has a reason to suspect abuse or neglect makes the report themselves, as the law and the school’s or agency’s procedure say. An injury no one saw, one that does not fit its explanation, or one in a private area is a reason to ask. Do not investigate and do not photograph before following that procedure.',
  'After the Event':'What changed because of this event, so it is less likely to happen again.'};
function renderEdit(){const el=$('#meEdit'),e=S.events[CUR];
  if(!e){el.innerHTML='<p class="hint">No event is open. Choose one on the Events page, or press New event.</p>';return;}
  const n=evNo(CUR);let h=`<h2 class="nbh-band" id="meEvT">${esc(evTitle(e,n))}</h2><span class="meRec" id="meRecLine"></span>`;
  const part=(name,F)=>`<div class="mePart" data-part="${esc(name)}"><h3>${esc(name)}</h3>${HINTS[name]?'<p class="hint">'+esc(HINTS[name])+'</p>':''}${grid(e,F)}</div>`;
  PARTS.forEach(([name,F])=>{if(name==='Written by')return;
    if(name==='kind'){const KF=P_KIND[e.kind]||[];if(!KF.length)return;
      h+=`<div class="mePart" data-part="kind"><h3>${esc(KPART[e.kind])}</h3>${grid(e,KF)}${e.kind==='sz'?'<p class="verdict v-mid" id="meSzLen"></p>':''}</div>`;return;}
    h+=`<div class="mePart" data-part="${esc(name)}"><h3>${esc(name)}</h3>${HINTS[name]?'<p class="hint">'+esc(HINTS[name])+'</p>':''}`;
    if(name==='What Happened')h+=`<div class="fieldgrid"><div><label>Kind of event</label><select data-ev="kind" aria-label="Kind of event">${opts(KINDS,e.kind)}</select></div></div>`;
    h+=grid(e,F);
    if(name==='After the Event')h+=`<div id="meNext"></div>`;
    h+='</div>';});
  h+=`<div class="mePart" data-part="tasks"><h3>Follow-up</h3><p class="hint">Each thing still to do, with its date. Write the date it was done when it is done.</p>
    <div class="grid-wrap"><table class="rt meTasks" id="meTasks"><thead><tr><th style="width:52%">What</th><th>Due</th><th>Done (date)</th><th class="nx"></th></tr></thead><tbody></tbody></table></div>
    <div class="tools"><button type="button" id="meTaskAdd">Add a follow-up</button></div></div>`;
  h+=`<div class="mePart" data-part="att"><h3>Photos and Papers</h3>
    <p class="hint">Discharge papers, a doctor’s note, a photo of the item, or a photo of an injury. They are kept on this device and inside the case file, and nowhere else.</p>
    <div class="fieldgrid"><div><label>Consent to photograph the student</label><select data-m="photoConsent" id="meCons" aria-label="Consent to photograph the student"><option value="">Not recorded</option>${Object.keys(CONS).map(k=>'<option value="'+k+'">'+esc(CONS[k])+'</option>').join('')}</select></div>
      <div><label>Added by (initials)</label><input data-m="photoBy" id="meBy" maxlength="20" aria-label="Added by (initials)"></div></div>
    <p id="meAttGate" role="status"></p>
    <div id="meAttList"></div>
    <div class="tools"><button type="button" class="tool" id="meDocAdd">Add papers (PDF or photos of the pages)</button><button type="button" class="tool" id="mePhAdd">Add a photo</button><span class="status" id="meAttCount"></span></div></div>`;
  h+=part('Written by',P_BY);
  h+=`<div class="tools"><button type="button" id="meBack">Back to the events</button></div>`;
  el.innerHTML=h;
  $('#meCons').value=S.meta.photoConsent||'';$('#meBy').value=S.meta.photoBy||'';
  renderTasks();renderDerived();renderAtt();}
function renderDerived(){const e=S.events[CUR];if(!e)return;const t=$('#meEvT');if(t)t.textContent=evTitle(e,evNo(CUR));
  const r=$('#meRecLine');if(r)r.innerHTML=esc(recLine(e))+(isLate(e)?' · <b>Late entry</b> (written more than 24 hours after the event)':'');
  const z=$('#meSzLen');if(z){const m=szMin(e);z.hidden=m==null;z.textContent=m==null?'':'It lasted '+szText(e)+'. The student’s seizure action plan says what to do, and when to call 911.';}
  const nx=$('#meNext');if(nx){const L=NEXT[e.kind]||[];nx.innerHTML=L.length?'<p class="hint" style="margin-bottom:2px"><b>Worth opening after this kind of event</b></p><ul class="hint" style="margin:0 0 0 18px;padding:0">'+L.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'';}}
function renderTasks(){const e=S.events[CUR],tb=$('#meTasks tbody');if(!e||!tb)return;
  tb.innerHTML=e.tasks.length?e.tasks.map((t,i)=>`<tr><td><input data-tk="${i}" data-f="what" value="${esc(t.what)}" aria-label="follow-up ${i+1}"></td><td><input data-tk="${i}" data-f="due" value="${esc(t.due)}" placeholder="M/D/YYYY" aria-label="due ${i+1}"></td><td><input data-tk="${i}" data-f="done" value="${esc(t.done)}" placeholder="M/D/YYYY" aria-label="done ${i+1}"></td>${delCell('tasks',i,'follow-up')}</tr>`).join('')
    :'<tr><td colspan="4" class="hint">No follow-up is written.</td></tr>';}
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#meTaskAdd,#meBack');if(!t)return;const ev=S.events[CUR];
  if(t.id==='meBack'){renderList();setView('events');return;}
  if(ev&&ev.tasks.length<30){ev.tasks.push({what:'',due:'',done:''});renderTasks();const x=$$('#meTasks input[data-f="what"]').pop();if(x)x.focus();}});

let tA=null;const soon=f=>{clearTimeout(tA);tA=setTimeout(f,250);};
const after=()=>{renderDerived();renderList();renderPaper();};
document.addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;soon(()=>{renderPaper();renderAttGate();});return;}
  if(el.dataset.ev!==undefined&&el.tagName!=='SELECT'){const ev=S.events[CUR];if(ev){ev[el.dataset.ev]=el.value;soon(after);}return;}
  if(el.dataset.tk!==undefined){const ev=S.events[CUR],t=ev&&ev.tasks[+el.dataset.tk];if(t){t[el.dataset.f]=el.value;soon(after);}return;}
  if(el.dataset.at!==undefined&&el.tagName!=='SELECT'){const ev=S.events[CUR],a=ev&&ev.att[+el.dataset.at];if(a){a[el.dataset.f]=el.value.slice(0,el.dataset.f==='by'?20:300);soon(renderPaper);}return;}
});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderPaper();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderPaper();renderAttGate();return;}
  if(el.dataset.ev!==undefined){const ev=S.events[CUR];if(!ev)return;ev[el.dataset.ev]=el.value;
    if(el.dataset.ev==='kind'){renderEdit();renderList();renderPaper();const x=$('#meEdit [data-part="kind"] input,#meEdit [data-part="kind"] select');if(x)x.focus();}else after();return;}
  if(el.dataset.at!==undefined&&el.tagName==='SELECT'){const ev=S.events[CUR],a=ev&&ev.att[+el.dataset.at];if(!a)return;
    if(el.value==='student'&&!consYes()){el.value=a.kind;nbhUI.toast(consWhy(),{kind:'warn',ms:8000});return;}
    a.kind=ATTKN[el.value]?el.value:'other';after();return;}
});
async function rowDel(r,i){const ev=S.events[CUR],list=r==='events'?S.events:r==='tasks'?(ev||{}).tasks:null;if(!list||!list[i])return;
  const row=list[i],has=r==='events'?used(row):Object.keys(row).some(k=>T(row[k]));
  if(has&&!(await nbhUI.confirm(r==='events'?'Delete this medical event?\nEverything written in it, and its photos and papers, is deleted from this record.':'Delete this follow-up?',{ok:'Delete',danger:true})))return;
  list.splice(i,1);
  if(r==='events'){if(CUR===i)CUR=-1;else if(CUR>i)CUR--;renderAll();}else{renderTasks();after();}}

/* ================= the photos and papers =================
   Each is kept in the shared media store (nbh-media.js) and the record holds a reference with its details:
   {ref, name, mime, size, kind, at (when added), by (initials), note}. A photo is shrunk first (1600 px on its long side;
   a photographed page 2200 px, so its words stay readable). A PDF is kept as it is, up to 8 MB. A photo of the student
   needs "Consent to photograph the student" answered Yes. None of them goes into the case facts or the CSV, and photos
   print only when "Include the photos when printing" is ticked (off each time the form opens). */
const ATT_MAX=12,PDF_MAX=8*1048576,ATT_URL={};let attWarm=false;
const ATT_OK=v=>{v=String(v==null?'':v);const M=window.nbhMedia;
  if(M&&M.isRef(v)){const mm=(M.parse(v)||{}).mime||'';return /^image\/(jpeg|png|webp)$/.test(mm)||mm==='application/pdf';}
  return /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<16e6;};
const attMime=a=>{const M=window.nbhMedia;if(M&&M.isRef(a.ref))return (M.parse(a.ref)||{}).mime||'';const m=/^data:([^;,]+)/.exec(a.ref||'');return m?m[1]:'';};
const attIsPdf=a=>attMime(a)==='application/pdf';
const attSrc=a=>window.nbhMedia&&nbhMedia.isRef(a.ref)?(ATT_URL[a.ref]||''):String(a.ref||'');
const attAt=ms=>{const d=new Date(ms);if(isNaN(d))return '';const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+' '+z(d.getHours())+':'+z(d.getMinutes());};
const attWhen=at=>{const m=/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)$/.exec(at||'');if(!m)return at||'date not recorded';let h=+m[4];const ap=h<12?'AM':'PM';h=h%12||12;return (+m[2])+'/'+(+m[3])+'/'+m[1]+' '+h+':'+m[5]+' '+ap;};
const attSize=n=>{n=+n||0;return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';};
const consYes=()=>S.meta.photoConsent==='ic1'||S.meta.photoConsent==='other';
const consWhy=()=>S.meta.photoConsent==='no'?'A photo of the student cannot be added: the answer to "Consent to photograph the student" is No. Describe the injury in words instead.':'A photo of the student can be added only when "Consent to photograph the student" is answered Yes (on Form IC-1, or other written consent).';
const attClean=name=>T(String(name||'').replace(/[\u0000-\u001f<>:"/\\|?*]+/g,' ')).slice(0,80);
function attCopy(a){const s=v=>v==null||typeof v==='object'?'':String(v);
  return (Array.isArray(a)?a:[]).filter(p=>p&&typeof p==='object'&&ATT_OK(p.ref)).slice(0,ATT_MAX).map(p=>({ref:s(p.ref),name:attClean(p.name)||'file',size:Math.max(0,Math.round(+p.size||0)),kind:ATTKN[s(p.kind)]?s(p.kind):'other',at:s(p.at).slice(0,16),by:s(p.by).slice(0,20),note:s(p.note).slice(0,300)}));}
function attWarmUp(){const M=window.nbhMedia;if(!M||attWarm)return;const refs=[];
  S.events.forEach(e=>e.att.forEach(a=>{if(M.isRef(a.ref)&&!(a.ref in ATT_URL))refs.push(a.ref);}));
  if(!refs.length)return;attWarm=true;Promise.all(refs.map(r=>M.url(r).then(u=>{ATT_URL[r]=u||'';}).catch(()=>{ATT_URL[r]='';}))).then(()=>{attWarm=false;renderAtt();renderPaper();});}
function renderAttGate(){const g=$('#meAttGate');if(!g)return;const e=S.events[CUR];const bad=e&&e.att.some(a=>a.kind==='student')&&!consYes();
  g.textContent=bad?'This event holds a photo of the student, and "Consent to photograph the student" is not answered Yes. Record the consent, or delete the photo.':'';}
function renderAtt(){const L=$('#meAttList'),e=S.events[CUR];if(!L||!e)return;
  L.innerHTML=e.att.length?e.att.map((a,i)=>{const pdf=attIsPdf(a),src=attSrc(a),lab=ATTKN[a.kind]+': '+a.name;
    const th=pdf?'PDF':(src?`<img src="${esc(src)}" alt="${esc(lab)}">`:'<span class="hint">not on this device</span>');
    return `<div class="meAtt" data-att="${i}"><button type="button" class="meAtt-th" data-attopen="${i}" aria-label="Open ${esc(lab)}">${th}</button>
      <div class="meAtt-f"><div><label>What it is</label><select data-at="${i}" data-f="kind" aria-label="What attachment ${i+1} is">${opts(ATTK,a.kind)}</select></div>
        <div><label>Added by (initials)</label><input data-at="${i}" data-f="by" value="${esc(a.by)}" maxlength="20" aria-label="Attachment ${i+1} added by"></div>
        <div style="grid-column:1/-1"><label>Note</label><input data-at="${i}" data-f="note" value="${esc(a.note)}" maxlength="300" aria-label="Note on attachment ${i+1}"></div></div>
      <div class="meAtt-m">${esc(a.name)} · ${esc(attSize(a.size))} · added ${esc(attWhen(a.at))}${src||!(window.nbhMedia&&nbhMedia.isRef(a.ref))?'':' · <b>not on this device</b> (it is in the case file it was saved in)'}</div>
      <div class="meAtt-b">${src?`<button type="button" data-attopen="${i}">Open</button><a href="${esc(src)}" download="${esc(a.name)}" data-attsave="${i}">Save a copy</a>`:''}<button type="button" data-attdel="${i}">Delete</button></div></div>`;}).join('')
    :'<p class="hint">Nothing is attached to this event.</p>';
  const c=$('#meAttCount');if(c)c.textContent=e.att.length+' of '+ATT_MAX+(e.att.length?' · '+attSize(e.att.reduce((t,a)=>t+a.size,0)):'');
  renderAttGate();attWarmUp();}
async function shrink(file,max){const url=URL.createObjectURL(file);
  try{const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('not an image'));im.src=url;});
    const w=img.naturalWidth||1,h=img.naturalHeight||1,k=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
    return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('no image')),'image/jpeg',0.82));}
  finally{URL.revokeObjectURL(url);}}
const toData=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
const isPdfFile=async f=>{try{const b=new Uint8Array(await f.slice(0,5).arrayBuffer());return String.fromCharCode(...b)==='%PDF-';}catch(e){return false;}};
async function attKeep(blob,mime){const M=window.nbhMedia;return M?await M.put(blob,{kind:mime==='application/pdf'?'file':'image',mime}):await toData(blob);}
async function attAdd(files,asDoc){const e=S.events[CUR];if(!e)return;let n=0,bad=0,big=0,full=0;
  for(const f of Array.from(files||[])){if(e.att.length>=ATT_MAX){full++;continue;}
    try{let blob,mime,name=attClean(f.name)||'file';
      if(/^image\//.test(f.type||'')){blob=await shrink(f,asDoc?2200:1600);mime='image/jpeg';name=name.replace(/\.[a-z0-9]+$/i,'')+'.jpg';}
      else if(asDoc&&await isPdfFile(f)){if(f.size>PDF_MAX){big++;continue;}blob=f.type==='application/pdf'?f:new Blob([f],{type:'application/pdf'});mime='application/pdf';if(!/\.pdf$/i.test(name))name+='.pdf';}
      else{bad++;continue;}
      const ref=await attKeep(blob,mime);if(!ATT_OK(ref)){bad++;continue;}
      e.att.push({ref,name,size:blob.size,kind:asDoc?'paper':(e.kind==='ing'?'item':'other'),at:attAt(Date.now()),by:T(S.meta.photoBy).slice(0,20),note:''});n++;}catch(err){bad++;}}
  renderAtt();after();
  if(n)nbhUI.toast(n+(n===1?' file':' files')+' attached to this event.',{kind:'ok'});
  if(big)nbhUI.toast(big+(big===1?' PDF is':' PDFs are')+' larger than 8 MB and '+(big===1?'was':'were')+' not attached. Scan at a lower quality, or attach photos of the pages.',{kind:'warn',ms:9000});
  if(bad)nbhUI.toast(bad+(bad===1?' file was':' files were')+' not read as '+(asDoc?'a PDF or a photo':'a photo')+'.',{kind:'warn'});
  if(full)nbhUI.toast('An event holds up to '+ATT_MAX+' photos and papers; '+full+(full===1?' was':' were')+' not attached.',{kind:'warn'});}
function attOpen(i){const e=S.events[CUR],a=e&&e.att[i],D=$('#meAttDlg'),src=a&&attSrc(a);if(!a||!D||!src)return;
  $('#meAttDlgT').textContent=ATTKN[a.kind]+': '+a.name;
  $('#meAttDlgB').innerHTML=attIsPdf(a)?`<iframe src="${esc(src)}" title="${esc(a.name)}"></iframe><p class="hint">If the pages do not show here, use Save a copy and open the file.</p>`:`<img src="${esc(src)}" alt="${esc(ATTKN[a.kind]+': '+a.name)}">`;
  try{D.showModal();}catch(err){D.setAttribute('open','');}}
function attClose(){const D=$('#meAttDlg');$('#meAttDlgB').innerHTML='';try{D.close();}catch(err){D.removeAttribute('open');}}
document.addEventListener('click',async e=>{const t=e.target.closest&&e.target.closest('#meDocAdd,#mePhAdd,[data-attopen],[data-attdel],#meAttClose');if(!t)return;
  if(t.id==='meDocAdd'){$('#meDocFile').click();return;}
  if(t.id==='mePhAdd'){$('#mePhFile').click();return;}
  if(t.id==='meAttClose'){attClose();return;}
  if(t.dataset.attopen!==undefined){attOpen(+t.dataset.attopen);return;}
  if(t.dataset.attdel!==undefined){const ev=S.events[CUR],i=+t.dataset.attdel;if(!ev||!ev.att[i])return;
    if(!(await nbhUI.confirm('Delete this attachment?\nIt is removed from this record.',{ok:'Delete',danger:true})))return;ev.att.splice(i,1);renderAtt();after();}});
$('#mePhFile').addEventListener('change',e=>{const f=e.target.files;attAdd(f,false).finally(()=>{e.target.value='';});});
$('#meDocFile').addEventListener('change',e=>{const f=e.target.files;attAdd(f,true).finally(()=>{e.target.value='';});});
$('#meAttDlg').addEventListener('close',()=>{$('#meAttDlgB').innerHTML='';});
$('#mePhPrintOn').addEventListener('change',e=>{PH_PRINT=!!e.target.checked;renderPaper();});
window.nbhMediaHeld=()=>{try{return JSON.stringify(S);}catch(e){return '';}};   /* the store references this page holds: the workstation's sweep keeps them */

/* ---------------- the paper: each event written out, only what was entered ---------------- */
function paperOf(e,n){const val=f=>f[2]==='sel'?optName(f[3],e[f[0]]):T(e[f[0]]);
  const dl=F=>{const R=F.map(f=>[f[1],val(f)]).filter(x=>x[1]);return R.length?'<dl>'+R.map(x=>'<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>').join('')+'</dl>':'';};
  let h=`<div class="meEv"><h2 class="nbh-band">${esc(evTitle(e,n))}</h2><p class="meRec">${esc(recLine(e))}${isLate(e)?' · <b>Late entry</b>':''}</p>`;
  PARTS.forEach(([name,F])=>{if(name==='Written by')return;const kind=name==='kind',FF=kind?(P_KIND[e.kind]||[]):F,b=dl(FF);
    const extra=kind&&e.kind==='sz'&&szMin(e)!=null?'<p>It lasted '+esc(szText(e))+'.</p>':'';
    if(b||extra)h+=`<div class="mePart"><h3>${esc(kind?KPART[e.kind]:name)}</h3>${b}${extra}</div>`;});
  const tk=e.tasks.filter(t=>T(t.what));
  if(tk.length)h+='<div class="mePart"><h3>Follow-up</h3><table class="rt"><thead><tr><th style="width:56%">What</th><th>Due</th><th>Done</th></tr></thead><tbody>'+tk.map(t=>'<tr><td>'+esc(t.what)+'</td><td>'+esc(T(t.due)||NONE)+'</td><td>'+esc(T(t.done)||'Not yet')+'</td></tr>').join('')+'</tbody></table></div>';
  const op=openOf(e);if(op.length)h+='<div class="mePart"><h3>Still open</h3><ul>'+op.map(o=>'<li>'+esc(o.what)+'</li>').join('')+'</ul></div>';
  if(e.att.length){h+='<div class="mePart"><h3>Photos and Papers</h3><p>Attached to the record'+(PH_PRINT?'':'; photos are not printed with this copy')+'. Consent to photograph the student: '+esc(CONS[S.meta.photoConsent]||'not recorded')+'.</p><ul>'+e.att.map(a=>'<li><b>'+esc(ATTKN[a.kind])+'</b>: '+esc(a.name)+' ('+esc(attSize(a.size))+'), added '+esc(attWhen(a.at))+(a.by?' by '+esc(a.by):'')+(a.note?'. '+esc(a.note):'')+'</li>').join('')+'</ul>';
    const ph=PH_PRINT?e.att.filter(a=>!attIsPdf(a)&&attSrc(a)):[];
    if(ph.length)h+='<div class="mePh">'+ph.map(a=>'<figure><img src="'+esc(attSrc(a))+'" alt="'+esc(ATTKN[a.kind]+': '+a.name)+'"><figcaption><b>'+esc(ATTKN[a.kind])+'</b><br>'+esc(attWhen(a.at))+(a.by?' · added by '+esc(a.by):'')+(a.note?'<br>'+esc(a.note):'')+'</figcaption></figure>').join('')+'</div>';
    h+='</div>';}
  const wb=dl(P_BY);if(wb)h+='<div class="mePart"><h3>Written by</h3>'+wb+'</div>';
  h+='<div class="meSign"><div>Signature</div><div>Role</div><div>Date</div></div></div>';return h;}
function renderPaper(){const P=$('#mePaper');if(!P)return;const L=evSorted().filter(x=>used(x.e));
  const pick=S.chk.printOne&&S.events[CUR]?L.filter(x=>x.i===CUR):L;
  P.innerHTML=pick.map(x=>paperOf(x.e,evNo(x.i))).join('');}
window.addEventListener('beforeprint',renderPaper);

/* ---------------- meta + render ---------------- */
function bindAll(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});const p=$('#mePhPrintOn');if(p)p.checked=PH_PRINT;}
function renderAll(){ensure();renderEdit();bindAll();renderList();renderPaper();$('#meCaseNote').textContent=CASE.note||'';}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>{renderPaper();window.print();});
const hasRefs=()=>{const M=window.nbhMedia;return !!M&&S.events.some(e=>e.att.some(a=>M.isRef(a.ref)));};
function saveFile(text){const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`ME-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();}
/* Save data pressed by a person (this button, or the toolbar's quick Save, which presses it) writes the file with its photos
   and papers inside it, so the file opens anywhere. The same button pressed by the workstation or Autosave (the bridge sets
   window.__nbhQuiet while it presses) writes the references, at once: the bytes stay in the media store and the case file
   carries them when the case is saved. */
$('#saveBtn').addEventListener('click',()=>{const text=JSON.stringify({form:'ME-1',rev:'2026-11',saved:new Date().toISOString(),S},null,1);
  if(window.__nbhQuiet||!hasRefs()){saveFile(text);return;}
  nbhMedia.inlineText(text).then(r=>{if(r.missing.length)nbhUI.toast(r.missing.length+(r.missing.length===1?' attachment is':' attachments are')+' not on this device, so the file carries a reference in '+(r.missing.length===1?'its':'their')+' place.',{kind:'warn',ms:9000});saveFile(r.text);}).catch(()=>saveFile(text));});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
/* a saved file: every part optional, every value checked against what the form offers, so an older or partial file opens */
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='ME-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},arr=(v,n)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,n):[];
  Object.keys(obj(s.meta)).forEach(k=>{o.meta[k]=str(s.meta[k]);});if(!CONS[o.meta.photoConsent])delete o.meta.photoConsent;
  Object.keys(obj(s.chk)).forEach(k=>{o.chk[k]=s.chk[k]===true;});
  const seen={};
  o.events=arr(s.events,200).map(x=>{const e=evBlank();e.id=str(x.id)||uid();if(seen[e.id])e.id=uid();seen[e.id]=1;e.kind=KSHORT[str(x.kind)]?str(x.kind):'';
    FKEYS.forEach(k=>{const v=str(x[k]);e[k]=SELOK[k]?(SELOK[k].includes(v)?v:''):v.slice(0,6000);});
    e.rec=/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(str(x.rec))&&!isNaN(Date.parse(x.rec))?str(x.rec):'';
    e.tasks=arr(x.tasks,30).map(t=>({what:str(t.what).slice(0,600),due:str(t.due).slice(0,40),done:str(t.done).slice(0,40)}));
    e.att=attCopy(x.att);return e;});
  return o;
}
/* a file's photos and papers, written inside it, go into the media store and the record keeps their references */
async function absorb(){const M=window.nbhMedia;if(!M)return;let n=0;
  for(const e of S.events)for(const a of e.att){if(M.isRef(a.ref)||!/^data:/.test(a.ref))continue;
    try{const r=await M.put(a.ref,{kind:attIsPdf(a)?'file':'image'});if(M.isRef(r)){a.ref=r;n++;}}catch(err){}}
  if(n){renderAtt();renderPaper();}}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='ME-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved ME-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form ME-1. Nothing was changed.':'That file could not be read as a saved ME-1 form. Nothing was changed.');return;}
    const prev=S;S=next;CUR=-1;try{renderAll();absorb();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved ME-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  /* one line an event: every field as written, the lists as their words; the photos and papers only as a count */
  const head=['Event','Kind','First written','Late entry'].concat(ALLF.map(f=>f[1]),['Seizure length (minutes)','Follow-up','Still open','Photos and papers']);
  const out=[head];evSorted().forEach(({e},k)=>{if(!used(e))return;const m=e.kind==='sz'?szMin(e):null;
    out.push([k+1,KSHORT[e.kind]||'',e.rec,isLate(e)?'yes':''].concat(ALLF.map(f=>f[2]==='sel'?optName(f[3],e[f[0]]):e[f[0]]),[m==null?'':m,e.tasks.filter(t=>T(t.what)).map(t=>T(t.what)+(T(t.due)?' (due '+T(t.due)+')':'')+(T(t.done)?' (done '+T(t.done)+')':'')).join('; '),openOf(e).map(o=>o.what).join('; '),e.att.length]));});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='ME-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();CUR=-1;PH_PRINT=false;renderAll();setView('events');}});

/* ---------------- simulation ---------------- */
function simPicture(){return new Promise(res=>{try{const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');
  x.fillStyle='#EEF2F1';x.fillRect(0,0,800,600);x.fillStyle='#1D3A52';x.font='700 34px sans-serif';x.fillText('SIMULATED PICTURE',40,70);x.font='400 22px sans-serif';x.fillText('Drawn by the form for training. Not a real item.',40,108);
  [['#C7533B',210,330],['#3B7FC7',400,360],['#5A9A52',590,320]].forEach(([col,cx,cy])=>{x.fillStyle=col;x.beginPath();x.arc(cx,cy,54,0,Math.PI*2);x.fill();x.fillStyle='#EEF2F1';x.beginPath();x.arc(cx,cy,14,0,Math.PI*2);x.fill();});
  x.fillStyle='#333';x.fillRect(40,520,300,6);x.font='400 20px sans-serif';x.fillText('about 1 cm',40,560);
  c.toBlob(b=>res(b||null),'image/jpeg',0.85);}catch(e){res(null);}});}
async function loadSim(){
  if(S.events.some(used)&&!(await nbhUI.confirm('Load the simulation?\nIt replaces what is on this form.',{ok:'Load simulation'})))return;
  const D=n=>{const d=new Date();d.setDate(d.getDate()-n);return MDY(d);},R=(n,h)=>{const d=new Date();d.setDate(d.getDate()-n);d.setHours(h,20,0,0);return d.toISOString();};
  const E=(o)=>Object.assign(evBlank(),o);
  S=blank();PH_PRINT=false;
  S.meta={client:'Sim Student (example)',sid:'SIM-0000',grade:'3',dob:'1/15/2018',site:'Simulated Elementary (example)',bcba:'Sim BCBA (example)',alerts:'Seizure disorder (simulated); no known allergies',plans:'Seizure action plan, with the school nurse (simulated)',nurse:'School nurse (simulated)',emerg:'Parent (simulated), 555-0100',photoConsent:'ic1',photoBy:'SB'};
  const a=E({kind:'ing',date:D(3),time:'10:40 AM',where:'Art table in the classroom (simulated)',doing:'Stringing beads in a small-group art activity',
    what:'The teacher saw the student put a bead in her mouth. Asked to spit it out, she swallowed. A second bead was missing from her tray at the count. She did not cough, gag or have trouble breathing. (Simulated.)',seen:'y',noticed:'Classroom teacher (simulated)',present:'Classroom aide (simulated)',
    ingWhat:'Plastic craft beads (simulated)',ingCount:'2, by the count of her tray',ingSize:'About 8 mm',ingSource:'class',ingSourceNote:'The bead tray was set out for the whole group; nobody had checked it against who mouths objects.',ingPoison:'y',ingPoisonNote:'Advised to call her doctor today (simulated).',ingPassed:'',
    firstAid:'None needed; she was kept seated and watched. (Simulated.)',nurseSeen:'y',nurseWho:'School nurse (simulated)',nurseTime:'10:48 AM',nurseNote:'Breathing normal, no drooling, no pain. Parent called; the doctor’s office asked to see her. (Simulated.)',emsCalled:'n',planFollowed:'none',
    care:'doctor',transport:'parent',facility:'Simulated Pediatrics',leftAt:'11:25 AM',dischAt:D(3)+', 1:30 PM',dx:'No sign that the airway or the stomach is blocked. Nothing more to do unless symptoms appear. (Simulated.)',instr:'Call if she has belly pain, vomiting or a fever. Regular diet. (Simulated.)',restrict:'None',fuAppt:'None unless symptoms appear (simulated)',
    parWho:'Parent (simulated)',parWhen:D(3)+', 10:55 AM',parHow:'Phone, by the nurse',admWho:'Assistant principal (simulated)',admWhen:D(3)+', 11:00 AM',bcbaWhen:D(3)+', 11:10 AM',distRep:'y',distWhen:D(3),distNo:'SIM-0001 (simulated)',
    retDate:D(2),clrNeed:'n',retRestrict:'None',staffTold:'Classroom team, '+D(2),repNeed:'no',
    cause:'Small beads were set out for the group without a check of who mouths objects; she mouths objects when her hands are not busy. (Simulated.)',changes:'Her group now uses beads too large to fit a choke-test tube. An adult sits beside her during art. Small parts are named on her plan. (Simulated.)',flagsRev:D(2),
    by:'Sim BCBA (example)',byRole:'BCBA',rec:R(3,13),
    tasks:[{what:'Ask the family whether she has had any symptoms',due:D(-4),done:''},{what:'Go through the materials list with the art teacher',due:D(1),done:D(1)}]});
  const b=E({kind:'sz',date:D(20),time:'1:12 PM',where:'Cafeteria (simulated)',doing:'Eating lunch',what:'She stopped eating, stiffened and fell to the side; the aide lowered her to the floor and moved the bench away. Her arms and legs jerked. (Simulated.)',seen:'y',noticed:'Lunch aide (simulated)',present:'Two cafeteria staff (simulated)',
    szStart:'1:12 PM',szEnd:'1:19 PM',szLook:'Stiff, then jerking of both arms and legs; eyes open and turned up. (Simulated.)',szAware:'n',szUsual:'longer',szRescue:'y',szRescueMed:'As the seizure action plan lists (simulated)',szRescueTime:'1:17 PM',szRescueBy:'School nurse (simulated)',szRecover:'Sleepy and confused for about 40 minutes. (Simulated.)',
    firstAid:'Placed on her side, head cushioned, nothing put in her mouth, timed from the start. (Simulated.)',nurseSeen:'y',nurseWho:'School nurse (simulated)',nurseTime:'1:15 PM',nurseNote:'Gave the rescue medicine at 5 minutes as the plan says. (Simulated.)',emsCalled:'y',emsTime:'1:17 PM',emsBy:'Front office (simulated)',planFollowed:'y',
    care:'er',transport:'amb',facility:'Simulated Children’s Hospital',leftAt:'1:34 PM',dischAt:D(20)+', 6:00 PM',dx:'A prolonged seizure; her medicine dose was reviewed. (Simulated.)',instr:'Rest today. See the neurologist this week. (Simulated.)',tx:'Dose changed by the neurologist (simulated)',fuAppt:'Neurologist, '+D(16),
    parWho:'Parent (simulated)',parWhen:D(20)+', 1:18 PM',parHow:'Phone',admWho:'Principal (simulated)',admWhen:D(20)+', 1:20 PM',bcbaWhen:D(20),distRep:'y',distWhen:D(20),distNo:'SIM-0002 (simulated)',
    retDate:D(18),clrNeed:'y',clrGot:D(18)+', from the neurologist’s office (simulated)',retRestrict:'No climbing equipment for two weeks',staffTold:'Classroom and PE staff, '+D(18),repNeed:'no',
    cause:'A missed dose that morning, by the family’s report. (Simulated.)',changes:'The seizure action plan was updated with the new dose; Form MS-1 was opened for the change. (Simulated.)',flagsRev:D(18),by:'Sim BCBA (example)',byRole:'BCBA',rec:R(20,15),tasks:[]});
  const c=E({kind:'inj',date:D(45),time:'9:05 AM',where:'Playground (simulated)',doing:'Climbing',what:'She slipped from the second step of the climber and landed on her left arm. She cried and held the arm. (Simulated.)',seen:'y',noticed:'Recess aide (simulated)',
    injPart:'Left forearm',injKind:'fall',injHead:'n',injLOC:'n',injLook:'Swelling above the wrist; no break in the skin. (Simulated.)',firstAid:'Ice and a sling by the nurse. (Simulated.)',nurseSeen:'y',nurseWho:'School nurse (simulated)',nurseTime:'9:10 AM',emsCalled:'n',planFollowed:'none',
    care:'doctor',transport:'parent',facility:'Urgent care (simulated)',dischAt:D(45),dx:'A sprain; no fracture on the X-ray. (Simulated.)',instr:'Splint for a week. (Simulated.)',parWho:'Parent (simulated)',parWhen:D(45)+', 9:15 AM',parHow:'Phone',distRep:'y',distWhen:D(45),
    retDate:D(44),clrNeed:'n',retRestrict:'No climbing for a week',repNeed:'no',by:'Sim BCBA (example)',byRole:'BCBA',rec:R(42,9),tasks:[]});
  S.events=[c,b,a];CUR=2;
  const pic=await simPicture();
  if(pic){try{const ref=await attKeep(pic,'image/jpeg');if(ATT_OK(ref))a.att.push({ref,name:'simulated-item.jpg',size:pic.size,kind:'item',at:attAt(Date.parse(a.rec)),by:'SB',note:'Beads like the ones swallowed, beside a ruler (simulated).'});}catch(e){}}
  renderAll();setView('events');
  nbhUI.toast('Simulation loaded: three invented events (something swallowed, a long seizure, a fall), one with a drawn picture attached and a follow-up still open.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v25.78 the case: in. The student details come through the packet map. The medical alerts (the health conditions and the
   allergies of Form DM-1's health record) fill the empty line, and DM-1's safety precautions that bear on a medical event
   are named beside it, so the person writing sees what the plan already says. Only empty fields are filled. */
window.__nbhFactsIn=function(f){f=f||{};const m=S.meta,pf=f.profile||{},h=pf.health||{};let n=0;const got=[];
  const uniq=a=>a.map(T).filter((x,i,A)=>x&&A.indexOf(x)===i);
  const al=uniq([h.conditions,h.dx,h.allergies?'allergies: '+T(h.allergies):'']);
  if(!T(m.alerts)&&al.length){m.alerts=al.join('; ');n++;got.push('the medical alerts');}
  const safety=(((pf.flags||{}).safety)||[]).filter(x=>/pica|chok|medical|seizure/i.test(String(x)));
  CASE.note=(got.length?'From the case: '+got.join(', ')+'. Check them with the family and the nurse. ':'')+(safety.length?'Form DM-1’s safety precautions already name: '+safety.join(', ')+'.':'');
  if(n)renderAll();else $('#meCaseNote').textContent=CASE.note||'';return {filled:n};};

/* v25.78 the case: out (key "medical"). For the workstation's lists only: how many events, the latest one's date, kind and
   level of care, how many fall in the last 90 days, and what is still open with its date. No description, no diagnosis, no
   instruction and no photo or paper leaves this form through the case facts. Dates are ISO. */
window.__nbhFactsOut=function(){
  const L=evSorted().filter(x=>used(x.e));if(!L.length)return null;
  const now=new Date();now.setHours(12,0,0,0);const from=new Date(now);from.setDate(from.getDate()-90);
  const dated=L.filter(x=>pDate(x.e.date)),last=dated.length?dated[dated.length-1].e:null,o={count:L.length,count90:dated.filter(x=>pDate(x.e.date)>=from).length,open:[]};
  if(last)o.last={date:iso(pDate(last.date)),kind:KSHORT[last.kind]||'',care:last.care&&CAREN[last.care]?CAREN[last.care]:''};
  L.forEach(x=>openOf(x.e).forEach(p=>o.open.push({what:(KSHORT[x.e.kind]||'Medical event')+(T(x.e.date)?' of '+T(x.e.date):'')+': '+p.what,due:p.due,done:false})));
  return {medical:o};};
