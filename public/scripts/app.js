import { renderJudicialRetention } from "./judicial-retention.js?v=85d890ea7bad";
import { setupNavigation } from "./navigation.js?v=85d890ea7bad";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=85d890ea7bad";
import { loadPublicationData } from "./data-loader.js?v=85d890ea7bad";
import { setupDirectoryLinks } from "./directory-links.js?v=85d890ea7bad";
import { initializeDirectory } from "./render-directory.js?v=85d890ea7bad";

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
