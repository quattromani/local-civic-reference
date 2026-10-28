const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const countLabel = (count, copy) => (count === 1 ? copy.summaryOne : copy.summaryMany).replaceAll("{count}", String(count));

export function renderJudicialRetention(data, copy) {
  const host = document.querySelector("#judicial-retention-content");
  if (!host) return;
  host.replaceChildren();
  if (!data) return;
  const section = element("details", "directory-category judicial-retention");
  section.id = "judicial-retention";
  section.dataset.summaryOne = copy.summaryOne;
  section.dataset.summaryMany = copy.summaryMany;
  const summary = element("summary", "category-summary");
  const heading = element("h3", "category-summary-text");
  heading.append(element("span", "category-title", copy.heading));
  const utility = element("span", "category-summary-utility");
  utility.append(element("span", "category-count judicial-count", countLabel(data.questions.length, copy)));
  const affordance = element("span", "category-affordance");
  affordance.append(element("span", "category-affordance-label category-affordance-label--closed", copy.viewJudges), element("span", "category-affordance-label category-affordance-label--open", copy.hideJudges));
  utility.append(affordance); heading.append(utility); summary.append(heading);
  const body = element("div", "category-offices");
  body.append(element("p", "candidate-section-context", copy.introduction), element("p", "candidate-section-context", copy.instructions));
  const resources = element("div", "judicial-resources");
  resources.append(element("h4", "office-title", "Resources for evaluating judges"));
  for (const resource of data.voterResources?.length ? data.voterResources : [data.processSource]) {
    const entry = element("p", "candidate-section-context");
    const link = element("a", "source-link", resource.title);
    link.href = resource.url;
    entry.append(link);
    if (resource.description) entry.append(element("span", "", ` ${resource.description}`));
    resources.append(entry);
  }
  body.append(resources);
  for (const court of data.courts) {
    const group = element("details", "office-disclosure judicial-court");
    group.id = `judicial-court-${court.courtId}`;
    group.dataset.label = `${court.name}, ${court.scope}`;
    group.dataset.searchText = group.dataset.label.toLowerCase();
    const courtSummary = element("summary", "office-summary");
    const courtHeading = element("h4", "office-summary-main");
    courtHeading.append(element("span", "office-title", court.name));
    courtHeading.append(element("span", "office-summary-jurisdiction", court.scope));
    courtSummary.append(courtHeading);
    const list = element("ul", "candidate-list judicial-list");
    list.setAttribute("aria-label", `${court.name}, ${court.scope}, retention questions`);
    for (const question of data.questions.filter(item => item.courtId === court.courtId)) {
      const card = element("li", "candidate-card judicial-card");
      card.id = question.questionId;
      card.dataset.searchText = `${question.name} ${question.ballotQuestion}`.toLowerCase();
      const header = element("div", "candidate-card-header");
      header.append(element("h5", "candidate-name", question.name));
      if (question.affiliation) {
        const affiliation = element("span", "affiliation-badge affiliation-badge--republican judicial-affiliation", question.affiliation.label);
        affiliation.setAttribute("role", "group");
        affiliation.setAttribute("aria-label", `Political affiliation: ${question.affiliation.label}. Reported by Voter Information Project.`);
        header.append(affiliation);
      }
      card.append(header, element("p", "candidate-election-status", `${copy.questionLabel}, ${copy.termLabel}`), element("p", "candidate-note", question.ballotQuestion), element("p", "candidate-note", copy.choicesLabel));
      const sources = element("details", "candidate-sources");
      sources.append(element("summary", "candidate-sources-summary", copy.sourcesLabel));
      const sourceList = element("div", "candidate-source-list");
      const judicialSources = [...question.sources];
      if (question.affiliation) judicialSources.push({ ...question.affiliation.source, title: "Voter Information Project: reported Republican affiliation" });
      for (const source of judicialSources) {
        const entry = element("div", "candidate-source-entry");
        const link = element("a", "source-link", source.title);
        link.href = source.url;
        entry.append(link, element("p", "candidate-reviewed", `${copy.reviewedLabel} ${source.reviewedDate}${source.sourceDate ? `; source dated ${source.sourceDate}` : ""}`));
        sourceList.append(entry);
      }
      sources.append(sourceList); card.append(sources); list.append(card);
    }
    const content = element("div", "office-candidate-content"); content.append(list);
    group.append(courtSummary, content); body.append(group);
  }
  section.append(summary, body); host.append(section);
  host.append(element("p", "candidate-section-context judicial-filter-notice", copy.filterNotice));
  host.querySelector(".judicial-filter-notice").hidden = true;
}

// Candidate affiliation filters never classify judges as missing affiliations.
export function filterJudicialRetention({ query = "", affiliation = null, active = false } = {}) {
  const section = document.querySelector("#judicial-retention");
  if (!section) return 0;
  const notice = document.querySelector(".judicial-filter-notice");
  notice.hidden = !affiliation;
  let count = 0;
  const categoryMatches = "judicial retention judges".includes(query);
  for (const court of section.querySelectorAll(".judicial-court")) {
    let courtCount = 0;
    for (const card of court.querySelectorAll(".judicial-card")) {
      const matches = !affiliation && (!query || categoryMatches || court.dataset.searchText.includes(query) || card.dataset.searchText.includes(query));
      card.hidden = !matches;
      if (matches) courtCount++;
    }
    court.hidden = courtCount === 0;
    if (active) court.open = courtCount > 0 && Boolean(query);
    count += courtCount;
  }
  section.hidden = count === 0;
  section.querySelector(".judicial-count").textContent = countLabel(count, { summaryOne: section.dataset.summaryOne, summaryMany: section.dataset.summaryMany });
  if (active) section.open = count > 0;
  return count;
}
