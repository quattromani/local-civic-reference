import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=6ce67c045de6";
import { loadPublicationData } from "./data-loader.js?v=6ce67c045de6";
import { setupDirectoryLinks } from "./directory-links.js?v=6ce67c045de6";
import { initializeDirectory } from "./render-directory.js?v=6ce67c045de6";

async function initializeApplication() {
  const { content, directory } = await loadPublicationData();
  const siteConfig = {
    lastReviewed: content.election.lastReviewed,
    electionDay: content.election.dateDisplay,
    correctionEmail: content.guide.correctionEmail
  };

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
