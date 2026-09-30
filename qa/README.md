# Checks for the workstation

Everything here drives the real pages in headless Chromium through Playwright and
was used to verify the v21.25 design pass. Set up once:

    cd qa
    npm install
    npx playwright install chromium
    pip install pymupdf            # for compare-print.py only

Serve the repository root (any static server), for example from the repository root:

    npx http-server . -p 8123 -s -c-1

Every script takes the folder to test from `WS_ROOT` (default `/home/user/workstation`)
and the server from `WS_URL` (default `http://127.0.0.1:8123`); both are read in `lib.js`.

| Script | What it does |
|---|---|
| `node survey.js NBH-Workstation out.json` | Measures how every field, button, table and tab is styled in every form, with the simulation loaded. This is what the polish layer was designed from. |
| `node classes.js` | What the polish script marked in each form (boxed, underlined, bare, in a table, zebra tables) and any script error. Every field should be marked; `unmarked` should be 0. |
| `node printbase.js before` then `node printbase.js after` | Prints every form on its own and the master print to PDF from the SAME data (the first run keeps each form's snapshot and a case file under `data/`), so the two runs differ only if the paper output changed. |
| `python3 compare-print.py print/before print/after` | Compares the two runs: byte-identical PDFs pass at once; any other is rasterised and compared page by page. |
| `node a11y.js after http://127.0.0.1:8123` | axe-core, WCAG 2.1 A and AA, on the workstation (empty, with a form open, fullscreen, Help open) and on every form. |
| `node shots.js after` | Screen captures of the workstation and four forms at desktop, tablet and phone sizes. |
| `node formshots.js after http://127.0.0.1:8123` | Every view of every form at desktop and phone sizes, for a visual review. |
| `node shell-check.js after` | Fullscreen on and off (button, Escape, Escape from inside a form, the keyboard shortcut from both), the hidden form list and its memory, the phone packet bar. |
| `node phoneprint.js PR-1,IN-1,IC-1,CT-1 phone-after` (and `phone-before` against the earlier release's URL) | Prints those forms from a 390px-wide window, from the kept snapshots; `compare-print.py print/phone-before print/phone-after` must find them identical, so the phone text size never reaches paper. |
| `node determinism.js DD-1 TI-1` | Whether a form's simulation loads the same data twice (DD-1 does not; the print check restores a kept snapshot instead). |

To compare against an earlier release, serve that folder on a second port and pass its URL
(and `WS_ROOT`) to the `before` runs.
