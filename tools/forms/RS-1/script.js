const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%','').replace(',','.'));return isFinite(n)?n:null;};
const uid=()=>Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,7);

/* ---------------- what the form knows ----------------
   The lists below are the choices offered on the form. The numeric rules (5%, two contacts, ...) are NOT here: they are
   on the Setup page's Rules panel, with these defaults, so the form keeps working if the BACB changes them. */
const ACTS=['Discrete-trial teaching','Natural-environment teaching','Behavior reduction / BIP implementation','Data collection','Preference assessment','Skill acquisition program','Parent or caregiver support (under supervision)','Other'];
const TCO=['Data collection and graphing','Behavior assessment','Behavior acquisition','Behavior reduction','Documentation and reporting','Ethics and professional conduct'];
const BST=['Instruction','Modeling','Rehearsal','Feedback'];
/* the supervision activities the BACB RBT Handbook lists */
const SACT=['Developing performance expectations','Observation, BST and performance feedback','Modeling technical, professional and ethical behavior','Guiding problem-solving and ethical decisions','Reviewing written materials (progress notes, data sheets)','Overseeing and evaluating service delivery','Evaluating the effects of supervision'];
/* a contact counts only in real time: in person or by live two-way video (the last two are kept so a call is on record, not counted) */
const MODES=[['person','In person',true],['video','Live video (web camera or video conference)',true],['phone','Phone (does not count)',false],['written','Email, text or recording (does not count)',false],['monitor','Video monitoring without real-time interaction (does not count)',false]];
const MODEWHY={phone:'phone',written:'email, text or recording',monitor:'video monitoring without real-time interaction'};
const modeOf=k=>MODES.find(m=>m[0]===k)||null;
const CREDS=['BCBA','BCaBA','Other or none'];
const credOK=c=>c==='BCBA'||c==='BCaBA';
/* an RBT Supervisor is a BCBA or a BCaBA; an RBT Requirements Coordinator is a BCBA and may also supervise */
const ROLES=['RBT Supervisor','RBT Requirements Coordinator','RBT Supervisor and Requirements Coordinator'];
const isRC=s=>/Coordinator/.test(s.role||''),isSupRole=s=>!s.role||/Supervisor/.test(s.role);
const OVERS=[['employed','Employed by the same organization as the RBT'],['contract','Has a contract with the client'],['no','No']];
/* the kinds of professional development that count toward the two-year cycle (the last one never does) */
const PTYPES=[['inservice','In-service training at the RBT\u2019s organization (BCaBA, BCBA or BCBA-D)',true],['ace','ACE Provider event',true],['univ','Behavior-analytic university course (didactic)',true],['nocount','Supervision, client-specific training or fieldwork (does not count)',false]];
const ptOf=k=>PTYPES.find(t=>t[0]===k)||null;
const DECIDE=['Addressed internally: corrective-action plan','Notice of Alleged Violation submitted to the BACB'];
const GSTAT=['Not started','In progress','Met'];
/* the observation checklist: plain items a supervisor can score while watching the RBT work with a client */
const CHECK=['Arrives prepared: materials, reinforcers and the data sheet ready',
  'Follows the behavior plan&rsquo;s prevention (antecedent) strategies',
  'Delivers reinforcement as the plan says (what, when, how much)',
  'Responds to the target behavior as the plan says',
  'Prompts, and fades prompts, as the program is written',
  'Runs teaching trials or activities as written (clear instruction, wait time)',
  'Records data accurately and at the time',
  'Keeps the student&rsquo;s dignity and privacy',
  'Communicates professionally with the student, staff and family',
  'Stays within the RBT role and asks the supervisor when unsure'];
const RULES0={pct:5,contacts:2,indiv:1,obs:1,grpmax:10,pdu:12,remind:45,remind2:90};
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ---------------- dates and times (dates kept as YYYY-MM-DD, times as HH:MM) ---------------- */
const pad2=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>y+'-'+pad2(m)+'-'+pad2(d);
const isoOf=d=>iso(d.getFullYear(),d.getMonth()+1,d.getDate());
const fromIso=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
const todayISO=()=>isoOf(new Date());
const mdy=s=>{const d=fromIso(s);return d?(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear():'';};
const md=s=>{const d=fromIso(s);return d?(d.getMonth()+1)+'/'+d.getDate():'';};
const wdOf=s=>{const d=fromIso(s);return d?WD[d.getDay()]:'';};
function toMin(s){const m=/^(\d{1,2}):(\d{2})/.exec(String(s||''));if(!m)return null;const h=+m[1],mi=+m[2];return h<24&&mi<60?h*60+mi:null;}
function fmtHM(v){const t=toMin(v);if(t==null)return '';let h=Math.floor(t/60);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+pad2(t%60)+' '+ap;}
const hrs=m=>m==null?'—':(m/60).toFixed(2);
const pctTxt=v=>v==null?'—':(Math.round(v*10)/10).toFixed(1)+'%';
const lastDay=(y,m)=>new Date(y,m,0).getDate();
const keyOf=s=>String(s||'').slice(0,7);
const keyLabel=k=>{const [y,m]=k.split('-');return MON[+m-1]+' '+y;};
/* the school year runs August to July; "2026" is August 2026 to July 2027 */
const schoolYearOf=d=>d.getMonth()>=7?d.getFullYear():d.getFullYear()-1;
function yearKeys(y){y=+y;const out=[];for(let i=0;i<12;i++){const mo=(7+i)%12+1,yy=i<5?y:y+1;out.push(yy+'-'+pad2(mo));}return out;}
const daysUntil=s=>{const d=fromIso(s);if(!d)return null;const t=new Date();t.setHours(0,0,0,0);return Math.round((d-t)/86400000);};

/* ---------------- state ---------------- */
const newSup=()=>({id:uid(),name:'',cred:'',cert:'',role:'RBT Supervisor',trained:'',trained_date:'',portal:'',norel:false,oversight:'',oversight_note:''});
function blank(){return {setup:{rbt_cred:'RBT',year:String(schoolYearOf(new Date())),days:[1,2,3,4,5]},
  sups:[newSup()],rules:{},months:{},goals:[],pdus:[],cred:{},concerns:[]};}
/* several RBTs in one file: each supervisee has their own setup, months, goals, PDUs, credential and concerns (S is the one
   on screen); the supervisors and the rules are entered once and shared by all of them (G) */
const G={sups:[],rules:{}};
function share(o){['sups','rules'].forEach(k=>{delete o[k];Object.defineProperty(o,k,{get:()=>G[k],set:v=>{G[k]=v;},enumerable:true,configurable:true});});return o;}
const newRbt=()=>share(blank());
G.sups=[newSup()];
let S=newRbt(),R=[S],curKey='',openC=new Set();
const RMAX=40;
/* runs f with each supervisee in turn as S (the figures read S), then puts back the one on screen */
function eachRbt(f){const keep=S,out=[];try{R.forEach((r,i)=>{S=r;out.push(f(r,i));});}finally{S=keep;}return out;}
const rbtName=r=>String(r.setup.rbt_name||'').trim();
const rule=k=>{const v=num(S.rules[k]);return v!=null&&v>=0?v:RULES0[k];};
const setupYear=()=>{const y=parseInt(S.setup.year,10);return y>1990&&y<2200?y:schoolYearOf(new Date());};
function defaultKey(){const ks=yearKeys(setupYear()),t=keyOf(todayISO());return ks.includes(t)?t:ks[0];}
function month(k){k=k||curKey;if(!S.months[k])S.months[k]={days:[],contacts:[],note:'',sig:{},filled:false};const m=S.months[k];
  if(!Array.isArray(m.days))m.days=[];if(!Array.isArray(m.contacts))m.contacts=[];if(!m.sig||typeof m.sig!=='object')m.sig={};return m;}
const peek=k=>S.months[k]||{days:[],contacts:[],note:'',sig:{}};
const supById=id=>S.sups.find(s=>s.id===id)||null;
const supLabel=s=>s?(s.name||'(no name)')+(s.cred?', '+s.cred:''):'';
const clientCodes=()=>String(S.setup.clients||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);

/* the usual days fill a month the first time it is opened, once the usual hours are set; "Fill the usual days" adds
   the dates still missing later (after a change to the usual days), and never touches a row already there */
function fillMonth(k,force){const m=month(k),st=S.setup;if(!force&&(m.filled||m.days.length))return 0;if(!force&&!(st.day_start&&st.day_end))return 0;
  const [y,mo]=k.split('-').map(Number),days=Array.isArray(st.days)?st.days:[],have=new Set(m.days.map(d=>d.date));let n=0;
  for(let d=1;d<=lastDay(y,mo);d++){const dt=new Date(y,mo-1,d);if(!days.includes(dt.getDay()))continue;const s=isoOf(dt);if(have.has(s))continue;
    m.days.push({id:uid(),date:s,start:st.day_start||'',end:st.day_end||'',brk:st.day_break||'',act:st.day_act||'',none:false});n++;}
  m.days.sort((a,b)=>String(a.date).localeCompare(String(b.date)));m.filled=true;return n;}

/* ---------------- the month's figures ---------------- */
function dayMin(d){if(d.none)return 0;const a=toMin(d.start),b=toMin(d.end);if(a==null||b==null||b<=a)return null;const v=b-a-(num(d.brk)||0);return v>0?v:null;}
function cMin(c){const a=toMin(c.start),b=toMin(c.end);if(a==null||b==null||b<=a)return null;return b-a;}
function ckScore(c){const v=Object.values(c.ck||{});const y=v.filter(x=>x==='y').length,n=v.filter(x=>x==='n').length;return y+n?{pct:y/(y+n)*100,y,n,na:v.filter(x=>x==='na').length}:null;}
/* why a contact does not count (fail: it can never count; pending: something still to fill in) */
function cIssues(c,k){const out=[],sp=supById(c.sup),mo=modeOf(c.mode),min=cMin(c);
  if(mo&&!mo[2])out.push({lvl:'fail',t:'By '+MODEWHY[c.mode]+': does not count'});
  if(c.format==='group'){const n=num(c.group),mx=rule('grpmax');if(n!=null&&n>mx)out.push({lvl:'fail',t:'A group of '+n+' RBTs: more than '+mx+', does not count'});else if(n==null||n<2)out.push({lvl:'pending',t:'Enter the number of RBTs in the group (2 to '+mx+')'});}
  if(!c.sup||!sp)out.push({lvl:'pending',t:'Choose the supervisor'});else if(!credOK(sp.cred))out.push({lvl:'fail',t:(sp.name||'The supervisor')+' is not listed as a BCBA or BCaBA'});
  if(!mo)out.push({lvl:'pending',t:'Choose how the contact happened'});
  if(!c.date)out.push({lvl:'pending',t:'Enter the date'});else if(keyOf(c.date)!==k)out.push({lvl:'pending',t:'The date is not in '+keyLabel(k)});
  if(min==null)out.push({lvl:'pending',t:'Enter the start and end times'});
  return out;}
const cPlanned=c=>c.date&&c.date>todayISO();
/* what a supervisor still lacks on the record (fail: may not supervise; pending: to confirm) */
function supIssues(s){const out=[],hasRC=S.sups.some(x=>x.name&&isRC(x));
  if(!credOK(s.cred))out.push({lvl:'fail',t:s.cred?'Not a BCBA or BCaBA: may not supervise an RBT':'Choose the credential (BCBA or BCaBA)'});
  if(isRC(s)&&s.cred&&s.cred!=='BCBA')out.push({lvl:'fail',t:'An RBT Requirements Coordinator must be a BCBA'});
  if(s.trained!=='yes')out.push({lvl:'pending',t:'Supervisor training (Supervisor Training Curriculum Outline 2.0) not marked done'});
  if((!hasRC||isRC(s))&&s.portal!=='yes')out.push({lvl:'pending',t:(hasRC?'As Requirements Coordinator, must list':'Must list')+' the RBT in the BACB portal'});
  if(!s.norel)out.push({lvl:'pending',t:'Relationship check not confirmed'});
  if(isSupRole(s)&&s.oversight!=='employed'&&s.oversight!=='contract')out.push({lvl:'pending',t:'Supervisor\u2013client oversight not recorded'});
  return out;}
function stats(k){
  const m=peek(k),[y,mo]=k.split('-').map(Number),first=iso(y,mo,1),last=iso(y,mo,lastDay(y,mo)),today=todayISO();
  const ended=today>last,started=today>=first;
  const inM=d=>d.date&&keyOf(d.date)===k;
  /* a month marked "No services" counts no service days, whatever rows it still holds */
  const served=m.noservice?[]:m.days.filter(d=>inM(d)&&!d.none&&d.date<=today&&dayMin(d)>0);
  const rbtMin=served.reduce((s,d)=>s+dayMin(d),0);
  const plannedMin=m.noservice?0:m.days.filter(d=>inM(d)&&!d.none&&dayMin(d)>0).reduce((s,d)=>s+dayMin(d),0);
  const C=m.contacts.map(c=>{const is=cIssues(c,k);return {c,min:cMin(c),is,counts:!is.length&&!cPlanned(c)};});
  const cnt=C.filter(x=>x.counts),supMin=cnt.reduce((s,x)=>s+x.min,0);
  const indiv=cnt.filter(x=>x.c.format!=='group').length,obs=cnt.filter(x=>x.c.obs==='yes').length;
  const badMode=C.filter(x=>x.is.some(i=>i.lvl==='fail'&&/^By /.test(i.t))).length,badCred=C.filter(x=>{const s=supById(x.c.sup);return s&&!credOK(s.cred);}).length,noSup=C.filter(x=>!supById(x.c.sup)).length;
  const P=rule('pct')/100,pct=rbtMin?supMin/rbtMin*100:null;
  const need=rbtMin?Math.max(0,Math.ceil(rbtMin*P-supMin-1e-9)):0,needPlanned=plannedMin?Math.max(0,Math.ceil(plannedMin*P-supMin-1e-9)):0;
  const bigGroup=C.filter(x=>x.c.format==='group'&&num(x.c.group)!=null&&num(x.c.group)>rule('grpmax')).length;
  const usedSups=[...new Set(m.contacts.map(c=>c.sup))].map(supById).filter(Boolean),reqMiss=[];
  usedSups.forEach(sp=>{const n=supIssues(sp).filter(i=>i.lvl==='pending').length;if(n)reqMiss.push((sp.name||'a supervisor')+': '+n+' item'+(n===1?'':'s')+' to record on the Setup page');});
  const obsDates=cnt.filter(x=>x.c.obs==='yes').map(x=>x.c.date);
  const sc=cnt.map(x=>x.c.obs==='yes'?ckScore(x.c):null).filter(Boolean),ck=sc.length?sc.reduce((s,x)=>s+x.pct,0)/sc.length:null;
  const hasService=rbtMin>0,any=hasService||m.contacts.length>0;
  const st=(met,hard)=>met?'ok':hard?'fail':ended?'fail':'pending';
  const checks=[
    {k:'pct',t:'At least '+rule('pct')+'% of service hours supervised',d:hasService?pctTxt(pct)+' ('+supMin+' of '+rbtMin+' minutes)':'no service hours recorded yet',s:hasService?st(supMin>=rbtMin*P-1e-9):'na'},
    {k:'contacts',t:'At least '+rule('contacts')+' real-time contact'+(rule('contacts')===1?'':'s'),d:cnt.length+' of '+rule('contacts'),s:any?st(cnt.length>=rule('contacts')):'na'},
    {k:'indiv',t:'At least '+rule('indiv')+' individual contact'+(rule('indiv')===1?'':'s'),d:indiv+' of '+rule('indiv'),s:any?st(indiv>=rule('indiv')):'na'},
    {k:'obs',t:'At least '+rule('obs')+' observing the RBT with a client',d:obs+' of '+rule('obs'),s:any?st(obs>=rule('obs')):'na'},
    {k:'cred',t:'Every supervisor is a BCBA or BCaBA',d:badCred?badCred+' contact'+(badCred===1?'':'s')+' with a supervisor without one':noSup?noSup+' contact'+(noSup===1?'':'s')+' without a supervisor chosen':m.contacts.length?'all listed supervisors qualify':'no contacts yet',s:!m.contacts.length?'na':badCred?'fail':noSup?(ended?'fail':'pending'):'ok'},
    {k:'mode',t:'No contact by phone, email, recording or monitoring alone',d:badMode?badMode+' such contact'+(badMode===1?'':'s')+' (not counted)':m.contacts.length?'every contact was in real time':'no contacts yet',s:!m.contacts.length?'na':badMode?'fail':'ok'},
    {k:'group',t:'No group of more than '+rule('grpmax')+' RBTs',d:bigGroup?bigGroup+' such contact'+(bigGroup===1?'':'s')+' (not counted)':m.contacts.some(c=>c.format==='group')?'every group within the limit':'no group contacts',s:!m.contacts.length?'na':bigGroup?'fail':'ok'},
    {k:'req',t:'Supervisor requirements on record',d:reqMiss.length?reqMiss.join('; '):usedSups.length?'training, portal, relationship and client oversight recorded':'no supervisor yet',s:!usedSups.length?'na':reqMiss.length?(ended?'fail':'pending'):'ok'}];
  if(m.noservice)checks.forEach(c=>{c.s='na';c.d='not applicable: no services this month';});
  const live=checks.filter(c=>c.s!=='na');
  let status=m.noservice?'na':!any?'none':live.some(c=>c.s==='fail')?'fail':live.every(c=>c.s==='ok')&&hasService?'ok':'pending';
  if(!m.noservice&&!hasService&&status==='pending'&&ended)status=live.some(c=>c.s==='fail')?'fail':'none';
  return {k,first,last,ended,started,served,daysServed:new Set(served.map(d=>d.date)).size,rbtMin,plannedMin,C,cnt,supMin,indiv,obs,badMode,badCred,noSup,pct,need,needPlanned,ck,ckN:sc.length,checks,status,hasService,obsDates,usedSups,noservice:!!m.noservice,planned:m.days.some(d=>inM(d)&&!d.none&&d.date>today)};}
const STW={ok:'met',pending:'open',fail:'not met',none:'—',na:'n/a'};
const ICO={ok:'✓',pending:'!',fail:'✕',na:'–'};

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
  if(v==='year')renderYear();if(v==='print')renderPrint();if(v==='rbt')renderRbt();if(v==='month')renderMonth();window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
const opts=(list,val,blankOpt)=>(blankOpt?'<option value=""></option>':'')+list.map(o=>{const v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<option value="'+esc(v)+'"'+(String(v)===String(val==null?'':val)?' selected':'')+'>'+esc(l)+'</option>';}).join('');
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+esc(i)+'" title="Delete this '+what+'" aria-label="Delete this '+what+'">&times;</button></td>';

/* ---------------- setup ---------------- */
function renderSetup(){const st=S.setup;
  $('#sYear').innerHTML=(()=>{const y0=schoolYearOf(new Date()),ys=[];for(let y=y0-3;y<=y0+2;y++)ys.push([String(y),y+'–'+String(y+1).slice(2)+' (Aug '+y+' to Jul '+(y+1)+')']);if(!ys.some(x=>x[0]===String(setupYear())))ys.unshift([String(setupYear()),setupYear()+'–'+String(setupYear()+1).slice(2)]);return opts(ys,String(setupYear()));})();
  $('#sAct').innerHTML=opts(ACTS,st.day_act,true);
  $$('[data-s]').forEach(el=>{if(el.id==='sYear')return;el.value=st[el.dataset.s]==null?'':st[el.dataset.s];});
  $$('[data-r]').forEach(el=>{el.value=S.rules[el.dataset.r]!=null&&S.rules[el.dataset.r]!==''?S.rules[el.dataset.r]:RULES0[el.dataset.r];});
  $('#dayChips').innerHTML='<span class="hint" style="align-self:center;margin-right:4px">Usual service days</span>'+[1,2,3,4,5,6,0].map(d=>'<label class="chip"><input type="checkbox" data-wd="'+d+'"'+((st.days||[]).includes(d)?' checked':'')+'> '+WD[d]+'</label>').join('');
  renderSups();renderReq();}
function renderSups(){
  $('#supList').innerHTML=S.sups.map((s,i)=>{const id=esc(s.id),F=f=>'sup_'+id+'_'+f;
    return '<div class="rs-sup" data-sid="'+id+'"><div class="gh"><span>Supervisor '+(i+1)+'</span><button type="button" class="rowDel" data-del="sup" data-i="'+id+'" title="Delete this supervisor" aria-label="Delete supervisor '+(i+1)+'">&times;</button></div>'+
      '<div class="fieldgrid">'+
        '<div><label for="'+F('name')+'">Name</label><input id="'+F('name')+'" data-sup="'+id+'" data-f="name" value="'+esc(s.name)+'" placeholder="e.g., Simulated BCBA" autocomplete="off"'+(i===0?' data-m="bcba"':'')+'></div>'+
        '<div><label for="'+F('cred')+'">Credential</label><select id="'+F('cred')+'" data-sup="'+id+'" data-f="cred">'+opts(CREDS,s.cred,true)+'</select></div>'+
        '<div><label for="'+F('cert')+'">BACB certification number</label><input id="'+F('cert')+'" data-sup="'+id+'" data-f="cert" value="'+esc(s.cert)+'" spellcheck="false" autocomplete="off"></div>'+
        '<div><label for="'+F('role')+'">Role</label><select id="'+F('role')+'" data-sup="'+id+'" data-f="role">'+opts(ROLES,s.role,true)+'</select></div>'+
        '<div><label for="'+F('trained')+'">Supervisor training done (Curriculum Outline 2.0)</label><select id="'+F('trained')+'" data-sup="'+id+'" data-f="trained">'+opts([['yes','Yes'],['no','No']],s.trained,true)+'</select></div>'+
        '<div><label for="'+F('trained_date')+'">Training completed on</label><input type="date" id="'+F('trained_date')+'" data-sup="'+id+'" data-f="trained_date" value="'+esc(s.trained_date)+'"></div>'+
        '<div><label for="'+F('portal')+'">Lists the RBT in the BACB portal</label><select id="'+F('portal')+'" data-sup="'+id+'" data-f="portal">'+opts([['yes','Yes'],['no','No']],s.portal,true)+'</select></div>'+
        '<div><label for="'+F('oversight')+'">Supervisor&ndash;client oversight</label><select id="'+F('oversight')+'" data-sup="'+id+'" data-f="oversight">'+opts(OVERS,s.oversight,true)+'</select></div>'+
        '<div><label for="'+F('oversight_note')+'">Oversight note</label><input id="'+F('oversight_note')+'" data-sup="'+id+'" data-f="oversight_note" value="'+esc(s.oversight_note)+'" placeholder="e.g., both employed by the district"></div>'+
      '</div>'+
      '<label class="chip wide"><input type="checkbox" id="'+F('norel')+'" data-sup="'+id+'" data-f="norel"'+(s.norel?' checked':'')+'> Confirmed: the RBT is not related to, not superior to, not an employer of, and not in a multiple relationship with this supervisor</label>'+
      '<ul class="issues" id="'+F('issues')+'">'+supIssuesHTML(s)+'</ul></div>';}).join('');
  supLists();}
function supIssuesHTML(s){const is=supIssues(s);return is.length?is.map(x=>'<li class="'+x.lvl+'">'+(x.lvl==='fail'?'✕ ':'• ')+esc(x.t)+'</li>').join(''):'<li class="ok">✓ Everything the handbook asks about this supervisor is recorded.</li>';}
function supRefresh(){S.sups.forEach(s=>{const u=document.getElementById('sup_'+s.id+'_issues');if(u)u.innerHTML=supIssuesHTML(s);const card=u&&u.closest('.rs-sup');if(card){const is=supIssues(s);card.classList.toggle('bad',is.some(x=>x.lvl==='fail'));card.classList.toggle('warn',!is.some(x=>x.lvl==='fail')&&is.length>0);}});}
function supLists(){$('#supNames').innerHTML=S.sups.filter(s=>s.name).map(s=>'<option value="'+esc(supLabel(s))+'"></option>').join('');
  $('#clientCodes').innerHTML=clientCodes().map(c=>'<option value="'+esc(c)+'"></option>').join('');}
function renderReq(){const h='<ul>'+
  '<li><b>Ongoing supervision</b> of at least <b>'+rule('pct')+'%</b> of the hours the RBT provides behavior-analytic services, in each calendar month. A month the RBT does not practise needs no supervision.</li>'+
  '<li>At least <b>'+rule('contacts')+' face-to-face, real-time contacts</b> a month: in person is preferred; a web camera or video conference is allowed; never by phone or email, and video monitoring without real-time interaction or feedback may not count.</li>'+
  '<li>In at least <b>'+rule('obs')+'</b> of them the supervisor <b>observes the RBT providing services with a client</b>.</li>'+
  '<li>At least <b>'+rule('indiv')+'</b> contact is <b>individual</b> (no other RBTs or trainees); the other may be a <b>small group of 2 to '+rule('grpmax')+' RBTs</b> (never more, however many supervisors).</li>'+
  '<li>Supervision is client-focused and separate from professional development: one event cannot count as both.</li>'+
  '<li><b>Who supervises:</b> an <b>RBT Supervisor</b> is a BCBA or a BCaBA; an <b>RBT Requirements Coordinator</b> is a BCBA and may also supervise. Both first complete training based on the <b>Supervisor Training Curriculum Outline (2.0)</b>, uploaded to their BACB portal. The RBT may not be related to, superior to, an employer of, or in a multiple relationship with them.</li>'+
  '<li><b>Supervisor&ndash;client oversight:</b> every client the RBT works with has a supervisor who is employed by the same organization as the RBT or has a contract with the client.</li>'+
  '<li><b>Recertification:</b> an RBT who recertifies in 2026 does so one last time with a <b>Recertification Competency Assessment</b> (no more than '+rule('remind')+' days before the expiration date, overseen by a qualified RBT supervisor). After it, a <b>two-year cycle with '+rule('pdu')+' PDUs</b> begins. The 40-hour training follows the <b>RBT Test Content Outline (3rd ed.)</b>. Reinstatement is possible for 30 days after the expiration date, with a late fee; meanwhile the RBT is inactive and may not practise or bill.</li>'+
  '<li><b>Self-reporting:</b> certain events within 30 days of becoming aware of them; supervision noncompliance in a timely manner; personal information changes within 30 days.</li>'+
  '<li><b>Documentation:</b> the days and times of service, the dates, duration and format of supervision, the dates of observations with a client, the supervisors&rsquo; names, proof of the supervisor&rsquo;s relationship to the client, and other records where records disagree. Keep it at least <b>7 years</b>, also after the relationship ends; in an audit the BACB typically allows 14 days to submit it.</li></ul>'+
  '<div class="check"><b>Check against the current BACB RBT Handbook.</b> Source: BACB RBT Handbook and BCBA Handbook (updated 06/2026); check the current handbooks. The numbers above come from the Rules panel.</div>';
  $('#reqBox').innerHTML=h;$('#reqBox2').innerHTML=h;
  const changed=Object.keys(RULES0).filter(k=>rule(k)!==RULES0[k]);$('#rulesNote').textContent=changed.length?'Changed from the 2026 defaults: '+changed.length+'.':'The 2026 defaults.';}

/* ---------------- the month ---------------- */
function renderMonthBar(){const ks=yearKeys(setupYear());
  $('#monthBar').innerHTML=ks.map(k=>{const s=stats(k),[y,m]=k.split('-');return '<button type="button" data-month="'+k+'" aria-pressed="'+(k===curKey)+'" aria-label="'+keyLabel(k)+': '+(s.status==='none'?'nothing recorded':STW[s.status])+'">'+MON[+m-1].slice(0,3)+'<small><i class="st st-'+s.status+'"></i>'+STW[s.status]+'</small></button>';}).join('');}
function renderMonth(){if(!yearKeys(setupYear()).includes(curKey))curKey=defaultKey();
  const filled=fillMonth(curKey);const m=month(curKey);
  renderMonthBar();
  $('#monthTitle').textContent=keyLabel(curKey)+': Service Days';
  const st=S.setup;$('#setupNudge').innerHTML=!(st.day_start&&st.day_end)||!S.sups.some(s=>s.name)?'<div class="instr"><b>Start with Setup.</b> Enter the RBT, the supervisors and the usual days and hours on the Setup page; each month then fills its service days. <button class="tool" type="button" data-go="setup">Go to Setup</button></div>':'';
  renderDays();renderContacts();$('#monthNote').value=m.note||'';$('#monthRecords').value=m.records||'';$('#noSvc').checked=!!m.noservice;renderComp();
  if(filled&&window.nbhUI)nbhUI.toast(keyLabel(curKey)+': '+filled+' usual service day'+(filled===1?'':'s')+' filled in. Mark holidays and absences as No service.');}
function renderDays(){const m=month(curKey),[y,mo]=curKey.split('-').map(Number),mn=iso(y,mo,1),mx=iso(y,mo,lastDay(y,mo)),today=todayISO();
  $('#dayTbl tbody').innerHTML=m.days.map((d,i)=>{const mi=dayMin(d),pl=!d.none&&d.date>today;const lab=(d.date?wdOf(d.date)+' '+md(d.date):'row '+(i+1));
    return '<tr data-did="'+esc(d.id)+'" class="'+(d.none?'none':pl?'planned':'')+'"><td class="dt" data-l="Date"><span class="wd">'+(d.date?wdOf(d.date):'')+'</span><input type="date" id="d_'+esc(d.id)+'_date" data-d="'+esc(d.id)+'" data-f="date" min="'+mn+'" max="'+mx+'" value="'+esc(d.date)+'" aria-label="Date, '+esc(lab)+'"></td>'+
      '<td data-l="Start"><input type="time" id="d_'+esc(d.id)+'_start" data-d="'+esc(d.id)+'" data-f="start" value="'+esc(d.start)+'" aria-label="Start, '+esc(lab)+'"></td>'+
      '<td data-l="End"><input type="time" id="d_'+esc(d.id)+'_end" data-d="'+esc(d.id)+'" data-f="end" value="'+esc(d.end)+'" aria-label="End, '+esc(lab)+'"></td>'+
      '<td data-l="Not in services (min)"><input id="d_'+esc(d.id)+'_brk" data-d="'+esc(d.id)+'" data-f="brk" inputmode="numeric" value="'+esc(d.brk)+'" aria-label="Minutes not in RBT services, '+esc(lab)+'"></td>'+
      '<td class="num hrs" data-l="Hours" id="h_'+esc(d.id)+'">'+(d.none?'0':hrs(mi))+'</td>'+
      '<td class="act" data-l="Primary intervention"><select id="d_'+esc(d.id)+'_act" data-d="'+esc(d.id)+'" data-f="act" aria-label="Primary intervention, '+esc(lab)+'">'+opts(ACTS,d.act,true)+'</select></td>'+
      '<td class="ck" data-l="No service"><input type="checkbox" id="d_'+esc(d.id)+'_none" data-d="'+esc(d.id)+'" data-f="none"'+(d.none?' checked':'')+' aria-label="No service, '+esc(lab)+'"></td>'+delCell('day',d.id,'day')+'</tr>';}).join('')||'<tr><td colspan="8" class="hint">No service days yet. '+(S.setup.day_start&&S.setup.day_end?'Press Fill the usual days, or Add a day.':'Set the usual days and hours on the Setup page, or Add a day.')+'</td></tr>';
  dayTotals();}
function dayTotals(){const s=stats(curKey);$('#dayCount').textContent=s.daysServed+' day'+(s.daysServed===1?'':'s')+' served, '+hrs(s.rbtMin)+' RBT hours'+(s.plannedMin>s.rbtMin?' so far ('+hrs(s.plannedMin)+' with the planned days)':'');}
function cSummary(c,k){const sp=supById(c.sup),mi=cMin(c),is=cIssues(c,k),sc=c.obs==='yes'?ckScore(c):null,mo=modeOf(c.mode);
  return '<b>'+(c.date?wdOf(c.date)+' '+md(c.date):'No date')+'</b><span>'+(mi!=null?mi+' min':'— min')+'</span><span>'+esc(sp?sp.name||'(no name)':'no supervisor')+'</span>'+
    '<span class="rs-pill">'+(c.format==='group'?'Small group'+(num(c.group)?' of '+num(c.group):''):'Individual')+'</span>'+(mo?'<span class="rs-pill'+(mo[2]?'':' warn')+'">'+esc(mo[1].replace(/ \(does not count\)/,''))+'</span>':'')+
    (c.obs==='yes'?'<span class="rs-pill obs">Observed with client'+(sc?' · '+Math.round(sc.pct)+'%':'')+'</span>':'')+(cPlanned(c)?'<span class="rs-pill">planned</span>':'')+
    (is.some(i=>i.lvl==='fail')?'<span class="rs-pill warn">does not count</span>':'');}
function renderContacts(){const m=month(curKey),[y,mo]=curKey.split('-').map(Number),mn=iso(y,mo,1),mx=iso(y,mo,lastDay(y,mo)),sups=S.sups.filter(s=>s.name||s.cred);
  m.contacts.sort((a,b)=>String(a.date||'9').localeCompare(String(b.date||'9'))||String(a.start).localeCompare(String(b.start)));
  $('#contactList').innerHTML=m.contacts.map((c,i)=>{const id=esc(c.id),F=f=>'c_'+id+'_'+f,is=cIssues(c,curKey);
    return '<details class="rs-contact'+(is.some(x=>x.lvl==='fail')?' bad':'')+'" data-cid="'+id+'"'+(openC.has(c.id)?' open':'')+'><summary>'+cSummary(c,curKey)+'</summary><div class="rs-cbody">'+
      '<div class="fieldgrid">'+
        '<div><label for="'+F('date')+'">Date</label><input type="date" id="'+F('date')+'" data-c="'+id+'" data-f="date" min="'+mn+'" max="'+mx+'" value="'+esc(c.date)+'"></div>'+
        '<div><label for="'+F('start')+'">Start</label><input type="time" id="'+F('start')+'" data-c="'+id+'" data-f="start" value="'+esc(c.start)+'"></div>'+
        '<div><label for="'+F('end')+'">End</label><input type="time" id="'+F('end')+'" data-c="'+id+'" data-f="end" value="'+esc(c.end)+'"></div>'+
        '<div><label for="'+F('min')+'">Minutes (computed)</label><input id="'+F('min')+'" readonly tabindex="-1" value="'+(cMin(c)==null?'':cMin(c))+'"></div>'+
        '<div><label for="'+F('sup')+'">Supervisor</label><select id="'+F('sup')+'" data-c="'+id+'" data-f="sup">'+opts(sups.map(s=>[s.id,supLabel(s)]),c.sup,true)+'</select></div>'+
        '<div><label for="'+F('format')+'">Format</label><select id="'+F('format')+'" data-c="'+id+'" data-f="format">'+opts([['indiv','Individual (no other RBTs or trainees)'],['group','Small group (2 to '+rule('grpmax')+' RBTs)']],c.format||'indiv')+'</select></div>'+
        '<div data-grp="'+id+'"'+(c.format==='group'?'':' hidden')+'><label for="'+F('group')+'">Number of RBTs in the group</label><input id="'+F('group')+'" data-c="'+id+'" data-f="group" inputmode="numeric" value="'+esc(c.group)+'"></div>'+
        '<div><label for="'+F('mode')+'">How</label><select id="'+F('mode')+'" data-c="'+id+'" data-f="mode">'+opts(MODES.map(x=>[x[0],x[1]]),c.mode,true)+'</select></div>'+
        '<div><label for="'+F('obs')+'">Observed the RBT with a client?</label><select id="'+F('obs')+'" data-c="'+id+'" data-f="obs">'+opts([['yes','Yes'],['no','No']],c.obs,true)+'</select></div>'+
        '<div><label for="'+F('client')+'">Client code</label><input id="'+F('client')+'" data-c="'+id+'" data-f="client" list="clientCodes" value="'+esc(c.client)+'" spellcheck="false" autocomplete="off" placeholder="a code, not a name"></div>'+
      '</div>'+
      '<span class="lbl">Supervision activities</span><div class="rs-chips">'+SACT.map((t,j)=>'<label class="chip"><input type="checkbox" id="'+F('s'+j)+'" data-c="'+id+'" data-arr="sact" value="'+esc(t)+'"'+((c.sact||[]).includes(t)?' checked':'')+'> '+esc(t)+'</label>').join('')+'</div>'+
      '<span class="lbl">Content covered (RBT Test Content Outline, 3rd ed.)</span><div class="rs-chips">'+TCO.map((t,j)=>'<label class="chip"><input type="checkbox" id="'+F('a'+j)+'" data-c="'+id+'" data-arr="acts" value="'+esc(t)+'"'+((c.acts||[]).includes(t)?' checked':'')+'> '+esc(t)+'</label>').join('')+'</div>'+
      '<span class="lbl">How it was taught (behavior skills training)</span><div class="rs-chips">'+BST.map((t,j)=>'<label class="chip"><input type="checkbox" id="'+F('b'+j)+'" data-c="'+id+'" data-arr="bst" value="'+esc(t)+'"'+((c.bst||[]).includes(t)?' checked':'')+'> '+esc(t)+'</label>').join('')+'</div>'+
      '<div class="two"><div class="field"><label for="'+F('feedback')+'">Feedback given</label><textarea id="'+F('feedback')+'" data-c="'+id+'" data-f="feedback" rows="3" placeholder="what went well, one thing to change, and how">'+esc(c.feedback)+'</textarea></div>'+
      '<div class="field"><label for="'+F('follow')+'">The RBT&rsquo;s follow-up or goal for next time</label><textarea id="'+F('follow')+'" data-c="'+id+'" data-f="follow" rows="3" placeholder="what the RBT practises before the next contact">'+esc(c.follow)+'</textarea></div></div>'+
      '<div class="rs-ck" data-ckbox="'+id+'"'+(c.obs==='yes'?'':' hidden')+'><h4><span>Observation checklist (optional)</span><span id="'+F('score')+'">'+ckText(c)+'</span></h4>'+
        CHECK.map((t,j)=>{const v=(c.ck||{})[j]||'',nm='ck_'+id+'_'+j;return '<div class="rs-ckrow"><span class="t" id="'+nm+'_t">'+(j+1)+'. '+t+'</span><span class="yn" role="radiogroup" aria-labelledby="'+nm+'_t">'+
          [['y','Yes'],['n','No'],['na','N/A']].map(([v2,l])=>'<label class="'+v2+'"><input type="radio" name="'+nm+'" id="'+nm+'_'+v2+'" data-c="'+id+'" data-ck="'+j+'" value="'+v2+'"'+(v===v2?' checked':'')+'>'+l+'</label>').join('')+'</span></div>';}).join('')+'</div>'+
      '<div class="rs-cfoot"><span class="hint" id="'+F('issues')+'">'+issuesText(is,c)+'</span><button class="tool" type="button" data-cdel="'+id+'">Delete this contact</button></div>'+
    '</div></details>';}).join('')||'<p class="hint">No contacts recorded for '+keyLabel(curKey)+' yet.</p>';
  $('#contactCount').textContent=m.contacts.length?m.contacts.length+' contact'+(m.contacts.length===1?'':'s')+' this month':'';}
function ckText(c){const s=ckScore(c);return s?Math.round(s.pct)+'% ('+s.y+' of '+(s.y+s.n)+' scored'+(s.na?', '+s.na+' N/A':'')+')':'not scored';}
function issuesText(is,c){return is.length?is.map(x=>(x.lvl==='fail'?'✕ ':'')+esc(x.t)).join(' · '):cPlanned(c)?'Planned: counts once the date has passed.':'Counts toward the month.';}
function refreshContact(c){const card=$('details.rs-contact[data-cid="'+c.id+'"]');if(!card)return;const is=cIssues(c,curKey);
  card.querySelector('summary').innerHTML=cSummary(c,curKey);card.classList.toggle('bad',is.some(x=>x.lvl==='fail'));
  const g=card.querySelector('[data-grp]');if(g)g.hidden=c.format!=='group';const ck=card.querySelector('[data-ckbox]');if(ck)ck.hidden=c.obs!=='yes';
  const mi=$('#c_'+c.id+'_min');if(mi)mi.value=cMin(c)==null?'':cMin(c);const sc=$('#c_'+c.id+'_score');if(sc)sc.textContent=ckText(c);
  const iss=$('#c_'+c.id+'_issues');if(iss)iss.innerHTML=issuesText(is,c);}
function renderComp(){const s=stats(curKey),P=rule('pct');
  const fill=s.pct==null?0:Math.min(100,s.pct/(P*2)*100),mark=50;
  const verdict={ok:s.ended?'Compliant: every check is met.':'On track: every check is met so far.',pending:'In progress: '+s.checks.filter(c=>c.s==='pending').length+' check'+(s.checks.filter(c=>c.s==='pending').length===1?'':'s')+' not met yet.',fail:s.ended?'Not met: see the red marks.':'Needs attention: see the red marks.',none:s.ended?'No service recorded this month. If the RBT did not practise, tick No services this month.':'Nothing recorded yet.',na:'Not applicable: no services this month, so no supervision is required.'}[s.status];
  $('#compPanel').innerHTML='<div class="rs-comp" id="compBox" data-status="'+s.status+'"><h3>'+keyLabel(curKey)+'</h3>'+
    '<div class="pctwrap"><div class="pctbig">'+pctTxt(s.pct)+' <small>supervised, of '+P+'% needed</small></div>'+
    '<div class="rs-bar'+(s.pct!=null&&s.pct>=P-1e-9?' ok':'')+'" role="img" aria-label="'+pctTxt(s.pct)+' supervised against '+P+'%"><i style="width:'+fill.toFixed(1)+'%"></i><b style="left:'+mark+'%"></b></div>'+
    '<div class="need" id="needLine">'+(!s.hasService?'Enter the RBT&rsquo;s service days to see the minutes needed.':s.need>0?'<b>'+s.need+' more minute'+(s.need===1?'':'s')+'</b> of supervision needed for the hours so far'+(s.needPlanned>s.need?'; about '+s.needPlanned+' with the planned days':'')+'.':'Enough supervision for the hours so far'+(s.needPlanned>0?'; about '+s.needPlanned+' more minutes with the planned days':'')+'.')+'</div></div>'+
    '<ul>'+s.checks.map(c=>'<li data-check="'+c.k+'" data-s="'+c.s+'"><span class="rs-ico '+c.s+'" aria-hidden="true">'+ICO[c.s]+'</span><span class="what">'+esc(c.t)+'<small>'+esc(c.d)+'</small></span><span class="tag '+c.s+'">'+(c.s==='ok'?'met':c.s==='pending'?'not yet':c.s==='fail'?'not met':'—')+'</span></li>').join('')+'</ul>'+
    '<div class="verdictline '+(s.status==='none'?'na':s.status)+'" id="compVerdict">'+verdict+'</div>'+
    '<table aria-label="Monthly totals"><tbody>'+
      '<tr><td>Days the RBT provided services</td><td class="n" id="tDays">'+s.daysServed+'</td></tr>'+
      '<tr><td>Real-time (face-to-face) contacts</td><td class="n" id="tContacts">'+s.cnt.length+'</td></tr>'+
      '<tr><td>Observations with a client</td><td class="n" id="tObs">'+s.obs+'</td></tr>'+
      '<tr><td>Total RBT hours</td><td class="n" id="tRbt">'+hrs(s.rbtMin)+'</td></tr>'+
      '<tr><td>Supervision hours</td><td class="n" id="tSup">'+hrs(s.supMin)+'</td></tr>'+
      '<tr><td>Percent supervised (minimum '+P+'%)</td><td class="n" id="tPct">'+pctTxt(s.pct)+'</td></tr>'+
      (s.ck!=null?'<tr><td>Observation checklist, average</td><td class="n">'+Math.round(s.ck)+'%</td></tr>':'')+
    '</tbody></table><div class="fine">Amber: not yet, the month is still open. Red: not met after the month ended, or a contact that cannot count. Check against the current BACB RBT Handbook (updated 06/2026).</div></div>';
  const b=$('#monthBar button[data-month="'+curKey+'"]');if(b){b.querySelector('small').innerHTML='<i class="st st-'+s.status+'"></i>'+STW[s.status];}}

/* ---------------- the year ---------------- */
function renderYear(){const y=setupYear(),ks=yearKeys(y),A=ks.map(stats);
  $('#yearTitle').textContent='The Year: August '+y+' to July '+(y+1);
  const rbt=A.reduce((s,a)=>s+a.rbtMin,0),sup=A.reduce((s,a)=>s+a.supMin,0),done=A.filter(a=>a.ended&&a.hasService),okN=done.filter(a=>a.status==='ok').length,cks=A.filter(a=>a.ck!=null);
  $('#yearMetrics').innerHTML='<div class="metric"><b>RBT hours</b><div class="val">'+hrs(rbt)+'</div><div class="sub">'+A.reduce((s,a)=>s+a.daysServed,0)+' days of service</div></div>'+
    '<div class="metric"><b>Supervision hours</b><div class="val">'+hrs(sup)+'</div><div class="sub">'+A.reduce((s,a)=>s+a.cnt.length,0)+' contacts that count</div></div>'+
    '<div class="metric '+(rbt&&sup/rbt*100>=rule('pct')?'m-ok':rbt?'m-mid':'')+'"><b>Percent supervised</b><div class="val">'+pctTxt(rbt?sup/rbt*100:null)+'</div><div class="sub">across the year; each month must meet '+rule('pct')+'% on its own</div></div>'+
    '<div class="metric '+(done.length?(okN===done.length?'m-ok':'m-no'):'')+'"><b>Months compliant</b><div class="val">'+okN+' of '+done.length+'</div><div class="sub">ended months with service</div></div>'+
    '<div class="metric"><b>Observation checklist</b><div class="val">'+(cks.length?Math.round(cks.reduce((s,a)=>s+a.ck,0)/cks.length)+'%':'—')+'</div><div class="sub">'+(cks.length?'average of '+cks.length+' month'+(cks.length===1?'':'s'):'no checklist scored')+'</div></div>';
  const stTxt=a=>a.status==='ok'?(a.ended?'Yes':'On track'):a.status==='fail'?'No':a.status==='pending'?'In progress':a.status==='na'?'n/a (no services)':'—';
  $('#yearTbl').innerHTML='<thead><tr><th>Month</th><th>Days</th><th>RBT hours</th><th>Supervision hours</th><th>% supervised</th><th>Contacts</th><th>Individual</th><th>Observed with client</th><th>Checklist</th><th>Compliant</th></tr></thead><tbody>'+
    A.map(a=>'<tr class="open'+(a.k===curKey?' cur':'')+'" data-open-month="'+a.k+'" tabindex="0" role="button" aria-label="Open '+keyLabel(a.k)+'"><td>'+keyLabel(a.k)+'</td><td>'+(a.daysServed||'—')+'</td><td>'+(a.rbtMin?hrs(a.rbtMin):'—')+'</td><td>'+(a.supMin?hrs(a.supMin):'—')+'</td><td>'+pctTxt(a.pct)+'</td><td>'+(a.cnt.length||(a.C.length?'0':'—'))+'</td><td>'+(a.C.length?a.indiv:'—')+'</td><td>'+(a.C.length?a.obs:'—')+'</td><td>'+(a.ck!=null?Math.round(a.ck)+'%':'—')+'</td><td><span class="tag '+(a.status==='none'?'na':a.status)+'">'+(a.status==='ok'?'✓ ':a.status==='fail'?'✕ ':'')+stTxt(a)+'</span></td></tr>').join('')+
    '<tr class="tot"><td>The year</td><td>'+A.reduce((s,a)=>s+a.daysServed,0)+'</td><td>'+hrs(rbt)+'</td><td>'+hrs(sup)+'</td><td>'+pctTxt(rbt?sup/rbt*100:null)+'</td><td>'+A.reduce((s,a)=>s+a.cnt.length,0)+'</td><td>'+A.reduce((s,a)=>s+a.indiv,0)+'</td><td>'+A.reduce((s,a)=>s+a.obs,0)+'</td><td></td><td>'+okN+' of '+done.length+'</td></tr></tbody>';
  const cw=Math.max(340,Math.min(1100,$('#yearChart').clientWidth||720));$('#yearChart').innerHTML=pctChart(A,false,cw);$('#ckChart').innerHTML=ckChart(A,false,cw);}
/* the charts are drawn at the width they are shown (text stays readable on a phone); drawn again when that changes */
let yrT=0;window.addEventListener('resize',()=>{clearTimeout(yrT);yrT=setTimeout(()=>{if(/view-year/.test(document.body.className))renderYear();},250);});
/* % supervised by month: one series of bars against the rule's line (the table above carries the same numbers) */
function pctChart(A,paper,cw){const W=cw||720,H=paper?190:230,L=40,R=10,T=18,B=30,P=rule('pct'),mx=Math.max(P*2,Math.ceil(Math.max(0,...A.map(a=>a.pct||0))+1)),bw=(W-L-R)/12,yv=v=>T+(H-T-B)*(1-v/mx);
  let g='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Percent of service hours supervised by month, against the '+P+'% minimum">';
  const step=mx<=12?2:mx<=30?5:10;for(let v=0;v<=mx;v+=step)g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(v)+'" y2="'+yv(v)+'" stroke="#E3E9ED"/><text x="'+(L-6)+'" y="'+(yv(v)+4)+'" font-size="11" text-anchor="end" fill="#54676f">'+v+'%</text>';
  A.forEach((a,i)=>{const x=L+i*bw+bw*0.2,w=bw*0.6;if(a.pct!=null){const y=yv(Math.min(a.pct,mx)),h=yv(0)-y;g+='<g><title>'+keyLabel(a.k)+': '+pctTxt(a.pct)+' ('+hrs(a.supMin)+' of '+hrs(a.rbtMin)+' h)</title><path d="M'+x+','+yv(0)+'V'+(y+3)+'q0,-3 3,-3h'+(w-6)+'q3,0 3,3V'+yv(0)+'z" fill="#254657"/>'+
      '<text x="'+(x+w/2)+'" y="'+(y-4)+'" font-size="11" text-anchor="middle" fill="#1a2933">'+(Math.round(a.pct*10)/10)+'</text></g>';}
    g+='<text x="'+(L+i*bw+bw/2)+'" y="'+(H-B+15)+'" font-size="11" text-anchor="middle" fill="#1a2933">'+MON[+a.k.slice(5)-1].slice(0,3)+'</text>'+(a.status==='fail'?'<text x="'+(L+i*bw+bw/2)+'" y="'+(H-B+27)+'" font-size="10" text-anchor="middle" fill="#8E2A2A">'+(bw<50?'✕':'✕ not met')+'</text>':'');});
  g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(P)+'" y2="'+yv(P)+'" stroke="#9b4e15" stroke-width="1.6" stroke-dasharray="6 4"/><text x="'+(W-R)+'" y="'+(yv(P)-5)+'" font-size="11" text-anchor="end" fill="#7a420f">'+P+'% minimum</text>';
  g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(0)+'" y2="'+yv(0)+'" stroke="#93aead"/></svg>';return g;}
function ckChart(A,paper,cw){const W=cw||720,H=paper?150:190,L=40,R=10,T=24,B=24,bw=(W-L-R)/12,yv=v=>T+(H-T-B)*(1-v/100),pts=[];
  let g='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Observation checklist average by month">';
  [0,25,50,75,100].forEach(v=>{g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(v)+'" y2="'+yv(v)+'" stroke="#E3E9ED"/><text x="'+(L-6)+'" y="'+(yv(v)+4)+'" font-size="11" text-anchor="end" fill="#54676f">'+v+'%</text>';});
  g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yv(90)+'" y2="'+yv(90)+'" stroke="#93aead" stroke-dasharray="4 3"/><text x="'+(W-R)+'" y="'+(yv(90)+13)+'" font-size="10.5" text-anchor="end" fill="#54676f">90% solid</text>';
  A.forEach((a,i)=>{const x=L+i*bw+bw/2;g+='<text x="'+x+'" y="'+(H-B+15)+'" font-size="11" text-anchor="middle" fill="#1a2933">'+MON[+a.k.slice(5)-1].slice(0,3)+'</text>';if(a.ck!=null)pts.push([x,yv(a.ck),a]);});
  if(pts.length>1)g+='<polyline points="'+pts.map(p=>p[0]+','+p[1]).join(' ')+'" fill="none" stroke="#254657" stroke-width="2"/>';
  pts.forEach(p=>{g+='<g><title>'+keyLabel(p[2].k)+': '+Math.round(p[2].ck)+'% ('+p[2].ckN+' checklist'+(p[2].ckN===1?'':'s')+')</title><circle cx="'+p[0]+'" cy="'+p[1]+'" r="5" fill="#fff" stroke="#254657" stroke-width="2"/><text x="'+p[0]+'" y="'+(p[1]-9)+'" font-size="11" text-anchor="middle" fill="#1a2933">'+Math.round(p[2].ck)+'</text></g>';});
  if(!pts.length)g+='<text x="'+(W/2)+'" y="'+(H/2)+'" font-size="12" text-anchor="middle" fill="#54676f">No observation checklist scored this year yet</text>';
  return g+'</svg>';}

/* ---------------- goals and the credential ---------------- */
function renderRbt(){
  $('#goalList').innerHTML=S.goals.map((g,i)=>{const id=esc(g.id),F=f=>'g_'+id+'_'+f;const late=g.status!=='Met'&&g.target&&g.target<todayISO();
    return '<div class="rs-goal" data-gid="'+id+'"><div class="gh"><span>Goal '+(i+1)+(late?' · <b style="color:#8E2A2A">past its target date</b>':g.status==='Met'?' · <b style="color:#2F6B37">met</b>':'')+'</span><button type="button" class="rowDel" data-del="goal" data-i="'+id+'" title="Delete this goal" aria-label="Delete goal '+(i+1)+'">&times;</button></div>'+
      '<div class="field"><label for="'+F('goal')+'">The goal</label><textarea id="'+F('goal')+'" data-g="'+id+'" data-f="goal" rows="2" placeholder="e.g., delivers praise within 3 seconds of the target skill in 9 of 10 opportunities">'+esc(g.goal)+'</textarea></div>'+
      '<div class="fieldgrid"><div><label for="'+F('set')+'">Date set</label><input type="date" id="'+F('set')+'" data-g="'+id+'" data-f="set" value="'+esc(g.set)+'"></div><div><label for="'+F('target')+'">Target date</label><input type="date" id="'+F('target')+'" data-g="'+id+'" data-f="target" value="'+esc(g.target)+'"></div>'+
      '<div><label for="'+F('status')+'">Status</label><select id="'+F('status')+'" data-g="'+id+'" data-f="status">'+opts(GSTAT,g.status||'Not started')+'</select></div></div>'+
      '<div class="field"><label for="'+F('notes')+'">Notes</label><textarea id="'+F('notes')+'" data-g="'+id+'" data-f="notes" rows="2" placeholder="progress seen at the contacts; what helped">'+esc(g.notes)+'</textarea></div></div>';}).join('')||'<p class="hint">No goals yet.</p>';
  const met=S.goals.filter(g=>g.status==='Met').length;$('#goalCount').textContent=S.goals.length?met+' of '+S.goals.length+' met':'';
  $$('[data-cr]').forEach(el=>{el.value=S.cred[el.dataset.cr]||'';});
  renderPdus();renderCred();renderConcerns();}
function renderPdus(){$('#pduTbl tbody').innerHTML=S.pdus.map((p,i)=>{const id=esc(p.id),F=f=>'p_'+id+'_'+f,w=pduWarn(p);return '<tr data-pid="'+id+'"><td data-l="Date"><input type="date" id="'+F('date')+'" data-p="'+id+'" data-f="date" value="'+esc(p.date)+'" aria-label="PDU '+(i+1)+' date"></td><td data-l="Title"><input id="'+F('title')+'" data-p="'+id+'" data-f="title" value="'+esc(p.title)+'" aria-label="PDU '+(i+1)+' title"><div class="hint" id="'+F('warn')+'" style="color:#8E2A2A">'+esc(w)+'</div></td><td data-l="Type"><select id="'+F('type')+'" data-p="'+id+'" data-f="type" aria-label="PDU '+(i+1)+' type">'+opts(PTYPES.map(t=>[t[0],t[1]]),p.type,true)+'</select></td><td data-l="Provider"><input id="'+F('provider')+'" data-p="'+id+'" data-f="provider" value="'+esc(p.provider)+'" aria-label="PDU '+(i+1)+' provider"></td><td data-l="Units"><input id="'+F('units')+'" data-p="'+id+'" data-f="units" inputmode="decimal" value="'+esc(p.units)+'" aria-label="PDU '+(i+1)+' units"></td><td class="num" data-l="Ethics"><input type="checkbox" id="'+F('ethics')+'" data-p="'+id+'" data-f="ethics"'+(p.ethics?' checked':'')+' aria-label="PDU '+(i+1)+' covers ethics" style="width:24px;height:24px;min-height:0"></td>'+delCell('pdu',p.id,'PDU')+'</tr>';}).join('')||'<tr><td colspan="7" class="hint">No PDUs logged yet.</td></tr>';pduOut();}
/* why a PDU entry would not count: the wrong kind, outside the cycle, or a title that reads as supervision or one client's training */
function pduWarn(p){const t=ptOf(p.type),c0=S.cred.cycle_start,c1=S.cred.cycle_end;
  if(t&&!t[2])return 'Does not count: ongoing supervision, client-specific training and supervised fieldwork are never PDUs.';
  if(/supervis|fieldwork|client[- ]specific/i.test(p.title||''))return 'Check: supervision, client-specific training and fieldwork never count as PDUs.';
  if(p.date&&((c0&&p.date<c0)||(c1&&p.date>c1)))return 'Outside the cycle: PDUs count only inside it.';
  if(p.title&&!t)return 'Choose the type.';return '';}
const pduCounts=p=>{const t=ptOf(p.type),c0=S.cred.cycle_start,c1=S.cred.cycle_end;return !!(t&&t[2])&&!(p.date&&((c0&&p.date<c0)||(c1&&p.date>c1)));};
function pduTot(){const L=S.pdus.filter(pduCounts);return {u:L.reduce((s,p)=>s+(num(p.units)||0),0),e:L.filter(p=>p.ethics).reduce((s,p)=>s+(num(p.units)||0),0),n:L.length,x:S.pdus.length-L.length};}
function pduOut(){const t=pduTot(),need=rule('pdu'),f=Math.min(100,need?t.u/need*100:0);S.pdus.forEach(p=>{const w=document.getElementById('p_'+p.id+'_warn');if(w)w.textContent=pduWarn(p);});
  $('#pduOut').innerHTML='<div class="metric '+(t.u>=need?'m-ok':'m-mid')+'" id="pduMetric" style="max-width:560px"><b>PDUs this cycle</b><div class="val">'+(Math.round(t.u*10)/10)+' of '+need+'</div><div class="rs-bar'+(t.u>=need?' ok':'')+'"><i style="width:'+f.toFixed(1)+'%"></i></div><div class="sub">'+(t.u>=need?'The target is met.':(Math.round((need-t.u)*10)/10)+' to go')+' · '+(Math.round(t.e*10)/10)+' in ethics'+(t.x?' · '+t.x+' entr'+(t.x===1?'y does':'ies do')+' not count':'')+(S.cred.cycle_start?' · cycle '+mdy(S.cred.cycle_start)+(S.cred.cycle_end?' to '+mdy(S.cred.cycle_end):''):'')+'</div></div>';}
function compWin(){const e=fromIso(S.setup.rbt_exp);if(!e)return null;const a=new Date(e);a.setDate(a.getDate()-rule('remind'));return {from:isoOf(a),to:S.setup.rbt_exp};}
function credState(){const st=S.setup,d=daysUntil(st.rbt_exp),r1=rule('remind'),r2=rule('remind2'),w=compWin();
  if(d==null)return {lvl:'',t:'Enter the current expiration date on the Setup page to see the days left.'};
  const what=st.path==='renewal'?'the Recertification Competency Assessment (window '+mdy(w.from)+' to '+mdy(w.to)+') and the recertification application':st.path==='recert'?'the recertification ('+rule('pdu')+' PDUs in the cycle)':'the recertification';
  if(d<0)return {lvl:'no',d,t:'The certification expired '+(-d)+' day'+(d===-1?'':'s')+' ago ('+mdy(st.rbt_exp)+'). The RBT is inactive and may not practise or bill; reinstatement is possible for 30 days after the expiration date, with a late fee'+(d<-30?' (that period has passed: check with the BACB)':'')+'.'};
  if(d<=r1)return {lvl:'no',d,t:d+' day'+(d===1?'':'s')+' left (expires '+mdy(st.rbt_exp)+'): '+what+' are due now.'};
  if(d<=r2)return {lvl:'mid',d,t:d+' days left (expires '+mdy(st.rbt_exp)+'): plan '+what+'.'};
  return {lvl:'ok',d,t:d+' days left (expires '+mdy(st.rbt_exp)+').'};}
function renderCred(){const st=S.setup,c=credState(),cr=S.cred,path=st.path,w=compWin();
  const extra=[];if(path==='renewal'){extra.push(cr.comp_date?'Competency assessment completed '+mdy(cr.comp_date)+(cr.comp_by?', overseen by '+cr.comp_by:'')+'.':'Competency assessment not recorded yet.');if(cr.comp_date&&w&&(cr.comp_date<w.from||cr.comp_date>w.to))extra.push('That date is outside the window ('+mdy(w.from)+' to '+mdy(w.to)+').');extra.push(cr.applied?'Application submitted '+mdy(cr.applied)+'.':'Application not submitted yet.');}
  if(path==='recert'){const t=pduTot();extra.push('PDUs: '+(Math.round(t.u*10)/10)+' of '+rule('pdu')+'.');}
  $('#credPanel').innerHTML='<div class="metrics"><div class="metric"><b>RBT</b><div class="val" style="font-size:17px">'+esc(st.rbt_name||'—')+'</div><div class="sub">'+esc(st.rbt_cert||'no certification number')+(st.rbt_orig?' · certified '+mdy(st.rbt_orig):'')+'</div></div>'+
    '<div class="metric '+(c.lvl==='ok'?'m-ok':c.lvl==='mid'?'m-mid':c.lvl==='no'?'m-no':'')+'" id="expMetric"><b>Days until expiration</b><div class="val">'+(c.d==null?'—':c.d)+'</div><div class="sub">'+(st.rbt_exp?mdy(st.rbt_exp):'no date')+'</div></div>'+
    '<div class="metric"><b>Path</b><div class="val" style="font-size:16px">'+(path==='renewal'?'2026 recertification with competency assessment':path==='recert'?'Two-year cycle with PDUs':'not chosen')+'</div><div class="sub">on the Setup page</div></div></div>'+
    '<div class="verdict '+(c.lvl?'v-'+c.lvl:'')+'" id="credVerdict">'+esc(c.t)+(extra.length?' '+esc(extra.join(' ')):'')+' Reminders from '+rule('remind2')+' and '+rule('remind')+' days before.</div>';
  $('#compWindow').innerHTML=w?'<div class="verdict '+(c.d!=null&&c.d<=rule('remind')&&c.d>=0?'v-mid':'')+'">The competency assessment window: <b>'+mdy(w.from)+' to '+mdy(w.to)+'</b> (no more than '+rule('remind')+' days before the expiration date).</div>':'<p class="hint">Enter the expiration date on the Setup page to see the window.</p>';
  $('#renewBox').hidden=path==='recert';$('#pduBox').hidden=path==='renewal';}
/* concerns and corrective action: confidential, per RBT; printed only from their own button */
function renderConcerns(){$('#concernList').innerHTML=S.concerns.map((c,i)=>{const id=esc(c.id),F=f=>'cn_'+id+'_'+f;
  return '<div class="rs-concern" data-cnid="'+id+'"><div class="gh"><span>Concern '+(i+1)+(c.outcome_date?' · outcome recorded '+mdy(c.outcome_date):'')+'</span><button type="button" class="rowDel" data-del="concern" data-i="'+id+'" title="Delete this concern" aria-label="Delete concern '+(i+1)+'">&times;</button></div>'+
    '<div class="fieldgrid"><div><label for="'+F('date')+'">Date the supervisor became aware</label><input type="date" id="'+F('date')+'" data-cn="'+id+'" data-f="date" value="'+esc(c.date)+'"></div>'+
    '<div><label for="'+F('decision')+'">Decision</label><select id="'+F('decision')+'" data-cn="'+id+'" data-f="decision">'+opts(DECIDE,c.decision,true)+'</select></div></div>'+
    '<div class="field"><label for="'+F('concern')+'">The concern</label><textarea id="'+F('concern')+'" data-cn="'+id+'" data-f="concern" rows="2" placeholder="what was seen or reported, when, by whom; observable terms">'+esc(c.concern)+'</textarea></div>'+
    '<div class="field"><label for="'+F('investigated')+'">How it was investigated</label><textarea id="'+F('investigated')+'" data-cn="'+id+'" data-f="investigated" rows="2" placeholder="who was spoken with, which records were reviewed, what was found">'+esc(c.investigated)+'</textarea></div>'+
    '<div class="field"><label for="'+F('plan')+'">Corrective-action plan: the steps</label><textarea id="'+F('plan')+'" data-cn="'+id+'" data-f="plan" rows="2" placeholder="one per line: the step, by whom, by when">'+esc(c.plan)+'</textarea></div>'+
    '<div class="fieldgrid"><div style="grid-column:1/-1"><label for="'+F('outcome')+'">Outcome</label><textarea id="'+F('outcome')+'" data-cn="'+id+'" data-f="outcome" rows="2">'+esc(c.outcome)+'</textarea></div><div><label for="'+F('outcome_date')+'">Outcome dated</label><input type="date" id="'+F('outcome_date')+'" data-cn="'+id+'" data-f="outcome_date" value="'+esc(c.outcome_date)+'"></div></div></div>';}).join('')||'<p class="hint">No concerns recorded.</p>';}
function renderConcernOut(){$('#concernOut').innerHTML='<div class="p-inner"><div class="p-title">Concerns and Corrective Action (confidential)</div>'+headHTML('')+
  (S.concerns.length?S.concerns.map((c,i)=>'<div class="p-keep"><h4>Concern '+(i+1)+(c.date?', '+mdy(c.date):'')+'</h4><table class="p-t"><tbody><tr><th style="width:24%">The concern</th><td>'+esc(c.concern)+'</td></tr><tr><th>Investigated</th><td>'+esc(c.investigated)+'</td></tr><tr><th>Decision</th><td>'+esc(c.decision)+'</td></tr><tr><th>Plan</th><td style="white-space:pre-wrap">'+esc(c.plan)+'</td></tr><tr><th>Outcome</th><td>'+esc(c.outcome)+(c.outcome_date?' ('+mdy(c.outcome_date)+')':'')+'</td></tr></tbody></table></div>').join(''):'<p class="p-empty">No concerns recorded.</p>')+
  '<div class="p-foot"><span>Confidential. Kept apart from the monthly supervision records. Source: BACB BCBA Handbook (updated 06/2026); check the current handbooks.</span><span>Form RS-1 · concerns · printed '+mdy(todayISO())+'</span></div></div>';}
/* ---------------- the printed records ---------------- */
function headHTML(k){const st=S.setup,sp=S.sups.filter(s=>s.name&&isSupRole(s)),rc=S.sups.filter(s=>s.name&&isRC(s));
  return '<div class="p-head"><div><b>Supervisee</b>'+esc(st.rbt_name||'')+(st.rbt_cred?', '+esc(st.rbt_cred):'')+'</div><div><b>BACB no.</b>'+esc(st.rbt_cert||'')+'</div><div><b>Expires</b>'+esc(mdy(st.rbt_exp))+'</div>'+
    '<div><b>Employer</b>'+esc(st.employer||'')+'</div><div><b>Site</b>'+esc(st.site||'')+'</div><div><b>'+(k?'Month':'School year')+'</b>'+(k?keyLabel(k):setupYear()+'–'+(setupYear()+1))+'</div>'+
    '<div style="grid-column:1/-1"><b>RBT Supervisors</b>'+(sp.map(s=>esc(s.name)+(s.cred?', '+esc(s.cred):'')+(s.cert?' ('+esc(s.cert)+')':'')+(s.trained==='yes'?', supervisor training'+(s.trained_date?' '+esc(mdy(s.trained_date)):''):'')).join('; ')||'')+(rc.length?' &nbsp; <b>Requirements Coordinator</b>'+rc.map(s=>esc(s.name)+(s.cred?', '+esc(s.cred):'')).join('; '):'')+'</div>'+
    '<div style="grid-column:1/-1"><b>Client codes</b>'+esc(clientCodes().join(', '))+'</div></div>';}
const okTxt=s=>s==='ok'?'<span class="p-ok">✓ met</span>':s==='fail'?'<span class="p-no">✕ not met</span>':s==='pending'?'<span class="p-mid">not yet</span>':'—';
function renderMonthOut(){const k=curKey,m=peek(k),s=stats(k),sg=m.sig||{},today=todayISO();
  const days=m.days.filter(d=>d.date&&keyOf(d.date)===k).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const C=s.C.slice().sort((a,b)=>String(a.c.date).localeCompare(String(b.c.date)));
  const sigImg=v=>v&&/^data:image\/png;base64,/.test(v)?'<img src="'+v+'" alt="signature">':'';
  $('#monthOut').innerHTML='<div class="p-inner"><div class="p-title">RBT Supervision Record: '+keyLabel(k)+'</div>'+headHTML(k)+
    '<h4>Service days</h4>'+(days.length?'<table class="p-t"><thead><tr><th style="width:15%">Date</th><th style="width:12%">Start</th><th style="width:12%">End</th><th style="width:10%">Hours</th><th>Primary intervention</th></tr></thead><tbody>'+
      days.map(d=>{const mi=dayMin(d);return '<tr'+(d.none?' class="none"':'')+'><td>'+wdOf(d.date)+' '+mdy(d.date)+'</td><td>'+esc(fmtHM(d.start))+'</td><td>'+esc(fmtHM(d.end))+'</td><td class="n">'+(d.none?'0':hrs(mi))+(num(d.brk)&&!d.none?'<small> (−'+num(d.brk)+' min)</small>':'')+'</td><td>'+(d.none?'No service':esc(d.act||''))+(!d.none&&d.date>today?' (planned)':'')+'</td></tr>';}).join('')+
      '<tr><td colspan="3"><b>'+s.daysServed+' day'+(s.daysServed===1?'':'s')+' of service</b></td><td class="n"><b>'+hrs(s.rbtMin)+'</b></td><td></td></tr></tbody></table>':'<p class="p-empty">No service days recorded.</p>')+
    '<h4>Supervision contacts</h4>'+(C.length?'<table class="p-t"><thead><tr><th style="width:11%">Date</th><th style="width:13%">Time</th><th style="width:6%">Min</th><th style="width:17%">Supervisor</th><th style="width:13%">Format and mode</th><th style="width:9%">Observed with client</th><th>Activities, content, method</th><th style="width:8%">Checklist</th></tr></thead><tbody>'+
      C.map(x=>{const c=x.c,sp=supById(c.sup),mo=modeOf(c.mode),sc=c.obs==='yes'?ckScore(c):null;return '<tr><td>'+esc(mdy(c.date))+'</td><td>'+esc(fmtHM(c.start))+(c.end?'–'+esc(fmtHM(c.end)):'')+'</td><td class="n">'+(x.min==null?'—':x.min)+'</td><td>'+esc(supLabel(sp))+'</td><td>'+(c.format==='group'?'Small group'+(num(c.group)?' ('+num(c.group)+' RBTs)':''):'Individual')+'; '+esc(mo?mo[1]:'')+'</td><td>'+(c.obs==='yes'?'Yes'+(c.client?', '+esc(c.client):''):c.obs==='no'?'No':'')+'</td><td>'+esc((c.sact||[]).join('; '))+((c.sact||[]).length&&(c.acts||[]).length?'<br>':'')+esc((c.acts||[]).join('; '))+((c.bst||[]).length?'<br><i>'+esc(c.bst.join(', '))+'</i>':'')+'</td><td class="n">'+(sc?Math.round(sc.pct)+'%':'—')+'</td></tr>'+
        ((c.feedback||c.follow||!x.counts)?'<tr class="sub"><td colspan="8">'+(c.feedback?'<b>Feedback:</b> '+esc(c.feedback)+' ':'')+(c.follow?'<b>Next:</b> '+esc(c.follow)+' ':'')+(!x.counts?'<b class="p-no">Not counted:</b> '+esc(x.is.map(i=>i.t).join('; ')||'planned'):'')+'</td></tr>':'');}).join('')+'</tbody></table>':'<p class="p-empty">No supervision contacts recorded.</p>')+
    '<div class="p-keep"><h4>Totals and compliance</h4><div class="p-two"><table class="p-t"><tbody>'+
      '<tr><td>Days the RBT provided services</td><td class="n">'+s.daysServed+'</td></tr><tr><td>Real-time (face-to-face) contacts</td><td class="n">'+s.cnt.length+'</td></tr><tr><td>Observations with a client</td><td class="n">'+s.obs+'</td></tr>'+
      '<tr><td>Total RBT hours</td><td class="n">'+hrs(s.rbtMin)+'</td></tr><tr><td>Supervision hours</td><td class="n">'+hrs(s.supMin)+'</td></tr><tr><td><b>Percent supervised (minimum '+rule('pct')+'%)</b></td><td class="n"><b>'+pctTxt(s.pct)+'</b></td></tr></tbody></table>'+
      '<table class="p-t"><tbody>'+s.checks.map(c=>'<tr><td>'+esc(c.t)+'</td><td class="n">'+okTxt(c.s)+'</td></tr>').join('')+'<tr><td><b>The month</b></td><td class="n"><b>'+(s.status==='ok'?(s.ended?'<span class="p-ok">✓ compliant</span>':'<span class="p-ok">on track</span>'):s.status==='fail'?'<span class="p-no">✕ not compliant</span>':s.status==='pending'?'<span class="p-mid">in progress</span>':s.status==='na'?'not applicable (no services)':'no service')+'</b></td></tr></tbody></table></div>'+
      '<p style="margin:4px 0 0"><b>Direct observations with a client:</b> '+(s.obsDates.length?s.obsDates.map(mdy).join(', '):'none')+'.</p>'+
      '<p style="margin:2px 0 0"><b>Supervisor&ndash;client oversight:</b> '+(s.usedSups.length?s.usedSups:S.sups.filter(x=>x.name&&isSupRole(x))).map(x=>esc(x.name)+': '+esc((OVERS.find(o=>o[0]===x.oversight)||[0,'not recorded'])[1].toLowerCase())+(x.oversight_note?' ('+esc(x.oversight_note)+')':'')).join('; ')+'.</p>'+
      (m.records?'<p style="margin:2px 0 0"><b>Other records:</b> '+esc(m.records)+'</p>':'')+
      (m.note?'<p style="margin:2px 0 0"><b>Notes:</b> '+esc(m.note)+'</p>':'')+'</div>'+
    '<div class="p-keep"><h4>Verification</h4><p class="p-att">We verify that this record is accurate: the service days and hours, and each supervision contact, took place as recorded.</p>'+
      '<div class="p-sig"><div><div class="sl">'+sigImg(sg.sup_img)+'</div><div class="cap"><span>Supervisor: '+esc(sg.sup_name||'')+'</span><span>Date: '+esc(mdy(sg.sup_date))+'</span></div></div>'+
      '<div><div class="sl">'+sigImg(sg.rbt_img)+'</div><div class="cap"><span>RBT: '+esc(sg.rbt_name||'')+'</span><span>Date: '+esc(mdy(sg.rbt_date))+'</span></div></div></div></div>'+
    '<div class="p-foot"><span>Keep this record for at least 7 years, also after the supervision ends; in an audit the BACB typically allows 14 days to submit it. Source: BACB RBT Handbook and BCBA Handbook (updated 06/2026); check the current handbooks.</span><span>Form RS-1 · '+keyLabel(k)+'</span></div></div>';}
function renderYearOut(){const y=setupYear(),A=yearKeys(y).map(stats),st=S.setup,c=credState(),t=pduTot();
  const rbt=A.reduce((s,a)=>s+a.rbtMin,0),sup=A.reduce((s,a)=>s+a.supMin,0);
  $('#yearOut').innerHTML='<div class="p-inner"><div class="p-title">RBT Supervision: Year Summary, '+y+'–'+(y+1)+'</div>'+headHTML('')+
    '<h4>By month</h4><table class="p-t"><thead><tr><th>Month</th><th>Days</th><th>RBT hours</th><th>Supervision hours</th><th>% supervised</th><th>Contacts</th><th>Individual</th><th>Observed</th><th>Checklist</th><th>Compliant</th></tr></thead><tbody>'+
    A.map(a=>'<tr><td>'+keyLabel(a.k)+'</td><td class="n">'+(a.daysServed||'—')+'</td><td class="n">'+(a.rbtMin?hrs(a.rbtMin):'—')+'</td><td class="n">'+(a.supMin?hrs(a.supMin):'—')+'</td><td class="n">'+pctTxt(a.pct)+'</td><td class="n">'+(a.C.length?a.cnt.length:'—')+'</td><td class="n">'+(a.C.length?a.indiv:'—')+'</td><td class="n">'+(a.C.length?a.obs:'—')+'</td><td class="n">'+(a.ck!=null?Math.round(a.ck)+'%':'—')+'</td><td class="n">'+(a.status==='ok'?(a.ended?'<span class="p-ok">✓ yes</span>':'on track'):a.status==='fail'?'<span class="p-no">✕ no</span>':a.status==='pending'?'in progress':a.status==='na'?'n/a (no services)':'—')+'</td></tr>').join('')+
    '<tr><td><b>The year</b></td><td class="n"><b>'+A.reduce((s,a)=>s+a.daysServed,0)+'</b></td><td class="n"><b>'+hrs(rbt)+'</b></td><td class="n"><b>'+hrs(sup)+'</b></td><td class="n"><b>'+pctTxt(rbt?sup/rbt*100:null)+'</b></td><td class="n"><b>'+A.reduce((s,a)=>s+a.cnt.length,0)+'</b></td><td class="n">'+A.reduce((s,a)=>s+a.indiv,0)+'</td><td class="n">'+A.reduce((s,a)=>s+a.obs,0)+'</td><td></td><td></td></tr></tbody></table>'+
    '<div class="p-keep"><h4>Percent supervised by month</h4>'+pctChart(A,true)+'</div>'+
    '<div class="p-keep"><h4>The credential and the goals</h4><p style="margin:2px 0">'+esc(c.t)+(st.path==='recert'?' PDUs this cycle: '+(Math.round(t.u*10)/10)+' of '+rule('pdu')+' ('+(Math.round(t.e*10)/10)+' in ethics).':st.path==='renewal'?' Competency assessment: '+(S.cred.comp_date?mdy(S.cred.comp_date):'not recorded')+'; application: '+(S.cred.applied?mdy(S.cred.applied):'not submitted')+'.':'')+'</p>'+
    (S.goals.length?'<table class="p-t"><thead><tr><th>Goal</th><th style="width:12%">Set</th><th style="width:12%">Target</th><th style="width:12%">Status</th></tr></thead><tbody>'+S.goals.map(g=>'<tr><td>'+esc(g.goal)+(g.notes?'<br><i>'+esc(g.notes)+'</i>':'')+'</td><td>'+esc(mdy(g.set))+'</td><td>'+esc(mdy(g.target))+'</td><td>'+esc(g.status||'')+'</td></tr>').join('')+'</tbody></table>':'<p class="p-empty">No goals recorded.</p>')+'</div>'+
    '<div class="p-foot"><span>Keep supervision records for at least 7 years, also after the supervision ends; in an audit the BACB typically allows 14 days. Source: BACB RBT Handbook and BCBA Handbook (updated 06/2026); check the current handbooks.</span><span>Form RS-1 · year summary · printed '+mdy(todayISO())+'</span></div></div>';}
function renderSign(){const m=month(curKey),sg=m.sig;$('#signTitle').textContent='Sign the Record for '+keyLabel(curKey);
  $$('[data-sg]').forEach(el=>{el.value=sg[el.dataset.sg]||'';});
  const sp=S.sups.find(s=>s.name&&credOK(s.cred));$('#sgSup').placeholder=sp?supLabel(sp):'name, credential';$('#sgRbt').placeholder=S.setup.rbt_name?(S.setup.rbt_name+', '+(S.setup.rbt_cred||'RBT')):'name, RBT';
  $$('canvas.rs-pad').forEach(cv=>padDraw(cv,sg[cv.dataset.pad]));}
function renderPrint(){month(curKey);renderSign();renderMonthOut();renderYearOut();renderConcernOut();}

/* the signature pads: a finger or a stylus draws; the drawing is kept with the month as an image, which the record prints */
function padDraw(cv,src){const x=cv.getContext&&cv.getContext('2d');if(!x)return;x.clearRect(0,0,cv.width,cv.height);if(src&&/^data:image\/png;base64,/.test(src)){const im=new Image();im.onload=()=>{x.clearRect(0,0,cv.width,cv.height);x.drawImage(im,0,0);};im.src=src;}}
$$('canvas.rs-pad').forEach(cv=>{const x=cv.getContext&&cv.getContext('2d');if(!x)return;let on=false,last=null,drew=false;
  const pos=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};};
  cv.addEventListener('pointerdown',e=>{on=true;drew=false;last=pos(e);try{cv.setPointerCapture(e.pointerId);}catch(err){}e.preventDefault();});
  cv.addEventListener('pointermove',e=>{if(!on)return;const p=pos(e);x.lineWidth=2.4;x.lineCap='round';x.lineJoin='round';x.strokeStyle='#1a2933';x.beginPath();x.moveTo(last.x,last.y);x.lineTo(p.x,p.y);x.stroke();last=p;drew=true;e.preventDefault();});
  const end=()=>{if(!on)return;on=false;if(!drew)return;month(curKey).sig[cv.dataset.pad]=cv.toDataURL('image/png');renderMonthOut();changed();};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);});
$$('[data-padclear]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.padclear;delete month(curKey).sig[k];renderSign();renderMonthOut();changed();}));
/* a drawing lives in the saved data, not in a field: tell the workstation's autosave something changed */
function changed(){try{document.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}}

/* ---------------- events ---------------- */
function findDay(id){return month(curKey).days.find(d=>d.id===id);}
function findC(id){return month(curKey).contacts.find(c=>c.id===id);}
function onField(el,ev){
  const v=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.s!==undefined){if(el.dataset.s==='year'&&ev!=='change')return;S.setup[el.dataset.s]=v;
    if(el.dataset.s==='year'){curKey=defaultKey();renderMonthBar();}if(el.dataset.s==='clients')supLists();if(el.dataset.s==='path'||el.dataset.s==='rbt_exp')renderCred();if(el.dataset.s==='rbt_name'||el.dataset.s==='rbt_exp')renderWho();return;}
  if(el.dataset.wd!==undefined){const d=+el.dataset.wd,set=new Set(S.setup.days||[]);el.checked?set.add(d):set.delete(d);S.setup.days=[...set].sort();return;}
  if(el.dataset.r!==undefined){S.rules[el.dataset.r]=v;renderReq();renderComp();return;}
  if(el.dataset.sup!==undefined){const s=S.sups.find(x=>x.id===el.dataset.sup);if(!s)return;s[el.dataset.f]=v;supRefresh();if(ev==='change'){supLists();renderComp();}return;}
  if(el.dataset.d!==undefined){const d=findDay(el.dataset.d);if(!d)return;d[el.dataset.f]=v;
    if(ev==='change'&&(el.dataset.f==='date'||el.dataset.f==='none')){if(el.dataset.f==='date')month(curKey).days.sort((a,b)=>String(a.date||'9').localeCompare(String(b.date||'9')));renderDays();}
    else{const h=$('#h_'+d.id);if(h)h.textContent=d.none?'0':hrs(dayMin(d));dayTotals();}renderComp();return;}
  if(el.dataset.c!==undefined){const c=findC(el.dataset.c);if(!c)return;
    if(el.dataset.arr){const a=new Set(c[el.dataset.arr]||[]);el.checked?a.add(el.value):a.delete(el.value);c[el.dataset.arr]=({acts:TCO,bst:BST,sact:SACT}[el.dataset.arr]||[]).filter(x=>a.has(x));}
    else if(el.dataset.ck!==undefined){if(!c.ck)c.ck={};c.ck[el.dataset.ck]=el.value;}
    else c[el.dataset.f]=v;
    refreshContact(c);renderComp();return;}
  if(el.dataset.mo!==undefined){month(curKey)[el.dataset.mo]=v;if(el.dataset.mo==='noservice')renderMonth();return;}
  if(el.dataset.cn!==undefined){const c=S.concerns.find(x=>x.id===el.dataset.cn);if(c)c[el.dataset.f]=v;return;}
  if(el.dataset.g!==undefined){const g=S.goals.find(x=>x.id===el.dataset.g);if(g)g[el.dataset.f]=v;if(ev==='change'&&el.dataset.f!=='goal'&&el.dataset.f!=='notes')renderRbtKeep(el);return;}
  if(el.dataset.p!==undefined){const p=S.pdus.find(x=>x.id===el.dataset.p);if(p)p[el.dataset.f]=v;pduOut();renderCred();return;}
  if(el.dataset.cr!==undefined){S.cred[el.dataset.cr]=v;if(/^cycle/.test(el.dataset.cr))pduOut();renderCred();return;}
  if(el.dataset.sg!==undefined){month(curKey).sig[el.dataset.sg]=v;renderMonthOut();return;}
}
function renderRbtKeep(el){const id=el.id;renderRbt();const e=id&&document.getElementById(id);if(e)e.focus();}
document.addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset||el.type==='radio')return;if(el.tagName==='SELECT'||el.type==='checkbox')return;onField(el,'input');});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.dataset)return;onField(el,'change');});
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.matches&&d.matches('details.rs-contact')){d.open?openC.add(d.dataset.cid):openC.delete(d.dataset.cid);}},true);
document.addEventListener('click',e=>{
  const mb=e.target.closest('#monthBar button[data-month]');if(mb){curKey=mb.dataset.month;renderMonth();renderWho();return;}
  const wr=e.target.closest('tr[data-rbt]');if(wr){pickRbt(+wr.dataset.rbt);return;}
  const go=e.target.closest('[data-go]');if(go){setView(go.dataset.go);return;}
  const tr=e.target.closest('tr[data-open-month]');if(tr){curKey=tr.dataset.openMonth;setView('month');return;}
  const cd=e.target.closest('button[data-cdel]');if(cd){delContact(cd.dataset.cdel);return;}
  const b=e.target.closest('button.rowDel[data-del]');if(b){e.preventDefault();rowDel(b.dataset.del,b.dataset.i);}});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const tr=e.target.closest&&e.target.closest('tr[data-open-month]');if(tr){curKey=tr.dataset.openMonth;setView('month');}});
async function rowDel(r,id){
  if(r==='day'){const m=month(curKey),i=m.days.findIndex(d=>d.id===id);if(i<0)return;const d=m.days[i];if((d.act||d.start)&&!(await nbhUI.confirm('Delete the row for '+(d.date?wdOf(d.date)+' '+mdy(d.date):'this day')+'?\nIts times and intervention are deleted.',{ok:'Delete',danger:true})))return;m.days.splice(i,1);renderDays();renderComp();}
  if(r==='sup'){const i=S.sups.findIndex(s=>s.id===id);if(i<0)return;const s=S.sups[i],used=R.reduce((t,r)=>t+Object.values(r.months).reduce((n,m)=>n+(m.contacts||[]).filter(c=>c.sup===id).length,0),0);
    if((s.name||s.cert)&&!(await nbhUI.confirm('Delete '+(s.name||'this supervisor')+'?'+(used?'\n'+used+' contact'+(used===1?' names':'s name')+' this supervisor and will show no supervisor.':''),{ok:'Delete',danger:true})))return;S.sups.splice(i,1);if(!S.sups.length)S.sups.push(newSup());renderSups();}
  if(r==='concern'){const i=S.concerns.findIndex(c=>c.id===id);if(i<0)return;if(S.concerns[i].concern&&!(await nbhUI.confirm('Delete this concern?\nIts investigation, decision, plan and outcome are deleted; this cannot be undone.',{ok:'Delete',danger:true})))return;S.concerns.splice(i,1);renderConcerns();}
  if(r==='goal'){const i=S.goals.findIndex(g=>g.id===id);if(i<0)return;if(S.goals[i].goal&&!(await nbhUI.confirm('Delete this goal?\nThe goal, its dates and notes are deleted.',{ok:'Delete',danger:true})))return;S.goals.splice(i,1);renderRbt();}
  if(r==='pdu'){const i=S.pdus.findIndex(p=>p.id===id);if(i<0)return;if(S.pdus[i].title&&!(await nbhUI.confirm('Delete this PDU entry?',{ok:'Delete',danger:true})))return;S.pdus.splice(i,1);renderPdus();renderCred();}
  changed();}
async function delContact(id){const m=month(curKey),i=m.contacts.findIndex(c=>c.id===id);if(i<0)return;const c=m.contacts[i];
  if((c.feedback||c.start||c.sup)&&!(await nbhUI.confirm('Delete the contact of '+(c.date?mdy(c.date):'(no date)')+'?\nIts times, activities, feedback and checklist are deleted; this cannot be undone.',{ok:'Delete',danger:true})))return;
  m.contacts.splice(i,1);openC.delete(id);renderContacts();renderComp();changed();}
$('#addDay').addEventListener('click',()=>{const m=month(curKey),st=S.setup,[y,mo]=curKey.split('-').map(Number),have=new Set(m.days.map(d=>d.date));
  /* the next date after the last row (or the 1st) that has no row yet */
  let d=1;const lastRow=m.days.filter(x=>x.date).map(x=>+x.date.slice(8)).sort((a,b)=>b-a)[0];if(lastRow)d=lastRow+1;while(d<=lastDay(y,mo)&&have.has(iso(y,mo,d)))d++;
  m.days.push({id:uid(),date:d<=lastDay(y,mo)?iso(y,mo,d):'',start:st.day_start||'',end:st.day_end||'',brk:st.day_break||'',act:st.day_act||'',none:false});renderDays();renderComp();changed();});
$('#fillDays').addEventListener('click',()=>{const st=S.setup;if(!(st.days||[]).length){nbhUI.toast('Choose the usual service days on the Setup page first.',{kind:'warn'});return;}const n=fillMonth(curKey,true);renderDays();renderComp();changed();nbhUI.toast(n?n+' day'+(n===1?'':'s')+' added.':'Every usual day of the month already has a row.');});
$('#addContact').addEventListener('click',()=>{const m=month(curKey),t=todayISO(),sp=S.sups.find(s=>s.name&&credOK(s.cred)&&isSupRole(s))||S.sups.find(s=>s.name);
  const c={id:uid(),date:keyOf(t)===curKey?t:'',start:'',end:'',sup:sp?sp.id:'',format:'indiv',group:'',mode:'person',obs:'',client:clientCodes()[0]||'',acts:[],bst:[],sact:[],feedback:'',follow:'',ck:{}};
  m.contacts.push(c);openC.add(c.id);renderContacts();renderComp();changed();const e=$('#c_'+c.id+'_date');if(e){e.scrollIntoView({block:'center'});if(!c.date)e.focus();else{const s=$('#c_'+c.id+'_start');if(s)s.focus();}}});
$('#addSup').addEventListener('click',()=>{if(S.sups.length>=12)return;const n=newSup();S.sups.push(n);renderSups();const r=$('#sup_'+n.id+'_name');if(r)r.focus();changed();});
$('#addConcern').addEventListener('click',()=>{if(S.concerns.length>=40)return;const c={id:uid(),date:todayISO(),concern:'',investigated:'',decision:'',plan:'',outcome:'',outcome_date:''};S.concerns.push(c);renderConcerns();const e=$('#cn_'+c.id+'_concern');if(e)e.focus();changed();});
$('#printConcerns').addEventListener('click',()=>{if(!S.concerns.length){nbhUI.toast('No concerns are recorded.');return;}printOnly('rs-print-concerns');});
$('#addGoal').addEventListener('click',()=>{if(S.goals.length>=30)return;const g={id:uid(),goal:'',set:todayISO(),target:'',status:'Not started',notes:''};S.goals.push(g);renderRbt();const e=$('#g_'+g.id+'_goal');if(e)e.focus();changed();});
$('#addPdu').addEventListener('click',()=>{if(S.pdus.length>=100)return;const p={id:uid(),date:todayISO(),title:'',provider:'',units:'',type:'',ethics:false};S.pdus.push(p);renderPdus();renderCred();const e=$('#p_'+p.id+'_title');if(e)e.focus();changed();});
$('#rulesReset').addEventListener('click',()=>{S.rules={};renderSetup();renderComp();changed();});

/* the compliance panel stays in view under the toolbar on a wide screen */
function stickTop(){const tb=$('.toolbar');const h=tb&&getComputedStyle(tb).position==='sticky'?tb.getBoundingClientRect().height:0;document.documentElement.style.setProperty('--rs-top',Math.round(h+12)+'px');}
window.addEventListener('resize',stickTop);

/* ---------------- the supervisee on screen ---------------- */
/* the switcher at the top of every page: each supervisee with the month on screen; with more than one, a table of them all */
function renderWho(){const k=curKey||defaultKey(),i0=R.indexOf(S);
  const rows=eachRbt((r,i)=>{const s=stats(k);return {i,name:rbtName(r)||'(new RBT, no name yet)',s,exp:r.setup.rbt_exp,d:daysUntil(r.setup.rbt_exp)};});
  $('#rbtSel').innerHTML=rows.map(x=>'<option value="'+x.i+'"'+(x.i===i0?' selected':'')+'>'+esc(x.name)+(R.length>1?' \u2014 '+keyLabel(k)+': '+STW[x.s.status]:'')+'</option>').join('');
  $('#rbtCount').textContent=R.length===1?'1 supervisee in this file':R.length+' supervisees in this file';
  $('#delRbt').disabled=R.length<2;$('#addRbt').disabled=R.length>=RMAX;
  const w=$('#rbtAll');w.hidden=R.length<2;if(R.length<2){w.innerHTML='';return;}
  w.innerHTML='<table class="rs-who-t"><caption>Every supervisee, '+esc(keyLabel(k))+'</caption><thead><tr><th>RBT</th><th>% supervised</th><th>Contacts that count</th><th>Observed with client</th><th>This month</th><th>Certification expires</th></tr></thead><tbody>'+
    rows.map(x=>'<tr class="open'+(x.i===i0?' cur':'')+'" data-rbt="'+x.i+'" tabindex="0" role="button" aria-label="Show '+esc(x.name)+'"><td>'+esc(x.name)+'</td><td>'+(x.s.hasService?pctTxt(x.s.pct):'—')+'</td><td>'+x.s.cnt.length+' of '+rule('contacts')+'</td><td>'+x.s.obs+'</td><td><span class="rs-wst rs-wst-'+x.s.status+'">'+STW[x.s.status]+'</span></td><td>'+(x.exp?esc(mdy(x.exp))+(x.d!=null&&x.d>=0&&x.d<=rule('remind2')?' ('+x.d+' days)':x.d!=null&&x.d<0?' (expired)':''):'—')+'</td></tr>').join('')+'</tbody></table>';}
function pickRbt(i){if(!R[i]||R[i]===S)return;S=R[i];openC=new Set();renderAll();}
$('#rbtSel').addEventListener('change',e=>pickRbt(+e.target.value));
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const tr=e.target.closest&&e.target.closest('tr[data-rbt]');if(tr)pickRbt(+tr.dataset.rbt);});
$('#addRbt').addEventListener('click',()=>{if(R.length>=RMAX)return;const n=newRbt(),st=S.setup;
  /* the new supervisee starts in the same school year, with the usual days and hours of the one on screen */
  ['year','day_start','day_end','day_break','day_act','employer','site'].forEach(k=>{if(st[k])n.setup[k]=st[k];});n.setup.days=(st.days||[]).slice();
  R.push(n);S=n;openC=new Set();renderAll();setView('setup');const e=$('#sName');if(e)e.focus();changed();
  nbhUI.toast('A new supervisee was added. Enter the RBT\u2019s name and credential; the supervisors and rules are shared.',{kind:'ok'});});
$('#delRbt').addEventListener('click',async ()=>{if(R.length<2)return;const nm=rbtName(S)||'this supervisee';
  if(!(await nbhUI.confirm('Remove '+nm+' from this file?\nTheir setup, every month, the goals, the PDUs and the concerns are deleted; the supervisors stay. This cannot be undone.',{ok:'Remove',danger:true})))return;
  const i=R.indexOf(S);R.splice(i,1);S=R[Math.max(0,i-1)];openC=new Set();renderAll();changed();});

/* ---------------- render everything ---------------- */
function renderAll(){if(!curKey||!yearKeys(setupYear()).includes(curKey))curKey=defaultKey();renderWho();renderSetup();renderMonth();renderYear();renderRbt();renderPrint();stickTop();}

/* ---------------- printing: the month's record or the year summary, alone, on letter paper ---------------- */
function printOnly(cls){renderPrint();document.body.classList.add(cls);
  const st=document.createElement('style');st.id='rsPage';st.textContent='@media print{@page{size:letter portrait;margin:0.5in 0.5in 0.55in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove(cls);st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);}
$('#printBtn').addEventListener('click',()=>printOnly('rs-print-month'));
$('#printMonth2').addEventListener('click',()=>printOnly('rs-print-month'));
$('#yearPrintBtn').addEventListener('click',()=>printOnly('rs-print-year'));
$('#printYear2').addEventListener('click',()=>printOnly('rs-print-year'));
window.addEventListener('beforeprint',()=>{try{renderPrint();}catch(e){}});
/* the workstation's printed packet takes the two records, not the editing pages */
window.nbhPrintNodes=function(){renderPrint();return [$('#monthOut'),$('#yearOut')];};

/* ---------------- Save data / Open data (the form's own file; the workstation's case file carries the same) ---------------- */
$('#saveBtn').addEventListener('click',()=>{
  const nm=R.length>1?R.length+'_RBTs':String(S.setup.rbt_name||'RBT').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([(tidy(),JSON.stringify(saveObj(),null,1))],{type:'application/json'}));
  a.download='RS-1_'+nm+'_'+todayISO()+'.json';document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
/* the file: S is the supervisee on screen, with the shared supervisors and rules (a file with one RBT is written as before,
   and an older copy of the form opens S); with more than one, rbts holds every supervisee and cur the one on screen */
function saveObj(){const o={form:'RS-1',rev:'2026-10',saved:new Date().toISOString(),S};
  if(R.length>1){o.rbts=R.map(r=>{const x=Object.assign({},r);delete x.sups;delete x.rules;return x;});o.cur=R.indexOf(S);}
  return o;}
/* every supervisee of a file, each read field by field as below, sharing the supervisors and rules of S */
function rosterFrom(d){const first=fromFile(d);if(!first)return null;
  const list=Array.isArray(d.rbts)&&d.rbts.length?d.rbts.slice(0,RMAX):null;
  const rbts=list?list.map(x=>x&&typeof x==='object'&&!Array.isArray(x)?fromFile({form:'RS-1',S:Object.assign({},x,{sups:[],rules:{}})}):null).filter(Boolean):[first];
  if(!rbts.length)return null;
  const c=parseInt(d.cur,10);return {sups:first.sups,rules:first.rules,rbts,cur:c>=0&&c<rbts.length?c:0};}
function applyRoster(r){G.sups=r.sups;G.rules=r.rules;R=r.rbts.map(share);S=R[r.cur]||R[0];}
/* a saved file is read field by field into a fresh record: anything unexpected is dropped rather than trusted */
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='RS-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v).slice(0,4000),isoS=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'',hm=v=>/^\d{2}:\d{2}$/.test(String(v||''))?String(v):'',arr=v=>Array.isArray(v)?v:[];
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const su=obj(s.setup);Object.keys(su).forEach(k=>{if(k!=='days')o.setup[k]=str(su[k]);});o.setup.days=arr(su.days).map(Number).filter(n=>n>=0&&n<=6);
  ['rbt_orig','rbt_exp'].forEach(k=>{if(k in su)o.setup[k]=isoS(su[k]);});['day_start','day_end'].forEach(k=>{if(k in su)o.setup[k]=hm(su[k]);});
  const yn=v=>v==='yes'||v==='no'?v:'';
  o.sups=arr(s.sups).slice(0,12).map(x=>{x=obj(x);return {id:str(x.id)||uid(),name:str(x.name),cred:CREDS.includes(x.cred)?x.cred:'',cert:str(x.cert),role:ROLES.includes(x.role)?x.role:'',trained:yn(x.trained),trained_date:isoS(x.trained_date),portal:yn(x.portal),norel:!!x.norel,oversight:OVERS.some(o=>o[0]===x.oversight)?x.oversight:'',oversight_note:str(x.oversight_note)};});if(!o.sups.length)o.sups=blank().sups;
  const ru=obj(s.rules);Object.keys(RULES0).forEach(k=>{if(ru[k]!=null&&ru[k]!=='')o.rules[k]=str(ru[k]);});
  const ms=obj(s.months);Object.keys(ms).filter(k=>/^\d{4}-\d{2}$/.test(k)).slice(0,240).forEach(k=>{const m=obj(ms[k]),sg=obj(m.sig);
    o.months[k]={filled:!!m.filled,note:str(m.note),records:str(m.records),noservice:!!m.noservice,
      days:arr(m.days).slice(0,62).map(x=>({id:str(x&&x.id)||uid(),date:isoS(x&&x.date),start:hm(x&&x.start),end:hm(x&&x.end),brk:str(x&&x.brk),act:ACTS.includes(x&&x.act)?x.act:'',none:!!(x&&x.none)})),
      contacts:arr(m.contacts).slice(0,60).map(x=>{x=obj(x);const ck={};Object.keys(obj(x.ck)).forEach(i=>{if(+i>=0&&+i<CHECK.length&&['y','n','na'].includes(x.ck[i]))ck[+i]=x.ck[i];});
        return {id:str(x.id)||uid(),date:isoS(x.date),start:hm(x.start),end:hm(x.end),sup:str(x.sup),format:x.format==='group'?'group':'indiv',group:str(x.group),mode:modeOf(x.mode)?x.mode:'',obs:['yes','no'].includes(x.obs)?x.obs:'',client:str(x.client),
          acts:TCO.filter(t=>arr(x.acts).includes(t)),sact:SACT.filter(t=>arr(x.sact).includes(t)),bst:BST.filter(t=>arr(x.bst).includes(t)),feedback:str(x.feedback),follow:str(x.follow),ck};}),
      sig:{sup_name:str(sg.sup_name),sup_date:isoS(sg.sup_date),rbt_name:str(sg.rbt_name),rbt_date:isoS(sg.rbt_date),...(/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(String(sg.sup_img||''))&&String(sg.sup_img).length<400000?{sup_img:sg.sup_img}:{}),...(/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(String(sg.rbt_img||''))&&String(sg.rbt_img).length<400000?{rbt_img:sg.rbt_img}:{})}};
    if(!o.months[k].sig.sup_img)delete o.months[k].sig.sup_img;if(!o.months[k].sig.rbt_img)delete o.months[k].sig.rbt_img;});
  o.goals=arr(s.goals).slice(0,30).map(x=>({id:str(x&&x.id)||uid(),goal:str(x&&x.goal),set:isoS(x&&x.set),target:isoS(x&&x.target),status:GSTAT.includes(x&&x.status)?x.status:'Not started',notes:str(x&&x.notes)}));
  o.pdus=arr(s.pdus).slice(0,100).map(x=>({id:str(x&&x.id)||uid(),date:isoS(x&&x.date),title:str(x&&x.title),provider:str(x&&x.provider),units:str(x&&x.units),type:ptOf(x&&x.type)?x.type:'',ethics:!!(x&&x.ethics)}));
  o.concerns=arr(s.concerns).slice(0,40).map(x=>{x=obj(x);return {id:str(x.id)||uid(),date:isoS(x.date),concern:str(x.concern),investigated:str(x.investigated),decision:DECIDE.includes(x.decision)?x.decision:'',plan:str(x.plan),outcome:str(x.outcome),outcome_date:isoS(x.outcome_date)};});
  const cr=obj(s.cred);['comp_date','applied','cycle_start','cycle_end'].forEach(k=>{if(k in cr)o.cred[k]=isoS(cr[k]);});['comp_by','notes'].forEach(k=>{if(k in cr)o.cred[k]=str(cr[k]);});
  return o;}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='RS-1'?d.form:'';
    const next=other?null:rosterFrom(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved RS-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form RS-1. Nothing was changed.':'That file could not be read as a saved RS-1 form. Nothing was changed.');return;}
    const prev={sups:G.sups,rules:G.rules,rbts:R,cur:R.indexOf(S)};applyRoster(next);curKey='';openC=new Set();try{renderAll();}catch(err){applyRoster(prev);renderAll();alert('That file could not be read as a saved RS-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});

/* ---------------- CSV: the school year's service days and contacts, one row each ---------------- */
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"',y=setupYear();
  const head=['Record','Month','Date','Start','End','Minutes not in services','RBT hours','No service','Primary intervention','Contact minutes','Supervisor','Supervisor credential','Format','Group size','Mode','Counts','Observed with client','Client code','Supervision activities','Content (TCO areas)','Taught by (BST)','Checklist %','Feedback','Follow-up','RBT','RBT certification number'];
  const out=[head];
  /* every supervisee's rows for the school year on screen, one after the other (the last two columns say whose) */
  eachRbt(()=>{const st=S.setup;
  yearKeys(y).forEach(k=>{const m=peek(k),s=stats(k);
    m.days.filter(d=>d.date&&keyOf(d.date)===k).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(d=>{const mi=dayMin(d);out.push(['Service day',keyLabel(k),d.date,d.start,d.end,d.brk,d.none?'0':(mi==null?'':(mi/60).toFixed(2)),d.none?'yes':'',d.act,'','','','','','','','','','','','','','','',st.rbt_name,st.rbt_cert]);});
    s.C.slice().sort((a,b)=>String(a.c.date).localeCompare(String(b.c.date))).forEach(x=>{const c=x.c,sp=supById(c.sup),mo=modeOf(c.mode),sc=c.obs==='yes'?ckScore(c):null;
      out.push(['Supervision contact',keyLabel(k),c.date,c.start,c.end,'','','','',x.min==null?'':x.min,sp?sp.name:'',sp?sp.cred:'',c.format==='group'?'Small group':'Individual',c.format==='group'?c.group:'',mo?mo[1]:'',x.counts?'yes':'no'+(x.is.length?' ('+x.is.map(i=>i.t).join('; ')+')':' (planned)'),c.obs==='yes'?'yes':c.obs==='no'?'no':'',c.client,(c.sact||[]).join('; '),(c.acts||[]).join('; '),(c.bst||[]).join('; '),sc?Math.round(sc.pct):'',c.feedback,c.follow,st.rbt_name,st.rbt_cert]);});});});
  const nm=R.length>1?'all_RBTs':String(S.setup.rbt_name||'RBT').replace(/[^\w-]+/g,'_');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='RS-1_'+nm+'_'+y+'-'+(y+1)+'.csv';document.body.appendChild(a);a.click();a.remove();});

$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\n'+(R.length>1?'All '+R.length+' supervisees, ':'The setup, ')+'the supervisors, every month, the goals and the PDUs are cleared. Unsaved work will be lost.',{ok:'Clear all',danger:true})){resetAll();curKey='';openC=new Set();renderAll();setView('setup');}});
function resetAll(){G.sups=[newSup()];G.rules={};S=newRbt();R=[S];}

/* ---------------- simulation (simulated people and codes only) ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated year?\nA simulated RBT, two simulated supervisors and every month of this school year up to today are filled in as a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const now=new Date(),y=schoolYearOf(now),add=(dt,n)=>{const x=new Date(dt);x.setDate(x.getDate()+n);return x;};
  resetAll();openC=new Set();
  const A={id:'simA',name:'Simulated BCBA',cred:'BCBA',cert:'1-00-00000',role:'RBT Supervisor and Requirements Coordinator',trained:'yes',trained_date:isoOf(add(now,-420)),portal:'yes',norel:true,oversight:'employed',oversight_note:'both employed by the simulated district'},
    B={id:'simB',name:'Simulated BCaBA',cred:'BCaBA',cert:'0-00-00000',role:'RBT Supervisor',trained:'yes',trained_date:isoOf(add(now,-380)),portal:'no',norel:true,oversight:'employed',oversight_note:'both employed by the simulated district'};
  S.sups=[A,B];
  S.setup={rbt_name:'Jordan Lee (simulated)',rbt_cred:'RBT',rbt_cert:'RBT-00-000000',rbt_orig:isoOf(add(now,-325)),rbt_exp:isoOf(add(now,40)),path:'renewal',employer:'Simulated School District',site:'Simulated Elementary',clients:'SIM-0002, SIM-0005',year:String(y),days:[1,2,3,4,5],day_start:'08:30',day_end:'14:30',day_break:'30',day_act:'Behavior reduction / BIP implementation'};
  const ACT2=['Behavior reduction / BIP implementation','Discrete-trial teaching','Data collection','Natural-environment teaching','Skill acquisition program'];
  const FB=['Prompted the break card before each demand as written; praise was specific. Next: fade the gestural prompt after two independent requests.','Data were recorded at the time for every opportunity. One response to the target behavior drew attention (a reprimand); rehearsed the planned neutral redirect twice.','Set up materials before the session and ran 20 trials with clear instructions. Wait time was short on the first block; modeled a 3-second wait and the RBT practised it.','Natural-environment teaching at recess: good use of the student’s choices. Next: record each mand on the sheet, not at the end.'];
  const FU=['Fade the gestural prompt; bring three days of data to the next contact.','Use the neutral redirect every time; self-score with the checklist on Friday.','Count to three before re-prompting; video one block (with consent on file) for review.','Record every mand at the time; graph the week.'];
  const ks=yearKeys(y).filter(k=>k<=keyOf(todayISO()));
  ks.forEach((k,mi)=>{const [yy,mo]=k.split('-').map(Number),m=month(k);fillMonth(k,true);
    /* the school year starts mid-August: the earlier days of August are not service days */
    if(mo===8)m.days.forEach(d=>{if(+d.date.slice(8)<12)d.none=true;});
    m.days.forEach((d,i)=>{d.act=ACT2[(i+mi)%ACT2.length];if(i%9===4)d.brk='45';});
    const sch=(day,st,en,o)=>Object.assign({id:'sim'+k+day+st.replace(':',''),date:iso(yy,mo,Math.min(day,lastDay(yy,mo))),start:st,end:en,sup:A.id,format:'indiv',group:'',mode:'person',obs:'no',client:'SIM-0002',acts:[],bst:[],feedback:'',follow:'',ck:{}},o||{});
    const ckAll=(n)=>{const c={};CHECK.forEach((t,j)=>{c[j]=j<n?'n':'y';});c[9]='na';return c;};
    const L=[];
    if(mi===0){/* the first month is left short on purpose: one small-group contact only, so the red marks can be seen */
      L.push(sch(20,'14:45','15:45',{format:'group',group:'4',sact:['Developing performance expectations','Guiding problem-solving and ethical decisions'],acts:['Ethics and professional conduct','Documentation and reporting'],bst:['Instruction','Feedback'],feedback:'Group review of the data sheets and the RBT role at the school; each RBT named one question to bring to the next contact.',follow:'Bring the week’s data sheets to the first individual contact.'}));}
    else{L.push(sch(9,'09:00','11:00',{obs:'yes',sact:['Observation, BST and performance feedback','Reviewing written materials (progress notes, data sheets)'],acts:['Behavior reduction','Data collection and graphing'],bst:['Modeling','Rehearsal','Feedback'],feedback:FB[mi%FB.length],follow:FU[mi%FU.length],ck:ckAll(mi>=2?0:2)}));
      L.push(sch(16,'14:45','16:15',{sup:B.id,mode:'video',format:'group',group:'3',sact:['Modeling technical, professional and ethical behavior','Guiding problem-solving and ethical decisions'],acts:['Behavior acquisition','Ethics and professional conduct'],bst:['Instruction','Modeling'],feedback:'Video review of prompting hierarchies with the group; the RBT described the most-to-least sequence correctly.',follow:'Write the prompt level on the data sheet for each trial.'}));
      L.push(sch(28,'12:30','14:00',{sup:B.id,mode:'video',sact:['Developing performance expectations','Evaluating the effects of supervision'],acts:['Documentation and reporting'],bst:['Instruction','Rehearsal','Feedback'],feedback:'Reviewed the month\u2019s data sheets and progress notes together; the RBT summarised the trend accurately.',follow:'Keep the summary line on each Friday sheet.'}));
      L.push(sch(23,'09:00','11:00',{obs:'yes',sact:['Observation, BST and performance feedback','Overseeing and evaluating service delivery','Evaluating the effects of supervision'],acts:['Behavior acquisition','Data collection and graphing'],bst:['Feedback'],feedback:FB[(mi+1)%FB.length],follow:FU[(mi+1)%FU.length],ck:ckAll(1)}));}
    m.contacts=L.filter(c=>c.date<=todayISO());
    if(k<keyOf(todayISO())&&mi>0)m.sig={sup_name:'Simulated BCBA, BCBA',sup_date:iso(yy,mo,lastDay(yy,mo)),rbt_name:'Jordan Lee (simulated), RBT',rbt_date:iso(yy,mo,lastDay(yy,mo))};});
  S.goals=[{id:'g1',goal:'Offers the break card before each independent-work demand, as the plan says, in 9 of 10 opportunities.',set:yearKeys(y)[0]+'-20',target:isoOf(add(now,20)),status:'In progress',notes:'8 of 10 at the last observation.'},
    {id:'g2',goal:'Records each target behavior on the data sheet within one minute, for a full session.',set:yearKeys(y)[0]+'-20',target:isoOf(add(now,-10)),status:'Met',notes:'Met at two observations in a row.'},
    {id:'g3',goal:'Waits 3 seconds after an instruction before the next prompt, in 9 of 10 trials.',set:isoOf(add(now,-14)),target:isoOf(add(now,45)),status:'Not started',notes:''}];
  S.pdus=[];
  S.cred={notes:'Simulated: the competency assessment window and the application were discussed at the last contact.'};
  S.concerns=[{id:'cn1',date:isoOf(add(now,-40)),concern:'Simulated: data for two sessions were entered at the end of the day, not at the time, and one count did not match the session note.',investigated:'Simulated: reviewed the two data sheets against the session notes and spoke with the RBT; the RBT had been covering a second classroom and fell behind.',decision:DECIDE[0],plan:'Record data at the time for every session (the supervisor checks two sheets a week for four weeks).\nReview the RBT Ethics Code standard on accurate documentation together.',outcome:'Simulated: data were recorded at the time in all checked sessions for four weeks.',outcome_date:isoOf(add(now,-8))}];
  /* a second simulated supervisee, newer to the job: the same supervisors, one observation a month, this month still open */
  const J=S,T=newRbt();R.push(T);S=T;
  S.setup={rbt_name:'Casey Morgan (simulated)',rbt_cred:'RBT',rbt_cert:'RBT-00-000001',rbt_orig:isoOf(add(now,-120)),rbt_exp:isoOf(add(now,245)),path:'recert',employer:'Simulated School District',site:'Simulated Elementary',clients:'SIM-0005',year:String(y),days:[1,2,3,4,5],day_start:'08:00',day_end:'12:00',day_break:'0',day_act:'Data collection'};
  ks.forEach((k,mi)=>{const [yy,mo]=k.split('-').map(Number),m=month(k);fillMonth(k,true);if(mo===8)m.days.forEach(d=>{if(+d.date.slice(8)<12)d.none=true;});
    const cur=k===keyOf(todayISO());
    m.contacts=[{id:'simT'+k+'a',date:iso(yy,mo,Math.min(13,lastDay(yy,mo))),start:'09:00',end:'10:00',sup:B.id,format:'indiv',group:'',mode:'person',obs:'yes',client:'SIM-0005',sact:['Observation, BST and performance feedback'],acts:['Data collection and graphing'],bst:['Modeling','Feedback'],feedback:'Simulated: counted each opportunity at the time; the tally matched the supervisor’s.',follow:'Graph the week on Friday.',ck:{}},
      ...(cur?[]:[{id:'simT'+k+'b',date:iso(yy,mo,Math.min(24,lastDay(yy,mo))),start:'14:45',end:'15:15',sup:A.id,format:'indiv',group:'',mode:'video',obs:'no',client:'SIM-0005',sact:['Reviewing written materials (progress notes, data sheets)'],acts:['Documentation and reporting'],bst:['Feedback'],feedback:'Simulated: reviewed the month’s data sheets together.',follow:'Keep the summary line on each Friday sheet.',ck:{}}])].filter(c=>c.date<=todayISO());});
  S.goals=[{id:'tg1',goal:'Records every opportunity at the time, for a full session, at two observations in a row.',set:isoOf(add(now,-60)),target:isoOf(add(now,30)),status:'In progress',notes:''}];
  S=J;
  curKey=keyOf(todayISO());if(!yearKeys(y).includes(curKey))curKey=yearKeys(y)[0];renderAll();   /* the view stays where it is, as in the other forms */
  nbhUI.toast('Simulation loaded: two simulated RBTs and two supervisors, every month of this school year up to today.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);
/* the file is written the same way whatever order the boxes were ticked in: each contact's choices in the form's own
   order, and every month's "no services" a yes or a no, so a file saved, opened and saved again is the same file */
function tidy(){R.forEach(r=>Object.values(r.months||{}).forEach(m=>{m.noservice=!!m.noservice;(m.contacts||[]).forEach(c=>{
  [['sact',SACT],['acts',TCO],['bst',BST]].forEach(([k,L])=>{if(Array.isArray(c[k]))c[k].sort((a,b)=>L.indexOf(a)-L.indexOf(b));});});}));}

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();
if(document.readyState!=='complete')window.addEventListener('load',stickTop);

/* the workstation's due line: the credential's expiration and the goals' target dates */
window.__nbhDue=function(){const out=[];
  eachRbt(()=>{const st=S.setup,who=st.rbt_name?' ('+st.rbt_name+')':'';
  if(st.rbt_exp)out.push({what:'RBT recertification due'+who,date:st.rbt_exp});
  const w=compWin();if(w&&st.path==='renewal'&&!S.cred.comp_date)out.push({what:'RBT competency assessment window opens'+who,date:w.from});
  (S.goals||[]).forEach(g=>{if(g.status!=='Met'&&g.target&&g.goal)out.push({what:('RBT goal'+(R.length>1&&st.rbt_name?' ('+st.rbt_name+')':'')+': '+g.goal).slice(0,60),date:g.target});});});
  return out;};
