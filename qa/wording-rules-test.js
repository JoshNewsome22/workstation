#!/usr/bin/env node
/* qa/wording-rules-test.js (v21.43): offline checks of the wording checker's rules. Node only, no browser.

   Every text goes through tools/blocks/nbh-wording-rules.json the way the panel does it: with the client's own
   engine (tools/blocks/nbh-wording.js, run in a node vm with a stub window, so its compile and check code is the
   code under test) and with a line-for-line port of that engine (the cross-check, and the fallback when the client
   file is missing). The panel matches each rule ignoring case, keeps whole-word matches only, and skips a match
   that lies wholly inside straight (") or curly (“ ”) double quotes; a quotation left open ends with its line.

   1. shape: the documented keys, unique ids, known categories, flags only i/m/s/u, a one-sentence why and suggest,
      nothing the patch script refuses ("</script", "<!--", a model ID), no lookbehind, named group or \p{} (older
      iPad Safari), no empty match, $n replacements that name a group the pattern has;
   2. samples (WORDING_SAMPLES, the first argument, the scratchpad's wording/samples.json, or the copy at the end of
      this file): the rule ids found against the ids expected, precision and recall; no finding may touch a
      sample's "clear" phrases (the must-not-fire parts);
   3. units: every rule fires on its own examples and not on its near misses;
   4. clean text: objective notes, OB-1's simulated narrative among them, give no finding at all;
   5. robustness: the same findings when every pattern is wrapped in \b(?:...)\b (a client that adds its own word
      boundaries sees the same thing); replacements expand cleanly and do not set off their own rule again; every
      pattern runs fast on the patch script's long test strings and on a 4000-character note;
   6. the client's engine and the port agree on every text.

   usage: node qa/wording-rules-test.js [samples.json] [--verbose]      exit code 1 on any failure
          --verbose also lists every rule example with what it found; WORDING_RULES, WORDING_CLIENT and
          WORDING_SAMPLES point the test at other files (a fixture, a missing client to test the port alone). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const RULES_PATH = process.env.WORDING_RULES || path.join(ROOT, 'tools/blocks/nbh-wording-rules.json');
const CLIENT_PATH = process.env.WORDING_CLIENT || path.join(ROOT, 'tools/blocks/nbh-wording.js');
const OB1_PATH = path.join(ROOT, 'NBH-Workstation/OB-1_Direct-Observation-Record_v2026-09.html');
const SCRATCH_SAMPLES = '/tmp/claude-0/-home-user-workstation/a594d6f7-62f1-54d7-9995-1b00e09a61cc/scratchpad/wording/samples.json';
const ARGS = process.argv.slice(2), VERBOSE = ARGS.includes('--verbose');
const CATS = ['internal', 'intent', 'label', 'frequency', 'duration', 'intensity', 'medical', 'character'];

let failures = 0, notes = 0;
const fail = (sec, msg) => { failures++; console.log('  FAIL ' + (sec ? '[' + sec + '] ' : '') + msg); };
const note = msg => { notes++; console.log('  note ' + msg); };
const head = t => console.log('\n' + t);

/* ------------------------------------------------------------------ the port of the client's engine
   Mirrors compile(), quoteSpans(), expand(), fitCase(), finding(), check() and applyAt() in nbh-wording.js. opts.wrap
   wraps each pattern in \b(?:...)\b, which a rule must not need. */
function makeEngine(raw, opts) {
  opts = opts || {};
  const str = v => v == null ? '' : String(v);
  let WORDCH;
  try { WORDCH = new RegExp('[\\p{L}\\p{N}_]', 'u'); }
  catch (e) { WORDCH = /[A-Za-z0-9_À-ɏͰ-ϿЀ-ӿ]/; }
  const isW = c => !!c && WORDCH.test(c);
  const rules = [], bad = [], seen = {};
  ((raw && raw.rules) || []).forEach((r, i) => {
    const id = r && r.id != null ? String(r.id) : 'rule ' + (i + 1);
    if (!r || typeof r.re !== 'string' || !r.re || seen[id]) { bad.push(id); return; }
    let fl = 'gi';
    str(r.flags).replace(/[^msu]/g, '').split('').forEach(f => { if (fl.indexOf(f) < 0) fl += f; });
    let re;
    try { re = new RegExp(opts.wrap ? '\\b(?:' + r.re + ')\\b' : r.re, fl); } catch (e) { bad.push(id); return; }
    re.lastIndex = 0;
    if (re.test('')) { bad.push(id); return; }
    re.lastIndex = 0;
    seen[id] = 1;
    rules.push({id, cat: str(r.cat), re, why: str(r.why), suggest: str(r.suggest), replace: typeof r.replace === 'string' ? r.replace : null});
  });
  const BLANKRULE = {id: 'blank', cat: 'blank', why: '', suggest: '', replace: null};
  const BLANK = /\[[^\[\]\n]{1,48}\]/g, OURS = /^\[(?:student|id|name \d{1,2})\]$/i;
  function quoteSpans(t) {
    const spans = []; let open = -1, kind = '';
    for (let i = 0; i < t.length; i++) {
      const c = t.charAt(i);
      if (open < 0) {
        if (c === '“') { open = i; kind = 'c'; } else if (c === '«') { open = i; kind = 'g'; } else if (c === '"') { open = i; kind = 's'; }
      } else if ((kind === 'c' && c === '”') || (kind === 'g' && c === '»') || (kind === 's' && c === '"')) { spans.push([open, i + 1]); open = -1; }
      else if (c === '\n') { spans.push([open, i]); open = -1; }
    }
    if (open >= 0) spans.push([open, t.length]);
    return spans;
  }
  const expand = (tpl, m) => tpl.replace(/\$(\$|&|[1-9])/g, (all, k) => k === '$' ? '$' : k === '&' ? m[0] : str(m[+k]));
  function fitCase(rep, orig) {
    if (!rep) return rep;
    const a = orig.charAt(0), b = orig.charAt(1), r = rep.charAt(0);
    if (a !== a.toLowerCase() && (!b || b === b.toLowerCase()) && r !== r.toUpperCase()) return r.toUpperCase() + rep.slice(1);
    return rep;
  }
  function finding(r, t, s, e, m) {
    const f = {id: r.id, cat: r.cat, start: s, end: e, text: t.slice(s, e), why: r.why, suggest: r.suggest, replacement: null};
    if (r.replace != null) { const rep = fitCase(expand(r.replace, m), f.text); if (rep !== f.text) f.replacement = rep; }
    return f;
  }
  function check(text) {
    const t = str(text), q = quoteSpans(t), out = [];
    const quoted = (s, e) => q.some(p => s >= p[0] && e <= p[1]);
    rules.forEach(r => {
      const re = r.re; re.lastIndex = 0; let m, n = 0;
      while ((m = re.exec(t)) !== null) {
        if (++n > 400) break;
        const s = m.index, e = s + m[0].length;
        if (e === s) { re.lastIndex = s + 1; continue; }
        if ((isW(t.charAt(s)) && isW(t.charAt(s - 1))) || (isW(t.charAt(e - 1)) && isW(t.charAt(e)))) { re.lastIndex = s + 1; continue; }
        if (quoted(s, e)) continue;
        out.push(finding(r, t, s, e, Array.prototype.slice.call(m)));
      }
      re.lastIndex = 0;
    });
    BLANK.lastIndex = 0; let b;
    while ((b = BLANK.exec(t)) !== null) if (!OURS.test(b[0])) out.push(finding(BLANKRULE, t, b.index, b.index + b[0].length, [b[0]]));
    out.sort((a, c) => a.start - c.start || c.end - a.end);
    const seenK = {};
    return out.filter(f => { const k = f.start + ':' + f.end + ':' + f.cat; if (seenK[k]) return false; seenK[k] = 1; return true; });
  }
  function applyAt(t, f) {
    let a = t.slice(0, f.start), b = t.slice(f.end);
    const rep = str(f.replacement);
    if (!rep) {
      a = a.replace(/[ \t]+$/, ''); b = b.replace(/^[ \t]+/, '');
      if (a && b && !/\n$/.test(a) && !/^[\n,.;:!?)\]]/.test(b)) a += ' ';
    }
    return {text: a + rep + b, at: a.length, len: rep.length};
  }
  return {check, applyAt, quoteSpans, rules, bad};
}

/* ------------------------------------------------------------------ the client itself, in a vm */
function loadClient(raw) {
  if (!fs.existsSync(CLIENT_PATH)) return {api: null, why: 'tools/blocks/nbh-wording.js is not there'};
  const noop = () => {};
  const el = () => ({style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, attachShadow: () => el()});
  const document = {readyState: 'loading', addEventListener: noop, removeEventListener: noop, querySelector: () => null,
    querySelectorAll: () => [], getElementById: () => null, createElement: el, createTextNode: () => ({}),
    documentElement: {style: {}}, head: {appendChild: noop}, body: null};
  const win = {nbhWordingRules: raw, nbhWordingConfig: {relay: ''}, document, addEventListener: noop, removeEventListener: noop,
    location: {href: 'http://127.0.0.1:8123/NBH-Workstation/OB-1.html', origin: 'http://127.0.0.1:8123', protocol: 'http:', hostname: '127.0.0.1'},
    navigator: {userAgent: 'node'}, sessionStorage: {getItem: () => null, setItem: noop, removeItem: noop},
    matchMedia: () => ({matches: false, addEventListener: noop, addListener: noop}), console, setTimeout, clearTimeout};
  win.window = win; win.self = win;
  try {
    const ctx = vm.createContext(win);
    vm.runInContext(fs.readFileSync(CLIENT_PATH, 'utf8'), ctx, {filename: 'nbh-wording.js', timeout: 5000});
    const api = ctx.nbhWording;
    if (!api || typeof api.check !== 'function') return {api: null, why: 'the client did not expose nbhWording.check'};
    return {api, why: ''};
  } catch (e) { return {api: null, why: 'the client did not load in node: ' + String(e.message || e).slice(0, 200)}; }
}

/* ------------------------------------------------------------------ per-rule examples: [fires, must not fire] */
const UNITS = {
  'int-angry': [["He got angry when the timer rang.", "She was mad at her brother.", "He was furious and annoyed."], ["She played Angry Birds for 2 minutes.", "The class did Mad Libs.", "He attends anger management group on Tuesdays.", "He pointed to the angry icon on the emotion scale.", "He pointed to mad on his feelings chart."]],
  'int-upset': [["He became upset when the iPad was removed.", "She was upset.", "The change upset him.", "He was upset that his mom left.", "She was upset this morning.", "The noise upset the teacher."], ["He upset the tray of paint.", "She upset her cup of milk.", "Mom reported an upset stomach.", "What helps you calm down when you are upset?", "He upset the paint tray with his elbow.", "She upset that tall stack of blocks."]],
  'int-frustrated': [["He was frustrated with the puzzle.", "Frustration built during math."], ["Goal: increase frustration tolerance during math."]],
  'int-anxious': [["She was anxious before the test.", "He seemed scared of the dog.", "He was worried about the bus."], ["Records list an anxiety disorder.", "The science unit covered the nervous system."]],
  'int-happy': [["She was happy during recess.", "He smiled happily.", "He was proud of his drawing."], ["He earned a happy face.", "The class sang Happy Birthday.", "Each interval she circled a happy or sad face.", "He earned a happy rating on his card."]],
  'int-sad': [["He was sad after lunch.", "She looked depressed."], ["She pointed to the sad face on the feelings chart.", "He depressed the button 3 times."]],
  'int-bored': [["He was bored during the video.", "She seemed unmotivated."], ["He bored a hole in the eraser with his pencil."]],
  'int-excited': [["He was excited about the field trip."], []],
  'int-overwhelmed': [["She was overwhelmed by the noise.", "He was dysregulated after recess.", "He shut down during math."], ["She shut down the computer at 10:05.", "Records list disruptive mood dysregulation disorder."]],
  'int-calm': [["He calmed down after 5 minutes.", "She was calm during circle.", "He remained calm."], ["He sat in the calm-down corner for 3 minutes.", "Staff told him to calm down."]],
  'int-tired': [["He seemed tired.", "She was hungry before lunch."], ["His shoes were worn out.", "The class played Hungry Hungry Hippos."]],
  'int-felt': [["He felt sad.", "She feels like nobody listens.", "I feel that he was ignored."], ["He felt the texture of the sand.", "She felt for the light switch.", "Holds stomach, reports feeling sick, refuses food.", "He said he felt sick."]],
  'int-feelings': [["Her feelings were hurt.", "He had big feelings at recess.", "She became emotional."], ["He is eligible under emotional disturbance.", "Emotional regulation lesson at 9:00.", "Two students at risk for emotional or behavioral disorders took part."]],
  'int-wanted': [["He wanted the iPad.", "Then she wanted to go outside.", "The student didn’t want to write.", "He hit the table because he wanted the red marker."], ["Staff asked if he wanted a break.", "She said she wanted to go home.", "The teacher asked what he wanted.", "He told staff he wanted water."]],
  'int-tried': [["He tried to hit the aide.", "She was trying to leave."], ["He tried the new puzzle.", "She tried on her coat.", "Name the behavior we are trying to reduce."]],
  'int-attempted': [["He attempted to leave the room.", "She made an attempt to grab the scissors."], ["Attempted elopement: moving toward the exit within 3 feet of the door.", "Staff will attempt to redirect him once."]],
  'int-enjoyed': [["He enjoyed the game.", "She loves trains.", "He hates math."], ["He chose the trains on 4 of 5 trials.", "Photos of loved ones were on the board."]],
  'int-seemed': [["He seemed confused.", "She appeared to be asleep.", "He looked upset."], ["He looked at the board.", "She appeared at the door at 9:05."]],
  'int-knew': [["He knew the rule.", "She understood the direction.", "He forgot his homework."], ["He knows better."]],
  'int-distracted': [["He was distracted by the window.", "She was not listening.", "He ignored the teacher's directions."], ["Staff used planned ignoring.", "Staff ignored the swearing and praised the next correct answer.", "Staff spaced out the trials by 10 seconds."]],
  'int-needed': [["He needed a break.", "She needs space."], ["He asked for a break."]],
  'int-hadenough': [["He had enough and left.", "She was fed up."], ["He had enough tokens for the trade.", "He stepped over it and kept walking.", "When he was done with it, he put the iPad away."]],
  'int-social': [["She was embarrassed.", "He is shy with adults."], ["The session ran just shy of 20 minutes.", "Neither option is praised or discouraged."]],
  'int-interest': [["He was interested in the map.", "She is obsessed with trains."], []],
  'int-looks': [["He gave her a dirty look.", "She glared at the teacher.", "He smirked."], ["He looked at the teacher for 3 seconds."]],
  'intent-purpose': [["He dropped the cup on purpose.", "She deliberately knocked over the tower."], ["Staff used deliberate practice with 10 trials."]],
  'intent-manipulative': [["He is manipulative.", "She was manipulating staff.", "She manipulates her mother to get the tablet."], ["He used math manipulatives.", "She manipulated the clay into a ball.", "Delay to the reinforcer is manipulated.", "Engagement is actively manipulating or orienting toward the materials.", "They manipulated staff proximity for one learner.", "It narrows the variables without manipulating them."]],
  'intent-attention': [["He was attention-seeking.", "She yelled to get attention.", "He did it for attention."], ["The teacher said his name to get his attention.", "Does he hit to get attention?", "Someone else got attention.", "Appropriate play gets attention too."]],
  'intent-escape': [["He ran out to escape the noise.", "She hid under the table to avoid the worksheet.", "He was avoiding work."], ["Mom asked him to get out of the car.", "Staff moved the chair to avoid a fall.", "Does he leave the table to escape the task?", "The assessments point to escape, so test the demands next."]],
  'intent-testing': [["He was testing limits.", "She keeps pushing boundaries."], ["He finished testing at 10:15."]],
  'intent-control': [["It turned into a power struggle.", "He did it to get a reaction.", "A peer provoked him."], ["Revisit the baiting and the setting first."]],
  'intent-trigger': [["The bell set him off.", "She was triggered by the noise."], ["The motion sensor triggered the light."]],
  'intent-decided': [["He decided to leave.", "She chose not to answer."], ["Given 3 options, she chose the library.", "Name the behavior the plan is meant to change."]],
  'intent-noreason': [["He hit a peer for no reason.", "Out of nowhere she screamed.", "The hit was unprovoked."], ["Intervals were randomly selected.", "Students were randomly assigned to groups.", "The call will either call for everything or for nothing."]],
  'intent-wouldnt': [["He would not sit down.", "She wouldn’t stop crying."], ["The door would not open."]],
  'lab-tantrum': [["He had a tantrum at 9:10.", "She had a meltdown.", "He threw a fit in the store."], ["Tantrum: crying with dropping to the floor for 5 s or more.", "Tantrums are defined as screaming for 5 s or more.", "Tantrum minutes fell with it."]],
  'lab-blewup': [["He lost his temper when the bell rang.", "She freaked out.", "He had an episode at lunch."], ["He blew up a balloon.", "He had a moment to finish before the bell.", "He has an incident report from last week.", "Untick a routine to leave it off without losing it.", "He lost it on the bus and asked for a new one."]],
  'lab-aggressive': [["He was aggressive with peers.", "She became violent."], ["Aggressive behavior: hitting, kicking or biting with contact.", "Physical aggression occurred 3 times.", "He had two asthma attacks this year.", "Records note a history of domestic violence."]],
  'lab-defiant': [["He was defiant.", "She was disrespectful to staff.", "He has a bad attitude."], ["Records list oppositional defiant disorder."]],
  'lab-noncompliant': [["He was noncompliant.", "She was non-compliant with the request."], ["Noncompliance: not starting within 10 s.", "Compliance was 40% of trials."]],
  'lab-refused': [["He refused to work.", "Work refusal at 10:15."], ["Refusal: saying no or pushing materials away."]],
  'lab-outburst': [["He had an outburst.", "She exploded at her sister."], ["The class read about a volcanic eruption."]],
  'lab-actingout': [["He was acting out in class.", "She acted up at dinner."], ["The group acted out the story."]],
  'lab-outofcontrol': [["He was out of control.", "She went wild at recess."], ["It was crazy hair day.", "We read about wild animals."]],
  'lab-inappropriate': [["He used inappropriate language.", "She played appropriately.", "That is unacceptable."], ["Unsafe behavior: climbing above 3 feet."]],
  'lab-disruptive': [["He was disruptive.", "She caused a disruption during the lesson."], ["Disruption: any vocalization above conversational volume.", "The fire drill disrupted the lesson at 10:20.", "Putting his trash in the bin without disrupting the activity."]],
  'lab-misbehaved': [["He misbehaved at lunch.", "She behaved well.", "That was bad behavior."], ["The class plays the Good Behavior Game on Fridays."]],
  'lab-judgment': [["He did fine.", "The transition went well.", "She was good today.", "He did a great job during centers."], ["He was good at puzzles.", "She did well on 4 of 5 items.", "They compared it with the Caught Being Good Game."]],
  'lab-goodday': [["She had a rough day.", "He had a great morning."], []],
  'lab-behaviors': [["He had behaviors today.", "She was having behaviors at lunch."], ["He has a behavior plan.", "He had behaviors such as hitting and kicking."]],
  'lab-hyper': [["He was hyper.", "She was fidgety during circle."], []],
  'lab-silly': [["He was being silly.", "She was goofing off."], []],
  'lab-whining': [["He was whining.", "She pouted."], ["He complained of a headache."]],
  'lab-bully': [["He was bullying a peer.", "She was mean to her sister."], ["The class mean was 4.2."]],
  'lab-stole': [["He stole a peer's pencil.", "She lied about the homework."], ["She lied down on the mat.", "Stealing: taking an item that belongs to someone else without asking."]],
  'lab-trouble': [["He got in trouble.", "She is a troublemaker."], []],
  'lab-consequence': [["He was consequenced.", "She got a consequence."], ["Staff recorded the consequences of each hit.", "Integrity step: the earned consequence withheld."]],
  'lab-badwords': [["He used bad words.", "She used foul language."], ["Profanity: any word on the team's list, counted per word."]],
  'lab-space': [["He got in her face.", "She invaded his personal space."], []],
  'lab-physical': [["He got physical with a peer.", "She put hands on another student."], ["He put his hands on the table."]],
  'lab-fight': [["He got into a fight.", "There was an altercation at lunch."], []],
  'lab-threat': [["He threatened a peer.", "She made threats."], ["The team completed a threat assessment.", "Threats to validity are listed in the summary.", "Restraint only for a threat of imminent risk of serious injury."]],
  'freq-alot': [["He cried a lot."], ["He did a lot better today.", "There were a lot of toys."]],
  'freq-quantity': [["He threw several books.", "There were lots of toys on the floor."], ["He did it several times."]],
  'freq-several': [["He hit the desk several times.", "She needed a couple of prompts."], ["How many times did he leave the room?", "Count how many times he hits."]],
  'freq-always': [["He always cries at drop-off.", "She talks constantly."], ["Duration was recorded continuously for 30 minutes.", "Does he always cry at drop-off?"]],
  'freq-never': [["He never finishes his work.", "He never raises his hand in class."], ["The student never left his assigned area during the 20-minute observation."]],
  'freq-often': [["He often leaves his seat.", "She usually sits with the group."], ["A typically developing peer sat nearby.", "He was breathing normally.", "How often does he leave his seat during math?", "Breaks are regularly scheduled every 20 minutes.", "He flipped the light switch on and off 14 times."]],
  'freq-overandover': [["He hit the desk over and over."], []],
  'freq-repeatedly': [["She repeatedly asked for juice."], []],
  'freq-allday': [["He cried all day.", "She was out of her seat all morning long."], ["It was present in a clear subset (all morning episodes)."]],
  'freq-wholeday': [["He screamed the whole period.", "She hummed throughout the lesson.", "She was off task most of the period."], ["He was disruptive to the whole class."]],
  'dur-awhile': [["He cried for a while.", "After a while she sat down."], []],
  'dur-longtime': [["She cried for a long time.", "It took forever."], ["He had a good time at the park."]],
  'dur-bit': [["He sat for a bit.", "A little bit later he stood up."], ["He was a bit loud.", "An MO momentarily alters the value of a reinforcer."]],
  'dur-quickly': [["He quickly ran to the door.", "She eventually sat down."], ["He started as soon as the timer rang."]],
  'dur-somepoint': [["At some point he left the room."], ["Score the interval if the behavior occurred at some point in the interval."]],
  'dur-few-units': [["It took a few minutes.", "He cried for several minutes."], ["Record how many minutes, or a 0 to 3 rating.", "The planned length has to be a number of minutes."]],
  'dur-vaguelength': [["He briefly looked up.", "She had prolonged crying."], ["He gets extended time on tests."]],
  'int-very': [["He was very loud.", "She screamed really loud.", "He was so loud."], ["On the very first trial he was correct.", "At the very end he sat down.", "That changes the very variable being compared.", "Use it only where the target really is waiting."]],
  'int-hedge': [["He was a bit loud.", "She was kind of rough with the toy."], []],
  'int-comparison': [["He did a lot better today.", "She was much calmer.", "Dad said the behavior got worse after the move."], []],
  'int-force': [["He hit the table extremely hard.", "She pushed him hard.", "He kicked the door with all his might."], ["He hit the table hard enough to tip the cup.", "He fell and hit the hard floor.", "He hit the ball hard during kickball."]],
  'int-hyperbole': [["He screamed at the top of his lungs.", "She let out a blood-curdling scream.", "It was a huge meltdown."], ["Note the severity of the worst wound."]],
  'med-because-dx': [["He did it because of his autism.", "It is due to her ADHD."], ["The scale grew from the trauma scales of emergency medicine."]],
  'med-casualdx': [["She is so OCD about her desk.", "He was acting psycho.", "He's on a sugar high."], ["He has a diagnosis of ADHD (records, 2024)."]],
  'med-sensory': [["He was sensory seeking.", "She needed sensory input.", "He was stimming at his desk."], ["He used the sensory break card.", "He walked to the sensory room."]],
  'med-sick': [["He was sick this morning.", "She had a headache.", "He cried in pain."], ["He had a cold drink at lunch.", "He was ill-prepared for the quiz."]],
  'med-meds': [["He was off his meds.", "Her meds wore off by noon."], ["Nurse reports the 8:00 dose was given at 8:05."]],
  'med-trauma': [["It was a trauma response.", "He went into fight or flight."], ["Staff use trauma-informed practices."]],
  'char-trait': [["He is lazy.", "She is spoiled.", "He is so stubborn."], ["The worksheet was entitled My Family."]],
  'char-praise': [["He is a sweet boy.", "She is a pleasure to have in class.", "He was an angel today."], ["Angel hit the table twice."]],
  'char-choices': [["He made bad choices.", "She knows better."], []],
  'char-opinion': [["I think he was tired.", "Obviously she wanted attention.", "He must have been tired."], ["He spoke clearly when he asked for help.", "Every critical step must have been correct."]]
};

/* ------------------------------------------------------------------ objective notes: no finding at all */
const CLEAN = [
  "9:41 Worksheet re-presented; student completed two items with hand-over-hand prompting and no contact.",
  "At 10:52 she answered twice when called on and waited through two turns without leaving the table.",
  "Mom said “Shoes on, please” at 7:42; Jamal put on one shoe within 10 seconds and the second after one more prompt.",
  "The peer said “stop it” and moved her chair 2 feet away; Leo looked at her for 3 seconds and returned to his drawing.",
  "Elopement: leaving the assigned area by more than 3 feet without permission, from when both feet cross the line until return.",
  "From 1:09 to 1:16 he held the pencil and did not write; the teacher circulated and did not stop at his desk.",
  "He scored 8 of 10 on the spelling check and asked “Can I go to the library?”",
  "Self-injury: any instance of the student's hand or object contacting his own head with an audible sound.",
  "Interval 7 of 20: on-task (eyes on the worksheet, pencil moving); peer comparison off-task in 3 of 20 intervals.",
  "Hypothesized function: escape from writing demands, to be tested in the analysis (EA-1).",
  "Dad turned off the tablet at 7:30; Mia said “I hate you, you're so mean!” and cried for 6 minutes on the couch.",
  "He swung an open hand toward the aide twice (no contact), then sat down 40 seconds later when the timer beeped.",
  "Question: how often does he leave his seat during independent work, and does it happen to escape the task?",
  "Interval data were recorded continuously; the timer ran from 9:00 to 9:30 without a pause."
];

/* ------------------------------------------------------------------ helpers */
const key = f => f.id + '@' + f.start + '-' + f.end + (f.replacement == null ? '' : '=>' + JSON.stringify(f.replacement));
const keys = list => list.map(key).join(' | ');
function loadSamples() {
  const cand = [process.env.WORDING_SAMPLES, ARGS.find(a => !a.startsWith('--')), SCRATCH_SAMPLES].filter(Boolean);
  for (const p of cand) {
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const list = Array.isArray(d) ? d : d.samples;
    if (JSON.stringify(list) !== JSON.stringify(EMBEDDED_SAMPLES.samples))
      note('the samples in ' + p + ' differ from the copy at the end of this file; update the copy so the test keeps them');
    return {source: p, list};
  }
  return {source: 'the copy at the end of this file', list: EMBEDDED_SAMPLES.samples};
}
function ob1Narrative() {
  if (!fs.existsSync(OB1_PATH)) return {list: [], embedded: null};
  const html = fs.readFileSync(OB1_PATH, 'utf8'), list = [];
  for (const m of html.matchAll(/\{t:"\d{1,2}:\d{2}", w:"([^"\\]{8,400})"\}/g)) list.push(m[1]);
  const a = html.indexOf('window.nbhWordingRules=\n'), b = html.indexOf('\n;\nwindow.nbhWordingConfig=', a);
  return {list, embedded: a >= 0 && b > a ? html.slice(a + 'window.nbhWordingRules=\n'.length, b) : null};
}
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : 'n/a';

function main() {
  const rawText = fs.readFileSync(RULES_PATH, 'utf8');
  let raw;
  try { raw = JSON.parse(rawText); } catch (e) { fail('shape', 'the rules file is not JSON: ' + e.message); return finish(); }
  const B = makeEngine(raw), W = makeEngine(raw, {wrap: true});
  const client = loadClient(raw), A = client.api;
  const run = A ? (t => A.check(t)) : B.check;
  const rules = Array.isArray(raw.rules) ? raw.rules : [];
  console.log('Wording rules: ' + path.relative(ROOT, RULES_PATH) + ', version ' + raw.version + ', ' + rules.length + ' rules');
  console.log('Engine: ' + (A ? 'the client\'s own check() (tools/blocks/nbh-wording.js ' + A.version + '), cross-checked with the port in this file'
    : 'the port in this file only (' + client.why + ')'));

  /* 1 ---------------------------------------------------------------- shape */
  head('1. Shape');
  const ids = new Set(), byCat = {}, withRep = {};
  if (typeof raw.version !== 'string' || !raw.version) fail('shape', '"version" must be a non-empty string');
  if (!Array.isArray(raw.rules)) fail('shape', '"rules" must be an array');
  const extraTop = Object.keys(raw).filter(k => k !== 'version' && k !== 'rules');
  if (extraTop.length) note('top-level keys the panel does not read: ' + extraTop.join(', '));
  const low = rawText.toLowerCase();
  for (const bad of ['</script', '<!--', 'newsome behavioral health']) if (low.includes(bad)) fail('shape', 'the file contains ' + JSON.stringify(bad));
  const mid = /claude-[a-z]+-\d/i.exec(rawText);
  if (mid) fail('shape', 'the file carries a model ID (' + mid[0] + ')');
  rules.forEach((r, i) => {
    const w = (r && r.id) || 'rule ' + (i + 1);
    if (!r || typeof r !== 'object') { fail('shape', w + ' is not an object'); return; }
    for (const k of ['id', 'cat', 're', 'why', 'suggest']) if (typeof r[k] !== 'string' || !r[k].trim()) fail('shape', w + ' needs a non-empty "' + k + '"');
    for (const k of ['flags', 'replace']) if (k in r && typeof r[k] !== 'string') fail('shape', w + ' "' + k + '" must be a string');
    if (/[^imsu]/.test(r.flags || '')) fail('shape', w + ' "flags" may hold only i, m, s, u');
    if (!/i/.test(r.flags || '')) note(w + ' has no "i" flag (the panel ignores case anyway)');
    const extra = Object.keys(r).filter(k => ['id', 'cat', 're', 'flags', 'why', 'suggest', 'replace'].indexOf(k) < 0);
    if (extra.length) fail('shape', w + ' has keys the panel does not read: ' + extra.join(', '));
    if (ids.has(r.id)) fail('shape', 'repeated id ' + r.id);
    ids.add(r.id);
    if (CATS.indexOf(r.cat) < 0) fail('shape', w + ' has an unknown category ' + JSON.stringify(r.cat));
    byCat[r.cat] = (byCat[r.cat] || 0) + 1;
    if (typeof r.replace === 'string') withRep[r.cat] = (withRep[r.cat] || 0) + 1;
    let re;
    try { re = new RegExp(r.re, 'gi'); } catch (e) { fail('shape', w + ' does not compile: ' + e.message); return; }
    if (re.test('')) fail('shape', w + ' matches an empty string');
    if (/\(\?<[=!]/.test(r.re)) fail('shape', w + ' uses lookbehind (older iPad Safari cannot compile it)');
    if (/\(\?<[A-Za-z_$]|\\k</.test(r.re)) fail('shape', w + ' uses a named group');
    if (/\\[pP]\{/.test(r.re)) fail('shape', w + ' uses a \\p{} class (needs the u flag)');
    for (const k of ['why', 'suggest']) {
      const s = String(r[k] || '').trim();
      if (!/\.$/.test(s)) fail('shape', w + ' "' + k + '" should end with a period');
      const cut = s.replace(/\b(?:e\.g|i\.e|vs|etc|a\.m|p\.m|Dr|Mr|Mrs|Ms)\./g, '').replace(/\d\.\d/g, '');
      if (/[.!?]["\u201D\u2019)]?\s+["\u201C(]?[A-Z]/.test(cut)) fail('shape', w + ' "' + k + '" should be one sentence: ' + s);
    }
    if (typeof r.replace === 'string') {
      const groups = new RegExp(r.re + '|').exec('').length - 1;
      for (const m of r.replace.matchAll(/\$([1-9])/g)) if (+m[1] > groups) fail('shape', w + ' replace names $' + m[1] + ' but the pattern has ' + groups + ' group(s)');
      if (/\$[<`']/.test(r.replace)) fail('shape', w + ' replace uses a $ form the panel does not expand');
    }
  });
  if (rules.length < 80 || rules.length > 150) note('the brief asks for about 80 to 150 rules; there are ' + rules.length);
  if (B.bad.length) fail('shape', 'rules the port could not use: ' + B.bad.join(', '));
  if (A) {
    const st = A.rules();
    if (st.bad.length) fail('shape', 'rules the client left out: ' + st.bad.join(', '));
    if (st.count !== rules.length) fail('shape', 'the client compiled ' + st.count + ' of ' + rules.length + ' rules');
  }
  console.log('  ' + rules.length + ' rules: ' + CATS.map(c => c + ' ' + (byCat[c] || 0)).join(', '));

  /* 2 ---------------------------------------------------------------- samples */
  const S = loadSamples();
  head('2. Samples (' + S.list.length + ', from ' + S.source + ')');
  let TP = 0, FP = 0, FN = 0, mnf = 0, mnfBad = 0;
  const catExp = {}, catHit = {}, catFP = {}, ruleCat = {};
  rules.forEach(r => { ruleCat[r.id] = r.cat; });
  const seenSample = new Set();
  for (const s of S.list) {
    if (seenSample.has(s.id)) fail('samples', 'repeated sample id ' + s.id);
    seenSample.add(s.id);
    const found = run(s.text).filter(f => f.cat !== 'blank');
    const got = [...new Set(found.map(f => f.id))], exp = s.expect || [];
    for (const id of exp) if (!ids.has(id)) fail('samples', s.id + ' expects a rule that is not there: ' + id);
    const tp = got.filter(x => exp.indexOf(x) >= 0), fp = got.filter(x => exp.indexOf(x) < 0), fn = exp.filter(x => got.indexOf(x) < 0);
    TP += tp.length; FP += fp.length; FN += fn.length;
    exp.forEach(id => { const c = ruleCat[id]; catExp[c] = (catExp[c] || 0) + 1; if (got.indexOf(id) >= 0) catHit[c] = (catHit[c] || 0) + 1; });
    fp.forEach(id => { const c = ruleCat[id]; catFP[c] = (catFP[c] || 0) + 1; });
    if (!exp.length) { mnf++; if (got.length) mnfBad++; }
    const spans = found.map(f => f.id + ' "' + f.text + '"').join('; ');
    console.log('  ' + (fp.length || fn.length ? 'FAIL' : 'ok  ') + ' ' + s.id + ' ' + (exp.length ? '' : '[must not fire] ') + (spans || '-'));
    if (fp.length) fail('samples', s.id + ' flagged what it should not: ' + found.filter(f => fp.indexOf(f.id) >= 0).map(f => f.id + ' "' + f.text + '"').join(', '));
    if (fn.length) fail('samples', s.id + ' missed ' + fn.join(', ') + ' in: ' + s.text);
    for (const c of s.clear || []) {
      const i = s.text.indexOf(c);
      if (i < 0) { fail('samples', s.id + ': the clear phrase ' + JSON.stringify(c) + ' is not in the text'); continue; }
      const hit = found.filter(f => f.start < i + c.length && f.end > i);
      if (hit.length) fail('samples', s.id + ': ' + JSON.stringify(c) + ' was flagged by ' + hit.map(f => f.id + ' "' + f.text + '"').join(', '));
    }
  }
  console.log('  expected hits found ' + TP + ' of ' + (TP + FN) + ', unexpected ' + FP + '; precision ' + pct(TP, TP + FP) + ', recall ' + pct(TP, TP + FN));
  console.log('  must-not-fire samples: ' + mnf + ', with any finding: ' + mnfBad);

  /* 3 ---------------------------------------------------------------- units */
  head('3. Rule examples');
  let np = 0, nn = 0;
  for (const r of rules) if (!UNITS[r.id] || !UNITS[r.id][0].length) fail('units', r.id + ' has no example that fires it');
  for (const id of Object.keys(UNITS)) {
    if (!ids.has(id)) { fail('units', 'examples for a rule that is not there: ' + id); continue; }
    const pos = UNITS[id][0], neg = UNITS[id][1];
    for (const t of pos) {
      np++; const all = run(t);
      if (VERBOSE) console.log('  ' + id + ' +  ' + t + '   => ' + (all.map(f => f.id + ' "' + f.text + '"').join('; ') || '-'));
      if (!all.some(f => f.id === id)) fail('units', id + ' did not fire on: ' + t);
    }
    for (const t of neg) {
      nn++; const all = run(t), h = all.filter(f => f.id === id);
      if (VERBOSE) console.log('  ' + id + ' -  ' + t + '   => ' + (all.map(f => f.id + ' "' + f.text + '"').join('; ') || '-'));
      if (h.length) fail('units', id + ' fired on its near miss: ' + t + ' ("' + h[0].text + '")');
    }
  }
  console.log('  ' + np + ' examples that must fire their rule, ' + nn + ' near misses that must not');

  /* 4 ---------------------------------------------------------------- clean */
  const ob1 = ob1Narrative();
  head('4. Clean text (' + CLEAN.length + ' notes here, ' + ob1.list.length + ' lines of OB-1\'s simulated narrative)');
  if (!ob1.list.length) note('no simulated narrative found in OB-1');
  let cleanBad = 0;
  for (const t of CLEAN.concat(ob1.list)) {
    const h = run(t).filter(f => f.cat !== 'blank');
    if (h.length) { cleanBad++; fail('clean', h.map(f => f.id + ' "' + f.text + '"').join(', ') + ' in: ' + t); }
  }
  console.log('  ' + (CLEAN.length + ob1.list.length - cleanBad) + ' of ' + (CLEAN.length + ob1.list.length) + ' gave no finding');
  if (ob1.embedded != null && ob1.embedded !== rawText) note('OB-1 carries an older copy of the rules; run python3 tools/blocks/patch-wording.py on it');

  /* 5 ---------------------------------------------------------------- robustness */
  head('5. Robustness');
  const texts = [];
  S.list.forEach(s => texts.push(s.text));
  Object.keys(UNITS).forEach(id => { texts.push(...UNITS[id][0], ...UNITS[id][1]); });
  texts.push(...CLEAN, ...ob1.list);
  let wrapDiff = 0;
  for (const t of texts) { const a = keys(B.check(t)), b = keys(W.check(t)); if (a !== b) { wrapDiff++; fail('wrap', 'wrapping in \\b(?:...)\\b changes: ' + t + '\n         plain:   ' + a + '\n         wrapped: ' + b); } }
  console.log('  ' + texts.length + ' texts: the same findings with every pattern wrapped in \\b(?:...)\\b' + (wrapDiff ? ' except ' + wrapDiff : ''));
  const shown = {};
  let reps = 0;
  for (const t of texts) {
    for (const f of run(t)) {
      if (f.replacement == null || f.cat === 'blank') continue;
      reps++;
      if (/undefined|\$\d|\$&/.test(f.replacement)) fail('replace', f.id + ' expands badly: ' + JSON.stringify(f.replacement));
      /* set off again: the same rule on the inserted words, or, after a removal, across the join */
      const ap = B.applyAt(t, f), again = run(ap.text).filter(g => g.id === f.id &&
        (ap.len ? g.start < ap.at + ap.len && g.end > ap.at : g.start < ap.at && g.end > ap.at));
      if (again.length) fail('replace', f.id + ' fires again on its own replacement: ' + ap.text);
      if (!shown[f.id]) { shown[f.id] = 1; console.log('  ' + f.id + ': "' + f.text + '" -> ' + (f.replacement ? '"' + f.replacement + '"' : '(taken out)') + '   ' + ap.text); }
    }
  }
  const repRules = rules.filter(r => typeof r.replace === 'string').map(r => r.id);
  for (const id of repRules) if (!shown[id]) fail('replace', id + ' has a replace but no example used it');
  console.log('  ' + reps + ' replacements applied, from ' + Object.keys(shown).length + ' of ' + repRules.length + ' rules that have one');
  /* the patch script's own long strings, each pattern in a vm with a time limit */
  const longs = ['a '.repeat(2000), 'very '.repeat(800), 'x'.repeat(4000), ('was upset and angry, ' + '"quoted" ').repeat(140),
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!'.repeat(60), ('tried to ' + 'really '.repeat(30)).repeat(15),
    ('he said she wanted ' + 'then '.repeat(20)).repeat(40), ('hit the ' + 'big '.repeat(10) + 'table ').repeat(60)];
  const RUN = 'let w = 0; for (const s of longs) { const t = Date.now(); re.lastIndex = 0; let m, n = 0;' +
    ' while ((m = re.exec(s)) && n++ < 2000) { if (!m[0]) re.lastIndex++; } w = Math.max(w, Date.now() - t); } w';
  let worst = 0, worstId = '';
  for (const r of rules) {
    let re; try { re = new RegExp(r.re, 'gi'); } catch (e) { continue; }
    try { const ms = vm.runInNewContext(RUN, {re, longs, Date}, {timeout: 250}); if (ms > worst) { worst = ms; worstId = r.id; } if (ms > 100) fail('speed', r.id + ' takes ' + ms + ' ms on long text'); }
    catch (e) { fail('speed', r.id + ' runs over 250 ms on long text (backtracking)'); }
  }
  const note4000 = S.list.map(s => s.text).join(' ').repeat(3).slice(0, 4000);
  let t0 = process.hrtime.bigint(); for (let i = 0; i < 5; i++) run(note4000); const msFull = Number(process.hrtime.bigint() - t0) / 5e6;
  console.log('  slowest pattern on the long strings: ' + worstId + ' ' + worst + ' ms; a full check of a 4000-character note: ' + msFull.toFixed(1) + ' ms');
  if (msFull > 150) fail('speed', 'a full check of a 4000-character note takes ' + msFull.toFixed(1) + ' ms');

  /* 6 ---------------------------------------------------------------- the two engines */
  head('6. The client\'s engine and the port');
  if (!A) note('not compared: ' + client.why);
  else {
    let diff = 0;
    for (const t of texts.concat([note4000])) { const a = keys(A.check(t)), b = keys(B.check(t)); if (a !== b) { diff++; if (diff <= 5) fail('engines', 'they differ on: ' + t.slice(0, 160) + '\n         client: ' + a + '\n         port:   ' + b); } }
    if (diff > 5) fail('engines', '... and on ' + (diff - 5) + ' more texts');
    console.log('  ' + (texts.length + 1) + ' texts: ' + (diff ? diff + ' differ' : 'identical findings'));
  }

  /* summary */
  head('Per category');
  console.log('  ' + 'category'.padEnd(10) + 'rules  replace  sample hits found');
  for (const c of CATS) console.log('  ' + c.padEnd(10) + String(byCat[c] || 0).padStart(5) + String(withRep[c] || 0).padStart(9) + '  ' + (catHit[c] || 0) + ' of ' + (catExp[c] || 0) + (catFP[c] ? ', unexpected ' + catFP[c] : ''));
  console.log('  ' + 'total'.padEnd(10) + String(rules.length).padStart(5) + String(repRules.length).padStart(9) + '  ' + TP + ' of ' + (TP + FN) + (FP ? ', unexpected ' + FP : ''));
  console.log('\nPrecision ' + pct(TP, TP + FP) + ', recall ' + pct(TP, TP + FN) + ' on ' + S.list.length + ' samples; ' + mnf + ' must-not-fire samples, ' + mnfBad + ' with a finding.');
  return finish();
}
function finish() {
  console.log(failures ? 'RESULT: FAIL (' + failures + ' failure' + (failures === 1 ? '' : 's') + (notes ? ', ' + notes + ' note' + (notes === 1 ? '' : 's') : '') + ')'
    : 'RESULT: PASS' + (notes ? ' (' + notes + ' note' + (notes === 1 ? '' : 's') + ')' : ''));
  process.exitCode = failures ? 1 : 0;
}

/* ------------------------------------------------------------------ the samples, kept here as well (same as wording/samples.json) */
const EMBEDDED_SAMPLES = {"version":"2026-10","samples":[
  {"id": "s01", "setting": "school", "kind": "ABC narrative, learner's words in curly quotes", "tricky": true, "text": "10:15 Maya threw her pencil and shouted “I'm so mad, I hate this!” three times; the aide moved the pencil cup out of reach.", "expect": [], "clear": ["mad", "hate"]},
  {"id": "s02", "setting": "home", "kind": "objective, literal upset", "tricky": true, "text": "During snack Leo reached across the table, upset the cup of juice, and wiped it up when his mother handed him a towel.", "expect": [], "clear": ["upset the cup"]},
  {"id": "s03", "setting": "school", "kind": "objective, tried a task", "tricky": true, "text": "Ava tried the new puzzle for 3 minutes, placed 6 of 12 pieces, then said “Can I have the iPad?” and pointed to it.", "expect": [], "clear": ["tried the new puzzle"]},
  {"id": "s04", "setting": "school", "kind": "operational definition", "tricky": true, "text": "Physical aggression: any instance of hitting, kicking or pushing another person with enough force to move the person's body; count each separate contact.", "expect": [], "clear": ["aggression", "with enough force"]},
  {"id": "s05", "setting": "school", "kind": "operational definition naming a label", "tricky": true, "text": "Tantrum (defined in the plan as crying or screaming while on the floor for 5 seconds or more): onset 1:42, offset 1:49.", "expect": [], "clear": ["Tantrum"]},
  {"id": "s06", "setting": "school", "kind": "operational definition naming a label", "tricky": true, "text": "Noncompliance is defined as not starting the instruction within 10 seconds of the second prompt.", "expect": [], "clear": ["Noncompliance"]},
  {"id": "s07", "setting": "home", "kind": "ABC narrative, objective", "text": "6:40 p.m. Mom said “Time for your bath” and turned off the TV; Eli dropped to the floor, kicked his legs and screamed for 4 minutes while Mom waited by the door without speaking.", "expect": []},
  {"id": "s08", "setting": "school", "kind": "objective, 'very first' and 'as soon as'", "tricky": true, "text": "On the very first trial he touched the red card as soon as the teacher said “Touch red,” and he earned a token.", "expect": [], "clear": ["very first", "as soon as"]},
  {"id": "s09", "setting": "school", "kind": "objective, token and game names", "tricky": true, "text": "After 5 minutes of work she earned a happy face on her token board and chose Angry Birds on the tablet for 2 minutes.", "expect": [], "clear": ["happy face", "Angry Birds"]},
  {"id": "s10", "setting": "school", "kind": "objective, literal acting out and random checks", "tricky": true, "text": "The reading group acted out the story; at the randomly selected 10-second checks Noah was in his assigned spot at 7 of 10 checks.", "expect": [], "clear": ["acted out the story", "randomly selected"]},
  {"id": "s11", "setting": "school", "kind": "objective, peer comparison", "tricky": true, "text": "A typically developing peer at the same table raised her hand 4 times and was called on twice.", "expect": [], "clear": ["typically developing"]},
  {"id": "s12", "setting": "school", "kind": "ABC narrative, objective, straight quotes", "text": "9:14 Paraprofessional pointed to the first item and said \"start here.\" Student swung an open hand and contacted her forearm; she stepped back and the worksheet stayed on the desk.", "expect": []},
  {"id": "s13", "setting": "school", "kind": "narrative", "text": "Marcus got really upset when the timer went off and stayed frustrated the whole period.", "expect": ["int-upset", "int-very", "int-frustrated", "freq-wholeday"]},
  {"id": "s14", "setting": "school", "kind": "narrative", "text": "He threw his book on the floor on purpose to get attention from the teacher.", "expect": ["intent-purpose", "intent-attention"]},
  {"id": "s15", "setting": "school", "kind": "ABC narrative", "text": "A: Writing task given. B: Jordan ripped the worksheet in half to escape the task. C: Aide removed the worksheet; this happens a lot during ELA.", "expect": ["intent-escape", "freq-alot"]},
  {"id": "s16", "setting": "school", "kind": "narrative", "text": "Sofia had a meltdown at recess and was very aggressive toward peers.", "expect": ["lab-tantrum", "int-very", "lab-aggressive"]},
  {"id": "s17", "setting": "school", "kind": "narrative", "text": "During the transition he was defiant and noncompliant with every direction.", "expect": ["lab-defiant", "lab-noncompliant"]},
  {"id": "s18", "setting": "school", "kind": "narrative", "text": "There was another outburst after lunch, and he was acting out for a while.", "expect": ["lab-outburst", "lab-actingout", "dur-awhile"]},
  {"id": "s19", "setting": "school", "kind": "narrative", "text": "By 1:15 the student was out of control, using inappropriate language and being disruptive to the whole class.", "expect": ["lab-outofcontrol", "lab-inappropriate", "lab-disruptive"], "clear": ["the whole class"]},
  {"id": "s20", "setting": "home", "kind": "caregiver report", "text": "Mom reported he was good all morning but misbehaved at dinner.", "expect": ["lab-judgment", "freq-allday", "lab-misbehaved"]},
  {"id": "s21", "setting": "school", "kind": "narrative", "text": "She constantly got out of her seat and called out several times during the lesson.", "expect": ["freq-always", "freq-several"]},
  {"id": "s22", "setting": "home", "kind": "caregiver report", "text": "At home he never puts his shoes on when asked and always argues with his sister.", "expect": ["freq-never", "freq-always"]},
  {"id": "s23", "setting": "school", "kind": "staff report", "text": "Staff reported that the behavior happens frequently, multiple times a day.", "expect": ["freq-often", "freq-several"]},
  {"id": "s24", "setting": "home", "kind": "narrative", "text": "He cried for a long time, then quickly calmed down after a bit.", "expect": ["dur-longtime", "dur-quickly", "int-calm", "dur-bit"]},
  {"id": "s25", "setting": "school", "kind": "narrative", "text": "It took her a few minutes to start, and she worked only briefly before putting her head down.", "expect": ["dur-few-units", "dur-vaguelength"]},
  {"id": "s26", "setting": "school", "kind": "narrative", "text": "He hit the table extremely hard and screamed really loud.", "expect": ["int-force", "int-very"]},
  {"id": "s27", "setting": "school", "kind": "narrative", "text": "She is so ADHD today, probably because she was off her meds.", "expect": ["med-casualdx", "med-meds"]},
  {"id": "s28", "setting": "school", "kind": "narrative", "text": "He was sensory seeking and needed input, so he crashed into the mats.", "expect": ["med-sensory"]},
  {"id": "s29", "setting": "school", "kind": "narrative", "text": "He's a lazy kid who knows better and just makes bad choices.", "expect": ["char-trait", "char-choices"]},
  {"id": "s30", "setting": "home", "kind": "narrative", "text": "Obviously she was manipulating staff; I think she is spoiled at home.", "expect": ["char-opinion", "intent-manipulative", "char-trait"]},
  {"id": "s31", "setting": "home", "kind": "narrative", "text": "He wanted the iPad, so he tried to grab it from his brother.", "expect": ["int-wanted", "int-tried"]},
  {"id": "s32", "setting": "school", "kind": "objective, reported question", "tricky": true, "text": "The aide asked if he wanted a break, and he pointed to the break card within 5 seconds.", "expect": [], "clear": ["wanted"]},
  {"id": "s33", "setting": "school", "kind": "narrative", "text": "She seemed happy and enjoyed circle time, but felt left out at centers.", "expect": ["int-seemed", "int-happy", "int-enjoyed", "int-felt"]},
  {"id": "s34", "setting": "school", "kind": "narrative", "text": "During the fire drill he appeared anxious and covered his ears for 20 seconds.", "expect": ["int-seemed", "int-anxious"]},
  {"id": "s35", "setting": "school", "kind": "narrative", "text": "He was bored during the lecture and not paying attention, zoning out for a while.", "expect": ["int-bored", "int-distracted", "dur-awhile"]},
  {"id": "s36", "setting": "home", "kind": "caregiver report", "text": "Dad said the toys end up on the floor all the time, and tonight there were lots of blocks thrown.", "expect": ["freq-always", "freq-quantity"]},
  {"id": "s37", "setting": "school", "kind": "narrative", "text": "Kayla had a rough day, got in trouble twice, and was consequenced at recess.", "expect": ["lab-goodday", "lab-trouble", "lab-consequence"]},
  {"id": "s38", "setting": "school", "kind": "narrative", "text": "Out of nowhere he started screaming for no reason; the loud bell must have triggered him.", "expect": ["intent-noreason", "intent-trigger"]},
  {"id": "s39", "setting": "school", "kind": "ABC narrative, praise and learner's words in straight quotes", "tricky": true, "text": "10:02 Teacher said \"Great job, you were so good today!\" and handed him 2 tokens; he said \"I'm bored\" and walked to the sink, 12 feet from his desk, returning at 10:04.", "expect": [], "clear": ["so good", "bored"]},
  {"id": "s40", "setting": "school", "kind": "narrative", "text": "She was testing limits and attention-seeking, deliberately dropping her pencil every few seconds.", "expect": ["intent-testing", "intent-attention", "intent-purpose", "dur-few-units"]}
]};

main();
