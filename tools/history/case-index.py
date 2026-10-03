#!/usr/bin/env python3
"""The case in the workstation shell (v21.31): read the facts from TB-1, FS-1, GB-1 and PA-1, carry them in
the packet and case files, and hand them to every open form. Idempotent."""
import sys
path = sys.argv[1]
src = open(path, encoding='utf-8').read()
if 'the case: facts that flow between forms' in src:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global src
    assert src.count(old) == count, (old[:60], src.count(old))
    src = src.replace(old, new)

rep("const REPLY={snapshot:'snapshot',restore:'restored',collect:'payload'};",
    "const REPLY={snapshot:'snapshot',restore:'restored',collect:'payload','facts?':'facts-out',facts:'facts-applied'};")
rep("""  if(d.nbh==='pong'||d.nbh==='status'){
    state.status[d.id]=d.status;""",
    """  if(d.nbh==='pong'||d.nbh==='status'){
    state.status[d.id]=d.status;
    if(FACT_SRC[d.id])noteFactSource(d.id,d.status);   /* v21.31 the case */""")
rep("} else if(d.nbh==='payload'||d.nbh==='snapshot'||d.nbh==='restored'){",
    "} else if(d.nbh==='payload'||d.nbh==='snapshot'||d.nbh==='restored'||d.nbh==='facts-out'||d.nbh==='facts-applied'){")
rep("fr.addEventListener('load',()=>{ fr.dataset.loaded='1'; setTimeout(()=>{ pushPacketTo(fr); ask(fr,'status'); },500); });",
    "fr.addEventListener('load',()=>{ fr.dataset.loaded='1'; setTimeout(()=>{ pushPacketTo(fr); ask(fr,'status'); },500); setTimeout(()=>pushFactsTo(fr),1100); });")
rep("""  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'PACKET',rev:'2026-09',
    saved:new Date().toISOString(),packet:p},null,1)],{type:'application/json'}));""",
    """  a.href=URL.createObjectURL(new Blob([JSON.stringify({form:'PACKET',rev:'2026-09',
    saved:new Date().toISOString(),packet:p,facts:state.facts||undefined},null,1)],{type:'application/json'}));""")
rep("""    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
    Object.values(state.frames).forEach(pushPacketTo);
  }catch(err){alert('That file could not be read as a student packet.');}};""",
    """    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
    Object.values(state.frames).forEach(pushPacketTo);
    if(d.facts)setFacts(d.facts,true);   /* v21.31 the case travels in the packet file */
  }catch(err){alert('That file could not be read as a student packet.');}};""")
rep("const data={form:'CASE',rev:'2026-09',id,saved:new Date().toISOString(),packet:p,forms};",
    "const data={form:'CASE',rev:'2026-09',id,saved:new Date().toISOString(),packet:p,forms,facts:state.facts||undefined};")
rep("{form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:p,forms},null,1)],",
    "{form:'CASE',rev:'2026-09',saved:new Date().toISOString(),packet:p,forms,facts:state.facts||undefined},null,1)],")
rep("""    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
  }
  const ids=Object.keys(d.forms),notes=[];""",
    """    $('#pSite').value=p.site||'';$('#pBcba').value=p.bcba||'';who();
  }
  if(d.facts)setFacts(d.facts,false); else setFacts(null,false);   /* v21.31 the case */
  const ids=Object.keys(d.forms),notes=[];""")
rep("""  Object.values(state.frames).forEach(pushPacketTo);
  setTimeout(()=>Object.values(state.frames).forEach(fr=>ask(fr,'status')),400);""",
    """  Object.values(state.frames).forEach(pushPacketTo);
  gatherFacts(true);   /* v21.31 the case goes with the details */
  setTimeout(()=>Object.values(state.frames).forEach(fr=>ask(fr,'status')),400);""")
rep("""    <button id="pushPacket" title="Send these details to every form you have open">Fill open forms</button>
  </div>""",
    """    <button id="pushPacket" title="Send these details to every form you have open">Fill open forms</button>
  </div>
  <!-- v21.31 the case: what the shell has read from Forms TB-1, FS-1, GB-1 and PA-1, carried to every open form -->
  <div class="grp facts" id="factsRow" hidden>
    <span class="lbl">The case</span><span id="factsTxt" role="status" aria-live="polite"></span>
    <button id="factsSend" class="sm" title="Read the target behaviors, function, goals and reinforcer menu from the forms that hold them and send them to every open form">Send to open forms</button>
  </div>""")
rep(".bar .grp{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap}",
    ".bar .grp{display:flex;gap:8px 10px;align-items:center;flex-wrap:wrap}\n.bar .facts{font-size:12px;color:#cfe0dd;line-height:1.4}.bar .facts .lbl{font-weight:600;color:#fff;letter-spacing:.02em}.bar .facts b{color:#fff;font-weight:600}.bar .facts i{font-style:normal;color:#9fb6bd}")
BLOCK = r"""
/* ================= the case: facts that flow between forms (v21.31) =================
   The target behaviors are defined once, on Form TB-1; the function is concluded on Form FS-1, the
   goals written on Form GB-1 and the reinforcer menu ranked on Form PA-1. Every other form used to
   have them typed in again. The shell now reads them from whichever of those four forms is open
   (the facts? verb, answered from the form's own structure), keeps them as one object, state.facts,
   and hands it to every open form (the facts verb), where it fills empty fields and empty behavior
   tables and nothing else; each form's toolbar also gets a "From the case" button to pick from.
   Sources are re-read whenever their value signature changes (the status every form reports), so a
   target renamed on TB-1 reaches the other forms within a few seconds. The facts travel in the
   packet and case files, so they survive the session; a source form that is not open keeps its
   last reading. */
const FACT_SRC={'TB-1':'behaviors','FS-1':'fn','GB-1':'goals','PA-1':'menu'};
state.facts=null;state.factsSig='';state.factSrcSig={};
let factsTimer=null,factsBusy=false,factsAgain=false;
function noteFactSource(id,st){
  const sig=(st&&st.sig)||'';
  if(state.factSrcSig[id]===sig)return;
  state.factSrcSig[id]=sig;
  clearTimeout(factsTimer);factsTimer=setTimeout(()=>gatherFacts(true),900);
}
function hasFacts(f){return !!(f&&((f.behaviors||[]).length||(f.fn&&(f.fn.key||f.fn.label))||
  (f.goals&&((f.goals.red||[]).length||(f.goals.acq||[]).length))||(f.menu||[]).length));}
function factsSig(f){return f?JSON.stringify([f.behaviors,f.fn,f.goals,f.menu]):'';}
async function gatherFacts(push){
  if(factsBusy){factsAgain=true;return;}
  factsBusy=true;
  try{
    const f=Object.assign({},state.facts||{});f.src=Object.assign({},f.src||{});
    const drop=k=>{delete f[k];delete f.src[k];};
    for(const id of Object.keys(FACT_SRC)){
      if(!state.frames[id])continue;
      const r=await grab(id,'facts?',null,4000),out=(r&&r.facts)||null;
      if(id==='TB-1'){if(out&&out.behaviors){f.behaviors=out.behaviors;f.src.behaviors='TB-1';}else if(f.src.behaviors==='TB-1')drop('behaviors');}
      if(id==='FS-1'){
        if(out&&out.fn){f.fn=out.fn;f.src.fn='FS-1';}else if(f.src.fn==='FS-1')drop('fn');
        if(out&&out.behaviorsFS&&f.src.behaviors!=='TB-1'){f.behaviors=out.behaviorsFS;f.src.behaviors='FS-1';}
        else if(f.src.behaviors==='FS-1'&&!(out&&out.behaviorsFS))drop('behaviors');
      }
      if(id==='GB-1'){if(out&&out.goals){f.goals=out.goals;f.src.goals='GB-1';}else if(f.src.goals)drop('goals');}
      if(id==='PA-1'){if(out&&out.menu){f.menu=out.menu;f.src.menu='PA-1';}else if(f.src.menu)drop('menu');}
    }
    const sig=factsSig(f);
    if(sig!==state.factsSig){
      state.factsSig=sig;f.when=new Date().toISOString();
      state.facts=hasFacts(f)?f:null;paintFacts();
      if(push)pushFactsToAll();
    }
  }finally{factsBusy=false;if(factsAgain){factsAgain=false;setTimeout(()=>gatherFacts(push),300);}}
}
function setFacts(f,push){state.facts=hasFacts(f)?f:null;state.factsSig=factsSig(state.facts);paintFacts();if(push)pushFactsToAll();}
function pushFactsTo(fr){if(!state.facts||!fr)return;ask(fr,'facts',{facts:state.facts});}
function pushFactsToAll(){Object.values(state.frames).forEach(pushFactsTo);}
function paintFacts(){
  const row=$('#factsRow'),t=$('#factsTxt');if(!row)return;
  const f=state.facts;row.hidden=!f;if(!f)return;
  const s=f.src||{},bits=[];
  if((f.behaviors||[]).length)bits.push('<b>Target behaviors:</b> '+esc(f.behaviors.map(b=>b.label).join(', '))+' <i>('+esc(s.behaviors||'')+')</i>');
  if(f.fn&&(f.fn.label||f.fn.key))bits.push('<b>Function:</b> '+esc(f.fn.label||f.fn.key)+' <i>('+esc(s.fn||'')+')</i>');
  const g=f.goals||{},nr=(g.red||[]).length,na=(g.acq||[]).length;
  if(nr||na)bits.push('<b>Goals:</b> '+[nr?nr+' reduction':'',na?na+' acquisition':''].filter(Boolean).join(', ')+' <i>('+esc(s.goals||'')+')</i>');
  if((f.menu||[]).length)bits.push('<b>Reinforcers:</b> '+esc(f.menu.slice(0,4).map(m=>m.name).join(', '))+(f.menu.length>4?' and '+(f.menu.length-4)+' more':'')+' <i>('+esc(s.menu||'')+')</i>');
  t.innerHTML=bits.join(' &nbsp;&middot;&nbsp; ');
}
$('#factsSend').addEventListener('click',async()=>{
  const open=Object.keys(FACT_SRC).filter(id=>state.frames[id]);
  await gatherFacts(false);
  if(!state.facts){
    alert(open.length?'Nothing to send yet: '+open.map(x=>'Form '+x).join(', ')+' hold'+(open.length===1?'s':'')+' no target behavior, function, goal or reinforcer yet.'
                     :'Open Form TB-1, FS-1, GB-1 or PA-1 first: the case is read from them.');
    return;
  }
  pushFactsToAll();
  const n=Object.keys(state.frames).length;
  alert('Sent to '+n+' open form'+(n===1?'':'s')+'. Empty fields and empty behavior tables take them; anything already typed is left alone. The “From the case” button on each form’s toolbar lets you pick more.');
});

/* ---------------- messages back from forms ---------------- */"""
rep("\n/* ---------------- messages back from forms ---------------- */", BLOCK)
open(path, 'w', encoding='utf-8').write(src)
print('patched', path)
