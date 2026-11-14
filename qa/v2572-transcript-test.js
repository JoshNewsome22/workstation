/* v25.72 captions and transcript (the plan's Option 1, approved by the BCBA): the video library's Steps completed and a
   Transcript beside them, the browser's control bar moved off the picture's caption strip, the phone's own bar and a
   captions track. Simulated data only: AI-generated videos of simulated people; nothing here is about a student.
   A. the files, for all the videos (25 at v25.73): nbh-video-transcripts.js has every video, lines in time order, each inside the video's
      length, a known speaker on each; the people's lines by role, never a name; nbh-video-steps.js lists every step the
      picture's own panel lists (PANEL below, from the frames' plans), with its number and title, in the order the video
      plays them, a step with no moment of its own marked 'open', 'close' or 'with', "Before you start" last; the offline
      list holds both new files and nbh-transcript.js; this test in the release list.
   B. each video's page (25 at v25.73): the transcript's step headings equal the Steps list (same steps, same order, same words);
      the Steps tab shows every step at once; a step only on a card says so and is never marked.
   C. playing (all 25 videos): the right line marked (aria-current) at three times; the right step heading marked; a line
      tapped plays from its start; the search counts the lines with a word; Follow keeps the line in view and goes off when
      the list is scrolled by hand; tabs by the arrow keys; a step only on a card tapped goes to the card.
   D. the band (iPad): the browser's control bar sits below the picture, clear of its caption strip (the picture's bottom
      is 92 px above the player's); TD-1's player too when it has the band (its own commit).
   E. the phone (390 x 844): the picture cropped to its scene (the cards whole), the page's own bar under it (play and
      pause, the time, the position, captions, full screen), every target 44 px, then the tabs, then the title and Open
      the TD-1 card; the browser's controls off.
   F. captions: a real <track> (kind captions) made from the transcript, off at first; CC turns it on, the choice is kept
      on the device (localStorage nbh.videos.pref) and is still on after a reload; the cue at a time is the line heard.
   G. quality: keyboard (the tabs, a line by Enter), aria-current on the spoken line, no smooth scrolling under reduced
      motion, AA contrast of the new text, no text under 12 px, nothing wider than the screen at 390, 820 and 1180 px.
   H. no page errors.
   usage: WS_URL=http://127.0.0.1:8123 node qa/v2572-transcript-test.js */
const L=require(__dirname+'/lib.js');const {BASE,sleep,ROOT}=L;let pw;try{pw=require('playwright');}catch(e){pw=require('/opt/node22/lib/node_modules/playwright');}
const fs=require('fs'),path=require('path'),vm=require('vm'),{spawnSync}=require('child_process');
const DIR=path.join(ROOT,'NBH-Workstation'),U=BASE+'/NBH-Workstation/';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const cx={window:{}};vm.createContext(cx);['nbh-videos.js','nbh-video-steps.js','nbh-video-transcripts.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(DIR,f),'utf8'),cx));
const V=cx.window.NBH_VIDEOS,ST=cx.window.NBH_VIDEO_STEPS||{},TR=cx.window.NBH_VIDEO_TRANSCRIPTS||{},LIST=V.list,BY={};LIST.forEach(v=>{BY[v.key]=v;});
/* the steps each video's own panel lists (from the plans the frames were drawn from; the FCT guide's panel shows 3 to 10,
   its steps 1 and 2 are on its opening card) */
const PANEL={"dro_resetting":["Set the first interval from baseline","Work, with praise for each correct answer","No problem behavior: a break at once","Break over: restart, then prompt","Problem behavior: restart from zero","At the criterion, lengthen the interval"],"dro_class":["Set the interval from baseline","Tell the rule, then start the timer","Whole interval, no disruption: the treat","Disruption: nothing, the timer runs on","Low and stable: momentary checks","Rising again: back to whole-interval"],"dro_momentary":["Interval = mean time between responses","Item close, out of sight; a silent timer","Not happening at that second: the item","Access ends; the next interval starts","Variable: 50–150% of the mean, random","Happening at that second: nothing","Lengthen the interval between sessions"],"dro_tokens":["Teach noticing and hands in the lap first","Staff run the timer: a ticket per clean interval","Picking: restart the timer, no comment","Near zero: lengthen the interval","The student runs the timer and tickets","Staff check her record against theirs"],"ncr_attention":["Set the interval from baseline","At each buzz: a brief comment by name","Between cues: no response to calling out","A raised hand gets a quick answer","Thin the schedule step by step"],"ncr_items":["Interval from the baseline latency","Timer rings: the item, whatever she is doing","Say when it returns; a visible timer","Problem behavior: no item, no reaction","Teach a request and honor it","Lengthen the interval"],"ncr_work":["Confirm escape; fix tasks that are too hard","Variable time: a snack and a friendly comment","Next task right away","Or timed breaks: the break note","The work note: back to work","Lengthen the interval; no extra breaks"],"ncr_between":["Confirm the item maintains the behavior","Free access until he turns it down","Turned down: start the lesson right away","Signal a no-access period: 3, 2, 1","Attention stays; the item returns","Lengthen no-access periods slowly"],"rird_vocal":["Confirm it is not socially maintained","Name, then a known question","Until 3 correct answers in a row","Praise talking; back to play","No answer: model it, or move on","One question can be enough"],"rird_motor":["Confirm it is automatically maintained","Name, then a one-step direction","Until 3 in a row, then specific praise","No response: model it","One direction can be enough"],"rird_pica":["Safety plan; sweep the area","Block at the first touch","Take the item; redirect to food","Teach throwing items away","Praise each discard right away"],"a_highp_praise":["Three easy requests, 1–2 s apart","Brief praise for each one done","The hard request 1–2 s after the last","Done within 10 s: the same brief praise","Not done: say and do nothing","An easy one missed: stop, wait 15 s, restart"],"a_highp_class":["Three easy instructions, at most 5 s apart","The transition instruction within 5 s","Praise named students, then others","Fade to 2, then 1 easy instruction","Now and then, the transition alone"],"a_highp_seatwork":["Beside the desk, after the board examples","Three requests from the list, each within 10 s","Praise each one followed","Not followed: another, until 3 in a row","The seatwork request within 10 s of the third","Started within 10 s: praise, then walk away"],"a_highp_peer":["The teacher cues the peer quietly","Three easy play requests, a new order each time","A play comment after each one done","The social request within 5 s of the third","The classmate answers; the play goes on","Not done: wait about 30 s, start a new sequence"],"dra_attention":["Record study and where attention goes","Off task: no reminders, no scolding","Working: praise right away, first steps too","Attention after each minute of steady work","Out of seat: no answer; hand raised: answer","Drop the cue; keep praising all day"],"dra_escape":["Confirm escape; find her favorites","An instruction: say it, then show it","Done: praise, and the better break","Problem behavior: a short, plain break","Low and steady: a token for each task","Raise the tokens slowly, toward 20"],"dra_tangible":["Confirm the pattern; teach the trade","One instruction to end the activity","Within 10 s: “Thank you” and a coupon","No response: no coupon, no comment","End of session: each coupon, 3 minutes","In class: coupons for the hardest ones"],"dra_automatic":["Confirm automatic; pick leisure materials","Not using one: prompt every 30 s","Requirement met: the break is earned","30 s free: no prompts, no blocking","Time up: back to the materials","Raise the requirement step by step"],"fct_attention":["Find the warning signs; test their function","Give the card; explain it at the start","Card raised: 5–10 s of attention at once","Warning sign: only “Remember to use your card”","Needs more help: prompt on a timer, then lengthen","Longer sessions, the real setting; crisis plan"],"fct_tangible":["List the item situations; test each briefly","The request card always within reach","Set up a situation; card handed: items at once","No card: a second adult points, then guides","Then “wait”: red card for 30 s, then the items","Then “no”: red card up for the rest of the trial"],"fct_thinning_mult":["Confirm the function; record baseline","Teach the card; fade the prompt 0 → 20 s","Every request honored; none for problem behavior","Green: requests honored. Red: not now","Lengthen red, from about 2 s toward 4 min","Still asking on red: remove the card; add an item"],"a_highp":["Three easy requests","The hard request within 3 seconds","Reinforce the hard request","An easy request not done","Wait 30 seconds, then start over","A new order each trial","Fewer easy requests"],"fct-practical-guide-thinning":["A functional analysis confirmed escape","The team picked a low-effort request: a BREAK card","Set up the task","Prompt the request","Honor every request","No break for problem behavior","More work before the break","Something during the wait","New adults and places","A fuller request"],"choice-academic-task-escape":["Confirm escape with brief tests","Set out 4 to 6 of the teacher's tasks","Ask which one; start the one picked","A switch any time, on request","No start: say it, then show it","Keep the choices; record % of time"],"gbg":["State and teach the rules","Two teams, by rows","Rule break: a team mark","5 marks or fewer wins","Winners get privileges"],"chain_backward":["Write the steps; run baseline","He picks an item to earn","Guide all but the last step","Wait 5 s for the last step","Done alone: praise and the item","Next: guide one fewer step"],"chain_forward":["Write the steps; run baseline","He picks an item to earn","Wait 5 s for the first step","Praise, then guide the rest","End of the chain: the item","Next: the first two steps alone","Last: the whole chain alone"],"chain_hw_forward":["Probe, then mark each step","Get attention; give the instruction","A mastered step: wait 2 s","The training step: wait 2 s","Guide every step after it","End of the chain","If the training step is prompted","Two in a row: the next step"],"chain_hw_backward":["Materials ready; give the command","Fully guide the earlier steps","The training step: wait first","Only as much help as needed","Reinforce right away","Record the step and the help","Next: the step before it"],"chain_hw_total":["Task analysis and baseline","One short instruction","Every step, every session","Help only where it is needed","Reinforce at the end only","Score each step","Later: less help"],
 /* v25.91 the three token economy videos and the three prompting videos */
 "token_build":["Set out the parts", "Teach taking from the tray", "Teach the exchange first", "Then the last token", "She places her own tokens", "Work back along the board", "Test that the tokens work"],"token_schedules":["Three schedules, one system", "Token-production schedule", "Exchange-production schedule", "Token-exchange schedule", "A second-order schedule", "Thin the exchange first", "Move to variable schedules"],"token_running":["A wide choice of backups", "Choose at the exchange", "Open or closed economy", "Close it as far as you can", "All teaching earns tokens", "Response cost: token loss", "When responding drops"],"prompt_ltm":["List instructions; baseline", "Instruction once; wait 10 s", "Done alone: praise and item", "If not: model it; wait 5 s", "Still not: guide gently", "Check with extra objects", "Same objects, two actions", "Mastery in the mixed sets"],"prompt_mtl":["Test the prompt types", "She picks what to work for", "Attention; direction once", "Wait 2 s; then full guidance", "Two correct: lighter help", "Lighter again: a light touch", "Reinforce only at this level", "Then alone; mastery"],"prompt_delay":["Pick the controlling prompt", "Zero delay: prompt at once", "Constant: wait up to 5 s", "Before the prompt: reinforce", "Error or no response", "Progressive: a longer wait", "Before the model 5 in a row"],
 /* v25.96 the three extinction videos */
 "ext_wait":["Work at her level; reinforce", "Protest: the work will wait", "Turn away; nothing extra", "Calm 5 s: closer; \"Ready?\"", "Ready: work and attention", "Not ready: away again", "Aggression: also a wait out", "Count and time each wait"],"ext_ignore":["Define it; post tally sheets", "Baseline: how adults answer", "Turn away without comment", "If safe, step out till quiet", "No comfort, no \"stop\"", "Every adult, all day", "Two adults tally some days", "Keep it up; recheck later"],"ext_kind":["Confirm escape or items", "A quick choice of items", "Teach; no physical prompts", "Asks or responds: 30 s item", "Tantrum: kindness, no item", "Then the next instruction", "Item after a calm response", "Offer kindness, never force"],
 /* v25.97 the three escape-antecedent videos */
 "ante_fade":["Confirm the escape function", "First: no instructions", "One instruction per 15 min", "Done alone: a 1-min break", "Problem: next instruction", "Clean session: add one", "Stop at the class rate", "Record each instruction"],"ante_task":["Confirm escape; watch work", "One hypothesis, one change", "Test with and without it", "Aid out: \"Do your work.\"", "No start: read it and point", "Still none: point to the aid", "Repeated work: a new sheet", "Praise working; probe later"],"ante_mix":["Check the preference", "Leave out error-prone facts", "A row: 3 easy, then 1 hard", "A packet; \"row by row\"", "Timer on; move back", "No comments on the work", "Stop, collect, thank him", "Score start time, accuracy"],
 /* v25.99 the three calming-routine videos */
 "calm_breath":["Find the first signs", "Check she can imitate it", "Teach it when calm: model", "She practices; praise it", "At work: watch for signs", "A sign: \"Let's breathe.\"", "Praise the breathing", "No drop: add DRO or FCT"],"calm_muscle":["A quiet room, when calm", "Model: tense, then release", "Large muscles first", "Then small: face, hands", "Prompt as needed; praise", "Learned: alone, 2 sessions", "Then prompt every 2 min", "Record in 6-s intervals"],"calm_plan":["List her own early signs", "Agree on a calm-down area", "Model the three steps", "Role-play: name the stress", "She goes without asking", "There: breathe, then relax", "Practice log, 3 x a week", "Weekly: review the log"],
 /* v26.22 the three low-rates (DRL) videos */
 "drl_card":["Count requests: baseline", "Set a limit below it", "Explain the card; practice", "Card: the limit plus one", "Answer; initial one box", "Past the limit: no answer", "A blank box: a team point", "Keep the class points going"],"drl_signal":["Baseline: time between", "Interval: twice that time", "Teach the two signals", "Green: answer the first one", "Then red, and the timer", "On red: restart the timer", "Timer ends: green again", "Switch signals on time"],"drl_limit":["Count 10 periods: baseline", "Limit below it; a reward", "Tell him the limit", "Tally quietly; teach on", "End: under the limit?", "Met: free time, as planned", "Not met: \"tomorrow\", calmly", "Lower the limit in steps"],
 /* v26.24 the three Shaping videos */
 "shape_dist":["Plan with the family", "Tape lines; liked items", "Start at the door: 6 m", "Items at the current line", "Leaving ends it; no blocking", "Ask: walk to the near line", "2 good sessions: 1 m closer", "Record intervals and probes"],"shape_work":["Pick the task and the goal", "Model the task; show a trade", "\"Working is up to you\"", "Time each stretch of work", "Rank the last 20 stretches", "Longer than 10th: a token", "15 s idle: \"Time to work\"", "Trade tokens at the end"],"shape_fast":["Time 10 answers: baseline", "Tell her the time limit", "Under the limit: a token", "Over it: brief feedback", "Next limit: 10% lower", "Trade tokens right after", "Rule: work it out first", "Correct worked answer: token"],
 /* v26.26 the three competing-items videos */
 "ee_match":["What does it produce?", "Gather about 10 like items", "Free access: keep the top 4", "Check: 15 min, empty table", "Then 15 min with the items", "Then 15 min without again", "Lower after: it is a match", "Give them at those times"],"ee_turn":["Confirm what maintains it", "Find items that compete", "Draw the order of items", "Offer one item", "10 s untouched: next item", "Dropped: put it back once", "No response to stereotypy", "Compare with no items"],"ee_hands":["When are the hands idle?", "Explain the object and rules", "Before the lesson: he picks", "He holds it; no comments", "Misuse: one calm reminder", "After: back in the box", "A 10-minute probe each day", "Tell all staff; plan fading"]};
const ROLES=['Teacher','Student','Aide','Peer','Classmate','Instructor'];
const errs=[];
(async()=>{
 /* ---------------- A. the files ---------------- */
 {const keys=LIST.map(v=>v.key),badT=[],badS=[];
  for(const k of keys){const t=TR[k],d=BY[k].dur;
   if(!Array.isArray(t)||t.length<5){badT.push([k,'missing']);continue;}
   t.forEach((l,i)=>{if(!(l[0]>=0&&l[0]<d))badT.push([k,i,'outside',l[0]]);if(i&&l[0]<t[i-1][0])badT.push([k,i,'order',l[0]]);
    if(!(l[1]==='N'||l[1]==='O'||ROLES.includes(l[1])))badT.push([k,i,'who',l[1]]);if(!l[2]||typeof l[2]!=='string')badT.push([k,i,'text']);});
   const s=(ST[k]||{}).steps||[],P=PANEL[k]||[];const listed=s.filter(x=>x[0]).map(x=>x[0]+' '+x[2]).sort(),want=P.map((x,i)=>(i+1)+' '+x).sort();
   if(JSON.stringify(listed)!==JSON.stringify(want))badS.push([k,'not the panel',listed.length,want.length]);
   if(!s.length||s[s.length-1][0]!==0||s[s.length-1][2]!=='Before you start')badS.push([k,'Before you start not last']);
   const own=s.filter(x=>!x[3]);for(let i=1;i<own.length;i++)if(own[i][1]<own[i-1][1])badS.push([k,'not in the order the video plays them',own[i][0]]);
   s.forEach(x=>{if(x[3]&&!['open','close','with'].includes(x[3]))badS.push([k,'mark',x]);});}
  ok('A nbh-video-transcripts.js: all '+keys.length+' videos, '+Object.values(TR).reduce((a,t)=>a+t.length,0)+' lines, in time order, inside each video, each with a known speaker (narrator, on screen, or a role)',!badT.length,badT.slice(0,8));
  ok('A nbh-video-steps.js: for all '+keys.length+' videos every step of the picture’s own panel, its number and words, in the order the video plays them, a step with no moment of its own marked, Before you start last',!badS.length,badS.slice(0,8));
  const card=Object.entries(ST).reduce((a,[k,s])=>a+s.steps.filter(x=>x[3]).length,0);ok('A '+card+' steps with no moment of their own are listed (on a card, or shown with another step)',card>=30,card);
  const names=Object.values(TR).flat().filter(l=>l[1]!=='N'&&l[1]!=='O'&&!ROLES.includes(l[1]));ok('A the people are named by role only',!names.length,names.slice(0,3));
  const py='import importlib.util,json,sys\nsp=importlib.util.spec_from_file_location("pw",sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)\nprint(json.dumps(m.files_of(sys.argv[2])))';
  const fl=spawnSync('python3',['-c',py,path.join(ROOT,'tools','pwa-sw.py'),DIR],{encoding:'utf8'});let files=[];try{files=JSON.parse(fl.stdout);}catch(e){}
  ok('A the offline list holds nbh-video-transcripts.js and nbh-transcript.js',['nbh-video-transcripts.js','nbh-transcript.js','nbh-video-steps.js'].every(f=>files.includes(f)),fl.stderr.slice(0,300));
  ok('A the release list runs this test',/^v2572-transcript-test$/m.test(fs.readFileSync(path.join(ROOT,'qa','release-list.txt'),'utf8')));
  const src=fs.readFileSync(path.join(DIR,'nbh-video-transcripts.js'),'utf8');ok('A nbh-video-transcripts.js names no practice',!/Newsome/i.test(src));}

 const b=await pw.chromium.launch();
 const mk=async(w,h,o)=>{const ctx=await b.newContext(Object.assign({viewport:{width:w,height:h},hasTouch:true,isMobile:w<1000,userAgent:L.IPAD_UA},o||{}));
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(w+': '+String(e.message||e)));p.on('dialog',d=>d.accept().catch(()=>{}));return {ctx,p};};
 const open=async(p,k,extra)=>{await p.evaluate(([k,x])=>{location.hash='#video='+k+(x||'');},[k,extra||'']);await p.waitForFunction(k=>window.__vl&&window.__vl.key()===k&&document.getElementById('vlTabs'),k,{timeout:20000});await sleep(150);};
 const loaded=p=>p.waitForFunction(()=>{const v=document.getElementById('vlVideo');return v&&/^blob:/.test(v.src)&&v.readyState>=1;},null,{timeout:60000}).then(()=>true,()=>false);
 const seek=(p,t)=>p.evaluate(t=>new Promise(r=>{const v=document.getElementById('vlVideo');v.muted=true;v.pause();const done=()=>setTimeout(r,120);v.addEventListener('seeked',done,{once:true});v.currentTime=t;setTimeout(r,3000);}),t);

 /* ---------------- B and C. each video's page, playing ---------------- */
 {const {ctx,p}=await mk(1180,820);await p.goto(U+'videos.html');await p.waitForFunction(()=>window.__vl,null,{timeout:20000});
  const badH=[],badV=[],badM=[],badSeek=[],badQ=[],badCard=[];let marks=0;
  for(const v of LIST){const k=v.key,s=ST[k].steps,t=TR[k];await open(p,k);
   /* B: the headings, the Steps tab */
   const r=await p.evaluate(()=>{const heads=[...document.querySelectorAll('#vlTrans .nt-h[data-step]')].map(h=>[+h.dataset.step,h.querySelector('span:last-child').firstChild.nextSibling?h.textContent:h.textContent]);
     const lis=[...document.querySelectorAll('#vlSteps li')];const box=document.getElementById('vlSteps').getBoundingClientRect();
     return {heads:[...document.querySelectorAll('#vlTrans .nt-h[data-step]')].map(h=>+h.dataset.step+'|'+h.querySelector('.nt-n').nextSibling.textContent.replace(/^Step \d+: /,'')),
      shown:lis.every(li=>{const q=li.getBoundingClientRect();return li.offsetParent&&q.height>0&&q.top>=box.top-1&&q.bottom<=box.bottom+1;})&&!document.getElementById('vlSteps').hidden,
      n:lis.length,notes:lis.filter(li=>li.dataset.where).map(li=>li.querySelector('.vl-snote')&&li.querySelector('.vl-snote').textContent)};});
   const want=s.map(x=>x[0]+'|'+x[2]+(x[3]==='open'?(BY[k].frame==='full'?'Said at the opening':'On the opening card'):x[3]==='close'?'On the closing card':x[3]==='with'?'Shown with step '+x[4]:''));
   if(JSON.stringify(r.heads)!==JSON.stringify(want))badH.push([k,r.heads.length,want.length,r.heads.find((h,i)=>h!==want[i]),want.find((h,i)=>h!==r.heads[i])]);
   if(!r.shown||r.n!==s.length||r.notes.some(x=>!x))badV.push([k,r]);
   if(!(await loaded(p))){badM.push([k,'not loaded']);continue;}
   /* C: three times: the line heard marked, the step heading marked, never a card-only step */
   const sp=t.filter(l=>l[1]!=='O');const picks=[sp[0],sp[Math.floor(sp.length/2)],sp[sp.length-1]];
   for(const l of picks){const at=Math.min(v.dur-0.2,l[0]+0.3);await seek(p,at);
    const want2=sp.filter(x=>x[0]<=at+0.05).pop();
    const m=await p.evaluate(()=>{const c=[...document.querySelectorAll('#vlTrans .nt-ln[aria-current]')];const onS=[...document.querySelectorAll('#vlSteps li.vl-on')];
      return {n:c.length,text:c[0]?c[0].querySelector('.nt-x').textContent:'',cardOn:onS.filter(li=>li.dataset.where).length};});
    marks++;if(m.n!==1||m.text!==want2[2]||m.cardOn)badM.push([k,at,m,want2[2].slice(0,40)]);}
   /* a line tapped plays from its start (the Transcript tab) */
   await p.locator('#vlTabT').click();await sleep(150);const li=sp[Math.floor(sp.length/3)];
   const idx=t.indexOf(li);await p.locator('#vlTrans .nt-ln[data-i="'+idx+'"]').click();await sleep(400);
   const ct=await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.pause();return v.currentTime;});if(!(ct>=li[0]-0.05&&ct<li[0]+1.5))badSeek.push([k,li[0],ct]);
   /* the search */
   const word=(li[2].match(/[A-Za-z]{5,}/)||['the'])[0];const exp=t.filter(l=>l[2].toLowerCase().includes(word.toLowerCase())).length;
   await p.fill('#vlTrans input[type=search]',word);await sleep(400);const got=await p.evaluate(()=>document.querySelectorAll('#vlTrans .nt-ln mark').length?new Set([...document.querySelectorAll('#vlTrans .nt-ln mark')].map(m=>m.closest('.nt-ln'))).size:0);
   if(got!==exp)badQ.push([k,word,got,exp]);await p.fill('#vlTrans input[type=search]','');
   /* a step only on a card, tapped, goes to the card */
   await p.locator('#vlTabS').click();await sleep(100);const ci=s.findIndex(x=>x[3]==='close'||x[3]==='open');
   if(ci>=0){await p.locator('#vlSteps li').nth(ci).locator('.vl-sbtn').click();await sleep(500);const c2=await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.pause();return {t:v.currentTime,on:[...document.querySelectorAll('#vlSteps li.vl-on')].map(li=>li.dataset.where||'')};});
    if(!(c2.t>=s[ci][1]-0.05&&c2.t<s[ci][1]+1.5)||c2.on.some(Boolean))badCard.push([k,s[ci],c2]);}}
  /* v25.75 the videos re-drawn in the full-picture frame: marked in the list, their opening line says "a simulated example" */
  {const full=LIST.filter(v=>v.frame==='full'),bad=full.filter(v=>{const n=(TR[v.key]||[]).filter(l=>l[1]==='N')[0];return !n||!/(: a simulated example of |\. A simulated example, after the recommendations of |\. A simulated example of the TD-1 card after )/.test(n[2])||/AI-generated/.test(n[2]);   /* v25.91 the token videos follow a review, and say so; v25.96 the extinction videos name the card after their title */}).map(v=>v.key);
   ok('A v25.75 '+full.length+' videos are marked as re-drawn (frame: full); the first narrated line of each says "a simulated example", not "AI-generated"',full.length===55&&!bad.length,{n:full.length,bad});}
  ok('B for all '+LIST.length+' videos the transcript’s step headings equal the Steps list (same steps, order, words and card notes)',!badH.length,badH.slice(0,5));
  ok('B the Steps tab shows every step at once, a step only on a card says so',!badV.length,badV.slice(0,3));
  ok('C the line heard is marked (aria-current, one line) at three times in each of the '+LIST.length+' videos ('+marks+' checks); no card-only step marked',!badM.length,badM.slice(0,5));
  ok('C a transcript line tapped plays from its start (every video)',!badSeek.length,badSeek.slice(0,5));
  ok('C the search marks every line with the word, and only those (every video)',!badQ.length,badQ.slice(0,5));
  ok('C a step only on a card, tapped, goes to the card and is not marked',!badCard.length,badCard.slice(0,4));
  /* Follow: in view, off when scrolled by hand, back on */
  await open(p,'dro_resetting','&tab=transcript');await loaded(p);await seek(p,100);await sleep(700);
  const f1=await p.evaluate(()=>{const l=document.querySelector('#vlTrans .nt-list'),c=l.querySelector('.nt-ln[aria-current]'),a=l.getBoundingClientRect(),q=c.getBoundingClientRect();return {inView:q.top>=a.top-1&&q.bottom<=a.bottom+1,on:document.querySelector('#vlTrans .nt-follow').getAttribute('aria-pressed')};});
  await sleep(1000);await p.mouse.move(1000,500);await p.evaluate(()=>{const l=document.querySelector('#vlTrans .nt-list');l.dispatchEvent(new WheelEvent('wheel',{deltaY:-300,bubbles:true}));l.scrollTop=0;});await sleep(200);
  const f2=await p.evaluate(()=>document.querySelector('#vlTrans .nt-follow').getAttribute('aria-pressed'));
  await p.locator('#vlTrans .nt-follow').click();await sleep(700);const f3=await p.evaluate(()=>{const l=document.querySelector('#vlTrans .nt-list'),c=l.querySelector('.nt-ln[aria-current]'),a=l.getBoundingClientRect(),q=c.getBoundingClientRect();return q.top>=a.top-1&&q.bottom<=a.bottom+1;});
  ok('C Follow keeps the line heard in view, goes off when the list is scrolled by hand, and brings it back when turned on',f1.inView&&f1.on==='true'&&f2==='false'&&f3,{f1,f2,f3});
  /* tabs by keyboard, a line by Enter */
  await p.locator('#vlTabT').focus();await p.keyboard.press('ArrowLeft');await sleep(100);
  const k1=await p.evaluate(()=>({sel:document.activeElement.id,steps:!document.getElementById('vlSteps').hidden,tr:document.getElementById('vlTrans').hidden}));
  await p.keyboard.press('ArrowRight');await sleep(100);const k2=await p.evaluate(()=>({sel:document.activeElement.id,tr:!document.getElementById('vlTrans').hidden}));
  const t5=TR.dro_resetting.filter(l=>l[1]==='N')[2];await p.locator('#vlTrans .nt-ln[data-i="'+TR.dro_resetting.indexOf(t5)+'"]').focus();await p.keyboard.press('Enter');await sleep(400);
  const k3=await p.evaluate(()=>{const v=document.getElementById('vlVideo');v.pause();return v.currentTime;});
  ok('G keyboard: the arrow keys move between the tabs (Steps, Transcript), Enter on a line plays from it',k1.sel==='vlTabS'&&k1.steps&&k1.tr&&k2.sel==='vlTabT'&&k2.tr&&k3>=t5[0]-0.05&&k3<t5[0]+1.5,{k1,k2,k3,t:t5[0]});
  /* D. the band */
  const bd=await p.evaluate(()=>{const v=document.getElementById('vlVideo'),r=v.getBoundingClientRect(),pic=r.width*9/16,cs=getComputedStyle(v);
    return {h:Math.round(r.height),pic:Math.round(pic),fit:cs.objectFit,pos:cs.objectPosition,strip:Math.round(pic*570/720),controls:v.controls};});
  ok('D iPad: the player is the picture plus a 92 px band, the picture at the top, so the browser’s bar ('+(bd.h-bd.pic)+' px) sits below its caption strip',bd.h-bd.pic>=90&&bd.fit==='contain'&&/^50% 0/.test(bd.pos)&&bd.controls,bd);
  /* F. captions */
  const c0=await p.evaluate(()=>{const tr=document.querySelector('#vlVideo track');return tr?{kind:tr.kind,mode:tr.track.mode,cues:tr.track.cues?tr.track.cues.length:0,pressed:document.getElementById('vlCC').getAttribute('aria-pressed')}:null;});
  await p.locator('#vlCC').click();await seek(p,61);
  const c1=await p.evaluate(()=>{const t=document.querySelector('#vlVideo track').track;return {mode:t.mode,cue:t.activeCues&&t.activeCues[0]?t.activeCues[0].text:'',pref:localStorage.getItem('nbh.videos.pref')};});
  await p.reload();await p.waitForFunction(()=>document.querySelector('#vlVideo track'),null,{timeout:20000});await loaded(p);await sleep(300);
  const c2=await p.evaluate(()=>({mode:document.querySelector('#vlVideo track').track.mode,pressed:document.getElementById('vlCC').getAttribute('aria-pressed')}));
  const heard=TR.dro_resetting.filter(l=>l[1]!=='O'&&l[0]<=61).pop()[2];
  ok('F captions: a real <track> (kind captions, '+(c0&&c0.cues)+' cues) off at first; CC turns it on; the cue at 1:01 is the line heard; kept on this device after a reload',
   c0&&c0.kind==='captions'&&c0.mode!=='showing'&&c0.pressed==='false'&&c0.cues>20&&c1.mode==='showing'&&heard.startsWith(c1.cue.replace(/\n/g,' ').slice(0,20))&&/"cc":true/.test(c1.pref||'')&&c2.mode==='showing'&&c2.pressed==='true',{c0,c1,c2});
  await p.evaluate(()=>localStorage.removeItem('nbh.videos.pref'));await ctx.close();}

 /* ---------------- E. the phone ---------------- */
 {const {ctx,p}=await mk(390,844);await p.goto(U+'videos.html#video=dro_resetting');await p.waitForFunction(()=>window.__vl&&document.getElementById('vlTabs'),null,{timeout:20000});await loaded(p);
  await seek(p,62);
  const r=await p.evaluate(()=>{const g=id=>document.getElementById(id).getBoundingClientRect().toJSON();const v=document.getElementById('vlVideo'),pl=v.parentNode.getBoundingClientRect(),vr=v.getBoundingClientRect();
    const bar=[...document.querySelectorAll('#vlBar button,#vlBar input')].filter(e=>e.offsetParent).map(e=>{const q=e.getBoundingClientRect();return [e.id,Math.round(q.width),Math.round(q.height)];});
    return {controls:v.controls,crop:v.parentNode.classList.contains('vl-crop'),scale:vr.width/pl.width,off:(pl.top-vr.top)/vr.height,bar:g('vlBar'),player:pl.toJSON(),tabs:g('vlTabs'),title:g('vlTitle'),open:document.querySelector('.vl-open').getBoundingClientRect().toJSON(),targets:bar,sw:document.documentElement.scrollWidth};});
  /* v25.75 a video re-drawn in the full-picture frame is shown whole on a phone (its scene is the whole picture); one still in the first frame is cropped to its scene */
  ok('E phone: a re-drawn video is shown whole, not cropped ('+r.scale.toFixed(3)+' times the player’s width, '+(r.off*720).toFixed(0)+' px above), the browser’s controls off',BY.dro_resetting.frame==='full'&&!r.crop&&!r.controls&&Math.abs(r.scale-1)<0.01&&Math.abs(r.off*720)<2,r);
  {const old=LIST.find(v=>v.frame!=='full');
   if(old){const q=await ctx.newPage();await q.goto(U+'videos.html#video='+old.key);await q.waitForFunction(()=>window.__vl&&document.getElementById('vlTabs'),null,{timeout:20000});await loaded(q);
    const S0=(ST[old.key]||{}).caps||[],at=(S0.find(c=>c[2])||[20])[0]+1;await seek(q,at);
    const r0=await q.evaluate(()=>{const v=document.getElementById('vlVideo'),pl=v.parentNode.getBoundingClientRect(),vr=v.getBoundingClientRect();return {controls:v.controls,crop:v.parentNode.classList.contains('vl-crop'),full:v.parentNode.classList.contains('vl-full'),scale:vr.width/pl.width,off:(pl.top-vr.top)/vr.height};});
    ok('E phone: a video still in the first frame ('+old.key+') is cropped to its scene (896 x 504 of the frame: '+r0.scale.toFixed(3)+' times wider, '+(r0.off*720).toFixed(0)+' px of the frame above)',r0.crop&&!r0.controls&&!r0.full&&Math.abs(r0.scale-1280/896)<0.01&&Math.abs(r0.off*720-64)<2,r0);await q.close();}
   else ok('E phone: no video is left in the first frame',true);}
  ok('E phone: the page’s own bar right under the picture with 5 controls of 44 px or more (Picture in Picture the fifth, v25.91) and the time, then the tabs, then the title and Open the TD-1 card',Math.abs(r.bar.top-r.player.bottom)<1&&r.targets.length===5&&r.targets.every(x=>x[1]>=44&&x[2]>=44)&&r.tabs.top>=r.bar.bottom&&r.title.top>=r.tabs.bottom&&r.open.top>r.title.top&&r.sw<=390,r);
  await seek(p,5);const card=await p.evaluate(()=>document.querySelector('.vl-player').classList.contains('vl-full'));
  ok('E phone: the opening card is shown whole (not cropped)',card);
  await p.locator('#vlBPlay').tap();await sleep(600);const pl1=await p.evaluate(()=>{const v=document.getElementById('vlVideo');return {paused:v.paused,label:document.getElementById('vlBPlay').getAttribute('aria-label')};});
  await p.locator('#vlBPlay').tap();await sleep(200);const pl2=await p.evaluate(()=>document.getElementById('vlVideo').paused);
  await p.evaluate(()=>{const s=document.getElementById('vlBSeek');s.value='90';s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
  const sk=await p.evaluate(()=>({t:document.getElementById('vlVideo').currentTime,time:document.getElementById('vlBTime').textContent}));
  await p.locator('#vlBCC').tap();await sleep(150);const cc=await p.evaluate(()=>({mode:document.querySelector('#vlVideo track').track.mode,p:document.getElementById('vlBCC').getAttribute('aria-pressed')}));
  ok('E phone: Play plays and pauses, the position moves the video, the time follows, CC turns the captions on',!pl1.paused&&pl1.label==='Pause'&&pl2&&Math.abs(sk.t-90)<1&&/^1:3\d \/ 2:15$/.test(sk.time)&&cc.mode==='showing'&&cc.p==='true',{pl1,pl2,sk,cc});
  await p.evaluate(()=>localStorage.removeItem('nbh.videos.pref'));
  /* G. the new text: size and contrast */
  await p.locator('#vlTabT').tap();await sleep(200);
  const q=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]);};
    const bg=e=>{while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;e=e.parentElement;}return 'rgb(255,255,255)';};
    const out={small:[],low:[]};document.querySelectorAll('#vlTabs *,#vlBar *').forEach(e=>{if(!e.offsetParent||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;if(e.closest('.vl-sr'))return;
      const cs=getComputedStyle(e);if(parseFloat(cs.fontSize)<12)out.small.push(e.className+' '+cs.fontSize);
      const a=lum(cs.color),b2=lum(bg(e)),r=(Math.max(a,b2)+0.05)/(Math.min(a,b2)+0.05);if(r<4.5)out.low.push(e.className+' '+r.toFixed(2));});return out;});
  ok('G phone: no text under 12 px in the tabs, the transcript and the bar; every text there at AA contrast (4.5:1)',!q.small.length&&!q.low.length,q);
  await ctx.close();}

 /* ---------------- G. reduced motion; nothing wider than the screen ---------------- */
 {const {ctx,p}=await mk(820,1180,{reducedMotion:'reduce'});await p.goto(U+'videos.html#video=dro_resetting&tab=transcript');await p.waitForFunction(()=>document.getElementById('vlTabs'),null,{timeout:20000});await loaded(p);
  await seek(p,5);await sleep(200);const y0=await p.evaluate(()=>document.querySelector('#vlTrans .nt-list').scrollTop);
  await p.evaluate(()=>new Promise(r=>{const v=document.getElementById('vlVideo');v.addEventListener('seeked',()=>r(),{once:true});v.currentTime=120;}));
  const y1=await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>r(document.querySelector('#vlTrans .nt-list').scrollTop))));await sleep(400);
  const y2=await p.evaluate(()=>document.querySelector('#vlTrans .nt-list').scrollTop);
  ok('G under reduced motion the transcript jumps to the line (no smooth scroll: '+Math.round(y0)+' to '+Math.round(y1)+' at once)',y1>y0+50&&Math.abs(y2-y1)<2,{y0,y1,y2});
  const cur=await p.evaluate(()=>{const c=document.querySelector('#vlTrans .nt-ln[aria-current]');return c?c.getAttribute('aria-current'):null;});ok('G the spoken line carries aria-current',cur==='true');
  await ctx.close();
  const wide=[];for(const [w,h] of [[390,844],[820,1180],[1180,820]]){const {ctx,p}=await mk(w,h);await p.goto(U+'videos.html#video=fct-practical-guide-thinning&tab=transcript');await p.waitForFunction(()=>document.getElementById('vlTabs'),null,{timeout:20000});await sleep(400);
   const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>w)wide.push([w,sw]);await ctx.close();}
  ok('G nothing wider than the screen at 390, 820 and 1180 px',!wide.length,wide);}

 /* ---------------- D. TD-1's player: the band and Transcript (when TD-1 has them) ---------------- */
 {const {ctx,p}=await mk(1180,820);const TD='TD-1_Function-Based-Treatment-Developer_v2026-09.html';
  await p.goto(U+TD+'#card=dro-break-after-calm-interval');await p.waitForFunction(()=>window.__tdVideo,null,{timeout:60000}).catch(()=>{});
  const has=await p.evaluate(()=>!!window.__tdVideo);
  if(has){await sleep(1200);await p.evaluate(()=>window.__tdVideo.play('dro_resetting'));
   await p.waitForFunction(()=>{const v=document.getElementById('tv-video');return v&&!v.hidden&&v.readyState>=1;},null,{timeout:60000}).catch(()=>{});
   const r=await p.evaluate(()=>{const v=document.getElementById('tv-video'),q=v.getBoundingClientRect(),cs=getComputedStyle(v),t=document.getElementById('tv-tr');
     return {band:Math.round(q.height-q.width*9/16),fit:cs.objectFit,pos:cs.objectPosition,tr:!!t,th:t?Math.round(t.getBoundingClientRect().height):0};});
   if(r.tr){const pop=ctx.waitForEvent('page',{timeout:8000}).catch(()=>null);await p.locator('#tv-tr').click();const np=await pop;
    const pref=await p.evaluate(()=>localStorage.getItem('nbh.videos.pref'));let tab='';
    if(np){await np.waitForFunction(()=>document.getElementById('vlTabs'),null,{timeout:20000}).catch(()=>{});tab=await np.evaluate(()=>{const t=document.querySelector('#vlTabT');return t?t.getAttribute('aria-selected')+' '+location.hash:'';}).catch(()=>'');}
    ok('D TD-1’s player: the picture plus a '+r.band+' px band at the bottom for the browser’s bar; Transcript ('+r.th+' px) opens the video’s page on its Transcript tab',r.band>=90&&r.fit==='contain'&&/^50% 0/.test(r.pos)&&r.th>=44&&/"tab":"transcript"/.test(pref||'')&&/^true #video=dro_resetting/.test(tab),{r,pref,tab});}
   else ok('D TD-1’s player has no band or Transcript yet (its own commit)',true);}
  await ctx.close();}

 ok('H no page errors',!errs.length,errs.slice(0,5));
 await b.close();
 console.log(bad?'FAILED '+bad+' of '+n:'ALL PASSED '+n+'/'+n);process.exit(bad?1:0);
})().catch(e=>{console.log('FAIL crashed '+(e&&e.stack||e));process.exit(1);});
