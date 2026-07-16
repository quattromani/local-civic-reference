export const electionwarePolicy = Object.freeze({
  sourceId: "src-gage-electionware-2026-primary",
  reportStatus: "UNOFFICIAL RESULTS",
  publicStatus: "County-issued unofficial results",
  projectRole: "Authoritative project source for Gage County reported primary participation, vote totals, outcomes, and election-status facts",
  publicDescription: "This county report is labeled UNOFFICIAL RESULTS. The project uses it as its authoritative source for the Gage County reporting shown here; county totals alone do not establish final statewide or multi-county district outcomes."
});

export const publicMethodology = Object.freeze({
  introduction: "Different sources establish different facts. Candidate cards identify the source used for each displayed claim.",
  registrationVerification: "When available, Nebraska VoterCheck confirms a candidate’s voter-registration affiliation.",
  primaryParticipation: "A named partisan primary in the Gage County Electionware report confirms participation in that party’s primary contest. It does not confirm voter registration.",
  filingInformation: "Official county and state filing snapshots identify candidates currently listed for the general election. Filing remains open, so these snapshots do not establish a final contest.",
  electionOutcomes: "Gage County vote totals come from its Electionware report, which is labeled UNOFFICIAL RESULTS and covers Gage County reporting only. The official state canvass establishes statewide and multi-county primary nominees.",
  stageSeparation: "Current listings and primary history are shown separately so candidates who did not advance are not mistaken for current candidates.",
  missingVerification: "When an affiliation source has not been confirmed, the directory says “Verification Pending” or “Not Yet Confirmed.” No affiliation is inferred."
});

export const correctionEmail = "gagecountygop.media@gmail.com";

const forbiddenMethodologyPatterns = [
  /party (?:convention|committee) materials?/i,
  /party websites?/i,
  /campaign (?:websites?|sites?)/i,
  /official biographies?/i,
  /news (?:reports?|reporting)/i
];

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export function extractPublicMethodology(html) {
  const start = html.indexOf('<div id="verification"');
  const end = html.indexOf('<section id="context"', start);
  if (start < 0 || end < 0) throw new Error("Could not locate the published source methodology section");
  return html.slice(start, end);
}

export function validateSourceCertainty(data, html) {
  const errors = [];
  const source = data.sources.find((item) => item.sourceId === electionwarePolicy.sourceId);
  if (!source) return [`Missing required Electionware source ${electionwarePolicy.sourceId}`];

  for (const field of ["reportStatus", "publicStatus", "projectRole", "publicDescription"]) {
    if (source[field] !== electionwarePolicy[field]) {
      errors.push(`Electionware ${field} must be ${JSON.stringify(electionwarePolicy[field])}; found ${JSON.stringify(source[field])}`);
    }
  }

  const sourceClaims = [source.name, source.sourceType, source.reportStatus, source.publicStatus, source.projectRole, source.publicDescription, source.scopeNote]
    .filter(Boolean)
    .join(" ");
  if (/certified/i.test(sourceClaims)) errors.push("Electionware source metadata must not describe the unofficial report as certified");
  if (/official results certified/i.test(data.datasetStatus || data.certificationStatus || "")) {
    errors.push("Dataset status must not describe Electionware results as certified");
  }

  let renderedMethodology = "";
  try {
    renderedMethodology = extractPublicMethodology(html);
  } catch (error) {
    errors.push(error.message);
    return errors;
  }

  const expectedMethodology = data.publicMethodology || {};
  for (const [field, expectedText] of Object.entries(publicMethodology)) {
    if (expectedMethodology[field] !== expectedText) {
      errors.push(`Canonical public methodology ${field} differs from the approved source policy`);
    }
    const escapedText = escapeHtml(expectedText);
    if (!renderedMethodology.includes(escapedText)) {
      errors.push(`Rendered public methodology is missing approved ${field} wording`);
    }
  }

  for (const pattern of forbiddenMethodologyPatterns) {
    if (pattern.test(renderedMethodology)) errors.push(`Rendered public methodology includes a disallowed verification method: ${pattern}`);
  }
  if (!renderedMethodology.includes("Nebraska VoterCheck")) errors.push("Public methodology does not identify Nebraska VoterCheck");
  if (!renderedMethodology.includes("Primary participation") || !renderedMethodology.includes("It does not confirm voter registration.")) {
    errors.push("Public methodology does not distinguish partisan-primary participation from voter-registration verification");
  }
  if (!renderedMethodology.includes(electionwarePolicy.reportStatus)) errors.push("Public methodology does not disclose the Electionware report's UNOFFICIAL RESULTS label");
  if (!renderedMethodology.includes(`mailto:${correctionEmail}`)) errors.push("Public methodology does not include the monitored correction contact");
  if (html.split(`mailto:${correctionEmail}`).length - 1 < 2) {
    errors.push("The monitored correction contact must appear in both the methodology panel and footer");
  }
  if (/corrections@example\.org|placeholder address/i.test(html)) errors.push("Public output contains a placeholder correction contact");

  return errors;
}
