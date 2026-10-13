/* v21.94 Dictate: what you say lands in the text box you are in, heard on the device by the recogniser Form TV-1 uses.
   Chromium's fake microphone plays a spoken recording (made by the test from Form TK-1's narration, which says what it
   says, so nothing real is spoken); the words it hears are checked against the clip's words. Also the forms' toolbar switch,
   the Log it now sheet's switch, and the tidying of what is heard (capitals, "period", "new line"). Simulated data only.
   usage: node qa/v2194-dictate-test.js   (WS_URL=http://127.0.0.1:8123) */
const {chromium,BASE,sleep}=require(__dirname+'/lib.js');
const fs=require('fs'),os=require('os'),path=require('path');
let fails=0;const ok=(n,c,i)=>{console.log((c?'PASS ':'FAIL ')+n+(i!==undefined&&!c?'  '+JSON.stringify(i).slice(0,600):''));if(!c)fails++;};
const words=t=>String(t||'').toLowerCase().replace(/[^a-z' ]+/g,' ').split(/\s+/).filter(Boolean);
async function mkWav(br){   /* one narration clip, decoded and resampled to 16 kHz, as a WAV for the fake microphone */
  const page=await br.newPage();await page.goto(BASE+'/NBH-Workstation/TK-1_Token-Board-Book_v2026-10.html');await page.waitForFunction(()=>typeof WALK_AUDIO!=='undefined',null,{timeout:40000});
  const r=await page.evaluate(async()=>{const L=WALK_AUDIO.lines,key=Object.keys(L).find(k=>L[k].a&&L[k].t&&L[k].t.length>60)||Object.keys(L)[0],line=L[key];
    const bytes=Uint8Array.from(atob(line.a.split(',')[1]),c=>c.charCodeAt(0));const ac=new (window.AudioContext||window.webkitAudioContext)();const buf=await ac.decodeAudioData(bytes.buffer.slice(0));
    const sr=buf.sampleRate,x=buf.getChannelData(0),f=sr/16000,n=Math.floor(x.length/f),y=new Float32Array(n+16000);   /* a second of silence first: the recogniser is still starting */
    for(let j=0;j<n;j++){const a=Math.floor(j*f),b=Math.min(x.length,Math.floor((j+1)*f));let s=0;for(let q=a;q<b;q++)s+=x[q];y[16000+j]=s/Math.max(1,b-a);}
    return {text:line.t,pcm:Array.from(y),secs:buf.duration};});
  await page.close();
  const n=r.pcm.length,b=Buffer.alloc(44+n*2),w=(o,s)=>b.write(s,o);
  w(0,'RIFF');b.writeUInt32LE(36+n*2,4);w(8,'WAVE');w(12,'fmt ');b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);w(36,'data');b.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,r.pcm[i]))*32767),44+i*2);
  const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'nbh-dict-')),'spoken.wav');fs.writeFileSync(file,b);return {file,text:r.text,secs:r.secs};}
(async()=>{let br=await chromium.launch();let wav;
  try{wav=await mkWav(br);}catch(e){ok('0 a spoken recording could be made from Form TK-1’s narration',false,String(e).slice(0,200));}
  await br.close();
  if(!wav){console.log('RESULT: 1 failed');process.exit(1);}
  ok('0 a spoken recording was made from Form TK-1’s narration ('+wav.secs.toFixed(1)+' s): “'+wav.text.slice(0,60)+'…”',wav.secs>4);
  br=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-audio-capture='+wav.file+'%noloop','--autoplay-policy=no-user-gesture-required']});
  try{
  /* ---- 1. the tidying of what is heard ---- */
  {const ctx=await br.newContext({serviceWorkers:'block'});const page=await ctx.newPage();await page.goto(BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(600);
    await page.evaluate(()=>new Promise((res,rej)=>{const s=document.createElement('script');s.src='nbh-dictate.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);}));
    const t=await page.evaluate(()=>({a:nbhDictate.tidy('HELLO THERE PERIOD NEW LINE THIS IS WHAT I SAW COMMA OK QUESTION MARK'),b:nbhDictate.tidy('he hit the desk full stop then sat down'),c:nbhDictate.tidy('i think i\'m done new paragraph next'),d:nbhDictate.tidy('   ')}));
    ok('1 what is heard is written with capitals and the punctuation said aloud',t.a==='Hello there.\nThis is what I saw, ok?'&&t.b==='He hit the desk. Then sat down'&&t.c==='I think I’m done\n\nNext'&&t.d==='',t);
    const ins=await page.evaluate(()=>{const ta=document.createElement('textarea');document.body.appendChild(ta);const out={};
      ta.value='';ta.setSelectionRange(0,0);nbhDictate.insert(ta,'he hit the desk');out.a=ta.value;
      ta.value='Asked to start.';ta.setSelectionRange(ta.value.length,ta.value.length);nbhDictate.insert(ta,'then he hit the desk');out.b=ta.value;
      ta.value='Before: math.After: calm';ta.setSelectionRange(13,13);nbhDictate.insert(ta,'he hit the desk.');out.c=ta.value;
      let fired=0;ta.addEventListener('input',()=>fired++);ta.value='';nbhDictate.insert(ta,'x');out.fired=fired;ta.remove();return out;});
    ok('2 the words land at the cursor with a space and a capital where one belongs, and the box hears an input event',ins.a==='He hit the desk'&&ins.b==='Asked to start. Then he hit the desk'&&ins.c==='Before: math. He hit the desk. After: calm'&&ins.fired===1,ins);
    await ctx.close();}
  /* ---- 2. a form on its own: the toolbar switch, the fake microphone, the words in the box ---- */
  {const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',permissions:['microphone']});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html');await sleep(1200);
    const b=await page.evaluate(()=>{const b=document.getElementById('nbhDictBtn'),f=document.getElementById('nbhFocusBtn');return {has:!!b,inToolbar:!!(b&&b.closest('.toolbar')),afterFocus:!!(f&&f.nextElementSibling===b),pressed:b&&b.getAttribute('aria-pressed'),text:b&&b.textContent.trim(),h:b&&Math.round(b.getBoundingClientRect().height)};});
    ok('3 the toolbar carries a Dictate switch beside the Focus switch',b.has&&b.inToolbar&&b.afterFocus&&b.pressed==='false'&&b.text==='Dictate',b);
    await page.evaluate(()=>{document.activeElement&&document.activeElement.blur();});await page.click('#nbhDictBtn');await sleep(900);
    const noField=await page.evaluate(()=>({toast:[...document.querySelectorAll('.nbh-toast')].map(t=>t.textContent).join(' | '),on:!!(window.nbhDictate&&nbhDictate.active())}));
    ok('4 pressed with no text box in use, it says so and does not listen',/Tap into the text box first/.test(noField.toast)&&!noField.on,noField);
    const ta=await page.evaluate(()=>{const ta=[...document.querySelectorAll('textarea')].find(t=>t.offsetParent);ta.value='';ta.focus();return ta.id||ta.name||'textarea';});
    await page.click('#nbhDictBtn');
    await page.waitForFunction(()=>window.nbhDictate&&nbhDictate.active()&&nbhDictate.ready(),null,{timeout:60000}).catch(()=>{});
    const st=await page.evaluate(()=>({on:nbhDictate.active(),ready:nbhDictate.ready(),pressed:document.getElementById('nbhDictBtn').getAttribute('aria-pressed'),strip:!!(document.getElementById('nbhDict')&&!document.getElementById('nbhDict').hidden),focusKept:document.activeElement&&document.activeElement.tagName==='TEXTAREA'}));
    ok('5 pressed from a text box: the recogniser is up, the switch shows on, the strip at the foot says it listens, the cursor stays in the box',st.on&&st.ready&&st.pressed==='true'&&st.strip&&st.focusKept,st);
    let heard='';for(let i=0;i<40;i++){await sleep(500);heard=await page.evaluate(()=>[...document.querySelectorAll('textarea')].find(t=>t.offsetParent).value);if(words(heard).length>=12)break;}
    const exp=words(wav.text),got=words(heard),hit=got.filter(w=>exp.includes(w)).length;
    ok('6 the words said reach the box ('+hit+' of '+got.length+' heard are the clip’s, which has '+exp.length+')',got.length>=10&&hit>=got.length*0.8&&/^[A-Z]/.test(heard),{heard,text:wav.text});
    await page.click('#nbhDictBtn');await sleep(400);
    const off=await page.evaluate(()=>({on:nbhDictate.active(),pressed:document.getElementById('nbhDictBtn').getAttribute('aria-pressed'),strip:!!(document.getElementById('nbhDict')&&!document.getElementById('nbhDict').hidden)}));
    ok('7 pressed again, it stops: the switch off, the strip gone',!off.on&&off.pressed==='false'&&!off.strip,off);
    ok('8 no page errors',!errs.length,errs.slice(0,3));
    await ctx.close();}
  /* ---- 3. the Log it now sheet's Dictate ---- */
  {const ctx=await br.newContext({viewport:{width:1180,height:820},serviceWorkers:'block',permissions:['microphone']});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
    await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(1400);
    await page.evaluate(()=>{wsUI.confirm=async()=>true;const set=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('#pClient','Mateo Rivera');set('#pSid','4471823');set('#pSite','Royal Palm School');});
    await sleep(400);await page.evaluate(()=>logNowOpen());await sleep(900);
    const has=await page.evaluate(()=>!!document.querySelector('#lnForm #lnDict'));
    ok('9 the Log it now sheet carries a Dictate switch',has);
    await page.evaluate(()=>{document.getElementById('lnWhat').focus();});await page.click('#lnDict');
    await page.waitForFunction(()=>window.nbhDictate&&nbhDictate.active()&&nbhDictate.ready(),null,{timeout:60000}).catch(()=>{});
    let v='';for(let i=0;i<40;i++){await sleep(500);v=await page.evaluate(()=>document.getElementById('lnWhat').value);if(words(v).length>=12)break;}
    const got2=words(v),hit2=got2.filter(w=>words(wav.text).includes(w)).length;
    ok('10 what is said lands in the sheet’s What happened box ('+hit2+' of '+got2.length+' words are the clip’s)',got2.length>=10&&hit2>=got2.length*0.8,{v});
    await page.evaluate(()=>{$('#dlg').close();});await sleep(300);
    const after=await page.evaluate(()=>({on:!!(window.nbhDictate&&nbhDictate.active())}));
    ok('11 closing the sheet stops the dictation',!after.on,after);
    ok('12 no page errors in the workstation',!errs.length,errs.slice(0,3));
    await ctx.close();}
  }catch(e){ok('the run finished',false,String(e&&e.stack||e).slice(0,600));}
  await br.close();try{fs.rmSync(path.dirname(wav.file),{recursive:true,force:true});}catch(e){}
  console.log(fails?'RESULT: '+fails+' failed':'RESULT: all passed');process.exit(fails?1:0);})();
