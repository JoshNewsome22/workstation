/* nbh-pictures.js (v21.62): My pictures, the practice's own picture library, made with the camera.
   One file beside the forms (the source is tools/blocks/nbh-pictures.js; the one-file edition carries it once and puts it in as
   a form opens). Forms VS-1, SM-1, TK-1 and TV-1 load it by <script src="nbh-pictures.js">; without it their pickers simply
   have no My pictures, and photos work as before.

   What it does. A photo of a real item (taken with the camera, chosen from a picture file, or pasted from the clipboard, such
   as a subject copied out of Photos) has its plain background cut away on this device (nothing leaves it), is trimmed and set
   in a square the way the library's pictograms sit in theirs, kept at 600 x 600 px with a see-through or a white ground,
   named, and saved to My pictures: a library kept in this browser (IndexedDB; localStorage where there is none), shared by
   every form and every student. A picture put on a visual is copied into that form's own saved data, as an uploaded photo is,
   so a case file carries the pictures its forms use, and a form opened from such a file adds them to My pictures here
   (absorb). The whole library can be saved to a file and opened on another device (download, importFile).

   The cut (cutout): the colour of the photo's border is taken as the background (the median of a band along the four edges;
   a border whose colour varies, or whose edges differ, is not plain, and the photo is kept whole); from the edges in, every
   pixel near that colour and close in colour to its neighbour joins the background (so the shading and the soft shadows on
   a sheet of paper go, and the item's edge, where the colour changes sharply, stops the flood); a closed-in patch of the
   paper's own colour (shaded, as it is through a hole) no larger than a quarter of the item's box is background too (the paper seen through a cup's handle);
   the edge is feathered over two pixels and the paper's share is taken out of the edge pixels' colour (no pale fringe).

   window.NBHPIC: STD, list(), all(), get(id), put(pic), rename(id,label), remove(id), on(fn), absorb(photos),
   toPhoto(pic,maxPx), process(src,opt), cutout(canvas,opt), square(canvas,opt), open(opt), manage(), buttons(list),
   exportJSON(), download(), importFile(file), mode(). A picture: {id,label,img,thumb,w,h,ground:'t'|'w',cut,made,upd}. */
(function(){
'use strict';
if(window.NBHPIC)return;
var STD=600,FILL=0.80,THUMB=112,MAXP=1400;
var DBN='nbh-pictures',ST='pics',LSK='nbh.pictures.v1';
var doc=document;
var dbP=null,readyP=null,mode=null,mem=[];
var cache=null,cacheSig='',byId={},listeners=[],chan=null,absorbing={};
function $(s,r){return (r||doc).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||doc).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function newId(){return 'm'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
function clamp(v){return v<0?0:v>255?255:Math.round(v);}

/* ---------------- the store: IndexedDB, else localStorage, else this page alone ---------------- */
function openDb(){
  if(dbP)return dbP;
  dbP=new Promise(function(res){
    var r,done=false,fin=function(v){if(!done){done=true;res(v);}};
    try{if(!window.indexedDB)return fin(null);r=indexedDB.open(DBN,1);}catch(e){return fin(null);}
    setTimeout(function(){fin(null);},5000);
    r.onupgradeneeded=function(){try{var db=r.result;if(!db.objectStoreNames.contains(ST))db.createObjectStore(ST,{keyPath:'id'});}catch(e){}};
    r.onsuccess=function(){var db=r.result;try{db.onversionchange=function(){db.close();dbP=null;};}catch(e){}fin(db);};
    r.onerror=function(){fin(null);};r.onblocked=function(){fin(null);};
  });
  return dbP;
}
function tx(kind,fn){
  return openDb().then(function(db){
    if(!db)throw new Error('no store');
    return new Promise(function(res,rej){
      var t,out;
      try{t=db.transaction(ST,kind);out=fn(t.objectStore(ST));}catch(e){return rej(e);}
      t.oncomplete=function(){res(out&&'result' in out?out.result:out);};
      t.onerror=function(){rej(t.error||(out&&out.error)||new Error('store error'));};
      t.onabort=function(){rej(t.error||(out&&out.error)||new Error('store aborted'));};
    });
  });
}
function ls(){try{var s=window.localStorage;s.setItem('nbh.pictures.t','1');s.removeItem('nbh.pictures.t');return s;}catch(e){return null;}}
function ready(){
  if(readyP)return readyP;
  readyP=openDb().then(function(db){mode=db?'idb':(ls()?'ls':'mem');return mode;},function(){mode=ls()?'ls':'mem';return mode;});
  return readyP;
}
function lsRead(){try{var a=JSON.parse(ls().getItem(LSK)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function lsWrite(a){ls().setItem(LSK,JSON.stringify(a));}
function readAll(){return ready().then(function(m){
  if(m==='idb')return tx('readonly',function(s){return s.getAll();}).then(function(r){return Array.isArray(r)?r:[];},function(){return [];});
  if(m==='ls')return lsRead();
  return mem.slice();});}
function writeOne(p){return ready().then(function(m){
  if(m==='idb')return tx('readwrite',function(s){return s.put(p);});
  if(m==='ls'){var a=lsRead().filter(function(x){return x.id!==p.id;});a.push(p);lsWrite(a);return;}
  mem=mem.filter(function(x){return x.id!==p.id;});mem.push(p);});}
function deleteOne(id){return ready().then(function(m){
  if(m==='idb')return tx('readwrite',function(s){return s.delete(id);});
  if(m==='ls'){lsWrite(lsRead().filter(function(x){return x.id!==id;}));return;}
  mem=mem.filter(function(x){return x.id!==id;});});}
function quotaErr(e){var n=e&&(e.name||''),c=e&&e.code;return n==='QuotaExceededError'||n==='NS_ERROR_DOM_QUOTA_REACHED'||c===22||c===1014;}

/* ---------------- the list every frame sees ---------------- */
function valid(p){return !!(p&&typeof p==='object'&&typeof p.id==='string'&&p.id&&/^data:image\//.test(String(p.img||'')));}
function sigOf(a){return a.map(function(p){return p.id+':'+(p.upd||p.made||0)+':'+(p.label||'');}).join('|');}
function fire(){listeners.slice().forEach(function(f){try{f(cache||[]);}catch(e){}});}
function tell(){try{if(chan)chan.postMessage({t:'change'});}catch(e){}}
function refresh(){return readAll().then(function(a){
  a=a.filter(valid);a.sort(function(x,y){return (y.made||0)-(x.made||0);});
  var s=sigOf(a),ch=s!==cacheSig;cache=a;cacheSig=s;byId={};a.forEach(function(p){byId[p.id]=p;});
  if(ch)fire();return ch;});}
try{if(window.BroadcastChannel){chan=new BroadcastChannel('nbh-pictures');chan.onmessage=function(){refresh().catch(function(){});};}}catch(e){chan=null;}
function list(){return cache?cache.slice():[];}
function all(){return refresh().then(function(){return list();},function(){return list();});}
function get(id){return byId[id]||null;}
function put(p){
  p=Object.assign({},p);if(!p.id)p.id=newId();if(!p.made)p.made=Date.now();p.upd=Date.now();p.label=String(p.label||'').slice(0,30);
  if(!valid(p))return Promise.reject(new Error('not a picture'));
  return writeOne(p).then(function(){
    cache=(cache||[]).filter(function(x){return x.id!==p.id;});cache.unshift(p);cache.sort(function(x,y){return (y.made||0)-(x.made||0);});
    byId[p.id]=p;cacheSig=sigOf(cache);fire();tell();return p;});
}
function rename(id,label){var p=byId[id];if(!p)return Promise.resolve(null);return put(Object.assign({},p,{label:String(label||'').slice(0,30)}));}
function remove(id){return deleteOne(id).then(function(){cache=(cache||[]).filter(function(x){return x.id!==id;});delete byId[id];cacheSig=sigOf(cache);fire();tell();});}
function on(fn){if(typeof fn==='function')listeners.push(fn);return function(){listeners=listeners.filter(function(f){return f!==fn;});};}

/* ---------------- pictures in and out of canvases ---------------- */
function fit(im,maxPx){
  var w=im.naturalWidth||im.videoWidth||im.width,h=im.naturalHeight||im.videoHeight||im.height;
  if(!w||!h)throw new Error('the picture has no size');
  var s=Math.min(1,(maxPx||MAXP)/Math.max(w,h)),c=doc.createElement('canvas');
  c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));
  var g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high';}catch(e){}
  g.drawImage(im,0,0,c.width,c.height);return c;
}
/* a File, a Blob, a data URL, an <img> or a canvas, as a canvas no larger than maxPx on its long side */
function loadCanvas(src,maxPx){
  return new Promise(function(res,rej){
    if(src&&src.getContext){try{res(fit(src,maxPx));}catch(e){rej(e);}return;}
    var url=typeof src==='string'?src:null,blob=url?null:src,im=new Image();
    if(!url){try{url=URL.createObjectURL(blob);}catch(e){return rej(new Error('not a picture'));}}
    var drop=function(){if(blob){try{URL.revokeObjectURL(url);}catch(e){}}};
    im.onload=function(){try{res(fit(im,maxPx));}catch(e){rej(e);}drop();};
    im.onerror=function(){drop();rej(new Error('not a picture this browser can open'));};
    im.src=url;
  });
}
function clone(c){var o=doc.createElement('canvas');o.width=c.width;o.height=c.height;o.getContext('2d',{willReadFrequently:true}).drawImage(c,0,0);return o;}
function hasAlpha(c){
  var W=c.width,H=c.height,d;try{d=c.getContext('2d').getImageData(0,0,W,H).data;}catch(e){return false;}
  var step=Math.max(4,Math.floor(d.length/4/6000)*4);
  for(var i=3;i<d.length;i+=step)if(d[i]<250)return true;
  return false;
}
function median(a){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y;});return b[b.length>>1];}
function blur3(src,dst,tmp,W,H){
  var x,y,i;
  for(y=0;y<H;y++){var o=y*W;for(x=0;x<W;x++){i=o+x;tmp[i]=(src[x>0?i-1:i]+src[i]+src[x<W-1?i+1:i])/3;}}
  for(y=0;y<H;y++){for(x=0;x<W;x++){i=y*W+x;dst[i]=(tmp[y>0?i-W:i]+tmp[i]+tmp[y<H-1?i+W:i])/3;}}
}
/* the cut: the canvas's pixels are replaced (its background made clear); returns what was found */
function cutout(c,opt){
  opt=opt||{};
  var W=c.width,H=c.height,N=W*H,g=c.getContext('2d'),id=g.getImageData(0,0,W,H),d=id.data;
  var Y=new Float32Array(N),Cr=new Float32Array(N),Cb=new Float32Array(N),i,j,x,y,k;
  for(i=0,j=0;i<N;i++,j+=4){var r=d[j],gg=d[j+1],b=d[j+2],yy=0.299*r+0.587*gg+0.114*b;Y[i]=yy;Cr[i]=r-yy;Cb[i]=b-yy;}
  /* the border's colour, and how even it is */
  var band=Math.max(2,Math.round(Math.min(W,H)*0.025)),ys=[],crs=[],cbs=[],edges=[[],[],[],[]],t;
  function take(px,py,e){var q=py*W+px;ys.push(Y[q]);crs.push(Cr[q]);cbs.push(Cb[q]);edges[e].push(q);}
  var sx=Math.max(1,Math.round(W/400)),sy=Math.max(1,Math.round(H/400));
  for(x=0;x<W;x+=sx)for(t=0;t<band;t++){take(x,t,0);take(x,H-1-t,1);}
  for(y=0;y<H;y+=sy)for(t=0;t<band;t++){take(t,y,2);take(W-1-t,y,3);}
  var ybg=median(ys),crbg=median(crs),cbbg=median(cbs),sp=0;
  for(k=0;k<ys.length;k++)sp+=Math.abs(ys[k]-ybg)*0.5+Math.abs(crs[k]-crbg)+Math.abs(cbs[k]-cbbg);
  sp/=ys.length||1;
  var emax=0;
  edges.forEach(function(E){if(!E.length)return;var ey=median(E.map(function(q){return Y[q];})),ecr=median(E.map(function(q){return Cr[q];})),ecb=median(E.map(function(q){return Cb[q];}));emax=Math.max(emax,Math.abs(ey-ybg)*0.5+Math.abs(ecr-crbg)+Math.abs(ecb-cbbg));});
  var bgR=clamp(ybg+crbg),bgB=clamp(ybg+cbbg),bgG=clamp((ybg-0.299*bgR-0.114*bgB)/0.587);
  var found={plain:sp<22&&emax<40,cut:false,bg:[bgR,bgG,bgB],spread:Math.round(sp*10)/10,edges:Math.round(emax*10)/10};
  if(!found.plain&&!opt.force)return found;
  /* from the edges in: near the background's colour, and close in colour to the neighbour it is reached from */
  var TY=opt.ty||100,TC=opt.tc||(26+sp),TL=opt.tl||(12+sp*0.6),TLC=opt.tlc||(12+sp*0.4);
  var mask=new Uint8Array(N),q=new Int32Array(N),qh=0,qt=0;
  function near(p){return Math.abs(Y[p]-ybg)<TY&&Math.abs(Cr[p]-crbg)+Math.abs(Cb[p]-cbbg)<TC;}
  function seed(p){if(!mask[p]&&near(p)){mask[p]=1;q[qt++]=p;}}
  function grow(p,n){if(!mask[n]&&near(n)&&Math.abs(Y[p]-Y[n])<TL&&Math.abs(Cr[p]-Cr[n])+Math.abs(Cb[p]-Cb[n])<TLC){mask[n]=1;q[qt++]=n;}}
  for(x=0;x<W;x++){seed(x);seed((H-1)*W+x);}
  for(y=0;y<H;y++){seed(y*W);seed(y*W+W-1);}
  while(qh<qt){var p=q[qh++];x=p%W;y=(p-x)/W;if(x>0)grow(p,p-1);if(x<W-1)grow(p,p+1);if(y>0)grow(p,p-W);if(y<H-1)grow(p,p+W);}
  /* what is left is the item */
  var minx=W,miny=H,maxx=-1,maxy=-1,cnt=0;
  for(i=0;i<N;i++)if(!mask[i]){cnt++;x=i%W;y=(i-x)/W;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}
  if(cnt<N*0.002){found.empty=true;return found;}
  var area=(maxx-minx+1)*(maxy-miny+1);
  /* the paper seen through the item: a closed-in patch of its own colour, no larger than a quarter of the item's box */
  var TH=opt.th||45,THC=opt.thc||(14+sp*0.5),seen=new Uint8Array(N),comp=q;   /* the paper in a hole is shaded, so the luma gate is wide; the chroma gate stays tight */
  function tight(p){return Math.abs(Y[p]-ybg)<TH&&Math.abs(Cr[p]-crbg)+Math.abs(Cb[p]-cbbg)<THC;}
  function reach(n,ct){if(!mask[n]&&!seen[n]&&tight(n)){seen[n]=1;comp[ct]=n;return ct+1;}return ct;}
  for(i=0;i<N;i++){
    if(mask[i]||seen[i]||!tight(i))continue;
    var ch=0,ct=1;comp[0]=i;seen[i]=1;
    while(ch<ct){var pp=comp[ch++],px=pp%W,py=(pp-px)/W;if(px>0)ct=reach(pp-1,ct);if(px<W-1)ct=reach(pp+1,ct);if(py>0)ct=reach(pp-W,ct);if(py<H-1)ct=reach(pp+W,ct);}
    if(ct>=12&&ct<=area*0.25)for(k=0;k<ct;k++)mask[comp[k]]=1;
  }
  /* the edge, feathered over about two pixels, and the paper's share taken out of each edge pixel's colour */
  var a=new Float32Array(N),a2=new Float32Array(N),tmp=new Float32Array(N);
  for(i=0;i<N;i++)a[i]=mask[i]?0:1;
  blur3(a,a2,tmp,W,H);blur3(a2,a,tmp,W,H);
  for(i=0,j=0;i<N;i++,j+=4){
    var al=a[i];al=al<=0.18?0:al>=0.82?1:(al-0.18)/0.64;
    if(al<=0){d[j+3]=0;continue;}
    if(al<1){d[j]=clamp((d[j]-(1-al)*bgR)/al);d[j+1]=clamp((d[j+1]-(1-al)*bgG)/al);d[j+2]=clamp((d[j+2]-(1-al)*bgB)/al);d[j+3]=Math.round(al*255);}
    else d[j+3]=255;
  }
  g.putImageData(id,0,0);
  found.cut=true;found.box=[minx,miny,maxx-minx+1,maxy-miny+1];return found;
}
/* the item's box: what is not clear */
function bbox(c){
  var W=c.width,H=c.height,d=c.getContext('2d').getImageData(0,0,W,H).data,minx=W,miny=H,maxx=-1,maxy=-1,x,y;
  for(y=0;y<H;y++)for(x=0;x<W;x++)if(d[(y*W+x)*4+3]>24){if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;}
  return maxx<0?[0,0,W,H]:[minx,miny,maxx-minx+1,maxy-miny+1];
}
/* the square the library keeps: the item trimmed and centred, its long side a share of the square (fill), on a clear or a white ground */
function square(c,opt){
  opt=opt||{};var box=opt.box||bbox(c),fill=opt.fill||FILL,size=opt.size||STD,out=doc.createElement('canvas');
  out.width=out.height=size;var g=out.getContext('2d');
  if(opt.ground==='w'){g.fillStyle='#fff';g.fillRect(0,0,size,size);}
  var s=size*fill/Math.max(box[2],box[3]),w=box[2]*s,h=box[3]*s;
  g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high';}catch(e){}
  g.drawImage(c,box[0],box[1],box[2],box[3],(size-w)/2,(size-h)/2,w,h);return out;
}
function thumbOf(c,ground){var th=doc.createElement('canvas');th.width=th.height=THUMB;var g=th.getContext('2d');try{g.imageSmoothingQuality='high';}catch(e){}if(ground==='w'){g.fillStyle='#fff';g.fillRect(0,0,THUMB,THUMB);}g.drawImage(c,0,0,THUMB,THUMB);return ground==='w'?th.toDataURL('image/jpeg',0.85):th.toDataURL('image/png');}
/* a photo (File, Blob, data URL, <img> or canvas) to the picture the library keeps: {img,thumb,w,h,ground,cut,plain,had,empty} */
function process(src,opt){
  opt=opt||{};
  return loadCanvas(src,MAXP).then(function(c0){
    var ground=opt.ground==='w'?'w':'t',remove=opt.remove!==false,c=clone(c0),r={plain:true,cut:false};
    if(hasAlpha(c)){r={plain:true,cut:true,had:true};}         /* its background is clear already (a subject copied out of Photos) */
    else if(remove){r=cutout(c,opt);if(!r.cut)c=clone(c0);}
    var clear=ground!=='w'&&r.cut;   /* a picture not cut is kept as a JPEG (no clear ground): its square gets a white ground */
    var sq=square(c,{ground:clear?'t':'w',fill:r.cut?FILL:1,box:r.cut?r.box:null});
    return {img:clear?sq.toDataURL('image/png'):sq.toDataURL('image/jpeg',0.9),thumb:thumbOf(sq,clear?'t':'w'),w:STD,h:STD,ground:ground,cut:!!r.cut,plain:r.plain!==false,had:!!r.had,empty:!!r.empty,bg:r.bg||null};
  });
}
/* a library picture as a form's own photo {id,label,img,lib}, no larger than maxPx (a PNG stays a PNG, so a clear ground stays
   clear), and no longer than maxChars (a form's limit on a photo): drawn smaller until it fits */
function toPhoto(pic,maxPx,maxChars){
  var base={id:'p'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),label:String(pic.label||'').slice(0,30),lib:pic.id},png=/^data:image\/png/.test(pic.img);
  var px=Math.min(maxPx||STD,pic.w||STD);
  if(px>=(pic.w||STD)&&(!maxChars||pic.img.length<=maxChars))return Promise.resolve(Object.assign(base,{img:pic.img}));
  var draw=function(at){return loadCanvas(pic.img,at).then(function(c){var img=png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',0.88);
    if(maxChars&&img.length>maxChars&&at>240)return draw(Math.round(at*0.8));return Object.assign(base,{img:img});});};
  return draw(px).catch(function(){return Object.assign(base,{img:pic.img});});
}
/* a form's photos that came from a library (lib) this browser does not hold yet go into it */
function absorb(photos){
  if(!Array.isArray(photos))return;
  photos.forEach(function(p){
    if(!p||typeof p.lib!=='string'||!p.lib||absorbing[p.lib]||byId[p.lib]||!/^data:image\//.test(String(p.img||'')))return;
    absorbing[p.lib]=1;
    all().then(function(){if(byId[p.lib])return;return loadCanvas(p.img,STD).then(function(c){var png=/^data:image\/png/.test(p.img);
      return put({id:p.lib,label:p.label||'',img:p.img,thumb:thumbOf(c,png?'t':'w'),w:c.width,h:c.height,ground:png?'t':'w',cut:png,made:Date.now(),from:'case'});});}).catch(function(){}).then(function(){delete absorbing[p.lib];});
  });
}
/* the whole library to a file and back */
function exportJSON(){return all().then(function(a){return {nbh:'my-pictures',v:1,saved:new Date().toISOString(),count:a.length,pictures:a};});}
function download(){
  return exportJSON().then(function(o){
    var b=new Blob([JSON.stringify(o)],{type:'application/json'}),u=URL.createObjectURL(b),a=doc.createElement('a');
    a.href=u;a.download='My-pictures_'+new Date().toISOString().slice(0,10)+'.json';doc.body.appendChild(a);a.click();
    setTimeout(function(){a.remove();URL.revokeObjectURL(u);},3000);return o.count;});
}
function importFile(file){
  return new Promise(function(res,rej){
    var r=new FileReader();
    r.onload=function(){var o=null;try{o=JSON.parse(String(r.result||''));}catch(e){}if(!o||o.nbh!=='my-pictures'||!Array.isArray(o.pictures))return rej(new Error('not a My pictures file'));res(o);};
    r.onerror=function(){rej(new Error('the file could not be read'));};r.readAsText(file);
  }).then(function(o){
    return all().then(function(){
      var add=o.pictures.filter(function(p){return valid(p)&&!byId[p.id];}),kept=o.pictures.length-add.length;
      return add.reduce(function(pr,p){return pr.then(function(){return put(Object.assign({},p,{thumb:p.thumb||p.img}));});},Promise.resolve()).then(function(){return {added:add.length,kept:kept};});
    });
  });
}
/* the pickers' buttons for a list of pictures (data-lib="id") */
function buttons(a){return (a||[]).map(function(p){return '<button type="button" data-lib="'+esc(p.id)+'" title="'+esc(p.label)+'"><img src="'+esc(p.thumb||p.img)+'" alt="">'+esc(p.label||'picture')+'<span class="pd-yours">my picture</span></button>';}).join('');}

/* ---------------- the dialogs ---------------- */
var CSS='dialog.nbh-pic{border:1px solid var(--rule-2,#c9ced3);border-radius:6px;padding:0;width:min(760px,96vw);max-height:92vh;font-family:var(--sans,system-ui,-apple-system,"Segoe UI",sans-serif);font-size:13px;color:#1f2a33;background:#fff;box-sizing:border-box}'+
'dialog.nbh-pic::backdrop{background:rgba(20,40,50,.45)}'+
'.nbh-pic .np-head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--rule-2,#c9ced3);position:sticky;top:0;background:#fff;z-index:1}'+
'.nbh-pic .np-head b{font-size:14px;flex:1}.nbh-pic .np-count{color:var(--ink-soft,#5a6670);font-size:12px}'+
'.nbh-pic .np-src{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px 6px}'+
'.nbh-pic .np-btn{font:inherit;font-size:12.5px;border:1px solid var(--rule-2,#c9ced3);border-radius:4px;background:#fff;padding:6px 10px;cursor:pointer;color:inherit;line-height:1.2}'+
'.nbh-pic .np-btn.np-primary{background:var(--nbh-navy,#1d4a77);color:#fff;border-color:var(--nbh-navy,#1d4a77)}.nbh-pic .np-btn:disabled{opacity:.5;cursor:default}'+
'.nbh-pic .np-hint,.nbh-pic .np-note,.nbh-pic .np-foot{margin:0;padding:4px 12px 10px;font-size:12px;color:var(--ink-soft,#5a6670);line-height:1.45}.nbh-pic .np-note:empty{display:none}.nbh-pic .np-note.np-warn{color:#8E2A2A}'+
'.nbh-pic .np-paste{margin:0 12px 10px;padding:14px;border:2px dashed var(--nbh-navy,#1d4a77);border-radius:6px;text-align:center;color:var(--nbh-navy,#1d4a77);outline:none;min-height:1.4em;caret-color:transparent}'+
'.nbh-pic .np-work{padding:0 12px 12px}.nbh-pic .np-panes{display:flex;gap:12px;flex-wrap:wrap}.nbh-pic .np-pane{flex:1 1 220px;min-width:0}'+
'.nbh-pic .np-cap{font-size:11.5px;color:var(--ink-soft,#5a6670);margin-bottom:4px}'+
'.nbh-pic .np-box{border:1px solid var(--rule-2,#c9ced3);border-radius:4px;height:220px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff}.nbh-pic .np-box img{max-width:100%;max-height:100%;display:block}'+
'.nbh-pic .np-check{background-color:#fff;background-image:linear-gradient(45deg,#e4e7ea 25%,transparent 25%),linear-gradient(-45deg,#e4e7ea 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e4e7ea 75%),linear-gradient(-45deg,transparent 75%,#e4e7ea 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}'+
'.nbh-pic .np-opts{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:10px 0}.nbh-pic .np-opts label{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;margin:0}'+
'.nbh-pic .np-opts input[type=text]{font:inherit;border:1px solid var(--rule-2,#c9ced3);border-radius:3px;padding:4px 6px;width:180px}'+
'.nbh-pic .np-act{display:flex;gap:8px;flex-wrap:wrap}.nbh-pic .np-busy{padding:16px 12px;color:var(--ink-soft,#5a6670)}'+
'.nbh-pic .np-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;padding:4px 12px 12px;overflow:auto;max-height:56vh}'+
'.nbh-pic .np-card{border:1px solid var(--rule-2,#c9ced3);border-radius:4px;padding:5px;text-align:center;background:#fff}'+
'.nbh-pic .np-thumb{height:88px;border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden}.nbh-pic .np-thumb img{max-width:100%;max-height:100%}'+
'.nbh-pic .np-card input{width:100%;box-sizing:border-box;font:inherit;font-size:11.5px;border:1px solid var(--rule-2,#c9ced3);border-radius:2px;padding:3px 4px;text-align:center;margin-top:4px}'+
'.nbh-pic .np-card button{font:inherit;font-size:11px;margin-top:4px;border:1px solid var(--rule-2,#c9ced3);border-radius:3px;background:#fff;color:#8E2A2A;cursor:pointer;padding:2px 6px}'+
'.nbh-pic .np-empty{padding:4px 12px 12px;font-size:12.5px;color:var(--ink-soft,#5a6670)}'+
'@media print{dialog.nbh-pic{display:none}}';
function css(){if($('#nbh-pictures-css'))return;var st=doc.createElement('style');st.id='nbh-pictures-css';st.textContent=CSS;doc.head.appendChild(st);}
var HINT='Put the item on a plain sheet of paper or a plain table, fill the frame with it, and keep your own shadow off it. The background is cut away here, on this device, and the picture is made square, the size of the library’s.';
var D=null,cur=null;
function dlg(){
  if(D)return D;css();
  D=doc.createElement('dialog');D.id='nbhPicDlg';D.className='nbh-pic';D.setAttribute('aria-labelledby','npTitle');
  D.innerHTML='<div class="np-head"><b id="npTitle">Add a picture to My pictures</b><button type="button" class="np-btn" id="npClose">Cancel</button></div>'+
    '<div class="np-src" id="npSrcRow"><button type="button" class="np-btn np-primary" id="npCam">Take a photo</button><button type="button" class="np-btn" id="npFile">From a picture file</button><button type="button" class="np-btn" id="npPaste">Paste a picture</button>'+
    '<input type="file" id="npCamIn" accept="image/*" capture="environment" hidden><input type="file" id="npFileIn" accept="image/*" hidden></div>'+
    '<p class="np-hint" id="npHint">'+esc(HINT)+'</p>'+
    '<div class="np-paste" id="npPasteBox" tabindex="0" contenteditable="true" hidden>Press and hold here, then Paste.</div>'+
    '<div class="np-busy" id="npBusy" hidden>Working on the picture…</div>'+
    '<div class="np-work" id="npWork" hidden><div class="np-panes"><div class="np-pane"><div class="np-cap">The photo</div><div class="np-box"><img id="npSrc" alt=""></div></div>'+
    '<div class="np-pane"><div class="np-cap">The picture</div><div class="np-box np-check"><img id="npOut" alt=""></div></div></div>'+
    '<div class="np-opts"><label><input type="checkbox" id="npCut" checked> Cut the background away</label><label><input type="radio" name="npGround" value="t" checked> See-through</label><label><input type="radio" name="npGround" value="w"> White</label>'+
    '<label>Name <input type="text" id="npName" maxlength="30" placeholder="what it is" autocomplete="off"></label></div>'+
    '<p class="np-note" id="npNote"></p>'+
    '<div class="np-act"><button type="button" class="np-btn np-primary" id="npSave">Save to My pictures</button><button type="button" class="np-btn" id="npAgain">Another photo</button></div></div>';
  doc.body.appendChild(D);
  $('#npCam',D).addEventListener('click',function(){$('#npCamIn',D).click();});
  $('#npFile',D).addEventListener('click',function(){$('#npFileIn',D).click();});
  $('#npCamIn',D).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(f)take(f,f.name);});
  $('#npFileIn',D).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(f)take(f,f.name);});
  $('#npPaste',D).addEventListener('click',pasteNow);
  D.addEventListener('paste',function(e){var f=pasted(e);if(f){e.preventDefault();take(f,'pasted picture');}});
  $('#npCut',D).addEventListener('change',redo);
  $$('input[name="npGround"]',D).forEach(function(r){r.addEventListener('change',redo);});
  $('#npSave',D).addEventListener('click',save);
  $('#npAgain',D).addEventListener('click',function(){reset();});
  $('#npClose',D).addEventListener('click',function(){finish(null);});
  D.addEventListener('close',function(){if(cur)finish(null);});
  D.addEventListener('cancel',function(e){e.preventDefault();finish(null);});
  return D;
}
function pasted(e){
  var cd=e.clipboardData;if(!cd)return null;
  var items=cd.items?Array.prototype.slice.call(cd.items):[];
  for(var i=0;i<items.length;i++){if(items[i].kind==='file'&&/^image\//.test(items[i].type)){var f=items[i].getAsFile();if(f)return f;}}
  var fs=cd.files?Array.prototype.slice.call(cd.files):[];
  for(i=0;i<fs.length;i++)if(/^image\//.test(fs[i].type))return fs[i];
  return null;
}
function pasteNow(){
  var box=$('#npPasteBox',D);
  var show=function(msg){box.hidden=false;box.textContent=msg||'Press and hold here, then Paste.';try{box.focus();}catch(e){}};
  if(navigator.clipboard&&navigator.clipboard.read){
    navigator.clipboard.read().then(function(items){
      var got=null;
      return (items||[]).reduce(function(pr,it){return pr.then(function(){if(got)return;var ty=(it.types||[]).filter(function(t){return /^image\//.test(t);})[0];if(!ty)return;return it.getType(ty).then(function(b){got=b;});});},Promise.resolve()).then(function(){
        if(got)take(got,'pasted picture');else show('No picture is on the clipboard. Copy one (in Photos, press and hold the subject, Copy Subject), then press and hold here and Paste.');});
    }).catch(function(){show();});
  }else show();
}
function reset(){
  var d=dlg();$('#npWork',d).hidden=true;$('#npBusy',d).hidden=true;$('#npSrcRow',d).hidden=false;$('#npHint',d).hidden=false;$('#npPasteBox',d).hidden=true;
  $('#npNote',d).textContent='';$('#npNote',d).className='np-note';$('#npSave',d).disabled=false;
  if(cur){cur.src=null;cur.out=null;}
}
function take(file,name){
  if(!cur)return;var d=dlg();
  $('#npSrcRow',d).hidden=true;$('#npHint',d).hidden=true;$('#npPasteBox',d).hidden=true;$('#npWork',d).hidden=true;$('#npBusy',d).hidden=false;
  loadCanvas(file,MAXP).then(function(c){
    if(!cur)return;cur.src=c;cur.srcName=name||'';
    var small=fit(c,360);$('#npSrc',d).src=small.toDataURL('image/jpeg',0.8);
    var nm=$('#npName',d);if(!nm.value)nm.value=String(name||'').replace(/\.[^.]+$/,'').replace(/^(image|img|photo|pasted picture)[\s_-]*\d*$/i,'').slice(0,30);
    return redo();
  }).catch(function(e){
    $('#npBusy',d).hidden=true;$('#npSrcRow',d).hidden=false;$('#npHint',d).hidden=false;
    var n=$('#npNote',d);n.textContent=(e&&e.message)||'That is not a picture this browser can open.';n.className='np-note np-warn';$('#npWork',d).hidden=false;
  });
}
function redo(){
  if(!cur||!cur.src)return Promise.resolve();var d=dlg(),src=cur.src;
  $('#npBusy',d).hidden=false;$('#npSave',d).disabled=true;
  var ground=($$('input[name="npGround"]',d).filter(function(r){return r.checked;})[0]||{}).value||'t',remove=$('#npCut',d).checked;
  return new Promise(function(res){setTimeout(res,20);}).then(function(){return process(src,{ground:ground,remove:remove});}).then(function(r){
    if(!cur||cur.src!==src)return;cur.out=r;cur.out.ground=ground;
    $('#npOut',d).src=r.img;var n=$('#npNote',d),cb=$('#npCut',d);n.className='np-note';
    if(r.had){n.textContent='This picture has a clear background already: it is kept as it is, made square.';cb.disabled=true;}
    else{cb.disabled=false;
      if(!remove)n.textContent='The photo is kept whole, made square.';
      else if(r.empty){n.textContent='Nothing is left when the background is cut away: the item is the colour of the sheet. Photograph it on a sheet of another colour, or untick the cut to keep the photo whole.';n.className='np-note np-warn';}
      else if(!r.plain){n.textContent='The background is not plain, so it was not cut away: the photo is kept whole. For a cut-out, photograph the item on a plain sheet of paper, or copy the subject out of Photos (press and hold it, Copy Subject) and paste it here.';n.className='np-note np-warn';}
      else n.textContent='The background was cut away. If a part of the item went with it, or some of the sheet stayed, take the photo again on a sheet of another colour, with the item filling the frame.';}
    $('#npBusy',d).hidden=true;$('#npWork',d).hidden=false;$('#npSave',d).disabled=false;
  }).catch(function(e){if(!cur)return;$('#npBusy',d).hidden=true;$('#npWork',d).hidden=false;var n=$('#npNote',d);n.textContent='The picture could not be made: '+((e&&e.message)||e);n.className='np-note np-warn';});
}
function save(){
  if(!cur||!cur.out)return;var d=dlg(),r=cur.out,label=String($('#npName',d).value||'').trim().slice(0,30)||'Picture';
  $('#npSave',d).disabled=true;
  put({id:newId(),label:label,img:r.img,thumb:r.thumb,w:r.w,h:r.h,ground:r.ground,cut:r.cut,made:Date.now()}).then(function(p){finish(p);},function(e){
    var n=$('#npNote',d);n.className='np-note np-warn';$('#npSave',d).disabled=false;
    n.textContent=quotaErr(e)?'There is no room left for pictures in this browser. Remove some from My pictures (save them to a file first), then try again.':'The picture could not be kept: '+((e&&e.message)||e);
  });
}
function finish(v){
  var c=cur;cur=null;if(D&&D.open){try{D.close();}catch(e){}}
  if(D){var nm=$('#npName',D);if(nm)nm.value='';}
  if(c&&c.res)c.res(v||null);
}
/* the Add dialog: resolves with the picture saved, or null. opt: {use:true (the button says it is used here), source:'camera'|'file'|'paste', title} */
function open(opt){
  opt=opt||{};var d=dlg();if(cur){var old=cur;cur=null;try{old.res(null);}catch(e){}}
  return new Promise(function(res){
    cur={res:res,opt:opt,src:null,out:null};reset();
    $('#npTitle',d).textContent=opt.title||'Add a picture to My pictures';$('#npSave',d).textContent=opt.use?'Save and use it here':'Save to My pictures';
    $('#npName',d).value='';
    if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}
    if(opt.source==='camera')$('#npCamIn',d).click();else if(opt.source==='file')$('#npFileIn',d).click();else if(opt.source==='paste')pasteNow();
  });
}
/* the library: every picture, with its name, Remove, the three ways in, and the file out and in */
var L=null,lres=null;
function confirmBox(text){if(window.nbhUI&&typeof window.nbhUI.confirm==='function')return Promise.resolve(window.nbhUI.confirm(text,{ok:'Remove',danger:true}));return Promise.resolve(window.confirm(text));}
function libDlg(){
  if(L)return L;css();
  L=doc.createElement('dialog');L.id='nbhPicLib';L.className='nbh-pic';L.setAttribute('aria-labelledby','nlTitle');
  L.innerHTML='<div class="np-head"><b id="nlTitle">My pictures</b><span class="np-count" id="nlCount"></span><button type="button" class="np-btn" id="nlClose">Close</button></div>'+
    '<div class="np-src"><button type="button" class="np-btn np-primary" id="nlAdd">Take a photo</button><button type="button" class="np-btn" id="nlFile">From a picture file</button><button type="button" class="np-btn" id="nlPaste">Paste a picture</button>'+
    '<button type="button" class="np-btn" id="nlExport">Save the pictures to a file</button><button type="button" class="np-btn" id="nlImport">Open a pictures file</button><input type="file" id="nlImportIn" accept="application/json,.json" hidden></div>'+
    '<p class="np-note" id="nlNote"></p><div class="np-grid" id="nlGrid"></div><p class="np-empty" id="nlEmpty" hidden>No pictures yet. Take a photo of a real item on a plain sheet of paper, and it becomes a picture every form here can use, for every student.</p>'+
    '<p class="np-foot">Kept in this browser, on this device, for every form and every student. A picture put on a visual is copied into that form’s own saved data, so a case file carries the pictures its forms use, and a case opened on another device adds them to My pictures there. Save the pictures to a file to carry the whole library to another device, or to keep it safe.</p>';
  doc.body.appendChild(L);
  var note=function(t,warn){var n=$('#nlNote',L);n.textContent=t||'';n.className='np-note'+(warn?' np-warn':'');};
  $('#nlAdd',L).addEventListener('click',function(){open({source:'camera'}).then(function(p){if(p)note('“'+p.label+'” was added.');});});
  $('#nlFile',L).addEventListener('click',function(){open({source:'file'}).then(function(p){if(p)note('“'+p.label+'” was added.');});});
  $('#nlPaste',L).addEventListener('click',function(){open({source:'paste'}).then(function(p){if(p)note('“'+p.label+'” was added.');});});
  $('#nlExport',L).addEventListener('click',function(){download().then(function(n){note(n?'Saved: a file with '+n+' picture'+(n===1?'':'s')+'. Keep it with the practice’s files; open it on another device with Open a pictures file.':'There are no pictures to save yet.');},function(e){note('The file could not be made: '+((e&&e.message)||e),true);});});
  $('#nlImport',L).addEventListener('click',function(){$('#nlImportIn',L).click();});
  $('#nlImportIn',L).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;note('Opening…');
    importFile(f).then(function(r){note(r.added+' picture'+(r.added===1?'':'s')+' added'+(r.kept?', '+r.kept+' already here':'')+'.');},function(e){note((e&&e.message)||'The file could not be opened.',true);});});
  $('#nlGrid',L).addEventListener('change',function(e){var i=e.target.closest('input[data-rename]');if(i)rename(i.dataset.rename,i.value);});
  $('#nlGrid',L).addEventListener('click',function(e){var b=e.target.closest('button[data-del]');if(!b)return;var p=byId[b.dataset.del];
    confirmBox('Remove “'+((p&&p.label)||'this picture')+'” from My pictures?\nA visual already using it keeps its copy.').then(function(ok){if(ok)remove(b.dataset.del);});});
  $('#nlClose',L).addEventListener('click',function(){L.close();});
  L.addEventListener('close',function(){var r=lres;lres=null;if(r)r();});
  on(function(){if(L&&L.open)libGrid();});
  return L;
}
function libGrid(){
  var a=list(),g=$('#nlGrid',L);
  $('#nlCount',L).textContent=a.length?a.length+' picture'+(a.length===1?'':'s'):'';$('#nlEmpty',L).hidden=!!a.length;
  g.innerHTML=a.map(function(p){return '<div class="np-card" data-id="'+esc(p.id)+'"><div class="np-thumb np-check"><img src="'+esc(p.thumb||p.img)+'" alt=""></div><input data-rename="'+esc(p.id)+'" value="'+esc(p.label)+'" maxlength="30" aria-label="Name of the picture"><button type="button" data-del="'+esc(p.id)+'">Remove</button></div>';}).join('');
}
function manage(){
  var d=libDlg();$('#nlNote',d).textContent='';libGrid();all().then(function(){libGrid();});
  return new Promise(function(res){lres=res;if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}});
}
ready().then(function(){refresh().catch(function(){});});
window.NBHPIC={STD:STD,FILL:FILL,list:list,all:all,get:get,put:put,rename:rename,remove:remove,on:on,absorb:absorb,toPhoto:toPhoto,process:process,cutout:cutout,square:square,loadCanvas:loadCanvas,open:open,manage:manage,buttons:buttons,exportJSON:exportJSON,download:download,importFile:importFile,mode:function(){return mode;},ready:ready};
})();
