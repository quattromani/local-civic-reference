# Changelog

Meaningful data, architecture, governance, and publication milestones are recorded here. Routine implementation details are intentionally omitted.

## 2026-10-13 — Diller-Odell Ward 1 ballot clarification

- Named the race “Diller-Odell School Board, Ward 1” and added the user-approved clarification that three seats are up in 2026 and voters should check their assigned ballot.
- Preserved all candidate affiliations and residence information; no manual-checklist findings were applied.

## 2026-10-13 — County voter-roll affiliation confirmations

- Recorded Republican affiliations for Gene Radar Reedy (Blue Springs) and Anthony M. Landon (Odell), and Nonpartisan for Max Manuilov (Wymore).
- The publisher supplied the results and confirmed the Gage County Voter Roll as the source. October 13 is the review/receipt date; the roll date and lookup date were not supplied, and the agent did not inspect the roll.
- Preserved a distinct county voter-roll source, with no invented download link, and left earlier Nebraska VoterCheck dates intact.

## 2026-10-11 — Editorial presentation and cache consistency

- Adopted the reviewed editorial layout, inset sample-ballot photograph, revised introductory wording, compact candidate rows, and responsive navigation.
- Refined interactive spacing, count pills, typeahead presentation, and filtering visibility. Hidden records now remain hidden despite layout styles.
- Versioned publication data requests with the application build to prevent cached earlier election files from causing initialization failures.
- Retained canonical candidate data, affiliation evidence distinctions, source links, and verification dates.

## 2026-10-11 — Directory usability, election reuse, and analytics

- Refined the opening copy, sample-ballot header, affiliation guide, race links, search controls, and dynamic counts while preserving evidence distinctions and neutral presentation.
- Added election configuration, the versioned publication contract, and an isolated synthetic election fixture.
- Added standard GA4 for the production hostname and general interaction events that omit candidate names, search text, and selected party affiliations.
- Rendered the directory into initial HTML, corrected heading structure and IDs, added HTML and accessibility scans, and optimized images and generated JSON.
- Kept historical publication downloads outside the active build. Validation and review details appear in the election-reuse and accessibility-performance-analytics documents.

## 2026-10-06 — General-election roster review

- Rechecked the county list through its September 29 entry and the Secretary of State final September 11 list; archived both with source hashes.
- Added 31 declared write-ins, one county petition candidate, and nine federal/state candidates; moved Cindy Burbank to primary history without inventing a withdrawal date.
- Added governor ticket names, explicit write-in/petition status, and distinct final-state versus county-filing notices.
- Updated the guide review date to October 6 while preserving earlier affiliation verification dates. New unsupported affiliations remain pending.
- Added official-roster regression coverage and passed the complete release checks. Details: `audits/2026/general-election-review-2026-10-06.md`.

## 2026-08-12 — County filing-deadline roster update

- Replaced the July 15 county filing snapshot with the official Gage County candidate list through the August 3 nonincumbent filing deadline.
- Added 10 local candidates filed after the prior snapshot and regenerated the canonical and public directory projections.
- Removed Neil VanBoening from the current Wymore City Council roster and retained Paul Borzekofski only as primary history after the county list recorded their withdrawals.
- Verified all 10 newly added affiliations through unique Gage County Nebraska VoterCheck returns; the Andy Buhr filing was matched to the unique Andrew Ervin Buhr record in the Adams precinct.
- Updated filing-window language, source provenance, category summaries, review materials, and regression checks without claiming final ballot certification.

## 2026-07-16 — Repository promotion

- Activated focused GitHub Pages deployment of the generated `public/` publication while retaining `src/` as the only editing authority.
- Unified the Candidate Directory heading, search, and data-derived scope statistics into one semantic editorial utility.
- Promoted the project from a stakeholder demonstration to the Local Civic Reference knowledge repository.
- Established `src/` as the authoritative source for normalized data, provenance, editorial content, and website source.
- Established `public/` as the reproducible GitHub Pages publication.
- Retired the single-file stakeholder artifact, billboard modal, embedded data, embedded CSS, and `dist/` delivery model.
- Extracted the site into semantic HTML templates, modular CSS, modular JavaScript, external publication-safe JSON, self-hosted Merriweather, and self-hosted Source Sans 3.
- Added the `build`, `validate`, and `release` command surface.
- Preserved the canonical public election projection without factual, provenance, methodology, or ordering changes.
- Updated proof gates to validate canonical source against the generated public publication.

## 2026-07-15 to 2026-07-16 — Data certification and release gates

- Normalized candidate, office, jurisdiction, affiliation, candidacy, contest, result, source, filing-window, and review records.
- Separated current general-election listings from primary history.
- Established record-specific provenance and source-certainty policy.
- Established explicit neutral ordering and editorial-equality governance.
- Completed WCAG 2.2 AA remediation and accessibility regression coverage.
- Completed the manual Nebraska VoterCheck affiliation review while retaining neutral pending-verification states.
- Added official filing snapshots, Gage County Electionware reporting, state canvass evidence, and archived source checksums.
