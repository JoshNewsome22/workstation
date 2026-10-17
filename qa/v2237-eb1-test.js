/* v22.37 Form EB-1 from the case (review F380): the classroom plan's consequence step, after-the-episode step, "staff do not"
   and classroom routines are offered beside the blocks ("In the plan (for you, not for the page)") instead of placed into
   the brief; Use as a starting point places one, marked from the plan; the checks ask for "When it happens" when the request
   is written, and catch a Never line that refuses the request. Simulated people only.
   usage: node qa/v2237-eb1-test.js */
const L=require(__dirname+'/lib.js');const {sleep}=L;
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,900):''));if(!c)fails++;};
(async()=>{const br=await L.chromium.launch();const errs=[];
  try{
  const p=await br.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto(L.BASE+'/NBH-Workstation/EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html');await sleep(900);
  await p.evaluate(()=>nbhCase.apply({profile:{client:'Mateo Rivera'},plan:{beh:'Hitting peers with an open hand (simulated)',rep:'Hands the break card (simulated)',
    respond:{target:'Escape extinction: continue the prompt sequence; no break (simulated)',after:'Re-present the task within 5 s (simulated)',not:'No break, no negotiation (simulated)'},ant:['Staff keep 5 ft away during independent work (simulated)']}}));await sleep(300);
  const st=()=>p.evaluate(()=>({resp:lines('resp'),never:lines('never'),prev:lines('prev'),after:val('e.after'),ask:val('e.ask'),sug:document.getElementById('ebPlanSug').textContent,sugHidden:document.getElementById('ebPlanSug').hidden,chk:(document.getElementById('ebChecks')||document.getElementById('ebWarn')||{}).textContent||''}));
  let s=await st();
  ok('1 the plan’s consequence, after, never and classroom lines are not placed into the brief',!s.resp.length&&!s.never.length&&!s.prev.length&&!s.after,s);
  ok('2 the behavior and the request are still filled',/Hitting peers/.test(s.ask+'')||/break card/.test(s.ask),s);
  ok('3 they are offered: "In the plan (for you, not for the page)", with each block named',!s.sugHidden&&/In the plan \(for you, not for the page\)/.test(s.sug)&&/If the Behavior Happens/.test(s.sug)&&/Never Do This/.test(s.sug)&&/After It Is Over/.test(s.sug)&&/What Helps Before It Starts/.test(s.sug),s.sug);
  await p.evaluate(()=>{try{checks();}catch(e){}});s=await st();
  ok('4 the checks ask for "When it happens" while the request is written',/When it happens<\/b>|When it happens is empty/.test(s.chk)||/When it happens/.test(s.chk),s.chk);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-ebsug]')].find(x=>/Never Do This/.test(x.parentNode.textContent));b.click();});await sleep(200);await p.evaluate(()=>{try{checks();}catch(e){}});s=await st();
  ok('5 Use as a starting point places the line, marked from the plan; the offer goes',s.never.length===1&&/No break/.test(s.never[0])&&!/Never Do This:/.test(s.sug)&&await p.evaluate(()=>/from the plan/.test(document.getElementById('p_never').textContent)),s);
  ok('6 a Never line that refuses the request is caught',/tells staff to refuse the request/.test(s.chk),s.chk);
  await p.emulateMedia({media:'print'});
  ok('7 the offers do not print',await p.evaluate(()=>getComputedStyle(document.getElementById('ebPlanSug')).display==='none'));
  ok('8 no page errors',!errs.length,errs);
  }catch(e){console.log('ERROR',e.stack);fails++;}
  await br.close();console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);
})();
