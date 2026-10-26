# Project Readiness

**Project:** Local Civic Reference

**Current subject:** 2026 Gage County candidate reference

**Repository role:** Canonical civic knowledge source

**Documentation reconciled:** October 11, 2026

**Election data last reviewed:** October 6, 2026

**Election schema:** 4.0.0

**Site-content schema:** 1.0.0

This is the living operational roadmap for the repository. Architectural reasoning belongs in `DECISIONS.md`; source roles belong in `DATA-SOURCES.md`; completed milestones belong in `CHANGELOG.md`.

## Current phase

The project was promoted on July 16, 2026 from a stakeholder website demonstration to a canonical civic knowledge repository.

The repository—not the website—is now the product. Structured source data, normalized civic records, provenance, editorial content, and validation rules are authoritative. The website is the first generated public interface and is designed for GitHub Pages publication from `public/`.

The former single-file stakeholder artifact, billboard-preview modal, and `dist/` delivery model are retired. They are not release targets and must not be restored as parallel sources of truth.

## Repository architecture

```text
src/
  content/                    Page copy, interface copy, methodology, and source descriptions
  data/elections/2026/        Canonical election model and source transcriptions
  provenance/elections/2026/  Archived source documents
  site/                       Editable HTML template, CSS, JavaScript, and fonts

public/                       Deterministic GitHub Pages output
scripts/                      Build, validation, proof-gate, and release automation
project-docs/                 Governance, decisions, source inventory, audits, and history
```

### Authority boundaries

- `src/` is the only editing surface for public content, civic data, provenance, and site source.
- `public/` is generated and committed for review and GitHub Pages delivery.
- Public JSON is a publication-safe projection, not a copy of the internal canonical model.
- Project documentation describes governance and operations; it does not duplicate canonical civic facts.

## Command surface

```bash
npm run build
```

Rebuilds the canonical dataset from approved source transcriptions and generates the complete `public/` site.

```bash
npm run validate
```

Runs syntax checks, canonical validation, Proof Gates 1–4, election-stage scope, category-count semantics, publication safety, and deterministic-build verification.

```bash
npm run release
```

Runs validation, rebuilds the publication, and verifies the final repository boundary and required release documentation.

## Current data state

- **Sources:** 8
- **Jurisdictions:** 49
- **Offices:** 69
- **Unique candidates:** 201
- **Candidate-office entries:** 202
- **Current general-election entries:** 175
- **Primary-history entries:** 27
- **Verified affiliations:** 158
- **Pending affiliation verification:** 43
- **Open scope-review records:** 1
- **County filing snapshot date:** September 29, 2026 (reviewed October 6)
- **State filing snapshot date:** September 11, 2026 final list (reviewed October 6)
- **County filing scope:** Includes petition and declared write-in candidates; not a certified sample ballot

The project does not label a candidate or contest “unopposed in the general election” from an incomplete filing snapshot. Current and historical election stages remain explicitly separated.

## Architectural guarantees

### Provenance

Each publication-relevant fact resolves to its record-level source. Filing, voter-registration affiliation, primary participation, result, election stage, and review date are distinct roles. Missing or invalid source references fail validation rather than falling back silently.

### Source certainty

The Gage County Electionware report is the authoritative project source for Gage County reporting within its scope and remains described as `UNOFFICIAL RESULTS`. County reporting does not establish final statewide or multi-county results. Nebraska VoterCheck supports direct voter-registration affiliation verification when confirmed.

### Editorial ordering

Categories, offices, and candidates use explicit ordering policy. Votes, placement, advancement, incumbency, and party affiliation cannot determine visual order.

### Editorial equality

Comparable candidates within an office receive the same structure, field order, typography, spacing, badges, source treatment, review-date treatment, interaction, and visual prominence. Missing values remain visible with neutral dataset-status language such as `Verification Pending`.

The release review question is:

> If two records contained identical facts, would they receive identical treatment?

If the answer is no, the implementation must be reconsidered unless an objective documented requirement explains the difference.

### Accessibility

Semantic landmarks, native disclosures, keyboard operation, visible focus, contrast, narrow reflow, text spacing, reduced motion, status announcements, and print readability are release requirements. The retired stakeholder modal is no longer part of the public accessibility surface.

### Publication safety

The public projection excludes internal manual-review queues, scope-review records, source-archive paths, source tiers, discrepancy history, rejected values, and private voter details. Public output contains no embedded base64 assets or local paths. Standard Google Analytics 4 is configured for the production hostname only. It uses analytics cookies and the external Google tag; localhost and synthetic fixture previews do not initialize tracking.

## Proof gates

| Gate | Guarantee | Status |
|---|---|---|
| Proof Gate 1 | Record-specific provenance and full public projection equality | Passing |
| Proof Gate 2 | Accurate certainty language and implemented methodology | Passing |
| Proof Gate 3 | Explicit neutral ordering independent of outcomes | Passing |
| Proof Gate 4 | WCAG 2.2 AA automated baseline and regression coverage | Passing |

## GitHub Pages publication

The repository deploys the generated `public/` payload through GitHub Pages.

- The repository owner enabled Pages with GitHub Actions as the publication source.
- `.github/workflows/deploy-pages.yml` uploads `public/` unchanged; it does not create a second build or data authority.
- The approved public home is https://partyreveal.com/, as recorded in the October 7 decision.
- Canonical and Open Graph URLs come from `src/content/site-content.json`.
- `public/` must always be regenerated through `npm run build`; direct edits are release defects.

## Remaining publication review

The site is published as a sourced reference for selected races. Open affiliation records remain explicitly unconfirmed. The items below limit completeness or require additional review; they do not justify inferring missing facts.

1. **County ballot confirmation:** The statewide final candidate list is dated September 11. The county filing list includes entries through September 29 and was reviewed October 6; it is not a certified sample ballot. Confirm printed county ballot names against official ballot materials before using final county contest-status language.
2. **Affiliation completion:** Verify the 43 remaining affiliation records using documented evidence, and do not infer affiliations.
3. **Scope completion:** Resolve the 1 open scope-review record, including the applicable district mapping.
4. **Final county ballot status:** Preserve the distinction between declared write-ins and printed ballot names until official county ballot materials establish the latter. The statewide final candidate list is already recorded.
5. **Publication ownership:** Confirm ongoing reviewer, update cadence, and correction-response responsibility.
6. **Hosted accessibility QA:** Repeat browser and assistive-technology checks against the final GitHub Pages URL after deployment.

## Repository-promotion checklist

- [x] Rename the project `local-civic-reference`.
- [x] Establish `src/` as the authoritative source.
- [x] Establish generated `public/` output for GitHub Pages.
- [x] Separate site content from election data.
- [x] Extract HTML, CSS, JavaScript, JSON, fonts, and provenance into explicit boundaries.
- [x] Retire the stakeholder modal, embedded billboard, portable artifact, and `dist/`.
- [x] Add `build`, `validate`, and `release` commands.
- [x] Preserve the canonical public election projection without factual changes.
- [x] Rewrite repository and governance documentation around knowledge-first publishing.
- [x] Create and push the public GitHub repository.
- [x] Owner enabled GitHub Pages with a workflow that publishes `public/`.

## Next recommended work

1. Verify the deployed `public/` site in multiple browsers and assistive technology.
2. Confirm county printed ballot names against official county ballot materials, and record later source changes when supported.
3. Resolve pending affiliation and scope-review records.
4. Use the documented election-cycle rollover process in `election-reuse.md`, with fresh source and roster review for every real election.
5. Define the next civic knowledge domain only after its source, normalization, and validation contract is documented.

## Handoff

- **Current phase:** Published reference refinement and provisional election-data completion.
- **Architecture confidence:** High.
- **Data integrity confidence:** High within the documented source scope.
- **Public-election completeness:** Limited to the selected races and reviewed filing sources; county printed ballot confirmation and manual review remain open.
- **Primary risk:** Treating a time-bounded filing snapshot as a final ballot.
- **Next milestone:** Hosted accessibility QA, followed by county final-ballot confirmation and remaining manual review.

## Documentation reconciliation on October 11, 2026

The current source records contain 43 affiliations without verified evidence and 1 open scope-review record. Affiliation counts refer to affiliation records, not candidate-office entries. The county snapshot and state final-list dates are reproduced from the October 6 data review. The approved public address is recorded in the October 7 decision. The editorial review did not perform a new election-source or hosted-site review.

## October 26, 2026: Local judicial retention review

Six judicial retention questions are prepared locally with separate canonical records and a publication-safe projection. Candidate data is unchanged. The user reviewed and approved the judicial drawer and four reported affiliation updates for commit and push on October 26, 2026. The audit identifies an unresolved Rhine/Rinne spelling conflict, two ballot-name variants, and selected-coverage gaps. No new registration checks are claimed.
