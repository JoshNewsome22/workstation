/* nbh-scene3d (v25.78): the drawn classroom scene in lit 3D, for the pages that show a procedure in drawing (the explainers,
   the counting practice) and for the drawn procedure videos. Two simulated people made of clay at a table in a classroom,
   and the things a procedure uses (a timer, a signal card, a request card, a token board, the student's work, the adult's
   papers, an item, a sign on the wall). Everything is built by this code; no picture, model or address is loaded, and
   nothing here is about a student.

   It takes the same state as the flat scene (nbh-scene.js, whose header lists the keys) and gives back the same handle:
   NBHScene3D.create(host, options) -> { el, set(state), parts, destroy() }. set() draws the state it is given and keeps
   nothing between calls. Hands, the card and the item are placed in the flat scene's units (1600 x 900) and carried into
   the room here, so a page written for the flat scene needs no change. NBHScene3D.ok() says whether this device can draw
   it; where it cannot, the page keeps the flat scene.

   Each thing a person can ask about has a real control over it (data-part, a name, reachable with the keyboard); speech
   is a bubble of text over the head. The picture is drawn only when set() is called.

   Built with three.js (MIT licence, (c) 2010-2026 three.js authors) and lit with Poly Haven's "Art Studio" (CC0), both
   carried inside this file. Source: tools/scene3d/. */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ok,LABEL,FONT,style,roomLight} from './shared.js';
import {createReal} from './real.js';
export {ok,createReal};


export function create(host,opt){
opt=opt||{};style();
const root=document.createElement('div');root.className='nbh-scene3d';root.setAttribute('role','img');root.setAttribute('aria-label',opt.label||'A drawn scene: an adult and a student at a table');
const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');root.appendChild(canvas);
const over=document.createElement('div');over.className='ns3-over';root.appendChild(over);
const dimEl=document.createElement('div');dimEl.className='ns3-dim';root.appendChild(dimEl);
host.appendChild(root);
const SH=opt.shadow||2048;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:!!opt.keep});
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#d9e3e1');scene.fog=new THREE.Fog('#d9e3e1',7,16);
const cam=new THREE.PerspectiveCamera(30,16/9,.1,50);cam.position.set(1.02,1.74,2.72);cam.lookAt(.02,1.15,-.5);cam.updateMatrixWorld(true);
/* ---------- small helpers ---------- */
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
function canvasTex(w,h,draw,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);}return t;}
/* clay: an uneven surface (a bump map of soft blotches and fine grain) and geometry pushed a little off true */
const clayBump=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){const g=120+Math.floor(rnd()*30)-15,r=3+rnd()*16;x.fillStyle='rgba('+g+','+g+','+g+',.25)';x.beginPath();x.ellipse(rnd()*256,rnd()*256,r,r*(.5+rnd()*.6),rnd()*3,0,7);x.fill();}
  for(let i=0;i<5000;i++){const g=100+Math.floor(rnd()*60);x.fillStyle='rgba('+g+','+g+','+g+',.35)';x.fillRect(rnd()*256,rnd()*256,1.5,1.5);}
  for(let i=0;i<5;i++){const cx=rnd()*256,cy=rnd()*256,rot=rnd()*3;for(let q=3;q<26;q+=2.6){x.strokeStyle='rgba(60,60,60,.22)';x.lineWidth=.9;x.beginPath();x.ellipse(cx,cy,q,q*.72,rot,0,7);x.stroke();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;})();
const clay=(color,rough)=>new THREE.MeshStandardMaterial({color,roughness:rough===undefined?.82:rough,metalness:0,bumpMap:clayBump,bumpScale:.9});
function wobble(g,amp,f){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=amp*(Math.sin(x*f+1.3)*Math.sin(y*f*1.1+.4)*Math.sin(z*f*.9+2.1)+.5*Math.sin(x*f*2.3+y*f*1.7));p.setXYZ(i,x+n.getX(i)*d,y+n.getY(i)*d,z+n.getZ(i)*d);}g.computeVertexNormals();return g;}
const mesh=(g,m,cast)=>{const o=new THREE.Mesh(g,m);o.castShadow=cast!==false;o.receiveShadow=true;return o;};
/* ---------- the room: a classroom corner (two-tone wall, rail, skirting, plank floor, rug, board, clock, number line, shelf, plant) ---------- */
const grey=(w,h,draw,rep)=>{const t=canvasTex(w,h,draw,rep);t.colorSpace=THREE.NoColorSpace;return t;};
const paintBump=grey(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const g=110+Math.floor(rnd()*40);x.fillStyle='rgba('+g+','+g+','+g+',.5)';x.fillRect(rnd()*w,rnd()*h,2+rnd()*5,1+rnd()*2);}},[5.3,3]);
const planks=canvasTex(1024,1024,(x,w,h)=>{x.fillStyle='#cdb892';x.fillRect(0,0,w,h);for(let r=0;r<8;r++){const y=r*128,off=(r%2)*210+rnd()*120;for(let c=-1;c<4;c++){const x0=c*420+off,tone=rnd()*26-13;x.fillStyle='rgb('+(205+tone)+','+(184+tone)+','+(146+tone)+')';x.fillRect(x0,y,418,126);
    for(let i=0;i<26;i++){x.strokeStyle='rgba(120,90,50,'+(.05+rnd()*.09)+')';x.lineWidth=.6+rnd()*1.6;const yy=y+rnd()*126;x.beginPath();x.moveTo(x0,yy);x.bezierCurveTo(x0+140,yy+rnd()*6-3,x0+280,yy+rnd()*6-3,x0+418,yy);x.stroke();}
    x.fillStyle='rgba(70,50,30,.35)';x.fillRect(x0+418,y,2,126);}x.fillStyle='rgba(70,50,30,.35)';x.fillRect(0,y+126,w,2);}},[3.7,2.1]);
const floor=mesh(new THREE.PlaneGeometry(16,9,64,36),new THREE.MeshStandardMaterial({map:planks,roughness:.62}),false);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,1.8);scene.add(floor);   /* divided finely: one huge polygon crossing the camera's plane is drawn wrongly at some angles */
const wall=mesh(new THREE.PlaneGeometry(16,8,32,16),new THREE.MeshStandardMaterial({color:'#ece8dc',roughness:.96,bumpMap:paintBump,bumpScale:.5}),false);wall.position.set(0,4,-2.6);scene.add(wall);
const dado=mesh(new THREE.BoxGeometry(16,1.02,.03,32,2,1),new THREE.MeshStandardMaterial({color:'#a9c6c0',roughness:.9,bumpMap:paintBump,bumpScale:.5}),false);dado.position.set(0,.51,-2.59);scene.add(dado);
const rail=mesh(new RoundedBoxGeometry(16,.05,.05,2,.02),new THREE.MeshStandardMaterial({color:'#f4f1e8',roughness:.6}));rail.position.set(0,1.04,-2.57);scene.add(rail);
const skirt=mesh(new RoundedBoxGeometry(16,.12,.04,2,.015),new THREE.MeshStandardMaterial({color:'#f4f1e8',roughness:.6}));skirt.position.set(0,.06,-2.575);scene.add(skirt);
const rugTex=canvasTex(512,320,(x,w,h)=>{x.fillStyle='#5f8f8d';x.fillRect(0,0,w,h);x.strokeStyle='#e9dcc0';x.lineWidth=14;x.strokeRect(22,22,w-44,h-44);x.strokeStyle='#d3a24a';x.lineWidth=5;x.strokeRect(40,40,w-80,h-80);for(let i=0;i<9000;i++){x.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+',.05)';x.fillRect(rnd()*w,rnd()*h,2,2);}});
const rug=mesh(new RoundedBoxGeometry(4.3,.016,2.7,3,.008),[0,1,2,3,4,5].map(i=>new THREE.MeshStandardMaterial(i===2?{map:rugTex,roughness:1,bumpMap:clayBump,bumpScale:1.2}:{color:'#557f7d',roughness:1})));rug.position.set(0,.008,-.25);rug.castShadow=false;scene.add(rug);
const cork=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#c9a274';x.fillRect(0,0,w,h);for(let i=0;i<5000;i++){x.fillStyle='rgba('+(rnd()<.5?'120,80,40':'235,200,150')+',.22)';x.beginPath();x.arc(rnd()*w,rnd()*h,.6+rnd()*1.8,0,7);x.fill();}});
const board=mesh(new RoundedBoxGeometry(1.5,1,.04,4,.015),new THREE.MeshStandardMaterial({map:cork,roughness:.95}));board.position.set(-1.7,1.66,-2.56);scene.add(board);
const frame=mesh(new RoundedBoxGeometry(1.58,1.08,.03,4,.012),new THREE.MeshStandardMaterial({color:'#b98a55',roughness:.6}));frame.position.set(-1.7,1.66,-2.575);scene.add(frame);
[['#76a2a3',-2.12,1.58,-.06],['#E2A93B',-1.66,1.78,.03],['#C7533B',-1.24,1.56,.07],['#f3efe4',-1.92,1.92,.05],['#f3efe4',-1.36,1.94,-.04]].forEach(([c,x,y,r],i)=>{const g=new THREE.PlaneGeometry(i<3?.3:.22,i<3?.36:.16,6,6),pp=g.attributes.position;for(let k=0;k<pp.count;k++){const v2=pp.getY(k);pp.setZ(k,.012*Math.pow(Math.max(0,-v2/.18),2));}g.computeVertexNormals();
  const n=mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.9,side:THREE.DoubleSide}));n.position.set(x,y,-2.535);n.rotation.z=r;scene.add(n);const pin=mesh(new THREE.SphereGeometry(.014,10,8),new THREE.MeshStandardMaterial({color:i%2?'#C7533B':'#1D3A52',roughness:.3}));pin.position.set(x,y+(i<3?.15:.06),-2.525);scene.add(pin);});
const clockTex=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#fbfaf5';x.beginPath();x.arc(128,128,126,0,7);x.fill();x.fillStyle='#1D3A52';x.font='700 26px Inter,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;x.fillText(String(i),128+Math.sin(a)*98,128-Math.cos(a)*98);}
  x.strokeStyle='#1D3A52';x.lineCap='round';x.lineWidth=9;x.beginPath();x.moveTo(128,128);x.lineTo(128+52*Math.sin(5.3),128-52*Math.cos(5.3));x.stroke();x.lineWidth=6;x.beginPath();x.moveTo(128,128);x.lineTo(128+84*Math.sin(1.05),128-84*Math.cos(1.05));x.stroke();x.fillStyle='#C7533B';x.beginPath();x.arc(128,128,9,0,7);x.fill();});
const clockF=mesh(new THREE.CircleGeometry(.2,48),new THREE.MeshStandardMaterial({map:clockTex,roughness:.5}),false);clockF.position.set(-.5,1.74,-2.545);scene.add(clockF);
const clockR=mesh(new THREE.TorusGeometry(.205,.022,12,48),new THREE.MeshStandardMaterial({color:'#2F6F73',roughness:.4}));clockR.position.set(-.5,1.74,-2.55);scene.add(clockR);
const numTex=canvasTex(1024,96,(x,w,h)=>{const cols=['#C7533B','#E2A93B','#3E8E5A','#3B7FC7','#76a2a3'];for(let i=0;i<10;i++){x.fillStyle=cols[i%5];x.fillRect(i*102.4+4,4,94,88);x.fillStyle='#fff';x.font='800 60px Inter,Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(i+1),i*102.4+51,50);}});
const num=mesh(new THREE.PlaneGeometry(2.6,.24),new THREE.MeshStandardMaterial({map:numTex,roughness:.85}),false);num.position.set(.85,1.24,-2.585);scene.add(num);
const shelf=mesh(new RoundedBoxGeometry(1.5,.05,.28,2,.02),new THREE.MeshStandardMaterial({color:'#c9a878',roughness:.6}));shelf.position.set(.95,1.56,-2.44);scene.add(shelf);
[-1,1].forEach(sx=>{const br=mesh(new THREE.BoxGeometry(.03,.16,.2),new THREE.MeshStandardMaterial({color:'#f4f1e8',roughness:.6}));br.position.set(.95+sx*.6,1.47,-2.48);scene.add(br);});
[['#2F6F73',.07,.3],['#E2A93B',.05,.26],['#1D3A52',.08,.33],['#C7533B',.06,.24],['#8fb7b8',.05,.3],['#3E8E5A',.07,.27]].forEach(([c,w,h],i)=>{const bk=mesh(new RoundedBoxGeometry(w,h,.2,2,.008),clay(c,.8));bk.position.set(.72+i*.085+(i>3?.02:0),1.585+h/2,-2.44);bk.rotation.z=i===5?-.2:0;scene.add(bk);});
const pot=mesh(new THREE.CylinderGeometry(.075,.055,.12,20),clay('#c2693f',.75));pot.position.set(.42,1.645,-2.44);scene.add(pot);
[[0,.2,0,0],[-.07,.17,.02,.5],[.07,.18,.01,-.5],[-.03,.26,-.02,.2],[.04,.25,.02,-.25],[-.1,.1,0,.9],[.1,.11,0,-.9]].forEach(([x,y,z,r])=>{const lf=mesh(new THREE.SphereGeometry(.05,12,10),clay('#4f9a63',.7));lf.scale.set(.5,1.25,.22);lf.position.set(.42+x,1.67+y,-2.44+z);lf.rotation.z=r;scene.add(lf);});
/* ---------- the table: wood with grain ---------- */
const wood=canvasTex(1024,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#c58b4e');g.addColorStop(.5,'#b97c40');g.addColorStop(1,'#c99154');x.fillStyle=g;x.fillRect(0,0,w,h);
  for(let i=0;i<260;i++){const y=rnd()*h,a=.04+rnd()*.11;x.strokeStyle='rgba('+(rnd()<.5?'90,52,20':'235,190,130')+','+a+')';x.lineWidth=.6+rnd()*2.2;x.beginPath();x.moveTo(0,y);for(let k=0;k<=w;k+=64)x.lineTo(k,y+Math.sin(k*.008+i)*6+Math.sin(k*.021+i*2)*2);x.stroke();}
  for(let i=0;i<5;i++){const cx=rnd()*w,cy=rnd()*h;for(let r=26;r>3;r-=4){x.strokeStyle='rgba(95,55,22,.16)';x.lineWidth=1.3;x.beginPath();x.ellipse(cx,cy,r*2.3,r*.7,0,0,7);x.stroke();}}});
const top=mesh(new RoundedBoxGeometry(2.9,.07,1.25,4,.025),new THREE.MeshStandardMaterial({map:wood,roughness:.46,metalness:0,bumpMap:wood,bumpScale:.35}));top.position.set(0,.74,0);scene.add(top);
[[-1.3,-.5],[1.3,-.5],[-1.3,.5],[1.3,.5]].forEach(([x,z])=>{const l=mesh(new THREE.CylinderGeometry(.045,.04,.72,16),new THREE.MeshStandardMaterial({color:'#a8733c',roughness:.6}));l.position.set(x,.36,z);scene.add(l);});
const TY=.775;   /* the table's surface */
/* ---------- people: clay figures, second round (fingers, eyes with lids, sculpted hair, clothes, legs) ---------- */
const weave=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,64,64);
  for(let i=0;i<64;i+=4){x.fillStyle='rgba(60,60,60,.55)';x.fillRect(i,0,1.4,64);x.fillStyle='rgba(190,190,190,.45)';x.fillRect(0,i+2,64,1.4);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(10,10);return t;})();
const strands=(()=>{const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,256,64);
  for(let i=0;i<150;i++){const g=70+Math.floor(rnd()*120);x.strokeStyle='rgba('+g+','+g+','+g+',.6)';x.lineWidth=.8+rnd()*2.4;const x0=rnd()*256;x.beginPath();x.moveTo(x0,0);x.bezierCurveTo(x0+rnd()*8-4,20,x0+rnd()*8-4,44,x0+rnd()*6-3,64);x.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1);return t;})();
const lighter=(c,a)=>new THREE.Color(c).lerp(new THREE.Color('#ffffff'),a);
/* skin: a matte clay that seems to let a little light through (a faint warm glow in the shade, a rosy edge) */
const skinM=(c,glow)=>new THREE.MeshPhysicalMaterial({color:c,roughness:.64,sheen:.32,sheenRoughness:.5,sheenColor:new THREE.Color(c).lerp(new THREE.Color('#ff8a6a'),.35),emissive:new THREE.Color(c).lerp(new THREE.Color('#ff4a2a'),.35),emissiveIntensity:glow===undefined?.03:glow,bumpMap:clayBump,bumpScale:.85,roughnessMap:clayBump});
const clothM=c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.92,sheen:.3,sheenRoughness:.7,sheenColor:lighter(c,.22),bumpMap:weave,bumpScale:1.3});
const hairM=c=>new THREE.MeshStandardMaterial({color:c,roughness:.58,bumpMap:strands,bumpScale:1.6});
const UP=new THREE.Vector3(0,1,0),v=(x,y,z)=>new THREE.Vector3(x,y,z);
const tube=(r1,r2,m)=>mesh(new THREE.CylinderGeometry(r1,r2,1,20),m);
function limb(m,a,b){const d=b.clone().sub(a),len=d.length();m.position.copy(a).addScaledVector(d,.5);m.scale.set(1,Math.max(.01,len),1);m.quaternion.setFromUnitVectors(UP,d.normalize());}
const blob=(r,sc,pos,m,amp,f)=>{const o=mesh(wobble(new THREE.SphereGeometry(r,28,20),amp===undefined?r*.03:amp,f||24/r*.05),m);o.scale.set(sc[0],sc[1],sc[2]);o.position.set(pos[0],pos[1],pos[2]);return o;};
function person(o){const g=new THREE.Group();g.position.set(o.x,0,o.z);scene.add(g);const k=o.k,P={g,k,o},skin=skinM(o.skin),skin2=skinM(o.skin2),cloth=clothM(o.shirt),hair=hairM(o.hair),wood2=clay('#b98a55',.6);
  /* the chair */
  const back=mesh(new RoundedBoxGeometry(.5*k,.36*k,.06,4,.03),wood2);back.position.set(0,1.02*k,-.27);g.add(back);
  const seat=mesh(new RoundedBoxGeometry(.48*k,.05,.46*k,4,.02),wood2);seat.position.set(0,.54*k,-.02);g.add(seat);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{const l=tube(.022,.019,wood2);limb(l,v(sx*.2*k,0,-.02+sz*.19*k),v(sx*.2*k,sz<0?1.16*k:.53*k,-.02+sz*.19*k+(sz<0?-.06:0)));g.add(l);});
  /* legs and shoes */
  const pants=clothM(o.pants),shoe=clay(o.shoe,.5);
  [-1,1].forEach(sx=>{const th=tube(.072*k,.064*k,pants),sh=tube(.058*k,.05*k,pants),hip=v(sx*.1*k,.64*k,-.02),knee=v(sx*.115*k,.62*k,.34*k),ank=v(sx*.115*k,.09,.37*k);limb(th,hip,knee);limb(sh,knee,ank);g.add(th,sh);
    const kn=mesh(new THREE.SphereGeometry(.066*k,16,12),pants);kn.position.copy(knee);g.add(kn);
    const s=mesh(wobble(new THREE.SphereGeometry(.07*k,20,14),.002,30),shoe);s.scale.set(.9,.62,1.75);s.position.set(sx*.115*k,.045,.42*k);g.add(s);(P.legs=P.legs||[]).push({sx,th,sh,kn,shoe:s});});
  /* the body */
  P.body=new THREE.Group();g.add(P.body);
  P.torso=mesh(wobble(new THREE.LatheGeometry([[0,.6],[.13,.605],[.175,.64],[.19,.72],[.186,.84],[.178,.95],[.186,1.06],[.2,1.15],[.19,1.215],[.14,1.268],[.075,1.298],[0,1.3]].map(q=>new THREE.Vector2(q[0]*k,q[1]*k)),40),.004,20),cloth);P.torso.scale.set(1.18,1,.82);P.body.add(P.torso);
  const hem=mesh(new THREE.TorusGeometry(.178*k,.013*k,10,36),cloth);hem.rotation.x=Math.PI/2;hem.scale.set(1.18,.82,1);hem.position.y=.64*k;P.body.add(hem);
  const neck=mesh(new THREE.CylinderGeometry(.055*k,.066*k,.12*k,18),skin2);neck.position.y=1.33*k;P.body.add(neck);
  if(o.kind==='adult'){   /* a cardigan: a collar, a lanyard and a badge */
    const col=mesh(new THREE.TorusGeometry(.074*k,.017*k,10,28),clothM('#f1ede3'));col.rotation.x=Math.PI/2;col.scale.set(1.1,1,1);col.position.y=1.287*k;P.body.add(col);
    const lan=clothM('#C7533B');[-1,1].forEach(sx=>{const l=tube(.006,.006,lan);limb(l,v(sx*.075*k,1.3*k,.03*k),v(0,1.0*k,.158*k));P.body.add(l);});
    const badge=mesh(new RoundedBoxGeometry(.078*k,.1*k,.008,3,.004),[0,1,2,3,4,5].map(i=>i===4?new THREE.MeshStandardMaterial({map:canvasTex(128,164,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#2F6F73';x.fillRect(0,0,w,34);x.fillStyle='#c9d6d4';x.beginPath();x.arc(w/2,80,22,0,7);x.fill();x.fillRect(26,116,w-52,9);x.fillRect(38,134,w-76,7);}),roughness:.5}):new THREE.MeshStandardMaterial({color:'#f6f6f2',roughness:.6})));badge.position.set(0,.95*k,.158*k);badge.rotation.x=.03;P.body.add(badge);
    [0,1,2].forEach(i=>{const b=mesh(new THREE.SphereGeometry(.011,10,8),clay('#e9e2cf',.4));b.scale.z=.5;b.position.set(.0,(.86-i*.08)*k,(.154+i*.002)*k);P.body.add(b);});
  }else{                  /* a T-shirt: a neck band and a stripe */
    const band=mesh(new THREE.TorusGeometry(.07*k,.014*k,10,28),clothM(o.trim));band.rotation.x=Math.PI/2;band.scale.set(1.1,1,1);band.position.y=1.285*k;P.body.add(band);
    const stripe=mesh(new THREE.CylinderGeometry(.193*k,.187*k,.06*k,40,1,true),clothM(o.trim));stripe.scale.set(1.18,1,.82);stripe.position.y=1.03*k;P.body.add(stripe);
    const stripe2=mesh(new THREE.CylinderGeometry(.186*k,.184*k,.022*k,40,1,true),clothM('#fff6dc'));stripe2.scale.set(1.18,1,.82);stripe2.position.y=.975*k;P.body.add(stripe2);
  }
  /* the head */
  P.head=new THREE.Group();P.head.position.y=1.5*k;P.body.add(P.head);const r=o.hr;
  const skull=mesh(wobble(new THREE.SphereGeometry(r,44,34),.003,22),skin);skull.scale.set(1,1.08,.98);P.head.add(skull);
  P.head.add(blob(r*.8,[1,.9,.95],[0,-r*.3,r*.08],skin,.002,20));
  const earM=skinM(new THREE.Color(o.skin2).lerp(new THREE.Color('#e0604a'),.14),.08);
  P.head.add(blob(r*.07,[.75,1.7,.7],[0,r*.1,r*.925],skin,.0005,20));P.head.add(blob(r*.17,[1,.7,.6],[0,-r*.74,r*.6],skin,.001,20));
  [-1,1].forEach(s=>{const ear=mesh(new THREE.SphereGeometry(r*.2,16,12),earM);ear.scale.set(.5,1,.75);ear.position.set(s*r*.98,-r*.04,-r*.02);P.head.add(ear);});
  /* eyes: a white, an iris that turns, an upper lid that closes */
  P.balls=[];P.lids=[];const gloss=c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.06,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.6}),white=gloss('#f6f4ee'),iris=gloss(o.iris),pupil=gloss('#121012');P.lids2=[];
  [-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*r*.37,r*.09,r*.81);e.scale.set(1,1.06,.62);P.head.add(e);const R=r*.172;
    e.add(mesh(new THREE.SphereGeometry(R,24,18),white,false));
    const ball=new THREE.Group();e.add(ball);const ig=new THREE.SphereGeometry(R*1.012,24,10,0,Math.PI*2,0,.66);ig.rotateX(Math.PI/2);ball.add(mesh(ig,iris,false));
    const pg=new THREE.SphereGeometry(R*1.024,20,8,0,Math.PI*2,0,.36);pg.rotateX(Math.PI/2);ball.add(mesh(pg,pupil,false));
    const hl=mesh(new THREE.SphereGeometry(R*.075,8,8),new THREE.MeshBasicMaterial({color:'#ffffff'}),false);hl.position.set(R*.2,R*.24,R*1.03);ball.add(hl);P.balls.push(ball);
    const lid=new THREE.Group();e.add(lid);lid.add(mesh(new THREE.SphereGeometry(R*1.07,24,12,0,Math.PI*2,0,Math.PI/2),skin2,false));P.lids.push(lid);
    const lash=mesh(new THREE.TorusGeometry(R*1.075,R*(o.kind==='adult'?.07:.045),6,22,Math.PI),new THREE.MeshStandardMaterial({color:'#231a17',roughness:.6}),false);lash.rotation.x=Math.PI/2;lid.add(lash);
    const lid2=new THREE.Group();e.add(lid2);lid2.add(mesh(new THREE.SphereGeometry(R*1.06,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),skin,false));P.lids2.push(lid2);});
  P.browY=r*.36;P.brows=[-1,1].map(s=>{const b=mesh(new THREE.CapsuleGeometry(r*.032,r*.2,4,8),hairM(o.hair),false);b.rotation.z=Math.PI/2-s*.1;b.position.set(s*r*.37,P.browY,r*.9);P.head.add(b);return b;});
  const nose=mesh(new THREE.SphereGeometry(r*.12,16,12),skin2,false);nose.scale.set(.92,.82,1);nose.position.set(0,-r*.13,r*1.0);P.head.add(nose);
  const blush=new THREE.Color(o.skin).lerp(new THREE.Color('#e2705f'),.15);
  [-1,1].forEach(s=>{const c=mesh(new THREE.SphereGeometry(r*.24,16,12),skinM(blush),false);c.scale.set(1,.8,.15);c.position.set(s*r*.56,-r*.27,r*.685);P.head.add(c);});
  if(o.freckles)[[-.66,-.14],[-.56,-.1],[-.47,-.16],[.66,-.14],[.56,-.1],[.47,-.16]].forEach(([fx,fy])=>{const f=mesh(new THREE.SphereGeometry(r*.016,6,6),clay('#b97b55',.8),false);const z=Math.sqrt(Math.max(.01,1-fx*fx-fy*fy))*.985;f.position.set(fx*r,fy*r,z*r);P.head.add(f);});
  /* the mouth: a smile when quiet; lips, a dark inside and teeth when speaking */
  const lipM=skinM(new THREE.Color(o.skin).lerp(new THREE.Color('#a8463c'),.55));
  P.smile=new THREE.Group();P.smile.position.set(0,-r*.36,r*.865);P.smile.rotation.x=-.3;P.head.add(P.smile);   /* at rest: the line of the mouth, sunk in, and a lower lip */
  const mline=mesh(new THREE.TorusGeometry(r*.2,r*.016,6,26,Math.PI*.86),new THREE.MeshStandardMaterial({color:new THREE.Color(o.skin).lerp(new THREE.Color('#5a1f1a'),.72),roughness:.7}),false);mline.rotation.z=Math.PI+Math.PI*.07;P.smile.add(mline);
  const lip=mesh(new THREE.SphereGeometry(r*.1,16,12),lipM,false);lip.scale.set(1.45,.42,.5);lip.position.set(0,-r*.235,-r*.012);P.smile.add(lip);
  P.mouth=new THREE.Group();P.mouth.position.set(0,-r*.5,r*.875);P.mouth.rotation.x=.18;P.head.add(P.mouth);
  const inside=mesh(new THREE.SphereGeometry(r*.15,18,12),new THREE.MeshStandardMaterial({color:'#4a1714',roughness:.7}),false);inside.scale.set(1,1,.35);P.mouth.add(inside);
  const lips=mesh(new THREE.TorusGeometry(r*.155,r*.034,8,24),lipM,false);lips.position.z=r*.02;P.mouth.add(lips);
  const teeth=mesh(new RoundedBoxGeometry(r*.2,r*.05,r*.03,2,r*.01),new THREE.MeshStandardMaterial({color:'#fbf8f0',roughness:.35}),false);teeth.position.set(0,r*.085,r*.03);P.mouth.add(teeth);
  /* hair, built from clumps */
  const H=(rr,sc,pos,rot)=>{const b=blob(r*rr,sc,[pos[0]*r,pos[1]*r,pos[2]*r],hair,r*.012,34);if(rot)b.rotation.set(rot[0],rot[1],rot[2]);P.head.add(b);return b;};
  const cap=mesh(wobble(new THREE.SphereGeometry(r*1.075,40,26,0,Math.PI*2,0,1.42),.005,26),hair);cap.scale.set(1.02,1.12,1.05);cap.rotation.x=-.36;cap.position.y=.006;P.head.add(cap);
  if(o.kind==='adult'){H(1.1,[1.03,1.2,.74],[0,-.22,-.36]);                                       /* a bob with a side parting */
    [-1,1].forEach(s=>{H(.5,[.5,1.25,.92],[s*.9,-.42,-.1],[0,0,s*.1]);H(.34,[.5,.9,.8],[s*.84,-.98,.06],[0,0,s*-.35]);});
    H(.5,[1.15,.34,.5],[-.36,.74,.66],[.25,0,.52]);H(.42,[1.0,.3,.46],[.46,.76,.64],[.25,0,-.6]);H(.3,[.45,.9,.6],[-.93,.28,.16],[0,0,.15]);H(.28,[.45,.85,.6],[.94,.3,.16],[0,0,-.15]);
  }else{H(1.02,[1,.9,.72],[0,.05,-.34]);                                                              /* short and tousled */
    [[-.72,.62,.52,.9],[-.42,.78,.7,.5],[-.1,.84,.76,.15],[.22,.82,.74,-.25],[.52,.72,.64,-.6],[.8,.52,.44,-.95]].forEach(([x,y,z,rz],i)=>H(.3,[.9,.42,.5],[x,y,z],[.3,0,rz+(i%2?.2:-.15)]));
    [[-.3,1.1,.1,1.1],[.1,1.15,-.05,.9],[.42,1.04,.14,-1.2]].forEach(([x,y,z,rz])=>H(.24,[.9,.5,.7],[x,y,z],[0,0,rz]));
    [-1,1].forEach(s=>H(.3,[.4,.8,.7],[s*.95,.12,.12],[0,0,s*.1]));}
  /* arms: shoulder, upper arm, elbow, forearm, cuff, and a hand with four fingers and a thumb */
  P.arm={};['l','r'].forEach(side=>{const s=side==='l'?-1:1,a={s},long=o.sleeve==='long',fm=long?cloth:skin;
    a.sh=mesh(new THREE.SphereGeometry(.076*k,18,14),cloth);a.up=tube(.064*k,.07*k,cloth);a.el=mesh(new THREE.SphereGeometry(.065*k,18,14),long?cloth:skin);a.fore=tube(long?.054*k:.044*k,long?.062*k:.054*k,fm);
    a.cuff=tube(long?.058*k:.074*k,long?.058*k:.074*k,long?clothM('#f1ede3'):clothM(o.trim||o.shirt));
    const nailM=new THREE.MeshPhysicalMaterial({color:lighter(o.skin,.4),roughness:.3,clearcoat:.6});a.hand=new THREE.Group();const palm=mesh(wobble(new THREE.SphereGeometry(.05*k,22,16),.0015,50),skin);palm.scale.set(1,.5,1.12);palm.position.z=.03*k;a.hand.add(palm);
    a.fingers=[-.034,-.0115,.0115,.034].map((fx,i)=>{const L=[.03,.036,.034,.027][i]*k,f1=new THREE.Group();f1.position.set(fx*k,0,(.066+[0,.008,.006,-.004][i])*k);a.hand.add(f1);
      const g1=new THREE.CapsuleGeometry(.0118*k,L,4,10);g1.rotateX(Math.PI/2);const m1=mesh(g1,skin);m1.position.z=L/2;f1.add(m1);
      const f2=new THREE.Group();f2.position.z=L+.004*k;f1.add(f2);const g2=new THREE.CapsuleGeometry(.0108*k,L*.8,4,10);g2.rotateX(Math.PI/2);const m2=mesh(g2,skin);m2.position.z=L*.4;f2.add(m2);const nail=mesh(new THREE.SphereGeometry(.0085*k,10,8),nailM,false);nail.scale.set(.85,.3,1.1);nail.position.set(0,.0085*k,L*.62);f2.add(nail);return [f1,f2];});
    a.thumb=new THREE.Group();a.thumb.position.set(-s*.04*k,-.004*k,.022*k);a.thumb.rotation.y=-s*.85;a.hand.add(a.thumb);const gt=new THREE.CapsuleGeometry(.0135*k,.034*k,4,10);gt.rotateX(Math.PI/2);const mt=mesh(gt,skin);mt.position.z=.026*k;a.thumb.add(mt);
    scene.add(a.sh,a.up,a.el,a.fore,a.cuff,a.hand);P.arm[side]=a;});
  return P;}
/* an arm from the shoulder to where the hand should be; curl 0 = open hand, 1.3 = a fist; flat = how level the hand lies */
function setArm(P,side,hand,curl,flat){const a=P.arm[side],s=a.s,k=P.k,sh=v(s*.235*k,1.22*k,0).applyMatrix4(P.body.matrixWorld),L1=.35*k,L2=.32*k;
  const dir0=hand.clone().sub(sh).normalize(),wr0=hand.clone();
  const d=wr0.clone().sub(sh),dist=Math.min(d.length(),L1+L2-.002),dir=d.clone().normalize(),wr=sh.clone().addScaledVector(dir,dist);
  const A=(L1*L1-L2*L2+dist*dist)/(2*dist),hh=Math.sqrt(Math.max(0,L1*L1-A*A)),pole=v(s*.55,-.7,-.45).normalize(),side2=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const el=sh.clone().addScaledVector(dir,A).addScaledVector(side2,hh);limb(a.up,sh,el);limb(a.fore,el,wr);a.el.position.copy(el);a.sh.position.copy(sh);
  const fd=wr.clone().sub(el).normalize(),long=P.o.sleeve==='long';
  if(long)limb(a.cuff,wr.clone().addScaledVector(fd,-.035*k),wr.clone().addScaledVector(fd,.004*k));else limb(a.cuff,sh.clone().lerp(el,.62),sh.clone().lerp(el,.74));
  const f=fd.clone();f.y*=flat===undefined?.25:flat;f.normalize();const x=new THREE.Vector3().crossVectors(UP,f).normalize(),u=new THREE.Vector3().crossVectors(f,x);
  a.hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,u,f));a.hand.position.copy(wr).addScaledVector(fd,-.012*k);
  const c=curl||0;a.fingers.forEach((F,i)=>{const ci=c+.12+(i-1.5)*.05*(c>.6?1:.4);F[0].rotation.x=ci;F[1].rotation.x=ci*1.15;});a.thumb.rotation.x=c*.45;a.thumb.rotation.y=-s*(.85-c*.45);}
const A=person({kind:'adult',x:-.72,z:-.78,k:1.0,hr:.165,skin:'#c08556',skin2:'#a9744a',hair:'#2b211d',shirt:'#2f6f73',pants:'#1D3A52',shoe:'#3a2a22',iris:'#3b2416',sleeve:'long'});
const S=person({kind:'child',x:.74,z:-.74,k:.86,hr:.15,skin:'#efc19a',skin2:'#dba77f',hair:'#6a4226',shirt:'#e2a93b',trim:'#c98a1c',pants:'#56707f',shoe:'#c7533b',iris:'#4b6a52',sleeve:'short',freckles:true});
/* ---------- the things on the table ---------- */
const paper=canvasTex(512,360,(x,w,h)=>{x.fillStyle='#fdfcf8';x.fillRect(0,0,w,h);x.lineCap='round';
  [['#C7533B',70,90,150],['#3B7FC7',260,80,120],['#3E8E5A',90,180,210],['#E2A93B',330,170,110],['#3B7FC7',80,270,130],['#C7533B',250,262,190]].forEach(([c,x0,y0,l])=>{x.strokeStyle=c;x.lineWidth=20;x.globalAlpha=.82;x.beginPath();x.moveTo(x0,y0);x.quadraticCurveTo(x0+l/2,y0-16+rnd()*30,x0+l,y0+rnd()*10);x.stroke();});});
const leaf=(w,d,map,curl)=>{const g=new THREE.PlaneGeometry(w,d,24,18);g.rotateX(-Math.PI/2);const pp=g.attributes.position;for(let k=0;k<pp.count;k++){const u=pp.getX(k)/w+.5,vv=pp.getZ(k)/d+.5;pp.setY(k,curl*(Math.pow(Math.max(0,u-.72)/.28,2)*Math.pow(Math.max(0,.4-vv)/.4,1.5))+.0012*Math.sin(u*9)*Math.sin(vv*7));}g.computeVertexNormals();return mesh(g,new THREE.MeshStandardMaterial({map,roughness:.92,side:THREE.DoubleSide}));};
const sheet=leaf(.5,.36,paper,.03);sheet.position.set(.86,TY+.004,-.3);sheet.rotation.y=-.08;scene.add(sheet);
function makeCrayon(c){const g=new THREE.Group(),m=clay(c,.55);const b=mesh(new THREE.CylinderGeometry(.012,.012,.1,14),m);g.add(b);const tip=mesh(new THREE.ConeGeometry(.0115,.024,14),m);tip.position.y=-.062;tip.rotation.x=Math.PI;g.add(tip);const wr=mesh(new THREE.CylinderGeometry(.0128,.0128,.06,14),new THREE.MeshStandardMaterial({color:lighter(c,.55),roughness:.9}));wr.position.y=.008;g.add(wr);return g;}
function makePencil(){const g=new THREE.Group();const b=mesh(new THREE.CylinderGeometry(.0078,.0078,.14,6),new THREE.MeshStandardMaterial({color:'#E2A93B',roughness:.45}));g.add(b);const fe=mesh(new THREE.CylinderGeometry(.0082,.0082,.016,12),new THREE.MeshStandardMaterial({color:'#b9bdc0',roughness:.3,metalness:.8}));fe.position.y=.078;g.add(fe);const er=mesh(new THREE.CylinderGeometry(.0078,.0078,.014,12),clay('#e58d8d',.8));er.position.y=.093;g.add(er);
  const wd=mesh(new THREE.ConeGeometry(.0078,.022,6),new THREE.MeshStandardMaterial({color:'#e8c9a0',roughness:.8}));wd.position.y=-.081;wd.rotation.x=Math.PI;g.add(wd);const gr=mesh(new THREE.ConeGeometry(.0028,.008,6),new THREE.MeshStandardMaterial({color:'#2b2b2e',roughness:.4}));gr.position.y=-.089;gr.rotation.x=Math.PI;g.add(gr);return g;}
[['#3B7FC7',1.2,.02,.5],['#3E8E5A',1.26,.1,-.3],['#E2A93B',1.16,-.08,1.2],['#7a5ab0',1.3,-.12,2.1]].forEach(([c,x,z,r])=>{const cr=makeCrayon(c);cr.rotation.set(Math.PI/2,0,r);cr.position.set(x,TY+.0135,z);scene.add(cr);});
const crayon=makeCrayon('#C7533B');crayon.position.set(-.006,-.016,.05);crayon.rotation.set(-.5,0,.2);S.arm.r.hand.add(crayon);
const docs=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#fdfcf8';x.fillRect(0,0,w,h);x.fillStyle='#cfd8d6';for(let i=0;i<9;i++)x.fillRect(26,30+i*24,w-52-(i%3)*40,7);});
const papersG=[];[0,1,2].forEach(i=>{const p=leaf(.4,.52,docs,i===2?.022:.004);p.position.set(-.82+i*.012,TY+.003+i*.003,-.3);p.rotation.y=.06-i*.05;scene.add(p);papersG.push(p);});
const cup=mesh(new THREE.CylinderGeometry(.045,.04,.1,24,1,true),new THREE.MeshStandardMaterial({color:'#2F6F73',roughness:.5,side:THREE.DoubleSide}));cup.position.set(-1.22,TY+.05,-.46);scene.add(cup);const cupB=mesh(new THREE.CircleGeometry(.04,24),new THREE.MeshStandardMaterial({color:'#24585b',roughness:.6}));cupB.rotation.x=-Math.PI/2;cupB.position.set(-1.22,TY+.004,-.46);scene.add(cupB);
[[-.012,.1,.2],[.014,-.12,-.16],[0,.04,-.22]].forEach(([dx,rz,rx],i)=>{const pc=i===2?makeCrayon('#3B7FC7'):makePencil();pc.rotation.set(Math.PI+rx,0,rz);pc.position.set(-1.22+dx,TY+.1,-.46+dx*.6);scene.add(pc);});
const pencil=makePencil();pencil.position.set(-.006,-.012,.055);pencil.rotation.set(-.5,0,.2);A.arm.r.hand.add(pencil);pencil.visible=false;
const pencil2=makePencil();pencil2.rotation.set(Math.PI/2,0,.9);pencil2.position.set(-.58,TY+.009,-.2);scene.add(pencil2);
/* ---------- light: a real room's light (Poly Haven "Art Studio", CC0) plus a key, two rims, a bounce off the table and window light on the wall ---------- */
scene.add(new THREE.HemisphereLight('#eaf2f6','#b79b78',.22));
const key=new THREE.DirectionalLight('#fff0d8',2.5);key.position.set(-2.6,4.2,3.2);key.castShadow=true;key.shadow.mapSize.set(SH,SH);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.camera.near=.5;key.shadow.camera.far=14;key.shadow.bias=-.0003;key.shadow.normalBias=.02;key.shadow.radius=7;scene.add(key);
const fill=new THREE.DirectionalLight('#cfe3f2',.45);fill.position.set(3.5,2.2,2.5);scene.add(fill);
const rim=new THREE.DirectionalLight('#fff4e2',2.1);rim.position.set(2.4,2.8,-3.4);scene.add(rim);
const rim2=new THREE.DirectionalLight('#dfeeff',1.1);rim2.position.set(-3,2.4,-2.6);scene.add(rim2);
const bounce=new THREE.PointLight('#ffc27a',.07,1.6,2);bounce.position.set(0,TY+.14,-.66);scene.add(bounce);
const gobo=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.filter='blur(5px)';x.fillStyle='#fff';for(let r=0;r<3;r++)for(let c=0;c<2;c++)x.fillRect(46+c*86,30+r*68,74,58);});
const win=new THREE.SpotLight('#ffe0b0',230,0,.25,.35,2);win.position.set(-4.6,3.4,1.2);win.target.position.set(.15,1.5,-2.6);win.map=gobo;win.castShadow=true;win.shadow.mapSize.set(1024,1024);win.shadow.bias=-.0005;scene.add(win,win.target);

/* the light of a real room, carried in this file (unpacked in shared.js) */
roomLight(renderer,scene,.5,2.2);
function face(P,o){P.head.rotation.set(o.pitch||0,o.yaw||0,o.roll||0);const open=Math.min(1,Math.max(0,o.talk||0)),talking=open>.1;P.mouth.visible=talking;P.smile.visible=!talking;
  const wide=o.wide===undefined?-.5*open:o.wide;if(talking)P.mouth.scale.set(1+.3*wide,.3+.85*open,1+Math.max(0,-wide)*.9);P.smile.scale.setScalar(o.smile===undefined?1:o.smile);
  const lid=-.85+(o.lid||0)+(o.blink||0)*(1.95-(o.lid||0));P.lids.forEach(l=>l.rotation.x=lid);const sm=o.smile===undefined?1:o.smile;P.lids2.forEach(l=>l.rotation.x=1.0-(sm>1?.28:0)-(o.blink||0)*.25);P.balls.forEach(b=>b.rotation.set(o.gp||0,o.gy||0,0));
  P.brows.forEach(b=>b.position.y=P.browY+(o.brow||0)*P.o.hr*.1);}

/* ---------- the parts a procedure uses: faces drawn on small canvases, shown when the state asks ---------- */
const redraw=(t,fn)=>{const c=t.image,x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);fn(x,c.width,c.height);t.needsUpdate=true;};
const clamp=(v2,a,b)=>v2<a?a:v2>b?b:v2,mix=(a,b,u)=>a+(b-a)*u;
/* the flat scene's units, carried into the room: across the table, toward the viewer, and up above it */
const FX=x=>(x-800)/800*1.52;
const W3=(p,lift)=>p[1]>=640?v(FX(p[0]),TY+.03+(lift||0),-.6+(p[1]-640)/160*.75):v(FX(p[0]),TY+.03+(640-p[1])*.0024+(lift||0),-.6);
const REST={adult:{l:[290,690],r:[550,690]},student:{l:[1075,700],r:[1305,700]}};
/* the student's work: more of the drawing as it goes */
const STROKES=[['#C7533B',70,90,150,6],['#3B7FC7',260,80,120,-8],['#3E8E5A',90,180,210,10],['#E2A93B',330,170,110,-4],['#3B7FC7',80,270,130,7],['#C7533B',250,262,190,-9]];
let sheetN=-1;function drawSheet(n){if(n===sheetN)return;sheetN=n;redraw(paper,(x,w,h)=>{x.fillStyle='#fdfcf8';x.fillRect(0,0,w,h);x.lineCap='round';x.lineWidth=20;x.globalAlpha=.82;STROKES.slice(0,n).forEach(q=>{x.strokeStyle=q[0];x.beginPath();x.moveTo(q[1],q[2]);x.quadraticCurveTo(q[1]+q[3]/2,q[2]+q[4],q[1]+q[3],q[2]+q[4]*.3);x.stroke();});x.globalAlpha=1;});}
/* the signal card: a colour and a shape (a ring for green, a bar for red) and its words */
const sig=new THREE.Group();sig.position.set(0,TY,-.42);sig.rotation.y=.12;scene.add(sig);
sig.add(mesh(new THREE.CylinderGeometry(.07,.085,.03,24),clay('#b98a55',.6)));{const post=mesh(new THREE.CylinderGeometry(.014,.014,.2,12),clay('#b98a55',.6));post.position.y=.1;sig.add(post);}
const sigBox=mesh(new RoundedBoxGeometry(.26,.3,.03,4,.02),clay('#2f8a52',.6));sigBox.position.y=.33;sig.add(sigBox);
const sigTex=canvasTex(256,296,()=>{}),sigFace=mesh(new THREE.PlaneGeometry(.25,.289),new THREE.MeshStandardMaterial({map:sigTex,roughness:.6,transparent:true}),false);sigFace.position.set(0,.33,.0165);sig.add(sigFace);
let sigKey='';function drawSignal(color,label){const key=color+'|'+label;if(key===sigKey)return;sigKey=key;sigBox.material.color.set(color==='green'?'#2f8a52':color==='red'?'#C7533B':'#9AA8A4');
  redraw(sigTex,(x,w,h)=>{x.strokeStyle='#fff';x.fillStyle='#fff';x.lineWidth=26;if(color==='green'){x.beginPath();x.arc(w/2,118,62,0,7);x.stroke();}else if(color==='red'){x.fillRect(46,98,164,42);}x.font='700 40px '+FONT;x.textAlign='center';x.fillText(label||'',w/2,258,236);});}
/* the timer: a round face on a stand; the ring empties as the time runs */
const timer=new THREE.Group();timer.position.set(0,TY,-.42);timer.rotation.y=.08;scene.add(timer);
timer.add(mesh(new THREE.CylinderGeometry(.085,.1,.03,24),clay('#f1ede3',.5)));{const neck=mesh(new THREE.CylinderGeometry(.02,.026,.08,12),clay('#f1ede3',.5));neck.position.y=.05;timer.add(neck);
  const body=mesh(new THREE.CylinderGeometry(.165,.165,.06,48),clay('#f4f1e8',.45));body.rotation.x=Math.PI/2;body.position.y=.24;timer.add(body);const rimT=mesh(new THREE.TorusGeometry(.165,.014,10,48),clay('#2F6F73',.4));rimT.position.set(0,.24,.03);timer.add(rimT);}
const timerTex=canvasTex(256,256,()=>{}),timerFace=mesh(new THREE.CircleGeometry(.152,48),new THREE.MeshStandardMaterial({map:timerTex,roughness:.5}),false);timerFace.position.set(0,.24,.0315);timer.add(timerFace);
let timerKey='';function drawTimer(text,frac,flash,label){const key=text+'|'+frac.toFixed(3)+'|'+(flash?1:0)+'|'+label;if(key===timerKey)return;timerKey=key;
  redraw(timerTex,(x,w,h)=>{x.fillStyle='#fbfaf5';x.fillRect(0,0,w,h);x.lineWidth=22;x.strokeStyle=flash?'#F6E7C4':'#e3ecea';x.beginPath();x.arc(128,128,98,0,7);x.stroke();x.strokeStyle=flash?'#E2A93B':'#2F6F73';x.lineCap='round';if(frac>.001){x.beginPath();x.arc(128,128,98,-Math.PI/2,-Math.PI/2+Math.PI*2*frac);x.stroke();}
    x.fillStyle='#16242e';x.textAlign='center';x.textBaseline='middle';x.font='700 64px '+FONT;x.fillText(text,128,label?116:130);if(label){x.font='600 22px '+FONT;x.fillStyle='#45555c';x.fillText(label,128,164,150);}});}
const clock=s=>{s=Math.max(0,Math.ceil(s-1e-6));const m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r;};
/* the request card: the two of them together */
const cardTex=canvasTex(256,180,()=>{});let cardKey=null;function drawCard(label){if(label===cardKey)return;cardKey=label;redraw(cardTex,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#1D3A52';x.lineWidth=14;x.strokeRect(7,7,w-14,h-14);const up=label?16:0;x.fillStyle='#76a2a3';x.beginPath();x.arc(96,74-up,28,0,7);x.fill();x.beginPath();x.ellipse(96,146-up,44,34,0,Math.PI,0);x.fill();x.fillStyle='#E2A93B';x.beginPath();x.arc(172,84-up,22,0,7);x.fill();x.beginPath();x.ellipse(172,146-up,34,28,0,Math.PI,0);x.fill();if(label){x.fillStyle='#1D3A52';x.font='700 24px '+FONT;x.textAlign='center';x.fillText(label,w/2,162,226);}});}
const cardM=[0,1,2,3,4,5].map(i=>new THREE.MeshStandardMaterial(i===2?{map:cardTex,roughness:.6,transparent:true}:{color:'#f4f4f0',roughness:.7,transparent:true}));
const card=mesh(new RoundedBoxGeometry(.27,.012,.19,3,.005),cardM);scene.add(card);
/* the item: a tablet, a ball or a book */
const item=new THREE.Group();scene.add(item);const KIND={};
{const g=new THREE.Group();const b=mesh(new RoundedBoxGeometry(.3,.016,.21,3,.007),new THREE.MeshStandardMaterial({color:'#1D3A52',roughness:.4}));g.add(b);const scr=mesh(new THREE.PlaneGeometry(.26,.17),new THREE.MeshStandardMaterial({map:canvasTex(256,168,(x,w,h)=>{x.fillStyle='#8FD0EE';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.beginPath();x.moveTo(108,54);x.lineTo(158,84);x.lineTo(108,114);x.closePath();x.fill();}),roughness:.25}),false);scr.rotation.x=-Math.PI/2;scr.position.y=.0085;g.add(scr);g.rotation.x=.5;g.position.y=.05;KIND.tablet=new THREE.Group().add(g);}
{const g=new THREE.Group();const b=mesh(new THREE.SphereGeometry(.075,28,20),clay('#3B7FC7',.5));b.position.y=.075;g.add(b);const st=mesh(new THREE.TorusGeometry(.0755,.008,8,32),clay('#ffffff',.5),false);st.position.y=.075;st.rotation.x=1.1;g.add(st);KIND.ball=g;}
{const g=new THREE.Group();const b=mesh(new RoundedBoxGeometry(.24,.04,.17,3,.008),clay('#C7533B',.6));b.position.y=.02;g.add(b);const pg=mesh(new THREE.BoxGeometry(.225,.03,.16),clay('#fbf8ef',.8));pg.position.set(.004,.02,.004);g.add(pg);const lb=mesh(new RoundedBoxGeometry(.13,.004,.03,2,.002),clay('#ffffff',.7),false);lb.position.set(0,.042,0);g.add(lb);const cv=mesh(new RoundedBoxGeometry(.24,.006,.17,3,.003),clay('#C7533B',.6));cv.position.y=.039;g.add(cv);lb.position.y=.044;KIND.book=g;}
Object.keys(KIND).forEach(k=>item.add(KIND[k]));
/* the token board: as many places as the plan has, a gold token in each one earned */
const tokens=new THREE.Group();tokens.position.set(0,TY+.008,-.02);tokens.rotation.x=.22;tokens.scale.setScalar(1.25);scene.add(tokens);let tokOf=0,tokDisc=[];
function buildTokens(of){if(of===tokOf)return;tokOf=of;while(tokens.children.length)tokens.remove(tokens.children[0]);tokDisc=[];const w=of*.092+.05;
  tokens.add(mesh(new RoundedBoxGeometry(w,.014,.15,3,.006),clay('#1D3A52',.5)));const top2=mesh(new RoundedBoxGeometry(w-.016,.006,.134,3,.003),clay('#fbfaf5',.6));top2.position.y=.008;tokens.add(top2);
  for(let i=0;i<of;i++){const x=-w/2+.025+.092*(i+.5);const place=mesh(new THREE.CylinderGeometry(.034,.034,.004,28),clay('#dfe9e6',.7),false);place.position.set(x,.0125,0);tokens.add(place);
    const d=mesh(new THREE.CylinderGeometry(.032,.034,.016,28),new THREE.MeshStandardMaterial({color:'#E2A93B',roughness:.35,metalness:.25}));d.position.set(x,.022,0);const star=mesh(new THREE.CylinderGeometry(.016,.016,.004,5),clay('#fff3cf',.5),false);star.position.y=.009;d.add(star);tokens.add(d);tokDisc.push(d);}}
/* ---------- the controls over the picture, the bubbles, and the drawing ---------- */
const parts={};Object.keys(LABEL).forEach(name=>{const b=document.createElement('div');b.className='ns-part';b.dataset.part=name;b.style.zIndex=name==='adult'||name==='student'?1:2;if(name==='note')b.classList.add('ns3-note');else{const val=document.createElement('span');val.className='ns3-val';b.appendChild(val);}
  if(opt.tap!==false){b.tabIndex=0;b.setAttribute('role','button');b.setAttribute('aria-label',LABEL[name]);}else b.style.pointerEvents='none';over.appendChild(b);parts[name]=b;});
const bubbles={adult:document.createElement('div'),student:document.createElement('div')};Object.keys(bubbles).forEach(k=>{bubbles[k].className='ns3-bubble';bubbles[k].dataset.who=k;bubbles[k].style.display='none';over.appendChild(bubbles[k]);});
let CW=0,CH=0;const box=new THREE.Box3(),tmpB=new THREE.Box3(),pt=new THREE.Vector3();
const toScreen=p=>{pt.copy(p).project(cam);return [(pt.x*.5+.5)*CW,(-pt.y*.5+.5)*CH];};
function place(name,objs,pad){const b=parts[name];if(!objs){b.style.display='none';return;}box.makeEmpty();objs.forEach(o=>{tmpB.setFromObject(o);box.union(tmpB);});if(box.isEmpty()){b.style.display='none';return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i<8;i++){const q=toScreen(v(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}
  pad=pad||0;x0=clamp(x0-pad,2,CW-2);x1=clamp(x1+pad,2,CW-2);y0=clamp(y0-pad,2,CH-2);y1=clamp(y1+pad,2,CH-2);const mw=Math.max(44,x1-x0),mh=Math.max(44,y1-y0);   /* never smaller than a finger */
  b.style.display='';b.style.left=((x0+x1)/2-mw/2).toFixed(1)+'px';b.style.top=((y0+y1)/2-mh/2).toFixed(1)+'px';b.style.width=mw.toFixed(1)+'px';b.style.height=mh.toFixed(1)+'px';}
function resize(){const w=root.clientWidth||960,h=Math.round(w*9/16);if(w===CW&&h===CH)return false;CW=w;CH=h;let pr=Math.min(window.devicePixelRatio||1,opt.pixelRatio||2);if(w*h*pr*pr>2.6e6)pr=Math.sqrt(2.6e6/(w*h));renderer.setPixelRatio(pr);renderer.setSize(w,h,false);root.style.fontSize=(w/42).toFixed(2)+'px';return true;}
function legs(P,up,dx){const k=P.k;P.legs.forEach(L=>{const x=L.sx*.115*k+dx,hip=v(L.sx*.1*k+dx,.64*k+up*.34*k,-.02),knee=v(x,.62*k,mix(.34*k,-.02,up)),ank=v(x,.09,mix(.37*k,-.02,up));limb(L.th,hip,knee);limb(L.sh,knee,ank);L.kn.position.copy(knee);L.shoe.position.set(x,.045,ank.z+.05*k);});}
function pose(P,st,rest,key,held){const k=P.k,up=key==='student'?clamp(st.up||0,0,1):0,lean=clamp(st.lean||0,-1,1),dx=up*.36;
  legs(P,up,dx);P.body.position.set(dx,up*.34*k,0);P.body.rotation.set(0,0,-lean*.11);P.body.updateMatrixWorld(true);
  const tl=W3(st.l||rest.l),tr=W3(st.r||rest.r);
  /* a thing just out of reach: lean toward it, as a person does */
  let far=0;[['l',tl],['r',tr]].forEach(q=>{const s=q[0]==='l'?-1:1,sh=v(s*.235*k,1.22*k,0).applyMatrix4(P.body.matrixWorld);far=Math.max(far,sh.distanceTo(q[1])-.655*k);});
  if(far>0){P.body.rotation.x=clamp(far/.42,0,.36);P.body.updateMatrixWorld(true);}
  setArm(P,'l',tl,held.l?.95:.1);setArm(P,'r',tr,held.r?.95:.1,held.r===2?.25:undefined);
  const look=st.look||[0,0],lx=clamp(look[0],-1,1),ly=clamp(look[1],-1,1),m=st.mouth||'rest',talk=m==='open'?.75:m==='talk'?clamp(st.talk===undefined?.6:st.talk,0,1):0;
  face(P,{yaw:lx*.6,pitch:.1+ly*.34,gy:lx*.32,gp:ly*.22,talk:talk>.1?talk:talk>0?.12:0,smile:m==='smile'?1.12:m==='flat'?.55:.92,brow:clamp(st.brow||0,-1,1),blink:st.blink?1:0,lid:ly>.5?.3:0});
  P.smile.scale.y=m==='flat'?.2:P.smile.scale.x;}
const hand=(spec)=>{const m=/^(adult|student)\.(l|r)$/.exec(typeof spec==='string'?spec:'');return m?{P:m[1]==='adult'?A:S,who:m[1],side:m[2]}:null;};
function set(st){st=st||{};const a=st.adult||{},s=st.student||{},cd=st.card||{},it=st.item||{},sh=st.sheet||{},sg=st.signal||{},tm=st.timer||{},tk=st.tokens||{},n=st.note||{};
  const ch=cd.show?hand(cd.at):null,ih=it.show?hand(it.at):null,held={adult:{},student:{}};if(ch)held[ch.who][ch.side]=1;if(ih)held[ih.who][ih.side]=1;
  const showSheet=sh.show!==false,sr=s.r||REST.student.r,drawing=showSheet&&!held.student.r&&sr[1]>=640&&!(s.up>0.02);if(drawing)held.student.r=2;crayon.visible=drawing;
  pose(A,a,REST.adult,'adult',held.adult);pose(S,s,REST.student,'student',held.student);
  /* the sign, the signal and the timer (side by side when both show) */
  const noteOn=!!(n.show&&n.text);parts.note.style.display=noteOn?'':'none';if(parts.note.textContent!==(noteOn?String(n.text):''))parts.note.textContent=noteOn?String(n.text):'';
  sig.visible=!!sg.show;timer.visible=!!tm.show;sig.position.x=timer.visible?-.2:0;timer.position.x=sig.visible?.2:0;
  if(sig.visible)drawSignal(sg.color||'off',sg.label||(sg.color==='green'?'Ask now':sg.color==='red'?'Not now':''));
  let tText='';if(timer.visible){const total=Math.max(.001,+tm.total||1),left=clamp(tm.left===undefined?total:+tm.left,0,total);tText=tm.text||clock(left);drawTimer(tText,tm.ring===undefined?left/total:clamp(tm.ring,0,1),!!tm.flash,tm.label||'');}
  const showPapers=!st.papers||st.papers.show!==false;papersG.forEach(o=>o.visible=showPapers);
  sheet.visible=showSheet;drawSheet(Math.round((sh.marks===undefined?.5:clamp(sh.marks,0,1))*STROKES.length));
  tokens.visible=!!tk.show;if(tokens.visible){const of=clamp(Math.round(tk.of||5),1,10),have=clamp(tk.n||0,0,of);buildTokens(of);tokDisc.forEach((d,i)=>{d.visible=i<Math.floor(have);const pop=i===Math.floor(have)-1&&tk.pop?1+.35*Math.sin(Math.PI*clamp(tk.pop,0,1)):1;d.scale.set(pop,pop,pop);});}
  /* the card and the item: on the table, or in the hand that holds them */
  card.visible=!!cd.show;if(card.visible){drawCard(cd.label||'');const lift=clamp(cd.lift||0,0,1),away=clamp(cd.away||0,0,1);
    if(ch){const hp=ch.P.arm[ch.side].hand.position;card.position.set(hp.x,hp.y+.085+lift*.05,hp.z+.03);card.rotation.set(1.15,ch.who==='adult'?.25:-.25,0);}
    else{const p=W3(Array.isArray(cd.at)?cd.at:[985,722]);card.position.set(p.x,TY+.008+lift*.07,p.z);card.rotation.set(lift*.5,.2,0);}
    cardM.forEach(m2=>{m2.opacity=1-away;});card.castShadow=away<.5;}
  item.visible=!!it.show;if(item.visible){const kind=KIND[it.kind]?it.kind:'tablet';Object.keys(KIND).forEach(k2=>KIND[k2].visible=k2===kind);
    if(ih){const hp=ih.P.arm[ih.side].hand.position;item.position.set(hp.x,hp.y+.02,hp.z+.02);}else{const p=W3(Array.isArray(it.at)?it.at:[700,724]);item.position.set(p.x,TY+.002,p.z);}item.rotation.y=ih&&ih.who==='student'?-.2:.15;}
  dimEl.style.opacity=(clamp(st.dim||0,0,1)*.72).toFixed(3);
  draw(a,s,tText,sg,tk);}
let lastA={},lastS={},lastT='',lastSg={},lastTk={};
function draw(a,s,tText,sg,tk){if(a){lastA=a;lastS=s;lastT=tText;lastSg=sg;lastTk=tk;}resize();renderer.render(scene,cam);
  place('adult',[A.body,A.arm.l.hand,A.arm.r.hand,A.arm.l.fore,A.arm.r.fore],-6);place('student',[S.body,S.arm.l.hand,S.arm.r.hand,S.arm.l.fore,S.arm.r.fore],-6);
  place('signal',sig.visible?[sig]:null,2);place('timer',timer.visible?[timer]:null,2);place('papers',papersG[0].visible?papersG:null,4);place('sheet',sheet.visible?[sheet]:null,4);
  place('tokens',tokens.visible?[tokens]:null,6);place('card',card.visible?[card]:null,8);place('item',item.visible?[item]:null,8);
  parts.timer.firstChild.textContent=lastT;parts.signal.firstChild.textContent=sig.visible?(lastSg.color||'off'):'';parts.tokens.firstChild.textContent=tokens.visible?Math.floor(clamp(lastTk.n||0,0,tokOf))+' of '+tokOf:'';
  [['adult',A,lastA],['student',S,lastS]].forEach(q=>{const b=bubbles[q[0]],text=q[2].say;if(!text){b.style.display='none';if(b.textContent)b.textContent='';return;}if(b.textContent!==text)b.textContent=text;b.style.display='';
    const hp=q[1].head.getWorldPosition(pt.clone());hp.y+=q[1].o.hr*1.55;const p2=toScreen(hp);b.style.left=clamp(p2[0],CW*.02+b.offsetWidth/2,CW*.98-b.offsetWidth/2).toFixed(1)+'px';const floorY=(parts.note.style.display==='none'?CH*.02:parts.note.offsetTop+parts.note.offsetHeight+CH*.012)+b.offsetHeight;b.style.top=Math.max(floorY,p2[1]-CH*.02).toFixed(1)+'px';});}
const ro=window.ResizeObserver?new ResizeObserver(()=>{if(resize())draw();}):null;if(ro)ro.observe(root);
set({});
return {el:root,set,parts,redraw:()=>draw(),three:{THREE,scene,cam,renderer},destroy(){if(ro)ro.disconnect();renderer.dispose();if(root.parentNode)root.parentNode.removeChild(root);}};
}
