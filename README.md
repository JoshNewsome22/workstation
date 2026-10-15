# FBA and BIP Workstation

Two editions of the same workstation, 46 forms each, and the tools that build them.

| Folder | What it is |
|---|---|
| `NBH-Workstation/` | The Newsome Behavioral Health edition: `index.html`, the 46 forms, the PDF tools, the picture library (`nbh-pictos.js`), the offline copy and the installable app (`sw.js`, `manifest.json`, the icons; v21.43), and the documentation (`README.txt`, `SETUP.md`, `HOSTING.md`). This is the folder that is edited. |
| `RPS-Workstation/` | The Royal Palm School edition, generated from the NBH folder by `tools/build-rps.py`. Never edited by hand. |
| `deliver/` | The one-file editions (`NBH-Workstation.html`, `RPS-Workstation.html`): the whole workstation, forms inside, built by `tools/build-single.py`. |
| `tools/` | The build scripts, `polish/`, the screen polish every form carries (applied by `tools/apply-polish.py`), and `relay/`, the writing help's rewrite service for newsomebh.com (its own upload zip and README). |
| `qa/` | Checks: print fidelity, accessibility, screen captures, the workstation's views. See `qa/README.md`. |

## Making a release

Edit `NBH-Workstation/` (and the sources under `tools/`), then, from the repository's folder:

    bash tools/build-release.sh          # the polish, the shared blocks, the offline list, the RPS edition, the one-file
                                         # editions, then tools/check-build.py: the tools reproduce the forms exactly
    bash qa/run-release.sh               # every check in qa/release-list.txt; summary in qa/out/release/summary.txt
    bash tools/zip-release.sh <folder>   # the upload zips, after a run with no failures (below)

`tools/zip-release.sh` writes, named by the version in `index.html` (`WS_REL`):

| Zip | What it is, and where it goes |
|---|---|
| `RPS-Workstation_v<version>.zip` | The school edition, files at the top level. `HOSTING.md` in it says how to upload it. |
| `NBH-Workstation_v<version>.zip` | The practice edition, the same way. |
| `nbh-reply-box-upload.zip` | The reply box (`tools/reply-box/README.md`): extracted in the website's home folder, not in a workstation folder. Ship it when `box.php` changed. |
| `nbh-relay-upload.zip` | The writing help's rewrite service (`tools/relay/README.md`), for the practice's site only; the school edition does not use it. |
| `*_speech.zip` (with `--speech`) | `nbh-asr/`, the on-device recogniser behind Dictate and TV-1's Follow my words (57 MB). It does not change between versions, so the workstation zips leave it out; ship it the first time and when `tools/forms/TV-1/build-asr.py` was run again. It is extracted once into the edition's folder. |

The two TK-1 walkthrough videos are made apart from a release (`node qa/tk1-walk-video.js --both --dir <folder>`, with the
test server on :8123), when TK-1's walkthrough changed.
