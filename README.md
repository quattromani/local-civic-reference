# Local Civic Reference

Local Civic Reference stores structured civic information for Gage County, Nebraska. The first publication is a candidate directory, and later publications can use the same records for other elections or formats.

The repository contains the authoritative data, source evidence, and review records. The website is generated from the repository.

Maintainers preserve facts in structured records with source references and version history, so readers and future maintainers can trace each claim. The same records can support websites, assistive technology, print publications, PDFs, and future civic tools.

## What lives here

```text
src/
  content/                    Site copy, interface copy, methodology, and source descriptions
  data/                       Canonical normalized civic data
  provenance/                 Archived source evidence
  site/                       Editable website templates, styles, scripts, and assets

public/                       Generated GitHub Pages publication
scripts/                      Build, validation, proof-gate, and release checks
project-docs/                 Governance, decisions, provenance notes, audits, and history
```

`src/content/site-content.json` owns page and interface wording. `src/content/source-copy.json` owns public methodology and repeated source descriptions. Rendering scripts interpolate values without becoming separate prose authorities. Filing-source descriptions remain in their source records.

`src/` is authoritative. `public/` is generated and must not become a second editing surface. A future publication should derive from the same canonical records rather than restating or reinterpreting them independently.

## Data and publication

The 2026 election directory separates candidates, candidacies, offices, jurisdictions, affiliations, contests, results, sources, filing snapshots, election stages, and review states. Stable IDs preserve relationships without duplicating facts. Source roles distinguish what a filing list, voter-registration lookup, county report, or state canvass can actually establish.

The public site receives a publication-safe projection of that model. Internal audit records, source archives, manual-review queues, and development metadata remain in the repository but are not copied into the published JSON.

## Working with the repository

Use a Node.js version supported by `package.json` (22.22.2, 24.15.0, or a compatible version from 26 onward). Run `npm ci` to install the locked build and validation tools. The browser application has no runtime framework.

```bash
npm run build
```

Rebuilds the canonical election dataset from its approved source transcriptions, generates publication-safe JSON, and writes the complete GitHub Pages site to `public/`.

```bash
npm run validate
```

Builds the project, validates the canonical model, runs Proof Gates 1–4, checks election-stage scope and category counts, scans publication safety, and verifies deterministic output.

```bash
npm run release
```

Runs the full validation and build sequence, then checks the repository boundary and required release documentation. A release is ready to commit only when this command passes.

## Validation guarantees

The current validation suite protects:

- record-specific public provenance;
- accurate source-certainty and methodology language;
- explicit editorial ordering independent of election outcomes;
- a defensible WCAG 2.2 AA baseline;
- normalized and non-duplicative civic records;
- publication-safe public JSON;
- canonical-to-public field equality; and
- deterministic builds.

These are architectural guarantees, not optional presentation preferences.

## GitHub Pages

GitHub Pages publishes the generated contents of `public/` through `.github/workflows/deploy-pages.yml`. GitHub Pages does not offer `/public` as a branch-folder selector, so the focused workflow uploads `public/` as the Pages artifact. The workflow is publication transport only; it does not rebuild or redefine canonical knowledge.

The approved public home is https://partyreveal.com/. The build reads the canonical URL and calendar links from `src/content/site-content.json`.

## Extending the reference

Store future civic resources, e.g., government structure, board information, taxation explainers, and civic education, as structured data with source evidence under `src/`. Generate website content from the records so important facts remain recoverable outside the website.

Before adding a new subject area, document:

1. the claims being represented;
2. the authoritative source classes;
3. the normalization and identity rules;
4. the publication-safe projection; and
5. the validation needed to preserve meaning across outputs.

## Governance

Project status and blockers are tracked in [PROJECT-READINESS.md](project-docs/PROJECT-READINESS.md). Architectural reasoning is recorded in [DECISIONS.md](project-docs/DECISIONS.md). Source roles are inventoried in [DATA-SOURCES.md](project-docs/DATA-SOURCES.md), and meaningful milestones are recorded in [CHANGELOG.md](project-docs/CHANGELOG.md).

Maintainers apply the same standards to comparable records, cite evidence for each claim, and provide accessible presentations. Each source supports only the facts its evidence establishes.

## Judicial retention

The active election configuration may specify a `judicialRetention` dataset. Judges and Yes/No retention questions remain separate from candidate, candidacy, and affiliation records. `scripts/judicial-retention.mjs` validates the dataset and creates the public projection. `src/site/scripts/judicial-retention.js` renders the same court groups and sourced questions for both static and interactive use. Wording lives in `src/content/site-content.json`; evidence stays under `src/provenance/`. Candidate totals exclude judges. The retention drawer has its own counts and shares directory search without acquiring candidate affiliation labels.

`npm run release` includes the focused retention checks. The October 26, 2026 architecture decision records the pattern, and `project-docs/audits/2026/candidate-crosscheck-2026-10-26.md` records the accompanying roster review and unresolved official-source differences.
