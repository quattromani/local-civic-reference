import { setupNavigation } from "./navigation.js?v=d9c1ed42a135";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=d9c1ed42a135";
import { loadPublicationData } from "./data-loader.js?v=d9c1ed42a135";
import { setupDirectoryLinks } from "./directory-links.js?v=d9c1ed42a135";
import { initializeDirectory } from "./render-directory.js?v=d9c1ed42a135";

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
