# Judicial retention and candidate cross-check

## Scope and acceptance

Implement six individually sourced yes/no retention questions, grouped by court in supplied ballot order. Preserve candidate records, affiliation evidence, totals, and history. Support static access, name/court search, keyboard disclosures, source dates, and accurate filter behavior. Review locally before commit or push; neither is authorized in this turn.

Use existing repository, SDLC, front-end, and writing guidance. Canonical judicial data lives independently of candidacies, with an explicit publication-safe projection. Sources: user ballot photographs, user confirmation of Gage County coverage, Secretary of State final retention list, Judicial Branch retention guide.

Cross-check existing current candidates against refreshed official state and county election sources. Separate roster/ballot evidence from registration evidence. Report conflicts without silently changing candidate data.

## Verification

Completed implementation and full `npm run release` checks, including official judicial wording, publication equality, invalid-input rejection, static access, search/filter behavior, HTML/accessibility checks, election reuse, provenance, source certainty, ordering, roster, counts, publication safety, and deterministic builds.

Browser review confirmed a judge-only search, readable source disclosures at 390px width, and no horizontal overflow. Native disclosures provide keyboard behavior; automated expanded-content checks passed. No manual screen-reader certification is claimed.

The candidate audit covers all 175 current candidacies and records one unresolved spelling conflict, two ballot-name variants, and 28 additional entries outside selected coverage. A writing specialist reviewed the wording; the project manager checked and corrected the Stein source-column distinction against the filing transcript.

The final shared-guidance checkpoint found no material divergence. Canonical candidate records are unchanged; judicial provenance remains separate from the public projection. No commit, push, or deployment performed. Local preview: port 4173. See the audit for source limits and unresolved candidate findings.

## Supplementary source clarification

The user clarified that “same site” meant Voter Information Project and regards its data as credible but incomplete. Completed a separate comparison of its 30 county-linked race pages and 124 surname searches. The 38 same-office current candidate matches have no opposing affiliation labels; four have supplementary labels where Party Reveal has no confirmed affiliation. Recorded the Freeman roster discrepancy, judicial/name-format variants, and scope limits in `audits/2026/voterinformation-crosscheck-2026-10-26.md`. No implementation or published data changed.

## Release approval

The user approved committing and pushing the judicial section and four affiliation updates on October 26, 2026. Mary Benes remains excluded; Ricky A. Schreiner retains the official ballot spelling. Full release checks passed before approval; the final release run and clean working-tree check accompany the release. The earlier local-only status records describe prior review stages.
