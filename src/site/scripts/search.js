function makeElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

export function setupDirectorySearch({ directory, status, electionData, interfaceCopy }) {
      const input = document.querySelector("#directory-search");
      const clearButton = document.querySelector("#directory-search-clear");
      const typeahead = document.querySelector("#directory-typeahead");
      const suggestionList = document.querySelector("#directory-search-suggestions");
      if (!input || !clearButton || !typeahead || !suggestionList || !directory || !status) {
        throw new Error("The directory search controls are unavailable.");
      }
      clearButton.setAttribute("aria-label", interfaceCopy.clearSearchLabel);

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
          meta: `${office.category} · ${office.candidates.length} ${office.candidates.length === 1 ? "candidate" : "candidates"}`,
          primaryText: office.office.toLowerCase(),
          secondaryText: [office.jurisdiction, office.category, office.seat].filter(Boolean).join(" ").toLowerCase()
        };
        const candidateSuggestions = office.candidates.map((candidate, candidateIndex) => ({
          id: `candidate-${officeIndex}-${candidateIndex}`,
          type: "candidate",
          value: candidate.name,
          label: candidate.name,
          meta: `${office.office}${candidate.seat ? ` · ${candidate.seat}` : ""}`,
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

      function filterDirectory() {
        const query = input.value.trim().toLowerCase();
        clearButton.hidden = query.length === 0;

        if (!query) {
          restoreOpenState();
          status.textContent = "";
          return;
        }

        if (!openStateBeforeSearch) openStateBeforeSearch = captureOpenState();

        let visibleCategories = 0;
        let visibleOffices = 0;
        let visibleCandidates = 0;

        directory.querySelectorAll(".directory-category").forEach((category) => {
          const categoryMatches = category.dataset.categoryText.includes(query);
          let categoryHasResults = false;

          category.querySelectorAll(".office-disclosure").forEach((office) => {
            const officeMatches = office.dataset.officeText.includes(query);
            let matchingCandidates = 0;
            let matchingHistoricalCandidates = 0;

            office.querySelectorAll(".candidate-card").forEach((card) => {
              const candidateMatches = card.dataset.searchText.includes(query);
              const showCandidate = categoryMatches || officeMatches || candidateMatches;
              card.hidden = !showCandidate;
              if (showCandidate) matchingCandidates += 1;
              if (candidateMatches && card.dataset.electionStage === "primary-history") {
                matchingHistoricalCandidates += 1;
              }
            });

            office.querySelectorAll(".primary-history-disclosure").forEach((history) => {
              const hasVisibleCandidate = Array.from(history.querySelectorAll(".candidate-card"))
                .some((card) => !card.hidden);
              history.hidden = !hasVisibleCandidate;
              history.open = matchingHistoricalCandidates > 0;
            });

            const showOffice = categoryMatches || officeMatches || matchingCandidates > 0;
            office.hidden = !showOffice;
            office.open = showOffice && !categoryMatches && (officeMatches || matchingCandidates > 0);

            if (showOffice) {
              categoryHasResults = true;
              visibleOffices += 1;
              visibleCandidates += matchingCandidates;
            }
          });

          category.hidden = !categoryHasResults;
          category.open = categoryHasResults;
          if (categoryHasResults) visibleCategories += 1;
        });

        if (visibleOffices === 0) {
          status.textContent = `No matches for “${input.value.trim()}”.`;
        } else {
          status.textContent = `${visibleCandidates} ${visibleCandidates === 1 ? "candidate" : "candidates"} · ${visibleOffices} ${visibleOffices === 1 ? "office" : "offices"} · ${visibleCategories} ${visibleCategories === 1 ? "category" : "categories"}`;
        }
      }

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
