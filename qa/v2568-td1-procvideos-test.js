/* v25.68 (the BCBA, 11/7) Form TD-1's procedure videos for DRO, NCR (with NCE and A_NCA) and RIRD, and Set the first
   interval from baseline on each DRO card. Simulated data only.
   A. the eleven files: each beside the forms, a header that says what it is (AI-generated, simulated people), MP4 data
      whose size and SHA-256 match the header; each in pwa-test's list of files kept offline; this test in the release list.
   B. the mapping: every card of DRO (90), NCR (75), NCE (13), A_NCA (11) and RIRD (53) shows the video this test expects
      (the lists below, read from each card's fields), the counts by video; the 6 RIRD cards none fits have none.
   C. the lines: the card a video was made from says "The video shows this card's steps: ..."; every other card "The video
      shows the closest version, after <its studies>: <what it shows>.", with at most one clause, and the clauses this test
      expects on named cards (the interval not restarted, another function, access throughout, another behavior than pica,
      redirection to the task, echoes); a card with no video has no button and no line, in the bank panel and on the plan;
      a DRO card from the menu shows the resetting video, and the momentary one when its DRO type is momentary.
   D. each video: no file loaded until asked; its source card's button loads its file and plays it from the device
      (its length, 720p), with its title and its note (AI video model, the cards it was made from, simulated, adapt).
   E. the interval helper: the arithmetic (session seconds ÷ responses, averaged; 50% to 100% of the mean; the 5-s floor;
      a session with no responses left out); on a DRO card it opens, computes as typed, never fills the card's field, Go to
      the field moves to it, each way of lengthening opens its card; Form DD-1's baseline fills the rows (a count, a rate
      per hour) and says a school day is not a session; not saved, not printed, outside a signed record's comparison.
   F. touch targets of 44 px on the iPad; no page errors.
   usage: WS_URL=http://127.0.0.1:8561 WS_ROOT=. node qa/v2568-td1-procvideos-test.js */
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const URL=(process.env.WS_URL||'http://127.0.0.1:8561')+'/NBH-Workstation/';const ROOT=process.env.WS_ROOT||'.';
const DIR=path.join(ROOT,'NBH-Workstation');const file=pre=>fs.readdirSync(DIR).find(f=>f.startsWith(pre));
const IPAD='Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let n=0,bad=0;const ok=(t,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+n+' '+t+(c?'':' '+JSON.stringify(d===undefined?'':d).slice(0,900)));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const bsrc=fs.readFileSync(path.join(DIR,'nbh-td1-bank.js'),'utf8');const bctx={};vm.createContext(bctx);vm.runInContext(bsrc.replace('const TD1_BANK=','this.TD1_BANK='),bctx);const BANK=bctx.TD1_BANK;
const CODES=['DRO','NCR','NCE','A_NCA','RIRD'];const CARDS=BANK.protocols.filter(p=>CODES.includes(p.code));
/* the eleven videos: file, the cards each was made from, its studies, its length (s) */
const VID={
 dro_resetting:{f:'nbh-td1-video-dro-resetting.js',src:['dro-break-after-calm-interval'],after:'Kodak et al. (2003)',dur:135.3},
 dro_class:{f:'nbh-td1-video-dro-class.js',src:['dro-whole-interval-classroom','dro-whole-then-momentary'],after:'Repp et al. (1983) and Barton et al. (1986)',dur:143.6},
 dro_momentary:{f:'nbh-td1-video-dro-momentary.js',src:['dro-unsignaled-momentary','dro-variable-momentary'],after:'Hammond et al. (2011) and Lindberg et al. (1999)',dur:135.4},
 dro_tokens:{f:'nbh-td1-video-dro-tokens.js',src:['dro-self-monitored-timer','dro-selfmanage-timer-tokens'],after:'Tiger et al. (2009) and Tereshko et al. (2021)',dur:113.0},
 ncr_attention:{f:'nbh-td1-video-ncr-attention.js',src:['ncr-attention-ft1-after-school','ncr-ft-attention-classroom'],after:'Noel & Getch (2016) and Rasmussen & O’Neill (2006)',dur:89.4},
 ncr_items:{f:'nbh-td1-video-ncr-items.js',src:['ncr-latency-based-tangible','ncr-signaled-timer-return','ncr-thin-first-then-requests'],after:'Lalli et al. (1997), Gouboth et al. (2007) and Goh et al. (2000)',dur:98.6},
 ncr_work:{f:'nbh-td1-video-ncr-work.js',src:['ncr-vt-food-praise-demands','nce-fixed-time-breaks-notes'],after:'Lomas et al. (2010) and Waller & Higbee (2010)',dur:87.9},
 ncr_between:{f:'nbh-td1-video-ncr-between.js',src:['ncr-presession-item-access','ncr-signaled-thinning-alternatives'],after:'Rispoli et al. (2011) and Slocum et al. (2018)',dur:88.5},
 rird_vocal:{f:'nbh-td1-video-rird-vocal.js',src:['rird-vocal-stereotypy-demands','rird-vocal-questions','rird-one-question-vocal-stereotypy'],after:'Ahearn et al. (2007), Ahrens et al. (2011) and Toper-Korkmaz et al. (2018)',dur:102.8},
 rird_motor:{f:'nbh-td1-video-rird-motor.js',src:['rird-motor-directions-school','rird-one-motor-demand'],after:'Cassella et al. (2011) and Saini et al. (2015)',dur:91.4},
 rird_pica:{f:'nbh-td1-video-rird-pica.js',src:['rird-block-pica-on-touch','rird-pica-block-redirect-food','rird-pica-block-redirect-discard'],after:'McCord et al. (2005), Hagopian & Adelinis (2001) and Frank-Crawford et al. (2025)',dur:83.2}};
/* the closest video for every card, read by hand from its fields (lab, params, steps, fn) */
const EXP={
 dro_class:'dro-30min-engagement-medication dro-calm-transition dro-classwide-star-board dro-cough-mealtime-praise dro-evening-call dro-free-time-staying-seated dro-injury-check-levels dro-peer-play-prompts-timeout dro-presession-rule dro-recess-safety-prize dro-whole-interval-classroom dro-whole-then-momentary',
 dro_momentary:'dro-calm-hands-check dro-momentary-checkins-covert-picking dro-momentary-face-touching-mask dro-momentary-fixed-vs-variable dro-momentary-omission-tangible dro-momentary-stereotypy dro-ribbon-momentary dro-token-earn-random-checks dro-unsignaled-momentary dro-variable-momentary dro-variable-momentary-attention',
 dro_tokens:'dro-attending-intervals-points dro-check-other-behavior dro-coupon-wait-instruction dro-daily-sticker-self-monitoring dro-hands-down-chips dro-hourly-contract-breaks dro-hourly-token-no-aggression dro-hourly-token-rules dro-mask-tokens dro-peer-time-coupons dro-quiet-period-points dro-self-monitored-timer dro-self-record-stereotypy dro-selfmanage-timer-tokens dro-stars-puzzle-aggression dro-sticker-chart-assault dro-tic-free-intervals dro-tic-free-intervals-2017 dro-tic-free-tokens dro-tic-free-tokens-contingency dro-token-nailbiting-selfmanaged dro-token-pennies dro-token-work-exit dro-video-review-face-touching',
 ncr_between:'ncr-presession-attention-block ncr-presession-item-access ncr-presession-satiation ncr-pretrial-preferred-access ncr-signaled-thinning-alternatives',
 ncr_items:'ncr-120-percent-free-access ncr-adjusting-irt-thinning ncr-arbitrary-preferred-items ncr-dense-to-thin-ext ncr-dense-vt-with-alternatives ncr-fixed-time-dro-extinction ncr-ft-before-instruction ncr-ft-response-class ncr-large-magnitude-delivery ncr-latency-based-tangible ncr-matched-items-elopement ncr-pair-activity-build-preference ncr-preferred-item-substitute ncr-preinstruction-preferred-items ncr-self-restraint-pillow ncr-severe-behavior-case-series ncr-signaled-timer-return ncr-tangible-plus-request ncr-tangible-video-elopement ncr-thin-first-then-requests ncr-thin-five-minute-start ncr-thin-no-ext-plus-card-request ncr-variable-time-integrity-caution ncr-variable-time-item ncr-with-extinction-resurgence ncr-yoked-ft-after-dra',
 ncr_work:'ncr-edibles-during-evoking-sounds ncr-enriched-break-on-timer-during-work ncr-feeding-continuous-play ncr-feeding-toys-throughout ncr-ft-edible-during-work ncr-glasses-wearing-package ncr-meal-video-thinned-plus-preferred-bite ncr-mealtime-continuous-access ncr-music-response-cost ncr-nondirective-prompts-hygiene ncr-preferred-exercise-routine ncr-prosthesis-wear ncr-snack-before-demands ncr-snack-during-work ncr-tokens-fixed-time ncr-toy-attention-prone ncr-video-food-refusal ncr-vt-food-during-demands ncr-vt-food-praise-demands',
 rird_motor:'rird-blocking-demands-automatic rird-context-specific-redirection rird-dtt-redirect-stereotypy rird-hand-mouthing-toy-play rird-infant-toy-redirection rird-motor-demands rird-motor-demands-adult-vs-talk rird-motor-demands-every-third rird-motor-directions-school rird-multiple-schedule-bracelet-free-access rird-nonvocal-demands-two-settings rird-one-motor-demand rird-positive-practice-stereotypy rird-signaled-stereotypy-breaks',
 rird_pica:'rird-arranging-block-matched rird-block-hand-to-mouth-emesis rird-block-mouthing-reward-items rird-block-pica-on-touch rird-block-picking-redirect-toy rird-block-redirect-matched-toy rird-block-stereotypy-leisure rird-block-tapping-hanging-items rird-blocking-motor-stereotypy rird-eye-poke-blocking rird-hand-mouthing-block rird-immediate-interruption rird-pica-block-redirect-discard rird-pica-block-redirect-food rird-pica-card-cue rird-pica-teen-parent-proximity-fading rird-poison-hazard-insitu rird-rocking-ratio-praise rird-rocking-task-ratio',
 none:'rird-arm-overcorrection rird-awareness-tone-device rird-bruxism-vocal-chin-cue rird-bruxism-vocal-chin-cue-2021 rird-erp-repetitive-arranging rird-foot-overcorrection'};
const WANT={};Object.keys(EXP).forEach(k=>EXP[k].split(' ').forEach(id=>{WANT[id]=k==='none'?'':k;}));
/* the rest of each code: DRO resetting, NCE during work, A_NCA and the other NCR attention, RIRD vocal */
CARDS.forEach(p=>{if(p.id in WANT)return;WANT[p.id]=p.code==='DRO'?'dro_resetting':p.code==='NCE'?'ncr_work':p.code==='A_NCA'?'ncr_attention':p.code==='NCR'?'ncr_attention':p.code==='RIRD'?'rird_vocal':'?';});
const COUNTS={dro_resetting:43,dro_tokens:24,dro_class:12,dro_momentary:11,ncr_attention:36,ncr_items:26,ncr_work:32,ncr_between:5,rird_vocal:14,rird_motor:14,rird_pica:19,'':6};
/* the clause this test expects on named cards (every other card: none, or one of these forms) */
const CLAUSE={'dro-sticker-chart-assault':'This card does not restart the interval after the behavior.','dro-hourly-token-rules':'This card does not restart the interval after the behavior.',
 'ncr-preferred-item-substitute':'This card is for behavior maintained by attention.','a_nca-praise-during-hard-work':'This card is for behavior maintained by escape from tasks.',
 'ncr-tangible-video-elopement':'This card gives the reinforcer throughout, not on a timer.','ncr-thin-no-ext-plus-card-request':'',
 'rird-eye-poke-blocking':'The clip shows pica; this card is for another behavior: block eye poking hand over hand while toys and attention stay available.','rird-pica-card-cue':'',
 'rird-dtt-redirect-stereotypy':'This card redirects to the task or activity at hand, not to one-step directions.','rird-motor-demands':'',
 'rird-echo-demands-vocal-stereotypy':'This card asks for echoes (vocal imitation), not answers to questions.','rird-vocal-stereotypy-questions':'','dro-tic-free-tokens':'','dro-30min-engagement-medication':''};
const CLAUSES=[/^This card does not restart the interval after the behavior\.$/,/^This card restarts the interval after the behavior\.$/,/^This card is for behavior maintained by (attention|access to items|escape from tasks|automatic reinforcement)\.$/,
 /^This card gives the reinforcer throughout, not on a timer\.$/,/^The clip shows pica; this card is for another behavior: [a-z].+\.$/,/^This card redirects to the task or activity at hand, not to one-step directions\.$/,/^This card asks for echoes \(vocal imitation\), not answers to questions\.$/];
(async()=>{
 /* ---------------- A. the files ---------------- */
 {const out=[];for(const k of Object.keys(VID)){const s=fs.readFileSync(path.join(DIR,VID[k].f),'utf8');const h=/^\/\* Form TD-1’s video for [^]*?, (\d+):(\d\d)\. An AI-generated video of\s+simulated people, with captions and narration added\. MP4 \(H\.264 720p, AAC\), (\d+) bytes, SHA-256 ([0-9a-f]{64})/.exec(s);
   const m=/NBH_TD1_VIDEO\['([a-z_]+)'\]='([A-Za-z0-9+/=]+)';\s*$/.exec(s);const buf=m?Buffer.from(m[2],'base64'):Buffer.alloc(0);
   out.push({k,head:!!h,key:m&&m[1],size:h&&+h[3]===buf.length,sha:h&&h[4]===crypto.createHash('sha256').update(buf).digest('hex'),mp4:buf.slice(4,8).toString()==='ftyp',len:h&&Math.abs(+h[1]*60+ +h[2]-VID[k].dur)<=1});}
  const wrong=out.filter(x=>!(x.head&&x.key===x.k&&x.size&&x.sha&&x.mp4&&x.len));
  ok('A the eleven video files beside the forms: a header (AI-generated, simulated people, the size, the SHA-256), its key, MP4 data that matches',out.length===11&&!wrong.length,wrong);}
 {const pw=fs.readFileSync(path.join(ROOT,'qa','pwa-test.js'),'utf8'),rl=fs.readFileSync(path.join(ROOT,'qa','release-list.txt'),'utf8');const miss=Object.values(VID).map(v=>v.f).filter(f=>!pw.includes("'"+f+"'"));
  ok('A pwa-test lists each file to be kept offline; the release list runs this test',!miss.length&&/^v2568-td1-procvideos-test$/m.test(rl),miss);}
 {const ids=new Set(BANK.protocols.map(p=>p.id)),miss=[].concat(...Object.values(VID).map(v=>v.src)).concat(Object.keys(WANT)).filter(id=>!ids.has(id));
  const by={};CARDS.forEach(p=>{by[p.code]=(by[p.code]||0)+1;});
  ok('A the cards: DRO 90, NCR 75, NCE 13, A_NCA 11, RIRD 53; every card a video was made from is in the bank',by.DRO===90&&by.NCR===75&&by.NCE===13&&by.A_NCA===11&&by.RIRD===53&&!miss.length,{by,miss});}
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const errs=[];
 const ctxOf=(w,h)=>b.newContext({viewport:{width:w||1376,height:h||1032},hasTouch:true,isMobile:true,deviceScaleFactor:1,userAgent:IPAD});
 async function open(){const ctx=await ctxOf();const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));const got=[];p.on('request',r=>{const u=r.url();if(/nbh-td1-video-/.test(u))got.push(u.replace(/.*\//,''));});
  await p.goto(URL+file('TD-1_'));await p.waitForFunction(()=>window.__tdBank&&window.__tdVideo&&window.__tdDroIv,null,{timeout:30000});await sleep(800);
  await p.evaluate(()=>{window.nbhUI=window.nbhUI||{};window.nbhUI.confirm=async()=>true;window.nbhUI.choose=async()=>'second';});return {ctx,p,got};}
 const view=(p,v)=>p.evaluate(v=>{const x=document.querySelector('#viewSeg button[data-view="'+v+'"]');if(x)x.click();},v);
 let {ctx,p,got}=await open();await view(p,'build');await sleep(300);
 /* ---------------- B. the mapping ---------------- */
 const R=await p.evaluate(C=>TD1_BANK.protocols.filter(x=>C.includes(x.code)).map(x=>({id:x.id,code:x.code,k:window.__tdVideo.key(x.id),has:window.__tdVideo.has(x.id),line:window.__tdVideo.line(x.id)})),CODES);
 {const wrong=R.filter(x=>x.k!==WANT[x.id]),cnt={};R.forEach(x=>{cnt[x.k]=(cnt[x.k]||0)+1;});
  ok('B every card of the five codes shows the video this test expects',R.length===242&&!wrong.length,wrong.slice(0,6));
  ok('B the counts: DRO resetting 43, tokens 24, class 12, momentary 11; NCR, NCE and A_NCA attention 36, items 26, during work 32, before and between 5; RIRD vocal 14, motor 14, pica 19, none 6',Object.keys(COUNTS).every(k=>cnt[k]===COUNTS[k]),cnt);
  const nv=R.filter(x=>!x.k);ok('B the 6 RIRD cards none fits (overcorrection, the awareness device, exposure and response prevention, the chin cue) have no video and no line',nv.length===6&&nv.every(x=>x.code==='RIRD'&&!x.has&&!x.line),nv);}
 /* ---------------- C. the lines ---------------- */
 {const VS=await p.evaluate(K=>{const o={};K.forEach(k=>{o[k]=window.__tdVideo.line(k);});return o;},Object.keys(VID));
  const sum={};Object.keys(VS).forEach(k=>{const m=/^The video shows the closest version, after (.+?): (.+)\.$/.exec(VS[k]);sum[k]=m&&m[1]===VID[k].after?m[2]:null;});
  ok('C each video named by its studies, with what it shows (the line of a card from the menu)',Object.values(sum).every(s=>s&&s.length>60),VS);
  const wrong=[];R.filter(x=>x.k).forEach(x=>{const v=VID[x.k];const src=v.src.includes(x.id);
   const head=src?'The video shows this card’s steps: '+sum[x.k]+'.':'The video shows the closest version, after '+v.after+': '+sum[x.k]+'.';
   if(!x.line.startsWith(head)){wrong.push([x.id,'head',x.line.slice(0,120)]);return;}const rest=x.line.slice(head.length).trim();
   if(src&&rest)wrong.push([x.id,'source with a clause',rest]);else if(rest&&!CLAUSES.some(re=>re.test(rest)))wrong.push([x.id,'clause',rest]);
   if(x.id in CLAUSE&&rest!==CLAUSE[x.id])wrong.push([x.id,'want',CLAUSE[x.id],'got',rest]);});
  ok('C the card a video was made from says "The video shows this card’s steps"; every other card names the closest version and its studies, with at most one clause, the one expected',!wrong.length,wrong.slice(0,5));
  const nsrc=R.filter(x=>x.line.startsWith('The video shows this card’s steps')).length,ncl=R.filter(x=>x.k&&!/^The video shows this card/.test(x.line)&&/\. (This card|The clip)[^.]*\..*$/.test(x.line)).length;
  ok('C 24 source cards; clauses only where a field shows the difference (about one card in four)',nsrc===24&&ncl>20&&ncl<80,{nsrc,ncl});}
 {const r=await p.evaluate(()=>{const out={};['dro-sticker-chart-assault','rird-arm-overcorrection','ncr-presession-item-access'].forEach(id=>{window.__tdBank.show(id);const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');
    const bt=d.querySelector('.load button.vid'),l=d.querySelector('.load .vidln');out[id]={btn:bt?bt.textContent:'',line:l?l.textContent:'',h:bt?Math.round(bt.getBoundingClientRect().height):0};});return out;});
  const line=id=>R.find(x=>x.id===id).line;
  ok('C the bank panel: Watch the video and the line on a DRO and an NCR card; neither on the overcorrection card',r['dro-sticker-chart-assault'].btn==='Watch the video'&&r['dro-sticker-chart-assault'].line===line('dro-sticker-chart-assault')&&r['ncr-presession-item-access'].line===line('ncr-presession-item-access')&&!r['rird-arm-overcorrection'].btn&&!r['rird-arm-overcorrection'].line,r);}
 await p.evaluate(()=>{const s=document.getElementById('addComp');s.value='DRO';document.getElementById('addCompBtn').click();});await sleep(600);
 await p.evaluate(()=>{window.__tdBank.show('rird-arm-overcorrection');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.add').click();});await sleep(800);
 await p.evaluate(()=>{window.__tdBank.show('ncr-presession-attention-block');document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.add').click();});await sleep(800);
 await sleep(2800);
 {const c=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .card')].map(c=>({code:c.dataset.code,bank:(c.querySelector('[name$="].bank"]')||{}).value||'',btn:!!c.querySelector('.td-vid-btn'),line:(c.querySelector('.td-vid-line')||{}).textContent||''})));
  const dro=c.find(x=>x.code==='DRO'),rird=c.find(x=>x.code==='RIRD'),ncr=c.find(x=>x.code==='NCR');
  ok('C the plan: a DRO card from the menu shows the resetting video and its line, with no clause; the overcorrection card from the bank no button and no line (not RIRD’s video); the NCR card from the bank its own line',
   c.length===3&&dro&&dro.btn&&/^The video shows the closest version, after Kodak et al\. \(2003\): the first interval set below/.test(dro.line)&&!/This card/.test(dro.line)&&rird&&rird.bank==='rird-arm-overcorrection'&&!rird.btn&&!rird.line&&ncr&&ncr.btn&&ncr.line===R.find(x=>x.id==='ncr-presession-attention-block').line,c);}
 await p.evaluate(()=>{const s=document.querySelector('#compWrap .card[data-code="DRO"] select[name$=".dtype"]');s.value='Momentary, variable times';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
 {const l=await p.evaluate(()=>document.querySelector('#compWrap .card[data-code="DRO"] .td-vid-line').textContent);
  ok('C a DRO card set to "Momentary, variable times" shows the momentary video',/^The video shows the closest version, after Hammond et al\. \(2011\) and Lindberg et al\. \(1999\): the item only if/.test(l),l);}
 await p.evaluate(()=>{const s=document.querySelector('#compWrap .card[data-code="DRO"] select[name$=".dtype"]');s.value='Whole-interval, resetting';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
 /* ---------------- D. each video ---------------- */
 ok('D no video file loaded until asked',!got.length&&await p.evaluate(()=>!window.NBH_TD1_VIDEO),got);
 for(const k of Object.keys(VID)){const x=VID[k];
  await p.evaluate(id=>{window.__tdBank.show(id);document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.vid').click();},x.src[x.src.length-1]);
  await p.waitForFunction(k=>{const v=document.getElementById('tv-video');return v&&v.readyState>=1&&!v.hidden&&v.dataset.id===k;},k,{timeout:30000}).catch(()=>{});
  const o=await p.evaluate(f=>{const d=document.getElementById('tdVideo'),v=document.getElementById('tv-video');return {k:v.dataset.id,src:v.src.slice(0,5),dur:v.duration,w:v.videoWidth,h:v.videoHeight,title:d.querySelector('#tv-title').textContent,ai:d.querySelector('.tv-ai').textContent,note:d.querySelector('.tv-note').textContent,err:d.querySelector('#tv-msg').classList.contains('tv-err'),script:[...document.scripts].some(s=>s.src.endsWith('/'+f))};},x.f);
  ok('D '+k+': its card’s button loads '+x.f+' and plays it from the device (about '+x.dur+' s, 720p); the note: an AI video model, the cards after '+x.after+', simulated, adapt every step',
   o.k===k&&o.script&&o.src==='blob:'&&Math.abs(o.dur-x.dur)<1.5&&o.w===1280&&o.h===720&&!o.err&&o.title.length>10&&/AI-generated/.test(o.ai)&&o.note.startsWith('Made with an AI video model from the steps of the card')&&o.note.includes(x.after)&&/simulated: it shows the procedure, not a real session/.test(o.note)&&/Adapt every step to the student’s plan\./.test(o.note),o);
  await p.keyboard.press('Escape');await sleep(200);}
 ok('D each file loaded once, only when asked',got.length===11&&new Set(got).size===11,got);
 /* ---------------- E. the interval helper ---------------- */
 {const r=await p.evaluate(()=>{const C=window.__tdDroIv.calc;return {a:C([{min:'10',n:'15'},{min:'10',n:'20'},{min:'10',n:'12'}]),b:C([{min:'1',n:'30'}]),c:C([{min:'10',n:'0'},{min:'20',n:'10'}]),d:C([{min:'',n:''}]),e:C([{min:'15',n:'4'}])};});
  ok('E the arithmetic: session seconds ÷ responses, averaged (40, 30 and 50 s: 40 s); 50% to 100% of it (20 to 40 s)',r.a.n===3&&r.a.per.join()==='40,30,50'&&r.a.mean===40&&r.a.lo===20&&r.a.hi===40,r.a);
  ok('E the 5-s floor (a mean of 2 s: 5 s); a session with no responses left out and named; nothing entered, nothing computed; 15 min and 4 responses: 225 s, 113 to 225 s',r.b.mean===2&&r.b.lo===5&&r.b.hi===5&&r.c.n===1&&r.c.mean===120&&r.c.skipped.join()==='1'&&r.d.n===0&&r.e.mean===225&&r.e.lo===113&&r.e.hi===225,r);}
 await view(p,'build');await sleep(300);
 const card='#compWrap .card[data-code="DRO"]';
 {const r=await p.evaluate(c=>{const w=document.querySelector(c+' .td-iv'),t=w&&w.querySelector('.td-iv-tog'),box=w&&w.querySelector('.td-iv-box');return {w:!!w,tog:t&&t.textContent,exp:t&&t.getAttribute('aria-expanded'),hidden:box&&box.hidden,skip:w&&w.hasAttribute('data-add68-skip'),named:w?w.querySelectorAll('[name]').length:-1,after:!!(w&&w.previousElementSibling&&w.previousElementSibling.classList.contains('param'))};},card);
  ok('E on the DRO card, under its settings: Set the first interval from baseline, closed; nothing in it has a name; outside a signed record’s comparison',r.w&&r.tog==='Set the first interval from baseline'&&r.exp==='false'&&r.hidden&&r.skip&&r.named===0&&r.after,r);}
 const fieldOf=c=>document.querySelector(c+' .param textarea[name$=".p0"]');
 const before=await p.evaluate(c=>{const f=document.querySelector(c+' .param textarea[name$=".p0"]');return {v:f.value,lab:f.closest('.f').querySelector('label').textContent,save:JSON.stringify(window.__tdCollect().fields)};},card);
 await p.evaluate(c=>document.querySelector(c+' .td-iv-tog').click(),card);await sleep(200);
 {const r=await p.evaluate(c=>{const w=document.querySelector(c+' .td-iv');return {exp:w.querySelector('.td-iv-tog').getAttribute('aria-expanded'),src:w.querySelector('.td-iv-src').textContent,out:w.querySelector('.td-iv-out').textContent,vals:[...w.querySelectorAll('input')].map(x=>x.value).join('')};},card);
  ok('E open with no baseline from the case: empty rows, what to enter, and what to do first',r.exp==='true'&&r.vals===''&&/^Enter up to the last 3 baseline sessions: the minutes each lasted and the count of the target behavior in it\.$/.test(r.src)&&/at least one baseline session/.test(r.out),r);}
 const ins=await p.$$(card+' .td-iv input');await ins[0].fill('10');await ins[1].fill('15');await ins[2].fill('10');await ins[3].fill('20');await ins[4].fill('10');await ins[5].fill('12');await sleep(200);
 {const r=await p.evaluate(c=>{const w=document.querySelector(c+' .td-iv');return {out:w.querySelector('.td-iv-out').textContent,note:w.querySelector('.td-iv-note').textContent,live:w.querySelector('.td-iv-out').getAttribute('aria-live')};},card);
  ok('E typed sessions: "Mean time between responses: 40 s (the mean of 3 sessions: 40 s, 30 s, 50 s). Suggested first interval: 20 s to 40 s, 50% to 100% of the mean." and the cards behind the range',
   r.out==='Mean time between responses: 40 s (the mean of 3 sessions: 40 s, 30 s, 50 s). Suggested first interval: 20 s to 40 s, 50% to 100% of the mean.'&&r.live==='polite'&&/half the mean \(Azrin et al\., 1988; Iannaccone et al\., 2020\), just under it \(Derwas & Jones, 1993\) or at the mean \(Barton et al\., 1986; Lindberg et al\., 1999; Hammond et al\., 2011\), never below 5 s/.test(r.note)&&!/60%|80%/.test(r.note),r);}
 {const r=await p.evaluate(([c,b])=>{const f=document.querySelector(c+' .param textarea[name$=".p0"]');return {v:f.value,same:f.value===b.v,save:JSON.stringify(window.__tdCollect().fields)===b.save};},[card,before]);
  ok('E the card’s field is not filled: it keeps its seed ('+before.v+'), and the save file is unchanged',r.same&&r.save&&/^Initial DRO interval/.test(before.lab),r);}
 {await p.evaluate(()=>{const r=document.querySelector('[name="m.rate"]');r.value='1.5';r.dispatchEvent(new Event('input',{bubbles:true}));});await ins[5].fill('12');await sleep(200);
  const t=await p.evaluate(c=>document.querySelector(c+' .td-iv .td-iv-note').textContent,card);
  await p.evaluate(()=>{const r=document.querySelector('[name="m.rate"]');r.value='';r.dispatchEvent(new Event('input',{bubbles:true}));});
  ok('E with a rate typed on Setup, the helper names Setup’s mean time between responses (1.5 per minute: 40 s), which seeds a menu card’s field as before',/Setup’s baseline rate, 1\.5 per minute, gives a mean time between responses of 40 s\.$/.test(t),t);}
 await ins[4].fill('-3');await sleep(150);
 ok('E a value below zero is marked and left out',await p.evaluate(c=>{const w=document.querySelector(c+' .td-iv'),x=w.querySelectorAll('input')[4];return x.getAttribute('aria-invalid')==='true'&&/the mean of 2 sessions: 40 s, 30 s\)/.test(w.querySelector('.td-iv-out').textContent);},card));
 await p.evaluate(c=>document.querySelector(c+' .td-iv-go').click(),card);await sleep(500);
 ok('E Go to the field moves to the card’s Initial DRO interval',await p.evaluate(c=>document.activeElement===document.querySelector(c+' .param textarea[name$=".p0"]'),card));
 {const ways=await p.evaluate(c=>[...document.querySelectorAll(c+' .td-iv li')].map(li=>({t:li.firstChild.textContent,cards:[...li.querySelectorAll('[data-iv-card]')].map(b=>b.dataset.ivCard)})),card);
  const want=[['Add 50%, rounded to the nearest 5 s, after 2 sessions in a row',['dro-unsignaled-momentary']],['set the interval to the mean time between responses over the last 3 sessions, never more than double',['dro-variable-momentary','ncr-adjusting-irt-thinning']],['Double the interval after 5 reinforced intervals in a row, up to 5 min; halve it',['dro-interval-doubling-sib']],['Fixed steps once problem behavior is at or below the criterion: 10 s, 20 s, 30 s, 1 min, 1.5 min, then 2 min',['dro-break-after-calm-interval']]];
  ok('E the ways the DRO cards lengthen the interval, each with its card: +50% (Hammond et al., 2011), the last 3 sessions’ mean never more than doubling (Lindberg et al., 1999; Kahng et al., 2000a), doubling and halving (Azrin et al., 1988), fixed steps (Kodak et al., 2003)',
   ways.length===4&&want.every((w,i)=>ways[i].t.includes(w[0])&&ways[i].cards.join()===w[1].join()),ways);
  await p.evaluate(c=>document.querySelector(c+' .td-iv [data-iv-card="dro-interval-doubling-sib"]').click(),card);await sleep(500);
  const sh=await p.evaluate(()=>{const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail');return d?d.textContent.slice(0,400):'';});
  ok('E a way’s button opens its card in the bank panel',/interval doubling and halving/i.test(sh),sh.slice(0,200));}
 /* Form DD-1's baseline, from the case (simulated) */
 const FACTS=m=>({behaviors:[{label:'Aggression (simulated)'}],data:{from:'2026-10-01',to:'2026-10-20',days:6,src:'DD-1',behaviors:[{name:'Aggression (simulated)',kind:'target',measure:m,unit:m==='rate'?'per hour':'occurrences'},{name:'Asks for a break (simulated)',kind:'replacement',measure:'count',unit:'occurrences'}],
  conds:[{name:'Baseline'},{name:'DRO'}],series:[['2026-10-01','Baseline',6],['2026-10-02','Baseline',8],['2026-10-05','Baseline',5],['2026-10-06','Baseline',4],['2026-10-07','DRO',2]].map(r=>({date:r[0],cond:r[1],v:{'Aggression (simulated)':r[2],'Asks for a break (simulated)':1}}))}});
 for(const m of ['count','rate']){
  await p.evaluate(f=>window.__nbhFactsIn(f),FACTS(m));await sleep(300);
  await p.evaluate(()=>{const s=document.getElementById('addComp');s.value='DRO';document.getElementById('addCompBtn').click();});await sleep(900);
  const r=await p.evaluate(()=>{const cs=document.querySelectorAll('#compWrap .card[data-code="DRO"]'),c=cs[cs.length-1],w=c.querySelector('.td-iv');w.querySelector('.td-iv-tog').click();
   return {src:w.querySelector('.td-iv-src').textContent,vals:[...w.querySelectorAll('input')].map(x=>x.value),out:w.querySelector('.td-iv-out').textContent,field:c.querySelector('.param textarea[name$=".p0"]').value};});
  if(m==='count')ok('E Form DD-1’s baseline fills the rows: the last 3 days of “Baseline” for the target, a count per day, and says a school day is not a session (the minutes left to enter)',
   r.vals.join('|')==='|8||5||4'&&r.src==='From Form DD-1’s baseline: the last 3 days of “Baseline” for “Aggression (simulated)” (2026-10-02, 2026-10-05, 2026-10-06), a count per day. A school day is not a session: enter the minutes observed each day, or type the sessions you timed instead.'&&/at least one baseline session/.test(r.out),r);
  else ok('E a rate per hour fills each row as the responses in 60 minutes (8, 5 and 4 per hour: 450, 720 and 900 s, a mean of 690 s), and the field is still not filled',
   r.vals.join('|')==='60|8|60|5|60|4'&&/a rate per hour, entered as the responses in 60 minutes\. A school day is not a session: check these/.test(r.src)&&r.out==='Mean time between responses: 11 min 30 s (the mean of 3 sessions: 7 min 30 s, 12 min, 15 min). Suggested first interval: 5 min 45 s to 11 min 30 s, 50% to 100% of the mean.'&&!/345|690|5 min 45/.test(r.field),r);}
 {await p.emulateMedia({media:'print'});const d=await p.evaluate(()=>[...document.querySelectorAll('#compWrap .td-iv')].map(w=>getComputedStyle(w).display));await p.emulateMedia({media:'screen'});
  const f=await p.evaluate(()=>Object.keys(window.__tdCollect().fields).filter(k=>/iv/i.test(k)));
  ok('E the helper is not printed and keeps nothing in the save file',d.length===3&&d.every(x=>x==='none')&&!f.length,{d,f});}
 /* ---------------- F. touch and errors ---------------- */
 {const r=await p.evaluate(c=>{const w=document.querySelector(c+' .td-iv');const hs=[...w.querySelectorAll('button,input')].map(x=>Math.round(x.getBoundingClientRect().height));
   const vb=[...document.querySelectorAll('#compWrap .card .td-vid-btn')].map(x=>Math.round(x.getBoundingClientRect().height));return {min:Math.min(...hs),n:hs.length,vid:Math.min(...vb),nv:vb.length};},card);
  const pb=await p.evaluate(()=>{window.__tdBank.show('rird-eye-poke-blocking');const d=document.getElementById('tdBankHost').shadowRoot.querySelector('.detail .load button.vid');return d?Math.round(d.getBoundingClientRect().height):0;});
  ok('F on the iPad every new control is at least 44 px tall (the helper’s button, its 6 boxes, Go to the field, the 5 card buttons; Watch the video on the plan cards and in the bank panel)',r.n===13&&r.min>=44&&r.vid>=44&&r.nv>=3&&pb>=44,{r,pb});}
 await ctx.close();
 ok('F no page errors',!errs.length,errs.slice(0,4));
 console.log('RESULT: '+(bad?bad+' failed':'all passed'));await b.close();process.exit(bad?1:0);})().catch(e=>{console.log('FAIL crash '+(e&&e.stack||e));console.log('RESULT: crashed');process.exit(1);});
