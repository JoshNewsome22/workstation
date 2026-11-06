# The workshop

Everything needed to change the forms without editing generated files by hand.
Paths below are from the repository root. The test server the checks expect:
`http-server . -p 8123 -s -c-1` (any static server on port 8123 works).

## Layout

- `tools/build-release.sh` (v22.17) — builds everything a release ships from `NBH-Workstation/` (the polish, the shared
  message block, the offline list, the RPS edition, the one-file editions) and ends with `tools/check-build.py`.
- `tools/zip-release.sh <folder> [--speech]` (v22.17) — the upload zips: both editions without `nbh-asr/`, the reply box,
  the rewrite relay, and with `--speech` the recogniser's own zips. `README.md`, *Making a release*, has the order.
- `tools/forms/<ID>/` — the source parts of the thirteen forms built from parts
  (CN-1, DA-1, FD-1, GC-1, HD-1, IM-1, QS-1, SA-1, SI-1, SM-1, SR-1, TK-1, TV-1, VS-1): `meta.json`, `toolbar.html`,
  `own.css`, `body.html`, `script.js` (SM-1 and VS-1 keep `script-main.js`, copied to
  `script.js`; TK-1 keeps `script-main.js` and its `script.js` is the vendored QR encoder
  `tools/vendor/qrcode-generator/qrcode.js`, licence header kept, followed by `script-main.js`). Never edit the built file of one of these forms; edit the parts and rebuild.
- `tools/blocks/nbh-pictures.js` — My pictures (v21.62): the camera library Forms VS-1, SM-1, TK-1 and TV-1 load by
  `<script src="nbh-pictures.js">`; its copy must sit beside the forms as `NBH-Workstation/nbh-pictures.js` (the SM-1, TK-1
  and TV-1 build scripts copy it; after a change, or after rebuilding VS-1 alone, copy it by hand:
  `cp tools/blocks/nbh-pictures.js NBH-Workstation/nbh-pictures.js`; `qa/pictures-test.js` checks the two are the same).
- `tools/new-form.py` — assembles a form from CF-1 (the template: its head, generic
  stylesheet, brand system, masthead, print head and shared tail blocks) and a parts folder.
- `tools/polish-one.py` — the post-build polish for one rebuilt form: the polish layer and the
  writing help (through `apply-polish.py`). It stops with the reason, leaving the form unpolished,
  when a block's source fails its checks.
- `tools/apply-polish.py` — the polish pass over a folder (v21.25), which since v21.43 also puts the
  writing help into every form; it is idempotent (run on the shipped forms it changes nothing) and
  leaves `index.html` and `respond.html` alone.
- `tools/blocks/` — the shared blocks every form carries after its own script, and the
  patchers that insert or refresh them (all idempotent; a refresh replaces the existing copy):
  `nbh-case.html` + `patch-case.py` (the case flow: facts, due dates, picker),
  `nbh-guard.html` (unload guard, quick save, spellcheck; kept current in the forms by `patch-autosave.py` since
  v21.44; `patch-guard.py` is retired at v22.12 and stops unless `--force`, because it takes the nbh-ui block with it),
  `nbh-ui.html` + `patch-ui.py` (toasts, notices, questions, progress dots, touch targets,
  the light toolbar inside the workstation), `patch-csv.py` (the `csv?` bridge verb),
  `patch-hook.py` + `hooks/<ID>.js` (per-form case hooks placed inside the form's own script),
  `nbh-wording.js` + `nbh-wording-rules.json` + `nbh-wording-config.json` + `patch-wording.py`
  (the writing help: the Improve wording button and panel; see below), `nbh-link.js` +
  `patch-link.py` (the TK-1/TE-1 link), `tb1-behavior-library.json` + `patch-tb1-library.py`,
  `tb1-replacement-library.json` + `patch-tb1-rlib.py` (v25.67, see *The TB-1 replacement-behavior library* below).
  v21.84: `shared_js.py` (the list of the scripts every form loads from one file beside it, used by the patchers and
  the builds) and `patch-shared.py` (moves inline copies out of forms; see *The shared scripts* below).
  v25.67: `fx2.html` + `patch-fx2.py` (the forms' screen layout on an iPad; see *The screen layout (fx2)* below).
- `tools/relay/` — the rewrite service for the writing help: PHP for newsomebh.com, with its
  tests, its upload zip (`build-zip.sh`) and a README with the upload steps.
- `tools/reply-box/` — the reply box for IA-1's respondent pages (v21.65): `public_html/reply/box.php`
  (PHP 8.1+, no database; boxes, encrypted replies, a read token, CORS for any page), its README with the
  upload steps and `build-zip.sh` → `dist/nbh-reply-box-upload.zip`. Checked end to end by
  `qa/reply-box-test.js`, which runs it with `php -S`.
  `nbh-copies.js` + `nbh-autosave.js` + `patch-autosave.py` (v21.44 Autosave: the store of safety copies, the
  whole-state hash and a form's own copy; it also makes small anchored changes in the bridge and the guard, and
  refreshes the store's copy inside `index.html`; `--check` says whether every file is current).
- `tools/dedupe-logo.py` — one letterhead image per form (v21.36); idempotent.
- `tools/build-rps.py`, `tools/rps-assets/` — the Royal Palm School edition and its lockup
  and tab icon. `tools/build-single.py` — the one-file editions.
- `NBH-Workstation/nbh-doc/` and `NBH-Workstation/nbh-ocr/` — the readers behind the bar's Read a document
  (v21.67), vendored from the npm registry and never edited: `nbh-doc/` is PDF.js 6.4.299 (legacy build,
  `pdf.min.js` and `pdf.worker.min.js`, upstream's `.mjs` files renamed so that every host serves them as JavaScript, Apache-2.0; `LICENSE-pdf.js.txt`), `nbh-ocr/` is Tesseract.js 7.0.0
  (`tesseract.min.js`, `worker.min.js`), tesseract.js-core 6.1.2 (`tesseract-core-simd-lstm.wasm.js`, the
  SIMD single-file build) and the `eng.traineddata.gz` model (tessdata 4.0.0, best int), all Apache-2.0
  (`LICENSE-tesseract.js.txt`, `LICENSE-tesseract-core.txt`). To update, `npm pack pdfjs-dist@<v>`,
  `npm pack tesseract.js@<v> tesseract.js-core@<v>` and copy the same files; `index.html` names them in
  `<meta name="nbh-offline">` so `pwa-sw.py` puts them on the offline list. Checked by `qa/doc-read-test.js`.
- `tools/pictos/`, `tools/scene/`, `tools/polish/` — the picture library, the walkthrough
  scene engine sources and the polish layer sources. `tools/pictos/import-cards.py` brings the
  practice's own card files (SVG, PNG, WebP or JPEG) into the library; then `build-pictos.py`
  rebuilds `nbh-pictos.js`, which is copied into `NBH-Workstation/` (SETUP.md, v21.43).
- `tools/history/` — the one-shot patch scripts that produced earlier versions of
  `index.html` and a few forms (kept as a record; they refuse to run twice).
- `qa/` — the checks. `lib.js` is the shared Playwright helper; outputs go to `qa/out/`
  (ignored by git). Most tests take no arguments: `node qa/all-forms-shell.js`.

## Check that the tools reproduce the shipped forms (v22.12)

    python3 tools/check-build.py

It copies `NBH-Workstation` and `tools/` to a scratch folder, runs every patcher that keeps the forms current (the
polish and writing help, the shared blocks, the case flow, the csv verb, the field names, the letterhead, the TB-1 library
and its replacement-behavior library, the TK-1/TE-1 link, the per-form hooks) and the `--check` of the rest, and compares the result with the folder byte for
byte. It names any file the tools would change and exits 1. Run it before a release; `qa/v2212-build-test.js` runs it.
A block added to a form by hand must sit where the tools leave it: DM-1's home-contact block (`dm-v2195`) and DD-1's
Log it now block (`dd-v2194`) sit just above the polish block, which `apply-polish.py` removes and adds again before
`</body>`.

## The screen layout (fx2, v25.67)

The layout the BCBA approved for the forms on an iPad (v24.92 DM-1, IC-1 and RR-1; v24.93 TB-1, IA-1 and IN-1; v24.95
refined) is one shared block, `tools/blocks/fx2.html`: a `<style id="fx2-v2492">` and a `<script id="fx2-v2492-js">`
(the ids are the v24.92 ones, so earlier notes still find them). It is for the screen only: what it adds is noprint,
and what it changes (a heading's capitals, an example moved out of its box) goes back while the page prints and while
the workstation collects the form for the master print. TD-1 keeps its own, earlier version (v24.89).

    python3 tools/blocks/patch-fx2.py SI-1 OB-1 ...             # put it in, or refresh it (ids or files)
    python3 tools/blocks/patch-fx2.py --check NBH-Workstation/[A-Z]*.html   # exit 1 if a copy differs

`patch-fx2.py` puts the style at the end of the form's `<head>` with the form's switch after it (`html.fx2` and
`data-fx2="<ID>"`, set before the page draws), and the script just above the polish block, which stays last
(`apply-polish.py` takes the polish out and puts it back before `</body>`; a block below it would move). A copy already in
a form is replaced where it stands. What is particular to a form is the form's own and the tool never changes it:

- `<script id="fx2-cfg">window.FX2_CFG = {...}</script>`, after the switch: the form's settings (the list is at the top
  of the shared script): `cards` (the tables that are cards under 1000 px; without it every `.grid` table holding boxes,
  `''` for none), `fields` (grids written `div > label + box`, as the parts-built forms and VI-1 write them), `heads`
  (more headings in sentence case), `keep` (names a heading keeps), `noseg` (where a short list stays a list: grids of
  intervals or trials, ledgers), `eg`, `keepin`, `addtxt`, `count`, `toolbar` (the toolbar on one row, the six only),
  and the six's own features (`contacts`, `packet`, `calendar`, `parent`, `jump`). With no `FX2_CFG` a form still gets
  the generic layout.
- `<style id="fx2-own">`, right after the shared style: the form's own screen rules (IC-1's and IN-1's).

`tools/check-build.py` runs `patch-fx2.py --check`. A parts-built form (SI-1, DA-1) carries its blocks in the built file:
after rebuilding one from its parts, run `patch-fx2.py` on it and put its two own blocks back (they are in git).
`qa/v2567-fx2-g1-test.js` checks the forms that carry it.

## Rebuild a parts form

    python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html tools/forms/DA-1 NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html
    python3 tools/polish-one.py NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html

Rebuilding from the committed parts reproduces the shipped file byte for byte (checked at
v21.36 for all nine, and at v21.43 for all eleven, the writing help included). CF-1 is the template, so a change to a shared head or tail block is
made in every form (by its patcher) and reaches the rebuilt forms through CF-1.

## Refresh a shared block in every form

    python3 tools/blocks/patch-ui.py tools/blocks/nbh-ui.html NBH-Workstation/[A-Z]*.html

The glob `[A-Z]*.html` is every form, without `index.html`. Each patcher prints
`patched` or `already` per form. The case block's refresh is a replacement of the text
between `<style id="nbh-case-css">` and `<style id="nbh-guard-css">` (see `patch-case.py`).

## The TB-1 replacement-behavior library (v25.67)

    python3 tools/blocks/patch-tb1-rlib.py            # write (or refresh) the copy in Form TB-1
    python3 tools/blocks/patch-tb1-rlib.py --check    # change nothing; exit 1 when the copy is missing, doubled or stale

`tools/blocks/tb1-replacement-library.json` (`{version, note, entries}`) holds the replacement behaviors that TB-1's
**Choose from the library** button, beside each target card's Paired replacement behavior field, offers. The tool writes
it into the form as `<script id="tb1-rlib">const TB1_RLIB=…</script>` just before the form's main script, with the same
safeguards as `patch-tb1-library.py`: the JSON is checked before anything is written, every `<` is escaped, and the form
ends with exactly one copy. Never edit the copy in the form by hand. Each entry has `id` (`r-…`), `cat`, `lab`, `aka`
(other names the search reads), `fn` (escape, attention, tangible, automatic, or `any` alone), `pairs` (ids of entries
in `tb1-behavior-library.json`, checked to exist), `def`, `ex` and `nex` (three or more lines each), `measure`, `teach`
(it must say there is no physical guidance beyond what the student allows), `crit` (100% for a per-response measure,
the workstation's standard; an interval, time-sample or duration measure keeps its level) and `note` ("Definition after
…", the studies the entry was written from). No text may write an adult holding a part of the student's body. The
categories (`cat`) are:

- Communication: requests and answers that do what the problem behavior did (a break, help, attention, an item, "all
  done", "stop", "no, thank you", "I don't know", asking to go somewhere).
- Tolerance and waiting: waiting, accepting "no" or "not now", ending a preferred activity, moving on at a signal,
  handing an item over.
- Safety skills: do not touch, leave and tell (a found firearm, medicine, poison or a lighter), asking before eating
  anything found, handing over an inedible item, answering a stranger's lure, staying within reach or with the group,
  stopping at the curb.
- Social and classroom: hand raising, on-topic comments, statements that fit the setting, honest reports, asking to
  join or for a turn, greetings, asking before touching, working on the task, following an instruction.
- Self-management and coping: asking for the calm space, slow breaths as taught, a fidget used as planned, the habit
  reversal competing response, self-monitoring.
- Daily living and feeding: accepting a bite, mouth clean, heel-to-toe walking, using the toilet, the bedtime pass,
  calm cooperation with dental or medical care.
- Matched and leisure alternatives (for automatic reinforcement): matched-stimulation items, the planned oral item, toy
  play.

The picker lists first the entries whose `pairs` include the card's problem behavior (its label read as a behavior
library entry's), then those whose `fn` suits the card's hypothesized function, then the rest. Choosing writes
"label — definition" into the field only when it is empty or still holds an earlier library choice; the other forms
take it under its label. `qa/v2567-tb1-rlib-test.js` checks it.

## The shared scripts: one file beside the forms (v21.84)

Until v21.83 every form carried the same script blocks byte for byte: 21.5 of the 34.8 MB of forms were those
copies (the writing help alone 11.6 MB), and a change to one rewrote every form, so every iPad downloaded the whole
set again. Each of these is now ONE file beside the forms, and a form carries only its loader, a classic synchronous
`<script id="..." src="..."></script>` in the place the inline block held (so the order the form's scripts run in is
unchanged):

| file | block | written by |
| --- | --- | --- |
| `nbh-logo.js` | the letterhead (`window.NBH_LOGO`), in the head | `tools/dedupe-logo.py` |
| `nbh-wording.js` | the writing help | `tools/blocks/patch-wording.py` (and `apply-polish.py`) |
| `nbh-case-flow.js` | the case flow | `tools/blocks/patch-case.py` |
| `nbh-ui.js` | toasts, questions, progress | `tools/blocks/patch-ui.py` |
| `nbh-field-care.js` | field care | edit the file itself; `tools/blocks/patch-shared.py` moves an inline copy out |
| `nbh-autosave.js` | autosave | `tools/blocks/patch-autosave.py` |
| `nbh-polish.js` | the polish script | `tools/apply-polish.py` (and `polish-one.py`) |

The list is `tools/blocks/shared_js.py`, which the tools share. Each tool still builds the block as before, then leaves
the loader in the form and writes the block's text to the file, byte for byte. CF-1 carries the loaders, so
`new-form.py` gives a rebuilt form the loaders. Not moved: the styles (the master print collects a form's `<style>`s),
`nbh-pwa-save` (the offline worker checks every page carries it), `nbh-guard` (`patch-autosave.py` edits it inside each
form) and the blocks that differ between forms.

- `pwa-sw.py` lists the files for the offline copy (it lists what pages load) and **refuses a form that holds an
  inline copy again** or lacks a loader: run `python3 tools/blocks/patch-shared.py NBH-Workstation/[A-Z]*.html`
  (it moves every inline copy out; `--check` changes nothing).
- `build-rps.py` copies the files and swaps the logo in `nbh-logo.js` (2 places now: it and `index.html`).
- `build-single.py` puts each loader back as the inline block, the file's text byte for byte, before it packs the
  forms: inside the one-file edition a form opens from srcdoc (or a blob, in its own tab), where a relative `src`
  loads nothing. Its output, and so the case files written from it, are what they were before v21.84.
- After changing any of these files, run `pwa-sw.py` and build the editions as usual. A change to one of them is now
  one small file per release, not every form.

## The writing help in every form

Every form (the 46; not `index.html` or `respond.html`) loads the writing help once, by
`<script id="nbh-wording" src="nbh-wording.js"></script>` between the form's markup and its own script;
`NBH-Workstation/nbh-wording.js` holds `tools/blocks/nbh-wording-rules.json`, `nbh-wording-config.json` and
`nbh-wording.js` byte for byte (v21.84; before, each form held its own copy, `<script id="nbh-wording">`).
What keeps it there:

- `tools/apply-polish.py` puts the loader in, or replaces an inline copy with it, in every form it polishes, and
  writes `nbh-wording.js` beside them, so `polish-one.py` gives every rebuilt parts form its loader and the current
  file (the two steps above, and TK-1's and TV-1's `build.sh`, which also check the built form loads it once and the
  file is current). CF-1's own loader sits in the part `new-form.py` does not copy, so a rebuilt form never holds two.
- After a change to one of the three files (a rule, the relay address), refresh (it rewrites `nbh-wording.js`; the
  forms change only if a loader is missing), then build the editions:

      python3 tools/blocks/patch-wording.py NBH-Workstation/[A-Z]*.html
      python3 tools/blocks/patch-wording.py --check NBH-Workstation/[A-Z]*.html    # exit 1 if one is stale

- `build-single.py` stops on a form without exactly one loader, puts the file back inline in every form (see
  above), and checks that the packed forms unpack to those; `build-rps.py` copies the file. The one-file editions
  keep the writing help ONCE, as they keep the logo: it is cut out of every form (`@@NBH-WORDING@@`) and packed in a
  block of its own (`nbh-embed-wording`), which `index.html` puts back as it opens a form and copies into a saved
  case file.
- A field that holds someone else's words (an interview answer, a quoted record, the student's own
  answers) or an instruction text with marks in it (TK-1's backs) is marked `data-nbh-nowording` too:
  rewording it would change what was said or break the marks.
- A field that is not a narrative gets no button: mark it (or its container) `data-nbh-nowording`.
  Hidden fields, fields in the toolbar or a dialog, fields with spelling check turned off
  (`spellcheck="false"`: paste boxes, item lists) and the learner's particulars the packet fills in
  (name, ID, date of birth, grade, school, case BCBA) are left out without a mark.
- The relay address is `https://newsomebh.com/ai` (`nbh-wording-config.json`), the same site as both
  editions, so the rewrite call is same-origin. Until the relay is uploaded (`tools/relay/README.md`)
  the panel says the rewrite service is not reachable or not set up yet, and that Check wording and
  the iPad's Writing Tools still work.

## Build the editions

    python3 tools/build-rps.py NBH-Workstation RPS-Workstation tools/rps-assets/rps-lockup.webp tools/rps-assets/rps-favicon.png
    python3 tools/build-single.py NBH-Workstation deliver/NBH-Workstation.html
    python3 tools/build-single.py RPS-Workstation deliver/RPS-Workstation.html

`build-rps.py` asserts the number of replacements it makes (45 logos, 163 alt texts, ...)
and stops if the source changed shape.

## The installable app and its offline copy (v21.43)

- `NBH-Workstation/sw.js` — the service worker: keeps the folder's files on the device and checks
  the website for changes (see the comment at its top). Its list of files and its version are written
  by `tools/pwa-sw.py`, which also writes `release.json`, the release list (every file's length and
  SHA-256; a device takes a file the list moved only when it arrives as listed, so a look during an
  upload takes nothing). Run `python3 tools/pwa-sw.py NBH-Workstation` after ANY change to a file of
  the folder (a form, the shell, the picture library), after adding, renaming or removing a form or a
  file a page loads, and after any change to `sw.js` itself (`--check` changes nothing and fails when
  `sw.js` or `release.json` is stale; `build-rps.py` refuses to build from a stale practice edition and
  writes the school edition's own `release.json`). Upload `release.json` with the files.
- `tools/pwa-assets.py NBH-Workstation` — writes `manifest.json` and the icons (`icon-192.png`,
  `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`) from the mark in the shell's
  logo; `build-rps.py` writes the school's from its lockup.
- `tools/blocks/nbh-pwa-save.js` + `tools/blocks/patch-pwa.py` — the block that, in the app
  installed on an iPad or iPhone, sends saved files to the share sheet, opens a window the page makes
  for itself (the master print, a respondent page's preview) inside the app, and says how to print
  when the print options do not appear. The patcher puts one copy after the `<title>` of every form
  and `index.html`, replaces an existing copy, refuses a second, and has `--check`; re-run it (then
  `pwa-sw.py`) after a merge or a rebuilt form.
- `build-single.py` leaves the `nbh-pwa-head` block of `index.html` out of the one-file editions.
- `qa/pwa-test.js` checks it all against an Apache-like server it starts itself.

## The checks to run before shipping

`all-forms-shell`, `case-test`, `due-test`, `ob1-split-test`, `ob1-ioa-test`, `guard-test`,
`bip4-test`, `u-test`, `u-check`, `shell-ui-test`, `logo-test`, `xlsx-test`, `single-check`,
the nine form tests (`sm1-test`, `sa1-test`, `gc1-test`, `si1-test`, `da1-test`, `hd1-test`,
`cn1-test`, `sr1-test`, `vs1-test`) and `a11y.js` (needs `axe-core` in `qa/node_modules`).
The writing help: `wording-rollout-test` (every form against the commit before the rollout),
`wording-client-test`, `wording-rules-test` and the relay's `tools/relay/tests/run.sh`.
`cn1-test`, `sr1-test`, `vs1-test`), `pwa-test` (the offline copy and the installed app) and
`a11y.js` (needs `axe-core` in `qa/node_modules`).
