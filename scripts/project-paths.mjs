import path from "node:path";

export const projectRoot = path.resolve(import.meta.dirname, "..");
export const canonicalDataPath = path.join(projectRoot, "src/data/elections/2026/election-directory.json");
export const siteContentPath = path.join(projectRoot, "src/content/site-content.json");
export const publicHtmlPath = path.join(projectRoot, "public/index.html");
export const publicDirectoryPath = path.join(projectRoot, "public/data/election-directory-2026.json");
export const publicContentPath = path.join(projectRoot, "public/data/site-content.json");
