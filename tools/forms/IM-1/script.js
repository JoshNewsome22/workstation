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
/* v21.44 (B4): the private areas. Staff never examine them: on the figure they open Noticed During Required Care
   instead of a row, and the list of locations does not offer them. A record made before this rule keeps any such
   row as it was, marked. The breasts are not a location of the published scale: they lie within Chest/stomach,
   whose check does not include them. */
const PRIVATE={genitalia:1,rectum:1,hips:1};
const isPriv=loc=>!!PRIVATE[loc];
const CARE_AREAS=[['genitals','Genitals','genitalia'],['buttocks','Buttocks','hips'],['anal','Anal area','rectum'],['breasts','Breasts','chest']];
const CAREA=Object.fromEntries(CARE_AREAS.map(a=>[a[0],a]));
const AREA_OF={genitalia:'genitals',hips:'buttocks',rectum:'anal'};
const LOC_NOTE={chest:'The check of the chest and stomach does not include the breasts.',abdomen:'The check of the abdomen and pelvis does not include the genitals.'};
/* v21.44 (B5): how each injury happened (the form's own column, not the published scale). The two answers that mean
   no one knows how it happened are named under the report question. */
const HOW=[['seen','Seen to happen: the student\u2019s self-injury'],['match','Not seen; matches the self-injury seen before'],['nomatch','Not seen; does not match it'],['unknown','Not known'],['other','Another known cause (say in the comment)']];
const HOWN=Object.fromEntries(HOW);
const HOW_FLAG=['nomatch','unknown'];
/* the reasons that mean a report is needed: a tick is a reason to suspect abuse or neglect */
const RP_REASONS=[['r1','No one saw how the injury happened, and it does not match the self-injury staff have seen this student do (its usual places and kinds).'],
  ['r2','It has a pattern: grip, finger, slap or cord marks, or a burn.'],
  ['r3','It is in a private area (genitals, buttocks, breasts), or at a place the student has not been seen to injure (such as the back, neck, ears, or inner arms or thighs).'],
  ['r4','The student, or anyone else, says that someone hurt the student or is not taking care of them.'],
  ['r5','The explanation does not fit the injury, or it changes.'],
  ['r6','Anything else gives you a reason to suspect abuse or neglect.']];
const repBlank=()=>({r1:false,r2:false,r3:false,r4:false,r5:false,r6:false,need:'',why:'',when:'',to:'',by:'',told:''});
/* one shape for every answer to the question, whatever it was read from */
const repCopy=r=>{const o=repBlank();if(r&&typeof r==='object'&&!Array.isArray(r))Object.keys(o).forEach(k=>{o[k]=typeof o[k]==='boolean'?r[k]===true:(r[k]==null||typeof r[k]==='object'?'':String(r[k]));});if(!['yes','no'].includes(o.need))o.need='';return o;};

/* ---------------- state ---------------- */
const admBlank=()=>({id:'',date:'',time:'',examiner:'',second:'',note:'',ro:false,rows:[],rep:repBlank()});
/* v21.44 (B4): an injury noticed during required care, and the one being written (kept with the record, so a half-written
   entry is saved and comes back; its id is the entry's it corrects, or empty for a new one) */
const careBlank=()=>({id:'',date:'',time:'',area:'',task:'',seen:'',by:'',byRole:'',second:'',secondRole:'',nurse:'',parent:'',rep:repBlank()});
const CARE_KEYS=['id','date','time','area','task','seen','by','byRole','second','secondRole','nurse','parent'];
const careCopy=c=>{const o=careBlank();CARE_KEYS.forEach(k=>{o[k]=c&&c[k]!=null&&typeof c[k]!=='object'?String(c[k]):'';});if(!CAREA[o.area])o.area='';o.rep=repCopy(c&&c.rep);return o;};
function blank(){return{meta:{},chk:{},healed:[],events:[],cur:admBlank(),hist:[],nurse:[],care:[],careDraft:careBlank()};}
let S=blank(),SEL=null,SELP=null;   /* SELP: a private area chosen on the figure; it opens Noticed During Required Care */
const uid=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};
  ['healed','events','hist','nurse','care'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  if(!S.cur||typeof S.cur!=='object')S.cur=admBlank();if(!Array.isArray(S.cur.rows))S.cur.rows=[];
  if(!S.cur.rep||typeof S.cur.rep!=='object')S.cur.rep=repBlank();
  S.hist.forEach(h=>{if(!Array.isArray(h.rows))h.rows=[];if(!h.id)h.id=uid();if(!h.rep||typeof h.rep!=='object')h.rep=repBlank();});
  S.care.forEach(c=>{if(!c.rep||typeof c.rep!=='object')c.rep=repBlank();});
  if(!S.careDraft||typeof S.careDraft!=='object')S.careDraft=careBlank();if(!S.careDraft.rep||typeof S.careDraft.rep!=='object')S.careDraft.rep=repBlank();
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
/* v21.44 (B4): the private areas on the figure say so, and are shaded */
$$('#imMaps path[data-loc]').forEach(p=>{if(!isPriv(p.dataset.loc))return;p.classList.add('imPriv');const nm=LOC[p.dataset.loc].name+': a private area, not examined by staff';p.setAttribute('aria-label',nm);const t=p.querySelector('title');if(t)t.textContent=nm;});
function homeView(loc){const s=SURF[loc]||{};return s.front?'front':s.back?'back':s.head?'head':'';}
function marker(r,i){const sv=['1','2','3'].includes(String(r.sev))?String(r.sev):'0',sel=SEL===r.loc,ct=r.type==='CT',l=LOC[r.loc];
  const core=ct?'<rect class="core" x="-8.5" y="-8.5" width="17" height="17" rx="2.5"/>':'<circle class="core" r="9"/>';
  const hatch=sv==='3'?(ct?'<rect class="hatch" x="-8.5" y="-8.5" width="17" height="17" rx="2.5"/>':'<circle class="hatch" r="9"/>'):'';
  const ring=sv==='2'?(ct?'<rect class="ring2" x="-12" y="-12" width="24" height="24" rx="3"/>':'<circle class="ring2" r="12.5"/>'):sv==='3'?(ct?'<rect class="ring3" x="-12.5" y="-12.5" width="25" height="25" rx="3"/>':'<circle class="ring3" r="13"/>'):'';
  const label=l.name+': number '+(r.n||NONE)+', '+(r.type||'type not set')+(r.sev?' severity '+r.sev:'');
  return '<g class="imMark sev-'+sv+(sel?' sel':'')+'" data-row="'+i+'" transform="translate('+(+r.x).toFixed(1)+','+(+r.y).toFixed(1)+')" role="button" tabindex="0" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+(sel?'<circle class="selring" r="16"/>':'')+ring+core+hatch+'<circle class="disc" r="5"/><text y="3.3">'+esc(r.n||'?')+'</text></g>';}
function renderMap(){
  const has={};S.cur.rows.forEach(r=>{has[r.loc]=1;});
  $$('#imMaps path[data-loc]').forEach(p=>{p.classList.toggle('has',!!has[p.dataset.loc]);p.classList.toggle('selp',SEL===p.dataset.loc||(SEL==null&&SELP===p.dataset.loc));});
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
  return{loc,n:'1',type:'',sev:'',kind:'',note:'',how:'',view:s?v:'',x:pt?pt.x:s?s.cx:'',y:pt?pt.y:s?s.cy:''};}
function tapLoc(loc,view,pt){
  /* v21.44 (B4): a private area is not examined; with no row of an earlier record there, it offers only the care path */
  if(isPriv(loc)&&!S.cur.rows.some(x=>x.loc===loc)){SEL=null;SELP=loc;renderCur();return;}
  SELP=null;
  if(S.cur.ro){nbhUI.toast('This administration is open read-only. Choose "Edit this one" on the History page to change it.',{kind:'warn'});return;}
  let r=S.cur.rows.find(x=>x.loc===loc);
  if(!r){r=newRow(loc,view,pt);S.cur.rows.push(r);SEL=loc;renderCur();const t=$('#imSide select[data-f="type"]');if(t&&view)t.focus({preventScroll:true});return;}
  if(SEL===loc&&pt&&view){r.view=view;r.x=pt.x;r.y=pt.y;}
  SEL=loc;renderCur();
}
$('#imMaps').addEventListener('click',e=>{
  const mk=e.target.closest('.imMark');if(mk){const r=S.cur.rows[+mk.dataset.row];if(r){SEL=r.loc;SELP=null;renderCur();}return;}
  const p=e.target.closest('path[data-loc]');if(!p)return;const svg=p.ownerSVGElement;tapLoc(p.dataset.loc,svg.dataset.view,svgPoint(svg,e));
});
$('#imMaps').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;
  const mk=e.target.closest('.imMark');if(mk){e.preventDefault();const r=S.cur.rows[+mk.dataset.row];if(r){SEL=r.loc;SELP=null;renderCur();}return;}
  const p=e.target.closest('path[data-loc]');if(!p)return;e.preventDefault();tapLoc(p.dataset.loc,p.ownerSVGElement.dataset.view,null);});
$('#imMaps').addEventListener('mouseover',e=>{const p=e.target.closest('path[data-loc]');if(p)nameLoc(p.dataset.loc);});
$('#imMaps').addEventListener('focusin',e=>{const p=e.target.closest('path[data-loc]');if(p)nameLoc(p.dataset.loc);});
function nameLoc(loc){const el=$('#imLocName');if(el)el.textContent=LOC[loc]?LOC[loc].name+' ('+GNAME[LOC[loc].region]+')':'';}
$('#imChips').addEventListener('click',e=>{const b=e.target.closest('button[data-chip]');if(!b)return;SEL=SEL===b.dataset.chip?null:b.dataset.chip;SELP=null;renderCur();});
function addLoc(loc){if(!LOC[loc])return;if(S.cur.rows.some(r=>r.loc===loc)){SEL=loc;SELP=null;renderCur();return;}tapLoc(loc,homeView(loc),null);}
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
    how:sel('how',HOW,'How it happened, '+LOC[r.loc].name),
    kind:'<input data-r="rows" data-i="'+i+'" data-f="kind" list="imKinds" value="'+esc(r.kind)+'" placeholder="bite, bruise" aria-label="Kind of wound, '+esc(LOC[r.loc].name)+'"'+dis+'>',
    note:'<input data-r="rows" data-i="'+i+'" data-f="note" value="'+esc(r.note)+'" placeholder="size, age, what was seen" aria-label="Comment, '+esc(LOC[r.loc].name)+'"'+dis+'>'};}
function renderSide(){const el=$('#imSide');const i=S.cur.rows.findIndex(r=>r.loc===SEL);
  let h='<h3>This location</h3><div class="imLocName" id="imLocName"></div>';
  if(i<0&&SELP&&LOC[SELP]){const l=LOC[SELP];
    h+='<div style="font-weight:600;font-size:14px;margin-bottom:4px">'+esc(l.name)+' <span class="hint">('+esc(GNAME[l.region])+'; a private area)</span></div><p class="imPrivMsg">Staff do not examine private areas. If an injury here was noticed while giving care the student needed anyway, such as help with toileting or changing, record what was seen, with both adults named.</p><div class="tools" style="margin:6px 0 0"><button type="button" class="tool" data-carenew="'+esc(AREA_OF[SELP]||'')+'">Record an injury noticed during required care</button></div>';}
  else if(i<0){h+='<p class="hint" style="margin:0">'+(S.cur.rows.length?'Tap a marker, a location or a chip below the map to open its row.':'No injured location yet. Tap the figure where the injury is, or add the location on the Scoring page.')+'</p>';}
  else{const r=S.cur.rows[i],c=rowControls(r,i,'side'),l=LOC[r.loc];
    h+='<div style="font-weight:600;font-size:14px;margin-bottom:4px">'+esc(l.name)+' <span class="hint">('+esc(GNAME[l.region])+(r.view?'':'; no surface on the figure')+')</span></div>'+(isPriv(r.loc)?'<p class="imPrivMsg">A private area, recorded before the private-area rule: kept as recorded.</p>':LOC_NOTE[r.loc]?'<p class="hint" style="margin:0 0 4px">'+esc(LOC_NOTE[r.loc])+'</p>':'')+'<div class="fieldgrid"><div><label>Number of wounds</label>'+c.n+'</div><div><label>Type of the worst wound</label>'+c.type+'</div><div><label>Severity ('+(r.type||'AL or CT')+' criteria)</label>'+c.sev+'</div><div><label>How it happened</label>'+c.how+'</div><div><label>Kind (free note)</label>'+c.kind+'</div><div><label>Comment</label>'+c.note+'</div></div>'+
      (S.cur.ro?'':'<div class="tools" style="margin:6px 0 0"><button type="button" class="tool rowDel" data-del="rows" data-i="'+i+'" style="font-size:12.5px;color:#8E2A2A">Remove this location</button></div>');}
  el.innerHTML=h;}
function renderChart(){
  const tb=$('#imChart tbody');
  tb.innerHTML=S.cur.rows.length?S.cur.rows.map((r,i)=>{const c=rowControls(r,i,'chart'),l=LOC[r.loc];
    return '<tr'+(SEL===r.loc?' class="sel"':'')+' data-rowloc="'+esc(r.loc)+'"><td class="num">'+(i+1)+'</td><td class="grp">'+esc(GNAME[l.region])+'</td><td><button type="button" class="imRowSel" data-loc="'+esc(r.loc)+'" style="font:inherit;border:0;background:transparent;padding:0;cursor:pointer;text-align:left;font-weight:600">'+esc(l.name)+'</button>'+(isPriv(r.loc)?'<br><span class="hint">private area; recorded before the rule</span>':'')+'</td><td>'+c.n+'</td><td>'+c.type+'</td><td>'+c.sev+'</td><td>'+c.kind+'</td><td>'+c.how+'</td><td>'+c.note+'</td><td class="num hint">'+(r.view?esc(r.view):'from the list')+'</td>'+(S.cur.ro?'<td class="nx noprint"></td>':delCell('rows',i,'location'))+'</tr>';}).join(''):'<tr><td colspan="11" class="hint">No injured location in this administration. Tap the body map, or add a location above.</td></tr>';
  const used={};S.cur.rows.forEach(r=>{used[r.loc]=1;});
  /* v21.44 (B4): the private areas are listed, but cannot be chosen */
  $('#imAddLoc').innerHTML='<option value="">'+(S.cur.ro?'read-only':'choose')+'</option>'+GROUPS.map(g=>'<optgroup label="'+g[1]+'">'+LOCS.filter(l=>l.region===g[0]&&!used[l.id]).map(l=>isPriv(l.id)?'<option value="'+l.id+'" disabled>'+esc(l.name)+' (private area: not examined)</option>':'<option value="'+l.id+'">'+esc(l.name)+(hasSurface(l.id)?'':' (no surface on the figure)')+'</option>').join('')+'</optgroup>').join('');
  $('#imAddBtn').disabled=!!S.cur.ro;$('#imAddLoc').disabled=!!S.cur.ro;
  const c=S.cur;$('#imAdmLine').innerHTML='Administration'+(c.date?' of <b>'+esc(c.date)+'</b>':' <b>not yet dated</b> (date it on the Body map page)')+(c.examiner?' by '+esc(c.examiner):'')+(c.ro?' · <b>read-only</b> (opened from the History)':c.id?' · saved in the History'+(savedSame()?'':', changed since'):' · not yet in the History');
}
$('#imChart').addEventListener('click',e=>{const b=e.target.closest('button.imRowSel');if(!b)return;SEL=SEL===b.dataset.loc?null:b.dataset.loc;SELP=null;renderCur();});
function renderIdx(){const sc=score(S.cur.rows);
  const h='<div class="metric"><b>Number Index (NI)</b><div class="val">'+(sc.ni==null?NONE:sc.ni)+'</div><div class="sub">Part II number total '+sc.total+(sc.noN?' · '+sc.noN+' without a number':'')+'</div></div>'+
    '<div class="metric"><b>Severity Index (SI)</b><div class="val">'+(sc.si==null?NONE:sc.si)+'</div><div class="sub">severity scores: 1 ×'+sc.f[1]+' · 2 ×'+sc.f[2]+' · 3 ×'+sc.f[3]+(sc.noS?' · '+sc.noS+' not yet rated':'')+'</div></div>'+
    '<div class="metric"><b>Injured locations</b><div class="val">'+sc.n+'</div><div class="sub">'+esc(grpLine(sc))+'</div></div>'+
    '<div class="metric r-'+(sc.risk==null?'x':sc.band)+'"><b>Estimate of current risk</b><div class="val">'+(sc.risk==null?NONE:sc.risk)+'</div><div class="sub">'+esc(sc.rule)+'</div></div>';
  $('#imIdxMap').innerHTML=h;$('#imIdxChart').innerHTML=h;
  const st=$('#imAdmStatus');st.textContent=S.cur.rows.length?sc.n+' injured location'+(sc.n===1?'':'s')+(sc.complete?'':' · '+(sc.noS+sc.noN)+' still to be typed and rated')+(S.cur.id?(savedSame()?' · saved':' · changed since it was saved'):' · not yet saved to the History'):'';
  const old=S.cur.rows.filter(r=>isPriv(r.loc)).map(r=>LOC[r.loc].name);
  $('#imRoNote').innerHTML=(S.cur.ro?'<div class="verdict v-mid"><b>Opened from the History, read-only.</b> The map and chart show the administration of '+esc(S.cur.date||'?')+'. Choose <b>Edit this one</b> on the History page to change it, or start a new administration.</div>':'')+
    (old.length?'<div class="verdict v-mid"><b>A private area in a record made before the private-area rule:</b> '+esc(old.join(', '))+'. It is kept and scored as recorded. New injuries in a private area are recorded only under Noticed During Required Care.</div>':'');
  renderTwo();
  /* Part III as a table, as on the published sheet */
  $('#imPart3').innerHTML='<div class="grid-wrap"><table class="rt sc" style="max-width:860px"><tr><th class="lk">A. Number Index</th><td>Part II number total <b>'+sc.total+'</b> &rarr; NI score <b>'+(sc.ni==null?NONE:sc.ni)+'</b> <span class="hint">(0 no injuries; 1 = 1 to 4; 2 = 5 to 8; 3 = 9 to 12; 4 = 13 to 16; 5 = 17 or more)</span></td></tr>'+
    '<tr><th class="lk">B. Severity Index</th><td>Frequency of severity scores: 1: <b>'+sc.f[1]+'</b>; 2: <b>'+sc.f[2]+'</b>; 3: <b>'+sc.f[3]+'</b> &rarr; SI score <b>'+(sc.si==null?NONE:sc.si)+'</b> <span class="hint">('+(sc.si==null?'no wound rated yet':['no injuries','all severity scores are 1','one 2, no 3s','two or more 2s, no 3s','no more than one 3','two or more 3s'][sc.si])+')</span></td></tr>'+
    '<tr><th class="lk">C. Estimate of current risk</th><td>'+riskTag(sc)+' <span class="hint">'+esc(sc.rule)+'</span></td></tr></table></div>'+
    (sc.n&&!sc.complete?'<div class="verdict v-mid"><b>Incomplete:</b> '+(sc.noS?sc.noS+' location'+(sc.noS===1?'':'s')+' without a type and severity':'')+(sc.noS&&sc.noN?'; ':'')+(sc.noN?sc.noN+' without a number':'')+'. The indices count what is rated so far.</div>':'');
}
/* v21.44 (B4): two adults at every check, both named */
function renderTwo(){const el=$('#imTwoVerdict');if(!el)return;const ex=String(S.cur.examiner||'').trim(),sd=String(S.cur.second||'').trim();
  el.innerHTML=ex&&sd?'<div class="verdict v-ok">Two adults at this check: '+esc(ex)+', and '+esc(sd)+'.</div>'
    :'<div class="verdict v-mid"><b>Name '+(!ex&&!sd?'the examiner and the second adult':!ex?'the examiner':'the second adult')+'.</b> Two adults are present for every injury check, and both are named before it is filed.</div>';}
/* ---------------- v21.44 (B5): Does this need a report? ----------------
   The same question for the administration on the map ('cur') and for the injury being written down in the care
   path ('draft'). A tick, or a row whose How it happened says no one knows, is a reason to suspect abuse or neglect,
   so the answer it leads to is Yes. The form never asks anyone to look into it: only for what was seen and said,
   and for when, to whom and by whom the report was made. */
function repHTML(scope,rep,dis){const d=dis?' disabled':'',at=k=>' data-rs="'+scope+'" data-rk="'+k+'"',v=k=>' value="'+esc(rep[k])+'"';
  return '<p class="rp-h">A report is needed if any of these is true:</p>'+RP_REASONS.map(([k,t])=>'<label class="ck rp-ck"><input type="checkbox"'+at(k)+(rep[k]?' checked':'')+d+'> <span>'+esc(t)+'</span></label>').join('')+
    '<ul><li><b>Who reports:</b> the person who suspects it. Telling a supervisor, the nurse or the BCBA does not take the place of your own report. Your agency may ask you to tell them as well.</li>'+
    '<li><b>When:</b> right away, the same day, as your state&rsquo;s law and your agency&rsquo;s policy require.</li>'+
    '<li><b>Do not investigate.</b> You do not need proof. Do not press the student for details, do not examine further, and do not contact the person you suspect. Write down what you saw, and what was said in the words used.</li>'+
    '<li>If abuse or neglect is suspected, your agency&rsquo;s policy says who tells the parent or guardian, and when.</li></ul>'+
    '<div class="fieldgrid"><div><label>Does this need a report?</label><select'+at('need')+d+' aria-label="Does this need a report?"><option value=""></option><option value="yes"'+(rep.need==='yes'?' selected':'')+'>Yes: a report is needed</option><option value="no"'+(rep.need==='no'?' selected':'')+'>No: no report is needed</option></select></div>'+
    '<div><label>If no, why not</label><input'+at('why')+v('why')+d+'></div>'+
    '<div><label>Report made on (date and time)</label><input'+at('when')+v('when')+d+'></div>'+
    '<div><label>To whom (the agency or hotline, the person who took it, any reference number)</label><input'+at('to')+v('to')+d+'></div>'+
    '<div><label>By whom (name and role)</label><input'+at('by')+v('by')+d+'></div>'+
    '<div><label>Others told, as your agency&rsquo;s policy says</label><input'+at('told')+v('told')+d+'></div></div>'+
    '<div data-rv="'+scope+'"></div>';}
function repVerdict(rep,extra,n){const t=k=>String(rep[k]==null?'':rep[k]).trim(),ticked=RP_REASONS.filter(([k])=>rep[k]===true).length,ex=extra||[];
  const miss=[['when','when'],['to','to whom'],['by','by whom']].filter(x=>!t(x[0])).map(x=>x[1]);
  if(rep.need==='yes')return miss.length?'<div class="verdict v-mid"><b>A report is needed.</b> Still to record: '+miss.join(', ')+'. Make the report today.</div>'
    :'<div class="verdict v-ok"><b>Report recorded:</b> made '+esc(t('when'))+' to '+esc(t('to'))+', by '+esc(t('by'))+'.</div>';
  if(ticked||ex.length)return '<div class="verdict v-no"><b>'+(ticked?(ticked===1?'A box above is ticked':ticked+' boxes above are ticked'):'The record shows a reason to report')+', so a report is needed.</b>'+(ex.length?' '+ex.map(esc).join(' '):'')+' '+(rep.need==='no'?'Change the answer to Yes, make':'Answer Yes, make')+' the report today, and record when, to whom and by whom.</div>';
  if(rep.need==='no')return t('why')?'<div class="verdict v-ok"><b>No report needed:</b> '+esc(t('why'))+'</div>':'<div class="verdict v-mid">Write in a few words why no report is needed.</div>';
  return n===0?'<div class="verdict v-mid">No injury is recorded in this administration yet. Answer this when the check is done.</div>':'<div class="verdict v-mid"><b>Not answered yet.</b> Decide whether this needs a report.</div>';}
/* the reasons the administration itself shows: a location no one saw happen that does not match, or not known; a private area of an earlier record */
function curReasons(){const out=[];S.cur.rows.forEach(r=>{const l=LOC[r.loc];if(!l)return;if(HOW_FLAG.includes(r.how))out.push(l.name+' ('+(r.how==='unknown'?'how it happened is not known':'not seen, and it does not match the self-injury seen before')+')');else if(isPriv(r.loc))out.push(l.name+' (a private area)');});
  return out.length?['The record shows: '+out.join('; ')+'.']:[];}
function repVerdictTo(scope){const v=document.querySelector('[data-rv="'+scope+'"]');if(!v)return;v.innerHTML=scope==='cur'?repVerdict(S.cur.rep,curReasons(),S.cur.rows.length):repVerdict(S.careDraft.rep,[],1);}
function renderRepCur(){const el=$('#imRepCur');if(!el)return;el.innerHTML='<p>Answer this for the injuries found at this check: does any of them give a reason to suspect abuse or neglect?</p>'+repHTML('cur',S.cur.rep,!!S.cur.ro);repVerdictTo('cur');}
function repInput(el){const sc=el.dataset.rs,rep=sc==='cur'?S.cur.rep:S.careDraft.rep;if(!rep||(sc==='cur'&&S.cur.ro))return;
  rep[el.dataset.rk]=el.type==='checkbox'?!!el.checked:el.value;repVerdictTo(sc);if(sc==='cur')renderIdxSoon();}
function renderCur(){renderMap();renderSide();renderChart();renderIdx();renderRepCur();}

/* ---------------- administrations ---------------- */
const rowsCopy=a=>(a||[]).map(r=>({loc:r.loc,n:r.n,type:r.type,sev:r.sev,kind:r.kind,note:r.note,how:r.how||'',view:r.view,x:r.x,y:r.y}));
const admSnap=a=>JSON.stringify({date:a.date,time:a.time,examiner:a.examiner,second:a.second||'',note:a.note,rows:rowsCopy(a.rows),rep:repCopy(a.rep)});
/* one shape for a filed administration and one for the administration on the map, in the order the loader writes them */
const histEntry=(a,id)=>({id:id||a.id||uid(),date:a.date||'',time:a.time||'',examiner:a.examiner||'',second:a.second||'',note:a.note||'',rows:rowsCopy(a.rows),rep:repCopy(a.rep)});
const curFrom=(h,ro)=>({id:h.id||'',date:h.date||'',time:h.time||'',examiner:h.examiner||'',second:h.second||'',note:h.note||'',ro:!!ro,rows:rowsCopy(h.rows),rep:repCopy(h.rep)});
function savedSame(){const h=S.cur.id&&S.hist.find(x=>x.id===S.cur.id);return !!h&&admSnap(h)===admSnap(S.cur);}
function bindAdm(){$$('[data-a]').forEach(el=>{el.value=S.cur[el.dataset.a]||'';el.disabled=!!S.cur.ro;});}
async function saveAdm(){
  const c=S.cur;if(c.ro){nbhUI.toast('This administration is open read-only; choose "Edit this one" on the History page first.',{kind:'warn'});return;}
  /* v21.44 (B4): two adults at every check; an administration is filed only with both named */
  const who=[String(c.examiner||'').trim()?'':'the examiner',String(c.second||'').trim()?'':'the second adult'].filter(Boolean);
  if(who.length){setView('map');renderTwo();nbhUI.toast('Not filed: name '+who.join(' and ')+' (name and role) on the Body map page. Two adults are present at every injury check.',{kind:'warn'});return;}
  if(!c.rows.length&&!(await nbhUI.confirm('Save an administration with no injured location?\nIt is filed as "no injuries" (NI 0, SI 0, Low).',{ok:'Save'})))return;
  /* v21.44 (B5): the report question is answered the same day */
  if(c.rows.length&&!c.rep.need&&!(await nbhUI.confirm('Does this need a report? is not answered for this administration.\nFile it anyway, and answer it today?',{ok:'File anyway'})))return;
  const sc=score(c.rows);if(!sc.complete&&!(await nbhUI.confirm('Not every location is typed and rated ('+(sc.noS+sc.noN)+' to finish).\nSave it as it stands?',{ok:'Save anyway'})))return;
  if(!c.date){c.date=today();}
  const snap=histEntry(c,c.id||uid());
  const i=S.hist.findIndex(h=>h.id===snap.id);if(i>=0)S.hist[i]=snap;else S.hist.push(snap);c.id=snap.id;
  renderAll();nbhUI.toast('Administration of '+c.date+' '+(i>=0?'updated in':'saved to')+' the History: NI '+(sc.ni==null?NONE:sc.ni)+', SI '+(sc.si==null?NONE:sc.si)+', risk '+(sc.risk||NONE)+'.',{kind:'ok'});
}
async function newAdm(){
  const c=S.cur;
  if(c.rows.length&&!c.ro&&!savedSame()&&!(await nbhUI.confirm('Start a new administration?\nThe current one ('+(c.date||'undated')+', '+c.rows.length+' location'+(c.rows.length===1?'':'s')+') is not in the History'+(c.id?' as it stands':'')+' and will be lost. Cancel and use "Save to history" to keep it.',{ok:'Start new',danger:true})))return;
  S.cur=admBlank();S.cur.date=today();S.cur.examiner=S.meta.examiner||'';S.cur.second=S.meta.second||'';SEL=null;SELP=null;renderAll();setView('map');
  nbhUI.toast('New administration dated '+S.cur.date+'. Tap the figure where each injury is.',{kind:'ok'});
}
function openAdm(id,edit){const h=S.hist.find(x=>x.id===id);if(!h)return;
  S.cur=curFrom(h,!edit);SEL=null;SELP=null;renderAll();setView('map');
  nbhUI.toast('Administration of '+(h.date||'?')+' opened'+(edit?' for editing; "Save to history" replaces it.':' read-only.'),{kind:'ok'});}
$$('.imNewAdm').forEach(b=>b.addEventListener('click',newAdm));
$$('.imSaveAdm').forEach(b=>b.addEventListener('click',saveAdm));
function histSorted(){return S.hist.map((h,i)=>({h,i,d:pDate(h.date)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.d?-1:b.d?1:a.i-b.i).map(x=>x.h);}
function renderHist(){
  const H=histSorted();
  $('#imHist tbody').innerHTML=H.length?H.map((h,i)=>{const sc=score(h.rows),cur=S.cur.id===h.id;
    return '<tr'+(cur?' class="sel"':'')+'><td class="num">'+(i+1)+'</td><td>'+esc(h.date||NONE)+(h.time?'<br><span class="hint">'+esc(h.time)+'</span>':'')+'</td><td>'+esc(h.examiner||NONE)+'<br><span class="hint">'+(h.second?'with '+esc(h.second):'second adult not recorded')+'</span></td><td class="num">'+sc.total+'</td><td class="num">'+(sc.ni==null?NONE:sc.ni)+'</td><td class="num">'+(sc.si==null?NONE:sc.si)+'</td><td>'+sc.n+' <span class="hint">('+esc(grpLine(sc))+')</span></td><td>'+riskTag(sc)+'</td><td class="hint">'+esc(sc.rule)+(h.note?'<br>'+esc(h.note):'')+'<br>Report: '+esc(repShort(h.rep))+'</td><td class="noprint"><button type="button" class="tool" data-open="'+esc(h.id)+'" style="font-size:11.5px">Open</button> <button type="button" class="tool" data-edit="'+esc(h.id)+'" style="font-size:11.5px">Edit this one</button>'+(cur?'<br><span class="hint">on the map now</span>':'')+'</td>'+delCell('hist',S.hist.indexOf(h),'administration')+'</tr>';}).join(''):'<tr><td colspan="11" class="hint">No administration saved yet. Score one on the Body map and Scoring pages, then "Save to history".</td></tr>';
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
/* ---------------- v21.44 (B4): injuries in a private area, noticed during required care ----------------
   Only for an injury staff saw while giving care the student needed anyway. What was seen is written down as seen,
   with no further examination; the person who noticed it and the second adult are named with their roles; it is
   passed to the nurse or the parent or guardian; and the report question is answered. An entry is added only when
   all of these are filled in. The entry being written is S.careDraft; its id is the entry it corrects, or empty. */
const careArea=c=>{const a=CAREA[c.area];return a?a[1]:NONE;};
function repShort(rep){if(!rep)return 'not answered';const t=k=>String(rep[k]==null?'':rep[k]).trim();
  return rep.need==='yes'?(t('when')&&t('to')&&t('by')?'Yes: made '+t('when')+' to '+t('to')+', by '+t('by'):'Yes: still to record when, to whom and by whom'):rep.need==='no'?'No'+(t('why')?': '+t('why'):''):'not answered';}
/* the CSV carries the answer and the day, not to whom or by whom: the report stays in the record and on paper */
const repCsv=rep=>{const t=k=>String(rep&&rep[k]!=null?rep[k]:'').trim();return !rep?'not answered':rep.need==='yes'?(t('when')?'Yes: made '+t('when'):'Yes: still to record'):rep.need==='no'?'No'+(t('why')?': '+t('why'):''):'not answered';};
const careEditing=()=>{const id=S.careDraft.id;return id?S.care.findIndex(c=>c.id===id):-1;};
function careMissing(d){const t=k=>String(d[k]==null?'':d[k]).trim(),m=[];
  if(!pDate(d.date))m.push('the date (M/D/YYYY)');if(!CAREA[d.area])m.push('the area');if(!t('task'))m.push('the care being given');if(!t('seen'))m.push('what was seen');
  if(!t('by')||!t('byRole'))m.push('who noticed it, with their role');if(!t('second')||!t('secondRole'))m.push('the second adult present, with their role');
  if(!t('nurse')&&!t('parent'))m.push('who it was passed to (the school nurse, or the parent or guardian)');
  if(!d.rep.need)m.push('the answer to Does this need a report?');else if(d.rep.need==='no'&&!String(d.rep.why||'').trim())m.push('why no report is needed');
  return m;}
/* the panel opens on the button (or a private area on the figure) and stays open while an entry is being written */
let CARE_OPEN=false;
const draftHas=()=>{const d=S.careDraft;return CARE_KEYS.some(k=>k!=='id'&&String(d[k]||'').trim()!=='')||RP_REASONS.some(([k])=>d.rep[k]===true)||['need','why','when','to','by','told'].some(k=>String(d.rep[k]||'').trim()!=='');};
function renderCareEdit(){const el=$('#imCareEdit');if(!el)return;const d=S.careDraft,k=careEditing();
  const open=CARE_OPEN||k>=0||draftHas();el.classList.toggle('open',open);
  if(!open){el.innerHTML='<div class="tools" style="margin:4px 0"><button type="button" class="tool" data-carenew="">Record an injury noticed during required care</button></div>';return;}
  const inp=(f,lab,ph,type)=>'<div><label>'+lab+'</label><input data-cd="'+f+'"'+(type?' type="'+type+'"':'')+' value="'+esc(d[f])+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'></div>';
  el.innerHTML='<h3>'+(k>=0?'Correct entry '+(k+1):'Record an injury noticed during required care')+'</h3>'+
    '<div class="fieldgrid">'+inp('date','Date','M/D/YYYY')+inp('time','Time','','time')+
    '<div><label>Area</label><select data-cd="area" aria-label="Area"><option value=""></option>'+CARE_AREAS.map(a=>'<option value="'+a[0]+'"'+(d.area===a[0]?' selected':'')+'>'+a[1]+'</option>').join('')+'</select></div>'+
    '<div><label>The care being given</label><input data-cd="task" list="imCareTasks" value="'+esc(d.task)+'" placeholder="help with toileting; changing a pad or diaper"></div></div>'+
    '<datalist id="imCareTasks"><option value="help with toileting"><option value="changing a pad or diaper"><option value="changing clothes"><option value="menstrual care"><option value="dressing after swimming or PE"></datalist>'+
    '<div class="fieldgrid imCareSeen"><div><label>What was seen, in plain words, at that moment (do not look again or examine further)</label><textarea data-cd="seen" rows="2" placeholder="size, color and where, as seen">'+esc(d.seen)+'</textarea></div></div>'+
    '<div class="fieldgrid two">'+inp('by','Noticed by (name)')+inp('byRole','Their role')+inp('second','Second adult present (name)')+inp('secondRole','Their role')+'</div>'+
    '<div class="fieldgrid two">'+inp('nurse','Passed to the school nurse (who, and when)')+inp('parent','Passed to the parent or guardian (who told them, and when)')+'</div>'+
    '<div class="rp"><p><b>Does this need a report?</b> Answer it for this injury now.</p>'+repHTML('draft',d.rep,false)+'</div>'+
    '<div class="tools"><button type="button" class="tool" id="imCareAdd">'+(k>=0?'Save changes':'Add to the record')+'</button><button type="button" class="tool" id="imCareClear">'+(k>=0?'Cancel':'Clear')+'</button></div><div id="imCareMiss"></div>';
  repVerdictTo('draft');}
function renderCare(){const tb=$('#imCare tbody');if(!tb)return;
  tb.innerHTML=S.care.length?S.care.map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+esc(c.date||NONE)+(c.time?'<br><span class="hint">'+esc(c.time)+'</span>':'')+'</td><td>'+esc(careArea(c))+'</td><td>'+esc(c.task)+'</td><td>'+esc(c.seen)+'</td>'+
    '<td>'+esc(c.by)+(c.byRole?'<br><span class="hint">'+esc(c.byRole)+'</span>':'')+'</td><td>'+esc(c.second)+(c.secondRole?'<br><span class="hint">'+esc(c.secondRole)+'</span>':'')+'</td>'+
    '<td>'+[c.nurse?'School nurse: '+esc(c.nurse):'',c.parent?'Parent or guardian: '+esc(c.parent):''].filter(Boolean).join('<br>')+'</td><td>'+esc(repShort(c.rep))+'</td>'+
    '<td class="noprint imCareAct"><button type="button" class="tool" data-careedit="'+i+'">Edit</button><button type="button" class="rowDel noprint" data-del="care" data-i="'+i+'" title="Delete this entry" aria-label="Delete entry '+(i+1)+'">&times;</button></td></tr>').join('')
    :'<tr><td colspan="10" class="hint">None recorded.</td></tr>';
  const open=S.care.map((c,i)=>({c,i})).filter(x=>x.c.rep.need!=='no'&&!(x.c.rep.need==='yes'&&['when','to','by'].every(k=>String(x.c.rep[k]||'').trim())));
  $('#imCareVerdict').innerHTML=open.length?'<div class="verdict v-no"><b>'+(open.length===1?'One entry still needs its report recorded':open.length+' entries still need their reports recorded')+':</b> entry '+open.map(x=>x.i+1).join(', ')+'. Record when, to whom and by whom (Edit).</div>':'';}
function careNew(area){CARE_OPEN=true;if(careEditing()<0&&CAREA[area])S.careDraft.area=area;
  if(!S.careDraft.date)S.careDraft.date=today();if(!document.body.classList.contains('view-history'))setView('history');renderCareEdit();const p=$('#imCareEdit');
  if(p){try{p.scrollIntoView({block:'start'});}catch(err){}const f=p.querySelector(S.careDraft.area?'[data-cd="task"]':'[data-cd="area"]');if(f)f.focus({preventScroll:true});}}
function careSave(){const d=S.careDraft,m=careMissing(d),k=careEditing();
  if(m.length){$('#imCareMiss').innerHTML='<div class="verdict v-no"><b>'+(k>=0?'Not saved yet.':'Not added yet.')+'</b> Still needed: '+m.join('; ')+'.</div>';nbhUI.toast((k>=0?'Not saved':'Not added')+': '+m.length+' thing'+(m.length===1?' is':'s are')+' still needed.',{kind:'warn'});return;}
  const e=careCopy(d);if(k>=0)S.care[k]=e;else{e.id=uid();S.care.push(e);}
  S.careDraft=careBlank();CARE_OPEN=false;SELP=null;renderCare();renderCareEdit();renderCur();
  nbhUI.toast(k>=0?'Entry '+(k+1)+' corrected.':'Recorded: an injury noticed during required care (entry '+S.care.length+').',{kind:'ok'});}
document.addEventListener('click',e=>{
  const nb=e.target.closest('[data-carenew]');if(nb){e.preventDefault();careNew(nb.dataset.carenew);return;}
  if(e.target.closest('#imCareAdd')){e.preventDefault();careSave();return;}
  if(e.target.closest('#imCareClear')){e.preventDefault();S.careDraft=careBlank();CARE_OPEN=false;renderCareEdit();return;}
  const ed=e.target.closest('button[data-careedit]');if(ed){e.preventDefault();const c=S.care[+ed.dataset.careedit];if(!c)return;S.careDraft=careCopy(c);CARE_OPEN=true;renderCareEdit();const p=$('#imCareEdit');if(p){try{p.scrollIntoView({block:'start'});}catch(err){}}}
});
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
  const miss=[];if(!m.beh)miss.push('the target behavior');if(!anyTopo)miss.push('the Part I checklist');if(!m.examiner)miss.push('the examiner');if(!m.second)miss.push('the second adult at every check');if(!m.intake)miss.push('the intake date');
  v.innerHTML=miss.length?'<div class="verdict v-mid"><b>Still missing:</b> '+miss.join(', ')+'.</div>':'<div class="verdict v-ok"><b>Set up.</b> '+topo+' of the five topographies that Part II can score are checked'+(S.healed.length?'; '+S.healed.length+' healed site'+(S.healed.length===1?'':'s')+' recorded':'')+'. Examiner: '+esc(m.examiner)+'; second adult: '+esc(m.second)+'.</div>';}

/* ---------------- input ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.rs!==undefined){repInput(el);return;}
  if(el.dataset.cd!==undefined){S.careDraft[el.dataset.cd]=el.value;return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.tagName!=='SELECT'){const r=el.dataset.r,i=+el.dataset.i,f=el.dataset.f;
    if(r==='rows'){const row=S.cur.rows[i];if(!row)return;row[f]=el.value;$$('[data-r="rows"][data-i="'+i+'"][data-f="'+f+'"]').forEach(x=>{if(x!==el)x.value=el.value;});renderIdxSoon();return;}
    if(!S[r]||!S[r][i])return;S[r][i][f]=el.value;if(r==='events')renderSchedSoon();return;}
  if(el.dataset.a!==undefined){S.cur[el.dataset.a]=el.value;if(el.dataset.a==='examiner'||el.dataset.a==='second')renderTwo();renderIdxSoon();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;S.meta[k]=el.value;$$('[data-m="'+k+'"]').forEach(x=>{if(x!==el)x.value=el.value;});if(k==='intake'||k==='every')renderSchedSoon();renderSetupSoon();}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.rs!==undefined){repInput(el);return;}
  if(el.dataset.cd!==undefined){S.careDraft[el.dataset.cd]=el.value;return;}
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
  const has={healed:x=>x.loc||x.ev||x.note,events:x=>x.date||x.note,nurse:x=>x.date||x.who||x.findings||x.action||x.referral,care:x=>true}[r];if(!has)return;
  if(has(row)&&!(await nbhUI.confirm(r==='care'?'Delete entry '+(i+1)+'?\nThe record of this injury, and of its report, is deleted.':'Delete this row?\nWhat was entered in it is deleted.',{ok:'Delete',danger:true})))return;
  S[r].splice(i,1);({healed:renderHealed,events:()=>{renderEvents();renderSched();},nurse:renderNurse,care:()=>{if(S.careDraft.id&&!S.care.some(c=>c.id===S.careDraft.id))S.careDraft=careBlank();renderCare();renderCareEdit();}})[r]();
}

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();bindAdm();renderHealed();renderEvents();renderSched();renderSetup();renderCur();renderHist();renderNurse();renderCare();renderCareEdit();}

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
  const rows=a=>Array.isArray(a)?a.filter(x=>x&&LOC[x.loc]).slice(0,LOCS.length).map(x=>({loc:x.loc,n:['1','2','3'].includes(str(x.n))?str(x.n):'',type:['AL','CT'].includes(x.type)?x.type:'',sev:['1','2','3'].includes(str(x.sev))&&x.type?str(x.sev):'',kind:str(x.kind),note:str(x.note),how:HOWN[str(x.how)]?str(x.how):'',view:['front','back','head'].includes(x.view)?x.view:'',x:num(x.x)==null?'':num(x.x),y:num(x.y)==null?'':num(x.y)})):[];
  /* v21.44: a file saved before the second adult, the report question and the care log opens with them empty */
  const adm=x=>({id:str(x&&x.id),date:str(x&&x.date),time:str(x&&x.time),examiner:str(x&&x.examiner),second:str(x&&x.second),note:str(x&&x.note),ro:!!(x&&x.ro),rows:rows(x&&x.rows),rep:repCopy(x&&x.rep)});
  o.cur=adm(obj('cur'));
  o.hist=Array.isArray(s.hist)?s.hist.slice(0,200).map(x=>{const a=adm(x);delete a.ro;if(!a.id)a.id=uid();return a;}):[];
  const seen={};o.hist.forEach(h=>{if(seen[h.id])h.id=uid();seen[h.id]=1;});
  o.healed=Array.isArray(s.healed)?s.healed.slice(0,5).map(x=>({loc:LOC[x&&x.loc]?x.loc:'',ev:HEALED.includes(x&&x.ev)?x.ev:'',note:str(x&&x.note)})):[];
  o.events=Array.isArray(s.events)?s.events.slice(0,100).map(x=>({date:str(x&&x.date),kind:EVKINDS.includes(x&&x.kind)?x.kind:'',note:str(x&&x.note)})):[];
  o.nurse=Array.isArray(s.nurse)?s.nurse.slice(0,300).map(x=>({date:str(x&&x.date),who:str(x&&x.who),findings:str(x&&x.findings),action:str(x&&x.action),referral:str(x&&x.referral)})):[];
  o.care=Array.isArray(s.care)?s.care.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,300).map(careCopy):[];
  const cs={};o.care.forEach(c=>{if(!c.id||cs[c.id])c.id=uid();cs[c.id]=1;});
  o.careDraft=s.careDraft&&typeof s.careDraft==='object'&&!Array.isArray(s.careDraft)?careCopy(s.careDraft):careBlank();
  if(o.careDraft.id&&!cs[o.careDraft.id])o.careDraft.id='';
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='IM-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved IM-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form IM-1. Nothing was changed.':'That file could not be read as a saved IM-1 form. Nothing was changed.');return;}
    const prev=S;S=next;SEL=null;SELP=null;CARE_OPEN=false;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved IM-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  /* v21.44: the three last columns (how it happened, the second adult, the answer to the report question) and the care log */
  const out=[['Record','Administration','Date','Examiner or nurse','Group','Location','Number','Type','Severity','Kind','Comment or findings','Part II number total','NI','SI','Injured locations','Risk','Risk rule','Action','Referral','How it happened','Second adult','Report']];
  const H=histSorted();const list=H.map(h=>({h,tag:'Administration'}));if(S.cur.rows.length&&!savedSame())list.push({h:S.cur,tag:'Current (not in the History)'});
  list.forEach((x,k)=>{const h=x.h,sc=score(h.rows),n=k<H.length?k+1:'current';
    if(!h.rows.length)out.push([x.tag,n,h.date,h.examiner,'','(no injuries)','','','','',h.note,sc.total,sc.ni,sc.si,sc.n,sc.risk||'',sc.rule,'','','',h.second||'',repCsv(h.rep)]);
    h.rows.forEach(r=>{const l=LOC[r.loc];if(!l)return;out.push([x.tag,n,h.date,h.examiner,GNAME[l.region],l.name,r.n,r.type,r.sev,r.kind,r.note,sc.total,sc.ni==null?'':sc.ni,sc.si==null?'':sc.si,sc.n,sc.risk||'',sc.rule,'','',HOWN[r.how]||'',h.second||'',repCsv(h.rep)]);});});
  S.nurse.forEach(r=>out.push(['Nurse check','',r.date,r.who,'','','','','','',r.findings,'','','','','','',r.action,r.referral,'','','']));
  S.care.forEach(c=>{const a=CAREA[c.area],l=a&&LOC[a[2]];out.push(['Noticed during required care','',c.date,c.by+(c.byRole?' ('+c.byRole+')':''),l?GNAME[l.region]:'',a?a[1]:'','','','','',c.seen+(c.task?' (during '+c.task+')':''),'','','','','','','',[c.nurse?'School nurse: '+c.nurse:'',c.parent?'Parent or guardian: '+c.parent:''].filter(Boolean).join('; '),'',c.second+(c.secondRole?' ('+c.secondRole+')':''),repCsv(c.rep)]);});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='IM-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();SEL=null;SELP=null;CARE_OPEN=false;renderAll();setView('setup');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nEvery page is filled with a worked example: three administrations over six weeks. Anything already entered will be replaced.',{ok:'Load'})))return;
  const off=x=>{const m=x.getMonth(),d=x.getDate(),w=x.getDay(),n=Math.ceil(d/7),last=d+7>new Date(x.getFullYear(),m+1,0).getDate();
    return !(w%6)||(m===0&&(d<=2||(w===1&&n===3)))||(m===1&&w===1&&n===3)||(m===4&&w===1&&last)||(m===5&&d===19)||(m===6&&d===4)||(m===8&&w===1&&n===1)||(m===10&&(d===11||(w===4&&n===4)||(w===5&&d>=23&&d<=29)))||(m===11&&d>=24);};
  const step=(n,dir)=>{const d=new Date();d.setHours(12,0,0,0);while(off(d))d.setDate(d.getDate()-1);for(let k=n;k>0;){d.setDate(d.getDate()+dir);if(!off(d))k--;}return d;};
  const Y=n=>MDY(step(n,-1));
  S=blank();SEL=null;SELP=null;CARE_OPEN=false;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'4',dob:'',site:'Elementary, self-contained classroom',bcba:'Joshua Newsome, M.A., BCBA',
    beh:'Self-injury: head hitting and hand biting',behdef:'Head hitting: forceful contact of the head with a hard surface or the fist from 15 cm or more. Hand biting: closing the teeth on the hand or wrist hard enough to leave a mark (Form TB-1).',
    plan:'CR-1 dated '+Y(32)+'; restraint log on CR-1; medical review after any High estimate',medical:'No bleeding disorder; no allergy; risperidone 0.5 mg since '+Y(40)+' (Form MS-1)',
    t_other_text:'',examiner:'School nurse (RN), with the BCBA observing the first two',second:'Classroom aide (simulated), paraprofessional',consent:'Yes, initialed on Form IC-1 (simulated)',trained:'Nurse and BCBA scored two students together on '+Y(33)+'; agreement on every item',nurse:'School nurse (simulated)',intake:Y(30),every:'3',tod:'Arrival, 8:05, in the health room'};
  S.chk={t_head:true,t_body:true,t_bite:true,t_scratch:true};
  S.healed=[{loc:'scalp',ev:'Scar',note:'2 cm linear scar above the right ear; parent reports a laceration from head hitting two years ago'},{loc:'hand_R',ev:'Other',note:'callused, thickened skin over the base of the right thumb from biting'}];
  S.events=[{date:Y(22),kind:'Restraint',note:'Standing hold, 2 minutes, during a head-hitting episode at the transition after lunch (CR-1 log)'}];
  /* v21.44: every administration names the second adult and answers the report question */
  const aide='Classroom aide (simulated), paraprofessional',noRep=why=>Object.assign(repBlank(),{need:'no',why});
  const adm=(d,ex,note,rows,why)=>histEntry({date:d,time:'08:05',examiner:ex,second:aide,note,rows,rep:noRep(why)});
  const R=(loc,n,type,sev,kind,note,how)=>{const v=homeView(loc),s=SURF[loc][v];return{loc,n,type,sev,kind,note,how:how||'',view:v,x:s.cx,y:s.cy};};
  const nurse='School nurse (simulated)',fits='Every injury matches the head hitting and hand biting staff have seen this student do; no box applies.';
  S.hist=[
    adm(Y(30),nurse,'Intake. Examined in the health room by the nurse, with the classroom aide as the second adult; sleeves and pant legs rolled up, shoes and socks off, the back and stomach seen by lifting the shirt a little; private areas not examined.',[
      R('scalp','2','CT','2','bruise','two raised, swollen areas over the right parietal scalp, 3 and 4 cm, extensive swelling, no break in the skin','match'),
      R('eyearea_L','1','AL','1','scratch','spotted scabbing below the left eye from picking','match'),
      R('hand_R','3','AL','2','bite','five distinct superficial bite marks over the base of the right thumb and the back of the hand','seen'),
      R('larm_L','1','CT','2','bruise','extensive swelling and discoloration over the left forearm from banging it on the desk edge','seen'),
      R('face','1','CT','1','bruise','faint discoloration over the right cheek, no swelling','match')],fits),
    adm(Y(15),nurse,'Three weeks; the plan (FCT and noncontingent attention) in its second week. Head hitting falling on Form DD-1.',[
      R('scalp','1','CT','1','bruise','one area of discoloration, swelling gone','match'),
      R('hand_R','2','AL','2','bite','three superficial bite marks, two of them healing','seen'),
      R('larm_L','1','CT','2','bruise','forearm still swollen after the arm banging on '+Y(20),'seen')],fits),
    adm(Y(0),nurse,'Six weeks. No head hitting on Form DD-1 for nine school days; hand biting at under one a day.',[
      R('hand_R','1','AL','1','bite','one spotted mark at the base of the thumb; the older marks healed','seen')],'One bite mark, seen to happen; no box applies.')];
  /* v21.44: a bruise the aide noticed while helping with toileting: both adults named, nothing more looked at, and the report the aide made the same day */
  S.care=[careCopy({id:uid(),date:Y(8),time:'10:20',area:'buttocks',task:'help with toileting',
    seen:'A bruise about 3 cm across, blue and purple, on the left buttock, seen while helping the student pull up their pants. Nothing more was looked at.',
    by:'Classroom aide (simulated)',byRole:'Paraprofessional',second:'Classroom teacher (simulated)',secondRole:'Teacher',
    nurse:'Told at 10:35 the same morning (simulated)',parent:'Told as the agency\u2019s policy directs, after the report (simulated)',
    rep:Object.assign(repBlank(),{r1:true,r3:true,need:'yes',when:Y(8)+', 11:05 AM',to:'State child abuse hotline (simulated), reference SIM-0000',by:'Classroom aide (simulated), the person who noticed it',told:'School nurse and the BCBA, the same morning (simulated)'})})];
  S.cur=curFrom(S.hist[2],false);
  S.nurse=[{date:Y(30),who:nurse,findings:'Scalp swelling as scored; no change in pupils or alertness; forearm swollen, full movement',action:'Ice to the scalp and forearm; parent called; the plan reviewed with the BCBA the same day (CR-1 medical review)',referral:'Pediatrician seen '+Y(29)+': no fracture; prescriber told'},
    {date:Y(15),who:nurse,findings:'Scalp settled; forearm still swollen; bite marks superficial and clean',action:'Forearm wrapped for the day; wound care on a fixed schedule (10:00 and 13:00) rather than after each bite',referral:'None'},
    {date:Y(0),who:nurse,findings:'One small mark on the hand; everything else healed',action:'Checks moved to twice a week',referral:'None'}];
  renderAll();setView('history');
  nbhUI.toast('Simulation loaded: three administrations over six weeks, the estimate falling from High to Moderate to Low, with a nurse check for each, and one injury noticed during toileting.',{kind:'ok'});
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
