/* The pictures come from nbh-pictos.js, the shared pictogram library kept beside the forms (one copy serves
   Form SM-1 and Form VS-1; the one-file edition carries it once and puts it in when a form opens). Without
   the file the form still works: photos and words, no library pictures, and the picture chooser says so. */
if(!window.NBH_PICTOS){window.NBH_PICTOS={};window.NBH_PICTO_CATS={};window.NBH_PICTO_ORDER=[];window.NBH_PICTO_LICENSE='';window.picto=function(){return '';};window.NBH_PICTOS_MISSING=true;}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const n=parseFloat(String(v==null?'':v));return isFinite(n)?n:null;};
const KEYS=window.NBH_PICTO_ORDER||[],P=window.NBH_PICTOS||{},CATS=window.NBH_PICTO_CATS||{};

/* ---- v21.33: a row can be deleted anywhere. delCell() renders the x at the end of a row; rowDel() removes
   the row and re-keys whatever else refers to it by index, after a confirm when the row holds an entry. ---- */
const delCell=(r,i,what)=>'<td class="nx noprint"><button type="button" class="rowDel noprint" data-del="'+r+'" data-i="'+i+'" title="Delete this '+(what||'row')+'" aria-label="Delete '+(what||'row')+' '+(i+1)+'">&times;</button></td>';
document.addEventListener('click',e=>{const b=e.target.closest('button.rowDel[data-del]');if(!b)return;e.preventDefault();rowDel(b.dataset.del,+b.dataset.i);});

/* ---------------- state ---------------- */
const RULES0=[['safehands','Safe hands','Hands to myself and gentle with things.',1],['walkingfeet','Walking feet','In the hallway we walk.',1],['sitting','Sitting','Bottom on the chair, feet on the floor.',1],['waiting','Waiting','My turn is coming. Hands in my lap.',1],['quiet','Quiet voice','Inside voice, so everyone can work.',1],['listening','Listening ears','Eyes on the speaker, mouth quiet.',0],['raisehand','Raise my hand','Hand up and wait to be called on.',0],['askhelp','Ask for help','Hand up, or the help card.',0],['takebreak','Take a break','Use the break card, then come back.',0],['stayarea','Stay in my area','In my space until the teacher says.',0],['calm','Calm body','Still body, slow breath.',0],['eyes','Eyes on the teacher','Look at the teacher when she talks.',0],['kindwords','Kind words','Say it kindly or ask for help.',0],['lineup','Line up','Walking feet to my spot in line.',0],['cleanup','Clean up','Put things back where they go.',0],['stop','Stop','Stop and look at the adult.',0]];
const FS0=[['calmface','Calm','I am ready to learn.'],['ok','A little upset','Take three slow breaths.'],['worried','Upset','Ask for a break with my card.'],['frustrated','Very upset','Go to the calm corner; squeeze the ball.'],['angry','Too big','Get an adult. Use my words or my card.']];
function cello(k,l){return{k:k||'',ph:'',l:l||''};}
function blank(){return{meta:{},chk:{},photos:[],board:[],cards:[],rules:RULES0.map(r=>({on:!!r[3],k:r[0],ph:'',l:r[1],say:r[2]})),ft:[cello('writing','First'),cello('ipad','Then')],sched:['arrival','reading','math','snack','recess','lunch'].map(k=>cello(k)),choice:['ipad','ball','drawing','puzzle','bubbles','story'].map(k=>cello(k)),tk:[cello('sticker'),cello('ipad')],fs:FS0.map(f=>({k:f[0],ph:'',l:f[1],d:f[2]}))};}
let S=blank();
function ensure(){
  const R=Math.max(2,Math.min(5,num(S.meta.b_rows)||3)),C=Math.max(2,Math.min(6,num(S.meta.b_cols)||4));
  while(S.board.length<R*C)S.board.push(cello());if(S.board.length>R*C)S.board.length=R*C;
  if(!S.cards.length)S.cards.push({k:'',ph:'',l:'',qty:'20'});
  while(S.sched.length<2)S.sched.push(cello());const chn=num(S.meta.ch_n)||4;while(S.choice.length<chn)S.choice.push(cello());
  if(S.ft.length!==2)S.ft=[cello('','First'),cello('','Then')];if(S.tk.length!==2)S.tk=[cello(),cello()];if(S.fs.length!==5)S.fs=FS0.map(f=>({k:f[0],ph:'',l:f[1],d:f[2]}));
}
/* ---------------- pictures ---------------- */
function photo(id){return S.photos.find(p=>p.id===id);}
function pic(o,cls,style){if(!o)return '';if(o.ph){const p=photo(o.ph);return p?'<img class="'+(cls||'')+'" src="'+p.img+'" alt=""'+(style?' style="'+style+'"':'')+'>':'';}if(o.k&&P[o.k])return picto(o.k,cls||'',style?' style="'+style+'"':'');return '';}
function lbl(o){if(!o)return '';if(o.l)return o.l;if(o.ph){const p=photo(o.ph);return p?p.label:'';}return o.k&&P[o.k]?P[o.k].l:'';}
function pickCell(r,i,o){return '<div class="pick" data-r="'+r+'" data-i="'+i+'"><span class="pv">'+pic(o,'')+'</span><button type="button" data-pick="1">'+(o&&(o.k||o.ph)?'Change':'Choose')+'</button></div>';}
let PICK=null;
function pickDlg(){let d=$('#pickDlg');if(d)return d;d=document.createElement('dialog');d.id='pickDlg';
  d.innerHTML='<div class="pd-head"><b>Choose a picture</b><select id="pdCat"><option value="">All</option><option value="_photos">My photos</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select><input id="pdQ" placeholder="search" aria-label="Search pictures"><button type="button" id="pdPhoto">Upload a photo</button><button type="button" id="pdNone">No picture</button><button type="button" id="pdClose">Close</button></div><div class="pd-grid" id="pdGrid"></div><div class="pd-foot">'+esc(window.NBH_PICTO_LICENSE||'')+' Photos are resized to thumbnails and saved inside the form\'s file.</div>';
  document.body.appendChild(d);
  const grid=()=>{const c=$('#pdCat').value,q=($('#pdQ').value||'').toLowerCase();let h='';
    if(!c||c==='_photos')h+=S.photos.filter(p=>!q||p.label.toLowerCase().includes(q)).map(p=>'<button type="button" data-ph="'+p.id+'"><img src="'+p.img+'" alt="">'+esc(p.label||'photo')+'</button>').join('');
    if(c!=='_photos')h+=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<button type="button" data-k="'+k+'">'+picto(k,'')+esc(P[k].l)+'</button>').join('');
    $('#pdGrid').innerHTML=(window.NBH_PICTOS_MISSING?'<p class="hint">The picture library file <b>nbh-pictos.js</b> is not beside this form, so no pictures are listed. Put it in the same folder as the form, or use a photo.</p>':'')+(h||'<p class="hint">Nothing matches.</p>');};
  $('#pdCat',d).addEventListener('change',grid);$('#pdQ',d).addEventListener('input',grid);
  $('#pdGrid',d).addEventListener('click',e=>{const b=e.target.closest('button[data-k],button[data-ph]');if(!b||!PICK)return;const o=PICK.arr[PICK.i];if(b.dataset.k){o.k=b.dataset.k;o.ph='';}else{o.ph=b.dataset.ph;o.k='';}d.close();PICK.done();});
  $('#pdNone',d).addEventListener('click',()=>{if(PICK){PICK.arr[PICK.i].k='';PICK.arr[PICK.i].ph='';d.close();PICK.done();}});
  $('#pdClose',d).addEventListener('click',()=>d.close());
  $('#pdPhoto',d).addEventListener('click',()=>$('#photoIn').click());
  d.grid=grid;return d;}
function openPick(arr,i,done){PICK={arr,i,done};const d=pickDlg();$('#pdQ',d).value='';d.grid();if(d.showModal)d.showModal();else d.setAttribute('open','');}
function addPhoto(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),s=Math.min(1,320/Math.max(im.width,im.height));c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const p={id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),label:(file.name||'photo').replace(/\.[^.]+$/,'').slice(0,30),img:c.toDataURL('image/jpeg',0.82)};S.photos.push(p);cb(p);};im.src=r.result;};r.readAsDataURL(file);}
$('#photoIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;addPhoto(f,p=>{if(PICK){PICK.arr[PICK.i].ph=p.id;PICK.arr[PICK.i].k='';const d=$('#pickDlg');if(d&&d.open)d.close();PICK.done();PICK=null;}renderLib();});});
$('#phAdd').addEventListener('click',()=>{PICK=null;$('#photoIn').click();});
document.addEventListener('click',e=>{const b=e.target.closest('.pick button[data-pick]');if(!b)return;const g=b.parentNode,r=g.dataset.r,i=+g.dataset.i;openPick(S[r],i,()=>renderAll());});

/* ---------------- views ---------------- */
function setView(v){document.body.className=document.body.className.replace(/\bview-\S+/,'')+' view-'+v;$$('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));window.scrollTo({top:0});}
$$('#viewSeg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function curView(){const m=/view-(\w+)/.exec(document.body.className);return m?m[1]:'board';}

/* ---------------- tables ---------------- */
function renderBoardTbl(){$('#bTbl tbody').innerHTML=S.board.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('board',i,o)+'</td><td><input data-r="board" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph})||'(empty cell)')+'"></td></tr>').join('');
  const sel=$('#bFillCat');if(sel&&!sel.options.length)sel.innerHTML=Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('');}
function renderCardsTbl(){$('#cTbl tbody').innerHTML=S.cards.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('cards',i,o)+'</td><td><input data-r="cards" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph}))+'"></td><td><input data-r="cards" data-i="'+i+'" data-f="qty" value="'+esc(o.qty)+'" style="text-align:center"></td>'+delCell('cards',i,'card')+'</tr>').join('');}
function renderRulesTbl(){$('#rTbl tbody').innerHTML=S.rules.map((o,i)=>'<tr><td class="num"><input type="checkbox" data-r="rules" data-i="'+i+'" data-f="on"'+(o.on?' checked':'')+' aria-label="Rule '+(i+1)+' on"></td><td>'+pickCell('rules',i,o)+'</td><td><input data-r="rules" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'"></td><td><input data-r="rules" data-i="'+i+'" data-f="say" value="'+esc(o.say)+'"></td>'+delCell('rules',i,'rule')+'</tr>').join('');}
function renderStripTbls(){
  $('#ftFirst').outerHTML=pickCell('ft',0,S.ft[0]).replace('class="pick"','class="pick" id="ftFirst"');$('#ftThen').outerHTML=pickCell('ft',1,S.ft[1]).replace('class="pick"','class="pick" id="ftThen"');
  $('#tkPic').outerHTML=pickCell('tk',0,S.tk[0]).replace('class="pick"','class="pick" id="tkPic"');$('#tkRw').outerHTML=pickCell('tk',1,S.tk[1]).replace('class="pick"','class="pick" id="tkRw"');
  $('#scTbl tbody').innerHTML=S.sched.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('sched',i,o)+'</td><td><input data-r="sched" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph}))+'"></td>'+delCell('sched',i,'step')+'</tr>').join('');
  const n=num(S.meta.ch_n)||4;$('#chTbl tbody').innerHTML=S.choice.slice(0,n).map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('choice',i,o)+'</td><td><input data-r="choice" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'" placeholder="'+esc(lbl({k:o.k,ph:o.ph}))+'"></td></tr>').join('');
  $('#fsTbl tbody').innerHTML=S.fs.map((o,i)=>'<tr><td class="num">'+(i+1)+'</td><td>'+pickCell('fs',i,o)+'</td><td><input data-r="fs" data-i="'+i+'" data-f="l" value="'+esc(o.l)+'"></td><td><input data-r="fs" data-i="'+i+'" data-f="d" value="'+esc(o.d)+'"></td></tr>').join('');
}
function renderLib(){
  $('#photos').innerHTML=S.photos.map(p=>'<div class="ph"><img src="'+p.img+'" alt=""><input data-phl="'+p.id+'" value="'+esc(p.label)+'" aria-label="Photo label"><button type="button" data-phdel="'+p.id+'">Remove</button></div>').join('')||'<p class="hint">No photos yet. Upload a photo and it becomes a picture you can use on any visual.</p>';
  const sel=$('#libCat');if(!sel.options.length)sel.innerHTML='<option value="">All</option>'+Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('');
  const c=sel.value,q=($('#libQ').value||'').toLowerCase();
  $('#libGrid').innerHTML=KEYS.filter(k=>(!c||P[k].c===c)&&(!q||P[k].l.toLowerCase().includes(q)||k.includes(q))).map(k=>'<div class="it">'+picto(k,'')+esc(P[k].l)+'<div class="k">'+k+'</div></div>').join('');
}
$('#libCat').addEventListener('change',renderLib);$('#libQ').addEventListener('input',renderLib);
$('#photos').addEventListener('input',e=>{const i=e.target.closest('input[data-phl]');if(i){const p=photo(i.dataset.phl);if(p)p.label=i.value.slice(0,30);}});
$('#photos').addEventListener('click',async e=>{const b=e.target.closest('button[data-phdel]');if(!b)return;if(!(await nbhUI.confirm('Remove this photo?\nAny visual using it loses the picture.',{ok:'Remove',danger:true})))return;const id=b.dataset.phdel;S.photos=S.photos.filter(p=>p.id!==id);['board','cards','rules','ft','sched','choice','tk','fs'].forEach(k=>S[k].forEach(o=>{if(o.ph===id)o.ph='';}));renderAll();});

/* ---------------- outputs at true size ---------------- */
function cellHtml(o,size,opt){ /* size in inches; opt: {label:'below'|'above'|'none', dot:'yes'|'small'|'no', dim, radius, border} */
  opt=opt||{};const lab=opt.label||'below',has=!!(o&&(o.k||o.ph)),text=has?lbl(o):'';
  const fs=Math.max(.11,size/9),labH=lab==='none'||!text?0:fs*1.5,picS=size-labH-.22;
  const p=has?pic(o,'',"width:"+picS.toFixed(2)+"in;height:"+picS.toFixed(2)+"in"):'';
  const dot=opt.dot==='yes'||opt.dot==='small'?'<span class="dot" style="width:'+(opt.dot==='small'?.4:.6)+'in;height:'+(opt.dot==='small'?.4:.6)+'in"></span>':'';
  return '<div class="cell2'+(opt.dim&&has?' dim':'')+'" style="width:'+size+'in;height:'+size+'in;font-size:'+fs.toFixed(2)+'in'+(opt.radius?';border-radius:'+opt.radius:'')+(opt.border?';border-width:'+opt.border:'')+'">'+p+(labH?'<div class="lb'+(lab==='above'?' top':'')+'" style="height:'+labH.toFixed(2)+'in;line-height:'+labH.toFixed(2)+'in">'+esc(text)+'</div>':'')+dot+'</div>';
}
function renderBoard(){
  const m=S.meta,R=Math.max(2,Math.min(5,num(m.b_rows)||3)),C=Math.max(2,Math.min(6,num(m.b_cols)||4)),land=(m.b_page||'land')==='land';
  const pw=land?11:8.5,ph=land?8.5:11,inner=.5,bandH=(m.b_bandpos||'bottom')==='none'?0:.7,gap=.25,pad=.25;
  const boardW=pw-2*inner,boardH=ph-2*inner;const size=Math.min((boardW-2*pad-gap*(C-1))/C,(boardH-bandH-2*pad-gap*(R-1))/R);
  const band='<div class="band '+(m.b_bandpos||'bottom')+'" style="height:'+bandH+'in;background:'+esc(m.b_color||'#cfe3cf')+'">'+esc(m.b_title||'')+'</div>';
  const cells='<div class="cells" style="grid-template-columns:repeat('+C+','+size.toFixed(2)+'in);gap:'+gap+'in">'+S.board.slice(0,R*C).map(o=>cellHtml(o,size,{label:m.b_label||'below',dot:m.b_dot||'yes',dim:m.b_dim==='dim'})).join('')+'</div>';
  $('#boardOut').innerHTML='<div class="page" style="width:'+pw+'in;height:'+ph+'in;padding:'+inner+'in"><div class="vb" style="width:'+boardW+'in;height:'+boardH+'in">'+((m.b_bandpos||'bottom')==='top'?band+cells:bandH?cells+band:cells)+'</div></div>';
}
function renderCards(){
  const m=S.meta,size=num(m.c_size)||2,gap=m.c_cut==='no'?0:.12,pw=7.5,phh=10;const perRow=Math.floor((pw+gap)/(size+gap)),perCol=Math.floor((phh+gap)/(size+gap)),perPage=perRow*perCol;
  const list=[];S.cards.forEach(o=>{if(!(o.k||o.ph))return;const q=Math.max(0,Math.min(200,Math.round(num(o.qty)||0)));for(let i=0;i<q;i++)list.push(o);});
  const v=$('#cardsVerdict');v.innerHTML=list.length?'<div class="verdict v-ok">'+list.length+' card'+(list.length===1?'':'s')+' at '+size+' inch: '+perPage+' per page, '+Math.ceil(list.length/perPage)+' page'+(Math.ceil(list.length/perPage)===1?'':'s')+'.</div>':'<div class="verdict v-mid">Add a card with a picture and a count.</div>';
  let h='';for(let p=0;p<list.length;p+=perPage){h+='<div class="page" style="width:8.5in;height:11in;padding:.5in"><div class="cardsheet" style="grid-template-columns:repeat('+perRow+','+size+'in);gap:'+gap+'in">'+list.slice(p,p+perPage).map(o=>cellHtml(o,size,{label:m.c_label||'above',dot:'no',radius:m.c_round==='no'?'0':undefined}).replace('class="cell2"','class="cell2"'+(gap?' data-cut="1"':''))).join('')+'</div></div>';}
  $('#cardsOut').innerHTML=h;if(gap)$$('#cardsOut .cell2').forEach(c=>{c.style.outline='1px dashed #999';c.style.outlineOffset='.05in';});
}
function renderRules(){
  const m=S.meta,on=S.rules.filter(r=>r.on&&(r.k||r.ph||r.l)),sz=m.r_size||'half',what=m.r_what||'both';let h='';
  if(what!=='poster'){const dims={full:[7.5,10,1],half:[7.5,4.85,2],quarter:[3.65,4.85,4]}[sz],per=dims[2];
    for(let p=0;p<on.length;p+=per){const chunk=on.slice(p,p+per);const fs=sz==='full'?.95:sz==='half'?.62:.42,ps=sz==='full'?5:sz==='half'?2.6:1.9;
      h+='<div class="page" style="width:8.5in;height:11in;padding:.5in;display:grid;grid-template-columns:repeat('+(sz==='quarter'?2:1)+',1fr);gap:.2in;align-content:start">'+chunk.map(r=>'<div class="rule" style="width:'+dims[0]+'in;height:'+dims[1]+'in;font-size:'+fs+'in">'+pic(r,'',"width:"+ps+"in;height:"+ps+"in")+'<div class="t">'+esc(r.l)+'</div>'+(r.say?'<div class="s">'+esc(r.say)+'</div>':'')+'</div>').join('')+'</div>';}}
  if(what!=='cards'&&on.length){const rowH=Math.min(1.6,(9.2-.9)/on.length-.18);h+='<div class="page" style="width:8.5in;height:11in;padding:.5in"><div class="poster" style="width:7.5in;height:10in"><h3>'+esc(m.r_title||'Our Expectations')+'</h3>'+on.map(r=>'<div class="row" style="height:'+rowH.toFixed(2)+'in">'+pic(r,'',"width:"+(rowH-.25).toFixed(2)+"in;height:"+(rowH-.25).toFixed(2)+"in")+'<div><div class="t">'+esc(r.l)+'</div>'+(r.say?'<div class="s">'+esc(r.say)+'</div>':'')+'</div></div>').join('')+'</div></div>';}
  $('#rulesOut').innerHTML=h||'<p class="hint">Tick at least one rule.</p>';
}
function renderStrips(){
  const m=S.meta,c=S.chk;let h='';const page=(inner)=>'<div class="page" style="width:8.5in;height:11in;padding:.5in">'+inner+'</div>';
  if(c.s_ft){const w=m.ft_words!=='no';h+=page('<div class="strip" style="width:7.5in;min-height:5.2in"><div class="ttl">First, then</div><div class="rowc"><div class="col"><div class="ttl" style="font-size:.35in">First</div>'+cellHtml(S.ft[0],3,{label:w?'below':'none',dot:'yes'})+'</div><div class="arrow">&#10140;</div><div class="col"><div class="ttl" style="font-size:.35in">Then</div>'+cellHtml(S.ft[1],3,{label:w?'below':'none',dot:'yes'})+'</div></div></div>');}
  if(c.s_sched){const size=num(m.sc_size)||2,items=S.sched.filter(o=>o.k||o.ph);if(m.sc_dir==='h'){h+=page('<div class="strip" style="width:7.5in;min-height:4in"><div class="ttl">'+esc(m.sc_title||'My Schedule')+'</div><div class="rowc" style="justify-content:flex-start">'+items.map(o=>cellHtml(o,size,{label:'below',dot:'yes'})).join('')+'</div><div class="rowc" style="justify-content:flex-start"><div class="box" style="width:'+size+'in;height:.6in">Done</div></div></div>');}
    else{const perPage=Math.floor(9/(size+.2));for(let p=0;p<items.length;p+=perPage){h+=page('<div class="strip" style="width:7.5in;min-height:10in"><div class="ttl">'+esc(m.sc_title||'My Schedule')+'</div><div class="rowc" style="align-items:flex-start;justify-content:center;gap:.6in"><div class="col">'+items.slice(p,p+perPage).map(o=>cellHtml(o,size,{label:'below',dot:'yes'})).join('')+'</div><div class="donecol"><div class="ttl" style="font-size:.3in;margin-bottom:0">Done</div>'+items.slice(p,p+perPage).map(()=>'<div class="box" style="width:'+size+'in;height:'+size+'in"><span class="dot" style="position:static;transform:none;display:inline-block;width:.6in;height:.6in;border:2px solid #182e43;border-radius:50%"></span></div>').join('')+'</div></div></div>');}}}
  if(c.s_choice){const n=num(m.ch_n)||4,items=S.choice.slice(0,n),size=n>4?2.1:2.6;h+=page('<div class="strip" style="width:7.5in;min-height:6in"><div class="ttl">'+esc(m.ch_title||'I want…')+'</div><div class="rowc">'+items.map(o=>cellHtml(o,size,{label:'below',dot:'yes'})).join('')+'</div></div>');}
  if(c.s_token){const n=Math.max(1,Math.min(10,num(m.tk_n)||5)),ts=n<=5?1.25:n<=8?1.05:.9;h+=page('<div class="strip" style="width:7.5in;min-height:5.5in"><div class="ttl">'+esc(m.tk_title||'I am working for…')+'</div><div class="rowc">'+cellHtml(S.tk[1],2.6,{label:'below',dot:'yes'})+'</div><div class="rowc">'+Array.from({length:n},()=>'<div class="tok" style="width:'+ts+'in;height:'+ts+'in">'+pic(S.tk[0],'')+'</div>').join('')+'</div><div class="ttl" style="font-size:.25in;font-family:var(--sans)">'+n+' tokens, then my reward</div></div>');}
  if(c.s_wait){const n=num(m.w_n)||5,cols=['#5C9E31','#B1CC33','#FCEA2B','#F4AA41','#EA5A47'].slice(5-n);h+=page('<div class="strip" style="width:7.5in;min-height:4.4in"><div class="ttl">Wait</div><div class="rowc">'+cellHtml({k:'waiting'},3,{label:'none',dot:'no'})+'<div style="font:600 .5in var(--sans);max-width:3in;line-height:1.1">'+esc(m.w_words||'Wait. It is coming.')+'</div></div></div><div class="strip" style="width:7.5in;min-height:3.6in;margin-top:.3in"><div class="ttl">Countdown</div><div class="cdown">'+cols.map((col,i)=>'<div class="sq" style="width:1.25in;height:1.25in;background:'+col+'">'+(n-i)+'</div>').join('')+'</div><div class="ttl" style="font-size:.25in;font-family:var(--sans)">Take one away each time; at zero it is your turn.</div></div>');}
  if(c.s_scale){h+=page('<div class="scale" style="width:7.5in;height:10in"><div class="ttl" style="text-align:center;font:700 .45in var(--serif,Georgia,serif)">'+esc(m.fs_title||'How big is my feeling?')+'</div>'+S.fs.map((o,i)=>'<div class="lv"><div class="n">'+(i+1)+'</div>'+pic(o,'',"width:1.1in;height:1.1in")+'<div><div class="w">'+esc(o.l)+'</div><div class="d">'+esc(o.d)+'</div></div></div>').join('')+'</div>');}
  if(c.s_break){h+=page('<div class="rowc" style="display:flex;gap:.5in;justify-content:center;flex-wrap:wrap"><div class="rule" style="width:3.5in;height:3.5in;font-size:.55in">'+pic({k:'takebreak'},'',"width:1.9in;height:1.9in")+'<div class="t">Break, please</div></div><div class="rule" style="width:3.5in;height:3.5in;font-size:.55in">'+pic({k:'askhelp'},'',"width:1.9in;height:1.9in")+'<div class="t">Help, please</div></div><div class="rule" style="width:3.5in;height:3.5in;font-size:.55in">'+pic({k:'finished'},'',"width:1.9in;height:1.9in")+'<div class="t">All done</div></div><div class="rule" style="width:3.5in;height:3.5in;font-size:.55in">'+pic({k:'more'},'',"width:1.9in;height:1.9in")+'<div class="t">More, please</div></div></div>');}
  $('#stripsOut').innerHTML=h||'<p class="hint">Tick the visuals to print.</p>';
}
/* ---------------- events ---------------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type!=='checkbox'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.value;renderOut();return;}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;renderOut();}});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.r!==undefined&&el.dataset.f!==undefined&&el.type==='checkbox'){S[el.dataset.r][+el.dataset.i][el.dataset.f]=el.checked;renderOut();return;}
  if(el.dataset.c!==undefined){S.chk[el.dataset.c]=!!el.checked;renderOut();}
  if(el.dataset.m!==undefined){S.meta[el.dataset.m]=el.value;if(/^(b_rows|b_cols|ch_n)$/.test(el.dataset.m)){ensure();renderBoardTbl();renderStripTbls();}renderOut();}});
$('#bFill').addEventListener('click',()=>{const c=$('#bFillCat').value;const ks=KEYS.filter(k=>P[k].c===c&&!S.board.some(o=>o.k===k));let j=0;S.board.forEach(o=>{if(!(o.k||o.ph)&&j<ks.length){o.k=ks[j++];}});renderBoardTbl();renderOut();});
$('#bClear').addEventListener('click',async ()=>{if(await nbhUI.confirm('Empty every cell of the board?\nEvery symbol, photo and label on the board is removed.',{ok:'Empty',danger:true})){S.board.forEach(o=>{o.k='';o.ph='';o.l='';});renderBoardTbl();renderOut();}});
$('#cAdd').addEventListener('click',()=>{if(S.cards.length>=30)return;S.cards.push({k:'',ph:'',l:'',qty:'20'});renderCardsTbl();});
$('#cDel').addEventListener('click',()=>{if(S.cards.length<=1)return;S.cards.pop();renderCardsTbl();renderOut();});
$('#rAdd').addEventListener('click',()=>{if(S.rules.length>=24)return;S.rules.push({on:true,k:'',ph:'',l:'',say:''});renderRulesTbl();});
$('#rDel').addEventListener('click',()=>{if(S.rules.length<=1)return;S.rules.pop();renderRulesTbl();renderOut();});
$('#scAdd').addEventListener('click',()=>{if(S.sched.length>=14)return;S.sched.push(cello());renderStripTbls();});
$('#scDel').addEventListener('click',()=>{if(S.sched.length<=1)return;S.sched.pop();renderStripTbls();renderOut();});
async function rowDel(r,i){const o=S[r]&&S[r][i];if(!o||!['cards','rules','sched'].includes(r))return;
  if((o.k||o.ph||o.l||o.say)&&!(await nbhUI.confirm('Delete this row?\nWhat was entered in it is deleted.',{ok:'Delete',danger:true})))return;S[r].splice(i,1);
  if(!S[r].length)S[r].push(r==='cards'?{k:'',ph:'',l:'',qty:'20'}:r==='rules'?{on:true,k:'',ph:'',l:'',say:''}:cello());
  if(r==='cards')renderCardsTbl();else if(r==='rules')renderRulesTbl();else renderStripTbls();renderOut();}
function renderOut(){renderBoard();renderCards();renderRules();renderStrips();}
function bindMeta(){$$('[data-m]').forEach(el=>{if(S.meta[el.dataset.m]!==undefined)el.value=S.meta[el.dataset.m];else if(el.tagName==='SELECT')S.meta[el.dataset.m]=el.value;else el.value='';});$$('[data-c]').forEach(el=>{el.checked=!!S.chk[el.dataset.c];});}
function renderAll(){ensure();bindMeta();renderBoardTbl();renderCardsTbl();renderRulesTbl();renderStripTbls();renderLib();renderOut();}

/* ---------------- printing ---------------- */
$('#printBtn').addEventListener('click',()=>window.print());
$('#outPrintBtn').addEventListener('click',()=>{const v=curView();if(!['board','cards','rules','strips'].includes(v)){alert('Open the Board, Card sheets, Rule cards or Strips page, then print its visuals.');return;}
  const sec=$('section.only-'+v);sec.classList.add('vs-show');document.body.classList.add('vs-out-only');
  const orient=v==='board'?((S.meta.b_page||'land')==='land'?'landscape':'portrait'):'portrait';
  const st=document.createElement('style');st.textContent='@media print{@page{size:letter '+orient+';margin:0}}';document.head.appendChild(st);
  const off=()=>{document.body.classList.remove('vs-out-only');sec.classList.remove('vs-show');st.remove();window.removeEventListener('afterprint',off);};
  window.addEventListener('afterprint',off);setTimeout(()=>{window.print();setTimeout(off,1500);},30);});
/* ---------------- save, load, csv, clear, sim ---------------- */
$('#saveBtn').addEventListener('click',()=>{const nm=(S.meta.client||'student').replace(/[^\w-]+/g,'_');const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'VS-1',rev:'2026-10',saved:new Date().toISOString(),S},null,1)],{type:'application/json'}));
  const t=new Date(),ymd=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');a.download=`VS-1_${nm}_${ymd}.json`;document.body.appendChild(a);a.click();a.remove();});
$('#loadBtn').addEventListener('click',()=>$('#fileIn').click());
function fromFile(d){
  if(!d||typeof d!=='object'||d.form!=='VS-1'||!d.S||typeof d.S!=='object'||Array.isArray(d.S))return null;
  const s=d.S,o=blank(),str=v=>v==null||typeof v==='object'?'':String(v),obj=k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])?s[k]:{};
  Object.keys(obj('meta')).forEach(k=>{o.meta[k]=str(s.meta[k]);});Object.keys(obj('chk')).forEach(k=>{o.chk[k]=!!s.chk[k];});
  const okImg=v=>/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<600000;
  o.photos=Array.isArray(s.photos)?s.photos.slice(0,60).map(p=>({id:str(p&&p.id).slice(0,20),label:str(p&&p.label).slice(0,30),img:str(p&&p.img)})).filter(p=>p.id&&okImg(p.img)):[];
  const ids=new Set(o.photos.map(p=>p.id));
  const arr=(k,fields,n)=>Array.isArray(s[k])?s[k].slice(0,n).map(x=>{const r={};fields.forEach(f=>{r[f]=f==='on'?!!(x&&x[f]):str(x&&x[f]);});if(!P[r.k])r.k='';if(!ids.has(r.ph))r.ph='';return r;}):null;
  const b=arr('board',['k','ph','l'],30);if(b)o.board=b;const c=arr('cards',['k','ph','l','qty'],30);if(c&&c.length)o.cards=c;
  const r=arr('rules',['on','k','ph','l','say'],24);if(r&&r.length)o.rules=r;const ft=arr('ft',['k','ph','l'],2);if(ft&&ft.length===2)o.ft=ft;
  const sc=arr('sched',['k','ph','l'],14);if(sc&&sc.length)o.sched=sc;const ch=arr('choice',['k','ph','l'],6);if(ch&&ch.length)o.choice=ch;
  const tk=arr('tk',['k','ph','l'],2);if(tk&&tk.length===2)o.tk=tk;const fs=arr('fs',['k','ph','l','d'],5);if(fs&&fs.length===5)o.fs=fs;
  return o;
}
$('#fileIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{let d=null;try{d=JSON.parse(r.result);}catch(err){d=null;}
    const other=d&&typeof d==='object'&&typeof d.form==='string'&&d.form!=='VS-1'?d.form:'';const next=other?null:fromFile(d);
    if(!next){alert(other==='PACKET'?'That file is a student packet, not a saved VS-1 form; open it with Open packet. Nothing was changed.':other?'That file was saved by Form '+other+', not by Form VS-1. Nothing was changed.':'That file could not be read as a saved VS-1 form. Nothing was changed.');return;}
    const prev=S;S=next;try{renderAll();}catch(err){S=prev;renderAll();alert('That file could not be read as a saved VS-1 form. Nothing was changed.');}};
  r.readAsText(f);e.target.value='';});
$('#csvBtn').addEventListener('click',()=>{const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
  const out=[['Visual','Position','Picture','Label','Count or note']];S.board.forEach((o,i)=>out.push(['Board',i+1,o.ph?'photo':o.k,lbl(o),'']));S.cards.forEach((o,i)=>out.push(['Card',i+1,o.ph?'photo':o.k,lbl(o),o.qty]));S.rules.forEach((o,i)=>out.push(['Rule',i+1,o.ph?'photo':o.k,o.l,o.on?o.say:'(off) '+o.say]));S.sched.forEach((o,i)=>out.push(['Schedule',i+1,o.ph?'photo':o.k,lbl(o),'']));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([out.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='VS-1_visuals.csv';document.body.appendChild(a);a.click();a.remove();});
$('#clearBtn').addEventListener('click',async ()=>{if(await nbhUI.confirm('Clear every entry on this form?\nUnsaved work will be lost.',{ok:'Clear all',danger:true})){S=blank();renderAll();setView('board');}});
async function loadSim(){if(!(await nbhUI.confirm('Load a simulated set of visuals?\nEvery visual is filled with a worked example. Anything already entered will be replaced.',{ok:'Load'})))return;S=blank();
  S.meta={client:'SIMULATED – Sample Student',b_title:'NEEDS',b_bandpos:'bottom',b_color:'#cfe3cf',b_rows:'3',b_cols:'4',b_page:'land',b_dot:'yes',b_label:'below',b_dim:'full',c_size:'2',c_label:'above',c_cut:'yes',c_round:'yes',r_size:'half',r_title:'Our Classroom Expectations',r_what:'both',ft_words:'yes',sc_dir:'v',sc_size:'2',sc_title:'Sam’s Schedule',ch_title:'I want…',ch_n:'4',tk_n:'5',tk_title:'I am working for…',w_n:'5',w_words:'Wait. It is coming.',fs_title:'How big is my feeling?'};
  S.chk={s_ft:true,s_sched:true,s_choice:true,s_token:true,s_wait:true,s_scale:true,s_break:true};
  ensure();['toilet','eat','drink','walk','phone','sleep','clothes','computer','doctor','family','home','help'].forEach((k,i)=>{S.board[i]=cello(k);});
  S.cards=[{k:'writing',ph:'',l:'Writing',qty:'40'},{k:'math',ph:'',l:'Math',qty:'20'},{k:'recess',ph:'',l:'Recess',qty:'20'}];
  renderAll();setView('board');nbhUI.toast('Simulation loaded: '+'a simulated set of visuals: a NEEDS board, three card sheets, five rule cards and every strip.',{kind:'ok'});}
$('#simBtn').addEventListener('click',loadSim);
$$('.nbh-print-date').forEach(e=>e.textContent=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}));
renderAll();
