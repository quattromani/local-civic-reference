import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./project-paths.mjs";

const checks = [
  ["Canonical validation", "scripts/verify-certified-election-data.mjs"],
  ["Proof Gate 1 — provenance", "scripts/test-public-provenance.mjs"],
  ["Proof Gate 2 — source certainty", "scripts/test-source-certainty.mjs"],
  ["Proof Gate 3 — ordering", "scripts/test-ordering-policy.mjs"],
  ["Proof Gate 4 — accessibility", "scripts/test-accessibility.mjs"],
  ["Election-stage scope", "scripts/test-election-stage-scope.mjs"],
  ["Category summary counts", "scripts/test-category-summary-counts.mjs"],
  ["Publication safety", "scripts/validate-publication-safety.mjs"],
  ["Deterministic build", "scripts/test-deterministic-build.mjs"]
];

const syntaxFiles = [
  ...fs.readdirSync(path.join(projectRoot, "scripts")).filter((file) => file.endsWith(".mjs")).map((file) => path.join("scripts", file)),
  ...fs.readdirSync(path.join(projectRoot, "src/site/scripts")).filter((file) => file.endsWith(".js")).map((file) => path.join("src/site/scripts", file))
];
for (const file of syntaxFiles) execFileSync(process.execPath, ["--check", file], { cwd: projectRoot, stdio: "inherit" });

const completed = [];
for (const [label, script] of checks) {
  process.stdout.write(`\n[${label}]\n`);
  execFileSync(process.execPath, [script], { cwd: projectRoot, stdio: "inherit" });
  completed.push(label);
}
process.stdout.write(`\n${JSON.stringify({ valid: true, checks: completed }, null, 2)}\n`);
