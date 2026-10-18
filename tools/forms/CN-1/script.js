const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';
const pct1=v=>v==null?'—':(Math.round(v*10)/10)+'%';   /* v22.52 (review F332) TI-1's figures as TI-1 gives them, to one decimal */

/* ---- v21.33: clock times are picked (type="time", stored HH:MM). Older files with typed text are converted. ---- */
function toHM24(v){const t=String(v==null?"":v).trim().toLowerCase();if(!t)return "";if(/^\d{2}:\d{2}$/.test(t))return t;
  const m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/.exec(t);if(!m)return "";let h=+m[1],mi=m[2]?+m[2]:0;if(h>23||mi>59)return "";
  if(m[3]==="p"&&h<12)h+=12;else if(m[3]==="a"&&h===12)h=0;else if(!m[3]&&h>=1&&h<=6)h+=12;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0");}
function fmtHM(v){const t=toHM24(v);if(!t)return String(v==null?'':v);let h=+t.slice(0,2);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+t.slice(3)+' '+ap;}

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* v22.52 (review F334, I169) a scheduled session that was not held is a type of its own, and the contacts of the assessment
   (the consent meeting, an interview, an FBA observation) are types too, so the notes cover the case from the first contact */
const TYPES=['Observation','Consultation','Training','Direct session','Parent meeting','IEP or team meeting','Phone or video call','Record review','Consent meeting','Assessment interview','FBA observation','Scheduled session not held'];
const MISSED='Scheduled session not held',PRE_TYPES=['Consent meeting','Assessment interview','FBA observation'];
const TCAT=[['t_obs','Observation'],['t_cons','Consultation'],['t_train','Training'],['t_direct','Direct service'],['t_meet','Meeting'],['t_doc','Documentation'],['t_travel','Travel']];
/* v22.52 (review F335) the categories inside the visit are compared with its start-to-end time; documentation and travel are outside it */
const IN_CAT=['t_obs','t_cons','t_train','t_direct','t_meet'],OUT_CAT=['t_doc','t_travel'];
const NFIELDS=['date','start','end','type','setting','present','plan','purpose','data_forms','data_rate','data_goal','data_unit','data_dir','observed','integ','integ_date','integ_note','problems','recs','changes','authority','training','materials','t_obs','t_cons','t_train','t_direct','t_meet','t_doc','t_travel','sig','sig_date','written','svc_min','svc_kind','svc_with','svc_note',
  /* v22.52 (review F328-F337, I166, I168, I169) */
  'data_beh','data_week','data_phase','data_run','data_need','integ_crit','integ_ptype','integ_by','integ_how','integ_criterion','fb_who','fb_data','fb_change',
  'chg_kind','chg_rule','chg_iep','chg_amend','chg_pwn','chg_subst','chg_consent','chg_told','chg_legacy','safety','as_given','as_how','as_withdraw','as_part',
  'miss_reason','miss_min','miss_madeup','svc_iep','sig_time','plan_v'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},notes:[]};}
let S=blank(),cur=0;
let nbhCnCase=null;   /* the case as the workstation last sent it (v21.75; declared here since v22.52, the first render reads it) */
/* v22.52 (review F329) a new note is not signed: Signed stays empty until the BCBA presses Sign this note */
function newNote(){const n={};NFIELDS.forEach(f=>{n[f]='';});n.plan=S.meta.plan||'';n.plan_v=S.meta.plan_v||'';n.next=[{what:'',who:'',when:'',done:false}];n.add=[];return n;}
/* v22.52 (review F328) a note saved before v22.52 has one "authority" choice; it becomes the kind of change, the old wording is kept */
const LEGACY_AUTH={'No change to the plan':'none','Within the adjustments the plan already allows (BCBA)':'rule','Team decision recorded on Form PR-1':'revision','Parent or guardian consent obtained (Form IC-1)':'revision','IEP team decision (meeting of this date)':'revision','Recommended only; awaiting the team':'recommended'};
function migrate(n){if(!n.authority)return;if(!n.chg_kind){const k=LEGACY_AUTH[n.authority]||'';n.chg_kind=k&&k!=='recommended'&&/^\s*(none|no change)\b/i.test(n.changes||'')?'none':k;
    if(n.authority!=='No change to the plan')n.chg_legacy=n.authority;if(n.chg_kind==='revision'&&/^IEP team/.test(n.authority)&&!n.chg_iep)n.chg_iep=n.date||'';}
  n.authority='';}
function ensure(){if(!S.meta||typeof S.meta!=='object')S.meta={};if(!Array.isArray(S.notes))S.notes=[];if(!S.notes.length)S.notes.push(newNote());
  S.notes.forEach(n=>{if(!Array.isArray(n.next))n.next=[];if(!n.next.length)n.next.push({what:'',who:'',when:'',done:false});if(!Array.isArray(n.add))n.add=[];migrate(n);['start','end'].forEach(f=>{const h=toHM24(n[f]);if(h)n[f]=h;});});
  if(cur>=S.notes.length)cur=S.notes.length-1;if(cur<0)cur=0;}
const isMissed=n=>!!n&&n.type===MISSED;
/* v22.52 (review F329) a note is signed when the Sign button has written the name and the date signed */
const signed=n=>!!n&&!!String(n.sig||'').trim()&&!!String(n.sig_date||'').trim();
function note(){ensure();return S.notes[cur];}

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- time and date ---------------- */
function toMin(s){const m=/^\s*(\d{1,2})(?::(\d{2}))?\s*([aApP])?/.exec(String(s||''));if(!m)return null;let h=+m[1],mi=m[2]?+m[2]:0;if(h>24||mi>59)return null;const ap=(m[3]||'').toLowerCase();if(ap==='p'&&h<12)h+=12;if(ap==='a'&&h===12)h=0;return h*60+mi;}
function duration(n){const a=toMin(n.start),b=toMin(n.end);if(a==null||b==null)return null;let d=b-a;if(d<=0&&!/^\s*\d{2}:\d{2}\s*$/.test(String(n.end||''))&&!/[aApP]/.test(n.end||''))d+=720;return d>0&&d<=1440?d:null;}
function parseDate(s){const m=/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/.exec(String(s||'').trim());if(!m)return null;let y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000;const d=new Date(y,+m[1]-1,+m[2]);return isNaN(d)?null:d;}
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
function monthKey(s){const d=parseDate(s);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):'';}
function monthLabel(k){if(!k)return 'Undated';const [y,m]=k.split('-');return MON[+m-1]+' '+y;}
const hrs=m=>m==null?'—':(m/60).toFixed(2);
const fmtDur=m=>m==null?'—':(m>=60?Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m+' min').trim();
function catSum(n,keys){let s=0,any=false;(keys||TCAT.map(x=>x[0])).forEach(k=>{const v=num(n[k]);if(v!=null){s+=v;any=true;}});return any?s:null;}
function rateCheck(n){const r=num(n.data_rate),g=num(n.data_goal);if(r==null||g==null)return null;const up=n.data_dir==='up';const met=up?r>=g:r<=g;const close=!met&&g!==0&&Math.abs(r-g)/Math.abs(g)<=0.25;
  const run=num(n.data_run),need=num(n.data_need);return{r,g,met,close,up,run,need,crit:need!=null&&need>0&&run!=null&&run>=need};}
/* v22.52 (review F331) one week's figure is read as a level, not as the goal: whether the goal is met is a run of consecutive
   measurements, which Form DD-1 counts (the run of recorded days at the aim in the current phase, against the days the aim asks) */
function rateWords(n,rc){if(!rc)return null;const u=n.data_unit?' '+n.data_unit:'',beh=String(n.data_beh||'').trim();
  const head=rc.met?(rc.up?'At or above the goal level this week':'At or below the goal level this week'):rc.close?'Close to the goal level this week (within 25%)':'Not at the goal level this week';
  const body=(beh?beh+': ':'')+rc.r+u+' against a goal level of '+rc.g+u+(rc.up?' (higher is better)':' (lower is better)')+(n.data_week?', '+n.data_week:'')+'.';
  const ph=n.data_phase?' Phase average: '+n.data_phase+'.':'';
  const crit=rc.need!=null&&rc.need>0?(rc.crit?' Criterion met on Form DD-1: '+rc.run+' consecutive recorded days at the aim (its aim asks for '+rc.need+'); check it against the goal\u2019s own criterion (Form GB-1) before calling the goal met.':' Criterion on Form DD-1: '+(rc.run||0)+' of '+rc.need+' consecutive recorded days at the aim so far; the goal is not met until the run reaches it.')
    :' One week’s figure: whether the goal is met is judged on its criterion (a run of consecutive measurements) on Form DD-1, not on this line.';
  return {cls:rc.met?'v-ok':rc.close?'v-mid':'v-no',head,body,ph,crit,text:head+': '+body+ph+crit};}
/* v22.52 (review F332) the integrity score is read in Form TI-1's own bands and words (its bandOf), for the plan type set on
   the note, and its critical-step figure against TI-1's criterion, as TI-1 reads it */
function tiBand(p,ptype){
  if(p==null)return{cls:'v-mid',name:'No band yet',txt:'No scored observation to place in a band.'};
  const acq=ptype==='Skill acquisition',red=ptype==='Behavior reduction';
  if(p>=90)return{cls:'v-ok',name:'90% and above',txt:'Acceptable: routine monitoring.'};
  if(p>=80)return{cls:acq?'v-mid':'v-ok',name:'80–89%',txt:red?'Acceptable for a behavior-reduction plan in this evidence base; schedule a re-check.':
    acq?'Caution for a skill-acquisition program: consequences delivered at about 67% fidelity on average prevented mastery for 5 of 6 learners (Burlison et al., 2026); schedule a re-check and retrain any consequence step in error.':
    'Acceptable for a behavior-reduction plan in this evidence base, with a re-check scheduled; for a skill-acquisition program, a caution. Set the plan type on the note.'};
  if(p>=60)return{cls:'v-mid',name:'60–79%',txt:'Caution: effects were degraded for some learners at these levels. Retrain any consequence step in error before the next observation.'};
  return{cls:'v-no',name:'Below 60%',txt:'Not acceptable: do not interpret the student’s data as a test of the plan; retrain before continuing.'};}
function integCheck(n){const v=num(n.integ);if(v==null)return null;const b=tiBand(v,n.integ_ptype),c=num(n.integ_crit),k=num(n.integ_criterion)||90,low=c!=null&&c<k;
  return{v,b,crit:c,criterion:k,critLow:low,lvl:low&&b.cls==='v-ok'?'mid':b.cls.slice(2)};}
function integWords(n,ic){if(!ic)return '';const who=[n.integ_by?'observed by '+n.integ_by:'',n.integ_how||''].filter(Boolean).join(', ');
  return 'Integrity '+pct1(ic.v)+(who?' ('+who+')':'')+', Form TI-1 band '+ic.b.name+': '+ic.b.txt+(ic.crit!=null?' Critical steps '+pct1(ic.crit)+(ic.critLow?', below the '+ic.criterion+'% criterion: treat the plan as not yet running as written (Form TI-1).':', at or above the '+ic.criterion+'% criterion.'):'');}
function nxStatus(st){if(st.done)return 'done';const d=parseDate(st.when);if(!d)return 'open';const t=new Date();t.setHours(0,0,0,0);return d<t?'overdue':'open';}

/* ---------------- the note editor ---------------- */
function renderNoteSel(){const s=$('#noteSel');s.innerHTML=S.notes.map((n,i)=>`<option value="${i}"${i===cur?' selected':''}>${i+1}. ${esc(n.date||'(no date)')}${n.type?' · '+esc(n.type):''}${n.setting?' · '+esc(n.setting.slice(0,28)):''}</option>`).join('');}
function bindNote(){const n=note();$$('[data-n]').forEach(el=>{el.value=n[el.dataset.n]||'';});}
function renderNx(){const n=note();$('#nxTbl tbody').innerHTML=n.next.map((st,i)=>`<tr><td class="num">${i+1}</td><td><input data-x="what" data-i="${i}" value="${esc(st.what)}" placeholder="e.g., Ms. R. runs the break-card step at every demand; para collects TI-1 on Thursday"></td><td><input data-x="who" data-i="${i}" value="${esc(st.who)}"></td><td><input data-x="when" data-i="${i}" value="${esc(st.when)}" placeholder="m/d/yy"></td><td class="num"><input type="checkbox" data-x="done" data-i="${i}"${st.done?' checked':''} aria-label="Step ${i+1} done"></td>${delCell('nx',i,'step')}</tr>`).join('');lockNote();}
/* v22.52 (review F329) a signed note is locked: its fields, its steps' words and dates, and the case fill; the Done ticks
   stay open (a step done later is follow-up, not an edit of what was signed), and a correction is a dated addendum */
function lockNote(){const n=note(),L=signed(n);
  $$('.only-note [data-n]').forEach(el=>{if(el.dataset.n==='sig'||el.dataset.n==='sig_date')return;el.disabled=L;});
  $$('#nxTbl input[data-x]').forEach(el=>{if(el.dataset.x!=='done')el.disabled=L;});$$('#nxTbl .rowDel').forEach(b=>{b.disabled=L;});
  ['addNx','delNx','cnWeek','cnPlanUse','cnChgUse'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=L;});
  const sb=$('#signNote'),ab=$('#addAdd'),ub=$('#unsignNote');if(sb)sb.hidden=L;if(ab)ab.hidden=!L;if(ub)ub.hidden=!L;if(!L){const bx=$('#addBox');if(bx)bx.hidden=true;}
  document.body.classList.toggle('cn-locked',L);}
const Ymd=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);
const HMof=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
const isoMd=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||''));return m?(+m[2])+'/'+(+m[3])+'/'+m[1].slice(2):String(iso||'');};
/* what a note must say before it can be signed: when, what kind, who, why, and what was done (F329) */
function signNeeds(n){const L=[];if(!n.date)L.push('the date');if(!n.type)L.push('the type');
  if(isMissed(n)){if(!n.miss_reason)L.push('why the session was not held');if(num(n.miss_min)==null)L.push('the minutes scheduled');}
  else{if(duration(n)==null&&num(n.svc_min)==null)L.push('the start and end times');if(!String(n.present||'').trim())L.push('who was present');if(!String(n.purpose||'').trim())L.push('the purpose (why)');
    if(!['observed','training'].some(k=>String(n[k]||'').trim()))L.push('what was done (what was seen, or the training delivered)');}
  return L;}
function lateBy(n){const a=parseDate(n.date),b=parseDate(n.sig_date);if(!a||!b)return 0;const k=Math.round((b-a)/864e5);return k>0?k:0;}
function renderSign(n){const o=$('#sigOut');if(o)o.textContent=signed(n)?'Signed by '+n.sig+' on '+n.sig_date+(n.sig_time?' at '+fmtHM(n.sig_time):'')+'. The note is locked; a correction goes in as a dated addendum.'+(lateBy(n)?' Late entry: signed '+lateBy(n)+' day'+(lateBy(n)===1?'':'s')+' after the contact.':''):'Not signed. Sign the note once it says what was done and why.';
  const L=$('#addList');if(L)L.innerHTML=(n.add||[]).length?'<div class="cn-add"><b>Addenda</b>'+n.add.map(a=>'<div>'+esc(a.date+(a.time?' '+fmtHM(a.time):'')+(a.by?', '+a.by:'')+': '+a.text)+'</div>').join('')+'</div>':'';}
/* v22.52 (review F328) what a change needs, by its kind */
function chgChecks(n){const out=[],k=n.chg_kind,ct=String(n.changes||'').trim();
  if(ct&&!k)out.push('Say what kind of change this is: no change to the plan, a decision rule written in the plan, a revision of the plan, or recommended only.');
  if(k==='rule'&&!String(n.chg_rule||'').trim())out.push('Name the decision rule in the plan (Form TD-1) that the change applies.');
  if((k==='rule'||k==='revision'||k==='recommended')&&!ct)out.push('Say exactly what changed (or what is recommended), from what to what.');
  if(k==='revision'){if(!String(n.chg_iep||'').trim()&&!String(n.chg_amend||'').trim())out.push('A revision of the plan is the IEP team’s decision: give the date of the team meeting, or of the written amendment the parent agreed to without a meeting (34 CFR 300.324(a)(4)).');
    if(!String(n.chg_pwn||'').trim())out.push('No prior written notice recorded: give its date, or say why none is needed (notice is required when the change alters the provision of FAPE, 34 CFR 300.503(a)).');
    if(!n.chg_subst)out.push('Say whether the change is substantial: a substantial change needs the parent’s informed consent (BACB Ethics Code 2.11).');
    else if(n.chg_subst==='yes'&&!String(n.chg_consent||'').trim())out.push('A substantial change needs the parent’s informed consent to it: give the date and how, and record it as its own event on Form IC-1’s consent record.');}
  return out;}
const CHG_LAB={none:'No change to the plan',rule:'A decision rule written in the plan (Form TD-1)',revision:'A revision of the plan (the IEP team’s decision)',recommended:'Recommended only; awaiting the team'};
/* the authority in one line, for the printed note, the log and the CSV */
function authText(n){const k=n.chg_kind;if(!k)return n.chg_legacy?'Recorded before v22.52 as: '+n.chg_legacy:'';
  const L=[CHG_LAB[k]||k];if(k==='rule'&&n.chg_rule)L.push('rule: '+n.chg_rule);
  if(k==='revision'){if(n.chg_iep)L.push('IEP team meeting '+n.chg_iep);if(n.chg_amend)L.push('written amendment agreed by the parent '+n.chg_amend);if(n.chg_pwn)L.push('prior written notice '+n.chg_pwn);
    if(n.chg_subst)L.push(n.chg_subst==='yes'?'substantial':'not substantial');if(n.chg_consent)L.push('parent’s consent to the change '+n.chg_consent);if(n.chg_told)L.push('family told '+n.chg_told);}
  if(n.chg_legacy)L.push('recorded before v22.52 as: '+n.chg_legacy);return L.join('; ');}
const isChange=n=>n.chg_kind==='rule'||n.chg_kind==='revision';
function renderComputed(){
  const n=note(),d=duration(n),miss=isMissed(n);$('#durOut').value=d==null?'':fmtDur(d)+' ('+d+' min)';
  const rc=rateCheck(n),rw=rateWords(n,rc),R=$('#rateOut');R.innerHTML=rw?'<div class="verdict '+rw.cls+'" style="margin:6px 0 0"><b>'+esc(rw.head)+'.</b> '+esc(rw.body+rw.ph+rw.crit)+'</div>':'';
  const ic=integCheck(n),I=$('#integOut');I.innerHTML=ic?'<div class="verdict v-'+ic.lvl+'" style="margin:6px 0 0">'+esc(integWords(n,ic))+'</div>':'';
  /* v22.52 (review F335) the categories inside the visit against its duration; documentation and travel on their own */
  const ins=catSum(n,IN_CAT),outs=catSum(n,OUT_CAT),T=$('#timeOut'),oTxt=outs!=null?' Outside the visit: documentation and travel '+outs+' min, not part of the start-to-end time.':'';
  if(ins==null&&outs==null)T.innerHTML=d==null?'':'<p class="hint">Duration '+fmtDur(d)+'; no time by category entered yet.</p>';
  else if(ins==null)T.innerHTML='<p class="hint">No time inside the visit by category yet.'+esc(oTxt)+'</p>';
  else if(d==null)T.innerHTML='<p class="hint">Inside the visit the categories add to '+ins+' min; enter start and end times to compare.'+esc(oTxt)+'</p>';
  else{const df=ins-d,okk=Math.abs(df)<=5;T.innerHTML='<div class="verdict '+(okk?'v-ok':'v-mid')+'">Inside the visit the categories add to '+ins+' min against a duration of '+d+' min'+(okk?'.':' ('+(df>0?df+' min more than the visit: time outside the start-to-end span belongs under documentation or travel':(-df)+' min of the visit are not in any category')+').')+esc(oTxt)+'</div>';}
  /* v22.52 (review I169, F334) the plan rows step aside on an assessment contact and on a session not held, unless they hold something */
  const pre=PRE_TYPES.includes(n.type)||miss,has=r=>[...r.querySelectorAll('[data-n]')].some(e=>String(e.value||'').trim());
  $$('.cn-planrow').forEach(r=>{r.hidden=pre&&!has(r);});
  const rv=n.chg_kind==='revision'||['chg_iep','chg_amend','chg_pwn','chg_subst','chg_consent','chg_told'].some(k=>String(n[k]||'').trim());
  $$('.cn-rev').forEach(r=>{r.hidden=!rv;});$$('.cn-rule').forEach(r=>{r.hidden=n.chg_kind!=='rule'&&!String(n.chg_rule||'').trim();});$$('.cn-chg').forEach(r=>{r.hidden=!(isChange(n)||n.chg_kind==='recommended');});
  const lg=$('#chgLegacy');if(lg)lg.textContent=n.chg_legacy?'Recorded before v22.52 as “'+n.chg_legacy+'”: check the kind of change and add what it needs.':'';
  const mb=$('#missBox');if(mb)mb.hidden=!miss&&!['miss_reason','miss_min','miss_madeup'].some(k=>String(n[k]||'').trim());
  const ab=$('#asBox');if(ab)ab.hidden=!(n.type==='Direct session'||n.svc_kind==='direct')&&!['as_given','as_how','as_withdraw','as_part'].some(k=>String(n[k]||'').trim());
  renderMissOut(n);renderCaseNotes(n);
  const out=[];if(!n.date)out.push('The note has no date.');
  if(miss){if(!n.miss_reason)out.push('Say why the session was not held.');if(num(n.miss_min)==null)out.push('Enter the minutes that were scheduled.');}
  else if(d==null)out.push('Start and end times are needed for the duration and the hours log.');
  if(!n.type)out.push('Choose the type of contact.');if(!miss&&!n.present)out.push('Say who was present.');
  chgChecks(n).forEach(x=>out.push(x));
  /* v22.52 (review F337) a recommendation needs a step with an owner and a date, as the check says */
  if(n.recs&&!n.next.some(s=>String(s.what||'').trim()&&String(s.who||'').trim()&&String(s.when||'').trim()))out.push('Recommendations were given but no next step has an owner and a date.');
  /* v22.52 (review I168) */
  if(n.type==='Direct session'&&!n.as_given)out.push('Record whether the student gave assent to this direct session (BACB Ethics Code 2.11: assent when applicable).');
  const pv=signed(n)?'':planNewer(n);if(pv)out.push(pv);
  if(!signed(n))out.push(String(n.sig||'').trim()?'The note is not signed: it holds a name but no date signed. Press Sign this note when the note is written.':'The note is not signed. Press Sign this note once it says what was done and why.');
  renderSvcHints();renderSign(n);lockNote();
  const late=lateBy(n);
  $('#noteVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+esc(x)+'</div>').join('')+'</div>':(n.date?'<div class="verdict v-ok"><b>Complete.</b> '+(miss?'Dated, typed, with the reason and the minutes scheduled, and signed '+esc(n.sig_date)+'.':'Dated, timed, typed, attended and signed '+esc(n.sig_date)+'; changes carry their kind and authority, and recommendations a next step with an owner and a date.')+(late?' <b>Late entry:</b> signed '+late+' day'+(late===1?'':'s')+' after the contact.':'')+'</div>':'');
  renderNoteOut();
}
function renderNoteOut(){
  const n=note(),m=S.meta,d=duration(n),rc=rateCheck(n),rw=rateWords(n,rc),ic=integCheck(n),cs=catSum(n),ins=catSum(n,IN_CAT),outs=catSum(n,OUT_CAT),miss=isMissed(n);
  const P=(label,v,pre)=>'<h4>'+label+'</h4>'+(v&&String(v).trim()?'<p>'+esc(v)+'</p>':'<p class="cn-empty">none recorded</p>');
  const nx=n.next.filter(s=>s.what),pre=PRE_TYPES.includes(n.type)||miss,mk=madeUpFor(cur);
  const fb=[n.fb_who?'to '+n.fb_who:'',n.fb_data?'shown '+n.fb_data:'',n.fb_change?'will change: '+n.fb_change:''].filter(Boolean).join('; ');
  const as=[n.as_given?'Assent: '+n.as_given:'',n.as_how?'How shown: '+n.as_how:'',n.as_withdraw?'Withdrawal and how it was honored: '+n.as_withdraw:'',n.as_part?'Participation: '+n.as_part:''].filter(Boolean).join('\n');
  $('#noteOut').innerHTML='<div class="cn-title">Consultation and Session Note'+(n.type?': '+esc(n.type):'')+'</div>'+
    '<div class="cn-head"><div><b>Student</b>'+esc(m.client||'')+(m.sid?' ('+esc(m.sid)+')':'')+'</div><div><b>Date</b>'+esc(n.date||'')+'</div><div><b>Time</b>'+esc(fmtHM(n.start||''))+(n.end?' to '+esc(fmtHM(n.end)):'')+(d!=null?' ('+fmtDur(d)+')':'')+'</div><div><b>Setting</b>'+esc(n.setting||'')+'</div><div><b>School</b>'+esc(m.school||'')+'</div><div><b>BCBA</b>'+esc(m.bcba||'')+'</div><div style="grid-column:1/-1"><b>Present</b>'+esc(n.present||'')+'</div>'+svcHead(n)+'<div style="grid-column:1/-1"><b>Plan in force</b>'+esc(n.plan||m.plan||'')+(n.purpose?' &nbsp; <b>Purpose</b>'+esc(n.purpose):'')+'</div></div>'+
    (miss?'<h4>Scheduled session not held</h4><p>'+esc((n.miss_reason||'reason not recorded')+'; '+(num(n.miss_min)!=null?num(n.miss_min)+' minutes scheduled; no service delivered':'minutes scheduled not recorded')+'.'+(n.miss_madeup?' Made up on '+n.miss_madeup+'.':' Not made up yet.'))+'</p>':'')+
    (mk?'<p><b>Make-up</b> for the session not held on '+esc(mk.date)+' ('+esc(mk.miss_reason||'reason not recorded')+').</p>':'')+
    '<h4>Data reviewed</h4><p>'+(n.data_forms?esc(n.data_forms):'<span class="cn-empty">none recorded</span>')+(rw?'<br>'+esc(rw.head+': '+rw.body+rw.ph+(rc.need!=null&&rc.need>0?rw.crit:'')):'')+'</p>'+
    P('What was seen',n.observed)+
    (n.safety||!pre?P('Safety since the last visit',n.safety):'')+
    (ic||!pre?'<h4>Integrity (Form TI-1)</h4><p>'+(ic?esc(integWords(n,ic))+(n.integ_date?' TI-1 of '+esc(n.integ_date)+'.':'')+(n.integ_note?' '+esc(n.integ_note):''):'<span class="cn-empty">no integrity observation at this contact</span>')+'</p>':'')+
    (fb?'<h4>Feedback to the implementer</h4><p>'+esc(fb)+'</p>':'')+
    (as||n.type==='Direct session'?P('Assent and participation',as):'')+
    P('Problems identified',n.problems)+P('Recommendations given',n.recs)+
    (n.changes||n.chg_kind||!pre?'<h4>Changes made to the plan</h4><p>'+(n.changes?esc(n.changes):'<span class="cn-empty">none</span>')+(authText(n)?'<br><b>Kind and authority:</b> '+esc(authText(n)):'')+'</p>':'')+
    P('Training delivered',n.training)+P('Materials left',n.materials)+
    '<h4>Next steps</h4>'+(nx.length?'<table class="cn-t"><thead><tr><th style="width:55%">What</th><th>Who</th><th style="width:14%">By when</th><th style="width:10%">Status</th></tr></thead><tbody>'+nx.map(s=>'<tr><td>'+esc(s.what)+'</td><td>'+esc(s.who)+'</td><td>'+esc(s.when)+'</td><td>'+nxStatus(s)+'</td></tr>').join('')+'</tbody></table>':'<p class="cn-empty">none recorded</p>')+
    '<h4>Time by category</h4><p>'+(cs!=null?TCAT.filter(([k])=>num(n[k])!=null).map(([k,l])=>l+' '+num(n[k])+' min').join(' · ')+(ins!=null?' · in the visit '+ins+' min'+(d!=null?' (visit '+d+' min)':''):'')+(outs!=null?' · outside the visit '+outs+' min':''):'<span class="cn-empty">not recorded</span>')+'</p>'+
    '<div class="cn-sig"><span>Signed: <span class="bl">'+esc(n.sig_date?n.sig||'':'')+'</span></span><span>Date: <span class="bl" style="min-width:120px">'+esc(n.sig_date||'')+(n.sig_date&&n.sig_time?' '+esc(fmtHM(n.sig_time)):'')+'</span></span>'+(lateBy(n)?'<span><b>Late entry</b> (signed '+lateBy(n)+' day'+(lateBy(n)===1?'':'s')+' after the contact)</span>':'')+'</div>'+
    ((n.add||[]).length?'<h4>Addenda</h4>'+n.add.map(a=>'<p>'+esc(a.date+(a.time?' '+fmtHM(a.time):'')+(a.by?', '+a.by:'')+': '+a.text)+'</p>').join(''):'')+
    '<div class="cn-foot"><span>'+(n.written&&n.written!==n.date?'Note written on '+esc(n.written)+'. ':'')+'Confidential student record; retain with the behavior file.</span><span>Form CN-1 · Note '+(cur+1)+' of '+S.notes.length+'</span></div>';
}
function renderNote(){renderNoteSel();bindNote();renderNx();renderComputed();}

/* ---------------- the log ---------------- */
function noteRows(){return S.notes.map((n,i)=>({n,i,d:parseDate(n.date),dur:duration(n),mk:monthKey(n.date)})).sort((a,b)=>(a.d&&b.d)?b.d-a.d:a.d?-1:b.d?1:b.i-a.i);}
function renderLogFilters(){const t=$('#logType'),mo=$('#logMonth');const tv=t.value,mv=mo.value;
  t.innerHTML='<option value="">All types</option>'+TYPES.map(x=>'<option'+(x===tv?' selected':'')+'>'+x+'</option>').join('');
  const months=[...new Set(S.notes.map(n=>monthKey(n.date)))].sort().reverse();
  mo.innerHTML='<option value="">All months</option>'+months.map(k=>'<option value="'+k+'"'+(k===mv?' selected':'')+'>'+monthLabel(k)+'</option>').join('');}
function renderLog(){
  renderLogFilters();const q=($('#logSearch').value||'').toLowerCase(),ty=$('#logType').value,mo=$('#logMonth').value;
  const R=noteRows().filter(r=>(!ty||r.n.type===ty)&&(!mo||r.mk===mo)&&(!q||NFIELDS.some(f=>String(r.n[f]||'').toLowerCase().includes(q))||r.n.next.some(s=>(s.what+' '+s.who).toLowerCase().includes(q))));
  $('#logCount').textContent=R.length+' of '+S.notes.length+' note'+(S.notes.length===1?'':'s');
  $('#logTbl tbody').innerHTML=R.map(r=>{const n=r.n,rc=rateCheck(n),ic=integCheck(n),open=n.next.filter(s=>s.what&&!s.done),od=open.filter(s=>nxStatus(s)==='overdue').length;
    return '<tr class="open'+(r.i===cur?' cur':'')+'" data-open="'+r.i+'" tabindex="0" role="button" aria-label="Open note '+(r.i+1)+'"><td class="num">'+(r.i+1)+'</td><td>'+esc(n.date)+'</td><td>'+esc(n.type)+'</td><td class="num">'+(r.dur==null?'—':r.dur)+'</td><td>'+esc(n.setting)+'</td><td>'+esc(n.present)+'</td><td class="num">'+(rc?rc.r+' / '+rc.g:'—')+'</td><td class="num">'+(ic?pct(ic.v):'—')+'</td><td>'+esc((n.problems||'').split('\n')[0].slice(0,90))+(isMissed(n)?(n.problems?'<br>':'')+'<b>Not held:</b> '+esc(n.miss_reason||'reason not recorded')+(num(n.miss_min)!=null?', '+num(n.miss_min)+' min scheduled':''):'')+(isChange(n)?'<br><b>Change:</b> '+esc(String(n.changes||'').slice(0,80)):n.chg_kind==='recommended'?'<br><b>Recommended:</b> '+esc(String(n.changes||'').slice(0,80)):'')+(n.date&&!signed(n)?'<br><i>not signed</i>':'')+'</td><td class="num">'+(open.length?open.length+' open'+(od?' ('+od+' overdue)':''):n.next.some(s=>s.what)?'done':'—')+'</td></tr>';}).join('')||'<tr><td colspan="10" class="hint">No notes match.</td></tr>';
  /* metrics */
  const all=noteRows(),tot=all.reduce((s,r)=>s+(r.dur||0),0);const now=new Date(),thisK=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const thisM=all.filter(r=>r.mk===thisK).reduce((s,r)=>s+(r.dur||0),0);const changes=all.filter(r=>isChange(r.n)).length,recd=all.filter(r=>r.n.chg_kind==='recommended').length;   /* v22.52 (review F328) the kind of change, not the words, makes a change */
  const openAll=[].concat(...S.notes.map(n=>n.next.filter(s=>s.what&&!s.done)));const od=openAll.filter(nxStatus).filter(s=>nxStatus(s)==='overdue').length;
  const unsigned=S.notes.filter(n=>n.date&&!signed(n)).length,untimed=S.notes.filter(n=>n.date&&!isMissed(n)&&duration(n)==null).length;
  $('#logMetrics').innerHTML=`<div class="metric"><b>Notes</b><div class="val">${S.notes.filter(n=>n.date||n.type).length}</div><div class="sub">${unsigned?unsigned+' unsigned · ':''}${untimed?untimed+' without times':'all timed'}</div></div>
    <div class="metric"><b>Hours, all notes</b><div class="val">${hrs(tot)}</div><div class="sub">time with the student or team, from start and end</div></div>
    <div class="metric"><b>Hours, ${monthLabel(thisK)}</b><div class="val">${hrs(thisM)}</div><div class="sub">${S.meta.service?esc(S.meta.service.slice(0,60)):'this month'}</div></div>
    <div class="metric"><b>Plan changes</b><div class="val">${changes}</div><div class="sub">notes recording a change${recd?' · '+recd+' recommended, awaiting the team':''}</div></div>
    <div class="metric"><b>Open next steps</b><div class="val">${openAll.length}</div><div class="sub">${od?od+' overdue':'none overdue'}</div></div>`;
  /* hours by month and type */
  const months=[...new Set(all.map(r=>r.mk))].sort().reverse();const types=TYPES.filter(t=>S.notes.some(n=>n.type===t));if(S.notes.some(n=>!n.type))types.push('');
  let h='<thead><tr><th>Month</th>'+types.map(t=>'<th>'+(t||'(no type)')+'</th>').join('')+'<th>Time with the student or team</th><th>Notes</th></tr></thead><tbody>';
  months.forEach(k=>{const rows=all.filter(r=>r.mk===k);h+='<tr><td class="lk">'+monthLabel(k)+'</td>'+types.map(t=>{const m=rows.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0);return '<td class="num">'+(m?hrs(m):'—')+'</td>';}).join('')+'<td class="num"><b>'+hrs(rows.reduce((s,r)=>s+(r.dur||0),0))+'</b></td><td class="num">'+rows.length+'</td></tr>';});
  h+='<tr class="tot"><td>All months</td>'+types.map(t=>'<td class="num">'+hrs(all.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0))+'</td>').join('')+'<td class="num">'+hrs(tot)+'</td><td class="num">'+all.length+'</td></tr>';
  /* v22.52 (review F335) two figures, each named: the time with the student or team (above), and all time by category */
  const cats=TCAT.map(([k,l])=>[k,l,S.notes.reduce((s,n)=>s+(num(n[k])||0),0)]).filter(x=>x[2]),cIn=cats.filter(c=>IN_CAT.includes(c[0])),cOut=cats.filter(c=>OUT_CAT.includes(c[0])),sum=a=>a.reduce((s,c)=>s+c[2],0);
  if(cIn.length)h+='<tr><td class="lk">By category, in the visit</td><td colspan="'+(types.length+2)+'">'+cIn.map(c=>c[1]+' '+hrs(c[2])+' h').join(' · ')+' · '+hrs(sum(cIn))+' h in the visit</td></tr>';
  if(cOut.length)h+='<tr><td class="lk">Outside the visit</td><td colspan="'+(types.length+2)+'">'+cOut.map(c=>c[1]+' '+hrs(c[2])+' h').join(' · ')+' · '+hrs(sum(cOut))+' h outside the visit</td></tr>';
  if(cats.length)h+='<tr><td class="lk">All time</td><td colspan="'+(types.length+2)+'">'+hrs(sum(cats))+' h by category, including documentation and travel</td></tr>';
  $('#hoursTbl').innerHTML=h+'</tbody>';
  /* open steps */
  const ops=[];S.notes.forEach((n,i)=>n.next.forEach(s=>{if(s.what&&!s.done)ops.push({i,n,s,st:nxStatus(s),d:parseDate(s.when)});}));ops.sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:0);
  $('#openTbl tbody').innerHTML=ops.map(o=>'<tr class="open" data-open="'+o.i+'" tabindex="0" role="button" aria-label="Open note '+(o.i+1)+'"><td>'+esc(o.n.date||('note '+(o.i+1)))+'</td><td>'+esc(o.s.what)+'</td><td>'+esc(o.s.who)+'</td><td>'+esc(o.s.when)+'</td><td class="num">'+(o.st==='overdue'?'<b style="color:#8E2A2A">overdue</b>':'open')+'</td></tr>').join('')||'<tr><td colspan="5" class="hint">No open steps.</td></tr>';
}

/* ---------------- v21.85 (R) the service log ----------------
   Each dated note is a service entry: its minutes (typed, else the duration from the times), its kind (typed, else the
   type's, else the category with the most minutes), with whom (typed, else the roles in brackets under who was present)
   and one line (typed, else the purpose). The Service log page totals this week (Monday to Sunday) and this month by
   kind and against the IEP's service minutes (Form DM-1's profile.services through the case, or typed here), prints a
   chosen period alone as a service log page with the provider's signature line, and exports it as CSV. Facts out:
   service {log, week, month, iep}. */
/* v22.52 (review F330, I169) the assessment is a kind of its own; (F334) a session not held is not an entry, it is listed apart */
const KINDS=[['direct','Direct service'],['consult','Consultation'],['observation','Observation'],['training','Training'],['meeting','Meeting'],['assessment','Assessment (FBA)'],['other','Other']];
const kindLab=k=>(KINDS.find(x=>x[0]===k)||[0,''])[1];
const KIND_OF={'Observation':'observation','Consultation':'consult','Training':'training','Direct session':'direct','Parent meeting':'meeting','IEP or team meeting':'meeting','Phone or video call':'consult','Record review':'other','Consent meeting':'meeting','Assessment interview':'assessment','FBA observation':'assessment'};
const CAT_KIND={t_obs:'observation',t_cons:'consult',t_train:'training',t_direct:'direct',t_meet:'meeting'};
const IEPK={consult:'consultation',direct:'direct',both:'direct and consultation'};
/* v22.52 (review F330) the minutes counted toward the IEP are the kinds that are the IEP's service: for consultation, the
   consultation, observation and training notes; for direct, direct service; for both (or no kind set), all four. Meetings,
   record reviews and the assessment are not counted unless the note's "Counts toward the IEP service" says Yes. */
const IEP_COUNTS={consult:['consult','observation','training'],direct:['direct'],both:['direct','consult','observation','training']};
const countsIep=(e,k)=>e.n.svc_iep==='yes'?true:e.n.svc_iep==='no'?false:(IEP_COUNTS[k]||IEP_COUNTS.both).includes(e.kind);
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fromIso=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||'').trim());return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
const mdy=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
const countWhat=k=>k==='consult'?'consultation, observation and training':k==='direct'?'direct service':'direct service, consultation, observation and training';
function svcAuto(n){const d=duration(n);let kind=KIND_OF[n.type]||'';
  if(!kind){let best=0;Object.keys(CAT_KIND).forEach(k=>{const v=num(n[k]);if(v!=null&&v>best){best=v;kind=CAT_KIND[k];}});}
  let w=n.type==='Parent meeting'||n.type==='Consent meeting'?'parent':n.type==='IEP or team meeting'?'team':n.type==='Direct session'?'student':'';
  if(!w){const R=[],p=String(n.present||'');p.replace(/\(([^)]+)\)/g,(m,x)=>{const r=x.split(/[,;]/)[0].trim().toLowerCase();if(r&&!R.includes(r))R.push(r);return m;});
    if(/\bthe student\b/i.test(p)&&!R.includes('student'))R.push('student');if(!R.length&&/\b(parent|mother|father|guardian)\b/i.test(p))R.push('parent');w=R.slice(0,4).join(', ');}
  const line=String(n.purpose||'').trim()||String(n.observed||'').split('\n')[0].trim();
  return {min:d,kind:kind||'other',with:w,note:line.slice(0,160)};}
function svcOf(n,i){const a=svcAuto(n),d=parseDate(n.date),m=num(n.svc_min);
  return {i,n,d,iso:d?isoOf(d):'',min:m!=null&&m>=0?Math.round(m):a.min,kind:KINDS.some(k=>k[0]===n.svc_kind)?n.svc_kind:a.kind,with:String(n.svc_with||'').trim()||a.with,note:(String(n.svc_note||'').trim()||a.note).slice(0,160),signed:signed(n)};}
function svcEntries(){return S.notes.map(svcOf).filter(e=>e.d&&!isMissed(e.n)&&e.min!=null&&e.min>0).sort((a,b)=>a.d-b.d||a.i-b.i);}
function weekOf(t){const d=new Date(t.getFullYear(),t.getMonth(),t.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);const e=new Date(d);e.setDate(e.getDate()+6);return {from:d,to:e};}
function monthOf(t){return {from:new Date(t.getFullYear(),t.getMonth(),1),to:new Date(t.getFullYear(),t.getMonth()+1,0)};}
const inR=(d,r)=>!r||(d>=r.from&&d<=r.to);
/* consult is every kind but direct (the page's own figure); indirect is consultation, observation and training */
function svcTot(E,r){const o={total:0,direct:0,consult:0,indirect:0,by:{},n:0};KINDS.forEach(k=>{o.by[k[0]]=0;});
  E.forEach(e=>{if(!inR(e.d,r))return;o.by[e.kind]+=e.min;o.total+=e.min;o.n++;if(e.kind==='direct')o.direct+=e.min;else o.consult+=e.min;if(IEP_COUNTS.consult.includes(e.kind))o.indirect+=e.min;});return o;}
/* v22.52 (review F334) the sessions scheduled and not held: the reason, the minutes scheduled, the make-up (a note of that date with minutes) */
const MISS_GRP={'Student absent':'student','Student not available':'student','Provider absent':'provider','Staff not available':'staff','School closed':'closed','Other':'other'};
const MISS_LAB={student:'student reasons',provider:'provider reasons',staff:'staff not available',closed:'school closed',other:'other reasons'};
function madeUpNote(n,i){const d=parseDate(n.miss_madeup);if(!d)return null;let hit=null;
  S.notes.forEach((m,j)=>{if(hit||j===i||isMissed(m))return;const md=parseDate(m.date);if(md&&+md===+d){const e=svcOf(m,j);if(e.min>0)hit={i:j,min:e.min,date:m.date};}});return hit;}
function madeUpFor(i){const n=S.notes[i],d=n&&!isMissed(n)?parseDate(n.date):null;if(!d)return null;return S.notes.find((m,j)=>j!==i&&isMissed(m)&&parseDate(m.miss_madeup)&&+parseDate(m.miss_madeup)===+d)||null;}
function svcMissed(){return S.notes.map((n,i)=>({n,i,d:parseDate(n.date)})).filter(x=>isMissed(x.n)&&x.d).map(x=>{const min=Math.max(0,Math.round(num(x.n.miss_min)||0)),mu=madeUpNote(x.n,x.i);
  return Object.assign(x,{iso:isoOf(x.d),min,grp:MISS_GRP[x.n.miss_reason]||'other',mu,muMin:mu?Math.min(min,mu.min):0,signed:signed(x.n)});}).sort((a,b)=>a.d-b.d||a.i-b.i);}
function missSum(L,r){const o={total:0,made:0,n:0,by:{}};L.forEach(x=>{if(!inR(x.d,r))return;o.n++;o.total+=x.min;o.made+=x.muMin;o.by[x.grp]=(o.by[x.grp]||0)+x.min;});return o;}
function missLine(o){if(!o||!o.n)return '';return o.n+' scheduled session'+(o.n===1?'':'s')+' not held, '+o.total+' min ('+Object.keys(MISS_LAB).filter(k=>o.by[k]).map(k=>MISS_LAB[k]+' '+o.by[k]+' min').join(', ')+'); made up '+o.made+' min.';}
function renderMissOut(n){const o=$('#missOut'),dl=$('#missMadeList');if(!o)return;
  if(dl){const seen={};dl.innerHTML=S.notes.filter(m=>m!==n&&!isMissed(m)&&parseDate(m.date)&&(!parseDate(n.date)||parseDate(m.date)>=parseDate(n.date))).map(m=>m.date).filter(x=>!seen[x]&&(seen[x]=1)).map(x=>'<option value="'+esc(x)+'"></option>').join('');}
  if(!isMissed(n)){o.innerHTML='';return;}const i=S.notes.indexOf(n),mu=madeUpNote(n,i),sm=num(n.miss_min);
  o.innerHTML='<div class="verdict v-mid">No service delivered'+(sm!=null?': '+esc(sm)+' minutes scheduled':'')+(n.miss_reason?' ('+esc(n.miss_reason)+')':'')+'. '+(n.miss_madeup?(mu?'Made up on '+esc(n.miss_madeup)+' (note '+(mu.i+1)+', '+mu.min+' min).':'Made up on '+esc(n.miss_madeup)+': no note of that date with minutes yet.'):'Not made up yet: when it is, give the date of the make-up note.')+' Whether a missed session is owed is the district&rsquo;s rule.</div>';}
/* the IEP's minutes against the period they are owed in (this week, this month, or the grading period typed), from signed notes */
function iepInfo(E,now){const m=S.meta,min=num(m.iep_min);if(min==null||min<=0)return null;const per=['week','month','grading period'].includes(m.iep_per)?m.iep_per:'month',kind=IEPK[m.iep_kind]?m.iep_kind:'';
  let r=null,lab='this month';if(per==='week'){r=weekOf(now);lab='this week';}else if(per==='grading period'){const a=fromIso(m.gp_from),b=fromIso(m.gp_to);if(a&&b&&b>=a)r={from:a,to:b};lab='this grading period';}else r=monthOf(now);
  if(!r)return {min,per,kind,done:null,lab,line:'',need:'Enter the grading period’s first and last days to count the minutes against the IEP.'};
  const P=E.filter(e=>inR(e.d,r)),add=L=>L.reduce((s,e)=>s+e.min,0),sg=P.filter(e=>e.signed);
  const done=add(sg.filter(e=>countsIep(e,kind))),notCounted=add(sg.filter(e=>!countsIep(e,kind))),unsigned=add(P.filter(e=>!e.signed)),miss=missSum(svcMissed(),r);
  return {min,per,kind,done,lab,r,notCounted,unsigned,miss,line:done+' of '+min+' minutes '+lab};}
/* the periods the page can show: this month (always), this week, each month with an entry, the grading period, all */
let svcPer='';
function svcPeriods(E,now){const cm=monthKey(mdy(now)),wk=weekOf(now),P=[['m:'+cm,monthLabel(cm)+' (this month)'],['w','This week ('+mdy(wk.from)+' to '+mdy(wk.to)+')']];
  [...new Set(E.map(e=>monthKey(mdy(e.d))))].sort().reverse().forEach(k=>{if(k!==cm)P.push(['m:'+k,monthLabel(k)]);});
  const a=fromIso(S.meta.gp_from),b=fromIso(S.meta.gp_to);if(a&&b&&b>=a)P.push(['gp','Grading period ('+mdy(a)+' to '+mdy(b)+')']);P.push(['all','Every entry']);return P;}
function svcRange(key,now){if(key==='w'){const w=weekOf(now);return {from:w.from,to:w.to,kind:'week',lab:'the week of '+mdy(w.from)};}
  if(key==='gp'){const a=fromIso(S.meta.gp_from),b=fromIso(S.meta.gp_to);return a&&b?{from:a,to:b,kind:'grading period',lab:'the grading period '+mdy(a)+' to '+mdy(b)}:null;}
  if(key==='all')return null;const k=String(key||'').slice(2),y=+k.slice(0,4),mo=+k.slice(5,7);if(!y||!mo)return null;return {from:new Date(y,mo-1,1),to:new Date(y,mo,0),kind:'month',lab:monthLabel(k)};}
function renderSvcHints(){const n=note(),a=svcAuto(n),set=(id,v)=>{const e=document.getElementById(id);if(e)e.placeholder=v;};
  set('svcMin',isMissed(n)?'none: the session was not held':a.min!=null?a.min+' (from the times)':'from the start and end times');
  const o=document.querySelector('#svcKind option[value=""]');if(o)o.textContent=kindLab(a.kind)+(!KIND_OF[n.type]&&catSum(n)!=null?' (from the time by category)':' (from the type)');
  const ik=IEPK[S.meta.iep_kind]?S.meta.iep_kind:'',kd=KINDS.some(k=>k[0]===n.svc_kind)?n.svc_kind:a.kind,oi=document.querySelector('#svcIepCount option[value=""]');
  if(oi)oi.textContent=((IEP_COUNTS[ik]||IEP_COUNTS.both).includes(kd)?'Yes':'No')+' (from the kind'+(ik?', for '+IEPK[ik]+' minutes':'')+')';
  set('svcWith',a.with||'e.g., teacher, parent, team');set('svcNote',a.note?a.note.slice(0,100):'one line: what the service was');}
function svcHead(n){if(isMissed(n))return '<div style="grid-column:1/-1"><b>Service</b>not held'+(num(n.miss_min)!=null?': '+esc(num(n.miss_min))+' min scheduled':'')+(n.miss_reason?' ('+esc(n.miss_reason)+')':'')+'</div>';
  const e=svcOf(n,cur);return e.min!=null?'<div style="grid-column:1/-1"><b>Service</b>'+e.min+' min, '+esc(kindLab(e.kind).toLowerCase())+(e.with?', with '+esc(e.with):'')+'</div>':'';}
function svcProvider(){return S.meta.bcba||((S.notes.find(signed)||{}).sig)||'';}
function svcRows(){const now=new Date(),E=svcEntries(),r=svcRange(svcPer,now);return {now,E,r,R:E.filter(e=>inR(e.d,r)),M:svcMissed().filter(x=>inR(x.d,r))};}
function renderSvc(){const box=$('#svcOut');if(!box)return;const m=S.meta,now=new Date(),E=svcEntries(),ES=E.filter(e=>e.signed),w=weekOf(now),tw=svcTot(ES,w),tm=svcTot(ES,monthOf(now)),ta=svcTot(ES,null),ip=iepInfo(E,now);
  $$('.svc-gp').forEach(x=>{x.hidden=m.iep_per!=='grading period';});
  const dated=S.notes.filter(n=>parseDate(n.date)&&!isMissed(n)).length,nomin=dated-E.length,un=E.length-ES.length,uMin=E.filter(e=>!e.signed).reduce((s,e)=>s+e.min,0);
  const ipSub=ip?(ip.done!=null?'minutes '+ip.lab+(ip.kind?' ('+IEPK[ip.kind]+')':'')+(ip.done<ip.min?'; '+(ip.min-ip.done)+' to go':ip.done>ip.min?'; '+(ip.done-ip.min)+' over':'')+(ip.notCounted?'; '+ip.notCounted+' min of meetings, record reviews or the assessment not counted':'')+(ip.unsigned?'; '+ip.unsigned+' min in notes not yet signed':'')+(ip.miss&&ip.miss.n?'; '+missLine(ip.miss):''):ip.need):'no IEP service minutes yet: Form DM-1 through the case, or type them above';
  $('#svcMetrics').innerHTML=`<div class="metric"><b>This week</b><div class="val">${tw.total} min</div><div class="sub">${mdy(w.from)} to ${mdy(w.to)} · direct ${tw.direct} · consultation and other ${tw.consult}</div></div>
    <div class="metric"><b>${monthLabel(monthKey(mdy(now)))}</b><div class="val">${tm.total} min</div><div class="sub">${tm.n} entr${tm.n===1?'y':'ies'} · direct ${tm.direct} · consultation and other ${tm.consult}</div></div>
    <div class="metric ${ip&&ip.done!=null?(ip.done>=ip.min?'m-ok':'m-mid'):''}" id="svcIep"><b>Against the IEP</b><div class="val">${ip?(ip.done!=null?ip.done+' of '+ip.min:'—'):'—'}</div><div class="sub">${esc(ipSub)}</div></div>
    <div class="metric"><b>Entries</b><div class="val">${E.length}</div><div class="sub">${nomin>0?nomin+' dated note'+(nomin===1?' has':'s have')+' no minutes or times':'every dated note has its minutes'}${un?' · '+un+' not yet signed ('+uMin+' min), not certified or counted':' · all signed'}</div></div>`;
  const MM=svcMissed(),mw=missSum(MM,w),mmo=missSum(MM,monthOf(now)),mal=missSum(MM,null),nc=t=>t.total-t.direct-t.indirect;
  $('#svcTot').innerHTML='<thead><tr><th>Kind</th><th>This week (min)</th><th>This month (min)</th><th>Every entry (min)</th></tr></thead><tbody>'+KINDS.map(([k,l])=>'<tr><td class="lk">'+l+'</td><td class="num">'+(tw.by[k]||'—')+'</td><td class="num">'+(tm.by[k]||'—')+'</td><td class="num">'+(ta.by[k]||'—')+'</td></tr>').join('')+
    '<tr class="tot"><td>Total, signed notes</td><td class="num">'+tw.total+'</td><td class="num">'+tm.total+'</td><td class="num">'+ta.total+'</td></tr>'+
    (ip&&ip.done!=null?'<tr><td class="lk">Against the IEP</td><td colspan="3">'+esc(ip.line)+' (counting '+countWhat(ip.kind)+(ip.notCounted?'; '+ip.notCounted+' min of meetings, record reviews and the assessment are not counted toward the IEP minutes':'')+')</td></tr>':'')+
    (mal.n?'<tr><td class="lk">Sessions not held (min scheduled)</td><td class="num">'+(mw.total||'—')+'</td><td class="num">'+(mmo.total||'—')+'</td><td class="num">'+mal.total+'</td></tr><tr><td class="lk">Not held, by reason</td><td colspan="3">'+esc(missLine(mal))+'</td></tr>':'')+
    (un?'<tr><td class="lk">Not yet signed</td><td colspan="3">'+un+' note'+(un===1?'':'s')+', '+uMin+' min: not certified and not counted until signed</td></tr>':'')+'</tbody>';
  /* the period and the page */
  const P=svcPeriods(E,now);if(!P.some(p=>p[0]===svcPer))svcPer=P[0][0];const sel=$('#svcPeriod');if(sel)sel.innerHTML=P.map(p=>'<option value="'+p[0]+'"'+(p[0]===svcPer?' selected':'')+'>'+esc(p[1])+'</option>').join('');
  const r=svcRange(svcPer,now),RA=E.filter(e=>inR(e.d,r)),R=RA.filter(e=>e.signed),RU=RA.filter(e=>!e.signed),RM=MM.filter(x=>inR(x.d,r)),tp=svcTot(R,null),provider=svcProvider();
  $('#svcCount').textContent=R.length+' signed entr'+(R.length===1?'y':'ies')+', '+tp.total+' minutes'+(RU.length?'; '+RU.length+' not yet signed':'')+(RM.length?'; '+RM.length+' not held':'');
  let iepLine='';const im=num(m.iep_min);if(im!=null&&im>0)iepLine=im+' minutes per '+(m.iep_per||'month')+(IEPK[m.iep_kind]?', '+IEPK[m.iep_kind]:'')+(m.iep_note?'; '+m.iep_note:'');
  const ik=ip?ip.kind:'',cnt=R.filter(e=>countsIep(e,ik)).reduce((s,e)=>s+e.min,0),left=tp.total-cnt;
  const against=ip&&r&&r.kind===ip.per?'Against the IEP: '+cnt+' of '+ip.min+' minutes in '+r.lab+' (counting '+countWhat(ik)+').':'';
  const rule=iepLine?'Counted toward the IEP’s minutes: '+countWhat(ik)+', from signed notes. Not counted unless a note says so: IEP and team meetings, parent and consent meetings, record reviews and the assessment'+(left?' ('+left+' min in this period)':'')+'.':'';
  const tr=e=>'<tr class="open" data-open="'+e.i+'" tabindex="0" role="button" aria-label="Open the note of '+esc(mdy(e.d))+'"><td>'+mdy(e.d)+'</td><td>'+esc(e.n.start?fmtHM(e.n.start):'')+'</td><td>'+esc(e.n.end?fmtHM(e.n.end):'')+'</td><td class="num">'+e.min+'</td><td>'+esc(kindLab(e.kind))+(e.n.type&&e.n.type!==kindLab(e.kind)?' ('+esc(e.n.type)+')':'')+(ip&&!countsIep(e,ik)?' <i>not counted toward the IEP</i>':'')+'</td><td>'+esc(e.with)+'</td><td>'+esc(e.note)+'</td><td>'+esc(e.n.sig_date||'')+'</td></tr>';
  const head='<thead><tr><th style="width:10%">Date</th><th style="width:8%">Start</th><th style="width:8%">End</th><th style="width:7%">Minutes</th><th style="width:17%">Service</th><th style="width:14%">With</th><th>Note</th><th style="width:9%">Signed</th></tr></thead>';
  box.innerHTML='<div class="sl-title">Service Log: Behavior Analysis Services</div>'+
    '<div class="sl-head"><div><b>Student</b>'+esc(m.client||'')+'</div><div><b>Student ID</b>'+esc(m.sid||'')+'</div><div><b>Date of birth</b>'+esc(m.dob||'')+'</div>'+(m.medicaid?'<div><b>Medicaid ID</b>'+esc(m.medicaid)+'</div>':'')+
    '<div><b>School</b>'+esc(m.school||'')+'</div><div><b>Provider</b>'+esc(provider)+'</div><div><b>Period</b>'+esc(r?r.lab+(r.kind==='month'?' ('+mdy(r.from)+' to '+mdy(r.to)+')':''):'every entry')+'</div>'+
    '<div style="grid-column:1/-1"><b>IEP service</b>'+(iepLine?esc(iepLine):'<span class="cn-empty">not recorded</span>')+'</div></div>'+
    (R.length?'<table class="sl-t">'+head+'<tbody>'+R.map(tr).join('')+
      '<tr class="tot"><td colspan="3">Total, '+R.length+' entr'+(R.length===1?'y':'ies')+'</td><td class="num">'+tp.total+'</td><td colspan="4">'+(tp.total>=60?fmtDur(tp.total):'')+'</td></tr></tbody></table>'+
      '<p class="sl-sum">'+KINDS.filter(([k])=>tp.by[k]).map(([k,l])=>l+' '+tp.by[k]+' min').join(' · ')+'.'+(against?' '+esc(against):'')+'</p>'
      :'<p class="cn-empty">No signed service entries in this period. An entry is a signed note with a date and its minutes (or start and end times).</p>')+
    (rule?'<p class="sl-rule">'+esc(rule)+'</p>':'')+
    (RM.length?'<h4 class="sl-h">Scheduled sessions not held (no service delivered)</h4><table class="sl-t"><thead><tr><th style="width:10%">Date</th><th style="width:12%">Minutes scheduled</th><th>Reason</th><th style="width:20%">Made up on</th><th style="width:9%">Signed</th></tr></thead><tbody>'+
      RM.map(x=>'<tr class="open" data-open="'+x.i+'" tabindex="0" role="button" aria-label="Open the note of '+esc(mdy(x.d))+'"><td>'+mdy(x.d)+'</td><td class="num">'+x.min+'</td><td>'+esc(x.n.miss_reason||'not recorded')+'</td><td>'+(x.mu?esc(x.n.miss_madeup)+' ('+x.mu.min+' min)':x.n.miss_madeup?esc(x.n.miss_madeup)+' (no note yet)':'not made up')+'</td><td>'+esc(x.n.sig_date||'not signed')+'</td></tr>').join('')+'</tbody></table>'+
      '<p class="sl-sum">'+esc(missLine(missSum(RM,null)))+' Whether a missed session is owed is the district&rsquo;s rule.</p>':'')+
    '<p class="sl-att">I certify that the services listed were provided as recorded, on the dates and for the times shown, and that each is documented in a dated and signed note on Form CN-1.'+(RM.length?' The sessions listed as not held were not provided, for the reasons shown.':'')+'</p>'+
    '<div class="sl-sig"><span>Provider signature: <span class="bl"></span></span><span>Date: <span class="bl" style="min-width:120px"></span></span><span>Name and credential: <b>'+esc(provider)+'</b></span></div>'+
    (RU.length?'<h4 class="sl-h">Not yet signed: not certified</h4><p class="hint">These notes are not part of the certification above until each is signed on Form CN-1.</p><table class="sl-t">'+head+'<tbody>'+RU.map(tr).join('')+'</tbody></table>':'')+
    '<div class="sl-foot"><span>Confidential student record; retain with the behavior file.</span><span>Form CN-1 · Service log · printed '+mdy(now)+'</span></div>';}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  /* v22.52 (review F333) a plan line typed by hand keeps its own version number, and the case no longer rewrites the case line */
  if(el.dataset.n==='plan')note().plan_v=String(planVerOf(el.value)||'');
  if(el.dataset.m==='plan'){S.meta.plan_src='';S.meta.plan_v=String(planVerOf(el.value)||'');}
  if(el.dataset.n!==undefined){note()[el.dataset.n]=el.value;renderComputed();if(el.dataset.n==='date'||el.dataset.n==='type'||el.dataset.n==='setting')renderNoteSelSoon();return;}
  if(el.dataset.x!==undefined&&el.type!=='checkbox'){note().next[+el.dataset.i][el.dataset.x]=el.value;renderNoteOutSoon();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderNoteOutSoon();renderSvcSoon();}
  if(el.id==='logSearch')renderLog();
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.n!==undefined){note()[el.dataset.n]=el.value;renderComputed();renderNoteSel();return;}
  if(el.dataset.x!==undefined){note().next[+el.dataset.i][el.dataset.x]=el.type==='checkbox'?el.checked:el.value;renderComputed();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderNoteOut();renderSvc();}
  if(el.id==='logType'||el.id==='logMonth')renderLog();
  if(el.id==='svcPeriod'){svcPer=el.value;renderSvc();}
});
document.addEventListener('click',e=>{const tr=e.target.closest('tr[data-open]');if(!tr)return;cur=+tr.dataset.open;renderNote();setView('note');});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const tr=e.target.closest&&e.target.closest('tr[data-open]');if(!tr||e.target.tagName==='INPUT')return;cur=+tr.dataset.open;renderNote();setView('note');});
let selT=0,outT=0,svcT=0;function renderNoteSelSoon(){clearTimeout(selT);selT=setTimeout(renderNoteSel,400);}function renderNoteOutSoon(){clearTimeout(outT);outT=setTimeout(renderComputed,300);}function renderSvcSoon(){clearTimeout(svcT);svcT=setTimeout(renderSvc,300);}
$('#noteSel').addEventListener('change',e=>{cur=+e.target.value;renderNote();});
$('#newNote').addEventListener('click',()=>{if(S.notes.length>=400)return;S.notes.push(newNote());cur=S.notes.length-1;renderNote();$('[data-n="date"]').focus();});
/* v22.52 (review F329) a note like this one takes the setting, the plan, the type and the kind of service; not who was
   present, the purpose or a signature, which belong to the visit being written */
$('#dupNote').addEventListener('click',()=>{if(S.notes.length>=400)return;const o=note(),n=newNote();['type','setting','plan','plan_v','svc_kind','svc_iep'].forEach(f=>{n[f]=o[f]||'';});S.notes.push(n);cur=S.notes.length-1;renderNote();$('[data-n="date"]').focus();});
$('#delNote').addEventListener('click',async ()=>{const n=note(),k=cur;if((n.date||n.observed||n.problems||signed(n))&&!(await nbhUI.confirm('Delete note '+(k+1)+' ('+(n.date||'no date')+')?\n'+(signed(n)?'This note is signed ('+n.sig_date+'). ':'')+'The note and its next steps are deleted; this cannot be undone.',{ok:'Delete',danger:true})))return;S.notes.splice(k,1);cur=Math.max(0,k-1);renderNote();});
/* v22.52 (review F329) Sign this note: the name and credential from the case, the date and the time, once the note says what
   was done and why; the note is then locked. A later correction is a dated addendum; withdrawing the signature to correct
   the note is recorded on it as an addendum too. */
$('#signNote').addEventListener('click',async ()=>{const n=note(),k=cur;if(signed(n))return;const L=signNeeds(n);
  if(L.length){nbhUI.toast('Not signed yet: the note still needs '+L.join(', ')+'.',{kind:'warn'});return;}
  const who=String(S.meta.bcba||'').trim()||String(n.sig||'').trim();
  if(!who){nbhUI.toast('Type the case BCBA\u2019s name and credentials on The Case first; the signature is written from it.',{kind:'warn'});const b=$('[data-m="bcba"]');if(b)b.focus();return;}
  if(!(await nbhUI.confirm('Sign note '+(k+1)+' ('+n.date+') as '+who+'?\nSigning states that the note is accurate and complete. The note is then locked; a later correction goes in as a dated addendum.',{ok:'Sign the note'})))return;
  const t=new Date();n.sig=who;n.sig_date=Ymd(t);n.sig_time=HMof(t);renderNote();nbhUI.toast('Note '+(k+1)+' signed '+n.sig_date+'.',{kind:'ok'});});
$('#addAdd').addEventListener('click',()=>{const b=$('#addBox');b.hidden=false;const t=$('#addText');t.value='';t.focus();});
$('#addCancel').addEventListener('click',()=>{$('#addBox').hidden=true;});
$('#addSave').addEventListener('click',()=>{const n=note(),t=String($('#addText').value||'').trim();if(!t){nbhUI.toast('Write the addendum first.');return;}if(!signed(n))return;
  const d=new Date();n.add.push({date:Ymd(d),time:HMof(d),by:String(S.meta.bcba||'').trim()||n.sig,text:t.slice(0,2000)});$('#addBox').hidden=true;renderComputed();nbhUI.toast('Addendum added to note '+(cur+1)+'.',{kind:'ok'});});
$('#unsignNote').addEventListener('click',async ()=>{const n=note();if(!signed(n))return;
  if(!(await nbhUI.confirm('Withdraw the signature of '+n.sig_date+' to correct note '+(cur+1)+'?\nThe withdrawal stays on the note as a dated addendum. The note is unlocked and leaves the certified service log until it is signed again.',{ok:'Withdraw the signature',danger:true})))return;
  const d=new Date();n.add.push({date:Ymd(d),time:HMof(d),by:String(S.meta.bcba||'').trim()||n.sig,text:'Signature of '+n.sig_date+' withdrawn to correct the note.'});n.sig='';n.sig_date='';n.sig_time='';renderNote();});
$('#addNx').addEventListener('click',()=>{if(note().next.length>=12)return;note().next.push({what:'',who:'',when:'',done:false});renderNx();});
$('#delNx').addEventListener('click',async ()=>{const nx=note().next;if(nx.length<=1)return;if(nx[nx.length-1].what&&!(await nbhUI.confirm('Remove the last step?\nThe next step, its owner and its date are deleted.',{ok:'Remove',danger:true})))return;nx.pop();renderNx();renderComputed();});
async function rowDel(r,i){
  if(signed(note()))return;   /* v22.52 (review F329) a signed note's steps are kept as signed */
  if(r==='nx'){const nx=note().next,st=nx[i];if(!st)return;if((st.what||st.who||st.when)&&!(await nbhUI.confirm('Delete this row?\nThe next step it holds is deleted.',{ok:'Delete',danger:true})))return;nx.splice(i,1);if(!nx.length)nx.push({what:'',who:'',when:'',done:false});renderNx();renderComputed();}
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});}
function renderAll(){ensure();bindMeta();renderNote();renderLog();renderSvc();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='log')renderLog();if(b.dataset.view==='svc')renderSvc();}));

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#notePrintBtn').addEventListener('click',()=>{const n=note();if(!n.date&&!n.type){alert('This note is empty; there is nothing to print yet.');return;}
  document.body.classList.add('cn-note-only');
  const st=document.createElement('style');st.id='cnNotePage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('cn-note-only');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'CN-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`CN-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='CN-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v);
  if(s.meta&&typeof s.meta==='object'&&!Array.isArray(s.meta))Object.keys(s.meta).forEach(k=>{o.meta[k]=str(s.meta[k]);});
  o.notes=Array.isArray(s.notes)?s.notes.slice(0,400).map(x=>{const n={};NFIELDS.forEach(f=>{n[f]=str(x&&x[f]);});if(!TYPES.includes(n.type))n.type='';if(!KINDS.some(k=>k[0]===n.svc_kind))n.svc_kind='';
    n.next=Array.isArray(x&&x.next)?x.next.slice(0,12).map(y=>({what:str(y&&y.what),who:str(y&&y.who),when:str(y&&y.when),done:!!(y&&y.done)})):[];
    n.add=Array.isArray(x&&x.add)?x.add.slice(0,50).filter(y=>y&&typeof y==='object').map(y=>({date:str(y.date),time:str(y.time),by:str(y.by),text:str(y.text).slice(0,2000)})):[];return n;}):[];   /* v22.52 (review F329) the addenda */
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='CN-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved CN-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form CN-1. Nothing was changed.':'That file could not be read as a saved CN-1 form. Nothing was changed.');return;}
    /* v21.87 a file opens on its last note (the newest; new notes are added at the end), not the first */
    const prev=S;S=next;cur=Math.max(0,((next&&next.notes)||[]).length-1);try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved CN-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const head=['#','Date','Start','End','Minutes','Type','Setting','Present','Plan in force','Purpose','Data reviewed','Rate','Goal','Unit','Direction','Observed','Integrity %','Integrity date','Integrity note','Problems','Recommendations','Changes','Authority','Training','Materials','Next steps','Observation min','Consultation min','Training min','Direct min','Meeting min','Documentation min','Travel min','Signed','Date signed','Written on','Service minutes','Service kind','With whom','Service note',
    /* v22.52 */ 'Counts toward the IEP','Behavior','The week','Phase average','Criterion run (days)','Criterion needed (days)','Critical-step integrity %','Integrity criterion %','Plan type (TI-1 bands)','Integrity observed by','Integrity at this visit or reported','Feedback to the implementer','Kind of change','Safety since the last visit','Assent','Assent shown','Withdrawal and how honored','Participation','Not held: reason','Not held: minutes scheduled','Not held: made up on','Time signed','Addenda'];
  const out=[head];noteRows().reverse().forEach(r=>{const n=r.n;out.push([r.i+1,n.date,n.start,n.end,r.dur==null?'':r.dur,n.type,n.setting,n.present,n.plan,n.purpose,n.data_forms,n.data_rate,n.data_goal,n.data_unit,n.data_dir==='up'?'higher is better':'lower is better',n.observed,n.integ,n.integ_date,n.integ_note,n.problems,n.recs,n.changes,authText(n),n.training,n.materials,n.next.filter(s=>s.what).map(s=>s.what+' ('+s.who+(s.when?', by '+s.when:'')+(s.done?', done':'')+')').join('; '),n.t_obs,n.t_cons,n.t_train,n.t_direct,n.t_meet,n.t_doc,n.t_travel,n.sig_date?n.sig:'',n.sig_date,n.written].concat((e=>isMissed(n)?['0','Not held','',e.note]:[e.min==null?'':e.min,kindLab(e.kind),e.with,e.note])(svcOf(n,r.i)),
    [isMissed(n)?'':(e=>countsIep(e,IEPK[S.meta.iep_kind]?S.meta.iep_kind:'')?'yes':'no')(svcOf(n,r.i)),n.data_beh,n.data_week,n.data_phase,n.data_run,n.data_need,n.integ_crit,n.integ_criterion,n.integ_ptype,n.integ_by,n.integ_how,[n.fb_who,n.fb_data,n.fb_change].filter(Boolean).join('; '),CHG_LAB[n.chg_kind]||'',n.safety,n.as_given,n.as_how,n.as_withdraw,n.as_part,n.miss_reason,n.miss_min,n.miss_madeup,n.sig_time,(n.add||[]).map(a=>a.date+' '+a.time+' '+a.by+': '+a.text).join(' | ')]));});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='CN-1_log.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();cur=0;renderAll();setView('note');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nSeven notes over five weeks are filled in as a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const day=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()-1);return d;};
  const Y=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);const fwd=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x;};
  /* v22.52 (review F332) a date k school days on (or back, k<0): a TI-1 the para scores falls on a school day */
  const sch=(d,k)=>{const x=new Date(d),s=k<0?-1:1;let n=Math.abs(k);while(n>0){x.setDate(x.getDate()+s);if(x.getDay()!==0&&x.getDay()!==6)n--;}return x;};
  S=blank();cur=0;
  const v2='BIP version 2, revised '+Y(day(45))+', notice '+Y(day(44))+' (Form TD-1)';
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',school:'Lincoln Elementary, Riverside USD',bcba:'Jordan Ellis, M.A., BCBA (simulated)',plan:v2,plan_v:'2',service:'4 hours a month of consultation under the district contract; parent consent on IC-1 dated '+Y(day(60)),goal:'Elopement from the classroom (TB-1); goal no more than 1 per day over 4 consecutive school weeks (GB-1)',dob:'3/14/2016',iep_min:'120',iep_per:'month',iep_kind:'consult',iep_note:'Behavior consultation to the classroom team (IEP services page, Form DM-1)'};
  const sig='Jordan Ellis, M.A., BCBA (simulated)';
  /* v22.52 (review F329) each simulated note is signed the day it was written, after its end time */
  const mk=(o)=>{const n=newNote();Object.assign(n,o);n.sig=sig;n.sig_date=n.sig_date||n.date;n.sig_time=n.sig_time||toHM24(n.end)||'16:00';n.plan=n.plan||S.meta.plan;n.plan_v=n.plan_v||planVerOf(n.plan)||'';return n;};
  const d1=day(33),d2=day(26),d3=day(19),d4=day(14),d5=day(7),d6=day(2),dm=sch(d5,-1),ti2=sch(d1,3),ti6=sch(d6,-2);
  const v3='BIP version 3, revised '+Y(d5)+', notice '+Y(d5)+' (Form TD-1)';
  S.notes=[
    mk({date:Y(d1),start:'9:00 am',end:'10:30 am',type:'Observation',setting:'Room 12 (Ms. R.) and the hallway',present:'Ms. R. (teacher), J. Ortiz (paraeducator), the student',purpose:'First observation under BIP version 2; TI-1 taken',
      data_forms:'Daily Behavior Data '+Y(fwd(d1,-7))+' to '+Y(fwd(d1,-1))+'; TI-1 of this date',data_beh:'Elopement',data_rate:'2.4',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week before this visit',
      observed:'Three elopements in 90 minutes, all within a minute of an independent-work direction. The break card was on the desk but was not offered before the direction on any of the three; on the second, Ms. R. followed to the hallway and talked for about two minutes before the return. The para delivered praise at the planned rate during the carpet activity.',
      safety:'None since the plan began: no restraint this semester, no incident beyond the elopements counted, no injury recorded.',
      integ:'62',integ_date:Y(d1),integ_by:'the BCBA',integ_how:'observed at this visit',integ_ptype:'Behavior reduction',integ_note:'Steps 2 (offer the card before the direction) and 5 (silent return) missed on every opportunity',
      fb_who:'Ms. R. (teacher) and J. Ortiz (paraeducator)',fb_data:'the TI-1 of this date, steps 2 and 5 marked',fb_change:'offer the card before each independent-work direction; a silent return',
      problems:'The antecedent step is not being run: the card is present but not offered.\nThe hallway conversation is attention after elopement, which is the function the FBA found.',
      recs:'Re-train steps 2 and 5 with the teacher and the para before any change to the plan.\nMove the card prompt into the direction itself (“work time: card or start”).',
      changes:'none',chg_kind:'none',training:'Fifteen minutes after the observation: modeled step 2 twice with the para as the student, Ms. R. rehearsed it three times with feedback; silent return practiced once (Form ST-1).',materials:'TI-1 checklist for the para to score on '+Y(ti2)+'; a second break card for the hallway',
      t_obs:'60',t_cons:'15',t_train:'15',t_doc:'20',t_travel:'25',
      next:[{what:'Para scores TI-1 on Ms. R. during one independent-work block',who:'J. Ortiz',when:Y(ti2),done:true},{what:'Phone check on the TI-1 score and the week’s count',who:'J. Ellis',when:Y(fwd(d1,7)),done:true}]}),
    mk({date:Y(d2),start:'3:15 pm',end:'3:40 pm',type:'Phone or video call',setting:'By phone',present:'Ms. R. (teacher)',purpose:'Follow-up on the retraining and the week’s data',
      data_forms:'Daily Behavior Data '+Y(fwd(d2,-6))+' to '+Y(fwd(d2,-1))+'; para’s TI-1 of '+Y(ti2),data_beh:'Elopement',data_rate:'1.6',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week to this call',
      observed:'Ms. R. reports offering the card before each direction since the retraining; the para’s TI-1 scored 88%, with the silent return missed once. Count down to 8 for the week from 12.',
      integ:'88',integ_date:Y(ti2),integ_by:'J. Ortiz (paraeducator)',integ_how:'reported to the BCBA',integ_ptype:'Behavior reduction',integ_note:'Step 5 missed once (para’s score)',problems:'Return from the hallway still draws a sentence or two from Ms. R. on the harder days.',recs:'Keep the plan as written for two more weeks before judging it; the para scores TI-1 again next week.',changes:'none',chg_kind:'none',training:'',materials:'',
      t_cons:'25',t_doc:'10',next:[{what:'Para scores TI-1 again',who:'J. Ortiz',when:Y(sch(d2,5)),done:true}]}),
    mk({date:Y(d3),start:'8:30 am',end:'10:00 am',type:'Observation',setting:'Room 12 and specials (art)',present:'Ms. R. (teacher), J. Ortiz (paraeducator), Mr. K. (art teacher), the student',purpose:'Second observation; generalization to specials',
      data_forms:'Daily Behavior Data '+Y(fwd(d3,-7))+' to '+Y(fwd(d3,-1))+'; TI-1 of this date',data_beh:'Elopement',data_rate:'1.2',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week before this visit',
      observed:'One elopement in 90 minutes, from art, where no card was available and Mr. K. had not been briefed. In Room 12 the card was offered before every direction (6 of 6) and the one request for a break was honored within 10 seconds.',
      safety:'None since the last visit: no restraint, incident or injury recorded.',
      integ:'94',integ_date:Y(d3),integ_by:'the BCBA',integ_how:'observed at this visit',integ_ptype:'Behavior reduction',integ_note:'Room 12 only; art not scored',problems:'The plan does not travel to specials: no card, no briefing.',recs:'Add specials to the plan with a card kept by the art teacher and a one-page brief (Form EB-1).',
      /* v22.52 (review F328) extending the plan to specials is no rule the plan writes: recommended here, decided by the team at the IEP meeting */
      changes:'Recommended: add specials (art, music, PE) to the settings the plan covers, with a card in each room and the specials teachers briefed (EB-1); unchanged until the team decides.',chg_kind:'recommended',training:'Ten minutes with Mr. K.: the card, the honor-within-10-seconds rule, the silent return (instruction and one model).',materials:'EB-1 brief for art, music and PE; a laminated card for each',
      t_obs:'60',t_cons:'20',t_train:'10',t_doc:'20',t_travel:'25',next:[{what:'Take the specials change to the team at the IEP meeting',who:'J. Ellis',when:Y(d5),done:true},{what:'Parent meeting to review the first month',who:'J. Ellis',when:Y(d4),done:true}]}),
    mk({date:Y(d4),start:'2:30 pm',end:'3:10 pm',type:'Parent meeting',setting:'Conference room; father by video',present:'Ms. Alvarez (mother), Mr. Alvarez (father, by video), Ms. R. (teacher)',purpose:'Monthly review with the family',
      data_forms:'Daily Behavior Data for the month; home tally sheet (HD-1) weeks 1 to 3',data_beh:'Elopement',data_rate:'1.0',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week before this meeting',
      observed:'Family reports the same pattern at homework; the home tally shows 2 to 3 a day in week 1 and 0 to 1 in week 3 after the timer went in. Parents asked whether the card could be used at home.',
      safety:'None since the last visit (no restraint, incident or injury recorded); the family reports none at home.',
      problems:'',recs:'Use the same card at homework with the honor rule; keep the home tally sheet going for four more weeks.',changes:'None to the school plan. The family will try the same break card at homework as their own routine, agreed at this meeting, and keep the home tally sheet (HD-1).',chg_kind:'none',training:'Fifteen minutes with the parents: the card, the honor rule, the silent return; mother rehearsed twice.',materials:'Two break cards for home; HD-1 sheets for four weeks',
      t_meet:'40',t_doc:'15',t_travel:'25',next:[{what:'Send the home graph by text every Friday',who:'J. Ellis',when:Y(fwd(d4,3)),done:true}]}),
    /* v22.52 (review F334) a scheduled consultation that did not happen, made up at the next visit */
    mk({date:Y(dm),start:'',end:'',type:'Scheduled session not held',setting:'Room 12, planning period',present:'',purpose:'Scheduled consultation with the classroom team',
      observed:'Ms. R. was called to cover another class; the planning-period consultation was cancelled at 9:50 and moved to the next planning period the team had.',
      miss_reason:'Staff not available',miss_min:'45',miss_madeup:Y(d6),changes:'',chg_kind:'',sig_time:'10:05',next:[{what:'Reschedule the consultation',who:'J. Ellis',when:Y(d6),done:true}]}),
    mk({date:Y(d5),start:'1:00 pm',end:'2:00 pm',type:'IEP or team meeting',setting:'Conference room',present:'IEP team: Ms. Alvarez (mother), Ms. R., Ms. T. (case manager), Dr. P. (school psychologist), J. Ellis',purpose:'Annual IEP; BIP review',
      data_forms:'Monthly summary graph; TI-1 scores to date (62, 88, 94)',data_beh:'Elopement',data_rate:'0.8',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week before the meeting',
      observed:'Team reviewed the month: rate down from 2.4 to 0.8 per day. Integrity 94% at the BCBA’s observation in Room 12 (specials not scored) and 88% on the para’s check before it. At or below the goal level for two consecutive weeks; the goal asks for four.',
      safety:'None since the last visit: no restraint this semester, no incident beyond the elopements counted, no injury.',
      problems:'',recs:'Hold the plan as written until the four-week criterion is met, then begin thinning the card prompt (PR-1).',
      /* v22.52 (review F328) the revision with the team's date, the notice, the parent's consent to it and when the family was told */
      changes:'Specials (art, music, PE) added to the settings the plan covers, with a break card kept in each room and each specials teacher briefed with EB-1 (recommended at the visit of '+Y(d3)+'). Nothing else changed.',chg_kind:'revision',chg_iep:Y(d5),chg_pwn:Y(d5)+', given at the meeting',chg_subst:'yes',chg_consent:Y(d5)+', in writing at the meeting (recorded on Form IC-1)',chg_told:Y(d5)+', the mother was at the meeting',training:'',materials:'',
      t_meet:'60',t_doc:'20',t_travel:'25',next:[{what:'Enter version 3 on Form TD-1 and its phase line on Form DD-1; send EB-1 to music and PE',who:'J. Ellis',when:Y(sch(d5,1)),done:true},{what:'Periodic plan review on PR-1 when four consecutive weeks at or below the goal level are reached',who:'J. Ellis',when:Y(fwd(d5,21)),done:false}]}),
    mk({date:Y(d6),start:'10:00 am',end:'10:45 am',type:'Consultation',setting:'Room 12, planning period',present:'Ms. R. (teacher), J. Ortiz (paraeducator)',purpose:'Data check and thinning plan; makes up the consultation not held on '+Y(dm),plan:v3,plan_v:'3',
      data_forms:'Daily Behavior Data '+Y(fwd(d6,-7))+' to '+Y(fwd(d6,-1))+'; para’s TI-1 of '+Y(ti6),data_beh:'Elopement',data_rate:'0.6',data_goal:'1',data_unit:'per day',data_dir:'',data_week:'the week before this visit, 5 days recorded',data_phase:'0.9 per day over 15 days (BIP version 2, then 3)',data_run:'14',data_need:'20',
      observed:'Third consecutive week at or below the goal level (Form DD-1). The para’s TI-1 at 91%; the missed step was the praise rate during independent work.',integ:'91',integ_date:Y(ti6),integ_by:'J. Ortiz (paraeducator)',integ_how:'reported to the BCBA',integ_ptype:'Behavior reduction',integ_note:'Praise rate below the planned 1 per 2 minutes in one block',
      safety:'None since the last visit: no restraint this semester, no incident beyond the elopements counted, no injury.',
      fb_who:'J. Ortiz (paraeducator)',fb_data:'her TI-1 of '+Y(ti6)+' and the week’s graph',fb_change:'praise at the planned 2-minute interval, with a timer',
      problems:'Praise is thinning on its own before the plan says to.',recs:'Keep praise at the planned rate until the PR-1 review; the thinning step is written there, not improvised.',changes:'none',chg_kind:'none',training:'Five-minute reminder with a timer app for the praise interval.',materials:'Interval timer set to 2 minutes on the para’s phone',
      t_cons:'35',t_train:'5',t_doc:'10',t_travel:'25',next:[{what:'Para scores TI-1 during independent work',who:'J. Ortiz',when:Y(sch(d6,3)),done:false},{what:'Confirm week four at or below the goal level and schedule PR-1',who:'J. Ellis',when:Y(fwd(d6,7)),done:false}]})
  ];
  S.meta.plan=v3;S.meta.plan_v='3';   /* the plan the IEP meeting adopted is the one in force now */
  cur=S.notes.length-1;renderAll();setView('log');
  nbhUI.toast('Simulation loaded: '+'a simulated case of seven notes over five weeks, each signed, with next steps, time by category, a session not held and the hours log.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. The "primary target and goal" line is composed from the first behavior on
   Form TB-1 and the reduction objective on Form GB-1 that names it. */
function nbhCnGoalLine(behs,red){
  const b=behs[0];const l=b?b.label.toLowerCase():'';
  const r=red.find(x=>x.beh&&l&&(x.beh.toLowerCase().indexOf(l.slice(0,12))>=0||l.indexOf(x.beh.toLowerCase().slice(0,12))>=0))||(!b&&red[0])||null;
  if(!b&&!r)return '';
  return (b?b.label:r.beh)+(r&&r.tgt?'; goal: no '+(r.ml||'more')+' than '+r.tgt+(r.crit?' over '+r.crit+' consecutive measurements':'')+' (Form GB-1)':'');
}
/* v21.75 the note starts from Form DD-1's week summary: the data reviewed, the first reduction target against its aim, what
   the week looked like against the last (each behavior, the incidents, the phase changes, what the team decided) and the
   latest Form TI-1 observation, into the empty fields of the note open; "Start from the week summary" does it again.
   v22.52 (review F331) the week's figure is the target's mean for that week (DD-1's day-by-day record, else its week row),
   the phase average goes on its own line, the unit is one of the note's own, and DD-1's criterion run comes with it;
   (F332) TI-1's critical-step figure and criterion come too; (I166) the safety line is filled from the case. */
const nbhCnMd=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?(+m[2])+'/'+(+m[3])+'/'+m[1].slice(2):String(iso||'');};
const DD_UNIT={count:'per day',rate:'per hour',duration:'minutes per day',pdur:'percent of time',interval:'percent of intervals',mts:'percent of intervals',pint:'percent of intervals',wint:'percent of intervals',latency:'minutes',ied:'minutes',opps:'percent correct',trials:'percent independent',prompt:'mean prompt level'};
function nbhCnWeekFig(d,t){const w=d&&d.week;if(!w||!t)return null;const p=String(w.mon||'').split('-'),a=new Date(+p[0],+p[1]-1,+p[2]),b=new Date(+p[0],+p[1]-1,+p[2]+6);
  const V=Array.isArray(d.series)?d.series.filter(x=>{const q=fromIso(x&&x.date);return q&&q>=a&&q<=b&&x.v&&typeof x.v[t.name]==='number';}).map(x=>x.v[t.name]):[];
  if(V.length)return {mean:Math.round(V.reduce((s,v)=>s+v,0)/V.length*100)/100,days:V.length};
  const r=(w.rows||[]).find(x=>x&&x.name===t.name),txt=r?String(r.now||''):'';if(!txt||txt==='—')return null;
  const m=/\(([\d.]+)\s+a day\)/.exec(txt)||/^([\d.]+)/.exec(txt);return m?{mean:+m[1],days:null}:null;}
function nbhCnWeek(f){const d=f&&f.data,w=d&&d.week,ti=f&&f.integrity,out={};if(!w&&!ti)return out;
  if(w){const fri=(()=>{const p=w.mon.split('-');const x=new Date(+p[0],+p[1]-1,+p[2]+4,12);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');})();
    out.data_forms='Daily Behavior Data (Form DD-1), week of '+nbhCnMd(w.mon)+' to '+nbhCnMd(fri)+(ti&&ti.obs.length?'; TI-1 of '+nbhCnMd(ti.obs[ti.obs.length-1].date):'');
    const L=['The week of '+nbhCnMd(w.mon)+' ('+w.days+' day'+(w.days===1?'':'s')+' recorded), against the week before:'];
    w.rows.forEach(r=>{if(r.now==='—'&&r.last==='—')return;L.push('- '+r.name+': '+r.now+(r.last&&r.last!=='—'?', the week before '+r.last:'')+(r.change&&r.change!=='—'?' ('+r.change+')':'')+'.');});
    L.push('Incidents logged: '+(w.incidents||'none')+'.');
    (w.phases||[]).forEach(p=>L.push('Phase change '+nbhCnMd(p.date)+': '+(p.type==='full'?'full phase change':'conditional change')+(p.label?', '+p.label:'')+'.'));
    if(w.decided)L.push('The team decided: '+w.decided.replace(/\n+/g,'; ')+'.');
    out.observed=L.join('\n');
    const t=(d.behaviors||[]).find(b=>b.kind==='target'&&b.aim!=null&&b.cur);
    if(t){const u=DD_UNIT[t.measure]||'';out.data_beh=t.name||'';out.data_goal=String(t.aim);out.data_unit=u;out.data_dir=t.direction==='increase'?'up':'';
      const wf=nbhCnWeekFig(d,t);if(wf){out.data_rate=String(wf.mean);out.data_week='week of '+nbhCnMd(w.mon)+(wf.days!=null?', '+wf.days+' day'+(wf.days===1?'':'s')+' recorded':'')+' (Form DD-1)';}
      if(t.cur&&t.cur.mean!=null)out.data_phase=t.cur.mean+(u?' '+u:'')+' over '+t.cur.days+' day'+(t.cur.days===1?'':'s')+(t.curName?' ('+t.curName+')':'')+', Form DD-1';
      if(t.need!=null){out.data_run=String(t.run||0);out.data_need=String(t.need);}}}
  if(ti&&ti.obs.length){const o=ti.obs[ti.obs.length-1];out.integ=String(o.pct);out.integ_date=nbhCnMd(o.date);out.integ_how='from the Form TI-1 record';
    if(ti.crit!=null)out.integ_crit=String(ti.crit);if(ti.criterion)out.integ_criterion=String(ti.criterion);
    out.integ_note='Form TI-1, '+(o.type?o.type.toLowerCase()+' ':'')+'observation; '+ti.obs.length+' in the record, '+ti.overall+'% overall'+(ti.crit!=null?', critical steps '+ti.crit+'% across them':'')+'.';}
  return out;}
/* v22.52 (review I166) safety since the last visit: the restraints this semester (Form CR-1), the incidents since the last
   note and whether home was told (Form DD-1), the latest injury record (Form IM-1); only read, never sent anywhere */
function prevNoteDate(n){const me=parseDate(n.date)||new Date(),i=S.notes.indexOf(n);let best=null;
  S.notes.forEach((m,j)=>{if(j===i||isMissed(m))return;const d=parseDate(m.date);if(d&&d<me&&(!best||d>best))best=d;});return best;}
function nbhCnSafety(f,n){if(!f)return '';const L=[],cr=f.crisis,dd=f.data,im=f.injury,since=prevNoteDate(n);
  if(cr){const r=cr.restraints;L.push(r&&r.semester?'Restraints this semester: '+r.semester+(r.last?', the last on '+nbhCnMd(r.last):'')+(cr.seclusions?'; seclusions: '+cr.seclusions:'')+' (Form CR-1).':'No restraint recorded this semester (Form CR-1).');}
  if(dd&&Array.isArray(dd.incidentList)){const end=parseDate(n.date)||new Date();end.setHours(23,59,0,0);
    const I=dd.incidentList.filter(x=>{const d=fromIso(x&&x.date);return d&&(!since||d>since)&&d<=end;});
    L.push(I.length?'Incidents '+(since?'since '+Ymd(since):'logged')+' (Form DD-1): '+I.length+'; '+I.slice(-6).map(x=>nbhCnMd(x.date)+(x.tier?' '+x.tier:'')+(x.beh?', '+x.beh:'')+(x.parent==='yes'?', home told':', home not yet told')).join('; ')+'.':'No incident logged on Form DD-1'+(since?' since '+Ymd(since):'')+'.');}
  if(im){const op=(im.open||[]).length;L.push(im.last?'Latest injury recorded '+nbhCnMd(im.last)+(im.count30?', '+im.count30+' in the last 30 days':'')+(im.latest&&im.latest.risk?'; latest SIT Scale risk: '+im.latest.risk:'')+(op?'; '+op+' follow-up'+(op===1?'':'s')+' open':'')+' (Form IM-1).':'No injury recorded (Form IM-1).');}
  return L.join(' ');}
function nbhCnSecond(f){const cr=f&&f.crisis,r=cr&&cr.restraints;if(!r||!(+r.semester>=2))return null;
  const dl=(cr.deadlines||[]).find(x=>x&&/second restraint/i.test(x.what||''));return {n:+r.semester,last:r.last||'',done:dl?!!dl.done:null};}
function nbhCnPlace(force){const n=note();if(signed(n))return 0;   /* v22.52 (review F329) a signed note is not filled */
  const v=nbhCnWeek(nbhCnCase);let k=0;
  /* on its own the case fills only a note being written now: undated, or dated in or after the week it summarises */
  const w=nbhCnCase&&nbhCnCase.data&&nbhCnCase.data.week;if(!force&&w&&n.date){const d=parseDate(n.date),p=w.mon.split('-');if(!d||d<new Date(+p[0],+p[1]-1,+p[2]))return 0;}
  Object.keys(v).forEach(f=>{if(!v[f])return;if(!force&&String(n[f]||'').trim())return;if(force&&String(n[f]||'').trim()&&f!=='observed'&&f!=='data_forms')return;
    if(force&&f==='observed'&&String(n[f]||'').trim()&&n[f].indexOf(v[f])<0){n[f]=v[f]+'\n'+n[f];k++;return;}if(n[f]!==v[f]){n[f]=v[f];k++;}});
  /* the safety line, for a note of the last week or undated (the case reads as of now) */
  const nd=parseDate(n.date),t0=new Date();t0.setHours(0,0,0,0);
  const wk=new Date(t0);wk.setDate(wk.getDate()-7);
  if(!String(n.safety||'').trim()&&(!nd||nd>=wk||force)){const s=nbhCnSafety(nbhCnCase,n);if(s){n.safety=s;k++;}}
  const P=planNewest();if(P&&!String(n.plan||'').trim()){n.plan=P.text;n.plan_v=String(P.v);k++;}
  return k;}
function nbhCnBtn(){let b=document.getElementById('cnWeek');const f=nbhCnCase,has=!!(f&&((f.data&&f.data.week)||f.integrity||f.crisis||f.injury));
  if(!b){const at=document.getElementById('dupNote');if(!at)return;b=document.createElement('button');b.className='tool';b.id='cnWeek';b.type='button';b.textContent='Start from the week summary';
    b.title='Fills the data reviewed, what was seen, the integrity and the safety line from Form DD-1’s week summary, Form TI-1, Form CR-1 and Form IM-1; the observation goes above what is written there';at.parentNode.insertBefore(b,at.nextSibling);
    b.addEventListener('click',()=>{const k=nbhCnPlace(true);renderNote();nbhUI.toast(k?'The week summary is in this note.':'This note already holds the week summary.',k?{kind:'ok'}:undefined);});}
  b.style.display=has?'':'none';b.disabled=signed(note());}
/* v22.52 (review F333) the plan in force from Form TD-1's newest version (plan.versions: the adopted plan, then each revision) */
function planNewest(){const p=nbhCnCase&&nbhCnCase.plan,V=p&&Array.isArray(p.versions)?p.versions.filter(v=>v&&+v.v>0):[];if(!V.length)return null;
  const v=V.slice().sort((a,b)=>+a.v-+b.v).pop();return {v:+v.v,date:v.date||'',notice:v.notice||'',why:v.why||'',text:planText(v)};}
function planText(v){return 'BIP version '+v.v+(v.date?', '+(+v.v===1?'adopted ':'revised ')+isoMd(v.date):'')+(v.notice?', notice '+isoMd(v.notice):'')+' (Form TD-1)';}
function planVerOf(s){const m=/\b(?:version|v)\s*(\d+)\b/i.exec(String(s||''));return m?+m[1]:null;}
function planNewer(n){const P=planNewest();if(!P||isMissed(n))return '';const have=num(n.plan_v)!=null?num(n.plan_v):planVerOf(n.plan);if(have!=null&&have>=P.v)return '';
  const d=parseDate(n.date),vd=fromIso(P.date);if(d&&vd&&d<vd)return '';   /* a note of a visit before the newer version keeps the one it recorded */
  return 'The case holds a newer plan than this note carries: '+P.text+'. Press Use the plan in force to put it on this note.';}
/* the revision on Form TD-1 that matches a note's change (the first one dated from a week before the note on), and PR-1's review */
function chgCaseMatch(n){const f=nbhCnCase,d=parseDate(n.date);if(!f||!d)return {};const lo=new Date(d);lo.setDate(lo.getDate()-7);
  const V=(f.plan&&Array.isArray(f.plan.versions)?f.plan.versions:[]).filter(v=>v&&+v.v>=2&&fromIso(v.date)&&fromIso(v.date)>=lo).sort((a,b)=>+a.v-+b.v);
  const L=(f.review&&Array.isArray(f.review.log)?f.review.log:[]).filter(e=>e&&/^(modify|fade|exit)$/.test(e.decision||'')&&fromIso(e.date)&&Math.abs(fromIso(e.date)-d)<=14*864e5);
  return {v:V[0]||null,pr:L.length?L[L.length-1]:null};}
function renderCaseNotes(n){const f=nbhCnCase,P=planNewest(),m=S.meta,C=window.nbhCase;
  const pc=$('#planCase');if(pc){const hv=num(m.plan_v)!=null?num(m.plan_v):planVerOf(m.plan);
    pc.innerHTML=P&&String(m.plan||'').trim()&&hv!==P.v?'<div class="verdict v-mid">Form TD-1&rsquo;s newest version is '+esc(P.text)+'; the case line says &ldquo;'+esc(m.plan)+'&rdquo;. <button type="button" class="tool" id="cnMetaPlan">Use Form TD-1&rsquo;s version</button></div>':'';}
  const pn=$('#planNote');if(pn)pn.innerHTML=!signed(n)&&planNewer(n)?'<div class="tools"><button type="button" class="tool" id="cnPlanUse">Use the plan in force: '+esc(P.text)+'</button></div>':'';
  /* I166 the second restraint, where the note is written */
  const so=$('#safeOut');if(so){const s2=nbhCnSecond(f);
    so.innerHTML=(s2?'<div class="verdict v-no" style="margin:6px 0 0"><b>Second restraint this semester</b> ('+s2.n+' on Form CR-1'+(s2.last?', the last on '+esc(nbhCnMd(s2.last)):'')+'): s. 1003.573(6)(a), F.S., requires a crisis intervention plan'+(s2.done===true?'; Form CR-1 holds one.':s2.done===false?'; Form CR-1 does not hold one yet.':'; check Form CR-1.')+'</div>':'')+
      (f&&(f.crisis||f.injury||(f.data&&f.data.incidentList))?'<p class="hint">From the case (Forms CR-1, DD-1, IM-1). This line does not replace the incident report or the notice to the parent.</p>':'');}
  /* I168 Form SI-1's assent plan */
  const ac=$('#asCase');if(ac){const st=f&&f.student;ac.innerHTML=st&&(st.assent||st.stop)?'<p class="hint">Form SI-1'+(st.date?' (interview of '+esc(nbhCnMd(st.date))+')':'')+': assent '+esc(st.assent||'not recorded')+(st.stop&&st.stop.signs?'; how the student says stop: '+esc(st.stop.signs):'')+(st.stop&&st.stop.steps?'; what staff do then: '+esc(st.stop.steps):'')+'.</p>':'';}
  /* F328, F333 where a change must be carried, and what the case shows of it */
  const cc=$('#chgCase');if(cc){const k=n.chg_kind,dt=n.date||'the date of this note',L=[];
    if(k==='rule')L.push('This note records a change under a rule the plan writes; it does not change the plan. Carry it to Form DD-1 as a conditional phase-change line dated '+dt+', so the graph shows what the change did.');
    if(k==='revision'){const M=chgCaseMatch(n);
      L.push('This note records the team&rsquo;s decision; it does not change the plan. Carry it to Form TD-1 (a revision row'+(P?', version '+(M.v?M.v.v:P.v+1):'')+', dated '+esc(dt)+', with the notice date), to Form DD-1 (a phase-change line dated '+esc(dt)+', so the graph shows what the change did), and to the staff handouts on Forms QS-1 and EB-1.');
      if(f){if(M.v)L.push('Form TD-1 records version '+M.v.v+(M.v.date?', revised '+esc(isoMd(M.v.date)):'')+(M.v.notice?', notice '+esc(isoMd(M.v.notice)):', no notice date')+'.'+(!String(n.chg_iep||'').trim()&&!String(n.chg_amend||'').trim()||!String(n.chg_pwn||'').trim()?' <button type="button" class="tool" id="cnChgUse">Use these dates</button>':''));
        else if(f.plan)L.push('Form TD-1 has no revision dated from '+esc(dt)+' yet.');
        if(M.pr)L.push('Form PR-1: the review of '+esc(isoMd(M.pr.date))+' decided '+esc(M.pr.decisionText||M.pr.decision)+'.');
        if(C&&C.consent){const q=C.consent(f);L.push(esc(q.word)+(q.on&&q.bip?'; consent to implement the BIP recorded '+esc(isoMd(q.bip)):'')+(q.on&&!C.covers('bip',f)?'; that consent does not cover the plan':'')+'. The consent to the assessment does not cover changing the plan: a substantial change needs the parent&rsquo;s consent to it, recorded as its own event on Form IC-1.');}}}
    if(k==='recommended')L.push('Recommended only: nothing changes until the team decides. Take it to the team (Form PR-1, or the IEP meeting) with a next step that has an owner and a date.');
    cc.innerHTML=L.map(x=>'<p class="hint" style="margin:2px 0">'+x+'</p>').join('');}}
document.addEventListener('click',e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest('#cnPlanUse')){const n=note(),P=planNewest();if(!P||signed(n))return;n.plan=P.text;n.plan_v=String(P.v);renderNote();return;}
  if(t.closest('#cnMetaPlan')){const P=planNewest();if(!P)return;S.meta.plan=P.text;S.meta.plan_v=String(P.v);S.meta.plan_src='TD-1';bindMeta();renderNote();return;}
  if(t.closest('#cnChgUse')){const n=note(),M=chgCaseMatch(n);if(!M.v||signed(n))return;if(!String(n.chg_iep||'').trim()&&!String(n.chg_amend||'').trim()&&M.v.date)n.chg_iep=isoMd(M.v.date);
    if(!String(n.chg_pwn||'').trim()&&M.v.notice)n.chg_pwn=isoMd(M.v.notice);renderNote();}});
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;nbhCnCase=f||null;nbhCnBtn();
  if(!m.goal){const t=nbhCnGoalLine(f.behaviors||[],(f.goals&&f.goals.red)||[]);if(t){m.goal=t;n++;}}
  /* v22.52 (review F333) the case's plan line follows Form TD-1's newest version: filled when empty, kept current when it came from TD-1 */
  const P=planNewest();if(P&&(!String(m.plan||'').trim()||(m.plan_src==='TD-1'&&m.plan!==P.text))){m.plan=P.text;m.plan_v=String(P.v);m.plan_src='TD-1';n++;}
  n+=nbhCnPlace(false);
  if(n)renderAll();else renderComputed();return {filled:n};
};
nbhCnBtn();
window.__nbhFactsPick=function(sel){
  const m=S.meta;let n=0;const t=nbhCnGoalLine(sel.behaviors,sel.goals.red);if(t){m.goal=t;n++;}
  if(n)renderAll();return {filled:n};
};

/* v21.35 what is due: the open next steps of every note, by their dates, for the workstation's due line */
window.__nbhDue=function(){const out=[];(S.notes||[]).forEach(n=>(n.next||[]).forEach(x=>{if(x.done||!x.when||!x.what)return;out.push({what:(x.what+(x.who?' ('+x.who+')':'')).slice(0,60).trim(),date:x.when});}));return out;};

/* v21.85 (R) the service log, toolbar and case. Print the service log prints the chosen period alone (portrait letter);
   the CSV holds the same rows. In: the IEP's service minutes (Form DM-1's profile.services: minutes, per, kind, note)
   into the empty fields of the Service log page. Out: service {log:[{date, min, kind, with, note}] oldest first, the last
   200; week and month {from, to, direct, consult (every kind but direct), total, byKind}; iep {minutes, per, kind, done,
   line} when the IEP's minutes are known}.
   v22.52 (review F329, F330, F333, F334) the log, the week, the month and the IEP's count are of signed notes only (unsigned:
   how many are not); consult is consultation, observation and training (meetings, record reviews and the assessment are in
   byKind); iep.done counts the kinds the IEP names, with notCounted and missed {min, madeUp, by reason}; missed lists the
   sessions not held [{date, min, reason, madeUp}]; changes lists the changes the notes record [{date, kind, what, rule,
   team, notice, substantial, consent, told, signed}], so the case shows them and where they must be carried. */
$('#svcPrint').addEventListener('click',()=>{renderSvc();const {R,M}=svcRows();if(!R.length&&!M.length&&!String(S.meta.client||'').trim()){nbhUI.toast('There is no service entry to print yet.');return;}
  document.body.classList.add('cn-svc-only');
  const st=document.createElement('style');st.id='cnSvcPage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('cn-svc-only');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#svcCsv').addEventListener('click',()=>{renderSvc();const {R,r,M}=svcRows(),m=S.meta,q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"',pv=svcProvider(),ik=IEPK[m.iep_kind]?m.iep_kind:'';
  /* v22.52 (review F329, F330, F334) each row says whether it counts toward the IEP and when its note was signed; the sessions not held follow with no minutes delivered */
  const out=[['Student','Student ID','Date','Start','End','Minutes','Kind','Type of contact','With whom','Note','Provider','Counts toward the IEP','Date signed','Minutes scheduled, not held','Made up on']].concat(R.map(e=>[m.client,m.sid,e.iso,e.n.start,e.n.end,e.min,kindLab(e.kind),e.n.type,e.with,e.note,pv,countsIep(e,ik)?'yes':'no',e.signed?e.n.sig_date:'not signed','','']),
    M.map(x=>[m.client,m.sid,x.iso,'','',0,'Not held: '+(x.n.miss_reason||'reason not recorded'),x.n.type,'',String(x.n.svc_note||x.n.purpose||'').slice(0,160),pv,'',x.signed?x.n.sig_date:'not signed',x.min,x.n.miss_madeup||'']));
  const nm=String(m.client||'student').replace(/[^\w-]+/g,'_'),per=r?isoOf(r.from)+'_to_'+isoOf(r.to):'all';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(x=>x.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='CN-1_service-log_'+nm+'_'+per+'.csv';document.body.appendChild(a);a.click();a.remove();});
(function(){const was=window.__nbhFactsIn;window.__nbhFactsIn=function(f){let r=null;try{r=was?was.apply(this,arguments):null;}catch(e){r=null;}r=r&&typeof r==='object'?r:{filled:0};let n=0;
  try{const sv=f&&f.profile&&f.profile.services;if(sv&&typeof sv==='object'){const m=S.meta,put=(k,v)=>{v=v==null?'':String(v).trim();if(!v||String(m[k]||'').trim())return;m[k]=v;n++;};
    const mn=num(sv.minutes);if(mn!=null&&mn>0)put('iep_min',String(mn));if(['week','month','grading period'].includes(sv.per))put('iep_per',sv.per);if(IEPK[sv.kind])put('iep_kind',sv.kind);put('iep_note',sv.note);
    if(n){bindMeta();renderSvc();const e=document.getElementById('iepMin');if(e)e.dispatchEvent(new Event('input',{bubbles:true}));}}}catch(e){}
  return {filled:(r.filled||0)+n,note:[r.note||'',n?'placed the IEP service minutes (DM-1)':''].filter(Boolean).join('; ')};};})();
(function(){const was=window.__nbhFactsOut;window.__nbhFactsOut=function(){let o=null;try{o=was?was.apply(this,arguments):null;}catch(e){o=null;}
  try{const E=svcEntries(),ES=E.filter(e=>e.signed),MM=svcMissed(),T=v=>String(v==null?'':v).trim();
    const CH=S.notes.filter(n=>/^(rule|revision|recommended)$/.test(n.chg_kind||'')&&parseDate(n.date)).map(n=>{const c={date:isoOf(parseDate(n.date)),kind:n.chg_kind,what:T(n.changes).slice(0,300)};
      [['rule','chg_rule'],['team',n.chg_iep?'chg_iep':'chg_amend'],['notice','chg_pwn'],['substantial','chg_subst'],['consent','chg_consent'],['told','chg_told']].forEach(([k,f])=>{if(T(n[f]))c[k]=T(n[f]);});c.signed=signed(n);return c;}).slice(-50);
    if(E.length||MM.length||CH.length){const now=new Date(),sum=r=>{const t=svcTot(ES,r),by={};KINDS.forEach(([k])=>{if(t.by[k])by[k]=t.by[k];});return {from:isoOf(r.from),to:isoOf(r.to),direct:t.direct,consult:t.indirect,total:t.total,byKind:by};};
    const svc={log:ES.slice(-200).map(e=>{const x={date:e.iso,min:e.min,kind:e.kind};if(e.with)x.with=e.with;if(e.note)x.note=e.note;return x;}),week:sum(weekOf(now)),month:sum(monthOf(now))};
    if(E.length>ES.length)svc.unsigned=E.length-ES.length;
    if(MM.length)svc.missed=MM.slice(-50).map(x=>{const q={date:x.iso,min:x.min,reason:x.n.miss_reason||''};if(x.mu&&parseDate(x.mu.date))q.madeUp=isoOf(parseDate(x.mu.date));return q;});
    if(CH.length)svc.changes=CH;
    const ip=iepInfo(E,now);if(ip&&ip.done!=null){svc.iep={minutes:ip.min,per:ip.per,kind:ip.kind,done:ip.done,line:ip.line};if(ip.notCounted)svc.iep.notCounted=ip.notCounted;if(ip.miss&&ip.miss.n)svc.iep.missed={min:ip.miss.total,madeUp:ip.miss.made,by:ip.miss.by};}
    else if(ip)svc.iep={minutes:ip.min,per:ip.per,kind:ip.kind};
    o=o||{};o.service=svc;}}catch(e){}
  return o;};})();
