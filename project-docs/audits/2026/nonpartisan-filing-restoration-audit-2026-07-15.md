# Nonpartisan filing restoration audit

Audit date: July 15, 2026

Canonical dataset: `data/election-directory-2026.certified.json`

Schema version: 3.2.0

SHA-256: `fe1cb62a990506ee7b0bc386b579af0a6d6f54600d8d7cd01d4e13b201ae19a4`

## Result

Candidate filing names were restored for nonpartisan school-board, municipal, village, and township offices omitted from the May 2026 primary report. The restoration uses the two political-party pages strictly as Tier 4 filing sources.

No party label, primary result, outcome, incumbency claim, advancement claim, or vote total was imported from either filing page.

## Current directory

| Category | Offices | Candidacies |
|---|---:|---:|
| School Boards | 4 | 19 |
| Cities & Villages | 17 | 47 |
| County Offices | 2 | 5 |
| State Offices | 9 | 37 |
| **Total** | **32** | **108** |

The canonical dataset contains 108 unique candidate identities and 108 candidacies.

## Provenance separation

- All 51 primary result records continue to cite the county-issued Gage County Electionware report labeled `UNOFFICIAL RESULTS`.
- All partisan candidacies continue to rely exclusively on Electionware for their Gage County-reported participation and results.
- The 57 restored candidacies are nonpartisan, have no result record, and carry `filingSourceId` rather than `verificationSourceId`.
- Restored record status is `Filing Source — Official Filing Confirmation Needed`.
- Filing sources are prohibited from affiliation, result, verification, and outcome fields by the validator.

## Affiliation review

- 42 affiliations remain verified through Electionware ballot contests or Nebraska VoterCheck.
- 9 affiliations in Electionware-reported nonpartisan primary contests remain `Not Confirmed`.
- 57 restored filing affiliations are `Verification Needed` / `Pending Verification`.
- The retained VoterCheck table contained no exact restored-candidate match, so no prior verified affiliation was lost or overwritten and no lookup was repeated.

## Restoration inclusion rule

Only names the filing pages explicitly describe as filed, filed for reelection, running, or challenging were restored. Current officeholders without filing language were excluded.

One filing name, `Kieth Maguire`, is preserved exactly as displayed by the filing source and specifically flagged for official spelling confirmation.

## Integrity validation

The production validator reports:

- duplicate candidates: 0
- duplicate offices: 0
- orphaned records: 0
- partisan records using filing-source provenance: 0
- filing-source records containing results: 0
- filing-source affiliations: 0
- page-to-canonical mismatches: 0
- validation errors: 0
