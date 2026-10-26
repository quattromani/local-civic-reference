# Architectural Decisions

The document records the reasons for the project structure. Code contains implementation details, and `PROJECT-READINESS.md` records operational status.

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

## October 7, 2026 — Editorial hierarchy and publisher transparency

Brief: help voters find a current candidate and understand the evidence without mistaking selected coverage for a complete ballot. Preserve the existing restrained typography, alphabetical candidate treatment, category sequence, and accessible disclosures. Reduce introductory space and repeated explanation; make current candidacy, affiliation evidence, and dated sources explicit on desktop and mobile.

The user confirms this is a Gage County GOP product. The footer credits “Paid for by the Gage County GOP” and links to its official website, replacing the personal GitHub attribution. About and footer copy identify the publisher without claiming organizational independence. Inclusion does not imply an endorsement; equal sourcing and presentation remain the directory convention.

Publication labels distinguish registered affiliation, ballot party, and primary participation using canonical source bindings. Unsourced affiliations use one public label: “Affiliation not yet verified.” Canonical verification states remain intact. Current listings lead with general-election or petition/write-in status; primary outcomes and Gage County-only primary totals remain secondary. Primary history includes withdrawals and nominees absent from the final list, not only candidates who failed to advance. Counts foreground current unique candidates; historical records remain searchable and separately disclosed. Source dates and review dates are separate, and filing descriptions do not assert open filing windows without evidence.

The approved permanent home is https://partyreveal.com/. Canonical metadata and calendar links now use it. This pass changes presentation and editorial clarity, not candidate rosters, affiliation evidence, review dates, or scope. Ballot issues remain excluded.

## October 7, 2026 — Browser title and compatible icon formats

Brief: make browser previews inviting and recognizable without changing the directory’s factual scope. The user approved “Party Reveal | Know Your Gage County Candidates” and a short preview description. Keep the existing neutral checkmark artwork as the sole icon design.

Browser PNG (32px), multi-size ICO (16/32/48px), and Apple touch PNG (180px) are generated from the canonical SVG by scripts/generate-site-icons.mjs using sharp. Raster variants use charcoal on an opaque off-white background so they remain visible when a browser cannot adapt SVG colors. Root favicon.ico and apple-touch-icon.png aliases aid discovery. Explicit icon links use a content-derived version URL, changing automatically whenever icon bytes change; existing browser caches cannot be forcibly cleared by the site. The Apple saved-site title is Party Reveal. No application mode or service worker is introduced.

## October 11, 2026: Local plain-writing review

The accepted writing review simplifies public prose and source descriptions while retaining names, dates, evidence roles, vote totals, publisher disclosures, and selected-race coverage. Page and interface wording is maintained in `src/content/site-content.json`; methodology and repeated source descriptions are maintained in `src/content/source-copy.json`. Scripts implement source policy and interpolate the editorial content. Generated `public/` files remain derived from source.

Search counts use "candidate entries" because they include both current and historical cards. Source-entry dates are review or verification dates derived from role records, so the "Reviewed" label remains accurate; filing snapshot dates remain separately labeled. Living hosting and readiness sections are reconciled against repository evidence. Historical decisions, audits, archived documents, and retired GOP publications remain records. The changes are local review work and are not a published release.

## October 11, 2026: Nonpartisan race introduction and affiliation key

The opening names the nonpartisan race types covered by the existing directory. Official Nebraska guidance and statutes support school boards, township boards, city and village offices subject to local exceptions, Legislature, State Board of Education, public power, and educational service units. The city and village statement is limited to the nonpartisan races covered here. See `project-docs/audits/2026/nonpartisan-race-copy-review-2026-10-11.md` for sources. Candidate data and election-review dates are unchanged.

The affiliation key uses the same badge labels and colors as candidate cards. All represented affiliations are included, grouped by evidence type and alphabetized within each group. Buttons select one exact evidence-and-affiliation pair, combine with text search, announce results, and can be toggled off or reset. Primary history remains separately identified and is expanded when a filter matches it. No affiliation is inferred from registration gaps or primary participation. The guide describes selected races rather than one universal ballot. Changes remain local and uncommitted.

The affiliation-key layout keeps registered affiliation visible and places ballot party, primary participation, and unverified affiliation in initially collapsed native drawers. Muted summary text and light rules reduce their visual prominence without removing the evidence distinctions or filtering controls.

Opening references to covered races link to their matching category or office. Activating a link clears directory search and affiliation filters, opens the target and its containing drawers, updates the fragment, scrolls to the target, and moves keyboard focus there. Direct fragment URLs also reveal their destination. Link labels and targets are maintained in the canonical hero content.

## October 11, 2026: Sample-ballot header illustration

The full-width header uses a generated warm desk illustration based on the user-supplied Gage County official sample-ballot screenshot. The scene includes an unmarked ballot, unused pencil, and coffee. The ballot retains its sample heading, and an HTML SAMPLE label remains visible across responsive crops. The photograph is decorative, not an authoritative ballot reproduction or candidate source. Its fine print must not be used to establish election facts.

The supplied page contains district-specific races, including county supervisor districts and legislative and district-board offices. The linked paragraph retains location-dependent ballot scope. The page title is white HTML text over a dark gradient and shadow; its School boards link is removed while the paragraph links remain. On small screens the title and image fit a compact banner. Print output omits the decorative photo and renders the heading in black. Changes remain local and uncommitted.

## October 11, 2026: Nonpartisan office labels and race filter

Qualifying office summaries show "Nonpartisan race" and "Party labels do not appear on the ballot." The label uses the office's canonical partisanStatus, independently of candidate affiliation. A second toggle beside Show all affiliations filters to nonpartisan offices and combines with search and evidence-specific affiliation filters. Directory totals retain their full-guide meaning. Contextual race links clear all filters before revealing their destination. No office ballot type or candidate fact is inferred or changed.

Directory summary numbers now follow search, affiliation, and race-type filters. Offices and categories count matching records; current candidates count distinct matching candidate IDs in current general-election entries. Primary history is excluded from that figure and identified separately in the result announcement. Clearing all filters restores the complete directory totals.

## October 11, 2026: Public usability refinements

The accepted UX review adds a prominent Find candidates action, shorter opening and instructions, a publisher byline, and less space before search. Display labels use everyday wording while the underlying registration, ballot-party, and primary-participation identifiers remain distinct. Sources use Last checked only for dates derived from review or verification records. Primary vote totals appear in May primary results disclosures.

Active filter chips near search can remove one filter while preserving the others, and Clear all filters resets search, affiliation, and race type together. The race toggle has a visible checkmark when active. Filtered category summaries count matching offices and unique current candidates; their original source-supported jurisdiction and seat totals return when filters are cleared. Candidate identities, ordering, results, dates, and evidence bindings are preserved. The work remains a local proposal pending user review; no public usability study has been performed.

## October 26, 2026: Judicial retention questions

Judicial retention is a separate subject area with canonical judges, courts, and retention questions in `src/data/elections/2026/judicial-retention.json`, selected by the active election configuration. Each question has one judge, an exact sourced ballot question, Yes/No choices, a six-year term, and explicit display order following the supplied ballot photographs. The state retention list establishes names, courts, districts, terms, and questions; the user confirmation and supplied ballot photographs establish the included Gage County scope. The Judicial Branch voter guide supports the appointment and retention explanation. No governor appointment history or judge affiliation is inferred.

The build validates relationships and wording, then emits an allowlisted `judicialRetention` projection beside candidate offices. Source photographs, hashes, and internal provenance are excluded from publication. The candidate contract and candidate totals retain their existing meaning. A separate judicial drawer within the directory reuses category, court/office, card, and source-disclosure styles. Its summary counts judges and retention questions; its native disclosures work without JavaScript. Search and suggestions cover judge names and courts. The nonpartisan filter includes retention, while affiliation filters hide it with an explanatory notice and do not classify judges as unverified affiliations. Search restores prior disclosure state when cleared.

The pattern is documented here rather than in a new component documentation application. The focused retention test checks official wording, canonical/public equality, static content, invalid records, election isolation, name/court searches, and filter separation. Candidate-source conflicts and selected-coverage gaps are recorded in the October 26 audit without changing disputed candidate records. The review is local; commit, push, and publication remain pending user review.

## October 26, 2026: Voter Information as a supplementary source

The user identifies Voter Information Project as credible but incomplete. Use its data as supplementary evidence while retaining Gage County's records as the controlling sources for local roster and ballot coverage. Absence from VIP does not invalidate a county-supported entry. Preserve official ballot names and distinguish a reported party label from the evidence types already published. The supplementary comparison is recorded separately from the official-source audit; this instruction does not silently change affiliation records or the current evidence contract.

## October 26, 2026: Four approved reported affiliations

The user authorized applying VIP affiliations for Jeff Bacon (Nonpartisan), Eric G. Malina (Republican), Dan Osborn (Nonpartisan), and Mark Cohen (Nonpartisan). These use a new `reported-affiliation` evidence type, displayed as “Reported affiliation,” with record-specific VIP citations and review dates. The evidence type preserves the distinction from direct registration checks, ballot parties, and primary participation. Original registration-review inputs remain historical evidence; the four source-free affiliation review items are resolved by the explicit supplementary-source records. Existing sourced affiliations cannot be overwritten by this adapter.

The user expressly rejected including Mary Benes and confirmed Ricky A. Schreiner's exact official ballot spelling. Both are protected by focused checks. No judge party labels or cross-office Doug Pieper affiliation changes are included in this authorization.
