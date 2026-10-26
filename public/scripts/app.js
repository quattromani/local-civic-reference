import { renderJudicialRetention } from "./judicial-retention.js?v=e66145a52803";
import { setupNavigation } from "./navigation.js?v=e66145a52803";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=e66145a52803";
import { loadPublicationData } from "./data-loader.js?v=e66145a52803";
import { setupDirectoryLinks } from "./directory-links.js?v=e66145a52803";
import { initializeDirectory } from "./render-directory.js?v=e66145a52803";

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
