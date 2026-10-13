import { setupNavigation } from "./navigation.js?v=b8a820611613";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=b8a820611613";
import { loadPublicationData } from "./data-loader.js?v=b8a820611613";
import { setupDirectoryLinks } from "./directory-links.js?v=b8a820611613";
import { initializeDirectory } from "./render-directory.js?v=b8a820611613";

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
