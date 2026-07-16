import fs from "node:fs";
import { createPublicDirectoryProjection } from "./public-directory-projection.mjs";
import { canonicalDataPath } from "./project-paths.mjs";

const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
const projection = createPublicDirectoryProjection(data);
const errors = [];

const officeById = new Map(projection.map((office) => [office.officeId, office]));
const expectedRestoredOffices = [
  "office-gage-county-clerk",
  "office-gage-county-clerk-of-district-court",
  "office-gage-county-treasurer",
  "office-gage-county-register-of-deeds",
  "office-gage-county-assessor",
  "office-gage-county-attorney",
  "office-gage-county-surveyor",
  "office-gage-county-supervisor-district-1",
  "office-gage-county-supervisor-district-3",
  "office-gage-county-supervisor-district-5"
];
for (const officeId of expectedRestoredOffices) {
  if (!officeById.has(officeId)) errors.push(`Missing restored office ${officeId}`);
}

const assertStage = (officeId, name, expectedStage) => {
  const candidate = officeById.get(officeId)?.candidates.find((record) => record.name === name);
  if (!candidate) errors.push(`${officeId} is missing ${name}`);
  else if (candidate.electionStageGroup !== expectedStage) {
    errors.push(`${name} expected ${expectedStage}; found ${candidate.electionStageGroup}`);
  }
};

assertStage("office-gage-county-supervisor-district-7", "Terry Jurgens", "current-general-election");
assertStage("office-gage-county-supervisor-district-7", "Gary Bergmeier", "primary-history");
assertStage("office-gage-county-sheriff", "Spencer Behrens", "current-general-election");
assertStage("office-gage-county-sheriff", "Michael Hager", "primary-history");
assertStage("office-nebraska-secretary-of-state", "Scott Petersen", "current-general-election");
assertStage("office-nebraska-secretary-of-state", "Bob Evnen", "primary-history");
assertStage("office-state-board-of-education-district-5", "Angie Eberspacher", "current-general-election");
assertStage("office-state-board-of-education-district-5", "Lana Daws", "primary-history");

for (const office of projection) {
  if (!office.filingSnapshotDate || !office.filingWindowStatus) errors.push(`${office.officeId} lacks filing-snapshot metadata`);
  if (/unopposed in (?:the )?general election/i.test(JSON.stringify(office))) {
    errors.push(`${office.officeId} contains a premature general-election unopposed claim`);
  }
  for (const candidate of office.candidates) {
    const filingSourceId = candidate.sourceBindings.filingSourceId;
    if (candidate.electionStageGroup === "current-general-election" && !filingSourceId) {
      errors.push(`${candidate.candidateId} is current but lacks a filing-snapshot source`);
    }
    if (candidate.electionStageGroup === "primary-history" && candidate.generalElectionStatus !== "Participated in the primary and did not advance to the general election.") {
      errors.push(`${candidate.candidateId} has inconsistent primary-history status`);
    }
  }
}

for (const withdrawnName of ["Robert Paul Harrison", "Myron Schoen"]) {
  if (data.candidates.some((candidate) => candidate.displayName === withdrawnName)) {
    errors.push(`Withdrawn filing remains published: ${withdrawnName}`);
  }
}

if (data.sources.some((source) => /gagecountygop/i.test(`${source.name} ${source.url}`))) {
  errors.push("Disallowed political-party discovery source remains in the certified source registry");
}

const stageSnapshot = projection.map((office) => ({
  officeId: office.officeId,
  candidates: office.candidates.map((candidate) => [candidate.candidateId, candidate.electionStageGroup])
}));
const resultMutation = structuredClone(data);
resultMutation.results.forEach((result, index) => { result.placement = 1000 - index; });
const mutatedStageSnapshot = createPublicDirectoryProjection(resultMutation).map((office) => ({
  officeId: office.officeId,
  candidates: office.candidates.map((candidate) => [candidate.candidateId, candidate.electionStageGroup])
}));
if (JSON.stringify(stageSnapshot) !== JSON.stringify(mutatedStageSnapshot)) {
  errors.push("Changing result placement changed the normalized election-stage projection");
}

if (errors.length) {
  process.stderr.write(`${JSON.stringify({ valid: false, errors }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({
    valid: true,
    filingSnapshotDate: data.filingSnapshotDate,
    filingWindowStatus: data.filingWindowStatus,
    offices: data.offices.length,
    currentGeneralElectionCandidacies: data.candidacies.filter((record) => record.electionStageGroup === "current-general-election").length,
    primaryHistoryCandidacies: data.candidacies.filter((record) => record.electionStageGroup === "primary-history").length,
    restoredCountyOffices: expectedRestoredOffices.length,
    emptyOfficesAwaitingFilingUpdate: data.scopeReview.length,
    prematureUnopposedClaims: 0,
    stageIndependentOfResultPlacement: true
  }, null, 2)}\n`);
}
