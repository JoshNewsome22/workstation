# The banks' records

- `set-aside-procedures.md` and `.json` (v23.86, the BCBA's request): every punishment or restrictive procedure the studies
  behind Form GB-1's objective bank and Form TD-1's protocol bank used and the banks left out, one item per procedure per
  study: how the study used it, its part in the package, what the study reported, and what the bank did (study skipped,
  protocol dropped, kept out of the steps with the note saying so). Tier A could be considered only in a rare case, after
  a functional assessment and less restrictive procedures, with the review and consent the district requires; Tier B is
  never used in schools and is listed so a form can show it as prohibited. Kept for the planned punishment and
  punishment-assessment form. Nothing here is shipped to a school; it is the BCBA's record.
- `mark-proposals.md` and `.json` (after v26.06, commit 9c2b1ab): a proposal, not a record of anything done. 254 steps of Form TD-1's
  bank that describe extinction, escape extinction, guidance through a demand, or blocking or a hold without carrying
  the "EXTINCTION:" or "RESTRICTIVE:" mark the reader rules ask for (rules 3, 3a and 4), each with its card, its
  source and the proposed mark, and 26 of them as questions. It waits for the BCBA's approval; the bank is unchanged
  until then. When the approved marks are applied, this entry and the page are updated to say which and in what
  version.
- `grade-evidence.py` and `evidence-overrides.json` (v26.07): the evidence letters on every card of Form TD-1's bank,
  read by rule from the card's note and result, and the corrections that win over the rule. The head of the tool
  gives the rubric; reader rule 17 says when to run it.
