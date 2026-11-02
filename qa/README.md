# Checks for the workstation

**The release run (v22.12).** `qa/release-list.txt` lists every check run before a release, in order; `bash
qa/run-release.sh` runs them (serving the repository on 127.0.0.1:8123 when nothing answers there), reads each one's exit
code and writes `qa/out/release/summary.txt`, naming the commit, with each test's output beside it. Every test on the list
exits 1 on any failure, and `qa/v2212-build-test.js` holds that, along with `tools/check-build.py` (the tools reproduce
the shipped forms exactly). What a test compares against is kept in `qa/data/` (the CF-1, SV-1 and IN-1 copies from
before v21.39 and v21.40); nothing comes from one machine's scratch folder. `qa/probes/` holds debugging scripts, which are
not tests.

Everything here drives the real pages in headless Chromium through Playwright and
was used to verify the v21.25 design pass. Set up once:

    cd qa
    npm install
    npx playwright install chromium
    pip install pymupdf            # for compare-print.py only

Serve the repository root (any static server), for example from the repository root:

    npx http-server . -p 8123 -s -c-1

Every script takes the folder to test from `WS_ROOT` (default: the repository root, found from `qa/lib.js`)
and the server from `WS_URL` (default `http://127.0.0.1:8123`); both are read in `lib.js`.

| Script | What it does |
|---|---|
| `node survey.js NBH-Workstation out.json` | Measures how every field, button, table and tab is styled in every form, with the simulation loaded. This is what the polish layer was designed from. |
| `node classes.js` | What the polish script marked in each form (boxed, underlined, bare, in a table, zebra tables) and any script error. Every field should be marked; `unmarked` should be 0. |
| `node printbase.js before` then `node printbase.js after` | Prints every form on its own and the master print to PDF from the SAME data (the first run keeps each form's snapshot and a case file under `data/`), so the two runs differ only if the paper output changed. |
| `python3 compare-print.py print/before print/after` | Compares the two runs: byte-identical PDFs pass at once; any other is rasterised and compared page by page. |
| `node a11y.js after http://127.0.0.1:8123` | axe-core, WCAG 2.1 A and AA, on the workstation (empty, with a form open, fullscreen, Help open) and on every form. |
| `node td1-compare-test.js` | v25.56: TD-1's Compare two interventions and How the parts fit: every row for NCR and DRA, a card's Compare button, the conflict raised and answered (kept through Save and Open), the question before Copy and Print, the BIP section, the single-card rules, upright on an iPad. |
| `node gc1-gbg-points-test.js` | v25.64: GC-1's Good Behavior Game counts points by default (script, poster, plan, win rules); the fouls version is labelled response cost and asks for the BCBA's sign-off; the simulated fouls game carries one. |
| `node v2564-eavi-test.js` | v25.64: EA-1 and VI-1 against the functional-analysis research: the published Roane rules (the magnitude floor a flag), no differentiated outcome under three sessions, the trial-based and latency criteria, protective equipment per session, the fixed condition order, the school session length, the VI-1 bands and the FA format for each reason to defer. |
| `node v2564-interview-test.js` | v25.64: IA-1, IN-1 and SI-1: open-ended interviews add conditions, the four added IN-1 questions, the interviewer checklists, SI-1's rules against suggestive questions, the stop response when "no" is a target, the student's reasons as testable statements, the NRRS screen. |
| `node v2564-datbfs-test.js` | v25.64: DA-1, TB-1 and FS-1: each consequence option explained (escape kept, explained), the paired-choice series, multiple control and synthesized statements, a written check for an untested hypothesis, DA-1 as a source, cluster members recorded apart, the cusp criteria and precursor basis. |
| `node v2564-ti-test.js` | v25.64: TI-1: the 80–89% band read by procedure, near-perfect integrity while thinning, the feedback record and fading rule, IOA coverage and drift, kappa, the start of a plan, antecedent and prompting errors, distractions, stronger reinforcement and video self-monitoring suggestions. |
| `node v2564-mtob-test.js` | v25.64: MT-1 and OB-1: block-by-block agreement from time-stamped taps, the method chooser from episode length, the corrected error description and false-negative caution, IOA coverage and drift, kappa, short-observation warnings, observer training, pauses and teaching-while-observing. |
| `node v2564-abcsp-test.js` | v25.64: ABC-1 and SP-1: agreement from two observers' files, IOA coverage and drift, kappa, the correspondence figures, a structured descriptive mode, a later-consequence tick, SP-1's correction for many intervals, the right agreement figure, and testing a pattern by changing the schedule. |
| `node v2564-dd-test.js` | v25.64: DD-1: the conservative dual-criterion check on every comparison, the decision line after an immediate drop, short phases provisional, the analyst's own reading, baseline trend, the effect-size tiles, consistency across repeated conditions, multiple-baseline, alternating and changing-criterion layouts, control-chart flags. |
| `node v2564-prsa-test.js` | v25.64: PR-1 and SA-1: the suggested decision from a stated window with a structured check and benchmark, the fading rule as printed, PR-1's day-by-day graph and re-entry rule, SA-1's fitted-trend no-change rule, target-by-target mastery, the third baseline probe, and the 100% mastery standard. |
| `node v2564-td-test.js` | v25.64: TD-1's plan logic: the consequence card no longer counts as reinforcement, extinction never ticked by default, reinforcement for compliance on the escape route, mismatches as conflicts, a model for multiple control, the least-restrictive ladder (a restrictive card waits for data), the high-p rule split, DRO variants, DRL aid, early integrity check. |
| `node v2564-gb-test.js` | v25.64: GB-1: annual reduction goals judged under the final plan, replacement objectives that say what they get the student and are easier than the problem behavior, the DRL aid, the 100% mastery standard with per-target option, generalization and maintenance on reduction objectives, percentage change and peer comparison, the bank filter. |
| `node v2564-optstep-test.js` | v25.64: TD-1 bank steps marked OPTION (they reinforce problem behavior on purpose) are left off a card unless "Include the optional step" is ticked; ticked, the card and its source line carry it. |
| `node dd1-run-test.js` | v25.64: DD-1's criterion: the decision line's longest run of days at the aim (it always printed 0), the current run and the day the criterion was met. |
| `node ipad-reflow-test.js` | v25.55: no form pushes the page sideways on an iPad, empty or with its simulated case loaded, at 820 px (upright) and 1133 px (an iPad mini sideways). A wide table may scroll inside its own panel. |
| `node shots.js after` | Screen captures of the workstation and four forms at desktop, tablet and phone sizes. |
| `node formshots.js after http://127.0.0.1:8123` | Every view of every form at desktop and phone sizes, for a visual review. |
| `node shell-check.js after` | Fullscreen on and off (button, Escape, Escape from inside a form, the keyboard shortcut from both), the hidden form list and its memory, the phone packet bar. |
| `node phoneprint.js PR-1,IN-1,IC-1,CT-1 phone-after` (and `phone-before` against the earlier release's URL) | Prints those forms from a 390px-wide window, from the kept snapshots; `compare-print.py print/phone-before print/phone-after` must find them identical, so the phone text size never reaches paper. |
| `node determinism.js DD-1 TI-1` | Whether a form's simulation loads the same data twice (DD-1 does not; the print check restores a kept snapshot instead). |
| `node wording-rollout-test.js [FORM-ID ...]` | The writing help in every form, each against the same form at the commit before the rollout (`WR_COMMIT`, unpacked into `out/wording-rollout/base/`): no console error, a button on every shown narrative field and nowhere else, Save data the same before and after the panel, the workstation's snapshot the same (an old case restored into both copies), the same printed pages, nothing past the edge at 390 px. Results in `out/wording-rollout/results.md`. |
| `node wording-client-test.js`, `node wording-rules-test.js` | The writing help's panel (in OB-1, against a stand-in relay) and its wording rules. The relay's own tests: `tools/relay/tests/run.sh`. |
| `node autosave-test.js [taps,slow,...]` | v21.44 Autosave: taps reach the copy, Save case and a slow form, unanswered offers kept, two students, a photo, a full store, the unsaved mark, Own tab, a form on its own, visibilitychange, the old slot; the review's findings (`race`, `names`, `cap`, `live`, `reload`, `savedalone`, `offpref`); and (`rt`) a save and reopen round trip for every form. |

To compare against an earlier release, serve that folder on a second port and pass its URL
(and `WS_ROOT`) to the `before` runs.
