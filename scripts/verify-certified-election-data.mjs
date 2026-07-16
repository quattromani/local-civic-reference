import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  comparePublicDirectoryProjection,
  createPublicDirectoryProjection
} from "./public-directory-projection.mjs";
import { validateSourceCertainty } from "./source-certainty-policy.mjs";
import { validateOrderingPolicy } from "./ordering-policy.mjs";
import {
  compareCategorySummaryData,
  createCategorySummaryData
} from "./category-summary-policy.mjs";
import { canonicalDataPath, publicDirectoryPath, publicHtmlPath, projectRoot } from "./project-paths.mjs";

const root = projectRoot;
const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
const html = fs.readFileSync(publicHtmlPath, "utf8");
const publication = JSON.parse(fs.readFileSync(publicDirectoryPath, "utf8"));
const errors = [];
errors.push(...validateOrderingPolicy(data));

const uniqueIndex = (records, key, label) => {
  const index = new Map();
  for (const record of records) {
    if (!record[key]) errors.push(`${label} is missing ${key}`);
    if (index.has(record[key])) errors.push(`Duplicate ${label} ${key}: ${record[key]}`);
    index.set(record[key], record);
  }
  return index;
};

const duplicateValues = (records, valueFor) => {
  const seen = new Set();
  const duplicates = [];
  for (const record of records) {
    const value = valueFor(record);
    if (seen.has(value)) duplicates.push(value);
    seen.add(value);
  }
  return duplicates;
};

const sources = uniqueIndex(data.sources, "sourceId", "source");
const jurisdictions = uniqueIndex(data.jurisdictions, "jurisdictionId", "jurisdiction");
const offices = uniqueIndex(data.offices, "officeId", "office");
const candidates = uniqueIndex(data.candidates, "candidateId", "candidate");
const affiliations = uniqueIndex(data.affiliations, "affiliationId", "affiliation");
const candidacies = uniqueIndex(data.candidacies, "candidacyId", "candidacy");
const contests = uniqueIndex(data.contests, "contestId", "contest");
const results = uniqueIndex(data.results, "resultId", "result");
uniqueIndex(data.manualReview, "reviewId", "manual-review item");
uniqueIndex(data.scopeReview, "reviewId", "scope-review item");

for (const value of duplicateValues(data.sources, (record) => record.url)) errors.push(`Duplicate source URL: ${value}`);
for (const value of duplicateValues(data.jurisdictions, (record) => record.name.toLowerCase())) errors.push(`Duplicate jurisdiction: ${value}`);
for (const value of duplicateValues(data.offices, (record) => `${record.jurisdictionId}|${record.officeName.toLowerCase()}`)) errors.push(`Duplicate office: ${value}`);
for (const value of duplicateValues(data.candidates, (record) => record.displayName.toLowerCase())) errors.push(`Duplicate candidate name: ${value}`);
for (const value of duplicateValues(data.affiliations, (record) => record.candidateId)) errors.push(`Candidate has multiple affiliations: ${value}`);
for (const value of duplicateValues(data.candidacies, (record) => `${record.candidateId}|${record.officeId}|${record.contestId}`)) errors.push(`Duplicate candidacy: ${value}`);

const authoritativeSourceIds = new Set([
  "src-gage-electionware-2026-primary",
  "src-ne-votercheck",
  "src-gage-county-filing-snapshot-2026-07-15",
  "src-gage-general-offices-notice-2026",
  "src-gage-primary-offices-notice-2026",
  "src-ne-general-filing-snapshot-2026-07-15",
  "src-ne-primary-canvass-2026",
  "src-gage-primary-sample-ballots-2026"
]);
const filingSourceIds = new Set([
  "src-gage-county-filing-snapshot-2026-07-15",
  "src-ne-general-filing-snapshot-2026-07-15"
]);
const expectedSourceIds = new Set(authoritativeSourceIds);
if (data.sources.length !== expectedSourceIds.size) errors.push(`Expected ${expectedSourceIds.size} scoped sources; found ${data.sources.length}`);
for (const source of data.sources) {
  if (!expectedSourceIds.has(source.sourceId)) errors.push(`Unexpected source remains: ${source.sourceId}`);
  if (authoritativeSourceIds.has(source.sourceId) && source.authorityTier !== 1) errors.push(`Authoritative source has wrong tier: ${source.sourceId}`);
}

for (const office of data.offices) {
  if (!jurisdictions.has(office.jurisdictionId)) errors.push(`Office ${office.officeId} has orphaned jurisdiction ${office.jurisdictionId}`);
  if (!office.filingSnapshotDate || !office.filingWindowStatus) errors.push(`Office ${office.officeId} lacks time-bounded filing metadata`);
  if (office.seatsAvailable != null && (!Number.isInteger(office.seatsAvailable) || office.seatsAvailable < 1)) errors.push(`Office ${office.officeId} has an invalid seatsAvailable value`);
  if (office.seatSourceId && !sources.has(office.seatSourceId)) errors.push(`Office ${office.officeId} has an orphaned seat source`);
  if (/unopposed in (?:the )?general election/i.test(office.generalElectionStatus || "")) errors.push(`Office ${office.officeId} overstates general-election contest status`);
  if (!data.candidacies.some((candidacy) => candidacy.officeId === office.officeId)
    && !data.scopeReview.some((review) => review.officeId === office.officeId)) {
    errors.push(`Office ${office.officeId} has no candidates and no scope-review record`);
  }
}

for (const candidate of data.candidates) {
  if (!sources.has(candidate.nameSourceId)) errors.push(`Candidate ${candidate.candidateId} has orphaned name source`);
  if (filingSourceIds.has(candidate.nameSourceId) && candidate.nameVerificationState !== "Official filing snapshot") errors.push(`Filing-snapshot candidate ${candidate.candidateId} lacks the official-snapshot label`);
  if (!data.candidacies.some((candidacy) => candidacy.candidateId === candidate.candidateId)) errors.push(`Candidate ${candidate.candidateId} is orphaned`);
}

for (const affiliation of data.affiliations) {
  if (!candidates.has(affiliation.candidateId)) errors.push(`Affiliation ${affiliation.affiliationId} has orphaned candidate`);
  if (affiliation.sourceId && !sources.has(affiliation.sourceId)) errors.push(`Affiliation ${affiliation.affiliationId} has orphaned source`);
  if (affiliation.verificationState === "Verified" && !affiliation.sourceId) errors.push(`Verified affiliation ${affiliation.affiliationId} lacks a source`);
  if (affiliation.verificationState === "Not Confirmed" && affiliation.sourceId) errors.push(`Unconfirmed affiliation ${affiliation.affiliationId} cites a source`);
  if (affiliation.verificationState === "Pending Verification" && (affiliation.sourceId || affiliation.label !== "Verification Needed")) errors.push(`Pending affiliation ${affiliation.affiliationId} is not source-free and clearly labeled`);
  if (filingSourceIds.has(affiliation.sourceId) && !affiliation.basis?.startsWith("Party listed in the official filing snapshot")) {
    errors.push(`Affiliation ${affiliation.affiliationId} cites a filing snapshot without a party-field basis`);
  }
}

const allowedStatuses = new Set([
  "Advanced Without Contested Primary",
  "Advanced from Nonpartisan Primary",
  "Did Not Advance from Primary",
  "No Contested Primary Shown",
  "Won Republican Primary",
  "Won Democratic Primary",
  "Won Legal Marijuana NOW Primary"
]);

for (const candidacy of data.candidacies) {
  if (!candidates.has(candidacy.candidateId)) errors.push(`Candidacy ${candidacy.candidacyId} has orphaned candidate`);
  if (!offices.has(candidacy.officeId)) errors.push(`Candidacy ${candidacy.candidacyId} has orphaned office`);
  if (!contests.has(candidacy.contestId)) errors.push(`Candidacy ${candidacy.candidacyId} has orphaned contest`);
  if (!affiliations.has(candidacy.affiliationId)) errors.push(`Candidacy ${candidacy.candidacyId} has orphaned affiliation`);
  if (!new Set(["current-general-election", "primary-history"]).has(candidacy.electionStageGroup)) errors.push(`Candidacy ${candidacy.candidacyId} lacks a valid election-stage group`);
  if (candidacy.electionStageGroup === "current-general-election" && !filingSourceIds.has(candidacy.filingSourceId)) errors.push(`Current candidacy ${candidacy.candidacyId} lacks an official filing-snapshot source`);
  if (candidacy.electionStageGroup === "primary-history" && candidacy.advancedToGeneral !== false) errors.push(`Primary-history candidacy ${candidacy.candidacyId} is not explicitly marked as non-advancing`);
  if (candidacy.resultId && !results.has(candidacy.resultId)) errors.push(`Candidacy ${candidacy.candidacyId} has orphaned result`);
  if (!candidacy.resultId && !filingSourceIds.has(candidacy.filingSourceId)) errors.push(`Candidacy ${candidacy.candidacyId} has neither a result nor an official filing source`);
  if (/unopposed in (?:the )?general election/i.test(candidacy.generalElectionStatus || "")) errors.push(`Candidacy ${candidacy.candidacyId} overstates general-election contest status`);
  if (!allowedStatuses.has(candidacy.primaryStatus)) errors.push(`Candidacy ${candidacy.candidacyId} has invalid status ${candidacy.primaryStatus}`);
}

for (const contest of data.contests) {
  if (!offices.has(contest.officeId)) errors.push(`Contest ${contest.contestId} has orphaned office`);
  if (!sources.has(contest.sourceId)) errors.push(`Contest ${contest.contestId} has orphaned source`);
  const contestCandidacies = data.candidacies.filter((candidacy) => candidacy.contestId === contest.contestId);
  if (!contestCandidacies.length && !data.scopeReview.some((review) => review.officeId === contest.officeId)) errors.push(`Contest ${contest.contestId} has no candidates or scope-review record`);
  if (filingSourceIds.has(contest.sourceId)) {
    if (contest.evidenceType !== "Official filing snapshot") errors.push(`Filing-snapshot contest ${contest.contestId} lacks its evidence label`);
    if (contest.totalVotesCast !== null || contest.writeInVotes !== null) errors.push(`Filing-source contest ${contest.contestId} contains result totals`);
  } else {
    const resultCandidacies = contestCandidacies.filter((candidacy) => candidacy.resultId);
    const reportedVotes = resultCandidacies.reduce((total, candidacy) => total + results.get(candidacy.resultId).votes, 0) + contest.writeInVotes;
    if (reportedVotes !== contest.totalVotesCast) errors.push(`Contest ${contest.contestId} totals do not reconcile`);
  }

  for (const candidacy of contestCandidacies) {
    const affiliation = affiliations.get(candidacy.affiliationId);
    if (contest.ballotParty && affiliation.label !== contest.ballotParty) errors.push(`Candidacy ${candidacy.candidacyId} party does not match its named primary`);
    if (contest.ballotParty && !["src-gage-electionware-2026-primary", "src-ne-votercheck", ...filingSourceIds].includes(affiliation.sourceId)) errors.push(`Candidacy ${candidacy.candidacyId} ballot party has the wrong source`);
  }
}

for (const result of data.results) {
  if (!candidacies.has(result.candidacyId)) errors.push(`Result ${result.resultId} has orphaned candidacy`);
  if (candidacies.get(result.candidacyId)?.resultId !== result.resultId) errors.push(`Result ${result.resultId} is not reciprocal`);
  if (result.sourceId !== "src-gage-electionware-2026-primary") errors.push(`Result ${result.resultId} does not cite the Electionware report`);
  if (!Number.isInteger(result.votes) || result.votes < 0) errors.push(`Result ${result.resultId} has invalid votes`);
  if (result.percentage < 0 || result.percentage > 100) errors.push(`Result ${result.resultId} has invalid percentage`);
  if (!Number.isInteger(result.placement) || result.placement < 1) errors.push(`Result ${result.resultId} has invalid placement`);
}

for (const review of data.manualReview) {
  if (!candidates.has(review.candidateId)) errors.push(`Manual review ${review.reviewId} has orphaned candidate`);
  if (!candidacies.has(review.candidacyId)) errors.push(`Manual review ${review.reviewId} has orphaned candidacy`);
  if (!["Not Confirmed", "Pending Verification"].includes(affiliations.get(candidacies.get(review.candidacyId)?.affiliationId)?.verificationState)) errors.push(`Manual review ${review.reviewId} does not correspond to an affiliation requiring review`);
}

for (const review of data.scopeReview) {
  if (!offices.has(review.officeId)) errors.push(`Scope review ${review.reviewId} has orphaned office`);
}

for (const source of data.sources.filter((record) => record.localArchive)) {
  const archiveBytes = fs.readFileSync(path.join(root, source.localArchive));
  const archiveHash = crypto.createHash("sha256").update(archiveBytes).digest("hex");
  if (archiveHash !== source.sha256) errors.push(`${source.sourceId} archive checksum mismatch`);
}
errors.push(...validateSourceCertainty(data, html));

let expectedPageData = [];
const pageData = publication.offices || [];
try {
  expectedPageData = createPublicDirectoryProjection(data);
} catch (error) {
  errors.push(`Canonical public projection failed: ${error.message}`);
}
if (expectedPageData.length && pageData.length) {
  errors.push(...comparePublicDirectoryProjection(expectedPageData, pageData));
}
try {
  const expectedCategorySummaries = createCategorySummaryData(data);
  const renderedCategorySummaries = publication.categorySummaries || [];
  errors.push(...compareCategorySummaryData(expectedCategorySummaries, renderedCategorySummaries));
} catch (error) {
  errors.push(`Category summary validation failed: ${error.message}`);
}
const pageCandidates = pageData.flatMap((office) => office.candidates || []);

if (!candidates.has("cand-scott-petersen")) errors.push("Official Scott Petersen record is missing");
const schoolBoardOffices = data.offices.filter((office) => office.category === "School Boards");
const schoolBoardCandidates = data.candidacies.filter((candidacy) => schoolBoardOffices.some((office) => office.officeId === candidacy.officeId));
if (schoolBoardOffices.length !== 4) errors.push(`Expected four restored school-board offices; found ${schoolBoardOffices.length}`);
if (schoolBoardCandidates.length !== 20) errors.push(`Expected 20 official school-board filing records; found ${schoolBoardCandidates.length}`);

const summary = {
  valid: errors.length === 0,
  schemaVersion: data.schemaVersion,
  sources: data.sources.length,
  jurisdictions: data.jurisdictions.length,
  offices: data.offices.length,
  candidates: data.candidates.length,
  candidacies: data.candidacies.length,
  contests: data.contests.length,
  results: data.results.length,
  verifiedAffiliations: data.affiliations.filter((affiliation) => affiliation.verificationState === "Verified").length,
  unconfirmedAffiliations: data.affiliations.filter((affiliation) => affiliation.verificationState === "Not Confirmed").length,
  pendingVerificationAffiliations: data.affiliations.filter((affiliation) => affiliation.verificationState === "Pending Verification").length,
  filingSourceCandidacies: data.candidacies.filter((candidacy) => filingSourceIds.has(candidacy.filingSourceId)).length,
  currentGeneralElectionCandidacies: data.candidacies.filter((candidacy) => candidacy.electionStageGroup === "current-general-election").length,
  primaryHistoryCandidacies: data.candidacies.filter((candidacy) => candidacy.electionStageGroup === "primary-history").length,
  openManualReviewItems: data.manualReview.length,
  openScopeReviewItems: data.scopeReview.length,
  publishedOffices: pageData.length,
  publishedCandidateEntries: pageCandidates.length,
  errors
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
