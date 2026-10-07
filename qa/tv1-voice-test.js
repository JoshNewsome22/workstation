/* v21.51 Form TV-1, Follow my words, with a voice: speech (a WAV of the simulator's first six paragraphs read aloud, for
   example by a text-to-speech voice) is the microphone of a Chromium with a fake capture device, and the teleprompter has
   to follow it with the recogniser on the device (nbh-asr/):
   1. the first time, the recogniser is downloaded (each part checked) and kept; the scroll follows the words to the last
      paragraph read, the cards with it, the words read dimmed;
   2. with the clock running, the time each word was heard is kept, and the captions are timed by it;
   3. opened again, the recogniser comes from the device: no part is downloaded again;
   4. no errors, and nothing sent anywhere but the page's own folder.
   (v21.52) the next-card marks: each card comes up as the word before its >> is said.
   usage: TV1_WAV=/path/speech.wav node qa/tv1-voice-test.js   (WS_URL as in qa/lib.js; the WAV 16-bit PCM, any rate) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const URL=BASE+'/NBH-Workstation/TV-1_Training-Video_v2026-10.html';
const WAV=process.env.TV1_WAV||process.exit(console.log('set TV1_WAV to a WAV of the simulator\'s first six paragraphs read aloud')||2);
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,1200):''));if(!c)fails++;};
(async()=>{const br=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+WAV,'--autoplay-policy=no-user-gesture-required']});
  const ctx=await br.newContext({permissions:['microphone']});const page=await ctx.newPage();const errs=[],reqs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});ctx.on('request',r=>reqs.push(r.url()));
  const open=async()=>{await page.goto(URL);await sleep(1200);await page.evaluate(()=>{nbhUI.confirm=async()=>true;});await page.evaluate(()=>loadSim());await sleep(800);
    await page.evaluate(()=>{const m=document.querySelector('[data-m="tpmode"]');m.value='follow';m.dispatchEvent(new Event('change',{bubbles:true}));S.chk.nocd=true;setView('prompter');tpGo(0,true);});};
  await open();await page.evaluate(()=>caches.delete('tv1-voice-model'));
  const t0=Date.now();await page.evaluate(()=>tpToggle());
  while(Date.now()-t0<180000&&!(await page.evaluate(()=>VO.ready)))await sleep(500);
  const st=await page.evaluate(async()=>({ready:VO.ready,parts:(await (await caches.open('tv1-voice-model')).keys()).length,mic:document.getElementById('tpMic').textContent}));
  ok('1 the recogniser downloaded, each part checked and kept on the device, and started',st.ready&&st.parts===32&&/Following your words/.test(st.mic),Object.assign(st,{secs:(Date.now()-t0)/1000}));
  /* from the top, the clock running: the speech starts again with the new capture */
  await page.evaluate(()=>{tpToggle();tpGo(0,true);TP.pos=0;tpReadTo(0);});await sleep(500);
  await page.evaluate(()=>{document.getElementById('tpRec').click();tpToggle();});
  const trace=[];const t1=Date.now();
  while(Date.now()-t1<75500){await sleep(2000);trace.push(await page.evaluate(()=>({t:+((performance.now()-TP.t0)/1000).toFixed(1),pos:TP.pos,i:TP.i,heard:VO.done.concat(VO.cur).slice(-6).join(' ')})));}
  const fin=await page.evaluate(()=>{const P=paras(),k5=PK[5],w5=PW[5];return {pos:TP.pos,end5:k5+w5,start5:k5,i:TP.i,want:P[5].rows,rd:document.querySelectorAll('#tpStrip .tw.rd').length,y:TP.y,top5:document.querySelectorAll('#tpStrip .tp-p')[5].offsetTop,wt:S.wt.length,words:SW.length};});
  console.log(trace.map(x=>x.t+'s pos '+x.pos+' card '+(x.i+1)+' | '+x.heard).join('\n'));
  const back=trace.filter((x,j)=>j&&x.pos<trace[j-1].pos-3).length;
  ok('1 the scroll follows the words to the last paragraph read, the cards with it, the words read dimmed',fin.pos>=fin.start5+Math.round((fin.end5-fin.start5)*.6)&&fin.want.includes(fin.i)&&fin.rd>100&&fin.y>=fin.top5-400,fin);
  ok('1 it moves forward with the speech (no jump back)',back===0,trace.map(x=>x.pos));
  const ph=await page.evaluate(()=>{const P=paras();return [0,1,2,3,4].map(k=>{const s=[...new Set(SW.filter(x=>x.k===k).map(x=>x.s))],t=S.wt.filter(w=>s.includes(w[0])).map(w=>w[1]);return t.length?[Math.min(...t),Math.max(...t)]:null;});});
  ok('2 each word\'s time is kept while the clock runs, paragraph after paragraph',fin.wt>150&&ph.every(Boolean)&&ph.every((p,j)=>!j||p[0]>=ph[j-1][0]),{wt:fin.wt,ph});
  /* v21.52 the next-card marks (the simulator has them): each card came up as the word before its mark was said */
  const mk=await page.evaluate(()=>{const out=[];const ord={};CQ.forEach(c=>{if(c.k>5)return;ord[c.k]=(ord[c.k]||0)+1;const st=stepOf(c.k,ord[c.k]);const s=SW[c.at-1].s,tw=(S.wt.find(w=>w[0]===s)||[])[1],lg=S.log.find(l=>l.i===st.i);
    out.push({k:c.k,word:SP[s].textContent,row:st.i,said:tw,card:lg&&lg.t});});return out;});
  ok('1 the >> marks: each card came up as the word before its mark was said (within 1.5 s), with no click',mk.length>=1&&mk.every(m=>m.said!=null&&m.card!=null&&Math.abs(m.card-m.said)<1.5),mk);
  await page.evaluate(()=>{tpToggle();document.getElementById('tpRec').click();});
  const cap=await page.evaluate(()=>{const q=cuesOf();return {n:q.length,first:q.slice(0,3),p2:q.find(x=>/^A behavior plan/.test(x.text))};});
  ok('2 the captions are timed by the words heard (the third paragraph\'s caption when it was said)',cap.n>10&&cap.p2&&cap.p2.a>ph[2][0]-1.5&&cap.p2.a<ph[2][0]+1.5,{cap,ph2:ph[2]});
  /* 3 */
  const before=reqs.length;await open();const t2=Date.now();await page.evaluate(()=>tpToggle());
  while(Date.now()-t2<60000&&!(await page.evaluate(()=>VO.ready)))await sleep(300);
  const again=reqs.slice(before).filter(u=>/nbh-asr\/part-/.test(u)).length;
  ok('3 opened again: the recogniser comes from the device (no part downloaded again)',(await page.evaluate(()=>VO.ready))&&again===0,{again,secs:(Date.now()-t2)/1000});
  await page.evaluate(()=>tpToggle());
  /* 4 */
  const off=reqs.filter(u=>!u.startsWith(BASE+'/')&&!/^(data|blob):/.test(u));
  ok('4 no errors, and no request off the workstation\'s own site',!errs.length&&!off.length,{errs,off});
  await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
