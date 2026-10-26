import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { electionConfig } from "./election-config.mjs";
import { createJudicialRetentionProjection } from "./judicial-retention.mjs";
import { renderJudicialRetention, filterJudicialRetention } from "../src/site/scripts/judicial-retention.js";
import { initializeDirectory } from "../src/site/scripts/render-directory.js";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const content = read("public/data/site-content.json");
const publication = read("public/data/election-directory-2026.json");
const expected = createJudicialRetentionProjection(electionConfig);
assert.deepEqual(publication.judicialRetention, expected, "Public judicial fields must equal the canonical projection");
assert.equal(expected.questions.length, 6);
assert.equal(expected.courts.length, 3);
assert.deepEqual(expected.questions.map(q => q.name), ["Dirk V. Block", "Thomas E. Stine", "Ricky A. Schreiner", "Julie D. Smith", "David J. A. Bargen", "Richard R. Smith"]);
assert.equal(createJudicialRetentionProjection({}), null, "Another election must not inherit these judges");
assert.doesNotMatch(JSON.stringify(expected), /provenance|ballotPhotographs|localArchive|affiliation/);
const sourceText = fs.readFileSync("src/provenance/elections/2026/sources/ne-2026-retention-list-2026-08-03.txt", "utf8");
const normalize = value => value.replace(/\s+/g, " ");
for (const question of expected.questions) {
  assert(normalize(sourceText).includes(question.ballotQuestion), `Question must match official list: ${question.name}`);
  assert.deepEqual(question.choices, ["Yes", "No"]);
}
const invalid = read(electionConfig.judicialRetention);
const tempPath = "work/invalid-retention-test.json";
try {
  const rejects = change => {
    const data = structuredClone(invalid); change(data);
    fs.writeFileSync(tempPath, JSON.stringify(data));
    assert.throws(() => createJudicialRetentionProjection({ ...electionConfig, judicialRetention: tempPath }));
  };
  rejects(data => data.electionId = "another-election");
  rejects(data => data.retentionQuestions[0].choices = ["Approve", "Reject"]);
  rejects(data => data.retentionQuestions[0].ballotQuestion = "Vote for Dirk V. Block");
  rejects(data => data.retentionQuestions[0].judgeId = "missing-judge");
  rejects(data => data.retentionQuestions[0].sourceId = "missing-source");
} finally { fs.rmSync(tempPath, { force: true }); }

const dom = new JSDOM(fs.readFileSync("public/index.html", "utf8"), { url: "https://preview.invalid/" });
const saved = { window: globalThis.window, document: globalThis.document, CustomEvent: globalThis.CustomEvent };
try {
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.CustomEvent = dom.window.CustomEvent;
  // Static output must already contain every question, without running application code.
  assert.equal(document.querySelectorAll(".judicial-card").length, 6);
  assert.equal(document.querySelectorAll(".judicial-court").length, 3);
  renderJudicialRetention(expected, content.judicialRetention);
  initializeDirectory({ siteConfig: { lastReviewed: content.election.lastReviewed, electionDay: content.election.dateDisplay, correctionEmail: content.guide.correctionEmail }, interfaceCopy: content.interfaceCopy, affiliationGuide: content.affiliationGuide, electionData: publication.offices, categorySummaryData: publication.categorySummaries });
  assert.equal(document.querySelectorAll(".judicial-card").length, 6, "Initialization must not duplicate judges");
  assert.equal(document.querySelectorAll(".judicial-card .affiliation-badge").length, 0);
  assert.equal(document.querySelectorAll(".judicial-card input, .judicial-card button").length, 0, "Ballot choices are explanatory, not a simulated vote");
  const originalCandidateCount = document.querySelector("[data-directory-candidate-count]").textContent;
  const input = document.querySelector("#directory-search");
  const search = value => { input.value = value; input.dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  const visibleJudges = () => [...document.querySelectorAll(".judicial-card")].filter(card => !card.hidden);
  search("Bargen"); assert.equal(visibleJudges().length, 1); assert.match(visibleJudges()[0].textContent, /David J. A. Bargen/);
  assert.match(document.querySelector("#directory-status").textContent, /1 judicial retention question/);
  assert.doesNotMatch(document.querySelector("#directory-status").textContent, /No matches/);
  assert.match(document.querySelector("#directory-search-suggestions").textContent, /Bargen/);
  search("District Court"); assert.equal(visibleJudges().length, 3);
  search("District Court, District 1"); assert.equal(visibleJudges().length, 3, "Court suggestion text must also be a valid search");
  search("Workers"); assert.equal(visibleJudges().length, 2);
  search("retention"); assert.equal(visibleJudges().length, 6);
  search(""); assert.equal(visibleJudges().length, 6);
  assert.equal(document.querySelector("[data-directory-candidate-count]").textContent, originalCandidateCount);
  assert.equal(filterJudicialRetention({ affiliation: "registration:Republican", active: true }), 0);
  assert.equal(document.querySelector(".judicial-filter-notice").hidden, false);
  document.querySelector("#nonpartisan-race-filter").click();
  assert.equal(visibleJudges().length, 6, "Judicial retention stays available with the nonpartisan filter");
  document.dispatchEvent(new dom.window.CustomEvent("directory:navigate"));
  assert.equal(visibleJudges().length, 6);
  assert.equal(document.querySelector(".judicial-filter-notice").hidden, true);
} finally {
  dom.window.close();
  for (const [key,value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
}
console.log("Judicial retention: official wording, source equality, static access, search, filter separation, election isolation, and invalid-input rejection passed.");
