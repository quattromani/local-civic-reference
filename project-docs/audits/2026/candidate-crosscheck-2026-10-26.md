# Candidate cross-check, October 26, 2026

Reviewed all 175 current candidacies (174 distinct people) across the directory's 69 office records. The six judges were reviewed separately. Candidate data and affiliations were not changed.

## Findings requiring review

| Entry | Site and filing list | County sample ballot | Recommended handling |
| --- | --- | --- | --- |
| Island Grove Township Board | Robert L. Rhine | Robert L. Rinne | Unresolved spelling conflict between official documents. Confirm with the county before changing identity or attaching registration evidence to the alternate spelling. |
| Blue Springs mayor | Gene Radar Reedy | Radar Reedy | Preserve the sourced display name; add a separately sourced ballot-name variant after review. Both documents identify the petition filing. “By Petition” is a filing method, not a party affiliation. |
| Diller-Odell Ward 1 | B.J. Stein (site); BJ Stein (filing list) | BJ Stein | Punctuation difference only. A ballot-name field can preserve the printed form. |

The Rhine/Rinne difference was verified visually on page 3 of the county sample ballot, not inferred solely from extracted text.

## What agrees

The refreshed Secretary of State final candidate list and county filing list have the same SHA-256 hashes as the repository's archived copies. No later roster change was found in the documents currently linked by those election offices.

All 175 current entries have support in those refreshed filing sources. The county sample ballot supports the represented printed rosters, office/ward assignments, and partisan ballot labels, subject to the name differences above. The governor and lieutenant governor tickets also agree. Candidate order varies by precinct and is not a conflict.

All 31 declared write-in entries remain supported by the county filing list and are absent as printed names for their corresponding offices on the sample ballot. That is consistent with the site's existing write-in notices. A name appearing in a different race does not establish that it is printed for the write-in office; Doug Pieper, for example, is printed for Lower Big Blue NRD but is a declared write-in for Riverside Township.

No other substantive mismatch was found among the represented current candidate rosters. This review did not repeat voter-registration identity checks or re-audit historical primary vote totals. Neither the state candidate list nor the county sample ballot verifies a person's voter registration in a nonpartisan race.

## Coverage gaps

The site expressly covers selected races. The county sample ballot additionally lists 28 candidate entries across the following subjects, which are not represented in the current directory:

| Subject | Additional candidate entries |
| --- | --- |
| Lewiston School District 69 | Rae Lynne Bredemeier; Aaron Rule; Sharon L. Mencl |
| Norris School District 160, Wards 2, 4, and 6 | Steph Meese; Aaron Wubbels; Craig Gana, respectively |
| Tri County School District 300 | Aaron Bock; Brian R. Quackenbush; Brandon Esau; Brian Scherling; Brandon Pohlmann |
| Crete School District 2 | Marilyn Schacht; Eric Fahrlander; Greg Hollman; Greg Mach |
| Wilber-Clatonia School District 82 | Laura Niles; Chris Woerner; Tim Riechers |
| Southeast Community College, District 1 | Michael Schoop |
| Nemaha NRD, Subdistrict 6 and At Large | J. Duane Sugden; Tracy Ensor, respectively |
| Lower Big Blue NRD, Subdistrict 1 | Ryan Birkett; Anne DeVries |
| Lower Big Blue NRD, Subdistrict 2 | Bruce Weise; Doug Pieper |
| Lower Big Blue NRD, Subdistrict 5 | Dean Roehr |
| Lower Big Blue NRD, Subdistrict 6 | Matthew Mason |
| Lower Big Blue NRD, At Large | Jason Pohlmann |

Nemaha NRD Subdistrict 1 also appears with no printed candidate. These are coverage gaps, not evidence that the existing listed candidates are incorrect. The two user photographs show only one precinct's ballot and cannot establish the full set of district-specific contests. No additional candidates were added in this task.

## Sources and reproducibility

- [Secretary of State final candidate list, September 11](https://sos.nebraska.gov/sites/default/files/doc/elections/2026/Final_Statewide_General_Candidate_Filing_List_9.11.26.pdf).
- [County filing list](https://gagecountyne.gov/wp-content/uploads/sites/35/2026/07/2026-filings_for_office-General-for-web-page-w-auto-adv.pdf).
- [County general-election sample ballot](https://gagecountyne.gov/wp-content/uploads/sites/35/2026/07/Sample-ballot-Gen-2026.pdf), pages 1–3.
- [Secretary of State final judicial retention list](https://sos.nebraska.gov/sites/default/files/doc/elections/2026/Final_List_of_Judges_Who_Filed_for_Retention_List_8.3.26.pdf).

The adjacent `candidate-crosscheck-2026-10-26.json` records every current candidate entry, its finding, the coverage gaps, retrieval dates, hashes, and archival paths. The sample ballot and judicial list are preserved under `src/provenance/elections/2026/sources/`. The existing archived filing PDFs were retained after verifying their hashes against the fresh downloads.
