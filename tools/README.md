# The workshop

Everything needed to change the forms without editing generated files by hand.
Paths below are from the repository root. The test server the checks expect:
`http-server . -p 8123 -s -c-1` (any static server on port 8123 works).

## Layout

- `tools/forms/<ID>/` — the source parts of the thirteen forms built from parts
  (CN-1, DA-1, GC-1, HD-1, IM-1, QS-1, SA-1, SI-1, SM-1, SR-1, TK-1, TV-1, VS-1): `meta.json`, `toolbar.html`,
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
  `nbh-guard.html` + `patch-guard.py` (unload guard, quick save, spellcheck),
  `nbh-ui.html` + `patch-ui.py` (toasts, notices, questions, progress dots, touch targets,
  the light toolbar inside the workstation), `patch-csv.py` (the `csv?` bridge verb),
  `patch-hook.py` + `hooks/<ID>.js` (per-form case hooks placed inside the form's own script),
  `nbh-wording.js` + `nbh-wording-rules.json` + `nbh-wording-config.json` + `patch-wording.py`
  (the writing help: the Improve wording button and panel; see below), `nbh-link.js` +
  `patch-link.py` (the TK-1/TE-1 link), `tb1-behavior-library.json` + `patch-tb1-library.py`.
  v21.84: `shared_js.py` (the list of the scripts every form loads from one file beside it, used by the patchers and
  the builds) and `patch-shared.py` (moves inline copies out of forms; see *The shared scripts* below).
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

## Rebuild a parts form

    python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html tools/forms/DA-1 NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html
    python3 tools/polish-one.py NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html

Rebuilding from the committed parts reproduces the shipped file byte for byte (checked at
v21.36 for all nine, and at v21.43 for all eleven, the writing help included). CF-1 is the template, so a change to a shared head or tail block is
made in every form (by its patcher) and reaches the rebuilt forms through CF-1.

## Refresh a shared block in every form

    python3 tools/blocks/patch-ui.py tools/blocks/nbh-ui.html NBH-Workstation/[A-Z]*.html

The glob `[A-Z]*.html` is the 46 forms without `index.html`. Each patcher prints
`patched` or `already` per form. The case block's refresh is a replacement of the text
between `<style id="nbh-case-css">` and `<style id="nbh-guard-css">` (see `patch-case.py`).

## The shared scripts: one file beside the forms (v21.84)

Until v21.83 every form carried the same script blocks byte for byte: 21.5 of the 34.8 MB of forms were those
copies (the writing help alone 11.6 MB), and a change to one rewrote all 46 forms, so every iPad downloaded the whole
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
  one small file per release, not 46 forms.

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
  when the print options do not appear. The patcher puts one copy after the `<title>` of the 46 forms
  and `index.html`, replaces an existing copy, refuses a second, and has `--check`; re-run it (then
  `pwa-sw.py`) after a merge or a rebuilt form.
- `build-single.py` leaves the `nbh-pwa-head` block of `index.html` out of the one-file editions.
- `qa/pwa-test.js` checks it all against an Apache-like server it starts itself.

## The checks to run before shipping

`all-forms-shell`, `case-test`, `due-test`, `ob1-split-test`, `ob1-ioa-test`, `guard-test`,
`bip4-test`, `u-test`, `u-check`, `shell-ui-test`, `logo-test`, `xlsx-test`, `single-check`,
the nine form tests (`sm1-test`, `sa1-test`, `gc1-test`, `si1-test`, `da1-test`, `hd1-test`,
`cn1-test`, `sr1-test`, `vs1-test`) and `a11y.js` (needs `axe-core` in `qa/node_modules`).
The writing help: `wording-rollout-test` (all 46 forms against the commit before the rollout),
`wording-client-test`, `wording-rules-test` and the relay's `tools/relay/tests/run.sh`.
`cn1-test`, `sr1-test`, `vs1-test`), `pwa-test` (the offline copy and the installed app) and
`a11y.js` (needs `axe-core` in `qa/node_modules`).
