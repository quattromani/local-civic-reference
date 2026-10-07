export const approvedOrderingPolicy = Object.freeze({
  topLevelOrder: "explicit",
  categories: Object.freeze([
    Object.freeze({ category: "Cities & Villages", categoryPosition: 0, officeOrder: "alphabetical" }),
    Object.freeze({ category: "Township Boards", categoryPosition: 1, officeOrder: "alphabetical" }),
    Object.freeze({ category: "School Boards", categoryPosition: 2, officeOrder: "alphabetical" }),
    Object.freeze({ category: "County Offices", categoryPosition: 3, officeOrder: "government-hierarchy" }),
    Object.freeze({ category: "State & Federal Offices", categoryPosition: 4, officeOrder: "government-hierarchy" }),
    Object.freeze({ category: "Other Local Districts", categoryPosition: 5, officeOrder: "government-hierarchy" })
  ]),
  officeHierarchy: Object.freeze({
    "office-gage-county-assessor": 0,
    "office-gage-county-attorney": 1,
    "office-gage-county-clerk": 2,
    "office-gage-county-clerk-of-district-court": 3,
    "office-gage-county-register-of-deeds": 4,
    "office-gage-county-sheriff": 5,
    "office-gage-county-surveyor": 6,
    "office-gage-county-treasurer": 7,
    "office-gage-county-supervisor-district-1": 8,
    "office-gage-county-supervisor-district-3": 9,
    "office-gage-county-supervisor-district-5": 10,
    "office-gage-county-supervisor-district-7": 11,
    "office-us-senator": 0,
    "office-us-house-district-3": 1,
    "office-nebraska-governor": 2,
    "office-nebraska-secretary-of-state": 3,
    "office-nebraska-state-treasurer": 4,
    "office-nebraska-attorney-general": 5,
    "office-nebraska-state-auditor": 6,
    "office-nebraska-legislature-district-30": 7,
    "office-state-board-of-education-district-5": 8,
    "office-norris-public-power-district-subdivision-4": 0,
    "office-esu-4-district-3": 1,
    "office-esu-5-district-5": 2,
    "office-esu-5-district-7": 3,
    "office-esu-6-district-5": 4
  }),
  defaultCandidateOrder: "alphabetical"
});

export const validOfficeOrderPolicies = new Set([
  "alphabetical",
  "government-hierarchy",
  "official-ballot"
]);

export const validCandidateOrderPolicies = new Set([
  "alphabetical",
  "official-ballot"
]);

const indexBy = (records, key) => new Map(records.map((record) => [record[key], record]));

export function sortOfficesByPolicy(data) {
  const categoryPolicies = indexBy(data.orderingPolicy.categories, "category");
  return [...data.offices].sort((a, b) => {
    const aCategory = categoryPolicies.get(a.category);
    const bCategory = categoryPolicies.get(b.category);
    if (!aCategory || !bCategory) throw new Error(`Missing category ordering policy for ${a.category} or ${b.category}`);
    const categoryCompare = aCategory.categoryPosition - bCategory.categoryPosition;
    if (categoryCompare) return categoryCompare;
    if (aCategory.officeOrder === "alphabetical") return a.officeName.localeCompare(b.officeName);
    if (["government-hierarchy", "official-ballot"].includes(aCategory.officeOrder)) return a.displayOrder - b.displayOrder;
    throw new Error(`Unknown office ordering policy: ${aCategory.officeOrder}`);
  });
}

export function sortCandidaciesByPolicy({ candidacies, office, candidates }) {
  const ordered = [...candidacies];
  if (office.candidateOrder === "alphabetical") {
    return ordered.sort((a, b) => {
      const aCandidate = candidates.get(a.candidateId);
      const bCandidate = candidates.get(b.candidateId);
      if (!aCandidate || !bCandidate) throw new Error(`Cannot order unknown candidates in ${office.officeId}`);
      return aCandidate.displayName.localeCompare(bCandidate.displayName);
    });
  }
  if (office.candidateOrder === "official-ballot") {
    return ordered.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  throw new Error(`Unknown candidate ordering policy for ${office.officeId}: ${office.candidateOrder}`);
}

export function validateOrderingPolicy(data) {
  const errors = [];
  const policy = data.orderingPolicy;
  if (!policy || policy.topLevelOrder !== "explicit" || !Array.isArray(policy.categories)) {
    return ["Dataset is missing its explicit top-level ordering policy"];
  }

  const categories = new Map();
  const categoryPositions = new Set();
  for (const category of policy.categories) {
    if (!category.category) errors.push("Ordering category is missing category name");
    if (categories.has(category.category)) errors.push(`Duplicate ordering policy for category ${category.category}`);
    categories.set(category.category, category);
    if (!Number.isInteger(category.categoryPosition) || category.categoryPosition < 0) {
      errors.push(`Category ${category.category} has invalid categoryPosition`);
    } else if (categoryPositions.has(category.categoryPosition)) {
      errors.push(`Duplicate categoryPosition ${category.categoryPosition}`);
    }
    categoryPositions.add(category.categoryPosition);
    if (!validOfficeOrderPolicies.has(category.officeOrder)) {
      errors.push(`Category ${category.category} has unknown office ordering policy ${category.officeOrder}`);
    }
  }

  if (policy.categories.length !== approvedOrderingPolicy.categories.length) {
    errors.push(`Expected ${approvedOrderingPolicy.categories.length} approved category ordering policies; found ${policy.categories.length}`);
  }
  for (const approvedCategory of approvedOrderingPolicy.categories) {
    const declaredCategory = categories.get(approvedCategory.category);
    if (!declaredCategory) {
      errors.push(`Missing approved ordering policy for category ${approvedCategory.category}`);
      continue;
    }
    if (declaredCategory.categoryPosition !== approvedCategory.categoryPosition
      || declaredCategory.officeOrder !== approvedCategory.officeOrder) {
      errors.push(`Category ${approvedCategory.category} differs from the approved ordering policy`);
    }
  }

  const officesByCategory = new Map();
  for (const office of data.offices) {
    const categoryPolicy = categories.get(office.category);
    if (!categoryPolicy) errors.push(`Office ${office.officeId} belongs to category without an ordering policy: ${office.category}`);
    if (!validCandidateOrderPolicies.has(office.candidateOrder)) {
      errors.push(`Office ${office.officeId} has unknown candidate ordering policy ${office.candidateOrder}`);
    } else if (office.candidateOrder !== approvedOrderingPolicy.defaultCandidateOrder) {
      errors.push(`Office ${office.officeId} differs from the approved candidate ordering policy`);
    }
    if (!officesByCategory.has(office.category)) officesByCategory.set(office.category, []);
    officesByCategory.get(office.category).push(office);
  }

  for (const [categoryName, offices] of officesByCategory) {
    const categoryPolicy = categories.get(categoryName);
    if (!categoryPolicy) continue;
    if (["government-hierarchy", "official-ballot"].includes(categoryPolicy.officeOrder)) {
      const positions = new Set();
      for (const office of offices) {
        if (!Number.isInteger(office.displayOrder) || office.displayOrder < 0) {
          errors.push(`Office ${office.officeId} is missing a valid displayOrder for ${categoryPolicy.officeOrder}`);
        } else if (positions.has(office.displayOrder)) {
          errors.push(`Category ${categoryName} has duplicate office displayOrder ${office.displayOrder}`);
        }
        positions.add(office.displayOrder);
        if (office.displayOrder !== approvedOrderingPolicy.officeHierarchy[office.officeId]) {
          errors.push(`Office ${office.officeId} differs from the approved governmental hierarchy`);
        }
      }
    } else {
      for (const office of offices) {
        if (office.displayOrder !== null) errors.push(`Alphabetical office ${office.officeId} must not declare a numeric displayOrder`);
      }
    }
  }

  for (const office of data.offices.filter((record) => record.candidateOrder === "official-ballot")) {
    const officeCandidacies = data.candidacies.filter((candidacy) => candidacy.officeId === office.officeId);
    const positions = new Set();
    for (const candidacy of officeCandidacies) {
      if (!Number.isInteger(candidacy.displayOrder) || candidacy.displayOrder < 0) {
        errors.push(`Candidacy ${candidacy.candidacyId} is missing a valid official-ballot displayOrder`);
      } else if (positions.has(candidacy.displayOrder)) {
        errors.push(`Office ${office.officeId} has duplicate candidate displayOrder ${candidacy.displayOrder}`);
      }
      positions.add(candidacy.displayOrder);
    }
  }

  return errors;
}
