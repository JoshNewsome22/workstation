/* real.js (v25.90): the same scene with real-looking people and things, for the pages that ask for it. Two simulated
   people with skeletons sit at a school table in a classroom; a school chair, a shelf and a cup of pencils are models;
   the floor and the table top are pictures; the things a procedure changes (the timer, the signal card, the request
   card, the token board, the student's work, the adult's clipboard, an item) are built here so they can show any state.
   The models and pictures come from the pack (nbh-scene3d-real.js, window.NBHSceneReal), carried as text: no address
   is loaded. The people are simulated and nothing here is about a student.

   NBHScene3D.createReal(host, options) takes the same state as the clay scene and the flat one (nbh-scene.js lists the
   keys) and gives back the same handle, plus `ready`: a promise that settles when the people have been read (until
   then set() only remembers the state; if it fails the page keeps the scene it had). set() keeps nothing between
   calls: every joint starts from its made position each time. The faces do not move: a mouth, brows and eyes in the
   state are not shown; words are a bubble over the head and the head turns to where the state looks.

   Hands: the state's l and r are the picture's left and right; a person who faces the viewer uses the other arm, so
   the state's l moves the person's own right arm. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {LABEL,FONT,style,roomLight} from './shared.js';

const v=(x,y,z)=>new THREE.Vector3(x,y,z),UP=v(0,1,0);
const clamp=(x,a,b)=>x<a?a:x>b?b:x,mix=(a,b,u)=>a+(b-a)*u,ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
const wp=o=>o.getWorldPosition(new THREE.Vector3()),wq=o=>o.getWorldQuaternion(new THREE.Quaternion());
/* joints: turn one by a rotation given in the room, point one at a place, and bend two (an arm, a leg) to reach a place */
function turn(bone,q){const pw=wq(bone.parent),bw=wq(bone);bone.quaternion.copy(pw.invert().multiply(q).multiply(bw));bone.updateWorldMatrix(false,true);}
function aim(bone,child,target){bone.updateWorldMatrix(true,true);const bp=wp(bone),cur=wp(child).sub(bp).normalize(),want=target.clone().sub(bp).normalize();turn(bone,new THREE.Quaternion().setFromUnitVectors(cur,want));}
function reach(up,mid,end,target,pole){up.updateWorldMatrix(true,true);const s=wp(up),l1=wp(mid).distanceTo(s),l2=wp(end).distanceTo(wp(mid));
  const d=target.clone().sub(s);let L=d.length();const max=(l1+l2)*.985,short=Math.max(0,L-max);if(L>max){d.setLength(max);L=max;}const t=s.clone().add(d),dir=d.clone().normalize();
  const a=(l1*l1-l2*l2+L*L)/(2*L),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  const side=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  aim(up,mid,s.clone().addScaledVector(dir,a).addScaledVector(side,h));aim(mid,end,t);return short;}
const NAMES={hips:/hips$/i,spine:/spine$/i,neck:/neck$/i,head:/head$/i,
  lArm:/leftarm$/i,lFore:/leftforearm$/i,lHand:/lefthand$/i,rArm:/rightarm$/i,rFore:/rightforearm$/i,rHand:/righthand$/i,
  lUp:/leftupleg$/i,lLeg:/leftleg$/i,lFoot:/leftfoot$/i,rUp:/rightupleg$/i,rLeg:/rightleg$/i,rFoot:/rightfoot$/i,
  lIdx:/lefthandindex1$/i,lMid:/lefthandmiddle1$/i,lPky:/lefthandpinky1$/i,rIdx:/righthandindex1$/i,rMid:/righthandmiddle1$/i,rPky:/righthandpinky1$/i};

export function createReal(host,opt){
opt=opt||{};const PK=opt.pack||window.NBHSceneReal;
if(!PK||!PK.adult||!PK.student||!PK.chair)throw new Error('nbh-scene3d: the real-looking pack is not loaded');
style();
const root=document.createElement('div');root.className='nbh-scene3d nbh-scene3d-real';root.setAttribute('role','img');root.setAttribute('aria-label',opt.label||'A scene: an adult and a student at a table');
const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');root.appendChild(canvas);
const over=document.createElement('div');over.className='ns3-over';root.appendChild(over);
const dimEl=document.createElement('div');dimEl.className='ns3-dim';root.appendChild(dimEl);
host.appendChild(root);
const SH=opt.shadow||2048;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:!!opt.keep});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e2d6');
const cam=new THREE.PerspectiveCamera(26,16/9,.1,50);cam.position.set(.45,1.42,2.45);cam.lookAt(0,1.0,-.55);cam.updateMatrixWorld(true);
/* ---------- small helpers ---------- */
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?.8:r,metalness:m||0});
function box(w,h,d,m,x,y,z,par){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(par||scene).add(o);return o;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;if(draw)draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const redraw=(t,fn)=>{const c=t.image,x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);fn(x,c.width,c.height);t.needsUpdate=true;};
const rr=(x,x0,y0,w,h,r)=>{x.beginPath();x.moveTo(x0+r,y0);x.arcTo(x0+w,y0,x0+w,y0+h,r);x.arcTo(x0+w,y0+h,x0,y0+h,r);x.arcTo(x0,y0+h,x0,y0,r);x.arcTo(x0,y0,x0+w,y0,r);x.closePath();};
/* the pack: pictures and models carried as text; everything read from it is waited for before the people are shown */
const waits=[];
function pic(uri,o){o=o||{};const t=new THREE.Texture();t.flipY=!!o.flip;if(o.srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(o.rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.rep[0],o.rep[1]);}
  waits.push(new Promise((res,rej)=>{const im=new Image();im.onload=()=>{t.image=im;t.needsUpdate=true;res();};im.onerror=()=>rej(new Error('nbh-scene3d: a picture in the pack could not be read'));im.src=uri;}));return t;}
function surface(e,rough,metal){const m=new THREE.MeshStandardMaterial({map:pic(e.map,{srgb:true}),roughness:rough,metalness:metal||0});if(e.nor)m.normalMap=pic(e.nor);
  if(e.arm){const a=pic(e.arm);m.aoMap=a;m.roughnessMap=a;m.metalnessMap=a;m.roughness=1;m.metalness=1;}return m;}
const loader=new GLTFLoader();
const model=(e,mat)=>new Promise((res,rej)=>{try{const s=atob(e.glb),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
  loader.parse(u.buffer,'',g=>{g.scene.traverse(n=>{if(n.isMesh){n.material=mat;n.castShadow=n.receiveShadow=true;}});res(g.scene);},rej);}catch(er){rej(er);}});
/* a model sized by its longest side, standing on its own base, in a holder that can be placed and turned */
function thing(o,longest,ry){const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3()),k=longest/Math.max(s.x,s.y,s.z),c=b.getCenter(new THREE.Vector3());
  o.scale.multiplyScalar(k);o.position.set(-c.x*k,-b.min.y*k,-c.z*k);const h=new THREE.Group();h.add(o);h.rotation.y=ry||0;scene.add(h);return h;}
const TY=.775,AX=-.5,SX=.5,WZ=-2.45;   /* the table's surface, where the two sit, the back wall */

/* ---------- the room: a classroom (a plank floor, a painted wall, a whiteboard with the day on it, letters, a poster) ---------- */
{const fl=new THREE.Mesh(new THREE.PlaneGeometry(10,8,20,16),new THREE.MeshStandardMaterial({map:pic(PK.floor,{srgb:true,flip:true,rep:[5,3.9]}),roughness:.62}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,.6);fl.receiveShadow=true;scene.add(fl);}
{const wall=std('#ece7d9',.95),skirt=std('#f7f5ee',.7);for(let i=-5;i<5;i++){box(1,3,.06,wall,i+.5,1.5,WZ-.03);box(1,.1,.02,skirt,i+.5,.05,WZ+.01);}}
{const g=new THREE.Group();g.position.set(-.45,1.48,WZ+.02);scene.add(g);const frame=std('#b9bec2',.4,.6);
 box(2.3,1.14,.03,frame,0,0,0,g);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.06),new THREE.MeshStandardMaterial({roughness:.25,map:canvasTex(1110,530,(x,w,h)=>{x.fillStyle='#fbfcfb';x.fillRect(0,0,w,h);
   x.font='600 44px '+FONT;x.fillStyle='#1f4e8c';x.fillText('Today',60,80);x.strokeStyle='#1f4e8c';x.lineWidth=4;x.beginPath();x.moveTo(60,96);x.lineTo(200,96);x.stroke();
   x.font='36px '+FONT;['1   Reading','2   Math','3   Break','4   Science'].forEach((s,i)=>{x.fillStyle=i===2?'#2e7d4f':'#33373b';x.fillText(s,70,160+i*62);});
   x.strokeStyle='#c8453a';x.lineWidth=5;x.beginPath();x.arc(820,250,120,0,7);x.stroke();x.beginPath();x.moveTo(820,250);x.lineTo(820,160);x.moveTo(820,250);x.lineTo(880,290);x.stroke();
   x.fillStyle='#33373b';x.font='30px '+FONT;x.fillText('12',802,160);x.fillText('3',922,262);x.fillText('6',812,362);x.fillText('9',708,262);})}));face.position.z=.017;g.add(face);
 box(2.3,.03,.08,frame,0,-.585,.04,g);box(.12,.025,.03,std('#2a55a0',.5),-.6,-.56,.05,g);box(.12,.025,.03,std('#c8453a',.5),-.42,-.56,.05,g);box(.14,.04,.05,std('#3b3f45',.9),.5,-.555,.05,g);}
{const strip=new THREE.Mesh(new THREE.PlaneGeometry(4.4,.2),new THREE.MeshStandardMaterial({roughness:.8,map:canvasTex(2200,100,(x,w,h)=>{const cols=['#e2574c','#f0a23b','#f2cf4a','#5aa868','#4a90c8','#8a6cc0'];
   'ABCDEFGHIJKLMNOPQRSTUV'.split('').forEach((ch,i)=>{x.fillStyle=cols[i%6];x.fillRect(i*100,0,100,100);x.fillStyle='#fff';x.font='700 62px '+FONT;x.textAlign='center';x.fillText(ch,i*100+50,72);});})}));strip.position.set(0,2.22,WZ+.005);scene.add(strip);
 const p1=new THREE.Mesh(new THREE.PlaneGeometry(.46,.62),new THREE.MeshStandardMaterial({roughness:.8,map:canvasTex(460,620,(x,w,h)=>{x.fillStyle='#fff8e6';x.fillRect(0,0,w,h);x.fillStyle='#2f6f73';x.fillRect(0,0,w,90);x.fillStyle='#fff';x.font='700 44px '+FONT;x.textAlign='center';x.fillText('Shapes',w/2,60);
   x.fillStyle='#e2574c';x.beginPath();x.arc(130,230,70,0,7);x.fill();x.fillStyle='#4a90c8';x.fillRect(250,160,140,140);x.fillStyle='#f0a23b';x.beginPath();x.moveTo(130,360);x.lineTo(210,500);x.lineTo(50,500);x.fill();x.fillStyle='#5aa868';x.beginPath();x.ellipse(320,430,90,60,0,0,7);x.fill();})}));p1.position.set(.98,1.5,WZ+.005);scene.add(p1);}
/* a table as schools have now: a pale maple top with rounded corners and a grey edge, on grey steel legs */
const maple=new THREE.MeshStandardMaterial({map:pic(PK.maple,{srgb:true,flip:true,rep:[1.2,.94]}),roughness:.5});
function slab(w,d,h,r,m){const sh=new THREE.Shape(),x=-w/2,y=-d/2;sh.moveTo(x+r,y);sh.lineTo(x+w-r,y);sh.quadraticCurveTo(x+w,y,x+w,y+r);sh.lineTo(x+w,y+d-r);sh.quadraticCurveTo(x+w,y+d,x+w-r,y+d);sh.lineTo(x+r,y+d);sh.quadraticCurveTo(x,y+d,x,y+d-r);sh.lineTo(x,y+r);sh.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false,curveSegments:8});g.rotateX(-Math.PI/2);const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)/w+.5,u.getY(i)/w+.5);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function table(w,d,top,x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const t=slab(w,d,.022,.045,maple);t.position.y=top-.022;g.add(t);const e=slab(w+.004,d+.004,.018,.047,std('#6e757b',.5));e.position.y=top-.024;g.add(e);
  const steel=std('#8b9298',.35,.7),foot=std('#2b2f33',.6);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.019,.019,top-.03,16),steel);l.position.set(a*(w/2-.09),(top-.03)/2,b*(d/2-.08));l.castShadow=true;g.add(l);
    const ft=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.02,16),foot);ft.position.set(a*(w/2-.09),.01,b*(d/2-.08));g.add(ft);});
  box(w-.3,.05,.02,steel,0,top-.06,-(d/2-.08),g);box(w-.3,.05,.02,steel,0,top-.06,(d/2-.08),g);return g;}
table(1.9,.9,TY,0,-.22);table(1.3,.6,.72,-2.0,-1.45);

/* ---------- light: the room's own light and one window's worth of sun ---------- */
roomLight(renderer,scene,.62,2.2);
const key=new THREE.DirectionalLight('#fff1dc',2.0);key.position.set(2.6,3.4,2.2);key.castShadow=true;key.shadow.mapSize.set(SH,SH);
key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-2;key.shadow.camera.near=.5;key.shadow.camera.far=12;key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key);

/* ---------- the flat scene's units (1600 x 900), carried to this table: across it, toward the viewer, and up above it ---------- */
const FX=x=>(x-805)*.0013,FZ=y=>-.62+(y-640)/160*.52;
const W3=p=>p[1]>=640?v(FX(p[0]),TY+.035,FZ(p[1])):v(FX(p[0]),TY+.035+(640-p[1])*.0021,-.6);
const REST={adult:{l:[290,690],r:[550,690]},student:{l:[1075,700],r:[1305,700]}};

/* ---------- the things a procedure uses ---------- */
/* the signal card on a small stand: a colour and a shape (a ring for green, a bar for red) and its words */
const sig=new THREE.Group();sig.position.set(0,TY,-.62);sig.rotation.y=.1;scene.add(sig);box(.14,.012,.07,std('#3b3f45',.6),0,.006,0,sig);
const sigTex=canvasTex(320,400),sigSide=std('#f4f4f0',.5);
{const m=new THREE.Mesh(new THREE.BoxGeometry(.2,.25,.004),[sigSide,sigSide,sigSide,sigSide,new THREE.MeshStandardMaterial({map:sigTex,roughness:.32}),sigSide]);m.position.y=.137;m.castShadow=true;sig.add(m);}
let sigKey='';function drawSignal(color,label){const k=color+'|'+label;if(k===sigKey)return;sigKey=k;
  redraw(sigTex,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle=color==='green'?'#2e8b4f':color==='red'?'#c8372d':'#9aa8a4';rr(x,16,16,w-32,h-32,26);x.fill();
    x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=30;if(color==='green'){x.beginPath();x.arc(w/2,158,78,0,7);x.stroke();}else if(color==='red'){x.fillRect(58,132,w-116,52);}
    x.font='700 50px '+FONT;x.textAlign='center';x.fillText(label||'',w/2,342,w-56);});}
/* the timer: a small desk timer whose screen shows the time left, a bar that empties, and what the time is for */
const timer=new THREE.Group();timer.position.set(0,TY,-.6);timer.rotation.y=-.12;scene.add(timer);
const timerTex=canvasTex(360,240);
{const b=box(.2,.135,.045,std('#f2f2ee',.45),0,.066,0,timer);b.rotation.x=-.2;const sc=new THREE.Mesh(new THREE.PlaneGeometry(.176,.112),new THREE.MeshBasicMaterial({map:timerTex,toneMapped:false}));sc.position.set(0,.004,.0232);b.add(sc);}
let timerKey='';function drawTimer(text,frac,flash,label){const k=text+'|'+frac.toFixed(3)+'|'+(flash?1:0)+'|'+label;if(k===timerKey)return;timerKey=k;
  redraw(timerTex,(x,w,h)=>{x.fillStyle=flash?'#5a4410':'#1b1f24';x.fillRect(0,0,w,h);x.fillStyle=flash?'#ffe7a3':'#f4f1e4';x.textAlign='center';x.textBaseline='middle';x.font='700 112px '+FONT;x.fillText(text,w/2,label?94:108,w-30);
    x.fillStyle='#3a4148';x.fillRect(30,label?164:186,w-60,12);x.fillStyle=flash?'#E2A93B':'#7cc7c2';x.fillRect(30,label?164:186,(w-60)*clamp(frac,0,1),12);
    if(label){x.font='600 34px '+FONT;x.fillStyle='#c9d2d0';x.fillText(label,w/2,208,w-40);}});}
const clock=s=>{s=Math.max(0,Math.ceil(s-1e-6));const m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r;};
/* the request card: a small laminated card with the two of them together */
const cardTex=canvasTex(256,180);let cardKey=null;function drawCard(label){if(label===cardKey)return;cardKey=label;redraw(cardTex,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#1D3A52';x.lineWidth=14;x.strokeRect(7,7,w-14,h-14);const up=label?16:0;x.fillStyle='#76a2a3';x.beginPath();x.arc(96,74-up,28,0,7);x.fill();x.beginPath();x.ellipse(96,146-up,44,34,0,Math.PI,0);x.fill();x.fillStyle='#E2A93B';x.beginPath();x.arc(172,84-up,22,0,7);x.fill();x.beginPath();x.ellipse(172,146-up,34,28,0,Math.PI,0);x.fill();if(label){x.fillStyle='#1D3A52';x.font='700 24px '+FONT;x.textAlign='center';x.fillText(label,w/2,162,226);}});}
const cardM=[0,1,2,3,4,5].map(i=>new THREE.MeshStandardMaterial(i===2?{map:cardTex,roughness:.3,transparent:true}:{color:'#f4f4f0',roughness:.4,transparent:true}));
const card=new THREE.Mesh(new THREE.BoxGeometry(.17,.004,.12),cardM);card.castShadow=card.receiveShadow=true;scene.add(card);
/* the student's work: a sheet that fills with colour as the time goes, crayons beside it, and one in the hand that colours */
const STROKES=[['#C7533B',70,90,150,6],['#3B7FC7',260,80,120,-8],['#3E8E5A',90,180,210,10],['#E2A93B',330,170,110,-4],['#3B7FC7',80,270,130,7],['#C7533B',250,262,190,-9]];
const paperTex=canvasTex(512,360),paperSide=std('#fdfcf8',.9);
const sheet=new THREE.Mesh(new THREE.BoxGeometry(.34,.002,.24),[paperSide,paperSide,new THREE.MeshStandardMaterial({map:paperTex,roughness:.9}),paperSide,paperSide,paperSide]);sheet.position.set(FX(1262),TY+.001,-.385);sheet.rotation.y=-.08;sheet.receiveShadow=true;scene.add(sheet);
let sheetN=-1;function drawSheet(n){if(n===sheetN)return;sheetN=n;redraw(paperTex,(x,w,h)=>{x.fillStyle='#fdfcf8';x.fillRect(0,0,w,h);x.lineCap='round';x.lineWidth=20;x.globalAlpha=.82;STROKES.slice(0,n).forEach(q=>{x.strokeStyle=q[0];x.beginPath();x.moveTo(q[1],q[2]);x.quadraticCurveTo(q[1]+q[3]/2,q[2]+q[4],q[1]+q[3],q[2]+q[4]*.3);x.stroke();});x.globalAlpha=1;});}
function makeCrayon(c){const g=new THREE.Group(),m=std(c,.55);const b=new THREE.Mesh(new THREE.CylinderGeometry(.0046,.0046,.07,12),m);b.castShadow=true;g.add(b);const tip=new THREE.Mesh(new THREE.ConeGeometry(.0044,.012,12),m);tip.position.y=-.041;tip.rotation.x=Math.PI;g.add(tip);
  const wr=new THREE.Mesh(new THREE.CylinderGeometry(.0049,.0049,.04,12),std(new THREE.Color(c).lerp(new THREE.Color('#ffffff'),.55),.9));wr.position.y=.006;g.add(wr);return g;}
[['#3B7FC7',.19,.06,.5],['#3E8E5A',.215,.11,-.3],['#7a5ab0',.2,-.03,2.1]].forEach(([c,dx,dz,r])=>{const cr=makeCrayon(c);cr.rotation.set(Math.PI/2,0,r);cr.position.set(sheet.position.x+dx,TY+.0049,sheet.position.z+dz);scene.add(cr);});
const crayon=makeCrayon('#C7533B');scene.add(crayon);crayon.visible=false;
/* the adult's papers: a clipboard with a data sheet */
const papers=new THREE.Group();papers.position.set(AX+.07,TY,-.4);papers.rotation.y=.12;scene.add(papers);
box(.235,.006,.33,std('#2f5f9e',.45),0,.003,0,papers);box(.09,.012,.03,std('#8b9298',.3,.8),0,.012,-.15,papers);
{const side=std('#fdfdfb',.9),p=new THREE.Mesh(new THREE.BoxGeometry(.21,.002,.297),[side,side,new THREE.MeshStandardMaterial({roughness:.9,map:canvasTex(294,416,(x,w,h)=>{x.fillStyle='#fdfdfb';x.fillRect(0,0,w,h);x.fillStyle='#33373b';x.fillRect(24,26,150,10);x.strokeStyle='#9aa3a8';x.lineWidth=2;for(let i=0;i<9;i++){x.strokeRect(24,60+i*38,w-48,38);}x.beginPath();x.moveTo(150,60);x.lineTo(150,402);x.moveTo(214,60);x.lineTo(214,402);x.stroke();
   x.fillStyle='#55606a';for(let i=0;i<9;i++)x.fillRect(34,74+i*38,70+(i*37)%40,8);})}),side,side,side]);p.position.set(0,.007,.008);p.receiveShadow=true;papers.add(p);}
/* the item: a tablet, a ball or a book */
const item=new THREE.Group();scene.add(item);const KIND={};
{const g=new THREE.Group();const b=box(.24,.009,.17,std('#22282e',.35,.2),0,0,0,g);const scr=new THREE.Mesh(new THREE.PlaneGeometry(.215,.146),new THREE.MeshStandardMaterial({map:canvasTex(256,174,(x,w,h)=>{x.fillStyle='#8FD0EE';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.beginPath();x.moveTo(108,56);x.lineTo(158,87);x.lineTo(108,118);x.closePath();x.fill();}),roughness:.2}));scr.rotation.x=-Math.PI/2;scr.position.y=.0048;b.add(scr);g.rotation.x=.5;g.position.y=.045;KIND.tablet=new THREE.Group().add(g);}
{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.06,32,24),std('#3B7FC7',.45));b.position.y=.06;b.castShadow=true;g.add(b);const st=new THREE.Mesh(new THREE.TorusGeometry(.0604,.006,8,40),std('#ffffff',.5));st.position.y=.06;st.rotation.x=1.1;g.add(st);KIND.ball=g;}
{const g=new THREE.Group();box(.2,.028,.145,std('#fbf8ef',.85),.003,.016,.003,g);box(.205,.003,.15,std('#C7533B',.55),0,.0015,0,g);box(.205,.003,.15,std('#C7533B',.55),0,.0315,0,g);box(.004,.033,.15,std('#b2452f',.55),-.1,.0165,0,g);box(.11,.001,.026,std('#ffffff',.7),0,.0335,0,g);KIND.book=g;}
Object.keys(KIND).forEach(k=>item.add(KIND[k]));
/* the token board: as many places as the plan has, a gold token in each one earned */
const tokens=new THREE.Group();tokens.position.set(0,TY,-.2);scene.add(tokens);let tokOf=0,tokDisc=[];
function buildTokens(of){if(of===tokOf)return;tokOf=of;while(tokens.children.length)tokens.remove(tokens.children[0]);tokDisc=[];const w=of*.066+.036;
  box(w,.006,.1,std('#1D3A52',.5),0,.003,0,tokens);box(w-.012,.002,.088,std('#fbfaf5',.6),0,.007,0,tokens);
  for(let i=0;i<of;i++){const x=-w/2+.018+.066*(i+.5);const pl=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.002,28),std('#dfe9e6',.7));pl.position.set(x,.009,0);tokens.add(pl);
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.023,.024,.008,28),new THREE.MeshStandardMaterial({color:'#E2A93B',roughness:.35,metalness:.25}));d.position.set(x,.014,0);d.castShadow=true;tokens.add(d);tokDisc.push(d);}}

/* ---------- a person with a skeleton ---------- */
function Person(node,o){scene.add(node);const B={},all=[];
  node.traverse(n=>{if(n.isMesh)n.frustumCulled=false;if(n.isBone){all.push(n);for(const k in NAMES)if(!B[k]&&NAMES[k].test(n.name.replace(/[^A-Za-z0-9]/g,'')))B[k]=n;}});
  for(const k in NAMES)if(!B[k])throw new Error('nbh-scene3d: a person in the pack has no joint for '+k);
  node.updateWorldMatrix(true,true);const h0=(wp(B.head).y-Math.min(wp(B.lFoot).y,wp(B.rFoot).y))/.84;node.scale.multiplyScalar(o.height/h0);
  node.rotation.y=o.face;node.position.set(o.x,0,o.z);node.updateWorldMatrix(true,true);
  const hipSeat=o.seat+.09*o.height/1.7,hipStand=o.height*.53,y0=hipSeat-wp(B.hips).y;node.position.y=y0;node.updateWorldMatrix(true,true);
  const f=v(Math.sin(o.face),0,Math.cos(o.face)),left=UP.clone().cross(f).normalize();
  const bind=all.map(b=>b.quaternion.clone()),headBind=wq(B.head).invert(),tall=o.height/1.7;
  function palm(k){const H=wp(B[k+'Hand']),along=wp(B[k+'Mid']).sub(H),across=wp(B[k+'Pky']).sub(wp(B[k+'Idx']));
    return (k==='r'?along.clone().cross(across):across.clone().cross(along)).normalize();}
  /* one arm to a place for the wrist; the forearm rolls so the palm faces down; the hand lies level, or tips down to touch */
  function hand(k,target,flat){const sgn=k==='l'?1:-1,pole=v(0,-1,0).addScaledVector(left,sgn*.55).addScaledVector(f,-.35);
    const short=reach(B[k+'Arm'],B[k+'Fore'],B[k+'Hand'],target,pole);
    const E=wp(B[k+'Fore']),H=wp(B[k+'Hand']),a=H.clone().sub(E).normalize(),n=palm(k),d=v(0,-1,0);
    const n2=n.clone().addScaledVector(a,-a.dot(n)),d2=d.clone().addScaledVector(a,-a.dot(d));
    if(n2.lengthSq()>1e-6&&d2.lengthSq()>1e-6){n2.normalize();d2.normalize();turn(B[k+'Fore'],new THREE.Quaternion().setFromAxisAngle(a,Math.atan2(a.dot(n2.clone().cross(d2)),n2.dot(d2))));}
    const H2=wp(B[k+'Hand']),dir=H2.clone().sub(wp(B[k+'Fore']));dir.y=flat===false?-.45*dir.length():0;dir.normalize();aim(B[k+'Hand'],B[k+'Mid'],H2.clone().add(dir));
    const n3=palm(k),ax=wp(B[k+'Mid']).sub(H2).normalize(),n4=n3.clone().addScaledVector(ax,-ax.dot(n3)),d4=v(0,-1,0).addScaledVector(ax,ax.y);
    if(n4.lengthSq()>1e-6&&d4.lengthSq()>1e-6){n4.normalize();d4.normalize();turn(B[k+'Hand'],new THREE.Quaternion().setFromAxisAngle(ax,Math.atan2(ax.dot(n4.clone().cross(d4)),n4.dot(d4))));}
    return short;}
  const P={node,B,f,left,o,tall,restHead:null,
    /* the head turns toward a place: the neck a little, the head most of the rest (its facing is followed from its made pose) */
    look(target){for(const [bone,part] of [[B.neck,.35],[B.head,.9]]){const cur=f.clone().applyQuaternion(wq(B.head).multiply(headBind)).normalize();
      const want=target.clone().sub(wp(B.head)).normalize();turn(bone,new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(cur,want),part));}},
    /* p: l, r (places for the person's own left and right wrist), lFlat, rFlat, lean -1..1, up 0..1 */
    pose(p){all.forEach((b,i)=>b.quaternion.copy(bind[i]));const up=p.up||0;node.position.set(o.x+up*.3,y0+up*(hipStand-hipSeat),o.z);node.updateWorldMatrix(true,true);
      [['lUp','lLeg','lFoot',1],['rUp','rLeg','rFoot',-1]].forEach(([a,b,c,sg])=>{const hip=wp(B[a]);
        const ank=hip.clone().addScaledVector(f,(.36*o.k+.06)*(1-up)).addScaledVector(left,sg*.02);ank.y=.1;reach(B[a],B[b],B[c],ank,f.clone().add(v(0,.9,0)));});
      if(p.lean)turn(B.spine,new THREE.Quaternion().setFromAxisAngle(f,-p.lean*.2));
      /* a thing just out of reach: lean toward it, as a person does */
      let lean=.1*(1-up),done=false;const saved=all.map(b=>b.quaternion.clone());
      for(let step=0;step<8&&!done;step++){all.forEach((b,i)=>b.quaternion.copy(saved[i]));node.updateWorldMatrix(true,true);
        turn(B.spine,new THREE.Quaternion().setFromAxisAngle(left,lean));
        const s=Math.max(p.l?hand('l',p.l,p.lFlat):0,p.r?hand('r',p.r,p.rFlat):0);if(s<.004||lean>.36)done=true;else lean+=Math.min(.09,s*1.2+.03);}},
    /* the places the picture's control and the bubble are worked out from */
    points(){const h=wp(B.head),s=.2*tall;return [h.clone().add(v(0,.25*tall,0)),h.clone().addScaledVector(left,s),h.clone().addScaledVector(left,-s),wp(B.lArm),wp(B.rArm),wp(B.lMid),wp(B.rMid),wp(B.hips).addScaledVector(left,s),wp(B.hips).addScaledVector(left,-s)];}};
  P.pose({});P.restHead=wp(B.head);return P;}
let A=null,S=null,lastSt={};

/* ---------- the controls over the picture, the bubbles, and the drawing ---------- */
const parts={};Object.keys(LABEL).forEach(name=>{const b=document.createElement('div');b.className='ns-part';b.dataset.part=name;b.style.zIndex=name==='adult'||name==='student'?1:2;if(name==='note')b.classList.add('ns3-note');else{const val=document.createElement('span');val.className='ns3-val';b.appendChild(val);}
  if(opt.tap!==false){b.tabIndex=0;b.setAttribute('role','button');b.setAttribute('aria-label',LABEL[name]);}else b.style.pointerEvents='none';b.style.display='none';over.appendChild(b);parts[name]=b;});
const bubbles={adult:document.createElement('div'),student:document.createElement('div')};Object.keys(bubbles).forEach(k=>{bubbles[k].className='ns3-bubble';bubbles[k].dataset.who=k;bubbles[k].style.display='none';over.appendChild(bubbles[k]);});
let CW=0,CH=0;const bx=new THREE.Box3(),pt=new THREE.Vector3();
const toScreen=p=>{pt.copy(p).project(cam);return [(pt.x*.5+.5)*CW,(-pt.y*.5+.5)*CH];};
function frame(name,pts,pad){const b=parts[name];if(!pts||!pts.length){b.style.display='none';return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(p=>{const q=toScreen(p);x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);});
  pad=pad||0;x0=clamp(x0-pad,2,CW-2);x1=clamp(x1+pad,2,CW-2);y0=clamp(y0-pad,2,CH-2);y1=clamp(y1+pad,2,CH-2);const mw=Math.max(44,x1-x0),mh=Math.max(44,y1-y0);   /* never smaller than a finger */
  b.style.display='';b.style.left=((x0+x1)/2-mw/2).toFixed(1)+'px';b.style.top=((y0+y1)/2-mh/2).toFixed(1)+'px';b.style.width=mw.toFixed(1)+'px';b.style.height=mh.toFixed(1)+'px';}
function place(name,obj,pad){if(!obj){frame(name,null);return;}bx.setFromObject(obj);if(bx.isEmpty()){frame(name,null);return;}const c=[];for(let i=0;i<8;i++)c.push(v(i&1?bx.max.x:bx.min.x,i&2?bx.max.y:bx.min.y,i&4?bx.max.z:bx.min.z));frame(name,c,pad);}
function resize(){const w=root.clientWidth||960,h=Math.round(w*9/16);if(w===CW&&h===CH)return false;CW=w;CH=h;let pr=Math.min(window.devicePixelRatio||1,opt.pixelRatio||2);if(w*h*pr*pr>2.6e6)pr=Math.sqrt(2.6e6/(w*h));renderer.setPixelRatio(pr);renderer.setSize(w,h,false);root.style.fontSize=(w/42).toFixed(2)+'px';return true;}
/* one person from the state: the picture's left hand is the person's own right one */
function pose(P,st,rest,who,held){const tl=W3(st.l||rest.l),tr=W3(st.r||rest.r),look=st.look||[0,0],lx=clamp(look[0],-1,1),ly=clamp(look[1],-1,1);
  if(held.l)tl.y+=.03;if(held.r)tr.y+=.03;
  P.pose({r:tl,l:tr,rFlat:tl.y<TY+.11,lFlat:tr.y<TY+.11,lean:clamp(st.lean||0,-1,1),up:who==='student'?clamp(st.up||0,0,1):0});
  /* where the head turns: by the state's look; toward the other person it turns all the way to them, as people do */
  const h=wp(P.B.head),yaw=lx*.6,pit=.1+ly*.34,dir=v(Math.sin(yaw)*Math.cos(pit),-Math.sin(pit),Math.cos(yaw)*Math.cos(pit)),other=who==='adult'?S:A,to=who==='adult'?lx:-lx;
  if(ly>.4)dir.lerp(v(P.o.x+lx*.2,TY,-.1).sub(h).normalize(),.75*ease((ly-.4)/.4)).normalize();   /* looking down: toward the work on the table in front of them, the face still in view */
  if(other&&to>.5)dir.lerp(other.restHead.clone().sub(h).normalize(),.85*ease((to-.5)/.4)).normalize();
  P.look(h.add(dir));}
const hand=(spec)=>{const m=/^(adult|student)\.(l|r)$/.exec(typeof spec==='string'?spec:'');return m?{P:m[1]==='adult'?A:S,who:m[1],side:m[2]}:null;};
const grip=h=>wp(h.P.B[(h.side==='l'?'r':'l')+'Mid']);   /* the knuckles of the hand the state names */
let shown={};
function set(st){lastSt=st=st||{};if(!A)return;   /* the people are not read yet: the state is drawn when they are */
  const a=st.adult||{},s=st.student||{},cd=st.card||{},it=st.item||{},sh=st.sheet||{},sg=st.signal||{},tm=st.timer||{},tk=st.tokens||{},n=st.note||{};
  const ch=cd.show?hand(cd.at):null,ih=it.show?hand(it.at):null,held={adult:{},student:{}};if(ch)held[ch.who][ch.side]=1;if(ih)held[ih.who][ih.side]=1;
  const showSheet=sh.show!==false,sr=s.r||REST.student.r,drawing=showSheet&&!held.student.r&&sr[1]>=640&&!(s.up>0.02);
  pose(A,a,REST.adult,'adult',held.adult);pose(S,s,REST.student,'student',held.student);
  /* the crayon in the hand that colours: its point on the page under the knuckles, its body up toward the wrist */
  crayon.visible=drawing;if(drawing){const k=wp(S.B.lMid),w=wp(S.B.lHand),tip=v(k.x,TY+.003,k.z).addScaledVector(k.clone().sub(w).setY(0).normalize(),.012),up=w.clone().sub(k).setY(0).normalize().multiplyScalar(.45).add(v(0,.9,0)).normalize();
    crayon.position.copy(tip).addScaledVector(up,.047);crayon.quaternion.setFromUnitVectors(UP,up);}
  /* the sign, the signal and the timer (side by side when both show) */
  const noteOn=!!(n.show&&n.text);parts.note.style.display=noteOn?'':'none';if(parts.note.textContent!==(noteOn?String(n.text):''))parts.note.textContent=noteOn?String(n.text):'';
  sig.visible=!!sg.show;timer.visible=!!tm.show;sig.position.x=timer.visible?FX(640):0;timer.position.x=sig.visible?.06:0;
  if(sig.visible)drawSignal(sg.color||'off',sg.label||(sg.color==='green'?'Ask now':sg.color==='red'?'Not now':''));
  let tText='';if(timer.visible){const total=Math.max(.001,+tm.total||1),left=clamp(tm.left===undefined?total:+tm.left,0,total);tText=tm.text||clock(left);drawTimer(tText,tm.ring===undefined?left/total:clamp(tm.ring,0,1),!!tm.flash,tm.label||'');}
  papers.visible=!st.papers||st.papers.show!==false;
  sheet.visible=showSheet;drawSheet(Math.round((sh.marks===undefined?.5:clamp(sh.marks,0,1))*STROKES.length));
  tokens.visible=!!tk.show;if(tokens.visible){const of=clamp(Math.round(tk.of||5),1,10),have=clamp(tk.n||0,0,of);buildTokens(of);tokDisc.forEach((d,i)=>{d.visible=i<Math.floor(have);const pop=i===Math.floor(have)-1&&tk.pop?1+.35*Math.sin(Math.PI*clamp(tk.pop,0,1)):1;d.scale.set(pop,pop,pop);});}
  /* the card and the item: on the table, or in the hand that holds them */
  card.visible=!!cd.show;if(card.visible){drawCard(cd.label||'');const lift=clamp(cd.lift||0,0,1),away=clamp(cd.away||0,0,1);
    if(ch){const hp=grip(ch);card.position.set(hp.x,hp.y+.05+lift*.04,hp.z+.02);card.rotation.set(1.15,ch.who==='adult'?.25:-.25,0);}
    else{const p=W3(Array.isArray(cd.at)?cd.at:[985,722]);card.position.set(p.x,TY+.003+lift*.05,p.z);card.rotation.set(lift*.5,.18,0);}
    cardM.forEach(m2=>{m2.opacity=1-away;});card.castShadow=away<.5;}
  item.visible=!!it.show;if(item.visible){const kind=KIND[it.kind]?it.kind:'tablet';Object.keys(KIND).forEach(k2=>KIND[k2].visible=k2===kind);
    if(ih){const hp=grip(ih);item.position.set(hp.x,hp.y-.03,hp.z+.02);}else{const p=W3(Array.isArray(it.at)?it.at:[700,724]);item.position.set(p.x,TY+.001,p.z+.14);}   /* a hand's breadth nearer the viewer than the flat scene puts it, clear of the request card */item.rotation.y=ih&&ih.who==='student'?-.2:.15;}
  dimEl.style.opacity=(clamp(st.dim||0,0,1)*.72).toFixed(3);
  shown={a,s,tText,sg,tk};draw();}
function draw(){resize();renderer.render(scene,cam);if(!A)return;
  frame('adult',A.points(),4);frame('student',S.points(),4);
  place('signal',sig.visible?sig:null,2);place('timer',timer.visible?timer:null,2);place('papers',papers.visible?papers:null,4);place('sheet',sheet.visible?sheet:null,4);
  place('tokens',tokens.visible?tokens:null,6);place('card',card.visible?card:null,8);place('item',item.visible?item:null,8);
  parts.timer.firstChild.textContent=shown.tText||'';parts.signal.firstChild.textContent=sig.visible?((shown.sg||{}).color||'off'):'';parts.tokens.firstChild.textContent=tokens.visible?Math.floor(clamp((shown.tk||{}).n||0,0,tokOf))+' of '+tokOf:'';
  [['adult',A,shown.a||{}],['student',S,shown.s||{}]].forEach(q=>{const b=bubbles[q[0]],text=q[2].say;if(!text){b.style.display='none';if(b.textContent)b.textContent='';return;}if(b.textContent!==text)b.textContent=text;b.style.display='';
    const hp=wp(q[1].B.head);hp.y+=.3*q[1].tall;const p2=toScreen(hp);b.style.left=clamp(p2[0],CW*.02+b.offsetWidth/2,CW*.98-b.offsetWidth/2).toFixed(1)+'px';const floorY=(parts.note.style.display==='none'?CH*.02:parts.note.offsetTop+parts.note.offsetHeight+CH*.012)+b.offsetHeight;b.style.top=Math.max(floorY,p2[1]-CH*.01).toFixed(1)+'px';});}
const ro=window.ResizeObserver?new ResizeObserver(()=>{if(resize())draw();}):null;if(ro)ro.observe(root);
let gone=false;
/* the models: the two people, the chairs they sit on and two more at a desk behind, the shelf by the wall, the cup of pencils */
const skin=e=>surface(e,.85,0),CS=.53;
const ready=Promise.all([model(PK.adult,skin(PK.adult)),model(PK.student,skin(PK.student)),model(PK.chair,surface(PK.chair,1,1)),
  PK.shelf?model(PK.shelf,surface(PK.shelf,.8,0)):null,PK.cup?model(PK.cup,surface(PK.cup,.7,0)):null]).then(m=>Promise.all(waits).then(()=>m)).then(([ga,gs,gChair,gShelf,gCup])=>{
  if(gone)return;
  [[1,AX,-.86,.3],[.93,SX,-.82,-.3],[.9,-1.7,-1.9,0],[.9,-2.3,-1.9,0]].forEach(([k,x,z,ry])=>{const c=gChair.clone(true);c.scale.multiplyScalar(k);c.rotation.y=ry;c.position.set(x,0,z);scene.add(c);});
  if(gShelf){const c=thing(gShelf,1.5,-Math.PI/2);c.position.set(1.72,0,WZ+.24);}
  if(gCup){const c=thing(gCup,.16,0);c.position.set(SX+.36,TY,-.58);}
  const a=Person(ga,{x:AX,z:-.78,k:1,height:1.66,face:.3,seat:CS}),s=Person(gs,{x:SX,z:-.74,k:.86,height:1.32,face:-.3,seat:CS*.93});
  A=a;S=s;set(lastSt);});
ready.catch(()=>{});
resize();renderer.render(scene,cam);
return {el:root,set,parts,ready,real:true,redraw:()=>draw(),three:{THREE,scene,cam,renderer},destroy(){gone=true;if(ro)ro.disconnect();renderer.dispose();if(root.parentNode)root.parentNode.removeChild(root);}};
}
