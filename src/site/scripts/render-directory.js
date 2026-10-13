import { affiliationBadgeClass, affiliationIdentity, affiliationLabel } from "./affiliation-guide.js";
import { setupDirectorySearch } from "./search.js";

export function initializeDirectory({ siteConfig, interfaceCopy, affiliationGuide, electionData, categorySummaryData, renderOnly = false }) {
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
      return labels.join(", ") || source.roleLabels.join(", ");
    }

    function makeSourceEntry(candidate, source) {
      const entry = makeElement("div", "candidate-source-entry");
      const roleText = sourceRoleHeading(source);
      const role = makeElement("p", "candidate-source-role", roleText);
      const sourceName = makeElement("p", "candidate-source-name", source.sourceId ? source.sourceLabel : interfaceCopy.unverifiedAffiliation);
      const sourceRow = makeElement("div", "candidate-source-row");
      const metadata = [
        source.sourceStatus,
        source.sourceDate && !source.sourceStatus?.includes(source.sourceDate)
          ? `${interfaceCopy.reviewedPrefix} ${source.sourceDate}`
          : null
      ].filter(Boolean).join(", ");
      if (source.sourceUrl) sourceRow.append(makeSourceLink(candidate, source));
      sourceRow.append(makeElement("span", "candidate-reviewed", metadata));
      entry.append(role, sourceName);
      if (source.sourceDescription) entry.append(makeElement("p", "source-detail", source.sourceDescription));
      entry.append(sourceRow);
      return entry;
    }

    function historyNote(candidate) {
      if (!candidate.note) return "";
      return candidate.note
        .replace(/^Gage County primary result:\s*/, "Primary result: ")
        .replace(/^Gage County reporting portion:\s*/, "Primary result: ")
        .replace(/\s*Statewide or districtwide advancement is established separately by the official state canvass\.$/, "");
    }

    function candidateNotePresentation(candidate, electionStage) {
      if (!candidate.note) return {};

      const resultPrefix = /^(?:Gage County primary result|Gage County reporting portion):\s*/;
      if (!resultPrefix.test(candidate.note)) {
        return { fallbackNote: electionStage === "primary-history" ? historyNote(candidate) : candidate.note };
      }

      const methodologyText = "Statewide or districtwide advancement is established separately by the official state canvass.";
      const resultText = candidate.note
        .replace(` ${methodologyText}`, "")
        .replace(resultPrefix, "")
        .replace(/\.$/, "");

      return {
        resultText,
        methodologyText: ""
      };
    }

    function makeCandidateCard(candidate, office, electionStage = "current-general-election") {
      const item = makeElement("li", "candidate-card");
      const header = makeElement("div", "candidate-card-header");
      const name = makeElement(electionStage === "primary-history" ? "h6" : "h5", "candidate-name", candidate.name);
      name.id = `${office.officeId}-${candidate.candidateId}-${electionStage}-heading`;
      const affiliationText = affiliationLabel(candidate, interfaceCopy);
      const affiliation = makeElement("span", "affiliation-badge", affiliationText);
      affiliation.classList.add(affiliationBadgeClass(candidate.affiliation || ""));
      affiliation.setAttribute("role", "group");
      affiliation.setAttribute(
        "aria-label",
        `Political affiliation: ${affiliation.textContent}. Verification status: ${candidate.affiliationVerificationState}.`
      );
      header.append(name, affiliation);

      const currentStatus = /Declared write-in/.test(candidate.generalElectionStatus || "")
        ? interfaceCopy.declaredWriteInStatus
        : /By-petition/.test(candidate.generalElectionStatus || "")
          ? interfaceCopy.petitionStatus
          : interfaceCopy.listedStatus;
      const electionStatus = makeElement("p", "candidate-election-status", electionStage === "primary-history" ? candidate.generalElectionStatus : currentStatus);
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
      if (candidate.ballotName && candidate.ballotName !== candidate.name) {
        item.append(makeElement("p", "candidate-seat", `Ticket: ${candidate.ballotName}`));
      }
      if (electionStage !== "primary-history" && currentStatus === interfaceCopy.declaredWriteInStatus) {
        item.append(makeElement("p", "candidate-note", interfaceCopy.writeInNotice));
      }
      const notePresentation = candidateNotePresentation(candidate, electionStage);
      if (notePresentation.resultText) {
        const result = makeElement("div", "candidate-result");
        if (candidate.primaryOutcome !== "No Primary Recorded") result.append(makeElement("p", "candidate-note", candidate.primaryOutcome));
        result.append(
          makeElement("p", "candidate-result-label", interfaceCopy.candidateResultLabel),
          makeElement("p", "candidate-result-value", notePresentation.resultText)
        );
        const resultDisclosure = makeElement("details", "candidate-primary-results");
        resultDisclosure.append(makeElement("summary", "candidate-primary-results-summary", interfaceCopy.primaryResultsSummary), result);
        item.append(resultDisclosure);
      }
      if (notePresentation.methodologyText) {
        item.append(makeElement("p", "candidate-methodology-note", notePresentation.methodologyText));
      }
      if (notePresentation.fallbackNote) {
        item.append(makeElement("p", "candidate-note", notePresentation.fallbackNote));
      }
      item.append(sources);

      item.dataset.candidateId = candidate.candidateId;
      item.dataset.electionStage = electionStage;
      item.dataset.affiliationIdentity = affiliationIdentity(candidate);

      item.dataset.searchText = [
        affiliation.textContent,
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
      const summaryMain = makeElement("h4", "office-summary-main");
      const title = makeElement("span", "office-title", office.office);
      summaryMain.id = `${office.officeId}-heading`;

      const currentCandidates = office.candidates.filter((candidate) => candidate.electionStageGroup === "current-general-election");
      const primaryHistory = office.candidates.filter((candidate) => candidate.electionStageGroup === "primary-history");
      if (office.jurisdiction && !office.office.toLowerCase().includes(office.jurisdiction.toLowerCase())) {
        summaryMain.append(makeElement("span", "office-summary-jurisdiction", office.jurisdiction));
      }
      const currentMeta = [
        office.officeMetadata.voteFor ? (office.officeMetadata.voteFor === 1 ? "Vote for 1" : `Vote for up to ${office.officeMetadata.voteFor}`) : null,
        `${currentCandidates.length} current ${currentCandidates.length === 1 ? "candidate" : "candidates"}`
      ].filter(Boolean).join(", ");
      const metadata = makeElement("span", "office-summary-metadata");
      metadata.append(makeElement("span", "office-summary-meta office-summary-meta--current", currentMeta));
      if (primaryHistory.length) {
        metadata.append(makeElement(
          "span",
          "office-summary-meta office-summary-meta--history",
          `${primaryHistory.length} primary history ${primaryHistory.length === 1 ? "entry" : "entries"}`
        ));
      }
      summaryMain.prepend(title);
      summaryMain.append(metadata);
      if (office.officeMetadata.partisanStatus === "Nonpartisan") {
        const ballotType = makeElement("span", "office-ballot-type");
        ballotType.append(
          makeElement("span", "nonpartisan-race-badge", interfaceCopy.nonpartisanRaceLabel),
          makeElement("span", "nonpartisan-race-explanation", interfaceCopy.nonpartisanRaceExplanation)
        );
        summaryMain.append(ballotType);
      }
      summary.append(summaryMain);

      const candidateContent = makeElement("div", "office-candidate-content");
      const currentSection = makeElement("div", "office-candidate-section");
      const currentContext = makeElement(
        "p",
        "candidate-section-context",
        `${interfaceCopy.officeVerificationPrefix} ${office.filingSnapshotDate}.${office.filingReviewedDate ? ` Last checked ${office.filingReviewedDate}.` : ""} ${office.candidateListNotice}`
      );
      currentSection.append(currentContext);
      if (office.ballotClarification) {
        currentSection.append(makeElement("p", "candidate-section-context", office.ballotClarification));
      }
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
        const historyHeading = makeElement("h5", "primary-history-heading", interfaceCopy.primaryHistoryHeading);
        historyHeading.id = `${office.officeId}-primary-history`;
        const historyCount = makeElement(
          "span",
          "primary-history-count",
          `${primaryHistory.length} ${primaryHistory.length === 1 ? "candidate" : "candidates"}`
        );
        const historyPrompt = makeElement(
          "span",
          "primary-history-prompt",
          interfaceCopy.primaryHistoryPrompt
        );
        historySummary.append(historyHeading, historyCount, historyPrompt);
        const historyContent = makeElement("div", "primary-history-content");
        historyContent.append(makeElement(
          "p",
          "primary-history-context",
          interfaceCopy.primaryHistoryContext
        ));
        const historyList = makeElement("ul", "candidate-list");
        historyList.setAttribute("aria-label", `${office.office} primary history`);
        primaryHistory.forEach((candidate) => historyList.append(makeCandidateCard(candidate, office, "primary-history")));
        historyContent.append(historyList);
        historySection.append(historySummary, historyContent);
        candidateContent.append(historySection);
      }

      disclosure.dataset.currentCandidateCount = String(currentCandidates.length);
      summaryMain.querySelectorAll(".office-summary-meta").forEach((meta) => { meta.dataset.completeMetadata = meta.textContent; });
      disclosure.dataset.officeIndex = String(index);
      disclosure.dataset.partisanStatus = office.officeMetadata.partisanStatus;
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
      const summaryText = makeElement("h3", "category-summary-text");
      const categoryId = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const title = makeElement("span", "category-title", category);
      summaryText.id = `${categoryId}-heading`;

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
        makeElement("span", "category-affordance-label category-affordance-label--closed", interfaceCopy.viewCandidates),
        makeElement("span", "category-affordance-label category-affordance-label--open", interfaceCopy.hideCandidates)
      );
      summaryUtility.append(count, affordance);
      summaryText.append(title, summaryUtility);
      summary.append(summaryText);

      const officeWrap = makeElement("div", "category-offices");
      offices.forEach((office, offset) => officeWrap.append(renderOffice(office, startIndex + offset)));

      disclosure.dataset.categoryText = category.toLowerCase();
      count.dataset.completeSummary = count.textContent;
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

      const candidateCount = new Set(electionData.flatMap((office) => office.candidates.filter((candidate) => candidate.electionStageGroup === "current-general-election").map((candidate) => candidate.candidateId))).size;
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
        status.classList.remove("visually-hidden");
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
      if (!renderOnly) {
        document.querySelector("#directory-search").disabled = false;
        setupDirectorySearch({ directory, status, electionData, interfaceCopy, affiliationGuide });
      }
    } catch (error) {
      showDirectoryError(error);
    }
}
