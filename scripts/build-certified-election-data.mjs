import fs from "node:fs";
import path from "node:path";
import { electionwarePolicy, publicMethodology } from "./source-certainty-policy.mjs";
import { approvedOrderingPolicy } from "./ordering-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const electionDataRoot = path.join(root, "src/data/elections/2026");
const sourceDataRoot = path.join(electionDataRoot, "source-data");
const electionware = JSON.parse(fs.readFileSync(path.join(sourceDataRoot, "gage-2026-primary-electionware.json"), "utf8"));
const filingSnapshots = JSON.parse(fs.readFileSync(path.join(sourceDataRoot, "official-filing-snapshots-2026.json"), "utf8"));
const manualAffiliationVerification = JSON.parse(fs.readFileSync(path.join(sourceDataRoot, "manual-affiliation-verification-2026-07-16.json"), "utf8"));
const voterCheckReport = fs.readFileSync(path.join(root, "project-docs/audits/2026/ne-votercheck-confirmation-sweep-2026-07-15.md"), "utf8");

const slug = (value) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const voterCheckByName = new Map();
const uniqueReturns = voterCheckReport.split("## Unique returns")[1] || "";
for (const match of uniqueReturns.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)) {
  const [, name, party, county] = match;
  if (name === "Candidate" || /^[-:]+$/.test(name)) continue;
  voterCheckByName.set(name, { party, county });
}

const allowedAffiliationLabels = new Set(["Republican", "Democratic", "Libertarian", "Legal Marijuana NOW", "Nonpartisan", "Unaffiliated"]);
const manuallyVerifiedAffiliations = new Map();
for (const record of manualAffiliationVerification.verified) {
  if (manuallyVerifiedAffiliations.has(record.displayName)) throw new Error(`Duplicate manual affiliation result for ${record.displayName}`);
  if (!allowedAffiliationLabels.has(record.affiliation)) throw new Error(`Invalid manual affiliation label for ${record.displayName}: ${record.affiliation}`);
  manuallyVerifiedAffiliations.set(record.displayName, record.affiliation);
}
const manualPendingNames = new Set(manualAffiliationVerification.pending);
for (const name of manualPendingNames) {
  if (manuallyVerifiedAffiliations.has(name)) throw new Error(`Manual affiliation result is both verified and pending for ${name}`);
}

const sourceIds = {
  electionware: "src-gage-electionware-2026-primary",
  voterCheck: "src-ne-votercheck",
  countyFiling: "src-gage-county-filing-snapshot-2026-07-15",
  countyOfficesNotice: "src-gage-general-offices-notice-2026",
  countyPrimaryOfficesNotice: "src-gage-primary-offices-notice-2026",
  stateFiling: "src-ne-general-filing-snapshot-2026-07-15",
  stateCanvass: "src-ne-primary-canvass-2026",
  countySampleBallots: "src-gage-primary-sample-ballots-2026"
};

if (manualAffiliationVerification.verificationSourceId !== sourceIds.voterCheck) {
  throw new Error(`Manual affiliation results must use ${sourceIds.voterCheck}`);
}

const resolveAffiliation = ({ candidateName, label, verificationState, basis, sourceId, verifiedDate }) => {
  const manuallyVerifiedLabel = manuallyVerifiedAffiliations.get(candidateName);
  if (manuallyVerifiedLabel) {
    return {
      label: manuallyVerifiedLabel,
      verificationState: "Verified",
      basis: "Official voter registration verification",
      sourceId: sourceIds.voterCheck,
      verifiedDate: manualAffiliationVerification.reviewedDate
    };
  }
  if (manualPendingNames.has(candidateName)) {
    if (sourceId) throw new Error(`Cannot mark sourced affiliation as pending for ${candidateName}`);
    return {
      label: "Verification Needed",
      verificationState: "Pending Verification",
      basis: null,
      sourceId: null,
      verifiedDate: null
    };
  }
  return { label, verificationState, basis, sourceId, verifiedDate };
};

const categoryOrdering = new Map(approvedOrderingPolicy.categories.map((policy) => [policy.category, policy]));
const officeDisplayOrder = (officeId, category) => {
  const policy = categoryOrdering.get(category);
  if (!policy) throw new Error(`Missing approved ordering policy for category ${category}`);
  if (policy.officeOrder === "alphabetical") return null;
  const position = approvedOrderingPolicy.officeHierarchy[officeId];
  if (!Number.isInteger(position)) throw new Error(`Missing approved office hierarchy position for ${officeId}`);
  return position;
};

const sources = [
  {
    sourceId: sourceIds.electionware,
    name: electionware.authoritativeSource.label,
    url: electionware.authoritativeSource.url,
    localArchive: electionware.authoritativeSource.localArchive,
    sha256: electionware.authoritativeSource.sha256,
    authorityTier: 1,
    sourceType: "County-issued election report",
    reportStatus: electionware.authoritativeSource.reportLabel,
    publicStatus: electionwarePolicy.publicStatus,
    projectRole: electionwarePolicy.projectRole,
    publicDescription: electionwarePolicy.publicDescription,
    reviewedDate: "2026-07-15",
    scopeNote: electionware.methodology.scopeLimit
  },
  {
    sourceId: sourceIds.voterCheck,
    name: "Nebraska VoterCheck",
    url: "https://www.votercheck.necvr.ne.gov/voterview/",
    authorityTier: 1,
    sourceType: "Official voter registration verification",
    reviewedDate: manualAffiliationVerification.reviewedDate
  },
  ...filingSnapshots.sources
];

const stateGeneralCandidatesByOffice = new Map(
  filingSnapshots.stateOffices.map((office) => [
    office.officeId,
    new Map(office.currentCandidates.map((candidate) => [candidate.name, candidate]))
  ])
);
const stateOfficeSnapshotsById = new Map(filingSnapshots.stateOffices.map((office) => [office.officeId, office]));

const primaryOffices = new Map(electionware.offices.map((office) => [office.officeId, office]));
const additionalContests = new Map(electionware.additionalReportedContests.map((contest) => [contest.contest, contest]));

const officeDefinitions = [
  {
    officeId: "office-us-senator",
    officeName: "United States Senate",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [
      ["rep-us-senator-6-year", "Republican Primary", "Republican"],
      ["DEM US Senator 6 YR", "Democratic Primary", "Democratic"],
      ["LMN US Senator 6 YR", "Legal Marijuana NOW Primary", "Legal Marijuana NOW"]
    ]
  },
  {
    officeId: "office-us-house-district-3",
    officeName: "United States House - District 3",
    category: "State Offices",
    jurisdiction: "Nebraska Congressional District 3",
    jurisdictionType: "Congressional district",
    district: "District 3",
    partisanStatus: "Partisan",
    contests: [
      ["rep-us-house-district-3", "Republican Primary", "Republican"],
      ["DEM Congress Dist. 3", "Democratic Primary", "Democratic"],
      ["LMN Congress Dist. 3", "Legal Marijuana NOW Primary", "Legal Marijuana NOW"]
    ]
  },
  {
    officeId: "office-nebraska-governor",
    officeName: "Nebraska Governor",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [
      ["rep-governor", "Republican Primary", "Republican"],
      ["DEM Governor", "Democratic Primary", "Democratic"],
      ["LMN Governor", "Legal Marijuana NOW Primary", "Legal Marijuana NOW"]
    ]
  },
  {
    officeId: "office-nebraska-secretary-of-state",
    officeName: "Nebraska Secretary of State",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [
      ["rep-secretary-of-state", "Republican Primary", "Republican"],
      ["DEM Sec. of State", "Democratic Primary", "Democratic"]
    ]
  },
  {
    officeId: "office-nebraska-state-treasurer",
    officeName: "Nebraska State Treasurer",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [
      ["rep-state-treasurer", "Republican Primary", "Republican"],
      ["DEM State Treasurer", "Democratic Primary", "Democratic"]
    ]
  },
  {
    officeId: "office-nebraska-attorney-general",
    officeName: "Nebraska Attorney General",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [
      ["rep-attorney-general", "Republican Primary", "Republican"],
      ["DEM Attorney General", "Democratic Primary", "Democratic"]
    ]
  },
  {
    officeId: "office-nebraska-state-auditor",
    officeName: "Nebraska State Auditor",
    category: "State Offices",
    jurisdiction: "Nebraska",
    jurisdictionType: "State",
    district: null,
    partisanStatus: "Partisan",
    contests: [["rep-state-auditor", "Republican Primary", "Republican"]]
  },
  {
    officeId: "office-nebraska-legislature-district-30",
    officeName: "Nebraska Legislature - District 30",
    category: "State Offices",
    jurisdiction: "Nebraska Legislative District 30",
    jurisdictionType: "Legislative district",
    district: "District 30",
    partisanStatus: "Nonpartisan",
    contests: [["legislature-district-30", "Nonpartisan Primary", null]]
  },
  {
    officeId: "office-state-board-of-education-district-5",
    officeName: "State Board of Education - District 5",
    category: "State Offices",
    jurisdiction: "Nebraska State Board District 5",
    jurisdictionType: "State board district",
    district: "District 5",
    partisanStatus: "Nonpartisan",
    contests: [["state-board-of-education-district-5", "Nonpartisan Primary", null]]
  },
  {
    officeId: "office-gage-county-sheriff",
    officeName: "Gage County Sheriff",
    category: "County Offices",
    jurisdiction: "Gage County",
    jurisdictionType: "County",
    district: null,
    partisanStatus: "Partisan",
    contests: [["gage-county-sheriff-republican", "Republican Primary", "Republican"]]
  },
  {
    officeId: "office-gage-county-supervisor-district-7",
    officeName: "Gage County Supervisor - District 7",
    category: "County Offices",
    jurisdiction: "Gage County",
    jurisdictionType: "County",
    district: "District 7",
    partisanStatus: "Partisan",
    contests: [["gage-county-supervisor-district-7-republican", "Republican Primary", "Republican"]]
  },
  {
    officeId: "office-beatrice-mayor",
    officeName: "Beatrice Mayor",
    category: "Cities & Villages",
    jurisdiction: "City of Beatrice",
    jurisdictionType: "Municipality",
    district: null,
    partisanStatus: "Nonpartisan",
    contests: [["beatrice-mayor", "Nonpartisan Primary", null]]
  },
  {
    officeId: "office-wymore-mayor",
    officeName: "Wymore Mayor",
    category: "Cities & Villages",
    jurisdiction: "City of Wymore",
    jurisdictionType: "Municipality",
    district: null,
    partisanStatus: "Nonpartisan",
    contests: [["wymore-mayor", "Nonpartisan Primary", null]]
  }
];

const resultForContest = (key) => primaryOffices.get(key) || additionalContests.get(key);
const candidates = [];
const affiliations = [];
const offices = [];
const jurisdictions = [];
const candidacies = [];
const contests = [];
const results = [];
const manualReview = [];
const seenCandidates = new Set();
const seenJurisdictions = new Set();

for (const definition of officeDefinitions) {
  const jurisdictionId = `jur-${slug(definition.jurisdiction)}`;
  if (!seenJurisdictions.has(jurisdictionId)) {
    jurisdictions.push({ jurisdictionId, name: definition.jurisdiction, jurisdictionType: definition.jurisdictionType });
    seenJurisdictions.add(jurisdictionId);
  }

  const officeCandidacies = [];
  for (const [sourceKey, electionType, ballotParty] of definition.contests) {
    const sourceContest = resultForContest(sourceKey);
    if (!sourceContest) throw new Error(`Missing source contest: ${sourceKey}`);
    const contestId = `contest-${slug(`${definition.officeId}-${electionType}`)}`;
    const isLocalOutcome = definition.category === "Cities & Villages" || definition.category === "County Offices";
    const namedCandidateCount = sourceContest.primaryResults.length;

    contests.push({
      contestId,
      officeId: definition.officeId,
      electionType,
      ballotParty,
      contestStatus: namedCandidateCount > 1 ? "Contested" : "Unopposed",
      voteFor: 1,
      totalVotesCast: sourceContest.totalVotesCast,
      writeInVotes: sourceContest.writeInVotes,
      reportingScope: isLocalOutcome ? definition.jurisdiction : "Gage County reporting portion",
      sourceId: sourceIds.electionware
    });

    for (const sourceResult of sourceContest.primaryResults) {
      const candidateId = `cand-${slug(sourceResult.candidate)}`;
      const generalSnapshotCandidate = stateGeneralCandidatesByOffice.get(definition.officeId)?.get(sourceResult.candidate);
      if (!seenCandidates.has(candidateId)) {
        candidates.push({
          candidateId,
          displayName: sourceResult.candidate,
          ballotName: generalSnapshotCandidate?.ballotName || sourceResult.candidate,
          nameSourceId: sourceIds.electionware,
          lastReviewed: "2026-07-15"
        });
        seenCandidates.add(candidateId);
      }

      const voterCheck = voterCheckByName.get(sourceResult.candidate);
      const resolvedAffiliation = resolveAffiliation({
        candidateName: sourceResult.candidate,
        label: ballotParty || voterCheck?.party || "Not Confirmed",
        verificationState: ballotParty || voterCheck ? "Verified" : "Not Confirmed",
        basis: ballotParty ? `Candidate appears in the ${electionType}` : voterCheck ? "Official voter registration verification" : null,
        sourceId: ballotParty ? sourceIds.electionware : voterCheck ? sourceIds.voterCheck : null,
        verifiedDate: ballotParty || voterCheck ? "2026-07-15" : null
      });
      const affiliationSourceId = resolvedAffiliation.sourceId;
      const affiliationId = `aff-${candidateId.replace(/^cand-/, "")}-2026`;
      if (!affiliations.some((affiliation) => affiliation.affiliationId === affiliationId)) {
        affiliations.push({
          affiliationId,
          candidateId,
          label: resolvedAffiliation.label,
          verificationState: resolvedAffiliation.verificationState,
          basis: resolvedAffiliation.basis,
          sourceId: affiliationSourceId,
          verifiedDate: resolvedAffiliation.verifiedDate
        });
      }

      let primaryStatus;
      let advancedToGeneral = null;
      let stageSourceId = sourceIds.electionware;
      if (isLocalOutcome && definition.category === "Cities & Villages") {
        primaryStatus = sourceResult.placement <= 2 ? "Advanced from Nonpartisan Primary" : "Did Not Advance from Primary";
        advancedToGeneral = sourceResult.placement <= 2;
      } else if (isLocalOutcome && namedCandidateCount > 1) {
        primaryStatus = sourceResult.placement === 1 ? `Won ${electionType}` : "Did Not Advance from Primary";
        advancedToGeneral = sourceResult.placement === 1;
      } else {
        const currentStateCandidate = stateGeneralCandidatesByOffice.get(definition.officeId)?.has(sourceResult.candidate) || false;
        primaryStatus = currentStateCandidate
          ? electionType === "Nonpartisan Primary" ? "Advanced from Nonpartisan Primary" : `Won ${electionType}`
          : "Did Not Advance from Primary";
        advancedToGeneral = currentStateCandidate;
        stageSourceId = sourceIds.stateCanvass;
      }

      const electionStageGroup = advancedToGeneral ? "current-general-election" : "primary-history";

      const candidacyId = `cdy-${slug(`${candidateId}-${definition.officeId}-${contestId}`)}`;
      const resultId = `result-${candidacyId.replace(/^cdy-/, "")}`;
      candidacies.push({
        candidacyId,
        candidateId,
        officeId: definition.officeId,
        contestId,
        electionCycle: 2026,
        ballotType: definition.partisanStatus === "Partisan" ? "Partisan" : "Nonpartisan",
        affiliationId,
        primaryStatus,
        advancedToGeneral,
        electionStageGroup,
        generalElectionStatus: advancedToGeneral
          ? "Appears on the current general-election filing snapshot; contest status is not yet final."
          : "Participated in the primary and did not advance to the general election.",
        stageSourceId,
        filingSourceId: advancedToGeneral
          ? definition.category === "State Offices" ? sourceIds.stateFiling : sourceIds.countyFiling
          : null,
        resultId,
        verificationSourceId: sourceIds.electionware,
        verificationDate: "2026-07-15",
        recordStatus: "Active"
      });
      officeCandidacies.push(candidacyId);
      results.push({
        resultId,
        candidacyId,
        electionStage: "Primary",
        votes: sourceResult.votes,
        percentage: sourceResult.percentage,
        placement: sourceResult.placement,
        reportingScope: isLocalOutcome ? definition.jurisdiction : "Gage County reporting portion",
        sourceId: sourceIds.electionware
      });

      if (resolvedAffiliation.verificationState !== "Verified") {
        manualReview.push({
          reviewId: `review-affiliation-${candidateId.replace(/^cand-/, "")}`,
          candidateId,
          candidacyId,
          field: "partyAffiliation",
          issue: "The Electionware-reported nonpartisan contest does not establish party affiliation, and no unique Nebraska VoterCheck result is present in the existing verification log.",
          status: "Open"
        });
      }
    }
  }

  offices.push({
    officeId: definition.officeId,
    officeName: stateOfficeSnapshotsById.get(definition.officeId)?.officeName || definition.officeName,
    category: definition.category,
    jurisdictionId,
    district: definition.district,
    electionType: "2026 General Election with primary history",
    partisanStatus: definition.partisanStatus,
    seatsAvailable: 1,
    voteFor: 1,
    contestStatus: "General-election contest status not yet final",
    generalElectionStatus: (() => {
      const currentCount = officeCandidacies
        .map((id) => candidacies.find((candidacy) => candidacy.candidacyId === id))
        .filter((candidacy) => candidacy?.electionStageGroup === "current-general-election").length;
      return currentCount === 1
        ? "Only candidate currently listed; general-election contest status is not yet final."
        : `${currentCount} candidates are currently listed; general-election contest status is not yet final.`;
    })(),
    filingSnapshotDate: filingSnapshots.snapshotDate,
    filingWindowStatus: filingSnapshots.filingWindowStatus,
    displayOrder: officeDisplayOrder(definition.officeId, definition.category),
    candidateOrder: approvedOrderingPolicy.defaultCandidateOrder
  });
}

const scopeReview = [];

function addSnapshotOffice(filingOffice, filingSourceId, scopeSourceId) {
  const officeId = filingOffice.officeId;
  const jurisdictionId = `jur-${slug(filingOffice.jurisdiction)}`;
  const contestId = `contest-${slug(`${officeId}-2026-general-filing-snapshot`)}`;

  if (offices.some((office) => office.officeId === officeId)) {
    throw new Error(`Snapshot office duplicates an existing office: ${officeId}`);
  }
  if (!seenJurisdictions.has(jurisdictionId)) {
    jurisdictions.push({
      jurisdictionId,
      name: filingOffice.jurisdiction,
      jurisdictionType: filingOffice.jurisdictionType
    });
    seenJurisdictions.add(jurisdictionId);
  }

  const candidateCount = filingOffice.candidates.length;
  const generalElectionStatus = candidateCount === 0
    ? "No candidate is currently listed in the official filing snapshot; contest status is not yet final."
    : candidateCount === 1
      ? "Only candidate currently listed; general-election contest status is not yet final."
      : `${candidateCount} candidates are currently listed; general-election contest status is not yet final.`;

  offices.push({
    officeId,
    officeName: filingOffice.officeName,
    category: filingOffice.category,
    jurisdictionId,
    district: filingOffice.district || null,
    electionType: "2026 General Election filing snapshot",
    partisanStatus: filingOffice.partisanStatus,
    seatsAvailable: filingOffice.seatsAvailable ?? null,
    voteFor: filingOffice.voteFor ?? null,
    contestStatus: "General-election contest status not yet final",
    generalElectionStatus,
    filingSnapshotDate: filingSnapshots.snapshotDate,
    filingWindowStatus: filingSnapshots.filingWindowStatus,
    scopeSourceId,
    seatSourceId: filingOffice.seatsAvailable == null ? null : scopeSourceId,
    displayOrder: officeDisplayOrder(officeId, filingOffice.category),
    candidateOrder: approvedOrderingPolicy.defaultCandidateOrder
  });

  contests.push({
    contestId,
    officeId,
    electionType: "2026 General Election filing snapshot",
    ballotParty: null,
    contestStatus: "Filing window open",
    voteFor: filingOffice.voteFor ?? null,
    totalVotesCast: null,
    writeInVotes: null,
    reportingScope: filingOffice.jurisdiction,
    sourceId: filingSourceId,
    evidenceType: "Official filing snapshot"
  });

  if (candidateCount === 0) {
    scopeReview.push({
      reviewId: `review-current-filing-${officeId.replace(/^office-/, "")}`,
      officeId,
      field: "currentGeneralElectionCandidates",
      issue: "No candidate is listed in the July 15 filing snapshot. Recheck after the August 3 non-incumbent deadline.",
      status: "Open"
    });
  }

  for (const filingCandidate of filingOffice.candidates) {
    const candidateId = `cand-${slug(filingCandidate.name)}`;
    if (!seenCandidates.has(candidateId)) {
      candidates.push({
        candidateId,
        displayName: filingCandidate.name,
        ballotName: filingCandidate.ballotName || filingCandidate.name,
        nameSourceId: filingSourceId,
        nameVerificationState: "Official filing snapshot",
        lastReviewed: filingSnapshots.snapshotDate
      });
      seenCandidates.add(candidateId);
    }

    const voterCheck = voterCheckByName.get(filingCandidate.name);
    const affiliationId = `aff-${candidateId.replace(/^cand-/, "")}-2026`;
    if (!affiliations.some((affiliation) => affiliation.affiliationId === affiliationId)) {
      const resolvedAffiliation = resolveAffiliation({
        candidateName: filingCandidate.name,
        label: filingCandidate.party || voterCheck?.party || "Verification Needed",
        verificationState: filingCandidate.party || voterCheck ? "Verified" : "Pending Verification",
        basis: filingCandidate.party
          ? "Party listed in the official filing snapshot"
          : voterCheck ? "Official voter registration verification" : null,
        sourceId: filingCandidate.party ? filingSourceId : voterCheck ? sourceIds.voterCheck : null,
        verifiedDate: filingCandidate.party || voterCheck ? filingSnapshots.snapshotDate : null
      });
      affiliations.push({
        affiliationId,
        candidateId,
        label: resolvedAffiliation.label,
        verificationState: resolvedAffiliation.verificationState,
        basis: resolvedAffiliation.basis,
        sourceId: resolvedAffiliation.sourceId,
        verifiedDate: resolvedAffiliation.verifiedDate
      });
    }

    const isCountyPartisan = filingOffice.category === "County Offices" && filingOffice.partisanStatus === "Partisan";
    const primaryStatus = isCountyPartisan
      ? "Advanced Without Contested Primary"
      : "No Contested Primary Shown";
    const candidacyId = `cdy-${slug(`${candidateId}-${officeId}-${contestId}`)}`;
    candidacies.push({
      candidacyId,
      candidateId,
      officeId,
      contestId,
      electionCycle: 2026,
      ballotType: filingOffice.partisanStatus === "Partisan" ? "Partisan" : "Nonpartisan",
      affiliationId,
      primaryStatus,
      advancedToGeneral: isCountyPartisan ? true : null,
      electionStageGroup: "current-general-election",
      generalElectionStatus,
      resultId: null,
      seat: filingCandidate.seat || filingOffice.district || null,
      filingSourceId,
      verificationSourceId: null,
      stageSourceId: isCountyPartisan ? sourceIds.countySampleBallots : filingSourceId,
      verificationDate: filingSnapshots.snapshotDate,
      recordStatus: "Current official filing snapshot; filing window open"
    });

    const candidateAffiliation = affiliations.find((affiliation) => affiliation.affiliationId === affiliationId);
    if (candidateAffiliation.verificationState !== "Verified") {
      manualReview.push({
        reviewId: `review-affiliation-${candidateId.replace(/^cand-/, "")}-${officeId.replace(/^office-/, "")}`,
        candidateId,
        candidacyId,
        field: "partyAffiliation",
        issue: "The official nonpartisan filing snapshot establishes the candidacy but not political affiliation.",
        status: "Pending Verification"
      });
    }
  }
}

for (const filingOffice of filingSnapshots.localOffices) {
  const scopeSourceId = filingOffice.category === "School Boards" || filingOffice.jurisdictionType === "Municipality"
    ? sourceIds.countyPrimaryOfficesNotice
    : sourceIds.countyOfficesNotice;
  addSnapshotOffice(filingOffice, sourceIds.countyFiling, scopeSourceId);
}
for (const filingOffice of filingSnapshots.stateFiledLocalDistricts) {
  addSnapshotOffice(filingOffice, sourceIds.stateFiling, sourceIds.countyOfficesNotice);
}

const builtCandidateNames = new Set(candidates.map((candidate) => candidate.displayName));
for (const name of [...manuallyVerifiedAffiliations.keys(), ...manualPendingNames]) {
  if (!builtCandidateNames.has(name)) throw new Error(`Manual affiliation result references unknown candidate: ${name}`);
}

const data = {
  schemaVersion: "4.0.0",
  datasetId: "local-ballot-information-2026-certified",
  datasetStatus: "Scope correction in progress; current general-election filing snapshots are time-bounded through July 15, 2026 and primary history is retained separately",
  lastValidated: "2026-07-15",
  scope: "Gage County offices and candidates identified in official county and state filing snapshots, with current general-election listings separated from May 2026 primary history. Filing windows remain open and general-election contest status is not final.",
  filingSnapshotDate: filingSnapshots.snapshotDate,
  filingWindowStatus: filingSnapshots.filingWindowStatus,
  orderingPolicy: {
    topLevelOrder: approvedOrderingPolicy.topLevelOrder,
    categories: approvedOrderingPolicy.categories
  },
  publicMethodology,
  sources,
  jurisdictions: jurisdictions.sort((a, b) => a.name.localeCompare(b.name)),
  offices,
  candidates: candidates.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  affiliations: affiliations.sort((a, b) => a.candidateId.localeCompare(b.candidateId)),
  candidacies: candidacies.sort((a, b) => a.officeId.localeCompare(b.officeId) || a.candidateId.localeCompare(b.candidateId)),
  contests,
  results: results.sort((a, b) => a.candidacyId.localeCompare(b.candidacyId)),
  manualReview: manualReview.sort((a, b) => a.candidateId.localeCompare(b.candidateId)),
  scopeReview: scopeReview.sort((a, b) => a.officeId.localeCompare(b.officeId)),
  sourceArtifacts: [
    {
      artifactId: "artifact-electionware-transcription",
      path: "src/data/elections/2026/source-data/gage-2026-primary-electionware.json",
      sourceId: sourceIds.electionware
    },
    {
      artifactId: "artifact-votercheck-sweep",
      path: "project-docs/audits/2026/ne-votercheck-confirmation-sweep-2026-07-15.md",
      sourceId: sourceIds.voterCheck
    },
    ...filingSnapshots.sources.filter((source) => source.localArchive).map((source) => ({
      artifactId: `artifact-${source.sourceId.replace(/^src-/, "")}`,
      path: source.localArchive,
      sourceId: source.sourceId
    }))
  ]
};

const serialized = process.argv.includes("--compact") ? JSON.stringify(data) : JSON.stringify(data, null, 2);
if (process.argv.includes("--write")) {
  fs.writeFileSync(path.join(electionDataRoot, "election-directory.json"), `${serialized}\n`);
} else {
  process.stdout.write(`${serialized}\n`);
}
