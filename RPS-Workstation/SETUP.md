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

## The Walkthrough Scenes Redrawn (v21.27)

The six forms with a walkthrough (PA-1, RA-1, EA-1, ABC-1, AD-1 and the Delay
Tolerance Toolkit, 50 stories between them) draw their scenes with a new engine,
`tools/scene/scene2-core.js`, assembled into each form by
`tools/scene/build-scene2.py` with the form's own board code (`*-boards.js`)
and, where it needs one, an extension module (`ext-*.js`: PA-1's item row,
plan box, tray and timer; the cropped two-person room for AD-1 and the
toolkit). The stories themselves are unchanged: the engine reads the same
frame objects the first one did.

- **People with joints.** Each figure has a shoulder, elbow, wrist, neck and
  hip; the hand goes where the pose says and the elbow follows by two-bone
  inverse kinematics, so a reach is an arc and a long reach leans the body.
  Legs sit under the table, feet on the floor; a standing student stands.
  Faces have eyes that blink, brows, a nose and a mouth that opens to speak;
  the gaze follows the hands or turns away.
- **A step is choreographed**, read from the difference between one frame and
  the next: the student picks a block from the tray, carries it over the
  station and lets it go, and the block falls into the bin, which then shows
  one more; an item the adult holds crosses the table and the student reaches
  and takes it; a high five meets in the middle; the stations' labels fade
  and return when they rotate; the tablet's screen lights and its access
  ring runs down while the collector's screen says Access; the data
  collector taps when the screen changes. The story player waits 3.6 s per
  step in Play mode so a sequence finishes before the next begins.
- **The room.** A lit wall, a baseboard and floor, a plant, a picture that
  gives way to a speech bubble, a table with a top face and a front edge,
  chairs, and soft shadows under people and props. Between steps the figures
  breathe and blink, only while the scene is on screen.
- **What does not change.** Reduced motion jumps to each step's final state
  and nothing idles. The job-aid stills are the same first frame of each
  step. Printing is untouched: the scenes sit in screen-only sections.

### What was checked

| Check | Result |
|---|---|
| Every story of the six forms stepped through on the new engine (50 stories), the drill scenes drawn | 0 script errors |
| The concurrent-operants story frame by frame: the stations' counts after every step, cancelling a step mid-way, the blink loop, reduced motion | as designed |
| The six forms printed from the stored data, against the previous run | identical apart from the date (PA-1's page 15 differs only in the competing-stimulus order, which is drawn at random when a record has none) |
| The page bar and every view of the six forms; the walkthrough at 390px | pass |

## Form SM-1: Self-Monitoring and Point Systems (v21.28)

Form SM-1 (`SM-1_Self-Monitoring-and-Point-Systems_v2026-10.html`) designs a
self-monitoring or point system for one student and prints the sheet the
student holds. It is the 34th form, listed after PD-1 in the workstation,
and it is built the same way as PD-1 and SV-1: parts assembled onto the CF-1
shell by `tools/new-form.py`, then polished.

Eight pages, in the order the work happens:

- **Setup.** Student and team, the readiness checks (discrimination of the
  target from its absence, performance deficit or skill deficit, reading or
  pictures, reinforcer assessment on PA-1 or RA-1, days of teacher-only
  baseline, history with point systems) and a verdict that says what to teach
  first and how much the teacher must match at the start.
- **Targets.** Up to six target behaviors in the student's words, each with a
  one-line cue, a picture from a built-in icon set, and a per-target goal for
  the sheets that show one.
- **System.** Six arrangements, chosen by radio card, each with its own
  fields: Self & Match (Yes/No ratings, teacher match, editable 2-1-0 points,
  text or pictorial), a self-monitoring contract (student checks, teacher
  initials), a rubric point sheet (five editable levels, the school's 1 to 5
  point sheet), cued intervals (self-monitoring of attention with a tactile,
  audible, visual or silent cue, fixed or variable timing), an interlocking
  session sheet (the school's Royal Palm manual pp. 64 to 70: items required
  change with minutes elapsed, in either direction, with a floor and a
  ceiling), and the school's expectations-and-earns sheet (smiley faces,
  "2 in a row, I can earn", totals and percent per expectation, end-of-day
  tiers). Periods or activities are a table with times and pictures.
- **Reinforcement.** Goal as a percent of points possible with the points
  possible and the goal number computed live; the goal sentence for the
  sheet; the reward menu; when the reward is delivered; the match bonus;
  what never happens (points are never removed); the home note; an optional
  group contingency; and the changing-criterion rule (step, days to hold,
  when to lower).
- **Teach and fade.** Discrimination and rating practice (examples and
  non-examples, role-play, accuracy criterion before points depend on the
  match, rule for disagreements), the matching ladder (teacher only; every
  period matched; half; random; spot checks; student alone, after Rhode,
  Morgan and Young, 1983), a nine-step staff fidelity checklist that TI-1
  can score, and the generalization and ending plan.
- **Sheet.** The student's sheet, generated from the pages above, with the
  date, a title, and the day's reward; a weekly layout where it fits; faces
  and pictures when the pictorial option is on. "Print the student sheet"
  prints the sheet alone, landscape, on one page; the ordinary print button
  prints the whole form as every other form does.
- **Record.** This week period by period (the grid totals and percents per
  expectation), the day log (phase, goal, points, possible, matches, met),
  a percent-of-points chart with phase lines, baseline mean and suggested
  first goal, and the decision rules applied to the last five days (raise
  on 4 of 5; lower on fewer than 2 of 5; step down the ladder when agreement
  is under 80%; step up at 90% and 4 of 5), all labelled working conventions.
- **Guide.** What the form builds, what the research supports, what the
  schedule does, how the figures are calculated, what keeps a sheet honest,
  and the reference list.

The guide draws on the papers supplied with the request and on the
literature behind them: Rhode, Morgan and Young (1983) for matching and its
fading; Salter and Croce (2006) for Self & Match; Bulla and Frieder (2017)
for Self & Match applied to vocal stereotypy with mixed functions; Rafferty,
Arroyo, Ginnane and Wilczynski (2011) for cued self-monitoring of attention
in general education and the nine planning steps; Farrell and McDougall
(2008) for self-monitoring of pace; Craig (2010) and Ruby and DiGennaro
Reed (2022) on the accuracy of the record; Justus, Hott and Heiniger (2023)
on teachers self-monitoring; Hallahan, Lloyd and Stoller (1982),
Amato-Zech, Hoff and Doepke (2006), Lloyd et al. (1989), Maag, Reid and
DiGangi (1993), Koegel et al. (1992), Reid, Trout and Schartz (2005);
the reviews by Briesch and Chafouleas (2009), Bruhn, McDaniel and Kreigh
(2015), Smith et al. (2022) and Vannest et al. (2010); Ivy et al. (2017)
and Hackenberg (2018) on token economies; Hartmann and Hall (1976) on the
changing criterion; and, for the schedule section, Ferster and Skinner
(1957), Berryman and Nevin (1962) on interlocking schedules, and Catania's
(2007) table of schedule combinations. The schedule section quotes Ferster
and Skinner from the Skinner Foundation e-book supplied with the request
(Chapters 1 to 5 and the opening of Chapter 6 were readable through the
Drive connector; the later chapters, the glossary and the index were not,
so the guide cites chapters, not pages, and makes no claim about the
chapters it could not read). Bird et al. (2022), on psychotropic
medication monitoring, was read and is not cited here; it belongs with
MS-1. Two chapters on arranging reinforcement, DeLeon, Bullock and Catania
(2013) and DeLeon, Graff, Frank-Crawford, Rooker and Bullock (2014), gave
the Reinforcement sheet three rows (class of back-up in the chapters'
selection order, whether the reward is available elsewhere, what grows as
the schedule thins) and the guide its rows on token loss, delay, interval
versus ratio stability, bribes and overjustification.

Data model: `S = {meta, chk, sys, tg[], per[], lv[5], lad[6], fid[9], log[],
wk{}}`, saved as `{form:'SM-1', v, S}`; files from other forms are refused.
CSV export writes the day log. "Fill with sample data" loads a 21-day
example (three targets, six periods, Self & Match) that exercises every
page.

Other changes in this version: the index lists 34 forms; `tools/build-rps.py`
and `tools/build-single.py` expect 34; the one-file editions and the RPS
edition are rebuilt.

## Form SR-1: Schedules of Reinforcement (v21.29)

Form SR-1 (`SR-1_Schedules-of-Reinforcement_v2026-10.html`) is a reference
and a design tool for schedules of reinforcement, listed after SM-1 as the
35th form. It is built from parts on the CF-1 shell like PD-1, SV-1 and
SM-1.

Six pages:

- **Catalogue.** Forty-one entries in five families: basic (continuous
  reinforcement, extinction, FR, VR, RR, FI, VI, RI, limited hold,
  progressive ratio, adjusting, and the laboratory arrangements
  interpolated, superimposed and yoked), time-based (FT, VT, NCR),
  differential reinforcement (DRO with its whole-interval, momentary,
  variable-momentary, resetting and non-resetting variants; DRL in its
  full-session, interval and spaced-responding forms; DRD; DRH; DRP; DRA;
  DRI; FCT; DNRA/DNRO; lag schedules; percentile schedules), compound
  (multiple, mixed, chained, tandem, concurrent, conjoint, alternative,
  conjunctive, interlocking, second-order, concurrent chains) and applied
  arrangements (token economies, schedule thinning after FCT or DRA,
  delayed reinforcement and delay fading, resistance to change). Each entry
  gives the notation, the definition in the words of the source that
  defined it, how it is programmed, what it produces, where the applied
  literature has used it, what goes wrong, a school example, a notes box
  that saves with the form, and its references. The family filter and the
  search box narrow the list; printing opens every entry.
- **Patterns.** Ten stylized cumulative records drawn by rule (FR, VR,
  FI, VI, extinction after CRF and after VR, spaced-responding DRL, DRH,
  progressive ratio, DRO on a target behavior) with a table on reading a
  record.
- **Choose.** Six questions (goal, how the behavior occurs, function, who
  delivers, stage, whether extinction is possible) produce a ranked list
  of schedules with a reason each, linked to the catalogue entry.
- **Design.** Student and behavior fields, then one of eleven designers:
  DRO from the baseline (interval from the mean IRT, type, resetting,
  step table to a terminal interval), DRL/DRD (full-session, interval or
  spaced-responding limits stepping down from baseline), VI/VR series
  (Fleshler-Hoffman constant-probability progression, shuffled arithmetic
  series, or random RI/RR), NCR (interval from the baseline IRT with
  omission rule and thinning), progressive ratio (sequence and breakpoint
  table), token economy (the three schedules and the price of each
  back-up, with a warning on large exchange requirements),
  multiple-schedule thinning (S+ held, S- multiplied to a terminal value
  with criteria and step-back rule), chained schedule with demand fading,
  interlocking schedule (requirement by minute), limited hold, and lag.
  Each writes the notation, the settings, the step table and the rule in
  plain words.
- **Card.** A one-page schedule card for the people who run it: the rule,
  the settings, the steps with a date-reached column, data to keep, what
  never happens, cautions and sign-off lines. "Print the schedule card"
  prints it alone; the ordinary print prints the whole form, catalogue
  open.
- **Guide.** How to read the notation, where the catalogue comes from,
  what the chooser and the designers assume (every formula and default
  stated), and the reference list, generated from the same list the
  catalogue cites so the two cannot drift apart.

Sources: Ferster and Skinner (1957) for the basic and combined schedules,
quoted from the Skinner Foundation e-book; Catania's (2007) tables of basic
schedules and schedule combinations as reproduced in DeLeon, Bullock and
Catania (2013); Zeiler (1977); Lattal and Neef (1996); Vollmer and Iwata
(1992) for the differential-reinforcement family; and the Journal of
Applied Behavior Analysis and Behavior Analysis in Practice studies named
in each entry (Deitz and Repp, Repp et al., Lindberg et al., Mazaleski et
al., Vollmer et al., Hagopian et al., Hanley et al., Greer et al., Fisher
et al., Lalli et al., Roane et al., Lee et al., Cammilleri and Hanley,
Galbicka, Athens et al., Neef et al., Borrero and Vollmer, Tiger and
Hanley, Saini et al., Lerman and colleagues, Iwata et al., and others).
Where an entry cites a study through a review rather than directly, the
entry says so.

Data model: `S = {meta, notes}`, saved as `{form:'SR-1', v, S}`; the
chooser answers and the design parameters live in `meta`, the catalogue
notes in `notes` keyed by entry id. Files from other forms are refused.
CSV export writes the catalogue (with the notes) as a spreadsheet. "Load
simulation" fills a DRO design for calling out, the chooser, and two
notes.

Other changes: the index lists 35 forms; `tools/build-rps.py` and
`tools/build-single.py` expect 35; both editions rebuilt.

## Seven New Forms, SM-1 Rebuilt, and the Pictogram Library (v21.30)

This version adds seven forms (42 in all), rebuilds Form SM-1 with new
systems and sheet designs, and gives the workstation a shared pictogram
library with photo upload. The index lists SI-1 after IN-1, DA-1 after
RA-1, SA-1 after GB-1, GC-1 and VS-1 after SR-1, HD-1 after CT-1 and
CN-1 after PR-1; `tools/build-rps.py` and `tools/build-single.py` expect
42 forms; both editions are rebuilt.

### The pictogram library (`tools/pictos/`)

`tools/pictos/pictos.json` names 227 pictograms in twelve categories
(people, needs, personal hygiene, school, expectations, feelings, places,
activities and rewards, communication, time and order, home and chores,
food and drink). `build-pictos.py` builds `nbh-pictos.js` from the
OpenMoji package (CC BY-SA 4.0, downloaded from the npm registry), plus a
few pictograms composed from OpenMoji parts (sitting, waiting, stay in my
area, line up, ask for help, first, then, countdown, and the hygiene items
OpenMoji lacks). The library is concatenated in front of the form script
when SM-1 and VS-1 are assembled (`cat tools/pictos/nbh-pictos.js
script-main.js > script.js`), so the forms stay standalone files. Both
forms also accept uploaded photos: a photo is resized to a thumbnail on a
canvas and stored as a data URL inside the saved JSON, validated on load.
A photo is the most concrete picture type and the first step of the
picture hierarchy; the pictograms are the drawings.

### SM-1 rebuilt

Two new systems: the check-in / check-out card (the Behavior Education
Program 0-1-2 daily progress report with check-in and check-out boxes,
mentor initials, a daily goal and a home copy) and the performance count
with a self-graph (items done or correct per timed session against a goal,
with a bar graph the student colors). Layout options: student-size print
(large faces and circles, big type, two pages allowed), a self-graph strip
for the week, self-evaluation lines, a pocket card (index-card version,
two to a page, for middle and high school), and teacher matching of the
rubric rating (two rows of circles and a match box). The weekly contract is
a periods-by-days grid with a numbered box per target; the rubric sheet
prints circles 1 to 5 per period; the Self & Match sheet carries a key for
the R R reminder marks; the interlocking sheet has an items-done column;
the home note is a tear-off strip; the sheet prints portrait or landscape
by style. Pictures for targets and periods come from the library or a
photo through a picker dialog. The Teach page adds the rest of the
self-management package (goal set with the student, self-evaluation,
self-instruction script, self-reinforcement) and a six-step schedule for
fading the sheet itself. The Record adds per-target percents per day, a
thin line per target on the chart, and per-target means over the last five
days. A new Contract page writes a contingency contract (parties, task,
criterion, when and where, who records, the adults' commitments, reward,
bonus, no-penalty default, renegotiation rule), checks it against Homme and
colleagues' ten rules, and prints the signed document alone. The guide and
reference list add the CICO literature (Crone, Hawken & Horner, 2010;
Hawken & Horner, 2003; Todd et al., 2008; Hawken et al., 2014; Maggin et
al., 2015; Campbell & Anderson, 2011; March & Horner, 2002), self-monitoring
of performance and self-graphing (Harris et al., 2005; DiGangi, Maag &
Rutherford, 1991), contracting (Homme et al., 1970; DeRisi & Butz, 1975;
Cantrell et al., 1969; Kelley & Stokes, 1982; Miller & Kelley, 1994;
Mruzek, Cohen & Smith, 2007; Bowman-Perrott et al., 2015), and the
self-management package (Meichenbaum & Goodman, 1971; Cooper, Heron &
Heward, 2020). Data model additions: `tg[].img`, `per[].img`, `fade[6]`,
`bck[10]`, `log[].tgp`; systems `perf` and `cico`; the SR-1 token designer
now points to TE-1 for the full economy.

## Form VS-1: Visual Supports and Communication Boards (v21.30)

Form VS-1 (`VS-1_Visual-Supports_v2026-10.html`) builds and prints the
visuals a plan needs at true size (CSS inches, previewed at the printed
size). Pages: **Board** (a communication board in the style of the school's
boards: rows by columns, a category band top or bottom in a chosen color,
a velcro dot in each cell, labels below or above, faded pictures when the
card sits on top, fill-from-category, letter landscape or portrait);
**Card sheets** (repeated picture cards for cutting at 1 to 3 inches with
the word above or below, cut guides, a count per card and the pages
computed); **Rule cards** (sixteen default expectations such as safe hands,
walking feet, sitting, waiting, quiet voice, listening ears, raise my hand,
ask for help, take a break, stay in my area, calm body, each with a short
pre-correction sentence, printed full, half or quarter page, and an
expectations poster of the ticked rules); **Strips and boards** (first-then,
a vertical or horizontal visual schedule with a Done column, a choice board,
a token board with ghosted tokens and the reward picture, a wait card with a
countdown, a five-level feelings scale with what-I-can-do lines, and
break/help/all-done/more cards); **Pictures** (the library by category and
search, and the student's own photos with labels); **Guide** (PECS and
aided AAC: Bondy & Frost, 1994; Charlop-Christy et al., 2002; Flippin et
al., 2010; Ganz et al., 2012; activity schedules: MacDuff et al., 1993;
Lequia et al., 2012; Knight et al., 2015; transitions: Dettmer et al., 2000;
choice: Shogren et al., 2004; Tiger et al., 2006; precorrection: Colvin,
Sugai & Patching, 1993; Premack, 1959; tokens: Hackenberg, 2018; delay
tolerance: Hanley et al., 2014; the evidence-based practice review:
Steinbrenner et al., 2020; and the feelings scale's limited evidence:
Buron & Curtis, 2003). "Print the visuals" prints the current page's
outputs alone, one visual per page, with the board's orientation. Data
model: `S = {meta, chk, photos[], board[], cards[], rules[], ft[2],
sched[], choice[], tk[2], fs[5]}`, each picture a `{k, ph, l}` triple
(pictogram key, photo id, label); saved as `{form:'VS-1', v, S}`; files
from other forms are refused.

## Form SA-1: Skill Acquisition Data (v21.30)

Form SA-1 (`SA-1_Skill-Acquisition-Data_v2026-10.html`) is the teaching
record for one skill-acquisition goal: the goal comes from Form GB-1, the
replacement skill from the plan on Form TD-1, the reinforcement schedule is
named from Form SR-1, and this form holds the program description and the
trial-by-trial or step-by-step data judged against the mastery criterion.
It is built from parts on the CF-1 shell like PD-1, SV-1, SM-1 and SR-1.

Six pages:

- **Setup.** Student, program name, goal (GB-1), plan (TD-1), setting,
  instructors with initials, dates; the target skill with its operational
  definition, the discriminative stimulus, the response time allowed, the
  materials and the prerequisites; the mastery criterion (percent
  independent, consecutive sessions, instructors, settings, an optional
  first-trial requirement) with the reason recorded; the teaching format
  (discrete-trial, natural environment, task-analysis chaining with
  forward, backward or total-task presentation), trials per session, the
  prompt hierarchy (least-to-most, most-to-least, graduated guidance,
  constant and progressive time delay), the delay, the inter-trial
  interval, the fading rule and the probe rule; an editable table of the
  prompt-level codes used on the sheet (I, G, V, P, F and the error code by
  default), each marked as independent, prompted or error; the
  error-correction procedure chosen from the procedures Carroll et al.
  (2015) compared, the reinforcement for independent and for prompted
  responses, the reinforcer and its source (PA-1), interspersed
  maintenance trials, and the generalization plan. A verdict lists what is
  still missing before two instructors can run the same trial.
- **Trials.** Sessions as columns, trials as rows, each cell a code from
  the hierarchy, colored by what it counts as; a date, phase (B baseline or
  probe, T teaching, M maintenance), instructor and note per session; the
  first trial of each session marked; footer rows for independent count,
  percent independent, percent correct with prompts, and the first-trial
  code; metrics; and the blank trial sheet for the clipboard with the
  student, program, S-D, definition, error correction, reinforcement and
  codes key printed, which "Print the trial sheet" prints alone on one
  landscape page.
- **Steps.** The task analysis as an editable list of steps with a status
  per step (mastered, training step, last code); the chaining type and an
  override for the current training step; a step-by-step record (steps as
  rows, sessions as columns, a prompt level per step) with percent of steps
  independent per session; metrics; and the blank task-analysis sheet,
  printed alone by its button.
- **Graph.** An SVG line graph of percent independent per session from the
  trial grid or the task analysis (following the teaching format, or chosen
  by hand), with the mastery line, dashed phase-change lines labelled
  baseline, teaching and maintenance, the line broken at phase changes,
  points filled green at or above criterion and hollow in baseline, an
  optional gray line of percent correct with prompts, and the first-trial
  code under each session. Metrics give the baseline mean, the teaching
  mean, sessions at criterion in the window and instructors in the window.
  The decision rules are applied and listed: mastered when the last N
  teaching sessions are at or above the criterion with the required number
  of distinct instructors (and independent first trials when ticked); no
  change over the last five teaching sessions (none at criterion, less than
  a 10-point gain from the first to the last) calls for a change of
  procedure; three sessions under 50% correct with prompts under
  least-to-most suggests most-to-least or a delayed prompt; a maintenance
  session below criterion calls for boosters. All are labelled working
  conventions. Fields record the decision, the change made and the next
  target.
- **Probes.** Maintenance and generalization probes with date, type, the
  dimension changed (people, setting, materials, time of day, instruction
  wording), the condition, trials, independent responses, percent and a
  pass at the criterion level; the maintenance schedule and the dimensions
  planned; metrics for maintenance probes passed and generalization
  dimensions probed and passed; a verdict naming the failed probes and the
  dimensions not yet probed; what happens when a probe fails; program
  closure.
- **Guide.** What the form builds, what the research supports, how every
  figure is calculated, running the sheet, and the reference list.

Sources: Smith (2001) and Green (2001) on discrete-trial teaching and
stimulus control; Touchette and Howard (1984) on delayed prompting and the
transfer of stimulus control; Libby, Weiss, Bancroft and Ahearn (2008) on
most-to-least against least-to-most prompting; Slocum and Tiger (2011) on
forward and backward chaining; Lerman, Dittlinger, Fentress and Lanagan
(2011) and Cummings and Carr (2009) on trial-by-trial against first-trial
data; Fuller and Fienup (2018) and Richling, Williams and Carr (2019) on
mastery criteria and maintenance; Carroll, Joachim, St. Peter and Robinson
(2015) on error-correction procedures; Stokes and Baer (1977) on
generalization; Horner and Baer (1978) on the multiple-probe technique;
Grow and LeBlanc (2013) on receptive-language instruction; Wolery, Ault and
Doyle (1992) on the response-prompting procedures; and Cooper, Heron and
Heward (2020) for definitions.

Data model: `S = {meta, chk, codes, sess, steps, tas, probes}`, saved as
`{form:'SA-1', rev:'2026-10', saved, S}`. `meta` holds every text field
(student, program, skill, S-D, criterion, format, hierarchy, procedures,
decisions); `chk` the checkboxes (first-trial requirement, graph options);
`codes` the prompt-level codes `{c, label, kind}` with kind independent,
prompted or error; `sess` the trial sessions `{date, ph, inst, tr[], note}`
with one code per trial; `steps` the task analysis `{text}`; `tas` the
step sessions `{date, ph, inst, lv[], note}` with one code per step; and
`probes` `{date, type, dim, desc, n, k, note}`. Files from other forms are
refused by name. CSV export writes one row per trial session, task-analysis
session and probe with the codes, counts and percents. "Load simulation"
fills a break-request (FCT) program taught by discrete trials with
most-to-least prompting (two baseline probes, nine teaching sessions rising
to criterion with two instructors, one maintenance session), an eight-step
hand-washing task analysis in forward chaining, and four probes, one below
criterion.

## Form GC-1: Group Contingencies and Class-Wide Systems (v21.30)

Form GC-1 (`GC-1_Group-Contingencies_v2026-10.html`) designs a class-wide
behavior system, prints the poster the class sees, and keeps the daily
record beside it. It is listed after SR-1 as the 36th form and is built
from parts on the CF-1 shell like PD-1, SV-1, SM-1 and SR-1
(`tools/new-form.py`, then polished).

Six pages:

- **Setup.** Class, teacher, grade, number of students, when it runs, who
  runs it, tier, the problem as the teacher states it, students with an
  individual plan in the room; three to five class-wide expectations
  (positively stated, with a "looks like" line that earns a point and a
  "does not look like" line that becomes the foul), with a verdict that
  flags prohibitions; the baseline (measure, observer, definitions) with
  the mean, range and suggested starting criterion computed from the phase
  B rows on the Record; and the class reinforcer menu (activities,
  privileges and social items by default; a verdict when everything is
  edible).
- **Design.** Eight arrangements chosen by radio card, each with its own
  fields: independent, dependent (with five safeguards, four required
  before the verdict calls it ready) and interdependent group contingencies
  (Litow and Pumroy, 1975; with a saboteur rule); the Good Behavior Game
  (fouls, how a team wins, timing, prize, who records, fading); CW-FIT
  (the three skills, timer interval, points, goal, praise statement, tier
  2 cards); randomized components and the mystery motivator (which
  components are drawn, the jars, the chart); class-wide self-monitoring at
  a cue; and tootling. Shared fields: direction of the criterion (ceiling
  or floor), starting criterion, unit, period length, reward, delivery,
  how the result is announced, what never happens; two to four teams with
  a color each; the rule written out in plain words from the fields; a
  verdict on the design; and the changing-criterion and fading rules
  (tighten on 3 of 4, step, terminal value, relax on fewer than 2 of 4; a
  four-phase table from daily and immediate to unannounced and delayed),
  all labelled working conventions.
- **Poster.** Three printable pages built from the sheets above: the
  expectations, the scoreboard (teams by days with the goal row and a
  winners row), and the rules card (the Good Behavior Game card with the
  fouls, how to win and the prize; the rule and "how we earn" for the other
  arrangements). "Print the poster" prints the pages alone; the ordinary
  print button prints the whole form.
- **Record.** One row per game period with phase (B or 1 to 4), criterion,
  a column per team (or one for the class), the computed met column, the
  reward and a note; baseline mean, mean with the game on, days met of the
  last four, current criterion; a score-by-day chart (one color and marker
  per team, the criterion as a stepped line, phase lines); and the decision
  rules applied to the last four game days, with team-specific warnings
  when one team keeps losing and when a reward was earned but not
  delivered.
- **Fidelity.** A ten-step implementation checklist for an observer
  (expectations posted and reviewed, criterion announced, timer, points or
  fouls recorded at once, praise with each point, no extra consequences,
  nothing removed, scores read and winners named, reward delivered the same
  day, data entered), the percent, a verdict at 90 and 80, and a log of
  past observations.
- **Guide.** What the form builds, what the research supports, how the
  figures are calculated, ethical cautions for dependent and
  interdependent arrangements, and the reference list.

Sources: Litow and Pumroy (1975) for the three kinds; Barrish, Saunders
and Wolf (1969), Medland and Stachnik (1972), Harris and Sherman (1973),
Tingstrom, Sterling-Turner and Wilczynski (2006), Bowman-Perrott et al.
(2016), Joslyn, Donaldson, Austin and Vollmer (2019), Donaldson et al.
(2011), Lannie and McCurdy (2007), Pennington and McComas (2017), Tanol et
al. (2010) and Wright and McCurdy (2012) on the Good Behavior Game and its
variants; Kellam et al. (1994, 2008) and Embry (2002) on the long-term
trial; Wills et al. (2010) and Kamps et al. (2011, 2015) on CW-FIT; Moore
et al. (1994), Kelshaw-Levering et al. (2000) and Theodore et al. (2001)
on randomized components and the mystery motivator; Skinner, Cashwell and
Skinner (2000), Cihak, Kirk and Boon (2009) and Lambert et al. (2015) on
tootling; Gresham and Gresham (1982), Stage and Quiroz (1997), Maggin et
al. (2012) and Little, Akin-Little and O'Neill (2015) for the comparisons
and reviews; Hartmann and Hall (1976) on the changing criterion; and
Cooper, Heron and Heward (2020).

Data model: `S = {meta, chk, type, exp[], menu[], teams[], fade[4], log[],
fid[10], fl[]}`, saved as `{form:'GC-1', rev, saved, S}`; a log row is
`{date, ph, crit, v[4], rw, note}`. Files from other forms are refused.
CSV export writes the day log with a column per team. "Load simulation"
fills a second-grade Good Behavior Game (two teams, four baseline days,
eleven game days with the criterion stepped from 5 to 4 to 3 fouls, the
poster, two fidelity observations).


## Form SI-1: Student Interview, Assent and Treatment Preference (v21.30)

Form SI-1 (`SI-1_Student-Interview-and-Assent_v2026-10.html`) puts the
student's own voice into the FBA and the BIP: a functional assessment
interview in the student's words, the student's own hypothesis for Form
FS-1, an assent plan with a session log, a treatment preference record,
and a one-page summary for the file. It is built from parts on the CF-1
shell like PD-1, SV-1, SM-1 and SR-1.

Five pages:

- **Interview.** Who asked, where, date, length, language, whether the
  parent is aware (IC-1), and how the student responded (spoke, pointed,
  wrote, device, read aloud, took a break). A switch between the reading
  version (middle and high school) and the younger-student version, which
  shortens every question and adds a three-face scale drawn inline (no
  images) to the questions where a feeling or a degree is asked. Nine
  question cards in the student-assisted and student-directed interview
  tradition: what the student likes and does well; which classes or
  activities are hard and why (a table with too hard, too long, boring,
  noisy, people, and the student's words; a face per row in the younger
  version); what happens right before and what usually happens after,
  each with a checklist of things students say, tagged with the function
  each points to; what the student would rather do or have; what helps
  when upset and what makes it worse; who helps; what the student wants
  to change; a goal in the student's own words; what would be worth
  working for. The page ends with the student's hypothesis: counts per
  function from the tagged lines and a summary sentence labelled as the
  student's report, written for the FS-1 student-interview field.
- **Assent.** How assent is asked for, how sessions are explained, who
  asks, when, and whether it covers assessment, treatment or both; assent
  behaviors and withdrawal-of-assent behaviors defined in observable
  terms for this student, each with an example seen; what staff do when
  assent is withdrawn (pause, offer a choice, end the session, note it,
  tell the BCBA, nothing is lost for saying no) with the steps in the
  words staff will use; and an assent log (date, session, assent obtained
  Y/N, withdrawn at minute, what was changed, note). The metrics give
  sessions, withdrawals, the share with withdrawal (all sessions and the
  last ten) and the review threshold; the verdict flags a share above the
  threshold (25%, editable) or three withdrawals in a row, both labelled
  working conventions.
- **Preference.** The plan's components from TD-1, each with a name in
  the student's words, the student's stated rank and comment; a
  concurrent-chains style choice record (date, offered A, offered B,
  chose A, B or neither, how it was shown); and the result: times
  offered, times chosen, percent chosen, rank by choice against stated
  rank, with a preferred component named when chosen on two thirds or
  more of at least three offers (working convention), what the student
  said about the plan as a whole, what was changed because of it (and
  what could not be, with the reason), and when to repeat.
- **Summary.** One page built from the other three: the interview
  answers as quotes, the hard activities with their reasons, the
  hypothesis line, the assent plan and log so far, the preference table
  and result, and signature lines. "Print the summary page" prints it
  alone on one Letter page; the ordinary print button prints the whole
  form with every section open.
- **Guide.** What the form builds, what the research supports, how the
  figures are calculated, what keeps the interview honest, and the
  reference list.

Sources: Kern, Dunlap, Clarke and Childs (1994) for the student-assisted
functional assessment interview and Kern, Childs, Dunlap, Clarke and Falk
(1994) for its use in an assessment-based curricular intervention; Reed,
Thomas, Sprague and Horner (1997) for the student-guided interview and
student-teacher agreement; O'Neill, Albin, Storey, Horner and Sprague
(2015) for the student-directed interview in the standard handbook;
Dunlap et al. (1994) and Shogren, Faggella-Luby, Bae and Wehmeyer (2004)
on choice; Hanley, Piazza, Fisher, Contrucci and Maglieri (1997) and
Hanley, Piazza, Fisher and Maglieri (2005) on client preference between
function-based treatment packages measured by concurrent chains; Morris,
Detrick and Peterson (2021) on assent and withdrawal of assent; Rajaraman,
Austin, Gover, Cammilleri, Donnelly and Hanley (2022) on trauma-informed
behavior analysis and Rajaraman, Hanley, Gover, Staubitz, Staubitz, Simcoe
and Metras (2022) on the enhanced choice model; the BACB (2020) Ethics
Code on assent; Wolf (1978), Schwartz and Baer (1991) and Hanley (2010)
on social validity from the person served; Cooper, Heron and Heward (2020)
on the place of indirect assessment.

Data model: `S = {meta, chk, iv{}, hard[], ab[], wb[], al[], pc[], pr[]}`,
saved as `{form:'SI-1', rev, saved, S}`; `meta` holds every text field
including the version (`ver`: read or young), `chk` the response modes,
the before and after checklist lines and the withdrawal steps, `iv` the
nine answers (text and face), `hard` the hard-activity rows, `ab` and `wb`
the assent and withdrawal behaviors, `al` the assent log, `pc` the
components and `pr` the paired choices. Files from other forms are
refused. CSV export writes the assent log, the choice record and the
component result. "Load simulation" fills a sixth-grader's interview, a
twelve-session assent log with three withdrawals, and nine paired choices
among four components.

`tools/build-rps.py` and `tools/build-single.py` expect one more form; both
editions rebuilt.

## Form DA-1: Demand Assessment (v21.30)

Form DA-1 (`DA-1_Demand-Assessment_v2026-10.html`) is a demand assessment
for behavior thought to be maintained by escape: it finds out which of the
student's demands evoke the behavior and why, so that the demand condition
of Form EA-1 presents tasks the student actually escapes from and the
treatment on Form TD-1 starts demand fading and task modification from the
right place. It is built from parts on the CF-1 shell like PD-1, SV-1, SM-1
and SR-1.

Four pages:

- **Inventory.** Student, target behavior, the hypothesis that sent the
  team here, informants, who runs the sessions, and the working
  conventions held constant across tasks: session length (5 minutes, 2 to
  5), sessions per task (3), instruction pacing, the prompting sequence
  (three-step vocal, model, physical guidance, as in the Iwata et al.
  demand condition), what follows problem behavior inside a session, and
  what counts as compliance. Then the demand inventory, drawn from the
  schedule with the people who present the work: up to twelve tasks, each
  with its setting and time, usual length, response effort, difficulty
  relative to the student's skills, novelty, how it is prompted, how it is
  presented, whether the student can do it, and the informant's 1 to 5
  rating of how aversive it seems. A verdict counts the easy and hard
  tasks, estimates the session time, and says what is missing (fewer than
  two easy tasks, no hard task, tasks above skill level, novel tasks,
  blank columns).
- **Assessment.** The procedure in five steps, then the trial record: one
  row per session with the task, date, minutes, instructions given and
  complied with (compliance computed), latency in seconds to the first
  problem behavior (blank when none), count (rate per minute computed),
  affect on a 1 to 5 scale, and a note. "Write the alternating order"
  appends a block-randomized sequence of sessions-per-task times tasks in
  which no task follows itself. A per-task means table (compliance,
  latency with no-behavior sessions floored at the session length,
  sessions with problem behavior, rate, affect) updates as rows are typed.
  Optional task-choice probes record which of two offered tasks the
  student picked.
- **Results.** Metrics, a differentiation verdict, and the ranked table
  (by mean rate, then shorter latency, then lower compliance) with each
  task's class: low-probability demand (problem behavior in at least half
  the sessions or compliance at or below 40%), high-probability demand
  (problem behavior in at most a quarter of sessions and compliance at or
  above 80%; the 80 and 40 are Mace et al.'s 1988 cutoffs), or mixed. An
  SVG bar chart shows rate, latency or compliance by task in rank order,
  colored by class. Recommendations are computed: up to three tasks for
  the EA-1 demand condition; the fading sequence for TD-1 (high-probability
  tasks first, then mixed, with the low-probability tasks as terminal
  steps, or a note to start from no demands when nothing qualifies);
  candidate antecedent modifications per evocative task from its inventory
  features and session data (easier materials or prerequisite teaching,
  shorten the task and schedule breaks, choice and interspersal with the
  high-probability set, pre-teaching for novel tasks, reduced response
  effort, a change of presentation or prompt, keep as a choice option);
  and where the informant ratings and the data disagree. "Draft the plan
  from the results" writes a plan text for TD-1 into an editable box.
- **Guide.** What the form builds, what the research supports, how every
  figure is calculated (each cutoff labelled a working convention),
  cautions, and the reference list.

Sources: Roscoe, Rooker, Pence and Longworth (2009) and Call, Pabico and
Lomas (2009) for the demand assessment and the latency measure;
Thomason-Sassi, Iwata, Neidert and Roscoe (2011) on latency as an index of
response strength; Weeks and Gaylord-Ross (1981) and Carr and Durand (1985)
on task difficulty; Smith, Iwata, Goh and Shore (1995) on novelty, duration
and pace as establishing operations; Pace et al. (1993) and Zarcone et al.
(1994) on instructional fading; Mace et al. (1988) and Horner et al. (1991)
on high-probability sequences and interspersed requests; Dunlap et al.
(1991), Kern et al. (1994), Dyer, Dunlap and Winterling (1990) and Kern et
al. (1998) on curricular revision and choice; Fisher et al. (1998) and
McComas et al. (2000) on the form of the instruction; Vollmer, Marcus and
Ringdahl (1995) on noncontingent escape; Geiger, Carr and LeBlanc (2010) for
the treatment-selection model TD-1 follows; Iwata et al. (1982/1994) and
Hanley, Iwata and McCord (2003) for the functional analysis; Cooper, Heron
and Heward (2020).

Data model: `S = {meta, tasks[], sess[], probes[]}`, saved as
`{form:'DA-1', rev:'2026-10', saved, S}`; sessions and probes refer to tasks
by index, and files from other forms are refused. CSV export writes the
sessions with the computed compliance and rate, then the per-task means
with class and rank. "Load simulation" fills six tasks from a third-grader's
schedule, three 5-minute sessions each in alternating order over two
mornings, ten choice probes, and the draft plan.

editions to be rebuilt. These were not done in this pass.

## Form HD-1: Home Data Sheets (v21.30)

Form HD-1 (`HD-1_Home-Data-Sheets_v2026-10.html`) designs the data a
family can keep at home, prints the sheets for them in large plain type,
and takes the returned sheets back in as data. It is built from parts on
the CF-1 shell like SM-1 and SR-1.

Four pages:

- **Setup.** Student, caregivers, language at home, the plan the sheets
  serve (TD-1), the question the home data answer, dates and review. The
  behaviors in the family's words (up to six), each with one example, one
  non-example, the measure the family uses (tally mark, yes or no per
  routine, minutes, or a 0 to 3 rating) and the one line from the plan that
  says what to do when it happens. The routines of the day (morning, meals,
  homework, bedtime, outings by default; up to ten, each on or off the
  sheets). The steps the family runs and the skills the child uses for the
  checklist (adult or child; one routine or every routine). Which sheets go
  home, the ABC tick-box lists (defaults supplied), how often the sheet
  comes back and how, who to call and when to call right away, how the
  family was taught the sheet, and what they get back. A verdict lists what
  is still missing before printing.
- **Home sheets.** The sheets the family holds, generated from Setup in
  16px sans type with every instruction on the page: a weekly tally sheet
  (behavior by day with a row per routine, cells marked for the measure),
  a routine checklist (Y or N per step per routine per day), an ABC note
  sheet (tick boxes for before, the behavior, and after, with one free
  line; three blocks per sheet by default) and a sleep log (lights out,
  fell asleep, night wakings, wake-up, nap, notes). Each sheet has a plain
  instruction box, a worked example row or block, the plan lines, a
  signature line, the return instructions and the number to call. Monday
  to Sunday, Monday to Friday, or weekends only. "Print the home sheets"
  prints the sheets alone, portrait, one sheet per page; the ordinary print
  prints the whole form.
- **Entry.** One week at a time: the sheets that came back, counts of ABC
  notes and nights logged, a note on completeness, and the week grid
  (behavior by routine by day) typed exactly as the family marked it. Day
  totals and week totals per behavior (sum, Y of N, minutes, or mean
  rating), completeness (cells written over cells asked for, with a verdict
  at 50% and 80%), a small-multiples SVG graph by day across all weeks in
  date order with a gap for a missing day, an agreement table for days when
  a staff observation overlapped a home one (smaller over larger, or match
  for Y/N; mean reported against an 80% working convention), a sheets-
  returned table by week, and rows for the decision taken and what the
  family said (SV-1).
- **Guide.** What the form builds, what the research supports, how the
  figures are calculated, what keeps the sheets coming back, and the
  reference list.

The guide draws on Bearss et al. (2015) for parent training against parent
education; Hieneman, Childs and Sergay (2006) and Lucyshyn, Dunlap and
Albin (2002) for family positive behavior support organized by routine;
Kazdin (2005) for parent management training's reliance on home records;
Lerman, Swiezy, Perkins-Parks and Roane (2000) on skill type and
instructional format in parent training; Sheridan, Kratochwill and Bergan
(1996) for conjoint behavioral consultation; Wolf (1978) on social
validity; and Cooper, Heron and Heward (2020) for the measurement rules.
Every threshold on the form (50% and 80% completeness, 80% agreement, four
behaviors at most, one practice day) is labelled a working convention.

Data model: `S = {meta, chk, bh[], rt[], sk[], wk[], ag[]}` where `bh` is
the behaviors (`name, ex, nex, ms, todo`), `rt` the routines (`label, time,
on, note`), `sk` the checklist steps (`label, who, rt`), `wk` the weeks
(`start, r_tally, r_check, r_abc, r_sleep, n_abc, n_sleep, note, cells{}`
with cells keyed `b<i>_r<j>_d<k>`), and `ag` the agreement checks (`date,
rt, bh, staff, home, note`); saved as `{form:'HD-1', rev, saved, S}`. Files
from other forms are refused. CSV export writes the entries in long format
(week, day, behavior, routine, value, with day totals) and the agreement
checks. "Load simulation" fills a second-grader with three behaviors across
five routines, four sheets, three weeks typed in and four agreement checks.

## Form CN-1: Consultation and Session Notes (v21.30)

Form CN-1 (`CN-1_Consultation-Notes_v2026-10.html`) is the BCBA's record of
each school visit, consultation, training, direct session, parent meeting,
IEP meeting, phone call or record review for one student, with a log of
every note and the hours they add up to. It is built from parts on the CF-1
shell like SM-1, SR-1 and HD-1.

Three pages:

- **Note.** The case (student, school, BCBA, the plan in force as a TD-1
  version and date, the service agreement, the primary target and goal),
  entered once and carried into every note. Then the editor for the current
  note, chosen from a list with New, New like this one, and Delete: date,
  start and end times with the duration computed, type, setting, who was
  present, the plan in force at that visit, purpose; the data reviewed
  (which forms and dates), the week's rate against the goal with the unit
  and the direction of the goal and a one-line verdict (met, close within
  25%, or not), what was seen, the TI-1 integrity score with its date and
  the steps missed and a verdict at 90% and 80%; problems identified,
  recommendations given, changes made to the plan and the authority for
  them (none, within the plan's own adjustments, PR-1 team decision, IC-1
  consent, IEP team, or recommended only), training delivered, materials
  left; next steps each with an owner, a date and a done box; time by
  category in minutes (observation, consultation, training, direct
  service, meeting, documentation, travel) checked against the duration
  within 5 minutes; signature, date signed and the date the note was
  written. A verdict names what the note still lacks (date, times, type,
  people, a change without its authority, recommendations without a next
  step, a signature). Below the editor the note renders as it prints, and
  "Print this note" prints that one note alone; the ordinary print prints
  the whole form with the open note.
- **Log.** Every note newest first with a search box and type and month
  filters; a click opens the note. Metrics for the count of notes, hours
  in all, hours this month, notes recording a plan change, and open next
  steps with the overdue count. Hours by month and type from the computed
  durations, with the time by category across all notes at the foot, and a
  table of every open next step in date order flagged when overdue.
- **Guide.** What the form keeps, what the research and the standards
  support, how the figures are calculated, what makes a note hold up, and
  the reference list.

The guide draws on Bergan and Kratochwill (1990) for the four-stage
consultation sequence; Sheridan, Kratochwill and Bergan (1996) for its
conjoint form; Erchul and Martens (2010) for the evidence on school
consultation; Noell et al. (2005) for performance feedback as the follow-up
that sustains implementation; the Behavior Analyst Certification Board's
(2020) Ethics Code for the documentation, record-keeping, accurate
reporting and continual evaluation provisions; and Cooper, Heron and Heward
(2020) for data-based decisions. The thresholds (5 minutes on the time
check, 25% for "close" to the goal, 90% and 80% on integrity) are labelled
working conventions.

Data model: `S = {meta, notes[]}`; each note holds the editor's fields
(`date, start, end, type, setting, present, plan, purpose, data_forms,
data_rate, data_goal, data_unit, data_dir, observed, integ, integ_date,
integ_note, problems, recs, changes, authority, training, materials, t_obs,
t_cons, t_train, t_direct, t_meet, t_doc, t_travel, sig, sig_date, written`)
and `next[]` of `{what, who, when, done}`; saved as `{form:'CN-1', rev,
saved, S}`. Files from other forms are refused. CSV export writes one row
per note with every field, the computed minutes and the next steps joined.
"Load simulation" fills a case with six notes over five weeks (two
observations with TI-1 scores, a phone call, a parent meeting, an IEP
meeting and a consultation).

## The Case Flows Between Forms, the Case Map, and the Picture Library Beside the Forms (v21.31)

Four things typed once now reach every other form: the target behaviors
defined on Form TB-1, the function concluded on Form FS-1, the goals and
objectives written on Form GB-1, and the reinforcer menu ranked on Form
PA-1. The index also gains a one-page case map (which form when), the
pictogram library moves out of Forms SM-1 and VS-1 into one file beside
them, nine reference claims found wrong or loose in a web spot-check are
corrected, and the six forms built in v21.30 passed a visual pass with
nothing to fix.

### The case (index.html and every form)

The shell keeps one object, `state.facts`:

    { behaviors:[{label, def, ex, nex, type, isRep, fn, fnKey, dim, unit, rep, ctx, urg, src}],
      fn:{key, label, statements:[...], perBehavior:[...]},
      goals:{red:[{beh, dir, meas, cur, ml, tgt, ctx, crit, meth, date, pair, text}],
             acq:[{beh, cond, crit, n, unit, meth, date, pair, text}]},
      menu:[{name, type, rank, tier, mean, methods, informant}],
      src:{behaviors:'TB-1', fn:'FS-1', goals:'GB-1', menu:'PA-1'}, when }

Two verbs are added to the workstation bridge every form carries
(`facts?`, answered `facts-out`, and `facts`, answered `facts-applied`),
and a shared block, `<script id="nbh-case-flow">` with its stylesheet
`nbh-case-css`, sits after the bridge in all 42 forms (so
`tools/new-form.py` carries it into any form assembled from the CF-1
template). The block defines `window.nbhCase`:

- `out()` calls the form's `window.__nbhFactsOut()` when it has one. TB-1
  returns its sheet-4 targets (or, before sheet 4 is written, the sheet-1
  candidates marked Target); a target of the type "Replacement /
  alternative behavior" is flagged `isRep`, and a "paired replacement"
  entry that is a note rather than a behavior (a dash, "see ...", "this
  is ...") is dropped. FS-1 returns the function with the summary
  statements, and its own behavior list as `behaviorsFS`, which the shell
  uses only while TB-1 is not open. GB-1 returns each objective with its
  composed sentence. PA-1 returns the stimulus pool in the Summary's order,
  the same arithmetic as `renderSummary` (mean rank across the direct
  methods completed, then the HP/MP/LP third of the pool).
- `apply(facts)` calls the form's `window.__nbhFactsIn(facts)` when it has
  one, else the generic fill: the behavior and function fields the packet
  map already names (`beh`, `fn`) take the first behavior (label, or
  label and definition in a textarea) and the function (a select is
  matched by its words), when empty. Form-specific intake, all into empty
  rows and fields only: SM-1 (the acquisition objectives and the paired
  replacements become the self-monitoring targets, since those are stated
  positively; the problem behaviors go on the "reduction target" line, the
  function to its select, the HP/MP items to the reward menu), HD-1 (the
  behavior table), DD-1 (a record still holding the three example
  behaviors and no data takes the targets, each paired replacement as a
  replacement row, the aim from GB-1), FS-1 (an empty report takes the
  targets), GB-1 (reduction objectives per target, acquisition objectives
  per paired replacement, adding cards when the existing ones are full),
  SA-1 (skill, goal and SD from the first acquisition objective, the
  reinforcer line from the menu), SR-1 (behavior, short name, alternative,
  function, reinforcer), DA-1 (target line, hypothesis from the summary
  statement), CN-1 (the "primary target and goal" line composed from the
  behavior and the reduction objective naming it), SI-1 (nothing on its
  own: the interview keeps the student's words). ABC-1's packet map gains
  `#h-target` so its header takes the behavior too.
- `paint()` adds a "From the case" group to the toolbar (or, in the five
  older forms without a `.toolbar`, a button in the `.nbh-actions` row),
  hidden until the case holds something, with a count of what it holds.
  The button opens a picker listing the behaviors, the function, the
  objectives and the ranked menu with checkboxes; "Use the ticked items
  here" calls `window.__nbhFactsPick(selection)` where the form defines
  it (the forms above add the ticked items as rows or replace the field),
  else fills the behavior and function fields with the first ticked
  behavior, overwriting. "Copy as text" puts the whole case on the
  clipboard for a form with no field for it.

The shell reads the four source forms whenever the value signature in a
form's status reply changes (the status every form reports every four
seconds), debounced, so a target renamed on TB-1 reaches the other open
forms within a few seconds; a source that is not open keeps its last
reading. Facts go to a form as it opens (after the packet), to every open
form when they change, and with "Fill open forms". A line under the packet
bar ("The case") shows what has been read and from which form, with "Send
to open forms". The facts travel in the packet file (`facts`), the case
file and the one-file case, so they survive the session; `loadCase` and
Open packet restore them. Nothing is stored in the browser.

### The case map (index.html)

"Case map" in the bar (and in the command palette) opens one page: eight
stages from referral to exit, each with the forms usually reached in it
and one line on when, every form a button that opens it (open ones are
marked); a box on what carries forward on its own; and the shortest
defensible path through a case. The content is `CASE_MAP` in index.html.
Help gains two paragraphs, on the map and on the case.

### The picture library beside the forms (`nbh-pictos.js`)

Forms SM-1 and VS-1 each carried the 648 KB pictogram library inline
(about 1 MB per form, 5.3 MB in the one-file edition). The library is now
one file, `nbh-pictos.js`, beside the forms (a copy of
`tools/pictos/nbh-pictos.js`), loaded by `<script src="nbh-pictos.js">`
at the top of each form's toolbar; SM-1 is 411 KB and VS-1 302 KB. A
guard at the top of each form's script defines empty tables and a no-op
`picto()` when the file is missing, sets `NBH_PICTOS_MISSING`, and the
picture chooser then says the file is not beside the form; photos still
work. `tools/build-single.py` packs the library once as the block
`nbh-embed-pictos`; `EMBED.ready` inflates it with the forms and
`EMBED.form()` puts it in place of the `<script src>` tag as a form opens
(pop-out and the one-file case use the same path; `caseHtml` copies the
block). Diagnostics gains a "Picture library" row (a HEAD request in the
folder edition; "inside this file" in the one-file edition).
`tools/build-rps.py` copies the file with the folder. Anyone hosting the
folder uploads `nbh-pictos.js` with the forms.

### Reference corrections (web spot-check of 70 references)

70 references across SA-1, GC-1, SI-1, DA-1, HD-1, CN-1, VS-1, SM-1 and
SR-1 were checked against the web; 61 were correct as written. Corrected:
GC-1, Bowman-Perrott et al. (2016) (the effect was largest for students
with or at risk for EBD, not independent of disability; TauU = .82 across
21 studies); GC-1, Donaldson et al. (2011) (disruption fell while the
game was on and did not carry over, rather than "the teachers kept it
going"); GC-1, Tanol et al. (2010) (teacher preference only, not the
children's); SA-1, Richling, Williams and Carr (2019) (criteria of 60%,
80% and 100%, each across three sessions; only 100% x 3 reliably
maintained; the Setup hint said "80% in a single session"); SA-1, Lerman
et al. (2011) (first-trial data frequently indicated mastery prematurely
and were insensitive to early change); CN-1, Noell et al. (2005) (45
elementary students referred for consultation, not 45 teachers); VS-1,
Tiger, Hanley and Hernandez (2006) (3 of 6 preschoolers consistently
preferred choice; preference grew with more items); SM-1, Smith,
Thompson and Maynard (2022) (Kim is on the 2025 meta-analysis, not the
2022 review); SM-1, the Royal Palm School manual is labelled an
unpublished program manual. Kern et al. (1994) in SI-1 is confirmed as
Diagnostique, 19, 29-39.

### Visual pass (SA-1, GC-1, SI-1, DA-1, HD-1, CN-1)

Each form's simulated views, printed sheets and home sheets were viewed
page by page; nothing needed changing.

### Checks

`qa/case-test.js` (the four simulations flow into thirteen consumers, the
picker places a ticked behavior, the packet carries the facts, a rename
on TB-1 reaches the others), `qa/all-forms-shell.js` (all 42 forms open
in the shell, answer `facts?` and `facts`, show the button, no script
error), `qa/casemap-test.js`, and `qa/single-pictos.js` (the one-file
edition carries the library and both forms find 227 pictures) all pass;
the SM-1 and VS-1 form tests pass with the external library.

## Form OB-1 Narrative Tools and Log; Forms Side by Side (v21.32)

Four things asked for after a live observation on an iPad.

### Form OB-1

- **A line can be deleted.** Each narrative row ends in a small "x"
  (`button.delRow`, not printed); a line with words asks first. An
  observation always keeps at least one blank line.
- **The Time column is a time picker** (`input type="time"`), the native
  wheel on iPad and the clock pop-up on a computer, so a time is tapped,
  not typed. A narrative time is now kept as HH:MM (24-hour), as the
  picker gives it; older files holding "9:14" or "12:22" typed by hand are
  read through `toHM24()`, which takes a bare hour from 1 to 6 as
  afternoon (school observations run between about 7 am and 6 pm) and
  honours "am" or "pm" when written. The Live Recorder writes its own
  sample-start line in the same HH:MM form (`hhmm`, not `hm`).
- **A note box in the Live Recorder.** Under the recorder's controls:
  a time (set to now, with a Now button), a text box and "Add to the
  narrative" (Enter adds too). The note goes into the narrative of the
  observation chosen under "Save into"; when none is chosen, the first
  observation with no times, counts or marks yet (the one the recorder
  will save into), else a new one. `addLine()` places it in time order,
  using a blank line first, and `render()` redraws, so the line appears
  on the sheet below at once and stays editable there. A one-line
  confirmation under the box says where it went. The recorder's keyboard
  shortcuts already ignore keys typed into a field.
- **A Log view** (`body.view-log`, `#obsLog`) between Observations and
  Summary: one row per observation with the date, start, end, minutes,
  setting, activity, counts, interval percentage and the narrative line
  count with its first line; "Open" switches to the sheet and scrolls to
  it, "Remove" is the same removal as on the sheet, "Add an observation"
  the same as the toolbar's. The date, times, setting and activity are
  inputs bound by the same `data-obs`/`data-field` path as the sheet, so
  an edit in the Log is the observation's own value; a change redraws
  the sheets. The Log never prints (`@media print{#obsLog{display:none}}`):
  the sheets are the record, and the printed form is unchanged.

### Side by side (index.html)

Every open form already sits in its own frame and stays loaded, so
showing two or three at once is a layout. "Side by side" in the bar above
the form (and in the command palette) opens a chooser of the open forms;
tick two or three and they show as equal columns (stacked on a screen
under 900 px), with a pane bar above naming each one, with Print and a
button that takes the form out of the view. `state.split` holds the ids
in column order; `layoutFrames()` applies it; `setSplit(ids)` sets it. A
form opened from the list while the view is split takes a column (a
third while there is room, else the column of the current form); closing
a form leaves the others; the current form, the one the crumb's own
buttons act on, follows a click in the pane bar or focus inside a frame.
Fullscreen hides the chrome over the columns as it does over one form.
For an observation, OB-1, MT-1 and ABC-1 together put the narrative, the
interval sample and the ABC record on one screen; the case facts and the
packet reach every column as before, since each column is an ordinary
open form.

### Checks

`qa/ob1-split-test.js`: the narrative inputs are time pickers, the
conversion of hand-typed times, deleting a line, two notes added out of
order landing in time order in the chosen observation, the Log's rows,
an edit in the Log reaching the sheet, Open from the Log, the Log and the
delete column absent in print; in the shell, three forms side by side,
a fourth opened taking a column, a pane closed, a form closed, back to
one, the chooser, and stacking at 820 px.

## Rows, Times, Graphs, the BIP Text, and Saving (v21.33)

Three of the improvements listed after v21.32: any row can be deleted and
clock times are picked across the forms; the plan's text comes out of the
forms for the district BIP document, and graphs come out as images; and
unsaved work is harder to lose.

### Saving (index.html and every form)

- **Save case on the crumb bar.** The button beside Print carries an
  orange dot while the case holds entries changed since the last file
  save (`caseDirty()`: a form with more than three filled fields and a
  signature that differs from `state.lastSig`, the same test the unload
  guard makes). Its title says how long. After `NUDGE_MIN` (20) minutes of
  unsaved work the button pulses three times and the live region says so,
  once per stretch. `paintSave()` runs every five seconds. Help gains a
  paragraph.
- **The unload guard in every form** (`<script id="nbh-guard">`, inserted
  before the toolbar-width style in all 42 forms by
  `scratchpad/guard/patch-guard.py`, so new forms carry it from the CF-1
  template). A form opened on its own keeps nothing in the browser, so the
  block tracks whether any field changed since the last Save data (an
  opened file, Save data and Clear all reset it) and asks before the tab
  closes or reloads while it holds unsaved entries
  (`beforeunload`). Inside the workstation (`window.parent !== window`)
  it stays quiet: the shell has its own guard and the autosave.
  `window.nbhGuard.isDirty()` and `.clean()` are exposed.
- **Save data in the compact toolbar.** With the toolbar folded (More
  controls, the state an iPad opens in), a `Save data` button sits beside
  More controls and clicks the form's own save; it is bold while the form
  holds unsaved changes. It is hidden when the full toolbar shows.
- **Spell-check on.** The same block sets `spellcheck="true"` on every
  textarea and text input, including ones rendered later (a mutation
  observer), since the browser default differs by platform.
- The "From the case" toolbar group is now kept in the compact toolbar
  (`tg-keep`), so the case picker is reachable on an iPad without
  unfolding the controls.

### Any row can be deleted (33 forms)

Tables that offered "Add a row" and "Remove last" now end each row in a
small "x" (`button.rowDel` in `td.nx`, not printed): a row with an entry
asks first, an empty one goes silently, the form's minimum is kept as a
blank row, and "Remove last" stays. Where other data is keyed by the
row's position it is re-keyed or dropped, and the confirm says so:
respondent ratings (CF-1, SV-1); step cells, IOA and opportunities
(TI-1), step cells (CT-1, ST-1; ST-1's TI-1 retrain record is matched by
number and text, so a mismatch shows as "reads differently", never as a
silent shift); the DD-1 import record and period rows on PR-1 (the
baseline row is cleared, not deleted); thinning and backup rows (TE-1);
FS-1's sources, hypotheses and the target bar (`S.cur` follows); CR-1's
team, interventions, actions, restraint log (the debriefed restraint's
number re-keyed or cleared), attempts and no-school days; CN-1 next
steps; SA-1 codes (cells scored with a deleted letter count as prompted),
steps (task-analysis levels spliced in every session) and probes; GC-1
expectations, menu, teams (per-team log scores spliced and padded),
record days and fidelity entries; DA-1 tasks (sessions and probes using
the task dropped, indexes re-keyed), sessions and probes; HD-1 behaviors
and routines (week cells and agreement checks re-keyed), checklist steps
and checks; SI-1 hard activities, assent behaviors, assent log,
components and choices (pairs re-keyed); VS-1 cards, rules and schedule
steps; SM-1 targets (per-target log points spliced), periods (week
levels re-keyed) and record days; MT-1 sessions; IN-1 respondents
(answers keyed `respondent_question` moved up); BC-1 rates; RM-1
challenges. Left alone, by design: fixed catalogues (rubrics, fidelity
items, mitigation and readiness lists), generated tables, the interval
grids, and the forms that already deleted any row by id (DD-1, ABC-1,
SP-1, OB-1 since v21.32, GB-1's cards). Sessions on SA-1 are columns,
so their "x" sits in the column header.

### Clock times are picked (CN-1, SM-1, MT-1, OB-1)

Single clock-time text fields are `type="time"`: CN-1 start and end
(`toMin()` accepts HH:MM and keeps the add-twelve-hours heuristic only
for typed text; the printed note shows "9:00 am to 10:30 am"), SM-1
period times (shown as "8:30 am Arrival" on the sheet), MT-1 start (the
timer stamp writes HH:MM) and OB-1's narrative (v21.32). Each form
carries `toHM24()` to read older files' typed times (a bare hour 1 to 6
is afternoon; am/pm honoured). Ranges ("7:00 to 8:00"), mixed
placeholders and dates were left as text.

### Graphs as images (DD-1, SA-1, GC-1, DA-1, SM-1)

"Save graph as image" (not printed) under each graph a BCBA puts in a
report: the SVG is cloned with its namespace, size and font, serialised,
drawn on a canvas at 2x and downloaded as
`<Form>_graph_<student>_<date>.png` (DD-1: one button per behavior
graph; GC-1 names the file by class; SM-1's sheet self-graphs save as
`_graph_sheet_`). Verified downloads of 80 to 160 KB, 1960 x 880 for
DD-1.

### Copy for the BIP (FS-1, TD-1, GB-1, CR-1)

`Copy for the BIP` (`#bipBtn`, Sheet actions) composes plain text from
the form's state, uppercase section headings, `Label: value` lines,
`- item` lists, empty fields and blocks dropped, and puts it on the
clipboard (`#bipMsg` reports the line count; when the clipboard is
refused, a dialog shows the text selected). FS-1: student and
assessment, each target with definition, dimension, level, function,
setting event, antecedent, consequence and the summary statement
(`stmtText`), the level of evidence, sources, hypotheses considered,
recommendation, limitations and what would change the conclusion. TD-1:
target and function, baseline and criteria, then the Final plan's groups
with each component's parameters, materials and numbered staff steps,
the positioning rules, prompt hierarchy, response to precursor and
target, the crisis procedure, the thinning ladder, generalization, and
data and decision rules. GB-1: the plan, each objective as its sentence
(gaps as `[...]`), pairing, notes and checks. CR-1: trigger, team,
supports, each stage, restraint health limits and rules, review
timetable, debrief, changes, notification and the restraint log. Guide
text, instructions and the training and social-validity tables are
left out. `qa/bip4-test.js` checks all four (108 assertions).

### Checks

`qa/all-forms-shell.js` (42 forms open, answer, no errors),
`qa/case-test.js`, `qa/ob1-split-test.js`, `qa/guard-test.js`,
`qa/bip4-test.js`, `qa/rowdel-test.js` (CF-1, SV-1, TE-1, CT-1, TI-1,
ST-1, PR-1), `qa/v2133-test.js` (MT-1, IN-1, BC-1, RM-1, DD-1, ABC-1,
SP-1), the nine parts-form tests, `pnav-test.js` over all 42 and the
one-file checks all pass.

## Design Pass: Notices and Questions, Touch Targets, View Progress, the Folded Bar, One Toolbar (v21.34)

Six design gaps found after v21.33, all about interaction rather than
looks. The printed forms are unchanged.

### Notices and questions (every form, and the shell)

The browser's `alert()` and `confirm()` were the only voice the forms
had: unstyled, "this site says" on the hosted edition, and a stop to the
whole screen on an iPad. A shared block, `<script id="nbh-ui">` with its
stylesheet `nbh-ui-css` (inserted before the toolbar-width style in all
42 forms by `scratchpad/ui/patch-ui.py`, carried by the CF-1 template),
defines `window.nbhUI`:

- `nbhUI.toast(text, {kind, ms})`: a short message at the foot of the
  window, dismissable, at most three stacked, gone after a few seconds.
- `nbhUI.alert(text)`: a toast for a message under 160 characters on one
  line, a styled notice dialog (title from the first line, body from the
  rest) for a longer one. `window.alert` is routed through it, so every
  existing alert changed on its own.
- `nbhUI.confirm(text, {ok, cancel, danger})`: a styled question,
  resolved true or false; the first line is the question, the rest the
  detail; `danger` makes the OK button red. `window.confirm` stays the
  browser's (a synchronous answer cannot be styled); every `confirm(`
  in the forms' own code was rewritten as `await nbhUI.confirm(...)`
  with the enclosing handler made async, the message split into
  question and detail, and the button named for the action ("Delete",
  "Replace", "Clear all"). A test that stubs `window.confirm` is
  honoured: `nbhUI.confirm` returns that stub's answer at once.

The shell has the same in `wsUI` (toasts under `#wsToasts`, questions in
`#cfDlg`); its four confirms (close a form, print ticked forms that are
not open, save a case without a name, open a case over open forms) are
awaited, and `window.alert` is routed to toasts and notices.

### Touch targets

Under `@media (pointer:coarse)` the small controls grow: the row-delete
"x" to 44 px, checkboxes and radios to 22 px, the interval cells on OB-1
to 36 px, toolbar buttons and the page bar to 40 to 44 px, sheet inputs
to 38 px and textareas to 44 px; in the shell, the bar, crumb and pane
buttons to 40 px and the form-list rows to 46 px. A mouse user sees no
change.

### View progress

Each View button in a form's toolbar carries a dot after its name:
none for an empty view, amber for a partly filled one, green at 80% or
more of its fields, hidden where the view has no fields (a guide). The
title says "12 of 40 fields filled". The block finds a view's fields
through `section.only-<key>`, `#panel-<key>` or `[data-panel="<key>"]`
when every view has one, else by setting `body.view-<key>` for each
view in turn and taking the fields it shows, leaving out fields shown by
every view (the measurement keeps the body's other classes and runs once,
again when the number of fields changes). Counts refresh on input.

### The folded bar (index.html)

Once a student is loaded (a packet, a case, a name taken from a form)
the packet details and the case line fold to one line, `#barSum`: the
name, ID, grade, school and BCBA, and what the case holds; `Edit
details` opens the rows, `Done` folds them. A name typed by hand keeps
the rows open until Done. The bar is two rows instead of four above the
form.

### One toolbar

ABC-1, DD-1, VI-1, DT-1 and AD-1 carried the previous generation's
numbered tab row and action buttons. They now have the toolbar and View
segment the other 37 forms share, driving their existing panels
(`data-panel` keys), with their action buttons in the Sheet actions
group under the same ids, so the quick Save, the unload guard, the case
picker, the page bar and the progress dots all work there too.

Per form, the conversions: 107 questions on OB-1, PR-1, PA-1, CT-1,
CR-1, TI-1, ST-1, RA-1, MT-1, CF-1, RR-1, IN-1, FS-1 and EA-1 (the
recorders and runners re-check their state after each await, and their
keyboard shortcuts ignore keys while a dialog is open; IN-1's role
change asks once although a select fires input and change); 36 on
TE-1, SP-1, RM-1, TB-1, SV-1, IC-1, DM-1, BC-1, PD-1, MS-1, EB-1, TD-1,
IA-1 and GB-1 (SP-1's retime keeps its revert-on-cancel); 67 on the nine
parts-built forms; 19 on the five forms that also gained the toolbar.
A simulation's closing explanation, which was a long alert, now appears
as the styled notice. GB-1's objective wraps carry `data-panel` keys so
the progress dots find their fields.

### Checks

`qa/ui-test.js` (toasts, the notice, the question dialog and its
answer, a stubbed confirm honoured, progress dots after a simulation,
touch sizes), `qa/ui-sweep.js` (the dots on every form),
`qa/shell-ui-test.js` (the shell's toasts, the close question, the bar
fold, touch sizes), `qa/u-test.js` and `qa/u-check.js` (every form:
simulation through the dialog, a middle row deleted through it, Cancel
keeps the row, Clear all through it, no native dialog, no error),
`qa/u-recorder.js` (the OB-1, EA-1, MT-1, RA-1 and TI-1 runners through
the dialog), `qa/v2134-verify.js` (the five rebuilt toolbars), and the
earlier checks (`all-forms-shell`, `case-test`, `ob1-split-test`,
`guard-test`, `bip4-test`, `rowdel-test`, `v2133-test`, the form
tests) all pass; the shell tests answer the close question through
`#cfFoot button.danger` now.

## Reference Audit of the Older Forms, Quiet Simulations, a Short Help, and What Is Due (v21.35)

### Reference audit (33 forms)

Every form whose references had not been checked in v21.31 (the nine
forms built in v21.30 were) had its reference list and every in-text
citation extracted and checked: the citation itself (authors, year,
title, journal, volume, pages) and the claim the form attaches to it
(sample sizes, percentages, direction of effect). Sources were journal
records, PubMed and PMC records, publisher pages, the full texts held
locally (the 2026 JABA papers, the PDC-HS papers, Wolf 1978) and the
reference lists of those papers. A log per form sits beside the work,
one row per reference and one per claim, with the evidence for each.

Nothing checked was found wrong except one sentence. PD-1's Guide said
Brand et al. (2022) cite Wilder et al. (2019) and Cymbal et al. (2020)
for the tool's reliability and validity; Brand's text refers the
reader to the review by Wilder, Cymbal and Villacorta (2020), JABA
53(2), 1170-1176, and the sentence now says so, with the two studies
named as the ones not reproduced on the form.

The check did not reach everything. The session's web-search
allowance ran out, and the environment's network policy denies direct
reads of the bibliographic hosts (PMC, Crossref, DOI, the Wiley,
Springer and SAGE sites, Google Scholar, the Florida statute and rule
sites), so the entries reached last are marked "unverified" in the
logs rather than guessed at. The counts:

| Group | Forms | Entries | Confirmed | Unverified | Corrected |
|---|---|---|---|---|---|
| 1 | DM-1 IC-1 RR-1 TB-1 IA-1 IN-1 OB-1 ABC-1 SP-1 DD-1 MT-1 | 168 | 116 | 52 | 0 |
| 2 | PA-1 RA-1 EA-1 VI-1 FS-1 TD-1 GB-1 CF-1 SV-1 ST-1 TI-1 | 449 | 23 | 426 | 0 |
| 3 | PD-1 RM-1 PR-1 CR-1 CT-1 EB-1 DT-1 AD-1 TE-1 BC-1 MS-1 | 164 | 97 | 67 | 1 claim |

Group 2's large lists (TD-1 alone holds 251 entries) were reached
after the allowance was spent; its offline checks (volume against year
for the JABA, BAP and JEAB entries, in-text against list, the same
paper across forms) found no contradiction. Statute and rule citations
(34 CFR 300, Fla. Stat. 1003.573, rule 6A-6.03028, FERPA) were checked
against the official text where a search returned it and are otherwise
unverified.

Flagged in the logs for a later check, left as written: CF-1's
"Coyle et al., 2022, examined a 12-item adaptation" (the record shows
12 sites and 128 respondents and gives no item count); AD-1's
Frank-Crawford et al. (2021) counts (a search paraphrase reports 3 of
5 for accumulated food and 3 of 5 for the break, where the form says 2
of 5 and 4 of 5; a paraphrase is not enough to change a count); TD-1
spells the DeLeon et al. (2001) co-authors "Catter, V. R." where PA-1
and RA-1 have "Rodriguez-Catter, V."; IA-1's Paclawskyj 2001
percentages and FAST category correspondences are full-text figures
no record showed; PR-1's "42% of thinning steps" (Briggs). Uncited
list entries (PA-1 DeLeon 2005; EA-1 Kazdin 2011; VI-1 Bijou 1968,
Hanley 2012, Iwata & Dozier 2008, Laraway 2003; FS-1 Rodriguez 2012;
TD-1 Querim 2013) and two in-text citations with no entry (DT-1 Bloh
2010, Evenden & Ryan) are noted, not changed.

### The simulation loads quietly (every form)

Thirty-eight forms ended "Load simulation" with a long explanation,
which v21.34 had turned into a notice to dismiss. Each now shows one
toast, "Simulation loaded: ..." with a sentence that says "simulated",
and the full explanation sits in the form's Guide under "About the
simulation", before the reference list, in the guide's own prose
style, opening with the line that nothing in it is a real student
record. Forms whose simulation already loaded quietly (PA-1, EA-1,
TD-1, GB-1, DM-1, IC-1, RR-1, IA-1, ABC-1, EB-1, AD-1, MS-1, SR-1) are
unchanged; DD-1's toast now says "simulated". SP-1 has no Guide, so
its note is on the Control chart view's methods block, screen only.
Blank prints are unchanged on every form; the printed Guide of SI-1,
PR-1 and SV-1 runs one page longer because of the added paragraph.

### Help (index.html)

The Help dialog had grown to 1,160 words of release notes. It is now a
three-line lead, five numbered steps for the first five minutes, and
the detail folded under five headings (the case and the case map;
saving, autosave and closing the tab; printing and the PDF; side by
side, fullscreen and the screen; keyboard), with the one-file note
where that edition is running. About 210 words show before anything is
opened.

### What is due (index.html and the nbh-case block)

Review dates and next steps sit on PR-1, SA-1, SM-1, ST-1, TE-1, RM-1,
SV-1, GB-1 and CN-1 under their own names. The nbh-case block now
answers the `facts?` verb with a `due` list as well: a form's own
`window.__nbhDue()` when it has one (CN-1 returns the open next steps
of every note with their dates and owners), else every date field
whose label says review, target date, due, next, re-survey or
follow-up and whose value holds a date. The shell (`gatherDue`) asks
every open form whenever a form's value signature changes, keeps the
items within `DUE_DAYS` (14) or past, sorts them, and shows up to four
in the bar (`#sumDue` on the folded line, `#factsDue` on the case
line), overdue ones marked, "and n more" after the fourth; the case
row shows for the due line alone when no source form is open. Date fields
on the toolbar and the recorder are ignored, and so are plain "Date"
and date-of-birth fields; a date followed by a note ("2026-11-16
(mid-semester)") is read.

### The bar

`.bar [hidden]` now hides: the bar's flex rules had outranked the
`hidden` attribute, so the empty summary row and its Done button showed
before a student was loaded.

### Checks

`qa/due-test.js` (PR-1, SA-1, CN-1, SM-1 and ST-1 simulations put
their review dates and next steps on the due line, in date order,
overdue and "today" marked), the agents' simulation sweeps (every
converted form: the toast shows, no notice is open, no error, print
page counts as above), and the earlier checks (`all-forms-shell`,
`case-test`, `ob1-split-test`, `guard-test`, `bip4-test`, `u-test`,
the form tests) all pass.

## One Dark Band, Chart Colours, Agreement on OB-1, the Case as a Spreadsheet, and Lighter Forms (v21.36)

### One dark band (every form, inside the workstation)

Inside the workstation the screen stacked four stripes before the
first field: the white header, the slate packet bar, the white crumb
row and the form's own navy toolbar. The form's toolbar now goes light
when the form is framed (`html.nbh-framed`, which the bridge sets):
mist background, navy text, white buttons with the field border, the
pressed View button navy, the primary button navy. The rules sit in
the shared `nbh-ui-css` block, so a form opened on its own keeps its
dark toolbar and nothing in the print changes.

### Chart colours (DA-1)

The demand chart told low-probability from high-probability demands
by red against green, which eight percent of men cannot separate and a
grayscale print loses. The bars are now blue (low-probability), orange
with a white diagonal hatch (high-probability) and light grey (mixed);
the hatch and the tint hold in grayscale. The rank table's row tints
follow (pale blue, pale orange) and the legend and the hint name the
new colours. GC-1's teams (orange, purple, green with a brown
criterion line) were checked and left.

### Interobserver agreement on OB-1

OB-1 took a typed agreement percentage and nothing computed it. Each
observation sheet now has "A second observer scored this observation";
ticked, the count table gains a column pair for observer 2 (student
and peer counts, `count2`, `peerCount2`) and, when the interval sample
is on, the strip gains two more rows of the same toggles (`iv2`,
`peerIv2`). The form computes total count IOA (smaller count over the
larger, times 100) and interval-by-interval IOA (intervals scored
alike over intervals sampled), for the student and for the peer where
both records exist, shows them in a line under the table ("Agreement:
count 0% (0 and 2); intervals 90% (18 of 20); ..."), and fills the
Agreement field with the interval IOA when the sample is on, else the
count IOA, read-only and titled as computed. Unticked, the sheet, the
print, the CSV and the summary are as before, and the typed field
stays for an agreement computed elsewhere. The summary says in how
many observations agreement was computed; the CSV gains four columns
at the end (observer-2 counts, count IOA, interval IOA); the
simulation's second observation carries a second record that
disagrees in two intervals, which also shows the Guide's point: an
outright count disagreement with 90% interval agreement because the
behavior is rare. The Guide's new paragraph gives both formulas,
names scored- and unscored-interval IOA as the stricter checks the
form does not compute, and cites Cooper, Heron and Heward (2020),
already on the list. Blank print 6 pages and simulation print 9, as
before; older files open with the new fields empty.

### The case as a spreadsheet (index.html, the bridge)

**Case as spreadsheet** in the bar (and in the command box) writes
every open form into one workbook, `CASE_Student_date.xlsx`, which
Excel and Numbers open: a Case sheet (student, ID, grade, school,
BCBA, date, and a table of the forms with where each sheet came from),
then a sheet per open form in packet order. A form with a CSV export
of its own (24 forms, `#csvBtn`, `#dl-csv` or `#btnCsv`) answers the
new `csv?` verb: the bridge presses that button with the form's
messages held (`window.__nbhSilent`, honoured by `nbhUI.toast` and
`nbhUI.alert`), catches the file through `URL.createObjectURL` and the
anchor's `click`, hands the text back and restores both; nothing is
downloaded from the form. Any other form gives its snapshot, written
as a two-column sheet of every field by name (`flattenSnap`). The
workbook is written in the shell without a library: `xlsxBytes` builds
the SpreadsheetML parts (inline strings, numbers as numbers, column
widths from the content) and `zipStore` packs them as a stored zip
with CRC-32. `parseCsv` reads quoted fields, doubled quotes and
newlines inside quotes.

### Lighter forms: the letterhead image once per file

Every form carried the same 54 KB letterhead image once in the
masthead and once in every printed page's head: fourteen copies in
TD-1 (765 KB of a 1.3 MB file), 157 across the set, 8.6 MB in all.
The image now sits once per form in `<script id="nbh-logo">` in the
head (`window.NBH_LOGO`); the `nbh-logo` and `nbh-print-logo` images
carry `data-nbh-logo` and no `src`, and the script fills them at load
and again before printing. The master print, which takes each form's
sheet from the live page, still carries the image in every section.
TD-1 went from 1,305 KB to 598 KB, PA-1 from 1,270 KB to 727 KB, EA-1
from 1,054 KB to 620 KB, and the 42 forms with the index from 20.6 MB
to 14.6 MB. The one-file editions stay at 5.6 MB: their packing already
compressed the repeated image to nothing, so the saving is in the
folder editions and in what the browser parses per form.
`tools/build-rps.py` now expects the logo in 43 places (once per form,
once in the index). `$S/logo/dedupe.py` did it and is idempotent;
`new-form.py` copies the script from the template's head, so a rebuilt
parts form gets it.

The walkthrough engines, which the earlier note blamed for the file
sizes, are 60 to 146 KB per form and differ between forms (PA-1's
carries extras), so they were left in place; the image was the weight.

### Checks

`qa/logo-test.js` (every logo image filled on CF-1, TD-1 and SM-1, the
one data URI per file, the master print section with its image),
`qa/xlsx-test.js` (six forms with simulations, three with CSV exports
and three without, into one workbook; the zip verified and each sheet
parsed; the forms' helpers restored and no download fired from them;
the bar button downloads `CASE_Sample_Student_date.xlsx`), the DA-1 and
OB-1 form tests, the shell screenshots of CF-1, SM-1 and TD-1 with the
light toolbar, and the earlier checks all pass.

## The Workshop Committed (v21.36a)

The sources behind the forms had lived only in the working session: the
parts of the nine forms built from parts, the three shared block sources
and their patchers, the per-form case hooks, the post-build polish, the
logo de-duplication and most of the checks. They are now in the
repository: `tools/forms/<ID>/` (the parts; rebuilding each from them
reproduces the shipped file byte for byte, checked for all nine),
`tools/blocks/` (the blocks, the patchers, the hooks), `tools/polish-one.py`,
`tools/dedupe-logo.py`, `tools/rps-assets/` (the school lockup and tab
icon the RPS build needs), `tools/history/` (the one-shot scripts that
produced earlier versions of the index, kept as a record) and `qa/` (the
checks, with their outputs under `qa/out/`, ignored by git, and their
paths relative to the repository). `tools/README.md` says what each is
and gives the rebuild, refresh, build and check commands. Nothing in the
shipped editions changed.

## Every Procedure Runnable: the Yoked Control, and an Audit of the Forms' Procedures (v21.37)

The question for this version was whether every procedure a form
names, in a Select variant control, a condition card, a runner mode, a
Design page or a Guide sentence, can be run on that form: the sheet
with the fields the procedure produces, the timing read from the card,
the computation the interpretation needs, the print, the simulation,
and a Guide that promises nothing the form does not do. EA-1's yoked
control was the case that prompted it; three agents then drove every
procedure on the other 29 forms that carry one (the document forms
DM-1, IC-1, RR-1, EB-1, FS-1, CF-1, SV-1, PD-1, TB-1, IN-1, CN-1 and
VS-1 name none). Fourteen gaps were fixed in place and fourteen
additions built where a procedure had no sheet, no figure or no log.
Every blank print is unchanged; a simulation print grows only where a
new table now prints (TD-1, VI-1 and OB-1 by one page each).

### The yoked control runs on EA-1's runner

EA-1 described the yoked control (a master session in which the
reinforcer follows the target, a yoked session in which the same
reinforcer arrives at the master's recorded times whatever the student
is doing) and its card told the data collector to record every
delivery time, but the runner discarded those times at Save to the
log and had no way to replay them. Now:

- A session run on the runner keeps the time of every contingent
  delivery (each consequence period it opened) in its log row, in a
  hidden text field `s[i].y` (`v1;cons=30;min=10;t=12.4,33.0,...`) that
  saves with the file and never prints; the Notes say "n deliveries,
  times kept for a yoked session" and the session summary shows the
  count.
- The runner's settings gain **Replay deliveries from**, shown once any
  row holds a record, listing those sessions (number, date, condition,
  deliveries). Picking one sets the length and the consequence period
  to the master's, switches off any attention schedule, and during the
  session cues each delivery at its recorded time (the consequence cue,
  "Delivery 2 of 3: deliver the reinforcer now, whatever the student is
  doing") and opens the consequence period; nothing follows the target
  (`reinforce` returns at once while a record is in play). The cue box
  counts down to the next delivery.
- The summary adds "Replayed deliveries n of m from session k" and
  "Within 3 s of a target", the count of deliveries that landed within
  3 s of a target, which is the record Church's (1964) caveat asks for;
  the Notes carry both. A yoked session keeps no record of its own.
- A condition card named "Yoked" preselects the latest record; any
  condition can be yoked to any recorded session (an NCR control
  matched to a test session, the comparison SR-1 describes). "No
  consequence follows the target" on a card now reads as none, so the
  yoked card no longer inherits a 30-s period.
- The cards and the Guide say what the runner does; the Guide's "On
  this form" paragraph sits before the known-limitation warning.

`qa/ea1-yoke-test.js` runs the runner's clock at twenty times real
time: a one-minute master session with targets at 5, 20, 24 and 35 s
records three deliveries (the target inside a period makes none), the
row keeps the record, the yoked card preselects it and takes its
settings, the yoked session cues the three deliveries at their times
with no consequence after a target, two land within 3 s of a target,
the Notes say so, the file saves and reopens with the record, an
ordinary card is unaffected, and the blank print page count is
unchanged (18). Fifteen checks pass.

### Assessment protocols (RA-1, PA-1, DA-1, DT-1, AD-1, VI-1)

Every runner and sheet on these six forms was driven: RA-1's single
operant (reversal and multielement), concurrent operants, condition
comparison and progressive ratio; PA-1's eleven assessment runners
from the prerequisite check to the competing-stimulus variants and the
monitoring log; DA-1's alternating order, sessions and ranking; DT-1's
eight tabs from the dimension check through discounting to hand-off;
AD-1's eight sections; VI-1's nine tabs. Found and fixed: RA-1's
condition-comparison runner saved a session ended early with the Ended
early column blank, so the grid's own check then flagged it; PA-1's
monitoring verdict ignored the Guide's second rule (an item leaving
the top three on two consecutive brief MSWOs) although the log
computed it; DA-1's Guide said the sessions record instruction pacing
(one Inventory setting held constant) and omitted two of the
modifications the code proposes; DT-1's progress and delay-accuracy
rows had to be copied from the session sheet by hand, and a Carry
button now writes them; AD-1's skill-acquisition question promised
minutes to mastery with and without reinforcer time and gave only
sessions; VI-1's candidate labels, which the register says head the
ledger columns, had to be typed again, and are now mirrored while the
header is blank.

Built where a procedure had no sheet or no computation:

- **DT-1 aversiveness verification (2E)** has a selection-rounds grid
  under its table (one row per round, the rank picked per task); mean
  selection rank and % selected are computed into the table, which
  goes read-only while a round holds a value; saved as `avr`, printed
  once a round is entered. The simulation's five rounds now compute
  the figures its summary used to carry as typed numbers. **DT-1 2A**
  shows, beside the checkbox, whether table A meets "80% in two
  consecutive sessions" and on which sessions.
- **VI-1 joint method** is computed: a matched non-occurrence ledger
  under the pairs table codes each pair's non-occurrence P/A per
  candidate under the Tab 4 labels; present-in-all comes from Tab 4,
  absent-in-all from the ledger (Yes, Mostly at two thirds, No), pairs
  implicating from the codes, and the verdict (Strongly implicated,
  Implicated by difference only, Eliminated, Retained: insufficient
  pairs); the typed cells remain the fallback when nothing is coded.
  The simulation codes its eight pairs and computes to the answer its
  Guide states. A **contingency-space plot** (P(C|B) against P(C|not
  B), the no-contingency diagonal, one point per consequence row) sits
  under the contingency table and prints with it when a row computes.
- **AD-1's classroom question** labels the log, caption, graph axis,
  comparison and decision lines as intervals observed and intervals
  on task.
- `qa/ra1-regress.js` writes its print snapshot on a first run
  (`qa/data/RA-1.snap.json`) and compares on later runs.

### Treatment design forms (SR-1, TD-1, TE-1, RM-1, PR-1, GB-1, CR-1, BC-1, GC-1, SM-1)

Every schedule designer, component card, thinning ladder, decision rule
and record on these ten forms was driven against what its Guide
promises. Found and fixed: SR-1's Guide gave the arithmetic VI series as
2T/N, 4T/N when the designer uses 2T/(N+1) (which averages T), and said
the token designer warns "when the exchange-production requirement is
large" where the code's rule is more than 50 responses per exchange,
now stated as a working convention; the card put a "Date reached"
column and the heading "Steps" on the progressive-ratio breakpoints,
the token back-ups and the interlocking minute table, which now carry
their own headings; SM-1's Record applied the teacher-match agreement
rules to systems that have no teacher match (contract, expectations,
CICO, performance), and its "Points possible" row omitted the
expectations-and-earns system; TD-1's thinning ladder for NCE, NCR and
DRO gave "FT × 2 / × 4" with no seconds, and now reads the card's own
initial interval ("FT below mean IRT (19 s on the card)", "FT × 2
(38 s)"); TE-1's unit-price bands (low to 10, moderate to 40, high
above 40 responses per back-up) were nowhere named as the form's own
convention; RM-1's plan sheet said a low proportion with a high raw
rate "triggers" the safety row when the form fixes no raw-rate
threshold. PR-1, GB-1, CR-1 and BC-1 matched their Guides on every
rule driven (the plan-run gate, the fidelity-beside-outcome marks, the
exit readiness check, the deadline clock, the direction test's four
branches).

Built where a procedure had no sheet:

- **TD-1 high-p trial sheet.** The high-p sequence planner gave the
  Guide's 40% identification and 80% re-verify rules nothing to read.
  The Antecedents sheet now has a per-session trial sheet under the
  planner (date, order used, trials 1 to 5 with high-p 1, 2, 3 and the
  low-p instruction each Y/N), computing low-p cooperation per session
  against the 40% figure and each high-p instruction's cooperation
  against 80%, flagging an instruction to re-verify on ten probe trials
  or replace; an All row pools the sessions. It saves with the file
  (`ant.hp.t[s].*`, `counts.hp`), prints with the planner only when
  filled (the blank print is unchanged at 39 pages; the escape-FCT
  simulation, which fills four sessions, prints one page more), and
  the Guide names it.
- **TE-1 thinning record** has a Backups per exchange column, so a
  step on the exchange schedule is numeric and each step's unit price
  shows beside its responses per exchange.
- **GC-1 Record** names the winning team(s) per day when a "fewest
  fouls wins" option is chosen (lowest score, ties both, and teams at
  or under the criterion when that option says so), and tootling has a
  cumulative goal with a running Total column and a decision rule that
  reads progress to the goal (days on this count, mean per game day,
  days still needed) instead of a per-day met.
- **SR-1's card** names the workstation forms that hold the data
  sheets its schedules need (DD-1 for counts and intervals per session,
  SM-1 for the interlocking session sheet, MT-1 for interval samples)
  in place of a "DRO interval log" that was no workstation form.

### Measurement and training forms (OB-1, MT-1, ABC-1, DD-1, SP-1, SA-1, HD-1, TI-1, ST-1, CT-1, MS-1, SI-1, IA-1)

Every recording method, runner mode, agreement figure, scoring rule
and decision rule on these thirteen forms was driven against its
Guide: the three interval methods and the Live Recorder on OB-1, MT-1's
runner and its three agreement figures, ABC-1's timed checks and the
2 by 2 with Camp's criteria, DD-1's four entry modes and its
within-condition and between-condition statistics, SP-1's control
chart on Wheeler's four criteria, SA-1's trial grid, prompting rules,
three chaining methods and probes, TI-1's runner with the repeated-step
roll-up, ST-1's rehearsal runner, competency gates and the import from
TI-1, CT-1's home probe, MS-1's AIMS summary rules and weekly grid,
SI-1's assent log, and IA-1's five instruments. All matched. One gap
fixed: SA-1's Setup asks for the settings or material sets the mastery
criterion requires and nothing counted them; the probe metrics now
count a passed generalization probe once per distinct setting or
material condition against that number, and the probes sheet re-reads
the criterion when Setup changes.

Built where a procedure had no field, figure or log:

- **ABC-1** holds the consequence window and the background check
  interval in the Observation header (saved, printed, and taken by
  the timer as its setting), where the walkthrough had said they were
  "written down" with nowhere to write them.
- **OB-1** computes scored-interval and unscored-interval IOA from
  the two observers' marks (the stricter checks for a rare and a
  frequent behavior respectively), flags each below 80%, carries both
  in the CSV, and its Guide no longer says the form does not compute
  them.
- **MT-1** carries the three agreement figures (point-by-point,
  occurrence, non-occurrence) into the session log at Capture, and
  its CSV lists the log after the intervals.
- **MS-1** has a Screens on File log on the EPS sheet (date,
  occasion, rater, AIMS total, Schooler-Kane, observer ratings) with
  Log this screen, and the baseline, three-month and six-monthly due
  dates run from the antipsychotic's start date, marked logged or not;
  every simulation holds two screens.
- **SA-1** shows a Delay (s) or level row under the trial grid when
  the hierarchy is constant or progressive time delay (or Setup names
  a delay), prints it on the trial sheet, and applies a time-delay
  rule in the decision rules (a 0-s session with every trial correct
  moves to the delay; more than 20% errors at a delay returns to 0 s
  for a session; under progressive delay a criterion session with no
  error lengthens the delay), labelled working conventions after
  Wolery, Ault and Doyle (1992), already on its list.

### Checks

`qa/ea1-yoke-test.js` (fifteen checks, above), the agents' Playwright
drives of every runner mode and procedure on the 29 forms (each
ending with no console or page error; outputs under the scratch
folder's protocols, design and measure groups), the form tests
(`sm1`, `sa1`, `gc1`, `si1`, `da1`, `hd1`, `cn1`, `sr1`, `vs1`, `pd1`,
`ob1-ioa`, `ob1-split`), `all-forms-shell`, `u-check`, `u-recorder`,
`case-test`, `xlsx-test`, `logo-test`, `due-test`, `bip4-test`,
`guard-test`, `rowdel-test`, `v2133-test`, `ui-sweep` and
`shell-ui-test` all pass. `qa/sm1-test.js` asked for a PDF it never
wrote and now reads the one it does; `qa/ra1-regress.js` writes its
snapshot on a first run.

## Form IM-1, the Self-Injury Trauma Scale on a Body Map; PA-1's Item Names (v21.38)

### Form IM-1: Self-Injury Trauma Scale and Injury Monitoring (the 43rd form)

A form for the physical consequences of self-injury over a case: the
Self-Injury Trauma (SIT) Scale of Iwata, Pace, Kissel, Nau and Farber
(1990, Journal of Applied Behavior Analysis, 23(1), 99-110)
administered at intake and at intervals, scored as published, every
administration kept with its body map, the indices graphed over time,
and the nurse's checks logged beside them. It is listed under
Specialist protocols after MS-1 and in the case map under Observe and
measure. Built from parts (`tools/forms/IM-1/`); the body silhouettes
are inline SVG generated once by a scratch script and kept static in
`body.html`.

**Setup.** The student details through the packet map; Part I of the
scale (the ten topographies and Other; healed injuries at up to five
sites, which the paper scores once because restraint and medication
hide current trauma); who administers (examiner, trained by, nurse,
intake date, every n weeks, time of day); a restraint and injury-report
event table; a schedule box (the form's own convention) that also
answers the shell's due line.

**Body map.** Front and back silhouettes and a larger head detail,
every Part II location a tappable path with its name (31 chart rows,
29 with a surface; genitalia and rectum come from the chart's list). L
and R are the student's, labelled on each figure, the student's left
on the viewer's right on the front view. A tap places a marker at the
tap point and opens the row; tapping a marker selects it; the same
location tapped again while selected moves its marker; every path is a
keyboard target. Markers: a circle for an abrasion or laceration, a
square for a contusion, the number rank inside, severity 1 amber, 2
orange with a double ring, 3 red hatched with a heavy ring, so a
grayscale print still tells them apart.

**Scoring, as published.** Per injured location the number of wounds
(1 one, 2 two to four, 3 five or more), the type of the worst wound
(AL: a break in the skin, superficial or deep, from tearing, biting,
excessive rubbing or a sharp object; CT: a distinct area of abnormal
discoloration or swelling, with or without tissue rupture, from
forceful contact) and its severity on the type's own scale (AL 1 red
or irritated with spotted breaks, 2 distinct but superficial, 3 deep
or extensive or avulsion; CT 1 local swelling only or discoloration
without swelling, 2 extensive swelling, 3 disfigurement or tissue
rupture), the severity list following the type. Part III: the Number
Index from the number total (0 none; 1 for 1 to 4; 2 for 5 to 8; 3 for
9 to 12; 4 for 13 to 16; 5 for 17 or more), the Severity Index from
the severity frequencies (0 none; 1 all 1s; 2 one 2 and no 3s; 3 two
or more 2s and no 3s; 4 no more than one 3; 5 two or more 3s), and
the Estimate of Current Risk (Low: no injuries, or any AL-1, CT-1 or
AL-2 except near the eyes; Moderate: any AL-2 near the eyes or any
CT-2 except on the head; High: any CT-2 on the head or any AL-3 or
CT-3), with the rule that set it named. "Near the eyes" is read as the
Eye and Eye Area locations and "on the head" as any Head-group
location; a free "kind" note (bite, bruise) sits beside the type.

**History.** Every saved administration (date, examiner, number total,
NI, SI, injured locations by group, risk and its rule), opened
read-only or edited, a graph of NI and SI from 0 to 5 with the risk
band under each date (saved as an image like the other graphs), and
the nurse log (date, who, findings, action, referral). Save data, Open
data, CSV (one row per injured location per administration, then the
nurse rows), Clear all, a simulation (three administrations over six
weeks, High to Moderate to Low, a nurse check for each, a restraint on
the schedule), the case hook (the self-injury target from the case
into the behavior fields), and the standard toolbar. Blank print 8
pages (the map and chart on one), simulation 9.

**Guide.** The scale's purpose and development, administration (a
trained examiner, about twelve minutes, repeated examinations at least
a week apart), the published tables, what High means in the paper and
that low-risk injuries still require intervention, the published
interrater agreement (overall 97%, location 99%, type 96%, number
89%, severity 94%; NI 90%, SI 92%, risk 100%; 50 pairs of records on
35 subjects aged 3 to 19), the limits (visible damage only; pica,
vomiting and air swallowing produce damage that is not visible; hair
pulling produces negligible trauma), and a section naming the form's
own conventions. References: Iwata et al. (1990), Cooper, Heron and
Heward (2020), Hagopian, Rooker and Zarcone (2015).

`qa/im1-test.js`: 59 paths and 31 chart rows, three taps placing
markers and rows, hand checks of NI, SI and risk on four cases, the
marker recolouring with severity, deletes, save to history, a new
administration, reopening read-only, the Save data round trip
identical, the CSV's 19 columns, the simulation's three
administrations (number totals 8, 4, 1 giving NI 2, 1, 1; SI 3, 3, 1;
High, Moderate, Low) and its graph, print page counts, the phone width
without overflow, no console or page error.

Registration: the index's form list and case map, the counts in the
Help, the READMEs and the build scripts (43 forms), and the RPS build's
replacement expectations (44 logos, 160 alt texts).

### PA-1: the names typed in the pool reach every sheet

The stimulus pool at the top of PA-1 (the "Item 1, Item 2" rows) fed
the trial and session sheets through `relabel()`, which rewrote every
element carrying `data-lbl` and every select carrying `data-items`.
Two places were outside it: the competing-stimulus sheet (its order
line, re-test table and three validation selects) and the monitoring
graph's item select kept "Item n" until the form was reopened.
`relabel()` now re-renders the competing-stimulus sheet and rebuilds
that select, keeping its value, so a name typed or changed in the pool
shows everywhere at once. Verified by typing three names on a blank
form (no "Item n" text left on any sheet) and renaming an item after
the simulation (the re-test table, the validation selects and the
monitoring select follow).
## Respondent Pages: Questionnaires Sent Out and Collected Back by Email (v21.39)

The indirect assessments are informant reports, and the informants are
rarely in the room. Form IA-1 could already import the responses
spreadsheet of a Google Form (v21.2x, `Import Google Forms responses`).
It can now make its own questionnaires and read them back, with no
account, no server and nothing installed.

### The shared library (`nbh-respond.js`, `respond.html`)

`nbh-respond.js` sits beside the forms like the picture library (one
copy; the one-file edition carries it once as `nbh-embed-respond` and
puts it into a form's `<script src="nbh-respond.js">` tag as the form
opens; the shell's Diagnostics lists it). It offers `pageHTML(payload)`,
a self-contained HTML questionnaire (the runtime function's own source
is copied into the page, so the page needs nothing beside it: it works
from an email attachment, offline, on a phone); `payloadToHash` and
`payloadFromHash`, for `respond.html`, a thin hosted page that renders
the questionnaire carried in the link's `#p=` fragment; and `encode`,
`decode`, `find`, for the answer code. A payload names the form, the
instrument, the student label, the behavior, the assessor and the
reply address, the items with their scale (yes / no / N/A, or a
numeric range with its anchors), the respondent fields and any
open-ended questions. The respondent answers (large touch targets, a
running count, every item required, N/A counting), presses Send, and
the page builds the answer code (`NBH1.` and the response as
base64url JSON: form, instrument, student label, the answers, the
respondent's details, the open answers, the date) and opens the
assessor's email program with the code in a message to the reply
address; the page also shows the code (Copy the code) and saves it as
a small file, for mail systems that strip bodies. The page stores
nothing and sends nothing on its own; the student appears as initials
and ID.

### IA-1

- **Setup** gains the assessor's email (`m.email`) and **Item Wording
  for Respondent Pages**: one box per instrument (FAST 16, QABF 25, MAS
  16, PBQ 15 or 18), pasted once from the assessor's own copy of the
  published instrument (the wording is not built into the workstation),
  numbered or not, counted live, saved with the file (`rp.w.<inst>`)
  and therefore in every case file; it does not print.
- **Respondent pages** (toolbar) opens a dialog prefilled with the
  instrument, the student label (initials and ID from the Setup
  sheet, editable), the reply email, the behavior (label and
  definition) and a due date, with the FAST's open-ended questions as
  an option; it refuses with a reason when the wording is missing or
  short, the email is empty or the library is absent. **Save the page
  as a file** downloads `IA-1_<INST>_respondent_<label>.html`; **Copy a
  link** copies `respond.html#p=...` when the workstation is served
  from a website (opened from a folder it says to send the file);
  **Preview** opens the page.
- **Collect responses** (toolbar) takes pasted emails (whole messages;
  only the `NBH1.` codes are read) or the respondents' saved files,
  lists the responses of the instrument found (name, relationship,
  date, answers read, the informant slot each goes to, up to five), and
  places them through the step the Google Forms import uses
  (`importResponses`, now shared): the worksheet's informant columns,
  the informant table (name, relationship, months known, daily
  contact, setting) and, for the FAST, Section 1's open answers. Codes
  from another form are refused by name.
- The Guide's Informants paragraph says so, with the PHI rule.

`qa/respond-test.js` (eighteen checks): the library beside the form,
the dialog prefilled, the refusal without wording, the page file (named,
self-contained, carrying the wording and no full name), the link, the
page rendering sixteen items with the open questions, the send that
asks for the name first, the code and the mailto (under 1,900
characters), the collector finding and placing the response (answers,
informant table, Section 1), the PBQ through the hosted link with its
anchors and the 15-item version, the wording and email in the saved
file and back after reopening, no console or page error.

### One page per target behavior, personalized, with the definition confirmed

- **Targets from the case.** The dialog's Target behavior select lists
  this form's own target (Setup) and every target the case holds from
  Form TB-1 (replacements left out), and "Every target above (one page
  each)". Each chosen target gets a row: the term used in a sentence
  ("How often does ___ occur?"), the plural phrase ("How severe are
  ___ when they occur?") and the definition the page shows; the terms
  are remembered per target (`rp.terms`) with the file.
- **Personalized wording.** `NBH_RESPOND.personalize(text, {name,
  pron, beh, behs})` rewrites a pasted item: "the student", "the
  client", "the individual", "the child" (and their possessives)
  become the student's first name (`rp.name`, from the Setup name,
  editable, blank for "the student"); "he or she", "him or her", "his
  or her", "himself or herself" become the chosen pronouns (`rp.pron`:
  he, she or they, with the verb after "they" agreed); "the problem
  behavior", "the target behavior", "the behavior" become the
  behavior's term and the plural forms its plural phrase, capitalized
  as the original was. The dialog previews the first three items as
  the page will read them. So "In what situations do you usually
  interact with the student?" reads "...with Georgi?", "How often does
  the problem behavior occur?" reads "How often does self-injury
  occur?", and "How severe are the problem behaviors when they occur?"
  reads "How severe are self-injurious behaviors when they occur?".
- **The definition, confirmed.** The page shows "What counts as
  <behavior>" with the definition and, when the option is on, a
  required question in the shape of the Google Form it replaces: "Do
  you understand this definition of <behavior>? Yes / No / Unsure".
  Send refuses until it is answered. No or Unsure shows a note asking
  the respondent to check with the BCBA first (name and email) and to
  answer only about what matches the definition; they can still send,
  and the answer travels in the code as `confirmed` (yes / no /
  unsure), which Collect responses shows per respondent as
  "understood", "did not understand" or "unsure".
- **Collect responses by target.** Every code carries its target's
  label. Responses about this form's target are placed; responses
  about another target are held with a count and a "Copy those codes"
  button for that behavior's own IA-1 file (one IA-1 per target, as
  the form is designed); a form with no target named takes the target
  from the responses and writes it to Setup.
- Files are named by instrument, target and label
  (`IA-1_FAST_Self-injury_respondent_G.S._ID_12345_.html`); "Every
  target" saves one file per target and copies one link per target.

### SV-1, CF-1 and IN-1

The three other forms that ask other people for their views got the
same two toolbar buttons, **Respondent pages** and **Collect
responses**, the same reply-address field on their Setup sheet
(`email`, saved with the file), a Guide paragraph that does not print,
and the same shape of dialog: who the page is for, the student as
initials and ID, the reply email, then **Save the page as a file**,
**Copy a link** and **Preview**. Each form's collector refuses a code
from another form by name and places a response by the respondent's
name when one is already on the sheet (case aside), otherwise into the
first empty slot, otherwise into a new one. Blank prints are unchanged
(SV-1 twelve pages, CF-1 six, IN-1 six).

- **SV-1 Social Validity.** One page per respondent type and round
  (teacher, caregiver, administrator or the student, pre or post), in
  that type's wording: the student page carries the student items, the
  adult pages the adult items, the post pages the Effects items (E5
  reversed on the Summary as before). The 1 to 6 scale carries its
  anchors and an **N/A** choice ("I cannot judge, or have not seen it
  run"), placed as the form's own N/A, which the means already leave
  out. The open items come first on the page, as they do on the sheet.
  Collect places name, role, mode (Interview when the page was read to
  the respondent), the round's date, the ratings and the open answers
  into the respondent's row; a respondent returning for the post round
  goes beside their pre round.
- **CF-1 Contextual Fit.** One page per respondent role and round
  (round 1 or 2) with the 21 items in order on 1 to 6 (no N/A: the
  scale forces a direction, as the form says) and four questions about
  the respondent (role as typed, the periods they see the student,
  months known, daily contact). Collect places the ratings into the
  respondent's column for that round, so the Barriers sheet flags the
  low ratings and the Summary compares the rounds. CF-1 is the
  template every parts-built form is assembled from, so its additions
  stay in its own body and script: DA-1 rebuilt from the patched CF-1
  is byte-identical.
- **IN-1 Stakeholder Interview.** The interview protocols are open
  prompts, so the pages have no rating items: one page per set (parent
  or guardian, teacher and staff, the student), every prompt a text
  box (1,500 characters), the checklist prompts as rows of Yes / No /
  Sometimes with a note each, and two questions about the respondent
  (name, relationship). The student set substitutes the student's word
  for the target behavior, which the dialog asks for. Answers this long
  exceed what a `mailto:` link carries, so when the code is longer than
  about 1,800 characters the page says so, opens no email, and leads
  with **Save as a file** then **Copy the code**; Collect reads the
  saved `.nbhr.txt` files as well as pasted messages, defaults a new
  respondent's role from the relationship (Teacher, Staff member or
  Related service provider for the school set) and places every
  answer, the checklist rows (a note becomes "Row: text" under the
  question) and the interview date.

`qa/sv1-respond-test.js` (24 checks), `qa/cf1-respond-test.js` (24) and
`qa/in1-respond-test.js` (25) cover each form the way the IA-1 test
does: the dialog, the page file and link, the page's rendering and
send, the collector's placement over two respondents and two rounds, a
refused foreign code, the saved file and reopening, no console or page
error, and the blank print page count against the pre-edit file.

### Hosting

`nbh-respond.js` and `respond.html` go up with the folder (HOSTING.md);
the one-file editions carry both inside. The shell's Diagnostics shows
"Respondent pages" as found or missing; a form opened without the
library keeps its buttons but refuses with "The file nbh-respond.js is
not beside this form".

## The Indirect Assessments Looked At Again (v21.40)

Two changes to the respondent pages asked for after v21.39, then an
audit of Forms IA-1 and IN-1 as indirect assessments.

### The definition question decides whether the page sends

A respondent who answers **No** to "Do you understand this definition
of <behavior>?" cannot send: the page says so in the question's note
and again at Send, names the assessor and the reply email, and asks
them to have the definition explained and change the answer to Yes.
**Unsure** still sends, with its note, and is reported in Collect
responses as before. The reasoning is simple: ratings of a behavior
the rater says they do not recognize are not data; a rater who is
unsure is told what to do and is flagged for you.

### An instructions video or page on the respondent page

The IA-1 dialog has **Instructions video or page**: a link (http or
https only) that the page shows as "Watch the instructions" under the
instructions, opening in a new tab. It is remembered with the file
(`rp.video`) so every page of the case carries it. The library takes
`links: [{url, label}]` in any payload, so the other forms' dialogs
can offer the same when wanted.

`qa/respond-test.js` grew two checks (the link on the page; No blocks
Send and names the assessor) and the saved-and-reopened check now
carries the link.

### Unanswered items stop the first Send

The page said every item was required but sent anyway when some were
blank. Now the first Send with gaps stops, names the unanswered items
and says how to send with them blank on purpose: press Send once more
without changing anything. The second press sends and says "Sending
with n left blank, as you chose". A respondent who means to skip an
item (CF-1 has no N/A) can; one who missed it is caught. The answer
code also carries `sig`, the start of item 1's wording as the assessor
pasted it, so IA-1's collector can notice a page built from a
differently ordered copy of an instrument.

### IA-1: the audit and what it changed

An audit of IA-1 as an indirect assessment confirmed the item keys of
the FAST (items 1 to 4, 5 to 8, 9 to 12, 13 to 16), the QABF (five
subscales of five items) and the MAS (four of four) against the
published forms, the scale anchors, the Guide's framing (indirect
data generate hypotheses; the functional analysis tests them) and
the FA correspondence record. It found two things that were wrong
and a longer list that was unlabelled, missing or unused.

- **The FAST had a margin rule it does not have.** A one-item margin
  between the top two categories was called "weak differentiation"
  and the outcome was left out of the consensus. The published FAST
  scores the category with the most Yes answers, and most FAST
  outcomes that matched a functional analysis in Iwata et al. (2013)
  were decided by one item. Now only a tie or nothing endorsed is "no
  outcome" on the FAST; a one-item margin is a caution tag and the
  outcome counts. The Guide and the figure captions say so.
- **Consensus was counted in outcomes, not informants.** One
  informant who completed three instruments could make a
  "consensus". Each informant now casts one vote, their modal
  category across the instruments and interview cards they
  completed (a tie is no vote, except an attention/tangible tie made
  only of FAST social-positive outcomes, which agrees with either);
  the label reads "k of n informants" first, then "k of n counted
  outcomes"; fewer than three informants with an outcome gives no
  consensus label (this form's rule); the Smith et al. (2012) 4-of-5
  sentence appears only when four or more informants agree at that
  level on one instrument.
- **Completeness.** The MAS mean divides by the items answered, not
  by four; an incomplete subscale (MAS, QABF, PBQ) is flagged "k of n
  answered" and cannot lead silently. The QABF's endorsement count is
  used: a leading subscale with fewer than four of its five items
  endorsed is tagged weak support (this form's rule). The QABF
  respondent page offers "X: does not apply", left blank on import as
  the worksheet says.
- **House rules named as such** on the sheets and in the Guide: the
  MAS 10% margin, the one-third-of-maximum rule for Likert scales, the
  12-of-18 setting-events threshold, "setting events are conditions,
  not a function", and the PBQ's sum-and-rank reading. The 18-item PBQ
  is named the local adaptation of the district form, with no
  published key or reliability; 15 items stay the default.
- **Chance agreement lines** in Figure 2 are computed from the scale
  (exact 1/k, within one (3k-2)/k² for k points; QABF 25.0% and
  62.5%, MAS and PBQ 14.3% and 38.8%) and worded "chance under uniform
  responding". A sentence that attributed a 50% figure to Iwata et
  al. (2013) is gone.
- **Transcribed figures.** The Guide now says, where the Evidence
  boxes are introduced, in the Figure 3 caption and in the Pub.
  column, that their figures are transcribed from the articles'
  tables and should be confirmed against the full text before being
  quoted in a report. Nothing was removed or changed.
- **The hypothesis reaches the packet.** The Convergence sheet has
  **Indirect hypothesis carried to the packet** (`m.fn`), set from the
  leading category when empty and never overwriting a choice; the
  packet bridge carries it to the forms with a function field. The
  Hypothesis Statement has **Draft from the convergence sheet**, which
  fills only empty fields: the leading category as a hypothesis with
  its counts, the second or tied category as the alternative, PBQ
  setting-event items at or above the threshold and the interview
  setting events, the idiosyncratic notes, and the behavior.
- **Informant dates.** The informant table has "Date given"; a note
  appears when informants were assessed more than three days apart;
  Collect responses and the Google Forms import write the response
  date into an empty slot.
- **Smaller.** Clear all keeps the pasted item wording, the respondent
  terms and the video link (its confirm says so). Lowering the
  informant count asks before dropping columns that hold scores. A
  response whose wording signature differs from this form's pasted
  item 1 is marked "check the item order" and left unticked. The
  consensus tag says how many FAST social-positive outcomes it
  includes. The Setup sheet says one IA-1 file per target behavior.

Blank print 19 pages before and after; the simulated case 21 before
and after. `qa/ia1-audit-test.js` (50 checks) covers each item.

### IN-1: what the interviews did not ask

Set against the Functional Assessment Interview (O'Neill et al., 2015)
and the open-ended interview (Hanley, 2012), the three question sets
covered topography, rate, triggers, precursors, consequences, home
setting events, the respondent's view of the function (school), prior
strategies, strengths and the student's own account, and missed six
things a replacement behavior and a plan depend on. Each set now ends
with them (appended, not inserted, so a record saved before this
version keeps its numbering):

- **Communication**, all three sets: how the student usually
  communicates and how they ask for help, a break, something they
  want, or attention (the student's version: "When you need help or
  want a break, what do you do?").
- **Reinforcers**, school set: what the student works for, chooses in
  free time and asks for; it meets the student's own answer in the
  convergence table.
- **History**, parent and school: when it started, better or worse,
  what earlier plans did.
- **Alone or unattended**, parent and school: Hanley's screen for
  automatic reinforcement.
- **Intensity and duration**, parent and school.
- **School setting events** as a checklist row (poor sleep, missed meal
  or medication, schedule change, substitute or staffing change, a
  conflict earlier in the day, illness) with a note, the shape of the
  parent checklists.
- The parent is now asked why they think their child does this, so
  the parent's view reaches the function row of the convergence table
  beside the school's. The student's reward answer and the parent's
  "what do they lose", "who is present" and rate answers have rows of
  their own.

The parent set has 20 questions, the school set 20, the student set
12. The blank print grows from six pages to seven: the empty parent
interview on it carries the five added questions.

Also on IN-1: the Format list has **Written (respondent page)**, set on
every response Collect responses places; the respondent pages ask the
definition question (the behavior's short name is read from the text
before the first colon of the sheet's behavior field, editable in the
dialog) and Collect shows understood / did not understand / unsure,
kept on the respondent's record and on the interview heading; the
Convergence sheet has **Interview hypothesis carried to the packet**
(`data-m="fn"`, the interviewer's choice: the interviews do not score),
which the packet bridge carries to the forms that take a function; the
Guide's five purposes carry their citation. The simulation answers
every new question. `qa/in1-audit-test.js` (34 checks) covers it, and
`qa/in1-respond-test.js` (26) was updated for the new counts and the
definition question.

### Checked

`qa/respond-test.js` (20), `qa/sv1-respond-test.js` (24),
`qa/cf1-respond-test.js` (26), `qa/in1-respond-test.js` (26),
`qa/ia1-audit-test.js` (50), `qa/in1-audit-test.js` (34), the shell
test over all 43 forms, the shared-block check and the one-file check
pass. Blank prints: IA-1 unchanged at 19 pages; IN-1 six to seven
pages for the reason above; SV-1, CF-1 unchanged.

### The Iwata et al. (2013) figures, checked against the article

With the article in hand, every figure IA-1 quotes from Iwata,
DeLeon and Roscoe (2013) was checked: 151 individuals and 196 pairs
of FASTs; item-by-item agreement 71.5% (28.6% to 100%); outcome
agreement 64.8%, 67.1% single-function and 63.3% multiple-function;
the sixteen Table 3 item values behind the Pub. column and Figure 3;
antecedent items 78.9% against consequence items 67.7%; the Table 2
summary of the MAS (41% to 63%) and QABF (median 78%); 59 individuals
and 69 functional analyses, correspondence 63.8% (social-positive
77.8%, social-negative 56.0%, automatic-positive 61.5%), 70.8% with
informant agreement and 100% for social-positive, 54.6% for
social-negative; N/A items excluded from agreement; the same day or
within 2 to 3 days, 15 to 20 minutes; the 1, .5, 0 correspondence
score; the open-ended section as a check for inconsistencies; and the
sentence that most matching FAST outcomes were decided by a
one-question difference. All match. One sentence the audit had
removed was put back in accurate form: the article does describe
within-1 agreement on a 6-point range as about 50% chance, equivalent
to a yes/no item; the captions now say so and still draw the exact
value under uniform responding. The Guide's flag now reads that the
Iwata figures were checked and the other studies' figures remain
transcribed. The FAST form itself (Florida Center on Self-Injury,
2005) was compared with IA-1's Section 1 and informant fields: the
relationship, years and months known, daily contact, situations,
frequency, severity, most and least likely situations by days and
times, settings and activities and persons present, before, after and
current treatments are all present.

The same was done for Smith, Smith, Dracobly and Pace (2012) once the
article arrived: five respondents, 42 target behaviors, agreement of
at least 4 of 5 on the primary maintaining consequence for 52% (22
of 42) on the MAS and 57% (24 of 42) on the QABF, 26% on both;
functional-analysis correspondence in 6 of 7 QABF cases and 4 of 7
MAS cases. All match, and the Evidence box now also carries the
article's caution that the QABF's edge in agreement came with more
within-rater ties (27 against 20 on the MAS). The 4-of-5 level, as
the article defines it, is agreement among respondents on one
instrument, which is how the Convergence sheet applies it.

### Four things seen on the iPad (v21.40c)

Screenshots of the hosted RPS edition on an iPad showed the IA-1
Respondent pages dialog misbehaving in four ways; all four are fixed.

- **Copy a link and Preview did nothing.** They were disabled because
  no FAST wording had been pasted yet, but the disabled state did not
  show on the tablet. The three buttons now stay tappable: when the
  page cannot be built, a tap flashes the reason in the status box
  (the wording, the email, a target, a definition) and the buttons
  are drawn faded.
- **Preview** opened a new tab at a blob address, which iPad Safari
  blocks or shows blank. It now opens inside the form, in a dialog
  with the page in an iframe, exactly as the respondent will see it,
  with a Close button.
- **Copy a link** relied on the clipboard, which tablets refuse in
  some states, and on refusal dumped the whole link into the note
  line. The link (or one line per target) now also appears in a box
  under the buttons, selected, with a note saying whether it was
  copied or should be copied from the box.
- **The target from TB-1 arrived with its definition in the label.**
  The case bridge writes "Aggression: Forceful contact ..." into the
  form's behavior field, so the dialog showed the whole sentence as
  the label, an empty definition column and the complaint that the
  definition question needs a definition. The dialog now splits
  "Label: definition" when the definition field is empty, and takes
  the case's definition when the case holds the same label. The
  targets table has fixed column widths so the definition column is
  no longer squeezed to one word.

`qa/ia1-ipad-test.js` (6 checks) covers them; the respondent and audit
tests still pass.

### Pasted once per instrument, not once per case (v21.40d)

A new case starts from a blank IA-1, which meant pasting the
instrument wording again. The form now remembers, on the device it
runs on (browser storage, no student information), the pasted
wording, the instructions link and the reply email, and fills them
into a fresh IA-1 whose fields are empty. The Setup sheet says what
the device remembers and has **Forget on this device**. A case file
still carries its own copy, so a file opened on another device brings
its wording with it. The same prefs mechanism the shared blocks use
for display settings is used here; a private window or a cleared
browser simply means pasting again. Three more checks in
`qa/ia1-ipad-test.js`.

### The QABF, MAS and PBQ forms from the assessor's own folder (v21.40e)

The assessor's Drive folder for the indirect assessments holds the
QABF (Rev. B, Vollmer and Matson), the Motivation Assessment Scale
sheet and the Problem Behavior Questionnaire physical form, each with
its scoring page. Checked against them: IA-1's QABF key (Attention 1,
6, 11, 16, 21; Escape 2, 7, 12, 17, 22; Non-social 3, 8, 13, 18, 23;
Physical 4, 9, 14, 19, 24; Tangible 5, 10, 15, 20, 25) and its X, 0 to
3 scale; the MAS key (Sensory 1, 5, 9, 13; Escape 2, 6, 10, 14;
Attention 3, 7, 11, 15; Tangible 4, 8, 12, 16) and its 0 to 6 anchors;
and the 18-item PBQ key (Adult escape 1, 11, 15; Adult attention 2,
7, 14; Gain item or activity 3, 10, 18; Peer escape 4, 12, 16; Peer
attention 5, 8, 13; Setting events 6, 9, 17). All match. The 18-item
PBQ turned out to be a circulated adaptation with its own profile
sheet rather than a purely local form, so IA-1 now calls it that
("key from its profile sheet, no published reliability") instead of
"local adaptation of the district form". The item wording of all
three was extracted from those forms into paste-ready files for the
assessor; the workstation still ships none of it.

### Fifteen or eighteen PBQ items (v21.40f)

Compared item by item, the 18-item PBQ holds all 15 published items
(Lewis, Scott and Sugai, 1994) in their published order, with three
"gain item or activity" items inserted at 3, 10 and 18. Its five other
columns are therefore the published profile, item for item. The
working convention: administer the 18-item form, read the five
published columns as the PBQ and the gain column as an addendum.
IA-1 says so on the PBQ sheet, and when the gain column leads in
18-item mode the verdict notes that the published PBQ has no tangible
scale and points to the QABF and FAST tangible items for
confirmation.

## The Elopement Interview as a Fifth Instrument, and What Is Not Here (v21.41)

### The WEFA in IA-1

The Wandering and Elopement Functional Assessment Interview (WEFA;
Honsberger, 2011, as adapted in the assessor's copy) is a scored
rating scale, not an open interview: eighteen true or false statements
in four sets, each set read on its own by the count of TRUE answers
(0 to 1 not likely, 2 to 3 moderately likely, 4 to 5 likely), with a
header of elopement details (how the student communicates and how
reliably; what they seek out, such as water, vehicles, trains, parks
or being chased; where and how often they elope, and in which school
contexts; what they usually leave; and when). It therefore joined IA-1
beside the FAST, QABF, MAS and PBQ, and gets everything they have.

- **Worksheet** "WEFA" with informant columns, true or false only (the
  paper form has no N/A), item numbers with a cue naming each item's
  set and no item wording; items 1 and 8 belong to two sets as
  printed and count in both; set counts with the form's likelihood
  labels; the counted outcome for convergence is the set with the
  most TRUE answers, a tie or nothing endorsed is no outcome, and a
  one-item margin is a caution, this form's rule, as for the FAST;
  agreement between informants item by item; a details block per
  informant with the ten header fields and the fill-ins for items 7,
  10 and 12, saved, printed and cleared with the form.
- **Convergence, m.fn, the hypothesis draft and the informant dates**
  take the WEFA through the instrument table with no special case.
  Attention, tangibles, escape and sensory map to the common
  categories attention, tangible, escape and automatic.
- **Setup** has the plan row and the wording box (18 items, pasted
  once, remembered on the device). The Guide has the glance row and a
  method paragraph that says plainly that no published reliability
  or validity data are in hand and that the single counted outcome is
  this form's rule, since the form labels each set on its own.
- **Respondent pages** offer the WEFA with True and False and no N/A
  (the library takes `scale.labels`, a null third label removing the
  N/A choice); the header details are asked first; Collect responses
  places TRUE as Y and FALSE as N and writes the details into the
  block. The Google Forms import does not read the WEFA.
- The simulation fills the WEFA for each scenario.

Blank print 20 pages before, 23 after: the new sheet prints as its
own pages, as the FAST sheet does. `qa/ia1-wefa-test.js` (38 checks);
the audit, iPad and respondent tests unchanged and passing.

### What indirect instruments the workstation holds, and what it does not

Taken against the instruments a school BCBA is likely to meet, with
the assessor's own Drive folder of forms as the second yardstick.

Held, as scored worksheets in IA-1: the FAST (Iwata, DeLeon and
Roscoe, 2013), the QABF (Matson and Vollmer, 1995), the MAS (Durand
and Crimmins, 1988), the PBQ (Lewis, Scott and Sugai, 1994; 15 items,
or the circulating 18-item adaptation) and, from this version, the
WEFA for elopement (Honsberger, 2011, as adapted in the assessor's
copy). Held as interviews: the FACTS, the Functional Assessment
Interview (O'Neill et al.) and Hanley's open-ended interview as
summary cards in IA-1 (routine analysis and summary statement), and
as question sets in IN-1 (parent, school, student), which after
v21.40 cover what the FAI and the open-ended interview ask. Held
elsewhere: the student-directed interview (Kern et al., 1994) in
SI-1; the RAISD preference interview (Fisher et al., 1996) in PA-1;
records review in RR-1.

Not held, and whether it matters:

- **A setting-events inventory.** The Contextual Assessment Inventory
  (McAtee, Carr and Schulte, 2004) and the Setting Events Checklist
  (Gardner, Cole, Davidson and Karan, 1986) rate the distal
  conditions (sleep, illness, medication, conflict, schedule) that
  the function scales only touch. The workstation has the PBQ's
  setting-events column, the FACTS card's setting-events field and
  IN-1's setting-event checklist rows, which cover the common
  school conditions but are not a published inventory. Worth adding
  as an IA-1 instrument if the assessor has a copy; the item wording
  would be pasted like the others.
- **The FAIR-T** (Functional Assessment Informant Record for
  Teachers; Edwards, 2002). A structured teacher record that overlaps
  the FACTS almost entirely. Not needed while the FACTS card and
  IN-1's school set exist.
- **Hanley's twenty questions as a set.** IA-1 holds the open-ended
  interview as a summary card and IN-1 asks its content in its own
  words. The assessor's copy of the 2009 revision could be added to
  IN-1 as a fourth set, verbatim, so that respondent pages can send
  it; it is a judgement call, not a gap.
- **Severity and topography scales** such as the Behavior Problems
  Inventory (Rojahn et al., 2001) and the Aberrant Behavior Checklist
  (Aman et al., 1985) are not functional assessments; they rate how
  much and how severe. IM-1 covers self-injury severity with the
  SIT; nothing covers the others, by design.
- **The older 27-item "Functional Assessment Screening Tool"** in the
  assessor's folder is a three-part forerunner of the FAST (Florida
  Center on Self-Injury) with a different key. IA-1 scores the
  published 16-item FAST and should not also score this one; the two
  would be confused in reports.

### The student's photo, every pronoun form, and links past the staff password (v21.41b)

Three things seen in use on the hosted edition.

- **A photo of the student on the respondent page.** The IA-1 dialog
  takes a photo; the device shrinks it to a small JPEG (224 pixels on
  the long side) that is kept in the form (`rp.photo`, saved with the
  file, cleared by Clear all, never remembered on the device) and
  shown at the top of the page beside the student label. It travels
  inside the page file only. A link never carries it: a link with a
  picture in it is too long for mail programs, and a link is the
  route most likely to be forwarded. The dialog says so when a photo
  is set. The assessor decides who receives a page with a face in it.
- **"(s)he", "he/she", "him/her", "him/herself", "her/him", "she/he"**
  and the "or" forms now all become the chosen pronoun; "(S)he" keeps
  its capital. With "they" the verb that follows loses its third-person
  ending ("they like", "they try", "they watch"), also across an
  adverb ("they always do"); adverbs and nouns ending in s are left
  alone. `qa/personalize-test.js` (7 checks) covers it.
- **Links that asked for a password.** On newsomebh.com the
  workstation folder keeps the staff password, so a respondent link
  into it asked every informant to sign in (it opened on the
  assessor's own computer only because that browser had the password
  cached). The dialog has **Address of respond.html for links**: put
  `respond.html` and `nbh-respond.js` in a public folder (HOSTING.md
  says how) and enter its address once; it is remembered on the device
  and saved with the file, and links then open without a sign-in
  while the workstation keeps its password.

Also: the shell's case map names IA-1's five instruments, since the
WEFA is a sheet inside IA-1 (View, WEFA), not a form of its own.
`qa/ia1-photo-test.js` (9 checks).
## Form TK-1, the Token Board Book (v21.42)

*v21.42b replaces this section's page size (now 8.82 by 5.82 in), type sizes, colours, QR style and Token Economy credit; see "TK-1 from the Illustrator files" below.*

A new form, the forty-fourth, built from parts in `tools/forms/TK-1/`
and placed beside VS-1 and SM-1 in the Implementation group. It prints
the assessor's four-page token board book, the one made until now in
Illustrator: a Choices page ("What Are You Earning?"), a Targets page
("First: Teaching Targets"), the student's Board ("<Name>'s Chart" with
First, Then and the token slots) and a Tokens page, each with its
instruction text on the back, plus the picture cards and the tokens to
cut out. The book page is 11 by 7.33 in, the size of the samples and
the bound books, printed centred on Letter landscape with trim marks
at the four corners (cut 0.58 in off the top and bottom); "Fill the
Letter page" on Setup keeps the full 8.5 in and stretches only the
white space. A 0.22 in slate band, the white panel 0.08 in inside it
with a 3 px black edge, a 0.45 in binding margin on the left of every
front and the right of every back; the tabs are staggered down the
right edge like a file index (CHOICES at the top, then TARGETS, BOARD,
TOKENS), each running from the band to the page edge, so all four show
when the book is closed. The colours, sizes and weights were matched to the
assessor's pages side by side and the comparison images are in the
release folder.

### What is on the form

- **Setup.** The student and the packet fields; the first name as it
  prints, with a bare-apostrophe choice (James' Chart); a Setting word
  for the Rules-row layout (Sam's Bus Chart); the photo, or an avatar
  (boy, girl, neutral child, or the library's Student and Me) when
  there is none; the token count, 3 to 10, with the captions written
  for it ("Your First Star!", "Keep Going!", then "Just k More!" down
  to one) and editable; the token picture (the smiling star, a smiley,
  thumbs up, a check, a coin, a heart, any library picture or a photo);
  the frame and tab colours; the Choices and Targets panel in light
  grey (#f3f4f5) or the samples' mid grey (#d9dde1); an optional
  background picture behind the Choices and Targets boxes at 5 to 25
  percent; the QR link; a credit
  line; which pages print and in what order.
- **Choices and Targets.** Six pictures each from the library or the
  student's photos, with a label above the picture (underlined on the
  Choices cards, plain on the Targets cards, as on the samples). An
  "Other" card with three write-in lines is added to each card sheet.
  "From the case" fills empty targets from the replacement behaviors
  on TB-1 and the acquisition objectives on GB-1, and empty choices
  from the PA-1 reinforcer menu in rank order; a label that names a
  library picture gets the picture.
- **Board.** First-Then (the default) or Rules row: one photo at the
  top right, a row of the first two to five targets with their labels
  in bold sans, and an Earn box over the strip. First and Then can
  hold a fixed picture, printed as a card inside the box. Blank name
  prints a line to write on after laminating. Six to ten tokens wrap
  the strip to two rows of five.
- **Backs.** The four instruction texts in the assessor's words (Token
  Board, Choice Board, Token Economy with Before You Start, Teaching
  Targets), each editable, with `**bold**`, `*italic*`, `__underline__`,
  `## heading`, and `{n}`, `{token}`, `{tokens}` and `{TOKENS}` for
  the count and the token's name. The text is set at 16 pt and never
  below 15 pt; what does not fit continues on a second back page (in a
  duplex order a blank sheet is added first so every back stays on the
  reverse of its front). The
  three How-to steps are a third block, printed as a two-page insert
  after the backs when ticked. The barcode, the Behavior-Charts logo
  and the web address are left out; the Token Economy back carries the
  edition's own logo and the credit line when one is given. Two obvious
  typos were fixed in transcription ("leaner", "would your learner" for
  "would like your learner"), "(see below)" became "(the Choices page)"
  since the product photo is not printed, and the Token Economy back
  says the tokens are on the front of its page, as the other version of
  that text does.
- **Preview.** The whole book as it prints, at reduced scale, in the
  order chosen on Setup: fronts only (4), fronts and backs interleaved
  for a duplex printer with a long-edge flip (8, or 10 with the insert;
  Setup says which flip to use and to test one sheet), the card sheets
  (3), all (13 with the insert), or a sheet of one card for spares: any
  choice, target, the token, or a card made on the spot, repeated on a
  portrait Letter page, 5 across at about 1.5 in (30) or 6 across at
  about 1.25 in (42), with light grey cut lines. Nothing else prints;
  print colours are exact.
- **Guide.** How the book is assembled (print at 100%, laminate, cut,
  hook-and-loop dots on the circles, bind on the left), the token
  economy notes in the assessor's words, and the two references the
  backs rest on: Premack (1959) for First-Then and Hackenberg (2018)
  for token reinforcement, as on TE-1 and VS-1.

### Under the hood

- The QR code is made inside the form by the MIT qrcode-generator
  library (Kazuhiko Arase), vendored at `tools/vendor/qrcode-generator/`
  and inlined at the top of the form's script with its licence header;
  type chosen automatically, error correction M, drawn as SVG. Nothing
  is fetched. A blank link prints no code.
- Pictures use `nbh-pictos.js` exactly as VS-1 does (the same picker,
  photos as thumbnails in the saved file); the one-file edition inlines
  the library for TK-1 as it does for SM-1 and VS-1. The tokens and the
  avatars are drawn in the form itself, since the library has no star.
- The whole state, pictures included, is mirrored into a hidden field
  (`tk.state`) so the shell's autosave and snapshots carry it; restore
  puts the pictures and captions back.
- Counts: 44 forms in `index.html`, `README.txt`, `README.md`,
  `tools/build-single.py` and `tools/README.md`; `build-rps.py` now
  expects 45 logos, 163 alt texts, 45 top-left page heads and 46 titles.
- `qa/tk1-test.js` checks the setup fields through save and reopen, the
  token count against the captions and slots, the page geometry (the
  centred 11 x 7.33 in page with its trim marks, the band, the box and
  slot sizes, the fill option, the panel colour), a long back that
  continues on a second page, the name forms, the QR
  code (present only with a link; its modules compared cell for cell
  with the same library run in node, since no independent decoder is
  available offline), the case prefills, the picker with a pictogram
  and a photo, every print order's page count, the print colours on the
  rendered PDF, the shell (status, facts, snapshot and restore) and
  that there are no console or page errors.

### Known limits

- The spare-card samples are 5 by 8 and 6 by 8 on a sheet taller than
  Letter; on portrait Letter the same card sizes give 5 by 6 and 6 by 7.
- The duplex order assumes a long-edge flip; a short-edge flip prints
  the backs upside down, which the Setup note says to check with one
  sheet.

The book titles print in the regular weight of the serif, as on the
assessor's pages, not bold. The QR encoder is the MIT-licensed
qrcode-generator (Kazuhiko Arase), vendored in
`tools/vendor/qrcode-generator/` and inlined into the form, so the
code is drawn without any network access.

### Print quality of the pictures (v21.42a)

Everything TK-1 draws itself (frames, boxes, titles, tabs, dots, QR
codes, the library's pictograms and the tokens and avatars drawn in
the form) is vector and prints sharp at any size. Pictures the
assessor adds are the one place quality can be lost, so the upload
now keeps an SVG as the vector it is, and keeps a photo or PNG at up
to 1200 pixels on its long side (about 420 dpi on a 2.85 in box; the
previous 480 pixels gave about 170), as a JPEG, or a PNG when the
picture has transparency. Save files grow with the pictures they
hold; a photo of a few hundred kilobytes each is the price of a
sharp card.

## TK-1 from the Illustrator files, and the instructions checked against the literature (v21.42b)

The assessor sent the Illustrator originals as SVG (the four fronts and
the four backs on one artboard each, the finished Choices page with its
tab, the ten-token board and the sheet of star tokens) and said every
part of the book is their own work. TK-1 now takes its measurements
from those files instead of from photographs.

### The page

- **Size.** The book page is 8.82 by 5.82 in, the trimmed size of the
  Choices file, centred on Letter landscape with trim marks (cut 1.09 in
  off the sides and 1.34 in off the top and bottom; a Board with six to
  ten tokens is 7.46 in tall). Setup offers the same page enlarged to
  the full 11 in width (11 by 7.26 in) and "Fill the Letter page".
- **Geometry.** Every rectangle, radius, stroke and baseline is in page
  points from the files, scaled by the page size chosen. Checked by
  measuring the rendered form against the file coordinates: the titles,
  First and Then, the six boxes, the Board boxes, the token slots and
  their captions and dots, the Tokens page's park boxes, corners and
  foot line, and the backs' title band, title and body all land within
  0.02 pt of the files. The earlier build was 1.5 to 5 pt off in places
  (half a stroke measured from the wrong edge; baselines set against a
  stand-in font).
- **Type.** Georgia throughout the book (bold and italic where the files
  use them), the tab letters in School Book where it is installed, then
  Georgia Bold. Underlines come from the font's own metrics, as
  Illustrator draws them. The back titles are letter-spaced .06 em, as
  in the files.
- **Colours.** The files' own: band #698da9, CHOICES tab #acd69b,
  TARGETS #e3c5e8, BOARD #aac4dd (the photographs had made it a darker
  slate), TOKENS #f9e988, First box #f0f1f1, Then box #acd69a, panel
  #f5f5f5. "Colours as the Illustrator files" restores them.
- **Token art.** The default token is the assessor's smiling star,
  taken from the token sheet at its own resolution.
- **QR code.** The "SCAN ME" style copies the code on the assessor's
  Choices page: slate modules, rounded slate finder rings with green
  centres, SCAN ME in a clear square in the middle, error correction
  level H. The finder centres are a deeper green (#6aa55a) than the
  tab, because a pale centre is read as white by decoders. zxing-cpp
  decodes it from the printed page at 300 and 150 dpi; unticking the
  style gives a plain black code (level M). The assessor's own code
  links to https://qrco.de/bchWXG, a short link from a QR service;
  paste it into the QR link field to reuse it.
- **Credit line.** The Token Economy back carries the assessor's line
  from the file, "To find more resources and information visit
  www.Behavior-Charts.com", editable or clearable. The barcode is left
  out. When the instructions need the room, the credit drops to one
  small italic line at the foot rather than pushing the steps off the
  page.

### Fits that hold on paper

Two faults found while matching the files are fixed:

- The title fit compared a zoomed text width with an unzoomed box
  width, so a title could shrink (or fail to) depending on the preview
  zoom and the polish layer's fit-to-window zoom. It now divides the
  zoom out.
- The backs were fitted on the zoomed screen preview, where the same
  text sets a few pixels shorter than on paper; three backs overflowed
  by 3 to 4 px in print. The fit now keeps 3 percent in hand and
  measures the bottom of the text itself. A back that has to continue
  keeps the size it was split at.

All four default backs now fit one page each at 11 pt or more (Choice
Board 11.3, Teaching Targets 12.3, Token Board 11.55, Token Economy
11.05 with the credit on one line).

### The instructions, checked against the literature

The assessor asked that the back texts be checked against peer-reviewed
consensus. The structure, headings and voice are kept; what changed:

- **Token Board.** First-Then is stated as the Premack principle with
  its condition: it works when the THEN item is available only through
  the board (response deprivation, Timberlake and Allison, 1974). Tokens
  are given right after the behavior with brief praise, and the exchange
  is kept immediate while the board is new (Hackenberg, 2018). "Not So
  FAST" now says what to do when a step up fails: go back one step
  (ratio strain).
- **Choice Board.** Choice is described as the evidence has it: learners
  often prefer to choose and choosing has lowered problem behavior
  (Tiger, Hanley and Hernandez, 2006; Dyer, Dunlap and Winterling,
  1990), but choice among items does not make a weak item strong
  (Lerman et al., 1997). The pictures should come from a preference
  assessment and change as preferences change, since freely available
  items lose value. The test of a reinforcer is that the behavior it
  follows increases.
- **Token Economy.** One token exchanges for many backup reinforcers,
  which keeps it valuable when one item has lost its appeal (a
  generalized conditioned reinforcer; Russell, Ingvarsson, Haggar and
  Jessel, 2018). The three conditioning steps (sampling, coaching,
  conditioning) each end with an immediate exchange, and the last
  begins asking for more tokens per exchange. The check that it worked
  is that the behavior earning tokens goes up.
- **Teaching Targets.** A replacement behavior should serve the same
  function as the problem behavior and be easier to do (Horner and Day,
  1991); one target at a time, with an agreed definition so every adult
  gives the token for the same thing.

The Guide lists all ten sources in full: Cooper, Heron and Heward
(2020); Dyer, Dunlap and Winterling (1990); Hackenberg (2018); Horner
and Day (1991); Ivy, Meindl, Overley and Robson (2017); Lerman, Iwata,
Rainville, Adelinis, Crosland and Kogan (1997); Premack (1959); Russell,
Ingvarsson, Haggar and Jessel (2018); Tiger, Hanley and Hernandez
(2006); Timberlake and Allison (1974).

### Tests

`qa/tk1-test.js` (60 checks) now measures the page in points against
the files, checks the 11 in page and Fill the Letter page, the default
credit and its compact form, that the default texts fit their backs,
the framed and plain QR codes module for module, and, where python3
has zxing-cpp (`pip install zxing-cpp`), decodes both codes from the
printed PDF.


### Text sizes on the iPad (v21.42c)

On the iPad the book's text came out about 1.6 times too big: the tab
letters overlapped, the Board title ran into First and Then, the
captions spilled out of the slots, and the backs split onto extra
continuation pages. The boxes were the right size. Safari does not
apply the preview's zoom, or the polish layer's fit-to-screen zoom,
to a font size written as `calc(... * var(--s))`, while Chrome does.
Every font size and line height in TK-1 is now a plain point value,
with the 11 in page and Fill the Letter page given the same sizes
enlarged by 1.2472 (`.pg.big`). Text autosizing is also switched off
on the book (`text-size-adjust: 100%`). In Chrome the printed pages
are pixel for pixel unchanged.

A sheet of one card made from an empty card (an empty Choices or
Targets slot, or "A card made on the spot" with no label and no
picture) used to print thirty blank boxes. It now prints each card
with three write-in lines, like the "Other" card (v21.42c).

### The Preview after a sheet of one card, and the student photo (v21.42d)

- "Print a sheet of this card" switched the print order to that one
  sheet and left it there, so the Preview afterwards showed only the
  sheet of cards. The order now returns to what it was once the sheet
  has printed, and whenever the Preview shows only part of the book a
  "Show the whole book" button sits above it.
- The student's photo was cropped from its exact centre, which in a
  portrait leaves the face high and off centre. Setup now has three
  sliders, left and right, up and down, and size (100 to 300 percent),
  with a small circle showing the result and "Re-centre the photo".
  A new photo starts 35 percent down, where a portrait's face usually
  is. The circle also clips an enlarged photo in Safari.

### Audit of TK-1 over every setting (v21.42e)

`qa/tk1-audit.js` renders the book in print layout over 73 combinations
(both layouts, 3 to 10 tokens, the three page sizes, blank and long
names, long card, rule and caption text, presets, a custom token name,
a long credit, a long QR link, the grey panel and watermark, the how-to
insert, every print order and the spare sheets) and measures every page
for text outside its container, collisions, clipped text and pieces off
the sheet. What it found, now fixed:

- A fixed First or Then picture printed as a dot in the box corner (the
  card was drawn 0 by 0). It now fills the box.
- A Rules-row label that wrapped to three lines lost its first line
  ("Raise my hand" printed as "my hand"); the overflow went upwards
  where the fit could not see it. Labels now fit two lines, shrinking
  to 55 percent.
- The QR code covered a park box on a Tokens page with six or more
  tokens; it now sits beside the right-hand corner token. On the Rules
  row it covered the Earn box; it now sits in the Earn box's corner,
  sized to clear the dot, as in box 6 of the Choices page.
- A long first name ran into both Board photos; the title now keeps
  clear of them.
- Long captions, or a long token name in "Your First ...!", ran out of
  their slots; captions now shrink to fit.
- On "Fill the Letter page" with six or more tokens the Rules row rose
  into the title (its height ignored the second token row).
- A long credit line was cut off with an ellipsis, and a very long one
  pushed the conditioning steps onto a second back. The credit now
  wraps, shrinks to one line when the steps need the room, and the
  body measures the room it takes.

Every view also has no sideways scrolling at iPad widths (768, 1024 and
1366 px) and no script errors.

### Text sizes on the iPad, second fix (v21.42f)

After v21.42c the iPad still showed the book's text about 1.6 times too
big. Two further changes remove every dependence on CSS zoom for text:

- No font shorthand in TK-1 names its typeface through a CSS variable
  any more (`font: 700 11.9pt/1 Georgia, ...` instead of
  `font: 700 11.9pt/1 var(--bk)`). Safari can skip the zoom on the size
  in such a declaration while it zooms the boxes.
- The screen preview no longer uses `zoom` at all: each book is drawn at
  its true size and shrunk to the width of its box with a transform,
  which scales text and boxes together in every browser. The preview is
  also larger than before (it fills its box).

The Preview line now ends with "Form build v21.42f" and a text check.
The check compares a 72 pt line of text with a 1 in box, and should read
1.00. A higher number means the browser is enlarging text, which tells us
what the iPad does. In Chrome the printed pages are pixel for pixel
unchanged.

### Choosing several pictures at once (v21.42g)

Choices and Targets each have a "Choose the six pictures" button. It
opens the picture picker with "Choose several" ticked. Each tap adds a
picture to the picks and shows its number, a second tap takes it out,
and "Put them on the cards" places them on cards 1 to 6 in the order
tapped, each labelled with its own name. A photo uploaded while picking
joins the picks. The picker opened from one card's own Choose button
has the same "Choose several" switch, which fills that card and the
ones after it. Without the switch a tap still sets one card and closes
the picker. The token, photo and background pickers have no switch.

### Printing from the iPad (v21.42h)

A book printed from Safari on the iPad came out at two thirds of its
size, on portrait sheets, with every back split over three pages and
the student's photo as a grey ball. The causes and the fixes:

- Safari ignores a page's request for landscape paper and prints on
  portrait Letter inside its own margins (about 0.5 in, with the address
  and date at the foot, which a page cannot turn off). The print layout
  was 11 in wide, so Safari shrank everything to fit. Setup now has
  **Sheets**: Automatic (the default: portrait with the page turned on
  an iPad or iPhone, landscape on a computer), Landscape sheets, or
  Portrait sheets, page turned. Turned, the form asks for portrait paper
  with 0.5 in margins. Each book page is printed on its side at full
  size inside a frame (6.4 by 9.4 in for the 8.82 in page). Fronts turn
  clockwise and backs the other way, so a long-edge two-sided print puts
  each back the right way up behind its front. The card sheets, the
  token sheet and the sheet of one card are laid out portrait in the
  same area, so the cards keep the size of the boxes. Each frame is
  fully contained (`contain: strict`), so the turned page inside it
  does not make the browser shrink the print. On the 11 in page and
  Fill the Letter page the turned pages are scaled to fit, so use the
  8.82 in page on the iPad.
- The backs split because the earlier screen preview set their text too
  large on the iPad (fixed in v21.42f).
- The photo circle used a mask to clip an enlarged photo, which Safari
  printed as a shaded grey ball. It now uses `clip-path: circle(50%)`.

`qa/tk1-test.js` prints the turned book with a 1 in square beside it and
checks that the square prints at 1 in, on 13 portrait pages.
