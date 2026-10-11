import { matchesAffiliation, setupAffiliationGuide } from "./affiliation-guide.js?v=6ce67c045de6";

function makeElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

export function setupDirectorySearch({ directory, status, electionData, interfaceCopy, affiliationGuide }) {
      const input = document.querySelector("#directory-search");
      const clearButton = document.querySelector("#directory-search-clear");
      const typeahead = document.querySelector("#directory-typeahead");
      const suggestionList = document.querySelector("#directory-search-suggestions");
      if (!input || !clearButton || !typeahead || !suggestionList || !directory || !status) {
        throw new Error("The directory search controls are unavailable.");
      }
      clearButton.setAttribute("aria-label", interfaceCopy.clearSearchLabel);

      let nonpartisanOnly = false;
      const raceFilter = document.querySelector("#nonpartisan-race-filter");
      let selectedAffiliation = null;
      let selectedAffiliationLabel = "";
      let openStateBeforeSearch = null;
      let suggestions = [];
      let activeSuggestionIndex = -1;

      /*
        Typeahead index
        ----------------
        Office suggestions match office, jurisdiction, category, and seat.
        Candidate suggestions match the candidate's own name and seat only,
        preventing a city search from returning every candidate in that city.
      */
      const suggestionIndex = electionData.flatMap((office, officeIndex) => {
        const officeSuggestion = {
          id: `office-${officeIndex}`,
          type: "office",
          value: office.office,
          label: office.office,
          meta: `${office.category}, ${office.candidates.length} candidate ${office.candidates.length === 1 ? "entry" : "entries"}`,
          primaryText: office.office.toLowerCase(),
          secondaryText: [office.jurisdiction, office.category, office.seat].filter(Boolean).join(" ").toLowerCase()
        };
        const candidateSuggestions = office.candidates.map((candidate, candidateIndex) => ({
          id: `candidate-${officeIndex}-${candidateIndex}`,
          type: "candidate",
          value: candidate.name,
          label: candidate.name,
          meta: `${office.office}${candidate.seat ? `, ${candidate.seat}` : ""}`,
          primaryText: candidate.name.toLowerCase(),
          secondaryText: (candidate.seat || "").toLowerCase()
        }));
        return [officeSuggestion, ...candidateSuggestions];
      });

      function matchScore(item, query) {
        if (item.primaryText.startsWith(query)) return 0;
        if (item.primaryText.split(/\s+/).some((word) => word.startsWith(query))) return 1;
        if (item.secondaryText.startsWith(query)) return 2;
        if (item.secondaryText.split(/\s+/).some((word) => word.startsWith(query))) return 3;
        if (item.primaryText.includes(query)) return 4;
        if (item.secondaryText.includes(query)) return 5;
        return Number.POSITIVE_INFINITY;
      }

      function closeSuggestions() {
        suggestions = [];
        activeSuggestionIndex = -1;
        suggestionList.hidden = true;
        suggestionList.replaceChildren();
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
      }

      function setActiveSuggestion(index) {
        if (!suggestions.length) return;
        activeSuggestionIndex = (index + suggestions.length) % suggestions.length;
        suggestionList.querySelectorAll("[role='option']").forEach((option, optionIndex) => {
          option.setAttribute("aria-selected", String(optionIndex === activeSuggestionIndex));
        });
        const activeOption = suggestionList.children[activeSuggestionIndex];
        input.setAttribute("aria-activedescendant", activeOption.id);
        activeOption.scrollIntoView({ block: "nearest" });
      }

      function selectSuggestion(index) {
        const suggestion = suggestions[index];
        if (!suggestion) return;
        input.value = suggestion.value;
        closeSuggestions();
        filterDirectory();
        input.focus();
      }

      function updateSuggestions() {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          closeSuggestions();
          return;
        }

        suggestions = suggestionIndex
          .map((item) => ({ item, score: matchScore(item, query) }))
          .filter(({ score }) => Number.isFinite(score))
          .sort((a, b) => a.score - b.score
            || (a.item.type === b.item.type ? 0 : a.item.type === "office" ? -1 : 1)
            || a.item.label.localeCompare(b.item.label, undefined, { sensitivity: "base" }))
          .slice(0, 8)
          .map(({ item }) => item);

        if (!suggestions.length) {
          closeSuggestions();
          return;
        }

        const fragment = document.createDocumentFragment();
        suggestions.forEach((suggestion, index) => {
          const option = makeElement("button", "typeahead-option");
          option.type = "button";
          option.tabIndex = -1;
          option.id = `directory-suggestion-${suggestion.id}`;
          option.setAttribute("role", "option");
          option.setAttribute("aria-selected", "false");
          option.append(
            makeElement("span", "typeahead-option-label", suggestion.label),
            makeElement("span", "typeahead-option-meta", suggestion.meta)
          );
          option.addEventListener("pointerdown", (event) => event.preventDefault());
          option.addEventListener("click", () => selectSuggestion(index));
          fragment.append(option);
        });

        activeSuggestionIndex = -1;
        suggestionList.replaceChildren(fragment);
        suggestionList.hidden = false;
        input.setAttribute("aria-expanded", "true");
        input.removeAttribute("aria-activedescendant");
      }

      function captureOpenState() {
        return Array.from(directory.querySelectorAll("details")).map((item) => item.open);
      }

      function restoreOpenState() {
        const disclosures = Array.from(directory.querySelectorAll("details"));
        const savedOpenState = openStateBeforeSearch;
        disclosures.forEach((item, index) => {
          item.hidden = false;
          if (savedOpenState) item.open = savedOpenState[index];
        });
        directory.querySelectorAll(".candidate-card").forEach((card) => { card.hidden = false; });
        openStateBeforeSearch = null;
      }

      const completeCurrentCandidates = new Set(electionData.flatMap((office) => office.candidates
        .filter((candidate) => candidate.electionStageGroup === "current-general-election")
        .map((candidate) => candidate.candidateId)));
      const completeCategoryCount = new Set(electionData.map((office) => office.category)).size;
      function updateSummary(offices, currentCandidates, categories) {
        document.querySelector("[data-directory-office-count]").textContent = String(offices);
        document.querySelector("[data-directory-candidate-count]").textContent = String(currentCandidates);
        document.querySelector("[data-directory-category-count]").textContent = String(categories);
      }

      const activeFilters = document.querySelector("#active-filters");
      const filterList = document.querySelector("#active-filter-list");
      function updateFilterState() {
        filterList.replaceChildren();
        const choices = [];
        if (input.value.trim()) choices.push([interfaceCopy.searchFilterLabel.replace("{query}", input.value.trim()), () => {
          input.value = ""; closeSuggestions(); filterDirectory();
        }]);
        if (selectedAffiliation) choices.push([selectedAffiliationLabel, () => document.querySelector("#affiliation-guide-reset").click()]);
        if (nonpartisanOnly) choices.push([interfaceCopy.showNonpartisanRaces, () => raceFilter.click()]);
        for (const [label, remove] of choices) {
          const button = makeElement("button", "active-filter-chip", `${label} ×`);
          button.type = "button";
          button.setAttribute("aria-label", interfaceCopy.removeFilter.replace("{label}", label));
          button.addEventListener("click", () => { remove(); input.focus(); });
          filterList.append(button);
        }
        activeFilters.hidden = !choices.length;
      }
      document.querySelector("#clear-all-filters").addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("directory:navigate")); input.focus();
      });

      function filterDirectory() {
        const query = input.value.trim().toLowerCase();
        clearButton.hidden = query.length === 0;
        updateFilterState();

        if (!query && !selectedAffiliation && !nonpartisanOnly) {
          restoreOpenState();
          directory.querySelectorAll(".office-summary-meta").forEach((meta) => { meta.textContent = meta.dataset.completeMetadata; meta.hidden = false; });
          directory.querySelectorAll(".category-count").forEach((count) => { count.textContent = count.dataset.completeSummary; });
          updateSummary(electionData.length, completeCurrentCandidates.size, completeCategoryCount);
          status.textContent = "";
          status.classList.remove("visually-hidden");
          return;
        }

        if (!openStateBeforeSearch) openStateBeforeSearch = captureOpenState();

        let visibleCategories = 0;
        let visibleOffices = 0;
        let visibleCandidates = 0;
        let visibleHistoryEntries = 0;
        const visibleCurrentCandidates = new Set();

        directory.querySelectorAll(".directory-category").forEach((category) => {
          const categoryMatches = category.dataset.categoryText.includes(query);
          let categoryHasResults = false;
          let categoryOfficeCount = 0;
          const categoryCurrentCandidates = new Set();

          category.querySelectorAll(".office-disclosure").forEach((office) => {
            const officeMatches = office.dataset.officeText.includes(query);
            const raceMatches = !nonpartisanOnly || office.dataset.partisanStatus === "Nonpartisan";
            const officeCurrentCandidates = new Set();
            let visibleOfficeHistory = 0;
            let matchingCandidates = 0;
            let matchingHistoricalCandidates = 0;

            office.querySelectorAll(".candidate-card").forEach((card) => {
              const candidateMatches = card.dataset.searchText.includes(query);
              const affiliationMatches = matchesAffiliation(card.dataset.affiliationIdentity, selectedAffiliation);
              const showCandidate = raceMatches && affiliationMatches && (!query || categoryMatches || officeMatches || candidateMatches);
              card.hidden = !showCandidate;
              if (showCandidate) {
                matchingCandidates += 1;
                if (card.dataset.electionStage === "current-general-election") { visibleCurrentCandidates.add(card.dataset.candidateId); categoryCurrentCandidates.add(card.dataset.candidateId); officeCurrentCandidates.add(card.dataset.candidateId); }
                else if (card.dataset.electionStage === "primary-history") { visibleHistoryEntries += 1; visibleOfficeHistory += 1; }
              }
              if (showCandidate && (candidateMatches || selectedAffiliation) && card.dataset.electionStage === "primary-history") {
                matchingHistoricalCandidates += 1;
              }
            });

            office.querySelectorAll(".primary-history-disclosure").forEach((history) => {
              const hasVisibleCandidate = Array.from(history.querySelectorAll(".candidate-card"))
                .some((card) => !card.hidden);
              history.hidden = !hasVisibleCandidate;
              history.open = matchingHistoricalCandidates > 0;
            });

            const currentMeta = office.querySelector(".office-summary-meta--current");
            currentMeta.textContent = currentMeta.dataset.completeMetadata.replace(/\d+ current candidates?$/, `${officeCurrentCandidates.size} of ${office.dataset.currentCandidateCount} current candidate${Number(office.dataset.currentCandidateCount) === 1 ? "" : "s"}`);
            const historyMeta = office.querySelector(".office-summary-meta--history");
            if (historyMeta) {
              historyMeta.hidden = !visibleOfficeHistory;
              historyMeta.textContent = `${visibleOfficeHistory} matching primary history ${visibleOfficeHistory === 1 ? "entry" : "entries"}`;
            }
            const showOffice = raceMatches && (selectedAffiliation ? matchingCandidates > 0 : categoryMatches || officeMatches || matchingCandidates > 0);
            office.hidden = !showOffice;
            office.open = showOffice && (Boolean(selectedAffiliation) || (!categoryMatches && (officeMatches || matchingCandidates > 0)));

            if (showOffice) {
              categoryHasResults = true;
              categoryOfficeCount += 1;
              visibleOffices += 1;
              visibleCandidates += matchingCandidates;
            }
          });

          const officeUnit = interfaceCopy.matchingOfficeUnit + (categoryOfficeCount === 1 ? "" : "s");
          const candidateUnit = interfaceCopy.currentCandidateUnit + (categoryCurrentCandidates.size === 1 ? "" : "s");
          category.querySelector(".category-count").textContent = `${categoryOfficeCount} ${officeUnit}, ${categoryCurrentCandidates.size} ${candidateUnit}`;
          category.hidden = !categoryHasResults;
          category.open = categoryHasResults;
          if (categoryHasResults) visibleCategories += 1;
        });

        updateSummary(visibleOffices, visibleCurrentCandidates.size, visibleCategories);
        status.classList.toggle("visually-hidden", visibleOffices > 0);
        if (visibleOffices === 0) {
          status.textContent = selectedAffiliation || nonpartisanOnly ? interfaceCopy.emptyAffiliationResults : interfaceCopy.noMatches.replace("{query}", input.value.trim());
        } else {
          status.textContent = `${visibleCandidates} candidate ${visibleCandidates === 1 ? "entry" : "entries"}, ${visibleOffices} ${visibleOffices === 1 ? "office" : "offices"}, ${visibleCategories} ${visibleCategories === 1 ? "category" : "categories"}`;
        }
        if (visibleHistoryEntries) status.textContent += " " + interfaceCopy.filteredHistoryNotice
          .replace("{count}", String(visibleHistoryEntries)).replace("{unit}", visibleHistoryEntries === 1 ? "entry" : "entries");
        if (nonpartisanOnly) status.textContent += " " + interfaceCopy.nonpartisanRaceFilterStatus;
        if (selectedAffiliation) {
          status.textContent += " " + interfaceCopy.affiliationFilterStatus.replace("{label}", selectedAffiliationLabel);
        }
      }

      setupAffiliationGuide({ electionData, guide: affiliationGuide, interfaceCopy, onSelect(identity, label) {
        selectedAffiliation = identity;
        selectedAffiliationLabel = label;
        closeSuggestions();
        filterDirectory();
      } });

      raceFilter.addEventListener("click", () => {
        nonpartisanOnly = !nonpartisanOnly;
        raceFilter.setAttribute("aria-pressed", String(nonpartisanOnly));
        closeSuggestions();
        filterDirectory();
      });

      document.addEventListener("directory:navigate", () => {
        nonpartisanOnly = false;
        raceFilter.setAttribute("aria-pressed", "false");
        input.value = "";
        closeSuggestions();
        const reset = document.querySelector("#affiliation-guide-reset");
        if (!reset.disabled) reset.click();
        else filterDirectory();
      });

      input.addEventListener("input", () => {
        filterDirectory();
        updateSuggestions();
      });
      input.addEventListener("search", () => {
        filterDirectory();
        updateSuggestions();
      });
      input.addEventListener("focus", updateSuggestions);
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          if (suggestionList.hidden) updateSuggestions();
          if (suggestions.length) {
            event.preventDefault();
            setActiveSuggestion(activeSuggestionIndex + 1);
          }
        } else if (event.key === "ArrowUp" && suggestions.length) {
          event.preventDefault();
          setActiveSuggestion(activeSuggestionIndex - 1);
        } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
          event.preventDefault();
          selectSuggestion(activeSuggestionIndex);
        } else if (event.key === "Escape" && !suggestionList.hidden) {
          event.preventDefault();
          closeSuggestions();
        } else if (event.key === "Tab") {
          closeSuggestions();
        }
      });
      input.addEventListener("blur", () => window.setTimeout(closeSuggestions, 100));
      document.addEventListener("pointerdown", (event) => {
        if (!typeahead.contains(event.target)) closeSuggestions();
      });
      clearButton.addEventListener("click", () => {
        input.value = "";
        closeSuggestions();
        filterDirectory();
        input.focus();
      });
    }
