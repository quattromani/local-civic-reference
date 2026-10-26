import { sourceCopy } from "./source-copy.mjs";
import { sortCandidaciesByPolicy, sortOfficesByPolicy } from "./ordering-policy.mjs";

const roleLabels = {
  candidateName: "Candidate name",
  affiliation: "Affiliation",
  filing: "Reported filing",
  participation: "Candidate participation",
  result: "Election result",
  status: "Election status",
  stage: "Election stage"
};

const formatDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid source date: ${value}`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const indexBy = (records, key) => new Map(records.map((record) => [record[key], record]));

const requireRecord = (records, id, recordType, ownerId) => {
  if (!id) throw new Error(`${ownerId} is missing its ${recordType} reference`);
  const record = records.get(id);
  if (!record) throw new Error(`${ownerId} references unknown ${recordType} ${id}`);
  return record;
};

const sourceDescriptionFor = ({ roles, sourceId, contest, source }) => {
  const descriptions = new Set();
  if (roles.includes("affiliation")) {
    if (source.evidenceKind === "reported-affiliation") {
      descriptions.add(sourceCopy.sourceDescriptions.reportedAffiliation);
    } else if (source.evidenceKind === "registration") {
      descriptions.add(sourceCopy.sourceDescriptions.registration);
    } else if (roles.includes("filing")) {
      descriptions.add(sourceCopy.sourceDescriptions.ballotPartyAndFiling);
    } else {
      descriptions.add(sourceCopy.sourceDescriptions.primaryParticipation.replace("{contest}", contest.electionType));
    }
  }
  if (roles.includes("filing") && !roles.includes("affiliation")) {
    descriptions.add(sourceCopy.sourceDescriptions.filing);
  }
  if (source.evidenceKind === "primary-results") {
    descriptions.add(sourceCopy.sourceDescriptions.countyPrimaryResults);
  } else if (source.evidenceKind === "official-nominee") {
    descriptions.add(sourceCopy.sourceDescriptions.officialNominee);
  } else if (source.evidenceKind === "uncontested-primary") {
    descriptions.add(sourceCopy.sourceDescriptions.uncontestedPrimary);
  } else if (!descriptions.size && source.publicDescription) {
    descriptions.add(source.publicDescription);
  }
  return [...descriptions].join(" ");
};

const createSourceEntries = ({
  candidate,
  candidacy,
  affiliation,
  contest,
  result,
  sources
}) => {
  const sourceBindings = {
    candidateNameSourceId: candidate.nameSourceId,
    affiliationSourceId: affiliation.sourceId || null,
    filingSourceId: candidacy.filingSourceId || null,
    participationSourceId: candidacy.verificationSourceId || null,
    resultSourceId: result?.sourceId || null,
    statusSourceId: candidacy.stageSourceId || candidacy.verificationSourceId || candidacy.filingSourceId || null,
    stageSourceId: candidacy.stageSourceId || null
  };

  if (affiliation.verificationState === "Verified" && !sourceBindings.affiliationSourceId) {
    throw new Error(`${candidate.candidateId} has a verified affiliation without an affiliation source`);
  }
  if (!sourceBindings.participationSourceId && !sourceBindings.filingSourceId) {
    throw new Error(`${candidacy.candidacyId} has no participation or filing source`);
  }

  const grouped = new Map();
  const addBinding = (role, sourceId, date) => {
    if (!sourceId) return;
    const source = requireRecord(sources, sourceId, "source", candidacy.candidacyId);
    if (!grouped.has(sourceId)) {
      grouped.set(sourceId, {
        source,
        roles: [],
        roleDates: {}
      });
    }
    const entry = grouped.get(sourceId);
    if (!entry.roles.includes(role)) entry.roles.push(role);
    entry.roleDates[role] = formatDate(date || source.reviewedDate);
  };

  addBinding("candidateName", sourceBindings.candidateNameSourceId, candidate.lastReviewed);
  addBinding("affiliation", sourceBindings.affiliationSourceId, affiliation.verifiedDate);
  addBinding("filing", sourceBindings.filingSourceId, sources.get(sourceBindings.filingSourceId)?.reviewedDate);
  addBinding("participation", sourceBindings.participationSourceId, candidacy.verificationDate);
  addBinding("result", sourceBindings.resultSourceId, sources.get(sourceBindings.resultSourceId)?.reviewedDate);
  addBinding("status", sourceBindings.statusSourceId, candidacy.verificationDate);
  addBinding("stage", sourceBindings.stageSourceId, candidacy.verificationDate);

  const sourceEntries = [];
  if (!sourceBindings.affiliationSourceId) {
    sourceEntries.push({
      sourceId: null,
      roles: ["affiliation"],
      roleLabels: [roleLabels.affiliation],
      sourceLabel: "Affiliation not yet verified",
      sourceDescription: sourceCopy.sourceDescriptions.missingAffiliation,
      sourceUrl: null,
      sourceStatus: "Affiliation not yet verified",
      sourceDate: null,
      roleDates: { affiliation: null }
    });
  }

  const resolvedEntries = [];
  for (const [sourceId, entry] of grouped) {
    const uniqueDates = [...new Set(Object.values(entry.roleDates).filter(Boolean))];
    resolvedEntries.push({
      sourceId,
      roles: entry.roles,
      roleLabels: entry.roles.map((role) => roleLabels[role]),
      sourceLabel: entry.source.name,
      sourceDescription: sourceDescriptionFor({ roles: entry.roles, sourceId, contest, source: entry.source }),
      sourceUrl: entry.source.url,
      sourceStatus: entry.source.publicStatus || entry.source.sourceType,
      sourceDate: uniqueDates.length === 1 ? uniqueDates[0] : null,
      roleDates: entry.roleDates
    });
  }
  resolvedEntries.sort((a, b) =>
    Number(b.sourceId === sourceBindings.affiliationSourceId) - Number(a.sourceId === sourceBindings.affiliationSourceId)
  );
  sourceEntries.push(...resolvedEntries);

  return { sourceBindings, sourceEntries };
};

export function createPublicDirectoryProjection(data) {
  const sources = indexBy(data.sources, "sourceId");
  const jurisdictions = indexBy(data.jurisdictions, "jurisdictionId");
  const candidates = indexBy(data.candidates, "candidateId");
  const affiliations = indexBy(data.affiliations, "affiliationId");
  const contests = indexBy(data.contests, "contestId");
  const results = indexBy(data.results, "resultId");
  const candidaciesByOffice = new Map();

  for (const candidacy of data.candidacies) {
    if (!candidaciesByOffice.has(candidacy.officeId)) candidaciesByOffice.set(candidacy.officeId, []);
    candidaciesByOffice.get(candidacy.officeId).push(candidacy);
  }

  const sortedOffices = sortOfficesByPolicy(data);

  return sortedOffices.map((office) => {
    const jurisdiction = requireRecord(jurisdictions, office.jurisdictionId, "jurisdiction", office.officeId);
    const officeCandidacies = candidaciesByOffice.get(office.officeId) || [];
    const orderedCandidacies = sortCandidaciesByPolicy({
      candidacies: officeCandidacies,
      office,
      candidates
    });

    const publicOffice = {
      officeId: office.officeId,
      office: office.officeName,
      category: office.category,
      jurisdictionId: office.jurisdictionId,
      jurisdiction: jurisdiction.name,
      district: office.district,
      seat: office.district || (office.voteFor ? `Vote for ${office.voteFor}` : "Seat information pending official confirmation"),
      electionDate: `${formatDate(data.election.dateIso)} ${data.election.type} election`,
      filingSnapshotDate: formatDate(office.filingSnapshotDate || data.filingSnapshotDate),
      filingWindowStatus: office.filingWindowStatus || data.filingWindowStatus,
      filingReviewedDate: formatDate(sources.get(officeCandidacies.find(c => c.filingSourceId)?.filingSourceId)?.reviewedDate),
      generalElectionStatus: office.generalElectionStatus,
      officeMetadata: {
        electionType: office.electionType,
        partisanStatus: office.partisanStatus,
        seatsAvailable: office.seatsAvailable,
        voteFor: office.voteFor,
        contestStatus: office.contestStatus,
        candidateOrder: office.candidateOrder,
        filingSnapshotDate: formatDate(office.filingSnapshotDate || data.filingSnapshotDate),
        filingWindowStatus: office.filingWindowStatus || data.filingWindowStatus,
        generalElectionStatus: office.generalElectionStatus
      },
      ballotClarification: sourceCopy.officeClarifications?.[office.officeId] || null,
      candidateListNotice: office.candidateListNotice || "General-election candidate list is not yet final.",
      candidates: []
    };

    for (const candidacy of orderedCandidacies) {
      const candidate = requireRecord(candidates, candidacy.candidateId, "candidate", candidacy.candidacyId);
      const affiliation = requireRecord(affiliations, candidacy.affiliationId, "affiliation", candidacy.candidacyId);
      const contest = requireRecord(contests, candidacy.contestId, "contest", candidacy.candidacyId);
      const result = candidacy.resultId ? requireRecord(results, candidacy.resultId, "result", candidacy.candidacyId) : null;
      const note = result?.publicNote || null;
      const { sourceBindings, sourceEntries } = createSourceEntries({
        candidate,
        candidacy,
        affiliation,
        contest,
        result,
        sources
      });

      publicOffice.candidates.push({
        candidateId: candidate.candidateId,
        name: candidate.displayName,
        ballotName: candidate.ballotName,
        seat: candidacy.seat || office.district || "",
        affiliation: affiliation.sourceId ? affiliation.label : "Affiliation not yet verified",
        affiliationEvidenceLabel: !affiliation.sourceId ? null : ({ registration: "Registered affiliation", "ballot-party": "Ballot party", "primary-participation": "Primary participation", "reported-affiliation": "Reported affiliation" })[affiliation.evidenceType],
        affiliationVerificationState: affiliation.verificationState,
        electionStageGroup: candidacy.electionStageGroup,
        primaryOutcome: candidacy.primaryStatus,
        generalElectionStatus: candidacy.generalElectionStatus,
        note,
        sourceBindings,
        sourceEntries
      });
    }

    return publicOffice;
  });
}

export function comparePublicDirectoryProjection(expected, actual) {
  const errors = [];
  const visit = (expectedValue, actualValue, path) => {
    if (Object.is(expectedValue, actualValue)) return;
    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) {
        errors.push(`${path} expected an array but rendered ${typeof actualValue}`);
        return;
      }
      if (expectedValue.length !== actualValue.length) {
        errors.push(`${path}.length expected ${expectedValue.length} but rendered ${actualValue.length}`);
      }
      const length = Math.min(expectedValue.length, actualValue.length);
      for (let index = 0; index < length; index += 1) {
        const record = expectedValue[index];
        const identity = record && typeof record === "object"
          ? record.officeId || record.candidateId || record.sourceId || null
          : null;
        visit(record, actualValue[index], identity ? `${path}[${identity}]` : `${path}[${index}]`);
      }
      return;
    }
    if (expectedValue && typeof expectedValue === "object") {
      if (!actualValue || typeof actualValue !== "object" || Array.isArray(actualValue)) {
        errors.push(`${path} expected an object but rendered ${actualValue === null ? "null" : typeof actualValue}`);
        return;
      }
      const expectedKeys = Object.keys(expectedValue).sort();
      const actualKeys = Object.keys(actualValue).sort();
      if (expectedKeys.join("|") !== actualKeys.join("|")) {
        errors.push(`${path} keys expected [${expectedKeys.join(", ")}] but rendered [${actualKeys.join(", ")}]`);
      }
      for (const key of expectedKeys) visit(expectedValue[key], actualValue[key], `${path}.${key}`);
      return;
    }
    errors.push(`${path} expected ${JSON.stringify(expectedValue)} but rendered ${JSON.stringify(actualValue)}`);
  };
  visit(expected, actual, "publishedDirectory");
  return errors;
}
