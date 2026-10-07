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

## October 6, 2026 — Directory category sequence

Brief: make the directory easier to scan by keeping community institutions together before county and broader government races. The user-approved order is Cities & Villages, Township Boards, School Boards, County Offices, State & Federal Offices, then Other Local Districts. The broader-government label explicitly includes federal races. Other Local Districts remains last, including ESU boards. This is an editorial navigation sequence, not a ranking of candidates or offices. Canonical ordering policy drives all generated presentations; office and candidate ordering within each category is unchanged.

## October 6, 2026 — Office sequence informed by ballot photographs

Brief: preserve the approved category navigation while using a recognizable civic office sequence within categories. User-supplied photographs of the November 3 general-election ballot for NW Quad Area 05 show Senate, House, governor, secretary of state, treasurer, attorney general, auditor, legislature, and state board of education. State & Federal Offices now follows that sequence. County offices follow the photographed sequence: assessor, attorney, clerk, district court clerk, register of deeds, sheriff, surveyor, treasurer. Supervisor districts are appended in district-number order because this ballot does not show them. Other Local Districts places public power before ESU, as photographed; ESU offices are then ordered by unit and district number. These are explicit editorial rules informed by one ballot style, not a claim to reproduce every county ballot. Communities, school districts, and townships remain alphabetical, as do candidates.

The supplied photos also show community college and natural resources district contests outside the current directory scope. Reordering does not silently add those races or establish completeness of the guide.

Scope constraint confirmed by the user: ballot issues, initiatives, and constitutional amendments will not be added to this project. Ballot photographs are used only as office-order references.

## October 6, 2026 — Neutral browser favicon

Brief: identify the civic reference in browser tabs with a familiar voting symbol, legible at small sizes and independent of party colors. A simplified outlined ballot square with a checkmark uses charcoal on light browser themes and light gray on dark themes, with a transparent background. The SVG lives in authoritative site assets and is copied by the existing build; its relative URL works on both the repository Pages path and custom domain. No candidate or affiliation meaning is encoded in the mark.
