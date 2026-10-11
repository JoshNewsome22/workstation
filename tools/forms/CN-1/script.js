const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';

/* ---- v21.33: clock times are picked (type="time", stored HH:MM). Older files with typed text are converted. ---- */
function toHM24(v){const t=String(v==null?"":v).trim().toLowerCase();if(!t)return "";if(/^\d{2}:\d{2}$/.test(t))return t;
  const m=/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/.exec(t);if(!m)return "";let h=+m[1],mi=m[2]?+m[2]:0;if(h>23||mi>59)return "";
  if(m[3]==="p"&&h<12)h+=12;else if(m[3]==="a"&&h===12)h=0;else if(!m[3]&&h>=1&&h<=6)h+=12;return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0");}
function fmtHM(v){const t=toHM24(v);if(!t)return String(v==null?'':v);let h=+t.slice(0,2);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+t.slice(3)+' '+ap;}

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

const TYPES=['Observation','Consultation','Training','Direct session','Parent meeting','IEP or team meeting','Phone or video call','Record review'];
const TCAT=[['t_obs','Observation'],['t_cons','Consultation'],['t_train','Training'],['t_direct','Direct service'],['t_meet','Meeting'],['t_doc','Documentation'],['t_travel','Travel']];
const NFIELDS=['date','start','end','type','setting','present','plan','purpose','data_forms','data_rate','data_goal','data_unit','data_dir','observed','integ','integ_date','integ_note','problems','recs','changes','authority','training','materials','t_obs','t_cons','t_train','t_direct','t_meet','t_doc','t_travel','sig','sig_date','written','svc_min','svc_kind','svc_with','svc_note'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},notes:[]};}
let S=blank(),cur=0;
function newNote(){const n={};NFIELDS.forEach(f=>{n[f]='';});n.plan=S.meta.plan||'';n.sig=S.meta.bcba||'';n.next=[{what:'',who:'',when:'',done:false}];return n;}
function ensure(){if(!S.meta||typeof S.meta!=='object')S.meta={};if(!Array.isArray(S.notes))S.notes=[];if(!S.notes.length)S.notes.push(newNote());
  S.notes.forEach(n=>{if(!Array.isArray(n.next))n.next=[];if(!n.next.length)n.next.push({what:'',who:'',when:'',done:false});['start','end'].forEach(f=>{const h=toHM24(n[f]);if(h)n[f]=h;});});
  if(cur>=S.notes.length)cur=S.notes.length-1;if(cur<0)cur=0;}
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
function catSum(n){let s=0,any=false;TCAT.forEach(([k])=>{const v=num(n[k]);if(v!=null){s+=v;any=true;}});return any?s:null;}
function rateCheck(n){const r=num(n.data_rate),g=num(n.data_goal);if(r==null||g==null)return null;const up=n.data_dir==='up';const met=up?r>=g:r<=g;const close=!met&&g!==0&&Math.abs(r-g)/Math.abs(g)<=0.25;return{r,g,met,close,up};}
function integCheck(n){const v=num(n.integ);if(v==null)return null;return{v,lvl:v>=90?'ok':v>=80?'mid':'no'};}
function nxStatus(st){if(st.done)return 'done';const d=parseDate(st.when);if(!d)return 'open';const t=new Date();t.setHours(0,0,0,0);return d<t?'overdue':'open';}

/* ---------------- the note editor ---------------- */
function renderNoteSel(){const s=$('#noteSel');s.innerHTML=S.notes.map((n,i)=>`<option value="${i}"${i===cur?' selected':''}>${i+1}. ${esc(n.date||'(no date)')}${n.type?' · '+esc(n.type):''}${n.setting?' · '+esc(n.setting.slice(0,28)):''}</option>`).join('');}
function bindNote(){const n=note();$$('[data-n]').forEach(el=>{el.value=n[el.dataset.n]||'';});}
function renderNx(){const n=note();$('#nxTbl tbody').innerHTML=n.next.map((st,i)=>`<tr><td class="num">${i+1}</td><td><input data-x="what" data-i="${i}" value="${esc(st.what)}" placeholder="e.g., Ms. R. runs the break-card step at every demand; para collects TI-1 on Thursday"></td><td><input data-x="who" data-i="${i}" value="${esc(st.who)}"></td><td><input data-x="when" data-i="${i}" value="${esc(st.when)}" placeholder="m/d/yy"></td><td class="num"><input type="checkbox" data-x="done" data-i="${i}"${st.done?' checked':''} aria-label="Step ${i+1} done"></td>${delCell('nx',i,'step')}</tr>`).join('');}
function renderComputed(){
  const n=note(),d=duration(n);$('#durOut').value=d==null?'':fmtDur(d)+' ('+d+' min)';
  const rc=rateCheck(n),R=$('#rateOut');R.innerHTML=rc?'<div class="verdict '+(rc.met?'v-ok':rc.close?'v-mid':'v-no')+'" style="margin:6px 0 0">'+(rc.met?'Meets the goal':rc.close?'Close to the goal (within 25%)':'Not at the goal')+': '+rc.r+' against '+rc.g+(n.data_unit?' '+esc(n.data_unit):'')+(rc.up?' (higher is better)':' (lower is better)')+'.</div>':'';
  const ic=integCheck(n),I=$('#integOut');I.innerHTML=ic?'<div class="verdict v-'+ic.lvl+'" style="margin:6px 0 0">Integrity '+pct(ic.v)+': '+(ic.lvl==='ok'?'the plan is being run as written (90% and above, working convention).':ic.lvl==='mid'?'a retraining step is due on the missed steps (80% to 89%, working convention).':'the plan is not being run as written; recommendations should address implementation before the plan (below 80%, working convention).')+'</div>':'';
  const cs=catSum(n),T=$('#timeOut');if(cs==null&&d==null)T.innerHTML='';else if(cs==null)T.innerHTML='<p class="hint">Duration '+fmtDur(d)+'; no time by category entered yet.</p>';else if(d==null)T.innerHTML='<p class="hint">Categories add to '+cs+' min; enter start and end times to compare.</p>';else{const diff=cs-d;T.innerHTML='<div class="verdict '+(Math.abs(diff)<=5?'v-ok':'v-mid')+'">Categories add to '+cs+' min against a duration of '+d+' min'+(Math.abs(diff)<=5?'.':' ('+(diff>0?cs-d+' min more than the visit; travel or documentation outside the start-to-end span should be noted':d-cs+' min of the visit are not in any category')+').')+'</div>';}
  const out=[];if(!n.date)out.push('The note has no date.');if(d==null)out.push('Start and end times are needed for the duration and the hours log.');if(!n.type)out.push('Choose the type of contact.');if(!n.present)out.push('Say who was present.');
  if(n.changes&&!/^\s*(none|no change)/i.test(n.changes)&&(!n.authority||/^No change/.test(n.authority)))out.push('A change to the plan is recorded without its authority.');
  if(n.recs&&!n.next.some(s=>s.what))out.push('Recommendations were given but no next step has an owner and a date.');
  if(!n.sig)out.push('The note is not signed.');
  renderSvcHints();
  $('#noteVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+esc(x)+'</div>').join('')+'</div>':(n.date?'<div class="verdict v-ok"><b>Complete.</b> Dated, timed, typed, attended, signed; changes carry their authority and recommendations their next step.</div>':'');
  renderNoteOut();
}
function renderNoteOut(){
  const n=note(),m=S.meta,d=duration(n),rc=rateCheck(n),ic=integCheck(n),cs=catSum(n);
  const P=(label,v,pre)=>'<h4>'+label+'</h4>'+(v&&String(v).trim()?'<p>'+esc(v)+'</p>':'<p class="cn-empty">none recorded</p>');
  const nx=n.next.filter(s=>s.what);
  $('#noteOut').innerHTML='<div class="cn-title">Consultation and Session Note'+(n.type?': '+esc(n.type):'')+'</div>'+
    '<div class="cn-head"><div><b>Student</b>'+esc(m.client||'')+(m.sid?' ('+esc(m.sid)+')':'')+'</div><div><b>Date</b>'+esc(n.date||'')+'</div><div><b>Time</b>'+esc(fmtHM(n.start||''))+(n.end?' to '+esc(fmtHM(n.end)):'')+(d!=null?' ('+fmtDur(d)+')':'')+'</div><div><b>Setting</b>'+esc(n.setting||'')+'</div><div><b>School</b>'+esc(m.school||'')+'</div><div><b>BCBA</b>'+esc(m.bcba||'')+'</div><div style="grid-column:1/-1"><b>Present</b>'+esc(n.present||'')+'</div>'+svcHead(n)+'<div style="grid-column:1/-1"><b>Plan in force</b>'+esc(n.plan||m.plan||'')+(n.purpose?' &nbsp; <b>Purpose</b>'+esc(n.purpose):'')+'</div></div>'+
    '<h4>Data reviewed</h4><p>'+(n.data_forms?esc(n.data_forms):'<span class="cn-empty">none recorded</span>')+(rc?'<br>Rate '+rc.r+' against goal '+rc.g+(n.data_unit?' '+esc(n.data_unit):'')+': '+(rc.met?'meets the goal':rc.close?'close to the goal':'not at the goal')+(rc.up?' (higher is better).':' (lower is better).'):'')+'</p>'+
    P('What was seen',n.observed)+
    '<h4>Integrity observed (Form TI-1)</h4><p>'+(ic?pct(ic.v)+(n.integ_date?' on '+esc(n.integ_date):'')+(n.integ_note?'; '+esc(n.integ_note):''):'<span class="cn-empty">no integrity observation at this contact</span>')+'</p>'+
    P('Problems identified',n.problems)+P('Recommendations given',n.recs)+
    '<h4>Changes made to the plan</h4><p>'+(n.changes?esc(n.changes):'<span class="cn-empty">none</span>')+(n.authority?'<br><b>Authority:</b> '+esc(n.authority):'')+'</p>'+
    P('Training delivered',n.training)+P('Materials left',n.materials)+
    '<h4>Next steps</h4>'+(nx.length?'<table class="cn-t"><thead><tr><th style="width:55%">What</th><th>Who</th><th style="width:14%">By when</th><th style="width:10%">Status</th></tr></thead><tbody>'+nx.map(s=>'<tr><td>'+esc(s.what)+'</td><td>'+esc(s.who)+'</td><td>'+esc(s.when)+'</td><td>'+nxStatus(s)+'</td></tr>').join('')+'</tbody></table>':'<p class="cn-empty">none recorded</p>')+
    '<h4>Time by category</h4><p>'+(cs!=null?TCAT.filter(([k])=>num(n[k])!=null).map(([k,l])=>l+' '+num(n[k])+' min').join(' · ')+' · total '+cs+' min'+(d!=null?' (visit '+d+' min)':''):'<span class="cn-empty">not recorded</span>')+'</p>'+
    '<div class="cn-sig"><span>Signed: <span class="bl">'+esc(n.sig||'')+'</span></span><span>Date: <span class="bl" style="min-width:120px">'+esc(n.sig_date||'')+'</span></span></div>'+
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
    return '<tr class="open'+(r.i===cur?' cur':'')+'" data-open="'+r.i+'" tabindex="0" role="button" aria-label="Open note '+(r.i+1)+'"><td class="num">'+(r.i+1)+'</td><td>'+esc(n.date)+'</td><td>'+esc(n.type)+'</td><td class="num">'+(r.dur==null?'—':r.dur)+'</td><td>'+esc(n.setting)+'</td><td>'+esc(n.present)+'</td><td class="num">'+(rc?rc.r+' / '+rc.g:'—')+'</td><td class="num">'+(ic?pct(ic.v):'—')+'</td><td>'+esc((n.problems||'').split('\n')[0].slice(0,90))+(n.changes&&!/^\s*none/i.test(n.changes)?'<br><b>Change:</b> '+esc(n.changes.slice(0,80)):'')+'</td><td class="num">'+(open.length?open.length+' open'+(od?' ('+od+' overdue)':''):n.next.some(s=>s.what)?'done':'—')+'</td></tr>';}).join('')||'<tr><td colspan="10" class="hint">No notes match.</td></tr>';
  /* metrics */
  const all=noteRows(),tot=all.reduce((s,r)=>s+(r.dur||0),0);const now=new Date(),thisK=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const thisM=all.filter(r=>r.mk===thisK).reduce((s,r)=>s+(r.dur||0),0);const changes=all.filter(r=>r.n.changes&&!/^\s*none/i.test(r.n.changes)).length;
  const openAll=[].concat(...S.notes.map(n=>n.next.filter(s=>s.what&&!s.done)));const od=openAll.filter(nxStatus).filter(s=>nxStatus(s)==='overdue').length;
  const unsigned=S.notes.filter(n=>n.date&&!n.sig).length,untimed=S.notes.filter(n=>n.date&&duration(n)==null).length;
  $('#logMetrics').innerHTML=`<div class="metric"><b>Notes</b><div class="val">${S.notes.filter(n=>n.date||n.type).length}</div><div class="sub">${unsigned?unsigned+' unsigned · ':''}${untimed?untimed+' without times':'all timed'}</div></div>
    <div class="metric"><b>Hours, all notes</b><div class="val">${hrs(tot)}</div><div class="sub">from start and end times</div></div>
    <div class="metric"><b>Hours, ${monthLabel(thisK)}</b><div class="val">${hrs(thisM)}</div><div class="sub">${S.meta.service?esc(S.meta.service.slice(0,60)):'this month'}</div></div>
    <div class="metric"><b>Plan changes</b><div class="val">${changes}</div><div class="sub">notes recording a change</div></div>
    <div class="metric"><b>Open next steps</b><div class="val">${openAll.length}</div><div class="sub">${od?od+' overdue':'none overdue'}</div></div>`;
  /* hours by month and type */
  const months=[...new Set(all.map(r=>r.mk))].sort().reverse();const types=TYPES.filter(t=>S.notes.some(n=>n.type===t));if(S.notes.some(n=>!n.type))types.push('');
  let h='<thead><tr><th>Month</th>'+types.map(t=>'<th>'+(t||'(no type)')+'</th>').join('')+'<th>Total</th><th>Notes</th></tr></thead><tbody>';
  months.forEach(k=>{const rows=all.filter(r=>r.mk===k);h+='<tr><td class="lk">'+monthLabel(k)+'</td>'+types.map(t=>{const m=rows.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0);return '<td class="num">'+(m?hrs(m):'—')+'</td>';}).join('')+'<td class="num"><b>'+hrs(rows.reduce((s,r)=>s+(r.dur||0),0))+'</b></td><td class="num">'+rows.length+'</td></tr>';});
  h+='<tr class="tot"><td>All months</td>'+types.map(t=>'<td class="num">'+hrs(all.filter(r=>(r.n.type||'')===t).reduce((s,r)=>s+(r.dur||0),0))+'</td>').join('')+'<td class="num">'+hrs(tot)+'</td><td class="num">'+all.length+'</td></tr>';
  const cats=TCAT.map(([k,l])=>[l,S.notes.reduce((s,n)=>s+(num(n[k])||0),0)]).filter(x=>x[1]);
  if(cats.length)h+='<tr><td class="lk">By category</td><td colspan="'+(types.length+2)+'">'+cats.map(c=>c[0]+' '+hrs(c[1])+' h').join(' · ')+' · '+hrs(cats.reduce((s,c)=>s+c[1],0))+' h in all</td></tr>';
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
const KINDS=[['direct','Direct service'],['consult','Consultation'],['observation','Observation'],['training','Training'],['meeting','Meeting'],['other','Other']];
const kindLab=k=>(KINDS.find(x=>x[0]===k)||[0,''])[1];
const KIND_OF={'Observation':'observation','Consultation':'consult','Training':'training','Direct session':'direct','Parent meeting':'meeting','IEP or team meeting':'meeting','Phone or video call':'consult','Record review':'other'};
const CAT_KIND={t_obs:'observation',t_cons:'consult',t_train:'training',t_direct:'direct',t_meet:'meeting'};
const IEPK={consult:'consultation',direct:'direct',both:'direct and consultation'};
const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fromIso=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||'').trim());return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
const mdy=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
const countWhat=k=>k==='consult'?'every kind but direct service':k==='direct'?'direct service':'every kind';
function svcAuto(n){const d=duration(n);let kind=KIND_OF[n.type]||'';
  if(!kind){let best=0;Object.keys(CAT_KIND).forEach(k=>{const v=num(n[k]);if(v!=null&&v>best){best=v;kind=CAT_KIND[k];}});}
  let w=n.type==='Parent meeting'?'parent':n.type==='IEP or team meeting'?'team':n.type==='Direct session'?'student':'';
  if(!w){const R=[],p=String(n.present||'');p.replace(/\(([^)]+)\)/g,(m,x)=>{const r=x.split(/[,;]/)[0].trim().toLowerCase();if(r&&!R.includes(r))R.push(r);return m;});
    if(/\bthe student\b/i.test(p)&&!R.includes('student'))R.push('student');if(!R.length&&/\b(parent|mother|father|guardian)\b/i.test(p))R.push('parent');w=R.slice(0,4).join(', ');}
  const line=String(n.purpose||'').trim()||String(n.observed||'').split('\n')[0].trim();
  return {min:d,kind:kind||'other',with:w,note:line.slice(0,160)};}
function svcOf(n,i){const a=svcAuto(n),d=parseDate(n.date),m=num(n.svc_min);
  return {i,n,d,iso:d?isoOf(d):'',min:m!=null&&m>=0?Math.round(m):a.min,kind:KINDS.some(k=>k[0]===n.svc_kind)?n.svc_kind:a.kind,with:String(n.svc_with||'').trim()||a.with,note:(String(n.svc_note||'').trim()||a.note).slice(0,160)};}
function svcEntries(){return S.notes.map(svcOf).filter(e=>e.d&&e.min!=null&&e.min>0).sort((a,b)=>a.d-b.d||a.i-b.i);}
function weekOf(t){const d=new Date(t.getFullYear(),t.getMonth(),t.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);const e=new Date(d);e.setDate(e.getDate()+6);return {from:d,to:e};}
function monthOf(t){return {from:new Date(t.getFullYear(),t.getMonth(),1),to:new Date(t.getFullYear(),t.getMonth()+1,0)};}
function svcTot(E,r){const o={total:0,direct:0,consult:0,by:{},n:0};KINDS.forEach(k=>{o.by[k[0]]=0;});
  E.forEach(e=>{if(r&&!(e.d>=r.from&&e.d<=r.to))return;o.by[e.kind]+=e.min;o.total+=e.min;o.n++;if(e.kind==='direct')o.direct+=e.min;else o.consult+=e.min;});return o;}
const counted=(t,k)=>k==='direct'?t.direct:k==='consult'?t.consult:t.total;
/* the IEP's minutes against the period they are owed in (this week, this month, or the grading period typed) */
function iepInfo(E,now){const m=S.meta,min=num(m.iep_min);if(min==null||min<=0)return null;const per=['week','month','grading period'].includes(m.iep_per)?m.iep_per:'month',kind=IEPK[m.iep_kind]?m.iep_kind:'';
  let r=null,lab='this month';if(per==='week'){r=weekOf(now);lab='this week';}else if(per==='grading period'){const a=fromIso(m.gp_from),b=fromIso(m.gp_to);if(a&&b&&b>=a)r={from:a,to:b};lab='this grading period';}else r=monthOf(now);
  if(!r)return {min,per,kind,done:null,lab,line:'',need:'Enter the grading period’s first and last days to count the minutes against the IEP.'};
  const done=counted(svcTot(E,r),kind);return {min,per,kind,done,lab,r,line:done+' of '+min+' minutes '+lab};}
/* the periods the page can show: this month (always), this week, each month with an entry, the grading period, all */
let svcPer='';
function svcPeriods(E,now){const cm=monthKey(mdy(now)),wk=weekOf(now),P=[['m:'+cm,monthLabel(cm)+' (this month)'],['w','This week ('+mdy(wk.from)+' to '+mdy(wk.to)+')']];
  [...new Set(E.map(e=>monthKey(mdy(e.d))))].sort().reverse().forEach(k=>{if(k!==cm)P.push(['m:'+k,monthLabel(k)]);});
  const a=fromIso(S.meta.gp_from),b=fromIso(S.meta.gp_to);if(a&&b&&b>=a)P.push(['gp','Grading period ('+mdy(a)+' to '+mdy(b)+')']);P.push(['all','Every entry']);return P;}
function svcRange(key,now){if(key==='w'){const w=weekOf(now);return {from:w.from,to:w.to,kind:'week',lab:'the week of '+mdy(w.from)};}
  if(key==='gp'){const a=fromIso(S.meta.gp_from),b=fromIso(S.meta.gp_to);return a&&b?{from:a,to:b,kind:'grading period',lab:'the grading period '+mdy(a)+' to '+mdy(b)}:null;}
  if(key==='all')return null;const k=String(key||'').slice(2),y=+k.slice(0,4),mo=+k.slice(5,7);if(!y||!mo)return null;return {from:new Date(y,mo-1,1),to:new Date(y,mo,0),kind:'month',lab:monthLabel(k)};}
function renderSvcHints(){const n=note(),a=svcAuto(n),set=(id,v)=>{const e=document.getElementById(id);if(e)e.placeholder=v;};
  set('svcMin',a.min!=null?a.min+' (from the times)':'from the start and end times');
  const o=document.querySelector('#svcKind option[value=""]');if(o)o.textContent=kindLab(a.kind)+(!KIND_OF[n.type]&&catSum(n)!=null?' (from the time by category)':' (from the type)');
  set('svcWith',a.with||'e.g., teacher, parent, team');set('svcNote',a.note?a.note.slice(0,100):'one line: what the service was');}
function svcHead(n){const e=svcOf(n,cur);return e.min!=null?'<div style="grid-column:1/-1"><b>Service</b>'+e.min+' min, '+esc(kindLab(e.kind).toLowerCase())+(e.with?', with '+esc(e.with):'')+'</div>':'';}
function svcProvider(){return S.meta.bcba||((S.notes.find(n=>n.sig)||{}).sig)||'';}
function svcRows(){const now=new Date(),E=svcEntries(),r=svcRange(svcPer,now);return {now,E,r,R:E.filter(e=>!r||(e.d>=r.from&&e.d<=r.to))};}
function renderSvc(){const box=$('#svcOut');if(!box)return;const m=S.meta,now=new Date(),E=svcEntries(),w=weekOf(now),tw=svcTot(E,w),tm=svcTot(E,monthOf(now)),ta=svcTot(E,null),ip=iepInfo(E,now);
  $$('.svc-gp').forEach(x=>{x.hidden=m.iep_per!=='grading period';});
  const dated=S.notes.filter(n=>parseDate(n.date)).length,nomin=dated-E.length;
  $('#svcMetrics').innerHTML=`<div class="metric"><b>This week</b><div class="val">${tw.total} min</div><div class="sub">${mdy(w.from)} to ${mdy(w.to)} · direct ${tw.direct} · consultation and other ${tw.consult}</div></div>
    <div class="metric"><b>${monthLabel(monthKey(mdy(now)))}</b><div class="val">${tm.total} min</div><div class="sub">${tm.n} entr${tm.n===1?'y':'ies'} · direct ${tm.direct} · consultation and other ${tm.consult}</div></div>
    <div class="metric ${ip&&ip.done!=null?(ip.done>=ip.min?'m-ok':'m-mid'):''}" id="svcIep"><b>Against the IEP</b><div class="val">${ip?(ip.done!=null?ip.done+' of '+ip.min:'—'):'—'}</div><div class="sub">${ip?(ip.done!=null?esc('minutes '+ip.lab+(ip.kind?' ('+IEPK[ip.kind]+')':'')+(ip.done<ip.min?'; '+(ip.min-ip.done)+' to go':ip.done>ip.min?'; '+(ip.done-ip.min)+' over':'')):esc(ip.need)):'no IEP service minutes yet: Form DM-1 through the case, or type them above'}</div></div>
    <div class="metric"><b>Entries</b><div class="val">${E.length}</div><div class="sub">${nomin>0?nomin+' dated note'+(nomin===1?' has':'s have')+' no minutes or times':'every dated note has its minutes'}</div></div>`;
  $('#svcTot').innerHTML='<thead><tr><th>Kind</th><th>This week (min)</th><th>This month (min)</th><th>Every entry (min)</th></tr></thead><tbody>'+KINDS.map(([k,l])=>'<tr><td class="lk">'+l+'</td><td class="num">'+(tw.by[k]||'—')+'</td><td class="num">'+(tm.by[k]||'—')+'</td><td class="num">'+(ta.by[k]||'—')+'</td></tr>').join('')+
    '<tr class="tot"><td>Total</td><td class="num">'+tw.total+'</td><td class="num">'+tm.total+'</td><td class="num">'+ta.total+'</td></tr>'+(ip&&ip.done!=null?'<tr><td class="lk">Against the IEP</td><td colspan="3">'+esc(ip.line)+(ip.kind?' (counting '+countWhat(ip.kind)+')':'')+'</td></tr>':'')+'</tbody>';
  /* the period and the page */
  const P=svcPeriods(E,now);if(!P.some(p=>p[0]===svcPer))svcPer=P[0][0];const sel=$('#svcPeriod');if(sel)sel.innerHTML=P.map(p=>'<option value="'+p[0]+'"'+(p[0]===svcPer?' selected':'')+'>'+esc(p[1])+'</option>').join('');
  const r=svcRange(svcPer,now),R=E.filter(e=>!r||(e.d>=r.from&&e.d<=r.to)),tp=svcTot(R,null),provider=svcProvider();
  $('#svcCount').textContent=R.length+' entr'+(R.length===1?'y':'ies')+', '+tp.total+' minutes';
  let iepLine='';const im=num(m.iep_min);if(im!=null&&im>0)iepLine=im+' minutes per '+(m.iep_per||'month')+(IEPK[m.iep_kind]?', '+IEPK[m.iep_kind]:'')+(m.iep_note?'; '+m.iep_note:'');
  const against=ip&&r&&r.kind===ip.per?'Against the IEP: '+counted(tp,ip.kind)+' of '+ip.min+' minutes in '+r.lab+(ip.kind?' (counting '+countWhat(ip.kind)+')':'')+'.':'';
  box.innerHTML='<div class="sl-title">Service Log: Behavior Analysis Services</div>'+
    '<div class="sl-head"><div><b>Student</b>'+esc(m.client||'')+'</div><div><b>Student ID</b>'+esc(m.sid||'')+'</div><div><b>Date of birth</b>'+esc(m.dob||'')+'</div>'+(m.medicaid?'<div><b>Medicaid ID</b>'+esc(m.medicaid)+'</div>':'')+
    '<div><b>School</b>'+esc(m.school||'')+'</div><div><b>Provider</b>'+esc(provider)+'</div><div><b>Period</b>'+esc(r?r.lab+(r.kind==='month'?' ('+mdy(r.from)+' to '+mdy(r.to)+')':''):'every entry')+'</div>'+
    '<div style="grid-column:1/-1"><b>IEP service</b>'+(iepLine?esc(iepLine):'<span class="cn-empty">not recorded</span>')+'</div></div>'+
    (R.length?'<table class="sl-t"><thead><tr><th style="width:11%">Date</th><th style="width:9%">Start</th><th style="width:9%">End</th><th style="width:8%">Minutes</th><th style="width:17%">Service</th><th style="width:16%">With</th><th>Note</th></tr></thead><tbody>'+
      R.map(e=>'<tr class="open" data-open="'+e.i+'" tabindex="0" role="button" aria-label="Open the note of '+esc(mdy(e.d))+'"><td>'+mdy(e.d)+'</td><td>'+esc(e.n.start?fmtHM(e.n.start):'')+'</td><td>'+esc(e.n.end?fmtHM(e.n.end):'')+'</td><td class="num">'+e.min+'</td><td>'+esc(kindLab(e.kind))+(e.n.type&&e.n.type!==kindLab(e.kind)?' ('+esc(e.n.type)+')':'')+'</td><td>'+esc(e.with)+'</td><td>'+esc(e.note)+'</td></tr>').join('')+
      '<tr class="tot"><td colspan="3">Total, '+R.length+' entr'+(R.length===1?'y':'ies')+'</td><td class="num">'+tp.total+'</td><td colspan="3">'+(tp.total>=60?fmtDur(tp.total):'')+'</td></tr></tbody></table>'+
      '<p class="sl-sum">'+KINDS.filter(([k])=>tp.by[k]).map(([k,l])=>l+' '+tp.by[k]+' min').join(' · ')+'.'+(against?' '+esc(against):'')+'</p>'
      :'<p class="cn-empty">No service entries in this period. An entry is a note with a date and its minutes (or start and end times).</p>')+
    '<p class="sl-att">I certify that the services listed were provided as recorded, on the dates and for the times shown, and that each is documented in a dated and signed note on Form CN-1.</p>'+
    '<div class="sl-sig"><span>Provider signature: <span class="bl"></span></span><span>Date: <span class="bl" style="min-width:120px"></span></span><span>Name and credential: <b>'+esc(provider)+'</b></span></div>'+
    '<div class="sl-foot"><span>Confidential student record; retain with the behavior file.</span><span>Form CN-1 · Service log · printed '+mdy(now)+'</span></div>';}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
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
$('#dupNote').addEventListener('click',()=>{if(S.notes.length>=400)return;const o=note(),n=newNote();['type','setting','present','plan','purpose','sig','svc_kind','svc_with'].forEach(f=>{n[f]=o[f];});S.notes.push(n);cur=S.notes.length-1;renderNote();$('[data-n="date"]').focus();});
$('#delNote').addEventListener('click',async ()=>{const n=note(),k=cur;if((n.date||n.observed||n.problems)&&!(await nbhUI.confirm('Delete note '+(k+1)+' ('+(n.date||'no date')+')?\nThe note and its next steps are deleted; this cannot be undone.',{ok:'Delete',danger:true})))return;S.notes.splice(k,1);cur=Math.max(0,k-1);renderNote();});
$('#addNx').addEventListener('click',()=>{if(note().next.length>=12)return;note().next.push({what:'',who:'',when:'',done:false});renderNx();});
$('#delNx').addEventListener('click',async ()=>{const nx=note().next;if(nx.length<=1)return;if(nx[nx.length-1].what&&!(await nbhUI.confirm('Remove the last step?\nThe next step, its owner and its date are deleted.',{ok:'Remove',danger:true})))return;nx.pop();renderNx();renderComputed();});
async function rowDel(r,i){
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
    n.next=Array.isArray(x&&x.next)?x.next.slice(0,12).map(y=>({what:str(y&&y.what),who:str(y&&y.who),when:str(y&&y.when),done:!!(y&&y.done)})):[];return n;}):[];
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
  const head=['#','Date','Start','End','Minutes','Type','Setting','Present','Plan in force','Purpose','Data reviewed','Rate','Goal','Unit','Direction','Observed','Integrity %','Integrity date','Integrity note','Problems','Recommendations','Changes','Authority','Training','Materials','Next steps','Observation min','Consultation min','Training min','Direct min','Meeting min','Documentation min','Travel min','Signed','Date signed','Written on','Service minutes','Service kind','With whom','Service note'];
  const out=[head];noteRows().reverse().forEach(r=>{const n=r.n;out.push([r.i+1,n.date,n.start,n.end,r.dur==null?'':r.dur,n.type,n.setting,n.present,n.plan,n.purpose,n.data_forms,n.data_rate,n.data_goal,n.data_unit,n.data_dir==='up'?'higher is better':'lower is better',n.observed,n.integ,n.integ_date,n.integ_note,n.problems,n.recs,n.changes,n.authority,n.training,n.materials,n.next.filter(s=>s.what).map(s=>s.what+' ('+s.who+(s.when?', by '+s.when:'')+(s.done?', done':'')+')').join('; '),n.t_obs,n.t_cons,n.t_train,n.t_direct,n.t_meet,n.t_doc,n.t_travel,n.sig,n.sig_date,n.written].concat((e=>[e.min==null?'':e.min,kindLab(e.kind),e.with,e.note])(svcOf(n,r.i))));});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='CN-1_log.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();cur=0;renderAll();setView('note');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nSix notes over five weeks are filled in as a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const day=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()-1);return d;};
  const Y=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);const fwd=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x;};
  S=blank();cur=0;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',school:'Lincoln Elementary, Riverside USD',bcba:'Joshua Newsome, M.A., BCBA',plan:'BIP v2, dated '+Y(day(45))+' (Form TD-1)',service:'4 hours a month of consultation under the district contract; parent consent on IC-1 dated '+Y(day(60)),goal:'Elopement from the classroom (TB-1); goal under 1 per day for 4 school weeks (GB-1)',dob:'3/14/2016',iep_min:'120',iep_per:'month',iep_kind:'consult',iep_note:'Behavior consultation to the classroom team (IEP services page, Form DM-1)'};
  const sig='Joshua Newsome, M.A., BCBA';
  const mk=(o)=>{const n=newNote();Object.assign(n,o);n.sig=sig;n.sig_date=n.sig_date||n.date;n.plan=n.plan||S.meta.plan;return n;};
  const d1=day(33),d2=day(26),d3=day(19),d4=day(14),d5=day(7),d6=day(2);
  S.notes=[
    mk({date:Y(d1),start:'9:00 am',end:'10:30 am',type:'Observation',setting:'Room 12 (Ms. R.) and the hallway',present:'Ms. R. (teacher), J. Ortiz (paraeducator), the student',purpose:'First observation under BIP v2; TI-1 taken',
      data_forms:'Daily Behavior Data '+Y(fwd(d1,-7))+' to '+Y(fwd(d1,-1))+'; TI-1 of this date',data_rate:'2.4',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Three elopements in 90 minutes, all within a minute of an independent-work direction. The break card was on the desk but was not offered before the direction on any of the three; on the second, Ms. R. followed to the hallway and talked for about two minutes before the return. The para delivered praise at the planned rate during the carpet activity.',
      integ:'62',integ_date:Y(d1),integ_note:'Steps 2 (offer the card before the direction) and 5 (silent return) missed on every opportunity',
      problems:'The antecedent step is not being run: the card is present but not offered.\nThe hallway conversation is attention after elopement, which is the function the FBA found.',
      recs:'Re-train steps 2 and 5 with the teacher and the para before any change to the plan.\nMove the card prompt into the direction itself (“work time: card or start”).',
      changes:'none',authority:'No change to the plan',training:'Fifteen minutes after the observation: modeled step 2 twice with the para as the student, Ms. R. rehearsed it three times with feedback; silent return practiced once (Form ST-1).',materials:'TI-1 checklist for the para to score on Thursday; a second break card for the hallway',
      t_obs:'60',t_cons:'15',t_train:'15',t_doc:'20',t_travel:'25',
      next:[{what:'Para scores TI-1 on Ms. R. during one independent-work block',who:'J. Ortiz',when:Y(fwd(d1,3)),done:true},{what:'Phone check on the TI-1 score and the week’s count',who:'J. Newsome',when:Y(fwd(d1,7)),done:true}]}),
    mk({date:Y(d2),start:'3:15 pm',end:'3:40 pm',type:'Phone or video call',setting:'By phone',present:'Ms. R. (teacher)',purpose:'Follow-up on the retraining and the week’s data',
      data_forms:'Daily Behavior Data '+Y(fwd(d2,-6))+' to '+Y(fwd(d2,-1))+'; para’s TI-1 of '+Y(fwd(d1,3)),data_rate:'1.6',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Ms. R. reports offering the card before each direction since the retraining; the para’s TI-1 scored 88%, with the silent return missed once. Count down to 8 for the week from 12.',
      integ:'88',integ_date:Y(fwd(d1,3)),integ_note:'Step 5 missed once (para’s score)',problems:'Return from the hallway still draws a sentence or two from Ms. R. on the harder days.',recs:'Keep the plan as written for two more weeks before judging it; the para scores TI-1 again next week.',changes:'none',authority:'No change to the plan',training:'',materials:'',
      t_cons:'25',t_doc:'10',next:[{what:'Para scores TI-1 again',who:'J. Ortiz',when:Y(fwd(d2,5)),done:true}]}),
    mk({date:Y(d3),start:'8:30 am',end:'10:00 am',type:'Observation',setting:'Room 12 and specials (art)',present:'Ms. R. (teacher), J. Ortiz (paraeducator), Mr. K. (art teacher), the student',purpose:'Second observation; generalization to specials',
      data_forms:'Daily Behavior Data '+Y(fwd(d3,-7))+' to '+Y(fwd(d3,-1))+'; TI-1 of this date',data_rate:'1.2',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'One elopement in 90 minutes, from art, where no card was available and Mr. K. had not been briefed. In Room 12 the card was offered before every direction (6 of 6) and the one request for a break was honored within 10 seconds.',
      integ:'94',integ_date:Y(d3),integ_note:'Room 12 only; art not scored',problems:'The plan does not travel to specials: no card, no briefing.',recs:'Add specials to the plan with a card kept by the art teacher and a one-page brief (Form EB-1).',
      changes:'Specials added to the settings covered by the plan; a break card kept at the art-room door; Mr. K. briefed with EB-1.',authority:'Within the adjustments the plan already allows (BCBA)',training:'Ten minutes with Mr. K.: the card, the honor-within-10-seconds rule, the silent return (instruction and one model).',materials:'EB-1 brief for art, music and PE; a laminated card for each',
      t_obs:'60',t_cons:'20',t_train:'10',t_doc:'20',t_travel:'25',next:[{what:'Brief music and PE with EB-1',who:'Ms. R.',when:Y(fwd(d3,4)),done:true},{what:'Parent meeting to review the first month',who:'J. Newsome',when:Y(d4),done:true}]}),
    mk({date:Y(d4),start:'2:30 pm',end:'3:10 pm',type:'Parent meeting',setting:'Conference room; father by video',present:'Ms. Alvarez (mother), Mr. Alvarez (father, by video), Ms. R. (teacher)',purpose:'Monthly review with the family',
      data_forms:'Daily Behavior Data for the month; home tally sheet (HD-1) weeks 1 to 3',data_rate:'1.0',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Family reports the same pattern at homework; the home tally shows 2 to 3 a day in week 1 and 0 to 1 in week 3 after the timer went in. Parents asked whether the card could be used at home.',
      problems:'',recs:'Use the same card at homework with the honor rule; keep the home tally sheet going for four more weeks.',changes:'none at school; a home version of the break-card step added to the family plan (HD-1 setup)',authority:'Parent or guardian consent obtained (Form IC-1)',training:'Fifteen minutes with the parents: the card, the honor rule, the silent return; mother rehearsed twice.',materials:'Two break cards for home; HD-1 sheets for four weeks',
      t_meet:'40',t_doc:'15',t_travel:'25',next:[{what:'Send the home graph by text every Friday',who:'J. Newsome',when:Y(fwd(d4,3)),done:true}]}),
    mk({date:Y(d5),start:'1:00 pm',end:'2:00 pm',type:'IEP or team meeting',setting:'Conference room',present:'IEP team: Ms. Alvarez (mother), Ms. R., Ms. T. (case manager), Dr. P. (school psychologist), J. Newsome',purpose:'Annual IEP; BIP review',
      data_forms:'Monthly summary graph; TI-1 scores to date (62, 88, 94, 91)',data_rate:'0.8',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Team reviewed the month: rate down from 2.4 to 0.8 per day with integrity above 90% for three weeks. Goal met for two weeks, not yet the four the plan requires.',
      problems:'',recs:'Hold the plan as written until the four-week criterion is met, then begin thinning the card prompt (PR-1).',changes:'none',authority:'IEP team decision (meeting of this date)',training:'',materials:'',
      t_meet:'60',t_doc:'20',t_travel:'25',next:[{what:'Periodic plan review on PR-1 when four weeks under goal are reached',who:'J. Newsome',when:Y(fwd(d5,21)),done:false}]}),
    mk({date:Y(d6),start:'10:00 am',end:'10:45 am',type:'Consultation',setting:'Room 12, planning period',present:'Ms. R. (teacher), J. Ortiz (paraeducator)',purpose:'Data check and thinning plan',
      data_forms:'Daily Behavior Data '+Y(fwd(d6,-7))+' to '+Y(fwd(d6,-1))+'; para’s TI-1 of '+Y(fwd(d6,-3)),data_rate:'0.6',data_goal:'1',data_unit:'per day',data_dir:'',
      observed:'Third week under goal. Para’s TI-1 at 91%; the missed step was the praise rate during independent work.',integ:'91',integ_date:Y(fwd(d6,-3)),integ_note:'Praise rate below the planned 1 per 2 minutes in one block',
      problems:'Praise is thinning on its own before the plan says to.',recs:'Keep praise at the planned rate until the PR-1 review; the thinning step is written there, not improvised.',changes:'none',authority:'No change to the plan',training:'Five-minute reminder with a timer app for the praise interval.',materials:'Interval timer set to 2 minutes on the para’s phone',
      t_cons:'35',t_train:'5',t_doc:'10',t_travel:'25',next:[{what:'Para scores TI-1 during independent work',who:'J. Ortiz',when:Y(fwd(d6,4)),done:false},{what:'Confirm week four under goal and schedule PR-1',who:'J. Newsome',when:Y(fwd(d6,7)),done:false}]})
  ];
  cur=S.notes.length-1;renderAll();setView('log');
  nbhUI.toast('Simulation loaded: '+'a simulated case of six notes over five weeks, with next steps, time by category and the hours log.',{kind:'ok'});
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
   latest Form TI-1 observation, into the empty fields of the note open; "Start from the week summary" does it again. */
let nbhCnCase=null;
const nbhCnMd=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?(+m[2])+'/'+(+m[3])+'/'+m[1].slice(2):String(iso||'');};
function nbhCnWeek(f){const d=f&&f.data,w=d&&d.week,ti=f&&f.integrity,out={};if(!w&&!ti)return out;
  if(w){const fri=(()=>{const p=w.mon.split('-');const x=new Date(+p[0],+p[1]-1,+p[2]+4,12);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');})();
    out.data_forms='Daily Behavior Data (Form DD-1), week of '+nbhCnMd(w.mon)+' to '+nbhCnMd(fri)+(ti&&ti.obs.length?'; TI-1 of '+nbhCnMd(ti.obs[ti.obs.length-1].date):'');
    const L=['The week of '+nbhCnMd(w.mon)+' ('+w.days+' day'+(w.days===1?'':'s')+' recorded), against the week before:'];
    w.rows.forEach(r=>{if(r.now==='\u2014'&&r.last==='\u2014')return;L.push('- '+r.name+': '+r.now+(r.last&&r.last!=='\u2014'?', the week before '+r.last:'')+(r.change&&r.change!=='\u2014'?' ('+r.change+')':'')+'.');});
    L.push('Incidents logged: '+(w.incidents||'none')+'.');
    (w.phases||[]).forEach(p=>L.push('Phase change '+nbhCnMd(p.date)+': '+(p.type==='full'?'full phase change':'conditional change')+(p.label?', '+p.label:'')+'.'));
    if(w.decided)L.push('The team decided: '+w.decided.replace(/\n+/g,'; ')+'.');
    out.observed=L.join('\n');
    const t=(d.behaviors||[]).find(b=>b.kind==='target'&&b.aim!=null&&b.cur);
    if(t){out.data_rate=String(t.cur.mean);out.data_goal=String(t.aim);out.data_unit=t.measure==='count'?'a day ('+t.name.toLowerCase()+', '+t.curName+')':(t.unit||'');out.data_dir=t.direction==='increase'?'up':'';}}
  if(ti&&ti.obs.length){const o=ti.obs[ti.obs.length-1];out.integ=String(o.pct);out.integ_date=nbhCnMd(o.date);out.integ_note='Form TI-1, '+(o.type?o.type.toLowerCase()+' ':'')+'observation; '+ti.obs.length+' in the record, '+ti.overall+'% overall.';}
  return out;}
function nbhCnPlace(force){const n=note(),v=nbhCnWeek(nbhCnCase);let k=0;
  /* on its own the case fills only a note being written now: undated, or dated in or after the week it summarises */
  const w=nbhCnCase&&nbhCnCase.data&&nbhCnCase.data.week;if(!force&&w&&n.date){const d=parseDate(n.date),p=w.mon.split('-');if(!d||d<new Date(+p[0],+p[1]-1,+p[2]))return 0;}
  Object.keys(v).forEach(f=>{if(!v[f])return;if(!force&&String(n[f]||'').trim())return;if(force&&String(n[f]||'').trim()&&f!=='observed'&&f!=='data_forms')return;
    if(force&&f==='observed'&&String(n[f]||'').trim()&&n[f].indexOf(v[f])<0){n[f]=v[f]+'\n'+n[f];k++;return;}if(n[f]!==v[f]){n[f]=v[f];k++;}});
  return k;}
function nbhCnBtn(){let b=document.getElementById('cnWeek');const has=!!(nbhCnCase&&((nbhCnCase.data&&nbhCnCase.data.week)||nbhCnCase.integrity));
  if(!b){const at=document.getElementById('dupNote');if(!at)return;b=document.createElement('button');b.className='tool';b.id='cnWeek';b.type='button';b.textContent='Start from the week summary';
    b.title='Fills the data reviewed, what was seen and the integrity from Form DD-1\u2019s week summary and Form TI-1; the observation goes above what is written there';at.parentNode.insertBefore(b,at.nextSibling);
    b.addEventListener('click',()=>{const k=nbhCnPlace(true);renderNote();nbhUI.toast(k?'The week summary is in this note.':'This note already holds the week summary.',k?{kind:'ok'}:undefined);});}
  b.style.display=has?'':'none';}
window.__nbhFactsIn=function(f){
  const m=S.meta;let n=0;nbhCnCase=f||null;nbhCnBtn();
  if(!m.goal){const t=nbhCnGoalLine(f.behaviors||[],(f.goals&&f.goals.red)||[]);if(t){m.goal=t;n++;}}
  n+=nbhCnPlace(false);
  if(n)renderAll();return {filled:n};
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
   line} when the IEP's minutes are known}. */
$('#svcPrint').addEventListener('click',()=>{renderSvc();const {R}=svcRows();if(!R.length&&!String(S.meta.client||'').trim()){nbhUI.toast('There is no service entry to print yet.');return;}
  document.body.classList.add('cn-svc-only');
  const st=document.createElement('style');st.id='cnSvcPage';st.textContent='@media print{@page{size:letter portrait;margin:0.6in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('cn-svc-only');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#svcCsv').addEventListener('click',()=>{renderSvc();const {R,r}=svcRows(),m=S.meta,q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"',pv=svcProvider();
  const out=[['Student','Student ID','Date','Start','End','Minutes','Kind','Type of contact','With whom','Note','Provider']].concat(R.map(e=>[m.client,m.sid,e.iso,e.n.start,e.n.end,e.min,kindLab(e.kind),e.n.type,e.with,e.note,pv]));
  const nm=String(m.client||'student').replace(/[^\w-]+/g,'_'),per=r?isoOf(r.from)+'_to_'+isoOf(r.to):'all';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(x=>x.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='CN-1_service-log_'+nm+'_'+per+'.csv';document.body.appendChild(a);a.click();a.remove();});
(function(){const was=window.__nbhFactsIn;window.__nbhFactsIn=function(f){let r=null;try{r=was?was.apply(this,arguments):null;}catch(e){r=null;}r=r&&typeof r==='object'?r:{filled:0};let n=0;
  try{const sv=f&&f.profile&&f.profile.services;if(sv&&typeof sv==='object'){const m=S.meta,put=(k,v)=>{v=v==null?'':String(v).trim();if(!v||String(m[k]||'').trim())return;m[k]=v;n++;};
    const mn=num(sv.minutes);if(mn!=null&&mn>0)put('iep_min',String(mn));if(['week','month','grading period'].includes(sv.per))put('iep_per',sv.per);if(IEPK[sv.kind])put('iep_kind',sv.kind);put('iep_note',sv.note);
    if(n){bindMeta();renderSvc();const e=document.getElementById('iepMin');if(e)e.dispatchEvent(new Event('input',{bubbles:true}));}}}catch(e){}
  return {filled:(r.filled||0)+n,note:[r.note||'',n?'placed the IEP service minutes (DM-1)':''].filter(Boolean).join('; ')};};})();
(function(){const was=window.__nbhFactsOut;window.__nbhFactsOut=function(){let o=null;try{o=was?was.apply(this,arguments):null;}catch(e){o=null;}
  try{const E=svcEntries();if(E.length){const now=new Date(),sum=r=>{const t=svcTot(E,r),by={};KINDS.forEach(([k])=>{if(t.by[k])by[k]=t.by[k];});return {from:isoOf(r.from),to:isoOf(r.to),direct:t.direct,consult:t.consult,total:t.total,byKind:by};};
    const svc={log:E.slice(-200).map(e=>{const x={date:e.iso,min:e.min,kind:e.kind};if(e.with)x.with=e.with;if(e.note)x.note=e.note;return x;}),week:sum(weekOf(now)),month:sum(monthOf(now))};
    const ip=iepInfo(E,now);if(ip&&ip.done!=null)svc.iep={minutes:ip.min,per:ip.per,kind:ip.kind,done:ip.done,line:ip.line};else if(ip)svc.iep={minutes:ip.min,per:ip.per,kind:ip.kind};
    o=o||{};o.service=svc;}}catch(e){}
  return o;};})();
