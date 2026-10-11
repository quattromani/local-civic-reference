import fs from "node:fs";
import { validateOrderingPolicy } from "./ordering-policy.mjs";
const schema = JSON.parse(fs.readFileSync(new URL("../src/contracts/election-directory.v1.schema.json", import.meta.url), "utf8"));
const supported = new Set(["$schema","$id","type","required","properties","items","const","enum","minimum","maximum","minLength","format"]);
function check(value, rule, location) {
  for (const key of Object.keys(rule)) if (!supported.has(key)) throw new Error(`Unsupported schema keyword ${key}`);
  if ("const" in rule && value !== rule.const) throw new Error(`${location}: unexpected constant`);
  if (rule.enum && !rule.enum.includes(value)) throw new Error(`${location}: unsupported value`);
  if (rule.type) {
    const matches = t => t === "null" ? value === null : t === "array" ? Array.isArray(value) : t === "object" ? value !== null && typeof value === "object" && !Array.isArray(value) : t === "integer" ? Number.isInteger(value) : t === "number" ? typeof value === "number" && Number.isFinite(value) : typeof value === t;
    if (![ ].concat(rule.type).some(matches)) throw new Error(`${location}: invalid type`);
  }
  if (value === null) return;
  if (rule.minLength && value.length < rule.minLength) throw new Error(`${location}: empty value`);
  if (rule.minimum !== undefined && value < rule.minimum || rule.maximum !== undefined && value > rule.maximum) throw new Error(`${location}: out of range`);
  if (rule.format === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value)) throw new Error(`${location}: invalid date`);
  if (rule.format === "uri") { if (!["https:","http:"].includes(new URL(value).protocol)) throw new Error(`${location}: invalid source URL`); }
  if (rule.required) for (const key of rule.required) if (!(key in value)) throw new Error(`${location}: missing ${key}`);
  if (rule.properties) for (const [key, child] of Object.entries(rule.properties)) if (key in value) check(value[key],child,`${location}.${key}`);
  if (rule.items) value.forEach((item,i) => check(item,rule.items,`${location}[${i}]`));
}
export function validateElectionContract(data, content, config) {
  check(data,schema,"directory");
  if (data.electionId !== config.electionId || data.election.dateIso !== config.dateIso || content.election.dateIso !== config.dateIso || data.election.jurisdiction !== config.jurisdiction || content.election.jurisdiction !== config.jurisdiction) throw new Error("Election data, content, and configuration disagree");
  const summaryCategories = new Set();
  for (const policy of data.categorySummaryPolicy) {
    if(summaryCategories.has(policy.category)) throw new Error("Duplicate category summary policy");
    summaryCategories.add(policy.category);
  }
  for (const policy of data.orderingPolicy.categories) if(!summaryCategories.has(policy.category)) throw new Error("Missing category summary policy");
  const maps = {};
  for (const [collection,key] of Object.entries({sources:"sourceId",jurisdictions:"jurisdictionId",offices:"officeId",candidates:"candidateId",affiliations:"affiliationId",candidacies:"candidacyId",contests:"contestId",results:"resultId"})) {
    maps[collection] = new Map();
    for (const record of data[collection]) { if (maps[collection].has(record[key])) throw new Error(`Duplicate ${key}`); maps[collection].set(record[key],record); }
  }
  const ref = (collection,id) => { if (!maps[collection].has(id)) throw new Error(`Unknown ${collection} reference ${id}`); return maps[collection].get(id); };
  for (const o of data.offices) { ref("jurisdictions",o.jurisdictionId); if(o.seatSourceId) ref("sources",o.seatSourceId); }
  for (const c of data.candidates) ref("sources",c.nameSourceId);
  for (const a of data.affiliations) {
    ref("candidates",a.candidateId);
    if (!a.sourceId) { if (a.evidenceType !== null || a.verifiedDate !== null || a.verificationState !== "Pending Verification") throw new Error("Unsourced affiliation must remain unverified"); }
    else {
      const source = ref("sources",a.sourceId);
      if (!a.evidenceType || !a.verifiedDate || a.verificationState !== "Verified") throw new Error("Sourced affiliation requires evidence type and verification date");
      if (source.evidenceKind !== ({registration:"registration","ballot-party":"filing","primary-participation":"primary-results"})[a.evidenceType]) throw new Error("Affiliation evidence conflicts with source kind");
    }
  }
  for (const c of data.contests) { ref("offices",c.officeId); ref("sources",c.sourceId); }
  for (const c of data.candidacies) {
    ref("candidates",c.candidateId); ref("offices",c.officeId);
    if (ref("affiliations",c.affiliationId).candidateId !== c.candidateId || ref("contests",c.contestId).officeId !== c.officeId) throw new Error("Candidacy relationship mismatch");
    if (c.electionCycle !== Number(config.dateIso.slice(0,4))) throw new Error("Candidacy belongs to another cycle");
    for (const key of ["filingSourceId","verificationSourceId","stageSourceId"]) if(c[key]) ref("sources",c[key]);
    if (!c.filingSourceId && !c.verificationSourceId) throw new Error("Candidacy lacks evidence");
    if (c.resultId && ref("results",c.resultId).candidacyId !== c.candidacyId) throw new Error("Result relationship mismatch");
  }
  for (const result of data.results) { ref("candidacies",result.candidacyId); ref("sources",result.sourceId); }
  const errors = validateOrderingPolicy(data, { approvedPolicy: null }); if(errors.length) throw new Error(errors.join("\n"));
  return true;
}
