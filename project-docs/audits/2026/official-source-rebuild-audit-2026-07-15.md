# Official-source rebuild audit

> Historical audit snapshot. Superseded later on July 15, 2026 by `nonpartisan-filing-restoration-audit-2026-07-15.md`. The Electionware findings remain valid within the report's Gage County reporting scope; the report is labeled `UNOFFICIAL RESULTS`. The current dataset additionally contains an isolated filing-source-only supplement for nonpartisan filing names.

Audit date: July 15, 2026

Canonical dataset: `data/election-directory-2026.certified.json`

Schema version: 3.0.0

SHA-256: `a7f71cb68353fc7cb130f170a8ef23b5aafb65c01f736ff1797e9a8ae394c150`

## Result

The directory was rebuilt from the county-issued Gage County Electionware 2026 Primary Summary Results Report, labeled `UNOFFICIAL RESULTS`, and the retained Nebraska VoterCheck verification log. The project treats Electionware as authoritative only for facts within its Gage County reporting scope. All records, links, mappings, and historical artifacts associated with the disallowed filing source were removed.

The stakeholder-preview billboard artwork is intentionally retained unchanged. Its paid-for attribution identifies the project sponsor; it is not a filing source, verification source, candidate-data citation, or link in the election dataset.

The canonical dataset and embedded page snapshot pass the complete integrity validator with zero errors.

## Current validated scope

| Measure | Result |
|---|---:|
| Approved sources | 2 |
| Jurisdictions | 7 |
| Offices or contest-level seats | 13 |
| Electionware-reported contests | 22 |
| Candidate identities | 51 |
| Candidacies | 51 |
| Result records | 51 |
| Verified affiliations | 42 |
| Unconfirmed affiliations | 9 |
| Duplicate records | 0 |
| Orphaned records | 0 |
| Contest-total discrepancies | 0 |
| Page-to-canonical mismatches | 0 |
| Validation errors | 0 |

## Housekeeping completed

- Source registry reduced from six records to two Tier 1 records.
- Candidate-directory size changed from 92 filing-source-derived entries to 51 Electionware-reported candidates.
- Office groups changed from 39 filing-source-derived groups to 13 Electionware-reported offices or seats.
- The prior 90-item mixed review queue was replaced by nine narrowly scoped affiliation reviews.
- The historical county/state filing-source compilation was deleted.
- The earlier discrepancy and certification reports that retained disallowed-source provenance were deleted.
- The canonical builder no longer reads the page's legacy dataset or any filing-source inventory.
- The embedded page data is generated directly from the validated canonical dataset.
- The stakeholder-preview billboard attribution is the sole intentional sponsorship reference and is isolated from all election data and provenance.

## Secretary of State correction

The erroneous Secretary of State entry was removed. The Electionware report names:

- Bob Evnen — 1,362 Gage County votes
- Scott Petersen — 1,710 Gage County votes

Both appear in the Republican primary contest. The page uses the spelling `Petersen` shown in the report.

## Affiliation policy

- In partisan contests, the displayed label identifies the candidate's named primary ballot and cites Electionware. It does not claim voter-registration status.
- In nonpartisan contests, an affiliation is displayed only when the retained Nebraska VoterCheck log contains a unique match.
- When neither condition applies, the affiliation is `Not Confirmed`.

## Remaining manual review - nine affiliations

- Angie Eberspacher
- Cally Ideus
- Janet M. Bock
- Jeffrey D. Spier
- Lana Daws
- Max Manuilov
- Michaela Conway
- Ted Fairbanks
- Tyson Parks

All nine appear in Electionware-reported nonpartisan contests. Their candidate participation and Gage County vote results are supported by that report, but their political affiliations are not confirmed.

## Records removed from the page

School-board, township, city-council, village-board, unreported county-office, Lieutenant Governor, Congressional District 1, and Congressional District 2 entries were removed because the retained Tier 1 sources do not establish their participation in the report's scope.

## Reproducibility

- `scripts/build-certified-election-data.mjs` rebuilds the canonical dataset.
- `scripts/render-embedded-directory.mjs` reproduces the page's self-contained data snapshot.
- `scripts/verify-certified-election-data.mjs` validates source allowlisting, IDs, references, names, affiliations, statuses, totals, checksums, and page synchronization.
