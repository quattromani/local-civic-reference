import fs from "node:fs";
import {
  createPublicDirectoryProjection
} from "./public-directory-projection.mjs";
import {
  electionwarePolicy,
  extractPublicMethodology,
  validateSourceCertainty
} from "./source-certainty-policy.mjs";
import { canonicalDataPath, publicDirectoryPath, publicHtmlPath } from "./project-paths.mjs";

const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
const html = fs.readFileSync(publicHtmlPath, "utf8");
const publication = JSON.parse(fs.readFileSync(publicDirectoryPath, "utf8"));
const validationErrors = validateSourceCertainty(data, html);
if (validationErrors.length) throw new Error(`Source-certainty validation failed:\n${validationErrors.join("\n")}`);

const expected = createPublicDirectoryProjection(data);
const rendered = publication.offices;
const electionwareEntries = rendered
  .flatMap((office) => office.candidates)
  .flatMap((candidate) => candidate.sourceEntries)
  .filter((entry) => entry.sourceId === electionwarePolicy.sourceId);

if (!electionwareEntries.length) throw new Error("No rendered Electionware source entries were found");
for (const entry of electionwareEntries) {
  if (entry.sourceStatus !== electionwarePolicy.publicStatus) {
    throw new Error(`Electionware rendered with incorrect status: ${entry.sourceStatus}`);
  }
  if (!entry.sourceDescription.includes(electionwarePolicy.reportStatus)
    || !entry.sourceDescription.includes("authoritative source")
    || !entry.sourceDescription.includes("county totals alone do not establish final statewide or multi-county district outcomes")) {
    throw new Error("Electionware rendered description does not state status, project authority, and county-reporting limits");
  }
}

const canonicalElectionware = data.sources.find((source) => source.sourceId === electionwarePolicy.sourceId);
if (!canonicalElectionware.projectRole.includes("Authoritative project source")) {
  throw new Error("Electionware project authority is not stated in canonical metadata");
}
if (/certified/i.test(canonicalElectionware.projectRole)) {
  throw new Error("Electionware project authority improperly claims certification");
}

const overstatedData = structuredClone(data);
overstatedData.sources.find((source) => source.sourceId === electionwarePolicy.sourceId).publicStatus = "Official results certified";
const overstatementErrors = validateSourceCertainty(overstatedData, html);
if (!overstatementErrors.some((error) => error.includes("publicStatus") && error.includes("Official results certified"))
  || !overstatementErrors.some((error) => error.includes("must not describe") && error.includes("certified"))) {
  throw new Error("Validator did not reject a deliberately certified Electionware source status");
}

const methodology = extractPublicMethodology(html);
if (!methodology.includes("Nebraska VoterCheck")
  || !methodology.includes("Primary participation")
  || !methodology.includes("It does not confirm voter registration.")) {
  throw new Error("Public methodology does not distinguish VoterCheck from partisan-primary participation");
}
const disallowedMethods = [
  "party convention or committee materials",
  "party website",
  "campaign website",
  "official biographies",
  "news reporting"
];
const presentDisallowedMethods = disallowedMethods.filter((method) => methodology.toLowerCase().includes(method));
if (presentDisallowedMethods.length) {
  throw new Error(`Public methodology retains disallowed active methods: ${presentDisallowedMethods.join(", ")}`);
}

if (JSON.stringify(expected) !== JSON.stringify(rendered)) {
  throw new Error("Rendered directory projection differs from the canonical projection");
}

process.stdout.write(`${JSON.stringify({
  valid: true,
  renderedElectionwareEntries: electionwareEntries.length,
  electionwareStatus: electionwarePolicy.publicStatus,
  authoritativeProjectRoleWithoutCertificationClaim: true,
  certifiedStatusRejected: true,
  methodologyEvidenceTypesDistinct: true,
  disallowedMethodologySourcesAbsent: true
}, null, 2)}\n`);
