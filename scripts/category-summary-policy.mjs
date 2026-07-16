export const categorySummaryPolicy = Object.freeze([
  { category: "School Boards", primaryMetric: "jurisdictions", unit: "district", includeSeatCount: true },
  { category: "Cities & Villages", primaryMetric: "officeRecords", unit: "office", includeSeatCount: false },
  { category: "County Offices", primaryMetric: "officeRecords", unit: "office", includeSeatCount: false },
  { category: "State Offices", primaryMetric: "officeRecords", unit: "office", includeSeatCount: false },
  { category: "Township Boards", primaryMetric: "jurisdictions", unit: "township", includeSeatCount: true },
  { category: "Other Local Districts", primaryMetric: "officeRecords", unit: "district seat", includeSeatCount: false }
]);

const pluralize = (count, singular) => `${count} ${count === 1 ? singular : `${singular}s`}`;

/**
 * Drawer counts describe the normalized records a reader will encounter:
 * - an office is one normalized office/contest record;
 * - a district or township is one represented jurisdiction;
 * - a seat is one supported position to be filled, summed only when every
 *   office in the category has a sourced seatsAvailable value;
 * - candidates are unique people in the category, across current and primary
 *   history records. Candidate-entry and stage counts remain available for
 *   validation but are not repeated in the compact public label.
 */
export function createCategorySummaryData(data) {
  const sources = new Set(data.sources.map((source) => source.sourceId));
  const categoryOrder = [...data.orderingPolicy.categories]
    .sort((a, b) => a.categoryPosition - b.categoryPosition)
    .map((entry) => entry.category);
  const policies = new Map(categorySummaryPolicy.map((policy) => [policy.category, policy]));
  const candidaciesByOffice = new Map();
  for (const candidacy of data.candidacies) {
    if (!candidaciesByOffice.has(candidacy.officeId)) candidaciesByOffice.set(candidacy.officeId, []);
    candidaciesByOffice.get(candidacy.officeId).push(candidacy);
  }

  return categoryOrder.map((category) => {
    const policy = policies.get(category);
    if (!policy) throw new Error(`Missing category summary policy for ${category}`);
    const offices = data.offices.filter((office) => office.category === category);
    const officeCandidacies = offices.flatMap((office) => candidaciesByOffice.get(office.officeId) || []);
    const jurisdictionCount = new Set(offices.map((office) => office.jurisdictionId)).size;
    const officeRecordCount = offices.length;
    const candidateEntryCount = officeCandidacies.length;
    const candidateCount = new Set(officeCandidacies.map((candidacy) => candidacy.candidateId)).size;
    const currentCandidateEntryCount = officeCandidacies.filter((candidacy) => candidacy.electionStageGroup === "current-general-election").length;
    const primaryHistoryCandidateEntryCount = officeCandidacies.filter((candidacy) => candidacy.electionStageGroup === "primary-history").length;
    const officesWithoutCandidates = offices.filter((office) => !(candidaciesByOffice.get(office.officeId) || []).length).length;
    const primaryCount = policy.primaryMetric === "jurisdictions" ? jurisdictionCount : officeRecordCount;

    let seatCount = null;
    if (policy.includeSeatCount) {
      for (const office of offices) {
        if (!Number.isInteger(office.seatsAvailable) || office.seatsAvailable < 1) {
          throw new Error(`${category} cannot publish a seat count because ${office.officeId} lacks a supported seatsAvailable value`);
        }
        if (!office.seatSourceId || !sources.has(office.seatSourceId)) {
          throw new Error(`${category} cannot publish a seat count because ${office.officeId} lacks a valid seat source`);
        }
      }
      seatCount = offices.reduce((total, office) => total + office.seatsAvailable, 0);
    }

    const parts = [pluralize(primaryCount, policy.unit)];
    if (seatCount !== null) parts.push(pluralize(seatCount, "seat"));
    parts.push(pluralize(candidateCount, "candidate"));

    return {
      category,
      primaryMetric: policy.primaryMetric,
      unit: policy.unit,
      primaryCount,
      jurisdictionCount,
      officeRecordCount,
      seatCount,
      candidateCount,
      candidateEntryCount,
      currentCandidateEntryCount,
      primaryHistoryCandidateEntryCount,
      officesWithoutCandidates,
      displayLabel: parts.join(" · ")
    };
  });
}

export function compareCategorySummaryData(expected, actual) {
  return JSON.stringify(expected) === JSON.stringify(actual)
    ? []
    : ["Rendered category drawer summaries differ from the canonical counting policy"];
}
