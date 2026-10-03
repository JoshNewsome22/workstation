/* NBH respondent pages (v21.39): a form (IA-1 first) hands out a one-page questionnaire that a teacher, aide or
   parent answers on any phone or computer; "Send" opens an email to the BCBA with the answers as a short code
   (NBH1....), and the form reads the codes back into its own informant columns. One copy of this file serves
   every form that uses it; the one-file edition carries it once. The respondent page itself is self-contained:
   it embeds the runtime below, so it works from an email attachment with nothing else present. */
(function(){
  var U=window.NBH_RESPOND={version:1};
  /* ---- the code: a JSON object as base64url, marked NBH1. ---- */
  function b64u(str){var bytes=new TextEncoder().encode(str),s='';for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function unb64u(t){t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';var s=atob(t),b=new Uint8Array(s.length);for(var i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return new TextDecoder().decode(b);}
  U.encode=function(obj){return 'NBH1.'+b64u(JSON.stringify(obj));};
  U.decode=function(code){try{var m=/NBH1\.([A-Za-z0-9_-]+)/.exec(String(code||''));if(!m)return null;var o=JSON.parse(unb64u(m[1]));return (o&&o.v===1&&o.form&&o.inst)?o:null;}catch(e){return null;}};
  U.find=function(text){var out=[],seen={},re=/NBH1\.[A-Za-z0-9_-]{16,}/g,m;
    while((m=re.exec(String(text||'')))){if(seen[m[0]])continue;seen[m[0]]=1;var o=U.decode(m[0]);if(o)out.push(o);}return out;};
  /* ---- personalizing a pasted item: "the student" -> the name, "he or she" -> the pronouns, "the problem behavior" -> the behavior's term ---- */
  var PRON={he:{s:'he',o:'him',p:'his',r:'himself'},she:{s:'she',o:'her',p:'her',r:'herself'},they:{s:'they',o:'them',p:'their',r:'themselves'}};
  function cap(src,rep){return /^[A-Z]/.test(src)?rep.charAt(0).toUpperCase()+rep.slice(1):rep;}
  U.personalize=function(text,o){o=o||{};var t=String(text==null?'':text);var pr=PRON[o.pron]||null;
    if(o.name){t=t.replace(/\b(the|your|this|that|my)\s+(student|client|individual|person|child|pupil|learner|consumer)(['’]s)?\b/gi,function(m,a,b,pos){return cap(m,o.name+(pos?'’s':''));});}
    if(pr){t=t.replace(/\b(himself\s+or\s+herself|herself\s+or\s+himself|himself\s*\/\s*herself)\b/gi,function(m){return cap(m,pr.r);})
      .replace(/\b(his\s+or\s+her|her\s+or\s+his|his\s*\/\s*hers?)\b/gi,function(m){return cap(m,pr.p);})
      .replace(/\b(him\s+or\s+her|her\s+or\s+him|him\s*\/\s*her)\b/gi,function(m){return cap(m,pr.o);})
      .replace(/\b(he\s+or\s+she|she\s+or\s+he|he\s*\/\s*she|s\/he)\b/gi,function(m){return cap(m,pr.s);});
      if(o.pron==='they'){var V={is:'are',was:'were',has:'have',does:'do','doesn’t':'don’t',"doesn't":"don't","isn't":"aren't","isn’t":"aren’t","wasn't":"weren't","hasn't":"haven't"};
        t=t.replace(/\b(they)\s+(is|was|has|does|doesn't|doesn’t|isn't|isn’t|wasn't|hasn't)\b/gi,function(m,a,b){return a+' '+(V[b.toLowerCase()]||b);});}}
    if(o.behs){t=t.replace(/\b(the|this|that|these|those)\s+(problem|target|challenging|inappropriate|interfering|disruptive)\s+behaviou?rs\b/gi,function(m){return cap(m,o.behs);})
      .replace(/\b(problem|target|challenging|inappropriate|interfering|disruptive)\s+behaviou?rs\b/gi,function(m){return cap(m,o.behs);})
      .replace(/\b(the|these|those)\s+behaviou?rs\b/gi,function(m){return cap(m,o.behs);});}
    if(o.beh){t=t.replace(/\b(the|this|that)\s+(problem|target|challenging|inappropriate|interfering|disruptive)\s+behaviou?r\b/gi,function(m){return cap(m,o.beh);})
      .replace(/\b(problem|target|challenging|inappropriate|interfering|disruptive)\s+behaviou?r\b/gi,function(m){return cap(m,o.beh);})
      .replace(/\b(the|this)\s+behaviou?r\b/gi,function(m){return cap(m,o.beh);});}
    return t;};
  U.payloadToHash=function(payload){return '#p='+b64u(JSON.stringify(payload));};
  U.payloadFromHash=function(){try{var m=/[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash);return m?JSON.parse(unb64u(m[1])):null;}catch(e){return null;}};

  /* ---- the respondent page runtime: one function, used here and copied into the generated page ---- */
  function NBH_RESPOND_RUNTIME(root,P){
    var d=document;function h(tag,attrs,kids){var e=d.createElement(tag);if(attrs)for(var k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='html')e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}
      (kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?d.createTextNode(c):c);});return e;}
    var CSS=':root{--navy:#182e43;--slate:#254657;--teal:#76a2a3;--mist:#eaf2f0;--ink:#1a2933;--muted:#54676f;--rule:#cfdad8;--red:#8e2a2a}'+
      '*{box-sizing:border-box}body{margin:0;background:#f1f4f3;color:var(--ink);font:16px/1.5 "Inter","Segoe UI","Helvetica Neue",Arial,system-ui,sans-serif}'+
      '.nr{max-width:760px;margin:0 auto;padding:16px}.nr-card{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:18px 20px;margin:0 0 14px;box-shadow:0 1px 3px rgba(24,46,67,.06)}'+
      '.nr h1{font:600 22px/1.25 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;color:var(--navy);margin:0 0 4px}.nr .sub{color:var(--muted);font-size:14px;margin:0 0 10px}'+
      '.nr .band{display:inline-block;background:var(--mist);color:var(--navy);border-left:4px solid var(--teal);padding:2px 10px;font-size:13px;margin:0 0 10px}'+
      '.nr .def{background:var(--mist);border-radius:6px;padding:10px 12px;font-size:14.5px;margin:10px 0}.nr .def b{color:var(--navy)}'+
      '.nr label.f{display:block;font-size:13px;color:var(--muted);margin:10px 0 2px}.nr input[type=text],.nr textarea,.nr select{width:100%;font:inherit;font-size:16px;padding:9px 10px;border:1px solid #b7c8c5;border-radius:6px;background:#fff;color:var(--ink)}'+
      '.nr textarea{min-height:70px;resize:vertical}.nr .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}@media(max-width:560px){.nr .grid2{grid-template-columns:1fr}}'+
      '.nr ol.items{list-style:none;padding:0;margin:0}.nr li.it{border-top:1px solid var(--rule);padding:14px 0}.nr li.it .q{font-size:16px;margin:0 0 8px}.nr li.it .q b{color:var(--navy);margin-right:6px}'+
      '.nr .opts{display:flex;flex-wrap:wrap;gap:8px}.nr .opts label{flex:1 1 auto;min-width:64px;text-align:center;border:1.5px solid #b7c8c5;border-radius:8px;padding:10px 8px;cursor:pointer;font-size:15px;background:#fff;user-select:none}'+
      '.nr .opts label.num{flex:0 0 auto;min-width:52px}.nr .opts input{position:absolute;opacity:0;width:1px;height:1px}.nr .opts label.on{background:var(--navy);color:#fff;border-color:var(--navy)}'+
      '.nr .opts label:focus-within{outline:3px solid #2f7fa8;outline-offset:2px}.nr .key{font-size:13px;color:var(--muted);margin:0 0 6px}.nr .key span{display:inline-block;margin-right:10px}'+
      '.nr .prog{position:sticky;top:0;background:#f1f4f3;padding:8px 0;font-size:13.5px;color:var(--muted);z-index:2}.nr .prog b{color:var(--navy)}'+
      '.nr button{font:inherit;font-size:16px;padding:12px 18px;border-radius:8px;border:1.5px solid var(--navy);background:var(--navy);color:#fff;cursor:pointer;min-height:48px}.nr button.ghost{background:#fff;color:var(--navy)}'+
      '.nr .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}.nr .warn{background:#fdf3ec;border-left:4px solid #b9672d;padding:8px 12px;font-size:14px;margin:10px 0}'+
      '.nr .done{background:#e8f3ec;border-left:4px solid #2f6b37;padding:10px 12px;margin:10px 0}.nr .code{width:100%;font:12.5px/1.4 ui-monospace,Menlo,Consolas,monospace;word-break:break-all;min-height:90px}'+
      '.nr .yns .opts{margin:0 0 6px}.nr .yns input{margin:0 0 4px}'+
      '.nr .links{margin:10px 0 0;font-size:15px}.nr .links a{color:var(--navy);font-weight:600;text-decoration:underline}'+
      '.nr .conf{background:#fff;border:1.5px solid var(--teal);border-radius:8px;padding:10px 12px;margin:8px 0}.nr .conf.missing{border-color:var(--red)}.nr .conf .q{margin:0 0 8px;font-size:15px}.nr .conf .req{color:var(--red)}.nr .conf .sub{margin:8px 0 0;color:var(--ink)}'+
      '.nr .foot{font-size:12.5px;color:var(--muted);margin:14px 0 0}.nr .miss{color:var(--red);font-weight:600}@media print{.nr .prog,.nr .row,.nr button{display:none}}';
    if(!d.getElementById('nbhr-css')){var st=h('style',{id:'nbhr-css'});st.textContent=CSS;d.head.appendChild(st);}
    root.innerHTML='';root.className='nr';
    var items=P.items||[],scale=P.scale||{kind:'yn'},extras=P.extras||[],opens=P.open||[];
    var ans=new Array(items.length).fill(''),prog;
    function answered(){var k=0;ans.forEach(function(a){if(a!=='')k++;});return k;}
    function paint(){prog.innerHTML='<b>'+answered()+' of '+items.length+'</b> answered';}
    /* the definition question: Yes / No / Unsure, required when the payload asks for it */
    var conf='';
    function confBlock(){var w=h('div',{'class':'conf',id:'nbhr-conf'});w.appendChild(h('p',{'class':'q',html:'<b>Do you understand this definition of '+esc(P.beh||'the behavior')+'?</b> <span class="req">*</span>'}));
      var opts=h('div',{'class':'opts',role:'radiogroup','aria-label':'Do you understand the definition'}),note=h('p',{'class':'sub',id:'nbhr-conf-note'});note.hidden=true;
      [['yes','Yes'],['no','No'],['unsure','Unsure']].forEach(function(c){var lab=h('label'),r=h('input',{type:'radio',name:'nbhr-confirm',value:c[0]});lab.appendChild(r);lab.appendChild(d.createTextNode(c[1]));
        r.addEventListener('change',function(){conf=c[0];Array.prototype.forEach.call(opts.querySelectorAll('label'),function(l){l.classList.remove('on');});lab.classList.add('on');w.classList.remove('missing');
          note.hidden=conf==='yes';note.textContent=conf==='yes'?'':conf==='no'?'Please ask '+(P.bcba||'the BCBA')+(P.email?' ('+P.email+')':'')+' to explain the definition before you answer: the page will not send answers about a definition you do not understand. When it is clear, change your answer to Yes.':'Please ask '+(P.bcba||'the BCBA')+(P.email?' ('+P.email+')':'')+' about the definition before you answer, if you can. If you go on, answer only about what you have seen that matches the definition above; your answer here travels with your responses.';});
        opts.appendChild(lab);});
      w.appendChild(opts);w.appendChild(note);return w;}
    /* links the assessor adds: an instructions video or page (http and https only) */
    function linksBlock(){var ls=(P.links||[]).filter(function(l){return l&&/^https?:\/\//i.test(l.url||'');});if(!ls.length)return null;
      var w=h('p',{'class':'links'});ls.forEach(function(l,i){if(i)w.appendChild(d.createTextNode(' \u00b7 '));var a=h('a',{href:l.url,target:'_blank',rel:'noopener noreferrer',text:l.label||'Instructions'});w.appendChild(a);});return w;}
    /* head */
    var card=h('div',{'class':'nr-card'},[h('div',{'class':'band',text:(P.form?'Form '+P.form+' · ':'')+(P.title||P.inst)}),h('h1',{text:P.heading||(P.title||'Questionnaire')}),
      h('p',{'class':'sub',text:(P.sub||'')}),
      h('div',{'class':'def',html:'<b>Student:</b> '+esc(P.student||'')+(P.beh?'<br><b>Behavior this questionnaire is about:</b> '+esc(P.beh):'')+(P.def?'<br><b>What counts as '+esc(P.beh||'the behavior')+':</b> '+esc(P.def):'')}),
      P.confirm?confBlock():null,
      h('p',{'class':'sub',text:P.instructions||'Answer every item for the student and the behavior named above, from what you have seen yourself. When you have finished, press Send: your email program opens with a message to '+(P.bcba||'the BCBA')+' ready to go.'}),
      P.due?h('p',{'class':'sub',text:'Please send it by '+P.due+'.'}):null,
      linksBlock()]);
    root.appendChild(card);
    /* respondent */
    var who=h('div',{'class':'nr-card'});who.appendChild(h('div',{'class':'band',text:'About you'}));var g=h('div',{'class':'grid2'});
    var ex={};extras.forEach(function(x){var lab=h('label',{'class':'f',text:x.label+(x.req?' *':'')});var inp;
      if(x.type==='yn'){inp=h('select');['','Yes','No'].forEach(function(v){inp.appendChild(h('option',{value:v,text:v||'—'}));});}
      else{inp=h('input',{type:'text',autocomplete:x.id==='name'?'name':'off'});}
      ex[x.id]=inp;lab.appendChild(inp);g.appendChild(lab);});
    who.appendChild(g);root.appendChild(who);
    /* items */
    var ic=h('div',{'class':'nr-card'});ic.appendChild(h('div',{'class':'band',text:P.itemsHeading||'The items'}));
    prog=h('div',{'class':'prog'});ic.appendChild(prog);
    if(scale.kind==='num'&&scale.anchors&&scale.anchors.length){var key=h('div',{'class':'key'});scale.anchors.forEach(function(a){key.appendChild(h('span',{text:a}));});ic.appendChild(key);}
    var ol=h('ol',{'class':'items'});
    items.forEach(function(it,i){var li=h('li',{'class':'it'});li.appendChild(h('p',{'class':'q',html:'<b>'+(it.n||i+1)+'.</b> '+esc(it.text||'')}));
      var opts=h('div',{'class':'opts',role:'radiogroup','aria-label':'Item '+(it.n||i+1)});var choices;
      if(scale.kind==='num'){choices=[];for(var v=(scale.min||0);v<=(scale.max||6);v++)choices.push([String(v),String(v),'num']);if(scale.na)choices.push(['NA',scale.naLabel||'Can\u2019t judge','']);}
      else{var L=scale.labels||['Yes','No','N/A'];choices=[['Y',L[0]||'Yes',''],['N',L[1]||'No','']];if(L[2]!==null&&L[2]!=='')choices.push(['NA',L[2]||'N/A','']);}
      choices.forEach(function(c){var lab=h('label',{'class':c[2]});var r=h('input',{type:'radio',name:'it'+i,value:c[0]});lab.appendChild(r);lab.appendChild(d.createTextNode(c[1]));
        r.addEventListener('change',function(){ans[i]=c[0];Array.prototype.forEach.call(opts.querySelectorAll('label'),function(l){l.classList.remove('on');});lab.classList.add('on');li.classList.remove('missing');paint();});
        opts.appendChild(lab);});
      li.appendChild(opts);ol.appendChild(li);});
    ic.appendChild(ol);
    /* open-ended, after the items unless the payload asks for them first */
    var op={},oc=null;if(opens.length){oc=h('div',{'class':'nr-card'});oc.appendChild(h('div',{'class':'band',text:P.openHeading||'In your own words'}));
      opens.forEach(function(o){var lab=h('label',{'class':'f',text:o.label});oc.appendChild(lab);
        if(o.type==='yns'){var wrap=h('div',{'class':'yns'}),pick='',opts=h('div',{'class':'opts'}),note=h('input',{type:'text',placeholder:o.notePlaceholder||'Add a note if you wish','aria-label':'Note for '+o.label});
          (o.choices||['Yes','No','Sometimes']).forEach(function(c){var l=h('label',{text:c});l.addEventListener('click',function(){pick=c;Array.prototype.forEach.call(opts.children,function(x){x.classList.remove('on');});l.classList.add('on');});opts.appendChild(l);});
          wrap.appendChild(opts);wrap.appendChild(note);oc.appendChild(wrap);op[o.id]={get value(){return pick?pick+(note.value.trim()?'; '+note.value.trim():''):note.value.trim();}};}
        else{var ta=h('textarea',{maxlength:String(o.max||600)});op[o.id]=ta;oc.appendChild(ta);}});}
    if(oc&&P.openFirst)root.appendChild(oc);if(items.length)root.appendChild(ic);if(oc&&!P.openFirst)root.appendChild(oc);
    /* send */
    var sc=h('div',{'class':'nr-card'});sc.appendChild(h('div',{'class':'band',text:'Send your answers'}));
    var warn=h('div',{'class':'warn'});warn.hidden=true;sc.appendChild(warn);
    var row=h('div',{'class':'row'});var send=h('button',{type:'button',text:'Send to '+(P.bcba||'the BCBA')});row.appendChild(send);sc.appendChild(row);
    var done=h('div',{'class':'done'});done.hidden=true;sc.appendChild(done);
    var codeBox=h('textarea',{'class':'code',readonly:'readonly','aria-label':'Your answer code'});codeBox.hidden=true;sc.appendChild(codeBox);
    var row2=h('div',{'class':'row'});row2.hidden=true;var cp=h('button',{type:'button','class':'ghost',text:'Copy the code'}),sv=h('button',{type:'button','class':'ghost',text:'Save as a file'}),ml=h('a',{href:'#',id:'nbhr-mail'});ml.appendChild(h('button',{type:'button',text:'Open the email again'}));
    row2.appendChild(cp);row2.appendChild(sv);row2.appendChild(ml);sc.appendChild(row2);
    sc.appendChild(h('p',{'class':'foot',text:'Your answers travel only in the email you send; this page stores nothing and sends nothing on its own. Keep the student\'s full name out of the message.'}));
    root.appendChild(sc);
    function response(){var r={v:1,form:P.form||'',inst:P.inst||'',student:P.student||'',beh:P.behLabel||P.beh||'',n:items.length,ans:ans.slice(),date:new Date().toISOString().slice(0,10)};
      if(P.confirm)r.confirmed=conf;if(P.sig)r.sig=String(P.sig).slice(0,60);
      extras.forEach(function(x){r[x.id]=(ex[x.id].value||'').trim();});if(opens.length){r.open={};opens.forEach(function(o){r.open[o.id]=(op[o.id].value||'').trim();});}return r;}
    function encode(obj){var bytes=new TextEncoder().encode(JSON.stringify(obj)),s='';for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return 'NBH1.'+btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
    var lastCode='',warnedMiss='';
    function mailto(code){var subj=(P.subject||((P.title||P.inst)+' answers'))+(P.student?' · '+P.student:'');
      var body='Answers from the respondent page, for Form '+(P.form||'')+'. Paste this whole message into "Collect responses" on the form.\n\n'+code+'\n\n'+(ex.name&&ex.name.value?'From: '+ex.name.value+'\n':'')+'Sent '+new Date().toLocaleDateString();
      return 'mailto:'+encodeURIComponent(P.email||'')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);}
    send.addEventListener('click',function(){var miss=[];items.forEach(function(it,i){if(ans[i]==='')miss.push(it.n||i+1);});
      var need=extras.filter(function(x){return x.req&&!(ex[x.id].value||'').trim();}).map(function(x){return x.label;});
      if(P.confirm&&!conf){need.push('whether you understand the definition');var cw=d.getElementById('nbhr-conf');if(cw)cw.classList.add('missing');}
      if(P.confirm&&conf==='no'){warn.hidden=false;warn.innerHTML='You answered <b>No</b> to the question about the definition, so the page cannot send your answers yet. Please ask '+esc(P.bcba||'the BCBA')+(P.email?' ('+esc(P.email)+')':'')+' to explain the definition; when it is clear, change your answer to Yes and press Send again.';var cw2=d.getElementById('nbhr-conf');if(cw2)cw2.scrollIntoView({behavior:'smooth',block:'center'});return;}
      Array.prototype.forEach.call(ol.children,function(li,i){li.classList.toggle('missing',ans[i]==='');});
      if(need.length||miss.length){var again=!need.length&&miss.length<items.length&&warnedMiss===miss.join(',');
        warn.hidden=false;warn.innerHTML=(need.length?'Please fill in: <span class="miss">'+esc(need.join(', '))+'</span>. ':'')+(miss.length?'Unanswered item'+(miss.length===1?'':'s')+': <span class="miss">'+miss.join(', ')+'</span>. '+(again?'Sending with '+miss.length+' left blank, as you chose.':'Answer each one'+((scale.kind==='yn'&&!(scale.labels&&(scale.labels[2]===null||scale.labels[2]==='')))||scale.na?' (N/A counts)':'')+' and press Send again. To send with these left blank on purpose, press Send once more without changing anything.'):'');
        warnedMiss=need.length?'':miss.join(',');if(!again)return;}
      else{warn.hidden=true;warnedMiss='';}
      lastCode=encode(response());codeBox.value=lastCode;codeBox.hidden=false;row2.hidden=false;done.hidden=false;
      done.innerHTML='<b>Your email program should open now</b> with the message to '+esc(P.bcba||'the BCBA')+(P.email?' ('+esc(P.email)+')':'')+'. Press Send there. If nothing opened, copy the code below and paste it into an email to '+esc(P.email||'the BCBA')+', or save it as a file and attach it.';
      ml.href=mailto(lastCode);
      if(ml.href.length>(P.mailMax||1800)){done.className='warn';done.innerHTML='<b>Your answers are longer than an email link can carry</b> ('+ml.href.length.toLocaleString()+' characters, where about '+(P.mailMax||1800).toLocaleString()+' fit), so no email was opened. Press <b>Save as a file</b> and attach the file to an email to '+esc(P.email||'the BCBA')+', or <b>Copy the code</b> and paste it into the message.';
        row2.insertBefore(sv,cp);ml.hidden=true;sv.className='';cp.className='ghost';return;}
      done.className='done';ml.hidden=false;window.location.href=ml.href;});
    cp.addEventListener('click',function(){codeBox.select();try{navigator.clipboard.writeText(lastCode);}catch(e){d.execCommand('copy');}cp.textContent='Copied';setTimeout(function(){cp.textContent='Copy the code';},1500);});
    sv.addEventListener('click',function(){var blob=new Blob([lastCode+'\n'],{type:'text/plain'}),a=h('a',{href:URL.createObjectURL(blob),download:(P.form||'form')+'_'+(P.inst||'answers')+'_'+((ex.name&&ex.name.value)||'respondent').replace(/[^\w.-]+/g,'_')+'.nbhr.txt'});d.body.appendChild(a);a.click();a.remove();});
    ml.addEventListener('click',function(e){if(!lastCode){e.preventDefault();}});
    paint();
    function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  }
  U.mount=function(root,payload){NBH_RESPOND_RUNTIME(root,payload);};
  /* ---- the generated page: everything inline, nothing to fetch ---- */
  U.pageHTML=function(payload){var json=JSON.stringify(payload).replace(/<\//g,'<\\/');var t=(payload.title||payload.inst||'Questionnaire')+(payload.student?' · '+payload.student:'');
    return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>'+t.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</title></head>\n<body><div id="nbhr"></div>\n'+
      '<script type="application/json" id="nbhr-payload">'+json+'<\/script>\n<script>\n'+NBH_RESPOND_RUNTIME.toString()+'\nNBH_RESPOND_RUNTIME(document.getElementById("nbhr"),JSON.parse(document.getElementById("nbhr-payload").textContent));\n<\/script></body></html>\n';};
})();
