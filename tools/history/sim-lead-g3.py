import re
LEAD='Load simulation (toolbar) fills the form with a worked example; nothing in it is a real student record. '
files=['PD-1_Performance-Diagnostic-Checklist_v2026-09','RM-1_Relapse-Mitigation-Behavioral-Inoculation_v2026-09','PR-1_Periodic-Plan-Review_v2026-09','CR-1_Crisis-Intervention-Plan_v2026-09','CT-1_Caregiver-Training_v2026-09','Delay-Tolerance-Protocol-Toolkit','TE-1_Token-Economy-Designer_v2026-09','BC-1_Behavioral-Contrast_v2026-09']
for f in files:
    p='NBH-Workstation/'+f+'.html'; s=open(p,encoding='utf-8').read()
    m=re.search(r'(About the simulation</h[23]>\s*<p[^>]*>)(Simulated )',s)
    assert m and len(re.findall(r'About the simulation</h[23]>',s))==1,p
    s=s[:m.end(1)]+LEAD+s[m.end(1):]
    open(p,'w',encoding='utf-8').write(s); print('lead',f)
