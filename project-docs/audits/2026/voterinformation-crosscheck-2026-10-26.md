# Voter Information comparison, October 26, 2026

The user clarified that the requested comparison source was Voter Information Project, https://www.voterinformation.org/. The earlier official-source audit remains a separate check.

The user considers Voter Information accurate but incomplete, with Gage County's records controlling local roster and ballot coverage. This comparison uses that distinction: an absent VIP entry does not show that a Party Reveal entry is incorrect, and a VIP affiliation label is not silently relabeled as a direct voter-registration check.

## Review scope

Reviewed all 30 race pages linked from [VIP's Gage County directory](https://www.voterinformation.org/county/gage/), including three court groups. These pages include 38 current candidate entries in the same races as Party Reveal. Of those, 34 affiliation labels agree after ordinary wording normalization, and four provide information where Party Reveal currently has no confirmed affiliation. No opposing affiliation label was found among those 38 comparable entries.

The county index also includes Anne DeVries and Doug Pieper in NRD races outside Party Reveal's present coverage. Those were not counted as same-office matches for their township candidacies. Searches using 124 distinct surnames for the other 134 unmatched current names returned no additional matching candidate entries. Similar names in unrelated offices were not treated as identity matches. This establishes the scope of the comparison, not universal completeness of VIP or a definitive absence from its database.

## Findings

| Subject | VIP | Party Reveal / official ballot | Handling |
| --- | --- | --- | --- |
| Freeman School Board | Includes Mary D. Benes alongside the four current candidates | County sample ballot lists Kyle Dorn, Shawn E. Mencl, Theron Troxel, and Jordan N. Freeman | Roster discrepancy. Retain the county-supported four-person roster pending a later official county correction or confirmation. Do not infer a reason for the difference. |
| District Court retention | Rick A. Schreiner | Ricky A. Schreiner | Use the official ballot name already implemented. |
| Other shortened names | David Else; Mark Kujath; John Novotny; David J.A. Bargen | David J. Else; Mark P. Kujath; John D. Novotny; David J. A. Bargen | Name-format variants, with corresponding offices matched. Preserve official ballot forms. |
| Judicial affiliations | Labels all six included judges Republican | Judicial records currently describe courts and retention questions without affiliation labels | Supplementary reported affiliations. No candidate badges or verified-registration claims were added. |

VIP labels Jeff Bacon Nonpartisan, Eric G. Malina Republican, Dan Osborn Nonpartisan, and Mark Cohen Nonpartisan. These are useful supplementary leads for entries whose affiliations are not confirmed in Party Reveal. They are not opposing labels, and the comparison request did not change the publication's affiliation records or evidence contract. Doug Pieper is also labeled Republican in the NRD listing; applying that to the township entry would require the appropriate identity/source review.

VIP has duplicate pages for Lower Big Blue NRD Subdistricts 1 and 2, with agreeing names and labels. Its Subdistrict 5 page lists both Dean Roehr and Den Roehr; the county sample ballot prints Dean Roehr. These are observations about supplementary coverage outside the present directory, not changes to its candidate roster.

## Evidence

The adjacent JSON records the 38 matched entries, source URLs, comparisons, and scope. DOM-derived snapshots of the 30 race pages and the 124 surname-search results are preserved under `src/provenance/elections/2026/sources/` as `vip-gage-records-2026-10-26.json` and `vip-name-searches-2026-10-26.json`.

Key pages:

- [Freeman School District](https://www.voterinformation.org/races/general-2026/freeman-school-district-vote-up-to-3/).
- [District Court retention](https://www.voterinformation.org/races/general-2026/judge-of-the-district-court-district-01-g26/).
- [ESU 4, District 3](https://www.voterinformation.org/races/general-2026/educational-service-unit-04-district-03-g26/).
- [ESU 6, District 5](https://www.voterinformation.org/races/general-2026/educational-service-unit-06-district-05-g26/).
- [U.S. Senate](https://www.voterinformation.org/races/general-2026/united-states-senator-g26/).
- [U.S. House, District 3](https://www.voterinformation.org/races/general-2026/united-states-house-of-representatives-district-3-g26/).

No candidate data, judicial data, application code, or public output changed during this supplementary review. The previously passing release checks remain applicable to the unchanged implementation. No commit or push performed.

## Subsequent user-authorized updates

After reviewing these findings, the user authorized applying the four additional affiliations: Jeff Bacon Nonpartisan; Eric G. Malina Republican; Dan Osborn Nonpartisan; Mark Cohen Nonpartisan. They are now recorded and displayed as reported affiliations with individual VIP citations. This subsequent change supersedes the earlier implementation status above; the comparison evidence remains a record of the pre-update state. The user confirmed that Mary Benes must remain excluded and that the judge name must use the official spelling Ricky A. Schreiner. No roster additions or other affiliation changes were made.
