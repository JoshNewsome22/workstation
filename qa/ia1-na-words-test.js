/* Form IA-1's FAST walkthrough says NA in the BCBA's approved words (v23.42, October 2026): the two NA lines are voiced
   again (the recorded narration and the words beside it say the same), the captions and the informant description match,
   every other line keeps its recording, and Form TV-1's "Script: the FAST" row reads the same. Simulated data only.
   usage: node qa/ia1-na-words-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1400):''));if(!c)fails++;};
const NA='N A means the informant was not sure, or has not seen that situation. An item that either informant answered N A is left out of that pair\'s agreement, as the original analysis did.';
const INA='If you are not sure of an answer, choose N A, not applicable, as the FAST asks. That is a better answer than a guess, and it is left out of the scoring.';
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const fs=require('fs'),dir=L.ROOT+'/NBH-Workstation/',ia=fs.readdirSync(dir).find(x=>x.startsWith('IA-1_')),tv=fs.readdirSync(dir).find(x=>x.startsWith('TV-1_'));
  const spec=JSON.parse(fs.readFileSync(L.ROOT+'/tools/forms/IA-1/walk-script.json','utf8'));const ln=id=>spec.lines.find(l=>l.id===id)||{};
  ok('1 walk-script.json holds the approved words, each marked approved',ln('na').text===NA&&ln('i_na').text===INA&&/approved by the BCBA/.test(ln('na').approved||'')&&/approved by the BCBA/.test(ln('i_na').approved||''),{na:ln('na'),i_na:ln('i_na')});
  const p=await br.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto(L.BASE+'/NBH-Workstation/'+ia);await sleep(1500);
  await p.evaluate(()=>window.nbhNarration.load());   /* the narration is read when the Walkthrough is first opened; here at once */
  await p.waitForFunction(()=>typeof WALK_AUDIO!=='undefined',null,{timeout:15000});
  const a=await p.evaluate(()=>{const W=typeof WALK_AUDIO!=='undefined'?WALK_AUDIO.lines:{};const S=(window.IA_WALK_SCRIPT||[]);const s=id=>(S.find(l=>l.id===id)||{}).text;
    const clip=id=>W[id]?{t:W[id].t,d:W[id].d,mp3:/^data:audio\/mpeg;base64,.{4000}/.test(W[id].a||'')}:null;
    return {na:clip('na'),i_na:clip('i_na'),sna:s('na'),sina:s('i_na'),n:Object.keys(W).length,ns:S.length,
      inf:(document.querySelector('[data-inf]')||{dataset:{}}).dataset.inf||''};});
  ok('2 the recorded narration speaks the approved words: both lines voiced again, with audio',!!a.na&&a.na.t===NA&&a.na.mp3&&a.na.d>8&&!!a.i_na&&a.i_na.t===INA&&a.i_na.mp3&&a.i_na.d>6,a);
  ok('3 the words beside the form (read without the narration file) are the same',a.sna===NA&&a.sina===INA&&a.ns===a.n,{sna:a.sna,sina:a.sina,n:a.n,ns:a.ns});
  /* every other line keeps its recording: each line's words match the script it was voiced from */
  const off=await p.evaluate(sp=>{const W=WALK_AUDIO.lines;return sp.filter(l=>!W[l.id]||W[l.id].t!==l.text.trim()).map(l=>l.id);},spec.lines);
  ok('4 every line\'s recording is of its own words (nothing left voiced from old text)',off.length===0,off);
  ok('5 the informant description says NA when they are not sure',/NA when they are not sure of an answer,/.test(a.inf)&&!/never been in that situation/.test(a.inf),a.inf.slice(0,300));
  const src=fs.readFileSync(dir+ia,'utf8');
  ok('6 the captions match: "NA: not sure, or not seen", "NA: not sure of the answer", and the two NA cards',/note\(r,'NA: not sure, or not seen',/.test(src)&&/note\(r,'NA: not sure of the answer',/.test(src)&&/<p>The informant was not sure, or has not seen that situation\. An item/.test(src)&&/<p>You are not sure of the answer\. It is a better answer/.test(src)&&!/has not seen that situation and cannot say|never been in that situation/.test(src));
  const q=await br.newPage({viewport:{width:1280,height:900}});q.on('pageerror',e=>errs.push(e.message));
  await q.goto(L.BASE+'/NBH-Workstation/'+tv);await sleep(1200);
  const rows=await q.evaluate(async()=>{S=blank();renderAll();nbhUI.confirm=async()=>true;document.getElementById('fastBtn').click();await new Promise(r=>setTimeout(r,300));return S.rows.map(r=>r.say);});
  ok('7 Form TV-1\'s "Script: the FAST" reads the NA line in the approved words',rows.length===17&&rows.some(t=>t===NA||t.indexOf('N A means the informant was not sure, or has not seen that situation.')>=0)&&!rows.some(t=>/cannot say/.test(t)),rows.filter(t=>/N A/.test(t)));
  ok('8 no page errors',errs.length===0,errs);
  }catch(e){fails++;console.log('FAIL exception',e&&e.stack||e);}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
