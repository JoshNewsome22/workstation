/* v24.88 three fixes from the BCBA's iPad screenshots of TD-1 (10/28): the page keeps its own text size on an iPad (no text
   autosizing), a study's "he or she" becomes one name or pronoun in steps written for the student, and "et al." in three
   headings. usage: node qa/fix188-test.js (WS_URL as in qa/lib.js) */
const {chromium,BASE,ROOT,forms}=require(__dirname+'/lib.js');
const fs=require('fs'),path=require('path');
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d||'').slice(0,600)));};
const F='TD-1_Function-Based-Treatment-Developer_v2026-09.html';
(async()=>{
 /* 1. text size: every form's screen polish and the workstation itself */
 const TSA=/html\{-webkit-text-size-adjust:100%;text-size-adjust:100%\}/;
 const list=forms(),missing=list.filter(f=>!TSA.test(fs.readFileSync(path.join(ROOT,'NBH-Workstation',f.file),'utf8')));
 ok('every form ('+list.length+') keeps its own text size on screen (text-size-adjust 100% in the screen polish)',list.length>=40&&!missing.length,missing.map(f=>f.file));
 const shell=fs.readFileSync(path.join(ROOT,'NBH-Workstation','index.html'),'utf8');
 ok('the workstation page keeps its own text size too',/id="nbh-tsa"/.test(shell)&&TSA.test(shell));
 const abc=fs.readFileSync(path.join(ROOT,'NBH-Workstation',list.find(f=>/^ABC_Recording/.test(f.file)).file),'utf8');
 ok('ABC-1 still sets its own size for printing the paper sheet (v24.07)',/-webkit-text-size-adjust:\s*none/.test(abc));

 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:1000}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await p.goto(BASE+'/NBH-Workstation/'+F);await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{
  const S='Ask the student what he or she wants. If he/she stops, help him or her start, praise his or her effort and let s/he choose. He or she may rest. Let the student calm himself or herself.';
  window.__nbhFactsIn&&window.__nbhFactsIn({profile:{who:{first:'Jordan'}}});
  const out={name:tdRefer.word(S),mode:tdRefer.mode(),he:tdRefer.word(S,'he'),she:tdRefer.word(S,'she'),they:tdRefer.word(S,'they'),student:tdRefer.word(S,'student')};
  /* every step in the bank, in every mode: no "X or X" left by the swap */
  const dup=/\b([A-Za-z’']+) (or|\/) \1\b/i,hits=[];const P=(typeof TD1_BANK!=='undefined'&&TD1_BANK.protocols)||[];
  for(const pr of P)for(const st of (pr.steps||[]))for(const m of ['name','he','she','they','student']){const w=tdRefer.word(st,m);if(dup.test(w)&&!dup.test(st)){hits.push([pr.id,m,w.slice(0,140)]);break;}}
  const pairs=P.reduce((a,pr)=>a+(pr.steps||[]).filter(st=>/\b(he or she|him or her|his or her|he\/she|s\/he)\b/i.test(st)).length,0);
  const heads=[...document.querySelectorAll('h3.sub')].map(h=>h.textContent).filter(t=>/DeLeon/.test(t));
  return {out,hits:hits.slice(0,5),nhits:hits.length,np:P.length,pairs,heads,etal:/Et Al\./.test(document.body.innerHTML)};});
 const o=r.out;
 ok('by name: "he or she", "he/she", "him or her", "his or her", "S/he", "himself or herself" each read as the name once',o.mode==='name'&&o.name==='Ask the student what Jordan wants. If Jordan stops, help Jordan start, praise Jordan’s effort and let Jordan choose. Jordan may rest. Let the student calm Jordan.',o.name);
 ok('he / him: one pronoun ("what he wants", "help him start", "his effort", "He may rest", "calm himself")',/what he wants\. If he stops, help him start, praise his effort and let he choose\. He may rest\. Let the student calm himself\./.test(o.he),o.he);
 ok('she / her: one pronoun ("what she wants", "help her start", "her effort", "calm herself")',/what she wants\. If she stops, help her start, praise her effort.*She may rest\. Let the student calm herself\./.test(o.she),o.she);
 ok('they: one pronoun with the verb agreeing ("what they want", "If they stop", "They may rest")',/what they want\. If they stop, help them start, praise their effort.*They may rest\./.test(o.they),o.they);
 ok('the student: "what the student wants"',/what the student wants\. If the student stops/.test(o.student),o.student);
 ok('no step in the bank ('+r.np+' protocols, '+r.pairs+' steps with a pronoun pair) reads "X or X" in any mode',r.np>900&&r.pairs>10&&r.nhits===0,r.hits);
 ok('the three DeLeon headings read "et al." and no "Et Al." is left in TD-1',r.heads.length===3&&r.heads.every(t=>/DeLeon et al\., 2014/.test(t))&&!r.etal,r.heads);
 ok('no page errors',!errs.length,errs);
 await b.close();console.log('RESULT: '+(bad?bad+' failed':'all '+n+' passed'));process.exit(bad?1:0);})();
