const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const pct=v=>v==null?'—':(Math.round(v*10)/10).toFixed(0)+'%';
const r1=v=>v==null?'—':(Math.round(v*10)/10).toFixed(1);

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- defaults the sheets ship with ---- */
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],DAYL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const ROUT=[{label:'Morning',time:'getting up to leaving'},{label:'Meals',time:'breakfast and dinner'},{label:'Homework',time:'after school'},{label:'Bedtime',time:'bath to lights out'},{label:'Outings',time:'store, car, visits'}];
const MEAS={tally:'Tally: a mark each time',yn:'Yes or no for each routine',dur:'How long (minutes)',rate:'Rating 0 to 3'};
const ABC_A=['Told to do something','Told no, or had to wait','Something stopped or was taken away','Someone else got attention','Change in the routine','Tired, hungry or not feeling well','Nothing I could see'];
/* v22.53 (review F377) the 'after' list: being removed from the situation (which can work as escape) apart from losing
   something, being given what they wanted apart from the task being put off, and each box something the parent saw */
const ABC_C=['Was sent to their room or had a break away','Lost a privilege or item','Was given the item or activity','The task was put off or done for them','Was talked to, comforted or told off','No one came; left alone','I followed the plan step','Not sure'];

/* ---------------- state ---------------- */
/* v22.53 one shape for each kind of row, so a saved file reads back exactly: a behavior's rule for marking it (review
   F377: one time is; starts when / ends when; what 0 and 3 mean) and what Form TB-1 sent for it (F375); how staff
   watched an agreement check (F371); an ABC note and a night of the sleep log as typed in (F372) */
const BH_F=['name','ex','nex','ms','todo','one','st','en','r0','r3','tb'];
const mkBh=o=>{const r={};BH_F.forEach(f=>{const v=o&&o[f];r[f]=v==null?(f==='ms'?'tally':''):String(v);});if(!MEAS[r.ms])r.ms='tally';return r;};
const AG_F=['date','rt','bh','staff','home','how','note'];
const mkAg=o=>{const r={};AG_F.forEach(f=>{r[f]=o&&o[f]!=null?String(o[f]):'';});return r;};
const ABC_F=['day','time','rt','a','b','c','amt','txt'];
const mkAbc=o=>{const r={};ABC_F.forEach(f=>{const v=o&&o[f];r[f]=/^[abc]$/.test(f)?(Array.isArray(v)?v.filter(x=>x!=null&&typeof x!=='object').map(x=>String(x).slice(0,200)):[]):(v==null||typeof v==='object'?'':String(v));});return r;};
const SL_F=['lo','fa','wk','wm','up','nap','note'];
const mkSl=o=>{const r={};SL_F.forEach(f=>{const v=o&&o[f];r[f]=v==null||typeof v==='object'?'':String(v);});return r;};
const SHEETS=['tally','check','abc','sleep'],COND=['Baseline','Plan','Plan changed'];
function blank(){return{meta:{},chk:{tally:true,check:true,abc:false,sleep:false},bh:[],rt:[],sk:[],wk:[],ag:[]};}
let S=blank(),curWk=0;
let nbhHdFacts=null,nbhHdTbLater='',nbhHdTodoTD='';   /* v22.53 the case as last read (review F375, I190) */
/* a week: its dates and returns; its condition (F374); the sheets not sent that week (F372); the note back to the
   family (I188); the design its sheets went home with, dz (F370); and what was typed in: the behavior grid (cells), the
   checklist (ck), the ABC notes (abc) and the sleep log (sl) */
const newWeek=()=>({start:'',cond:'',cnote:'',sent:'',due:'',back:'',r_tally:false,r_check:false,r_abc:false,r_sleep:false,ns_tally:false,ns_check:false,ns_abc:false,ns_sleep:false,n_abc:'',n_sleep:'',note:'',fb:'',dz:null,cells:{},ck:{},abc:[],sl:{}});
function ensure(){
  ['bh','rt','sk','wk','ag'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  while(S.bh.length<1)S.bh.push(mkBh());
  if(!S.rt.length)ROUT.forEach(r=>S.rt.push({label:r.label,time:r.time,on:true,note:''}));
  while(S.sk.length<1)S.sk.push({label:'',who:'Adult',rt:''});
  while(S.wk.length<1)S.wk.push(newWeek());
  S.wk.forEach(w=>{['cells','ck','sl'].forEach(k=>{if(!w[k]||typeof w[k]!=='object'||Array.isArray(w[k]))w[k]={};});if(!Array.isArray(w.abc))w.abc=[];});
  if(curWk>=S.wk.length)curWk=S.wk.length-1;if(curWk<0)curWk=0;
}
function dayIdx(c){const d=c===undefined?S.meta.sh_days:c;return d==='5'?[0,1,2,3,4]:d==='we'?[5,6]:[0,1,2,3,4,5,6];}
const rtOn=()=>S.rt.map((r,i)=>({...r,i})).filter(r=>r.on);
const abcA=()=>(S.meta.abc_a||'').split('\n').map(x=>x.trim()).filter(Boolean).length?(S.meta.abc_a||'').split('\n').map(x=>x.trim()).filter(Boolean):ABC_A;
const abcC0=()=>(S.meta.abc_c||'').split('\n').map(x=>x.trim()).filter(Boolean).length?(S.meta.abc_c||'').split('\n').map(x=>x.trim()).filter(Boolean):ABC_C;
const abcC=()=>S.chk.base?abcC0().filter(x=>!/plan step/i.test(x)):abcC0();   /* v22.53 (review F374) no plan step on baseline sheets */
const key=s=>String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,' ');
const shortName=n=>String(n||'').replace(/\s*\(.*\)\s*$/,'').trim()||String(n||'');

/* v22.53 (review F369) a mark for "this routine did not happen today": a dash (typed as -, – or —, or NA). It is not
   asked for: it is left out of the cells the sheet asked for and out of the totals. A blank stays "not marked", a gap. */
const DASH=/^\s*(?:-|–|—|n\/?a|n\.a\.)\s*$/i;
const isDash=x=>x!=null&&DASH.test(String(x));
const filled=x=>x!=null&&String(x).trim()!=='';

/* v22.53 (review F370) each week keeps the design its sheets went home with: the days, the routines and the behaviors
   on them, copied into the week (w.dz) when its first mark is typed in. That week's grid, totals, completeness, graph
   points, CSV rows and the days given to the case come from its own copy, so a change on Setup applies only to the
   sheets still to come. Until something is typed in, a week follows Setup. */
const namedB=()=>S.bh.map((b,i)=>b.name?i:-1).filter(i=>i>=0);
const curDesign=()=>({days:S.meta.sh_days==='5'||S.meta.sh_days==='we'?S.meta.sh_days:'',rt:rtOn().map(r=>r.i),bh:namedB()});
function freeze(w){if(w&&!w.dz)w.dz=curDesign();}
function wD(w){return dayIdx(w&&w.dz?w.dz.days:undefined);}
function wR(w){if(!w||!w.dz)return rtOn();return w.dz.rt.filter(i=>S.rt[i]).map(i=>({...S.rt[i],i}));}
function wB(w){if(!w||!w.dz)return namedB();return w.dz.bh.filter(i=>S.bh[i]);}
const sameDz=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const dayName=c=>c==='5'?'Monday to Friday':c==='we'?'Saturday and Sunday':'Monday to Sunday';
function weekHas(w){return Object.keys(w.cells||{}).some(k=>filled(w.cells[k]))||Object.keys(w.ck||{}).some(k=>filled(w.ck[k]))||(w.abc||[]).length>0||Object.keys(w.sl||{}).some(k=>slFilled(w.sl[k]));}

/* v22.53 (review F370) one reading of a week's start for the grid, the graph and the case: the Monday of that week. A
   Sunday is read as the day before the week it starts (9/13/26 is the week of Monday 9/14/26); Tuesday to Saturday as
   the Monday before. */
function hdDate(t){t=String(t||'').trim();let m,d=null;
  if((m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))){d=new Date(+m[1],+m[2]-1,+m[3],12);if(d.getMonth()!==+m[2]-1)return null;}
  else if((m=/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}|\d{2}))?(?!\d)/.exec(t))){const y=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):new Date().getFullYear();d=new Date(y,+m[1]-1,+m[2],12);if(d.getMonth()!==+m[1]-1)return null;}
  return d&&!isNaN(d)?d:null;}
function hdMonday(t){const d=hdDate(t);if(!d)return null;const k=d.getDay();d.setDate(d.getDate()+(k===0?1:1-k));return d;}
const addDays=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x;};
const mdY=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- setup rows ---------------- */
/* v22.53 (review F375) what Form TB-1 sent for a behavior brought in from the case: label, definition, examples,
   non-examples and its dimension, kept so a later rename or a new definition on TB-1 can be offered */
const tbSnap=b=>{try{const o=JSON.parse(b&&b.tb||'');return o&&typeof o==='object'&&o.l?o:null;}catch(e){return null;}};
/* v22.53 (review F377) the rule for marking it, by measure */
function ruleCell(r,i){const inp=(f,ph,lab)=>'<span class="rl" aria-hidden="true">'+lab+'</span><input data-r="bh" data-i="'+i+'" data-f="'+f+'" value="'+esc(r[f])+'" placeholder="'+esc(ph)+'" aria-label="'+esc(lab+', behavior '+(i+1))+'">';
  if(r.ms==='tally')return '<td class="rule">'+inp('one','e.g., a new hit after 3 seconds with no hitting','One time is')+'</td>';
  if(r.ms==='dur')return '<td class="rule">'+inp('st','e.g., he drops to the floor or screams','Starts when')+inp('en','e.g., a minute with no crying','Ends when')+'</td>';
  if(r.ms==='rate')return '<td class="rule">'+inp('r0','e.g., no whining, arguing or refusing','0 means')+inp('r3','e.g., fussing for most of the routine','3 means')+'</td>';
  return '<td class="rule hint">Y if it happened at all in the routine, N if it did not.</td>';}
function renderB(){
  $('#bTbl tbody').innerHTML=S.bh.map((r,i)=>{const s=tbSnap(r);return `<tr><td class="num">${i+1}</td>
    <td><input data-r="bh" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="Hitting"></td>
    <td><input data-r="bh" data-i="${i}" data-f="ex" value="${esc(r.ex)}" placeholder="${s&&s.d?esc('TB-1’s definition, to put in the family’s words: '+s.d.slice(0,160)):'an open or closed hand lands on a person'}"></td>
    <td><input data-r="bh" data-i="${i}" data-f="nex" value="${esc(r.nex)}" placeholder="hitting a pillow or the table"></td>
    <td><select data-r="bh" data-i="${i}" data-f="ms" aria-label="Measure for behavior ${i+1}">${Object.keys(MEAS).map(k=>`<option value="${k}"${r.ms===k?' selected':''}>${MEAS[k]}</option>`).join('')}</select></td>
    ${ruleCell(r,i)}
    <td><input data-r="bh" data-i="${i}" data-f="todo" value="${esc(r.todo)}" placeholder="Block, say “hands down”, help with the next step; no talking about it after"></td>${delCell('bh',i,'behavior')}</tr>`;}).join('');
}
function renderR(){
  $('#rTbl tbody').innerHTML=S.rt.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="rt" data-i="${i}" data-f="label" value="${esc(r.label)}" placeholder="Morning"></td>
    <td><input data-r="rt" data-i="${i}" data-f="time" value="${esc(r.time)}" placeholder="7:00 to 8:00"></td>
    <td class="num"><input type="checkbox" data-r="rt" data-i="${i}" data-f="on"${r.on?' checked':''} aria-label="Routine ${i+1} on the sheets"></td>
    <td><input data-r="rt" data-i="${i}" data-f="note" value="${esc(r.note||'')}" placeholder="e.g., count from the first “time to get up” to the car"></td>${delCell('rt',i,'routine')}</tr>`).join('');
}
function renderK(){
  $('#kTbl tbody').innerHTML=S.sk.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="sk" data-i="${i}" data-f="label" value="${esc(r.label)}" placeholder="Show the picture schedule before the routine starts"></td>
    <td><select data-r="sk" data-i="${i}" data-f="who" aria-label="Who does step ${i+1}"><option${r.who==='Adult'?' selected':''}>Adult</option><option${r.who==='Child'?' selected':''}>Child</option></select></td>
    <td><select data-r="sk" data-i="${i}" data-f="rt" aria-label="Routine for step ${i+1}"><option value="">Any (every routine)</option>${S.rt.map((x,ri)=>`<option value="${ri}"${String(r.rt)===String(ri)?' selected':''}>${esc(x.label||('Routine '+(ri+1)))}</option>`).join('')}</select></td>${delCell('sk',i,'step')}</tr>`).join('');
}
/* v22.53 (review F371) how staff watched: a check by phone hears the behavior but does not see it, so it is not counted */
const HOW=['In person','Video','Phone or audio only'];
const phoneHow=r=>/^Phone/i.test(String(r&&r.how||''));
function agCell(r){const a=agree(r);if(a==null)return '—';let t=pct(a);const b=S.bh[+r.bh];
  if(b&&b.ms==='rate'){const w1=agreeW1(r);if(w1!=null)t+=' <span class="hint">within one: '+pct(w1)+'</span>';}
  if(phoneHow(r))t+=' <span class="hint">by phone, not counted</span>';return t;}
function renderAg(){
  $('#agTbl tbody').innerHTML=S.ag.map((r,i)=>`<tr><td class="num">${i+1}</td><td><input data-r="ag" data-i="${i}" data-f="date" value="${esc(r.date)}" aria-label="Date of check ${i+1}"></td>
    <td><select data-r="ag" data-i="${i}" data-f="rt" aria-label="Routine of check ${i+1}"><option value=""></option>${S.rt.map((x,ri)=>`<option value="${ri}"${String(r.rt)===String(ri)?' selected':''}>${esc(x.label)}</option>`).join('')}</select></td>
    <td><select data-r="ag" data-i="${i}" data-f="bh" aria-label="Behavior of check ${i+1}"><option value=""></option>${S.bh.map((x,bi)=>`<option value="${bi}"${String(r.bh)===String(bi)?' selected':''}>${esc(x.name||('Behavior '+(bi+1)))}</option>`).join('')}</select></td>
    <td><select data-r="ag" data-i="${i}" data-f="how" aria-label="How staff watched, check ${i+1}"><option value="">Not recorded</option>${HOW.map(h=>`<option${r.how===h?' selected':''}>${h}</option>`).join('')}</select></td>
    <td><input data-r="ag" data-i="${i}" data-f="staff" value="${esc(r.staff)}" style="text-align:center" aria-label="Staff saw, check ${i+1}"></td><td><input data-r="ag" data-i="${i}" data-f="home" value="${esc(r.home)}" style="text-align:center" aria-label="Family wrote, check ${i+1}"></td>
    <td class="num agv">${agCell(r)}</td><td><input data-r="ag" data-i="${i}" data-f="note" value="${esc(r.note)}" aria-label="Note, check ${i+1}"></td>${delCell('ag',i,'check')}</tr>`).join('');
}
/* v22.53 (review F371) smaller / larger is the agreement for a count or minutes. For a 0 to 3 rating the two agree only
   when they are the same number; agreement within one point is reported beside it. */
function agVals(r){const b=S.bh[+r.bh];if(!b||r.bh===''||r.staff===''||r.home===''||r.staff==null||r.home==null)return null;return b;}
function agree(r){const b=agVals(r);if(!b)return null;
  if(b.ms==='yn'){const s=String(r.staff).trim().toUpperCase()[0],h=String(r.home).trim().toUpperCase()[0];if(!/[YN]/.test(s||'')||!/[YN]/.test(h||''))return null;return s===h?100:0;}
  const s=num(r.staff),h=num(r.home);if(s==null||h==null)return null;
  if(b.ms==='rate')return s===h?100:0;
  const mx=Math.max(s,h);return mx===0?100:Math.min(s,h)/mx*100;}
function agreeW1(r){const b=agVals(r);if(!b||b.ms!=='rate')return null;const s=num(r.staff),h=num(r.home);if(s==null||h==null)return null;return Math.abs(s-h)<=1?100:0;}

/* ---------------- entry ---------------- */
function week(){ensure();return S.wk[curWk];}
function cellKey(bi,ri,di){return 'b'+bi+'_r'+ri+'_d'+di;}
/* a day's total, from the routines on that week's sheet: n routines marked of ask held (a dash: not held) */
function dayTotal(w,bi,di){const b=S.bh[bi],R=wR(w);let n=0,y=0,sum=0,ask=0,na=0;
  if(!b)return{v:null,n:0,ask:0,na:0,txt:'—',of:''};
  R.forEach(r=>{const x=w.cells[cellKey(bi,r.i,di)];if(isDash(x)){na++;return;}ask++;if(!filled(x))return;
    if(b.ms==='yn'){const c=String(x).trim().toUpperCase()[0];if(c==='Y'){y++;n++;}else if(c==='N')n++;}
    else{const q=num(x);if(q!=null){sum+=q;n++;}}});
  const of=n&&n<ask?n+' of '+ask+' routines':'';
  if(!n)return{v:null,n:0,ask,na,txt:!ask&&na?'n/a':'—',of};
  if(b.ms==='yn')return{v:y,n,ask,na,txt:y+' of '+n,of:''};
  if(b.ms==='rate')return{v:sum/n,n,ask,na,txt:r1(sum/n),of};
  return{v:sum,n,ask,na,txt:String(Math.round(sum*10)/10),of};
}
function weekTotal(w,bi){const b=S.bh[bi];let v=0,n=0,days=0;wD(w).forEach(di=>{const t=dayTotal(w,bi,di);if(t.v==null)return;days++;v+=t.v;n+=t.n;});
  if(!days||!b)return{v:null,txt:'—',days:0};
  if(b.ms==='yn')return{v,txt:v+' of '+n,days};if(b.ms==='rate')return{v:v/days,txt:r1(v/days),days};return{v,txt:String(Math.round(v*10)/10),days};}
function completeness(w){const D=wD(w),R=wR(w);let ask=0,got=0,na=0;wB(w).forEach(bi=>R.forEach(r=>D.forEach(di=>{const x=w.cells[cellKey(bi,r.i,di)];if(isDash(x)){na++;return;}ask++;if(filled(x))got++;})));return{ask,got,na,p:ask?got/ask*100:null};}
function renderWkSel(){const s=$('#wkSel');s.innerHTML=S.wk.map((w,i)=>`<option value="${i}"${i===curWk?' selected':''}>Week ${i+1}${w.start?' · '+esc(w.start):''}${w.cond?' · '+esc(w.cond):''}</option>`).join('');}
function bindWeek(){const w=week();wkStartSet='';$$('[data-w]').forEach(el=>{if(el.type==='checkbox')el.checked=!!w[el.dataset.w];else el.value=w[el.dataset.w]||'';});const n=$('#wkStartNote');if(n)n.innerHTML='';const f=$('#fbMsg');if(f)f.textContent='';}
const dtCell=t=>esc(t.txt)+(t.of?'<div class="dt-of">'+esc(t.of)+'</div>':'');
function renderEnt(){
  const w=week(),D=wD(w),R=wR(w),B=wB(w),t=$('#entTbl');renderWkDesign();
  if(!B.length){t.innerHTML='<tr><td class="hint">Name at least one behavior on the Setup page; the week grid appears here.</td></tr>';}
  else{
  let h='<thead><tr><th style="width:16%">Behavior</th><th style="width:14%">Routine</th>'+D.map(di=>'<th>'+DAYS[di]+'</th>').join('')+'<th style="width:9%">Week</th></tr></thead><tbody>';
  B.forEach(bi=>{const b=S.bh[bi];
    R.forEach((r,k)=>{h+='<tr>'+(k===0?'<td class="lk" rowspan="'+(R.length+1)+'" style="white-space:normal">'+esc(b.name||('Behavior '+(bi+1)))+'<div class="hint" style="font-weight:400">'+esc(MEAS[b.ms]||'')+'</div></td>':'')+'<td class="lk" style="white-space:normal">'+esc(r.label||('Routine '+(r.i+1)))+'</td>'+
      D.map(di=>{const k2=cellKey(bi,r.i,di),v=w.cells[k2]||'';const lab=DAYL[di]+' '+(r.label||'')+' '+(b.name||'');
        return '<td class="ent'+(isDash(v)?' na':'')+'">'+(b.ms==='yn'?'<select data-e="'+k2+'" aria-label="'+esc(lab)+'"><option value=""></option><option'+(v==='Y'?' selected':'')+'>Y</option><option'+(v==='N'?' selected':'')+'>N</option><option value="—"'+(isDash(v)?' selected':'')+'>— did not happen</option></select>':'<input data-e="'+k2+'" value="'+esc(v)+'" aria-label="'+esc(lab)+'" inputmode="numeric" autocomplete="off">')+'</td>';}).join('')+(k===0?'<td class="num" rowspan="'+(R.length+1)+'" style="vertical-align:middle"><b id="wt_b'+bi+'">'+weekTotal(w,bi).txt+'</b></td>':'')+'</tr>';});
    h+='<tr class="tot"><td>Day total</td>'+D.map(di=>'<td class="num" id="t_b'+bi+'_d'+di+'">'+dtCell(dayTotal(w,bi,di))+'</td>').join('')+'</tr>';});
  t.innerHTML=h+'</tbody>';}
  renderCk();renderAbc();renderSl();renderEntTotals();
}
function updateTotals(){const w=week();wB(w).forEach(bi=>{wD(w).forEach(di=>{const el=$('#t_b'+bi+'_d'+di);if(el)el.innerHTML=dtCell(dayTotal(w,bi,di));});const el=$('#wt_b'+bi);if(el)el.textContent=weekTotal(w,bi).txt;});
  $$('#entTbl td.ent').forEach(td=>{const x=td.querySelector('[data-e]');if(x)td.classList.toggle('na',isDash(x.value));});renderEntTotals();}
/* the sheets asked for in a week: ticked on Setup and not marked "not sent" for that week (v22.53, review F372) */
const sentK=w=>SHEETS.filter(k=>S.chk[k]&&!w['ns_'+k]);
function renderEntTotals(){
  const w=week(),c=completeness(w),M=$('#entMetrics'),V=$('#entVerdict');
  const asked=sentK(w),back=asked.filter(k=>w['r_'+k]).length;
  M.innerHTML=wB(w).map(bi=>{const b=S.bh[bi],t=weekTotal(w,bi);return `<div class="metric"><b>${esc(b.name||('Behavior '+(bi+1)))}, this week</b><div class="val">${t.txt}</div><div class="sub">${b.ms==='yn'?'routines with a yes':b.ms==='dur'?'minutes':b.ms==='rate'?'mean rating, 0 to 3':'times'} · ${t.days} day${t.days===1?'':'s'} marked</div></div>`;}).join('')+
    `<div class="metric"><b>Completeness, this week</b><div class="val">${c.p==null?'—':pct(c.p)}</div><div class="sub">${c.got} of ${c.ask} cells written${c.na?' · '+c.na+' marked as a routine that did not happen':''}</div></div>
    <div class="metric"><b>Sheets back, this week</b><div class="val">${back} of ${asked.length}</div><div class="sub">${w.n_abc?w.n_abc+' ABC note'+(w.n_abc==='1'?'':'s'):''}${w.n_abc&&w.n_sleep?' · ':''}${w.n_sleep?w.n_sleep+' night'+(w.n_sleep==='1'?'':'s')+' logged':''}${SHEETS.some(k=>S.chk[k]&&w['ns_'+k])?((w.n_abc||w.n_sleep)?' · ':'')+'not sent: '+SHEETS.filter(k=>S.chk[k]&&w['ns_'+k]).map(k=>({tally:'tally',check:'checklist',abc:'ABC notes',sleep:'sleep log'})[k]).join(', '):''}</div></div>`;
  if(c.ask===0)V.innerHTML='';
  else if(c.got===0)V.innerHTML='<div class="verdict v-mid"><b>Nothing typed in for this week yet.</b> If the sheet came back empty or did not come back, say so in the note; an empty week is a result.</div>';
  else if(c.p<50)V.innerHTML='<div class="verdict v-no"><b>Completeness '+pct(c.p)+'.</b> Fewer than half the cells were written (working convention: below 50% the week is not used for decisions). Ask the family which routines were hard to mark and shorten the sheet before the next week.</div>';
  else if(c.p<80)V.innerHTML='<div class="verdict v-mid"><b>Completeness '+pct(c.p)+'.</b> Usable with care; the missing days are gaps, not zeros. Thank the family and ask whether one routine should come off the sheet.</div>';
  else V.innerHTML='<div class="verdict v-ok"><b>Completeness '+pct(c.p)+'.</b> A full week. Send the graph and the note below back to the family.</div>';
  ckTotals();abcTotals();slTotals();drawEnt();renderAgM();renderRet();
}
/* v22.53 (review F370) the week's design, when Setup has changed since its sheets went home */
function renderWkDesign(){const el=$('#wkDesign'),w=week();if(!el)return;
  if(!w.dz||sameDz(w.dz,curDesign())){el.innerHTML='';return;}
  const R=wR(w),B=wB(w);
  el.innerHTML='<div class="verdict v-mid"><b>This week keeps the sheets it went home with:</b> '+dayName(w.dz.days)+'; '+(R.map(r=>esc(r.label||('Routine '+(r.i+1)))).join(', ')||'no routine')+'; '+(B.map(bi=>esc(S.bh[bi].name||('Behavior '+(bi+1)))).join(', ')||'no behavior')+'. Setup has changed since, for the sheets still to come. <button type="button" class="tool" id="wkUseCur">Use the current Setup for this week</button></div>';}
function orderedWeeks(){return S.wk.map((w,i)=>({w,i,d:hdMonday(w.start)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:a.i-b.i);}
const parseDate=hdMonday;
/* v22.53 (review F374) a change of condition starts a phase: a new condition, or Plan changed; Plan after Plan changed
   carries the changed plan on */
const phaseStart=(p,c)=>!!c.cond&&(c.cond==='Plan changed'||!p||(p.cond!==c.cond&&!(p.cond==='Plan changed'&&c.cond==='Plan')));
function drawEnt(){
  const svg=$('#entPlot'),B=namedB(),W=orderedWeeks();const PH=130,W0=900,L=60,Rg=16,B0=36;
  const pts=[];W.forEach((o,wi)=>wD(o.w).forEach(di=>{const lab=o.d?(()=>{const d=addDays(o.d,di);return (d.getMonth()+1)+'/'+d.getDate();})():'W'+(o.i+1)+' '+DAYS[di];pts.push({w:o.w,di,lab,wi});}));
  const hasCk=S.wk.some(w=>Object.keys(w.ck).some(k=>w.ck[k]==='Y'||w.ck[k]==='N')),hasSl=S.wk.some(w=>wD(w).some(di=>slHours(w.sl[String(di)])!=null));
  const P=B.map(bi=>({kind:'b',bi})).concat(hasCk?[{kind:'ck'}]:[]).concat(hasSl?[{kind:'sl'}]:[]);
  const marks=[];W.forEach((o,k)=>{if(k===0)return;const p=W[k-1];const at=pts.findIndex(x=>x.wi===k);if(at<0)return;
    marks.push({at,phase:phaseStart(p.w,o.w)?o.w:null,dz:!!(o.w.dz&&p.w.dz&&!sameDz(o.w.dz,p.w.dz))});});
  const first=W[0]&&W[0].w.cond?W[0].w:null,band=(first||marks.some(m=>m.phase||m.dz))?18:0,T=14+band;
  const H=Math.max(1,P.length)*PH+30+band;svg.setAttribute('viewBox','0 0 '+W0+' '+H);
  const n=Math.max(pts.length,7),X=i=>L+(i+0.5)*(W0-L-Rg)/n,cw=(W0-L-Rg)/n;let s='<rect x="0" y="0" width="'+W0+'" height="'+H+'" fill="#fff"/>';
  const condLab=w=>w.cond+(w.cond==='Plan changed'&&w.cnote?': '+w.cnote:'');
  P.forEach((pn,pi)=>{const top=T+pi*PH,bot=top+PH-B0;let vals,open=[],mx,title,unit;
    if(pn.kind==='b'){const b=S.bh[pn.bi];const tt=pts.map(p=>wB(p.w).includes(pn.bi)?dayTotal(p.w,pn.bi,p.di):null);vals=tt.map(t=>t?t.v:null);open=tt.map(t=>!!(t&&t.v!=null&&t.n<t.ask));
      mx=b.ms==='rate'?3:b.ms==='yn'?Math.max(1,...tt.map(t=>t?t.ask:0)):Math.max(1,...vals.filter(v=>v!=null),0);title=b.name||('Behavior '+(pn.bi+1));unit=b.ms==='yn'?'routines with a yes':b.ms==='dur'?'minutes':b.ms==='rate'?'mean rating':'count';}
    else if(pn.kind==='ck'){vals=pts.map(p=>ckDay(p.w,p.di).v);mx=100;title='Routine checklist';unit='% of steps marked done';}
    else{vals=pts.map(p=>slHours(p.w.sl[String(p.di)]));mx=Math.max(12,...vals.filter(v=>v!=null));title='Sleep log';unit='hours asleep the night before';}
    const Y=v=>bot-(bot-top-14)*(v/mx);
    s+='<text x="'+L+'" y="'+(top+10)+'" font-size="12" font-weight="600" fill="#182e43" font-family="system-ui,sans-serif">'+esc(title)+' <tspan font-weight="400" fill="#5B6B6B">('+esc(unit)+')</tspan></text>';
    [0,0.5,1].forEach(f=>{const v=mx*f;s+='<line x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W0-Rg)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="10.5" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(Math.round(v*10)/10)+'</text>';});
    s+='<line x1="'+L+'" y1="'+bot+'" x2="'+(W0-Rg)+'" y2="'+bot+'" stroke="#182e43"/><line x1="'+L+'" y1="'+(top+14)+'" x2="'+L+'" y2="'+bot+'" stroke="#182e43"/>';
    let d='';vals.forEach((v,i)=>{if(v==null){d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});
    d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="#2f5568" stroke-width="2"/>';});
    vals.forEach((v,i)=>{if(v==null)return;s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="4" fill="'+(open[i]?'#fff':'#2f5568')+'" stroke="#2f5568" stroke-width="1.6"'+(open[i]?' class="pt-open"':'')+'/>';});
    pts.forEach((p,i)=>{if(i>0&&p.wi!==pts[i-1].wi){const m=marks.find(x=>x.at===i),x=X(i)-cw/2;
        s+=m&&m.phase?'<line class="ph-line" x1="'+x.toFixed(1)+'" y1="'+(top+14)+'" x2="'+x.toFixed(1)+'" y2="'+bot+'" stroke="#182e43" stroke-width="1.6"/>':'<line x1="'+x.toFixed(1)+'" y1="'+(top+14)+'" x2="'+x.toFixed(1)+'" y2="'+bot+'" stroke="#9b4e15" stroke-dasharray="3 3"/>';}
      if(pi===P.length-1||pts.length<=14)s+='<text x="'+X(i).toFixed(1)+'" y="'+(bot+13)+'" font-size="'+(pts.length>21?8:9.5)+'" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(p.lab)+'</text>';});});
  /* the condition of each phase and a week whose sheets changed, labeled in the band above the panels */
  if(band){if(first)s+='<text class="ph-lab" x="'+(L+4)+'" y="'+(14+10)+'" font-size="10.5" font-weight="600" fill="#182e43" font-family="system-ui,sans-serif">'+esc(condLab(first).slice(0,60))+'</text>';
    marks.forEach(m=>{const x=X(m.at)-cw/2;if(m.phase)s+='<text class="ph-lab" x="'+(x+4).toFixed(1)+'" y="'+(14+10)+'" font-size="10.5" font-weight="600" fill="#182e43" font-family="system-ui,sans-serif">'+esc(condLab(m.phase).slice(0,60))+'</text>';
      if(m.dz)s+='<text class="dz-lab" x="'+(x+4).toFixed(1)+'" y="'+(14+(m.phase?22:10))+'" font-size="9.5" fill="#9b4e15" font-family="system-ui,sans-serif">sheet changed</text>';});}
  s+='<text x="'+((L+W0-Rg)/2)+'" y="'+(H-6)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">Day totals as typed in · dashed: a new week · solid: the condition changes · open point: not every routine marked · a missing day breaks the line</text>';
  svg.innerHTML=s;
}
/* v22.53 (review F371) agreement for each behavior on the sheet: its mean and its checks, the verdict on the lowest one,
   and every behavior with no check that counts named */
function agStats(){return namedB().map(bi=>{const L=S.ag.filter(r=>String(r.bh)===String(bi)),Lc=L.filter(r=>!phoneHow(r));
  const C=Lc.map(agree).filter(x=>x!=null),W=S.bh[bi].ms==='rate'?Lc.map(agreeW1).filter(x=>x!=null):[];
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  return {bi,name:S.bh[bi].name,n:C.length,m:mean(C),w1:mean(W),ph:L.filter(r=>phoneHow(r)&&agree(r)!=null).length};});}
function renderAgM(){const st=agStats(),C=st.filter(x=>x.n),nm=x=>'<b>'+esc(x.name)+'</b>';
  let h=st.map(x=>`<div class="metric"><b>Agreement, ${esc(shortName(x.name))}</b><div class="val">${x.m==null?'—':pct(x.m)}</div><div class="sub">${x.n} check${x.n===1?'':'s'} counted${x.w1!=null?' · within one point: '+pct(x.w1):''}${x.ph?' · '+x.ph+' by phone, not counted':''}</div></div>`).join('');
  if(C.length){const lo=C.reduce((a,b)=>b.m<a.m?b:a),miss=st.filter(x=>!x.n);let cls,txt;
    if(lo.m<60){cls='v-no';txt='Below 60% for '+nm(lo)+' ('+pct(lo.m)+'): the two records disagree. Re-teach its definition with the family (the example, the non-example and the rule for marking it) and do not use its home data for decisions until a check reaches 80%.';}
    else if(lo.m<80){cls='v-mid';txt='Between 60% and 80% for '+nm(lo)+' ('+pct(lo.m)+'): go over its example, non-example and rule for marking it with the family, and hold its home data from decisions until a check reaches 80%.';}
    else{cls=miss.length?'v-mid':'v-ok';txt=(C.length>1?'Every behavior checked agrees at 80% or more':nm(lo)+' agrees at 80% or more')+' (lowest: '+esc(shortName(lo.name))+', '+pct(lo.m)+')'+(miss.length?'.':': the family marks what the staff see. Use the home data as they stand.');}
    if(miss.length)txt+=' '+miss.map(nm).join(', ')+(miss.length===1?' has':' have')+' no check that counts yet'+(miss.some(x=>x.ph)?' (a check by phone is not counted)':'')+': hold '+(miss.length===1?'its':'their')+' home data from decisions until a check in person or by video reaches 80%.';
    h+=`<div class="verdict ${cls}" style="grid-column:1/-1">${txt} (80% is the working convention.)</div>`;}
  $('#agMetrics').innerHTML=h;}
const SH_NAME={tally:'Tally sheet',check:'Checklist',abc:'ABC notes',sleep:'Sleep log'};
function renderRet(){const asked=SHEETS.filter(k=>S.chk[k]);
  const W=orderedWeeks();if(!asked.length){$('#retOut').innerHTML='<p class="hint">No sheet is ticked on the Setup page.</p>';return;}
  let h='<div class="grid-wrap"><table class="rt"><thead><tr><th>Week</th>'+asked.map(k=>'<th>'+SH_NAME[k]+'</th>').join('')+'<th>Completeness</th><th>Note</th></tr></thead><tbody>';
  W.forEach(o=>{const c=completeness(o.w);h+='<tr><td class="lk">Week '+(o.i+1)+(o.w.start?' · '+esc(o.w.start):'')+(o.w.cond?' · '+esc(o.w.cond):'')+'</td>'+asked.map(k=>'<td class="num">'+(o.w['ns_'+k]?'not sent':(o.w['r_'+k]?'back':'—')+(k==='abc'&&o.w.n_abc?' ('+esc(o.w.n_abc)+')':'')+(k==='sleep'&&o.w.n_sleep?' ('+esc(o.w.n_sleep)+' nights)':''))+'</td>').join('')+'<td class="num">'+(c.p==null?'—':pct(c.p))+'</td><td>'+esc(o.w.note)+'</td></tr>';});
  const tot=asked.map(k=>{const sent=S.wk.filter(w=>!w['ns_'+k]);return sent.filter(w=>w['r_'+k]).length+' of '+sent.length;});
  h+='<tr class="tot"><td>Weeks back, of the weeks sent</td>'+tot.map(t=>'<td class="num">'+t+'</td>').join('')+'<td colspan="2"></td></tr></tbody></table></div>';
  $('#retOut').innerHTML=h;}

/* ---------------- v22.53 (review F372) the checklist, the ABC notes and the sleep log, typed in ---------------- */
function ckSteps(ri){return S.sk.map((s,si)=>({...s,si})).filter(s=>s.label&&(s.rt===''||s.rt==null||String(s.rt)===String(ri)));}
const ckKey=(si,ri,di)=>'k'+si+'_r'+ri+'_d'+di;
function ckDay(w,di){let y=0,n=0;wR(w).forEach(r=>ckSteps(r.i).forEach(s=>{const v=w.ck[ckKey(s.si,r.i,di)];if(v==='Y')y++;else if(v==='N')n++;}));return {v:y+n?y/(y+n)*100:null,y,of:y+n,txt:y+n?pct(y/(y+n)*100):'—'};}
function ckWeek(w){let y=0,o=0;wD(w).forEach(di=>{const c=ckDay(w,di);y+=c.y;o+=c.of;});return {y,of:o,p:o?y/o*100:null};}
function renderCk(){const wrap=$('#ckWrap'),w=week(),t=$('#ckTbl');if(!wrap)return;
  wrap.hidden=!(S.chk.check||Object.keys(w.ck).some(k=>filled(w.ck[k])));if(wrap.hidden)return;
  const D=wD(w),G=wR(w).map(r=>({r,st:ckSteps(r.i)})).filter(g=>g.st.length);
  if(!G.length){t.innerHTML='<tr><td class="hint">No steps on the Setup page yet; the checklist grid appears here.</td></tr>';ckTotals();return;}
  let h='<thead><tr><th style="width:34%">Step</th>'+D.map(di=>'<th>'+DAYS[di]+'</th>').join('')+'</tr></thead><tbody>';
  G.forEach(g=>{h+='<tr class="grp"><td colspan="'+(D.length+1)+'" class="lk">'+esc(g.r.label||('Routine '+(g.r.i+1)))+'</td></tr>';
    g.st.forEach(s=>{h+='<tr><td style="white-space:normal">'+esc(s.label)+' <span class="hint">('+esc(s.who)+')</span></td>'+D.map(di=>{const k=ckKey(s.si,g.r.i,di),v=w.ck[k]||'';
      return '<td class="ent'+(v==='—'?' na':'')+'"><select data-k="'+k+'" aria-label="'+esc(DAYL[di]+', '+(g.r.label||'')+': '+s.label)+'">'+['','Y','N','—'].map(o=>'<option value="'+o+'"'+(v===o?' selected':'')+'>'+(o==='—'?'— did not happen':o)+'</option>').join('')+'</select></td>';}).join('')+'</tr>';});});
  t.innerHTML=h+'<tr class="tot"><td>Steps done</td>'+D.map(di=>'<td class="num" id="ck_d'+di+'">'+ckDay(w,di).txt+'</td>').join('')+'</tr></tbody>';ckTotals();}
function ckTotals(){const w=week(),M=$('#ckMetrics');if(!M)return;wD(w).forEach(di=>{const el=$('#ck_d'+di);if(el)el.textContent=ckDay(w,di).txt;});const c=ckWeek(w);
  const per=[];wR(w).forEach(r=>ckSteps(r.i).forEach(s=>{let y=0,o=0;wD(w).forEach(di=>{const v=w.ck[ckKey(s.si,r.i,di)];if(v==='Y'){y++;o++;}else if(v==='N')o++;});if(o)per.push({s,r,y,o});}));
  const low=per.filter(x=>x.y/x.o<0.5).slice(0,4);
  M.innerHTML='<div class="metric"><b>Steps done, this week</b><div class="val">'+(c.p==null?'—':pct(c.p))+'</div><div class="sub">'+c.y+' of '+c.of+' steps marked Y'+(w.ns_check?' · the checklist was not sent this week':'')+'</div></div>'+
    (low.length?'<div class="metric" style="grid-column:span 2"><b>Marked N more often than Y</b><div class="sub" style="font-size:12px">'+low.map(x=>esc(x.s.label)+' ('+esc(x.r.label)+', '+x.y+' of '+x.o+')').join('; ')+'. An N is about the step, the routine or the training, not the parent.</div></div>':'');}
function renderAbc(){const wrap=$('#abcWrap'),w=week(),t=$('#abcTbl');if(!wrap)return;wrap.hidden=!(S.chk.abc||w.abc.length);if(wrap.hidden)return;
  const D=wD(w),R=wR(w),A=abcA(),C=abcC0(),B=wB(w);
  if(!w.abc.length){t.innerHTML='<tr><td class="hint">No note typed in for this week. <b>Add a note</b> for each box the family filled in.</td></tr>';abcTotals();return;}
  const box=(i,g,val,lab,on)=>'<label class="ck abc-t"><input type="checkbox" data-an="'+i+'" data-ag="'+g+'" value="'+esc(val)+'"'+(on?' checked':'')+'> '+esc(lab)+'</label>';
  let h='<thead><tr><th style="width:3%">#</th><th style="width:7%">Day</th><th style="width:8%">Time</th><th style="width:10%">Routine</th><th style="width:19%">Before</th><th style="width:13%">What the child did</th><th style="width:19%">After</th><th style="width:9%">How long or how many</th><th>In a few words</th><th class="nx noprint"></th></tr></thead><tbody>';
  w.abc.forEach((n,i)=>{const Ai=A.concat(n.a.filter(x=>!A.includes(x))),Ci=C.concat(n.c.filter(x=>!C.includes(x)));
    h+='<tr><td class="num">'+(i+1)+'</td><td><select data-an="'+i+'" data-af="day" aria-label="Note '+(i+1)+': day"><option value=""></option>'+D.map(di=>'<option value="'+di+'"'+(String(n.day)===String(di)?' selected':'')+'>'+DAYS[di]+'</option>').join('')+'</select></td>'+
      '<td><input data-an="'+i+'" data-af="time" value="'+esc(n.time)+'" placeholder="5:40 pm" aria-label="Note '+(i+1)+': time"></td>'+
      '<td><select data-an="'+i+'" data-af="rt" aria-label="Note '+(i+1)+': routine"><option value=""></option>'+R.map(r=>'<option value="'+r.i+'"'+(String(n.rt)===String(r.i)?' selected':'')+'>'+esc(r.label)+'</option>').join('')+'</select></td>'+
      '<td>'+Ai.map(x=>box(i,'a',x,x,n.a.includes(x))).join('')+'</td><td>'+B.map(bi=>box(i,'b',String(bi),S.bh[bi].name,n.b.includes(String(bi)))).join('')+'</td><td>'+Ci.map(x=>box(i,'c',x,x,n.c.includes(x))).join('')+'</td>'+
      '<td><input data-an="'+i+'" data-af="amt" value="'+esc(n.amt)+'" placeholder="2 times" aria-label="Note '+(i+1)+': how long or how many"></td><td><input data-an="'+i+'" data-af="txt" value="'+esc(n.txt)+'" aria-label="Note '+(i+1)+': in a few words"></td>'+delCell('abc',i,'note')+'</tr>';});
  t.innerHTML=h+'</tbody>';abcTotals();}
function abcCount(){const A={},C={};let n=0;S.wk.forEach(w=>(w.abc||[]).forEach(x=>{n++;x.a.forEach(k=>{A[k]=(A[k]||0)+1;});x.c.forEach(k=>{C[k]=(C[k]||0)+1;});}));return {n,A,C};}
function abcTotals(){const el=$('#abcSum');if(!el)return;const w=week(),c=abcCount();if(!c.n){el.innerHTML='';return;}
  const list=o=>Object.keys(o).sort((a,b)=>o[b]-o[a]).map(k=>'<tr><td>'+esc(k)+'</td><td class="num">'+o[k]+'</td></tr>').join('')||'<tr><td class="hint" colspan="2">none ticked</td></tr>';
  el.innerHTML='<div class="metrics"><div class="metric"><b>ABC notes typed in</b><div class="val">'+w.abc.length+'</div><div class="sub">this week'+(w.n_abc&&num(w.n_abc)!==w.abc.length?' ('+esc(w.n_abc)+' returned)':'')+' · '+c.n+' in all weeks</div></div></div>'+
    '<div class="abc-sum"><table class="rt"><thead><tr><th>Before, all weeks</th><th style="width:22%">Notes</th></tr></thead><tbody>'+list(c.A)+'</tbody></table><table class="rt"><thead><tr><th>After, all weeks</th><th style="width:22%">Notes</th></tr></thead><tbody>'+list(c.C)+'</tbody></table></div>';}
/* the sleep log: a row is the night before a day, filled in that morning */
const nightLab=di=>DAYS[(di+6)%7]+' night → '+DAYS[di];
const slFilled=n=>!!n&&SL_F.some(f=>String(n[f]||'').trim()!=='');
function hm(t,eve){const m=/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*m?\.?\s*$/i.exec(String(t||''));if(!m)return null;let h=+m[1];const mi=+(m[2]||0);if(h>23||mi>59)return null;const ap=(m[3]||'').toLowerCase();
  if(ap==='p'&&h<12)h+=12;else if(ap==='a'&&h===12)h=0;else if(!ap&&eve&&h>=5&&h<12)h+=12;else if(!ap&&eve&&h===12)h=0;return h*60+mi;}
function slHours(n){if(!slFilled(n))return null;const a=hm(n.fa||n.lo,true),u=hm(n.up,false);if(a==null||u==null)return null;let d=u-a;if(d<=0)d+=1440;d-=num(n.wm)||0;return d>0&&d<1440?d/60:null;}
const morningRt=w=>{const R=wR(w);return R.find(r=>/morning|getting up|wake/i.test(r.label||''))||R[0]||null;};
function slFlags(){const L=[];orderedWeeks().forEach(o=>wD(o.w).forEach(di=>{const n=o.w.sl[String(di)];if(slFilled(n))L.push({w:o.w,di,n,h:slHours(n)});}));
  const H=L.map(x=>x.h).filter(x=>x!=null).sort((a,b)=>a-b),med=H.length?(H.length%2?H[(H.length-1)/2]:(H[H.length/2-1]+H[H.length/2])/2):null;
  L.forEach(x=>{x.short=med!=null&&H.length>=3&&x.h!=null&&x.h<=med-1;x.broken=(num(x.n.wk)||0)>=2||(num(x.n.wm)||0)>=30;});return {L,med};}
function renderSl(){const wrap=$('#slWrap'),w=week(),t=$('#slTbl');if(!wrap)return;wrap.hidden=!(S.chk.sleep||Object.keys(w.sl).some(k=>slFilled(w.sl[k])));if(wrap.hidden)return;
  const D=wD(w),mr=morningRt(w);
  const inp=(di,f,ph,lab)=>'<input data-sd="'+di+'" data-sf="'+f+'" value="'+esc((w.sl[String(di)]||{})[f]||'')+'" placeholder="'+ph+'" aria-label="'+esc(nightLab(di)+': '+lab)+'">';
  t.innerHTML='<thead><tr><th style="width:11%">Night</th><th>Lights out</th><th>Fell asleep</th><th style="width:7%">Woke (times)</th><th style="width:8%">Awake (minutes)</th><th>Woke up for the day</th><th>Nap</th><th style="width:15%">Notes</th><th style="width:8%">Hours asleep</th><th style="width:14%">Next morning'+(mr?' ('+esc(mr.label)+')':'')+'</th></tr></thead><tbody>'+
    D.map(di=>'<tr><td class="lk">'+nightLab(di)+'</td><td>'+inp(di,'lo','8:15 pm','lights out')+'</td><td>'+inp(di,'fa','9:00 pm','fell asleep')+'</td><td>'+inp(di,'wk','0','times woke in the night')+'</td><td>'+inp(di,'wm','0','minutes awake in the night')+'</td><td>'+inp(di,'up','6:30 am','woke up for the day')+'</td><td>'+inp(di,'nap','none','nap')+'</td><td>'+inp(di,'note','','notes')+'</td><td class="num" id="slh_'+di+'"></td><td id="slm_'+di+'"></td></tr>').join('')+'</tbody>';
  slTotals();}
function slTotals(){const el=$('#slSum');if(!el)return;const w=week(),F=slFlags(),mr=morningRt(w);
  wD(w).forEach(di=>{const x=F.L.find(y=>y.w===w&&y.di===di),he=$('#slh_'+di),me=$('#slm_'+di);
    if(he)he.innerHTML=x&&x.h!=null?r1(x.h)+(x.short?' <span class="sl-flag">short</span>':'')+(x.broken?' <span class="sl-flag">broken</span>':''):(x?'<span class="hint">times not read</span>':'—');
    if(me)me.innerHTML=mr?wB(w).map(bi=>{const v=w.cells[cellKey(bi,mr.i,di)];return filled(v)?'<span class="sl-m">'+esc(shortName(S.bh[bi].name))+': '+esc(isDash(v)?'—':v)+'</span>':'';}).filter(Boolean).join(' '):'';});
  if(!F.L.length){el.innerHTML='';return;}
  const mine=F.L.filter(x=>x.w===w&&(x.short||x.broken)),mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const cmp=namedB().filter(bi=>S.bh[bi].ms!=='yn').map(bi=>{const a=[],o=[];F.L.forEach(x=>{const m=morningRt(x.w);if(!m||!wB(x.w).includes(bi))return;const v=x.w.cells[cellKey(bi,m.i,x.di)];if(!filled(v)||isDash(v))return;const q=num(v);if(q==null)return;(x.short||x.broken?a:o).push(q);});return {bi,a,o};}).filter(c=>c.a.length&&c.o.length);
  let h='<div class="metrics"><div class="metric"><b>Nights typed in</b><div class="val">'+F.L.length+'</div><div class="sub">'+F.L.filter(x=>x.w===w).length+' this week'+(F.med!=null?' · the middle night: '+r1(F.med)+' hours asleep':'')+'</div></div><div class="metric"><b>Short or broken nights</b><div class="val">'+F.L.filter(x=>x.short||x.broken).length+'</div><div class="sub">'+mine.length+' this week · against the child&rsquo;s own middle night (working convention)</div></div></div>';
  if(cmp.length)h+='<p class="hint" style="font-size:12.5px">'+cmp.map(c=>'<b>'+esc(shortName(S.bh[c.bi].name))+'</b> at the morning routine: '+r1(mean(c.a))+' on the '+c.a.length+' morning'+(c.a.length===1?'':'s')+' after a short or broken night, '+r1(mean(c.o))+' on the '+c.o.length+' other morning'+(c.o.length===1?'':'s')+'.').join(' ')+' This describes the log; it does not show that the nights cause the mornings.</p>';
  if(mine.length)h+='<div class="verdict v-mid">'+mine.length+' night'+(mine.length===1?' was':'s were')+' short or broken this week, against this child&rsquo;s own usual night (a working convention, not a sleep standard). Sleep is a medical matter: if short or broken nights go on, consider suggesting that the family talk with the child&rsquo;s doctor (BACB Ethics Code 2.12, considering medical needs; Form MS-1 keeps the medical side).</div>';
  el.innerHTML=h;}

/* ---------------- v22.53 (review I188) the note back to the family, from the week typed in ---------------- */
function fbText(w){const nm=kid()||'your child',W=orderedWeeks(),k=W.findIndex(o=>o.w===w),pw=k>0?W[k-1].w:null,mon=hdMonday(w.start);
  const L=['Hello,',''];L.push('Thank you for sending back the sheets for '+(mon?'the week of '+DAYL[0]+' '+(mon.getMonth()+1)+'/'+mon.getDate():'this week')+'. Here is what they show for '+nm+'.');L.push('');
  const unit=b=>b.ms==='dur'?'minutes':'times';
  wB(w).forEach(bi=>{const b=S.bh[bi],t=weekTotal(w,bi),N=shortName(b.name),p=pw&&wB(pw).includes(bi)?weekTotal(pw,bi):null;
    if(!t.days){L.push('- '+N+': no day was marked this week.');return;}
    let s;const D=wD(w).map(di=>dayTotal(w,bi,di)).filter(x=>x.v!=null),on=D.filter(x=>x.v>0).length;
    if(b.ms==='rate')s=N+': the average rating was '+r1(t.v)+' (0 to 3) on the '+t.days+' day'+(t.days===1?'':'s')+' you marked'+(p&&p.v!=null?'; the week before, '+r1(p.v)+'.':'.');
    else if(b.ms==='yn')s=N+': marked yes in '+t.txt+' routines you marked'+(p&&p.v!=null?'; the week before, '+p.txt+'.':'.');
    else if(!t.v)s=N+' did not happen on any of the '+t.days+' day'+(t.days===1?'':'s')+' you marked'+(p&&p.v!=null?'; the week before, '+p.txt+' '+unit(b)+'.':'.');
    else s=N+' happened on '+on+' of the '+t.days+' day'+(t.days===1?'':'s')+' you marked, '+t.txt+' '+unit(b)+' in all'+(p&&p.v!=null?'; the week before, '+p.txt+' '+unit(b)+'.':'.');
    L.push('- '+s);});
  L.push('');L.push('Thank you for keeping the sheets. Please get in touch with any questions.');
  const sig=String(S.meta.bcba||'').trim();if(sig){L.push('');L.push(sig);}
  return L.join('\n');}

/* ---------------- the home sheets ---------------- */
function kid(){return S.meta.nick||S.meta.client||'';}
/* v22.53 (review F373) the family's lines carry no form numbers: "(Form CR-1)" means nothing at home */
const famText=s=>String(s==null?'':s).replace(/\s*\((?:see\s+)?Forms?\s+[A-Z]{2,3}-\d+[^)]*\)/gi,'').replace(/[;,]\s*$/,'').trim();
function hsHead(title,who){return '<div class="hs-title">'+esc(title)+'</div><div class="hs-who"><span>Child: <span class="bl">'+esc(kid())+'</span></span><span>Week of: <span class="bl" style="min-width:120px">'+esc(S.meta.sh_week||'')+'</span></span><span>Filled in by: <span class="bl">'+esc(who||'')+'</span></span></div>';}
/* v22.53 (review F374) baseline sheets carry no plan lines */
function hsPlan(){if(S.chk.base)return '<p class="hs-line"><b>When a behavior happens:</b> Respond the way you usually do; keep everyone safe. Mark the sheet after.</p>';
  const lines=[];S.bh.forEach(b=>{if(b.name&&b.todo)lines.push('<p class="hs-line"><b>If '+esc(b.name.toLowerCase())+' happens:</b> '+esc(famText(b.todo))+'</p>');});if(S.meta.todo)lines.push('<p class="hs-line"><b>When a behavior happens:</b> '+esc(famText(S.meta.todo))+'</p>');return lines.join('');}
/* v22.53 (review F373, I190) a fixed safety line first, then the plan lines; the family's choice; "Tell us the next
   school day if" in place of "Call right away if" */
const HS_SAFE='<p class="hs-safe"><b>If anyone is hurt or in danger, call 911 or your child&rsquo;s doctor.</b> Then let us know.</p>';
const HS_CHOICE='<p class="hs-choice">Keeping this sheet is your choice. You can stop at any time; it will not change your child&rsquo;s services.</p>';
function hsFoot(){const f=S.meta.freq?'Send the sheet back: '+esc(S.meta.freq.toLowerCase())+(S.meta.ret_how?', '+esc(S.meta.ret_how.toLowerCase())+(retPhoto()&&String(S.meta.ret_to||'').trim()?' ('+esc(famText(S.meta.ret_to))+')':''):'')+'.':'';
  return '<div class="hs-end">'+HS_SAFE+hsPlan()+'<div class="hs-tail"><div class="hs-sig"><span>Signed: <span class="bl"></span></span><span>Date: <span class="bl" style="min-width:110px"></span></span></div>'+HS_CHOICE+'<div class="hs-foot"><span>'+f+(S.meta.call?' Questions? Call '+esc(famText(S.meta.call))+'.':'')+(S.meta.urgent?' Tell us the next school day if '+esc(famText(S.meta.urgent))+'.':'')+'</span><span>Form HD-1</span></div></div></div>';}
function cellMark(ms){return ms==='yn'?'Y &nbsp; N':ms==='dur'?'___ min':ms==='rate'?'0 1 2 3':'';}
/* v22.53 (review F369) the example row writes 0 on a day it did not happen and a dash on a day the routine did not */
function exMark(ms,di){const t=['||','|','0','|||','|','—','||'],d=['5','0','0','12','3','—','8'],r=['1','0','0','3','1','—','2'],y=['Y','N','N','Y','Y','—','N'];return ms==='yn'?y[di]:ms==='dur'?(d[di]==='—'?'—':d[di]+' min'):ms==='rate'?r[di]:t[di];}
function exTotal(ms){return ms==='yn'?'3 Y':ms==='dur'?'28 min':ms==='rate'?'no total':'9';}
/* v22.53 (review F377) what to mark, with the rule for marking it */
function hsHow(b){const one=famText(b.one),st=famText(b.st),en=famText(b.en),r0=famText(b.r0),r3=famText(b.r3);
  if(b.ms==='tally')return 'make one mark (|) each time it happens.'+(one?' One time is: '+esc(one)+'.':'')+' Write 0 if it did not happen.';
  if(b.ms==='yn')return 'circle Y if it happened at all, N if it did not.';
  if(b.ms==='dur')return 'write how many minutes it lasted, all together.'+(st?' It starts when '+esc(st)+(en?', and ends when '+esc(en):'')+'.':en?' It ends when '+esc(en)+'.':'')+' Write 0 if it did not happen.';
  return 'circle one number. '+(r0||r3?'0 means '+esc(r0||'none')+'; 1 and 2 are in between; 3 means '+esc(r3||'a lot')+'.':'0 none, 1 a little, 2 some, 3 a lot.');}
const hsRtNote=r=>r.note?'<br><span class="hs-note">'+esc(famText(r.note))+'</span>':'';   /* v22.53 (review F376) */
function renderSheets(){
  const out=$('#sheetOut'),D=dayIdx(),R=rtOn(),B=S.bh.filter(b=>b.name);const who=S.meta.cg||'';let h='';
  if(!B.length){out.innerHTML='<p class="hint" style="padding:14px">Name a behavior on the Setup page and tick the sheets to send; they appear here.</p>';renderCost();return;}
  const dayHead=D.map(di=>'<th>'+DAYS[di]+'</th>').join('');
  if(S.chk.tally){
    h+='<div class="hs" data-sheet="tally">'+hsHead('Home Tally Sheet',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>At the end of each routine, find its row and the day&rsquo;s column.</li>'+
      B.map(b=>'<li><b>'+esc(b.name)+':</b> '+hsHow(b)+(b.ex?' Counts: '+esc(famText(b.ex))+'.':'')+(b.nex?' Does not count: '+esc(famText(b.nex))+'.':'')+'</li>').join('')+
      '<li>If a routine did not happen that day (no outing, no homework), draw a line (&mdash;) in its box.</li>'+
      '<li>If you forget to mark a routine, leave it blank. A blank is better than a guess.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:14%">Behavior</th><th style="width:16%">Routine</th>'+dayHead+'<th style="width:8%">Total</th></tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example</td><td class="sub">'+esc(R[0]?R[0].label:'Morning')+'</td>'+D.map(di=>'<td>'+esc(exMark(B[0].ms,di))+'</td>').join('')+'<td>'+exTotal(B[0].ms)+'</td></tr>'+
      B.map(b=>R.map((r,k)=>'<tr>'+(k===0?'<td class="lab" rowspan="'+R.length+'">'+esc(b.name)+'</td>':'')+'<td class="sub">'+esc(r.label)+(r.time?'<br><span style="font-size:11.5px;color:#444;line-height:1.2;display:inline-block">'+esc(r.time)+'</span>':'')+hsRtNote(r)+'</td>'+D.map(()=>'<td class="hc">'+cellMark(b.ms)+'</td>').join('')+(k===0?(b.ms==='rate'?'<td class="tot na" rowspan="'+R.length+'">no total</td>':'<td class="tot" rowspan="'+R.length+'"></td>'):'')+'</tr>').join('')).join('')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  if(S.chk.check){
    const steps=S.sk.filter(s=>s.label);const groups=R.map(r=>({r,st:steps.filter(s=>s.rt===''||String(s.rt)===String(r.i))})).filter(g=>g.st.length);
    h+='<div class="hs" data-sheet="check">'+hsHead('Routine Checklist',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>After each routine, read the steps under it.</li><li>Circle <b>Y</b> if the step happened, <b>N</b> if it did not. &ldquo;Adult&rdquo; steps are the ones you do; &ldquo;Child&rdquo; steps are the ones '+esc(kid()||'your child')+' does.</li><li>If the routine did not happen that day, draw a line (&mdash;) across its boxes.</li><li>An N is not a bad mark. It tells us which steps are hard to fit in, so we can change them.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:40%">Step</th>'+dayHead+'</tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example: '+esc(steps[0]?steps[0].label:'Show the picture schedule')+' (Adult)</td>'+D.map(di=>'<td>'+['Y','Y','N','N','Y','—','Y'][di]+'</td>').join('')+'</tr>'+
      (groups.length?groups.map(g=>'<tr class="grp"><td colspan="'+(D.length+1)+'">'+esc(g.r.label)+(g.r.time?' <span style="font-weight:400;font-size:13px">('+esc(g.r.time)+')</span>':'')+(g.r.note?' <span class="hs-note">'+esc(famText(g.r.note))+'</span>':'')+'</td></tr>'+g.st.map(s=>'<tr><td class="sub">'+esc(s.label)+' <span style="color:#444;font-size:13px">('+esc(s.who)+')</span></td>'+D.map(()=>'<td class="hc">Y &nbsp; N</td>').join('')+'</tr>').join('')).join(''):'<tr><td colspan="'+(D.length+1)+'" class="sub">(No steps yet: add them on the Setup page.)</td></tr>')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  if(S.chk.abc){
    const n=Math.max(1,Math.min(6,num(S.meta.sh_abc)||3)),A=abcA(),C=abcC();const cx=Math.max(0,C.findIndex(x=>/privilege/i.test(x)));
    const block=(ex)=>'<div class="abc'+(ex?' ex':'')+'"><div class="abc-head">'+(ex?'<span><b>Example</b></span>':'')+'<span>Date: <span class="bl">'+(ex?'Tue':'')+'</span></span><span>Time: <span class="bl" style="min-width:80px">'+(ex?'5:40 pm':'')+'</span></span><span>Routine: <span class="bl">'+(ex?esc(R[0]?R[0].label:'Dinner'):'')+'</span></span></div>'+
      '<div class="abc-cols"><div><b>Before: what was happening?</b>'+A.map((a,i)=>'<div class="it"><span class="bx">'+(ex&&i===0?'&#10003;':'')+'</span>'+esc(a)+'</div>').join('')+'</div>'+
      '<div><b>What '+esc(kid()||'the child')+' did</b>'+B.map((b,i)=>'<div class="it"><span class="bx">'+(ex&&i===0?'&#10003;':'')+'</span>'+esc(b.name)+'</div>').join('')+'<div class="it" style="margin-top:6px">How long or how many: <u>'+(ex?'&nbsp;2 times&nbsp;':'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+'</u></div></div>'+
      '<div><b>After: what happened next?</b>'+C.map((c,i)=>'<div class="it"><span class="bx">'+(ex&&i===cx?'&#10003;':'')+'</span>'+esc(c)+'</div>').join('')+'</div></div>'+
      '<div class="abc-free">In a few words: <span class="bl">'+(ex?'Asked him to turn off the tablet for dinner. He hit his brother twice. I took the tablet and sat him at the table.':'')+'</span></div></div>';
    h+='<div class="hs" data-sheet="abc">'+hsHead('ABC Notes: What Happened Before and After',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>Use one box each time a behavior on the list happens and you have a minute afterward.</li><li>Tick what was going on just before, what '+esc(kid()||'your child')+' did, and what happened right after. Tick only what you saw happen; tick more than one if you need to.</li><li>Write one line in your own words. You do not have to explain why.</li></ol></div>'+
      block(true)+Array.from({length:n},()=>block(false)).join('')+hsFoot()+'</div>';
  }
  if(S.chk.sleep){
    h+='<div class="hs" data-sheet="sleep">'+hsHead('Sleep Log',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>Each morning, fill in the row for the night just finished (on Monday, &ldquo;Sun night &rarr; Mon&rdquo;). Your best guess is fine.</li><li><b>Lights out</b> is when the room went dark. <b>Fell asleep</b> is about when '+esc(kid()||'your child')+' was asleep.</li><li><b>Woke in the night</b>: how many times, and about how long in all. Write 0 if none.</li><li><b>Nap</b>: how long, if there was one that day. <b>Notes</b>: sick, late dinner, a hard evening, anything you noticed.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:19%">Night</th><th>Lights out</th><th>Fell asleep</th><th style="width:17%">Woke in the night<br><span style="font-weight:400;font-size:13px">times / how long</span></th><th>Woke up for the day</th><th>Nap</th><th style="width:18%">Notes</th></tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example</td><td>8:15 pm</td><td>9:00 pm</td><td>1 time / 20 min</td><td>6:30 am</td><td>none</td><td class="sub">Cousins visited; late dinner</td></tr>'+
      D.map(di=>'<tr class="slr"><td class="lab night">'+nightLab(di)+'</td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td></tr>').join('')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  out.innerHTML=h||'<p class="hint" style="padding:14px">Tick at least one sheet on the Setup page.</p>';
  renderCost();
}
/* v22.53 (review I189) what the sheets ask of the family each week, and about how many pages they print: each sheet is
   laid out at the printed width (7.5 inches inside half-inch margins) and measured against a 10-inch page */
function sheetCost(){const D=dayIdx(),R=rtOn(),B=S.bh.filter(b=>b.name),c={d:D.length,r:R.length,b:B.length};
  c.tally=S.chk.tally?B.length*R.length*D.length:0;c.steps=S.chk.check?R.reduce((s,r)=>s+ckSteps(r.i).length,0):0;c.check=c.steps*D.length;
  c.sleep=S.chk.sleep?D.length:0;c.abc=!!S.chk.abc;c.marks=c.tally+c.check;return c;}
/* a sheet's pages as the printer lays them out: what does not break (a table row, an ABC box, a line under the sheet,
   the signature and footer) moves whole to the next page, where a table's header row repeats */
function hsPages(hs,sc){const T=hs.getBoundingClientRect().top,A=[],add=(el,th)=>{const r=el.getBoundingClientRect();A.push({t:(r.top-T)/sc,b:(r.bottom-T)/sc,th:th||0});};
  [...hs.children].forEach(c=>{if(c.tagName==='TABLE'){const th=c.tHead?c.tHead.getBoundingClientRect().height/sc:0;[...c.rows].forEach(tr=>add(tr,tr.parentNode.tagName==='TBODY'?th:0));}
    else if(c.classList.contains('hs-end'))[...c.children].forEach(x=>add(x));else add(c);});
  let n=1,s=0;A.forEach(a=>{if(a.b-s>962){n++;s=a.t-a.th;while(a.b-s>962){n++;s+=960;}}});return n;}   /* the screen lays a sheet out about 2px taller than the printer */
function sheetPages(){const out=$('#sheetOut');if(!out)return null;const hs=$$('.hs',out);if(!hs.length)return null;
  const sec=out.closest('section'),hid=!out.offsetParent,st0=sec?sec.getAttribute('style'):null;let P=null;
  try{if(hid&&sec)sec.setAttribute('style','display:block;position:absolute;left:-99999px;top:0;width:12in;visibility:hidden');out.classList.add('hd-measure');
    const sc=out.getBoundingClientRect().width/720;   /* the page may be shown zoomed (Fit) */
    if(sc>0&&hs.every(x=>x.getBoundingClientRect().height>0))P=hs.map(x=>({k:x.dataset.sheet||'',n:hsPages(x,sc)}));}
  catch(e){P=null;}finally{out.classList.remove('hd-measure');if(hid&&sec){if(st0==null)sec.removeAttribute('style');else sec.setAttribute('style',st0);}}
  return P;}
const SH_LOW={tally:'the tally sheet',check:'the checklist',abc:'the ABC notes',sleep:'the sleep log'};
function renderCost(){const c=sheetCost(),a=$('#hdCost'),b=$('#hdCostS');if(!a&&!b)return;
  if(!c.marks&&!c.sleep&&!c.abc){if(a)a.innerHTML='';if(b)b.innerHTML='';return;}
  const parts=[];if(c.tally)parts.push(c.tally+' on the tally sheet ('+c.b+' behavior'+(c.b===1?'':'s')+' &times; '+c.r+' routine'+(c.r===1?'':'s')+' &times; '+c.d+' day'+(c.d===1?'':'s')+')');
  if(c.check)parts.push(c.check+' on the checklist ('+c.steps+' step'+(c.steps===1?'':'s')+' under the routines &times; '+c.d+' day'+(c.d===1?'':'s')+')');
  let t='<b>Each week the sheets ask the family for '+c.marks+' mark'+(c.marks===1?'':'s')+'</b>'+(parts.length?': '+parts.join(', '):'')+(c.sleep?(parts.length?'; ':': ')+'a row of six boxes for each of '+c.sleep+' night'+(c.sleep===1?'':'s')+' on the sleep log':'')+(c.abc?'; and an ABC note each time something happens':'')+'.';
  const warn=c.marks>70?' <b>That is more than 70 marks a week</b> (a working convention: twice the guide&rsquo;s 35 for one behavior across five routines and seven days). Ask for less than you want: fewer behaviors, routines, days or steps, or the checklist on alternate weeks.':'';
  const P=sheetPages(),pg=P?P.reduce((s,x)=>s+x.n,0):0;
  const pages=P?' They print on about '+pg+' page'+(pg===1?'':'s')+(P.length>1?' ('+P.map(x=>SH_LOW[x.k]+' '+x.n).join(', ')+')':'')+'.':'';
  const html=t+warn+pages,cls=warn?'v-mid':'v-ok';
  if(a)a.innerHTML='<div class="verdict '+cls+' hd-cost">'+html+'</div>';if(b)b.innerHTML='<div class="verdict '+cls+' hd-cost">'+html+'</div>';}

/* ---------------- setup verdict ---------------- */
/* v22.37 (review F368): a photo of a sheet is a student record on a phone. It goes to a district number or a district
   email only, is saved to the district drive and deleted from the phone once typed in; the Setup page says so when a
   photo is chosen. Earlier files' "by text message" and "by email" read as the district choices. */
const RET_OLD={'A photo of the sheet by text message':'A photo of the sheet, texted to a district phone number','A photo of the sheet by email':'A photo of the sheet, emailed to a district email address'};
const retPhoto=()=>/^A photo/.test(S.meta.ret_how||'');
function renderRetNote(){const el=$('#hdRetNote');if(el)el.innerHTML=retPhoto()?'<div class="verdict v-mid" style="margin-top:6px"><b>A photo of the sheet is a student record.</b> Use a district phone number or a district email only, never a personal phone. Save the photo to the district drive, and delete it from the phone and the email once it is typed in.</div>':'';}
/* v22.53 (review F377) a rating for a behavior that has a clear start and can be counted or timed */
const COUNTABLE=/\b(hit|hits|hitting|kick|kicks|kicking|bit|bite|bites|biting|throw|throws|throwing|threw|spit|spits|spitting|scratch\w*|push\w*|pinch\w*|slap\w*|punch\w*|hair[- ]pull\w*|swear\w*|curs\w*|elop\w*|ran off|runs? off|running off|bang\w*)\b/i;
const TB_DIM_OK=d=>!d||/^count|^duration|% of opportunities/i.test(d);
function renderSetup(){
  const m=S.meta,out=[];const B=S.bh.filter(b=>b.name);renderRetNote();renderTbNote();renderConsentNote();
  if(!B.length)out.push('Name at least one behavior in the family&rsquo;s words.');
  B.forEach(b=>{const s=tbSnap(b),N='<b>'+esc(b.name)+'</b>';
    if(!b.ex||!b.nex)out.push(N+' needs an example and a non-example, or two people will mark it differently.'+(s&&s.d&&!b.ex?' It came from Form TB-1 with a definition and no example in plain words: write one from TB-1&rsquo;s definition (shown in the box).':''));
    if(!S.chk.base&&!b.todo&&!m.todo)out.push(N+' has no line from the plan; the family will ask what to do when it happens.');
    if(b.ms==='tally'&&!b.one)out.push(N+': say what one time is (three quick hits: one or three?).');
    if(b.ms==='dur'&&(!b.st||!b.en))out.push(N+': say when it starts and when it ends, or two people will time it differently.');
    if(b.ms==='rate'&&(!b.r0||!b.r3))out.push(N+': say what 0 and what 3 mean for this behavior.');
    if(b.ms==='rate'&&COUNTABLE.test(b.name))out.push(N+' is rated 0 to 3, the least precise measure; a behavior with a clear start and end is better counted or timed (the guide: a rating is for behaviors that resist counting).');
    if(s&&s.m&&!TB_DIM_OK(s.m)&&b.ms==='tally')out.push('Form TB-1 measures '+N+' by '+esc(s.m.toLowerCase())+'; the home sheet asks for a tally. Choose the home measure that matches the school&rsquo;s.');});
  if(!S.chk.base&&nbhHdTodoTD&&String(m.todo||'').trim()===nbhHdTodoTD)out.push('The line for what to do when a behavior happens came from Form TD-1, written for school staff: put it in the family&rsquo;s words before the sheets go home.');
  if(S.chk.base&&S.chk.check)out.push('Baseline sheets with the routine checklist: the checklist asks about plan steps, and a baseline has none yet. Leave it off until the plan starts, or list only what the family already does.');
  if(B.length>4)out.push('More than four behaviors on one sheet is more than most families return; split the sheet or drop one.');
  if(!rtOn().length)out.push('No routine is ticked for the sheets.');
  if(S.chk.check&&!S.sk.some(s=>s.label))out.push('The checklist is ticked but has no steps.');
  if(!m.freq||!m.ret_how)out.push('Say how often the sheet comes back and how; it prints on the sheet.');
  if(retPhoto()&&!String(m.ret_to||'').trim())out.push('Name the district number or email the photo goes to; it prints on the sheet. A personal phone is not a place for a student record.');
  if(!m.call)out.push('Say who to call; it prints on the sheet.');
  if(/911|right away|immediately|emergenc/i.test(m.urgent||''))out.push('&ldquo;Tell us the next school day if&rdquo; is for what can wait for the school; every sheet already says to call 911 or the child&rsquo;s doctor if anyone is hurt or in danger.');
  if(!m.taught)out.push('Plan how the family is taught the sheet (one practice day together, as a working convention).');
  if(!String(m.agreed||'').trim())out.push('Record when and how the family agreed to keep the sheets (BACB Ethics Code 2.09 and 2.11); the sheet tells them it is their choice.');
  $('#setupVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':(m.client?'<div class="verdict v-ok"><b>Ready to print.</b> The Home sheets page shows what the family will hold.</div>':'');
  renderCost();
}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.e!==undefined){const w=week();w.cells[el.dataset.e]=el.value;if(filled(el.value))freeze(w);updateTotals();return;}
  if(el.dataset.an!==undefined&&el.dataset.af!==undefined){const w=week(),n=w.abc[+el.dataset.an];if(!n)return;n[el.dataset.af]=el.value;freeze(w);abcTotals();return;}
  if(el.dataset.sd!==undefined){const w=week(),k=el.dataset.sd;if(!w.sl[k])w.sl[k]=mkSl();w.sl[k][el.dataset.sf]=el.value;freeze(w);slTotals();drawEnt();return;}
  if(el.dataset.w!==undefined&&el.type!=='checkbox'){week()[el.dataset.w]=el.value;renderWkSel();if(el.dataset.w!=='fb'&&el.dataset.w!=='note')renderEntTotals();return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'&&el.tagName!=='SELECT'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='ag'){const tr=el.closest('tr'),c=tr&&tr.querySelector('.agv');if(c)c.innerHTML=agCell(S.ag[+el.dataset.i]);renderAgM();}
    else{renderSheetsSoon();if(el.dataset.r==='bh'||el.dataset.r==='rt'||el.dataset.r==='sk')renderEntSoon();}
    return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(nick|client|cg|todo|call|urgent|abc_|sh_|ret_|agreed)/.test(el.dataset.m))renderSheetsSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.e!==undefined){const w=week();if(isDash(el.value)&&el.value!=='—'){el.value='—';}w.cells[el.dataset.e]=el.value;if(filled(el.value))freeze(w);updateTotals();return;}
  if(el.dataset.k!==undefined){const w=week();w.ck[el.dataset.k]=el.value;if(!el.value)delete w.ck[el.dataset.k];else freeze(w);const td=el.closest('td');if(td)td.classList.toggle('na',el.value==='—');ckTotals();drawEnt();return;}
  if(el.dataset.an!==undefined){const w=week(),n=w.abc[+el.dataset.an];if(!n)return;
    if(el.dataset.ag){const L=n[el.dataset.ag],v=el.value;const at=L.indexOf(v);if(el.checked&&at<0)L.push(v);else if(!el.checked&&at>=0)L.splice(at,1);}else if(el.dataset.af)n[el.dataset.af]=el.value;
    freeze(w);abcTotals();return;}
  if(el.dataset.sd!==undefined)return;
  if(el.dataset.w==='start'){fixStart(week());renderWkSel();renderEntTotals();return;}
  if(el.dataset.w!==undefined&&el.type==='checkbox'){week()[el.dataset.w]=el.checked;if(/^ns_check$/.test(el.dataset.w))ckTotals();renderEntTotals();return;}
  if(el.dataset.w==='cond'){week().cond=el.value;renderWkSel();renderEntTotals();return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){const v=el.type==='checkbox'?el.checked:el.value;S[el.dataset.r][+el.dataset.i][el.dataset.f]=v;
    if(el.dataset.r==='ag'){renderAg();renderAgM();return;}
    if(el.dataset.r==='bh'&&el.dataset.f==='ms'){renderB();renderEnt();renderAg();}
    if(el.dataset.r==='rt'){renderK();renderAg();renderEnt();}
    if(el.dataset.r==='sk')renderEnt();
    renderSheets();renderSetup();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderSheets();renderSetup();renderEnt();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderSheets();renderSetup();if(el.dataset.m==='sh_days')renderEnt();}
});
/* v22.53 (review F370) a start that is not a Monday is moved to that week's Monday, and the page says so */
let wkStartSet='';   /* the Monday the last notice put in the box: its own change event leaves the notice up */
function fixStart(w){const t=String(w.start||'').trim(),el=$('#wkStartNote');let msg='';
  if(t&&t===wkStartSet)return;wkStartSet='';
  if(t){const d=hdDate(t),m=hdMonday(t);
    if(!d)msg='&ldquo;'+esc(t)+'&rdquo; is not read as a date. Type the Monday the sheets start, as 9/14/26.';
    else if(d.getDay()!==1){const y=mdY(m);msg=esc(t)+' is a '+DAYL[(d.getDay()+6)%7]+'; the week of Monday '+y+' is used.';w.start=y;wkStartSet=y;const inp=$('[data-w="start"]');if(inp)inp.value=y;}}
  if(el)el.innerHTML=msg?'<div class="verdict v-mid" role="status">'+msg+'</div>':'';}
/* v22.53 (review F369) a tap marks a routine that did not happen, while the button is on (the number pad has no dash) */
let dashOn=false;
document.addEventListener('pointerdown',e=>{if(!dashOn)return;const el=e.target.closest&&e.target.closest('[data-e],[data-k]');if(!el)return;e.preventDefault();
  const v=isDash(el.value)?'':'—';if(el.tagName==='SELECT'){el.value=v;}else el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));});
$('#dashMode').addEventListener('click',()=>{dashOn=!dashOn;$('#dashMode').setAttribute('aria-pressed',String(dashOn));});
let shT=0,enT=0;function renderSheetsSoon(){clearTimeout(shT);shT=setTimeout(()=>{renderSheets();renderSetup();},250);}function renderEntSoon(){clearTimeout(enT);enT=setTimeout(()=>{renderEnt();renderAg();},400);}
$('#addB').addEventListener('click',()=>{if(S.bh.length>=6)return;S.bh.push(mkBh());renderB();renderAg();renderEnt();renderSheets();renderSetup();});
$('#delB').addEventListener('click',async ()=>{if(S.bh.length<=1)return;const i=S.bh.length-1,r=S.bh[i];if((r.name||r.ex)&&!(await nbhUI.confirm('Remove the last behavior?\nIts name, examples and the cells recorded for it are deleted.',{ok:'Remove',danger:true})))return;
  S.bh.pop();rekeyCells('b',i);S.ag=S.ag.filter(a=>String(a.bh)!==String(i));renderB();renderAg();renderEnt();renderSheets();renderSetup();});
$('#addR').addEventListener('click',()=>{if(S.rt.length>=10)return;S.rt.push({label:'',time:'',on:true,note:''});renderR();renderK();renderAg();renderEnt();renderSheets();});
$('#delR').addEventListener('click',async ()=>{if(S.rt.length<=1)return;const i=S.rt.length-1,r=S.rt[i];if(r.label&&!(await nbhUI.confirm('Remove the last routine?\nIts label and the cells recorded for it are deleted.',{ok:'Remove',danger:true})))return;
  S.rt.pop();rekeyCells('r',i);[S.sk,S.ag].forEach(L=>L.forEach(o=>{if(String(o.rt)===String(i))o.rt='';}));renderR();renderK();renderAg();renderEnt();renderSheets();});
$('#addK').addEventListener('click',()=>{if(S.sk.length>=12)return;S.sk.push({label:'',who:'Adult',rt:''});renderK();renderSheets();});
$('#delK').addEventListener('click',async ()=>{if(S.sk.length<=1)return;const i=S.sk.length-1,r=S.sk[i];if(r.label&&!(await nbhUI.confirm('Remove the last step?\nThe checklist step is deleted.',{ok:'Remove',danger:true})))return;S.sk.pop();rekeyCells('k',i);renderK();renderEnt();renderSheets();renderSetup();});
$('#addAg').addEventListener('click',()=>{S.ag.push(mkAg());renderAg();renderAgM();});
$('#delAg').addEventListener('click',async ()=>{if(!S.ag.length)return;const r=S.ag[S.ag.length-1];if((r.date||r.staff)&&!(await nbhUI.confirm('Remove the last check?\nThe agreement check and its two counts are deleted.',{ok:'Remove',danger:true})))return;S.ag.pop();renderAg();renderAgM();});
$('#addAbc').addEventListener('click',()=>{const w=week();if(w.abc.length>=40)return;w.abc.push(mkAbc());freeze(w);renderAbc();});
/* the week cells are keyed b<behavior>_r<routine>_d<day>, the checklist marks k<step>_r<routine>_d<day>, the checklist
   steps, agreement checks and ABC notes by routine and behavior index, and each week's design (dz) by index, so a deletion
   drops the dependent cells and re-keys the rest instead of letting them shift */
function cellCount(part,i){let n=0;S.wk.forEach(w=>{Object.keys(w.cells).forEach(k=>{const m=/^b(\d+)_r(\d+)_d\d$/.exec(k);if(m&&+m[part==='b'?1:2]===i&&filled(w.cells[k]))n++;});
  if(part==='r')Object.keys(w.ck||{}).forEach(k=>{const m=/^k\d+_r(\d+)_d\d$/.exec(k);if(m&&+m[1]===i&&filled(w.ck[k]))n++;});});return n;}
function rekeyCells(part,i){const fix=a=>a.filter(x=>x!==i).map(x=>x>i?x-1:x);
  S.wk.forEach(w=>{
    if(part==='b'||part==='r'){const c={};Object.keys(w.cells).forEach(k=>{const m=/^b(\d+)_r(\d+)_(d\d)$/.exec(k);if(!m){c[k]=w.cells[k];return;}let b=+m[1],r=+m[2];if(part==='b'){if(b===i)return;if(b>i)b--;}else{if(r===i)return;if(r>i)r--;}c['b'+b+'_r'+r+'_'+m[3]]=w.cells[k];});w.cells=c;}
    if(part==='r'||part==='k'){const c={};Object.keys(w.ck||{}).forEach(k=>{const m=/^k(\d+)_r(\d+)_(d\d)$/.exec(k);if(!m){c[k]=w.ck[k];return;}let s=+m[1],r=+m[2];if(part==='k'){if(s===i)return;if(s>i)s--;}else{if(r===i)return;if(r>i)r--;}c['k'+s+'_r'+r+'_'+m[3]]=w.ck[k];});w.ck=c;}
    if(w.dz){if(part==='b')w.dz.bh=fix(w.dz.bh);if(part==='r')w.dz.rt=fix(w.dz.rt);}
    (w.abc||[]).forEach(n=>{if(part==='b')n.b=n.b.filter(x=>+x!==i).map(x=>String(+x>i?+x-1:+x));if(part==='r'&&n.rt!==''){const v=+n.rt;n.rt=v===i?'':String(v>i?v-1:v);}});});}
async function rowDel(r,i){
  if(r==='abc'){const w=week(),n=w.abc[i];if(!n)return;if((n.time||n.txt||n.amt||n.a.length||n.b.length||n.c.length)&&!(await nbhUI.confirm('Delete this ABC note?\nWhat was typed in for it is deleted.',{ok:'Delete',danger:true})))return;w.abc.splice(i,1);renderAbc();renderEntTotals();return;}
  const row=S[r]&&S[r][i];if(!row)return;
  if(r==='bh'){const cells=cellCount('b',i),ag=S.ag.filter(a=>String(a.bh)===String(i)).length;
    if((row.name||row.ex||row.nex||row.todo||cells||ag)&&!(await nbhUI.confirm('Delete this behavior?'+(cells?'\nIts '+cells+' typed-in cell'+(cells===1?'':'s')+' in the week grids will be removed.':'')+(ag?' '+ag+' agreement check'+(ag===1?'':'s')+' for it will be removed.':'')+(cells||ag?' Later behaviors move up.':''),{ok:'Delete',danger:true})))return;
    S.bh.splice(i,1);rekeyCells('b',i);S.ag=S.ag.filter(a=>String(a.bh)!==String(i));S.ag.forEach(a=>{if(a.bh!==''&&+a.bh>i)a.bh=String(+a.bh-1);});
    if(!S.bh.length)S.bh.push(mkBh());renderB();renderAg();renderEnt();renderSheets();renderSetup();}
  else if(r==='rt'){const cells=cellCount('r',i),sk=S.sk.filter(s=>String(s.rt)===String(i)).length;
    if((row.label||row.note||cells||sk)&&!(await nbhUI.confirm('Delete this routine?'+(cells?'\nIts '+cells+' typed-in cell'+(cells===1?'':'s')+' in the week grids will be removed.':'')+(sk?' '+sk+' checklist step'+(sk===1?'':'s')+' tied to it will apply to every routine.':'')+(cells||sk?' Later routines move up.':''),{ok:'Delete',danger:true})))return;
    S.rt.splice(i,1);rekeyCells('r',i);const rk=o=>{if(o.rt===''||o.rt==null)return;const v=+o.rt;if(v===i)o.rt='';else if(v>i)o.rt=String(v-1);};S.sk.forEach(rk);S.ag.forEach(rk);
    if(!S.rt.length)S.rt.push({label:'',time:'',on:true,note:''});renderR();renderK();renderAg();renderEnt();renderSheets();renderSetup();}
  else if(r==='sk'){if(row.label&&!(await nbhUI.confirm('Delete this row?\nThe checklist step it holds is deleted.',{ok:'Delete',danger:true})))return;S.sk.splice(i,1);rekeyCells('k',i);if(!S.sk.length)S.sk.push({label:'',who:'Adult',rt:''});renderK();renderEnt();renderSheets();renderSetup();}
  else if(r==='ag'){if((row.date||row.staff||row.home||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe agreement check it holds is deleted.',{ok:'Delete',danger:true})))return;S.ag.splice(i,1);renderAg();renderAgM();}
}
$('#wkSel').addEventListener('change',e=>{curWk=+e.target.value;bindWeek();renderEnt();});
/* v22.53 a new week starts the Monday after the last dated week, in the condition the last week ended in (Baseline on
   baseline sheets) */
$('#addWk').addEventListener('click',()=>{if(S.wk.length>=26)return;const w=newWeek(),W=orderedWeeks(),last=W.filter(o=>o.d).pop(),pw=W.length?W[W.length-1].w:null;
  if(last)w.start=mdY(addDays(last.d,7));w.cond=S.chk.base?'Baseline':pw&&pw.cond?(pw.cond==='Plan changed'?'Plan':pw.cond):'';
  S.wk.push(w);curWk=S.wk.length-1;renderWkSel();bindWeek();renderEnt();});
$('#delWk').addEventListener('click',async ()=>{if(S.wk.length<=1){if(await nbhUI.confirm('Clear this week?\nEverything typed into the week grid is removed.',{ok:'Clear',danger:true})){S.wk[0]=newWeek();renderWkSel();bindWeek();renderEnt();}return;}const k=curWk;if(!(await nbhUI.confirm('Remove week '+(k+1)+'?\nEverything typed into it is deleted.',{ok:'Remove',danger:true})))return;S.wk.splice(k,1);curWk=Math.max(0,k-1);renderWkSel();bindWeek();renderEnt();});
document.addEventListener('click',async e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest('#wkUseCur')){if(!(await nbhUI.confirm('Use the current Setup for this week?\nThe grid takes the days, routines and behaviors on Setup now. Marks typed in for anything Setup no longer has stay in the file but are left out.',{ok:'Use Setup'})))return;week().dz=curDesign();renderEnt();return;}
  if(t.closest('#fbWrite')){const w=week(),ta=$('[data-w="fb"]');if(String(w.fb||'').trim()&&!(await nbhUI.confirm('Write the note again?\nThe note for this week is replaced; what you changed in it is lost.',{ok:'Write it again'})))return;
    w.fb=fbText(w);if(ta)ta.value=w.fb;$('#fbMsg').textContent='Written from the numbers for this week. Read it over before it goes home.';return;}
  if(t.closest('#fbCopy')){const ta=$('[data-w="fb"]'),v=ta?ta.value:'';if(!v.trim()){$('#fbMsg').textContent='There is no note to copy yet.';return;}
    let ok=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(v);ok=true;}}catch(err){ok=false;}
    if(!ok){try{ta.focus();ta.select();ok=document.execCommand('copy');}catch(err){ok=false;}}
    $('#fbMsg').textContent=ok?'Copied. Paste it into the district email or the folder note.':'Select the note and copy it.';return;}
  if(t.closest('#hdTbUpd')){tbApply();return;}
  if(t.closest('#hdTbLater')){nbhHdTbLater=tbSig(tbOffers());renderTbNote();return;}
});

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();renderB();renderR();renderK();renderAg();renderWkSel();bindWeek();renderEnt();renderSheets();renderSetup();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
/* v22.53 (review F373) the family's copy prints without the record's page header and footer ("Confidential student
   record. Retain in the student's behavior file.", the student's ID, the page numbers): only the sheet's own footer */
const HD_SHEET_PAGE='@media print{@page{size:letter portrait;margin:0.5in;@top-left{content:none}@top-center{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-center{content:none}@bottom-right{content:none}}}';
$('#sheetPrintBtn').addEventListener('click',()=>{if(!S.bh.some(b=>b.name)||!$('#sheetOut .hs')){alert('Name a behavior and tick a sheet on the Setup page first; there is nothing to print yet.');return;}
  document.body.classList.add('hd-sheets-only');
  const st=document.createElement('style');st.id='hdSheetPage';st.textContent=HD_SHEET_PAGE;document.head.appendChild(st);
  /* last in the page: after the student's name and the page numbers the print adds as it starts, so those are blanked too */
  const last=()=>{document.head.appendChild(st);};
  const off=()=>{document.body.classList.remove('hd-sheets-only');st.remove();window.removeEventListener('afterprint',off);window.removeEventListener('beforeprint',last);};
  window.addEventListener('beforeprint',last);window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'HD-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`HD-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='HD-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});if(RET_OLD[o.meta.ret_how])o.meta.ret_how=RET_OLD[o.meta.ret_how];   /* v22.37 (review F368) */
  if(s.chk&&typeof s.chk==='object'&&!Array.isArray(s.chk)){o.chk={};Object.keys(s.chk).forEach(k=>{o.chk[k]=!!s.chk[k];});}
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n||50).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='on'||/^r_/.test(f)?!!(x&&x[f]):str(x&&x[f]);});return r;}):[];
  o.bh=arr('bh',BH_F,6).map(mkBh);
  o.rt=arr('rt',['label','time','on','note'],10);o.sk=arr('sk',['label','who','rt'],12);o.sk.forEach(k=>{if(k.who!=='Child')k.who='Adult';});
  o.ag=arr('ag',AG_F,200);
  const ints=(a,n)=>Array.isArray(a)?a.filter(x=>Number.isInteger(x)&&x>=0&&x<n):[];
  o.wk=Array.isArray(s.wk)?s.wk.slice(0,26).map(x=>{const w=newWeek();if(!x||typeof x!=='object')return w;['start','cnote','n_abc','n_sleep','note','fb'].forEach(f=>{w[f]=str(x[f]);});w.cond=COND.includes(x.cond)?x.cond:'';
    ['sent','due','back'].forEach(f=>{const v=str(x[f]);w[f]=/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';});SHEETS.forEach(k=>{w['r_'+k]=!!x['r_'+k];w['ns_'+k]=!!x['ns_'+k];});
    if(x.cells&&typeof x.cells==='object'&&!Array.isArray(x.cells))Object.keys(x.cells).forEach(k=>{if(/^b\d+_r\d+_d[0-6]$/.test(k))w.cells[k]=str(x.cells[k]);});
    if(x.ck&&typeof x.ck==='object'&&!Array.isArray(x.ck))Object.keys(x.ck).forEach(k=>{const v=str(x.ck[k]);if(/^k\d+_r\d+_d[0-6]$/.test(k)&&/^(Y|N|—)$/.test(v))w.ck[k]=v;});
    if(Array.isArray(x.abc))w.abc=x.abc.slice(0,40).filter(n=>n&&typeof n==='object').map(mkAbc);
    if(x.sl&&typeof x.sl==='object'&&!Array.isArray(x.sl))Object.keys(x.sl).forEach(k=>{if(/^[0-6]$/.test(k)&&x.sl[k]&&typeof x.sl[k]==='object')w.sl[k]=mkSl(x.sl[k]);});
    /* v22.53 (review F370) the design the week's sheets went home with; a week from an earlier file that holds marks
       takes the design the file was saved with */
    if(x.dz&&typeof x.dz==='object')w.dz={days:x.dz.days==='5'||x.dz.days==='we'?x.dz.days:'',rt:ints(x.dz.rt,o.rt.length),bh:ints(x.dz.bh,o.bh.length)};
    else if(weekHas(w))w.dz={days:o.meta.sh_days==='5'||o.meta.sh_days==='we'?o.meta.sh_days:'',rt:o.rt.map((r,i)=>r.on?i:-1).filter(i=>i>=0),bh:o.bh.map((b,i)=>b.name?i:-1).filter(i=>i>=0)};
    return w;}):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='HD-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved HD-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form HD-1. Nothing was changed.':'That file could not be read as a saved HD-1 form. Nothing was changed.');return;}
    const prev=S;S=next;curWk=0;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved HD-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
/* v22.53 each week's rows from its own design (F370), the condition (F374), the routines marked on a day (F369), how
   staff watched a check (F371), and the checklist and sleep log typed in (F372). The family's own words (the ABC lines,
   the sleep notes, the note back) stay out of it. */
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Week','Week start','Condition','Day','Behavior','Measure','Routine','Value','Routines marked']];
  S.wk.forEach((w,wi)=>{const D=wD(w),R=wR(w);wB(w).forEach(bi=>{const b=S.bh[bi];D.forEach(di=>{R.forEach(r=>{const v=w.cells[cellKey(bi,r.i,di)];if(filled(v))out.push([wi+1,w.start,w.cond,DAYS[di],b.name,b.ms,r.label,isDash(v)?'did not happen':v,'']);});const t=dayTotal(w,bi,di);if(t.v!=null)out.push([wi+1,w.start,w.cond,DAYS[di],b.name,b.ms,'Day total',t.txt,t.n+' of '+t.ask]);});});});
  out.push([]);out.push(['Agreement check','Date','Routine','Behavior','How staff watched','Staff saw','Family wrote','Agreement %','Within one point %','Counted','Note']);
  S.ag.forEach((r,i)=>{const a=agree(r),w1=agreeW1(r);out.push([i+1,r.date,(S.rt[+r.rt]||{}).label||'',(S.bh[+r.bh]||{}).name||'',r.how,r.staff,r.home,a==null?'':a.toFixed(1),w1==null?'':w1.toFixed(1),a==null?'':phoneHow(r)?'no (by phone)':'yes',r.note]);});
  const ckR=[];S.wk.forEach((w,wi)=>{const D=wD(w);wR(w).forEach(r=>ckSteps(r.i).forEach(s=>D.forEach(di=>{const v=w.ck[ckKey(s.si,r.i,di)];if(filled(v))ckR.push([wi+1,w.start,DAYS[di],r.label,s.label,s.who,v==='—'?'did not happen':v]);})));});
  if(ckR.length){out.push([]);out.push(['Checklist week','Week start','Day','Routine','Step','Who','Mark']);ckR.forEach(x=>out.push(x));}
  const slR=[];S.wk.forEach((w,wi)=>wD(w).forEach(di=>{const n=w.sl[String(di)];if(!slFilled(n))return;const h=slHours(n);slR.push([wi+1,w.start,nightLab(di),n.lo,n.fa,n.wk,n.wm,n.up,n.nap,h==null?'':h.toFixed(2)]);}));
  if(slR.length){out.push([]);out.push(['Sleep log week','Week start','Night','Lights out','Fell asleep','Woke (times)','Awake (minutes)','Woke up','Nap','Hours asleep']);slR.forEach(x=>out.push(x));}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='HD-1_home-data.csv';document.body.appendChild(a);a.click();a.remove();});
/* v22.53 (review F372) the ABC notes in the columns of Form ABC-1's own CSV export, dated from each week's Monday */
$('#abcCsv').addEventListener('click',()=>{const c=v=>{const s=String(v==null?'':v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const L=[['id','date','time','duration_min','activity','staff','adult_within_view','intensity','antecedents','precursors','behaviors','consequences','immediate','resolution','setting_events','narrative'].join(',')];let k=0;
  orderedWeeks().forEach(o=>(o.w.abc||[]).forEach(n=>{k++;const d=o.d&&n.day!==''?nbhHdIso(addDays(o.d,+n.day)):'';
    L.push(['HD1-'+k,d,n.time,'',(S.rt[+n.rt]||{}).label||'','Family (home ABC note, Form HD-1)','','',n.a.join('; '),'',n.b.map(i=>(S.bh[+i]||{}).name||'').filter(Boolean).join('; '),n.c.join('; '),'','','',[n.amt,n.txt].filter(Boolean).join(' · ')].map(c).join(','));}));
  if(k===0){nbhUI.toast('No ABC note is typed in yet.');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+L.join('\r\n')],{type:'text/csv'}));a.download='HD-1_ABC-notes.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();curWk=0;renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated family?\nEvery page is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const mon=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)-7*n);return d;};
  const Y=mdY,off=addDays;
  S=blank();curWk=0;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',nick:'Sam',cg:'Ms. Rivera (mother) on school days; Mr. Rivera (father) on weekends',cg_contact:'555-0142 (calls after 4 are best)',lang:'English and Spanish; Ms. Rivera reads English, the sheets stay in English',
    plan:'BIP dated '+Y(mon(5))+' (Form TD-1); behaviors from TB-1',question:'Does hitting happen at home, in which routines, and does a short night predict a hard morning?',bcba:'Jordan Ellis, M.A., BCBA (simulated)',date:Y(off(mon(4),-3)),start:Y(mon(3)),review:Y(off(mon(0),4)),
    abc_a:'',abc_c:'',freq:'Every Friday',ret_how:'A photo of the sheet, texted to a district phone number',ret_to:'555-0100, the school office’s district phone',todo:'Stay calm and use few words. Follow the line for that behavior, then go back to the routine. Mark the sheet after, not during.',
    call:'Jordan Ellis (simulated), 555-0100, school days 8 to 4; after hours leave a message',urgent:'a tantrum lasts more than 20 minutes, or someone was hurt (once they have been cared for)',
    taught:'Twenty minutes at pickup on '+Y(off(mon(3),-3))+': went through the sheet, filled in the practice row together, Ms. Rivera marked one made-up day; a call from the school phone the first evening to ask how it went (Form CT-1)',feedback:'The graph and two sentences in the backpack folder every Friday; thanks at every return',
    agreed:Y(off(mon(3),-3))+', Ms. Rivera, at pickup after the sheets were shown: she agreed to keep them for three weeks and was told it is her choice and she can stop at any time',
    sh_week:Y(mon(0)),sh_days:'',sh_abc:'3',decision:'',
    sv:'Ms. Rivera: “the sheet on the fridge is fine; the ABC boxes took too long on a bad night.” She wants to keep the tally sheet.'};
  S.chk={tally:true,check:true,abc:true,sleep:true};
  S.bh=[mkBh({name:'Hitting',ex:'an open or closed hand lands on a person, any force',nex:'hitting a pillow, the table or a toy',ms:'tally',todo:'Block, say “hands down”, help with the next step; no talking about it after',one:'a new hit after 3 seconds with no hitting (three quick hits are one)'}),
    mkBh({name:'Tantrum (crying or screaming more than a minute)',ex:'crying, screaming or dropping to the floor that goes on for more than a minute',nex:'a whine or one shout that stops on its own',ms:'dur',todo:'Say “you can have a break” once, step back, stay nearby; when it stops, go back to the step with no more talk',st:'he starts to cry or scream (not when he drops to the floor)',en:'he has been quiet for one minute'}),
    mkBh({name:'Fussing (whining, arguing, refusing)',ex:'whining, arguing back or saying no and not moving, for any part of the routine',nex:'asking a question once, or a sad face with no words',ms:'rate',todo:'Say the step once, wait 10 seconds, then help him through it with no more words',r0:'no whining, arguing or refusing',r3:'fussing for most of the routine'})];
  S.rt=[{label:'Morning',time:'getting up to the car',on:true,note:''},{label:'Meals',time:'breakfast and dinner',on:true,note:'count both meals together'},{label:'Homework',time:'after snack, 20 minutes',on:true,note:''},{label:'Bedtime',time:'bath to lights out',on:true,note:''},{label:'Outings',time:'store, car, visits',on:true,note:'draw a line (—) on a day with no outing'}];
  S.sk=[{label:'Show the picture schedule before the routine starts',who:'Adult',rt:''},{label:'Let Sam choose which part to do first',who:'Adult',rt:'2'},{label:'Set the timer: 10 minutes of work, then a 3-minute break',who:'Adult',rt:'2'},{label:'Ask for a break with the card or the words “break please”',who:'Child',rt:''},{label:'Praise within a minute of starting a step',who:'Adult',rt:''},{label:'Same order every night: bath, pajamas, two books, lights out',who:'Adult',rt:'3'}];
  const hit=[[2,3,4,2,3,1,2],[1,2,2,1,2,1,0],[0,1,1,0,1,0,0]],tan=[[15,25,30,10,20,5,12],[8,12,10,6,9,0,4],[0,6,4,0,3,0,0]],bed=[[2,3,2,1,2,3,2],[2,2,1,1,2,2,1],[1,2,1,0,1,2,1]];
  /* v22.53 (review F372) the hits of a day dealt to the routines in turn, counted by routine */
  const split=(n,parts)=>{const o={};for(let i=0;i<n;i++){const r=parts[i%parts.length];o[r]=(o[r]||0)+1;}return o;};
  const noOut=di=>di===1||di===3||di===4,morn=(wi,di)=>Math.max(0,bed[wi][di]-2+(di%2));
  S.wk=[0,1,2].map(wi=>{const w=newWeek();w.start=Y(mon(3-wi));w.cond=wi===1?'Plan changed':'Plan';w.cnote=wi===1?'the timer and the choice of order at homework':'';
    w.sent=nbhHdIso(off(mon(3-wi),-3));w.due=nbhHdIso(off(mon(3-wi),4));w.back=nbhHdIso(off(mon(3-wi),wi===1?7:4));w.r_tally=true;w.r_check=wi<2;w.ns_check=wi===2;w.r_abc=wi===0;w.r_sleep=true;w.n_abc=wi===0?'4':'';w.n_sleep=String([7,6,7][wi]);
    w.note=['Full week; ABC notes for the four worst moments, all at homework or bedtime','Checklist back with Thursday blank (late pickup); Sunday outing not marked; Thursday meals not marked','Checklist not sent (dropped by agreement); tally and sleep log full'][wi];
    for(let di=0;di<7;di++){const h=split(hit[wi][di],noOut(di)?[2,3,0]:[2,3,4,0]);
      [0,1,2,3,4].forEach(ri=>{if(ri===1&&wi===1&&di===3)return;if(ri===4&&wi===1&&di===6)return;
        if(ri===4&&noOut(di)){[0,1,2].forEach(bi=>{w.cells[cellKey(bi,ri,di)]='—';});return;}
        w.cells[cellKey(0,ri,di)]=String(h[ri]||0);
        const mins=ri===2?Math.round(tan[wi][di]*0.6):ri===3?Math.round(tan[wi][di]*0.4):0;w.cells[cellKey(1,ri,di)]=String(mins);
        const f=ri===3?bed[wi][di]:ri===2?Math.max(0,bed[wi][di]-1):morn(wi,di);w.cells[cellKey(2,ri,di)]=String(f);});
      /* the sleep log: the nights before the mornings with fussing were later and broken */
      if(!(wi===1&&di===6)){const sh=morn(wi,di)>=1;w.sl[String(di)]=mkSl({lo:sh?'9:25 pm':'8:35 pm',fa:sh?'9:50 pm':'8:50 pm',wk:sh?'1':'0',wm:sh?'25':'0',up:sh?'6:15 am':'6:40 am',nap:'',note:sh?['Late dinner','Cousins visited','Up with a cough'][wi]:''});}}
    /* the checklist, weeks 1 and 2: the timer and the choice of order went in with week 2 */
    if(wi<2)for(let di=0;di<7;di++){if(wi===1&&di===3)continue;[0,1,2,3,4].forEach(ri=>ckSteps(ri).forEach(s=>{let v;const si=s.si;
      if(ri===4&&noOut(di))v='—';else if(si===1||si===2)v=wi===0?'N':(di===5?'N':'Y');else if(si===5)v=(wi===0&&di===4)?'N':'Y';else if(si===0)v=ri===1||ri===4?'N':'Y';
      else if(si===3)v=(ri===2||ri===3)&&(di+wi)%3!==0?'Y':'N';else v=(di+ri+wi)%4===0?'N':'Y';w.ck[ckKey(si,ri,di)]=v;}));}
    if(wi===0)w.abc=[mkAbc({day:'0',time:'4:10 pm',rt:'2',a:['Told to do something'],b:['0','1'],c:['The task was put off or done for them'],amt:'2 hits; 12 minutes',txt:'Asked him to start the math page. He hit me twice, then cried on the floor. We stopped the page.'}),
      mkAbc({day:'1',time:'7:50 pm',rt:'3',a:['Told no, or had to wait','Tired, hungry or not feeling well'],b:['2','0'],c:['Was talked to, comforted or told off'],amt:'1 hit',txt:'No more tablet before bath. He argued, then hit his sister once.'}),
      mkAbc({day:'2',time:'4:30 pm',rt:'2',a:['Told to do something'],b:['1'],c:['I followed the plan step'],amt:'15 minutes',txt:'Spelling words. He screamed; I said he could have a break, then we went back to it.'}),
      mkAbc({day:'5',time:'8:05 pm',rt:'3',a:['Change in the routine','Tired, hungry or not feeling well'],b:['0'],c:['Was sent to their room or had a break away'],amt:'2 hits',txt:'Late back from his cousins. Hit me twice at bath time; he went to his room to calm down.'})];
    return w;});
  S.ag=[mkAg({date:Y(off(mon(3),3)),rt:'2',bh:'0',staff:'3',home:'3',how:'In person',note:'BCBA home visit at homework; each wrote the count before comparing; both counted 3'}),mkAg({date:Y(off(mon(3),3)),rt:'2',bh:'1',staff:'20',home:'25',how:'In person',note:'Ms. Rivera counted from the first cry; staff from the drop to the floor; the start is now written on the sheet'}),
    mkAg({date:Y(off(mon(2),2)),rt:'3',bh:'2',staff:'2',home:'2',how:'Phone or audio only',note:'Phone call during bedtime; same rating for fussing'}),mkAg({date:Y(off(mon(1),1)),rt:'2',bh:'0',staff:'1',home:'1',how:'Video',note:'Video call at homework'})];
  S.wk.forEach(freeze);
  S.meta.decision=hdSimDecision();
  renderAll();setView('sheets');
  nbhUI.toast('Simulation loaded: '+'a simulated family: a second-grader with three behaviors across five routines and four home sheets.',{kind:'ok'});
}
/* the simulation's decision, from its own figures (v22.53, review F372) */
function hdSimDecision(){const rg=(wi,bi)=>{const v=wD(S.wk[wi]).map(di=>dayTotal(S.wk[wi],bi,di).v).filter(x=>x!=null);return Math.min(...v)+' to '+Math.max(...v);};
  const byRt=bi=>{const o={};S.wk.forEach(w=>wR(w).forEach(r=>wD(w).forEach(di=>{const q=num(w.cells[cellKey(bi,r.i,di)]);if(q!=null)o[r.label]=(o[r.label]||0)+q;})));return o;};
  const H=byRt(0),tot=Object.values(H).reduce((s,x)=>s+x,0),hb=(H.Homework||0)+(H.Bedtime||0);
  const T=[0,1,2].map(wi=>weekTotal(S.wk[wi],1).v),F=slFlags(),fm=[],fo=[];F.L.forEach(x=>{const q=num(x.w.cells[cellKey(2,0,x.di)]);if(q!=null)(x.short||x.broken?fm:fo).push(q);});
  const mean=a=>a.length?r1(a.reduce((s,x)=>s+x,0)/a.length):'—',fr=(ri,wi)=>{const v=wD(S.wk[wi]).map(di=>num(S.wk[wi].cells[cellKey(2,ri,di)])).filter(x=>x!=null);return Math.min(...v)+' to '+Math.max(...v);};
  const ck=[0,1].map(wi=>{let y=0,o=0;wD(S.wk[wi]).forEach(di=>ckSteps(2).filter(s=>s.si===2).forEach(s=>{const v=S.wk[wi].ck[ckKey(s.si,2,di)];if(v==='Y'){y++;o++;}else if(v==='N')o++;}));return y+' of '+o;});
  return 'Three weeks in: '+hb+' of the '+tot+' hits were at homework or bedtime. Hitting ran '+rg(0,0)+' a day in week 1 and '+rg(2,0)+' in week 3, falling after the timer and the choice of order went in at homework in week 2 (the checklist has the timer set on '+ck[0]+' homework days in week 1 and '+ck[1]+' in week 2). Tantrum minutes fell with it ('+T.join(', ')+' a week). Fussing is rated highest at bedtime ('+fr(3,0)+' in week 1), lower at homework ('+fr(2,0)+'). On the sleep log the '+fm.length+' short or broken nights were followed by a morning fussing rating of '+mean(fm)+' on average, against '+mean(fo)+' after the other '+fo.length+' nights. Fussing has no agreement check that counts yet (the only one was by phone). Decision at the review: keep the tally and sleep log, drop the checklist to two steps, add the bedtime routine to the plan (Form TD-1), and check fussing in person.';}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. An empty behavior table takes the target behaviors from Form TB-1, with
   their examples and non-examples as the plain-words "what counts"; the picker adds rows. */
/* v22.53 (review F375) a behavior from TB-1 comes with the home measure that matches TB-1's dimension (count or rate: a
   tally; duration: minutes; % of opportunities: yes or no; anything else: a tally, flagged on Setup to check), only TB-1's
   own examples in the plain-words columns (the definition shows beside them, to rewrite), and what TB-1 sent, so a later
   rename or new definition on TB-1 is offered here. Replacement behaviors go on the checklist as Child steps, GB-1's skills
   too. The targets are taken in TB-1's urgency order, four at most, and the rest are named; the picker stops at six rows.
   The plan's response to the behavior on TD-1 fills the shared "what to do" line while it is empty; the consent on file
   comes from Form IC-1. Families are not staff: nothing of the family's goes out of this form. */
const nbhHdLines=v=>String(v==null?'':v).split(/\n+/).map(x=>x.trim()).filter(Boolean).join('; ');
const nbhHdMs=d=>/^count/i.test(d||'')?'tally':/^duration/i.test(d||'')?'dur':/% of opportunities/i.test(d||'')?'yn':'tally';
const nbhHdSnap=b=>JSON.stringify({l:String(b.label||''),d:nbhHdLines(b.def),e:nbhHdLines(b.ex),n:nbhHdLines(b.nex),m:String(b.dim||'')});
const nbhHdRow=b=>mkBh({name:b.label||'',ex:nbhHdLines(b.ex),nex:nbhHdLines(b.nex),ms:nbhHdMs(b.dim),todo:'',tb:nbhHdSnap(b)});
function tbOffers(){const L=((nbhHdFacts||{}).behaviors||[]).filter(b=>b&&b.label&&!b.isRep);if(!L.length)return [];const out=[],used=new Set();
  S.bh.forEach((b,bi)=>{const s=tbSnap(b);if(!s||!b.name)return;
    let t=L.find(x=>key(x.label)===key(s.l));
    if(t){used.add(t);if(key(nbhHdLines(t.def))!==key(s.d)||key(nbhHdLines(t.ex))!==key(s.e)||key(nbhHdLines(t.nex))!==key(s.n))out.push({bi,kind:'def',t});return;}
    t=L.find(x=>!used.has(x)&&!S.bh.some(y=>key(y.name)===key(x.label))&&((s.d&&key(nbhHdLines(x.def))===key(s.d))||(s.e&&key(nbhHdLines(x.ex))===key(s.e)&&key(nbhHdLines(x.nex))===key(s.n))));
    if(t){used.add(t);out.push({bi,kind:'rename',t});}});
  return out;}
const tbSig=O=>JSON.stringify(O.map(o=>[o.bi,o.kind,o.t.label,nbhHdLines(o.t.def)]));
function renderTbNote(){const el=$('#hdTbNote');if(!el)return;const O=tbOffers();if(!O.length||tbSig(O)===nbhHdTbLater){el.innerHTML='';return;}
  el.innerHTML='<div class="verdict v-mid" role="status">'+O.map(o=>{const b=S.bh[o.bi],s=tbSnap(b);return o.kind==='rename'?'Form TB-1 renamed <b>'+esc(s.l)+'</b> to <b>'+esc(o.t.label)+'</b>.':'Form TB-1 has a new definition or new examples for <b>'+esc(o.t.label)+'</b>.';}).join(' ')+
    ' Update the sheets? The marks typed in stay with the behavior; words rewritten here in the family&rsquo;s words are kept. <button type="button" class="tool" id="hdTbUpd">Update the sheets</button> <button type="button" class="tool" id="hdTbLater">Not now</button></div>';}
function tbApply(){const O=tbOffers();let n=0;const kept=[];
  O.forEach(o=>{const b=S.bh[o.bi],s=tbSnap(b),t=o.t;if(!s)return;
    if(o.kind==='rename'){if(key(b.name)===key(s.l))b.name=t.label;else kept.push(b.name);}
    const e=nbhHdLines(t.ex),x=nbhHdLines(t.nex);if(key(b.ex)===key(s.e)&&e)b.ex=e;else if(key(b.ex)!==key(s.e))kept.push(b.name+' (example)');
    if(key(b.nex)===key(s.n)&&x)b.nex=x;b.tb=nbhHdSnap(t);n++;});
  nbhHdTbLater='';renderAll();
  nbhUI.toast(n?'The sheets follow Form TB-1 now'+(kept.length?'; kept in the family’s words: '+kept.join(', '):'')+'.':'Nothing to update.',{kind:'ok'});}
function renderConsentNote(){const el=$('#hdConsentNote');if(!el)return;const C=nbhHdFacts&&nbhHdFacts.consent;
  el.innerHTML=C&&typeof C==='object'&&C.state&&C.on===false?'<div class="verdict v-mid" style="margin-top:6px">Form IC-1 records the consent as <b>'+esc(C.state)+'</b>: there is no consent on file for this work. Keeping the home sheets is the family&rsquo;s choice; talk with them and the team before the sheets go home.</div>':'';}
window.__nbhFactsIn=function(f){nbhHdFacts=f&&typeof f==='object'?f:null;if(!nbhHdFacts)return {filled:0};let n=0;const notes=[];
  const all=(f.behaviors||[]).filter(b=>b&&b.label);
  if(all.length&&S.bh.every(b=>!b.name)){
    const tg=all.filter(b=>!b.isRep).map((b,i)=>({b,i})).sort((x,y)=>((+y.b.urg||0)-(+x.b.urg||0))||(x.i-y.i)).map(x=>x.b),take=tg.slice(0,4),left=tg.slice(4),reps=all.filter(b=>b.isRep);
    if(take.length){S.bh=take.map(nbhHdRow);n+=take.length;}
    if(left.length)notes.push('Left off the home sheets (four is the most the form takes from the case; more than four is more than most families return): '+left.map(b=>b.label+(b.urg?' (urgency '+b.urg+')':'')).join(', ')+'.');
    if(reps.length){if(!S.sk.some(s=>s.label)){S.sk=reps.slice(0,12).map(b=>({label:b.label,who:'Child',rt:''}));n+=S.sk.length;notes.push('Replacement behavior'+(reps.length===1?'':'s')+' '+reps.map(b=>b.label).join(', ')+' went on the checklist as Child steps, not on the tally sheet.');}
      else notes.push('Replacement behavior'+(reps.length===1?'':'s')+' '+reps.map(b=>b.label).join(', ')+' left off the tally sheet; add '+(reps.length===1?'it':'them')+' to the checklist as a Child step if the family should mark '+(reps.length===1?'it':'them')+'.');}}
  /* the plan's response to the behavior (TD-1), while the shared line is empty; and the plan it serves */
  const P=f.plan&&typeof f.plan==='object'?f.plan:null,rs=(P&&P.respond)||{},line=[rs.target,rs.after].map(x=>String(x||'').trim()).filter(Boolean).join(' ');
  if(line){nbhHdTodoTD=line;if(!String(S.meta.todo||'').trim()&&!S.bh.some(b=>String(b.todo||'').trim())){S.meta.todo=line;n++;}}
  if(P&&P.src==='TD-1'&&!String(S.meta.plan||'').trim()){S.meta.plan='BIP on Form TD-1'+(all.length?'; behaviors from Form TB-1':'');n++;}
  /* the consent on file (IC-1): the implementation consent, else the consent for the assessment while it is on file */
  const C=f.consent;if(C&&typeof C==='object'){const dm=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(d||''));return m?(+m[2])+'/'+(+m[3])+'/'+m[1]:String(d||'').trim();};
    const want=C.bip?'BIP implementation consent '+dm(C.bip)+' (Form IC-1)':(C.on!==false&&(C.obtained||C.date))?'Consent for the assessment '+dm(C.obtained||C.date)+' (Form IC-1)':'',cur=String(S.meta.consent||'').trim();
    if((want&&!cur)||(cur&&/^(BIP implementation consent|Consent for the assessment) \S+ \(Form IC-1\)$/.test(cur)&&cur!==want)){S.meta.consent=want;n++;}}
  if(n)renderAll();else renderSetup();
  return {filled:n,note:notes.join(' ')};
};
window.__nbhFactsPick=function(sel){let n=0;const notes=[],over=[];
  const step=lab=>{if(!lab||S.sk.some(s=>key(s.label)===key(lab)))return false;const slot=S.sk.find(s=>!s.label);if(slot){slot.label=lab;slot.who='Child';slot.rt='';}else if(S.sk.length<12)S.sk.push({label:lab,who:'Child',rt:''});else{over.push(lab);return false;}n++;return true;};
  (sel.behaviors||[]).forEach(b=>{if(!b||!b.label)return;
    if(b.isRep){if(step(b.label))notes.push(b.label+' is a replacement behavior: it is on the checklist as a Child step.');return;}
    if(S.bh.some(x=>key(x.name)===key(b.label)))return;const slot=S.bh.find(x=>!x.name);if(slot)Object.assign(slot,nbhHdRow(b));else if(S.bh.length<6)S.bh.push(nbhHdRow(b));else{over.push(b.label);return;}n++;});
  ((sel.goals||{}).acq||[]).forEach(g=>{if(g&&g.beh&&step(g.beh+(g.cond?' (given '+g.cond+')':'')))notes.push('The skill '+g.beh+' is on the checklist as a Child step.');});
  if(over.length)notes.push('Not added, the table is full (six behaviors, twelve steps): '+over.join(', ')+'.');
  if(n)renderAll();return {filled:n,note:notes.join(' ')};
};

/* v21.78 the home data for the case (Form DD-1 brings the days in as a home series; the review reads the dates): each
   sheet sent, with the week's Sent home / Due back / Came back dates, and every day total the family wrote, dated from
   the week's Monday. Nothing typed in: null. */
/* v22.53 each week from its own design (review F370), dated from the same Monday the graph uses; a sheet marked not sent
   that week is not listed (F372); each day carries the week's condition as phase (F374); and the other sheets as
   numbers only: the checklist's steps done each day (integrity), the ABC notes' before and after counts (abc) and each
   night's hours asleep (sleep). The family's names, contact and own words never leave the form. */
const nbhHdIso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function nbhHdMon(t){return hdMonday(t);}
const NBH_HD_UNIT={tally:'times',dur:'minutes',rate:'rating 0 to 3',yn:'routines with a yes'};
window.__nbhFactsOut=function(){try{ensure();
  const names={tally:'Tally sheet',check:'Routine checklist',abc:'ABC notes',sleep:'Sleep log'},asked=SHEETS.filter(k=>S.chk[k]);
  const sheets=[],data=[],integrity=[],sleep=[],F=slFlags();
  S.wk.forEach((w,wi)=>{const mon=nbhHdMon(w.start),iso=mon?nbhHdIso(mon):'',used=iso||w.sent||w.due||w.back||weekHas(w);if(!used)return;
    const anyBack=SHEETS.some(k=>w['r_'+k]);
    asked.filter(k=>!w['ns_'+k]).forEach(k=>{const o={name:names[k]+(w.start?' · week of '+w.start:' · week '+(wi+1)),kind:k};if(iso)o.week=iso;if(w.sent)o.sent=w.sent;if(w.due)o.due=w.due;
      const came=!!w['r_'+k]||(!anyBack&&!!w.back);if(came&&w.back)o.back=w.back;o.returned=came;sheets.push(o);});
    if(!mon)return;const D=wD(w),at=di=>nbhHdIso(addDays(mon,di));
    wB(w).forEach(bi=>{const b=S.bh[bi];if(!b.name)return;D.forEach(di=>{const t=dayTotal(w,bi,di);if(t.v==null)return;
      const r={date:at(di),beh:b.name,value:Math.round(t.v*100)/100,unit:NBH_HD_UNIT[b.ms]||'',measure:b.ms};if(b.ms==='yn')r.of=t.n;if(w.cond)r.phase=w.cond;data.push(r);});});
    D.forEach(di=>{const c=ckDay(w,di);if(c.v!=null)integrity.push({date:at(di),pct:Math.round(c.v*10)/10,of:c.of});
      const x=F.L.find(y=>y.w===w&&y.di===di);if(x&&x.h!=null)sleep.push({date:at(di),hours:Math.round(x.h*100)/100,wakings:num(x.n.wk)||0,short:!!x.short,broken:!!x.broken});});});
  if(!sheets.length&&!data.length){if(!S.bh.some(b=>b.name)||!asked.length)return null;asked.forEach(k=>sheets.push({name:names[k],kind:k}));}
  const home={sheets,data,src:'HD-1'},A=abcCount();
  if(integrity.length)home.integrity=integrity;if(sleep.length)home.sleep=sleep;if(A.n)home.abc={notes:A.n,before:A.A,after:A.C};
  return {home};
}catch(e){return null;}};

/* v21.82 the family's home language. Language at home on Setup, or, while it is empty, the case's (Form DM-1's
   f.profile.language {home, interpreter}, else Form TD-1's plan considerations), which also fills that field when it is
   empty. When an interpreter is asked for or the language is not English, a flag shows above the home sheets, on screen
   only: have them translated or explained by an interpreter before they go home. It never prints (the sheets print as
   they are), and nothing is translated here. */
let nbhHdCase=null;
function nbhHdLang(){const f=nbhHdCase||{},L=(f.profile&&f.profile.language)||{},C=(f.plan&&f.plan.considerations)||{};
  const home=String(S.meta.lang||'').trim()||String(L.home||C.language||'').trim(),intp=L.interpreter===true||(L.interpreter===undefined&&C.interpreter===true);
  if(!intp&&(!home||/^\s*english(\s+only)?\s*\.?\s*$/i.test(home)))return null;return {home,intp};}
function nbhHdLangFlag(){const x=nbhHdLang();let el=document.getElementById('hdLangFlag');
  if(!x){if(el)el.remove();return;}
  if(!el){const o=$('#sheetOut');if(!o)return;el=document.createElement('div');el.id='hdLangFlag';el.className='nbh-lang-flag noprint';el.setAttribute('role','note');o.parentNode.insertBefore(el,o);}
  el.innerHTML='<b>Before these go home.</b> Home language: '+esc(x.home||'not recorded (an interpreter is asked for)')+'. Have this translated or explained by an interpreter (the district&rsquo;s interpreter service) before it goes home.';}
{const rs0=renderSheets;renderSheets=function(){const r=rs0.apply(this,arguments);try{nbhHdLangFlag();}catch(e){}return r;};}
document.addEventListener('input',e=>{const el=e.target;if(el&&el.dataset&&el.dataset.m==='lang')nbhHdLangFlag();});
{const was=window.__nbhFactsIn;window.__nbhFactsIn=function(f){nbhHdCase=f&&typeof f==='object'?f:null;const r=was?was.apply(this,arguments):null;let n=0;
  try{const L=(f&&f.profile&&f.profile.language)||{},C=(f&&f.plan&&f.plan.considerations)||{},home=String(L.home||C.language||'').trim();
    const el=$('[data-m="lang"]');if(home&&!String(S.meta.lang||'').trim()&&el&&!String(el.value||'').trim()){S.meta.lang=home+((L.interpreter===true||C.interpreter===true)?' (interpreter requested)':'');el.value=S.meta.lang;n=1;el.dispatchEvent(new Event('input',{bubbles:true}));}
    nbhHdLangFlag();}catch(e){}
  return {filled:((r&&r.filled)|0)+n,note:(r&&r.note)||''};};}
nbhHdLangFlag();
