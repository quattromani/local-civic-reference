# 2026 General-Election Scope Correction

**Review date:** July 15, 2026

**Status:** Implemented as an open-filing-window snapshot; RC1 packaging paused

**Canonical schema:** 4.0.0

## Purpose

The prior directory emphasized contests present in the Gage County primary results. This review restores offices and candidates omitted because they advanced without a contested primary or filed for general-election-only offices, and it separates current general-election listings from candidates retained solely as primary history.

## Official sources located

1. **Gage County 2026 Candidate Filing List** — official county filing snapshot for county, city, school, village, and township offices. Snapshot reviewed July 15, 2026. The document states an incumbent filing deadline of July 15 and includes filings received through July 7 in the published copy.
2. **Gage County Notice of Offices to Be Filled at the 2026 General Election** — official office, seat, term, filing-authority, and deadline notice. It identifies an August 3 non-incumbent deadline and confirms the Gage-applicable Norris Public Power District and ESU seats.
3. **Nebraska 2026 Statewide Candidate Filing List** — Secretary of State workbook used for candidates currently listed for federal, state, legislative, State Board, public-power, and ESU offices.
4. **Nebraska Board of State Canvassers Official Report, 2026 Primary Election** — official statewide and multi-county primary nominees and advancement outcomes.
5. **Gage County 2026 Primary Sample Ballots** — official notice explaining the statutory nomination and primary-omission rule when filings do not exceed the primary threshold.
6. **Gage County Electionware Summary Results Report** — county-issued report labeled `UNOFFICIAL RESULTS`, retained for Gage County primary participation and vote totals within its reporting scope.

All source files are preserved in `research/sources/` with SHA-256 checksums in the normalized source registry.

## Scope now represented

- 69 offices across School Boards, Cities & Villages, County Offices, State Offices, Township Boards, and Other Local Districts.
- 151 unique candidates and 152 candidacies.
- 127 candidacies in `current-general-election`.
- 25 candidacies in `primary-history`.
- 51 Gage County primary result records retained without using vote total or placement for display ordering.
- 12 offices with no candidate currently listed; each has an explicit scope-review record.

## Restored office groups

### County offices omitted from the contested-primary directory

- Gage County Clerk
- Gage County Clerk of the District Court
- Gage County Treasurer
- Gage County Register of Deeds
- Gage County Assessor
- Gage County Attorney
- Gage County Surveyor
- Gage County Supervisor Districts 1, 3, and 5

### General-election-only or no-contested-primary local offices

- Four school-board offices using the official county filing list
- Beatrice and Wymore city-council wards
- Blue Springs City Council and mayoral office
- Nine village boards
- Twenty-four township boards
- Norris Public Power District Subdivision 4
- ESU 4 District 3; ESU 5 Districts 5 and 7; ESU 6 District 5

## Election-stage examples verified

- **Gage County Supervisor District 7:** Terry Jurgens is a current general-election listing and is labeled `Won Republican Primary`; Gary Bergmeier appears only under `Primary history` with `Did Not Advance from Primary`.
- **Gage County Sheriff:** Spencer Behrens is a current general-election listing; Michael Hager and Tim Hanson appear only under primary history.
- **Nebraska Secretary of State:** Scott Petersen and Sarah J. Slattery are current general-election listings supported by the statewide filing workbook and official state canvass; Bob Evnen and Lee M. Cimfel are primary history.
- **State Board of Education District 5:** Angie Eberspacher and Michaela Conway are current general-election listings; Lana Daws is primary history.

## Time-bounded status policy

No office or candidate is labeled `unopposed in the general election` from the July 15 snapshots. The normalized model records:

- `filingSnapshotDate: 2026-07-15`
- `filingWindowStatus: Open — the incumbent filing deadline is July 15, 2026, and the non-incumbent filing deadline is August 3, 2026.`

Public labels use `Only candidate currently listed`, `No candidate is currently listed`, or the current candidate count, followed by `general-election contest status is not yet final`.

## Official-source corrections to retired discovery data

The official county filing list replaces the retired political-party discovery import. Among other corrections, it supplies `Adam Engelman`, `B.J. Stein`, `Brandon Jensen`, `Isaac Bachmann`, `Keith A. Maguire`, `Neil VanBoening`, and full middle initials or suffixes where shown. Robert Paul Harrison and Myron Schoen are excluded from current listings because the official filing PDF marks them withdrawn.

## Records requiring follow-up

### Recheck after the filing deadline

The July 15 county filing snapshot lists no current candidate for:

- Adams Township Board
- Blakely Township Board
- Blue Springs Mayor
- Blue Springs/Wymore Township Board
- Clatonia Township Board
- Glenwood Township Board
- Highland Township Board
- Hooker Township Board
- Midland Township Board
- Nemaha Township Board
- Riverside Township Board
- Rockford Township Board

### Gage ballot-eligibility mapping still required

The official statewide canvass and candidate workbook contain additional Southeast Community College and natural resources district offices. They are not added merely because the broader district has candidates. Confirm the exact Gage County ballot styles or official district map intersections before adding the applicable office IDs and candidates.

### Affiliation review

- 90 nonpartisan filing-snapshot candidacies remain `Verification Needed`.
- Nine Electionware-reported nonpartisan primary candidates remain `Not Confirmed`.
- One person may have more than one candidacy; the 100-item manual-review queue is candidacy-specific.

## Validation outcome

- Canonical/page synchronization: passing.
- Source allowlist and archive checksums: passing.
- Record-level provenance: passing.
- Explicit ordering policy: passing.
- Election-stage scope regression: passing.
- Premature general-election `unopposed` claims: zero.
- Automated local-file visual inspection: not performed because browser automation is blocked from `file://`; owner visual review remains open.
