import { renderJudicialRetention } from "./judicial-retention.js";
import { setupNavigation } from "./navigation.js";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js";
import { loadPublicationData } from "./data-loader.js";
import { setupDirectoryLinks } from "./directory-links.js";
import { initializeDirectory } from "./render-directory.js";

setupNavigation();

async function initializeApplication() {
  const { content, directory } = await loadPublicationData();
  const siteConfig = {
    lastReviewed: content.election.lastReviewed,
    electionDay: content.election.dateDisplay,
    correctionEmail: content.guide.correctionEmail
  };

  renderJudicialRetention(directory.judicialRetention, content.judicialRetention);
  initializeDirectory({
    siteConfig,
    interfaceCopy: content.interfaceCopy,
    affiliationGuide: content.affiliationGuide,
    electionData: directory.offices,
    categorySummaryData: directory.categorySummaries
  });
  setupDirectoryLinks();
  setupPrintDisclosures();
}

initializeApplication().catch(showFatalApplicationError);
