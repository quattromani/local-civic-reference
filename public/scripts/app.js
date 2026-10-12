import { setupNavigation } from "./navigation.js?v=7effb230c395";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=7effb230c395";
import { loadPublicationData } from "./data-loader.js?v=7effb230c395";
import { setupDirectoryLinks } from "./directory-links.js?v=7effb230c395";
import { initializeDirectory } from "./render-directory.js?v=7effb230c395";

setupNavigation();

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
