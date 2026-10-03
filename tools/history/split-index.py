#!/usr/bin/env python3
"""Side by side (v21.32): two or three open forms shown at once in the workstation shell. Idempotent."""
import sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()
if 'id="splitBtn"' in s:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (old[:70], s.count(old))
    s = s.replace(old, new)

# the button in the crumb bar, before Fullscreen
rep('''        <button id="fullBtn" class="sm" aria-pressed="false"''',
'''        <button id="splitBtn" class="sm" aria-pressed="false" aria-label="Side by side: two or three forms at once" title="Side by side: show two or three open forms at once"><svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="5.5" height="11" rx="1"/><rect x="9" y="2.5" width="5.5" height="11" rx="1"/></svg><span class="lbl">Side by side</span></button>
        <button id="fullBtn" class="sm" aria-pressed="false"''')
# the pane bar between the crumb and the frames
rep('''    <div class="frames" id="frames">''',
'''    <div id="paneBar" role="group" aria-label="Forms side by side"></div>
    <div class="frames" id="frames">''')
# styles
rep('''.frames iframe[hidden]{display:none}''',
'''.frames iframe[hidden]{display:none}
/* ---- side by side (v21.32): the open frames become equal columns; the pane bar names each one ---- */
#paneBar{display:none}
body.ws-split #paneBar{display:flex;align-items:stretch;background:var(--shade);border-bottom:1px solid var(--rule)}
#paneBar .pane{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:6px;padding:4px 8px;font-size:12px;color:var(--muted);border-left:1px solid var(--rule);cursor:pointer}
#paneBar .pane:first-child{border-left:0}
#paneBar .pane b{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:var(--navy);background:var(--mist);border-radius:999px;padding:1px 7px;flex:0 0 auto}
#paneBar .pane .nm{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink)}
#paneBar .pane.cur{background:#fff;box-shadow:inset 0 -2px 0 var(--navy)}
#paneBar .pane button{font-size:11.5px;padding:3px 8px;flex:0 0 auto}
body.ws-split .frames{display:flex;align-items:stretch}
body.ws-split .frames iframe{position:static;flex:1 1 0;min-width:0;height:auto;border-left:1px solid var(--rule)}
body.ws-split .frames iframe[hidden]{display:none}
@media (max-width:900px){
  body.ws-split .frames{flex-direction:column}
  body.ws-split .frames iframe{border-left:0;border-top:1px solid var(--rule);min-height:0}
}''')
# openForm: in a side-by-side view a form opened from the list takes a column
rep('''  state.cur=id;
  if(!keepRail) setRail(false);
  document.body.classList.add('has-form');
  Object.values(state.frames).forEach(fr=>fr.hidden=true);''',
'''  const prevCur=state.cur;   /* v21.32 side by side */
  state.cur=id;
  if(!keepRail) setRail(false);
  document.body.classList.add('has-form');
  Object.values(state.frames).forEach(fr=>fr.hidden=true);''')
rep('''  fr.hidden=false;
  $('#crumbTitle').textContent=rec[1];
  $('#crumbId').textContent='Form '+id;
  $('#crumbFile').textContent=rec[2];''',
'''  fr.hidden=false;
  $('#crumbTitle').textContent=rec[1];
  $('#crumbId').textContent='Form '+id;
  $('#crumbFile').textContent=rec[2];
  /* v21.32 side by side: a form opened while two or three are showing takes a column (a third column
     while there is room, else the column of the form that was current) */
  if(splitOn()){
    if(!state.split.includes(id)){
      const k=state.split.indexOf(prevCur);
      if(state.split.length<3)state.split.push(id); else state.split[k>=0?k:state.split.length-1]=id;
    }
    layoutFrames();
  }''')
# close: the closed form leaves the side-by-side view; what remains stays
rep('''  const fr=state.frames[state.cur];
  if(fr){fr.remove();delete state.frames[state.cur];}
  delete state.status[state.cur];
  state.cur=null;$('#blank').style.display='';''',
'''  const fr=state.frames[state.cur];
  if(fr){fr.remove();delete state.frames[state.cur];}
  delete state.status[state.cur];
  const rest=state.split.filter(x=>x!==state.cur);state.split=[];   /* v21.32 side by side */
  state.cur=null;$('#blank').style.display='';''')
rep('''  $('#crumbFile').textContent='';clearTimeout(state.watch);
  renderRail();
});
$('#popOut').addEventListener('click',()=>{''',
'''  $('#crumbFile').textContent='';clearTimeout(state.watch);
  renderRail();
  if(rest.length){openForm(rest[0],true);setSplit(rest);}   /* v21.32 side by side */
});
$('#popOut').addEventListener('click',()=>{''')
# the mode itself
rep('''/* ---------------- packet ---------------- */
function packet(){''',
'''/* ================= side by side (v21.32) =================
   Every open form already sits in its own frame and stays loaded, so showing two or three at once
   is a layout: the chosen frames become equal columns (stacked on a narrow screen), with a pane bar
   above naming each one. state.split holds the ids in column order and is empty when one form shows.
   The current form (state.cur) is the one the crumb's own buttons act on: it follows a click in the
   pane bar or focus inside a frame. A form opened from the list while the view is split takes a
   column; closing one leaves the others. Fullscreen works the same way over the columns. The order
   of a case is unchanged: nothing here touches what the forms hold. */
state.split=[];
function splitOn(){return state.split.length>1;}
function layoutFrames(){
  const on=splitOn();
  document.body.classList.toggle('ws-split',on);
  Object.entries(state.frames).forEach(([id,fr])=>{
    const show=on?state.split.includes(id):id===state.cur;
    fr.hidden=!show;fr.style.order=on?String(state.split.indexOf(id)):'';
  });
  $('#paneBar').innerHTML=on?state.split.map(id=>{const rec=ALL.find(f=>f[0]===id);
    return '<div class="pane'+(id===state.cur?' cur':'')+'" data-pane="'+id+'"><b>'+esc(id)+'</b><span class="nm">'+esc(rec?rec[1]:id)+'</span>'+
      '<button type="button" class="sm" data-pane-print="'+id+'" title="Print this form">Print</button>'+
      '<button type="button" class="sm" data-pane-close="'+id+'" title="Take this form out of the side-by-side view (it stays open)" aria-label="Take Form '+esc(id)+' out of the side-by-side view">&times;</button></div>';}).join(''):'';
  if(on){$('#crumbTitle').textContent='Side by side';$('#crumbId').textContent=state.split.map(x=>'Form '+x).join(' \\u00b7 ');$('#crumbFile').textContent='';}
  const b=$('#splitBtn');b.setAttribute('aria-pressed',String(on));b.querySelector('.lbl').textContent=on?'Side by side: '+state.split.length:'Side by side';
}
function setSplit(ids){
  const want=(ids||[]).filter((id,i,a)=>state.frames[id]&&a.indexOf(id)===i).slice(0,3);
  state.split=want.length>1?want:[];
  if(splitOn()&&!state.split.includes(state.cur))state.cur=state.split[0];
  layoutFrames();
  if(!splitOn()&&state.cur)openForm(state.cur,true);
  renderRail();
  say(splitOn()?'Side by side: '+state.split.map(x=>'Form '+x).join(', '):'One form at a time');
}
$('#splitBtn').addEventListener('click',()=>{
  const open=ALL.map(f=>f[0]).filter(id=>state.frames[id]);
  if(open.length<2){alert('Open a second form first: pick it from the list, then press Side by side. Two or three open forms can show at once, each with its own timer, counts and save.');return;}
  const checked=splitOn()?state.split:[state.cur].filter(Boolean);
  dialog('Side by side',
    '<p>Tick two or three of the open forms. They show as columns, each working on its own; a form opened from the list while the view is split takes a column. For an observation, OB-1, MT-1 and ABC-1 together let the narrative, the interval sample and the ABC record run from one screen.</p>'+
    '<div class="sb-list">'+open.map(id=>{const rec=ALL.find(f=>f[0]===id);return '<label class="sb-row"><input type="checkbox" value="'+id+'"'+(checked.includes(id)?' checked':'')+'> <b>'+esc(id)+'</b> '+esc(rec[1])+'</label>';}).join('')+'</div>'+
    '<p class="sb-note" id="sbNote"></p>'+
    '<p><button type="button" class="primary" id="sbGo">Show side by side</button> '+(splitOn()?'<button type="button" id="sbOne">Back to one form</button>':'')+'</p>');
  const note=()=>{const n=Array.from(document.querySelectorAll('#dlgBody .sb-row input:checked')).length;$('#sbNote').textContent=n<2?'Tick at least two.':n>3?'At most three fit: untick one.':n+' forms will show side by side.';$('#sbGo').disabled=n<2||n>3;};
  note();Array.from(document.querySelectorAll('#dlgBody .sb-row input')).forEach(c=>c.addEventListener('change',note));
  $('#sbGo').addEventListener('click',()=>{const ids=Array.from(document.querySelectorAll('#dlgBody .sb-row input:checked')).map(c=>c.value);$('#dlg').close();setSplit(ids);});
  const one=$('#sbOne');if(one)one.addEventListener('click',()=>{$('#dlg').close();setSplit([]);});
});
$('#paneBar').addEventListener('click',e=>{
  const pr=e.target.closest('[data-pane-print]'),cl=e.target.closest('[data-pane-close]'),pn=e.target.closest('.pane');
  if(pr){state.cur=pr.dataset.panePrint;layoutFrames();renderRail();$('#printOne').click();return;}
  if(cl){const id=cl.dataset.paneClose;const rest=state.split.filter(x=>x!==id);if(state.cur===id)state.cur=rest[0]||id;setSplit(rest);return;}
  if(pn){state.cur=pn.dataset.pane;layoutFrames();renderRail();}
});
/* focus moving into one of the columns makes that form the current one */
window.addEventListener('blur',()=>{setTimeout(()=>{
  if(!splitOn())return;const a=document.activeElement;if(!a||a.tagName!=='IFRAME')return;
  const id=Object.keys(state.frames).find(k=>state.frames[k]===a);
  if(id&&id!==state.cur){state.cur=id;layoutFrames();renderRail();}
},0);});

/* ---------------- packet ---------------- */
function packet(){''')
# dialog styles for the chooser
rep('''/* the case map (v21.31) */''',
'''/* side by side (v21.32): the chooser */
.sb-list{display:flex;flex-direction:column;gap:2px;margin:6px 0 8px}
.sb-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--rule);border-radius:6px;cursor:pointer}
.sb-row b{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;color:var(--navy);background:var(--mist);border-radius:999px;padding:1px 7px}
.sb-note{color:var(--muted);margin:0 0 8px}
/* the case map (v21.31) */''')
# palette and help
rep('''  {k:'fullscreen focus only the form',n:'Fullscreen: only the form',s:'view',go:()=>setFull(!fullOn())},''',
'''  {k:'fullscreen focus only the form',n:'Fullscreen: only the form',s:'view',go:()=>setFull(!fullOn())},
  {k:'side by side two three forms split columns at once',n:'Side by side: two or three forms at once',s:'view',go:()=>$('#splitBtn').click()},''')
rep('''   '<p><b>The screen.</b> <b>Fullscreen</b>, above an open form,''',
'''   '<p><b>Side by side.</b> With two or more forms open, <b>Side by side</b> above the form shows two or three of them as columns, each working on its own: for an observation, OB-1, MT-1 and ABC-1 together put the narrative, the interval sample and the ABC record on one screen. A form opened from the list takes a column; the small bar above the columns names each one, prints it, or takes it out of the view.</p>'+
   '<p><b>The screen.</b> <b>Fullscreen</b>, above an open form,''')
open(path, 'w', encoding='utf-8').write(s)
print('patched', path)
