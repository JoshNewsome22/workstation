/* ============================================================ NBHScene v2 ============
   The walkthrough scene engine, second version. Same contract as the first: make(root)
   draws the room into root and returns {set(frame), countdown, spinTo, el}; set(frame)
   takes the same frame objects the stories already hold (a, s, ap, hold, at, fill, bins,
   tags, tablet, chew, cup, tray, pm, say, obs, obs2, board, clock, lad, clap, play ...).
   What is new: the people are rigged (shoulder, elbow, wrist, neck, hip) and reach with
   two-bone inverse kinematics, so every move is an arc; a step is choreographed as a
   short sequence (reach, pick, carry, drop, hand over, take, point, high five) rather
   than one slide between poses; blocks fall into bins; the stations' labels rotate; the
   data collector taps when the screen changes; and between steps the room is alive
   (breathing, blinks, a glance). The room has depth: a wall and floor with light, a
   table with a top face, soft shadows under people and props. Reduced motion: every
   step jumps to its final state and nothing idles. Print and the packet are untouched:
   the scenes sit in noprint walkthrough sections.
   Assembled by tools/scene/build-scene2.py: this core plus the form's own boards. */
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---- geometry the stories were written against (unchanged) ---- */
const A={x:146,y:134};              // adult shoulder
const B={x:574,y:144};              // student shoulder
const POSE_A={
  rest:[158,182,168,214], pointL:[178,150,262,146], pointR:[186,138,268,124], give:[184,160,266,158],
  timer:[172,152,246,144], write:[150,176,124,204], hold:[168,146,198,104], takeCard:[182,158,300,160],
  stopwatch:[170,152,218,152], prompt:[186,140,262,132], rule:[176,146,236,120],
  place:[182,164,232,182], down:[150,158,142,178], take:[172,164,188,146], talk:[176,158,214,146],
  guide:[184,170,226,190], help:[166,172,178,190], pointUp:[184,130,254,100],
  read:[166,168,196,150], touch:[204,128,282,140], block:[214,120,280,112], model:[188,170,236,186],
  show:[190,150,250,166], reach:[200,150,286,168], pointB:[172,142,196,122],
  hand:[190,152,262,156], hi5:[196,112,240,98], pointBin:[186,150,250,152]
};
const POSE_S={
  rest:[562,184,526,196], reachL:[506,144,354,150], reachR:[530,150,470,150], reachT:[534,156,486,172],
  holdTablet:[556,176,512,184], work:[556,178,498,190], handCard:[540,150,404,158], agit:[560,116,548,76],
  away:[562,184,526,196], spin:[506,138,398,118], reachArr:[520,146,410,150],
  push:[526,166,470,184], hit:[520,130,432,142], ears:[570,128,590,112], face:[566,134,584,116],
  selfhit:[566,118,590,90], reachUp:[544,124,512,112], stand:[562,184,526,196],
  play:[548,172,486,182], build:[544,168,470,176], headhit:[566,118,592,88], raised:[560,130,552,104],
  pick:[548,176,516,182], place:[520,166,448,158], takeit:[524,158,456,156], eat:[556,170,580,122], hi5:[548,124,526,100]
};
const FAR_S={agit:[592,118,606,78],work:[588,184,540,192],ears:[606,126,612,108],face:[600,132,594,118],push:[590,186,616,200],hi5:[590,170,556,196],eat:[590,170,556,196]};
const FAR_REST=[590,176,552,195];
const AT_A={seat:[0,1],mid:[190,1],student:[272,1],peer:[118,-1],near:[150,1]};
const UPSET={agit:1,hit:1,push:1,ears:1,face:1,selfhit:1};
const CARD={L:{x:318,y:168},R:{x:440,y:168}};
const HOME={timer:{x:379,y:112},tabletTable:{x:190,y:184},tabletNear:{x:478,y:184},green:{x:380,y:164},brkDesk:{x:508,y:188},brkMid:{x:400,y:160},sheet:{x:488,y:176}};
const RA_BX={1:[436],2:[400,470],3:[380,426,472]};
const TRAY={x:516,y:188};           // where a block is picked up
const ALT='The assessment room: the assessor, the student and the data collector';
function clockHands(s){const m=/^(\d{1,2}):(\d{2})/.exec(s||'');if(!m)return [0,0];const h=+m[1],mi=+m[2];return [((h%12)*30+mi*0.5),mi*6];}
function raBinX(f,i){const xs=RA_BX[f.bins]||RA_BX[1];return xs[Math.max(0,Math.min(xs.length-1,i||0))];}
const f1=v=>(+v).toFixed(1);
/*BOARDS*/
/*EXT*/
const X=(typeof EXT==='object'&&EXT)||{};
if(X.poseA)Object.assign(POSE_A,X.poseA);if(X.poseS)Object.assign(POSE_S,X.poseS);

/* ---- the people: proportions, drawn once, moved by the rig ----
   A figure faces right (the adult) or left (the student, the observers). Its shoulder
   point is the one the stories' poses were written for; the hand target comes from the
   pose and the elbow from inverse kinematics, so the arm bends like an arm. */
const FIG={
  adult:{sh:A,head:{x:118,y:98,r:24},hair:'short',face:1,l1:62,l2:60,w1:17,w2:14,hand:7.5,hip:{x:120,y:204},knee:{x:206,y:210},foot:{x:214,y:256},chairX:70,skin:'var(--skin)',cloth:'var(--adultc)',cls:'adult'},
  student:{sh:B,head:{x:598,y:108,r:20},hair:'kid',face:-1,l1:50,l2:48,w1:13,w2:11,hand:6.5,hip:{x:572,y:204},knee:{x:500,y:210},foot:{x:492,y:256},chairX:636,skin:'var(--skin)',cloth:'var(--childc)',cls:'student'}
};
/* two-bone IK: elbow for a shoulder S, hand H, bone lengths l1 l2; bend picks the side.
   Beyond reach the figure leans (the torso follows the hand) and the arm stretches a little. */
function ik(S,H,l1,l2,bend){
  let dx=H.x-S.x,dy=H.y-S.y,d=Math.hypot(dx,dy)||0.001;
  const max=(l1+l2)*0.995;let lean=0;
  if(d>max){lean=d-max;d=max;}
  const ux=dx/Math.hypot(dx,dy),uy=dy/Math.hypot(dx,dy);
  const sx=S.x+ux*lean,sy=S.y+uy*lean;            // the shoulder after the lean
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  const mx=sx+ux*a,my=sy+uy*a;
  return {sx,sy,ex:mx-uy*h*bend,ey:my+ux*h*bend,lean,ux,uy};
}
/* a limb as a tapered filled shape with round ends */
function limb(x1,y1,x2,y2,w1,w2){
  const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  const a=w1/2,b=w2/2;
  return 'M'+f1(x1+nx*a)+' '+f1(y1+ny*a)+' L'+f1(x2+nx*b)+' '+f1(y2+ny*b)+' A'+f1(b)+' '+f1(b)+' 0 0 1 '+f1(x2-nx*b)+' '+f1(y2-ny*b)+' L'+f1(x1-nx*a)+' '+f1(y1-ny*a)+' A'+f1(a)+' '+f1(a)+' 0 0 1 '+f1(x1+nx*a)+' '+f1(y1+ny*a)+' Z';
}
function figureSVG(k){
  const g=FIG[k],hd=g.head,s=g.face;      // s: +1 faces right, -1 faces left
  const hairPath=g.hair==='short'
    ?'M'+(hd.x-hd.r-1)+' '+(hd.y-4)+' q2 -24 '+(hd.r+1)+' -25 q'+(hd.r-2)+' 1 '+(hd.r+1)+' 18 q-10 -9 -24 -6 q-12 2 -26 13 z'
    :'M'+(hd.x-hd.r-2)+' '+(hd.y+2)+' q0 -26 '+(hd.r+2)+' -27 q'+(hd.r+1)+' 1 '+(hd.r+1)+' 20 q-6 -8 -16 -8 l-2 7 q-9 -5 -16 -3 q-6 3 -6 11 z';
  const ex=hd.x+s*7,ey=hd.y-4,ex2=hd.x+s*16;
  return '<g class="fig '+g.cls+'">'+
    '<ellipse class="shadow" cx="'+(g.hip.x+s*34)+'" cy="258" rx="58" ry="7"/>'+
    '<g class="legs"><path class="leg far" d=""/><path class="leg near" d=""/><path class="shoe far" d=""/><path class="shoe near" d=""/></g>'+
    '<g class="arm far"><path class="upper" d=""/><path class="fore" d=""/><circle class="hnd" r="'+g.hand+'"/></g>'+
    '<g class="body"><path class="torso" d="M'+(g.sh.x-s*52)+' '+(g.sh.y-4)+' q'+(s*26)+' -14 '+(s*56)+' -1 l'+(s*4)+' 76 l'+(-s*66)+' 0 z"/>'+
      '<path class="collar" d="M'+(g.sh.x-s*34)+' '+(g.sh.y-5)+' q'+(s*10)+' 8 '+(s*20)+' 0"/>'+
      '<path class="neck" d="M'+(hd.x-s*5)+' '+(hd.y+hd.r-6)+' l0 11 l'+(s*12)+' 0 l0 -12 z"/>'+
    '</g>'+
    '<g class="head" data-cx="'+hd.x+'" data-cy="'+(hd.y+hd.r)+'">'+
      '<circle class="skull" cx="'+hd.x+'" cy="'+hd.y+'" r="'+hd.r+'"/>'+
      '<circle class="ear" cx="'+(hd.x-s*(hd.r-2))+'" cy="'+(hd.y+2)+'" r="'+(hd.r*0.2)+'"/>'+
      '<path class="hair" d="'+hairPath+'"/>'+
      '<g class="face"><ellipse class="white" cx="'+ex+'" cy="'+ey+'" rx="3.4" ry="2.8"/><ellipse class="white" cx="'+ex2+'" cy="'+ey+'" rx="3.4" ry="2.8"/>'+
        '<circle class="iris" cx="'+ex+'" cy="'+ey+'" r="1.8"/><circle class="iris" cx="'+ex2+'" cy="'+ey+'" r="1.8"/>'+
        '<rect class="lid" x="'+(ex-4)+'" y="'+(ey-3.2)+'" width="8" height="0"/><rect class="lid" x="'+(ex2-4)+'" y="'+(ey-3.2)+'" width="8" height="0"/>'+
        '<path class="brow" d="M'+(ex-3.5)+' '+(ey-6)+' q3.5 -2 7 -0.5 M'+(ex2-3.5)+' '+(ey-6.5)+' q3.5 -1.5 7 0"/>'+
        '<path class="nose" d="M'+(hd.x+s*12)+' '+(ey+2)+' q'+(s*3)+' 5 '+(s*0.5)+' 7"/>'+
        '<path class="mouth" d="M'+(hd.x+s*5)+' '+(hd.y+10)+' q'+(s*6)+' 4 '+(s*12)+' 0"/>'+
        '<ellipse class="talk" cx="'+(hd.x+s*11)+'" cy="'+(hd.y+11)+'" rx="4" ry="3"/>'+
      '</g>'+
      (k==='student'?'<g class="tears"><path d="M'+(ex-1)+' '+(ey+6)+' q-3 6 0 9 q3 -3 0 -9 z"/></g><g class="helmet"><path class="hm" d="M'+(hd.x-24)+' '+(hd.y-7)+' a24 23 0 0 1 48 0 z"/><path class="hb" d="M'+(hd.x-27)+' '+(hd.y-7)+' l54 0"/></g>':'')+
    '</g>'+
    '<g class="arm near"><path class="upper" d=""/><path class="fore" d=""/><circle class="hnd" r="'+g.hand+'"/><path class="thumb" d=""/></g>'+
    (k==='adult'?'<g class="clip"><path d="M84 214 l40 -8 l6 30 l-40 8 z"/><path class="lines" d="M92 220 l24 -5 M94 228 l24 -5 M96 236 l16 -3"/></g><g class="watch"><circle cx="0" cy="0" r="14"/><rect x="-3" y="-18" width="6" height="5" rx="1"/><text class="wt" x="0" y="4" text-anchor="middle">0.0</text></g>':'')+
    (k==='student'?'<g class="pb"><path d="M626 62 l6 12 l14 -6 l-6 14 l14 6 l-14 6 l6 14 l-14 -6 l-6 12 l-6 -12 l-14 6 l6 -14 l-14 -6 l14 -6 l-6 -14 l14 6 z"/><text x="626" y="98" text-anchor="middle">!</text></g><g class="motion"><path d="M552 66 l-8 -10 M548 90 l-12 -2 M606 66 l8 -10 M610 90 l12 -2"/></g><g class="impact"><path d="M420 128 l-9 -7 M416 142 l-12 0 M420 156 l-9 7"/></g>':'')+
  '</g>';
}
/* the observer (the data collector) and a second observer: seated side-on at the right, legs out */
function observerSVG(cls){
  return '<g class="'+cls+'"'+(cls==='obs2'?' transform="translate(850 0) scale(-1 1)"':'')+'>'+
    '<ellipse class="shadow" cx="790" cy="258" rx="52" ry="6.5"/>'+
    '<g class="ochair"><rect class="cb" x="816" y="146" width="14" height="114" rx="4"/><rect class="cs" x="760" y="202" width="70" height="11" rx="3"/><rect class="cl" x="766" y="213" width="9" height="47" rx="2"/><rect class="cl" x="818" y="213" width="9" height="47" rx="2"/></g>'+
    '<path class="leg" d="'+limb(806,208,772,212,22,18)+'"/><path class="leg" d="'+limb(772,212,768,252,18,15)+'"/><path class="shoe" d="M752 258 q2 -10 16 -10 l6 10 z"/>'+
    '<g class="arm far"><path class="upper" d="'+limb(802,150,790,182,14,12)+'"/><path class="fore" d="'+limb(790,182,764,174,12,10)+'"/><circle class="hnd" cx="764" cy="174" r="6"/></g>'+
    '<g class="body"><path class="torso" d="M770 140 q28 -16 56 -1 l4 70 l-62 0 z"/><path class="neck" d="M800 118 l0 12 l12 0 l0 -12 z"/></g>'+
    '<g class="head"><circle class="skull" cx="806" cy="102" r="21"/><circle class="ear" cx="825" cy="104" r="4"/><path class="hair" d="M784 98 q2 -22 22 -23 q18 1 21 16 q-10 -8 -24 -5 q-12 3 -19 12 z"/>'+
      '<g class="face"><ellipse class="white" cx="799" cy="98" rx="3.2" ry="2.6"/><ellipse class="white" cx="790" cy="98" rx="3.2" ry="2.6"/><circle class="iris" cx="798" cy="98" r="1.7"/><circle class="iris" cx="789" cy="98" r="1.7"/>'+
      '<rect class="lid" x="795" y="95" width="8" height="0"/><rect class="lid" x="786" y="95" width="8" height="0"/><path class="brow" d="M786 92 q4 -2 7 0 M795 92 q4 -2 7 0"/><path class="mouth" d="M789 111 q5 3 10 0"/></g></g>'+
    '<g class="arm near"><path class="upper" d="'+limb(798,150,776,178,15,13)+'"/><g class="lower"><path class="fore" d="'+limb(776,178,752,166,13,11)+'"/><circle class="hnd" cx="752" cy="166" r="6.5"/><path class="finger" d="M748 164 l-6 -3"/></g></g>'+
    '<g class="otab" transform="translate(742 150) rotate(-18)"><rect class="bz" x="-26" y="-20" width="52" height="40" rx="4"/><rect class="scr" x="-22" y="-16" width="44" height="32" rx="2"/><rect class="glow" x="-22" y="-16" width="44" height="32" rx="2"/></g>'+
    '<g class="snd"><path d="M704 132 q-6 9 0 18 M697 127 q-9 14 0 28"/></g><g class="vib"><path d="M726 182 l-5 5 M738 184 l-5 5 M750 186 l-5 5"/></g>'+
  '</g>';
}
function svg(){return `
<svg viewBox="${X.viewBox||'0 0 880 316'}" class="tbl v2" role="img" aria-label="${X.alt||ALT}">
  <defs>
    <linearGradient id="v2wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8faf9"/><stop offset="1" stop-color="#e6ecea"/></linearGradient>
    <linearGradient id="v2floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ded9"/><stop offset="1" stop-color="#c3cdc7"/></linearGradient>
    <linearGradient id="v2wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eadcb9"/><stop offset="1" stop-color="#d7c49e"/></linearGradient>
    <linearGradient id="v2cloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    <radialGradient id="v2light" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="v2blur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="v2soft" x="-10%" y="-10%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>
  </defs>
  <style>
    .v2 .wall{fill:url(#v2wall)} .v2 .light{fill:url(#v2light)} .v2 .rail{fill:none;stroke:#d8e0dd;stroke-width:1.2} .v2 .base{fill:#cfd8d4}
    .v2 .floor{fill:url(#v2floor)} .v2 .floorline{fill:none;stroke:#b7c2bc;stroke-width:1;opacity:.6}
    .v2 .shadow{fill:#1a2933;opacity:.16;filter:url(#v2blur)} .v2 .pshadow{fill:#1a2933;opacity:.14;filter:url(#v2soft)}
    .v2 .frame rect.f{fill:#fff;stroke:#b9c6c2;stroke-width:2} .v2 .frame .art{fill:#dbe7e3} .v2 .frame .art2{fill:#a9c6c0}
    .v2 .plant .pot{fill:#b58a63} .v2 .plant .pot2{fill:#9c7452} .v2 .plant .leaf{fill:#5f9470} .v2 .plant .leaf2{fill:#4b7d5b}
    .v2 .chair .cb,.v2 .chair .cs,.v2 .chair .cl,.v2 .ochair .cb,.v2 .ochair .cs,.v2 .ochair .cl{fill:#b9c5c1} .v2 .chair .cs,.v2 .ochair .cs{fill:#c6d1cd} .v2 .chair .cl,.v2 .ochair .cl{fill:#a6b3af}
    .v2 .tablegrp .top{fill:url(#v2wood)} .v2 .tablegrp .edge{fill:#c8b48c} .v2 .tablegrp .leg{fill:#b9a684} .v2 .tablegrp .legb{fill:#a89573} .v2 .tablegrp .gloss{fill:#fff;opacity:.18}
    .v2 .fig .torso{fill:var(--adultc)} .v2 .student .torso,.v2 .peerfig .torso{fill:var(--childc)} .v2 .observer .torso{fill:var(--obsc)} .v2 .obs2 .torso{fill:var(--obs2c)}
    .v2 .fig .collar{fill:none;stroke:#fff;stroke-opacity:.35;stroke-width:2} .v2 .neck,.v2 .skull,.v2 .ear,.v2 .hnd{fill:var(--skin)} .v2 .neck{fill:#d9b592}
    .v2 .hair{fill:#3b2f2a} .v2 .student .hair,.v2 .peerfig .hair{fill:#6b4a2f} .v2 .observer .hair,.v2 .obs2 .hair{fill:#5a4a44}
    .v2 .white{fill:#fff} .v2 .iris{fill:#2d2622} .v2 .lid{fill:var(--skin)} .v2 .brow,.v2 .nose,.v2 .mouth{fill:none;stroke:#2d2622;stroke-width:1.5;stroke-linecap:round} .v2 .nose{stroke-width:1.1;opacity:.55}
    .v2 .mouth.open{fill:#2d2622} .v2 .talk{fill:#2d2622;display:none}
    .v2 .arm .upper,.v2 .arm .fore{fill:var(--adultc)} .v2 .student .arm .upper,.v2 .student .arm .fore,.v2 .peerfig .arm .upper,.v2 .peerfig .arm .fore{fill:var(--childc)} .v2 .observer .arm .upper,.v2 .observer .arm .fore{fill:var(--obsc)} .v2 .obs2 .arm .upper,.v2 .obs2 .arm .fore{fill:var(--obs2c)}
    .v2 .arm.far{opacity:.62} .v2 .thumb,.v2 .finger{fill:none;stroke:var(--skin);stroke-width:3.2;stroke-linecap:round}
    .v2 .leg{fill:var(--adultc)} .v2 .student .leg,.v2 .peerfig .leg{fill:var(--childc)} .v2 .observer .leg{fill:var(--obsc)} .v2 .obs2 .leg{fill:var(--obs2c)} .v2 .leg.far{opacity:.6} .v2 .shoe{fill:#2a2a2e} .v2 .shoe.far{opacity:.6}
    .v2 .clip path{fill:var(--surface);stroke:var(--rule2);stroke-width:1.5} .v2 .clip .lines{fill:none;stroke:var(--rule)}
    .v2 .pb path{fill:var(--red)} .v2 .pb text{font:700 14px var(--sans);fill:#fff} .v2 .motion path{stroke:var(--red);stroke-width:2;stroke-linecap:round;fill:none} .v2 .impact path{fill:none;stroke:var(--red);stroke-width:2.4;stroke-linecap:round}
    .v2 .peerfig .helmet,.v2 .peerfig .tears,.v2 .peerfig .pb,.v2 .peerfig .motion,.v2 .peerfig .impact{display:none}
    .v2 .tears path{fill:#8fc3e6} .v2 .helmet .hm{fill:#c9d4e3} .v2 .helmet .hb{stroke:#7a8aa0;stroke-width:3;fill:none}
    .v2 .otab .bz{fill:var(--navy)} .v2 .otab .scr{fill:var(--sage)} .v2 .otab .glow{fill:#fff;opacity:0} .v2 .otab.alert .scr{fill:#f0c89c;animation:wkflash 1.1s ease-in-out infinite} .v2 .otab.rec .glow{opacity:.12}
    .v2 .snd path,.v2 .vib path{fill:none;stroke:var(--amber);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    .v2 .obsc .bz{fill:var(--navy)} .v2 .obsc .scr{fill:#fff} .v2 .obsc .tail{fill:none;stroke:var(--navy);stroke-width:1.5;stroke-dasharray:3 3}
    .v2 .obsc .t1{font:600 11px var(--sans);fill:var(--muted)} .v2 .obsc .t2{font:700 15px var(--sans);fill:var(--navy)} .v2 .obsc .t3{font:500 10.5px var(--sans);fill:var(--muted)}
    .v2 .obsc.alert .scr{fill:#fbe6cf;animation:wkflash 1.1s ease-in-out infinite} .v2 .obsc.alert .t2{fill:var(--amber)} .v2 .obsc.rec .t2{fill:var(--slate)} .v2 .obsc.ok .t2{fill:var(--green)} .v2 .obsc.skip .t2{fill:var(--muted)}
    .v2 .clock .cf{fill:#fff;stroke:var(--navy);stroke-width:2} .v2 .clock .tk{stroke:var(--navy);stroke-width:1.6} .v2 .clock .hh{stroke:var(--navy);stroke-width:3;stroke-linecap:round} .v2 .clock .mh{stroke:var(--navy);stroke-width:2;stroke-linecap:round} .v2 .clock .pin{fill:var(--navy)} .v2 .clock .ct{font:700 11px var(--sans);fill:var(--navy)}
    .v2 .pmat .pm{fill:var(--rule);stroke:rgba(0,0,0,.18);stroke-width:1} .v2 .pmat.red .pm{fill:var(--pm-red)} .v2 .pmat.blue .pm{fill:var(--pm-blue)} .v2 .pmat.green .pm{fill:var(--pm-green)} .v2 .pmat.gray .pm{fill:var(--pm-gray)} .v2 .pmat.gold .pm{fill:var(--pm-gold)} .v2 .pmat .pe{fill:#fff;opacity:.18}
    .v2 .ra-bin .bb{fill:#8fa6a2} .v2 .ra-bin .bi{fill:#6d8480} .v2 .ra-bin .bf{fill:#a4b8b4} .v2 .ra-bin .bl{stroke:#587170;stroke-width:1.5}
    .v2 .k1{fill:#c9573f} .v2 .k2{fill:#3f74b8} .v2 .k3{fill:#e2a93b} .v2 .kt{fill:#fff;opacity:.28}
    .v2 .ra-tag .tl{stroke:var(--navy);stroke-width:1.2;stroke-dasharray:3 3;fill:none} .v2 .ra-tag .tbx{fill:#fff;stroke:var(--navy);stroke-width:1.5} .v2 .ra-tag .t1{font:700 11px var(--sans);fill:var(--navy)} .v2 .ra-tag .t2{font:500 10px var(--sans);fill:var(--muted)}
    .v2 .ra-tray .tb{fill:#9aa8a4} .v2 .ra-tray .tr{fill:#b7c3bf} .v2 .ra-cup .cp{fill:#e8e4dc;stroke:#cfc9bf;stroke-width:1} .v2 .ra-cup .cw{fill:#d2493f} .v2 .ra-cup .cl{stroke:#b9b2a6;stroke-width:1.5}
    .v2 .ra-chew .cw{fill:#d2493f} .v2 .ra-chew .ch{stroke:#fff;stroke-width:1.4;stroke-linecap:round} .v2 .ra-clap path{fill:none;stroke:var(--amber);stroke-width:2.4;stroke-linecap:round}
    .v2 .ra-switch .sb{fill:#333} .v2 .ra-switch .sd{fill:#d2493f} .v2 .ra-switch .ry{stroke:var(--amber);stroke-width:2;stroke-linecap:round}
    .v2 .tablet .bz{fill:#1f2a33} .v2 .tablet .scr{fill:#a9d2cf} .v2 .tablet.on .scr{fill:#7fd0ff} .v2 .tablet .ra-play{fill:#fff} .v2 .tablet .vid rect{fill:#fff;opacity:.55} .v2 .tablet .ring{fill:none;stroke:#fff;stroke-width:2}
    .v2 .timer .face{fill:#fff;stroke:var(--navy);stroke-width:2} .v2 .timer .wedge{fill:var(--red);opacity:.8} .v2 .timer .pin{fill:var(--navy)} .v2 .timer .stand{stroke:var(--rule2);stroke-width:3;fill:var(--rule2)} .v2 .timer .tt{font:700 12px var(--sans);fill:var(--navy)}
    .v2 .spinner .face{fill:#fff;stroke:var(--navy);stroke-width:2} .v2 .spinner .sector{fill:var(--sage)} .v2 .spinner .needle{stroke:var(--red);stroke-width:2.5;stroke-linecap:round} .v2 .spinner .pin{fill:var(--navy)} .v2 .spinner .stand{stroke:var(--rule2);stroke-width:3;fill:var(--rule2)}
    .v2 .pcard rect{fill:#fff;stroke:var(--rule2);stroke-width:2} .v2 .pcard .t1{font:600 12px var(--sans);fill:var(--navy)} .v2 .pcard .t2{font:10px var(--sans);fill:var(--muted)} .v2 .pcard .sel{fill:none;stroke:var(--amber);stroke-width:2.5;display:none} .v2 .pcard.chosen .sel{display:block} .v2 .pcard.dim{opacity:.4}
    .v2 .arr rect{fill:var(--surface);stroke:var(--rule2);stroke-width:2} .v2 .arr text{font:600 11px var(--sans);fill:var(--navy)} .v2 .arr .t2{font:9.5px var(--sans);fill:var(--muted)} .v2 .arr .gone rect,.v2 .arr .gone text{opacity:.45} .v2 .arr circle{fill:var(--navy)} .v2 .arr .rk{fill:#fff;font:700 11px var(--sans)}
    .v2 .wsheet path{fill:#fff;stroke:var(--rule2);stroke-width:1.5} .v2 .wsheet .lines{fill:none;stroke:var(--rule)} .v2 .wsheet .st{font:600 11px var(--sans);fill:var(--navy)}
    .v2 .tiles rect{fill:var(--sage);stroke:var(--teal);stroke-width:1} .v2 .book path{fill:#fff;stroke:var(--rule2);stroke-width:1.5} .v2 .book line{stroke:var(--rule2)}
    .v2 .green rect{fill:var(--green)} .v2 .green text{font:700 10px var(--sans);fill:#fff} .v2 .brk rect{fill:var(--amber)} .v2 .brk text{font:700 9px var(--sans);fill:#fff}
    .v2 .tokb .bd{fill:#fff;stroke:var(--rule2);stroke-width:1.5} .v2 .tokb .tk{fill:none;stroke:var(--rule2);stroke-width:1.5} .v2 .tokb .tk.on{fill:var(--amber);stroke:var(--amber)} .v2 .tokb .bl{font:600 10px var(--sans);fill:var(--navy)}
    .v2 .laptop .lid{fill:#2a3a48} .v2 .laptop .scr{fill:#cfe4ea} .v2 .laptop .base{fill:#3e4f5c} .v2 .bin .bx{fill:#6b8a94} .v2 .bin .lip{fill:#52707a} .v2 .bin text{font:700 10px var(--sans);fill:#fff}
    .v2 .note rect{fill:#fff6c4;stroke:#d9c86a} .v2 .note text{font:600 10px var(--sans);fill:var(--ink)} .v2 .psheet path{fill:#fff;stroke:var(--rule2);stroke-width:1.5} .v2 .psheet .lines{fill:none;stroke:var(--rule)}
    .v2 .toys .b1{fill:#c9573f} .v2 .toys .b2{fill:#3f74b8} .v2 .toys .b3{fill:#e2a93b} .v2 .toys .ball{fill:#d2493f} .v2 .toys .bl{fill:none;stroke:#fff;stroke-width:2} .v2 .toys .car{fill:#3f74b8} .v2 .toys .wh{fill:#333} .v2 .toys .cw{fill:#cfe4ea}
    .v2 .mag .pg{fill:#fff;stroke:var(--rule2);stroke-width:1.2} .v2 .mag .ln{fill:none;stroke:var(--rule)}
    .v2 .fmat{fill:#9fb3c7} .v2 .wall1 .wl{fill:#b9c5c1} .v2 .wall1 .gl{fill:#dbe9ee} .v2 .wall1 .gs{stroke:#fff;stroke-width:2;opacity:.7} .v2 .fov,.v2 .fov2{fill:var(--sage);opacity:.12}
    .v2 .board .bz{fill:var(--navy)} .v2 .board .in{fill:#fff}
    .v2 .ra-lad text{font:600 10px var(--sans)} .v2 .ra-held .kt{opacity:.35}
    .v2 .door .dp{fill:#c8b48c} .v2 .door .dk{fill:#555} .v2 .alarm .bx{fill:#c0392b} .v2 .alarm .bell{fill:#fff} .v2 .alarm .wv{fill:none;stroke:#c0392b;stroke-width:2} .v2 .alarm .al{font:700 9px var(--sans);fill:#c0392b}
    .v2 .screen .sz{fill:var(--navy)} .v2 .screen .sin{fill:#fff}
  </style>
  <rect class="wall" x="0" y="0" width="880" height="262"/>
  <ellipse class="light" cx="440" cy="0" rx="520" ry="230"/>
  <line class="rail" x1="0" y1="178" x2="880" y2="178"/>
  <rect class="base" x="0" y="252" width="880" height="8"/>
  <rect class="floor" x="0" y="258" width="880" height="58"/>
  <line class="floorline" x1="0" y1="286" x2="880" y2="286"/>
  <g class="frame" transform="translate(28 18)"><rect class="f" x="0" y="0" width="72" height="50" rx="2"/><rect class="art" x="6" y="6" width="60" height="38"/><path class="art2" d="M6 44 l18 -20 l12 12 l10 -8 l20 16 z"/></g>
  <g class="plant" transform="translate(34 258)"><ellipse class="pshadow" cx="4" cy="2" rx="22" ry="4"/><path class="pot" d="M-14 0 l28 0 l-4 -24 l-20 0 z"/><rect class="pot2" x="-16" y="-28" width="32" height="6" rx="2"/><path class="leaf" d="M0 -28 q-26 -22 -14 -50 q14 20 14 50 z"/><path class="leaf2" d="M0 -28 q22 -24 14 -54 q-14 24 -14 54 z"/><path class="leaf" d="M0 -28 q-2 -32 10 -46 q4 24 -10 46 z"/></g>
  <!-- the room's other fittings, kept for the forms that use them -->
  <g class="abcw"><path class="fov" d="M790 98 L140 24 L140 252 Z"/><g class="clock" transform="translate(536 42)"><circle class="cf" r="18"/><path class="tk" d="M0 -15 v4 M15 0 h-4 M0 15 v-4 M-15 0 h4"/><line class="hh" x1="0" y1="0" x2="0" y2="-9"/><line class="mh" x1="0" y1="0" x2="0" y2="-14"/><circle class="pin" r="1.8"/><text class="ct" x="0" y="34" text-anchor="middle"></text></g><g class="alarm" transform="translate(612 40)"><path class="wv" d="M-20 -9 q-6 9 0 18 M-27 -14 q-9 14 0 28 M20 -9 q6 9 0 18 M27 -14 q9 14 0 28"/><rect class="bx" x="-13" y="-13" width="26" height="26" rx="4"/><circle class="bell" r="7"/><text class="al" x="0" y="26" text-anchor="middle">FIRE</text></g><g class="door" transform="translate(690 60)"><rect class="dp" x="0" y="0" width="64" height="196" rx="2"/><circle class="dk" cx="54" cy="104" r="3"/></g><g class="screen"><rect class="sz" x="200" y="14" width="300" height="140" rx="6"/><rect class="sin" x="208" y="22" width="284" height="124" rx="2"/><g class="sc" transform="translate(210 26)"></g></g></g>
  <g class="eaw"><rect class="fmat" x="512" y="251" width="196" height="9" rx="3"/><g class="board"><rect class="bz" x="200" y="14" width="500" height="178" rx="6"/><rect class="in" x="208" y="22" width="484" height="162" rx="2"/><g class="bc" transform="translate(210 26)"></g></g><path class="fov2" d="M790 100 L596 70 L596 246 Z"/><g class="wall1"><rect class="wl" x="698" y="74" width="18" height="186"/><rect class="gl" x="695" y="96" width="24" height="92" rx="2"/><path class="gs" d="M699 118 l16 -14 M699 146 l16 -14 M699 174 l16 -14"/></g></g>
  <g class="chair chair-a"><rect class="cb" x="68" y="146" width="14" height="114" rx="4"/><rect class="cs" x="68" y="202" width="72" height="11" rx="3"/><rect class="cl" x="74" y="213" width="9" height="47" rx="2"/><rect class="cl" x="126" y="213" width="9" height="47" rx="2"/></g>
  <g class="chair chair-s"><rect class="cb" x="636" y="156" width="14" height="104" rx="4"/><rect class="cs" x="580" y="202" width="72" height="11" rx="3"/><rect class="cl" x="586" y="213" width="9" height="47" rx="2"/><rect class="cl" x="638" y="213" width="9" height="47" rx="2"/></g>
  <g class="peer" transform="translate(720 0) scale(-1 1)">${figureSVG('student').replace('class="fig student"','class="fig peerfig"')}</g>
  <g class="prop psheet" transform="translate(224 189)"><path d="M-30 -7 l56 0 l6 14 l-56 0 z"/><path class="lines" d="M-22 -2 l34 0 M-20 3 l34 0"/></g>
  <g class="adult-at">${figureSVG('adult')}</g>
  <!-- the table: a top face in perspective, a front edge, legs, and its shadow on the floor -->
  <g class="tablegrp"><ellipse class="pshadow" cx="360" cy="260" rx="200" ry="6"/><rect class="legb" x="200" y="200" width="9" height="56"/><rect class="legb" x="512" y="200" width="9" height="56"/><path class="top" d="M190 188 L530 188 L550 204 L170 204 Z"/><path class="gloss" d="M196 189 L524 189 L536 196 L184 196 Z"/><rect class="edge" x="170" y="204" width="380" height="10" rx="2"/><rect class="leg" x="182" y="214" width="10" height="46"/><rect class="leg" x="528" y="214" width="10" height="46"/></g>
  <g class="prop pmat"><path class="pm" d="M404 190 l136 0 l8 11 l-136 0 z"/><path class="pe" d="M406 191 l130 0 l3 4 l-130 0 z"/></g>
  <g class="prop ra-cup" transform="translate(240 198)"><ellipse class="pshadow" cx="0" cy="2" rx="14" ry="3"/><path class="cp" d="M-12 -22 l24 0 l-3 22 l-18 0 z"/><rect class="cw" x="-9" y="-27" width="9" height="6" rx="2.5"/><rect class="cw" x="1" y="-28" width="9" height="6" rx="2.5" transform="rotate(14 5 -25)"/><path class="cl" d="M-12 -22 l24 0"/></g>
  <g class="prop ra-bins"></g>
  <g class="prop ra-tray" transform="translate(516 198)"><ellipse class="pshadow" cx="0" cy="2" rx="28" ry="3.5"/><path class="tb" d="M-26 -9 l52 0 l-3 9 l-46 0 z"/><rect class="tr" x="-27" y="-11" width="54" height="3" rx="1"/><rect class="k1" x="-21" y="-19" width="9" height="9" rx="1.5"/><rect class="k2" x="-11" y="-20" width="9" height="9" rx="1.5"/><rect class="k3" x="-1" y="-19" width="9" height="9" rx="1.5"/><rect class="k1" x="9" y="-20" width="9" height="9" rx="1.5"/><rect class="k2" x="-6" y="-27" width="9" height="9" rx="1.5"/><rect class="k3" x="4" y="-27" width="9" height="9" rx="1.5"/></g>
  <g class="prop ra-switch" transform="translate(436 198) scale(1.3)"><path class="ry" d="M-24 -26 l-7 -6 M0 -34 l0 -9 M24 -26 l7 -6"/><path class="sd" d="M-10 -10 q10 -16 20 0 z"/><rect class="sb" x="-18" y="-10" width="36" height="10" rx="2"/></g>
  <g class="prop timer"><line class="stand" x1="0" y1="19" x2="0" y2="84"/><rect class="stand" x="-14" y="82" width="28" height="4" rx="2"/><circle class="face" cx="0" cy="0" r="19"/><path class="wedge" d=""/><circle class="pin" cx="0" cy="0" r="2"/><text class="tt" x="24" y="4" text-anchor="start"></text></g>
  <g class="prop spinner"><line class="stand" x1="0" y1="19" x2="0" y2="84"/><rect class="stand" x="-14" y="82" width="28" height="4" rx="2"/><circle class="face" cx="0" cy="0" r="19"/><path class="sector" d=""/><line class="needle" x1="0" y1="0" x2="0" y2="-15"/><circle class="pin" cx="0" cy="0" r="2"/></g>
  <g class="prop pcard L"><rect x="-42" y="-25" width="84" height="50" rx="4"/><text class="t1" x="0" y="-3" text-anchor="middle"></text><text class="t2" x="0" y="14" text-anchor="middle"></text><rect class="sel" x="-46" y="-29" width="92" height="58" rx="6"/></g>
  <g class="prop pcard R"><rect x="-42" y="-25" width="84" height="50" rx="4"/><text class="t1" x="0" y="-3" text-anchor="middle"></text><text class="t2" x="0" y="14" text-anchor="middle"></text><rect class="sel" x="-46" y="-29" width="92" height="58" rx="6"/></g>
  <g class="prop arr"></g>
  <g class="prop wsheet"><path d="M-48 -12 l96 0 l8 24 l-96 0 z"/><path class="lines" d="M-36 -4 l60 0 M-34 4 l60 0 M-32 12 l40 0"/><text class="st" x="-30" y="2"></text></g>
  <g class="prop tiles"><rect x="-26" y="-12" width="12" height="12"/><rect x="-10" y="-14" width="12" height="14"/><rect x="6" y="-10" width="12" height="10"/><rect x="20" y="-16" width="12" height="16"/></g>
  <g class="prop tokb"><rect class="bd" x="-48" y="-17" width="96" height="34" rx="5"/><circle class="tk" cx="-36" cy="-8" r="6"/><circle class="tk" cx="-18" cy="-8" r="6"/><circle class="tk" cx="0" cy="-8" r="6"/><circle class="tk" cx="18" cy="-8" r="6"/><circle class="tk" cx="36" cy="-8" r="6"/><circle class="tk" cx="-36" cy="8" r="6"/><circle class="tk" cx="-18" cy="8" r="6"/><circle class="tk" cx="0" cy="8" r="6"/><circle class="tk" cx="18" cy="8" r="6"/><circle class="tk" cx="36" cy="8" r="6"/><text class="bl" x="0" y="-23" text-anchor="middle"></text></g>
  <g class="prop book"><path d="M-20 -14 l18 -3 l18 3 l0 18 l-18 -3 l-18 3 z"/><line x1="-2" y1="-17" x2="-2" y2="1"/></g>
  <g class="prop green"><rect x="-13" y="-17" width="26" height="34" rx="3"/><text x="0" y="4" text-anchor="middle">GO</text></g>
  <g class="prop brk"><rect x="-16" y="-11" width="32" height="22" rx="3"/><text x="0" y="4" text-anchor="middle">BREAK</text></g>
  <g class="prop laptop" transform="translate(486 190)"><rect class="lid" x="-26" y="-36" width="52" height="34" rx="2"/><rect class="scr" x="-22" y="-32" width="44" height="26"/><path class="base" d="M-32 -2 l64 0 l6 7 l-76 0 z"/></g>
  <g class="prop bin"><rect class="bx" x="-24" y="-16" width="48" height="32" rx="3"/><rect class="lip" x="-26" y="-18" width="52" height="6" rx="2"/><text x="0" y="8" text-anchor="middle">MATH</text></g>
  <g class="prop note"><rect x="-38" y="-22" width="76" height="44" rx="2"/><text class="n1" x="-31" y="-5"></text><text class="n2" x="-31" y="11"></text></g>
  <g class="prop toys"><g class="lots"><rect class="b1" x="414" y="170" width="15" height="15" rx="2"/><rect class="b2" x="416" y="156" width="12" height="14" rx="2"/><rect class="b3" x="431" y="176" width="14" height="10" rx="2"/></g><circle class="ball" cx="458" cy="181" r="9"/><path class="bl" d="M449 181 q9 -5 18 0"/><path class="car" d="M486 190 l0 -9 q2 -6 9 -6 l12 0 q7 0 9 6 l4 1 l0 8 z"/><circle class="wh" cx="494" cy="191" r="4"/><circle class="wh" cx="513" cy="191" r="4"/><rect class="cw" x="496" y="178" width="9" height="5" rx="1"/></g>
  <g class="prop mag"><path class="pg" d="M-17 -15 l17 4 l0 22 l-17 -4 z"/><path class="pg" d="M0 -11 l17 -4 l0 22 l-17 4 z"/><path class="ln" d="M-13 -9 l9 2 M-13 -4 l9 2 M-13 1 l9 2 M4 -8 l9 -2 M4 -3 l9 -2 M4 2 l9 -2"/></g>
  ${X.svgBack?X.svgBack():''}
  <g class="student-at">${figureSVG('student')}</g>
  ${X.svgFront?X.svgFront():''}
  <!-- what is carried: the block in hand, a block in flight, the chew, the high five, the ratio row, the tablet -->
  <g class="prop tablet"><rect class="bz" x="-18" y="-13" width="36" height="26" rx="3"/><rect class="scr" x="-14" y="-9" width="28" height="18" rx="1"/><g class="vid"><rect x="-11" y="-5" width="9" height="3"/><rect x="-11" y="0" width="14" height="3"/><rect x="-11" y="5" width="7" height="2"/></g><path class="ra-play" d="M-4 -5 l9 5 l-9 5 z"/><circle class="ring" cx="8" cy="3" r="4" stroke-dasharray="25" stroke-dashoffset="0"/></g>
  <g class="ra-held"><rect class="k2" x="-5" y="-5" width="10" height="10" rx="1.5"/><rect class="kt" x="-5" y="-5" width="10" height="3" rx="1"/></g>
  <g class="ra-fly"><rect class="k2" x="-5" y="-5" width="10" height="10" rx="1.5"/><rect class="kt" x="-5" y="-5" width="10" height="3" rx="1"/></g>
  <g class="ra-chew"><rect class="cw" x="-7" y="-4.5" width="14" height="9" rx="3.5"/><path class="ch" d="M-3.5 -1.5 l6 0"/></g>
  <g class="ra-clap"><path d="M-14 -2 l-8 -6 M0 -6 l0 -10 M14 -2 l8 -6"/></g>
  <g class="ra-lad" transform="translate(198 10)"></g>
  ${observerSVG('observer')}${observerSVG('obs2')}
  <g class="obsc R"><path class="tail" d="M752 66 L744 128"/><rect class="bz" x="700" y="4" width="174" height="62" rx="8"/><rect class="scr" x="706" y="10" width="162" height="50" rx="4"/><text class="t1" x="714" y="25"></text><text class="t2" x="714" y="44"></text><text class="t3" x="714" y="57"></text></g>
  <g class="obsc L"><path class="tail" d="M114 66 L108 128"/><rect class="bz" x="6" y="4" width="174" height="62" rx="8"/><rect class="scr" x="12" y="10" width="162" height="50" rx="4"/><text class="t1" x="20" y="25"></text><text class="t2" x="20" y="44"></text><text class="t3" x="20" y="57"></text></g>
</svg>`;}

/* the stations: identical bins with the blocks that have landed in them, and a label */
function binsSVG(f,fill,tagAlpha){
  const xs=RA_BX[f.bins]||[];let g='';
  xs.forEach((x,i)=>{const n=Math.min(3,(fill&&fill[i])||0),tag=f.tags&&f.tags[i];
    g+='<g class="ra-bin" transform="translate('+x+' 198)"><ellipse class="pshadow" cx="0" cy="2" rx="22" ry="3.5"/>';
    g+='<path class="bi" d="M-17 -27 l34 0 l-3 27 l-28 0 z"/>';
    for(let j=0;j<n;j++)g+='<g transform="translate('+(-13+j*9)+' '+(j===1?-35:-33)+')"><rect class="k'+(j%3+1)+'" x="0" y="0" width="9" height="9" rx="1.5"/><rect class="kt" x="0" y="0" width="9" height="3" rx="1"/></g>';
    g+='<path class="bb" d="M-19 -26 l38 0 l-4 26 l-30 0 z" style="opacity:.86"/><path class="bf" d="M-19 -26 l38 0 l0 4 l-38 0 z"/><path class="bl" d="M-20 -26 l40 0"/>';
    const up=f.bins===3&&i===1?36:0;
    if(tag)g+='<g class="ra-tag" style="opacity:'+(tagAlpha==null?1:tagAlpha)+'"><path class="tl" d="M0 -40 L0 '+(-66-up)+'"/><rect class="tbx" x="-31" y="'+(-98-up)+'" width="62" height="32" rx="6"/>'+
      '<text class="t1" x="0" y="'+(-85-up)+'" text-anchor="middle">'+tag[0]+'</text><text class="t2" x="0" y="'+(-72-up)+'" text-anchor="middle">'+(tag[1]||'')+'</text></g>';
    g+='</g>';});
  return g;
}

function make(root){
  root.innerHTML=svg();
  const q=s=>root.querySelector(s), qa=s=>Array.from(root.querySelectorAll(s));
  const fig=(cls)=>{const g=q('.'+cls);return {g,upperN:q('.'+cls+' .arm.near .upper'),foreN:q('.'+cls+' .arm.near .fore'),handN:q('.'+cls+' .arm.near .hnd'),thumb:q('.'+cls+' .arm.near .thumb'),
    upperF:q('.'+cls+' .arm.far .upper'),foreF:q('.'+cls+' .arm.far .fore'),handF:q('.'+cls+' .arm.far .hnd'),
    body:q('.'+cls+' .body'),head:q('.'+cls+' .head'),face:q('.'+cls+' .face'),irises:qa('.'+cls+' .iris'),lids:qa('.'+cls+' .lid'),mouth:q('.'+cls+' .mouth'),brow:q('.'+cls+' .brow'),talk:q('.'+cls+' .talk'),
    legF:q('.'+cls+' .leg.far'),legN:q('.'+cls+' .leg.near'),shoeF:q('.'+cls+' .shoe.far'),shoeN:q('.'+cls+' .shoe.near'),shadow:q('.'+cls+' .shadow')};};
  const el={
    svg:q('svg'),A:fig('adult'),S:fig('student'),adultAt:q('.adult-at'),studentAt:q('.student-at'),
    aClip:q('.adult .clip'),aWatch:q('.adult .watch'),aWatchT:q('.adult .wt'),
    pb:q('.student .pb'),motion:q('.student .motion'),impact:q('.student .impact'),tears:q('.student .tears'),helmet:q('.student .helmet'),
    chairA:q('.chair-a'),chairS:q('.chair-s'),peer:q('.peer'),psheet:q('.prop.psheet'),
    timer:q('.prop.timer'),wedge:q('.prop.timer .wedge'),tt:q('.prop.timer .tt'),spinner:q('.prop.spinner'),sector:q('.prop.spinner .sector'),needle:q('.prop.spinner .needle'),
    cardL:q('.prop.pcard.L'),cardR:q('.prop.pcard.R'),arr:q('.prop.arr'),sheet:q('.prop.wsheet'),sheetT:q('.prop.wsheet .st'),tiles:q('.prop.tiles'),book:q('.prop.book'),green:q('.prop.green'),brk:q('.prop.brk'),
    tablet:q('.prop.tablet'),tabRing:q('.prop.tablet .ring'),tabVid:q('.prop.tablet .vid'),raPlay:q('.prop.tablet .ra-play'),tokb:q('.prop.tokb'),tokBl:q('.prop.tokb .bl'),tks:qa('.prop.tokb .tk'),
    laptop:q('.prop.laptop'),bin:q('.prop.bin'),note:q('.prop.note'),n1:q('.prop.note .n1'),n2:q('.prop.note .n2'),toys:q('.prop.toys'),lots:q('.prop.toys .lots'),mag:q('.prop.mag'),
    pm:q('.prop.pmat'),raCup:q('.prop.ra-cup'),raBins:q('.prop.ra-bins'),raTray:q('.prop.ra-tray'),raSwitch:q('.prop.ra-switch'),raHeld:q('.ra-held'),raFly:q('.ra-fly'),raChew:q('.ra-chew'),raClap:q('.ra-clap'),raLad:q('.ra-lad'),
    clock:q('.abcw .clock'),hh:q('.abcw .clock .hh'),mh:q('.abcw .clock .mh'),clockT:q('.abcw .clock .ct'),fov:q('.abcw .fov'),door:q('.abcw .door'),alarm:q('.abcw .alarm'),screen:q('.abcw .screen'),sc:q('.abcw .screen .sc'),
    fmat:q('.eaw .fmat'),board:q('.eaw .board'),bc:q('.eaw .board .bc'),fov2:q('.eaw .fov2'),wall1:q('.eaw .wall1'),
    obs:q('.observer'),otab:q('.observer .otab'),oArmN:q('.observer .arm.near .lower'),snd:q('.observer .snd'),vib:q('.observer .vib'),obs2:q('.obs2'),callR:q('.obsc.R'),callL:q('.obsc.L'),
    frame:q('.frame'),plant:q('.plant'),table:q('.tablegrp')
  };
  const show=(node,on)=>{if(node)node.style.display=on?'':'none';};
  if(X.refs)X.refs(el,q,qa);
  /* ---- state: every number the drawing reads ---- */
  const cur={magx:0,magy:0,aHx:168,aHy:214,sHx:526,sHy:196,fHx:616,fHy:200,fEx:590,fEy:186,adx:0,sdx:0,sdy:0,aGaze:0,sGaze:0,aTilt:0,sTilt:0,aLean:0,sLean:0,
    tf:0,timx:HOME.timer.x,timy:HOME.timer.y,spin:0,tabx:HOME.tabletTable.x,taby:HOME.tabletTable.y,tabTilt:0,grx:HOME.green.x,gry:HOME.green.y,brx:HOME.brkDesk.x,bry:HOME.brkDesk.y,
    hbx:0,hby:0,chx:240,chy:176,cpx:0,cpy:0,cpa:0,flyx:0,flyy:0,flyOn:0,flyRot:0,oTap:0,binx:330,biny:180,notex:391,notey:176,shx:488,shy:176,shr:0,breath:0,amouth:0};
  let asx=1;                  // the adult faces right (1) or is mirrored (-1)
  let frame=null,prev=null;   // the frame shown, and the one before it
  let token=0;                // cancels a running sequence
  /* ---- drawing ---- */
  function armDraw(F,cfg,S,H,bend,near,lean){
    const r=ik({x:S.x+(lean?lean.x:0),y:S.y+(lean?lean.y:0)},H,cfg.l1,cfg.l2,bend);
    const up=near?F.upperN:F.upperF,fo=near?F.foreN:F.foreF,hn=near?F.handN:F.handF;
    up.setAttribute('d',limb(r.sx,r.sy,r.ex,r.ey,cfg.w1,cfg.w1-2));
    fo.setAttribute('d',limb(r.ex,r.ey,H.x,H.y,cfg.w2+1,cfg.w2-1));
    hn.setAttribute('cx',f1(H.x));hn.setAttribute('cy',f1(H.y));
    if(near&&F.thumb){const dx=H.x-r.ex,dy=H.y-r.ey,d=Math.hypot(dx,dy)||1;F.thumb.setAttribute('d','M'+f1(H.x-dy/d*3)+' '+f1(H.y+dx/d*3)+' l'+f1(dx/d*5-dy/d*3)+' '+f1(dy/d*5+dx/d*3));}
    return r;
  }
  function legsDraw(F,cfg,stand){
    const s=cfg.face,hip={x:cfg.hip.x,y:cfg.hip.y};
    const k=stand?{x:cfg.hip.x-s*4,y:234}:{x:cfg.knee.x,y:cfg.knee.y},ft=stand?{x:cfg.hip.x-s*6,y:cfg.foot.y}:{x:cfg.foot.x,y:cfg.foot.y};
    F.legN.setAttribute('d',limb(hip.x,hip.y,k.x,k.y,cfg.w1+6,cfg.w1+2)+' '+limb(k.x,k.y,ft.x,ft.y,cfg.w1+1,cfg.w1-3));
    F.legF.setAttribute('d',limb(hip.x-s*8,hip.y+2,k.x-s*10,k.y+2,cfg.w1+4,cfg.w1)+' '+limb(k.x-s*10,k.y+2,ft.x-s*12,ft.y,cfg.w1-1,cfg.w1-4));
    F.shoeN.setAttribute('d','M'+(ft.x-s*8)+' 258 q'+(s*2)+' -10 '+(s*18)+' -9 l'+(s*4)+' 9 z');
    F.shoeF.setAttribute('d','M'+(ft.x-s*20)+' 258 q'+(s*2)+' -10 '+(s*18)+' -9 l'+(s*4)+' 9 z');
  }
  function headDraw(F,cfg,gaze,tilt,breath){
    const hd=cfg.head,s=cfg.face;
    F.head.setAttribute('transform','translate(0 '+f1(breath)+') rotate('+f1(tilt)+' '+hd.x+' '+(hd.y+hd.r)+')');
    F.face.setAttribute('transform','translate('+f1(gaze*s*4)+' '+f1(Math.abs(gaze)*1.2)+')');
    F.irises.forEach(i=>i.setAttribute('transform','translate('+f1(gaze*s*1.6)+' 0)'));
  }
  function draw(c){
    const lean={x:0,y:0};
    el.adultAt.setAttribute('transform','translate('+f1(c.adx)+' 0)'+(asx<0?' translate(244 0) scale(-1 1)':''));
    el.studentAt.setAttribute('transform','translate('+f1(c.sdx)+' '+f1(c.sdy)+')');
    /* arms: near arm to its target, far arm resting on the table (the student's far arm takes the pose's far target) */
    const rA=armDraw(el.A,FIG.adult,A,{x:c.aHx,y:c.aHy},1,true,{x:0,y:c.breath*0.6});
    const lA={x:rA.lean*rA.ux*0.9,y:rA.lean*rA.uy*0.5+c.breath*0.6};
    armDraw(el.A,FIG.adult,{x:A.x-8,y:A.y+6},{x:Math.min(c.aHx-16,A.x+34)+lA.x*0.6,y:196},1,false,lA);
    const rS=armDraw(el.S,FIG.student,B,{x:c.sHx,y:c.sHy},-1,true,{x:0,y:c.breath*0.5});
    const lS={x:rS.lean*rS.ux*0.9,y:rS.lean*rS.uy*0.5+c.breath*0.5};
    armDraw(el.S,FIG.student,{x:B.x+6,y:B.y+6},{x:c.fHx+lS.x*0.6,y:c.fHy},-1,false,lS);
    /* the torso follows a long reach */
    el.A.body.setAttribute('transform','translate('+f1(rA.lean*rA.ux*0.9)+' '+f1(rA.lean*rA.uy*0.5+c.breath*0.6)+')');
    el.S.body.setAttribute('transform','translate('+f1(rS.lean*rS.ux*0.9)+' '+f1(rS.lean*rS.uy*0.5+c.breath*0.5)+')');
    headDraw(el.A,FIG.adult,c.aGaze,c.aTilt,c.breath*0.6);headDraw(el.S,FIG.student,c.sGaze,c.sTilt,c.breath*0.5);
    el.A.head.setAttribute('transform',el.A.head.getAttribute('transform')+' translate('+f1(rA.lean*rA.ux*0.9)+' '+f1(rA.lean*rA.uy*0.5)+')');
    el.S.head.setAttribute('transform',el.S.head.getAttribute('transform')+' translate('+f1(rS.lean*rS.ux*0.9)+' '+f1(rS.lean*rS.uy*0.5)+')');
    legsDraw(el.A,FIG.adult,false);legsDraw(el.S,FIG.student,!!el.standS);
    el.wedge.setAttribute('d',wedgePath(c.tf));
    el.timer.setAttribute('transform','translate('+f1(c.timx)+' '+f1(c.timy)+')');
    el.spinner.setAttribute('transform','translate('+HOME.timer.x+' '+HOME.timer.y+')');el.needle.setAttribute('transform','rotate('+f1(c.spin)+')');
    el.tablet.setAttribute('transform','translate('+f1(c.tabx)+' '+f1(c.taby)+') rotate('+f1(c.tabTilt)+')');
    el.green.setAttribute('transform','translate('+f1(c.grx)+' '+f1(c.gry)+')');
    el.brk.setAttribute('transform','translate('+f1(c.brx)+' '+f1(c.bry)+')');
    el.aWatch.setAttribute('transform','translate('+f1(c.aHx+4)+' '+f1(c.aHy-20)+')'+(asx<0?' scale(-1 1)':''));
    el.cardL.setAttribute('transform',el.single?'translate(252 178) scale(.74)':'translate('+CARD.L.x+' '+CARD.L.y+')');el.cardR.setAttribute('transform','translate('+CARD.R.x+' '+CARD.R.y+')');
    el.sheet.setAttribute('transform','translate('+f1(c.shx)+' '+f1(c.shy)+') rotate('+f1(c.shr)+')');
    el.tiles.setAttribute('transform','translate(490 194)');el.tokb.setAttribute('transform','translate(470 130)');el.book.setAttribute('transform','translate(490 194)');
    el.bin.setAttribute('transform','translate('+f1(c.binx)+' '+f1(c.biny)+')');el.note.setAttribute('transform','translate('+f1(c.notex)+' '+f1(c.notey)+') rotate(-5)');
    el.raHeld.setAttribute('transform','translate('+f1(c.hbx)+' '+f1(c.hby)+')');
    el.raFly.setAttribute('transform','translate('+f1(c.flyx)+' '+f1(c.flyy)+') rotate('+f1(c.flyRot)+')');el.raFly.style.display=c.flyOn>0.5?'':'none';
    el.raChew.setAttribute('transform','translate('+f1(c.chx)+' '+f1(c.chy)+')');
    el.raClap.setAttribute('transform','translate('+f1(c.cpx)+' '+f1(c.cpy)+') scale('+f1(0.6+c.cpa*0.6)+')');el.raClap.style.opacity=f1(c.cpa);
    el.oArmN.setAttribute('transform','rotate('+f1(c.oTap*16)+' 776 178)');
    el.mag.setAttribute('transform','translate('+f1(c.magx)+' '+f1(c.magy)+')');
    if(X.draw)X.draw(c,el);
  }
  function wedgePath(f){if(f<=0)return '';if(f>=1)return 'M0 -19 A19 19 0 1 1 -0.01 -19 Z';const a=f*2*Math.PI,x=19*Math.sin(a),y=-19*Math.cos(a);return 'M0 0 L0 -19 A19 19 0 '+(f>0.5?1:0)+' 1 '+x.toFixed(2)+' '+y.toFixed(2)+' Z';}
  /* ---- targets: the numbers a frame asks for ---- */
  function target(f){
    const pa=POSE_A[f.a||'rest'],ps=POSE_S[f.s||'rest'];
    const far=FAR_S[f.s]||FAR_REST;
    const t={aHx:pa[2],aHy:pa[3],sHx:ps[2],sHy:ps[3],fHx:far[2],fHy:far[3],fEx:far[0],fEy:far[1],
      sGaze:f.s==='away'?-1:0,aGaze:0,sTilt:f.s==='away'?-4:UPSET[f.s]?3:0,aTilt:0,
      tf:f.timer?f.timer.f:0,timx:HOME.timer.x,timy:HOME.timer.y,spin:f.spinner?(f.spinner.angle||0):0,tabTilt:0,cpa:f.clap?1:0,oTap:0};
    let ap=f.ap||'seat';if(f.peer&&ap==='seat')ap='mid';
    const at=AT_A[ap]||AT_A.seat;t.adx=at[0];asx=at[1];
    const AX=x=>asx<0?t.adx+244-x:t.adx+x,side=asx<0?-1:1;
    const st=f.sp==='stand';t.sdx=st?8:0;t.sdy=st?-26:0;el.standS=st;
    const tab=f.tablet;
    t.tabx=tab==='adult'?AX(pa[2]+16):tab==='student'?ps[2]-14+t.sdx:tab==='near'?HOME.tabletNear.x:HOME.tabletTable.x;
    t.taby=tab==='adult'?pa[3]-8:tab==='student'?ps[3]-8+t.sdy:tab==='near'?HOME.tabletNear.y:HOME.tabletTable.y;
    if(tab==='student')t.tabTilt=-14;
    t.grx=f.green==='up'?pa[2]+4:HOME.green.x;t.gry=f.green==='up'?pa[3]-14:HOME.green.y;
    const b=f.brk;t.brx=b==='student'?ps[2]-6:b==='mid'?HOME.brkMid.x:b==='adult'?AX(pa[2]+6):HOME.brkDesk.x;t.bry=b==='student'?ps[3]-14:b==='mid'?HOME.brkMid.y:b==='adult'?pa[3]-12:HOME.brkDesk.y;
    const sa=f.sheetAt||'student';
    if(sa==='pushed'){t.shx=414;t.shy=178;t.shr=-9;}else if(sa==='adult'){t.shx=AX(pa[2])+side*8;t.shy=pa[3]-10;t.shr=-16*side;}else if(sa==='floor'){t.shx=462;t.shy=252;t.shr=6;}else if(sa==='aside'){t.shx=420;t.shy=184;t.shr=0;}else{t.shx=HOME.sheet.x;t.shy=HOME.sheet.y;t.shr=0;}
    const held=f.bin==='adult';t.binx=held?AX(pa[2]):330;t.biny=held?pa[3]-18:180;
    const nh=!!(f.note&&f.note.at!=='table');t.notex=nh?AX(pa[2])+side*30:391;t.notey=nh?pa[3]-20:176;
    t.magx=AX(pa[2])+(asx<0?-14:14);t.magy=pa[3]-6;
    if(f.sheetAt==='far'){t.shx=392;t.shy=182;t.shr=0;}
    if(f.look==='away'){t.aGaze=-1;}else if(f.look==='down'){t.aTilt=7;}
    /* RA-1: a hand at a station, a hand reaching for what the adult holds, what the hands hold */
    if(f.s==='place'&&(f.bins||f.button)){const bx=f.bins?raBinX(f,f.at):436;t.sHx=bx+4;t.sHy=f.bins?158:176;}
    if(f.s==='pick'){t.sHx=TRAY.x-4;t.sHy=TRAY.y-6;}
    if(f.a==='pointBin'&&f.bins){const lx=Math.min(raBinX(f,f.at)-t.adx,300);t.aHx=lx;t.aHy=150;}
    if(f.s==='takeit'){const ax=t.aHx+t.adx;t.sHx=ax+16;t.sHy=t.aHy;}
    t.hbx=t.sHx+t.sdx-4;t.hby=t.sHy+t.sdy-12;
    t.cpx=(t.aHx+t.adx+t.sHx)/2;t.cpy=Math.min(t.aHy,t.sHy)-16;
    const ch=f.chew;
    t.chx=ch==='adult'?AX(pa[2])+12:ch==='student'?t.sHx+t.sdx-6:ch==='mouth'?582:240;
    t.chy=ch==='adult'?pa[3]-9:ch==='student'?t.sHy+t.sdy-10:ch==='mouth'?120:176;
    /* where the people look: at what the hands do */
    if(f.s==='place'||f.s==='pick'||f.s==='takeit')t.sGaze=0.6;
    if(f.tablet==='student'||f.s==='holdTablet')t.sGaze=0.3;
    if(f.a==='pointBin'||f.a==='hand'||f.a==='give'||f.a==='hi5')t.aGaze=0.5;
    if(f.say&&!f.look)t.aGaze=0.7;
    if(X.target)X.target(f,t,{AX,adx:t.adx,asx,pa,ps,side});
    return t;
  }
  /* ---- what is shown or hidden ---- */
  function discrete(f){
    show(el.A.talk,false);el.A.mouth.classList.toggle('open',!!f.say);
    show(el.aClip,f.a==='write');show(el.aWatch,!!f.watch);if(f.watch)el.aWatchT.textContent=f.watch;
    show(el.timer,!!f.timer);if(f.timer)el.tt.textContent=f.timer.label||'';
    show(el.spinner,!!f.spinner);if(f.spinner){const p=f.spinner.p;const a=p*2*Math.PI,x=19*Math.sin(a),y=-19*Math.cos(a);el.sector.setAttribute('d',p>=1?'M0 -19 A19 19 0 1 1 -0.01 -19 Z':'M0 0 L0 -19 A19 19 0 '+(p>0.5?1:0)+' 1 '+x.toFixed(2)+' '+y.toFixed(2)+' Z');}
    const cards=f.cards||null;el.single=!!(cards&&cards[0]&&!cards[1]);show(el.cardL,!!(cards&&cards[0]));show(el.cardR,!!(cards&&cards[1]));
    if(cards){[['L',el.cardL,cards[0]],['R',el.cardR,cards[1]]].forEach(([k,node,c])=>{if(!c)return;['dis','acc','tok','bl'].forEach(z=>node.classList.toggle(z,c.k===z));node.querySelector('.t1').textContent=c.t;node.querySelector('.t2').textContent=c.s;node.classList.toggle('imp',c.k==='imp');node.classList.toggle('sc',c.k==='sc');node.classList.toggle('chosen',f.chosen===k);node.classList.toggle('dim',!!f.chosen&&f.chosen!==k);});}
    show(el.arr,!!f.arr);if(f.arr){el.arr.innerHTML=f.arr.map((a,i)=>'<g class="'+(a.rank?'picked':'')+(a.gone?' gone':'')+(a.k?' k-'+a.k:'')+'" transform="translate('+(252+i*80)+' 170)"><rect x="-32" y="-22" width="64" height="44" rx="4"/><text x="0" y="-2" text-anchor="middle">'+a.l1+'</text><text class="t2" x="0" y="13" text-anchor="middle">'+(a.l2||'')+'</text>'+(a.rank?'<circle cx="24" cy="-20" r="9"/><text class="rk" x="24" y="-16" text-anchor="middle">'+a.rank+'</text>':'')+'</g>').join('');}
    show(el.sheet,!!f.sheet);if(f.sheet)el.sheetT.textContent=f.sheetT!=null?f.sheetT:(f.sheet==='two'?'7+6   9−4':'');
    el.sheet.classList.toggle('two',f.sheet==='two'||f.sheetT!=null);
    show(el.tiles,!!f.tiles);show(el.book,!!f.book);show(el.green,!!f.green);show(el.brk,!!f.brk);show(el.tablet,f.tablet!==null&&f.tablet!==undefined);
    const access=!!(f.obs&&/Access/.test(f.obs.t2||''))&&f.tablet;
    el.tablet.classList.toggle('on',!!(f.play||f.tablet==='student'||access));show(el.tabVid,!!f.play||!!access);show(el.raPlay,false);show(el.tabRing,!!access);
    show(el.tokb,!!f.tok);if(f.tok){const t=f.tok;el.tks.forEach((c,i)=>{c.style.display=i<(t.of||10)?'':'none';c.classList.toggle('on',i<(t.n||0));});el.tokBl.textContent=t.label||'';}
    show(el.pb,!!f.pb);const up=!!(UPSET[f.s]||f.upset);show(el.motion,f.s==='agit'||!!f.motion);show(el.impact,f.s==='hit');show(el.tears,!!f.tears);show(el.helmet,!!f.helmet);
    el.S.brow.style.opacity=up?'1':'.8';
    const hd=FIG.student.head;
    if(f.mouth==='open'||f.mouth==='talk'){el.S.mouth.setAttribute('d','M'+(hd.x-11)+' '+(hd.y+9)+' q-6 -3 -12 0 q6 8 12 0 z');el.S.mouth.classList.add('open');}
    else{el.S.mouth.classList.remove('open');el.S.mouth.setAttribute('d',up?'M'+(hd.x-17)+' '+(hd.y+12)+' q6 -4 12 0':(f.tablet==='student'||f.s==='eat'||f.s==='hi5')?'M'+(hd.x-17)+' '+(hd.y+9)+' q6 6 12 0':'M'+(hd.x-17)+' '+(hd.y+10)+' q6 4 12 0');}
    const ah=FIG.adult.head;el.A.mouth.setAttribute('d',f.say?'M'+(ah.x+6)+' '+(ah.y+8)+' q6 -2 11 0 q-5 8 -11 0 z':f.a==='hi5'?'M'+(ah.x+5)+' '+(ah.y+9)+' q6 6 12 0':'M'+(ah.x+5)+' '+(ah.y+10)+' q6 4 12 0');
    /* the room */
    show(el.chairA,!f.noChairA);show(el.chairS,!f.noChairS);show(el.adultAt,!f.noA);show(el.studentAt,!f.noS);
    show(el.peer,!!f.peer);show(el.psheet,!!(f.peer&&f.psheet!==false));
    show(el.door,!!f.door);show(el.alarm,!!f.alarm);show(el.fov,!!f.fov);show(el.fov2,!!f.win);show(el.wall1,!!f.win);show(el.fmat,!!f.fmat);
    show(el.clock,!!f.clock);if(f.clock){const h=clockHands(f.clock);el.hh.setAttribute('transform','rotate('+h[0]+')');el.mh.setAttribute('transform','rotate('+h[1]+')');el.clockT.textContent=f.clock;}
    show(el.screen,!!f.screen);if(f.screen&&el.screen.getAttribute('data-k')!==f.screen){el.sc.innerHTML=(typeof screenSVG==='function'?screenSVG(f.screen):'');el.screen.setAttribute('data-k',f.screen);}
    show(el.board,!!f.board);if(f.board&&el.board.getAttribute('data-k')!==f.board){el.bc.innerHTML=BOARD(f.board);el.board.setAttribute('data-k',f.board);}
    show(el.laptop,!!f.laptop);show(el.bin,!!f.bin);show(el.note,!!f.note);if(f.note){el.n1.textContent=f.note.t1||'';el.n2.textContent=f.note.t2||'';}
    show(el.toys,!!f.toys);show(el.lots,f.toys==='lots');show(el.mag,!!f.mag);
    show(el.frame,!f.board&&!f.screen&&!f.pboard&&!f.say);show(el.plant,!f.obs2&&!f.noPlant&&!X.noPlant);show(el.table,!f.noTable);
    /* the data collector and the second observer */
    const o=f.noObs?null:(f.obs||null);
    show(el.obs,!f.noObs&&!(X.obsOnlyWhenNamed&&!o));call(el.callR,o);el.otab.classList.toggle('alert',!!(o&&o.k==='alert'));el.otab.classList.toggle('rec',!!(o&&o.k==='rec'));
    show(el.snd,!!(o&&o.snd));show(el.vib,!!(o&&o.vib));
    show(el.obs2,!!f.obs2);call(el.callL,f.obs2||null);
    /* RA-1 props */
    show(el.raTray,!!f.tray);show(el.raCup,!!f.cup);show(el.raSwitch,!!f.button);
    show(el.raHeld,f.hold==='block');show(el.raChew,!!f.chew);show(el.raClap,!!f.clap);
    show(el.raLad,!!f.lad);el.raLad.innerHTML=f.lad?LADDER(f.lad):'';
    ['gray','gold','red','blue','green'].forEach(k=>el.pm.classList.toggle(k,f.pm===k));show(el.pm,!!f.pm);
    if(X.discrete)X.discrete(f,el,show);
    el.svg.setAttribute('aria-label',f.alt||X.alt||ALT);
  }
  const access=f=>!!(f.obs&&/Access/.test(f.obs.t2||''))&&!!f.tablet;
  function call(g,o){const on=!!(o&&(o.t1||o.t2));g.style.display=on?'':'none';if(!on)return;
    g.querySelector('.t1').textContent=o.t1||'';g.querySelector('.t2').textContent=o.t2||'';g.querySelector('.t3').textContent=o.t3||'';
    ['alert','rec','ok','skip'].forEach(k=>g.classList.toggle(k,o.k===k));}
  function bins(f,fill,alpha){el.raBins.innerHTML=f.bins?binsSVG(f,fill,alpha):'';}
  /* ---- motion ---- */
  const EASE={io:k=>k<.5?2*k*k:-1+(4-2*k)*k,out:k=>1-Math.pow(1-k,3),in:k=>k*k*k,arc:k=>k};
  let seqRaf=0;
  function tween(to,ms,ease,arcY){
    /* moves the named channels of cur to their targets over ms; arcY lifts the student's and
       adult's hands along the way, so a carry is an arc rather than a straight line */
    return new Promise(res=>{
      const my=seqToken;const from={};for(const k in to)from[k]=cur[k]===undefined?to[k]:cur[k];
      if(RM||ms<=0){Object.assign(cur,to);draw(cur);return res(true);}
      const t0=performance.now(),e=EASE[ease||'io'];
      const step=now=>{if(my!==seqToken)return res(false);const k=Math.min(1,(now-t0)/ms),v=e(k);
        for(const key in to)cur[key]=from[key]+(to[key]-from[key])*v;
        if(arcY){const lift=Math.sin(k*Math.PI)*arcY;if('sHy' in to)cur.sHy-=lift;if('aHy' in to)cur.aHy-=lift;if('hby' in to)cur.hby-=lift;if('chy' in to)cur.chy-=lift;if('taby' in to)cur.taby-=lift;}
        draw(cur);if(k<1)seqRaf=requestAnimationFrame(step);else res(true);};
      seqRaf=requestAnimationFrame(step);});
  }
  let seqToken=0;
  const wait=ms=>new Promise(r=>{const my=seqToken;if(RM)return r(true);setTimeout(()=>r(my===seqToken),ms);});
  /* a block falls from the hand into bin i: a short drop with a settle, then the bin shows one more */
  async function drop(f,i,fillBefore,fillAfter){
    const bx=raBinX(f,i);
    cur.flyx=cur.hbx;cur.flyy=cur.hby;cur.flyOn=1;cur.flyRot=0;el.raHeld.style.display='none';draw(cur);
    await tween({flyx:bx-6+Math.min(2,fillBefore[i]||0)*4,flyy:198-34,flyRot:38},240,'in');
    bins(f,fillAfter);cur.flyOn=0;draw(cur);
  }
  /* the sequence a frame asks for, read from the difference with the frame before */
  async function perform(f,p){
    const my=seqToken,ok=()=>my===seqToken;
    const t=target(f);
    const same=p&&p.bins===f.bins;
    const fillPrev=same&&p.fill?p.fill.slice():null;
    const fillNow=f.fill?f.fill.slice():null;
    /* a placed block always lands: the station shows one more than it did, even when the story's
       count (the data collector's tally) does not move, as for a prompted response */
    const dropAt=f.s==='place'&&f.hold==='block'&&f.bins&&fillNow?(f.at||0):-1;
    const fillStart=dropAt>=0?(fillPrev||fillNow).slice():null;
    const fillEnd=dropAt>=0?fillNow.slice():null;
    if(dropAt>=0&&(fillEnd[dropAt]||0)<=(fillStart[dropAt]||0))fillEnd[dropAt]=(fillStart[dropAt]||0)+1;
    const tagsChanged=same&&p.tags&&f.tags&&JSON.stringify(p.tags)!==JSON.stringify(f.tags);
    /* what is on the table and who is in the room changes at once; the stations keep their old count until a block lands */
    discrete(f);
    if(f.bins){if(tagsChanged){bins(f,fillPrev||fillNow,0);}else bins(f,dropAt>=0?fillStart:fillNow);}else bins(f,null);
    if(dropAt>=0)el.raHeld.style.display='none';
    /* a nod to the new screen: the data collector taps */
    const obsChanged=!!(f.obs&&(!p||!p.obs||p.obs.t2!==f.obs.t2||p.obs.k!==f.obs.k));
    const tapPromise=obsChanged&&!f.noObs?(async()=>{await tween({oTap:1},140,'out');await tween({oTap:0},220,'io');})():null;
    const base={adx:t.adx,sdx:t.sdx,sdy:t.sdy,aGaze:t.aGaze,sGaze:t.sGaze,aTilt:t.aTilt,sTilt:t.sTilt,tf:t.tf,timx:t.timx,timy:t.timy,spin:t.spin,grx:t.grx,gry:t.gry,brx:t.brx,bry:t.bry,shx:t.shx,shy:t.shy,shr:t.shr,binx:t.binx,biny:t.biny,notex:t.notex,notey:t.notey,cpa:f.clap?1:0,fEx:t.fEx,fEy:t.fEy,fHx:t.fHx,fHy:t.fHy};
    const seat=tween(base,420,'io');
    if(access(f)){el.tabRing.style.strokeDashoffset='0';el.tabRing.style.transition='none';setTimeout(()=>{if(!ok())return;el.tabRing.style.transition='stroke-dashoffset 1.6s linear';el.tabRing.style.strokeDashoffset='25';},700);}
    if(dropAt>=0){
      /* pick a block from the tray, carry it over the bins, let it go */
      await tween({sHx:TRAY.x-2,sHy:TRAY.y-4,hbx:TRAY.x-6,hby:TRAY.y-16,sGaze:0.7},380,'io',14);
      if(!ok())return;el.raHeld.style.display='';await wait(90);
      const aMove={aHx:t.aHx,aHy:t.aHy};
      await Promise.all([tween(Object.assign({sHx:t.sHx,sHy:t.sHy,hbx:t.hbx,hby:t.hby},aMove),520,'io',26),tapPromise]);
      if(!ok())return;await wait(70);await drop(f,dropAt,fillStart,fillEnd);if(!ok())return;
      await tween({sHx:t.sHx+8,sHy:t.sHy+6,hbx:t.hbx+8,hby:t.hby+6},200,'out');
      cur.hbx=t.hbx;cur.hby=t.hby;el.raHeld.style.display='none';
      await seat;return;
    }
    if(f.s==='takeit'&&(f.tablet==='adult'||f.chew==='adult')){
      /* the adult brings the item across; the student reaches and takes it */
      const item=f.tablet==='adult'?{tabx:t.tabx,taby:t.taby}:{chx:t.chx,chy:t.chy};
      await Promise.all([tween(Object.assign({aHx:t.aHx,aHy:t.aHy,aGaze:0.6},item),520,'io',10),tapPromise]);
      if(!ok())return;await tween({sHx:t.sHx,sHy:t.sHy,sGaze:0.6},420,'io',12);
      await tween({sGaze:0.3},200,'io');
      await seat;return;
    }
    if(f.s==='pick'){
      await Promise.all([tween({sHx:t.sHx,sHy:t.sHy,hbx:t.hbx,hby:t.hby,sGaze:0.7,aHx:t.aHx,aHy:t.aHy},460,'io',16),tapPromise]);
      await seat;return;
    }
    if(f.a==='hi5'&&f.s==='hi5'){
      await Promise.all([tween({aHx:t.aHx,aHy:t.aHy,sHx:t.sHx,sHy:t.sHy,hbx:t.hbx,hby:t.hby,aGaze:0.6,sGaze:0.6,cpx:t.cpx,cpy:t.cpy},380,'out',8),tapPromise]);
      if(!ok())return;cur.cpa=0;await tween({cpa:1},120,'out');await wait(300);await tween({cpa:0},260,'io');
      await seat;return;
    }
    /* the general case: each hand to its target, the student first when both move */
    const both={aHx:t.aHx,aHy:t.aHy,sHx:t.sHx,sHy:t.sHy,hbx:t.hbx,hby:t.hby,chx:t.chx,chy:t.chy,cpx:t.cpx,cpy:t.cpy,tabx:t.tabx,taby:t.taby,tabTilt:t.tabTilt};
    await Promise.all([tween(both,480,'io',8),seat,tapPromise]);
    if(tagsChanged){/* the stations rotate: the labels fade out, slide, and return */
      if(!ok())return;await tween({},160,'io');bins(f,fillNow,0);const g=el.raBins;g.style.transition='none';
      await wait(60);Array.from(g.querySelectorAll('.ra-tag')).forEach(tg=>{tg.style.transition='opacity .36s ease';tg.style.opacity='1';});
    }
  }
  function set(f){
    /* a new frame cancels what is running and starts its own sequence */
    seqToken++;cancelAnimationFrame(seqRaf);
    prev=frame;frame=f;
    if(!prev||RM){discrete(f);bins(f,f.fill);const t=target(f);Object.assign(cur,t);cur.flyOn=0;cur.cpa=f.clap?1:0;draw(cur);return 0;}
    perform(f,prev).catch(()=>{});
    return 1800;
  }
  /* a timer wedge that runs down over ms, then resolves */
  function countdown(secsLabel,ms){return new Promise(res=>{if(RM){cur.tf=0;draw(cur);el.tt.textContent='0';return res();}const t0=performance.now();const tick=now=>{const k=Math.min(1,(now-t0)/ms);cur.tf=1-k;el.tt.textContent=String(Math.ceil(secsLabel*(1-k)));draw(cur);if(k<1)requestAnimationFrame(tick);else res();};requestAnimationFrame(tick);});}
  function spinTo(angle,ms){return new Promise(res=>{if(RM){cur.spin=angle;draw(cur);return res();}const t0=performance.now(),a0=cur.spin||0;const tick=now=>{const k=Math.min(1,(now-t0)/ms);const e=1-Math.pow(1-k,3);cur.spin=a0+(angle-a0)*e;draw(cur);if(k<1)requestAnimationFrame(tick);else res();};requestAnimationFrame(tick);});}
  /* ---- life between steps: breathing, blinks, a glance, only while the scene is on screen ---- */
  if(!RM){
    let visible=false,idleRaf=0,nextBlink=performance.now()+1800+Math.random()*2400,blinkT=0;
    const figs=[el.A,el.S];
    const idle=now=>{
      if(!visible)return;
      cur.breath=Math.sin(now/1900)*1.1;
      if(now>nextBlink){blinkT=now;nextBlink=now+2200+Math.random()*3600;}
      const b=blinkT?Math.min(1,(now-blinkT)/150):0,open=b<1?Math.sin(b*Math.PI):0;
      figs.forEach(F=>F.lids.forEach(l=>l.setAttribute('height',f1(open*6))));
      if(b>=1)blinkT=0;
      draw(cur);
      idleRaf=requestAnimationFrame(idle);
    };
    try{
      new IntersectionObserver(es=>{es.forEach(e=>{visible=e.isIntersecting;if(visible){cancelAnimationFrame(idleRaf);idleRaf=requestAnimationFrame(idle);}});},{threshold:0.05}).observe(root);
    }catch(e){visible=true;idleRaf=requestAnimationFrame(idle);}
  }
  draw(cur);
  return {set,countdown,spinTo,el};
}
return Object.assign({make},X.exports||{});
