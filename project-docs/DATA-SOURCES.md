# Data Sources

This inventory describes the external evidence used by the 2026 election reference. The canonical registry and record-level source assignments live in `src/data/elections/2026/election-directory.json`; this document explains their roles and limits in plain language.

## Gage County Electionware Summary Results Report

- **Purpose:** Candidate participation, Gage County vote totals, primary outcomes, and election-status facts represented in the report.
- **Coverage:** Gage County reporting for the May 12, 2026 primary election.
- **Authority:** County-issued election reporting; authoritative project source within its stated Gage County scope.
- **Status:** The document is labeled `UNOFFICIAL RESULTS`.
- **Update frequency:** Election event publication; replace or supplement only with a later official county source.
- **Limitations:** County totals do not establish final statewide or multi-county district outcomes.
- **Archive:** `src/provenance/elections/2026/sources/gage-2026-primary-electionware-unofficial-results.pdf`

## Nebraska VoterCheck

- **Purpose:** Direct verification of voter-registration affiliation when a unique lawful match is confirmed.
- **Coverage:** Individually reviewed candidate records.
- **Authority:** Official Nebraska voter-registration lookup.
- **Update frequency:** Manual review when affiliation is added, corrected, or rechecked.
- **Limitations:** Ambiguous name results remain pending; private voter details are not published.
- **URL:** `https://www.votercheck.necvr.ne.gov/voterview/`

## Gage County candidate filing snapshot

- **Purpose:** Candidate and office filings currently listed for the general election.
- **Coverage:** Gage County offices represented in the July 15, 2026 snapshot.
- **Authority:** Official county filing source.
- **Update frequency:** Refresh after filing deadlines and whenever an official final list or sample ballot becomes available.
- **Limitations:** The snapshot is time-bounded and does not establish final contest status while filing or other candidate-access pathways remain open.
- **Archive:** `src/provenance/elections/2026/sources/gage-2026-general-filing-snapshot-2026-07-15.pdf`

## Gage County offices-up-for-election notices

- **Purpose:** Office scope, positions to fill, and applicable filing deadlines.
- **Coverage:** Gage County general-election and primary offices in the 2026 cycle.
- **Authority:** Official county election notice.
- **Update frequency:** Election-cycle publication.
- **Limitations:** Establishes office metadata, not candidate affiliation or outcome.
- **Archive:** `src/provenance/elections/2026/sources/gage-2026-general-offices-up-for-election.pdf`

## Nebraska statewide candidate filing snapshot

- **Purpose:** Statewide and district candidate filings currently listed for the general election.
- **Coverage:** State and multi-county offices applicable to the project’s current scope.
- **Authority:** Official Nebraska Secretary of State filing workbook.
- **Update frequency:** Refresh after filing deadlines and upon publication of a final candidate list.
- **Limitations:** A filing snapshot is not a final ballot and does not independently establish voter registration.
- **Archive:** `src/provenance/elections/2026/sources/ne-2026-statewide-candidate-filing-list-2026-07-15.xlsx`

## Nebraska Board of State Canvassers primary report

- **Purpose:** Official statewide and multi-county primary nominee and advancement facts.
- **Coverage:** Nebraska 2026 primary contests within the project scope.
- **Authority:** Official state canvass.
- **Update frequency:** Final canvass publication for the election event.
- **Limitations:** Does not replace county reporting for the county-level vote details specifically shown from Electionware.
- **Archive:** `src/provenance/elections/2026/sources/ne-2026-primary-canvass-official-results.pdf`

## Gage County primary sample ballots

- **Purpose:** Ballot participation and nomination-rule evidence, including advancement without a contested primary where applicable.
- **Coverage:** Gage County 2026 primary ballot styles.
- **Authority:** Official county ballot material.
- **Update frequency:** Election-cycle publication.
- **Limitations:** Does not verify voter-registration affiliation.
- **Archive:** `src/provenance/elections/2026/sources/gage-2026-primary-sample-ballots.pdf`

## Structured source transcriptions

The build reads these maintained transcriptions:

- `src/data/elections/2026/source-data/gage-2026-primary-electionware.json`
- `src/data/elections/2026/source-data/official-filing-snapshots-2026.json`
- `src/data/elections/2026/source-data/manual-affiliation-verification-2026-07-16.json`

The archived documents remain the evidentiary sources. The transcriptions make their relevant facts reproducible and machine-readable; they do not increase the authority of the originals.
