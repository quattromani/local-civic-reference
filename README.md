# Local Civic Reference

Local Civic Reference is an enduring repository of structured civic knowledge for Gage County, Nebraska. Its first publication is a candidate directory, but the repository is intentionally broader than one election, one webpage, or one delivery format.

The central principle is simple: **the repository is the product; the website is one presentation of its knowledge.**

Facts are maintained in normalized, traceable, version-controlled records so the same underlying truth can support people reading a website, assistive technology, print publications, PDFs, future civic tools, conversational retrieval, and later election cycles. Human understanding remains the primary purpose. Reuse is a consequence of preserving knowledge well.

## What lives here

```text
src/
  content/                    Editorial and interface content
  data/                       Canonical normalized civic data
  provenance/                 Archived source evidence
  site/                       Editable website templates, styles, scripts, and assets

public/                       Generated GitHub Pages publication
scripts/                      Build, validation, proof-gate, and release checks
project-docs/                 Governance, decisions, provenance notes, audits, and history
```

`src/` is authoritative. `public/` is generated and must not become a second editing surface. A future publication should derive from the same canonical records rather than restating or reinterpreting them independently.

## Knowledge-first publishing

The 2026 election directory separates candidates, candidacies, offices, jurisdictions, affiliations, contests, results, sources, filing snapshots, election stages, and review states. Stable IDs preserve relationships without duplicating facts. Source roles distinguish what a filing list, voter-registration lookup, county report, or state canvass can actually establish.

The public site receives a publication-safe projection of that model. Internal audit records, source archives, manual-review queues, and development metadata remain in the repository but are not copied into the published JSON.

## Working with the repository

Node.js 20 or later is required. The project intentionally has no runtime framework and no package dependencies.

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

GitHub Pages is designed to publish the generated contents of `public/`. Pages is intentionally not enabled by repository automation. GitHub Pages does not offer `/public` as a branch-folder selector, so the repository owner should select **GitHub Actions** as the Pages source and use a focused deployment workflow that uploads `public/` as the Pages artifact. That workflow is a publication transport only; it must not rebuild or redefine the canonical knowledge.

No canonical URL is emitted until a final hosted URL is approved and recorded in `src/content/site-content.json`.

## Extending the reference

Future resources—governmental structure, board information, taxation explainers, civic education, and other local references—should receive their own normalized data and provenance under `src/`. The website may expand to present them, but no interface should become the sole keeper of an important fact.

Before adding a new subject area, document:

1. the claims being represented;
2. the authoritative source classes;
3. the normalization and identity rules;
4. the publication-safe projection; and
5. the validation needed to preserve meaning across outputs.

## Governance

Project status and blockers are tracked in [PROJECT-READINESS.md](project-docs/PROJECT-READINESS.md). Architectural reasoning is recorded in [DECISIONS.md](project-docs/DECISIONS.md). Source roles are inventoried in [DATA-SOURCES.md](project-docs/DATA-SOURCES.md), and meaningful milestones are recorded in [CHANGELOG.md](project-docs/CHANGELOG.md).

This project earns trust through consistent treatment, traceable evidence, accessible presentation, and careful limits on what each source is allowed to claim.
