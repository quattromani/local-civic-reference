import fs from "node:fs";
import path from "node:path";
import { createPublicDirectoryProjection } from "./public-directory-projection.mjs";
import { validateOrderingPolicy } from "./ordering-policy.mjs";
import { canonicalDataPath, projectRoot } from "./project-paths.mjs";

const root = projectRoot;
const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));

const validationErrors = validateOrderingPolicy(data);
if (validationErrors.length) throw new Error(`Ordering policy validation failed:\n${validationErrors.join("\n")}`);

const orderingSnapshot = (projection) => ({
  categories: [...new Set(projection.map((office) => office.category))],
  offices: Object.fromEntries([...new Set(projection.map((office) => office.category))].map((category) => [
    category,
    projection.filter((office) => office.category === category).map((office) => office.officeId)
  ])),
  candidates: Object.fromEntries(projection.map((office) => [
    office.officeId,
    office.candidates.map((candidate) => candidate.candidateId)
  ]))
});

const baselineProjection = createPublicDirectoryProjection(data);
const baselineOrder = orderingSnapshot(baselineProjection);

const voteMutation = structuredClone(data);
voteMutation.results.forEach((result, index) => { result.votes = 100000 - index; });
const voteMutationOrder = orderingSnapshot(createPublicDirectoryProjection(voteMutation));
if (JSON.stringify(voteMutationOrder) !== JSON.stringify(baselineOrder)) {
  throw new Error("Changing vote totals changed rendered ordering");
}

const placementMutation = structuredClone(data);
placementMutation.results.forEach((result, index) => { result.placement = 1000 - index; });
const placementMutationOrder = orderingSnapshot(createPublicDirectoryProjection(placementMutation));
if (JSON.stringify(placementMutationOrder) !== JSON.stringify(baselineOrder)) {
  throw new Error("Changing placement changed rendered ordering");
}

const expectedCategories = ["School Boards", "Cities & Villages", "County Offices", "State Offices", "Township Boards", "Other Local Districts"];
if (JSON.stringify(baselineOrder.categories) !== JSON.stringify(expectedCategories)) {
  throw new Error(`Top-level category order changed: ${baselineOrder.categories.join(", ")}`);
}

for (const category of ["School Boards", "Cities & Villages", "Township Boards", "Other Local Districts"]) {
  const officeNames = baselineProjection.filter((office) => office.category === category).map((office) => office.office);
  const alphabetical = [...officeNames].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(officeNames) !== JSON.stringify(alphabetical)) {
    throw new Error(`${category} offices are not alphabetical`);
  }
}

const expectedGovernmentHierarchy = {
  "County Offices": [
    "office-gage-county-clerk",
    "office-gage-county-clerk-of-district-court",
    "office-gage-county-treasurer",
    "office-gage-county-register-of-deeds",
    "office-gage-county-assessor",
    "office-gage-county-attorney",
    "office-gage-county-sheriff",
    "office-gage-county-surveyor",
    "office-gage-county-supervisor-district-1",
    "office-gage-county-supervisor-district-3",
    "office-gage-county-supervisor-district-5",
    "office-gage-county-supervisor-district-7"
  ],
  "State Offices": [
    "office-nebraska-governor",
    "office-nebraska-secretary-of-state",
    "office-nebraska-state-treasurer",
    "office-nebraska-attorney-general",
    "office-nebraska-state-auditor",
    "office-nebraska-legislature-district-30",
    "office-state-board-of-education-district-5",
    "office-us-senator",
    "office-us-house-district-3"
  ]
};
for (const [category, expectedOfficeIds] of Object.entries(expectedGovernmentHierarchy)) {
  if (JSON.stringify(baselineOrder.offices[category]) !== JSON.stringify(expectedOfficeIds)) {
    throw new Error(`${category} governmental hierarchy changed`);
  }
}

for (const office of baselineProjection) {
  const candidateNames = office.candidates.map((candidate) => candidate.name);
  const alphabetical = [...candidateNames].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(candidateNames) !== JSON.stringify(alphabetical)) {
    throw new Error(`${office.officeId} candidates are not alphabetical`);
  }
}

const invalidPolicyData = structuredClone(data);
invalidPolicyData.offices[0].candidateOrder = "outcome-ranking";
const invalidPolicyErrors = validateOrderingPolicy(invalidPolicyData);
if (!invalidPolicyErrors.some((error) => error.includes("unknown candidate ordering policy outcome-ranking"))) {
  throw new Error("Invalid candidate ordering policy was not rejected");
}

const missingPolicyData = structuredClone(data);
delete missingPolicyData.orderingPolicy;
if (!validateOrderingPolicy(missingPolicyData).some((error) => error.includes("missing its explicit top-level ordering policy"))) {
  throw new Error("Missing top-level ordering policy was not rejected");
}

const orderingImplementation = fs.readFileSync(path.join(root, "scripts/ordering-policy.mjs"), "utf8");
const sortImplementation = orderingImplementation.slice(
  orderingImplementation.indexOf("export function sortOfficesByPolicy"),
  orderingImplementation.indexOf("export function validateOrderingPolicy")
);
const prohibitedOutcomeInputs = ["votes", "placement", "winner", "advancedToGeneral", "incumbent", "affiliation"];
const usedOutcomeInputs = prohibitedOutcomeInputs.filter((field) => sortImplementation.includes(field));
if (usedOutcomeInputs.length) {
  throw new Error(`Ordering implementation reads prohibited outcome fields: ${usedOutcomeInputs.join(", ")}`);
}

process.stdout.write(`${JSON.stringify({
  valid: true,
  topLevelCategoriesPreserved: true,
  alphabeticalOfficeCategories: ["School Boards", "Cities & Villages", "Township Boards", "Other Local Districts"],
  governmentHierarchyCategories: ["County Offices", "State Offices"],
  candidatePolicy: "alphabetical",
  voteChangesDoNotAffectOrder: true,
  placementChangesDoNotAffectOrder: true,
  invalidPolicyRejected: true,
  missingPolicyRejected: true,
  prohibitedOutcomeInputsAbsent: true
}, null, 2)}\n`);
