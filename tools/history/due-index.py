#!/usr/bin/env python3
"""v21.35 shell: a short Help with the detail folded, and a what's-due line read from the open forms."""
import sys, re
path = sys.argv[1]
s = open(path, encoding='utf-8').read()
if 'function gatherDue' in s:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:70], s.count(old))
    s = s.replace(old, new)

# ---- Help: short first, the rest folded
a = s.index("$('#help').addEventListener('click',()=>{")
b = s.index("/* ================= bookmarking a saved packet =================")
HELP = r"""$('#help').addEventListener('click',()=>{
  const fold=(t,h)=>'<details><summary>'+t+'</summary>'+h+'</details>';
  dialog('How this works',
   '<p class="hp-lead">Forms open inside this window and stay loaded while you work. Enter the student once, in the bar; the forms fill themselves. Save the case to a file before you leave.</p>'+
   '<ol class="hp-steps">'+
   '<li><b>Pick a form</b> from the list (on a tablet, from the <b>Forms</b> button). <b>Case map</b> says which form when.</li>'+
   '<li><b>Enter the student</b> in the bar. The details go into every form you open, into empty fields only.</li>'+
   '<li><b>Define the targets on TB-1.</b> They flow to every other form, with the function from FS-1, the goals from GB-1 and the reinforcer menu from PA-1. <b>From the case</b> on a form’s toolbar lets you pick them into a form already in use.</li>'+
   '<li><b>Save the case</b> (above the form, or <kbd>⌘S</kbd>) whenever the button shows a dot. Autosave is a safety net in this browser only; the case file is the record.</li>'+
   '<li><b>Tick the forms and build the master print</b> when the packet is ready; <b>Finish PDF</b> adds bookmarks and page numbers.</li></ol>'+
   fold('The case and the case map',
     '<p>The target behaviors (Form TB-1), the function (Form FS-1), the goals (Form GB-1) and the reinforcer menu (Form PA-1) are read from those forms while they are open and go into every other open form, into empty fields and empty behavior tables only; the line under the bar shows what has been read, and <b>Send to open forms</b> sends it again. They are saved in the packet and case files.</p>'+
     '<p><b>Case map</b> in the bar is one page that lists the forms stage by stage, from referral to exit, with the shortest path through a case. The bar also shows what is due: review dates and next steps the open forms hold, within two weeks or past.</p>')+
   fold('Saving, autosave and closing the tab',
     '<p><b>Save case</b> writes every open form and the student details into one file; <b>Open case</b> loads it back. Each form’s own <b>Save data</b> button still works on its own. The button above the form carries a dot while the case holds work not yet in a file and pulses after twenty minutes of it.</p>'+
     '<div class="warnbox"><b>Autosave</b> keeps a working copy on this computer, in this browser, and offers it back next time; it is a safety net, not the record. On an iPad the browser can drop a tab or clear its storage. Press the Autosave button to switch it off or clear it on a shared computer.</div>'+
     '<p>Work not in a saved case file is at risk when the window closes, so the browser asks first; a form opened on its own, outside the workstation, asks too.</p>')+
   fold('Printing and the PDF',
     '<p>Tick the forms this student needs and press <b>Build master print</b>: one document with a cover sheet and contents, each form on a new page. A ticked form you have not opened prints blank, and the workstation asks first. A PDF saved from the print window has no bookmark panel and no page numbers on its contents page; <b>Finish PDF</b> takes that file and returns one with both.</p>'+
     '<p><b>Copy for the BIP</b> on FS-1, TD-1, GB-1 and CR-1 puts the plan’s text on the clipboard for the district document; <b>Save graph as image</b> under a graph gives a picture for a report.</p>')+
   fold('Side by side, fullscreen and the screen',
     '<p><b>Side by side</b> shows two or three open forms as columns, each working on its own (OB-1, MT-1 and ABC-1 together for an observation). <b>Fullscreen</b> puts away the heading, the bar and the list; <kbd>Esc</kbd> brings them back. On a wide window the list can be hidden from its own corner. Once a student is loaded the bar folds to one line; <b>Edit details</b> opens it.</p>'+
     '<p>Every open form reports the student name it holds; if one differs from the bar, an amber strip names it before anything reaches paper.</p>')+
   fold('Keyboard',
     '<p><kbd>⌘K</kbd> (or <kbd>Ctrl K</kbd>) opens a box to jump to any form or run any command. <kbd>↑</kbd> and <kbd>↓</kbd> move between forms, <kbd>⌘S</kbd> saves the case, <kbd>⌘P</kbd> prints the open form, <kbd>⌘⇧P</kbd> builds the master print, <kbd>Ctrl⇧F</kbd> is fullscreen.</p>')+
   (EMBED?fold('The one-file edition',
     '<p>All 42 forms are inside this file. <b>Save case</b> writes the case as one file of its own, <i>Student.case.html</i>, which opens the workstation with the case already in it when you double-click it. Keep that file with the student’s records.</p>'):'')+
   '<div class="note">Each of the 42 forms also works on its own: open its file directly and it saves, opens and prints exactly as it does here. Nothing the workstation does changes the form files.</div>');
});

"""
s = s[:a] + HELP + s[b:]
rep('''/* side by side (v21.32): the chooser */''',
'''/* help (v21.35): short first, the rest folded */
#dlg .hp-lead{font-size:14px;color:var(--ink);margin:0 0 10px}
#dlg .hp-steps{margin:0 0 12px;padding-left:22px}#dlg .hp-steps li{margin:4px 0}
#dlg details{border:1px solid var(--rule);border-radius:6px;padding:6px 12px;margin:6px 0;background:#fff}
#dlg details[open]{background:var(--shade)}
#dlg summary{cursor:pointer;font-weight:600;color:var(--navy);padding:2px 0}
#dlg details p{margin:8px 0}
/* due (v21.35) */
.bar .due{color:#f3d9a4}.bar .due b{color:#ffd27a}.bar .due .late{color:#ffb4a0;font-weight:600}
/* side by side (v21.32): the chooser */''')

# ---- the due line: markup in the folded summary and the facts row
rep('''    <b id="sumName"></b><span id="sumDet"></span><span id="sumCase"></span>''',
'''    <b id="sumName"></b><span id="sumDet"></span><span id="sumCase"></span><span id="sumDue" class="due"></span>''')
rep('''    <span class="lbl">The case</span><span id="factsTxt" role="status" aria-live="polite"></span>''',
'''    <span class="lbl">The case</span><span id="factsTxt" role="status" aria-live="polite"></span><span id="factsDue" class="due"></span>''')
rep('''/* ================= save protection (v21.33) =================''',
'''/* ================= what is due (v21.35) =================
   Review dates and next steps sit on PR-1, SA-1, SM-1, ST-1, TE-1, RM-1, SV-1, GB-1 and CN-1 under their own
   names. Each form answers the facts? verb with a due list (the nbh-case block reads date fields whose label
   says review, target date, due or next, and CN-1 its open next steps); the shell gathers them from every
   open form when a form's values change, keeps the ones within DUE_DAYS or past, and shows them in the bar. */
const DUE_DAYS=14;
state.due=[];let dueTimer=null;
function parseDue(v){
  const t=String(v||'').trim();if(!t)return null;
  let m=/^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(t);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})$/.exec(t);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[1]-1,+m[2]);}
  const d=new Date(t);return isNaN(d)?null:d;
}
function dueText(d){
  const today=new Date();today.setHours(0,0,0,0);const n=Math.round((d-today)/86400000);
  const md=(d.getMonth()+1)+'/'+d.getDate();
  return n<0?md+' <span class="late">('+(-n)+(n===-1?' day':' days')+' overdue)</span>':n===0?md+' (today)':md+' (in '+n+(n===1?' day':' days')+')';
}
async function gatherDue(){
  const out=[];
  for(const id of Object.keys(state.frames)){
    const r=await grab(id,'facts?',null,3000),due=r&&r.facts&&r.facts.due;
    if(!Array.isArray(due))continue;
    due.forEach(x=>{const d=parseDue(x.date);if(!d)return;const n=Math.round((d-new Date().setHours(0,0,0,0))/86400000);if(n>DUE_DAYS)return;out.push({id,what:String(x.what||'').slice(0,60),d,n});});
  }
  out.sort((a,b)=>a.d-b.d);state.due=out;paintDue();
}
function paintDue(){
  const list=state.due.slice(0,4);
  const h=list.length?'<b>Due:</b> '+list.map(x=>esc(x.id)+' '+esc(x.what)+' '+dueText(x.d)).join(' \\u00b7 ')+(state.due.length>4?' \\u00b7 and '+(state.due.length-4)+' more':''):'';
  const a=$('#sumDue'),b=$('#factsDue');if(a)a.innerHTML=h;if(b)b.innerHTML=h;
}
function noteDue(){clearTimeout(dueTimer);dueTimer=setTimeout(gatherDue,1500);}

/* ================= save protection (v21.33) =================''')
rep('''    if(FACT_SRC[d.id])noteFactSource(d.id,d.status);   /* v21.31 the case */''',
'''    if(FACT_SRC[d.id])noteFactSource(d.id,d.status);   /* v21.31 the case */
    if(state.dueSig===undefined)state.dueSig={};const dsig=(d.status&&d.status.sig)||'';if(state.dueSig[d.id]!==dsig){state.dueSig[d.id]=dsig;noteDue();}   /* v21.35 due */''')
open(path, 'w', encoding='utf-8').write(s)
print('patched', path)
