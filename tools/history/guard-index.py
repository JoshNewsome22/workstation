#!/usr/bin/env python3
"""Save protection in the shell (v21.33): a Save case button on the crumb bar that shows when the case holds
changes not yet in a file, and a quiet nudge after a while. Idempotent."""
import sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()
if 'id="saveQuick"' in s:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:70], s.count(old))
    s = s.replace(old, new)
rep('''        <button id="printOne" class="sm" aria-label="Print this form"''',
'''        <button id="saveQuick" class="sm" aria-label="Save case" title="Save the case to a file"><svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2.5h9l2 2v9h-11z"/><path d="M5 2.5v4h5v-4M5 13.5v-4h6v4"/></svg><span class="lbl">Save case</span><span class="dot" aria-hidden="true"></span></button>
        <button id="printOne" class="sm" aria-label="Print this form"''')
rep('''/* side by side (v21.32): the chooser */''',
'''/* save protection (v21.33): the crumb's Save case shows a dot while the case holds work not yet in a file,
   and pulses once it has been that way for a while */
#saveQuick .dot{display:none;width:8px;height:8px;border-radius:50%;background:#c9742a;margin-left:2px}
#saveQuick.dirty .dot{display:inline-block}
#saveQuick.nudge{border-color:#c9742a;box-shadow:0 0 0 0 rgba(201,116,42,.6);animation:saveNudge 1.6s ease-out 3}
@keyframes saveNudge{0%{box-shadow:0 0 0 0 rgba(201,116,42,.6)}100%{box-shadow:0 0 0 10px rgba(201,116,42,0)}}
/* side by side (v21.32): the chooser */''')
rep('''/* ================= side by side (v21.32) =================''',
'''/* ================= save protection (v21.33) =================
   Autosave is a safety net in this browser; the record is the case file. The crumb's Save case button
   carries a dot while the case holds entries changed since the last file save (the same signature the
   unload guard uses), the button's title says how long, and after NUDGE minutes it pulses and the
   live region says so, once per stretch of unsaved work. On an iPad the browser can drop a background
   tab or clear its storage, so this is the reminder that matters there. */
const NUDGE_MIN=20;
state.dirtySince=null;state.nudged=false;
function caseDirty(){
  const work=Object.keys(state.status).some(k=>(state.status[k].filled||0)>3);
  if(!work)return false;
  return !(state.lastSig&&state.lastSig===caseSig());
}
function paintSave(){
  const b=$('#saveQuick');if(!b)return;
  const d=caseDirty();
  if(d&&!state.dirtySince)state.dirtySince=Date.now();
  if(!d){state.dirtySince=null;state.nudged=false;}
  const min=state.dirtySince?Math.round((Date.now()-state.dirtySince)/60000):0;
  b.classList.toggle('dirty',d);
  b.title=d?('Save the case to a file: it holds work not yet saved'+(min?' ('+min+' min)':'')):'Save the case to a file'+(state.savedAt?' (last saved '+state.savedAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+')':'');
  if(d&&min>=NUDGE_MIN&&!state.nudged){state.nudged=true;b.classList.add('nudge');setTimeout(()=>b.classList.remove('nudge'),6000);
    say('The case has had unsaved work for '+min+' minutes. Save case writes it to a file.');}
}
$('#saveQuick').addEventListener('click',()=>$('#saveCase').click());
setInterval(paintSave,5000);

/* ================= side by side (v21.32) =================''')
rep('''   '<p><b>Side by side.</b> With two or more forms open,''',
'''   '<p><b>Saving.</b> <b>Save case</b> above the form carries a dot while the case holds work not yet written to a file, and pulses after twenty minutes of it. Autosave is a safety net in this browser only; on an iPad the browser can drop a tab or clear its storage, so the case file is the record. A form opened on its own, outside the workstation, now asks before its tab closes with unsaved entries.</p>'+
   '<p><b>Side by side.</b> With two or more forms open,''')
open(path, 'w', encoding='utf-8').write(s)
print('patched', path)
