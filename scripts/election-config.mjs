import fs from "node:fs";
import path from "node:path";
export const projectRoot = path.resolve(import.meta.dirname, "..");
export function resolveProjectPath(value) {
  if (typeof value !== "string" || !value) throw new Error("Missing project path");
  const resolved = path.resolve(projectRoot, value);
  if (!resolved.startsWith(projectRoot + path.sep)) throw new Error(`Path leaves project: ${value}`);
  return resolved;
}
export function loadElectionConfig(file = process.env.ELECTION_CONFIG || "src/elections/active.json") {
  const config = JSON.parse(fs.readFileSync(resolveProjectPath(file), "utf8"));
  if (config.configVersion !== "1.0.0") throw new Error("Unsupported election configuration version");
  for (const key of ["electionId", "dateIso", "timeZone", "jurisdiction", "coverage", "calendarUid", "dataset", "content", "sourceCopy", "publicDataFile"]) {
    if (typeof config[key] !== "string" || !config[key]) throw new Error(`Election configuration requires ${key}`);
  }
  if (!/^[a-z0-9-]+$/.test(config.electionId) || !/^[a-z0-9-]+\.json$/.test(config.publicDataFile)) throw new Error("Invalid election identity or output filename");
  if (config.electionType !== "general") throw new Error("Only comparable general elections are supported by contract v1");
  if (typeof config.isFixture !== "boolean") throw new Error("isFixture must be explicit");
  new Intl.DateTimeFormat("en", { timeZone: config.timeZone });
  for (const key of ["dataset", "content", "sourceCopy"]) resolveProjectPath(config[key]);
  if (config.sourceAdapter) resolveProjectPath(config.sourceAdapter);
  return config;
}
export const electionConfig = loadElectionConfig();
