import { renderJudicialRetention } from "./judicial-retention.js?v=963becb4056b";
import { setupNavigation } from "./navigation.js?v=963becb4056b";
import { setupPrintDisclosures, showFatalApplicationError } from "./accessibility.js?v=963becb4056b";
import { loadPublicationData } from "./data-loader.js?v=963becb4056b";
import { setupDirectoryLinks } from "./directory-links.js?v=963becb4056b";
import { initializeDirectory } from "./render-directory.js?v=963becb4056b";

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
