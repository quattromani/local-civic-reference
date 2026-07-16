import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  compareCategorySummaryData,
  createCategorySummaryData
} from "./category-summary-policy.mjs";
import { canonicalDataPath, publicDirectoryPath, projectRoot } from "./project-paths.mjs";

const root = projectRoot;
const data = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
const publication = JSON.parse(fs.readFileSync(publicDirectoryPath, "utf8"));
const renderer = fs.readFileSync(path.join(root, "public/scripts/render-directory.js"), "utf8");
const expected = createCategorySummaryData(data);
const rendered = publication.categorySummaries;

assert.deepEqual(rendered, expected, "rendered drawer summaries must match canonical data");

const expectedLabels = new Map([
  ["School Boards", "4 districts · 13 seats · 20 candidates"],
  ["Cities & Villages", "15 offices · 42 candidates"],
  ["County Offices", "12 offices · 15 candidates"],
  ["State Offices", "9 offices · 37 candidates"],
  ["Township Boards", "24 townships · 72 seats · 32 candidates"],
  ["Other Local Districts", "5 district seats · 6 candidates"]
]);
for (const summary of expected) {
  assert.equal(summary.displayLabel, expectedLabels.get(summary.category), `${summary.category} uses the approved counting unit`);
}

const schoolSummary = expected.find((summary) => summary.category === "School Boards");
assert.equal(schoolSummary.officeRecordCount, 4);
assert.equal(schoolSummary.jurisdictionCount, 4);
assert.equal(schoolSummary.seatCount, 13);
assert.equal(schoolSummary.candidateCount, 20);
assert.equal(schoolSummary.candidateEntryCount, 20);

const townshipSummary = expected.find((summary) => summary.category === "Township Boards");
assert.equal(townshipSummary.officesWithoutCandidates, 11, "empty offices remain counted and auditable");

const deliberatelyWrong = structuredClone(rendered);
deliberatelyWrong.find((summary) => summary.category === "School Boards").displayLabel = "4 offices · 20 candidates";
assert.ok(compareCategorySummaryData(expected, deliberatelyWrong).length, "a stale or hard-coded rendered label must fail validation");

assert.match(renderer, /categorySummary\.displayLabel/, "renderer must consume generated summary metadata");
assert.doesNotMatch(renderer, /`\$\{offices\.length\}[^`]*candidates`/, "renderer must not construct generic hard-coded office counts");

process.stdout.write(`${JSON.stringify({ valid: true, categories: expected.map(({ category, displayLabel }) => ({ category, displayLabel })) }, null, 2)}\n`);
