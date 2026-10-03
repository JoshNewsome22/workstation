#!/usr/bin/env python3
"""The case map (v21.31): one page in the workstation that says which form when, from referral to exit,
what carries forward between them, and the shortest path through a case. Idempotent."""
import sys
path = sys.argv[1]
src = open(path, encoding='utf-8').read()
if 'id="caseMap"' in src:
    print('already'); sys.exit(0)
def rep(old, new, count=1):
    global src
    assert src.count(old) == count, (old[:60], src.count(old))
    src = src.replace(old, new)

rep("""    <span class="pair"><button id="diag">Diagnostics</button>
    <button id="help">Help</button></span>""",
    """    <span class="pair"><button id="caseMap" title="Which form when, from referral to exit, and what carries forward between them">Case map</button>
    <button id="diag">Diagnostics</button>
    <button id="help">Help</button></span>""")
rep("dialog tr:nth-child(even) td{background:#fafcfb}",
    """dialog tr:nth-child(even) td{background:#fafcfb}
/* the case map (v21.31) */
.cm-lead{color:var(--muted);margin:0 0 10px}
.cm-stage{display:grid;grid-template-columns:34px 1fr;gap:4px 12px;padding:10px 0;border-top:1px solid var(--rule)}
.cm-stage:first-of-type{border-top:0}
.cm-n{width:30px;height:30px;border-radius:50%;background:var(--navy);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px;grid-row:span 3}
.cm-stage h3{margin:0;font-family:var(--serif);font-size:15px;color:var(--navy)}
.cm-when{margin:0;color:var(--muted);font-size:12.5px}
.cm-forms{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 0}
.cm-forms button{font:inherit;font-size:12px;padding:4px 9px 4px 7px;border:1px solid var(--rule2);border-radius:999px;background:#fff;color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1.3;text-align:left}
.cm-forms button b{font-family:var(--mono,ui-monospace,monospace);font-size:11px;color:var(--navy);background:var(--mist);border-radius:999px;padding:1px 6px}
.cm-forms button:hover{border-color:var(--navy);background:var(--shade)}
.cm-forms button.on{border-color:#3f7a56;background:#eef7f1}
.cm-forms button.on b{background:#d6ead9;color:#1f6b4a}
.cm-forms button i{font-style:normal;color:var(--muted)}
.cm-box{border:1px solid var(--rule);border-radius:8px;padding:10px 14px;margin:12px 0 0;background:var(--shade)}
.cm-box h3{margin:0 0 6px;font-family:var(--serif);font-size:14.5px;color:var(--navy)}
.cm-box ul{margin:0;padding-left:18px}
.cm-box li{margin:2px 0}
.cm-path{font-size:12.5px;line-height:1.7}
.cm-path b{font-family:var(--mono,ui-monospace,monospace);font-size:11.5px;color:var(--navy);background:var(--mist);border-radius:999px;padding:1px 6px;white-space:nowrap}""")
rep("  {k:'diagnostics check files',n:'Diagnostics',s:'command',go:()=>$('#diag').click()},",
    "  {k:'case map which form when walkthrough',n:'Case map: which form when',s:'command',go:()=>$('#caseMap').click()},\n  {k:'diagnostics check files',n:'Diagnostics',s:'command',go:()=>$('#diag').click()},")
rep("""$('#help').addEventListener('click',()=>{
  dialog('How this works',""",
    r"""/* ================= the case map (v21.31) =================
   One page that says which form when. The stages are the order a school FBA and BIP actually run
   in; the forms inside a stage are listed in the order they are usually reached, and any of them
   can be skipped when the case does not need it. A button opens the form (and marks the ones
   already open). The box underneath says what the workstation carries from one form to the next,
   so nothing is typed twice, and the last line is the shortest defensible path through a case. */
const CASE_MAP=[
 ['Before anything','The referral is received; nothing is assessed until consent is on file.',
  [['DM-1','who the student is, services, team, contacts'],['IC-1','informed consent for the FBA and the BIP; assent is planned on SI-1'],['RR-1','what the records already say: history, prior plans, medical, discipline']]],
 ['Define what is being assessed','In the first days. The targets defined here carry to every other form.',
  [['TB-1','candidates to targets: definitions, examples, clusters, replacement'],['SI-1','the student’s own account, assent plan, treatment preference'],['IN-1','teacher, parent and staff interviews'],['IA-1','indirect functional assessment instruments, scored and compared']]],
 ['Observe and measure','Across the first one to two weeks; DD-1 starts the baseline that runs for the rest of the case.',
  [['OB-1','direct observation record'],['ABC-1','ABC recording and conditional probabilities'],['SP-1','scatter plot: when and where it happens'],['MT-1','discontinuous measurement when counting is not possible'],['DD-1','daily data and the graph: baseline, then treatment']]],
 ['Test what you think','When the descriptive data leave the function open, or the stakes call for it; reinforcers are assessed here either way.',
  [['EA-1','experimental (functional) analysis and its variants'],['VI-1','isolate one variable'],['DA-1','which demands, when escape is the hypothesis'],['PA-1','preference assessment: the ranked menu carries forward'],['RA-1','confirm the preferred items reinforce']]],
 ['Conclude','One report, with the hypothesis, what was ruled out, and what would change the conclusion.',
  [['FS-1','FBA summary report: the function carries forward']]],
 ['Plan','Function first, then goals, then the components the case needs; contextual fit before anyone is trained.',
  [['TD-1','function-based treatment: antecedent, teaching, consequence, crisis'],['GB-1','goals and objectives: they carry forward'],['CF-1','contextual fit with the people who will run it'],['SV-1','social validity before (and again after)'],['SA-1','skill-acquisition data for the replacement skill'],['SM-1','self-monitoring, point systems, behavioral contract'],['SR-1','the schedule of reinforcement, designed and thinned'],['TE-1','token economy'],['GC-1','class-wide and group contingencies'],['VS-1','visual supports and communication boards'],['CR-1','crisis plan and debriefing, when the behavior is dangerous'],['DT-1','delay tolerance'],['AD-1','accumulated or distributed reinforcement'],['BC-1','behavioral contrast across settings'],['MS-1','medication side effects, when medication changes']]],
 ['Train and run it','Before the start date, then every week.',
  [['ST-1','staff training to competency (BST)'],['EB-1','the one-page brief for limited-contact staff'],['CT-1','caregiver training'],['HD-1','home data sheets the family keeps'],['TI-1','treatment integrity, observed'],['PD-1','when integrity is low: why, and what fixes it'],['CN-1','every consultation, visit and call, logged']]],
 ['Review and exit','At each review date, and whenever the graph says so.',
  [['PR-1','periodic review: continue, change, fade, exit'],['RM-1','relapse mitigation and inoculation before fading'],['SV-1','social validity after'],['DD-1','the graph decides']]]
];
function caseMapHtml(){
  const f=(id,why)=>`<button type="button" class="${state.frames[id]?'on':''}" data-open="${id}" title="Open Form ${id}"><b>${id}</b><span>${esc((ALL.find(x=>x[0]===id)||[,id])[1])}</span><i>&middot; ${esc(why)}</i></button>`;
  return '<p class="cm-lead">Which form when, from referral to exit. Any form can be skipped when the case does not need it; a button opens the form. The ones already open are marked.</p>'+
    CASE_MAP.map((s,i)=>`<div class="cm-stage"><div class="cm-n">${i+1}</div><h3>${esc(s[0])}</h3><p class="cm-when">${esc(s[1])}</p><div class="cm-forms">${s[2].map(x=>f(x[0],x[1])).join('')}</div></div>`).join('')+
    '<div class="cm-box"><h3>What carries forward on its own</h3><ul>'+
    '<li><b>The student’s details</b> on the packet bar go into every form as it opens, into empty fields only.</li>'+
    '<li><b>The target behaviors</b> defined on TB-1 go to every form that holds a behavior: the tables on DD-1, HD-1, FS-1, GB-1 and SM-1, and the behavior line on OB-1, ABC-1, MT-1, SA-1, SR-1, DA-1, CN-1, TD-1, TI-1 and the rest. Rename one on TB-1 and the others follow.</li>'+
    '<li><b>The function</b> concluded on FS-1 goes to every function field; <b>the goals</b> written on GB-1 to SA-1, SM-1, CN-1 and the aims on DD-1; <b>the reinforcer menu</b> ranked on PA-1 to SM-1, SA-1 and SR-1.</li>'+
    '<li><b>The plan</b> on TD-1 (baseline, criteria, replacement) goes to GB-1 and EB-1; PR-1 reads the graph on DD-1 and ST-1 reads the integrity scores on TI-1 when they are open.</li>'+
    '<li>Everything above fills empty fields and empty tables only. <b>From the case</b>, on each form’s toolbar, lets you pick any of it into a form that already has entries. The case travels in the packet and case files.</li></ul></div>'+
    '<div class="cm-box"><h3>The shortest defensible path</h3><p class="cm-path"><b>DM-1</b> → <b>IC-1</b> → <b>TB-1</b> → <b>IA-1</b> + <b>OB-1</b> or <b>ABC-1</b> (and <b>DD-1</b> baseline) → <b>FS-1</b> → <b>TD-1</b> → <b>GB-1</b> → <b>CF-1</b> → <b>ST-1</b> → <b>DD-1</b> + <b>TI-1</b> → <b>PR-1</b>. '+
    'Add <b>SI-1</b> whenever the student can be interviewed, <b>EA-1</b> when the function is still open, <b>PA-1</b> before any reinforcement-based component, and <b>CR-1</b> the moment the behavior is dangerous.</p></div>';
}
$('#caseMap').addEventListener('click',()=>dialog('The case, start to finish',caseMapHtml()));
$('#dlgBody').addEventListener('click',e=>{const b=e.target.closest('button[data-open]');if(!b)return;$('#dlg').close();openForm(b.dataset.open);});

$('#help').addEventListener('click',()=>{
  dialog('How this works',""")
rep("""   '<p><b>The student packet.</b> Fill the bar at the top once.""",
    """   '<p><b>Which form when.</b> <b>Case map</b> in the bar is one page that lists the forms stage by stage, from referral to exit, with the shortest path through a case and what the workstation carries from one form to the next.</p>'+
   '<p><b>The case.</b> The target behaviors (Form TB-1), the function (Form FS-1), the goals (Form GB-1) and the reinforcer menu (Form PA-1) are read from those forms while they are open and go into every other open form, into empty fields and empty behavior tables only; the line under the packet bar shows what has been read. <b>From the case</b>, on each form’s toolbar, lets you pick any of it into a form that already has entries. They are saved in the packet and case files.</p>'+
   '<p><b>The student packet.</b> Fill the bar at the top once.""")
open(path, 'w', encoding='utf-8').write(src)
print('case map added')
