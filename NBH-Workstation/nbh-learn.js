/* nbh-learn.js (v26.00): the map of the Learning page (learn.html), the workstation's place to study.
   (the BCBA, 11/13: "a place that goes over everything that a person who is studying to become a RBT can go and learn ...
   Also, a person studying to be a BCBA ... a full fledge curriculum space where the information that is already in the
   workstation can be pulled into as well as additional information and trainings that I present as well as videos";
   and, on whether the RBT track should count as the 40-hour training: "Yes, with me as the Responsible Trainer.")

   Two tracks.
   rbt   the RBT track, laid out as the BACB's RBT 2026 40-Hour Training Requirements and Curriculum Outline lays the
         training out: eight sections (A to H), each with its minimum hours (38 in all, and 2 more to place anywhere).
         Each section holds units; a unit names the tasks of the RBT Test Content Outline (3rd ed.) it teaches (codes),
         the minutes it plans (self: on the page; led: with the trainer), and what the workstation already has for it:
         v videos (keys of nbh-videos.js), x explainers (explain.html#key), p the counting practice, f forms (ids).
         w: 1 marks a unit whose lesson is written (the files nbh-learn-units*.js hold them). ready says whether the WHOLE training
         is in place: until it is true the page makes no certificate and does not carry the BACB's statement.
   bcba  the BCBA track, by the nine domains and 104 tasks of the BCBA Test Content Outline (6th ed.).

   The BACB's outlines are its copyright. This file holds the task CODES and short titles in the workstation's own
   words, never the BACB's statements; the page links to the BACB's documents for the wording.
   Nothing in this file is about a student or a learner. */
window.NBH_LEARN = {
  v: 1,
  rbt: {
    ready: false,
    total: 40,
    days: [5, 180],
    statement: 'This training program is designed to meet the 2026 training eligibility requirement for RBT certification. The training is offered independent of the BACB.',
    statementPages: 'This training program is designed to meet the 2026 training eligibility requirement for RBT certification. This training is offered independent of the BACB.',
    docs: [
      ['RBT 2026 40-Hour Training Requirements and Curriculum Outline', 'https://www.bacb.com/rbt/'],
      ['RBT Test Content Outline (3rd ed.)', 'https://www.bacb.com/wp-content/rbt-outline-3rdEd/'],
      ['RBT Handbook', 'https://www.bacb.com/rbt/'],
      ['RBT Ethics Code (2.0)', 'https://www.bacb.com/ethics-information/ethics-codes/']
    ],
    sections: [
      { k: 'A', name: 'Introduction to applied behavior analysis', min: 2, units: [
        { id: 'a1', t: 'What applied behavior analysis is, and what the service is for', codes: [], self: 15, led: 10, w: 1 },
        { id: 'a2', t: 'Behavior, what comes before it and what follows it', codes: ['A.5'], self: 20, led: 10, f: ['ABC-1'], w: 1 },
        { id: 'a3', t: 'Reinforcement: positive and negative, schedules and dimensions', codes: ['C.1'], self: 25, led: 10, f: ['SR-1'], w: 1 },
        { id: 'a4', t: 'Why behavior happens: the common functions', codes: ['D.1'], self: 20, led: 10, f: ['IA-1'], w: 1 },
        { id: 'a5', t: 'Asking, naming, repeating, answering: the verbal operants', codes: [], self: 15, led: 5, w: 1 },
        { id: 'a6', t: 'From baseline to maintenance: the phases of an intervention', codes: ['C.9'], self: 10, led: 5, f: ['DD-1'], w: 1 }
      ] },
      { k: 'B', name: 'Preparing for service delivery', min: 1, units: [
        { id: 'b1', t: 'Getting yourself ready: the plan, the last notes, the materials', codes: [], self: 20, led: 10, f: ['QS-1', 'EB-1'], w: 1 },
        { id: 'b2', t: 'Getting the student ready: rapport and assent', codes: [], self: 20, led: 15, f: ['SI-1'], w: 1 }
      ] },
      { k: 'C', name: 'Data collection and graphing', min: 3, units: [
        { id: 'c1', t: 'Describing behavior so two people would count the same thing', codes: ['A.5'], self: 20, led: 10, f: ['TB-1'], w: 1 },
        { id: 'c2', t: 'Why the data matter, and what unreliable data cost', codes: ['A.8'], self: 15, led: 5, p: 1, w: 1 },
        { id: 'c3', t: 'Continuous measurement: count, duration, latency, time between responses', codes: ['A.1'], self: 30, led: 15, p: 1, f: ['OB-1', 'DD-1'], w: 1 },
        { id: 'c4', t: 'Discontinuous measurement: partial interval, whole interval, momentary time sampling', codes: ['A.2'], self: 25, led: 10, f: ['MT-1'], w: 1 },
        { id: 'c5', t: 'Permanent products: measuring what the behavior leaves behind', codes: ['A.3'], self: 10, led: 5, w: 1 },
        { id: 'c6', t: 'Rate, mean duration, percentage: summarizing a session', codes: ['A.6'], self: 20, led: 5, w: 1 },
        { id: 'c7', t: 'Graphs: entering data, reading a trend, telling your supervisor', codes: ['A.4', 'A.7'], self: 20, led: 10, f: ['DD-1'], w: 1 }
      ] },
      { k: 'D', name: 'Assisting with behavior assessments', min: 3, units: [
        { id: 'd1', t: 'What each kind of assessment is for', codes: ['B.1', 'B.2', 'B.3'], self: 20, led: 10, w: 1 },
        { id: 'd2', t: 'Preference assessments: single items, pairs, arrays, free play', codes: ['B.1'], self: 35, led: 30, f: ['PA-1', 'RA-1'], w: 1 },
        { id: 'd3', t: 'Helping with skill assessments', codes: ['B.2'], self: 20, led: 15, f: ['SA-1'], w: 1 },
        { id: 'd4', t: 'Helping with functional assessment: ABC records, scatter plots, the analysis', codes: ['B.3'], self: 35, led: 20, f: ['ABC-1', 'OB-1', 'SP-1', 'EA-1'], w: 1 }
      ] },
      { k: 'E', name: 'Behavior-change interventions', min: 20, units: [
        { id: 'e1', t: 'Doing the plan as written: procedural integrity', codes: ['A.8'], self: 30, led: 20, f: ['TI-1'], w: 1 },
        { id: 'e2', t: 'Conditioned reinforcers, token economies and group rewards', codes: ['C.2', 'C.11'], self: 55, led: 35,
          v: ['token_build', 'token_schedules', 'token_running', 'gbg'], f: ['TK-1', 'GC-1'], w: 1 },
        { id: 'e3', t: 'Discrete-trial teaching', codes: ['C.3'], self: 50, led: 45, f: ['SA-1'], w: 1 },
        { id: 'e4', t: 'Naturalistic teaching: incidental teaching and teaching in the natural setting', codes: ['C.4'], self: 45, led: 40, w: 1 },
        { id: 'e5', t: 'Task analysis and chaining: forward, backward, total task', codes: ['C.5'], self: 60, led: 40,
          v: ['chain_forward', 'chain_backward', 'chain_hw_forward', 'chain_hw_backward', 'chain_hw_total'], w: 1 },
        { id: 'e6', t: 'Prompts and how to fade them', codes: ['C.7'], self: 55, led: 40, v: ['prompt_ltm', 'prompt_mtl', 'prompt_delay'], f: ['VS-1'], w: 1 },
        { id: 'e7', t: 'Discrimination training', codes: ['C.6'], self: 45, led: 35, w: 1 },
        { id: 'e8', t: 'Differential reinforcement: DRA, DRI, DRO, DRL and functional communication training', codes: ['D.3'], self: 80, led: 45, w: 1,
          v: ['dra_attention', 'dra_escape', 'dra_tangible', 'dra_automatic', 'dro_resetting', 'dro_class', 'dro_momentary', 'dro_tokens',
              'fct-practical-guide-thinning', 'fct_attention', 'fct_tangible', 'fct_thinning_mult',
              'drl_limit', 'drl_signal', 'drl_card'], x: ['dro', 'fct'], f: ['SR-1'] },
        { id: 'e9', t: 'Extinction and its side effects', codes: ['D.4', 'D.6'], self: 50, led: 35, v: ['ext_wait', 'ext_ignore', 'ext_kind'], w: 1 },
        { id: 'e10', t: 'Punishment and its side effects; interrupting and redirecting', codes: ['D.5', 'D.6'], self: 45, led: 30,
          v: ['rird_vocal', 'rird_motor', 'rird_pica'], w: 1 },
        { id: 'e11', t: 'Shaping', codes: ['C.10'], self: 40, led: 30, v: ['shape_work', 'shape_dist', 'shape_fast'], w: 1 },
        { id: 'e12', t: 'Antecedent interventions: reinforcement on a timer, easy requests first, choice, changes to the task', codes: ['D.2'], self: 85, led: 40,
          v: ['ncr_attention', 'ncr_items', 'ncr_work', 'ncr_between', 'a_highp', 'a_highp_praise', 'a_highp_class', 'a_highp_seatwork', 'a_highp_peer',
              'choice-academic-task-escape', 'ante_fade', 'ante_task', 'ante_mix', 'ee_match', 'ee_turn', 'ee_hands'], x: ['ncr'], p: 1, w: 1 },
        { id: 'e13', t: 'Generalization and maintenance', codes: ['C.8', 'C.9'], self: 40, led: 30, w: 1 },
        { id: 'e14', t: 'Self-monitoring', codes: [], self: 35, led: 25, f: ['SM-1'], w: 1 },
        { id: 'e15', t: 'Crisis and emergency procedures, and calming routines', codes: ['D.7'], self: 55, led: 45,
          v: ['calm_breath', 'calm_muscle', 'calm_plan'], f: ['CR-1'], w: 1 }
      ] },
      { k: 'F', name: 'Service delivery documentation and reporting', min: 3, units: [
        { id: 'f1', t: 'Confidentiality and the record: what the law and the workplace require', codes: ['E.4', 'F.5'], self: 30, led: 15, w: 1 },
        { id: 'f2', t: 'The session note: objective, accurate, on time', codes: ['E.4'], self: 35, led: 20, f: ['CN-1'], w: 1 },
        { id: 'f3', t: 'Reporting what could affect progress: illness, medication, schedule changes', codes: ['E.3'], self: 20, led: 10, w: 1 },
        { id: 'f4', t: 'Asking your supervisor, and passing on what the team tells you', codes: ['E.1', 'E.2'], self: 30, led: 20, w: 1 }
      ] },
      { k: 'G', name: 'Ethics and professionalism', min: 5, units: [
        { id: 'g1', t: 'The core principles and the RBT Ethics Code', codes: ['F.1'], self: 45, led: 25, w: 1 },
        { id: 'g2', t: 'Your role, your competence and your supervision', codes: ['F.2', 'F.3', 'F.4'], self: 40, led: 20, f: ['RS-1', 'ST-1'], w: 1 },
        { id: 'g3', t: 'Multiple relationships and gifts', codes: ['F.7', 'F.8'], self: 35, led: 20, w: 1 },
        { id: 'g4', t: 'Confidential information and public statements', codes: ['F.5', 'F.6'], self: 30, led: 15, w: 1 },
        { id: 'g5', t: 'Cultural humility and responsiveness', codes: ['F.10'], self: 30, led: 20, w: 1 },
        { id: 'g6', t: 'Professional conduct, feedback, and reporting misconduct', codes: ['F.9'], self: 30, led: 20, w: 1 }
      ] },
      { k: 'H', name: 'Next steps in the certification process', min: 1, units: [
        { id: 'h1', t: 'From this training to the examination', codes: [], self: 25, led: 10, w: 1 },
        { id: 'h2', t: 'Keeping the certification: supervision, statuses, self-reporting, renewal', codes: ['F.3'], self: 25, led: 10, f: ['RS-1'], w: 1 }
      ] }
    ],
    /* the RBT Test Content Outline (3rd ed.): domain, questions on the examination, and each task's code with a short title */
    tco: [
      { k: 'A', name: 'Data collection and graphing', q: 13, tasks: [['A.1', 'Continuous measurement'], ['A.2', 'Discontinuous measurement'], ['A.3', 'Permanent products'],
        ['A.4', 'Entering data and updating graphs'], ['A.5', 'Observable and measurable descriptions'], ['A.6', 'Calculating and summarizing data'],
        ['A.7', 'Trends in graphed data'], ['A.8', 'Risks of unreliable data and poor fidelity']] },
      { k: 'B', name: 'Behavior assessment', q: 8, tasks: [['B.1', 'Preference assessments'], ['B.2', 'Skill assessments'], ['B.3', 'Functional assessment']] },
      { k: 'C', name: 'Behavior acquisition', q: 19, tasks: [['C.1', 'Positive and negative reinforcement'], ['C.2', 'Conditioned reinforcers'], ['C.3', 'Discrete-trial teaching'],
        ['C.4', 'Naturalistic teaching'], ['C.5', 'Chaining'], ['C.6', 'Discrimination training'], ['C.7', 'Prompts and fading'], ['C.8', 'Generalization'],
        ['C.9', 'Maintenance and acquisition'], ['C.10', 'Shaping'], ['C.11', 'Token economies']] },
      { k: 'D', name: 'Behavior reduction', q: 14, tasks: [['D.1', 'Functions of behavior'], ['D.2', 'Antecedent interventions'], ['D.3', 'Differential reinforcement'],
        ['D.4', 'Extinction'], ['D.5', 'Punishment'], ['D.6', 'Side effects of extinction and punishment'], ['D.7', 'Crisis and emergency procedures']] },
      { k: 'E', name: 'Documentation and reporting', q: 10, tasks: [['E.1', 'Passing on the team’s concerns'], ['E.2', 'Seeking clinical direction'],
        ['E.3', 'Reporting variables that affect progress'], ['E.4', 'Objective session documentation']] },
      { k: 'F', name: 'Ethics', q: 11, tasks: [['F.1', 'Core principles'], ['F.2', 'Competence before service'], ['F.3', 'Ongoing supervision'], ['F.4', 'Effective supervision'],
        ['F.5', 'Confidential information'], ['F.6', 'Public statements'], ['F.7', 'Multiple relationships'], ['F.8', 'Gifts'], ['F.9', 'Interpersonal and professional skills'],
        ['F.10', 'Cultural humility and responsiveness']] }
    ]
  },
  bcba: {
    docs: [
      ['BCBA Test Content Outline (6th ed.)', 'https://www.bacb.com/wp-content/bcba-outline-6thEd/'],
      ['BCBA Handbook', 'https://www.bacb.com/bcba/'],
      ['Ethics Code for Behavior Analysts', 'https://www.bacb.com/ethics-information/ethics-codes/']
    ],
    /* domain, questions on the examination, tasks: [code, short title, what the workstation has: v families, x explainers, p practice, f forms] */
    domains: [
      { k: 'A', name: 'Behaviorism and philosophical foundations', q: 8, tasks: [
        ['A.1', 'The goals of the science: description, prediction, control'], ['A.2', 'The philosophical assumptions'], ['A.3', 'Radical behaviorism'],
        ['A.4', 'Behaviorism, the experimental analysis, applied behavior analysis, practice'], ['A.5', 'The dimensions of applied behavior analysis']] },
      { k: 'B', name: 'Concepts and principles', q: 24, tasks: [
        ['B.1', 'Behavior, response, response class'], ['B.2', 'Stimulus and stimulus class'], ['B.3', 'Respondent and operant conditioning'],
        ['B.4', 'Positive and negative reinforcement', { f: ['SR-1'] }], ['B.5', 'Positive and negative punishment'], ['B.6', 'Automatic and socially mediated contingencies', { f: ['EA-1'] }],
        ['B.7', 'Unconditioned, conditioned and generalized reinforcers', { v: ['token'] }], ['B.8', 'Unconditioned, conditioned and generalized punishers'],
        ['B.9', 'Simple schedules of reinforcement', { f: ['SR-1'], v: ['token'] }], ['B.10', 'Concurrent, multiple, mixed and chained schedules', { v: ['fct'], x: ['fct'], f: ['SR-1'] }],
        ['B.11', 'Operant and respondent extinction', { v: ['ext'] }], ['B.12', 'Stimulus control', { x: ['fct'] }], ['B.13', 'Stimulus discrimination'],
        ['B.14', 'Stimulus and response generalization'], ['B.15', 'Response maintenance'], ['B.16', 'Motivating operations', { v: ['ncr'], x: ['ncr'] }],
        ['B.17', 'Motivating operations and stimulus control compared'], ['B.18', 'Rule-governed and contingency-shaped behavior'], ['B.19', 'The verbal operants'],
        ['B.20', 'Multiple control in verbal behavior'], ['B.21', 'Emergent relations and generative performance'], ['B.22', 'Behavioral momentum and persistence', { v: ['highp'], f: ['RM-1'] }],
        ['B.23', 'The matching law and response allocation', { v: ['dra'] }], ['B.24', 'Imitation and observational learning']] },
      { k: 'C', name: 'Measurement, data display and interpretation', q: 21, tasks: [
        ['C.1', 'Operational definitions', { f: ['TB-1'] }], ['C.2', 'Direct, indirect and product measures', { f: ['IA-1', 'OB-1'] }], ['C.3', 'Measuring occurrence', { p: 1, f: ['OB-1'] }],
        ['C.4', 'Duration, latency, time between responses', { p: 1, f: ['OB-1'] }], ['C.5', 'Continuous and discontinuous measurement', { f: ['MT-1'] }],
        ['C.6', 'Interval recording and time sampling', { f: ['MT-1'] }], ['C.7', 'Measuring efficiency', { f: ['SA-1'] }], ['C.8', 'Validity and reliability of measurement', { p: 1 }],
        ['C.9', 'Choosing a measurement procedure', { f: ['TB-1', 'MT-1'] }], ['C.10', 'Graphing data', { f: ['DD-1'] }], ['C.11', 'Interpreting graphed data', { f: ['DD-1'] }],
        ['C.12', 'Measuring procedural integrity', { f: ['TI-1'] }]] },
      { k: 'D', name: 'Experimental design', q: 13, tasks: [
        ['D.1', 'Dependent and independent variables'], ['D.2', 'Internal and external validity'], ['D.3', 'Threats to internal validity'],
        ['D.4', 'The defining features of single-case designs'], ['D.5', 'Single-case and group designs compared'], ['D.6', 'Reading single-case data', { f: ['DD-1', 'EA-1'] }],
        ['D.7', 'Reversal, multiple-baseline, multielement, changing-criterion', { f: ['EA-1', 'DD-1'] }], ['D.8', 'Comparative, component and parametric analyses', { f: ['VI-1'] }],
        ['D.9', 'Applying single-case designs', { f: ['EA-1', 'VI-1'] }]] },
      { k: 'E', name: 'Ethical and professional issues', q: 22, tasks: [
        ['E.1', 'The core principles of the ethics codes'], ['E.2', 'The risks of unethical behavior'], ['E.3', 'Developing and keeping competence'],
        ['E.4', 'Confidential information', { f: ['IC-1'] }], ['E.5', 'Public statements'], ['E.6', 'Ending services, and handing over', { f: ['PR-1'] }],
        ['E.7', 'Multiple relationships'], ['E.8', 'Interpersonal skills and professional relationships'], ['E.9', 'Cultural humility', { f: ['CF-1'] }],
        ['E.10', 'Culturally responsive service and supervision', { f: ['CF-1', 'SV-1'] }], ['E.11', 'Personal biases'], ['E.12', 'Legal, regulatory and practice requirements', { f: ['IC-1'] }]] },
      { k: 'F', name: 'Behavior assessment', q: 23, tasks: [
        ['F.1', 'What the records hold at the start of a case', { f: ['RR-1', 'DM-1'] }], ['F.2', 'Cultural variables in assessment', { f: ['IN-1', 'CF-1'] }],
        ['F.3', 'Assessing skills', { f: ['SA-1'] }], ['F.4', 'Preference assessments', { f: ['PA-1', 'RA-1'] }], ['F.5', 'Descriptive assessments', { f: ['ABC-1', 'SP-1', 'OB-1'] }],
        ['F.6', 'Functional analyses', { f: ['EA-1', 'DA-1'] }], ['F.7', 'From the data to services or a referral', { f: ['FS-1'] }],
        ['F.8', 'From the data to goals and procedures', { f: ['FS-1', 'TD-1', 'GB-1'] }]] },
      { k: 'G', name: 'Behavior-change procedures', q: 25, tasks: [
        ['G.1', 'Positive and negative reinforcement procedures', { f: ['SR-1', 'TD-1'] }], ['G.2', 'Differential reinforcement, with and without extinction', { v: ['dra', 'dro', 'fct'], x: ['dro', 'fct'], f: ['TD-1'] }],
        ['G.3', 'Time-based schedules', { v: ['ncr'], x: ['ncr'], p: 1 }], ['G.4', 'Conditioned reinforcers and token economies', { v: ['token'], f: ['TK-1'] }],
        ['G.5', 'Motivating operations and discriminative stimuli in a procedure', { v: ['ncr', 'fct', 'ante', 'ee'] }], ['G.6', 'Simple and conditional discriminations'],
        ['G.7', 'Choosing prompting procedures', { v: ['prompt'] }], ['G.8', 'Fading prompts', { v: ['prompt'] }], ['G.9', 'Modeling', { f: ['ST-1'] }], ['G.10', 'Instructions and rules', { v: ['highp'] }],
        ['G.11', 'Shaping', { v: ['shape'] }], ['G.12', 'Chaining', { v: ['chain'] }], ['G.13', 'Trial-based and free-operant procedures', { f: ['SA-1'] }], ['G.14', 'Group contingencies', { v: ['group'], f: ['GC-1'] }],
        ['G.15', 'Promoting generalization'], ['G.16', 'Maintaining the change: thinning and natural reinforcers', { v: ['fct', 'token'], f: ['SR-1', 'RM-1'] }],
        ['G.17', 'Positive and negative punishment', { v: ['rird', 'token'] }], ['G.18', 'Emotional and elicited effects', { v: ['ext', 'calm'] }],
        ['G.19', 'Procedures for emergent relations']] },
      { k: 'H', name: 'Selecting and implementing interventions', q: 20, tasks: [
        ['H.1', 'Goals in observable and measurable terms', { f: ['GB-1'] }], ['H.2', 'Choosing interventions: assessment, evidence, preference, fit', { f: ['TD-1', 'CF-1', 'SI-1'] }],
        ['H.3', 'Choosing a socially valid alternative behavior', { v: ['fct', 'dra'], f: ['SV-1', 'TD-1'] }], ['H.4', 'Planning for unwanted effects', { v: ['ext'], f: ['TD-1', 'CR-1'] }],
        ['H.5', 'Planning for relapse', { f: ['RM-1'] }], ['H.6', 'Decisions from integrity data', { f: ['TI-1', 'PD-1'] }], ['H.7', 'Decisions from outcome data', { f: ['DD-1', 'PR-1'] }],
        ['H.8', 'Working with others', { f: ['CN-1', 'CT-1'] }]] },
      { k: 'I', name: 'Personnel supervision and management', q: 19, tasks: [
        ['I.1', 'What behavior-analytic supervision is good for', { f: ['RS-1'] }], ['I.2', 'Building the supervisory relationship', { f: ['RS-1'] }], ['I.3', 'Equity in supervision'],
        ['I.4', 'Choosing supervision goals', { f: ['RS-1', 'ST-1'] }], ['I.5', 'Performance management: model, practice, feedback', { f: ['ST-1', 'TV-1'] }],
        ['I.6', 'A function-based look at staff performance', { f: ['PD-1'] }], ['I.7', 'Deciding from the data whether supervision works', { f: ['TI-1', 'RS-1'] }]] }
    ]
  },
  /* the forms the map names: id, name (as the workstation's list has them) */
  forms: { 'ABC-1': 'ABC Recording and Conditional Probability', 'CF-1': 'Contextual Fit', 'CN-1': 'Consultation and Session Notes', 'CR-1': 'Crisis Plan and Debriefing',
    'CT-1': 'Caregiver Training', 'DA-1': 'Demand Assessment', 'DD-1': 'Daily Data and Visual Analysis', 'DM-1': 'Student Demographics and Profile', 'EA-1': 'Experimental Analysis',
    'EB-1': 'Essentials Brief for Limited-Contact Staff', 'FS-1': 'FBA Summary Report', 'GB-1': 'Goal and Objective Builder', 'GC-1': 'Group Contingencies and Class-Wide Systems',
    'IA-1': 'Indirect Functional Assessment', 'IC-1': 'Informed Consent', 'IN-1': 'Stakeholder Interviews', 'MT-1': 'Discontinuous Measurement', 'OB-1': 'Direct Observation Record',
    'PA-1': 'Preference Assessment', 'PD-1': 'Performance Diagnostic Checklist', 'PR-1': 'Periodic Review and Exit', 'QS-1': 'Staff Quick Start', 'RA-1': 'Reinforcer Assessment',
    'RM-1': 'Relapse and Inoculation', 'RR-1': 'Records Review', 'RS-1': 'RBT Supervision Log', 'SA-1': 'Skill Acquisition Data', 'SI-1': 'Student Interview, Assent and Treatment Preference',
    'SM-1': 'Self-Monitoring and Point Systems', 'SP-1': 'Scatter Plot', 'SR-1': 'Schedules of Reinforcement', 'ST-1': 'Staff Training and Competency', 'SV-1': 'Social Validity',
    'TB-1': 'Target Behavior Development', 'TD-1': 'Function-Based Treatment Developer', 'TI-1': 'Treatment Integrity', 'TK-1': 'Token Board Book', 'TV-1': 'Training Video',
    'VI-1': 'Variable Isolation', 'VS-1': 'Visual Supports and Communication Boards' },
  explainers: { dro: 'DRO, resetting', fct: 'FCT: green and red', ncr: 'NCR: attention on a timer' }
};
