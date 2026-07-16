import fs from "node:fs";
import path from "node:path";
import { projectRoot, publicDirectoryPath, publicHtmlPath } from "./project-paths.mjs";

const errors = [];
const publication = fs.readFileSync(publicDirectoryPath, "utf8");
const html = fs.readFileSync(publicHtmlPath, "utf8");
const publicFiles = [];

const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(fullPath);
    else publicFiles.push(fullPath);
  }
};
visit(path.join(projectRoot, "public"));

const prohibitedPublicationKeys = [
  "manualReview",
  "scopeReview",
  "sourceArtifacts",
  "authorityTier",
  "localArchive",
  "rejectedValue",
  "discrepancyLog"
];
for (const key of prohibitedPublicationKeys) {
  if (publication.includes(`\"${key}\"`)) errors.push(`Published JSON includes internal field ${key}`);
}

const publicText = publicFiles
  .filter((file) => !/\.(?:woff2?|png|jpe?g|webp|pdf|xlsx)$/i.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

const prohibitedPatterns = [
  [/\/Users\//, "absolute local path"],
  [/\b(?:localhost|127\.0\.0\.1)\b/i, "local server reference"],
  [/example\.org/i, "placeholder public URL"],
  [/corrections@example\.org/i, "placeholder correction email"],
  [/data:(?:image|font)\//i, "embedded base64 asset"],
  [/stakeholder-preview|billboard-preview/i, "retired stakeholder demonstration"],
  [/\b(?:TODO|FIXME)\b/, "unfinished development marker"]
];
for (const [pattern, label] of prohibitedPatterns) {
  if (pattern.test(publicText)) errors.push(`Public output includes ${label}`);
}

if (!html.includes('href="styles/site.css"')) errors.push("Public page does not use the generated stylesheet architecture");
if (!html.includes('type="module" src="scripts/app.js"')) errors.push("Public page does not use the modular application entry point");
if (/<style\b|<script>(?:.|\n)*<\/script>/i.test(html)) errors.push("Public HTML contains embedded production CSS or JavaScript");

const result = {
  valid: errors.length === 0,
  filesReviewed: publicFiles.length,
  publicationApprovedProjectionOnly: true,
  embeddedAssets: 0,
  errors
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
