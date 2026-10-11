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

**My pictures.** A photo of a real item, taken with the camera on a plain sheet of paper, has its background cut away on the
device and becomes a square picture every visual can use, kept in the browser for every form and every student (v21.62).

**One case file.** `Save case` writes every open form plus the student details
into a single file; `Open case` lists its forms at once and fills each from the file as it is opened (v21.61).
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

**Form TK-1 on an iPad (v21.44).** In v21.43 Form TK-1 grew to 2.4 MB, nearly half of it the walkthrough's
recorded narration, and on newsomebh.com an iPad showed the form with none of its scripts running: the view buttons
stayed on Setup and the workstation said *Not answering*. The file on the website was whole, so what reached the iPad was most likely
not (cut short on the way). The narration is now its own file beside the forms, `nbh-tk1-narration.js` (loaded by the form, packed into the
one-file edition, saved in the offline copy), and TK-1 is 1.2 MB. `tools/pwa-sw.py` refuses any page of 1.9 MB or more.

**Save as video (v21.44).** Under the walkthrough, **Save as video (MP4)** makes a video file of this book's
walkthrough on the device itself, to share with the student's team: 1920 x 1080 (1080p), 30 frames a second, the recorded
narration as its sound, the captions in the picture as the CC button has them, the credit line on every frame. Nothing
is sent anywhere. A page cannot photograph itself (Safari refuses to read back a picture of HTML), so
`tools/forms/TK-1/walk-video.js` paints the stage onto a canvas from the page's own layout, piece by piece (boxes, text,
pictures, the SVG drawings), keeps each moving piece as a picture of its own and paints it again only when something in
it changes; the browser's own encoders (WebCodecs: H.264 and AAC) make the video and its sound, and mp4-muxer
(`tools/vendor/mp4-muxer`, MIT) puts them into one MP4. `tools/forms/TK-1/build.sh` writes both into
`nbh-tk1-video.js` beside the forms (the one-file editions carry it inside). It needs Safari on iPadOS 16.4 or later,
or Chrome or Edge on a computer; elsewhere the button says so. In WebKit (the engine of Safari) the whole 3½-minute
walkthrough took about 7 minutes to make here at 1080p and came out at about 100 MB (the smaller size, about 50 MB, is softer
while things move); an iPad's own video encoder is usually quicker. Keep the page open and the screen on while it works (it asks the screen to stay on). When it is done:
**Share or save…** opens the iPad's share sheet (Save Video puts it in Photos, Save to Files in Files), and
**Download** saves it as a file. The video shows the student's book: share it only through the district's drive or
secure email. `qa/tk1-video-test.js` compares the painted frames with the stage at twelve moments, and frames painted
in sequence with frames painted fresh.

**TK-1's walkthrough and avatar (v21.44).** A new book starts with the practice's own Boy picture from the
library (*Library: Boy (teal shirt)*, now first in *When there is no photo*) in the Board's corners and in the
walkthrough; the drawn avatars are still there to choose, and the drawn boy stands in where the picture library is not
beside the form. A book saved earlier keeps the avatar it was saved with. In full screen on an iPad the walkthrough's
picture is now fitted to the player itself (a form inside the workstation reported a window wider than the screen, and the
picture was cut off on the right); and every frame carries the credit *Created by Joshua Newsome, BCBA* at the bottom
right, in the form and in the video files.

**Not answering, and why (v21.44).** Five seconds after a form is opened without
answering, the workstation now looks into the form's frame and says which it is:
another page in the frame, the file missing from the website (404), the form still
loading (it looks again), the copy on the website not this release's or cut short
(compared byte for byte with `release.json`), a script this browser refuses (each
of the form's scripts is read with the browser's own engine), or the form running
while the browser's messages between it and the workstation do not arrive. In that
last case the workstation hands its messages to the form directly from then on, and
the form works. Tap *Why?* beside *Not answering* for the details and a *Load the
form again* button; a screenshot of that box says what went wrong.

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

### Photos that face each other, several pictures at once (v21.42i)

- **The two Board photos face each other.** Setup has *The two Board
  photos face each other*: Flip the right photo (the default, as in the
  assessor's Brayden board, where the right copy of the photo is
  mirrored), Flip the left photo, or Neither. A student looking to the
  right in the photo faces in from the left corner, so the mirrored
  copy on the right faces back. The Rules-row Board has one photo, at
  the top right, which follows the same setting. Setup shows the pair
  as it will print, beside *Re-centre the photo*. The mirroring is a
  CSS transform on the circle, so the position and size sliders still
  apply (mirrored on the flipped side), and it prints the same from a
  computer and on the iPad's turned pages.
- **Several pictures at once, easier to find.** A blue *Choose all six
  pictures at once* button now sits above the Choices and Targets
  tables (the old button below them is kept). The picker's top line
  has a two-way switch, *One picture* or *Several at once*, in place of
  the small check box. In Several at once each tapped picture shows its
  number, the picks go on the cards in that order from the row the
  picker was opened on, and *Put them on the cards* places them. Once
  Several at once is switched on in the picker it stays on for the
  other rows until it is switched off. Upload a photo takes several
  photos in one go in this mode.
- **Arrows on each row** move a card (its picture and its label) up or
  down the six, so the order on the page can be changed without
  choosing again.
- **Setup names a picture used twice** among the six choices or the six
  targets.
- **Build label.** Setup ends with *This copy of the form: build
  v21.42i*, and the Preview line carries it too, so it is easy to see
  that the file on the website is the new one.
- **Card sheets on the iPad at the 11 in size.** The cards keep the size
  of the boxes, which at the 11 in page and Fill the Letter page is
  2.58 in; three rows of two do not leave room for the Other card on a
  portrait sheet, so the cards now continue on a second sheet ("Card
  sheet: the choices (2 of 2)") instead of running off the first. The
  Preview line now says when the pages print turned on portrait sheets.
- Checks: `qa/tk1-audit.js` now covers 83 settings, among them the
  turned pages at every size (each sheet within Safari's 7.5 by 10 in
  printable area, each page inside its sheet) and the left-flipped
  photos. `qa/tk1-test.js` checks the arrows, the switch, the flip
  (default, left, neither, printed as a mirror), the duplicate notice
  and the build label. axe (WCAG 2.1 AA) is clean on every TK-1 view
  and on the open picker.

## TK-1's terminal token and walkthrough, the TK-1/TE-1 link, TB-1's behavior library, writing help, and the practice's own pictures (v21.43)

What this version adds:

- **Form TK-1**: a last token that looks different from the others (the
  terminal token), and a narrated **Walkthrough** of the book in use, with
  two MP4 copies to share.
- **Forms TK-1 and TE-1**: an optional link. Each form compares itself with
  the other when you ask, and takes only what you tick.
- **Form TB-1**: a library of 207 starting definitions for reduction targets.
- **Every form**: writing help for the text boxes. Apple's Writing Tools,
  an offline wording check, and a rewrite through a relay on newsomebh.com
  that a passcode from the BCBA unlocks.
- **The picture library**: 29 of the practice's own cards and pictures.

It also fixes one fault found along the way: a reopened TK-1 book lost its
last-token picture and its SVG photos.

TK-1 now ends Setup with *This copy of the form: build v21.43*, and the
Preview line says the same. That is the quickest way to see that the copy on
the website is the new one.

### The terminal token (TK-1)

The assessor asked for "a separate terminal token that is slightly different
than the other tokens", so the learner can see which token is the last one
and that the item comes next. Setup, under Tokens, has **The last token (it
fills the board; the item comes next)**:

- **The same as the others**: the default. A book saved before v21.43 opens
  this way and prints as it did.
- **The same picture, with an orange double border.**
- **Its own picture, with an orange double border**: a drawn gold medal by
  default. The trophy, any library picture or a photo can be chosen instead
  under **The last token's picture**.

When the last token is marked:

- the Board's last slot and the last box on the Tokens page get a matching
  orange ring, drawn as an outline so it prints without background graphics;
- the token sheet prints one last token among the others;
- the Token Board back and Step 3 of the how-to insert add one sentence:
  "The last star looks different from the others, so your learner can see
  that it finishes the board and the THEN item comes next." (The book's own
  token name stands in for star.) The sentence comes from `{last}` in those
  two texts. With the option off, `{last}` prints
  nothing. The Backs view now lists `{last}` with the other marks;
- the Setup verdict says that the last token is marked.

`qa/tk1-test.js` checks the three settings, the rings, the token sheet and
the sentence.

### A reopened book keeps its last-token picture and SVG photos (TK-1)

Opening a saved book dropped two things: the last token's own picture, and
any photo uploaded as an SVG. Since v21.42a an uploaded SVG is kept as the
vector it is, but the check made when a file is opened accepted only PNG,
JPEG, WebP and GIF. This applied to Open data, case files and the
workstation's restore. Both now come back. The fault was found while mapping
the TK-1/TE-1 link. `qa/tk1-test.js` saves and reopens a book that has a
trophy as its last token and an SVG photo on a card.

### The walkthrough (TK-1)

The assessor asked for "a step by step walkthrough video explaining each step
and page": a narrator; the learner's hand choosing what to work for; the
teacher's hand choosing the target; the two cards going into their boxes on
the Board; the session; a token at each interval; and the item once all the
tokens are earned. **Walkthrough**, the last button under View, plays this as
a narrated video. It is drawn live from the book itself: its pictures, photo,
colours, token picture and count, and the terminal token when it is on.

The pages lie on a table top. The walkthrough runs about three and a half
minutes (3 min 32 s for the simulated book, or 3 min 37 s with the terminal
token), in seven chapters:

1. **The book.** Four laminated pages, bound on the left, with a tab for
   each.
2. **Choices.** The learner's hand (a child's) looks over the six choice
   cards and picks one, which lifts off the page. It picks the first card
   that has a picture.
3. **Targets.** The teacher's hand (an adult's, with a shirt cuff) picks the
   target card. It picks the first target that names an ongoing behavior (a
   word ending in -ing, which suits an interval), or else the first card.
4. **Board.** The target goes under First and the chosen item under Then.
   The Tokens page shows where the tokens wait.
5. **Session.** First the rule: the example is one token for every two
   minutes. The session starts, and a ring counts down each interval (sped
   up, and labelled so). At the end of an interval the teacher's hand takes a
   token from the Tokens page and puts it in the next slot. A speech bubble
   gives brief praise that names the behavior ("Great writing!"). One
   interval without the behavior earns no token, and the interval starts
   again. The last token is the terminal token when the book has one, and the
   narration says why it looks different; otherwise the narration uses the
   plain last-token line.
6. **Exchange.** The board is full, so the Then card goes to the learner at
   once. Then the tokens return to the Tokens page, the cards return to their
   pages, and the learner chooses again.
7. **Tips.** Make the tokens valuable first: give one and trade it for the
   item at once, again and again. Start with a small requirement and raise it
   slowly, and go back a step if the behavior falls apart. Keep the item
   available only through the board.

The narration names no person and gives no number that depends on the book,
so one recording fits every book. The captions show exactly what is said, and
*Transcript of the narration* under the player has every line. What it says
agrees with the book's backs and with the token-economy sources in the Guide:

- the token comes right after the target behavior, or at the end of the
  interval in which it happened, with brief praise that names it;
- the exchange is immediate while the board is new;
- tokens are made valuable first;
- the requirement starts small and is raised gradually;
- the item is available only through the board;
- the learner chooses before the task.

A note under the player says when the walkthrough differs from the book:

- a book that uses the Rules row is shown as First-Then;
- empty Choices or Targets are shown with the simulated book's cards;
- a missing picture library or a missing recorded narration is named.

**The controls.** Each control is a large touch target with a name for
screen readers:

- Play and Pause: the big button on the picture, the button under it, or the
  Space key;
- Restart;
- the seek bar: drag it or tap it; the arrow keys skip five seconds;
- the time played and the total time;
- **CC**, the captions, which are on at the start;
- **Sound**;
- **Full screen**;
- the chapter buttons, with the current chapter marked.

The walkthrough pauses when you leave the view, open another form in the
workstation, or switch tabs. When you come back, it is rebuilt from the book
as the book is then. With *Reduce Motion* on, each step cuts straight to its
end instead of moving, and the narration still plays. The walkthrough never
prints and adds nothing to the saved file. TK-1's printed pages are
unchanged.

**On the iPad:**

- Safari plays sound only from a tap, so the first tap on Play starts the
  narration.
- The page asks Safari to play the narration as media (the audio session
  setting Safari has had since iPadOS 17). This is meant to keep the silent
  switch or silent mode from muting it. The volume buttons set the level. If
  nothing is heard, check the volume, and check that Sound is on under the
  picture.
- A call, Siri, an alarm or another app that takes the sound pauses the
  walkthrough, with "The sound was interrupted. Tap Play to go on."
- The screen stays on while it plays, where Safari allows it.
- If the recorded narration cannot play, the device's own voice reads the
  captions.
- Full screen fills the iPad's screen. Where a browser has no full screen
  for a page (an iPhone), the player fills the window instead. Esc, or the
  button, returns.

This was tested in Chromium. It has not yet been tried on an iPad.

**The MP4 files.** The release folder has two copies of the walkthrough as
video, for staff and parents who will not open the form:

- `TK-1-Walkthrough.mp4`: the plain last token, 3 min 32 s;
- `TK-1-Walkthrough_terminal-token.mp4`: the terminal token as its own
  picture (the gold medal), 3 min 37 s.

Both show the simulated book: Sam, five stars, and the practice's own cards.
Each is 1920 × 1080 at 30 frames a second, in H.264 with the captions drawn
in. The narration is AAC sound at -16 LUFS, and the seven chapters are
chapter marks. Each file is about 23 MB.

To make them again, start the test server (`http-server . -p 8123 -s -c-1`
from the repository root), then run:

    node qa/tk1-walk-video.js --both --dir <folder>

That writes both videos. To make one: `--term none|ring|pic`, `--n 3` to
`10` and `--out file.mp4`. `--check` checks a video already made against the
book's timeline without drawing it again.

The recorder draws every frame with the form's own `TKWALK.renderAt` in
Chromium and encodes it with ffmpeg, so the video and the form show the same
frames. It needs:

- a Python with numpy, soundfile and imageio-ffmpeg (`TK1_PY`; by default the
  narration voice's own venv);
- for the narration at full bandwidth, the voice folder (`TK1_TTS`). Each
  line is voiced again, and used only when it is the very same take as the
  form's clip. With `--no-tts`, the form's own 32 kbit/s clips are used.

The recorder checks the result: length, size, frame rate and frame count,
colour tags, every line's sound starting at its cue with no shift, loudness,
the chapters, and that a frame drawn twice comes out the same. It also saves
frames at five cue midpoints and a contact sheet to look at. Make the videos
again after any change to the walkthrough, its narration or its hands.

**The narration voice.** The voice is Kokoro-82M with its af_heart voice, at
speed 0.88. It is licensed Apache-2.0 and is run offline with kokoro-onnx by
`tools/forms/TK-1/make-narration.py`, from the text in
`tools/forms/TK-1/walk-script.json`. Nothing is sent anywhere, and no account
is needed.

Each of the 18 lines is a mono MP3 (24 kHz, 32 kbit/s) inside
`walk-audio.js`, with its text and its length, so the form plays it with no
network access. Each line is brought to -16 LUFS, the usual level for speech
on phones and tablets. This is done with a gain and a limiter at -1.5 dBFS
whose look-ahead delay is compensated. In this version the narration became
about 6 dB louder (it was -23 LUFS), and no word moved in time.

To change a line:

1. Edit its text in `walk-script.json`.
2. Set up the voice once, as the script's header describes: two npm packages
   for the model and the voices, and a Python venv with kokoro-onnx,
   imageio-ffmpeg and soundfile.
3. Run `TK1_TTS=<voice folder> <voice folder>/venv/bin/python tools/forms/TK-1/make-narration.py`.
   Lines whose text, voice and speed are unchanged keep their audio. To voice
   only some lines, name their ids.
4. Rebuild TK-1 with `sh tools/forms/TK-1/build.sh`.
5. Make the videos again.

The walkthrough takes each line's length from `walk-audio.js`, so a longer
line lengthens its step. The captions and actions follow each word as it was
measured in the current recordings. A line whose text has changed falls back
to an even share of its characters.

**The hands.** The six hand drawings (the learner's and the teacher's:
pointing, pinching and open) were redrawn to look more lifelike: the back of
a right hand seen from above, with soft shading. The learner's is a child's
hand, and the teacher's an adult's with a shirt cuff. The touch points are
unchanged, so every touch still lands on its card.

**Checked.** `qa/tk1-walk-test.js` (165 checks) covers:

- the timeline, with its cues in order and the terminal or the plain line as
  the book has it;
- the cards on their boxes, in First and Then;
- the tokens in their slots, and the slots empty after the reset;
- `renderAt`, a pure function of time;
- each line's action happening while that line plays, with no lines
  overlapping;
- the book and its print, unchanged;
- pausing when you leave the view;
- reduced motion;
- named controls;
- no sideways scrolling on the iPad or on a phone.

The walkthrough was also reviewed for its clinical content, its motion, its
use on iOS, and accessibility and regressions, and what those reviews found
was fixed. `qa/tk1-test.js` and `qa/tk1-audit.js` still pass.

### TK-1's sample book shows the practice's own cards

The simulated book now uses the practice's own cards from the library. So do
the walkthrough's sample pictures, which it shows for a book whose Choices or
Targets are still empty:

- choices: Color, Ball, Playground, Break, YouTube and iPad (the photo);
- targets: Writing, Reading, All Done, Raise hand, Math and Waiting.

In the walkthrough the learner picks Color and the teacher Writing ("Great
writing!"). The narration names no item, so it did not change. The MP4 files
show the same cards. TK-1's Guide says so under About the Simulator.

### From the case keeps problem behaviors off Targets (TK-1)

**From the case** could put a problem behavior or a reduction goal on the
Targets page, as if it were something to teach. Now:

- a problem behavior goes on only as its named replacement behavior from
  TB-1;
- a reduction goal never goes on;
- the note says what was left out and why.

The walkthrough's clinical review found this. `qa/tk1-test.js` checks it.

### The TK-1/TE-1 link

TE-1 designs the token economy (the behavior, the schedules, the backups).
TK-1 prints the book the student holds. Until now the two were filled in
separately. The link lets each form compare itself with the other and take
what you choose. Nothing is ever written without a click.

- **Off by default.** An unlinked form saves, prints and counts its fields as
  before. TE-1 has one hidden field more, which holds the link record; its
  progress dots are unchanged.
- **Turning it on.** On TK-1, press **Link with Form TE-1** in the Setup band
  *Link with Form TE-1 (the token economy plan)*. On TE-1, press **Link with
  Form TK-1** under *Student materials* on Setup. Linking is per form: it
  never turns itself on in the other form.
- **Compare on a click.**
  - In the workstation, **Compare with Form TE-1** reads the TE-1 open in the
    same workstation. Nothing is written there.
  - **Open Form TE-1 beside this book** opens it as a column beside this one
    (on a phone, in its place) and then compares.
  - With a form on its own, **Open a file Form TE-1 saved** reads that form's
    own saved file, a case file (.json) or a `.case.html`. The panel explains
    how: Save data on the other form, then open the file here.
  - The forms say "compared", never "synced": a later change on one form
    shows on the other only at the next compare.
- **What is compared.**
  - A target card with the behavior the tokens are earned for.
  - The token count with tokens per exchange.
  - The token with the token form.
  - The Choices with the backup menu.
  - The Token Economy back's schedule paragraph with TE-1's schedule.
  - Lines for information only: token loss, the price, the thinning record,
    and whether the marked last token matches the plan's count.
- **Take what you tick.**
  - Each row has **Take** and **Keep**; a pressed button shows a tick.
  - **Take the ticked items** applies them. **Leave everything as it is**
    closes the table and writes nothing.
  - TE-1 is the plan of record. So in TK-1 the plan's count, backups and
    schedule come ticked where they fill an empty place, or where they have
    changed on the plan.
  - The schedule paragraph is unticked the first time, since it changes the
    printed back; the row says beforehand whether that back then runs on to a
    second page.
  - The plan's behavior goes on a target card only when you tick it, and the
    card keeps its picture.
  - In TE-1 only the student's name and ID and the token form come ticked,
    and only where that field is empty. The book's choice cards come in as
    new backups only when you tick them.
- **Nothing deleted.** No card, backup row or field is emptied on either
  side. A change of count rewrites edited captions only after asking. A
  backup that RA-1 found not to be a reinforcer is never offered. Class,
  cost and preference stay on TE-1, and TE-1's audit items are never ticked.
- **Behaviors to reduce.** A behavior to reduce is never offered as the
  earning behavior, in either form. That means one of TB-1's or FS-1's problem
  behaviors in the case, one noted at an earlier compare, or a common word
  for one, such as aggression or elopement, unless it is negated, as in
  "instead of hitting". With a form on its own and no case, the row says
  that it cannot check TB-1.
- **The identity check.** The student's name and ID are compared first. If
  they differ, the panel asks "for another student?". Nothing can be taken
  until **These are the same student** is pressed.
- **Undo.** **Undo what was just taken** puts the form back exactly as it was
  before. It is withdrawn, and says so, as soon as anything else on the form
  changes. It is never saved.
- **Reprinting.** After a take, TK-1's panel names the pages to reprint (for
  example "the Board page (both sides)") until **These pages are reprinted**
  is pressed.
- **The record.** The link is one short text in the form's own saved data
  (1,800 characters at most). It travels with Save data, case files,
  snapshots and autosave, and an older build that opens the file keeps it.
  **Unlink** removes it after asking; nothing else on either form changes.
  While linked, TE-1 prints one line about the book.
- **The workstation.** One new message lets TK-1 or TE-1 open the other
  beside itself. It works only for that pair, and is ignored within a second
  of the last one or while a case is loading. The case flow is unchanged:
  From the case still fills TK-1's empty Targets and Choices first. The case
  map's *What carries forward* box has a line for the pair.

Checked by:

- `qa/link-core-test.js` (95 checks, the shared core in
  `tools/blocks/nbh-link.js`, which both forms carry byte for byte);
- `qa/link-te1-test.js` (127);
- `qa/link-tk1-test.js` (181);
- `qa/link-shell-test.js` (40).

The checks include: spoofed answers from other frames ignored; files that are
not the partner's refused, with nothing changed; Undo restoring the form
exactly; no sideways scrolling at 390 px. An unlinked TK-1 and an unlinked TE-1
save and print as before. Two reviews made 60 findings in all: 52 were fixed
in full and 5 in part, and the other 3 were process points or needed no
change.

`tools/blocks/patch-link.py` puts the core into TE-1, and TK-1's `build.sh`
puts it into TK-1. Re-run both after any change to `nbh-link.js`.

### TB-1's behavior library

The assessor asked for "a drop down ... with as many reduction target
behaviors that you can think of and various operational/functional
definitions that I can either pick or use as a starting point and edit".
Sheet 4 (Definitions) now has 207 starting definitions in 14 categories:

| Category | Entries |
|---|---|
| Aggression toward others | 20 |
| Verbal aggression and threats | 7 |
| Self-injurious behavior | 36 |
| Property destruction | 14 |
| Elopement and safety | 17 |
| Tantrums and vocal disruption | 8 |
| Noncompliance and task avoidance | 12 |
| Classroom disruption | 11 |
| Peer and social behavior | 10 |
| Stereotypy and repetitive behavior | 18 |
| Feeding and health-related | 18 |
| Body, privacy and hygiene | 17 |
| Home and sleep | 6 |
| Precursors | 13 |

There are 16 clusters, 178 single topographies and 13 precursors. Nineteen
entries also have a functional (outcome-defined) version, for behaviors
whose outcome is legitimately the target, such as elopement, property
destruction and task refusal. Each functional version has its own measure,
examples and boundaries.

**How to use it:**

- **On a card.** At the top of each target card, under **Start from the
  behavior library**, search or pick from the category list, then press
  **Load into this card**.
  - The search reads names, other names and categories. It also finds the
    other forms of a word (bite, biting) and words written together or apart
    (headbanging, head banging).
  - Where an entry has a functional version, choose Topographical or
    Functional first.
- **In the panel.** Open **Behavior library (207 starting definitions)**
  above the cards. Search, or filter by category, and tap an entry to read it
  in full. Then press **Load into target n**, or **Add a target card and
  load**. A card's **Read the full entry** opens the panel at its entry, with
  **Back to target n**.
- **On sheet 2.** On Select & prioritize, **Add a candidate from the behavior
  library** puts a label in the first empty candidate row.
- **What a load fills.** Only the definition fields: the label, type, style,
  dimension, counting unit, member topographies, definition, examples,
  non-examples, onset, offset, borderline cases and exclusions. It never
  touches the function, urgency, cluster, context, replacement or social
  validity.
  - If any of those fields already hold text, it asks first: **Cancel**,
    **Fill empty fields only**, or **Replace**.
  - Afterwards the card says "Loaded from the library: ... Edit it to fit
    this learner", with the entry's clinical note, which shows on screen
    only. It offers **Undo the load**, until a loaded field is edited, and
    **Hide this note**.

**The rules every entry follows** are the form's own, from the Guide's
sections 2 and 3:

- Objective, clear and complete (Hawkins & Dobes, 1977). An observer who has
  never met the learner could score it.
- It names the body part, the action, the target, and a threshold where the
  form alone is ambiguous: audible from 1 m for contact, a mark left, the
  object displaced, or the 15.24-cm launch distance of Bann and Morris
  (2026), named in the borderline field where it is used.
- No function, intent, feeling or diagnosis in a definition.
- Onset and offset that can be seen, and the episode rule in the counting
  unit.
- Examples that include subtle and severe forms, and non-examples that are
  the near misses an observer would otherwise score.
- A measure that fits:
  - a count for brief, discrete acts;
  - duration or partial-interval recording for long episodes;
  - latency or percent of opportunities for noncompliance.
- "The learner", "an adult" and "a peer", so an entry fits school and home.
- Clusters list their members and carry the clustering rule: the same
  urgency, function, dimension and consequence, and comparable rates.
- Notes on safety and on medical or specialist evaluation, and on
  safeguarding where it applies: self-injury (with Form IM-1), pica,
  rumination, feeding, fecal smearing, and sexual behavior.
- Stereotypy is targeted only when it causes harm or interferes with
  learning, safety or access, never because it looks unusual.
- One act, two targets: an act two entries describe is scored once, under
  the entry named. An act that is also a separate safety event (traffic,
  water, an opened exit) is scored on both.

**Starting points, to edit.** Every entry is a starting point, as the panel
and the Guide say. Fit it to the learner: the setting, the thresholds and the
episode rule. Replace its examples and non-examples with the learner's own,
write the team's decisions into the borderline field, keep one distance
across a learner's targets, and pilot agreement before baseline.

**Saving and printing.** The library's own controls are drawn outside the
form's fields, so they are not saved, not counted in the progress dots, and
never mark work as unsaved. What a load writes is ordinary field text: it
saves, prints and flows to the case like typed text.

Six one-line fields now grow with their text, so long library text shows and
prints in full: exclusions, onset, offset, counting unit, replacement and
social validity. The field names are unchanged, so older files open as
before.

The References sheet adds the seven works the clinical notes cite. The
library is about 840 KB of TB-1's file.

**Where it comes from.** The source is
`tools/blocks/tb1-behavior-library.json`.
`tools/blocks/patch-tb1-library.py` puts it into TB-1. It refuses a library
that is malformed, that has a duplicate id or a missing field, or that has a
value outside the form's own lists. Run it again after editing the JSON.

**Checked.**

- The library was written in batches and merged. A check covers required
  fields, the fixed vocabularies, at least three examples and three
  non-examples, definition length, inferential words, units, and citations
  from an allowed list.
- An audit read every entry against the spec and the Guide: 46 entries
  changed and 5 added.
- `qa/tb1-library-test.js` (136 checks).
- A review made 25 findings, and 24 were fixed. The file size was left:
  cutting it would mean removing clinical notes the spec requires.
- `qa/all-forms-shell.js` and `qa/case-test.js` are unchanged.

### Writing help in every form

The assessor asked for all three ways of improving what staff write, with
the API key kept on newsomebh.com and the third unlocked for a session by a
one-time passcode the BCBA makes.

**1. Apple's Writing Tools.** These already work in every text box on an iPad
with Apple Intelligence: select the text, then Proofread, Rewrite,
Professional or Concise. The panel and the Guides only explain them.

**2. Check wording.** Each narrative text box (the few left out are listed
below) shows an **Improve wording** button at its corner while you are in it
and whenever it holds text. From a keyboard, Alt+Enter in the box opens the
same panel (Option+Return on a Mac or iPad). The panel shows the box's text,
or only the part you selected.

Check wording runs on the device and sends nothing. It marks words that:

- name a feeling;
- guess at intent or function;
- infer a diagnosis;
- label the behavior;
- judge the person;
- leave a count, a time or an intensity vague.

It says why, and suggests observable wording. There are 98 rules in
`tools/blocks/nbh-wording-rules.json`. Where a rule has a direct
replacement, **Apply** changes the panel's text. Repeats are grouped ("Take
out all 3"). Words in quotation marks are the speaker's own and are left
alone. **Use this text** writes the panel's text back into the box, as if it
had been typed. **Cancel** leaves the box as it was.

**3. Rewrite with Claude.** This rewrites the text in one of four styles:
*Objective and observable*, *Concise*, *Report-ready*, or *Fix spelling and
grammar only*. It goes through a small relay on the practice's own website,
which holds the Anthropic API key, so the key is never in the forms.

- **Unlocking.** A tab is unlocked with a single-use passcode from the BCBA.
  The session lasts until its time is up (8 hours) or the tab is closed,
  whichever comes first. In the workstation, every form in that tab shares
  it. It is never saved in a form or a file. **Lock** ends it at once, on the
  relay too, so a tab that carries it (one this tab opened, or one the
  browser restored) cannot use it either; press it when you finish on a
  shared iPad. If the relay cannot be reached just then, the panel says that
  only this tab is locked and until when the session still runs elsewhere.
- **The privacy step.** Before anything is sent, the panel replaces names
  with placeholders, then shows exactly what will be sent:
  - the learner's name (whole, first, last, and each half of a double
    surname) and ID, from the form or the workstation's packet, become
    [Student] and [ID];
  - a parent's surname after a title, or before "family", becomes [Family
    name];
  - names added under **Also hide** become [Name 1], [Name 2] and so on;
  - email addresses, telephone numbers, full dates (a date of birth among
    them), street addresses and numbers of six digits or more (a Medicaid or
    case number) become [Email], [Phone], [Date], [Address] and [Number],
    numbered ([Date 1], [Date 2]) when a kind comes more than once. Times and
    counts are left as they are.

  It also points out what may still be a name: capitalized words, the
  learner's initials (J.A.R. as well as JAR), the people the form itself
  names (its school and BCBA too), and short dates such as "on 10/12". Next
  to **Send**, *Not hidden yet* lists those still in the text. The note above
  the preview says what is replaced, that nothing else is, and that
  de-identified is not anonymous.
- **The answer.** It appears beside the original, with the names put back on
  the device. Choose **Use this**, **Use and keep editing**, or **Keep
  mine**. If the service is offline, the session has ended, a limit is
  reached or the relay is down, the panel says so plainly, and nothing typed
  is lost.
- **Where it works.** Only in the forms opened from newsomebh.com (or
  www.newsomebh.com) over https. Both editions use the same relay. In a copy
  opened from a file (the folder on a computer, or the one-file editions) the
  panel says so up front, and Check wording and Writing Tools still work.

**The relay on newsomebh.com/ai.** It is PHP for the GoDaddy cPanel hosting
the forms already use, and it is uploaded once as `nbh-relay-upload.zip`,
which comes with the release. Extracted in the home folder (the folder that
holds `public_html`), it makes two folders:

- `public_html/ai/` (`index.php` and `.htaccess`): the address
  https://newsomebh.com/ai/;
- `nbh-relay/`, beside `public_html`, not inside it, so nothing in it can be
  downloaded from the website. It holds the program, the official Anthropic
  PHP SDK, and its README. The settings file `config.php` and the `data`
  folder are made on the server.

It needs PHP 8.1 or newer. A newer zip, extracted the same way, replaces the
program and keeps the settings and the data.

**The admin page** is https://newsomebh.com/ai/admin.

- The first visit makes `config.php`, with a long random secret already in
  it, and shows a checklist. Paste the API key into `config.php`, then choose
  the admin password on the page and paste the line it makes into
  `config.php`.
- From then on the page asks for the admin password to sign in, and signs
  you out after 30 minutes without use. Each browser tab signs in on its own:
  a second tab, or the page opened again later, asks for the password again.
  (The page's security token is kept in that tab only, never written into the
  page, so a script on another page of the website cannot read it.)
- **New passcode** makes a passcode, such as `7KQ-M4P-2XD-V9H`. It is shown
  once, with an optional label that only the BCBA sees, and it must be used
  within 24 hours unless you choose another time (7 days at most). It asks
  for the admin password again when that was last typed more than 10 minutes
  ago.
- Unused passcodes are listed, and **Revoke** cancels one. Open sessions are
  listed with their label, their end and the rewrites they used. **End** stops
  one, and **End all sessions** stops all of them.

**Limits.** Each is a setting in `config.php`:

- a session makes up to 300 rewrites, at most 10 a minute, of up to 4,000
  characters each;
- everyone together makes at most 300 rewrites in any 24 hours;
- after 10 wrong passcodes from one internet address in 15 minutes, that
  address waits, and after 2,000 from everywhere, everyone waits. **Clear the
  wrong tries** lifts the pause;
- after 5 wrong admin passwords from one address, that address waits, and
  after 20 from everywhere, so does everyone else. Devices that have signed in
  before are not held up.

**Costs.** The API is paid for by use. At the list price when this was
written ($4 per million input tokens and $20 per million output tokens), a
rewrite costs about 1 to 6 US cents: a paragraph near the low end, a full
4,000-character text near the high end. The most one rewrite can cost is
about 21 cents, so the worst possible day under the relay's limits is about
$64. Set a monthly spend limit in the Anthropic Console as well: it is what
keeps a month safe.

**What is sent and kept.** Only the text in the preview and the chosen style
are sent, with the relay's fixed instructions. The relay stores and logs no
text. Its database holds the passcodes and sessions (as hashes), their
labels and counts, and the counters for the limits. Its log records events
and error codes, never text, passcodes or keys.

De-identified is not anonymous: an unusual event, a place or a date can still
point to a child, so leave such details out and read the preview before
**Send**. Before staff use Rewrite with Claude for real cases, get the
district's or agency's approval for sending de-identified clinical text to
an outside AI service, and follow the rules that apply (FERPA or HIPAA
among them). If those rules call for an agreement with every service that
handles such text, arrange it with Anthropic first. How Anthropic handles API
data is set by Anthropic's own terms; the README points to them.

`tools/relay/README.md` has the steps, written for cPanel. It also travels in
the zip as `nbh-relay/README.md`. It covers:

- setting PHP 8.1;
- uploading and extracting the zip;
- the API key;
- the admin password;
- the spend limit;
- making and trying a passcode;
- keeping browsers on https;
- backups and updates;
- what to do when something does not work.

The forms already carry the relay's address, `https://newsomebh.com/ai`, in
`tools/blocks/nbh-wording-config.json`, so nothing has to be rebuilt once the
relay is set up. Until then, Rewrite with Claude says that the service is not
reachable or not set up yet. It finds this out by asking `/ai/api/health`,
which sends nothing.

**In the forms.** All 44 forms carry the writing help once:
`<script id="nbh-wording">`, about 240 KB, holding the rules, the address and
the client, between the form's markup and its own script. It is put in by
`tools/blocks/patch-wording.py`, and in a rebuilt parts form by
`tools/apply-polish.py`. See `tools/README.md`.

The button goes only on narrative boxes. These get none:

- hidden boxes;
- boxes in the toolbar or in a dialog;
- paste boxes with spelling check turned off;
- the learner's particulars;
- boxes that keep someone else's words as they were said or written, so
  that nothing rewords them: IN-1's interview answers, IA-1's FAST open
  answers, SV-1's open answers, SI-1's answers in the student's words and
  *What the student said about the plan*, RR-1's quoted present levels,
  diagnoses, parent information and goals, and CT-1's *What the family said
  in their own words*;
- TK-1's backs, how-to steps and credit line: instructions in the
  assessor's words, with the book's marks in them.

Nothing the button or the panel draws is a form field: it all lives in one
element at the end of the page. So the saved files, the workstation's
snapshots, the packet print and the progress dots are exactly what they
were. Typing in the panel never reaches a form's own shortcuts: OB-1's Live
Recorder does not count it. Esc closes only the panel.

Every form with a Guide and a multi-line box has a short **Writing help**
note in its Guide, on screen only. That is 40 forms: not DD-1 and SP-1, which
have no Guide, and not VS-1 and IM-1, which have no multi-line box. Some
notes add a line for their form:

- TB-1: in a definition, the behavior's own name belongs there;
- IN-1, IA-1, CT-1, SI-1, SV-1 and RR-1: which of their boxes keep a
  respondent's, the student's or a record's own words and so have no button;
  elsewhere (CF-1 too), a respondent's own words go in quotation marks,
  which Check wording leaves alone;
- PD-1, ST-1 and TI-1: the text is about a staff member, so add their name
  under Also hide;
- FS-1 and EB-1: what Report-ready and Concise do for a report and a brief;
- OB-1: typing in the panel is never counted by the Live Recorder;
- TK-1: its backs, how-to steps and credit line are instructions with the
  book's marks in them, so they have no button; Writing Tools can still
  proofread them, and the note says which marks to check afterwards.

**Checked.**

- The relay's suite (`tools/relay/tests/run.sh`, offline, against a local
  stand-in for the API):
  - every PHP file linted (24);
  - `relay-test.php` (394 checks);
  - `contract-test.js` (95), which runs the panel's own functions on every
    recorded answer;
  - `admin-browser-test.js` (39), the admin page at 390, 820 and 1180 px;
  - `php81-test.php` (22), under PHP 8.1.
- A real Apache 2.4.58 with mod_php answered all 12 checks, both with
  mod_rewrite and without.
- `qa/wording-rules-test.js`: precision and recall of 100% on 163 samples,
  and no finding on 78 that must not fire.
- `qa/wording-client-test.js`: 227 checks, with axe.
- `qa/wording-rollout-test.js` compares all 44 forms with the copies before
  the writing help: load, buttons, save, snapshot, print, and 390 px.
- A review made 30 findings: 24 were dealt with in full, 5 in part, and 1
  was rejected.

Not yet tried on an iPad, or on the GoDaddy server itself.

### The practice's own cards and pictures in the picture library

The shared picture library (`nbh-pictos.js`, used by SM-1, VS-1 and TK-1)
grows from 227 to 256 pictures. The 29 new ones are the practice's own cards
and pictures, taken from its own files. Each sits beside the drawn picture of
the same name, or the nearest one (Chips beside Crackers, Books beside
Story), in its category:

- **Activities and rewards:** Bike, Playground, Color (crayons), Ball,
  Books (two), Puzzle, iPad (the card, and the photo with YouTube on its
  screen), Bubbles, Cars, Sports, and the YouTube logo.
- **School:** Math (vector), School Bus, Writing (the card, and two pictures
  of boys writing at a desk), Reading.
- **Expectations:** Clean Up, All Done, Raise hand (the boy at his desk,
  vector), and Waiting twice:
  - the word card, which TK-1 prints as its label alone, so the word does
    not print twice;
  - the Time Timer card.
- **Needs:** Break.
- **Food and drink:** Chips, Fruit.
- **People:** two Boy pictures, a face with curly hair and a boy cropped at
  the shoulders in a teal shirt.

**In TK-1.** Under **When there is no photo**, TK-1 offers both Boy pictures
as avatars, **Library: Boy (curly hair)** and **Library: Boy (teal shirt)**.
Either fills both Board photo circles, mirrored as the facing setting says.

**Credits.** The library's credit line names the practice's own pictures and
the trademarks: the YouTube logo (Google LLC), iPad (Apple Inc.) and Time
Timer (Time Timer LLC). The credit lines in TK-1, VS-1 and SM-1, which said
every picture was OpenMoji, now say the same. In VS-1 and SM-1 the sentence
prints, so the pages that carry it differ by that sentence; the page counts
are unchanged. For the same reason `qa/wording-rollout-test.js`, which compares
each form's print with the copy from before the writing help, now reports
SM-1 and VS-1 as different: that sentence is the only difference.

**`tools/pictos/import-cards.py`** brings a card file into the library:

    python3 tools/pictos/import-cards.py CARD KEY "LABEL" CATEGORY AFTER_KEY [...]

CARD is an Illustrator card saved as SVG, or a plain picture (.png, .webp,
.jpg).

- The frame (a card-sized rounded rectangle) and the Georgia label are left
  out, since TK-1 prints the label above the picture itself.
- An embedded raster picture is rendered with its transparency, trimmed,
  scaled to 600 pixels on its long side (about 300 dpi on a 2-inch card
  picture) and kept as WebP.
- A vector picture stays vector. Its classes become presentation attributes,
  and each font list gets a generic fallback.
- A picture drawn with gradients, clipping paths, masks or patterns is
  rendered, since those need ids and the library refuses ids.
- A card saved as one picture, with the frame and label drawn in, is cut out
  of its frame below the label. Its white surround is made clear softly, so
  its shadows still fall over a coloured tile. Pale parts that begin with a
  clear edge (a page, the timer's face) stay as they are.

It writes `tools/pictos/custom/KEY.svg` and the entry in
`tools/pictos/pictos.json`. Then the library is built again:

    python3 tools/pictos/build-pictos.py <OpenMoji package folder> tools/pictos/nbh-pictos.js
    cp tools/pictos/nbh-pictos.js NBH-Workstation/nbh-pictos.js

Rendering uses the Playwright Chromium the `qa/` checks use, and WebP comes
from Pillow. Unchanged pictures import again byte for byte.
`build-pictos.py` now takes a picture from a file of its own. It refuses
styles, classes, ids, scripts and links, apart from an embedded PNG, JPEG or
WebP picture.

**Upload `nbh-pictos.js` with the forms.** It is now about 1.7 MB (it was
about 650 KB). SM-1, VS-1 and TK-1 load it from beside them. An older copy
left on the website lacks the new pictures, so cards that use them show and
print without a picture. The one-file editions carry it inside.

Checked by `qa/tk1-test.js`: the new pictures print under their labels; both
Boy pictures fill the Board circles; the simulated book's twelve cards. VS-1
and SM-1 load the new pictures, and all 44 forms pass the shell check.

### The Guides

- TK-1's Guide now covers:
  - the terminal token, under Making the Book;
  - the iPad sound, in the Walkthrough paragraph;
  - the practice's sample cards, under About the Simulator;
  - writing help;
  - the corrected picture credit.
- TK-1's Backs view lists `{last}` and `{n}th` with the other marks.
- The Guide notes on writing help in CN-1, DA-1, GC-1, HD-1, SA-1, SI-1, SM-1
  and SR-1 had been put into the built files only. They are now in the parts
  (`tools/forms/<ID>/body.html`) too, so a rebuild from the parts gives the
  shipped file again. All eleven parts forms were rebuilt and checked: CN-1,
  DA-1, GC-1, HD-1, IM-1, SA-1, SI-1 and SR-1 came out byte for byte the same,
  and SM-1, VS-1 and TK-1 changed only by the text described here.
- ABC-1's note, beside its narrative box, now also says to press Lock on a
  shared iPad.
- TE-1's paragraph on the link now says that the token form also comes ticked
  when the plan has no count yet, as the form does.

Every form was printed blank and with its simulation, before and after these
Guide changes. All of them print the same, except SM-1 and VS-1, whose
credit sentence changed.

### Changed after the last review

A review of the whole release, on an iPad's sizes as well as a computer's,
found the faults below. Each is fixed, or the reason it is not is given.

**TK-1**

- The **Walkthrough** fits an iPad held sideways inside the workstation.
  The picture is scaled to the room left under the form's toolbar and the
  workstation's own bar, so the picture, the controls and the chapters are
  on screen together (at 1180 × 820 the whole player now fits in the 608 px
  the form gets; it was 709 px tall, and only 449 px of the form showed under
  its toolbar). Held upright, nothing changed.
- The **View** row keeps its eight buttons on one line; Walkthrough no
  longer wraps alone onto a second row.
- **From the case**: the replacement behaviors that come from TB-1 and GB-1
  arrive as short card labels. Notes in brackets ("(see target 2)",
  "(replacement)") are dropped, a long text is cut at a word, and texts that
  name the same replacement behavior become one card. The note says how
  many were the same.
- A **word card** (such as the practice's Waiting card) shows its word
  large, in the middle of the card, instead of a heading over an empty
  picture area.
- The **Choices** and **Targets** dots count a card with a picture or a label
  as filled, out of six, so they no longer flicker between green and amber
  while nothing changes.
- The **Preview** line leaves out its text check while the book is not drawn
  on the screen (an iPad showed "Text check 89.01" there).
- The instruction **Backs**, the how-to steps and the credit line have no
  Improve wording button: they are instructions in the assessor's words,
  with {n}, {token} and {last} marks in them, which a rewrite could break.
  The Guide says so.
- A saved file, case or safety copy whose photo names are not plain letters,
  digits, dashes or underscores has those photos left out when it opens,
  and photo names are escaped in the picker, so a file made elsewhere cannot
  put markup into the page.
- The narration is evened out at the -16 LUFS it was meant to have: every
  clip measures -16.0 to -16.2 LUFS (they were -16.7 to -17.0). The words and
  the timings are the same.

**TB-1**

- **Fill empty fields only** no longer pours the library's examples,
  non-examples, borderline rule, exclusions, onset, offset, counting unit and
  topographies in beside a definition you typed yourself: they are written
  for the library's definition, not yours. With your own definition on the
  card, those fields stay empty, and the dialog and the message say which
  and why. With only a label typed, the rest is filled as before.
- Loading the **functional version** of an entry now says why its type
  stays one target (or a cluster): it scores the outcome, whatever form the
  response takes, rather than a list of movements.
- **Check wording** leaves the library's own text alone: a sentence still
  word for word as the library wrote it, and the names the card's target
  goes by, are not marked (437 marks on library text before, none now). The
  panel says so. What you change or add is checked as before.
- **Print.** The example counters print "5 listed" once three or more are
  listed (they printed "5 of 3"), and empty boxes no longer print with
  resize grips. These print changes, also part of this release, were
  checked against v21.42i:
  - the Guide gains *About the behavior library*;
  - the References gain eight entries (Ahearn 2007, Borrero & Borrero 2008,
    Friman 1999, Green & Reid 1996, Iwata, Pace et al. 1990, Mace 1988,
    Powell 1975), in smaller type;
  - six one-line entries on the definition cards are now one-row text boxes
    (the printed text is the same);
  - the RRB safety-flag checkboxes now print, so a ticked flag shows on
    paper (the labels printed without their boxes before).

  Blank, TB-1 still prints 18 pages; with the simulation, 19.

**Writing help**

- Boxes that hold someone else's words have no Improve wording button, so
  their words are never "corrected": IN-1's interview answers, IA-1's FAST
  open answers, SV-1's open answers, SI-1's answers in the student's words
  and *What the student said about the plan*, RR-1's quoted present levels,
  diagnoses, parent information and goals, and CT-1's *What the family said
  in their own words*. Each Guide says so.
- More findings can be fixed with one tap: "a lot" becomes "[number] times"
  to fill in; words that claim a purpose ("deliberately", "on purpose") and
  dramatic words before a noun ("a blood-curdling scream") can be taken out,
  and "a" or "an" before the next word is put right. "[expletive]",
  "[inaudible]" and the like are not taken for blanks to fill in.
- In a short box that is full, the Improve wording button moves just outside
  the box's lower edge while you type, instead of fading out under the text.
- The privacy step hides contact details, dates, addresses and long numbers
  too, and Lock ends the session on the relay (see above).
- The Writing Tools tab and the Guides say where Writing Tools' text goes:
  it is Apple's own, works on the text as written, names included, on the
  iPad or on Apple's servers; follow the agency's rules for it, and do not
  use its ChatGPT options for student text.
- The one-file editions carry the writing help once instead of once per
  form: 44 copies would have added about 4 MB to each. They are 10.4 MB now
  (6.3 MB in v21.42i); the rest of the growth is this release's other parts:
  the larger picture library, TB-1's library, the narration, Autosave and
  the offline app.

**The relay**

- `POST /api/session/end` ends a session (Lock calls it).
- The admin page's security token is no longer in the page; each tab signs
  in on its own (see above).
- "https only" no longer believes a browser's `X-Forwarded-Proto` header.
  Behind a proxy that sets it (GoDaddy Website Security), set
  `TRUST_PROXY_HTTPS` to `true` in `config.php`. The README's "too many
  redirects" entry says how to tell and what else to change.
- The rewrite instructions name the new placeholders, so the answer keeps
  them where they were and each is put back.

Rebuild the upload zip (`bash tools/relay/build-zip.sh`) before handing it
over, so the README inside it is current.

**The workstation and the picture library**

- Each form keeps its place on the page when you switch to another form and
  back, or change the side-by-side layout.
- On an iPad held upright (or a phone), opening TK-1 from TE-1, or TE-1 from
  TK-1, opens it in place of the form, with the message about coming back to
  compare, instead of two stacked panes with little room.
- The header's buttons are a little tighter below 1240 px wide, so the time
  stamp "Autosaved 8:05 AM" no longer pushes *Finish PDF* onto a third row.
- The 29 pictures stored inside a picture of their own (the practice's
  cards, the YouTube logo, both Boy avatars) are drawn at full size in the
  pickers and tables of TK-1, VS-1 and SM-1, centred like the others (they
  were about half size, top left). The printed cards were already right.
- The practice's own pictures carry a small *yours* in the pickers and in
  VS-1's library, so its Ball card and the library's Ball can be told apart.
- `nbh-pictos.js` is now about 1.72 MB. Upload it with the forms.

**Older snapshots**

- TE-1's hidden link record (#teLink) moved to the end of the page. Placed
  first, it moved every other field of TE-1 one place on, so a snapshot made
  before v21.43 could not be put back field by field when its own file
  part was missing. The workstation's bridge now also takes a form for the
  same shape when its fields without a name sit where they sat, so a field
  with a name added after them changes nothing. This is checked in
  `qa/link-te1-test.js`.

**Housekeeping**

- Two working files committed by mistake are gone from the repository's
  root and from the parts: `crops_te1/reshot_d0_now.png`, which
  `qa/autosave-test.js` had taken up as its photo, now lives as
  `qa/data/autosave-photo.png`, and the Python cache file is removed.
  `qa/reshot-te1.js` writes into `qa/out/`, and `qa/print/` and `qa/shots/`
  are ignored.
- `qa/ob1-split-test.js` tries the side-by-side mode in a browser profile of
  its own: OB-1, changed on its own just before, keeps a safety copy, and
  the workstation's offer to restore it stood in the way of the test's
  clicks.
- `qa/wording-rollout-test.js` seeds its random numbers again as each
  simulation loads: the Autosave block draws one as a page opens (for the
  tab's name), which moved every simulated number one on in the new copy
  and not in the old, so seven forms whose simulations are random seemed to
  print differently. Seeded at the simulation, they print the same.
- `qa/shell-check.js` closes the simulation's notice before it tests Escape
  (while a form's dialog is open, Escape is the dialog's), `qa/pnav-test.js`
  uses the same server as the other checks (`WS_URL`), and `qa/printbase.js`
  makes its master print in a browser profile of its own (the forms it has
  just printed keep safety copies, and the workstation's offer to restore
  them stood in the way) and fills the packet's student before Save case.

## Autosave that holds up on an iPad (v21.44, draft)

Autosave keeps a safety copy of the work in this browser, on this device,
so a closed tab, a reload or an iPad quietly dropping a background tab does
not cost the work. What changed:

- **Taps count.** Every form now reports a short fingerprint of what its
  own Save data would write, so an interval scored with a tap (MT-1), a
  prerequisite marked (PA-1) or a cell marked on the scatterplot (SP-1)
  is a change like typing: it reaches the safety copy, shows the dot on
  Save case, and marks the form unsaved. An autosave never clears that
  mark.
- **One copy for each student in each tab.** Copies are kept in the
  browser's own database (IndexedDB) with each form's file and its
  pictures, for 14 days. A copy is never written over while its offer has
  not been answered, so closing the offer box keeps it, and two tabs on two
  students keep two copies. Open case and Restore first write the forms
  open now into their copy and then leave it alone; a copy another open tab
  is keeping is not offered as earlier work. No copy is deleted to make
  room: over five, Autosave asks you to delete the ones you no longer
  need. The Autosave button lists the copies (student, forms, time) with
  Restore and Delete for each, Delete all, and the switch. The old single
  copy is moved over once and removed.
- **Pictures are kept.** When the browser is short of room the copy is
  kept without pictures, then without the largest forms, with a warning
  on the Autosave button; Autosave stays on. The restore names any form
  whose pictures were not kept.
- **At once when the tab is hidden.** The copy is written as soon as you
  switch to another tab or app, not only every so often. A tab being
  closed or reloaded also leaves its last change in a small slot in this
  browser at once, and the next opening takes it into the copy.
- **Autosave stays on.** A full store never switches it off; only you do.
  A browser where an earlier version switched it off by itself is asked
  once whether to turn it back on.
- **Save case waits for every form.** A slow form is asked again with a
  longer wait. A form still missing is named in the notice, and the case
  is then not marked saved and the safety copy is kept. Anything changed
  while the file was being written stays marked unsaved. On an iPad,
  where Safari may only show the file, Save case asks whether the file is
  in Files; until you say it is, the dot stays on and the copy is kept.
- **Own tab takes the work with it**, and a form opened on its own (its
  own tab, a direct link) keeps a safety copy too and offers it back when
  it opens again, in a box in the corner that blocks nothing. Its own Save
  data ends that copy (on an iPad the copy is kept, marked as saved to a
  file, because the download cannot be confirmed).

**Where the copies are, and who can see them.** Copies stay in this
browser on this device and are never sent anywhere. They are protected by
the iPad's passcode, not by the workstation: anyone who can unlock the iPad
and open the workstation can see them. On a shared iPad, delete them
(Autosave button, Delete all) or turn Autosave off. The installed app and
Safari keep separate copies. Safari may clear a site's storage after 7 days
without a visit, and in a private window the copies end when the window
closes. A copy is a safety net; the case file is the record, so keep saving
the case.

What could not be checked here: the iPad itself. The checks
(`qa/autosave-test.js`) run in desktop Chromium with an iPad user agent;
Safari's handling of a discarded tab, its storage limits and its download
prompt need a look on the iPad.

**Email it… (v21.44).** The Respondent pages dialog of IA-1, IN-1, SV-1 and CF-1 has **Email it…** beside **Copy link**: a dialog
(nbh-respond.js `NBH_RESPOND.invite`) with To, Subject and Message filled in, then **Open in Mail** (a `mailto:` link to the
device's mail app), **Share…** where the browser has a share sheet, and **Copy the message**. The subject is the questionnaire's
title and the student's initials; the message says what to do (open, read the definition where the page shows one, answer, press
Send) and the due date when there is one, carries the link (or one per target in IA-1) and is signed with the BCBA's name. The
button is off whenever Copy link is. Nothing is sent by the workstation: the email leaves from the user's own account. Checked by
`qa/invite-test.js`. HOSTING.md has the `.htaccess` lines that let `respond.html` and `nbh-respond.js` through the folder's
password, so the links work without a public folder.

**Short respondent links (v21.44).** A respondent link is now `respond.html#z=1<form letter><code>` instead of `#p=<the
questionnaire as base64>`, and is 4 to 20 times shorter (with the simulated case: SV-1 about 260 characters after the address,
CF-1 about 190, IN-1 about 390, IA-1 with sixteen FAST-length items pasted about 1,100; before, 3,600 to 7,500). The code is
the questionnaire's JSON packed with deflate (RFC 1951, written into nbh-respond.js so it runs the same in every browser,
WebKit included, with no library) against a dictionary of the wording the form puts into its links, with a CRC-32 of the
questionnaire in front. The dictionaries (`tools/respond-dict/v1.json`, one per form, made by `tools/respond-dict/make.js` from
the forms with the simulated case) are frozen: a link made today opens with exactly these bytes, so a wording change later
gets a version 2 beside version 1, never an edit of it. IA-1's dictionary has its instructions, scales and open questions
but not the item wording, which is the user's paste, and not the WEFA's open questions. The form opens each link again before
handing it out and falls back to the old kind if anything differs; respond.html still opens `#p=` links; a link cut short
fails its CRC and the page says it does not open (never a wrong questionnaire). A second link opened in the same tab, which
changes only the part after `#`, now reloads the page so it shows its own questionnaire. Checked by `qa/respond-short-test.js`
(the frozen dictionaries, links from the four forms, the golden links in `qa/data/respond-golden.json`, old and cut links).

## Sprints A1 to A9 and the policy and safety packages (v21.44)

Each package below was finished and reviewed on its own branch and merged
into v21.44 together (sprint A8, the name corrected on the bar, follows
later). Each comes with its own check in `qa/`, named after the package; the
files saved before each change travel with its check in `qa/data/`.

- **TD-1, the response step follows the extinction answer (A1).** "On the
  target behavior" on the Responding sheet follows question 4 (is the
  function-matched extinction step feasible here?): yes fills in the
  extinction step, no fills in the alternative (noncontingent escape or
  DNRA for escape, NCR or DRA for attention and tangible, matched items and
  DRA for automatic), unanswered leaves it empty with a note. Typed words
  are never replaced, and opening a file changes nothing. The consequence
  protocol card follows the answer the same way. A plan saved before this
  whose words do not follow question 4 says so, and Copy for the BIP, the
  staff flowchart and the final plan ask first. TD-1 and SR-1 ask before
  Load simulation. Check: `qa/sprint-a1-test.js`.
- **Nothing overwrites what you entered (A2).** FS-1's concluded function no
  longer fills the hypotheses on IA-1 and IN-1 (not on opening, from the
  case, from *From the case* or from Open packet); the target behavior
  still arrives from the case. IA-1, PA-1, MS-1 and AD-1 ask before Load
  simulation. Check: `qa/sprint-a2-test.js`.
- **OB-1's Live Recorder on an iPad held sideways (A3).** Start, End and
  Save sit under the clock, every control at least 44 px on a touch screen,
  the explanations fold behind *How it works* in a short landscape window,
  and after End, Save into and Discard come up beside Save. Nothing moves
  while recording. Save data and Export CSV name the file
  `OB-1_<Student>_<YYYY-MM-DD>_<HHMM>`. Check: `qa/sprint-a3-test.js`.
- **Each replacement skill once; DD-1 uses the objective's criterion (A4).**
  TB-1 passes on clean replacement names (staff notes such as "(see target
  4)" dropped), DD-1 makes one row per replacement skill and takes the days
  at criterion and the aim from the GB-1 objective that names the row, with
  a note at the top when the case changes a row in use. FS-1 does not take
  a replacement target for a problem behavior. Check: `qa/sprint-a4-test.js`.
- **GB-1 starts goals from DD-1's baseline (A5).** *Current level from DD-1*
  fills each empty current level from DD-1's own baseline figures, only
  where the measure is the one DD-1 records; one acquisition objective per
  replacement skill; the objective's sentence reads as English ("will hand
  a break card and wait"). Load simulation asks first. Check:
  `qa/sprint-a5-test.js`.
- **Bigger tap targets on the live data sheets (A6).** MT-1's interval
  marks, TI-1's tick boxes and ABC-1's recording rows are at least 44 x 44
  px on a touch screen; with a mouse and on paper nothing moves. ABC-1 asks
  before Load simulation, checks a file before it replaces anything, names
  a wrong or damaged file and changes nothing. Check: `qa/sprint-a6-test.js`.
- **VS-1's visuals print at full size from Safari (A7).** On an iPad or
  iPhone (or with *Sheets* set so) *Print the visuals* draws each sheet for
  Safari's printable area instead of shrinking it to 68 or 88 %. A computer
  prints exactly as before. Check: `qa/sprint-a7-test.js`.
- **TE-1 names the behavior that earns tokens (A9).** TE-1 now has case
  hooks: the replacement or skill goes into *Behavior the tokens are earned
  for* (never a problem behavior; one already there is warned of on
  screen), and PA-1's ranked menu fills the backup reinforcers. Check:
  `qa/sprint-a9-test.js`.
- **Escape extinction with physical guidance (B3, TD-1 and DA-1).** While
  the plan holds escape extinction, the Responding sheet asks whether staff
  may guide the student's hands, and requires the least help first, the stop
  rule, what the adult does instead, the student's assent plan, why
  guidance is needed, and the parent's agreement, with a fixed *Never
  force* line. Until it is all in place the plan, Copy for the BIP and the
  staff flowchart say what is missing. DA-1's physical prompt follows the
  same rule. Check: `qa/policy-td1-test.js`.
- **Policy and safety (B1, B4, B5: CR-1, IM-1, IC-1, SI-1).** CR-1 states
  the breathing rule for every hold, lists the danger signs, and asks *Does
  This Need a Report?* in the debriefing (kept off the printed plan). IM-1
  names two adults at every check, never examines private areas, and logs
  what was noticed during required care. IC-1 and SI-1 tell the family and
  the student the limits of confidentiality. Checks:
  `qa/policy-safety-test.js`, `qa/im1-test.js`.
- **EA-1's alone condition is supervised by default (B2).** A true alone
  condition only after the policy check, a stop-or-step-in rule in three
  parts, how the student is watched, and the parent told; it falls back to
  supervised when one goes, and the walkthrough shows the open door. Files
  saved before open supervised. Check: `qa/policy-ea1-test.js`.

## Form SM-1, the Self-Monitoring and Point Sheet Creator: Looks, Rating Styles, a Reward Store, and a Walkthrough (v21.45)

SM-1 keeps every sheet type, page and record it had, and gains what Form TK-1 has: a sheet that looks made for the student, and
a narrated walkthrough of that sheet with **Save as video**. A file saved before v21.45 opens on the **Classic** look with the
rating "as the sheet type has it", and prints exactly the sheet it printed before (checked for all eight sheet types, weekly and
pocket sheets, against the v21.44 form).

**Built from parts.** `sh tools/forms/SM-1/build.sh` assembles the form (CF-1's shared parts, then the polish layer) from
`script-main.js`, the QR library (`tools/vendor/qrcode-generator`), `sm-themes.js` (the themes' pictures, OpenMoji CC BY-SA 4.0,
made by `make-themes.py`), `sm-library.json` (the target library), `sm-v2-core.js` (the looks, rating styles, store, the model every
look draws), `sm-v2-ui.js` (the editors), `walk-script.json` and `walk.js` (the walkthrough; its player is a copy of TK-1's), and
the styles `own.css`, `sm-v2.css`, TK-1's `walk.css` and `walk-sm.css`. The narration (`walk-audio.js`, voiced from
`walk-script.json` by `make-narration.py`, Kokoro af_heart, as TK-1's) goes beside the form as `nbh-sm1-narration.js` (1.2 MB);
Save as video is TK-1's `nbh-tk1-video.js`, which now takes its file name and dialog words from the form (`NBH_WALK_INFO`). The
one-file editions carry the narration once (`nbh-embed-narration-sm1`). Rules written for `#sheetOut` are copied by the build to
`#smPrevI` (the live preview) and `#wkSheet` (the walkthrough's copy of the sheet).

**Design page (new).** Five looks: Classic, Bright (elementary: the student's avatar or photo, a gradient header, big glyphs),
Interest theme (sports, space, animals, dinosaurs, art, music, vehicles: the theme's colours, pictures and words, such as "Game
Plan", "Prize locker", "Halftime check"), Clean (middle and high school: initials, a report layout, a points-to-spend list) and
Discreet pocket cards (one to six day cards a page, initials only, the week's graph on the sixth). Any look draws Self & Match,
the contract, expectations and earns, check-in / check-out, cued intervals and the rubric sheet; the performance count, the
interlocking session and the weekly sheets keep their layout in the look's colour. Also: the colour, the name shown (first name,
initials or full), the word for the adult who rates, the "I'm working for" box, a midday check, a QR code (the walkthrough video
saved to the district drive, or any page), and the contract's line on the sheet.

**Rating styles.** One choice for every sheet type: smiles (2 or 3), thumbs, plus / minus, check / x, Yes / No, 0-1-2, 1 to 5,
stars coloured in (0 to 3), green / yellow / red (lettered, for black-and-white printing), three pictures from the library, or the
student's own words. Each level's points can be edited. Points possible follow the style: a two-level style on Self & Match keeps
the Match Points table; a style with more levels counts the adult's rating plus a bonus (default 1) when the student's rating is
the same (after Rhode, Morgan and Young's matching procedure, 1983); the other sheet types count each cell's points.

**Targets.** **Add from the library** places up to six targets from 26 written for the practice (task engagement, starting and
finishing work, following directions, schedule changes and transitions, ending a preferred activity, asking for help or a break,
a calm-down plan, waiting, accepting no and feedback, safe body, staying in the area, kind words, raising a hand, taking turns
talking, personal space, respectful words to staff; younger and older wording), each with the sheet's words, the adults'
definition, a cue, an example and a non-example, a picture and a starting goal; a target already on the sheet is not placed twice.
Six targets are now allowed (five before), sixteen periods (twelve).

**Schedules.** Start from an elementary day, a half day, a middle school day, a high school day or a block schedule, or make rows
every N minutes; a second schedule (a specials day, early release) prints while its box is ticked (the Record and week grid
keep the regular day's periods).

**Reward store** (Reinforcement page): rewards with a picture, a price and a tier (small, medium, big), filled from the reward
menu with pictures guessed from the words; an optional bank. It prints on the sheet (tiles, a list, or a line on the cards) and
on its own as **My Reward Menu**.

**Quick starts** (Setup page): six common arrangements (young student Self & Match; expectations with a theme; on-task checks;
middle school check-in / check-out; high school pocket cards; a point sheet with levels). Each sets the sheet type, the look and
the rating, and fills targets and periods only where they are empty.

**Preview.** **Preview the sheet** (bottom right on the editing pages) shows the sheet as it prints and follows every change.

**Printing.** The Sheet page says whether the sheet fits one page; a sheet that runs over prints shrunk to fit unless **print at
full size** is ticked. New prints: a week (Monday to Friday, one page each), two half-size copies on a page, My Reward Menu, **How
to Run This Sheet** (a staff page made from the settings: before the day, at each period, what to say, what never happens, the
end of the day, the record, the targets' definitions and the goal rule) and a **rating practice page** (the targets' own examples
and non-examples to rate, with an answer key).

**Contract.** **Fill the empty lines from the sheet** fills the task, how much, when, who records and the reward from the sheet
(only empty lines); **Pictures on the contract** adds the targets' and the reward's pictures for a younger student.

**Walkthrough** (new view). Built live from the sheet as it prints: the sheet appears, the camera moves to the goals and the day,
the student's pencil circles the ratings in the first row (as the chosen style is described), the adult's pen rates the same row,
the matches earn points that are written in, the day is totalled against the goal, the store's rewards light up and the chosen
one goes into the "working for" box, the contract is signed, and four points for the adults are read. The lines depend on the
sheet: one per rating style (twelve, plus the rubric, the intervals and the contract's check), the matching lines only for Self &
Match (two-level or bonus wording), "your teacher rates" for check-in / check-out, and the midday check, the store or the reward
menu, the bank and the contract only when the sheet has them. With the simulation it runs about 1 min 46 s in seven chapters.
The player, the captions, full screen, the transcript and Save as video (1080p, with the narration) work as TK-1's; the credit line
is on every frame. Checked by `qa/sm1-v2-test.js` (the older file, every look and sheet type, the points, the themes, save and
open, the library, the quick starts, the schedules, the store, the contract, the preview, the extra pages, the walkthrough's lines
for eight sheets, and five frames painted for the video against the stage), and an MP4 with sound made in WebKit.

## Form SM-1: Plain and Colour Themes, and Rating on the iPad; the Safety Wording Approved (v21.46)

**Plain and colour themes.** The Interest theme now offers, besides the seven picture themes, **Plain** (black on white, no
pictures, for a black-and-white printer) and twelve one-colour themes with no pictures (ocean blue, sky blue, teal, forest green,
lime green, sunset orange, gold, cherry red, rose pink, berry purple, slate gray, rainbow). They use the sheet type's own title
("Sam's Self & Match Sheet") and the plain words ("Today I earned", "My reward store", "Midday check"). The Design page shows the
two groups: **Theme with pictures** and **Plain or one colour**.

**Rate (iPad), a new view.** The sheet on the iPad. At the end of each period the student taps a rating for each target (big
buttons in the sheet's own rating style), and the points, the match and the goal follow as they tap:

- **The period card** opens on the period to rate now (the first one already begun that is not rated, from the schedule's times),
  with arrows and dots to move between periods, the targets' pictures, cues and a read-aloud button (the iPad's own voice).
- **The adult's part.** Switch between *Sam rates* and *Teacher rates* at the top. Where the system has a match (Self & Match,
  cued intervals, the rubric with the teacher matching), the adult does not see the student's rating until the adult has rated
  (Settings can show it); once both have rated, both see "Same answer! +2" or "Different answers". The adult also counts
  reminders per period (R R) and writes a note for the day. On check-in/check-out the adult rates and the student sees.
- **Points, as on paper.** A two-level Self & Match style uses the Match Points table (System page); a style with more levels
  counts the adult's level plus the bonus when they are the same; cued intervals and the matched rubric count the adult's level;
  the contract, expectations and check-in/check-out count the one rater. A period the adult does not rate counts as the student
  rated (the matching ladder thins the matching to a sample), and the page says how many are waiting. The day's points possible
  equal the sheet's.
- **The goal bar** shows the points, the goal and the price of the reward the student is working for (tap a reward in the store
  to choose it); reaching the goal shows a short celebration (no movement when the iPad is set to reduce motion). With the bank on,
  the bank's balance shows.
- **Student screen** fills the iPad with the student's part only (the rest of the page cannot be reached). Holding the adult's
  button for a second, and a PIN when one is set in the Settings, opens the adult's part; the PIN keeps the student on their part
  and is not a lock on the file. In the workstation the Student screen fills the form's frame; opened on its own, it asks Safari
  for full screen. The iPad stays awake while it is open.
- **Cue timer** (cued intervals): a soft chime and a flash, or a flash only for a quiet room, every interval (fixed, or variable
  around the average as the Intervals section sets), opening the next check. **Chime at a period's end** (Settings, period
  sheets): when a period's time is over the chime sounds and that period opens for rating. Both need the page open.
- **Finish the day** writes the day to the Record as one row (points, possible, goal, matches, goal met, per-target percents,
  "Rated on the iPad" and the note); finishing again updates the row; a row typed by hand for the same date is replaced only when
  you say so. After finishing, the student taps the reward chosen (with the bank on, its price is spent). **Print the day** prints
  a day report (each period's ratings, the matches, the reminders, the totals, the goal, the reward, the note, signature lines).
  **Days rated on the iPad** lists the days with Open, Print and Delete.
- The days are kept in the form's file (`S.days`, by date), so Save data, Open data, the case file and Autosave carry them;
  a forged file is cleaned on opening. The performance count and the interlocking session stay on paper.

The Guide adds a paragraph and a research row (Wills & Mason, 2014: a self-monitoring app on a tablet with the paper sheet's parts
raised on-task behavior for two high-school students; the screen changes the recording, not what makes it work). The simulation
has today's first three periods rated on the iPad. Checked by `qa/sm1-rate-test.js` (every sheet type, the points rules, taps,
the hidden match, reminders, the celebration, Finish, Delete, save and open, the Student screen with the hold and the PIN, the
cue timer, the period chime, the day report, a narrow screen) and in WebKit.

**The safety wording is approved.** The BCBA approved the wording of the policy and safety packages (B1, B4, B5; the questions in
*Safety-wording-to-review.md*, kept as they were proposed). The source comments that ended "Review this wording." now end
"Wording approved by the BCBA, October 2026." Nothing on screen or on paper changed.

**Save as video on the iPad: the sound and the round photo (v21.46).** Two faults in videos made on an iPad (TK-1's and SM-1's
Save as video share `nbh-tk1-video.js`):

- *No sound.* Safari's audio encoder (WebKit, Safari 26) hands back the AAC track's decoder description as a whole MPEG-4 ES
  descriptor instead of the bare AudioSpecificConfig the WebCodecs standard specifies (WebKit bug 302253). Written into the file
  as it came, the track's esds box held a second ES descriptor inside it, and the Photos app played the video silent. The video
  maker now writes the AudioSpecificConfig itself (AAC-LC, 48 kHz, mono: `11 88`) for every browser. Checked by
  `qa/tk1-video-test.js` with encoders that behave as Safari's, and by a video made in WebKit whose sound decodes (48 kHz, 4.5 s,
  the narration's level). Videos made before stay silent: make them again.
- *A square photo.* The photo in the board's round frame zooms (its own transform), so the video painted it as a picture of its
  own, and the round frame's cut (`overflow: hidden` with `border-radius: 50%`) was not applied to it. Every picture painted on its
  own is now cut by the boxes around it that cut it on the page. Checked by `qa/tk1-video-test.js` (a red photo: red in the
  middle of the frame, not in its corners, as on the screen).

## Form DD-1: A Cleaner Data Sheet and a Narrated Walkthrough (v21.47)

**The data sheet, laid out again.** The definitions in the column headings made the heading tall and the columns narrow, and the
key took four columns of the page. Now, by default:

- The heading is three short rows: the type bands (reduction targets, replacement behaviors, acquisition targets), the names
  (each with a number in its colour) and the units ("total per day", "Total minutes", "Occ. (+) · Opps · %").
- **Definitions and measurement** sit below the sheet, one card per behavior under the same number: the definition, its type, the
  measurement and the observation length. The key (blank and zero, full and conditional changes) is one line under them.
- The student's name and details are one line above the table, with the observation window on the right.
- Printed, the Date column reads "Mon 9/7" and is narrow, Obs. min is narrow, the behavior columns share the page evenly (sized to
  fill it, landscape or portrait) and Daily notes takes what is left; a long name breaks with a hyphen.
- **Definitions go: In the column headings** (beside Show definitions) keeps the sheet exactly as it was; with Show definitions
  off, the key stays and each name carries its measurement. The choice is saved with the file; an older file opens with the
  definitions below. Checked by `qa/dd1-sheet-test.js`.

**Walkthrough (a fourth tab).** A narrated walkthrough of this form's own sheet and graph, for everyone who records, built from
the form as it is (2 min 51 s with the simulation, five chapters): the column groups, the numbered definitions, the units; a day
written in by the pencil (today's row, from the last day's numbers); observation minutes (a late arrival typed over); blank and
zero; a duration behavior's episode log; a skill's correct responses and opportunities and the percent the form works out; a full
phase change and a conditional change; the first behavior's graph (the camera travels down to it, the days light in turn, the
phase line); the comparison under it (level, trend, variability, overlap, the summary); four habits for the team. Scenes the data
cannot show are left out (no episodes, no skill, no change, no days yet). The player, the captions, the chapters, full screen, the
transcript and **Save as video** are TK-1's and SM-1's; the video carries the student's data, so the page says to share it only
where the student's records may go, or to make it from the simulation. The narration is `nbh-dd1-narration.js` beside the form
(Kokoro af_heart, the practice's own voice for TK-1 and SM-1); the one-file editions carry it inside. The walkthrough is written
into the form by `tools/forms/DD-1/patch-walk.py` from `tools/forms/DD-1/` (walk.js, walk-dd.css, walk-script.json; voice it with
make-narration.py). Checked by `qa/dd1-walk-test.js` (the tab, every scene for the simulation, the copy of the sheet as text,
today's row, the camera at the graph and the analysis, scenes left out, five frames painted for the video against the stage,
pausing on leaving, the one-file edition) and a video made in WebKit.

## Form SM-1: The Student's Photo on Every Look (v21.48)

Design › **Student's photo** (it was on the Bright look only): **Add a photo or picture** opens the picture chooser (take a
photo with the iPad's camera, upload one, or use a library headshot); **On the sheet** chooses *Shown*, *A blank circle to glue a
printed photo onto*, or *Not shown*. Where it goes: the header circle on Bright, in place of the theme's first picture on an
interest theme, beside the title on Clean, on each discreet pocket card, at the right of the Classic sheet's heading (the pocket
card's too). Bright shows a chosen picture by itself, as before; the other looks show it only when asked, so a sheet made before
prints as it did. The photo (made small, about 256 pixels, when it is added) stays inside the form's saved file and on the device;
it also shows on the Rate page and in the walkthrough. Checked by `qa/sm1-v2-test.js` (every look with each choice, Open data
keeping the choice and dropping a forged one).

## Form TK-1: The Bus Ride Type (v21.49)

Setup › **Book type** › *Bus ride* makes a token board book for the ride on the school bus (tools/forms/TK-1/bus.js). The bus
rules are the Targets page's cards (two to five), the item is a Choices card in the Earn box, the Board is titled "Sam's Bus
Chart", and the tokens come at **checkpoints** along the route:

- **The ride**: its usual length in minutes, typed. *The length from Maps* takes the start and stop addresses (optional) and
  **Open in Maps** opens Apple Maps' driving directions between them, on that tap only. The addresses are kept only in the
  form's saved file (and its autosave on the device): never printed, never in the CSV, never sent by the form.
- **How a token is earned**, per student: one token at a checkpoint when every rule was followed, or a row of tokens for each
  rule (up to four rules and six checkpoints; the Tokens page and the token sheet then hold a token for every slot).
- **When**: spread over the ride (the ride less the minutes kept before the stop, 1 to 5, divided by the tokens, so the last
  token comes just before the stop; times to the quarter minute), or at a set interval (2 to 15 minutes; Setup says how often
  the board fills, what is left over before the stop, and which intervals come out even).
- **The goal**: tokens needed for the item (blank: every token). With fixed checkpoints a miss cannot be made up, so Setup
  suggests most of the tokens while the board is new; a goal below the full board prints under the Earn box.
- **Fading the timer**: Step 1 a timer at the checkpoint times; Step 2 landmarks on the route (up to ten, with a picture each,
  in route order with the minute each is passed; they set the token count); Step 3 every other landmark, the last kept. Setup
  warns of a landmark outside the ride, uneven gaps and a last landmark far from the stop.
- **The item**, per student: given at the stop by the adult who meets the bus, or on the bus when the board fills (with the
  note to check the district's rules and the student's health plan before food on the bus).
- **The ride plan** for the bus staff, a portrait page after the book's pages (Setup can leave it out): the route drawn plainly
  (no map, no street), the rules, the times or landmarks, what to do at each checkpoint, that the aide runs the board and never
  the driver while driving, the item, the fading steps with the current one marked, a note, and a ride log. It shrinks to fit
  (the log gives up rows first) and is scaled into the iPad's portrait sheet.

The **Walkthrough** of a bus book is the bus ride (about 2½ minutes, six chapters): the board and its rules, the item put in the
Earn box, the route and its checkpoints, the ride (the bus rolls along the route as the timer runs; each checkpoint earns its
token), what a missed rule means (or, with a row for each rule, a missed rule's own slot), the item at the stop or on the bus,
the landmarks and the fewer landmarks, and the ride plan. Its 19 lines are recorded with the same voice (walk-script.json →
make-narration.py) and their word timings measured by the new **tools/forms/TK-1/make-marks.py** (the voice's own phoneme
lengths; it reproduces the earlier lines' timings exactly), so `nbh-tk1-narration.js` is now about 2.1 MB. Save as video makes
the bus ride's MP4 the same way. Load simulator on a bus book loads a sample ride (25 minutes, three rules, five landmarks).

A classroom book is unchanged: its count, pages, walkthrough and saved file are as before (the bus settings have their own
defaults, so a book never takes them from the one shown before). Checked by the new `qa/tk1-bus-test.js` (the schedule
arithmetic, the landmark steps, both boards, the ride plan on Letter and on the iPad's sheet, the addresses kept off the pages,
the CSV and the network, Open in Maps, a saved file and a forged one, the walkthrough's scenes and frames), with
`qa/tk1-test.js`, `qa/tk1-walk-test.js`, `qa/link-tk1-test.js` (which now leaves the bus fields out of its comparison with the
TK-1 from before the link) and `qa/tk1-audit.js`. The form's build line reads v21.49.

### v21.49b: captions in a video made on the iPad, and three fixes to the bus walkthrough

A bus-ride video made on an iPad came out with its narration but **no captions**. On an iPad screen (and in the workstation)
the player is small and shows its captions under the picture rather than on it; Save as video turns that off while it records,
but a resize during the minutes it takes (the toolbar folding, the screen turning) made the player small again, and the frames
were painted without the caption. Save as video (`tools/forms/TK-1/walk-video.js`, used by Forms TK-1, SM-1 and DD-1) now keeps
the caption on the picture for the whole recording, whatever the player's size, and puts the page back afterwards; with CC
turned off a video still has no captions. Checked in WebKit: a recording with the player small and the window resized
throughout has the caption bar in every frame. `qa/tk1-bus-test.js` resizes the window while a frame is painted (it failed
before the change).

In the bus walkthrough: the ride plan is fitted (as the printed page is) before the parts it highlights are measured, so the
highlight around the ride log is on the log (it was below it on an iPad); "on the bus" no longer covers the item's name; and
with a set interval the tokens go back to the Tokens page after the exchange and the item card back in the Earn box, as the
narration says ("the board then starts again"). The form's build line reads v21.49b.

### v21.49c: the bus narration fits every book

The narration is recorded once for every book, so a line cannot say a book's own rules. Three bus lines named examples
("such as staying in the seat, a quiet voice, and hands to self"; "a store, a park, or a bridge"; "a sticker, a song, or a
little time with a tablet") while the picture showed the book's own rules, landmarks and item, which did not match. They are
recorded again without examples: "Across the top are your learner's own bus rules, each with a picture, so everyone can see
what earns a token. Two to four rules work best."; the landmarks are "places your learner can see from the window, in the order
the bus passes them"; and on the bus "something small and quick works best". As the rules line is said, the book's own rules
light one by one, and the landmarks appear one by one along the route. The praise bubbles, which the narration says "name the
rule", now name the book's own rules, a different one at each checkpoint ("Great working!", "Great job: accepting change!").
A label in title case reads as ordinary words in the praise ("Daily Living": "Great job: daily living!"), in the classroom
walkthrough too. `qa/tk1-bus-test.js` checks that the bus narration names no example rule, landmark or item, and that the praise
names the book's rules. The form's build line reads v21.49c.

## Form TV-1, the Training Video (v21.50)

A new form, the 45th, under Implementation (the case map lists it in *Train and run it*): the training video made once an FBA and
BIP are finished, for the receiving team, new staff or a family. It holds what was spread over a teleprompter script, a Google
Sheet and Flowics: the words, the card on screen while they are said, the teleprompter and the cards themselves. Five views:

- **Setup**: the student (from the packet), the first name as said in the training, who it is for, the presenter and the lines
  under the name, and the look of the graphics. **Chapters** (the default) is the practice's newer Flowics template, matched
  to its screens: the panel wider (about three fifths of the picture, nearly its full height) in a lighter navy, with the
  title and the headings in a light gold and the list the size of the paragraphs, a white rule, a **chapter bar**
  along the panel's foot (the chapters typed on Setup, one a line, up to ten; with none typed, the segments; each card is in the
  chapter set on its row or on the nearest row above, and its own chapter's tab is lit, which the template's sheet could not
  do: its tab values were all 0.35), a **ticker** under the panel (the series, in Merriweather Black, running continuously in
  the graphics window; it does not jump when the card changes), and the logo under it. **Panel** is the FBA and BIP template,
  matched to its videos: a navy panel on one half of the picture (the left by default; the presenter on the other half), the segment
  as its title in capitals with a fine rule under it, the paragraphs, the heading in gold and the list; under the panel the
  series on a mint band (*Functional Treatments in Applied Behavior Analysis*; blank for none), and the logo beside a dark tag
  (*FBA & BIP Video Training:* and the student's first name and initial, or a tag typed). The logo is the edition's letterhead
  logo (the Royal Palm School star in the school edition) or one chosen. The type is Lato Bold and Black, built into the form
  (`tools/vendor/lato`, SIL Open Font License), with Merriweather Black for the Chapters look's bar and ticker
  (`tools/vendor/merriweather`, the same licence), so the cards look the same on every device with no network. **Cards** is a white
  card beside the presenter. The colours (panel, heading, band), the half, and the background of the graphics window (green or
  blue for a chroma key, black for a luma key) are set here. **Draft from the case**
  writes a segment for each part ticked (Training Overview, Student Profile, Target Behaviors, Function & Data, Goals of
  Intervention, Reinforcement System, Proactive Strategies, Response Plan, Key Takeaways, Terms & Definitions) from what the
  case holds: each target behavior's definition, examples and non-examples (Form TB-1), the function and its hypothesis
  statements (Form FS-1), the reduction and teaching goals (Form GB-1), the reinforcer menu, the most preferred first (Form
  PA-1). The parts the case cannot know (strengths, communication, the proactive strategies, the response steps, the takeaways,
  the terms) are drafted as prompts in [square brackets]. A draft adds to the end of the script; it changes nothing written. The
  case reaching the form fills nothing until Draft is pressed.
- **Script**: a row for each card, as a row of the sheet, in segments: the paragraphs (column B: on the panel, and what the
  teleprompter shows), the teleprompter's own words when more is said than the card shows (kept in the saved file; the sheet has
  no column for them), the heading (C) and the list (D: one line a point; a line starting with • or - is a bullet, 1. a numbered
  step), its layout (Automatic, a card beside the presenter, a lower third, a full-screen
  card, a section title, one or two pictures, or no card), two pictures with captions, and a thumbnail of the card. **Same words
  as above** marks a card that changes while the paragraph goes on. Rows move, copy and go; each row, each segment and the whole
  script show their words and their time at the teleprompter's speed; words in brackets count as still to write.
- **Teleprompter**: white on black with a reading line, the size and the speed (80 to 220 words a minute) set on its bar, mirror
  for a beam-splitter glass, full screen, the screen kept awake. A Bluetooth page-turner or keyboard drives it: Page Down, → or
  Enter the next card, Page Up or ← the one before, Space scrolls a long paragraph at the speed set. A paragraph's second card
  keeps the paragraph where it is. **Start the clock** keeps the time each card came up (the last take); **Export the card
  times** writes them as CSV, for putting the cards on the video afterwards.
- **Graphics**: every card at 1920 by 1080, large and as a grid. **Open the graphics window** opens the cards in a window of their
  own, on the key background. As in the template's videos, the panel stays when the next card has the same layout: its words fade
  out (a quarter second), the panel shows empty for a moment, and the new words fade in; a change of layout crossfades. A list
  too long for the panel first closes up its spacing, then its words get smaller; the teleprompter (or a tap in the grid) changes it. Double-tap it
  for full screen, on a second display for the Yolobox (by HDMI from a computer, or an iPad's external display). Each text box
  shrinks until its card holds it. The cards are drawn as text and shapes at the size of the display, so a 4K output (3840 by
  2160) draws them at 4K; on a key background a card is opaque and has no shadow, which a key would take part of.
- **Guide**.

**Import a sheet** reads the first tab of a sheet made before (downloaded from Google Sheets as .xlsx or CSV): A the segment, B
the paragraphs, C the heading, D the list, E and F the picture captions, and G to Z as they came. In the newer template's sheet
M and N are the heading and the words of a card beside a picture (they become the layout *Text beside a picture*), O names the
picture's file (the row says so, for the picture to be added), P lists the chapters (one a row, from the first row; the look
becomes Chapters), and Q to Z hold the tabs' values (a card whose value stands above the others is put in that chapter). A
row whose words repeat the row above becomes a card on the same paragraph. **Export for Sheets (.xlsx)** writes that layout
back (the first tab every row, A to Z, or A to I when nothing past I is used; then a tab for each other segment, columns A to
D, named 02_Student_Profile and so on), so the Flowics template keeps reading it. In the Chapters look P is written with the
chapters and Q to Z with 1 for each card's own chapter and 0.35 for the others: a template whose tabs read those values lights
the chapter as the cards go. Export CSV writes the first tab alone. Pictures are not in a sheet: add them on their
rows. **Print the script** prints the words beside the cards, by segment.

Everything stays in the form and its saved file (the pictures too, at up to 3840 pixels on the long side, sharp on a 4K video); the form sends nothing. A sheet
exported for Flowics puts the script in Google Sheets and Flowics: use the district's account and the services the district
allows. A saved file from elsewhere is checked as it opens (text is text, a picture must be an image, a colour must be a colour).
Checked by the new `qa/tv1-test.js` (the draft from a case, the simulator, the teleprompter's keys, clock and CSV, the graphics
window and its background, the workbook out and back in, a CSV in the sheet's layout, Save and Open, a forged file, every
layout inside the stage, print, no request off the folder) and in WebKit; the counts of 45 forms in `tools/build-single.py`,
`tools/pwa-sw.py` (61 files offline), `tools/build-rps.py` and the tests.

### v21.50b: the ticker's speed, and a plain white background

Setup › **Ticker speed** (the Chapters look) sets how fast the series runs along the band under the panel, from 0 (held
still) to 200 pixels a second of the 1920-wide picture; 90 is the default. It changes the open graphics window at once, and
the time a pass takes is measured from the text itself, so a longer series runs at the same speed as a short one. Setup ›
**The graphics window's background** gains **White**: the cards on plain white, with no key (the shadows stay, as nothing is
keyed out), for recording the window itself or matching a white background. Checked by `qa/tv1-test.js`.

### v21.50c: the ticker's text size, type and colour

Setup (the Chapters look) gains three settings beside Ticker speed: **Ticker text size** (24 to 48 pixels of the 1920-wide
picture; 43 is the template's, and 48 is the largest that keeps the descenders inside the band), **Ticker type** (Merriweather
Black as the template, Lato Black as the panel, both built in, or the device's Georgia) and **Ticker text colour**. Each
reaches the open graphics window at once; the speed set holds whatever the size or type, as it is measured against the text.
The words themselves are the Series on Setup. Checked by `qa/tv1-test.js`.

### v21.51: the teleprompter follows your voice; lists that build; chapters and captions

**Scroll** on the teleprompter's bar now has three ways:

- **at the speed set** (words a minute, as before), now going on from paragraph to paragraph instead of stopping at each;
- **while I speak**: the microphone's level only. The script moves at the speed set while it hears you and waits when you
  pause; the room's own noise is measured as you go, and **Microphone** on the second row sets how quiet a voice still counts
  (higher: quieter). No words are recognised in this mode;
- **following my words**: speech recognition on the device places each word you say in the script and keeps it on the
  reading line, at your own pace. A word missed or misheard is allowed for; skip a sentence or go back and it finds you (a
  jump needs a strong match, about three seconds of the new place). The words read are dimmed.

As the script scrolls, the card changes when the reading line passes into the next paragraph (or the next part of one), and the
graphics window with it; the clicker still changes it at any time, and the scroll leaves the cards alone for four seconds after
a click. **Only the clicker changes the cards** turns that off. The second row also holds the size, **Reading line** (where the
line is, 15 to 60% down the screen), Mirror and **No 3-2-1**: Scroll and Start the clock count 3, 2, 1 first (pressed again,
the count is called off).

**The recogniser.** sherpa-onnx (k2-fsa, Apache License 2.0) with a small streaming English model (the 20M zipformer, int8),
in `nbh-asr/` beside the forms: 57 MB in 32 parts of 1.8 MB. It is downloaded from the workstation's own website the first time
*following my words* is chosen (after a confirm), each part checked against its SHA-256, and kept on the device (Cache Storage,
`tv1-voice-model`; **Remove the speech recogniser** deletes it). It runs in a worker on the device: what the microphone hears
is not recorded, kept or sent anywhere, in either voice mode. The offline copy (`sw.js`) does not list `nbh-asr/`, so nobody
downloads it who does not use it. The one-file edition cannot have it (a page opened from a file cannot fetch it): there,
following my words says so and the voice paces the script instead. The same happens if the microphone is not allowed (the
speed set) or the download is declined. Safari asks for the microphone the first time; allow it for the site.
`tools/forms/TV-1/build-asr.py` builds the folder from the two archives named in `tools/vendor/sherpa-onnx/README.md`.

**Marks in the words said** (the paragraphs, or the row's teleprompter words): `//` a pause (shown as ‖), `*a word*` to stress
(underlined), `{a note}` to yourself (small, in a box). They show on the teleprompter only: never on a card, in column B of the
sheet, in the word counts or in the captions.

**A list that builds.** Tick **The list one point at a time** on a row: the card comes up with its list hidden (each point keeps
its place) and each click of the clicker shows the next point, fading in, on the graphics window; Page Up takes one back; after
the last point the next click is the next card. Coming back to the card from the next one shows the whole list, and so does a
card the scroll or the voice moved to. The bar says *point 2 of 4*.

**Chapters and captions** (below the teleprompter), from the last take with the clock running:

- **YouTube chapters**: a text file (and the clipboard) of the times each chapter began, for the video's description: the first
  at 0:00, a chapter the bar's (the Chapters look) or the segment; one shorter than 10 seconds is folded into the next, and the
  form says when there are fewer than three (YouTube shows none then).
- **Captions (SRT)** and **Captions (WebVTT)**: the script's own words, two lines of at most 42 characters a caption, timed by
  the cards' times (each paragraph from its first card to the next paragraph's) or, when the take followed your words, by the
  time each word was heard. Upload either with the video (YouTube Studio › Subtitles), and check them against the take: words
  said off the script are not in them.

Saved files keep each row's build and the word times of the last take (checked as they open). Checked by `qa/tv1-test.js` (66
checks: the countdown and calling it off, the marks on the teleprompter and never on a card or the sheet, the reading line, the
scroll across paragraphs and the cards following it, the clicker alone, the voice without a microphone, a list that builds in
the graphics window, the chapters, the captions and their files, a file's word times) and the new `qa/tv1-voice-test.js`: a
recorded voice reading the simulator's first six paragraphs is the microphone of a Chromium, and the teleprompter follows it
word for word to the end of the sixth (downloaded and checked the first time, from the device the next, the word times
timing the captions, no request off the site). In WebKit the recogniser starts in under 2 seconds and decodes 30 seconds of
speech in about 3, landing on the word being said.

### v21.52: the whole script drafted from the case, and the cards changed by the words

**Draft from the case** (TV-1 Setup) now writes the whole script, so what is left is to read it through and put it in your own
words. The shell reads three more forms for the case (as it reads TB-1, FS-1, GB-1 and PA-1), and the case bar names them:

- **Form DM-1** (the person-centred profile): the strengths and interests (Student Profile › Strengths), how the student
  communicates (expressive, receptive), the yes / no / stop / pain signals, what helps, what to avoid and the assistive
  technology (Student Profile › Communication);
- **Form TD-1** (the plan developed): the antecedent arrangements and the cards before sessions (Proactive Strategies), the
  replacement behavior, how it is taught and the reinforcement schedule (Reinforcement System), the response to the precursor
  and to the behavior, afterwards, and what staff do not do (Response Plan › Steps), and the takeaways (Key Takeaways);
- **Form CR-1** (the crisis plan): its stages, said in order and numbered on a full-screen card (Response Plan › Safety).

Only what no form holds is left in [square brackets] (the presenter, typed on Setup, and the terms). Each form's own words are
used as they were written (the paragraphs are said aloud, so read them through); a card takes the first clause of each, without
the asides in brackets. Open those forms in the workstation (or the case file that holds them) before drafting.

**The next-card mark, `>>`.** Put `>>` in the words said where the next card should come up: as the word before it is said
(Scroll › following my words), or as it reaches the reading line (the other two ways), the graphics window changes to the next
card, or to the next point of a list that builds, with no click. A paragraph comes up on its first card; each mark passed is one
step more. Once the script has marks, only the marks (and each new paragraph) change the cards; the clicker still works at any
time. The draft puts the marks in for you (one for each card after a paragraph's first, and one for each point of a list that
builds, at the end of the sentence nearest an even share of the words), and **Place the next-card marks** (Script) does the same
for any paragraph that has none, after you have written or changed it. Move a mark by moving its `>>`. On the teleprompter a mark
shows as a small orange ▶, grey once passed. Like the other marks, `>>` is never on a card, in the sheet or in the captions.

Checked by `qa/tv1-test.js` (70 checks: the marks placed, one for each step; a card as the mark reaches the reading line and
as the word before it is said; a list that builds one point a mark), the new `qa/tv1-case-test.js` (the seven forms'
simulators through the shell, then the draft: every segment written from them, only the presenter and the terms left, the
marks in), and `qa/tv1-voice-test.js` with a recorded voice: the card came up 0.01 s after the word before its mark was said.

### v21.53: the graphics page in any window (one iPad for both), the chapter tabs' colours, three fixes

**The graphics page.** The cards no longer need the window this form opens: the form's own file opened with `#graphics` at
the end of its address (the link under the Graphics view, or **Open the graphics window**, which opens that page) shows the
card the teleprompter is on and follows it, in any tab or window of the same browser. The two pages find each other over a
channel between the pages of the site (BroadcastChannel), whichever opens first, as well as by the handle the opener keeps;
the same card arriving both ways changes nothing. So on an iPad that extends to an external display (Stage Manager), one
iPad does both: the workstation in Safari (not the installed app: a page the installed app opens shows inside it, and a page
it sends to Safari cannot reach it), the graphics page in its own window moved to the display connected to the Yolobox and
double-tapped for full screen, the teleprompter on the iPad. Until a teleprompter is found the page says so. The form's own
sheet is hidden under the page (the file is the form, loaded once more, from the cache). A file opened on its own (file:) has
no channel and keeps the window it writes.

**The chapter tabs' colours** (Setup, the Chapters look): **Chapter tabs**, **Chapter tabs' text**, **The lit chapter tab** and
**The lit chapter tab's text** (before, the tabs took the heading and panel colours and white). They reach the open page at
once, and a saved file keeps them (checked as colours).

**Fixes.** In the Chapters look the lower third and the section title drew as the full panel (the look's own rules overrode the
layouts': the title over the heading, the panel the full height); the lower third is now a short panel at the foot with the
chapter bar under its heading, and the section title sits mid-panel as in the Panel look. The ticker under a full-width panel
stopped at half its width; it runs the panel's width. Following the words: a weak match a few words ahead could move the
reading ahead of the voice and stay there (a jump back needed a stronger match than the jump forward had); now the next word
or two needs little, and a jump of more, forward or back, needs more of the words heard to agree, the further the more. A word
still being said (the recogniser gives its first letters) counts as the start of the script's longer word. While the
recogniser is still being fetched or started the voice message says so (the script scrolls at the speed set while you speak
until then), and in that fallback the words are no longer dimmed as if read (a guess). **Heard:** under the screen shows the
last words recognised while the words are followed, so a word misheard can be seen for what it is.

Checked by `qa/tv1-test.js` (77: the graphics page opened by hand follows the card and a list that builds, the tabs' colours
reach the window, the Chapters look's lower third and title and the ticker's width, the voice's thresholds) and in WebKit
(the graphics page in a second window follows over the channel), and the voice and case suites again.

### v21.54: the rehearsal, the microphone check, a title and a closing card, pictures from the token board, music, Close case

**On the teleprompter.** **Rehearse** runs the script from the top at the speed set, the cards changing as they will (the
graphics page too), and ends with the pacing: the whole, each segment's time and cards, and any card that stays on screen
more than 45 seconds with no change (add a card, a point that builds or a `>>` mark, or shorten the words); **Pacing** gives
the same without the run. **Test the microphone** (the voice modes) listens for ten seconds without scrolling and says what it
heard (the words, in *following my words*; how much of the time was speech, in *while I speak*) and how loud. **Width** on
the second row narrows the words to 40 to 100 percent of the screen, so the eyes move less across the glass. **Card** (or
the G key) shows the card the teleprompter is on over the script, its points as revealed, in full screen too; press again for
the script. **Music off** fades the music out now.

**The draft** opens with a title card (the student's FBA and BIP, with the series when one is set) and ends with a closing
card (*Thank you*: the presenter and **Contact for questions**, new on Setup; the segment *Closing*, in the *Close* chapter);
the simulator has both. (Those made the sample script 20 cards in 17 paragraphs over 11 segments; the tests say so.)

**Pictures from the other forms.** A row's **Add** picture now asks: from this device, from the token board (Form TK-1) or
from the visual supports (Form VS-1). The other two ask the workstation for that form's own saved data (the relay of v21.22:
the form must be open in the workstation, beside this one or not) and offer its photos and the pictograms its cards use,
drawn from the shared library beside the forms (`nbh-pictos.js`, fetched when first needed; not in a file opened on its
own). Tap one and it is copied into this form (a pictogram gives the caption its name), so nothing is uploaded twice. The
token board itself cannot be taken as one picture (Form TK-1 draws it as a page, not an image).

**Music.** Setup › **Music**: up to four tracks (MP3, M4A or WAV, 12 MB each, kept in the form and its saved file), and for
each segment a setting: keep playing, silence (a fade out), or a track at a level with a fade in and a fade out. The change
comes as the segment's first card comes up, from the teleprompter or the clicker, and the end of the script fades the music
out. The graphics page plays it, through the HDMI lead into the Yolobox, so the camera's microphone never hears it and the
Yolobox mixes it; a browser that waits for a tap before sound plays shows *Tap to allow the music to play* on the page (the
double-tap for full screen counts). **Play it on this device too** (a checkbox) plays it here as well, for a rehearsal. A
saved file keeps the tracks and settings (checked as they open: sound data only, four at most, the levels and fades in range).

**Close case** (the shell's bar, after Open case): saves the case the same way Save case does, then closes every form and
clears the student's details, the case facts and what is due, so the next student's case starts without leaving the
workstation; with nothing to save it just clears. If the save does not happen (the picker dismissed, a form not answering)
nothing is closed. Help and the command palette know it. Checked by the new `qa/close-case-test.js` (26 checks: the file
written with both forms, every form gone, the details and facts cleared, the dot off, the guard quiet, a form reopened empty,
nothing closed when the save is refused).

Checked by `qa/tv1-test.js` (the counts, the title and closing cards, the marks on the presenter card), the voice suite with a
new recording of the first six paragraphs (the title card's words first), and `qa/tv1-case-test.js`; the picture chooser
through the shell (12 pictograms from Form TK-1's sample board, one placed on a card with its name as the caption) and the
music (a track and two segments' settings, the command reaching the graphics page as the segment's card comes up, a bad
saved file cleaned) by hand in Chromium.

### v21.55: Undo and Redo on TV-1, and the look's own colours back

**Undo** and **Redo** on TV-1's toolbar (Ctrl/Cmd+Z and Shift+Z outside a text box): every change is a step (a colour, a
setting, a row moved, copied or removed, a picture added or removed, a track, a draft, the simulator, an import), up to 80
kept; changes within a second of each other (typing, a colour picker dragged) are one step. A row removed comes back with its
picture. The clock's card and word times are not steps. Setup also has **The look's own colours**, which puts every colour
back to the look's (Chapters: #222f5a panel, #eed9ad heading, #c1d8d3 band, #8b91bb tabs, white tab text, #eed9ad lit tab,
#222f5a its text), for a colour changed by mistake with no way back. Checked by `qa/tv1-test.js` (two checks).

## Form IA-1: The FAST Walkthrough (v21.56)

**A narrated walkthrough of the FAST** (View ▸ Walkthrough on Form IA-1), built as Form DD-1's and TK-1's are: a player over
this form's own sheets, with the recorded narration (Kokoro, beside the form as `nbh-ia1-narration.js`, 1.8 MB, inside the
one-file editions), captions, chapters, full screen and **Save as video (MP4)**. Seventeen lines in seven chapters, about six
minutes:

- **The FAST**: the sixteen yes/no items on the worksheet, the four groups of four lit in turn (social positive, social
  negative, automatic sensory, automatic pain).
- **Before you start**: the Setup sheet's target behavior and operational definition (one behavior per administration, the same
  definition read to every informant), the informants table (role, months known, hours in the target routines), independent
  completion within a few days, fifteen to twenty minutes.
- **Filling it in**: the pencil writes each informant's answers down the grid; NA (not seen) and its exclusion from the pair's
  agreement.
- **Scoring**: the totals table (yes answers per group, the highest shaded as the outcome, no margin rule on the published FAST),
  the verdict (a one-item margin kept with a caution; a tie is no outcome).
- **Agreement**: the Agree column and the pair's item agreement; Study 1's 196 pairs (mean 71.5%, range 28.6 to 100%, most
  between 61 and 80%, "moderate at best" against the 80% criterion); the per-item figure against Table 3 (53.3% on item 12 to
  84.5% on item 4; antecedent items 78.9% against consequent 67.7%); outcome agreement 64.8%.
- **The research**: Study 2's 69 functional analyses (63.8% matched; 77.8% social positive, 56% social negative, 61.5%
  automatic) and the 24 with both informants agreeing (70.8%; 7 of 7 for social positive).
- **What it means**: a screening tool that structures the interview and helps design the analysis, not a replacement and not
  enough alone for treatment; Section 1's open-ended answers compared with the items for inconsistencies and clarifying
  questions; the next step (strong concurrence can justify a single-function test; disagreement calls for interview,
  observation and a full analysis; pain items endorsed go to a medical screen first; the FA's outcome recorded on Convergence).

It is built from the form as it is: the definition, the informants, every informant's answers, the totals, the verdict, the
figures and Section 1 are copies of the form's own, turned into text. **A form with no FAST answers yet shows a worked example**
of two informants (a teacher and a paraprofessional; escape with a margin of two and of one, one item not seen, 11 of 15 items
agreed, the outcome agreed), put into the form's fields for the build only and taken out again in the same turn, so nothing
is changed and nothing is autosaved: Save as video from an empty form is the version to share. With the simulation, or a
case, the same scenes show that data (three informants on the simulation).

**Your recorded version**: a field under the player for a YouTube link (a presenter version recorded on the Yolobox, or the
MP4 uploaded), saved with the form; Open follows it. The same link can be the instructions link on the respondent pages.

Parts: `tools/forms/IA-1/{walk-script.json, walk.js, walk-ia.css, make-narration.py, walk-audio.js, patch-walk.py}`; the
script writes the view inside the form's own script (a closure), between its markers, and running it again replaces what
it wrote. The one-file editions carry the narration once (`nbh-embed-narration-ia1`). Checked by `qa/ia1-walk-test.js`
(17 checks: the view, the example and its scores, the fields unchanged, the pencil, the camera's stops, the captions'
decimals, the simulation, five frames of Save as video against the stage, pausing on leaving, the link, the one-file edition).

**A presenter version on camera (Form TV-1).** TV-1's toolbar has **Script: the FAST**: the same seventeen lines as rows in
seven chapters (The FAST, Before you start, Filling it in, Scoring, Agreement, The research, What it means), each with its
card (a title card, bullet cards that build, the article's numbers), added after any rows already there and placed with
cue marks, for the teleprompter and the graphics page on the Yolobox. The words are the walkthrough's, to edit to your own
voice; the numbers are the article's. The recording, once on YouTube, goes into IA-1's link field under its player.

### v21.57: three walkthroughs on IA-1, a practice check, captions for YouTube

**Three walkthroughs share the player** (buttons over it): **The FAST (for the assessor, 6 min)** as in v21.56; **The FAST for
informants (1 min)**: six lines for the people who answer it (one behavior as defined, yes if usually true, no if not, NA when
they have never been in that situation, on their own, then the open-ended section), the pencil writing one informant's answers;
**Convergence (2½ min)**: ten lines in four chapters on the Convergence sheet (each informant's outcome on each instrument
mapped to the common set; a FAST social-positive outcome as attention or tangible; weak rows shown but not counted; consensus
counted by informant, at least three, 80% or more; the physical-profile rule; the figure, counted not averaged; the drafted
hypothesis; the decision; the verification record after the analysis, the pencil entering the outcome, the date and the
design, the correspondence appearing). A form with no answers shows a worked example of three informants on the FAST, QABF
and MAS and one interview (escape for the teacher and the paraprofessional, attention for the parent: escape 2 of 3, a
majority without agreement; the analysis found escape, mean correspondence 0.75), put in for the build only and taken out
again. Each has its own Save as video name and its own captions.

**A practice check** in the assessor's walkthrough, after the verdict: a card shows the last informant's four totals and asks
for the outcome and the margin; in the player the narration's "pause here" is kept for you (the player stops at the answer
with the question under it: the group, the margin, Play on), and the answer is told right or not; in the saved video the
card and the answer play through.

**Captions and chapters (for YouTube)** under the player: an SRT captions file timed from the walkthrough's own caption
pieces, and a chapter list (0:00 first, also copied) to paste into the video's description, for whichever walkthrough is
shown. **Script: the FAST** on TV-1 is unchanged.

Parts as before (`tools/forms/IA-1/`; walk-script.json now 35 lines, the narration 3 MB beside the form). On the stage a
paragraph's measure is pinned, because the polish layer widens long paragraphs after the build (the glows had drifted on the
Convergence copy). Checked by `qa/ia1-walk-test.js` (22 checks: the three modes, the practice check through the player,
the captions and chapters, the fields unchanged after all three builds).

### v21.58: the FAST's sixteen questions, built in

The FAST worksheet now prints each question beside its item number, with the category as a small tag, so the worksheet reads
as the interview or is filled from a paper FAST, and the walkthroughs (which copy the sheet) show the questions as the pencil
answers them, the camera following four rows at a time. The respondent page for the FAST carries the same questions when
none are pasted on Setup (the wording box says "built in"; paste there only to change them). The wording is Figure 1 of
Iwata, DeLeon and Roscoe (2013), reproduced in the article; the FAST sheet's note says so. The QABF, MAS, PBQ and WEFA are
unchanged: their wording is still pasted once from your own copy. Parts: the questions sit in `tools/forms/IA-1/patch-walk.py`
(FAST_ITEMS, between its own markers in the form's script).

### v21.59: the FAST's authors credited

Under the FAST worksheet's heading (and so on the walkthroughs' copy of the sheet): "The Functional Analysis Screening Tool
(FAST) was developed by Brian A. Iwata (University of Florida), Iser G. DeLeon (Kennedy Krieger Institute and Johns Hopkins
University School of Medicine), and Eileen M. Roscoe (New England Center for Children). Its items are reproduced from
Figure 1 of: Iwata, B. A., DeLeon, I. G., & Roscoe, E. M. (2013). Reliability and validity of the Functional Analysis
Screening Tool. *Journal of Applied Behavior Analysis, 46*(1), 271–284. https://doi.org/10.1002/jaba.31" (the affiliations
as printed in the article). The respondent page for the FAST carries the same credit under its footnote (`nbh-respond.js`
shows a questionnaire's `credit` when the form sends one; the link grows by its length).

### v21.60: RA-1's walkthrough video, drawn with hands

Form RA-1's Walkthrough view now opens with a narrated walkthrough of the reinforcer assessment at the table (about five
minutes, sixteen lines in six chapters: Why test, Single operant, Concurrent operants, Progressive ratio, At the table, The
result), drawn with Form TK-1's hands on a top-down table: the student's hand takes a block from the tray and places it in the
bin (the response), the assessor's hand reaches in from across the table and delivers the tablet within two seconds, the
student's hand rests on it for the access, and the tablet goes away. Beside the table a session panel counts what the sheet
will take: the condition and its placemat colour, the clock (paused during an access), the responses, the rate per minute, the
access ring, and a cumulative record; a fast-forward badge runs the rest of each five-minute session. The control session ends
at 12 responses (2.4 a minute, "the rate to beat"), the tablet session at 58 (11.6), praise with a high five at 13 (2.6, its
rate with control: preferred is not reinforcing), then the sheet's own figure and the Clear verdict; three bins with the
positions rotating and the allocation (34, 9, 1: Preferred, Lower, Not chosen); the progressive ratio with the ladder, the
reinforcers, the stop interval and the break point (FR 15, High); the rules for every design; the runner part way through a
session; and the summary's verdicts (Confirmed, Confirmed, Not supported) with the plan ratio. The sheets on the stage are
copies of the form's own sheets rendered from the worked example (the simulated student, with fixed numbers), their fields
turned into text; the example is put into the form for the build only and taken out again in the same turn, so nothing on
your sheets is shown or changed, and the video can be shared with the staff who run the sessions. The narration names the
tablet, the fruit chew and praise, so the walkthrough is always the worked example. The drawn stories and the printable job
aids follow it on the same view, as before.

The player, captions, chapters, full screen, **Save as video** and **Captions and chapters (for YouTube)** are the same as
IA-1's; the Save as video dialog says the video holds only the worked example (`NBH_WALK_INFO.priv`, a line the shared
`nbh-tk1-video.js` now takes from a form). A link to your recorded version is a field saved with the form. Parts:
`tools/forms/RA-1/` (walk.js, walk-ra.css, walk-script.json, make-narration.py; walk-audio.js, the recorded narration, 1.5 MB,
beside the form as `nbh-ra1-narration.js`, inside the one-file editions and the offline copy), put in by `patch-walk.py`,
which inlines TK-1's `walk-hands.js` and SM-1's copy of TK-1's player between its own markers in the form. Checked by
`qa/ra1-walk-test.js` (the build, the example's verdicts on the copies, the form unchanged, the panel's numbers through the
sessions, the hands in and out of the frame, the camera on each paper, captions and chapters, five painted frames, leaving the
view) and by `qa/ra1-regress.js` as before; the offline copy counts 63 files.

### v21.61: a case opens at once

Open case used to rebuild the workstation one form at a time: each form's page loaded, the shell waited, filled it from the
file through the form's own Open data path and waited again for it to confirm, then began the next. Measured with ten filled
forms on a computer that was twenty seconds, of which the forms' own loading was one to five; an iPad took two or three times
as long. Now Open case (and Restore from Autosave, and a one-file case opened by double-click) lists the case's forms in the
rail at once and loads one: the form that was open when the case was saved (the file now carries `cur`), else the first in
the file. The others show with a hollow green dot and the count of fields the file holds for them; each is loaded and filled
the first time it is opened (about a second and a half on a computer, a few on an iPad), and meanwhile they load quietly in
the background, one at a time, laid out off screen, only while nothing has been typed or tapped for a moment, so typing in
the open form is never held up. A form opened later is filled from the file before the student's details and the case are
pushed into it, as before.

Nothing waits on a form being loaded: Save case writes the forms not loaded yet exactly as the file held them (and no
longer waits on them), Autosave's copy and the last-moment stash carry them, Close case clears them, the case as a
spreadsheet takes their fields from the file, the master print loads and fills a ticked one before collecting it, and a form
asking the relay for a partner not loaded yet is answered from the file. The Save case dot and the unload guard count a
waiting form as the file holds it, so a case just opened is not "unsaved", and a form that loads quietly later does not make
it so; an edit in any open form does, as before. The Diagnostics row "Forms open" says how many are still waiting.

Shell parts (`NBH-Workstation/index.html`): `state.pending` (what the file holds for each waiting form, with its field count
and a fingerprint), `loadCase`, `makeFrame` and `afterLoad` (the restore on load), `warmStart`/`warmTick`/`warmForm` (the
quiet loading; `.warm` frames sit off screen), `settled`, `caseSig(over)`, and the Save case, Autosave, Close case,
spreadsheet, master print and relay paths named above. Checked by `qa/case-open-test.js` (a six-form case: the open within a
few seconds with one form loaded, the rail, a tap, typing holding the quiet loading, the rest loading one by one and put
away, Save case right after Open case with five forms still waiting, Close case, a file without `cur`, an edit and a save
followed by quiet loads), and by the case, Close case, autosave, sprint-a2 and sprint-a4 suites as before.

### v21.62: My pictures, from the camera

A picture of the real thing is the most concrete picture a visual can carry, and until now it meant a photo uploaded whole,
background and all. Now Forms VS-1, SM-1, TK-1 and TV-1 share **My pictures**: the practice's own picture library, made with
the camera. In any of their pickers, **Take a photo** opens the iPad's camera (a computer offers a file instead); the photo's
plain background is cut away on the device, the item is trimmed and set in a square the way the library's pictograms sit in
theirs, kept at 600 x 600 px with a see-through ground (or a white one, a switch), named, and saved to My pictures, and with
**Save and use it here** it goes straight onto the cell or card that was being filled. **My pictures…** opens the library:
every picture with its name (editable), Remove, the three ways in (the camera, a picture file, a picture pasted from the
clipboard, such as a subject copied out of Photos, which already has a clear background and is kept as it is), **Save the
pictures to a file** and **Open a pictures file**, for carrying the whole library to another device or keeping it safe.
VS-1's Pictures page has the same two buttons, and TV-1's picture dialog has **Take a photo** and **From My pictures**.

The library is kept in the browser itself (IndexedDB, on the site's origin, so every form and every student share it; the
one-file edition's forms share the file's own store), never on a server. A picture put on a visual is copied into that form's
own saved data, as an uploaded photo is (VS-1 at 400 px, SM-1 at 256 px, TK-1 and TV-1 at the full 600 px, each within the
form's limit for a photo), with the library picture's id, so a case file carries the pictures its forms use, and a form opened
from such a file on another device adds them to My pictures there. Pictures already placed keep their copies when a library
picture is removed or renamed.

The cut needs a plain background: the note in the dialog says to put the item on a plain sheet of paper or a plain table,
fill the frame with it, and keep one's own shadow off it. The colour of the photo's border is taken as the background (the
median of a band along the four edges; a border whose colour varies, or whose edges differ, as a table's edge does, is not
plain, and the photo is kept whole, with a note); from the edges in, every pixel near that colour and close in colour to the
neighbour it is reached from joins the background, so the shading and the soft shadows on the sheet go and the item's edge,
where the colour changes sharply, stops the flood; a closed-in patch of the paper's own colour no larger than a quarter of
the item's box is background too (the paper seen through a cup's handle); the edge is feathered over two pixels, and the
paper's share is taken out of the edge pixels' colour, so there is no pale fringe. An item the colour of the sheet is the one
case it cannot do (the note says to use a sheet of another colour, or to keep the photo whole: the cut is a tick that can be
turned off). A dark sheet works as a white one does. A photo is worked on at up to 1400 px on its long side; the cut takes
about a quarter of a second on a computer, a second or so on an iPad.

Parts: `tools/blocks/nbh-pictures.js` (the source; its copy `NBH-Workstation/nbh-pictures.js` sits beside the forms, loaded by
`<script src="nbh-pictures.js">` from the four forms' `toolbar.html`; the SM-1, TK-1 and TV-1 build scripts copy it, and the
one-file edition carries it once, as the `nbh-embed-pictures` block, put into a form as it opens, like the pictogram library).
It exposes `window.NBHPIC` (`process`, `cutout`, `square`, `open`, `manage`, `list`/`all`/`get`/`put`/`rename`/`remove`,
`toPhoto`, `absorb`, `download`/`importFile`, `buttons`). Without the file beside a form, the picker is as before. The forms'
parts: VS-1 (`libPhoto`, the picker's `_mine` category, `#pdCam`, `#pdLib`, the Pictures page's `#phCam` and `#phMine`,
`absorb` in `renderAll`, `lib` kept by `fromFile`), SM-1 (`useLib`), TK-1 (`libPhoto`, `lib:` keys in the several-at-once
picks, `putIn` now waits for the copies), TV-1 (`picShow`, `#picCam`, `#picMine`). The shell's Diagnostics has a My pictures
row; the offline copy counts 64 files. Checked by `qa/pictures-test.js` (the cut on synthetic photos: a shaded, grainy
sheet with a soft shadow, a soft-edged item, a ring, a dark sheet, a busy background kept whole, a picture with its own
clear background, the white ground, the cut unticked, a small item drawn up; the flow in VS-1 through the camera input; the
library shared with SM-1 and TK-1, one picture and several at once, one copy per picture; rename, save to a file, remove and
open the file; a pasted picture; a file opened on a fresh browser adding its pictures; the forms without the file; the shell
and the one-file build), and by the VS-1, SM-1, TK-1, TV-1 and PWA suites as before.

### v21.63: Form TB-1, from the candidates to the definitions, and the targets sent on

Four asks on Form TB-1 (Target Behavior Development), and one answer.

**A candidate row can be deleted.** Each row of Candidate Behaviors (sheet 2) ends in a small × (not printed). Deleting a row
that holds anything asks first; the rows below move up and are renumbered, the fields stay `cand[0]` to `cand[n-1]`, and a
saved file reopens with the rows that are left (`candRenum`).

**Goes to sheet follows the Type.** On Selected Targets for This Plan, choosing the Type sets the Goes-to-sheet column: a
cluster (a set of forms) goes to 3 then 4, anything else straight to 4. Set by hand, the column stays until the Type changes
(`selTo`, `selFollow`); a file saved before this fills the empty column from the Type as it opens.

**A selected target starts its card on the Definitions sheet.** The label, Type, urgency and paired replacement typed on a
Selected Targets row go to the card of the same number on sheet 4 while the card's own field is empty or still holds what the
table last gave it, so a card edited on sheet 4 keeps its own words (`selSync`, with the table's last values in `SELV`).
**Take the candidates marked Target** (a button under the table) puts every candidate decided "Target – …" that is not yet
among the targets into the empty rows, in order, with the Type from the decision, the urgency and the sheet; the number of
targets grows to fit, up to the form's ten, and the note under the button says what was added and what did not fit.

**The library's starting definition is offered.** When a card's label names a behavior the library knows (its name, one of
its other names, or the one entry every word of the label is in: `libBest`) and the card's definition is still empty, the
card's library row says so ("The library has a starting definition for “Screaming”: Screaming.") with **Start from it** and
**Read it**; the row's picker is set to the entry, so Load into this card does the same. The offer goes once a definition is
written or loaded. It is made when the table hands a label over, when a label is typed on the card, and when a file opens.

**My bank: definitions of one's own.** Each card's library row has **Save this definition to my bank**: a small dialog takes a
name (the card's label), other names a search should find, and a note shown on screen only, and saves the card's definition
fields (type, definition style, dimension, definition, topographies, examples, non-examples, borderline cases, exclusions,
onset, offset, counting unit) as a library entry of one's own, under the category **My definitions**, kept in the browser
(IndexedDB; localStorage where there is none) for every student. Bank entries come first in every search, in every card's
picker, in the candidate picker and in the panel; a card named as one is offered it ("Your bank has a starting definition for
…"); the panel shows a bank entry as "In my bank, saved <date>" with **Remove from my bank**, and its My bank line has **Save
the bank to a file** and **Open a bank file** (a file of another kind is refused). Saving under a name already in the bank
replaces that entry; a card that loaded an entry keeps its text whatever happens to the bank. The dialog lives in a shadow
root (`#tb1BankHost`), like the library's own controls, so its boxes are not the form's: not saved, not counted, not an edit.
The form's saved file is unchanged in shape and never carries the bank.

**Sending the targets to the other forms.** Inside the workstation this already happened on its own (v21.31): the shell reads
the targets from TB-1 while it is open, hands them to every open form within a few seconds (empty fields and empty behavior
tables take them; anything typed is left alone), gives them to a form of the case as it opens, and each form's toolbar has
From the case to pick more. Now the Definitions sheet also has **Send the targets to the other forms**, shown only inside the
workstation: it asks the shell to read the case and send it at once (`send-facts` → `sendFactsFor` → `facts-sent`), and the
note beside it says how many other open forms took the targets and how many forms of the case will take them as they open.

Checked by `qa/tb1-flow-test.js` (28 checks: the delete and the renumbering through a save and reopen; Goes to sheet; the
table starting the cards and a card edited keeping its words; the offer, Start from it, a label known by another name and one
not known; Take the candidates marked Target, nothing twice, the count growing; the bank dialog in its shadow root, the entry
first in another card's picker, found by its other name in the candidate picker, the panel's category and line, kept across a
reload, offered to a card named as it, loaded, saved to a file, removed, opened from the file, a wrong file refused; the
saved file's shape; the Send row hidden on the form alone and, in the workstation, sending to another open form), and by
`qa/tb1-library-test.js` (140) as before.

### v21.64: Form IA-1 holds every target, and a send-out board

**Several target behaviors in one file.** IA-1 was one target behavior per file. Now a file holds a record per target: its
worksheets (FAST, QABF, MAS, PBQ, WEFA), interviews, convergence, instrument plan and its own lines on Setup (label, definition,
frequency, severity, hypothesized function); the student, the informants, the pasted item wording and the walkthrough are
shared. The toolbar's **Target behavior (this file)** list switches the sheets between targets, **+ Target** adds one and
**Remove** takes one out (asking when it holds anything). Switching puts the current target's fields into its record and the
other's onto the sheets through the one-target load the form always had (`restore1`), so every worksheet, total, figure and
verdict is the target's own. The saved file carries every record (`targets`, `cur`) and the current target's fields as before,
so an older edition still opens it as a one-target file, and a file saved before this opens as one target. Inside the
workstation the case adds a record per target Form TB-1 holds, with the definition, and fills an empty current target first
(`__nbhFactsIn`, From the case: each ticked behavior becomes a target); a target removed by hand is not added back until
**Take the targets from the case** on Setup is pressed. The Respondent pages dialog lists this file's targets first, then the
case's not yet in it.

**The informants, shared, with an email.** One informant table serves every target (the Setup text says so), with a new Email
column for the respondent pages' emails. The Send-outs sheet can leave an informant out for a given target.

**The Send-outs sheet.** A board of target × instrument × informant rows. The plan panel ticks the targets (each with its
informants, untick one to leave it out for that target), the instruments (one with no wording pasted yet is marked) and the
dates for the rows planned next (Send on, Please send by); **Plan the send-outs** makes the missing rows. Each row shows its
status, Planned, Page made, Sent, Not back yet (sent and past its date), Received, Placed, with "send today" and "past its send
date" marks, and its own buttons: **Page** (that target and instrument's respondent page as a file, which marks every row of the
pair made), **Link** (copied, and in the box), **Email** (the invitation, nbh-respond.js, to that informant's email with the
row's link; the row is marked sent today by email), **Sent ✓** and **Not sent**, **Remind** (the invitation again, the date
noted), **Received ✓** and **Not received**, **Open the worksheet** (switches to the target and the instrument), and × (off the
board). **Make every page not made yet** saves one page per target and instrument; **Add the dates to a calendar** saves an
.ics file with an all-day event per send-on date not yet sent and per please-send-by date of a row sent and not back, the
student by initials, for the iPad's calendar. The Respondent pages dialog's Save, Copy a link and Email it mark the rows of
their targets and instrument "page made". A row's dates can be typed on the board. The board travels in the file (`outs`,
`drop`) and in the case.

**Collect responses, by target and by informant.** A code is placed on the target it names, when this file holds it, in the
column of the informant whose name it carries (else the next free column, and the count of informants follows), each target's
own worksheet and Section 1 taking its answers; a code naming no target goes to the current target; a file with no target named
yet takes the first one named; a code about a target the file does not hold is held, with **Add it as a target here** and Copy
those codes. Every code placed marks its row on the board Received and Placed (from whom, the code's date; a row never marked
sent counts as sent that day). The workstation's case bar lists what is due from the board (`window.__nbhDue`): the send-on
dates not yet sent and the please-send-by dates not yet back, within two weeks or past, like the other forms' dates.

What it cannot do: send the emails by itself on the dates. The pages go from the assessor's own mail app, one tap from the
board; the workstation keeps the student's details off servers by design. Parts: IA-1's main script (`T`, `tgtStore`,
`tgtLoad`, `tgtSwitch`, `tgtFromFacts`, `withTarget`; `OUTS`, `DROP`, `outsPlan`, `outsRender`, `outsAct`, `outsMade`,
`outsReceived`, `rpPayloadQuiet`, `outsIcs`, `__nbhDue`; `rcRead` and `rcSlotFor`; `importResponses` taking a column per
response), the Send-outs sheet (`#outs`), the toolbar's target group, the Setup note and button, the informant table's Email
column. Checked by `qa/ia1-outs-test.js` (29 checks: the list, + Target, switching with the worksheets apart and the
informants shared, the file with both targets and reopened, an older file, the case adding records, a removed one kept out
until asked; the plan panel and the rows, nothing doubled, Page, Link, Email, Remind, Sent and Not sent, the due list, the
calendar file, a typed date, a row taken off; two codes placed on their targets and informants with the board marked, a held
code added as a target, the board saved and reopened; in the workstation TB-1's targets becoming records and the board's dates
on the case bar), and by the respondent, WEFA, audit, iPad, photo and short-link suites as before (the respondent suite now
expects a second respondent in the next free column, A kept).

### v21.65: the reply box, answers straight back to Form IA-1

**For the informant.** A respondent page (the FAST, QABF, MAS, PBQ or WEFA opened from a link or an attached file) used to
end with an email: Send opened the informant's mail app with the answers as a code, which the BCBA pasted into Collect
responses. Now, when the page carries a reply box, Send locks the answers on the informant's device and sends them to the box;
the page says **Sent.** and is done. No email, no code, nothing to copy. The page's foot says so ("Your answers are locked on
this device so that only J. Newsome's own form can open them"). If the box cannot be reached (no internet, the program not
set up), the page says so and offers **Open the email** with the code, the way it always worked.

**For the assessor.** Form IA-1 collects the replies itself: the Send-outs sheet collects while it is open (once on opening,
then every minute) and **Collect from the reply box now** does it at once; the Collect responses dialog has **Collect from the
reply box** too. A reply is placed the way a pasted code is (the target it names, the column of the informant whose name it
carries, else a free one; the informant table filled; the board's row marked Received and Placed from whom). A reply about a
target the file does not hold, or whose wording differs from this form's, is held on the Send-outs sheet with **Add it as a
target and place it** (or Place it anyway, Discard). Every reply taken is remembered, so nothing is placed twice; **Remove the
collected replies from the site** deletes them there (they stay in the file). The invitation email says "Your answers come
straight back to me when you press Send" when the link carries a box. A row's new **QR** button (and **QR code** in the
Respondent pages dialog) shows the link as a code the informant scans with a phone, with Share the link… (the iPad's share
sheet: Messages, Gmail, AirDrop) and Copy the link; the Email and Share buttons keep working as before.

**Where the box lives.** A small PHP program, `public_html/reply/box.php` on the practice's site (`tools/reply-box`, with a
README and `nbh-reply-box-upload.zip` beside the release; HOSTING.md has the steps: upload, extract, open `?a=ping` once).
A workstation opened from newsomebh.com uses `/reply/box.php` on that site by itself; the Respondent pages dialog's new
**Reply box** field names another address (completed to `box.php`, remembered on the device like the wording and in the file
as `rp.box`); a form opened from a folder with no address known makes email pages as before, and a file that already holds a
box keeps using the site it was registered at. Each IA-1 file makes its own key pair and read token and registers its own box
(a random id) the first time a page or link is made; the file carries them (`box`: id, token, both keys, the site, the replies
taken, the held replies), so a copy opened elsewhere still collects. Clear all drops the file's box (the address stays); a
new file gets its own.

**What is where.** The link and the page carry the box's address, id and public key (never the private key). The page makes a
one-time key of its own for the reply, derives a shared secret with the form's public key (ECDH P-256, HKDF-SHA-256 with the
box id as salt), encrypts the answers (AES-GCM-256) and posts the ciphertext as text (no preflight). The site keeps the box
id, a SHA-256 of the read token, the ciphertexts with the one-time public keys and times, and an hourly count per address
(hashed); it never sees a name, a score or the student. The form lists its box with the token, decrypts with its private key,
places, and keeps the ids taken. Replies are swept after 60 days, a box nothing has reached for 60 days too; 64 KB per reply,
300 replies per box, 120 an hour from one address; a reply that does not decrypt (not for this file) is counted once and never
tried again. Requests are allowed from any page (CORS `*`): a page opened from an email attachment has no origin.

Parts: `tools/reply-box/public_html/reply/box.php` (+ `.htaccess`, README, `build-zip.sh`); `nbh-respond.js` (the runtime's
`sendBox`, the Sent and fallback lines, the invitation's wording; the done line is `#nbhr-done`); IA-1's main script (`BOX`,
`boxUrl`/`boxSite`/`boxReady`/`boxLink`, `boxKeys`, `boxEnsure`, `boxDecrypt`, `boxCollect`, `rcPlaceAuto` and `rcRowOf`,
`boxNote`, `boxPaint`, `boxHeldPaint`, `boxPurge`, `window.__ia1BoxOuts`, `qrSvg`/`qrShow`; `rp.box` in the device memory and
`rpRemember`; the box in `rpPayloadFor` and `rpPayloadQuiet`; `collect`/`restore` with `box`; `outsAct` async with `qr`), the
dialogs' new field, buttons and lines, the Send-outs sheet's second row of buttons and the held list, the QR dialog, the QR
library (qrcode-generator, MIT) inlined as `<script id="ia1-qr">`. Checked by `qa/reply-box-test.js` (44 checks: the API's
ping, new, had, 409, 400, put, not a reply, 404, 413, 403, list with CORS, preflight, del, drop, the data folder; the form with
no box, the address completed, registration with the keys in the form and the hash on the site, the link and the page carrying
the box without the private key; three informants sending from the page, Sent with no mailto, ciphertexts only on the site;
Collect placing two in their columns and holding the third, nothing twice, the Send-outs lines, the held reply added as a
target and placed; the invitation's wording, QR on a row and in the dialog; the file with the box, reopened, nothing twice,
the box's own site when no address is known; Remove from the site, an unreadable reply counted; an address out of reach and
the page's email fallback; no errors) and by the respondent, IA-1 send-outs, WEFA, audit and short-link suites as before.

### v21.66: Form SM-1 matches the model, and the respondent pages read right

**Match the model (Form SM-1, a new page).** A quality standard the student can see. The sheet holds a task ("Clean the lunch
table") and two to four pictures of the finished work at each level (the clean table, the half-clean table, the table not
done), each with a name, points, what makes it that level and a checklist printed under the picture. The pictures come from
the camera (My pictures), a photo or the library, at 480 px. The student does the task, looks at the work and at the pictures
and picks the one the work looks like (a self-evaluation of a permanent product); the teacher picks without seeing the
student's choice; when the two match, the student earns the level's points plus the bonus and the best reward; one level
apart, the student's points stand without the bonus (or the teacher's, or none, as set); two or more apart, no points (or the
teacher's) and the two look at the pictures together. An honest "Not yet" that matches still earns the bonus: accuracy is
paid as well as quality, which is the matching contingency of Rhode, Morgan and Young (1983) applied to the quality of a
product. The teacher's checks are thinned as the matches hold (every time, every other time, one in three unannounced,
surprise checks); on an unchecked trial the student's rating counts. **Rate now (iPad):** the first rater picks a picture
and locks it in (hidden), the second picks, the result shows both pictures, the points and the reward, a photo of the work
can be taken and kept beside the trial, and Save this trial writes the record; the order can be reversed (the teacher first,
hidden) for early teaching, and Not checking this time thins the checks. **The record:** a row per trial (date, the two
picks, the result, the points, the reward, a note, the photo), editable, with the metrics (trials, checked, matches, the last
five, points, at the best level), a suggestion that moves the checks on at 4 of the last 5 matches and back after two
far-apart checks, a chart of both raters' levels with the matches marked, Add a row by hand for the paper sheet, and a CSV.
**The printed sheet** (Print the model sheet, alone, landscape for four pictures): the pictures with their names, points and
checklists, the rule in the student's words, and a row per trial with a circle per picture for the student and the teacher,
Match? and the points. **Ideas for teaching it** sit under the sheet: teach the rating on other people's work first, rate the
work not the person, the student commits first, pay for accuracy, fix before rating, thin the checks on a criterion, vary the
models, generalize to the next setting, fade the pictures last (Rhode et al., 1983; Smith et al., 1988; Cooper, Heron and
Heward, 2020; McClannahan and Krantz, 1999). The simulation brings a drawn lunch table at three levels and ten trials; the
file carries the page (`S.mm`) and a forged file is cleaned. Parts: `tools/forms/SM-1/sm-mm.js` and `sm-mm.css` (built in by
`build.sh`), the section in `body.html`, the toolbar's view and Print the model sheet, `script-main.js` hooks (`ensure`,
`renderAll`, `fromFile`, the picker's size, the simulation). Checked by `qa/sm1-model-test.js` (20 checks).

**The respondent pages read right (nbh-respond.js).** A behavior with no plural (hitting, elopement, aggression: the plural
phrase left as the term, or not ending in s) now makes the sentence singular: "How severe are the problem behaviors when they
occur?" becomes "How severe is hitting when it occurs?", "Do the problem behaviors stop when…" becomes "Does hitting stop
when…", "Are these behaviors more likely…, and do they last long?" becomes "Is elopement more likely…, and does it last
long?"; a real plural (tantrums) keeps its plural sentence. With the pronouns set to they, "Does they seem" is now "Do they
seem". The Respondent pages dialog says so under the plural column. On the page itself, the code row (Copy the code, Save as
a file, Open the email) stayed visible before Send on every page since v21.39, because the row's own display rule beat the
hidden attribute: fixed; and the intro sentence says "your answers go straight to J. Newsome" when the page carries a reply
box. Checked by two new checks in `qa/respond-test.js`.

**The one-file edition's shell, hardened.** The shell puts each embedded library (the respondent pages, My pictures, the
pictograms, the narrations, Save as video) into a form by replacing its `<script src>` tag with the library's text. It did so
with a string replacement, in which a `$&` or `$1` inside the library is read as a replacement pattern; the new wording code
carried a `$&`, which cut the respondent library short inside the one-file edition and left Form IA-1 there without it. The
library no longer carries the sequence, and the shell now replaces through a function, so any library may. Checked by the
one-file checks run before the release.

**The pictures run 1, 2, 3 from the lowest to the model.** The sheet first put the model at 1 with 3 points, so the number
a student circled ran against the points. The pictures now run from the lowest (1) to the model (the last), and a picture's
number is its points by default: the same order and numbers on the printed sheet, its circles, the iPad tiles (each with its
number), the level cards and the record's lists. The model keeps the first place in the data (`lv[0]`), so saved files are
unchanged. A fourth picture is "Not started" at 1 and the model at 4.

**IA-1's toolbar on the iPad.** With six targets from Form TB-1 the target list grew past its group, and + Target and Remove
landed under the case chip beside it. The list is now capped in width and the buttons wrap under it.

### v21.67: Read a document, several model tasks and rating practice, Spanish respondent pages, the model walkthrough

**Read a document (the bar).** A student's details come on paper: the school's information printout, the IEP's cover page,
a plan. The bar's **Read a document** takes a PDF, a picture (a photo of the page, a screenshot) or pasted text, finds the
details in it and lists each one with the line it was read from: the name (split into first and last, "RIVERA, MATEO J"
read as Mateo Rivera), the date of birth and every other date (written as the form needs them), sex, the student ID and
FLEID, the school, grade, teacher, enrolment and previous school, transportation, home language, ELL status, interpreter,
race/ethnicity, Medicaid, the primary and secondary exceptionality, the eligibility, IEP, annual-review and reevaluation
dates, placement, matrix, diploma option, ESY, 504, allergies, diet, physician, psychiatrist, conditions, vision/hearing,
strengths, interests, the BCBA and who holds the rights: 41 details in all, each read by its label (and the label's other
names: DOB, Birthdate, Student No., Homeroom, Primary language, ESOL…). The choices are put in Form DM-1's own words
(Male, ELL: active, Autism Spectrum Disorder, Separate class (self-contained), Standard diploma, Yes/No). Target behaviors
in a plan ("Target behavior 1: Aggression – any instance of…", a Definition line, a replacement behavior) are read too.
Untick what is wrong or correct it in the table, then **Place**: the bar's five fields, Form DM-1 (opened if it is not, the
fields filled by name, a choice only when it is one of the form's), the other open forms as the packet does, and the
behaviors to the case (when Form TB-1 holds none), where Form TB-1 takes them as candidate rows ("the document" as who
reported, the replacement said so, the decision left open) and Form GB-1 starts objectives from them. What the bar and the
form already hold is kept unless Replace is ticked; a value already there is passed over quietly. Everything happens on the
device: a PDF with its own text is read by PDF.js (`nbh-doc/`), a scanned page or a picture by Tesseract (`nbh-ocr/`, the
English model; a few seconds a page, about 7 MB loaded the first time and then kept offline with the rest: `index.html`
names both in `<meta name="nbh-offline">`, which `tools/pwa-sw.py` reads; the worker's release list and the page's
relay for a password-protected folder now accept a file in a folder of the folder, which neither did before); nothing is
sent anywhere and the text is kept only while the dialog is open. The one-file edition, and a folder opened from a drive, read pasted text (the iPad's Live
Text copies it out of any photo or PDF) and say so. The matcher is `nbhDocRead` in `index.html`: a label is known by its
aliases, longest first; what follows it on the line, up to the next label, is its value, or the next line when the label
stands alone; a label followed by one space counts only with a value of the field's shape (a date, a grade, an ID, a
name); a label with a colon beats one without, so a heading such as "Student Information Record" never becomes the name;
parent, phone, address and letterhead lines are read so that their values go to nothing. Form DM-1 answers `{nbh:'fill'}`
(`fill-applied` in the shell's reply map); Form TB-1 defines `__nbhFactsIn` for document behaviors. The vendored readers
and their licences are listed in `tools/README.md`; the zip grows by about 9 MB (HOSTING.md, Updating). Checked by
`qa/doc-read-test.js` (24 checks: the matcher on a printout and a plan, the table, Place into the bar, DM-1, TB-1 and
GB-1, kept and replaced values, a text PDF, a picture read by the recognizer, a scanned PDF, a folder from a drive).
**On a student information system's pages** (Focus, as the district's screenshots look): the labels sit in cells with
no colon, a "?" help mark or a "*" before them, and the page has traps: an empty field followed by the next one (the
value on the next line is taken only when that line has no label and no colon of its own and has the field's shape),
"Original Enter Grade" (not the grade), "Military Family Student: No" (not the name; a reading that is not of the
field's shape gives way to a later one that is), "Race: White  Yes / No" and "Ethnicity: Hispanic or Latino  No"
(questions: Yes places the race, No places nothing), "Parent Language" (the home language), "Legal Name: Rivera , Mateo
Josue" (the first given name goes to the bar, all of them to Form DM-1's first name). The recognizer's words come with
their places, so a gap wider than two letters between two words is kept as a column break (label | value | label),
which the matcher reads as a gap; `drLinesOfOcr`. Checked by 2h (the text) and 5b2 (the same page as a picture).

**Form SM-1, Match the model: several tasks and rating practice.** A file now holds several tasks (the lunch table, the
backpack, handwriting), each with its own pictures, rule, record and sheet: the Task list on the page, + Task, Remove this
task (asked first when it holds pictures or trials), Print every task (one sheet per task) beside Print the model sheet,
and a Task column in the CSV. A v21.66 file with one task opens as before. **Rating practice**, the teaching idea at the
top of the list made real: pictures of other work (taken with the camera or chosen) tagged with the model each is like,
plus the trial photos already rated, make a practice set; Start asks ten in turn with the model tiles, judges each answer
on the spot and keeps the score (9 of 10: ready to rate my own) in a practice log per task. `S.mm` is now
`{tasks:[…],at}`; a forged file is cleaned task by task. The Setup page's quick starts no longer overflow a phone screen
(two columns under 640 px). `qa/sm1-model-test.js` grows to 26 checks.

**The walkthrough's Match the model chapter (Form SM-1).** When the file holds a model task with a name or a picture, the
walkthrough plays six more lines before the adults' part, in a chapter of their own, with the model sheet drawn as a second
page the camera goes to: the job and the pictures with their numbers; the student circles the picture the work is most
like (the pencil), the teacher circles too (the pen); a match writes the points and the bonus in; the rating-practice card
(the models, nine of ten); the checks thinning (every time → every other → one in three → a surprise). The six lines are
voiced with the same voice as the rest (`tools/forms/SM-1/walk-script.json`, `make-narration.py`; 38 lines, 4.9 minutes of
speech in `nbh-sm1-narration.js`). The simulation's sheet now has eight chapters. Checked in `qa/sm1-model-test.js` (8b, 8c)
and `qa/sm1-v2-test.js`.

**Spanish respondent pages (Form IA-1, nbh-respond.js).** The Respondent pages dialog has a language choice (English,
Español), kept in the file (`rp.lang`). A Spanish page says everything of its own in Spanish: the headings, the definition
question (Sí / No / No estoy seguro/a) and its notes, the instructions, About you and its fields, the items' choices (Sí /
No / N/A; the QABF's, MAS's and PBQ's anchors; the WEFA's Verdadero / Falso), In your own words with the FAST's and the
WEFA's open questions, the Send button, the warnings, the Sent and email messages, the foot, the email's text, and the
invitation email the assessor sends; the page's `lang` is es. The items themselves appear as pasted on the Setup sheet, so
the instrument's Spanish wording is pasted there (the dialog says so), and the behavior's name, plural phrase and
definition come from the targets table as written. Personalization in Spanish: "el estudiante" takes the name, "la conducta
problemática" the behavior's term. The library translates with a table inside its runtime (`TXT`), so a page file carries
its own words. IN-1's, SV-1's and CF-1's pages stay English for now. Checked by four new checks in `qa/respond-test.js`.

### v21.68: the student's photo on the bar, and Form DM-1's flags on the case line

**The student's photo.** The circle at the left of the bar holds the student's photo: tap it to take one with the
camera or choose one from the library (on the iPad the picker offers both). The picture is brought to 240 px square
(about 15 KB) and kept in the packet, so it travels in the case file, the packet file and Autosave's copy, and nowhere
else: not in the offline copy, not in a link. It shows on the bar, on the folded summary line and on the crumb while a
form is open, so the case you are in stays in sight; with no photo the circle shows the student's initials, or a camera
before a name is typed. Tapping a photo opens its dialog: Change the photo, Take it off. Form IA-1 takes the case's
photo for its respondent pages while it holds no photo of its own (the dialog's Remove the photo still works). A case
file with a forged photo (not a JPEG, PNG or WebP data URL, or over 600 KB) opens without one. Close case takes it off
with the details. In the shell: `state.photo`, `setPhoto`, `paintPhoto`, `photoFromFile`, `packet().photo`; in IA-1
the packet listener; the Autosave's change hash counts the photo.

**Form DM-1's flags on the case line.** DM-1's facts (`__nbhFactsOut`) now carry `profile.flags`: the safety precautions
ticked (Elopement, Self-injury, Aggression, Pica, Water, Traffic, Choking, Climbing / falls, Goes with strangers, Medical
emergency, Physical management restrictions, Other precaution), the photo/media permission when it is No, and a crisis
plan that is outdated or missing. The case line shows them in amber ("Safety: Elopement, Water · No photo/media
permission · Crisis plan outdated (DM-1)"), the folded line in short, and setting a photo while the permission is No
says so once. Checked by `qa/photo-flags-test.js` (16 checks).

### v21.69: Form QS-1, the Staff Quick Start

The forty-sixth form, built from parts (`tools/forms/QS-1`). Four letter pages for the adults who run the plan
every day, and a fifth, the flow sheet, when it is on: page one, who the student is, where things stand (tiles
with a number each), the three to five things that matter most, why the behavior happens in three boxes, and
health and safety; page two, a day with the student card by card, one routine spelled out, how to talk (chips
and a say-this-not-that table), the skills already there, and "something new?"; page three, reading the moment,
tier by tier what you see, do and say, a line every adult must know, and the consequence box when the team has
one; page four, the do-and-don't non-negotiables, what is recorded every school day and how, the first weeks
advancing on the data, who to call, and "one voice". Headings follow the pronouns and the name the staff use.

Inside the workstation, or from a case file, the case fills the empty fields: DM-1's profile and precautions
(the who box, the health line, a day card, a don't), TB-1's targets (the record table, the skills, the "may"
box), FS-1's function (the "which gets" box), TD-1's plan (the five things, the day cards, the earliest sign and
the response rows, a do and a don't), CR-1's stages (the tiers), GB-1's current levels and criteria (the tiles,
the "next" lines of the first weeks, a skill), PA-1's menu (a who line), and the case BCBA as a call card. Every
placed line is marked "from the plan, rewrite" until its words change; the Setup view counts what is still
marked, lists the technical wording left on the pages (EB-1's list), and says when a page runs over by about how
many lines. From the case on the toolbar picks items into fields already in use. The form never translates the
plan into plain language: that is the BCBA's judgement, and the mark is the reminder.

The flow sheet is drawn from the pages, never kept by hand: "what do you see?" at the top, then three branches
(working or just flickering, with the routines and the earliest sign; the request, honored; the behavior tier by
tier, ending in the call and the crisis plan, Form CR-1), and the recovery row under all three. Where it and the
plan differ, the plan governs, and the page says so with the date it was drawn.

Registered in the index (Implementation, after EB-1, and on the case map), in the builders (46 forms; the RPS
build's counts), the gate's wording and the README. Checked by `qa/qs1-test.js` (15 checks: the simulation builds
five pages that each fit one letter page by the form's own measure and print as five PDF pages; the jargon list;
the flow sheet off; Save data and Open data with the marks; inside the shell the case fills the fields, each
marked, a rewrite takes the mark off, the packet bar's student reaches Setup, no page errors). Not yet taken from
the case: the day-by-day counts on DD-1 (the tiles come from GB-1's current levels until DD-1 exposes its record).

### v21.70: Form DD-1's printed sheet, eight behaviors to a landscape page

- **The widths travel with the print.** The printed widths were set by the form when it heard the browser start to print.
  Safari on the iPad, printing from inside the workstation, did not always tell it, so the sheet printed at its screen
  widths (172 px a behavior) and the right-hand columns ran off the page. The widths are now also a print style, in
  percentages of the page, rewritten whenever the sheet changes (`ddPaperScheme`, `ddPrintStyle`); any print of the
  sheet uses them: the form on its own, Print this form, the master print.
- **Narrower Date and Obs. min.** The weekday prints small above the date ("TUE" over "10/13"), so Date needs 36 px of a
  960 px landscape page (was 56); Obs. min 26 (was 32). Phase change 54, Condition 76, Daily notes at least 96. With
  eight count behaviors in landscape each gets about 84 px; in portrait about 60, with the names set a size smaller.
- **On paper: Behaviors only** (Data tab, beside Column width) leaves Phase change, Condition name and Daily notes off the
  printed sheet, giving the behaviors the room: eight count behaviors get about 110 px each in landscape. The choice is
  saved with the file; the screen keeps every column.
- **Names wrap at word breaks** and after a slash ("Public Urinating/ Defecating"), never inside a word; with seven or more
  columns they print a size smaller.
- **Weekdays only** (beside Add days, on by default, saved with the file): Add days adds school days, skipping Saturday and
  Sunday, so ten days from a Tuesday run to the second Monday.
- Checked by `qa/dd1-sheet-test.js` (one new check: the percentages, Behaviors only, the weekday, the weekend skipped).

### v21.71: placing the student's photo, and the photo on Form DD-1's sheet

- **Place the photo.** A picture chosen for the bar now opens *Place the photo*: it fills a square under a circle; drag it
  (or use the arrow keys) to move it, and the Size slider makes it up to four times bigger. *Use this photo* keeps what is
  in the square (240 px, as before); *Cancel* keeps the photo there was. A tall picture starts a little below its top,
  where a face usually is, instead of at its middle, which is what cut heads off before.
- **Adjust position** (in the photo dialog, beside Change the photo) opens the picture again. For the rest of the session
  it is the whole picture as chosen (kept in memory only, at most 1000 px); after the case is reopened it is the kept
  240 px square, which can still be moved and enlarged. A photo placed before v21.71 is best chosen again.
- **Form DD-1's sheet.** DD-1 holding no photo of its own takes the case's photo, shows it round beside the student's
  name above the data sheet (56 px on screen, 50 px printed), follows a new one and drops it when the case's is taken
  off. A photo chosen on DD-1's Client & behaviors tab stays DD-1's own. Every open form now hears of a new photo at
  once (it was Form IA-1 only).
- Checked by `qa/photo-crop-test.js` (8 checks) and `qa/photo-flags-test.js` (updated for the placing step).

### v21.72: Form DD-1's printed sheet starts under the letterhead

The top of the printed data sheet said who and what three times: the print head ("Chris — Daily data sheet", with its
rules), the "Daily data" title, and the student line. On paper the student line is now the only heading: the photo, the
name and details on the left, **Data 10/13 – 10/23** and the observation window on the right. The print head and the
title are left off when the Daily data tab prints (the Graphs tab keeps its print head), the "Add client details" hint
stays on screen, and "Obs. min: the minutes observed that day" moves into the key under the sheet. A landscape page
with eight behaviors holds 20 rows instead of 17. Checked by `qa/dd1-sheet-test.js` (one new check).

### v21.73: Form DD-1's units row stays in the heading on paper

On screen the units row ("(total per day)") and the Date column stay in view as the sheet scrolls (they are
`position: sticky`). Safari on the iPad printed them where the screen had them stuck, so a sheet printed from a
scrolled page had its units row inside the first day's row and its Date heading moved. On paper every cell of the
daily and interval sheets now sits where the table puts it; the screen keeps them in view. Checked by
`qa/dd1-sheet-test.js` (one new check).

### v21.74: the record goes further, a blank week, incidents, a week summary, steps from the quick start, a print check

- **Form DD-1 shares its record with the case.** While it is open, the last 20 school days with data (each behavior's
  days, mean, total and zero days) go to the case beside the target behaviors and the goals, and the line under the bar
  says "Data: 20 school days". Form QS-1's "Where he is now" tiles come from it (the mean a day, the percent for a
  skill), and fall back to the levels on Form GB-1's goals when Form DD-1 is not open. Form SM-1 shares its Record the
  same way (each day's share of the points and whether the goal was met), and Form QS-1 shares its non-negotiables and
  its tiers.
- **A blank week to print (Form DD-1).** *Blank week to print*, beside *Print this sheet*, shows five empty, dated
  school days (Monday to Friday of next week; any week and 5 to 20 days can be picked) in place of the record. Nothing
  in it can be typed into and the record is not changed; *Back to the data* returns to it.
- **A slimmer letterhead on the data sheet.** On paper the letterhead of the data sheet is one line (a smaller logo, the
  title beside the form line) and each row a quarter inch, still room to write a number. A landscape page of blank days
  holds 24 rows instead of 21.
- **The whole photo is kept in the case file.** The picture behind the student's photo (at most 800 px) is saved beside
  the packet in the case file, the packet file and the safety copies, never sent to a form, so *Adjust position* works
  on the whole picture after a case is reopened too.
- **Form QS-1 follows the plan.** A field still holding the plan's words (marked "from the plan, rewrite") now changes
  when the plan changes. A field rewritten here keeps its words; when the plan's words for it change, an amber note
  under it gives them, with *Use the plan's words* and *Keep mine*. The note does not print.
- **The week summary (Form DD-1).** *Week summary* shows one page for the team meeting: each behavior this week against
  last week (the total and the mean a day for a count, the mean for the rest), the change marked green or red by the
  behavior's direction, the aim, Form SM-1's point sheet for the week when it is in the case, the incidents, the phase
  changes and the daily notes, and a box for what the team decided, kept with the data file by week. *Print it* prints
  only the summary.
- **Form TI-1 takes the quick start's non-negotiables.** An empty step list takes Form QS-1's non-negotiables as its
  steps, each do beside the don't it replaces ("Say yes to the break card at once (not: make him wait)"). *Add the Quick
  Start's non-negotiables* adds the ones not yet on a list in use.
- **The incident log (Form DD-1).** Under the sheet, *Log an incident* keeps the date and time, the behavior and the
  tier (Form QS-1's tiers when it is in the case, else Form CR-1's stages, else Tier 1 to 3 and the crisis plan), what
  came before, what happened and the exact words said, what the adults did, how it ended, whether home and the BCBA
  were told, and who recorded it. For a behavior counted by frequency it adds one to that day's count (adding the day
  when it is not on the sheet); an edit or a delete takes the one off again. *Note for home* writes a short note in
  plain words from it (the exact words and the tier left off) to read over and copy; nothing is sent. The log travels
  in the data file and prints with the sheet only when *Print the incidents with the sheet* is ticked.
- **A print check for Safari.** Help (Printing and the PDF) and the command box (*Print check*) open a list to tick
  through in Safari's print window: scroll to the top, US Letter, the orientation, backgrounds, headers and footers off
  (Mac), the page count, the student's name, the photo, saving a PDF on the iPad.

Checked by `qa/v2174-test.js` (27 checks).

### v21.75: the record used further, the week in one print, Today and the hand-over check

- **Form PR-1 from the case.** Inside the workstation, with Form DD-1 or Form TI-1 in the case, a bar above the review
  runs PR-1's own imports in one tap (*Fill question 1 from TI-1*, *Fill question 2 from DD-1*); each still asks before
  it changes an entry already made. A new box, *Also in the review period*, is written from the case over DD-1's
  current condition: the incidents logged (by tier, and how many home was told about), the behaviors at their aim for
  the days the criterion asks, Form SM-1's point sheet and Form TI-1's observations. It follows the case until it is
  rewritten.
- **DD-1's incidents on the scatterplot and on ABC-1.** *Place DD-1's incidents* on the scatterplot marks each
  incident of the behavior on the sheet in its interval and on its day (one mark more; in count mode one more on the
  count), once. *Add DD-1's incidents* on ABC-1 adds each as a narrative-only incident (the behavior under Other; the
  before, what happened, the words, what adults did and how it ended in the narrative), once. As before, narrative-only
  incidents are kept and listed but not counted in the conditional probabilities until they are coded with Edit.
- **Form CN-1 starts from the week summary.** A note being written (undated, or dated in the week or after) takes,
  into its empty fields, the data reviewed (DD-1's week and the latest TI-1), the first reduction target's level
  against its aim, what the week looked like against the last (each behavior, the incidents, the phase changes, what
  the team decided) and the latest integrity observation. *Start from the week summary* does it for any note.
- **Form TI-1 on DD-1's graphs.** TI-1 now shares each scored observation's date, type and integrity. Form DD-1 ticks
  them along the top of its graphs ("TI 86%"), names the week's in the week summary, and the line under the bar says
  "Integrity: 4 observations".
- **Form FS-1 quotes DD-1's baseline.** A target's *level during the assessment*, when empty, is the mean of DD-1's
  first condition for the behavior of that name ("10 a day (mean of 6 school days of baseline, 9/14 to 9/21; Form
  DD-1)"). A level typed is kept.
- **Today.** *Today* on the bar lists what needs you in the case: what is due, incidents home has not been told about,
  no data on DD-1 for three school days, a behavior at its aim (time to raise the criterion), no TI-1 check for two
  weeks or the last one under the criterion; each with the form to open.
- **The end of the week in one print.** From Today, or *End of the week* in the command box: one print of DD-1's week
  summary for the latest week with data, next week's blank sheet on a page of its own, and Form SM-1's sheets, under
  their own cover. The forms are put back as they were.
- **The hand-over check.** From Today, or *Hand-over check* in the command box: what a case handed on should hold and
  does not (no consent date on Form IC-1, no target behaviors or one without a definition, no goals, a plan with no
  crisis plan or one DM-1 records as outdated, the photo kept without photo permission, incidents home has not been
  told about). *Close case* lists the same before it saves and closes (*Save and close anyway*). Form IC-1 now shares its
  consent and signature dates for it.

- **The audit of four older forms** (the scatterplot, ABC-1, the reinforcer assessment and variable isolation): no
  script errors, no wrong figures and no print cut off were found; what was fixed:
  - *Every form and the workstation*: iPad Safari no longer zooms into a field when it is tapped (the page's viewport
    is `maximum-scale=1`; pinch zoom still works on the iPad). The fields were smaller than the 16 px Safari asks for.
  - *Scatterplot*: a sheet for each target behavior from the case, each with its definition, example and
    non-example (when no sheet holds a mark yet); on paper each grid names the student, the behavior and the days,
    since the grid often starts a page of its own; the legend stays with the grid; a sheet wider than the window fades
    at its right edge to show there is more.
  - *ABC-1*: an antecedent resting on an empty cell is marked *thin*, as the consequence table already was; a negative
    association reads *strong (less likely)* instead of looking like a positive one; the pickers are a finger high.
  - *Reinforcer assessment*: the progressive-ratio table scrolls inside its box instead of the whole page, and a view
    chosen re-fits the page; the stimuli under test come from Form PA-1's menu (rank and type) and the problem
    behavior from Form TB-1; the problem behavior, the agreement and the problem behavior summary are full-width
    boxes that wrap and stay whole on paper; the concurrent-operants headings are no longer cut at ten letters.
  - *Variable isolation*: each rating is a finger-sized target; the measurement comes from the case with the
    definition.

Checked by `qa/v2175-test.js` (25 checks).

### v21.76: Form DD-1 reads the team's Google Sheet

The team's daily sheet (the Behavior-Charts template: one row per school day; a *(Total Per Day)* column for each
count target; *Occurrences(+)*, *Opportunities* and *%* for each target scored out of opportunities; the definitions,
measurement and observation length above them) now fills Form DD-1 and keeps it current, so nothing is copied by hand.

- **How it reads.** On the *Daily data* tab, *Link a Google Sheet* asks for the sheet's link, signs in to Google as you
  (read-only: `spreadsheets.readonly`), lists the sheet's tabs that have target columns (the "Reduction and
  Acquisition TBx" tabs; the ABC and scatterplot tabs are left alone; hidden tabs too) with the targets and days found,
  and *Link and read* takes them. Any number of targets is read (1 to 8 or more, a tab or several). The numbers go
  from Google straight to the iPad; no other website, newsomebh.com included, sees them. The sign-in lasts an hour
  (Google's rule) and is never saved in a file; after it, *Sign in to Google* on the bar reads again in one tap.
- **The sheet wins.** Each reading writes the sheet's days into the record: a day the record already has takes the
  sheet's numbers; a day it does not have is added. A target the record does not have becomes a row of its own, with
  its kind (from the band above it: Reduction, Acquisition, Replacement), measurement and definition; a record not used
  yet (no days, only the three example rows) takes the sheet's targets in their place. Cells the sheet wrote carry a
  green underline. It reads again when the form opens and every five minutes while it is on screen.
- **Set it aside.** *Use the sheet's data* off puts the record back as it was without the sheet: what was typed for
  the sheet's days comes back and the days only the sheet had are taken out (the target rows stay, with their aims and
  criteria). On again brings the sheet back. *Change* links another sheet or other tabs; *Unlink* takes the sheet out.
- **Checks.** A sheet whose student (cell A1) shares no name with the record's student is not read until you say it is
  the same student. A target the sheet scores one way and the record another, with the record's own numbers in it, is
  left as the record has it and named on the bar. A record kept in intervals is not filled from daily totals.
- **Where it works.** The workstation opened from its website (or installed from it). The one-file edition opened from
  Files cannot sign in to Google.

**Setting it up (once).** Google needs a sign-in key (an OAuth client ID) for the workstation's website:

1. Go to console.cloud.google.com and sign in (with the district account if it may create projects; otherwise with a
   personal Google account). Create a project, for example "NBH Workstation".
2. *APIs & Services › Library*: find **Google Sheets API** and press *Enable*.
3. *Google Auth Platform* (formerly *OAuth consent screen*): give the app a name and a support email. Audience:
   *Internal* if the project belongs to the district's Google organization; otherwise *External*, and add your district
   address under *Test users*. Under *Data access* add the scope `.../auth/spreadsheets.readonly`.
4. *Clients › Create client › Web application*. Under *Authorized JavaScript origins* add `https://newsomebh.com`. Create,
   and copy the **Client ID** (it ends in `.apps.googleusercontent.com`; it is not a secret).
5. In Form DD-1: *Link a Google Sheet*, paste the Client ID (asked once on each device), paste the student's sheet link,
   *Sign in and find the tabs*. Google may say it has not verified the app: it is your own; continue.
6. If Google answers "Access blocked" or that your administrator has not approved the app, the district's IT can allow
   it: *Admin console › Security › Access and data control › API controls › Manage third-party app access › Add app ›
   OAuth App Name Or Client ID*, paste the Client ID, and set it to *Trusted* (or *Limited* to Google Sheets).

Checked by `qa/v2176-test.js` (16 checks, with Google's sign-in and the Sheets API simulated).

### v21.77: Form TV-1, the training video, further

- **Where things stand.** A new segment (after *Function & Data*) takes Form DD-1's record: each behavior's level before
  the plan and now (the first condition and the latest), and whether a goal has held for the days the plan asks. The
  card shows a chart drawn here (a panel a behavior, up to four, each on its own scale, the goal dashed) as its picture,
  so it is in every look, in the graphics window and in the saved file; the list gives the numbers; the teleprompter
  says them. With one condition only, the bar is *Lately*.
- **Every day, and step by step (Form QS-1).** *Every Day* (after the proactive strategies) is the quick start's
  non-negotiables as a card of two columns, *Do* with a tick and *Don't* with a cross (the layout *Do and don't, in two
  columns*, in both looks); five to a card. *Step by Step* (after the response plan) is a card naming the tiers, then a
  card a tier that builds a point a click: *See*, *Do*, *Say* (QS-1 now hands on the words to say). The long words of
  these cards go in the teleprompter's own field, so the panel keeps to the card.
- **Drafted for staff or a family.** *Drafted for* on Setup: Automatic (a family when *Who the training is for* names a
  family, a parent, a caregiver or home), Staff, or A family. A family's draft opens each part in plain words, and
  leaves out the crisis plan's stages, the crisis line and the crisis tiers (the first signs, the behavior and the
  recovery stay).
- **Plain-language check.** On the Script, the plan's technical terms found in what is said and on the cards
  (reinforcement, antecedent, replacement behavior, extinction, baseline, FCT and some fifty more), each with plain
  words, the cards it is on, *Replace* (in every card; Undo brings it back) and *Keep* (off the list on purpose).
- **Before you record (Setup).** The audience; the photos on the cards against Form DM-1's photo or media permission
  (red when DM-1 records No and a card shows a photo, amber when nothing is recorded; the chart and pictograms are not
  photos); the name; the technical words; the length against the target. **Initials only** puts the student's
  initials (M. R.) in place of the name in the script, on the tag and in every later draft.
- **Target length.** *Target length, in minutes* on Setup: the summary says on target, over or under (within 10% or 30
  seconds is on target); each segment shows its share of the time, and the longest segment and the longest card are
  marked.
- **Check quiz.** *Make the check quiz* (on the Script, under the rows) writes five to eight questions from the case
  (the definitions, the function, the replacement, the first sign, what never to do, the do and don't list, a tier,
  the data) and the script's takeaways, each with its answer among the choices. *Print the quiz* prints it with boxes
  and the answer key on a page of its own; *For Google Forms (CSV)* and *Copy the rows for a sheet* give a row a
  question (question, type, four options, the correct answer, points), for a Google Forms quiz add-on or to type in.
- **The rehearsal steps (Form ST-1).** The script's proactive strategies, reinforcement, do list, response steps and
  tiers become the rehearsal steps (the response steps and the tiers critical; antecedent or consequence as on TI-1).
  They go out with the case: Form ST-1 takes them for its step list when that list is empty (no step written, no round
  coded), and leaves a list already started as it is. *Print the rehearsal checklist* prints them with boxes for
  modeled, rehearsed, correct and feedback.
- **Retakes.** On the teleprompter, **R**, the *Retake* button, or the clicker's Next held down marks the segment on
  screen to record again (the held clicker goes back to the card it was pressed on). With the clock running, each mark
  keeps its time and when its segment began; *The retakes (CSV)* lists them for the edit. The marks are kept in the
  saved file; starting the clock again begins a new list.

Checked by `qa/v2177-test.js` (31 checks; the simulated student Mateo Rivera); `qa/tv1-test.js` counts fourteen
segments now.

### v21.78: the case carried further, Today and the hand-over, the iPad

**The case carries more, so less is typed twice.** Every fill takes only empty fields; nothing you typed is replaced.
- *The FBA chain.* IA-1, IN-1, OB-1, ABC-1, SP-1, VI-1 and EA-1 each give their result to the case (the method, the
  dates, the function, the strength, the form's own statement). Form FS-1 takes a row of its evidence table for each
  (never twice), its consent date from IC-1 and the statements into empty hypothesis rows; Form EA-1 takes the
  hypothesis carried in, the consent, the medications, the definition, the urgency and the precursor.
- *The plan and safety.* Form TD-1 takes the replacement behavior, the precursor, the preferred items, the reinforcer and
  EO, the safety level, the baseline and EA-1's function and design. Form CR-1 takes the dangerous behavior, the
  precursor, the stages (from the plan, when none is written), the related plans and the student's health and signals.
  Form EB-1 takes the plan's lines (see, ask, after, respond, never, the early signs, what helps, when and whom to call).
- *Smaller fills.* DM-1 now shares the student's health (medications, prescriber, allergies, conditions) and the IEP and
  reevaluation dates; RR-1, MS-1, CR-1 and EA-1 take them. IC-1's consent date goes to FS-1, EA-1, RR-1 and CT-1. TI-1's
  integrity goes to CF-1, BC-1 and PD-1. PA-1's menu goes to AD-1, DT-1 and VS-1 (labels only; check the pictures). The
  definitions go to MT-1, GC-1, BC-1 and IC-1; DT-1's "what the student does instead of waiting" takes the target
  behaviors. TV-1's rehearsal steps go to CT-1 as well as ST-1.
- *New in the case:* PR-1's review (its decision, its rules, the exit monitoring), RR-1's records (removal days this
  year, the manifestation determination, the IEP and reevaluation dates), HD-1's home sheets (sent, due back, came back)
  and their counts, IM-1's injuries and open follow-ups, SA-1's skill programs, and CR-1's restraint and seclusion
  notice deadlines. The case line names each.

**Restraint and seclusion (Florida s. 1003.573).** Form DD-1's incident log has *Physical intervention*: none, physical
escort, restraint or seclusion. A restraint or seclusion saved there tells you that Form CR-1 starts the notice clock;
CR-1 takes the incident into its log (once) and its deadlines (the 24-hour report, the parent the same day, the written
report within 3 school days, the crisis plan at the second restraint in a semester) reach Today and the hand-over check.
With no release time entered, the 24-hour report is counted from when the restraint began (never later than the law).

**Today** now also lists: the restraint and seclusion notices due or overdue (first); IM-1's open injury follow-ups;
*Decision*: a behavior judged after ten school days in its phase that has not moved by PR-1's progress threshold (20%
from the level before the plan by default), with integrity at its criterion: review the plan; with integrity under it:
retrain first; with no TI-1 check: check the plan is run before changing it. *Timeline*: the FBA due 60 days from consent
until FS-1 holds a function (Rule 6A-6.0331); the plan review (PR-1's next date, or six weeks after the last review or
the start of the plan); the check after exit; the annual IEP review (30 days ahead) and the reevaluation (45 days); eight
or more removal days this year (at ten, a manifestation determination and a review of the plan, 34 CFR 300.530) and a
review after a manifestation determination. *Home*: home sheets not back by their date.

**The hand-over check** adds the restraint notices not done, an overdue plan review and the home sheets not back, and
offers **Transition summary: print it**: one page for the next BCBA (history, targets with definitions, the function and
its evidence, the plan, where things stand, what worked and what did not yet, the open deadlines, the contacts).

**More in the forms.** Form GB-1's **Progress report** (IDEA 34 CFR 300.320(a)(3)): for a period (the last nine weeks by
default), each goal's current level from the case's data or skill programs against its criterion, a progress code
picked from the data (changeable), a sentence for the family, Print and Copy. Form DD-1's **Note for home (this week)**:
one good thing first, each behavior in plain words, what is next, the number of incidents only; editable, Print, Copy.
Form HD-1's sheets carry *Sent home*, *Due back* and *Came back*; DD-1 offers to bring the home counts in as a home
series (open purple diamonds where the measure matches, never mixed into the school counts or the analysis).

**Fixes.** Form SA-1 kept losing the *Delay (s) or level* row when a saved file was opened: it is kept now. Form TV-1's
*Follow my words* starts with no connection once the recogniser has been downloaded (the manifest and its three scripts
are kept on the device with the model).

**The iPad.** The packet bar keeps one row at 1180, 1133 and 1024 px (the details shrink to the row, *Read a document* is
its icon), so the form starts where it did. The form list's *Packet* row and its Hide button stay pinned at the top as the
list scrolls; with the list put away a tab on the left edge brings it back (a tap, or a swipe right on it), and a swipe
left on the list puts it away. Tap targets: a checkbox or radio is 24 px, a checkbox label's tap area 36 px high, narrow
grid buttons 34 px wide; a tap anywhere in a table cell that holds one checkbox or radio ticks it (in the forms), and a
tap beside a form's tick box in the list ticks it. Screen only: printing is unchanged.

**Housekeeping.** The build checks (tools/blocks/patch-pwa.py, patch-autosave.py) count the forms from index.html
instead of a fixed 44. Tests that only printed their round trips now fail when one differs (sa1, si1, da1, sr1, vs1,
gc1, hd1, im1, pd1); tk1, master33, sprint-a2 (IA-1 since v21.64) and v2134-verify (DD-1's Walkthrough) are current.

Checked by `qa/v2178-a-test.js`, `-b`, `-c1`, `-c2`, `-d1`, `-d2` (the forms), `qa/v2178-shell-test.js` (Today, the hand-over,
the summary), `qa/v2178-flow-test.js` (OB-1 and EA-1 into FS-1 through the workstation), `qa/v2178-rail-test.js`,
`qa/v2178-touch-test.js` and `qa/v2178-asr-test.js`; `qa/sprint-a8-test.js` (the bars) passes again.

### v21.79: the caseload

**Caseload** (the people button beside Today in the bar over the form, in Today, and in Find a form or command) lists
every student kept on this iPad, the most urgent first: the student (and number), the school, when the case was last
saved, the last day of data, and how many things need you, with the most pressing kind. Above the list, **what needs you
across the caseload**: each student's Today items in one list (the restraint and seclusion notices first, then injuries,
decisions, timelines, what is due, home), each with Open, which opens that student's case and the form the item names.

- *How a student gets here.* Each Save case (and Close case, which saves first) keeps a copy of that student's case, the
  same as the case file, with a summary read from it then (what Today says, the last day of data). A student is known by
  their name and student number; saving again replaces their copy. *Open* opens the case from its copy, as Open case
  does from a file (what is open is replaced, after the question), and the case is as it was saved.
- *Privacy.* The copies are kept in this browser on this device only (a store of its own); nothing is sent anywhere.
  *Initials only* shows initials and hides the student numbers on the screen. *Do not keep cases on this device* stops
  new copies (the ones kept stay until removed). *Remove* takes a student off this device's list; their case files are
  not touched. The case files you save remain the record.
- *Keeping it.* Safari can clear a website's storage after some weeks without a visit; the workstation installed on the
  Home Screen keeps it. The case on screen has its summary brought up to date when Caseload opens.

Checked by `qa/v2179-test.js` (two simulated students kept, listed, initials only, opened from the list, removed, and
nothing kept when it is turned off); `qa/sprint-a8-test.js` (the bars keep one row with the new button).

### v21.80: the morning refresh, the caseload backup, assent, settings and probes

**Read every linked sheet** (Caseload). Each student kept on this iPad whose Form DD-1 is linked to a Google Sheet, with
*Use the sheet's data* ticked, has their sheet read in one go: the workstation loads that student's DD-1 out of sight,
puts their saved record back in it and DD-1 reads the sheet exactly as it does when open (the sheet wins for its days,
the marks stay). Their copy on this iPad then holds the new days and Caseload shows what needs you from them.

- *The sign-in.* The first read asks for Google's sign-in (the tap opens Google's window); it is kept in this tab only,
  as in DD-1, and never written into a file. The sign-in key is the one given once in DD-1 (Setup: the Google Sheets link).
  Reading works in the website edition, where Google's sign-in is allowed; the one-file edition says so.
- *The student on screen.* Their open Form DD-1 reads its own sheet; the next Save case keeps it.
- *What comes back.* Caseload says which sheets were read (with the days and the last date) and which were not, and why
  (signed out, the sheet for another student, Use the sheet off).

**Back up the caseload** writes one file, `CASELOAD_<date>.json`, holding every student kept on this iPad (each as their
case file). **Restore a backup** puts one back after asking: students not here are added, and for a student on both,
the newer copy wins. No case file is touched. A week after the last backup (or with none yet), Today shows a *Backup*
item with a Back up button. Keep the backup with the case files (Files, the school drive): it holds every student's case.

**Form DD-1, per day** (the *Assent · day* column of the daily data): an **Assent** mark (Agreed, Refused, Withdrew), and
in the day's details the **Setting** (Classroom, Specials, Lunch, Recess, Bus, Home, or any typed), **Collected by**, and a
**Probe** mark (Generalization, Maintenance). They are labels only: the counts, the means and the analysis do not change.
They are kept in the data file and the CSV (four columns at the end when any day has one); the printed sheet has a narrow
Assent column when any day is marked; Graphs & analysis has a **By setting** table (each behavior's mean per setting, with
the days) and a G or M over each probe day. A labelled day keeps its labels through each Google Sheet read. Old files
open unchanged.

**Form PA-1**: *Next reassessment due*, a date beside the reassessment schedule, typed or set from the schedule (weekly,
every N weeks, monthly, quarterly, each grading period, and so on) counted from the latest dated session the form holds.
With no date typed, the date worked out from the schedule is the one the case uses.

**Form PR-1** reads DD-1's assent marks (refused and withdrew over the last days marked, with a caution at three or more
of the last ten) under *Also in the review period*, and on *Fading & exit* the maintenance probes since the exit and
whether one is due.

**Today** (and so Caseload) adds: the preference reassessment due within a week or overdue (Form PA-1); **Assent** when
the student refused or withdrew assent on three or more of the last ten days marked (ranked after Decision); after an exit
(Form PR-1), a Decision item when the days since the exit average above the level set for going back to the plan (the
target named in that level, or the first reduction target); and a maintenance probe on DD-1 counts as the check after
exit, so that reminder goes.

*Fixed:* Save case now reads the case facts from the forms before writing the file, so a case opened again does not
send changed facts to the forms loading quietly (which could fill a form anew and mark the case unsaved).

Checked by `qa/v2180-test.js` (the refresh with Google simulated: signed in, signed out, the student on screen; the hidden
form leaves nothing behind; the backup, the restore and the reminder; the new Today items; PA-1's date reaching the case),
`qa/v2180-e-test.js` (DD-1: the refresh hook, the marks through the table and the details, Save data and open, the CSV,
the facts, By setting, probes, the print column, phone and iPad widths), `qa/v2180-f-test.js` (PA-1's date and the
schedule, PR-1's assent and probes), and `qa/case-open-test.js`.

### v21.81: fixes that keep work safe, and a lighter load on the iPad

From a review of the workstation in four parts (the day on the iPad, data safety, the clinical packet, the iPad's
performance). This release fixes what could lose or mix up work, and the iPad's memory; the clinical gaps follow in v21.82.

**Work kept safe**
- *A form that does not take its saved work.* When a case's form is filled from the file and does not answer (it is
  asked twice, 20 seconds each), the case keeps that form's work as the file holds it, Save case writes that copy (not the
  empty form), and the case is not marked saved over it. A note says to close the form and open it again.
- *Caseload's Open.* For the student already on screen, their case stays as it is and the form asked for opens. For another
  student, with work on screen not saved to a file: *Save first*, *Switch anyway* (the work stays in this iPad's safety
  copy, where Open case offers it) or *Cancel*. *Open TI-1* (or any form) now opens that form, in the case or not.
- *Close on the crumb.* A form holding work asks *Close* (its work stays in the case: Save case writes it, and it is filled
  again when opened) or *Remove from the case*. A blank form just closes. After closing, the form viewed before it is shown.
- *The caseload copy.* A form that did not answer Save case keeps its last copy on the caseload.
- *No false "Unsaved work found".* A case saved and unchanged writes no safety copy when the iPad leaves the page.
- *Read every linked sheet,* for the student on screen, reads the Form DD-1 of the case that is open, never the iPad's
  older copy; and a Save case of a student made while their sheet is read wins over the read.
- *Form DD-1 and Google Sheets.* A sheet is taken only for the same student: when both carry a student ID the IDs decide;
  otherwise the first and last name must both match (Rivera, Mateo is the same; Lucas Rivera is not). *It is the same
  student* answers for that exact sheet student only. The unattended read (Caseload) never takes a mismatch. An incident
  counted on a day the sheet writes is added on top of the sheet's number after every read, and taken off cleanly.

**The iPad's memory**
- At most eight forms stay loaded. Past that, the form viewed longest ago (never the one on screen or side by side) is put
  away: its work read and kept in the case as a form not loaded yet, and filled again when opened (no data is dropped;
  Save case writes it). Opening a case loads its forms quietly only up to eight; the others load when opened.
- Build master print no longer leaves a hidden copy of each form it loaded; Diagnostics' file check loads four forms at a
  time instead of all 46 at once.

**On screen and on paper**
- Forms open on their working tab (Setup, Student, Consent...), with the Guide last (DM-1, EA-1, IA-1, IC-1, MS-1, PA-1,
  RR-1, RA-1, TB-1, TD-1, VI-1; the Guide after the Walkthrough in TK-1, AD-1, DT-1; ABC-1's Methods & references last).
- TD-1's Print / Save as PDF leaves out the Guide and the References unless *Include the guide and references* is ticked
  (kept with the form's data); the master print does the same.
- On the iPad in portrait: text in the forms and the workstation no smaller than 13 px, and buttons 44 pt tall.

Checked by `qa/v2181-test.js` (each shell fix, the memory limit, master print, the file check), `qa/v2181-g-test.js`
(DD-1's student check and the counted incidents), `qa/v2181-h-test.js` (tab order, TD-1's print with and without the tick).

### v21.82: the clinical gaps in the packet

From the same review's clinical part: the steps that had no record, the forms that did not feed the next, and what the
FBA report and the BIP left out.

- **The team adopting the plan (Form TD-1).** On the final plan sheet, *Adopted by the team*: the meeting date, who
  attended, whether the parent attended (or by phone), the parent's input, the student's participation or views, the prior
  written notice date and the start date, with the plan's version. *Record a revision* adds a row (date, why: modified,
  faded, exit or other, its notice). When Form PR-1 decides to modify, fade or exit after the last version, TD-1 offers the
  row (one tap; never by itself). Today and the hand-over check name a plan in use with no record of its adoption, a PR-1
  decision with no revision recorded, and a revision with no notice date.
- **The BIP's text (TD-1).** The copy for the BIP and the printed plan now carry the student and family considerations
  (culture, home language, interpreter, the student's treatment preference, filled from DM-1 and SI-1 while empty), the
  least restrictive review (what was considered and why the plan is least restrictive), who collects which data, social
  validity (SV-1), the review date and exit criteria (PR-1), and the adoption and revisions.
- **The decision log (Form PR-1).** *Close this review and start the next* keeps the review in a dated log (the decision
  and why, a line of data, integrity, social validity, contextual fit, the actions, the next date), clears the review's own
  fields and moves the date on; actions still open are carried forward. The log prints with the form or alone. Form
  DD-1 labels a phase line with the decision made at its start ("Modified 9/22 (PR-1)"), and the transition summary
  carries the decisions on record. PR-1's section 4 gains the rows *Social validity (SV-1, this period)* and *Contextual
  fit (CF-1, this period)*, filled from those forms while empty; exit readiness now also asks for SV-1's rating after the
  plan at 4.5 of 6 or more and CF-1's fit at 4 or more.
- **The FBA report (Form FS-1)** gains *Background and the Student*: the records (RR-1), strengths, interests and
  communication, health and medications considered, language and culture (DM-1), the student's own view (SI-1) and the
  family's concerns and goals (IN-1), each filled only while empty; SI-1 joins the evidence as an interview, and the
  assent status fills from SI-1.
- **Form SI-1** has *Assent overall* (given, partial, refused, not able) and *What the student would like from a plan*,
  and gives the case the student's own account. **Form DM-1** gives the home language, the interpreter need and the
  cultural considerations. **Form IN-1** gives the parent's concerns and goals.
- **Home language.** When an interpreter is needed or the home language is not English, the family-facing pages (DD-1's
  note for home, GB-1's progress report, HD-1's home sheets, CT-1) show a reminder on screen to have the page translated
  or explained by an interpreter before it goes home. It never prints on the family copy, and nothing is translated.
- **Form GB-1**: each acquisition objective has a type (acquisition, generalization or maintenance), with buttons that add
  a generalization or maintenance objective from the first; the progress report reads DD-1's probe marks and settings.
- **Ready to start** (Today, and Find a form or command): before the plan begins, what the case still needs — consent, the
  function, the plan, its adoption, notice and start date, each implementer trained to criterion (Form ST-1, which now
  gives the case its trainee and the competency decision), contextual fit (CF-1), social validity before the plan (SV-1),
  a crisis plan where DM-1 flags safety, and the daily data. Today names it in the week before the start date.

Checked by `qa/v2182-test.js` (the shell: the new facts, Today, the hand-over check, Ready to start, the summary),
`qa/v2182-i-test.js` (TD-1), `qa/v2182-j-test.js` (PR-1, SV-1, CF-1), `qa/v2182-k-test.js` (FS-1, SI-1, DM-1, IN-1) and
`qa/v2182-l-test.js` (ST-1, GB-1, HD-1, CT-1, DD-1).
