const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace('%',''));return isFinite(n)?n:null;};
const NONE='–';

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- v21.33: save a graph as a PNG (the SVG serialised and drawn on a canvas at 2x) ---- */
function graphFile(id,who){const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');return id+'_graph_'+((String(who||'').trim()||'student').replace(/\s+/g,'_').replace(/[^\w-]+/g,'').replace(/_+/g,'_')||'student')+'_'+ymd+'.png';}
function svgToPng(svg,fname){if(!svg)return;const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);const W=vb[2]||svg.clientWidth||900,H=vb[3]||svg.clientHeight||320;
  const c=svg.cloneNode(true);c.setAttribute('width',W);c.setAttribute('height',H);c.removeAttribute('id');c.removeAttribute('class');c.removeAttribute('style');if(!c.getAttribute('font-family'))c.setAttribute('font-family','system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml;charset=utf-8'}));const im=new Image();
  im.onload=()=>{const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);
    cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname;document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),0);},'image/png');};
  im.onerror=()=>{URL.revokeObjectURL(url);alert('The graph could not be drawn as an image.');};im.src=url;}

/* ---------------- the scale, as published (Iwata, Pace, Kissel, Nau, & Farber, 1990, Figure 1) ---------------- */
const GROUPS=[['head','Head'],['ut','Upper torso'],['lt','Lower torso'],['ext','Extremities']];
const GNAME=Object.fromEntries(GROUPS);
const LOCS=[
  ['scalp','Scalp','head'],['ear_L','Ear (L)','head'],['ear_R','Ear (R)','head'],['eye_L','Eye (L)','head'],['eye_R','Eye (R)','head'],['eyearea_L','Eye area (L)','head'],['eyearea_R','Eye area (R)','head'],['face','Face','head'],['nose','Nose','head'],['lips','Lips/tongue','head'],['neck','Neck/throat','head'],
  ['shoulder_L','Shoulder (L)','ut'],['shoulder_R','Shoulder (R)','ut'],['chest','Chest/stomach','ut'],['back','Back','ut'],
  ['abdomen','Abdomen/pelvis','lt'],['hips','Hips/buttocks','lt'],['genitalia','Genitalia','lt'],['rectum','Rectum','lt'],
  ['uarm_L','Upper arm/elbow (L)','ext'],['uarm_R','Upper arm/elbow (R)','ext'],['larm_L','Lower arm/wrist (L)','ext'],['larm_R','Lower arm/wrist (R)','ext'],['hand_L','Hand/finger (L)','ext'],['hand_R','Hand/finger (R)','ext'],
  ['uleg_L','Upper leg/knee (L)','ext'],['uleg_R','Upper leg/knee (R)','ext'],['lleg_L','Lower leg/ankle (L)','ext'],['lleg_R','Lower leg/ankle (R)','ext'],['foot_L','Foot/toe (L)','ext'],['foot_R','Foot/toe (R)','ext']
].map(x=>({id:x[0],name:x[1],region:x[2]}));
const LOC=Object.fromEntries(LOCS.map(l=>[l.id,l]));
const EYES=['eye_L','eye_R','eyearea_L','eyearea_R'];
const NUMS=[['1','1: one wound'],['2','2: two to four wounds'],['3','3: five or more wounds']];
const TYPES=[['AL','AL: abrasion or laceration'],['CT','CT: contusion']];
const SEVS={AL:[['1','1: red or irritated, only spotted breaks in the skin'],['2','2: distinct but superficial break; no avulsion'],['3','3: deep or extensive break, or avulsion']],
            CT:[['1','1: local swelling only, or discoloration without swelling'],['2','2: extensive swelling'],['3','3: disfigurement or tissue rupture']]};
const HEALED=['Scar','Permanent disfigurement','Missing body part','Other'];
const EVKINDS=['Restraint','Injury report','Other'];
const RISK=['Low','Moderate','High'];

/* ---------------- state ---------------- */
const admBlank=()=>({id:'',date:'',time:'',examiner:'',note:'',ro:false,rows:[]});
function blank(){return{meta:{},chk:{},healed:[],events:[],cur:admBlank(),hist:[],nurse:[]};}
let S=blank(),SEL=null;
const uid=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  ['healed','events','hist','nurse'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  if(!S.cur||typeof S.cur!=='object')S.cur=admBlank();if(!Array.isArray(S.cur.rows))S.cur.rows=[];
  S.hist.forEach(h=>{if(!Array.isArray(h.rows))h.rows=[];if(!h.id)h.id=uid();});
}
/* dates as the sheets write them (M/D/YYYY, M/D/YY) or ISO; anything else is not a date */
function pDate(s){s=String(s||'').trim();let m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[1]-1,+m[2],12);}
  m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3],12);return null;}
const MDY=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
const today=()=>MDY(new Date());
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const DAY=864e5;

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- Part III: the scoring summary of a set of Part II rows ---------------- */
function score(rows){
  const R=(rows||[]).filter(r=>LOC[r.loc]);
  let total=0,noN=0,noS=0;const f={1:0,2:0,3:0},grp={head:0,ut:0,lt:0,ext:0};
  R.forEach(r=>{const n=num(r.n);if(n==null)noN++;else total+=n;const s=String(r.sev||'');if(r.type&&f[s]!=null)f[s]++;else noS++;grp[LOC[r.loc].region]++;});
  const ni=!R.length?0:noN===R.length?null:total<=4?1:total<=8?2:total<=12?3:total<=16?4:5;
  const scored=f[1]+f[2]+f[3];
  const si=!R.length?0:!scored?null:f[3]>=2?5:f[3]===1?4:f[2]>=2?3:f[2]===1?2:1;
  const high=[],mod=[];
  R.forEach(r=>{if(!r.type||!r.sev)return;const l=LOC[r.loc],k=r.type+'-'+r.sev,head=l.region==='head',eyes=EYES.includes(r.loc);
    if(k==='CT-2'&&head)high.push('CT-2 on the head ('+l.name+')');else if(k==='AL-3'||k==='CT-3')high.push(k+' ('+l.name+')');
    else if(k==='AL-2'&&eyes)mod.push('AL-2 near the eyes ('+l.name+')');else if(k==='CT-2')mod.push('CT-2 away from the head ('+l.name+')');});
  let band=0,rule;
  if(high.length){band=2;rule=high.join('; ');}else if(mod.length){band=1;rule=mod.join('; ');}
  else if(!R.length)rule='no injuries';else if(scored)rule='only AL-1, CT-1 or AL-2 away from the eyes';else rule='no wound typed and rated yet';
  const risk=R.length&&!scored?null:RISK[band];
  return{R,total,f,grp,n:R.length,ni,si,band,risk,rule,noN,noS,scored,complete:!noN&&!noS};
}
const riskTag=sc=>sc.risk==null?'<span class="risk r-x">'+NONE+'</span>':'<span class="risk r-'+sc.band+'">'+sc.risk+'</span>';
const grpLine=sc=>GROUPS.map(g=>g[1].split(' ')[0]+' '+sc.grp[g[0]]).join(' · ');

/* ---------------- the body map ---------------- */
const SURF={};   /* loc -> {front:{cx,cy}, back:{...}, head:{...}} from the figure's own centre points */
$$('#imMaps svg.imFig path[data-loc]').forEach(p=>{const v=p.ownerSVGElement.dataset.view;(SURF[p.dataset.loc]=SURF[p.dataset.loc]||{})[v]={cx:+p.dataset.cx,cy:+p.dataset.cy};});
const hasSurface=loc=>!!SURF[loc];
function homeView(loc){const s=SURF[loc]||{};return s.front?'front':s.back?'back':s.head?'head':'';}
function marker(r,i){const sv=['1','2','3'].includes(String(r.sev))?String(r.sev):'0',sel=SEL===r.loc,ct=r.type==='CT',l=LOC[r.loc];
  const core=ct?'<rect class="core" x="-8.5" y="-8.5" width="17" height="17" rx="2.5"/>':'<circle class="core" r="9"/>';
  const hatch=sv==='3'?(ct?'<rect class="hatch" x="-8.5" y="-8.5" width="17" height="17" rx="2.5"/>':'<circle class="hatch" r="9"/>'):'';
  const ring=sv==='2'?(ct?'<rect class="ring2" x="-12" y="-12" width="24" height="24" rx="3"/>':'<circle class="ring2" r="12.5"/>'):sv==='3'?(ct?'<rect class="ring3" x="-12.5" y="-12.5" width="25" height="25" rx="3"/>':'<circle class="ring3" r="13"/>'):'';
  const label=l.name+': number '+(r.n||NONE)+', '+(r.type||'type not set')+(r.sev?' severity '+r.sev:'');
  return '<g class="imMark sev-'+sv+(sel?' sel':'')+'" data-row="'+i+'" transform="translate('+(+r.x).toFixed(1)+','+(+r.y).toFixed(1)+')" role="button" tabindex="0" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+(sel?'<circle class="selring" r="16"/>':'')+ring+core+hatch+'<circle class="disc" r="5"/><text y="3.3">'+esc(r.n||'?')+'</text></g>';}
function renderMap(){
  const has={};S.cur.rows.forEach(r=>{has[r.loc]=1;});
  $$('#imMaps path[data-loc]').forEach(p=>{p.classList.toggle('has',!!has[p.dataset.loc]);p.classList.toggle('selp',SEL===p.dataset.loc);});
  ['front','back','head'].forEach(v=>{const g=$('#imMarks-'+v),e=$('#imEchoes-'+v);if(!g)return;
    g.innerHTML=S.cur.rows.map((r,i)=>r.view===v&&isFinite(+r.x)&&isFinite(+r.y)?marker(r,i):'').join('');
    /* a head location marked on one head figure is echoed on the other, so the figure and the detail agree */
    e.innerHTML=S.cur.rows.map(r=>{const l=LOC[r.loc];if(!l||l.region!=='head'||r.view===v)return '';const other=v==='head'?r.view==='front':v==='front'&&r.view==='head';const s=SURF[r.loc]&&SURF[r.loc][v];
      return other&&s?'<circle class="echo" cx="'+s.cx+'" cy="'+s.cy+'" r="'+(v==='head'?10:6)+'"/>':'';}).join('');});
  document.body.classList.toggle('im-ro',!!S.cur.ro);
  $('#imChips').innerHTML=S.cur.rows.length?S.cur.rows.map(r=>'<button type="button" data-chip="'+esc(r.loc)+'" class="'+(SEL===r.loc?'on':'')+'" aria-pressed="'+(SEL===r.loc)+'">'+esc(LOC[r.loc].name)+(r.n?' · '+esc(r.n):'')+(r.type?' '+esc(r.type)+(r.sev?'-'+esc(r.sev):''):'')+'</button>').join(''):'';
}
function svgPoint(svg,e){try{const m=svg.getScreenCTM();if(!m||!isFinite(e.clientX))return null;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return{x:Math.round(pt.x*10)/10,y:Math.round(pt.y*10)/10};}catch(err){return null;}}
function newRow(loc,view,pt){const v=view||homeView(loc);const s=SURF[loc]&&SURF[loc][v];
  return{loc,n:'1',type:'',sev:'',kind:'',note:'',view:s?v:'',x:pt?pt.x:s?s.cx:'',y:pt?pt.y:s?s.cy:''};}
function tapLoc(loc,view,pt){
  if(S.cur.ro){nbhUI.toast('This administration is open read-only. Choose "Edit this one" on the History page to change it.',{kind:'warn'});return;}
  let r=S.cur.rows.find(x=>x.loc===loc);
  if(!r){r=newRow(loc,view,pt);S.cur.rows.push(r);SEL=loc;renderCur();const t=$('#imSide select[data-f="type"]');if(t&&view)t.focus({preventScroll:true});return;}
  if(SEL===loc&&pt&&view){r.view=view;r.x=pt.x;r.y=pt.y;}
  SEL=loc;renderCur();
}
$('#imMaps').addEventListener('click',e=>{
  const mk=e.target.closest('.imMark');if(mk){const r=S.cur.rows[+mk.dataset.row];if(r){SEL=r.loc;renderCur();}return;}
  const p=e.target.closest('path[data-loc]');if(!p)return;const svg=p.ownerSVGElement;tapLoc(p.dataset.loc,svg.dataset.view,svgPoint(svg,e));
});
$('#imMaps').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;
  const mk=e.target.closest('.imMark');if(mk){e.preventDefault();const r=S.cur.rows[+mk.dataset.row];if(r){SEL=r.loc;renderCur();}return;}
  const p=e.target.closest('path[data-loc]');if(!p)return;e.preventDefault();tapLoc(p.dataset.loc,p.ownerSVGElement.dataset.view,null);});
$('#imMaps').addEventListener('mouseover',e=>{const p=e.target.closest('path[data-loc]');if(p)nameLoc(p.dataset.loc);});
$('#imMaps').addEventListener('focusin',e=>{const p=e.target.closest('path[data-loc]');if(p)nameLoc(p.dataset.loc);});
function nameLoc(loc){const el=$('#imLocName');if(el)el.textContent=LOC[loc]?LOC[loc].name+' ('+GNAME[LOC[loc].region]+')':'';}
$('#imChips').addEventListener('click',e=>{const b=e.target.closest('button[data-chip]');if(!b)return;SEL=SEL===b.dataset.chip?null:b.dataset.chip;renderCur();});
function addLoc(loc){if(!LOC[loc])return;if(S.cur.rows.some(r=>r.loc===loc)){SEL=loc;renderCur();return;}tapLoc(loc,homeView(loc),null);}
$('#imAddBtn').addEventListener('click',()=>{const v=$('#imAddLoc').value;if(!v){nbhUI.toast('Choose a location first.');return;}addLoc(v);});
$('#imAddLoc').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#imAddBtn').click();}});
function renderKey(){
  const mk=(cls,shape,n)=>'<svg viewBox="-14 -14 28 28" aria-hidden="true"><g class="imMark '+cls+'">'+shape+'<circle class="disc" r="5"/><text y="3.3">'+n+'</text></g></svg>';
  $('#imKey').innerHTML='<span>'+mk('sev-1','<circle class="core" r="9"/>','1')+'severity 1 (amber)</span><span>'+mk('sev-2','<circle class="ring2" r="12.5"/><circle class="core" r="9"/>','2')+'severity 2 (orange, double ring)</span><span>'+mk('sev-3','<circle class="ring3" r="13"/><circle class="core" r="9"/><circle class="hatch" r="9"/>','3')+'severity 3 (red, hatched, heavy ring)</span><span>'+mk('sev-0','<circle class="core" r="9"/>','?')+'not yet typed and rated</span><span>'+mk('sev-1','<rect class="core" x="-8.5" y="-8.5" width="17" height="17" rx="2.5"/>','1')+'square: contusion (CT); circle: abrasion or laceration (AL). The number inside is the number score. A dashed circle echoes a head marker on the other head figure.</span>';
}

/* ---------------- the current administration: side panel, chart, indices ---------------- */
function rowControls(r,i,ctx){const dis=S.cur.ro?' disabled':'';const sevs=SEVS[r.type]||[];
  const sel=(f,opts,label,extra)=>'<select data-r="rows" data-i="'+i+'" data-f="'+f+'" aria-label="'+esc(label)+'"'+dis+(extra||'')+'><option value="">'+(f==='sev'&&!r.type?'choose the type first':'')+'</option>'+opts.map(o=>'<option value="'+o[0]+'"'+(String(r[f])===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  return{n:sel('n',NUMS,'Number of wounds, '+LOC[r.loc].name),type:sel('type',TYPES,'Type of the worst wound, '+LOC[r.loc].name),sev:sel('sev',sevs,'Severity of the worst wound, '+LOC[r.loc].name,r.type?'':' disabled'),
    kind:'<input data-r="rows" data-i="'+i+'" data-f="kind" list="imKinds" value="'+esc(r.kind)+'" placeholder="bite, bruise" aria-label="Kind of wound, '+esc(LOC[r.loc].name)+'"'+dis+'>',
    note:'<input data-r="rows" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'" placeholder="size, age, what was seen" aria-label="Comment, '+esc(LOC[r.loc].name)+'"'+dis+'>'};}
function renderSide(){const el=$('#imSide');const i=S.cur.rows.findIndex(r=>r.loc===SEL);
  let h='<h3>This location</h3><div class="imLocName" id="imLocName"></div>';
  if(i<0){h+='<p class="hint" style="margin:0">'+(S.cur.rows.length?'Tap a marker, a location or a chip below the map to open its row.':'No injured location yet. Tap the figure where the injury is, or add the location on the Scoring page.')+'</p>';}
  else{const r=S.cur.rows[i],c=rowControls(r,i,'side'),l=LOC[r.loc];
    h+='<div style="font-weight:600;font-size:14px;margin-bottom:4px">'+esc(l.name)+' <span class="hint">('+esc(GNAME[l.region])+(r.view?'':'; no surface on the figure')+')</span></div><div class="fieldgrid"><div><label>Number of wounds</label>'+c.n+'</div><div><label>Type of the worst wound</label>'+c.type+'</div><div><label>Severity ('+(r.type||'AL or CT')+' criteria)</label>'+c.sev+'</div><div><label>Kind (free note)</label>'+c.kind+'</div><div><label>Comment</label>'+c.note+'</div></div>'+
      (S.cur.ro?'':'<div class="tools" style="margin:6px 0 0"><button type="button" class="tool rowDel" data-del="rows" data-i="'+i+'" style="font-size:12.5px;color:#8E2A2A">Remove this location</button></div>');}
  el.innerHTML=h;}
function renderChart(){
  const tb=$('#imChart tbody');
  tb.innerHTML=S.cur.rows.length?S.cur.rows.map((r,i)=>{const c=rowControls(r,i,'chart'),l=LOC[r.loc];
    return '<tr'+(SEL===r.loc?' class="sel"':'')+' data-rowloc="'+esc(r.loc)+'"><td class="num">'+(i+1)+'</td><td class="grp">'+esc(GNAME[l.region])+'</td><td><button type="button" class="imRowSel" data-loc="'+esc(r.loc)+'" style="font:inherit;border:0;background:transparent;padding:0;cursor:pointer;text-align:left;font-weight:600">'+esc(l.name)+'</button></td><td>'+c.n+'</td><td>'+c.type+'</td><td>'+c.sev+'</td><td>'+c.kind+'</td><td>'+c.note+'</td><td class="num hint">'+(r.view?esc(r.view):'from the list')+'</td>'+(S.cur.ro?'<td class="nx noprint"></td>':delCell('rows',i,'location'))+'</tr>';}).join(''):'<tr><td colspan="10" class="hint">No injured location in this administration. Tap the body map, or add a location above.</td></tr>';
  const used={};S.cur.rows.forEach(r=>{used[r.loc]=1;});
  $('#imAddLoc').innerHTML='<option value="">'+(S.cur.ro?'read-only':'choose')+'</option>'+GROUPS.map(g=>'<optgroup label="'+g[1]+'">'+LOCS.filter(l=>l.region===g[0]&&!used[l.id]).map(l=>'<option value="'+l.id+'">'+esc(l.name)+(hasSurface(l.id)?'':' (no surface on the figure)')+'</option>').join('')+'</optgroup>').join('');
  $('#imAddBtn').disabled=!!S.cur.ro;$('#imAddLoc').disabled=!!S.cur.ro;
  const c=S.cur;$('#imAdmLine').innerHTML='Administration'+(c.date?' of <b>'+esc(c.date)+'</b>':' <b>not yet dated</b> (date it on the Body map page)')+(c.examiner?' by '+esc(c.examiner):'')+(c.ro?' · <b>read-only</b> (opened from the History)':c.id?' · saved in the History'+(savedSame()?'':', changed since'):' · not yet in the History');
}
$('#imChart').addEventListener('click',e=>{const b=e.target.closest('button.imRowSel');if(!b)return;SEL=SEL===b.dataset.loc?null:b.dataset.loc;renderCur();});
function renderIdx(){const sc=score(S.cur.rows);
  const h='<div class="metric"><b>Number Index (NI)</b><div class="val">'+(sc.ni==null?NONE:sc.ni)+'</div><div class="sub">Part II number total '+sc.total+(sc.noN?' · '+sc.noN+' without a number':'')+'</div></div>'+
    '<div class="metric"><b>Severity Index (SI)</b><div class="val">'+(sc.si==null?NONE:sc.si)+'</div><div class="sub">severity scores: 1 ×'+sc.f[1]+' · 2 ×'+sc.f[2]+' · 3 ×'+sc.f[3]+(sc.noS?' · '+sc.noS+' not yet rated':'')+'</div></div>'+
    '<div class="metric"><b>Injured locations</b><div class="val">'+sc.n+'</div><div class="sub">'+esc(grpLine(sc))+'</div></div>'+
    '<div class="metric r-'+(sc.risk==null?'x':sc.band)+'"><b>Estimate of current risk</b><div class="val">'+(sc.risk==null?NONE:sc.risk)+'</div><div class="sub">'+esc(sc.rule)+'</div></div>';
  $('#imIdxMap').innerHTML=h;$('#imIdxChart').innerHTML=h;
  const st=$('#imAdmStatus');st.textContent=S.cur.rows.length?sc.n+' injured location'+(sc.n===1?'':'s')+(sc.complete?'':' · '+(sc.noS+sc.noN)+' still to be typed and rated')+(S.cur.id?(savedSame()?' · saved':' · changed since it was saved'):' · not yet saved to the History'):'';
  $('#imRoNote').innerHTML=S.cur.ro?'<div class="verdict v-mid"><b>Opened from the History, read-only.</b> The map and chart show the administration of '+esc(S.cur.date||'?')+'. Choose <b>Edit this one</b> on the History page to change it, or start a new administration.</div>':'';
  /* Part III as a table, as on the published sheet */
  $('#imPart3').innerHTML='<div class="grid-wrap"><table class="rt sc" style="max-width:860px"><tr><th class="lk">A. Number Index</th><td>Part II number total <b>'+sc.total+'</b> &rarr; NI score <b>'+(sc.ni==null?NONE:sc.ni)+'</b> <span class="hint">(0 no injuries; 1 = 1 to 4; 2 = 5 to 8; 3 = 9 to 12; 4 = 13 to 16; 5 = 17 or more)</span></td></tr>'+
    '<tr><th class="lk">B. Severity Index</th><td>Frequency of severity scores: 1: <b>'+sc.f[1]+'</b>; 2: <b>'+sc.f[2]+'</b>; 3: <b>'+sc.f[3]+'</b> &rarr; SI score <b>'+(sc.si==null?NONE:sc.si)+'</b> <span class="hint">('+(sc.si==null?'no wound rated yet':['no injuries','all severity scores are 1','one 2, no 3s','two or more 2s, no 3s','no more than one 3','two or more 3s'][sc.si])+')</span></td></tr>'+
    '<tr><th class="lk">C. Estimate of current risk</th><td>'+riskTag(sc)+' <span class="hint">'+esc(sc.rule)+'</span></td></tr></table></div>'+
    (sc.n&&!sc.complete?'<div class="verdict v-mid"><b>Incomplete:</b> '+(sc.noS?sc.noS+' location'+(sc.noS===1?'':'s')+' without a type and severity':'')+(sc.noS&&sc.noN?'; ':'')+(sc.noN?sc.noN+' without a number':'')+'. The indices count what is rated so far.</div>':'');
}
function renderCur(){renderMap();renderSide();renderChart();renderIdx();}

/* ---------------- administrations ---------------- */
const rowsCopy=a=>(a||[]).map(r=>({loc:r.loc,n:r.n,type:r.type,sev:r.sev,kind:r.kind,note:r.note,view:r.view,x:r.x,y:r.y}));
const admSnap=a=>JSON.stringify({date:a.date,time:a.time,examiner:a.examiner,note:a.note,rows:rowsCopy(a.rows)});
/* one shape for a filed administration and one for the administration on the map, in the order the loader writes them */
const histEntry=(a,id)=>({id:id||a.id||uid(),date:a.date||'',time:a.time||'',examiner:a.examiner||'',note:a.note||'',rows:rowsCopy(a.rows)});
const curFrom=(h,ro)=>({id:h.id||'',date:h.date||'',time:h.time||'',examiner:h.examiner||'',note:h.note||'',ro:!!ro,rows:rowsCopy(h.rows)});
function savedSame(){const h=S.cur.id&&S.hist.find(x=>x.id===S.cur.id);return !!h&&admSnap(h)===admSnap(S.cur);}
function bindAdm(){$$('[data-a]').forEach(el=>{el.value=S.cur[el.dataset.a]||'';el.disabled=!!S.cur.ro;});}
async function saveAdm(){
  const c=S.cur;if(c.ro){nbhUI.toast('This administration is open read-only; choose "Edit this one" on the History page first.',{kind:'warn'});return;}
  if(!c.rows.length&&!(await nbhUI.confirm('Save an administration with no injured location?\nIt is filed as "no injuries" (NI 0, SI 0, Low).',{ok:'Save'})))return;
  const sc=score(c.rows);if(!sc.complete&&!(await nbhUI.confirm('Not every location is typed and rated ('+(sc.noS+sc.noN)+' to finish).\nSave it as it stands?',{ok:'Save anyway'})))return;
  if(!c.date){c.date=today();}
  const snap=histEntry(c,c.id||uid());
  const i=S.hist.findIndex(h=>h.id===snap.id);if(i>=0)S.hist[i]=snap;else S.hist.push(snap);c.id=snap.id;
  renderAll();nbhUI.toast('Administration of '+c.date+' '+(i>=0?'updated in':'saved to')+' the History: NI '+(sc.ni==null?NONE:sc.ni)+', SI '+(sc.si==null?NONE:sc.si)+', risk '+(sc.risk||NONE)+'.',{kind:'ok'});
}
async function newAdm(){
  const c=S.cur;
  if(c.rows.length&&!c.ro&&!savedSame()&&!(await nbhUI.confirm('Start a new administration?\nThe current one ('+(c.date||'undated')+', '+c.rows.length+' location'+(c.rows.length===1?'':'s')+') is not in the History'+(c.id?' as it stands':'')+' and will be lost. Cancel and use "Save to history" to keep it.',{ok:'Start new',danger:true})))return;
  S.cur=admBlank();S.cur.date=today();S.cur.examiner=S.meta.examiner||'';SEL=null;renderAll();setView('map');
  nbhUI.toast('New administration dated '+S.cur.date+'. Tap the figure where each injury is.',{kind:'ok'});
}
function openAdm(id,edit){const h=S.hist.find(x=>x.id===id);if(!h)return;
  S.cur=curFrom(h,!edit);SEL=null;renderAll();setView('map');
  nbhUI.toast('Administration of '+(h.date||'?')+' opened'+(edit?' for editing; "Save to history" replaces it.':' read-only.'),{kind:'ok'});}
$$('.imNewAdm').forEach(b=>b.addEventListener('click',newAdm));
$$('.imSaveAdm').forEach(b=>b.addEventListener('click',saveAdm));
function histSorted(){return S.hist.map((h,i)=>({h,i,d:pDate(h.date)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:a.i-b.i).map(x=>x.h);}
function renderHist(){
  const H=histSorted();
  $('#imHist tbody').innerHTML=H.length?H.map((h,i)=>{const sc=score(h.rows),cur=S.cur.id===h.id;
    return '<tr'+(cur?' class="sel"':'')+'><td class="num">'+(i+1)+'</td><td>'+esc(h.date||NONE)+(h.time?'<br><span class="hint">'+esc(h.time)+'</span>':'')+'</td><td>'+esc(h.examiner||NONE)+'</td><td class="num">'+sc.total+'</td><td class="num">'+(sc.ni==null?NONE:sc.ni)+'</td><td class="num">'+(sc.si==null?NONE:sc.si)+'</td><td>'+sc.n+' <span class="hint">('+esc(grpLine(sc))+')</span></td><td>'+riskTag(sc)+'</td><td class="hint">'+esc(sc.rule)+(h.note?'<br>'+esc(h.note):'')+'</td><td class="noprint"><button type="button" class="tool" data-open="'+esc(h.id)+'" style="font-size:11.5px">Open</button> <button type="button" class="tool" data-edit="'+esc(h.id)+'" style="font-size:11.5px">Edit this one</button>'+(cur?'<br><span class="hint">on the map now</span>':'')+'</td>'+delCell('hist',S.hist.indexOf(h),'administration')+'</tr>';}).join(''):'<tr><td colspan="11" class="hint">No administration saved yet. Score one on the Body map and Scoring pages, then "Save to history".</td></tr>';
  renderPlot(H);
}
$('#imHist').addEventListener('click',e=>{const o=e.target.closest('button[data-open]'),d=e.target.closest('button[data-edit]');if(o)openAdm(o.dataset.open,false);else if(d)openAdm(d.dataset.edit,true);});
function renderPlot(H){
  H=H||histSorted();const W=900,Hh=340,L=52,Rg=20,T=26,B=92,n=Math.max(H.length,6);const X=i=>L+(i+0.5)*(W-L-Rg)/n,Y=v=>T+(Hh-T-B)*(1-v/5);
  let s='<rect x="0" y="0" width="'+W+'" height="'+Hh+'" fill="#fff"/>';
  for(let v=0;v<=5;v++)s+='<line x1="'+L+'" y1="'+Y(v).toFixed(1)+'" x2="'+(W-Rg)+'" y2="'+Y(v).toFixed(1)+'" stroke="#e3e8ea"/><text x="'+(L-7)+'" y="'+(Y(v)+4).toFixed(1)+'" font-size="11" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">'+v+'</text>';
  s+='<line x1="'+L+'" y1="'+Y(0)+'" x2="'+(W-Rg)+'" y2="'+Y(0)+'" stroke="#182e43"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+Y(0)+'" stroke="#182e43"/>';
  s+='<text transform="translate(14 '+((T+Y(0))/2).toFixed(1)+') rotate(-90)" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">index score (0 to 5)</text>';
  const SC=H.map(h=>score(h.rows));
  const line=(key,color)=>{let d='';SC.forEach((sc,i)=>{if(sc[key]==null){d+='|';return;}d+=(d&&!d.endsWith('|')?'L':'M')+X(i).toFixed(1)+' '+Y(sc[key]).toFixed(1)+' ';});d.split('|').forEach(seg=>{if(seg.trim())s+='<path d="'+seg+'" fill="none" stroke="'+color+'" stroke-width="2"/>';});};
  line('ni','#2f5568');line('si','#8E2A2A');
  const BC=['#2F6B37','#9B4E15','#8E2A2A'],BF=['#E3EFE0','#FBEEDB','#F6E0E0'];
  SC.forEach((sc,i)=>{const x=X(i);
    if(sc.ni!=null)s+='<circle cx="'+x.toFixed(1)+'" cy="'+Y(sc.ni).toFixed(1)+'" r="5" fill="#2f5568" stroke="#fff" stroke-width="1.5"/>';
    if(sc.si!=null)s+='<rect x="'+(x-4.5).toFixed(1)+'" y="'+(Y(sc.si)-4.5).toFixed(1)+'" width="9" height="9" fill="#8E2A2A" stroke="#fff" stroke-width="1.5"/>';
    s+='<text x="'+x.toFixed(1)+'" y="'+(Y(0)+14)+'" font-size="10.5" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+esc(String(H[i].date||i+1).replace(/\/\d{4}$/,m=>'/'+m.slice(3)))+'</text>';
    const w=(W-L-Rg)/n;if(sc.risk!=null)s+='<rect x="'+(x-w/2+3).toFixed(1)+'" y="'+(Y(0)+22)+'" width="'+(w-6).toFixed(1)+'" height="18" fill="'+BF[sc.band]+'" stroke="'+BC[sc.band]+'"/><text x="'+x.toFixed(1)+'" y="'+(Y(0)+35)+'" font-size="10.5" font-weight="600" text-anchor="middle" fill="'+BC[sc.band]+'" font-family="system-ui,sans-serif">'+sc.risk+'</text>';});
  s+='<text x="'+(L-7)+'" y="'+(Y(0)+35)+'" font-size="10" text-anchor="end" fill="#5B6B6B" font-family="system-ui,sans-serif">risk</text>';
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(Hh-22)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">Number Index (circles, navy) and Severity Index (squares, dark red) per administration, 0 to 5 as published; the Estimate of Current Risk under each date</text>';
  s+='<text x="'+((L+W-Rg)/2)+'" y="'+(Hh-7)+'" font-size="11" text-anchor="middle" fill="#5B6B6B" font-family="system-ui,sans-serif">'+(H.length?H.length+' administration'+(H.length===1?'':'s')+' on file':'No administration saved yet')+'</text>';
  $('#imPlot').innerHTML=s;
}
$('#imPngBtn').addEventListener('click',()=>svgToPng($('#imPlot'),graphFile('IM-1',S.meta.client)));

/* ---------------- the nurse log, the healed injuries, the events ---------------- */
function renderNurse(){
  $('#imNurse tbody').innerHTML=S.nurse.length?S.nurse.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="nurse" data-i="'+i+'" data-f="date" value="'+esc(r.date)+'" placeholder="M/D/YYYY" aria-label="Check '+(i+1)+' date"></td><td><input data-r="nurse" data-i="'+i+'" data-f="who" value="'+esc(r.who)+'" aria-label="Check '+(i+1)+' who"></td><td><input data-r="nurse" data-i="'+i+'" data-f="findings" value="'+esc(r.findings)+'" aria-label="Check '+(i+1)+' findings"></td><td><input data-r="nurse" data-i="'+i+'" data-f="action" value="'+esc(r.action)+'" aria-label="Check '+(i+1)+' action"></td><td><input data-r="nurse" data-i="'+i+'" data-f="referral" value="'+esc(r.referral)+'" placeholder="none; prescriber; pediatrician" aria-label="Check '+(i+1)+' referral"></td>'+delCell('nurse',i,'check')+'</tr>').join(''):'<tr><td colspan="7" class="hint">No nurse check logged yet.</td></tr>';
}
function renderHealed(){
  $('#healedTbl tbody').innerHTML=S.healed.length?S.healed.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><select data-r="healed" data-i="'+i+'" data-f="loc" aria-label="Healed injury '+(i+1)+' site"><option value=""></option>'+GROUPS.map(g=>'<optgroup label="'+g[1]+'">'+LOCS.filter(l=>l.region===g[0]).map(l=>'<option value="'+l.id+'"'+(r.loc===l.id?' selected':'')+'>'+esc(l.name)+'</option>').join('')+'</optgroup>').join('')+'</select></td><td><select data-r="healed" data-i="'+i+'" data-f="ev" aria-label="Healed injury '+(i+1)+' evidence"><option value=""></option>'+HEALED.map(x=>'<option'+(r.ev===x?' selected':'')+'>'+x+'</option>').join('')+'</select></td><td><input data-r="healed" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'" aria-label="Healed injury '+(i+1)+' description"></td>'+delCell('healed',i,'site')+'</tr>').join(''):'<tr><td colspan="5" class="hint">No healed injury recorded. Add a site for each scar, disfigurement or missing body part seen at intake, up to five.</td></tr>';
  $('#addHealed').disabled=S.healed.length>=5;
}
function renderEvents(){
  $('#eventTbl tbody').innerHTML=S.events.length?S.events.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="events" data-i="'+i+'" data-f="date" value="'+esc(r.date)+'" placeholder="M/D/YYYY" aria-label="Event '+(i+1)+' date"></td><td><select data-r="events" data-i="'+i+'" data-f="kind" aria-label="Event '+(i+1)+' kind"><option value=""></option>'+EVKINDS.map(x=>'<option'+(r.kind===x?' selected':'')+'>'+x+'</option>').join('')+'</select></td><td><input data-r="events" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'" aria-label="Event '+(i+1)+' note"></td>'+delCell('events',i)+'</tr>').join(''):'<tr><td colspan="5" class="hint">None recorded.</td></tr>';
}
$('#addNurse').addEventListener('click',()=>{if(S.nurse.length>=300)return;S.nurse.push({date:today(),who:S.meta.nurse||'',findings:'',action:'',referral:''});renderNurse();const l=$$('#imNurse input[data-f="findings"]').pop();if(l)l.focus();});
$('#addHealed').addEventListener('click',()=>{if(S.healed.length>=5){nbhUI.toast('The published Part I lists up to five sites of healed injury.');return;}S.healed.push({loc:'',ev:'',note:''});renderHealed();});
$('#addEvent').addEventListener('click',()=>{if(S.events.length>=100)return;S.events.push({date:'',kind:'Restraint',note:''});renderEvents();renderSched();});

/* ---------------- the schedule (the form's convention): intake, every n weeks, after any restraint or injury report ---------------- */
function schedule(){
  const intake=pDate(S.meta.intake),ev=num(S.meta.every),every=Math.max(1,Math.round(ev==null?3:ev)),adms=histSorted().map(h=>pDate(h.date)).filter(Boolean),now=new Date();now.setHours(12,0,0,0);
  const items=[];
  if(intake){const done=adms.find(d=>d>=addDays(intake,-7)&&d<=addDays(intake,14));items.push({what:'SIT Scale at intake',date:intake,done});}
  const last=adms.length?adms[adms.length-1]:null;const next=last?addDays(last,every*7):intake;
  if(next&&(!intake||last))items.push({what:'SIT Scale re-examination (every '+every+' weeks)',date:next,done:null});
  S.events.forEach(e=>{const d=pDate(e.date);if(!d)return;const done=adms.find(a=>a>=d&&a<=addDays(d,14));items.push({what:'SIT Scale after the '+(e.kind||'event').toLowerCase()+' of '+MDY(d),date:d,done});});
  items.forEach(x=>{x.over=!x.done&&x.date<now;});
  return{items,every,intake,last,next,adms};
}
function schedHtml(){const s=schedule();
  if(!s.intake&&!s.adms.length&&!S.events.length)return '<b>Schedule</b>Enter the intake date and the interval on the Setup page; the form lists what is due here, and the workstation shell shows it with the case.';
  return '<b>Schedule</b>'+(s.intake?'Intake '+MDY(s.intake)+', then every '+s.every+' week'+(s.every===1?'':'s')+', and after any restraint or injury report'+(s.last?'; last administration '+MDY(s.last):'; none administered yet'):(s.last?'Last administration '+MDY(s.last)+'; every '+s.every+' weeks':''))+'. <span class="hint">This schedule is the form&rsquo;s convention; the paper&rsquo;s repeated examinations were at least a week apart.</span><ul>'+
    s.items.map(x=>'<li class="'+(x.done?'done':x.over?'over':'')+'">'+esc(x.what)+': '+MDY(x.date)+(x.done?' (administered '+MDY(x.done)+')':x.over?' <b>(not administered: overdue)</b>':' (due)')+'</li>').join('')+'</ul>';}
function renderSched(){$('#imSched').innerHTML=schedHtml();$('#imSchedHist').innerHTML=schedHtml();}
window.__nbhDue=function(){return schedule().items.filter(x=>!x.done).map(x=>({what:x.what.slice(0,60),date:MDY(x.date)}));};

function renderSetup(){const m=S.meta,v=$('#setupVerdict');const topo=['t_head','t_body','t_scratch','t_bite','t_eye'].filter(k=>S.chk[k]).length,anyTopo=Object.keys(S.chk).some(k=>/^t_/.test(k)&&S.chk[k]);
  if(!m.client&&!m.beh&&!anyTopo&&!m.examiner){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The student and the target behavior, Part I once, then who examines and how often.</div>';return;}
  const miss=[];if(!m.beh)miss.push('the target behavior');if(!anyTopo)miss.push('the Part I checklist');if(!m.examiner)miss.push('the examiner');if(!m.intake)miss.push('the intake date');
  v.innerHTML=miss.length?'<div class="verdict v-mid"><b>Still missing:</b> '+miss.join(', ')+'.</div>':'<div class="verdict v-ok"><b>Set up.</b> '+topo+' of the five topographies that Part II can score are checked'+(S.healed.length?'; '+S.healed.length+' healed site'+(S.healed.length===1?'':'s')+' recorded':'')+'. Examiner: '+esc(m.examiner)+'.</div>';}

/* ---------------- input ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.tagName!=='SELECT'){const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(r==='rows'){const row=S.cur.rows[i];if(!row)return;row[f]=el.value;$$('[data-r="rows"][data-i="'+i+'"][data-f="'+f+'"]').forEach(x=>{if(x!==el)x.value=el.value;});renderIdxSoon();return;}
    if(!S[r]||!S[r][i])return;S[r][i][f]=el.value;if(r==='events')renderSchedSoon();return;}
  if(el.dataset.a!==undefined){S.cur[el.dataset.a]=el.value;renderIdxSoon();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;S.meta[k]=el.value;$$('[data-m="'+k+'"]').forEach(x=>{if(x!==el)x.value=el.value;});if(k==='intake'||k==='every')renderSchedSoon();renderSetupSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined){const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(r==='rows'){const row=S.cur.rows[i];if(!row)return;row[f]=el.value;if(f==='type')row.sev='';renderCur();return;}
    if(!S[r]||!S[r][i])return;S[r][i][f]=el.value;if(r==='events')renderSched();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderSetup();return;}
  if(el.dataset.a!==undefined){S.cur[el.dataset.a]=el.value;renderChart();renderIdx();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderSetup();renderSched();}
});
let tA=0,tB=0,tC=0;
function renderIdxSoon(){clearTimeout(tA);tA=setTimeout(()=>{renderIdx();renderChart();},250);}
function renderSchedSoon(){clearTimeout(tB);tB=setTimeout(renderSched,300);}
function renderSetupSoon(){clearTimeout(tC);tC=setTimeout(renderSetup,300);}
async function rowDel(r,i){
  if(r==='rows'){const x=S.cur.rows[i];if(!x)return;if(S.cur.ro)return;
    if((x.type||x.sev||x.kind||x.note)&&!(await nbhUI.confirm('Remove '+LOC[x.loc].name+' from this administration?\nIts number, type, severity and comment are deleted and its marker leaves the map.',{ok:'Remove',danger:true})))return;
    S.cur.rows.splice(i,1);if(SEL===x.loc)SEL=null;renderCur();return;}
  if(r==='hist'){const h=S.hist[i];if(!h)return;const sc=score(h.rows);
    if(!(await nbhUI.confirm('Delete the administration of '+(h.date||'?')+' from the History?\nIts '+sc.n+' location'+(sc.n===1?'':'s')+', indices and map go with it.'+(S.cur.id===h.id?' The copy on the map stays until a new administration is started.':''),{ok:'Delete',danger:true})))return;
    S.hist.splice(i,1);if(S.cur.id===h.id){S.cur.id='';S.cur.ro=false;}renderAll();return;}
  const row=S[r]&&S[r][i];if(!row)return;
  const has={healed:x=>x.loc||x.ev||x.note,events:x=>x.date||x.note,nurse:x=>x.date||x.who||x.findings||x.action||x.referral}[r];if(!has)return;
  if(has(row)&&!(await nbhUI.confirm('Delete this row?\nWhat was entered in it is deleted.',{ok:'Delete',danger:true})))return;
  S[r].splice(i,1);({healed:renderHealed,events:()=>{renderEvents();renderSched();},nurse:renderNurse})[r]();
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();bindAdm();renderHealed();renderEvents();renderSched();renderSetup();renderCur();renderHist();renderNurse();}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'IM-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`IM-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='IM-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const rows=a=>Array.isArray(a)?a.filter(x=>x&&LOC[x.loc]).slice(0,LOCS.length).map(x=>({loc:x.loc,n:['1','2','3'].includes(str(x.n))?str(x.n):'',type:['AL','CT'].includes(x.type)?x.type:'',sev:['1','2','3'].includes(str(x.sev))&&x.type?str(x.sev):'',kind:str(x.kind),note:str(x.note),view:['front','back','head'].includes(x.view)?x.view:'',x:num(x.x)==null?'':num(x.x),y:num(x.y)==null?'':num(x.y)})):[];
  const adm=x=>({id:str(x&&x.id),date:str(x&&x.date),time:str(x&&x.time),examiner:str(x&&x.examiner),note:str(x&&x.note),ro:!!(x&&x.ro),rows:rows(x&&x.rows)});
  o.cur=adm(obj('cur'));
  o.hist=Array.isArray(s.hist)?s.hist.slice(0,200).map(x=>{const a=adm(x);delete a.ro;if(!a.id)a.id=uid();return a;}):[];
  const seen={};o.hist.forEach(h=>{if(seen[h.id])h.id=uid();seen[h.id]=1;});
  o.healed=Array.isArray(s.healed)?s.healed.slice(0,5).map(x=>({loc:LOC[x&&x.loc]?x.loc:'',ev:HEALED.includes(x&&x.ev)?x.ev:'',note:str(x&&x.note)})):[];
  o.events=Array.isArray(s.events)?s.events.slice(0,100).map(x=>({date:str(x&&x.date),kind:EVKINDS.includes(x&&x.kind)?x.kind:'',note:str(x&&x.note)})):[];
  o.nurse=Array.isArray(s.nurse)?s.nurse.slice(0,300).map(x=>({date:str(x&&x.date),who:str(x&&x.who),findings:str(x&&x.findings),action:str(x&&x.action),referral:str(x&&x.referral)})):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='IM-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved IM-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form IM-1. Nothing was changed.':'That file could not be read as a saved IM-1 form. Nothing was changed.');return;}
    const prev=S;S=next;SEL=null;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved IM-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Record','Administration','Date','Examiner or nurse','Group','Location','Number','Type','Severity','Kind','Comment or findings','Part II number total','NI','SI','Injured locations','Risk','Risk rule','Action','Referral']];
  const H=histSorted();const list=H.map(h=>({h,tag:'Administration'}));if(S.cur.rows.length&&!savedSame())list.push({h:S.cur,tag:'Current (not in the History)'});
  list.forEach((x,k)=>{const h=x.h,sc=score(h.rows),n=k<H.length?k+1:'current';
    if(!h.rows.length)out.push([x.tag,n,h.date,h.examiner,'','(no injuries)','','','','',h.note,sc.total,sc.ni,sc.si,sc.n,sc.risk||'',sc.rule,'','']);
    h.rows.forEach(r=>{const l=LOC[r.loc];if(!l)return;out.push([x.tag,n,h.date,h.examiner,GNAME[l.region],l.name,r.n,r.type,r.sev,r.kind,r.note,sc.total,sc.ni==null?'':sc.ni,sc.si==null?'':sc.si,sc.n,sc.risk||'',sc.rule,'','']);});});
  S.nurse.forEach(r=>out.push(['Nurse check','',r.date,r.who,'','','','','','',r.findings,'','','','','','',r.action,r.referral]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='IM-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();SEL=null;renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nEvery page is filled with a worked example: three administrations over six weeks. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const Y=n=>MDY(step(n,-1));
  S=blank();SEL=null;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',dob:'',site:'Elementary, self-contained classroom',bcba:'Joshua Newsome, M.A., BCBA',
    beh:'Self-injury: head hitting and hand biting',behdef:'Head hitting: forceful contact of the head with a hard surface or the fist from 15 cm or more. Hand biting: closing the teeth on the hand or wrist hard enough to leave a mark (Form TB-1).',
    plan:'CR-1 dated '+Y(32)+'; restraint log on CR-1; medical review after any High estimate',medical:'No bleeding disorder; no allergy; risperidone 0.5 mg since '+Y(40)+' (Form MS-1)',
    t_other_text:'',examiner:'School nurse (RN), with the BCBA observing the first two',trained:'Nurse and BCBA scored two students together on '+Y(33)+'; agreement on every item',nurse:'School nurse (simulated)',intake:Y(30),every:'3',tod:'Arrival, 8:05, in the health room'};
  S.chk={t_head:true,t_body:true,t_bite:true,t_scratch:true};
  S.healed=[{loc:'scalp',ev:'Scar',note:'2 cm linear scar above the right ear; parent reports a laceration from head hitting two years ago'},{loc:'hand_R',ev:'Other',note:'callused, thickened skin over the base of the right thumb from biting'}];
  S.events=[{date:Y(22),kind:'Restraint',note:'Standing hold, 2 minutes, during a head-hitting episode at the transition after lunch (CR-1 log)'}];
  const adm=(d,ex,note,rows)=>histEntry({date:d,time:'08:05',examiner:ex,note,rows});
  const R=(loc,n,type,sev,kind,note)=>{const v=homeView(loc),s=SURF[loc][v];return{loc,n,type,sev,kind,note,view:v,x:s.cx,y:s.cy};};
  const nurse='School nurse (simulated)';
  S.hist=[
    adm(Y(30),nurse,'Intake. Examined in the health room with the aide present; shirt and shoes off; no area skipped.',[
      R('scalp','2','CT','2','bruise','two raised, swollen areas over the right parietal scalp, 3 and 4 cm, extensive swelling, no break in the skin'),
      R('eyearea_L','1','AL','1','scratch','spotted scabbing below the left eye from picking'),
      R('hand_R','3','AL','2','bite','five distinct superficial bite marks over the base of the right thumb and the back of the hand'),
      R('larm_L','1','CT','2','bruise','extensive swelling and discoloration over the left forearm from banging it on the desk edge'),
      R('face','1','CT','1','bruise','faint discoloration over the right cheek, no swelling')]),
    adm(Y(15),nurse,'Three weeks; the plan (FCT and noncontingent attention) in its second week. Head hitting falling on Form DD-1.',[
      R('scalp','1','CT','1','bruise','one area of discoloration, swelling gone'),
      R('hand_R','2','AL','2','bite','three superficial bite marks, two of them healing'),
      R('larm_L','1','CT','2','bruise','forearm still swollen after the arm banging on '+Y(20))]),
    adm(Y(0),nurse,'Six weeks. No head hitting on Form DD-1 for nine school days; hand biting at under one a day.',[
      R('hand_R','1','AL','1','bite','one spotted mark at the base of the thumb; the older marks healed')])];
  S.cur=curFrom(S.hist[2],false);
  S.nurse=[{date:Y(30),who:nurse,findings:'Scalp swelling as scored; no change in pupils or alertness; forearm swollen, full movement',action:'Ice to the scalp and forearm; parent called; the plan reviewed with the BCBA the same day (CR-1 medical review)',referral:'Pediatrician seen '+Y(29)+': no fracture; prescriber told'},
    {date:Y(15),who:nurse,findings:'Scalp settled; forearm still swollen; bite marks superficial and clean',action:'Forearm wrapped for the day; wound care on a fixed schedule (10:00 and 13:00) rather than after each bite',referral:'None'},
    {date:Y(0),who:nurse,findings:'One small mark on the hand; everything else healed',action:'Checks moved to twice a week',referral:'None'}];
  renderAll();setView('history');
  nbhUI.toast('Simulation loaded: three administrations over six weeks, the estimate falling from High to Moderate to Low, with a nurse check for each.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderKey();renderAll();

/* v21.31 the case: hooks. The student details come through the packet map; the target behavior and its
   definition come from the self-injury on Form TB-1 (the first behavior whose label or definition names it,
   else the first behavior) when the fields are empty; the picker puts a chosen behavior in their place. */
window.__nbhFactsIn=function(f){const m=S.meta;let n=0;const b=f.behaviors||[];
  const sib=b.find(x=>/self.?injur|\bSIB\b|head.?(hit|bang)|bit(e|ing)|scratch|pick|gouge|slap/i.test([x.label,x.type,x.def].join(' ')))||b[0];
  if(sib){if(!m.beh){m.beh=sib.label;n++;}if(!m.behdef&&sib.def){m.behdef=sib.def;n++;}}
  if(n)renderAll();return {filled:n,note:sib?undefined:'the case holds no target behavior yet'};};
window.__nbhFactsPick=function(sel){const b=sel.behaviors[0];if(!b)return {filled:0};S.meta.beh=b.label;if(b.def)S.meta.behdef=b.def;renderAll();return {filled:1};};
