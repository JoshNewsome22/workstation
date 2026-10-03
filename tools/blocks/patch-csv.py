#!/usr/bin/env python3
"""v21.36: the bridge answers csv? with the form's own CSV export, caught instead of downloaded. Idempotent.
usage: patch-csv.py <form.html>..."""
import sys
ANCHOR = "    } else if (d.nbh === 'facts?') {"
VERB = """    } else if (d.nbh === 'csv?') {
      /* v21.36 the case as a spreadsheet: press the form's own CSV button, catch the file it would save,
         and hand the text back; the form's messages are held while this runs */
      (function(){
        var btn = document.querySelector('#csvBtn, #dl-csv, #btnCsv');
        if (!btn) { reply({ nbh:'csv-out', id: formId(), csv: null }); return; }
        var U = window.URL, mk = U.createObjectURL, rv = U.revokeObjectURL, ck = HTMLAnchorElement.prototype.click, got = null, timer = null;
        var restore = function(){ U.createObjectURL = mk; U.revokeObjectURL = rv; HTMLAnchorElement.prototype.click = ck; window.__nbhSilent = false; };
        var finish = function(text){ if (timer === null) return; clearTimeout(timer); timer = null; restore(); reply({ nbh:'csv-out', id: formId(), csv: text }); };
        U.createObjectURL = function(b){ if (!got && b && typeof b.size === 'number') got = b; return 'blob:nbh-caught'; };
        U.revokeObjectURL = function(){};
        HTMLAnchorElement.prototype.click = function(){
          if (got && (/nbh-caught/.test(this.href || '') || this.hasAttribute('download'))) {
            var g = got;
            (g.text ? g.text() : new Promise(function(r){ var fr = new FileReader(); fr.onload = function(){ r(fr.result); }; fr.readAsText(g); }))
              .then(function(t){ finish(/^\\uFEFF/.test(t) ? t.slice(1) : t); }, function(){ finish(null); });
            return;
          }
          return ck.apply(this, arguments);
        };
        window.__nbhSilent = true;
        timer = setTimeout(function(){ finish(null); }, 2500);
        try { btn.click(); } catch (e) { finish(null); }
      })();
"""
for path in sys.argv[1:]:
    s = open(path, encoding='utf-8').read()
    if "d.nbh === 'csv?'" in s: print('already', path); continue
    assert s.count(ANCHOR) == 1, (path, s.count(ANCHOR))
    s = s.replace(ANCHOR, VERB + ANCHOR)
    open(path, 'w', encoding='utf-8').write(s); print('patched', path)
