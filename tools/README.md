# The workshop

Everything needed to change the forms without editing generated files by hand.
Paths below are from the repository root. The test server the checks expect:
`http-server . -p 8123 -s -c-1` (any static server on port 8123 works).

## Layout

- `tools/forms/<ID>/` — the source parts of the nine forms built from parts
  (CN-1, DA-1, GC-1, HD-1, SA-1, SI-1, SM-1, SR-1, VS-1): `meta.json`, `toolbar.html`,
  `own.css`, `body.html`, `script.js` (SM-1 and VS-1 keep `script-main.js`, copied to
  `script.js`). Never edit the built file of one of these forms; edit the parts and rebuild.
- `tools/new-form.py` — assembles a form from CF-1 (the template: its head, generic
  stylesheet, brand system, masthead, print head and shared tail blocks) and a parts folder.
- `tools/polish-one.py` — the post-build polish for one rebuilt form.
- `tools/apply-polish.py` — the original polish pass over a folder (v21.25); do not run it
  on the shipped forms again, use `polish-one.py` on a rebuilt form.
- `tools/blocks/` — the shared blocks every form carries after its own script, and the
  patchers that insert or refresh them (all idempotent; a refresh replaces the existing copy):
  `nbh-case.html` + `patch-case.py` (the case flow: facts, due dates, picker),
  `nbh-guard.html` + `patch-guard.py` (unload guard, quick save, spellcheck),
  `nbh-ui.html` + `patch-ui.py` (toasts, notices, questions, progress dots, touch targets,
  the light toolbar inside the workstation), `patch-csv.py` (the `csv?` bridge verb),
  `patch-hook.py` + `hooks/<ID>.js` (per-form case hooks placed inside the form's own script).
- `tools/dedupe-logo.py` — one letterhead image per form (v21.36); idempotent.
- `tools/build-rps.py`, `tools/rps-assets/` — the Royal Palm School edition and its lockup
  and tab icon. `tools/build-single.py` — the one-file editions.
- `tools/pictos/`, `tools/scene/`, `tools/polish/` — the picture library, the walkthrough
  scene engine sources and the polish layer sources.
- `tools/history/` — the one-shot patch scripts that produced earlier versions of
  `index.html` and a few forms (kept as a record; they refuse to run twice).
- `qa/` — the checks. `lib.js` is the shared Playwright helper; outputs go to `qa/out/`
  (ignored by git). Most tests take no arguments: `node qa/all-forms-shell.js`.

## Rebuild a parts form

    python3 tools/new-form.py NBH-Workstation/CF-1_Contextual-Fit-Assessment_v2026-09.html tools/forms/DA-1 NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html
    python3 tools/polish-one.py NBH-Workstation/DA-1_Demand-Assessment_v2026-10.html

Rebuilding from the committed parts reproduces the shipped file byte for byte (checked at
v21.36 for all nine). CF-1 is the template, so a change to a shared head or tail block is
made in every form (by its patcher) and reaches the rebuilt forms through CF-1.

## Refresh a shared block in every form

    python3 tools/blocks/patch-ui.py tools/blocks/nbh-ui.html NBH-Workstation/[A-Z]*.html

The glob `[A-Z]*.html` is the 43 forms without `index.html`. Each patcher prints
`patched` or `already` per form. The case block's refresh is a replacement of the text
between `<style id="nbh-case-css">` and `<style id="nbh-guard-css">` (see `patch-case.py`).

## Build the editions

    python3 tools/build-rps.py NBH-Workstation RPS-Workstation tools/rps-assets/rps-lockup.webp tools/rps-assets/rps-favicon.png
    python3 tools/build-single.py NBH-Workstation deliver/NBH-Workstation.html
    python3 tools/build-single.py RPS-Workstation deliver/RPS-Workstation.html

`build-rps.py` asserts the number of replacements it makes (43 logos, 158 alt texts, ...)
and stops if the source changed shape.

## The checks to run before shipping

`all-forms-shell`, `case-test`, `due-test`, `ob1-split-test`, `ob1-ioa-test`, `guard-test`,
`bip4-test`, `u-test`, `u-check`, `shell-ui-test`, `logo-test`, `xlsx-test`, `single-check`,
the nine form tests (`sm1-test`, `sa1-test`, `gc1-test`, `si1-test`, `da1-test`, `hd1-test`,
`cn1-test`, `sr1-test`, `vs1-test`) and `a11y.js` (needs `axe-core` in `qa/node_modules`).
