import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => JSON.parse(fs.readFileSync(path, "utf8"));
const data = read("src/data/elections/2026/election-directory.json");
const publication = read("public/data/election-directory-2026.json");
const expected = new Map([["Jeff Bacon", "Nonpartisan"], ["Eric G. Malina", "Republican"], ["Dan Osborn", "Nonpartisan"], ["Mark Cohen", "Nonpartisan"]]);
const reported = data.affiliations.filter(record => record.evidenceType === "reported-affiliation");
assert.equal(reported.length, expected.size);
for (const affiliation of reported) {
  const person = data.candidates.find(record => record.candidateId === affiliation.candidateId);
  assert.equal(affiliation.label, expected.get(person.displayName));
  const source = data.sources.find(record => record.sourceId === affiliation.sourceId);
  assert.equal(new URL(source.url).hostname, "www.voterinformation.org");
  assert.equal(source.evidenceKind, "reported-affiliation");
  const card = publication.offices.flatMap(office => office.candidates).find(record => record.candidateId === person.candidateId);
  assert.equal(card.affiliation, affiliation.label);
  assert.equal(card.affiliationEvidenceLabel, "Reported affiliation");
  const evidence = card.sourceEntries.find(record => record.sourceId === source.sourceId);
  assert(evidence.roles.includes("affiliation"));
  assert.match(evidence.sourceDescription, /not a direct voter-registration check/);
}
assert(!data.candidates.some(record => /Mary.*Benes/i.test(record.displayName)));
const judges = read("src/data/elections/2026/judicial-retention.json");
assert(judges.judges.some(record => record.ballotName === "Ricky A. Schreiner"));
assert(!judges.judges.some(record => /Rickey/.test(record.ballotName)));
console.log("Four reported affiliations retain VIP citations and distinct evidence labels; Mary Benes excluded; Ricky ballot spelling preserved.");
