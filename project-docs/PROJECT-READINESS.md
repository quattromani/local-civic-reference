# Project Readiness

**Project:** Local Civic Reference

**Current subject:** 2026 Gage County candidate reference

**Repository role:** Canonical civic knowledge source

**Last reviewed:** July 16, 2026

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
  content/                    Authoritative editorial and interface content
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
- **Unique candidates:** 151
- **Candidate-office entries:** 152
- **Current general-election entries:** 127
- **Primary-history entries:** 25
- **Verified affiliations:** 141
- **Pending affiliation verification:** 10
- **Open scope-review records:** 12
- **Filing snapshot date:** July 15, 2026
- **Filing window:** Open at the time of the current snapshot

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

The public projection excludes internal manual-review queues, scope-review records, source-archive paths, source tiers, discrepancy history, rejected values, and private voter details. Public output contains no embedded base64 assets, local paths, analytics, tracking, cookies, or remote runtime libraries.

## Proof gates

| Gate | Guarantee | Status |
|---|---|---|
| Proof Gate 1 | Record-specific provenance and full public projection equality | Passing |
| Proof Gate 2 | Accurate certainty language and implemented methodology | Passing |
| Proof Gate 3 | Explicit neutral ordering independent of outcomes | Passing |
| Proof Gate 4 | WCAG 2.2 AA automated baseline and regression coverage | Passing |

## GitHub Pages publication

The repository is designed for GitHub Pages deployment of the generated `public/` payload.

- Pages must not be enabled by automation during the initial repository creation.
- The repository owner will enable Pages after the initial push and select GitHub Actions as the publication source.
- A focused Pages workflow must upload `public/` unchanged; it must not create a second build or data authority.
- No canonical or Open Graph URL is emitted until the hosted URL is approved in `src/content/site-content.json`.
- `public/` must always be regenerated through `npm run build`; direct edits are release defects.

## Public-launch blockers

These blockers apply to a trusted public election release. They do not invalidate the repository architecture.

1. **Filing-window closeout:** Refresh county and state filing data after the filing window and other candidate-access pathways close.
2. **Affiliation completion:** Resolve the 10 remaining `Verification Pending` affiliation records without inference.
3. **Scope completion:** Resolve the 12 open scope-review items, including applicable multi-county district mapping.
4. **Final ballot status:** Ingest an official final candidate list or sample ballot before using final contest-status language.
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
- [ ] Owner enables GitHub Pages with a workflow that publishes `public/`.

## Next recommended work

1. Add the focused Pages deployment workflow and have the repository owner enable GitHub Pages.
2. Verify the deployed `public/` site in multiple browsers and assistive technology.
3. Refresh official filing sources after the relevant deadlines.
4. Resolve pending affiliation and scope-review records.
5. Add a documented election-cycle rollover process before introducing the next cycle.
6. Define the next civic knowledge domain only after its source, normalization, and validation contract is documented.

## Handoff

- **Current phase:** Repository promotion and initial publication setup.
- **Architecture confidence:** High.
- **Data integrity confidence:** High within the documented source scope.
- **Public-election completeness:** Provisional while filings and manual review remain open.
- **Primary risk:** Treating a time-bounded filing snapshot as a final ballot.
- **Next milestone:** GitHub Pages workflow and owner activation, followed by hosted accessibility QA.
