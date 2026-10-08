import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createCategorySummaryData } from "./category-summary-policy.mjs";
import { createPublicDirectoryProjection } from "./public-directory-projection.mjs";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "src");
const publicRoot = path.join(root, "public");
const contentPath = path.join(sourceRoot, "content/site-content.json");
const canonicalPath = path.join(sourceRoot, "data/elections/2026/election-directory.json");
const templatePath = path.join(sourceRoot, "site/index.template.html");

const contentBytes = fs.readFileSync(contentPath);
const canonicalBytes = fs.readFileSync(canonicalPath);
const content = JSON.parse(contentBytes.toString("utf8"));
const canonical = JSON.parse(canonicalBytes.toString("utf8"));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const iconVersion = sha256(Buffer.concat(["favicon.svg", "favicon.ico", "favicon-32.png", "apple-touch-icon.png"].map(file => fs.readFileSync(path.join(sourceRoot, "site/assets", file))))).slice(0, 12);
const stylesRoot = path.join(sourceRoot, "site/styles");
const styleVersion = sha256(fs.readdirSync(stylesRoot)
  .filter((file) => file.endsWith(".css"))
  .sort()
  .map((file) => `${file}\n${fs.readFileSync(path.join(stylesRoot, file), "utf8")}`)
  .join("\n")).slice(0, 12);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const emphasizeText = (value, emphasis) => {
  const text = escapeHtml(value);
  const label = escapeHtml(emphasis);
  if (!label || !text.includes(label)) {
    throw new Error("Hero body emphasis must match text in the hero body");
  }
  return text.replace(label, `<strong>${label}</strong>`);
};

const replaceToken = (html, token, value) => {
  const marker = `{{${token}}}`;
  if (!html.includes(marker)) throw new Error(`Template token is missing: ${marker}`);
  return html.replaceAll(marker, value);
};

const calendar = content.election.calendar;
const calendarPath = path.posix.join("assets", calendar.fileName);
const dateToBasic = (dateIso) => dateIso.replaceAll("-", "");
const addDays = (dateIso, days) => {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const escapeCalendarText = (value) => String(value)
  .replaceAll("\\", "\\\\")
  .replaceAll(";", "\\;")
  .replaceAll(",", "\\,")
  .replaceAll("\n", "\\n");
const foldCalendarLine = (line) => {
  const segments = [];
  let remaining = line;
  while (remaining.length > 73) {
    segments.push(remaining.slice(0, 73));
    remaining = ` ${remaining.slice(73)}`;
  }
  segments.push(remaining);
  return segments.join("\r\n");
};
const calendarLines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Local Civic Reference//Election Calendar//EN",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "BEGIN:VEVENT",
  "UID:2026-general-election-gage-county@local-civic-reference",
  `DTSTAMP:${calendar.stampUtc}`,
  `DTSTART;VALUE=DATE:${dateToBasic(content.election.dateIso)}`,
  `DTEND;VALUE=DATE:${dateToBasic(addDays(content.election.dateIso, 1))}`,
  `SUMMARY:${escapeCalendarText(calendar.eventTitle)}`,
  `DESCRIPTION:${escapeCalendarText(calendar.eventDescription)}`,
  `URL:${calendar.eventUrl}`,
  "TRANSP:TRANSPARENT",
  "BEGIN:VALARM",
  `TRIGGER:-P${calendar.reminderDaysBefore}D`,
  "ACTION:DISPLAY",
  `DESCRIPTION:${escapeCalendarText(calendar.reminderDescription)}`,
  "END:VALARM",
  "END:VEVENT",
  "END:VCALENDAR"
];
const calendarFile = `${calendarLines.map(foldCalendarLine).join("\r\n")}\r\n`;

const navigationItems = content.navigation
  .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
  .join("\n        ");

const methodologyItems = Object.entries(content.guide.methodologyLabels)
  .map(([key, label]) => {
    const description = canonical.publicMethodology[key];
    if (!description) throw new Error(`Canonical methodology is missing ${key}`);
    return `<dt>${escapeHtml(label)}</dt>\n              <dd>${escapeHtml(description)}</dd>`;
  })
  .join("\n              ");

const contextParagraphs = content.context.paragraphs
  .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
  .join("\n        ");

const faqItems = content.faq.items.map((item) => {
  let answer = escapeHtml(item.answer);
  if (item.answerLink) {
    const label = escapeHtml(item.answerLink.label);
    answer = answer.replace(label, `<a href="${escapeHtml(item.answerLink.href)}">${label}</a>`);
  }
  return `<details>\n            <summary>${escapeHtml(item.question)}</summary>\n            <p>${answer}</p>\n          </details>`;
}).join("\n          ");

const canonicalMetadata = content.site.canonicalUrl
  ? `<link rel="canonical" href="${escapeHtml(content.site.canonicalUrl)}">\n  <meta property="og:url" content="${escapeHtml(content.site.canonicalUrl)}">`
  : "";

const tokens = {
  ICON_VERSION: iconVersion,
  SITE_TITLE: escapeHtml(content.site.title),
  SITE_LANGUAGE: escapeHtml(content.site.language),
  PAGE_TITLE: escapeHtml(content.site.pageTitle),
  SITE_DESCRIPTION: escapeHtml(content.site.description),
  THEME_COLOR: escapeHtml(content.site.themeColor),
  STYLESHEET_URL: `styles/site.css?v=${styleVersion}`,
  CANONICAL_METADATA: canonicalMetadata,
  ELECTION_LABEL: escapeHtml(content.election.label),
  ELECTION_JURISDICTION: escapeHtml(content.election.jurisdiction),
  ELECTION_DATE_ISO: escapeHtml(content.election.dateIso),
  ELECTION_DATE_DISPLAY: escapeHtml(content.election.dateDisplay),
  ELECTION_CALENDAR_PATH: escapeHtml(calendarPath),
  ELECTION_CALENDAR_ARIA_LABEL: escapeHtml(calendar.ariaLabel),
  NAVIGATION_ITEMS: navigationItems,
  HERO_KICKER: escapeHtml(content.hero.kicker),
  HERO_HEADLINE: escapeHtml(content.hero.headline),
  HERO_BODY: emphasizeText(content.hero.body, content.hero.bodyEmphasis),
  DIRECTORY_HEADING: escapeHtml(content.directory.heading),
  SEARCH_LABEL: escapeHtml(content.directory.searchLabel),
  SEARCH_PLACEHOLDER: escapeHtml(content.directory.searchPlaceholder),
  SUGGESTIONS_LABEL: escapeHtml(content.directory.suggestionsLabel),
  DIRECTORY_INITIAL_STATUS: escapeHtml(content.directory.initialStatus),
  NOSCRIPT_HEADING: escapeHtml(content.directory.noScriptHeading),
  NOSCRIPT_BODY: escapeHtml(content.directory.noScriptBody),
  GUIDE_KICKER: escapeHtml(content.guide.kicker),
  GUIDE_HEADING: escapeHtml(content.guide.heading),
  GUIDE_INTRODUCTION: escapeHtml(content.guide.introduction),
  NOTICE_HEADING: escapeHtml(content.guide.noticeHeading),
  NOTICE_BODY: escapeHtml(content.guide.noticeBody),
  VERIFICATION_HEADING: escapeHtml(content.guide.verificationHeading),
  VERIFICATION_INTRODUCTION: escapeHtml(canonical.publicMethodology.introduction || content.guide.verificationIntroduction),
  METHODOLOGY_ITEMS: methodologyItems,
  CORRECTION_HEADING: escapeHtml(content.guide.correctionHeading),
  CORRECTION_INTRODUCTION: escapeHtml(content.guide.correctionIntroduction),
  CORRECTION_PROMPT: escapeHtml(content.guide.correctionPrompt),
  CORRECTION_EMAIL: escapeHtml(content.guide.correctionEmail),
  LAST_REVIEWED: escapeHtml(content.election.lastReviewed),
  CONTEXT_KICKER: escapeHtml(content.context.kicker),
  CONTEXT_HEADING: escapeHtml(content.context.heading),
  CONTEXT_PARAGRAPHS: contextParagraphs,
  FAQ_KICKER: escapeHtml(content.faq.kicker),
  FAQ_HEADING: escapeHtml(content.faq.heading),
  FAQ_ITEMS: faqItems,
  FOOTER_HEADING: escapeHtml(content.footer.heading),
  FOOTER_PURPOSE: escapeHtml(content.footer.purpose),
  FOOTER_AUTHORITY_NOTICE: escapeHtml(content.footer.authorityNotice),
  FOOTER_SPONSOR_LABEL: escapeHtml(content.footer.sponsorLink.label),
  FOOTER_SPONSOR_URL: escapeHtml(content.footer.sponsorLink.url)
};

let html = fs.readFileSync(templatePath, "utf8");
for (const [token, value] of Object.entries(tokens)) html = replaceToken(html, token, value);
const unresolved = [...html.matchAll(/{{([A-Z0-9_]+)}}/g)].map((match) => match[1]);
if (unresolved.length) throw new Error(`Unresolved template tokens: ${unresolved.join(", ")}`);

const publication = {
  schemaVersion: canonical.schemaVersion,
  electionId: canonical.electionId,
  generatedFrom: "src/data/elections/2026/election-directory.json",
  offices: createPublicDirectoryProjection(canonical),
  categorySummaries: createCategorySummaryData(canonical)
};

fs.rmSync(publicRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(publicRoot, "data"), { recursive: true });
fs.cpSync(path.join(sourceRoot, "site/styles"), path.join(publicRoot, "styles"), { recursive: true });
fs.cpSync(path.join(sourceRoot, "site/scripts"), path.join(publicRoot, "scripts"), { recursive: true });
fs.cpSync(path.join(sourceRoot, "site/assets"), path.join(publicRoot, "assets"), { recursive: true });
// Root aliases support browsers that discover icons without reading link metadata.
for (const icon of ["favicon.ico", "apple-touch-icon.png"]) {
  fs.copyFileSync(path.join(publicRoot, "assets", icon), path.join(publicRoot, icon));
}
const stylesheetEntryPath = path.join(publicRoot, "styles/site.css");
const versionedStylesheetEntry = fs.readFileSync(stylesheetEntryPath, "utf8")
  .replace(/\.css"\)/g, `.css?v=${styleVersion}")`);
fs.writeFileSync(stylesheetEntryPath, versionedStylesheetEntry);
fs.writeFileSync(path.join(publicRoot, calendarPath), calendarFile);
fs.writeFileSync(path.join(publicRoot, "index.html"), html);
fs.writeFileSync(path.join(publicRoot, "data/site-content.json"), `${JSON.stringify(content, null, 2)}\n`);
fs.writeFileSync(path.join(publicRoot, "data/election-directory-2026.json"), `${JSON.stringify(publication, null, 2)}\n`);
fs.writeFileSync(path.join(publicRoot, ".nojekyll"), "");

const manifest = {
  schemaVersion: canonical.schemaVersion,
  contentSchemaVersion: content.schemaVersion,
  canonicalDatasetSha256: sha256(canonicalBytes),
  contentSha256: sha256(contentBytes),
  publishedDirectorySha256: sha256(fs.readFileSync(path.join(publicRoot, "data/election-directory-2026.json"))),
  publicationTarget: "GitHub Pages /public"
};
fs.writeFileSync(path.join(publicRoot, "build-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
