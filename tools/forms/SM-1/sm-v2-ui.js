/* ===== Form SM-1 v2 (v21.45): the Design sheet, the reward store, the target library, the schedules, the quick starts,
   the live preview, the printing extras and the contract's link to the sheet. ===== */

/* ---------------- state: the v2 parts of a saved file ---------------- */
function smEnsure(){if(!S.d||typeof S.d!=='object'||Array.isArray(S.d))S.d={};if(!Array.isArray(S.store))S.store=[];if(!Array.isArray(S.per2))S.per2=[];
  S.per2.forEach(p=>{const h=toHM24(p.t);if(h)p.t=h;});}
const SM_D_KEYS={look:'s',theme:'s',accent:'s',rate:'s',rv:'s',rpics:'s',rwords:'s',mbonus:'s',tw:'s',nm:'s',av:'s',avimg:'img',wf:'b',mid:'s',qr:'s',qrlab:'s',cstrip:'b',cards:'s',bank:'b',tiers:'b',alt:'b',nofit:'b',bcpic:'b',phs:'s',rshow:'b',rspeak:'b',rchime:'b',rcue:'s',pin:'s'};   /* v21.46 the r… keys and pin: rating on the iPad (sm-rate.js) */
function smFromFile(s,o){const okImg=v=>typeof v==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<400000?v:'';
  const str=v=>v==null||typeof v==='object'?'':String(v);o.d={};
  const d=s.d&&typeof s.d==='object'&&!Array.isArray(s.d)?s.d:{};
  Object.keys(SM_D_KEYS).forEach(k=>{if(!(k in d))return;const t=SM_D_KEYS[k];o.d[k]=t==='b'?!!d[k]:t==='img'?okImg(d[k]):str(d[k]);});
  if(o.d.look&&!SM_LOOKS[o.d.look])delete o.d.look;if(o.d.theme&&!SM_THEMES[o.d.theme])delete o.d.theme;if(o.d.rate&&!SM_RATES[o.d.rate])delete o.d.rate;
  if(o.d.av&&!(window.NBH_PICTOS&&NBH_PICTOS[o.d.av]))o.d.av='';
  if(o.d.phs&&!['show','blank','off'].includes(o.d.phs))delete o.d.phs;
  o.store=Array.isArray(s.store)?s.store.slice(0,16).map(x=>({n:str(x&&x.n),icon:window.NBH_PICTOS&&NBH_PICTOS[str(x&&x.icon)]?str(x.icon):'',img:okImg(x&&x.img),p:str(x&&x.p),tier:['s','m','b'].includes(x&&x.tier)?x.tier:''})):[];
  o.per2=Array.isArray(s.per2)?s.per2.slice(0,16).map(x=>({t:str(x&&x.t),label:str(x&&x.label),icon:window.NBH_PICTOS&&NBH_PICTOS[str(x&&x.icon)]?str(x.icon):'',img:okImg(x&&x.img)})):[];
  return o;}

/* ---------------- re-render everything the design touches ---------------- */
function smRedraw(){renderPoints();renderSheet();renderSetup();}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.d!==undefined&&el.type!=='checkbox'&&el.type!=='radio'){smD()[el.dataset.d]=el.value;smRedraw();if(el.dataset.d==='rv'||el.dataset.d==='rwords')smRenderDesignRates();return;}
  if(el.dataset.r==='store'||el.dataset.r==='per2'){renderSheet();}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.d===undefined)return;
  if(el.type==='checkbox')smD()[el.dataset.d]=el.checked;else smD()[el.dataset.d]=el.value;smRedraw();smRenderDesign();
  if(['bank','tiers'].includes(el.dataset.d))smRenderStore();if(el.dataset.d==='alt')smRenderSched();if(el.dataset.d==='bcpic')renderBc();});

function smRepick(r){if(r==='store')smRenderStore();else if(r==='per2')smRenderSched();}

/* ---------------- the Design sheet ---------------- */
const SM_LOOK_SW={classic:'linear-gradient(#fff,#fff)',bright:'linear-gradient(100deg,#1fa3a6,#2bb3a0 55%,#f7c948)',theme:'repeating-linear-gradient(90deg,#256d3b 0 18px,#2d7a43 18px 36px)',clean:'linear-gradient(#fff 0 70%,#1d3b5a 70% 76%,#fff 76%)',discreet:'repeating-linear-gradient(0deg,#fff 0 9px,#c3c9ce 9px 10px)'};
function smRenderDesign(){const el=$('#smDesign');if(!el)return;const d=smD(),look=smLook();
  const pk='<input type="radio" name="smLook"';
  let h='<h3>The look</h3><div class="sm2-looks">'+Object.entries(SM_LOOKS).map(([k,l])=>'<label class="'+(k===look?'on':'')+'"><div class="sw" style="background:'+SM_LOOK_SW[k]+';border:1px solid #d5dde3"></div><span>'+pk+' data-d="look" value="'+k+'"'+(k===look?' checked':'')+'> '+esc(l)+'</span></label>').join('')+'</div>';
  if(look==='theme'){const tb=([k,t])=>'<button type="button" data-smtheme="'+k+'" class="'+(k===smTheme()?'on':'')+'">'+(t.col?'<span class="sw2 sw2-'+k+'" style="background:'+t.c+'"></span>':typeof SM_THEME_ART!=='undefined'&&SM_THEME_ART[k]?'<svg class="art" viewBox="0 0 72 72">'+SM_THEME_ART[k][0]+'</svg>':'')+esc(t.l)+'</button>';
    const E=Object.entries(SM_THEMES);h+='<div><b>Theme with pictures</b></div><div class="sm2-themes">'+E.filter(x=>!x[1].col).map(tb).join('')+'</div><div><b>Plain or one colour</b> <span class="hint">(no pictures; Plain prints well in black and white)</span></div><div class="sm2-themes">'+E.filter(x=>x[1].col).map(tb).join('')+'</div>';}
  if(look!=='classic')h+='<div class="sm2-row"><label>Colour <input type="color" data-d="accent" value="'+esc(/^#[0-9a-f]{6}$/i.test(d.accent||'')?d.accent:smAccent())+'"></label><button type="button" class="tool" id="smAccReset">Back to the look&rsquo;s colour</button>'+
    '<label>Name on the sheet <select data-d="nm"><option value="">'+(['clean','discreet'].includes(look)?'Initials (this look&rsquo;s default)':'First name (this look&rsquo;s default)')+'</option><option value="nick"'+(d.nm==='nick'?' selected':'')+'>First name</option><option value="ini"'+(d.nm==='ini'?' selected':'')+'>Initials only</option><option value="full"'+(d.nm==='full'?' selected':'')+'>Full name</option></select></label>'+
    '<label>The adult who rates is called <input data-d="tw" value="'+esc(d.tw||'')+'" placeholder="Teacher" style="width:120px"></label></div>';
  /* v21.48 the student's photo, on every look */
  h+='<div class="sm2-row sm2-av"><b>Student&rsquo;s photo</b><span class="avp" id="smAvP">'+(smAvatar(52)||'<span class="hint">none chosen</span>')+'</span><button type="button" class="tool" id="smAvBtn">'+(d.av||d.avimg?'Change the photo':'Add a photo or picture')+'</button>'+(d.av||d.avimg?'<button type="button" class="tool" id="smAvNone">Remove it</button>':'')+
    '<label>On the sheet <select data-d="phs"><option value="">'+(look==='bright'?'Shown (this look&rsquo;s way)':'Not shown (this look&rsquo;s way)')+'</option><option value="show"'+(d.phs==='show'?' selected':'')+'>Shown</option><option value="blank"'+(d.phs==='blank'?' selected':'')+'>A blank circle to glue a printed photo onto</option><option value="off"'+(d.phs==='off'?' selected':'')+'>Not shown</option></select></label>'+
    '<span class="hint">Take one with the iPad&rsquo;s camera, upload one, or use a library picture (the boy or girl headshot). The photo stays inside this form&rsquo;s saved file and on this device; it is shown on the Rate page too.</span></div>';
  if(look==='discreet')h+='<div class="sm2-row"><label>Cards on a page <select data-d="cards">'+[['','2 (or 6 for a weekly sheet)'],['1','1'],['2','2'],['4','4'],['6','6: Monday to Friday and the week’s graph']].map(([v,l])=>'<option value="'+v+'"'+(String(d.cards||'')===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label></div>';
  if(look!=='classic')h+='<div class="sm2-row"><label class="ck"><input type="checkbox" data-d="wf"'+(d.wf===false?'':' checked')+'> &ldquo;I&rsquo;m working for&rdquo; box (the reward chosen before the day starts)</label>'+
    '<label class="ck"><input type="checkbox" data-d="cstrip"'+(d.cstrip?' checked':'')+'> The contract&rsquo;s line on the sheet (from the Contract page)</label></div>'+
    '<div class="sm2-row"><label style="flex:1">Midday check (optional) <input data-d="mid" value="'+esc(d.mid||'')+'" placeholder="e.g., 18 points by lunch = 5 minutes of catch at recess" style="width:100%"></label></div>'+
    '<div class="sm2-row"><label style="flex:1">QR code link (optional): the walkthrough video saved to your drive, or any page for the team <input data-d="qr" value="'+esc(d.qr||'')+'" placeholder="https://" inputmode="url" style="width:100%"></label><label>Under the code <input data-d="qrlab" value="'+esc(d.qrlab||'')+'" placeholder="Watch how my sheet works"></label></div>';
  h+='<h3>How the student rates</h3><p class="hint">One choice for every sheet type. Each style has its points (edit them below); stars are coloured in, one point each. A rubric point sheet keeps its own five levels. With Self &amp; Match, a two-choice style uses the Match Points table (System page); a style with more levels counts '+esc(smTeacher().toLowerCase())+'&rsquo;s rating, plus a bonus when the student&rsquo;s rating is the same.</p><div id="smRates"></div>';
  el.innerHTML=h;smRenderDesignRates();}
function smRenderDesignRates(){const el=$('#smRates');if(!el)return;const d=smD(),k=smRateKey();
  let h='<div class="sm2-rates">'+SM_RATE_ORDER.map(r=>{const keep=d.rate;d.rate=r;const cell=r==='auto'?'<span class="hint">'+esc(SM_RATES.auto.note)+'</span>':smRateCell(26);d.rate=keep;
    return '<label class="'+(r===k?'on':'')+'"><input type="radio" name="smRate" data-d="rate" value="'+r+'"'+(r===k?' checked':'')+'>'+cell+'<b>'+esc(SM_RATES[r].l)+'</b></label>';}).join('')+'</div>';
  if(k!=='auto'){const lv=smLevels();h+='<div class="sm2-row"><label>Points for each level, in order <input data-d="rv" value="'+esc(d.rv||'')+'" placeholder="'+lv.map(x=>x[1]).join(',')+'" style="width:110px"></label><span>'+smRateKeyHTML(18)+'</span>'+
    (S.sys==='match'&&!smRateBin()?'<label>Bonus when the ratings are the same <input data-d="mbonus" value="'+esc(d.mbonus||'')+'" placeholder="1" style="width:50px"></label>':'')+'</div>';
    if(k==='words')h+='<div class="sm2-row"><label style="flex:1">The words, best first, separated by | <input data-d="rwords" value="'+esc(d.rwords||'')+'" placeholder="Nailed it|Almost|Not yet" style="width:100%"></label></div>';
    if(k==='pics')h+='<div class="sm2-row">'+String(d.rpics||'happy,calm,sad').split(',').slice(0,3).map((x,i)=>'<span class="sm2-av"><span class="avp">'+(window.NBH_PICTOS&&NBH_PICTOS[x.trim()]?picto(x.trim(),''):'')+'</span><button type="button" class="tool" data-smrpic="'+i+'">Picture '+(i+1)+'</button></span>').join('')+'<span class="hint">best first</span></div>';
    if(S.sys==='interval'&&!smRateBin())h+='<p class="hint">A cued-interval sheet with more than two levels asks &ldquo;How well was I working?&rdquo;: change the question on the System page to match.</p>';}
  el.innerHTML=h;}
document.addEventListener('click',e=>{const t=e.target.closest('[data-smtheme]');if(t){smD().theme=t.dataset.smtheme;smRedraw();smRenderDesign();return;}
  if(e.target.closest('#smAccReset')){smD().accent='';smRedraw();smRenderDesign();return;}
  if(e.target.closest('#smAvBtn')){const tmp=[{icon:smD().av||'',img:smD().avimg||''}];openPick(tmp,0,()=>{smD().av=tmp[0].icon||'';smD().avimg=tmp[0].img||'';smRedraw();smRenderDesign();});return;}
  if(e.target.closest('#smAvNone')){smD().av='';smD().avimg='';smRedraw();smRenderDesign();return;}
  const rp=e.target.closest('[data-smrpic]');if(rp){const keys=String(smD().rpics||'happy,calm,sad').split(',').map(x=>x.trim());while(keys.length<3)keys.push('');const i=+rp.dataset.smrpic;const tmp=[{icon:keys[i]||'',img:''}];
    openPick(tmp,0,()=>{if(tmp[0].img){alert('A rating picture comes from the library (a photo cannot be used as a rating choice).');return;}keys[i]=tmp[0].icon||keys[i];smD().rpics=keys.join(',');smRedraw();smRenderDesignRates();});}});

/* ---------------- the reward store ---------------- */
function smRenderStore(){const el=$('#smStore');if(!el)return;const d=smD();if(!S.store.length)S.store.push({n:'',icon:'',img:'',p:'',tier:''});
  el.innerHTML='<div class="tools"><button type="button" class="tool" id="smStAdd">Add a reward</button><button type="button" class="tool" id="smStDel">Remove last</button><button type="button" class="tool" id="smStMenu">Fill from the reward menu above</button></div>'+
    '<div class="grid-wrap"><table class="rt sm2-store"><thead><tr><th style="width:4%">#</th><th style="width:38%">Reward (as the student says it)</th><th style="width:22%">Picture</th><th style="width:12%">Points</th><th style="width:16%">Tier</th><th class="nx noprint"></th></tr></thead><tbody>'+
    S.store.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="store" data-i="'+i+'" data-f="n" value="'+esc(o.n)+'" placeholder="Drawing time"></td><td>'+pickCell('store',i,o)+'</td><td><input data-r="store" data-i="'+i+'" data-f="p" value="'+esc(o.p)+'" placeholder="10" inputmode="numeric"></td>'+
      '<td><select data-r="store" data-i="'+i+'" data-f="tier"><option value=""></option>'+Object.entries(SM_TIERS).map(([k,l])=>'<option value="'+k+'"'+(o.tier===k?' selected':'')+'>'+l+'</option>').join('')+'</select></td>'+delCell('store',i,'reward')+'</tr>').join('')+'</tbody></table></div>'+
    '<div class="ckrow"><label class="ck"><input type="checkbox" data-d="tiers"'+(d.tiers?' checked':'')+'> Group the store by tier (small, medium, big)</label><label class="ck"><input type="checkbox" data-d="bank"'+(d.bank?' checked':'')+'> A bank: points not spent are saved for a bigger reward</label></div>'+
    (smStore().length&&smLook()==='classic'?'<p class="hint">The store prints on the Bright, Theme, Clean and Discreet looks (Design page) and on My Reward Menu.</p>':'');}
document.addEventListener('click',async e=>{
  if(e.target.closest('#smStAdd')){if(S.store.length>=16)return;S.store.push({n:'',icon:'',img:'',p:'',tier:''});smRenderStore();return;}
  if(e.target.closest('#smStDel')){if(S.store.length<=1)return;const r=S.store[S.store.length-1];if((r.n||r.p||r.icon||r.img)&&!(await nbhUI.confirm('Remove the last reward?',{ok:'Remove',danger:true})))return;S.store.pop();smRenderStore();renderSheet();return;}
  if(e.target.closest('#smStMenu')){const items=String(S.meta.menu||'').split(/\s*(?:·|\n|;)\s*/).map(x=>x.trim()).filter(Boolean);if(!items.length){alert('The reward menu above is empty.');return;}
    const have=new Set(smStore().map(o=>String(o.n).toLowerCase()));const prices=[5,8,10,12,15,20,25,30];let k=smStore().length;
    S.store=smStore();items.forEach(n=>{if(have.has(n.toLowerCase()))return;S.store.push({n,icon:smGuessIcon(n),img:'',p:String(prices[Math.min(k,prices.length-1)]),tier:''});k++;});smRenderStore();renderSheet();return;}
  const del=e.target.closest('button.rowDel[data-del="store"],button.rowDel[data-del="per2"]');if(del){e.stopImmediatePropagation();const r=del.dataset.del,i=+del.dataset.i,row=S[r][i];
    if((row.n||row.p||row.label||row.t||row.icon||row.img)&&!(await nbhUI.confirm(r==='store'?'Delete this reward?':'Delete this period of the second schedule?',{ok:'Delete',danger:true})))return;S[r].splice(i,1);if(r==='store')smRenderStore();else smRenderSched();renderSheet();}},true);
/* a picture for a reward from its words: the library labels and a few common rewards */
function smGuessIcon(n){const l=String(n).toLowerCase(),P=window.NBH_PICTOS||{};const map=[[/recess|playground|outside/,'playground'],[/draw|color/,'drawing'],[/line leader|line/,'lineup'],[/fish|pet|dog|cat/,'pet'],[/ipad|tablet/,'ipad'],[/computer/,'computer'],[/lego/,'lego'],[/game/,'game'],[/book|story|read/,'story'],[/music|song/,'musicfun'],[/dance/,'dance'],[/helper|job/,'helper'],[/sticker/,'sticker'],[/free time|choice/,'freetime'],[/snack|treat/,'snackfun'],[/puzzle/,'puzzle'],[/ball|catch|sport/,'ball'],[/bubble/,'bubbles'],[/walk/,'walkfun'],[/video|youtube/,'video'],[/swing/,'swing'],[/bike/,'bike'],[/play-?doh|clay/,'playdough']];
  for(const [re,k] of map)if(re.test(l)&&P[k])return k;const hit=Object.keys(P).find(k=>P[k].l&&l.includes(P[k].l.toLowerCase()));return hit||'';}

/* ---------------- the target library ---------------- */
const SM_LIB=(typeof SM_LIBRARY!=='undefined'&&SM_LIBRARY.entries)||[];
function smLibDlg(){let d=$('#smLibDlg');if(d)return d;d=document.createElement('dialog');d.id='smLibDlg';d.setAttribute('aria-label','Target library');
  d.innerHTML='<div class="lb-head"><b>Add targets from the library</b><select id="smLibAge"><option value="">All ages</option><option value="young">Younger students (K to 3)</option><option value="older">Older students (4 to 12)</option></select><input id="smLibQ" placeholder="search" aria-label="Search the library"></div><div class="lb-list" id="smLibList"></div><div class="lb-foot"><span class="hint" id="smLibN"></span><button type="button" class="tool" id="smLibClose">Cancel</button><button type="button" class="tool primary" id="smLibAdd">Add the chosen targets</button></div>';
  document.body.appendChild(d);const sel=new Set();
  const list=()=>{const a=$('#smLibAge',d).value,q=($('#smLibQ',d).value||'').toLowerCase();let g='',h='';
    SM_LIB.filter(x=>(!a||x.age===a||x.age==='all')&&(!q||(x.word+' '+x.def+' '+x.group).toLowerCase().includes(q))).forEach(x=>{if(x.group!==g){g=x.group;h+='<div class="lb-g">'+esc(g)+'</div>';}
      h+='<div class="lb-it'+(sel.has(x.id)?' on':'')+'" data-lib="'+esc(x.id)+'" role="checkbox" aria-checked="'+sel.has(x.id)+'" tabindex="0"><span class="tp">'+(window.NBH_PICTOS&&NBH_PICTOS[x.icon]?picto(x.icon,''):'')+'</span><span><b>'+esc(x.word)+'</b><small>'+esc(x.def)+'</small></span></div>';});
    $('#smLibList',d).innerHTML=h||'<p class="hint">Nothing matches.</p>';const room=6-S.tg.filter(t=>t.word||t.def).length;$('#smLibN',d).textContent=sel.size+' chosen · room for '+Math.max(0,room)+' more on the sheet';};
  $('#smLibAge',d).addEventListener('change',list);$('#smLibQ',d).addEventListener('input',list);
  const tog=it=>{const id=it.dataset.lib;if(sel.has(id))sel.delete(id);else sel.add(id);list();};
  $('#smLibList',d).addEventListener('click',e=>{const it=e.target.closest('[data-lib]');if(it)tog(it);});
  $('#smLibList',d).addEventListener('keydown',e=>{const it=e.target.closest('[data-lib]');if(it&&(e.key===' '||e.key==='Enter')){e.preventDefault();tog(it);}});
  $('#smLibClose',d).addEventListener('click',()=>d.close());
  $('#smLibAdd',d).addEventListener('click',()=>{const n=smLibPlace([...sel]);sel.clear();d.close();if(n)nbhUI.toast(n+' target'+(n===1?'':'s')+' added from the library. Edit the wording on the Targets page to fit the student.',{kind:'ok'});});
  d.list=list;d.sel=sel;return d;}
/* place library entries: empty rows first, then new rows, up to six; a target already on the sheet is not placed twice */
function smLibPlace(ids){let n=0;const have=new Set(S.tg.map(t=>String(t.word||'').trim().toLowerCase()).filter(Boolean));
  ids.map(id=>SM_LIB.find(x=>x.id===id)).filter(Boolean).forEach(x=>{if(have.has(x.word.toLowerCase()))return;let row=S.tg.find(t=>!t.word&&!t.def&&!t.cue);
    if(!row){if(S.tg.length>=6)return;row={word:'',def:'',cue:'',ex:'',nex:'',icon:'',img:'',goal:''};S.tg.push(row);}
    Object.assign(row,{word:x.word,def:x.def,cue:x.cue,ex:x.ex,nex:x.nex,icon:x.icon,img:'',goal:x.goal||''});have.add(x.word.toLowerCase());n++;});
  renderT();renderSheet();renderPoints();renderSetup();return n;}
document.addEventListener('click',e=>{if(e.target.closest('#smLibBtn')){if(!SM_LIB.length){alert('The library is not in this copy of the form.');return;}const d=smLibDlg();$('#smLibQ',d).value='';const g=parseInt(S.meta.grade,10);$('#smLibAge',d).value=isFinite(g)?(g<=3?'young':'older'):'';d.list();d.showModal();}});

/* ---------------- schedules ---------------- */
const SM_SCHED={
  elem:{l:'Elementary day',rows:[['08:00','Arrival and morning meeting','arrival'],['08:30','Reading','reading'],['09:30','Writing','writing'],['10:15','Math','math'],['11:15','Specials','art'],['12:00','Lunch and recess','lunch'],['12:45','Science or social studies','science'],['13:30','Centers','centers'],['14:15','Pack up and dismissal','dismissal']]},
  half:{l:'Half day (morning)',rows:[['08:00','Arrival','arrival'],['08:30','Reading','reading'],['09:30','Math','math'],['10:30','Recess','recess'],['11:00','Centers','centers']]},
  ms:{l:'Middle school, seven periods',rows:[['08:05','ELA','reading'],['08:55','Math','math'],['09:45','Science','science'],['10:35','Social studies','library'],['11:25','Lunch','lunch'],['12:10','PE','pe'],['13:00','Advisory','classroom']]},
  hs:{l:'High school, seven periods',rows:[['07:30','1st period',''],['08:25','2nd period',''],['09:20','3rd period',''],['10:15','4th period',''],['11:10','Lunch',''],['11:45','5th period',''],['12:40','6th period',''],['13:35','7th period','']]},
  block:{l:'High school block, four periods',rows:[['07:30','Block 1',''],['09:10','Block 2',''],['10:50','Lunch',''],['11:25','Block 3',''],['13:05','Block 4','']]}
};
function smRenderSched(){const el=$('#smSched');if(!el)return;const d=smD();
  let h='<div class="sm2-row"><label>Start from a schedule <select id="smSchedSel"><option value="">choose…</option>'+Object.entries(SM_SCHED).map(([k,v])=>'<option value="'+k+'">'+esc(v.l)+'</option>').join('')+'</select></label>'+
    '<span>or rows every <input id="smEvN" value="15" inputmode="numeric" style="width:48px"> minutes, <input id="smEvC" value="8" inputmode="numeric" style="width:44px"> rows, from <input type="time" id="smEvT" value="09:00"></span><button type="button" class="tool" id="smEvGo">Make the rows</button></div>'+
    '<div class="ckrow"><label class="ck"><input type="checkbox" data-d="alt"'+(d.alt?' checked':'')+'> A second schedule for another kind of day (specials day, early release); the sheet shows it while this is ticked</label></div>';
  if(d.alt){if(!S.per2.length)S.per2=S.per.map(p=>Object.assign({},p));
    h+='<div class="tools"><button type="button" class="tool" id="smP2Add">Add a period</button><button type="button" class="tool" id="smP2Copy">Copy the regular day</button></div><div class="grid-wrap"><table class="rt"><thead><tr><th style="width:5%">#</th><th style="width:22%">Time</th><th style="width:38%">Label</th><th>Picture</th><th class="nx noprint"></th></tr></thead><tbody>'+
      S.per2.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input type="time" data-r="per2" data-i="'+i+'" data-f="t" value="'+esc(toHM24(r.t)||r.t)+'"></td><td><input data-r="per2" data-i="'+i+'" data-f="label" value="'+esc(r.label)+'"></td><td>'+pickCell('per2',i,r)+'</td>'+delCell('per2',i,'period')+'</tr>').join('')+'</tbody></table></div>'+
      '<p class="hint">The Record and the week grid follow the regular day&rsquo;s periods; the second schedule changes only the printed sheet.</p>';}
  el.innerHTML=h;}
async function smUseSched(rows,label){const has=S.per.some(p=>p.t||p.label);if(has&&!(await nbhUI.confirm('Replace the periods with the '+label+'?\nThe current periods and their pictures are replaced; the Record keeps its days.',{ok:'Replace'})))return false;
  S.per=rows.map(([t,l,ic])=>({t,label:l,icon:window.NBH_PICTOS&&NBH_PICTOS[ic]?ic:'',img:''}));renderP();renderSheet();renderPoints();renderWk();return true;}
document.addEventListener('change',e=>{if(e.target.id==='smSchedSel'){const k=e.target.value;e.target.value='';if(SM_SCHED[k])smUseSched(SM_SCHED[k].rows,SM_SCHED[k].l.toLowerCase());}});
document.addEventListener('click',e=>{if(e.target.closest('#smEvGo')){const n=Math.max(1,Math.min(60,num($('#smEvN').value)||15)),c=Math.max(1,Math.min(16,num($('#smEvC').value)||8)),t0=toHM24($('#smEvT').value)||'09:00';
    const m0=+t0.slice(0,2)*60+ +t0.slice(3,5);smUseSched(Array.from({length:c},(_,i)=>{const m=m0+i*n;return [String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),'Check '+(i+1),''];}),'rows every '+n+' minutes');}
  if(e.target.closest('#smP2Add')){if(S.per2.length<16){S.per2.push({t:'',label:'',icon:'',img:''});smRenderSched();}}
  if(e.target.closest('#smP2Copy')){S.per2=S.per.map(p=>Object.assign({},p));smRenderSched();renderSheet();}});

/* ---------------- quick starts ---------------- */
const SM_QS=[
  {id:'young',ic:'stayarea',t:'Young student: pictures, Self & Match',x:'Thumbs up or down for the student and the teacher, pictures for each period, a reward store with prices. Kindergarten to grade 3.',sys:'match',chk:{pict:true,graph:true,home:true,pocket:false,weekly:false},d:{look:'bright',rate:'thumbs'},lib:['stay_area','follow_first','kind_words'],sched:'elem'},
  {id:'expect',ic:'calm',t:'Expectations sheet with the student’s interest',x:'Three smiles per expectation, a sports (or space, animals…) sheet, a midday check, the reward store.',sys:'smiley',chk:{pict:true,pocket:false,weekly:false},d:{look:'theme',theme:'sports',rate:'faces3',mid:'Half the points by lunch = 5 minutes of a game at recess'},lib:['task_start_y','change_y','kind_words'],sched:'elem'},
  {id:'ontask',ic:'timer',t:'On-task checks during independent work',x:'A cue every few minutes: “Was I working?” The student and the teacher answer; the matches count.',sys:'interval',chk:{pict:true,pocket:false},d:{look:'bright',rate:'faces2'},lib:[],sched:'',meta:{iv_q:'Was I working?',iv_len:'3',iv_n:'10',iv_cue:'Tactile timer (vibrating prompt)',iv_timing:'Fixed: every interval the same length',iv_match:'Every interval',iv_act:'independent work'}},
  {id:'cico',ic:'teacher',t:'Middle school Check-In / Check-Out',x:'0, 1 or 2 points per class, a mentor at both ends of the day, points to spend, a clean report.',sys:'cico',chk:{pict:false,pocket:false,weekly:false},d:{look:'clean',rate:'p012'},lib:['task_start_o','on_task','respect_staff_o'],sched:'ms'},
  {id:'teen',ic:'ok',t:'High school pocket cards',x:'Plus or minus, initials only, a card a day and the week’s graph, the student and the teacher both rate.',sys:'match',chk:{pict:false,pocket:false,weekly:false},d:{look:'discreet',rate:'pm',cards:'6'},lib:['task_start_o','talk_turns_o','respect_staff_o'],sched:'hs'},
  {id:'rubric',ic:'check',t:'Point sheet with levels',x:'One rating from 1 to 5 each period, each level described; the student and the teacher both circle.',sys:'rubric',chk:{rubmatch:true,pict:true,pocket:false,weekly:false},d:{look:'clean'},lib:[],sched:'elem'}
];
function smRenderQS(){const el=$('#smQS');if(!el)return;el.innerHTML='<p class="hint">Start from a common arrangement and change anything after: it sets the sheet type, the look and the rating, and fills the targets and the day where they are empty (nothing you have entered is replaced).</p><div class="sm2-qs">'+
  SM_QS.map(q=>'<button type="button" data-qs="'+q.id+'"><span class="qi">'+(window.NBH_PICTOS&&NBH_PICTOS[q.ic]?picto(q.ic,''):'')+'</span><span><b>'+esc(q.t)+'</b><small>'+esc(q.x)+'</small></span></button>').join('')+'</div>';}
async function smQuick(id){const q=SM_QS.find(x=>x.id===id);if(!q)return;
  if(!(await nbhUI.confirm('Use “'+q.t+'”?\nThe sheet type, the look and the rating style change. Targets and periods are filled only where they are empty.',{ok:'Use it'})))return;
  S.sys=q.sys;Object.assign(S.chk,q.chk||{});const keep={tw:smD().tw,av:smD().av,avimg:smD().avimg,qr:smD().qr,qrlab:smD().qrlab,accent:''};S.d=Object.assign({},smD(),{rv:'',mbonus:'',cards:''},q.d,keep);
  if(q.meta)Object.keys(q.meta).forEach(k=>{if(!S.meta[k])S.meta[k]=q.meta[k];});
  if(q.lib.length&&S.tg.every(t=>!t.word&&!t.def)){S.tg=[];smLibPlace(q.lib);}
  if(q.sched&&S.per.every(p=>!p.t&&!p.label))S.per=SM_SCHED[q.sched].rows.map(([t,l,ic])=>({t,label:l,icon:window.NBH_PICTOS&&NBH_PICTOS[ic]?ic:'',img:''}));
  if(!smStore().length&&S.meta.menu)$('#smStMenu')&&$('#smStMenu').click();
  renderAll();setView('sheet');nbhUI.toast('“'+q.t+'” is set. Change the targets, the day, the look or the rating on their pages.',{kind:'ok'});}
document.addEventListener('click',e=>{const b=e.target.closest('[data-qs]');if(b)smQuick(b.dataset.qs);});

/* ---------------- the live preview ---------------- */
let SMPV=false;
function smPrevUI(){if(!$('#smPrevBtn')){const b=document.createElement('button');b.type='button';b.id='smPrevBtn';b.className='noprint';b.textContent='Preview the sheet';b.setAttribute('aria-expanded','false');document.body.appendChild(b);
    const p=document.createElement('div');p.id='smPrev';p.className='noprint';p.hidden=true;p.innerHTML='<div class="ph">The student&rsquo;s sheet, as it prints<button type="button" class="tool" id="smPrevGo">Open the Sheet page</button><button type="button" class="tool" id="smPrevX" aria-label="Close the preview">×</button></div><div class="pb" id="smPrevB" title="Open the Sheet page"><div class="pi" id="smPrevI"></div></div>';document.body.appendChild(p);}
  }
function smPrevDraw(){const p=$('#smPrev');if(!p||p.hidden)return;const i=$('#smPrevI'),src=$('#sheetOut');i.className='pi '+src.className;i.innerHTML=src.innerHTML;i.querySelectorAll('button').forEach(b=>b.remove());
  const w=p.clientWidth||440,k=w/980;i.style.transform='scale('+k+')';$('#smPrevB').style.height=Math.min(window.innerHeight*.55,i.scrollHeight*k)+'px';}
document.addEventListener('click',e=>{if(e.target.closest('#smPrevBtn')){SMPV=!SMPV;$('#smPrev').hidden=!SMPV;$('#smPrevBtn').setAttribute('aria-expanded',String(SMPV));$('#smPrevBtn').textContent=SMPV?'Hide the preview':'Preview the sheet';smPrevDraw();}
  if(e.target.closest('#smPrevX')){SMPV=false;$('#smPrev').hidden=true;$('#smPrevBtn').textContent='Preview the sheet';}
  if(e.target.closest('#smPrevGo')||e.target.closest('#smPrevB'))setView('sheet');});
window.addEventListener('resize',()=>{if(SMPV)smPrevDraw();});

/* ---------------- the sheet page: fit, and the extra prints ---------------- */
const SM_PAGE={landscape:[960,720],portrait:[720,960]};
function smFit(){const out=$('#sheetOut');if(!out||!S.sys)return {k:1,h:0};const o=sheetOrientation(),[W,H]=SM_PAGE[o];
  const m=document.createElement('div');m.className=out.className;m.style.cssText='position:absolute;left:-10000px;top:0;width:'+W+'px;visibility:hidden';m.innerHTML=out.innerHTML;document.body.appendChild(m);
  const sw=m.scrollWidth,sh=m.scrollHeight;m.remove();const k=Math.min(1,W/Math.max(W,sw),H/Math.max(1,sh));return {k,h:sh,w:sw,o,W,H};}
function smRenderSheetTools(){const el=$('#smSheetTools');if(!el)return;if(!S.sys){el.innerHTML='';return;}const f=smFit(),d=smD();
  const multi=(smLook()==='discreet')||(S.sys==='perf'||S.sys==='interlock');
  el.innerHTML=(f.h?'<div class="sm2-fit '+(f.k>=.985?'ok':'big')+'">'+(f.k>=.985?'Fits on one '+f.o+' page.':'Runs past one '+f.o+' page at full size'+(d.nofit?': it will print on two pages.':': it prints shrunk to '+Math.round(f.k*100)+'% to fit one page.')+(f.k<.8?' That is small: fewer periods or targets, or a looser look, reads better.':''))+
      (f.k<.985?' <label class="ck" style="display:inline-flex;margin-left:8px"><input type="checkbox" data-d="nofit"'+(d.nofit?' checked':'')+'> print at full size instead</label>':'')+'</div>':'')+
    '<div class="sm2-prints"><button type="button" class="tool" id="smPrWeek">Print a week (Monday to Friday)</button>'+(multi?'':'<button type="button" class="tool" id="smPrHalf">Print two half-size copies on a page</button>')+
    '<button type="button" class="tool" id="smPrMenu"'+(smStore().length?'':' disabled title="Add rewards to the store on the Reinforcement page"')+'>Print My Reward Menu</button><button type="button" class="tool" id="smPrGuide">Print How to Run This Sheet (staff)</button><button type="button" class="tool" id="smPrPrac"'+(S.tg.some(t=>t.ex||t.nex)?'':' disabled title="Write an example and a non-example for a target on the Targets page"')+'>Print a rating practice page</button></div>';}
/* the sheet printed alone: shrunk to one page unless the user asked for full size */
const smPrintAlone0=printAlone;
printAlone=function(cls,orient){if(cls==='sm-sheet-only'&&!smD().nofit){const f=smFit();if(f.k<.985){const st=document.createElement('style');st.textContent='@media print{#sheetOut{zoom:'+f.k.toFixed(3)+'}}';document.head.appendChild(st);const off=()=>{st.remove();window.removeEventListener('afterprint',off);};window.addEventListener('afterprint',off);setTimeout(off,60000);}}
  return smPrintAlone0(cls,orient);};
function smExtraPrint(html,orient){const x=$('#smExtraOut');x.innerHTML=html;printAlone('sm-extra-only',orient);const off=()=>{x.innerHTML='';window.removeEventListener('afterprint',off);};window.addEventListener('afterprint',off);}
function smSheetAs(day){const keep=S.meta.sh_date;S.meta.sh_date=day;renderSheet();const h=$('#sheetOut').innerHTML,c=$('#sheetOut').className;S.meta.sh_date=keep;renderSheet();return {h,c};}
document.addEventListener('click',e=>{if(!S.sys&&e.target.closest('#smSheetTools button'))return;
  if(e.target.closest('#smPrWeek')){const f=smFit(),z=smD().nofit?1:f.k;smExtraPrint(DAYS.map(dn=>{const r=smSheetAs(dn+' ________');return '<div class="pg"><div class="'+r.c+'" style="zoom:'+z.toFixed(3)+'">'+r.h+'</div></div>';}).join(''),sheetOrientation());}
  if(e.target.closest('#smPrHalf')){const f=smFit(),k=Math.min(720/Math.max(1,f.w||960),470/Math.max(1,f.h||720));const c=$('#sheetOut').className,h=$('#sheetOut').innerHTML;smExtraPrint('<div class="pg"><div class="'+c+'" style="zoom:'+k.toFixed(3)+'">'+h+'</div><div style="border-top:1.5px dashed #999;margin:12px 0;font-size:10px;color:#888">✂</div><div class="'+c+'" style="zoom:'+k.toFixed(3)+'">'+h+'</div></div>','portrait');}
  if(e.target.closest('#smPrMenu'))smExtraPrint(smMenuPage(),'portrait');
  if(e.target.closest('#smPrGuide'))smExtraPrint(smGuidePage(),'portrait');
  if(e.target.closest('#smPrPrac'))smExtraPrint(smPracticePage(),'portrait');});
function smMenuPage(){const st=smStore().slice().sort((a,b)=>(num(a.p)??1e9)-(num(b.p)??1e9)),nm=smName()||'My';
  return '<div class="pg sm2-pg"><h2 style="font:700 34px &quot;Avenir Next&quot;,Avenir,&quot;URW Gothic&quot;,system-ui,sans-serif;color:#c27c00;text-align:center">'+esc(nm==='My'?'My':nm+'’s')+' Reward Menu</h2><p class="sub" style="text-align:center;font-size:16px">Points I need for each reward'+(smD().bank?' · points I save stay in my bank':'')+'</p><div class="sm2-menu">'+
    st.map(o=>'<div class="it">'+smStorePic(o,84)+esc(o.n||'')+'<br><span class="pr">'+esc(o.p||'')+'</span></div>').join('')+'</div><p class="sub" style="margin-top:16px;text-align:right">Form SM-1</p></div>';}
function smGuidePage(){const m=S.meta,p=possible(),tw=smTeacher(),lv=smLevels(),sysN={match:'Self & Match',contract:'Self-monitoring contract',rubric:'Rubric point sheet',interval:'Cued intervals',interlock:'Interlocking schedule session',smiley:'Expectations and earns',perf:'Performance count',cico:'Check-in / check-out'}[S.sys]||'';
  const rate=lv?(SM_RATES[smRateKey()].count?'colors in 0 to 3 stars':'circles one of: '+lv.map(x=>x[2]+' ('+x[1]+')').join(', ')):'rates as the sheet shows';
  const steps=[];steps.push('<b>Before the day.</b> The student chooses a reward from the store'+(smStore().length?' ('+smStore().map(o=>esc(o.n)+' '+esc(o.p)).join(', ')+')':'')+' and writes it, or puts its picture, in the &ldquo;working for&rdquo; box. Say the goal aloud: '+(p.need!=null?p.need+' of '+p.poss+' '+esc(p.unit):'the goal on the sheet')+'.');
  if(S.sys==='interval')steps.push('<b>At each cue</b> ('+esc(m.iv_cue||'timer')+', about every '+esc(m.iv_len||'3')+' minutes) the student asks &ldquo;'+esc(m.iv_q||'Was I working?')+'&rdquo; and '+rate+', then goes straight back to work. '+esc(tw)+' rates '+esc(m.iv_match||'the same intervals')+' without looking at the student&rsquo;s sheet.');
  else steps.push('<b>At the end of each period</b> the student '+rate+' for each target. '+(['match','rubric','interval'].includes(S.sys)?esc(tw)+' rates too, on their own, before seeing the student&rsquo;s rating, then the two compare: ':'')+(S.sys==='match'?(smRateBin()?'the same answer earns the points in the key (an honest no still earns).':esc(tw)+'&rsquo;s rating counts and a matching rating earns a bonus point.'):S.sys==='cico'?esc(tw)+' writes 0, 1 or 2 and initials.':'')+(/one reminder/.test(m.t_rem||'')?' A yes allows one reminder; tally reminders in the R R box.':''));
  steps.push('<b>Say what you saw,</b> in one sentence, in the student&rsquo;s terms (&ldquo;You stayed in your area the whole time&rdquo;). Praise honest ratings, including an honest no.');
  steps.push('<b>Never</b> take points away, argue about a rating, or show the sheet to the class. '+esc(m.never||''));
  steps.push('<b>At the end of the day</b> the student adds up the points with you. If the goal is met, the reward is delivered '+esc((m.when||'the same day').toLowerCase())+'. Initial the sheet'+(S.chk.home?' and send the home note':'')+'.');
  steps.push('<b>Record the day</b> on the Record page of Form SM-1: the points, the points possible'+(['match','interval'].includes(S.sys)?', the matches and the ratings compared':'')+'.');
  return '<div class="pg sm2-pg"><h2>How to Run This Sheet</h2><p class="sub">'+esc(smName()||'')+' · '+esc(sysN)+(m.rater?' · Rated by '+esc(m.rater):'')+(m.bcba?' · '+esc(m.bcba):'')+'</p><ol>'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>'+
    '<div class="box"><b>The targets</b><table style="margin-top:6px"><tr><th style="width:26%">On the sheet</th><th>What it looks like (the definition)</th><th style="width:22%">Example</th><th style="width:22%">Not an example</th></tr>'+S.tg.filter(t=>t.word||t.def).map(t=>'<tr><td>'+esc(t.word)+'</td><td>'+esc(t.def)+'</td><td>'+esc(t.ex)+'</td><td>'+esc(t.nex)+'</td></tr>').join('')+'</table></div>'+
    (m.cc_up?'<div class="box"><b>When the goal changes.</b> Raise it when '+esc(m.cc_up)+(m.cc_step?', by '+esc(m.cc_step):'')+'. '+(m.cc_down?'Lower it, or change the reward, when '+esc(m.cc_down)+'.':'')+'</div>':'')+'<p class="sub" style="text-align:right">Form SM-1</p></div>';}
function smPracticePage(){const items=[];S.tg.forEach(t=>{if(t.ex)items.push({t,s:t.ex,yes:true});if(t.nex)items.push({t,s:t.nex,yes:false});});
  const order=items.map((x,i)=>({x,k:(i*7+3)%11})).sort((a,b)=>a.k-b.k).map(a=>a.x).slice(0,10);const lv=smLevels()||[['fh',1],['fs',0]];const bin=lv.length===2;
  const cell=smRateKey()==='auto'?smGlyph('fh',28)+smGlyph('fs',28):smRateCell(28);
  return '<div class="pg sm2-pg"><h2>Practice: How Did It Go?</h2><p class="sub">'+esc(smName()||'')+' · Read each one (or listen). Circle how it went'+(bin?'':': the best rating if it was done, the lowest if it was not')+'.</p><table>'+order.map((o,i)=>'<tr><td style="width:5%;text-align:center">'+(i+1)+'</td><td style="width:26%"><b>'+esc(o.t.word)+'</b></td><td>'+esc(o.s)+'</td><td style="width:22%;text-align:center">'+cell+'</td></tr>').join('')+'</table>'+
    '<p class="sub" style="margin-top:18px;font-size:11px">Answer key for the adult: '+order.map((o,i)=>(i+1)+' '+(o.yes?'yes':'no')).join(' · ')+'</p><p class="sub" style="text-align:right">Form SM-1 · the targets&rsquo; own examples and non-examples</p></div>';}

/* ---------------- the contract, linked to the sheet ---------------- */
function smRenderBcTools(){const el=$('#smBcTools');if(!el)return;el.innerHTML='<div class="sm2-row" style="margin:8px 0"><button type="button" class="tool" id="smBcFill">Fill the empty lines from the sheet</button><label class="ck"><input type="checkbox" data-d="bcpic"'+(smD().bcpic?' checked':'')+'> Pictures on the contract (for a younger student)</label><label class="ck"><input type="checkbox" data-d="cstrip"'+(smD().cstrip?' checked':'')+'> Put the contract&rsquo;s line on the sheet</label></div>';}
document.addEventListener('click',e=>{if(!e.target.closest('#smBcFill'))return;const m=S.meta,p=possible();let n=0;const set=(k,v)=>{if(!m[k]&&v){m[k]=v;n++;}};
  set('bc_task','Earn my goal on my '+({match:'Self & Match sheet',cico:'daily progress report',smiley:'self-monitoring sheet'}[S.sys]||'point sheet'));
  set('bc_how',p.need!=null?'At least '+p.need+' of '+p.poss+' '+p.unit+' a day, on 4 of 5 school days':'');
  set('bc_when','Every school day'+(S.per.length?', '+S.per.length+' period'+(S.per.length===1?'':'s'):''));
  set('bc_record',(m.rater||smTeacher())+' initials the sheet each day');const st=smStore();
  set('bc_rw',st.length?st.slice().sort((a,b)=>(num(b.p)??0)-(num(a.p)??0))[0].n:String(m.menu||'').split(/\s*(?:·|\n|;)\s*/)[0]||'');
  set('bc_rwwhen',m.when||'');bindMeta();renderBc();renderSheet();nbhUI.toast(n?n+' line'+(n===1?'':'s')+' filled from the sheet; read them and change any.':'Nothing was empty: every line already had your words.',{kind:'ok'});});
const smRenderBc0=renderBc;
renderBc=function(){smRenderBc0();const out=$('#bcOut');if(!out||!smD().bcpic)return;const tg=S.tg.filter(t=>t.word&&(t.icon||t.img)),st=smStore(),rw=String(S.meta.bc_rw||'').toLowerCase();
  const r=st.find(o=>o.n&&rw.includes(String(o.n).toLowerCase()))||null;
  const strip='<div class="bc-pics" style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin:6px 0 10px;font:600 13px &quot;Avenir Next&quot;,Avenir,system-ui,sans-serif">'+tg.map(t=>'<div style="text-align:center;width:96px">'+pic(t,'')+'<div>'+esc(t.word)+'</div></div>').join('')+(r?'<div style="font-size:30px;padding:0 6px">→</div><div style="text-align:center;width:110px">'+smStorePic(r,64)+'<div>'+esc(r.n)+'</div></div>':'')+'</div>';
  const h3=out.querySelector('h3');if(h3)h3.insertAdjacentHTML('afterend',strip);out.querySelectorAll('.bc-pics svg,.bc-pics img').forEach(x=>{x.style.width=x.style.width||'64px';x.style.height=x.style.height||'64px';});};

/* ---------------- wiring into the form's renders ---------------- */
const smRenderSheet0=renderSheet;
renderSheet=function(){smEnsure();const out=$('#sheetOut');const v=typeof smV2Sheet==='function'&&S.sys?smV2Sheet():null;
  if(v!=null){out.className='v2out'+(S.chk.big?' sm-big':'');out.innerHTML=v;}else{smRenderSheet0();const l=smLook();if(l!=='classic'&&S.sys){out.classList.add('look-'+l);out.style.setProperty('--acc',smAccent());}else out.style.removeProperty('--acc');}
  smRenderSheetTools();if(SMPV)smPrevDraw();};
const smRenderAll0=renderAll;
renderAll=function(){smEnsure();smRenderAll0();smRenderDesign();smRenderStore();smRenderSched();smRenderQS();smRenderBcTools();smPrevUI();};
const smFromFile0=fromFile;
fromFile=function(d){const o=smFromFile0(d);if(!o)return o;return smFromFile(d.S,o);};
