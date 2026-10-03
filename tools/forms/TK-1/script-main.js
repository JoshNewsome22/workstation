/* The pictures come from nbh-pictos.js, the shared pictogram library kept beside the forms (one copy serves
   Forms SM-1, VS-1 and TK-1; the one-file edition carries it once and puts it in when a form opens). Without
   the file the form still works: photos, the drawn tokens and avatars, and words; the picture chooser says so. */
if(!window.NBH_PICTOS){window.NBH_PICTOS={};window.NBH_PICTO_CATS={};window.NBH_PICTO_ORDER=[];window.NBH_PICTO_LICENSE='';window.picto=function(){return '';};window.NBH_PICTOS_MISSING=true;}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v));return isFinite(n)?n:null;};
const KEYS=window.NBH_PICTO_ORDER||[],P=window.NBH_PICTOS||{},CATS=window.NBH_PICTO_CATS||{};

/* ---------------- the pictures drawn in this form: tokens and avatars (72 x 72, like the library) ---------------- */
const EYES='<ellipse cx="29.5" cy="33" rx="4.4" ry="5.3" fill="#fff" stroke="#333" stroke-width="1"/><ellipse cx="42.5" cy="33" rx="4.4" ry="5.3" fill="#fff" stroke="#333" stroke-width="1"/><circle cx="30.4" cy="34.2" r="2.8" fill="#222"/><circle cx="43.4" cy="34.2" r="2.8" fill="#222"/><circle cx="31.3" cy="33" r="1" fill="#fff"/><circle cx="44.3" cy="33" r="1" fill="#fff"/>';
const GRIN='<path d="M26 41.5h20c-1.6 7.5-18.4 7.5-20 0z" fill="#fff" stroke="#333" stroke-width="1.3" stroke-linejoin="round"/><path d="M28.5 44.5h15" stroke="#333" stroke-width=".9"/>';
const TOK={
  star:{l:'Star',s:'<path d="M36 4.5l9.4 20.8 22.6 2.4-16.8 15.3 4.7 22.3L36 53.9 16.1 65.3l4.7-22.3L4 27.7l22.6-2.4z" fill="#FFD83D" stroke="#E2A400" stroke-width="2.2" stroke-linejoin="round"/><path d="M36 12.5l6.4 14.1 15.4 1.6-11.5 10.5 3.2 15.2-6.2-3.5" fill="none" stroke="#FFF1A6" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>'+EYES+GRIN},
  smiley:{l:'Smiley',s:'<circle cx="36" cy="36" r="30" fill="#FFD83D" stroke="#E2A400" stroke-width="2.2"/>'+EYES+'<path d="M23 43c4 9 22 9 26 0" fill="none" stroke="#333" stroke-width="2.6" stroke-linecap="round"/>'},
  thumb:{l:'Thumbs up',s:'<path d="M9 33h11v30H9z" fill="#F4C27F" stroke="#333" stroke-width="2" stroke-linejoin="round"/><path d="M20 35c7-5 11-13 11.5-22 .3-4 6-5 8-1.5 2 3.5 1 10-1.5 16h18c3.3 0 5.5 2.2 5.5 5s-2.2 5-5.5 5c3 0 4.5 2 4.5 4.5S58.5 46.5 55.5 46.5c3 0 4.5 2 4.5 4.5s-2 4.5-5 4.5c2.3 0 3.5 1.8 3.5 3.8S57 63 54.5 63H20z" fill="#F4C27F" stroke="#333" stroke-width="2" stroke-linejoin="round"/>'},
  check:{l:'Check',s:'<circle cx="36" cy="36" r="30" fill="#3EA850" stroke="#2A7A38" stroke-width="2.2"/><path d="M19.5 37.5l10.5 10.5 22.5-22.5" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'},
  coin:{l:'Coin',s:'<circle cx="36" cy="36" r="30" fill="#F2C230" stroke="#B8860B" stroke-width="2.2"/><circle cx="36" cy="36" r="22" fill="none" stroke="#D9A520" stroke-width="2"/><text x="36" y="47.5" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="700" text-anchor="middle" fill="#8A5A00">$</text>'},
  heart:{l:'Heart',s:'<path d="M36 64S7 46 7 25.5C7 17 13.5 10.5 22 10.5c6 0 11 3.2 14 8.3 3-5.1 8-8.3 14-8.3 8.5 0 15 6.5 15 15C65 46 36 64 36 64z" fill="#E8463C" stroke="#B3261E" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 21c2-4 6-6 10-6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>'}
};
const FACE=(skin,hairBack,hair,shirt,extra)=>'<rect width="72" height="72" fill="#eef2f5"/>'+(hairBack||'')+'<path d="M16 72c0-12 9-19 20-19s20 7 20 19z" fill="'+shirt+'"/><path d="M30 50h12v6H30z" fill="'+skin+'"/><circle cx="36" cy="33" r="16.5" fill="'+skin+'"/>'+hair+'<circle cx="30" cy="34.5" r="2.2" fill="#222"/><circle cx="42" cy="34.5" r="2.2" fill="#222"/><path d="M30.5 41.5q5.5 4 11 0" stroke="#b05a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="26.5" cy="39.5" rx="2.6" ry="1.5" fill="#f3a7a0" opacity=".7"/><ellipse cx="45.5" cy="39.5" rx="2.6" ry="1.5" fill="#f3a7a0" opacity=".7"/>'+(extra||'');
const AV={
  boy:{l:'Boy',s:FACE('#f6d2b4','','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-3-5.5-8.5-8.5-16.5-8.5S22.5 26.5 19.5 32z" fill="#3b2a1a"/>','#4fc3c3')},
  girl:{l:'Girl',s:FACE('#f6d2b4','<path d="M17 58V34c0-12 8.5-21 19-21s19 9 19 21v24z" fill="#5a3b1a"/>','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-4-4.5-9-6.5-16.5-6.5S23.5 27.5 19.5 32z" fill="#5a3b1a"/>','#f28cb1','<circle cx="52" cy="23" r="3.6" fill="#e75480"/><circle cx="57" cy="19" r="3.6" fill="#e75480"/><circle cx="54.5" cy="21.5" r="1.6" fill="#ffc0cb"/>')},
  child:{l:'Child',s:FACE('#e9c1a0','','<path d="M19.5 32c0-12 7.5-19 16.5-19s16.5 7 16.5 19c-3.5-5-9-7.5-16.5-7.5S23 27 19.5 32z" fill="#6b4a2b"/>','#8ab4f8')}
};
const own=(d,cls,extra)=>'<svg class="'+(cls||'ic')+'" viewBox="0 0 72 72" aria-hidden="true"'+(extra||'')+'>'+d.s+'</svg>';

/* ---------------- state ---------------- */
const DEF={c_frame:'#698ca8',c_ch:'#aed59e',c_tg:'#e4c6e8',c_bd:'#7e9cb6',c_tk:'#f6e27a'};
const TABS=[['ch','CHOICES','c_ch'],['tg','TARGETS','c_tg'],['bd','BOARD','c_bd'],['tk','TOKENS','c_tk']];
const WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
function cello(k,l){return{k:k||'',ph:'',l:l||''};}
const TXT0={
  tb:'__**FIRST-THEN**__:\nThe concept of First-Then states that if you make access to something your learner likes contingent on them first doing something they do not like, then the chances of your learner complying with that request increases. This is also known as the Premack principle or grandma’s rule. A picture of the skill you are teaching your learner should be on the front of this page under the word **FIRST**. The activity that your learner will earn should be placed under the word **THEN**.\n\n__**Tokens**__:\nThis page is where your learner will also place their earned tokens in the corresponding boxes once they have earned them. There are {n} boxes, so once your learner earns {n} tokens, they should receive the item they were working for, located under the THEN box.\n\n__**Not So FAST**__: Before starting, decide how long you would like them to display the behavior or how many responses you would like to see before they receive a token. For example, would you like your learner to answer three problems and then receive one token or work for five minutes and then receive a token? These rules are known as the schedule of reinforcement, and it is essential to ensure that you are not requiring too much and setting the bar too high for your learner. A good rule of thumb is that when teaching a brand new skill, it’s best to initially provide a token after each desired behavior. When maintaining a skill, you can require more responses or use “time intervals” to earn the token.',
  cb:'A **Picture Choice Board** is a board full of picture options to show your learner before starting a task, allowing them to select an item or activity to work for and earn for completing the task.\n\n**Prerequisite Skills:** Your learner will need to have the ability to scan an array of pictures and select a picture of an item/activity they would like to earn.\n\n__**Steps:**__\n1. Show the learner the choice board and allow the learner to select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, utilize prompting to assist the learner with their selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the Green Earned Item Box! The Green Earned Item Box is located under the word “Then.”\n\n**Note:** Once your learner makes sufficient progress, ensure that responding generalizes and that the learner will eventually display the skill without having to select a picture of an item to work for before displaying the skill. Also, be sure to conduct reinforcement assessments and additional preference assessments to ensure that the delivery of the selected item after the learner displays the skill serves as reinforcement.',
  te:'A **Token Economy** is a behavior-based program in which tokens are earned contingent on certain behaviors. Token economies are powerful because they can be used in a variety of settings to access a variety of potential back up reinforcers. Token Economies also help teach “waiting” and they can help bridge the gap between when desired behaviors occur and when reinforcement is provided for those desired behaviors. A token economy uses *Generalized Conditioned Reinforcers* aka Tokens!\n\n## Before You Start\nIf this is the first time the student is using a token economy, it may be beneficial to first spend some time conditioning the tokens. This simply means making the tokens (located on the front of this page) valuable to the person receiving the token. Think about this, would you rather receive a blank piece of paper or a 100 dollar bill? The reason most will say the 100 dollar bill is because they have history of being able to use that 100 dollar bill to access valuable things. Therefore, the value of that bill has been established, aka conditioned. Our goal is to do the same thing with these tokens! If the tokens aren’t already valuable to the student, do one of the steps below, prior to starting the token economy.\n\n**1. Sampling:** Deliver the token, then deliver the “backup reinforcer”.\n**2. Coaching:** Prompt student to engage in a response then deliver the token.\n**3. Conditioning:** Deliver the token immediately after the target response.',
  tt:'**Teaching Targets:** This page is for selecting which behaviors you target for acquisition skills or replacement behaviors for your learner. **This page is where you choose what to teach your learner!**\n\n**Prerequisite Skills:** Ensure the learner has mastered the necessary prerequisite skills required for a new skill before working on teaching that new skill. For example, ensure that the learner can “attend” to an instructor (aka pay attention) for a designated amount of time before working on teaching academic skills that require the student to attend for an extended period and then answer complex questions.\nAnother Example: If teaching a learner how to raise their hand, select a picture, or make a gesture for attention, ensure that the learner has the physical capabilities required to make the necessary movements before attempting to teach the new skill.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the list of choices on the front of this page. If none of the options listed on the front of this board are skills that you are working on, write the name of the skill on the blank picture.\n2. Now, place the picture of the skill you would like your student to learn in the gray box on the next page under the word “First.”',
  h1:'STEP 1 : YOUR LEARNER PICKS SOMETHING TO EARN\nA **Picture Choice Board** is a board full of picture options to show your learner before starting a task, allowing them to select an item or activity to work for and earn for completing the task.\n**Prerequisite Skills:** Your learner will need to have the ability to scan an array of pictures and select a picture of an item/activity they would like to earn.\n\n__**Steps:**__\n1. Show the learner the choice board (the Choices page) and allow the learner to select an item to work for.\n***If necessary, spend some time pairing the picture of the item with the actual object.***\n2. As necessary, utilize prompting to assist the learner with their selection.\n3. Once the learner selects a picture, turn to the next page and place the picture in the Green Earned Item Box! The Green Earned Item Box is located under the word “Then.”\n\n**Note:** There are plenty of extra picture choices in the “extras book”. Also, if you don’t see an image choice that your learner wants, use the __OTHER__ image to write in the name of the item/activity. Also, be sure to conduct reinforcement assessments and additional preference assessments to ensure that the delivery of the selected item after the learner displays the skill serves as reinforcement.',
  h2:'STEP 2 : YOU SELECT WHAT TO TEACH YOUR LEARNER\n**Teaching Targets:** This page is for selecting which behaviors you target for acquisition skills or replacement behaviors for your learner. **This page is where you choose what to teach your learner!**\n\n**Prerequisite Skills:** Ensure the learner has mastered the necessary prerequisite skills required for a new skill before working on teaching that new skill. For example, ensure that the learner can “attend” to an instructor (aka pay attention) for a designated amount of time before working on teaching academic skills that require the student to attend for an extended period and then answer complex questions. Another Example: If teaching a learner how to raise their hand, select a picture, or make a gesture for attention, ensure that the learner has the physical capabilities required to make the necessary movements before attempting to teach the new skill.\n\n__**Steps:**__\n1. Select the skill you would like to teach your learner from the list of choices on the front of this page. If none of the options listed on the front of this page are skills that you are working on, write the name of the skill on the blank picture.\n2. Now, place the picture of the skill you would like your student to learn in the gray box on the next page under the word “First.”',
  h3:'STEP 3 : DELIVER TOKEN ({TOKENS}), REINFORCE BEHAVIOR\nPlace the picture of the skill you are teaching your learner under the word **FIRST**. The activity that your learner will earn should be placed under the word **THEN**.\n\n__**Tokens**__:\nThis page is where your learner will also place their earned tokens in the corresponding boxes once they have earned them. There are {n} boxes, so once your learner earns {n} tokens, they should receive the item they were working for, located under the **THEN** box.\n\n__**Not So FAST**__: Before starting, decide how long you would like your learner to display the behavior or how many responses you would like to occur before they receive a token. For example, would you like your learner to answer three problems and then receive one token or work for five minutes and then receive a token? These rules are known as the schedule of reinforcement, and it is essential to ensure that you are not requiring too much and setting the bar too high for your learner. A good rule of thumb is that when teaching a brand new skill, it’s best to initially provide a token after each desired behavior. When maintaining a skill, you can require more responses or use “time intervals” to earn the token.'
};
function blank(){return{meta:Object.assign({poss:'s',layout:'ft',avatar:'av:boy',n:'5',wm:'12',order:'all',sp_card:'ch:0',sp_size:'large'},DEF),chk:{pg_ch:true,pg_tg:true,pg_bd:true,pg_tk:true,pg_how:false,cs_ch:true,cs_tg:true,cs_tk:true},photos:[],photo:[cello()],tok:[cello('tk:star')],bg:[cello(),cello()],sp:[cello()],ch:Array.from({length:6},()=>cello()),tg:Array.from({length:6},()=>cello()),ft:[cello(),cello()],caps:[],txt:Object.assign({},TXT0)};}
let S=blank();
const nTok=()=>Math.max(3,Math.min(10,Math.round(num(S.meta.n)||5)));
function ensure(){
  if(!S.meta||typeof S.meta!=='object')S.meta={};if(!S.chk||typeof S.chk!=='object')S.chk={};if(!Array.isArray(S.photos))S.photos=[];
  const six=k=>{if(!Array.isArray(S[k]))S[k]=[];while(S[k].length<6)S[k].push(cello());S[k].length=6;};six('ch');six('tg');
  const fix=(k,n,def)=>{if(!Array.isArray(S[k])||S[k].length!==n)S[k]=def();};fix('ft',2,()=>[cello(),cello()]);fix('tok',1,()=>[cello('tk:star')]);fix('photo',1,()=>[cello()]);fix('bg',2,()=>[cello(),cello()]);fix('sp',1,()=>[cello()]);
  if(!S.txt||typeof S.txt!=='object')S.txt={};Object.keys(TXT0).forEach(k=>{if(typeof S.txt[k]!=='string')S.txt[k]=TXT0[k];});
  Object.keys(DEF).forEach(k=>{if(!/^#[0-9a-f]{6}$/i.test(S.meta[k]||''))S.meta[k]=DEF[k];});
  if(!Array.isArray(S.caps))S.caps=[];const n=nTok();if(S.caps.length!==n)S.caps=defCaps(n,tokName());
}
/* ---------------- tokens and captions ---------------- */
function defTokName(){const o=S.tok[0];if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return TOK[o.k.slice(3)].l;if(o.k&&P[o.k])return P[o.k].l;if(o.ph){const p=photo(o.ph);if(p&&p.label)return p.label;}return 'Token';}
function tokName(){return String(S.meta.tokname||'').trim()||defTokName();}
function plural(w){return /\s/.test(w)||/s$/i.test(w)?w:w+'s';}
function defCaps(n,name){const out=[];for(let i=0;i<n;i++)out.push({a:i===0?'Hurry and Get':(i%2?'Great Job':'Way To Go'),b:i===0?'Your First '+name+'!':i===1?'Keep Going!':'Just '+(n-i)+' More!'});return out;}
function recaps(all){const n=nTok(),d=defCaps(n,tokName());if(all||S.caps.length!==n){S.caps=d;return;}S.caps.forEach((c,i)=>{if(/^Your First .*!$/.test(c.b))c.b=d[i].b;});}

/* ---------------- pictures ---------------- */
function photo(id){return S.photos.find(p=>p.id===id);}
function pic(o,cls,style){if(!o)return '';const ex=style?' style="'+style+'"':'';
  if(o.ph){const p=photo(o.ph);return p?'<img class="'+(cls||'')+'" src="'+p.img+'" alt=""'+ex+'>':'';}
  if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return own(TOK[o.k.slice(3)],cls,ex);
  if(o.k&&o.k.startsWith('av:')&&AV[o.k.slice(3)])return own(AV[o.k.slice(3)],cls,ex);
  if(o.k&&P[o.k])return picto(o.k,cls||'',ex);return '';}
const has=o=>!!(o&&(o.k||o.ph));
function lbl(o){if(!o)return '';if(o.l)return o.l;if(o.ph){const p=photo(o.ph);return p?p.label:'';}if(o.k&&o.k.startsWith('tk:')&&TOK[o.k.slice(3)])return TOK[o.k.slice(3)].l;if(o.k&&o.k.startsWith('av:')&&AV[o.k.slice(3)])return AV[o.k.slice(3)].l;return o.k&&P[o.k]?P[o.k].l:'';}
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+pic(o,'')+'</span><button type="button" data-pick="1">'+(has(o)?'Change':'Choose')+'</button></div>';}
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><b>Choose a picture</b><select id="pdCat"><option value="">All</option><option value="_photos">My photos</option><option value="_own">Tokens and avatars drawn here</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button><button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' Photos are resized to thumbnails and saved inside the form’s file. The tokens and avatars are drawn in this form.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    const ownList=PICK&&PICK.first==='tok'?[['tk:',TOK],['av:',AV]]:[['av:',AV],['tk:',TOK]];
    if(!c||c==='_photos')h+=S.photos.filter(p=>!q||p.label.toLowerCase().includes(q)).map(p=>'<button type="button" data-ph="'+p.id+'"><img src="'+p.img+'" alt="">'+esc(p.label||'photo')+'<span class="pd-x" data-phdel="'+p.id+'" title="Remove this photo" role="button" style="display:block;color:#8E2A2A;font-size:10px">remove</span></button>').join('');
    if(!c||c==='_own')ownList.forEach(([pre,set])=>{h+=Object.entries(set).filter(([k,v])=>!q||v.l.toLowerCase().includes(q)).map(([k,v])=>'<button type="button" data-k="'+pre+k+'">'+own(v,'')+esc(v.l)+'</button>').join('');});
    if(c!=='_photos'&&c!=='_own')h+=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(P[k].l)+'</button>').join('');
    $('#pdGrid').innerHTML=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no library pictures are listed. Put it in the same folder as the form, or use a photo or one of the pictures drawn here.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');};
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',async e=>{const x=e.target.closest('[data-phdel]');
    if(x){e.preventDefault();e.stopPropagation();if(!(await nbhUI.confirm('Remove this photo?\nAnything using it loses the picture.',{ok:'Remove',danger:true})))return;const id=x.dataset.phdel;S.photos=S.photos.filter(p=>p.id!==id);['photo','tok','bg','sp','ch','tg','ft'].forEach(k=>S[k].forEach(o=>{if(o.ph===id)o.ph='';}));grid();renderAll();return;}
    const b=e.target.closest('button[data-k],button[data-ph]');if(!b||!PICK)return;const o=PICK.arr[PICK.i];if(b.dataset.k){o.k=b.dataset.k;o.ph='';}else{o.ph=b.dataset.ph;o.k='';}d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].k='';PICK.arr[PICK.i].ph='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  d.grid=grid;return d;}
function openPick(arr,i,done,first){PICK={arr,i,done,first};const d=pickDlg();$('#pdQ',d).value='';$('#pdCat',d).value=first==='tok'||first==='av'?'_own':'';d.grid();if(d.showModal)d.showModal();else d.setAttribute('open','');}
function addPhoto(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,480/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const p={id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),label:(file.name||'photo').replace(/\.[^.]+$/,'').slice(0,30),img:c.toDataURL('image/jpeg',0.84)};S.photos.push(p);cb(p);};im.src=r.result;};r.readAsDataURL(file);}
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;addPhoto(f,p=>{if(PICK){PICK.arr[PICK.i].ph=p.id;PICK.arr[PICK.i].k='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();PICK=null;}else renderAll();});});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>{if(r==='tok')recaps(false);renderAll();},r==='tok'?'tok':r==='photo'?'av':'');});

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});fitAll();}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

/* ---------------- the editing tables ---------------- */
function rowsTbl(k){const id=k==='ch'?'#chTbl':'#tgTbl';$(id+' tbody').innerHTML=S[k].map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell(k,i,o)+'</td><td><input data-r="'+k+'" data-i="'+i+'" data-f="l" name="'+k+'.'+i+'.l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'(empty box)')+'" aria-label="Label '+(i+1)+'"></td></tr>').join('');
  const sel=$(k==='ch'?'#chSpareSel':'#tgSpareSel'),v=sel.value;sel.innerHTML=S[k].map((o,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('');if(v)sel.value=v;}
function renderTbls(){
  rowsTbl('ch');rowsTbl('tg');
  $('#capTbl tbody').innerHTML=S.caps.map((c,i)=>'<tr><td class="num">'+(i+1)+'</td><td><input data-r="caps" data-i="'+i+'" data-f="a" name="caps.'+i+'.a" value="'+esc(c.a)+'" aria-label="Caption above slot '+(i+1)+'"></td><td><input data-r="caps" data-i="'+i+'" data-f="b" name="caps.'+i+'.b" value="'+esc(c.b)+'" aria-label="Caption below slot '+(i+1)+'"></td></tr>').join('');
  const put=(id,r,i)=>{const el=$(id);if(el)el.outerHTML=pickCell(r,i,S[r][i]).replace('class="pick"','class="pick" id="'+id.slice(1)+'"');};
  put('#phPick','photo',0);put('#tokPick','tok',0);put('#bgChPick','bg',0);put('#bgTgPick','bg',1);put('#spPick','sp',0);put('#ftFirst','ft',0);put('#ftThen','ft',1);
  const sp=$('#spCard'),v=S.meta.sp_card||'ch:0';sp.innerHTML='<optgroup label="Choices">'+S.ch.map((o,i)=>'<option value="ch:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><optgroup label="Targets">'+S.tg.map((o,i)=>'<option value="tg:'+i+'">'+(i+1)+'. '+esc(lbl(o)||'(empty)')+'</option>').join('')+'</optgroup><option value="tok">The token ('+esc(tokName())+')</option><option value="own">A card made on the spot (label and picture below)</option>';sp.value=v;if(sp.value!==v)sp.value='ch:0';
  $('#wmPct').textContent=String(Math.max(5,Math.min(25,num(S.meta.wm)||12)));
  renderSetup();
}
function renderSetup(){const m=S.meta,v=$('#setupVerdict');const nch=S.ch.filter(has).length,ntg=S.tg.filter(has).length;
  if(!m.client&&!m.first&&!nch&&!ntg){v.innerHTML='<div class="verdict v-mid"><b>Setup not started.</b> The student and the first name as it prints, the photo, the tokens; then the Choices and Targets pages.</div>';return;}
  const miss=[];if(!m.first)miss.push('the first name (the Board prints a line to write on)');if(!has(S.photo[0]))miss.push('a photo (the '+esc(lbl({k:m.avatar||'av:boy'})||'avatar').toLowerCase()+' avatar prints instead)');if(nch<6)miss.push((6-nch)+' of the six choices');if(ntg<6)miss.push((6-ntg)+' of the six targets');
  v.innerHTML='<div class="verdict '+(miss.length?'v-mid':'v-ok')+'"><b>'+(miss.length?'Still open:':'Set up.')+'</b> '+(miss.length?miss.join('; ')+'.':'')+' '+nTok()+' '+esc(plural(tokName()).toLowerCase())+' to earn; '+(m.layout==='rules'?'Rules-row':'First-Then')+' board'+(m.qr?'; QR code on every page':'; no QR code')+'.</div>';}

/* ---------------- the QR code (qrcode-generator, inlined above; type 0 = automatic, error correction M) ---------------- */
function qrSvg(url){url=String(url||'').trim();if(!url||typeof qrcode!=='function')return '';
  try{const q=qrcode(0,'M');q.addData(url);q.make();const n=q.getModuleCount(),m=2,sz=n+2*m;let d='';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+(c+m)+' '+(r+m)+'h1v1h-1z';
    return '<svg viewBox="0 0 '+sz+' '+sz+'" shape-rendering="crispEdges" data-modules="'+n+'" role="img" aria-label="QR code"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>';}catch(e){return '';}}
let QRC={url:null,svg:''};
function qrBox(){const u=String(S.meta.qr||'').trim();if(!u)return '';if(QRC.url!==u){QRC={url:u,svg:qrSvg(u)};}return QRC.svg?'<div class="qr">'+QRC.svg+'</div>':'';}

/* ---------------- the pages ---------------- */
const IN=v=>v.toFixed(3)+'in';
function pgOpen(kind,side,cls){const i=TABS.findIndex(t=>t[0]===kind),t=TABS[i];const col=S.meta[t[2]]||DEF[t[2]];
  return '<div class="pg '+side+(side==='back'?' bk':'')+(cls?' '+cls:'')+'" data-kind="'+kind+'" data-side="'+side+'"><div class="area"><div class="tab" style="top:calc('+(i*25)+'% + .04in);height:calc(25% - .08in);background:'+esc(col)+'"><span>'+t[1]+'</span></div><div class="frame" style="background:'+esc(S.meta.c_frame||DEF.c_frame)+'">';}
const pgClose='</div></div></div>';
function wmHtml(o){if(!has(o))return '';const op=Math.max(5,Math.min(25,num(S.meta.wm)||12))/100;return '<div class="wm" style="opacity:'+op+'">'+pic(o,'').replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')+'</div>';}
function cardHtml(o,size,opts){opts=opts||{};const fs=(opts.fs||size*10.4).toFixed(1);const other=opts.other;
  return '<div class="card'+(opts.ul?' ul':'')+'" style="width:'+IN(size)+';height:'+IN(size)+';font-size:'+fs+'pt"><div class="cl">'+esc(other?'Other':(lbl(o)||''))+'</div><div class="cp">'+(other?'<div class="lines"><i></i><i></i><i></i></div>':pic(o,''))+'</div></div>';}
function tokCard(size){return '<div class="card tok" style="width:'+IN(size)+';height:'+IN(size)+'"><div class="cp">'+pic(S.tok[0],'')+'</div></div>';}
function pageGrid(kind){const bg=S.bg[kind==='ch'?0:1],wm=has(bg);
  const title=kind==='ch'?'<span class="ul">What Are You Earning?</span>':'<span class="ul">First: Teaching Targets</span>';
  return pgOpen(kind,'front')+'<div class="panel'+(wm?'':' grey')+'"'+(wm?' style="background:#f3f4f6"':'')+'>'+wmHtml(bg)+'<div class="ttl">'+title+'</div><div class="grid6">'+Array.from({length:6},()=>'<div class="bx"><span class="dot"></span></div>').join('')+'</div>'+qrBox()+'</div>'+pgClose;}
function slotDims(){const n=nTok(),rows=n>5?2:1,sz=rows===1?1.75:1.5;return{n,rows,sz,card:sz-.03,park:sz+.05,h:rows*sz+(rows-1)*.1+.22};}
function stripHtml(){const d=slotDims();const per=Math.ceil(d.n/d.rows);let h='<div class="strip" style="height:'+IN(d.h)+'">';
  for(let r=0;r<d.rows;r++){h+='<div class="srow">'+S.caps.slice(r*per,(r+1)*per).map(c=>'<div class="slot'+(d.rows>1?' sm':'')+'" style="width:'+IN(d.sz)+';height:'+IN(d.sz)+'"><span class="ca">'+esc(c.a)+'</span><span class="dot"></span><span class="cb">'+esc(c.b)+'</span></div>').join('')+'</div>';}
  return h+'</div>';}
function nameTitle(){const f=String(S.meta.first||'').trim();const ap=S.meta.poss==='bare'&&/s$/i.test(f)?'’':'’s';const st=String(S.meta.setting||'').trim();
  return (f?esc(f)+ap:'<span class="blank"></span>’s')+' '+(S.meta.layout==='rules'&&st?esc(st)+' ':'')+'Chart';}
function photoHtml(side){const o=S.photo[0];const inner=has(o)?pic(o,''):(()=>{const a=S.meta.avatar||'av:boy';return pic({k:a},'');})();return '<div class="bd-photo '+side+'">'+inner+'</div>';}
function presetBox(o,cls,ul){return '<div class="bx '+cls+'">'+(has(o)?cardHtml(o,2.5,{ul}):'<span class="dot"></span>')+'</div>';}
function pageBoard(){const d=slotDims();
  let inner;
  if(S.meta.layout==='rules'){const rules=S.tg.filter(has).slice(0,5);while(rules.length<2)rules.push(S.tg[rules.length]||cello());
    const k=rules.length,rw=Math.min(1.7,(8.5-2.5-.2-(k-1)*.12)/k),rh=rw*1.41;
    inner=photoHtml('r')+'<div class="ttl sm rules" style="padding-right:1.3in"><span class="ul">'+nameTitle()+'</span></div><div class="rulesrow"><div class="rr">'+rules.map(o=>'<div class="rule" style="width:'+IN(rw)+';font-size:'+Math.max(14,Math.min(24,rw*13.5)).toFixed(1)+'pt"><div class="rl">'+esc(lbl(o))+'</div><div class="rp" style="width:'+IN(rw)+';height:'+IN(rh)+'">'+pic(o,'')+'</div></div>').join('')+'</div><div class="earn"><div class="lab">Earn</div><div class="bx green"><span class="dot"></span></div></div></div>';}
  else inner=photoHtml('l')+photoHtml('r')+'<div class="ttl sm"><span class="ul">'+nameTitle()+'</span></div><div class="ftrow"><div class="ftcol"><span class="lab">First</span>'+presetBox(S.ft[0],'grey',false)+'</div><div class="ftcol"><span class="lab">Then</span>'+presetBox(S.ft[1],'green',true)+'</div></div>';
  return pgOpen('bd','front')+'<div class="panel" style="bottom:'+IN(d.h)+'">'+inner+qrBox()+'</div>'+stripHtml()+pgClose;}
function parkRows(n){const per=n<=3?n:n<=4?2:n<=6?3:n<=8?4:5;const rows=Math.ceil(n/per);const out=[];let left=n;for(let r=0;r<rows;r++){const k=Math.min(per,Math.ceil(left/(rows-r)));out.push(k);left-=k;}return out;}
function pageTokens(){const d=slotDims(),rows=parkRows(d.n);
  return pgOpen('tk','front')+'<div class="panel"><div class="tkcorner l">'+pic(S.tok[0],'')+'</div><div class="tkcorner r">'+pic(S.tok[0],'')+'</div><div class="ttl sm"><span class="ul">Tokens!!!</span></div><div class="park">'+rows.map(k=>'<div class="prow'+(k<=3&&d.n<=6?' wide':'')+'">'+Array.from({length:k},()=>'<div class="ybx" style="width:'+IN(d.park)+';height:'+IN(d.park)+'"><span class="dot"></span></div>').join('')+'</div>').join('')+'</div><div class="foot">See Instructions On The Back</div>'+qrBox()+'</div>'+pgClose;}
const BACKT={ch:['cb','Choice Board'],tg:['tt','Teaching Targets'],bd:['tb','Token Board'],tk:['te','Token Economy']};
function inline(s){s=esc(s);return s.replace(/\*\*\*(.+?)\*\*\*/g,'<b><i>$1</i></b>').replace(/__(.+?)__/g,'<u>$1</u>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');}
function fill(t){const n=nTok(),tn=tokName();return String(t||'').replace(/\{n\}/g,WORDS[n]).replace(/\{TOKENS\}/g,plural(tn).toUpperCase()).replace(/\{tokens\}/g,plural(tn)).replace(/\{token\}/g,tn);}
function md(t){return fill(t).replace(/\r/g,'').split(/\n\s*\n/).map(p=>{p=p.trim();if(!p)return '';let h='';if(/^##\s*/.test(p)){const i=p.indexOf('\n');h='<h4>'+inline((i<0?p:p.slice(0,i)).replace(/^##\s*/,''))+'</h4>';p=i<0?'':p.slice(i+1).trim();}return h+(p?'<p>'+inline(p).replace(/\n/g,'<br>')+'</p>':'');}).join('');}
function pageBack(kind){const [key,title]=BACKT[kind];const credit=kind==='tk';
  return pgOpen(kind,'back')+'<div class="band"><div class="bttl">'+esc(title)+'</div><div class="bbody fit"'+(credit?' style="padding-bottom:.8in"':'')+'>'+md(S.txt[key])+(credit?'<div class="credit"><img src="'+(window.NBH_LOGO||'')+'" alt=""><span>'+esc(S.meta.credit||'')+'</span></div>':'')+'</div></div>'+pgClose;}
function stepHtml(key){const t=fill(S.txt[key]||'').replace(/\r/g,'');const i=t.indexOf('\n');const head=i<0?t:t.slice(0,i),body=i<0?'':t.slice(i+1);return '<div class="step">'+esc(head.trim())+'</div>'+md(body);}
function pagesHowto(){return '<div class="pg front" data-kind="how1"><div class="howto"><div class="h1">HOW TO USE</div><div class="cols"><div class="col bbody fit" style="height:6.6in">'+stepHtml('h1')+'</div><div class="col bbody fit" style="height:6.6in">'+stepHtml('h2')+'</div></div></div></div>'+
  '<div class="pg front" data-kind="how2"><div class="howto"><div class="h1">HOW TO USE</div><div class="bbody fit" style="height:6.6in;max-width:8.2in;margin:0 auto">'+stepHtml('h3')+'</div></div></div>';}
function sheetCards(kind){const list=S[kind].filter(o=>has(o)||o.l);const ul=kind==='ch';
  if(!list.length&&!true)return '';
  return '<div class="pg front" data-kind="cards-'+kind+'"><div class="cardsheet" style="grid-template-columns:repeat(4,2.5in);gap:.12in">'+list.map(o=>cardHtml(o,2.5,{ul})).join('')+cardHtml(null,2.5,{ul,other:true})+'</div></div>';}
function sheetTokens(){const d=slotDims();return '<div class="pg front" data-kind="cards-tk"><div class="cardsheet" style="grid-template-columns:repeat(5,'+IN(d.card)+');gap:.15in">'+Array.from({length:d.n},()=>tokCard(d.card)).join('')+'</div></div>';}
function spareCard(){const v=S.meta.sp_card||'ch:0';if(v==='tok')return{tok:true};if(v==='own')return{o:{k:S.sp[0].k,ph:S.sp[0].ph,l:S.meta.sp_label||''}};const m=/^(ch|tg):(\d)$/.exec(v);return{o:m?S[m[1]][+m[2]]:S.ch[0]};}
function sheetSpare(){const big=S.meta.sp_size!=='small',cols=big?5:6,sz=big?1.5:1.25,gap=.06,rows=Math.floor((10.4+gap)/(sz+gap)),c=spareCard();
  const one=c.tok?tokCard(sz):cardHtml(c.o,sz,{ul:true});
  return '<div class="pg port front" data-kind="spare"><div class="cardsheet spare" style="grid-template-columns:repeat('+cols+','+IN(sz)+');gap:'+IN(gap)+'">'+Array.from({length:cols*rows},()=>one).join('')+'</div></div>';}
function pageFront(kind){return kind==='ch'||kind==='tg'?pageGrid(kind):kind==='bd'?pageBoard():pageTokens();}
const PGNAME={ch:'Choices',tg:'Targets',bd:'Board',tk:'Tokens'};
function bookPages(){const c=S.chk,order=S.meta.order||'all';const kinds=TABS.map(t=>t[0]).filter(k=>c['pg_'+k]);const pages=[];
  const fronts=()=>kinds.forEach(k=>pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)}));
  const duplex=()=>kinds.forEach(k=>{pages.push({label:PGNAME[k]+' (front)',html:pageFront(k)});pages.push({label:PGNAME[k]+' (back: '+BACKT[k][1]+')',html:pageBack(k)});});
  const howto=()=>{if(c.pg_how){const h=pagesHowto().split('</div></div></div>');pages.push({label:'How to use, Steps 1 and 2',html:h[0]+'</div></div></div>'});pages.push({label:'How to use, Step 3',html:h[1]+'</div></div></div>'});}};
  const cards=()=>{if(c.cs_ch)pages.push({label:'Card sheet: the choices',html:sheetCards('ch')});if(c.cs_tg)pages.push({label:'Card sheet: the targets',html:sheetCards('tg')});if(c.cs_tk)pages.push({label:'Card sheet: the tokens',html:sheetTokens()});};
  if(order==='fronts')fronts();else if(order==='duplex'){duplex();howto();}else if(order==='cards')cards();else if(order==='spare')pages.push({label:'A sheet of one card (portrait)',html:sheetSpare()});else{duplex();howto();cards();}
  return pages;}
function renderOut(){
  const pages=bookPages();
  $('#book').innerHTML=pages.map((p,i)=>'<p class="pglabel">Sheet '+(i+1)+' of '+pages.length+': '+esc(p.label)+'</p>'+p.html).join('');
  const kinds=TABS.map(t=>t[0]).filter(k=>S.chk['pg_'+k]).length,order=S.meta.order||'all';
  $('#prevLine').textContent=pages.length+' sheet'+(pages.length===1?'':'s')+', '+(order==='fronts'?'the fronts only':order==='duplex'?'fronts and backs interleaved for a duplex printer (long-edge flip)':order==='cards'?'the card sheets only':order==='spare'?'one portrait sheet of a single card':'fronts and backs interleaved, then '+(S.chk.pg_how?'the how-to insert, then ':'')+'the card sheets')+'. Landscape Letter'+(order==='spare'?' except this sheet, which is portrait':'')+'; print at 100%.';
  $('#chOut').innerHTML='<div class="book">'+pageGrid('ch')+'</div>';$('#tgOut').innerHTML='<div class="book">'+pageGrid('tg')+'</div>';$('#bdOut').innerHTML='<div class="book">'+pageBoard()+'</div>';
  $('#bkOut').innerHTML='<div class="book">'+TABS.map(t=>pageBack(t[0])).join('')+pagesHowto()+'</div>';
  syncState();fitAll();
}
function fitAll(){$$('.fit').forEach(el=>{if(!el.clientHeight)return;el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize)*72/96;let guard=0;while(el.scrollHeight>el.clientHeight+1&&fs>8&&guard++<30){fs-=.5;el.style.fontSize=fs+'pt';}});}
window.addEventListener('beforeprint',fitAll);

/* ---------------- events ---------------- */
let tOut=0;function renderOutSoon(){clearTimeout(tOut);tOut=setTimeout(renderOut,180);}
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='tkState'){restoreState(el.value);return;}
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){const a=S[el.dataset.r];if(!a||!a[+el.dataset.i])return;a[+el.dataset.i][el.dataset.f]=el.value;renderOutSoon();return;}
  if(el.dataset.b!==undefined){S.txt[el.dataset.b]=el.value;renderOutSoon();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n')return;S.meta[k]=el.value;if(k==='wm')$('#wmPct').textContent=el.value;if(k==='tokname'){recaps(false);renderTbls();}renderOutSoon();}});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='tkState')return;
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderOut();return;}
  if(el.dataset.m!==undefined){const k=el.dataset.m;if(k==='n'){if(S.meta.n!==el.value){S.meta.n=el.value;ensure();recaps(true);renderAll();}return;}S.meta[k]=el.value;if(k==='sp_card'||k==='layout'||k==='avatar')renderTbls();renderOut();}});
$('#capReset').addEventListener('click',()=>{recaps(true);renderAll();});
$('#colReset').addEventListener('click',()=>{Object.assign(S.meta,DEF);renderAll();});
$('#bkReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default text of the four backs?\nYour edits to them are replaced.',{ok:'Restore',danger:true})){['tb','cb','te','tt'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#howReset').addEventListener('click',async()=>{if(await nbhUI.confirm('Restore the default how-to text?\nYour edits to the three steps are replaced.',{ok:'Restore',danger:true})){['h1','h2','h3'].forEach(k=>{S.txt[k]=TXT0[k];});renderAll();}});
$('#chClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six choices?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.ch=Array.from({length:6},()=>cello());renderAll();}});
$('#tgClear').addEventListener('click',async()=>{if(await nbhUI.confirm('Empty the six targets?\nEvery picture and label is removed.',{ok:'Empty',danger:true})){S.tg=Array.from({length:6},()=>cello());renderAll();}});
function spare(kind,sel){S.meta.sp_card=kind+':'+sel.value;S.meta.order='spare';renderAll();setView('preview');setTimeout(()=>{fitAll();window.print();},80);}
$('#chSpare').addEventListener('click',()=>spare('ch',$('#chSpareSel')));$('#tgSpare').addEventListener('click',()=>spare('tg',$('#tgSpareSel')));

/* ---------------- meta + render ---------------- */
function bindMeta(){$$('[data-m]').forEach(el=>{const k=el.dataset.m;if(S.meta[k]!==undefined&&S.meta[k]!=='')el.value=S.meta[k];else if(el.tagName==='SELECT'||el.type==='color'||el.type==='range'){S.meta[k]=el.value;}else el.value='';});
  $$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});$$('[data-b]').forEach(el=>{el.value=S.txt[el.dataset.b]||'';});$$('input[data-r="ft"]').forEach(el=>{el.value=S.ft[+el.dataset.i].l||'';});}
function syncState(){const t=$('#tkState');if(t)t.value=JSON.stringify(S);}
function restoreState(v){let d=null;try{d=JSON.parse(v);}catch(e){d=null;}const next=d&&fromFile({form:'TK-1',S:d});if(next){S=next;renderAll();}}
function renderAll(){ensure();bindMeta();renderTbls();renderOut();}

/* ---------------- printing ---------------- */
$('#printBtn').addEventListener('click',()=>{setView('preview');setTimeout(()=>{fitAll();window.print();},80);});
/* ---------------- save, load, csv, clear, sim ---------------- */
$('#saveBtn').addEventListener('click',()=>{const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'TK-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');a.download=`TK-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='TK-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]).slice(0,2000);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});Object.keys(obj('txt')).forEach(k=>{if(k in TXT0)o.txt[k]=str(s.txt[k]).slice(0,20000);});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<900000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,60).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,30),img:str(p&&p.img)})).filter(p=>p.id&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));const okK=k=>!!(P[k]||(k.startsWith('tk:')&&TOK[k.slice(3)])||(k.startsWith('av:')&&AV[k.slice(3)]));
  const arr=(k,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={k:str(x&&x.k),ph:str(x&&x.ph),l:str(x&&x.l).slice(0,60)};if(!okK(r.k))r.k='';if(!ids.has(r.ph))r.ph='';return r;}):null;
  const ch=arr('ch',6);if(ch)o.ch=ch;const tg=arr('tg',6);if(tg)o.tg=tg;const ft=arr('ft',2);if(ft&&ft.length===2)o.ft=ft;const tok=arr('tok',1);if(tok&&tok.length)o.tok=tok;const ph=arr('photo',1);if(ph&&ph.length)o.photo=ph;const bg=arr('bg',2);if(bg&&bg.length===2)o.bg=bg;const sp=arr('sp',1);if(sp&&sp.length)o.sp=sp;
  o.caps=Array.isArray(s.caps)?s.caps.slice(0,10).map(c=>({a:str(c&&c.a).slice(0,40),b:str(c&&c.b).slice(0,40)})):[];
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='TK-1'?d.form:'';const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved TK-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form TK-1. Nothing was changed.':'That file could not be read as a saved TK-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved TK-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Page','Position','Picture','Label']];S.ch.forEach((o,i)=>out.push(['Choices',i+1,o.ph?'photo':o.k,lbl(o)]));S.tg.forEach((o,i)=>out.push(['Targets',i+1,o.ph?'photo':o.k,lbl(o)]));S.ft.forEach((o,i)=>out.push(['Board',i?'Then':'First',o.ph?'photo':o.k,lbl(o)]));S.caps.forEach((c,i)=>out.push(['Token slot',i+1,c.a,c.b]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='TK-1_'+(S.meta.client||'student').replace(/[^\w-]+/g,'_')+'.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('setup');}});
async function loadSim(){if(!(await nbhUI.confirm('Load a simulated book?\nEvery page is filled with a sample student. Anything already entered will be replaced.',{ok:'Load'})))return;S=blank();
  Object.assign(S.meta,{client:'SIMULATED – Sample Student',sid:'SIM-000',grade:'2',site:'Elementary, self-contained classroom',first:'Sam',poss:'s',setting:'',layout:'ft',avatar:'av:boy',n:'5',tokname:'',qr:'https://example.org/token-board/how-to-use',credit:'',order:'all',sp_card:'ch:0',sp_size:'large'});
  S.chk.pg_how=true;
  S.ch=['ipad','puzzle','ball','bubbles','lego','drawing'].map(k=>cello(k));S.tg=['sitting','raisehand','writing','waiting','alldone','reading'].map(k=>cello(k));
  S.tg[3].l='Waiting';S.ch[0].l='Tablet';
  renderAll();setView('preview');nbhUI.toast('Simulator loaded: Sam’s book with six choices, six targets, five stars and a sample QR link.',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();

/* v21.42 the case: hooks. The Targets take the case's replacement behaviors (Form TB-1) and acquisition
   objectives (Form GB-1) when all six are empty, the Choices the reinforcer menu (Form PA-1) in its rank order;
   a label that names a library picture gets the picture. The picker adds what is ticked to the empty slots. */
function matchPicto(w){const lw=String(w||'').toLowerCase().trim();if(!lw)return '';let k=KEYS.find(k=>P[k].l.toLowerCase()===lw);if(k)return k;k=KEYS.find(k=>P[k].l.length>3&&lw.includes(P[k].l.toLowerCase()));return k||'';}
function cellFor(w){w=String(w||'').trim();return{k:matchPicto(w),ph:'',l:w.slice(0,40)};}
window.__nbhFactsIn=function(f){let n=0;const empty=a=>a.every(o=>!has(o)&&!o.l);
  if(empty(S.tg)){const words=[];(f.behaviors||[]).forEach(b=>{const w=b.isRep?b.label:b.rep;if(w&&!words.includes(w))words.push(w);});((f.goals&&f.goals.acq)||[]).forEach(g=>{if(g.beh&&!words.includes(g.beh))words.push(g.beh);});words.slice(0,6).forEach((w,i)=>{S.tg[i]=cellFor(w);n++;});}
  if(empty(S.ch)&&(f.menu||[]).length){f.menu.slice().sort((a,b)=>(a.rank==null?99:a.rank)-(b.rank==null?99:b.rank)).slice(0,6).forEach((x,i)=>{S.ch[i]=cellFor(x.name);n++;});}
  if(n)renderAll();return {filled:n,note:n?undefined:'the case holds no replacement behavior, objective or reinforcer menu yet'};};
window.__nbhFactsPick=function(sel){let n=0;const put=(a,w)=>{w=String(w||'').trim();if(!w)return false;const slot=a.find(o=>!has(o)&&!o.l);if(!slot)return false;Object.assign(slot,cellFor(w));return true;};
  (sel.behaviors||[]).forEach(b=>{if(put(S.tg,b.isRep?b.label:(b.rep||b.label)))n++;});((sel.goals&&sel.goals.acq)||[]).forEach(g=>{if(put(S.tg,g.beh))n++;});((sel.goals&&sel.goals.red)||[]).forEach(g=>{if(put(S.tg,g.beh))n++;});(sel.menu||[]).forEach(m=>{if(put(S.ch,m.name))n++;});
  renderAll();return {filled:n,note:n?'':'the six slots are full; empty one first'};};
