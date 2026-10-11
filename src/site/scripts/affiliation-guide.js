export function affiliationBadgeClass(label) {
  const normalized = (label || "").toLowerCase();
  for (const party of ["republican", "democratic", "libertarian", "nonpartisan", "unaffiliated"]) {
    if (normalized.startsWith(party)) return `affiliation-badge--${party}`;
  }
  return "affiliation-badge--unknown";
}

export function affiliationIdentity(candidate) {
  return JSON.stringify([candidate.affiliationEvidenceLabel || null, candidate.affiliationEvidenceLabel ? candidate.affiliation : null]);
}

export function affiliationLabel(candidate, copy) {
  return candidate.affiliationEvidenceLabel
    ? `${copy.evidenceLabels[candidate.affiliationEvidenceLabel] || candidate.affiliationEvidenceLabel}: ${candidate.affiliation}`
    : copy.unverifiedAffiliation;
}

export function matchesAffiliation(candidateIdentity, selectedIdentity) {
  return !selectedIdentity || candidateIdentity === selectedIdentity;
}

export function setupAffiliationGuide({ electionData, guide, interfaceCopy, onSelect }) {
  const section = document.querySelector("#affiliation-guide");
  const groups = document.querySelector("#affiliation-guide-groups");
  const reset = document.querySelector("#affiliation-guide-reset");
  if (!section || !groups || !reset) throw new Error("The affiliation guide controls are unavailable.");
  const entries = new Map();
  for (const candidate of electionData.flatMap((office) => office.candidates)) {
    entries.set(affiliationIdentity(candidate), candidate);
  }
  let selectedIdentity = null;
  const buttons = new Map();
  function select(identity) {
    selectedIdentity = identity === selectedIdentity ? null : identity;
    for (const [key, button] of buttons) button.setAttribute("aria-pressed", String(key === selectedIdentity));
    reset.disabled = !selectedIdentity;
    onSelect(selectedIdentity, selectedIdentity ? affiliationLabel(entries.get(selectedIdentity), interfaceCopy) : "");
  }
  const drawers = document.createElement("div");
  drawers.className = "affiliation-guide-drawers";
  for (const [index, group] of guide.groups.entries()) {
    const candidates = [...entries.values()].filter((candidate) => (candidate.affiliationEvidenceLabel || null) === group.evidence)
      .sort((a, b) => (a.affiliation || "").localeCompare(b.affiliation || "", "en"));
    if (!candidates.length) continue;
    const primary = group.evidence === "Registered affiliation";
    const panel = document.createElement(primary ? "div" : "details");
    panel.className = primary ? "affiliation-guide-group" : "affiliation-guide-group affiliation-guide-drawer";
    if (primary) panel.setAttribute("role", "group");
    panel.setAttribute("aria-labelledby", `affiliation-guide-group-${index}`);
    const heading = document.createElement("h3");
    heading.id = `affiliation-guide-group-${index}`;
    heading.textContent = group.heading;
    const description = document.createElement("p");
    description.textContent = group.description;
    const pills = document.createElement("div");
    pills.className = "affiliation-guide-pills";
    for (const candidate of candidates) {
      const identity = affiliationIdentity(candidate);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `affiliation-badge affiliation-guide-pill ${affiliationBadgeClass(candidate.affiliation)}`;
      button.textContent = affiliationLabel(candidate, interfaceCopy);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-controls", "directory-content");
      button.addEventListener("click", () => select(identity));
      buttons.set(identity, button);
      pills.append(button);
    }
    if (primary) {
      panel.append(heading, description, pills);
      groups.append(panel);
    } else {
      const summary = document.createElement("summary");
      summary.append(heading);
      const body = document.createElement("div");
      body.className = "affiliation-guide-drawer-body";
      body.append(description, pills);
      panel.append(summary, body);
      drawers.append(panel);
    }
  }
  groups.append(drawers);
  reset.addEventListener("click", () => select(null));
  section.hidden = false;
}
