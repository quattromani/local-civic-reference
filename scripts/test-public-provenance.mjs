import fs from "node:fs";
import {
  comparePublicDirectoryProjection,
  createPublicDirectoryProjection
} from "./public-directory-projection.mjs";
import { canonicalDataPath, publicDirectoryPath } from "./project-paths.mjs";

const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
const publication = JSON.parse(fs.readFileSync(publicDirectoryPath, "utf8"));
const expected = createPublicDirectoryProjection(data);
const rendered = publication.offices;
const initialErrors = comparePublicDirectoryProjection(expected, rendered);
if (initialErrors.length) throw new Error(`Rendered projection is not canonical:\n${initialErrors.join("\n")}`);

const voterCheck = data.sources.find((source) => source.sourceId === "src-ne-votercheck");
const electionware = data.sources.find((source) => source.sourceId === "src-gage-electionware-2026-primary");
if (!voterCheck || !electionware) throw new Error("Required regression sources are missing");

const expectedCandidates = [
  "Duane Ruh",
  "Jacob Harding",
  "Kevin Sturm",
  "Milton Pike",
  "Paul Borzekofski"
];

const locateCandidate = (directory, name) => {
  for (const office of directory) {
    const candidate = office.candidates.find((item) => item.name === name);
    if (candidate) return candidate;
  }
  throw new Error(`Regression candidate is missing: ${name}`);
};

const positiveResults = expectedCandidates.map((name) => {
  const candidate = locateCandidate(rendered, name);
  if (candidate.sourceBindings.affiliationSourceId !== voterCheck.sourceId) {
    throw new Error(`${name} does not bind affiliation to Nebraska VoterCheck`);
  }
  const affiliationSource = candidate.sourceEntries.find((entry) => entry.roles.includes("affiliation"));
  if (!affiliationSource) throw new Error(`${name} has no rendered affiliation source entry`);
  if (affiliationSource.sourceId !== voterCheck.sourceId
    || affiliationSource.sourceLabel !== voterCheck.name
    || affiliationSource.sourceUrl !== voterCheck.url) {
    throw new Error(`${name} renders an incorrect affiliation source`);
  }
  const electionSource = candidate.sourceEntries.find((entry) =>
    entry.sourceId === electionware.sourceId
    && entry.roles.includes("participation")
    && entry.roles.includes("result")
  );
  if (!electionSource) throw new Error(`${name} lost the Electionware participation/result citation`);
  return {
    name,
    affiliationSource: affiliationSource.sourceLabel,
    affiliationUrl: affiliationSource.sourceUrl,
    electionSource: electionSource.sourceLabel
  };
});

const wrongUrlProjection = structuredClone(rendered);
const wrongUrlCandidate = locateCandidate(wrongUrlProjection, "Duane Ruh");
wrongUrlCandidate.sourceEntries.find((entry) => entry.roles.includes("affiliation")).sourceUrl = electionware.url;
const wrongUrlErrors = comparePublicDirectoryProjection(expected, wrongUrlProjection);
if (!wrongUrlErrors.some((error) => error.includes(wrongUrlCandidate.candidateId) && error.includes("sourceUrl"))) {
  throw new Error("Validator did not reject a deliberately incorrect affiliation source URL");
}

const wrongLabelProjection = structuredClone(rendered);
const wrongLabelCandidate = locateCandidate(wrongLabelProjection, "Duane Ruh");
wrongLabelCandidate.sourceEntries.find((entry) => entry.roles.includes("affiliation")).sourceLabel = electionware.name;
const wrongLabelErrors = comparePublicDirectoryProjection(expected, wrongLabelProjection);
if (!wrongLabelErrors.some((error) => error.includes(wrongLabelCandidate.candidateId) && error.includes("sourceLabel"))) {
  throw new Error("Validator did not reject a deliberately incorrect affiliation source label");
}

process.stdout.write(`${JSON.stringify({
  valid: true,
  positiveResults,
  negativeChecks: {
    wrongUrlRejected: true,
    wrongLabelRejected: true,
    wrongUrlError: wrongUrlErrors.find((error) => error.includes("sourceUrl")),
    wrongLabelError: wrongLabelErrors.find((error) => error.includes("sourceLabel"))
  }
}, null, 2)}\n`);
