# Setting the folder up

Unzip it. Inside `NBH-Workstation`, every form sits loose beside `index.html` — no
subfolders. Double-click `index.html`.

```
NBH-Workstation/         index.html, README.txt, SETUP.md, the 31 forms,
                         pdf-lib.min.js and nbh-pdf-tools.js (for Finish PDF)
```

Opening `index.html` from a preview pane, a Drive viewer, or any place where it is
the only file on the host gives **404** for every form. It has to be a real folder
on a real disk.

## Checked, September 2026

Every one of the 30 forms was opened in a browser and driven end to end.

| Check | Result |
|---|---|
| All 30 filenames match the registry in `index.html` | pass |
| Shared `--nbh-*` design tokens byte-identical across all 30 | pass |
| Title format, title-case headings, logo, privacy note, print header, date format | pass |
| Load simulation fills the form (all 30) | pass |
| Horizontal overflow / clipped table cells | none |
| Blank graphs | none — 301 SVGs drawn, 0 empty |
| PDF generates from each form | pass, 4–41 pages each |
| Workstation bridge answers (all 30, opened through the shell) | pass |
| Student packet reaches every form | pass |
| Master print, all 27 ticked | 66-page document, cover sheet and contents list correct |
| Master print, partial selection | correct; warns by name about ticked forms never opened |
| JavaScript errors anywhere | none |

## One defect found and fixed

The student packet is applied by matching a field against a fixed list of
selectors. Several forms name their identifier fields in ways that list never
covered, so those fields stayed empty and had to be retyped:

- **ABC-1 took nothing at all.** Its student field is `#h-client` — an id — while
  the list carried only a `name=` selector of the same spelling.
- **DM-1, the packet cover sheet, got neither the name nor the school.** It splits
  the student's name into separate first and last fields, which one packet string
  cannot fill through a single selector, and it names the school `s.school`.
- **Grade reached 6 forms of 27.** `c.grade` and `h.grade` were not in the list.

The selector lists were widened, and the split first/last name is now handled:
the name is divided on the comma if there is one, otherwise at the last space,
and only when **both** fields are still empty. Nothing already typed is ever
overwritten — that rule was already in place and is untouched.

After the fix, every form that has a given field receives it. The remaining gaps
are forms that simply have no such field: MT-1 and ST-1 carry only a student
name, ABC-1 and SP-1 have no student-ID field, TB-1 and RA-1 have no grade field.

One thing that looks like a gap and is not: **VI-1's School / site field ships
pre-filled with "Royal Palm School"**, so the packet correctly leaves it alone.

## Added September 2026, after the verification pass

Patterns taken from clinical documentation systems, where the same problems have
already been solved:

**A close warning.** Nothing is stored, so closing the tab with work in it lost
that work silently. The browser now stops and asks — unless the case has been
saved and nothing has changed since, in which case it closes without fuss.

**One case file.** `Save case` writes every open form plus the student details
into a single file; `Open case` loads it back, opening each form and filling it.
One file to keep or hand over instead of a folder of twenty-seven. Each form's own
`Save data` button is untouched. Since the third pass (below) the case file carries
each form's own saved data, so rows, steps, sessions and incidents added while
working come back too.

**A wrong-student guard.** Every open form now reports the student name it is
holding, and the workstation compares it against the name on the bar every few
seconds. A form left over from the previous case raises an amber strip naming it,
with a button that jumps straight there. `Bell, Marcus` and `Marcus Bell` are
treated as the same person; an empty field is never a mismatch. Mixing two
students in one printed packet is the single worst failure this tool could have,
and it was previously invisible.

**A command box.** `⌘K` (`Ctrl K`) opens a search over all 30 forms and every
command. Letters match in order, so `tbd` reaches Target Behavior Development and
`cr` reaches the crisis plan. `↑` `↓` move, `↵` opens.

**Keyboard throughout.** `↑` and `↓` move between forms without touching the
mouse, `⌘S` saves the case, `⌘⇧P` builds the master print, `esc` closes a dialog.

**Progress at a glance.** Each stage heading in the list now carries its own count
— "6 of 14 open" — so an unstarted stage is visible without scrolling.

**Print one form.** A `Print this form` button in the form's header bar, for when
the whole packet is not what you want.

## Fourth pass, September 2026 — a design review

Every form was looked at on a laptop, on a tablet held both ways, and on paper,
on its own and in the master print. What changed:

### On screen
- **One look for the tools inside a sheet.** "Add respondent", "Remove last",
  "Add a line" and the like were the browser's plain grey button in half the
  forms. All 30 now share one style, and taking something away is shown in red.
- **View tabs keep their labels on one line.** With more tabs than the bar could
  hold (TD-1 has 13) the labels were squeezed onto two or three lines, and on a
  tablet the row ran off the side of the bar. The tabs now wrap as a row, and
  *More controls* and *Fit* sit at the right of the bar instead of on a row alone.
- **Tablets.** Below 1180 px wide, the workstation's form list becomes a drawer
  behind the *Forms* button, so a form gets the whole width instead of scrolling
  sideways. The student bar keeps each label beside its own box, and the bar above
  a form stays on one line.
- **SP-1's behavior codes can be read.** The code picker's arrow covered most of
  the letter, so a coded cell read "1 [" rather than "1 B". The letter is now a
  small tag and cells without a code stay quiet. Dates over a ten-day sheet are
  larger.
- **EA-1's level-of-differentiation inputs** ran together as one sentence; they
  are now labelled fields like the rest of the form. In **TD-1**, "EA-1 design used"
  and "Describe" stay beside their boxes when the row wraps.
- **DD-1** uses the same serif for its headings as every other form, its tabs sit
  under the masthead and stay at the top of the window while scrolling, and its
  results tables scroll inside their panel on a narrow window.
- **One order for the header buttons.** DD-1, DT-1 and VI-1 now run *Load
  simulation, Print / Save as PDF, Save data, Open data, Clear all*, the order the
  other 27 use, and *Clear all* is red.
- **The workstation's logo** sits on a white tile instead of a white rectangle
  cut tight to the lettering.
- **Nothing smaller than 10 px, nothing too small to tap.** Table headings in DM-1,
  IA-1, MS-1, PA-1 and RR-1 and OB-1's interval numbers are at least 10 px. ABC-1's
  Edit and Delete, MT-1's marks, PA-1's + and −, the remove buttons and the
  workstation's small buttons are now at least 24 px high.

### On paper
- **Tools no longer print.** "Add parent or guardian", "Add step", "Remove last"
  and the rest printed on the record in CF-1, CT-1, FS-1, IN-1, TI-1 and others,
  on their own and in the master print.
- **ABC-1 and DD-1 carry the letterhead in the master print**, as every other
  section does. ABC-1's header block printed its labels and values in the wrong
  columns; each label now sits over its own value.
- **A long entry no longer prints over its label.** In a label-and-field row (OB-1,
  SP-1 and others) a long answer squeezed "Student" down to "Stude" and ran over it.
- **An empty field prints empty.** The grey example inside a field — "e.g.,
  custody order 3/2025 in cumulative folder" — printed with it, and in a filled
  record reads as though someone had entered it. The sample packet had 23 pages
  with one; it now has none, on its own or in the master print.
- **No word is printed broken in two.** VI-1's agreement ledger printed
  "independen / t math" and "Survi / ves agree / ment", RR-1 "Reviewe / d", and
  ABC-1's probability matrix "help/prompt / s". Every word on every printed page
  was measured, standalone and in the master print, and none is split now.
- **A table row stays on one page** instead of starting at the foot of one page
  and finishing on the next.
- **The simulated-data notice prints under the letterhead**, not above it.
- **Headings stay with what they head** in all 30 forms. Long evidence boxes and
  PA-1's and RA-1's decision lists may run over a page, so a first page is no longer
  left mostly empty.
- A target or round chosen with a selector bar (FS-1, CF-1) prints as its name,
  not as a row of buttons. Printed from ABC-1's *Data file* tab, the page carries
  the record rather than the save buttons.
- **Ctrl+P (⌘P) inside the workstation prints the open form.** Printing the
  workstation page itself gives a short note saying how to print, not a picture of
  the screen.

### Wording
The workstation's Help, Diagnostics and start screen said nothing is stored and
pointed to a standalone folder that is not in this download. They now describe
autosave as it works, and count 30 forms.

### What was checked
| Check | Before | After |
|---|---|---|
| Buttons left in the browser's default style | 80, in 15 forms | 0 |
| Buttons under 24 px to tap | 174 or more | 0 |
| Characters of text under 10 px | about 1,350 | 0 |
| Pages scrolling sideways on a tablet (1024 and 820 px wide) | TD-1 and DD-1 | none |
| Forms needing a sideways scroll inside the workstation, 1024–1366 px | all of them at 1024 | none |
| Tool buttons printed on the record, standalone or in the packet | 13 forms | 0 |
| Placeholder text printed as though entered (sample packet) | 23 pages | 0 |
| Words printed split in two (every word measured, standalone and packet) | 40 or more, in VI-1, RR-1 and ABC-1 | 0 |
| Every typed field printed, standalone and in the master print | pass | pass |
| The regression suites (16) and the accessibility check (30 of 30) | pass | pass |

The only fields that do not reach paper are the ones hidden on screen until
something calls for them, and ABC-1's unsaved new-incident entry, as before.

## Third pass, September 2026 — episodes, every field on paper, complete case files

### DD-1: duration logged one episode at a time
A behavior measured by **Duration (minutes)** or **Percent of time** now has an
**Episode log** on the Daily data tab. Each episode goes on its own line: when it
started and stopped, or just its length (`3:20`, `3.5`, or `45s`). To log one as
it happens, *Start one now* stamps the start and the *now* beside End stamps the
stop, so the length is timed to the second. The day's total
on the sheet is the sum of the episodes and cannot be typed over while episodes
exist; it is what the graph plots. The `+ ep.` / `3 ep.` button in each duration
cell opens that day's log. A day with no episodes keeps whatever total is typed,
and removing every episode gives back a total typed before the first one.

- **On paper**: the printed data sheet is followed by *Episodes by day* — each
  episode's length, times and note, the day's total and the longest episode.
  *Print blank episode form* gives staff a portrait sheet to fill by hand.
- **Analysis**: an *Episodes* table for each condition — days logged, episodes,
  episodes per day, mean length, longest — separating "fewer" from "shorter".
- **CSV**: two extra columns per duration behavior, the count and each length.
- The simulation now includes a tantrum duration target with episodes.

### Every field prints what was typed
Every text field in all 30 forms was filled with a marked entry, printed on its
own, and the PDF searched for the marker, once with entries that fit and once with
entries longer than the field. Fixes from that pass:
- Wide tables no longer lose their right-hand columns on paper. RM-1's
  inoculation plan (Who and By when were off the page), the scoring grids in
  ST-1, TI-1 and CT-1 (the last rounds), ABC-1's incident log (the After column)
  and CF-1's ratings now fit. As a safety net, every form lays itself out at the
  page width just before printing and scales down anything still too wide.
- A dropdown whose chosen text is longer than its box prints the full text.
- Calendar icons and dropdown arrows no longer print.
- VI-1's status labels wrap instead of running off the ledger.
- ABC-1's incident log no longer leaves the first page blank.

### Case files and autosave keep everything
Saving a case read only the fields on screen, so anything a form builds as you
work — data rows in DD-1, added steps in ST-1, logged incidents in ABC-1,
observations in OB-1 — came back empty. The case file now carries each form's
complete saved data (the same file its own `Save data` writes) and restores it
through the form's own `Open`. Autosave notices any edit, not only a field going
from empty to filled.

### Smaller fixes
- DD-1's Delete (row), Remove (behavior) and photo buttons were invisible.
- DD-1's section of the master print showed its data sheet with every value
  missing; it now prints the sheet, the episode record and the graphs.
- EB-1 uses a setting typed into "If other" when none is picked from the list.
- "Use this name" on the student bar also takes the ID, grade, school and BCBA
  from the form that holds them.

## Second pass, September 2026 — autosave, print, accessibility

### Autosave
Work is now kept on this computer, in this browser, and offered back when you
reopen the workstation. Three things keep that appropriate for a student record:
it is **never applied silently** (you are told whose work it is and when it was
saved, and you choose), it **expires after 14 days**, and it can be **wiped or
switched off** from the chip in the toolbar. Saving a case file clears it, because
the file is then the record. If the browser refuses to store anything, autosave
turns itself off and says so rather than failing quietly.

It is a safety net, not the record. Save case is still what you keep and hand over.

On a machine other people sign in to, clear it when you finish or leave it off.

### Three defects found by printing the packet and looking at it
**Fifteen of the twenty-seven forms printed completely blank.** The collector
asked for `<main class="sheet">`; twelve forms are built that way and the other
fifteen are a run of `.sheet` pages with no `<main>` at all, so the packet carried
a section heading over an empty page with no error anywhere. A ten-form sample
went from 25 pages to 158 once fixed.

**The stylesheet scoper mishandled anything it was not sitting exactly on top of.**
It checked for a comment, and for an at-rule, only when the parser happened to land
on the first character of one. Two consequences, both silent:

- A rule written under a comment banner arrived with the comment glued to its
  selector. Harmless for a class, fatal for `:root`: it became `.mp-0 :root`, which
  matches nothing, so every shared `--nbh-` colour, rule and typeface was undefined
  throughout the packet. Most visible on the scatter plot grid, which printed with
  no cell borders and no shading.
- Every `@media print` block sits on its own line, so none of them were ever
  recognised as at-rules. Their contents were emitted raw and unscoped — meaning
  the print stylesheets of all 30 forms, the type sizes, masthead colours and page
  breaks, were being discarded or misapplied in every packet.

The parser now steps over whitespace and comments before deciding what comes next,
which fixes the class rather than the two symptoms.

This was caught by a fidelity check that renders each form on its own, renders a
packet containing only that form, and compares the computed styling of every
element in document order. Before the fix, 19 to 26 per cent of elements differed.
After it, 26 of the 30 forms render identically; the four that do not are the ones
whose simulators generate random data, so the two renders are not comparable
cell for cell.

**Filled fields were cut off at column edges.** A long entry in a fixed-width
column was truncated ("classroom, lunch, bus line" printed as "classroom,") and
every select printed its dropdown arrow. A filled field now prints as its value so
it wraps; an empty field stays a field, so a blank form still has lines to write on.

### Signatures, and two defects behind them

The consent form keeps each signature in a hidden field beside the canvas it is
drawn on. Two things went wrong in the packet, and they had one cause between them:

- A cloned canvas is blank, so a signed consent form printed with **empty
  signature boxes** — on a consent document, the one thing that most needs to
  appear.
- Turning filled fields into text did not exclude hidden fields, so the
  signature's image data printed as **four pages of raw characters**, and the
  length of that text stretched the signature blocks down an entire page.

Hidden fields are now left out of the printed packet, and a signature is drawn as
an image where its pad was, so it appears on the page as signed.

Fixing the brand tokens had also let the forms' paper-grey screen background reach
the printed page, showing as a grey block wherever content stopped short. Packet
pages are now forced white.

### The printed packet
Cover sheet carries the practice logo, the student details and a FERPA
confidentiality notice. Every page then carries a running header with the practice
and the student's name and ID, a confidentiality footer, and "Page 12 of 158" —
so a loose sheet found on a desk identifies itself. Multi-page forms keep their
own page breaks inside the packet.

`Sample-Master-Print.pdf` is ten forms of simulated data built exactly this way.

### The contents list is clickable

Each entry on the cover is a link to that form's section, and each section heading
links back to the contents. Browsers turn these into real PDF link annotations
when you print to PDF, so in the finished file the contents work like a table of
contents: click an entry, land on the form. Verified in the sample — ten links on
the cover, each resolving to the right page, plus ten back-links.

They are styled to read as a list, not as web links: same ink as the surrounding
text, with a light dotted underline rather than blue and solid.

Two things this cannot do, both limits of printing from a browser rather than
choices:

- **No page numbers beside the entries.** Nothing in the page can know what page a
  section will land on until the browser has paginated it, and by then the content
  is fixed. Approximating them would put wrong page numbers in a student record,
  which is worse than having none.
- **No bookmark sidebar.** Browser print-to-PDF does not generate a PDF outline.

*Both since solved after the fact, once the PDF exists and the pages are known:
see "Finish PDF" below.*

### Accessibility
ADA Title II requires state and local governments, school districts included, to
meet WCAG 2.1 Level AA, with larger public entities due by 26 April 2027 and
smaller ones by 26 April 2028. The shell has label associations, a skip
link, visible focus outlines, ARIA roles on the form list and the command box, a
live region for status, and titled frames.

**All 30 forms have now been audited with axe-core against WCAG 2.1 A and AA, and
all 30 pass.** The first run found 454 failures:

| Rule | Impact | Forms | Elements |
|---|---|---|---|
| `label` | critical | 24 | 198 |
| `select-name` | critical | 21 | 52 |
| `aria-required-parent` | critical | 1 | 168 |
| `button-name` | critical | 1 | 20 |
| `color-contrast` | serious | 2 | 16 |

Nearly all of it was the same thing: a control whose name was sitting right beside
it on screen but was never tied to it, so a screen reader announced an unlabelled
box. Each form now derives the name from what a sighted user reads — an associated
or wrapping label, the text immediately before the control, its row and column
headers, or the placeholder — and attaches it. These forms wrap a field in a plain
`.row` and put its caption on a sibling of that wrapper, so the derivation climbs a
few levels to find it. Grids built by script are covered too, by watching for
newly added controls. **Nothing visible changed.**

Two structural fixes: the scatter plot's cells carry `role="gridcell"` on a button
inside a `<td>`, which inside a grid is already a cell, so the row held a cell
inside a cell — the `<td>` is now marked presentational. The preference-assessment
grid's rating buttons were empty and are now named by their row and column.

Three colours were too faint to meet the 4.5:1 minimum and were darkened. **These
are the only visible changes in this pass**, and they are worth knowing about:

| Where | Was | Now | Contrast |
|---|---|---|---|
| ABC-1 attention EO tag | `#b06f1b` | `#a4661a` | 4.08 → 4.67 |
| ABC-1 "withheld" note | `#7f9195` | `#62747a` | 3.28 → 4.88 |
| SP-1 unfilled date | `#9fb0bd` | `#5f7386` | 2.22 → 4.90 |

Re-run the audit any time with `node a11y.js ../NBH-Workstation`. It writes
`/tmp/a11y.json` and takes a list of form IDs if you want a subset.

One caveat worth stating plainly: axe-core catches roughly a third to a half of
WCAG issues. It cannot judge whether a label reads sensibly, whether the reading
order makes sense, or whether the forms are actually usable with a screen reader.
A pass here means no automated failures, not certified conformance.

### What was checked
43 automated checks pass: the regression harness over all 30 forms, the bridge and
packet delivery, the command box and keyboard, the wrong-student guard, the case
file round trip, autosave including crash recovery and expiry, and the close
warning in all four of its states. Separately, the packet-versus-standalone
fidelity check covers all 30 forms, comparing roughly 30,000 elements in total.

## The staff flowchart

TD-1 gains a **Build staff flowchart** button beside the Package Summary. It reads
the component cards *as you have edited them* — not the library defaults — and
renders a decision tree with each procedure's full steps, parameters and citation.
It prints on its own page and travels with the packet.

The tree runs: what to set up **before you start**, what runs **on the timer**,
what happens **in teaching sessions**, then the decision — *what just happened?* —
branching three ways: the student used the replacement behavior, the target
behavior occurred, or it is escalating past this plan.

Two things it deliberately does not do:

- **It does not restate the crisis procedures.** Escalation hands off to CR-1. Two
  copies of a crisis procedure is one too many, and the wrong one will be the one
  in somebody's hand.
- **It does not guess where an unfamiliar component belongs.** Cards arrive from
  several engines, each with its own code prefix — `A_` antecedent, `S_` schedule,
  `P_`/`E_`/`DT_`/`SBT_`/`MAND_` teaching, `R_` response, plus the fifteen named
  treatment components. Anything unrecognised is listed under **Not placed** for
  you to position. Putting an antecedent strategy under "the behavior occurred"
  would tell staff to run it at exactly the wrong moment, so it is left to you.

The placement map sits at the top of the flowchart script in TD-1 (`PHASE` and
`phaseOf`) if you want to move anything.

Rebuild it after any change to the components — the footer carries the date it was
generated and states that where the page and the plan differ, the plan governs.

## GB-1, the Goal and Objective Builder

The twenty-eighth form. It writes the objectives for the plan as finished,
measurable sentences, in two formats, because reduction and acquisition are not
the same kind of statement.

**Reduction objectives** follow the short-term objective template: *(student) will
(direction of change) their (response measure) of (target behavior) from (current
level) to no (more/less) than (target level) in/at (context) over (success
criterion) # measurements by (target date).* Source: the Florida Institute of
Technology ABA instructional series (2019).

**Acquisition objectives** follow the condition&ndash;behavior&ndash;criterion phrasing used
in Florida IEPs: *By (date), given (condition), (student) will (behavior)
(criterion) across (number) consecutive (unit), as measured by (method).*

### Baselines come from the plan

TD-1 already holds the baseline rate and the reduction criterion. Open GB-1 in the
workstation with TD-1 open and the numbers cross automatically; outside the
workstation, **Import from case file** reads them from a saved case. Either way
nothing is written until you press **Apply to empty fields**, and it fills only
fields you have not typed in — an override survives any number of later applies.

Direction of change, the response measure and more/less are filled in as well,
since a reduction objective is a reduction by definition and TD-1 states its
baseline as a rate per minute. The target date is not filled, because it is a
decision rather than a consequence of the plan.

This is the point of reading rather than retyping: a goal criterion and a plan
criterion that disagree are a finding at the next review. Where a goal *should*
differ — a more conservative IEP criterion than the clinical exit criterion — put
the reason in the note field so the difference reads as a decision.

### Unfinished components are visible

Any component not yet filled prints in brackets, in amber, in the sentence itself:
`will [direction of change] their [response measure] of ...`. The goal sheet says
plainly that bracketed text must be completed before the objectives are
transferred. A half-written goal cannot look finished.

The goal sheet also warns when only one kind of objective has been written — a
plan that reduces a behavior without teaching a replacement, or teaches one
without naming what it replaces, leaves half the case unwritten.

### Before you rely on the wording

Florida requires measurable annual goals, with short-term objectives or benchmarks
for students assessed against alternate academic standards (Rule 6A-6.03028,
F.A.C.). Confirm the exact phrasing your district's IEP system expects before
transferring these — the template here is the standard structure, not a
district-approved string.

## Final verification, September 2026

Everything below was run against the packaged build.

| Check | Result |
|---|---|
| Registry, files and `forms.json` | 30 forms, all present, no gaps, no duplicates |
| Regression harness, all 30 | pass |
| Bridge and packet delivery | 30/30 answering, every form receives the packet, no errors |
| WCAG 2.1 A and AA (axe-core), all 30 | **30/30 clean, zero findings** |
| Workstation features | 19/19 |
| Autosave, including crash recovery and expiry | 16/16 |
| Close warning, all four states | 8/8 |
| GB-1, including baseline handoff and override | 7/7 |
| Staff flowchart | builds, ordered, hands off to CR-1, no errors |
| Print fidelity, all 30 forms | see below |
| Full 28-form packet | 272 pages, no blank pages, no data spill, 28 working contents links, header and page number on every page |

### Print fidelity

Each form is rendered on its own and again inside a packet, and the computed
styling of every element is compared in document order — roughly 30,000 elements
across the set. Every remaining difference has been traced to one of two causes,
both expected:

- **Empty date controls print transparent** (the fix below), which is a real
  computed-style difference from standalone and is counted as one.
- **Four forms randomise their simulated data** (SP-1, IA-1, MS-1, PA-1), so the
  two renders shade different cells. The giveaway is differences flipping in both
  directions at once.

No unexplained difference remains.

### Last defect found

Empty date fields printed `mm/dd/yyyy` and a calendar picker icon. A filled date
already printed as text; an empty one printed browser furniture into a student
record. Date, month and time controls left in the packet are now blank lines to
write on. Verified across all 272 pages of the full packet: zero occurrences.

### What automated checks cannot tell you

A clean axe-core run means no automated failures, not certified conformance — it
catches perhaps a third to a half of WCAG issues and cannot judge whether a
derived label reads sensibly or whether the forms are usable with a screen reader.
Roughly 250 of the accessible names were derived from surrounding text; they exist
and are correct in structure, which is not the same as being well worded.

Nor can any of these checks tell you that a clinical statement is right. The
blank-signature defect was found by eye, not by a test. If a page looks wrong to
you, that is still the most valuable signal available.

## EB-1, the Essentials Brief for Limited-Contact Staff

A one to three page brief for people who see the student briefly and are not
running the plan — bus drivers and attendants, specials teachers, lunchroom and
office staff, substitutes.

It is **selected, not summarised**. Most of the plan is deliberately absent. A bus
attendant is not running the intervention; they are trying not to make things
worse, to recognise the request when it comes, and to know when to call. Handing
them a condensed plan produces one of two failures — they read none of it, or they
attempt procedures their setting cannot support.

**Two blocks earn their place on every brief**, and they print in their own
colours: *Never do this*, and *Call for help*. Limited-contact staff rarely cause
harm by omitting a procedure; they cause harm by doing the one thing that
strengthens the behavior, or by not knowing the threshold for calling.

### What it carries over, and what it refuses to

Plan text comes across from TD-1 the same way GB-1's baselines do — automatically
in the workstation, or from a case file outside it. Every field it fills is marked
**from the plan — rewrite**, and it fills only empty ones.

It does **not** translate the plan into plain language. Turning "differential
reinforcement of alternative behavior" into words a bus attendant can act on at
6:50 in the morning is a clinical judgement, not a text transform, and getting it
subtly wrong would be worse than leaving it to you.

What it does instead is **check your wording**. A list of technical terms —
reinforcement, extinction, mand, SD, EO, antecedent, contingency, schedule,
topography and about thirty more — is matched against the brief, and anything
still present is listed back. It also estimates the printed length and says so when
you go past three pages.

### The acknowledgment page

Optional, on by default, printing separately from the handout: signature blocks
recording that the brief was given, gone through, and questions invited. That is
what you will be asked for if the plan is ever questioned, and it tells you who
holds a copy.

### Scope on the page

The brief names the setting and the roles it was written for, and carries a
confidentiality line: it comes from the student's education record, which FERPA
keeps confidential, and it is only for staff who work with this student. The
handling instructions (do not copy it or pass it on; return or destroy it when you
no longer work with the student) are the school's, not FERPA's.

## A defect found while building EB-1

**Fourteen forms printed the wrong form number on every page.** The running page
header is part of the shared print masthead, which was copied between forms and
kept the id it was copied from — so a printed crisis plan, treatment integrity
sheet or caregiver training record announced itself as *Form SP-1* at the top of
every page. Twelve of the fourteen predate this session; GB-1 and EB-1 inherited it
from the form they were built on.

All fourteen are corrected, and the harness now checks that a form's running header
matches its own id, so it cannot recur when the next form is built from an existing
one.

## The packet was printing at three-quarter size

Body text in the assembled packet was 6.2 to 7.3pt — smaller than legal fine print.
It was not a design decision; it was a defect.

Matching 102 identical text spans between a form printed on its own and the same
form inside a packet showed every one scaled by 0.749: 7.50pt became 5.62pt.

**Cause.** Two forms, RM-1 and FS-1, lay out wider than the printable page — 975px
against 730px. A browser shrinks the *whole document* to fit its widest element, so
two forms were shrinking all 274 pages of every packet.

**Fix.** The print document now lays out at the true page width, on screen as well
as on paper, and a short script measures each form and scales only the ones that
actually overflow. Body text is now 8.5 to 9.6pt. Text under 7pt fell from about
60 per cent of the document to 8. The packet runs longer — 274 pages became 360 —
which is the cost of type people can read.

Two pagination faults surfaced with it and were fixed: forms that break before
their own sheet were firing on top of the packet's section break, and sheets with
nothing on them were taking a page each.

### One blank page remains

A single blank sheet prints in the middle of ABC-1, at page 104 of 360. Its content
is verified intact — the text that surrounds it is all present in the packet — so
this is one wasted sheet of paper, not lost information. Three attempts at it
failed and it was left rather than spend more of the session on it. If it matters,
it is the next thing to chase.

*No longer present in v21.1.* A full 30-form packet of simulated data now prints
409 pages, and every one of them carries text between the running header and
footer. See "Finish PDF" below for why the fix belongs here, in the layout,
and not in the finished PDF.

## Finish PDF

A packet saved as PDF from the print window has no bookmark panel, and its
contents page has no page numbers, because nothing in the page can know where a
form will land until the PDF exists. **Finish PDF**, in the top bar beside *Build
master print*, takes that saved file and gives back a copy with both. The copy
opens with the bookmark panel showing. The original file is left as it is.

1. Build master print, and save it as PDF from the print window.
2. Press **Finish PDF** and drop the file on the dialog (or click to choose it).
3. Check the list of forms and page ranges, then press **Save finished copy**.

It is also in the command box: `⌘K`, type `finish`.

### Where the numbers come from

Nothing is estimated. Each section of the master print has an id (`sec-DM-1`,
`sec-IC-1` and so on) and the contents list links to it. When Chrome or Edge saves
the packet, every linked id becomes a *named destination* in the PDF, pointing at
the page where that section starts, and every contents entry becomes a *link
annotation* whose rectangle says where that line sits on the page. So the finished
file already says, by form id, where each form begins and where its entry is.

Finish PDF reads both. It writes a standard PDF outline from the destinations, so
every bookmark lands exactly where the contents link lands, with the short names
from the form list ("IC-1 — Informed Consent") as titles. And it writes each
form's page number at the right of its contents entry, on the entry's last line,
joined to it by a dotted leader that continues the entry's own dotted underline.
The master print keeps the right of the list clear for this (`.mp-cover ol` has
56px of right padding). The numbers are set in the entries' own size and colour;
measured against Chrome's output, they sit on the entries' baseline to a
hundredth of a point.

Because it reads markers only a master print has, it refuses any other PDF, and
it needs the file saved from Chrome or Edge. A packet sent through a printer
driver, or saved some other way, loses the markers; the dialog says so. A packet
built before the list kept its gutter clear gets bookmarks but no numbers, and
the dialog says why. The numbers can also be switched off in the dialog.

### What it does not touch

Nothing already on a page is redrawn, reordered or removed. The outline is added
beside the pages; the numbers are drawn on the contents page in a stream of their
own, over the reserved space. Before the copy is offered, it is read back and
checked: same page count, every page other than the contents byte-for-byte the
same, the contents page still carrying every stream it had, and every bookmark
landing on the page its form starts on. If any of that fails, nothing is saved
and the dialog says which check failed.

If the packet names a different student from the one on the bar, the dialog says
so. It does not stop you, since finishing changes nothing about whose packet it
is, but it catches picking the wrong file.

### Why it does not remove blank pages

That was planned and deliberately left out. Every page of the packet prints
"Page 12 of 415" in its footer, and that is baked into the page when the browser
writes it. Deleting a sheet from the finished file would leave page 103 followed
by page 105 in a student record — which reads as a page gone missing, a worse
problem than a sheet of wasted paper. A blank page is a layout fault, and the
place to fix it is the layout, where the numbering comes out right. The current
packet has none to remove.

### Files

`pdf-lib.min.js` is pdf-lib 1.17.1, the current stable release, copied in rather
than fetched so it works on a laptop with no network. `nbh-pdf-tools.js` is the
finishing itself. Neither loads until Finish PDF is used, so an ordinary session
is no slower. If either is missing from the folder, Finish PDF says which one,
Diagnostics says so too, and nothing else is affected.

### Checked

| Check | Result |
|---|---|
| Full 30-form packet, 415 pages, printed from this workstation in Chromium 141 | 31 bookmarks, each on the page its form starts; 30 page numbers |
| Every printed number against its form's destination page (pypdf, independently) | all 30 equal |
| Every page other than the contents, content streams and links, by SHA-256 | identical, all 413 |
| Text extracted from pages 3–415 before and after (pdftotext) | identical |
| Structure of the written file (qpdf `--check`) | no errors |
| Bookmarks read back by an independent PDF library (pypdf) | 31, correct pages and titles |
| Document title, metadata and the contents links | kept |
| Time to finish and check the 415-page packet | under half a second |
| In the workstation: choose, drop, save, the command box, a 1024px window | pass |
| A PDF that is not a packet, a file that is not a PDF, pdf-lib missing | each refused with a message saying what to do |
| A packet from v21.1, built before the gutter | bookmarked; numbered where its entries left room |

`test-pdf-tools.js` belongs with the harness in `NBH-Forms-Tests`:

```bash
node test-pdf-tools.js ../NBH-Workstation                 # 64 checks, no browser
node test-pdf-tools.js ../NBH-Workstation packet.pdf      # also a real saved packet
```

Point it at a packet you have saved yourself from the print dialog. The packets
above were produced through Chromium's own PDF output from a script, which is the
same pipeline the print dialog uses, but a file from your own machine is the one
that counts.

## Fifth pass, September 2026 — a quality check of everything

Every form was loaded on its own and inside the workstation, driven, audited and
printed again; the full 30-form packet was flipped through page by page, its
type sizes measured, and the workstation itself was checked from the keyboard
at seven window widths. What that found, and what changed:

### On paper

**Entries printed on top of each other in the packet — every packet.** A field
that grows as it is typed into carries its height on screen as an inline style.
The packet copied that style onto the text it prints in the field's place, so on
paper, at a different width and in a different font, the text was locked to the
screen's one-line height and the lines piled up. Every implementation step on
every TD-1 component card printed as one unreadable band; SP-1's operational
definition, example and non-example printed over one another. The standalone
prints were fine, which is why it was not seen. The height is now dropped when
the field becomes text. **TD-1 is the treatment plan; this one mattered.**

**A long value took its label's room.** The packet let a printed value size to
its content before sharing a row, which is the opposite of what a form does when
it prints on its own; "Reinforcer magnitude" came out as "Reinforce" under its
own value. The packet now does what the form does: the value starts from nothing
and grows into the room the label leaves.

**The section bar is gone.** Each section opened with a navy bar naming the form
above the form's own letterhead, which names the form. The bar cost the first
page of every section its height, so a sheet that filled a page on its own
spilled its last rows onto a sheet of their own. Sections now open with the
letterhead, exactly as the form prints standalone; the back-links from each
section to the contents went with the bar, and the bookmark panel does that job
now. (Naming every page with a per-section running header was built and tested
first, and dropped: under a named page Chromium 141 moves table footers and any
other unbreakable block near the foot of a page onto the next one even when it
fits, which cost the packet nineteen pages. The test that shows it is a table
with a `<tfoot>` inside a `page:`-named section.)

**ABC-1's antecedent-to-consequence matrix printed at 63%,** its cells at 5pt,
because with its thirteen headings running across, the longest word in each
heading set its column's width. On paper the headings now run upward, a column
is as wide as its numbers, and the matrix prints at full size, its heading row
repeating where it crosses a page.

**IA-1 and PA-1 printed their charts two abreast.** Each chart had half the page,
its axis labels came out at 4pt, and IA-1's legend text was cut off ("Parent
(simula"). They print one below the other now, at full width, with labels near
8pt, still together on one page.

**Type sizes, measured.** Across all 415 pages the body text is 8–10pt. What
remains under 7pt is chart tick labels at 6pt and RM-1's citations column, both
by design. Rotated axis titles are reported by measuring tools at 1.5–2pt; that
is the tool misreading rotated glyphs, and they print at 8pt.

**Short pages.** About 35 pages carry only a form page's last lines: a sheet full
on its own has slightly less room in the packet, whose running header and footer
take 0.24in more than the form's own margins, so its last rows go on to a sheet
of their own. Matching the margins was tried: it removed nine pages and created
two completely blank ones, because a sheet that then fitted exactly tipped its
trailing margin over the edge. Blank pages are worse than short ones, so the
margins stay. No page in the packet is blank.

**Chrome's own headers and footers** (the print dialog's tick box, on by
default) do not print over the packet's; the packet's running header wins.

### On screen

**The form list works from the keyboard.** It was a listbox whose options each
held a checkbox — a control inside a control, which screen readers cannot
resolve — and it had no key that opened anything: a keyboard user could open a
form only through ⌘K. Each row is now a checkbox and a real button carrying the
row's text. One button in the list is in the tab order (the open form's, or the
first), ↑ and ↓ move between forms and open them, Enter opens, Space ticks.
Nothing visible changed.

**The list no longer drops focus.** It was rebuilt from scratch on every status
reply — every four seconds for each open form — which threw keyboard focus out
of it. It is now replaced only when something in it changed, and focus is put
back on the same control afterwards.

**Dialogs.** A Help body long enough to scroll can be reached from the keyboard;
the dialog carries its title as its accessible name; the filename in the bar
above a form is 5:1 against white (it was the muted grey at 60% opacity, which
is not).

**Four forms showed their masthead inside the workstation** — ABC-1, DD-1, DT-1
and VI-1, the four without a toolbar — including the note that nothing is stored
in the browser, which is not true inside the workstation. The code that
collapses it ran only after checking for a toolbar. It runs first now. Three of
those forms keep their buttons in the masthead rather than in a toolbar, and the
first fix took the buttons with it: opened in the workstation, DD-1, DT-1 and
VI-1 had no *Load simulation*, *Save data* or *Clear all*, which a packet printed
from that build showed as three forms without data. Framed, those three now drop
the logo, title, description and note and keep the button row as a slim bar
under the crumb. Every form was then opened in the workstation and its *Load
simulation* pressed by script: all 30 fill. ABC-1's is on its *Data file* tab,
in the card "Try it with simulated data", where that form keeps its file actions.

**ABC-1's heat map** had a band of mid-tones (a 67% cell) on which neither white
nor dark text reached 4.5:1. The shading is now two bands split at one half —
light under dark text up to 50%, dark enough for white text past it — which is
also the line that matters in a conditional probability. Its charts, marked as
images, now carry a name from the card they sit in.

**A file dropped on the page** — a PDF let go a little wide of the Finish
dialog, a case file dragged onto the list — no longer replaces the workstation.

**Diagnostics** gains two rows: whether this browser draws the packet's page
headers (they need Chrome or Edge 131 or later; anything else prints the pages
without the practice, the student and "Page N of M", and nothing else warns),
and whether the two files Finish PDF needs are in the folder.

### What was checked

| Check | Result |
|---|---|
| All 30 forms opened standalone, simulation run, script errors | none |
| WCAG 2.1 A and AA (axe-core 4), all 30 forms after simulation, and the shell with each dialog open | 30/30 and 4/4 clean |
| Horizontal overflow at 1024 and 1366px, buttons under 24px, in all 30 | none |
| Bridge, packet delivery and student name, all 30 inside the workstation | 30/30 |
| The masthead collapsed inside the workstation, all 30; header buttons kept where a form has them | 30/30 |
| Load simulation visible and working inside the workstation, all 30 | 30/30 |
| Keyboard: Tab, Enter, ↑↓, Space in the list; focus through a status refresh; no redraw over 8 seconds while nothing changed | pass |
| Full 30-form packet | 415 pages, no blank pages, 30 sections, contents links working |
| Every form's words in the packet before and after the print changes | none lost |
| Every page of the packet looked at, as contact sheets | pass |
| Type under 6.5pt on any page, upright text | chart labels and RM-1's citations only |
| Finish PDF: 74 checks in node, 24 in the browser | pass |
| Standalone prints of the seven forms touched | no errors |

## The toolbar now matches the page

The control bar spanned the whole window while the sheet below it is a fixed page
width, so on a wide screen the bar was half again as wide as the document it
belongs to, and the document read as the smaller of the two things on screen.

Each toolbar now takes the width of its own form's sheet and centres on it — 8.5in
for twenty-five forms, and their own widths for the four built wider. Narrowing a
bar makes its controls wrap onto more rows, so the spacing was tightened to pay
for it: on the busiest form the toolbar is now **179px tall against 208px before**,
so it is page-width *and* shorter than it was. Print is unaffected; the toolbar
never printed.

## Fit to window

A sheet is 8.5in wide because it is a page. On a monitor that left the document
filling about two-thirds of the frame, with roughly 190px of dead space either side
and 15px type — readable only by reaching for browser zoom.

Each form now scales itself up to the width of the window, **capped at 150%**. The
whole document scales — masthead, toolbar and sheet together — so they stay the
same width as each other. On a 1200px frame the sheet renders at about 1130px,
**94% of the frame** instead of 68%.

A **Fit to window** button sits at the end of the toolbar, showing the current
scale, and toggles to **Actual size**. The choice is remembered.

Three things it deliberately does not do:

- **It does not touch printing.** The scale is an inline zoom on the root element,
  removed before the print layout is taken and restored afterwards, so it never
  reaches the stylesheet the packet collects. Verified: a form printed with fit on
  produces exactly the type sizes it did before this existed, and the assembled
  packet carries no zoom at all.
- **It does not scale a small window.** Below roughly 900px nothing happens.
- **It does not push content off the edge.** Measuring the widest element cannot
  catch every way a form can be wide — TD-1 has a table wider than its own sheet —
  so after scaling it checks the result and steps back until nothing overflows. A
  form that will not fit stays at its own size rather than being clipped.

## Screen layout, corrected

The previous version scaled the whole document to fit the window. That made the
toolbar 39 per cent larger along with the sheet, so it gave back in height what it
had gained in width — the complaint it was meant to answer.

Three changes:

**Only the sheet scales.** The toolbar and masthead keep their own size and are set
to the sheet's rendered width, so the three still line up.

**The toolbar collapses.** Six groups of controls stacked up before any form content
appeared. The bar now shows the view tabs and two small buttons — **More controls**
and **Fit** — with everything else one click away. The choice is remembered.

**The form's masthead is hidden inside the workstation.** It was 318px of logo,
form id, title, a paragraph of description and a privacy note — and the crumb bar
directly above the frame already gives the title, the form id and the filename.
Standalone the masthead stays; framed it goes. It was already `display:none` in
print, so nothing printed changes.

That last one also removed a line that had stopped being true. "Nothing is stored
in the browser" is correct for a form opened on its own and wrong inside the
workstation, where autosave keeps a working copy. The workstation's own Help is
where autosave is explained.

Measured inside the workstation, on a 741px-tall frame:

| | before | after |
|---|---|---|
| chrome above the form | 378px | 60px |
| left for the form | 363px (49%) | 681px (92%) |

The busiest form, TD-1, goes from 39% to 82% — its view tabs wrap onto two rows.

## Two defects found while verifying this

**Unfilled dates were invisible, not absent.** The packet hid date placeholders
with `color:transparent`, which removes them from view but leaves "mm/dd/yyyy" in
the PDF text layer — 19 pages of it in a full packet, where copying text or a
screen reader still picks it up. An unfilled date, month or time control is now
replaced with an empty span carrying its styling, so the line to write on stays and
the placeholder leaves the document.

**The wrong-student strip lingered after a correction.** It was repainted on a
2.5-second timer, so a corrected name left the warning on screen for several
seconds after the form and the bar agreed. It now repaints the moment the answer
changes.

## The test harness

The harness is kept with the build rather than in this folder; it was run against
this release. For reference, it runs as:

```bash
cd NBH-Forms-Tests
npm install
node run-tests.js ../NBH-Workstation
```

`forms.json` now records every form's real simulator button, read off the files
rather than guessed: 24 use `#simBtn`, DT-1 and VI-1 use `#btnSim`, ABC-1 uses
`#load-demo`, and DD-1 uses `#btnLoadExample`. The harness also falls back to
finding the button by its label, so a form rebuilt with a different id still gets
tested and the output says which button it used.

Puppeteer downloads its own copy of Chrome on install. If your network blocks
that, point at a browser you already have:

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

The consistency checks run with no browser at all, so a partial setup still
catches the most common breakages.

## Two browser notes

**Safari** is stricter than Chrome about local files loading other local files in
frames. If the forms are all present and every one still reports *Not answering*,
that is Safari, not the folder: turn on Develop → Developer Settings → Disable
Local File Restrictions, or open `index.html` in Chrome.

**Pop-ups** must be allowed for the master print, which opens the assembled
document in a new window. Diagnostics has a one-click test for this.

## Checking the folder yourself

Diagnostics → **Check all 30 files are here** loads every form in the background
and lists any that did not answer, with the filename it was looking for. Opening a
single form does the same on its own: the header bar shows the filename it loaded,
and after five seconds without an answer it says so.

## Filenames

Six forms kept their original names and do not follow the `XX-1_..._v2026-09`
pattern. If you ever rebuild or rename one, rename the file rather than editing
`index.html`, since `forms.json` uses the same names.

Three forms were added after the original 27, and follow the same pattern:
`GB-1_Goal-and-Objective-Builder_v2026-09.html`,
`EB-1_Essentials-Brief-Limited-Contact-Staff_v2026-09.html`, and
`OB-1_Direct-Observation-Record_v2026-09.html`.

| Form | Filename |
|---|---|
| ABC-1 | `ABC_Recording_Conditional_Probability_Analysis.html` |
| SP-1 | `Scatterplot_Pattern_Analysis.html` |
| DD-1 | `Daily_Behavior_Data_and_Visual_Analysis.html` |
| RA-1 | `Reinforcer_Assessment_Protocol.html` |
| VI-1 | `Variable_Isolation_Protocol.html` |
| DT-1 | `Delay-Tolerance-Protocol-Toolkit.html` |

The other 25 are `XX-1_Name-With-Hyphens_v2026-09.html`.

## Hosted behind a server that injects markup (v21.5)

GoDaddy's cPanel hosting (and some other hosts and CDNs) inserts a snippet of
its own before the first `</head>`, `</body>` and `</html>` in every HTML page
it serves. In v21.4 the first `</body></html>` in index.html was not the end of
the page: it sat inside a JavaScript string (the "Building the packet" progress
window written with document.write, and the master print template). The
injected snippet ended that script early and the rest of it rendered as text.

Fix: those four tags are written as `<\/head>`, `<\/body>`, `<\/html>` in the
JavaScript. Same string at runtime, invisible to the server's scanner. The 30
form files each contain exactly one real `</head>`, `</body>` and `</html>` and
needed no change.

Test: `node qa/inject-server.js NBH-Workstation 8099` serves the folder while
injecting a marker script at those three points; `URL=http://localhost:8099/
node qa/buttons-check-url.js NBH-Workstation` then opens every form through it
and `node qa/inject-check.js` builds a master print through it.

## Diagnostics on an iPad or iPhone (v21.6)

Chrome and Edge on iOS and iPadOS report Chrome-like version numbers (`CriOS/140`,
`EdgiOS/140`) but are WebKit underneath, which does not print the `@page` margin
boxes that carry the packet's running header. v21.5 counted `CriOS` as Chrome,
so Diagnostics told Chrome on an iPad that page headers would print. v21.6
treats any iOS or iPadOS browser as WebKit - including an iPad requesting
desktop sites, which sends a Mac user agent but reports touch points - and says
to build the master print on a computer. Only Diagnostics used this check.

Test: `node qa/diag-ua.js NBH-Workstation` runs the row under seven identities
(desktop Chromium, Chrome, Edge and desktop-mode Safari on iPad, Safari on a
Mac, Chrome 120 and Edge 140 without UA hints).

## Packaging for hosting (v21.7)

No code change; index.html is the same as in 21.6. Two packaging changes, both
so that updating a hosted copy is simply "upload the zip, Extract":

- **No `.htaccess` in the zip.** On cPanel, *Directory Privacy* writes the
  folder's password rules into that folder's `.htaccess`. A zip carrying its
  own `.htaccess` replaces the file on extraction and switches the password
  off without any warning. The file is now created once on the server, from
  the text in HOSTING.md, and the package never overwrites it.
- **No folder inside the zip.** The files sit at the zip's top level, so
  extracting into the hosted folder replaces the old files in place instead of
  creating a subfolder to move out. On a Mac or PC, opening the zip still
  gives a folder (named after the zip) with index.html inside.

## White heading (v21.8)

The workstation's top heading is white with dark lettering (it was navy with
white), matching the heading every form shows when opened on its own. Only the
heading changed: the student bar and buttons beneath it keep their dark slate,
which also gives the white heading its lower edge. The logo is untouched. The
"Use these details" button in the heading and its keyboard focus ring were
restyled for the white background. CSS only, in index.html.

Test: `node qa/header-check.js NBH-Workstation` renders the heading with no
student, with a name offered from an open form, and with the name taken, at
1440 and 1180 px, and runs axe-core's WCAG 2.1 A/AA rules on it in each state.

## Royal Palm School edition (from v21.8)

A second edition of the same workstation, branded for Royal Palm School and hosted
in its own folder (`public_html/workstation-rps`) beside this one, with its own
password. It is generated from this edition on every release - never edited by
hand - so the two stay identical apart from:

- **Logo** (133 places) and **tab icon.** The lockup is the school's mascot logo,
  whole and unaltered, full height at the left of a 900 x 355 white canvas (the
  Newsome logo's 2.537:1 proportions, so no layout moves), with "Royal Palm" /
  "School" on two equal lines beside it in Bitstream Charter Regular, #2630B0 (a
  deeper shade of the mascot's own blue, #424AFE). Two equal lines were chosen
  over "Royal Palm" + small spaced "SCHOOL" because the small line vanishes at the
  30 px heading size. Saved as WebP quality 90 (32 KB; PNG-8 banded the glow,
  PNG-24 was 134 KB x 133 copies). Tab icon: a 64 px crop of the star's face on
  white.
- **Name** where it is printed or shown: page running header (30 forms + master
  print), page titles, logo alt text, the cover note, and the DM-1 form-set note.
- **Autosave keys** `rps.ws.autosave.v1` / `rps.ws.autosave.on`. Both editions
  live on one website and a browser keeps one localStorage per website, so with
  the same keys each would offer to restore the other's work and overwrite it.
  `qa/autosave-separation.js` serves both from one origin and proves they stay
  apart - and, as a control, that a plain copy with only the logo changed would
  not.

Left as they are, on purpose: Josh's name as example text and in simulated data
(51 x "Joshua Newsome, M.A., BCBA", 34 x "J. Newsome", 2 x "Mr. Newsome" - he is
the school's BCBA; make them neutral if other staff will use it), the forms' view
preferences `nbh.fitScreen` / `nbh.toolbarCompact` (shared view settings are
harmless), internal names (`nbh-` classes, nbh-pdf-tools.js), and the invisible
CSS comment naming the form system's origin.

**Rebuilding for each release.** The lockup and icon travel inside the previous
school edition's index.html; recover them, then run the script:

    import re, base64
    s = open('RPS-Workstation/index.html', encoding='utf-8').read()
    open('rps-lockup.webp', 'wb').write(base64.b64decode(re.search(
        r'id="logo" alt="[^"]*" src="data:image/webp;base64,([^"]+)"', s).group(1)))
    open('rps-favicon.png', 'wb').write(base64.b64decode(re.search(
        r'rel="icon" type="image/png" href="data:image/png;base64,([^"]+)"', s).group(1)))

    python3 build-rps.py NBH-Workstation RPS-Workstation rps-lockup.webp rps-favicon.png

It stops if any replacement count differs from what is expected - the sign that
the source changed in a way the edition needs looked at. Zip the output flat, as
`RPS-Workstation-v<same version>.zip`, and run the usual checks on it plus
`qa/autosave-separation.js`.

The script (`build-rps.py`):

    #!/usr/bin/env python3
    """Build the Royal Palm School edition of the workstation from the Newsome Behavioral Health one.

    Same forms, same code. Changed: the logo (133 places), the tab icon, the organisation name where it
    is printed or shown, and the autosave keys - both editions live on one website, and a browser keeps
    one localStorage per website, so without its own keys each would offer to restore the other's work.

    usage: build-rps.py <NBH folder> <output folder> <lockup .webp> <favicon .png>
    """
    import os, re, sys, shutil, base64
    SRC, OUT, LOCKUP, FAVICON = sys.argv[1:5]
    NAME = 'Royal Palm School'
    shutil.rmtree(OUT, ignore_errors=True); shutil.copytree(SRC, OUT)
    idx = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    old_logo = re.search(r'<img id="logo" alt="[^"]*" src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
    old_fav = re.search(r'<link rel="icon" type="image/png" href="(data:image/png;base64,[A-Za-z0-9+/=]+)"', idx).group(1)
    new_logo = 'data:image/webp;base64,' + base64.b64encode(open(LOCKUP, 'rb').read()).decode()
    new_fav = 'data:image/png;base64,' + base64.b64encode(open(FAVICON, 'rb').read()).decode()

    # (old, new, how many times it must be replaced across all files)
    EXPECT = [
      (old_logo, new_logo, 133),
      (old_fav, new_fav, 1),
      ('alt="Newsome Behavioral Health"', f'alt="{NAME}"', 134),   # 133 logos + the packet cover's
      ('@top-left{content:"Newsome Behavioral Health"', f'@top-left{{content:"{NAME}"', 31),
      (' · Newsome Behavioral Health</title>', f' · {NAME}</title>', 31),
      ('in the Newsome Behavioral Health packet', f'in the {NAME} packet', 1),
      ('Form IDs refer to the Newsome Behavioral Health FBA/BIP form set.', f'Form IDs refer to the {NAME} FBA/BIP form set.', 1),
      ("const AUTO={key:'nbh.ws.autosave.v1',pref:'nbh.ws.autosave.on'", "const AUTO={key:'rps.ws.autosave.v1',pref:'rps.ws.autosave.on'", 1),
    ]
    done = [0] * len(EXPECT)
    for fn in sorted(os.listdir(OUT)):
        if not fn.endswith('.html'): continue
        p = os.path.join(OUT, fn); s = open(p, encoding='utf-8').read()
        for i, (a, b, _) in enumerate(EXPECT):
            n = s.count(a); done[i] += n; s = s.replace(a, b)
        open(p, 'w', encoding='utf-8').write(s)
    bad = [(EXPECT[i][0][:60], done[i], EXPECT[i][2]) for i in range(len(EXPECT)) if done[i] != EXPECT[i][2]]
    if bad:
        sys.exit('replacement counts differ from what was expected - the source changed; check before shipping:\n' +
                 '\n'.join(f'  {a!r}: replaced {n}, expected {e}' for a, n, e in bad))

    # anything still naming the practice in a way a user sees
    left = []
    for fn in sorted(os.listdir(OUT)):
        if fn.endswith('.html'):
            for m in re.finditer(r'.{0,40}Newsome Behavioral Health.{0,40}', open(os.path.join(OUT, fn), encoding='utf-8').read()):
                if 'shared form system' not in m.group(0): left.append((fn, m.group(0)))
    if left:
        sys.exit('practice name still visible:\n' + '\n'.join(f'  {f}: {t}' for f, t in left))

    # the documents that travel with it
    rd = os.path.join(OUT, 'README.txt'); s = open(rd, encoding='utf-8').read()
    s = s.replace('NBH FBA/BIP Workstation\n=======================',
      'FBA/BIP Workstation - Royal Palm School\n=======================================\n\n'
      'This is the Royal Palm School edition. It is the same workstation and the same 30\n'
      'forms as the Newsome Behavioral Health edition; only the logo and name differ, and\n'
      'it keeps its own autosave, so both can be used in one browser without mixing.', 1)
    open(rd, 'w', encoding='utf-8').write(s)
    hd = os.path.join(OUT, 'HOSTING.md'); s = open(hd, encoding='utf-8').read()
    s = re.sub(r'`workstation`', '`workstation-rps`', s)
    s = re.sub(r'public_html/workstation(?![-\w])', 'public_html/workstation-rps', s)
    s = re.sub(r'/workstation/', '/workstation-rps/', s)
    s = s.replace('# Putting the workstation on a website\n', '# Putting the workstation on a website\n\n'
      '*Royal Palm School edition.* It lives in its own folder, `workstation-rps`, beside the\n'
      'Newsome Behavioral Health one in `workstation`, with its own password; its autosave is\n'
      'kept apart from the other edition\'s. Each folder needs its own `.htaccess` (step 4).\n', 1)
    open(hd, 'w', encoding='utf-8').write(s)
    print('built', OUT, '-', ', '.join(f'{n}x' for n in done))

## Import Google Forms responses into IA-1 (v21.9)

Josh collects the FAST, QABF and PBQ on Google Forms; the responses spreadsheet
of each form has a *Form Responses* tab (one row per informant) and a *Final
Results* tab that totals functions and counts agreements. IA-1 already does that
scoring, so the sheet now feeds the worksheet instead of being retyped.

**Toolbar → Import Google Forms responses.** Paste the whole Form Responses tab
(Google Sheets copies it as tab-separated text; quoted cells may hold newlines)
or choose a CSV from File → Download. Nothing is fetched from Google: the data
travels through the clipboard or a file, like everything else in the form.

What the reader does:
- Finds the header row (the one holding "Timestamp") and keeps only rows with a
  timestamp, so a Final Results tab pasted by mistake still yields the responses
  and none of its formula rows.
- Finds runs of numbered questions (1, 2, 3 …, unnumbered columns between them
  skipped - the FAST has a free-text column between items 14 and 15) and picks
  the run whose first question is the instrument's item 1 (FAST: "not receiving
  attention"; QABF: "engages in the behavior to get attention"; PBQ: "occur and
  persist when you make a request"; MAS: "occur continuously"). Without a match,
  the run length decides (25 QABF, 15 or 18 PBQ); sixteen items are FAST or MAS
  by which scale reads the answers, and the dialog asks only when neither does.
- Values: FAST Yes/No/N/A → Y/N/NA; QABF 0–3, "X / does not apply" → blank,
  never/rarely/sometimes/often → 0–3; PBQ 0–6 or Never/10%/25%/50%/75%/90%/
  Always; MAS 0–6 or its seven labels. A leading digit wins ("1 - Rarely" → 1).
  A cell it cannot read is left blank and counted in the banner.
- Each ticked response becomes informant A, B, C … (five at most). The
  informant table takes name, relationship, months known ("2 years" → 24),
  daily contact and setting from the sheet's own questions, never writing a
  blank over an existing entry. For the FAST, the open-ended answers (most and
  least likely situations, before, after, current treatments) go into Section
  1, joined by informant code, only where the field is empty.
- The informant count follows the responses unless later columns already hold
  something from another instrument.

**PBQ in two versions.** Josh's PBQ form is the 18-item version that adds a
gain-item / activity scale (items 3, 10, 18) and renumbers the rest; IA-1 had
the published 15-item map. The PBQ sheet now has a *Questionnaire version*
select (`pbq.ver`, saved with the data): 15 items - Peer escape 3, 10, 14; Peer
attention 4, 7, 11; Adult escape 1, 9, 13; Adult attention 2, 6, 12; Setting
events 5, 8, 15 - or 18 items - Adult escape 1, 11, 15; Adult attention 2, 7,
14; Gain item or activity 3, 10, 18; Peer escape 4, 12, 16; Peer attention 5, 8,
13; Setting events 6, 9, 17 (the map in Josh's sheet, its one mislabelled
column corrected from the item wording). The import sets the version from the
run length; `restore()` sets it before rendering the grid so an 18-row save
opens as 18 rows, standalone or through the workstation's case and autosave.
Clear all and the simulator return to 15.

Tests: `node qa/ia1-gforms-check.js NBH-Workstation` (standalone: the four
instruments, the value maps, informant fields, Section 1, the Final Results
paste, save / clear / open with version 18, the manual switch, the simulator);
`node qa/ia1-gforms-ws.js NBH-Workstation` (framed: import, autosave, reload,
restore - note the workstation only autosaves after the form's next status
report, every 4 s); `node qa/gf-axe.js` (the dialog under axe, Escape, focus).
The patch that made the change is `patch-ia1-gforms.py`, kept beside the tests.


## SP-1 Scatter Plot: taller rows, several behaviors, shaded-or-blank (v21.10)

Three changes from a printed sample that looked cramped.

**Rows fill the page.** The rows were a fixed 22px on screen and 19px on paper,
which left the lower third of a printed school-day sheet empty. `rowHeight()`
now works out what a letter page has to give: the parts of the sheet that are
not rows (letterhead, band, identity fields, definitions, code key, column
headings, totals, legend, citation) are known sizes on paper, entries that wrap
add a line each (estimated from their length, generously), and the rows share
the rest, between 16 and 34px. A 16-row school day prints at 26–27px (about
0.28in), a 24-hour sheet keeps its old sizes. The estimate is made twice for a
record spread over several sheets of days - the first sheet carries the header
and definitions, the last carries the legend - and the smaller answer wins, so
every sheet stays whole on its page. The workstation's packet has deeper page
margins and gets a slightly smaller page to work with (`"packet"` mode). On
paper the legend is one line, the "How to mark" hint and the legend heading do
not print, and the code table prints only when codes are switched on (it used
to print "A - not named · B - not named" under every sheet). The Date line and
the totals rows keep 24px rather than growing with the rows. The pattern
summary's two charts are a little shorter on paper so its citation no longer
spills onto a page of its own.

**Several behaviors, each on its own sheet.** Above the identity fields a
screen-only bar lists the behaviors in the record (`#behBar`): a button per
behavior, *+ Add a behavior*, and *Remove* (hidden while there is only one).
Times, days, dates, codes and the client's details are shared; each behavior
keeps its own name, definition, example, non-example, IOA and marks. In the
code, `state.meta` and `state.cells` stay the live surfaces for the behavior
being edited, so every existing function works unchanged; `state.behaviors[]`
holds all of them and `commitBeh()` writes the current one back before anything
switches (`useBeh`), saves (`serialize`), or prints. The band reads *behavior 2
of 3 - sheet 1 of 2*.

Printing every behavior: `buildPrintSet()` steps through the behaviors, renders
each, and takes a static copy of its sheets (`staticClone`: values copied into
attributes, ids stripped, screen-only parts removed, the row and column sizes
carried as inline CSS variables since the packet does not carry `<html>`'s), then
that behavior's pattern summary and control chart when it has marks - an empty
analysis page carried nothing, so it is no longer printed. On the form's own
print (`beforeprint`, the Print button, and the print media query as a
fallback) the copies go into `#spPrint` and the live sheets are hidden by
`html.sp-printall`; afterwards `endPrint()` clears them. The workstation's
`collect` verb in SP-1's bridge asks `window.spPrintSet('packet')` for the same
copies and wraps each in its own `.nbh-page`, so the packet paginates them
itself. The simulation now loads two behaviors (aggression and elopement) over
the same fifteen days.

Files: `Save data` writes `{meta, cfg, codes, behaviors:[{meta,cells}], cur}`;
`Open data` (and the workstation's case and autosave, which go through it)
reads that or the older shape with the marks at the top level and the behavior
in `meta`, which becomes behavior 1. The bridge's fingerprint now includes the
marks (`window.nbhExtraSig`): a tapped cell is a button, not a field, so a
sheet marked by tapping alone did not register as changed for autosave.

**Shaded or blank.** Toolbar → *Marking*: *Low / high rate* (as before: slash
below the cutoff, shaded at or above) or *Shaded or blank* (`cfg.levels` = 1):
any mark shows as a shaded cell, the cutoff is disabled, a tap toggles blank ↔
shaded, keys 0 and 1 clear and shade. The mark itself is kept as entered, so
switching the distinction back on brings the slashes back. Without the
distinction the sheet drops its "of which high rate" row, the legend its slash
line, the readout and summary their high-rate counts, the ranked table its High
column; the summary keys read *Occurred*; and the control chart scores each
interval 0 / 1 (`score()`) rather than 0 / 1 / 2, which its caption and method
note say. The citation's closing sentence changes to say the sheet records
occurrence only. CSV writes *occurred* in place of *low* / *high*.

Tests: `node qa/sp1-ws.js NBH-Workstation` (framed: the simulation's two
behaviors plus a third added by hand, autosave, reload, restore; the packet's
12 pages in order; a v21.9 file; shaded-or-blank round trip through Save data);
`node qa/sp/print-sp.js <form> out.pdf school|school-one|default|sim` (page
counts and measurements of the form's own print); `node qa/sp/sp-axe.js` (axe
on the bar, toolbar and sheet; keyboard switching). The patch is
`patch-sp1-v21_10.py`, kept beside the tests, applied to the v21.9 form.

## The one-file edition and HTML case files (v21.11)

Josh asked for a way to save a case *into* the HTML, so that a student's case
opens by itself instead of: open the workstation, find the case file, Open
case. `NBH-Workstation.html` (and `RPS-Workstation.html`) is the whole
workstation in one file - `index.html` with the 30 forms and the two PDF-tool
scripts packed inside it - and its **Save case** writes the case the same way:
one file, `Student.case.html`, that is the workstation again with that case in
it. Double-click it and the forms open filled. It needs nothing beside it, no
website, no password, no autosave, and keeps to the rule that student data
lives in a file on the district drive and nowhere else. About 2.5 MB each.

How the file is built (`build-single.py <folder> <out.html>`): four
`<script type="text/plain">` blocks at the top of the body - the shared logo
once (every form carried it several times; 132 copies of 56 KB was most of the
folder's 12 MB), the 30 forms as JSON with the logo cut out, the two PDF
scripts, and a copy of `index.html` itself - the last three gzip-compressed and
base64-encoded (`DecompressionStream` unpacks them in about 100 ms). A case
adds a fifth block, `<script type="application/json" id="nbh-case">`, holding
exactly what a JSON case file holds plus an `id`; `</` inside it is written
`<\/`, which JSON reads as the same character, so no entry can end the block
early. The blocks sit first in the body because the page's script runs as it
is parsed and would not see blocks placed after it.

What `index.html` does differently when the blocks are present (`EMBED`, set
once at the top of the script; every change is inert in the folder edition):
- `loadFrame()` gives a frame `srcdoc` from the pack instead of `src`, for open
  forms, the master print's hidden frames and Diagnostics' file check. It is
  set synchronously once the pack is unpacked, because an empty frame fires a
  load event of its own that `loadCase()` would take for the form arriving.
  `srcdoc` frames share the page's origin, so *Print this form* still reaches
  them from a `file://` page. *Open in its own tab* opens a blob URL.
- `loadScript()` injects the packed PDF scripts, so Finish PDF works.
- **Save case** builds the case file (`caseHtml()`: the packed copy of
  `index.html`, the four blocks copied verbatim from the page, the case block)
  and writes it. In Chrome and Edge it uses the File System Access API: the
  first save in a session shows the save dialog (suggesting
  `Student.case.html`), and every later save writes back into that file
  without asking (`state.caseHandle`). The picker is called *before* the
  snapshots are gathered, while the click still counts as the user's own.
  Elsewhere (Firefox, Safari) the file downloads and the message says to move
  it. The API is exposed on `file://` pages in Chromium 141 (checked).
- **Open case** accepts a `.case.html` as well as JSON (`parseCase()`), in
  both editions. In the one-file edition it uses the open-file picker so the
  chosen `.case.html` becomes the file later saves go back into.
- **Boot** (`bootEmbedded()`): a case inside the file is loaded without a
  prompt. Autosave is keyed per case (`AUTO.key` + `.` + case id) so two case
  files opened from `file://`, which share one localStorage, never offer each
  other's work; a working copy older than the file's own save time is dropped,
  one newer than it (a crash between saves) is offered as before.

Left as they are: the folder edition's JSON case files (still written by the
folder edition's Save case, still opened by both); the hosted workstation,
which needs no change and could even serve the one-file build (the blocks
carry nothing GoDaddy's injector looks for). The one-file builds are not in
the zips: they are made from each finished folder after `build-rps.py`, whose
replacement counts would otherwise see the packed logo, and delivered beside
them. Rebuild them for every release.

Tests: `node qa/single-check.js deliver/NBH-Workstation.html NBH-Workstation`
(and the RPS pair): unpack, forms answer, MT-1 and SP-1 inside the file, save
with a stand-in picker (first save prompts, second does not), the written case
file opens itself with the forms filled and no prompt, re-saves at the same
size, builds a master print, opens in the folder edition, and downloads where
there is no picker. `qa/sp/single-extra.js` covers Finish PDF's scripts and the
Diagnostics file check inside the file.

## MT-1: capture from the sheet, notes into the log, clear for the next session (v21.11)

Three things from running it in a classroom. **Capture this session to the
log** now sits on the data sheet under the notes, beside **Clear sheet for the
next session**; the log tab's *Capture current sheet* does the same thing and
switches to the log. A captured row carries the sheet's **Condition this
session** (a new field beside a **Change at this session** select, both
printed with the sheet) into *Condition or change label*, the change marker
into *Change at this session*, and the sheet's **Notes** into *Note* - so "response
blocking used this session" is on the log where the graph is read, not only
on the sheet it was scored on. The change marker clears after a capture (a
phase change belongs to one session); the condition label stays for the next.
A first capture into an empty log fills the placeholder row rather than
leaving a blank one above it.

**Clear sheet for the next session** empties the marks, the IOA marks, the
start time, the change marker and the notes; the student, behavior, method,
ratio, date, condition and the whole session log stay. **Clear all** still
clears everything, and its prompt now says so and points to the other button.
`patch-mt1-v21_11.py`; test `node qa/sp/mt1-check.js`.

## DT-1: the walkthrough tab (v21.12)

Tab 10, *Walkthrough*, is the interactive companion to the delay assessments
folded into the form so it travels with it and works offline: the adult and
the student drawn at the table for every procedure in Tab 2, the two probes
in Tab 3 and a training trial from Tab 5, stepped through with the exact
words and what the student does; the order the assessments run in and why;
seventeen "your call" moments (the side bias, the hit at 12 s into a delay,
the pushed-away paper, the re-probe with a bigger reward ...) with the rule
behind each answer; a "score this trial" drill against the observer's key;
and the terms as the sheets use them. Links at the top of Tabs 2, 3 and 5
open it at the matching procedure.

**Print the job aids** (a button on the tab) prints one sheet per procedure:
setup, script, the drawn steps, what to record, the decision, and an
observer's integrity checklist for that procedure (Tab 7's checklist covers
training sessions; the assessments had none). The tab itself never prints
with the form and never enters a workstation packet: it carries `noprint`,
which the shell strips from the packet, and its own `@media print` rule hides
it unless `body.wk-printing` is set, in which case only the job aids print.

It is built, not hand-edited: `build-dt1-walkthrough.py <walkthrough page>
<pristine DT-1> <output>` lifts the scene engine, stories, drills, flow and
terms from the published walkthrough page (the source of truth), scopes its
CSS under `#p10` with the form's own brand tokens, prefixes its ids with
`wk-`, leaves out the page's live trial players (inside the form the real
sheets are the other tabs), and adds the print builder and the cross-links.
The tab holds no form controls, so Save data, the case file and autosave
are untouched by it. `qa/sp/dt1-tab-check.js` (the tab, the drills, the print
switch, the job aids, the simulation still filling the form) and
`qa/sp/dt1-ws-check.js` (axe on the tab, tap targets, the packet excludes
it) cover it.

## AD-1: accumulated vs. distributed reinforcement (v21.13)

Form 31, listed after DT-1. It answers one clinical question for one student:
should reinforcement arrive in small amounts right after each response
(distributed), or be banked across the work and delivered in one uninterrupted
block at the end (accumulated, with or without tokens)? It tests what each
arrangement does to work, learning and problem behavior, asks the student which
one they choose, counts what each one costs in time, and writes the chosen
arrangement into daily programming.

- **1 Student & question.** The referral, the work unit, problem behavior and
  its function, and one of four clinical questions (work for positive
  reinforcement; compliance when problem behavior is escape-maintained; skill
  acquisition; teacher-run classroom tokens). The question sets the primary
  measure and names the closest studies. The learner variables the authors
  offered as explanations (verbal repertoire, token history, delay tolerance)
  are recorded so they can be checked against the data, not treated as
  moderators. The reinforcer inventory records how each item is consumed,
  including its set-up/re-orient time and what happens at removal.
- **2 Preassessment.** Preference (activities and edibles assessed
  separately), an optional single-operant reinforcer check, token training
  (required before any token arrangement), a card/stimulus discrimination
  check, and a removal probe that times giving the item back and returning to
  work.
- **3 Arrangement builder.** Baseline, distributed, accumulated, accumulated
  with tokens, and intermediate (exchange every *k*). Every parameter that must
  stay constant is written down, including the timing rule for the rate
  denominator: work time only, or total session time. A projection table shows
  what the authors' explanations imply for this student: longest uninterrupted
  access, the number of removals, set-up and return-to-work time, and how long
  banked responses wait. The tab also holds the design, the decision rules,
  the choice-assessment plan with the stopping rules the studies used, and
  generated session scripts.
- **4 Efficacy data.** A session log with separate work and total time. It
  computes rate per work minute, percentage, problem behavior per minute,
  responses per total minute, and Resumes (seconds from removal to the next
  response). It draws a graph and a comparison by arrangement, and applies the
  first part of the Frank-Crawford et al. (2021) "ineffective" rule; the other
  two parts are left to visual analysis.
- **5 Preference.** A concurrent-chains log (forced exposures, choices,
  positions rotated, terminal link completed), plus an optional no-work check
  for a student who picks distributed.
- **6 Integrity & IOA.** A per-arrangement integrity checklist, IOA by
  measure (total count, trial-by-trial, total duration), and the values the
  studies reported.
- **7 Decision & plan.** The student's evidence, a decision guide whose lines
  are tagged *Authors* (an implication the authors drew) or *NBH* (this form's
  guidance, untested as a rule), the implementation plan, and a requirement
  ladder that keeps the amount per response constant as the work grows.
- **8 Generalization & validity.** Generalization and maintenance probes,
  acceptability ratings, and the student's own answer.
- **9 Evidence guide.** DeLeon et al. (2014), Robinson & St. Peter (2019),
  Fulton et al. (2020), Frank-Crawford et al. (2021), Mandel (2021,
  dissertation) and Gingras (2022, thesis). Every statement is tagged
  *Finding*, *Explanation*, *Authors* or *NBH*, quotations are verbatim, and
  page numbers are the printed pages. It also includes definitions, a
  side-by-side table, study-by-study summaries, what the evidence does not
  settle yet, and related studies "as described by" these sources.
- **10 Walkthrough.** The same scene engine as DT-1. It steps through the
  shape of every session and six procedures at the table: A distributed,
  B accumulated, C accumulated with tokens, D a concurrent-chains choice
  trial, E breaks for escape-maintained behavior, and F raising the
  requirement. It also has fourteen "your call" practice moments, the terms,
  and **Print the job aids** (44 drawn steps, with an integrity checklist per
  procedure). Links in Tabs 2, 4 and 5 open it at the matching procedure. Like
  DT-1's, the tab carries `noprint`, never prints with the form, and never
  enters a packet.

**How the content was checked.** Every quotation was located mechanically in
the text of its source. An independent reviewer then compared the form against
the six sources and found 3 errors, 15 imprecisions and 19 minor issues. All
were corrected. A second pass confirmed 36 of the 37 corrections, finished the
last one, and raised three new citation points; all four were settled from the
source page breaks and fixed.
The DeLeon et al. article arrived in three copies (final, early view, PMC
manuscript); the final JABA pagination (pp. 293–313) is the one cited.

**Built, not hand-edited.** `ad1/build-ad1.py <DT-1 html> <out>` assembles the
form from its parts (`panels-a/b/c.html`, `p10.html`, `ad.css`, `ad-wk.css`,
`main.js`, `stories.js`, `wk.js`) and takes the shared NBH blocks (bridge,
field care, fit-screen, design) from DT-1, patching the scene engine with
`engine-patch.py`. `patch-ws-ad1.py <NBH folder> <built AD-1>` registers it and
moves every live form count from 30 to 31 (shell, README, this file, the
one-file and school-edition builds). It uses Save data / Open data like the
other forms and joins the case file, autosave and packet through the bridge.
Tests: `qa/ad/ad1-check.js` (simulation, calculations, save and reopen),
`ad1-wk-check.js` (the walkthrough and job aids), `ad1-axe.js`,
`ad1-ws-check.js` (framed, bridge save-and-restore round trip, packet),
`ad1-print.js` (the simulated case prints to 38 Letter pages). In print, AD-1's
short notes boxes stay whole, so a box never leaves two lines alone on a page.

**Tab numbers readable (all forms).** The shared rule drew tab numbers in
`--nbh-rule2` (2.4:1 on white) and the selected one in teal (2.9:1). axe caught
it only on the two-digit "10", in DT-1, VI-1 and AD-1.
`patch-tabnum-v21_13.py <folder>` moves every form to `--nbh-muted`, and the
selected number to slate (5.6:1 or better).

**Harness timing.** With 31 frames, a form's first status reply can arrive
before the shell pushes the packet (at load + 500 ms), so its student name
shows on the next 4-s ping. `qa/forms-check.js` now waits up to 3 s for the
name instead of reading it once.

**Job aids keep the checklist whole (DT-1 and AD-1).** On the printed job aids,
the observer's integrity checklist heading and its Date / Implementer /
Observer / Session line used to print at the foot of the procedure page, with
the table alone on the next sheet. The three now travel as one block
(`.jp-obs`, `break-inside: avoid`), so the observer gets the whole checklist on
one sheet. `patch-jobaid-v21_13.py` applied it to DT-1,
`build-dt1-walkthrough.py` and `ad1/wk.js`. AD-1's job aids print on 13 pages
and DT-1's on 17.

## MT-1: the observation timer (v21.14)

A timer panel sits above the interval grid on the Data sheet (it never prints).
The sheet sets it. The observation length gives the clock, and the ratio gives
the interval and therefore the marks: 5 minutes at 1:1 runs 5:00 with a mark
every 5 seconds (60 marks), and 10 minutes at 1:2 runs 10:00 with a mark every
20 seconds (30). Method, length and ratio are locked while it runs, so the marks
cannot drift from the rows.

- **At each mark** it beeps, flashes the edge of the screen and vibrates (on
  phones and tablets), and the interval waiting to be scored turns amber on the
  sheet. Score it with the large **+ / − / N/A** buttons, the keys `+`, `-` and
  `N`, or on the sheet itself. `Space` pauses and resumes. A press always fills the
  oldest interval still waiting, so a missed mark is flagged and never skipped
  silently.
- **Method rules are enforced.** Momentary time sampling cannot be scored before
  the mark. Partial interval takes a **+** as soon as the behavior occurs; that
  interval is then settled and its alert is skipped. Whole interval takes a
  **−** as soon as the behavior stops.
- **Alerts** can be switched off one by one (Sound, Flash, Vibrate) or all at
  once (**Alerts on/off**). **3-2-1 ticks** adds soft ticks before each mark
  when marks are 10 seconds or more apart. **Test alert** plays one alert. These
  settings are saved in the data file as `meta.tmr`.
- **Pause** stops the clock. **Reset timer** keeps the marks.
  **Clear sheet for the next session** resets both. A blank date and start time
  are filled in at Start. If the sheet changes under a running timer (a file is
  opened, the length is edited), the timer resets. At the end there is a
  distinct alert, a count of the intervals scored, and a pointer to Capture.
- **Timing.** Elapsed time is read from `performance.now()`, never counted, so
  it does not drift. Beeps are scheduled ahead on the Web Audio clock. The
  screen is kept awake with the Wake Lock API where the browser allows it. With
  the IOA column on, **Score into** chooses Observer 1 or Observer 2.
- Built by `mt1/patch-mt1-timer.py <MT-1 v21.13> <out>` from `mt1/tmr.css`,
  `tmr.html`, `tmr.js` and `guide.html` (a Guide section, "The Observation
  Timer"). Tested by `qa/sp/mt1-timer-check.js`, which uses Playwright's fake
  clock to step through marks, method rules, pause, reset, end, the IOA column,
  print, axe and phone width.

## ABC-1: observation timer, walkthrough, source corrections (v21.14)

- **Observation timer (Record tab).** It runs the observation and schedules the
  background checks the protocol asks for: every 5, 10 or 15 minutes, or at
  random times averaging 5 or 10 minutes (spread from half to one and a half
  times the average). It can also run for a planned length. At each check it
  alerts (sound, flash, vibration; each toggleable), and a bar under the tabs,
  visible on every tab, shows the clock, the next check and the counts.
  - If an incident was logged in the check's window, or is being timed, the
    check skips itself, because that window is already an incident.
  - Otherwise **Record the window** opens Background samples with the date,
    time and window length (the minutes since the last check) filled in. Saving
    the sample marks the check recorded.
  - **Behavior occurred: skip** handles an incident not yet logged. A check
    left open when the next one comes is counted as missed.
  - The check log lists every check with its window and result. The observation
    start and end dates fill in if blank.
  - For sessions with a second observer, use a fixed schedule so both observers
    check at the same moments.
- **Incident stopwatch (New incident).** **Incident starting**, in the card or
  in the bar, stamps the date and start time and runs a clock. **Incident over**
  fills Duration in whole minutes, as the sheet records it. Saving the incident
  while the stopwatch runs stops it first.
- **Numbered tabs** 1–7, like the rest of the set.
- **What counts as an interval for agreement.** The Methods tab now defines the
  units for the four-box agreement calculator in an event record, counting each
  unit once:
  - Occurrence units are incidents. An incident logged by both observers (start
    times within a minute) is an agreement; one logged by only one observer is
    a disagreement.
  - Nonoccurrence units are the background check windows in which neither
    observer logged an incident. Code-by-code agreement is then computed on the
    incidents both logged, section by section.
- **Walkthrough (tab 7).** It uses the DT-1/AD-1 scene engine, extended with a
  peer, an observer whose tablet flashes "CHECK", a second observer, a wall
  clock, a door, a fire alarm and the Analysis screen.
  - Six stories, 47 steps: what every observation has in common, logging an
    incident, a background check, coding calls that change the result, a second
    observer, and reading the analysis.
  - Sixteen "your call" drills, each with the rule behind the answer, and the
    terms as the sheet uses them.
  - **Print the job aids**: a cover plus five procedures (38 drawn steps, 13
    pages), each with an observer's checklist that stays in one piece.
  - "See it at the table" links sit at the top of the Record, Background
    samples and Analysis tabs.
- **Source corrections.** An independent reviewer checked 61 statements about the
  literature against the primary sources: 23 verified, 20 imprecise, 1 incorrect,
  and 17 not verifiable from accessible text. The form now carries 24
  corrections, with 8 matching ones in the walkthrough. Among them:
  - Camp et al. (2009): the agreement counts (4 of 7 when antecedents and
    consequences are combined), how their panel worked, and that the .20 and
    1.23 values were derived afterwards from the panel's decisions.
  - The contingency space is credited to Martens et al. (2008).
  - Borrero and Borrero (2008) are no longer credited with a treatment step
    they did not test, and Sloman et al. (2005) is stated at the strength the
    paper supports.
  - Michael's term is "establishing operation", and the point about event- vs.
    interval-based methods is credited to Lloyd et al. (2016).
  - Pence et al. (2009) now reads as the paper reports it for automatic function.
  - References: the Fritz et al. (2013) pages are 101–129, and entries were
    added for Lloyd et al. (2016), Rosenthal (1996) and Yoder, Lloyd and Symons
    (2018).

  These sources were out of reach and are unchanged: Bijou et al. (1968),
  Thompson and Iwata (2001), Kennedy and Meyer (1996), both McCord et al. (2001)
  papers, Fahmie et al. (2013), Hanley et al. (2014), and Schmidt et al. (2020).
  With their PDFs, the same check can finish those.
- **Accessibility.** The "Other/unclassified" gray on the Methods tab failed
  contrast in v21.13 and is darker now.
- **Built, not hand-edited.** `abc1/build-abc1.py <ABC-1 v21.13> <DT-1> <out>`
  runs three steps:
  1. `build-abc1-wk.py` adds the Walkthrough from `abc1/wk/`.
  2. `patch-abc1-facts.py` applies the source corrections.
  3. `patch-abc1-tmr.py` adds the timer, the stopwatch, the tab numbers and the
     agreement text from `abc1/tmr/`.

  Tests: `qa/abc/abc1-timer-check.js` (fake clock: checks, skips, missed checks,
  the stopwatch, random schedule, planned end, print, axe),
  `qa/abc/abc1-wk-check.js` and `qa/abc/abc1-axe.js`.

## EA-1: session runner, walkthrough, source corrections (v21.15)

- **Session runner (Sessions sheet, above the log; never prints).** It is for the
  data collector; the therapist runs the session.
  - **Setup from the card.** Pick the condition and the runner reads its card:
    session length, consequence period after a target (the Demand card's 30-s
    break; the Attention card's 5–10 s is read as 10), attention schedule in
    the control condition and how long attention is held after a target (Play:
    every 30 s, held 5 s), and prompt-step interval (Demand's "every 5–10 s" is
    read as 5). Every value can be edited.
  - **Session types.** A timed session. A latency session ends at the first
    target and writes the latency. A trial runs a control segment and then a
    test segment, each ending at the first target, and writes 1 or 0 into the
    trial-based log. The type follows the variant and the primary measure.
  - **Recording.** **Target** (Space or T), **Precursor** (P) and **Undo** (Z).
    After Start, focus sits on Target.
  - **Consequence follows** sets which response starts the consequence period:
    Target, Precursor (the default in the precursor variant), or Target or
    precursor (when the card says so, as in the IISCA synthesized test). When it
    follows the precursor, the log records the precursor and the target count
    goes in the notes.
  - **Cues.** The end of each consequence period ("re-present the task", "take
    the item back"), each noncontingent attention delivery, and prompt steps,
    each with sound, flash and vibration that can be switched off.
  - **Termination count.** The session can end at a set count, marked
    terminated. **End early** also marks it terminated.
  - **Save to the log** writes the next empty row (date, condition, phase,
    minutes actually run, the value the primary measure needs, the terminated box
    and a note: count, latency, or percentage of intervals computed from the
    timestamps at the form's interval size), then selects the next condition in
    card order.
  - A pill in the corner shows a running session from any other view.
  - Timing comes from `performance.now()`, and the screen is kept awake.
  - Guide section 6, "Running Sessions at the Table", describes it.
- **Walkthrough view (ninth view).** The DT-1 scene engine, extended with each
  condition's signal and props.
  - Ten stories, 73 steps: before the first session, Attention, Demand, Play,
    Alone, Tangible (trial-based), reading the graph, latency and trial-based
    sessions, IISCA and precursor analyses, and agreement and fidelity.
  - Eighteen "your call" drills and 22 terms.
  - Job aids: a cover plus five sheets (44 drawn steps, 12 pages), each with an
    observer's checklist.
  - Links from the Conditions, Sessions and Interpretation views open the
    matching story.
- **Source corrections.** An independent reviewer checked 104 statements,
  including the templates of all ten variants: 51 verified, 26 imprecise,
  6 incorrect, and 21 not verifiable from accessible text. The form now carries
  31 corrections, 3 corrected references and 9 added ones (cited works that
  were missing from the list). Among them:
  - Hagopian et al. (1997): interrater agreement as the paper reports it
    (a mean of .46 rising to .81).
  - The yoked-control attributions (Halliday and Boakes, 1971; Killeen, 1972;
    what Church, 1964, actually showed).
  - Sunde et al. (2022) for published latency criteria.
  - Hanley (2012) on when the interview-informed analysis is recommended.
  - The stability envelope (±25% of the median).
  - Holehan et al. (2020): the fourth author is Jess, R. L.

  The Subtype 3 self-restraint criterion (> 25%) is unchanged: the primary
  sources (Hagopian et al., 2015, 2017) could not be reached, and a calculation
  is changed only on the primary text.
- **Built, not hand-edited.** `ea1/build-ea1.py <EA-1 v21.13> <DT-1> <out>` runs
  three steps: `patch-ea1-facts.py`, then `patch-ea1-run.py` (`ea1/run/`), then
  `build-ea1-wk.py` (`ea1/wk/`). Tests: `qa/ea/ea1-runner-check.js` (Playwright's
  fake clock, paused, so it is deterministic), `qa/ea/ea1-wk-check.js`,
  `qa/ea/ea1-axe.js`.
- Known: on a phone the Sessions sheet scrolls sideways, because the session
  table is wide. That was so before v21.15; the runner itself fits.

## PA-1 and RA-1: runners, walkthroughs, fixes, source corrections (v21.16)

### PA-1 (Preference Assessment)
- **Runners.** A panel, "Run This Assessment", sits under each method sheet's
  header fields. It never prints. It keeps time from `performance.now()`, has
  alerts that can be switched off, keeps the screen awake, and has keyboard
  keys. A pill shows an assessment that is running while you are on another
  view.
  - **Single stimulus.** Rotated blocks; when the approach window runs out it
    scores No approach; an access timer with Engaged timing.
  - **Paired stimulus.** The sheet's pairs and sides; the 30-s window runs out
    to Neither; Both re-presents the pair, and the row takes the
    re-presentation's outcome.
  - **MSWO / MSW.** The chosen item is removed (MSWO) or returned (MSW) and the
    array rotates; no selection ends the session; the result is written to the
    session's column.
  - **Free operant**, and single-stimulus engagement: engagement timed per item.
  - **Competing stimulus.** Counts the target behavior, times engagement, writes
    the percentage of intervals.
  - **Ecological.** Part D's approach durations, one row per approach.
- **Fixes (`patch-pa1-fixes.py`).**
  - The single-stimulus "PB trials" counts are now saved and reopened. They
    were dropped because they were stored as extra properties on an array,
    which `JSON.stringify` skips.
  - The single-stimulus hierarchy now recalculates after Load simulation, Open
    data and Clear all.
  - Every other field survives a round trip (checked across 7 scenarios and 666
    fields).
- **Source corrections.** 85 statements checked: 39 verified, 24 imprecise,
  4 incorrect, and 18 not verifiable (mostly pre-2004 JABA procedure details
  that were out of reach). The form now carries 32 corrections and 6 reference
  changes. Among them:
  - Kelly et al. (2014) used photo cards for social stimuli.
  - What Cote et al. (2007) and Ciccone et al. (2007) actually reported.
  - Zhou et al. (2002): food was less effective after meals for 4 of 9 adults.
  - Hanley et al. (2006): preference recovered fully for one participant and
    partly for the other.
  - Co-authors for Heinicke et al. (2016), the spelling of Virués-Ortega, and
    the pages of Haddock and Hagopian (1982–2001).
  - The reference list is back in alphabetical order.
  - The MSWO no-selection window is the form's 30 s throughout; the Guide's
    "10 s" is gone.
  - The Indirect sheet reports Northup (2000) as about 57% accurate and Northup
    et al. (1996) on low-preference categories.
- **Walkthrough (eleventh view).**
  - Nine stories, 67 steps, plus 18 drills and 33 terms.
  - Job aids: a cover plus seven method sheets (16 pages, 41 drawn steps). Each
    prints two-sided: the steps on the front, and the procedure word for word
    plus the fidelity checklist on the back.
  - Links from nine views open the matching story.
- **Built** by `pa1/build-pa1.py`: facts, fixes, runners, then the walkthrough.
  Tests: `qa/pa1/pa1-runner-check.js`, `pa1-fixes-check.js`, `pa1-wk-check.js`,
  `pa1-axe.js`.

### RA-1 (Reinforcer Assessment)
- **Runners.** A panel, "Run This Session", sits on each assessment sheet.
  - **Single operant.** The toolbar's session length, FR n, a reinforcer cue and
    access countdown, and a problem-behavior tally. It writes the date,
    condition, responses, minutes and problem behavior, and ticks Phase start in
    a reversal design.
  - **Concurrent operants.** One button per option (keys 1–3), each option with
    its own FR and access. It writes Option A's position and responses per
    option.
  - **Progressive ratio.** The toolbar's progression, start and stop interval,
    and the cap from Setup. The stop interval waits during access. Save ticks
    the completed ratios, and the sheet computes the break point.
  - **Defaults.** FR 1; 20 s access when Setup gives none (0 s for edibles and
    tokens); a 20-minute PR cap if Setup is blank. Each default is labeled on
    the panel.
  - Changeovers, the ratio in progress and problem-behavior counts appear only
    in the runner's summary, because the sheet has no fields for them.
- **Fixes (`patch-ra1-fixes.py`).**
  - The potency and Confirmed legends now describe what the calculation does.
  - Lower, Probable and Untested are defined.
  - PR potency updates as soon as the plan ratio is typed, and "FR 5" is read
    correctly.
  - "Reinf." is now "Ratios completed", because a control session delivers no
    reinforcer.
  - The simulated range is one the progression can produce.
  - The Guide says the form sets no stopping rule and the analyst decides from
    stability; no study is cited, because none supports a specific rule.
  - Six smaller display bugs are fixed (summary refresh, a planned row showing
    break point 0, the first-ratio label, the position-effect label, the
    allocation wording, the PR procedure wording).
- **Source corrections.** 41 statements checked: 18 verified, 9 imprecise,
  9 incorrect, and 5 not verifiable. The form now carries 17 corrections; Fisher
  (1992) is corrected and Stafford and Branch (1998) added. Among them:
  - Call et al. (2012) found one-time and daily assessments predicted equally
    well.
  - DeLeon et al. (2009) used a paired-choice assessment, and break points
    followed rank.
  - What Poling (2010) actually argues.
  - What Kelly et al. (2014) tested.
  - Fisher et al. (1992) and Piazza et al. (1996) used concurrent operants.
  - The methods of Roane et al. (2001) and Roscoe et al. (1999) could not be
    reached.
- **Walkthrough (seventh view).** Six stories, 50 steps, plus 18 drills and
  25 terms; job aids (8 pages); five links.
- **Built** by `ra1/build-ra1.py`: facts, fixes, runners, then the walkthrough.
  Tests: `qa/ra1/ra1-runner-check.js`, `ra1-fixes-check.js`, `ra1-wk-check.js`,
  `ra1-axe.js`.

## Form audit, batch 1: TD-1, IA-1, OB-1, FS-1 (v21.17)

Every remaining form is being audited, a few at a time. Each audit has two
parts. A **source check** tests every statement about research, law or medicine
against its primary source. A **function and consistency audit** checks:
- every field survives Save data → Open data and a workstation snapshot/restore;
- print, phone width (390 px) and accessibility;
- legends and labels against the calculations, and contradictions between
  sections;
- stale recalculation, whether the simulated data is plausible, and clinical
  logic.

Each form gets two scripts, applied in order to its v21.16 file:
`audit/<id>/patch-<id>-facts.py`, then `patch-<id>-fixes.py`. Its test,
`qa/audit/<id>/<id>-fixes-check.js`, passes on the corrected form and fails on
v21.16. As before, a calculation is changed only when the primary text itself
confirms it.

- **TD-1.** 75 statements confirmed wrong or imprecise are now corrected: 30
  imprecise and 4 incorrect, plus 41 verified; 32 could not be verified.
  - The one rule change: for "time away from instruction not tolerable",
    Geiger, Carr and LeBlanc (2010, Figure 1) list activity choice and
    extinction only, so DNRA is no longer offered on that branch.
  - Other corrections: Goh et al. (2000) studied NCR and mands; Hagopian et al.
    (1998) summarized 21 cases; Lerman et al. (1999) found bursts in nearly half
    of cases; Hanley et al. (2014) denied 3 of every 5 requests; NCAEP does not
    list scripting.
  - Function fixes:
    - After a card was removed, Open data put saved fields on the wrong cards.
    - Clear all and Open data left the previous case's flowchart, with its
      student name.
    - The monitoring decision ignored the thinning level, assumed 0.2/min with
      no criterion, counted Attention NCR sessions as baseline, and rounded
      integrity up.
    - A subtype was assigned with fewer than three series.
    - 22 components were missing from the staff flowchart.
    - Also fixed: simulated dates in the future, print splits, phone width.
  - Still open: 59 cited works have no reference entry yet.
- **IA-1.** 129 items: 89 verified; 30 corrected (23 imprecise, 7 incorrect);
  10 not verifiable.
  - The scoring keys, answer scales and category assignments of the FAST,
    QABF, MAS, PBQ-15/18 and the FACTS confidence rating match the published
    forms. No item text is reproduced.
  - Corrections: the Guide no longer says direct observation identifies
    function; Iwata et al. (2013) (196 behaviors, two informants each); FACTS
    test–retest .62–.92 across 13 informants; the "50% chance" line is fixed for
    the 4- and 7-point scales; five reference errors.
  - Function fixes:
    - The packet printed stale outcomes.
    - The PBQ-18 setting-events rule read the gain-item column.
    - Clear all left the previous case's FA correspondence.
    - A profile with nothing endorsed "matched" any FA result.
    - Ties were misreported.
    - The pain-profile medical referral the Guide promises was missing.
    - The Google Forms import misread "Some" and "All of the time".
    - Also fixed: phone width, chart legends, screen-reader names.
- **OB-1.** Of 8 statements, 5 are corrected. The Guide now says agreement is not
  accuracy; the Iwata et al. (2013) figures are the study's own; Kahng et al.
  (1998) is stated as reported. 19 function fixes, most importantly:
  - Open data merged the file into the record already open, so another
    student's teacher, behavior and FS-1 statement could carry over.
  - Simulated intervals exceeded the counts.
  - The draft reported "occupied X% of intervals", which no interval method
    measures.
  - An end time before the start added 24 hours.
  - The pooled rate mixed unpaired counts and minutes.
  - The peer's counts and the agreement figure were recorded but never shown.
  - Changing the interval method relabelled data already scored.
- **FS-1.** 18 statements: 15 verified; 2 imprecise, now corrected (Hagopian et
  al., 2015, used three series of each condition; Rooker et al., 2019, was a
  preliminary study); 1 not verifiable. The 62.5% LOD cut-off is confirmed in
  Hagopian et al. (2023). Function fixes:
  - Below Level 1, summary statements now say "hypothesized function" and give
    the level.
  - Reinforcer, preference and integrity assessments no longer set a tier.
  - "Unknown" is not counted as a function, and a function that is only
    contradicted is not reported.
  - **These two change results for some saved records:** a functional analysis
    now outranks interviews whatever their ratings, and an analysis rated Weak
    no longer prints "experimental control demonstrated".
  - Contradicting a different function no longer lowers the level.
  - Also fixed: the rationale field now shows, the report refreshes after edits,
    the recommendation covers every target, plus print, phone width and one
    accessibility fix.

## Form audit, batch 2: TB-1, SP-1, DD-1, MT-1 (v21.18)

Same method as batch 1: a source check and a function and consistency audit,
two scripts per form applied in order to its v21.16 file
(`audit/<id>/patch-<id>-facts.py`, then `patch-<id>-fixes.py`), and a test,
`qa/audit/<id>/<id>-fixes-check.js`, that passes on the corrected form and
fails on v21.16.

- **TB-1.** 82 statements: 52 verified; 18 corrected (17 imprecise, 1
  incorrect); 12 not verifiable.
  - Horner and Day (1991) found that a taught alternative less efficient than
    the problem behavior (in effort, schedule or delay) did not compete with it
    until a more efficient alternative was taught; equal efficiency was not
    tested. The replacement criterion now reads "more efficient" in the Guide,
    the quality check and the definition card.
  - Other corrections: Van Houten et al. (1988) did not rank treatment
    priority by danger; only Fritz et al. (2013) treated precursors, with two
    participants; Beavers and Iwata's (2011) hedge is restored and the pages
    are 593–597; the Hawkins and Dobes clarity test uses an experienced
    observer; Skinner's 1935 paper predates the word "operant"; Michael (1993)
    wrote of establishing operations.
  - Function fixes:
    - The cluster verdict let a blank or "Unknown" member hide a definite
      failure, ignored the separate-columns decision the Guide allows, and
      passed a rate of 0.
    - A removed target's quality checks and agreement pilot came back on a new
      blank target and were saved with it.
    - The workstation's master print showed old target names.
    - Simulation: a blank "Goes to sheet", swapped revision-log columns,
      schedules in the pilot's Date column, the break request rated as
      injurious, and definition errors for elopement and head hitting.
    - Also fixed: a printed page holding only a heading, headings split from
      their tables, phone width.
- **SP-1.** 31 statements: 19 verified; 9 imprecise, now corrected; 3 not
  verifiable.
  - Kahng et al. (1998) is now described as reported: visual inspection found
    no reliable pattern in any of the 15 scatter plots, and the control charts
    revealed higher-probability intervals in 12 of them. The "consensus" among
    analysts is not in the paper. The criteria are quoted as the paper gives
    them, with "above the mean" as the code applies them. A reference list of
    the four cited works was added.
  - Function fixes:
    - Switching Tap and Count brought back deleted marks and skipped other
      behaviors.
    - Changing the start time or interval moved recorded marks to other
      times.
    - The sheet list did not match the grid when the form opened; the week
      starting date was not saved.
    - Stale or misleading labels: ties, the criteria results, the "no pattern
      visible" box, the chart keys, hatching lost on paper.
    - Also fixed: near-empty printed pages (24-hour and 15-minute layouts),
      two accessibility failures, phone width.
  - Left for you: sigma still defaults to Wheeler's moving-range estimate. The
    paper's wording points to the ordinary standard deviation of the plotted
    sums, which the form offers as the other choice.
- **DD-1.** 14 statements: 10 verified; 1 incorrect, now corrected; 3 not
  verifiable.
  - **Changes results:** the default stability envelope is now ±25% of the
    condition median, the convention Ledford, Lane and Severini (2018) give,
    citing Lane and Gast (2014). The old default, "25% of median, split above
    and below" (±12.5%), had been attributed to Gast; it stays as an option
    without the attribution. A saved record reopens with the envelope it was
    saved with.
  - A "Sources for the Indices" panel with six references now ends the graphs
    and analysis.
  - Function fixes (15), four of which **change results**:
    - Relative level change now leaves out the middle point of an odd count on
      both sides, as the split-middle does.
    - Immediacy compares equal numbers of points on each side.
    - At a median of 0 the envelope has no width, and points at 0 are inside
      it; the band was being taken from the mean.
    - A blank consecutive-days field counts as the 3 it displays, not as 1.
  - Other fixes:
    - The simulation put data on weekends and started two episodes at the
      same minute; it now uses school days, with episodes that do not
      overlap.
    - Percentage graphs stop at 100%.
    - Column, CSV and summary labels now name what each measure holds. The
      daily CSV gains columns, so a spreadsheet keyed to the old columns needs
      updating.
    - After 8 p.m. several dates were a day ahead (UTC); the sheet's student
      name was stale.
    - Graph legends follow the display toggles.
    - Also fixed: print (the simulation's graphs went from 20 pages to 15),
      accessibility, phone width.
- **MT-1.** 37 statements: 21 verified; 8 corrected (6 imprecise, 2
  incorrect); 8 not verifiable.
  - The Guide no longer says every method is biased in a known direction:
    Powell et al. (1975) found momentary time sampling over- and
    underestimated "about equally often"; partial- and whole-interval errors
    run in one direction.
  - The agreement advice now covers both ends: non-occurrence agreement for a
    behavior scored in most intervals, occurrence agreement for one scored in
    few. The Meany-Daboul et al. (2007) and Rapp et al. (2008) descriptions
    are corrected, and a reference list of six works was added.
  - Function fixes:
    - N/A intervals were counted as agreements or disagreements.
    - The 80% flag checked occurrence agreement only, so the simulation's
      72.7% non-occurrence agreement went unflagged.
    - Changing method, length or ratio after scoring silently relabelled the
      marks; it now asks first.
    - The observation timer kept running after Clear all, Open data or Load
      simulation.
    - The simulation log said 66.7% where the sheet computes 70.0%.
    - "Target type" and "Change at this session" kept old values after Clear
      all or Open data.
    - Also fixed: summary cards split across pages, phone width.

## Form audit, batch 3: VI-1, GB-1, TI-1, ST-1 (v21.18)

Same method as batches 1 and 2.

- **VI-1.** 44 statements: 20 verified; 20 corrected (16 imprecise, 4
  incorrect); 4 not verifiable; one reference error (Samaha et al., 2009).
  - St. Peter et al. (2005) found matching with attention that did not
    function as a reinforcer (spurious matching). Neither Pence et al. nor
    Samaha et al. (2009) found that background-probability comparisons reduced
    over-identification of attention. Bloom et al. (2011) trained graduate
    students, not classroom staff, to run the trial-based analysis. Vollmer et
    al. (2001) compared against the background probability, not the
    probability given no behavior. Smith and Churchill's (2002) finding came
    from functional analyses, and is now labelled as such where the form
    applies it to descriptive data. The Guide no longer calls a structured
    descriptive assessment a functional analysis.
  - Function fixes:
    - Every "Tab N" reference in the text was one lower than the numbered
      tab it meant (19 references).
    - The simulation broke the form's own rules: a joint-method row read
      "Mostly" absent yet "satisfied", the hypothesis matrix was coded under
      the wrong columns, the two contingency tables had different totals,
      dates fell on weekends, and the chosen next step contradicted the case.
    - Load simulation now clears the user's own entries, as its prompt says.
    - Labels are classified on the two-decimal values shown (+0.20 read
      "Weak positive").
    - The antecedent flag labelled "Base rate" tested the probability of the
      behavior without the antecedent, and its legend stated a false rule; both
      now state the bound that holds (once that probability is .50 or more,
      the ratio cannot rise much above 2). Counts that give a probability
      above 1 are flagged instead of classified. The unstated flags, strength
      bands and standing rule are now written out.
    - Clear all now resets the hypothesis headers; Open data refuses another
      form's file with a message.
    - Also fixed: tables scroll in their own boxes at phone width; print.
- **GB-1.** 9 statements: 2 verified; 3 imprecise, now corrected; 4 not
  verifiable.
  - The IEP notes quote 34 CFR 300.320(a)(2) and (a)(3) exactly, and add
    Florida's rule that the IEP team may require benchmarks or short-term
    objectives for any student (Rule 6A-6.03028(3)(h)3., F.A.C.). The Florida
    IEP phrasing is attributed to FLDOE Technical Assistance Paper FY 2005-2.
    A reference list of three works was added.
  - Function fixes (15):
    - **Security:** text from fields was inserted into the goal sheet as
      HTML, so a name in an opened file could run script. All text is now
      inserted as text.
    - Removed objectives came back empty after Open data or a workstation
      restore.
    - Open data kept the previous student's ID, author, dates, plan data and
      goal sheet.
    - The goal sheet went stale after edits; Ctrl+P and the workstation packet
      printed it stale or empty.
    - Apply to empty fields skipped the reduction objective once R1 was
      removed, wrote per-minute levels into other measures, and left the unit
      blank.
    - Latency objectives could only decrease; they can now increase, and a
      check flags any objective whose target is no better than baseline.
    - Objectives printed "in/at"; the count criterion says "consecutive
      sessions" (TD-1's rule); reduction objectives say how they are
      measured; a progress-report schedule field was added.
    - Also fixed: Guide wording, title case, units on the plan numbers, print,
      phone width, simulation dates.
- **TI-1.** 15 statements: 7 verified; 2 corrected (1 imprecise, 1
  incorrect); 6 not verifiable.
  - Fallon et al. (2015) reviewed performance feedback for raising
    educators' treatment fidelity; the form had cited it for integrity
    measurement and student outcomes. The five sources are no longer called
    "empirical sources" (they are reviews, a chapter and practitioner guides).
    A reference list was added.
  - Function fixes:
    - **Changes results:** the verdict checked critical steps pooled over
      every observation instead of on the observations the criterion was
      judged on. It gave false alarms after retraining and missed critical
      errors on the deciding observations. It now uses the same observations,
      and says which figure it used.
    - Removed steps and observations left their codes behind, and those codes
      came back and counted.
    - A fractional observation count crashed the page; the criterion accepted
      150% or −1.
    - Another form's saved file opened silently into TI-1.
    - Screen-reader names on every code field read the neighbouring cell.
    - Also fixed: legends, the simulation's notes against the retraining list,
      print (blank dates on the grid's second page), phone width.
- **ST-1.** 23 statements: 14 verified; 3 corrected (1 imprecise, 2
  incorrect); 6 not verifiable. A reference list was added.
  - Ward-Horner and Sturmey (2012), which the form cites, found rehearsal
    alone ineffective, modeling helpful for some teachers, and feedback
    effective for all; the form had said rehearsal with feedback "does the
    work" and that modeling alone "reliably fails". Himle et al. (2004) and
    Miltenberger et al. (2005) now carry years and are noted as child
    safety-skills studies.
  - Function fixes, three of which **change results**:
    - Only the first run of rounds that met the criterion was judged, so a
      critical error there could never be cleared by more rehearsal. The
      decision now uses the latest rounds, which must still meet the
      criterion.
    - Critical-step errors were pooled against 90%, so one critical error in
      ten passed. Critical steps must now be correct every time they occur in
      the deciding rounds, as Parsons, Rollyson and Reid (2012) suggest; a
      critical step that never came up is named.
    - A typed probe date passed the in-situ probe even at 40% integrity. The
      TI-1 integrity figure must now meet the criterion.
    - "Unsupervised" now reads "without the trainer present" (RBT Ethics Code
      1.03); old saved outcomes still open.
    - Also fixed: stale step descriptions and returning codes, a fractional
      round count that crashed the page, mislabelled rounds and legends, the
      simulation dated tomorrow, print, phone width.

## Form audit, batch 4: RM-1, TE-1, BC-1, DT-1 (v21.19)

Same method as the earlier batches. From this batch on, every audit also
checks that Open data refuses another form's saved file, that typed or opened
text is never inserted as markup, and that simulated dates are local school
days.

- **RM-1.** 84 statements: 39 verified; 37 corrected (28 imprecise, 9
  incorrect); 8 not verifiable. A 50-entry reference list was added.
  - Craig and Shahan (2016) did not show the momentum model failing on every
    core prediction; its second prediction held.
  - The analysis called any relapse rate from 40% to 100%, of any type,
    "broadly in line with" Briggs et al.'s (2018) 42% of schedule-thinning
    transitions; each relapse type is now compared with its own published
    figure. "A temporary increase is expected at each thinning step"
    contradicted that same 42%, and Fisher et al.'s (2020) 81% was credited to
    the wrong phase (it came from presenting the S-delta during the
    extinction challenge).
  - Two evidence tags contradicted the form's own tag definitions: DRO then
    DRA moved from Untested to Basic, punishment from Counter to Mixed.
  - AAB renewal was missing; dropped hedges were restored; four citation
    years were wrong and two 2020 citations were ambiguous.
  - Function fixes:
    - Another form's saved file opened silently into this one.
    - **Changes results:** scoring used every value typed, not the last five
      before and the first three after, as the form states.
    - The graph misnumbered challenges when a row was unscored; with no
      baseline entered it said "none reached baseline"; the exposure bands
      were never stated.
    - The simulated case had weekend and Labor Day dates, fractional daily
      counts, missing thinning steps and contradictions.
    - "Remove last" now asks first. Also fixed: print, phone width.
- **TE-1.** 48 statements: 28 verified; 11 corrected (9 imprecise, 2
  incorrect); 9 not verifiable. A reference list of five works was added.
  - The Guide now gives Bullock and Hackenberg's (2006) own conclusion: most of
    their results were explained by responses per exchange period, not by unit
    price.
  - The generality verdict called a two-class token "partly generalized",
    although DeFulio et al.'s (2014) generalized token had exactly two backups
    (food or water); the paper was also credited with a three-class
    arrangement it never used.
  - The closed-economy claim, the schedule definitions (Hackenberg, 2009) and
    the Fernandez et al. (2023) survey wording now match the sources.
  - Function fixes:
    - Open data accepted any form's file (an ST-1 file filled the Student
      field); it now opens only TE-1 files.
    - A backup class in an opened file was inserted as markup and could run
      script.
    - Typing 12 into the thinning table stored 21.
    - The thinning table divided past steps by today's backups per exchange;
      that column now shows responses per exchange.
    - The simulation contradicted itself (current schedule, backups per
      exchange, weekend dates, a token ticked as tested although RA-1 records
      it as untested).
    - Token loss marked "Yes" with no rule is now flagged. Also fixed: phone
      width, print, the verdict wording, the saved file's date (UTC).
- **BC-1.** 34 statements: 11 verified; 20 corrected (15 imprecise, 5
  incorrect); 3 not verifiable; the two 1961 Reynolds papers are now 1961a
  and 1961b, and a 14-entry reference list was added.
  - Reynolds (1961a) defines contrast as a change away from the rate of
    responding in the other component; the form said "away from the change".
    "Transient" and "sustained" now carry Nevin and Shettleworth's (1966)
    meanings (within a component; across schedule cycles), not early and late
    sessions. "The usual response is to extend the plan" is removed: Boyle et
    al. (2023) report that no common method of mitigating contrast has been
    identified.
  - Function fixes, two of which **change results**:
    - The direction rule read the treated setting's rate, contradicting the
      Guide's own definitions (conditions in the changed setting worsening or
      improving) and Reynolds's finding (1961a, pp. 69–70). Setup now records
      whether conditions there became worse, better or about the same, and the
      verdict is tested against that; the rate is a check.
    - A verdict now needs three sessions per phase, not two (Kratochwill et
      al., 2010); the Guide notes the AB-design limitation.
    - Typing a rate reversed it ("12.5" was saved as "5.21").
    - Another form's file silently replaced the student's details and emptied
      the data; a damaged file broke the page.
    - The verdict called 0% or 1% changes contrast, and headed a verdict
      "Positive contrast" when Setup said the untreated setting had changed
      too.
    - Also fixed: weekend and holiday simulation dates, the saved file's date
      (UTC), phone width, print.
- **DT-1.** 129 items (102 statements, 27 reference entries): 51 verified; 21
  corrected (16 imprecise, 5 incorrect); 57 not verifiable, mostly counts from
  Finch et al. (2024), whose full text was blocked. Twelve cited works missing
  from the reference list were added; Muharib's entry had the wrong issue and
  pages.
  - Tab 9 cited Fisher et al. (2000) as showing that time-based delay always
    fails; fading alone worked for one participant, and prompting and praise
    helped another. Shevorykin et al. did not find episodic future thinking
    most effective for the steepest discounters. Leon et al.'s (2016) 6-s
    token percentages were wrong, and the "couple of seconds" drift threshold
    is not in the article. Ghaemmaghami et al.'s (2016) 10–15 minutes and 50
    demands were one participant's result.
  - Function fixes:
    - **Load simulation put every table value one field to the right**, so the
      session sheet, fading ladder and IOA table came out blank or wrong.
    - The simulated case broke the plan's own rules (weekend dates, indifference
      points the five-trial titration cannot produce, advance and stop rules).
    - **Changes results:** immediate trials were counted as self-control
      choices and in latency, and an impulsive choice counted as a 90-s timing
      shortfall; the summary now reads delay trials.
    - **Changes results:** in six places the choice baseline's switch point was
      made the starting delay for training; training now starts below it, as
      the form's own example does.
    - Johnson and Bickel's (2008) criteria for nonsystematic data, named in the
      walkthrough, are now applied to the delay probe.
    - AUC, k, h, integrity, IOA and the graph now recompute on every change,
      after Open data and before printing.
    - Open data accepted another form's file (an AD-1 file emptied every
      table); phase names could run as script; Generate steps replaced the
      ladder without asking.
    - Walkthrough and job aids: a titration drill answer that broke the
      titration it teaches, an immediate trial scored "independent", and a
      90% integrity bar where Tab 7 uses 80%.
    - Also fixed: print, phone width.

## Form audit, batch 5: CF-1, PR-1, CR-1, CT-1 (v21.19)

Same method as batch 4.

- **CF-1.** 23 statements: 11 verified; 5 corrected (4 imprecise, 1
  incorrect); 7 not verifiable. A reference list of five works was added.
  - The instrument is the Self-Assessment of Contextual Fit in Schools
    (Horner, Salentine and Albin, 2003); there is no "ACF". No study by
    "McIntosh et al. on its measurement properties" could be found, and that
    line is removed. Poor fit is no longer called "the usual reason" plans
    fail, and launching with poor fit no longer "will produce" low integrity.
  - The Guide now says that the published total averages the subscale means,
    whereas this form averages every rating (the form's own rule, kept); no
    band changes on the simulation.
  - Function fixes:
    - A threshold in an opened file ran as script; another form's file (an
      ST-1 file) silently filled the form.
    - The verdict ignored flagged items, missing ratings and when the form was
      given.
    - A removed respondent's ratings came back under the next one added.
    - Names and open-action counts went stale on other sheets.
    - Also fixed: the saved file's date (UTC), weekend and future simulation
      dates with wrong narrative figures, print, phone width.
- **PR-1.** 14 statements: 3 verified; 6 corrected (5 imprecise, 1
  incorrect); 5 not verifiable. A reference list of five works was added.
  - Below a contextual-fit score of 4, PR-1 said the conditions for running the
    plan were not present; CF-1 says that only below 3 (3 to 4 is its "poor
    fit" band). "A temporary increase at each step is expected" now gives
    Briggs et al.'s (2018) figure: resurgence at 42% of thinning steps, always
    temporary. Fading now "risks returning" the behavior rather than "will
    return" it.
  - Function fixes:
    - **Typing 4.25 into the data table recorded 52.4**; every number typed
      there was scrambled the same way.
    - **Changes results:** the suggestion ignored low critical-step integrity,
      said "begin fading" while the replacement behavior was "Not yet", read a
      zero baseline as "risen", and used period 1 as the baseline when the
      baseline row was blank.
    - The exit verdict said "can stop" with blank entries.
    - Another form's file silently replaced the record; removed rows came back
      after reopening.
    - A decision check was added and the rules are written out in the Guide.
    - Also fixed: the saved file's date (UTC), graph overlaps and a baseline
      line joined across the phase line, print, phone width, simulation dates
      on weekends and in summer.
  - Its 80% integrity line is now the shared 90% criterion (see "Decisions,
    v21.20" below).
- **CR-1.** 51 statements, checked against section 1003.573, Florida Statutes
  (2026, unchanged since 2023; no Florida Administrative Code rule implements
  it): 34 verified; 13 imprecise, now corrected; 4 not verifiable.
  - The Guide cited the 2024 edition; its physical-restraint row omitted who
    may restrain; it now says the section covers students with an IEP in
    kindergarten through grade 12 (not prekindergarten, residential care or
    DJJ programs); it listed 8 of the statute's 10 restraint-reduction
    activities; two readiness-check items were incomplete; and the debriefing
    verdict presented the form's own rule as the statute's.
  - Function fixes:
    - **Safety:** the simulated plan held a student with asthma "until
      breathing settles". Section 1003.573(3)(b) requires release as soon as
      the threat has dissipated; release now follows the threat alone, and
      laboured breathing ends the hold and brings the nurse.
    - Another form's file (an ST-1 file) overwrote the student name and
      emptied the record.
    - The team verdict counted an absent parent as represented and did not
      update as names were typed; a declined debriefing change counted as a
      change; the plan said "(6)(c) is satisfied" with no date or method
      recorded.
    - Setup and log restraint counts could disagree silently; blank statuses
      on the log read as "none"; "Remove last" deleted logged restraints
      without asking.
    - Also fixed: the saved file's date (UTC), weekend simulation dates,
      spelling, print, phone width.
  - The combined "physical or behavioral" team group and the "Not yet —
    overdue" option were decided in v21.20 (see "Decisions, v21.20" below).
    Dates remain free text, so no deadlines are computed.
- **CT-1.** 33 statements: 11 verified; 10 corrected (6 imprecise, 4
  incorrect); 12 not verifiable. A reference list of seven works was added.
  - "Two days or two months" for a relapse episode had no source; the form now
    uses Briggs et al.'s hedged wording that reinforcing resurging behavior
    "would likely sustain" it. Briggs et al. did not show that trained
    therapists made episodes brief. Kimball et al. (2023) call the shortage of
    relapse-mitigation studies of caregiver behavior "a vitally important
    gap"; the form had made caregiver behavior during an episode the vitally
    important target. "An increase is normal at each step" now gives
    Briggs et al.'s 42% of steps (at least once in 76% of cases).
    "Miltenberger and colleagues" is now Himle et al. (2004) and Miltenberger
    et al. (2005).
  - Function fixes, kept consistent with ST-1, two of which **change
    results**:
    - Critical steps were pooled against the 80% criterion; they must now be
      correct every time in the rounds the decision uses (Parsons, Rollyson
      and Reid, 2012).
    - Any text in the home-probe field cleared the caregiver; a steps-correct
      figure at or above the criterion is now required.
    - A saved ST-1 file silently filled CT-1, and an opened file could run
      script.
    - 2.5 rounds crashed the page; removed steps' scores came back; records
      were padded back to six steps.
    - Round dates were saved but never shown.
    - Also fixed: the saved file's date (UTC), weekend and Labor Day
      simulation dates, print, phone width.

## Form audit, batch 6: EB-1, MS-1, RR-1, IN-1 (v21.20)

Same method as batches 4 and 5.

- **EB-1.** 11 statements: 2 verified; 4 corrected (3 imprecise, 1
  incorrect); 5 not verifiable. A sources paragraph and reference list were
  added to the Guide.
  - Guide section 3 justified honoring the request with the intermittent
    reinforcement effect, which would make the request itself more
    persistent; it now cites resurgence (Volkert et al., 2009).
  - Guide section 2 implied that limited-contact staff may hold a student who
    "needs" it; it now gives Florida's restraint limits (section 1003.573,
    F.S.) and says seclusion is prohibited.
  - The handout's footer credited FERPA with its copy and return rules; the two
    are now separated, and it no longer calls every student "him". The name of
    DRA is corrected.
  - Function fixes:
    - **Safety:** the simulated brief told bus staff they could hold the
      student, and its break sent him out of his seat on a moving bus.
    - Open data kept the previous record's values for any field the file did
      not hold; a stale brief, or a previous student's brief, could print.
    - The brief promised about one page and the simulated one ran to two; the
      page count is now measured (it matched the PDF on 43 briefs).
    - The form now warns when "Never Do This" or "Call When" is empty, and the
      "from the plan" marks clear when the text is rewritten and survive
      saving.
    - Also fixed: dates in the file name and the simulation (UTC), phone width.
  - Still open: inside the workstation, TD-1's student, ID and BCBA do not reach
    EB-1 (a workstation fix, listed under the cross-form items).
- **MS-1.** 119 statements checked against the FDA labeling, MedlinePlus and
  the cited studies: 70 verified; 40 corrected (35 imprecise, 5 incorrect); 9
  not verifiable.
  - Clozapine's REMS program ended in 2025 (ANC monitoring continues per the
    label), and "increased appetite" is in no clozapine label. Disinhibition,
    constipation and blurred vision are not documented for hydroxyzine.
    Viloxazine's boxed warning covers all patients with ADHD, not only children
    and young adults. Under the ADA/APA monitoring schedule only weight repeats
    at 4 and 8 weeks, and a normal lipid profile is repeated every 5 years.
    Li and Poling, Correll, and Schooler and Kane were misreported or
    incomplete; the dystonia and tardive dyskinesia wording now matches the
    labels.
  - Function fixes (15):
    - **Safety:** urgent symptoms were routed to "same-day" contact, and red
      flags rated 1 were never listed. Both are fixed.
    - Opening a data file could run script or half-clear the form; files are
      now checked first, and a refusal gives the reason.
    - Lowering a count silently deleted entries; it now asks first.
    - The simulations fell on weekends and told inconsistent stories.
    - Also fixed: the saved file's date (UTC), the dose row, screen-reader
      names on grid cells, print, phone width.
  - Left: blank days count as 0 in weekly means (now stated on the form).
- **RR-1.** 39 statements: 9 verified; 20 corrected (12 imprecise, 8
  incorrect); 10 not verifiable.
  - **Changes results:** "10 cumulative days triggers change of placement and
    manifestation determination" was wrong. Under 34 CFR 300.530 and 300.536,
    days are counted within one school year; at 10, further removals require
    services; above 10, a series of removals is a change of placement only if it
    forms a pattern, decided case by case, and a manifestation determination
    follows a decision to change placement. The verdict and its count now
    follow the regulation (school year July to June).
  - FERPA and IDEA access: the 45-day limit, and IDEA's "before any meeting
    regarding an IEP" (300.613). Section 1003.573 had been quoted from its 2020
    text; seclusion is now prohibited. The eligibility rules end at
    6A-6.03027, and Dual Sensory Impairment was missing from the list.
  - Wilder et al.'s third author is Wine, not Wallace; McIntosh et al. (2010)
    was cited for something it did not study; the O'Neill et al. interview does
    not begin with history; several studies were overgeneralized.
  - Function fixes:
    - "Reinforcers" wording claimed function from records; drafted text now
      stays descriptive.
    - A damaged file could wipe the record; blank entries were reported as
      "(blank)" patterns; attendance rates could go negative; rows were
      deleted without asking.
    - The simulation's dates fell on weekends (and on tomorrow's date in the
      evening), and its written counts disagreed with its own rows.
    - Also fixed: print, empty dates printing "mm/dd/yyyy", phone width, an
      unnamed select.
- **IN-1.** 22 statements: 13 verified; 3 imprecise, now corrected; 6 not
  verifiable. A reference list was added (O'Neill et al., 2015; Hanley, 2012).
  - The Guide and the synthesis implied that direct observation (ABC-1, SP-1)
    tests or settles function; they now match IA-1: observation adds
    correlations, and the functional analysis (EA-1) is the test (Thompson and
    Iwata, 2007). Home and school disagreeing now "may" reflect the conditions,
    "not only" the reporter.
  - Function fixes (13):
    - Changing a respondent's role moved their answers onto another question
      set and could crash the page.
    - "Remove last" deleted without asking, and the answers came back under the
      next person added.
    - Print and the workstation packet carried only the selected interview,
      while "Print this respondent" printed them all.
    - Open data accepted other forms' files, and a role read from a file could
      run script.
    - Every keystroke in the respondents table raised a page error.
    - The simulated synthesis misreported its own answers and drafted escape
      alone as the hypothesis.
    - Also fixed: the saved file's date (UTC), weekend simulation dates, the
      heading not updating, answer boxes without names, legends, phone width.

## Form audit, batch 7: DM-1, IC-1 (v21.20)

The last two forms, audited the same way. Every one of the 26 forms that had
not been rebuilt in this series has now had its sources checked and its
functions tested (AD-1, MT-1's timer, ABC-1, EA-1, PA-1 and RA-1 were built or
rebuilt with their own tests in v21.13 to v21.16).

- **DM-1.** 29 statements: 14 verified; 15 corrected (12 imprecise, 3
  incorrect). 61 diagnosis codes checked against the ICD-10-CM (FY2026) and
  the APA's coding updates: 54 verified, 7 corrected.
  - FERPA wording (34 CFR 99.30, 99.4); BACB Code items 2.03 and 2.05 were
    cited for things they do not say; Rule 6A-6.03311(8) on the transfer of
    rights at 18; the eligibility rules end at 6A-6.03027.
  - Codes: obsessive-compulsive disorder is F42.2 (not F42.9); Q86.0 is fetal
    alcohol syndrome (dysmorphic), not the whole spectrum; the traumatic brain
    injury sequela code is S06.9XAS (loss of consciousness status unknown).
  - Function fixes:
    - Open data refuses another form's file and changes nothing.
    - Dates in the file name, the release expiry and the print date were
      wrong in the evening (UTC).
    - Simulated cases use school days, and grades match ages.
    - New messages for the transfer-of-rights notice due at 17 and for a birth
      date after today.
    - A diagnosis reported by a parent no longer gets a code filled in.
    - Four missing forms were added to the packet list; rows are deleted only
      after asking; print went from 13 pages to 8; desktop and phone layout.
- **IC-1.** 45 statements: 16 verified; 23 corrected (21 imprecise, 2
  incorrect); 6 not verifiable.
  - "An FBA that focuses on one student is an evaluation" was broader than the
    Department of Education's letters (2007 to 2013) and its 2024 guidance:
    consent is required when the FBA is, or is part of, an initial evaluation
    or a reevaluation. The 2024 guidance is now cited.
  - BACB Code 2.13 was cited for consent and says nothing about it; the 2.08,
    2.09, 2.11 and 34 CFR 300.503 summaries were incomplete. Also corrected:
    Florida's transfer of rights at 18, the 45-day records access, the
    independent evaluation "at public expense", the FERPA release wording,
    "no response" limited to reevaluations, an author's name in Kahng et al.
    (2015), and the order of the Florida rules.
  - Function fixes:
    - Open data emptied the form before refusing a bad file, and fetched web
      addresses found in signature fields; it now checks first and loads only
      signature images.
    - The workstation's field-by-field restore lost both signatures and every
      log row.
    - The status box showed "Current" wrongly and counted procedures as
      covered after a refusal or revocation.
    - The revoked simulated case kept assessing after revocation.
    - Lowering the row counts deleted entries without asking.
    - Also fixed: the saved file's date (UTC), weekend simulation dates, print
      splitting the decision from the signatures, phone width.

## Decisions, v21.20

Three items the audits left open were decided.

**One integrity criterion: 90%.** PR-1, TI-1, TD-1 and DT-1 now use the same
figure. TI-1 already defaulted to it and TD-1 already stated it; PR-1 used 80%
with an "adequate but not high" band from 80% to 90%, and DT-1 used a 90%
target with retraining only below 80%. Now, on every form: integrity of 90% or
better (and, where critical steps are scored, critical-step integrity of 90% or
better) before the behavior data are read as a test of the plan; below that,
retrain on the missed steps and treat the data as a test of implementation,
not of the plan. Why 90% rather than 80%:
- The figure's job is to say whether the behavior data can be read as a test
  of the plan as written, the independent variable, so it should be set high.
- 80% is the usual minimum for interobserver agreement, a measure of
  agreement between observers; borrowing it for integrity mixes two different
  questions.
- St. Peter Pipkin, Vollmer and Sloman (2010) found errors that reinforce the
  problem behavior more detrimental than failures to reinforce the
  alternative. A few such errors can sit inside an overall figure that looks
  acceptable, which is why critical steps are checked separately.
- Staff are trained to 90% on ST-1, so the monitoring criterion matches the
  training criterion.
- 90% is a convention, not a finding; the forms say so. PR-1 files store no
  criterion, so records saved earlier are now read at 90%: an 85% record that
  read "adequate" now reads "not running as written".
- CT-1's caregiver-training criterion stays at 80% by design: it is a mastery
  criterion for caregivers learning the plan, set lower on purpose, and the
  form states its reasons.

**CR-1, the team.** The third group of section 1003.573(6)(a), "applicable
physical and behavioral health professionals", was one option. It is now two:
Physical health professional and Behavioral health professional. The team
verdict always asks for the parent or guardian, school personnel and a
behavioral health professional (the plan addresses dangerous behavior), and
asks for a physical health professional whenever the plan records a physical
health concern or a medical alert; otherwise it notes that none is required
and suggests adding one if any applies. A record saved with the old combined
group keeps it visible, counts it toward neither group, and asks you to choose.

**CR-1, the incident report.** "Not yet — overdue" assumed every debriefing
comes after the report's deadline. The choices are now "Not yet, and still
within the time allowed" and "Not yet, and past the time allowed (overdue)";
records saved with the old choice open as the second. Also fixed in CR-1: a
field-by-field workstation restore brought back only the first logged
restraint.

## Cross-Form Pass and DD-1 Graphs (v21.21)

### Across the workstation
- **Local dates.** 23 places took the date from UTC, which in Florida is
  already tomorrow after 8 p.m.: the saved-file names of 16 forms and of the
  case file, ABC-1's default dates, and several simulations. All now use the
  local date. Full timestamps inside saved files stay UTC, as they should.
- **Text shown as text.** In ten forms (ABC-1, AD-1, DD-1, EA-1, FS-1, PA-1,
  RA-1, ST-1, TI-1 and TD-1), text typed, opened or restored could be read as
  markup: a name or step containing "<", "&" or quotes displayed wrongly, and
  text in an opened file could run script. Fixed. Three forms (ABC-1, DD-1 and
  PA-1) also no longer crash on an unexpected value in a saved file.
  `qa/xss-check.js` now checks all 31 forms by every route (the form's own
  file, a field-by-field restore, typing, the shell and the packet).
- **ABC-1** saves "Function established by FA" with the record.
- **TI-1, ST-1 and CT-1.** The error labels read "Commission" and "Omission"
  (they were "Com" and "Omm"). The stored codes are unchanged, so saved files
  open as before.
- **TD-1's plan in GB-1 and EB-1.** TD-1's student name, ID, setting and BCBA
  now reach GB-1 and EB-1, inside the workstation and from a case file, and
  GB-1 also reads the one-file edition's case files. TD-1's "Describe" field is
  now "Replacement behavior", which is how TD-1, GB-1 and EB-1 all use it, so
  GB-1's objective from the simulation reads "…will press the break card
  (simulated) independently in at least 80% of opportunities across 3
  consecutive sessions…".
- **TD-1 references.** 56 verified entries were added to the reference list
  (186 to 242). Still open: four citations that could not be matched to one
  work (Singh et al., 2007 and 2011; Lerman et al., 2018; the Carr and LeBlanc,
  2006, chapter) and four citation errors found while checking (the third
  author of Jerome et al., 2007, is Sturmey; Fuhrman et al.'s year; what Neely,
  2020, and Banerjee, 2022, studied; what DeLeon, 2011b, found).
- **Saved files.** Files saved in v21.9, v21.16 and v21.20 open in every form
  (`qa/compat-check.js`).

### DD-1: graphs
- **Phase shading.** Analysis options → Phase shading: Off, Alternate by full
  phase (the default, as in Prism graphs, where a within-phase line does not
  change the shade), or Alternate by every section (full phase changes and
  conditional changes). A record whose sections are marked as conditional
  changes, such as school years, needs "every section". The gray prints whether
  or not the browser prints backgrounds, and the stability envelope is now
  described as the band in the behavior's color, so the two cannot be confused.
- **Vertical axis.** For reduction targets the top is 1.5 times the highest
  point (the default), 2 times, or the highest point, rounded up to a round
  number: a highest point of 50 gives 0–75 or 0–100. Counts step in whole
  numbers and run to at least 5; a count at 0 every day now reads 0–5, not 0–1
  in steps of 0.2. Every behavior has a "Y-axis maximum" field (blank means
  automatic) to put several graphs on one scale; a point above it is drawn on
  the top edge with a caution. Percentages stay 0–100.
- **Phase labels.** Condition names are centered over their condition, and
  conditional-change labels over their section (from their line to the next
  line or the end of the graph), in a band above the plot. Labels wrap to fit,
  "|" forces a line break ("School year | 2025–2026"), and a label too long for
  a narrow section becomes a number with its text under the graph. Nothing
  overlaps.
- **Pasting dates.** A column of dates copied from Google Sheets or Excel and
  pasted on a Date cell fills that row and the rows below, adding rows as
  needed (M/D/YYYY, M/D/YY, YYYY-MM-DD, D-Mon-YYYY, "Sep 3, 2024", with or
  without a weekday). Several columns copied together fill the dates and the
  values beside them. A note names any line that is not a date. The date picker
  stays, and a "Paste dates" button opens a box for browsers that do not pass
  a paste to a date field.
- **From the user's Prism graphs:**
  - the mean level's value ("Mean 5.24") at the right end of its line, clear of
    the data and the trend line;
  - optional trend labels (accelerating, decelerating, zero-celerating);
  - a Total column and sentence for counts and durations ("These data total 12
    occurrences over 2 days in Baseline…");
  - NAP beside Tau (Parker and Vannest, 2009), shown as a percentage with no
    interpretive ranges;
  - the x-axis ends at the last day with data or the last marked change, not
    at empty rows added ahead of time.

  Not taken: a fill under the data path (it merges with the envelope band),
  and lag-1 autocorrelation (its primary source could not be read).
- **Print.** A behavior with no data prints as a short entry that shares the
  page; the across-condition box no longer makes a page of its own; legends
  list only what is drawn.

## CR-1 Deadline Clock, RR-1 Removal Ledger, TD-1 Sources (v21.22)

### CR-1: the incident deadline clock and notice log
- **Times for each restraint.** Each restraint on the log gets a card with the
  date and time the restraint began, the student was released, and the
  report was completed. Now and Today buttons fill the moment of entry. The
  log's typed date is kept exactly as typed; an unambiguous M/D/YY date gets
  a one-click "Use …" button.
- **Deadlines**, from the times entered, as section 1003.573, F.S. (2026),
  words them (re-read on flsenate.gov and quoted on the sheet):
  - the incident report: within 24 hours after the release, or, when the
    release is on a day before the school closes, by the end of the school
    day on the day the school reopens ((7)(a));
  - the written notice to the parent: before the end of the school day on
    which the restraint occurs, with documented efforts by telephone or
    e-mail ((7)(c));
  - the completed report by mail: within 3 school days ((7)(d));
  - the crisis plan and its copy to the parent at the second restraint in a
    semester ((6)(a), (6)(c)), shown without a computed time.
- **Status** for each: due by, met on, late, overdue since, or "to confirm".
  The statute never says when the school day ends, so the form never turns
  it into a clock time: a same-day notice is confirmed with a tick in the
  statute's words. The 24-hour report gets a live countdown on screen (and a
  pill on other sheets); it does not print.
- **School days** are Monday to Friday minus a No-school days list you keep
  (holidays, planning days, closures), saved with the record. The form knows
  no district calendar, and district policy may set earlier deadlines; the
  sheet says both.
- **Notice log for each restraint:** written notice (date and time),
  telephone and e-mail attempts (date, time, method, outcome), the parent's
  signed acknowledgment, the date the report was mailed, and the report's
  acknowledgment. A new card counts parent notices late or missing.
- **Readiness check.** Choose the restraint under "Restraint on the log", and
  the check reads that restraint's notice log. Where the log records an item,
  the old tick for it is set aside but kept in the file; where it does not,
  the tick stands. Files saved earlier open exactly as before.
- **Paper:** the no-school days, and for each restraint a deadlines table and
  a notice-log table, stamped "Statuses as of …".

### RR-1: the removal-day ledger
- **A Removal days sheet**, one row per removal: dates (or one date with a
  portion of a day), type (out-of-school suspension, in-school suspension,
  bus suspension, interim alternative educational setting, sent home early,
  other), school days (computed, editable with a reason), counts toward the
  total (not yet classified, yes, no, team to decide) with the reason,
  special circumstances, and notes. Each date sets its school year (July to
  June); a removal crossing 1 July is split.
- **Totals and flags per school year**, worded as 34 CFR 300.530 and 300.536
  word them (quoted on the sheet from the eCFR, cross-checked against the
  Department's IDEA site):
  - 10 counted days: services during any subsequent days of removal
    (300.530(b)(2));
  - one removal of more than 10 consecutive school days: a change of placement
    (300.536(a)(1));
  - removals totaling more than 10 days: a change of placement only if they
    form a pattern, decided case by case (300.536(a)(2), (b)(1)). The form
    records the team's determination; it never makes it;
  - after a decision to change placement: notice on the date of the decision
    (300.530(h)) and the manifestation determination within 10 school days
    (300.530(e)), with the date it is due; the FBA and BIP duties if the
    conduct is a manifestation (300.530(f)); special circumstances
    (300.530(g)).
- **What counts.** Beside "Counts toward" the sheet quotes the Department's
  2022 discipline Q&A (Questions C-6, C-7 and C-8 on shortened days,
  in-school suspension and bus suspension). The classification stays the
  team's. Partial days count as the fraction entered; no source says how,
  and the sheet says so.
- **School days** exclude weekends and a No-school days list you keep.
- **One count.** "Add to ledger" on an incident carries its date and type
  across; the Days removed card, the verdict and the synthesis read the
  ledger. Old records carry their "Days out" entries into the ledger as
  counted rows, so their totals are unchanged.
- **Also fixed:** a field-by-field workstation restore could wipe rows.

### TD-1: citations and the simulated cases
- Jerome, Frantino, and Sturmey (2007), not Zane. The lag-schedule note now
  cites Fuhrman et al. (2022) for its review (only three studies had tested
  expanded-operant treatment for relapse, all of serial training, with
  inconsistent results), and Neely et al. (2020) and Banerjee et al. (2022)
  only for what they studied: resurgence across languages in bilingual FCT,
  not a lag schedule. DeLeon et al. (2011b): noncontingent delivery lowered
  later preference, although break points still rose, least of four
  conditions.
- The unmatched citations are resolved: Carr and LeBlanc (2006, the NCR
  chapter in Luiselli's volume) and Singh et al. (2007, the study with
  moderate intellectual disability) are identified and listed; Singh et al.
  (2011) now names the three 2011 studies it could mean; Lerman et al. (2018)
  could not be identified and was removed. The reference list has 247
  entries.
- **Simulated cases.** Each functional communication response now requests
  its function's reinforcer: attention for the attention case, the tablet for
  the tangible case, a break for escape, with matching extinction steps and
  materials. Head hitting (automatic, Subtype 2) no longer borrows the chew
  tube: its alternatives are head-directed and its response interruption uses
  motor demands. Six contradictions inside cases were fixed, among them a
  noncontingent escape interval set above the mean interresponse time and a
  crisis trigger that almost every baseline session would have met.

## Live Recording on DD-1, TI-1 and OB-1; PR-1 Reads DD-1 (v21.23)

### DD-1: live recording at the table
- **Live Recording panel** on the daily data view. A session timer (start,
  pause, resume, end) counts observation minutes with pauses left out, with
  an optional planned length and an end alert (sound, flash and vibration,
  each switchable). It shows the date it will write to and the condition in
  effect.
- **One control per behavior,** in its color, grouped as the form groups
  them: a tap counter for frequency and rate (rate shown as count ÷
  minutes); start and stop for duration (each episode also goes to the
  episode log, never overlapping); cue and response for latency; a tap per
  opportunity for percentages and prompt levels. Interval measures
  (momentary, partial and whole interval) point to MT-1's timer and are typed
  by hand, because DD-1 does not keep interval-by-interval scores.
- **Undo** for each behavior, and "Undo last entry" (Z). Keys 1–9 tap the
  behaviors in order; Space pauses.
- **Save to today's row** (or a date you choose) writes the minutes and each
  value into that date's row, creating it if needed. Where the row already
  holds a value, it asks per behavior: Add (the default: a day's total is
  the sum of its sessions), Replace or Skip, showing what each gives.
  Percentages combine over opportunities; latency, interresponse time and
  prompt level combine as a mean over trials; rate and percent of time are
  recomputed with the added minutes. Nothing is written until you save, and
  Discard asks first.
- Guards: saving is refused if another case was opened into DD-1 during the
  session, an idle panel moves to the new day at midnight, and a time block
  the session saw for under a minute is not filled with zeros.

### TI-1: the live observation runner and the retraining list
- **Runner** on the Scoring sheet: choose the observation column (the next
  empty one by default), announced or unannounced; the date and start time
  are filled in. Code one step at a time or with all steps listed, with large
  Correct, Commission, Omission and N/A buttons (keys C, M, O, N, arrows,
  Z to undo, Space to pause), while overall and critical-step integrity run
  against the 90% criterion.
- A step that comes due more than once is coded per opportunity. The step
  then scores Commission if any opportunity was a commission error, otherwise
  Omission, otherwise Correct, and N/A only if it never came due. How TI-1
  computes integrity is unchanged.
- **End** lists uncoded steps and unscored critical steps. Nothing reaches the
  grid until you save; replacing a column that holds codes asks first.
- **"Save retraining list for ST-1"** writes a file with the student, the
  criterion, the deciding observations with their integrity figures, and each
  step to retrain (its text, critical mark, codes, and commission and omission
  counts). ST-1 reads it (see below).

### PR-1: import from DD-1
- **Import From DD-1** (beside Add period) reads DD-1 inside the workstation,
  from a DD-1 data file, or from a case file. Another form's file is refused
  with its name.
- For each period it takes DD-1's own figures: level (mean per day), days
  with data, SD, range and the least-squares trend, named as such. The level
  goes into the table; the rest into a "From Form DD-1" panel that records
  the source, the behavior and the import date. Median levels and
  split-middle trends set in DD-1 are not carried; the import says so.
  Undated DD-1 rows are left out.
- A **Unit** row holds each column's unit; the graph labels its axis with it,
  and the replacement gets its own right-hand axis when the units differ.
  Nothing is overwritten without a keep-or-replace choice. Integrity stays
  with TI-1.

### OB-1: the live recorder
- At the top of the Observations view: a timer with pause, resume and end;
  an optional planned length with the end alert; large Student and Peer
  counters with count and rate per hour; the toolbar's interval sample with a
  prompt at the end of each interval not yet scored (none for intervals
  already scored). Undo for each counter and for interval marks; keys shown on
  the buttons, including "− for both" (4).
- "Save to the record" writes into the sheet's own fields, asks before
  replacing anything, and adds a narrative line with the time the sample
  began and a note on any pause or unscored interval.
- The **Minutes** box can now be typed into, so a paused observation records
  the minutes actually observed. Records saved earlier open as before.

### The workstation
- **A relay between forms.** A form can ask the workstation for another open
  form's data (PR-1 reads DD-1 this way; ST-1 reads TI-1). The workstation
  answers only its own forms, and only for known form names; a form that is
  not open, or does not answer, is reported as such.

## ST-1 and CT-1 Rehearsal Runner; ST-1 Reads TI-1 (v21.24)

- **Rehearsal Runner, on ST-1 and CT-1.** For a training round at the table or
  on a home visit (usable on a phone):
  - Pick the next empty round (or another) and its type; the date is filled
    in, and a round timer runs.
  - Code one step at a time or with all steps listed. Each step shows its
    text and critical mark, with large Correct, Commission, Omission and N/A
    buttons (keys C, M, O, N, arrows, Z to undo, Space to pause).
  - While coding, the percent of steps correct and the critical steps run
    against the form's criterion.
  - At the end of each round a feedback prompt lists that round's missed
    steps with their error types, critical steps first, for feedback before
    the next rehearsal.
  - Nothing reaches the grid until you save; replacing a coded round asks
    first, and the form's decision recomputes. A step coded more than once in
    a round goes to the grid by TI-1's rule (Commission if any, otherwise
    Omission, otherwise Correct), stated in the Guide as a working
    convention.
- **CT-1's home probe, scored step by step.** When the round is the home
  probe, the runner saves it as a "Home probe" round and fills the probe's
  steps-correct figure. A new "Critical steps correct on the probe" field
  holds the critical steps. When filled, the decision requires 100% of them;
  when blank, decisions are exactly as before.
- **ST-1: Import From TI-1**, three ways: inside the workstation (through the
  relay), from TI-1's retraining list file, or from TI-1's own data file.
  Choose what to take:
  - TI-1's protocol steps with their critical marks, to set up the training;
  - the steps to retrain (below criterion or with errors on TI-1's deciding
    observations), marked with their error pattern and offered first in the
    runner;
  - the in-situ probe: the date, overall integrity and critical-step
    integrity of TI-1's deciding unannounced observation, so ST-1's gate uses
    TI-1's own figures. A TI-1 probe is offered only if it is dated on or
    after the last scored rehearsal round.

  Nothing is overwritten without a keep-or-replace choice, and the source
  and import date are kept with the record. A new "Critical-step integrity
  (TI-1)" field works like CT-1's: 100% required when filled, no change when
  blank.
- **Rounding.** Where rounding to two decimals would carry a figure across the
  criterion, the exact fraction is written instead (for example "2/3").

## Design Pass on Screen, Fullscreen and the Form List (v21.25)

Every form and the workstation were looked at again on a laptop, a tablet and a
phone, with one rule: nothing on paper changes. What changed on screen:

### The forms

Each of the 31 forms carries one more shared block, `nbh-polish-css` and
`nbh-polish` (in `tools/polish/`, put into every form by
`tools/apply-polish.py`). Every rule sits inside `@media screen`, so a form
prints exactly as it did.

- **Fields.** The forms draw their fields three ways: as a bordered box, as a
  line to write on, or as a bare control inside a grid cell or a bordered
  row. A single style forced on all three would break the grids, so the
  script reads each field's own style and marks it `nbh-box`, `nbh-ul` or
  `nbh-bare` (and `nbh-intd` inside a table cell). A boxed field is taller
  (38px; 32px in a table), rounded, with a clear border and one chevron on
  every dropdown; a line keeps its line, drawn more surely; and all three
  light up the same way under the cursor: a blue border or underline and a
  soft ring, so the field being typed in is unmistakable. On a phone a
  field's text is 16px, which stops the screen zooming in when it is
  tapped. Placeholders are darker (4.5:1). Checkboxes and radios are navy.
- **Buttons.** The tools inside a sheet, the actions above a tab-built form
  and the toolbar's controls share one family: 34px tall (32px in the
  toolbar), 6px corners, navy for the main action, white with a rule for the
  rest, red for taking something away, and one focus ring.
- **Tables.** Header cells are mist with navy text in every table; a table
  with five rows or more that does not colour its own cells gets light
  shading on every other row (`nbh-zebra`), and figures line up
  (`tabular-nums`). Grids that colour their cells (the scatter plot, the
  interval sheets, the heat map) are left exactly as they were.
- **Tabs.** The view tabs on the five tab-built forms are 44px tall with a
  navy underline on the open one; the segmented view control on the other
  26 keeps its white pressed state with rounded ends.
- **Instruction text uses the width the screen has.** The forms cap their
  guidance paragraphs at 60 to 80 characters, a print measure that read as a
  narrow column on a wide screen, the more so with the sheet scaled up. The
  script marks each leaf text block that carries such a cap (`nbh-wide`) and
  on screen the cap becomes the sheet's own width, 140 characters at most;
  paper keeps the form's measure. Wrappers with blocks inside keep their
  width, so cards and grids are untouched.
- **The sheet** reads as one card: 8px corners and a soft shadow on a calm
  page. **Focus** is one 3px blue ring on every button, link, tab and
  checkbox (WCAG 2.4.7); the fields have their own, above.

The bridge inside each form hands every `<style>` to the master print; the
polish is screen-only and is kept out of the packet (the style block is
marked `data-nbh-screen` and the one line that collects styles skips it).

Two things on screen can still reach paper, and both are handled. The
field-care script measures each textarea's height on screen and keeps it as
an inline style, which a print and the packet carry: so the polish leaves a
textarea's padding alone, and while a print is taken or the packet reads the
form (`window.nbhPolish.plain`, called from the bridge's collect branch and
on beforeprint) the phone text size steps aside and every textarea is
measured again, so the heights on paper are the ones it had before. Verified
by printing PR-1, IN-1, IC-1 and CT-1 from a 390px-wide window before and
after the pass: the four pairs of PDFs are byte-identical.

The one-file editions carry every form and are about 3.8 MB each.

### The workstation

- **Fullscreen.** A button above the open form (and Ctrl+Shift+F, ⌘⇧F on a
  Mac, from the page or from inside the form) puts away the heading, the
  packet bar and the list, leaving the form under a slim bar that carries the
  logo, the form's name, its id, the field count and the same buttons. Esc
  brings everything back, from inside the form too; so does the button. Where
  the browser allows it, **Fill screen** beside it takes the browser's own
  bars away as well.
- **The list can be hidden** on a wide window from the corner of its own
  head, and brought back with **Forms** above the form; the choice is
  remembered (`nbh.ws.rail`, a view preference shared by both editions like
  `nbh.fitScreen`). A **Find a form or command** control at the top of the
  list opens the palette. On a narrow window the list is a drawer, as
  before, and that button closes it.
- **A phone.** The packet bar folds behind a button in the heading that
  carries the student's name once one is known (in italics, with **Use this
  name** beside it, while the name is only one read out of an open form); the buttons over the form
  show their icons and keep their names for a screen reader; nothing runs
  off the edge any more (the bar over a form used to).
- **The rest.** The list's rows are 40px, the open form has a teal edge and
  its field count in a pill, the stage headings stay put while the list
  scrolls; the packet bar's Save/Open pairs are joined; the autosave chip is
  a pill with a dot; the start screen is a card with the three steps; the
  dialogs, the command palette and the help are on the same 6px/10px
  corners. Escape closes, in order, the palette, a dialog, the drawer, then
  fullscreen; the drawer never opens over fullscreen. The palette (⌘K) knows "Fullscreen" and "Show or hide the form
  list"; Help describes them. CSS and script in `index.html` only; the
  forms' bridge is unchanged.

### What was checked

| Check | Result |
|---|---|
| Every form printed on its own from the same data, before and after (31 PDFs) | 29 of 31 byte-identical; ABC-1 and CR-1 differ only in the clock time each stamps on the page (a new incident’s start time; "Statuses as of") |
| The master print of all 31 forms from the same case file, before and after | 372 pages, identical apart from those two clock times |
| axe-core, WCAG 2.1 A and AA: the workstation empty, with a form open, fullscreen, Help open; every form with its simulation loaded (before and after) | 0 violations before, 0 after |
| Fields the polish script could not classify, across the 31 forms | 0 |
| Script errors opening every form on its own and every view, desktop and phone | none, over 544 screenshots |
| Fullscreen on and off by button, Escape, Escape from inside a form, and the shortcut from both; the hidden list and its memory | pass |
| The workstation's views at 1440, 1024 and 390px wide; every view of every form at 1440 and 390px, looked at | 545 screenshots, every view of every form at 1440 and 390px, each form read by its own reviewer and every reported regression checked by a second: 28 confirmed, all of one of six kinds (a row-header cell painted only in a table’s first row; an underlined dropdown shorter than the underlined field beside it; one dropdown too tight for its text; a button shorter than the field beside it; the card’s corners on a phone; the view control wrapping on a phone), all fixed and looked at again |

The checks are in `qa/` in the repository, with a README; `qa/printbase.js`
keeps each form's data between runs so the before and after PDFs are made
from the same entries.

## Form PD-1, Form SV-1, the 2026 Literature Pass and the Page Bar (v21.26)

Two forms are new and ten were extended from a set of 2026 papers and the
PDC-HS materials. Every research statement printed on a form was written
from reading notes that quote the source, with the citation beside it, and
each form's Guide says in its own words what the sources do not support.
Where a number is needed that no source fixes (a cut-off, a band, a count of
sessions), the form states it as its own working convention.

### Form PD-1, Performance Diagnostic Checklist (new)

`PD-1_Performance-Diagnostic-Checklist_v2026-09.html`, listed under
Implementation after TI-1. It is for the moment a plan component is not being
run by the adult who is meant to run it, and asks why before deciding what to
do: performance analysis is the organizational equivalent of the functional
assessment of problem behavior (Brand, Sellers, Wilder & Carr, 2022).

- **The instrument.** The PDC-HS (Carr, Wilder, Majdalany, Mathisen & Strain,
  2013) in its 1.1 revision, reproduced word for word: 22 items in four
  domains (Training; Task Clarification and Prompting; Resources, Materials
  and Processes; Performance Consequences, Effort and Competition), the
  training sub-items 1a to 1d with their method boxes, every follow-up (when
  trained, reminder frequency, the four-row material, time, task, employee
  and competing-task lists, monitoring frequency, feedback by whom, how often,
  how long after, focus and type, effects seen), the NO-versus-N/A rule and
  the direct-observation tips. The instrument's skip rules are applied: the
  sub-items appear only when item 1 is Yes; resources items 3 to 5 are set to
  N/A when item 2 is N/A; item 7 is N/A when item 6 is Yes. The eight
  asterisked items carry a "Verified by" choice (direct observation, employee
  interview, both, not yet). Seven supplementary items from the business PDC
  (Austin, 2000; ABA Technologies, 2020) are offered at the end, labelled as
  such and never scored.
- **Setup** records the staff member, role, supervisor, assessor, student and
  plan, how it was administered (interview of the direct supervisor, as the
  instrument requires; self-completion is flagged as valid only for a trained
  supervisor; a separate staff interview is supplementary) and the one
  performance concern as a deficit or excess, with a four-box pinpoint check,
  the current level, whether the pattern is consistent, whether others see it
  and the permanent products reviewed. The scoring is marked not ready until
  the concern and its type are entered.
- **Observations** logs up to six observations (date, typical conditions,
  items informed, what was seen, reactivity) and the optional staff
  interview, with the reasons verification matters stated from Brand et al.
  (2022).
- **Scoring** computes, per domain, the NO count, items answered, N/A and open
  items, % NO of answered, % NO of all items (the figure Wilder, Lipschultz &
  Gehrman, 2018, used), the NO item numbers and a rank by count with ties
  broken by percentage, in cards, a table and a bar chart; it lists the
  unanswered items, the asterisked items answered without a verification
  method, a count-versus-percentage disagreement, a single-instance concern
  and a blank or self-completed administration. No cut-off exists in any
  source and none is shown.
- **Plan** generates one row per NO item with the sample intervention and the
  citations from the instrument's own planning table (behavioral skills
  training, enhanced written instructions, task clarification and checklists,
  prompts, change the task location, adjust staffing, improve access to,
  redesign or reorganize materials, reassess the process, supervisor
  presence, performance feedback, highlight outcomes, reduce effort, reduce
  competing tasks; two rows are marked assessor judgement where the table has
  none), a tick and a "what it will look like here" box per row, the
  concurrent-or-consecutive choice (consecutive preferred where staff
  resources are limited), priority and rationale, the single-critical-NO
  override (Brand et al., 2022), owner, the performance measure to be tracked,
  the reassessment date, an optional acceptability rating by the supervisor
  and the staff member on Wolf's (1978) three levels, and the follow-up
  (result at reassessment; pattern across staff, the systems-level reading).
- **Guide** states what the evidence supports (each domain can be the cause;
  the indicated intervention worked where a guessed one did not, with the
  figures from Wilder et al., 2018; 100% scoring agreement there; use by
  supervisors without behavior-analytic training; the second-hand school
  reports and their non-responders), how the figures are calculated, and
  what the form does not claim (no clinically significant score, not
  validated for schools, not better than every alternative, no student
  outcome evidence, 1.1 unpublished). Reference list in the form's style.
- **Save, open, CSV, print, simulation.** A saved PD-1 file is read value by
  value into a fresh record; other forms' files are refused by name. CSV
  carries every item with its answer, verification and note, then the domain
  table. The simulation is the "trained three months ago" case from the
  PDC-HS training materials moved into a classroom (a paraeducator who runs
  the FCT practice trials on fewer than half the scheduled blocks), with 17
  NO answers, a count-versus-percentage disagreement, two observations, a
  staff interview and a consecutive plan starting with the materials.
- **Built with `tools/new-form.py`**, which assembles a new form from CF-1's
  shared parts (stylesheet, brand system, masthead, print head, packet map,
  bridge, tail blocks) and the new form's own parts (`meta.json`, `own.css`,
  `toolbar.html`, `body.html`, `script.js`), so a new form starts with the
  same save, packet and workstation behaviour as the rest.

### Form SV-1, Social Validity (new)

`SV-1_Social-Validity_v2026-09.html`, listed under Implementation after CF-1.
Contextual fit (CF-1) asks the implementers whether they can and will run the
plan; SV-1 asks the consumers, the student and the caregiver included, whether
the plan is aimed at the right thing, done in an acceptable way, and worked for
them, on Wolf's (1978) three levels, quoted word for word with page numbers.

- **Setup** holds the student, the plan, when the pre and post rounds were
  taken, the respondents (student, caregiver, implementers, administrator,
  each with a mode such as read aloud, interview or pictorial, an anonymity
  flag, dates and, for implementers, their own CF-1 values-domain means) and
  the four conditions of administration per round (options explained, no
  coercion, anonymity, the open question first). A missing student or
  caregiver row is flagged, not blocked, and the reason recorded.
- **Goals** (pre and post) and **Procedures** (pre and post; ethics, cost,
  practicality, the alternative, the reinforcers) ask an open item first,
  then rate on the 1 to 6 scale CF-1 uses, with student-worded items for the
  student and the cost items for the administrator. **Effects** (post only)
  asks what is better or worse before any rating, and reverse-scores "something
  has got worse".
- **Summary** computes means per section, round and role group, the paired
  pre-to-post change per item, items at or below the toolbar threshold, items
  on which the roles disagree, the concordance of the consumers' effect
  ratings with the PR-1 change figure and the independent-use answer (which
  never upgrades PR-1's suggestion), each implementer's CF-1 values mean
  beside their SV-1 procedures mean, a checks list, and copy-ready text for
  FS-1 (a source with no tier, no function and no strength, not counted
  toward convergence) and for PR-1 section 4. The verdict labels are the
  form's working conventions and the Guide says so.
- **Guide** carries the three levels, who judges, the boundary with CF-1,
  when to administer, how the figures are calculated and Wolf's cautions:
  that subjective data are risky data, the Berleman et al. example of high
  satisfaction with no measured effect, the ways situational contingencies
  distort a rating, and that satisfaction never replaces outcome data.
- Save, open, CSV (long format), print with both rounds captioned, and a
  simulation (a teacher, a paraeducator, a parent interviewed by phone and
  the student rating by a pictorial scale, two rounds, a flagged unplanned
  negative effect at home) as on PD-1. Built with `tools/new-form.py`.

### Forms extended from the 2026 papers

- **PA-1, competing stimulus sheet** (Breeman, Irwin Helvey & Greer, 2026;
  Frank-Crawford, Cavanaugh, Piersma & Sauter, 2026). Series with a
  no-stimulus control trial first and a randomized order (1 to 6 series,
  three by default); engagement or contact as the measure, in percent of
  intervals or responses per minute; the reduction formula with an increase
  reported as such; the published high-competition criteria as selectable
  conventions, 80% reduction the default and labelled the modal criterion
  with no consensus; high competition decoupled from engagement; augmented
  conditions (prompted engagement, prompting with blocking as necessary,
  repeated free access) with prompt and block tallies and "HC with
  disruption" labels, restricted to automatic function; a validation and
  consistency block (treatment-check correspondence within 10 points, the
  high-preference and non-indicated comparisons, a re-test table); the runner
  follows the series and conditions; guide, walkthrough and references.
- **RA-1, concurrent operants sheet** (Randall & Kranak, 2026). An
  Arrangement switch adds a condition-comparison mode: stopwatches for each
  side, neither and refusing, a condition library tagged by stimulus class, a
  pairing table that derives the constant and test variables, a
  counterbalanced session grid with the tutorial's side-duration formula, a
  phase-lined allocation graph with problem-behavior bars, the decision rules
  (60% majority for three consecutive sessions, no majority after five,
  flip-flop, side bias, problem-behavior and refusal barriers, isolated before
  synthesized), per-condition verdicts that reach the summary as relative
  evidence, three guide questions, a walkthrough example and the reference.
  The guide states that a COA identifies reinforcers for choice, not the
  function of the target behavior. Station mode is unchanged.
- **RM-1** (Mitteer, Fisher, Greer & Helvey, 2026). Setup gains the
  imminent-harm, precursor, baseline-schedule, onset-schedule and
  thinning-start fields; the inoculation plan's lean-baseline, lean
  alternative and extended-duration rows carry the pooled clinical results
  and a combined-package row is listed so it is ruled out deliberately; a
  table of the four momentum-informed strategies in pooled clinical tests
  and a table of working conventions for choosing among them; the challenge
  log defines the baseline mean; the analysis reports peak and mean raw rate
  beside proportion of baseline; six references added.
- **TD-1** (Lemons & Wilder, 2026; Fergus, Ahearn, Matthews & Pandola, 2026;
  Bann & Morris, 2026). A High-Probability Sequence Planner on the
  Antecedents sheet (target instruction, high-p pool with probe cooperation,
  sequence set and order, the study's timing values as starting values, a
  13-step fidelity checklist) with the A_HIGHP card rewritten; assessment
  add-ons on Setup (A-CSA phase, process-versus-product, component FA); a
  higher-level RRB route in the automatic selection model with five build
  cards (three competing stimuli, prompted engagement, response blocking with
  restoration and redirection, preferred-product placement, FCT keyed to a
  component-FA result), a competing-stimulus package planner with its own
  fidelity checklist and a thinning ladder; the escape, attention and
  tangible models ask whether the function came from a component FA; guide
  evidence, references and an `auto_rrb` simulation scenario.
- **TI-1, ST-1, PR-1** (O'Neill et al., 2026; Burlison et al., 2026). TI-1
  tags each protocol step as an antecedent or consequence component, counts
  opportunities on consequence steps, separates commission from omission
  errors, bands fidelity and orders retraining by error class; its hand-off
  to ST-1 carries the component, priority and counts. ST-1 rehearses the
  hard cases (the moment after the target behavior, divided attention, an
  easily missed earned reinforcer, the trial after an error) and adds a
  zero-commission gate on consequence steps before competency, with a first
  TI-1 re-check date. PR-1 imports a TI-1 record (in the workstation or from
  its file), carries fidelity across the review period beside outcome, and
  applies a plan-run gate (a form convention) before a plan is judged, with
  a retrain-before-revise route when it fails.
- **EA-1, TB-1, FS-1** (Bann & Morris, 2026; Fergus et al., 2026). EA-1 gains
  the component functional analysis (24-trial grid, evocative and reinforcing
  probabilities, cut-offs, confirmation by a multielement FA) and the
  higher-level RRB analysis (baited room, no-interaction series, the four
  reading rules, the process-versus-product and augmented
  competing-stimulus follow-ons as printed protocols with result fields),
  two simulator scenarios and a criterion selector on the interpretation
  sheet. TB-1 gains the arranging-and-ordering definition template with a
  load-into-target tool, collateral measures, safety flags and distance
  thresholds for forceful topographies. FS-1 states what the report carries
  for both formats and prints it in the report.

The one-file editions now carry 33 forms and are about 4.1 MB each; the
Royal Palm School edition is rebuilt from the same files (139 logos, 34
titles).

### The page bar

Every form now ends with a **Previous / Next** bar under its last page, built
by the polish script from the form's own view control (the segmented views or
the tab row): it names the page before and after, shows "Page n of N", and a
click opens that page and returns to the top, so the next page is a click away
without scrolling back up. It is screen-only: the bar is taken out of the
document while a print or the packet reads the form, so paper is unchanged.

### What was checked

| Check | Result |
|---|---|
| Every form printed on its own from the same data as the v21.25 run, after the page bar and the literature pass | 21 untouched forms: every page identical apart from the printed date and the clock stamps ABC-1, CR-1 and GB-1 write (checked line by line and pixel by pixel); the 10 extended forms print their new sections (page counts rise, e.g. TD-1 32 to 39, RM-1 10 to 15); PD-1 and SV-1 print from their simulations, every page read |
| axe-core, WCAG 2.1 A and AA: the workstation (empty, with a form open, fullscreen, Help) and every form with its simulation loaded, with the page bar | 0 violations |
| PD-1: skip rules, progress count, simulation, every view at 1440 and 390px, save/open round trip (identical), a CF-1 file refused, CSV, print, inside the workstation | pass, 0 script errors |
| Each extended form: inline scripts parse, simulation loaded, every view screenshotted and read, save/open round trip of every new field, print, 390px | pass for each (reports in the session) |
| The page bar on all forms: present, steps through every page, hidden in print, inside the workstation frame and on a phone | 33 of 33 |
| The master print of all 33 forms from a case file built from every simulation | 33 sections, 547 pages, no script errors, no page bar on any page; TI-1's wider opportunity table and one SV-1 table are scaled to fit as the master print does for wide parts |
| PR-1's Import from TI-1 through the workstation relay, with TI-1 open and its simulation loaded | 12 figures and the record written |
| The one-file editions: PD-1, SV-1 and TD-1 opened inside each, with the page bar | pass, no script errors |
