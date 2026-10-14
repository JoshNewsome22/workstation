/* v22.00: staff-data.html's own script, moved out of the page so that its security policy can refuse any inline script (review F495, I251) */
/* v21.85 the staff data page. A teacher or paraprofessional opens it from the link (or the QR code) Form DD-1 made for
   them. The link, after the # (never sent to the website), carries Form DD-1's reply box (its address, id and public
   key), the student's initials, the targets with how each is measured (n: a count, d: a duration timed episode by
   episode, p: + / - of opportunities, i: + / - of intervals), the settings to choose from and who the link is for.
   Every tap is kept on this phone (localStorage, one record per link) as it is made, so a reload, a closed tab or no
   signal loses nothing. "Send today's data" closes what was tapped into an entry, locks it on the phone for DD-1 alone
   (NBH_RESPOND.sendBox: ECDH P-256, HKDF-SHA-256, AES-GCM-256) and posts it; an entry not acknowledged stays on the
   phone and is sent again (on its own when the signal is back), and DD-1 takes each entry once by its id. */
(function(){
"use strict";
var D=document,root=D.getElementById('sd'),KINDS={n:1,d:1,p:1,i:1};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function str(v,n){return typeof v==='string'?v.replace(/\s+/g,' ').trim().slice(0,n):'';}
function pad(n){return String(n).padStart(2,'0');}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function today(){return iso(new Date());}
function isoOk(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return false;var d=new Date(v+'T12:00:00');return !isNaN(d.getTime())&&iso(d)===v;}
function hms(ms){var d=new Date(ms);return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());}
function clock(sec){sec=Math.max(0,Math.round(sec));var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+':'+pad(m):String(m))+':'+pad(s);}
function hm(ms){var d=new Date(ms),h=d.getHours();return (h%12||12)+':'+pad(d.getMinutes())+(h<12?' am':' pm');}
function day(v){var d=new Date(v+'T12:00:00');return isNaN(d)?v:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+' '+(d.getMonth()+1)+'/'+d.getDate();}
function rid(){var u=crypto.getRandomValues(new Uint8Array(16));return Array.from(u).map(function(x){return x.toString(16).padStart(2,'0');}).join('');}
function unb64(t){t=String(t||'').replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';var s=atob(t),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new TextDecoder().decode(u);}
/* the link, read and checked: anything out of shape and the page says the link does not open */
function linkOf(h){var m=/[#&]s=([A-Za-z0-9_-]+)/.exec(String(h||''));if(!m)return null;var o;try{o=JSON.parse(unb64(m[1]));}catch(e){return null;}
  if(!o||o.v!==1||o.f!=='DD-1'||!o.x||typeof o.x!=='object')return null;var x=o.x,j=function(v){return /^[A-Za-z0-9_-]{40,50}$/.test(String(v||''));};
  if(!/^https?:\/\/[^\s]+$/i.test(String(x.u||''))||!/^[a-f0-9]{32}$/.test(String(x.b||''))||!x.k||!j(x.k.x)||!j(x.k.y)||!/^[A-Z0-9]{6,12}$/.test(String(o.c||'')))return null;
  var t=(Array.isArray(o.t)?o.t:[]).filter(function(a){return a&&typeof a.i==='string'&&a.i&&a.i.length<=60&&typeof a.n==='string'&&KINDS[a.m];}).slice(0,16).map(function(a){return {i:a.i,n:str(a.n,80)||'Target',m:a.m};});
  if(!t.length)return null;
  return {box:{u:String(x.u),b:String(x.b),k:{x:String(x.k.x),y:String(x.k.y)}},c:String(o.c),w:str(o.w,60),s:str(o.s,12),t:t,
    st:(Array.isArray(o.st)?o.st:[]).map(function(s){return str(s,40);}).filter(Boolean).slice(0,20)};}
var L=linkOf(location.hash);
window.addEventListener('hashchange',function(){location.reload();});
if(!L){root.innerHTML='<div class="empty"><b>This link does not open.</b><p>'+(/[#&]s=/.test(location.hash)?'Part of it may have been cut off when it was copied.':'It carries no recording sheet.')+' Ask the BCBA who sent it for the link again, or scan the code once more.</p></div>';return;}

/* ---- what is kept on this phone, for this link ---- */
var KEY='nbh.staff|'+L.box.b+'|'+L.c,canKeep=true,st=null;
function blankT(){return {n:0,p:0,m:0,q:[],e:[],run:0,off:false};}
function norm(o){o=o&&typeof o==='object'?o:{};var s={v:1,date:isoOk(o.date)?o.date:today(),t:{},as:/^(agreed|refused|withdrew)$/.test(o.as||'')?o.as:'',set:str(o.set,40),note:typeof o.note==='string'?o.note.slice(0,300):'',dirty:o.dirty===true,
    out:Array.isArray(o.out)?o.out.filter(function(e){return e&&e.id&&e.kind==='nbh-staff';}).slice(-200):[],sent:Array.isArray(o.sent)?o.sent.filter(function(e){return e&&e.id;}).slice(-80):[],err:str(o.err,200)};
  L.t.forEach(function(t){var x=(o.t&&o.t[t.i])||{},b=blankT(),I=function(v){v=Math.round(+v);return isFinite(v)&&v>=0&&v<=9999?v:0;};
    b.n=I(x.n);b.p=I(x.p);b.m=I(x.m);b.q=Array.isArray(x.q)?x.q.filter(function(c){return c==='+'||c==='-';}).slice(-20000):[];
    b.e=Array.isArray(x.e)?x.e.filter(function(e){return e&&isFinite(e.a)&&isFinite(e.z)&&e.z>=e.a;}).slice(-200):[];b.run=isFinite(x.run)&&x.run>0?+x.run:0;b.off=x.off===true;s.t[t.i]=b;});
  return s;}
function load(){var t=null;try{t=localStorage.getItem(KEY);}catch(e){canKeep=false;}var o=null;try{o=t?JSON.parse(t):null;}catch(e){o=null;}return norm(o);}
function keep(){try{localStorage.setItem(KEY,JSON.stringify(st));canKeep=true;}catch(e){canKeep=false;}}
st=load();
/* a new day: a page with nothing waiting moves to today (the assent is the day's own); one holding taps keeps their date */
function touched(){return L.t.some(function(t){var x=st.t[t.i];return x.n||x.p||x.m||x.e.length;});}
function roll(){if(st.date!==today()&&!touched()&&!st.out.length&&!L.t.some(function(t){return st.t[t.i].run;})){st.date=today();st.as='';st.dirty=false;keep();return true;}return false;}
roll();keep();

/* ---- the page ---- */
var ASSENT=[['agreed','Agreed'],['refused','Refused'],['withdrew','Withdrew']];
function opt(v,t,sel){return '<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+esc(t)+'</option>';}
function card(t){var x=st.t[t.i],h='<section class="card t'+(x.off?' off':'')+'" data-t="'+esc(t.i)+'" aria-label="'+esc(t.n)+'"><div class="th"><h2>'+esc(t.n)+'</h2><button type="button" class="watch" data-a="watch" aria-pressed="'+(!x.off)+'">'+(x.off?'Not watching':'Watching')+'</button></div>';
  if(t.m==='n')h+='<div class="ctl"><button type="button" class="big plus" data-a="inc" aria-label="Add one: '+esc(t.n)+'">+1</button><output class="num" data-o="n" aria-live="polite">0</output><button type="button" class="undo" data-a="undo" aria-label="Take one back: '+esc(t.n)+'">&minus;1</button></div>';
  else if(t.m==='d')h+='<div class="ctl"><button type="button" class="big" data-a="dur">Start</button><output class="num" data-o="clock">0:00</output><button type="button" class="undo" data-a="undo" aria-label="Undo the last episode: '+esc(t.n)+'">Undo</button></div><ol class="eps" data-o="eps"></ol>';
  else{var P=t.m==='i'?['+ Occurred','&minus; Did not']:['+ Correct','&minus; Not'];
    h+='<div class="ctl"><button type="button" class="big plus" data-a="plus" aria-label="Plus: '+esc(t.n)+'">'+P[0]+'</button><button type="button" class="big minus" data-a="minus" aria-label="Minus: '+esc(t.n)+'">'+P[1]+'</button></div>'+
      '<div class="pm"><span class="tally" data-o="pm" aria-live="polite"></span><button type="button" class="undo" data-a="undo" style="min-height:48px" aria-label="Undo the last mark: '+esc(t.n)+'">Undo</button></div>';}
  return h+'<p class="sub" data-o="sub"></p></section>';}
function render(){var sets=L.st.slice(),cur=st.set;if(cur&&sets.indexOf(cur)<0)sets.push(cur);
  root.innerHTML='<div class="card"><h1>Behavior data'+(L.s?' · '+esc(L.s):'')+'</h1><p class="who">'+(L.w?'Recording: <b>'+esc(L.w)+'</b>':'Recording on this phone')+'</p></div>'+
    '<div class="old" id="old" hidden></div>'+
    '<div class="card"><label class="f" for="sdDate">Date</label><input type="date" id="sdDate" value="'+esc(st.date)+'" max="'+esc(today())+'">'+
    '<label class="f" for="sdSet">Setting</label><select id="sdSet">'+opt('','Choose the setting',!cur)+sets.map(function(s){return opt(s,s,s===cur);}).join('')+opt('__other','Other…',false)+'</select>'+
    '<input type="text" id="sdSetOther" placeholder="Type the setting" maxlength="40" hidden autocomplete="off">'+
    '<span class="f" id="sdAsL">Assent (the student agreed to take part)</span><div class="seg" role="group" aria-labelledby="sdAsL">'+ASSENT.map(function(a){return '<button type="button" class="as-'+a[0]+'" data-as="'+a[0]+'" aria-pressed="'+(st.as===a[0])+'">'+a[1]+'</button>';}).join('')+'</div></div>'+
    L.t.map(card).join('')+
    '<div class="card"><label class="f" for="sdNote">Note (optional; no names)</label><input type="text" id="sdNote" class="note-in" maxlength="300" autocomplete="off" value="'+esc(st.note)+'"></div>'+
    '<div class="card" id="sdSentC" hidden><h2>Sent</h2><ul class="sent" id="sdSent"></ul></div>'+
    '<p class="foot">Every tap is kept on this phone until it is sent. Send locks it on this phone so that only the BCBA’s own form can open it; the website keeps only the locked message. The student is named by initials only: keep names off the note.</p>'+
    '<p class="foot" id="sdKeep" hidden><b>This browser is not keeping the taps</b> (Private Browsing, or storage turned off): send before you close this page.</p>'+
    '<div class="bar"><div class="in"><p class="msg" id="sdMsg" role="status" aria-live="polite"></p><button type="button" class="send" id="sdSend">Send today’s data</button></div></div>';
  paint();}
function sumOf(t,x){if(t.m==='n')return t.n+' '+x.n;if(t.m==='d'){var s=x.e.reduce(function(a,e){return a+(e.z-e.a)/1000;},0);return t.n+' '+x.e.length+' episode'+(x.e.length===1?'':'s')+(x.e.length?' ('+clock(s)+')':'');}
  var n=x.p+x.m;return t.n+' '+x.p+'+ '+x.m+'−'+(n?' ('+Math.round(100*x.p/n)+'%)':'');}
function entrySum(e){return L.t.map(function(t){var p=e.d[t.i];if(!p)return '';if('n' in p)return t.n+' '+p.n;if('e' in p){var s=p.e.reduce(function(a,x){return a+x[2];},0);return t.n+' '+p.e.length+' episode'+(p.e.length===1?'':'s')+(p.e.length?' ('+clock(s)+')':'');}var n=p.p+p.m;return t.n+' '+p.p+'+ '+p.m+'−'+(n?' ('+Math.round(100*p.p/n)+'%)':'');}).filter(Boolean).join(' · ');}
var msg={k:'',t:''},armed=0;
function say(k,t){msg={k:k,t:t};var m=D.getElementById('sdMsg');if(m){m.className='msg'+(k?' '+k:'');m.innerHTML=t;}}
function paint(){var now=Date.now();
  L.t.forEach(function(t){var x=st.t[t.i],c=root.querySelector('section.t[data-t="'+CSS.escape(t.i)+'"]');if(!c)return;c.classList.toggle('off',x.off);
    var w=c.querySelector('[data-a="watch"]');w.setAttribute('aria-pressed',String(!x.off));w.textContent=x.off?'Not watching':'Watching';
    var sentN=st.sent.concat(st.out).filter(function(e){return e.date===st.date;}),sub=c.querySelector('[data-o="sub"]');
    if(t.m==='n'){c.querySelector('[data-o="n"]').textContent=String(x.n);c.querySelector('[data-a="undo"]').disabled=!x.n;
      var sn=sentN.reduce(function(a,e){var p=e.d&&e.d[t.i];return a+(p&&p.n?p.n:0);},0);sub.textContent=x.off?'Not watching: left blank, not sent.':(sn?sn+' sent already for '+day(st.date)+'. ':'')+'Tap +1 each time it happens.';}
    else if(t.m==='d'){var b=c.querySelector('[data-a="dur"]');b.textContent=x.run?'Stop':'Start';b.classList.toggle('run',!!x.run);b.setAttribute('aria-label',(x.run?'Stop':'Start')+' an episode: '+t.n);
      var total=x.e.reduce(function(a,e){return a+(e.z-e.a)/1000;},0)+(x.run?(now-x.run)/1000:0);c.querySelector('[data-o="clock"]').textContent=clock(x.run?(now-x.run)/1000:total);
      c.querySelector('[data-a="undo"]').disabled=!x.run&&!x.e.length;
      c.querySelector('[data-o="eps"]').innerHTML=x.e.map(function(e){return '<li>'+esc(hm(e.a))+' to '+esc(hm(e.z))+', '+clock((e.z-e.a)/1000)+'</li>';}).join('')+(x.run?'<li><b>Running since '+esc(hm(x.run))+'</b></li>':'');
      sub.textContent=x.off?'Not watching: left blank, not sent.':x.run?'Episode running: tap Stop when it ends.':x.e.length?x.e.length+' episode'+(x.e.length===1?'':'s')+', '+clock(total)+' in all, not sent yet.':'Tap Start when an episode begins and Stop when it ends.';}
    else{var n=x.p+x.m;c.querySelector('[data-o="pm"]').textContent=x.p+' +  ·  '+x.m+' −'+(n?'  ·  '+Math.round(100*x.p/n)+'%':'');c.querySelector('[data-a="undo"]').disabled=!x.q.length;
      sub.textContent=x.off?'Not watching: left blank, not sent.':t.m==='i'?'One mark for each interval: + when it occurred, − when it did not.':'One mark for each opportunity: + when the student did it, − when not.';}});
  var o=D.getElementById('old'),runs=L.t.some(function(t){return st.t[t.i].run;});
  if(st.date!==today()&&(touched()||runs)){o.hidden=false;o.innerHTML='These entries are for <b>'+esc(day(st.date))+'</b>, not today. Send them, then the page moves to today.';}else o.hidden=true;
  var s=D.getElementById('sdSend');s.textContent=st.date===today()?'Send today’s data':'Send the data for '+day(st.date);s.disabled=sending;
  var list=st.sent.filter(function(e){return e.date===st.date;}),sc=D.getElementById('sdSentC');sc.hidden=!list.length&&!st.out.length;
  D.getElementById('sdSent').innerHTML=st.out.map(function(e){return '<li><b>Waiting to send</b> · '+esc(day(e.date))+': '+esc(entrySum(e)||'the day’s marks')+'</li>';}).join('')+
    list.slice().reverse().map(function(e){return '<li><b>Sent '+esc(hm(e.atMs||Date.parse(e.at)))+'</b>: '+esc(e.sum||'the day’s marks')+'</li>';}).join('');
  D.getElementById('sdKeep').hidden=canKeep;
  if(!msg.t){if(st.out.length)say('warn',st.out.length+' entr'+(st.out.length===1?'y is':'ies are')+' waiting to send'+(st.err?' ('+esc(st.err)+')':'')+'. '+(st.out.length===1?'It is':'They are')+' kept on this phone and '+(st.out.length===1?'goes':'go')+' by '+(st.out.length===1?'itself':'themselves')+' when the signal is back.');
    else if(touched()||st.dirty)say('','Kept on this phone, not sent yet.');
    else{var last=st.sent[st.sent.length-1];if(last)say('ok','<b>Sent.</b> '+esc(hm(last.atMs||Date.parse(last.at)))+(last.date!==today()?' ('+esc(day(last.date))+')':''));}}}
function changed(t){keep();if(t!==false){msg={k:'',t:''};armed=0;}paint();}
function buzz(){try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}}

/* ---- taps ---- */
root.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('button');if(!b||!root.contains(b))return;
  if(b.id==='sdSend'){sendNow();return;}
  if(b.dataset.as){st.as=st.as===b.dataset.as?'':b.dataset.as;st.dirty=true;root.querySelectorAll('[data-as]').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.as===st.as));});changed();return;}
  var c=b.closest('section.t');if(!c)return;var t=L.t.filter(function(x){return x.i===c.dataset.t;})[0],x=t&&st.t[t.i];if(!x)return;var a=b.dataset.a;
  if(a==='watch'){x.off=!x.off;if(x.off&&x.run)x.run=0;changed();return;}
  if(x.off){x.off=false;}
  if(a==='inc'){x.n=Math.min(9999,x.n+1);buzz();}
  else if(a==='plus'){if(x.p+x.m<9999){x.p++;x.q.push('+');}buzz();}
  else if(a==='minus'){if(x.p+x.m<9999){x.m++;x.q.push('-');}buzz();}
  else if(a==='dur'){var now=Date.now();if(x.run){if(now>x.run)x.e.push({a:x.run,z:now});x.run=0;}else x.run=now;buzz();}
  else if(a==='undo'){if(t.m==='n'){if(x.n)x.n--;}else if(t.m==='d'){if(x.run)x.run=0;else x.e.pop();}else{var k=x.q.pop();if(k==='+'&&x.p)x.p--;else if(k==='-'&&x.m)x.m--;}}
  changed();});
root.addEventListener('change',function(ev){var e=ev.target;
  if(e.id==='sdDate'){if(isoOk(e.value)&&e.value<=today()){st.date=e.value;st.dirty=true;changed();}else{e.value=st.date;say('bad','Choose a day up to today.');}return;}
  if(e.id==='sdSet'){var o=D.getElementById('sdSetOther');if(e.value==='__other'){o.hidden=false;o.value='';o.focus();return;}o.hidden=true;st.set=e.value;st.dirty=true;changed();return;}
  if(e.id==='sdSetOther'){st.set=str(e.value,40);st.dirty=true;keep();render();return;}});
root.addEventListener('input',function(ev){var e=ev.target;if(e.id==='sdNote'){st.note=e.value.slice(0,300);st.dirty=true;keep();}});

/* ---- send: what was tapped becomes an entry, locked and posted; it stays on the phone until the box has it ---- */
var sending=false,timer=0;
function close(){var d={};L.t.forEach(function(t){var x=st.t[t.i];if(x.off)return;
    if(t.m==='n')d[t.i]={n:x.n};else if(t.m==='d')d[t.i]={e:x.e.map(function(e){return [hms(e.a),hms(e.z),Math.round((e.z-e.a)/1000)];})};else d[t.i]={p:x.p,m:x.m};});
  var e={v:1,kind:'nbh-staff',form:'DD-1',c:L.c,w:L.w,id:rid(),date:st.date,made:new Date().toISOString(),d:d,as:st.as||'',st:st.set||'',note:str(st.note,300)};
  st.out.push(e);L.t.forEach(function(t){var x=st.t[t.i];x.n=0;x.p=0;x.m=0;x.q=[];x.e=[];});st.note='';st.dirty=false;keep();return e;}
function sendNow(){var first=!st.sent.concat(st.out).some(function(e){return e.date===st.date;}),runs=L.t.filter(function(t){return st.t[t.i].run;});
  if(touched()||st.dirty||st.note.trim()){close();}
  else if(first&&L.t.some(function(t){return !st.t[t.i].off;})){
    if(!armed||Date.now()-armed>15000){armed=Date.now();say('warn','Nothing was tapped for '+esc(day(st.date))+'. Press Send again to send <b>0</b> for each target you watched (none seen), or set the ones you did not watch to Not watching.');return;}
    armed=0;close();}
  else if(!st.out.length){say('warn','Nothing new since the last send'+(runs.length?' (an episode is still running: Stop it, then Send)':'')+'.');return;}
  var n=D.getElementById('sdNote');if(n)n.value='';
  if(runs.length)say('warn','Sending. An episode of '+esc(runs.map(function(t){return t.n;}).join(', '))+' is still running: it goes with the next send.');
  flush(true);}
function flush(asked){if(sending||!st.out.length){paint();return;}
  if(!(window.NBH_RESPOND&&NBH_RESPOND.sendBox)){say('warn','The page did not load completely, so nothing could be sent. Your entries are kept on this phone: reload the page when the signal is back.');paint();return;}
  sending=true;if(asked)say('','Sending…');paint();var e=st.out[0];
  NBH_RESPOND.sendBox(L.box,e).then(function(){st.out=st.out.filter(function(x){return x.id!==e.id;});var t=Date.now();st.sent.push({id:e.id,at:new Date(t).toISOString(),atMs:t,date:e.date,sum:entrySum(e)});st.sent=st.sent.slice(-80);st.err='';
      sending=false;if(roll())render();keep();if(st.out.length){flush(asked);return;}say('ok','<b>Sent.</b> '+esc(hm(t))+(e.date!==today()?' ('+esc(day(e.date))+')':''));paint();},
    function(err){sending=false;st.err=str(String((err&&err.message)||err),200);keep();
      say('warn','<b>Not sent yet</b> ('+esc(st.err)+'). '+(st.out.length===1?'The entry is':'The '+st.out.length+' entries are')+' kept on this phone and '+(st.out.length===1?'goes':'go')+' by '+(st.out.length===1?'itself':'themselves')+' when the signal is back, or press Send again.');paint();});}
/* again on their own: when the phone is back online, when the page comes to the front, and every 30 seconds while something waits */
window.addEventListener('online',function(){flush(false);});
D.addEventListener('visibilitychange',function(){if(D.visibilityState==='visible'){st=load();if(roll())keep();render();flush(false);}});
window.addEventListener('storage',function(ev){if(ev.key===KEY){st=load();render();}});
setInterval(function(){if(st.out.length&&!sending&&D.visibilityState==='visible')flush(false);},30000);
setInterval(function(){if(L.t.some(function(t){return st.t[t.i].run;})){L.t.forEach(function(t){if(t.m!=='d')return;var x=st.t[t.i],c=root.querySelector('section.t[data-t="'+CSS.escape(t.i)+'"] [data-o="clock"]');if(c&&x.run)c.textContent=clock((Date.now()-x.run)/1000);});}},1000);
render();if(st.out.length)flush(false);
window.__nbhStaffPage={state:function(){return JSON.parse(JSON.stringify(st));},key:KEY,link:L,flush:function(){flush(true);}};   /* for the workstation's checks */
})();
