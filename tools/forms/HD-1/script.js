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
const ABC_C=['Got what they wanted','Got out of the task','Got attention or talked to','Was left alone','Was sent to their room or lost something','I followed the plan step','Not sure'];

/* ---------------- state ---------------- */
function blank(){return{meta:{},chk:{tally:true,check:true,abc:false,sleep:false},bh:[],rt:[],sk:[],wk:[],ag:[]};}
let S=blank(),curWk=0;
const newWeek=()=>({start:'',sent:'',due:'',back:'',r_tally:false,r_check:false,r_abc:false,r_sleep:false,n_abc:'',n_sleep:'',note:'',cells:{}});
function ensure(){
  ['bh','rt','sk','wk','ag'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  while(S.bh.length<1)S.bh.push({name:'',ex:'',nex:'',ms:'tally',todo:''});
  if(!S.rt.length)ROUT.forEach(r=>S.rt.push({label:r.label,time:r.time,on:true,note:''}));
  while(S.sk.length<1)S.sk.push({label:'',who:'Adult',rt:''});
  while(S.wk.length<1)S.wk.push(newWeek());
  S.wk.forEach(w=>{if(!w.cells||typeof w.cells!=='object')w.cells={};});
  if(curWk>=S.wk.length)curWk=S.wk.length-1;if(curWk<0)curWk=0;
}
function dayIdx(){const d=S.meta.sh_days;return d==='5'?[0,1,2,3,4]:d==='we'?[5,6]:[0,1,2,3,4,5,6];}
const rtOn=()=>S.rt.map((r,i)=>({...r,i})).filter(r=>r.on);
const abcA=()=>(S.meta.abc_a||'').split('\n').map(x=>x.trim()).filter(Boolean).length?(S.meta.abc_a||'').split('\n').map(x=>x.trim()).filter(Boolean):ABC_A;
const abcC=()=>(S.meta.abc_c||'').split('\n').map(x=>x.trim()).filter(Boolean).length?(S.meta.abc_c||'').split('\n').map(x=>x.trim()).filter(Boolean):ABC_C;

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- setup rows ---------------- */
function renderB(){
  $('#bTbl tbody').innerHTML=S.bh.map((r,i)=>`<tr><td class="num">${i+1}</td>
    <td><input data-r="bh" data-i="${i}" data-f="name" value="${esc(r.name)}" placeholder="Hitting"></td>
    <td><input data-r="bh" data-i="${i}" data-f="ex" value="${esc(r.ex)}" placeholder="an open or closed hand lands on a person"></td>
    <td><input data-r="bh" data-i="${i}" data-f="nex" value="${esc(r.nex)}" placeholder="hitting a pillow or the table"></td>
    <td><select data-r="bh" data-i="${i}" data-f="ms" aria-label="Measure for behavior ${i+1}">${Object.keys(MEAS).map(k=>`<option value="${k}"${r.ms===k?' selected':''}>${MEAS[k]}</option>`).join('')}</select></td>
    <td><input data-r="bh" data-i="${i}" data-f="todo" value="${esc(r.todo)}" placeholder="Block, say “hands down”, help with the next step; no talking about it after"></td>${delCell('bh',i,'behavior')}</tr>`).join('');
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
function renderAg(){
  $('#agTbl tbody').innerHTML=S.ag.map((r,i)=>{const a=agree(r);
    return `<tr><td class="num">${i+1}</td><td><input data-r="ag" data-i="${i}" data-f="date" value="${esc(r.date)}"></td>
    <td><select data-r="ag" data-i="${i}" data-f="rt" aria-label="Routine of check ${i+1}"><option value=""></option>${S.rt.map((x,ri)=>`<option value="${ri}"${String(r.rt)===String(ri)?' selected':''}>${esc(x.label)}</option>`).join('')}</select></td>
    <td><select data-r="ag" data-i="${i}" data-f="bh" aria-label="Behavior of check ${i+1}"><option value=""></option>${S.bh.map((x,bi)=>`<option value="${bi}"${String(r.bh)===String(bi)?' selected':''}>${esc(x.name||('Behavior '+(bi+1)))}</option>`).join('')}</select></td>
    <td><input data-r="ag" data-i="${i}" data-f="staff" value="${esc(r.staff)}" style="text-align:center"></td><td><input data-r="ag" data-i="${i}" data-f="home" value="${esc(r.home)}" style="text-align:center"></td>
    <td class="num">${a==null?'—':pct(a)}</td><td><input data-r="ag" data-i="${i}" data-f="note" value="${esc(r.note)}"></td>${delCell('ag',i,'check')}</tr>`;}).join('');
}
function agree(r){const b=S.bh[+r.bh];if(!b||r.staff===''||r.home===''||r.staff==null||r.home==null)return null;
  if(b.ms==='yn'){const s=String(r.staff).trim().toUpperCase()[0],h=String(r.home).trim().toUpperCase()[0];if(!/[YN]/.test(s||'')||!/[YN]/.test(h||''))return null;return s===h?100:0;}
  const s=num(r.staff),h=num(r.home);if(s==null||h==null)return null;const mx=Math.max(s,h);return mx===0?100:Math.min(s,h)/mx*100;}

/* ---------------- entry ---------------- */
function week(){ensure();return S.wk[curWk];}
function cellKey(bi,ri,di){return 'b'+bi+'_r'+ri+'_d'+di;}
function dayTotal(w,bi,di){const b=S.bh[bi],R=rtOn();let v=null,n=0,y=0,sum=0;
  R.forEach(r=>{const x=w.cells[cellKey(bi,r.i,di)];if(x==null||String(x).trim()==='')return;
    if(b.ms==='yn'){const c=String(x).trim().toUpperCase()[0];if(c==='Y'){y++;n++;}else if(c==='N')n++;}
    else{const q=num(x);if(q!=null){sum+=q;n++;}}});
  if(!n)return{v:null,n:0,txt:'—'};
  if(b.ms==='yn')return{v:y,n,txt:y+' of '+n};
  if(b.ms==='rate')return{v:sum/n,n,txt:r1(sum/n)};
  return{v:sum,n,txt:String(Math.round(sum*10)/10)};
}
function weekTotal(w,bi){const b=S.bh[bi];let v=0,n=0,days=0;dayIdx().forEach(di=>{const t=dayTotal(w,bi,di);if(t.v==null)return;days++;v+=t.v;n+=t.n;});
  if(!days)return{v:null,txt:'—',days:0};
  if(b.ms==='yn')return{v,txt:v+' of '+n,days};if(b.ms==='rate')return{v:v/days,txt:r1(v/days),days};return{v,txt:String(Math.round(v*10)/10),days};}
function completeness(w){const D=dayIdx(),R=rtOn();let ask=0,got=0;S.bh.forEach((b,bi)=>R.forEach(r=>D.forEach(di=>{ask++;const x=w.cells[cellKey(bi,r.i,di)];if(x!=null&&String(x).trim()!=='')got++;})));return{ask,got,p:ask?got/ask*100:null};}
function renderWkSel(){const s=$('#wkSel');s.innerHTML=S.wk.map((w,i)=>`<option value="${i}"${i===curWk?' selected':''}>Week ${i+1}${w.start?' · '+esc(w.start):''}</option>`).join('');}
function bindWeek(){const w=week();$$('[data-w]').forEach(el=>{if(el.type==='checkbox')el.checked=!!w[el.dataset.w];else el.value=w[el.dataset.w]||'';});}
function renderEnt(){
  const w=week(),D=dayIdx(),R=rtOn(),t=$('#entTbl');
  if(!S.bh.some(b=>b.name)){t.innerHTML='<tr><td class="hint">Name at least one behavior on the Setup page; the week grid appears here.</td></tr>';renderEntTotals();return;}
  let h='<thead><tr><th style="width:16%">Behavior</th><th style="width:14%">Routine</th>'+D.map(di=>'<th>'+DAYS[di]+'</th>').join('')+'<th style="width:9%">Week</th></tr></thead><tbody>';
  S.bh.forEach((b,bi)=>{
    R.forEach((r,k)=>{h+='<tr>'+(k===0?'<td class="lk" rowspan="'+(R.length+1)+'" style="white-space:normal">'+esc(b.name||('Behavior '+(bi+1)))+'<div class="hint" style="font-weight:400">'+esc(MEAS[b.ms]||'')+'</div></td>':'')+'<td class="lk" style="white-space:normal">'+esc(r.label||('Routine '+(r.i+1)))+'</td>'+
      D.map(di=>{const k2=cellKey(bi,r.i,di),v=w.cells[k2]||'';const lab=DAYL[di]+' '+(r.label||'')+' '+(b.name||'');
        return '<td class="ent">'+(b.ms==='yn'?'<select data-e="'+k2+'" aria-label="'+esc(lab)+'"><option value=""></option><option'+(v==='Y'?' selected':'')+'>Y</option><option'+(v==='N'?' selected':'')+'>N</option></select>':'<input data-e="'+k2+'" value="'+esc(v)+'" aria-label="'+esc(lab)+'" inputmode="numeric">')+'</td>';}).join('')+(k===0?'<td class="num" rowspan="'+(R.length+1)+'" style="vertical-align:middle"><b id="wt_b'+bi+'">'+weekTotal(w,bi).txt+'</b></td>':'')+'</tr>';});
    h+='<tr class="tot"><td>Day total</td>'+D.map(di=>'<td class="num" id="t_b'+bi+'_d'+di+'">'+dayTotal(w,bi,di).txt+'</td>').join('')+'</tr>';});
  t.innerHTML=h+'</tbody>';renderEntTotals();
}
function updateTotals(){const w=week();S.bh.forEach((b,bi)=>{dayIdx().forEach(di=>{const el=$('#t_b'+bi+'_d'+di);if(el)el.textContent=dayTotal(w,bi,di).txt;});const el=$('#wt_b'+bi);if(el)el.textContent=weekTotal(w,bi).txt;});renderEntTotals();}
function renderEntTotals(){
  const w=week(),c=completeness(w),M=$('#entMetrics'),V=$('#entVerdict');
  const back=['r_tally','r_check','r_abc','r_sleep'].filter(k=>w[k]).length,asked=['tally','check','abc','sleep'].filter(k=>S.chk[k]).length;
  M.innerHTML=S.bh.map((b,bi)=>{const t=weekTotal(w,bi);return `<div class="metric"><b>${esc(b.name||('Behavior '+(bi+1)))}, this week</b><div class="val">${t.txt}</div><div class="sub">${b.ms==='yn'?'routines with a yes':b.ms==='dur'?'minutes':b.ms==='rate'?'mean rating, 0 to 3':'times'} · ${t.days} day${t.days===1?'':'s'} marked</div></div>`;}).join('')+
    `<div class="metric"><b>Completeness, this week</b><div class="val">${c.p==null?'—':pct(c.p)}</div><div class="sub">${c.got} of ${c.ask} cells written</div></div>
    <div class="metric"><b>Sheets back, this week</b><div class="val">${back} of ${asked}</div><div class="sub">${w.n_abc?w.n_abc+' ABC note'+(w.n_abc==='1'?'':'s'):''}${w.n_abc&&w.n_sleep?' · ':''}${w.n_sleep?w.n_sleep+' night'+(w.n_sleep==='1'?'':'s')+' logged':''}</div></div>`;
  if(c.ask===0)V.innerHTML='';
  else if(c.got===0)V.innerHTML='<div class="verdict v-mid"><b>Nothing typed in for this week yet.</b> If the sheet came back empty or did not come back, say so in the note; an empty week is a result.</div>';
  else if(c.p<50)V.innerHTML='<div class="verdict v-no"><b>Completeness '+pct(c.p)+'.</b> Fewer than half the cells were written (working convention: below 50% the week is not used for decisions). Ask the family which routines were hard to mark and shorten the sheet before the next week.</div>';
  else if(c.p<80)V.innerHTML='<div class="verdict v-mid"><b>Completeness '+pct(c.p)+'.</b> Usable with care; the missing days are gaps, not zeros. Thank the family and ask whether one routine should come off the sheet.</div>';
  else V.innerHTML='<div class="verdict v-ok"><b>Completeness '+pct(c.p)+'.</b> A full week. Send the graph and two sentences back to the family.</div>';
  drawEnt();renderAgM();renderRet();
}
function parseDate(s){const m=/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/.exec(String(s||'').trim());if(!m)return null;let y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000;const d=new Date(y,+m[1]-1,+m[2]);return isNaN(d)?null:d;}
function orderedWeeks(){return S.wk.map((w,i)=>({w,i,d:parseDate(w.start)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:a.i-b.i);}
function drawEnt(){
  const svg=$('#entPlot'),B=S.bh,D=dayIdx(),W=orderedWeeks();const PH=130,W0=900,L=60,Rg=16,T=14,B0=36;const H=B.length*PH+30;svg.setAttribute('viewBox','0 0 '+W0+' '+H);
  const pts=[];W.forEach((o,wi)=>D.forEach(di=>{const lab=o.d?(()=>{const d=new Date(o.d);d.setDate(d.getDate()+di);return (d.getMonth()+1)+'/'+d.getDate();})():'W'+(o.i+1)+' '+DAYS[di];pts.push({w:o.w,di,lab,wi});}));
  const n=Math.max(pts.length,7),X=i=>L+(i+0.5)*(W0-L-Rg)/n;let s='<rect x="0" y="0" width="'+W0+'" height="'+H+'" fill="#fff"/>';
  B.forEach((b,bi)=>{const top=T+bi*PH,bot=top+PH-B0;const vals=pts.map(p=>dayTotal(p.w,bi,p.di).v);const mx=b.ms==='rate'?3:b.ms==='yn'?Math.max(1,rtOn().length):Math.max(1,...vals.filter(v=>v!=null),0);const Y=v=>bot-(bot-top-14)*(v/mx);
    s+='<text x="'+L+'" y="'+(top+10)+'" font-size="12" font-weight="600" fill="#182e43" font-family="system-ui,sans-serif">'+esc(b.name||('Behavior '+(bi+1)))+' <tspan font-weight="400" fill="#5B6B6B">('+(b.ms==='yn'?'routines with a yes':b.ms==='dur'?'minutes':b.ms==='rate'?'mean rating':'count')+')</tspan></text>';
    [0,0.5,1].forEach(f=>{const v=mx*f;s+='<line x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W0-Rg)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e3e8ea"/><text x="'+(L-6)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="10.5" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(Math.round(v*10)/10)+'</text>';});
    s+='<line x1="'+L+'" y1="'+bot+'" x2="'+(W0-Rg)+'" y2="'+bot+'" stroke="#182e43"/><line x1="'+L+'" y1="'+(top+14)+'" x2="'+L+'" y2="'+bot+'" stroke="#182e43"/>';
    let d='';vals.forEach((v,i)=>{if(v==null){d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)+' ';});
    d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="#2f5568" stroke-width="2"/>';});
    vals.forEach((v,i)=>{if(v==null)return;s+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(v).toFixed(1)+'" r="4" fill="#2f5568"/>';});
    pts.forEach((p,i)=>{if(i>0&&p.wi!==pts[i-1].wi){const x=X(i)-(W0-L-Rg)/n/2;s+='<line x1="'+x.toFixed(1)+'" y1="'+(top+14)+'" x2="'+x.toFixed(1)+'" y2="'+bot+'" stroke="#9b4e15" stroke-dasharray="3 3"/>';}
      if(bi===B.length-1||pts.length<=14)s+='<text x="'+X(i).toFixed(1)+'" y="'+(bot+13)+'" font-size="'+(pts.length>21?8:9.5)+'" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(p.lab)+'</text>';});});
  s+='<text x="'+((L+W0-Rg)/2)+'" y="'+(H-6)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">Day totals from the sheets as typed in · dashed line: a new week · a missing day breaks the line</text>';
  svg.innerHTML=s;
}
function renderAgM(){const a=S.ag.map(agree).filter(x=>x!=null),m=a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  $('#agMetrics').innerHTML=`<div class="metric"><b>Mean agreement</b><div class="val">${m==null?'—':pct(m)}</div><div class="sub">${a.length} check${a.length===1?'':'s'} with both values</div></div>`+
    (m==null?'':`<div class="verdict ${m>=80?'v-ok':m>=60?'v-mid':'v-no'}" style="grid-column:span 2">${m>=80?'At or above 80%: the family marks what the staff see. Use the home data as they stand.':m>=60?'Between 60% and 80%: go over the examples and non-examples with the family once more and check again next week.':'Below 60%: the two records disagree. Re-teach the definitions with the family and do not use the home data for decisions until a check agrees.'} (80% is the working convention.)</div>`);}
function renderRet(){const asked=['tally','check','abc','sleep'].filter(k=>S.chk[k]);const names={tally:'Tally sheet',check:'Checklist',abc:'ABC notes',sleep:'Sleep log'};
  const W=orderedWeeks();if(!asked.length){$('#retOut').innerHTML='<p class="hint">No sheet is ticked on the Setup page.</p>';return;}
  let h='<div class="grid-wrap"><table class="rt"><thead><tr><th>Week</th>'+asked.map(k=>'<th>'+names[k]+'</th>').join('')+'<th>Completeness</th><th>Note</th></tr></thead><tbody>';
  W.forEach(o=>{const c=completeness(o.w);h+='<tr><td class="lk">Week '+(o.i+1)+(o.w.start?' · '+esc(o.w.start):'')+'</td>'+asked.map(k=>'<td class="num">'+(o.w['r_'+k]?'back':'—')+(k==='abc'&&o.w.n_abc?' ('+esc(o.w.n_abc)+')':'')+(k==='sleep'&&o.w.n_sleep?' ('+esc(o.w.n_sleep)+' nights)':'')+'</td>').join('')+'<td class="num">'+(c.p==null?'—':pct(c.p))+'</td><td>'+esc(o.w.note)+'</td></tr>';});
  const tot=asked.map(k=>S.wk.filter(w=>w['r_'+k]).length);
  h+='<tr class="tot"><td>Weeks back</td>'+tot.map(t=>'<td class="num">'+t+' of '+S.wk.length+'</td>').join('')+'<td colspan="2"></td></tr></tbody></table></div>';
  $('#retOut').innerHTML=h;}

/* ---------------- the home sheets ---------------- */
function kid(){return S.meta.nick||S.meta.client||'';}
function hsHead(title,who){return '<div class="hs-title">'+esc(title)+'</div><div class="hs-who"><span>Child: <span class="bl">'+esc(kid())+'</span></span><span>Week of: <span class="bl" style="min-width:120px">'+esc(S.meta.sh_week||'')+'</span></span><span>Filled in by: <span class="bl">'+esc(who||'')+'</span></span></div>';}
function hsPlan(){const lines=[];S.bh.forEach(b=>{if(b.name&&b.todo)lines.push('<p class="hs-line"><b>If '+esc(b.name.toLowerCase())+' happens:</b> '+esc(b.todo)+'</p>');});if(S.meta.todo)lines.push('<p class="hs-line"><b>When a behavior happens:</b> '+esc(S.meta.todo)+'</p>');return lines.join('');}
function hsFoot(){const f=S.meta.freq?'Send the sheet back: '+esc(S.meta.freq.toLowerCase())+(S.meta.ret_how?', '+esc(S.meta.ret_how.toLowerCase()):'')+'.':'';
  return '<div class="hs-end">'+hsPlan()+'<div class="hs-sig"><span>Signed: <span class="bl"></span></span><span>Date: <span class="bl" style="min-width:110px"></span></span></div><div class="hs-foot"><span>'+f+(S.meta.call?' Questions? Call '+esc(S.meta.call)+'.':'')+(S.meta.urgent?' Call right away if '+esc(S.meta.urgent)+'.':'')+'</span><span>Form HD-1</span></div></div>';}
function cellMark(ms){return ms==='yn'?'Y &nbsp; N':ms==='dur'?'___ min':ms==='rate'?'0 1 2 3':'';}
function exMark(ms,di){const t=['||','|','','|||','|','','||'],d=['5','0','','12','3','','8'],r=['1','0','','3','1','','2'],y=['Y','N','','Y','Y','','N'];return ms==='yn'?y[di]:ms==='dur'?(d[di]?d[di]+' min':''):ms==='rate'?r[di]:t[di];}
function exTotal(ms){return ms==='yn'?'3 Y':ms==='dur'?'28 min':ms==='rate'?'7':'9';}
function renderSheets(){
  const out=$('#sheetOut'),D=dayIdx(),R=rtOn(),B=S.bh.filter(b=>b.name);const who=S.meta.cg||'';let h='';
  if(!B.length){out.innerHTML='<p class="hint" style="padding:14px">Name a behavior on the Setup page and tick the sheets to send; they appear here.</p>';return;}
  const dayHead=D.map(di=>'<th>'+DAYS[di]+'</th>').join('');
  if(S.chk.tally){
    h+='<div class="hs">'+hsHead('Home Tally Sheet',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>At the end of each routine, find its row and the day&rsquo;s column.</li>'+
      B.map(b=>'<li><b>'+esc(b.name)+':</b> '+(b.ms==='tally'?'make one mark (|) each time it happens.':b.ms==='yn'?'circle Y if it happened at all, N if it did not.':b.ms==='dur'?'write how many minutes it lasted, all together.':'circle one number: 0 none, 1 a little, 2 some, 3 a lot.')+' Counts: '+esc(b.ex)+'. Does not count: '+esc(b.nex)+'.</li>').join('')+
      '<li>If you forget a routine, leave it blank. A blank is better than a guess.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:14%">Behavior</th><th style="width:16%">Routine</th>'+dayHead+'<th style="width:8%">Total</th></tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example</td><td class="sub">'+esc(R[0]?R[0].label:'Morning')+'</td>'+D.map(di=>'<td>'+esc(exMark(B[0].ms,di))+'</td>').join('')+'<td>'+exTotal(B[0].ms)+'</td></tr>'+
      B.map(b=>R.map((r,k)=>'<tr>'+(k===0?'<td class="lab" rowspan="'+R.length+'">'+esc(b.name)+'</td>':'')+'<td class="sub">'+esc(r.label)+(r.time?'<br><span style="font-size:11.5px;color:#444;line-height:1.2;display:inline-block">'+esc(r.time)+'</span>':'')+'</td>'+D.map(()=>'<td class="hc">'+cellMark(b.ms)+'</td>').join('')+(k===0?'<td class="tot" rowspan="'+R.length+'"></td>':'')+'</tr>').join('')).join('')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  if(S.chk.check){
    const steps=S.sk.filter(s=>s.label);const groups=R.map(r=>({r,st:steps.filter(s=>s.rt===''||String(s.rt)===String(r.i))})).filter(g=>g.st.length);
    h+='<div class="hs">'+hsHead('Routine Checklist',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>After each routine, read the steps under it.</li><li>Circle <b>Y</b> if the step happened, <b>N</b> if it did not. &ldquo;Adult&rdquo; steps are the ones you do; &ldquo;Child&rdquo; steps are the ones '+esc(kid()||'your child')+' does.</li><li>An N is not a bad mark. It tells us which steps are hard to fit in, so we can change them.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:40%">Step</th>'+dayHead+'</tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example: '+esc(steps[0]?steps[0].label:'Show the picture schedule')+' (Adult)</td>'+D.map(di=>'<td>'+['Y','Y','','N','Y','','Y'][di]+'</td>').join('')+'</tr>'+
      (groups.length?groups.map(g=>'<tr class="grp"><td colspan="'+(D.length+1)+'">'+esc(g.r.label)+(g.r.time?' <span style="font-weight:400;font-size:13px">('+esc(g.r.time)+')</span>':'')+'</td></tr>'+g.st.map(s=>'<tr><td class="sub">'+esc(s.label)+' <span style="color:#444;font-size:13px">('+esc(s.who)+')</span></td>'+D.map(()=>'<td class="hc">Y &nbsp; N</td>').join('')+'</tr>').join('')).join(''):'<tr><td colspan="'+(D.length+1)+'" class="sub">(No steps yet: add them on the Setup page.)</td></tr>')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  if(S.chk.abc){
    const n=Math.max(1,Math.min(6,num(S.meta.sh_abc)||3)),A=abcA(),C=abcC();
    const block=(ex)=>'<div class="abc'+(ex?' ex':'')+'"><div class="abc-head">'+(ex?'<span><b>Example</b></span>':'')+'<span>Date: <span class="bl">'+(ex?'Tue':'')+'</span></span><span>Time: <span class="bl" style="min-width:80px">'+(ex?'5:40 pm':'')+'</span></span><span>Routine: <span class="bl">'+(ex?esc(R[0]?R[0].label:'Dinner'):'')+'</span></span></div>'+
      '<div class="abc-cols"><div><b>Before: what was happening?</b>'+A.map((a,i)=>'<div class="it"><span class="bx">'+(ex&&i===0?'&#10003;':'')+'</span>'+esc(a)+'</div>').join('')+'</div>'+
      '<div><b>What '+esc(kid()||'the child')+' did</b>'+B.map((b,i)=>'<div class="it"><span class="bx">'+(ex&&i===0?'&#10003;':'')+'</span>'+esc(b.name)+'</div>').join('')+'<div class="it" style="margin-top:6px">How long or how many: <u>'+(ex?'&nbsp;2 times&nbsp;':'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+'</u></div></div>'+
      '<div><b>After: what happened next?</b>'+C.map((c,i)=>'<div class="it"><span class="bx">'+(ex&&i===5?'&#10003;':'')+'</span>'+esc(c)+'</div>').join('')+'</div></div>'+
      '<div class="abc-free">In a few words: <span class="bl">'+(ex?'Asked him to turn off the tablet for dinner. He hit his brother twice. I said “hands down”, helped him to the table, no tablet.':'')+'</span></div></div>';
    h+='<div class="hs">'+hsHead('ABC Notes: What Happened Before and After',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>Use one box each time a behavior on the list happens and you have a minute afterward.</li><li>Tick what was going on just before, what '+esc(kid()||'your child')+' did, and what happened right after. Tick more than one if you need to.</li><li>Write one line in your own words. You do not have to explain why.</li></ol></div>'+
      block(true)+Array.from({length:n},()=>block(false)).join('')+hsFoot()+'</div>';
  }
  if(S.chk.sleep){
    h+='<div class="hs">'+hsHead('Sleep Log',who)+
      '<div class="hs-box"><b>How to fill this in</b><ol><li>Fill in the row each morning, for the night just finished. Your best guess is fine.</li><li><b>Lights out</b> is when the room went dark. <b>Fell asleep</b> is about when '+esc(kid()||'your child')+' was asleep.</li><li><b>Woke in the night</b>: how many times, and about how long in all. Write 0 if none.</li><li><b>Nap</b>: how long, if there was one that day. <b>Notes</b>: sick, late dinner, a hard evening, anything you noticed.</li></ol></div>'+
      '<table class="hs-t"><thead><tr><th style="width:12%">Night</th><th>Lights out</th><th>Fell asleep</th><th style="width:19%">Woke in the night<br><span style="font-weight:400;font-size:13px">times / how long</span></th><th>Woke up for the day</th><th>Nap</th><th style="width:22%">Notes</th></tr></thead><tbody>'+
      '<tr class="ex"><td class="lab">Example</td><td>8:15 pm</td><td>9:00 pm</td><td>1 time / 20 min</td><td>6:30 am</td><td>none</td><td class="sub">Cousins visited; late dinner</td></tr>'+
      D.map(di=>'<tr><td class="lab">'+DAYS[di]+'</td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td><td class="hc"></td></tr>').join('')+
      '</tbody></table>'+hsFoot()+'</div>';
  }
  out.innerHTML=h||'<p class="hint" style="padding:14px">Tick at least one sheet on the Setup page.</p>';
}

/* ---------------- setup verdict ---------------- */
function renderSetup(){
  const m=S.meta,out=[];const B=S.bh.filter(b=>b.name);
  if(!B.length)out.push('Name at least one behavior in the family&rsquo;s words.');
  B.forEach(b=>{if(!b.ex||!b.nex)out.push('<b>'+esc(b.name)+'</b> needs an example and a non-example, or two people will mark it differently.');if(!b.todo&&!m.todo)out.push('<b>'+esc(b.name)+'</b> has no line from the plan; the family will ask what to do when it happens.');});
  if(B.length>4)out.push('More than four behaviors on one sheet is more than most families return; split the sheet or drop one.');
  if(!rtOn().length)out.push('No routine is ticked for the sheets.');
  if(S.chk.check&&!S.sk.some(s=>s.label))out.push('The checklist is ticked but has no steps.');
  if(!m.freq||!m.ret_how)out.push('Say how often the sheet comes back and how; it prints on the sheet.');
  if(!m.call)out.push('Say who to call; it prints on the sheet.');
  if(!m.taught)out.push('Plan how the family is taught the sheet (one practice day together, as a working convention).');
  $('#setupVerdict').innerHTML=out.length?'<div class="verdict v-mid">'+out.map(x=>'<div>'+x+'</div>').join('')+'</div>':(m.client?'<div class="verdict v-ok"><b>Ready to print.</b> The Home sheets page shows what the family will hold.</div>':'');
}

/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.e!==undefined){week().cells[el.dataset.e]=el.value;updateTotals();return;}
  if(el.dataset.w!==undefined&&el.type!=='checkbox'){week()[el.dataset.w]=el.value;renderWkSel();renderEntTotals();return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'&&el.tagName!=='SELECT'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;
    if(el.dataset.r==='ag'){const tr=el.closest('tr');const a=agree(S.ag[+el.dataset.i]);tr.children[6].textContent=a==null?'—':pct(a);renderAgM();}
    else{renderSheetsSoon();if(el.dataset.r==='bh'||el.dataset.r==='rt')renderEntSoon();}
    return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(nick|client|cg|todo|call|urgent|abc_|sh_)/.test(el.dataset.m))renderSheetsSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.e!==undefined){week().cells[el.dataset.e]=el.value;updateTotals();return;}
  if(el.dataset.w!==undefined&&el.type==='checkbox'){week()[el.dataset.w]=el.checked;renderEntTotals();return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){const v=el.type==='checkbox'?el.checked:el.value;S[el.dataset.r][+el.dataset.i][el.dataset.f]=v;
    if(el.dataset.r==='ag'){renderAg();renderAgM();return;}
    if(el.dataset.r==='bh'&&el.dataset.f==='ms'){renderEnt();renderAg();}
    if(el.dataset.r==='rt'){renderK();renderAg();renderEnt();}
    renderSheets();renderSetup();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderSheets();renderSetup();renderEntTotals();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderSheets();renderSetup();if(el.dataset.m==='sh_days')renderEnt();}
});
let shT=0,enT=0;function renderSheetsSoon(){clearTimeout(shT);shT=setTimeout(()=>{renderSheets();renderSetup();},250);}function renderEntSoon(){clearTimeout(enT);enT=setTimeout(()=>{renderEnt();renderAg();},400);}
$('#addB').addEventListener('click',()=>{if(S.bh.length>=6)return;S.bh.push({name:'',ex:'',nex:'',ms:'tally',todo:''});renderB();renderAg();renderEnt();renderSheets();renderSetup();});
$('#delB').addEventListener('click',async ()=>{if(S.bh.length<=1)return;const r=S.bh[S.bh.length-1];if((r.name||r.ex)&&!(await nbhUI.confirm('Remove the last behavior?\nIts name, examples and the cells recorded for it are deleted.',{ok:'Remove',danger:true})))return;S.bh.pop();renderB();renderAg();renderEnt();renderSheets();renderSetup();});
$('#addR').addEventListener('click',()=>{if(S.rt.length>=10)return;S.rt.push({label:'',time:'',on:true,note:''});renderR();renderK();renderAg();renderEnt();renderSheets();});
$('#delR').addEventListener('click',async ()=>{if(S.rt.length<=1)return;const r=S.rt[S.rt.length-1];if(r.label&&!(await nbhUI.confirm('Remove the last routine?\nIts label and the cells recorded for it are deleted.',{ok:'Remove',danger:true})))return;S.rt.pop();renderR();renderK();renderAg();renderEnt();renderSheets();});
$('#addK').addEventListener('click',()=>{if(S.sk.length>=12)return;S.sk.push({label:'',who:'Adult',rt:''});renderK();renderSheets();});
$('#delK').addEventListener('click',async ()=>{if(S.sk.length<=1)return;const r=S.sk[S.sk.length-1];if(r.label&&!(await nbhUI.confirm('Remove the last step?\nThe checklist step is deleted.',{ok:'Remove',danger:true})))return;S.sk.pop();renderK();renderSheets();renderSetup();});
$('#addAg').addEventListener('click',()=>{S.ag.push({date:'',rt:'',bh:'',staff:'',home:'',note:''});renderAg();renderAgM();});
$('#delAg').addEventListener('click',async ()=>{if(!S.ag.length)return;const r=S.ag[S.ag.length-1];if((r.date||r.staff)&&!(await nbhUI.confirm('Remove the last check?\nThe agreement check and its two counts are deleted.',{ok:'Remove',danger:true})))return;S.ag.pop();renderAg();renderAgM();});
/* the week cells are keyed b<behavior>_r<routine>_d<day>, the checklist steps and agreement checks by routine and
   behavior index, so a deletion drops the dependent cells and re-keys the rest instead of letting them shift */
function cellCount(part,i){let n=0;S.wk.forEach(w=>Object.keys(w.cells).forEach(k=>{const m=/^b(\d+)_r(\d+)_d\d$/.exec(k);if(m&&+m[part==='b'?1:2]===i&&String(w.cells[k]).trim()!=='')n++;}));return n;}
function rekeyCells(part,i){S.wk.forEach(w=>{const c={};Object.keys(w.cells).forEach(k=>{const m=/^b(\d+)_r(\d+)_(d\d)$/.exec(k);if(!m){c[k]=w.cells[k];return;}let b=+m[1],r=+m[2];if(part==='b'){if(b===i)return;if(b>i)b--;}else{if(r===i)return;if(r>i)r--;}c['b'+b+'_r'+r+'_'+m[3]]=w.cells[k];});w.cells=c;});}
async function rowDel(r,i){const row=S[r]&&S[r][i];if(!row)return;
  if(r==='bh'){const cells=cellCount('b',i),ag=S.ag.filter(a=>String(a.bh)===String(i)).length;
    if((row.name||row.ex||row.nex||row.todo||cells||ag)&&!(await nbhUI.confirm('Delete this behavior?'+(cells?'\nIts '+cells+' typed-in cell'+(cells===1?'':'s')+' in the week grids will be removed.':'')+(ag?' '+ag+' agreement check'+(ag===1?'':'s')+' for it will be removed.':'')+(cells||ag?' Later behaviors move up.':''),{ok:'Delete',danger:true})))return;
    S.bh.splice(i,1);rekeyCells('b',i);S.ag=S.ag.filter(a=>String(a.bh)!==String(i));S.ag.forEach(a=>{if(a.bh!==''&&+a.bh>i)a.bh=String(+a.bh-1);});
    if(!S.bh.length)S.bh.push({name:'',ex:'',nex:'',ms:'tally',todo:''});renderB();renderAg();renderEnt();renderSheets();renderSetup();}
  else if(r==='rt'){const cells=cellCount('r',i),sk=S.sk.filter(s=>String(s.rt)===String(i)).length;
    if((row.label||row.note||cells||sk)&&!(await nbhUI.confirm('Delete this routine?'+(cells?'\nIts '+cells+' typed-in cell'+(cells===1?'':'s')+' in the week grids will be removed.':'')+(sk?' '+sk+' checklist step'+(sk===1?'':'s')+' tied to it will apply to every routine.':'')+(cells||sk?' Later routines move up.':''),{ok:'Delete',danger:true})))return;
    S.rt.splice(i,1);rekeyCells('r',i);const rk=o=>{if(o.rt===''||o.rt==null)return;const v=+o.rt;if(v===i)o.rt='';else if(v>i)o.rt=String(v-1);};S.sk.forEach(rk);S.ag.forEach(rk);
    if(!S.rt.length)S.rt.push({label:'',time:'',on:true,note:''});renderR();renderK();renderAg();renderEnt();renderSheets();renderSetup();}
  else if(r==='sk'){if(row.label&&!(await nbhUI.confirm('Delete this row?\nThe checklist step it holds is deleted.',{ok:'Delete',danger:true})))return;S.sk.splice(i,1);if(!S.sk.length)S.sk.push({label:'',who:'Adult',rt:''});renderK();renderSheets();renderSetup();}
  else if(r==='ag'){if((row.date||row.staff||row.home||row.note)&&!(await nbhUI.confirm('Delete this row?\nThe agreement check it holds is deleted.',{ok:'Delete',danger:true})))return;S.ag.splice(i,1);renderAg();renderAgM();}
}
$('#wkSel').addEventListener('change',e=>{curWk=+e.target.value;bindWeek();renderEnt();});
$('#addWk').addEventListener('click',()=>{if(S.wk.length>=26)return;S.wk.push(newWeek());curWk=S.wk.length-1;renderWkSel();bindWeek();renderEnt();});
$('#delWk').addEventListener('click',async ()=>{if(S.wk.length<=1){if(await nbhUI.confirm('Clear this week?\nEverything typed into the week grid is removed.',{ok:'Clear',danger:true})){S.wk[0]=newWeek();renderWkSel();bindWeek();renderEnt();}return;}const k=curWk;if(!(await nbhUI.confirm('Remove week '+(k+1)+'?\nEverything typed into it is deleted.',{ok:'Remove',danger:true})))return;S.wk.splice(k,1);curWk=Math.max(0,k-1);renderWkSel();bindWeek();renderEnt();});

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();renderB();renderR();renderK();renderAg();renderWkSel();bindWeek();renderEnt();renderSheets();renderSetup();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#sheetPrintBtn').addEventListener('click',()=>{if(!S.bh.some(b=>b.name)||!$('#sheetOut .hs')){alert('Name a behavior and tick a sheet on the Setup page first; there is nothing to print yet.');return;}
  document.body.classList.add('hd-sheets-only');
  const st=document.createElement('style');st.id='hdSheetPage';st.textContent='@media print{@page{size:letter portrait;margin:0.5in}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('hd-sheets-only');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'HD-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`HD-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='HD-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});if(s.chk&&typeof s.chk==='object'&&!Array.isArray(s.chk)){o.chk={};Object.keys(s.chk).forEach(k=>{o.chk[k]=!!s.chk[k];});}
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n||50).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='on'||/^r_/.test(f)?!!(x&&x[f]):str(x&&x[f]);});return r;}):[];
  o.bh=arr('bh',['name','ex','nex','ms','todo'],6);o.bh.forEach(b=>{if(!MEAS[b.ms])b.ms='tally';});
  o.rt=arr('rt',['label','time','on','note'],10);o.sk=arr('sk',['label','who','rt'],12);o.sk.forEach(k=>{if(k.who!=='Child')k.who='Adult';});
  o.ag=arr('ag',['date','rt','bh','staff','home','note'],200);
  o.wk=Array.isArray(s.wk)?s.wk.slice(0,26).map(x=>{const w=newWeek();if(!x||typeof x!=='object')return w;['start','n_abc','n_sleep','note'].forEach(f=>{w[f]=str(x[f]);});['sent','due','back'].forEach(f=>{const v=str(x[f]);w[f]=/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';});['r_tally','r_check','r_abc','r_sleep'].forEach(f=>{w[f]=!!x[f];});
    if(x.cells&&typeof x.cells==='object'&&!Array.isArray(x.cells))Object.keys(x.cells).forEach(k=>{if(/^b\d+_r\d+_d[0-6]$/.test(k))w.cells[k]=str(x.cells[k]);});return w;}):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='HD-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved HD-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form HD-1. Nothing was changed.':'That file could not be read as a saved HD-1 form. Nothing was changed.');return;}
    const prev=S;S=next;curWk=0;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved HD-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';const D=dayIdx(),R=rtOn();
  const out=[['Week','Week start','Day','Behavior','Measure','Routine','Value']];
  S.wk.forEach((w,wi)=>{S.bh.forEach((b,bi)=>{D.forEach(di=>{R.forEach(r=>{const v=w.cells[cellKey(bi,r.i,di)];if(v!=null&&String(v).trim()!=='')out.push([wi+1,w.start,DAYS[di],b.name,b.ms,r.label,v]);});const t=dayTotal(w,bi,di);if(t.v!=null)out.push([wi+1,w.start,DAYS[di],b.name,b.ms,'Day total',t.txt]);});});});
  out.push([]);out.push(['Agreement check','Date','Routine','Behavior','Staff saw','Family wrote','Agreement %','Note']);
  S.ag.forEach((r,i)=>{const a=agree(r);out.push([i+1,r.date,(S.rt[+r.rt]||{}).label||'',(S.bh[+r.bh]||{}).name||'',r.staff,r.home,a==null?'':a.toFixed(1),r.note]);});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='HD-1_home-data.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();curWk=0;renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated family?\nEvery page is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;
  const mon=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)-7*n);return d;};
  const Y=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+String(d.getFullYear()).slice(2);const off=(d,k)=>{const x=new Date(d);x.setDate(x.getDate()+k);return x;};
  S=blank();curWk=0;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',nick:'Sam',cg:'Ms. Rivera (mother) on school days; Mr. Rivera (father) on weekends',cg_contact:'555-0142 (text is best)',lang:'English and Spanish; Ms. Rivera reads English, the sheets stay in English',
    plan:'BIP dated '+Y(mon(5))+' (Form TD-1); behaviors from TB-1',question:'Does hitting happen at home, in which routines, and does a short night predict a hard morning?',bcba:'Joshua Newsome, M.A., BCBA',date:Y(off(mon(4),-3)),start:Y(mon(3)),review:Y(off(mon(0),4)),
    abc_a:'',abc_c:'',freq:'Every Friday',ret_how:'A photo of the sheet by text message',todo:'Stay calm and use few words. Follow the line for that behavior, then go back to the routine. Mark the sheet after, not during.',
    call:'Joshua Newsome, 555-0100, school days 8 to 4; after hours leave a message',urgent:'anyone is hurt, or a tantrum lasts more than 20 minutes; for an emergency call 911 (Form CR-1)',
    taught:'Twenty minutes at pickup on '+Y(off(mon(3),-3))+': went through the sheet, filled in the practice row together, Ms. Rivera marked one made-up day; a text the first evening to ask how it went (Form CT-1)',feedback:'A photo of the graph and two sentences by text every Friday evening; thanks at every return',
    sh_week:Y(mon(0)),sh_days:'',sh_abc:'3',decision:'Three weeks in: hitting is almost all at homework and bedtime, 2 to 5 a day in week 1 falling to 0 to 2 in week 3 once the timer and the choice of order went in. Tantrum minutes fell with it. Fussing is rated 2 to 3 at bedtime and 0 to 1 elsewhere, and the hard mornings follow the short nights on the sleep log. Decision at the review: keep the tally and sleep log, drop the checklist to two steps, and add the bedtime routine to the plan (Form TD-1).',
    sv:'Ms. Rivera: “the sheet on the fridge is fine; the ABC boxes took too long on a bad night.” She wants to keep the tally sheet.'};
  S.chk={tally:true,check:true,abc:true,sleep:true};
  S.bh=[{name:'Hitting',ex:'an open or closed hand lands on a person, any force',nex:'hitting a pillow, the table or a toy',ms:'tally',todo:'Block, say “hands down”, help with the next step; no talking about it after'},
    {name:'Tantrum (crying or screaming more than a minute)',ex:'crying, screaming or dropping to the floor that goes on for more than a minute',nex:'a whine or one shout that stops on its own',ms:'dur',todo:'Say “you can have a break” once, step back, stay nearby; when it stops, go back to the step with no more talk'},
    {name:'Fussing (whining, arguing, refusing)',ex:'whining, arguing back or saying no and not moving, for any part of the routine',nex:'asking a question once, or a sad face with no words',ms:'rate',todo:'Say the step once, wait 10 seconds, then help him through it with no more words; 0 none, 1 a little, 2 some, 3 most of the routine'}];
  S.rt=[{label:'Morning',time:'getting up to the car',on:true,note:''},{label:'Meals',time:'breakfast and dinner',on:true,note:'count both meals together'},{label:'Homework',time:'after snack, 20 minutes',on:true,note:''},{label:'Bedtime',time:'bath to lights out',on:true,note:''},{label:'Outings',time:'store, car, visits',on:true,note:'leave blank on a day with no outing'}];
  S.sk=[{label:'Show the picture schedule before the routine starts',who:'Adult',rt:''},{label:'Let Sam choose which part to do first',who:'Adult',rt:'2'},{label:'Set the timer: 10 minutes of work, then a 3-minute break',who:'Adult',rt:'2'},{label:'Ask for a break with the card or the words “break please”',who:'Child',rt:''},{label:'Praise within a minute of starting a step',who:'Adult',rt:''},{label:'Same order every night: bath, pajamas, two books, lights out',who:'Adult',rt:'3'}];
  const hit=[[2,3,4,2,3,1,2],[1,2,2,1,2,1,0],[0,1,1,0,1,0,0]],tan=[[15,25,30,10,20,5,12],[8,12,10,6,9,0,4],[0,6,4,0,3,0,0]],bed=[[2,3,2,1,2,3,2],[2,2,1,1,2,2,1],[1,2,1,0,1,2,1]];
  const split=(n,parts)=>{const o=parts.map(()=>0);let k=0;for(let i=0;i<n;i++){o[parts[k%parts.length]]++;k++;}return o;};
  S.wk=[0,1,2].map(wi=>{const w=newWeek();w.start=Y(mon(3-wi));w.sent=nbhHdIso(off(mon(3-wi),-3));w.due=nbhHdIso(off(mon(3-wi),4));w.back=nbhHdIso(off(mon(3-wi),wi===1?7:4));w.r_tally=true;w.r_check=wi<2;w.r_abc=wi===0;w.r_sleep=true;w.n_abc=wi===0?'4':'';w.n_sleep=String([7,6,7][wi]);
    w.note=['Full week; ABC notes for the four worst moments, all at homework or bedtime','Checklist back with Thursday blank (late pickup); Sunday outing not marked','Checklist not sent (dropped by agreement); tally and sleep log full'][wi];
    for(let di=0;di<7;di++){const skipOut=(di===1||di===3||di===4);const parts=skipOut?[2,3,0]:[2,3,4,0];const h=split(hit[wi][di],parts);
      [0,1,2,3,4].forEach(ri=>{if(ri===4&&skipOut)return;if(ri===1&&wi===1&&di===3)return;w.cells[cellKey(0,ri,di)]=String(h[ri]||0);
        const mins=ri===2?Math.round(tan[wi][di]*0.6):ri===3?Math.round(tan[wi][di]*0.4):0;w.cells[cellKey(1,ri,di)]=String(mins);
        const f=ri===3?bed[wi][di]:ri===2?Math.min(3,bed[wi][di]):Math.max(0,bed[wi][di]-2+(di%2));w.cells[cellKey(2,ri,di)]=String(f);});}
    return w;});
  S.ag=[{date:Y(off(mon(3),3)),rt:'2',bh:'0',staff:'3',home:'3',note:'BCBA home visit at homework; both counted 3'},{date:Y(off(mon(3),3)),rt:'2',bh:'1',staff:'20',home:'25',note:'Ms. Rivera counted from the first cry; staff from the drop to the floor'},
    {date:Y(off(mon(2),2)),rt:'3',bh:'2',staff:'2',home:'2',note:'Phone call during bedtime; same rating for fussing'},{date:Y(off(mon(1),1)),rt:'2',bh:'0',staff:'1',home:'1',note:'Video call at homework'}];
  renderAll();setView('sheets');
  nbhUI.toast('Simulation loaded: '+'a simulated family: a second-grader with three behaviors across five routines and four home sheets.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.31 the case: hooks. An empty behavior table takes the target behaviors from Form TB-1, with
   their examples and non-examples as the plain-words "what counts"; the picker adds rows. */
const nbhHdRow=b=>({name:b.label||'',ex:b.ex||b.def||'',nex:b.nex||'',ms:'tally',todo:''});
window.__nbhFactsIn=function(f){
  const behs=f.behaviors||[];if(!behs.length||!S.bh.every(b=>!b.name))return {filled:0};
  S.bh=behs.slice(0,4).map(nbhHdRow);renderAll();return {filled:S.bh.length};
};
window.__nbhFactsPick=function(sel){
  let n=0;sel.behaviors.forEach(b=>{if(S.bh.some(x=>x.name===b.label))return;const slot=S.bh.find(x=>!x.name);if(slot)Object.assign(slot,nbhHdRow(b));else S.bh.push(nbhHdRow(b));n++;});
  sel.goals.acq.forEach(g=>{if(S.bh.some(x=>x.name===g.beh))return;S.bh.push({name:g.beh,ex:g.cond?'given '+g.cond:'',nex:'',ms:'yn',todo:''});n++;});
  if(n)renderAll();return {filled:n};
};

/* v21.78 the home data for the case (Form DD-1 brings the days in as a home series; the review reads the dates): each
   sheet sent, with the week's Sent home / Due back / Came back dates, and every day total the family wrote, dated from
   the week's Monday. Nothing typed in: null. */
const nbhHdIso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function nbhHdMon(t){t=String(t||'').trim();let d=null,m;
  if((m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)))d=new Date(+m[1],+m[2]-1,+m[3],12);
  else if((m=/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(t))){const y=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):new Date().getFullYear();d=new Date(y,+m[1]-1,+m[2],12);}
  if(!d||isNaN(d)||d.getMonth()!==((m&&m[1].length===4)?+m[2]-1:+m[1]-1))return null;d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
const NBH_HD_UNIT={tally:'times',dur:'minutes',rate:'rating 0 to 3',yn:'routines with a yes'};
window.__nbhFactsOut=function(){try{ensure();
  const names={tally:'Tally sheet',check:'Routine checklist',abc:'ABC notes',sleep:'Sleep log'},asked=['tally','check','abc','sleep'].filter(k=>S.chk[k]);
  const sheets=[],data=[],D=dayIdx();
  S.wk.forEach((w,wi)=>{const mon=nbhHdMon(w.start),iso=mon?nbhHdIso(mon):'',used=iso||w.sent||w.due||w.back||Object.keys(w.cells).some(k=>String(w.cells[k]).trim()!=='');if(!used)return;
    const anyBack=['r_tally','r_check','r_abc','r_sleep'].some(k=>w[k]);
    asked.forEach(k=>{const o={name:names[k]+(w.start?' · week of '+w.start:' · week '+(wi+1)),kind:k};if(iso)o.week=iso;if(w.sent)o.sent=w.sent;if(w.due)o.due=w.due;
      const came=!!w['r_'+k]||(!anyBack&&!!w.back);if(came&&w.back)o.back=w.back;o.returned=came;sheets.push(o);});
    if(!mon)return;
    S.bh.forEach((b,bi)=>{if(!b.name)return;D.forEach(di=>{const t=dayTotal(w,bi,di);if(t.v==null)return;const d=new Date(mon);d.setDate(d.getDate()+di);
      const r={date:nbhHdIso(d),beh:b.name,value:Math.round(t.v*100)/100,unit:NBH_HD_UNIT[b.ms]||'',measure:b.ms};if(b.ms==='yn')r.of=t.n;data.push(r);});});});
  if(!sheets.length&&!data.length){if(!S.bh.some(b=>b.name)||!asked.length)return null;asked.forEach(k=>sheets.push({name:names[k],kind:k}));}
  return {home:{sheets,data,src:'HD-1'}};
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
