
/* v21.31 the case: hooks. The interview records the behavior in the student's own words, so nothing is
   filled in on its own; the picker puts the team's label in when the interviewer wants it there. */
window.__nbhFactsIn=function(f){return {filled:0,note:'the interview keeps the behavior in the student’s words'};};
window.__nbhFactsPick=function(sel){const b=sel.behaviors[0];if(!b)return {filled:0};S.meta.beh=b.label;renderAll();return {filled:1};};
