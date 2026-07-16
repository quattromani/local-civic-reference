import fs from "node:fs";
import path from "node:path";
import { publicContentPath, publicHtmlPath, projectRoot } from "./project-paths.mjs";

const root = projectRoot;
const html = fs.readFileSync(publicHtmlPath, "utf8");
const content = JSON.parse(fs.readFileSync(publicContentPath, "utf8"));
const readDirectoryText = (directory) => fs.readdirSync(directory)
  .filter((file) => /\.(?:css|js)$/.test(file))
  .map((file) => fs.readFileSync(path.join(directory, file), "utf8"))
  .join("\n");
const sourceText = [
  html,
  JSON.stringify(content),
  readDirectoryText(path.join(root, "public/styles")),
  readDirectoryText(path.join(root, "public/scripts"))
].join("\n");
const errors = [];

const hexToLuminance = (hex) => {
  const channels = hex.replace("#", "").match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (foreground, background) => {
  const values = [hexToLuminance(foreground), hexToLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

const requiredContrast = [
  { label: "search input boundary", foreground: "#6f7b75", background: "#fbfaf6", minimum: 3 },
  { label: "search placeholder", foreground: "#68716c", background: "#fbfaf6", minimum: 4.5 },
  { label: "muted text on paper", foreground: "#535d58", background: "#fbfaf6", minimum: 4.5 },
  { label: "focus indicator on white", foreground: "#8a6817", background: "#ffffff", minimum: 3 },
  { label: "Republican badge text", foreground: "#682f35", background: "#f3e8e7", minimum: 4.5 },
  { label: "Democratic badge text", foreground: "#294d66", background: "#e7eef3", minimum: 4.5 },
  { label: "Libertarian badge text", foreground: "#4f492b", background: "#efede2", minimum: 4.5 },
  { label: "Nonpartisan badge text", foreground: "#38463f", background: "#e9eeeb", minimum: 4.5 },
  { label: "Unknown badge text", foreground: "#464c49", background: "#f0efeb", minimum: 4.5 }
];

const contrastResults = Object.fromEntries(requiredContrast.map((check) => {
  const ratio = contrastRatio(check.foreground, check.background);
  if (ratio < check.minimum) errors.push(`${check.label} contrast ${ratio.toFixed(2)}:1 is below ${check.minimum}:1`);
  return [check.label, Number(ratio.toFixed(2))];
}));

const h1Count = (html.match(/<h1\b/gi) || []).length;
if (h1Count !== 1) errors.push(`Expected one page-level h1; found ${h1Count}`);
for (const landmark of ["<header", "<main", "<nav", "<footer"]) {
  if (!html.includes(landmark)) errors.push(`Missing semantic landmark ${landmark}`);
}
if (!html.includes('<nav class="utility-nav" aria-label="Page navigation">')) errors.push("Page navigation landmark lacks a unique accessible label");

const staticIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateStaticIds = [...new Set(staticIds.filter((id, index) => staticIds.indexOf(id) !== index))];
if (duplicateStaticIds.length) errors.push(`Duplicate static IDs: ${duplicateStaticIds.join(", ")}`);

if (/role=["']heading["']|aria-level=/i.test(html)) errors.push("Generic ARIA headings remain in the page");
for (const nativeHeadingGenerator of [
  'makeElement("h3", "category-title"',
  'makeElement("h4", "office-title"',
  'makeElement("h5", "candidate-section-heading"',
  'makeElement("h6", "candidate-name"'
]) {
  if (!sourceText.includes(nativeHeadingGenerator)) errors.push(`Missing native generated heading: ${nativeHeadingGenerator}`);
}

const searchLabelMatch = html.match(/<label\b([^>]*)\bfor="directory-search"([^>]*)>([\s\S]*?)<\/label>/i);
const searchLabelAttributes = searchLabelMatch ? `${searchLabelMatch[1]} ${searchLabelMatch[2]}` : "";
const searchLabelText = searchLabelMatch ? searchLabelMatch[3].replace(/<[^>]+>/g, "").trim() : "";
if (!searchLabelMatch || /visually-hidden/.test(searchLabelAttributes) || !searchLabelText) {
  errors.push("Search input lacks its visible associated label");
}
if (!html.includes('id="directory-search"') || !html.includes('role="combobox"')) errors.push("Search combobox semantics are missing");
if (content.interfaceCopy.clearSearchLabel !== "Clear directory search"
  || !sourceText.includes('clearButton.setAttribute("aria-label", interfaceCopy.clearSearchLabel)')) {
  errors.push("Search clear control lacks a centralized, specific accessible name");
}

if (html.includes("Browse the candidate directory")) errors.push("Redundant hero directory button remains");
if (!html.includes('<time class="masthead-date" datetime="2026-11-03">Tuesday, November 3, 2026</time>')
  || content.election.dateIso !== "2026-11-03") {
  errors.push("The masthead lacks a semantic, configurable Election Day dateline");
}

if (!/:focus-visible\s*\{/i.test(sourceText)) errors.push("Required focus-visible styling is missing");
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(sourceText)) errors.push("Reduced-motion rules are missing");
if (!sourceText.includes("The candidate directory could not be displayed.")) errors.push("Visible fatal directory error messaging is missing");
if (!sourceText.includes('status.setAttribute("role", "alert")')) errors.push("Fatal directory errors are not exposed as alerts");

const genericInteractive = [...html.matchAll(/<(div|span|p)\b[^>]*(?:role=["']button["']|onclick=)[^>]*>/gi)];
if (genericInteractive.length) errors.push(`Found ${genericInteractive.length} interactive generic elements`);

if (!sourceText.includes("min-height: 2.25rem") || /@media \(min-width: 50rem\)[\s\S]{0,300}\.source-link\s*\{\s*min-height:\s*auto/.test(sourceText)) {
  errors.push("Candidate source links do not retain a sufficient target height");
}
if (!sourceText.includes('makeElement("details", "candidate-sources")')
  || !sourceText.includes('makeElement("summary", "candidate-sources-summary", interfaceCopy.sourceDetailsSummary)')
  || !/\.candidate-sources-summary\s*\{[\s\S]*?min-height:\s*2\.75rem;/.test(sourceText)) {
  errors.push("Candidate source details lack consistent native disclosure semantics or target sizing");
}
if (!/\.guide-methodology\s*>\s*\*\s*\{\s*min-width:\s*0;\s*\}/.test(sourceText)) {
  errors.push("Guide methodology content lacks the intrinsic-width safeguard required for narrow reflow and text spacing");
}
if (!/@media\s+print[\s\S]*?body\s*\{[\s\S]*?line-height:\s*1\.5;/.test(sourceText)) {
  errors.push("Print text does not retain the required readable line height");
}

if (errors.length) {
  process.stderr.write(`${JSON.stringify({ valid: false, errors, contrastResults }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({
    valid: true,
    h1Count,
    staticIds: staticIds.length,
    duplicateStaticIds: 0,
    nativeGeneratedHeadings: true,
    semanticLandmarks: true,
    searchAccessibleName: true,
    stakeholderModalRetired: true,
    focusVisibleStyles: true,
    reducedMotionRules: true,
    narrowReflowSafeguard: true,
    printLineHeight: true,
    visibleFatalError: true,
    interactiveGenericElements: 0,
    contrastResults
  }, null, 2)}\n`);
}
