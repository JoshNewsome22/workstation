/* Form TK-1, Save as video (v21.44): the walkthrough of this book, made into an MP4 on this device. Nothing leaves it.
   The walkthrough is drawn by the page itself (TKWALK.renderAt(t) sets each piece's place, size and opacity), and a page cannot
   photograph itself: Safari refuses to read back a picture of HTML (an SVG with foreignObject taints the canvas). So the stage is
   painted onto a canvas here, piece by piece, from the page's own layout: boxes (backgrounds, gradients, borders, rounded corners,
   shadows), text (each word where the page put it, in its font), pictures and the inline SVG drawings (drawn as SVG images, which
   Safari allows). Every moving piece (any element whose transform, opacity, visibility or stacking the walkthrough sets, and every
   element with a transform of its own) is painted once into a sprite of its own, and painted again only when something inside it
   changes; each frame then only places the sprites, which keeps a 3½-minute walkthrough to minutes on an iPad.
   The frames go to the browser's own H.264 encoder (WebCodecs VideoEncoder), the narration (WALK_AUDIO, each line at its cue's
   start, as the player plays it) to its AAC encoder (AudioEncoder), and both into one MP4 by mp4-muxer (tools/vendor/mp4-muxer,
   MIT licence), which tools/forms/TK-1/build.sh puts in front of this file in nbh-tk1-video.js. Without an audio encoder the video
   is made without sound (the captions are in the picture); without a video encoder the button says this browser cannot do it.
   window.TKVIDEO: make({progress, signal, width, fps, sound, until}) the MP4 as a Blob; frame(t) the painted stage at t as a canvas
   (for the checks in qa/tk1-video-test.js). */
(function(){
'use strict';
const W=window,D=document,SW=1280,SH=720;
const px=v=>parseFloat(v)||0;
const tick=()=>new Promise(r=>setTimeout(r,0));

/* ---------------- CSS values ---------------- */
/* split at the commas that are not inside brackets */
function splitTop(s){const out=[];let d=0,b=0;for(let i=0;i<s.length;i++){const c=s[i];if(c==='(')d++;else if(c===')')d--;else if(c===','&&!d){out.push(s.slice(b,i).trim());b=i+1;}}const last=s.slice(b).trim();if(last)out.push(last);return out;}
const COLOR=/^(rgba?\([^)]*\)|hsla?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}|transparent|[a-z]+)\s*/i;
function transparentC(c){return !c||c==='transparent'||/rgba\([^)]*,\s*0\s*\)$/.test(c);}
/* a length in px; a percentage of `of` */
function len(v,of){v=String(v).trim();if(v.endsWith('%'))return px(v)/100*of;return px(v);}

/* ---------------- gradients (the stage's table top) ---------------- */
function stopsOf(parts,L){const st=[];
  for(const p of parts){const m=COLOR.exec(p);if(!m)continue;const c=m[1];const rest=p.slice(m[0].length).trim();const pos=rest?rest.split(/\s+/).map(x=>len(x,L)):[];
    if(!pos.length)st.push({c,p:null});else pos.forEach(q=>st.push({c,p:q}));}
  if(!st.length)return st;if(st[0].p==null)st[0].p=0;if(st[st.length-1].p==null)st[st.length-1].p=L;
  for(let i=1;i<st.length;i++){if(st[i].p==null){let j=i;while(st[j].p==null)j++;const a=st[i-1].p,b=st[j].p;for(let k=i;k<j;k++)st[k].p=a+(b-a)*(k-i+1)/(j-i+1);}if(st[i].p<st[i-1].p)st[i].p=st[i-1].p;}
  return st;}
function addStops(g,st,L,rep){const cl=v=>Math.min(1,Math.max(0,v));
  if(!rep){st.forEach(s=>g.addColorStop(cl(s.p/L),s.c));return;}
  const a=st[0].p,per=st[st.length-1].p-a;if(per<=0){g.addColorStop(0,st[0].c);return;}
  let k0=Math.floor(-a/per)-1;for(let k=k0;a+k*per<L;k++)for(const s of st){const p=s.p+k*per;if(p>=-per&&p<=L+per)g.addColorStop(cl(p/L),s.c);}}
function gradient(ctx,img,x,y,w,h){
  const m=/^(repeating-)?(linear|radial)-gradient\(([\s\S]*)\)$/.exec(img.trim());if(!m)return false;const rep=!!m[1],parts=splitTop(m[3]);
  if(m[2]==='linear'){let ang=180;if(/^[-\d.]+(deg|turn|rad)$/.test(parts[0])){const v=px(parts[0]);ang=/turn/.test(parts[0])?v*360:/rad/.test(parts[0])?v*180/Math.PI:v;parts.shift();}
    else if(/^to /.test(parts[0])){const t=parts.shift();ang={'to top':0,'to right':90,'to bottom':180,'to left':270,'to top right':45,'to right top':45,'to bottom right':135,'to right bottom':135,'to bottom left':225,'to left bottom':225,'to top left':315,'to left top':315}[t]||180;}
    const r=ang*Math.PI/180,dx=Math.sin(r),dy=-Math.cos(r),L=Math.abs(w*dx)+Math.abs(h*dy),cx=x+w/2,cy=y+h/2;
    const g=ctx.createLinearGradient(cx-dx*L/2,cy-dy*L/2,cx+dx*L/2,cy+dy*L/2);addStops(g,stopsOf(parts,L),L,rep);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);return true;}
  /* radial: an ellipse (farthest-corner) or a circle, at a position */
  let shape='ellipse',cxp='50%',cyp='50%';if(!COLOR.test(parts[0])||/^(circle|ellipse|at |closest|farthest)/.test(parts[0])){const d=parts.shift();if(/circle/.test(d))shape='circle';const at=/at\s+(\S+)\s+(\S+)/.exec(d);if(at){cxp=at[1];cyp=at[2];}}
  const kw={left:'0%',center:'50%',right:'100%',top:'0%',bottom:'100%'};const cx=len(kw[cxp]||cxp,w),cy=len(kw[cyp]||cyp,h);
  let rx=Math.max(cx,w-cx),ry=Math.max(cy,h-cy);if(shape==='circle'){rx=ry=Math.hypot(rx,ry);}else{rx*=Math.SQRT2;ry*=Math.SQRT2;}
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x+cx,y+cy);ctx.scale(1,ry/(rx||1));
  const g=ctx.createRadialGradient(0,0,0,0,0,rx);addStops(g,stopsOf(parts,rx),rx,rep);ctx.fillStyle=g;ctx.fillRect(-cx,-cy*rx/(ry||1),w,h*rx/(ry||1));ctx.restore();return true;}

/* ---------------- rounded boxes ---------------- */
function radiiOf(cs,w,h){const one=v=>{const a=String(v).split(/\s+/);const x=len(a[0],w),y=a[1]!=null?len(a[1],h):len(a[0],h);return[x,y];};
  const r=[one(cs.borderTopLeftRadius),one(cs.borderTopRightRadius),one(cs.borderBottomRightRadius),one(cs.borderBottomLeftRadius)];
  const f=Math.min(1,w/((r[0][0]+r[1][0])||1),w/((r[3][0]+r[2][0])||1),h/((r[0][1]+r[3][1])||1),h/((r[1][1]+r[2][1])||1));
  return r.map(([x,y])=>[x*f,y*f]);}
const noRadii=r=>r.every(([x,y])=>x<=0&&y<=0);
function boxPath(ctx,x,y,w,h,r){ctx.beginPath();if(!r||noRadii(r)){ctx.rect(x,y,w,h);return;}
  const [tl,tr,br,bl]=r;ctx.moveTo(x+tl[0],y);ctx.lineTo(x+w-tr[0],y);if(tr[0]>0||tr[1]>0)ctx.ellipse(x+w-tr[0],y+tr[1],tr[0],tr[1],0,-Math.PI/2,0);
  ctx.lineTo(x+w,y+h-br[1]);if(br[0]>0||br[1]>0)ctx.ellipse(x+w-br[0],y+h-br[1],br[0],br[1],0,0,Math.PI/2);
  ctx.lineTo(x+bl[0],y+h);if(bl[0]>0||bl[1]>0)ctx.ellipse(x+bl[0],y+h-bl[1],bl[0],bl[1],0,Math.PI/2,Math.PI);
  ctx.lineTo(x,y+tl[1]);if(tl[0]>0||tl[1]>0)ctx.ellipse(x+tl[0],y+tl[1],tl[0],tl[1],0,Math.PI,Math.PI*1.5);ctx.closePath();}
const grow=(r,d)=>r.map(([x,y])=>[Math.max(0,x+d),Math.max(0,y+d)]);

/* box-shadow: "color x y blur spread [inset]", several */
function shadowsOf(v){if(!v||v==='none')return[];return splitTop(v).map(s=>{const m=COLOR.exec(s);const c=m?m[1]:'rgba(0,0,0,.5)';const rest=(m?s.slice(m[0].length):s).trim();const inset=/\binset\b/.test(rest);
  const n=rest.replace('inset','').trim().split(/\s+/).map(px);return{c,x:n[0]||0,y:n[1]||0,b:n[2]||0,s:n[3]||0,inset};});}
/* the shadow alone (the box itself drawn far away; its shadow lands here): shadow offsets are in device pixels, so they are scaled */
function shadowOnly(ctx,R,pathFn,sh){ctx.save();const F=10000;ctx.shadowColor=sh.c;ctx.shadowBlur=sh.b*R;ctx.shadowOffsetX=(sh.x+F)*R;ctx.shadowOffsetY=sh.y*R;
  ctx.translate(-F,0);pathFn();ctx.fillStyle='#000';ctx.fill();ctx.restore();}

/* ---------------- what is painted: a display list per sprite, measured in the flat state ---------------- */
const SVGNS='http://www.w3.org/2000/svg';
/* the inherited properties are written only where they differ from the parent's (a shape a <use> places takes its colours from
   the <use>, so a value written on the shape itself would win over it); the others only where they are not the default */
const SVG_INH=['fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-dashoffset','stroke-linecap','stroke-linejoin','stroke-miterlimit','visibility','font-family','font-size','font-weight','font-style','text-anchor','dominant-baseline','letter-spacing','paint-order'];
/* an inline SVG as a stand-alone SVG image: the styles the page gives it written into it, the definitions it uses from other SVGs
   of the page copied in, its size the size it is drawn at (times R, for sharp lines) */
function svgImageText(el,w,h,R){
  const cl=el.cloneNode(true);
  /* a computed url(#id) comes back as the page's address with #id: in a picture of its own only #id can be found */
  const loc=v=>v.replace(/url\(\s*["']?[^"')#]*#([^"')]+)["']?\s*\)/g,'url(#$1)');
  /* the page's styles written into a copy (its own elements, and the shapes it uses from elsewhere, which the page's stylesheet
     colours too) */
  const inline=(src,dst,top)=>{const o=[src,...src.querySelectorAll('*')],c=[dst,...dst.querySelectorAll('*')];
    for(let i=0;i<o.length;i++){const cs=getComputedStyle(o[i]),pe=o[i].parentElement,pcs=(i||!top)&&pe?getComputedStyle(pe):null;let st='';
      for(const p of SVG_INH){const v=cs.getPropertyValue(p);if(v&&(!pcs||pcs.getPropertyValue(p)!==v))st+=p+':'+loc(v)+';';}
      const op=cs.opacity;if(op&&op!=='1')st+='opacity:'+op+';';if(cs.display==='none')st+='display:none;';if(cs.mixBlendMode&&cs.mixBlendMode!=='normal')st+='mix-blend-mode:'+cs.mixBlendMode+';';
      if(o[i].tagName.toLowerCase()==='stop')st+='stop-color:'+cs.getPropertyValue('stop-color')+';stop-opacity:'+cs.getPropertyValue('stop-opacity')+';';
      if((i||!top)&&!o[i].hasAttribute('transform')&&cs.transform&&cs.transform!=='none')st+='transform:'+cs.transform+';transform-origin:'+cs.transformOrigin+';transform-box:'+cs.transformBox+';';
      c[i].setAttribute('style',st);}};
  inline(el,cl,true);
  /* the definitions it points at that live elsewhere in the page */
  const have=new Set([...cl.querySelectorAll('[id]')].map(e=>e.id));const defs=D.createElementNS(SVGNS,'defs');
  const refsIn=node=>{const ids=[];for(const e of [node,...node.querySelectorAll('*')])for(const a of e.attributes){const re=/url\(\s*["']?[^"')#]*#([^"')\s]+)["']?\s*\)|^#(.+)$/g;let m;const v=a.value;while((m=re.exec(v)))ids.push(m[1]||m[2]);}return ids;};
  let todo=refsIn(cl);while(todo.length){const id=todo.pop();if(have.has(id))continue;have.add(id);const src=D.getElementById(id);if(!src)continue;const cp=src.cloneNode(true);inline(src,cp,false);defs.appendChild(cp);todo=todo.concat(refsIn(cp));}
  if(defs.childNodes.length)cl.insertBefore(defs,cl.firstChild);
  if(!cl.hasAttribute('viewBox')){const vb=el.viewBox&&el.viewBox.baseVal;cl.setAttribute('viewBox',vb&&vb.width?vb.x+' '+vb.y+' '+vb.width+' '+vb.height:'0 0 '+w+' '+h);}
  cl.setAttribute('width',Math.max(1,Math.round(w*R)));cl.setAttribute('height',Math.max(1,Math.round(h*R)));cl.setAttribute('xmlns',SVGNS);cl.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  cl.removeAttribute('class');const cs=getComputedStyle(el);cl.style.overflow=cs.overflow==='visible'?'visible':'hidden';
  return new XMLSerializer().serializeToString(cl);}
const SVGCACHE=new Map();
function svgImage(text){let p=SVGCACHE.get(text);if(p)return p;
  p=new Promise(ok=>{const u=URL.createObjectURL(new Blob([text],{type:'image/svg+xml'}));const i=new Image();i.onload=()=>{const d=i.decode?i.decode().catch(()=>{}):Promise.resolve();d.then(()=>{URL.revokeObjectURL(u);ok(i);});};i.onerror=()=>{URL.revokeObjectURL(u);ok(null);};i.src=u;});
  if(SVGCACHE.size>400)SVGCACHE.clear();SVGCACHE.set(text,p);return p;}

/* the page's own zoom (the form fits itself to the screen with CSS zoom): measured boxes come zoomed, sizes and fonts do not,
   so every measurement is divided by it (set by each measuring pass) */
let ZF=1;
/* the text of one text node, word by word where the page set each word */
function textOps(node,cs,base,ops){const s=node.nodeValue;if(!/\S/.test(s))return;
  const tt=cs.textTransform,tx=w=>tt==='uppercase'?w.toUpperCase():tt==='lowercase'?w.toLowerCase():tt==='capitalize'?w.replace(/(^|\s)\S/g,c=>c.toUpperCase()):w;
  const font=cs.fontStyle+' '+(cs.fontVariant==='small-caps'?'small-caps ':'')+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
  const deco=decoOf(node.parentElement);const r=D.createRange();const re=/\S+/g;let m;const words=[];
  while((m=re.exec(s))){r.setStart(node,m.index);r.setEnd(node,m.index+m[0].length);const rs=r.getClientRects();
    if(rs.length===1){const q=rs[0];if(q.width>0)words.push({t:tx(m[0]),x:(q.left-base.left)/ZF,y:(q.top-base.top)/ZF,w:q.width/ZF,h:q.height/ZF});}
    else{/* a word the page broke (or set letter by letter): one rectangle per piece, the letters spread over them */
      let i0=m.index;for(let i=m.index;i<m.index+m[0].length;i++){r.setStart(node,i);r.setEnd(node,i+1);const q=r.getClientRects()[0];if(q&&q.width>0)words.push({t:tx(s[i]),x:(q.left-base.left)/ZF,y:(q.top-base.top)/ZF,w:q.width/ZF,h:q.height/ZF});}}}
  if(!words.length)return;
  ops.push({k:'text',font,color:cs.color,ls:cs.letterSpacing==='normal'?0:px(cs.letterSpacing),words,shadow:cs.textShadow!=='none'?shadowsOf(cs.textShadow)[0]:null,deco});
  if(deco){r.selectNodeContents(node);for(const q of r.getClientRects())if(q.width>0)ops.push({k:'deco',x:(q.left-base.left)/ZF,y:(q.top-base.top)/ZF,w:q.width/ZF,h:q.height/ZF,deco,font});}}
/* an underline set on this element or on one around it in the same block (text decoration passes to the text inside) */
function decoOf(el){for(let e=el,n=0;e&&n<6;e=e.parentElement,n++){const cs=getComputedStyle(e);if(/underline/.test(cs.textDecorationLine))return{c:cs.textDecorationColor||cs.color,th:cs.textDecorationThickness,off:cs.textUnderlineOffset,fs:px(cs.fontSize)};
  if(cs.display!=='inline'&&cs.display!=='inline-block')break;}return null;}

/* the display list of one sprite: its root and everything inside that is not a sprite of its own */
function listOf(root,isRoot,R){const base=root.getBoundingClientRect(),ops=[];
  const rel=q=>({x:(q.left-base.left)/ZF,y:(q.top-base.top)/ZF,w:q.width/ZF,h:q.height/ZF});
  const walk=(el,first)=>{
    if(!first&&isRoot(el))return;
    const cs=getComputedStyle(el);if(cs.display==='none')return;
    const vis=cs.visibility!=='hidden'&&cs.visibility!=='collapse';
    const op=first?1:px(cs.opacity===''?1:cs.opacity);if(op<=0.001)return;
    const flt=cs.filter&&cs.filter!=='none'?cs.filter:'';
    const grp=op<0.999||flt;if(grp)ops.push({k:'grp',op,flt,bg:cs.backgroundColor});
    const r=rel(el.getBoundingClientRect());
    if(vis&&r.w>0&&r.h>0){const rad=radiiOf(cs,r.w,r.h);
      /* the first shadow listed is the one on top: drawn last */
      const sh=shadowsOf(cs.boxShadow).reverse();for(const s of sh)if(!s.inset)ops.push({k:'shadow',r,rad,s});
      if(!transparentC(cs.backgroundColor))ops.push({k:'bg',r,rad,c:cs.backgroundColor});
      if(cs.backgroundImage&&cs.backgroundImage!=='none')splitTop(cs.backgroundImage).reverse().forEach(g=>ops.push({k:'grad',r,rad,g}));
      for(const s of sh)if(s.inset)ops.push({k:'ishadow',r,rad,s});
      const bw=[px(cs.borderTopWidth),px(cs.borderRightWidth),px(cs.borderBottomWidth),px(cs.borderLeftWidth)];
      if(bw.some(v=>v>0)){const bc=[cs.borderTopColor,cs.borderRightColor,cs.borderBottomColor,cs.borderLeftColor],bs=[cs.borderTopStyle,cs.borderRightStyle,cs.borderBottomStyle,cs.borderLeftStyle];
        ops.push({k:'border',r,rad,bw,bc,bs});}
      if(el.tagName==='IMG'&&el.complete&&el.naturalWidth)ops.push({k:'img',el,r:contentBox(r,cs),fit:cs.objectFit,pos:cs.objectPosition,rad});
      else if(el.tagName==='CANVAS')ops.push({k:'img',el,r:contentBox(r,cs),fit:'fill',pos:'50% 50%',rad});}
    for(const ps of ['::before','::after'])pseudoOps(el,ps,r,ops);
    /* an SVG is written out here, in the flat state (shown, as it is when it shows) */
    if(el.namespaceURI===SVGNS){if(vis&&el.tagName.toLowerCase()==='svg'&&r.w>0&&r.h>0)ops.push({k:'svg',text:svgImageText(el,r.w,r.h,R||1),r});if(grp)ops.push({k:'end'});return;}
    const clip=!first&&cs.overflow!=='visible'&&cs.overflowX!=='visible';if(clip)ops.push({k:'clip',r,rad:radiiOf(cs,r.w,r.h)});
    for(const n of el.childNodes){if(n.nodeType===3){if(vis)textOps(n,cs,base,ops);}else if(n.nodeType===1)walk(n,false);}
    if(clip)ops.push({k:'unclip'});if(grp)ops.push({k:'end'});};
  walk(root,true);
  return {ops,w:base.width/ZF,h:base.height/ZF};}
function contentBox(r,cs){const l=px(cs.borderLeftWidth)+px(cs.paddingLeft),t=px(cs.borderTopWidth)+px(cs.paddingTop),rr=px(cs.borderRightWidth)+px(cs.paddingRight),b=px(cs.borderBottomWidth)+px(cs.paddingBottom);return{x:r.x+l,y:r.y+t,w:Math.max(0,r.w-l-rr),h:Math.max(0,r.h-t-b)};}
/* ::before and ::after drawn as boxes (the speech bubble's tail is one: a box of no size with borders) */
function pseudoOps(el,ps,r,ops){const cs=getComputedStyle(el,ps);const ct=cs.content;if(!ct||ct==='none'||ct==='normal'||cs.display==='none')return;
  if(cs.position!=='absolute')return;/* only the absolutely placed ones are drawn: a pseudo box in the flow has no measurable place */
  const bw=[px(cs.borderTopWidth),px(cs.borderRightWidth),px(cs.borderBottomWidth),px(cs.borderLeftWidth)];
  const w=px(cs.width)+px(cs.paddingLeft)+px(cs.paddingRight)+bw[1]+bw[3],h=px(cs.height)+px(cs.paddingTop)+px(cs.paddingBottom)+bw[0]+bw[2];
  const pcs=getComputedStyle(el),pl=r.x+px(pcs.borderLeftWidth),pt=r.y+px(pcs.borderTopWidth),pw=r.w-px(pcs.borderLeftWidth)-px(pcs.borderRightWidth),ph=r.h-px(pcs.borderTopWidth)-px(pcs.borderBottomWidth);
  const x=cs.left!=='auto'?pl+px(cs.left)+px(cs.marginLeft):pl+pw-px(cs.right)-w-px(cs.marginRight),y=cs.top!=='auto'?pt+px(cs.top)+px(cs.marginTop):pt+ph-px(cs.bottom)-h-px(cs.marginBottom);
  const q={x,y,w,h},rad=radiiOf(cs,w,h);
  if(!transparentC(cs.backgroundColor))ops.push({k:'bg',r:q,rad,c:cs.backgroundColor});
  if(bw.some(v=>v>0))ops.push({k:'border',r:q,rad,bw,bc:[cs.borderTopColor,cs.borderRightColor,cs.borderBottomColor,cs.borderLeftColor],bs:[cs.borderTopStyle,cs.borderRightStyle,cs.borderBottomStyle,cs.borderLeftStyle]});}

/* how far the drawing reaches out of the root's box (shadows, overflow) */
function boundsOf(L){let x0=0,y0=0,x1=L.w,y1=L.h;const add=(x,y,w,h)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+w);y1=Math.max(y1,y+h);};
  for(const o of L.ops){if(o.r)add(o.r.x,o.r.y,o.r.w,o.r.h);if(o.k==='shadow'){const e=o.s.b+Math.abs(o.s.s);add(o.r.x+o.s.x-e,o.r.y+o.s.y-e,o.r.w+2*e,o.r.h+2*e);}
    if(o.words)for(const w of o.words)add(w.x-4,w.y-4,w.w+8,w.h+8);if(o.k==='grp'&&o.flt){const b=/blur\(([\d.]+)px\)/.exec(o.flt);if(b){const e=3*px(b[1]);x0-=e;y0-=e;x1+=e;y1+=e;}const ds=/drop-shadow\(([^)]*\)[^)]*)\)/.exec(o.flt);if(ds){x0-=30;y0-=30;x1+=30;y1+=30;}}}
  return{x:Math.floor(x0),y:Math.floor(y0),w:Math.ceil(x1-x0)+1,h:Math.ceil(y1-y0)+1};}

/* ---------------- painting a display list ---------------- */
async function paint(L,R){
  const b=boundsOf(L);let k=R;const big=Math.max(b.w,b.h)*k;if(big>4096)k*=4096/big;
  const cv=D.createElement('canvas');cv.width=Math.max(1,Math.ceil(b.w*k));cv.height=Math.max(1,Math.ceil(b.h*k));
  /* the SVG drawings first: they load as images */
  const svgs=L.ops.filter(o=>o.k==='svg');await Promise.all(svgs.map(async o=>{o.img=await svgImage(o.text);}));
  const stack=[];let ctx=cv.getContext('2d');ctx.setTransform(k,0,0,k,-b.x*k,-b.y*k);ctx.imageSmoothingQuality='high';
  const group=()=>{const c=D.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d');g.setTransform(k,0,0,k,-b.x*k,-b.y*k);g.imageSmoothingQuality='high';return{c,g};};
  for(const o of L.ops){
    switch(o.k){
    case 'grp':{const G=group();stack.push({ctx,G,o});ctx=G.g;break;}
    case 'end':{const top=stack.pop();if(!top)break;ctx=top.ctx;const {o:go,G}=top;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha*=go.op;
      const bl=/blur\(([\d.]+)px\)/.exec(go.flt||''),ds=/drop-shadow\((.*)\)/.exec(go.flt||'');
      if(bl){/* blur: the group's own picture, drawn soft (with canvas filters where there are some, else as its shadow) */
        if('filter' in ctx){ctx.filter='blur('+px(bl[1])*k+'px)';ctx.drawImage(G.c,0,0);}
        else{const F=cv.width+50;ctx.shadowColor=transparentC(go.bg)?'rgba(0,0,0,.35)':go.bg;ctx.shadowBlur=2*px(bl[1])*k;ctx.shadowOffsetX=F;ctx.drawImage(G.c,-F,0);}}
      else{if(ds){const s=shadowsOf(ds[1].replace(/^(.*?\))\s*(.*)$/,'$1 $2'))[0];if(s){ctx.shadowColor=s.c;ctx.shadowBlur=s.b*k;ctx.shadowOffsetX=s.x*k;ctx.shadowOffsetY=s.y*k;}}ctx.drawImage(G.c,0,0);}
      ctx.restore();break;}
    case 'shadow':{/* an outer shadow shows only outside its box (CSS never draws it under the box) */
      const s=o.s,q=o.r;ctx.save();ctx.beginPath();const E=s.b*2+Math.abs(s.s)+Math.abs(s.x)+Math.abs(s.y)+20;ctx.rect(q.x-E,q.y-E,q.w+2*E,q.h+2*E);
      const r=o.rad;ctx.moveTo(q.x+r[0][0],q.y);ctx.ellipse(q.x+r[0][0],q.y+r[0][1],r[0][0]||.01,r[0][1]||.01,0,-Math.PI/2,-Math.PI,true);ctx.lineTo(q.x,q.y+q.h-r[3][1]);ctx.ellipse(q.x+r[3][0],q.y+q.h-r[3][1],r[3][0]||.01,r[3][1]||.01,0,Math.PI,Math.PI/2,true);
      ctx.lineTo(q.x+q.w-r[2][0],q.y+q.h);ctx.ellipse(q.x+q.w-r[2][0],q.y+q.h-r[2][1],r[2][0]||.01,r[2][1]||.01,0,Math.PI/2,0,true);ctx.lineTo(q.x+q.w,q.y+r[1][1]);ctx.ellipse(q.x+q.w-r[1][0],q.y+r[1][1],r[1][0]||.01,r[1][1]||.01,0,0,-Math.PI/2,true);ctx.closePath();
      ctx.clip('evenodd');shadowOnly(ctx,k,()=>boxPath(ctx,q.x-s.s,q.y-s.s,q.w+2*s.s,q.h+2*s.s,grow(o.rad,s.s)),s);ctx.restore();break;}
    case 'ishadow':{const s=o.s,q=o.r;ctx.save();boxPath(ctx,q.x,q.y,q.w,q.h,o.rad);ctx.clip();const F=10000;ctx.shadowColor=s.c;ctx.shadowBlur=s.b*k;ctx.shadowOffsetX=(s.x+F)*k;ctx.shadowOffsetY=s.y*k;ctx.translate(-F,0);
      ctx.beginPath();ctx.rect(q.x-200,q.y-200,q.w+400,q.h+400);const r2=grow(o.rad,-s.s);const ix=q.x+s.s,iy=q.y+s.s,iw=q.w-2*s.s,ih=q.h-2*s.s;
      /* the hole, drawn the other way round */
      ctx.moveTo(ix+r2[0][0],iy);ctx.ellipse(ix+r2[0][0],iy+r2[0][1],r2[0][0]||.01,r2[0][1]||.01,0,-Math.PI/2,-Math.PI,true);ctx.lineTo(ix,iy+ih-r2[3][1]);ctx.ellipse(ix+r2[3][0],iy+ih-r2[3][1],r2[3][0]||.01,r2[3][1]||.01,0,Math.PI,Math.PI/2,true);
      ctx.lineTo(ix+iw-r2[2][0],iy+ih);ctx.ellipse(ix+iw-r2[2][0],iy+ih-r2[2][1],r2[2][0]||.01,r2[2][1]||.01,0,Math.PI/2,0,true);ctx.lineTo(ix+iw,iy+r2[1][1]);ctx.ellipse(ix+iw-r2[1][0],iy+r2[1][1],r2[1][0]||.01,r2[1][1]||.01,0,0,-Math.PI/2,true);ctx.closePath();
      ctx.fillStyle='#000';ctx.fill('evenodd');ctx.restore();break;}
    case 'bg':{boxPath(ctx,o.r.x,o.r.y,o.r.w,o.r.h,o.rad);ctx.fillStyle=o.c;ctx.fill();break;}
    case 'grad':{ctx.save();boxPath(ctx,o.r.x,o.r.y,o.r.w,o.r.h,o.rad);ctx.clip();gradient(ctx,o.g,o.r.x,o.r.y,o.r.w,o.r.h);ctx.restore();break;}
    case 'border':borderOp(ctx,o);break;
    case 'img':{const q=o.r,el=o.el,nw=el.naturalWidth||el.width,nh=el.naturalHeight||el.height;if(!nw||!nh||!q.w||!q.h)break;let dw=q.w,dh=q.h;
      if(o.fit==='contain'||o.fit==='scale-down'){const s=Math.min(q.w/nw,q.h/nh);dw=nw*s;dh=nh*s;if(o.fit==='scale-down'&&s>1){dw=nw;dh=nh;}}
      else if(o.fit==='cover'){const s=Math.max(q.w/nw,q.h/nh);dw=nw*s;dh=nh*s;}else if(o.fit==='none'){dw=nw;dh=nh;}
      const pp=String(o.pos||'50% 50%').split(/\s+/),at=(v,free)=>{v=v||'50%';return /%$/.test(v)?free*px(v)/100:px(v);};const dx=q.x+at(pp[0],q.w-dw),dy=q.y+at(pp[1],q.h-dh);
      ctx.save();boxPath(ctx,q.x,q.y,q.w,q.h,null);ctx.clip();try{ctx.drawImage(el,dx,dy,dw,dh);}catch(e){}ctx.restore();break;}
    case 'svg':{if(o.img)try{ctx.drawImage(o.img,o.r.x,o.r.y,o.r.w,o.r.h);}catch(e){}break;}
    case 'clip':{ctx.save();boxPath(ctx,o.r.x,o.r.y,o.r.w,o.r.h,o.rad);ctx.clip();break;}
    case 'unclip':ctx.restore();break;
    case 'text':{ctx.save();ctx.font=o.font;ctx.fillStyle=o.color;ctx.textBaseline='alphabetic';if('letterSpacing' in ctx)ctx.letterSpacing=o.ls+'px';
      if(o.shadow){ctx.shadowColor=o.shadow.c;ctx.shadowBlur=o.shadow.b*k;ctx.shadowOffsetX=o.shadow.x*k;ctx.shadowOffsetY=o.shadow.y*k;}
      const fm=ctx.measureText('Hg');const asc=fm.fontBoundingBoxAscent!=null?fm.fontBoundingBoxAscent:fm.actualBoundingBoxAscent,des=fm.fontBoundingBoxDescent!=null?fm.fontBoundingBoxDescent:fm.actualBoundingBoxDescent;
      for(const w of o.words){const y=w.y+(w.h-(asc+des))/2+asc;ctx.fillText(w.t,w.x,y);}ctx.restore();break;}
    case 'deco':{ctx.save();ctx.font=o.font;const fm=ctx.measureText('Hg');const asc=fm.fontBoundingBoxAscent||fm.actualBoundingBoxAscent,des=fm.fontBoundingBoxDescent||fm.actualBoundingBoxDescent;
      const th=/px$/.test(o.deco.th||'')?px(o.deco.th):Math.max(1,o.deco.fs/16),off=/px$/.test(o.deco.off||'')?px(o.deco.off):0;const base=o.y+(o.h-(asc+des))/2+asc;
      ctx.fillStyle=o.deco.c;ctx.fillRect(o.x,base+Math.max(1,o.deco.fs*.09)+off,o.w,th);ctx.restore();break;}}}
  while(stack.length){const top=stack.pop();top.ctx.drawImage(top.G.c,0,0);}
  return{cv,b,k};}
function borderOp(ctx,o){const q=o.r,[t,r,bt,l]=o.bw,c=o.bc,s=o.bs;
  const uni=t===r&&r===bt&&bt===l&&c.every(x=>x===c[0])&&s.every(x=>x===s[0]);
  if(uni&&t>0){if(s[0]==='none'||s[0]==='hidden'||transparentC(c[0]))return;ctx.save();ctx.strokeStyle=c[0];ctx.lineWidth=t;
    if(s[0]==='dashed')ctx.setLineDash([t*3,t*2]);else if(s[0]==='dotted'){ctx.setLineDash([0,t*2]);ctx.lineCap='round';}
    boxPath(ctx,q.x+t/2,q.y+t/2,q.w-t,q.h-t,grow(o.rad,-t/2));ctx.stroke();ctx.restore();return;}
  /* sides of their own: four trapezoids (and triangles, where a side is all there is) */
  const x0=q.x,y0=q.y,x1=q.x+q.w,y1=q.y+q.h;const side=(w,col,st,pts)=>{if(!(w>0)||st==='none'||st==='hidden'||transparentC(col))return;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);ctx.closePath();ctx.fillStyle=col;ctx.fill();};
  ctx.save();if(!noRadii(o.rad)){boxPath(ctx,q.x,q.y,q.w,q.h,o.rad);ctx.clip();}
  side(t,c[0],s[0],[x0,y0,x1,y0,x1-r,y0+t,x0+l,y0+t]);side(r,c[1],s[1],[x1,y0,x1,y1,x1-r,y1-bt,x1-r,y0+t]);
  side(bt,c[2],s[2],[x1,y1,x0,y1,x0+l,y1-bt,x1-r,y1-bt]);side(l,c[3],s[3],[x0,y1,x0,y0,x0+l,y0+t,x0+l,y1-bt]);ctx.restore();}

/* ---------------- the stage as sprites ---------------- */
const DYN=['transform','opacity','visibility','z-index'];
function makeScene(stage){
  /* the flat state, in which pictures are painted: no transforms, and every sprite shown (its own visibility and opacity are applied
     where it is placed, so a piece painted while hidden is not an empty picture when it shows) */
  const flat=D.createElement('style');flat.textContent='.wkv-flat,.wkv-flat :not(svg *){transform:none!important;transition:none!important;animation:none!important}.wkv-flat [data-wkv]{visibility:visible!important}';
  const still=D.createElement('style');still.textContent='#wkStage,#wkStage *{transition:none!important;animation:none!important}';D.head.appendChild(still);
  /* which elements move: those the walkthrough sets a style on at some moment, and those with a transform of their own */
  const roots=new Set([stage,...stage.children]);
  const look=()=>{for(const e of stage.querySelectorAll('*')){if(e.namespaceURI===SVGNS)continue;const st=e.style;
    if(st.transform||st.opacity||st.visibility||st.zIndex||st.backgroundColor)roots.add(e);else{const cs=getComputedStyle(e),t=cs.transform;
      /* a transform of its own, or a place in the stacking order (z-index on a placed element): a sprite of its own, so the order holds */
      if((t&&t!=='none')||(cs.position!=='static'&&cs.zIndex!=='auto'))roots.add(e);}}};
  const Dur=TKWALK.duration;for(let i=0;i<=48;i++){TKWALK.renderAt(Dur*i/48);look();}TKWALK.chapters.forEach(c=>{TKWALK.renderAt(c.start+.5);look();});
  const isRoot=e=>roots.has(e);for(const r of roots)r.setAttribute('data-wkv','');
  /* each root: its parent root and the nodes whose state goes into its picture */
  const info=new Map();
  for(const r of roots){let p=r.parentElement;while(p&&!roots.has(p)&&p!==stage)p=p.parentElement;
    /* its elements (the walkthrough changes text by putting new text nodes in, so the text is read from the elements each time) */
    const nodes=[];const w=D.createTreeWalker(r,NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n!==r&&roots.has(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    for(let n=w.nextNode();n;n=w.nextNode())nodes.push(n);
    info.set(r,{el:r,parent:r===stage?null:(p||stage),kids:[],nodes,sig:null,spr:null,L:{x:0,y:0},cs:getComputedStyle(r)});}
  for(const v of info.values())if(v.parent)info.get(v.parent).kids.push(v);
  const order=[...stage.querySelectorAll('*')];const idx=new Map(order.map((e,i)=>[e,i]));for(const v of info.values())v.kids.sort((a,b)=>idx.get(a.el)-idx.get(b.el));
  const ownSig=e=>{let s=e.className&&e.className.baseVal!=null?e.className.baseVal:e.className;const st=e.style;for(let i=0;i<st.length;i++){const p=st[i];if(DYN.indexOf(p)<0)s+='|'+p+':'+st.getPropertyValue(p);}return s;};
  const textOf=e=>{let s='';for(let c=e.firstChild;c;c=c.nextSibling)if(c.nodeType===3)s+=c.nodeValue;return s;};
  const sigOf=v=>{let s=ownSig(v.el)+'#'+textOf(v.el);for(const n of v.nodes)s+='<'+(n.className&&n.className.baseVal!=null?n.className.baseVal:n.className)+'/'+n.getAttribute('style')+'/'+(n.tagName==='IMG'?n.currentSrc.length:'')+'#'+textOf(n);return s;};
  return{stage,info,still,flat,isRoot,sigOf,root:info.get(stage),
    async update(R){
      const dirty=[];for(const v of info.values()){const s=sigOf(v);if(s!==v.sig){v.sig=s;dirty.push(v);}}
      if(!dirty.length)return 0;
      if(!flat.isConnected)D.head.appendChild(flat);stage.classList.add('wkv-flat');
      const lists=[];try{
        const sb=stage.getBoundingClientRect();ZF=sb.width/(stage.offsetWidth||SW)||1;
        /* the place of every root inside its parent root, as laid out (no transforms) */
        for(const v of info.values()){const q=v.el.getBoundingClientRect();v.box={x:(q.left-sb.left)/ZF,y:(q.top-sb.top)/ZF,w:q.width/ZF,h:q.height/ZF};}
        for(const v of dirty)lists.push([v,listOf(v.el,isRoot,R)]);
      }finally{stage.classList.remove('wkv-flat');}
      for(const v of info.values()){const p=v.parent?info.get(v.parent):null;v.L=p?{x:v.box.x-p.box.x,y:v.box.y-p.box.y}:{x:0,y:0};}
      for(const [v,L] of lists)v.spr=await paint(L,R);
      return dirty.length;},
    draw(ctx,scale){const base=new DOMMatrix([scale,0,0,scale,0,0]);
      const go=(v,M,a)=>{const cs=v.cs;if(cs.display==='none'||cs.visibility==='hidden')return;const op=v===this.root?1:px(cs.opacity===''?1:cs.opacity);const al=a*op;if(al<=0.002)return;
        let m=M;if(v!==this.root){m=m.translate(v.L.x,v.L.y);const t=cs.transform;if(t&&t!=='none'){const o=cs.transformOrigin.split(' ').map(px);let T;try{T=new DOMMatrix(t);}catch(e){T=new DOMMatrix();}
          m=m.translate(o[0],o[1]).multiply(new DOMMatrix([T.a,T.b,T.c,T.d,T.e,T.f])).translate(-o[0],-o[1]);}}
        /* the stacking order: below the box itself what has a z-index under 0, then the box, then the rest by z-index, in page order */
        const kids=v.kids.slice().sort((a,b)=>(parseInt(a.cs.zIndex)||0)-(parseInt(b.cs.zIndex)||0));
        for(const k of kids)if((parseInt(k.cs.zIndex)||0)<0)go(k,m,al);
        const s=v.spr;if(s){ctx.setTransform(m);ctx.globalAlpha=al;ctx.drawImage(s.cv,s.b.x,s.b.y,s.cv.width/s.k,s.cv.height/s.k);}
        for(const k of kids)if((parseInt(k.cs.zIndex)||0)>=0)go(k,m,al);};
      ctx.save();go(this.root,base,1);ctx.restore();},
    done(){still.remove();flat.remove();stage.classList.remove('wkv-flat');for(const r of roots)r.removeAttribute('data-wkv');}};}

/* ---------------- the frames, the narration, the file ---------------- */
async function pickVideo(w,h,fps){for(const codec of ['avc1.640028','avc1.4D4028','avc1.4D401F','avc1.42E01F']){const cfg={codec,width:w,height:h,bitrate:2500000,framerate:fps,avc:{format:'avc'}};
  try{const r=await VideoEncoder.isConfigSupported(cfg);if(r&&r.supported)return cfg;}catch(e){}}return null;}
async function pickAudio(){if(typeof AudioEncoder==='undefined')return null;for(const c of [{codec:'mp4a.40.2',mux:'aac'},{codec:'opus',mux:'opus'}]){const cfg={codec:c.codec,sampleRate:48000,numberOfChannels:1,bitrate:96000};
  try{const r=await AudioEncoder.isConfigSupported(cfg);if(r&&r.supported)return Object.assign(cfg,{mux:c.mux});}catch(e){}}return null;}
function dataToAB(u){const b=atob(u.slice(u.indexOf(',')+1));const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
/* the narration as one track: each recorded line from its cue's start, as the player plays it */
async function narration(Dur,sr){const L=typeof WALK_AUDIO!=='undefined'&&WALK_AUDIO&&WALK_AUDIO.lines;if(!L)return null;
  const OAC=W.OfflineAudioContext||W.webkitOfflineAudioContext;if(!OAC)return null;const n=Math.ceil((Dur+.5)*sr);const oc=new OAC(1,n,sr);let any=false;
  for(const c of TKWALK.cues){const l=L[c.id];if(!l||!l.a)continue;try{const buf=await new Promise((ok,no)=>{const p=oc.decodeAudioData(dataToAB(l.a),ok,no);if(p&&p.then)p.then(ok,no);});
    const s=oc.createBufferSource();s.buffer=buf;s.connect(oc.destination);s.start(c.start);any=true;}catch(e){}}
  if(!any)return null;return await oc.startRendering();}

async function make(opt){opt=opt||{};const fps=opt.fps||30,OW=opt.width||1280,OH=Math.round(OW*SH/SW/2)*2,on=opt.progress||(()=>{}),stop=opt.signal||{aborted:false};
  if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('This browser cannot make video files. Use Safari on an iPad with iPadOS 16.4 or later, or Chrome or Edge on a computer.');
  const MX=W.Mp4Muxer;if(!MX)throw new Error('The video maker (nbh-tk1-video.js) did not load completely.');
  const vcfg=await pickVideo(OW,OH,fps);if(!vcfg)throw new Error('This browser has no H.264 video encoder for '+OW+' x '+OH+'.');
  const acfg=opt.sound===false?null:await pickAudio();
  const stage=TKWALK.stage;if(!stage)throw new Error('Open the Walkthrough first.');
  TKWALK.pause();const was=TKWALK.time;TKWALK.build();
  const player=stage.closest('.wk-player'),small=player&&player.classList.contains('wk-small');if(small)player.classList.remove('wk-small');const Dur=TKWALK.duration;if(!Dur)throw new Error('The walkthrough is empty.');
  const N=Math.ceil(Math.min(Dur,opt.until||Dur)*fps);let audio=null;   /* until: only the first seconds (for the checks) */if(acfg){on({phase:'sound',done:0,total:N});audio=await narration(Dur,acfg.sampleRate);}
  const target=new MX.ArrayBufferTarget();
  const mux=new MX.Muxer({target,fastStart:'in-memory',firstTimestampBehavior:'offset',video:{codec:'avc',width:OW,height:OH,frameRate:fps},
    audio:audio?{codec:acfg.mux,numberOfChannels:1,sampleRate:acfg.sampleRate}:undefined});
  let err=null;const venc=new VideoEncoder({output:(c,m)=>mux.addVideoChunk(c,m),error:e=>{err=e;}});venc.configure(vcfg);
  let aenc=null;
  if(audio){aenc=new AudioEncoder({output:(c,m)=>mux.addAudioChunk(c,m),error:e=>{err=e;}});const {mux:_m,...ac}=acfg;aenc.configure(ac);
    const ch=audio.getChannelData(0),sr=audio.sampleRate,step=sr/10;
    for(let i=0;i<ch.length;i+=step){const part=ch.subarray(i,Math.min(ch.length,i+step));const ad=new AudioData({format:'f32-planar',sampleRate:sr,numberOfFrames:part.length,numberOfChannels:1,timestamp:Math.round(i/sr*1e6),data:part.slice()});aenc.encode(ad);ad.close();}
    await aenc.flush();}
  const cv=D.createElement('canvas');cv.width=OW;cv.height=OH;const ctx=cv.getContext('2d',{alpha:false});
  const scene=makeScene(stage);const R=Math.min(2,Math.max(1,OW/SW));const t0=performance.now();
  try{
    for(let i=0;i<N;i++){if(stop.aborted)throw new Error('cancelled');if(err)throw err;
      TKWALK.renderAt(Math.min(Dur,i/fps));await scene.update(R);
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#d8c29d';ctx.fillRect(0,0,OW,OH);scene.draw(ctx,OW/SW);
      const vf=new VideoFrame(cv,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});venc.encode(vf,{keyFrame:i%(fps*4)===0});vf.close();
      while(venc.encodeQueueSize>6){await new Promise(r=>setTimeout(r,4));if(err)throw err;}
      if(i%10===0){on({phase:'video',done:i,total:N,ms:performance.now()-t0});await tick();}}
    await venc.flush();if(err)throw err;mux.finalize();
  }finally{scene.done();if(small)player.classList.add('wk-small');try{venc.close();}catch(e){}try{aenc&&aenc.close();}catch(e){}TKWALK.renderAt(was||0);try{W.dispatchEvent(new Event('resize'));}catch(e){}}
  on({phase:'done',done:N,total:N,ms:performance.now()-t0});
  return{blob:new Blob([target.buffer],{type:'video/mp4'}),sound:!!audio,seconds:Dur,frames:N};}
/* one frame, painted as the video would have it (for the checks) */
async function frame(t,width){const OW=width||1280,OH=Math.round(OW*SH/SW);const player=TKWALK.stage.closest('.wk-player'),small=player&&player.classList.contains('wk-small');if(small)player.classList.remove('wk-small');
  const scene=makeScene(TKWALK.stage);try{TKWALK.renderAt(t);await scene.update(Math.min(2,Math.max(1,OW/SW)));
  const cv=D.createElement('canvas');cv.width=OW;cv.height=OH;const ctx=cv.getContext('2d');ctx.fillStyle='#d8c29d';ctx.fillRect(0,0,OW,OH);scene.draw(ctx,OW/SW);return cv;}finally{scene.done();if(small)player.classList.add('wk-small');}}

/* the frames at the times `at`, painted by one scene stepping through the walkthrough every `step` seconds, as the video does it
   (its pictures kept and painted again only where something changed): the checks compare them with fresh frames */
async function run(at,step,width){const OW=width||1280,OH=Math.round(OW*SH/SW);const want=at.slice().sort((a,b)=>a-b),out={};const scene=makeScene(TKWALK.stage);
  try{const end=want[want.length-1];let i=0;for(let t=0;t<=end+1e-6;t+=step){TKWALK.renderAt(t);await scene.update(Math.min(2,Math.max(1,OW/SW)));
      while(i<want.length&&want[i]<=t+1e-6){const cv=D.createElement('canvas');cv.width=OW;cv.height=OH;const ctx=cv.getContext('2d');ctx.fillStyle='#d8c29d';ctx.fillRect(0,0,OW,OH);scene.draw(ctx,OW/SW);out[want[i]]=cv.toDataURL('image/png');i++;}}}
  finally{scene.done();}return out;}

/* ---------------- the button and its box ---------------- */
function fileName(){let n='';try{n=String((typeof S!=='undefined'&&S.meta&&S.meta.first)||'').trim();}catch(e){}n=n.replace(/[^\w\- ]+/g,'').trim();return 'Token board walkthrough'+(n?' - '+n:'')+'.mp4';}
const mmss=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function ui(){const btn=D.getElementById('wkVideo');if(!btn)return;const note=D.getElementById('wkVideoNote');
  if(typeof VideoEncoder==='undefined'||!W.Mp4Muxer){btn.disabled=true;if(note){note.hidden=false;note.textContent='Save as video needs Safari on an iPad with iPadOS 16.4 or later, or Chrome or Edge on a computer.';}return;}
  btn.addEventListener('click',async()=>{
    const dlg=D.createElement('dialog');dlg.className='wkv-dlg';dlg.setAttribute('aria-labelledby','wkvT');
    dlg.innerHTML='<h3 id="wkvT">Save the walkthrough as a video</h3><p class="wkv-msg">The video is made here, on this device, from this book: its pictures, photo, names and tokens. Nothing is sent anywhere. It takes a few minutes; keep this page open and the screen on until it is done.</p>'+
      '<p class="wkv-msg wkv-priv">The video shows this student’s book. Share it only through the district’s drive or secure email, as any record about the student.</p>'+
      '<div class="wkv-bar" hidden><div class="wkv-fill"></div></div><p class="wkv-st" role="status" aria-live="polite"></p>'+
      '<div class="wkv-btns"><button type="button" class="wkv-go">Make the video</button><button type="button" class="wkv-x">Cancel</button></div>';
    D.body.appendChild(dlg);const $=s=>dlg.querySelector(s);const ctl={aborted:false};let busy=false,lock=null,url='';
    const close=()=>{ctl.aborted=true;try{lock&&lock.release();}catch(e){}if(url)setTimeout(()=>URL.revokeObjectURL(url),60000);dlg.close();dlg.remove();btn.focus();};
    $('.wkv-x').onclick=()=>{if(busy){ctl.aborted=true;$('.wkv-st').textContent='Stopping…';return;}close();};
    dlg.addEventListener('cancel',e=>{e.preventDefault();$('.wkv-x').click();});
    $('.wkv-go').onclick=async()=>{busy=true;$('.wkv-go').hidden=true;$('.wkv-bar').hidden=false;$('.wkv-x').textContent='Stop';
      try{if(navigator.wakeLock)lock=await navigator.wakeLock.request('screen');}catch(e){}
      try{const r=await make({signal:ctl,progress:p=>{const f=p.total?p.done/p.total:0;$('.wkv-fill').style.width=(100*f).toFixed(1)+'%';
          $('.wkv-st').textContent=p.phase==='sound'?'Preparing the narration…':p.phase==='done'?'Finishing the file…':'Making the video… '+Math.floor(100*f)+'%'+(p.ms&&f>.03?' (about '+mmss(p.ms/1000*(1-f)/f)+' left)':'');}});
        busy=false;const file=new File([r.blob],fileName(),{type:'video/mp4'});url=URL.createObjectURL(r.blob);
        $('.wkv-st').textContent='The video is ready: '+mmss(r.seconds)+', '+(r.blob.size/1048576).toFixed(1)+' MB'+(r.sound?'':' (no sound: this browser has no audio encoder; the captions are in the picture)')+'.';
        const bx=$('.wkv-btns');bx.innerHTML='';
        const can=navigator.canShare&&navigator.share&&navigator.canShare({files:[file]});
        if(can){const sh=D.createElement('button');sh.type='button';sh.className='wkv-go';sh.textContent='Share or save…';sh.onclick=()=>navigator.share({files:[file],title:file.name}).catch(()=>{});bx.appendChild(sh);}
        const a=D.createElement('a');a.href=url;a.download=file.name;a.className='wkv-a';a.textContent=can?'Download':'Save the video';bx.appendChild(a);
        const x=D.createElement('button');x.type='button';x.textContent='Close';x.onclick=close;bx.appendChild(x);(bx.firstChild).focus();}
      catch(e){busy=false;$('.wkv-st').textContent=e&&e.message==='cancelled'?'Stopped. No video was made.':'The video could not be made: '+(e&&e.message||e)+(D.hidden?' (the page was put away while it worked: keep it open)':'');
        $('.wkv-x').textContent='Close';$('.wkv-x').onclick=close;}
      finally{try{lock&&lock.release();}catch(e){}lock=null;}};
    dlg.showModal();$('.wkv-go').focus();});}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',ui);else ui();
W.TKVIDEO={make,frame,run};
})();
