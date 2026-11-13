#!/usr/bin/env python3
"""grade-evidence.py: one plain rubric over what each card of Form TD-1's bank says of its own evidence.

It reads each card's note and result (the words a person reads on the card), not the study, and writes a three-letter
field `ev` on the card. Form TD-1 turns the letters into points and into the sentence it shows.

  ev[0] design     c  the card reports a comparison that shows the procedure made the change (a return to baseline,
                      a staggered start, alternated conditions, a control group)                          2 points
                   n  the card does not say                                                                1
                   u  the card says the report had no such comparison (a case example, before and after)   0
                   t  described, not tested: the source reports no data                                    0
  ev[1] students   3  six or more                                                                          2
                   2  two to five                                                                          1
                   1  one                                                                                  0
                   0  the card does not say                                                                0
  ev[2] setting    s  in a school or a classroom                                                           2
                   e  children or teenagers somewhere else (a clinic, a home, a hospital)                  1
                   n  the card does not say                                                                1
                   a  adults                                                                               0
                   t  not tested                                                                           0
  studies          the number of studies the card names (its src list): one 0, two 1, three or more 2

The sum is 0 to 8. The reading is by rule, so it can be wrong on a card; `evidence-overrides.json` beside this file
holds corrections by card id ({"card-id": "c2s"}) and wins over the rule.

usage: grade-evidence.py REPO            print the counts, change nothing
       grade-evidence.py REPO --write    write `ev` on every card of NBH-Workstation/nbh-td1-bank.js
       grade-evidence.py REPO --check    exit 1 unless every card carries the `ev` this tool would give it
       grade-evidence.py REPO --show ID  print how one card was read
"""
import json, os, re, sys, collections

NUM = {'single': 1, 'one': 1, 'two': 2, 'both': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8,
       'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
       'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50}
LEARN = (r'(?:\d{1,2}-(?:year|month)-olds?|students?|children|child|boys?|girls?|men|man|women|woman|participants?|'
         r'learners?|teenagers?|teens?|adolescents?|preschoolers?|toddlers?|infants?|babies|residents?|clients?|pupils?|'
         r'kindergartners?|youths?|people|persons|individuals?|patients?|siblings|twins|undergraduates|graders|adults?|'
         r'brothers?|sisters?|sons?|daughters?|players|athletes|swimmers|gymnasts|workers|employees|trainees|inmates|'
         r'veterans|speakers|readers|drivers|shoppers|customers)')
STAFF = (r'(?:teachers?|staff(?: members)?|parents?|mothers?|fathers?|caregivers?|aides?|paraprofessionals?|therapists?|'
         r'tutors?|technicians?|instructors?|coaches|supervisors?|nurses|interventionists?|practitioners?|assistants?|'
         r'counselors?|clinicians?|trainers?|couples|families|dyads|pairs|triads)')
W = '|'.join(NUM)
N = r'(\d{1,4}(?:,\d{3})?|' + W + r')'
# up to three describing words may stand between the number and the noun ("four typically developing preschool
# students"); none of them may be a word that starts another phrase ("30 days two students")
STOP = ('of|or|to|per|at|in|for|with|a|the|when|whenever|while|after|before|across|except|extra|group|comparison|'
        'criterion|was|were|is|are|by|from|than|if|as|that|which|who|where|because|but|so|on|into|over|under|between|'
        'during|until|then|each|every|all|both|some|most|more|less|fewer|only|about|weeks?|days?|months?|years?|hours?|'
        'sessions?|trials?|times|points?|steps?|words?|min|minutes?|s|sec|seconds?|percent|items?|sets?|targets?|tasks?|'
        'skills?|phases?|probes?|tests?|visits?|meals?|periods?|blocks?|one|two|three|four|five|six|seven|eight|nine|'
        'ten|\\d+')
GAP = r"(?: (?!(?:" + STOP + r")\b)[A-Za-z\-'’]+){0,3}?"
DID = ('learned|reached|met|showed|kept|improved|mastered|gained|completed|needed|began|increased|scored|acquired|'
       'passed|preferred|chose|responded|answered|finished|maintained|generalized|generalised|already')

UNTESTED = re.compile(
    r'(?:described|presented)(?: step by step)?,? (?:but )?not (?:tested|evaluated)|not tested in this (?:article|paper|tutorial)|'
    r'practice tutorial|no data were collected|no data are reported|reports? no (?:learner |student |outcome )?data|'
    r'no learners? (?:was|were) studied|no (?:learner )?outcome data|no learner data|'
    r'described this procedure but did not test it|is a tutorial|discussion paper|described procedure without data|'
    r'how-to guidance only|tutorial with no new data', re.I)
UNCTRL = re.compile(
    r'uncontrolled|case (?:example|study|report|series|illustration|description)|\bA-?B[- ](?:type|design)|AB-type|'
    r'retrospective|record review|chart review|pre-?post|pretest[- ]posttest only|consecutive[- ]case|'
    r'program (?:description|evaluation)|descriptive (?:study|report|data)|anecdot|no experimental (?:control|design)|'
    r'not experimentally|without a (?:control|comparison|baseline)|no baseline|demonstration only|'
    r'clinical (?:report|demonstration|example)|illustrative', re.I)
NAMED = re.compile(r'multiple[- ]baseline|ABAB|alternating|multi-?element|randomi[sz]ed|control group', re.I)
CTRL = re.compile(
    r'multiple[- ]baseline|multiple[- ]probe|(?<!no )(?<!without a )(?<!without )reversal|withdrawal design|\bABAB?\b|'
    r'\bABCAC?\b|alternating[- ]treatments?|multi-?element|changing[- ]criterion|randomi[sz]ed|randomly assigned|'
    r'control group|comparison group|control class|counterbalanced|concurrent[- ]chains|return(?:ed|ing)? to baseline|'
    r'returned when|came back when|rose again when|'
    r'when (?:it|they|the \w+|\w+) (?:was|were) (?:removed|withdrawn|stopped|taken away|discontinued)|reinstat|'
    r'staggered|across (?:settings|behaviors|classrooms|classes|skills|tasks|sets)|component analysis|compared with|'
    r'comparison|versus|\bvs\b|than with|than in baseline|group design|experimental design|single-case design', re.I)
SCHOOL = re.compile(
    r'class(?:room|es)?\b|\bschools?\b|preschool (?:class|program|room|setting)|kindergarten (?:class|room)|head start|'
    r'recess|playground|cafeteria|lunchroom|resource room|special[- ]education|day ?care|child ?care|after-school|'
    r'summer (?:school|program|camp)|\bgym\b|\bPE\b|homeroom|study hall|school bus|learning center|'
    r'early[- ]intervention (?:class|program)|day program|day school|nursery|'
    r'teachers? (?:ran|used|delivered|carried|implemented)|run by (?:the |their )?(?:classroom )?teachers?', re.I)
OTHER = re.compile(
    r'clinic|hospital|inpatient|outpatient|residential|institution|\bward\b|group home|at home|in the home|'
    r'their homes?|his home|her home|home-based|homes\b|university (?:room|lab|laborator|clinic|center)|laborator|'
    r'therapy room|treatment room|session room|padded room|research room|telehealth|video call|community|store|'
    r'workplace|workshop|job site|nursing home|facility|center\b|centre\b|unit\b|camp\b|pool\b', re.I)
CLINIC = re.compile(r'clinic|hospital|inpatient|residential|laborator|institution', re.I)
# what follows these words is advice for the reader's school, not an account of where the study was done
ADVICE = re.compile(
    r'not (?:with )?(?:school|K-to-grade)|rather than (?:in )?(?:a |the )?(?:school|class)|'
    r'for (?:PE|a school|school|high school|secondary|elementary)|'
    r'for (?:a|an|the) (?:younger |older )?(?:K-to-grade|school|classroom|student)|generali[sz]ation to|'
    r'carry(?:ing)? (?:it |the \w+ )?(?:over |into )|no (?:test|follow-up|data|probe)s? (?:at|in)|not tested (?:at|in)|'
    r'use it (?:in|at|for)|in a classroom,|at school,? (?:use|plan|check|start|keep)|check (?:use|that)|'
    r'so (?:plan|check|use|keep|build)|to school or home|home or school|school or home', re.I)
GROWN = re.compile(
    r'\b(?:adults?|men|man|women|woman|undergraduates?|college|university (?:students?|volunteers)|graduate students?|'
    r'employees|workers|elderly|older adults|veterans|inmates|residents|patients|drivers|shoppers|customers)\b', re.I)
CHILD = re.compile(
    r'\b(?:students?|children|child|boys?|girls?|preschoolers?|toddlers?|infants?|teenagers?|teens?|adolescents?|pupils?|'
    r'kindergartners?|graders|youths?|\d{1,2}-year-old|year-olds?|first-grade|second-grade|third-grade|elementary|'
    r'middle[- ]school|high[- ]school)\b', re.I)
OPENS = r'(?:Evidence|The evidence|Studied|Small|Old|Weak|Tested)'


def val(w):
    w = w.lower().replace(',', '')
    return NUM.get(w) or (int(w) if w.isdigit() else None)


def plain(txt):
    """Grade bands and age bands are not counts of people."""
    txt = re.sub(r'\b(?:pre-?)?K[-–]\s?\d{1,2}\b', 'K-to-grade', txt)
    txt = re.sub(r'\b\d+(?:st|nd|rd|th)[- ]grade', 'grade', txt)
    return re.sub(r'\b\d{1,2}[-–]\d{1,2} (?=student)', '', txt)


def counts(txt):
    """Every count of people in a text: (kind, number, the words, where). L learners, S staff or families,
    A 'all four learned', O 'three of four students'."""
    out = []
    txt = plain(txt)
    for kind, noun in (('L', LEARN), ('S', STAFF)):
        for m in re.finditer(r'\b' + N + GAP + ' ' + noun + r'\b', txt, re.I):
            v = val(m.group(1))
            if v and not (1900 <= v <= 2030 and m.group(1).isdigit()):
                out.append((kind, v, m.group(0), m.start()))
    for m in re.finditer(r'\b(?:all|each of the|both)(?: (' + W + r'))?\b(?= (?:' + DID + r')\b)|\bfor all (' + W + r')(?=[,.;:])', txt, re.I):
        g = m.group(1) or m.group(2)
        v = val(g) if g else (2 if m.group(0).lower().startswith('both') else None)
        if v:
            out.append(('A', v, m.group(0), m.start()))
    for m in re.finditer(r'\b' + N + r' of (?:the |all )?' + N + r'\b(?: (' + LEARN + r'))', txt, re.I):
        v = val(m.group(2))
        if v:
            out.append(('O', v, m.group(0), m.start()))
    return out


def clauses(t):
    return [x.strip() for x in re.split(r'(?<=[.;:!?])\s+', t) if x.strip()]


def sentences(t):
    return [x.strip() for x in re.split(r'(?<=[.!?])\s+', t) if x.strip()]


def read(p):
    """How one card was read: a dict with the three letters and what they rest on."""
    note = plain(p.get('note') or '')
    res = p.get('result') or ''
    both = note + ' ' + res
    L = [x for x in counts(note) + counts(res) if x[0] in 'LAO']
    S = [x for x in counts(note) + counts(res) if x[0] == 'S']
    untested = bool(UNTESTED.search(both)) and not re.search(r'\b(?:all|both|each)\b[^.]{0,40}(?:learned|reached|mastered|improved)', res, re.I)

    # students: the note's own statement of the evidence first ("Evidence is three boys at one program"), with
    # "one girl and four boys" added up; else the largest count of learners anywhere in the note or the result
    lead = None
    for i, sn in enumerate(clauses(note)):
        if i == 0 or re.match(OPENS, sn):
            cc = sorted([x for x in counts(sn) if x[0] in 'LO'], key=lambda x: x[3])
            cc = [x for x in cc if len(sn[:x[3]].split()) <= 8 and not re.search(r'[,;]', sn[:x[3]])
                  and not re.match(r"['’]s\b| per\b| each\b", sn[x[3] + len(x[2]):])]
            if cc:
                tot, end = cc[0][1], cc[0][3] + len(cc[0][2])
                for y in sorted([x for x in counts(sn) if x[0] == 'L'], key=lambda x: x[3]):
                    if y[3] >= end and not y[2].lower().startswith('both') and re.fullmatch(r'[^.;:]{0,45}?(?:,|\band\b)\s+', sn[end:y[3]]):
                        tot += y[1]
                        end = y[3] + len(y[2])
                lead = (tot, sn)
                break
    if untested:
        n = None
    elif lead:
        n = lead[0]
    elif L:
        n = max(x[1] for x in L)
    elif S:
        n = max(x[1] for x in S)
    else:
        n = None

    # design
    if untested:
        d = 't'
    elif UNCTRL.search(both) and not NAMED.search(both):
        d = 'u'
    elif CTRL.search(both):
        d = 'c'
    else:
        d = 'n'

    # setting: from the sentences that speak of the evidence, with the advice cut away
    evs = [s for s in sentences(note) if counts(s) or re.match(r'(?:Evidence|Studied|Small|Weak|Old|Tested|The evidence|This is|A |An |One |Two |Three |Four |Five |Six |Seven |Eight |Nine |Ten |\d)', s)]
    cut = ' '.join(re.split(ADVICE, s)[0] for s in clauses(' '.join(evs) + ' ' + res))
    sch, oth = SCHOOL.search(cut), OTHER.search(cut)
    top = max(L, key=lambda x: x[1])[2] if L else ''
    first = (clauses(note) or [''])[0]
    who = (lead[1] if lead else '') or top or cut
    who = re.split(ADVICE, who)[0]
    grownups = lambda t: re.sub(r'(?:college|university|graduate|undergraduate|postgraduate|adult)(?: \w+)? (?:students?|learners?|volunteers?|players|men|women)', 'adults', t, flags=re.I)
    who, first = grownups(who), grownups(re.split(ADVICE, first)[0])
    grown = bool(GROWN.search(who)) and not CHILD.search(who)
    if not grown and not lead:
        grown = bool(re.match(r'(?:Studied (?:only )?with |Tested with |Evidence is |Participants were )?(?:\w+ ){0,3}?(?:adults?|college|university|undergraduates?)\b', first, re.I)) and not CHILD.search(first)
    if untested:
        s = 't'
    elif grown:
        s = 'a'
    elif sch and not (oth and oth.start() < sch.start() and CLINIC.search(oth.group(0))):
        s = 's'
    elif oth:
        s = 'e'
    else:
        s = 'n'
    nb = 0 if n is None else 1 if n <= 1 else 2 if n <= 5 else 3
    return {'ev': d + str(nb) + s, 'n': n, 'lead': lead[1] if lead else '', 'counts': [x[2] for x in L + S]}


def points(ev, k):
    return {'c': 2, 'n': 1}.get(ev[0], 0) + {'3': 2, '2': 1}.get(ev[1], 0) + (0 if k <= 1 else 1 if k == 2 else 2) + {'s': 2, 'e': 1, 'n': 1}.get(ev[2], 0)


def main():
    repo = sys.argv[1]
    f = os.path.join(repo, 'NBH-Workstation', 'nbh-td1-bank.js')
    t = open(f, encoding='utf-8', newline='').read()
    a = t.index('const TD1_BANK=') + len('const TD1_BANK=')
    b = t.rindex('};') + 1
    B = json.loads(t[a:b])
    over = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evidence-overrides.json'), encoding='utf-8'))['cards']
    ids = {p['id'] for p in B['protocols']}
    gone = [k for k in over if k not in ids]
    assert not gone, 'overrides for cards not in the bank: %r' % gone
    assert all(re.fullmatch(r'[cnut][0-3][seant]', v) for v in over.values()), 'an override is not three letters of the rubric'
    if '--show' in sys.argv:
        p = [x for x in B['protocols'] if x['id'] == sys.argv[sys.argv.index('--show') + 1]][0]
        r = read(p)
        print(json.dumps(r, indent=1, ensure_ascii=False))
        print('override:', over.get(p['id']), '| points:', points(over.get(p['id']) or r['ev'], len(p.get('src') or [])))
        return
    want = {p['id']: over.get(p['id']) or read(p)['ev'] for p in B['protocols']}
    if '--check' in sys.argv:
        bad = [p['id'] for p in B['protocols'] if p.get('ev') != want[p['id']]]
        print('evidence letters: %d cards, %d not as the tool gives them' % (len(want), len(bad)))
        for x in bad[:20]:
            print('  ', x)
        sys.exit(1 if bad else 0)
    C = collections.Counter()
    P = collections.Counter()
    for p in B['protocols']:
        e = want[p['id']]
        C['design ' + e[0]] += 1
        C['students ' + e[1]] += 1
        C['setting ' + e[2]] += 1
        P[points(e, len(p.get('src') or []))] += 1
    print(len(want), 'cards;', len(over), 'by correction')
    print(' '.join('%s=%d' % x for x in sorted(C.items())))
    print('points:', ' '.join('%d:%d' % x for x in sorted(P.items())))
    if '--write' in sys.argv:
        for p in B['protocols']:
            p['ev'] = want[p['id']]
        open(f, 'w', encoding='utf-8', newline='').write(t[:a] + json.dumps(B, ensure_ascii=False, separators=(',', ':')) + t[b:])
        print('written')


if __name__ == '__main__':
    main()
