import fs from 'node:fs';
import assert from 'node:assert/strict';
import { canonicalDataPath, projectRoot } from './project-paths.mjs';
const data = JSON.parse(fs.readFileSync(canonicalDataPath));
const snapshot = JSON.parse(fs.readFileSync(`${projectRoot}/src/data/elections/2026/source-data/official-filing-snapshots-2026.json`));
const names = new Map(data.candidates.map(candidate => [candidate.candidateId, candidate.displayName]));
for (const office of [...snapshot.stateOffices, ...snapshot.stateFiledLocalDistricts]) {
  const expected = (office.currentCandidates || office.candidates).map(candidate => candidate.name).sort();
  const actual = data.candidacies.filter(record => record.officeId === office.officeId && record.electionStageGroup === 'current-general-election').map(record => names.get(record.candidateId)).sort();
  assert.deepEqual(actual, expected, `Final-list roster differs for ${office.officeId}`);
}
const declared = snapshot.localOffices.flatMap(office => office.candidates.filter(candidate => candidate.filingMethod === 'Declared write-in').map(candidate => ({ officeId: office.officeId, ...candidate })));
assert.equal(declared.length, 31);
for (const candidate of declared) {
  const record = data.candidacies.find(record => record.officeId === candidate.officeId && names.get(record.candidateId) === candidate.name);
  assert.equal(record?.filingMethod, 'Declared write-in');
  assert.match(record.generalElectionStatus, /not established as printed/);
}
const cindy = data.candidacies.find(record => names.get(record.candidateId) === 'Cindy Burbank');
assert.equal(cindy.electionStageGroup, 'primary-history');
assert.equal(cindy.primaryStatus, 'Primary Nominee Not Listed in Final General List');
for (const name of ['Dan Osborn', 'Mark Cohen']) {
  const record = data.candidacies.find(record => names.get(record.candidateId) === name);
  assert.equal(record.filingMethod, 'By petition');
  assert.notEqual(data.affiliations.find(item => item.affiliationId === record.affiliationId).label, 'By Petition');
}
assert.equal(data.lastValidated, '2026-10-06');
console.log(JSON.stringify({valid:true, finalListOffices:14, declaredWriteIns:declared.length}));
