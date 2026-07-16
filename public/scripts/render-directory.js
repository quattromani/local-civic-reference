import { setupDirectorySearch } from "./search.js";

export function initializeDirectory({ siteConfig, interfaceCopy, electionData, categorySummaryData }) {
    /* Rendering logic below consumes siteConfig and the generated electionData projection. */
    const directory = document.querySelector("#directory-content");
    const status = document.querySelector("#directory-status");

    function makeElement(tagName, className, textContent) {
      const element = document.createElement(tagName);
      if (className) element.className = className;
      if (textContent !== undefined) element.textContent = textContent;
      return element;
    }

    function makeSourceLink(candidate, source) {
      const link = makeElement("a", "source-link", interfaceCopy.viewSource);
      link.href = source.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${source.sourceLabel}, ${source.roleLabels.join(", ")} for ${candidate.name} (opens in a new tab)`);
      return link;
    }

    function sourceRoleHeading(source) {
      const roles = new Set(source.roles);
      const labels = [];
      if (roles.has("affiliation")) labels.push("Affiliation");
      if (roles.has("filing")) labels.push("Current filing");
      if (roles.has("participation") || roles.has("result")) labels.push("Primary participation and result");
      else if ((roles.has("status") || roles.has("stage")) && !roles.has("filing")) labels.push("Election status");
      if (!labels.length && roles.has("candidateName")) labels.push("Candidate name");
      return labels.join(" · ") || source.roleLabels.join(", ");
    }

    function makeSourceEntry(candidate, source) {
      const entry = makeElement("div", "candidate-source-entry");
      const roleText = sourceRoleHeading(source);
      const role = makeElement("p", "candidate-source-role", roleText);
      const sourceName = makeElement("p", "candidate-source-name", source.sourceLabel);
      const sourceRow = makeElement("div", "candidate-source-row");
      const metadata = [
        source.sourceStatus,
        source.sourceDate && !source.sourceStatus?.includes(source.sourceDate)
          ? `${interfaceCopy.reviewedPrefix} ${source.sourceDate}`
          : null
      ].filter(Boolean).join(" · ");
      if (source.sourceUrl) sourceRow.append(makeSourceLink(candidate, source));
      sourceRow.append(makeElement("span", "candidate-reviewed", metadata));
      entry.append(role, sourceName);
      if (source.sourceDescription) entry.append(makeElement("p", "source-detail", source.sourceDescription));
      entry.append(sourceRow);
      return entry;
    }

    function affiliationBadgeClass(label) {
      const normalized = label.toLowerCase();
      if (normalized.startsWith("republican")) return "affiliation-badge--republican";
      if (normalized.startsWith("democratic")) return "affiliation-badge--democratic";
      if (normalized.startsWith("libertarian")) return "affiliation-badge--libertarian";
      if (normalized.startsWith("nonpartisan")) return "affiliation-badge--nonpartisan";
      if (normalized.startsWith("unaffiliated")) return "affiliation-badge--unaffiliated";
      return "affiliation-badge--unknown";
    }

    function historyNote(candidate) {
      if (!candidate.note) return "";
      return candidate.note
        .replace(/^Gage County primary result:\s*/, "Primary result: ")
        .replace(/^Gage County reporting portion:\s*/, "Primary result: ")
        .replace(/\s*Statewide or districtwide advancement is established separately by the official state canvass\.$/, "");
    }

    function makeCandidateCard(candidate, office, electionStage = "current-general-election") {
      const item = makeElement("li", "candidate-card");
      const header = makeElement("div", "candidate-card-header");
      const name = makeElement("h6", "candidate-name", candidate.name);
      name.id = `${candidate.candidateId}-heading`;
      const affiliation = makeElement("span", "affiliation-badge", candidate.affiliation || "Not confirmed");
      affiliation.classList.add(affiliationBadgeClass(affiliation.textContent));
      affiliation.setAttribute(
        "aria-label",
        `Political affiliation: ${affiliation.textContent}. Verification status: ${candidate.affiliationVerificationState}.`
      );
      header.append(name, affiliation);

      const electionStatus = makeElement("p", "candidate-election-status", candidate.primaryOutcome);
      const sources = makeElement("details", "candidate-sources");
      const sourceSummary = makeElement("summary", "candidate-sources-summary", interfaceCopy.sourceDetailsSummary);
      const sourceList = makeElement("div", "candidate-source-list");
      candidate.sourceEntries.forEach((source) => sourceList.append(makeSourceEntry(candidate, source)));
      sources.append(sourceSummary, sourceList);

      item.append(header);
      if (candidate.seat && candidate.seat !== office.seat) {
        item.append(makeElement("p", "candidate-seat", candidate.seat));
      }
      item.append(electionStatus);
      const publicNote = electionStage === "primary-history" ? historyNote(candidate) : candidate.note;
      if (publicNote) item.append(makeElement("p", "candidate-note", publicNote));
      item.append(sources);

      item.dataset.electionStage = electionStage;

      item.dataset.searchText = [
        candidate.name,
        candidate.affiliation,
        candidate.affiliationVerificationState,
        candidate.seat,
        candidate.note,
        candidate.primaryOutcome,
        candidate.generalElectionStatus,
        ...candidate.sourceEntries.flatMap((source) => [
          source.sourceLabel,
          source.sourceDescription,
          source.sourceStatus,
          ...source.roleLabels
        ])
      ].filter(Boolean).join(" ").toLowerCase();
      return item;
    }

    function renderOffice(office, index) {
      const disclosure = makeElement("details", "office-disclosure");
      const summary = makeElement("summary", "office-summary");
      const summaryMain = makeElement("span", "office-summary-main");
      const title = makeElement("h4", "office-title", office.office);
      title.id = `${office.officeId}-heading`;

      const currentCandidates = office.candidates.filter((candidate) => candidate.electionStageGroup === "current-general-election");
      const primaryHistory = office.candidates.filter((candidate) => candidate.electionStageGroup === "primary-history");
      const officeMeta = [];
      if (office.jurisdiction && !office.office.toLowerCase().includes(office.jurisdiction.toLowerCase())) {
        officeMeta.push(office.jurisdiction);
      }
      if (office.officeMetadata.voteFor) officeMeta.push(`Vote for ${office.officeMetadata.voteFor}`);
      officeMeta.push(`${currentCandidates.length} current`);
      if (primaryHistory.length) officeMeta.push(`${primaryHistory.length} primary history`);
      const meta = makeElement(
        "span",
        "office-summary-meta",
        officeMeta.join(" · ")
      );
      summaryMain.append(title, meta);
      summary.append(summaryMain);

      const candidateContent = makeElement("div", "office-candidate-content");
      const currentSection = makeElement("section", "office-candidate-section");
      const currentHeading = makeElement("h5", "candidate-section-heading", "Current general-election candidates");
      currentHeading.id = `${office.officeId}-current-candidates`;
      const currentContext = makeElement("p", "candidate-section-context", `${office.generalElectionStatus} Filing snapshot: ${office.filingSnapshotDate}.`);
      currentSection.setAttribute("aria-labelledby", currentHeading.id);
      currentSection.append(currentHeading, currentContext);
      if (currentCandidates.length) {
        const currentList = makeElement("ul", "candidate-list");
        currentList.setAttribute("aria-label", `${office.office} current general-election candidates`);
        currentCandidates.forEach((candidate) => currentList.append(makeCandidateCard(candidate, office)));
        currentSection.append(currentList);
      }
      candidateContent.append(currentSection);

      if (primaryHistory.length) {
        const historySection = makeElement("details", "office-candidate-section primary-history-disclosure");
        const historySummary = makeElement("summary", "primary-history-summary");
        const historyHeading = makeElement("h5", "primary-history-heading", "Primary Election History");
        historyHeading.id = `${office.officeId}-primary-history`;
        const historyCount = makeElement(
          "span",
          "primary-history-count",
          `${primaryHistory.length} ${primaryHistory.length === 1 ? "candidate" : "candidates"}`
        );
        const historyPrompt = makeElement(
          "span",
          "primary-history-prompt",
          "Expand to review candidates who participated in the primary but did not advance."
        );
        historySummary.append(historyHeading, historyCount, historyPrompt);
        const historyContent = makeElement("div", "primary-history-content");
        historyContent.append(makeElement(
          "p",
          "primary-history-context",
          "Vote totals reflect the Gage County primary report. For statewide or multi-county contests, they show only Gage County’s reporting portion and do not establish the final contest result."
        ));
        const historyList = makeElement("ul", "candidate-list");
        historyList.setAttribute("aria-label", `${office.office} primary history`);
        primaryHistory.forEach((candidate) => historyList.append(makeCandidateCard(candidate, office, "primary-history")));
        historyContent.append(historyList);
        historySection.append(historySummary, historyContent);
        candidateContent.append(historySection);
      }

      disclosure.dataset.officeIndex = String(index);
      disclosure.id = office.officeId;
      disclosure.dataset.officeText = [
        office.office,
        office.jurisdiction,
        office.seat,
        office.electionDate
      ].filter(Boolean).join(" ").toLowerCase();
      disclosure.append(summary, candidateContent);
      return disclosure;
    }

    function renderCategory(category, offices, startIndex) {
      const disclosure = makeElement("details", "directory-category");
      const summary = makeElement("summary", "category-summary");
      const summaryText = makeElement("span", "category-summary-text");
      const categoryId = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const title = makeElement("h3", "category-title", category);
      title.id = `${categoryId}-heading`;

      const categorySummary = categorySummaryData.find((entry) => entry.category === category);
      if (!categorySummary) throw new Error(`Missing category summary metadata for ${category}`);
      const count = makeElement(
        "span",
        "category-count",
        categorySummary.displayLabel
      );
      const summaryUtility = makeElement("span", "category-summary-utility");
      const affordance = makeElement("span", "category-affordance");
      affordance.append(
        makeElement("span", "category-affordance-label category-affordance-label--closed", "View candidates"),
        makeElement("span", "category-affordance-label category-affordance-label--open", "Hide candidates")
      );
      summaryUtility.append(count, affordance);
      summaryText.append(title, summaryUtility);
      summary.append(summaryText);

      const officeWrap = makeElement("div", "category-offices");
      offices.forEach((office, offset) => officeWrap.append(renderOffice(office, startIndex + offset)));

      disclosure.dataset.categoryText = category.toLowerCase();
      disclosure.id = categoryId;
      disclosure.append(summary, officeWrap);
      return disclosure;
    }

    function applySiteConfig() {
      document.querySelectorAll("[data-last-reviewed]").forEach((element) => {
        element.textContent = siteConfig.lastReviewed;
      });
      document.querySelectorAll("[data-election-day]").forEach((element) => {
        element.textContent = siteConfig.electionDay;
      });
      document.querySelectorAll("[data-correction-email]").forEach((element) => {
        element.textContent = siteConfig.correctionEmail;
      });
      document.querySelectorAll("[data-correction-link]").forEach((element) => {
        element.href = `mailto:${siteConfig.correctionEmail}`;
      });
    }

    function renderDirectory() {
      if (!directory || !status) throw new Error("The candidate directory template is unavailable.");

      if (!Array.isArray(electionData) || electionData.length === 0) {
        status.textContent = interfaceCopy.emptyDirectory;
        return;
      }

      const groupedOffices = new Map();
      electionData.forEach((office) => {
        const category = office.category || "Other Local Boards";
        if (!groupedOffices.has(category)) groupedOffices.set(category, []);
        groupedOffices.get(category).push(office);
      });

      const fragment = document.createDocumentFragment();
      let officeIndex = 0;
      groupedOffices.forEach((offices, category) => {
        fragment.append(renderCategory(category, offices, officeIndex));
        officeIndex += offices.length;
      });
      directory.replaceChildren(fragment);

      const candidateCount = new Set(electionData.flatMap((office) => office.candidates.map((candidate) => candidate.candidateId))).size;
      document.querySelector("[data-directory-office-count]").textContent = String(electionData.length);
      document.querySelector("[data-directory-candidate-count]").textContent = String(candidateCount);
      document.querySelector("[data-directory-category-count]").textContent = String(groupedOffices.size);
      status.textContent = "";
    }

    function showDirectoryError(error) {
      const message = interfaceCopy.directoryError;
      if (directory) directory.replaceChildren();
      if (status) {
        status.textContent = message;
        status.classList.add("directory-error");
        status.setAttribute("role", "alert");
        status.setAttribute("aria-live", "assertive");
        status.tabIndex = 0;
      }
      console.error("Candidate directory error:", error);
    }

    try {
      applySiteConfig();
      renderDirectory();
      setupDirectorySearch({ directory, status, electionData, interfaceCopy });
    } catch (error) {
      showDirectoryError(error);
    }
}
