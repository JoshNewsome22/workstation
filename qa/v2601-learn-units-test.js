/* v26.01 (the BCBA, 11/13: "Write the other 45 units") every written unit of the Learning page, read as data against the map
   (nbh-learn.js) and the video list. No browser: the page itself is tested by v2600-learn-test.js.
   A  all 46 units of the map are written, and no unit is written that the map does not have;
   B  the shape of each: aims; a lesson of at least 3 parts, each with paragraphs and one question; examples with their
      choices; a practice of at least 4 decisions; a quiz that passes at 80% and draws from a pool at least 2 larger than the
      draw; role-plays with their steps and their rule; questions to discuss; further reading;
   C  every question: text, at least 3 choices (4 in the quiz), no choice twice, the answer one of them, a reason; no
      question twice in a unit; the examples of a unit do not all have the same answer;
   D  the Watch part lists exactly the videos the map gives the unit, each a video of the library with what to look for, and
      at least one of them core;
   E  the time the page can count for a unit reaches the minutes the map plans for it;
   F  the right answer does not sit in one place in more than half of a unit's questions (the page also draws the order anew);
   G  the words: no dash used as punctuation, and none of the words the workstation does not use;
   H  every unit of section G (ethics) and H names the BACB's own document to read.
   usage: node qa/v2601-learn-units-test.js   (WS_ROOT and WS_EDITION as in qa/lib.js) */
const path=require('path'),fs=require('fs');
const ROOT=process.env.WS_ROOT||path.resolve(__dirname,'..'),DIR=path.join(ROOT,process.env.WS_EDITION||'NBH-Workstation');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1600):''));if(!c)fails++;};
global.window={};require(path.join(DIR,'nbh-videos.js'));require(path.join(DIR,'nbh-learn.js'));
fs.readdirSync(DIR).filter(f=>/^nbh-learn-units(-[a-z0-9]+)?\.js$/.test(f)).sort().forEach(f=>require(path.join(DIR,f)));
const L=global.window.NBH_LEARN,U=global.window.NBH_LEARN_UNITS,V={};global.window.NBH_VIDEOS.list.forEach(v=>{V[v.key]=v;});
const str=x=>typeof x==='string'&&x.trim().length>0;
const BAN=new RegExp(['rub'+'ber','sili'+'cone'].join('|'),'i');
const bad={shape:[],q:[],watch:[],time:[],place:[],words:[],read:[]};
let written=0,total=0,chars=0,nq=0;const missing=[];
L.rbt.sections.forEach(s=>s.units.forEach(u=>{total++;const c=U[u.id],id=u.id;if(!c){missing.push(id);return;}written++;
  const txt=JSON.stringify(c);chars+=txt.length;
  if(BAN.test(txt))bad.words.push(id+': a word that is not used');if(/\s—\s|--/.test(txt))bad.words.push(id+': a dash as punctuation');
  if(!Array.isArray(c.aim)||c.aim.length<2||!c.aim.every(str))bad.shape.push(id+': aim');
  const pos=[0,0,0,0,0,0],qs=[];
  const q=(where,o,min)=>{nq++;if(!str(o.q||o.s||o.see))bad.q.push(id+' '+where+': no text');const opts=o.opts;
    if(!Array.isArray(opts)||opts.length<min||!opts.every(str))bad.q.push(id+' '+where+': choices');
    else{if(new Set(opts).size!==opts.length)bad.q.push(id+' '+where+': a choice twice');if(!(Number.isInteger(o.a)&&o.a>=0&&o.a<opts.length))bad.q.push(id+' '+where+': answer out of range');else pos[o.a]++;}
    if(!str(o.why))bad.q.push(id+' '+where+': no reason');};
  if(!Array.isArray(c.lesson)||c.lesson.length<3)bad.shape.push(id+': lesson of fewer than 3 parts');
  (c.lesson||[]).forEach((g,i)=>{if(!str(g.h)||!Array.isArray(g.p)||!g.p.length||!g.p.every(str))bad.shape.push(id+' lesson '+(i+1)+': heading or paragraphs');
    if(g.key&&!(Array.isArray(g.key)&&g.key.every(str)))bad.shape.push(id+' lesson '+(i+1)+': key');
    if(!g.check)bad.shape.push(id+' lesson '+(i+1)+': no question');else{q('lesson '+(i+1),g.check,3);qs.push(g.check.q);}});
  const uv=u.v||[],wk=(c.watch||[]).map(w=>w.k);
  if(uv.slice().sort().join()!==wk.slice().sort().join())bad.watch.push(id+': the map has '+uv.length+' videos, the unit lists '+wk.length);
  (c.watch||[]).forEach(w=>{if(!V[w.k])bad.watch.push(id+': no video '+w.k);if(!str(w.look))bad.watch.push(id+' '+w.k+': nothing to look for');});
  if(uv.length&&!(c.watch||[]).some(w=>w.c))bad.watch.push(id+': no core video');
  const E=c.examples||{};if(!str(E.intro)||!Array.isArray(E.opts)||E.opts.length<2||!E.opts.every(str)||!Array.isArray(E.items)||E.items.length<5)bad.shape.push(id+': examples');
  (E.items||[]).forEach((it,i)=>{nq++;if(!str(it.s)||!str(it.why))bad.q.push(id+' example '+(i+1)+': text or reason');if(!(Number.isInteger(it.a)&&it.a>=0&&it.a<(E.opts||[]).length))bad.q.push(id+' example '+(i+1)+': answer out of range');});
  if(new Set((E.items||[]).map(it=>it.a)).size<2)bad.q.push(id+': every example has the same answer');
  const P=c.practice||{};if(!str(P.title)||!str(P.intro)||!Array.isArray(P.steps)||P.steps.length<4)bad.shape.push(id+': practice');
  (P.steps||[]).forEach((st,i)=>{if(!str(st.t))bad.shape.push(id+' practice '+(i+1)+': no moment');q('practice '+(i+1),st,3);});
  const Q=c.quiz||{};if(Q.pass!==80||!(Q.draw>=5)||!Array.isArray(Q.items)||Q.items.length<Q.draw+2)bad.shape.push(id+': quiz (pass, draw, or a pool smaller than the draw plus 2)');
  (Q.items||[]).forEach((it,i)=>{q('quiz '+(i+1),it,4);qs.push(it.q);});
  if(new Set(qs).size!==qs.length)bad.q.push(id+': a question twice');
  if(!Array.isArray(c.role)||!c.role.length)bad.shape.push(id+': no role-play');
  (c.role||[]).forEach((r,i)=>{if(!str(r.t)||!str(r.setup)||!Array.isArray(r.steps)||r.steps.length<3||!r.steps.every(str))bad.shape.push(id+': role-play '+(i+1));});
  if(!str(c.roleRule))bad.shape.push(id+': no rule for the role-plays');
  if(!Array.isArray(c.discuss)||c.discuss.length<2||!c.discuss.every(str))bad.shape.push(id+': fewer than 2 questions to discuss');
  if(!Array.isArray(c.read)||!c.read.length||!c.read.every(str))bad.shape.push(id+': no further reading');
  if((s.k==='G'||s.k==='H')&&!(c.read||[]).some(r=>/Behavior Analyst Certification Board/.test(r)&&/bacb\.com/.test(r)))bad.read.push(id);
  let vid=0;uv.forEach(k=>{vid+=(V[k]&&V[k].dur)||0;});
  const cap=(c.lesson||[]).length*240+(E.items||[]).length*90+(P.steps||[]).length*120+(Q.draw||0)*90*3+Math.round(vid*1.5)+(u.x?u.x.length*600:0)+(u.p?900:0);
  if(cap<u.self*60)bad.time.push(id+': the page can count '+Math.round(cap/60)+' min, the map plans '+u.self);
  const tot=pos.reduce((a,b)=>a+b,0),top=Math.max.apply(null,pos);if(tot>=8&&top/tot>0.5)bad.place.push(id+': '+pos.slice(0,4).join('/'));}));
const extra=Object.keys(U).filter(k=>!L.rbt.sections.some(s=>s.units.some(u=>u.id===k)));
ok('A all '+total+' units of the map are written ('+Math.round(chars/1000)+' KB, '+nq+' questions), and none is written that the map does not have',total===46&&written===46&&!missing.length&&!extra.length,{missing,extra});
ok('B the shape of every unit: aims, a lesson of 3 or more parts each with one question, examples, a practice of 4 or more decisions, a quiz at 80% with a pool larger than its draw, role-plays with steps and a rule, questions to discuss, further reading',!bad.shape.length,bad.shape.slice(0,12));
ok('C every question has its text, enough choices (4 in the quiz), no choice twice, an answer that is one of them and a reason; no question twice in a unit; a unit’s examples do not all share one answer',!bad.q.length,bad.q.slice(0,12));
ok('D the Watch part of a unit lists exactly the map’s videos for it, each a video of the library with what to look for, one at least core',!bad.watch.length,bad.watch.slice(0,12));
ok('E the time the page can count for a unit reaches the minutes the map plans for it',!bad.time.length,bad.time);
ok('F in no unit does the right answer sit in one place in more than half of the questions',!bad.place.length,bad.place);
ok('G no dash used as punctuation, and none of the words the workstation does not use',!bad.words.length,bad.words);
ok('H every unit of sections G and H names the BACB’s own document, at bacb.com, to read',!bad.read.length,bad.read);
console.log(fails?fails+' FAILED':'all passed');process.exit(fails?1:0);
