import fs from "node:fs";
import { resolveProjectPath } from "./election-config.mjs";

// Retention questions are a separate subject area, never synthetic candidacies.
export function createJudicialRetentionProjection(config) {
  if (!config.judicialRetention) return null;
  const data = JSON.parse(fs.readFileSync(resolveProjectPath(config.judicialRetention), "utf8"));
  if (data.schemaVersion !== "1.0.0" || data.electionId !== config.electionId || data.electionDate !== config.dateIso) throw new Error("Judicial retention election identity mismatch");
  const index = (items, key) => {
    const map = new Map();
    for (const item of items) {
      if (!item[key] || map.has(item[key])) throw new Error(`Duplicate or missing judicial ${key}`);
      map.set(item[key], item);
    }
    return map;
  };
  const sources = index(data.sources, "sourceId");
  const judges = index(data.judges, "judgeId");
  const courts = index(data.courts, "courtId");
  index(data.retentionQuestions, "questionId");
  const referencedJudges = new Set();
  const orders = new Set();
  const publicSource = id => {
    const source = sources.get(id);
    if (!source || new URL(source.url).protocol !== "https:" || !/^\d{4}-\d{2}-\d{2}$/.test(source.reviewedDate)) throw new Error(`Invalid judicial source ${id}`);
    return { sourceId: id, title: source.title, url: source.url, sourceDate: source.sourceDate || null, reviewedDate: source.reviewedDate };
  };
  const questions = data.retentionQuestions.map(question => {
    const judge = judges.get(question.judgeId);
    if (!judge || !courts.has(question.courtId) || referencedJudges.has(question.judgeId)) throw new Error("Invalid judicial retention relationship");
    referencedJudges.add(question.judgeId);
    if (question.contestType !== "judicial-retention" || question.termYears !== 6 || JSON.stringify(question.choices) !== '["Yes","No"]' || question.ballotQuestion !== `Shall Judge ${judge.ballotName} be retained in office?`) throw new Error("Invalid retention question wording or choices");
    if (!Number.isInteger(question.displayOrder) || question.displayOrder < 1 || orders.has(question.displayOrder)) throw new Error("Invalid retention display order");
    orders.add(question.displayOrder);
    publicSource(judge.nameSourceId);
    if (judge.affiliation && (judge.affiliation.label !== "Republican" || judge.affiliation.evidenceType !== "reported-affiliation")) throw new Error("Invalid reported judicial affiliation");
    return { questionId: question.questionId, judgeId: judge.judgeId, name: judge.ballotName, affiliation: judge.affiliation ? { label: judge.affiliation.label, evidenceType: judge.affiliation.evidenceType, source: publicSource(judge.affiliation.sourceId) } : null, courtId: question.courtId, contestType: question.contestType, ballotQuestion: question.ballotQuestion, choices: [...question.choices], termYears: question.termYears, displayOrder: question.displayOrder, sources: [...new Set([judge.nameSourceId, question.sourceId])].map(publicSource) };
  }).sort((a,b) => a.displayOrder - b.displayOrder);
  if (referencedJudges.size !== judges.size) throw new Error("Judge missing retention question");
  return {
    electionId: data.electionId,
    electionDate: data.electionDate,
    courts: [...courts.values()].sort((a,b) => a.displayOrder - b.displayOrder).map(court => ({ courtId: court.courtId, name: court.name, district: court.district, scope: court.scope })),
    questions,
    processSource: publicSource(data.processSourceId),
    voterResources: (data.voterResources || []).map(resource => ({ ...publicSource(resource.sourceId), description: resource.description }))
  };
}
