# General-election source review — October 6, 2026

## Brief and scope

Recheck the existing 69-office directory against the county's latest published filing list and the Secretary of State's final general-election list. Preserve primary history, distinct source roles, and original affiliation verification dates. Add only races already within the directory's scope. Represent write-in declarations and petition access in words; show governor running mates as ticket information using the existing card typography.

## Evidence

- Gage County 2026 Candidate Filing List: https://gagecountyne.gov/wp-content/uploads/sites/35/2026/07/2026-filings_for_office-General-for-web-page-w-auto-adv.pdf
  - Archive: `src/provenance/elections/2026/sources/gage-2026-general-filing-snapshot-2026-10-06.pdf`
  - SHA-256: `3f972200a1f7809fcd3b595af60fdf96eb220be01d45eec4c8bf39d01c474845`
  - Reviewed: October 6, 2026.
- Nebraska 2026 Final Statewide General Candidate List: https://sos.nebraska.gov/sites/default/files/doc/elections/2026/Final_Statewide_General_Candidate_Filing_List_9.11.26.pdf
  - Archive: `src/provenance/elections/2026/sources/ne-2026-final-general-candidate-list-2026-09-11.pdf`
  - SHA-256: `d27a071715896b8c82b8cce8d48200b4207ba10c44f1778f56f92c4efcd7cf96`
  - Reviewed: October 6, 2026.

The county PDF was inspected on all three pages, including its color legend distinguishing primary history from current candidates. Its latest recorded filing is September 29. All county names are represented, except the three previously documented withdrawn candidates excluded from publication (Neil VanBoening, Robert Paul Harrison, Myron Schoen); county “BJ Stein” is the existing “B.J. Stein” record. No new affiliation matches were inferred from similar names.

The state final list dated September 11 was checked for all nine existing federal/state offices and the five state-filed local district offices. Remaining state races in that statewide PDF are outside this directory's existing scope.

## Changes

- Added 31 county declared write-ins and Gene Radar Reedy's Blue Springs mayoral petition candidacy. A declared write-in is not represented as a printed ballot name.
- Added nine candidates across Senate, House District 3, governor, secretary of state, and auditor. Governor ticket names now include running mates.
- Cindy Burbank remains in primary history as a primary nominee absent from the final general list. The list alone does not establish a withdrawal reason or date.
- The five existing state-filed local district rosters are unchanged.
- Updated guide review date and filing-source review dates; preserved earlier voter-registration evidence dates and primary-result source dates.
- Updated source methodology and office notices to distinguish the final state list from the county filing list.

## Remaining uncertainty

This is a roster review, not a fresh VoterCheck sweep. New nonpartisan/write-in affiliations remain pending, as do affiliations for petition candidates where this filing source does not establish a party. “By Petition” is an access method, not a political affiliation. Glenwood Township has no candidate listed in this county source; that office retains an open scope-review record. The county PDF is a filing list, not a certified sample ballot.

## Validation and guidance

Full release checks pass, including canonical integrity, provenance, source certainty, ordering, accessibility baseline, stage scope, reviewed roster regression, category counts, publication safety, and deterministic output. The regression compares every current federal/state and state-filed local district roster to its authoritative transcription and protects write-in semantics and petition-party distinctions.

Closing guidance checkpoint: repository authority, source-specific certainty, equal editorial treatment, and generated publication boundaries are preserved. No global guidance change is proposed.
