# Architectural Decisions

This document preserves why the project is structured as it is. Implementation details belong in code; operational status belongs in `PROJECT-READINESS.md`.

## ADR-001 — The repository is the product

Local Civic Reference is organized around durable civic knowledge rather than around one webpage. Canonical facts, relationships, provenance, review state, and source scope live in structured repository data. Websites, print publications, APIs, and future retrieval tools are consumers of that knowledge.

## ADR-002 — `src/` is authoritative and `public/` is generated

Editable data, content, provenance, and website source live under `src/`. GitHub Pages publishes the generated `public/` directory. Public files are committed for transparent review and simple Pages deployment, but they are never edited directly.

## ADR-003 — Portable stakeholder delivery is retired

The former single-file stakeholder artifact and billboard-preview modal served a temporary demonstration purpose. They are not part of the canonical civic publication. GitHub Pages replaces portable single-file delivery, and no `dist/` release surface remains.

## ADR-004 — Knowledge and presentation are separate

Election data and editorial site content are maintained as separate JSON resources. HTML templates contain structure and named build tokens rather than duplicate civic records. The build produces a publication-safe public projection and accessible static markup.

## ADR-005 — Simple tooling is a constraint

The repository uses semantic HTML, modular CSS, vanilla JavaScript, JSON, and focused Node.js scripts. It does not use a framework or general-purpose bundler. The command surface is `npm run build`, `npm run validate`, and `npm run release`.

## ADR-006 — Evidence roles remain explicit

Discovery, filing, affiliation verification, ballot participation, results, and election status are distinct claims. A source may support only the roles its evidence establishes. Electionware is authoritative for the Gage County reporting within its scope and is still labeled `UNOFFICIAL RESULTS`; Nebraska VoterCheck supports directly verified voter-registration affiliation.

## ADR-007 — Editorial equality is architectural

Comparable candidates and offices receive consistent fields, order, typography, spacing, interaction, source treatment, and verification language. Ordering is explicit policy and never derives from votes, placement, party, advancement, or incumbency.

## ADR-008 — Accessibility is part of publication correctness

Semantic structure, keyboard operation, visible focus, contrast, reflow, reduced motion, native disclosures, and understandable dynamic status are release requirements. Accessibility validation is part of the same release command as data and provenance validation.

## ADR-009 — Fonts are self-hosted

Merriweather and Source Sans 3 are stored locally in the repository using only the required files. The public site has no font CDN or remote runtime dependency.

## ADR-010 — GitHub Pages publishes the generated `public/` payload

The public site is deployed to GitHub Pages from the generated `public/` directory. Because GitHub Pages branch-based settings do not expose `/public` as a selectable folder, a focused GitHub Actions workflow uploads `public/` unchanged. The workflow is publication transport only and does not rebuild or redefine canonical knowledge. The current Pages address is temporary, so canonical and Open Graph URLs remain absent until a permanent public home is approved.
