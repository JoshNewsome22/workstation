const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:null;};
const T=v=>String(v==null?'':v).trim();
const NONE='–';
const pct=x=>x==null?NONE:Math.round(x)+'%';
const dec=(x,d)=>x==null?NONE:(Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);

/* ---- a row can be deleted anywhere (the workstation's pattern, v21.33) ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---- save a graph as a PNG (the workstation's pattern, v21.33) ---- */
function graphFile(id,who){const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');return id+'_graph_'+((String(who||'').trim()||'student').replace(/[^\w-]+/g,'_'))+'_'+ymd+'.png';}
function svgToPng(svg,fname){if(!svg)return;const vb=(svg.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);const W=vb[2]||900,H=vb[3]||320;
  const xml=new XMLSerializer().serializeToString(svg);const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
    c.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname;document.body.appendChild(a);a.click();a.remove();});};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);}

/* ================= v25.65 FEED-H3: the screen and the gate ================= */
const RF=[['wt','Weight loss or flat growth'],['tube','Tube feeding or nutrition drinks'],['cough','Coughing, choking, or a wet or gurgly voice during or after meals'],['gag','Gagging or vomiting at meals'],
  ['pain','Signs of pain (reflux, constipation, dental pain)'],['puree','Eats only purees or one texture'],['long','Meals longer than 30 minutes'],['drink','Drinks too little'],['pica','A history of pica (eating things that are not food)']];
const RFV=[['','Not answered'],['no','No'],['yes','Yes'],['unk','Unknown']];
const SWALLOW=['cough','gag','puree'];   /* the red flags that need the swallow evaluation on file */
const PTYPE=[['','Not sorted yet'],['refusal','Food refusal: eats too little to meet needs, or depends on a tube or nutrition drinks'],['type','Selectivity by type: eats enough, but a narrow range of foods'],
  ['texture','Selectivity by texture'],['both','Both: selectivity by type and by texture']];
const PTYPEN=Object.fromEntries(PTYPE);
const LEAD_TEAM='Medical feeding team leads. The school and home plan holds mealtime structure, data and caregiver support only, until the team advises.';
const LEAD_MENU='School or home plan may use the non-forcing menu (Part 3).';
const NO_PAGE='Clearance missing: the form will not print a treatment page.';
/* v25.65 FEED-H4: the observation */
const OFFER=[['','–'],['self','Taken by the student from the plate'],['front','Offered by an adult in front of the student']];
const YN=[['','–'],['y','Yes'],['n','No']];
const CLEAN=[['','–'],['y','Yes'],['n','No'],['nc','Not checked']];
const ADULT=[['','–'],['coax','Coaxed or talked'],['repr','Reprimanded'],['remove','Removed the bite or ended the meal'],['pref','Gave a preferred food or toy'],['praise','Praised'],['wait','Waited']];
const ADULTN=Object.fromEntries(ADULT);
const PORTION=[['','–'],['none','None'],['q','About a quarter'],['h','About half'],['tq','About three quarters'],['all','All of it']];
const PORTIONN=Object.fromEntries(PORTION);
/* v25.65 FEED-M1: the food lists */
const GROUPS=['','Fruit','Vegetable','Protein','Grain or starch','Dairy','Other'];
const NOWFROM=['','Three-day family record','Meal observation','Family report'];
const PREFHOW=['','PA-1 paired-stimulus food assessment','PA-1 MSWO food assessment','Family or staff report (a starting list)'];
/* v25.65 FEED-H5: the menu */
const OFFERP=[['front','In front of the student (on the plate, or on a spoon held in front)'],['lips','At the lips (the spoon brought to the lips and removed calmly if the bite is not taken)']];
const DFSTEPS=['touch','kiss','lick','bite','chew','swallow'];
const DFWORDS={touch:'touch the food',kiss:'kiss the food (touch it to the lips)',lick:'lick the food',bite:'bite the food and spit it out if they wish',chew:'bite and chew the food, then spit it out if they wish',swallow:'bite, chew and swallow the food'};
const FADEK=[['flavor','A liked flavor added, then faded (chocolate in milk)'],['blend','Blending the target food into a preferred one, then less of it'],['size','Bite size, from a dipped spoon to a level spoon']];
const FADEKN=Object.fromEntries(FADEK);
/* the TD-1 protocol cards each item links to (keys in nbh-td1-bank.js) */
const CARDS={'dra-target-food-prompts-praise':'Offer a refused food at every meal with clear prompts and praise for each bite','a_highp-preferred-food-bites':'Three bites of a preferred food before each bite of a refused food, then fade',
  'p_sf-preferred-food-same-bite':'Serve a new food on the same bite as a preferred food','choice-condiment-on-vegetables':'Put a preferred condiment the student picks on each bite of a refused vegetable',
  'p_sf-preferred-food-on-spoon':'Put preferred food behind each new bite on the spoon to reduce packing','dra-simultaneous-preferred-food':'Present a new food on top of a preferred food so both are taken together',
  'dra-preferred-food-bites':'Preferred food or drink after each accepted bite (without escape extinction)','a_highp-food-step-sequence':'Easy food-contact requests before a harder tasting step, raised step by step',
  'df-bite-steps-dra-thinning':'Demand fading through touch-to-swallow steps with differential reinforcement','p_sf-flavor-fade-milk':'Add a liked flavor to a refused drink, then fade it out slowly',
  'dri-utensil-down-pacing':'Utensil down between bites, with praise, to slow rapid eating at school lunch','s_drl-pager-paced-bites':'Pace bites at mealtime with a vibrating pager cue',
  'p_sf-pager-intensity-pacing':'Fade a vibrating pager cue for bite pacing by lowering its strength','s_drl-pager-bite-spacing':'Pacing bites at meals with a vibrating pager, a rule, and blocking of early bites',
  'rird-pica-block-redirect-discard':'Pica plan: competing items, block and redirect each attempt, and reward throwing items away','ee-firm-oral-items-pica':'Keep firm chewable items always available to compete with pica',
  'effort-pica-alternatives-in-hand':'Keep safe alternative items in the student’s hand and pica items hard to reach'};
const cardLine=keys=>'TD-1 protocol bank: '+keys.split(/\s+/).filter(k=>CARDS[k]).map(k=>'<b>'+esc(CARDS[k])+'</b> <code>'+esc(k)+'</code>').join('; ')+'. Search the bank on Form TD-1 for the card&rsquo;s words; the study and its full procedure are on the card, and this plan runs only the steps printed here.';

/* ---------------- state ---------------- */
const biteBlank=()=>({food:'',size:'',off:'',acc:'',clean:'',pack:false,exp:false,ref:false,gag:false,adult:''});
const obsBlank=()=>({date:'',feeder:'',where:'',foods:'',minutes:'',portion:'',bites:[]});
const mealBlank=()=>({id:uid(),date:'',phase:'',feeder:'',minutes:'',count:'',portion:'',gBefore:'',gAfter:'',foods:'',slept:false,unwell:false,ate1h:false,upset:false,note:'',bites:[]});
function blank(){return{meta:{},chk:{m1:true},rf:{},plan:{},obs:obsBlank(),foods:{now:[],target:[],pref:[]},tex:[],meals:[],wts:[]};}
const uid=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let S=blank(),CUR=-1,CASE={menu:[],note:''};
function ensure(){
  ['meta','chk','rf','plan'].forEach(k=>{if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={};});
  if(!S.obs||typeof S.obs!=='object')S.obs=obsBlank();if(!Array.isArray(S.obs.bites))S.obs.bites=[];
  if(!S.foods||typeof S.foods!=='object')S.foods={};['now','target','pref'].forEach(k=>{if(!Array.isArray(S.foods[k]))S.foods[k]=[];});
  ['tex','meals','wts'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  S.meals.forEach(m=>{if(!m.id)m.id=uid();if(!Array.isArray(m.bites))m.bites=[];});
  if(CUR>=S.meals.length)CUR=S.meals.length-1;
}
/* dates as the sheets write them (M/D/YYYY, M/D/YY) or ISO */
function pDate(s){s=T(s);let m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[1]-1,+m[2],12);}
  m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3],12);return null;}
const MDY=d=>(d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
const today=()=>MDY(new Date());
const iso=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';
const opts=(a,v)=>a.map(o=>Array.isArray(o)?`<option value="${esc(o[0])}"${o[0]===v?' selected':''}>${esc(o[1])}</option>`:`<option${o===v?' selected':''}>${esc(o)}</option>`).join('');

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ================= v25.65 FEED-H3: who leads =================
   path 'team': a red flag answered yes, food refusal, or selectivity by texture (alone or with type)
   path 'menu': selectivity by type, every red flag answered no, the doctor's clearance on file
   path 'open': not decided yet (a red flag not answered or unknown, or the problem not sorted)
   page: a treatment page prints only with the doctor's clearance, and the swallow evaluation when a swallowing red flag
   or a texture problem is recorded */
function lead(){const m=S.meta,rf=S.rf,t=m.ptype||'';
  const yes=RF.filter(([k])=>rf[k]==='yes'),open=RF.filter(([k])=>rf[k]!=='yes'&&rf[k]!=='no');
  const texture=t==='texture'||t==='both',swNeed=texture||SWALLOW.some(k=>rf[k]==='yes');
  const missing=[];if(!T(m.mdClr))missing.push('the doctor’s clearance (date)');if(swNeed&&!T(m.swDate))missing.push('the swallow evaluation (date)');
  let path='open',why=[];
  if(yes.length||t==='refusal'||texture){path='team';
    if(yes.length)why.push('red flag'+(yes.length>1?'s':'')+': '+yes.map(x=>x[1].toLowerCase()).join('; '));
    if(t==='refusal')why.push('food refusal');if(texture)why.push(t==='both'?'selectivity by type and by texture':'selectivity by texture');}
  else if(t==='type'&&!open.length&&!missing.length)path='menu';
  else{if(!t)why.push('the problem type is not sorted yet');if(open.length)why.push(open.length+' red flag'+(open.length>1?'s':'')+' not answered or unknown');if(t==='type'&&missing.length)why.push('the clearance is not on file');}
  const advised=!!(T(m.team)&&T(m.teamAdv));
  return {path,why,missing,page:!missing.length&&path!=='open',advised,selectivity:t==='type'||t==='both',yes,open};}

function renderRF(){$('#fdRF tbody').innerHTML=RF.map(([k,l])=>`<tr><td>${esc(l)}</td><td><select data-rf="${k}" aria-label="${esc(l)}">${opts(RFV,S.rf[k]||'')}</select></td></tr>`).join('');}
function renderLead(){const L=lead(),el=$('#fdLead');let h='';
  if(L.path==='team')h=`<p class="verdict v-no fdLead">${esc(LEAD_TEAM)}</p><p class="hint">Why: ${esc(L.why.join('; '))}.${L.advised?' The team&rsquo;s advice is recorded ('+esc(S.meta.team)+', '+esc(S.meta.teamAdv)+'): the Plan page offers the rest of the menu and the restrictive option for the steps the team advises.':' When the team advises the plan, record who and the date above.'}</p>`;
  else if(L.path==='menu')h=`<p class="verdict v-ok fdLead">${esc(LEAD_MENU)}</p>`;
  else h=`<p class="verdict v-mid fdLead">Not decided yet: ${esc(L.why.join('; '))}.</p>`;
  if(L.missing.length)h+=`<p class="verdict v-no">${esc(NO_PAGE)} Missing: ${esc(L.missing.join(' and '))}.</p>`;
  el.innerHTML=h;}
/* v25.65 FEED-L4: pica goes to the pica targets and cards */
function renderPica(){const on=S.rf.pica==='yes',h=on?`<div class="fdItem"><h3>Pica</h3><p>Define it on Form TB-1 with the target <b>Pica (non-food items past the lips)</b> (<code>feed-pica</code>), and plan it on Form TD-1. ${cardLine('rird-pica-block-redirect-discard ee-firm-oral-items-pica effort-pica-alternatives-in-hand')}</p><p><b>Ask the doctor about medical checks (for example lead and iron levels). Pica assessments with baited items are clinic procedures.</b></p></div>`:'';
  $('#fdPica').innerHTML=h;$('#fdPlanPica').innerHTML=h;}
/* v25.65 FEED-L5: a sensory-based feeding approach */
const SENSORY_NOTE='In direct comparisons, a modified sequential oral sensory approach and sensory integration therapy did not raise consumption; behavioral treatment did.';
function sensoryOn(){return !!S.chk.sensory||/sensory|\bSOS\b|sequential oral/i.test(S.meta.ther||'');}
function renderSensory(){const h=sensoryOn()?`<p class="verdict v-mid" data-sensory="1">${esc(SENSORY_NOTE)} (Peterson et al., 2016; Addison et al., 2012.)</p>`:'';$('#fdSensory').innerHTML=h;$('#fdPlanSensory').innerHTML=h;}
/* v25.65 FEED-M8: texture and bite-size steps */
function renderTex(){$('#fdTex tbody').innerHTML=S.tex.map((r,i)=>`<tr><td><input data-tx="${i}" data-f="date" value="${esc(r.date)}" placeholder="M/D/YYYY"></td><td><input data-tx="${i}" data-f="step" value="${esc(r.step)}"></td><td><input data-tx="${i}" data-f="by" value="${esc(r.by)}"></td><td><input data-tx="${i}" data-f="role" value="${esc(r.role)}" placeholder="SLP"></td>${delCell('tex',i,'step')}</tr>`).join('')||'<tr><td colspan="5" class="hint">No step written yet: the plan prints the order above.</td></tr>';}
function texNow(){const m=S.meta,steps=S.tex.filter(r=>T(r.step)).map((r,i)=>({r,i,d:pDate(r.date)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d:a.i-b.i);const last=steps.length?steps[steps.length-1].r:null;
  return {tex:T(m.tex),liq:T(m.liq),bite:T(m.bite),by:T(m.presc),date:T(m.presDate),last};}

/* ================= v25.65 FEED-H4: the meal observation ================= */
const BHEAD=(kind,i,b)=>{const a=`data-bk="${kind}" data-i="${i}"`,sel=(f,list)=>`<select ${a} data-f="${f}" aria-label="${f} ${i+1}">${opts(list,b[f]||'')}</select>`,ck=f=>`<td class="c"><input type="checkbox" ${a} data-f="${f}"${b[f]?' checked':''} aria-label="${f} ${i+1}"></td>`;
  return {sel,ck};};
function renderObs(){const o=S.obs;$$('[data-o]').forEach(el=>{el.value=o[el.dataset.o]||'';});
  $('#fdObsBites tbody').innerHTML=o.bites.map((b,i)=>{const {sel,ck}=BHEAD('obs',i,b);return `<tr><td class="num">${i+1}</td><td>${sel('off',OFFER)}</td><td>${sel('acc',YN)}</td><td>${sel('clean',CLEAN)}</td>${ck('pack')}${ck('exp')}${ck('ref')}${ck('gag')}<td>${sel('adult',ADULT)}</td>${delCell('obs',i,'bite')}</tr>`;}).join('');
  $('#fdObsCount').textContent=o.bites.length+' bite'+(o.bites.length===1?'':'s')+(o.bites.length&&(o.bites.length<10||o.bites.length>20)?' (about 10 to 20 makes a usual meal)':'');
  renderObsSum();}
function obsStats(){const B=S.obs.bites.filter(b=>b.acc||b.ref||b.adult);const ref=B.filter(b=>b.ref),acc=B.filter(b=>b.acc==='y');
  const rows=ADULT.filter(a=>a[0]).map(([k,l])=>({k,l,afterRef:ref.length?ref.filter(b=>b.adult===k).length/ref.length*100:null,afterAcc:acc.length?acc.filter(b=>b.adult===k).length/acc.length*100:null}));
  const chk=acc.filter(b=>b.clean==='y'||b.clean==='n');
  return {n:B.length,nRef:ref.length,nAcc:acc.length,rows,pAcc:B.length?acc.length/B.length*100:null,pClean:chk.length?chk.filter(b=>b.clean==='y').length/chk.length*100:null,nc:acc.filter(b=>b.clean==='nc').length};}
function obsHyp(st){const att=st.rows.filter(r=>(r.k==='coax'||r.k==='repr')&&r.afterRef!=null&&r.afterRef>=50);
  return 'Working hypothesis: escape (refusal may be kept going because it ends or delays the bite or the meal).'+(att.length?' Attention is noted: '+att.map(r=>r.l.toLowerCase()+' followed '+Math.round(r.afterRef)+'% of refusals').join('; ')+'.':'');}
function renderObsSum(){const st=obsStats(),o=S.obs;
  if(!st.n){$('#fdObsSum').innerHTML='<p class="hint">Enter the bites to see what followed refusal and acceptance.</p>';return;}
  $('#fdObsSum').innerHTML=`<div class="metrics"><div class="metric"><b>Bites</b><div class="val">${st.n}</div><div class="sub">${st.nRef} with refusal, ${st.nAcc} accepted</div></div>
    <div class="metric"><b>Accepted</b><div class="val">${pct(st.pAcc)}</div></div><div class="metric"><b>Mouth clean of accepted</b><div class="val">${pct(st.pClean)}</div><div class="sub">${st.nc} not checked</div></div>
    <div class="metric"><b>Meal minutes</b><div class="val">${esc(T(o.minutes)||NONE)}</div></div><div class="metric"><b>Portion eaten</b><div class="val" style="font-size:16px">${esc(PORTIONN[o.portion]&&o.portion?PORTIONN[o.portion]:NONE)}</div></div></div>
    <div class="grid-wrap"><table class="rt" id="fdObsTbl"><thead><tr><th>What the adult did within 10 s</th><th class="num">After refusal (% of ${st.nRef})</th><th class="num">After acceptance (% of ${st.nAcc})</th></tr></thead><tbody>${st.rows.map(r=>`<tr><td>${esc(r.l)}</td><td class="num">${pct(r.afterRef)}</td><td class="num">${pct(r.afterAcc)}</td></tr>`).join('')}</tbody></table></div>
    <p class="verdict v-mid" id="fdObsHyp">${esc(obsHyp(st))}</p>`;}

/* ================= v25.65 FEED-M1: the food lists ================= */
function renderFoods(){const F=S.foods;
  const row=(L,i,r,cells)=>`<tr>${cells}${delCell(L,i,'food')}</tr>`;
  $('#fdNow tbody').innerHTML=F.now.map((r,i)=>row('now',i,r,`<td><input data-fl="now" data-i="${i}" data-f="food" value="${esc(r.food)}"></td><td><input data-fl="now" data-i="${i}" data-f="tex" value="${esc(r.tex)}"></td><td><select data-fl="now" data-i="${i}" data-f="src">${opts(NOWFROM,r.src||'')}</select></td>`)).join('');
  $('#fdTarget tbody').innerHTML=F.target.map((r,i)=>row('target',i,r,`<td><input data-fl="target" data-i="${i}" data-f="food" value="${esc(r.food)}"></td><td><select data-fl="target" data-i="${i}" data-f="group">${opts(GROUPS,r.group||'')}</select></td><td><input data-fl="target" data-i="${i}" data-f="by" value="${esc(r.by)}" placeholder="the family and the dietitian"></td>`)).join('');
  $('#fdPref tbody').innerHTML=F.pref.map((r,i)=>row('pref',i,r,`<td><input data-fl="pref" data-i="${i}" data-f="food" value="${esc(r.food)}"></td><td><input data-fl="pref" data-i="${i}" data-f="rank" value="${esc(r.rank)}" inputmode="numeric"></td><td><select data-fl="pref" data-i="${i}" data-f="how">${opts(PREFHOW,r.how||'')}</select></td>`)).join('');
  const n=F.target.filter(r=>T(r.food)).length;$('#fdTargetCount').textContent=n+' target food'+(n===1?'':'s')+(n&&(n<4||n>16)?': choose 4 to 16 with the family':'');}
$$('[data-addlist]').forEach(b=>b.addEventListener('click',()=>{const L=b.dataset.addlist,F=S.foods[L];if(F.length>=40)return;F.push(L==='now'?{food:'',tex:'',src:''}:L==='target'?{food:'',group:'',by:''}:{food:'',rank:'',how:''});renderFoods();const l=$$('#fd'+{now:'Now',target:'Target',pref:'Pref'}[L]+' tbody tr');if(l.length){const x=l[l.length-1].querySelector('input');if(x)x.focus();}}));
$('#fdFromPA').addEventListener('click',()=>{const ed=(CASE.menu||[]).filter(x=>x&&T(x.name)&&/edible|food|snack|drink/i.test(T(x.type)));
  if(!ed.length){$('#fdPAStatus').textContent='The case holds no foods ranked on Form PA-1 yet.';return;}
  let n=0;ed.forEach(x=>{if(S.foods.pref.some(r=>T(r.food).toLowerCase()===T(x.name).toLowerCase()))return;S.foods.pref.push({food:T(x.name),rank:x.rank!=null?String(x.rank):'',how:''});n++;});
  renderFoods();$('#fdPAStatus').textContent=n?n+' added from Form PA-1. Choose how each was ranked.':'Every food ranked on Form PA-1 is already listed.';});

/* ================= v25.65 FEED-H6, FEED-M7: the data ================= */
const scored=b=>!!(b.acc||b.ref);   /* a bite counts as presented once it is scored accepted or not, or as a refusal */
function mStats(m){const B=(m.bites||[]).filter(scored);const n=B.length,acc=B.filter(b=>b.acc==='y'),chk=acc.filter(b=>b.clean==='y'||b.clean==='n');
  const pack=acc.filter(b=>b.pack).length,exp=B.filter(b=>b.exp).length,ref=B.filter(b=>b.ref).length,gag=B.filter(b=>b.gag).length;
  const min=num(m.minutes),cnt=num(m.count),taken=acc.length||(cnt!=null?cnt:0);
  const gb=num(m.gBefore),ga=num(m.gAfter);
  return {n,acc:acc.length,pAcc:n?acc.length/n*100:null,pClean:chk.length?chk.filter(b=>b.clean==='y').length/chk.length*100:null,nc:acc.filter(b=>b.clean==='nc').length,
    pPack:acc.length?pack/acc.length*100:null,expPer:acc.length?exp/acc.length:null,refPer:n?ref/n:null,gag,min,spb:min!=null&&taken?min*60/taken:null,grams:gb!=null&&ga!=null?gb-ga:null};}
function mealsSorted(){return S.meals.map((m,i)=>({m,i,d:pDate(m.date)})).sort((a,b)=>(a.d&&b.d)?a.d-b.d||a.i-b.i:a.d?-1:b.d?1:a.i-b.i);}
const SE=m=>[m.slept?'S':'',m.unwell?'U':'',m.ate1h?'A':''].filter(Boolean).join(' ');
function renderMeals(){const L=mealsSorted();
  $('#fdMeals tbody').innerHTML=L.map(({m,i},k)=>{const s=mStats(m);return `<tr${i===CUR?' class="sel"':''}><td class="num">${k+1}</td><td>${esc(m.date||NONE)}</td><td>${esc(m.phase||NONE)}</td><td class="num">${esc(T(m.minutes)||NONE)}</td><td class="num">${s.n||esc(T(m.count)||NONE)}</td><td class="num">${pct(s.pAcc)}</td><td class="num">${pct(s.pClean)}${s.nc?' <span class="hint">('+s.nc+' not checked)</span>':''}</td><td class="num">${pct(s.pPack)}</td><td class="num">${dec(s.expPer,2)}</td><td class="num">${dec(s.refPer,2)}</td><td class="num">${s.spb==null?NONE:Math.round(s.spb)}</td><td>${esc(PORTIONN[m.portion]&&m.portion?PORTIONN[m.portion]:'')}${s.grams!=null?' '+dec(s.grams,0)+' g':''}</td><td>${esc(SE(m))}${m.upset?' <span class="hint">upset</span>':''}</td><td class="noprint"><button type="button" data-open="${i}">Open</button></td>${delCell('meals',i,'meal')}</tr>`;}).join('')||'<tr><td colspan="15" class="hint">No meal yet. Add a meal, then enter its bites.</td></tr>';
  renderMealEdit();renderMetrics();renderPlot();}
function foodOpts(){const t=S.foods.target.map(r=>T(r.food)).filter(Boolean),p=S.foods.pref.map(r=>T(r.food)).filter(Boolean);return [''].concat(t,p.filter(x=>!t.includes(x)));}
function renderMealEdit(){const el=$('#fdMealEdit');const m=S.meals[CUR];if(!m){el.innerHTML='';return;}
  const k=mealsSorted().findIndex(x=>x.i===CUR)+1,a=f=>`data-ml="${f}"`,F=foodOpts();
  el.innerHTML=`<div class="instr"><p><b>Meal ${k}</b>${m.date?' &middot; '+esc(m.date):''}</p>
   <div class="fieldgrid"><div><label>Date</label><input ${a('date')} value="${esc(m.date)}" placeholder="M/D/YYYY"></div><div><label>Phase (a new name starts a new phase on the graph)</label><input ${a('phase')} value="${esc(m.phase)}" placeholder="Baseline"></div>
   <div><label>Feeder</label><input ${a('feeder')} value="${esc(m.feeder)}"></div><div><label>Meal minutes</label><input ${a('minutes')} value="${esc(m.minutes)}" inputmode="decimal"></div>
   <div><label>Bites taken (only when the bites are not entered one by one)</label><input ${a('count')} value="${esc(m.count)}" inputmode="numeric"></div>
   <div><label>Portion eaten</label><select ${a('portion')}>${opts(PORTION,m.portion||'')}</select></div>
   <div><label>Plate before (grams, when the family agrees)</label><input ${a('gBefore')} value="${esc(m.gBefore)}" inputmode="decimal"></div><div><label>Plate after (grams)</label><input ${a('gAfter')} value="${esc(m.gAfter)}" inputmode="decimal"></div>
   <div><label>Foods offered</label><input ${a('foods')} value="${esc(m.foods)}"></div><div><label>Note</label><input ${a('note')} value="${esc(m.note)}"></div></div>
   <div class="ckrow"><label class="ck"><input type="checkbox" ${a('slept')}${m.slept?' checked':''}> Slept poorly</label><label class="ck"><input type="checkbox" ${a('unwell')}${m.unwell?' checked':''}> Unwell</label><label class="ck"><input type="checkbox" ${a('ate1h')}${m.ate1h?' checked':''}> Ate within the last hour</label><label class="ck"><input type="checkbox" ${a('upset')}${m.upset?' checked':''}> Upset or distressed at this meal</label></div></div>
   <div class="grid-wrap"><table class="rt bites wide"><thead><tr><th>#</th><th>Food</th><th>Bite size</th><th>Offered</th><th>Accepted within 5 s</th><th>Mouth clean at 30 s</th><th>Packed</th><th>Expelled</th><th>Refusal</th><th>Gag or cough</th><th class="nx"></th></tr></thead><tbody>${m.bites.map((b,i)=>{const {sel,ck}=BHEAD('meal',i,b);
     const fo=F.includes(b.food)?F:F.concat([b.food]);return `<tr><td class="num">${i+1}</td><td><select data-bk="meal" data-i="${i}" data-f="food" aria-label="food ${i+1}">${opts(fo,b.food||'')}</select></td><td><input data-bk="meal" data-i="${i}" data-f="size" value="${esc(b.size)}" aria-label="bite size ${i+1}"></td><td>${sel('off',OFFER)}</td><td>${sel('acc',YN)}</td><td>${sel('clean',CLEAN)}</td>${ck('pack')}${ck('exp')}${ck('ref')}${ck('gag')}${delCell('bite',i,'bite')}</tr>`;}).join('')}</tbody></table></div>
   <div class="tools"><button type="button" id="fdBiteAdd">Add a bite</button><button type="button" id="fdBiteAdd10">Add 10 bites</button><span class="status">${m.bites.length} bite${m.bites.length===1?'':'s'}</span></div>`;
  $('#fdBiteAdd').addEventListener('click',()=>addBites(1));$('#fdBiteAdd10').addEventListener('click',()=>addBites(10));}
function addBites(n){const m=S.meals[CUR];if(!m)return;for(let k=0;k<n&&m.bites.length<60;k++){const last=m.bites[m.bites.length-1];const b=biteBlank();if(last){b.food=last.food;b.size=last.size;b.off=last.off;}m.bites.push(b);}renderMeals();}
function newMeal(){if(S.meals.length>=400)return;const m=mealBlank();const L=mealsSorted(),last=L.length?L[L.length-1].m:null;m.date=today();if(last){m.phase=last.phase;m.feeder=last.feeder;}S.meals.push(m);CUR=S.meals.length-1;renderMeals();setView('data');const x=$('#fdMealEdit input');if(x)x.focus();}
$('#fdNewMeal').addEventListener('click',newMeal);$('#fdNewMeal2').addEventListener('click',newMeal);
$('#fdMeals').addEventListener('click',e=>{const b=e.target.closest('button[data-open]');if(!b)return;CUR=+b.dataset.open;renderMeals();const x=$('#fdMealEdit');if(x)x.scrollIntoView({block:'start'});});

/* criterion (the BCBA's decision of 11/2: per-response measures master at 100%): a target food is eaten at criterion when, at its
   last 3 meals, every bite of it offered was accepted and every accepted bite that was checked was mouth clean at 30 s */
const CRIT_N=3;
function foodCrit(){const L=mealsSorted(),targets=S.foods.target.map(r=>T(r.food)).filter(Boolean);
  return targets.map(f=>{const ms=L.map(x=>x.m.bites.filter(b=>T(b.food)===f&&(b.acc||b.ref))).filter(B=>B.length);
    const last=ms.slice(-CRIT_N),ok=last.length===CRIT_N&&last.every(B=>B.every(b=>b.acc==='y')&&B.filter(b=>b.clean==='y'||b.clean==='n').length&&B.filter(b=>b.acc==='y').every(b=>b.clean!=='n'));
    const accOf=B=>B.filter(b=>b.acc==='y').length/B.length*100;
    return {food:f,meals:ms.length,ok,first:ms.length?accOf(ms[0]):null,last:ms.length?accOf(ms[ms.length-1]):null,ms};});}
function renderMetrics(){const L=mealsSorted(),all={n:0,acc:0,clean:0,chk:0,pack:0,exp:0,ref:0,min:[]};
  L.forEach(({m})=>{const B=m.bites.filter(scored);all.n+=B.length;const a=B.filter(b=>b.acc==='y');all.acc+=a.length;const c=a.filter(b=>b.clean==='y'||b.clean==='n');all.chk+=c.length;all.clean+=c.filter(b=>b.clean==='y').length;all.pack+=a.filter(b=>b.pack).length;all.exp+=B.filter(b=>b.exp).length;all.ref+=B.filter(b=>b.ref).length;const mn=num(m.minutes);if(mn!=null)all.min.push(mn);});
  const cr=foodCrit(),at=cr.filter(x=>x.ok).length;
  const last=L.length?mStats(L[L.length-1].m):null;
  $('#fdMetrics').innerHTML=!L.length?'<p class="hint">No meals yet.</p>':`<div class="metric"><b>Meals</b><div class="val">${L.length}</div><div class="sub">${all.n} bites in all</div></div>
   <div class="metric"><b>% accepted</b><div class="val">${pct(all.n?all.acc/all.n*100:null)}</div><div class="sub">last meal ${pct(last&&last.pAcc)}</div></div>
   <div class="metric"><b>% mouth clean of accepted</b><div class="val">${pct(all.chk?all.clean/all.chk*100:null)}</div><div class="sub">last meal ${pct(last&&last.pClean)}</div></div>
   <div class="metric"><b>% packed</b><div class="val">${pct(all.acc?all.pack/all.acc*100:null)}</div></div>
   <div class="metric"><b>Expulsions per accepted bite</b><div class="val">${dec(all.acc?all.exp/all.acc:null,2)}</div></div>
   <div class="metric"><b>Refusal per presentation</b><div class="val">${dec(all.n?all.ref/all.n:null,2)}</div></div>
   <div class="metric"><b>Meal minutes</b><div class="val">${all.min.length?dec(all.min.reduce((a,b)=>a+b,0)/all.min.length,0):NONE}</div><div class="sub">mean</div></div>
   <div class="metric"><b>Target foods eaten at criterion</b><div class="val" id="fdAtCrit">${at}</div><div class="sub">of ${cr.length}</div></div>`;
  $('#fdCrit').innerHTML=cr.length?`<p class="hint">A target food counts as eaten at criterion when, at its last ${CRIT_N} meals, every bite of it offered was accepted (100%) and every accepted bite that was checked was mouth clean at 30 s (100%).</p><div class="grid-wrap"><table class="rt"><thead><tr><th>Target food</th><th class="num">Meals offered</th><th class="num">Accepted, first meal</th><th class="num">Accepted, latest meal</th><th>At criterion</th></tr></thead><tbody>${cr.map(x=>`<tr><td>${esc(x.food)}</td><td class="num">${x.meals}</td><td class="num">${pct(x.first)}</td><td class="num">${pct(x.last)}</td><td>${x.ok?'Yes':'Not yet'}</td></tr>`).join('')}</tbody></table></div>`:'';
  renderReview();}

/* v25.65 FEED-H5: the review point. From the plan's start date, a target food offered at the set number of meals (default 10)
   whose acceptance at its last 3 meals is no higher than at its first 3 has not risen; refusal per presentation, gag or cough,
   or meals marked upset higher at the last 3 meals than at the first 3 (6 meals or more) has risen. The words below are what it prints. */
const REFER='Stop and refer to a medical feeding team before adding escape extinction.';
function reviewN(){const n=num(S.plan.review);return n!=null&&n>=1?Math.round(n):10;}
function review(){const st=pDate(S.plan.start),L=mealsSorted().filter(x=>!st||(x.d&&x.d>=st)),N=reviewN(),why=[];if(!st)return {flag:false,why,N,started:false};
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  S.foods.target.map(r=>T(r.food)).filter(Boolean).forEach(f=>{const ms=L.map(x=>x.m.bites.filter(b=>T(b.food)===f&&(b.acc||b.ref))).filter(B=>B.length);
    if(ms.length<N)return;const acc=B=>B.filter(b=>b.acc==='y').length/B.length*100;const a=mean(ms.slice(0,3).map(acc)),b=mean(ms.slice(-3).map(acc));
    if(b<=a)why.push('acceptance of '+f+' has not risen after '+ms.length+' meals ('+Math.round(a)+'% at the first 3, '+Math.round(b)+'% at the last 3)');});
  if(L.length>=6){const S3=L.slice(0,3).map(x=>mStats(x.m)),E3=L.slice(-3).map(x=>mStats(x.m)),m3=(A,k)=>mean(A.map(s=>s[k]||0));
    if(m3(E3,'refPer')>m3(S3,'refPer'))why.push('refusal has risen ('+dec(m3(S3,'refPer'),2)+' to '+dec(m3(E3,'refPer'),2)+' per presentation)');
    if(m3(E3,'gag')>m3(S3,'gag'))why.push('gagging or coughing has risen');
    const up=A=>A.filter(x=>x.m.upset).length;if(up(L.slice(-3))>up(L.slice(0,3)))why.push('distress at meals has risen');}
  return {flag:why.length>0,why,N,started:true};}
function renderReview(){const r=review(),h=r.flag?`<div class="fdBox" id="fdReferBox"><h3>${esc(REFER)}</h3><p>${esc(r.why.join('; '))}.</p></div>`:
  `<p class="hint" id="fdReviewNote">Review point: ${r.started?'after '+r.N+' meals with a target food since the plan started':'set the plan&rsquo;s start date on the Plan page'}. If acceptance of a target food has not risen, or refusal, gagging or distress has risen, the form prints &ldquo;${esc(REFER)}&rdquo;</p>`;
  $('#fdReviewBox').innerHTML=h;$('#fdReviewData').innerHTML=h;}

function renderPlot(){const svg=$('#fdPlot'),L=mealsSorted(),W=900,H=320,x0=50,x1=W-20,y0=26,y1=H-66;
  if(!L.length){svg.innerHTML='<text x="450" y="160" text-anchor="middle" font-size="13" fill="#6f8087">No meals yet</text>';return;}
  const X=k=>L.length===1?(x0+x1)/2:x0+(x1-x0)*k/(L.length-1),Y=v=>y1-(y1-y0)*v/100;let g='';
  [0,25,50,75,100].forEach(v=>{g+=`<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e3e9ee"/><text x="${x0-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#55697A">${v}%</text>`;});
  let prev=null;L.forEach(({m},k)=>{const ph=T(m.phase);if(k&&ph!==prev){const xx=(X(k-1)+X(k))/2;g+=`<line x1="${xx}" x2="${xx}" y1="${y0-8}" y2="${y1}" stroke="#24313C" stroke-dasharray="2 3"/>`;}
    if(k===0||ph!==prev)g+=`<text x="${X(k)+(L.length>1?4:0)}" y="${y0-10}" font-size="11" fill="#24313C">${esc(ph||'')}</text>`;prev=ph;});
  const line=(key,dash,col)=>{let d='',pts='';L.forEach(({m},k)=>{const v=mStats(m)[key];if(v==null)return;d+=(d?'L':'M')+X(k).toFixed(1)+','+Y(v).toFixed(1);pts+=`<circle cx="${X(k).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.5" fill="${dash?'#fff':col}" stroke="${col}" stroke-width="1.6"/>`;});return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2"${dash?' stroke-dasharray="6 4"':''}/>`+pts;};
  g+=line('pAcc',false,'#24313C')+line('pClean',true,'#2f7fa8');
  L.forEach(({m},k)=>{g+=`<text x="${X(k)}" y="${y1+16}" text-anchor="middle" font-size="10.5" fill="#55697A">${k+1}</text>`;const se=SE(m);if(se)g+=`<text x="${X(k)}" y="${y1+32}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#8E2A2A" data-se="${k}">${esc(se)}</text>`;});
  g+=`<text x="${(x0+x1)/2}" y="${H-10}" text-anchor="middle" font-size="11.5" fill="#55697A">Meal</text>`;
  svg.innerHTML=g;}
$('#fdPngBtn').addEventListener('click',()=>svgToPng($('#fdPlot'),graphFile('FD-1',S.meta.client)));

/* weight: a weight lower than at the weigh-in before prints the line below */
const WT_LINE='Tell the nurse and the family’s doctor.';
function wtSorted(){return S.wts.map((w,i)=>({w,i,d:pDate(w.date),v:num(w.wt)})).filter(x=>x.d&&x.v!=null).sort((a,b)=>a.d-b.d);}
function wtAlert(){const L=wtSorted();if(L.length<2)return null;const a=L[L.length-2],b=L[L.length-1];return b.v<a.v?{from:a,to:b}:null;}
function renderWts(){$('#fdWts tbody').innerHTML=S.wts.map((w,i)=>`<tr><td><input data-wt="${i}" data-f="date" value="${esc(w.date)}" placeholder="M/D/YYYY"></td><td><input data-wt="${i}" data-f="wt" value="${esc(w.wt)}" inputmode="decimal"></td><td><select data-wt="${i}" data-f="unit">${opts(['lb','kg'],w.unit||'lb')}</select></td><td><input data-wt="${i}" data-f="by" value="${esc(w.by)}" placeholder="school nurse"></td>${delCell('wts',i,'weigh-in')}</tr>`).join('');
  const a=wtAlert();$('#fdWtAlert').innerHTML=a?`<div class="fdBox" id="fdWtBox"><h3>${esc(WT_LINE)}</h3><p>${esc(a.to.w.wt+' '+(a.to.w.unit||'lb'))} on ${esc(a.to.w.date)}, down from ${esc(a.from.w.wt+' '+(a.from.w.unit||'lb'))} on ${esc(a.from.w.date)}.</p></div>`:'';}
$('#fdWtAdd').addEventListener('click',()=>{if(S.wts.length>=120)return;S.wts.push({date:today(),wt:'',unit:(S.wts[S.wts.length-1]||{}).unit||'lb',by:''});renderWts();});

/* ================= v25.65 FEED-H5, FEED-M5, FEED-M7, FEED-M8: the plan ================= */
const P=k=>T(S.plan[k]);
const PD={len:'20',every:'30',prompt:'Take a bite.',wait:'8'};
const pv=k=>P(k)||PD[k]||'';
function eeReady(){const m=['eeConsent','eeFamily','eeDoctor','eeSpec'].filter(k=>!P(k)),steps=['eeHold','eeBack','eeGuide'].filter(k=>S.chk[k]);
  const names={eeConsent:'the written consent',eeFamily:'the planning with the family',eeDoctor:'the planning with the doctor',eeSpec:'the planning with the feeding specialist'};
  const miss=m.map(k=>names[k]);if(!steps.length)miss.push('the step (what the adult does)');if(!P('eeMax'))miss.push('the longest hold');return {ready:!miss.length,miss,steps};}
function rapidOn(){return !!S.chk.rapid||!!CASE.rapid;}
function ruleText(){const ee=S.chk.ee&&eeReady().ready;
  return 'The student may always decline'+(ee?', except in the RESTRICTIVE step written below':'')+'. If a bite is not taken within '+pv('wait')+' s, remove it calmly and offer the next one at the next set time. Never force the mouth open.'+
    (ee?'':' Never keep the bite at the lips, put spat-out food back or guide the hand to the mouth: those are escape extinction, a RESTRICTIVE step that is not part of this plan.');}
function renderPlan(){const L=lead(),body=$('#fdPlanBody'),gate=$('#fdPlanGate'),no=$('#fdNoPlan');
  const full=L.path==='menu'||(L.path==='team'&&L.advised);
  if(L.path==='menu')gate.innerHTML=`<p class="verdict v-ok fdLead">${esc(LEAD_MENU)}</p>`;
  else if(L.path==='team')gate.innerHTML=`<p class="verdict v-no fdLead">${esc(LEAD_TEAM)}</p>`+(L.advised?`<p class="hint">The feeding team advised the plan (${esc(S.meta.team)}, ${esc(S.meta.teamAdv)}): ${esc(T(S.meta.teamWhat)||'what it advises is not written yet')}. Tick only the items the team advises.</p>`:'<p class="hint">Until the feeding team advises, the plan holds item 1 (mealtime structure), the data sheet and caregiver support.</p>');
  else gate.innerHTML=`<p class="verdict v-mid fdLead">The Screen has not decided who leads yet: ${esc(L.why.join('; '))}.</p>`;
  const show=L.page;body.hidden=!show;no.hidden=show;
  no.textContent=show?'':(L.missing.length?NO_PAGE+' Missing: '+L.missing.join(' and ')+'.':'No treatment page until the Screen decides who leads.');
  $('#fdRuleBox').innerHTML='<b>The fixed rule.</b> '+esc(ruleText());
  $('#fdCfaLine').innerHTML=T(S.meta.cfa)?'<b>Staff at this meal are trained in choking first aid.</b> ('+esc(S.meta.cfa)+')':'<b>Staff at this meal must be trained in choking first aid before the plan starts:</b> not recorded on the Screen yet.';
  const tx=texNow();$('#fdTexLine').innerHTML='<b>Texture and bite size, as prescribed:</b> '+[tx.tex?'texture '+esc(tx.tex):'texture not written',tx.liq?'liquids '+esc(tx.liq):'liquids not written',tx.bite?'bite size '+esc(tx.bite):'bite size not written'].join('; ')+
    (tx.by||tx.date?' ('+esc([tx.by,tx.date].filter(Boolean).join(', '))+')':'')+'.'+(tx.last?' <b>Latest step written:</b> '+esc(tx.last.step)+' ('+esc([tx.last.by,tx.last.role,tx.last.date].filter(Boolean).join(', '))+').':'')+
    ' A texture or bite-size step goes up only when the SLP or the feeding team writes the next step on the Screen.';
  /* availability: item 1 always; items 2, 3 and 6 on the menu path or once the feeding team advises; items 4 and 5 also need selectivity */
  const avail={m1:true,m2:full,m3:full,m4:full&&L.selectivity,m5:full&&L.selectivity,m6:full,rapid:rapidOn(),ee:full};
  $$('#fdPlanBody .fdItem[data-item]').forEach(el=>{const k=el.dataset.item,on=k==='rapid'?(S.chk.r1||S.chk.r2):!!S.chk[k];el.hidden=!avail[k];el.classList.toggle('off',!on);
    el.classList.toggle('noprint',!avail[k]||!on);});
  /* the steps, as the settings write them */
  const tg=P('target')||'the target food',off=(P('offer')||'front')==='lips'?'at the student’s lips, and take it away calmly if it is not taken':'in front of the student';
  $('#fdSteps1').innerHTML=[`Meals last ${esc(pv('len'))} minutes.`,`Offer one small bite of ${esc(tg)} every ${esc(pv('every'))} s, ${esc(off)}, with the same prompt each time: &ldquo;${esc(pv('prompt'))}&rdquo;`,
    'Praise each bite taken, right away and briefly.','Respond to refusal neutrally: no coaxing, no reprimand; wait, then offer the next bite at the next set time.','Keep the student&rsquo;s preferred foods on the plate.',
    `Bite size: ${esc(tx.bite||'as prescribed (Screen)')}.`].map(x=>'<li>'+x+'</li>').join('');
  $('#fdSteps2').innerHTML=[`Put ${esc(tg)} on or with ${esc(P('simPref')||'a preferred food or a condiment the student chooses')} in the same bite.`,'Offer it as in item 1; the student may decline.','Keep the preferred part the same size while acceptance rises; make it smaller only with the BCBA.'].map(x=>'<li>'+x+'</li>').join('');
  $('#fdSteps3').innerHTML=[`Right after each bite of ${esc(tg)} is taken, give ${esc(P('drItem')||'a bite of a preferred food or a short preferred activity')}.`,'Nothing extra after a refused bite: offer the next bite at the next set time.'].map(x=>'<li>'+x+'</li>').join('');
  $('#fdSteps4').innerHTML=[`Offer 3 bites of ${esc(P('highpFood')||'a preferred food the student always eats')}, one at a time, with praise for each.`,`Right after the third, offer one bite of ${esc(tg)} the same way.`,'Drop one preferred bite after 3 meals in a row with every target bite accepted (100%); go back one if acceptance falls.'].map(x=>'<li>'+x+'</li>').join('');
  const ds=DFSTEPS.includes(P('dfStep'))?P('dfStep'):'touch';
  $('#fdSteps5').innerHTML=[`The ladder: touch, then kiss, then lick, then bite, then chew, then swallow. Current step: the student is asked to ${esc(DFWORDS[ds])}.`,'Before each request at the current step, ask for 3 easy steps the student already does, with praise.',
    'Move up one step after 3 sessions in a row of 100% compliance at the current step.','Hold the step (do not move up) if the student gags or vomits; tell the nurse the same day.'].map(x=>'<li>'+x+'</li>').join('');
  const fk=FADEKN[P('fadeKind')]?P('fadeKind'):'flavor';
  $('#fdSteps6').innerHTML=[`What is faded: ${esc(FADEKN[fk])}. Current step: ${esc(P('fadeStep')||'not written yet')}.`,fk==='size'?'Bite size follows the steps the SLP or the feeding team writes on the Screen: dipped spoon, a quarter, a half, then a level spoon.':'Fade in small steps; go back a step if acceptance falls.',
    'Offer as in item 1; the student may decline.'].map(x=>'<li>'+x+'</li>').join('');
  /* v25.65 FEED-M5: rapid eating */
  $('#fdStepsR').innerHTML=[S.chk.r1?'<b>1.</b> Pre-cut the portion and put one piece on the plate at a time. The student puts the utensil down between bites; praise each time.':'',
    S.chk.r2?`<b>2.</b> A cue for each bite (${esc(P('cue')||'a vibrating pager or a timer')}): the student takes a bite only at the cue. Fade the cue by lowering the vibration strength, not by spacing the cues further apart.`:'',
    `Target: about ${esc(P('pace')||'the time the BCBA sets')} s between bites, from the data sheet (meal minutes &times; 60 &divide; bites).`,'Blocking a reach for the next bite is a RESTRICTIVE step (TD-1 card <code>s_drl-pager-bite-spacing</code>): never the default, and not part of this plan unless the BCBA approves it on Form TD-1.'].filter(Boolean).map(x=>'<li>'+x+'</li>').join('');
  /* the restrictive option */
  const er=eeReady(),eeW={eeHold:'keep the bite at the lips until it is taken (nonremoval)',eeBack:'put spat-out food back on the spoon and offer it again',eeGuide:'guide the student’s hand to the mouth'};
  $('#fdEEText').innerHTML=!S.chk.ee?'<p class="hint">Not part of this plan.</p>':er.ready?
    `<p><b>OPTION: RESTRICTIVE (escape extinction at meals):</b> the adult will ${esc(er.steps.map(k=>eeW[k]).join('; and '))}. What it does: a refused bite no longer ends or delays the meal, so refusal stops paying off. Why: for food refusal, reinforcement alone often did not raise acceptance; escape extinction added to it did. How long: each bite is held no longer than ${esc(P('eeMax'))} s; the step is reviewed after ${esc(P('eeReview')||'10')} meals. What the data must show before it ends: acceptance and mouth clean rising on the data sheet; stop at once for any line in the stop rule, and stop and refer if refusal, gagging or distress rises. Never force the mouth open. Consent ${esc(P('eeConsent'))}; planned with the family ${esc(P('eeFamily'))}, the doctor ${esc(P('eeDoctor'))} and the feeding specialist ${esc(P('eeSpec'))}.</p>`:
    `<p class="verdict v-no">Not ready, so not part of this plan: missing ${esc(er.miss.join(', '))}.</p>`;
  $$('.fdCard[data-cards]').forEach(el=>{el.innerHTML=cardLine(el.dataset.cards);});
  renderReview();}

/* ---------------- input ---------------- */
let tA=null;const soon=f=>{clearTimeout(tA);tA=setTimeout(f,250);};
function renderGates(){renderLead();renderPica();renderSensory();renderPlan();}
document.addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;soon(renderGates);return;}
  if(el.dataset.o!==undefined){S.obs[el.dataset.o]=el.value;soon(renderObsSum);return;}
  if(el.dataset.p!==undefined){S.plan[el.dataset.p]=el.value;soon(()=>{renderPlan();renderMetrics();});return;}
  if(el.dataset.tx!==undefined){const r=S.tex[+el.dataset.tx];if(r){r[el.dataset.f]=el.value;soon(renderPlan);}return;}
  if(el.dataset.fl!==undefined){const r=S.foods[el.dataset.fl][+el.dataset.i];if(r){r[el.dataset.f]=el.value;soon(()=>{renderFoodsCount();renderMetrics();});}return;}
  if(el.dataset.wt!==undefined&&el.tagName!=='SELECT'){const r=S.wts[+el.dataset.wt];if(r){r[el.dataset.f]=el.value;soon(()=>{const a=wtAlert();renderWtsAlert(a);});}return;}
  if(el.dataset.ml!==undefined&&el.type!=='checkbox'&&el.tagName!=='SELECT'){const m=S.meals[CUR];if(m){m[el.dataset.ml]=el.value;soon(()=>{renderMealsRows();renderMetrics();renderPlot();});}return;}
  if(el.dataset.bk==='meal'&&el.tagName==='INPUT'&&el.type!=='checkbox'){const m=S.meals[CUR],b=m&&m.bites[+el.dataset.i];if(b)b[el.dataset.f]=el.value;return;}
});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.dataset)return;
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderGates();return;}
  if(el.dataset.rf!==undefined){S.rf[el.dataset.rf]=el.value;renderGates();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderGates();return;}
  if(el.dataset.o!==undefined){S.obs[el.dataset.o]=el.value;renderObsSum();return;}
  if(el.dataset.p!==undefined){S.plan[el.dataset.p]=el.value;renderPlan();renderMetrics();return;}
  if(el.dataset.fl!==undefined){const r=S.foods[el.dataset.fl][+el.dataset.i];if(r){r[el.dataset.f]=el.value;renderFoodsCount();renderMetrics();}return;}
  if(el.dataset.wt!==undefined){const r=S.wts[+el.dataset.wt];if(r){r[el.dataset.f]=el.value;renderWtsAlert(wtAlert());}return;}
  if(el.dataset.ml!==undefined){const m=S.meals[CUR];if(m){m[el.dataset.ml]=el.type==='checkbox'?!!el.checked:el.value;renderMealsRows();renderMetrics();renderPlot();}return;}
  if(el.dataset.bk){const kind=el.dataset.bk,i=+el.dataset.i,f=el.dataset.f,B=kind==='obs'?S.obs.bites:(S.meals[CUR]||{}).bites;const b=B&&B[i];if(!b)return;
    b[f]=el.type==='checkbox'?!!el.checked:el.value;if(f==='acc'&&el.value==='n'&&kind==='meal'){b.clean='';}
    if(kind==='obs')renderObsSum();else{renderMealsRows();renderMetrics();renderPlot();}return;}
});
function renderFoodsCount(){const n=S.foods.target.filter(r=>T(r.food)).length;$('#fdTargetCount').textContent=n+' target food'+(n===1?'':'s')+(n&&(n<4||n>16)?': choose 4 to 16 with the family':'');}
function renderWtsAlert(a){const el=$('#fdWtAlert');el.innerHTML=a?`<div class="fdBox" id="fdWtBox"><h3>${esc(WT_LINE)}</h3><p>${esc(a.to.w.wt+' '+(a.to.w.unit||'lb'))} on ${esc(a.to.w.date)}, down from ${esc(a.from.w.wt+' '+(a.from.w.unit||'lb'))} on ${esc(a.from.w.date)}.</p></div>`:'';}
/* the meal list's rows, without rebuilding the meal being edited (so typing keeps its place) */
function renderMealsRows(){const L=mealsSorted();
  $('#fdMeals tbody').innerHTML=L.map(({m,i},k)=>{const s=mStats(m);return `<tr${i===CUR?' class="sel"':''}><td class="num">${k+1}</td><td>${esc(m.date||NONE)}</td><td>${esc(m.phase||NONE)}</td><td class="num">${esc(T(m.minutes)||NONE)}</td><td class="num">${s.n||esc(T(m.count)||NONE)}</td><td class="num">${pct(s.pAcc)}</td><td class="num">${pct(s.pClean)}${s.nc?' <span class="hint">('+s.nc+' not checked)</span>':''}</td><td class="num">${pct(s.pPack)}</td><td class="num">${dec(s.expPer,2)}</td><td class="num">${dec(s.refPer,2)}</td><td class="num">${s.spb==null?NONE:Math.round(s.spb)}</td><td>${esc(PORTIONN[m.portion]&&m.portion?PORTIONN[m.portion]:'')}${s.grams!=null?' '+dec(s.grams,0)+' g':''}</td><td>${esc(SE(m))}${m.upset?' <span class="hint">upset</span>':''}</td><td class="noprint"><button type="button" data-open="${i}">Open</button></td>${delCell('meals',i,'meal')}</tr>`;}).join('')||'<tr><td colspan="15" class="hint">No meal yet. Add a meal, then enter its bites.</td></tr>';}
$('#fdObsAdd').addEventListener('click',()=>{if(S.obs.bites.length<40){S.obs.bites.push(biteBlank());renderObs();}});
$('#fdObsAdd10').addEventListener('click',()=>{for(let k=0;k<10&&S.obs.bites.length<40;k++)S.obs.bites.push(biteBlank());renderObs();});
$('#fdTexAdd').addEventListener('click',()=>{if(S.tex.length<60){S.tex.push({date:today(),step:'',by:'',role:''});renderTex();renderPlan();}});

async function rowDel(r,i){const list=r==='obs'?S.obs.bites:r==='bite'?(S.meals[CUR]||{}).bites:r==='meals'?S.meals:r==='tex'?S.tex:r==='wts'?S.wts:S.foods[r];if(!list||!list[i])return;
  const row=list[i],has=Object.keys(row).some(k=>k!=='id'&&((Array.isArray(row[k])&&row[k].length)||(typeof row[k]==='string'&&T(row[k]))||row[k]===true));
  if(has&&!(await nbhUI.confirm(r==='meals'?'Delete this meal?\nIts bites are deleted with it.':'Delete this row?\nWhat was entered in it is deleted.',{ok:'Delete',danger:true})))return;
  list.splice(i,1);if(r==='meals'){if(CUR===i)CUR=-1;else if(CUR>i)CUR--;}
  if(r==='obs')renderObs();else if(r==='bite'||r==='meals')renderMeals();else if(r==='tex'){renderTex();renderPlan();}else if(r==='wts')renderWts();else{renderFoods();renderMetrics();}}

/* ---------------- meta + render ---------------- */
const PSEL={offer:'front',dfStep:'touch',fadeKind:'flavor'};
function bindAll(){$$('[data-m]').forEach(el=>{el.value=S.meta[el.dataset.m]||'';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});$$('[data-p]').forEach(el=>{el.value=S.plan[el.dataset.p]||PSEL[el.dataset.p]||'';});}
function fillSelects(){$('#fdPtype').innerHTML=opts(PTYPE,'');$('#fdObsPortion').innerHTML=opts(PORTION,'');$('#fdOffer').innerHTML=opts(OFFERP,'front');$('#fdDfStep').innerHTML=opts(DFSTEPS.map(k=>[k,k[0].toUpperCase()+k.slice(1)]),'touch');$('#fdFadeKind').innerHTML=opts(FADEK,'flavor');}
function renderAll(){ensure();bindAll();renderRF();renderTex();renderObs();renderFoods();renderMeals();renderWts();renderGates();
  $('#fdCaseNote').textContent=CASE.note||'';}

/* ---------------- toolbar ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#saveBtn').addEventListener('click',()=>{
  const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'FD-1',rev:'2026-11',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  a.download=`FD-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
/* a saved file: every part optional, every value checked against what the form offers, so an older or partial file opens */
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='FD-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},arr=(v,n)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,n):[];
  const inl=(v,list)=>list.some(x=>(Array.isArray(x)?x[0]:x)===v)?v:'';
  Object.keys(obj(s.meta)).forEach(k=>{o.meta[k]=str(s.meta[k]);});if(!PTYPEN[o.meta.ptype]||!o.meta.ptype)o.meta.ptype='';
  o.chk={};Object.keys(obj(s.chk)).forEach(k=>{o.chk[k]=s.chk[k]===true;});if(!('m1' in obj(s.chk)))o.chk.m1=true;
  RF.forEach(([k])=>{const v=str(obj(s.rf)[k]);if(['no','yes','unk'].includes(v))o.rf[k]=v;});
  Object.keys(obj(s.plan)).forEach(k=>{o.plan[k]=str(s.plan[k]);});
  const bite=x=>({food:str(x.food),size:str(x.size),off:inl(str(x.off),OFFER),acc:inl(str(x.acc),YN),clean:inl(str(x.clean),CLEAN),pack:x.pack===true,exp:x.exp===true,ref:x.ref===true,gag:x.gag===true,adult:inl(str(x.adult),ADULT)});
  const ob=obj(s.obs);o.obs={date:str(ob.date),feeder:str(ob.feeder),where:str(ob.where),foods:str(ob.foods),minutes:str(ob.minutes),portion:inl(str(ob.portion),PORTION),bites:arr(ob.bites,40).map(bite)};
  const fs=obj(s.foods);o.foods={now:arr(fs.now,40).map(x=>({food:str(x.food),tex:str(x.tex),src:inl(str(x.src),NOWFROM)})),target:arr(fs.target,40).map(x=>({food:str(x.food),group:inl(str(x.group),GROUPS),by:str(x.by)})),pref:arr(fs.pref,40).map(x=>({food:str(x.food),rank:str(x.rank),how:inl(str(x.how),PREFHOW)}))};
  o.tex=arr(s.tex,60).map(x=>({date:str(x.date),step:str(x.step),by:str(x.by),role:str(x.role)}));
  o.meals=arr(s.meals,400).map(x=>({id:str(x.id)||uid(),date:str(x.date),phase:str(x.phase),feeder:str(x.feeder),minutes:str(x.minutes),count:str(x.count),portion:inl(str(x.portion),PORTION),gBefore:str(x.gBefore),gAfter:str(x.gAfter),foods:str(x.foods),
    slept:x.slept===true,unwell:x.unwell===true,ate1h:x.ate1h===true,upset:x.upset===true,note:str(x.note),bites:arr(x.bites,60).map(bite)}));
  o.wts=arr(s.wts,120).map(x=>({date:str(x.date),wt:str(x.wt),unit:['lb','kg'].includes(str(x.unit))?str(x.unit):'lb',by:str(x.by)}));
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='FD-1'?d.form:'';
    const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved FD-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form FD-1. Nothing was changed.':'That file could not be read as a saved FD-1 form. Nothing was changed.');return;}
    const prev=S;S=next;CUR=-1;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved FD-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{
  const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Record','Meal','Date','Phase','Bite','Food','Bite size','Offered','Accepted within 5 s','Mouth clean at 30 s','Packed','Expelled','Refusal','Gag or cough','What the adult did','Meal minutes','Slept poorly','Unwell','Ate within the last hour','Upset']];
  const yn=v=>v===true?'yes':'',lab=(L,v)=>{const x=L.find(y=>y[0]===v);return x&&v?x[1]:'';};
  S.obs.bites.forEach((b,i)=>out.push(['Meal observation','',S.obs.date,'',i+1,'','',lab(OFFER,b.off),lab(YN,b.acc),lab(CLEAN,b.clean),yn(b.pack),yn(b.exp),yn(b.ref),yn(b.gag),lab(ADULT,b.adult),S.obs.minutes,'','','','']));
  mealsSorted().forEach(({m},k)=>{if(!m.bites.length)out.push(['Meal',k+1,m.date,m.phase,'','','','','','','','','','','',m.minutes,yn(m.slept),yn(m.unwell),yn(m.ate1h),yn(m.upset)]);
    m.bites.forEach((b,i)=>out.push(['Meal',k+1,m.date,m.phase,i+1,b.food,b.size,lab(OFFER,b.off),lab(YN,b.acc),lab(CLEAN,b.clean),yn(b.pack),yn(b.exp),yn(b.ref),yn(b.gag),'',m.minutes,yn(m.slept),yn(m.unwell),yn(m.ate1h),yn(m.upset)]));});
  S.wts.forEach(w=>out.push(['Weigh-in','',w.date,'','','','','','','','','','','','','','','','','',w.wt+' '+(w.unit||'lb')+(w.by?' ('+w.by+')':'')]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='FD-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();CUR=-1;renderAll();setView('screen');}});

/* ---------------- simulation ---------------- */
async function loadSim(){
  if(!(await nbhUI.confirm('Load a simulated case?\nEvery page is filled with a worked example: a screen, one observed lunch, the food lists, a plan and ten meals. Anything already entered will be replaced.',{ok:'Load'})))return;
  const step=(n)=>{const d=new Date();d.setHours(12,0,0,0);let k=n;while(k>0){d.setDate(d.getDate()-1);if(d.getDay()%6)k--;}while(!(d.getDay()%6))d.setDate(d.getDate()-1);return d;};
  const Y=n=>MDY(step(n));
  S=blank();CUR=-1;
  S.meta={client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',dob:'',site:'Elementary, general education with support',bcba:'Jordan Ellis, M.A., BCBA (simulated)',
    dx:'Autism spectrum disorder (simulated)',diet:'Regular diet',allergy:'None known',mdName:'Dr. Sample Peds (simulated)',mdClr:Y(40),swBy:'',swDate:'',tex:'Regular, cut to bite size',liq:'Thin liquids',bite:'Half a teaspoon; pieces no larger than 1.5 cm',
    presc:'School SLP (simulated)',presDate:Y(38),nursePlan:Y(37),feeder:'Classroom aide, with the BCBA at the first meals (simulated)',cfa:'Classroom aide and teacher, choking first aid on '+Y(45),ptype:'type',ther:'Speech therapy',team:'',teamAdv:'',teamWhat:''};
  RF.forEach(([k])=>{S.rf[k]='no';});
  S.chk={m1:true,m2:true,m3:true};
  S.plan={start:Y(20),review:'10',len:'20',every:'30',prompt:'Take a bite.',wait:'8',offer:'front',target:'green beans',simPref:'ranch dip the student chooses',drItem:'a bite of cracker'};
  const ob=[['front','n','',false,false,true,false,'coax'],['front','n','',false,false,true,false,'coax'],['self','y','y',false,false,false,false,'praise'],['front','n','',false,false,true,false,'remove'],['front','y','nc',false,false,false,false,'wait'],
    ['front','n','',false,false,true,false,'coax'],['self','y','y',false,false,false,false,'wait'],['front','n','',false,false,true,false,'pref'],['front','n','',false,false,true,false,'coax'],['front','y','n',true,false,false,false,'praise'],
    ['front','n','',false,false,true,false,'remove'],['self','y','y',false,false,false,false,'wait']];
  S.obs={date:Y(24),feeder:'Classroom aide (simulated)',where:'Classroom, lunch table',foods:'Chicken nuggets, crackers, green beans, carrots',minutes:'26',portion:'h',bites:ob.map(x=>({food:'',size:'',off:x[0],acc:x[1],clean:x[2],pack:x[3],exp:x[4],ref:x[5],gag:x[6],adult:x[7]}))};
  S.foods={now:[{food:'Chicken nuggets',tex:'Regular',src:'Three-day family record'},{food:'Crackers',tex:'Regular',src:'Three-day family record'},{food:'Apple slices',tex:'Regular',src:'Meal observation'},{food:'Yogurt (vanilla)',tex:'Smooth',src:'Three-day family record'}],
    target:[{food:'green beans',group:'Vegetable',by:'The family (simulated)'},{food:'carrots',group:'Vegetable',by:'The family (simulated)'},{food:'scrambled egg',group:'Protein',by:'The family (simulated)'},{food:'whole-wheat bread',group:'Grain or starch',by:'The family (simulated)'}],
    pref:[{food:'cracker',rank:'1',how:'PA-1 MSWO food assessment'},{food:'apple slice',rank:'2',how:'PA-1 MSWO food assessment'},{food:'chicken nugget',rank:'3',how:'PA-1 MSWO food assessment'}]};
  /* ten meals: three before the plan, seven after; green beans then carrots */
  const pat=[[3,0],[2,1],[3,0],[5,1],[6,2],[7,3],[8,4],[10,6],[10,8],[10,10]];   /* green-bean bites accepted of 10; carrot bites accepted of 10 (none offered at baseline) */
  const days=[30,28,26,20,18,16,14,10,8,6];
  S.meals=pat.map(([g,c],k)=>{const m=mealBlank();m.date=Y(days[k]);m.phase=k<3?'Baseline':'Structure, simultaneous presentation, DR';m.feeder='Classroom aide (simulated)';m.minutes=String(k<3?26-k:20);m.portion=k<3?'h':k<6?'tq':'all';
    if(k===4)m.slept=true;if(k===6)m.ate1h=true;
    const mk=(food,n,ok)=>{for(let i=0;i<n;i++){const b=biteBlank();b.food=food;b.size='half a teaspoon';b.off='front';const a=i<ok;b.acc=a?'y':'n';b.ref=!a;b.clean=a?(k>=3||i%2?'y':'n'):'';if(a&&b.clean==='n')b.pack=true;m.bites.push(b);}};
    mk('green beans',10,g);if(k>=3)mk('carrots',10,c);return m;});
  S.wts=[{date:Y(44),wt:'48.0',unit:'lb',by:'School nurse (simulated)'},{date:Y(24),wt:'48.4',unit:'lb',by:'School nurse (simulated)'},{date:Y(4),wt:'48.9',unit:'lb',by:'School nurse (simulated)'}];
  CUR=S.meals.length-1;renderAll();setView('data');
  nbhUI.toast('Simulation loaded: selectivity by type with the clearance on file, one observed lunch, a plan of three menu items, ten meals and three weigh-ins.',{kind:'ok'});
}
$('#simBtn').addEventListener('click',loadSim);

$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
fillSelects();renderAll();

/* v25.65 FEED-H3 the case: in. The diagnoses and health conditions, the diet and the allergies from the health record (Form DM-1's
   profile.health, and Form RR-1's records where the case carries them), a pica precaution from DM-1's safety flags, a rapid-eating
   or pica target from Form TB-1, and the foods ranked on Form PA-1 (for the Foods page). Only empty fields are filled. */
window.__nbhFactsIn=function(f){f=f||{};const m=S.meta;let n=0;const pf=f.profile||{},h=pf.health||{},rc=f.records||{},got=[];
  const uniq=a=>a.map(T).filter((x,i,A)=>x&&A.indexOf(x)===i);
  const dx=uniq([rc.dx,pf.dx,h.dx,h.conditions]),diet=uniq([h.diet,pf.diet,rc.diet,pf.culture]),al=T(h.allergies);
  if(!T(m.dx)&&dx.length){m.dx=dx.join('; ');n++;got.push('diagnoses and health conditions');}
  if(!T(m.diet)&&diet.length){m.diet=diet.join('; ');n++;got.push('diet');}
  if(!T(m.allergy)&&al){m.allergy=al;n++;got.push('allergies');}
  const safety=((pf.flags||{}).safety)||[];if(safety.includes('Pica')&&!S.rf.pica){S.rf.pica='yes';n++;got.push('the pica precaution');}
  const B=f.behaviors||[],lab=b=>[b.label,b.def,b.id,b.lib].map(T).join(' ');
  const rap=B.find(b=>/rapid eating|eat(s|ing)? too (fast|quickly)|overfill|feed-rapid/i.test(lab(b)));CASE.rapid=rap?T(rap.label):'';
  if(rap&&!S.chk.rapid){S.chk.rapid=true;n++;got.push('the rapid-eating target');}
  const pica=B.find(b=>/\bpica\b|feed-pica/i.test(lab(b)));if(pica&&!S.rf.pica){S.rf.pica='yes';n++;got.push('the pica target');}
  CASE.menu=Array.isArray(f.menu)?f.menu:[];
  if(got.length)CASE.note='From the case: '+got.join(', ')+'. Check them with the family and the nurse.';
  if(n)renderAll();else renderGates();return {filled:n};};

/* v25.65 FEED-H3 the case: out (key "feeding"). The problem type, who leads, the red flags answered yes and those not answered,
   the clearance, the texture order, the plan's items, the restrictive step when it is ready, the meals and the latest meal's
   acceptance and mouth clean, the target foods at criterion, the weight line and the review point. Dates are ISO where they parse. */
window.__nbhFactsOut=function(){
  const m=S.meta,L=lead(),any=Object.keys(m).some(k=>T(m[k]))||Object.keys(S.rf).length||S.meals.length||S.obs.bites.length;if(!any)return null;
  const isoOf=s=>{const d=pDate(s);return d?iso(d):T(s);},ms=mealsSorted(),last=ms.length?ms[ms.length-1]:null,ls=last?mStats(last.m):null;
  const items=[['m1','Mealtime structure'],['m2','Simultaneous presentation'],['m3','Differential reinforcement'],['m4','High-p sequence'],['m5','Progressive high-p with demand fading'],['m6','Stimulus fading']].filter(([k])=>S.chk[k]).map(x=>x[1]);
  const o={type:m.ptype||'',typeLabel:m.ptype?PTYPEN[m.ptype]:'',lead:L.path,leadLine:L.path==='team'?LEAD_TEAM:L.path==='menu'?LEAD_MENU:'',flags:L.yes.map(x=>x[1]),unanswered:L.open.length,
    clearance:{doctor:isoOf(m.mdClr),swallow:isoOf(m.swDate),nurse:isoOf(m.nursePlan),texture:T(m.tex),liquid:T(m.liq),bite:T(m.bite)},treatmentPage:L.page,plan:items,rapid:rapidOn(),pica:S.rf.pica==='yes',
    meals:ms.length,atCriterion:foodCrit().filter(x=>x.ok).length,targets:S.foods.target.map(r=>T(r.food)).filter(Boolean),weightAlert:!!wtAlert(),refer:review().flag};
  if(S.chk.ee&&eeReady().ready)o.restrictive='Escape extinction at meals (RESTRICTIVE), consent '+isoOf(P('eeConsent'));
  if(last&&last.d)o.last={date:iso(last.d),accepted:ls.pAcc==null?null:Math.round(ls.pAcc),mouthClean:ls.pClean==null?null:Math.round(ls.pClean)};
  return {feeding:o};};
