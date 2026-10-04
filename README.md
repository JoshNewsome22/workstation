# FBA and BIP Workstation

Two editions of the same workstation, 44 forms each, and the tools that build them.

| Folder | What it is |
|---|---|
| `NBH-Workstation/` | The Newsome Behavioral Health edition: `index.html`, the 44 forms, the PDF tools, the picture library (`nbh-pictos.js`), the offline copy and the installable app (`sw.js`, `manifest.json`, the icons; v21.43), and the documentation (`README.txt`, `SETUP.md`, `HOSTING.md`). This is the folder that is edited. |
| `RPS-Workstation/` | The Royal Palm School edition, generated from the NBH folder by `tools/build-rps.py`. Never edited by hand. |
| `deliver/` | The one-file editions (`NBH-Workstation.html`, `RPS-Workstation.html`): the whole workstation, forms inside, built by `tools/build-single.py`. |
| `tools/` | The build scripts, and `polish/`, the screen polish every form carries (applied by `tools/apply-polish.py`). |
| `qa/` | Checks: print fidelity, accessibility, screen captures, the workstation's views. See `qa/README.md`. |

## Making a release

    python3 tools/apply-polish.py NBH-Workstation                      # after editing tools/polish/*
    python3 tools/blocks/patch-pwa.py NBH-Workstation                  # the installed app's save block (v21.43)
    python3 tools/pwa-sw.py NBH-Workstation                            # the offline copy's file list and release.json (v21.43)
    python3 tools/rps-assets.py RPS-Workstation/index.html /tmp/rps    # the school lockup and icon
    python3 tools/build-rps.py NBH-Workstation RPS-Workstation /tmp/rps/rps-lockup.webp /tmp/rps/rps-favicon.png
    python3 tools/build-single.py NBH-Workstation deliver/NBH-Workstation.html
    python3 tools/build-single.py RPS-Workstation deliver/RPS-Workstation.html

Zip each folder flat (files at the top level) as `NBH-Workstation-v<version>.zip` and
`RPS-Workstation-v<version>.zip`; `HOSTING.md` in each folder says how to put it on the website.
