# Election reuse

The active publication is selected by `src/elections/active.json`. Design remains in `src/site/`, editorial content in the configured content files, and facts in the configured normalized dataset. The build accepts comparable general elections with current candidates and optional primary history.

## Build and validation

`npm run build` runs the configured source adapter, when present, then validates and renders the dataset. The existing 2026 importer retains its historical filename and owns all 2026 source interpretation. A pre-normalized dataset sets `sourceAdapter` to null.

`npm run validate` runs the shared contract/reuse checks and the existing 2026 roster, provenance, certainty, accessibility, safety, and deterministic-build checks. The roster and source-certainty checks deliberately remain specific to the current election. A real new election needs equivalent evidence review and roster checks before release; the synthetic fixture does not establish factual accuracy for a future election.

`npm run build:fixture` builds synthetic 2030 information into `work/fixture-public/`. `npm run test:reuse` checks the fixture, evidence distinctions, identity, calendar dates, counts, invalid inputs, and output isolation. Fixture configuration cannot write to `public/`.

For another real election, supply a configuration through `ELECTION_CONFIG=src/elections/<election>.json`. Use `ELECTION_OUTPUT=work/<preview>/` for isolated review. Leave the active configuration unchanged until the new election is reviewed.

## Contract

`src/contracts/election-directory.v1.schema.json` defines contract version 1.0.0. `schemaVersion` retains the legacy dataset model version; `contractVersion` identifies the shared publication boundary. Unsupported contract versions fail before any output is removed. The dependency-free validator supports only the schema keywords currently used and rejects unsupported keywords.

The contract includes election identity and date, jurisdictions, offices, candidates, affiliations, candidacies, contests, results, sources, ordering policy, summary policy, and methodology. Semantic validation checks unique IDs, references, ownership of affiliations and results, election-cycle consistency, and evidence relationships. Public projection exposes only the fields intended for readers.

Office partisan status describes ballot rules. Affiliation evidence types are `registration`, `ballot-party`, or `primary-participation`; unverified affiliation has no source, evidence type, or verification date. Source IDs are opaque identities. Shared rendering must never infer evidence meaning from an ID or filename.

Use stable candidate and office IDs. Candidacy and affiliation records belong to an election dataset, and source reviews retain their actual dates. Never change historical review dates merely to roll the site forward. Preserve old datasets and archived sources in their election directories.

## Adding an election

First, archive sources and normalize the new facts. Add a source adapter only when incoming formats require translation; the adapter should emit the contract without changing shared UI code.

Second, supply election configuration and editorial content. Update dates, publisher details, scope, links, methodology, source descriptions, primary labels, and imagery. The 2026 ballot photograph must not be reused as a future election's ballot. Calendar UID is an explicit stable election identity.

Third, build into an isolated preview and validate the contract. Review sources, coverage, and uncertainty, then test search, affiliation filters, nonpartisan filtering, counts, deep links, and mobile layout. Validate the official roster against the new election's sources.

Finally, select the reviewed configuration for the active publication. Commit, push, and publication remain separate actions requiring user authorization in this working session.

## Reuse proof

The synthetic fixture has a different year, date, jurisdiction, calendar UID, source IDs, roster, category count, and hero artwork. It includes partisan and nonpartisan offices, all three affiliation evidence types, an unverified affiliation, and primary history with results. It uses the same templates, styles, projection, and browser scripts. No fixture data is copied into the active publication.
