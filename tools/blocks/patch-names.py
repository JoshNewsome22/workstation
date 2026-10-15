#!/usr/bin/env python3
"""v22.09 (review F486) the field names inside tables, in every form.

Each form names its unlabelled fields for VoiceOver and Voice Control (nbhNameControls). Inside a table it used to climb
past the cell and take the whole header row run together ("NameRelationshipPhoneNotes") or the choices of the list in
the next cell ("4321"). Now a field in a table cell is named by its row and its column, the way a sighted user finds it:
the first cell's own words (or "Row n"), then the column heading under which it sits (colspans counted); the words of
a list or field are never part of a name, and the search for nearby text never leaves the cell. Outside tables nothing
changes. The 46 forms carry the same text; this replaces it in each and is safe to run again.

usage: python3 tools/blocks/patch-names.py FORM.html [FORM.html ...]
"""
import sys
A, B = '  function nbhNearbyText', '  function nbhNameControls'
OLD_T = "      var t = nbhClean(el.getAttribute('placeholder')) || nbhNearbyText(el) || nbhCellName(el);"
NEW_T = ("      var inCell = el.closest && el.closest('td,th');   /* v22.09 in a table: its row and column first (review F486) */\n"
         "      var t = inCell ? (nbhCellName(el) || nbhNearbyText(el) || nbhClean(el.getAttribute('placeholder')))\n"
         "        : (nbhClean(el.getAttribute('placeholder')) || nbhNearbyText(el));")
BODY = r"""  function nbhOwnText(node){
    /* v22.09 an element's own words, without the choices of a list or the text of a field inside it */
    if (!node) return '';
    if (node.nodeType === 3) return nbhClean(node.textContent);
    if (node.nodeType !== 1 || /^(INPUT|SELECT|TEXTAREA|BUTTON|OPTION|SCRIPT|STYLE)$/.test(node.tagName)) return '';
    var c = node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('input,select,textarea,button,option,script,style'), function(x){ x.remove(); });
    return nbhClean(c.textContent);
  }
  function nbhNearbyText(el){
    /* the text just before the control is what reads as its label (v22.09: never the words of another field, and
       never from outside the table cell the control is in) */
    var n = el.previousSibling, out = '';
    while (n && !out) { out = nbhOwnText(n); n = n.previousSibling; }
    if (out) return out;
    var p = el.parentElement;
    if (p && !(p.matches && p.matches('tr,table,tbody,thead'))) { out = nbhOwnText(p); if (out) return out; }
    /* These forms wrap the control in a plain .row and put its caption on a
       sibling of that wrapper, so the label is an uncle rather than a sibling.
       Climb a couple of levels looking for the nearest preceding caption. */
    var up = el.parentElement, hops = 0;
    while (up && hops++ < 3) {
      if (up.matches && up.matches('td,th,tr,table,tbody,thead')) break;
      var s = up.previousSibling;
      while (s) {
        var txt = nbhOwnText(s);
        if (txt) return txt;
        s = s.previousSibling;
      }
      up = up.parentElement;
    }
    return '';
  }
  function nbhCellName(el){
    /* a control in a table cell is named by its row and column, the way a
       sighted user locates it (v22.09: the heading over its own column, colspans counted; the first cell's own words,
       or "Row n" when it holds only fields) */
    var td = el.closest ? el.closest('td,th') : null;
    if (!td) return '';
    var tr = td.parentElement, table = td.closest('table');
    if (!tr || !table) return '';
    var col = 0, k;
    for (k = 0; k < tr.children.length && tr.children[k] !== td; k++) col += tr.children[k].colSpan || 1;
    var headRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : table.rows[0];
    var colHead = '', rowHead = '';
    if (headRow && headRow !== tr) {
      for (var j = 0, x = 0; j < headRow.children.length; j++) {
        var hc = headRow.children[j], span = hc.colSpan || 1;
        if (col >= x && col < x + span) { colHead = nbhOwnText(hc); break; }
        x += span;
      }
    }
    var first = tr.children[0];
    if (first && first !== td) rowHead = nbhOwnText(first);
    if (!rowHead) {
      var sec = tr.parentElement, rows = sec ? Array.prototype.filter.call(sec.children, function(r){ return r.tagName === 'TR'; }) : [];
      var at = rows.indexOf(tr);
      if (at >= 0 && rows.length > 1) rowHead = 'Row ' + (at + 1);
    }
    return [rowHead, colHead].filter(Boolean).join(', ');
  }
"""
n = 0
for path in sys.argv[1:]:
    s = open(path, encoding='utf-8').read()
    if A not in s: continue
    a = s.index(A); b = s.index(B, a)
    old = s[a:b]
    if 'function nbhOwnText' in s:
        a = s.index('  function nbhOwnText')
    s = s[:a] + BODY + s[b:]
    if OLD_T in s:
        assert s.count(OLD_T) == 1, path
        s = s.replace(OLD_T, NEW_T)
    assert NEW_T in s, (path, 'the naming line')
    open(path, 'w', encoding='utf-8').write(s); n += 1
print(n, 'forms')
