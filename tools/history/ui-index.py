#!/usr/bin/env python3
"""Shell design work (v21.34): styled notices and questions instead of alert/confirm, the packet bar folded
to a summary once the student is loaded, touch-size controls. Idempotent."""
import sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()
if 'id="cfDlg"' in s:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:70], s.count(old))
    s = s.replace(old, new)

# ---- markup: the summary row at the top of the bar, a Done button in the details row, the confirm dialog
rep('''<div class="bar" id="bar">
  <!-- The student's details on one row, each label kept with its own box when
       the window is narrow; what you do with the packet and the case below. -->
  <div class="grp det" role="group" aria-label="Packet details">''',
'''<div class="bar" id="bar">
  <!-- v21.34: once the student is loaded the details fold to this one line; Edit opens them again -->
  <div class="grp sum" id="barSum" hidden>
    <b id="sumName"></b><span id="sumDet"></span><span id="sumCase"></span>
    <div class="sp"></div>
    <button id="barEdit" class="sm" title="Show the packet details and the case line">Edit details</button>
  </div>
  <!-- The student's details on one row, each label kept with its own box when
       the window is narrow; what you do with the packet and the case below. -->
  <div class="grp det" role="group" aria-label="Packet details">''')
rep('''    <button id="pushPacket" title="Send these details to every form you have open">Fill open forms</button>
  </div>''',
'''    <button id="pushPacket" title="Send these details to every form you have open">Fill open forms</button>
    <button id="barFold" class="sm" hidden title="Fold the details to one line">Done</button>
  </div>''')
rep('''<dialog id="dlg" aria-labelledby="dlgTitle">''',
'''<dialog id="cfDlg" aria-labelledby="cfTitle"><div class="dh" id="cfTitle">&nbsp;</div><div class="db" id="cfBody"></div>
  <div class="df" id="cfFoot"></div></dialog>
<div id="wsToasts" role="status" aria-live="polite"></div>
<dialog id="dlg" aria-labelledby="dlgTitle">''')

# ---- styles
rep('''.bar .grp{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap}''',
'''.bar .grp{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap}
/* v21.34: the folded packet bar */
.bar .sum{font-size:13px;color:#cfe0dd;line-height:1.4}
.bar .sum b{color:#fff;font-size:14px;font-family:var(--serif);font-weight:600}
.bar .sum span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.bar .sum #sumCase{color:#9fb6bd;flex:1 1 200px}
body.bar-folded .bar .det,body.bar-folded .bar .facts{display:none}
.bar [hidden]{display:none!important}   /* the bar's flex rules outranked the hidden attribute */
body.bar-folded #barSum{display:flex}
/* v21.34: toasts and the question dialog */
#wsToasts{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;z-index:9000;pointer-events:none;max-width:min(560px,calc(100% - 32px))}
.ws-toast{pointer-events:auto;background:#16242e;color:#f1f6f5;font-size:13.5px;line-height:1.45;padding:10px 16px;border-radius:8px;box-shadow:0 12px 30px -12px rgba(22,36,46,.6);display:flex;gap:12px;align-items:flex-start}
.ws-toast.warn{background:#7a2e1a}.ws-toast.ok{background:#1f5b3f}
.ws-toast button{margin-left:auto;border:0;background:transparent;color:#cfe0dd;font:inherit;cursor:pointer;padding:0 2px;line-height:1;min-height:0}
#cfDlg{max-width:520px}
#cfDlg .db{white-space:pre-line}
#cfDlg .df button.danger{background:#a8321e;color:#fff;border-color:#a8321e;font-weight:600}
/* v21.34: touch */
@media (pointer:coarse){
  button.sm{min-height:40px;padding:8px 12px}
  .bar button,.crumb button,#paneBar .pane button{min-height:40px}
  .crumb .acts button{min-width:40px}
  .rail .item{min-height:46px}
  .rail .item input[type=checkbox]{width:22px;height:22px}
  #cfDlg .df button,#dlg .df button{min-height:44px}
}''')

# ---- the ui helpers, the alert override, the bar fold
rep('''/* ================= save protection (v21.33) =================''',
'''/* ================= notices, questions, the folded bar (v21.34) =================
   The browser's alert() and confirm() were the shell's only voice: unstyled, "this site says", and a stop to
   the whole screen on an iPad. wsUI.toast shows a short message at the foot of the window without
   stopping anything; wsUI.alert sends a short message there and a long one to a styled notice;
   wsUI.confirm asks a styled question and resolves true or false. window.alert is routed through
   wsUI.alert; the four confirms are awaited. Once the student is loaded the packet details fold to one
   line (name, ID, grade, school, and what the case holds), with Edit details to open them again. */
const wsUI=(()=>{
  const U={};
  U.toast=(text,opt)=>{opt=opt||{};const h=$('#wsToasts'),t=document.createElement('div');t.className='ws-toast'+(opt.kind?' '+opt.kind:'');
    const sp=document.createElement('span');sp.textContent=String(text);t.appendChild(sp);
    const x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Dismiss');x.innerHTML='&times;';t.appendChild(x);
    const gone=()=>{if(t.parentNode)t.parentNode.removeChild(t);};x.addEventListener('click',gone);h.appendChild(t);
    while(h.children.length>3)h.removeChild(h.firstChild);setTimeout(gone,opt.ms||Math.min(12000,3500+String(text).length*35));return t;};
  const split=text=>{const s=String(text==null?'':text).trim();const i=s.indexOf('\\n');let head=i>=0?s.slice(0,i).trim():s,body=i>=0?s.slice(i+1).trim():'';
    if(i<0&&head.length>120){const j=head.indexOf('. ');if(j>20&&j<110){body=head.slice(j+2);head=head.slice(0,j+1);}}return {head,body};};
  const ask=(text,opt,question)=>new Promise(res=>{const d=$('#cfDlg'),p=split(text);$('#cfTitle').textContent=p.head;$('#cfBody').textContent=p.body;$('#cfBody').style.display=p.body?'':'none';
    const f=$('#cfFoot');f.innerHTML='';const done=v=>{try{d.close();}catch(e){}res(v);};
    if(question){const c=document.createElement('button');c.type='button';c.textContent=opt.cancel||'Cancel';c.addEventListener('click',()=>done(false));f.appendChild(c);}
    const ok=document.createElement('button');ok.type='button';ok.className=opt.danger?'danger':'primary';ok.textContent=opt.ok||'OK';ok.addEventListener('click',()=>done(true));f.appendChild(ok);
    d.oncancel=ev=>{ev.preventDefault();done(false);};d.showModal();ok.focus();});
  U.alert=text=>{const s=String(text==null?'':text);if(s.length<=160&&s.indexOf('\\n')<0){U.toast(s);return Promise.resolve();}return ask(s,{ok:'OK'},false);};
  U.confirm=(text,opt)=>ask(text,opt||{},true);
  return U;})();
window.alert=m=>{wsUI.alert(m);};
function paintSum(){
  const p=packet(),row=$('#barSum');if(!row)return;
  const has=!!p.client.trim();
  $('#barFold').hidden=!has;
  if(!has){document.body.classList.remove('bar-folded');row.hidden=true;return;}
  $('#sumName').textContent=p.client;
  $('#sumDet').textContent=[p.sid,p.grade?'Grade '+p.grade:'',p.site,p.bcba].filter(Boolean).join(' \\u00b7 ');
  const f=state.facts,bits=[];
  if(f){if((f.behaviors||[]).length)bits.push(f.behaviors.length+(f.behaviors.length===1?' target behavior':' target behaviors'));if(f.fn&&(f.fn.key||f.fn.label))bits.push('function: '+(f.fn.key||f.fn.label));
    const g=f.goals||{},gn=(g.red||[]).length+(g.acq||[]).length;if(gn)bits.push(gn+(gn===1?' goal':' goals'));if((f.menu||[]).length)bits.push(f.menu.length+' reinforcers');}
  $('#sumCase').textContent=bits.length?'The case: '+bits.join(', '):'';
  row.hidden=!document.body.classList.contains('bar-folded');
}
function foldBar(on){document.body.classList.toggle('bar-folded',!!on&&!!packet().client.trim());paintSum();if(!on){const e=$('#pClient');if(e)try{e.focus({preventScroll:true});}catch(err){}}}
$('#barEdit').addEventListener('click',()=>foldBar(false));
$('#barFold').addEventListener('click',()=>foldBar(true));
/* folded on its own the first time a name arrives from a packet, a case or the forms; typing keeps it open */
state.barAuto=false;
function barAutoFold(){if(state.barAuto)return;if(!packet().client.trim())return;state.barAuto=true;foldBar(true);}

/* ================= save protection (v21.33) =================''')
# who() paints the summary; a name taken from a form or a loaded packet folds the bar
rep('''['pClient','pSid','pGrade','pSite','pBcba'].forEach(id=>$('#'+id).addEventListener('input',who));''',
'''['pClient','pSid','pGrade','pSite','pBcba'].forEach(id=>$('#'+id).addEventListener('input',who));
$('#pClient').addEventListener('change',()=>{if(packet().client.trim()&&!state.barAuto){state.barAuto=true;}});   /* typed by hand: stays open until Done */''')
rep('''  nm.textContent=p.client||found||'No student loaded';''',
'''  nm.textContent=p.client||found||'No student loaded';
  if(typeof paintSum==='function')paintSum();''')
rep('''  who(); checkIdentity();
});''', '''  who(); checkIdentity(); barAutoFold();
});''')
rep('''    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
    Object.values(state.frames).forEach(pushPacketTo);
    if(d.facts)setFacts(d.facts,true);   /* v21.31 the case travels in the packet file */''',
'''    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
    Object.values(state.frames).forEach(pushPacketTo);
    if(d.facts)setFacts(d.facts,true);   /* v21.31 the case travels in the packet file */
    barAutoFold();''')
rep('''  if(d.facts)setFacts(d.facts,false); else setFacts(null,false);   /* v21.31 the case */''',
'''  if(d.facts)setFacts(d.facts,false); else setFacts(null,false);   /* v21.31 the case */
  barAutoFold();''')
rep('''function paintFacts(){
  const row=$('#factsRow'),t=$('#factsTxt');if(!row)return;''',
'''function paintFacts(){
  if(typeof paintSum==='function')paintSum();
  const row=$('#factsRow'),t=$('#factsTxt');if(!row)return;''')

# ---- the four confirms
rep('''$('#closeForm').addEventListener('click',()=>{
  if(!state.cur)return;
  if(!confirm('Close '+state.cur+'? Anything not saved to a file in that form will be lost.'))return;''',
'''$('#closeForm').addEventListener('click',async()=>{
  if(!state.cur)return;
  const closing=state.cur;
  if(!(await wsUI.confirm('Close Form '+closing+'?\\nAnything not saved to a file in that form will be lost.',{ok:'Close',danger:true})))return;
  if(state.cur!==closing)return;''')
rep('''    if(!confirm(notOpen.length+' ticked form'+(notOpen.length===1?' is':'s are')+
      ' not open yet ('+names+'), so '+(notOpen.length===1?'it':'they')+
      ' would print blank.\\n\\nOpen them first for their data to appear, or continue to include blanks?'))return;''',
'''    if(!(await wsUI.confirm(notOpen.length+' ticked form'+(notOpen.length===1?' is':'s are')+' not open yet: print '+(notOpen.length===1?'it':'them')+' blank?\\n'+
      names+'. Open them first for their data to appear, or continue to include blank pages.',{ok:'Include blanks'})))return;''')
rep('''  if(!p.client){if(!confirm('No student name is entered. Save the case file anyway?'))return;}''',
'''  if(!p.client){if(!(await wsUI.confirm('Save the case without a student name?\\nThe file will be named "case" and the cover will have no name on it.',{ok:'Save anyway'})))return;}''')
rep("""       !confirm('Open this case? '+ids.length+' form'+(ids.length===1?'':'s')+
                ' will be loaded and filled, replacing what is open now.'))return;""",
"""       !(await wsUI.confirm('Open this case? '+ids.length+' form'+(ids.length===1?'':'s')+' will be loaded and filled.\\n'+
                'What is open now is replaced.',{ok:'Open case'})))return;""")

# ---- help
rep('''   '<p><b>Saving.</b> <b>Save case</b> above the form carries a dot''',
'''   '<p><b>The bar.</b> Once a student is loaded the packet details fold to one line; <b>Edit details</b> opens them, <b>Done</b> folds them again. Messages appear briefly at the foot of the window instead of in browser pop-ups, and a question that loses work (closing a form, printing a blank page) is asked in the workstation\\u2019s own dialog.</p>'+
   '<p><b>Saving.</b> <b>Save case</b> above the form carries a dot''')
open(path, 'w', encoding='utf-8').write(s)
print('patched', path)
