import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./project-paths.mjs";

const errors = [];
const required = [
  "README.md",
  "package.json",
  "src/content/site-content.json",
  "src/data/elections/2026/election-directory.json",
  "src/site/index.template.html",
  "public/index.html",
  "project-docs/PROJECT-READINESS.md",
  "project-docs/DECISIONS.md",
  "project-docs/CHANGELOG.md",
  ".gitignore"
];
for (const relativePath of required) {
  if (!fs.existsSync(path.join(projectRoot, relativePath))) errors.push(`Missing required release file ${relativePath}`);
}
for (const retired of ["dist", "index.html", "assets/billboard-stakeholder-preview.png", "assets/billboard-stakeholder-preview.webp"]) {
  if (fs.existsSync(path.join(projectRoot, retired))) errors.push(`Retired architecture remains: ${retired}`);
}

const result = {
  valid: errors.length === 0,
  sourceOfTruth: "src/",
  publicationTarget: "public/",
  documentation: "project-docs/",
  errors
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
